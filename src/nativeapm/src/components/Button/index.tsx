import styled from 'styled-components';

const StyledButton = styled.button`
  width: 200px;
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: coral;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s;

  &:hover {
    background-color: #dd7047;
  }
`;

const Button = () => {
  return <StyledButton>Button</StyledButton>;
};

export default Button;
