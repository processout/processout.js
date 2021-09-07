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
        protected payload: unknown;

       /**
         * tokenType is the type of the Payment token
         * @type {TokenType}
         */
        protected tokenType: TokenType;

        /**
         * Payment token constructor
         * @param {TokenType} tokenType
         * @param {any} payload
         */
        public constructor(tokenType: TokenType, payload: unknown) {
            this.tokenType = tokenType;
            this.payload = payload;
        }

        /**
         * getTokenType returns payment token type
         * @return {TokenType}
         */
        public getTokenType(): TokenType {
            return this.tokenType;
        }

        /**
         * getPayload returns payment token payload
         * @return {unknown}
         */
        public getPayload(): unknown {
            return this.payload;
        }

    }

    /**
     * TokenType represents the supported token types
     * @return {string}
     */
    export enum TokenType {
        GooglePay = "googlepay"
    }

    /**
     * GooglePayPayload models the expected JSON token payload the merchant will send
     */
    export type GooglePayPayload = {
        signature: string,
        intermediateSigningKey: {
            signedKey: {
                keyValue: string,
                keyExpiration: number
            },
            signatures: Array<string>,
        },
        protocolVersion: string,
        signedMessage: string
    }
 }