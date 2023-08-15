import { GatewayUiDataType } from '../../../payments';
import Form from '../../components/Form';

type PropsType = {
  gatewayConfiguration: GatewayUiDataType;
};

const FormContainer = ({ gatewayConfiguration }: PropsType) => {
  return <Form data={gatewayConfiguration} />;
};

export default FormContainer;
