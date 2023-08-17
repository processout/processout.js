import { ThemeProvider } from '../modules/widget-theme';
import { PaymentDataProvider } from '../modules/payment-data';
import { ApiDataProvider } from '../modules/api-data';

type AppProvidersPropsType = {
  children: React.ReactElement;
};

const AppProviders = ({ children }: AppProvidersPropsType) => (
  <ThemeProvider>
    <PaymentDataProvider>
      <ApiDataProvider>{children}</ApiDataProvider>
    </PaymentDataProvider>
  </ThemeProvider>
);

export default AppProviders;
