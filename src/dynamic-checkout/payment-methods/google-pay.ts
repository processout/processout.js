/// <reference path="../../references.ts" />

module ProcessOut {
  export class GooglePayPaymentMethod {
    public element: HTMLElement;
    private googleClient: GooglePayClient;

    constructor(
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType,
      invoiceData: Invoice,
      resetContainerHtml: () => HTMLElement
    ) {
      this.googleClient = new GooglePayClient(processOutInstance, paymentConfig);

      this.element = this.getGooglePayButtonElement();

      this.googleClient.loadButton(
        this.element,
        invoiceData,
        resetContainerHtml
      );
    }

    private getGooglePayButtonElement() {
      const element = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-wallet-checkout-button"],
        attributes: {
          id: "google-pay-button-container",
        },
      });

      return element;
    }
  }
}
