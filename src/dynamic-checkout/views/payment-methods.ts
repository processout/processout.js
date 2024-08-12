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

          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else if (dataMethodId === "card") {
            this.cardFormView.setupCardForm(this.resetContainerHtml());
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
        ({ flow, type, apm, display, apm_customer_token }) => {
          if (flow === "express") {
            let formattedApm =
              type === "apm_customer_token" ? apm_customer_token : apm;
            expressCheckoutHtml += this.getExpressCheckoutHtml(
              type,
              formattedApm,
              display
            );
          } else if (type === "apm") {
            directCheckoutHtml += this.getApmPaymentMethodButtonHtml(
              display,
              apm
            );
          } else if (type === "card") {
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
