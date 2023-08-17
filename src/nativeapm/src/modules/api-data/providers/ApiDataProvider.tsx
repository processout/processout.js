import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

type ApiDataProviderPropsType = {
  children: React.ReactElement | React.ReactElement[];
};

const ApiDataProvider = ({ children }: ApiDataProviderPropsType) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export default ApiDataProvider;
