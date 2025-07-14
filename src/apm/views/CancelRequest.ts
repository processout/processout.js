module ProcessOut {
  const { div } = elements

  interface CancelRequestProps {
    config: APISuccessBase & Partial<PaymentContext>,
  }

  export class APMViewCancelRequest extends APMViewImpl<CancelRequestProps> {
    onCancelClick() {
      ContextImpl.context.events.emit('payment-cancelled')
    } 
    onBackClick() {
      ContextImpl.context.page.load(APIImpl.getCurrentStep)
    }

    render() {
      return Main({ config: this.props.config, hideAmount: true, buttons: [
        Button({ onclick: this.onCancelClick.bind(this), variant: 'secondary' }, 'Cancel payment'),
        Button({ onclick: this.onBackClick.bind(this) }, 'Back to payment')
      ] },
        div({ className: 'cancel-request' },
          div({ className: 'cancel-request-message' }, 'Are you sure you want to cancel the payment?')
        ),
      )
    }
  }
}