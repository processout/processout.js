import { describe, expect, it } from "vitest"
import { loadApmUtils, FakeNavigator } from "../support/loadNamespace"

type DialingCode = { region_code: string; value: string }

const CODES: DialingCode[] = [
  { region_code: "PL", value: "+48" },
  { region_code: "GB", value: "+44" },
  { region_code: "US", value: "+1" },
  { region_code: "BS", value: "+1242" },
]

function normalizePhoneValue(
  value: unknown,
  dialingCodes: DialingCode[] = CODES,
  navigator: FakeNavigator = { language: "en-GB" },
): { dialing_code: string; value: string } {
  return loadApmUtils(navigator).normalizePhoneValue(value, dialingCodes)
}

function resolvePrefilledValue(
  initialData: object | undefined,
  param: { key: string; type: string },
): unknown {
  return loadApmUtils({}).resolvePrefilledValue(initialData, param)
}

describe("normalizePhoneValue", () => {
  it("splits a bare E.164 string into dialing code and national number", () => {
    expect(normalizePhoneValue("+48123123123")).toEqual({
      dialing_code: "+48",
      value: "123123123",
    })
  })

  it("ignores separators in an E.164 string", () => {
    expect(normalizePhoneValue("+44 7700 900123")).toEqual({
      dialing_code: "+44",
      value: "7700900123",
    })
    expect(normalizePhoneValue("+44 (7700) 900-123")).toEqual({
      dialing_code: "+44",
      value: "7700900123",
    })
  })

  it("prefers the longest matching dialing code", () => {
    expect(normalizePhoneValue("+1242570000")).toEqual({
      dialing_code: "+1242",
      value: "570000",
    })
    expect(normalizePhoneValue("+12025550123")).toEqual({
      dialing_code: "+1",
      value: "2025550123",
    })
  })

  it("falls back to the locale default when the gateway has no matching code", () => {
    expect(normalizePhoneValue("+33612345678")).toEqual({
      dialing_code: "+44",
      value: "33612345678",
    })
  })

  it("uses the locale default for a national-format string", () => {
    expect(normalizePhoneValue("07700900123")).toEqual({
      dialing_code: "+44",
      value: "07700900123",
    })
  })

  it("passes through the object form", () => {
    expect(
      normalizePhoneValue({ dialing_code: "+48", value: "123123123" }),
    ).toEqual({ dialing_code: "+48", value: "123123123" })
  })

  it("accepts the `number` key the phone field emits on input", () => {
    expect(
      normalizePhoneValue({ dialing_code: "+48", number: "123123123" }),
    ).toEqual({ dialing_code: "+48", value: "123123123" })
  })

  it("fills in the locale default when the object omits the dialing code", () => {
    expect(normalizePhoneValue({ value: "7700900123" })).toEqual({
      dialing_code: "+44",
      value: "7700900123",
    })
  })

  it("returns an empty number for a non-string, non-object value", () => {
    expect(normalizePhoneValue(undefined)).toEqual({
      dialing_code: "+44",
      value: "",
    })
    expect(normalizePhoneValue(42)).toEqual({ dialing_code: "+44", value: "" })
  })
})

describe("resolvePrefilledValue", () => {
  it("matches the gateway parameter key exactly", () => {
    expect(
      resolvePrefilledValue(
        { customerPhone: "+48123123123" },
        { key: "customerPhone", type: "phone" },
      ),
    ).toBe("+48123123123")
  })

  it("matches the canonical key by parameter type", () => {
    expect(
      resolvePrefilledValue(
        { phone_number: "+48123123123" },
        { key: "customerPhone", type: "phone" },
      ),
    ).toBe("+48123123123")

    expect(
      resolvePrefilledValue(
        { email: "a@b.com" },
        { key: "customerEmail", type: "email" },
      ),
    ).toBe("a@b.com")
  })

  it("prefers an exact key match over the canonical key", () => {
    expect(
      resolvePrefilledValue(
        { phone_number: "+48123123123", customerPhone: "+441234567890" },
        { key: "customerPhone", type: "phone" },
      ),
    ).toBe("+441234567890")
  })

  it("does not apply a canonical key to an unrelated parameter type", () => {
    expect(
      resolvePrefilledValue(
        { phone_number: "+48123123123" },
        { key: "documentNumber", type: "text" },
      ),
    ).toBeUndefined()
  })

  it("returns undefined when there is nothing to prefill", () => {
    expect(
      resolvePrefilledValue({}, { key: "customerPhone", type: "phone" }),
    ).toBeUndefined()
    expect(
      resolvePrefilledValue(undefined, { key: "customerPhone", type: "phone" }),
    ).toBeUndefined()
  })

  it("keeps falsy-but-present exact values distinguishable from absent ones", () => {
    expect(
      resolvePrefilledValue({ agreed: false }, { key: "agreed", type: "boolean" }),
    ).toBe(false)
  })
})
