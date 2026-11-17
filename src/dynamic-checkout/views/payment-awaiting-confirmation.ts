/// <reference path="../references.ts" />

module ProcessOut {
  /**
   * Shown while DC waits for a payment whose PSP tab lost its link to the checkout (e.g. after a COOP page).
   * The shopper finishes the payment in the other tab; Cancel gives up waiting.
   */
  export class DynamicCheckoutPaymentAwaitingConfirmationView {
    public element: Element

    constructor(
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfig,
      onCancel: () => void,
    ) {
      const [element, image, message, cancelButton] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-card-payment-success"],
          attributes: {
            role: "status",
          },
        },
        {
          tagName: "img",
          classNames: ["dco-card-payment-success-image"],
          attributes: {
            src: processOutInstance.endpoint("js", PAYMENT_PENDING_IMAGE_ASSET),
            alt: "",
          },
        },
        {
          tagName: "p",
          classNames: ["dco-card-payment-success-text"],
          textContent: Translations.getText(
            "payment-awaiting-confirmation-message",
            paymentConfig.locale,
          ),
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          attributes: {
            type: "button",
          },
          textContent: Translations.getText(
            "payment-awaiting-confirmation-cancel-button",
            paymentConfig.locale,
          ),
        },
      ])

      cancelButton.addEventListener("click", onCancel)

      HTMLElements.appendChildren(element, [image, message, cancelButton])

      this.element = element
    }
  }
}
