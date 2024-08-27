/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutCardFormView {
    processOutInstance: ProcessOut;
    paymentConfig: DynamicCheckoutPaymentConfigType;
    dynamicCheckout: DynamicCheckout;
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
      dynamicCheckout: DynamicCheckout,
      processOutInstance: ProcessOut,
      paymentConfig: DynamicCheckoutPaymentConfigType
    ) {
      this.dynamicCheckout = dynamicCheckout;
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

    public setupCardForm(container: HTMLElement): void {
      container.innerHTML = this.getCardPaymentHtml();

      this.setupCardFormEventListeners(container);

      const cardOptions = this.setupCardFormOptions();

      const procesoutInstance = this.processOutInstance;
      const paymentConfig = this.paymentConfig
      const getBillingAddress = this.getBillingAddressValues.bind(this);
      const getCardSuccessHtml = this.getCardAuthorizeSuccessHtml.bind(this);
      const showFormErrorMessages = this.showFormErrorMessages.bind(this);
      const hideFormErrorMessages = this.hideFormErrorMessages.bind(this);
      const setButtonLoadingState = this.setButtonLoadingState.bind(this);

      procesoutInstance.setupForm(
        container,
        cardOptions,
        function (form) {
          form.addEventListener("submit", function (e) {
            e.preventDefault();
            let nameValid = true;

            const nameElement = document.getElementById(
              "dco-card-form-name"
            ) as HTMLInputElement | null;

            if (nameElement && nameElement.value.length === 0) {
              nameValid = false;
              showFormErrorMessages('card.missing-name')
            }

            form.validate(
              () => {
                if (!nameValid) {
                  return;
                }

                hideFormErrorMessages()
                setButtonLoadingState(true);

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
                        setButtonLoadingState(false);
                        container.innerHTML = getCardSuccessHtml();
    
                        DynamicCheckoutEventsUtils.dispatchPaymentSuccessEvent(
                          invoiceId
                        );
                      },
                      function (err) {
                        setButtonLoadingState(false);
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
                    setButtonLoadingState(false);
                    DynamicCheckoutEventsUtils.dispatchTokenizePaymentErrorEvent({
                      message: `Tokenize payment error: ${JSON.stringify(
                        err,
                        undefined,
                        2
                      )}`,
                    });
                  }
                );
              },
              (err) => {
                setButtonLoadingState(false);
                showFormErrorMessages(err.code)
              }
            )
          });
        },
        function (err) {
          console.log({ err });
        }
      );
    }

    private setButtonLoadingState(loading: boolean) {
      const payButton = document.querySelector(".dco-cta-pay") as HTMLButtonElement;

      if (loading) {
        payButton.innerHTML = this.getCardPaymentSpinnerHtml();
      } else {
        payButton.innerHTML = this.getPayButtonText();
      }
    }

    private showFormErrorMessages(errorCode: string) {
      switch (errorCode) {
        case 'card.invalid-number':
          const cardNumberErrorMessage = document.querySelector(".dco-card-form-error-message-number")
          if (cardNumberErrorMessage) {
            cardNumberErrorMessage.textContent = "Invalid card number"
          }
          break;
        case 'card.invalid-month':
          const cardExpiryErrorMessage = document.querySelector(".dco-card-form-error-message-expiry")
          if (cardExpiryErrorMessage) {
            cardExpiryErrorMessage.textContent = "Invalid expiry date"
          }
          break;
        case 'card.missing-cvc':
          const cardCvcErrorMessage = document.querySelector(".dco-card-form-error-message-cvc")
          if (cardCvcErrorMessage) {
            cardCvcErrorMessage.textContent = "Invalid CVC"
          }
          break;
        case 'card.missing-name':
          const cardNameErrorMessage = document.querySelector(".dco-card-form-error-message-name")
          if (cardNameErrorMessage) {
            cardNameErrorMessage.textContent = "Cardholder name is required"
          }
          break;
        default:
          break;
      }
    }
    private hideFormErrorMessages() {
      const cardNumberErrorMessage = document.querySelector(".dco-card-form-error-message-number")
      if (cardNumberErrorMessage) {
        cardNumberErrorMessage.textContent = ""
      }
      const cardExpiryErrorMessage = document.querySelector(".dco-card-form-error-message-expiry")
      if (cardExpiryErrorMessage) {
        cardExpiryErrorMessage.textContent = ""
      }
      const cardCvcErrorMessage = document.querySelector(".dco-card-form-error-message-cvc")
      if (cardCvcErrorMessage) {
        cardCvcErrorMessage.textContent = ""
      }

      const cardNameErrorMessage = document.querySelector(".dco-card-form-error-message-name")
      if (cardNameErrorMessage) {
        cardNameErrorMessage.textContent = ""
      }
    }

    private setupCardFormEventListeners(container: HTMLElement) {
      const selectInput = document.getElementById("dco-countries-input");
      const backButton = document.querySelector(".dco-cta-back");
      const nameInput = document.getElementById("dco-card-form-name") as HTMLInputElement;

      const hideFormErrorMessages = this.hideFormErrorMessages.bind(this)
      const processOutInstance = this.processOutInstance;

      window.addEventListener('message', (e) => {
        if (e.origin === processOutInstance.endpoint('js', '')) {
          const eventData = e.data ? JSON.parse(e.data) : {};

          if (eventData.action === 'inputEvent') {
            hideFormErrorMessages()
          }
        }
      })

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          hideFormErrorMessages();
        });
      }

      if (backButton) {
        backButton.addEventListener("click", () => {
          this.dynamicCheckout.loadDynamicCheckoutView();
        });
      }

      if (selectInput) {
        selectInput.addEventListener("change", (e) => {
          const selectedCountry = (e.target as HTMLSelectElement).value;
          container.querySelector(
            "#dco-billing-address-dynamic-fields"
          ).innerHTML = this.getDynamicBillingAddressFieldsHtml(selectedCountry);
        });
      }
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

    private getCountryOptions() {
      const cardPaymentMethod = this.getCardPaymentMethod();

      const restrictToCountries = cardPaymentMethod
        ? cardPaymentMethod.card.billing_address.restrict_to_country_codes
        : [];

      let countryOptions = "<option class='dco-select-country-option' disabled selected value=''>Select country</option>";

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

    private getCardPaymentSpinnerHtml(): string {
      return `
        <div class="dco-card-pay-spinner"></div>
      `;
    }

    private getPayButtonText() {
      const amount = this.paymentConfig.invoiceDetails.amount;
      const currency = this.paymentConfig.invoiceDetails.currency;

      return `Pay ${amount} ${currency}`;
    }

    private getCardPaymentHtml(): string {
      const cardPaymentMethod = this.getCardPaymentMethod();

      const cvcField =
        cardPaymentMethod && cardPaymentMethod.card.require_cvc
          ? `
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">CVC</div>
              <div class="dco-card-form-input" data-processout-input="cc-cvc" data-processout-placeholder="CVC"></div>
              <span class="dco-card-form-error-message dco-card-form-error-message-cvc"></span>
            </div>
          `
          : "";

      const cardHolderNameField =
        cardPaymentMethod && cardPaymentMethod.card.require_cardholder_name
          ? `
            <div class="dco-card-payment-input-group">
              <div class="dco-card-payment-input-label">Cardholder Name</div>
              <input class="dco-card-form-input" type="text" id="dco-card-form-name" placeholder="Cardholder name"/>
              <span class="dco-card-form-error-message dco-card-form-error-message-name"></span>
            </div>
          `
          : "";

      const cardBillingAddress = this.getCardBillingAddressHtml();

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
                    <span class="dco-card-form-error-message dco-card-form-error-message-number"></span> 
                </div>
                <div class="dco-card-payment-input-row">
                    <div class="dco-card-payment-input-group">
                      <div class="dco-card-payment-input-label">Expiry Date</div>
                      <div class="dco-card-form-input" data-processout-input="cc-exp" data-processout-placeholder="MM/YY"></div>
                      <span class="dco-card-form-error-message dco-card-form-error-message-expiry"></span>
                    </div>
                    ${cvcField}
                </div>
                ${cardHolderNameField}
                ${cardBillingAddress}
            </div>
            ${saveCardCheckbox}
            <div class="dco-card-form-buttons">
              <button type="submit" class="dco-cta-pay">${this.getPayButtonText()}</button>
              <button type="button" class="dco-cta-back">Back</button>
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
