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
      this.defaultView();
      return null
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
      throw new Error('Not implemented')
    }
  }
}
