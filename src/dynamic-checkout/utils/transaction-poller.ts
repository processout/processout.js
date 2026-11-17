module ProcessOut {
  // Transaction statuses after which the payment can't change any more from the shopper's point of view.
  const SUCCESSFUL_TRANSACTION_STATUSES = ["authorized", "pending-capture", "completed"]
  const FAILED_TRANSACTION_STATUSES = ["failed", "voided", "blocked"]

  export const TRANSACTION_POLLING_INTERVAL_MS = 3000
  // Same as the APM v2 default timeout.
  export const TRANSACTION_POLLING_TIMEOUT_MS = 15 * 60 * 1000

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
    intervalMs?: number
    timeoutMs?: number
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
    private requestInFlight = false
    private finished = false

    constructor(options: DynamicCheckoutTransactionPollerOptions) {
      this.options = options
      this.onPageActive = this.onPageActive.bind(this)
    }

    public start() {
      this.startedAt = this.now()
      this.getWindow().addEventListener("focus", this.onPageActive)
      this.getDocument().addEventListener("visibilitychange", this.onPageActive)
      this.check()
    }

    // Stops without calling any callback, e.g. when another result (postMessage, Cancel) won.
    public stop() {
      this.finished = true
      this.clearTimer()
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
      this.options.processOutInstance.apiRequest(
        "GET",
        `invoices/${this.options.invoiceId}?expand=transaction`,
        {},
        data => {
          this.requestInFlight = false
          this.handleTransaction(data && data.invoice ? data.invoice.transaction : null)
        },
        () => {
          this.requestInFlight = false
          this.scheduleNext()
        },
        0,
        {
          isLegacy: false,
          clientSecret: this.options.clientSecret,
        },
      )
    }

    private handleTransaction(transaction: PolledTransaction | null) {
      if (this.finished) {
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
    }

    private scheduleNext() {
      if (this.finished) {
        return
      }
      this.clearTimer()
      this.timer = this.getWindow().setTimeout(() => {
        this.timer = null
        this.check()
      }, this.options.intervalMs || TRANSACTION_POLLING_INTERVAL_MS)
    }

    private clearTimer() {
      if (this.timer !== null) {
        this.getWindow().clearTimeout(this.timer)
        this.timer = null
      }
    }

    private isPageVisible() {
      return this.getDocument().visibilityState === "visible"
    }

    private getTimeoutMs() {
      return this.options.timeoutMs || TRANSACTION_POLLING_TIMEOUT_MS
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
