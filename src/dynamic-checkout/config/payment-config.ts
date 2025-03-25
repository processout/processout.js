/// <reference path="../references.ts" />

module ProcessOut {
  export type DynamicCheckoutPublicConfigType = {
    invoiceId: string
    projectId: string
    locale?: string
    clientSecret?: string
    capturePayments?: boolean
    allowFallbackToSale?: boolean
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
      }
    }

    public setInvoiceDetails(invoiceDetails: Invoice) {
      this.invoiceDetails = invoiceDetails
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
    }

    private isValidConfig(config: DynamicCheckoutPublicConfigType) {
      return !!config.projectId && !!config.invoiceId
    }
  }
}
