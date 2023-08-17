import Form from '../../components/Form';
import { GatewayUiDataType, useGatewayConfiguration } from '../../../api-data';
import { usePrefilledData } from '../../../prefilled-data';
import { useViewsStore } from '../../../views-manager';

const FormContainer = () => {
  const prefilledData = usePrefilledData();
  const { gatewayConfiguration, isLoading } = useGatewayConfiguration();
  const { goToPendingState } = useViewsStore();

  const onSubmit = () => {
    goToPendingState();
  };

  if (isLoading) {
    return 'Loading...';
  }

  if (Object.keys(gatewayConfiguration).length === 0) {
    return null;
  }

  return (
    <Form
      data={gatewayConfiguration as GatewayUiDataType}
      prefilledData={prefilledData}
      onSubmit={onSubmit}
    />
  );
};

export default FormContainer;
