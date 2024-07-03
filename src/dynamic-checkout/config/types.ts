/// <reference path="../references.ts" />

type DynamicCheckoutConfigType = {
  invoiceId: string
  projectId: string
  paymentMethods: PaymentMethod[]
}

interface Transaction {
  status: string;
}

type Invoice = {
  id: string;
  name: string;
  order_id: string | null;
  amount: string;
  currency: string;
  require_backend_capture: boolean | null;
  return_url: string;
  tax: string | null;
  payment_type: string | null;
  payment_methods: PaymentMethod[];
  expires_at: string | null;
  metadata: Record<string, unknown>;
  transaction: Transaction;
}

type PaymentMethod = {
  type: string
  flow?: string
  applepay?: Applepay
  googlepay?: Googlepay
  display?: Display
  card?: Card
  apm?: Apm
}

type Googlepay = {
  allowed_auth_methods: string[]
  allowed_card_networks: string[]
  allow_prepaid_cards: boolean
  allow_credit_cards: boolean
}

type Applepay = {
  merchant_id: string
  country_code: string
  supported_networks: string[]
  merchant_capabilities: string[]
}

type Display = {
  name: string
  logo: Logo
  brand_color: BrandColor
}

type Logo = {
  light_url: Url
  dark_url: Url
}

type Url = {
  vector: string
  raster: string
}

type BrandColor = {
  light: string
  dark: string
}

type Card = {
  require_cvc: boolean
  require_cardholder_name: boolean
  allow_scheme_selection: boolean
  billing_address: BillingAddress
}

type BillingAddress = {
  collection_mode: string
  restrict_to_country_codes: string[]
}

type Apm = {
  gateway_configuration_uid: string
  gateway_name: string
  redirect_url: string
}

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Dynamic Checkout class for handling configuration of the widget
   */
  export class DynamicCheckoutConfig {
    /**
     * Dynamic Checkout invoice ID
     * @type {DynamicCheckoutConfigType['invoiceId']}
     */
    invoiceId: DynamicCheckoutConfigType["invoiceId"]

    /**
     * Dynamic Checkout project ID
     * @type {DynamicCheckoutConfigType['projectId']}
     */
    projectId: DynamicCheckoutConfigType["projectId"]

    /**
     * Payment Methods
     * @type {DynamicCheckoutConfigType['paymentMethods']}
     */
    paymentMethods: DynamicCheckoutConfigType["paymentMethods"]

    /**
     * DynamicCheckoutConfig constructor
     * @param  {DynamicCheckoutConfigType} config
     */
    constructor(config: DynamicCheckoutConfigType) {
      this.setConfig(config)
    }

    /**
     * This function returns config of DynamicCheckoutConfig instance
     */
    public getConfig(): DynamicCheckoutConfigType {
      return {
        invoiceId: this.invoiceId,
        projectId: this.projectId,
        paymentMethods: this.paymentMethods
      }
    }

    /**
     * This function sets config of Dynamic Checkout widgets
     */
    private setConfig(config: DynamicCheckoutConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Error(
          "You must instantiate Dynamic Checkout with a valid config in order to use it",
        )
      }

      const { invoiceId, projectId } = config

      this.invoiceId = invoiceId
      this.projectId = projectId
    }

    /**
     * This function validates if the config is valid
     */
    private isValidConfig(config: DynamicCheckoutConfigType) {
      return !!config.projectId && !!config.invoiceId
    }
  }
}
