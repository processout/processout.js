module ProcessOut {
  // Transaction statuses after which the payment can't change any more from the shopper's point of view.
  const SUCCESSFUL_TRANSACTION_STATUSES = ["authorized", "pending-capture", "completed"]
  const FAILED_TRANSACTION_STATUSES = ["failed", "voided", "blocked"]

  // The interval starts at 3 s and grows by 1.5x after each check, up to 30 s, so a shopper who keeps the
  // DC tab open doesn't poll every 3 s for 15 minutes. Coming back to the tab checks at once and starts again at 3 s.
  export const TRANSACTION_POLLING_INTERVAL_MS = 3000
  export const TRANSACTION_POLLING_MAX_INTERVAL_MS = 30 * 1000
  export const TRANSACTION_POLLING_BACKOFF_FACTOR = 1.5
  // Same as the APM v2 default timeout.
  export const TRANSACTION_POLLING_TIMEOUT_MS = 15 * 60 * 1000
  // apiRequest has no XHR timeout: a request that never answers counts as an error after this, so polling goes on.
  export const TRANSACTION_POLLING_REQUEST_TIMEOUT_MS = 30 * 1000

  export type PolledTransaction = {
    status: string
    authorized?: boolean
    captured?: boolean
  }

  export type DynamicCheckoutTransactionPollerOptions = {
    processOutInstance: ProcessOut
    invoiceId: string
    clientSecret?: string
    onSuccess: (transaction: PolledTransaction) => void
    onFailure: (transaction: PolledTransaction) => void
    onTimeout: () => void
    // Polling stops silently once this returns false, e.g. when the merchant removes the widget.
    isMounted: () => boolean
    // First interval; it grows by TRANSACTION_POLLING_BACKOFF_FACTOR up to maxIntervalMs.
    intervalMs?: number
    maxIntervalMs?: number
    timeoutMs?: number
    requestTimeoutMs?: number
    now?: () => number
    win?: Window
    doc?: Document
  }

  /**
   * Polls our invoice API until the transaction reaches a final status or the timeout.
   * It never calls the PSP: the backend keeps the transaction in sync (webhook, token apply, reconcile).
   */
  export class DynamicCheckoutTransactionPoller {
    private options: DynamicCheckoutTransactionPollerOptions
    private startedAt = 0
    private timer: number | null = null
    private requestTimer: number | null = null
    private requestInFlight = false
    private requestCount = 0
    private delayMs = 0
    private finished = false

    constructor(options: DynamicCheckoutTransactionPollerOptions) {
      this.options = options
      this.onPageActive = this.onPageActive.bind(this)
    }

    public start() {
      this.startedAt = this.now()
      this.delayMs = this.getInitialIntervalMs()
      this.getWindow().addEventListener("focus", this.onPageActive)
      this.getDocument().addEventListener("visibilitychange", this.onPageActive)
      this.check()
    }

    // Stops without calling any callback, e.g. when another result (postMessage, Cancel) won.
    public stop() {
      this.finished = true
      this.clearTimer()
      this.clearRequestTimer()
      this.getWindow().removeEventListener("focus", this.onPageActive)
      this.getDocument().removeEventListener("visibilitychange", this.onPageActive)
    }

    public isFinished() {
      return this.finished
    }

    static isSuccessfulStatus(status: string) {
      return SUCCESSFUL_TRANSACTION_STATUSES.indexOf(status) !== -1
    }

    static isFailedStatus(status: string) {
      return FAILED_TRANSACTION_STATUSES.indexOf(status) !== -1
    }

    private onPageActive() {
      if (this.isPageVisible()) {
        this.delayMs = this.getInitialIntervalMs()
        this.check()
      }
    }

    private check() {
      if (this.finished || this.requestInFlight) {
        return
      }
      if (!this.options.isMounted()) {
        this.stop()
        return
      }
      if (this.now() - this.startedAt >= this.getTimeoutMs()) {
        this.stop()
        this.options.onTimeout()
        return
      }
      if (!this.isPageVisible()) {
        this.scheduleNext()
        return
      }

      this.clearTimer()
      this.requestInFlight = true
      const request = ++this.requestCount
      const remainingMs = this.getTimeoutMs() - (this.now() - this.startedAt)
      this.requestTimer = this.getWindow().setTimeout(
        () => this.finishRequest(request, null),
        Math.min(this.getRequestTimeoutMs(), remainingMs),
      )
      this.options.processOutInstance.apiRequest(
        "GET",
        `invoices/${this.options.invoiceId}?expand=transaction`,
        {},
        data =>
          this.finishRequest(request, {
            transaction: data && data.invoice ? data.invoice.transaction : null,
          }),
        () => this.finishRequest(request, null),
        0,
        {
          isLegacy: false,
          clientSecret: this.options.clientSecret,
        },
      )
    }

    // response is null for a request error or timeout. A response after the request timed out is ignored.
    private finishRequest(
      request: number,
      response: { transaction: PolledTransaction | null } | null,
    ) {
      if (request !== this.requestCount || !this.requestInFlight) {
        return
      }
      this.requestInFlight = false
      this.clearRequestTimer()

      if (response) {
        this.handleTransaction(response.transaction)
        return
      }
      this.scheduleNext()
      this.growDelay()
    }

    private handleTransaction(transaction: PolledTransaction | null) {
      if (this.finished) {
        return
      }
      if (!this.options.isMounted()) {
        this.stop()
        return
      }

      const status = transaction ? transaction.status : ""
      if (DynamicCheckoutTransactionPoller.isSuccessfulStatus(status)) {
        this.stop()
        this.options.onSuccess(transaction)
        return
      }
      if (DynamicCheckoutTransactionPoller.isFailedStatus(status)) {
        this.stop()
        this.options.onFailure(transaction)
        return
      }

      this.scheduleNext()
      this.growDelay()
    }

    // Never waits past the timeout, so onTimeout fires on time even with a long interval.
    private scheduleNext() {
      if (this.finished) {
        return
      }
      this.clearTimer()
      const remainingMs = this.getTimeoutMs() - (this.now() - this.startedAt)
      this.timer = this.getWindow().setTimeout(
        () => {
          this.timer = null
          this.check()
        },
        Math.max(0, Math.min(this.delayMs, remainingMs)),
      )
    }

    private growDelay() {
      this.delayMs = Math.min(
        this.delayMs * TRANSACTION_POLLING_BACKOFF_FACTOR,
        this.options.maxIntervalMs || TRANSACTION_POLLING_MAX_INTERVAL_MS,
      )
    }

    private getInitialIntervalMs() {
      return this.options.intervalMs || TRANSACTION_POLLING_INTERVAL_MS
    }

    private clearTimer() {
      if (this.timer !== null) {
        this.getWindow().clearTimeout(this.timer)
        this.timer = null
      }
    }

    private clearRequestTimer() {
      if (this.requestTimer !== null) {
        this.getWindow().clearTimeout(this.requestTimer)
        this.requestTimer = null
      }
    }

    private isPageVisible() {
      return this.getDocument().visibilityState === "visible"
    }

    private getTimeoutMs() {
      return this.options.timeoutMs || TRANSACTION_POLLING_TIMEOUT_MS
    }

    private getRequestTimeoutMs() {
      return this.options.requestTimeoutMs || TRANSACTION_POLLING_REQUEST_TIMEOUT_MS
    }

    private now() {
      return this.options.now ? this.options.now() : Date.now()
    }

    private getWindow(): Window {
      return this.options.win || window
    }

    private getDocument(): Document {
      return this.options.doc || document
    }
  }
}
