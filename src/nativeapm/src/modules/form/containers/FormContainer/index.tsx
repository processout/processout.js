import { useGatewayConfiguration } from '../../../payments';
import { useViewsStore } from '../../../views-manager';
import Form from '../../components/Form';

const FormContainer = () => {
  const gatewayConfiguration = useGatewayConfiguration();
  const { goToPendingState } = useViewsStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToPendingState();
  };

  return <Form data={gatewayConfiguration} onSubmit={handleSubmit} />;
};

export default FormContainer;
