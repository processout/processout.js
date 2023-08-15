import { styled } from 'styled-components';

const StyledInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledInputLabel = styled.label``;

const StyledInput = styled.input`
  padding: 10px;
  width: 300px;
  border: 1px solid grey;
  border-radius: 5px;
`;

type PropsType = {
  name: string;
  validation: {
    required: boolean;
    length: number | null;
  };
};

const Input = ({ name, validation }: PropsType) => {
  return (
    <StyledInputWrapper>
      <StyledInputLabel>{name}</StyledInputLabel>
      <StyledInput required={validation.required} />
    </StyledInputWrapper>
  );
};

export default Input;
