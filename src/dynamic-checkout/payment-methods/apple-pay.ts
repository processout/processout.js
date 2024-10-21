/// <reference path="../../references.ts" />

module ProcessOut {
  export class ApplePayPaymentMethod {
    private applePayClient: ApplePayClient;
    public element: HTMLElement;

    constructor(
      processOutInstance: ProcessOut,
      invoiceData: Invoice,
      resetContainerHtml: () => HTMLElement
    ) {
      this.applePayClient = new ApplePayClient(processOutInstance);

      this.element = this.getApplePayButtonElement();

      this.applePayClient.loadButton(
        this.element,
        invoiceData,
        resetContainerHtml
      );
    }

    private getApplePayButtonElement() {
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
