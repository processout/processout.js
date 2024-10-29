/// <reference path="../references.ts" />

module ProcessOut {
  export class Translations {
    static getText(key: string, locale: string) {
      const locales = {
        en: en,
        es: es,
        fr: fr,
        pl: pl,
        pt: pt,
      };

      const keys = locales[locale] || locales.en;

      return keys[key] || "";
    }
  }
}
