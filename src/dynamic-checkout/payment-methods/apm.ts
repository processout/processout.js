/// <reference path="../../references.ts" />
/// <reference path="../../references.ts" />

module ProcessOut {
  interface CardPaymentOptions {
    authorize_only: boolean
    allow_fallback_to_sale: boolean
    save_source: boolean
  }

  interface RequestOptions {
    clientSecret: string
  }

  export class ApmPaymentMethod extends PaymentMethodButton {
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
    ) {
      super(
        processOutInstance,
        paymentMethod.display.name,
        paymentMethod.display.logo.dark_url.vector,
        paymentMethod.display.name,
      )

      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.paymentMethod = paymentMethod
      this.theme = theme
      this.resetContainerHtml = resetContainerHtml

      super.appendChildren(this.getChildrenElement())
    }

    private proceedToApmPayment() {
      const { apm } = this.paymentMethod
      const { clientSecret } = this.paymentConfig

      const actionHandlerOptions = new ActionHandlerOptions(
        apm.gateway_name,
        apm.gateway_logo.dark_url.raster,
      )

      const cardPaymentOptions = {
        authorize_only: !this.paymentConfig.capturePayments,
        allow_fallback_to_sale: this.paymentConfig.allowFallbackToSale,
        save_source: false,
      }

      const requestOptions = {
        clientSecret,
      }

      const saveForFutureCheckbox = document.getElementById(
        `save-apm-for-future-${this.paymentMethod.apm.gateway_name}`,
      ) as HTMLInputElement | null

      if (saveForFutureCheckbox) {
        cardPaymentOptions["save_source"] = saveForFutureCheckbox.checked
      }

      if (apm.saving_allowed && cardPaymentOptions["save_source"]) {
        return this.handleApmPaymentWithSaveForFuture(
          cardPaymentOptions,
          actionHandlerOptions,
          requestOptions,
        )
      }

      this.handleApmPayment(cardPaymentOptions, actionHandlerOptions, requestOptions)
    }

    private handleApmPayment(
      cardPaymentOptions: CardPaymentOptions,
      actionHandlerOptions: ActionHandlerOptions,
      requestOptions: RequestOptions,
    ) {
      const { apm } = this.paymentMethod

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: apm.gateway_name,
      })

      this.processOutInstance.handleAction(
        apm.redirect_url,
        paymentToken => {
          this.resetContainerHtml().appendChild(new DynamicCheckoutInvoiceLoadingView().element)

          DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent(paymentToken, {
            payment_method_name: apm.gateway_name,
          })

          this.processOutInstance.makeCardPayment(
            this.paymentConfig.invoiceId,
            paymentToken,
            cardPaymentOptions,
            invoiceId => {
              if (this.paymentConfig.showStatusMessage) {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              } else {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              }

              DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId)
            },
            error => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                  .element,
              )

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
            },
            requestOptions,
          )
        },
        error => {
          if (error.code === "customer.canceled") {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentCancelledView(this.processOutInstance, this.paymentConfig)
                .element,
            )

            DynamicCheckoutEventsUtils.dispatchPaymentCancelledEvent({
              payment_method_name: apm.gateway_name,
            })
          } else {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )

            DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
          }
        },
        actionHandlerOptions,
        this.paymentConfig.invoiceId,
      )
    }

    private handleApmPaymentWithSaveForFuture(
      cardPaymentOptions: any,
      actionHandlerOptions: ActionHandlerOptions,
      requestOptions: any,
    ) {
      const { apm } = this.paymentMethod

      const options = {
        ...cardPaymentOptions,
        source: apm.gateway_configuration_id,
      }

      this.processOutInstance.apiRequest(
        "POST",
        `invoices/${this.paymentConfig.invoiceId}/capture`,
        options,
        data => {
          this.processOutInstance.handleAction(
            data.customer_action.value,
            paymentToken => {
              this.resetContainerHtml().appendChild(new DynamicCheckoutInvoiceLoadingView().element)

              this.processOutInstance.makeCardPayment(
                this.paymentConfig.invoiceId,
                paymentToken,
                options,
                invoiceId => {
                  if (this.paymentConfig.showStatusMessage) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentSuccessView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  } else {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentInfoView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  }

                  DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId)
                },
                error => {
                  if (this.paymentConfig.showStatusMessage) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentErrorView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  } else {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentInfoView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  }

                  DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
                },
                requestOptions,
              )
            },
            error => {
              if (this.paymentConfig.showStatusMessage) {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              } else {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              }

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
            },
            actionHandlerOptions,
            this.paymentConfig.invoiceId,
          )
        },
        error => {
          if (this.paymentConfig.showStatusMessage) {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          } else {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          }

          DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
        },
        0,
        requestOptions,
      )
    }

    private getChildrenElement() {
      const [
        childrenWrapper,
        messageWrapper,
        messageImg,
        messageText,
        saveForFutureWrapper,
        saveForFutureCheckbox,
        saveForFutureLabel,
        payButton,
      ] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-children-wrapper"],
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-message-wrapper"],
        },
        {
          tagName: "img",
          classNames: ["dco-payment-method-button-message-img"],
          attributes: {
            src: this.processOutInstance.endpoint(
              "js",
              "/images/dynamic-checkout-assets/apm-redirect-arrow.svg",
            ),
          },
        },
        {
          tagName: "p",
          textContent: Translations.getText("apm-redirect-message", this.paymentConfig.locale),
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-save-for-future-wrapper"],
        },
        {
          tagName: "input",
          classNames: ["dco-payment-method-button-save-for-future-checkbox"],
          attributes: {
            type: "checkbox",
            name: "save-apm-for-future",
            id: `save-apm-for-future-${this.paymentMethod.apm.gateway_name}`,
          },
        },
        {
          tagName: "label",
          classNames: ["dco-payment-method-button-save-for-future-label"],
          attributes: {
            for: `save-apm-for-future-${this.paymentMethod.display.name}`,
          },
          textContent: Translations.getText("save-for-future-label", this.paymentConfig.locale),
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          textContent: `${Translations.getText(
            "continue-with-apm-button",
            this.paymentConfig.locale,
          )} ${this.paymentMethod.display.name}`,
        },
      ])

      HTMLElements.appendChildren(saveForFutureWrapper, [saveForFutureCheckbox, saveForFutureLabel])
      HTMLElements.appendChildren(messageWrapper, [messageImg, messageText])

      const children = [
        messageWrapper,
        this.paymentMethod.apm.saving_allowed ? saveForFutureWrapper : null,
        payButton,
      ].filter(Boolean)

      HTMLElements.appendChildren(childrenWrapper, children)

      if (this.theme && this.theme.payButtonColor) {
        payButton.style.backgroundColor = this.theme.payButtonColor
      }

      if (this.theme && this.theme.payButtonTextColor) {
        payButton.style.color = this.theme.payButtonTextColor
      }

      payButton.addEventListener("click", () => {
        this.proceedToApmPayment()
      })

      return childrenWrapper
    }
  }
}
