/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentErrorView {
    private errorImageUrl =
      "https://js.processout.com/images/dynamic-checkout-assets/payment-error.svg";

    public element: Element;

    constructor(
      paymentConfig: DynamicCheckoutPaymentConfigType,
      errorMessage?: string
    ) {
      const [element, image, message] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-card-payment-success"],
        },
        {
          tagName: "img",
          classNames: ["dco-card-payment-success-image"],
          attributes: {
            src: this.errorImageUrl,
          },
        },
        {
          tagName: "div",
          classNames: ["dco-card-payment-error-text"],
          textContent:
            errorMessage ||
            Translations.getText("payment-error-message", paymentConfig.locale),
        },
      ]);

      HTMLElements.appendChildren(element, [image, message]);

      this.element = element;
    }
  }
}
