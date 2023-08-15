import styled from 'styled-components';

type PropsType = {
  src: string;
};

const StyledLogo = styled.img`
  width: 150px;
`;

const Logo = ({ src }: PropsType) => {
  return <StyledLogo src={src} />;
};

export default Logo;
