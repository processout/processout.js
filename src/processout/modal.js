/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut Modal class
     */
    var Modal = (function () {
        /**
         * Modal constructor
         * @param  {HTMLIFrameElement} iframe
         * @param  {string}     uniqId
         */
        function Modal(instance, iframe, uniqId) {
            /**
             * Namespace used when sending messages to iframe
             * @type {String}
             */
            this.namespace = 'processout';
            /**
             * Specifies if the modal was deleted
             * @type {Boolean}
             */
            this.deleted = false;
            this.instance = instance;
            this.iframe = iframe;
            this.uniqId = uniqId;
        }
        /**
         * Show the modal
         * @param  {Function} onShow
         * @param  {Function} onHide
         * @param  {Function} error
         * @return {void}
         */
        Modal.prototype.show = function (onShow, onHide, error) {
            var modal = this;
            var iframe = modal.iframe;
            var iframeW = iframe.contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(this.namespace + " " + frameid + " check", "*");
            var redirectTimeout = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error({
                        message: "The modal does not seem to be available.",
                        code: "modal.unavailable"
                    });
            }, this.instance.timeout);
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
                        document.body.style.overflow = "hidden";
                        // Make sure our iframe is of the correct dimension
                        window.onresize = function () {
                            iframe.width = window.outerWidth + "px";
                            iframe.height = window.outerHeight + "px";
                        };
                        window.dispatchEvent(new Event('resize'));
                        // Show the iframe
                        iframe.style.display = "block";
                        iframeW.postMessage(modal.namespace + " " + frameid + " launch", "*");
                        if (typeof (onShow) === typeof (Function))
                            onShow(this);
                        break;
                    case "closeModal":
                        modal.hide();
                        if (typeof (onHide) === typeof (Function))
                            onHide(this);
                        break;
                    case "url":
                        window.location.href = eventSplit[3];
                        break;
                    default:
                        console.log("Could not read event action from modal.", event.data);
                        break;
                }
            }
            window.addEventListener("message", receiveMessage, false);
        };
        /**
         * Hide the modal
         * @return {void}
         */
        Modal.prototype.hide = function () {
            // Hide the modal
            this.iframe.style.display = "none";
            // Put the scrollbar back
            document.body.style.overflow = "";
            this.iframe.remove();
            this.deleted = true;
        };
        /**
         * Specifies if the modal was deleted
         * @return {Boolean}
         */
        Modal.prototype.isDeleted = function () {
            return this.deleted;
        };
        return Modal;
    }());
    ProcessOut.Modal = Modal;
})(ProcessOut || (ProcessOut = {}));
