/// <reference path="../references.ts" />

const defaultStyles = `
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  input,input::placeholder {
    font-family: inherit;
  }

  .native-apm-select-input, .native-apm-text-input {
    height: 40px !important;
    border-radius: 4px !important;
    border: 1px solid #CCD1D6 !important;
    box-shadow: none;
    padding: 8px !important;
    width: 100%;
    display: flex;
    align-items: center;
    font-size: 1rem !important;
  }

  .native-apm-spinner {
    width: 40px !important;
    height: 40px !important; 
    border-color: #dedede !important;
    border-bottom-color: #242C38 !important;
  }

  .native-apm-message {
    text-align: center;
    font-size: 1rem !important;
  }

  .native-apm-button {
    width: 100% !important;
    height: 40px !important;
    font-size: 0.9rem !important;
  }

  .native-apm-input-error {
    font-size: 1rem !important;
  }

  .native-apm-input-label, .native-apm-input-label {
    font-size: 1rem !important; 
  }

  .native-apm-numeric-input {
    display: flex !important;
    justify-content: flex-start !important;
    gap: 10px !important;
  }

  .native-apm-payment-provider-logo {
    display: none !important;
  }

  .native-apm-numeric-input-character {
    height: 40px !important;
    width: 40px !important;
    font-size: 1rem !important;
    padding: 0 !important;
    border-radius: 4px !important;
    border: 1px solid #CCD1D6 !important;
    background-color: #fff !important;
  }

  .native-apm-payment-provider-logo {
    width: 50% !important;
  }

  .native-apm-input-error {
    font-size: 0.9rem !important;
    color: #e74c3c !important;
  }

  #button-loading-spinner {
    width: 18px !important;
    height: 18px !important;
  }

  .dco-card-payment-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .dco-card-payment-success-image {
    display: block;
    width: 120px;
    height: 120px;
  }

  .dco-card-payment-success-text {
    font-weight: 500;
    font-size: 1.2rem;
    display: block;
    text-align: center;
  }

  apple-pay-button {
    --apple-pay-button-width: 100%;
    --apple-pay-button-height: 40px;
    --apple-pay-button-border-radius: 4px;
    --apple-pay-button-padding: 5px;
    --apple-pay-button-box-sizing: border-box;

    display: initial;
  }

  #apple-pay-button-container {
    display: none;
  }

  #apple-pay-button-container.visible {
    display: block;
  }

  .dco-wallet-checkout {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dco-payment-methods-wrapper * {
    box-sizing: border-box;
  }

  .dco-payment-methods-wrapper {
    min-width: 320px;
    padding: 20px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  .dco-express-checkout-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .dco-express-checkout-payment-methods-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid #dde0e3;
    border-radius: 4px;
    overflow: hidden;
  }

  .dco-express-checkout-header {
    font-weight: 500;
  }

  .dco-wallet-checkout-wrapper {
    display: flex;
    width: 100%;
    gap: 10px;
  }

  .dco-wallet-checkout-button {
   flex: 1;
  }

  .dco-regular-express-checkout-wrapper {
    display: flex;
    gap: 10px;
  }

  .dco-regular-payment-methods-section-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dco-regular-payment-methods-section-header {
    font-weight: 500;
  }

  .dco-regular-payment-methods-list-wrapper {
    display: flex;
    flex-direction: column;
    border: 1px solid #dde0e3;
    border-radius: 4px;
    overflow: hidden;
  }

  .dco-payment-method-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 10px;
    width: 100%;
    border-bottom: 1px solid #dde0e3;
    cursor: pointer;
  }

  .dco-payment-method-wrapper:has(input[type="radio"]:checked) {
    background-color: #F6F6F7;
  }

  .dco-payment-method-wrapper:has(input[type="radio"]:checked) .dco-payment-method-button-general-children-container {
    display: block;
  }

  .dco-payment-method-button-general-children-container {
    display: none;
  }

  .dco-payment-method-wrapper:last-child {
    border-bottom: none;
  }

  .dco-payment-method-button-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 10px;
  }

  .dco-payment-method-button-info {
    display: flex;
    gap: 10px;
    align-items: center;
    font-weight: 500;
  }

  .dco-payment-method-button-info-logo {
    width: 48px;
    height: 48px;
  }

  .dco-payment-method-button-right-content-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dco-payment-method-button-children-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dco-payment-method-button-message-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .dco-payment-method-button-message-img {
    width: 40px;
    height: 40px;
  }

  .dco-payment-method-button-message-text {
    font-size: 0.9rem;
  }


  .dco-payment-method-button-pay-button {
    width: 100%;
    font-size: 0.9rem;
    height: 40px;
    border-radius: 4px;
    background-color: #242C38;
    color: white;
    border: none;
    cursor: pointer;
  }

  .dco-payment-method-button-save-for-future-wrapper {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: -10px;
  }

  .dco-payment-method-button-save-for-future-checkbox {
    width: 16px;
    height: 16px;
  }

  .dco-payment-method-button-save-for-future-label {
    font-size: 0.9rem;
    color: #696F79;
  }

  .dco-native-apm-payment-method-wrapper {
    width: 100%;
    display: flex;
    min-height: 150px;
    align-items: center;
  }

  .dco-payment-method-card-form-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dco-payment-method-card-form-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .dco-payment-method-card-form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dco-payment-method-card-form-section-title {
    font-weight: 500;
  }

  .dco-payment-method-card-form-input {
    height: 40px;
    border-radius: 4px;
    border: 1px solid #dde0e3;
    background-color: #fff;
    padding: 8px;
    width: 100%;
  }

  .dco-payment-method-card-form-input:placeholder {
    color: #c2c2c2;
  }

  .dco-payment-method-card-form-section-inputs-wrapper {
    display: flex;
    gap: 10px;
    flex-direction: column;
  }

  .dco-payment-method-card-form-input-cardholder-name {
    border: 1px solid #dde0e3;
    border-radius: 4px;
  }

  .dco-payment-method-card-form-split-card-input-row {
    display: flex;
    gap: 10px;
  }

  .dco-payment-method-card-form-billing-address-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dco-payment-method-card-form-input-error-message {
    font-size: 0.9rem;
    color: #e74c3c;
  }

  .dco-payment-method-card-form-billing-address-fields-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dco-payment-method-card-available-card-providers {
    display: flex;
    gap: 5px;
  }

  .dco-payment-method-card-available-card-provider {
    width: 24px;
    height: 24px;
  }

  .dco-card-payment-error-text {
    text-align: center;
  }

  .dco-payment-method-button-pay-button-spinner {
    width: 18px;
    height: 18px;
    border: 3px solid #f2f2f2;
    border-bottom-color: #7e57c2;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }
`;
