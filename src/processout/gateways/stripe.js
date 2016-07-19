/// <reference path="../../references.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../definitions/stripe.d.ts" />
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
        var StripeGateway = (function (_super) {
            __extends(StripeGateway, _super);
            /**
             * Constructor, copies data to object
             */
            function StripeGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            /**
             * Setup the current gateway (such as loading the required js library)
             * @return {void}
             */
            StripeGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://js.stripe.com/v2/");
                document.body.appendChild(f);
            };
            /**
             * Get the gateway's HTML
             * @return {string}
             */
            StripeGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-stripe') + "\">\n                        " + this.htmlCreditCard() + "\n                    </div>";
            };
            /**
             * Stripe uses the same code for one-off, recurring and authorizations
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            StripeGateway.prototype.handleForm = function (el, success, error) {
                Stripe.setPublishableKey(this.getPublicKey("public_key"));
                var submitButton = el.querySelector("input[type=\"submit\"]");
                // We disable submit button to prevent from multiple submition
                submitButton.setAttribute("disabled", "1");
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var t = this;
                try {
                    Stripe.card.createToken({
                        number: numberf.value,
                        cvc: cvcf.value,
                        exp_month: Number(expmonthf.value),
                        exp_year: Number(expyearf.value)
                    }, function (status, response) {
                        if (response.error) {
                            submitButton.removeAttribute("disabled");
                            error({
                                code: ProcessOut.ErrorCode.GatewayInvalidInput,
                                message: response.error.message
                            });
                            return;
                        }
                        // Stripe token correctly generated, let's charge it
                        var data = t.getCustomerObject();
                        data.token = response.id;
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
            StripeGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            /**
             * Handle the gateway's form submission for recurring invoice payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            StripeGateway.prototype.handleRecurring = function (el, success, error) {
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
            StripeGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return StripeGateway;
        }(Gateways.Gateway));
        Gateways.StripeGateway = StripeGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
