module ProcessOut {
  // Track OTP fields across form changes to clean up removed ones
  let previousOtpFields = new Set<string>();

  export interface NextStepProps {
    elements: APIElements<FormFieldResult>,
    config:  {
      success: boolean
      state: string
      invoice?: APIInvoice
      gateway?: object
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
    const forms = elements?.filter(e => e.type === "form") ?? []

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
          acc[param.key] = param.available_values.find(item => item.preselected)?.value || param.available_values[0].value
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
          return {
            ...acc,
            [param.key]: {
              email: param.type === "email",
              required: param.required ?? false,
              minLength: 'min_length' in param ? param.min_length : undefined,
              maxLength: 'max_length' in param ? param.max_length : undefined,
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

      if (state.form && !validateForm(state, this.setState.bind(this))) {
        return;
      }

      if (state.form) {
        ContextImpl.context.events.emit('submit', { parameters: Object.keys(state.form.values).map(key => ({ key, value: state.form.values[key] })) })
      }
      
      this.setState({ loading: true });
      ContextImpl.context.page.load(APIImpl.sendFormData(state.form?.values ?? {}), (err, state) => {
        if (err) {
          ContextImpl.context.events.emit('submit-error', { failure: { code: err.code, message: err.message } })
        } else {
          ContextImpl.context.events.emit('submit-success', { additionalParametersExpected: state === 'NEXT_STEP_REQUIRED' })
        }
      })
    }

    private handleCancelClick() {
      ContextImpl.context.events.emit('request-cancel')
    }

    render() {
      const hasErrors = Object.keys(this.state.form?.errors ?? {}).some(key => this.state.form?.errors[key])

      return Main({ config: this.props.config },
        ...renderElements(
          this.props.elements,
          {
            state: this.state,
            setState: this.setState.bind(this),
            handleSubmit: this.handleSubmit.bind(this)
          }
        ),
        Button({ onclick: this.handleSubmit.bind(this), disabled: hasErrors, loading: this.state.loading }, 'Continue'),
        (ContextImpl.context.allowCancelation ? Button({ onclick: this.handleCancelClick.bind(this) }, 'Cancel') : null)
      )
    }
  }
}
