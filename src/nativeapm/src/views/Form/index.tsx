import { Container } from '../../components';
import { FormContainer } from '../../modules/form';
import { useGatewayConfiguration } from '../../modules/payments';

const FormView = () => {
  const gatewayConfiguration = useGatewayConfiguration();

  return (
    <Container>
      <FormContainer gatewayConfiguration={gatewayConfiguration} />
    </Container>
  );
};

export default FormView;
