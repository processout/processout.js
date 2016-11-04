/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

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
        protected static timeout = 1000;

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
            el: HTMLElement) {

            if (el instanceof HTMLInputElement) {
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
            this.el       = el;

            this.spawn(function(){}, function(){});
        }

        /**
         * Spawn spawns the iframe used to embed the field
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        protected spawn(success: (token: CardField) => void, 
                        error:   (err:   Exception) => void): void {
            this.iframe = document.createElement('iframe');
            this.iframe.className = "processout-field-cc-iframe";
            this.iframe.setAttribute("src", this.instance.endpoint("checkout", "/vault/field"));
            this.iframe.setAttribute("style", "background: none;");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("allowtransparency", "1");

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

                // The field's iframe is available, let's set it up
                t.iframe.contentWindow.postMessage(JSON.stringify({
                    "namespace": Message.fieldNamespace,
                    "projectID": t.instance.getProjectID(),
                    "action":    `setup-field-${t.type}`
                }), "*");

                // And hook the ok message
                t.iframe.contentWindow.addEventListener("message", function (event) {
                    if (errored)
                        return;

                    var data = Message.parseEvent(event);
                    if (data.namespace != Message.fieldNamespace)
                        return;
                    if (data.action != "ready") 
                        return;

                    clearTimeout(iframeError);
                    success(t);
                });
            };

            this.el.appendChild(this.iframe);
        }

        /** 
         * Value asyncronously fetches the card field value. The returned 
         * value is encrypted
         * @param {callback} callback
         * @return {void}
         */
        public value(callback: (val: string) => void): void {
            var l = `valued-${Math.random().toString()}`;

            // Ask the iframe for its value
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "value",
                "data":      l
            }), "*");

            this.iframe.contentWindow.addEventListener("message", function (event) {
                var data = Message.parseEvent(event);
                if (data.namespace != Message.fieldNamespace)
                    return;
                if (data.action != l)
                    return;

                callback(data.data);
            });
        }
    }
}
