/// <reference path="../../references.ts" />

/// <reference path="../../definitions/stripe.d.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * Stripe is the library we load from their js
     */
    declare var Stripe: any;

    /**
     * ProcessOut Gateway class
     */
    export class StripeGateway extends Gateway {

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
            f.setAttribute("src", "https://js.stripe.com/v2/");

            document.body.appendChild(f);
        }

        /**
         * Receives a stripe error code and returns the equivalent ProcessOut
         * error code
         * @param {string} code
         * @return {string}
         */
        protected static convertError(code: string): string {
            var map = {
                "invalid_number":        "card.invalid-number",
                "invalid_expiry_month":  "card.invalid-date",
                "invalid_expiry_year":   "card.invalid-date",
                "invalid_cvc":           "card.invalid-cvc",
                "incorrect_number":      "card.invalid-number",
                "expired_Card":          "card.expired",
                "incorrect_cvc":         "card.invalid-cvc",
                "incorrect_zip":         "card.invalid-zip",
                "card_declined":         "card.declined",
            };

            if (map[code])
                return map[code];

            return "default";
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

            var t = this;
            Stripe.setPublishableKey(this.getPublicKey("public_key"));
            Stripe.card.createToken({
                number: card.getNumber(),
                exp:    card.getExpiry().string(),
                cvc:    card.getCVC()
            }, function(status: any, response: any) {
                if (response.error) {
                    error(new Exception(StripeGateway.convertError(
                        response.error.code)));
                    return;
                }

                success(t.createProcessOutToken(response.id));
            });
        }

    }

}
