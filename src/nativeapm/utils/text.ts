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
    es: {
      invalidCode: "El código no es válido.",
      invalidPhoneNumber: "El número de teléfono no es válido.",
      invalidCountryCode: "Debe seleccionar un país.",
      selectCountryPlaceholder: "Seleccionar país",
      countryCodePlaceholder: "+34",
      invalidTextValue: "El valor no es válido.",
      invalidEmail: "El correo electrónico no es válido.",
      phoneNumberPlaceholder: "Ingrese su número de teléfono",
      phoneNumberLabel: "Número de teléfono",
      emailPlaceholder: "nombre@ejemplo.es",
      submitButtonText: "Pagar",
      paymentSuccessMessage: "¡Éxito!\nPago aprobado.",
      genericError: "Algo salió mal, por favor inténtelo de nuevo.",
      paymentTimeout:
        "El pago no fue confirmado a tiempo en la aplicación bancaria. Por favor, inténtelo de nuevo.",
    },
    ja: {
      invalidCode: "コードが無効です。",
      invalidPhoneNumber: "電話番号が無効です。",
      invalidCountryCode: "国を選択してください。",
      selectCountryPlaceholder: "国を選択",
      countryCodePlaceholder: "+81",
      invalidTextValue: "値が無効です。",
      invalidEmail: "メールアドレスが無効です。",
      phoneNumberPlaceholder: "電話番号を入力",
      phoneNumberLabel: "電話番号",
      emailPlaceholder: "name@example.jp",
      submitButtonText: "支払う",
      paymentSuccessMessage: "成功！\nお支払いが承認されました。",
      genericError: "エラーが発生しました。もう一度お試しください。",
      paymentTimeout:
        "銀行アプリで支払いが時間内に確認されませんでした。もう一度お試しください。",
    },
    ko: {
      invalidCode: "코드가 유효하지 않습니다.",
      invalidPhoneNumber: "전화번호가 유효하지 않습니다.",
      invalidCountryCode: "국가를 선택해 주세요.",
      selectCountryPlaceholder: "국가 선택",
      countryCodePlaceholder: "+82",
      invalidTextValue: "값이 유효하지 않습니다.",
      invalidEmail: "이메일 주소가 유효하지 않습니다.",
      phoneNumberPlaceholder: "전화번호를 입력하세요",
      phoneNumberLabel: "전화번호",
      emailPlaceholder: "name@example.kr",
      submitButtonText: "결제",
      paymentSuccessMessage: "성공!\n결제가 승인되었습니다.",
      genericError: "문제가 발생했습니다. 다시 시도해 주세요.",
      paymentTimeout:
        "은행 앱에서 결제가 시간 내에 확인되지 않았습니다. 다시 시도해 주세요.",
    },
    de: {
      invalidCode: "Der Code ist ungültig.",
      invalidPhoneNumber: "Die Telefonnummer ist ungültig.",
      invalidCountryCode: "Bitte wählen Sie ein Land aus.",
      selectCountryPlaceholder: "Land auswählen",
      countryCodePlaceholder: "+49",
      invalidTextValue: "Der Wert ist ungültig.",
      invalidEmail: "Die E-Mail-Adresse ist ungültig.",
      phoneNumberPlaceholder: "Telefonnummer eingeben",
      phoneNumberLabel: "Telefonnummer",
      emailPlaceholder: "name@beispiel.de",
      submitButtonText: "Bezahlen",
      paymentSuccessMessage: "Erfolg!\nZahlung genehmigt.",
      genericError: "Etwas ist schiefgelaufen, bitte versuchen Sie es erneut.",
      paymentTimeout:
        "Die Zahlung wurde in der Banking-App nicht rechtzeitig bestätigt. Bitte versuchen Sie es erneut.",
    },
    it: {
      invalidCode: "Il codice non è valido.",
      invalidPhoneNumber: "Il numero di telefono non è valido.",
      invalidCountryCode: "Devi selezionare un paese.",
      selectCountryPlaceholder: "Seleziona paese",
      countryCodePlaceholder: "+39",
      invalidTextValue: "Il valore non è valido.",
      invalidEmail: "L'indirizzo e-mail non è valido.",
      phoneNumberPlaceholder: "Inserisci il numero di telefono",
      phoneNumberLabel: "Numero di telefono",
      emailPlaceholder: "nome@esempio.it",
      submitButtonText: "Paga",
      paymentSuccessMessage: "Successo!\nPagamento approvato.",
      genericError: "Qualcosa è andato storto, riprova.",
      paymentTimeout:
        "Il pagamento non è stato confermato in tempo nell'app bancaria. Riprova.",
    },
  }
  /**
   * ProcessOut Native APM class to handle event dispatching
   */
  export class TextUtils {
    private static localeOverride?: string

    static setLocale(locale: string) {
      this.localeOverride = locale
    }

    static getText(key: string) {
      const locale = this.localeOverride || Translator.getLocale()

      const supportedLocale = texts.hasOwnProperty(locale) ? locale : "en"

      return texts[supportedLocale][key] || ""
    }
  }
}
