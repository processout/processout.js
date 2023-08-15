import { ResponseType } from '../../../payments';
import Form from '../../components/Form';
import { uiMapper } from '../../mappers';

type PropsType = {
  gatewayConfiguration: ResponseType;
};

const FormContainer = ({ gatewayConfiguration }: PropsType) => {
  const formData = uiMapper.mapToUI(gatewayConfiguration);

  return <Form data={formData} />;
};

export default FormContainer;
