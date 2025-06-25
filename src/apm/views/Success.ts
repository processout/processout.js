module ProcessOut {
  const { div } = elements;

  const Tick = div({ className: "tick" },
    div({ className: "tick-icon" }))

  export class APMViewSuccess extends APMViewImpl<{ config: { invoice: { amount: string, currency: string }, gateway: object }}> {
    styles = css`
      .success-page {
        align-items: center;
      }

      .success-message {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      .tick {
        width: 112px;
        height: 112px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .tick:before {
        content: "";
        position: absolute;
        width: 76px;
        height: 76px;
        border-radius: 76px;
        background-color: #e2f0e7;
        z-index: 0;
        animation: grow 1s ease-in-out infinite;
      }

      .tick-icon {
        position: relative;
        width: 76px;
        height: 76px;
        border-radius: 76px;
        background-color: #119947;
        z-index: 1;
        transform-origin: center;
      }
      .tick-icon:before, .tick-icon:after {
        content: "";
        position: absolute;
        background-color: white;
        transform-origin: bottom center;
        width: 6px;
        bottom: 20px;
        border-radius: 6px;
      }
      .tick-icon:before {
        height: 26px;
        transform: rotate(-35deg);
        left: calc(50% - 3px);
      }
      .tick-icon:after {
        height: 43px;
        transform: rotate(24deg);
        left: calc(50% - 5px);
      }

      @keyframes grow {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        80% {
          transform: scale(1.5);
          opacity: 1;
        }
        85% {
          transform: scale(1.5);
          opacity: 1;
        }
        86% {
          opacity: 0;
          transform: scale(1.5);
        }
        100% {
          opacity: 0;
          transform: scale(0.8);
        }
      }
    `

    handleDoneClick() {
      ContextImpl.context.events.emit('success');
    }

    render() {
      return page({ className: "success-page" },
        div({ className: 'success-message' },
          Tick,
          div({ className: "header-container" },
            Header({ tag: 'h2' }, 'Payment approved!'),
            SubHeader({ tag: 'h3' }, `You paid ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}`),
          ),
        ),
        div({ className: "button-container" },
          Button({ onclick: this.handleDoneClick.bind(this) }, 'Done')
        )
      )
    }
  }
}
