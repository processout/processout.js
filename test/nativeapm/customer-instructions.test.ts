import { describe, expect, it, vi } from "vitest"
import { loadNativeApmCustomerInstructions } from "../support/loadNamespace"

type FakeElement = {
  tagName: string
  attributes: Record<string, string>
  style: Record<string, string>
  innerHTML: string
  textContent: string
  setAttribute: (name: string, value: string) => void
}

function createFakeDocument() {
  return {
    createElement: (tagName: string): FakeElement => {
      const element: FakeElement = {
        tagName,
        attributes: {},
        style: {},
        innerHTML: "",
        textContent: "",
        setAttribute: (name, value) => {
          element.attributes[name] = value
        },
      }
      return element
    },
  }
}

function load(QRCode?: unknown) {
  const ns = loadNativeApmCustomerInstructions(createFakeDocument(), { globalThis: { QRCode } })
  return ns.NativeApmCustomerInstructions
}

const theme = { message: { color: "black" }, actionImage: { margin: "8px" } }

describe("NativeApmCustomerInstructions.getMessage", () => {
  it("returns the customer action message", () => {
    expect(load().getMessage({ customer_action_message: "Scan the QR code" })).toBe("Scan the QR code")
  })

  it("returns an empty string when there is no message", () => {
    expect(load().getMessage(undefined)).toBe("")
    expect(load().getMessage({})).toBe("")
  })
})

describe("NativeApmCustomerInstructions.getBarcode", () => {
  it("reads the barcode object sent by GET native-payment", () => {
    const barcode = { type: "qr", value: "aGVsbG8=" }

    expect(load().getBarcode({ customer_action_barcode: barcode })).toEqual(barcode)
  })

  it("reads the flat barcode keys sent by process native-payment", () => {
    expect(
      load().getBarcode({
        customer_action_barcode_type: "qr",
        customer_action_barcode_value: "aGVsbG8=",
      }),
    ).toEqual({ type: "qr", value: "aGVsbG8=" })
  })

  it("defaults the flat barcode type to qr", () => {
    expect(load().getBarcode({ customer_action_barcode_value: "aGVsbG8=" })).toEqual({
      type: "qr",
      value: "aGVsbG8=",
    })
  })

  it("returns undefined when there is no barcode value", () => {
    expect(load().getBarcode(undefined)).toBeUndefined()
    expect(load().getBarcode({ customer_action_message: "text" })).toBeUndefined()
    expect(load().getBarcode({ customer_action_barcode: { type: "qr", value: "" } })).toBeUndefined()
  })
})

describe("NativeApmCustomerInstructions.createMessageElement", () => {
  it("renders markdown when the library is loaded", () => {
    const markdown = { makeHtml: vi.fn(() => "<a href=\"https://example.com\">Pay</a>") }

    const element = load().createMessageElement(markdown, theme, "[Pay](https://example.com)")

    expect(markdown.makeHtml).toHaveBeenCalledWith("[Pay](https://example.com)")
    expect(element.innerHTML).toBe("<a href=\"https://example.com\">Pay</a>")
    expect(element.attributes.class).toBe("native-apm-message")
    expect(element.style.color).toBe("black")
  })

  it("renders plain text when the library is not loaded", () => {
    const element = load().createMessageElement(null, theme, "<b>not html</b>")

    expect(element.textContent).toBe("<b>not html</b>")
    expect(element.innerHTML).toBe("")
  })
})

describe("NativeApmCustomerInstructions.createQrCodeElement", () => {
  it("draws the QR code from the decoded barcode value", () => {
    const QRCode = vi.fn()

    const element = load(QRCode).createQrCodeElement(theme, { type: "qr", value: btoa("https://pay.example") })

    expect(QRCode).toHaveBeenCalledWith(element, { text: "https://pay.example", width: 128, height: 128 })
    expect(element.style.margin).toBe("8px")
  })

  it("draws nothing when the barcode value is not base64", () => {
    const QRCode = vi.fn()

    load(QRCode).createQrCodeElement(theme, { type: "qr", value: "not base64!" })

    expect(QRCode).not.toHaveBeenCalled()
  })

  it("draws nothing without a barcode or the library", () => {
    const QRCode = vi.fn()

    load(QRCode).createQrCodeElement(theme, undefined)
    load(undefined).createQrCodeElement(theme, { type: "qr", value: btoa("https://pay.example") })

    expect(QRCode).not.toHaveBeenCalled()
  })
})
