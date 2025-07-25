module ProcessOut {
  type SubHeaderTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
  type SubHeaderTagProps<K extends SubHeaderTag> = Props<K>
  type SubHeaderProps<K extends SubHeaderTag> = SubHeaderTagProps<K> & {
    tag: K
  }
  type HeaderArgs<K extends SubHeaderTag> = [SubHeaderProps<K> | string, string?]

  export const SubHeader = <K extends SubHeaderTag>(...args: HeaderArgs<K>) => {
    const first = args[0]
    let content: string;
    let props: SubHeaderTagProps<K>;

    if (isProps<K>(first)) {
      content = args[1];
      props = first;
    } else {
      content = first;
      props = {} as SubHeaderTagProps<K>;
    }
    const tag: SubHeaderTag = props.tag || 'h2';

    delete props.tag

    const className = ["sub-heading", props.className].filter(Boolean).join(' ')

    const el = elements[tag] as any;
    return el({ ...props, className }, content)
  }
}
