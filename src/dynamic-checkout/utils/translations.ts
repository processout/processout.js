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

    static getText(key: string, locale: string) {
      const keys =
        Translations.localeTranslationsMap[locale] || Translations.localeTranslationsMap.en

      return keys[key] || ""
    }
  }
}
