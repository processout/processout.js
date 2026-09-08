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
