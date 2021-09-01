/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
 module ProcessOut {
    /**
     * PaymentToken is the class handling a Payment token payload
     */
    export class PaymentToken {
       /**
         * Payload sent along when creating the ProcessOut Payment token payment.
         * @type {any}
         */
        protected payload: any;

       /**
         * tokenType is the type of the Payment token
         * @type {TokenType}
         */
        protected tokenType: TokenType;

        /**
         * Payment token constructor
         * @param {TokenType} tokenType
         * @param {string} payload
         */
        public constructor(tokenType: TokenType, payload: any) {
            this.tokenType = tokenType;
            this.payload = payload;
        }

        public getTokenType(): TokenType {
            return this.tokenType;
        }

        public getPayload(): any {
            return this.payload;
        }

    }

    export enum TokenType {
        GooglePay = "googlepay"
    }


 }