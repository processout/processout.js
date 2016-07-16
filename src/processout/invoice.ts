/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut Invoice class
     */
    export class Invoice {

        /**
         * ProcessOut instance
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * UID of the invoice
         * @type {ProcessOut}
         */
        protected uid: string;

        /**
         * Raw data of the invoice gathered from the ProcessOut API
         * @type {Object}
         */
        data: Object;

        /**
         * List of the available gateways for the invoice
         * @type {Gateways.Gateway[]}
         */
        protected gatewaysList: Gateways.Gateway[];

        /**
         * Invoice constructor
         */
        constructor(instance: ProcessOut) {
            this.instance = instance;
        }

        /**
         * Find the requested invoice by its UID
         * @param {string} uid
         * @param {callback} success
         * @param {callback} error
         */
        find(uid: string, success, error) {
            this.uid = uid;

            this.instance.apiRequest("get", "/invoices/"+uid, {},
            function(data, code, jqxhr) {
                this.data = data;

                this.instance.apiRequest("get", "/invoices/"+uid+"/gateways", {},
                function(data, code, jqxhr) {
                    for (var i = 0; i < data.gateways.length; i++) {
                        this.gatewaysList[i] = Gateways.Manager.buildGateway(this.instance,
                            data);
                    }

                    success(this);
                }, function() {
                    error();
                });
            }, function() {
                error();
            });
        }

        /**
         * Get the available gateways list for this invoice
         * @return {Gateways.Gateway[]}
         */
        gateways(): Gateways.Gateway[] {
            return this.gatewaysList;
        }
        
    }

}
