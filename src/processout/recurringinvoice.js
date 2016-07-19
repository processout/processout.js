/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut Invoice class
     */
    var RecurringInvoice = (function () {
        /**
         * Invoice constructor
         */
        function RecurringInvoice(instance) {
            this.instance = instance;
        }
        /**
         * Find the requested recurring invoice by its UID
         * @param {string} uid
         * @param {callback} success
         * @param {callback} error
         */
        RecurringInvoice.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/recurring-invoices/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/recurring-invoices/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/recurring-invoices/" + uid, ProcessOut.Flow.Recurring);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The recurring invoice's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The recurring invoice could not be found."
                });
            });
        };
        /**
         * Get the available gateways list for this invoice
         * @return {Gateways.Gateway[]}
         */
        RecurringInvoice.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return RecurringInvoice;
    }());
    ProcessOut.RecurringInvoice = RecurringInvoice;
})(ProcessOut || (ProcessOut = {}));
