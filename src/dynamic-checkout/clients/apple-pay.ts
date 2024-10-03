/// <reference path="../references.ts" />

module ProcessOut {
  export class ApplePayClient {
    libraryUrl =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

    // It's needed because not every network that we support is supported by Apple Pay Web SDK
    // and some of them are called slightly different than the ones we're using e.g. "amex" instead of "american express"
    networksMap = {
      "american express": "amex",
      bancomat: "bancomat",
      bancontact: "bancontact",
      "carte bancaire": "cartesbancaires",
      "china union pay": "chinaunionpay",
      dankort: "dankort",
      discover: "discover",
      eftpos: "eftpos",
      electron: "electron",
      elo: "elo",
      girocard: "girocard",
      interac: "interac",
      jcb: "jcb",
      mada: "mada",
      maestro: "maestro",
      mastercard: "mastercard",
      "nspk mir": "mir",
      "private label": "privateLabel",
      visa: "visa",
      vpay: "vpay",
    };

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

      const applePayPaymentMethodData =
        this.getApplePayPaymentMethodData(invoiceData);

      this.processOutInstance.applePay.checkAvailability(
        function (err) {
          if (err) {
            console.log(err);
          } else {
            buttonContainer.classList.add("visible");

            document
              .querySelector("apple-pay-button")
              .addEventListener("click", () => {
                tokenizeApplePay(invoiceData, getViewContainer);
              });
          }
        },
        { merchantApplePayCertificateId: applePayPaymentMethodData.merchant_id }
      );
    }

    private getSupportedNetworks(invoiceData: Invoice) {
      const applePayPaymentMethodData =
        this.getApplePayPaymentMethodData(invoiceData);

      let supportedNetworks = [];

      applePayPaymentMethodData.supported_networks.forEach((network) => {
        if (this.networksMap[network]) {
          supportedNetworks.push(this.networksMap[network]);
        }
      });

      return supportedNetworks;
    }

    private createApplePaySession(invoiceData: Invoice) {
      const applePayPaymentMethodData =
        this.getApplePayPaymentMethodData(invoiceData);

      const supportedNetworks = this.getSupportedNetworks(invoiceData);

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
        DynamicCheckoutEventsUtils.dispatchApplePaySessionError
      );

      session.onpaymentauthorizedPostprocess = (event) => {
        DynamicCheckoutEventsUtils.dispatchApplePayAuthorizedPostProcessEvent();
      };

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
        function (card) {
          session.completePayment(0);

          DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(card);

          // The casting is needed since Apple Pay returns card object instead of card token for some reason
          // You can check the implementation of tokenize function
          const cardToken = (card as unknown as Record<string, any>).id;

          makeApplePayPayment(cardToken, invoiceData, getViewContainer);
        },
        function (err) {
          session.completePayment(1);

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
