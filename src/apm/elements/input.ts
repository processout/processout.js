module ProcessOut {
  const { div, label: labelEl, input } = elements

  export interface InputProps extends Omit<Props<'input'>, 'oninput' | 'onblur' | 'name'> {
    name: string
    label?: string;
    errored?: boolean;
    oninput?: FormFieldUpdate,
    onblur?: FormFieldBlur,
  }

  export const Input = ({ name, className, label, disabled, errored, value, id, type, oninput, onblur, ...props }: InputProps) => {
    const classNames = [
      "field input",
      disabled && !errored && 'disabled',
      label && 'has-label',
      value && 'filled',
      errored && 'errored',
      className
    ].filter(Boolean).join(" ")

    const el = input({
      type: type || "text",
      autocomplete: "on",
      name,
      disabled,
      value,
      id: id || name,
      oninput: (e) => {
        const target = e.target as HTMLInputElement
        const value = target.value

        if (label) {
          if (value.length === 0) {
            target.parentElement.classList.remove("filled")
          } else {
            target.parentElement.classList.add("filled")
          }
        }

        oninput && oninput(name, value)
      },
      onblur: (e) => {
        const target = e.target as HTMLInputElement
        const value = target.value

        target.parentElement.classList.remove("focused")
        onblur && onblur(name, value)
      },
      onfocus: (e) => {
        const target = e.target as HTMLInputElement
        target.parentElement.classList.add("focused")
      },
      ...props,
    })

    const children = [label && labelEl({ className: "label" }, label), el].filter(Boolean)

    return div({
      className: classNames,
    }, ...children)
  }
}
