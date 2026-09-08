import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import * as ts from "typescript"

/**
 * The SDK sources use the TypeScript internal-namespace style
 * (`module ProcessOut { export function ... }`) and are shipped as a single
 * global bundle via `tsc --outFile`. That means they expose nothing to ES
 * module `import`, so we cannot import the helpers directly.
 *
 * Instead, we transpile the real source file and evaluate it in an isolated
 * function scope, returning the resulting `ProcessOut` namespace object. A
 * `navigator` implementation is injected so locale-dependent helpers are
 * deterministic regardless of the machine running the tests.
 *
 * This exercises the exact source that ships — no re-implementation, no
 * test-only hooks baked into the production files.
 */

const compiledCache = new Map<string, string>()

function compile(relativePath: string): string {
  const absolute = resolve(process.cwd(), relativePath)
  if (!compiledCache.has(absolute)) {
    const source = readFileSync(absolute, "utf8")
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    })
    compiledCache.set(absolute, outputText)
  }
  return compiledCache.get(absolute)!
}

export interface FakeNavigator {
  language?: string
  languages?: string[]
  userLanguage?: string
}

/**
 * Load `src/apm/utils.ts` and return its `ProcessOut` namespace, with the
 * given `navigator` shim visible to the module's code.
 */
export function loadApmUtils(navigator: FakeNavigator = {}): Record<string, any> {
  const js = compile("src/apm/utils.ts")
  const moduleShim = { exports: {} as Record<string, any> }
  const run = new Function("module", "exports", "navigator", `${js}\nmodule.exports = ProcessOut;`)
  run(moduleShim, moduleShim.exports, navigator)
  return moduleShim.exports
}

export const LOCALES = [
  "ar",
  "de",
  "en",
  "es",
  "fi",
  "fr",
  "it",
  "ja",
  "ko",
  "nb",
  "pl",
  "pt",
  "ta",
  "vi",
]

export interface CapturedEvent {
  type: string
  detail: any
}

export interface DynamicCheckoutNamespace {
  namespace: Record<string, any>
  dispatchedEvents: CapturedEvent[]
}

/**
 * Load the Dynamic Checkout locale/config/event helpers and return the resulting
 * `ProcessOut` namespace, plus the list of events the code dispatched.
 *
 * Each file is transpiled in isolation, so cross-file references (a locale const
 * used by `Translations`, `Translations` used by `getStatusMessage`) compile to
 * bare identifiers rather than `ProcessOut.x`. The bridge lines below re-expose
 * the namespace members under those names, in the same order the real
 * `tsc --outFile` bundle concatenates them.
 */
export function loadDynamicCheckout(): DynamicCheckoutNamespace {
  const chunks = [
    ...LOCALES.map(locale => compile(`src/dynamic-checkout/locales/${locale}.ts`)),
    `const { ${LOCALES.join(", ")} } = ProcessOut;`,
    compile("src/dynamic-checkout/utils/translations.ts"),
    `const { Translations } = ProcessOut;`,
    compile("src/dynamic-checkout/utils/status-messages.ts"),
    compile("src/dynamic-checkout/config/payment-config.ts"),
    compile("src/dynamic-checkout/utils/events.ts"),
  ]

  const dispatchedEvents: CapturedEvent[] = []

  function FakeCustomEvent(this: any, type: string, init: any) {
    this.type = type
    this.detail = init ? init.detail : undefined
  }

  const windowShim = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent: (event: CapturedEvent) => {
      dispatchedEvents.push(event)
      return true
    },
  }

  const moduleShim = { exports: {} as Record<string, any> }
  const run = new Function(
    "module",
    "exports",
    "window",
    "CustomEvent",
    `${chunks.join("\n")}\nmodule.exports = ProcessOut;`,
  )
  run(moduleShim, moduleShim.exports, windowShim, FakeCustomEvent)

  return { namespace: moduleShim.exports, dispatchedEvents }
}

export interface VNodeStub {
  tag: string
  props: Record<string, any>
  children: any[]
}

function elementsStub(): Record<string, any> {
  const tags = ["div", "label", "form", "input", "select", "option", "img", "span"]
  const stub: Record<string, any> = {}
  tags.forEach(tag => {
    stub[tag] = (props: any = {}, ...children: any[]): VNodeStub => ({ tag, props, children })
  })
  return stub
}

export interface ApmFormHarness {
  Form: (...args: any[]) => VNodeStub
  validateForm: (state: any, setState: (fn: (prev: any) => any) => void) => boolean
  phoneProps: Array<Record<string, any>>
}

/**
 * Load `src/apm/views/utils/form.ts` with its field components stubbed, so a
 * test can assert which props a field type is actually handed. Guards the
 * prop-name contract between the form and the components: `Props<T>` carries an
 * `[key: string]: any` index signature, so a misnamed prop typechecks and is
 * silently swallowed into the element's attributes (see #277).
 */
export function loadApmForm(): ApmFormHarness {
  const phoneProps: Array<Record<string, any>> = []
  const componentStub = () => ({ tag: "stub", props: {}, children: [] })

  const scope: Record<string, any> = {
    elements: elementsStub(),
    Phone: (props: Record<string, any>) => {
      phoneProps.push(props)
      return componentStub()
    },
    OTP: componentStub,
    Select: componentStub,
    Checkbox: componentStub,
    Input: componentStub,
    isPlainObject: (v: unknown) =>
      v !== null && typeof v === "object" && !Array.isArray(v),
    isEmpty: (v: any) => Object.keys(v).length === 0,
    createGroupedElements: (items: any[], _group: any, render: (item: any) => any) =>
      items.map(render),
    ContextImpl: { context: { events: { emit: () => undefined } } },
    // Only reached on the validation-failure path, to scroll to the first error.
    requestAnimationFrame: () => 0,
    scrollTo: () => undefined,
  }

  const names = Object.keys(scope)
  const moduleShim = { exports: {} as Record<string, any> }
  const run = new Function(
    "module",
    "exports",
    ...names,
    `${compile("src/apm/views/utils/form.ts")}\nmodule.exports = ProcessOut;`,
  )
  run(moduleShim, moduleShim.exports, ...names.map(n => scope[n]))

  return {
    Form: moduleShim.exports.Form,
    validateForm: moduleShim.exports.validateForm,
    phoneProps,
  }
}

export interface ApmPhoneHarness {
  Phone: (props: Record<string, any>) => VNodeStub | null
  emitted: Array<{ key: string; value: any; isInitial?: boolean }>
}

/**
 * Load `src/apm/elements/phone.ts` with a synchronous `loadScript` and a
 * pass-through component state, and record what the field emits back to the
 * form on initialisation.
 */
export function loadApmPhone(navigator: FakeNavigator = { language: "en-GB" }): ApmPhoneHarness {
  const emitted: Array<{ key: string; value: any; isInitial?: boolean }> = []

  const scope: Record<string, any> = {
    elements: elementsStub(),
    navigator,
    // No libphonenumber: the field falls back to its manual region lookup.
    window: {},
    useComponentState: (initial: Record<string, any>) => ({
      state: initial,
      setState: () => undefined,
    }),
    getDefaultDialingCode: (codes: Array<{ value: string }>) =>
      (codes && codes[0] && codes[0].value) || "",
    ContextImpl: {
      context: { page: { loadScript: (_n: string, _u: string, cb: () => void) => cb() } },
    },
  }

  const names = Object.keys(scope)
  const moduleShim = { exports: {} as Record<string, any> }
  const run = new Function(
    "module",
    "exports",
    ...names,
    `${compile("src/apm/elements/phone.ts")}\nmodule.exports = ProcessOut;`,
  )
  run(moduleShim, moduleShim.exports, ...names.map(n => scope[n]))

  const Phone = (props: Record<string, any>) =>
    moduleShim.exports.Phone({
      ...props,
      oninput: (key: string, value: any, isInitial?: boolean) =>
        emitted.push({ key, value, isInitial }),
    })

  return { Phone, emitted }
}
