import { usePaymentData } from '../../payment-data';
import { apiClientFetcher } from '../clients';
import { gatewayMapper } from '../mappers';
import useSWR from 'swr';

export type GatewayConfigurationResponseType = {
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

const useGatewayConfiguration = () => {
  const { invoiceId, gatewayConfigurationId } = usePaymentData();

  const { data, isLoading } = useSWR<GatewayConfigurationResponseType, Error>(
    `/invoices/${invoiceId}/native-payment/${gatewayConfigurationId}`,
    apiClientFetcher
  );

  return {
    gatewayConfiguration: !isLoading && data ? gatewayMapper.mapToUI(data) : {},
    isLoading,
  };
};

export default useGatewayConfiguration;
