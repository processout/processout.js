import { describe, expect, it } from "vitest"
import { loadActionHandler } from "../support/loadNamespace"

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
