/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
 module ProcessOut {
    /**
     * NetworkToken is the class handling a network token payload
     */
    export class NetworkToken {
       /**
         * Payload sent along when creating the ProcessOut network token payment.
         * @type {any}
         */
        protected payload: any;

       /**
         * tokenType is the type of the network token
         * @type {TokenType}
         */
        protected tokenType: TokenType;

        /**
         * Network token constructor
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