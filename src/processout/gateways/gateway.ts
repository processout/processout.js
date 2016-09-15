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
         * ProcessOut API URL of the resource that interacts with the gateway
         * @type {string}
         */
        protected resourceURL: string;

        /**
         * Requested payment/authorization flow
         * @type {Flow}
         */
        protected flow: Flow;

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
         * @type {Object[]}
         */
        protected publicKeys: {key: string, value: string}[];

        /**
         * Slice containing the available methods of the gateway
         * @type {string[]}
         */
        protected supportedMethod: string[];

        /**
         * Constructor, copies data to object
         * @param {ProcessOut} instance
         * @param {Object} data
         * @param {string} resourceURL
         * @param {Flow} flow
         */
        constructor(instance: ProcessOut, data, resourceURL: string, flow: Flow) {
            this.instance = instance;

            this.resourceURL = resourceURL;
            this.flow        = flow;

            this.name            = data.name;
            this.displayName     = data.display_name;
            this.publicKeys      = data.public_keys;
            this.supportedMethod = data.supported_methods;
        }

        /**
         * Get the endpoint for the current flow
         * @return {string}
         */
        protected getEndpoint(async: boolean): string {
            switch (this.flow) {
            case Flow.OneOff:
                if (!async)
                    return this.resourceURL+`/gateways/${this.name}`;
                else
                    return this.resourceURL+`/gateways/${this.name}/charges`;

            case Flow.Subscription:
            case Flow.Tokenization:
                if (!async)
                    return this.resourceURL+`/gateways/${this.name}`;
                else
                    return this.resourceURL+`/gateways/${this.name}/tokens`;

            default:
                throw new Error("Could not find flow.");
            }
        }

        /**
         * Get the requested public key in the publicKey object array
         * @param {string} key
         * @return {string}
         */
        getPublicKey(key: string): string {
            for (var v of this.publicKeys) {
                if (v.key == key) {
                    return v.value;
                }
            }

            return "";
        }

        /**
         * Setup the current gateway (such as loading the required js library)
         * @return {void}
         */
        setup(): void {
            //
        }

        /**
         * Handle the gateway's form submission
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        handle(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            switch (this.flow) {
            case Flow.OneOff:
                return this.handleOneOff(el, success, error);
            case Flow.Subscription:
                return this.handleRecurring(el, success, error);
            case Flow.Tokenization:
                return this.handleOneClickAuthorization(el, success, error);

            default:
                throw new Error("The flow may be not handled.");
            }
        }

        /**
         * Handle the gateway's form submission for one-off payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleOneOff(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void;

        /**
         * Handle the gateway's form submission for recurring invoice payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleRecurring(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void;

        /**
         * Handle the gateway's form submission for one-click authorizations
         * flow
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleOneClickAuthorization(el: HTMLElement,
            success: (gateway: string) => void, error: (err: Error) => void): void;

    }

}
