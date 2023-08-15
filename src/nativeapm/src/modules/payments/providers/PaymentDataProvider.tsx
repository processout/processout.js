import * as React from 'react';

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
  const [paymentData, setPaymentData] =
    React.useState<PaymentDataType>(defaultPaymentData);

  React.useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.payment) {
        setPaymentData(event.data.payment);
      }
    });
  }, []);

  return (
    <PaymentDataContext.Provider value={paymentData}>
      {children}
    </PaymentDataContext.Provider>
  );
};

export default PaymentDataProvider;
