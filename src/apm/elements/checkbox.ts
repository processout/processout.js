module ProcessOut {
  const { div, input, label: labelEl } = elements

  export const Checkbox = ({ label, name, checked, onChange }: { label: string, name: string, checked: boolean, onChange: (value: boolean) => void }) => {
    return labelEl({ className: 'checkbox', for: name },
      div({ className: 'checkbox-input' },
        input({ 
            type: 'checkbox', 
            name,
            id: name,
            checked, 
            onchange: (e) => onChange((e.target as HTMLInputElement).checked) 
        })
      ),
      div({ className: 'checkbox-label' }, label)
    )
  }
}