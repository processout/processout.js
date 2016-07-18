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
         * @type {domElement}
         */
        iframe;

        /**
         * Unique ID of the modal
         * @type {String}
         */
        uniqId: string;

        /**
         * Namespace used when sending messages to iframe
         * @type {String}
         */
        namespace = 'processout';

        /**
         * Specifies if the modal was deleted
         * @type {Boolean}
         */
        deleted = false;

        /**
         * Modal constructor
         * @param  {domElement} iframe
         * @param  {string}     uniqId
         */
        constructor(instance: ProcessOut, iframe, uniqId: string) {
            this.instance = instance;
            this.iframe   = iframe;
            this.uniqId   = uniqId;
        }

        /**
         * Show the modal
         * @param  {Function} onShow
         * @param  {Function} onHide
         * @param  {Function} error
         * @return {void}
         */
        show(onShow?: (modal: Modal) => void, onHide?: (modal: Modal) => void,
            error?: (err: Error) => void) {
                
            var modal   = this;
            var iframe  = modal.iframe;
            var iframeW = iframe.get(0).contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(`${this.namespace} ${frameid} check`, "*");
            var redirectTimeout =
                setTimeout(function(){
                    if (typeof(error) === typeof(Function))
                        error(<Error> {
                            message: "The modal does not seem to be available.",
                            code:    "modal.unavailable"
                        });
                }, this.instance.timeout);
            var oldCursor = jQuery("body").css("cursor");

            function receiveMessage(event) {
                var eventSplit = event.data.split(" ");
                if (eventSplit[0] != modal.namespace)
                    return;

                if (eventSplit[1] != frameid)
                    return;

                switch (eventSplit[2]) {
                    case "openModal":
                        // Clear the timeout
                        clearTimeout(redirectTimeout);
                        // Make sure that we can't scroll behind the modal
                        jQuery("body").css("overflow", "hidden");
                        // Make sure our iframe is of the correct dimension
                        jQuery(window).resize(function() {
                            iframe.width(jQuery(window).outerWidth());
                            iframe.height(jQuery(window).outerHeight());
                        });
                        jQuery(window).trigger("resize");
                        // Show the iframe
                        iframe.fadeIn(200);
                        iframeW.postMessage(`${modal.namespace} ${frameid} launch`, "*");
                        if (typeof(onShow) === typeof(Function))
                            onShow(this);
                        break;

                    case "closeModal":
                        modal.hide();
                        if (typeof(onHide) === typeof(Function))
                            onHide(this);
                        break;

                    case "url":
                        window.location.href = eventSplit[3];
                        break;

                    default:
                        console.log("Could not read event action from modal.",
                            event.data);
                        break;
                }
            }
            window.addEventListener("message", receiveMessage, false);
        }

        /**
         * Hide the modal
         * @return {void}
         */
        hide() {
            // Hide the modal
            this.iframe.fadeOut(200);
            // Put the scrollbar back
            jQuery("body").css("overflow", "");

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
