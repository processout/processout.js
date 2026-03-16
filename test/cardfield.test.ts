/**
 * Tests for CardField postMessage behavior when iframe.contentWindow access throws
 * (e.g. SecurityError from cross-origin iframe, or HTMLIFrameElement.get errors in Datadog)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  requireProcessOut,
  createMockProcessOut,
  createMockForm,
  createIframe,
  attachElement,
} from "./utils"

describe("CardField", () => {
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.createElement = originalCreateElement
  })

  describe("validate", () => {
    it("retries when contentWindow access throws (e.g. SecurityError / HTMLIFrameElement.get)", () => {
      const ProcessOut = requireProcessOut()
      if (!ProcessOut) return

      const container = document.createElement("div")
      const mockProcessOut = createMockProcessOut()
      const mockForm = createMockForm()

      const options = new ProcessOut.CardFieldOptions(ProcessOut.CardField.number)
      options.placeholder = "Card number"

      const throwingIframe = createIframe({ throws: "SecurityError: Blocked a frame with origin" })

      attachElement("iframe", throwingIframe, originalCreateElement)

      const success = vi.fn()
      const error = vi.fn()

      const cardField = new ProcessOut.CardField(
        mockProcessOut,
        mockForm,
        options,
        container,
        success,
        error
      )

      // Trigger postMessage via validate (calls postMessage internally)
      cardField.validate(success, error)

      // postMessage schedules retries; when exhausted it calls the error callback
      vi.advanceTimersByTime(50)
      vi.advanceTimersByTime(50)
      vi.advanceTimersByTime(50)

      expect(error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "processout-js.field.unavailable",
          message: "Tried to locate the iframe content window but failed.",
        })
      )
      expect(mockProcessOut.telemetryClient.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "cardfield.ts#validate",
          host: "processout-js",
          lineNumber: expect.any(Number),
          message: "Tried to locate the iframe content window but failed.",
        })
      )
    })

    it("succeeds when contentWindow is available and iframe responds", () => {
      const ProcessOut = requireProcessOut()
      if (!ProcessOut) return

      const container = document.createElement("div")
      const validateSuccess = vi.fn()
      const validateError = vi.fn()

      const mockProcessOut = createMockProcessOut()
      const mockForm = createMockForm()

      let cardFieldRef: any
      const validIframe = createIframe({
        responds: (message: string) => {
          const payload = JSON.parse(message)
          if (payload.action === "validate") {
            return JSON.stringify({
              frameID: cardFieldRef.uid,
              namespace: "processout.field",
              messageID: payload.messageID,
              action: "validate",
            })
          }
        },
      })

      attachElement("iframe", validIframe, originalCreateElement)

      const success = vi.fn()
      const error = vi.fn()

      const cardField = new ProcessOut.CardField(
        mockProcessOut,
        mockForm,
        new ProcessOut.CardFieldOptions(ProcessOut.CardField.number),
        container,
        success,
        error
      )
      cardFieldRef = cardField

      cardField.validate(validateSuccess, validateError)

      vi.advanceTimersByTime(0)

      expect(validateSuccess).toHaveBeenCalled()
      expect(validateError).not.toHaveBeenCalled()
    })
  })
})
