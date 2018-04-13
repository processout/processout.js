/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut Modal class
     */
    export class Modal {

        /**
         * ProcessOut instance
         * @type {ProcessOut}
         */
        instance: ProcessOut;

        /**
         * Modal iFrame
         * @type {HTMLIFrameElement}
         */
        iframe: HTMLIFrameElement;

        /**
         * Unique ID of the modal
         * @type {String}
         */
        uniqId: string;

        /**
         * Specifies if the modal was deleted
         * @type {Boolean}
         */
        deleted = false;

        /**
         * Timeout before considering the modal could not be loaded, in ms
         * @type {Number}
         */
        public timeout = 10000;

        /**
         * Modal constructor
         * @param  {HTMLIFrameElement} iframe
         * @param  {string}     uniqId
         */
        constructor(instance: ProcessOut, iframe: HTMLIFrameElement, uniqId: string) {
            this.instance = instance;
            this.iframe   = iframe;
            this.uniqId   = uniqId;
        }

        /**
         * Show the modal
         * @param  {Function|object} options
         * @param  {Function} onHide
         * @param  {Function} error
         * @return {void}
         */
        show(options?: ((modal: Modal) => void)|any, onHide?: (modal: Modal) => void,
            onError?: (modal: Modal, err: Exception) => void) {

            var onShow = options;
            var onPayment, onPaymentError, hideAfterSuccessTimeout;
            if (typeof(options) == 'object') {
                onShow         = options.onShow;
                onHide         = options.onHide;
                onError        = options.onError;
                onPayment      = options.onPayment;
                onPaymentError = options.onPaymentError;
                hideAfterSuccessTimeout = options.hideAfterSuccessTimeout;
            }

            // Default timeout to 2.5s
            if (hideAfterSuccessTimeout == null)
                hideAfterSuccessTimeout = 2500;

            var modal   = this;
            var iframe  = modal.iframe;
            var iframeW = iframe.contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(JSON.stringify({
                namespace: Message.modalNamespace,
                frameID:   frameid,
                action:    "check"
            }), "*");
            var redirectTimeout =
                setTimeout(function(){
                    if (typeof(onError) === typeof(Function))
                        onError(modal, new Exception("processout-js.modal.unavailable"));
                }, this.timeout);

            window.addEventListener("message", function (event) {
                var data = Message.parseEvent(event);
                if (data.frameID != frameid)
                    return;
                if (data.namespace != Message.modalNamespace)
                    return;

                switch (data.action) {
                    case "openModal":
                        // Clear the timeout
                        clearTimeout(redirectTimeout);
                        // Make sure that we can't scroll behind the modal
                        document.body.style.overflow = "hidden";
                        // Make sure our iframe is of the correct dimension
                        window.addEventListener("resize", function(event) {
                            iframe.width = window.outerWidth + "px";
                            iframe.height = window.outerHeight + "px";
                        });
                        if(typeof(Event) === "function") {
                            var devent = new Event("resize");
                        } else {
                            var devent = document.createEvent("Event");
                            event.initEvent("resize", true, true);
                        }
                        window.dispatchEvent(devent);
                        // Show the iframe
                        iframe.style.display = "block";
                        iframeW.postMessage(JSON.stringify({
                            namespace: Message.modalNamespace,
                            frameID:   frameid,
                            action:    "launch"
                        }), "*");
                        if (typeof(onShow) === typeof(Function))
                            onShow(modal);
                        break;

                    case "closeModal":
                        modal.hide();
                        if (typeof(onHide) === typeof(Function))
                            onHide(modal);
                        break;

                    case "error":
                        // The iframe returned us some error. This could be
                        // that the invoice could not be found, or that
                        // the invoice parameters were invalid.
                        clearTimeout(redirectTimeout);
                        if (typeof(onError) === typeof(Function))
                            onError(modal, new Exception(data.errorCode, data.errorMessage));
                        break;

                    case "onPayment":
                        if (typeof(onPayment) === typeof(Function))
                            onPayment(modal, data.data);

                        if (hideAfterSuccessTimeout > 0) {
                            setTimeout(function() {
                                modal.hide();
                            }, hideAfterSuccessTimeout);
                        }
                        break;

                    case "onPaymentError":
                        if (typeof(onPaymentError) === typeof(Function))
                            onPaymentError(modal, new Exception(data.errorCode, 
                                data.errorMessage));
                        break;

                    default:
                        console.log("Could not read event action from modal.",
                            event.data);
                        break;
                }
            }, false);
        }

        /**
         * Hide the modal
         * @return {void}
         */
        hide() {
            // Hide the modal
            this.iframe.style.display = "none";
            // Put the scrollbar back
            document.body.style.overflow = "";

            this.iframe.remove();
            this.deleted = true;
        }

        /**
         * Specifies if the modal was deleted
         * @return {Boolean}
         */
        isDeleted() {
            return this.deleted;
        }

    }

}
