/// <reference path="../../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling phone input with country code selection
   */
  export class NativeApmPhoneWithCountryInput implements INativeApmInput {
    /**
     * Native APM country code select element
     * @type {HTMLSelectElement}
     */
    countrySelectElement: HTMLSelectElement

    /**
     * Native APM phone prefix input element (auto-populated from country selection)
     * @type {HTMLInputElement}
     */
    phonePrefixInputElement: HTMLInputElement

    /**
     * Native APM phone number input element
     * @type {HTMLInputElement}
     */
    phoneNumberInputElement: HTMLInputElement

    /**
     * Native APM input data
     * @type {NativeApmInputData}
     */
    inputData: NativeApmInputData

    /**
     * Native APM error message element
     * @type {HTMLElement}
     */
    errorMessageElement: HTMLElement

    /**
     * Native APM input label element
     * @type {HTMLElement}
     */
    inputLabel: HTMLElement

    /**
     * Native APM phone input container element
     * @type {HTMLElement}
     */
    phoneInputContainer: HTMLElement

    /**
     * Theme of the Native APM form
     * @type {NativeApmThemeConfigType}
     */
    theme: NativeApmThemeConfigType

    /**
     * Phone number regex for validation
     */
    phoneNumberRegex = /^[0-9]{7,15}$/

    /**
     * Native APM Input constructor
     */
    constructor(
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string,
    ) {
      this.theme = theme
      this.inputData = inputData
      this.countrySelectElement = this.createCountrySelectElement()
      this.phonePrefixInputElement = this.createPhonePrefixInputElement()
      this.phoneNumberInputElement = this.createPhoneNumberInputElement(prefilledValue)
      this.inputLabel = this.createInputLabel()
      this.errorMessageElement = this.createErrorMessageElement()
    }

    /**
     * This function returns the input element
     */
    public getInputElement() {
      const inputWrapper = document.createElement("div")
      inputWrapper.setAttribute("class", "native-apm-phone-with-country-input-wrapper")

      const phoneInputContainer = document.createElement("div")
      phoneInputContainer.setAttribute("class", "native-apm-phone-input-container")
      this.phoneInputContainer = phoneInputContainer

      const countrySelectContainer = document.createElement("div")
      countrySelectContainer.setAttribute("class", "native-apm-country-select-container")

      const phoneInputsContainer = document.createElement("div")
      phoneInputsContainer.setAttribute("class", "native-apm-phone-inputs-container")

      StylesUtils.styleElement(inputWrapper, this.theme.form.inputs.wrapper)

      StylesUtils.styleElement(
        this.countrySelectElement,
        this.theme.form.inputs.phoneWithCountry.countrySelect,
      )

      StylesUtils.styleElement(
        this.phonePrefixInputElement,
        this.theme.form.inputs.phoneWithCountry.phonePrefixInput,
      )

      StylesUtils.styleElement(
        this.phoneNumberInputElement,
        this.theme.form.inputs.phoneWithCountry.phoneNumberInput,
      )

      StylesUtils.styleElement(
        phoneInputContainer,
        this.theme.form.inputs.phoneWithCountry.container,
      )

      StylesUtils.styleElement(
        countrySelectContainer,
        this.theme.form.inputs.phoneWithCountry.countrySelectContainer,
      )

      StylesUtils.styleElement(
        phoneInputsContainer,
        this.theme.form.inputs.phoneWithCountry.phoneInputsContainer,
      )

      // Initially hide the prefix input and set phone input to full width
      this.phonePrefixInputElement.style.display = "none"
      this.updatePhoneInputLayout()

      // Set up accessibility features
      this.setupAccessibility()

      this.countrySelectElement.addEventListener("change", () => this.handleCountrySelection())

      countrySelectContainer.appendChild(this.countrySelectElement)
      phoneInputsContainer.appendChild(this.phonePrefixInputElement)
      phoneInputsContainer.appendChild(this.phoneNumberInputElement)

      phoneInputContainer.appendChild(countrySelectContainer)
      phoneInputContainer.appendChild(phoneInputsContainer)

      inputWrapper.appendChild(this.inputLabel)
      inputWrapper.appendChild(phoneInputContainer)
      inputWrapper.appendChild(this.errorMessageElement)

      return inputWrapper
    }

    /**
     * This function handles country selection and populates phone prefix
     */
    private handleCountrySelection() {
      const selectedCountryCode = this.countrySelectElement.value

      if (selectedCountryCode) {
        this.phonePrefixInputElement.value = `(${selectedCountryCode})`
        this.phonePrefixInputElement.style.display = "block"

        this.updatePhoneInputLayout()
        this.updatePrefixInputWidth()

        // Focus on phone number input after country selection
        this.phoneNumberInputElement.focus()
      } else {
        this.phonePrefixInputElement.value = ""
        this.phonePrefixInputElement.style.display = "none"
        this.updatePhoneInputLayout()
      }

      this.resetErrorMessage()
    }

    /**
     * This function updates the phone input layout based on whether prefix is shown
     */
    private updatePhoneInputLayout() {
      const prefixVisible = this.phonePrefixInputElement.style.display !== "none"

      if (prefixVisible) {
        // Show prefix and phone number inputs side by side
        this.phoneNumberInputElement.style.width = "100%"

        // Hide placeholder when prefix is visible (country is selected)
        this.phoneNumberInputElement.removeAttribute("placeholder")
      } else {
        // Show only phone number input with full width and placeholder
        this.phoneNumberInputElement.style.width = "100%"
        this.phoneNumberInputElement.setAttribute(
          "placeholder",
          TextUtils.getText("phoneNumberPlaceholder") || "Phone number",
        )
      }
    }

    /**
     * This function updates the prefix input width based on its content
     */
    private updatePrefixInputWidth() {
      const prefixValue = this.phonePrefixInputElement.value

      if (prefixValue) {
        // Calculate width based on character count (approximate)
        const charCount = prefixValue.length
        this.phonePrefixInputElement.style.width = `${charCount}ch`
      }
    }

    /**
     * This function sets up accessibility features for the phone input
     */
    private setupAccessibility() {
      // Make the container focusable and add ARIA attributes
      this.phoneInputContainer.setAttribute("tabindex", "0")
      this.phoneInputContainer.setAttribute("role", "group")
      this.phoneInputContainer.setAttribute("aria-labelledby", `${this.inputData.key}_label`)
      this.phoneInputContainer.setAttribute("aria-describedby", `${this.inputData.key}_error`)

      // Add focus event listeners to all input elements
      this.countrySelectElement.addEventListener("focus", () => this.handleInputFocus())
      this.phonePrefixInputElement.addEventListener("focus", () => this.handleInputFocus())
      this.phoneNumberInputElement.addEventListener("focus", () => this.handleInputFocus())

      // Add blur event listeners to all input elements
      this.countrySelectElement.addEventListener("blur", () => this.handleInputBlur())
      this.phonePrefixInputElement.addEventListener("blur", () => this.handleInputBlur())
      this.phoneNumberInputElement.addEventListener("blur", () => this.handleInputBlur())

      // Add keyboard navigation to the container
      this.phoneInputContainer.addEventListener("keydown", event =>
        this.handleContainerKeyDown(event),
      )
    }

    /**
     * This function handles focus events on any input within the phone input group
     */
    private handleInputFocus() {
      // Add focused styles to the container
      StylesUtils.styleElement(
        this.phoneInputContainer,
        this.theme.form.inputs.phoneWithCountry.containerFocused,
      )

      // Update ARIA attributes to indicate focus
      this.phoneInputContainer.setAttribute("aria-expanded", "true")
    }

    /**
     * This function handles blur events on any input within the phone input group
     */
    private handleInputBlur() {
      // Check if any child element is still focused
      const activeElement = document.activeElement

      const isAnyChildFocused =
        activeElement === this.countrySelectElement ||
        activeElement === this.phonePrefixInputElement ||
        activeElement === this.phoneNumberInputElement ||
        activeElement === this.phoneInputContainer

      if (!isAnyChildFocused) {
        // Remove focused styles from the container
        StylesUtils.styleElement(
          this.phoneInputContainer,
          this.theme.form.inputs.phoneWithCountry.container,
        )

        // Update ARIA attributes
        this.phoneInputContainer.setAttribute("aria-expanded", "false")
      }
    }

    /**
     * This function handles keyboard navigation within the container
     */
    private handleContainerKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Enter":
          // Focus the country select when container is activated
          event.preventDefault()
          this.countrySelectElement.focus()
          break
        case "Tab":
          // Allow normal tab navigation
          break
        default:
          // For other keys, focus the phone number input
          if (!this.phoneNumberInputElement.matches(":focus")) {
            this.phoneNumberInputElement.focus()
          }
          break
      }
    }

    /**
     * This function validates the input
     */
    public validate() {
      const isRequiredPassed = this.inputData.required
        ? this.phoneNumberInputElement.value.length > 0
        : true

      const isPhoneValid =
        this.phoneNumberInputElement.value.length > 0
          ? this.phoneNumberRegex.test(this.phoneNumberInputElement.value.replace(/\s/g, ""))
          : true

      const isCountrySelected = this.countrySelectElement.value.length > 0
      const isPrefixValid = this.phonePrefixInputElement.value.length > 0

      if (!(isRequiredPassed && isPhoneValid)) {
        this.setErrorMessage()
      }

      if (!isCountrySelected) {
        this.setErrorMessage(TextUtils.getText("invalidCountryCode") || "Invalid country code")
      }

      return isRequiredPassed && isPhoneValid && isCountrySelected && isPrefixValid
    }

    /**
     * This function returns value of the input
     */
    public getValue() {
      const phonePrefix =
        this.phonePrefixInputElement.value && this.phonePrefixInputElement.value.length > 0
          ? this.phonePrefixInputElement.value.replace(/[()]/g, "")
          : ""

      const phoneNumber =
        this.phoneNumberInputElement.value && this.phoneNumberInputElement.value.length > 0
          ? this.phoneNumberInputElement.value.replace(/\s/g, "")
          : ""

      return {
        [this.inputData.key]: `${phonePrefix}${phoneNumber}`,
      }
    }

    /**
     * This function returns the selected country code
     */
    public getCountryCode() {
      return this.countrySelectElement.value
    }

    /**
     * This function returns the phone number
     */
    public getPhoneNumber() {
      return this.phoneNumberInputElement.value
    }

    /**
     * This function creates country select element
     */
    private createCountrySelectElement() {
      const select = document.createElement("select")

      select.setAttribute("class", "native-apm-country-select")
      select.setAttribute("name", `${this.inputData.key}_country_code`)
      select.setAttribute("id", `${this.inputData.key}_country_code`)
      select.setAttribute("aria-label", "Select country code")

      const defaultOption = document.createElement("option")
      defaultOption.value = ""
      defaultOption.textContent = TextUtils.getText("selectCountryPlaceholder") || "Select country"
      defaultOption.disabled = true
      defaultOption.selected = true
      select.appendChild(defaultOption)

      // Add country options using country names as display text and country codes as values
      Object.keys(COUNTRY_CODE_TO_PHONE_PREFIX).forEach(countryCode => {
        const country = COUNTRY_CODE_TO_PHONE_PREFIX[countryCode]

        if (country) {
          const option = document.createElement("option")
          option.value = country.prefix
          option.textContent = country.name
          select.appendChild(option)
        }
      })

      select.addEventListener("change", this.resetErrorMessage.bind(this))

      StylesUtils.styleElement(select, this.theme.form.inputs.select)

      return select
    }

    /**
     * This function creates phone prefix input element
     */
    private createPhonePrefixInputElement() {
      const input = document.createElement("input")

      input.setAttribute("class", "native-apm-phone-prefix-input")
      input.setAttribute("name", `${this.inputData.key}_prefix`)
      input.setAttribute("id", `${this.inputData.key}_prefix`)
      input.setAttribute("type", "tel")
      input.setAttribute("readonly", "readonly")
      input.setAttribute("maxlength", "8")
      input.setAttribute("aria-label", "Phone country code prefix")
      input.setAttribute("aria-readonly", "true")

      StylesUtils.styleElement(input, this.theme.form.inputs.text)

      return input
    }

    /**
     * This function creates phone number input element
     */
    private createPhoneNumberInputElement(prefilledValue?: string) {
      const input = document.createElement("input")

      input.setAttribute("class", "native-apm-phone-number-input")
      input.setAttribute("name", this.inputData.key)
      input.setAttribute("id", this.inputData.key)
      input.setAttribute("type", "tel")
      input.setAttribute("maxlength", "15")
      input.setAttribute("aria-label", "Phone number")
      input.setAttribute(
        "placeholder",
        TextUtils.getText("phoneNumberPlaceholder") || "Phone number",
      )

      if (prefilledValue) {
        input.value = prefilledValue
      }

      input.addEventListener("keypress", this.resetErrorMessage.bind(this))
      input.addEventListener("input", this.resetErrorMessage.bind(this))

      // Handle placeholder visibility when input changes
      input.addEventListener("input", () => {
        const prefixVisible = this.phonePrefixInputElement.style.display !== "none"

        if (prefixVisible) {
          // When prefix is visible (country selected), always hide placeholder
          input.removeAttribute("placeholder")
        }
      })

      StylesUtils.styleElement(input, this.theme.form.inputs.text)

      return input
    }

    /**
     * This function creates error message element
     */
    private createErrorMessageElement() {
      const errorMessageElement = document.createElement("span")

      errorMessageElement.setAttribute("class", "native-apm-input-error")
      errorMessageElement.setAttribute("id", `${this.inputData.key}_error`)

      StylesUtils.styleElement(errorMessageElement, this.theme.form.errors)

      return errorMessageElement
    }

    /**
     * This function creates input label element
     */
    private createInputLabel() {
      const label = document.createElement("label")

      label.setAttribute("class", "native-apm-input-label")
      label.setAttribute("for", this.inputData.key)
      label.setAttribute("id", `${this.inputData.key}_label`)

      label.textContent =
        this.inputData.display_name || TextUtils.getText("phoneNumberLabel") || "Phone Number"

      if (this.inputData.required) {
        const requiredStar = this.createRequiredStar()
        label.appendChild(requiredStar)
      }

      StylesUtils.styleElement(label, this.theme.form.labels)

      return label
    }

    /**
     * This function creates required star element for label in required inputs
     */
    private createRequiredStar() {
      const requiredStar = document.createElement("span")
      requiredStar.textContent = "*"

      StylesUtils.styleElement(requiredStar, this.theme.form.labels.requiredStar)

      return requiredStar
    }

    /**
     * This function resets error message
     */
    private resetErrorMessage() {
      if (this.errorMessageElement.textContent.length) {
        this.errorMessageElement.textContent = ""
      }
    }

    /**
     * This function sets error message
     */
    public setErrorMessage(message?: string) {
      this.errorMessageElement.textContent =
        message || TextUtils.getText("invalidPhoneNumber") || "Invalid phone number"
    }
  }
}
