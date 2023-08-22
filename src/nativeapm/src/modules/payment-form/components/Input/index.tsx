import * as React from 'react';
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

const StyledErrorMessage = styled.span`
  color: red;
  height: 1rem;
`;

type PropsType = {
  label: string;
  error?: string;
};

const Input = React.forwardRef<HTMLInputElement, PropsType>(
  (props: PropsType, ref) => {
    const { label, error, ...field } = props;

    return (
      <StyledInputWrapper>
        <StyledInputLabel>{label}</StyledInputLabel>
        <StyledInput ref={ref} {...field} />
        <StyledErrorMessage>{error}</StyledErrorMessage>
      </StyledInputWrapper>
    );
  }
);

export default Input;
