module ProcessOut {
  interface Palette {
    background: string
    surface: {
      success: string,
      button: {
        primary: string
        secondary: string
        tertiary: string
        success: string
        danger: string
        disabled: string
        hover: {
          primary: string
          secondary: string
          tertiary: string
          success: string
          danger: string
        }
      }
      input: {
        default: string,
        disabled: string,
        hover: {
          default: string,
        }
      }
      toast: {
        error: string,
      }
    }
    border: {
      input: {
        default: string,
        errored: string,
        disabled: string,
      }
      icon: {
        tertiary: string,
        disabled: string,
      }
      checkbox: {
        default: string,
      }
      toast: {
        error: string,
      }
    }
    text: {
      default: string
      disabled: string
      label: string
      errored: string
      secondary: string
      toast: {
        error: string,
      }
    }
    shadow: {
      focus: string,
      l2: string
    }
  }

  export interface ThemeOptions {
    fontFamily: string
    palette: {
      light: Palette
      dark: Palette
    }
  }

  interface Theme {
    get(): ThemeOptions
    get<P extends Paths<ThemeOptions>>(path: P): PathValue<ThemeOptions, P>
    getTextColor<P extends Paths<ThemeOptions>>(path: P): string
    update(theme: DeepPartial<ThemeOptions>): void

    createStyles(): CSSText
  }

  export class ThemeImpl implements Theme {
    static _instance: Theme;
    static _mode: 'light' | 'dark' = 'light';

    private theme: ThemeOptions = {
      fontFamily: '"Work sans", Arial, sans-serif',
      palette: {
        dark: {
          background: "#26292F",
          surface: {
            success: '#28DE6B',
            button: {
              primary: "#FFFFFF",
              secondary: "#555555",
              tertiary: "#464646",
              success: '#BAD8B1',
              danger: '#FF8888',
              disabled: '#2E3137',
              hover: {
                primary: '#bfc3c7',
                secondary: '#5b5b5b',
                tertiary: '#555555',
                success: '#1bd163',
                danger: '#ff4e4f'
              },
            },
            input: {
              default: '#26292F',
              disabled: '#2E3137',
              hover: {
                default: '#33353A',
              },
            },
            toast: {
              error: '#511511',
            }
          },
          border: {
            input: {
              default: '#484a50',
              errored: '#FF8888',
              disabled: '#2E3137',
            },
            icon: {
              tertiary: '#707378',
              disabled: '#585A5F',
            },
            checkbox: {
              default: '#56585C',
            },
            toast: {
              error: '#5E2724',
            }
          },
          text: {
            default: '#FFFFFF',
            disabled: '#707378',
            label: '#A7A9AF',
            errored: '#FF7D6C',
            secondary: '#C0C3C8',
            toast: {
              error: '#F5D9D9',
            }
          },
          shadow: {
            focus: '#63656b',
            l2: '#353636',
          }
        },
        light: {
          background: "#FFFFFF",
          surface: {
            success: '#0C7434',
            button: {
              primary: "#000000",
              secondary: "#f1f1f1",
              tertiary: "#FFFFFF",
              success: '#16AC50',
              danger: '#BE011B',
              disabled: '#f3f3f3',
              hover: {
                primary: '#2E3137',
                secondary: '#dfdfdf',
                tertiary: '#eeeeee',
                success: '#0e7434',
                danger: '#870011',
              },
            },
            input: {
              default: '#FFFFFF',
              disabled: '#f1f1f1',
              hover: {
                default: '#f5f5f5',
              },
            },
            toast: {
              error: '#FDE3DE',
            }
          },
          border: {
            input: {
              default: '#e3e3e3',
              errored: '#BE011B',
              disabled: '#f1f1f1',
            },
            icon: {
              tertiary: '#8A8D93',
              disabled: '#C0C3C8',
            },
            checkbox: {
              default: '#C0C3C8',
            },
            toast: {
              error: '#EFD7D2',
            }
          },
          text: {
            default: '#000000',
            disabled: '#C0C3C8',
            label: '#707378',
            errored: '#BE011B',
            secondary: '#585A5F',
            toast: {
              error: '#630407',
            }
          },
          shadow: {
            focus: '#b1b1b2',
            l2: '#b1b1b2',
          }
        }
      },
    }

    private static themeChangeCallbacks: Array<(mode: 'light' | 'dark') => void> = [];

    private constructor() {
      // Initialize mode based on current color scheme
      ThemeImpl.updateMode();
      
      // Set up listener for color scheme changes
      ThemeImpl.setupColorSchemeListener();
    }

    public static get instance(): Theme {
      if (!ThemeImpl._instance) {
        ThemeImpl._instance = new ThemeImpl();
      }
      return ThemeImpl._instance;
    }

    public static get mode(): 'light' | 'dark' {
      return this._mode;
    }

    /**
     * Register a callback to be called when theme mode changes
     */
    public static onThemeChange(callback: (mode: 'light' | 'dark') => void): () => void {
      const index = ThemeImpl.themeChangeCallbacks.indexOf(callback);
      
      if (index === -1) {
        this.themeChangeCallbacks.push(callback);
      }
      
      // Return cleanup function to remove the callback
      return () => {
        const index = this.themeChangeCallbacks.indexOf(callback);
        if (index > -1) {
          this.themeChangeCallbacks.splice(index, 1);
        }
      };
    }

    /**
     * Update the mode based on current color scheme
     */
    private static updateMode(): void {
      const newMode = ThemeImpl.getCurrentColorScheme();
      if (ThemeImpl._mode !== newMode) {
        ThemeImpl._mode = newMode;
        ThemeImpl.triggerModeChange();
      }
    }

    /**
     * Set up listener for color scheme changes
     */
    private static setupColorSchemeListener(): void {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        ThemeImpl.updateMode();
      };

      if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
        try {
          mediaQuery.addEventListener('change', handleChange);
        } catch (e) {
          console.warn('Failed to add media query event listener:', e);
        }
      }
    }

    /**
     * Trigger mode change callbacks
     */
    private static triggerModeChange(): void {
      // Call all registered callbacks
      ThemeImpl.themeChangeCallbacks.forEach(callback => {
        try {
          callback(ThemeImpl._mode);
        } catch (error) {
          console.error('Error in theme change callback:', error);
        }
      });
    }

    public get<P extends Paths<ThemeOptions>>(path?: P): PathValue<ThemeOptions, P> {
      return this.recursiveFind(path, this.theme);
    }

    /**
     * Get the current color scheme (light or dark)
     */
    public static getCurrentColorScheme(): 'light' | 'dark' {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (isDark) {
          return 'dark';
        }
      }
      return 'light';
    }

    /**
     * Get a color value based on the current color scheme
     */
    public static getColorForCurrentScheme(path: string): string {
      const scheme = ThemeImpl.getCurrentColorScheme();
      const fullPath = `palette.${scheme}.${path}` as any;
      const value = ThemeImpl.instance.get(fullPath);
      if (typeof value === 'string') {
        return value;
      } else {
        return '#000000';
      }
    }

    /**
     * Listen for color scheme changes and execute a callback
     */
    public onColorSchemeChange(callback: (scheme: 'light' | 'dark') => void): () => void {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {}; // No-op cleanup function
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          callback('dark');
        } else {
          callback('light');
        }
      };

      if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
        try {
          mediaQuery.addEventListener('change', handleChange);
        } catch (e) {
          console.warn('Failed to add media query event listener:', e);
        }
      }
      
      // Return cleanup function
      return () => {
        if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
          try {
            mediaQuery.removeEventListener('change', handleChange);
          } catch (e) {
            console.warn('Failed to remove media query event listener:', e);
          }
        }
      };
    }

    /**
     * Manually set the theme mode
     */
    public setMode(mode: 'light' | 'dark'): void {
      if (ThemeImpl._mode !== mode) {
        ThemeImpl._mode = mode;
        ThemeImpl.triggerModeChange();
      }
    }

    public getTextColor<P extends Paths<ThemeOptions>>(path?: P): string {
      const color = this.get(path)
      if (!color) {
        return '#FFFFFF'
      }

      const hexColor = this.recursiveFind(path, this.theme)
      // 1. Remove the '#' if it's there
      let sanitizedHex;
      if (hexColor.startsWith('#')) {
        sanitizedHex = hexColor.slice(1);
      } else {
        sanitizedHex = hexColor;
      }

      // 2. Handle shorthand hex codes (e.g., "03F" -> "0033FF")
      const fullHex = sanitizedHex.length === 3
        ? sanitizedHex.split('').map(char => char + char).join('')
        : sanitizedHex;

      // 3. Parse the R, G, B values from the hex code
      const r = parseInt(fullHex.substring(0, 2), 16);
      const g = parseInt(fullHex.substring(2, 4), 16);
      const b = parseInt(fullHex.substring(4, 6), 16);

      // 4. Calculate the perceived brightness using the WCAG formula (Luminance)
      // This formula is weighted to account for human perception. We are more
      // sensitive to green than red, and more sensitive to red than blue.
      // Values range from 0 (black) to 255 (white).
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b);

      // 5. Decide on the text color based on a luminance threshold.
      // If the background is bright (luminance > 140), use black text.
      // If the background is dark (luminance <= 139), use white text.
      if (luminance > 140) {
        return ThemeImpl.instance.get('palette.light.text.default');
      } else {
        return ThemeImpl.instance.get('palette.dark.text.default');
      }
    }

    public update(theme: DeepPartial<ThemeOptions>) {
      this.theme = this.deepMerge(this.theme, theme)
    }

    private generateMarkdownSpacingRules(): string {
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      const listTags = ['ul', 'ol']
      
      // Generate heading-to-heading combinations
      const headingRules = []
      for (let i = 0; i < headingTags.length; i++) {
        for (let j = 0; j < headingTags.length; j++) {
          headingRules.push(`.markdown ${headingTags[i]} + ${headingTags[j]}`)
        }
      }
      
      // Generate list-to-list combinations
      const listRules = []
      for (let i = 0; i < listTags.length; i++) {
        for (let j = 0; j < listTags.length; j++) {
          listRules.push(`.markdown ${listTags[i]} + ${listTags[j]}`)
        }
      }
      
      return css`
        /* Reset margins for all markdown elements */
        .markdown > * {
          margin-top: 0;
          margin-bottom: 0;
        }

        /* Default spacing (32px) for all elements except the first one */
        .markdown > * + * {
          margin-top: 32px;
        }

        /* Same type elements: 16px spacing */
        /* Heading to heading */
        ${headingRules.join(', \n')} {
          margin-top: 16px;
        }

        /* Paragraph to paragraph */
        .markdown p + p {
          margin-top: 16px;
        }

        /* List to list */
        ${listRules.join(', \n')} {
          margin-top: 16px;
        }
      `()
    }

    public createStyles() {
      const buttonVariants = Object.keys(ThemeImpl.instance.get("palette.light.surface.button")).reduce((acc, key) => {
        const color = key as keyof ThemeOptions['palette']['light']['surface']['button']

        if (color === 'hover' || color === 'disabled') {
          return acc;
        }

        acc += css`
          .button.${color} {
            background-color: ${ThemeImpl.instance.get(`palette.light.surface.button.${color}`)};
            color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.button.${color}`)};

            @media (prefers-color-scheme: dark) {
              background-color: ${ThemeImpl.instance.get(`palette.dark.surface.button.${color}`)};
              color: ${ThemeImpl.instance.getTextColor(`palette.dark.surface.button.${color}`)};
            }
          }
          .button.${color}:not(.disabled):not(:hover):not(:focus) {
            border-color: ${ThemeImpl.instance.get(`palette.light.surface.button.${color}`)};

            @media (prefers-color-scheme: dark) {
              border-color: ${ThemeImpl.instance.get(`palette.dark.surface.button.${color}`)};
            }
          }

          .button.${color}:not(.disabled):not(:focus) {
            border-color: ${ThemeImpl.instance.get(`palette.light.surface.button.hover.${color}`)};

            @media (prefers-color-scheme: dark) {
              border-color: ${ThemeImpl.instance.get(`palette.dark.surface.button.hover.${color}`)};
            }
          }

          .button.${color} .loader {
            border-color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.button.${color}`)};

            @media (prefers-color-scheme: dark) {
              border-color: ${ThemeImpl.instance.getTextColor(`palette.dark.surface.button.${color}`)};
            }
          }

          .button.${color}:not(.loading):not(.disabled):hover, .button.${color}:not(.loading):not(.disabled):focus {
            background-color: ${ThemeImpl.instance.get(`palette.light.surface.button.hover.${color}`)};
            color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.button.hover.${color}`)};

            @media (prefers-color-scheme: dark) {
              background-color: ${ThemeImpl.instance.get(`palette.dark.surface.button.hover.${color}`)};
              color: ${(() => {
                if (color === 'danger') {
                  return ThemeImpl.instance.getTextColor('palette.light.text.default');
                } else {
                  return ThemeImpl.instance.getTextColor(`palette.dark.surface.button.hover.${color}`);
                }
              })()};
            }
          }
        `()

        return acc;
      }, '')

      return css`
        ${this.resetCss}

        .main {
          font-family: ${ThemeImpl.instance.get('fontFamily')};
          container: main / inline-size;
        }

        .page {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 285px;
          padding: 32px 40px;
          color: ${ThemeImpl.instance.get('palette.light.text.default')};
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
        }

        .page > .container {
          display: flex;
          flex-direction: column;
          gap-y: 16px;
        }

        .page > .container > .buttons-container {
          margin-top: 40px;
        }
        .page > .container > form + .buttons-container {
          margin-top: 20px;
        }

        .buttons-container {
          display: flex;
          flex-direction: column;
          gap-y: 12px;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid ${ThemeImpl.instance.get('palette.light.text.default')};
          border-bottom-color: transparent !important;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            border-bottom-color: transparent;
          })
        }

        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .empty-title {
          text-align: center;
          margin-top: 16px
        }

        .empty-subtitle {
          text-align: center;
        }

        .empty-controls {
          display: grid;
          gap: 12px;
        }

        .empty-controls.x3 {
          text-align: center;
          grid-template-columns: repeat(3, 1fr);
        }

        .chevron {
          display: inline-block;
          width: 100%;
          padding-top: 75%;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 6' fill='none'%3E%3Cpath d='M1 2L4 5L7 2' stroke='${encodeURIComponent(ThemeImpl.instance.get('palette.light.text.label'))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;

          transition: transform 0.2s ease-in-out;
          @media (prefers-color-scheme: dark) {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 6' fill='none'%3E%3Cpath d='M1 2L4 5L7 2' stroke='${encodeURIComponent(ThemeImpl.instance.get('palette.dark.border.input.default'))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          }
        }
        .chevron.up {
          transform: rotate(-180deg);
        }

        .chevron.left {
          transform: rotate(90deg);
        }
        .chevron.right {
          transform: rotate(-90deg);
        }

        .heading-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap-y: 6px;
          padding-top: 16px;
        }

        .heading {
          font-weight: 600;
          font-size: 20px;
          line-height: 24px;
        }

        .sub-heading {
          font-weight: 400;
          font-size: 16px;
          line-height: 26px;
        }

        .button-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap-y: 12px;
          padding-top: 12px;
        }

        .button {
          font-family: inherit;
          width: 100%;
          display: inline-block;
          text-wrap-mode: nowrap;
          appearance: none;
          cursor: pointer;
          font-weight: 500;
          border-radius: 6px;
          outline: none;
          border-width: 2px;
          border-style: solid;
          position: relative;
        }

        .button:focus {
          box-shadow: inset 0 0 0 1px ${ThemeImpl.instance.get('palette.light.background')};
          border-color: ${ThemeImpl.instance.get('palette.light.shadow.l2')};;
          @media (prefers-color-scheme: dark) {
            box-shadow: inset 0 0 0 1px ${ThemeImpl.instance.get('palette.dark.background')};
            border-color: ${ThemeImpl.instance.get('palette.light.shadow.l2')};
          }
        }

        ${buttonVariants}

        .button.disabled, .button.disabled:hover {
          cursor: not-allowed;
          background-color: ${ThemeImpl.instance.get('palette.light.surface.button.disabled')};
          color: ${ThemeImpl.instance.get('palette.light.text.disabled')};
          border-color: ${ThemeImpl.instance.get('palette.light.surface.button.disabled')};

          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.button.disabled')};
            color: ${ThemeImpl.instance.get('palette.dark.text.disabled')};
            border-color: ${ThemeImpl.instance.get('palette.dark.surface.button.disabled')};
          }
        }

        .button.loading {
          cursor: default;
          pointer-events: none;
        }

        .button.loading .content {
          opacity: 0;
        }

        .button.loading .loader {
          width: 16px;
          height: 16px;
          border-width: 2px;
          position: absolute;
          top: calc(50% - 8px);
          left: calc(50% - 8px);
        }

        .button.sm {
          padding: 0 12px;
          height: 32px;
          font-size: 13px;
          line-height: 16px;
        }
        .button.md {
          padding: 0 16px;
          height: 40px;
          font-size: 14px;
          line-height: 20px;
        }
        .button.lg {
          padding: 0 24px;
          height: 48px;
          font-size: 15px;
          line-height: 18px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap-y: 16px;
        }

        .field-container {
          display: flex;
          flex-direction: column;
          gap-y: 8px;
        }
        .field {
          display: flex;
          width: 100%;
          background-color: ${ThemeImpl.instance.get('palette.light.surface.input.default')};
          border: 2px solid ${ThemeImpl.instance.get('palette.light.border.input.default')};
          border-radius: 6px;
          height: 52px;
          position: relative;
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.input.default')};
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.default')};
          }
        }
        .field.focused, .field:focus-within {
          border-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }

        .field .label {
          font-family: inherit;
          position: absolute;
          top: 16px;
          left: 14px;
          font-weight: 500;
          font-size: 15px;
          line-height: 18px;
          transition: font-size 0.1s ease-in-out, line-height 0.1s ease-in-out, top 0.1s ease-in-out;
          color: ${ThemeImpl.instance.get('palette.light.text.label')};

          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.label')};
          }
        }

        .field.filled.has-label .label {
          font-size: 12px;
          line-height: 14px;
          top: 8px;
        }
        .field input {
          font-family: inherit;
          appearance: none;
          background-color: transparent;
          color: ${ThemeImpl.instance.get('palette.light.text.default')};
          border: none;
          outline: none;
          width: calc(100% + 4px);
          font-weight: 500;
          font-size: 15px;
          line-height: 18px;
          padding: 18px 16px 16px;
          -webkit-background-clip: text;
          -webkit-text-fill-color: ${ThemeImpl.instance.get('palette.light.text.default')};

          position: absolute;
          top: -2px;
          left: -2px;

          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            -webkit-text-fill-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }
        .field.filled.has-label input {
          padding: 25px 16px 10px;
        }
        .field.disabled {
          border-color: ${ThemeImpl.instance.get('palette.light.border.input.disabled')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.disabled')};
          }
        }
        .field.disabled.filled {
          background-color: ${ThemeImpl.instance.get('palette.light.surface.input.disabled')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.input.disabled')};
          }
        }
        .field.disabled input {
          pointer-events: none;
        }
        .field.errored:not(.disabled) {
          border-color: ${ThemeImpl.instance.get('palette.light.border.input.errored')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.errored')};
          }
        }
        .field.errored:not(.disabled) .label {
          color: ${ThemeImpl.instance.get('palette.light.text.errored')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.errored')};
          }
        }

        .select-chevrons {
          width: 5px;
          height: 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap-y: 1px;
        }

        .open .select-chevrons .chevron {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 6' fill='none'%3E%3Cpath d='M1 2L4 5L7 2' stroke='${encodeURIComponent(ThemeImpl.instance.get('palette.light.text.default'))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          @media (prefers-color-scheme: dark) {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 6' fill='none'%3E%3Cpath d='M1 2L4 5L7 2' stroke='${encodeURIComponent(ThemeImpl.instance.get('palette.dark.text.default'))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          }
        }

        .select-chevrons.md {
          width: 7px;
          gap-y: 2px;
        }

        .select select {
          width: 100%;
          border: 0;
          outline: none;
          background-color: transparent;
          appearance: none;
          padding: 16px 14px 0;
          font-weight: 500;
          font-size: 15px;
          line-height: 18px;
          font-family: inherit;
          color: ${ThemeImpl.instance.get('palette.light.text.default')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }

        .select select::-ms-expand {
          display: none;
        }

        .select select:focus,
        .select select::-moz-focus-inner,
        .select select::-moz-focus-outer  {
          border: 0;
          outline: none;
          -moz-outline-style: none; 
        }

        .select .select-chevrons {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .otp-container .otp-label {
          margin-bottom: 12px;
          display: inline-block;
        }

        .field-container.otp-field {
          margin-bottom: 16px;
        }
          
        .otp {
          cursor: text;
          position: relative;
          display: inline-block;
        }
        .otp .input {
          width: 40px;
          float: left;
          margin-left: 16px;
        }
        .otp input.hidden {
          display: block !important;
          position: absolute;
          width: 100%;
          z-index: 1;
          background: transparent;
          border: none;
          outline: none;
          height: 100%;
        }
        .otp .input:first-child {
          margin-left: 0;
        }

        .otp .input input {
          text-align: center;
          padding-left: 0;
          padding-right: 0;
        }

        .phone .dialing-code {
          display: flex;
          justify-content: end;
          align-items: center;
          gap-x: 10px;
          width: 58px;
          height: 26px;
          position: absolute;
          top: 11px;
          right: 14px;
          border-left: 2px solid ${ThemeImpl.instance.get('palette.light.border.input.default')};;

          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.default')};
          }
        }
        .phone .dialing-code.open {
          padding-right: 16px;
          width: 73px;
          height: 52px;
                  top: -2px;
        right: -2px;
          border-left: 2px solid ${ThemeImpl.instance.get('palette.light.text.default')};
          box-shadow: 0 0 0 3px ${ThemeImpl.instance.get('palette.light.shadow.focus')};
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;

          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            box-shadow: 0 0 0 3px ${ThemeImpl.instance.get('palette.dark.shadow.focus')};
          }
        }

        .phone .dialing-code.open:before,
        .phone .dialing-code.open:after {
          content: "";
          display: block;
          width: 8px;
          height: 2px;
          background-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          position: absolute;
          left: -6px;
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }
        .phone .dialing-code.open:before {
          top: 0;
        }
        .phone .dialing-code.open:after {
          bottom: 0;
        }

        .phone .dialing-code-label {
          overflow: hidden;
          border-radius: 2px;
          justify-content: center;
          display: flex;
        }

        .phone select {
          width: 58px;
          height: 26px;
          position: absolute;
          top: 11px;
          right: 16px;
          border: none;
          text-align: right;
          outline: none;
          opacity: 0;
        }

        @keyframes select-caret {
          0% {
            text-decoration: none;
          }
          50% {
            text-decoration: underline;
          }
          100% {
            text-decoration: none;
          }
        }

        .phone select:focus {
          animation: select-caret 1s infinite;
        }

        .phone.errored:not(.disabled) .dialing-code.open {
          border-color: ${ThemeImpl.instance.get('palette.light.text.errored')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.errored')};
          }
        }
        .phone.errored:not(.disabled) .dialing-code.open:before, .phone.errored:not(.disabled) .dialing-code.open:after {
          background-color: ${ThemeImpl.instance.get('palette.light.text.errored')};

          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.text.errored')};
          }
        }

        .error {
          padding: 8px 12px;
          gap-x: 8px;
          border-radius: 6px;
          border: 1px solid;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          background-color: ${ThemeImpl.instance.get('palette.light.surface.toast.error')};
          border-color: ${ThemeImpl.instance.get('palette.light.border.toast.error')};
          color: ${ThemeImpl.instance.get('palette.light.text.toast.error')};

          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.toast.error')};
            border-color: ${ThemeImpl.instance.get('palette.dark.border.toast.error')};
            color: ${ThemeImpl.instance.get('palette.dark.text.toast.error')};
          }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0 32px;
          border-bottom: 1px solid #f1f1f1;
          margin-bottom: 32px;
        }

        .header .amount {
          font-weight: 600;
          font-size: 16px;
          line-height: 20px;
        }

        .markdown {
          text-align: left;
        }

        .markdown-skeleton {
          display: flex;
          flex-direction: column;
        }

        .skeleton-line {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.1) 25%, rgba(0, 0, 0, 0.05) 50%, rgba(0, 0, 0, 0.1) 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .qr-code-container {
          display: flex;
          flex-direction: column;
          gap-y: 12px;
          align-items: center;
          max-width: 70%;
          margin: 0 auto;
          padding: 8px 0;
        }

        .qr-code {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 4px;
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
        }

        .qr-code img {
          width: 100%;
          height: 100%;
        }
        
        .qr-skeleton {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-content: space-around;
        }

        .qr-dot {
          height: 4px;
          background-color: transparent;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
        }

        .qr-dot:before {
          content: '';
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: dot-fade 1.5s ease-in-out infinite;
          animation-delay: var(--animation-delay, 0s);
          opacity: 0.3;
          background-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }

        @keyframes dot-fade {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .qr-square {
          display: none;
        }

        .qr-corner {
          display: none;
        }

        .qr-skeleton-block {
          display: none;
        }
        
        .qr-code .loader {
          width: 15px;
          height: 15px;
          border-width: 2px;
        }

        .qr-actions {
          display: flex;
          gap-x: 8px;
          justify-content: center;
          align-items: center;
        }

        .markdown h1 {
          font-family: inherit;
          font-weight: 600;
          font-size: 24px;
          line-height: 32px;
        }

        .markdown h2 {
          font-family: inherit;
          font-weight: 600;
          font-size: 20px;
          line-height: 24px;
        }

        .markdown h3 {
          font-family: inherit;
          font-weight: 600;
          font-size: 18px;
          line-height: 22px;
        }

        .markdown h4 {
          font-family: inherit;
          font-weight: 600;
          font-size: 16px;
          line-height: 20px;
        }

        .markdown h5 {
          font-family: inherit;
          font-weight: 600;
          font-size: 15px;
          line-height: 18px;
        }

        .markdown h6 {
          font-family: inherit;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
        }

        .markdown p {
          font-family:inherit;
          font-weight: 400;
          font-size: 16px;
          line-height: 26px;
        }

        .markdown a {
          font-family: inherit;
          font-weight: 400;
          font-size: 16px;
          line-height: 26px;
          text-decoration: underline;
          color: ${ThemeImpl.instance.get('palette.light.text.default')};

          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }

        .markdown ul {
          list-style-type: disc;
          list-style-position: outside;
          list-style-image: none;
          padding-left: 20px;
        }

        .markdown ol {
          list-style-type: decimal;
          list-style-position: outside;
          list-style-image: none;
          padding-left: 20px;
        }

        .markdown li {
          display: list-item;
          text-align: match-parent;
          line-height: 28px;
        }

        .markdown blockquote {
          padding: 4px 8px 4px 16px;
          gap: 8px;
          border-left: 3px solid;
          font-weight: 400;
          font-size: 16px;
          line-height: 26px;
          color: ${ThemeImpl.instance.get('palette.light.text.secondary')};
          border-color: ${ThemeImpl.instance.get('palette.light.border.input.default')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.secondary')};
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.default')};
          }
        }

        .markdown strong {
          font-weight: 500;
        }

        .markdown em {
          font-style: italic;
        }

        ${this.generateMarkdownSpacingRules()}

        .tick {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1;
          transform-origin: center;
        }

        .tick:before, .tick:after {
          content: "";
          position: absolute;
          transform-origin: bottom center;
          width: 7%;
          bottom: 24%;
          border-radius: 100px;
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
        }

        .tick:before {
          height: 33%;
          transform: rotate(-35deg);
          left: calc(50% - 4%);
          bottom: 24%;
        }
          
        .tick:after {
          height: 57%;
          transform: rotate(30deg);
          left: calc(50% - 7%);
        }

        .status-tick {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        .status-tick .tick {
          border-radius: 50%;
        }
        
        .status-tick .tick:before, .status-tick .tick:after {
          display: none;
        }

        .status-tick.pending .tick  {
          border: 2px solid;
          border-color: ${ThemeImpl.instance.get('palette.light.border.icon.tertiary')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.icon.tertiary')};
          }
        }

        .status-tick.idle .tick {
          border: 2px solid;
          border-color: ${ThemeImpl.instance.get('palette.light.border.icon.disabled')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.icon.disabled')};
          }  
        }
        
        .status-tick.completed .tick:before, .status-tick.completed .tick:after {
          display: block;
        }

        .status-tick.pending:before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 200px;
          z-index: 0;
          animation: grow 2s ease-in-out infinite;
          opacity: 0.20;
          background-color: ${ThemeImpl.instance.get('palette.light.border.icon.tertiary')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.border.icon.tertiary')};
          }
        }
        .status-tick.pending:after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 200px;
          z-index: 0;
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
        }

        @keyframes grow {
          0% {
            transform: scale(0.8);
            opacity: 0.08;
          }
          72% {
            transform: scale(1.5);
            opacity: 0.20;
          }
          82% {
            transform: scale(1.5);
            opacity: 0.20;
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        .status-tick.completed .tick {
          background-color: ${ThemeImpl.instance.get('palette.light.surface.success')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.success')};
          }
        }

        .group {
          display: flex;
          flex-direction: column;
          gap-y: 24px;
          padding: 16px;
          border-radius: 6px;
          border: 2px solid;
          border-color: ${ThemeImpl.instance.get('palette.light.border.input.default')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.default')};
          }
        }
          
        .group > div {
          position: relative;
        }

        .group > div + div:before {
          content: '';
          display: block;
          position: absolute;
          width: calc(100% + 20px);
          height: 1px;
          top: -12px;
          left: -10px;
          opacity: 0.5;
          background-color: ${ThemeImpl.instance.get('palette.light.border.input.default')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.border.input.default')};
          }
        }

        .group.group-boolean {
          padding: 4px;
          gap-y: 4px;
        }
          
        .group.group-boolean > div + div:before {
          display: none;
        }

        .copy-instruction {
          display: flex;
          gap-x: 8px;
          align-items: center;
          justify-content: space-between;
        }

        .copy-instruction .label {
          font-weight: 500;
          font-size: 12px;
          line-height: 14px;
          margin-bottom: 4px;
          text-align: left
          color: ${ThemeImpl.instance.get('palette.light.text.label')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.label')};
          }
        }

        .copy-instruction .value {
          font-weight: 500;
          font-size: 15px;
          line-height: 18px;
        }

        .copy-instruction .copied-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .copy-instruction .button {
          width: auto;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap-x: 8px;
          cursor: pointer;
          padding: 16px 12px;
          border-radius: 6px;
        }

        .checkbox:hover {
          background-color: ${ThemeImpl.instance.get('palette.light.surface.input.hover.default')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.input.hover.default')};
          }
        }

        .checkbox-input {
          position: relative;
          width: 16px;
          height: 16px;
        }

        .checkbox-input input {
          opacity: 0;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 4;
        }

        .checkbox-indicator {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid;
          z-index: 3;
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          border-color: ${ThemeImpl.instance.get('palette.light.border.checkbox.default')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
            border-color: ${ThemeImpl.instance.get('palette.dark.border.checkbox.default')};
          }
        }
        .checkbox-input input + .checkbox-indicator .status-tick {
          display: none;
        }

        .checkbox-input input:checked + .checkbox-indicator {
          background-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          border-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            border-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }

        .checkbox-input input:checked + .checkbox-indicator .status-tick {
          display: block;
        }

        .logo img[data-dark-src] {
          content: var(--logo-src);
        }

        .logo img[data-dark-src] {
          --logo-src: url(attr(src url));
        }

        @media (prefers-color-scheme: dark) {
          .logo img[data-dark-src] {
            --logo-src: url(attr(data-dark-src url));
          }
        }
      `()
    }

    private recursiveFind(path: string, value: any) {
      if (!path) {
        return value
      }

      const paths = path.split('.');
      const key = paths.shift()

      return this.recursiveFind(paths.join('.'), value[key])
    }

    private deepMerge(target: any, ...sources: any) {
      if (!sources.length) return target;
      const source = sources.shift();

      if (isPlainObject(target) && isPlainObject(source)) {
        for (const key in source) {
          if (isPlainObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            this.deepMerge(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] || target[key] });
          }
        }
      }

      return this.deepMerge(target, ...sources);
    }

    private get resetCss() {
      return css`
        a,abbr,acronym,address,applet,article,aside,audio,b,big,blockquote,body,canvas,caption,center,cite,code,dd,del,details,dfn,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,html,i,iframe,img,ins,kbd,label,legend,li,main,mark,menu,nav,object,ol,output,p,pre,q,ruby,s,samp,section,small,span,strike,strong,sub,summary,sup,table,tbody,td,tfoot,th,thead,time,tr,tt,u,ul,var,video{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline;box-sizing:border-box;}article,aside,details,figcaption,figure,footer,header,hgroup,main,menu,nav,section{display:block}[hidden]{display:none}body{line-height:1}menu,ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:after,blockquote:before,q:after,q:before{content:'';content:none}table{border-collapse:collapse;border-spacing:0}
      `
    }
  }
}
