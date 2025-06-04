module ProcessOut {
    export interface APMPage {
      load<D = any>(view: APMViewConstructor, data?: D): void
    }

    export class APMPageImpl implements APMPage {
      private wrapper: Element
      private shadow: ShadowRoot | Document

      constructor(container: Element) {
        this.createWrapper(container)
      }

      load<P = any>(View: APMViewConstructor, props?: P) {
        this.setStylesheet(this.shadow)
        this.wrapper.replaceChildren()
        try {
          const view = new View(this.wrapper, this.shadow, props)
          view.mount()
        } catch (err) {
          console.error(`${View.name} failed to mount`)
          const error = new APMViewError(this.wrapper, this.shadow, { message: 'An issue occured while setting up this view', code: 'pojs.error.view-failed' })
          error.mount()
        }
      }

      private createWrapper(container: Element) {
        const isIE = (() => {
          return !!(document as any).documentMode;
        })();

        if (isIE) {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('frameBorder', '0');
          iframe.style.width = '100%';
          iframe.style.height = '400px';

          container.appendChild(iframe);

          const doc = iframe.contentDocument ?? iframe.contentWindow?.document;

          if (doc) {
            if (!doc.body) {
              doc.open();
              doc.write('<!DOCTYPE html><head></head><body></body>');
              doc.close();
            }

            this.setStylesheet(doc);

            this.wrapper = doc.createElement('div');
            this.wrapper.className = 'main';

            doc.body.appendChild(this.wrapper)
          }

          this.shadow = doc;
          return;
        }

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
