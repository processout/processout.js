/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for button element
   */
  export class NativeApmButton {
    loadingSpinnerID = 'button-loading-spinner';

    /**
     * Native APM button element
     * @type {HTMLElement}
     */
    buttonElement: HTMLElement;

    /**
     * Native APM button text element
     * @type {HTMLElement}
     */
    buttonText: HTMLElement;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM Button constructor
     */
    constructor(text: string, theme: NativeApmThemeConfigType) {
      this.theme = theme;
      this.buttonElement = this.createButtonElement(text);
    }

    /**
     * This function returns the button element
     */
    public getButtonElement() {
      return this.buttonElement;
    }

    /**
     * This function creates the button element and button text element
     */
    private createButtonElement(text: string) {
      const buttonElement = document.createElement('button');

      buttonElement.setAttribute('type', 'submit');
      buttonElement.setAttribute('class', 'native-apm-button');

      this.buttonText = document.createElement('span');
      this.buttonText.textContent = text;

      StylesUtils.styleElement(buttonElement, this.theme.buttons.default);

      buttonElement.appendChild(this.buttonText);

      return buttonElement;
    }

    /**
     * This function sets the loading state and displays the spinner
     */
    public setLoadingState() {
      const spinner = this.createLoadingSpinner();

      StylesUtils.styleElement(this.buttonText, {
        opacity: '0',
      });

      this.buttonElement.appendChild(spinner);
    }

    /**
     * This function resets loading state and removes the spinner
     */
    public resetLoadingState() {
      StylesUtils.styleElement(this.buttonText, {
        opacity: '1',
      });

      this.removeLoadingSpinner();
    }

    /**
     * This function creates loading spinner
     */
    private createLoadingSpinner() {
      const spinner = new NativeApmSpinner(
        this.theme,
        this.loadingSpinnerID
      ).getSpinnerElement();

      StylesUtils.styleElement(spinner, this.theme.buttons.spinner);

      return spinner;
    }

    /**
     * This function removes loading spinner
     */
    private removeLoadingSpinner() {
      const spinner = document.getElementById(this.loadingSpinnerID);

      if (spinner) {
        this.buttonElement.removeChild(spinner);
      }
    }
  }
}
