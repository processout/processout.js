/// <reference path="../references.ts" />

type DynamicCheckoutPaymentConfigType = {
  invoiceId: string;
  projectId: string;
  clientSecret?: string
  invoiceDetails: Invoice;
};

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
  type: string;
  flow?: string;
  applepay?: Applepay;
  googlepay?: Googlepay;
  display?: Display;
  card?: Card;
  apm?: Apm;
  apm_customer_token?: Apm;
  card_customer_token?: Apm;
};

type Googlepay = {
  allowed_auth_methods: string[]
  allowed_card_networks: string[]
  allow_prepaid_cards: boolean
  allow_credit_cards: boolean
  gateway: string;
  gateway_merchant_id: string;
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
  gateway_configuration_id?: string;
  redirect_url?: string;
  customer_token_id?: string;
};

module ProcessOut {
  export class DynamicCheckoutPaymentConfig {
    invoiceId: DynamicCheckoutPaymentConfigType["invoiceId"];
    projectId: DynamicCheckoutPaymentConfigType["projectId"];
    clientSecret: DynamicCheckoutPaymentConfigType["clientSecret"];
    invoiceDetails: DynamicCheckoutPaymentConfigType["invoiceDetails"];

    constructor(config: DynamicCheckoutPaymentConfigType) {
      this.setInitialConfig(config);
    }

    public getConfig(): DynamicCheckoutPaymentConfigType {
      return {
        invoiceId: this.invoiceId,
        projectId: this.projectId,
        invoiceDetails: this.invoiceDetails,
      };
    }

    public setInvoiceDetails(invoiceDetails: Invoice) {
      this.invoiceDetails = invoiceDetails;
    }

    private setInitialConfig(config: DynamicCheckoutPaymentConfigType) {
      if (!this.isValidConfig(config)) {
        throw new Error(
          "You must instantiate Dynamic Checkout with a valid config in order to use it"
        );
      }

      this.invoiceId = config.invoiceId;
      this.projectId = config.projectId;
      this.clientSecret = config.clientSecret;
    }

    private isValidConfig(config: DynamicCheckoutPaymentConfigType) {
      return !!config.projectId && !!config.invoiceId;
    }
  }
}
