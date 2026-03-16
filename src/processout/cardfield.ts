/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class CardFieldValue {
        public number:          string = null;
        public selected_scheme: string | null = null;
        public expiryMonth:     number = null;
        public expiryYear:      number = null;
        public cvc:             string = null;
        public name:            string = null;
        public metadata:        string = null;
    }

    export class CardFieldOptions {
        public type:        string;
        public placeholder: string;
        public style:       CardFieldStyle;
        public requireCVC:  boolean;
        public expiryAutoNext: boolean = true;
        public cardNumberAutoNext: boolean = true;
        public enableCardSchemeSelection: boolean = false;
        public preferredSchemes: string[] = null;

        public constructor(type: string) {
            this.type = type;
        }

        public apply(o: CardFieldOptions): CardFieldOptions {
            if (o.placeholder)        this.placeholder = o.placeholder;
            if (o.style)              this.style       = o.style;
            if (o.requireCVC != null) this.requireCVC  = o.requireCVC;
            if (o.expiryAutoNext !== undefined && o.expiryAutoNext !== null) this.expiryAutoNext = o.expiryAutoNext; 
            if (o.cardNumberAutoNext !== undefined && o.cardNumberAutoNext !== null) this.cardNumberAutoNext = o.cardNumberAutoNext; 
            if (o.enableCardSchemeSelection !== undefined && o.enableCardSchemeSelection !== null) this.enableCardSchemeSelection = o.enableCardSchemeSelection; 
            if (o.preferredSchemes !== undefined && o.preferredSchemes !== null) this.preferredSchemes = o.preferredSchemes; 

            return this;
        }
    }

    export class CardFieldStyle {
        public color:                string;
        public backgroundColor:      string;
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
        public direction:            string;
        public schemeSelection?:      {
            selectedColor?: string;
            hoverColor?: string;
        };

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
         * Whether this CardField instance has been destroyed/cleaned up
         * @var {boolean}
         */
        protected destroyed: boolean = false;

        /**
         * Reference to the message event listener for cleanup
         * @var {function}
         */
        protected messageListener: (event: MessageEvent) => void;

        /**
         * MutationObserver to detect iframe removal from DOM
         * @var {MutationObserver}
         */
        protected mutationObserver: MutationObserver;

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


        private postMessage(message: any, options: { retries?: number, delay?: number, onError: (err: Exception) => void }): void {
            if (this.destroyed) {
                return;
            }

            const { retries, delay, onError } = {
                retries: 3,
                delay: 50,
                ...options
            }

            if (retries <= 0) {
                var err = new Exception("processout-js.field.unavailable", "Tried to locate the iframe content window but failed.");
                this.instance.telemetryClient.reportError({
                    host: "processout-js",
                    fileName: "cardfield.ts#postMessage",
                    lineNumber: 246,
                    message: err.message,
                    stack: err.stack,
                });
                onError(err);
                return;
            }

            try {
                if (!this.iframe || !this.iframe.contentWindow) {
                    setTimeout(() => this.postMessage(message, { retries: retries - 1, delay, onError }), delay);
                    return;
                }
                this.iframe.contentWindow.postMessage(message, "*");
            } catch (e) {
                setTimeout(() => this.postMessage(message, { retries: retries - 1, delay, onError }), delay);
            }
        }
        /**
         * Spawn spawns the iframe used to embed the field
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        protected spawn(
            success: () => void, 
            error:   (err:   Exception) => void
        ): void {
            var tmp = Math.random().toString(36).substring(7);
            this.uid = `#${tmp}`;
            var endpoint = this.instance.getProcessOutFieldEndpoint(`?r=${tmp}${this.uid}`);

            this.iframe = document.createElement("iframe");
            this.iframe.className = "processout-field-cc-iframe";
            this.iframe.name = tmp;
            this.iframe.title = this.getIframeTitle();
            this.iframe.setAttribute("src", endpoint);
            this.iframe.setAttribute("style", "background: none; width: 100%;");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("allowtransparency", "1");
            // Hide the field until it's ready
            this.iframe.style.display = "none";
            this.iframe.height = "14px"; // Default height

            if (typeof(error) !== typeof(Function)) {
                error = function () {}
            }
                        
            var errored = false;
            var iframeError = setTimeout(function() {
                errored = true;
                error(new Exception("processout-js.field.unavailable"));
            }, CardField.timeout);

            this.iframe.onload = function() {
                try {
                    // We want to reset the iframe src to prevent
                    // Firefox from (wrongfully) caching the iframe
                    // content: https://bugzilla.mozilla.org/show_bug.cgi?id=354176          
                    if(navigator.userAgent.match(/firefox|fxios/i)) {
                        if (this.iframe && this.iframe.contentWindow) {
                            this.iframe.contentWindow.location.replace(endpoint);
                        }
                    }                                 
                } catch(e) { /* ... */ }
            }.bind(this);

            // Hook the ok message - store reference for cleanup
            this.messageListener = function (event: MessageEvent) {
                if (errored || this.destroyed)
                    return;

                try {
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
                        this.postMessage(JSON.stringify({
                            "namespace": Message.fieldNamespace,
                            "projectID": this.instance.getProjectID(),
                            "action":    "setup",
                            "formID":    this.form.getUID(),
                            "data":      this.options
                        }), { onError: err => {
                            this.instance.telemetryClient.reportError({
                                host: "processout-js",
                                fileName: "cardfield.ts#spawn",
                                lineNumber: 338,
                                message: err.message,
                                stack: err.stack,
                            });
                            error(err);
                            return;
                        } });
                    }

                    if (data.action == "ready") {
                        // It's now ready
                        this.iframe.style.display = "block";
                        clearTimeout(iframeError);
                        success();

                        // Finally we also want to request for a resize, as some
                        // browser fail to compute the height of the iframe
                        // if it isn't displayed yet
                        this.postMessage(JSON.stringify({
                            "namespace": Message.fieldNamespace,
                            "projectID": this.instance.getProjectID(),
                            "action":    "resize"
                        }), { onError: err => {
                            this.instance.telemetryClient.reportError({
                                host: "processout-js",
                                fileName: "cardfield.ts#spawn",
                                lineNumber: 366,
                                message: err.message,
                                stack: err.stack,
                            });
                            error(err);
                            return;
                        } });

                        // Hook an event listener for the focus event to focus
                        // on the input when the user presses tab on older
                        // browser: otherwise the iframe would get focused, but
                        // not the field within it (hello IE)
                        this.iframe.addEventListener("focus", function () {
                            this.focus();
                        }.bind(this));
                    }
                } catch (e) {
                    this.instance.telemetryClient.reportError({
                        host: "processout-js",
                        fileName: "cardfield.ts#spawn",
                        lineNumber: 257,
                        message: e.message,
                        stack: e.stack,
                    });
                    error(e)
                }
            }.bind(this);
            window.addEventListener("message", this.messageListener);

            this.el.appendChild(this.iframe);

            // Set up MutationObserver to detect iframe removal and cleanup
            this.setupUnmountObserver();
        }

        /**
         * Sets up a MutationObserver to detect when the iframe is removed from the DOM
         * and automatically cleans up event listeners to prevent memory leaks and errors
         * @return {void}
         */
        protected setupUnmountObserver(): void {
            // Check if MutationObserver is available (not in very old browsers)
            if (typeof MutationObserver === 'undefined') {
                return;
            }

            this.mutationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const removedNode of Array.from(mutation.removedNodes)) {
                        // Check if our iframe was removed directly or as part of a parent
                        if (removedNode === this.iframe || 
                            (removedNode instanceof Element && removedNode.contains(this.iframe))) {
                            this.destroy();
                            return;
                        }
                    }
                }
            });
            
            // Observe the document body for child removals (subtree to catch parent removals)
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * Destroys this CardField instance, removing all event listeners
         * and cleaning up resources. Called automatically when iframe is
         * removed from DOM, or can be called manually.
         * @return {void}
         */
        public destroy(): void {
            if (this.destroyed) {
                return;
            }

            this.destroyed = true;

            // Remove the message event listener
            if (this.messageListener) {
                window.removeEventListener("message", this.messageListener);
                this.messageListener = null;
            }

            // Disconnect the MutationObserver
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
            }

            // Clear handlers
            this.handlers = {};

            // Clear references
            this.iframe = null;
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
                    for (var i = 0; i < handlers.length; i++) {
                        try {
                            handlers[0](data.data.data);
                        } catch (e) {
                            // ignoring errors that come from the merchant's codebase
                        }
                    }
                }
                break;
            case "resize":
                if (this.options.style?.height) {
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

            this.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "update",
                "data":      this.options
            }), { onError: (err) => { 
                this.instance.telemetryClient.reportError({
                    host: "processout-js",
                    fileName: "cardfield.ts#update",
                    lineNumber: 555,
                    message: err.message,
                    stack: err.stack,
                });   
                throw err 
            } });
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
            this.postMessage(JSON.stringify({
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "registerEvent",
                "data":      e
            }), { onError: (err) => { 
                this.instance.telemetryClient.reportError({
                    host: "processout-js",
                    fileName: "cardfield.ts#addEventListener",
                    lineNumber: 584,
                    message: err.message,
                    stack: err.stack,
                });
                throw err;
            } });
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
            this.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "blur"
            }), { onError: (err) => { 
                this.instance.telemetryClient.reportError({
                    host: "processout-js",
                    fileName: "cardfield.ts#blur",
                    lineNumber: 616,
                    message: err.message,
                    stack: err.stack,
                });
                throw err;
            } });
        }

        /**
         * focus focuses on the card field
         * @return {void}
         */
        public focus(): void {
            this.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "focus"
            }), { 
                onError: (err) => { 
                    this.instance.telemetryClient.reportError({
                        host: "processout-js",
                        fileName: "cardfield.ts#focus",
                        lineNumber: 638,
                        message: err.message,
                        stack: err.stack,
                    });
                    throw err;
                    return;
                }
            });
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

            if (typeof(error) !== typeof(Function)) {
                error = () => {};
            }

            // Ask the iframe for its value
            this.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "validate"
            }), { 
                onError: err => {
                    this.instance.telemetryClient.reportError({
                        host: "processout-js",
                        fileName: "cardfield.ts#validate",
                        lineNumber: 673,
                        message: err.message,
                        stack: err.stack,
                    });
                    error(err);
                    return;
                } 
            });

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
        public tokenize(fields: any[], data: any,  success: (token: string, card: Card)  => void,
                                                   error:   (err: Exception) => void): void {

            if (typeof(error) !== typeof(Function)) {
                error = () => {};
            }
            
            // Tell our field it should start the tokenization process and
            // expect a response
            var id = Math.random().toString();

            this.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "tokenize",
                "data": {
                    "fields": fields,
                    "data":   data
                }
            }), { 
                onError: err => {
                    this.instance.telemetryClient.reportError({
                        host: "processout-js",
                        fileName: "cardfield.ts#tokenize",
                        lineNumber: 739,
                        message: err.message,
                        stack: err.stack,
                    });
                    error(err);
                    return;
                } 
            });

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
                if (data.data.token)      success(data.data.token, data.data.card);
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

            if (typeof(error) !== typeof(Function)) {
                error = () => {};
            }

            // Tell our field it should start the tokenization process and
            // expect a response
            var id = Math.random().toString();
            this.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action":    "refresh-cvc",
                "data":      cardUID
            }), { 
                onError: err => {
                    this.instance.telemetryClient.reportError({
                        host: "processout-js",
                        fileName: "cardfield.ts#refreshCVC",
                        lineNumber: 803,
                        message: err.message,
                        stack: err.stack,
                    });
                    error(err);
                    return;
                } 
            });

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

        private getIframeTitle() {
            switch (this.options.type) {
                case CardField.number:
                    return Translator.translateMessage("cardfield.number.title")
                case CardField.expiry:
                    return Translator.translateMessage("cardfield.expiry.title")
                case CardField.cvc:
                    return Translator.translateMessage("cardfield.cvc.title")
                case CardField.expiryMonth:
                    return Translator.translateMessage("cardfield.expiry-month.title")
                case CardField.expiryYear:
                    return Translator.translateMessage("cardfield.expiry-year.title")
                default:
                    return Translator.translateMessage("cardfield.title")
            }
        }
    }
}
