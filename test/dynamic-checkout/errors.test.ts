import { describe, expect, it } from "vitest"
import { loadNamespaceFile } from "../support/loadNamespace"

const { isCustomerCancellationError } = loadNamespaceFile("src/dynamic-checkout/utils/errors.ts")

describe("isCustomerCancellationError", () => {
  it("matches the SDK-internal cancellation code", () => {
    expect(isCustomerCancellationError({ code: "customer.canceled" })).toBe(true)
  })

  it("matches the API cancellation code raised by gateway-hosted pages", () => {
    expect(isCustomerCancellationError({ code: "customer.cancelled" })).toBe(true)
  })

  it("rejects other error codes", () => {
    expect(isCustomerCancellationError({ code: "customer.popup-blocked" })).toBe(false)
    expect(isCustomerCancellationError({ code: "card.declined" })).toBe(false)
    expect(isCustomerCancellationError({})).toBe(false)
  })
})
