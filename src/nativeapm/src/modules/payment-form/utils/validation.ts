import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

const VALIDATION_ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  MAX_LENGTH: 'This field is too long',
};

export const getErrorMessage = (
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined // eslint-disable-line
) => {
  if (!error) {
    return undefined;
  }

  switch (error.type) {
    case 'required':
      return VALIDATION_ERROR_MESSAGES.REQUIRED;
    case 'maxLength':
      return VALIDATION_ERROR_MESSAGES.MAX_LENGTH;
    default:
      return undefined;
  }
};
