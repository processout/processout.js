import { ResponseType } from '../../payments';
import { FormDataType } from '../components/Form';

const mapToUI = (response: ResponseType): FormDataType => ({
  gateway: {
    name: response.native_apm.gateway.display_name,
    message: response.native_apm.gateway.customer_action_message,
    logo: response.native_apm.gateway.logo_url, // TODO: handle edge case
  },
  inputs: response.native_apm.parameters.map((parameter) => ({
    key: parameter.key,
    name: parameter.display_name,
    type: parameter.type,
    validation: {
      required: parameter.required,
      length: parameter.length,
    },
  })),
  button: {
    text: response.native_apm.invoice
      ? `Pay ${response.native_apm.invoice.amount} ${response.native_apm.invoice.currency_code}`
      : '',
  },
});

export default {
  mapToUI,
};
