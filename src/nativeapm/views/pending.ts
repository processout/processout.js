/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling pending view
   */
  export class NativeApmPendingView {
    /**
     * Instance of JS library which handles markdown
     * @type {any}
     */
    markdownLibraryInstance: any;
    /**
     * Native APM form element
     * @type {HTMLElement}
     */
    viewElement: HTMLElement;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Gateway configuration data
     * @type {GatewayConfiguration}
     */
    gatewayConfiguration: GatewayConfiguration;

    /**
     * Native APM Form constructor
     */
    constructor(
      gatewayConfiguration: GatewayConfiguration,
      markdownLibraryInstance: any,
      theme: NativeApmThemeConfigType,
      capturePayment: Function
    ) {
      if (!gatewayConfiguration) {
        throw new Exception(
          'default',
          'Gateway configuration is not defined. You must provide valid gateway configuration'
        );
      }

      this.markdownLibraryInstance = markdownLibraryInstance;
      this.gatewayConfiguration = gatewayConfiguration;
      this.theme = theme;
      this.viewElement = this.createViewElement();

      capturePayment();
    }

    /**
     * This function returns the view element
     */
    public getViewElement() {
      return this.viewElement;
    }

    /**
     * This function creates the view element
     */
    private createViewElement() {
      const wrapper = this.createWrapper();
      const merchantImg = this.createMerchantImageElement();
      const customerMessage = this.createCustomerMessage();
      const customerMessageImage = this.createCustomerMessageImage();
      const loadingSpinner = this.createLoadingSpinner();

      wrapper.appendChild(merchantImg);
      wrapper.appendChild(customerMessage);
      wrapper.appendChild(loadingSpinner);
      wrapper.appendChild(customerMessageImage);

      return wrapper;
    }

    /**
     * This function creates the merchant image element
     */
    private createMerchantImageElement() {
      const merchantImg = document.createElement('img');

      merchantImg.setAttribute('class', 'native-apm-payment-provider-logo');
      merchantImg.setAttribute(
        'src',
        this.gatewayConfiguration.native_apm.gateway.logo_url
      );

      StylesUtils.styleElement(merchantImg, this.theme.logo);

      return merchantImg;
    }

    /**
     * This function creates the wrapper element
     */
    private createWrapper() {
      const wrapper = document.createElement('div');

      wrapper.setAttribute('class', 'native-apm-view-wrapper');

      StylesUtils.styleElement(wrapper, this.theme.wrapper);

      return wrapper;
    }

    /**
     * This function creates the customer message element
     */
    private createCustomerMessage() {
      const customerMessage = document.createElement('p');

      customerMessage.setAttribute('class', 'native-apm-message');

      StylesUtils.styleElement(customerMessage, this.theme.message);

      customerMessage.innerHTML =
        this.markdownLibraryInstance && this.markdownLibraryInstance.makeHtml
          ? this.markdownLibraryInstance.makeHtml(
              this.gatewayConfiguration.native_apm.gateway
                .customer_action_message
            )
          : this.gatewayConfiguration.native_apm.gateway
              .customer_action_message;

      return customerMessage;
    }

    /**
     * This function creates loading spinner
     */
    private createLoadingSpinner() {
      const spinner = new NativeApmSpinner(this.theme).getSpinnerElement();

      StylesUtils.styleElement(spinner, this.theme.spinner);

      return spinner;
    }

    /**
     * This function creates the customer message element
     */
    private createCustomerMessageImage() {
      const customerMessageImage = document.createElement('img');

      StylesUtils.styleElement(customerMessageImage, this.theme.actionImage);

      customerMessageImage.setAttribute('class', 'native-apm-action-image');
      customerMessageImage.setAttribute(
        'src',
        this.gatewayConfiguration.native_apm.gateway.customer_action_image_url
      );

      return customerMessageImage;
    }
  }
}
