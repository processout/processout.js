/// <reference path="../../references.ts" />

module ProcessOut {
  export class ApmPaymentMethod extends PaymentMethodButton {
    private redirectArrowUrl =
      "https://js.processout.com/images/dynamic-checkout-assets/apm-redirect-arrow.svg";

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
      super(
        paymentMethod.display.name,
        paymentMethod.display.logo.dark_url.vector
      );

      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;
      this.paymentMethod = paymentMethod;
      this.theme = theme;
      super.appendChildren(this.getChildrenElement());

      this.resetContainerHtml = resetContainerHtml;
    }

    private handleApmPayment() {
      const { apm } = this.paymentMethod;

      const actionHandlerOptions = new ActionHandlerOptions(
        apm.gateway_name,
        apm.gateway_logo_url
      );

      const cardPaymentOptions = {
        authorize_only: !this.paymentConfig.capturePayments,
        allow_fallback_to_sale: true,
      };

      const saveForFutureCheckbox = document.getElementById(
        "save-apm-for-future"
      ) as HTMLInputElement | null;

      if (saveForFutureCheckbox) {
        cardPaymentOptions["save_source"] = saveForFutureCheckbox.checked;
      }

      this.processOutInstance.handleAction(
        apm.redirect_url,
        (paymentToken) => {
          this.processOutInstance.makeCardPayment(
            this.paymentConfig.invoiceId,
            paymentToken,
            cardPaymentOptions,
            (invoiceId) => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentSuccessView(this.paymentConfig)
                  .element
              );

              DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(invoiceId);
            },
            (error) => {
              this.resetContainerHtml().appendChild(
                new DynamicCheckoutPaymentErrorView(this.paymentConfig).element
              );

              DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(error);
            },
            {
              clientSecret: this.paymentConfig.clientSecret,
            }
          );
        },
        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent,
        actionHandlerOptions
      );
    }

    private getChildrenElement() {
      const [
        childrenWrapper,
        messageWrapper,
        messageImg,
        messageText,
        saveForFutureWrapper,
        saveForFutureCheckbox,
        saveForFutureLabel,
        payButton,
      ] = HTMLElements.createMultipleElements([
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-children-wrapper"],
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-message-wrapper"],
        },
        {
          tagName: "img",
          classNames: ["dco-payment-method-button-message-img"],
          attributes: {
            src: this.redirectArrowUrl,
          },
        },
        {
          tagName: "p",
          textContent: Translations.getText(
            "apm-redirect-message",
            this.paymentConfig.locale
          ),
        },
        {
          tagName: "div",
          classNames: ["dco-payment-method-button-save-for-future-wrapper"],
        },
        {
          tagName: "input",
          attributes: {
            type: "checkbox",
            name: "save-apm-for-future",
            id: "save-apm-for-future",
          },
        },
        {
          tagName: "label",
          classNames: ["dco-payment-method-button-save-for-future-label"],
          attributes: {
            for: "save-apm-for-future",
          },
          textContent: Translations.getText(
            "save-for-future-label",
            this.paymentConfig.locale
          ),
        },
        {
          tagName: "button",
          classNames: ["dco-payment-method-button-pay-button"],
          textContent: `${Translations.getText(
            "continue-with-apm-button",
            this.paymentConfig.locale
          )} ${this.paymentMethod.display.name}`,
        },
      ]);

      HTMLElements.appendChildren(saveForFutureWrapper, [
        saveForFutureCheckbox,
        saveForFutureLabel,
      ]);
      HTMLElements.appendChildren(messageWrapper, [messageImg, messageText]);

      const children = [
        messageWrapper,
        this.paymentMethod.apm.saving_allowed ? saveForFutureWrapper : null,
        payButton,
      ].filter(Boolean);

      HTMLElements.appendChildren(childrenWrapper, children);

      if (this.theme && this.theme.payButtonColor) {
        payButton.style.backgroundColor = this.theme.payButtonColor;
      }

      if (this.theme && this.theme.payButtonTextColor) {
        payButton.style.color = this.theme.payButtonTextColor;
      }

      payButton.addEventListener("click", () => {
        this.handleApmPayment();
      });

      return childrenWrapper;
    }
  }
}
