import * as React from 'react';
import { AvailableConfigTypes, useConfig } from '../../widget-config';

type PaymentDataType = {
  invoiceId: string;
  gatewayConfigurationId: string;
};

const defaultPaymentData = {
  invoiceId: 'iv_MoGID2FQe0YO7M1xwFwnn2Y36IPN8bHF',
  gatewayConfigurationId: 'gway_conf_2puMFv3iwrPSLqslIfVcvzhFWZzmTHTy',
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
    !paymentData.gatewayConfigurationId.length ||
    !paymentData.invoiceId.length
  ) {
    throw new Error(
      'You need to provide a valid gatewayConfigurationId and invoiceId'
    );
  }

  return (
    <PaymentDataContext.Provider value={paymentData}>
      {children}
    </PaymentDataContext.Provider>
  );
};

export default PaymentDataProvider;
