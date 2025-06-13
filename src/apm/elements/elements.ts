module ProcessOut {
  export type Primitive = string | number | boolean;
  export type Child = Primitive | Node | null | undefined | Child[];

  export type Props<T extends HTMLElement = HTMLElement> =
    Partial<T> & {
    style?: never;
    class?: never;
    [key: string]: any;
  };

  export const TAGS = [
    'div','span','p','h1','h2','h3','h4','h5','h6',
    'a','button','input','label', 'form',
    'ul','ol','li','img',
    'section','article','header','footer','nav','main',
    'pre','code','textarea','select','option',
  ] as const;

  export type Tag = typeof TAGS[number];
  export type GenerateFragment = (...children: Child[]) => DocumentFragment;
  export type PropsElement<E extends HTMLElement> = E & { __props__: Props };

  export type GenerateTagArgs<K extends Tag> = [childOrProps: Props<HTMLElementTagNameMap[K]> | Child, ...Child[]]
  export interface GenerateTag<K extends Tag> {
    (props: Props<HTMLElementTagNameMap[K]>, ...children: Child[]): PropsElement<HTMLElementTagNameMap[K]>;
    (...children: Child[]): PropsElement<HTMLElementTagNameMap[K]>;
  }

  export type VanLite = {
    mount(parent: Element, child: Node): Element;
    fragment: GenerateFragment;
  } & { [K in Tag]: GenerateTag<K> };

  /**
   * A helper used in custom elements to merge props defined in the custom element with the props passed into it
   */
  export function mergeProps<T extends HTMLElement>(
    base: Props<T>,
    user: Props<T> = {}
  ): Props<T> {
    const out: any = { ...base, ...user };

    const classes = [
      base.className || base.class,
      user.className || user.class,
    ].filter(Boolean);
    if (classes.length) out.className = classes.join(" ");

    for (const k in base) {
      if (k.startsWith("on") && typeof base[k] === "function" && typeof user[k] === "function") {
        const b = base[k] as EventListener;
        const u = user[k] as EventListener;
        out[k] = function (this: any, ...args: any[]) {
          b.apply(this, args);
          u.apply(this, args);
        };
      }
    }

    return out;
  }

  /**
   * Appends a child or a list of children to a target DOM element.
   * It's a versatile helper that handles various types of children gracefully.
   */
  const appendChild = (target, child) => {
    if (child == null || child === false) return;
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) appendChild(target, child[i]);
      return;
    }
    target.append(child instanceof Node ? child : document.createTextNode(String(child)));
  };

  /**
   * Creates a DocumentFragment and appends all provided children to it.
   */
  const makeFrag: GenerateFragment = (...children) => {
    // A DocumentFragment is a minimal, lightweight DOM container that isn't part of the main document tree.
    // You can perform multiple operations on it (like appending many children) without triggering
    // a browser reflow/repaint for each one. When you append the single fragment to the main DOM,
    // all its children are added in one efficient operation.
    const frag = document.createDocumentFragment();
    for (let i = 0; i < children.length; i++) {
      appendChild(frag, children[i]);
    }
    return frag;
  };

  /**
   * A type guard to determine if the first argument to a tag function is a props object.
   */
  export const isProps = <K extends Tag>(item: GenerateTagArgs<K>[0]): item is Props<HTMLElementTagNameMap[K]> => {
    // The tag functions are "overloaded" and can be called
    // in two ways: `tag(props, ...children)` or `tag(...children)`. This function is the
    // mechanism that reliably distinguishes between a props object and a child node.
    return item && typeof item === 'object' && item.constructor === Object && !('nodeType' in item)
  }

  /**
   * A factory function that generates a function for creating a specific HTML element.
   */
  const makeTag = <K extends Tag>(tag: K): GenerateTag<K>  => {
    return ((...args) => {
      const el = document.createElement(tag) as PropsElement<HTMLElementTagNameMap[K]>;

      let i = 0;
      const maybeProps = args[0];

      if (isProps(maybeProps)) {
        const props: Props = maybeProps;

        i = 1;

        // This is the key to enabling "smart" DOM patching for re-renders.
        // A live DOM element doesn't expose all the information used to create it
        // (like event handler functions). By "tagging" the element with its original
        // props, we give our patching algorithm a reliable "source of truth" to
        // compare against during state updates, allowing it to correctly update,
        // add, or remove event listeners and properties.
        el.__props__ = props;

        for (const key in props) {
          if (!Object.prototype.hasOwnProperty.call(props, key)) {
            continue;
          }

          const value = props[key];

          if (value === null || value === undefined) {
            continue;
          }

          const isEventHandler = key.startsWith('on') && typeof value === 'function';
          const attributeExists = key in el;

          switch (true) {
            case isEventHandler: {
              el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
              break;
            }
            case attributeExists: {
              el[key] = value;
              break;
            }
            default: {
              el.setAttribute(key, String(value));
              break;
            }
          }
        }
      }

      for (; i < args.length; i++) {
        appendChild(el, args[i] as Child);
      }

      return el;
    }) satisfies GenerateTag<K>;
  };

  const api: Partial<VanLite> = {} as Partial<VanLite>;

  /**
   * This loop iterates through all the HTML tags that we allow, as defined in the `TAGS`
   * array. For each tag, it calls the `makeTag` factory to create an
   * element-generating function (e.g., a function for creating `<div>`s).
   */
  for (let i = 0 as const; i < TAGS.length; i++) {
    const t = TAGS[i];
    (api as any)[t] = makeTag(t);
  }

  api.fragment = makeFrag
  api.mount = (parent, child) => (parent.append(child), parent);

  export const elements = api as VanLite;
}
