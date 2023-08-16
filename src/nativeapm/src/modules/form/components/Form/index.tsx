import { styled } from 'styled-components';
import { Button } from '../../../../components';
import Input from '../Input';
import { GatewayUiDataType } from '../../../payments';

type PropsType = {
  data: GatewayUiDataType;
  onSubmit(e: React.FormEvent): void;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledButtonWrapper = styled.div`
  margin: 30px auto 0 auto;
`;

const Form = ({ data, onSubmit }: PropsType) => {
  return (
    <StyledForm onSubmit={onSubmit}>
      {data.inputs.map((input) => (
        <Input {...input} />
      ))}
      <StyledButtonWrapper>
        <Button text={data.button.text} />
      </StyledButtonWrapper>
    </StyledForm>
  );
};

export default Form;
