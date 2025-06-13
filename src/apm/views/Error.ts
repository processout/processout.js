module ProcessOut {
  export class APMViewError extends APMViewImpl<{ title?:string, message?: string, code?: string, hideRefresh?: boolean }> {
    styles = css`
      .error-page {
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 24px;
        text-align: center;
      }

      .error-title {
        font-size: 24px;
      }

      .error-description {
        font-size: 18px;
      }

      @container main (max-width: 372px) {
        .error-page {
          gap: 18px;
        }

        .error-title {
          font-size: 20px;
        }

        .error-description {
          font-size: 16px;
        }
      }
    `

    onRefreshClick() {
      void ContextImpl.context.reload()
    }

    render() {
      const { h1, p } = elements

      return page({ className: "error-page"},
        h1({ className: 'error-title' }, this.props.title || 'Whoops! Something went wrong.'),
        p({ className: 'error-description' }, this.props.message || 'We apologize for the inconvenience.'),
        !this.props.hideRefresh
          ? Button({ className: 'error-refresh', onclick: this.onRefreshClick.bind(this) }, 'Refresh')
          : null,
      )
    }
  }
}
