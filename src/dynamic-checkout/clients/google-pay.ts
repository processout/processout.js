/// <reference path="../references.ts" />

module ProcessOut {
  export class GooglePayClient {
    libraryUrl = "https://pay.google.com/gp/p/js/pay.js";

    processOutInstance: ProcessOut;
    googleClient: any;
    isReadyToPayRequest: any;
    paymentRequest: any;


    constructor(processOutInstance: ProcessOut) {
      this.processOutInstance = processOutInstance;
    }

    public loadButton(buttonContainer: HTMLElement, getViewContainer: () => HTMLElement, invoiceData: Invoice) {
      const googleClientScript = document.createElement("script");

      googleClientScript.src = this.libraryUrl;
      
      googleClientScript.onload = () => {
        this.googleClient = window.globalThis && window.globalThis.google
          ? new window.globalThis.google.payments.api.PaymentsClient({environment: 'TEST'})
          : null;

        this.initizalizeGooglePay(buttonContainer, getViewContainer, invoiceData);
      };

      document.head.appendChild(googleClientScript);
    }

    private initizalizeGooglePay(buttonContainer: HTMLElement, getViewContainer: () => HTMLElement, invoiceData: Invoice) {
      this.prepareIsReadyToPayRequest(invoiceData);
      this.preparePaymentRequest(invoiceData);

      this.googleClient.isReadyToPay(this.isReadyToPayRequest)
        .then((response) => {
          if (response.result) {
            const button = this.googleClient.createButton({
              buttonColor: 'default',
              buttonType: 'plain',
              buttonRadius: 4,
              buttonSizeMode: 'fill',
              onClick: () => this.makePayment(invoiceData, getViewContainer),
            });

            buttonContainer.appendChild(button);
          }
        })
        .catch(function(err) {
          DynamicCheckoutEventsUtils.dispatchGooglePayLoadError(err);
        });
    }

    private makePayment(invoiceData: Invoice, getViewContainer: () => HTMLElement) {
      this.googleClient.loadPaymentData(this.paymentRequest)
        .then((paymentData) => {
          const paymentToken = new PaymentToken(
            TokenType.GooglePay,
            JSON.parse(paymentData.paymentMethodData.tokenizationData.token)
          );

          const processOutInstance = this.processOutInstance;
          const getPaymentAuthorizeSuccessHtml = this.getPaymentAuthorizeSuccessHtml;
          
          processOutInstance.tokenize(
            paymentToken,
            {},
            function (token) {
              DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(
                token
              );

              processOutInstance.makeCardPayment(
                invoiceData.id,
                token,
                {
                  authorize_only: true
                },
                function (invoiceId) {
                  getViewContainer().innerHTML = getPaymentAuthorizeSuccessHtml();

                  DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent({
                    invoiceId,
                    returnUrl: invoiceData.return_url,
                  });
                },
                function (err) {
                  getViewContainer().innerHTML = `
                    <div class="dco-card-payment-error-text">
                      Something went wrong. Please try again.
                    </div>
                  `;

                  DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
                }
              )
            },
            function (err) {
              getViewContainer().innerHTML = `
                <div class="dco-card-payment-error-text">
                  Something went wrong. Please try again.
                </div>
              `;
  
              DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent({
                message: `Tokenize payment error: ${JSON.stringify(
                  err,
                  undefined,
                  2
                )}`,
              });
            }
          )
        })
        .catch((err) => {
          DynamicCheckoutEventsUtils.dispatchGooglePayLoadError(err);
        });
    }

    private prepareIsReadyToPayRequest(invoiceData: Invoice) {
      const googlePayMethod = this.getGooglePayMethodData(invoiceData);

      if (!googlePayMethod) {
        return;
      }

      this.isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: googlePayMethod.googlepay.allowed_auth_methods,
            allowedCardNetworks: googlePayMethod.googlepay.allowed_card_networks
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: googlePayMethod.googlepay.gateway,
              gatewayMerchantId: googlePayMethod.googlepay.gateway_merchant_id
            }
          }
        }]
      }
    }

    private preparePaymentRequest(invoiceData: Invoice) {
      const googlePayMethod = this.getGooglePayMethodData(invoiceData);

      if (!googlePayMethod) {
        return;
      }

      this.paymentRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: googlePayMethod.googlepay.allowed_auth_methods,
            allowedCardNetworks: googlePayMethod.googlepay.allowed_card_networks
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: googlePayMethod.googlepay.gateway,
              gatewayMerchantId: googlePayMethod.googlepay.gateway_merchant_id
            }
          }
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: invoiceData.amount,
          currencyCode: invoiceData.currency,
        },
        merchantInfo: {
          merchantName: invoiceData.name,
        }
      }
    }

    private getGooglePayMethodData(invoiceData: Invoice) {
      let googlePayMethod;

      invoiceData.payment_methods.forEach((paymentMethod) => {
        if (paymentMethod.type === 'googlepay') {
          googlePayMethod = paymentMethod;
        }
      });

      return googlePayMethod;
    }

    private getPaymentAuthorizeSuccessHtml() {
      return `
        <div class="dco-card-payment-success">
          <p class="dco-card-payment-success-text">Success! Payment authorized.</p>
          <img class="dco-card-payment-success-image" src="https://js.processout.com/images/native-apm-assets/payment_success_image.svg" />
        </div>
      `;
    }
  }
}
