import { beforeEach, describe, expect, it, vi } from "vitest"
import { CapturedEvent, loadDynamicCheckout } from "../support/loadNamespace"

const PAYMENT_SUBMITTED = "processout_dynamic_checkout_payment_submitted"

let ProcessOut: Record<string, any>
let dispatchedEvents: CapturedEvent[]

beforeEach(() => {
  const loaded = loadDynamicCheckout()
  ProcessOut = loaded.namespace
  dispatchedEvents = loaded.dispatchedEvents
})

function createPaymentConfig() {
  const paymentConfig = new ProcessOut.DynamicCheckoutPaymentConfig({
    projectId: "proj_test",
    invoiceId: "iv_test",
  })

  paymentConfig.setInvoiceDetails({ payment_methods: [], return_url: "https://merchant.test" })

  return paymentConfig
}

function getEventTypes() {
  return dispatchedEvents.map(event => event.type)
}

describe("Google Pay", () => {
  const invoiceData = {
    id: "iv_test",
    payment_methods: [{ type: "googlepay", display: { name: "GPay" } }],
  }
  const paymentData = {
    paymentMethodData: { tokenizationData: { token: JSON.stringify({ signature: "sig" }) } },
  }

  function createClient(loadPaymentData: () => Promise<unknown>) {
    const processOutInstance = { tokenize: vi.fn() }
    const client = new ProcessOut.GooglePayClient(processOutInstance, createPaymentConfig())
    client.googleClient = { loadPaymentData }

    return { client, processOutInstance }
  }

  it("dispatches payment_submitted before tokenizing once the user approves", async () => {
    const { client, processOutInstance } = createClient(() => Promise.resolve(paymentData))
    processOutInstance.tokenize.mockImplementation(() => {
      expect(getEventTypes()).toEqual([PAYMENT_SUBMITTED])
    })

    client.makePayment(invoiceData, () => ({}))
    await vi.waitFor(() => expect(processOutInstance.tokenize).toHaveBeenCalledOnce())

    expect(dispatchedEvents[0].detail).toEqual({
      payment_method_name: "google_pay",
      payment_method_display_name: "GPay",
      invoice_id: "iv_test",
      return_url: "https://merchant.test",
    })
  })

  it("does not dispatch payment_submitted when the payment sheet is dismissed", async () => {
    const { client, processOutInstance } = createClient(() =>
      Promise.reject({ statusCode: "CANCELED" }),
    )

    client.makePayment(invoiceData, () => ({}))
    await vi.waitFor(() => expect(dispatchedEvents).toHaveLength(1))

    expect(getEventTypes()).not.toContain(PAYMENT_SUBMITTED)
    expect(processOutInstance.tokenize).not.toHaveBeenCalled()
  })
})

describe("Apple Pay", () => {
  const invoiceData = {
    id: "iv_test",
    name: "Order",
    amount: "10.00",
    currency: "USD",
    payment_methods: [
      {
        type: "applepay",
        display: { name: "Apple Pay (CAT)" },
        applepay: { country_code: "US", merchant_capabilities: [], merchant_id: "merchant.test" },
      },
    ],
  }

  function createSession() {
    const processOutInstance = { applePay: { newSession: () => ({}) } }
    const client = new ProcessOut.ApplePayClient(processOutInstance, createPaymentConfig())
    client.getSupportedNetworks = () => []

    return client.createApplePaySession(invoiceData)
  }

  it("dispatches payment_submitted when the user authorizes the payment", () => {
    const session = createSession()

    expect(dispatchedEvents).toHaveLength(0)

    session.onpaymentauthorizedPostprocess()

    expect(getEventTypes()).toEqual([
      PAYMENT_SUBMITTED,
      "processout_dynamic_checkout_apple_pay_authorized_post_process",
    ])
    expect(dispatchedEvents[0].detail).toEqual({
      payment_method_name: "apple_pay",
      payment_method_display_name: "Apple Pay (CAT)",
      invoice_id: "iv_test",
      return_url: "https://merchant.test",
    })
  })
})
