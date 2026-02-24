/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentPendingView {
    public element: Element

    constructor(processOutInstance: ProcessOut, paymentConfig: DynamicCheckoutPaymentConfig) {
      const [element, message] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-card-payment-success"],
          attributes: {
            role: "status",
          },
        },
        {
          tagName: "p",
          classNames: ["dco-card-payment-success-text"],
          textContent: Translations.getText("payment-pending-message", paymentConfig.locale),
        },
      ])

      HTMLElements.appendChildren(element, [message])

      this.element = element
    }
  }
}
