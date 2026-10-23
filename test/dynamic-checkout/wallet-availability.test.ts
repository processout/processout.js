import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { loadDynamicCheckout } from "../support/loadNamespace"

let ProcessOut: Record<string, any>

beforeEach(() => {
  ProcessOut = loadDynamicCheckout().namespace
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function createPaymentConfig() {
  const paymentConfig = new ProcessOut.DynamicCheckoutPaymentConfig({
    projectId: "proj_test",
    invoiceId: "iv_test",
  })

  paymentConfig.setInvoiceDetails({ payment_methods: [] })

  return paymentConfig
}

describe("Apple Pay button availability", () => {
  const invoiceData = {
    id: "iv_test",
    payment_methods: [{ type: "applepay", applepay: { merchant_id: "merchant.test" } }],
  }

  function initializeApplePay(availabilityError: unknown) {
    const processOutInstance = {
      applePay: {
        checkAvailability: (callback: (err: unknown) => void) => callback(availabilityError),
      },
    }
    const client = new ProcessOut.ApplePayClient(processOutInstance, createPaymentConfig())
    const buttonContainer = { classList: { add: vi.fn() } }
    const onButtonDisplayed = vi.fn()

    vi.stubGlobal("document", { querySelector: () => ({ addEventListener: vi.fn() }) })
    vi.spyOn(console, "log").mockImplementation(() => {})

    client.initializeApplePay(invoiceData, buttonContainer, () => ({}), onButtonDisplayed)

    return { buttonContainer, onButtonDisplayed }
  }

  it("reports the button as displayed when Apple Pay is available", () => {
    const { buttonContainer, onButtonDisplayed } = initializeApplePay(null)

    expect(buttonContainer.classList.add).toHaveBeenCalledWith("visible")
    expect(onButtonDisplayed).toHaveBeenCalledOnce()
  })

  it("does not report the button as displayed when the availability check fails", () => {
    const { buttonContainer, onButtonDisplayed } = initializeApplePay(new Error("unavailable"))

    expect(buttonContainer.classList.add).not.toHaveBeenCalled()
    expect(onButtonDisplayed).not.toHaveBeenCalled()
  })
})

describe("Google Pay button availability", () => {
  const invoiceData = {
    id: "iv_test",
    payment_methods: [{ type: "googlepay", display: { name: "GPay" } }],
  }

  async function initializeGooglePay(isReadyToPay: () => Promise<unknown>) {
    const client = new ProcessOut.GooglePayClient({}, createPaymentConfig())
    const buttonContainer = { appendChild: vi.fn() }
    const onButtonDisplayed = vi.fn()

    client.prepareIsReadyToPayRequest = () => {}
    client.preparePaymentRequest = () => {}
    client.googleClient = { isReadyToPay, createButton: () => ({}) }

    client.initizalizeGooglePay(buttonContainer, () => ({}), invoiceData, onButtonDisplayed)
    await new Promise(resolve => setTimeout(resolve))

    return { buttonContainer, onButtonDisplayed }
  }

  it("reports the button as displayed when Google Pay is ready to pay", async () => {
    const { buttonContainer, onButtonDisplayed } = await initializeGooglePay(() =>
      Promise.resolve({ result: true }),
    )

    expect(buttonContainer.appendChild).toHaveBeenCalledOnce()
    expect(onButtonDisplayed).toHaveBeenCalledOnce()
  })

  it("does not report the button as displayed when Google Pay is not ready to pay", async () => {
    const { buttonContainer, onButtonDisplayed } = await initializeGooglePay(() =>
      Promise.resolve({ result: false }),
    )

    expect(buttonContainer.appendChild).not.toHaveBeenCalled()
    expect(onButtonDisplayed).not.toHaveBeenCalled()
  })

  it("does not report the button as displayed when the readiness check fails", async () => {
    const { onButtonDisplayed } = await initializeGooglePay(() =>
      Promise.reject(new Error("unavailable")),
    )

    expect(onButtonDisplayed).not.toHaveBeenCalled()
  })
})
