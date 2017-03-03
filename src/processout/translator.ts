/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    const messages: {[locale: string]: {[name:string]: string}} = {
        "en": {
            "default":                 "An error occured.",
            "card.declined":           "The credit card has been declined.",
            "card.expired":            "The given card has expired.",
            "card.duplicate":          "The payment could not be completed. Please try again later.",
            "card.network-failed":     "The payment could not be completed. Please try again later.",
            "card.invalid":            "The given card is invalid.",
            "card.invalid-number":     "The card number is invalid.",
            "card.invalid-date":       "The card expiry date is invalid.",
            "card.invalid-month":      "The card expiry month is invalid.",
            "card.invalid-year":       "The card expiry year is invalid.",
            "card.invalid-cvc":        "The card CVC is invalid.",
            "card.invalid-zip":        "The card's ZIP code is valid.",
            "card.failed-cvc-and-avs": "The CVC and AVS code were invalid.",
            "card.bad-track-data":     "The card could not be verified. Maybe your CVC is invalid?",
            "card.not-registered":     "The card is not registered.",
            "card.issuer-not-found":   "The card issuer could not be found. Please try another card.",
            "card.possible-fraud":     "The payment could not be completed. Please contact your bank for further help.",
            "card.contact-bank":       "The payment could not be completed. Please contact your bank for further help.",
            "card.not-authorized":     "The payment could not be authorized using the provided card.",
            "card.do-not-honor":       "The payment could not be completed. Please contact your bank for further help.",
            "card.maximum-attempts":   "The card maximum attempts has been reached and the payment could not be processed.",
            "card.stolen":             "The payment could not be processed as the provided card was marked as stolen.",
            "card.lost":               "The payment could not be processed as the provided card was marked as lost.",
            "card.exceeded-limits":    "The payment could not be processed as the payment limits of the card have been exceeded.",
            "card.no-money":           "There doesn't seem to be enough money on the bank account linked to the provided card.",
            "customer.canceled":       "The customer canceled the payment.",
            "customer.popup-blocked":  "Please allow pop-ups to continue with your payment flow.",
            "payment.declined":        "The payment has been declined.",
            "payment.pending":         "The payment is currently pending, please wait a few minutes for it to fully go through.",

            "request.validation.error":              "The provided information is invalid or missing.",
            "request.validation.invalid-country":    "The provided country is invalid.",
            "request.validation.missing-name":       "A name must be provided.",
            "request.validation.invalid-name":       "The provided name is invalid.",
            "request.validation.missing-email":      "An email must be provided.",
            "request.validation.invalid-email":      "The provided email is invalid.",
            "request.validation.invalid-address":    "The provided address is invalid.",
            "request.validation.no-method-selected": "Please select a payment method.",

            "request.gateway.not-available": "The requested gateway is currently unavailable.",
            "request.gateway.not-supported": "The gateway is not supported by ProcessOut.js",

            "processout-js.not-hosted":                    "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable":             "The ProcessOut.js modal is unavailable.",
            "processout-js.field.unavailable":             "The ProcessOut.js credit card field is unavailable.",
            "processout-js.invalid-config":                "The provided gateway configuration is invalid.",
            "processout-js.no-customer-action":            "No customer action is required for the given gateway configuration and resource.",
            "processout-js.customer-action-not-supported": "The requested customer action is not supported by ProcessOut.js.",
            "processout-js.invalid-field":                 "The given HTML element may not be used by ProcessOut.js: it is an input. Please only use divs when creating a ProcessOut.js credit card field.",
            "processout-js.undefined-field":               "The given HTML element was undefined.",
            "processout-js.invalid-field-type":            "The given field type was incorrect. It must either be number, expiry, expiryMonth, expiryYear or CVC.",

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
