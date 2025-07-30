/// <reference path="../../references.ts" />

interface INativeApmInput {
  getInputElement(): HTMLElement
  validate(): boolean
  getValue(): any
  setErrorMessage(): void
  inputData: NativeApmInputData
}

type NativeApmInputData = {
  key: string
  type: string
  required: boolean
  length: number | null
  max_length: number | null
  display_name: string
  available_values?: Array<{
    value: string
    display_name: string
    default: boolean
  }>
}

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling input elements based on input type
   */
  export class NativeApmInput {
    /**
     * Native APM input instance
     * @type {INativeApmInput}
     */
    inputInstance: INativeApmInput
    processOut: ProcessOut

    /**
     * Native APM Input constructor
     */
    constructor(
      processOut: ProcessOut,
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string,
    ) {
      this.processOut = processOut
      this.inputInstance = this.createInputElement(inputData, theme, prefilledValue)
    }

    /**
     * This function returns the input element
     */
    public getInputElement() {
      return this.inputInstance.getInputElement()
    }

    /**
     * This function returns the input instance
     */
    public getInputInstance() {
      return this.inputInstance
    }

    /**
     * This function returns the input value
     */
    public getInputValue() {
      console.log(this.inputInstance.getValue())
      return this.inputInstance.getValue()
    }

    /**
     * This function creates the input element
     */
    private createInputElement(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue: string,
    ) {
      switch (inputData.type) {
        case "email":
          return new NativeApmEmailInput(inputData, theme, prefilledValue)
        case "numeric":
          if (inputData.length <= 6) {
            return new NativeApmNumericInput(inputData, theme)
          } else {
            return new NativeApmTextInput(inputData, theme, prefilledValue)
          }
        case "phone":
          return new NativeApmPhoneWithCountryInput(
            this.processOut,
            inputData,
            theme,
            prefilledValue,
          )

        case "single_select":
        case "single-select":
          return new NativeApmSelectInput(inputData, theme)
        default:
          return new NativeApmTextInput(inputData, theme, prefilledValue)
      }
    }
  }
}
