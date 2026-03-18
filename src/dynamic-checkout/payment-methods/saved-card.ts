/// <reference path="../references.ts" />

module ProcessOut {
  export class SavedCardPaymentMethod extends SavedPaymentMethodButton {
    protected processOutInstance: ProcessOut
    private paymentConfig: DynamicCheckoutPaymentConfig
    private paymentMethod: PaymentMethod
    private resetContainerHtml: () => HTMLElement

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfig,
      theme: DynamicCheckoutThemeType,
      resetContainerHtml: () => HTMLElement,
      deleteMode?: boolean,
      handleDeletePaymentMethod?: () => void,
    ) {
      super(
        processOutInstance,
        paymentMethod.display.name,
        paymentMethod.display.logo.dark_url.vector,
        paymentMethod.card_customer_token.customer_token_id,
        paymentMethod.display.description,
        deleteMode,
        paymentMethod.card_customer_token.deleting_allowed,
        handleDeletePaymentMethod,
        paymentConfig.locale,
      )

      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.paymentMethod = paymentMethod
      this.resetContainerHtml = resetContainerHtml

      if (!deleteMode) {
        this.element.addEventListener("click", this.handlePayment.bind(this))
      }
    }

    private handlePayment() {
      this.setLoading(this.paymentConfig.locale)

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: "card",
        invoice_id: this.paymentConfig.invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
        customer_token_id: this.paymentMethod.card_customer_token.customer_token_id,
      })

      this.processOutInstance.makeCardPayment(
        this.paymentConfig.invoiceId,
        this.paymentMethod.card_customer_token.customer_token_id,
        {
          authorize_only: !this.paymentConfig.capturePayments,
          allow_fallback_to_sale: this.paymentConfig.allowFallbackToSale,
        },
        this.handlePaymentSuccess.bind(this),
        this.handlePaymentError.bind(this),
        undefined,
        this.handlePaymentPending.bind(this),
      )
    }

    private handlePaymentSuccess(invoiceId: string) {
      if (this.paymentConfig.showStatusMessage) {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
            .element,
        )
      } else if (
        !this.paymentConfig.showStatusMessage &&
        !this.paymentConfig.invoiceDetails.return_url
      ) {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
        )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
        invoice_id: invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
        payment_method_name: "card",
      })
    }

    private handlePaymentPending(invoiceId: string) {
      if (this.paymentConfig.showStatusMessage) {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentPendingView(this.processOutInstance, this.paymentConfig)
            .element,
        )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
        payment_method_name: "card",
        invoice_id: invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
      })
    }

    private handlePaymentError(error) {
      if (this.paymentConfig.showStatusMessage) {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig).element,
        )
      } else if (
        !this.paymentConfig.showStatusMessage &&
        !this.paymentConfig.invoiceDetails.return_url
      ) {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
        )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
        this.paymentConfig.invoiceId,
        error,
        "card",
        undefined,
        this.paymentConfig.invoiceDetails.return_url || null,
      )
    }
  }
}
