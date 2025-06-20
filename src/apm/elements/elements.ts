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
    'a','button','input','label',
    'ul','ol','li','img',
    'section','article','header','footer','nav','main',
    'pre','code','textarea','select','option',
  ] as const;

  export type Tag = typeof TAGS[number];
  export type GenerateFragment = (...children: Child[]) => DocumentFragment;

  export type GenerateTagArgs<K extends Tag> = [childOrProps: Props<HTMLElementTagNameMap[K]> | Child, ...Child[]]
  export interface GenerateTag<K extends Tag> {
    (props: Props<HTMLElementTagNameMap[K]>, ...children: Child[]): HTMLElementTagNameMap[K];
    (...children: Child[]): HTMLElementTagNameMap[K];
  }


  export type VanLite = {
    mount(parent: Element, child: Node): Element;
    fragment: GenerateFragment;
  } & { [K in Tag]: GenerateTag<K> };

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

  const appendChild = (target: Element | DocumentFragment, child: Child): void => {
    if (child == null || child === false) return;

    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) appendChild(target, child[i]);
      return;
    }
    target.append(child instanceof Node ? child
      : document.createTextNode(String(child)));
  };

  const makeFrag: GenerateFragment = (...children) => {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < children.length; i++) {
      appendChild(frag, children[i]);
    }
    return frag;
  };

  export const isProps = <K extends Tag>(item: GenerateTagArgs<K>[0]): item is Props<HTMLElementTagNameMap[K]> => {
    return item && typeof item === 'object' && item.constructor === Object && !('nodeType' in item)
  }

  const makeTag = <K extends Tag>(tag: K): GenerateTag<K>  => {
    return ((...args) => {
      const el = document.createElement(tag);

      let i = 0;
      const maybeProps = args[0];

      if (isProps(maybeProps)) {
        const props: Props = maybeProps;

        i = 1;

        for (const key in props) {
          if (!Object.prototype.hasOwnProperty.call(props, key)) {
            continue;
          }

          const value = props[key];
          if (value == null) {
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

  for (let i = 0 as const; i < TAGS.length; i++) {
    const t = TAGS[i];
    (api as any)[t] = makeTag(t);
  }
  api.fragment = makeFrag
  api.mount = (parent, child) => (parent.append(child), parent);

  export const elements = new Proxy(api, {
    get: (target, prop: string) =>
      prop in target ? (target as any)[prop] : makeTag(prop as Tag),
  }) as VanLite;
}
