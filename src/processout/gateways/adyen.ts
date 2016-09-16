/// <reference path="../../references.ts" />

declare var adyen: any;

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * adyen is the library we load from their js
     */
    declare var adyen: any;

    /**
     * ProcessOut Gateway class
     */
    export class AdyenGateway extends Gateway {

        /**
         * Constructor, copies data to object
         * @param {GatewayConfiguration} gatewayConfiguration
         * @param {ProcessOut} instance
         */
        constructor(gatewayConfiguration: GatewayConfiguration,
            instance: ProcessOut) {

            super(gatewayConfiguration, instance);
        }

        /**
         * Setup the current gateway (such as loading the required js library)
         * @return {void}
         */
        setup(): void {
            var f = document.createElement("script");
            f.setAttribute("type", "text/javascript");
            f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");

            document.body.appendChild(f);
        }

        /**
         * Tokenize takes the credit card object and creates a ProcessOut
         * token that can be sent to your server and used to charge your
         * customer
         * @param  {ProcessOut.Card} card
         * @param  {callback} success
         * @param  {callback} error
         * @return {void}
         */
        public tokenize(card: ProcessOut.Card,
            success: (token: string) => void,
            error:   (err: ProcessOut.Exception) => void): void {

            var cseInstance = adyen.encrypt.createEncryption(
                this.getPublicKey("hosted_client_encryption_token"), {
                    enableValidations: false
                });

            success(this.createProcessOutToken(cseInstance.encrypt({
                number:         card.getNumber(),
                cvc:            card.getCVC(),
                holderName:     name,
                expiryMonth:    card.getExpiry().getMonth().toString(),
                expiryYear:     card.getExpiry().getYear().toString(),
                generationtime: new Date(Date.now()).toISOString()
            })));
        }

    }

}
