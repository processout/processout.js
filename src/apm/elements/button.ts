module ProcessOut {
  const { button } = elements
  export interface ButtonProps extends Props<'button'> {
    variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger'
    size?: 'sm' | 'md' | 'lg',
    loading?: boolean,
  }

  export const Button = (first: ButtonProps | Child, ...children: Child[]) => {
    const { className, variant, size, loading, disabled, ...userProps } = isProps(first) ? first : {}
    let rest = isProps(first) ? children : [first, ...children];

    if (loading) {
      rest = [Loader()]
    }

    const classNames = ["button", size ?? 'lg', variant ?? 'primary', loading && 'loading', disabled && 'disabled', className, ].filter(Boolean)

    const props = mergeProps<'button'>({ className: classNames.join(' '), disabled: disabled || loading}, userProps);

    return button(props, ...rest)
  }
}
