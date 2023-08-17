/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * Native APM Config class
   */
  export class NativeApmConfig {
    /**
     * Payment data of NativeAPM
     * request
     * @type {string}
     */
    protected payment: {
      invoiceId: string;
      gatewayConfigurationId: string;
    };

    /**
     * Theme of NativeAPM
     * request
     * @type {string}
     */
    protected theme: {
      // TODO: reuse it with Native APM React app
      colors: {
        primaryColor: string;
        secondaryColor: string;
      };
    };

    protected prefilledData: {
      email?: string;
    };

    /**
     * Gets config of NativeAPm
     */
    public get(): any {
      return {
        payment: this.payment,
        theme: this.theme,
        prefilledData: this.prefilledData,
      };
    }

    /**
     * Sets payment data of NativeAPM
     * @param {string} invoiceId
     * @param {string} gatewayConfigurationId
     */
    public setPaymentData({ invoiceId, gatewayConfigurationId }): void {
      this.payment = {
        invoiceId,
        gatewayConfigurationId,
      };
    }

    /**
     * Sets theme of NativeAPM
     * @param {any} theme
     */
    public setTheme(theme): void {
      this.theme = theme;
    }
    public prefillData(data): void {
      this.prefilledData = data;
    }
  }
}
