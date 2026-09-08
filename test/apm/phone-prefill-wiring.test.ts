import { describe, expect, it } from "vitest"
import { loadApmForm, loadApmPhone, VNodeStub } from "../support/loadNamespace"

const CODES = [
  { region_code: "GB", value: "+44", name: "United Kingdom" },
  { region_code: "PL", value: "+48", name: "Poland" },
]

const PHONE_FIELD = {
  type: "phone",
  key: "customerPhone",
  label: "Phone",
  required: true,
  dialing_codes: CODES,
}

function formState(values: Record<string, any>, validation: Record<string, any> = {}) {
  return {
    loading: false,
    form: { values, errors: {}, validation, touched: {} },
  }
}

function validate(values: Record<string, any>) {
  const { validateForm } = loadApmForm()
  let next: any
  const ok = validateForm(
    formState(values, { customerPhone: { required: true } }),
    (fn: (prev: any) => any) => { next = fn(formState(values)) },
  )
  return { ok, errors: next.form.errors }
}

function renderForm(values: Record<string, any>) {
  const { Form, phoneProps } = loadApmForm()
  Form(
    { parameters: { parameter_definitions: [PHONE_FIELD] } },
    formState(values),
    () => undefined,
    () => undefined,
  )
  return phoneProps
}

function findInput(node: VNodeStub | null): VNodeStub | undefined {
  if (!node || typeof node !== "object") return undefined
  if (node.tag === "input") return node
  return (node.children || [])
    .map(child => findInput(child as VNodeStub))
    .filter(Boolean)[0]
}

describe("form -> Phone prop wiring", () => {
  it("hands the stored phone state to the prop the field reads", () => {
    const props = renderForm({
      customerPhone: { dialing_code: "+48", number: "123123123" },
    })

    expect(props).toHaveLength(1)
    expect(props[0].value).toEqual({ dialing_code: "+48", number: "123123123" })
  })

  it("does not pass the phone state under any other prop name", () => {
    const props = renderForm({
      customerPhone: { dialing_code: "+48", number: "123123123" },
    })

    expect(props[0].number).toBeUndefined()
  })
})

describe("Phone field initialisation", () => {
  it("renders the prefilled dialing code and national number", () => {
    const { Phone } = loadApmPhone()
    const input = findInput(
      Phone({
        name: "customerPhone",
        dialing_codes: CODES,
        value: { dialing_code: "+48", number: "123123123" },
      }),
    )

    expect(input!.props.value).toBe("+48 123 123 123")
  })

  it("falls back to the default dialing code with no prefill", () => {
    const { Phone } = loadApmPhone()
    const input = findInput(
      Phone({ name: "customerPhone", dialing_codes: CODES }),
    )

    expect(input!.props.value).toBe("+44 ")
  })

  it("seeds the form with the wire shape, without the internal iso field", () => {
    const { Phone, emitted } = loadApmPhone()
    Phone({
      name: "customerPhone",
      dialing_codes: CODES,
      value: { dialing_code: "+48", number: "123123123" },
    })

    expect(emitted).toEqual([
      {
        key: "customerPhone",
        value: { dialing_code: "+48", number: "123123123" },
        isInitial: true,
      },
    ])
  })

  it("does not seed the form when there is nothing prefilled", () => {
    const { Phone, emitted } = loadApmPhone()
    Phone({ name: "customerPhone", dialing_codes: CODES })

    expect(emitted).toEqual([])
  })
})

describe("phone required validation", () => {
  it("rejects a phone holding only a dialing code", () => {
    const { ok, errors } = validate({
      customerPhone: { dialing_code: "+44", number: "" },
    })

    expect(ok).toBe(false)
    expect(errors.customerPhone).toBe("Missing required value")
  })

  it("accepts a phone with a national number", () => {
    const { ok } = validate({
      customerPhone: { dialing_code: "+48", number: "123123123" },
    })

    expect(ok).toBe(true)
  })

  it("still reads the pre-#225 `value` key", () => {
    const { ok } = validate({
      customerPhone: { dialing_code: "+48", value: "123123123" },
    })

    expect(ok).toBe(true)
  })
})
