/// <reference path="../references.ts" />

module ProcessOut {
  export class Translations {
    static localeTranslationsMap = {
      ar: ar,
      bg: bg,
      bn: bn,
      cs: cs,
      da: da,
      de: de,
      el: el,
      en: en,
      es: es,
      fi: fi,
      fr: fr,
      he: he,
      hi: hi,
      id: id,
      it: it,
      ja: ja,
      kn: kn,
      ko: ko,
      nb: nb,
      nl: nl,
      pl: pl,
      pt: pt,
      ro: ro,
      ru: ru,
      sv: sv,
      ta: ta,
      te: te,
      th: th,
      tr: tr,
      uk: uk,
      vi: vi,
      "zh-cn": zhCN,
      "zh-tw": zhTW,
    }

    // Legacy or regional tags that should resolve to one of the locales above.
    static localeAliases = {
      "in": "id",
      iw: "he",
      zh: "zh-cn",
      "zh-hans": "zh-cn",
      "zh-sg": "zh-cn",
      "zh-hant": "zh-tw",
      "zh-hk": "zh-tw",
      "zh-mo": "zh-tw",
    }

    static rtlLocales = ["ar", "he"]

    static defaultLocale = "en"

    static getText(key: string, locale: string) {
      const keys = Translations.localeTranslationsMap[Translations.resolveLocale(locale)]

      return keys[key] || ""
    }

    static isRtlLocale(locale: string) {
      return Translations.rtlLocales.indexOf(Translations.resolveLocale(locale)) !== -1
    }

    /**
     * Maps a BCP 47-ish tag (e.g. "zh-TW", "pt_BR", "in") to a key of
     * localeTranslationsMap. Tries the full tag first, then drops trailing
     * subtags one at a time (RFC 4647 lookup) so e.g. "zh-Hant-TW" matches
     * "zh-hant" before the bare "zh", then falls back to the default locale.
     */
    static resolveLocale(locale: string) {
      if (!locale) {
        return Translations.defaultLocale
      }

      const normalized = locale.toLowerCase().replace(/_/g, "-")
      const parts = normalized.split("-")

      for (let length = parts.length; length > 0; length--) {
        const tag = parts.slice(0, length).join("-")
        const candidate = Translations.localeAliases[tag] || tag

        if (Translations.localeTranslationsMap[candidate]) {
          return candidate
        }
      }

      return Translations.defaultLocale
    }
  }
}
