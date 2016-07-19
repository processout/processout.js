/// <reference path="../references.ts" />
/**
 * ProcessOut module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    /**
     * ProcessOut payment flow enum
     */
    (function (Flow) {
        Flow[Flow["None"] = 1] = "None";
        Flow[Flow["OneOff"] = 2] = "OneOff";
        Flow[Flow["Recurring"] = 3] = "Recurring";
        Flow[Flow["OneClickAuthorization"] = 4] = "OneClickAuthorization";
    })(ProcessOut.Flow || (ProcessOut.Flow = {}));
    var Flow = ProcessOut.Flow;
})(ProcessOut || (ProcessOut = {}));
