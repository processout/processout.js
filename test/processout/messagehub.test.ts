import { describe, expect, it, vi } from "vitest"
import { loadMessageHub } from "../support/loadNamespace"

const HUB_ORIGIN = "https://js.example"

function createHub(hubUrl = `${HUB_ORIGIN}/messagehub.html`) {
  const { namespace, messageListeners, hubWindow } = loadMessageHub()
  const instance = {
    getProcessOutMessageHubEndpoint: (suffix: string) => `${hubUrl}${suffix}`,
  }
  const onready = vi.fn()
  const onnotify = vi.fn()
  new namespace.MessageHub(instance, onready, onnotify)

  const post = (origin: string, source: unknown, message: Record<string, unknown>) =>
    messageListeners.forEach(listener => listener({ origin, source, data: JSON.stringify(message) }))

  return { post, hubWindow, onready, onnotify }
}

const value = {
  namespace: "processout.message-hub",
  action: "value",
  data: { key: "processout.checkout", value: '{"action":"success","data":"tok_forged"}' },
}
const ready = { namespace: "processout.message-hub", action: "ready" }

describe("MessageHub sender check", () => {
  it("relays values posted by the hub iframe", () => {
    const { post, hubWindow, onnotify } = createHub()
    post(HUB_ORIGIN, hubWindow, value)
    expect(onnotify).toHaveBeenCalledWith(value.data.key, value.data.value)
  })

  it("ignores values from another origin, even from the hub window", () => {
    const { post, hubWindow, onnotify } = createHub()
    post("http://127.0.0.1:8897", hubWindow, value)
    expect(onnotify).not.toHaveBeenCalled()
  })

  it("ignores values from another window on the hub origin", () => {
    const { post, onnotify } = createHub()
    post(HUB_ORIGIN, {}, value)
    expect(onnotify).not.toHaveBeenCalled()
  })

  it("only treats the hub iframe's ready message as ready", () => {
    const { post, hubWindow, onready } = createHub()
    post("http://127.0.0.1:8897", {}, ready)
    expect(onready).not.toHaveBeenCalled()
    post(HUB_ORIGIN, hubWindow, ready)
    expect(onready).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["an uppercase host with the default port", "https://JS.Example:443/messagehub.html", HUB_ORIGIN],
    ["a relative URL", "/messagehub.html", "https://merchant.test"],
  ])("matches the browser-normalised origin for %s", (_case, hubUrl, origin) => {
    const { post, hubWindow, onnotify } = createHub(hubUrl)
    post(origin, hubWindow, value)
    expect(onnotify).toHaveBeenCalledWith(value.data.key, value.data.value)
  })

  it("ignores every message when the hub URL cannot be parsed", () => {
    const { post, hubWindow, onnotify } = createHub("https://")
    post("", hubWindow, value)
    post("null", hubWindow, value)
    expect(onnotify).not.toHaveBeenCalled()
  })
})
