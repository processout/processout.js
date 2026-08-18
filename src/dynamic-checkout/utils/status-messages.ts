/// <reference path="../references.ts" />

module ProcessOut {
  // Tokenize-only checkouts show the same status screens as a payment, but nothing is
  // charged - so every message that mentions a payment has a verification counterpart.
  const VERIFICATION_MESSAGE_KEYS = {
    "payment-success-message": "verification-success-message",
    "payment-cancelled-message": "verification-cancelled-message",
    "payment-error-generic-message": "verification-error-generic-message",
    "payment-pending-message": "verification-pending-message",
    "payment-info-message": "verification-info-message",
    "processing-payment-label": "processing-verification-label",
  }

  export function getStatusMessage(key: string, paymentConfig: DynamicCheckoutPaymentConfig) {
    const verificationKey = VERIFICATION_MESSAGE_KEYS[key]
    const resolvedKey = verificationKey && paymentConfig.isTokenizeOnly() ? verificationKey : key

    return Translations.getText(resolvedKey, paymentConfig.locale)
  }
}
