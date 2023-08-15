import { Container } from '../../components';
import { useGatewayConfiguration } from '../../modules/payments';

const PendingView = () => {
  const gatewayConfiguration = useGatewayConfiguration();
  console.log(gatewayConfiguration);
  return (
    <Container>
      <div>PendingView</div>
    </Container>
  );
};

export default PendingView;
