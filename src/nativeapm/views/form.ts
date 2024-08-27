/// <reference path="../references.ts" />

type NativeApmFormData = {
  gateway: any;
  parameters: NativeApmInputData[];
  invoice: {
    amount: string;
    currency_code: string;
  };
};

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling form view
   */
  export class NativeApmFormView {
    /**
     * Native APM form element
     * @type {HTMLFormElement}
     */
    formElement: HTMLFormElement;

    /**
     * Native APM submit button element
     * @type {NativeApmButton}
     */
    submitButton: NativeApmButton;

    /**
     * Native APM inputs of the form
     * @type {NativeApmInput[]}
     */
    formInputs: NativeApmInput[];

    /**
     * Native APM widget options
     * @type {NativeApmWidgetOptionsType}
     */
    widgetOptions: NativeApmWidgetOptionsType;

    /**
     * Theme of the Native APM widget
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType;

    /**
     * Handler fuctnion which fires on form submit
     * @type {Function}
     */
    onSubmitHandler: Function;

    /**
     * Form data like configuration of inputs etc
     * @type {NativeApmFormData}
     */
    formData: NativeApmFormData;

    /**
     * Prefilled data of the user
     * @type {any}
     */
    prefilledData: PrefilledData;

    /**
     * Native APM Form constructor
     */
    constructor(
      formData: NativeApmFormData,
      onSubmitHandler: Function,
      theme: NativeApmThemeConfigType,
      prefilledData: PrefilledData,
      widgetOptions?: NativeApmWidgetOptionsType
    ) {
      if (!formData) {
        throw new Exception(
          'default',
          'Form data is not defined. You must provide valid form data to create the form view.'
        );
      }

      this.widgetOptions = widgetOptions;
      this.theme = theme;
      this.prefilledData = prefilledData;
      this.formData = formData;
      this.onSubmitHandler = onSubmitHandler;
      this.formInputs = this.createFormInputs();
      this.submitButton = this.createSubmitButton();
      this.formElement = this.createFormElement();
    }

    /**
     * This function returns the form view element
     */
    public getViewElement() {
      return this.formElement;
    }

    /**
     * This function creates the form element
     */
    private createFormElement() {
      const form = document.createElement('form');
      const inputsWrapper = document.createElement('div');
      const paymentProviderImage = this.createPaymentProviderImage();

      form.setAttribute('class', 'native-apm-form');
      inputsWrapper.setAttribute('class', 'native-apm-form-inputs-wrapper');

      StylesUtils.styleElement(form, this.theme.form);
      this.styleInputsWrapper(inputsWrapper);

      this.formInputs.forEach((input) => {
        inputsWrapper.appendChild(input.getInputElement());
      });

      form.appendChild(paymentProviderImage);
      form.appendChild(inputsWrapper);
      form.appendChild(this.submitButton.getButtonElement());

      if (this.widgetOptions?.dynamicCheckout?.onBackButtonClick) {
        const backButton = this.createBackButton(this.widgetOptions?.dynamicCheckout?.onBackButtonClick);
        form.appendChild(backButton);
      }

      form.addEventListener('submit', this.submitForm.bind(this));

      return form;
    }

    /**
     * This function creates the form inputs
     */
    private createFormInputs() {
      return this.formData.parameters.map((parameter: any) => {
        const prefilledValue = this.prefilledData[parameter.key];
        return new NativeApmInput(parameter, this.theme, prefilledValue);
      });
    }

    /**
     * This function creates the submit button of the form
     */
    private createSubmitButton() {
      const buttonText = `
      ${TextUtils.getText('submitButtonText')} 
      ${this.formData.invoice.amount} 
      ${this.formData.invoice.currency_code}
      `;

      return new NativeApmButton(buttonText, this.theme);
    }

    /**
     * This function creates the back button of the form
     */
    private createBackButton(onBackButtonClick: Function) {
      const backButton = document.createElement('button');

      backButton.setAttribute('class', 'native-apm-back-button');
      backButton.setAttribute('type', 'button');
      backButton.textContent = 'Back';

      backButton.addEventListener('click', function(e) {
        onBackButtonClick();
      });

      return backButton;
    }

    /**
     * This function creates the payment provider image element
     */
    private createPaymentProviderImage() {
      const merchantImg = document.createElement('img');

      merchantImg.setAttribute('class', 'native-apm-payment-provider-logo');
      merchantImg.setAttribute('src', this.formData.gateway.logo_url);

      StylesUtils.styleElement(merchantImg, this.theme.logo);

      return merchantImg;
    }

    /**
     * This function fires when the form is submitted
     */
    private submitForm(event: Event) {
      event.preventDefault();

      const isFormValid = this.formInputs.every((input) =>
        input.getInputInstance().validate()
      );

      if (isFormValid) {
        const values = this.getValuesFromInputs();

        this.submitButton.setLoadingState();

        this.onSubmitHandler(
          values,
          () => this.submitButton.resetLoadingState(),
          (invalid_fields: Array<any>) =>
            this.handleApiValidationErrors(invalid_fields)
        );
      }
    }

    /**
     * This function sets error message for invalid inputs after API validation
     */
    private handleApiValidationErrors(invalid_fields) {
      return invalid_fields.forEach((invalidField) =>
        this.markInputAsNotValid(invalidField)
      );
    }

    /**
     * This function fires when the form is submitted
     */
    private markInputAsNotValid(invalidInputData: {
      name: string;
      message: string;
    }) {
      this.formInputs.forEach((input) => {
        if (input.getInputInstance().inputData.key === invalidInputData.name) {
          input.getInputInstance().setErrorMessage();
        }
      });
    }

    /**
     * This function gets object with values of the form inputs
     */
    private getValuesFromInputs() {
      return this.formInputs.reduce((acc, input) => {
        return { ...acc, ...input.getInputValue() };
      }, {});
    }

    /**
     * This function styles inputs wrapper based on input type
     */
    private styleInputsWrapper(inputsWrapper: HTMLElement) {
      if (
        this.formInputs.length === 1 &&
        this.formInputs[0].getInputInstance().inputData.type === 'numeric'
      ) {
        StylesUtils.styleElement(inputsWrapper, {
          ...this.theme.form.inputsWrapper,
          width: 'auto',
        });
      } else {
        StylesUtils.styleElement(inputsWrapper, this.theme.form.inputsWrapper);
      }
    }
  }
}
