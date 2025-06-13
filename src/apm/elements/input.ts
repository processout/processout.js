module ProcessOut {
  const { div, span, input } = elements

  export interface InputProps extends Props<HTMLElementTagNameMap['input']> {
    label?: string;
    errored?: boolean;
  }

  export const Input = ({ className, label, disabled, errored, value, id, type, ...props }: InputProps) => {
    const classNames = [
      "input",
      disabled && 'disabled',
      label && 'has-label',
      value && 'filled',
      errored && 'errored',
      className
    ].filter(Boolean).join(" ")

    const el = input({
      type: type || "text",
      autocomplete: "on",
      disabled,
      value,
      id,
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
    const children = [label && span({ className: "label" }, label), el].filter(Boolean)

    return div({
      className: classNames,
    }, ...children)
  }
}
