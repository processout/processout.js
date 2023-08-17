import Form from '../../components/Form';
import { useGatewayConfiguration } from '../../../api-data';
import { usePrefilledData } from '../../../prefilled-data';
import { useViewsStore } from '../../../views-manager';

const FormContainer = () => {
  const gatewayConfiguration = useGatewayConfiguration();
  const prefilledData = usePrefilledData();
  const { goToPendingState } = useViewsStore();

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
