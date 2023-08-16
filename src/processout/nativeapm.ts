/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * Native APM class
   */
  export class NativeApm {
    /**
     * ProcessOut instance
     * @var {ProcessOut}
     */
    protected instance: ProcessOut;

    /**
     * Iframe with NativeAPM app
     * request
     * @type {string}
     */
    protected iframe: HTMLIFrameElement;

    /**
     * Configuration of the NativeApm
     * request
     * @type {NativeApmConfig}
     */
    protected config: NativeApmConfig;

    /**
     * NativeApm constructor.
     * @param {ProcessOut} instance
     */
    public constructor(
      instance: ProcessOut,
      invoiceId: string,
      gatewayConfigurationId: string
    ) {
      this.instance = instance;
      this.config = new NativeApmConfig();
      this.config.setPaymentData({ invoiceId, gatewayConfigurationId });
    }

    /**
     * Sets theme of the NativeAPM
     * @param {any} config
     */
    public setTheme(theme: any) {
      this.config.setTheme(theme);
    }

    /**
     * Sets payment data of the NativeAPM
     * @param {any} config
     */
    public setPayment({ invoiceId, gatewayConfigurationId }: any) {
      this.config.setPaymentData({ invoiceId, gatewayConfigurationId });
    }

    /**
     * Mounts NativeAPM widget on the page
     * @param {string} containerSelector
     */
    public mount(containerSelector: string) {
      this.iframe = document.createElement('iframe');
      this.iframe.setAttribute('src', '../scripts/nativeapm/index.html');
      this.iframe.setAttribute('frameborder', '0');
      this.iframe.style.width = 'inherit';
      this.iframe.onload = () => {
        setTimeout(() => {
          this.iframe.contentWindow.postMessage(this.config.get(), '*');
        }, 0);
      };
      document.querySelector(containerSelector).appendChild(this.iframe);
    }
  }
}
