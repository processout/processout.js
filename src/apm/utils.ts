module ProcessOut {
  type PlainObject = Record<PropertyKey, unknown>;

  function dedent(strings: TemplateStringsArray, ...values: unknown[]) {
    const raw = String.raw(strings, ...values);            // untouched text
    const indent = raw.match(/^[ \t]*(?=\S)/m)[0].length;  // leading spaces of first non-blank line
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
}
