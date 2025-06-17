module ProcessOut {
  export interface ElementState {
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
  const setInitialState = (elements: APIElements): ElementState => {
    const state: ElementState = { loading: false };
    const form = setFormState(elements);

    if (form) {
      state.form = form;
    }

    return state
  }

  export class APMViewElements extends APMViewImpl<{ elements: APIElements, config: Record<string, any>}, ElementState> {
    state = setInitialState(this.props.elements)

    private renderElement(type: string, props: any) {
      switch (type) {
        case "form": {
          return Form(props, this.state, this.setState.bind(this), this.handleSubmit.bind(this))
        }
        default: {
          return null
        }
      }
    }

    private handleSubmit() {
      const state = this.state

      if (state.form && !validateForm(this.setState.bind(this))) {
        console.log("invalid form")
        return;
      }

      this.setState({ loading: true });
      ContextImpl.context.page.load(APIImpl.sendFormData(state.form?.values ?? {}))
    }

    render() {
      const elements = this.props.elements.map(({ type, ...props  }) => {
        return this.renderElement(type, props)
      })

      return page(...elements, Button({ onClick: this.handleSubmit.bind(this), loading: this.state.loading }, 'Continue'))
    }
  }
}
