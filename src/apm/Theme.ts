module ProcessOut {
  interface Palette {
    background: string
    surface: {
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
      }
    }
    border: {
      input: {
        default: string,
        errored: string,
        disabled: string,
      }
    }
    text: {
      default: string
      disabled: string
      label: string
      errored: string
    }
    shadow: {
      l2: string
    }
  }

  export interface ThemeOptions {
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

    private theme: ThemeOptions = {
      palette: {
        dark: {
          background: "#26292F",
          surface: {
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
            }
          },
          border: {
            input: {
              default: '#484a50',
              errored: '#FF8888',
              disabled: '#2E3137',
            }
          },
          text: {
            default: '#FFFFFF',
            disabled: '#707378',
            label: '#A7A9AF',
            errored: '#FF8888',
          },
          shadow: {
            l2: '#353636',
          }
        },
        light: {
          background: "#FFFFFF",
          surface: {
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
            }
          },
          border: {
            input: {
              default: '#e3e3e3',
              errored: '#BE011B',
              disabled: '#f1f1f1',
            }
          },
          text: {
            default: '#000000',
            disabled: '#C0C3C8',
            label: '#707378',
            errored: '#BE011B',
          },
          shadow: {
            l2: '#b1b1b2',
          }
        }
      },
    }

    private constructor() {}

    public static get instance(): Theme {
      if (!this._instance) {
        this._instance = new ThemeImpl();
      }

      return this._instance;
    }

    public get<P extends Paths<ThemeOptions>>(path?: P): PathValue<ThemeOptions, P> {
      return this.recursiveFind(path, this.theme)
    }

    public getTextColor<P extends Paths<ThemeOptions>>(path?: P): string {
      const color = this.get(path)
      if (!color) {
        return '#FFFFFF'
      }

      const hexColor = this.recursiveFind(path, this.theme)
      // 1. Remove the '#' if it's there
      const sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

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
      return luminance > 140 ? ThemeImpl.instance.get('palette.light.text.default')  : ThemeImpl.instance.get('palette.dark.text.default') ;
    }

    public update(theme: DeepPartial<ThemeOptions>) {
      this.theme = this.deepMerge(this.theme, theme)
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
              color: ${color === 'danger' ? ThemeImpl.instance.getTextColor('palette.light.text.default') : ThemeImpl.instance.getTextColor(`palette.dark.surface.button.hover.${color}`)};
            }
          }
        `()

        return acc;
      }, '')

      return css`
        ${this.resetCss}

        .main {
          font-family: "Work sans", Arial, sans-serif;
          container: main / size;
        }

        .page {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 400px;
          padding: 12px 20px;
          gap: 16px;
          color: ${ThemeImpl.instance.get('palette.light.text.default')};
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.default')};
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
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
          text-align: center;
        }

        .empty-controls.x3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .button {
          font-family: inherit;
          width: 100%;
          display: inline-block;
          appearance: none;
          cursor: pointer;
          font-weight: 500;
          border-radius: 6px;
          outline: none;
          border-width: 2px;
          border-style: solid;
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

        .button.loading .loader {
          width: 16px;
          height: 16px;
          border-width: 2px;
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

        .input {
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
        .input.focused {
          border-color: ${ThemeImpl.instance.get('palette.light.text.default')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.default')};
          }
        }
        .input span {
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
        .input.filled.has-label span {
          font-size: 12px;
          line-height: 14px;
          top: 8px;
        }
        .input input {
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
        .input.filled.has-label input {
          padding: 25px 16px 10px;
        }
        .input.disabled {
          border-color: ${ThemeImpl.instance.get('palette.light.border.input.disabled')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.border.input.disabled')};
          }
        }
        .input.disabled.filled {
          background-color: ${ThemeImpl.instance.get('palette.light.surface.input.disabled')};
          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.input.disabled')};
          }
        }
        .input.disabled input {
          pointer-events: none;
        }
        .input.errored:not(.disabled) {
          border-color: ${ThemeImpl.instance.get('palette.light.text.errored')};
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.errored')};
          }
        }
        .input.errored:not(.disabled) span {
          color: ${ThemeImpl.instance.get('palette.light.text.errored')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.errored')};
          }
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .error {
          background-color: #FDE3DE;
          padding: 8px 12px;
          gap: 8px;
          border-radius: 6px;
          border: 1px solid #efd7d2;
          color: #630407;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;

        }

        .otp {
          cursor: text;
        }
        .otp .input {
          width: 40px;
          float: left;
          margin-left: 12px;
        }
        .otp .input:first-child {
          margin-left: 0;
        }

        .otp .input input {
          text-align: center;
          padding-left: 0;
          padding-right: 0;
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
            Object.assign(target, { [key]: source[key] });
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
