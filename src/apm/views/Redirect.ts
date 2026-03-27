module ProcessOut {
  const { div } = elements;
  interface RedirectProps {
    config: APIRedirectBase & Partial<PaymentContext>,
    elements?: APIElements<FormFieldResult>
  }

  export class APMViewRedirect extends APMViewImpl<RedirectProps> {
    /** After a retryable headless error (e.g. pop-up blocked), show the normal Pay / Cancel UI. */
    private headlessManualFallback = false

    styles = css`
      .redirect-headless-loading {
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 8px;
        min-height: 120px;
      }
      .redirect-headless-empty {
        min-height: 0;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    `

    protected componentDidMount(): void {
      const headless = ContextImpl.context.redirect && ContextImpl.context.redirect.enableHeadlessMode
      if (headless && !this.headlessManualFallback) {
        this.handleRedirectClick()
      }
    }

    handleRedirectClick() {
      ContextImpl.context.events.emit('redirect-initiated')
      const pm = this.props.config.payment_method
      const actionOptions = pm
        ? new ActionHandlerOptions(
            pm.gateway_name.toLowerCase(),
            pm.logo && pm.logo.light_url ? pm.logo.light_url.raster : undefined,
          )
        : new ActionHandlerOptions()
      const redir = ContextImpl.context.redirect
      if (redir && redir.actionOverlayMountParent != null) {
        actionOptions.overlayMountParent = redir.actionOverlayMountParent
      }
      ContextImpl.context.poClient.handleAction(
        this.props.config.redirect.url,
        () => {
            ContextImpl.context.events.emit('redirect-completed')
            ContextImpl.context.page.load(APIImpl.getCurrentStep)
        },
        (err) => {
          const failure = {
            message: err.message,
            code: err.code,
          }
          const headless = ContextImpl.context.redirect && ContextImpl.context.redirect.enableHeadlessMode
          if (headless) {
            if (!this.headlessManualFallback && failure.code === 'customer.popup-blocked') {
              this.headlessManualFallback = true
              this.forceUpdate()
              return
            }
            if (this.headlessManualFallback) {
              ContextImpl.context.events.emit('failure', { failure })
              return
            }
            const silentFailureView = !!(redir && redir.silentFailureView)
            ContextImpl.context.page.criticalFailure(
              {
                title: 'Could not open payment',
                code: failure.code,
                message: failure.message,
              },
              { renderErrorView: !silentFailureView },
            )
            return
          }
          ContextImpl.context.events.emit('failure', { failure })
        },
        actionOptions,
      )
    }

    render() {
      const headless = ContextImpl.context.redirect && ContextImpl.context.redirect.enableHeadlessMode
      if (headless && !this.headlessManualFallback) {
        const showLoader =
          !ContextImpl.context.redirect || ContextImpl.context.redirect.showHeadlessLoader !== false
        if (showLoader) {
          return page({ className: 'redirect-headless-loading' }, Loader())
        }
        return page({ className: 'redirect-headless-empty', 'aria-hidden': 'true' })
      }

      const redirectLabel = `Pay ${formatCurrency(this.props.config.invoice.amount, this.props.config.invoice.currency)}`;
      return (
        Main({ 
            config: this.props.config, 
            className: "redirect-page",
            hideAmount: true,
            buttons: [
              Button({ onclick: this.handleRedirectClick.bind(this) }, redirectLabel),
              (() => {
                if (ContextImpl.context.confirmation.allowCancelation) {
                  return CancelButton({ config: this.props.config });
                } else {
                  return null;
                }
              })()
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