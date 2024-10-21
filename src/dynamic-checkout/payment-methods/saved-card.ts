/// <reference path="../references.ts" />

module ProcessOut {
  export class SavedCardPaymentMethod extends PaymentMethodButton {
    private processOutInstance: ProcessOut;
    private paymentConfig: DynamicCheckoutPaymentConfigType;
    private paymentMethod: PaymentMethod;
    private theme: DynamicCheckoutThemeType;
    private resetContainerHtml: () => HTMLElement;

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfigType,
      theme: DynamicCheckoutThemeType,
      resetContainerHtml: () => HTMLElement
    ) {
      console.log(paymentMethod);
      super(
        paymentMethod.display.name,
        paymentMethod.display.logo.dark_url.vector
      );

      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;
      this.paymentMethod = paymentMethod;
      this.theme = theme;
      this.resetContainerHtml = resetContainerHtml;

      super.appendChildren(this.getChildrenElement());
    }

    private getChildrenElement() {
      const [wrapper, payButton] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-saved-card-payment-method-wrapper"],
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          textContent: `Pay ${this.paymentConfig.invoiceDetails.amount} ${this.paymentConfig.invoiceDetails.currency}`,
        },
      ]);

      if (this.theme?.payButtonColor) {
        payButton.style.backgroundColor = this.theme?.payButtonColor;
      }

      if (this.theme?.payButtonTextColor) {
        payButton.style.color = this.theme?.payButtonTextColor;
      }

      HTMLElements.appendChildren(wrapper, [payButton]);

      payButton.addEventListener("click", this.handlePayment.bind(this));

      return wrapper;
    }

    private handlePayment() {
      this.processOutInstance.makeCardPayment(
        this.paymentConfig.invoiceId,
        this.paymentMethod.card_customer_token.customer_token_id,
        {
          authorize_only: true,
        },
        this.handlePaymentSuccess.bind(this),
        this.handlePaymentError.bind(this)
      );
    }

    private handlePaymentSuccess(invoiceId: string) {
      this.resetContainerHtml().appendChild(
        new DynamicCheckoutPaymentSuccessView().element
      );
      DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
        invoiceId,
        returnUrl: this.paymentConfig.invoiceDetails.return_url,
      });
    }

    private handlePaymentError(error) {
      this.resetContainerHtml().appendChild(
        new DynamicCheckoutPaymentErrorView().element
      );
      DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error);
    }
  }
}
