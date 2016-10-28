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
         * configuration of the gateway
         * @type {GatewayConfiguration}
         */
        protected configuration: GatewayConfiguration;

        /**
         * ProcessOut instance of the current context
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * Token needed by the gateway to perform the tokenization
         * @type {string}
         */
        protected token: string;

        /**
         * Constructor, copies data to object
         * @param {GatewayConfiguration} gatewayConfiguration
         * @param {ProcessOut} instance
         */
        constructor(gatewayConfiguration: GatewayConfiguration,
            instance: ProcessOut) {

            this.configuration = gatewayConfiguration;
            this.instance      = instance;

            this.setup();
            this.fetchCustomerAction();
        }

        /**
         * Return the given public key, or an empty string if not found
         * @param {string} key
         * @return {string}
         */
        protected getPublicKey(key: string): string {
            if (this.configuration.public_keys[key])
                return this.configuration.public_keys[key];

            return "";
        }

        /**
         * Fetches the customer action of the gateway, if any. It is possible
         * that the API route does not respond with a 200 status code, but
         * this error is silently ignored as it does not mean the gateway
         * can't be used: it simply means there might not be any customer
         * action available - or to be done - for this specific gateway
         * @return {void}
         */
        protected fetchCustomerAction(): void {
            var r = this.instance.getResourceID();

            var t = this;
            var actionHandler = function(data: any, code: number, 
                req: XMLHttpRequest) {

                if (code < 200 || code > 299 || !data.customer_action) {
                    // if the customer action is undefined, we'll land here
                    return;
                }

                t.token = data.customer_action.value;
            };

            if (r.substring(0, 4) == "sub_") {
                // Subscription case
                this.instance.apiRequest("GET", 
                    `subscriptions/${r}/customer-actions/${this.configuration.id}`, 
                    null, actionHandler,
                    function(code: number, req: XMLHttpRequest): void {});
            } else if (r.substring(0, 9) == "auth_req_") {
                // Authorization request case
                this.instance.apiRequest("GET", 
                    `authorization-requests/${r}/customer-actions/${this.configuration.id}`, 
                    null, actionHandler,
                    function(code: number, req: XMLHttpRequest): void {});
            } else {
                // Fallback to invoice case
                this.instance.apiRequest("GET", 
                    `invoices/${r}/customer-actions/${this.configuration.id}`, 
                    null, actionHandler, 
                    function(code: number, req: XMLHttpRequest): void {});
            }
        }

        /**
         * Setup the current gateway (such as loading the required js library)
         * @return {void}
         */
        protected abstract setup(): void;

        /**
         * Tokenize takes the credit card object and creates a ProcessOut
         * token that can be sent to your server and used to charge your
         * customer
         * @param  {ProcessOut.Card} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public abstract tokenize(card: ProcessOut.Card,
            success: (token: string) => void,
            error:   (err: ProcessOut.Exception) => void): void;

        /**
         * Create a ProcessOut gateway request token from a given token
         * @param {string} token
         * @return {string}
         */
        protected createProcessOutToken(token: string): string {
            var req                    = new GatewayRequest();
            req.method                 = "POST";
            req.gatewayConfigurationID = this.configuration.id;
            req.headers                = {
                "content-type": "application/json"
            };
            req.body                   = JSON.stringify({"token": token});
            return req.token();
        }

    }

}
