/// <reference path="../references.ts" />

type NativeApmConfigType = {
  gatewayConfigurationId: string;
  invoiceId: string;
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
     * @type {NativeApmConfigType['gatewayConfigurationId']}
     */
    gatewayConfigurationId: NativeApmConfigType['gatewayConfigurationId'];

    /**
     * Native APM invoice ID
     * @type {NativeApmConfigType['invoiceId']}
     */
    invoiceId: NativeApmConfigType['invoiceId'];

    /**
     * NativeApm constructor
     * @param  {NativeApmConfig} config
     */
    constructor(config: NativeApmConfigType) {
      this.setConfig(config);
    }

    /**
     * This function returns config of NativeAPM instance
     */
    public getConfig(): NativeApmConfigType {
      return {
        gatewayConfigurationId: this.gatewayConfigurationId,
        invoiceId: this.invoiceId,
      };
    }

    /**
     * This function sets config of Native APM widgets
     */
    private setConfig(config: NativeApmConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Exception(
          'default',
          'You must instantiate Native APM with a valid config in order to use it'
        );
      }

      this.gatewayConfigurationId = config.gatewayConfigurationId;
      this.invoiceId = config.invoiceId;
    }

    /**
     * This function validates if the config is valid
     */
    private isValidConfig(config: NativeApmConfigType) {
      return config.gatewayConfigurationId && config.invoiceId;
    }
  }
}
