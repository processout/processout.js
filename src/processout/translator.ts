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

    const errors: { [locale: string]: { [name: string]: string } } = {
        "en": {
            "default": "An error occured: your payment was declined.",
            "card.declined": "The credit card has been declined.",
            "card.expired": "The given card has expired.",
            "card.duplicate": "The payment could not be completed. Please try again later.",
            "card.network-failed": "The payment could not be completed. Please try again later.",
            "card.invalid": "The given card is invalid.",
            "card.invalid-name": "The cardholder name is invalid.",
            "card.invalid-number": "The card number is invalid.",
            "card.invalid-expiry-date": "The card expiry date is invalid.",
            "card.invalid-expiry-month": "The card expiry month is invalid.",
            "card.invalid-expiry-year": "The card expiry year is invalid.",
            "card.invalid-date": "The card expiry date is invalid.",
            "card.invalid-month": "The card expiry month is invalid.",
            "card.invalid-year": "The card expiry year is invalid.",
            "card.invalid-cvc": "The card CVC is invalid.",
            "card.missing-cvc": "The card CVC is required.",
            "card.missing-cardholder-name": "The card holder name is required.",
            "card.invalid-zip": "The card's ZIP code is valid.",
            "card.failed-cvc-and-avs": "The CVC and AVS code were invalid.",
            "card.failed-three-d-s": "The 3D-Secure authentication failed.",
            "card.bad-track-data": "The card could not be verified. Maybe your CVC is invalid?",
            "card.not-registered": "The card is not registered.",
            "card.issuer-not-found": "The card issuer could not be found. Please try another card.",
            "card.possible-fraud": "The payment could not be completed. Please contact your bank for further help.",
            "card.contact-bank": "The payment could not be completed. Please contact your bank for further help.",
            "card.not-authorized": "The payment could not be authorized using the provided card.",
            "card.do-not-honor": "The payment could not be completed. Please contact your bank for further help.",
            "card.maximum-attempts": "The card maximum attempts has been reached and the payment could not be processed.",
            "card.stolen": "The payment could not be processed as the provided card was marked as stolen.",
            "card.lost": "The payment could not be processed as the provided card was marked as lost.",
            "card.exceeded-limits": "The payment could not be processed as the payment limits of the card have been exceeded.",
            "card.no-money": "There doesn't seem to be enough money on the bank account linked to the provided card.",
            "customer.canceled": "The customer canceled the payment.",
            "customer.popup-blocked": "Please allow pop-ups to continue with your payment flow.",
            "gateway.declined": "The payment was declined.",
            "payment.declined": "The payment was declined.",
            "payment.pending": "The payment is currently pending, please wait a few minutes for it to fully go through.",
            "three-d-s-2.fingerprint-timed-out": "The 3-D Secure fingerprinting timed out.",

            "request.validation.error": "The provided information is invalid or missing.",
            "request.validation.invalid-country": "The provided country is invalid.",
            "request.validation.missing-name": "A name must be provided.",
            "request.validation.invalid-name": "The provided name is invalid.",
            "request.validation.missing-email": "An email must be provided.",
            "request.validation.invalid-email": "The provided email is invalid.",
            "request.validation.invalid-address": "The provided address is invalid.",
            "request.validation.no-method-selected": "Please select a payment method.",

            "request.gateway.not-available": "The requested gateway is currently unavailable.",
            "request.gateway.not-supported": "The gateway is not supported by ProcessOut.js",

            "processout-js.missing-project-id": "Your project ID was not specified when loading ProcessOut.js.",
            "processout-js.not-hosted": "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable": "The ProcessOut.js modal is unavailable.",
            "processout-js.field.unavailable": "The ProcessOut.js credit card field is unavailable.",
            "processout-js.invalid-config": "The provided gateway configuration is invalid.",
            "processout-js.no-customer-action": "No customer action is required for the given gateway configuration and resource.",
            "processout-js.customer-action-not-supported": "The requested customer action is not supported by ProcessOut.js.",
            "processout-js.invalid-field": "The given HTML element may not be used by ProcessOut.js: it is an input. Please only use divs when creating a ProcessOut.js credit card field.",
            "processout-js.undefined-field": "The given HTML element was undefined.",
            "processout-js.invalid-field-type": "The given field type was incorrect. It must either be number, expiry, expiryMonth, expiryYear or CVC.",
            "processout-js.invalid-type": "The specified parameter had an unknown type.",
            "processout-js.missing-source": "A source must be specified.",
            "processout-js.wrong-type-for-action": "The requested action could not be performed on the given field because its type is invalid.",
            "processout-js.missing-invoice-id": "An invoice ID must be specified.",
            "processout-js.missing-resource-id": "A resource ID must be specified.",

            "processout-js.internal-server-error": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.not-implemented": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.invalid-response": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.service-unavailable": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.response-timeout": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.http-version-not-supported": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.network-auth-required": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.aborted-retries-exceeded": "There seems to be some issue preventing the payment from making it through. Please try again in a few minutes.",
            "processout-js.network-issue": "There seems to be some connectivity issue preventing the payment from making it through. Please switch to another network or try again in a few minutes.",

            "resource.invalid-type": "The provided resource was invalid. It must be an invoice, a subscription or an authorization request.",

            "applepay.not-supported": "The current browser/device does not support Apple Pay.",
            "applepay.no-success-handler": "A success handler must be specified when setting up Apple Pay.",
            "applepay.not-available": "Apple Pay is not available for the current browser, device or ProcessOut project."
        },
        "fr": {
            "default": "Une erreur est survenue lors du paiement.",
        },
        "es": {
            "default": "Ha ocurrido un error: el pago ha sido declinado.",
            "card.declined": "La tarjeta ha sido declinada.",
            "card.expired": "La tarjeta empleada ha caducado.",
            "card.duplicate": "El pago no se ha podido completar. Por favor, inténtelo más tarde.",
            "card.network-failed": "El pago no se ha podido completar. Por favor, inténtelo más tarde.",
            "card.invalid": "La tarjeta empleada no es válida.",
            "card.invalid-name": "El nombre del titular de la tarjeta no es válido.",
            "card.invalid-number": "El número de la tarjeta no es válido.",
            "card.invalid-date": "La fecha de caducidad de la tarjeta no es válida.",
            "card.invalid-expiry-date": "La fecha de caducidad de la tarjeta no es válida.",
            "card.invalid-month": "El mes de caducidad de la tarjeta no es válido.",
            "card.invalid-expiry-month": "El mes de caducidad de la tarjeta no es válido.",
            "card.invalid-year": "El año de caducidad de la tarjeta no es válido.",
            "card.invalid-expiry-year": "El año de caducidad de la tarjeta no es válido.",
            "card.invalid-cvc": "El código CVC de la tarjeta no es válido.",
            "card.missing-cvc": "El código CVC de la tarjeta es obligatorio.",
            "card.invalid-zip": "El código ZIP de la tarjeta no es válido.",
            "card.failed-cvc-and-avs": "El código CVC y el código AVS no son válidos.",
            "card.failed-three-d-s": "La autenticación 3DS ha fallado.",
            "card.bad-track-data": "No ha sido posible verificar la tarjeta.",
            "card.missing-cardholder-name": "El nombre del titular de la tarjeta es obligatorio.",
            "card.not-registered": "La tarjeta no ha sido registrada.",
            "card.issuer-not-found": "No se ha podido encontrar el emisor de la tarjeta. Por favor, inténtelo con otra tarjeta.",
            "card.possible-fraud": "El pago no se ha podido completar. Por favor, contacte con su banco para obtener ayuda.",
            "card.contact-bank": "El pago no se ha podido completar. Por favor, contacte con su banco para obtener ayuda.",
            "card.not-authorized": "El pago no se ha podido autorizar con la tarjeta proporcionada.",
            "card.do-not-honor": "El pago no se ha podido completar. Por favor, contacte con su banco para obtener ayuda.",
            "card.maximum-attempts": "Se ha alcanzado el número máximo de intentos con la tarjeta proporcionada y el pago no se ha podido procesar.",
            "card.stolen": "El pago no se ha podido procesar porque la tarjeta proporcionada ha sido marcada como robada.",
            "card.lost": "El pago no se ha podido procesar porque la tarjeta proporcionada ha sido marcada como perdida.",
            "card.exceeded-limits": "El pago no se ha procesado porque se han excedido los límites de pago de la tarjeta.",
            "card.no-money": "Parece que no hay suficiente dinero en la cuenta bancaria vinculada a la tarjeta proporcionada.",
            "customer.canceled": "El cliente ha cancelado el pago.",
            "customer.popup-blocked": "Por favor, permita el uso de pop-ups en su navegador para continuar con el flujo de pago.",
            "gateway.declined": "El pago ha sido rechazado.",
            "payment.declined": "El pago ha sido rechazado.",
            "payment.pending": "El pago está actualmente pendiente. Espere unos minutos hasta que se complete por completo.",
            "three-d-s-2.fingerprint-timed-out": "La identificación por huella digital 3-D Secure ha caducado.",
            "request.validation.error": "La información proporcionada es inválida o no está presente en su totalidad.",
            "request.validation.invalid-country": "El país proporcionado no es válido.",
            "request.validation.missing-name": "Se debe proporcionar un nombre.",
            "request.validation.invalid-name": "El nombre proporcionado no es válido.",
            "request.validation.missing-email": "Se debe proporcionar un email.",
            "request.validation.invalid-email": "El email proporcionado no es válido.",
            "request.validation.invalid-address": "La dirección proporcionada no es válida.",
            "request.validation.no-method-selected": "Por favor, seleccione un método de pago.",
            "request.gateway.not-available": "La pasarela de pago solicitada no está disponible.",
            "request.gateway.not-supported": "La pasarela de pago no es compatible.",
            "resource.invalid-type": "El recurso proporcionado no es válido. Debe ser un invoice, una suscripción o una solicitud de autorización.",
            "applepay.not-supported": "Su navegador o dispositivo actual no es compatible con Apple Pay.",
        },
        "pt": {
            "default": "Ocorreu um erro: o pagamento foi recusado.",
            "card.declined": "O cartão foi recusado.",
            "card.expired": "O cartão fornecido expirou.",
            "card.duplicate": "O pagamento não foi concluído. Por favor, tente novamente.",
            "card.network-failed": "O pagamento não foi concluído. Por favor, tente novamente.",
            "card.invalid": "O cartão fornecido é inválido.",
            "card.invalid-name": "O nome do titular do cartão é inválido.",
            "card.invalid-number": "O número do cartão é inválido.",
            "card.invalid-date": "A data de validade do cartão é inválida.",
            "card.invalid-expiry-date": "A data de validade do cartão é inválida.",
            "card.invalid-month": "O mês de validade do cartão é inválido.",
            "card.invalid-expiry-month": "O mês de validade do cartão é inválido.",
            "card.invalid-year": "O ano de validade do cartão é inválido.",
            "card.invalid-expiry-year": "O ano de validade do cartão é inválido.",
            "card.invalid-cvc": "O código de verificação do cartão é inválido.",
            "card.missing-cvc": "O código de verificação do cartão é obrigatório.",
            "card.invalid-zip": "O código postal do cartão é inválido.",
            "card.failed-cvc-and-avs": "Os códigos de verificação do cartão e morada são inválidos.",
            "card.failed-three-d-s": "A autenticação 3D-Secure falhou.",
            "card.bad-track-data": "O cartão não pode ser verificado.",
            "card.missing-cardholder-name": "O nome do titular do cartão é obrigatório.",
            "card.not-registered": "O cartão não está registado.",
            "card.issuer-not-found": "O emissor do cartão não existe. Por favor, utilize outro cartão.",
            "card.possible-fraud": "O pagamento não foi concluído. Por favor, entre em contato com o seu banco para mais informação.",
            "card.contact-bank": "O pagamento não foi concluído. Por favor, entre em contato com o seu banco para mais informação.",
            "card.not-authorized": "O pagamento não foi autorizado com o cartão fornecido.",
            "card.do-not-honor": "O pagamento não foi concluído. Por favor, entre em contato com o seu banco para mais informação.",
            "card.maximum-attempts": "O número de tentativas foi excedido e o pagamento não pode ser processado.",
            "card.stolen": "O pagamento não pode ser processado sendo que o cartão foi dado como roubado.",
            "card.lost": "O pagamento não pode ser processado sendo que o cartão foi dado como perdido.",
            "card.exceeded-limits": "O pagamento não pode ser processado sendo que o limite de pagamento do cartão foi excedido.",
            "card.no-money": "A conta bancária associada ao cartão possivelmente não possui fundos suficientes.",
            "customer.canceled": "O cliente cancelou o pagamento.",
            "customer.popup-blocked": "Por favor, ative os pop-ups para prosseguir com o pagamento.",
            "gateway.declined": "O pagamento foi recusado.",
            "payment.declined": "O pagamento foi recusado.",
            "payment.pending": "O pagamento está pendente, por favor aguarde alguns minutos para ser processado.",
            "three-d-s-2.fingerprint-timed-out": "A assinatura digital 3D-Secure expirou.",
            "request.validation.error": "A informação fornecida está inválida ou incompleta.",
            "request.validation.invalid-country": "O país fornecido não é válido.",
            "request.validation.missing-name": "O nome é obrigatório.",
            "request.validation.invalid-name": "O nome fornecido não é válido.",
            "request.validation.missing-email": "O email é obrigatório.",
            "request.validation.invalid-email": "O email fornecido não é válido.",
            "request.validation.invalid-address": "O endereço fornecido não é válido.",
            "request.validation.no-method-selected": "Por favor, selecione um método de pagamento.",
            "request.gateway.not-available": "O gateway de pagamento solicitado está indisponível.",
            "request.gateway.not-supported": "O gateway de pagamento não é suportado.",
            "resource.invalid-type": "O recurso fornecido é inválido. Este recurso deve ser uma fatura (invoice), assinatura (subscription) ou pedido de autorização (authorization request).",
            "applepay.not-supported": "O navegador / dispositivo utilizado não suporta Apple Pay."
        }
    };

    const messages: { [locale: string]: { [name: string]: string } } = {
        "en": {
            "label.cancel": "Cancel",
            "label.apm-description": "A new window was opened to process your payment. Click here to continue."
        },
        "fr": {
            "label.cancel": "Annuler",
            "label.apm-description": "Une nouvelle fen&ecirc;tre s'est ouverte pour proc&eacute;der au paiement. Cliquez ici pour continuer."
        },
        "es": {
            "label.cancel": "Cancelar",
            "label.apm-description": "Se abrió una nueva ventana para procesar su pago. Clic aquí para continuar."
        },
        "pt": {
            "label.cancel": "Cancelar",
            "label.apm-description": "Uma nova janela foi aberta para processar o seu pagamento. Clique aqui para continuar."
        }
    };

    const defaultLocale: string = "en";

    export class Translator {
        protected static getTranslated(l: {
            [locale: string]: { [name: string]: string }
        }, code: string, message?: string): string {
            if (l[this.getLocale()] && l[this.getLocale()][code])
                return l[this.getLocale()][code];
            if (l[defaultLocale][code])
                return l[defaultLocale][code];

            if (message) return message;
            if (l[this.getLocale()] && l[this.getLocale()]["default"]) return l[this.getLocale()]["default"];
            if (l[defaultLocale]["default"]) return l[defaultLocale]["default"];
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
