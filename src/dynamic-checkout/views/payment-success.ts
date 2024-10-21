module ProcessOut {
  export class DynamicCheckoutPaymentSuccessView {
    private successImageUrl =
      "https://js.processout.com/images/dynamic-checkout-assets/payment-success.svg";

    public element: Element;

    constructor() {
      const [element, image, message] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-card-payment-success"],
        },
        {
          tagName: "img",
          classNames: ["dco-card-payment-success-image"],
          attributes: {
            src: this.successImageUrl,
          },
        },
        {
          tagName: "p",
          classNames: ["dco-card-payment-success-text"],
          textContent: "This payment is completed.",
        },
      ]);

      HTMLElements.appendChildren(element, [image, message]);

      this.element = element;
    }
  }
}
