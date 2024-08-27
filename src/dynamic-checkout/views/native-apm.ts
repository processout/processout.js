/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutNativeApmView {
    dynamicCheckout: DynamicCheckout;
    processOutInstance: ProcessOut;
    paymentConfig: DynamicCheckoutPaymentConfigType;

    constructor(
      dynamicCheckout: DynamicCheckout,
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.dynamicCheckout = dynamicCheckout;
      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;
    }

    public setupNativeApmWidget(
      container: HTMLElement,
      gatewayConfigurationId: string
    ): void {
      const nativeApm = this.processOutInstance.setupNativeApm(
        {
          gatewayConfigurationId,
          invoiceId: this.paymentConfig.invoiceId,
        },
        {
          dynamicCheckout: {
            onBackButtonClick: () => this.dynamicCheckout.loadDynamicCheckoutView(),
          },
        }

    );

      nativeApm.mount(`.${container.className}`);
    }
  }
}
