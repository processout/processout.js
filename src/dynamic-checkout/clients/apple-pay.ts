/// <reference path="../references.ts" />

module ProcessOut {
  export class ApplePayClient {
    libraryUrl =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

    processOutInstance: ProcessOut;

    constructor(processOutInstance: ProcessOut) {
      this.processOutInstance = processOutInstance;
    }

    public loadButton(
      buttonContainer: HTMLElement,
      getViewContainer: () => HTMLElement,
      invoiceData: Invoice
    ) {
      const applePayScript = document.createElement("script");
      const initializeApplePay = this.initializeApplePay.bind(this);

      applePayScript.src = this.libraryUrl;

      applePayScript.onload = () => {
        buttonContainer.innerHTML = `<apple-pay-button buttonstyle="black" type="plain" locale="en-US"></apple-pay-button>`;
        initializeApplePay(invoiceData, buttonContainer, getViewContainer);
      };

      document.head.appendChild(applePayScript);
    }

    private initializeApplePay(
      invoiceData: Invoice,
      buttonContainer: HTMLDivElement,
      getViewContainer: () => HTMLElement
    ) {
      const tokenizeApplePay = this.tokenizeApplePay.bind(this);

      this.processOutInstance.applePay.checkAvailability(function (err) {
        if (err) {
          console.log(err);
        } else {
          buttonContainer.classList.add("visible");
          buttonContainer.addEventListener("click", () => {
            tokenizeApplePay(invoiceData, getViewContainer);
          });
        }
      });
    }

    private createApplePaySession(invoiceData: Invoice) {
      const applePayPaymentMethodData =
        this.getApplePayPaymentMethodData(invoiceData);

      const session = this.processOutInstance.applePay.newSession(
        {
          total: {
            label: invoiceData.name,
            amount: invoiceData.amount,
          },
          currencyCode: invoiceData.currency,
          countryCode: applePayPaymentMethodData.country_code,
          supportedNetworks: applePayPaymentMethodData.supported_networks,
          merchantCapabilities: applePayPaymentMethodData.merchant_capabilities,
          merchantCertificateId: applePayPaymentMethodData.merchant_id,
        },
        DynamicCheckoutEventsUtils.dispatchApplePayNewSessionEvent,
        DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent
      );

      return session;
    }

    private tokenizeApplePay(
      invoiceData: Invoice,
      getViewContainer: () => HTMLElement
    ) {
      const session = this.createApplePaySession(invoiceData);
      const makeApplePayPayment = this.makeApplePayPayment.bind(this);

      this.processOutInstance.tokenize(
        session,
        {},
        function (cardToken) {
          DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(
            cardToken
          );

          session.completePayment(ApplePayStatusCodes.STATUS_SUCCESS);

          makeApplePayPayment(cardToken, invoiceData, getViewContainer);
        },
        function (err) {
          session.completePayment(ApplePayStatusCodes.STATUS_FAILURE);

          DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent(err);

          getViewContainer().innerHTML = `
            <div class="dco-card-payment-error-text">
              Something went wrong. Please try again.
            </div>
          `;
        }
      );
    }

    private makeApplePayPayment(
      cardToken: string,
      invoiceData: Invoice,
      getViewContainer: () => HTMLElement
    ) {
      const getPaymentAuthorizeSuccessHtml =
        this.getPaymentAuthorizeSuccessHtml.bind(this);

      this.processOutInstance.makeCardPayment(
        invoiceData.id,
        cardToken,
        {
          authorize_only: true,
        },
        function (invoiceId) {
          getViewContainer().innerHTML = getPaymentAuthorizeSuccessHtml();

          DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
            invoiceId,
            returnUrl: invoiceData.return_url,
          });
        },
        function (err) {
          getViewContainer().innerHTML = `
            <div class="dco-card-payment-error-text">
              Something went wrong. Please try again.
            </div>
          `;

          DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
        }
      );
    }

    private getPaymentAuthorizeSuccessHtml() {
      return `
        <div class="dco-card-payment-success">
          <p class="dco-card-payment-success-text">Success! Payment authorized.</p>
          <img class="dco-card-payment-success-image" src="https://js.processout.com/images/native-apm-assets/payment_success_image.svg" />
        </div>
      `;
    }

    private getApplePayPaymentMethodData(invoiceData: Invoice) {
      let applePayPaymentMethodData;

      invoiceData.payment_methods.forEach((method) => {
        if (method.type === "applepay") {
          applePayPaymentMethodData = method.applepay;
        }
      });

      return applePayPaymentMethodData;
    }
  }
}
