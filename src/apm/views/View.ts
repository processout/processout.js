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
    protected styles: (() => CSSText) | undefined;

    protected readonly state: DeepReadonly<S>;

    constructor(container: Element, shadow: ShadowRoot | Document, props: P) {
      this.container = container;
      this.shadow = shadow;
      this.props = props;

      return createErrorHandlingProxy(this, this._handleRuntimeError.bind(this));
    }

    protected setState(partial: S | ((prevState: DeepReadonly<S>) => S)) {
      const prevState = this.state;
      const newState = partial instanceof Function ? partial(prevState) : {
        ...prevState,
        ...partial
      };

      // No need to rerender if state is the same
      if (isDeepEqual(prevState, newState)) {
        return;
      }

      (this as any).state = createReadonlyProxy(newState);

      this._applyStyles();
      const newView = this.render.call(this);

      // We don't want to update the entire tree, just the elements that have changed.
      console.time('patch');
      this._patch(this.container as HTMLElement, newView, this.container.firstChild as PropsElement<HTMLElement>);
      console.timeEnd('patch');
    }

    /**
     * The entry point for the component. Performs the initial, full render to the DOM.
     */
    public mount() {
      if (this.state) {
        (this as any).state = createReadonlyProxy(this.state);
      }

      this._applyStyles();
      const view = this.render();
      if (!view) {
        return;
      }
      this.container.appendChild(view);
    }

    /**
     * To be implemented by the subclass. This method is expected to return the
     * root HTMLElement of the component's view for the current state.
     */
    protected render(): PropsElement<HTMLElement> | DocumentFragment {
      this._defaultView();
      return null
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

    private _patch(parent: Element, newNode: PropsElement<HTMLElement> | null, oldNode: PropsElement<HTMLElement> | null) {
      // Case 1: A new node is being added where there was none before.
      if (!oldNode && newNode) {
        parent.appendChild(newNode);
        return;
      }

      // Case 2: An existing node is being removed.
      if (oldNode && !newNode) {
        parent.removeChild(oldNode);
        return;
      }

      // Case 3: The nodes are fundamentally different (e.g., a `div` changes to a `p`).
      // The most efficient action is to simply replace the old node with the new one.
      if (!newNode || !oldNode || oldNode.nodeName !== newNode.nodeName) {
        parent.replaceChild(newNode, oldNode);
        return;
      }

      // At this point, we know we are mutating the `oldNode` to match the `newNode`.
      // `targetNode` is the live DOM element we will be updating.
      const targetNode = oldNode;

      // Case 4: Handle simple text updates. If both are text nodes, we just
      // update the text content if it's different, which is very fast.
      if (targetNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
        if (targetNode.textContent !== newNode.textContent) {
          targetNode.textContent = newNode.textContent;
        }
        return;
      }

      // Get the props from both the old and new nodes. The `__props__` object
      // is our "source of truth" that was attached during element creation.
      const oldProps = targetNode.__props__ || {};
      const newProps = newNode.__props__ || {};

      // Delegate all attribute/property/event listener updates to the `_patchProps` function.
      this._patchProps(targetNode, oldProps, newProps);
      // After patching, update the live node's `__props__` to the new props.
      // This ensures that for the *next* render, we have the correct "old" state to compare against.
      targetNode.__props__ = newProps;

      // Recursively apply the same patching logic to all the children of the nodes.
      this._patchChildren(
        targetNode,
        Array.from(newNode.childNodes) as Array<PropsElement<HTMLElement>>,
        Array.from(oldNode.childNodes) as Array<PropsElement<HTMLElement>>
      );
    }

    private _patchProps(element: PropsElement<HTMLElement>, oldProps: Props, newProps: Props) {
      // If the props objects are identical, no work is needed.
      if (oldProps === newProps) return;
      // Create a combined set of keys from both old and new props to ensure we process
      // every property that was either added, removed, or changed.
      const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

      allKeys.forEach(key => {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        // If the value for a key is unchanged, skip to the next key.
        if (oldValue === newValue) return;

        // Handle event listeners (e.g., `onclick`).
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          // Always remove the old listener before adding the new one to prevent duplicates.
          if (oldValue) element.removeEventListener(eventName, oldValue);
          if (newValue) element.addEventListener(eventName, newValue);
          // Handle special DOM *properties* like `className`, `value`, and `checked`,
          // which are more reliable to set directly on the element object.
        } else if (key === 'className' || key === 'class') {
          element.className = newValue || '';
        } else if (key === 'value' || key === 'checked') {
          if (element[key] !== newValue) element[key] = newValue;
          // The `key` prop is a special directive for the reconciliation algorithm and should
          // not be rendered as a DOM attribute.
        } else if (key !== 'key') {
          // For all other attributes, either remove them if the new value is null/false,
          // or set them using `setAttribute`.
          if (newValue == null || newValue === false) {
            element.removeAttribute(key);
          } else {
            element.setAttribute(key, String(newValue));
          }
        }
      });
    }

    private _getKey = (node: PropsElement<HTMLElement>) => node?.__props__?.key ?? node?.dataset?.key;

    private _isSameNode = (a: PropsElement<HTMLElement>, b: PropsElement<HTMLElement>) => this._getKey(a) === this._getKey(b) && a.nodeName === b.nodeName;

    private _createKeyMap = (nodes: Array<PropsElement<HTMLElement>>, start: number, end: number) => {
      const map = {};
      for (let i = start; i <= end; i++) {
        const node = nodes[i];
        const key = this._getKey(node);
        if (key) map[key] = i;
      }
      return map;
    };

    private _patchChildren(parent: PropsElement<HTMLElement>, newChildren: Array<PropsElement<HTMLElement>>, oldChildren: Array<PropsElement<HTMLElement>>) {
      let oldStartIndex = 0, newStartIndex = 0;
      let oldEndIndex = oldChildren.length - 1;
      let newEndIndex = newChildren.length - 1;
      let oldStartNode = oldChildren[0];
      let oldEndNode = oldChildren[oldEndIndex];
      let newStartNode = newChildren[0];
      let newEndNode = newChildren[newEndIndex];
      let oldKeyMap = null;

      /**
       * This is the core of a highly efficient keyed reconciliation algorithm. It uses a
       * two-pointer approach to diff the lists of children, minimizing DOM operations.
       *
       * ALGORITHM STRATEGY:
       * 1. Two-Pointer Comparison: It uses four pointers (oldStart, oldEnd, newStart, newEnd)
       *    to compare nodes at both ends of the lists simultaneously.
       *
       * 2. Optimistic Fast Paths: It first checks for the most common, low-cost scenarios
       *    (e.g., matching nodes at the ends, nodes moving between ends). If a fast path
       *    is found, it performs the update and continues to the next iteration.
       *
       * 3. Key-Based Fallback: If no fast path applies, it falls back to a key-based lookup.
       *    - It lazily creates a map of keys from the remaining old children for fast searching.
       *    - If the new node's key is not in the map, it's a new element and is created.
       *    - If the key exists, the corresponding old node is patched and moved to the correct
       *      position. Its old spot is marked as `undefined` to prevent reprocessing.
       */
      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // Skip over "holes" left by nodes that have been moved.
        if (oldStartNode === undefined) {
          oldStartNode = oldChildren[++oldStartIndex];
          continue;
        }

        if (oldEndNode === undefined) {
          oldEndNode = oldChildren[--oldEndIndex];
          continue;
        }

        // Case 1: Nodes at the start of both lists are the same.
        if (this._isSameNode(oldStartNode, newStartNode)) {
          this._patch(parent, newStartNode, oldStartNode);
          oldStartNode = oldChildren[++oldStartIndex];
          newStartNode = newChildren[++newStartIndex];
          continue;
        }

        // Case 2: Nodes at the end of both lists are the same.
        if (this._isSameNode(oldEndNode, newEndNode)) {
          this._patch(parent, newEndNode, oldEndNode);
          oldEndNode = oldChildren[--oldEndIndex];
          newEndNode = newChildren[--newEndIndex];
          continue;
        }

        // Case 3: An item moved from the start of the old list to the end of the new list.
        if (this._isSameNode(oldStartNode, newEndNode)) {
          this._patch(parent, newEndNode, oldStartNode);
          parent.insertBefore(oldStartNode, oldEndNode.nextSibling); // Move the node to the end.
          oldStartNode = oldChildren[++oldStartIndex];
          newEndNode = newChildren[--newEndIndex];
          continue;
        }

        // Case 4: An item moved from the end of the old list to the start of the new list.
        if (this._isSameNode(oldEndNode, newStartNode)) {
          this._patch(parent, newStartNode, oldEndNode);
          parent.insertBefore(oldEndNode, oldStartNode); // Move the node to the start.
          oldEndNode = oldChildren[--oldEndIndex];
          newStartNode = newChildren[++newStartIndex];
          continue;
        }

        // If no optimistic checks worked, use the key map.
        if (!oldKeyMap) {
          oldKeyMap = this._createKeyMap(oldChildren, oldStartIndex, oldEndIndex);
        }

        const key = this._getKey(newStartNode);
        const indexInOld = oldKeyMap[key];

        if (indexInOld == null) {
          // The new node is a new element. Create and insert it.
          parent.insertBefore(newStartNode, oldStartNode);
        } else {
          // The new node exists but was moved.
          const nodeToMove = oldChildren[indexInOld];
          // Patch its properties.
          this._patch(parent, newStartNode, nodeToMove);
          // Move it to the correct position.
          parent.insertBefore(nodeToMove, oldStartNode);
          // Mark its old position as a "hole".
          oldChildren[indexInOld] = undefined;
        }

        newStartNode = newChildren[++newStartIndex];
      }

      /**
       * We are now potentially in one of two possible states where cleanup is required:
       *
       * 1. We ran out of old children to compare (oldStartIndex > oldEndIndex): This means every original
       *    child has been matched, moved, or patched. If there are still children left in the new list
       *    (newStartIndex <= newEndIndex), they must be brand-new nodes that need to be added to the DOM.
       *
       * 2. We ran out of new children to compare (newStartIndex > newEndIndex): This means every child in
       *    the new render has been reconciled against the DOM. If there are still children left in the old
       *    list (oldStartIndex <= oldEndIndex), they must be nodes that were removed and now need to
       *    be deleted from the DOM.
       */

      // If there are leftover new nodes, it means they need to be added.
      if (oldStartIndex > oldEndIndex) {
        const refNode = newChildren[newEndIndex + 1] ? oldChildren[oldChildren.length > 0 ? oldStartIndex : 0] : null;
        for (let i = newStartIndex; i <= newEndIndex; i++) {
          parent.insertBefore(newChildren[i], refNode);
        }
        return
      }

      // If there are leftover old nodes, it means they were removed and need to be deleted from the DOM.
      if (newStartIndex > newEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          if (oldChildren[i]) {
            parent.removeChild(oldChildren[i]);
          }
        }
        return
      }
    }

    private _defaultView(){
      throw new Error('Not implemented')
    }

    private _handleRuntimeError(err: any) {
      if (err && err.name === 'UpdatedReadOnly') {
        ContextImpl.context.page.criticalFailure({
          title: 'Failed to update view',
          fileName: 'View.ts',
          lineNumber: 207,
          message: `Cannot modify state directly. Use setState() to update the property "${err.property}".`,
          category: 'APM - View',
        })
        return
      }

      ContextImpl.context.page.criticalFailure({
        title: 'An unexpected error occurred in the view',
        fileName: 'View.ts',
        lineNumber: 0,
        message: err.message,
        category: 'APM - View Runtime',
      });
    }
  }
}
