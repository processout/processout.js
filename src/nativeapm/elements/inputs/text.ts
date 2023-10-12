/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling text input
   */
  export class NativeApmTextInput implements INativeApmInput {
    /**
     * Native APM form element
     * @type {HTMLInputElement}
     */
    inputElement: HTMLInputElement;

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
     * Theme of the Native APM form
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Native APM Input constructor
     */
    constructor(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string
    ) {
      this.theme = theme;
      this.inputData = inputData;
      this.inputElement = this.createInputElement(prefilledValue);
      this.inputLabel = this.createInputLabel();
      this.errorMessageElement = this.createErrorMessageElement();
    }

    /**
     * This function returns the input element
     */
    public getInputElement() {
      const inputWrapper = document.createElement('div');

      inputWrapper.setAttribute('class', 'native-apm-text-input-wrapper');

      StylesUtils.styleElement(inputWrapper, this.theme.form.inputs.wrapper);

      inputWrapper.appendChild(this.inputLabel);
      inputWrapper.appendChild(this.inputElement);
      inputWrapper.appendChild(this.errorMessageElement);

      return inputWrapper;
    }

    /**
     * This function validates the input
     */
    public validate() {
      const isRequiredPassed = this.inputData.required
        ? this.inputElement.value.length > 0
        : true;

      const maxLengthPassed = this.inputData.max_length
        ? this.inputElement.value.length <= this.inputData.max_length
        : true;

      const lengthPassed = this.inputData.length
        ? this.inputElement.value.length === this.inputData.length
        : true;

      if (!(isRequiredPassed && maxLengthPassed && lengthPassed)) {
        this.setErrorMessage();
      }

      return isRequiredPassed && maxLengthPassed && lengthPassed;
    }

    /**
     * This function returns value of the input
     */
    public getValue() {
      return { [this.inputData.key]: this.inputElement.value };
    }

    /**
     * This function returns the input element
     */
    protected getRawInputElement() {
      return this.inputElement;
    }

    /**
     * This function creates input element
     */
    private createInputElement(prefilledValue?: string) {
      const input = document.createElement('input');

      input.setAttribute('class', 'native-apm-text-input');
      input.setAttribute('name', this.inputData.key);
      input.setAttribute('id', this.inputData.key);

      if (prefilledValue) {
        input.value = prefilledValue;
      }

      input.addEventListener('keypress', this.resetErrorMessage.bind(this));

      StylesUtils.styleElement(input, this.theme.form.inputs.text);

      return input;
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
    protected createInputLabel() {
      const label = document.createElement('label');

      label.setAttribute('class', 'native-apm-input-label');
      label.setAttribute('for', this.inputData.key);

      label.textContent = this.inputData.display_name;

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
    protected createRequiredStar() {
      const requiredStar = document.createElement('span');
      requiredStar.textContent = '*';

      StylesUtils.styleElement(
        requiredStar,
        this.theme.form.labels.requiredStar
      );

      return requiredStar;
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
      this.errorMessageElement.textContent =
        TextUtils.getText('invalidTextValue');
    }

    /**
     * This function sets error message
     */
    protected getInputData() {
      return this.inputData;
    }
  }
}
