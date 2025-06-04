module ProcessOut {
  const spacing = ['xs', 'sm', 'md', 'lg', 'xl'] as const
  type Spacing = (typeof spacing)[number]

  interface Palette {
    primary: string
    secondary: string
    tertiary: string
  }

  export interface ThemeOptions {
    spacing: Record<Spacing, string>
    colors: {
      light: Palette
      dark: Palette
    }
  }

  interface Theme {
    get(): ThemeOptions
    get<P extends Paths<ThemeOptions>>(path: P): PathValue<ThemeOptions, P>
    update(theme: DeepPartial<ThemeOptions>): void

    createStyles(): CSSText
  }

  export class ThemeImpl implements Theme {
    static _instance: Theme;

    private theme: ThemeOptions = {
      colors: {
        dark: {
          primary: "",
          secondary: "",
          tertiary: "",
        },
        light: {
          primary: "",
          secondary: "",
          tertiary: "",
        }
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "30px",
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

    public update(theme: DeepPartial<ThemeOptions>) {
      this.theme = this.deepMerge(this.theme, theme)
    }

    public createStyles() {
      return css`
        ${this.resetCss}

        .main {
          font-family: "Helvetica Neue", Arial, sans-serif;
          container: main / size;
        }

        .page {
          display: flex;
          width: 100%;
          min-height: 400px;
          padding: ${ThemeImpl.instance.get('spacing.sm')};
        }

        .empty-view {
          width: 100%;
          text-align: center;
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
