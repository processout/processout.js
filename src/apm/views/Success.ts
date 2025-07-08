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
        background-color: #e2f0e7;
        z-index: 0;
        animation: grow 1s ease-in-out infinite;
      }
    `

    private timeout = ContextImpl.context.success.requiresAction ? ContextImpl.context.success.manualDismissDuration : ContextImpl.context.success.autoDismissDuration

    handleDoneClick() {
      ContextImpl.context.events.emit('success', { trigger: 'user' });
    }

    render() {
      if (!this.props.config.invoice) {
        ContextImpl.context.events.emit('success', { trigger: 'immediate' });
        return null
      }

      if (!this.timeoutSet && this.timeout > 0)) {
        this.timeoutSet = true
        setTimeout(() => {
          ContextImpl.context.events.emit('success', { trigger: 'timeout' });
        }, this.timeout)
      }

      return Main({ config: this.props.config, className: "success-page", hideAmount: true },
        div({ className: 'success-message' },
          div({ className: 'tick-container' },
            div({ className: 'tick-background' },
            Tick({ state: 'completed' }),
            )
          ),
          div({ className: "header-container" },
            Header({ tag: 'h2' }, 'Payment approved!'),
            SubHeader({ tag: 'h3' }, `You paid ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}`),
          ),
        ),
        ...(this.props.elements ? renderElements(this.props.elements) : []),
        (ContextImpl.context.success.requiresAction
          ? div({ className: "button-container" },
              Button({ onclick: this.handleDoneClick.bind(this) }, 'Done')
            )
          : null
        )
      )
    }
  }
}
