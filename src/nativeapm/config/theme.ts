/// <reference path="../references.ts" />

type NativeApmThemeConfigType = {
  wrapper: Record<string, any>;
  spinner: Record<string, any>;
  logo: Record<string, any>;
  buttons: Record<string, any>;
  form: Record<string, any>;
  message: Record<string, any>;
  actionImage: Record<string, any>;
};

const defaultTheme: NativeApmThemeConfigType = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    fontSize: '1rem',
  },
  spinner: {
    width: '4rem',
    height: '4rem',
    border: '5px solid #f2f2f2',
    borderBottomColor: '#7e57c2',
    borderRadius: '50%',
    display: 'inline-block',
    boxSizing: 'border-box',
    animation: 'rotation 1s linear infinite',
  },
  logo: {
    width: '10rem',
    height: 'auto',
    marginBottom: '1rem',
  },
  buttons: {
    default: {
      borderWidth: '0px',
      color: '#fff',
      backgroundColor: '#7e57c2',
      cursor: 'pointer',
      padding: '0.8rem 1.5rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      marginTop: '0.8rem',
      fontSize: '1rem',
      borderRadius: '5px',
    },
    spinner: {
      position: 'absolute',
      width: '1rem',
      height: '1rem',
      border: '3px solid #f2f2f2',
      borderBottomColor: '#7e57c2',
      borderRadius: '50%',
      display: 'inline-block',
      boxSizing: 'border-box',
      animation: 'rotation 1s linear infinite',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.8rem',
    width: '100%',
    inputsWrapper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      gap: '0.8rem',
      alignItems: 'center',
      width: '100%',
    },
    inputs: {
      wrapper: {
        width: 'inherit',
      },
      text: {
        padding: '0 0.8rem',
        height: '3rem',
        border: '1px solid #d7d7d7',
        borderRadius: '5px',
        width: '100%',
        fontSize: '1rem',
      },
      select: {
        height: '3rem',
        width: '100%',
        border: '1px solid #d7d7d7',
        borderRadius: '5px',
        fontSize: '1rem',
      },
      numeric: {
        display: 'flex',
        flexDirection: 'row',
        gap: '0.8rem',
        character: {
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          border: '1px solid #d7d7d7',
          borderRadius: '5px',
          textAlign: 'center',
        },
      },
    },
    labels: {
      display: 'block',
      marginBottom: '10px',
      requiredStar: {
        color: '#e74c3c',
        marginLeft: '0.1rem',
      },
    },
    errors: {
      display: 'block',
      color: '#e74c3c',
      fontSize: '0.9rem',
      minHeight: '1rem',
      marginTop: '0.3rem',
      width: '100%',
    },
  },
  message: {
    fontSize: '1.1rem',
  },
  actionImage: {
    marginTop: '1.3rem',
    width: '15rem',
    height: 'auto',
  },
};

const spinnerLoadingAnimation = `
@keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut NativeApmTheme class
   */
  export class NativeApmThemeConfig {
    /**
     * Native APM theme buttons
     * @type {NativeApmThemeConfigType['wrapper']}
     */

    wrapper: NativeApmThemeConfigType['wrapper'];
    /**
     * Native APM theme spinner
     * @type {NativeApmThemeConfigType['spinner']}
     */

    spinner: NativeApmThemeConfigType['spinner'];
    /**
     * Native APM theme logo
     * @type {NativeApmThemeConfigType['logo']}
     */

    logo: NativeApmThemeConfigType['logo'];
    /**
     * Native APM theme buttons
     * @type {NativeApmThemeConfigType['buttons']}
     */

    buttons: NativeApmThemeConfigType['buttons'];
    /**
     * Native APM theme form
     * @type {NativeApmThemeConfigType['form']}
     */

    form: NativeApmThemeConfigType['form'];
    /**
     * Native APM theme message
     * @type {NativeApmThemeConfigType['message']}
     */

    message: NativeApmThemeConfigType['message'];
    /**
     * Native APM theme actionImage
     * @type {NativeApmThemeConfigType['actionImage']}
     */

    actionImage: NativeApmThemeConfigType['actionImage'];

    /**
     * NativeApmTheme constructor
     */
    constructor() {
      this.wrapper = defaultTheme.wrapper;
      this.spinner = defaultTheme.spinner;
      this.logo = defaultTheme.logo;
      this.buttons = defaultTheme.buttons;
      this.form = defaultTheme.form;
      this.message = defaultTheme.message;
      this.actionImage = defaultTheme.actionImage;
    }

    /**
     * This function returns theme of NativeAPM instance
     * @return {NativeApmThemeConfigType}
     */
    public getTheme(): NativeApmThemeConfigType {
      return {
        wrapper: this.wrapper,
        spinner: this.spinner,
        logo: this.logo,
        buttons: this.buttons,
        form: this.form,
        message: this.message,
        actionImage: this.actionImage,
      };
    }

    /**
     * This function sets theme of the widget
     */
    public setTheme(theme: NativeApmThemeConfigType) {
      const mergeObjects = (obj1: any, obj2: any) => {
        for (const key in obj2) {
          if (obj2.hasOwnProperty(key)) {
            if (typeof obj2[key] === 'object' && obj2[key] !== null) {
              obj1[key] = mergeObjects(obj1[key], obj2[key]);
            } else {
              obj1[key] = obj2[key];
            }
          }
        }
        return obj1;
      };

      mergeObjects(this.wrapper, theme.wrapper);
      mergeObjects(this.spinner, theme.spinner);
      mergeObjects(this.logo, theme.logo);
      mergeObjects(this.buttons, theme.buttons);
      mergeObjects(this.form, theme.form);
      mergeObjects(this.message, theme.message);
      mergeObjects(this.actionImage, theme.actionImage);

      return;
    }

    /**
     * This function returns initial styles tag for the widget
     */
    public createInitialStyleTag() {
      const styleElement = document.createElement('style');

      styleElement.innerHTML = spinnerLoadingAnimation;

      return styleElement;
    }
  }
}
