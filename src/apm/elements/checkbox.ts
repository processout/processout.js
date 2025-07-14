module ProcessOut {
  const { div, input, label: labelEl } = elements

  export interface CheckboxProps {
    label: string
    name: string
    checked?: boolean
    onchange?: (key: string, value: boolean) => void
    onblur?: (key: string, value: boolean) => void
  }

  export const Checkbox = ({ label, name, checked, onchange, onblur }: CheckboxProps) => {
    return labelEl({ className: 'checkbox', for: name },
      div({ className: 'checkbox-input' },
        input({ 
            type: 'checkbox', 
            name,
            id: name,
        }),
        div({ className: 'checkbox-indicator' }, Tick())
      ),
      div({ className: 'checkbox-label' }, label)
    )
  }
}