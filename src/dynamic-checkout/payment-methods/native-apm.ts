/// <reference path="../../references.ts" />

module ProcessOut {
  export class NativeApmPaymentMethod extends PaymentMethodButton {
    private nativeApmInstance: NativeApm;
    private paymentConfig: DynamicCheckoutPaymentConfigType;
    private isMounted: boolean;
    private theme: DynamicCheckoutThemeType;
    private resetContainerHtml: () => HTMLElement;

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfigType,
      theme: DynamicCheckoutThemeType,
      resetContainerHtml: () => HTMLElement
    ) {
      const { display, apm } = paymentMethod;
      const { invoiceId, invoiceDetails } = paymentConfig;

      super(display.name, display.logo.dark_url.vector);

      this.paymentConfig = paymentConfig;
      this.resetContainerHtml = resetContainerHtml;
      this.theme = theme;

      const wrapper = this.getNativeApmWrapper();
      super.appendChildren(wrapper);

      this.nativeApmInstance = processOutInstance.setupNativeApm({
        invoiceId,
        gatewayConfigurationId: apm.gateway_configuration_id,
        returnUrl: invoiceDetails.return_url,
      });

      this.nativeApmInstance.setTheme({
        buttons: {
          default: {
            backgroundColor: this.theme?.payButtonColor || "#242C38",
            color: this.theme?.payButtonTextColor || "white",
          },
        },
      });

      this.setupEventListeners(wrapper);
    }

    private setupEventListeners(wrapper: HTMLElement) {
      this.element.addEventListener("click", () => {
        if (!this.isMounted) {
          this.nativeApmInstance.mount(wrapper);
          this.isMounted = true;
        }
      });

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_SUCCESS, (e) => {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentSuccessView().element
        );

        DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
          invoiceId: this.paymentConfig.invoiceId,
          returnUrl: this.paymentConfig.invoiceDetails.return_url,
        });
      });

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_ERROR, (e) => {
        this.resetContainerHtml().appendChild(
          new DynamicCheckoutPaymentErrorView().element
        );

        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(e);
      });
    }

    private getNativeApmWrapper() {
      const wrapper = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-native-apm-payment-method-wrapper"],
      });

      return wrapper;
    }
  }
}
