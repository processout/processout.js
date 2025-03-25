/// <reference path="../references.ts" />

module ProcessOut {
  export class Translations {
    static localeTranslationsMap = {
      en: en,
      es: es,
      fr: fr,
      pl: pl,
      pt: pt,
    }

    static getText(key: string, locale: string) {
      const keys =
        Translations.localeTranslationsMap[locale] || Translations.localeTranslationsMap.en

      return keys[key] || ""
    }
  }
}
