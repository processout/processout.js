import { vi } from "vitest"

/**
 * Get ProcessOut from global scope (loaded by test/setup.ts from dist/processout.js)
 */
export function getProcessOut() {
  return (globalThis as any).ProcessOut
}

/**
 * Check if ProcessOut is loaded and skip test if not
 */
export function requireProcessOut() {
  const ProcessOut = getProcessOut()
  if (!ProcessOut) {
    console.warn("ProcessOut not loaded - run 'yarn build' first")
    return null
  }
  return ProcessOut
}

export type MockProcessOutOverrides = {
  getProjectID?: () => string
  getProcessOutFieldEndpoint?: (query: string) => string
  telemetryClient?: { reportError: ReturnType<typeof vi.fn> }
}

/**
 * Create a mock ProcessOut instance for testing
 */
export function createMockProcessOut(
  overrides: MockProcessOutOverrides = {}
): any {
  return {
    getProjectID: () => "test-proj_xxx",
    getProcessOutFieldEndpoint: (query: string) =>
      `https://example.processout.com/field${query}`,
    telemetryClient: {
      reportError: vi.fn(),
    },
    ...overrides,
  }
}

/**
 * Create a mock CardForm for testing
 */
export function createMockForm(overrides: { getUID?: () => string } = {}): any {
  return {
    getUID: () => "form-123",
    ...overrides,
  }
}

export function attachElement(tag: string, element: HTMLElement, originalCreateElement: typeof document.createElement) {
  document.createElement = vi.fn((tagName: string) => {
    if (tagName.toLowerCase() === tag.toLowerCase()) {
      return element
    }
    return originalCreateElement(tagName)
  }) as any
}

type CreateIframeOptions =
  | { throws: string; responds?: never }
  | { throws?: never; responds: (message: string) => string | void }

/**
 * Create an iframe mock for testing.
 * - throws: iframe throws when contentWindow is accessed
 * - responds: postMessage handler that receives the request and returns the response to dispatch.
 *   The handler is called when the parent sends a message; return a JSON string to dispatch as the iframe's response.
 */
export function createIframe(options: CreateIframeOptions) {
  const iframe = document.createElement("iframe")
  Object.defineProperty(iframe, "contentWindow", {
    get: () => {
      if (options.throws) {
        throw new Error(options.throws)
      }
      if (options.responds) {
        return {
          postMessage: (message: string) => {
            const response = options.responds!(message)
            if (response) {
              setTimeout(() => {
                window.dispatchEvent(
                  new MessageEvent("message", { data: response, origin: "*" })
                )
              }, 0)
            }
          },
        }
      }
      throw new Error("Invalid iframe options: provide throws or responds")
    },
    configurable: true,
  })
  return iframe
}
