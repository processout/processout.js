import { styled } from 'styled-components';
import { Button } from '../../../../components';
import Input from '../Input';
import { GatewayUiDataType } from '../../../payments';

type PropsType = {
  data: GatewayUiDataType;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledButtonWrapper = styled.div`
  margin: 30px auto 0 auto;
`;

const Form = ({ data }: PropsType) => {
  return (
    <StyledForm>
      {data.inputs.map((input) => (
        <Input {...input} />
      ))}
      <StyledButtonWrapper>
        <Button />
      </StyledButtonWrapper>
    </StyledForm>
  );
};

export default Form;
