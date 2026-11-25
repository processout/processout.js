import { describe, expect, it, vi } from "vitest"
import { loadActionHandler, loadActionHandlerMessaging } from "../support/loadNamespace"

const PASSKEY_PERMISSIONS = "payment *; publickey-credentials-get *; publickey-credentials-create *"

const fakeInstance = { endpoint: (_sub: string, path: string) => `https://js.example${path}` }

function createdIframes(actionType?: string, override?: { width: number; height: number }) {
  const { namespace, createdElements } = loadActionHandler()
  const { ActionHandler, ActionHandlerOptions } = namespace
  new ActionHandler(fakeInstance, new ActionHandlerOptions(actionType, undefined, override))
  return createdElements.filter((el) => el.tagName === "iframe")
}

describe("ActionHandler iframe permissions", () => {
  it("delegates passkey and payment permissions to the 3DS challenge iframe", () => {
    const iframes = createdIframes("three-d-s-challenge-flow")
    expect(iframes).toHaveLength(1)
    expect(iframes[0].attributes.allow).toBe(PASSKEY_PERMISSIONS)
    expect(iframes[0].attributes.frameborder).toBe("0")
  })

  it("keeps the 3DS challenge permissions when an iframe size override is set", () => {
    const [iframe] = createdIframes("three-d-s-challenge-flow", { width: 600, height: 400 })
    expect(iframe.attributes.allow).toBe(PASSKEY_PERMISSIONS)
  })

  it("does not delegate permissions to non-3DS iframe overrides", () => {
    const [iframe] = createdIframes("some-apm-gateway", { width: 600, height: 400 })
    expect(iframe).toBeDefined()
    expect(iframe.attributes.allow).toBeUndefined()
  })

  it("creates no iframe for flows that leave the page", () => {
    expect(createdIframes("three-d-s-challenge-flow-no-iframe")).toHaveLength(0)
    expect(createdIframes("paypal")).toHaveLength(0)
  })
})

const CHECKOUT_ORIGIN = "https://checkout.example"

function listen() {
  const { namespace, messageListeners, hubNotifiers } = loadActionHandlerMessaging()
  const { ActionHandler, ActionHandlerOptions } = namespace
  const instance = {
    endpoint: (sub: string, path: string) => `https://${sub}.example${path}`,
    telemetryClient: { reportWarning: vi.fn() },
  }
  const handler = new ActionHandler(instance, new ActionHandlerOptions(), "iv_test")
  const popup = { close: vi.fn() }
  const success = vi.fn()
  const error = vi.fn()
  handler.listenEvents(popup, null, () => {}, success, error)

  const post = (origin: string, message: Record<string, unknown>) =>
    messageListeners.forEach(listener => listener({ origin, data: JSON.stringify(message) }))

  return { post, hubNotifiers, popup, success, error }
}

const forgedSuccess = {
  namespace: "processout.checkout",
  action: "success",
  data: { token: "tok_attacker_forged" },
}

describe("ActionHandler message origin", () => {
  it("delivers a checkout result posted from the checkout origin", () => {
    const { post, popup, success, error } = listen()
    post(CHECKOUT_ORIGIN, { namespace: "processout.checkout", action: "success", data: "gway_req_abc" })
    expect(success).toHaveBeenCalledWith("gway_req_abc")
    expect(popup.close).toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it.each([
    ["success", forgedSuccess],
    ["canceled", { namespace: "processout.checkout", action: "canceled" }],
    ["error", { namespace: "processout.checkout", action: "error", errorCode: "forged" }],
  ])("ignores a forged %s message from another origin", (_action, message) => {
    const { post, popup, success, error } = listen()
    post("http://127.0.0.1:8897", message)
    post("https://js.example", message)
    expect(success).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(popup.close).not.toHaveBeenCalled()
  })

  it("still accepts the real result after a forged message was ignored", () => {
    const { post, success } = listen()
    post("http://127.0.0.1:8897", forgedSuccess)
    post(CHECKOUT_ORIGIN, { namespace: "processout.checkout", action: "success", data: "gway_req_real" })
    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith("gway_req_real")
  })

  it("delivers results relayed by the message hub", () => {
    const { hubNotifiers, success } = listen()
    expect(hubNotifiers).toHaveLength(1)
    hubNotifiers[0]("processout.checkout", JSON.stringify({ action: "success", data: "gway_req_hub" }))
    expect(success).toHaveBeenCalledWith("gway_req_hub")
  })
})
