/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class CardFieldValue {
        public number:      string;
        public expiryMonth: string;
        public expiryYear:  string;
        public cvc:         string;
        public name:        string;
        public metadata:    string;
    }

    export class CardFieldSettings {
        public type:        string;
        public placeholder: string;
        public style:       string;
    }

    /**
     * Card field class
     */
    export class CardField {
        /** 
         * Number is the credit card field type number
         * @type {string}
         */
        public static number = "number";

        /** 
         * Expiry is the credit card field type expiration date
         * @type {string}
         */
        public static expiry = "expiry";

        /** 
         * ExpiryMonth is the credit card field type expiration month
         * @type {string}
         */
        public static expiryMonth = "expiry-month";

        /** 
         * ExpiryYear is the credit card field type expiration year
         * @type {string}
         */
        public static expiryYear = "expiry-year";

        /** 
         * CVC is the credit card field type cvc
         * @type {string}
         */
        public static cvc = "cvc";

        /** 
         * Timeout is the number of ms to wait before timing out a field
         * @type {string}
         */
        protected static timeout = 10000;

        /** 
         * instance is the current ProcessOut instance
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /** 
         * Type is the type of the field
         * @type {string}
         */
        protected type: string;

        /** 
         * El is the parent of the iframe used to embed the field
         * @type {string}
         */
        protected el: HTMLElement;

        /** 
         * Iframe is the iframe embedding the field
         * @type {string}
         */
        protected iframe: HTMLIFrameElement;
        
        /**
         * CardField constructor
         * @param {ProcessOut} instance
         * @param {string} type
         * @param {HTMLElement} el
         */
        public constructor(instance: ProcessOut, type: string, 
            container: HTMLElement, success: () => void, 
            error: (err: Exception) => void) {

            if (!container) {
                throw new Exception("processout-js.undefined-field");
            }
            if (container instanceof HTMLInputElement) {
                throw new Exception("processout-js.invalid-field");
            }

            if (type != CardField.number &&
                type != CardField.expiry &&
                type != CardField.expiryMonth &&
                type != CardField.expiryYear &&
                type != CardField.cvc)
                throw new Exception("processout-js.invalid-field-type");

            this.instance = instance;
            this.type     = type;
            this.el       = container;

            this.spawn(success, error);
        }

        /**
         * Spawn spawns the iframe used to embed the field
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        protected spawn(success: ()                 => void, 
                        error:   (err:   Exception) => void): void {
            this.iframe = document.createElement('iframe');
            this.iframe.className = "processout-field-cc-iframe";
            this.iframe.setAttribute("src", this.instance.endpoint("checkout", "vault/field"));
            this.iframe.setAttribute("style", "background: none; height: 100%; width: 100%;");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("allowtransparency", "1");
            // Hide the field until it's ready
            this.iframe.style.display = "none";

            var errored = false
            var t       = this;
            var iframeError = setTimeout(function() {
                errored = true;
                if (typeof(error) === typeof(Function))
                    error(new Exception("processout-js.field.unavailable"));
            }, CardField.timeout);
            this.iframe.onload = function() {
                if (errored)
                    return;

                // Hook the ok message
                window.addEventListener("message", function (event) {
                    if (event.source != t.iframe.contentWindow)
                        return;

                    if (errored)
                        return;

                    var data = Message.parseEvent(event);
                    if (data.namespace != Message.fieldNamespace)
                        return;

                    // We will first wait for an alive signal from the iframe.
                    // Once we've received it, we will send a setup action,
                    // and the iframe should reply with a ready state

                    if (data.action == "alive") {
                        var settings = new CardFieldSettings();
                        settings.type        = t.type;
                        settings.placeholder = t.el.getAttribute("data-processout-placeholder");
                        settings.style       = t.el.getAttribute("data-processout-style");

                        // The field's iframe is available, let's set it up
                        t.iframe.contentWindow.postMessage(JSON.stringify({
                            "namespace": Message.fieldNamespace,
                            "projectID": t.instance.getProjectID(),
                            "action":    "setup",
                            "data":      settings
                        }), "*");
                    } 

                    if (data.action == "ready") {
                        // It's now ready
                        t.iframe.style.display = "block";
                        clearTimeout(iframeError);
                        success();
                    }                    
                });
            };

            this.el.appendChild(this.iframe);
        }

        /** 
         * Validate validates the field
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        public validate(success: ()               => void,
                        error:   (err: Exception) => void): void {
            var id = Math.random().toString();

            // Ask the iframe for its value
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "validate"
            }), "*");

            // Our timeout, just in case
            var fetchingTimeout =
                setTimeout(function(){
                    error(new Exception("processout-js.field.unavailable"));
                }, CardField.timeout);
            
            var t = this;
            window.addEventListener("message", function (event) {
                if (event.source != t.iframe.contentWindow)
                    return;

                var data = Message.parseEvent(event);
                if (data.namespace != Message.fieldNamespace)
                    return;
                if (data.messageID != id)
                    return;
                if (data.action != "validate")
                    return;

                clearTimeout(fetchingTimeout);

                if (data.data) {
                    error(new Exception(data.data));
                    return;
                }

                success();
            });
        }

        /** 
         * Value asyncronously fetches the card field value. The returned 
         * value is encrypted
         * @param {callback} callback
         * @param {callback} error
         * @return {void}
         */
        public value(callback: (val: CardFieldValue) => void,
                     error:    (err: Exception)      => void): void {
            var id = Math.random().toString();

            // Ask the iframe for its value
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "value"
            }), "*");

            // Our timeout, just in case
            var fetchingTimeout =
                setTimeout(function(){
                    error(new Exception("processout-js.field.unavailable"));
                }, CardField.timeout);
            
            var t = this;
            window.addEventListener("message", function (event) {
                if (event.source != t.iframe.contentWindow)
                    return;

                var data = Message.parseEvent(event);
                if (data.namespace != Message.fieldNamespace)
                    return;
                if (data.messageID != id)
                    return;
                if (data.action != "value")
                    return;

                clearTimeout(fetchingTimeout);

                callback(data.data);
            });
        }
    }
}
