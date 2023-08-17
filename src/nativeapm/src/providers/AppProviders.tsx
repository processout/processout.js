import { ThemeProvider } from '../modules/widget-theme';
import { PaymentDataProvider } from '../modules/payment-data';
import { ApiDataProvider } from '../modules/api-data';
import { PrefilledDataProvider } from '../modules/prefilled-data';

type AppProvidersPropsType = {
  children: React.ReactElement;
};

const AppProviders = ({ children }: AppProvidersPropsType) => (
  <ThemeProvider>
    <PrefilledDataProvider>
      <PaymentDataProvider>
        <ApiDataProvider>{children}</ApiDataProvider>
      </PaymentDataProvider>
    </PrefilledDataProvider>
  </ThemeProvider>
);

export default AppProviders;
