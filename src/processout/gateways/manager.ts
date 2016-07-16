/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway manager class
     */
    export class Manager {

        /**
         * Build a gateway object depending on the gateway name in the data
         * @param {ProcessOut} instance
         * @param {Object} data
         * @return {Gateway}
         */
        public static buildGateway(instance: ProcessOut, data): Gateway {
            switch (data.name) {
            case "stripe":
                return new Stripe(instance, data);
            }

            // Defaulting to link gateway
        }
        
    }

}
