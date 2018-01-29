/// <reference path="../references.ts" />
/// <reference path="applepay.d.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class ThreeDSOptions {
        /**
         * invoiceID contains the ID of the invoice to be authenticated using
         * the 3-D Secure protocole
         * @type {string}
         */
        public invoiceID?: string;

        /**
         * amount is the amount used to create a 3D-Secure authentication if
         * no invoice ID is specified
         * @type {string}
         */
        public amount?: string;

        /**
         * currency is the currency used to create a 3D-Secure authentication
         * if no invoice ID is spcified
         * @type {string}
         */
        public currency?: string;

        /**
         * name is the name of the invoice that'll be created to initiate the
         * 3D-Secure authentication if no invoice ID is specified
         * @type {string}
         */
        public name?: string;

        /**
         * metadata is the metadata that'll be associated with the invoice
         * used to initiate the 3D-Secure authentication if no invoice ID is
         * specified
         * @type {object}
         */
        public metadata?: any;

        /**
         * returnURL is the URL to which the user is redirected when
         * he finishes the 3D-Secure authentication, if no invoice ID is
         * specified when initiating the flow
         * @type {string}
         */
        public returnURL?: string;

        /**
         * cancelURL is the URL to which the user is redirected when
         * he cancels the 3D-Secure authentication, if no invoice ID is
         * specified when initiating the flow
         * @type {string}
         */
        public cancelURL?: string;

        /**
         * source contains the source to be used to authenticate the invoice
         * @type {string}
         */
        public source: string;
    }
    
    export class ThreeDSWrapper {
        /**
         * ProcessOut instance of the current context
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

            /**
         * ThreeDSWrapper constructor
         * @param {ProcessOut} instance
         */
        constructor(instance: ProcessOut) {
            this.instance = instance;
        }

        /**
         * authenticate authenticates the invoice using the 3D secure protocole
         * with the provided card. Success is called when the authentication
         * succeeds. If an error occurs during the authentication, error is
         * called with the exception
         * @param {ThreeDSOptions} options 
         * @param {callback} success 
         * @param {callback} error 
         * @return {ActionHandler}
         */
        public authenticate(options: ThreeDSOptions,
            success: (invoiceID: string)    => void, 
            error?:  (e:         Exception) => void): ActionHandler {

            return new ThreeDS(this.instance, options).handle(success, error);
        }
    }

}
    