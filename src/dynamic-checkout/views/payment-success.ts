/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentSuccessView {
    public element: Element

    constructor(processOutInstance: ProcessOut, paymentConfig: DynamicCheckoutPaymentConfig) {
      const [element, image, message] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-card-payment-success"],
        },
        {
          tagName: "img",
          classNames: ["dco-card-payment-success-image"],
          attributes: {
            src: processOutInstance.endpoint("js", PAYMENT_SUCCESS_IMAGE_ASSET),
          },
        },
        {
          tagName: "p",
          classNames: ["dco-card-payment-success-text"],
          textContent: Translations.getText("payment-success-message", paymentConfig.locale),
        },
      ])

      HTMLElements.appendChildren(element, [image, message])

      this.element = element
    }
  }
}
