/// <reference path="../references.ts" />

module ProcessOut {
  export class ApplePayClient {
    processOutInstance: ProcessOut
    paymentConfig: DynamicCheckoutPaymentConfig

    constructor(processOutInstance: ProcessOut, paymentConfig: DynamicCheckoutPaymentConfig) {
      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
    }

    public loadButton(
      buttonContainer: HTMLElement,
      invoiceData: Invoice,
      getViewContainer: () => HTMLElement,
    ) {
      const applePayScript = document.createElement("script")
      applePayScript.src = applePaySdkUrl
      applePayScript.onload = () => {
        buttonContainer.innerHTML = `<apple-pay-button buttonstyle="black" type="plain" locale="en-US"></apple-pay-button>`
        this.initializeApplePay(invoiceData, buttonContainer, getViewContainer)
      }

      document.head.appendChild(applePayScript)
    }

    private initializeApplePay(
      invoiceData: Invoice,
      buttonContainer: HTMLElement,
      getViewContainer: () => HTMLElement,
    ) {
      const applePayPaymentMethodData = this.getApplePayPaymentMethodData(invoiceData)

      this.processOutInstance.applePay.checkAvailability(
        err => {
          if (err) {
            console.log(err)
          } else {
            buttonContainer.classList.add("visible")

            document.querySelector("apple-pay-button").addEventListener("click", () => {
              this.tokenizeApplePay(invoiceData, getViewContainer)
            })
          }
        },
        { merchantApplePayCertificateId: applePayPaymentMethodData.merchant_id },
      )
    }

    private getSupportedNetworks(invoiceData: Invoice) {
      const applePayPaymentMethodData = this.getApplePayPaymentMethodData(invoiceData)

      let supportedNetworks = []
      applePayPaymentMethodData.supported_networks.forEach(network => {
        if (networksMap[network]) {
          supportedNetworks.push(networksMap[network])
        }
      })

      return supportedNetworks
    }

    private createApplePaySession(invoiceData: Invoice) {
      const applePayPaymentMethodData = this.getApplePayPaymentMethodData(invoiceData)
      const supportedNetworks = this.getSupportedNetworks(invoiceData)

      const session = this.processOutInstance.applePay.newSession(
        {
          total: {
            label: invoiceData.name,
            amount: invoiceData.amount,
          },
          currencyCode: invoiceData.currency,
          countryCode: applePayPaymentMethodData.country_code,
          supportedNetworks: supportedNetworks,
          merchantCapabilities: applePayPaymentMethodData.merchant_capabilities,
          merchantApplePayCertificateId: applePayPaymentMethodData.merchant_id,
          applePaySessionVersion: 14,
        },
        DynamicCheckoutEventsUtils.dispatchApplePayNewSessionEvent,
        DynamicCheckoutEventsUtils.dispatchApplePaySessionError,
      )

      session.onpaymentauthorizedPostprocess =
        DynamicCheckoutEventsUtils.dispatchApplePayAuthorizedPostProcessEvent

      return session
    }

    private tokenizeApplePay(invoiceData: Invoice, getViewContainer: () => HTMLElement) {
      const session = this.createApplePaySession(invoiceData)

      this.processOutInstance.tokenize(
        session,
        {},
        card => {
          session.completePayment(0)

          DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(card)

          // The casting is needed since Apple Pay returns card object instead of card token for some reason
          // You can check the implementation of tokenize function
          const cardToken = (card as unknown as Record<string, any>).id

          this.makeApplePayPayment(cardToken, invoiceData, getViewContainer)
        },
        () => {
          session.completePayment(1)

          getViewContainer().appendChild(
            new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
              .element,
          )
        },
      )
    }

    private makeApplePayPayment(
      cardToken: string,
      invoiceData: Invoice,
      getViewContainer: () => HTMLElement,
    ) {
      this.processOutInstance.makeCardPayment(
        invoiceData.id,
        cardToken,
        {
          authorize_only: !this.paymentConfig.capturePayments,
          allow_fallback_to_sale: this.paymentConfig.allowFallbackToSale,
        },
        invoiceId => {
          if (this.paymentConfig.showStatusMessage) {
            getViewContainer().appendChild(
              new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          } else if (
            !this.paymentConfig.showStatusMessage &&
            !this.paymentConfig.invoiceDetails.return_url
          ) {
            getViewContainer().appendChild(
              new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          }

          DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
            invoiceId,
            returnUrl: this.paymentConfig.invoiceDetails.return_url,
          })
        },
        error => {
          if (this.paymentConfig.showStatusMessage) {
            getViewContainer().appendChild(
              new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          } else if (
            !this.paymentConfig.showStatusMessage &&
            !this.paymentConfig.invoiceDetails.return_url
          ) {
            getViewContainer().appendChild(
              new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig)
                .element,
            )
          }

          DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error)
        },
      )
    }

    private getApplePayPaymentMethodData(invoiceData: Invoice) {
      let applePayPaymentMethodData

      invoiceData.payment_methods.forEach(method => {
        if (method.type === "applepay") {
          applePayPaymentMethodData = method.applepay
        }
      })

      return applePayPaymentMethodData
    }
  }
}
