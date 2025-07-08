module ProcessOut {
export type FormFieldResponse =
    | {
      type: "email" | "text"
      key: string
      label: string
      required: boolean
      min_length?: number
      max_length?: number
    }
    | {
      type: "phone"
      key: string
      label: string
      required: boolean
      dialing_codes: Array<{
        region_code: string;
        value: string;
      }>
    }
    | {
      type: "otp"
      key: string
      label: string
      max_length: number
      min_length: number
      required: true
      subtype: "digits" | "alphanumeric"
    }
    | {
      type: 'single-select'
      key: string
      label: string
      required: boolean
      available_values: Array<{
        value: string;
        label: string;
        preselected: boolean
      }>
    } & {}

  export type FormFieldResult =
    | {
      type: "email" | "text"
      key: string
      label: string
      required: boolean
      max_length: number
      min_length: number
    }
    | {
      type: "phone"
      key: string
      label: string
      required: boolean
      dialing_codes: Array<{
        region_code: string;
        value: string;
        name: string
      }>
    }
    | {
      type: "otp"
      key: string
      label: string
      max_length: number
      min_length: number
      required: true
      subtype: "digits" | "alphanumeric"
    }
    | {
      type: 'single-select'
      key: string
      label: string
      required: boolean
      available_values: Array<{
        value: string;
        label: string;
        preselected: boolean
      }>
    } & {}

  export type FormData<O extends object> = {
    type: 'form',
    parameters: {
      parameter_definitions: Array<O>
    }
  }
  
  export type InstructionData = {
    type: 'instruction',
    instruction: 
      | {
        type: 'message',
        value: string,
        label?: string,
      }
      | {
        type: 'barcode',
        subtype: 'qr',
        value: string,
      }
  }

  export type APIElements<FormObjects extends object> = Array<FormData<FormObjects> | InstructionData>

  export type PaymentContext = {
    invoice: APIInvoice,
    payment_method: {
      display_name: string
      gateway_name: string
      logo: {
        light_url: {
          raster: string
          vector: string
        }
        dark_url: {
          raster: string
          vector: string
        }
      }
    }
  }
  export type APIInvoice = {
    currency: string,
    amount: string
  }

  interface APIResponseBase<T extends FormFieldResponse | FormFieldResult> {
    elements?: APIElements<T>
  }

  export interface APISuccessBase extends APIResponseBase<FormFieldResult> {
    success: true,
    state: "SUCCESS" | 'NEXT_STEP_REQUIRED' | 'PENDING',
  }

  export interface APIValidationBase extends APIResponseBase<FormFieldResult> {
    success: false,
    state: "VALIDATION_ERROR",
    error: {
      code: string,
      message: string,
      invalid_fields: Array<{
        name: string,
        message: string
      }>
    }
  }
  export type APIFailureResponse = {
    success: false,
    state: "FAILURE",
    error: {
      code: string,
      message: string,
    }
  }

  export interface AuthorizationSuccessResponse extends APISuccessBase, PaymentContext {}
  export interface AuthorizationValidationResponse extends APIValidationBase, PaymentContext {}

  // Tokenization-specific response types (no PaymentContext)
  export interface TokenizationSuccessResponse extends APISuccessBase {}
  export interface TokenizationValidationResponse extends APIValidationBase {}

  interface NetworkValidationBase extends APIResponseBase<FormFieldResponse> {
    success: false,
    error_type: string,
    message: string;
    invalid_fields: Array<{
      name: string,
      message: string
    }>
  }

  interface AuthorizationNetworkSuccessResponse extends APISuccessBase, PaymentContext {}
  interface TokenizationNetworkSuccessResponse extends APISuccessBase {}

  interface AuthorizationNetworkValidationResponse extends NetworkValidationBase,  PaymentContext {}
  interface TokenizationNetworkValidationResponse extends NetworkValidationBase {}


  type NetworkErrorResponse = {
    success: false,
    error_type: string,
    message: string;
  }

  export type AuthorizationNetworkResponse =
    | AuthorizationNetworkSuccessResponse
    | AuthorizationNetworkValidationResponse
    | NetworkErrorResponse

  export type TokenizationNetworkResponse =
    | TokenizationNetworkSuccessResponse
    | TokenizationNetworkValidationResponse
    | NetworkErrorResponse

  export type APIOptions<D extends object, V extends object> = {
    initialTimestamp?: number,
    serviceRetries?: number
    hasConfirmedPending?: boolean,
    hasReturnedFirstPending?: boolean,
    onSuccess?: (data: D) => void,
    onFailure?: (data: APIFailureResponse) => void,
    onError?: (data: V) => void,
  }

  export interface APIRequest{
    (options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>): void
  }

  const TIMEOUT = 1000;
  let INITIAL_MAX_RETRIES = 0
  let POLLING_TIMEOUT_ID: number | null = null

  const isErrorResponse = (data: AuthorizationNetworkResponse | TokenizationNetworkResponse): data is NetworkErrorResponse => {
    return data.success === false && (!('invalid_fields' in data) && !data.error_type.startsWith('request.validation.'))
  }

  const isValidationResponse = (data: AuthorizationNetworkResponse): data is AuthorizationNetworkValidationResponse => {
    return data.success === false && ('invalid_fields' in data || data.error_type.startsWith('request.validation.'));
  }

  const isTokenizationValidationResponse = (data: TokenizationNetworkResponse): data is TokenizationNetworkValidationResponse => {
    return data.success === false && ('invalid_fields' in data || data.error_type.startsWith('request.validation.'));
  }

  const handleError = (request: string, data: NetworkErrorResponse, options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>) => {
    switch (data.error_type) {
      case 'request.route-not-found':
        ContextImpl.context.logger.error({
          host: window?.location?.host ?? '',
          fileName: 'API.ts',
          lineNumber: 208,
          message: `${request} failed as route does not exist`,
          category: 'APM - API'
        })
        
        const routeNotFoundError = {
          success: false as const,
          state: 'FAILURE' as const,
          error: {
            code: 'processout-js.request.route-not-found',
            message: 'We were unable to connect to our API. Please contact support if you think this is an error.',
          }
        };
        
        options.onFailure?.(routeNotFoundError);
        break;
      default: {
        ContextImpl.context.logger.error({
          host: window?.location?.host ?? '',
          fileName: 'API.ts',
          lineNumber: 208,
          message: `${request} failed because of an error: ${data.message}`,
          category: 'APM - API'
        })
        
        const defaultError = {
          success: false as const,
          state: 'FAILURE' as const,
          error: {
            code: data.error_type,
            message: data.message
          }
        };
        
        options.onFailure?.(defaultError);
        break;
      }
    }
    return
  }

  export class APIImpl {
    private constructor() {}

    public static initialise(options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>) {
      const context = ContextImpl.context;
      const flow = context.flow;

      if (flow === 'authorization') {
        return this.get(context.gatewayConfigurationId, options);
      }

      return this.post({
        gateway_configuration_id: context.gatewayConfigurationId,
      }, options)
    }

    public static getCurrentStep(options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>) {
      return this.get(options)
    }
    
    public static sendFormData<F extends Record<string, unknown> = Record<string, unknown>>(formData: F) {
      return (options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>) => {
        const context = ContextImpl.context;
        const data ={
          gateway_configuration_id: context.gatewayConfigurationId,
          submit_data: { parameters: formData }
        };
        
        return this.post(data, options)
      }
    }

    private static get(
      pathOrOptions: string | APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = '',
      options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = {}
    ): void {
      this.makeRequest('GET', pathOrOptions, {}, options);
    }

    private static post<T extends Record<string, any> = Record<string, any>>(
      data: T, 
      pathOrOptions: string | APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = '', 
      options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = {}
    ) {
      this.makeRequest('POST', pathOrOptions, data, options);
    }

    private static makeRequest<T extends Record<string, any> = Record<string, any>>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      pathOrOptions: string | APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse>,
      data: T = {} as T,
      options: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = {}
    ): void {
      let path: string;
      let internalOptions: APIOptions<AuthorizationSuccessResponse | TokenizationSuccessResponse, AuthorizationValidationResponse | TokenizationValidationResponse> = {
        initialTimestamp: Date.now(),
        serviceRetries: 5,
        ...options,
      };

      if (typeof pathOrOptions === 'string') {
        path = pathOrOptions;
      } else {
        internalOptions = {
          ...internalOptions,
          ...pathOrOptions,
        };
      }

      if (INITIAL_MAX_RETRIES === 0) {
        INITIAL_MAX_RETRIES = internalOptions.serviceRetries;
      }

      const context = ContextImpl.context;
      
      // Build endpoint based on flow type
      const endpoint = context.flow === 'authorization'
        ? ['invoices', context.invoiceId, 'apm-payment', path].filter(part => !!part).join('/')
        : ['customers', context.customerId, 'apm-tokens', context.customerTokenId, 'tokenize'].join('/');

      ContextImpl.context.poClient.apiRequest(
        method,
        endpoint,
        data,
        (apiResponse: AuthorizationNetworkResponse | TokenizationNetworkResponse) => {
          if (isErrorResponse(apiResponse)) {
            INITIAL_MAX_RETRIES = 0;
            
            // Clear polling timeout since we have an error
            if (POLLING_TIMEOUT_ID) {
              window.clearTimeout(POLLING_TIMEOUT_ID);
              POLLING_TIMEOUT_ID = null;
            }
            
            handleError(`${method} ${endpoint}`, apiResponse, internalOptions);
            return;
          }

          // Handle validation responses based on flow type
          const isValidation = context.flow === 'authorization' 
            ? isValidationResponse(apiResponse as AuthorizationNetworkResponse)
            : isTokenizationValidationResponse(apiResponse as TokenizationNetworkResponse);

          if (isValidation) {
            INITIAL_MAX_RETRIES = 0;

            // Clear polling timeout since we have a validation error
            if (POLLING_TIMEOUT_ID) {
              window.clearTimeout(POLLING_TIMEOUT_ID);
              POLLING_TIMEOUT_ID = null;
            }

            const result = this.transformResponse(apiResponse as any);
            const errorData = {
              success: false as const,
              state: 'VALIDATION_ERROR' as const,
              elements: result.elements,
              error: {
                code: 'processout-js.apm.validation-error',
                message: 'Validation error',
                invalid_fields: (apiResponse as any).invalid_fields || Object.keys((apiResponse as any).error?.parameters || {}).reduce((acc, name) => {
                  acc.push({
                    name,
                    message: (apiResponse as any).error.parameters[name].detail
                  })
                  return acc;
                }, []),
              }
            };

            // Add all payment fields (PaymentContext + payment data)
            const errorWithPaymentData = this.addPaymentFields(errorData, apiResponse);
            internalOptions.onError?.(errorWithPaymentData as any);
            return;
          }

          if (apiResponse.state === 'PENDING') {
            if (internalOptions.initialTimestamp) {
              const currentTimestamp = Date.now();
              const elapsedTime = currentTimestamp - internalOptions.initialTimestamp;
              if (elapsedTime > ContextImpl.context.confirmation.timeout * 1000) {
                INITIAL_MAX_RETRIES = 0;

                // Clear polling timeout since we're timing out
                if (POLLING_TIMEOUT_ID) {
                  window.clearTimeout(POLLING_TIMEOUT_ID);
                  POLLING_TIMEOUT_ID = null;
                }

                const timeoutError = {
                  success: false as const,
                  state: 'FAILURE' as const,
                  error: {
                    code: 'processout-js.apm.polling-reached',
                    message: 'Timeout reached while polling for APM payment status',
                  },
                };

                // Include payment data in timeout error
                const timeoutErrorWithPaymentData = this.addPaymentFields(timeoutError, apiResponse);
                internalOptions.onFailure?.(timeoutErrorWithPaymentData);
                return;
              }
            }

            // Return on first PENDING response OR anytime there are elements
            const shouldReturn = !internalOptions.hasReturnedFirstPending || apiResponse.elements;
            
            if (shouldReturn) {
              if (!internalOptions.hasReturnedFirstPending) {
                internalOptions.hasReturnedFirstPending = true;
              }
              
              internalOptions.onSuccess?.(this.transformResponse(apiResponse));
              if (ContextImpl.context.confirmation.requiresAction && !internalOptions.hasConfirmedPending) {
                INITIAL_MAX_RETRIES = 0;
                return
              }
            }

            // Continue polling in background
            POLLING_TIMEOUT_ID = window.setTimeout(() => {
              internalOptions.serviceRetries = INITIAL_MAX_RETRIES
              this.initialise(internalOptions);
            }, TIMEOUT);
            return;
          }

          INITIAL_MAX_RETRIES = 0;
          
          // Clear polling timeout since we're done
          if (POLLING_TIMEOUT_ID) {
            window.clearTimeout(POLLING_TIMEOUT_ID);
            POLLING_TIMEOUT_ID = null;
          }
          
          if (apiResponse.state === 'SUCCESS' && !ContextImpl.context.success.enabled) {
            ContextImpl.context.events.emit('success', { trigger: 'immediate' });
            return;
          }

          internalOptions.onSuccess?.(this.transformResponse(apiResponse));
          return;
        },
        (req, _, errorCode) => {
          if ((req.status === 0 || req.status > 500) && internalOptions.serviceRetries > 0) {
            setTimeout(() => {
              internalOptions.serviceRetries--;
              this.makeRequest(method, pathOrOptions, data, internalOptions)
            }, TIMEOUT * ((INITIAL_MAX_RETRIES - internalOptions.serviceRetries) + 1));
            return
          }

          INITIAL_MAX_RETRIES = 0;
          
          // Clear polling timeout since we have a network error
          if (POLLING_TIMEOUT_ID) {
            window.clearTimeout(POLLING_TIMEOUT_ID);
            POLLING_TIMEOUT_ID = null;
          }
          
          const networkError = {
            success: false as const,
            state: 'FAILURE' as const,
            error:
              req.response || {
                code: errorCode || 'processout-js.internal-server-error',
                message: 'Internal server error. Please contact support.',
              },
          };

          // Include payment data in network error if available
          const networkErrorWithPaymentData = req.response
            ? this.addPaymentFields(networkError, req.response)
            : networkError;
          internalOptions.onFailure?.(networkErrorWithPaymentData);
        }
      );
    }

    private static transformResponse = <D extends AuthorizationSuccessResponse | TokenizationSuccessResponse>(response: AuthorizationNetworkSuccessResponse | TokenizationNetworkSuccessResponse): D => {
      let result = { ...response } as any

      if (result.elements) {
        result.elements = response.elements.map(element => {
          if (element.type === 'form') {
            const fields = element.parameters.parameter_definitions.map(field => {
              if (field.type === 'phone') {
                return {
                  ...field,
                  dialing_codes: field.dialing_codes
                    .map((codes) => ({
                      ...codes,
                      name: COUNTRY_DICT[codes.region_code] || codes.region_code
                    }))
                    .sort((a, b) => {
                      if (a.name < b.name) { return -1; }
                      if (a.name > b.name) { return 1; }
                      return 0;
                    })
                }
              }

              return field
            })

            element.parameters.parameter_definitions = fields
          }

          return element
        })
      }

      return this.addPaymentFields(result, response)
    }

    public static cancelPolling(): void {
      if (POLLING_TIMEOUT_ID) {
        window.clearTimeout(POLLING_TIMEOUT_ID);
        POLLING_TIMEOUT_ID = null;
      }
      INITIAL_MAX_RETRIES = 0;
    }

    public static addPaymentFields = <T>(result: T, response: any): T => {
      if ('invoice' in response && 'payment_method' in response) {
        (result as any).invoice = response.invoice;
        (result as any).payment_method = response.payment_method;
      }

      return result
    }
  }
}
