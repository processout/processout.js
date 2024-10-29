/// <reference path="../references.ts" />

module ProcessOut {
  const locales = {
    en: en,
    es: es,
    fr: fr,
    pl: pl,
    pt: pt,
  };

  export class Translations {
    static getText(key: string, locale: string) {
      const keys = locales[locale] || locales.en;

      return keys[key] || "";
    }
  }
}
