import { describe, expect, it } from "vitest"
import { loadApmUtils, FakeNavigator } from "../support/loadNamespace"

function getBrowserRegion(navigator: FakeNavigator): string {
  return loadApmUtils(navigator).getBrowserRegion()
}

type DialingCode = { region_code: string; value: string }

function getDefaultDialingCode(
  dialingCodes: DialingCode[],
  navigator: FakeNavigator = {},
): string {
  return loadApmUtils(navigator).getDefaultDialingCode(dialingCodes)
}

describe("getBrowserRegion", () => {
  it("extracts the region subtag from a language-region locale", () => {
    expect(getBrowserRegion({ language: "en-GB" })).toBe("GB")
    expect(getBrowserRegion({ language: "fr-CA" })).toBe("CA")
  })

  it("returns an empty string when there is no region subtag", () => {
    expect(getBrowserRegion({ language: "en" })).toBe("")
    expect(getBrowserRegion({ language: "fr" })).toBe("")
  })

  it("skips a script subtag and picks the region", () => {
    expect(getBrowserRegion({ language: "zh-Hant-TW" })).toBe("TW")
  })

  it("ignores non-ISO (numeric UN M49) regions", () => {
    // "es-419" (Latin America) has no 2-letter ISO region to match against.
    expect(getBrowserRegion({ language: "es-419" })).toBe("")
  })

  it("uppercases the region regardless of source casing", () => {
    expect(getBrowserRegion({ language: "en-gb" })).toBe("GB")
  })

  it("prefers navigator.languages[0] over navigator.language", () => {
    expect(
      getBrowserRegion({ languages: ["en-GB", "fr-FR"], language: "de-DE" }),
    ).toBe("GB")
  })

  it("falls back to userLanguage when language is empty", () => {
    expect(getBrowserRegion({ language: "", userLanguage: "en-US" })).toBe("US")
  })

  it("returns an empty string when no locale is available", () => {
    expect(getBrowserRegion({})).toBe("")
  })
})

describe("getDefaultDialingCode", () => {
  const codes: DialingCode[] = [
    { region_code: "AF", value: "+93" },
    { region_code: "GB", value: "+44" },
    { region_code: "US", value: "+1" },
  ]

  it("picks the code whose region matches the browser locale", () => {
    expect(getDefaultDialingCode(codes, { language: "en-GB" })).toBe("+44")
    expect(getDefaultDialingCode(codes, { language: "en-US" })).toBe("+1")
  })

  it("matches region codes case-insensitively", () => {
    expect(
      getDefaultDialingCode(
        [{ region_code: "gb", value: "+44" }],
        { language: "en-GB" },
      ),
    ).toBe("+44")
  })

  it("falls back to the first code when the locale has no region", () => {
    expect(getDefaultDialingCode(codes, { language: "en" })).toBe("+93")
  })

  it("falls back to the first code when no region matches", () => {
    expect(getDefaultDialingCode(codes, { language: "fr-FR" })).toBe("+93")
  })

  it("returns an empty string for an empty list", () => {
    expect(getDefaultDialingCode([], { language: "en-GB" })).toBe("")
  })
})
