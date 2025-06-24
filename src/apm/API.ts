module ProcessOut {
  export type FormFieldResponse =
    | {
      type: "email" | "name"
      key: string
      label: string
      required: boolean
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
        key: string;
        label: string;
        preselected: boolean
      }>
    } & {}

  export type FormFieldResult =
    | {
      type: "email" | "name"
      key: string
      label: string
      required: boolean
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
        key: string;
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

  export type APIElements<FormObjects extends object> = Array<FormData<FormObjects>>

  export type APIInvoice = {
    currency: string,
    amount: string
  }

  export type APISuccessResponse = {
    success: true,
    state: "SUCCESS" | 'NEXT_STEP_REQUIRED',
    elements: APIElements<FormFieldResult>
    invoice: APIInvoice,
    gateway: object
  }

  export type APIValidationResponse = {
    success: false,
    state: "VALIDATION_ERROR",
    elements: APIElements<FormFieldResult>,
    invoice: APIInvoice,
    gateway: object,
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

  type NetworkSuccessResponse = {
    success: true,
    state: "PENDING" | "SUCCESS" | 'NEXT_STEP_REQUIRED'
    elements: APIElements<FormFieldResponse>
    invoice: APIInvoice,
    gateway: object
  }

  type NetworkValidationResponse = {
    success: false,
    error_type: string,
    message: string;
    elements: APIElements<FormFieldResponse>
    invoice: APIInvoice,
    gateway: object
    invalid_fields: Array<{
      name: string,
      message: string
    }>
  }

  type NetworkErrorResponse = {
    success: false,
    error_type: string,
    message: string;
  }

  export type NetworkResponse =
    | NetworkSuccessResponse
    | NetworkValidationResponse
    | NetworkErrorResponse

  export type APIOptions<D extends APISuccessResponse = APISuccessResponse> = {
    initialTimestamp?: number,
    hasConfirmedPending?: boolean,
    onSuccess?: (data: D) => void,
    onFailure?: (data: APIFailureResponse) => void,
    onError?: (data: APIValidationResponse) => void,
  }

  export interface APIRequest{
    <D extends APISuccessResponse>(options: APIOptions<D>): void
  }

  const MIN_15 = 1000 * 60 * 15;

  const isErrorResponse = (data: NetworkResponse): data is NetworkErrorResponse => {
    return data.success === false && (!('invalid_fields' in data) && !data.error_type.startsWith('request.validation.'))
  }

  const isValidationResponse = (data: NetworkResponse): data is NetworkValidationResponse => {
    return data.success === false && ('invalid_fields' in data || data.error_type.startsWith('request.validation.'));
  }

  const handleError = (request: string, data: NetworkErrorResponse, options: APIOptions) => {
    switch (data.error_type) {
      case 'request.route-not-found':
        ContextImpl.context.logger.error({
          host: window?.location?.host ?? '',
          fileName: 'API.ts',
          lineNumber: 208,
          message: `${request} failed as route does not exist`,
          category: 'APM - API'
        })
        options.onFailure?.({
          success: false,
          state: 'FAILURE',
          error: {
            code: 'processout-js.request.route-not-found',
            message: 'We were unable to connect to our API. Please contact support if you think this is an error.',
          }
        })
        break;
      default: {
        ContextImpl.context.logger.error({
          host: window?.location?.host ?? '',
          fileName: 'API.ts',
          lineNumber: 208,
          message: `${request} failed because of an error: ${data.message}`,
          category: 'APM - API'
        })
        options.onFailure?.({
          success: false,
          state: 'FAILURE',
          error: {
            code: data.error_type,
            message: data.message
          }
        })
        break;
      }
    }
    return
  }

  export class APIImpl {
    private constructor() {}

    public static initialise(options: APIOptions) {
      return this.get(ContextImpl.context.gatewayConfigurationId, options)
    }

    public static getCurrentStep(options: APIOptions) {
      return this.get(options)
    }
    public static sendFormData<F extends Record<string, unknown> = Record<string, unknown>>(formData: F) {
      return (options: APIOptions) => this.post({
        gateway_configuration_id: ContextImpl.context.gatewayConfigurationId,
        submit_data: {
          parameters: formData
        }
      }, options)
    }

    private static get(path: string): void;
    private static get<D extends APISuccessResponse = APISuccessResponse>(options: APIOptions<D>): void;
    private static get<D extends APISuccessResponse = APISuccessResponse>(path: string, options: APIOptions<D>): void;
    private static get<D extends APISuccessResponse = APISuccessResponse>(
      pathOrOptions: string | APIOptions<D>,
      options: APIOptions<D> = {}
    ): void {
      this.makeRequest('GET', pathOrOptions, {}, options);
    }


    private static post<T extends Record<string, any> = Record<string, any>>(data: T, path: string): void;
    private static post<T extends Record<string, any> = Record<string, any>, D extends APISuccessResponse = APISuccessResponse>(data: T, options: APIOptions<D>): void;
    private static post<T extends Record<string, any> = Record<string, any>, D extends APISuccessResponse = APISuccessResponse>(data: T, path: string, options: APIOptions<D>): void;
    private static post<T extends Record<string, any> = Record<string, any>, D extends APISuccessResponse = APISuccessResponse>(data: T, pathOrOptions: string | APIOptions<D>, options: APIOptions<D> = {}) {
      this.makeRequest('POST', pathOrOptions, data, options);
    }

    private static makeRequest<T extends Record<string, any> = Record<string, any>, D extends APISuccessResponse = APISuccessResponse>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      pathOrOptions: string | APIOptions<D>,
      data: T = {} as T,
      options: APIOptions<D> = {}
    ): void {
      let path: string;
      let internalOptions: APIOptions<D> = {
        initialTimestamp: Date.now(),
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

      const endpoint = ['invoices', ContextImpl.context.invoiceId, 'apm-payment', path]
        .filter(part => !!part)
        .join('/');

      ContextImpl.context.poClient.apiRequest(
        method,
        endpoint,
        data,
        (apiResponse: NetworkResponse, req) => {
          if (isErrorResponse(apiResponse)) {
            handleError(`${method} ${endpoint}`, apiResponse, internalOptions);
            return;
          }

          if (isValidationResponse(apiResponse)) {
            const result = this.transformResponse(apiResponse);
            internalOptions.onError({
              success: false,
              state: 'VALIDATION_ERROR',
              elements: result.elements,
              gateway: result.gateway,
              invoice: result.invoice,
              error: {
                code: 'processout-js.apm.validation-error',
                message: 'Validation error',
                invalid_fields: (apiResponse as NetworkValidationResponse).invalid_fields || Object.keys((apiResponse as any).error.parameters).reduce((acc, name) => {
                  acc.push({
                    name,
                    message: (apiResponse as any).error.parameters[name].detail
                  })
                  return acc;
                }, []),
              }
            })
            return;
          }

          if (apiResponse.state === 'PENDING') {
            if (internalOptions.initialTimestamp) {
              const currentTimestamp = Date.now();
              const elapsedTime = currentTimestamp - internalOptions.initialTimestamp;
              if (elapsedTime > MIN_15) {
                internalOptions.onFailure?.({
                  success: false,
                  state: 'FAILURE',
                  error: {
                    code: 'processout-js.apm.polling-reached',
                    message: 'Timeout reached while polling for APM payment status',
                  },
                });
                return;
              }
            }

            if (apiResponse.elements) {
              internalOptions.onSuccess?.(this.transformResponse(apiResponse));
              if (ContextImpl.context.requirePendingConfirmation && !internalOptions.hasConfirmedPending) {
                return
              }
            }

            setTimeout(() => {
              this.makeRequest(method, path, data, internalOptions);
            }, 1000);
            return;
          }

          internalOptions.onSuccess?.(this.transformResponse(apiResponse));
          return;
        },
        (req, e, errorCode) => {
          internalOptions.onFailure?.({
            success: false,
            state: 'FAILURE',
            error:
              req.response || {
                code: errorCode || 'processout-js.internal-server-error',
                message: 'Internal server error. Please contact support.',
              },
          });
        }
      );
    }

    private static transformResponse = <D extends APISuccessResponse = APISuccessResponse>(response: NetworkSuccessResponse): D => {
      let result = response

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

      return result as D
    }
  }
}
