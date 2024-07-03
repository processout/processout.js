/// <reference path="../references.ts" />

const dynamicStyles = `
* {
  box-sizing: border-box;
}

.payment-method {
  position: relative;
  text-align: center;
  background-color: rgba(255, 255, 255, 1);
  border-radius: 4px;
  border: 1px solid #dde0e3;
  display: flex;
  padding: 4px;
  cursor: pointer;
}

.payment-method:hover {
  border: 1px solid #7d7f81;
}

.hosted-payment-page {
  background-color: white;
  border-radius: 4px;
  border: 1px solid #edeeef;
  max-width: 320px;
  padding: 20px;
  margin: 0 auto;
  margin-top: 20px;
  margin-bottom: 200px;
  width: 100%;

  .express-checkout {
    border: 1px solid #dde0e3;
    gap: 8px;
    display: flex;
    flex-direction: column;
    padding: 20px 10px 10px;
    position: relative;
    margin-bottom: 20px;
    border-radius: 4px;

    .title {
      position: absolute;
      top: -11px;
      font-size: 14px;
      left: 72px;
      background-color: white;
      padding: 0 10px;
    }
  }

  .direct-checkout {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.pay-button {
  min-height: 40px;
  border-radius: 4px;
}

.or {
  position: relative;
  text-align: center;
  padding: 20px 0;

  .divider {
    height: 1px;
    background-color: #ccd1d6;
    width: 100%;
    position: absolute;
    top: 50%;
  }
}

.card-payment {

  .input-group {
    width: 100%;
    margin-bottom: 16px;
  }

  .input-row {
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }

  .input-label {
    margin-bottom: 8px;
    font-size: 14px;
  }

  .input {
    height: 40px;
    border-radius: 4px;
    border: 1px solid #CCD1D6;
    padding: 12px 16px;
    box-shadow: none;
  }
}

.cta-pay {
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

[data-processout-input],
input {
  height: 40px;
  border-radius: 4px;
  border: 1px solid #CCD1D6;
  padding: 12px 16px;
  box-shadow: none;
  width: 100%;
}
:-moz-placeholder,
::-moz-placeholder,
::-webkit-input-placeholder,
:-ms-input-placeholder {
  color: #eceff1;
  opacity: 1;
}

input::placeholder {
  color: #eceff1;
  opacity: 1;
}
`
