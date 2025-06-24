module ProcessOut {
  interface SelectProps {
    name: string;
    label: string;
    options: Array<{
      key: string;
      label: string;
    }>
    value?: string;
    disabled?: boolean;
    errored?: boolean;
    className?: string;
    onchange?: (key: string, value: string) => void;
    onblur?: (key: string, value: string) => void;
  }

  const { div, select, option, label: labelEl } = elements
  export const Select = ({ name, label, options, value, disabled, errored, className, onblur, onchange }: SelectProps) => {
    const classNames = [
      "field select filled",
      disabled && 'disabled',
      label && 'has-label',
      value && 'filled',
      errored && 'errored',
      className
    ].filter(Boolean).join(" ")

    const el = select({
      name,
      onchange: (e) => {
        const target = e.target as HTMLSelectElement
        const value = target.value
        onchange && onchange(name, value)
      },
      onblur: (e) => {
        const target = e.target as HTMLSelectElement
        const value = target.value

        target.parentElement.classList.remove("focused", "open")
        onblur && onblur(name, value)
      },
      onfocus: (e) => {
        const target = e.target as HTMLSelectElement
        target.parentElement.classList.add("focused", "open")
      }
    },
      ...options.map(item => {
        return option({ value: item.key, selected: item.key === value }, item.label)
      })
    )

    const children = [label && labelEl({ className: "label" }, label), el, div(
      { className: "select-chevrons md" },
      div({
        className: "chevron up",
      }),
      div({
        className: "chevron down",
      }),
    ),].filter(Boolean)

    return div({ className: classNames }, ...children)
  }
}
