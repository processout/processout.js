module ProcessOut {
  const { h1, h2, h3, div } = elements;

  export class APMViewComponents extends APMViewImpl {
    state = {
      count: 1
    }

    private handleCountInc() {
      this.setState({ count: this.state.count + 1 })
    }

    render() {
      return div({ className: 'page' },
        h1({ className: 'empty-title' }, 'State'),
        div({ className: 'empty-controls x3' },
          div(),
          div(Button({ variant: 'primary', onclick: this.handleCountInc.bind(this) }, `Count: ${this.state.count}`)),
          div(),
        ),
        h1({ className: 'empty-title' }, 'Components'),
        h2({ className: 'empty-subtitle' }, 'Buttons'),
        div({ className: 'empty-controls x3' },
          h3("Primary"),
          h3("Secondary"),
          h3("Tertiary"),
          div(Button({ size: 'sm', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'primary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'secondary' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'tertiary' }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'primary' , disabled: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'secondary', disabled: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'tertiary', disabled: true }, 'Refresh')),
        ),
        div({ className: 'empty-controls x3' },
          h3("Success"),
          h3("Danger"),
          div(),
          div(Button({ size: 'sm', variant: 'success' }, 'Refresh')),
          div(Button({ size: 'sm', variant: 'danger' }, 'Refresh')),
          div(),
          div(Button({ size: 'md', variant: 'success'  }, 'Refresh')),
          div(Button({ size: 'md', variant: 'danger'  }, 'Refresh')),
          div(),
          div(Button({ size: 'lg', variant: 'success' }, 'Refresh')),
          div(Button({ size: 'lg', variant: 'danger' }, 'Refresh')),
          div(),
          div(Button({ size: 'md', variant: 'success', loading: true }, 'Refresh')),
          div(Button({ size: 'md', variant: 'danger', loading: true }, 'Refresh')),
          div(),
        ),
        div({ className: 'empty-controls' },
          OTP({ name: 'otp', length: 6 }),
          Phone({ label: 'Phone number (optional)', dialing_codes: [{ region_code: 'FR', name: 'France', value: '+33' }, { region_code: 'GB', name: 'United Kingdom', value: '+44' }, { region_code: 'PL', name: 'Poland', value: '+48' }] }),
          Input({ name: 'full-name', label: 'Phone number', type: 'text', oninput: (key, value) => console.log(value) }),
          Select({ label: 'Select', name: 'select', options: [{ key: '1', label: 'Option 1' }, { key: '2', label: 'Option 2' }] })
        )
      )
    }
  }
}
