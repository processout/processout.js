import * as React from 'react';
import { AvailableConfigTypes, useConfig } from '../../config';

type PaymentDataType = {
  invoiceId?: string;
  gatewayConfigurationId?: string;
};

const defaultPaymentData = {
  invoiceId: undefined,
  gatewayConfigurationId: undefined,
};

const PaymentDataContext =
  React.createContext<PaymentDataType>(defaultPaymentData);

type PropsType = {
  children: React.ReactElement;
};

const PaymentDataProvider = ({ children }: PropsType) => {
  const paymentData = useConfig<PaymentDataType>({
    configType: AvailableConfigTypes.Payment,
    initialConfig: defaultPaymentData,
  });

  return (
    <PaymentDataContext.Provider value={paymentData}>
      {children}
    </PaymentDataContext.Provider>
  );
};

export default PaymentDataProvider;
