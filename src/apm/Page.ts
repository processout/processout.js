module ProcessOut {
  export interface APMPage {
    render<V extends APMViewConstructor>(view: V, props?: ExtractViewProps<V>): void
    load(request: APIRequest): void
    cleanUp(): void
  }

  export class APMPageImpl implements APMPage {
    public wrapper: Element
    private shadow: ShadowRoot | Document
    private state: 'SUCCESS' | 'PENDING' | 'NEXT_STEP_REQUIRED' | 'VALIDATION_ERROR' | 'UNKNOWN'

    constructor(container: Element) {
      this.createWrapper(container)
    }

    render<V extends APMViewConstructor>(View: V, props?: ExtractViewProps<V>) {
      this.setStylesheet(this.shadow)
      const view = new View(this.wrapper, this.shadow, props)
      view.mount()
    }

    load<R extends APIRequest = APIRequest>(request: R) {
      (request.bind(APIImpl) as APIRequest)({
        hasConfirmedPending: ContextImpl.context.requirePendingConfirmation
          ? this.state === "PENDING"
          : true,
        onSuccess: ({ elements, ...config }) => {
          this.state = config.state

          if (elements && elements.length > 0) {
            ContextImpl.context.page.render(APMViewNextSteps, { elements, config })
            return
          }
        },
        onError: ({ elements, ...config }) => {
          this.state = config.state
          ContextImpl.context.page.render(APMViewNextSteps, { elements, config })
        },
        onFailure: data => {
          this.criticalFailure({
            host: window?.location?.host || '',
            fileName: "Page.ts",
            lineNumber: 44,
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
      ...rest
    }: Omit<Parameters<TelemetryClient['reportError']>[0], "stack"> & { code?: string, title?: string}) {
      ContextImpl.context.events.emit("critical-failure", {
        code: code || 'processout-js.internal-error',
        message,
      })
      ContextImpl.context.logger.error({
        ...rest,
        message,
      })
      ContextImpl.context.page.render(APMViewError, {
        title,
        message: "An unexpected error occurred. We're working to fix this issue, please check back later or contact support if you need assistance.",
        hideRefresh: true
      })
    }

    getActiveElement() {
      return this._getDeepActiveElement(document);
    }

    cleanUp() {
      if (!this.wrapper) {
        return
      }

      this.wrapper.remove()
      this.shadow.parentElement.shadowRoot.removeChild(this.shadow)
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
      if (this.wrapper) {
        return;
      }

      const supportsShadowDOM = (() => {
        return !!(Element.prototype.attachShadow);
      })();


      if (!supportsShadowDOM) {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('frameBorder', '0');
        iframe.style.width = '100%';
        iframe.style.height = '400px';

        container.appendChild(iframe);

        const doc = iframe.contentDocument ?? iframe.contentWindow?.document;

        if (doc) {
          if (!doc.body) {
            doc.open();
            doc.write(`<!DOCTYPE html><head></head><body></body>`);
            doc.close();
          }

          doc.head.innerHTML = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap" rel="stylesheet">';

          this.setStylesheet(doc);

          this.wrapper = doc.createElement('div');
          this.wrapper.className = 'main';

          doc.body.appendChild(this.wrapper)
        }

        this.shadow = doc;
        return;
      }

      document.head.innerHTML += '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap" rel="stylesheet">';

      const shadow = container.attachShadow({ mode: 'open' })
      this.setStylesheet(shadow)

      this.wrapper = document.createElement("div")
      this.wrapper.setAttribute('class', 'main')

      shadow.appendChild(this.wrapper)

      this.shadow = shadow;
    }



    private setStylesheet(shadow: ShadowRoot | Document) {
      const stylesheet = ThemeImpl.instance.createStyles();
      injectStyleTag(shadow, stylesheet)
    }
  }
}
