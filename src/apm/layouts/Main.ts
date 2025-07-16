module ProcessOut {
    const { div, img, picture, source } = elements

    interface MainProps extends Props<'div'> {
        config?: Partial<PaymentContext>,
        hideAmount?: boolean,
        buttons: VNode | VNode[],
    }

    export function Main({ config, hideAmount, buttons, ...props }: MainProps, ...children: VNode[]) {
        return (
            page(props,
                config?.payment_method 
                    ? div({ className: 'header' },
                        div({ className: 'logo' },
                            picture({},
                                source({ 
                                    media: '(prefers-color-scheme: dark)',
                                    srcset: config.payment_method.logo.dark_url.raster
                                }),
                                img({ 
                                    src: config.payment_method.logo.light_url.raster, 
                                    alt: config.payment_method.display_name, 
                                    height: 34 
                                })
                            )
                        ),
                        !hideAmount && config.invoice ? div({ className: 'amount' },
                            `Pay ${formatCurrency(config.invoice.amount, config.invoice.currency)}`
                        ) : null
                    ) 
                    : null,
                div({ className: 'container'},
                    ...children,
                    buttons ? div({ className: 'buttons-container' },
                        ...(Array.isArray(buttons) ? buttons : [buttons])
                    ) : null
                ),
            )
        )
    }
}