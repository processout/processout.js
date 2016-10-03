/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway handler class
     */
    export class Handler {

        /**
         * Build a gateway object depending on the gateway name in the data
         * @param {ProcessOut} instance
         * @param {GatewayConfiguration} gatewayConfiguration
         * @return {Gateway}
         */
        public static buildGateway(p: ProcessOut,
            gatewayConfiguration: GatewayConfiguration): Gateway {

            switch (gatewayConfiguration.gateway.name) {
            case "stripe":
                return new StripeGateway(gatewayConfiguration, p);
            case "checkoutcom":
                return new CheckoutcomGateway(gatewayConfiguration, p);
            case "adyen":
                return new AdyenGateway(gatewayConfiguration, p);
            case "braintree":
                return new BraintreeGateway(gatewayConfiguration, p);
            
            // ProcessOut test environment
            case "test-credit-card":
                return new TestGateway(gatewayConfiguration, p);
            }

            throw new Exception("request.gateway.not-supported");
        }

    }

}
