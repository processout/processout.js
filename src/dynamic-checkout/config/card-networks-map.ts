module ProcessOut {
  // It's needed because not every network that we support is supported by Apple Pay Web SDK
  // and some of them are called slightly different than the ones we're using e.g. "amex" instead of "american express"
  export const networksMap = {
    "american express": "amex",
    bancomat: "bancomat",
    bancontact: "bancontact",
    "carte bancaire": "cartesbancaires",
    "china union pay": "chinaunionpay",
    dankort: "dankort",
    discover: "discover",
    eftpos: "eftpos",
    electron: "electron",
    elo: "elo",
    girocard: "girocard",
    interac: "interac",
    jcb: "jcb",
    mada: "mada",
    maestro: "maestro",
    mastercard: "mastercard",
    "nspk mir": "mir",
    "private label": "privateLabel",
    visa: "visa",
    vpay: "vpay",
  }

  // The card field detects schemes via Card.getPossibleSchemes(), which uses
  // hyphenated codes (e.g. "american-express"). The rest of the platform
  // (dashboard restrict_to_schemes, router, api) uses space-separated values
  // (e.g. "american express"). This maps the SDK's multi-word codes to their
  // platform equivalents so scheme restrictions match. Only schemes whose two
  // spellings differ need an entry; single-word schemes already align.
  export const schemeRestrictionAliases: { [key: string]: string } = {
    "american-express": "american express",
    "union-pay": "china union pay",
    "diners-club": "diners club",
  }
}
