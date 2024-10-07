/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentMethodsView {
    processOutInstance: ProcessOut;
    googlePayClient: GooglePayClient;
    applePayClient: ApplePayClient;
    dynamicCheckout: DynamicCheckout;
    cardFormView: DynamicCheckoutCardFormView;
    nativeApmView: DynamicCheckoutNativeApmView;
    paymentConfig: DynamicCheckoutPaymentConfigType;
    formElement: HTMLElement;
    onSubmitHandler: Function;

    constructor(
      dynamicCheckout: DynamicCheckout,
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.dynamicCheckout = dynamicCheckout;
      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;

      this.formElement = this.createFormElement();

      this.cardFormView = new DynamicCheckoutCardFormView(
        dynamicCheckout,
        processOutInstance,
        paymentConfig
      );

      this.nativeApmView = new DynamicCheckoutNativeApmView(
        dynamicCheckout,
        processOutInstance,
        paymentConfig
      );

      this.googlePayClient = new GooglePayClient(processOutInstance);

      this.applePayClient = new ApplePayClient(processOutInstance);
    }

    public getViewElement() {
      return this.formElement;
    }

    public setupPaymentMethodsEventListeners(): void {
      const buttons = document.querySelectorAll(
        ".dco-pay-button[data-method-id]"
      );

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const redirectUrl = button.getAttribute("data-redirect-url");
          const dataMethodId = button.getAttribute("data-method-id");
          const dataMethodName = button.getAttribute(
            "data-gateway-method-name"
          );
          const dataMethodLogo = button.getAttribute("data-method-logo");
          const savedCardTokenId = button.getAttribute("data-card-token-id");
          const dataMethodType = button.getAttribute("data-method-type");

          // Regular card payment method
          if (dataMethodId === "card") {
            this.cardFormView.setupCardForm(this.resetContainerHtml());
          }

          // Saved cards
          if (savedCardTokenId) {
            this.handleSavedCardPayment(savedCardTokenId);
          }

          // APMs
          if (redirectUrl) {
            this.handleApmPayment(
              this.paymentConfig.invoiceId,
              dataMethodName,
              dataMethodLogo,
              redirectUrl
            );
          }

          // Native APMs
          if (!redirectUrl && dataMethodType === "apm") {
            this.nativeApmView.setupNativeApmWidget(
              this.resetContainerHtml(),
              dataMethodId
            );
          }
        });
      });
    }

    private handleApmPayment(
      invoiceId: string,
      gatewayName: string,
      gatewayLogo: string,
      redirectUrl: string
    ) {
      const processOutInstance = this.processOutInstance;
      const resetContainerHtml = this.resetContainerHtml;
      const actionHandlerOptions = new ActionHandlerOptions(
        gatewayName,
        gatewayLogo
      );
      let cardPaymentOptions = {};

      // This is an edge case for everypay, which doesn't support authorize_only
      if (gatewayName !== "everypay") {
        cardPaymentOptions = {
          authorize_only: true,
        };
      }

      processOutInstance.handleAction(
        redirectUrl,
        (token) => {
          processOutInstance.makeCardPayment(
            invoiceId,
            token,
            cardPaymentOptions,
            function (invoiceId) {
              const container = resetContainerHtml();

              container.innerHTML = `
                <div class="dco-card-payment-success">
                  <p class="dco-card-payment-success-text">Success! Payment was successful.</p>
                  <img class="dco-card-payment-success-image" src="https://js.processout.com/images/native-apm-assets/payment_success_image.svg" />
                </div>
              `;

              DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId);
            },
            function (err) {
              console.log(err);
              const container = resetContainerHtml();

              container.innerHTML = `
                <div class="dco-card-payment-error-text">
                  Something went wrong. Please try again.
                </div>
              `;

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
            }
          );
        },
        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent,
        actionHandlerOptions
      );
    }

    private handleSavedCardPayment(savedCardTokenId: string) {
      const resetContainerHtml = this.resetContainerHtml;

      this.processOutInstance.makeCardPayment(
        this.paymentConfig.invoiceId,
        savedCardTokenId,
        {
          authorize_only: true,
        },
        function (invoiceId) {
          const container = resetContainerHtml();

          container.innerHTML = `
            <div class="dco-card-payment-success">
              <p class="dco-card-payment-success-text">Success! Payment was successful.</p>
              <img class="dco-card-payment-success-image" src="https://js.processout.com/images/native-apm-assets/payment_success_image.svg" />
            </div>
          `;

          DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId);
        },
        function (err) {
          const container = resetContainerHtml();

          container.innerHTML = `
            <div class="dco-card-payment-error-text">
              Something went wrong. Please try again.
            </div>
          `;

          DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
        }
      );
    }

    public loadExternalClients() {
      const googlePayButtonContainer = document.getElementById(
        "google-pay-button-container"
      );

      const applePayButtonContainer = document.getElementById(
        "apple-pay-button-container"
      );

      const resetContainerHtml = this.resetContainerHtml.bind(this);

      if (googlePayButtonContainer) {
        this.googlePayClient.loadButton(
          googlePayButtonContainer,
          resetContainerHtml,
          this.paymentConfig.invoiceDetails
        );
      }

      if (applePayButtonContainer) {
        this.applePayClient.loadButton(
          applePayButtonContainer,
          resetContainerHtml,
          this.paymentConfig.invoiceDetails
        );
      }
    }

    private resetContainerHtml() {
      const container = document.querySelector(".dco-wrapper");

      if (container) {
        container.innerHTML = "";
      }

      return container as HTMLElement;
    }

    private generateFormHtml(): string {
      const { expressCheckoutHtml, directCheckoutHtml } =
        this.getPaymentMethodsHtml();

      const expressCheckoutDiv = expressCheckoutHtml
        ? `
        <div class="dco-express-checkout">
          <div class="dco-express-checkout-title">Express checkout</div>
          ${expressCheckoutHtml}
        </div>
      `
        : "";

      const directCheckoutDiv = directCheckoutHtml
        ? `
          <div class="dco-direct-checkout">
            ${directCheckoutHtml}
          </div>
        `
        : "";

      return `
        <div class="dco-wrapper">
          ${expressCheckoutDiv}
          ${directCheckoutDiv}
        </div>
      `;
    }

    private createFormElement() {
      const container = document.createElement("div");

      container.innerHTML = this.generateFormHtml().trim();

      return container as HTMLElement;
    }

    private getPaymentMethodsHtml(): {
      expressCheckoutHtml: string;
      directCheckoutHtml: string;
    } {
      let expressCheckoutHtml = "";
      let directCheckoutHtml = "";

      this.paymentConfig.invoiceDetails.payment_methods.forEach(
        ({
          flow,
          type,
          apm,
          display,
          apm_customer_token,
          card_customer_token,
        }) => {
          if (flow === "express") {
            let apmConfig = apm;

            if (type === "apm_customer_token") {
              apmConfig = apm_customer_token;
            }

            if (type === "card_customer_token") {
              apmConfig = card_customer_token;
            }

            expressCheckoutHtml += this.getExpressCheckoutHtml(
              type,
              apmConfig,
              display
            );
          }

          if (type === "card_customer_token") {
            expressCheckoutHtml += this.getExpressCheckoutHtml(
              type,
              card_customer_token,
              display
            );
          }

          if (type === "apm") {
            directCheckoutHtml += this.getApmPaymentMethodButtonHtml(
              display,
              apm
            );
          }

          if (type === "card") {
            directCheckoutHtml += this.getCardPaymentMethodButtonHtml(display);
          }
        }
      );

      return { expressCheckoutHtml, directCheckoutHtml };
    }

    private getExpressCheckoutHtml(
      type: string,
      apm: Apm,
      display: Display
    ): string {
      switch (type) {
        case "apm_customer_token": {
          return this.getApmPaymentMethodButtonHtml(display, apm);
        }
        case "card_customer_token": {
          return this.getSavedCardPaymentMethodButtonHtml(display, apm);
        }
        case "googlepay": {
          return `
            <div class="dco-pay-button" id="google-pay-button-container">
              <!-- Google Pay button will be dynamically added here -->
            </div>
         `;
        }
        case "applepay": {
          return `
            <div class="dco-pay-button" id="apple-pay-button-container">
              <!-- Apple Pay button will be dynamically added here -->
            </div>
          `;
        }
        default: {
          return "";
        }
      }
    }

    private getSavedCardPaymentMethodButtonHtml(
      display: Display,
      apm: Apm
    ): string {
      return `
        <div
          class="dco-pay-button"
          data-method-id="saved-card"
          data-card-token-id="${apm.customer_token_id || ""}"
        >
          <div class="dco-payment-methoddco-payment-method--regular">
              <img
                src="${display.logo.dark_url.vector}"
                class="dco-payment-method-logo"
              />
              <span class="dco-payment-method-label">${display.name}</span>
              ${
                apm.redirect_url
                  ? `<span class="dco-payment-method-apm-message">You will be redirected to finalize this payment</span>`
                  : ""
              }
          </div>
      </div>`;
    }
    private getApmPaymentMethodButtonHtml(display: Display, apm: Apm): string {
      return `
        <div
          class="dco-pay-button"
          data-method-type="apm"
          data-method-name="${display.name}"
          data-method-id="${apm.gateway_configuration_id}"
          data-redirect-url="${apm.redirect_url || ""}"
          data-logo-url="${display.logo.dark_url.vector}"
          data-gateway-method-name="${apm.gateway_name}"
          data-method-logo="${apm.gateway_logo_url}"
        >
            <div class="dco-payment-method dco-payment-method--regular">
                <img 
                  src="${display.logo.dark_url.vector}"
                  class="dco-payment-method-logo"
                />
                <span class="dco-payment-method-label">${display.name}</span>
                ${
                  apm.redirect_url
                    ? `<span class="dco-payment-method-apm-message">You will be redirected to finalize this payment</span>`
                    : ""
                }
            </div>
        </div>`;
    }

    private getCardPaymentMethodButtonHtml(display: Display): string {
      return `
        <div class="dco-pay-button" data-method-id="card">
            <div class="dco-payment-method dco-payment-method--regular">
                <img src="${display.logo.dark_url.vector}" class="dco-payment-method-logo"/>
                <span class="dco-payment-method-label">${display.name}</span>
            </div>
        </div>`;
    }
  }
}
