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
          h2({ className: 'empty-subtitle' }, 'Form Elements'),
          ...renderElements(
            [{ 
              type: 'form', 
              parameters: { 
                parameter_definitions: [
                  { type: 'otp', key: 'otp', label: 'One time password', required: true, max_length: 6, min_length: 6, subtype: 'digits' },
                  { type: 'phone', key: 'phone', label: 'Phone', required: true, dialing_codes: [{ region_code: 'FR', name: 'France', value: '+33' }, { region_code: 'GB', name: 'United Kingdom', value: '+44' }, { region_code: 'PL', name: 'Poland', value: '+48' }] },
                  { type: 'email', key: 'email', label: 'Email', required: true, min_length: 1, max_length: 100 },
                  { type: 'text', key: 'text', label: 'Text', required: true, min_length: 1, max_length: 100 },
                  { type: 'single-select', key: 'single-select', label: 'Single select', required: true, available_values: [{ value: '1', label: 'Option 1', preselected: false }, { value: '2', label: 'Option 2', preselected: false }] },
                  { type: 'boolean', key: 'boolean', label: 'Boolean', required: true },
                  { type: 'boolean', key: 'boolean2', label: 'Boolean 2', required: true },
                ] 
              } 
            }],
            {
              state: {
                form: {
                  values: {},
                  errors: {},
                  touched: {},
                  validation: {}
                },
                loading: false
              },
              setState: () => {},
            }
          ),
        ),
        div({ className: 'empty-controls' },
          h2({ className: 'empty-subtitle' }, 'Instructions'),
          ...renderElements(
            [
              { 
                type: 'instruction', 
                instruction: { 
                  type: 'message', 
                  label: 'Copy code', 
                  value: '123456' 
                } 
              }, 
              { 
                type: 'instruction', 
                instruction: {
                  type: 'message', 
                  label: 'Copy code', 
                  value: '123456' 
                } 
              },
              {
                type: 'instruction', 
                instruction: {
                  type: 'message', 
                  value:  [
                    '# Headers',
                    '# h1',
                    '## h2',
                    '### h3',
                    '#### h4',
                    '##### h5',
                    '###### h6',
                    'Alternatively, for H1 and H2, an underline-ish style:',
                    'Alt-H1',
                    '======',
                    'Alt-H2',
                    '------',
                    '',
                    '## Emphasis',
                    'Emphasis, aka italics, with *asterisks* or _underscores_.',
                    'Strong emphasis, aka bold, with **asterisks** or __underscores__.',
                    'Combined emphasis with **asterisks and _underscores_**.',
                    'Strikethrough uses two tildes. ~~Scratch this.~~',
                    '',
                    '## Lists',
                    '1. First ordered list item',
                    '2. Another item',
                    '    * Unordered sub-list.',
                    '1. Actual numbers don\'t matter, just that it\'s a number',
                    '1. Ordered sub-list',
                    '4. And another item.',
                    '',
                    '    You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we\'ll use three here to also align the raw Markdown).',
                    '',
                    '    To have a line break without a paragraph, you will need to use two trailing spaces.',
                    '    Note that this line is separate, but within the same paragraph.',
                    '    (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)',
                    '* Unordered list can use asterisks',
                    '- Or minuses',
                    '+ Or pluses',
                    '',
                    '## Links',
                    '[I\'m an inline-style link](https://www.google.com)',
                    '',
                    '[I\'m an inline-style link with title](https://www.google.com "Google\'s Homepage")',
                    '',
                    '[I\'m a reference-style link][Arbitrary case-insensitive reference text]',
                    '',
                    '[I\'m a relative reference to a repository file](../blob/master/LICENSE)',
                    '',
                    '[You can use numbers for reference-style link definitions][1]',
                    '',
                    '[I\'m a relative reference to a repository file](../blob/master/LICENSE)',
                    '',
                    '[You can use numbers for reference-style link definitions][1]',
                    '',
                    'Or leave it empty and use the [link text itself].',
                    '',
                    'URLs and URLs in angle brackets will automatically get turned into links. ',
                    'http://www.example.com or <http://www.example.com> and sometimes ',
                    'example.com (but not on Github, for example).',
                    '',
                    'Some text to show that the reference links can follow later.',
                    '',
                    '[arbitrary case-insensitive reference text]: https://www.mozilla.org',
                    '[1]: http://slashdot.org',
                    '[link text itself]: http://www.reddit.com',
                    '',
                    '## Images',
                    'Here\'s our logo (hover to see the title text):',
                    '',
                    'Inline-style: ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")',
                    '',
                    'Reference-style: ![alt text][logo]',
                    '', 
                    '[logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"',
                    '',
                    '## Blockquotes',
                    '> Blockquotes are very handy in email to emulate reply text.',
                    '> This line is part of the same quote.',
                    '',
                    'Quote break.',
                    '',
                    '> This is a very long line that will still be quoted properly when it wraps. Oh boy let\'s keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote. ',
                  ].join('\n')
                } 
              },
              {
                type: 'instruction', 
                instruction: {
                  type: 'barcode',
                  subtype: 'qr',
                  value: '123456' 
                } 
              },
            ]
          ),
        ),
      )
    }
  }
}
