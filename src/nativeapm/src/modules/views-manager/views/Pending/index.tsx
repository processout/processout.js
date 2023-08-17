import { useViewsStore } from '../..';
import { Button, Logo, Message } from '../../../../components';
import { GatewayUiDataType, useGatewayConfiguration } from '../../../api-data';
import styled from 'styled-components';

const StyledMessageWrapper = styled.div`
  margin: 20px 0;
`;

const PendingView = () => {
  const { gatewayConfiguration, isLoading } = useGatewayConfiguration();
  const { goBackToFormView } = useViewsStore();

  if (isLoading) {
    return 'Loading...';
  }

  if (Object.keys(gatewayConfiguration).length === 0) {
    return null;
  }

  const configuration = gatewayConfiguration as GatewayUiDataType;

  return (
    <>
      <Logo src={configuration.gateway.logo} />
      <StyledMessageWrapper>
        <Message text={configuration.gateway.message} />
      </StyledMessageWrapper>
      <Button text="Cancel" onClick={goBackToFormView} />
    </>
  );
};

export default PendingView;
