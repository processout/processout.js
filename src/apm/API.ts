module ProcessOut {

  export type FormEmailField =
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
      max_length: 6
      min_length: 6
      required: true
      subtype: "digits" | "alphanumeric"
    } & {}

  export type FormData = {
    type: 'form',
    parameters: {
      parameter_definitions: Array<FormEmailField>
    }
  }

  export type APIElements = Array<FormData>

  export type APISuccessResponse = {
    success: true,
    state: "SUCCESS" | 'NEXT_STEP_REQUIRED',
    elements: APIElements
  }

  export type APIErrorResponse = {
    success: false,
    state: "ERROR"
    error: {
      code: string,
      message: string,
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
    elements: APIElements
  }

  type NetworkErrorResponse = {
    success: false,
    error_type: string,
    message: string;
  }

  export type NetworkResponse =
    | NetworkSuccessResponse
    | NetworkErrorResponse

  export type APIOptions<D extends APISuccessResponse = APISuccessResponse> = {
    retries?: number,
    onSuccess?: (data: D) => void,
    onFailure?: (data: APIFailureResponse) => void,
    onError?: (data: APIErrorResponse) => void,
  }

  export interface APIRequest{
    <D extends APISuccessResponse>(options: APIOptions<D>): void
  }

  const isErrorResponse = (data: NetworkResponse): data is NetworkErrorResponse => {
    return data.success === false
  }

  const handleError = (request: string, data: NetworkErrorResponse, options: APIOptions) => {
    switch (data.error_type) {
      case 'request.route-not-found':
        ContextImpl.context.logger.error({
          host: window.location?.hostname || '',
          fileName: 'API.ts',
          lineNumber: 64,
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
      case 'resource.gateway-configuration.not-found':
        options.onFailure?.({
          success: false,
          state: 'FAILURE',
          error: {
            code: data.error_type,
            message: data.message,
          }
        })
        break;
      default: {
        options.onError?.({
          success: false,
          state: 'ERROR',
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
        retries: 10,
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

          if (apiResponse.state === 'PENDING') {
            if (internalOptions.retries && internalOptions.retries <= 0) {
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

            internalOptions.retries--;
            setTimeout(() => {
              this.makeRequest(method, path, data, internalOptions);
            }, 1000);
            return;
          }

          internalOptions.onSuccess?.(apiResponse as D);
        },
        (req, e, errorCode) => {
          internalOptions.onFailure?.({
            success: false,
            state: 'FAILURE',
            error:
              req.response || {
                code: errorCode || 'processout-js.internal-server-error',
                message: '',
              },
          });
        }
      );
    }
  }
}
