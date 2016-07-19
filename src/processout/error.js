/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    var ErrorCode = (function () {
        function ErrorCode() {
        }
        ErrorCode.ProcessOutUnavailable = "processout.unavailable";
        ErrorCode.ResourceNotFound = "resource.not-found";
        ErrorCode.GatewayError = "gateway.error";
        ErrorCode.GatewayInvalidInput = "gateway.invalid-input";
        return ErrorCode;
    }());
    ProcessOut.ErrorCode = ErrorCode;
})(ProcessOut || (ProcessOut = {}));
