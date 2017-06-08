/// <reference path="../references.ts" />
/// <reference path="applepay.d.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class ApplePayWrapper {
        /**
         * ProcessOut instance of the current context
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

         /**
         * ApplePayWrapper constructor
         * @param {ProcessOut} instance
         */
        constructor(instance: ProcessOut) {
            this.instance = instance;
        }

        /**
         * checkAvailability calls the callback handler with null if ApplePay
         * can be used on the device, an error otherwise. The function itself
         * returns void and is not blocking
         * @param {(err: Exception) => void} callback
         * @return {void}
         */ 
        public checkAvailability(callback: (err: Exception) => void): void {
            // Let's first check if the browser itself supports ApplePay
            if (!(<any>window).ApplePaySession || !ApplePaySession.canMakePayments()) {
                callback(new Exception("applepay.not-supported"));
                return;
            }

            this.instance.apiRequest("get", this.instance.endpoint("api", "applepay/available"), {
                "domain_name": window.location.hostname
            }, 
                function(data: any, code: number, req: XMLHttpRequest, 
                    e: Event): void {

                    if (data.success)
                        callback(null);
                    else
                        callback(new Exception("applepay.not-available", data.message));
                }.bind(this), function(code: number, req: XMLHttpRequest, e: Event): void {
                    callback(new Exception("processout-js.network-issue"));
                });
        }

        public newSession(req: ApplePayPaymentRequest,
            onsuccess: (e: any) => void, onerror?: (e: any) => void): ApplePay {
            
            return new ApplePay(this.instance, req);
        }
    }

}
