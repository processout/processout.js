/// <reference path="../../references.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * ProcessOut Gateways module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        /**
         * ProcessOut Gateway class
         */
        var CheckoutcomGateway = (function (_super) {
            __extends(CheckoutcomGateway, _super);
            /**
             * Constructor, copies data to object
             */
            function CheckoutcomGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            /**
             * Setup the current gateway (such as loading the required js library)
             * @return {void}
             */
            CheckoutcomGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.instance.debug)
                    f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
                else
                    f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
                f.setAttribute("data-namespace", "CKOAPI");
                document.body.appendChild(f);
            };
            /**
             * Get the gateway's HTML
             * @return {string}
             */
            CheckoutcomGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-checkoutcom') + "\">\n                        " + this.htmlCreditCard() + "\n                    </div>";
            };
            /**
             * Checkout.com uses the same code for one-off, recurring and
             * authorizations
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            CheckoutcomGateway.prototype.handleForm = function (el, success, error) {
                var submitButton = el.querySelector("input[type=\"submit\"]");
                // We disable submit button to prevent from multiple submition
                submitButton.setAttribute("disabled", "1");
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var t = this;
                try {
                    CKOAPI.configure({
                        publicKey: t.getPublicKey("public_key"),
                        apiError: function (event) {
                            submitButton.removeAttribute("disabled");
                            // 7xxx errors are validation errors
                            if (event.data.errorCode[0] == "7")
                                error({
                                    code: ProcessOut.ErrorCode.GatewayInvalidInput,
                                    message: event.data.message
                                });
                            else
                                error({
                                    code: ProcessOut.ErrorCode.GatewayError,
                                    message: event.data.message
                                });
                        }
                    });
                    CKOAPI.createCardToken({
                        "number": numberf.value,
                        "cvv": cvcf.value,
                        "expiryMonth": Number(expmonthf.value),
                        "expiryYear": Number(expyearf.value)
                    }, function (v) {
                        if (!v.id)
                            return;
                        // Checkout.com token correctly generated, let's charge it
                        var data = t.getCustomerObject();
                        data.token = v.id;
                        t.instance.apiRequest("post", t.getEndpoint(true), data, function (resp) {
                            submitButton.removeAttribute("disabled");
                            if (!resp.success) {
                                error({
                                    code: ProcessOut.ErrorCode.GatewayError,
                                    message: resp.message
                                });
                                return;
                            }
                            if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(resp.url)) {
                                success(t.name);
                                return;
                            }
                            window.location.href = resp.url;
                        }, function (request, err) {
                            submitButton.removeAttribute("disabled");
                            error({
                                code: ProcessOut.ErrorCode.ProcessOutUnavailable,
                                message: "An error occured trying to communicate with ProcessOut"
                            });
                        });
                    });
                }
                catch (err) {
                    submitButton.removeAttribute("disabled");
                    error({
                        code: ProcessOut.ErrorCode.GatewayError,
                        message: err
                    });
                }
            };
            /**
             * Handle the gateway's form submission for one-off payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            CheckoutcomGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            /**
             * Handle the gateway's form submission for recurring invoice payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            CheckoutcomGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            /**
             * Handle the gateway's form submission for one-click authorizations
             * flow
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            CheckoutcomGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return CheckoutcomGateway;
        }(Gateways.Gateway));
        Gateways.CheckoutcomGateway = CheckoutcomGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
