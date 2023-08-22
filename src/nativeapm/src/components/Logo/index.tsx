import styled from 'styled-components';

type PropsType = {
  src: string;
};

const StyledLogo = styled.img`
  width: 150px;
  height: 30px;
`;

const Logo = ({ src, ...props }: PropsType) => {
  return <StyledLogo src={src} {...props} />;
};

export default Logo;
