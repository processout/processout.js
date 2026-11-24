module ProcessOut {
  export const OPENER_LOSS_PENDING_REASON = "opener_isolated"

  export type DynamicCheckoutOpenerLossFlowOptions = {
    processOutInstance: ProcessOut
    paymentConfig: DynamicCheckoutPaymentConfig
    resetContainerHtml: () => HTMLElement
    gatewayName: string
    paymentMethodDisplayName: string
    customerTokenId?: string
  }

  /**
   * Waits for the outcome of a payment whose PSP tab lost its link to the checkout. DC shows the
   * awaiting-confirmation view and polls the transaction; it emits no event until the outcome is known,
   * because the HPP (and likely merchants) treat payment_pending as final.
   */
  export class DynamicCheckoutOpenerLossFlow {
    private options: DynamicCheckoutOpenerLossFlowOptions
    private poller: DynamicCheckoutTransactionPoller | null = null
    private view: Element | null = null
    private closeCheckPending = false
    private closeCheckReported = false

    constructor(options: DynamicCheckoutOpenerLossFlowOptions) {
      this.options = options
    }

    public start() {
      const { processOutInstance, paymentConfig } = this.options

      this.view = new DynamicCheckoutPaymentAwaitingConfirmationView(
        processOutInstance,
        paymentConfig,
        () => this.cancel(),
      ).element
      this.options.resetContainerHtml().appendChild(this.view)

      this.poller = new DynamicCheckoutTransactionPoller({
        processOutInstance,
        invoiceId: paymentConfig.invoiceId,
        clientSecret: paymentConfig.clientSecret,
        onSuccess: transaction => this.showSuccess(transaction),
        onFailure: transaction => this.showFailure(transaction),
        onTimeout: () => this.showTimeout(),
        isMounted: () => !!this.view && document.body.contains(this.view),
      })
      this.poller.start()
    }

    /**
     * After a real tab close: checks the transaction once instead of reporting "payment cancelled" right away.
     * Success → the same views and event as polling; anything else, or a request error → "payment cancelled".
     */
    public confirmClose() {
      const { processOutInstance, paymentConfig } = this.options

      this.view = new DynamicCheckoutInvoiceLoadingView(paymentConfig.locale).element
      this.options.resetContainerHtml().appendChild(this.view)
      this.closeCheckPending = true

      processOutInstance.apiRequest(
        "GET",
        `invoices/${paymentConfig.invoiceId}?expand=transaction`,
        {},
        data => this.finishCloseCheck(data && data.invoice ? data.invoice.transaction : null),
        () => this.finishCloseCheck(null),
        0,
        {
          isLegacy: false,
          clientSecret: paymentConfig.clientSecret,
        },
      )
    }

    /**
     * Called when the normal flow returns a result after all (e.g. a postMessage that got through).
     * Returns true when this flow already reported an outcome, so the caller must ignore its result.
     */
    public takeOver(): boolean {
      if (this.closeCheckPending) {
        this.closeCheckPending = false
        return false
      }
      if (!this.poller) {
        return this.closeCheckReported
      }
      const alreadyResolved = this.poller.isFinished()
      this.poller.stop()
      return alreadyResolved
    }

    private finishCloseCheck(transaction: PolledTransaction | null) {
      if (!this.closeCheckPending) {
        return
      }
      this.closeCheckPending = false
      if (!this.view || !document.body.contains(this.view)) {
        return
      }

      this.closeCheckReported = true
      if (transaction && DynamicCheckoutTransactionPoller.isSuccessfulStatus(transaction.status)) {
        this.showSuccess(transaction)
      } else {
        this.showCancelled()
      }
    }

    private cancel() {
      this.poller.stop()
      this.showCancelled()
    }

    private showCancelled() {
      this.options
        .resetContainerHtml()
        .appendChild(
          new DynamicCheckoutPaymentCancelledView(
            this.options.processOutInstance,
            this.options.paymentConfig,
          ).element,
        )

      DynamicCheckoutEventsUtils.dispatchPaymentCancelledEvent({
        ...this.getEventBase(),
        tab_closed: true,
      })
    }

    private showSuccess(transaction: PolledTransaction) {
      const { processOutInstance, paymentConfig } = this.options

      if (paymentConfig.showStatusMessage) {
        this.options
          .resetContainerHtml()
          .appendChild(
            new DynamicCheckoutPaymentSuccessView(processOutInstance, paymentConfig).element,
          )
      } else if (!paymentConfig.invoiceDetails.return_url) {
        this.options
          .resetContainerHtml()
          .appendChild(
            new DynamicCheckoutPaymentInfoView(processOutInstance, paymentConfig).element,
          )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
        ...this.getEventBase(),
        customer_token_id: this.options.customerTokenId,
        ...DynamicCheckoutEventsUtils.getPaymentStatusEventDetail(transaction),
      })
    }

    private showFailure(transaction: PolledTransaction) {
      const { processOutInstance, paymentConfig } = this.options

      this.options
        .resetContainerHtml()
        .appendChild(new DynamicCheckoutPaymentErrorView(processOutInstance, paymentConfig).element)

      DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
        paymentConfig.invoiceId,
        {
          code: "gateway.declined",
          message: "The payment was not completed.",
          transaction_status: transaction.status,
        },
        this.options.gatewayName,
        undefined,
        paymentConfig.invoiceDetails.return_url || null,
        this.options.customerTokenId,
        this.options.paymentMethodDisplayName,
      )
    }

    private showTimeout() {
      this.options
        .resetContainerHtml()
        .appendChild(
          new DynamicCheckoutPaymentPendingView(
            this.options.processOutInstance,
            this.options.paymentConfig,
          ).element,
        )

      DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
        ...this.getEventBase(),
        customer_token_id: this.options.customerTokenId,
        reason: OPENER_LOSS_PENDING_REASON,
        timeout: true,
      })
    }

    private getEventBase() {
      const { paymentConfig } = this.options

      return {
        payment_method_name: this.options.gatewayName,
        payment_method_display_name: this.options.paymentMethodDisplayName,
        invoice_id: paymentConfig.invoiceId,
        return_url: paymentConfig.invoiceDetails.return_url || null,
      }
    }
  }
}
