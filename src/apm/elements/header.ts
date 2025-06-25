module ProcessOut {
  type HeaderTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  type HeaderTagProps<K extends HeaderTag> = Props<HTMLElementTagNameMap[K]>
  type HeaderProps<K extends HeaderTag> = HeaderTagProps<K> & {
    tag: K
  }
  type HeaderArgs<K extends HeaderTag> = [HeaderProps<K> | string, string?]
  export const Header = <K extends HeaderTag>(...args: HeaderArgs<K>) => {
    const first = args[0]
    const content: string = isProps<K>(first) ? args[1] : first;
    const props: HeaderTagProps<K> = isProps<K>(first) ? first : {}
    const tag: HeaderTag = props.tag || 'h1';

    delete props.tag

    const className = ["header", props.className].filter(Boolean)

    const el = elements[tag];
    return el({ ...props, className }, content)
  }
}
