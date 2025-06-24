module ProcessOut {
  type SubHeaderTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  type SubHeaderTagProps<K extends SubHeaderTag> = Props<K>
  type SubHeaderProps<K extends SubHeaderTag> = SubHeaderTagProps<K> & {
    tag: K
  }
  type HeaderArgs<K extends SubHeaderTag> = [SubHeaderProps<K> | string, string?]

  export const SubHeader = <K extends SubHeaderTag>(...args: HeaderArgs<K>) => {
    const first = args[0]
    const content: string = isProps<K>(first) ? args[1] : first;
    const props: SubHeaderTagProps<K> = isProps<K>(first) ? first : {}
    const tag: SubHeaderTag = props.tag || 'h1';

    delete props.tag

    const className = ["sub-header", props.className].filter(Boolean)

    const el = elements[tag];
    return el({ ...props, className }, content)
  }
}
