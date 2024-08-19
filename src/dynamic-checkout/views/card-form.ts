/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutCardFormView {
    processOutInstance: ProcessOut;
    paymentConfig: DynamicCheckoutPaymentConfigType;
    selectedCountry: string;
    unitsHtmlMap = {
      street: `
       <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">Address line 1</div>
            <input class="dco-card-form-input" id="dco-card-form-address1" placeholder="Address line 1"></input>
          </div>
        </div>
        <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">Address line 2</div>
            <input class="dco-card-form-input" placeholder="Address line 2" id="dco-card-form-address2"></input>
          </div>
        </div>`,
      city: `
          <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">City</div>
            <input class="dco-card-form-input" placeholder="City" id="dco-card-form-city"></input>
          </div>
        </div>
        `,
      postcode: `
         <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">Postal code</div>
            <input class="dco-card-form-input" placeholder="Postal code" id="dco-card-form-postalcode"></input>
          </div>
        </div>`,
      state: `
        <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">State</div>
            <input class="dco-card-form-input" placeholder="State" id="dco-card-form-state"></input>
          </div>
        </div>`,
      stateSelect(states: { name: string; abbreviation: string }[]) {
        return `
          <div class="dco-card-payment-input-row">
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">State</div>
              <select class="dco-card-form-input" name="state-select" id="dco-card-form-state">
                ${states
                  .map(
                    (state) =>
                      `<option value="${state.abbreviation}">${state.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
        `;
      },
    };

    constructor(
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.processOutInstance = processOutInstance;
      this.paymentConfig = paymentConfig;
    }

    private setupCardFormOptions(): CardFieldOptions {
      const cardPaymentMethod = this.getCardPaymentMethod();
      const options = new CardFieldOptions("");

      options.style = {
        fontSize: "14px",
        //@ts-ignore
        "::placeholder": {
          color: "#ECEFF1",
        },
      };

      options.placeholder = "";
      options.expiryAutoNext = false;
      options.cardNumberAutoNext = true;
      options.requireCVC =
        cardPaymentMethod && cardPaymentMethod.card.require_cvc;

      return options;
    }

    private setupCardEventListeners(container: HTMLElement) {
      const selectInput = document.getElementById("dco-countries-input");

      if (!selectInput) {
        return;
      }

      selectInput.addEventListener("change", (e) => {
        const selectedCountry = (e.target as HTMLSelectElement).value;
        container.querySelector(
          "#dco-billing-address-dynamic-fields"
        ).innerHTML = this.getDynamicBillingAddressFieldsHtml(selectedCountry);
      });
    }

    private getBillingAddressValues() {
      let billingAddressValues: {
        address1?: string;
        address2?: string;
        city?: string;
        country_code?: string;
        state?: string;
        zip?: string;
      } = {};

      const streetElement1 = document.getElementById(
        "dco-card-form-address1"
      ) as HTMLInputElement | null;
      const streetElement2 = document.getElementById(
        "dco-card-form-address1"
      ) as HTMLInputElement | null;
      const cityElement = document.getElementById(
        "dco-card-form-city"
      ) as HTMLInputElement | null;
      const countryElement = document.getElementById(
        "dco-countries-input"
      ) as HTMLInputElement | null;
      const stateElement = document.getElementById(
        "dco-card-form-state"
      ) as HTMLInputElement | null;
      const postalCodeElement = document.getElementById(
        "dco-card-form-postalcode"
      ) as HTMLInputElement | null;

      if (streetElement1 && streetElement1.value.length) {
        billingAddressValues.address1 = streetElement1.value;
      }

      if (streetElement2 && streetElement2.value.length) {
        billingAddressValues.address2 = streetElement2.value;
      }

      if (cityElement && cityElement.value.length) {
        billingAddressValues.city = cityElement.value;
      }

      if (countryElement && countryElement.value.length) {
        billingAddressValues.country_code = countryElement.value;
      }

      if (stateElement && stateElement.value.length) {
        billingAddressValues.state = stateElement.value;
      }

      if (postalCodeElement && postalCodeElement.value.length) {
        billingAddressValues.zip = postalCodeElement.value;
      }

      return billingAddressValues;
    }

    public setupCardForm(container: HTMLElement): void {
      container.innerHTML = this.getCardPaymentHtml();

      this.setupCardEventListeners(container);

      const cardOptions = this.setupCardFormOptions();

      const procesoutInstance = this.processOutInstance;
      const paymentConfig = this.paymentConfig
      const getBillingAddress = this.getBillingAddressValues.bind(this);
      const getCardSuccessHtml = this.getCardAuthorizeSuccessHtml.bind(this);

      procesoutInstance.setupForm(
        container,
        cardOptions,
        function (form) {
          form.addEventListener("submit", function (e) {
            e.preventDefault();
            const nameElement = document.getElementById(
              "dco-card-form-name"
            ) as HTMLInputElement | null;

            procesoutInstance.tokenize(
              form,
              {
                name: nameElement ? nameElement.value : "",
                contact: getBillingAddress(),
              },
              function (token) {
                DynamicCheckoutEventsUtils.dispatchTokenizePaymentSuccessEvent(
                  token
                );

                const reqOptions = {
                  authorize_only: true
                }

                const saveCardCheckbox = document.querySelector("#save-card-checkbox") as HTMLInputElement | null;

                if (saveCardCheckbox) {
                  reqOptions["save_source"] = saveCardCheckbox.checked;
                } 

                procesoutInstance.makeCardPayment(
                  paymentConfig.invoiceId,
                  token,
                  reqOptions,
                  function (invoiceId) {
                    container.innerHTML = getCardSuccessHtml();

                    DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(
                      invoiceId
                    );
                  },
                  function (err) {
                    container.innerHTML = `
                      <div class="dco-card-payment-error-text">
                        Something went wrong. Please try again.
                      </div>
                    `;

                    DynamicCheckoutEventsUtils.dispatchPaymentErrorEvent(err);
                  },
                  {
                    clientSecret: paymentConfig.clientSecret,
                  }
                );
              },
              function (err) {
                DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent({
                  message: `Tokenize payment error: ${JSON.stringify(
                    err,
                    undefined,
                    2
                  )}`,
                });
              }
            );

            return false;
          });
        },
        function (err) {
          console.log({ err });
        }
      );
    }

    private getCountryOptions() {
      const cardPaymentMethod = this.getCardPaymentMethod();

      const restrictToCountries = cardPaymentMethod
        ? cardPaymentMethod.card.billing_address.restrict_to_country_codes
        : [];

      let countryOptions = "";

      const countries = Object.keys(billingAddressConfig).map(
        (countryCode) => ({
          value: countryCode,
          label: billingAddressConfig[countryCode].name,
        })
      );

      let filteredCountries = [];

      if (restrictToCountries) {
        countries.forEach((country) => {
          restrictToCountries.forEach((restrictedCountry) => {
            if (restrictedCountry === country.value) {
              filteredCountries.push(country);
            }
          });
        });
      }

      const countriesToUse =
        filteredCountries.length > 0 ? filteredCountries : countries;

      countriesToUse.forEach((country) => {
        countryOptions += `<option class="dco-select-country-option" value="${country.value}">${country.label}</option>`;
      });

      return countryOptions;
    }

    private getDynamicBillingAddressFieldsHtml(country: string) {
      let dynamicBillingAddressFieldsHtml = "";
      const cardPaymentMethod = this.getCardPaymentMethod();

      const shouldCollectPostalCodeForAutomaticMode =
        country === "US" || country === "CA" || country === "GB";

      if (
        cardPaymentMethod &&
        cardPaymentMethod.card.billing_address.collection_mode ===
          "automatic" &&
        shouldCollectPostalCodeForAutomaticMode
      ) {
        return `
         <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">Postal code</div>
            <input class="dco-card-form-input" placeholder="Postal code" id="dco-card-form-postalcode></input>
          </div>
        </div>`;
      }

      if (
        cardPaymentMethod &&
        cardPaymentMethod.card.billing_address.collection_mode !==
          "automatic" &&
        billingAddressConfig[country]
      ) {
        billingAddressConfig[country].units.forEach((unit) => {
          if (unit === "state" && billingAddressConfig[country].states) {
            dynamicBillingAddressFieldsHtml += this.unitsHtmlMap.stateSelect(
              billingAddressConfig[country].states
            );
            return;
          }

          dynamicBillingAddressFieldsHtml += this.unitsHtmlMap[unit];
        });
      }

      return dynamicBillingAddressFieldsHtml;
    }

    private getCardBillingAddressHtml(): string {
      const cardPaymentMethod = this.getCardPaymentMethod();
      const countriesHtml = this.getCountryOptions();

      if (
        cardPaymentMethod &&
        cardPaymentMethod.card.billing_address.collection_mode === "never"
      ) {
        return "";
      }

      if (
        cardPaymentMethod &&
        cardPaymentMethod.card.billing_address.collection_mode === "automatic"
      ) {
        return `
        <div class="dco-billing-address-section">
          <span class="dco-card-form-section-header">Billing address</span>
          <div class="dco-card-payment-input-row">
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">Country</div>
              <select id="dco-countries-input" class="dco-card-form-input" placeholder="Country" name="country">
                ${countriesHtml}
              </select>
            </div>
          </div>
          <div id="dco-billing-address-dynamic-fields"></div>
          </div>
        `;
      }

      return `
        <div class="dco-billing-address-section">
        <span class="dco-card-form-section-header">Billing address</span>
        <div class="dco-card-payment-input-row">
          <div class="dco-card-payment-input-group">
            <div class="dco-card-payment-input-label">Country</div>
            <select id="dco-countries-input" class="dco-card-form-input" placeholder="Poland" name="country">
              ${countriesHtml}
            </select>
          </div>
        </div>
        <div id="dco-billing-address-dynamic-fields"></div>
        </div>
      `;
    }

    private getCardPaymentHtml(): string {
      const cardPaymentMethod = this.getCardPaymentMethod();

      const cvcField =
        cardPaymentMethod && cardPaymentMethod.card.require_cvc
          ? `
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">CVC</div>
              <div class="dco-card-form-input" data-processout-input="cc-cvc" data-processout-placeholder="CVC"></div>
            </div>
          `
          : "";

      const cardHolderNameField =
        cardPaymentMethod && cardPaymentMethod.card.require_cardholder_name
          ? `
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">Cardholder Name</div>
              <input class="dco-card-form-input" type="text" id="dco-card-form-name" placeholder="Cardholder name"/>
            </div>
          `
          : "";

      const cardBillingAddress = this.getCardBillingAddressHtml();
      const amount = this.paymentConfig.invoiceDetails.amount;
      const currency = this.paymentConfig.invoiceDetails.currency;

      const saveCardCheckbox =
        cardPaymentMethod.card.saving_allowed ? `
        <div>
          <input type="checkbox" id="save-card-checkbox" name="saveCard">
          <label for="save-card-checkbox" class="dco-card-payment-input-label">Save card for future use</label>
        </div>
      `
          : "";

      return `
          <span class="dco-card-form-section-header">Payment details</span>
          <form action="" method="POST" id="card-form">
            <div class="dco-card-payment">
                <div class="dco-card-payment-input-group">
                    <div class="dco-card-payment-input-label">Card Number</div>
                    <div class="dco-card-form-input" data-processout-input="cc-number" data-processout-placeholder="0000 0000 0000 0000"></div>
                </div>
                <div class="dco-card-payment-input-row">
                    <div class="dco-card-payment-input-group">
                        <div class="dco-card-payment-input-label">Expiry Date</div>
                        <div class="dco-card-form-input" data-processout-input="cc-exp" data-processout-placeholder="MM/YY"></div>
                    </div>
                    ${cvcField}
                </div>
                ${cardHolderNameField}
                ${cardBillingAddress}
            </div>
            ${saveCardCheckbox}
            <div class="dco-card-form-buttons">
              <button type="submit" class="dco-cta-pay">Pay ${amount} ${currency}</button>
            </div>
          </form>
          `;
    }

    private getCardAuthorizeSuccessHtml() {
      return `
        <div class="dco-card-payment-success">
          <p class="dco-card-payment-success-text">Success! Payment authorized.</p>
          <img class="dco-card-payment-success-image" src="https://js.processout.com/images/native-apm-assets/payment_success_image.svg" />
        </div>
      `;
    }

    private getCardPaymentMethod() {
      let cardPaymentMethod;

      this.paymentConfig.invoiceDetails.payment_methods.forEach(
        (paymentMethod) => {
          if (paymentMethod.type === "card") {
            cardPaymentMethod = paymentMethod;
          }
        }
      );

      return cardPaymentMethod;
    }
  }
}
