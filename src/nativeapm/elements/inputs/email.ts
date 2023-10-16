/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling email input
   */
  export class NativeApmEmailInput extends NativeApmTextInput {
    emailRegex = /^\S+@\S+$/i;

    /**
     * Native APM Email Input constructor
     */
    constructor(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string
    ) {
      super(inputData, theme, prefilledValue);
      const rawInputElement = super.getRawInputElement();
      rawInputElement.setAttribute(
        'placeholder',
        TextUtils.getText('emailPlaceholder')
      );
      rawInputElement.setAttribute('type', 'email');
    }

    public validate() {
      const isRequiredPassed = super.validate();

      const isEmail = this.emailRegex.test(this.inputElement.value);

      if (!isEmail) {
        this.setErrorMessage();
      }

      return isRequiredPassed && isEmail;
    }

    /**
     * This function sets error message
     */
    public setErrorMessage() {
      this.errorMessageElement.textContent = TextUtils.getText('invalidEmail');
    }
  }
}
