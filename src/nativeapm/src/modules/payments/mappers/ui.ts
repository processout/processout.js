import { ResponseType } from '../../payments';

export type GatewayUiDataType = {
  gateway: {
    name: string;
    message: string;
    logo: string;
  };
  inputs: Array<{
    key: string;
    name: string;
    type: string;
    validation: {
      required: boolean;
      length: number | null;
    };
  }>;
  button: {
    text: string;
  };
};

const mapToUI = (response: ResponseType): GatewayUiDataType => ({
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
