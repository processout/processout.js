module ProcessOut {
    const { div, img, picture, source } = elements

    interface MainProps extends Props<'div'> {
        config?: Partial<PaymentContext>,
        hideAmount?: boolean,
        buttons: VNode | VNode[],
    }

    export function Main({ config, hideAmount, buttons, ...props }: MainProps, ...children: VNode[]) {
        let header = null;
        let amount = null;
        let buttonsContainer = null;

        if (!hideAmount && config && config.invoice) {
            amount = div({ className: 'amount' },
                `Pay ${formatCurrency(config.invoice.amount, config.invoice.currency)}`
            )
        }

        if (config && config.payment_method) {
            header = div({ className: 'header' },
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
                amount
            )
        }

        if (buttons) {
            let content = buttons;

            if (!Array.isArray(content)) {
                content = [content];
            }
            
            buttonsContainer = div({ className: 'buttons-container' },
                ...content
            )
        }

        return (
            page(props,
                header,
                div({ className: 'container'},
                    ...children,
                    buttonsContainer
                ),
            )
        )
    }
}