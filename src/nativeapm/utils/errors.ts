/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class to handle errors
   */
  export class ErrorsUtils {
    static isFieldsValidationError(errorData: {
      invalid_fields?: Array<any>;
      error_type?: string;
    }) {
      const { error_type, invalid_fields } = errorData;

      const isValidationErrorType =
        error_type === 'request.validation.error' ||
        error_type === 'gateway.invalid-customer-input';

      return isValidationErrorType && invalid_fields.length > 0;
    }

    static isValidationError(errorData: {
      invalid_fields?: Array<any>;
      error_type?: string;
    }) {
      const { error_type, invalid_fields } = errorData;

      const isValidationErrorType =
        error_type === 'request.validation.error' ||
        error_type === 'gateway.invalid-customer-input';

      return isValidationErrorType && invalid_fields.length === 0;
    }
  }
}
