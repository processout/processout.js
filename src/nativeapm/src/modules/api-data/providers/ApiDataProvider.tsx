import { QueryClientProvider } from 'react-query';
import { queryClient } from '../clients';

type ApiDataProviderPropsType = {
  children: React.ReactElement | React.ReactElement[];
};

const ApiDataProvider = ({ children }: ApiDataProviderPropsType) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export default ApiDataProvider;
