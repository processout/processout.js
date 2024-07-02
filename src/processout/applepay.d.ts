interface ApplePayPaymentRequest {
  total: {
    label: string;
    amount: string;
  };
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  billingContact?: any;
  shippingContact?: any;
  shippingMethods?: any;
  shippingType?: any;
  requiredBillingContactFields?: any;
  requiredShippingContactFields?: any;
  merchantCertificateId?: string;
  merchantApplePayCertificateId?: string;
}
interface ApplePayCheckAvailabilityRequest {
  merchantApplePayCertificateId?: string;
}
declare enum ApplePayStatusCodes {
  // The requested action succeeded.
  STATUS_SUCCESS = 1,
  // The requested action failed.
  STATUS_FAILURE,
  // The billing address is not valid.
  STATUS_INVALID_BILLING_POSTAL_ADDRESS,
  // The shipping address is not valid.
  STATUS_INVALID_SHIPPING_POSTAL_ADDRESS,
  // The shipping contact information is not valid.
  STATUS_INVALID_SHIPPING_CONTACT,
  // The required PIN information was not provided. Cards on the China Union Pay payment network may require a PIN to authenticate the transaction.
  STATUS_PIN_REQUIRED,
  // The PIN information is not valid.Cards on the China Union Pay network may require a PIN.
  STATUS_PIN_INCORRECT,
  // The maximum number of tries for a PIN has been reached and the user has been locked out. Cards on the China Union Pay network may require a PIN.
  STATUS_PIN_LOCKOUT,
}
interface ApplePayPayload {
  merchantIdentifier: string;
  domainName: string;
  displayName: string;
}
declare class ApplePaySession {
  constructor(version: number, request: ApplePayPaymentRequest);
  static canMakePayments(): boolean;
  static canMakePaymentsWithActiveCard(merchantIdentifier: string): boolean;
  static supportsVersion(version: number): boolean;
  completeMerchantValidation(merchantSession: any): void;
  abort(): void;
  begin(): void;
  completePayment(status: ApplePayStatusCodes): void;
  completePaymentMethodSelection(newTotal: any, newLineItems: any): void;
  completeShippingContactSelection(
    status: ApplePayStatusCodes,
    newShippingMethods: any,
    newTotal: any,
    newLineItems: any
  ): void;
  completeShippingMethodSelection(
    status: ApplePayStatusCodes,
    newTotal: any,
    newLineItems: any
  ): void;
  onvalidatemerchant: (event: any) => void;
  onpaymentauthorized: (event: any) => void;
  oncancel: (event: any) => void;
  onpaymentmethodselected: (event: any) => void;
  onshippingcontactselected: (event: any) => void;
  onshippingmethodselected: (event: any) => void;
}
