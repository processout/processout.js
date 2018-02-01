/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

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
         * listenerCount is the number of listener that were set
         * @type {number}
         */
        protected static listenerCount = 0;

        /**
         * ActionHandler constructor
         * @param {ProcessOut} instance
         * @param {string} resourceID
         */
        constructor(instance: ProcessOut, resourceID: string) {
            this.instance   = instance;
            this.resourceID = resourceID;
        }

        protected handleRedirection(
            url:     string,
            success: (data:  any)    => void,
            error:   (err:   Exception) => void): void {

            var t         = this;
            var newWindow = window.open(url, '_blank');
            if (!newWindow) {
                error(new Exception("customer.popup-blocked"));
                window.focus();
                return
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
