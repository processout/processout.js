import { styled, useTheme } from 'styled-components';

type PropsType = {
  children: React.ReactElement | React.ReactElement[];
};

type StyledContainerProps = {
  background: string;
};

const StyledContainer = styled.div<StyledContainerProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.background};
`;

const Container = ({ children }: PropsType) => {
  const theme = useTheme();

  return (
    <StyledContainer background={theme.colors.backgroundColor}>
      {children}
    </StyledContainer>
  );
};

export default Container;
