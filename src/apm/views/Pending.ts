module ProcessOut {
    interface PendingProps {
      config: APISuccessBase & Partial<PaymentContext>,
      elements?: APIElements<FormFieldResult>
    }
  
    const { div } = elements;
  
    export class APMViewPending extends APMViewImpl<PendingProps, { countdown: number }> {
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
          border-left: 2px dashed;
          z-index: 2;
          border-left-color: ${ThemeImpl.instance.get('palette.light.border.icon.tertiary')};
          @media (prefers-color-scheme: dark) {
            border-left-color: ${ThemeImpl.instance.get('palette.dark.border.icon.tertiary')};
          }
        }

        .step.completed::after {
          border-left-color: ${ThemeImpl.instance.get('palette.light.surface.success')};
          @media (prefers-color-scheme: dark) {
            border-left-color: ${ThemeImpl.instance.get('palette.dark.surface.success')};
          }
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
          color: ${ThemeImpl.instance.get('palette.light.text.secondary')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.secondary')};
          }
        }
      `

      state = {
        countdown: this.calculateCountdown(), 
      }

      private intervalId: number | null = null

      private get confirmed(): boolean {
        if (!ContextImpl.context.confirmation.requiresAction || !this.props.elements?.length) {
          return true
        }

        return !!storage.get('pending.startTime')
      }

      private calculateCountdown(): number {
        // If not confirmed yet, return full timeout
        if (!this.confirmed) {
          return ContextImpl.context.confirmation.timeout
        }
        
        const startTime = storage.get('pending.startTime', Date.now())
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        return Math.max(0, ContextImpl.context.confirmation.timeout - elapsed)
      }

      componentDidMount() {
        if (!this.confirmed) {
          return;
        }

        ContextImpl.context.events.emit('payment-pending')
        this.startTimer()
      }

      componentWillUnmount() {
        if (this.intervalId) {
          window.clearInterval(this.intervalId)
          this.intervalId = null
        }
        // Clean up timer state
        storage.remove('pending.startTime')
      }

      private startTimer() {
        // Get the original start time from storage, or use current time if not available
        const originalStartTime = storage.get('pending.startTime', Date.now())
        
        this.intervalId = window.setInterval(() => {
          const elapsed = Math.floor((Date.now() - originalStartTime) / SECOND_1)
          const remaining = Math.max(0, ContextImpl.context.confirmation.timeout - elapsed)
          
          this.setState(state => ({
            ...state,
            countdown: remaining
          }))
          
          if (remaining <= 0 && this.intervalId) {
            window.clearInterval(this.intervalId)
            this.intervalId = null
            // Clean up timer state when timer completes
            storage.remove('pending.startTime')
          }
        }, SECOND_1)
      }
  
      formatCountdown(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds.toString()
        return `${minutes}:${formattedSeconds}`
      }

      handleConfirmClick() {
        const startTime = Date.now()
        
        // Store the start time for timer synchronization across refreshes
        storage.set('pending.startTime', startTime)
        
        ContextImpl.context.events.emit('pending-confirmed')
        ContextImpl.context.page.load(APIImpl.getCurrentStep)
        
        this.startTimer()
      }

      handleCancelClick() {
        APIImpl.cancelPolling()
      }

      render() {
        const confirmed = this.confirmed
        const steps: Array<{ status: 'completed' | 'pending' | 'idle', title: string, description?: string, elements?: APIElements<FormFieldResult> }> = [
          {
            status: !confirmed ? 'pending' : 'completed',
            title: !confirmed ? 'Waiting for payment' : 'Payment sent',
          },
          {
            status: !confirmed? 'idle' : 'pending',
            title: 'Waiting for confirmation',
            description: confirmed ? `Please wait up to ${this.formatCountdown(this.state.countdown)} minutes` : undefined,
            elements: this.props?.elements
          },
        ]

        return Main({ 
          config: this.props.config, 
          className: "pending-page",
          buttons: [
            (!confirmed
              ? Button({ onclick: this.handleConfirmClick.bind(this) }, 'I have sent the payment')
              : null
            ),
            (ContextImpl.context.confirmation.allowCancelation
              ? CancelButton({ onClick: this.handleCancelClick.bind(this), config: this.props.config })
              : null
            )
          ]
        },
          div({ className: "steps" },
            ...steps.map(step => div({ className: `step ${step.status}` },
              div({ className: "step-status" }, StatusTick({ state: step.status })),
              div({ className: "step-content" },
                div({ className: "step-title" }, step.title),
                step.description ? div({ className: "step-description" }, step.description) : null,
                step.elements ? renderElements(step.elements) : null
              )
            ))
          )
        )
      }
    }
  }
  