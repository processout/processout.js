/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut GatewayConfiguration class
     */
    export class GatewayConfiguration {
        public id:          string;
        public public_keys: {[key: string]: string};
        public gateway:     {name: string};
    }

}
