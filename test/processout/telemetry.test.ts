import { describe, expect, it } from "vitest"
import { loadTelemetry } from "../support/loadNamespace"

const { isProcessOutScriptError } = loadTelemetry()

function errorEvent(filename: string, error: unknown = new Error("boom")) {
  return { filename, error } as unknown as ErrorEvent
}

describe("isProcessOutScriptError", () => {
  it("accepts errors thrown by processout.js", () => {
    expect(isProcessOutScriptError(errorEvent("https://js.processout.com/processout.js"))).toBe(
      true,
    )
    expect(
      isProcessOutScriptError(errorEvent("https://js.processout.ninja/processout.js?v=1")),
    ).toBe(true)
  })

  it("rejects errors attributed to a processout-hosted page", () => {
    const page = "https://checkout.processout.com/some/page"
    expect(isProcessOutScriptError(errorEvent(page))).toBe(false)
  })

  it("rejects other scripts on processout or lookalike hosts", () => {
    expect(isProcessOutScriptError(errorEvent("https://js.processout.com/modal.js"))).toBe(false)
    expect(isProcessOutScriptError(errorEvent("https://js.processout.com/processout.json"))).toBe(
      false,
    )
    expect(
      isProcessOutScriptError(errorEvent("https://processout.com.evil.io/processout.js")),
    ).toBe(false)
    expect(isProcessOutScriptError(errorEvent("https://merchant.example/app.js"))).toBe(false)
  })

  it("rejects events without an error object", () => {
    expect(
      isProcessOutScriptError(errorEvent("https://js.processout.com/processout.js", null)),
    ).toBe(false)
  })
})
