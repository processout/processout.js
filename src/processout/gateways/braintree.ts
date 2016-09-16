/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * braintree is the library we load from their js
     */
    declare var braintree: any;

    /**
     * ProcessOut Gateway class
     */
    export class BraintreeGateway extends Gateway {

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
            f.setAttribute("src", "https://js.braintreegateway.com/web/3.2.0/js/client.min.js");

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

            var t = this;
            braintree.client.create({
                authorization: this.token
            }, function(err: any, client: any) {
                if (err) {
                    error(new Exception("request.gateway.not-available"));
                    return;
                }

                client.request({
                    endpoint: 'payment_methods/credit_cards',
                    method:   'post',
                    data: {
                        creditCard: {
                            number:         card.getNumber(),
                            expirationDate: card.getExpiry().string(),
                            cvv:            card.getCVC()
                        }
                    }
                }, function (err, response) {
                    if (err) {
                        error(new Exception("card.declined"));
                        return
                    }

                    success(t.createProcessOutToken(
                        response.creditCards[0].nonce));
                });
            });
        }

    }

}
