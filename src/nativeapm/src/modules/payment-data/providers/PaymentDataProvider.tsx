import * as React from 'react';
import { AvailableConfigTypes, useConfig } from '../../widget-config';

type PaymentDataType = {
  invoiceId: string;
  gatewayConfigurationId: string;
};

const defaultPaymentData = {
  invoiceId: '',
  gatewayConfigurationId: '',
};

export const PaymentDataContext =
  React.createContext<PaymentDataType>(defaultPaymentData);

type PropsType = {
  children: React.ReactElement;
};

const PaymentDataProvider = ({ children }: PropsType) => {
  const paymentData = useConfig<PaymentDataType>({
    configType: AvailableConfigTypes.Payment,
    initialConfig: defaultPaymentData,
  });

  if (
    !paymentData.invoiceId.length ||
    !paymentData.gatewayConfigurationId.length
  ) {
    return null;
  }

  return (
    <PaymentDataContext.Provider value={paymentData}>
      {children}
    </PaymentDataContext.Provider>
  );
};

export default PaymentDataProvider;
