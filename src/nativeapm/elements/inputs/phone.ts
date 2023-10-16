/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling phone input
   */
  export class NativeApmPhoneInput extends NativeApmTextInput {
    phoneNumberRegex = /^\+[1-9][0-9]{10,14}$/;

    /**
     * Native APM Email Input constructor
     */
    constructor(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string
    ) {
      super(inputData, theme, prefilledValue);
      super
        .getRawInputElement()
        .setAttribute(
          'placeholder',
          TextUtils.getText('phoneNumberPlaceholder')
        );
      this.inputLabel = this.createInputLabel();
    }

    /**
     * This function returns value of the input
     */
    public getValue() {
      return {
        [this.inputData.key]: this.inputElement.value.replace(/\s/g, ''),
      };
    }

    /**
     * This function creates input label element
     */
    protected createInputLabel() {
      const label = document.createElement('label');

      label.setAttribute('class', 'native-apm-input-label');
      label.textContent = TextUtils.getText('phoneNumberLabel');

      if (this.inputData.required) {
        const requiredStar = super.createRequiredStar();
        label.appendChild(requiredStar);
      }

      StylesUtils.styleElement(label, this.theme.form.labels);

      return label;
    }

    public validate() {
      const isRequiredPassed = super.validate();

      const valueWithoutSpaces = this.inputElement.value.replace(/\s/g, '');

      const isPhone = this.phoneNumberRegex.test(valueWithoutSpaces);

      if (!isPhone) {
        this.setErrorMessage();
      }

      return isRequiredPassed && isPhone;
    }

    /**
     * This function sets error message
     */
    public setErrorMessage(message?: string) {
      this.errorMessageElement.textContent =
        message || TextUtils.getText('invalidPhoneNumber');
    }
  }
}
