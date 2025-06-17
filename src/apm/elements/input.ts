module ProcessOut {
  const { div, label: labelEl, input } = elements

  export interface InputProps extends Omit<Props<HTMLElementTagNameMap['input']>, 'oninput' | 'onblur' | 'name'> {
    name: string
    label?: string;
    errored?: boolean;
    oninput?: (key: string, value: string) => void,
    onblur?: (key: string, value: string) => void,
  }

  export const Input = ({ name, className, label, disabled, errored, value, id, type, oninput, onblur, ...props }: InputProps) => {
    const classNames = [
      "field input",
      disabled && 'disabled',
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
        oninput && oninput(name, value)
      },
      onblur: (e) => {
        const target = e.target as HTMLInputElement
        const value = target.value
        oninput && oninput(name, value)
      },
      ...props,
    })

    el.addEventListener("input", e => {
      if (!label) {
        return
      }

      const target = e.target as HTMLInputElement
      const value = target.value

      if (value.length === 0) {
        target.parentElement.classList.remove("filled")
      } else {
        target.parentElement.classList.add("filled")
      }
    })

    el.addEventListener("focus", e => {
      const target = e.target as HTMLInputElement
      target.parentElement.classList.add("focused")
    })

    el.addEventListener("blur", e => {
      const target = e.target as HTMLInputElement
      target.parentElement.classList.remove("focused")
    })
    const children = [label && labelEl({ className: "label" }, label), el].filter(Boolean)

    return div({
      className: classNames,
    }, ...children)
  }
}
