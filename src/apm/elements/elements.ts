module ProcessOut {
  /**
   * Virtual DOM Node - The Core Data Structure
   * 
   * A VNode is a lightweight JavaScript object that represents what the DOM should look like.
   * It's like a blueprint that describes an element without actually creating it.
   * 
   * Examples:
   * • Text: { type: '#text', value: 'Hello' }
   * • Element: { type: 'div', props: { className: 'container' }, children: [...] }
   * • Fragment: { type: null, children: [...] } // Groups elements without wrapper
   */
  export interface VNode<Type extends (Tag | '#text' | null) = Tag> {
    type: Type | '#text' | null;           // What kind of element: 'div', '#text', or null for fragments
    props: Type extends Tag ? Props<Type> : object; // Element properties (className, onclick, etc.)
    children: VNode<any>[];                // Child elements (recursive structure)
    dom: Node | null;                      // Reference to actual DOM node (set during rendering)
    key?: string | null;                   // Unique identifier for efficient list updates
    value?: string;                        // Text content (only for text nodes)
  }

  /**
   * Type-Safe Props System
   * 
   * This ensures you can only use valid HTML properties for each element type.
   * For example, 'checked' only works on input elements, 'href' only on anchor tags.
   * 
   * Special handling:
   * • style/class are forbidden (use className and CSS-in-JS instead)
   * • ref provides direct DOM access when needed
   * • key enables efficient list rendering
   */
  export type Props<T extends Tag> = Omit<Partial<HTMLElementTagNameMap[T]>, 'style' | 'class'> & {
    style?: Partial<CSSStyleDeclaration>;
    class?: never;  // Use className instead for React compatibility
    ref?: (node: HTMLElementTagNameMap[T] | null) => void;
    key?: string;
    [key: string]: any;
  };

  export type Tag = typeof TAGS[number];
  export type Primitive = string | number | boolean;

  /**
   * Child Type System - Maximum Flexibility
   * 
   * Children can be anything that makes sense in JSX:
   * • Primitives: "Hello", 42, true
   * • VNodes: div(), span(), etc.
   * • Arrays: [item1, item2, item3]
   * • Null/undefined: conditional rendering
   * • Nested arrays: [[item1, item2], item3] (flattened automatically)
   */
  export type Child = Primitive | VNode | null | undefined | Child[];

  /**
   * Allowed HTML Elements
   * 
   * We only support a curated list of HTML elements to:
   * • Ensure type safety
   * • Prevent XSS attacks
   * • Keep bundle size reasonable
   * • Focus on common use cases
   */
  const TAGS = [
    'div','span','p', 'em', 'strong', 
    'h1','h2','h3','h4','h5','h6',
    'a','button','input','label', 'form',
    'ul','ol','li','img','picture','source',
    'section','article','header','footer','nav','main',
    'pre','code','textarea','select','option',
  ] as const;

  type GenerateFragment = (...children: Child[]) => VNode;
  export type GenerateTagArgs<T extends Tag> = [childOrProps: Props<T> | Child, ...Child[]];

  /**
   * Element Factory Function Interface
   * 
   * Each HTML element gets a function that can be called in two ways:
   * • div({ className: 'container' }, 'Hello')  // With props
   * • div('Hello', 'World')                     // Props-less
   */
  export interface GenerateTag<T extends Tag> {
    (props: Props<T>, ...children: Child[]): VNode<T>;
    (...children: Child[]): VNode<T>;
  }

  type VanLite = {
    fragment: GenerateFragment;
  } & { [K in Tag]: GenerateTag<K> };

  /**
   * Child Processor - The Flattening Algorithm
   * 
   * Takes any mix of children types and converts them to a flat array of VNodes.
   * This is where the magic happens that lets you write natural JSX-like code.
   * 
   * Transformations:
   * • "Hello" → { type: '#text', value: 'Hello' }
   * • [child1, child2] → [child1, child2] (flattened)
   * • null/undefined/false → (skipped)
   * • Already VNodes → (passed through)
   * 
   * Example: ['Hello', [span('World'), null], 42]
   * Result: [TextNode('Hello'), SpanNode('World'), TextNode('42')]
   */
  function processChildren(rawChildren: Child[]): VNode[] {
    const children: VNode[] = [];

    for (let i = 0; i < rawChildren.length; i++) {
      const child = rawChildren[i];
      
      // Skip falsy values (enables conditional rendering)
      if (child == null || child === false) {
        continue;
      }

      // Flatten nested arrays recursively
      if (Array.isArray(child)) {
        children.push(...processChildren(child));
        continue;
      }

      // Detect existing VNodes (objects with VNode structure)
      if (typeof child === 'object' && child !== null && 'type' in child && 'props' in child && 'children' in child) {
        const vnode = child as VNode;
        // Validate VNode type
        if (typeof vnode.type === 'string' || vnode.type === '#text' || vnode.type === null) {
          children.push(vnode);
          continue;
        }
      }

      // Convert primitives to text nodes
      children.push({ 
        type: '#text', 
        props: {}, 
        children: [], 
        dom: null, 
        key: null, 
        value: String(child) 
      });
    }

    return children;
  }

  /**
   * Element Factory Generator - The Core API Builder
   * 
   * This is the heart of the elements system. It creates the functions like div(), span(), etc.
   * Each function follows the same pattern but is customized for a specific HTML element.
   * 
   * The generated function:
   * 1. Figures out if first argument is props or a child
   * 2. Separates props from children
   * 3. Processes children into VNodes
   * 4. Returns a VNode object
   * 
   * Example: makeTag('button') creates a function that makes button VNodes
   */
  function makeTag<T extends Tag>(tag: T): GenerateTag<T> {
    return ((...args: GenerateTagArgs<T>): VNode => {
      let props: Props<T> = {} as Props<T>;
      let childrenArgs: Child[] = args as Child[];

      // Smart argument detection: is first arg props or children?
      if (isProps(args[0])) {
        props = args[0];
        childrenArgs = args.slice(1) as Child[];
      }

      // Extract key safely without mutating original props
      const { key, ...propsWithoutKey } = props;

      // Build the Virtual DOM node
      return {
        type: tag,
        props: propsWithoutKey,
        children: processChildren(childrenArgs),
        dom: null,
        key,
      };
    }) as GenerateTag<T>;
  };

  const api: Partial<VanLite> = {} as Partial<VanLite>;

  /**
   * API Generation - Building the Element Functions
   * 
   * This loop creates all the element functions: div(), span(), button(), etc.
   * Each function is a specialized version of makeTag() for that element type.
   * 
   * After this loop runs, you can call:
   * • elements.div() to create div VNodes
   * • elements.button() to create button VNodes
   * • etc.
   */
  for (let i = 0 as const; i < TAGS.length; i++) {
    const t = TAGS[i];
    (api as any)[t] = makeTag(t);
  }

  /**
   * Fragment Factory - Grouping Without Wrappers
   * 
   * Fragments let you group multiple elements without adding an extra DOM node.
   * Useful when you need to return multiple elements from a component.
   * 
   * Example:
   * fragment(
   *   h1('Title'),
   *   p('Description')
   * )
   * // Renders as: <h1>Title</h1><p>Description</p> (no wrapper div)
   */
  api.fragment = (...children: Child[]): VNode => ({
    type: null,
    props: {},
    children: processChildren(children),
    dom: null,
    key: null
  });

  export const elements = api as VanLite;

  /**
   * Props Detection - Smart Argument Parsing
   * 
   * Figures out if the first argument to an element function is a props object
   * or the first child. This enables both calling styles:
   * 
   * • div({ className: 'box' }, 'content')  // Props first
   * • div('content')                        // No props
   * 
   * The challenge: distinguish between props and VNode children
   * Solution: Props are plain objects, VNodes have specific properties
   */
  export function isProps<T extends Tag>(item: GenerateTagArgs<T>[0]): item is Props<T> {
    return item 
      && typeof item === 'object' 
      && item.constructor === Object 
      && !('children' in item);  // VNodes have 'children', props don't
  };

  /**
   * Advanced Props Merging - Component Composition
   * 
   * Used for building reusable components that can accept user props
   * while providing defaults. Handles tricky cases like event handlers
   * and CSS classes that need special merging logic.
   * 
   * Example:
   * const Button = (userProps) => {
   *   const baseProps = { className: 'btn', onclick: logClick };
   *   const merged = mergeProps(baseProps, userProps);
   *   return button(merged, 'Click me');
   * }
   * 
   * Smart merging:
   * • Classes: 'btn' + 'btn-primary' → 'btn btn-primary'
   * • Events: both base and user handlers are called
   * • Other props: user props override base props
   */
  export function mergeProps<T extends Tag>(base: Props<T>, user: Props<T> = {} as Props<T>): Props<T> {
    const out: Props<T> = { ...base, ...user };

    // Combine CSS classes intelligently
    const classes = [
      base.className || (base as any).class,
      user.className || (user as any).class,
    ].filter(Boolean);
    if (classes.length) (out as any).className = classes.join(" ");

    // Chain event handlers so both base and user handlers run
    for (const k in base) {
      if (k.startsWith("on") && typeof base[k] === "function" && typeof user[k] === "function") {
        const b = base[k] as EventListener;
        const u = user[k] as EventListener;
        (out as any)[k] = function (this: any, ...args: any[]) {
          b.apply(this, args);   // Base handler first
          u.apply(this, args);   // Then user handler
        };
      }
    }
    return out;
  }
}
