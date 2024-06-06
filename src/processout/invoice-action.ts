/// <reference path="../references.ts" />

module ProcessOut {
  /**
   * Configuration for the invoice action operation.
   */
  export class InvoiceActionConfig {
    /**
     * Invoice ID.
     * @private
     * @var {string}
     */
    private readonly invoiceId: string;

    /**
     * Gateway Configuration to be used for the invoice action.
     * @private
     * @var {string}
     */
    private readonly gatewayConf: InvoiceActionGatewayConfiguration;

    /**
     * Customer Token ID - the ID of the customer token ID to use for the invoice action, if any.
     * @private
     * @var {string}
     */
    private readonly customerTokenId?: string;

    /**
     * Additional data - any additional data that should be passed to the gateway.
     * @private
     * @var {Object.<string, string>}
     */
    private readonly additionalData: any;

    /**
     * Tokenized callback - a function that will be called with the tokenized object created during the invoice action handling.
     * @private
     * @var {TokenCallback}
     */
    private readonly tokenized: TokenCallback

    /**
     * Token error callback - a function that will be called if an error occurs while tokenizing the payment method.
     * @private
     * @var {TokenErrorCallback}
     */
    private readonly tokenError: TokenErrorCallback

    /**
     * Iframe override - an object containing the iframe override configuration.
     * @private
     * @var {IframeOverride}
     */
    private readonly iframeOverride?: IframeOverride;

    constructor(
      invoiceId: string,
      tokenized: TokenCallback,
      tokenError: TokenErrorCallback,
      gatewayConf?: InvoiceActionGatewayConfiguration,
      customerTokenId?: string,
      additionalData?: any,
      iframeOverride?: IframeOverride
    ) {
      this.invoiceId = invoiceId;
      this.gatewayConf = gatewayConf ? gatewayConf : new InvoiceActionGatewayConfiguration();
      this.customerTokenId = customerTokenId;
      this.additionalData = additionalData ? additionalData : {};
      this.tokenized = tokenized;
      this.tokenError = tokenError;
      this.iframeOverride = iframeOverride;
    }

    public getInvoiceId(): string {
      return this.invoiceId;
    }

    public getGatewayConfiguration(): InvoiceActionGatewayConfiguration {
      return this.gatewayConf;
    }

    public getCustomerTokenId(): string | undefined {
      return this.customerTokenId;
    }

    public getAdditionalData(): any {
      return this.additionalData;
    }

    public getTokenized(): TokenCallback {
      return this.tokenized;
    }

    public getTokenError(): TokenErrorCallback {
      return this.tokenError;
    }

    public getIframeOverride(): IframeOverride | undefined {
      return this.iframeOverride;
    }
  }

  export class InvoiceActionUrlConfig {
    /**
     * Invoice ID.
     * @private
     * @var {string}
     */
    private readonly invoiceId: string;

    /**
     * ID of the gateway configuration to be used.
     * @private
     * @var {string}
     */
    private readonly gatewayConfigurationId: string;

    /**
     * Additional data - any additional data that should be passed to the gateway.
     * @private
     * @var {Object.<string, string>}
     */
    private readonly additionalData: any;

    /**
     * Customer Token ID - the ID of the customer token ID to use for the invoice action, if any.
     * @private
     * @var {string}
     */
    private readonly customerTokenId?: string;

    constructor(
      invoiceId: string,
      gatewayConfigurationId: string,
      additionalData?: any,
      customerTokenId?: string
    ) {
      this.invoiceId = invoiceId;
      this.gatewayConfigurationId = gatewayConfigurationId;
      this.additionalData = additionalData ? additionalData : {};
      this.customerTokenId = customerTokenId
    }

    public getInvoiceId(): string {
      return this.invoiceId;
    }

    public getGatewayConfigurationId(): string {
      return this.gatewayConfigurationId;
    }

    public getAdditionalData(): any {
      return this.additionalData;
    }

    public getCustomerTokenId(): string | undefined {
      return this.customerTokenId;
    }
  }

  /**
   * Gateway configuration used for the invoice action.
   */
  export class InvoiceActionGatewayConfiguration {
    /**
     * Gateway configuration ID.
     * @private
     * @var {string}
     */
    private readonly id?: string
    /**
     * Gateway used by this particular gateway configuration.
     * @private
     * @var {Gateway}
     */
    private readonly gateway: InvoiceActionGateway

    constructor(id?: string, gateway?: InvoiceActionGateway) {
      this.id = id;
      this.gateway = gateway ? gateway : new InvoiceActionGateway();
    }

    public getId(): string | undefined {
      return this.id
    }

    public getGateway(): InvoiceActionGateway {
      return this.gateway;
    }
  }

  /**
   * Gateway associated with the gateway configuration used for the invoice action.
   */
  export class InvoiceActionGateway {
    /**
     * Gateway name.
     * @private
     * @var {string}
     */
    private readonly name?: string;
    /**
     * Gateway logo URL.
     * @private
     * @var {string}
     */
    private readonly logoUrl?: string;

    constructor(name?: string, logoUrl?: string) {
      this.name = name;
      this.logoUrl = logoUrl;
    }

    public getName(): string | undefined {
      return this.name;
    }

    public getLogoUrl(): string | undefined {
      return this.logoUrl;
    }
  }

  /**
   * Token callback for the invoice action.
   */
  export type TokenCallback = (token: string) => void;

  /**
   * Token error callback for the invoice action.
   */
  export type TokenErrorCallback = (err: Exception) => void;
}
