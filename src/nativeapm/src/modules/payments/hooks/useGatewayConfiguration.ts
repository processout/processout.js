import { usePaymentData } from '.';
import { gatewayMapper } from '../mappers';
import { gatewayService } from '../services';

const useGatewayConfiguration = () => {
  const paymentData = usePaymentData();

  const apiResponse = gatewayService.getGatewayConfiguration({
    invoiceId: paymentData.invoiceId,
    gatewayConfigurationId: paymentData.gatewayConfigurationId,
  });

  return gatewayMapper.mapToUI(apiResponse);
};

export default useGatewayConfiguration;
