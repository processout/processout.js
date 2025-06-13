module ProcessOut {
  export interface FormState {
    touched: Record<string, boolean>
    values: Record<string, string | number | boolean>
    validation: Record<string, { required?: boolean, email?: boolean }>
    errors: Record<string, string>
  }

  const { div, form } = elements
  const emailRegex = /^[\w\-\.+]+@([\w-]+\.)+[\w-]{2,4}$/

  function validateField(state: ElementState, key: string, value: string | number | boolean): string | undefined {
    const validation = state.form.validation[key]

    if (!validation) {
      return
    }

    switch (true) {
      case validation.required &&
        (typeof value === "undefined" || (typeof value === "string" && value.length === 0)): {
        return "This field is required"
      }
      case validation.email && typeof value === "string" && !value.match(emailRegex): {
        return "Please enter a valid email address"
      }
    }
  }
  function updateField(setState: SetState<ElementState>) {
    return function(e: Event) {
      const target = e.target as HTMLInputElement
      const key = target.name
      const value = target.value

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

  function onBlur(setState: SetState<ElementState>) {
    return function(e: Event) {
      const target = e.target as HTMLInputElement
      const key = target.name
      const value = target.value

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

  export function validateForm(setState: SetState<ElementState>): boolean {
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

      console.log(errors);

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

  export function Form(props: any, state: ElementState, setState: SetState<ElementState>) {
    const fields = props.parameters.parameter_definitions.map(({ type, label, key }) => {
      const error = state.form.errors[key]
      const value = state.form.values[key]

      const input = Input({
        type,
        label,
        name: key,
        errored: !!error,
        disabled: state.loading,
        value: value as string,
        oninput: updateField(setState),
        onblur: onBlur(setState),
      })

      return div({ className: "field" }, input, error ? div({ className: "error" }, error) : null)
    })

    return form(...fields)
  }
}
