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
        /**
         * Invoice constructor
         */
        function Invoice(instance) {
            this.instance = instance;
        }
        /**
         * Find the requested invoice by its UID
         * @param {string} uid
         * @param {callback} success
         * @param {callback} error
         */
        Invoice.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/invoices/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/invoices/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/invoices/" + uid, ProcessOut.Flow.OneOff);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The invoice's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The invoice could not be found."
                });
            });
        };
        /**
         * Get the available gateways list for this invoice
         * @return {Gateways.Gateway[]}
         */
        Invoice.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return Invoice;
    }());
    ProcessOut.Invoice = Invoice;
})(ProcessOut || (ProcessOut = {}));
