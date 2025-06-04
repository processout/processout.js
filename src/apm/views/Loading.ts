module ProcessOut {
  export class APMViewLoading extends APMViewImpl {
    styles = css`
      .loading-page {
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 8px;
      }

      .loader {
        width: 30px;
        height: 30px;
        border: 3px solid #000;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }

      .loader-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `
    render() {
      const { div } = elements;

      return page({ className: "loading-page" },
        div({ className: 'loader' }),
      )
    }
  }
}
