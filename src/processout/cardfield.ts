/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class CardFieldValue {
        public number:      string = null;
        public expiryMonth: number = null;
        public expiryYear:  number = null;
        public cvc:         string = null;
        public name:        string = null;
        public metadata:    string = null;
    }

    export class CardFieldOptions {
        public type:        string;
        public placeholder: string;
        public style:       CardFieldStyle;
        public requireCVC:  boolean;

        public constructor(type: string) {
            this.type = type;
        }

        public apply(o: CardFieldOptions): CardFieldOptions {
            if (o.placeholder)        this.placeholder = o.placeholder;
            if (o.style)              this.style       = o.style;
            if (o.requireCVC != null) this.requireCVC  = o.requireCVC;

            return this;
        }
    }

    export class CardFieldStyle {
        public color:                string;
        public fontFamily:           string;
        public loadCustomFontFamily: string;
        public fontSize:             string;
        public fontSizeAdjust:       string;
        public fontStretch:          string;
        public fontSmoothing:        string;
        public fontStyle:            string;
        public fontVariant:          string;
        public fontWeight:           string;
        public lineHeight:           string;
        public textShadow:           string;
        public textTransform:        string;
        public textDecoration:       string;
        public transition:           string;
        public height:               string;

        // pseudo class/elements:
        // :hover
        // :focus
        // ::placeholder
        // ::selection
    }

    /**
     * Card field class
     */
    export class CardField {
        /** 
         * Number is the credit card field type number
         * @var {string}
         */
        public static number = "number";

        /** 
         * Expiry is the credit card field type expiration date
         * @var {string}
         */
        public static expiry = "expiry";

        /** 
         * ExpiryMonth is the credit card field type expiration month
         * @var {string}
         */
        public static expiryMonth = "expiry-month";

        /** 
         * ExpiryYear is the credit card field type expiration year
         * @var {string}
         */
        public static expiryYear = "expiry-year";

        /** 
         * CVC is the credit card field type cvc
         * @var {string}
         */
        public static cvc = "cvc";

        /** 
         * Timeout is the number of ms to wait before timing out a field
         * @var {string}
         */
        protected static timeout = 20000;

        /** 
         * instance is the current ProcessOut instance
         * @var {ProcessOut}
         */
        protected instance: ProcessOut;

        /** 
         * El is the parent of the iframe used to embed the field
         * @var {string}
         */
        protected el: HTMLElement;

        /** 
         * Iframe is the iframe embedding the field
         * @var {string}
         */
        protected iframe: HTMLIFrameElement;

        /**
         * uid is the uid of the iframe
         * @var {string}
         */
        protected uid: string;

        /**
         * Form class wrapping the card field
         * @var {CardForm}
         */
        protected form: CardForm;

        /** 
         * Callback executed when an event is triggered on an input
         * @var {Callback}
         */
        protected eventCallback?: (name: string, data: any) => void;

        /**
         * Placeholder of the input
         * @var {string}
         */
        protected options: CardFieldOptions;

        /**
         * Callback triggered when the input is marked as valid
         * @var {callback}
         */
        protected next?: () => void;

        /**
         * Handlers used to handle events fired on the input field
         * @var {callback[]}
         */
        protected handlers: { [key: string]: ((e: any) => void)[] } = {} ;

        /**
         * CardField constructor
         * @param {ProcessOut} instance
         * @param {options} CardFieldOptions
         * @param {HTMLElement} el
         */
        public constructor(instance: ProcessOut, form: CardForm, 
            options: CardFieldOptions, container: HTMLElement, 
            success:        ()  => void, 
            error:          (err:  Exception) => void) {

            if (!options || !options.type) {
                throw new Exception("processout-js.invalid-field-type", "Options and a the field type must be provided to setup the field.");
            }

            if (!container) {
                throw new Exception("processout-js.undefined-field", `The card field for the ${options.type} does not exist in the given container.`);
            }
            if (container instanceof HTMLInputElement) {
                throw new Exception("processout-js.invalid-field", `The card field for the ${options.type} must be an input field.`);
            }

            if (options.type != CardField.number &&
                options.type != CardField.expiry &&
                options.type != CardField.expiryMonth &&
                options.type != CardField.expiryYear &&
                options.type != CardField.cvc)
                throw new Exception("processout-js.invalid-field-type");

            this.instance  = instance;
            this.form      = form;

            this.options   = options;
            this.el        = container;

            var placeholder = this.el.getAttribute("data-processout-placeholder");
            if (placeholder)
                this.options.placeholder = placeholder;

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

            var tmp = Math.random().toString(36).substring(7);
            this.uid = `#${tmp}`;
            var endpoint = this.instance.getProcessOutFieldEndpoint(`?r=${tmp}${this.uid}`);

            this.iframe = document.createElement("iframe");
            this.iframe.className = "processout-field-cc-iframe";
            this.iframe.name = tmp;
            this.iframe.setAttribute("src", endpoint);
            this.iframe.setAttribute("style", "background: none; width: 100%;");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("allowtransparency", "1");
            // Hide the field until it's ready
            this.iframe.style.display = "none";
            this.iframe.height = "14px"; // Default height
                        
            var errored = false;
            var iframeError = setTimeout(function() {
                errored = true;
                if (typeof(error) === typeof(Function))
                    error(new Exception("processout-js.field.unavailable"));
            }, CardField.timeout);

            this.iframe.onload = function() {
                try {
                    // We want to reset the iframe src to prevent
                    // Firefox & IE/Edge from (wrongfully) caching the iframe
                    // content
                    this.iframe.contentWindow.location.replace(endpoint)
                } catch(e) { /* ... */ }
            }.bind(this);

            // Hook the ok message
            window.addEventListener("message", function (event) {
                if (errored)
                    return;

                var data = Message.parseEvent(event);

                if (data.frameID != this.uid)
                    return;
                if (data.namespace != Message.fieldNamespace)
                    return;

                // We want to bind our event handler as well
                this.handlEvent(data);

                // We will first wait for an alive signal from the iframe.
                // Once we've received it, we will send a setup action,
                // and the iframe should reply with a ready state

                if (data.action == "alive") {
                    // The field's iframe is available, let's set it up
                    this.iframe.contentWindow.postMessage(JSON.stringify({
                        "namespace": Message.fieldNamespace,
                        "projectID": this.instance.getProjectID(),
                        "action":    "setup",
                        "formID":    this.form.getUID(),
                        "data":      this.options
                    }), "*");
                }

                if (data.action == "ready") {
                    // It's now ready
                    this.iframe.style.display = "block";
                    clearTimeout(iframeError);
                    success();

                    // Finally we also want to request for a resize, as some
                    // browser fail to compute the height of the iframe
                    // if it isn't displayed yet
                    this.iframe.contentWindow.postMessage(JSON.stringify({
                        "namespace": Message.fieldNamespace,
                        "projectID": this.instance.getProjectID(),
                        "action":    "resize"
                    }), "*");

                    // Hook an event listener for the focus event to focus
                    // on the input when the user presses tab on older
                    // browser: otherwise the iframe would get focused, but
                    // not the field within it (hello IE)
                    this.iframe.addEventListener("focus", function (event) {
                        this.focus();
                    }.bind(this));
                }
            }.bind(this));

            this.el.appendChild(this.iframe);
        }

        /**
         * handlEvent handles the events coming from the inputs, posted
         * in the message bus
         * @param {Message} data
         * @return {void}
         */
        protected handlEvent(data: Message): void {
            var d = {
                field:   this,
                type:    this.options.type,
                element: this.el,
                data:    data.data
            };

            switch (data.action) {
            case "inputEvent":
                if (this.eventCallback) this.eventCallback("oninput", d);
                break;
            case "mouseEnterEvent":
                if (this.eventCallback) this.eventCallback("onmouseenter", d);
                break;
            case "mouseLeaveEvent":
                if (this.eventCallback) this.eventCallback("onmouseleave", d);
                break;
            case "focusEvent":
                // Add a processout-input-focused class to the parent element
                this.el.className = this.el.className + " processout-input-focused";
                if (this.eventCallback) this.eventCallback("onfocus", d);
                break;
            case "blurEvent": // inverse of focus
                // Remove the processout-input-focused class from the 
                // parent element
                this.el.className = this.el.className
                    .replace(/\bprocessout-input-focused\b/g, "")
                    .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
                if (this.eventCallback) this.eventCallback("onblur", d);
                break;
            case "next":
                if (this.next) this.next();
                break;
            case "event":
                if (data.data.name in this.handlers) {
                    var handlers = this.handlers[data.data.name];
                    for (var i = 0; i < handlers.length; i++)
                        handlers[0](data.data.data);
                }
                break;
            case "resize":
                if (this.options.style.height) {
                    this.iframe.height = this.options.style.height;
                } else { 
                    this.iframe.height = data.data; 
                }
                break;
            }
        }

        /**
         * Set the callback executed when the input gets marked as valid
         * @param {callback} next
         * @return {void}
         */
        public setNext(next: () => void): void {
            this.next = next;
        }

        /**
         * Set the new style to be displayed by the input
         * @param {string} style
         * @return {void}
         */
        public update(options: CardFieldOptions): void {
            if (options.placeholder) 
                this.options.placeholder = options.placeholder;
            if (options.style)
                this.options.style = (<any>Object).assign(
                    this.options.style, options.style);

            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "update",
                "data":      this.options
            }), "*");
        }

        /**
         * addEventListener adds an event listener for the given event on 
         * the card field
         * @param {string} e 
         * @param {callback} h 
         * @return {void}
         */
        public addEventListener(e: string, h: (e: any) => void): void {
            if (!(e in this.handlers))
                this.handlers[e] = [];

            this.handlers[e].push(h);
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "registerEvent",
                "data":      e
            }), "*");
        }

        /**
         * on adds an event listener for the given event on the card field
         * @param {string} e 
         * @param {callback} h 
         * @return {void}
         */
        public on(e: string, h: (e: any) => void): void {
            return this.addEventListener(e, h);
        }

        /**
         * blur blurs the card field
         * @return {void}
         */
        public blur(): void {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "blur"
            }), "*");
        }

        /**
         * focus focuses on the card field
         * @return {void}
         */
        public focus(): void {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "focus"
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
            
            window.addEventListener("message", function (event) {
                var data = Message.parseEvent(event);
                if (data.frameID != this.uid)
                    return;
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
            }.bind(this));
        }

        /** 
         * Tokenize asks the leader field to tokenize using the sub-fields
         * and calls success with the final card token
         * @param {any[]}    fields 
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        public tokenize(fields: any[], data: any,  success: (token: string)  => void,
                                                   error:   (err: Exception) => void): void {

            // Tell our field it should start the tokenization process and
            // expect a response
            var id = Math.random().toString();
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "tokenize",
                "data": {
                    "fields": fields,
                    "data":   data
                }
            }), "*");

            // Our timeout, just in case
            var fetchingTimeout =
                setTimeout(function(){
                    error(new Exception("processout-js.field.unavailable"));
                }, CardField.timeout);

            window.addEventListener("message", function (event) {
                var data = Message.parseEvent(event);
                if (data.messageID != id)
                    return;
                if (data.action != "tokenize")
                    return;

                clearTimeout(fetchingTimeout);

                // We successfully tokenized: let's return the data
                if (data.data.token)      success(data.data.token);
                else if (data.data.error) error(new Exception(data.data.error.code, data.data.error.message));
                else                      error(new Exception("default"));
            }.bind(this));
        }

        /** 
         * refreshCVC asks the field to refresh the CVC of the given card. 
         * The success callback is called with the card UID if it was successful
         * otherwise the error callback is called with the Exception
         * @param {any[]}    fields 
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        public refreshCVC(cardUID: string, success: (token: string)  => void,
                                           error:   (err: Exception) => void): void {

            // Tell our field it should start the tokenization process and
            // expect a response
            var id = Math.random().toString();
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "refresh-cvc",
                "data":      cardUID
            }), "*");

            // Our timeout, just in case
            var fetchingTimeout =
                setTimeout(function(){
                    error(new Exception("processout-js.field.unavailable"));
                }, CardField.timeout);

            window.addEventListener("message", function (event) {
                var data = Message.parseEvent(event);
                if (data.messageID != id)
                    return;
                if (data.action != "refresh-cvc")
                    return;

                clearTimeout(fetchingTimeout);

                // We successfully tokenized: let's return the data
                if (data.data.token)      success(data.data.token);
                else if (data.data.error) error(new Exception(data.data.error.code, data.data.error.message));
                else                      error(new Exception("default"));
            }.bind(this));
        }
    }
}
