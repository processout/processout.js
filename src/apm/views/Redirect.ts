module ProcessOut {
  const { div } = elements;
  interface RedirectProps {
    config: APIRedirectBase & Partial<PaymentContext>,
    elements?: APIElements<FormFieldResult>
  }

  export class APMViewRedirect extends APMViewImpl<RedirectProps> {
    /** After a retryable headless error (e.g. pop-up blocked), show the normal Pay / Cancel UI. */
    private headlessManualFallback = false

    /** Overlay mounted on document.body when popup is blocked in headless mode. */
    private popupBlockedOverlayEl: HTMLElement | null = null
    private popupBlockedOverlayPage: APMPageImpl | null = null

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

    private showPopupBlockedFallbackOverlay() {
      // Full-screen backdrop with centered content card
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;'
      document.body.appendChild(overlay)
      this.popupBlockedOverlayEl = overlay

      // Inner wrapper gives APMPageImpl a bounded container to render into
      const content = document.createElement('div')
      content.style.cssText = 'width:100%;max-width:400px;'
      overlay.appendChild(content)

      const overlayPage = new APMPageImpl(content)
      this.popupBlockedOverlayPage = overlayPage

      overlayPage.render(APMViewPopupBlockedFallback, {
        config: this.props.config,
        onRetry: () => {
          this.removePopupBlockedFallbackOverlay()
          this.handleRedirectClick()
        },
      })

      // Auto-clean up when the payment reaches a terminal state
      const remove = () => this.removePopupBlockedFallbackOverlay()
      ContextImpl.context.events.on('success', remove)
      ContextImpl.context.events.on('failure', remove)
      ContextImpl.context.events.on('payment-cancelled', remove)
    }

    private removePopupBlockedFallbackOverlay() {
      if (this.popupBlockedOverlayEl) {
        this.popupBlockedOverlayEl.remove()
        this.popupBlockedOverlayEl = null
        this.popupBlockedOverlayPage = null
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
              // popupBlockedOverlay: true (default) → mount SDK Pay button overlay on document.body,
              //                               always visible regardless of container visibility.
              // popupBlockedOverlay: false → suppress SDK overlay; merchant handles redirect-popup-blocked.
              if (!redir || redir.popupBlockedOverlay !== false) {
                this.showPopupBlockedFallbackOverlay()
              }
              // Always emit so merchants can provide their own UI if needed.
              // retry() must be called from a real user-gesture handler.
              ContextImpl.context.events.emit('redirect-popup-blocked', {
                retry: this.handleRedirectClick.bind(this),
              })
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