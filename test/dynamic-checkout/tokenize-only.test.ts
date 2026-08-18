import { beforeEach, describe, expect, it } from "vitest"
import { CapturedEvent, LOCALES, loadDynamicCheckout } from "../support/loadNamespace"

let ProcessOut: Record<string, any>
let dispatchedEvents: CapturedEvent[]

beforeEach(() => {
  const loaded = loadDynamicCheckout()
  ProcessOut = loaded.namespace
  dispatchedEvents = loaded.dispatchedEvents
})

function createPaymentConfig(paymentMethods: any[] | null, locale = "en") {
  const paymentConfig = new ProcessOut.DynamicCheckoutPaymentConfig({
    projectId: "proj_test",
    invoiceId: "iv_test",
    locale,
  })

  if (paymentMethods) {
    paymentConfig.setInvoiceDetails({ payment_methods: paymentMethods })
  }

  return paymentConfig
}

const tokenizeOnlyMethod = { type: "card", card: { tokenize_only: true } }
const regularCardMethod = { type: "card", card: { tokenize_only: false } }

describe("DynamicCheckoutPaymentConfig.isTokenizeOnly", () => {
  it("is false before the invoice has been fetched", () => {
    expect(createPaymentConfig(null).isTokenizeOnly()).toBe(false)
  })

  it("is false for a regular card checkout", () => {
    expect(createPaymentConfig([regularCardMethod]).isTokenizeOnly()).toBe(false)
  })

  it("is false when the card method predates the tokenize_only flag", () => {
    expect(createPaymentConfig([{ type: "card", card: {} }]).isTokenizeOnly()).toBe(false)
  })

  it("ignores non-card payment methods", () => {
    expect(createPaymentConfig([{ type: "apm", apm: {} }]).isTokenizeOnly()).toBe(false)
  })

  it("is true when any card method is tokenize-only", () => {
    expect(createPaymentConfig([regularCardMethod, tokenizeOnlyMethod]).isTokenizeOnly()).toBe(true)
  })
})

describe("getStatusMessage", () => {
  const mappedKeys = [
    "payment-success-message",
    "payment-cancelled-message",
    "payment-error-generic-message",
    "payment-pending-message",
    "payment-info-message",
    "processing-payment-label",
  ]

  it.each(LOCALES)("keeps the payment wording for a regular checkout in %s", locale => {
    const paymentConfig = createPaymentConfig([regularCardMethod], locale)

    mappedKeys.forEach(key => {
      expect(ProcessOut.getStatusMessage(key, paymentConfig)).toBe(
        ProcessOut.Translations.getText(key, locale),
      )
    })
  })

  it.each(LOCALES)("uses translated verification wording in %s", locale => {
    const paymentConfig = createPaymentConfig([tokenizeOnlyMethod], locale)

    mappedKeys.forEach(key => {
      const message = ProcessOut.getStatusMessage(key, paymentConfig)

      // A missing locale key resolves to "" and would render a blank status screen.
      expect(message, `${locale} is missing a verification message for ${key}`).not.toBe("")
      expect(message).not.toBe(ProcessOut.Translations.getText(key, locale))
    })
  })

  it("leaves keys without a verification counterpart untouched", () => {
    const tokenizeOnlyConfig = createPaymentConfig([tokenizeOnlyMethod])

    expect(ProcessOut.getStatusMessage("payment-error-message", tokenizeOnlyConfig)).toBe(
      ProcessOut.Translations.getText("payment-error-message", "en"),
    )
  })

  it("resolves the English verification copy", () => {
    const tokenizeOnlyConfig = createPaymentConfig([tokenizeOnlyMethod])

    expect(ProcessOut.getStatusMessage("payment-success-message", tokenizeOnlyConfig)).toBe(
      "This verification is completed.",
    )
    expect(ProcessOut.getStatusMessage("payment-cancelled-message", tokenizeOnlyConfig)).toBe(
      "Verification has been cancelled.",
    )
    expect(ProcessOut.getStatusMessage("payment-error-generic-message", tokenizeOnlyConfig)).toBe(
      "We were unable to verify your card.",
    )
  })
})

describe("DynamicCheckoutEventsUtils event names", () => {
  const details = {
    payment_method_name: "card",
    payment_method_display_name: "Card",
    invoice_id: "iv_test",
    return_url: null,
  }

  function lastEvent() {
    return dispatchedEvents[dispatchedEvents.length - 1]
  }

  const objectDispatchers = [
    ["dispatchPaymentSubmittedEvent", "submitted"],
    ["dispatchPaymentSuccessEvent", "success"],
    ["dispatchPaymentPendingEvent", "pending"],
    ["dispatchPaymentCancelledEvent", "cancelled"],
  ] as const

  it.each(objectDispatchers)("%s emits a payment event by default", (dispatcher, suffix) => {
    ProcessOut.DynamicCheckoutEventsUtils[dispatcher](details)

    expect(lastEvent().type).toBe(`processout_dynamic_checkout_payment_${suffix}`)
  })

  it.each(objectDispatchers)("%s emits a card verification event when flagged", (d, suffix) => {
    ProcessOut.DynamicCheckoutEventsUtils[d](details, true)

    expect(lastEvent().type).toBe(`processout_dynamic_checkout_card_verification_${suffix}`)
  })

  it.each(objectDispatchers)("%s sends the same detail in both modes", dispatcher => {
    ProcessOut.DynamicCheckoutEventsUtils[dispatcher](details)
    ProcessOut.DynamicCheckoutEventsUtils[dispatcher](details, true)

    expect(dispatchedEvents[1].detail).toEqual(dispatchedEvents[0].detail)
  })

  it("dispatchPaymentErrorEvent emits a payment error by default", () => {
    ProcessOut.DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent("iv_test", {
      error_type: "card.declined",
    })

    expect(lastEvent().type).toBe("processout_dynamic_checkout_payment_error")
  })

  it("dispatchPaymentErrorEvent emits a card verification error when flagged", () => {
    ProcessOut.DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
      "iv_test",
      { error_type: "card.declined" },
      "card",
      undefined,
      null,
      undefined,
      "Card",
      true,
    )

    expect(lastEvent().type).toBe("processout_dynamic_checkout_card_verification_error")
    expect(lastEvent().detail.error_type).toBe("card.declined")
  })

  it("still swallows the field-unavailable error in verification mode", () => {
    ProcessOut.DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(
      "iv_test",
      { error_type: "processout-js.field.unavailable" },
      "card",
      undefined,
      null,
      undefined,
      "Card",
      true,
    )

    expect(dispatchedEvents).toHaveLength(0)
  })
})
