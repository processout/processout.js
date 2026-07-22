import { describe, expect, it } from "vitest"
import { loadApmUtils } from "../support/loadNamespace"

const { getComparableFieldValue } = loadApmUtils()

/**
 * Regression coverage for the phone "required" validation bug: the Phone
 * component emits its value under `number`, while the initial/prefilled seed
 * uses `value`. The validator normalises both via getComparableFieldValue, so
 * an empty phone number is recognised as empty regardless of which shape is
 * present (previously the `number` shape was treated as a non-empty object and
 * the required check silently passed).
 */
describe("getComparableFieldValue", () => {
  it("returns primitives unchanged", () => {
    expect(getComparableFieldValue("hello")).toBe("hello")
    expect(getComparableFieldValue("")).toBe("")
    expect(getComparableFieldValue(0)).toBe(0)
    expect(getComparableFieldValue(undefined)).toBe(undefined)
  })

  it("reads the number from the seed/prefill `value` shape", () => {
    expect(
      getComparableFieldValue({ dialing_code: "+44", value: "7911123456" }),
    ).toBe("7911123456")
    expect(getComparableFieldValue({ dialing_code: "+44", value: "" })).toBe("")
  })

  it("reads the number from the emitted `number` shape", () => {
    expect(
      getComparableFieldValue({ dialing_code: "+44", number: "7911123456" }),
    ).toBe("7911123456")
  })

  it("returns an empty string for a cleared `number` (the reported bug)", () => {
    // Shopper typed a number then removed it: the value is now { number: "" }.
    // This must resolve to "" so the required check fires.
    expect(getComparableFieldValue({ dialing_code: "+44", number: "" })).toBe("")
  })

  it("prefers `value` when both keys are present", () => {
    expect(
      getComparableFieldValue({ value: "from-value", number: "from-number" }),
    ).toBe("from-value")
  })

  it("returns the object unchanged when neither key is present", () => {
    const obj = { dialing_code: "+44" }
    expect(getComparableFieldValue(obj)).toBe(obj)
  })
})

/**
 * Mirrors form.ts validateField's required rule against the normalised value,
 * documenting the end-to-end expectation the SDK relies on.
 */
function isMissingRequired(value: unknown): boolean {
  const actualValue = getComparableFieldValue(value)
  return (
    typeof value === "undefined" ||
    (typeof actualValue === "string" && actualValue.length === 0)
  )
}

describe("required check on phone values", () => {
  it("flags an empty phone number in either shape", () => {
    expect(isMissingRequired({ dialing_code: "+44", value: "" })).toBe(true)
    expect(isMissingRequired({ dialing_code: "+44", number: "" })).toBe(true)
  })

  it("accepts a provided phone number in either shape", () => {
    expect(isMissingRequired({ dialing_code: "+44", value: "7911123456" })).toBe(
      false,
    )
    expect(
      isMissingRequired({ dialing_code: "+44", number: "7911123456" }),
    ).toBe(false)
  })
})
