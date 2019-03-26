/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    class MockedIFrameWindow {
        protected element: HTMLElement;
        protected iframe:  HTMLIFrameElement;
        public closed:     boolean;

        constructor(el: HTMLElement, iframe: HTMLIFrameElement) {
            this.element = el;
            this.iframe  = iframe;

            window.addEventListener("resize", function(event) {
                this.element.style.width = window.outerWidth + "px";
                var height = Math.max(document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight);
                this.element.style.height = height + "px";
            }.bind(this));
            if(typeof(Event) === "function") {
                var event = new Event("resize");
            } else {
                var event = document.createEvent("Event");
                event.initEvent("resize", true, true);
            }
            window.dispatchEvent(event);
        }

        public open(url: string) {
            // Load the page in our modal
            this.iframe.setAttribute("src", url);
            // Make sure that we can't scroll behind the modal
            document.body.style.overflow = "hidden";

            // And finally show the modal to the user
            document.body.appendChild(this.element);
        }

        public close() {
            document.body.style.overflow = "";
            this.closed = true;
            this.element.remove();
        }
    }

    export class ActionHandlerOptions {
        // defines if we want to use an iframe or not
        public useIFrame: boolean;

        // defines if we want to open in a new tab or window
        public useNewWindow: boolean;

        // newWindowHeight and Widths used when the action is done on a new
        // window
        public newWindowHeight?: number;
        public newWindowWidth?: number;

        // gatewayLogo is shown when the action is done on another tab or window
        public gatewayLogo?: string;

        public static ThreeDSFlow = "three-d-s-flow";

        constructor(gatewayName?: string, gatewayLogo?: string) {
            this.gatewayLogo = gatewayLogo;

            switch (gatewayName) {
            // The 3DS flow is a special one where we always want to load it
            // in an iframe
            case ActionHandlerOptions.ThreeDSFlow:
                this.useIFrame    = true;
                this.useNewWindow = false;
                break;

            // For PayPal we want to open a new window on top of
            // the payment page to emulate the "in-context" flow
            case "paypal":
            case "paypalexpresscheckout":
                this.useIFrame       = false;
                this.useNewWindow    = true;
                this.newWindowHeight = 645;
                this.newWindowWidth  = 450;
                break;

            // For sandbox mode we also want to emulate it like that
            case "test-credit-card":
            case "test-alternative-payment":
                this.useIFrame       = false;
                this.useNewWindow    = true;
                this.newWindowHeight = 645;
                this.newWindowWidth  = 450;
                break;

            // By default we just want a new tab
            default:
                this.useIFrame    = false;
                this.useNewWindow = false;
            }
        }
    }

    /**
     * ActionHandler is the class handling the customer actions
     */
    export class ActionHandler {

        /**
         * ProcessOut instance of the current context
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * Current gateway configuration ID
         * @type {string}
         */
        protected gatewayConfigurationID: string;

        /**
         * Current resource ID. Can be invoice, subscription or authorization
         * request
         * @type {string}
         */
        protected resourceID: string;

        /**
         * Defines whether or not the current action is canceled
         * @type {boolean}
         */
        protected canceled = false;

        /**
         * IFrame wrapper to be used instead of a new tab to handle the
         * given customer action
         * @type {HTMLElement}
         */
        protected iframeWrapper: MockedIFrameWindow;

        /**
         * Options contains the options for the action handler
         * @type {ActionHandlerOptions}
         */
        protected options: ActionHandlerOptions;

        /**
         * listenerCount is the number of listener that were set
         * @type {number}
         */
        protected static listenerCount = 0;

        /**
         * ActionHandler constructor
         * @param {ProcessOut} instance
         * @param {string} resourceID
         */
        constructor(instance: ProcessOut, options?: ActionHandlerOptions) {
            this.instance = instance;
            this.options  = options;

            if (!this.options) this.options = new ActionHandlerOptions();

            if (this.options.useIFrame) {
                var iframeWrapper = document.createElement("div");
                iframeWrapper.id = "processoutjs-action-modal";
                iframeWrapper.style.position = "fixed";
                iframeWrapper.style.top = "0";
                iframeWrapper.style.left = "0";
                iframeWrapper.style.height = "100%";
                iframeWrapper.style.width = "100%";
                iframeWrapper.setAttribute("style", "position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 9999999; overflow: auto;");

                // Create the IFrame to be used later
                var iframe = document.createElement("iframe");
                iframe.setAttribute("style", `margin: 1em auto; width: 440px; height: 480px; max-width: 100%; max-height: 100%; display: block; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); background-color: #ECEFF1; background-image: url("${this.instance.endpoint("js", "/images/loader.gif")}"); background-repeat: no-repeat; background-position: center;")`);
                iframe.setAttribute("frameborder", "0");

                // And create the cancel button
                var buttonWrapper = document.createElement("div");
                buttonWrapper.setAttribute("style", "width: 100%; text-align: center; margin-bottom: 1em;");
                var button = document.createElement("div");
                button.setAttribute("style", "cursor: pointer; color: white;");
                button.innerHTML = "Cancel";
                buttonWrapper.appendChild(button);

                iframeWrapper.appendChild(iframe);
                iframeWrapper.appendChild(buttonWrapper);
                this.iframeWrapper = new MockedIFrameWindow(iframeWrapper, iframe);
                button.onclick = function() {
                    this.iframeWrapper.close();
                }.bind(this);
            }
        }

        protected handleRedirection(
            url:     string,
            success: (data:  any)    => void,
            error:   (err:   Exception) => void): void {

            var topLayer;
            var t         = this;
            var newWindow;
            
            var refocus = function() {
                if (topLayer) topLayer.remove();
                window.focus();
            }

            if (!this.iframeWrapper) {
                if (this.options.useNewWindow) {
                    // In new window
                    var h = this.options.newWindowHeight;
                    var w = this.options.newWindowWidth;
                    var y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2);
                    var x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
                    newWindow = window.open(url, '',
                        `menubar=false,toolbar=false,width=${w},height=${h},top=${y},left=${x}`);
                } else {
                    // In new tab
                    newWindow = window.open(url, '_blank');
                }

                if (!newWindow) {
                    error(new Exception("customer.popup-blocked"));
                    refocus()
                    return
                }

                // Add a handler to this window to close child windows/tabs
                // when this tab closes.
                window.addEventListener("beforeunload", function(e){
                    newWindow.close();
                 }, false);

                // Add a layer on top of the website to prevent other actions
                // from the user during checkout
                topLayer = document.createElement("div");
                topLayer.id = "processoutjs-action-modal";
                topLayer.setAttribute("style", "position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.7); z-index: 9999999; overflow: auto; height: 100%; width: 100%; cursor: pointer;");
                topLayer.addEventListener("click", function() {
                    newWindow.focus();
                }, false);

                // Also add a friendly little message
                var topLayerMessage = document.createElement("div");
                topLayerMessage.setAttribute("style", "text-align: center; margin-top: 10%;")
                var topLayerMessageImage = document.createElement("img");
                topLayerMessageImage.setAttribute("style", "max-height: 30px; max-width: 250px; filter: brightness(0) invert(1);")
                topLayerMessageImage.setAttribute("src", this.options.gatewayLogo);
                topLayerMessage.appendChild(topLayerMessageImage);
                topLayer.appendChild(topLayerMessage);

                document.body.appendChild(topLayer);
            } else {
                // Let's handle that in an IFrame
                newWindow = this.iframeWrapper;
                newWindow.open(url);
            }

            // We now want to monitor the payment page
            var timer = setInterval(function() {
                if (!timer) return;

                if (t.isCanceled()) {
                    clearInterval(timer); timer = null;
                    newWindow.close();
                    error(new Exception("customer.canceled"));
                    refocus();
                    return;
                }

                var cancelf = function() {
                    // The payment window was closed
                    clearInterval(timer); timer = null;
                    error(new Exception("customer.canceled"));
                    refocus();
                }
                try {
                    // We want to run the newWindow.closed condition in a try
                    // catch as Chrome has a bug in which the access to the 
                    // window is lost when the user navigates back (ie clicks
                    // on the back button)
                    if (!newWindow || newWindow.closed) {
                        cancelf();
                    }
                } catch (err) {
                    // Close the newWindow, just in case it didn't crash for
                    // that reason
                    try { newWindow.close(); } catch (err) { }
                    cancelf();
                }
            });

            ActionHandler.listenerCount++;
            var cur = ActionHandler.listenerCount;

            // To monitor the status, we will use event listeners for messages
            // sent between the checkout and processout.js
            window.addEventListener("message", function(event) {
                var data = Message.parseEvent(event);
                if (data.namespace != Message.checkoutNamespace)
                    return;

                // Not the latest listener anymore
                if (ActionHandler.listenerCount != cur) {
                    // Reset the timer if it hasn't been done already
                    if (timer) { clearInterval(timer); timer = null; }
                    return;
                }

                switch (data.action) {
                case "success":
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    // The checkout page sent us the token we want
                    success(data.data);
                    refocus();
                    break;

                case "canceled":
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("customer.canceled"));
                    refocus();
                    break;

                case "none":
                    // There's nothing to be done on the page
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("processout-js.no-customer-action"));
                    refocus();
                    break;

                case "error":
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception(data.errorCode, data.errorMessage));
                    refocus();
                    break;

                default:
                    // By default we shouldn't have received something with
                    // a correct namespace by unknown action
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("default"));
                    refocus();
                    break
                }
            });
        }

        /**
         * Handle will handle the customer action for the current resource 
         * and gateway configuration, passed in the constructor
         * @param  {callback} success
         * @param  {callback} error
         * @return {ActionHandler}
         */
        public handle(
            url:     string,
            success: (data:  any)    => void, 
            error:   (err:   Exception) => void): ActionHandler {

           this.handleRedirection(url, success, error);
           return this;
        }

        /**
         * Cancel any ongoing action
         * @return {void}
         */
        public cancel(): void {
            this.canceled = true;
        }

        /**
         * Returns true if the action was previously canceled, false otherwise
         * @return {boolean}
         */
        public isCanceled(): boolean {
            return this.canceled;
        }

    }

}
