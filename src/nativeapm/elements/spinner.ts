/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for spinner element used in loading states
   */
  export class NativeApmSpinner {
    /**
     * Native APM spinner element
     * @type {HTMLElement}
     */
    spinnerElement: HTMLElement;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM Spinner constructor
     */
    constructor(theme: NativeApmThemeConfigType, id?: string) {
      this.theme = theme;
      this.spinnerElement = this.createSpinnerElement(id);
    }

    /**
     * This function returns the spinner element
     */
    public getSpinnerElement() {
      return this.spinnerElement;
    }

    /**
     * This function creates the spinner element
     */
    private createSpinnerElement(id?: string) {
      const spinnerElement = document.createElement('span');
      spinnerElement.setAttribute('class', 'native-apm-spinner');

      if (id) {
        spinnerElement.setAttribute('id', id);
      }

      StylesUtils.styleElement(spinnerElement, this.theme.spinner);

      return spinnerElement;
    }
  }
}
