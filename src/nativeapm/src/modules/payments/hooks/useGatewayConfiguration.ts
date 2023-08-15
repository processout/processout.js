import { usePaymentData } from '.';
import { uiMapper } from '../mappers';
import { apiService } from '../services';

const useGatewayConfiguration = () => {
  const paymentData = usePaymentData();

  const apiResponse = apiService.getGatewayConfiguration({
    invoiceId: paymentData.invoiceId,
    gatewayConfigurationId: paymentData.gatewayConfigurationId,
  });

  return uiMapper.mapToUI(apiResponse);
};

export default useGatewayConfiguration;
