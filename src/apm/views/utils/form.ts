module ProcessOut {
  interface PhoneState {
    dialing_code: string
    value: string
  }
  export interface FormState {
    touched: Record<string, boolean>
    values: Record<string, string | number | boolean | PhoneState>
    validation: Record<string, { required?: boolean, email?: boolean, minLength?: number, maxLength?: number }>
    errors: Record<string, string>
  }

  export type FormFieldUpdate = (key: string, value: string | number | boolean | PhoneState, isInitial?: boolean) => void
  export type FormFieldBlur = (key: string, value: string | number | boolean | PhoneState) => void

  const { div, label, form } = elements
  const emailRegex = /^[\w\-\.+]+@([\w-]+\.)+[\w-]{2,4}$/

  function validateField(state: NextStepState, key: string, value: string | number | boolean | PhoneState): string | undefined {
    const validation = state.form.validation[key]


    if (!validation) {
      return
    }

    const actualValue = isPlainObject(value) && 'value' in value ? value.value : value

    switch (true) {
      case validation.required &&
        (typeof value === "undefined" || (typeof actualValue === "string" && actualValue.length === 0)): {
        return "Missing required value"
      }
      case validation.email && typeof actualValue === "string" && (!actualValue || !actualValue.match(emailRegex)): {
        return "Missing valid email address"
      }
      case validation.minLength && validation.maxLength && validation.minLength === validation.maxLength && (!actualValue || typeof actualValue === "string" && actualValue.length < validation.minLength): {
        return `Must be exactly ${validation.minLength} characters`
      }
      case validation.minLength && typeof actualValue === "string" && (!actualValue || actualValue.length < validation.minLength): {
        return `Must be at least ${validation.minLength} characters`
      }
      case validation.maxLength && typeof actualValue === "string" && actualValue.length > validation.maxLength: {
        return `Must be no more than ${validation.maxLength} characters`
      }
    }
  }

  function updateField(setState: SetState<NextStepState>): FormFieldUpdate {
    return function(key, value, isInitial = false) {
      setState((prevState) => {
        let errors = { ...prevState.form.errors }

        if (prevState.form.touched[key]) {
          delete errors[key]
          errors[key] = validateField(prevState, key, value)
        }
        if (!isInitial) {
        ContextImpl.context.events.emit('field-change', { parameter: { key, value } })
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

  export function validateForm(state: NextStepState, setState: SetState<NextStepState>): boolean {
    const touched = {}
    const errors = Object.keys(state.form.validation).reduce((acc, key) => {
      touched[key] = true
      const error = validateField(state, key, state.form.values[key])
      if (error) {
        acc[key] = error;
      }

      return acc
    }, {});

    const successful = isEmpty(errors)

    setState((prevState) => {
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

    // Extract form field rendering into a reusable function
  const renderFormField = (
    field: FormFieldResult,
    state: NextStepState,
    setState: SetState<NextStepState>
  ): VNode => {
    const error = state.form.errors[field.key]
    const value = state.form.values[field.key]
    let input: VNode;
    let labelHtmlFor = field.key;

    switch (field.type) {
      case "otp": {
        input = OTP({
          name: field.key,
          label: field.label,
          length: field.min_length,
          type: field.subtype === "digits" ? "numeric" : "text",
          disabled: state.loading,
          errored: !!error,
          value: value as string,
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
          value: value as string || field.available_values.find(item => item.preselected)?.value || '',
          options: field.available_values,
          errored: !!error,
          disabled: state.loading,
          onchange: updateField(setState),
          onblur: onBlur(setState),
        })
        break;
      }
      case 'boolean': {
        input = Checkbox({
          name: field.key,
          label: field.label,
          checked: value as boolean,
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
  }

  // Grouping function for form fields
  const getFormFieldGroupInfo = (field: FormFieldResult): { type: string, className?: string } | null => {
    if (field.type === 'boolean') {
      return {
        type: 'boolean',
        className: 'group-boolean'
      }
    }
    
    // Don't group other field types for now
    return null
  }

export function Form(props: FormData<FormFieldResult>, state: NextStepState, setState: SetState<NextStepState>, onSubmit: () => void) {
    const fields = createGroupedElements(
      props.parameters.parameter_definitions,
      getFormFieldGroupInfo,
      (field) => renderFormField(field, state, setState)
    )

    return form({
      className: "form",
      onsubmit: (e) => {
        e.preventDefault()
        clearAllOTPState()
        ContextImpl.context.events.emit('submit', { parameters: Object.keys(state.form.values).map(key => ({ key, value: state.form.values[key] })) })
        onSubmit()
      }
    }, ...fields)
  }
}
