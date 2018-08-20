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
         * listenerCount is the number of listener that were set
         * @type {number}
         */
        protected static listenerCount = 0;

        /**
         * ActionHandler constructor
         * @param {ProcessOut} instance
         * @param {string} resourceID
         */
        constructor(instance: ProcessOut, resourceID: string, useIFrame?: boolean) {
            this.instance   = instance;
            this.resourceID = resourceID;
            if (useIFrame) {
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

                // And crete the cancel button
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

            var t         = this;
            var newWindow;
            if (!this.iframeWrapper) {
                // Let's handle that in a new tab
                newWindow = window.open(url, '_blank');
                if (!newWindow) {
                    error(new Exception("customer.popup-blocked"));
                    window.focus();
                    return
                }
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
                    window.focus();
                    return;
                }

                var cancelf = function() {
                    // The payment window was closed
                    clearInterval(timer); timer = null;
                    error(new Exception("customer.canceled"));
                    window.focus();
                }
                try {
                    // We want to run the newWindow.closed condition in a try
                    // catch as Chrome has a bug in which the access to the 
                    // window is lost when the user navigates back (ie clicks
                    // on the back button)
                    if (!newWindow || newWindow.closed) {
                        cancelf();
                        return;
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
                    window.focus();
                    break;

                case "canceled":
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("customer.canceled"));
                    window.focus();
                    break;

                case "none":
                    // There's nothing to be done on the page
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("processout-js.no-customer-action"));
                    window.focus();
                    break;

                case "error":
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception(data.errorCode, data.errorMessage));
                    window.focus();
                    break;

                default:
                    // By default we shouldn't have received something with
                    // a correct namespace by unknown action
                    if (timer) { clearInterval(timer); timer = null; }
                    newWindow.close();

                    error(new Exception("default"));
                    window.focus();
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
