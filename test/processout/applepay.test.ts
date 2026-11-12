import { describe, expect, it, vi } from "vitest"
import { loadApplePay } from "../support/loadNamespace"

class FakeApplePaySession {
  onvalidatemerchant: (event: { validationURL: string }) => void
  completeMerchantValidation = vi.fn()
  abort = vi.fn()
  begin = vi.fn()
}

type Respond = (onSuccess: Function, onError: Function) => void

const merchantValidated: Respond = onSuccess =>
  onSuccess({ success: true, session_payload: { id: "merchant_session" } })
const merchantRejected: Respond = onSuccess =>
  onSuccess({ success: false, error_code: "bad.domain", message: "Bad domain" })
const requestFailed: Respond = (_onSuccess, onError) =>
  onError({}, {}, "processout-js.network-issue")

function setup(respond: Respond, configure: (applePay: any, calls: string[]) => void = () => {}) {
  const ProcessOut = loadApplePay(FakeApplePaySession)
  const instance = {
    endpoint: () => "https://api.test/applepay/sessions",
    apiRequest: (
      _method: string,
      _url: string,
      _body: unknown,
      onSuccess: Function,
      onError: Function,
    ) => respond(onSuccess, onError),
  }
  const calls: string[] = []
  const newSessionOnSuccess = vi.fn()
  const newSessionOnError = vi.fn()
  const onTokenizeError = vi.fn(() => calls.push("tokenize_error"))

  const applePay = new ProcessOut.ApplePayWrapper(instance).newSession(
    { total: { label: "Order", amount: "10.00" } },
    newSessionOnSuccess,
    newSessionOnError,
  )
  configure(applePay, calls)
  applePay.tokenize({}, vi.fn(), onTokenizeError)

  const session: FakeApplePaySession = applePay.getSession()
  const validateMerchant = () =>
    session.onvalidatemerchant({ validationURL: "https://apple.test/validate" })

  return {
    calls,
    session,
    validateMerchant,
    newSessionOnSuccess,
    newSessionOnError,
    onTokenizeError,
  }
}

describe("existing behaviour (no session handlers set)", () => {
  it("completes merchant validation without calling any handler", () => {
    const { calls, session, validateMerchant } = setup(merchantValidated)

    validateMerchant()

    expect(session.completeMerchantValidation).toHaveBeenCalledWith({ id: "merchant_session" })
    expect(session.abort).not.toHaveBeenCalled()
    expect(calls).toEqual([])
  })

  it.each([
    ["the API rejects the merchant", merchantRejected, "bad.domain"],
    ["the request fails", requestFailed, "processout-js.network-issue"],
  ])("reports to the tokenize error handler and aborts when %s", (_name, respond, code) => {
    const { session, validateMerchant, onTokenizeError } = setup(respond)

    validateMerchant()

    expect(onTokenizeError).toHaveBeenCalledOnce()
    expect(onTokenizeError.mock.calls[0][0].code).toBe(code)
    expect(session.completeMerchantValidation).not.toHaveBeenCalled()
    expect(session.abort).toHaveBeenCalledOnce()
  })

  it.each([
    ["succeeds", merchantValidated],
    ["fails", merchantRejected],
  ])("never calls the callbacks given to newSession when validation %s", (_name, respond) => {
    const { validateMerchant, newSessionOnSuccess, newSessionOnError } = setup(respond)

    validateMerchant()

    expect(newSessionOnSuccess).not.toHaveBeenCalled()
    expect(newSessionOnError).not.toHaveBeenCalled()
  })
})

describe("session handlers", () => {
  it("calls onmerchantvalidated after the merchant validation is completed", () => {
    const { calls, session, validateMerchant } = setup(merchantValidated, (applePay, calls) => {
      applePay.onmerchantvalidated = () => {
        expect(session.completeMerchantValidation).toHaveBeenCalledOnce()
        calls.push("merchant_validated")
      }
    })

    validateMerchant()

    expect(calls).toEqual(["merchant_validated"])
  })

  it.each([
    ["the API rejects the merchant", merchantRejected, "bad.domain"],
    ["the request fails", requestFailed, "processout-js.network-issue"],
  ])(
    "calls onmerchantvalidationerror before the tokenize error handler when %s",
    (_name, respond, code) => {
      const onMerchantValidationError = vi.fn()
      const { calls, session, validateMerchant } = setup(respond, (applePay, calls) => {
        applePay.onmerchantvalidationerror = (err: unknown) => {
          onMerchantValidationError(err)
          calls.push("merchant_validation_error")
        }
      })

      validateMerchant()

      expect(calls).toEqual(["merchant_validation_error", "tokenize_error"])
      expect(onMerchantValidationError.mock.calls[0][0].code).toBe(code)
      expect(session.abort).toHaveBeenCalledOnce()
    },
  )

  it("still reports the error and aborts when onmerchantvalidationerror throws", () => {
    const { session, validateMerchant, onTokenizeError } = setup(merchantRejected, applePay => {
      applePay.onmerchantvalidationerror = () => {
        throw new Error("listener blew up")
      }
    })

    expect(validateMerchant).toThrow("listener blew up")
    expect(onTokenizeError).toHaveBeenCalledOnce()
    expect(session.abort).toHaveBeenCalledOnce()
  })
})
