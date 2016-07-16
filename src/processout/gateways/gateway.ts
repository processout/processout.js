/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export abstract class Gateway {

        /**
         * ProcessOut instance
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * Code name of the gateway
         * @type {string}
         */
        protected name: string;

        /**
         * Displayable name of the gateway
         * @type {string}
         */
        protected displayName: string;

        /**
         * Map containing the public keys of the gateway
         * @type {[string, string]}
         */
        protected publicKeys: [string, string];

        /**
         * Slice containing the available methods of the gateway
         * @type {string[]}
         */
        protected methods: string[];

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data) {
            this.instance = instance;

            this.name        = data.name;
            this.displayName = data.display_name;
            this.publicKeys  = data.public_keys;
            this.methods     = data.methods;
        }

        abstract html(): string;

        abstract handle();

    }
    
}
