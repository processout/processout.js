/// <reference path="../references.ts" />

module ProcessOut {
  export class Translations {
    static getText(key: string, locale: string) {
      switch (locale) {
        case "en":
        default:
          return en[key];
        case "es":
          return es[key];
        case "fr":
          return fr[key];
        case "pl":
          return pl[key];
        case "pt":
          return pt[key];
      }
    }
  }
}
