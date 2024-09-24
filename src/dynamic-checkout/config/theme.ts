/// <reference path="../references.ts" />

const dynamicStyles = `

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .dco-wrapper * {
    box-sizing: border-box;
  }

  .dco-wrapper {
    background-color: white;
    min-width: 320px;
    padding: 20px;
    margin: 0 auto;
    width: 100%;
  }

  .dco-express-checkout {
    position: relative;
    border: 1px solid #dde0e3;
    gap: 12px;
    display: flex;
    flex-direction: column;
    padding: 20px 10px 10px;
    position: relative;
    margin-bottom: 20px;
    border-radius: 4px;
  }

  .dco-express-checkout-title {
    position: absolute;
    font-size: 14px;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 0 10px;
  }


  .dco-direct-checkout {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dco-payment-method {
    position: relative;
    text-align: center;
    background-color: rgba(255, 255, 255, 1);
    border-radius: 4px;
    border: 1px solid #dde0e3;
    display: flex;
    justify-content: center;
    padding: 10px;
    cursor: pointer;
    flex-wrap: wrap;
    transition: all .3s;
  }

  .dco-payment-method--regular {
    justify-content: flex-start;
    align-items: center;
    color: rgba(91, 101, 118, 1);
  }

  .dco-payment-method-apm-message {
    width: 100%;
    text-align: left;
    font-size: 12px;
    margin-top: 5px;
  }

  .dco-payment-method-logo {
    height: 30px;
    width: 30px;
    margin-right: 10px;
  }

  .dco-payment-method-label {
    font-size: 14px;
  }

  .dco-payment-method:hover {
    border: 1px solid #7d7f81;
  }

  .dco-card-form-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dco-pay-button {
  position: relative;
    min-height: 40px;
    border-radius: 4px;
  }


  .dco-billing-address-section {
    margin-top: 20px;
  }

  .dco-card-form-section-header {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 15px;
    display: block;
  }

  .dco-card-payment-input-group {
    width: 100%;
    margin-bottom: 16px;
  }

  .dco-card-payment-input-row {
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }

  .dco-save-card-checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .dco-save-card-checkbox-input { 
    width:18px;
    height: 18px;
    background:white;
    border-radius:5px;
    border:2px solid #dde0e3;
  }

  .dco-card-payment-input-label {
    margin-bottom: 8px;
    font-size: 14px;
  }

  .dco-save-card-checkbox-label {
    font-size: 14px;
    margin: 0;
  }

  .dco-cta-pay {
    position: relative;
    border-radius: 4px;
    background-color: #242C38;
    color: white;
    width: 100%;
    height: 40px;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 32px;
    cursor: pointer;
  }

  .dco-cta-back, .native-apm-back-button {
    border-radius: 4px;
    width: 100%;
    height: 40px;
    font-size: 14px;
    margin-top: 16px;
    background-color: transparent;
    color: #242C38;
    border: 1px solid #242C38;
    cursor: pointer;
  }

  .native-apm-back-button {
    margin-top: 0;
  }

  .dco-card-form-input,
  .native-apm-select-input, .native-apm-text-input {
    height: 40px !important;
    border-radius: 4px !important;
    border: 1px solid #CCD1D6 !important;
    box-shadow: none;
    padding: 8px !important;
    width: 100%;
    display: flex;
    align-items: center;
    font-size: 14px !important; 
  }

  :-moz-placeholder,
  ::-moz-placeholder,
  ::-webkit-input-placeholder,
  :-ms-input-placeholder {
    color: #eceff1;
    opacity: 1;
  }

  .dco-card-form-input::placeholder {
    color: #eceff1;
    opacity: 1;
  }

  .native-apm-spinner {
    width: 40px !important;
    height: 40px !important; 
    border-bottom-color: #242C38 !important;
  }

  .native-apm-message {
    text-align: center;
    font-size: 14px !important;
  }

  .native-apm-button {
    width: 100% !important;
    height: 40px !important;
    font-size: 14px !important;
    background-color: #242C38 !important;
    color: white !important;
  }

  .dco-card-pay-spinner {
    width: 1rem;
    height: 1rem; 
    border: 3px solid #546073;
    border-bottom-color: white;
    border-radius: 50%;
    animation: rotation 1s linear infinite;
  }
  .native-apm-input-error {
    font-size: 14px !important;
  }

  .native-apm-input-label, .native-apm-input-label {
    font-size: 14px !important; 
  }

  .native-apm-numeric-input {
    display: flex !important;;
    justify-content: space-between !important;;
  }

  .native-apm-numeric-input-character {
    height: 40px !important;
    width: 100% !important;
    font-size: 14px !important;
    padding: 0 !important;
    border-radius: 4px !important;
    border: 1px solid #CCD1D6 !important;
  }

  .native-apm-payment-provider-logo {
    width: 50% !important;
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
    width: 50%;
    margin-top: 1.3rem;
  }

  .dco-card-payment-success-text {
    display: block;
    text-align: center;
    font-size: 14px;
  }

  .dco-card-payment-error-text {
    text-align: center;
    font-size: 14px !important;
  }

  .dco-card-form-error-message {
    font-size: 12px;
    color: red;
    margin-top: 3px;
  }

  .dco-error-view {
    text-align: center;
    font-size: 14px;
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
`;
