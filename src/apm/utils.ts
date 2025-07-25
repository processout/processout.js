module ProcessOut {

  export type PlainObject = object;
  export const SECOND_1 = 1000;
  export const MIN_1 = SECOND_1 * 60;
  export const MIN_15 = MIN_1 * 15;
  
  export function formatCurrency(amount: string, currencyCode: string) {
    const formatter = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currencyCode
    });

    return formatter.format(parseFloat(amount));
  }

  /**
   * Simple hash function for content comparison (djb2 algorithm)
   * @param str - String to hash
   * @returns Short hash string in base36 format
   */
  export function simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // Convert to base36 for shorter string
  }

  function dedent(strings: TemplateStringsArray, ...values: unknown[]): string {
    const raw = String.raw(strings, ...values);            // untouched text
    const match = raw.match(/^[ \t]*(?=\S)/m);
    let indent;
    if (match) {
      indent = match[0].length;
    } else {
      indent = 0;
    }
    const pattern = new RegExp(`^[ \\t]{0,${indent}}`, 'gm');
    return raw.replace(pattern, '').trim();                // strip & trim
  }

  export function isPlainObject(value: unknown): value is PlainObject {
    // must be an object (and not null) …
    if (value === null || typeof value !== "object") return false;

    // … with either no prototype or the base Object prototype
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
  }

  export const isEmpty = (value: Record<string, unknown> | Array<any>): boolean => {
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return Object.keys(value).length === 0;
  }

  export const isDeepEqual = (a: any, b: any): boolean => {
    // This is a crucial performance optimization. If the two values are the
    // exact same instance (or are identical primitives), we can immediately
    // return true without any further checks.
    if (a === b) return true;

    // If either value is not an object (or is null), they can't be deeply
    // equal unless they were strictly equal, which is handled by the check above.
    // This prevents errors from trying to get keys from null or primitives.
    if (a == null || typeof a !== 'object' || b == null || typeof b !== 'object') {
      return false;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      // We must recursively check each item in the array. If any pair of
      // elements at the same index is not deeply equal, the arrays are not equal.
      for (let i = 0; i < a.length; i++) {
        if (!isDeepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (a instanceof Object && b instanceof Object) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      // We iterate through all keys of one object. For each key, we check if
      // the other object has the same key and if the values for that key are also
      // deeply equal. This ensures all properties match.
      for (const key of keysA) {
        if (!keysB.some(item => item === key) || !isDeepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  export function createReadonlyProxy<T extends object>(obj: T, path: Array<PropertyKey> = []): DeepReadonly<T> {
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (value && typeof value === 'object') {
          return createReadonlyProxy(value, path.concat(prop));
        }
        return value;
      },
      set(_, prop, __) {
        throw new UpdatedReadOnly(String(path.concat(prop).join('.')))
      },
    };

    return new Proxy(obj, handler) as DeepReadonly<T>;
  }

  export function createErrorHandlingProxy<T extends object>(
    instance: T,
    errorHandler: (error: any) => void
  ): T {
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        // `target` is the original object.
        // `receiver` is the proxy itself.
        const originalValue = Reflect.get(target, prop);
        // If the property is a function, we return our wrapper.
        if (typeof originalValue === 'function') {
          return function(...args: any[]) {
            try {
              return originalValue.apply(receiver, args);
            } catch (error) {
              errorHandler(error);
            }
          };
        }

        // For non-function properties, return the value as is.
        return originalValue;
      }
    };

    return new Proxy(instance, handler);
  }

  export function injectStyleTag(root: Document | ShadowRoot, rules: string) {
    // Defensive check for ShadowRoot support
    const isShadowRoot = typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot;
    const isIframe = !isShadowRoot && (root as Document).baseURI !== (root as Document).documentURI

    // Replace gap with compatible alternatives for older browsers
    const compatibleRules = replaceGapWithCompatibleCSS(rules);

    if (!isIframe) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(compatibleRules);

      try {
        const current = root.adoptedStyleSheets;
        const sheetAlreadyExist = current.some(function (old) {
          return JSON.stringify(old.cssRules) === JSON.stringify(sheet.cssRules)
        })

        if (!sheetAlreadyExist) {
          (root as any).adoptedStyleSheets = [...current, sheet];
        }
              } catch (err) {
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            const styleEl = document.createElement('style');
            styleEl.textContent = compatibleRules;
            let host;
            if (isShadowRoot) {
              host = root;
            } else {
              host = (root as Document).head;
            }
            host.appendChild(styleEl);
          } else {
            throw err;
          }
        }
      } else {
        const current = (root as Document).head.getElementsByTagName('style')

        for (let i = 0; i < current.length; i++) {
          const style = current.item(i);

          if (compatibleRules === style.innerText) {
            return;
          }
        }

        const styleEl = (root as Document).createElement('style');
        styleEl.textContent = compatibleRules;
        let host;
        if (isShadowRoot) {
          host = root;
        } else {
          host = (root as Document).head;
        }
        host.appendChild(styleEl);
      }
  }

  export type CSSText = string & { readonly __brand: 'CSSText' };

  export function css(strings: TemplateStringsArray, ...exprs: Array<string | (() => string | number)>): () => CSSText {
    return function evaluateCSS(this: any) {
      return dedent`${strings
        .map((str, i) => {
          const expr = exprs[i];
          let value;
          if (typeof expr === 'function') {
            value = expr.call(this);
          } else {
            value = expr || '';
          }
          return str + value;
        })
        .join('')}` as CSSText
    }
  }

  /**
   * Generate a unique ID for non-security-critical purposes (component IDs, DOM elements, etc.)
   * This uses Math.random() which is acceptable for UI/component identification
   * @param prefix - Optional prefix for the ID
   * @returns A unique string ID
   */
  export function generateUniqueId(prefix = 'id'): string {
    // CodeQL: This function is used for component ID generation, not security purposes
    // nosemgrep: javascript.security.audit.crypto-weak-random
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Replace gap-x and gap-y properties with compatible alternatives for older browsers
   * @param css - The CSS string to process
   * @returns CSS with gap-x/gap-y replaced by margin-based alternatives
   */
  export function replaceGapWithCompatibleCSS(css: string): string {
    let result = css;
    const gapReplacements: string[] = [];

    // Regex to find rules with gap-x or gap-y
    const gapXRegex = /([^{}]+)\s*\{[^}]*gap-x:\s*([^;]+);[^}]*\}/g;
    const gapYRegex = /([^{}]+)\s*\{[^}]*gap-y:\s*([^;]+);[^}]*\}/g;

    // Handle gap-x
    let match;
    while ((match = gapXRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const gapValue = match[2].trim();
      const replacementRule = `${selector} > * + * {\n  margin-left: ${gapValue};\n}`;
      gapReplacements.push(replacementRule);
      // Remove gap-x from the rule
      result = result.replace(match[0], match[0].replace(/gap-x:\s*[^;]+;/, ''));
    }

    // Handle gap-y
    while ((match = gapYRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const gapValue = match[2].trim();
      const replacementRule = `${selector} > * + * {\n  margin-top: ${gapValue};\n}`;
      gapReplacements.push(replacementRule);
      // Remove gap-y from the rule
      result = result.replace(match[0], match[0].replace(/gap-y:\s*[^;]+;/, ''));
    }

    // Add vendor prefixes for appearance property
    result = result.replace(/appearance:\s*none;/g, `
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    `);

    // Add all replacement rules at the end
    if (gapReplacements.length > 0) {
      result += '\n/* Gap-x/y replacements for older browsers */\n' + gapReplacements.join('\n');
    }

    return result;
  }

  /**
    * Scrolls to the first element matching the selector, with a 20px offset above it
    * This function handles different embedding scenarios:
    * - If in an iframe: scrolls the iframe to the element
    * - If in shadow DOM: finds the nearest scrollable parent and scrolls it
    * - If in regular document: scrolls the document to the element
    * @param selector - Optional CSS selector to find the target element. Defaults to error field selectors
    */

  export function scrollTo(selectorOrOffset?: string | number, offset?: number): void {
  try {
    // Get the current context from the page
    const currentRoot = ContextImpl.context.page['currentRoot'];
    
    // Check for Shadow DOM support before using ShadowRoot
    const hasShadowDOM = typeof ShadowRoot !== 'undefined';
    
    if (typeof selectorOrOffset === 'number') {
      scrollToTop(currentRoot, selectorOrOffset);
      return;
    }

    const targetElement = findFirstElement(currentRoot, selectorOrOffset);
    
    if (!targetElement) {
      scrollToTop(currentRoot, offset || 0);
      return;
    }
    
    scrollToElement(targetElement, currentRoot, offset);
  } catch (error) {
    console.error('Error in scrollTo:', error);
    // If anything fails, fallback to document scroll
    window.scrollTo(0, 0);
  }
}

  /**
 * Finds the first element matching the selector in the current context
 */
function findFirstElement(currentRoot: Document | ShadowRoot | null, selector: string): Element | null {
  if (!currentRoot) {
    // Search in main document
    return document.querySelector(selector);
  }

  // Search in the current context (iframe document or shadow DOM)
  return currentRoot.querySelector(selector);
}

  /**
   * Scrolls to a specific element with offset
   */
  function scrollToElement(element: Element, currentRoot: Document | ShadowRoot | null, offset: number = 0): void {
    if (!element) {
      scrollToTop(currentRoot, offset);
      return;
    }
    
    if (currentRoot instanceof Document) {
      // Iframe context - use direct calculation like before
      const iframeWindow = currentRoot.defaultView;
      if (iframeWindow) {
        const elementRect = element.getBoundingClientRect();
        const finalScrollTop = elementRect.top + (iframeWindow.pageYOffset || iframeWindow.scrollY) - offset;
        iframeWindow.scrollTo(0, finalScrollTop);
      } else {
        // Fallback to document scroll
        const rect = element.getBoundingClientRect();
        const scrollTop = rect.top + (window.pageYOffset || window.scrollY) - offset;
        window.scrollTo(0, scrollTop);
      }
      return;
    }

    // Check for Shadow DOM support before using ShadowRoot
    if (typeof ShadowRoot !== 'undefined' && currentRoot instanceof ShadowRoot) {
      // Shadow DOM context - use direct calculation like iframe
      const scrollableElement = findNearestScrollableElement(currentRoot.host);
      if (scrollableElement) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollableElement.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const finalScrollTop = relativeTop - offset;
        scrollableElement.scrollTop = finalScrollTop;
        return;
      }
      
      // If no scrollable element found in shadow DOM, try the host element
      if (currentRoot.host.scrollTop !== undefined) {
        const elementRect = element.getBoundingClientRect();
        const hostRect = currentRoot.host.getBoundingClientRect();
        const relativeTop = elementRect.top - hostRect.top;
        const finalScrollTop = relativeTop - offset;
        currentRoot.host.scrollTop = finalScrollTop;
        return;
      }
    }

    // Regular document context - use direct calculation
    const rect = element.getBoundingClientRect();
    const scrollTop = rect.top + (window.pageYOffset || window.scrollY) - offset;
    window.scrollTo(0, scrollTop);
  }

  /**
    * Fallback function to scroll to top when no error field is found
    */
  function scrollToTop(currentRoot: Document | ShadowRoot | null, offset: number = 0): void {
    if (!currentRoot) {
      // Fallback to document
      window.scrollTo(0, offset);
      return;
    }

    // Check if we're in an iframe (currentRoot is a Document)
    if (currentRoot instanceof Document) {
      // We're in an iframe - scroll the iframe's window
      const iframeWindow = currentRoot.defaultView;
      if (iframeWindow) {
        iframeWindow.scrollTo(0, offset);
      }
      return;
    }

    // Check if we're in a Shadow DOM (currentRoot is a ShadowRoot)
    if (typeof ShadowRoot !== 'undefined' && currentRoot instanceof ShadowRoot) {
      // Find the nearest scrollable element in the shadow DOM
      const scrollableElement = findNearestScrollableElement(currentRoot.host);
      if (scrollableElement) {
        scrollableElement.scrollTop = offset;
        return;
      }
      
      // If no scrollable element found in shadow DOM, try the host element
      if (currentRoot.host.scrollTop !== undefined) {
        currentRoot.host.scrollTop = offset;
        return;
      }
    }

    // Fallback to document scroll
    window.scrollTo(0, offset);
  }

  /**
  * Gets the current scroll position for the given context
   * @param currentRoot - The current context (Document, ShadowRoot, or null)
   * @returns The current scroll position
   */
  export function getScrollPosition(currentRoot: Document | ShadowRoot | null): number {
    if (currentRoot instanceof Document) {
      // Iframe context
      const iframeWindow = currentRoot.defaultView;
      if (iframeWindow) {
        return iframeWindow.pageYOffset || iframeWindow.scrollY;
      }
    }

      if (typeof ShadowRoot !== 'undefined' && currentRoot instanceof ShadowRoot) {
    // Shadow DOM context - find the scrollable container
    const scrollableElement = findNearestScrollableElement(currentRoot.host);
    if (scrollableElement) {
      return scrollableElement.scrollTop;
    }
    
    // If no scrollable element found in shadow DOM, try the host element
    if (currentRoot.host.scrollTop !== undefined) {
      return currentRoot.host.scrollTop;
    }
  }

    // Regular document context
    return window.pageYOffset || window.scrollY;
  }

/**
 * Finds the nearest scrollable parent element
 * @param element - The starting element
 * @returns The nearest scrollable element or null if none found
 */
function findNearestScrollableElement(element: Element): Element | null {
  if (!element) return null;

  // Check if the current element is scrollable
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  
  if (overflowY === 'auto' || overflowY === 'scroll' || 
      overflowX === 'auto' || overflowX === 'scroll') {
    return element;
  }

  // Check if element has scrollTop property and it's not 0
  if (element.scrollTop !== undefined && element.scrollTop > 0) {
    return element;
  }

  // Check parent element
  const parent = element.parentElement;
  if (parent) {
    return findNearestScrollableElement(parent);
  }

  return null;
}
}
