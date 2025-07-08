module ProcessOut {
  export interface APMView<P = unknown> {
    mount(): void
    unmount(): void
  }

  export type APMViewConstructor<P = unknown> = new(container: Element, shadow: ShadowRoot | Document, props?: P) => APMView<P>
  export type ExtractViewProps<T extends APMViewConstructor> =
    T extends APMViewConstructor<infer P> ? P : never;

  export type SetState<S> = (state: S | ((prevState: DeepReadonly<S>) => S)) => void

  /**
   * APMViewImpl - The Virtual DOM Engine
   * 
   * This is the core of the UI system. It provides:
   * • State-driven rendering with automatic batching
   * • Virtual DOM with efficient diffing and patching
   * • Isolated styling via Shadow DOM/iframe
   * • Component lifecycle management
   * • Error boundaries and debugging
   * 
   * Flow: mount() -> render() -> patch DOM -> apply refs -> setState() -> batch updates -> render() -> patch DOM -> apply refs
   */
  export class APMViewImpl<P extends object = object, S extends PlainObject = Record<string, any>> implements APMView<P> {
    readonly container: Element;
    readonly shadow: ShadowRoot | Document;
    protected props: P;
    protected styles?: (() => CSSText);

    // State is always readonly to prevent direct mutations
    protected state: DeepReadonly<S>;

    // Virtual DOM state - tracks what's currently rendered
    private _currentVDom: VNode | null = null;
    
    // Update batching system - all setState calls are queued and processed together
    private _pendingStateUpdates: Array<S | ((prevState: DeepReadonly<S>) => S)> = [];
    private _isUpdateScheduled: boolean = false;

    constructor(container: Element, shadow: ShadowRoot | Document, props: P) {
      this.container = container;
      this.shadow = shadow;
      this.props = props;
      this.state = {} as DeepReadonly<S>;

      // Wrap the entire instance in error handling - catches all method calls
      return createErrorHandlingProxy(this, this._handleRuntimeError.bind(this));
    }

    /**
     * setState - React-style State Management
     * 
     * Queues state updates to be processed in the next animation frame.
     * Multiple calls are batched together for performance.
     * 
     * @param state - New state object or function that receives previous state
     */
    protected setState(state: S | ((prevState: DeepReadonly<S>) => S)): void {
      // Queue all updates in call order (functional and object updates mixed)
      this._pendingStateUpdates.push(state);

      // Schedule processing if not already scheduled (batching)
      if (!this._isUpdateScheduled) {
        this._isUpdateScheduled = true;
        requestAnimationFrame(() => this._processUpdateBatch());
      }
    }

    protected componentDidMount(): void {
    }

    protected componentWillUnmount(): void {
    }

    /**
     * Force Update - Immediate Re-render
     * 
     * Triggers an immediate re-render without state changes.
     * Used by stateful elements to update the parent view.
     */
    public forceUpdate(): void {
      if (!this._isUpdateScheduled) {
        this._isUpdateScheduled = true;
        requestAnimationFrame(() => this._processUpdateBatch());
      }
    }

    /**
     * State Update Processor - The React Reconciliation Loop
     * 
     * This is where the magic happens:
     * 1. Apply all queued state updates sequentially
     * 2. Skip render if state didn't actually change (optimization)
     * 3. Generate new Virtual DOM tree
     * 4. Patch real DOM to match Virtual DOM (minimal changes)
     * 5. Update refs and styles
     */
    private _processUpdateBatch(): void {
      this._isUpdateScheduled = false;

      if (this._pendingStateUpdates.length === 0) {
        return;
      }

      // Apply all state updates in the exact order they were called
      let newState = { ...this.state as S };

      for (const update of this._pendingStateUpdates) {
        if (typeof update === 'function') {
          // Functional update: newState = prevState => newState
          newState = update(createReadonlyProxy(newState));
        } else {
          // Object update: newState = { ...prevState, ...update }
          newState = { ...newState, ...update };
        }
      }

      this._pendingStateUpdates = [];
      const prevState = this.state;

      // Performance optimization: skip expensive DOM operations if nothing changed
      if (isDeepEqual(prevState, newState)) {
        return;
      }

      this.state = createReadonlyProxy(newState);
      this._applyStyles();

      // Generate new Virtual DOM tree based on new state
      const newVDom = this.render.call(this);

      // The heart of the system: patch real DOM to match Virtual DOM
      this._patch(this.container, newVDom, this._currentVDom, this.container.firstChild);

      this._currentVDom = newVDom;
    }

    /**
     * Component Mount - Initial Render
     * 
     * Sets up the component and performs the first render.
     * Uses the same patching system as updates for consistency.
     */
    public mount(): void {
      if (this.state) {
        this.state = createReadonlyProxy(this.state as S);
      }

      this._applyStyles();
      const initialVDom = this.render.call(this);

      this._patch(this.container, initialVDom, null, this.container.firstChild);

      this._currentVDom = initialVDom;

      this.componentDidMount();
    }

    public unmount(): void {
      this.componentWillUnmount();
    }


    /**
     * Abstract Render Method
     * 
     * Must be implemented by subclasses. Should return a Virtual DOM tree
     * that represents the current state of the component.
     */
    protected render(): VNode | null {
      this._defaultView();
      return null;
    }

    /**
     * Dynamic Style Injection
     * 
     * Calls the component's styles() method (if defined) and injects
     * the returned CSS into the Shadow DOM/iframe for isolation.
     */
    private _applyStyles() {
      const raw = this.styles;

      if (raw) {
        const stylesheet = raw.call(this)

        if (typeof stylesheet !== 'string') {
          return;
        }

        injectStyleTag(this.shadow, stylesheet)
      }
    }

    /**
     * Ref System - Direct DOM Access
     * 
     * Walks the DOM tree and calls ref callbacks with their corresponding
     * DOM nodes. This allows components to get direct access to DOM elements
     * when needed (focus, measurements, third-party integrations).
     */
    private _applyRefs(node: Node, vNode: VNode): void {
      if (!(node instanceof HTMLElement) || typeof vNode !== 'object' || vNode === null) return;

      const props = vNode.props;
      if (props && typeof props.ref === 'function') {
        props.ref(node as any);
      }

      // Recursively apply refs to all children
      if (Array.isArray(vNode.children)) {
        for (let i = 0; i < vNode.children.length; i++) {
          const childVNode = vNode.children[i];
          if (childVNode && childVNode.dom) {
            this._applyRefs(childVNode.dom, childVNode);
          }
        }
      }
    }

    /**
     * Virtual DOM to Real DOM Converter
     * 
     * Recursively creates real DOM nodes from Virtual DOM nodes.
     * Handles text nodes, fragments, and regular elements.
     */
    private _createElement(vNode: VNode): Node | null {
      if (vNode == null) {
        return null;
      }

      // Text nodes: "Hello World" becomes document.createTextNode("Hello World")
      if (vNode.type === '#text') {
        const textNode = document.createTextNode(vNode.value as string);
        vNode.dom = textNode;
        return textNode;
      }

      // Document fragments: grouping multiple elements without a wrapper
      if (vNode.type === null) {
        const fragment = document.createDocumentFragment();
        vNode.dom = fragment;
        if (Array.isArray(vNode.children)) {
          for (const childVNode of vNode.children) {
            const childDom = this._createElement(childVNode);
            if (childDom) {
              fragment.appendChild(childDom);
            }
          }
        }
        return fragment;
      }

      // Regular elements: div, button, input, etc.
      const domElement = document.createElement(vNode.type);
      vNode.dom = domElement;

      this._setProps(domElement, vNode.props);

      // Recursively create children
      if (Array.isArray(vNode.children)) {
        for (const childVNode of vNode.children) {
          const childDom = this._createElement(childVNode);
          if (childDom) {
            domElement.appendChild(childDom);
          }
        }
      }

      this._applyRefs(domElement, vNode);
      return domElement;
    }

    /**
     * Props Setter - Initial Element Configuration
     * 
     * Sets properties and attributes on a DOM element from Virtual DOM props.
     * Handles special cases like events (onclick), boolean attributes (disabled),
     * and DOM properties vs HTML attributes. Skips undefined values and handles
     * null values appropriately.
     */
    private _setProps(element: HTMLElement, props: Props<any>): void {
      for (const key in props) {
        if (key === 'ref' || key === 'key') continue;
        
        const value = props[key];

        // Skip undefined values entirely (they shouldn't set anything)
        if (value === undefined) {
          continue;
        }

        // Event handlers: onclick, onchange, etc.
        if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value);
          continue;
        }

        // Boolean attributes: disabled, checked, selected
        if (typeof value === 'boolean') {
          if (value) {
            element.setAttribute(key, '');
          }
          continue;
        }

        // Handle style objects: { width: '100px', height: '100px' }
        if (key === 'style' && typeof value === 'object' && value !== null) {
          for (const styleKey in value) {
            const styleValue = (value as any)[styleKey];
            if (styleValue !== undefined) {
              (element.style as any)[styleKey] = styleValue;
            }
          }
          continue;
        }

        // Handle null values - they should remove/clear the property
        if (value === null) {
          if (key === 'style') {
            // Clear all styles
            element.style.cssText = '';
          } else if (key in element) {
            // For DOM properties, set to empty string or appropriate default
            const descriptor = Object.getOwnPropertyDescriptor(element, key) || 
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), key);
            if (descriptor && descriptor.set) {
              (element as any)[key] = '';
            }
          } else {
            // For attributes, remove them
            element.removeAttribute(key);
          }
          continue;
        }

        // Regular values: DOM properties vs HTML attributes
        if (key in element) {
          (element as any)[key] = value;
        } else {
          element.setAttribute(key, String(value));
        }
      }
    }

    /**
     * Props Updater - Efficient Property Changes
     * 
     * Updates only the properties that changed between old and new props.
     * Properly handles undefined, null values and removes old properties.
     */
    private _updateProps(element: HTMLElement, oldProps: Props<any>, newProps: Props<any>): void {
      // Remove old properties that are no longer present or became undefined
      for (const key in oldProps) {
        if (key === 'ref' || key === 'key') continue;
        
        const newValue = newProps[key];
        
        // Property was removed or became undefined
        if (!(key in newProps) || newValue === undefined) {
          if (key.startsWith('on') && typeof oldProps[key] === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.removeEventListener(eventName, oldProps[key]);
          } else if (key === 'style' && typeof oldProps[key] === 'object' && oldProps[key] !== null) {
            // Clear all styles when style prop is removed
            element.style.cssText = '';
          } else if (typeof oldProps[key] === 'boolean') {
            element.removeAttribute(key);
          } else if (key in element) {
            // For DOM properties, set to empty string or appropriate default
            const descriptor = Object.getOwnPropertyDescriptor(element, key) || 
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), key);
            if (descriptor && descriptor.set) {
              (element as any)[key] = '';
            }
          } else {
            element.removeAttribute(key);
          }
        }
      }

      // Set new/updated properties
      for (const key in newProps) {
        if (key === 'ref' || key === 'key') continue;
        
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        // Skip if value hasn't changed
        if (oldValue === newValue) continue;


        // Handle event listeners
        if (key.startsWith('on') && typeof newValue === 'function') {
          const eventName = key.slice(2).toLowerCase();
          
          // Remove old listener if it exists
          if (typeof oldValue === 'function') {
            element.removeEventListener(eventName, oldValue);
          }
          element.addEventListener(eventName, newValue);
          continue;
        }

        // Remove old event listener if new value is not a function
        if (key.startsWith('on') && typeof oldValue === 'function' && typeof newValue !== 'function') {
          const eventName = key.slice(2).toLowerCase();
          element.removeEventListener(eventName, oldValue);
          continue;
        }

        // Handle boolean attributes
        if (typeof newValue === 'boolean') {
          if (newValue) {
            element.setAttribute(key, '');
          } else {
            element.removeAttribute(key);
          }
          continue;
        }

        // Handle style objects: { width: '100px', height: '100px' }
        if (key === 'style' && typeof newValue === 'object' && newValue !== null) {
          const oldStyle = (typeof oldValue === 'object' && oldValue !== null) ? oldValue : {};
          
          // Remove old style properties that are no longer present
          for (const styleKey in oldStyle) {
            if (!(styleKey in newValue) || (newValue as any)[styleKey] === undefined) {
              (element.style as any)[styleKey] = '';
            }
          }
          
          // Set new/updated style properties
          for (const styleKey in newValue) {
            const newStyleValue = (newValue as any)[styleKey];
            const oldStyleValue = (oldStyle as any)[styleKey];
            
            if (newStyleValue !== oldStyleValue && newStyleValue !== undefined) {
              (element.style as any)[styleKey] = newStyleValue;
            }
          }
          continue;
        }

        // Handle null values - they should clear/remove the property
        if (newValue === null || newValue === undefined) {
          if (key === 'style') {
            // Clear all styles
            element.style.cssText = '';
          } else if (key in element) {
            // For DOM properties, set to empty string or appropriate default
            const descriptor = Object.getOwnPropertyDescriptor(element, key) || 
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), key);
            if (descriptor && descriptor.set) {
              (element as any)[key] = '';
            }
          } else {
            // For attributes, remove them
            element.removeAttribute(key);
          }
          continue;
        }

        // Handle regular values: DOM properties vs HTML attributes
        if (key in element) {
          (element as any)[key] = newValue;
        } else {
          element.setAttribute(key, String(newValue));
        }
      }
    }

    /**
     * Virtual DOM Patcher - The Reconciliation Algorithm
     * 
     * This is the heart of the Virtual DOM system. It compares old and new
     * Virtual DOM trees and makes minimal changes to the real DOM to match.
     * 
     * The algorithm handles:
     * • Node removal (newVNode is null)
     * • Node creation (oldDomNode is null) 
     * • Node replacement (different types/keys)
     * • Node updates (same type, update properties and children)
     * 
     * All DOM operations include defensive checks to prevent errors.
     */
    private _patch(parentDomNode: Element, newVNode: VNode | null, oldVNode: VNode | null, oldDomNode: Node | null): void {
      // CASE 1: Remove node (component returned null or removed element)
      if (oldDomNode && (newVNode == null)) {
        if (parentDomNode.isConnected && parentDomNode.contains(oldDomNode)) {
          try {
            parentDomNode.removeChild(oldDomNode);
          } catch (e) {
            console.warn('Failed to remove DOM node:', e);
          }
        }
        return;
      }

      // CASE 2: Create new node (initial render or new element added)
      if (newVNode != null && (!oldVNode || !oldDomNode)) {
        const newDomNode = this._createElement(newVNode);
        if (newDomNode && parentDomNode.isConnected) {
          try {
            // If there's an old DOM node, replace it; otherwise append
            if (oldDomNode && parentDomNode.contains(oldDomNode)) {
              parentDomNode.replaceChild(newDomNode, oldDomNode);
            } else {
              parentDomNode.appendChild(newDomNode);
            }
          } catch (e) {
            console.warn('Failed to create/replace DOM node:', e);
            return;
          }
        }
        return;
      }

      // CASE 3: Nothing to do (both are null)
      if (!newVNode && !oldVNode) {
        return;
      }

      // CASE 4: Both virtual nodes exist - update existing node
      if (newVNode && oldVNode && oldDomNode) {
        const _newVNode = newVNode as VNode;
        const _oldVNode = oldVNode as VNode;
        const _oldDomNode = oldDomNode as Node;

        const oldVNodeType = _oldVNode.type;
        const newVNodeType = _newVNode.type;
        const oldKey = _oldVNode.key;
        const newKey = _newVNode.key;

        // CASE 4a: Update text content (common optimization)
        if (oldVNodeType === '#text' && newVNodeType === '#text') {
          if (_oldDomNode.textContent !== _newVNode.value) {
            _oldDomNode.textContent = _newVNode.value as string;
          }
          _newVNode.dom = _oldDomNode;
          return;
        }

        // CASE 4b: Replace node (different type or key - can't be updated)
        if (oldVNodeType !== newVNodeType || oldKey !== newKey) {
          const newDomNode = this._createElement(_newVNode);
          if (newDomNode && parentDomNode.isConnected && parentDomNode.contains(_oldDomNode)) {
            try {
              parentDomNode.replaceChild(newDomNode, _oldDomNode);
            } catch (e) {
              console.warn('Failed to replace DOM node:', e);
              return;
            }
          }
          return;
        }

        // CASE 4c: Update existing node (same type and key)
        const targetDomNode = _oldDomNode as HTMLElement;

        // Update element properties (className, disabled, onclick, etc.)
        this._updateProps(targetDomNode, _oldVNode.props, _newVNode.props);
        _newVNode.dom = targetDomNode;

        // Handle children updates
        const oldHasChildren = _oldVNode.children && _oldVNode.children.length > 0;
        const newHasChildren = _newVNode.children && _newVNode.children.length > 0;

        if (oldHasChildren && !newHasChildren) {
          // Remove all children
          while(targetDomNode.firstChild) {
            targetDomNode.removeChild(targetDomNode.firstChild);
          }
        } else if (!oldHasChildren && newHasChildren) {
          // Add all children (replace any existing)
          while(targetDomNode.firstChild) {
            targetDomNode.removeChild(targetDomNode.firstChild);
          }
          const newChildren = _newVNode.children || [];
          for (const childVNode of newChildren) {
            const childDom = this._createElement(childVNode);
            if (childDom) {
              targetDomNode.appendChild(childDom);
            }
          }
        } else if (oldHasChildren && newHasChildren) {
          // Complex case: diff and patch children
          // Safety check: ensure children arrays are valid
          const newChildren = _newVNode.children || [];
          const oldChildren = _oldVNode.children || [];
          this._patchChildren(targetDomNode, newChildren, oldChildren);
        }

        this._applyRefs(targetDomNode, _newVNode);
      }
    }

    private _getKey(vNode: VNode | null): string | null {
      if (vNode && vNode.type !== '#text') {
        return vNode.key || null;
      }
      return null;
    }

    private _isSameVNode(a: VNode | null, b: VNode | null): boolean {
      if (!a || !b) {
        return a === b;
      }

      if (a.type !== b.type) {
        return false;
      }

      // Text nodes are same if they have the same content
      if (a.type === '#text' && b.type === '#text') {
        return a.value === b.value;
      }

      // Elements are same if they have the same type and key
      return this._getKey(a) === this._getKey(b);
    }

    private _createKeyMap(vNodes: VNode[], start: number, end: number): { [key: string]: number } {
      const map: { [key: string]: number } = {};
      for (let i = start; i <= end; i++) {
        const vNode = vNodes[i];
        const key = this._getKey(vNode);
        if (key != null) map[key] = i;
      }
      return map;
    }

    /**
     * Child Reconciliation Algorithm - The Most Complex Part
     * 
     * This is based on React's reconciliation algorithm. It efficiently
     * handles reordering, adding, and removing children with minimal DOM operations.
     * 
     * The algorithm uses a "two-ended" approach:
     * • Compare from both ends of the arrays simultaneously
     * • Handle common cases (same start, same end, moved elements)
     * • Use keys to efficiently handle complex reorderings
     * • Minimize DOM manipulations (moves instead of delete+create)
     * 
     * Example:
     * Old: [A, B, C, D]
     * New: [B, A, D, E]
     * Result: Move B to start, keep A, remove C, keep D, add E
     */
    private _patchChildren(parentDomNode: HTMLElement, newChildren: VNode<any>[], oldChildren: VNode<any>[]): void {
      // Two-pointer approach: scan from both ends simultaneously
      let oldStartIndex = 0, newStartIndex = 0;
      let oldEndIndex = oldChildren.length - 1;
      let newEndIndex = newChildren.length - 1;

      let oldStartVNode = oldChildren[0];
      let oldEndVNode = oldChildren[oldEndIndex];
      let newStartVNode = newChildren[0];
      let newEndVNode = newChildren[newEndIndex];

      let oldKeyMap: { [key: string]: number } | null = null;

      // Main reconciliation loop
      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // Skip processed nodes (marked as undefined)
        if (oldStartVNode == null || oldStartVNode === undefined) {
          oldStartVNode = oldChildren[++oldStartIndex];
          continue;
        }

        if (oldEndVNode == null || oldEndVNode === undefined) {
          oldEndVNode = oldChildren[--oldEndIndex];
          continue;
        }

        const oldStartDomNode = oldStartVNode.dom;
        const oldEndDomNode = oldEndVNode.dom;

        // Skip if DOM reference is missing
        if (!oldStartDomNode) {
          oldStartVNode = oldChildren[++oldStartIndex];
          continue;
        }
        if (!oldEndDomNode) {
          oldEndVNode = oldChildren[--oldEndIndex];
          continue;
        }

        // OPTIMIZATION 1: Same element at start (most common case)
        if (this._isSameVNode(oldStartVNode, newStartVNode)) {
          this._patch(parentDomNode, newStartVNode, oldStartVNode, oldStartDomNode);
          oldStartVNode = oldChildren[++oldStartIndex];
          newStartVNode = newChildren[++newStartIndex];
          continue;
        }

        // OPTIMIZATION 2: Same element at end
        if (this._isSameVNode(oldEndVNode, newEndVNode)) {
          this._patch(parentDomNode, newEndVNode, oldEndVNode, oldEndDomNode);
          oldEndVNode = oldChildren[--oldEndIndex];
          newEndVNode = newChildren[--newEndIndex];
          continue;
        }

        // OPTIMIZATION 3: Element moved from start to end
        if (this._isSameVNode(oldStartVNode, newEndVNode)) {
          this._patch(parentDomNode, newEndVNode, oldStartVNode, oldStartDomNode);
          // Move DOM node to end position
          if (oldStartDomNode.parentNode === parentDomNode) {
            parentDomNode.insertBefore(oldStartDomNode, oldEndDomNode.nextSibling);
          }
          oldStartVNode = oldChildren[++oldStartIndex];
          newEndVNode = newChildren[--newEndIndex];
          continue;
        }

        // OPTIMIZATION 4: Element moved from end to start
        if (this._isSameVNode(oldEndVNode, newStartVNode)) {
          this._patch(parentDomNode, newStartVNode, oldEndVNode, oldEndDomNode);
          // Move DOM node to start position
          if (oldEndDomNode.parentNode === parentDomNode) {
            parentDomNode.insertBefore(oldEndDomNode, oldStartDomNode);
          }
          oldEndVNode = oldChildren[--oldEndIndex];
          newStartVNode = newChildren[++newStartIndex];
          continue;
        }

        // GENERAL CASE: Use keys to find matching elements
        if (!oldKeyMap) {
          oldKeyMap = this._createKeyMap(oldChildren, oldStartIndex, oldEndIndex);
        }
        
        const key = this._getKey(newStartVNode);
        const indexInOld = key != null ? oldKeyMap[key] : undefined;

        if (indexInOld == null) {
          // New element - create and insert
          const newDomNode = this._createElement(newStartVNode);
          
          // Find reference node for insertion
          let refDomNode: Node | null = null;
          for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            const potentialRefVNode = oldChildren[i];
            if (potentialRefVNode && potentialRefVNode.dom && parentDomNode.contains(potentialRefVNode.dom)) {
              refDomNode = potentialRefVNode.dom;
              break;
            }
          }

          if (newDomNode) {
            parentDomNode.insertBefore(newDomNode, refDomNode);
          }
        } else {
          // Existing element - move and patch
          const nodeToMoveVNode = oldChildren[indexInOld];
          const nodeToMoveDom = nodeToMoveVNode!.dom;

          this._patch(parentDomNode, newStartVNode, nodeToMoveVNode, nodeToMoveDom);

          // Move DOM node to correct position
          if (nodeToMoveDom && nodeToMoveDom.parentNode === parentDomNode) {
            parentDomNode.insertBefore(nodeToMoveDom, oldStartDomNode);
          }

          // Mark as processed
          oldChildren[indexInOld] = undefined as any;
        }
        
        newStartVNode = newChildren[++newStartIndex];
      }

      // Handle remaining nodes
      if (oldStartIndex > oldEndIndex) {
        // Add remaining new nodes
        for (let i = newStartIndex; i <= newEndIndex; i++) {
          const newDomNode = this._createElement(newChildren[i]);
          if (newDomNode) {
            parentDomNode.insertBefore(newDomNode, null);
          }
        }
      } else if (newStartIndex > newEndIndex) {
        // Remove remaining old nodes
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          const oldVNode = oldChildren[i];
          if (oldVNode != null && oldVNode !== undefined) {
            const oldDomNodeToRemove = oldVNode.dom;
            if (oldDomNodeToRemove && parentDomNode.contains(oldDomNodeToRemove)) {
              parentDomNode.removeChild(oldDomNodeToRemove);
            }
          }
        }
      }
    }

    private _defaultView(): void {
      throw new Error('Not implemented: render() method must be implemented by subclass.');
    }

    /**
     * Error Handler - Component Error Boundaries
     * 
     * Catches runtime errors and displays user-friendly error messages
     * instead of breaking the entire application.
     */
    private _handleRuntimeError(err: any) {
      if (err && err.name === 'UpdatedReadOnly') {
        ContextImpl.context.page.criticalFailure({
          title: 'Failed to update view',
          message: `Cannot modify state directly. Use setState() to update the property "${err.property}".`,
        })
        return
      }

      ContextImpl.context.page.criticalFailure({
        title: 'An unexpected error occurred in the view',
        message: err.message,
      });
    }
  }
}
