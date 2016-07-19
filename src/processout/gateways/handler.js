/// <reference path="../../references.ts" />
/**
 * ProcessOut Gateways module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        /**
         * ProcessOut Gateway handler class
         */
        var Handler = (function () {
            function Handler() {
            }
            /**
             * Build a gateway object depending on the gateway name in the data
             * @param {ProcessOut} instance
             * @param {Object} data
             * @param {string} resourceURL
             * @param {Flow} flow
             * @return {Gateway}
             */
            Handler.buildGateway = function (instance, data, resourceURL, flow) {
                switch (data.name) {
                    case "stripe":
                        return new Gateways.StripeGateway(instance, data, resourceURL, flow);
                    case "checkoutcom":
                        return new Gateways.CheckoutcomGateway(instance, data, resourceURL, flow);
                    case "adyen":
                        return new Gateways.AdyenGateway(instance, data, resourceURL, flow);
                    case "checkoutcom":
                        return new Gateways.GocardlessGateway(instance, data, resourceURL, flow);
                }
                // Defaulting to link gateway
                return new Gateways.LinkGateway(instance, data, resourceURL, flow);
            };
            return Handler;
        }());
        Gateways.Handler = Handler;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
