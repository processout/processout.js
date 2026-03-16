/**
 * Test setup - loads ProcessOut from built dist for integration tests
 */
/* global ProcessOut */
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

// Load the built processout.js so ProcessOut is available globally
const __dirname = dirname(fileURLToPath(import.meta.url))
const processoutPath = join(__dirname, "../dist/processout.js")
try {
  const script = readFileSync(processoutPath, "utf8")
  // Run script and attach ProcessOut to global (eval creates isolated scope, so we append assignment)
  eval(script + "\n;(typeof globalThis !== 'undefined' && (globalThis.ProcessOut = ProcessOut));")
} catch (err) {
  // dist may not exist if build hasn't run - tests that need it will fail with a clear error
  if (process.env.DEBUG_TESTS) {
    console.warn("ProcessOut setup failed:", err)
  }
}
