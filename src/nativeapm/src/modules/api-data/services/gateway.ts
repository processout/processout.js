import { apiClient } from '../clients';

export type GetGatewayConfigurationResponseType = {
  native_apm: {
    gateway: {
      customer_action_image_url: string;
      customer_action_message: string;
      display_name: string;
      logo_url: string;
    };
    invoice: {
      amount: string;
      currency_code: string;
    };
    parameters: {
      key: string;
      type: string;
      required: boolean;
      length: number | null;
      display_name: string;
    }[];
  };
};

type GetGatewayConfigurationArgsType = {
  invoiceId: string;
  gatewayConfigurationId: string;
};

const getGatewayConfiguration = ({
  invoiceId,
  gatewayConfigurationId,
}: GetGatewayConfigurationArgsType) => {
  return apiClient.get<GetGatewayConfigurationResponseType>(
    `/invoices/${invoiceId}/native-payment/${gatewayConfigurationId}`
  );
};

export default {
  getGatewayConfiguration,
};
