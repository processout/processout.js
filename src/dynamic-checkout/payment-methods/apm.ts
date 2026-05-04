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
    private resetContainerHtml: () => HTMLElement

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfig,
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
      this.resetContainerHtml = resetContainerHtml

      super.appendChildren(this.getChildrenElement())
    }

    private getMethodKey() {
      return this.paymentMethod.apm.gateway_name
    }

    private getMethodOptions() {
      return this.paymentConfig.getOptionsForMethod(this.getMethodKey())
    }

    private getMethodTheme() {
      return this.paymentConfig.getThemeForMethod(this.getMethodKey())
    }

    private getTextOverrides() {
      return this.paymentConfig.getTextOverridesForMethod(this.getMethodKey())
    }

    private getAdditionalPaymentData() {
      return this.paymentConfig.getAdditionalDataForMethod(this.getMethodKey())
    }

    private shouldShowStatusMessage() {
      return this.getMethodOptions().showStatusMessage
    }

    private proceedToApmPayment() {
      const { apm } = this.paymentMethod
      const { clientSecret } = this.paymentConfig
      const canSavePaymentMethod = apm.saving_allowed
      const methodOptions = this.getMethodOptions()

      const actionHandlerOptions = new ActionHandlerOptions(
        apm.gateway_name,
        apm.gateway_logo.dark_url.raster,
      )

      const cardPaymentOptions = {
        authorize_only: !methodOptions.capturePayments,
        allow_fallback_to_sale: !!methodOptions.allowFallbackToSale,
        save_source: canSavePaymentMethod && !!methodOptions.enforceSavePaymentMethod,
      }

      const requestOptions = {
        clientSecret,
      }

      const saveForFutureCheckbox = document.getElementById(
        `save-apm-for-future-${this.paymentMethod.apm.gateway_name}`,
      ) as HTMLInputElement | null

      if (
        canSavePaymentMethod &&
        saveForFutureCheckbox &&
        !methodOptions.enforceSavePaymentMethod
      ) {
        cardPaymentOptions["save_source"] = saveForFutureCheckbox.checked
      }

      if (canSavePaymentMethod && cardPaymentOptions["save_source"]) {
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
      const additionalData = this.getAdditionalPaymentData()

      const redirectUrl =
        Object.keys(additionalData).length > 0
          ? this.processOutInstance.appendAdditionalDataToUrl(apm.redirect_url, additionalData)
          : apm.redirect_url

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: apm.gateway_name,
        invoice_id: this.paymentConfig.invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
      })

      this.processOutInstance.handleAction(
        redirectUrl,
        paymentToken => {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutInvoiceLoadingView(this.paymentConfig.locale).element,
          )

          this.processOutInstance.makeCardPayment(
            this.paymentConfig.invoiceId,
            paymentToken,
            cardPaymentOptions,
            invoiceId => {
              if (this.shouldShowStatusMessage()) {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              } else if (!this.shouldShowStatusMessage() && !this.paymentConfig.invoiceDetails.return_url) {
                this.resetContainerHtml().appendChild(
                  new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                    .element,
                )
              }

              DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
                invoice_id: invoiceId,
                return_url: this.paymentConfig.invoiceDetails.return_url || null,
                payment_method_name: apm.gateway_name,
              })
            },
            error => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                  .element,
              )

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
                this.paymentConfig.invoiceId,
                error,
                apm.gateway_name,
                undefined,
                this.paymentConfig.invoiceDetails.return_url || null,
              )
            },
            requestOptions,
            invoiceId => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentPendingView(this.processOutInstance, this.paymentConfig)
                  .element,
              )

              DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
                payment_method_name: apm.gateway_name,
                invoice_id: invoiceId,
                return_url: this.paymentConfig.invoiceDetails.return_url || null,
              })
            },
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
              apm.gateway_name,
              undefined,
              this.paymentConfig.invoiceDetails.return_url || null,
            )
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

      DynamicCheckoutEventsUtils.dispatchPaymentSubmittedEvent({
        payment_method_name: apm.gateway_name,
        invoice_id: this.paymentConfig.invoiceId,
        return_url: this.paymentConfig.invoiceDetails.return_url || null,
      })

      this.processOutInstance.apiRequest(
        "POST",
        `invoices/${this.paymentConfig.invoiceId}/capture`,
        options,
        data => {
          var outcome = resolveOutcome(data)

          if (outcome === OUTCOME.Failed) {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )

            DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
              this.paymentConfig.invoiceId,
              data,
              apm.gateway_name,
              undefined,
              this.paymentConfig.invoiceDetails.return_url || null,
              data.customer_token_id,
            )
            return
          }

          if (outcome === OUTCOME.Pending && !data.customer_action) {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentPendingView(this.processOutInstance, this.paymentConfig)
                .element,
            )

            DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
              payment_method_name: apm.gateway_name,
              invoice_id: this.paymentConfig.invoiceId,
              return_url: this.paymentConfig.invoiceDetails.return_url || null,
              customer_token_id: data.customer_token_id,
            })

            return
          }

          this.processOutInstance.handleAction(
            data.customer_action.value,
            paymentToken => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutInvoiceLoadingView(this.paymentConfig.locale).element,
              )

              this.processOutInstance.makeCardPayment(
                this.paymentConfig.invoiceId,
                paymentToken,
                options,
                invoiceId => {
                  if (this.shouldShowStatusMessage()) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentSuccessView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  } else if (
                    !this.shouldShowStatusMessage() &&
                    !this.paymentConfig.invoiceDetails.return_url
                  ) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentInfoView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  }

                  DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
                    invoice_id: invoiceId,
                    return_url: this.paymentConfig.invoiceDetails.return_url || null,
                    payment_method_name: apm.gateway_name,
                    customer_token_id: data.customer_token_id,
                  })
                },
                error => {
                  if (this.shouldShowStatusMessage()) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentErrorView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  } else if (
                    !this.shouldShowStatusMessage() &&
                    !this.paymentConfig.invoiceDetails.return_url
                  ) {
                    this.resetContainerHtml().appendChild(
                      new DynamicCheckoutPaymentInfoView(
                        this.processOutInstance,
                        this.paymentConfig,
                      ).element,
                    )
                  }

                  DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
                    this.paymentConfig.invoiceId,
                    error,
                    apm.gateway_name,
                    undefined,
                    this.paymentConfig.invoiceDetails.return_url || null,
                    data.customer_token_id,
                  )
                },
                requestOptions,
                invoiceId => {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentPendingView(
                      this.processOutInstance,
                      this.paymentConfig,
                    ).element,
                  )

                  DynamicCheckoutEventsUtils.dispatchPaymentPendingEvent({
                    payment_method_name: apm.gateway_name,
                    invoice_id: invoiceId,
                    return_url: this.paymentConfig.invoiceDetails.return_url || null,
                    customer_token_id: data.customer_token_id,
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
                  payment_method_name: apm.gateway_name,
                  invoice_id: this.paymentConfig.invoiceId,
                  return_url: this.paymentConfig.invoiceDetails.return_url || null,
                  tab_closed: error.metadata?.reason === "tab_closed",
                })
              } else {
                if (this.shouldShowStatusMessage()) {
                  this.resetContainerHtml().appendChild(
                    new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                      .element,
                  )
                } else if (
                  !this.shouldShowStatusMessage() &&
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
                  apm.gateway_name,
                  undefined,
                  this.paymentConfig.invoiceDetails.return_url || null,
                  data.customer_token_id,
                )
              }
            },
            actionHandlerOptions,
            this.paymentConfig.invoiceId,
          )
        },
        error => {
          if (this.shouldShowStatusMessage()) {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          } else if (!this.shouldShowStatusMessage() && !this.paymentConfig.invoiceDetails.return_url) {
            this.resetContainerHtml().appendChild(
              new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          }

          DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
            this.paymentConfig.invoiceId,
            error,
            apm.gateway_name,
            undefined,
            this.paymentConfig.invoiceDetails.return_url || null,
          )
        },
        0,
        requestOptions,
      )
    }

    private getChildrenElement() {
      const saveForFutureAttributes: Record<string, string> = {
        type: "checkbox",
        name: "save-apm-for-future",
        id: `save-apm-for-future-${this.paymentMethod.apm.gateway_name}`,
      }
      const methodOptions = this.getMethodOptions()
      const textOverrides = this.getTextOverrides()
      const theme = this.getMethodTheme()

      if (methodOptions.enforceSavePaymentMethod) {
        saveForFutureAttributes.checked = "checked"
        saveForFutureAttributes.disabled = "disabled"
      }

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
            alt: "",
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
          attributes: saveForFutureAttributes,
        },
        {
          tagName: "label",
          classNames: ["dco-payment-method-button-save-for-future-label"],
          attributes: {
            for: `save-apm-for-future-${this.paymentMethod.apm.gateway_name}`,
          },
          textContent: Translations.getText("save-for-future-label", this.paymentConfig.locale),
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          textContent:
            textOverrides.payButtonText ||
            `${Translations.getText(
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

      if (theme && theme.payButtonColor) {
        payButton.style.backgroundColor = theme.payButtonColor
      }

      if (theme && theme.payButtonTextColor) {
        payButton.style.color = theme.payButtonTextColor
      }

      payButton.addEventListener("click", () => {
        this.proceedToApmPayment()
      })

      return childrenWrapper
    }
  }
}
