/// <reference path="./references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Dynamic Checkout class
   */
  export class DynamicCheckout {
    /**
     * ProcessOut instance
     * @type {ProcessOut}
     */
    processOutInstance: ProcessOut

    /**
     * Dynamic Checkout container element for mounting the widget
     * @type {Element}
     */
    dcoContainer: Element

    /**
     * Dynamic Checkout widget wrapper element for styling purposes
     * @type {Element}
     */
    widgetWrapper: Element

    /**
     * Configuration of Dynamic Checkout payment
     * @type {DynamicCheckoutConfig}
     */
    paymentConfig: DynamicCheckoutConfig

    /**
     * Invoice details
     * @type {Invoice}
     */
    invoiceDetails: Invoice

    /**
     * DynamicCheckout constructor
     * @param  {ProcessOut} processOutInstance
     * @param  {DynamicCheckoutConfigType} paymentConfig
     */
    constructor(processOutInstance: ProcessOut, paymentConfig: DynamicCheckoutConfigType) {
      this.processOutInstance = processOutInstance
      this.paymentConfig = new DynamicCheckoutConfig(paymentConfig)
    }

    /**
     * This function gets invoice details
     */
    private getInvoiceDetails(actions: {
      onFetch: Function
      onSuccess: Function
      onError: Function
    }) {
      this.processOutInstance.apiRequest(
        "GET",
        `invoices/${this.paymentConfig.invoiceId}?expand=transaction`,
        {},
        actions.onSuccess.bind(this),
        actions.onError.bind(this),
        0,
        {
          isLegacy: false,
          customerSecret: this.paymentConfig.clientSecret,
        },
      )
    }

    private onGetInvoiceError(req: XMLHttpRequest, e: ProgressEvent, errorCode: ApiRequestError) {
      let errorData = req.response
      if (!req.response && errorCode)
        errorData = {
          success: false,
          error_type: errorCode,
          message: Translator.translateError(errorCode),
        }

      DynamicCheckoutEventsUtils.dispatchInvoiceFetchingErrorEvent(errorData)
    }

    private onGetInvoiceSuccess(data: any) {
      if (!data.success) {
        return DynamicCheckoutEventsUtils.dispatchInvoiceFetchingErrorEvent(data)
      }

      const { invoice } = data
      this.invoiceDetails = invoice
      this.paymentConfig.paymentMethods = invoice.payment_methods
      this.performMounting()
    }

    public mount(containerSelector: string) {
      this.dcoContainer = document.querySelector(containerSelector)

      if (!this.dcoContainer) {
        throw new Error(
          "Element with this selector does not exist. You must provide a valid element selector",
        )
      }

      this.getInvoiceDetails({
        onFetch: DynamicCheckoutEventsUtils.dispatchWidgetLoadingEvent,
        onSuccess: this.onGetInvoiceSuccess.bind(this),
        onError: this.onGetInvoiceError.bind(this),
      })
    }

    private performMounting() {
      const formView = new DynamicCheckoutFormView(this.paymentConfig)
      this.loadView(formView.getViewElement())
      formView.postSetup()

      DynamicCheckoutEventsUtils.dispatchWidgetReadyEvent()
    }

    private loadView(view: HTMLElement) {
      if (this.widgetWrapper) {
        this.dcoContainer.removeChild(this.widgetWrapper)
      }

      this.widgetWrapper = this.createWidgetWrapper()
      this.widgetWrapper.appendChild(view)
      this.dcoContainer.appendChild(this.widgetWrapper)
    }

    private createWidgetWrapper() {
      const widgetWrapper = document.createElement("div")
      widgetWrapper.setAttribute("class", "dynamic-checkout-widget-wrapper")

      return widgetWrapper
    }
  }
}
