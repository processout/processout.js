/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class Stripe extends Gateway {

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data) {
            super(instance, data);
        }

        html(): string {
            return "";
        }

        handle() {
            //
        }

    }
    
}
