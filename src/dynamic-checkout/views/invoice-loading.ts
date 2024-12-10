/// <reference path="../references.ts" />

module ProcessOut {
    export class DynamicCheckoutInvoiceLoadingView {
      public element: Element;
  
      constructor(
      ) {
        const [element, spinner] = HTMLElements.createMultipleElements([
          {
            tagName: "div",
            classNames: ["dco-invoice-loading-container"],
          },
          {
            tagName: "div",
            classNames: ["dco-invoice-loading"],
          },
        ]);

        HTMLElements.appendChildren(element, [spinner]);

  
        this.element = element;
      }
    }
  }
  