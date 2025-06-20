module ProcessOut {
  export interface NextStepProps {
    elements: APIElements,
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

  const setFormState = (elements: APIElements): FormState => {
    const forms = elements.filter(e => e.type === "form")

    if (forms.length === 0) {
      return null
    }

    const state: FormState = {
      touched: {},
      values: {},
      validation: {},
      errors: {},
    }

    state.values = forms.reduce((acc, form) => {
      return {
        ...acc,
        ...form.parameters.parameter_definitions.reduce((acc, param) => {
          if (param.type === 'phone') {
            return {
              ...acc,
              [param.key]: {
                dialing_code: '',
                value: '',
              }
            }
          }

          return {
            ...acc,
            [param.key]: undefined,
          }
        }, {})
      }
    }, {})

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
  const setInitialState = (elements: APIElements): NextStepState => {
    const state: NextStepState = { loading: false };
    const form = setFormState(elements);

    if (form) {
      state.form = form;
    }

    return state
  }

  export class APMViewNextSteps extends APMViewImpl<NextStepProps, NextStepState> {
    state = setInitialState(this.props.elements)

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
