/// <reference path="../references.ts" />

module ProcessOut {
  export class SavedCardPaymentMethod extends PaymentMethodButton {
    protected processOutInstance: ProcessOut
    private paymentConfig: DynamicCheckoutPaymentConfig
    private paymentMethod: PaymentMethod
    private theme: DynamicCheckoutThemeType
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
      const rightContentElement = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-payment-method-right-content"],
      })

      rightContentElement.textContent = paymentMethod.display.description

      super(
        processOutInstance,
        paymentMethod.display.name,
        paymentMethod.display.logo.dark_url.vector,
        paymentMethod.card_customer_token.customer_token_id,
        rightContentElement,
        deleteMode,
        paymentMethod.card_customer_token.deleting_allowed,
        handleDeletePaymentMethod,
        paymentConfig.locale,
      )

      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.paymentMethod = paymentMethod
      this.theme = theme
      this.resetContainerHtml = resetContainerHtml

      super.appendChildren(this.getChildrenElement(deleteMode))
    }

    private getChildrenElement(deleteMode?: boolean) {
      const payButtonText = this.paymentConfig.payButtonText
        || `${Translations.getText(
          "pay-button-text",
          this.paymentConfig.locale,
        )} ${this.paymentConfig.invoiceDetails.amount} ${this.paymentConfig.invoiceDetails.currency}`

      const [wrapper, payButton] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-saved-card-payment-method-wrapper"],
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          attributes: {
            id: `dco-saved-card-pay-button-${this.paymentMethod.card_customer_token.customer_token_id}`,
          },
          textContent: payButtonText,
        },
      ])

      if (this.theme && this.theme.payButtonColor) {
        payButton.style.backgroundColor = this.theme.payButtonColor
      }

      if (this.theme && this.theme.payButtonTextColor) {
        payButton.style.color = this.theme.payButtonTextColor
      }

      HTMLElements.appendChildren(wrapper, [payButton])

      if (!deleteMode) {
        payButton.addEventListener("click", this.handlePayment.bind(this))
      }

      return wrapper
    }

    private handlePayment() {
      this.setButtonLoading()

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: "card",
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
        invoiceId,
        returnUrl: this.paymentConfig.invoiceDetails.return_url,
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

      DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
    }

    private setButtonLoading() {
      const payButton = document.getElementById(
        `dco-saved-card-pay-button-${this.paymentMethod.card_customer_token.customer_token_id}`,
      ) as HTMLButtonElement

      payButton.disabled = true
      payButton.textContent = ""
      payButton.setAttribute(
        "aria-label",
        Translations.getText("processing-payment-label", this.paymentConfig.locale),
      )

      const spinner = HTMLElements.createElement({
        tagName: "span",
        classNames: ["dco-payment-method-button-pay-button-spinner"],
        attributes: {
          "aria-hidden": "true",
        },
      })

      HTMLElements.appendChildren(payButton, [spinner])
    }
  }
}
