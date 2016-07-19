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
        var AdyenGateway = (function (_super) {
            __extends(AdyenGateway, _super);
            /**
             * Constructor, copies data to object
             */
            function AdyenGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            /**
             * Setup the current gateway (such as loading the required js library)
             * @return {void}
             */
            AdyenGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");
                document.body.appendChild(f);
            };
            /**
             * Get the gateway's HTML
             * @return {string}
             */
            AdyenGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-adyen') + "\">\n                        " + this.htmlCreditCardWithName() + "\n                    </div>";
            };
            /**
             * Stripe uses the same code for one-off, recurring and authorizations
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            AdyenGateway.prototype.handleForm = function (el, success, error) {
                var Adyen = adyen.encrypt.createEncryption(this.getPublicKey("merchant_account"), {});
                var submitButton = el.querySelector("input[type=\"submit\"]");
                // We disable submit button to prevent from multiple submition
                submitButton.setAttribute("disabled", "1");
                var namef = el.getElementsByClassName(this.instance.classNames("credit-card-name-input"))[0];
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var validate = Adyen.validate({
                    "number": numberf.value,
                    "cvc": cvcf.value,
                    "month": Number(expmonthf.value),
                    "year": Number(expyearf.value)
                });
                for (var k in validate) {
                    if (!validate[k]) {
                        error({
                            code: ProcessOut.ErrorCode.GatewayInvalidInput,
                            message: "The provided credit card is invalid."
                        });
                        return;
                    }
                }
                var data = t.getCustomerObject();
                data.token = Adyen.encrypt({
                    number: numberf.value,
                    cvc: cvcf.value,
                    holderName: namef.value,
                    expiryMonth: Number(expmonthf.value),
                    expiryYear: Number(expyearf.value),
                    generationtime: Math.floor(Date.now() / 1000) // Timestamp
                });
                var t = this;
                this.instance.apiRequest("post", this.getEndpoint(true), data, function (resp) {
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
            };
            /**
             * Handle the gateway's form submission for one-off payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            AdyenGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            /**
             * Handle the gateway's form submission for recurring invoice payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            AdyenGateway.prototype.handleRecurring = function (el, success, error) {
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
            AdyenGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return AdyenGateway;
        }(Gateways.Gateway));
        Gateways.AdyenGateway = AdyenGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
