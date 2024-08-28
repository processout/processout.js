/// <reference path="../references.ts" />

type NativeApmPaymentConfigType = {
  gatewayConfigurationId: string;
  invoiceId: string;
  returnUrl?: string;
};

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling configuration of the widget
   */
  export class NativeApmPaymentConfig {
    /**
     * Native APM gateway configuration ID
     * @type {NativeApmPaymentConfigType['gatewayConfigurationId']}
     */
    gatewayConfigurationId: NativeApmPaymentConfigType['gatewayConfigurationId'];

    /**
     * Native APM invoice ID
     * @type {NativeApmPaymentConfigType['invoiceId']}
     */
    invoiceId: NativeApmPaymentConfigType['invoiceId'];

    /**
     * Native APM invoice return url
     * @type {NativeApmPaymentConfigType['invoiceId']}
     */
    returnUrl?: NativeApmPaymentConfigType['returnUrl'];

    /**
     * NativeApm constructor
     * @param  {NativeApmConfig} config
     */
    constructor(config: NativeApmPaymentConfigType) {
      this.setConfig(config);
    }

    /**
     * This function returns config of NativeAPM instance
     */
    public getConfig(): NativeApmPaymentConfigType {
      return {
        gatewayConfigurationId: this.gatewayConfigurationId,
        invoiceId: this.invoiceId,
      };
    }

    /**
     * This function sets config of Native APM widgets
     */
    private setConfig(config: NativeApmPaymentConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Exception(
          'default',
          'You must instantiate Native APM with a valid config in order to use it'
        );
      }

      this.gatewayConfigurationId = config.gatewayConfigurationId;
      this.invoiceId = config.invoiceId;
      this.returnUrl = config.returnUrl;
    }

    /**
     * This function validates if the config is valid
     */
    private isValidConfig(config: NativeApmPaymentConfigType) {
      return config.gatewayConfigurationId && config.invoiceId;
    }
  }
}
