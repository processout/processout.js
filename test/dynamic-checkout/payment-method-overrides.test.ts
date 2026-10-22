import { beforeEach, describe, expect, it } from "vitest"
import { loadDynamicCheckout } from "../support/loadNamespace"

let ProcessOut: Record<string, any>

beforeEach(() => {
  ProcessOut = loadDynamicCheckout().namespace
})

function createPaymentConfig(paymentMethodsOverrides?: unknown) {
  return new ProcessOut.DynamicCheckoutPaymentConfig({
    projectId: "proj_test",
    invoiceId: "iv_test",
    paymentMethodsOverrides,
  })
}

describe("DynamicCheckoutPaymentConfig.paymentMethodsOverrides", () => {
  it("defaults to an empty object", () => {
    expect(createPaymentConfig().getConfig().paymentMethodsOverrides).toEqual({})
  })

  it("is exposed through getConfig", () => {
    const overrides = { card: { displayName: "Credit card" } }

    expect(createPaymentConfig(overrides).getConfig().paymentMethodsOverrides).toBe(overrides)
  })
})

describe("DynamicCheckoutPaymentConfig.getPaymentMethodDisplayOverride", () => {
  const malformedRoots = [undefined, null, "card", 42, true, [{ displayName: "Card" }]]

  it.each(malformedRoots)("returns no override when the option is %j", overrides => {
    expect(createPaymentConfig(overrides).getPaymentMethodDisplayOverride("card")).toEqual({})
  })

  it("returns no override for an unknown key", () => {
    const paymentConfig = createPaymentConfig({ card: { displayName: "Credit card" } })

    expect(paymentConfig.getPaymentMethodDisplayOverride("adyen_ideal")).toEqual({})
  })

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "ignores inherited object members for the %s key",
    key => {
      expect(createPaymentConfig({}).getPaymentMethodDisplayOverride(key)).toEqual({})
    },
  )

  it.each([null, "Credit card", 42, ["Credit card"]])(
    "returns no override when the entry is %j",
    entry => {
      const paymentConfig = createPaymentConfig({ card: entry })

      expect(paymentConfig.getPaymentMethodDisplayOverride("card")).toEqual({})
    },
  )

  it("drops empty and non-string fields", () => {
    const paymentConfig = createPaymentConfig({
      card: { displayName: "", logoUrl: 42 },
      paypal: { displayName: null, logoUrl: { url: "https://cdn.test/pp.svg" } },
    })

    expect(paymentConfig.getPaymentMethodDisplayOverride("card")).toEqual({})
    expect(paymentConfig.getPaymentMethodDisplayOverride("paypal")).toEqual({})
  })

  it("returns only the fields that are set", () => {
    const paymentConfig = createPaymentConfig({
      card: { displayName: "Credit card" },
      paypal: { logoUrl: "https://cdn.test/pp.svg" },
    })

    expect(paymentConfig.getPaymentMethodDisplayOverride("card")).toEqual({
      displayName: "Credit card",
    })
    expect(paymentConfig.getPaymentMethodDisplayOverride("paypal")).toEqual({
      logoUrl: "https://cdn.test/pp.svg",
    })
  })

  it("returns both fields and ignores unknown ones", () => {
    const paymentConfig = createPaymentConfig({
      adyen_ideal: { displayName: "iDEAL", logoUrl: "https://cdn.test/ideal.svg", color: "red" },
    })

    expect(paymentConfig.getPaymentMethodDisplayOverride("adyen_ideal")).toEqual({
      displayName: "iDEAL",
      logoUrl: "https://cdn.test/ideal.svg",
    })
  })

  it("never mutates the merchant's overrides", () => {
    const overrides = { card: { displayName: "Credit card", logoUrl: "" } }
    const snapshot = JSON.parse(JSON.stringify(overrides))

    const result = createPaymentConfig(overrides).getPaymentMethodDisplayOverride("card")
    result.displayName = "Changed"

    expect(overrides).toEqual(snapshot)
  })
})
