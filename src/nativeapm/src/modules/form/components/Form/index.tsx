import { styled } from 'styled-components';
import { Button } from '../../../../components';
import Input from '../Input';

export type FormDataType = {
  gateway: {
    name: string;
    message: string;
    logo: string;
  };
  inputs: Array<{
    key: string;
    name: string;
    type: string;
    validation: {
      required: boolean;
      length: number | null;
    };
  }>;
  button: {
    text: string;
  };
};

type PropsType = {
  data: FormDataType;
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
