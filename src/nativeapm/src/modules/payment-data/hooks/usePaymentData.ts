import * as React from 'react';
import { PaymentDataContext } from '../providers';

const usePaymentData = () => {
  const paymentData = React.useContext(PaymentDataContext);

  if (!paymentData) {
    throw new Error('usePaymentData must be used within a PaymentDataProvider');
  }

  return paymentData;
};

export default usePaymentData;
