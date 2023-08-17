import { useGatewayConfiguration } from '../../../payments';
import { usePrefilledData } from '../../../prefilled-data';
import { useViewsStore } from '../../../views-manager';
import Form from '../../components/Form';

const FormContainer = () => {
  const gatewayConfiguration = useGatewayConfiguration();
  const { goToPendingState } = useViewsStore();
  const prefilledData = usePrefilledData();

  const onSubmit = () => {
    goToPendingState();
  };

  return (
    <Form
      data={gatewayConfiguration}
      prefilledData={prefilledData}
      onSubmit={onSubmit}
    />
  );
};

export default FormContainer;
