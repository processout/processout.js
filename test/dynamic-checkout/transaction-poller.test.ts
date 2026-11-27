import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LOCALES, loadDynamicCheckout, loadTransactionPoller } from "../support/loadNamespace"

const INTERVAL_MS = 3000
const MAX_INTERVAL_MS = 30 * 1000
const BACKOFF_FACTOR = 1.5
const TIMEOUT_MS = 15 * 60 * 1000
const REQUEST_TIMEOUT_MS = 30 * 1000

// Start times of the checks while the page stays visible: 0, 3 s, 7.5 s, … with the interval capped at 30 s.
function checkTimesUntil(endMs: number): number[] {
  const times: number[] = []
  let at = 0
  let delay = INTERVAL_MS
  while (at < endMs) {
    times.push(at)
    at += Math.min(delay, endMs - at)
    delay = Math.min(delay * BACKOFF_FACTOR, MAX_INTERVAL_MS)
  }
  return times
}

let Poller: any

beforeEach(() => {
  vi.useFakeTimers()
  Poller = loadTransactionPoller().DynamicCheckoutTransactionPoller
})

afterEach(() => {
  vi.useRealTimers()
})

type FakeResponse = { status?: string; error?: boolean }

function createHarness(
  responses: FakeResponse[],
  visibilityState = "visible",
  options: { timeoutMs?: number } = {},
) {
  const listeners: Record<string, Array<() => void>> = {}
  const addListener = (type: string, listener: () => void) => {
    listeners[type] = [...(listeners[type] || []), listener]
  }
  const removeListener = (type: string, listener: () => void) => {
    listeners[type] = (listeners[type] || []).filter(l => l !== listener)
  }
  const doc = {
    visibilityState,
    addEventListener: vi.fn(addListener),
    removeEventListener: vi.fn(removeListener),
  }
  const win = {
    addEventListener: vi.fn(addListener),
    removeEventListener: vi.fn(removeListener),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: any) => clearTimeout(id),
  }
  let call = 0
  const apiRequest = vi.fn((_method, _path, _data, success, error) => {
    const response = responses[Math.min(call, responses.length - 1)]
    call++
    if (response.error) {
      error()
    } else {
      success({ invoice: { transaction: { status: response.status, captured: true } } })
    }
  })
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onTimeout: vi.fn() }
  let mounted = true
  const startedAt = Date.now()

  const poller = new Poller({
    processOutInstance: { apiRequest },
    invoiceId: "iv_test",
    clientSecret: "secret",
    ...callbacks,
    isMounted: () => mounted,
    now: () => Date.now(),
    win,
    doc,
    ...options,
  })

  return {
    poller,
    apiRequest,
    callbacks,
    doc,
    fire: (type: string) => (listeners[type] || []).forEach(listener => listener()),
    listenerCount: () => Object.values(listeners).reduce((n, l) => n + l.length, 0),
    unmount: () => {
      mounted = false
    },
    startedAt,
  }
}

describe("DynamicCheckoutTransactionPoller", () => {
  it("checks right away with the client secret", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()

    expect(h.apiRequest).toHaveBeenCalledOnce()
    expect(h.apiRequest.mock.calls[0][0]).toBe("GET")
    expect(h.apiRequest.mock.calls[0][1]).toBe("invoices/iv_test?expand=transaction")
    expect(h.apiRequest.mock.calls[0][6]).toEqual({ isLegacy: false, clientSecret: "secret" })
  })

  it("polls until a successful status, then reports it once and stops", () => {
    const h = createHarness([{ status: "waiting" }, { status: "pending" }, { status: "completed" }])

    h.poller.start()
    vi.advanceTimersByTime(INTERVAL_MS * 5)

    expect(h.apiRequest).toHaveBeenCalledTimes(3)
    expect(h.callbacks.onSuccess).toHaveBeenCalledExactlyOnceWith({
      status: "completed",
      captured: true,
    })
    expect(h.callbacks.onFailure).not.toHaveBeenCalled()
    expect(h.poller.isFinished()).toBe(true)
    expect(h.listenerCount()).toBe(0)
  })

  it.each(["authorized", "pending-capture", "completed"])("treats %s as success", status => {
    const h = createHarness([{ status }])

    h.poller.start()

    expect(h.callbacks.onSuccess).toHaveBeenCalledOnce()
  })

  it.each(["failed", "voided", "blocked"])("treats %s as failure", status => {
    const h = createHarness([{ status }])

    h.poller.start()

    expect(h.callbacks.onFailure).toHaveBeenCalledOnce()
    expect(h.callbacks.onSuccess).not.toHaveBeenCalled()
  })

  it("keeps polling after a request error", () => {
    const h = createHarness([{ error: true }, { status: "completed" }])

    h.poller.start()
    vi.advanceTimersByTime(INTERVAL_MS)

    expect(h.apiRequest).toHaveBeenCalledTimes(2)
    expect(h.callbacks.onSuccess).toHaveBeenCalledOnce()
  })

  it("doesn't request while the page is hidden, and checks right away when it becomes visible", () => {
    const h = createHarness([{ status: "waiting" }], "hidden")

    h.poller.start()
    vi.advanceTimersByTime(INTERVAL_MS * 3)
    expect(h.apiRequest).not.toHaveBeenCalled()

    h.doc.visibilityState = "visible"
    h.fire("visibilitychange")

    expect(h.apiRequest).toHaveBeenCalledOnce()
  })

  it("checks on focus without waiting for the next tick", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()
    h.fire("focus")

    expect(h.apiRequest).toHaveBeenCalledTimes(2)
  })

  it("starts at 3 s and grows the interval by 1.5x up to 30 s", () => {
    const h = createHarness([{ status: "waiting" }])
    const expectedDelays = [3000, 4500, 6750, 10125, 15187.5, 22781.25, 30000, 30000]

    h.poller.start()
    for (const [index, delay] of expectedDelays.entries()) {
      vi.advanceTimersByTime(delay - 1)
      expect(h.apiRequest).toHaveBeenCalledTimes(index + 1)
      vi.advanceTimersByTime(1)
      expect(h.apiRequest).toHaveBeenCalledTimes(index + 2)
    }
  })

  it("starts again at 3 s when the shopper comes back to the page", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()
    vi.advanceTimersByTime(3000 + 4500 + 6750)
    expect(h.apiRequest).toHaveBeenCalledTimes(4)

    h.fire("focus")
    expect(h.apiRequest).toHaveBeenCalledTimes(5)
    vi.advanceTimersByTime(INTERVAL_MS)
    expect(h.apiRequest).toHaveBeenCalledTimes(6)
  })

  it("times out after 15 min with a single timeout callback", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()
    vi.advanceTimersByTime(TIMEOUT_MS + INTERVAL_MS)

    expect(h.callbacks.onTimeout).toHaveBeenCalledOnce()
    expect(h.callbacks.onSuccess).not.toHaveBeenCalled()
    expect(h.apiRequest).toHaveBeenCalledTimes(checkTimesUntil(TIMEOUT_MS).length)
    expect(h.listenerCount()).toBe(0)
  })

  it("doesn't wait past the timeout when the interval is longer than the time left", () => {
    const h = createHarness([{ status: "waiting" }], "visible", { timeoutMs: 10000 })

    h.poller.start()
    vi.advanceTimersByTime(9999)
    expect(h.callbacks.onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(h.callbacks.onTimeout).toHaveBeenCalledOnce()
    expect(h.apiRequest).toHaveBeenCalledTimes(3)
  })

  it("times out even while the page stays hidden", () => {
    const h = createHarness([{ status: "waiting" }], "hidden")

    h.poller.start()
    vi.advanceTimersByTime(TIMEOUT_MS + INTERVAL_MS)

    expect(h.callbacks.onTimeout).toHaveBeenCalledOnce()
    expect(h.apiRequest).not.toHaveBeenCalled()
  })

  it("stops silently when the widget is unmounted", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()
    h.unmount()
    vi.advanceTimersByTime(INTERVAL_MS * 3)

    expect(h.apiRequest).toHaveBeenCalledOnce()
    expect(h.poller.isFinished()).toBe(true)
    expect(h.callbacks.onTimeout).not.toHaveBeenCalled()
    expect(h.listenerCount()).toBe(0)
  })

  it("stop() ends polling without any callback", () => {
    const h = createHarness([{ status: "waiting" }])

    h.poller.start()
    h.poller.stop()
    vi.advanceTimersByTime(INTERVAL_MS * 3)
    h.fire("focus")

    expect(h.apiRequest).toHaveBeenCalledOnce()
    expect(h.callbacks.onSuccess).not.toHaveBeenCalled()
    expect(h.callbacks.onFailure).not.toHaveBeenCalled()
    expect(h.callbacks.onTimeout).not.toHaveBeenCalled()
  })

  it("ignores a response that arrives after stop()", () => {
    let pendingSuccess: ((data: any) => void) | null = null
    const h = createHarness([{ status: "waiting" }])
    h.apiRequest.mockImplementationOnce((_m, _p, _d, success) => {
      pendingSuccess = success
    })

    h.poller.start()
    h.poller.stop()
    pendingSuccess!({ invoice: { transaction: { status: "completed" } } })

    expect(h.callbacks.onSuccess).not.toHaveBeenCalled()
  })

  it("counts a request that never answers as an error after 30 s and polls again", () => {
    let lateSuccess: ((data: any) => void) | null = null
    const h = createHarness([{ status: "completed" }])
    h.apiRequest.mockImplementationOnce((_m, _p, _d, success) => {
      lateSuccess = success
    })

    h.poller.start()
    h.fire("focus")
    vi.advanceTimersByTime(REQUEST_TIMEOUT_MS - 1)
    expect(h.apiRequest).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(1 + INTERVAL_MS)
    expect(h.apiRequest).toHaveBeenCalledTimes(2)
    expect(h.callbacks.onSuccess).toHaveBeenCalledOnce()

    lateSuccess!({ invoice: { transaction: { status: "failed" } } })
    expect(h.callbacks.onFailure).not.toHaveBeenCalled()
  })

  it("times out after 15 min even when requests never answer", () => {
    const h = createHarness([{ status: "waiting" }])
    h.apiRequest.mockImplementation(() => {})

    h.poller.start()
    vi.advanceTimersByTime(TIMEOUT_MS - 1)
    expect(h.callbacks.onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(h.callbacks.onTimeout).toHaveBeenCalledOnce()
  })

  it("ignores a final status that arrives after the widget was removed", () => {
    let pendingSuccess: ((data: any) => void) | null = null
    const h = createHarness([{ status: "waiting" }])
    h.apiRequest.mockImplementationOnce((_m, _p, _d, success) => {
      pendingSuccess = success
    })

    h.poller.start()
    h.unmount()
    pendingSuccess!({ invoice: { transaction: { status: "completed" } } })

    expect(h.callbacks.onSuccess).not.toHaveBeenCalled()
    expect(h.poller.isFinished()).toBe(true)
    expect(h.listenerCount()).toBe(0)
  })
})

describe("payment-awaiting-confirmation translations", () => {
  it.each(LOCALES.map(locale => locale.file))("%s has both keys", file => {
    const { namespace } = loadDynamicCheckout()
    const translations = namespace[LOCALES.find(locale => locale.file === file)!.name]

    expect(translations["payment-awaiting-confirmation-message"]).toBeTruthy()
    expect(translations["payment-awaiting-confirmation-cancel-button"]).toBeTruthy()
  })
})
