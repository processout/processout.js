/// <reference path="../references.ts" />

type NativeApmPaymentConfigType = {
  gatewayConfigurationId: string;
  invoiceId: string;
  returnUrl?: string;
  pollingMaxTimeout?: number;
};

module ProcessOut {
  export class NativeApmPaymentConfig {
    gatewayConfigurationId: NativeApmPaymentConfigType["gatewayConfigurationId"];
    invoiceId: NativeApmPaymentConfigType["invoiceId"];
    pollingMaxTimeout: NativeApmPaymentConfigType["pollingMaxTimeout"];
    returnUrl?: NativeApmPaymentConfigType["returnUrl"];

    constructor(config: NativeApmPaymentConfigType) {
      this.setConfig(config);
    }

    public getConfig(): NativeApmPaymentConfigType {
      return {
        gatewayConfigurationId: this.gatewayConfigurationId,
        invoiceId: this.invoiceId,
        returnUrl: this.returnUrl,
        pollingMaxTimeout: this.pollingMaxTimeout,
      };
    }

    private setConfig(config: NativeApmPaymentConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Exception(
          "default",
          "You must instantiate Native APM with a valid config in order to use it"
        );
      }

      this.gatewayConfigurationId = config.gatewayConfigurationId;
      this.invoiceId = config.invoiceId;
      this.returnUrl = config.returnUrl;
      this.pollingMaxTimeout = config.pollingMaxTimeout || 180;
    }

    private isValidConfig(config: NativeApmPaymentConfigType) {
      return config.gatewayConfigurationId && config.invoiceId;
    }
  }
}
