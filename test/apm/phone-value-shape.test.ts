import { describe, expect, it } from "vitest"
import { loadApmUtils } from "../support/loadNamespace"

const { normalizePhoneValue } = loadApmUtils()

const DEFAULT = "+44"

/**
 * The API reads an APM phone parameter as `{ dialing_code, number }`
 * (api PhoneValue json tags). The SDK must always submit that shape.
 * normalizePhoneValue coerces every input origin — a bare string, the
 * canonical `number` key, or the legacy/merchant `value` key — into it, so a
 * prefilled number is no longer dropped by being sent under an ignored `value`
 * key.
 */
describe("normalizePhoneValue", () => {
  it("wraps a bare string with the default dialing code", () => {
    expect(normalizePhoneValue("7911123456", DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "7911123456",
    })
  })

  it("passes through the canonical { dialing_code, number } shape", () => {
    expect(
      normalizePhoneValue({ dialing_code: "+351", number: "912345678" }, DEFAULT),
    ).toEqual({ dialing_code: "+351", number: "912345678" })
  })

  it("maps the legacy `value` key onto `number`", () => {
    expect(
      normalizePhoneValue({ dialing_code: "+351", value: "912345678" }, DEFAULT),
    ).toEqual({ dialing_code: "+351", number: "912345678" })
  })

  it("uses the default dialing code when none is supplied", () => {
    expect(normalizePhoneValue({ value: "912345678" }, DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "912345678",
    })
    expect(normalizePhoneValue({ number: "912345678" }, DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "912345678",
    })
  })

  it("prefers `number` over `value` when both are present", () => {
    expect(
      normalizePhoneValue(
        { dialing_code: "+351", number: "111", value: "222" },
        DEFAULT,
      ),
    ).toEqual({ dialing_code: "+351", number: "111" })
  })

  it("produces an empty number for empty / missing input", () => {
    expect(normalizePhoneValue("", DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "",
    })
    expect(normalizePhoneValue({}, DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "",
    })
    expect(normalizePhoneValue(undefined, DEFAULT)).toEqual({
      dialing_code: DEFAULT,
      number: "",
    })
  })
})
