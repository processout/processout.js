import { ThemeProvider } from '../modules/theme';
import { PaymentDataProvider } from '../modules/payments';

type AppProvidersPropsType = {
  children: React.ReactElement;
};

const AppProviders = ({ children }: AppProvidersPropsType) => (
  <PaymentDataProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </PaymentDataProvider>
);

export default AppProviders;
