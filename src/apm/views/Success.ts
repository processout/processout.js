module ProcessOut {
  interface SuccessProps {
    config: APISuccessBase & Partial<PaymentContext>,
    elements?: APIElements<FormFieldResult>
  }

  const { div } = elements;

  export class APMViewSuccess extends APMViewImpl<SuccessProps> {
    private timeoutSet = false

    styles = css`
      .success-message {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      .success-page .tick-container {
        width: 112px;
        height: 112px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 8px
      }
      .success-page .tick-background {
        width: 76px;
        height: 76px;
      }

      .success-page .tick-container:before {
        content: "";
        position: absolute;
        width: 76px;
        height: 76px;
        border-radius: 76px;
        z-index: 0;
        animation: grow 2s ease-in-out infinite;
        background-color: ${ThemeImpl.instance.get('palette.light.surface.success')};
        @media (prefers-color-scheme: dark) {
          background-color: ${ThemeImpl.instance.get('palette.dark.surface.success')};
        }
      }
      
      .header-container {
        display: flex;
        flex-direction: column;
        gap: 4px
      }
    `

    private timeout;

    constructor(container: Element, shadow: ShadowRoot | Document, props: SuccessProps) {
      super(container, shadow, props);

      if (ContextImpl.context.success.requiresAction) {
        this.timeout = ContextImpl.context.success.manualDismissDuration;
      } else {
        this.timeout = ContextImpl.context.success.autoDismissDuration;
      }
    }

    handleDoneClick() {
      ContextImpl.context.events.emit('success', { trigger: 'user' });
    }

    render() {
      if (!this.timeoutSet && this.timeout > 0) {
        this.timeoutSet = true
        setTimeout(() => {
          ContextImpl.context.events.emit('success', { trigger: 'timeout' });
        }, this.timeout)
      }

      const title = this.props.config.invoice ? 'Payment approved!' : "You're all set!"
      const description = this.props.config.invoice ? `You paid ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}` : null

      return Main({ 
        config: this.props.config, 
        className: "success-page", 
        hideAmount: true,
        buttons: (() => {
          if (ContextImpl.context.success.requiresAction) {
            return Button({ onclick: this.handleDoneClick.bind(this) }, 'Done');
          } else {
            return null;
          }
        })()
      },
        div({ className: 'success-message' },
          div({ className: 'tick-container' },
            div({ className: 'tick-background' },
            StatusTick({ state: 'completed' }),
            )
          ),
          div({ className: "header-container" },
            Header({ tag: 'h2' }, title),
            description && SubHeader({ tag: 'h3' }, description),
          ),
        ),
        ...(this.props.elements ? renderElements(this.props.elements) : []),
      )
    }
  }
}
