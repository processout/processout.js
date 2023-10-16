/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling success view
   */
  export class NativeApmSuccessView {
    /**
     * Instance of JS library which handles markdown
     * @type {any}
     */
    markdownLibraryInstance: any;

    /**
     * Gateway configuration data
     * @type {GatewayConfiguration}
     */
    gatewayConfiguration: GatewayConfiguration;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM form element
     * @type {HTMLElement}
     */
    viewElement: HTMLElement;

    /**
     * Native APM Form constructor
     */
    constructor(
      gatewayConfiguration: GatewayConfiguration,
      markdownLibraryInstance: any,
      theme: NativeApmThemeConfigType
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
      const paymentSuccessStatus = this.createPaymentSuccessStatusImage();

      wrapper.appendChild(merchantImg);
      wrapper.appendChild(customerMessage);
      wrapper.appendChild(paymentSuccessStatus);

      return wrapper;
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
     * This function creates the customer message element
     */
    private createCustomerMessage() {
      const customerMessage = document.createElement('p');

      customerMessage.setAttribute('class', 'native-apm-message');
      StylesUtils.styleElement(customerMessage, this.theme.message);

      customerMessage.innerHTML =
        this.markdownLibraryInstance && this.markdownLibraryInstance.makeHtml
          ? this.markdownLibraryInstance.makeHtml(
              TextUtils.getText('paymentSuccessMessage')
            )
          : TextUtils.getText('paymentSuccessMessage');

      return customerMessage;
    }

    /**
     * This function creates the customer message element
     */
    private createPaymentSuccessStatusImage() {
      const paymentSuccessStatusImage = document.createElement('img');

      StylesUtils.styleElement(
        paymentSuccessStatusImage,
        this.theme.actionImage
      );

      paymentSuccessStatusImage.setAttribute(
        'class',
        'native-apm-action-image'
      );
      paymentSuccessStatusImage.setAttribute(
        'src',
        'https://js.processout.com/images/native-apm-assets/payment_success_image.svg'
      );

      return paymentSuccessStatusImage;
    }
  }
}
