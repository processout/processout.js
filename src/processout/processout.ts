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
         * Project ID
         * @type {string}
         */
        protected projectID: string;

        /**
         * Project public key used to tokenize the credit cards
         * @type {string}
         */
        protected publicKey?: string;

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
        constructor(projectID?: string, resourceID?: string) {
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
            if (this.projectID && this.projectID.substring(0, 5) == "test-")
                this.sandbox = true;

            this.fetchPublicKey();

            this.resourceID = resourceID;
            if (this.resourceID &&
                this.resourceID != "" &&
                this.resourceID.substring(0, 3) != "iv_" &&
                this.resourceID.substring(0, 4) != "sub_" &&
                this.resourceID.substring(0, 9) != "auth_req_") {

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
         * Return the ID of the project in the current context
         * @return {string}
         */
        public getProjectID(): string {
            return this.projectID;
        }

        /**
         * fetchPublicKey fetches the project public key used to later encrypt
         * the credit card fields
         * @return {void}
         */
        protected fetchPublicKey(): void {
            if (!this.projectID)
                return;

            this.publicKey = "";

            var t = this;
            var err = function() {
                t.publicKey = null;
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
         * Encrypt encrypts the given string
         * @param {string} str
         * @return {string}
         */
        public encrypt(str: string): string {
            return forge.util.encode64(forge.pki.publicKeyFromPem(this.publicKey)
                .encrypt(str, "RSA-OAEP", {
                    md: forge.md.sha256.create()
                }));
        }

        /**
         * Get the ProcessOut endpoint of the given subdomain
         * @param  {string} subdomain
         * @param  {string} path
         * @return {string}
         */
        public endpoint(subdomain: string, path: string): string {
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
        public apiRequest(method: string, path: string, data,
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
         * SetupForm setups a new form and embed the credit cards fields
         * to it, and returns the created card form
         * @param {HTMLElement} form
         * @param {callback} success
         * @param {callback} error
         * @return {CardForm}
         */
        public setupForm(form: HTMLElement, 
            success:        (form: CardForm)          => void, 
            error:          (err: Exception)          => void,
            eventCallback?: (name: string, data: any) => void): CardForm {

            if (!this.projectID)
                throw new Exception("default", "You must instanciate ProcessOut.js with a valid project ID in order to use ProcessOut's hosted forms.")

            return new CardForm(this).setup(form, success, error, eventCallback);
        }

        /**
         * Tokenize takes the credit card object and creates a ProcessOut
         * token that can be sent to your server and used to charge your
         * customer
         * A CardForm may also be provided instead of a card if the fields
         * are hosted by ProcessOut
         * @param  {Card | CardForm} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public tokenize(val: Card | CardForm, cardHolder: CardHolder,
            success: (token: string)  => void,
            error:   (err: Exception) => void): void {

            if (this.publicKey === null)
                throw new Exception("default", "The project public key could not be fetched. Most of the time, this happens because of an invalid project ID specified when instanciating ProcessOut.js.");

            if (val instanceof Card)
                return this.tokenizeCard(<Card>val, cardHolder, success, error);

            return this.tokenizeForm(<CardForm>val, cardHolder, success, error);
        }

        /**
         * TokenizeCard takes the credit card object and creates a ProcessOut
         * token that can be sent to your server and used to charge your
         * customer
         * @param  {Card | CardForm} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public tokenizeCard(card: Card, cardHolder: CardHolder,
            success: (token: string) => void,
            error:   (err: Exception) => void): void {

            // Let's first validate the card
            var err = card.validate();
            if (err) {
                error(err);
                return;
            }

            this.tokenizeEncrypted(this.encrypt(card.getNumber()), 
                this.encrypt(card.getExpiry().getMonth().toString()),
                this.encrypt(card.getExpiry().getYear().toString()),
                this.encrypt(card.getCVC()),
                cardHolder, {}, success, error);
        }

        /**
         * TokenizeForm takes the card form and tokenizes the card
         * @param  {CardForm} form
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public tokenizeForm(form: CardForm, cardHolder: CardHolder,
            success: (token: string)  => void,
            error:   (err: Exception) => void): void {
            
            var t = this;
            form.validate(function() {
                form.fetchValues(function(number: string, cvc: string, 
                    expMonth: string, expYear: string, metadata: any) {

                    t.tokenizeEncrypted(number, expMonth, expYear, cvc, 
                        cardHolder, metadata, success, error);
                }, function(err: Exception) {
                    error(err);
                });
            }, error);
        }

        /**
         * TokenizeEncrypted tokenizes the given encrypted card data
         * @param {string} number
         * @param {string} expMonth
         * @param {string} expYear
         * @param {string} cvc
         * @param {CardHolder} cardHolder
         * @param {any} metadata
         * @param {callback} success
         * @param {callback} error
         */
        protected tokenizeEncrypted(number: string, expMonth: string, 
            expYear: string, cvc: string, cardHolder: CardHolder, metadata: any,
            success: (token: string) => void,
            error:   (err: Exception) => void): void {

            if (!this.projectID)
                throw new Exception("default", "No project ID was set when instanciating ProcessOut.js. To tokenize a card, a project ID must be set.");

            var cardHolderName;
            if (cardHolder && cardHolder.name)
                cardHolderName = this.encrypt(cardHolder.name);

            this.apiRequest("post", "cards", {
                "number":    number,
                "exp_month": expMonth,
                "exp_year":  expYear,
                "cvc2":      cvc,
                "name":      cardHolderName
            }, function(data: any, code: number, 
                req: XMLHttpRequest, e: Event): void {

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
         * setupFormCVC setups a new form and embed the CVC field
         * to it, and returns the created card form
         * @param {HTMLElement} form
         * @param {callback} success
         * @param {callback} error
         * @param {callback?} eventCallback
         * @return {CardForm}
         */
        public setupFormCVC(form: HTMLElement, 
            success:        (form: CardForm)          => void, 
            error:          (err: Exception)          => void,
            eventCallback?: (name: string, data: any) => void): CardForm {

            return new CardForm(this).setupCVC(form, success, error, 
                eventCallback);
        }

        /**
         * RefreshCVC updates the given card CVC code so that it can be used
         * to process the next payment.
         * A CardForm may also be provided instead of a string if the CVC
         * field is hosted by ProcessOut
         * @param  {string} cardUID
         * @param  {string | CardForm} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public refreshCVC(cardUID: string, val: string | CardForm,
            success: (token: string)  => void,
            error:   (err: Exception) => void): void {

            if (val instanceof CardForm)
                return this.refreshCVCForm(cardUID, <CardForm>val, 
                    success, error);

            return this.refreshCVCString(cardUID, <string>val, success, error);
        }

        /**
         * refreshCVCForm refreshes the card CVC using the given form to 
         * fetch the CVC value
         * @param  {string}   cardUID
         * @param  {CardForm} form
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public refreshCVCForm(cardUID: string, form: CardForm,
            success: (token: string)  => void,
            error:   (err: Exception) => void): void {

            var t = this;
            form.validate(function() {
                form.getCVCField().value(function(val: CardFieldValue): void {
                    t.refreshCVCEncrypted(cardUID, val.cvc, success, error);
                }, function(err: Exception) {
                    error(err)
                });
            }, error);
        }

        /**
         * refreshCVCString refreshes the given card CVC
         * @param  {string}   cardUID
         * @param  {string}   cvc
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public refreshCVCString(cardUID: string, cvc: string,
            success: (token: string) => void,
            error:   (err: Exception) => void): void {

            // Let's first validate the CVC
            var err = Card.validateCVC(cvc);
            if (err) {
                error(err);
                return;
            }

            this.refreshCVCEncrypted(cardUID, this.encrypt(cvc), success, error);
        }

        /**
         * refreshCVCEncrypted refreshes the card CVC using the given encrypted
         * CVC code
         * @param {string} cardUID
         * @param {string} cvc
         * @param {callback} success
         * @param {callback} error
         */
        protected refreshCVCEncrypted(cardUID: string, cvc: string,
            success: (token: string) => void,
            error:   (err: Exception) => void): void {

            if (!this.projectID)
                throw new Exception("default", "No project ID was set when instanciating ProcessOut.js. To refresh a card CVC, a project ID must be set.");

            this.apiRequest("put", `cards/${cardUID}`, {
                "cvc": cvc
            }, function(data: any, code: number, 
                req: XMLHttpRequest, e: Event): void {

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
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public newModal(url: string, 
            success: (modal: Modal)     => void,
            error:   (err:   Exception) => void): void {

            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = document.createElement('iframe');
            iframe.className = "processout-iframe";
            iframe.setAttribute("id", "processout-iframe-" + uniqId);
            iframe.setAttribute("src", url);
            iframe.setAttribute("style", "position: fixed; top: 0; left: 0; background: none;z-index:9999999;");
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
    }
}
