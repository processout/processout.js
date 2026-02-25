/// <reference path="../references.ts" />

module ProcessOut {
  export class PaymentMethodsManager {
    public element: HTMLElement
    private expressPaymentMethods: PaymentMethodButton[]
    public modal: any
    private paymentConfig: DynamicCheckoutPaymentConfig
    private processOutInstance: ProcessOut

    constructor(
      processOutInstance: ProcessOut,
      expressPaymentMethods: PaymentMethodButton[],
      paymentConfig: DynamicCheckoutPaymentConfig,
    ) {
      this.expressPaymentMethods = expressPaymentMethods
      this.processOutInstance = processOutInstance
      this.paymentConfig = paymentConfig
      this.element = this.createElement()
    }

    private createElement() {
      const [expressCheckoutSettingsButton, expressCheckoutCogIcon] =
        HTMLElements.createMultipleElements([
          {
            tagName: "button",
            classNames: ["dco-express-checkout-header-settings-button"],
            attributes: {
              "aria-label": Translations.getText(
                "settings-button-label",
                this.paymentConfig.locale,
              ),
            },
          },
          {
            tagName: "img",
            classNames: ["dco-express-checkout-cog-icon"],
            attributes: {
              src: this.processOutInstance.endpoint("js", COG_ICON),
              alt: "",
            },
          },
        ])

      expressCheckoutSettingsButton.addEventListener(
        "click",
        this.openSavedPaymentMethodsManagerModal.bind(this),
      )

      expressCheckoutSettingsButton.appendChild(expressCheckoutCogIcon)

      return expressCheckoutSettingsButton
    }

    private openSavedPaymentMethodsManagerModal() {
      const closeLabel = Translations.getText(
        "payments-manager-close-button",
        this.paymentConfig.locale,
      )

      this.modal =
        window.globalThis && window.globalThis.tingle
          ? new window.globalThis.tingle.modal({
              footer: true,
              stickyFooter: true,
              closeMethods: ["overlay", "button", "escape"],
              closeLabel: closeLabel,
              onClose: () => {
                this.element.focus()
              },
            })
          : null

      this.modal.setContent(this.createModalContent())

      this.modal.addFooterBtn(closeLabel, "close-modal-btn", () => {
        this.modal.close()
      })

      this.modal.open()
    }

    private createModalContent() {
      const [wrapper, header, body, paymentMethodsList] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-modal-content-wrapper"],
        },
        {
          tagName: "div",
          classNames: ["dco-modal-content-header"],
          textContent: Translations.getText("payments-manager-header", this.paymentConfig.locale),
        },
        {
          tagName: "div",
          classNames: ["dco-modal-content-body"],
        },
        {
          tagName: "div",
          classNames: ["dco-modal-payment-methods-list"],
        },
      ])

      this.expressPaymentMethods.forEach(paymentMethod => {
        paymentMethodsList.appendChild(paymentMethod.element)
      })

      body.appendChild(paymentMethodsList)

      wrapper.appendChild(header)
      wrapper.appendChild(body)

      return wrapper
    }
  }
}
