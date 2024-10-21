/// <reference path="../references.ts" />

module ProcessOut {
  export abstract class PaymentMethodButton {
    public element: HTMLElement;
    private rightContentWrapper: HTMLElement;

    constructor(name: string, logoUrl: string, rightContent?: HTMLElement) {
      this.element = this.createElement(name, logoUrl, rightContent);
    }

    private createElement(
      name: string,
      logoUrl: string,
      rightContent?: HTMLElement
    ) {
      const [
        element,
        paymentMethodButtonWrapper,
        paymentMethodInfo,
        paymentMethodLogo,
        paymentMethodName,
        rightContentWrapper,
        radioButton,
      ] = HTMLElements.createMultipleElements([
        {
          tagName: "label",
          classNames: ["dco-payment-method-wrapper"],
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-wrapper"],
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-info"],
        },
        {
          tagName: "img",
          classNames: ["dco-payment-method-button-info-logo"],
          attributes: {
            src: logoUrl,
            alt: name,
          },
        },
        {
          tagName: "span",
          textContent: name,
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-right-content-wrapper"],
        },
        {
          tagName: "input",
          attributes: {
            type: "radio",
            name: "payment-method",
            style: "height: 16px; width: 16px;",
          },
        },
      ]);

      if (rightContent) {
        HTMLElements.appendChildren(rightContentWrapper, [rightContent]);
      }

      this.rightContentWrapper = rightContentWrapper;

      HTMLElements.appendChildren(rightContentWrapper, [radioButton]);
      HTMLElements.appendChildren(paymentMethodInfo, [
        paymentMethodLogo,
        paymentMethodName,
      ]);
      HTMLElements.appendChildren(paymentMethodButtonWrapper, [
        paymentMethodInfo,
        rightContentWrapper,
      ]);
      HTMLElements.appendChildren(element, [paymentMethodButtonWrapper]);

      return element;
    }

    public appendChildren(children: HTMLElement) {
      const childrenWrapper = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-payment-method-button-general-children-container"],
      });

      HTMLElements.appendChildren(childrenWrapper, [children]);
      HTMLElements.appendChildren(this.element, [childrenWrapper]);
    }
  }
}
