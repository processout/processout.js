module ProcessOut {
  const { div } = elements

  export const page: GenerateTag<'div'> = (...args: GenerateTagArgs<'div'>) => {
    const first = args[0];
    const children = args.slice(1) as Child[];

    const userProps = isProps(first) ? first : {}
    const rest  = isProps(first) ? children : [first, ...children];

    const props = mergeProps<'div'>({ className: "page" }, userProps);

    return div(props, ...rest)
  }
}
