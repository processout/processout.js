import { FormContainer } from '../../../form';
import { useGatewayConfiguration } from '../../../payments';

const FormView = () => {
  const gatewayConfiguration = useGatewayConfiguration();

  return (
    <>
      <FormContainer gatewayConfiguration={gatewayConfiguration} />
    </>
  );
};

export default FormView;
