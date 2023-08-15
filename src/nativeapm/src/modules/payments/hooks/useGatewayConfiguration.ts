import { usePaymentData } from '.';
import { apiService } from '../services';

const useGatewayConfiguration = () => {
  const paymentData = usePaymentData();

  return apiService.getGatewayConfiguration({
    invoiceId: paymentData.invoiceId,
    gatewayConfigurationId: paymentData.gatewayConfigurationId,
  });
};

export default useGatewayConfiguration;
