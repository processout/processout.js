/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut_1) {
    /**
     * ProcessOut main class
     */
    var ProcessOut = (function () {
        /**
         * ProcessOut constructor
         * @param  {string} projectId ProcessOut project ID
         */
        function ProcessOut(projectId) {
            /**
             * Timeout before considering the modal could not be loaded
             * @type {Number}
             */
            this.timeout = 50000;
            this.projectId = projectId;
        }
        /**
         * Get the ProcessOut endpoint of the given subdomain
         * @param  {string} subdomain
         * @return {string}
         */
        ProcessOut.prototype.endpoint = function (subdomain) {
            return "https://" + subdomain + ".processout.dev";
        };
        /**
         * Perform a request to the ProcessOut API
         * @param  {string} method
         * @param  {string} path
         * @param  {Object} data
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        ProcessOut.prototype.apiRequest = function (method, path, data, success, error) {
            $.ajax({
                method: method,
                dataType: "json",
                username: this.projectId,
                url: this.endpoint("api") + path,
                success: function (data, code, jqxhr) {
                    success(data, code, jqxhr);
                },
                error: function () {
                    error();
                }
            });
        };
        /**
         * Create a new modal
         * @param  {string}   url
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        ProcessOut.prototype.newModal = function (url, success, error) {
            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = jQuery('<iframe/>');
            iframe.addClass('processout-iframe')
                .attr('id', 'processout-iframe-' + uniqId)
                .attr('src', url)
                .attr('style', 'position: fixed; top: 0; left: 0; background: none;'
                + '-webkit-transform:translateZ(1px);'
                + '-moz-transform:translateZ(1px);'
                + '-o-transform:translateZ(1px);'
                + 'transform:translateZ(1px);')
                .attr('frameborder', '0')
                .attr('allowtransparency', 'true');
            // Hide and add our iframe to the DOM
            iframe.hide();
            iframe.appendTo('body');
            var iframeError = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error({
                        message: "Could not properly load the modal.",
                        code: "modal.network-error"
                    });
            }, this.timeout);
            iframe.load(function () {
                clearTimeout(iframeError);
                if (typeof (success) === typeof (Function))
                    success(new ProcessOut_1.Modal(this, iframe, uniqId));
            });
        };
        return ProcessOut;
    })();
    ProcessOut_1.ProcessOut = ProcessOut;
})(ProcessOut || (ProcessOut = {}));
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
         * @param  {domElement} iframe
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
            var iframeW = iframe.get(0).contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(this.namespace + ' ' + frameid + ' check', '*');
            var redirectTimeout = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error({
                        message: "The modal does not seem to be available.",
                        code: "modal.unavailable"
                    });
            }, this.instance.timeout);
            var oldCursor = jQuery('body').css('cursor');
            function receiveMessage(event) {
                var eventSplit = event.data.split(' ');
                if (eventSplit[0] != modal.namespace)
                    return;
                if (eventSplit[1] != frameid)
                    return;
                switch (eventSplit[2]) {
                    case 'openModal':
                        // Clear the timeout
                        clearTimeout(redirectTimeout);
                        // Make sure that we can't scroll behind the modal
                        jQuery('body').css('overflow', 'hidden');
                        // Make sure our iframe is of the correct dimension
                        jQuery(window).resize(function () {
                            iframe.width(jQuery(window).outerWidth());
                            iframe.height(jQuery(window).outerHeight());
                        });
                        jQuery(window).trigger('resize');
                        // Show the iframe
                        iframe.fadeIn(200);
                        iframeW.postMessage(modal.namespace + ' ' + frameid + ' launch', '*');
                        if (typeof (onShow) === typeof (Function))
                            onShow(this);
                        break;
                    case 'closeModal':
                        modal.hide();
                        if (typeof (onHide) === typeof (Function))
                            onHide(this);
                        break;
                    case 'url':
                        window.location.href = eventSplit[3];
                        break;
                    default:
                        console.log('Could not read event action from modal.', event.data);
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
            this.iframe.fadeOut(200);
            // Put the scrollbar back
            jQuery('body').css('overflow', '');
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
    })();
    ProcessOut.Modal = Modal;
})(ProcessOut || (ProcessOut = {}));
/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut UIComponent class
     */
    var UIComponent = (function () {
        function UIComponent(url) {
            $.ajax({
                dataType: "json",
                url: url,
                success: function () {
                }
            });
        }
        return UIComponent;
    })();
})(ProcessOut || (ProcessOut = {}));
/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut Gateway class
     */
    var Gateway = (function () {
        /**
         * Constructor, copies data to object
         */
        function Gateway(data) {
            this.name = data.name;
            this.displayName = data.display_name;
            this.publicKeys = data.public_keys;
            this.methods = data.methods;
        }
        return Gateway;
    })();
    ProcessOut.Gateway = Gateway;
})(ProcessOut || (ProcessOut = {}));
/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut Invoice class
     */
    var Invoice = (function () {
        function Invoice(instance) {
            this.instance = instance;
        }
        Invoice.prototype.find = function (uid, success, error) {
            this.uid = uid;
            this.instance.apiRequest("get", "/invoices/" + uid, {}, function (data, code, jqxhr) {
                this.data = data;
                this.instance.apiRequest("get", "/invoices/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    for (var i = 0; i < data.gateways.length; i++) {
                        this.gatewaysList[i] = new ProcessOut.Gateway(data.gateways[i]);
                    }
                    success(this);
                }, function () {
                    error();
                });
            }, function () {
                error();
            });
        };
        Invoice.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return Invoice;
    })();
    ProcessOut.Invoice = Invoice;
})(ProcessOut || (ProcessOut = {}));
/// <reference path="processout/processout.ts" />
/// <reference path="processout/modal.ts" />
/// <reference path="processout/uicomponent.ts" />
/// <reference path="processout/gateway.ts" />
/// <reference path="processout/invoice.ts" /> 
/// <reference path="../references.ts" />
var startProcessOut = function () {
    var processOut = new ProcessOut.ProcessOut('');
    // Loop through each modal button
    jQuery('.processout-modal-button').each(function () {
        var button = jQuery(this);
        var loading = false;
        var modal = null;
        button.on('mouseover', function () {
            if (loading || (modal != null && !modal.isDeleted()))
                return;
            loading = true;
            modal = processOut.newModal(button.attr('href'), function (modal) {
                button.on('click', function () {
                    if (modal.isDeleted())
                        return;
                    loading = false;
                    jQuery('body').css('cursor', 'auto');
                    modal.show();
                });
            }, function (err) {
                console.log('Could not properly load the modal');
                button.on('click', function () {
                    loading = false;
                    jQuery('body').css('cursor', 'auto');
                    window.location.href = button.attr('href');
                });
            });
        });
        button.on('click', function () {
            if (!loading)
                return false;
            jQuery('body').css('cursor', 'wait');
            setTimeout(function () {
                button.trigger('click');
            }, 500);
            return false;
        });
    });
};
startProcessOut();
