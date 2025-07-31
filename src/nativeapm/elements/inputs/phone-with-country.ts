/// <reference path="../../references.ts" />

module ProcessOut {
  export class NativeApmPhoneWithCountryInput implements INativeApmInput {
    private processOut: ProcessOut
    private readonly countrySelectElement: HTMLSelectElement
    private readonly phoneNumberInputElement: HTMLInputElement
    private readonly errorMessageElement: HTMLElement
    private readonly inputLabel: HTMLElement
    private readonly theme: NativeApmThemeConfigType
    private readonly flagDisplayElement: HTMLElement
    private readonly selectWrapper: HTMLElement
    private readonly chevronElement: HTMLElement
    private phoneInputContainer: HTMLElement

    readonly inputData: NativeApmInputData

    private static readonly PHONE_NUMBER_REGEX = /^[0-9]{7,15}$/
    private static readonly DEFAULT_MAX_LENGTH = 15

    constructor(
      processOut: ProcessOut,
      inputData: NativeApmInputData,
      theme: NativeApmThemeConfigType,
      prefilledValue?: string,
    ) {
      this.processOut = processOut
      this.theme = theme
      this.inputData = inputData
      this.countrySelectElement = this.createCountrySelectElement()
      this.phoneNumberInputElement = this.createPhoneNumberInputElement(prefilledValue)
      this.inputLabel = this.createInputLabel()
      this.errorMessageElement = this.createErrorMessageElement()
      this.flagDisplayElement = this.createFlagDisplayElement()
      this.selectWrapper = this.createSelectWrapper()
      this.chevronElement = this.createChevronElement()
    }

    public getInputElement() {
      this.phoneInputContainer = this.createPhoneInputContainer()
      const inputWrapper = this.createInputWrapper()
      const countrySelectContainer = this.createCountrySelectContainer()

      this.applyStyles(inputWrapper, countrySelectContainer)
      this.setAccessibilityAttributes()
      this.setupFocusEventListeners()
      this.setupKeyboardNavigation()
      this.setupEventListeners()
      this.assembleElements(inputWrapper, countrySelectContainer)
      this.initializeFlagDisplay()

      return inputWrapper
    }

    private initializeFlagDisplay() {
      const phoneValue = this.phoneNumberInputElement.value

      if (phoneValue) {
        const detectedCountry = this.detectCountry(phoneValue)

        this.updateCountrySelect(detectedCountry)
      } else {
        this.updateFlagDisplay(null)
      }
    }

    private createInputWrapper() {
      const wrapper = document.createElement("div")

      wrapper.className = "native-apm-phone-with-country-input-wrapper"

      return wrapper
    }

    private createPhoneInputContainer() {
      const container = document.createElement("div")

      container.className = "native-apm-phone-input-container"

      return container
    }

    private createCountrySelectContainer() {
      const container = document.createElement("div")

      container.className = "native-apm-country-select-container"

      return container
    }

    private applyStyles(inputWrapper: HTMLElement, countrySelectContainer: HTMLElement) {
      const inputsStyles = this.theme.form.inputs

      StylesUtils.styleElement(inputWrapper, inputsStyles.wrapper)

      StylesUtils.styleElement(
        this.countrySelectElement,
        inputsStyles.phoneWithCountry.countrySelect,
      )

      StylesUtils.styleElement(
        this.phoneNumberInputElement,
        inputsStyles.phoneWithCountry.phoneNumberInput,
      )

      StylesUtils.styleElement(this.phoneInputContainer, inputsStyles.phoneWithCountry.container)

      StylesUtils.styleElement(
        countrySelectContainer,
        inputsStyles.phoneWithCountry.countrySelectContainer,
      )

      StylesUtils.styleElement(this.selectWrapper, inputsStyles.phoneWithCountry.selectWrapper)

      StylesUtils.styleElement(this.flagDisplayElement, inputsStyles.phoneWithCountry.flagDisplay)

      const flagImg = this.flagDisplayElement.querySelector(".native-apm-flag-image") as HTMLElement

      const flagText = this.flagDisplayElement.querySelector(
        ".native-apm-flag-default-text",
      ) as HTMLElement

      if (flagImg) {
        StylesUtils.styleElement(flagImg, inputsStyles.phoneWithCountry.flagImageHidden)
      }

      if (flagText) {
        StylesUtils.styleElement(flagText, inputsStyles.phoneWithCountry.flagDefaultTextVisible)
      }

      StylesUtils.styleElement(this.chevronElement, inputsStyles.phoneWithCountry.selectChevron)
    }

    private setupEventListeners() {
      this.phoneNumberInputElement.addEventListener("input", () => {
        this.handlePhoneNumberInput()
      })

      this.countrySelectElement.addEventListener("change", () => {
        this.handleCountryChange()
      })
    }

    private handleCountryChange() {
      const selectedCountryCode = this.countrySelectElement.value

      if (selectedCountryCode) {
        this.applySelectedCountry(selectedCountryCode)
      } else {
        this.clearCountrySelection()
      }

      this.resetErrorMessage()
      this.phoneNumberInputElement.focus()
    }

    private applySelectedCountry(countryCode: string) {
      const countryData = COUNTRY_CODE_TO_PHONE_PREFIX[countryCode]
      const prefix = countryData && countryData.prefix ? countryData.prefix : ""

      // Apply the prefix of country after user manually selects the country
      this.phoneNumberInputElement.value = prefix.replace(/[^+\d]/g, "")
      this.updateFlagDisplay(countryCode)
    }

    private clearCountrySelection() {
      this.phoneNumberInputElement.value = ""
      this.updateFlagDisplay("")
    }

    private assembleElements(inputWrapper: HTMLElement, countrySelectContainer: HTMLElement) {
      this.selectWrapper.appendChild(this.countrySelectElement)
      this.selectWrapper.appendChild(this.flagDisplayElement)
      this.selectWrapper.appendChild(this.chevronElement)

      countrySelectContainer.appendChild(this.selectWrapper)
      this.phoneInputContainer.appendChild(countrySelectContainer)
      this.phoneInputContainer.appendChild(this.phoneNumberInputElement)

      inputWrapper.appendChild(this.inputLabel)
      inputWrapper.appendChild(this.phoneInputContainer)
      inputWrapper.appendChild(this.errorMessageElement)
    }

    private handlePhoneNumberInput() {
      // Prepend plus if user starts typing with a number
      let phoneNumber = this.phoneNumberInputElement.value
      phoneNumber = this.autoPrependPlusIfNeeded(phoneNumber)

      this.processPhoneNumberInput(phoneNumber)
      this.resetErrorMessage()
    }

    private autoPrependPlusIfNeeded(phoneNumber: string) {
      if (phoneNumber.length === 1 && phoneNumber !== "+") {
        const updatedNumber = "+" + phoneNumber

        this.phoneNumberInputElement.value = updatedNumber

        return updatedNumber
      }

      return phoneNumber
    }

    private processPhoneNumberInput(phoneNumber: string) {
      const detectedCountry = this.detectCountry(phoneNumber)
      this.updateCountrySelect(detectedCountry)

      const maxLength = this.getMaxLengthForCountry(detectedCountry)
      this.limitInputLength(phoneNumber, maxLength)
    }

    private detectCountry(phoneNumber: string) {
      if (phoneNumber.indexOf("+") === 0) {
        const detectedByPrefix = this.detectCountryByPrefix(phoneNumber)

        if (detectedByPrefix) {
          return detectedByPrefix
        }
      }

      return this.detectCountryWithLibphonenumber(phoneNumber)
    }

    private detectCountryByPrefix(phoneNumber: string) {
      const prefixMap = this.buildPrefixMap()
      let bestMatch = { prefix: "", countries: [] as string[] }

      Object.keys(prefixMap).forEach(function (prefix) {
        if (phoneNumber.indexOf(prefix) === 0 && prefix.length > bestMatch.prefix.length) {
          bestMatch = { prefix: prefix, countries: prefixMap[prefix] }
        }
      })

      return bestMatch.countries.length > 0 ? bestMatch.countries[0] : null
    }

    private buildPrefixMap(): { [prefix: string]: string[] } {
      const prefixMap: { [prefix: string]: string[] } = {}

      Object.keys(COUNTRY_CODE_TO_PHONE_PREFIX).forEach(function (countryCode) {
        const prefix = COUNTRY_CODE_TO_PHONE_PREFIX[countryCode].prefix

        prefixMap[prefix] = prefixMap[prefix] || []
        prefixMap[prefix].push(countryCode)
      })

      return prefixMap
    }

    private detectCountryWithLibphonenumber(phoneNumber: string) {
      const libphonenumber = window && window.globalThis ? window.globalThis.libphonenumber : null

      if (!libphonenumber || phoneNumber.length <= 1) {
        return null
      }

      try {
        const parsed = libphonenumber.parsePhoneNumber(phoneNumber)

        return parsed?.country || null
      } catch {
        return null
      }
    }

    private updateCountrySelect(detectedCountry: string | null) {
      if (!detectedCountry) {
        this.countrySelectElement.selectedIndex = 0
        this.updateFlagDisplay("")

        return
      }

      const options = Array.from(this.countrySelectElement.options)
      options.forEach((option, index) => {
        if (option.value === detectedCountry) {
          this.countrySelectElement.selectedIndex = index
          this.updateFlagDisplay(detectedCountry)
        }
      })
    }

    private getMaxLengthForCountry(detectedCountry: string | null) {
      const libphonenumber = window.globalThis.libphonenumber

      if (!detectedCountry) {
        return NativeApmPhoneWithCountryInput.DEFAULT_MAX_LENGTH
      }

      if (!libphonenumber) {
        return NativeApmPhoneWithCountryInput.DEFAULT_MAX_LENGTH
      }

      try {
        const metadata = libphonenumber.getMetadata()
        const countryMeta = metadata.countries[detectedCountry]

        return countryMeta && countryMeta[2]
          ? Math.max(...countryMeta[2])
          : NativeApmPhoneWithCountryInput.DEFAULT_MAX_LENGTH
      } catch {
        return NativeApmPhoneWithCountryInput.DEFAULT_MAX_LENGTH
      }
    }

    private limitInputLength(phoneNumber: string, maxLength: number) {
      const sanitized = this.sanitizePhoneNumber(phoneNumber)
      const limited = this.applyLengthLimit(sanitized, maxLength)

      if (limited !== phoneNumber) {
        this.phoneNumberInputElement.value = limited
      }
    }

    private sanitizePhoneNumber(phoneNumber: string) {
      return phoneNumber[0] === "+"
        ? "+" + phoneNumber.slice(1).replace(/[^\d-]/g, "")
        : phoneNumber.replace(/[^\d-]/g, "")
    }

    private applyLengthLimit(phoneNumber: string, maxLength: number) {
      if (phoneNumber[0] !== "+") {
        return phoneNumber
      }

      const prefixMatch = phoneNumber.match(/^\+\d+/)
      const prefixLength = prefixMatch ? prefixMatch[0].length : 1

      const prefix = phoneNumber.slice(0, prefixLength)
      const number = phoneNumber.slice(prefixLength, prefixLength + maxLength)

      return prefix + number
    }

    private setAccessibilityAttributes() {
      const { key } = this.inputData

      this.phoneInputContainer.setAttribute("tabindex", "0")
      this.phoneInputContainer.setAttribute("role", "group")
      this.phoneInputContainer.setAttribute("aria-labelledby", key + "_label")
      this.phoneInputContainer.setAttribute("aria-describedby", key + "_error")
    }

    private setupFocusEventListeners() {
      const elements = [this.countrySelectElement, this.phoneNumberInputElement]

      elements.forEach(element => {
        element.addEventListener("focus", () => {
          this.handleInputFocus()
        })

        element.addEventListener("blur", () => {
          this.handleInputBlur()
        })
      })
    }

    private setupKeyboardNavigation() {
      this.phoneInputContainer.addEventListener("keydown", event => {
        this.handleContainerKeyDown(event)
      })
    }

    private handleInputFocus() {
      StylesUtils.styleElement(
        this.phoneInputContainer,
        this.theme.form.inputs.phoneWithCountry.containerFocused,
      )

      this.phoneInputContainer.setAttribute("aria-expanded", "true")
    }

    private handleInputBlur() {
      if (!this.isAnyChildFocused()) {
        StylesUtils.styleElement(
          this.phoneInputContainer,
          this.theme.form.inputs.phoneWithCountry.container,
        )

        this.phoneInputContainer.setAttribute("aria-expanded", "false")
      }
    }

    private isAnyChildFocused() {
      const activeElement = document.activeElement

      const focusableElements = [
        this.countrySelectElement,
        this.phoneNumberInputElement,
        this.phoneInputContainer,
      ]

      let focusedElement = null

      focusableElements.forEach(function (element) {
        if (element === activeElement) {
          focusedElement = element
        }
      })

      return !!focusedElement
    }

    private handleContainerKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault()
        this.countrySelectElement.focus()
        return
      }

      if (event.key !== "Tab" && !this.phoneNumberInputElement.matches(":focus")) {
        this.phoneNumberInputElement.focus()
      }
    }

    public validate() {
      const validationResults = {
        required: this.validateRequired(),
        phone: this.validatePhoneNumber(),
        country: this.validateCountrySelection(),
      }

      this.handleValidationErrors(validationResults)

      return validationResults.required && validationResults.phone && validationResults.country
    }

    private handleValidationErrors(results: {
      required: boolean
      phone: boolean
      country: boolean
    }) {
      if (!results.required || !results.phone) {
        this.setErrorMessage()
      }

      if (!results.country) {
        this.setErrorMessage(TextUtils.getText("invalidCountryCode") || "Invalid country code")
      }
    }

    private validateRequired() {
      return !this.inputData.required || this.phoneNumberInputElement.value.length > 0
    }

    private validatePhoneNumber() {
      const phoneValue = this.phoneNumberInputElement.value

      if (!phoneValue) {
        return true
      }

      return this.validateWithLibphonenumber(phoneValue) ?? this.validateWithRegex(phoneValue)
    }

    private validateWithLibphonenumber(phoneValue: string) {
      const libphonenumber = window.globalThis.libphonenumber

      if (!libphonenumber) {
        return null
      }

      try {
        const parsed = libphonenumber.parsePhoneNumber(phoneValue)

        return parsed.isValid()
      } catch {
        return false
      }
    }

    private validateWithRegex(phoneValue: string) {
      return NativeApmPhoneWithCountryInput.PHONE_NUMBER_REGEX.test(phoneValue.replace(/\s/g, ""))
    }

    private validateCountrySelection() {
      return this.countrySelectElement.value.length > 0
    }

    public getValue(): { [key: string]: string } {
      const phoneValue = this.getFormattedPhoneNumber()

      return { [this.inputData.key]: phoneValue }
    }

    private getFormattedPhoneNumber() {
      const libphonenumber = window.globalThis.libphonenumber
      const phoneValue = this.phoneNumberInputElement.value

      if (!libphonenumber || !phoneValue) {
        return phoneValue
      }

      try {
        const parsed = libphonenumber.parsePhoneNumber(phoneValue)

        return parsed.number
      } catch {
        return phoneValue
      }
    }

    public getCountryCode() {
      return this.countrySelectElement.value
    }

    public getPhoneNumber() {
      return this.phoneNumberInputElement.value
    }

    private createCountrySelectElement() {
      const select = document.createElement("select")

      this.setCountrySelectAttributes(select)
      this.addDefaultOption(select)
      this.addCountryOptions(select)

      StylesUtils.styleElement(select, this.theme.form.inputs.select)

      return select
    }

    private setCountrySelectAttributes(select: HTMLSelectElement) {
      const { key } = this.inputData

      select.className = "native-apm-country-select"
      select.name = key + "_country_code"
      select.id = key + "_country_code"
      select.setAttribute("aria-label", "Select country code")
    }

    private addDefaultOption(select: HTMLSelectElement) {
      const defaultOption = document.createElement("option")

      defaultOption.value = ""
      defaultOption.disabled = false
      defaultOption.selected = true

      select.appendChild(defaultOption)
    }

    private addCountryOptions(select: HTMLSelectElement) {
      Object.keys(COUNTRY_CODE_TO_PHONE_PREFIX).forEach(countryCode => {
        const country = COUNTRY_CODE_TO_PHONE_PREFIX[countryCode]

        if (country) {
          const option = this.createCountryOption(countryCode, country)
          select.appendChild(option)
        }
      })
    }

    private createCountryOption(countryCode: string, country: { prefix: string; name: string }) {
      const option = document.createElement("option")

      option.value = countryCode
      option.textContent = country.name

      return option
    }

    private createPhoneNumberInputElement(prefilledValue?: string) {
      const input = document.createElement("input")

      this.setPhoneInputAttributes(input)
      this.setPhoneInputValue(input, prefilledValue)
      this.setupPhoneInputEventListeners(input)

      StylesUtils.styleElement(input, this.theme.form.inputs.text)

      return input
    }

    private setPhoneInputAttributes(input: HTMLInputElement) {
      const { key } = this.inputData

      input.className = "native-apm-phone-number-input"
      input.name = key
      input.id = key
      input.type = "tel"
      input.maxLength = 15
      input.setAttribute("aria-label", "Phone number")
      input.placeholder = TextUtils.getText("phoneNumberPlaceholder") || "Phone number"
    }

    private setPhoneInputValue(input: HTMLInputElement, prefilledValue?: string) {
      if (prefilledValue) {
        input.value = prefilledValue
      }
    }

    private setupPhoneInputEventListeners(input: HTMLInputElement) {
      const resetErrorHandler = () => {
        this.resetErrorMessage()
      }

      input.addEventListener("keypress", resetErrorHandler)
      input.addEventListener("input", resetErrorHandler)
      input.addEventListener("keydown", event => {
        this.handleKeyDown(event)
      })
      input.addEventListener("paste", event => {
        this.handlePaste(event)
      })
    }

    private handleKeyDown(event: KeyboardEvent) {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "Home",
        "End",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ]

      const isAllowedKey = allowedKeys.indexOf(event.key) !== -1
      const isValidInput = event.key === "+" || /^[0-9]$/.test(event.key)

      if (!isAllowedKey && !isValidInput) {
        event.preventDefault()
      }
    }

    private handlePaste(event: ClipboardEvent) {
      event.preventDefault()

      const clipboardData =
        event.clipboardData && event.clipboardData.getData
          ? event.clipboardData.getData("text")
          : ""

      const filteredData = clipboardData.replace(/[^+0-9]/g, "")

      const input = event.target as HTMLInputElement
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const currentValue = input.value

      const newValue = currentValue.slice(0, start) + filteredData + currentValue.slice(end)
      input.value = newValue

      const newCursorPosition = start + filteredData.length

      input.setSelectionRange(newCursorPosition, newCursorPosition)
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }

    private createErrorMessageElement() {
      const errorElement = document.createElement("span")
      const { key } = this.inputData

      errorElement.className = "native-apm-input-error"
      errorElement.id = key + "_error"

      StylesUtils.styleElement(errorElement, this.theme.form.errors)

      return errorElement
    }

    private createInputLabel() {
      const label = document.createElement("label")
      const { key, display_name, required } = this.inputData

      label.className = "native-apm-input-label"
      label.setAttribute("for", key)
      label.id = key + "_label"
      label.textContent = display_name || TextUtils.getText("phoneNumberLabel") || "Phone Number"

      if (required) {
        label.appendChild(this.createRequiredStar())
      }

      StylesUtils.styleElement(label, this.theme.form.labels)

      return label
    }

    private createRequiredStar() {
      const requiredStar = document.createElement("span")
      requiredStar.textContent = "*"

      StylesUtils.styleElement(requiredStar, this.theme.form.labels.requiredStar)

      return requiredStar
    }

    private resetErrorMessage() {
      if (this.errorMessageElement.textContent) {
        this.errorMessageElement.textContent = ""
      }
    }

    public setErrorMessage(message?: string) {
      this.errorMessageElement.textContent =
        message || TextUtils.getText("invalidPhoneNumber") || "Invalid phone number"
    }

    private createFlagDisplayElement() {
      const flagContainer = document.createElement("div")
      flagContainer.className = "native-apm-flag-display"

      const flagImg = document.createElement("img")
      flagImg.className = "native-apm-flag-image"
      flagImg.alt = "Country flag"

      const defaultText = document.createElement("span")
      defaultText.className = "native-apm-flag-default-text"

      flagContainer.appendChild(flagImg)
      flagContainer.appendChild(defaultText)

      return flagContainer
    }

    private createSelectWrapper() {
      const wrapper = document.createElement("div")
      wrapper.className = "native-apm-select-wrapper"

      // Trigger the select dropdown by simulating a click
      wrapper.addEventListener("click", () => {
        this.countrySelectElement.focus()

        if (this.countrySelectElement.click) {
          this.countrySelectElement.click()
        }
      })

      return wrapper
    }

    private createChevronElement() {
      const chevron = document.createElement("div")

      chevron.className = "native-apm-select-chevron"

      return chevron
    }

    private updateFlagDisplay(countryCode: string | null) {
      const flagImg = this.flagDisplayElement.querySelector(
        ".native-apm-flag-image",
      ) as HTMLImageElement

      const defaultText = this.flagDisplayElement.querySelector(
        ".native-apm-flag-default-text",
      ) as HTMLElement

      if (countryCode) {
        this.showCountryFlag(flagImg, defaultText, countryCode)
      } else {
        this.showDefaultFlag(flagImg, defaultText)
      }
    }

    private showCountryFlag(
      flagImg: HTMLImageElement,
      defaultText: HTMLElement,
      countryCode: string,
    ) {
      flagImg.src = this.processOut.endpoint(
        "js",
        "/images/countries/" + countryCode.toLowerCase() + ".png",
      )

      StylesUtils.styleElement(flagImg, this.theme.form.inputs.phoneWithCountry.flagImageVisible)

      StylesUtils.styleElement(
        defaultText,
        this.theme.form.inputs.phoneWithCountry.flagDefaultTextHidden,
      )
    }

    private showDefaultFlag(flagImg: HTMLImageElement, defaultText: HTMLElement) {
      StylesUtils.styleElement(flagImg, this.theme.form.inputs.phoneWithCountry.flagImageHidden)

      StylesUtils.styleElement(
        defaultText,
        this.theme.form.inputs.phoneWithCountry.flagDefaultTextVisible,
      )
    }
  }
}
