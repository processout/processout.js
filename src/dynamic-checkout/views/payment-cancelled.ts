/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentCancelledView {
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
            src: processOutInstance.endpoint("js", PAYMENT_ERROR_IMAGE_ASSET),
          },
        },
        {
          tagName: "div",
          classNames: ["dco-card-payment-error-text"],
          textContent: Translations.getText("payment-cancelled-message", paymentConfig.locale),
        },
      ])

      this.element = element

      HTMLElements.appendChildren(element, [image, message])
    }
  }
}
