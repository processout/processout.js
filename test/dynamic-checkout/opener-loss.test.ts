import { beforeEach, describe, expect, it, vi } from "vitest"
import { loadOpenerLoss } from "../support/loadNamespace"

let OpenerLoss: Record<string, any>

beforeEach(() => {
  OpenerLoss = loadOpenerLoss().DynamicCheckoutOpenerLossUtils
})

const tabClosed = { code: "customer.canceled", metadata: { reason: "tab_closed" } }
const overlayCancel = { code: "customer.canceled" }

function fakeDocument(hasFocus: boolean, visibilityState: string) {
  return { hasFocus: () => hasFocus, visibilityState }
}

function fakeProcessOut() {
  return { telemetryClient: { report: vi.fn() } }
}

describe("DynamicCheckoutOpenerLossUtils.getMode", () => {
  it.each([
    ["off", "off"],
    ["shadow", "shadow"],
    ["on", "on"],
    [undefined, "off"],
    ["", "off"],
    ["ON", "off"],
    ["unexpected", "off"],
  ])("maps %s to %s", (input, expected) => {
    expect(OpenerLoss.getMode(input)).toBe(expected)
  })
})

describe("DynamicCheckoutOpenerLossUtils.getVerdict", () => {
  it.each([
    [true, "visible", "real_close"],
    [false, "visible", "severed_link"],
    [true, "hidden", "severed_link"],
    [false, "hidden", "severed_link"],
  ])("hasFocus=%s visibility=%s is %s", (hasFocus, visibilityState, expected) => {
    expect(OpenerLoss.getVerdict({ hasFocus, visibilityState })).toBe(expected)
  })
})

describe("DynamicCheckoutOpenerLossUtils.isOpenerLoss", () => {
  const context = { gatewayName: "mercadopagomxcashinaccount", invoiceId: "iv_test" }

  it.each([
    // mode, hasFocus, visibility, expected pending, expected telemetry
    ["off", false, "hidden", false, false],
    [undefined, false, "hidden", false, false],
    ["shadow", false, "hidden", false, true],
    ["shadow", true, "visible", false, true],
    ["on", false, "hidden", true, true],
    ["on", true, "visible", false, true],
  ])(
    "mode=%s hasFocus=%s visibility=%s -> pending=%s, telemetry=%s",
    (mode, hasFocus, visibilityState, expectedPending, expectedTelemetry) => {
      const processOut = fakeProcessOut()

      const pending = OpenerLoss.isOpenerLoss(
        processOut,
        tabClosed,
        { ...context, mode },
        fakeDocument(hasFocus, visibilityState),
      )

      expect(pending).toBe(expectedPending)
      expect(processOut.telemetryClient.report).toHaveBeenCalledTimes(expectedTelemetry ? 1 : 0)
    },
  )

  it("ignores a cancel that isn't a closed tab, even in on mode", () => {
    const processOut = fakeProcessOut()
    const doc = fakeDocument(false, "hidden")

    expect(
      OpenerLoss.isOpenerLoss(processOut, overlayCancel, { ...context, mode: "on" }, doc),
    ).toBe(false)
    expect(
      OpenerLoss.isOpenerLoss(
        processOut,
        { code: "card.declined" },
        { ...context, mode: "on" },
        doc,
      ),
    ).toBe(false)
    expect(processOut.telemetryClient.report).not.toHaveBeenCalled()
  })

  it("reads the page state once, when it is called", () => {
    const processOut = fakeProcessOut()
    const hasFocus = vi.fn(() => false)

    OpenerLoss.isOpenerLoss(
      processOut,
      tabClosed,
      { ...context, mode: "on" },
      {
        hasFocus,
        visibilityState: "hidden",
      },
    )

    expect(hasFocus).toHaveBeenCalledOnce()
  })

  it("reports the verdict, page state and gateway at info level", () => {
    const processOut = fakeProcessOut()
    vi.spyOn(Date, "now").mockReturnValue(10_000)

    OpenerLoss.isOpenerLoss(
      processOut,
      tabClosed,
      { ...context, mode: "shadow", actionStartedAt: 7_500 },
      fakeDocument(false, "hidden"),
    )

    expect(processOut.telemetryClient.report).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "merchant.test",
        message: "dynamic checkout opener loss verdict",
        invoiceId: "iv_test",
        data: {
          mode: "shadow",
          verdict: "severed_link",
          gateway_name: "mercadopagomxcashinaccount",
          has_focus: false,
          visibility_state: "hidden",
          ms_since_action_start: 2_500,
          user_agent: "test-agent",
        },
      }),
      "info",
    )
    vi.restoreAllMocks()
  })
})
