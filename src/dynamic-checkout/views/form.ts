/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutFormView {
    formElement: HTMLFormElement
    onSubmitHandler: Function
    paymentMethods: PaymentMethod[]
    projectId: string
    invoiceId: string

    constructor({ paymentMethods, projectId, invoiceId }: DynamicCheckoutConfig) {
      this.paymentMethods = paymentMethods
      this.projectId = projectId
      this.invoiceId = invoiceId
      this.formElement = this.createFormElement()
      this.applyDynamicStyles()
    }

    private hexToRgba(hex: string): string {
      const r = parseInt(hex.slice(2, 4), 16)
      const g = parseInt(hex.slice(4, 6), 16)
      const b = parseInt(hex.slice(6, 8), 16)
      const a = parseInt(hex.slice(8, 10), 16) / 255
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    private applyDynamicStyles(): void {
      const styleElement = document.createElement("style")
      styleElement.innerHTML = dynamicStyles
      document.head.appendChild(styleElement)
    }

    public getViewElement(): HTMLFormElement {
      return this.formElement
    }

    public postSetup(): void {
      const buttons = document.querySelectorAll(".pay-button[data-method-id]")
      buttons.forEach(button => {
        button.addEventListener("click", event => {
          const redirectUrl = button.getAttribute("data-redirect-url")
          const gatewayConfigurationId = button.getAttribute("data-method-id")

          if (redirectUrl) {
            window.location.href = redirectUrl
          } else {
            this.prepareNativeAPM(gatewayConfigurationId)
          }
        })
      })
      const cardFormElement = document.getElementById("card-form") as HTMLElement
      const projectId = this.projectId
      const client = new ProcessOut(projectId)
      client.setupForm(
        cardFormElement,
        {
          style: {
            fontSize: "14px",
            //@ts-ignore
            "::placeholder": {
              color: "#ECEFF1",
            },
          },
        },
        function (form) {
          form.addEventListener("submit", function (e) {
            e.preventDefault()
            const nameElement = document.getElementById("card-form-name") as HTMLInputElement | null

            client.tokenize(
              form,
              {
                name: nameElement?.value || "",
              },
              function (token) {
                DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(token)
              },
              function (err) {
                console.error("Tokenize payment error:", err)
                DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent({
                  message: `Tokenize payment error: ${JSON.stringify(err, undefined, 2)}`,
                })
              },
            )

            return false
          })
        },
        function (err) {
          console.log({ err })
        },
      )

      const googlePayConfigurations = this.paymentMethods.filter(p => !!p.googlepay)
      const googlePayConfiguration =
        googlePayConfigurations.length > 0 ? googlePayConfigurations[0] : undefined

      if (googlePayConfiguration) {
        // TODO: not handled yet - requires merchant details to be finalized;
        // this.initializeGooglePay(googlePayConfiguration.googlepay)
      }
    }

    private prepareNativeAPM(gatewayConfigurationId: string): void {
      const napmContainer = document.querySelector("#dynamic-cko-container")
      if (napmContainer) {
        napmContainer.innerHTML = ""
      }

      const client = new ProcessOut(this.projectId)

      const nativeApm = client.setupNativeApm({
        gatewayConfigurationId,
        invoiceId: this.invoiceId,
      })

      nativeApm.mount("#dynamic-cko-container")
    }

    private generateFormHtml(): string {
      const isCardPaymentAvailable = this.paymentMethods.some(p => p.type === "card")
      const cardPaymentHtml = isCardPaymentAvailable ? this.getCardPaymentHtml() : ""
      const { expressCheckoutHtml, directCheckoutHtml } = this.getPaymentMethodsHtml()

      const expressCheckoutDiv = expressCheckoutHtml
        ? `
        <div class="express-checkout">
          <div class="title">Express checkout</div>
          ${expressCheckoutHtml}
        </div>
      `
        : ""

      const directCheckoutDiv = directCheckoutHtml
        ? `
          <div class="direct-checkout">
            ${directCheckoutHtml}
          </div>
        `
        : ""

      return `
        <div id="dynamic-checkout-cko">
            <div class="hosted-payment-page">
              ${expressCheckoutDiv}
              ${directCheckoutDiv}
              ${cardPaymentHtml}
            </div>
        </div>`
    }

    private createFormElement(): HTMLFormElement {
      const container = document.createElement("div")
      container.innerHTML = this.generateFormHtml().trim()
      return container.querySelector("#dynamic-checkout-cko") as HTMLFormElement
    }

    private getCardPaymentHtml(): string {
      return `
        <div class="or">
            <span>or</span>
        </div>
        <form action="" method="POST" id="card-form">
          <div class="card-payment">
              <div class="input-group">
                  <div class="input-label">Card Number</div>
                  <div class="input" data-processout-input="cc-number" data-processout-placeholder="0000 0000 0000 0000"></div>
              </div>
              <div class="input-row">
                  <div class="input-group">
                      <div class="input-label">Expiry Date</div>
                      <div class="input" data-processout-input="cc-exp" data-processout-placeholder="MM/YY"></div>
                  </div>
                  <div class="input-group">
                      <div class="input-label">CVC</div>
                      <div class="input" data-processout-input="cc-cvc" data-processout-placeholder="CVC"></div>
                  </div>
              </div>
              <div class="input-group">
                  <div class="input-label">Cardholder Name</div>
                  <input class="input" type="text" placeholder="John Smith" id="card-form-name" />
              </div>
          </div>
          <button type="submit" class="cta-pay">Pay</button>
        </form>`
    }

    private getPaymentMethodsHtml(): { expressCheckoutHtml: string; directCheckoutHtml: string } {
      let expressCheckoutHtml = ""
      let directCheckoutHtml = ""

      this.paymentMethods.forEach(({ flow, type, apm, display }) => {
        if (flow === "express") {
          expressCheckoutHtml += this.getExpressCheckoutHtml(type)
        } else if (type === "apm") {
          directCheckoutHtml += this.getDirectCheckoutHtml(apm, display)
        }
      })

      return { expressCheckoutHtml, directCheckoutHtml }
    }

    private getExpressCheckoutHtml(type: string): string {
      // TODO: enable when merchant configuration ready
      switch (type) {
        case "googlepay": {
          return ``
          // not yet supported -- missing merchant configuration
          return `
          <div class="pay-button" id="google-pay-button-container">
              <!-- Google Pay button will be dynamically added here -->
          </div>
        `
        }
        case "applepay": {
          return ``
          // not yet supported - implementation in progress
          return `
          <div class="pay-button" id="google-pay-button-container">
              <!-- Google Pay button will be dynamically added here -->
          </div>
        `
        }
        default: {
          return ""
        }
      }
    }

    private getDirectCheckoutHtml(apm: Apm, display: Display): string {
      return `
        <div class="pay-button" data-method-id="${apm.gateway_configuration_uid}.${
        apm.gateway_name
      }" data-redirect-url="${apm.redirect_url || ""}">
            <div class="payment-method" style="background-color: ${this.hexToRgba(
              display.brand_color.dark,
            )}">
                <img src="${display.logo.dark_url.vector}" style="margin: 0 auto; height: 40px" />
            </div>
        </div>`
    }

    private initializeGooglePay(configuration: Googlepay): void {
      const baseRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: configuration.allowed_auth_methods,
              allowedCardNetworks: configuration.allowed_card_networks,
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "example",
                gatewayMerchantId: "exampleGatewayMerchantId",
              },
            },
          },
        ],
      }

      let paymentsClient = null

      function getGooglePaymentsClient() {
        if (paymentsClient === null) {
          //@ts-ignore // TODO: fill with merchant configuration
          paymentsClient = new google.payments.api.PaymentsClient({ environment: "TEST" })
        }
        return paymentsClient
      }

      function onGooglePayLoaded() {
        const paymentsClient = getGooglePaymentsClient()
        paymentsClient
          .isReadyToPay(baseRequest)
          .then(function (response) {
            if (response.result) {
              addGooglePayButton()
            }
          })
          .catch(function (err) {
            console.error("Error checking Google Pay readiness:", err)
          })
      }

      function addGooglePayButton() {
        const container = document.getElementById("google-pay-button-container")
        if (!container) {
          console.error("Container element not found.")
          return
        }

        const paymentsClient = getGooglePaymentsClient()
        const button = paymentsClient.createButton({
          onClick: onGooglePaymentButtonClicked,
          buttonSizeMode: "fill",
        })
        container.appendChild(button)
      }

      function onGooglePaymentButtonClicked() {
        const paymentDataRequest = {
          ...baseRequest,
          // TODO: fill with invoice details
          transactionInfo: {
            countryCode: "US",
            currencyCode: "USD",
            totalPriceStatus: "FINAL",
            totalPrice: "1.00",
          },
        }

        const paymentsClient = getGooglePaymentsClient()
        paymentsClient
          .loadPaymentData(paymentDataRequest)
          .then(function (paymentData) {
            processPayment(paymentData)
          })
          .catch(function (err) {
            console.error("Error loading payment data:", err)
          })
      }

      function processPayment(paymentData) {
        console.log("Google Pay payment data:", paymentData)
      }

      onGooglePayLoaded()
    }
  }
}
