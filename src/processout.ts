/**
 * ProcessOut module/namespace
 */
module ProcessOut {
    /**
     * ProcessOut class
     */
    export class ProcessOut {
        /**
         * Project ID
         * @type {string}
         */
        projectId: string;

        /**
         * ProcessOut checkout endpoint
         * @type {string}
         */
        checkoutEdpoint = "https://checkout.processout.com";

        /**
         * ProcessOut constructor
         * @param  {string} projectId ProcessOut project ID
         */
        constructor(projectId: string) {
            this.projectId = projectId;
        }

        /**
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        urlModal(url: string, success, error) {
            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = $('<iframe/>');
            iframe.addClass('processout-iframe')
                .attr('id', 'processout-iframe-' + uniqId)
                .attr('src', url)
                .attr('style', 'position: fixed; z-index: 999999; top: 0; left: 0; background: none;')
                .attr('frameborder', '0')
                .attr('allowtransparency', 'true');

            // Hide and add our iframe to the DOM
            iframe.hide();
            iframe.appendTo('body');

            var iframeError = setTimeout(function() {
                if (typeof(error) === typeof(Function))
                    error({
                        message: "Could not properly load the modal.",
                        code: "modal.network-error"
                    });
            }, 5000);
            iframe.load(function() {
                clearTimeout(iframeError);
                if (typeof(success) === typeof(Function))
                    success(new Modal(iframe, uniqId));
            });
        }

        /**
         * Create a new invoice modal
         * @param  {string}     id
         * @param  {[callback]} success
         * @param  {[callback]} error
         * @return {void}
         */
        invoiceModal(id: string, success, error) {
            return this.urlModal(this.checkoutEdpoint + '/' + id,
                success, error);
        }

        /**
         * Create a new recurring invoice modal
         * @param  {string}     id
         * @param  {[callback]} success
         * @param  {[callback]} error
         * @return {void}
         */
        recurringInvoiceModal(id: string, success, error) {
            return this.urlModal(this.checkoutEdpoint + '/recurring-invoices/' +
                id, success, error);
        }

        /**
         * Create a new authorization modal
         * @param  {string}     id
         * @param  {[callback]} success
         * @param  {[callback]} error
         * @return {void}
         */
        authorizationModal(customerId: string, success, error) {
            return this.urlModal(this.checkoutEdpoint + '/authorizations/' +
                this.projectId + '/customers/' + customerId,
                success, error);
        }
    }

    /**
     * ProcessOut modal class
     */
    class Modal {
        /**
         * Modal iFrame
         * @type {[domElement]}
         */
        iframe;

        /**
         * Unique ID of the modal
         * @type {string}
         */
        uniqId: string;

        /**
         * Modal constructor
         * @param  {[domElement]} iframe
         * @param  {string}       uniqId
         */
        constructor(iframe, uniqId: string) {
            this.iframe = iframe;
            this.uniqId = uniqId;
        }

        /**
         * Show the modal
         * @param  {[callback]} success
         * @param  {[callback]} error
         * @return {[void]}
         */
        show(success, error) {
            var modal   = this;
            var iframe  = modal.iframe;
            var iframeW = iframe.get(0).contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage('check ' + frameid, '*');
            var redirectTimeout =
                setTimeout(function(){
                    if (typeof(error) === typeof(Function))
                        error({
                            message: "The modal does not seem to be available.",
                            code: "modal.unavailable"
                        });
                }, 1000);

            function receiveMessage(event) {
                var eventSplit = event.data.split(' ');
                var action     = eventSplit[0];

                if (eventSplit[1] != undefined && eventSplit[1] != frameid)
                    return;

                switch (action) {
                    case 'openModal':
                        // Clear the timeout
                        clearTimeout(redirectTimeout);
                        // Make sure that we can't scroll behind the modal
                        $('body').css('overflow', 'hidden');
                        // Make sure our iframe is of the correct dimension
                        $(window).resize(function() {
                            iframe.width($(window).outerWidth());
                            iframe.height($(window).outerHeight());
                        });
                        $(window).trigger('resize');
                        // Show the iframe
                        iframe.fadeIn(200);
                        iframeW.postMessage('launch', '*');
                        if (typeof(success) === typeof(Function))
                            success(iframe);
                        break;

                    case 'closeModal':
                        modal.hide();
                        break;

                    default:
                        window.location.href = event.data;
                        break;
                }
            }
            window.addEventListener("message", receiveMessage, false);
        }

        /**
         * Hide the modal
         * @return {[void]}
         */
        hide() {
            // Hide the modal
            this.iframe.fadeOut(200);
            // Put the scroll back
            $('body').css('overflow', '');
        }
    }
}
