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
        var GocardlessGateway = (function (_super) {
            __extends(GocardlessGateway, _super);
            /**
             * Constructor, copies data to object
             */
            function GocardlessGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            /**
             * Setup the current gateway (such as loading the required js library)
             * @return {void}
             */
            GocardlessGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.instance.debug)
                    f.setAttribute("src", "https://pay-sandbox.gocardless.com/js/beta");
                else
                    f.setAttribute("src", "https://pay.gocardless.com/js/beta");
                document.body.appendChild(f);
            };
            /**
             * Get the gateway's HTML
             * @return {string}
             */
            GocardlessGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-gocardless') + "\">\n                        " + this.htmlSEPA() + "\n                    </div>";
            };
            /**
             * Stripe uses the same code for one-off, recurring and authorizations
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            GocardlessGateway.prototype.handleForm = function (el, success, error) {
                throw new Error("GoCardless is not supported by processout.js yet.");
            };
            /**
             * Handle the gateway's form submission for one-off payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            GocardlessGateway.prototype.handleOneOff = function (el, success, error) {
                throw new Error("GoCardless does not support one-off payments.");
            };
            /**
             * Handle the gateway's form submission for recurring invoice payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            GocardlessGateway.prototype.handleRecurring = function (el, success, error) {
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
            GocardlessGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return GocardlessGateway;
        }(Gateways.Gateway));
        Gateways.GocardlessGateway = GocardlessGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
