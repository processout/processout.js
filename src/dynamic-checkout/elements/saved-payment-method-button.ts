/// <reference path="../references.ts" />

module ProcessOut {
  export abstract class SavedPaymentMethodButton {
    public element: HTMLElement
    protected processOutInstance: ProcessOut

    constructor(
      processOutInstance: ProcessOut,
      name: string,
      logoUrl: string,
      id: string,
      description: string,
      deleteMode: boolean = false,
      deletingAllowed: boolean = false,
      handleDeletePaymentMethod?: () => void,
      locale: string = "en",
    ) {
      this.processOutInstance = processOutInstance

      this.element = this.createElement(
        name,
        logoUrl,
        id,
        description,
        deleteMode,
        deletingAllowed,
        handleDeletePaymentMethod,
        locale,
      )
    }

    private createElement(
      name: string,
      logoUrl: string,
      id: string,
      description: string,
      deleteMode: boolean,
      deletingAllowed: boolean,
      handleDeletePaymentMethod?: () => void,
      locale: string = "en",
    ) {
      const tagName = deleteMode ? "div" : "button"

      const classNames = [
        "dco-saved-payment-method-button",
        deleteMode && "dco-saved-payment-method-button--delete-mode",
      ]

      const [element, logo, descriptionElement, deleteButton, deleteButtonIcon] =
        HTMLElements.createMultipleElements([
          {
            tagName,
            classNames,
            attributes: {
              "data-id": id,
            },
          },
          {
            tagName: "img",
            classNames: ["dco-saved-payment-method-logo"],
            attributes: {
              src: logoUrl,
              alt: name,
            },
          },
          {
            tagName: "div",
            classNames: ["dco-payment-method-right-content"],
            textContent: description,
          },
          {
            tagName: "button",
            classNames: ["dco-delete-payment-method-button"],
            attributes: {
              "aria-label": Translations.getText("delete-payment-method-label", locale),
            },
          },
          {
            tagName: "img",
            classNames: ["dco-delete-payment-method-icon"],
            attributes: {
              src: this.processOutInstance.endpoint("js", TRASH_ICON),
              alt: "",
            },
          },
        ])

      HTMLElements.appendChildren(element, [logo, descriptionElement])

      if (deleteMode && deletingAllowed) {
        HTMLElements.appendChildren(deleteButton, [deleteButtonIcon])
        HTMLElements.appendChildren(element, [deleteButton])

        deleteButton.addEventListener("click", () => {
          deleteButton.setAttribute("disabled", "true")
          handleDeletePaymentMethod()
        })
      }

      return element
    }

    protected setLoading(locale: string = "en") {
      const button = this.element as HTMLButtonElement
      const currentHeight = button.offsetHeight

      button.disabled = true
      button.style.height = `${currentHeight}px`
      HTMLElements.replaceChildren(button, [])
      button.setAttribute(
        "aria-label",
        Translations.getText("processing-payment-label", locale),
      )

      const spinner = HTMLElements.createElement({
        tagName: "span",
        classNames: ["dco-payment-method-button-pay-button-spinner"],
        attributes: {
          "aria-hidden": "true",
        },
      })

      HTMLElements.appendChildren(button, [spinner])
    }
  }
}
