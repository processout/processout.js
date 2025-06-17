module ProcessOut {
  export interface APMPage {
    render<V extends APMViewConstructor>(view: V, props?: ExtractViewProps<V>): void
    load(request: APIRequest): void
  }

  export class APMPageImpl implements APMPage {
    public wrapper: Element
    private shadow: ShadowRoot | Document

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
        onSuccess: ({ elements, ...config }) => {
          if (elements && elements.length > 0) {
            ContextImpl.context.page.render(APMViewElements, { elements, config })
          }
        },
        onError: data => {
          ContextImpl.context.page.render(APMViewError, {
            code: data.error.code,
            message: data.error.message,
          })
        },
        onFailure: data => {
          this.criticalFailure({
            fileName: "Page.ts",
            lineNumber: 44,
            code: data.error.code,
            message: data.error.message,
            title: "Unable to connect"
          })
        },
      })
    }

    criticalFailure({
      title,
      code,
      message,
      ...rest
    }: Omit<ErrorReport, "stack"> & { code?: string, title?: string}) {
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
