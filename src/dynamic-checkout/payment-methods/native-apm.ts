/// <reference path="../../references.ts" />

module ProcessOut {
  export class NativeApmPaymentMethod extends PaymentMethodButton {
    private static activePaymentMethod: NativeApmPaymentMethod | null = null

    private nativeApmInstance: NativeApm
    private paymentConfig: DynamicCheckoutPaymentConfig
    private isMounted: boolean
    private paymentMethodName: string
    private resetContainerHtml: () => HTMLElement
    protected processOutInstance: ProcessOut

    private onPaymentSubmit?: () => void

    constructor(
      processOutInstance: ProcessOut,
      paymentMethod: PaymentMethod,
      paymentConfig: DynamicCheckoutPaymentConfig,
      resetContainerHtml: () => HTMLElement,
      onPaymentSubmit?: () => void,
    ) {
      const { display, apm } = paymentMethod
      const { invoiceId, invoiceDetails } = paymentConfig

      super(processOutInstance, display.name, display.logo.dark_url.vector, display.name)

      this.paymentConfig = paymentConfig
      this.paymentMethodName = apm.gateway_name
      this.processOutInstance = processOutInstance
      this.resetContainerHtml = resetContainerHtml
      this.onPaymentSubmit = onPaymentSubmit

      const wrapper = this.getNativeApmWrapper()
      super.appendChildren(wrapper)
      const theme = this.paymentConfig.getThemeForMethod(this.paymentMethodName)
      const textOverrides = this.paymentConfig.getTextOverridesForMethod(this.paymentMethodName)

      this.nativeApmInstance = this.processOutInstance.setupNativeApm({
        invoiceId,
        gatewayConfigurationId: apm.gateway_configuration_id,
        returnUrl: invoiceDetails.return_url,
        payButtonText: textOverrides.payButtonText,
        locale: paymentConfig.locale,
      })

      const backgroundColor =
        theme && theme.payButtonColor ? theme.payButtonColor : "#242C38"

      const color = theme && theme.payButtonTextColor ? theme.payButtonTextColor : "white"

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
        NativeApmPaymentMethod.activePaymentMethod = this

        if (!this.isMounted) {
          this.nativeApmInstance.mount(wrapper)
          this.isMounted = true
        }
      })

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_INIT, () => {
        if (!this.isActivePaymentMethod()) {
          return
        }

        if (this.onPaymentSubmit) {
          this.onPaymentSubmit()
        }
      })

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_SUCCESS, () => {
        if (!this.isActivePaymentMethod()) {
          return
        }

        if (this.paymentConfig.getOptionsForMethod(this.paymentMethodName).showStatusMessage) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentSuccessView(this.processOutInstance, this.paymentConfig)
              .element,
          )
        } else if (
          !this.paymentConfig.getOptionsForMethod(this.paymentMethodName).showStatusMessage &&
          !this.paymentConfig.invoiceDetails.return_url
        ) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
          )
        }

        DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
          invoice_id: this.paymentConfig.invoiceId,
          return_url: this.paymentConfig.invoiceDetails.return_url || null,
          payment_method_name: this.paymentMethodName,
        })

        NativeApmPaymentMethod.activePaymentMethod = null
      })

      window.addEventListener(NATIVE_APM_EVENTS.PAYMENT_ERROR, e => {
        if (!this.isActivePaymentMethod()) {
          return
        }

        if (this.paymentConfig.getOptionsForMethod(this.paymentMethodName).showStatusMessage) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentErrorView(this.processOutInstance, this.paymentConfig)
              .element,
          )
        } else if (
          !this.paymentConfig.getOptionsForMethod(this.paymentMethodName).showStatusMessage &&
          !this.paymentConfig.invoiceDetails.return_url
        ) {
          this.resetContainerHtml().appendChild(
            new DynamicCheckoutPaymentInfoView(this.processOutInstance, this.paymentConfig).element,
          )
        }

        DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
          this.paymentConfig.invoiceId,
          e,
          this.paymentMethodName,
          undefined,
          this.paymentConfig.invoiceDetails.return_url || null,
        )

        NativeApmPaymentMethod.activePaymentMethod = null
      })
    }

    private isActivePaymentMethod() {
      return NativeApmPaymentMethod.activePaymentMethod === this
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
