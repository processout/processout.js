module ProcessOut {
  interface PhoneState {
    dialing_code: string
    value: string
  }
  export interface FormState {
    touched: Record<string, boolean>
    values: Record<string, string | number | boolean | PhoneState>
    validation: Record<string, { required?: boolean, email?: boolean }>
    errors: Record<string, string>
  }

  const { div, label, form } = elements
  const emailRegex = /^[\w\-\.+]+@([\w-]+\.)+[\w-]{2,4}$/

  function validateField(state: NextStepState, key: string, value: string | number | boolean | PhoneState): string | undefined {
    const validation = state.form.validation[key]

    if (!validation) {
      return
    }

    switch (true) {
      case validation.required &&
        (typeof value === "undefined" || (typeof value === "string" && value.length === 0) || (isPlainObject(value) && 'value' in value && value.value.length === 0)): {
        return "Missing required value"
      }
      case validation.email && typeof value === "string" && !value.match(emailRegex): {
        return "Missing valid email address"
      }
    }
  }
  function updateField(setState: SetState<NextStepState>) {
    return function(key: string, value: string | number | boolean | PhoneState) {
      setState((prevState) => {
        let errors = { ...prevState.form.errors }

        if (prevState.form.touched[key]) {
          delete errors[key]
          errors[key] = validateField(prevState, key, value)
        }

        return {
          ...prevState,
          form: {
            ...prevState.form,
            values: {
              ...prevState.form.values,
              [key]: value,
            },
            errors,
          }
        }
      })
    }
  }

  function onBlur(setState: SetState<NextStepState>) {
    return function(key: string, value: string | number | boolean | PhoneState) {
      setState((prevState) => {
        const errors = { ...prevState.form.errors };
        const touched = { ...prevState.form.touched };

        delete errors[key];
        errors[key] = validateField(prevState, key, value)

        if (errors[key]) {
          touched[key] = true
        }

        return {
          ...prevState,
          form: {
            ...prevState.form,
            touched,
            errors,
          },
        }
      })
    }
  }

  export function validateForm(setState: SetState<NextStepState>): boolean {
    let successful = false;

    setState((prevState) => {
      const touched = {}
      const errors = Object.keys(prevState.form.values).reduce((acc, key) => {
        touched[key] = true
        const error = validateField(prevState, key, prevState.form.values[key])
        if (error) {
          acc[key] = error;
        }

        return acc
      }, {});

      successful = isEmpty(errors)

      return {
        ...prevState,
        form: {
          ...prevState.form,
          touched,
          errors
        }
      }
    })

    return successful
  }

  export function Form(props: FormData<FormFieldResult>, state: NextStepState, setState: SetState<NextStepState>, onSubmit: () => void) {
    const fields = props.parameters.parameter_definitions.map((field) => {
      const error = state.form.errors[field.key]
      const value = state.form.values[field.key]
      let input: VNode;
      let labelHtmlFor = field.key;

      switch (field.type) {
        case "otp": {
          input = OTP({
            name: field.key,
            length: field.min_length,
            type: field.subtype === "digits" ? "numeric" : "text",
            onComplete: updateField(setState),
          })
          break;
        }
        case 'phone': {
          labelHtmlFor = `${field.key}.value`;
          input = Phone({
            name: field.key,
            label: field.label,
            dialing_codes: field.dialing_codes,
            oninput: updateField(setState),
            onblur: onBlur(setState),
            errored: !!error,
            disabled: state.loading,
            value: value as PhoneState,
          });
          break;
        }
        case "single-select": {
          input = Select({
            name: field.key,
            label: field.label,
            value: value as string || field.available_values.find(item => item.preselected)?.key || '',
            options: field.available_values,
            onchange: updateField(setState),
            onblur: onBlur(setState),
          })
          break;
        }
        default: {
          input = Input({
            type: field.type,
            label: field.label,
            name: field.key,
            errored: !!error,
            disabled: state.loading,
            value: value as string,
            oninput: updateField(setState),
            onblur: onBlur(setState),
          })
        }
      }

      return div({ className: "field-container" }, input, error ? label({ htmlFor: labelHtmlFor, className: "error" }, error) : null)
    })

    return form({
      className: "form",
      onsubmit: (e) => {
        e.preventDefault()
        onSubmit()
      }
    }, ...fields)
  }
}
