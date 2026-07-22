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
 * `navigator` shim is injected so locale-dependent helpers can be exercised
 * deterministically — pass an explicit `navigator` whenever a helper reads
 * from it (the default is empty; e.g. `formatCurrency` would otherwise fall
 * back to the host machine's locale).
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
  const run = new Function(
    "module",
    "exports",
    "navigator",
    `${js}\nmodule.exports = ProcessOut;`,
  )
  run(moduleShim, moduleShim.exports, navigator)
  return moduleShim.exports
}
