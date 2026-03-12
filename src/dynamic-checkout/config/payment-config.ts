/// <reference path="../references.ts" />

module ProcessOut {
  interface DynamicCheckoutAdditionalDataByGateway {
    [gatewayName: string]: Record<string, string>
  }

  export type DynamicCheckoutPublicConfigType = {
    invoiceId: string
    projectId: string
    locale?: string
    clientSecret?: string
    capturePayments?: boolean
    allowFallbackToSale?: boolean
    enforceSafePaymentMethod?: boolean
    hideSavedPaymentMethods?: boolean
    showStatusMessage?: boolean
    payButtonText?: string
    additionalData?: DynamicCheckoutAdditionalDataByGateway
    cvcLabel?: string
    cvcPlaceholder?: string
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
    enforceSafePaymentMethod: DynamicCheckoutPublicConfigType["enforceSafePaymentMethod"] = false
    hideSavedPaymentMethods: DynamicCheckoutPublicConfigType["hideSavedPaymentMethods"] = false
    showStatusMessage: DynamicCheckoutPublicConfigType["showStatusMessage"] = true
    payButtonText: DynamicCheckoutPublicConfigType["payButtonText"] = ""
    additionalData: DynamicCheckoutPublicConfigType["additionalData"] = {}
    cvcLabel: DynamicCheckoutPublicConfigType["cvcLabel"] = ""
    cvcPlaceholder: DynamicCheckoutPublicConfigType["cvcPlaceholder"] = ""
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
        enforceSafePaymentMethod: this.enforceSafePaymentMethod,
        hideSavedPaymentMethods: this.hideSavedPaymentMethods,
        showStatusMessage: this.showStatusMessage,
        additionalData: this.additionalData,
        payButtonText: this.payButtonText,
        cvcLabel: this.cvcLabel,
        cvcPlaceholder: this.cvcPlaceholder,
      }
    }

    public setInvoiceDetails(invoiceDetails: Invoice) {
      this.invoiceDetails = invoiceDetails
    }

    public getAdditionalDataForGateway(gatewayName: string): Record<string, string> {
      return this.additionalData[gatewayName] || {}
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
      this.enforceSafePaymentMethod = config.enforceSafePaymentMethod || false
      this.hideSavedPaymentMethods = config.hideSavedPaymentMethods || false
      this.payButtonText = config.payButtonText || ""
      this.additionalData = config.additionalData || {}
      this.cvcLabel = config.cvcLabel || ""
      this.cvcPlaceholder = config.cvcPlaceholder || ""

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
