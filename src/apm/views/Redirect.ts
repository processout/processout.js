module ProcessOut {
    const { div } = elements;
  interface RedirectProps {
    config: APIRedirectBase & Partial<PaymentContext>,
    elements?: APIElements<FormFieldResult>
  }

  export class APMViewRedirect extends APMViewImpl<RedirectProps> {
    handleRedirectClick() {
      ContextImpl.context.poClient.handleAction(
        this.props.config.redirect.url, 
        () => {
            ContextImpl.context.page.load(APIImpl.getCurrentStep)
        },
        () => {}
      )
    }

    handleCancelClick() {
      ContextImpl.context.page.render(APMViewPending, { config: this.props.config });
    }

    render() {
        const redirectLabel = `Pay ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}`;
      return (
        Main({ 
            config: this.props.config, 
            className: "redirect-page",
            hideAmount: true,
            buttons: [
              Button({ onclick: this.handleRedirectClick.bind(this) }, redirectLabel),
              (ContextImpl.context.confirmation.allowCancelation
                ? CancelButton({ onClick: this.handleCancelClick.bind(this), config: this.props.config })
                : null
              )
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