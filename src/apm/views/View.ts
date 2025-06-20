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
      this._patch(this.container as HTMLElement, newView, this.container.firstChild as PropsElement<HTMLElement>);
    }

    /**
     * The entry point for the component. Performs the initial, full render to the DOM.
     */
    public mount() {
      if (this.state) {
        (this as any).state = createReadonlyProxy(this.state);
      }

      this._applyStyles();
      const view = this.render.call(this);
      if (!view) {
        return;
      }

      this._applyRefs(view);
      this._patch(this.container as HTMLElement, view, this.container.firstChild as PropsElement<HTMLElement>);
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

    /**
     * Walks a newly created DOM tree and executes any `ref` callbacks. This ensures
     * that components can get a reference to their live DOM nodes on initial mount.
     * @param node The root node of the tree to traverse.
     */
    private _applyRefs(node: Node) {
      if (!(node instanceof HTMLElement)) return;

      const props = (node as PropsElement<HTMLElement>).__props__;
      if (props && typeof props.ref === 'function') {
        // Execute the ref callback with the live DOM element.
        props.ref(node);
      }

      // Recursively apply refs to all children.
      node.childNodes.forEach(child => this._applyRefs(child));
    }

    private _patch(parent: Element, newNode: PropsElement<HTMLElement> | null, oldNode: PropsElement<HTMLElement> | null) {
      // Case 1: A new node is being added where there was none before.
      if (!oldNode && newNode) {
        this._applyRefs(newNode);
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
        this._applyRefs(newNode);
        parent.replaceChild(newNode, oldNode);
        return;
      }

      // At this point, we know we are mutating the `oldNode` to match the `newNode`.
      // `targetNode` is the live DOM element we will be updating.
      const targetNode = oldNode;

      // Case 4: Handle simple text updates.
      if (targetNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
        if (targetNode.textContent !== newNode.textContent) {
          targetNode.textContent = newNode.textContent;
        }
        return;
      }

      const oldProps = targetNode.__props__ || {};
      const newProps = newNode.__props__ || {};

      // Delegate all attribute/property/event listener updates to the `_patchProps` function.
      this._patchProps(targetNode, oldProps, newProps);
      targetNode.__props__ = newProps;

      // Recursively apply the same patching logic to all the children of the nodes.
      this._patchChildren(
        targetNode,
        Array.from(newNode.childNodes) as Array<PropsElement<HTMLElement>>,
        Array.from(oldNode.childNodes) as Array<PropsElement<HTMLElement>>
      );
    }

    private _patchProps(element: PropsElement<HTMLElement>, oldProps: Props, newProps: Props) {
      if (oldProps === newProps) return;
      const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

      allKeys.forEach(key => {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        // The `ref` callback is handled here during updates.
        if (key === 'ref') {
          if (typeof newValue === 'function') {
            newValue(element);
          }
          return;
        }

        if (oldValue === newValue) return;

        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          if (oldValue) element.removeEventListener(eventName, oldValue);
          if (newValue) element.addEventListener(eventName, newValue);
        } else if (key === 'className' || key === 'class') {
          element.className = newValue || '';
        } else if (key === 'value' || key === 'checked') {
          if (element[key] !== newValue) element[key] = newValue;
        } else if (key !== 'key') {
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
        if (node) {
          const key = this._getKey(node);
          if (key) map[key] = i;
        }
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

      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (oldStartNode === undefined) {
          oldStartNode = oldChildren[++oldStartIndex];
          continue;
        }
        if (oldEndNode === undefined) {
          oldEndNode = oldChildren[--oldEndIndex];
          continue;
        }
        if (this._isSameNode(oldStartNode, newStartNode)) {
          this._patch(parent, newStartNode, oldStartNode);
          oldStartNode = oldChildren[++oldStartIndex];
          newStartNode = newChildren[++newStartIndex];
          continue;
        }
        if (this._isSameNode(oldEndNode, newEndNode)) {
          this._patch(parent, newEndNode, oldEndNode);
          oldEndNode = oldChildren[--oldEndIndex];
          newEndNode = newChildren[--newEndIndex];
          continue;
        }
        if (this._isSameNode(oldStartNode, newEndNode)) {
          this._patch(parent, newEndNode, oldStartNode);
          parent.insertBefore(oldStartNode, oldEndNode.nextSibling);
          oldStartNode = oldChildren[++oldStartIndex];
          newEndNode = newChildren[--newEndIndex];
          continue;
        }
        if (this._isSameNode(oldEndNode, newStartNode)) {
          this._patch(parent, newStartNode, oldEndNode);
          parent.insertBefore(oldEndNode, oldStartNode);
          oldEndNode = oldChildren[--oldEndIndex];
          newStartNode = newChildren[++newStartIndex];
          continue;
        }

        if (!oldKeyMap) {
          oldKeyMap = this._createKeyMap(oldChildren, oldStartIndex, oldEndIndex);
        }
        const key = this._getKey(newStartNode);
        const indexInOld = oldKeyMap[key];

        if (indexInOld == null) {
          parent.insertBefore(newStartNode, oldStartNode);
        } else {
          const nodeToMove = oldChildren[indexInOld];
          this._patch(parent, newStartNode, nodeToMove);
          parent.insertBefore(nodeToMove, oldStartNode);
          oldChildren[indexInOld] = undefined;
        }
        newStartNode = newChildren[++newStartIndex];
      }

      if (oldStartIndex > oldEndIndex) {
        const refNode = newChildren[newEndIndex + 1] ? oldChildren[oldChildren.length > 0 ? oldStartIndex : 0] : null;
        for (let i = newStartIndex; i <= newEndIndex; i++) {
          parent.insertBefore(newChildren[i], refNode);
        }
      } else if (newStartIndex > newEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          if (oldChildren[i]) {
            parent.removeChild(oldChildren[i]);
          }
        }
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
