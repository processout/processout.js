/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentMethodsView {
    processOutInstance: ProcessOut;
    cardFormView: DynamicCheckoutCardFormView;
    nativeApmView: DynamicCheckoutNativeApmView;
    paymentConfig: DynamicCheckoutPaymentConfigType;
    formElement: HTMLElement;
    onSubmitHandler: Function;

    constructor(
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;

      this.formElement = this.createFormElement();

      this.cardFormView = new DynamicCheckoutCardFormView(
        processOutInstance,
        paymentConfig
      );
      this.nativeApmView = new DynamicCheckoutNativeApmView(
        processOutInstance,
        paymentConfig
      );

      this.applyDynamicStyles();
    }

    public getViewElement() {
      return this.formElement;
    }

    public setupEventListeners(): void {
      const buttons = document.querySelectorAll(
        ".dco-pay-button[data-method-id]"
      );

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const redirectUrl = button.getAttribute("data-redirect-url");
          const dataMethodId = button.getAttribute("data-method-id");
          const savedCardTokenId = button.getAttribute("data-card-token-id");

          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else if (dataMethodId === "card") {
            this.cardFormView.setupCardForm(this.resetContainerHtml());
          } else if (savedCardTokenId) {
            this.processOutInstance.makeCardPayment(
              this.paymentConfig.invoiceId,
              savedCardTokenId,
              {
                authorize_only: true,
              },
              function(invoiceId) {
                DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(
                  invoiceId
                );
              },
              function(err) {
                DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
              }
            );
          } else {
            this.nativeApmView.setupNativeApmWidget(
              this.resetContainerHtml(),
              dataMethodId
            );
          }
        });
      });
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
        ({ flow, type, apm, display, apm_customer_token, card_customer_token }) => {
          if (flow === "express") {
            let apmConfig = apm;
            if(type === "apm_customer_token") {
              apmConfig = apm_customer_token
            } else if (type === "card_customer_token") {
              apmConfig = card_customer_token
            }
            expressCheckoutHtml += this.getExpressCheckoutHtml(
              type,
              apmConfig,
              display
            );
          } else if (type === "apm") {
            directCheckoutHtml += this.getApmPaymentMethodButtonHtml(
              display,
              apm
            );
          } else if (type === "card") {
            directCheckoutHtml += this.getCardPaymentMethodButtonHtml(display);
          } else if ( type === "card_customer_token") {
            expressCheckoutHtml += this.getExpressCheckoutHtml(
              type,
              card_customer_token,
              display
            );

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
      // TODO: enable when merchant configuration ready
      switch (type) {
        case "googlepay": {
          return ``;
          // not yet supported -- missing merchant configuration
          return `
          <div class="dco-pay-button" id="google-pay-button-container">
              <!-- Google Pay button will be dynamically added here -->
          </div>
        `;
        }
        case "apm_customer_token": {
          return this.getApmPaymentMethodButtonHtml(display, apm);
        }
        case "card_customer_token": {
          return this.getSavedCardPaymentMethodButtonHtml(display, apm);
        }
        case "applepay": {
          return ``;
          // not yet supported - implementation in progress
          return `
          <div class="dco-pay-button" id="google-pay-button-container">
              <!-- Google Pay button will be dynamically added here -->
          </div>
        `;
        }
        default: {
          return "";
        }
      }
    }

    private getSavedCardPaymentMethodButtonHtml(display: Display, apm: Apm): string {
      return `
        <div class="dco-pay-button" data-method-id="saved-card" data-card-token-id="${apm.customer_token_id || ""}">
            <div class="dco-payment-method dco-payment-method--regular" style="background-color: ${DynamicCheckoutColorsUtils.hexToRgba(
              display.brand_color.dark
            )}">
                <img src="${
                  display.logo.dark_url.vector
                }" class="dco-payment-method-logo"/>
                <span class="dco-payment-method-label">${display.name}</span>
                ${
                  apm.redirect_url
                    ? `<span class="dco-payment-method-apm-message">You will be redirected to finalise this payment</span>`
                    : ""
                }
            </div>
        </div>`;
    }
    private getApmPaymentMethodButtonHtml(display: Display, apm: Apm): string {
      return `
        <div class="dco-pay-button" data-method-id="${
          apm.gateway_configuration_id
        }" data-redirect-url="${apm.redirect_url || ""}">
            <div class="dco-payment-method dco-payment-method--regular" style="background-color: ${DynamicCheckoutColorsUtils.hexToRgba(
              display.brand_color.dark
            )}">
                <img src="${
                  display.logo.dark_url.vector
                }" class="dco-payment-method-logo"/>
                <span class="dco-payment-method-label">${display.name}</span>
                ${
                  apm.redirect_url
                    ? `<span class="dco-payment-method-apm-message">You will be redirected to finalise this payment</span>`
                    : ""
                }
            </div>
        </div>`;
    }

    private getCardPaymentMethodButtonHtml(display: Display): string {
      return `
        <div class="dco-pay-button" data-method-id="card">
            <div class="dco-payment-method dco-payment-method--regular" style="background-color: ${DynamicCheckoutColorsUtils.hexToRgba(
              display.brand_color.dark
            )}">
                <img src="${
                  display.logo.dark_url.vector
                }" class="dco-payment-method-logo"/>
                <span class="dco-payment-method-label">${display.name}</span>
            </div>
        </div>`;
    }

    private applyDynamicStyles() {
      const styleElement = document.createElement("style");
      styleElement.innerHTML = dynamicStyles;
      document.head.appendChild(styleElement);
    }
  }
}
