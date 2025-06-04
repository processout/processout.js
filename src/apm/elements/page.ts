module ProcessOut {
  const { div } = elements
  export const page: GenerateTag<'div'> = (first: Props<HTMLElementTagNameMap['div']> | Child, ...children: Child[]) => {
    const userProps = isProps(first) ? first : undefined;
    const rest  = isProps(first) ? children : [first, ...children];

    const props = mergeProps<HTMLElement>({ className: "page" }, userProps);

    return div(props, ...rest)
  }
}
