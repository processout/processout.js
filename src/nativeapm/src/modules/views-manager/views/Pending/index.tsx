import { Button, Logo, Message } from '../../../../components';
import { useGatewayConfiguration } from '../../../payments';
import styled from 'styled-components';

const StyledMessageWrapper = styled.div`
  margin: 20px 0;
`;

const PendingView = () => {
  const gatewayConfiguration = useGatewayConfiguration();

  return (
    <>
      <Logo src={gatewayConfiguration.gateway.logo} />
      <StyledMessageWrapper>
        <Message text={gatewayConfiguration.gateway.message} />
      </StyledMessageWrapper>
      <Button text="Cancel" />
    </>
  );
};

export default PendingView;
