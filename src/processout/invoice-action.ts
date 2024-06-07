/// <reference path="../references.ts" />

module ProcessOut {
  /**
   * Configuration for the invoice action operation.
   */
  export type InvoiceActionProps = {
    /**
     * Invoice ID.
     * @var {string}
     */
    invoiceId: string;
    /**
     * Gateway Configuration to be used for the invoice action.
     * @var {string}
     */
    gatewayConf: InvoiceGatewayConfigurationProps;
    /**
     * Customer Token ID - the ID of the customer token ID to use for the invoice action, if any.
     * @var {string|undefined}
     */
    customerTokenId?: string;
    /**
     * Additional data - any additional data that should be passed to the gateway.
     * @var {Object.<string, string>}
     */
    additionalData?: any;
    /**
     * Tokenized callback - a function that will be called with the tokenized object created during the invoice action handling.
     * @var {TokenCallback}
     */
    tokenized: TokenCallback;
    /**
     * Token error callback - a function that will be called if an error occurs while tokenizing the payment method.
     * @var {TokenErrorCallback}
     */
    tokenError: TokenErrorCallback;
    /**
     * Iframe override - an object containing the iframe override configuration.
     * @var {IframeOverride}
     */
    iframeOverride?: IframeOverride;
  }

  export type InvoiceGatewayConfigurationProps = {
    /**
     * Gateway configuration ID.
     * @var {string}
     */
    id: string;
    /**
     * Gateway name.
     * @var {string|undefined}
     */
    gatewayName?: string;
    /**
     * Gateway logo URL.
     * @var {string|undefined}
     */
    gatewayLogoUrl?: string;
  }

  export type InvoiceActionUrlProps = {
    /**
     * Invoice ID.
     * @var {string}
     */
    invoiceId: string;

    /**
     * ID of the gateway configuration to be used.
     * @var {string}
     */
    gatewayConfigurationId: string;

    /**
     * Additional data - any additional data that should be passed to the gateway.
     * @var {Object.<string, string>}
     */
    additionalData: any;

    /**
     * Customer Token ID - the ID of the customer token ID to use for the invoice action, if any.
     * @var {string}
     */
    customerTokenId?: string;
  }

  /**
   * Map gatewayConf parameter to a valid {@link InvoiceGatewayConfigurationProps} instance.
   * @param {any|string} gatewayConf
   */
  export function mapInvoiceGatewayConfigurationProps(gatewayConf?: any): InvoiceGatewayConfigurationProps {
    if (!gatewayConf) {
      return null;
    }

    var gatewayConfigurationId: string = gatewayConf && gatewayConf.id
      ? gatewayConf.id
      : gatewayConf;

    if (!gatewayConf.gateway) {
      return {
        id: gatewayConfigurationId
      };
    }

    var gateway = gatewayConf.gateway;

    return {
      id: gatewayConfigurationId,
      gatewayName: gateway.name,
      gatewayLogoUrl: gateway.logo_url
    }
  }

  /**
   * Sanitize the invoice action props to a valid {@link InvoiceActionProps} instance.
   * @param {InvoiceActionProps} props
   */
  export function sanitizeInvoiceActionProps(props: InvoiceActionProps): InvoiceActionProps {
    return {
      invoiceId: props.invoiceId,
      gatewayConf: sanitizeGatewayConfigurationProps(props.gatewayConf),
      customerTokenId: props.customerTokenId,
      additionalData: props.additionalData,
      tokenized: props.tokenized,
      tokenError: props.tokenError,
      iframeOverride: props.iframeOverride
    };
  }

  function sanitizeGatewayConfigurationProps(props: InvoiceGatewayConfigurationProps): InvoiceGatewayConfigurationProps {
    if (!props) {
      return {id: null}
    }
    return props;
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
