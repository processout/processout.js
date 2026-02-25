/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutInvoiceLoadingView {
    public element: Element

    constructor(locale: string = "en") {
      const [element, spinner] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-invoice-loading-container"],
          attributes: {
            role: "status",
            "aria-label": Translations.getText("loading-label", locale),
          },
        },
        {
          tagName: "div",
          classNames: ["dco-invoice-loading"],
          attributes: {
            "aria-hidden": "true",
          },
        },
      ])

      HTMLElements.appendChildren(element, [spinner])

      this.element = element
    }
  }
}
