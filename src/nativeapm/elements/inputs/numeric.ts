/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling numeric inputs
   */
  export class NativeApmNumericInput implements INativeApmInput {
    /**
     * Native APM input element
     * @type {HTMLElement}
     */
    inputElement: HTMLElement;

    /**
     * Native APM input data
     * @type {NativeApmInputData}
     */
    inputData: NativeApmInputData;

    /**
     * Native APM error message element
     * @type {HTMLElement}
     */
    errorMessageElement: HTMLElement;

    /**
     * Native APM input label element
     * @type {HTMLElement}
     */
    inputLabel: HTMLElement;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM Input constructor
     */
    constructor(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType
    ) {
      this.theme = theme;
      this.inputData = inputData;
      this.inputElement = this.createInputElement();
      this.errorMessageElement = this.createErrorMessageElement();
      this.inputLabel = this.createInputLabel();
    }

    /**
     * This function returns the input element
     */
    public getInputElement() {
      const inputWrapper = document.createElement('div');

      inputWrapper.setAttribute('class', 'native-apm-numeric-input-wrapper');
      StylesUtils.styleElement(inputWrapper, this.theme.form.inputs.wrapper);

      inputWrapper.appendChild(this.inputLabel);
      inputWrapper.appendChild(this.inputElement);
      inputWrapper.appendChild(this.errorMessageElement);

      return inputWrapper;
    }

    /**
     * This function creates input element
     */
    private createInputElement() {
      const input = document.createElement('div');

      for (let i = 0; i < this.inputData.length; i++) {
        const inputDigit = this.createInputDigitElement();

        input.appendChild(inputDigit);
      }

      input.setAttribute('class', 'native-apm-numeric-input');
      StylesUtils.styleElement(input, this.theme.form.inputs.numeric);

      return input;
    }

    /**
     * This function creates input digit element
     */
    private createInputDigitElement() {
      const inputDigit = document.createElement('input');

      inputDigit.setAttribute('class', 'native-apm-numeric-input-character');
      inputDigit.setAttribute('type', 'text');
      inputDigit.setAttribute('maxlength', '1');
      inputDigit.setAttribute('id', this.inputData.key);

      const handleNextCharacter = (e: Event) => {
        this.resetErrorMessage();

        const inputElement = e.target as HTMLInputElement;
        inputElement.value = inputElement.value.replace(/[^0-9]/g, '');

        if (
          inputElement.value !== '' &&
          inputElement.nextElementSibling &&
          inputElement.nextElementSibling.nodeName === 'INPUT'
        ) {
          (inputElement.nextElementSibling as HTMLInputElement).focus();
        }
      };

      const handlePreviousCharacter = (e: Event) => {
        const backspaceClicked =
          (e as KeyboardEvent).key === 'Backspace' &&
          e.target instanceof HTMLInputElement &&
          (e.target as HTMLInputElement).previousElementSibling &&
          (e.target as HTMLInputElement).value === '';

        if (backspaceClicked) {
          (e.target.previousElementSibling as HTMLInputElement).focus();
        }
      };

      inputDigit.addEventListener('input', handleNextCharacter);
      inputDigit.addEventListener('keydown', handlePreviousCharacter);

      StylesUtils.styleElement(
        inputDigit,
        this.theme.form.inputs.numeric.character
      );

      return inputDigit;
    }

    /**
     * This function creates error message element
     */
    private createErrorMessageElement() {
      const errorMessageElement = document.createElement('span');

      errorMessageElement.setAttribute('class', 'native-apm-input-error');
      StylesUtils.styleElement(errorMessageElement, this.theme.form.errors);

      return errorMessageElement;
    }

    /**
     * This function creates input label element
     */
    private createInputLabel() {
      const label = document.createElement('label');

      label.textContent = this.inputData.display_name;
      label.setAttribute('class', 'native-apm-input-label');
      label.setAttribute('for', this.inputData.key);

      if (this.inputData.required) {
        const requiredStar = this.createRequiredStar();
        label.appendChild(requiredStar);
      }

      StylesUtils.styleElement(label, this.theme.form.labels);

      return label;
    }

    /**
     * This function creates required star element for label in required inputs
     */
    private createRequiredStar() {
      const requiredStar = document.createElement('span');
      requiredStar.textContent = '*';

      StylesUtils.styleElement(
        requiredStar,
        this.theme.form.labels.requiredStar
      );

      return requiredStar;
    }

    /**
     * This function validates the input
     */
    public validate() {
      const isValid = Array.prototype.slice
        .call(this.inputElement.childNodes)
        .every((input: HTMLInputElement) => input.value.length);

      if (!isValid) {
        this.setErrorMessage();
      }

      return isValid;
    }

    /**
     * This function returns value of the input
     */
    public getValue() {
      const value = Array.prototype.slice
        .call(this.inputElement.childNodes)
        .reduce((acc: string, input: HTMLInputElement) => {
          return acc + input.value;
        }, '');

      return { [this.inputData.key]: value };
    }

    /**
     * This function resets error message
     */
    private resetErrorMessage() {
      if (this.errorMessageElement.textContent.length) {
        this.errorMessageElement.textContent = '';
      }
    }

    /**
     * This function sets error message
     */
    public setErrorMessage() {
      this.errorMessageElement.textContent = TextUtils.getText('invalidCode');
    }
  }
}
