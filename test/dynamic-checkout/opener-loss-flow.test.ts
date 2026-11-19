import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CapturedEvent, loadOpenerLossFlow } from "../support/loadNamespace"

const INTERVAL_MS = 3000
const TIMEOUT_MS = 15 * 60 * 1000
const PAYMENT_SUCCESS = "processout_dynamic_checkout_payment_success"
const PAYMENT_ERROR = "processout_dynamic_checkout_payment_error"
const PAYMENT_PENDING = "processout_dynamic_checkout_payment_pending"
const PAYMENT_CANCELLED = "processout_dynamic_checkout_payment_cancelled"

let ProcessOut: Record<string, any>
let dispatchedEvents: CapturedEvent[]

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("document", {
    visibilityState: "visible",
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { contains: () => true },
  })
  const loaded = loadOpenerLossFlow()
  ProcessOut = loaded.namespace
  dispatchedEvents = loaded.dispatchedEvents
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function createFlow(statuses: string[], options: { showStatusMessage?: boolean } = {}) {
  const shownViews: any[] = []
  const container = { appendChild: (element: any) => shownViews.push(element) }
  let call = 0
  const apiRequest = vi.fn((_method, _path, _data, success) => {
    const status = statuses[Math.min(call, statuses.length - 1)]
    call++
    success({ invoice: { transaction: { status, authorized: true, captured: true } } })
  })
  const paymentConfig = {
    invoiceId: "iv_test",
    clientSecret: "secret",
    showStatusMessage: options.showStatusMessage ?? true,
    invoiceDetails: { return_url: "https://merchant.test/return" },
  }
  const flow = new ProcessOut.DynamicCheckoutOpenerLossFlow({
    processOutInstance: { apiRequest },
    paymentConfig,
    resetContainerHtml: () => container,
    gatewayName: "mercadopagomxcashinaccount",
    paymentMethodDisplayName: "Mercado Pago",
  })

  return { flow, apiRequest, shownViews: () => shownViews.map(element => element.view) }
}

const eventBase = {
  payment_method_name: "mercadopagomxcashinaccount",
  payment_method_display_name: "Mercado Pago",
  invoice_id: "iv_test",
  return_url: "https://merchant.test/return",
}

describe("DynamicCheckoutOpenerLossFlow", () => {
  it("shows the awaiting view and emits no event while the transaction is waiting", () => {
    const { flow, shownViews } = createFlow(["waiting"])

    flow.start()
    vi.advanceTimersByTime(INTERVAL_MS * 10)

    expect(shownViews()).toEqual(["DynamicCheckoutPaymentAwaitingConfirmationView"])
    expect(dispatchedEvents).toEqual([])
  })

  it("emits payment_success with the transaction status once the payment completes", () => {
    const { flow, shownViews } = createFlow(["waiting", "completed"])

    flow.start()
    vi.advanceTimersByTime(INTERVAL_MS)

    expect(shownViews()).toEqual([
      "DynamicCheckoutPaymentAwaitingConfirmationView",
      "DynamicCheckoutPaymentSuccessView",
    ])
    expect(dispatchedEvents).toEqual([
      { type: PAYMENT_SUCCESS, detail: { ...eventBase, authorized: true, captured: true } },
    ])
  })

  it("leaves the view to the merchant redirect when status messages are off", () => {
    const { flow, shownViews } = createFlow(["completed"], { showStatusMessage: false })

    flow.start()

    expect(shownViews()).toEqual(["DynamicCheckoutPaymentAwaitingConfirmationView"])
    expect(dispatchedEvents.map(event => event.type)).toEqual([PAYMENT_SUCCESS])
  })

  it("emits payment_error for a failed transaction", () => {
    const { flow, shownViews } = createFlow(["failed"])

    flow.start()

    expect(shownViews()).toEqual([
      "DynamicCheckoutPaymentAwaitingConfirmationView",
      "DynamicCheckoutPaymentErrorView",
    ])
    expect(dispatchedEvents).toEqual([
      {
        type: PAYMENT_ERROR,
        detail: {
          ...eventBase,
          error_type: "gateway.declined",
          error_message: "The payment was not completed.",
          transaction_status: "failed",
        },
      },
    ])
  })

  it("emits payment_pending with reason and timeout only after 15 min", () => {
    const { flow, shownViews } = createFlow(["waiting"])

    flow.start()
    vi.advanceTimersByTime(TIMEOUT_MS - INTERVAL_MS)
    expect(dispatchedEvents).toEqual([])

    vi.advanceTimersByTime(INTERVAL_MS * 2)

    expect(shownViews()).toEqual([
      "DynamicCheckoutPaymentAwaitingConfirmationView",
      "DynamicCheckoutPaymentPendingView",
    ])
    expect(dispatchedEvents).toEqual([
      {
        type: PAYMENT_PENDING,
        detail: { ...eventBase, reason: "opener_isolated", timeout: true },
      },
    ])
  })

  it("Cancel stops polling and emits payment_cancelled with tab_closed", () => {
    const { flow, apiRequest, shownViews } = createFlow(["waiting"])

    flow.start()
    const awaitingView = flow["view"]
    const onCancel = awaitingView.args[2]
    onCancel()
    vi.advanceTimersByTime(INTERVAL_MS * 5)

    expect(apiRequest).toHaveBeenCalledOnce()
    expect(shownViews()).toEqual([
      "DynamicCheckoutPaymentAwaitingConfirmationView",
      "DynamicCheckoutPaymentCancelledView",
    ])
    expect(dispatchedEvents).toEqual([
      { type: PAYMENT_CANCELLED, detail: { ...eventBase, tab_closed: true } },
    ])
  })

  it("takeOver() stops polling and tells whether an outcome was already reported", () => {
    const pending = createFlow(["waiting"])
    pending.flow.start()
    expect(pending.flow.takeOver()).toBe(false)
    vi.advanceTimersByTime(INTERVAL_MS * 5)
    expect(pending.apiRequest).toHaveBeenCalledOnce()

    const resolved = createFlow(["completed"])
    resolved.flow.start()
    expect(resolved.flow.takeOver()).toBe(true)
  })

  it("takeOver() before start() reports nothing to ignore", () => {
    const { flow } = createFlow(["waiting"])

    expect(flow.takeOver()).toBe(false)
  })
})
