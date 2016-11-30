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
         * Callback executed when an event is triggered on an input
         * @var {Callback}
         */
        protected eventCallback?: (name: string, data: any) => void;

        /**
         * Placeholder of the input
         * @var {string}
         */
        protected placeholder: string;

        /**
         * Default css style of the input
         * @var {string}
         */
        protected defaultStyle: string;

        /**
         * Hover css style of the input
         * @var {string}
         */
        protected hoverStyle: string;

        /**
         * Focus css style of the input
         * @var {string}
         */
        protected focusStyle: string;

        /**
         * Whether or not the field is currently hovered over on
         * @var {boolean}
         */
        protected hovered: boolean;

        /**
         * Whether or not the field is currently focused on
         * @var {boolean}
         */
        protected focused: boolean;
        
        /**
         * CardField constructor
         * @param {ProcessOut} instance
         * @param {string} type
         * @param {HTMLElement} el
         */
        public constructor(instance: ProcessOut, type: string, 
            container:      HTMLElement, 
            success:        ()  => void, 
            error:          (err:  Exception) => void,
            eventCallback?: (name: string, data: any) => void) {

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

            this.instance      = instance;
            this.type          = type;
            this.el            = container;
            this.eventCallback = eventCallback;

            this.placeholder  = this.el.getAttribute("data-processout-placeholder");
            this.defaultStyle = this.el.getAttribute("data-processout-style");
            this.hoverStyle   = this.el.getAttribute("data-processout-style-hover");
            this.focusStyle   = this.el.getAttribute("data-processout-style-focus");

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

                    // We want to bind our event handler as well
                    t.handlEvent(data);

                    // We will first wait for an alive signal from the iframe.
                    // Once we've received it, we will send a setup action,
                    // and the iframe should reply with a ready state

                    if (data.action == "alive") {
                        var settings = new CardFieldSettings();
                        settings.type        = t.type;
                        settings.placeholder = t.placeholder;
                        settings.style       = t.defaultStyle;

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
         * handlEvent handles the events coming from the inputs, posted
         * in the message bus
         * @param {Message} data
         * @return {void}
         */
        protected handlEvent(data: Message): void {
            if (!this.eventCallback)
                return;

            var d = {
                field:   this,
                type:    this.type,
                element: this.el,
                data:    data.data
            };

            switch (data.action) {
            case "inputEvent":
                this.eventCallback("oninput", d);
                break;
            case "mouseEnterEvent":
                this.hovered = true;
                if (!this.focused)
                    this.setStyle(this.hoverStyle);
                this.eventCallback("onmouseenter", d);
                break;
            case "mouseLeaveEvent":
                this.hovered = false;
                if (!this.focused) 
                    this.setStyle(this.defaultStyle);
                this.eventCallback("onmouseleave", d);
                break;
            case "focusEvent":
                this.focused = true;
                this.setStyle(this.focusStyle);
                this.eventCallback("onfocus", d);
                break;
            case "blurEvent": // inverse of focus
                this.focused = false;
                if (!this.hovered)
                    this.setStyle(this.defaultStyle);
                this.eventCallback("onblur", d);
                break;
            }
        }

        /**
         * Set the default css style for the input
         * @param {string} style
         * @return {void}
         */
        public setDefaultStyle(style: string): void {
            this.defaultStyle = style;
        }

        /**
         * Set the hover css style for the input
         * @param {string} style
         * @return {void}
         */
        public setHoverStyle(style: string): void {
            this.hoverStyle = style;
        }

        /**
         * Set the focus css style for the input
         * @param {string} style
         * @return {void}
         */
        public setFocusStyle(style: string): void {
            this.focusStyle = style;
        }

        /**
         * Set the new style to be displayed by the input
         * @param {string} style
         * @return {void}
         */
        public setStyle(style: string): void {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "setStyle",
                "data":      style
            }), "*");
        }

        /**
         * Set the new placeholder to be displayed by the input
         * @param {string} style
         * @return {void}
         */
        public setPlaceholder(placeholder: string): void {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "setPlaceholder",
                "data":      placeholder
            }), "*");
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
