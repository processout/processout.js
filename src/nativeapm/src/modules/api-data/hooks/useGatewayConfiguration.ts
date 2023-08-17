import { useQuery } from 'react-query';
import { usePaymentData } from '../../payment-data';
import { gatewayMapper } from '../mappers';
import { gatewayService } from '../services';

export const GATEWAY_CONFIGURATION_QUERY_KEY = 'gatewayConfiguration';

const useGatewayConfiguration = () => {
  const { invoiceId, gatewayConfigurationId } = usePaymentData();

  const { data, isLoading } = useQuery(GATEWAY_CONFIGURATION_QUERY_KEY, () =>
    gatewayService.getGatewayConfiguration({
      invoiceId,
      gatewayConfigurationId,
    })
  );

  return {
    gatewayConfiguration:
      !isLoading && data?.data ? gatewayMapper.mapToUI(data.data) : {},
    isLoading,
  };
};

export default useGatewayConfiguration;
