/// <reference path="../references.ts" />

module ProcessOut {
  export class NativeApmPendingView {
    markdownLibraryInstance: any;
    viewElement: HTMLElement;
    theme: NativeApmThemeConfigType;
    gatewayConfiguration: GatewayConfiguration;
    customerActionMessage: string;
    customerActionBarcode?: {
      type: string;
      value: string;
    };
    constructor(
      gatewayConfiguration: GatewayConfiguration,
      markdownLibraryInstance: any,
      theme: NativeApmThemeConfigType,
      capturePayment: Function,
      parameterValues?: {
        customer_action_message?: string;
        customer_action_barcode?: {
          type: string;
          value: string;
        };
      }
    ) {
      if (!gatewayConfiguration) {
        throw new Exception(
          "default",
          "Gateway configuration is not defined. You must provide valid gateway configuration"
        );
      }

      this.markdownLibraryInstance = markdownLibraryInstance;
      this.gatewayConfiguration = gatewayConfiguration;
      this.theme = theme;
      this.customerActionMessage =
        parameterValues && parameterValues.customer_action_message
          ? parameterValues.customer_action_message
          : "";
      this.customerActionBarcode =
        parameterValues && parameterValues.customer_action_barcode
          ? parameterValues.customer_action_barcode
          : undefined;

      this.viewElement = this.createViewElement();

      capturePayment();
    }

    public getViewElement() {
      return this.viewElement;
    }

    private createViewElement() {
      const wrapper = this.createWrapper();
      const merchantImg = this.createMerchantImageElement();
      const customerMessage = this.createCustomerMessage();
      const customerMessageImage = this.customerActionBarcode
        ? this.createQrCode()
        : this.createCustomerMessageImage();
      const loadingSpinner = this.createLoadingSpinner();

      wrapper.appendChild(merchantImg);
      wrapper.appendChild(customerMessage);
      wrapper.appendChild(loadingSpinner);
      wrapper.appendChild(customerMessageImage);

      return wrapper;
    }

    private createMerchantImageElement() {
      const merchantImg = document.createElement("img");

      merchantImg.setAttribute("class", "native-apm-payment-provider-logo");
      merchantImg.setAttribute(
        "src",
        this.gatewayConfiguration.native_apm.gateway.logo_url
      );

      StylesUtils.styleElement(merchantImg, this.theme.logo);

      return merchantImg;
    }

    private createWrapper() {
      const wrapper = document.createElement("div");

      wrapper.setAttribute("class", "native-apm-view-wrapper");

      StylesUtils.styleElement(wrapper, this.theme.wrapper);

      return wrapper;
    }

    private createCustomerMessage() {
      const customerMessage = document.createElement("p");

      customerMessage.setAttribute("class", "native-apm-message");

      StylesUtils.styleElement(customerMessage, this.theme.message);

      const message =
        this.gatewayConfiguration.native_apm.gateway.customer_action_message ||
        this.customerActionMessage;

      customerMessage.innerHTML =
        this.markdownLibraryInstance && this.markdownLibraryInstance.makeHtml
          ? this.markdownLibraryInstance.makeHtml(message)
          : message;

      return customerMessage;
    }

    private createLoadingSpinner() {
      const spinner = new NativeApmSpinner(this.theme).getSpinnerElement();

      StylesUtils.styleElement(spinner, this.theme.spinner);

      return spinner;
    }

    private createCustomerMessageImage() {
      const customerMessageImage = document.createElement("img");

      StylesUtils.styleElement(customerMessageImage, this.theme.actionImage);

      customerMessageImage.setAttribute("class", "native-apm-action-image");
      customerMessageImage.setAttribute(
        "src",
        this.gatewayConfiguration.native_apm.gateway.customer_action_image_url
      );

      return customerMessageImage;
    }

    private createQrCode() {
      const qrCodeElement = document.createElement("div");
      StylesUtils.styleElement(qrCodeElement, this.theme.actionImage);

      const text =
        this.customerActionBarcode && this.customerActionBarcode.value
          ? atob(this.customerActionBarcode.value)
          : null;

      window.globalThis.QRCode &&
        text &&
        new window.globalThis.QRCode(qrCodeElement, {
          text,
          width: 128,
          height: 128,
        });

      return qrCodeElement;
    }
  }
}
