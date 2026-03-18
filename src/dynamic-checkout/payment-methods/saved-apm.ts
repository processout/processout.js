/// <reference path="../references.ts" />

module ProcessOut {
  export class SavedApmPaymentMethod extends SavedPaymentMethodButton {
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
        paymentMethod.apm_customer_token.customer_token_id,
        paymentMethod.display.description,
        deleteMode,
        paymentMethod.apm_customer_token.deleting_allowed,
        handleDeletePaymentMethod,
        paymentConfig.locale,
      )

      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.paymentMethod = paymentMethod
      this.resetContainerHtml = resetContainerHtml

      if (!deleteMode) {
        this.element.addEventListener("click", this.handleApmPayment.bind(this))
      }
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

      this.setLoading(this.paymentConfig.locale)

      if (apm_customer_token.redirect_url) {
        const additionalData = this.paymentConfig.getAdditionalDataForGateway(
          apm_customer_token.gateway_name,
        )

        const redirectUrl = Object.keys(additionalData).length > 0
          ? this.processOutInstance.appendAdditionalDataToUrl(
              apm_customer_token.redirect_url,
              additionalData,
            )
          : apm_customer_token.redirect_url

        DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
          payment_method_name: apm_customer_token.gateway_name,
          invoice_id: invoiceId,
          return_url: this.paymentConfig.invoiceDetails.return_url || null,
          customer_token_id: apm_customer_token.customer_token_id,
        })

        return this.processOutInstance.handleAction(
          redirectUrl,
          paymentToken => {
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

                DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
                  invoice_id: invoiceId,
                  return_url: this.paymentConfig.invoiceDetails.return_url || null,
                  payment_method_name: apm_customer_token.gateway_name,
                })
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

                DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
                  this.paymentConfig.invoiceId,
                  error,
                  apm_customer_token.gateway_name,
                  undefined,
                  this.paymentConfig.invoiceDetails.return_url || null,
                )
              },
              requestOptions,
              invoiceId => {
                if (this.paymentConfig.showStatusMessage) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentPendingView(
                      this.processOutInstance,
                      this.paymentConfig,
                    ).element,
                  )
                }

                DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
                  payment_method_name: apm_customer_token.gateway_name,
                  invoice_id: invoiceId,
                  return_url: this.paymentConfig.invoiceDetails.return_url || null,
                })
              },
            )
          },
          error => {
            if (error.code === "customer.canceled") {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentCancelledView(
                  this.processOutInstance,
                  this.paymentConfig,
                ).element,
              )

              DynamicCheckoutEventsUtils.dispatchPaymentCancelledEvent({
                payment_method_name: apm_customer_token.gateway_name,
                invoice_id: this.paymentConfig.invoiceId,
                return_url: this.paymentConfig.invoiceDetails.return_url || null,
                tab_closed: error.metadata?.reason === "tab_closed",
              })
            } else {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                  .element,
              )

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
                this.paymentConfig.invoiceId,
                error,
                apm_customer_token.gateway_name,
                undefined,
                this.paymentConfig.invoiceDetails.return_url || null,
              )
            }
          },
          actionHandlerOptions,
          this.paymentConfig.invoiceId,
        )
      }

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: this.paymentMethod.apm_customer_token
          ? this.paymentMethod.apm_customer_token.gateway_name
          : "apm",
        invoice_id: invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
        customer_token_id: apm_customer_token.customer_token_id,
      })

      this.processOutInstance.makeCardPayment(
        this.paymentConfig.invoiceId,
        this.paymentMethod.apm_customer_token.customer_token_id,
        cardPaymentOptions,
        this.handlePaymentSuccess.bind(this),
        this.handlePaymentError.bind(this),
        requestOptions,
        this.handlePaymentPending.bind(this),
      )
    }

    private handlePaymentSuccess(invoiceId: string, data) {
      this.resetContainerHtml().appendChild(
        new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig).element,
      )

      DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
        invoice_id: invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
        payment_method_name: this.paymentMethod.apm_customer_token
          ? this.paymentMethod.apm_customer_token.gateway_name
          : "apm",
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
        payment_method_name: this.paymentMethod.apm_customer_token
          ? this.paymentMethod.apm_customer_token.gateway_name
          : "apm",
        invoice_id: this.paymentConfig.invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
      })
    }

    private handlePaymentError(error) {
      if (error.code === "customer.canceled") {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentCancelledView(this.processOutInstance, this.paymentConfig)
            .element,
        )

        DynamicCheckoutEventsUtils.dispatchPaymentCancelledEvent({
          payment_method_name: this.paymentMethod.apm_customer_token
            ? this.paymentMethod.apm_customer_token.gateway_name
            : "apm",
          invoice_id: this.paymentConfig.invoiceId,
          return_url: this.paymentConfig.invoiceDetails.return_url || null,
          tab_closed: error.metadata?.reason === "tab_closed",
        })
      } else {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig).element,
        )

        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
          this.paymentConfig.invoiceId,
          error,
          this.paymentMethod.apm_customer_token
            ? this.paymentMethod.apm_customer_token.gateway_name
            : "apm",
          undefined,
          this.paymentConfig.invoiceDetails.return_url || null,
        )
      }
    }
  }
}
