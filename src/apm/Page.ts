module ProcessOut {
  export interface APMPage {
    render<V extends APMViewConstructor>(view: V, props?: ExtractViewProps<V>): void
    load(request: APIRequest): void
    loadScript(name: string, path: string, callback: (error?: Error) => void): void
    cleanUp(): void
  }

  export class APMPageImpl implements APMPage {
    private hostElement: Element;
    private mainContentWrapper: HTMLDivElement | null = null;
    private currentRoot: ShadowRoot | Document | null = null;
    private currentView: APMView | null = null;
    private isReady: boolean = false;
    private pendingOperations: Array<() => void> = [];
    private loadedScripts: Map<string, boolean> = new Map();
    private loadingScripts: Map<string, Array<(error?: Error) => void>> = new Map();

    private state: 'SUCCESS' | 'PENDING' | 'NEXT_STEP_REQUIRED' | 'VALIDATION_ERROR' | 'UNKNOWN'

    constructor(container: Element) {
      this.hostElement = container;
      this.createWrapper(container)
    }

    render<V extends APMViewConstructor>(View: V, props?: ExtractViewProps<V>) {
      if (!this.isReady) {
        // Queue the render operation until the page is ready
        this.pendingOperations.push(() => this.render(View, props));
        return;
      }

      if (this.currentView) {
        this.currentView.unmount()
      }

      const view = new View(this.mainContentWrapper, this.currentRoot, props)
      view.mount()
      this.currentView = view
    }

    load<R extends APIRequest = APIRequest>(request: R, callback?: (err?: any, state?: string) => void) {
      if (!this.isReady) {
        // Queue the load operation until the page is ready
        this.pendingOperations.push(() => this.load(request));
        return;
      }

      (request.bind(APIImpl) as APIRequest)({
        hasConfirmedPending: ContextImpl.context.requirePendingConfirmation
          ? this.state === "PENDING"
          : true,
        onSuccess: ({ elements, ...config }) => {
          this.state = config.state
          callback?.(null, this.state);

          if (config.state === 'NEXT_STEP_REQUIRED') {
            ContextImpl.context.page.render(APMViewNextSteps, { elements, config })
            return
          }

          if (config.state === 'SUCCESS') {
            ContextImpl.context.page.render(APMViewSuccess, { elements, config })
          }

          if (config.state === 'PENDING') {
            ContextImpl.context.page.render(APMViewPending, { elements, config })
          }
        },
        onError: ({ elements, ...config }) => {
          this.state = config.state
          callback?.(config.error);
          ContextImpl.context.page.render(APMViewNextSteps, { elements, config })
        },
        onFailure: data => {
          this.criticalFailure({
            code: data.error.code,
            message: data.error.message,
            title: "Unable to connect",
          })
        },
      })
    }

    criticalFailure({
      title,
      code,
      message,
    }: { message: string, title: string, code?: string, }) {
      ContextImpl.context.events.emit("failure", {
        failure: {
          code: code || 'processout-js.internal-error',
          message,
        },
        paymentState: this.state
      })

      ContextImpl.context.page.render(APMViewError, {
        title: "Unable to connect",
        message: "An unexpected error occurred. We're working to fix this issue, please check back later or contact support if you need assistance.",
        hideRefresh: true
      })
    }

    getActiveElement() {
      return this._getDeepActiveElement(document);
    }

    cleanUp() {
      if (!this.hostElement.firstChild) {
        return
      }

      this.hostElement.removeChild(this.hostElement.firstChild);
    }

    loadScript(name: string, path: string, callback?: (error?: Error) => void): void {
      // Check if script is already loaded
      if (this.loadedScripts.get(name)) {
        callback?.();
        return;
      }

      // Check if script is currently being loaded
      if (this.loadingScripts.has(name)) {
        const callbacks = this.loadingScripts.get(name)!;

        for (var i = 0; i < callbacks.length; i++) {
          if (callbacks[i].toString() === callback.toString()) {
            return;
          }
        }
        
        callbacks.push(callback);
        return;
      }

      // Check if script already exists in the document
      if (document.querySelector(`script[src*="${name}"]`)) {
        this.loadedScripts.set(name, true);
        callback?.();
        return;
      }

      // Initialize callback queue for this script
      this.loadingScripts.set(name, [callback || (() => {})]);

      // Create and load the script
      const script = document.createElement('script');
      script.src = path.startsWith('https://') ? path : ContextImpl.context.poClient.endpoint("js", path);
      
      script.onload = () => {
        this.loadedScripts.set(name, true);
        const callbacks = this.loadingScripts.get(name) || [];
        this.loadingScripts.delete(name);
        
        // Call all waiting callbacks
        for (var i = 0; i < callbacks.length; i++) {
          callbacks[i]();
        }
      };
      
      script.onerror = () => {
        const error = new Error(`Failed to load script: ${name}`);
        const callbacks = this.loadingScripts.get(name) || [];
        this.loadingScripts.delete(name);
        
        // Call all waiting callbacks with error
        for (var i = 0; i < callbacks.length; i++) {
          callbacks[i](error);
        }
      };
      
      // Determine where to append the script based on current context
      const targetDocument = this.currentRoot instanceof Document ? this.currentRoot : document;
      targetDocument.head.appendChild(script);
    }

    private executePendingOperations() {
      // Execute all queued operations now that the page is ready
      const operations = this.pendingOperations.splice(0); // Clear the queue
      operations.forEach(operation => operation());
    }

    private _getDeepActiveElement(root) {
      const activeElement = root.activeElement;

      // 1. Check if the active element is an iframe
      if (activeElement && activeElement.tagName === 'IFRAME') {
        try {
          const iframeDocument = activeElement.contentDocument || activeElement.contentWindow.document;
          return this._getDeepActiveElement(iframeDocument);
        } catch (e) {
          return null;
        }
      }

      // 2. Check if the active element has an 'open' shadowRoot
      // Note: 'closed' shadow roots are not accessible this way.
      // IE11 does not natively support Shadow DOM, so this path is for modern browsers.
      if (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.mode === 'open') {
        // Recursively call for the shadow root
        return this._getDeepActiveElement(activeElement.shadowRoot);
      }

      return activeElement;
    }


    private createWrapper(container: Element) {
      this.cleanUp()

      // --- Determine if Shadow DOM is supported ---
      const supportsShadowDOM = !!(Element.prototype.attachShadow);

      // --- Create New Wrapper based on support ---
      if (!supportsShadowDOM) {
        // Fallback: Use an iframe if Shadow DOM is not supported
        const iframe = document.createElement('iframe');
        iframe.setAttribute('frameBorder', '0');
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.title = 'Content Wrapper'; // Good practice for accessibility

        container.appendChild(iframe); // Append iframe directly to the user's container

        // Setup iframe content after it's loaded to avoid race conditions
        const setupIframeContent = () => {
          const doc = iframe.contentDocument ?? iframe.contentWindow?.document;

          if (doc) {
            // Ensure the iframe has a basic HTML structure if it's not fully loaded
            if (!doc.body) {
              doc.open();
              doc.write(`<!DOCTYPE html><html><head></head><body></body></html>`);
              doc.close();
            }

            // Load fonts into the iframe's head explicitly
            const fontLink1 = doc.createElement('link'); fontLink1.rel = 'preconnect'; fontLink1.href = 'https://fonts.googleapis.com'; doc.head.appendChild(fontLink1);
            const fontLink2 = doc.createElement('link'); fontLink2.rel = 'preconnect'; fontLink2.href = 'https://fonts.gstatic.com'; fontLink2.crossOrigin = 'anonymous'; doc.head.appendChild(fontLink2);
            const fontLink3 = doc.createElement('link'); fontLink3.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap'; fontLink3.rel = 'stylesheet'; doc.head.appendChild(fontLink3);

            // Apply component-specific stylesheet within the iframe's document
            this.setStylesheet(doc);

            // Create the main content wrapper div inside the iframe's body
            this.mainContentWrapper = doc.createElement('div');
            this.mainContentWrapper.className = 'main';
            doc.body.appendChild(this.mainContentWrapper);

            this.currentRoot = doc; // In iframe case, this holds the iframe's Document

            // Mark page as ready and execute any pending operations
            this.isReady = true;
            this.executePendingOperations();
          }
        };

        // Check if iframe is already loaded, otherwise wait for load event
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
          setupIframeContent();
        } else {
          iframe.addEventListener('load', setupIframeContent, { once: true });
        }

        return;
      }

      // 1. Create a new host element for the Shadow DOM
      // This element will be appended to the user-provided container.
      const newShadowHost = document.createElement('div');
      container.appendChild(newShadowHost); // Append the host element to the user's container

      // 2. Attach Shadow DOM to this newly created host element
      const shadowRoot = newShadowHost.attachShadow({ mode: 'open' });
      this.currentRoot = shadowRoot; // Store reference to the ShadowRoot

      // 3. Add font link to the main document's head (only once)
      if (!document.head.querySelector('link[href*="Work+Sans"]')) {
        const fontLink1 = document.createElement('link'); fontLink1.rel = 'preconnect'; fontLink1.href = 'https://fonts.googleapis.com'; document.head.appendChild(fontLink1);
        const fontLink2 = document.createElement('link'); fontLink2.rel = 'preconnect'; fontLink2.href = 'https://fonts.gstatic.com'; fontLink2.crossOrigin = 'anonymous'; document.head.appendChild(fontLink2);
        const fontLink3 = document.createElement('link'); fontLink3.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap'; fontLink3.rel = 'stylesheet'; document.head.appendChild(fontLink3);
      }

      // 4. Apply component-specific stylesheet within the Shadow DOM
      this.setStylesheet(shadowRoot);

      // 5. Create the main content wrapper div inside the Shadow DOM
      this.mainContentWrapper = document.createElement("div");
      this.mainContentWrapper.setAttribute('class', 'main');
      shadowRoot.appendChild(this.mainContentWrapper);

      // For Shadow DOM, mark as ready immediately since it's synchronous
      this.isReady = true;
      this.executePendingOperations();
    }

    private setStylesheet(shadow: ShadowRoot | Document) {
      const stylesheet = ThemeImpl.instance.createStyles();
      injectStyleTag(shadow, stylesheet)
    }
  }
}
