module ProcessOut {
  export interface NextStepProps {
    elements: APIElements<FormFieldResult>,
    config:  {
      success: boolean
      state: string
      invoice: APIInvoice
      gateway: object
      error?: {
        code: string
        message: string
        invalid_fields?: Array<{
          name: string
          message: string
        }>
      }
    }
  }

  export interface NextStepState {
    form?: FormState
    loading: boolean;
  }

  const setFormState = (elements: NextStepProps['elements'], error: NextStepProps['config']['error'] | undefined): FormState => {
    const forms = elements.filter(e => e.type === "form")

    if (forms.length === 0) {
      return null
    }

    const state: FormState = {
      touched: {},
      values: {},
      validation: {},
      errors: error?.invalid_fields?.reduce((acc, item) => {
        acc[item.name] = item.message
        return acc;
      }, {}) || {}

    }

    state.values = forms.reduce((acc, form) => {
      form.parameters.parameter_definitions.forEach(param => {
        if (param.type === 'single-select') {
          acc[param.key] = param.available_values.find(item => item.preselected)?.key || param.available_values[0].key
        }

        if (param.type === 'phone') {
          acc[param.key] = {
            dialing_code: param.dialing_codes[0].value,
            value: '',
          }
        }
      })
      return acc;
    }, {});

    state.validation = forms.reduce((acc, form) => {
      return {
        ...acc,
        ...form.parameters.parameter_definitions.reduce((acc, param) => {
          if (typeof param.required === 'undefined') {
            return acc;
          }

          return {
            ...acc,
            [param.key]: {
              email: param.type === "email",
              required: param.required,
            }
          }
        }, {})
      }
    }, {})

    return state
  }
  const setInitialState = (elements: APIElements<FormFieldResult >, errors: any | undefined): NextStepState => {
    const state: NextStepState = { loading: false };
    const form = setFormState(elements, errors);

    if (form) {
      state.form = form;
    }

    return state
  }

  export class APMViewNextSteps extends APMViewImpl<NextStepProps, NextStepState> {
    state = setInitialState(this.props.elements, this.props.config.error)

    private handleSubmit() {
      const state = this.state

      if (state.form && !validateForm(this.setState.bind(this))) {
        return;
      }

      this.setState({ loading: true });
      ContextImpl.context.page.load(APIImpl.sendFormData(state.form?.values ?? {}))
    }

    render() {
      return page(
        ...renderElements(
          this.props.elements,
          {
            state: this.state,
            setState: this.setState.bind(this),
            handleSubmit: this.handleSubmit.bind(this)
          }
        ),
        Button({ onClick: this.handleSubmit.bind(this), loading: this.state.loading }, 'Continue'))
    }
  }
}
