module ProcessOut {
  

  export const CancelButton = ({ onClick, config }: { onClick?: () => void, config: APISuccessBase & Partial<PaymentContext> }) => {
    const onCancelClick = () => {
      onClick?.()
      ContextImpl.context.events.emit('request-cancel')
      ContextImpl.context.page.render(APMViewCancelRequest, { config })
    }
    return Button({ onclick: onCancelClick, variant: 'secondary' }, 'Cancel')
  }
}