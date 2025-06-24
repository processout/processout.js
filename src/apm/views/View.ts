module ProcessOut {
  export interface APMView<P = unknown> {
    mount(): void
  }

  export type APMViewConstructor<P = unknown> = new(container: Element, shadow: ShadowRoot | Document, props?: P) => APMView<P>
  export type ExtractViewProps<T extends APMViewConstructor> =
    T extends APMViewConstructor<infer P> ? P : never;

  export type SetState<S> = (state: S | ((prevState: DeepReadonly<S>) => S)) => void

  /**
   * APMViewImpl is the "engine" of the UI system. It's a reusable base class that
   * provides any view extending it with powerful, efficient, state-driven rendering,
   * DOM patching, and style management.
   */
  export class APMViewImpl<P extends object = object, S extends PlainObject = Record<string, any>> implements APMView<P> {
    readonly container: Element;
    readonly shadow: ShadowRoot | Document;
    protected props: P;
    protected styles?: (() => CSSText); // Optional styles method

    protected state: DeepReadonly<S>; // State is readonly externally

    private _currentVDom: VNode | null = null; // Stores the last rendered Virtual DOM tree
    private _pendingState: Partial<S> | null = null; // Queues partial state updates
    private _isUpdateScheduled: boolean = false;

    constructor(container: Element, shadow: ShadowRoot | Document, props: P) {
      this.container = container;
      this.shadow = shadow;
      this.props = props;
      this.state = {} as DeepReadonly<S>; // Initialize with an empty object, expecting subclass to set it

      // Wrap the instance in an error-handling proxy
      return createErrorHandlingProxy(this, this._handleRuntimeError.bind(this));
    }

    protected setState(partial: S | ((prevState: DeepReadonly<S>) => S)): void {
      // Merge current partial into pending. If 'partial' is a function, it applies to current pending state.
      if (typeof partial === 'function') {
        this._pendingState = (partial as (prevState: DeepReadonly<S>) => S)(this._pendingState as DeepReadonly<S> || this.state) as Partial<S>;
      } else {
        this._pendingState = { ...(this._pendingState as S  || this.state), ...partial } as Partial<S>;
      }

      // Schedule a single update if not already scheduled
      if (!this._isUpdateScheduled) {
        this._isUpdateScheduled = true;
        requestAnimationFrame(() => this._processUpdateBatch());
      }
    }

    /**
     * Processes all queued state updates and triggers a single re-render.
     * This method is called via requestAnimationFrame to batch updates.
     */
    private _processUpdateBatch(): void {
      console.log('updating state', this._pendingState )
      // Reset scheduling flag
      this._isUpdateScheduled = false;

      // If no pending state, nothing to do
      if (this._pendingState === null) {
        return;
      }

      // Consolidate all pending state updates into a final new state
      const finalPartialState = this._pendingState;
      this._pendingState = null; // Clear pending state for the next cycle

      const prevState = this.state;
      const newState: S = {
        ...(prevState as S),
        ...(finalPartialState as S)
      };

      // If the final new state is deeply equal to the previous state, skip re-render
      if (isDeepEqual(prevState, newState)) {
        return;
      }

      // Update the component's state, wrapping it in a readonly proxy
      this.state = createReadonlyProxy(newState);

      // Apply styles (in case state changes affect styles)
      this._applyStyles();
      // Generate the new desired Virtual DOM tree
      const newVDom = this.render.call(this);

      // Patch the actual DOM to reflect the changes from the old VDom to the new VDom
      const newDomNode = this._patch(this.container, newVDom, this._currentVDom, this.container.firstChild);

      // If the root node changed its actual DOM element, update the container's child
      if (newDomNode && newDomNode !== this.container.firstChild) {
        if (this.container.firstChild) {
          this.container.replaceChild(newDomNode, this.container.firstChild);
        } else {
          this.container.appendChild(newDomNode);
        }
      } else if (!newDomNode && this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }

      this._currentVDom = newVDom; // Store the new VDom tree for the next render cycle
    }

    /**
     * The entry point for the component. Performs the initial, full render to the DOM.
     */
    public mount(): void {
      // Initialize state as a readonly proxy if it exists (for initial state in constructor)
      if (this.state) {
        this.state = createReadonlyProxy(this.state as S);
      }

      this._applyStyles();
      // Render the initial Virtual DOM tree
      const initialVDom = this.render.call(this);
      if (!initialVDom) {
        return;
      }

      // Clear existing children from the container before mounting
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }

      // Recursively create actual DOM elements from the initial Virtual DOM
      const initialDomNode = this._createElement(initialVDom);
      if (initialDomNode) {
        this.container.appendChild(initialDomNode);
      }

      this._currentVDom = initialVDom; // Store the initial VDom tree
    }

    /**
     * To be implemented by the subclass. This method is expected to return the
     * root HTMLElement of the component's view for the current state.
     */
    protected render(): VNode | null {
      // This method must be overridden by subclasses
      this._defaultView();
      return null;
    }

    /**
     * The dedicated style manager. It calls the user-defined `styles` function
     * and uses the provided `injectStyleTag` helper to apply CSS.
     */
    private _applyStyles() {
      const raw = this.styles;
      if (raw) {
        // Calling raw with this context ensures that when the `styles` function is executed,
        // `this` refers to the component instance, giving it access to `this.state` and `this.props`.
        const stylesheet = raw.call(this)

        if (typeof stylesheet !== 'string') {
          return;
        }

        injectStyleTag(this.shadow, stylesheet)
      }
    }

    /**
     * Walks a newly created DOM tree and executes any `ref` callbacks. This ensures
     * that components can get a reference to their live DOM nodes on initial mount.
     */
    private _applyRefs(node: Node, vNode: VNode): void {
      // Only process HTMLElement nodes and valid VNodes that could have refs
      if (!(node instanceof HTMLElement) || typeof vNode !== 'object' || vNode === null) return;

      const props = vNode.props; // Access props from the VNode
      if (props && typeof props.ref === 'function') {
        props.ref(node as any);
      }

      // Recursively apply refs to children.
      // Ensure vNode.children exists and is an array before iterating.
      if (Array.isArray(vNode.children)) {
        for (let i = 0; i < vNode.children.length; i++) {
          const childVNode = vNode.children[i];
          // Only recurse if the child is a VNode object AND its DOM reference is set
          if (childVNode && childVNode.dom) {
            this._applyRefs(childVNode.dom, childVNode); // Correct recursion with actual DOM node and VNode
          }
        }
      }
    }

    private _createElement(vNode: VNode): Node | null {
      if (vNode == null) {
        return null;
      }

      // Handle primitive VNodes (text nodes)
      if (vNode.type === '#text') {
        const textNode = document.createTextNode(vNode.value as string);
        vNode.dom = textNode; // Store DOM reference on the VNode for primitives too
        return textNode;
      }

      // If it's a DocumentFragment VNode (type is null)
      if (vNode.type === null) {
        const fragment = document.createDocumentFragment();
        vNode.dom = fragment; // Store DOM reference on the VNode
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

      // Create the actual DOM element
      const domElement = document.createElement(vNode.type);
      vNode.dom = domElement; // Store DOM reference on the VNode

      // Set properties/attributes on the newly created DOM element
      this._setProps(domElement, vNode.props);

      // Recursively create and append children
      if (Array.isArray(vNode.children)) {
        for (const childVNode of vNode.children) {
          const childDom = this._createElement(childVNode);
          if (childDom) {
            domElement.appendChild(childDom);
          }
        }
      }

      this._applyRefs(domElement, vNode); // Apply refs for this element and its children
      return domElement;
    }

    /**
     * Sets properties/attributes on a newly created DOM element.
     * This is called once during element creation, not for patching.
     * @param element - The live DOM element.
     * @param props - The properties from the VNode.
     */
    private _setProps(element: HTMLElement, props: Props<any>): void {
      for (const key in props) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) {
          continue;
        }
        const value = (props as any)[key];

        if (value === null || value === undefined || key === 'ref' || key === 'key') {
          continue;
        }

        const isEventHandler = key.startsWith('on') && typeof value === 'function';
        const attributeExistsAsProperty = key in element;

        if (isEventHandler) {
          element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
        } else if (key === 'className' || key === 'class') {
          element.className = value as string || '';
        } else if (key === 'value' || key === 'checked') {
          (element as any)[key] = value;
        } else if (attributeExistsAsProperty && !(element instanceof HTMLElement && key.startsWith('data-'))) {
          try {
            (element as any)[key] = value;
          } catch (e) {
            element.setAttribute(key, String(value));
          }
        } else {
          element.setAttribute(key, String(value));
        }
      }
    }

    /**
     * Updates properties/attributes on an existing DOM element during patching.
     * Removes old properties/attributes that are no longer present or have changed,
     * and adds/updates new ones. Handles special cases like event listeners and `className`.
     */
    private _updateProps(element: HTMLElement, oldProps: Props<any>, newProps: Props<any>): void {
      if (oldProps === newProps) return; // Optimization: If props object is identical

      const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

      allKeys.forEach(key => {
        const oldValue = (oldProps as any)[key];
        const newValue = (newProps as any)[key];

        // Skip 'key' as it's only for reconciliation, not a DOM prop
        if (key === 'key') return;

        // Special handling for the `ref` callback
        if (key === 'ref') {
          if (typeof newValue === 'function') {
            (newValue as (node: HTMLElement | DocumentFragment | null) => void)(element); // Call ref with the live element
          }
          return;
        }

        // Optimization: If values are identical, no change needed
        if (oldValue === newValue) return;

        // Special handling for 'className' or 'class' attribute
        if (key === 'className' || key === 'class') {
          if (element.className !== (newValue as string || '')) {
            element.className = newValue as string || '';
          }
          return;
        }

        // Special handling for input element properties like 'value' and 'checked'
        if (key === 'value' || key === 'checked') {
          if ((element as any)[key] !== newValue) {
            (element as any)[key] = newValue;
          }
          return;
        }

        // Handle event listeners (properties starting with 'on')
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          if (oldValue && oldValue !== newValue) {
            element.removeEventListener(eventName, oldValue as EventListener);
          }
          if (newValue && oldValue !== newValue) {
            element.addEventListener(eventName, newValue as EventListener);
          }
          return;
        }

        // For all other attributes/properties
        if (newValue == null || newValue === false) {
          element.removeAttribute(key);
        } else {
          // Attempt to set as a direct property first if applicable
          if (key in element && !(element instanceof HTMLElement && key.startsWith('data-'))) {
            try {
              (element as any)[key] = newValue;
            } catch (e) {
              element.setAttribute(key, String(newValue));
            }
          } else {
            element.setAttribute(key, String(newValue));
          }
        }
      });
    }

    /**
     * The core DOM patching algorithm. This function compares a new Virtual DOM node (`newVNode`)
     * with the previous Virtual DOM node (`oldVNode`) and the corresponding live DOM element (`oldDomNode`).
     * It then applies minimal changes to `oldDomNode` to make it match `newVNode`.
     *
     * @param parentDomNode - The parent live DOM element.
     * @param newVNode - The newly generated desired Virtual DOM node.
     * @param oldVNode - The previously rendered Virtual DOM node.
     * @param oldDomNode - The actual live DOM node corresponding to oldVNode.
     * @returns The updated or newly created live DOM node.
     */
    private _patch(parentDomNode: Element, newVNode: VNode | null, oldVNode: VNode | null, oldDomNode: Node | null): Node | null {
      // Case 1: Old node existed, new node is null/undefined (removal)
      if (oldDomNode && (newVNode == null)) {
        parentDomNode.removeChild(oldDomNode);
        return null;
      }

      // Case 2: New node exists, old node was null/undefined (initial creation/addition)
      if (!oldDomNode && (newVNode != null)) {
        const newDomNode = this._createElement(newVNode);
        if (newDomNode) {
          parentDomNode.appendChild(newDomNode);
        }
        return newDomNode;
      }

      // At this point, oldDomNode, newVNode, and oldVNode are guaranteed to be non-null.
      // Cast to non-null types for easier access.
      const _newVNode = newVNode as VNode;
      const _oldVNode = oldVNode as VNode;
      const _oldDomNode = oldDomNode as Node;

      // Determine types correctly for VNodes
      const oldVNodeType = _oldVNode.type;
      const newVNodeType = _newVNode.type;

      const oldKey = _oldVNode.key;
      const newKey = _newVNode.key;

      // Handle text node value updates specifically, without full replacement
      if (oldVNodeType === '#text' && newVNodeType === '#text') {
        if (_oldDomNode.textContent !== _newVNode.value) {
          _oldDomNode.textContent = _newVNode.value as string;
        }
        _newVNode.dom = _oldDomNode; // Update DOM reference for the new VNode
        return _oldDomNode;
      }

      // If types or keys differ, or if it's a type change (e.g., div to p)
      if (oldVNodeType !== newVNodeType || oldKey !== newKey) {
        const newDomNode = this._createElement(_newVNode); // Create actual DOM for new VNode
        if (newDomNode) {
          parentDomNode.replaceChild(newDomNode, _oldDomNode);
        } else { // If newVNode results in null, but oldDomNode existed, remove it
          parentDomNode.removeChild(_oldDomNode);
        }
        return newDomNode;
      }

      // Case 4: Both exist and are of the same type/key (update)
      const targetDomNode = _oldDomNode as HTMLElement; // We will mutate the existing DOM node

      // For element VNodes, update properties
      this._updateProps(targetDomNode, _oldVNode.props, _newVNode.props);
      _newVNode.dom = targetDomNode; // Update the VNode's DOM reference

      // Recursively patch children for element VNodes
      // Ensure children arrays are handled
      const oldHasChildren = _oldVNode.children.length > 0;
      const newHasChildren = _newVNode.children.length > 0;

      if (oldHasChildren && !newHasChildren) {
        while(targetDomNode.firstChild) {
          targetDomNode.removeChild(targetDomNode.firstChild);
        }
      }

      if (!oldHasChildren && newHasChildren) {
        while(targetDomNode.firstChild) {
          targetDomNode.removeChild(targetDomNode.firstChild);
        }

        for (const childVNode of _newVNode.children) {
          const childDom = this._createElement(childVNode);
          if (childDom) {
            targetDomNode.appendChild(childDom);
          }
        }
      }

      if (oldHasChildren && newHasChildren) {
        this._patchChildren(targetDomNode, _newVNode.children, _oldVNode.children);
      }

      // Re-apply refs for the element itself (children refs are handled recursively by _patchChildren)
      this._applyRefs(targetDomNode, _newVNode);

      return targetDomNode;
    }

    /**
     * Retrieves the 'key' for a VNode.
     * Keys are used for efficient child reconciliation.
     */
    private _getKey(vNode: VNode | null): string | null {
      if (vNode && vNode.type !== '#text') {
        return vNode.key || null;
      }
      return null;
    }

    /**
     * Checks if two VNodes are considered "the same" for patching purposes,
     * based on their type and key.
     */
    private _isSameVNode(a: VNode | null, b: VNode | null): boolean {
      // Handle null/undefined cases
      if (!a || !b) {
        return a === b;
      }

      // Compare by type first.
      if (a.type !== b.type) {
        return false;
      }

      // If both are text nodes, compare values
      if (a.type === '#text' && b.type === '#text') {
        return a.value === b.value;
      }

      return this._getKey(a) === this._getKey(b);
    }

    /**
     * Creates a map of keys to their indices for a given range of VNodes.
     */
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
     * The child reconciliation algorithm. This is a complex part of the patching process
     * that efficiently updates, reorders, adds, and removes child nodes within a parent's
     * live DOM. It compares virtual child lists and manipulates the actual DOM.
     */
    private _patchChildren(parentDomNode: HTMLElement, newChildren: VNode<any>[], oldChildren: VNode<any>[]): void {
      let oldStartIndex = 0, newStartIndex = 0;
      let oldEndIndex = oldChildren.length - 1;
      let newEndIndex = newChildren.length - 1;

      let oldStartVNode = oldChildren[0];
      let oldEndVNode = oldChildren[oldEndIndex];
      let newStartVNode = newChildren[0];
      let newEndVNode = newChildren[newEndIndex];

      let oldKeyMap: { [key: string]: number } | null = null;

      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // Skip null old VNodes (which occur when a keyed node is moved or removed)
        if (oldStartVNode == null) {
          oldStartVNode = oldChildren[++oldStartIndex];
          continue;
        }
        if (oldEndVNode == null) {
          oldEndVNode = oldChildren[--oldEndIndex];
          continue;
        }

        // Get the corresponding live DOM nodes from the VNode.dom property
        const oldStartDomNode = oldStartVNode.dom;
        const oldEndDomNode = oldEndVNode.dom;

        // If a DOM node reference is missing (e.g., node was already removed), skip this VNode
        if (!oldStartDomNode) {
          oldStartVNode = oldChildren[++oldStartIndex];
          continue;
        }
        if (!oldEndDomNode) {
          oldEndVNode = oldChildren[--oldEndIndex];
          continue;
        }


        // 1. Same VNode at the start (common case)
        if (this._isSameVNode(oldStartVNode, newStartVNode)) {
          this._patch(parentDomNode, newStartVNode, oldStartVNode, oldStartDomNode);
          oldStartVNode = oldChildren[++oldStartIndex];
          newStartVNode = newChildren[++newStartIndex];
          continue;
        }

        // 2. Same VNode at the end
        if (this._isSameVNode(oldEndVNode, newEndVNode)) {
          this._patch(parentDomNode, newEndVNode, oldEndVNode, oldEndDomNode);
          oldEndVNode = oldChildren[--oldEndIndex];
          newEndVNode = newChildren[--newEndIndex];
          continue;
        }

        // 3. Old start VNode moved to new end position
        if (this._isSameVNode(oldStartVNode, newEndVNode)) {
          this._patch(parentDomNode, newEndVNode, oldStartVNode, oldStartDomNode);
          // Move the actual DOM node
          console.log('Old start VNode moved to new end position');
          // Defensive check before insertBefore to ensure oldStartDomNode is still a child
          if (oldStartDomNode.parentNode === parentDomNode) {
            parentDomNode.insertBefore(oldStartDomNode, oldEndDomNode.nextSibling);
          } else {
            console.warn("Skipping insertBefore as oldStartDomNode is not a child of parentDomNode:", oldStartDomNode, parentDomNode);
            // Fallback: If detached, just ensure it's removed and re-created later if needed by the algorithm
          }
          oldStartVNode = oldChildren[++oldStartIndex];
          newEndVNode = newChildren[--newEndIndex];
          continue;
        }

        // 4. Old end VNode moved to new start position
        if (this._isSameVNode(oldEndVNode, newStartVNode)) {
          this._patch(parentDomNode, newStartVNode, oldEndVNode, oldEndDomNode);
          // Move the actual DOM node
          console.log('Old end VNode moved to new start position');
          // Defensive check before insertBefore
          if (oldEndDomNode.parentNode === parentDomNode) {
            parentDomNode.insertBefore(oldEndDomNode, oldStartDomNode);
          } else {
            console.warn("Skipping insertBefore as oldEndDomNode is not a child of parentDomNode:", oldEndDomNode, parentDomNode);
            // Fallback
          }
          oldEndVNode = oldChildren[--oldEndIndex];
          newStartVNode = newChildren[++newStartIndex];
          continue;
        }

        // If no direct matches, use keys to find and move/create nodes
        if (!oldKeyMap) {
          oldKeyMap = this._createKeyMap(oldChildren, oldStartIndex, oldEndIndex);
        }
        const key = this._getKey(newStartVNode);
        const indexInOld = key != null ? oldKeyMap[key] : undefined;

        if (indexInOld == null) {
          // newStartVNode not found in oldChildren (or no key), so it's a new node
          const newDomNode = this._createElement(newStartVNode); // Create actual DOM for new node
          // The reference node should be the first live, *unprocessed* DOM node at or after oldStartIndex
          let refDomNode: Node | null = null;
          for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            const potentialRefVNode = oldChildren[i];
            if (potentialRefVNode && potentialRefVNode.dom && parentDomNode.contains(potentialRefVNode.dom)) {
              refDomNode = potentialRefVNode.dom;
              break;
            }
          }

          if (newDomNode) {
            console.trace(); // User's trace for this path
            console.log('newStartVNode not found in oldChildren (or no key), so it\'s a new node');
            parentDomNode.insertBefore(newDomNode, refDomNode);
          }
        } else {
          // newStartVNode found in oldChildren, so it's a moved node
          const nodeToMoveVNode = oldChildren[indexInOld];
          const nodeToMoveDom = nodeToMoveVNode!.dom; // Get the actual DOM node from its VNode. It must exist.

          this._patch(parentDomNode, newStartVNode, nodeToMoveVNode, nodeToMoveDom); // Patch the found node

          console.log('newStartVNode found in oldChildren, so it\'s a moved node');
          // Defensive check before insertBefore
          if (nodeToMoveDom && nodeToMoveDom.parentNode === parentDomNode) {
            parentDomNode.insertBefore(nodeToMoveDom, oldStartDomNode);
          } else if (nodeToMoveDom) {
            console.warn("Skipping insertBefore as nodeToMoveDom is not a child of parentDomNode or is null:", nodeToMoveDom, parentDomNode);
            // If the node is somehow detached but exists, try to re-append if it's supposed to be here
            // (This path might need more complex recovery depending on specific app logic)
          }

          oldChildren[indexInOld] = null as any; // Mark the old VNode position as processed/removed
        }
        newStartVNode = newChildren[++newStartIndex];
      }

      // After the main loop, handle remaining nodes (additions or removals)
      if (oldStartIndex > oldEndIndex) {
        // All old nodes processed, remaining new nodes are additions
        for (let i = newStartIndex; i <= newEndIndex; i++) {
          const newDomNode = this._createElement(newChildren[i]);
          if (newDomNode) {
            console.log('All old nodes processed, remaining new nodes are additions');
            parentDomNode.insertBefore(newDomNode, null); // Use null for appending at the end
          }
        }
      } else if (newStartIndex > newEndIndex) {
        // All new nodes processed, remaining old nodes are removals
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          const oldVNode = oldChildren[i];
          if (oldVNode != null) {
            // Get the actual DOM node to remove from its VNode.
            const oldDomNodeToRemove = oldVNode.dom;
            if (oldDomNodeToRemove && parentDomNode.contains(oldDomNodeToRemove)) {
              parentDomNode.removeChild(oldDomNodeToRemove);
            }
          }
        }
      }
    }

    /**
     * Default view method, throws an error if `render()` is not implemented by a subclass.
     * @private
     */
    private _defaultView(): void {
      throw new Error('Not implemented: render() method must be implemented by subclass.');
    }

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
