/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutPaymentInfoView {
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
          textContent: getStatusMessage("payment-info-message", paymentConfig),
        },
      ])

      HTMLElements.appendChildren(element, [message])

      this.element = element
    }
  }
}
