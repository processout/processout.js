import { useGatewayConfiguration } from '../../../payments';
import { useViewsStore } from '../../../views-manager';
import Form from '../../components/Form';

const FormContainer = () => {
  const gatewayConfiguration = useGatewayConfiguration();
  const { goToPendingState } = useViewsStore();

  const onSubmit = () => {
    goToPendingState();
  };

  return <Form data={gatewayConfiguration} onSubmit={onSubmit} />;
};

export default FormContainer;
