/// <reference path="../../references.ts" />
/// <amd-dependency path="https://js.stripe.com/v2/" />
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
        var LinkGateway = (function (_super) {
            __extends(LinkGateway, _super);
            /**
             * Constructor, copies data to object
             */
            function LinkGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            /**
             * Get the gateway's HTML
             * @return {string}
             */
            LinkGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', "gateway-" + this.name) + "\">\n                        " + this.htmlLink() + "\n                    </div>";
            };
            /**
             * Checkout.com uses the same code for one-off, recurring and
             * authorizations
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            LinkGateway.prototype.handleForm = function (el, success, error) {
                var t = this;
                this.instance.apiRequest("get", this.getEndpoint(false), this.getCustomerObject(), function (resp) {
                    if (!resp.success) {
                        error({
                            code: ProcessOut.ErrorCode.GatewayError,
                            message: resp.message
                        });
                        return;
                    }
                    window.location.href = resp.customer_action.url;
                }, function (request, err) {
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
            LinkGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            /**
             * Handle the gateway's form submission for recurring invoice payments
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            LinkGateway.prototype.handleRecurring = function (el, success, error) {
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
            LinkGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return LinkGateway;
        }(Gateways.Gateway));
        Gateways.LinkGateway = LinkGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
