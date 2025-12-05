/// <reference path="../references.ts" />

module ProcessOut {
  export class SavedApmPaymentMethod extends PaymentMethodButton {
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
        paymentMethod.apm_customer_token.customer_token_id,
        rightContentElement,
        deleteMode,
        paymentMethod.apm_customer_token.deleting_allowed,
        handleDeletePaymentMethod,
      )

      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.paymentMethod = paymentMethod
      this.theme = theme
      this.resetContainerHtml = resetContainerHtml

      super.appendChildren(this.getChildrenElement(deleteMode))
    }

    private getChildrenElement(deleteMode?: boolean) {
      const payButtonText = `${Translations.getText(
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
            id: `dco-saved-apm-pay-button-${this.paymentMethod.apm_customer_token.customer_token_id}`,
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
        payButton.addEventListener("click", this.handleApmPayment.bind(this))
      }

      return wrapper
    }

    private handleApmPayment() {
      const { apm_customer_token, apm } = this.paymentMethod
      const { clientSecret, invoiceId } = this.paymentConfig

      const cardPaymentOptions = {
        authorize_only: !this.paymentConfig.capturePayments,
        allow_fallback_to_sale: this.paymentConfig.allowFallbackToSale,
      }

      const requestOptions = {
        clientSecret,
      }

      const actionHandlerOptions = new ActionHandlerOptions(
        apm_customer_token.gateway_name,
        apm_customer_token.gateway_logo.dark_url.raster,
      )

      this.setButtonLoading()

      if (apm_customer_token.redirect_url) {
        DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
          payment_method_name: apm.gateway_name,
        })

        return this.processOutInstance.handleAction(
          apm_customer_token.redirect_url,
          paymentToken => {
            DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent(paymentToken, {
              payment_method_name: apm.gateway_name,
            })

            this.processOutInstance.makeCardPayment(
              invoiceId,
              paymentToken,
              cardPaymentOptions,
              invoiceId => {
                if (this.paymentConfig.showStatusMessage) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentSuccessView(
                      this.processOutInstance,
                      this.paymentConfig,
                    ).element,
                  )
                } else if (
                  !this.paymentConfig.showStatusMessage &&
                  !this.paymentConfig.invoiceDetails.return_url
                ) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                      .element,
                  )
                }

                DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId)
              },
              error => {
                if (this.paymentConfig.showStatusMessage) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                      .element,
                  )
                } else if (
                  !this.paymentConfig.showStatusMessage &&
                  !this.paymentConfig.invoiceDetails.return_url
                ) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                      .element,
                  )
                }

                DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
              },
              requestOptions,
            )
          },
          error => {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )

            DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
          },
          actionHandlerOptions,
          this.paymentConfig.invoiceId,
        )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent(
        this.paymentMethod.apm_customer_token.customer_token_id,
        {
          payment_method_name: apm.gateway_name,
        },
      )

      this.processOutInstance.makeCardPayment(
        this.paymentConfig.invoiceId,
        this.paymentMethod.apm_customer_token.customer_token_id,
        cardPaymentOptions,
        this.handlePaymentSuccess.bind(this),
        this.handlePaymentError.bind(this),
        requestOptions,
      )
    }

    private handlePaymentSuccess(invoiceId: string) {
      this.resetContainerHtml().appendChild(
        new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig).element,
      )

      DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
        invoiceId,
        returnUrl: this.paymentConfig.invoiceDetails.return_url,
      })
    }

    private handlePaymentError(error) {
      this.resetContainerHtml().appendChild(
        new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig).element,
      )

      DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
    }

    private setButtonLoading() {
      const payButton = document.getElementById(
        `dco-saved-apm-pay-button-${this.paymentMethod.apm_customer_token.customer_token_id}`,
      ) as HTMLButtonElement

      payButton.disabled = true
      payButton.textContent = ""

      const spinner = HTMLElements.createElement({
        tagName: "span",
        classNames: ["dco-payment-method-button-pay-button-spinner"],
      })

      HTMLElements.appendChildren(payButton, [spinner])
    }
  }
}
