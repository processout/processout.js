module ProcessOut {
    interface PendingProps {
      config: APISuccessBase & Partial<PaymentContext>,
      elements?: APIElements<FormFieldResult>
    }
  
    const { div } = elements;
  
    export class APMViewPending extends APMViewImpl<PendingProps, { confirmed: boolean, countdown: number }> {
      styles = css`
        .steps {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .step {
          display: flex;
          gap: 12px;
          position: relative;
        }
    
        .step-status {
          width: 24px;
          height: 24px;
          position: relative;
        }

        .step::after {
          content: '';
          position: absolute;
          top: 24px;
          bottom: -28px;
          left: 13px;
          transform: translateX(-50%);
          width: 2px;
          border-left: 2px dashed #D1D5DB;
        }

        .step.completed::after {
          border-left-color: #4CAF50;
        }

        .step:last-child::after {
          display: none;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }

        .step-title {
          font-weight: 500;
          font-size: 15px;
          line-height: 18px;
        }

        .step-description {
          font-weight: 500;
          font-size: 12px;
          line-height: 14px;
          color: #585A5F;
        }
      `

      state = {
        countdown: storage.get('pending.countdown', ContextImpl.context.confirmation.timeout),
        confirmed: storage.get('pending.confirmed', ContextImpl.context.confirmation.requiresAction ? false : true)
      }

      private intervalId: number | null = null
      private startTime: number = 0

      componentDidMount() {
        this.startTime = Date.now()
        this.setState(state => ({ 
          ...state,
          countdown: MIN_15 / 1000 // 15 minutes in seconds
        }))

        if (this.state.confirmed) {
          ContextImpl.context.events.emit('payment-pending')
        }
        
        this.intervalId = window.setInterval(() => {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
          const remaining = Math.max(0, ContextImpl.context.confirmation.timeout - elapsed) // 15 minutes in seconds
          
          storage.set('pending.countdown', remaining)
          this.setState(state => ({
            ...state,
            countdown: remaining
          }))
          
          if (remaining <= 0 && this.intervalId) {
            window.clearInterval(this.intervalId)
            this.intervalId = null
          }
        }, 1000)
      }

      componentWillUnmount() {
        if (this.intervalId) {
          window.clearInterval(this.intervalId)
          this.intervalId = null
        }
      }
  
      formatCountdown(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds.toString()
        return `${minutes}:${formattedSeconds}`
      }

      handleConfirmClick() {
        storage.set('pending.confirmed', true)
        this.setState(state => ({
          ...state,
          confirmed: true
        }))
        ContextImpl.context.events.emit('pending-confirmed')
        ContextImpl.context.page.load(APIImpl.initialise)
      }

      handleCancelClick() {
        APIImpl.cancelPolling()
        ContextImpl.context.events.emit('request-cancel')
      }

      render() {
        const { confirmed } = this.state
        const steps: Array<{ status: 'completed' | 'pending' | 'idle', title: string, description?: string, elements?: APIElements<FormFieldResult> }> = [
          {
            status: !confirmed ? 'pending' : 'completed',
            title: !confirmed ? 'Waiting for transfer' : 'Transfer sent',
          },
          {
            status: !confirmed? 'idle' : 'pending',
            title: 'Waiting for confirmation',
            description: confirmed ? `Please wait for ${this.formatCountdown(this.state.countdown)} minutes` : undefined,
            elements: this.props?.elements
          },
        ]

        return Main({ config: this.props.config, className: "pending-page" },
          div({ className: "steps" },
            ...steps.map(step => div({ className: `step ${step.status}` },
              div({ className: "step-status" }, Tick({ state: step.status })),
              div({ className: "step-content" },
                div({ className: "step-title" }, step.title),
                step.description ? div({ className: "step-description" }, step.description) : null,
                step.elements ? renderElements(step.elements) : null
              )
            ))
          ),
          (!confirmed
            ? div({ className: "button-container" },
                Button({ onclick: this.handleConfirmClick.bind(this) }, 'Confirm transfer')
              )
            : null
          ),
          (ContextImpl.context.confirmation.allowCancelation
            ? div({ className: "button-container" },
                Button({ onclick: this.handleCancelClick.bind(this) }, 'Cancel')
              )
            : null
          )
        )
      }
    }
  }
  