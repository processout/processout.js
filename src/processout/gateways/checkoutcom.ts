/// <reference path="../../references.ts" />

declare var CKOAPI: any;

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * CKOAPI is the library we load from their js
     */
    declare var CKOAPI: any;

    /**
     * ProcessOut Gateway class
     */
    export class CheckoutcomGateway extends Gateway {

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
            if (this.instance.isDebug())
                f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
            else
                f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
            f.setAttribute("data-namespace", "CKOAPI");

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

            CKOAPI.configure({
                publicKey: this.getPublicKey("public_key"),
                apiError: function (event: any): void {
                    if (event.data.errorCode == "70000") {
                        error(new Exception("default"));
                        return;
                    }

                    error(new Exception("card.declined"));
                }
            });

            CKOAPI.createCardToken({
                "number":      card.getNumber(),
                "cvv":         card.getCVC(),
                "expiryMonth": card.getExpiry().getMonth(),
                "expiryYear":  card.getExpiry().getYear(),
            }, function(v: any) {
                if (!v.id) {
                    error(new Exception("card.declined"));
                    return;
                }

                success(v.id);
            });
        }

    }

}
