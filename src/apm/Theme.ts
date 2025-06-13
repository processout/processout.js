module ProcessOut {
  const spacing = ['xs', 'sm', 'md', 'lg', 'xl'] as const
  type Spacing = (typeof spacing)[number]

  interface Palette {
    background: string
    surface: {
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
    },
    text: {
      primary: string
      disabled: string
    }
    shadow: {
      l2: string
    }
  }

  export interface ThemeOptions {
    spacing: Record<Spacing, string>
    palette: {
      light: Palette
      dark: Palette
    }
    rounded: {
      button: string
    }
  }

  interface Theme {
    get(): ThemeOptions
    get<P extends Paths<ThemeOptions>>(path: P): PathValue<ThemeOptions, P>
    getTextColor<P extends Paths<ThemeOptions>>(path: P): '#FFFFFF' | '#000000'
    update(theme: DeepPartial<ThemeOptions>): void

    createStyles(): CSSText
  }

  export class ThemeImpl implements Theme {
    static _instance: Theme;

    private theme: ThemeOptions = {
      palette: {
        dark: {
          background: "#000000",
          surface: {
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
            }
          },
          text: {
            primary: '#FFFFFF',
            disabled: '#707378'
          },
          shadow: {
            l2: '#353636'
          }
        },
        light: {
          background: "#FFFFFF",
          surface: {
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
              danger: '#870011'
            }
          },
          text: {
            primary: '#000000',
            disabled: '#C0C3C8'
          },
          shadow: {
            l2: '#b1b1b2'
          }
        }
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "30px",
      },
      rounded: {
        button: '6px'
      }
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

    public getTextColor<P extends Paths<ThemeOptions>>(path?: P): '#FFFFFF' | '#000000' {
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
      return luminance > 140 ? '#000000' : '#FFFFFF';
    }

    public update(theme: DeepPartial<ThemeOptions>) {
      this.theme = this.deepMerge(this.theme, theme)
    }

    public createStyles() {
      const buttonVariants = Object.keys(ThemeImpl.instance.get("palette.light.surface")).reduce((acc, key) => {
        const color = key as keyof ThemeOptions['palette']['light']['surface']

        if (color === 'hover' || color === 'disabled') {
          return acc;
        }

        acc += css`
          .button.${color}, .button.${color}.loading:hover {
            background-color: ${ThemeImpl.instance.get(`palette.light.surface.${color}`)};
            color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.${color}`)};

            @media (prefers-color-scheme: dark) {
              background-color: ${ThemeImpl.instance.get(`palette.dark.surface.${color}`)};
              color: ${ThemeImpl.instance.getTextColor(`palette.dark.surface.${color}`)};
            }
          }

          .button.${color} .loader {
            border-color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.${color}`)};

            @media (prefers-color-scheme: dark) {
              border-color: ${ThemeImpl.instance.getTextColor(`palette.dark.surface.${color}`)};
            }
          }

          .button.${color}:hover, .button.${color}:focus {
            background-color: ${ThemeImpl.instance.get(`palette.light.surface.hover.${color}`)};
            color: ${ThemeImpl.instance.getTextColor(`palette.light.surface.hover.${color}`)};

            @media (prefers-color-scheme: dark) {
              background-color: ${ThemeImpl.instance.get(`palette.dark.surface.hover.${color}`)};
              color: ${color === 'danger' ? '#000000' : ThemeImpl.instance.getTextColor(`palette.dark.surface.hover.${color}`)};
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
          padding: ${ThemeImpl.instance.get('spacing.sm')};
          color: ${ThemeImpl.instance.get('palette.light.text.primary')};
          background-color: ${ThemeImpl.instance.get('palette.light.background')};
          @media (prefers-color-scheme: dark) {
            color: ${ThemeImpl.instance.get('palette.dark.text.primary')};
            background-color: ${ThemeImpl.instance.get('palette.dark.background')};
          }
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid ${ThemeImpl.instance.get('palette.light.text.primary')};
          border-bottom-color: transparent !important;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
          @media (prefers-color-scheme: dark) {
            border-color: ${ThemeImpl.instance.get('palette.dark.text.primary')};
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
          margin-bottom: 24px;
        }

        .empty-subtitle {
          text-align: center;
          margin-bottom: 18px;
        }

        .empty-controls {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, 1fr);
          padding: 8px;
          text-align: center;
          margin-bottom: 24px;
        }

        .button {
          font-family: inherit;
          width: 100%;
          display: inline-block;
          appearance: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          border-radius: ${ThemeImpl.instance.get('rounded.button')};
          outline: none;
        }

        .button:focus {
          box-shadow: 0 0 0 1px ${ThemeImpl.instance.get('palette.light.background')}, 0 0 0 3px ${ThemeImpl.instance.get('palette.light.shadow.l2')};
          @media (prefers-color-scheme: dark) {
            box-shadow: 0 0 0 1px ${ThemeImpl.instance.get('palette.dark.background')}, 0 0 0 3px ${ThemeImpl.instance.get('palette.light.shadow.l2')};
          }
        }

        ${buttonVariants}

        .button.disabled, .button.disabled:hover {
          cursor: not-allowed;
          background-color: ${ThemeImpl.instance.get('palette.light.surface.disabled')};
          color: ${ThemeImpl.instance.get('palette.light.text.disabled')};

          @media (prefers-color-scheme: dark) {
            background-color: ${ThemeImpl.instance.get('palette.dark.surface.disabled')};
            color: ${ThemeImpl.instance.get('palette.dark.text.disabled')};
          }
        }

        .button.loading {
          cursor: wait;
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
