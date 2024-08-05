/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutNativeApmView {
    processOutInstance: ProcessOut;
    paymentConfig: DynamicCheckoutPaymentConfigType;

    constructor(
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;
    }

    public setupNativeApmWidget(
      container: HTMLElement,
      gatewayConfigurationId: string
    ): void {
      const nativeApm = this.processOutInstance.setupNativeApm({
        gatewayConfigurationId,
        invoiceId: this.paymentConfig.invoiceId,
      });

      nativeApm.mount(`.${container.className}`);
    }
  }
}
