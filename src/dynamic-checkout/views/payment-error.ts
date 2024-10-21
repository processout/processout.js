module ProcessOut {
  export class DynamicCheckoutPaymentErrorView {
    public element: Element;

    constructor(errorMessage?: string) {
      const message = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-card-payment-error-text"],
        textContent: errorMessage || "Something went wrong. Please try again.",
      });

      this.element = message;
    }
  }
}
