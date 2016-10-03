/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {
    /**
     * ProcessOut Gateway class
     */
    export class TestGateway extends Gateway {

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
            //
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

            if (card.getNumber() != "4242424242424242") {
                // We only want this card for our tests
                error(new Exception("card.declined"));
                return;
            }

            // We have special cases depending on the CVC of the card
            switch (card.getCVC()) {
            case "666":
                // Card will be disputed
                success(this.createProcessOutToken("test-dispute"));
                return;
            case "500":
                // Card will be declined
                success(this.createProcessOutToken("test-declined"));
                return;
            case "600":
                // Card will be authorize-only
                success(this.createProcessOutToken("test-authorize-only"));
                return;
            }

            // Everything else is a correct card with no side effect
            success(this.createProcessOutToken("test-valid"));
        }

    }

}
