import { beforeEach, describe, expect, it } from "vitest"
import { LOCALES, loadDynamicCheckout } from "../support/loadNamespace"

let ProcessOut: Record<string, any>

beforeEach(() => {
  ProcessOut = loadDynamicCheckout().namespace
})

describe("Dynamic Checkout locale files", () => {
  it("registers every locale file in the translations map", () => {
    const registered = Object.keys(ProcessOut.Translations.localeTranslationsMap).sort()
    const shipped = LOCALES.map(locale => locale.file).sort()

    expect(registered).toEqual(shipped)
  })

  it.each(LOCALES.map(locale => locale.name))("%s has exactly the English key set", name => {
    const englishKeys = Object.keys(ProcessOut.en).sort()
    const localeKeys = Object.keys(ProcessOut[name]).sort()

    expect(localeKeys).toEqual(englishKeys)
  })

  it.each(LOCALES.map(locale => locale.name))("%s has no empty translations", name => {
    const emptyKeys = Object.keys(ProcessOut[name]).filter(
      key => typeof ProcessOut[name][key] !== "string" || ProcessOut[name][key].trim() === "",
    )

    expect(emptyKeys).toEqual([])
  })
})

describe("Translations.resolveLocale", () => {
  it.each([
    ["en", "en"],
    ["EN", "en"],
    ["ar-SA", "ar"],
    ["pt_BR", "pt"],
    ["zh-CN", "zh-cn"],
    ["zh-TW", "zh-tw"],
    ["zh_TW", "zh-tw"],
    ["zh", "zh-cn"],
    ["zh-Hans", "zh-cn"],
    ["zh-SG", "zh-cn"],
    ["zh-Hant", "zh-tw"],
    ["zh-HK", "zh-tw"],
    ["zh-Hant-TW", "zh-tw"],
    ["zh-Hant-HK", "zh-tw"],
    ["zh-TW-u-ca-gregory", "zh-tw"],
    ["zh-Hans-CN", "zh-cn"],
    ["zh-Hans-TW", "zh-cn"],
    ["pt-BR-x-foo", "pt"],
    ["id", "id"],
    ["in", "id"],
    ["in-ID", "id"],
    ["he", "he"],
    ["iw", "he"],
    ["he-IL", "he"],
  ])("resolves %s to %s", (input, expected) => {
    expect(ProcessOut.Translations.resolveLocale(input)).toBe(expected)
  })

  it.each([["xx"], ["xx-YY"], [""], [undefined], [null]])("falls back to English for %s", input => {
    expect(ProcessOut.Translations.resolveLocale(input)).toBe("en")
  })
})

describe("Translations.getText", () => {
  it("returns the Traditional Chinese string for zh-TW", () => {
    expect(ProcessOut.Translations.getText("pay-button-text", "zh-TW")).toBe(
      ProcessOut.zhTW["pay-button-text"],
    )
  })

  it("returns the Simplified Chinese string for zh-CN", () => {
    expect(ProcessOut.Translations.getText("pay-button-text", "zh-CN")).toBe(
      ProcessOut.zhCN["pay-button-text"],
    )
  })

  it("returns the Indonesian string for the legacy `in` tag", () => {
    expect(ProcessOut.Translations.getText("pay-button-text", "in")).toBe(
      ProcessOut.id["pay-button-text"],
    )
  })

  it("falls back to English for an unknown locale", () => {
    expect(ProcessOut.Translations.getText("pay-button-text", "xx")).toBe(
      ProcessOut.en["pay-button-text"],
    )
  })

  it("returns an empty string for an unknown key", () => {
    expect(ProcessOut.Translations.getText("does-not-exist", "en")).toBe("")
  })
})

describe("Translations.isRtlLocale", () => {
  it.each([["ar"], ["ar-SA"], ["he"], ["he-IL"], ["iw"]])("is true for %s", locale => {
    expect(ProcessOut.Translations.isRtlLocale(locale)).toBe(true)
  })

  it.each([["en"], ["fa"], ["ur"], [""], [undefined]])("is false for %s", locale => {
    expect(ProcessOut.Translations.isRtlLocale(locale)).toBe(false)
  })
})
