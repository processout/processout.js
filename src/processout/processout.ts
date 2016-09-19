/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut main class
     */
    export class ProcessOut {

        /**
         * Namespace used by ProcessOut when communicating between iframes
         * @type {string}
         */
        public static namespace: string = "processout";

        /**
         * Current resource ID. Can be invoice, subscription or authorization
         * request
         * @type {string}
         */
        protected resourceID: string;

        /**
         * Timeout before considering the modal could not be loaded, in ms
         * @type {Number}
         */
        public timeout = 10000;

        /**
        * Debug mode (will for instance load the sandboxed libraries of the
        * gateways instead of the live ones)
        * @type {string}
        */
        public debug = true;

        /**
        * Version of the API used by ProcessOut.js
        * @type {string}
        */
        public apiVersion = "1.3.0.0";

        /**
        * Configured, available gateways
        * @type {Gateways.Gateway[]}
        */
        gateways: Gateways.Gateway[] = new Array<Gateways.Gateway>();

        /**
         * ProcessOut constructor
         * @param  {string} resourceID
         */
        constructor(resourceID: string, debug?: boolean) {
            if (debug != null)
                this.debug = debug;

            // We want to make sure ProcessOut.js is loaded from ProcessOut CDN.
            var scripts = document.getElementsByTagName("script");
            var ok = false;
            for (var i = 0; i < scripts.length; i++) {
                if (/^https?:\/\/.*\.processout\.((com)|(ninja)|(dev))\//.test(
                    scripts[i].getAttribute("src"))) {

                    ok = true;
                }
            }

            if (!ok && !this.debug) {
                throw new Exception("processout-js.not-hosted");
            }

            this.resourceID = resourceID;
            if (this.resourceID.substring(0, 3) != "iv_" &&
                this.resourceID.substring(0, 4) != "sub_" &&
                this.resourceID.substring(0, 9) != "auth_req_" &&
                this.resourceID != "") {

                throw new Exception("resource.invalid-type");
            }
        }

        /**
         * Return the ID of the resource in the current context
         * @return {string}
         */
        public getResourceID(): string {
            return this.resourceID;
        }

        /**
         * Returns true if in debug mode, false otherwise
         * @return {boolean}
         */
        public isDebug(): boolean {
            return this.debug;
        }

        /**
         * Set gateways adds and configure the gateways supplied in the
         * parameters
         * @param  {GatewayConfiguration[]} gateways
         * @return {void}
         */
        public setGateways(gateways: GatewayConfiguration[]): void {
            for (var gc of gateways) {
                if (gc.id == "")
                    throw new Exception("processout-js.invalid-config",
                        "The gateway configuration must contain an ID.");
                var g = Gateways.Handler.buildGateway(this, gc);
                this.gateways.push(g);
            }
        }

        /**
         * Tokenize takes the credit card object and creates a ProcessOut
         * token that can be sent to your server and used to charge your
         * customer
         * @param  {ProcessOut.Card} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public tokenize(card: Card,
            success: (token: string) => void,
            error:   (err: Exception) => void): void {

            if (this.gateways.length == 0) {
                throw new Exception("request.gateway.not-available", "No gateway is available to tokenize a credit card.");
            }
            //TODO: Loop through every gateways to try and tokenize if the
            //tokenization didn't work
            this.gateways[0].tokenize(card, success, error);
        }

        /**
         * Get the ProcessOut endpoint of the given subdomain
         * @param  {string} subdomain
         * @param  {string} path
         * @return {string}
         */
        endpoint(subdomain: string, path: string): string {
            return `https://${subdomain}.processout.com${path}`;
        }

        /**
         * Perform a request to the ProcessOut API
         * @param  {string} method
         * @param  {string} path
         * @param  {Object} data
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        apiRequest(method: string, path: string, data,
            success: (data: any, code: number, req: XMLHttpRequest) => void,
            error: (code: number, req: XMLHttpRequest) => void): void {

            if (method != "get")
                data = JSON.stringify(data);
            else {
                path += "?";
                for (var key in data) {
                    path += `${key}=${encodeURIComponent(data[key])}&`;
                }
            }

            if (path.substring(0, 4) != "http" && path[0] != "/")
                path = this.endpoint("api", path);

            var request = new XMLHttpRequest();
            request.open(method, path, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("API-Version", this.apiVersion);

            request.onload = function() {
                if (request.status >= 200 && request.status < 300) {
                    success(JSON.parse(request.responseText), request.status, request);
                    return;
                }

                error(request.status, request);
            };
            request.onerror = function() {
                error(request.status, request);
            };

            request.send(data);
        }

        /**
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        newModal(url: string, success: (modal: Modal) => void,
            error: (err: Exception) => void): void {

            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = document.createElement('iframe');
            iframe.className = "processout-iframe";
            iframe.setAttribute("id", "processout-iframe-" + uniqId);
            iframe.setAttribute("src", url);
            iframe.setAttribute("style", "position: fixed; top: 0; left: 0; background: none;"
                    // We need to use translateZ instead of z-index, otherwise
                    // z-index might not work on some mobiles
                    +`-webkit-transform:translateZ(1px);
                    -moz-transform:translateZ(1px);
                    -o-transform:translateZ(1px);
                    transform:translateZ(1px);`);
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowtransparency", "1");

            // Hide and add our iframe to the DOM
            iframe.style.display = "none";

            var t = this;
            var iframeError = setTimeout(function() {
                if (typeof(error) === typeof(Function))
                    error(new Exception("processout-js.modal.unavailable"));
            }, this.timeout);
            iframe.onload = function() {
                clearTimeout(iframeError);
                if (typeof(success) === typeof(Function))
                    success(new Modal(t, iframe, uniqId));
            };

            document.body.appendChild(iframe);
        }

    }

}
