/// <reference path="../../references.ts" />

module ProcessOut {
  export class NativeApmPaymentMethod extends PaymentMethodButton {
    private nativeApmInstance: NativeApm
    private paymentConfig: DynamicCheckoutPaymentConfig
    private isMounted: boolean
    private theme: DynamicCheckoutThemeType
    private resetContainerHtml: () => HTMLElement
    protected processOutInstance: ProcessOut

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfig,
      theme: DynamicCheckoutThemeType,
      resetContainerHtml: () => HTMLElement,
    ) {
      const { display, apm } = paymentMethod
      const { invoiceId, invoiceDetails } = paymentConfig

      super(processOutInstance, display.name, display.logo.dark_url.vector, display.name)

      this.paymentConfig = paymentConfig
      this.processOutInstance = processOutInstance
      this.resetContainerHtml = resetContainerHtml
      this.theme = theme

      const wrapper = this.getNativeApmWrapper()
      super.appendChildren(wrapper)

      this.nativeApmInstance = this.processOutInstance.setupNativeApm({
        invoiceId,
        gatewayConfigurationId: apm.gateway_configuration_id,
        returnUrl: invoiceDetails.return_url,
      })

      const backgroundColor =
        this.theme && this.theme.payButtonColor ? this.theme.payButtonColor : "#242C38"

      const color =
        this.theme && this.theme.payButtonTextColor ? this.theme.payButtonTextColor : "white"

      this.nativeApmInstance.setTheme({
        buttons: {
          default: {
            backgroundColor: backgroundColor,
            color: color,
            fontWeight: 500,
          },
        },
      })

      this.setupEventListeners(wrapper)
    }

    private setupEventListeners(wrapper: HTMLElement) {
      this.element.addEventListener("click", () => {
        if (!this.isMounted) {
          this.nativeApmInstance.mount(wrapper)
          this.isMounted = true
        }
      })

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_SUCCESS, () => {
        if (this.paymentConfig.showStatusMessage) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
              .element,
          )
        } else {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
          )
        }

        DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
          invoiceId: this.paymentConfig.invoiceId,
          returnUrl: this.paymentConfig.invoiceDetails.return_url,
        })
      })

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_ERROR, e => {
        if (this.paymentConfig.showStatusMessage) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
              .element,
          )
        } else {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
          )
        }

        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(e)
      })
    }

    private getNativeApmWrapper() {
      const wrapper = HTMLElements.createElement({
        tagName: "div",
        classNames: ["dco-native-apm-payment-method-wrapper"],
      })

      return wrapper
    }
  }
}
