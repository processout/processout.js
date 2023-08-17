import { ThemeProvider } from '../modules/widget-theme';
import { PaymentDataProvider } from '../modules/api-data';

type AppProvidersPropsType = {
  children: React.ReactElement;
};

const AppProviders = ({ children }: AppProvidersPropsType) => (
  <PaymentDataProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </PaymentDataProvider>
);

export default AppProviders;
