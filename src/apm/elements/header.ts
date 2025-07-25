module ProcessOut {
  type HeaderTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
  type HeaderTagProps<K extends HeaderTag> = Props<K>
  type HeaderProps<K extends HeaderTag> = HeaderTagProps<K> & {
    tag: K
  }
  type HeaderArgs<K extends HeaderTag> = [HeaderProps<K> | string, string?]
  export const Header = <K extends HeaderTag>(...args: HeaderArgs<K>) => {
    const first = args[0]
    let content: string;
    let props: HeaderTagProps<K>;

    if (isProps<K>(first)) {
      content = args[1];
      props = first;
    } else {
      content = first;
      props = {} as HeaderTagProps<K>;
    }
    const tag: HeaderTag = props.tag || 'h1';

    delete props.tag

    const className = ["heading", props.className].filter(Boolean).join(' ')

    const el = elements[tag] as any;
    return el({ ...props, className }, content)
  }
}
