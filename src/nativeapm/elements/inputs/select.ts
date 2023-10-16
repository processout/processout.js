/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling select input
   */
  export class NativeApmSelectInput implements INativeApmInput {
    /**
     * Native APM form element
     * @type {HTMLInputElement}
     */
    inputElement: HTMLSelectElement;

    /**
     * Native APM input data
     * @type {NativeApmInputData}
     */
    inputData: NativeApmInputData;

    /**
     * Native APM input label element
     * @type {HTMLElement}
     */
    inputLabel: HTMLElement;

    /**
     * Native APM error message element
     * @type {HTMLElement}
     */
    errorMessageElement: HTMLElement;

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
      this.inputLabel = this.createInputLabel();
      this.errorMessageElement = this.createErrorMessageElement();
    }

    /**
     * This function returns the input element
     */
    public getInputElement() {
      const inputWrapper = document.createElement('div');

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
      return true;
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
    private createInputElement() {
      const input = document.createElement('select');

      input.setAttribute('class', 'native-apm-select-input');
      input.setAttribute('name', this.inputData.key);

      this.inputData.available_values.forEach((value) => {
        const optionElement = this.createOptionElement(value);

        input.appendChild(optionElement);

        if (value.default) {
          input.setAttribute('selected', 'true');
        }
      });

      StylesUtils.styleElement(input, this.theme.form.inputs.select);

      return input;
    }

    /**
     * This function creates select option element
     */
    private createOptionElement(
      value: NativeApmInputData['available_values'][0]
    ) {
      const optionElement = document.createElement('option');

      optionElement.setAttribute('value', value.value);
      optionElement.textContent = value.display_name;

      return optionElement;
    }

    /**
     * This function creates input label element
     */
    private createInputLabel() {
      const label = document.createElement('label');
      label.textContent = this.inputData.display_name;

      label.setAttribute('class', 'native-apm-input-label');

      StylesUtils.styleElement(label, this.theme.form.labels);

      return label;
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
     * This function sets error message
     */
    public setErrorMessage() {
      this.errorMessageElement.textContent =
        TextUtils.getText('invalidTextValue');
    }
  }
}
