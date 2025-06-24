module ProcessOut {
  // VNode represents a Virtual DOM node.
  export interface VNode<Type extends (Tag | '#text' | null) = Tag> {
    // 'type' is the HTML tag name, '#text' for text nodes, or null for DocumentFragment
    type: Type | '#text' | null ;
    // Props are conditionally typed: specific HTML props if 'Type' is an HTMLTag,
    // otherwise an empty object as text/fragments don't have standard HTML element props.
    props: Type extends Tag ? Props<Type> : object;
    // Children can be any VNode, using 'any' to avoid circular type definitions.
    children: VNode<any>[];
    // Reference to the actual live DOM element (set during patching)
    dom: Node | null;
    // Optional key for child reconciliation in lists
    key?: string | null;
    // Specific for text VNodes (stores the string content)
    value?: string;
  }

  // Props for an HTML element, allowing any extra properties but restricting 'style' and 'class'
  export type Props<T extends Tag> = Partial<HTMLElementTagNameMap[T]> & {
    style?: never; // Disallow direct style attribute (use Tailwind or separate CSS)
    class?: never; // Disallow direct class attribute (use className)
    ref?: T extends Tag ? (node: HTMLElementTagNameMap[T] | null) => void : never;
    key?: string; // Key for list reconciliation
    [key: string]: any; // Allow other arbitrary properties
  };

  export type Tag = typeof TAGS[number]; // Union type of all allowed tags

  export type Primitive = string | number | boolean;

  // Child represents any valid child type for a VNode (primitive or another VNode)
  export type Child = Primitive | VNode | null | undefined | Child[];

  // Defines allowed HTML tags
  const TAGS = [
    'div','span','p','h1','h2','h3','h4','h5','h6',
    'a','button','input','label', 'form',
    'ul','ol','li','img',
    'section','article','header','footer','nav','main',
    'pre','code','textarea','select','option',
  ] as const;


  // Function type for creating a DocumentFragment VNode
  type GenerateFragment = (...children: Child[]) => VNode;

  // Argument types for tag generation functions (either props + children, or just children)
  export type GenerateTagArgs<T extends Tag> = [childOrProps: Props<T> | Child, ...Child[]];

  // Overloaded function type for tag generation (e.g., div(props, ...) or div(...))
  export interface GenerateTag<T extends Tag> {
    (props: Props<T>, ...children: Child[]): VNode<T>;
    (...children: Child[]): VNode<T>;
  }

  // The public API interface for the ProcessOut module
  type VanLite = {
    fragment: GenerateFragment;// Index signature for dynamic tag functions
  } & { [K in Tag]: GenerateTag<K> };

  /**
   * Recursively flattens and processes children into an array of VNodes.
   * @param rawChildren - Raw children passed to a tag function.
   * @returns Processed children array.
   */
  function processChildren(rawChildren: Child[]): VNode[] {
    const children: VNode[] = [];

    for (let i = 0; i < rawChildren.length; i++) {
      const child = rawChildren[i];
      if (child == null || child === false) {
        // Skip null, undefined, false
        continue;
      }

      if (Array.isArray(child)) {
        // Flatten child arrays recursively
        children.push(...processChildren(child));
        continue;
      }

      if (typeof child === 'object' && child !== null && (typeof (child as VNode).type === 'string' || (child as VNode).type === null)) {
        // It's already a VNode, add directly
        children.push(child as VNode);
        continue;
      }

      // It's a primitive (string, number, boolean), convert to VNode for consistent handling
      children.push({ type: '#text', props: {}, children: [], dom: null, key: null, value: String(child) });
    }

    return children;
  }

  /**
   * Factory function that generates a function for creating a specific HTML element's Virtual DOM node.
   * This function DOES NOT create actual DOM elements. It creates a plain JS object (VNode).
   * @template T
   * @param tag - The HTML tag name (e.g., 'div', 'button').
   * @returns A function that creates a VNode of the specified tag.
   */
  function makeTag<T extends Tag>(tag: T): GenerateTag<T> {
    return ((...args: GenerateTagArgs<T>): VNode => {
      let props: Props<T> = {};
      let childrenArgs: Child[] = args as Child[];

      // Determine if the first argument is a props object
      if (isProps(args[0])) {
        props = args[0];
        childrenArgs = args.slice(1) as Child[];
      }

      // Create the Virtual DOM node object
      return {
        type: tag,
        props: props,
        children: processChildren(childrenArgs),
        dom: null, // This will hold a reference to the actual DOM node after patching
        key: props.key // Store key directly for easier access
      };
    }) as GenerateTag<T>; // Type assertion to match the overloaded interface
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

  api.fragment = (...children: Child[]): VNode => ({
    type: null,
    props: {},
    children: processChildren(children),
    dom: null,
    key: null
  });

  export const elements = api as VanLite;

  /**
   * A type guard to determine if the first argument to a tag function is a props object.
   */
  export function isProps<T extends Tag>(item: GenerateTagArgs<T>[0]): item is Props<T> {
    // A props object is a plain object, not a VNode (which has a 'type' property)
    return item && typeof item === 'object' && item.constructor === Object && !('children' in item);
  };

  /**
   * A helper used in custom elements to merge props defined in the custom element
   * with the props passed into it, handling class names and event listeners specially.
   * @template T
   * @param base - Base props.
   * @param user - User-provided props.
   * @returns Merged props.
   */
  export function mergeProps<T extends Tag>(base: Props<T>, user: Props<T> = {} as Props<T>): Props<T> {
    const out: Props<T> = { ...base, ...user };

    // Combine class names
    const classes = [
      base.className || (base as any).class, // Access 'class' if it was used
      user.className || (user as any).class,
    ].filter(Boolean);
    if (classes.length) (out as any).className = classes.join(" ");

    // Merge event handlers: calling both base and user handlers
    for (const k in base) {
      if (k.startsWith("on") && typeof base[k] === "function" && typeof user[k] === "function") {
        const b = base[k] as EventListener;
        const u = user[k] as EventListener;
        (out as any)[k] = function (this: any, ...args: any[]) {
          b.apply(this, args);
          u.apply(this, args);
        };
      }
    }
    return out;
  }
}
