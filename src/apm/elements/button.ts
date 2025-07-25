module ProcessOut {
  const { button, div } = elements
  export interface ButtonProps extends Props<'button'> {
    variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger'
    size?: 'sm' | 'md' | 'lg',
    loading?: boolean,
  }

  export const Button = (first: ButtonProps | Child, ...children: Child[]) => {
    let userProps, buttonChildren;

    if (isProps(first)) {
      userProps = first;
      buttonChildren = children;
    } else {
      userProps = {};
      buttonChildren = [first, ...children];
    }

    const { className, variant, size, loading, disabled, ...otherProps } = userProps;
    let rest = [div({ className: "content" }, buttonChildren)];

    if (loading) {
      rest = [Loader()]
    }

    const classNames = ["button", size || 'lg', variant || 'primary', loading && 'loading', disabled && 'disabled', className, ].filter(Boolean)

    const props = mergeProps<'button'>({ className: classNames.join(' '), disabled: disabled || loading}, otherProps);

    return button(props, ...rest)
  }
}
