module ProcessOut {
  export class APMViewLoading extends APMViewImpl {
    styles = css`
      .loading-page {
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 8px;
      }
    `
    render() {
      return page({ className: "loading-page" },
        Loader(),
      )
    }
  }
}
