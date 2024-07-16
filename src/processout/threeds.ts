/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    const processoutjsQuery = "processoutjs";
    const processoutjsQueryTrue = "true";

    /**
     * ActionHandler is the class handling the customer actions
     */
    export class ThreeDS {

        /**
         * ProcessOut instance of the current context
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * url contains the URL to which the user should be redirected
         * to initiate the 3DS flow
         * @type {string}
         */
        protected url: string;

        /**
         * ThreeDS constructor
         * @param {ProcessOut} instance
         * @param {ThreeDSOptions} options
         */
        constructor(instance: ProcessOut, options: ThreeDSOptions) {
            this.instance = instance;

            if (!options.source) {
                throw new Exception("request.validation.error", "Please provide a source to be used to start the 3-D Secure flow.");
            }

            var url = options.url;
            if (!url && options.invoiceID) {
                url = `/${this.instance.getProjectID()}/${options.invoiceID}/three-d-s/redirect/${options.source}?${processoutjsQuery}=${processoutjsQueryTrue}`;
            }

            if (!url) {
                url = `/${this.instance.getProjectID()}/three-d-s` +
                    `?${processoutjsQuery}=${processoutjsQueryTrue}` +
                    `&amount=${encodeURIComponent(options.amount)}` +
                    `&currency=${encodeURIComponent(options.currency)}` +
                    `&name=${encodeURIComponent(options.name)}` +
                    `&return_url=${encodeURIComponent(options.returnURL ? options.returnURL : "")}` +
                    `&source=${encodeURIComponent(options.source)}`;

                if (options.metadata && typeof options.metadata == 'object') {
                    for (var i in options.metadata) {
                        if (!options.metadata.hasOwnProperty(i))
                            continue;

                        url += `&metadata[${i}]=${encodeURIComponent(options.metadata[i])}`;
                    }
                }
            }

            if (!url) {
                throw new Exception("request.validation.error", "Please provide a 3DS challenge URL or an invoice ID.");
            }

            this.url = url;
        }

        /**
         * handle handles the 3-D Secure authentication using the
         * ActionHandler object
         * @param {callback} success
         * @param {callback} error
         * @return {ActionHandler}
         */
        public handle(success: (invoiceID: string) => void,
                      error: (err: Exception) => void): ActionHandler {

            return this.instance.handleAction(this.instance.endpoint("checkout", this.url),
                function (invoiceID) {
                    success(invoiceID);
                }, error,
                new ActionHandlerOptions(ActionHandlerOptions.ThreeDSChallengeFlow));
        }

    }


    /**
     * Contains available flows for ExternalThreeDS.
     */
    export enum ExternalThreeDSAuthenticationFlow {
        FRICTIONLESS = "FRICTIONLESS",
        CHALLENGE = "CHALLENGE",
    }

    /**
     * ExternalThreeDS is the class representing the external 3DS result, that was received
     * on a merchant's server after the 3DS authentication was completed.
     *
     * Should be passed inside `options` when calling `ProcessOut.makeCardPayment` via
     * `external_three_d_s` key.
     */
    export class ExternalThreeDS {
        /**
         * Unique identifier of the 3DS transaction. Used for 3DS v1.
         * @type {string}
         */
        public xid?: string;

        /**
         * Cardholder Authentication Verification Value. Used for 3DS v2.
         * @type {string}
         */
        public cavv?: string;

        /**
         * Electronic Commerce Indicator. Used for 3DS v2.
         * @type {string}
         */
        public eci?: string;

        /**
         * The status of the 3DS transaction.
         * @type {string}
         */
        public trans_status?: string;


        /**
         * The unique identifier of the 3DS transaction.
         * @type {string}
         */
        public ds_trans_id?: string;

        /**
         * The version of the 3DS message.
         * @type {string}
         */
        public message_version?: string;

        /**
         * The authentication response code.
         * @type {ExternalThreeDSAuthenticationFlow}
         */
        public three_ds_authentication_flow?: ExternalThreeDSAuthenticationFlow;

        constructor(
            xid?: string,
            cavv?: string,
            eci?: string,
            trans_status?: string,
            ds_trans_id?: string,
            message_version?: string,
            three_ds_authentication_flow?: ExternalThreeDSAuthenticationFlow
        ) {
            this.xid = xid;
            this.cavv = cavv;
            this.eci = eci;
            this.trans_status = trans_status;
            this.ds_trans_id = ds_trans_id;
            this.message_version = message_version;
            this.three_ds_authentication_flow = three_ds_authentication_flow;
        }
    }

}
