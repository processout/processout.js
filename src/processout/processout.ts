/// <reference path="../references.ts" />

declare var forge: any;

// declare the IE specific XDomainRequest object
declare var XDomainRequest: any;
interface Window {
    XDomainRequest?: any;
}

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
         * Project ID
         * @type {string}
         */
        protected projectID: string;

        /**
         * Project public key used to tokenize the credit cards
         * @type {string}
         */
        protected publicKey: string;

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
        * Sandbox mode. Is set to true if a project ID prefixed with `test-`
        * is used
        * @type {boolean}
        */
        public sandbox = false;
        
        /**
        * Host of ProcessOut. Is automatically updated to the correct one 
        * when the library loads
        * @type {string}
        */
        protected host = "processout.com";

        /**
        * Version of the API used by ProcessOut.js
        * @type {string}
        */
        public apiVersion = "1.3.0.0";

        /**
         * ProcessOut constructor
         * @param  {string} projectID
         * @param  {string} resourceID
         */
        constructor(projectID: string, resourceID: string) {
            // We want to make sure ProcessOut.js is loaded from ProcessOut CDN.
            var scripts = document.getElementsByTagName("script");
            var jsHost = "";
            for (var i = 0; i < scripts.length; i++) {
                if (/^https?:\/\/.*\.processout\.((com)|(ninja)|(dev))\//.test(
                    scripts[i].getAttribute("src"))) {

                    jsHost = scripts[i].getAttribute("src");
                }
            }

            if (jsHost == "") {
                throw new Exception("processout-js.not-hosted");
            }

            if (/^https?:\/\/.*\.processout\.ninja\//.test(jsHost)) {
                this.host = "processout.ninja";
            } else if (/^https?:\/\/.*\.processout\.dev\//.test(jsHost)) {
                this.host = "processout.dev";
            } else {
                this.host = "processout.com";
            }

            this.projectID = projectID;
            if (this.projectID.substring(0, 5) == "test-")
                this.sandbox = true;

            this.fetchPublicKey();

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
         * fetchPublicKey fetches the project public key used to later encrypt
         * the credit card fields
         * @return {void}
         */
        protected fetchPublicKey(): void {
            if (!this.projectID)
                return;

            var t = this;
            var err = function() {
                throw new Exception("default", `Could not fetch the project public key. Are you sure ${t.projectID} is the correct project ID?`);
            }

            this.apiRequest("post", this.endpoint("checkout", "vault"), {}, 
                function(data: any, code: number, req: XMLHttpRequest, 
                    e: Event): void {
                    
                    if (!data.success || !data.public_key) {
                        err();
                        return;
                    }

                    t.publicKey = data.public_key;
                }, function(code: number, req: XMLHttpRequest, e: Event): void {
                    err();
                });
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

            // Let's first validate the card
            var err = card.validate();
            if (err) {
                error(new Exception(err));
                return;
            }

            var metadata = {};
            if (this.sandbox) {
                // We just want to store in the metadata the test card type,
                // if any
                switch (card.getCVC()) {
                case "666":
                    metadata["test_card"] = "test-will-chargeback";
                    break;
                case "500":
                    metadata["test_card"] = "test-will-decline";
                    break;
                case "600":
                    metadata["test_card"] = "test-will-only-authorize";
                    break;

                default:
                    metadata["test_card"] = "test-valid"
                }
            }

            var c = forge.pki.publicKeyFromPem(this.publicKey);
            var e = function(str: string): string {
                return forge.util.encode64(c.encrypt(str, "RSA-OAEP", {
                    md: forge.md.sha256.create()
                }));
            }
            this.apiRequest("post", "cards", {
                "number":    e(card.getNumber()),
                "exp_month": e(card.getExpiry().getMonth().toString()),
                "exp_year":  e(card.getExpiry().getYear().toString()),
                "cvc2":      e(card.getCVC()),
                "name":      e(card.getName()),
                "metadata":  metadata
            }, function(data: any, code: number, req: XMLHttpRequest, e: Event): void {
                if (!data.success) {
                    error(new Exception("card.invalid"));
                    return
                }

                success(data.card.id);
            }, function(code: number, req: XMLHttpRequest, e: Event): void {
                error(new Exception("card.invalid"));
            });
        }

        /**
         * HandleAction handles the action needed to be performed by the
         * customer for the given gateway configuration
         * @param  {callback} success
         * @param  {callback} error
         * @return {ActionHandler}
         */
        public handleAction(
            url:     string,
            success: (token: string)    => void,
            error:   (err:   Exception) => void): ActionHandler {
            
            var handler = new ActionHandler(this, this.getResourceID());
            return handler.handle(url, success, error);
        }

        /**
         * Get the ProcessOut endpoint of the given subdomain
         * @param  {string} subdomain
         * @param  {string} path
         * @return {string}
         */
        endpoint(subdomain: string, path: string): string {
            return `https://${subdomain}.${this.host}/${path}`;
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
            success: (data: any, code: number, req: XMLHttpRequest, e: Event) => void,
            error:   (code: number, req: XMLHttpRequest, e: Event) => void,
            legacy?: boolean): void {

            // Force legacy if we have to
            if (window.XDomainRequest) {
                legacy = true;
            }

            if (path.substring(0, 4) != "http" && path[0] != "/")
                path = this.endpoint("api", path);

            var headers = {
                "Content-Type": "application/json",
                "API-Version":  this.apiVersion
            };
            if (this.projectID)
                headers["Authorization"] = `Basic ${btoa(this.projectID+":")}`;

            if (method != "get") {
                if (legacy)
                    path += `?legacyrequest=true`;
            } else {
                path += "?";
                if (legacy) {
                    data["legacyrequest"] = "true";
                    data.concat(headers);
                }
                for (var key in data) {
                    path += `${key}=${encodeURIComponent(data[key])}&`;
                }
            }

            var request = new XMLHttpRequest();
            // Handle legacy scenario
            if (legacy) {
                request = new XDomainRequest();

                // We also need to hack our request headers
                for (var k in headers)
                    data[`X-${k}`] = headers[k];

                request.open(method, path, true);
            } else {
                request.open(method, path, true);

                for (var k in headers)
                    request.setRequestHeader(k, headers[k]);
            }

            request.onload = function(e: any) {
                if (legacy)
                    success(JSON.parse(request.responseText), 200, request, e);
                else if (e.currentTarget.readyState == 4)
                    success(JSON.parse(request.responseText), request.status, 
                    request, e);
                return;
            };
            request.onerror = function(e: Event) {
                error(request.status, request, e);
            };

            request.send(JSON.stringify(data));
        }

        /**
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        newModal(url: string, 
            success: (modal: Modal)     => void,
            error:   (err:   Exception) => void): void {

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
