import { styled } from 'styled-components';

type PropsType = {
  children: React.ReactElement | React.ReactElement[];
};

const StyledContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Container = ({ children }: PropsType) => {
  return <StyledContainer>{children}</StyledContainer>;
};

export default Container;
