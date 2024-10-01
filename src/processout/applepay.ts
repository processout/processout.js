/// <reference path="../references.ts" />
/// <reference path="applepay.d.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ActionHandler is the class handling the customer actions
   */
  export class ApplePay {
    /**
     * ProcessOut instance of the current context
     * @type {ProcessOut}
     */
    protected instance: ProcessOut;

    /**
     * Apple Pay payment request
     * @type {ApplePayPaymentRequest}
     */
    protected request: ApplePayPaymentRequest;

    /**
     * Apple Pay session
     * @type {ApplePaySession}
     */
    protected session: ApplePaySession;

    /**
     * Additional data sent along when creating the ProcessOut card. Can
     * contain things like metadata or cardholder names
     * @type {any}
     */
    protected data: any;

    /**
     * onSuccess is the handler called when a successful
     * Apple Pay authorization was done
     * @type {(e: any, card: Card) => void}
     */
    protected onsuccess: (e: any, card: Card) => void;

    /**
     * onError is the handler called (when set) when an error occurs
     * during the Apple Pay flow
     * @type {(e: any) => void}
     */
    protected onerror: (err: Exception) => void;

    /**
     * onCancel can be set to handle the event when the user cancels the
     * payment on the Apple Pay payment sheet
     * @type {(event: any) => void}
     */
    public oncancel: (event: any) => void;

    /**
     * onPaymentMethodSelected handles events when the user selects a new
     * payment method on the Apple Pay payment sheet
     * @type {(event: any) => void}
     */
    public onpaymentmethodselected: (event: any) => void;

    /**
     * onShippingContactSelected handles events when the user selects
     * a new shipping contact on the Apple Pay payment sheet
     * @type {(event: any) => void}
     */
    public onshippingcontactselected: (event: any) => void;

    /**
     * onShippingMethodSelected handles events when the user selects
     * a new shipping method on the Apple Pay payment sheet
     * @type {(event: any) => void}
     */
    public onshippingmethodselected: (event: any) => void;

    /**
     * onpaymentauthorizedPostprocess is the handler for onpaymentauthorized event (called when the Apple Pay payment is authorized).
     * It is called when the default onpaymentauthorized handler returns.
     * @type {(event: any) => void}
     */
    public onpaymentauthorizedPostprocess: (event: any) => void;

    /**
     * ApplePay constructor
     * @param {ProcessOut} instance
     * @param {ApplePayPaymentRequest} req
     */
    constructor(instance: ProcessOut, req: ApplePayPaymentRequest) {
      this.instance = instance;

      // We want to set sensible defaults on the Apple Pay request if
      // it wasn't previously set by the merchant
      if (!req.merchantCapabilities || !req.merchantCapabilities.length)
        req.merchantCapabilities = ["supports3DS"];
      if (!req.supportedNetworks || !req.supportedNetworks.length)
        req.supportedNetworks = ["amex", "discover", "masterCard", "visa"];
      this.request = req;

      // Let's now create the session so we can wrap it in our
      // Apple Pay class

      this.session = new ApplePaySession(
        req.applePaySessionVersion || 1,
        this.request
      );

      // Hook the session events we need
      var t = this;
      this.session.onvalidatemerchant = function (event: any): void {
        t.instance.apiRequest(
          "post",
          t.instance.endpoint("api", "/applepay/sessions"),
          {
            session_url: event.validationURL,
            domain_name: window.location.hostname,
            merchant_certificate_id: t.request.merchantCertificateId,
            applepay_mid: t.request.merchantApplePayCertificateId,
          },
          function (data: any, req: XMLHttpRequest, e: Event): void {
            if (!data.success) {
              t.onerror(new Exception(data.error_code, data.message));
              t.session.abort();
            } else t.session.completeMerchantValidation(data.session_payload);
          },
          function (
            req: XMLHttpRequest,
            e: Event,
            errorCode: ApiRequestError
          ): void {
            t.onerror(new Exception(errorCode));
            t.session.abort();
          }
        );
      };

      // Default onpaymentauthorized handler
      this.session.onpaymentauthorized = function (event: any): void {
        var req = t.data;
        if (!req) req = {};
        req.applepay_response = event.payment;
        req.token_type = "applepay";
        req.applepay_mid = t.request.merchantApplePayCertificateId;
        t.instance.apiRequest(
          "post",
          t.instance.endpoint("api", "/cards"),
          req,
          function (data: any, req: XMLHttpRequest, e: Event): void {
            if (!data.success) {
              t.onerror(new Exception(data.error_code, data.message));
              t.session.abort();
            } else {
              // first data.card was meant originally to be token (not whole card), leaving it here for backwards compatibility
              // second data.card is to keep api cohesive
              t.onsuccess(data.card, data.card);
            }
          },
          function (
            req: XMLHttpRequest,
            e: Event,
            errorCode: ApiRequestError
          ): void {
            t.onerror(new Exception(errorCode));
            t.session.abort();
          }
        );

        // Replay the onpaymentauthorized event for the postprocess handler
        t.onpaymentauthorizedPostprocess(event);
      };

      // Register onpaymentauthorized postprocess handler for the user (fired when the default onpaymentauthorized handler returns)
      this.onpaymentauthorizedPostprocess =
        this.onPaymentAuthorizedPostprocessHandler.bind(this);
      // As well as the other ones
      this.session.oncancel = this.onCancelHandler.bind(this);
      this.session.onshippingcontactselected =
        this.onShippingContactSelectedHandler.bind(this);
      this.session.onshippingmethodselected =
        this.onShippingMethodSelectedHandler.bind(this);
    }

    /**
     * SetHandlers sets the success and error handlers
     * @param {(e: any) => void} onsuccess
     * @param {(err: Exception) => void} onerror
     * @return {void}
     */
    protected setHandlers(
      onsuccess: (e: any, card: Card) => void,
      onerror?: (err: Exception) => void
    ): void {
      if (!onsuccess) throw new Exception("applepay.no-success-handler");
      this.onsuccess = onsuccess;
      this.onerror = function (err: Exception): void {
        if (onerror) onerror(err);
      };
    }

    /**
     * Tokenize handles the Apple Pay payment sheet
     * @param {any} data
     * @param {(e: any) => void} onsuccess
     * @param {(err: Exception) => void} onerror
     * @return {void}
     */
    public tokenize(
      data: any,
      onsuccess: (e: any, card: Card) => void,
      onerror?: (err: Exception) => void
    ): void {
      this.setHandlers(onsuccess, onerror);
      this.data = data;
      this.session.begin();
    }

    /**
     * Abort aborts the Apple Pay payment flow and hides the payment sheet
     * @return {void}
     */
    public abort(): void {
      this.session.abort();
    }

    /**
     * completePayment finishes the payment flow and either show an
     * Apple Pay payment error, or hides the payment sheet after showing
     * a success message
     * @param {ApplePayStatusCode} status
     * @return {void}
     */
    public completePayment(status: ApplePayStatusCodes): void {
      this.session.completePayment(status);
    }

    /**
     * completePaymentMethodSelection must be called
     * from onpaymentmethodselected
     * @param newTotal
     * @param newLineItems
     * @return {void}
     */
    public completePaymentMethodSelection(
      newTotal: any,
      newLineItems: any
    ): void {
      this.session.completePaymentMethodSelection(newTotal, newLineItems);
    }

    /**
     * completeShippingContactSelection must be called
     * from onshippingcontactselected
     * @param status
     * @param newShippingMethods
     * @param newTotal
     * @param newLineItems
     * @return {void}
     */
    public completeShippingContactSelection(
      status: ApplePayStatusCodes,
      newShippingMethods: any,
      newTotal: any,
      newLineItems: any
    ): void {
      this.session.completeShippingContactSelection(
        status,
        newShippingMethods,
        newTotal,
        newLineItems
      );
    }

    /**
     * completeShippingMethodSelection must be called from
     * onshippingmethodselected
     * @param status
     * @param newTotal
     * @param newLineItems
     * @return {void}
     */
    public completeShippingMethodSelection(
      status: ApplePayStatusCodes,
      newTotal: any,
      newLineItems: any
    ): void {
      this.session.completeShippingMethodSelection(
        status,
        newTotal,
        newLineItems
      );
    }

    /**
     * getSession returns the underlying ApplePaySession object
     * @return {ApplePaySession}
     */
    public getSession(): ApplePaySession {
      return this.session;
    }

    /**
     * onCancel is fired when the user cancels the Apple Pay session
     * @param {any} event
     * @return {void}
     */
    protected onCancelHandler(event: any): void {
      if (this.oncancel) this.oncancel(event);
    }

    /**
     * onPaymentMethodSelected is fired when the user selects a new
     * payment method on the Apple Pay payment sheet
     * @param {any} event
     * @return {void}
     */
    protected onPaymentMethodSelectedHandler(event: any): void {
      if (this.onpaymentmethodselected) this.onpaymentmethodselected(event);
    }

    /**
     * onShippingContactSelected is fired when the user selects a new
     * shipping contact on the Apple Pay payment sheet
     * @param {any} event
     * @return {void}
     */
    protected onShippingContactSelectedHandler(event: any): void {
      if (this.onshippingcontactselected) this.onshippingcontactselected(event);
    }

    /**
     * onShippingMethodSelected is fired when the user selects a new
     * shipping method on the Apple Pay payment sheet
     * @param {any} event
     * @return {void}
     */
    protected onShippingMethodSelectedHandler(event: any): void {
      if (this.onshippingmethodselected) this.onshippingmethodselected(event);
    }

    /**
     * onpaymentauthorizedPostprocess is the handler for onpaymentauthorized event (called when the Apple Pay payment is authorized).
     * It is called after the default onpaymentauthorized handler.
     * @param {any} event
     * @return {void}
     */
    protected onPaymentAuthorizedPostprocessHandler(event: any): void {
      if (this.onpaymentauthorizedPostprocess)
        this.onpaymentauthorizedPostprocess(event);
    }
  }
}
