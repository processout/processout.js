/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut Invoice class
     */
    var Authorization = (function () {
        /**
         * Invoice constructor
         */
        function Authorization(instance) {
            this.instance = instance;
        }
        /**
         * Find the requested authorization by its UID
         * @param {string} uid
         * @param {callback} success
         * @param {callback} error
         */
        Authorization.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/authorizations/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/authorizations/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/authorizations/" + uid, ProcessOut.Flow.OneClickAuthorization);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The authorization's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The authorization could not be found."
                });
            });
        };
        /**
         * Get the available gateways list for this invoice
         * @return {Gateways.Gateway[]}
         */
        Authorization.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return Authorization;
    }());
    ProcessOut.Authorization = Authorization;
})(ProcessOut || (ProcessOut = {}));
