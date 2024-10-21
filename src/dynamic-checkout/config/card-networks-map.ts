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
  };
}
