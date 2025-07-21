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
    const indent = match ? match[0].length : 0;            // handle empty strings
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
    const isIframe = !(root instanceof ShadowRoot) && root.baseURI !== root.documentURI

    if (!isIframe) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(rules);

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
          styleEl.textContent = rules;
          const host = root instanceof ShadowRoot ? root : root.head;
          host.appendChild(styleEl);
        } else {
          throw err;
        }
      }
    } else {
      const current = root.head.getElementsByTagName('style')

      for (let i = 0; i < current.length; i++) {
        const style = current.item(i);

        if (rules === style.innerText) {
          return;
        }
      }

      const styleEl = root.createElement('style');
      styleEl.textContent = rules;
      const host = root instanceof ShadowRoot ? root : root.head;
      host.appendChild(styleEl);
    }
  }

  export type CSSText = string & { readonly __brand: 'CSSText' };

  export function css(strings: TemplateStringsArray, ...exprs: Array<string | (() => string | number)>): () => CSSText {
    return function evaluateCSS(this: any) {
      return dedent`${strings
        .map((str, i) => {
          const expr = exprs[i];
          const value = typeof expr === 'function' ? expr.call(this) : expr ?? '';
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
}
