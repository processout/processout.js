import styled, { useTheme } from 'styled-components';

type StyledButtonProps = {
  background: string;
};

const StyledButton = styled.button<StyledButtonProps>`
  width: 200px;
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: ${(props) => props.background};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s;

  &:hover {
    background-color: #dd7047;
  }
`;

type PropsType = {
  text: string;
  onClick?(): void;
};

const Button = ({ text, onClick }: PropsType) => {
  const theme = useTheme();

  return (
    <StyledButton onClick={onClick} background={theme.colors.primaryColor}>
      {text}
    </StyledButton>
  );
};

export default Button;
