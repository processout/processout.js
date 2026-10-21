/// <reference path="../references.ts" />

module ProcessOut {
  interface DynamicCheckoutAdditionalDataByGateway {
    [gatewayName: string]: Record<string, string>
  }

  export type DynamicCheckoutPaymentMethodOverride = {
    displayName?: string
    logoUrl?: string
  }

  // Keyed by "card" or by the APM gateway name, the same way as additionalData
  interface DynamicCheckoutPaymentMethodsOverrides {
    [paymentMethodKey: string]: DynamicCheckoutPaymentMethodOverride
  }

  export type DynamicCheckoutPublicConfigType = {
    invoiceId: string
    projectId: string
    locale?: string
    clientSecret?: string
    capturePayments?: boolean
    allowFallbackToSale?: boolean
    enforceSavePaymentMethod?: boolean
    hideSavedPaymentMethods?: boolean
    showStatusMessage?: boolean
    payButtonText?: string
    additionalData?: DynamicCheckoutAdditionalDataByGateway
    cvcLabel?: string
    cvcPlaceholder?: string
    paymentMethodsOverrides?: DynamicCheckoutPaymentMethodsOverrides
  }

  export type DynamicCheckoutInternalConfigType = {
    invoiceDetails: Invoice
  }

  export type DynamicCheckoutConfigType = DynamicCheckoutPublicConfigType &
    DynamicCheckoutInternalConfigType

  export class DynamicCheckoutPaymentConfig {
    invoiceId: DynamicCheckoutPublicConfigType["invoiceId"]
    projectId: DynamicCheckoutPublicConfigType["projectId"]
    clientSecret: DynamicCheckoutPublicConfigType["clientSecret"]
    locale: DynamicCheckoutPublicConfigType["locale"] = "en"
    capturePayments: DynamicCheckoutPublicConfigType["capturePayments"] = false
    allowFallbackToSale: DynamicCheckoutPublicConfigType["allowFallbackToSale"] = false
    enforceSavePaymentMethod: DynamicCheckoutPublicConfigType["enforceSavePaymentMethod"] = false
    hideSavedPaymentMethods: DynamicCheckoutPublicConfigType["hideSavedPaymentMethods"] = false
    showStatusMessage: DynamicCheckoutPublicConfigType["showStatusMessage"] = true
    payButtonText: DynamicCheckoutPublicConfigType["payButtonText"] = ""
    additionalData: DynamicCheckoutPublicConfigType["additionalData"] = {}
    cvcLabel: DynamicCheckoutPublicConfigType["cvcLabel"] = ""
    cvcPlaceholder: DynamicCheckoutPublicConfigType["cvcPlaceholder"] = ""
    paymentMethodsOverrides: DynamicCheckoutPublicConfigType["paymentMethodsOverrides"] = {}
    invoiceDetails: DynamicCheckoutInternalConfigType["invoiceDetails"]

    constructor(config: DynamicCheckoutPublicConfigType) {
      this.setInitialConfig(config)
    }

    public getConfig(): DynamicCheckoutPublicConfigType & DynamicCheckoutInternalConfigType {
      return {
        invoiceId: this.invoiceId,
        projectId: this.projectId,
        locale: this.locale,
        invoiceDetails: this.invoiceDetails,
        capturePayments: this.capturePayments,
        allowFallbackToSale: this.allowFallbackToSale,
        enforceSavePaymentMethod: this.enforceSavePaymentMethod,
        hideSavedPaymentMethods: this.hideSavedPaymentMethods,
        showStatusMessage: this.showStatusMessage,
        additionalData: this.additionalData,
        payButtonText: this.payButtonText,
        cvcLabel: this.cvcLabel,
        cvcPlaceholder: this.cvcPlaceholder,
        paymentMethodsOverrides: this.paymentMethodsOverrides,
      }
    }

    public setInvoiceDetails(invoiceDetails: Invoice) {
      this.invoiceDetails = invoiceDetails
    }

    // Tokenize-only is exposed per payment method by the API, but it describes the whole
    // checkout: the shopper is verifying a card, not paying for the invoice.
    public isTokenizeOnly(): boolean {
      if (!this.invoiceDetails || !this.invoiceDetails.payment_methods) {
        return false
      }

      return this.invoiceDetails.payment_methods.some(
        paymentMethod => paymentMethod.card && paymentMethod.card.tokenize_only,
      )
    }

    public getAdditionalDataForGateway(gatewayName: string): Record<string, string> {
      return this.additionalData[gatewayName] || {}
    }

    // Merchants embed Dynamic Checkout with plain JS, so the overrides are untrusted input:
    // anything malformed must degrade to "no override" instead of throwing and breaking checkout.
    public getPaymentMethodDisplayOverride(
      paymentMethodKey: string,
    ): DynamicCheckoutPaymentMethodOverride {
      const overrides = this.paymentMethodsOverrides
      const isPlainObject = (value: unknown) =>
        typeof value === "object" && value !== null && !Array.isArray(value)

      if (
        !isPlainObject(overrides) ||
        !Object.prototype.hasOwnProperty.call(overrides, paymentMethodKey)
      ) {
        return {}
      }

      const entry = overrides[paymentMethodKey]

      if (!isPlainObject(entry)) {
        return {}
      }

      const isNonEmptyString = (value: unknown): value is string =>
        typeof value === "string" && value.length > 0

      return {
        ...(isNonEmptyString(entry.displayName) && { displayName: entry.displayName }),
        ...(isNonEmptyString(entry.logoUrl) && { logoUrl: entry.logoUrl }),
      }
    }

    private setInitialConfig(config: DynamicCheckoutPublicConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Error(
          "You must instantiate Dynamic Checkout with a valid config in order to use it",
        )
      }

      this.invoiceId = config.invoiceId
      this.projectId = config.projectId
      this.clientSecret = config.clientSecret
      this.locale = config.locale || "en"
      this.capturePayments = config.capturePayments || false
      this.allowFallbackToSale = config.allowFallbackToSale || false
      this.enforceSavePaymentMethod = config.enforceSavePaymentMethod || false
      this.hideSavedPaymentMethods = config.hideSavedPaymentMethods || false
      this.payButtonText = config.payButtonText || ""
      this.additionalData = config.additionalData || {}
      this.cvcLabel = config.cvcLabel || ""
      this.cvcPlaceholder = config.cvcPlaceholder || ""
      this.paymentMethodsOverrides = config.paymentMethodsOverrides || {}

      if (config.showStatusMessage !== undefined && config.showStatusMessage !== null) {
        this.showStatusMessage = config.showStatusMessage
      } else {
        this.showStatusMessage = true
      }
    }

    private isValidConfig(config: DynamicCheckoutPublicConfigType) {
      return !!config.projectId && !!config.invoiceId
    }
  }
}
