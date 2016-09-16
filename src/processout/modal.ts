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
         * @param  {Function} onShow
         * @param  {Function} onHide
         * @param  {Function} error
         * @return {void}
         */
        show(onShow?: (modal: Modal) => void, onHide?: (modal: Modal) => void,
            error?: (err: Exception) => void) {

            var modal   = this;
            var iframe  = modal.iframe;
            var iframeW = iframe.contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(`${ProcessOut.namespace} ${frameid} check`, "*");
            var redirectTimeout =
                setTimeout(function(){
                    if (typeof(error) === typeof(Function))
                        error(new Exception("processout-js.modal.unavailable"));
                }, this.instance.timeout);

            function receiveMessage(event) {
                var eventSplit = event.data.split(" ");
                if (eventSplit[0] != ProcessOut.namespace)
                    return;

                if (eventSplit[1] != frameid)
                    return;

                switch (eventSplit[2]) {
                    case "openModal":
                        // Clear the timeout
                        clearTimeout(redirectTimeout);
                        // Make sure that we can't scroll behind the modal
                        document.body.style.overflow = "hidden";
                        // Make sure our iframe is of the correct dimension
                        window.onresize = function() {
                            iframe.width = window.outerWidth + "px";
                            iframe.height = window.outerHeight + "px";
                        }
                        window.dispatchEvent(new Event('resize'));
                        // Show the iframe
                        iframe.style.display = "block";
                        iframeW.postMessage(`${ProcessOut.namespace} ${frameid} launch`, "*");
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
