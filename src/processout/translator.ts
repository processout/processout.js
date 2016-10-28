/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    const messages: {[locale: string]: {[name:string]: string}} = {
        "en": {
            "default":                "An error occured.",
            "card.declined":          "The credit card has been declined.",
            "card.expired":           "The given card has exprired.",
            "card.invalid":           "The given card is invalid.",
            "card.invalid-number":    "The card number is invalid.",
            "card.invalid-date":      "The card expiry date is invalid.",
            "card.invalid-month":     "The card expiry month is invalid.",
            "card.invalid-year":      "The card expiry year is invalid.",
            "card.invalid-cvc":       "The card CVC is invalid.",
            "card.invalid-zip":       "The card's ZIP code is valid.",
            "customer.canceled":      "The customer canceled the payment.",
            "customer.popup-blocked": "Please allow pop-ups to continue with your payment flow.",
            "payment.declined":       "The payment has been declined.",

            "request.validation.error":           "The provided information is invalid or missing.",
            "request.validation.invalid-country": "The provided country is invalid.",
            "request.validation.missing-name":    "A name must be provided.",
            "request.validation.invalid-name":    "The provided name is invalid.",
            "request.validation.missing-email":   "An email must be provided.",
            "request.validation.invalid-email":   "The provided email is invalid.",
            "request.validation.invalid-address": "The provided address is invalid.",

            "request.gateway.not-available": "The requested gateway is currently unavailable.",
            "request.gateway.not-supported": "The gateway is not supported by ProcessOut.js",

            "processout-js.not-hosted":        "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable": "The ProcessOut.js modal is unavailable.",
            "processout-js.invalid-config":    "The provided gateway configuration is invalid.",
            "processout-js.no-customer-action": "No customer action is required for the given gateway configuration and resource.",
            "processout-js.customer-action-not-supported": "The requested customer action is not supported by ProcessOut.js.",

            "resource.invalid-type": "The provided resource was invalid. It must be an invoice, a subscription or an authorization request."
        },
    };

    export class Translator {
        protected static locale: string = "en";

        /**
         * translate returns the translated message if found, or the default
         * error message otherwise
         * @param {string} code
         * @return string
         */
        public static translate(code: string): string {
            if (!messages[Translator.locale][code])
                return messages[Translator.locale]["default"];

            return messages[Translator.locale][code];
        }

        /**
         * setLocale sets the Translator locale
         * @param {string} locale
         * @return void
         */
        public static setLocale(locale: string): void {
            if (!messages[locale])
                return;

            Translator.locale = locale;
        }
    }

}
