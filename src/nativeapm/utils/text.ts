/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  export const texts = {
    en: {
      invalidCode: "Code is not valid.",
      invalidPhoneNumber: "Phone number is not valid.",
      invalidCountryCode: "You must select a country.",
      selectCountryPlaceholder: "Select country",
      countryCodePlaceholder: "+1",
      invalidTextValue: "Value is not valid.",
      invalidEmail: "Email is not valid.",
      phoneNumberPlaceholder: "Enter phone number",
      phoneNumberLabel: "Phone number",
      emailPlaceholder: "name@exmple.com",
      submitButtonText: "Pay",
      paymentSuccessMessage: "Success!\nPayment approved.",
      genericError: "Something went wrong, please try again.",
      paymentTimeout:
        "The payment was not confirmed in time in the banking application. Please try again.",
    },
    pl: {
      invalidCode: "Niepoprawny kod.",
      invalidPhoneNumber: "Niepoprawny numer telefonu.",
      invalidCountryCode: "Musisz wybrać kraj.",
      selectCountryPlaceholder: "Wybierz kraj",
      countryCodePlaceholder: "+48",
      invalidTextValue: "Niepoprawna wartość.",
      invalidEmail: "Niepoprawny adres email.",
      phoneNumberPlaceholder: "Twój numer telefonu",
      phoneNumberLabel: "Numer telefonu",
      emailPlaceholder: "imię@przykład.pl",
      submitButtonText: "Zapłać",
      paymentSuccessMessage: "Sukces!\nPłatność przyjęta.",
      genericError: "Coś poszło nie tak, spróbuj ponownie.",
      paymentTimeout:
        "Płatność odrzucona. Czas na potwierdzenie transakcji został przekroczony. Spróbuj ponownie.",
    },
    pt: {
      invalidCode: "Número inválido.",
      invalidPhoneNumber: "Número de telemóvel inválido.",
      invalidCountryCode: "Você deve selecionar um país.",
      selectCountryPlaceholder: "Selecione o país",
      countryCodePlaceholder: "+351",
      invalidTextValue: "Texto inválido.",
      invalidEmail: "Endereço de e-mail inválido.",
      phoneNumberPlaceholder: "Insira o seu número de telemóvel",
      phoneNumberLabel: "Nº de telemóvel",
      emailPlaceholder: "nome@exemplo.pt",
      submitButtonText: "Pagar",
      paymentSuccessMessage: "Successo!\nPagamento aprovado.",
      genericError: "Ocorreu um erro ao processar o seu cartão, por favor tente novamente.",
      paymentTimeout:
        "O pagamento não foi confirmado a tempo no aplicativo bancário. Por favor, tente novamente.",
    },
    fr: {
      invalidCode: "Numéro invalide.",
      invalidPhoneNumber: "Votre numéro de téléphone est invalide.",
      invalidCountryCode: "Vous devez sélectionner un pays.",
      selectCountryPlaceholder: "Sélectionnez le pays",
      countryCodePlaceholder: "+33",
      invalidTextValue: "Valeur invalide.",
      invalidEmail: "Votre adresse e-mail est invalide.",
      phoneNumberPlaceholder: "Entrez votre numéro de téléphone",
      phoneNumberLabel: "Numéro de téléphone",
      emailPlaceholder: "nom@exemple.fr",
      submitButtonText: "Payer",
      paymentSuccessMessage: "Succès!\nPaiement confirmé.",
      genericError: "Une erreur s'est produite, veuillez réessayer.",
      paymentTimeout:
        "Le paiement n'a pas été confirmé à temps dans l'application bancaire. Veuillez réessayer.",
    },
  }
  /**
   * ProcessOut Native APM class to handle event dispatching
   */
  export class TextUtils {
    static getText(key: string) {
      const locale = Translator.getLocale()

      const supportedLocale = texts.hasOwnProperty(locale) ? locale : "en"

      return texts[supportedLocale][key] || ""
    }
  }
}
