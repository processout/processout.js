/// <reference path="./references.ts" />

module ProcessOut {
  export class DynamicCheckout {
    processOutInstance: ProcessOut;
    paymentConfig: DynamicCheckoutPaymentConfig;
    dcoContainer: Element;
    widgetWrapper: Element;
    invoiceDetails: Invoice;

    constructor(
      processOutInstance: ProcessOut,
      config: DynamicCheckoutPaymentConfigType
    ) {
      this.processOutInstance = processOutInstance;
      this.paymentConfig = new DynamicCheckoutPaymentConfig(config);
    }

    public mount(containerSelector: string) {
      this.dcoContainer = document.querySelector(containerSelector);

      if (!this.dcoContainer) {
        throw new Error(
          "Element with this selector does not exist. You must provide a valid element selector"
        );
      }

      this.applyDynamicStyles();

      return this.getInvoiceDetails({
        onFetch: DynamicCheckoutEventsUtils.dispatchWidgetLoadingEvent,
        onSuccess: this.onGetInvoiceSuccess.bind(this),
        onError: this.onGetInvoiceError.bind(this),
      });
    }

    private getInvoiceDetails(actions: {
      onFetch: Function;
      onSuccess: Function;
      onError: Function;
    }) {
      actions.onFetch();

      this.processOutInstance.apiRequest(
        "GET",
        `invoices/${this.paymentConfig.invoiceId}?expand=transaction`,
        {},
        actions.onSuccess.bind(this),
        actions.onError.bind(this),
        0,
        {
          isLegacy: false,
          clientSecret: this.paymentConfig.clientSecret,
        },
      )
    }

    private onGetInvoiceSuccess(data: any) {
      if (!data.success) {
        this.loadErrorView();

        return DynamicCheckoutEventsUtils.dispatchInvoiceFetchingErrorEvent(
          data
        );
      }

      if (data.invoice.transaction.status !== 'waiting') {
        this.loadErrorView("We were unable to process your payment.");

        return DynamicCheckoutEventsUtils.dispatchTransactionErrorEvent({
          invoiceId: data.invoice.id,
          returnUrl: data.invoice.return_url,
        });
      }

      this.paymentConfig.setInvoiceDetails(data.invoice);

      this.loadDynamicCheckoutView();
    }

    private onGetInvoiceError(
      req: XMLHttpRequest,
      e: ProgressEvent,
      errorCode: ApiRequestError
    ) {
      let errorData = req.response;

      if (!req.response && errorCode)
        errorData = {
          success: false,
          error_type: errorCode,
          message: Translator.translateError(errorCode),
        };

      this.loadErrorView()
      DynamicCheckoutEventsUtils.dispatchInvoiceFetchingErrorEvent(errorData);
    }

    private loadErrorView(text?: string) {
      const errorView = document.createElement("div");
      errorView.setAttribute("class", "dco-error-view");
      errorView.innerText = text || "Something went wrong. Please try again.";
      this.loadView(errorView);
    }

    public loadDynamicCheckoutView() {
      const paymentMethodsView = new DynamicCheckoutPaymentMethodsView(
        this,
        this.processOutInstance,
        this.paymentConfig,
      );

      this.loadView(paymentMethodsView.getViewElement());

      paymentMethodsView.setupEventListeners();
      paymentMethodsView.loadExternalClients();

      DynamicCheckoutEventsUtils.dispatchWidgetReadyEvent();
    }

    private loadView(view: HTMLElement) {
      if (this.widgetWrapper) {
        this.dcoContainer.removeChild(this.widgetWrapper);
      }

      this.widgetWrapper = this.createWidgetWrapper();

      this.widgetWrapper.appendChild(view);
      this.dcoContainer.appendChild(this.widgetWrapper);
    }

    private createWidgetWrapper() {
      const widgetWrapper = document.createElement("div");

      widgetWrapper.setAttribute("class", "dynamic-checkout-widget-wrapper");

      return widgetWrapper;
    }

    private applyDynamicStyles() {
      const styleElement = document.createElement("style");
      styleElement.innerHTML = dynamicStyles;
      document.head.appendChild(styleElement);
    }
  }
}
