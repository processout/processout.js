/// <reference path="../references.ts" />

module ProcessOut {
  export class Translations {
    static localeTranslationsMap = {
      ar: ar,
      de: de,
      en: en,
      es: es,
      fi: fi,
      fr: fr,
      it: it,
      ja: ja,
      ko: ko,
      nb: nb,
      pl: pl,
      pt: pt,
      ta: ta,
      vi: vi,
    }

    static rtlLocales = ["ar"]

    static getText(key: string, locale: string) {
      const language = Translations.getLanguageCode(locale)
      const keys =
        Translations.localeTranslationsMap[language] || Translations.localeTranslationsMap.en

      return keys[key] || ""
    }

    static isRtlLocale(locale: string) {
      return Translations.rtlLocales.indexOf(Translations.getLanguageCode(locale)) !== -1
    }

    static getLanguageCode(locale: string) {
      return locale ? locale.toLowerCase().split(/[-_]/)[0] : ""
    }
  }
}
