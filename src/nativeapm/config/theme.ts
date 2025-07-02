/// <reference path="../references.ts" />

type NativeApmThemeConfigType = {
  wrapper?: Record<string, any>
  spinner?: Record<string, any>
  logo?: Record<string, any>
  buttons?: Record<string, any>
  form?: Record<string, any>
  message?: Record<string, any>
  actionImage?: Record<string, any>
}

const defaultTheme: NativeApmThemeConfigType = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    fontSize: "1rem",
  },
  spinner: {
    width: "4rem",
    height: "4rem",
    border: "5px solid #f2f2f2",
    borderBottomColor: "#7e57c2",
    borderRadius: "50%",
    display: "inline-block",
    boxSizing: "border-box",
    animation: "rotation 1s linear infinite",
  },
  logo: {
    width: "10rem",
    height: "auto",
    marginBottom: "1rem",
  },
  buttons: {
    default: {
      borderWidth: "0px",
      color: "#fff",
      backgroundColor: "#7e57c2",
      cursor: "pointer",
      padding: "0.8rem 1.5rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      marginTop: "0.8rem",
      fontSize: "1rem",
      borderRadius: "5px",
    },
    spinner: {
      position: "absolute",
      width: "1rem",
      height: "1rem",
      border: "3px solid #f2f2f2",
      borderBottomColor: "#7e57c2",
      borderRadius: "50%",
      display: "inline-block",
      boxSizing: "border-box",
      animation: "rotation 1s linear infinite",
    },
  },
  form: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.8rem",
    width: "100%",
    inputsWrapper: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "0.8rem",
      alignItems: "center",
      width: "100%",
    },
    inputs: {
      wrapper: {
        width: "inherit",
      },
      text: {
        padding: "0 0.8rem",
        height: "3rem",
        border: "1px solid #d7d7d7",
        borderRadius: "5px",
        width: "100%",
        fontSize: "1rem",
      },
      select: {
        height: "3rem",
        width: "100%",
        border: "1px solid #d7d7d7",
        borderRadius: "5px",
        fontSize: "1rem",
      },
      numeric: {
        display: "flex",
        flexDirection: "row",
        gap: "0.8rem",
        character: {
          width: "3rem",
          height: "3rem",
          fontSize: "1.5rem",
          border: "1px solid #d7d7d7",
          borderRadius: "5px",
          textAlign: "center",
        },
      },
      phoneWithCountry: {
        container: {
          display: "flex",
          alignItems: "stretch",
          border: "1px solid #d7d7d7",
          borderRadius: "5px",
          overflow: "hidden",
          outline: "none",
          transition: "border-color 0.2s ease",
        },
        containerFocused: {
          outline: "1.5px solid rgba(152, 152, 152, 0.76)",
          outlineOffset: "0px",
        },
        countrySelectContainer: {
          flexShrink: "0",
          borderRight: "1px solid #d7d7d7",
          backgroundColor: "#f8f9fa",
        },
        countrySelect: {
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "8px 6px",
          width: "130px",
          fontSize: "0.9rem",
          borderRight: "6px solid transparent",
          height: "3rem",
        },
        phoneInputsContainer: {
          display: "flex",
          alignItems: "stretch",
          flex: "1",
        },
        phonePrefixInput: {
          border: "none",
          outline: "none",
          background: "white",
          padding: "8px 0 8px 6px",
          fontSize: "14px",
          height: "3rem",
        },
        phoneNumberInput: {
          border: "none",
          outline: "none",
          padding: "8px 6px",
          width: "100%",
          fontSize: "14px",
          height: "3rem",
        },
      },
    },
    labels: {
      display: "block",
      marginBottom: "10px",
      requiredStar: {
        color: "#e74c3c",
        marginLeft: "0.1rem",
      },
    },
    errors: {
      display: "block",
      color: "#e74c3c",
      fontSize: "0.9rem",
      minHeight: "1rem",
      marginTop: "0.3rem",
      width: "100%",
    },
  },
  message: {
    fontSize: "1.1rem",
  },
  actionImage: {
    marginTop: "1.3rem",
    marginBottom: "1.3rem",
    width: "15rem",
    height: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}

const spinnerLoadingAnimation = `
@keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

module ProcessOut {
  export class NativeApmThemeConfig {
    wrapper: NativeApmThemeConfigType["wrapper"]
    spinner: NativeApmThemeConfigType["spinner"]
    logo: NativeApmThemeConfigType["logo"]
    buttons: NativeApmThemeConfigType["buttons"]
    form: NativeApmThemeConfigType["form"]
    message: NativeApmThemeConfigType["message"]
    actionImage: NativeApmThemeConfigType["actionImage"]

    constructor() {
      this.wrapper = defaultTheme.wrapper
      this.spinner = defaultTheme.spinner
      this.logo = defaultTheme.logo
      this.buttons = defaultTheme.buttons
      this.form = defaultTheme.form
      this.message = defaultTheme.message
      this.actionImage = defaultTheme.actionImage
    }

    public getTheme(): NativeApmThemeConfigType {
      return {
        wrapper: this.wrapper,
        spinner: this.spinner,
        logo: this.logo,
        buttons: this.buttons,
        form: this.form,
        message: this.message,
        actionImage: this.actionImage,
      }
    }

    public setTheme(theme: NativeApmThemeConfigType) {
      const mergeObjects = (obj1: any, obj2: any) => {
        for (const key in obj2) {
          if (obj2.hasOwnProperty(key)) {
            if (typeof obj2[key] === "object" && obj2[key] !== null) {
              obj1[key] = mergeObjects(obj1[key], obj2[key])
            } else {
              obj1[key] = obj2[key]
            }
          }
        }
        return obj1
      }

      mergeObjects(this.wrapper, theme.wrapper)
      mergeObjects(this.spinner, theme.spinner)
      mergeObjects(this.logo, theme.logo)
      mergeObjects(this.buttons, theme.buttons)
      mergeObjects(this.form, theme.form)
      mergeObjects(this.message, theme.message)
      mergeObjects(this.actionImage, theme.actionImage)

      return
    }

    public createInitialStyleTag() {
      const styleElement = document.createElement("style")

      styleElement.innerHTML = spinnerLoadingAnimation

      return styleElement
    }
  }
}
