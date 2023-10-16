/// <reference path="../references.ts" />

type NativeApmErrorData = {
  gateway?: {
    logo_url: string;
  };
  errorMessage?: string;
};

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling error view
   */
  export class NativeApmErrorView {
    /**
     * Native APM view element
     * @type {HTMLElement}
     */
    viewElement: HTMLElement;

    /**
     * Error view data
     * @type {NativeApmErrorData}
     */
    errorData: NativeApmErrorData;

    /**
     * Theme of the Native APM form
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM Form constructor
     */
    constructor(
      errorData: NativeApmErrorData,
      theme: NativeApmThemeConfigType
    ) {
      if (!errorData) {
        throw new Exception(
          'default',
          'Error data is not defined. You must provide valid error data'
        );
      }

      this.errorData = errorData;
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

      if (merchantImg) {
        wrapper.appendChild(merchantImg);
      }

      wrapper.appendChild(customerMessage);

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
      if (!this.errorData.gateway) {
        return null;
      }

      const merchantImg = document.createElement('img');

      merchantImg.setAttribute('class', 'native-apm-payment-provider-logo');
      merchantImg.setAttribute('src', this.errorData.gateway.logo_url);

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

      customerMessage.textContent =
        this.errorData.errorMessage || TextUtils.getText('genericError');

      return customerMessage;
    }
  }
}
