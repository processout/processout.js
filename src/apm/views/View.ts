module ProcessOut {
  export interface APMView<P = unknown> {
    mount(): void
  }

  export type APMViewConstructor<P = unknown> = new(container: Element, shadow: ShadowRoot | Document, props?: P) => APMView<P>
  export type ExtractViewProps<T extends APMViewConstructor> =
    T extends APMViewConstructor<infer P> ? P : never;
  export class APMViewImpl<P = unknown, S = unknown> implements APMView<P> {
    readonly container: Element
    readonly shadow: ShadowRoot | Document
    protected state!: S;
    protected styles: () => CSSText | undefined
    protected props: P

    constructor(container: Element, shadow: ShadowRoot | Document, props: P) {
      this.container = container
      this.shadow = shadow
      this.props = props
    }

    protected setState(partial: Partial<S>) {
      const { mount } = elements;
      this.container.replaceChildren()
      this.state = { ...this.state, ...partial };
      this.applyStyles()
      const view = this.render();
      mount(this.container, view);
    }

    public mount() {
      const { mount } = elements;
      this.applyStyles()
      const view = this.render();
      mount(this.container, view);
    }

    protected render(): Element | DocumentFragment {
      return this.defaultView();
    }

    private applyStyles(): void {
      const raw = this.styles;
      if (raw) {
        const stylesheet = raw.call(this)

        if (typeof stylesheet !== 'string') return;

        injectStyleTag(this.shadow, stylesheet)
      }
    }

    private defaultView() {
      const { h1, h2, h3, div } = elements;

      return div({ className: 'page' },
        h1({ className: 'empty-title' }, 'Components'),
        h2({ className: 'empty-subtitle' }, 'Buttons'),
        div({ className: 'empty-controls' },
          h3("Primary"),
          h3("Secondary"),
          h3("Tertiary"),
          div(Button({ size: 'sm', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary' , disabled: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary', disabled: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary', disabled: true }, 'Refresh')),
        ),
        div({ className: 'empty-controls' },
          h3("Success"),
          h3("Danger"),
          div(),
          div(Button({ size: 'sm', variant: 'success' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'danger' }, 'Refresh')),
          div(),
          div(Button({ size: 'md', variant: 'success'  }, 'Refresh')),
          div(Button({ size: 'md', variant: 'danger'  }, 'Refresh')),
          div(),
          div(Button({ size: 'lg', variant: 'success' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'danger' }, 'Refresh')),
          div(),
          div(Button({ size: 'md', variant: 'success', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'danger', loading: true }, 'Refresh')),
          div(),
        )
      )
    }
  }
}
