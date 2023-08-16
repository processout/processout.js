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

type PropsType = {
  label: string;
};

const Input = React.forwardRef<HTMLInputElement, PropsType>(
  (props: PropsType, ref) => {
    const { label, ...field } = props;

    return (
      <StyledInputWrapper>
        <StyledInputLabel>{label}</StyledInputLabel>
        <StyledInput ref={ref} {...field} />
      </StyledInputWrapper>
    );
  }
);

export default Input;
