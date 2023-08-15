import { apiService } from '../services';

const useGatewayConfiguration = () => {
  return apiService.getGatewayConfiguration();
};

export default useGatewayConfiguration;
