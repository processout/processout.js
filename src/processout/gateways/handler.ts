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
         * @param {Object} data
         * @param {string} resourceURL
         * @param {Flow} flow
         * @return {Gateway}
         */
        public static buildGateway(instance: ProcessOut, data,
            resourceURL: string, flow: Flow): Gateway {

            switch (data.name) {
            case "stripe":
                return new StripeGateway(instance, data, resourceURL, flow);
            case "checkoutcom":
                return new CheckoutcomGateway(instance, data, resourceURL, flow);
            }

            // Defaulting to link gateway
            return new LinkGateway(instance, data, resourceURL, flow);
        }

    }

}
