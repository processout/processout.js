/// <reference path="../references.ts" />

// TODO: Implement Google Pay logic
module ProcessOut {
  export class GooglePayClient {
    private initializeGooglePay(configuration: Googlepay): void {
      const baseRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: configuration.allowed_auth_methods,
              allowedCardNetworks: configuration.allowed_card_networks,
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "example",
                gatewayMerchantId: "exampleGatewayMerchantId",
              },
            },
          },
        ],
      };

      let paymentsClient = null;

      function getGooglePaymentsClient() {
        if (paymentsClient === null) {
          //@ts-ignore // TODO: fill with merchant configuration
          paymentsClient = new google.payments.api.PaymentsClient({
            environment: "TEST",
          });
        }
        return paymentsClient;
      }

      function onGooglePayLoaded() {
        const paymentsClient = getGooglePaymentsClient();
        paymentsClient
          .isReadyToPay(baseRequest)
          .then(function (response) {
            if (response.result) {
              addGooglePayButton();
            }
          })
          .catch(function (err) {
            console.error("Error checking Google Pay readiness:", err);
          });
      }

      function addGooglePayButton() {
        const container = document.getElementById(
          "google-pay-button-container"
        );
        if (!container) {
          console.error("Container element not found.");
          return;
        }

        const paymentsClient = getGooglePaymentsClient();
        const button = paymentsClient.createButton({
          onClick: onGooglePaymentButtonClicked,
          buttonSizeMode: "fill",
        });
        container.appendChild(button);
      }

      function onGooglePaymentButtonClicked() {
        const paymentDataRequest = {
          ...baseRequest,
          // TODO: fill with invoice details
          transactionInfo: {
            countryCode: "US",
            currencyCode: "USD",
            totalPriceStatus: "FINAL",
            totalPrice: "1.00",
          },
        };

        const paymentsClient = getGooglePaymentsClient();
        paymentsClient
          .loadPaymentData(paymentDataRequest)
          .then(function (paymentData) {
            processPayment(paymentData);
          })
          .catch(function (err) {
            console.error("Error loading payment data:", err);
          });
      }

      function processPayment(paymentData) {
        console.log("Google Pay payment data:", paymentData);
      }

      onGooglePayLoaded();
    }
  }
}
