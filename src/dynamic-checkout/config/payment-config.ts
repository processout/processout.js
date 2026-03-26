/// <reference path="../references.ts" />

module ProcessOut {
  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  type DynamicCheckoutMethodKey = string

  interface DynamicCheckoutMethodScopedConfig<T> {
    _global?: T
    [methodKey: string]: T | undefined
  }

  function cloneMethodScopedConfig<T extends Record<string, any>>(
    config?: DynamicCheckoutMethodScopedConfig<T>,
  ): DynamicCheckoutMethodScopedConfig<T> {
    const clonedConfig: DynamicCheckoutMethodScopedConfig<T> = {}

    if (!config) {
      return clonedConfig
    }

    for (const key in config) {
      if (config[key]) {
        clonedConfig[key] = {
          ...config[key],
        }
      }
    }

    return clonedConfig
  }

  function getScopedConfigValue<T extends Record<string, any>>(
    config: DynamicCheckoutMethodScopedConfig<T>,
    methodKey: DynamicCheckoutMethodKey,
  ): T {
    return {
      ...(config._global || {}),
      ...(config[methodKey] || {}),
    } as T
  }

  // ---------------------------------------------------------------------------
  // Shared value types (used by both old and new public APIs)
  // ---------------------------------------------------------------------------

  export type DynamicCheckoutAdditionalPaymentDataType = Record<string, string>

  export type DynamicCheckoutOptionsType = {
    capturePayments?: boolean
    allowFallbackToSale?: boolean
    enforceSavePaymentMethod?: boolean
    hideSavedPaymentMethods?: boolean
    showStatusMessage?: boolean
  }

  export type DynamicCheckoutTextOverridesType = {
    payButtonText?: string
    cvcLabel?: string
    cvcPlaceholder?: string
  }

  // ---------------------------------------------------------------------------
  // Public API: initDynamicCheckout (current)
  // ---------------------------------------------------------------------------

  export type DynamicCheckoutPaymentMethodKey =
    | "card"
    | "applepay"
    | "googlepay"
    | (string & {})

  export type DynamicCheckoutPaymentMethodOverrideType = {
    options?: DynamicCheckoutOptionsType
    theme?: DynamicCheckoutThemeType
    text?: DynamicCheckoutTextOverridesType
    additionalData?: DynamicCheckoutAdditionalPaymentDataType
  }

  export type DynamicCheckoutInitConfigType = {
    invoiceId: string
    clientSecret?: string
    locale?: string
    options?: DynamicCheckoutOptionsType
    theme?: DynamicCheckoutThemeType
    text?: DynamicCheckoutTextOverridesType
    paymentMethodOverrides?: Partial<
      Record<DynamicCheckoutPaymentMethodKey, DynamicCheckoutPaymentMethodOverrideType>
    >
  }

  // ---------------------------------------------------------------------------
  // Public API: setupDynamicCheckout (deprecated)
  // ---------------------------------------------------------------------------

  /** @deprecated Use DynamicCheckoutInitConfigType instead */
  export type DynamicCheckoutPublicConfigType = {
    invoiceId: string
    locale?: string
    clientSecret?: string
    capturePayments?: boolean
    allowFallbackToSale?: boolean
    enforceSavePaymentMethod?: boolean
    hideSavedPaymentMethods?: boolean
    showStatusMessage?: boolean
    payButtonText?: string
    additionalData?: Record<string, DynamicCheckoutAdditionalPaymentDataType>
    cvcLabel?: string
    cvcPlaceholder?: string
  }

  /** @deprecated Use DynamicCheckoutInitConfigType instead */
  export type DynamicCheckoutInitPublicConfigType = {
    invoiceId: string
    locale?: string
    clientSecret?: string
    options?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutOptionsType>
    theme?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutThemeType>
    textOverrides?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutTextOverridesType>
    additionalPaymentData?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutAdditionalPaymentDataType>
  }

  // ---------------------------------------------------------------------------
  // Internal normalized config (all public APIs normalize into this)
  // ---------------------------------------------------------------------------

  export type DynamicCheckoutNormalizedPublicConfigType = {
    invoiceId: string
    projectId: string
    locale?: string
    clientSecret?: string
    optionsByMethod?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutOptionsType>
    themeByMethod?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutThemeType>
    textOverridesByMethod?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutTextOverridesType>
    additionalPaymentDataByMethod?: DynamicCheckoutMethodScopedConfig<DynamicCheckoutAdditionalPaymentDataType>
  }

  export type DynamicCheckoutInternalConfigType = {
    invoiceDetails: Invoice
  }

  export type DynamicCheckoutConfigType = DynamicCheckoutNormalizedPublicConfigType &
    DynamicCheckoutInternalConfigType

  // ---------------------------------------------------------------------------
  // Normalization functions
  // ---------------------------------------------------------------------------

  export function normalizeDynamicCheckoutConfig(
    config: DynamicCheckoutInitConfigType & { projectId: string },
  ): DynamicCheckoutNormalizedPublicConfigType {
    const optionsByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutOptionsType> = {
      _global: { ...(config.options || {}) },
    }

    const themeByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutThemeType> = {
      _global: config.theme ? { ...config.theme } : {},
    }

    const textOverridesByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutTextOverridesType> = {
      _global: config.text ? { ...config.text } : {},
    }

    const additionalPaymentDataByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutAdditionalPaymentDataType> = {}

    if (config.paymentMethodOverrides) {
      for (const key in config.paymentMethodOverrides) {
        const override = config.paymentMethodOverrides[key]

        if (!override) {
          continue
        }

        if (override.options) {
          optionsByMethod[key] = { ...override.options }
        }

        if (override.theme) {
          themeByMethod[key] = { ...override.theme }
        }

        if (override.text) {
          textOverridesByMethod[key] = { ...override.text }
        }

        if (override.additionalData) {
          additionalPaymentDataByMethod[key] = { ...override.additionalData }
        }
      }
    }

    return {
      invoiceId: config.invoiceId,
      projectId: config.projectId,
      locale: config.locale,
      clientSecret: config.clientSecret,
      optionsByMethod,
      themeByMethod,
      textOverridesByMethod,
      additionalPaymentDataByMethod,
    }
  }

  /** @deprecated */
  export function normalizeDynamicCheckoutSetupConfig(
    config: DynamicCheckoutPublicConfigType & {
      projectId: string
    },
    theme?: DynamicCheckoutThemeType,
  ): DynamicCheckoutNormalizedPublicConfigType {
    return {
      invoiceId: config.invoiceId,
      projectId: config.projectId,
      locale: config.locale,
      clientSecret: config.clientSecret,
      optionsByMethod: {
        _global: {
          capturePayments: config.capturePayments,
          allowFallbackToSale: config.allowFallbackToSale,
          enforceSavePaymentMethod: config.enforceSavePaymentMethod,
          hideSavedPaymentMethods: config.hideSavedPaymentMethods,
          showStatusMessage: config.showStatusMessage,
        },
      },
      themeByMethod: {
        _global: theme ? { ...theme } : {},
      },
      textOverridesByMethod: {
        _global: {
          payButtonText: config.payButtonText,
          cvcLabel: config.cvcLabel,
          cvcPlaceholder: config.cvcPlaceholder,
        },
      },
      additionalPaymentDataByMethod: cloneMethodScopedConfig(config.additionalData),
    }
  }

  /** @deprecated */
  export function normalizeDynamicCheckoutInitConfig(
    config: DynamicCheckoutInitPublicConfigType & {
      projectId: string
    },
  ): DynamicCheckoutNormalizedPublicConfigType {
    return {
      invoiceId: config.invoiceId,
      projectId: config.projectId,
      locale: config.locale,
      clientSecret: config.clientSecret,
      optionsByMethod: cloneMethodScopedConfig(config.options),
      themeByMethod: cloneMethodScopedConfig(config.theme),
      textOverridesByMethod: cloneMethodScopedConfig(config.textOverrides),
      additionalPaymentDataByMethod: cloneMethodScopedConfig(config.additionalPaymentData),
    }
  }

  // ---------------------------------------------------------------------------
  // Runtime config class
  // ---------------------------------------------------------------------------

  export class DynamicCheckoutPaymentConfig {
    invoiceId: DynamicCheckoutNormalizedPublicConfigType["invoiceId"]
    projectId: DynamicCheckoutNormalizedPublicConfigType["projectId"]
    clientSecret: DynamicCheckoutNormalizedPublicConfigType["clientSecret"]
    locale: DynamicCheckoutNormalizedPublicConfigType["locale"] = "en"
    capturePayments: boolean = false
    allowFallbackToSale: boolean = false
    enforceSavePaymentMethod: boolean = false
    hideSavedPaymentMethods: boolean = false
    showStatusMessage: boolean = true
    payButtonText: string = ""
    additionalData: DynamicCheckoutAdditionalPaymentDataType = {}
    cvcLabel: string = ""
    cvcPlaceholder: string = ""
    invoiceDetails: DynamicCheckoutInternalConfigType["invoiceDetails"]

    private optionsByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutOptionsType> = {}
    private themeByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutThemeType> = {}
    private textOverridesByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutTextOverridesType> =
      {}
    private additionalPaymentDataByMethod: DynamicCheckoutMethodScopedConfig<DynamicCheckoutAdditionalPaymentDataType> =
      {}

    constructor(config: DynamicCheckoutNormalizedPublicConfigType) {
      this.setInitialConfig(config)
    }

    public getConfig(): DynamicCheckoutConfigType {
      return {
        invoiceId: this.invoiceId,
        projectId: this.projectId,
        locale: this.locale,
        clientSecret: this.clientSecret,
        invoiceDetails: this.invoiceDetails,
        optionsByMethod: cloneMethodScopedConfig(this.optionsByMethod),
        themeByMethod: cloneMethodScopedConfig(this.themeByMethod),
        textOverridesByMethod: cloneMethodScopedConfig(this.textOverridesByMethod),
        additionalPaymentDataByMethod: cloneMethodScopedConfig(this.additionalPaymentDataByMethod),
      }
    }

    public setInvoiceDetails(invoiceDetails: Invoice) {
      this.invoiceDetails = invoiceDetails
    }

    public getOptionsForMethod(methodKey: DynamicCheckoutMethodKey): DynamicCheckoutOptionsType {
      return {
        capturePayments: this.capturePayments,
        allowFallbackToSale: this.allowFallbackToSale,
        enforceSavePaymentMethod: this.enforceSavePaymentMethod,
        hideSavedPaymentMethods: this.hideSavedPaymentMethods,
        showStatusMessage: this.showStatusMessage,
        ...getScopedConfigValue(this.optionsByMethod, methodKey),
      }
    }

    public getThemeForMethod(methodKey: DynamicCheckoutMethodKey): DynamicCheckoutThemeType {
      return getScopedConfigValue(this.themeByMethod, methodKey)
    }

    public getTextOverridesForMethod(
      methodKey: DynamicCheckoutMethodKey,
    ): DynamicCheckoutTextOverridesType {
      return {
        payButtonText: this.payButtonText,
        cvcLabel: this.cvcLabel,
        cvcPlaceholder: this.cvcPlaceholder,
        ...getScopedConfigValue(this.textOverridesByMethod, methodKey),
      }
    }

    public getAdditionalDataForMethod(
      methodKey: DynamicCheckoutMethodKey,
    ): DynamicCheckoutAdditionalPaymentDataType {
      return getScopedConfigValue(this.additionalPaymentDataByMethod, methodKey)
    }

    public getAdditionalDataForGateway(
      gatewayName: DynamicCheckoutMethodKey,
    ): DynamicCheckoutAdditionalPaymentDataType {
      return this.getAdditionalDataForMethod(gatewayName)
    }

    private setInitialConfig(config: DynamicCheckoutNormalizedPublicConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Error(
          "You must instantiate Dynamic Checkout with a valid config in order to use it",
        )
      }

      this.optionsByMethod = cloneMethodScopedConfig(config.optionsByMethod)
      this.themeByMethod = cloneMethodScopedConfig(config.themeByMethod)
      this.textOverridesByMethod = cloneMethodScopedConfig(config.textOverridesByMethod)
      this.additionalPaymentDataByMethod = cloneMethodScopedConfig(
        config.additionalPaymentDataByMethod,
      )

      const globalOptions = this.getOptionsForMethod("_global")
      const globalTextOverrides = this.getTextOverridesForMethod("_global")

      this.invoiceId = config.invoiceId
      this.projectId = config.projectId
      this.clientSecret = config.clientSecret
      this.locale = config.locale || "en"
      this.capturePayments = globalOptions.capturePayments || false
      this.allowFallbackToSale = globalOptions.allowFallbackToSale || false
      this.enforceSavePaymentMethod = globalOptions.enforceSavePaymentMethod || false
      this.hideSavedPaymentMethods = globalOptions.hideSavedPaymentMethods || false
      this.payButtonText = globalTextOverrides.payButtonText ?? ""
      this.additionalData = this.getAdditionalDataForMethod("_global")
      this.cvcLabel = globalTextOverrides.cvcLabel ?? ""
      this.cvcPlaceholder = globalTextOverrides.cvcPlaceholder ?? ""

      if (globalOptions.showStatusMessage !== undefined && globalOptions.showStatusMessage !== null) {
        this.showStatusMessage = globalOptions.showStatusMessage
      } else {
        this.showStatusMessage = true
      }
    }

    private isValidConfig(config: DynamicCheckoutNormalizedPublicConfigType) {
      return !!config.projectId && !!config.invoiceId
    }
  }
}
