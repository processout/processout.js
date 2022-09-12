/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export type ApiRequestError =
      | "processout-js.internal-server-error"
      | "processout-js.not-implemented"
      | "processout-js.invalid-response"
      | "processout-js.service-unavailable"
      | "processout-js.response-timeout"
      | "processout-js.http-version-not-supported"
      | "processout-js.network-auth-required"
      | "processout-js.network-issue"
      | "processout-js.aborted-retries-exceeded"

    const errors: {[locale: string]: {[ name: string | ApiRequestError ]: string}} = {
        "en": {
            "default":                 "An error occured: your payment was declined.",
            "card.declined":           "The credit card has been declined.",
            "card.expired":            "The given card has expired.",
            "card.duplicate":          "The payment could not be completed. Please try again later.",
            "card.network-failed":     "The payment could not be completed. Please try again later.",
            "card.invalid":            "The given card is invalid.",
            "card.invalid-name":       "The cardholder name is invalid.",
            "card.invalid-number":     "The card number is invalid.",
            "card.invalid-date":       "The card expiry date is invalid.",
            "card.invalid-month":      "The card expiry month is invalid.",
            "card.invalid-year":       "The card expiry year is invalid.",
            "card.invalid-cvc":        "The card CVC is invalid.",
            "card.missing-cvc":        "The card CVC is required.",
            "card.invalid-zip":        "The card's ZIP code is valid.",
            "card.failed-cvc-and-avs": "The CVC and AVS code were invalid.",
            "card.failed-three-d-s":   "The 3D-Secure authentication failed.",
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
            "gateway.declined":        "The payment was declined.",
            "payment.declined":        "The payment was declined.",
            "payment.pending":         "The payment is currently pending, please wait a few minutes for it to fully go through.",
            "three-d-s-2.fingerprint-timed-out": "The 3-D Secure fingerprinting timed out.",

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

            "processout-js.missing-project-id":            "Your project ID was not specified when loading ProcessOut.js.",
            "processout-js.not-hosted":                    "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable":             "The ProcessOut.js modal is unavailable.",
            "processout-js.field.unavailable":             "The ProcessOut.js credit card field is unavailable.",
            "processout-js.invalid-config":                "The provided gateway configuration is invalid.",
            "processout-js.no-customer-action":            "No customer action is required for the given gateway configuration and resource.",
            "processout-js.customer-action-not-supported": "The requested customer action is not supported by ProcessOut.js.",
            "processout-js.invalid-field":                 "The given HTML element may not be used by ProcessOut.js: it is an input. Please only use divs when creating a ProcessOut.js credit card field.",
            "processout-js.undefined-field":               "The given HTML element was undefined.",
            "processout-js.invalid-field-type":            "The given field type was incorrect. It must either be number, expiry, expiryMonth, expiryYear or CVC.",
            "processout-js.invalid-type":                  "The specified parameter had an unknown type.",
            "processout-js.missing-source":                "A source must be specified.",
            "processout-js.wrong-type-for-action":         "The requested action could not be performed on the given field because its type is invalid.",
            "processout-js.missing-invoice-id":            "An invoice ID must be specified.",
            "processout-js.missing-resource-id":           "A resource ID must be specified.",

            "processout-js.internal-server-error":         "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.not-implemented":               "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.invalid-response":              "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.service-unavailable":           "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.response-timeout":              "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.http-version-not-supported":    "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.network-auth-required":         "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.aborted-retries-exceeded":      "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.network-issue":                 "There seems to be some connectivity issue preventing the payment from making it through. Please switch to another network or try again in a few minutes.",

            "resource.invalid-type": "The provided resource was invalid. It must be an invoice, a subscription or an authorization request.",

            "applepay.not-supported":      "The current browser/device does not support Apple Pay.",
            "applepay.no-success-handler": "A success handler must be specified when setting up Apple Pay.",
            "applepay.not-available":      "Apple Pay is not available for the current browser, device or ProcessOut project."
        },
        "fr": {
            "default": "Une erreur est survenue lors du paiement.",
        }
    };

    const messages: {[locale: string]: {[name:string]: string}} = {
        "en": {
            "label.cancel":          "Cancel",
            "label.apm-description": "A new window was opened to process your payment. Click here to continue."
        },
        "fr": {
            "label.cancel":          "Annuler",
            "label.apm-description": "Une nouvelle fen&ecirc;tre s'est ouverte pour proc&eacute;der au paiement. Cliquez ici pour continuer."
        }
    };

    const defaultLocale: string = "en";

    export class Translator {
        protected static getTranslated(l: {[locale: string]: {[name:string]: string}}, code: string, message?: string): string {
            if (l[this.getLocale()] && l[this.getLocale()][code])
                return l[this.getLocale()][code];
            if (l[defaultLocale][code])
                return l[defaultLocale][code];

            if (message)                                               return message;
            if (l[this.getLocale()] && l[this.getLocale()]["default"]) return l[this.getLocale()]["default"];
            if (l[defaultLocale]["default"])                           return l[defaultLocale]["default"];
            return code;
        }

        /**
         * translateError returns the translated error if found, or the default
         * error message otherwise
         * @param {string} code
         * @param {string?} message
         * @return string
         */
        public static translateError(code: string, message?: string): string {
            return this.getTranslated(errors, code, message);
        }

        /**
         * translateMessage returns the translated message if found, or the default
         * message otherwise
         * @param {string} code
         * @param {string?} message
         * @return string
         */
        public static translateMessage(code: string, message?: string): string {
            return this.getTranslated(messages, code, message);
        }

        /**
         * setLocale sets the Translator locale
         * @param {string} locale
         * @return void
         */
        public static getLocale(): string {
            var locale = navigator.language || (<any>navigator).userLanguage;
            if (locale.length < 2) return "en";
            return locale.substring(0, 2).toLowerCase();
        }
    }

}
