/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut main class
     */
    export class ProcessOut {

        /**
         * Project ID
         * @type {string}
         */
        projectId: string;

        /**
         * Timeout before considering the modal could not be loaded
         * @type {Number}
         */
        timeout = 50000;

        /**
         * ProcessOut constructor
         * @param  {string} projectId ProcessOut project ID
         */
        constructor(projectId: string) {
            this.projectId = projectId;
        }

        /**
         * Get the ProcessOut endpoint of the given subdomain
         * @param  {string} subdomain
         * @return {string}
         */
        endpoint(subdomain: string): string {
            return "https://" + subdomain + ".processout.dev";
        }

        /**
         * Perform a request to the ProcessOut API
         * @param  {string} method
         * @param  {string} path
         * @param  {Object} data
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        apiRequest(method: string, path: string, data, success, error) {
            $.ajax({
                method: method,
                dataType: "json",
                username: this.projectId,
                url: this.endpoint("api") + path,
                success: function(data, code, jqxhr) {
                    success(data, code, jqxhr);
                },
                error: function() {
                    error();
                }
            });
        }

        /**
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        newModal(url: string, success, error) {
            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = jQuery('<iframe/>');
            iframe.addClass('processout-iframe')
                .attr('id', 'processout-iframe-' + uniqId)
                .attr('src', url)
                .attr('style', 'position: fixed; top: 0; left: 0; background: none;'
                    // We need to use translateZ instead of z-index, otherwise
                    // z-index might not work on some mobiles
                    +'-webkit-transform:translateZ(1px);'
                    +'-moz-transform:translateZ(1px);'
                    +'-o-transform:translateZ(1px);'
                    +'transform:translateZ(1px);')
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
            }, this.timeout);
            iframe.load(function() {
                clearTimeout(iframeError);
                if (typeof(success) === typeof(Function))
                    success(new Modal(this, iframe, uniqId));
            });
        }

    }
    
}
