/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
    
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
             * invoiceID is the ID of the invoice to be used to initiate the
             * 3-D Secure authentication flow
             * @type {string}
             */
            protected invoiceID: string;

            /**
             * source contains the source to be used for the 3DS authentication.
             * It can be a card token, or a customer token representing a card
             * @type {string}
             */
            protected source: string;

            /**
             * ThreeDS constructor
             * @param {ProcessOut} instance
             * @param {string} invoiceID
             */
            constructor(instance: ProcessOut, options: ThreeDSOptions) {
                this.instance  = instance;

                if (!options.invoiceID || !options.source) {
                    throw new Exception("request.validation.error", "Please provide an invoiceID and source to be used to start the 3D Secure flow.");
                }

                this.invoiceID = options.invoiceID;
                this.source    = options.source;
            }
    
            /**
             * handle handles the 3-D Secure authentication using the 
             * ActionHandler object
             * @param {callback} success 
             * @param {callback} error 
             * @return {ActionHandler}
             */
            public handle(success: ()                 => void,
                          error:   (err:   Exception) => void): ActionHandler {

                var t = this;
                var link = `${this.invoiceID}/three-d-s/redirect/${this.source}`;
                return this.instance.handleAction(this.instance.endpoint("checkout", link),
                    function(token) { success(); }, error);
            }
    
        }
    
    }
    