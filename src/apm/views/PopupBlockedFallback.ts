module ProcessOut {
  const { div } = elements

  interface PopupBlockedFallbackProps {
    config: APIRedirectBase & Partial<PaymentContext>
    onRetry: () => void
  }

  /**
   * Renders the Pay button UI inside the popup-blocked overlay modal.
   * Used when a headless redirect popup is blocked by the browser — this view
   * is mounted into a fresh APMPageImpl overlaid on document.body so it is
   * always visible regardless of the merchant's container visibility.
   *
   * Cancel confirmation is handled inline (local state) so it renders inside
   * the overlay rather than delegating to ContextImpl.context.page, which is
   * the invisible main container in headless mode.
   */
  export class APMViewPopupBlockedFallback extends APMViewImpl<PopupBlockedFallbackProps> {
    private showingCancelConfirm = false

    private onCancelClick() {
      ContextImpl.context.events.emit('request-cancel')
      this.showingCancelConfirm = true
      this.forceUpdate()
    }

    private onCancelConfirm() {
      ContextImpl.context.events.emit('payment-cancelled')
    }

    private onCancelBack() {
      this.showingCancelConfirm = false
      this.forceUpdate()
    }

    render() {
      if (this.showingCancelConfirm) {
        return (
          Main({
            config: this.props.config,
            hideAmount: true,
            buttons: [
              Button({ onclick: this.onCancelBack.bind(this) }, 'Back to payment'),
              Button({ onclick: this.onCancelConfirm.bind(this), variant: 'secondary' }, 'Cancel payment'),
            ]
          },
            div({ className: 'cancel-request' },
              div({ className: 'cancel-request-message' }, 'Are you sure you want to cancel the payment?')
            ),
          )
        )
      }

      const redirectLabel = `Pay ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}`
      return (
        Main({
          config: this.props.config,
          className: 'redirect-page',
          hideAmount: true,
          buttons: [
            Button({ onclick: this.props.onRetry }, redirectLabel),
            ContextImpl.context.confirmation.allowCancelation
              ? Button({ onclick: this.onCancelClick.bind(this), variant: 'secondary' }, 'Cancel')
              : null
          ]
        },
          div({ className: 'heading-container' },
            Header('Continue to payment'),
            SubHeader('Click the button below to complete your payment'),
          )
        )
      )
    }
  }
}
