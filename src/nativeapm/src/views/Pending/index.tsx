import { Button, Container, Logo, Message } from '../../components';
import { useGatewayConfiguration } from '../../modules/payments';
import styled from 'styled-components';

const StyledMessageWrapper = styled.div`
  margin: 20px 0;
`;

const PendingView = () => {
  const gatewayConfiguration = useGatewayConfiguration();

  return (
    <Container>
      <Logo src={gatewayConfiguration.gateway.logo} />
      <StyledMessageWrapper>
        <Message text={gatewayConfiguration.gateway.message} />
      </StyledMessageWrapper>
      <Button text="Cancel" />
    </Container>
  );
};

export default PendingView;
