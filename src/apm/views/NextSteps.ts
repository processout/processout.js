module ProcessOut {
  export interface NextStepProps {
    elements: APIElements<FormFieldResult>,
    config:  (APISuccessBase | APIValidationBase) & Partial<PaymentContext>
  }

  export interface NextStepState {
    form?: FormState
    loading: boolean;
  }

  const { div } = elements

  const setFormState = (elements: NextStepProps['elements'], config: NextStepProps['config']): FormState => {
    const error = 'error' in config ? config.error : undefined;
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
        // Check for prefilled data from initialData
        const initialData = ContextImpl.context.initialData;
        const prefilledValue = initialData?.[param.key];

        // If we have prefilled data, use it and exit early
        if (prefilledValue) {
          // Special handling for phone numbers - convert string to expected object format
          if (param.type === 'phone' && typeof prefilledValue === 'string') {
            acc[param.key] = {
              dialing_code: param.dialing_codes[0].value,
              value: prefilledValue,
            };
          } else {
            acc[param.key] = prefilledValue;
          }
          return;
        }

        switch (param.type) {
          case 'single-select':
            acc[param.key] = param.available_values.find(item => item.preselected)?.value || param.available_values[0].value
            break;
          case 'phone':
            acc[param.key] = {
              dialing_code: param.dialing_codes[0].value,
              value: '',
            }
            break;
          default:
            acc[param.key] = ''
            break;
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
  const setInitialState = (elements: APIElements<FormFieldResult >, config: NextStepProps['config']): NextStepState => {
    const state: NextStepState = { loading: false };
    const form = setFormState(elements, config);

    if (form) {
      state.form = form;
    }

    return state
  }

  export class APMViewNextSteps extends APMViewImpl<NextStepProps, NextStepState> {
    state = setInitialState(this.props.elements, this.props.config)

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

    render() {
      const hasErrors = Object.keys(this.state.form?.errors ?? {}).some(key => this.state.form?.errors[key])

      return Main({ 
        config: this.props.config,
        buttons: [
          Button({ onclick: this.handleSubmit.bind(this), disabled: hasErrors, loading: this.state.loading }, 'Continue'),
          (ContextImpl.context.allowCancelation ? CancelButton({ config: this.props.config as APISuccessBase & Partial<PaymentContext> }) : null)
        ] 
      },
        ...renderElements(
          this.props.elements,
          {
            state: this.state,
            setState: this.setState.bind(this),
            handleSubmit: this.handleSubmit.bind(this)
          }
        ),
      )
    }
  }
}
