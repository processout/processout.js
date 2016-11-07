/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * Card form class
     */
    export class CardForm {
        /**
         * ProcessOut instance
         * @var {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * Number card field
         * @var {CardField}
         */
        protected number: CardField;

        /**
         * CVC card field
         * @var {CardField}
         */
        protected cvc: CardField;

        /**
         * Expiry card field
         * @var {CardField}
         */
        protected exp: CardField;

        /**
         * Expiry month card field
         * @var {CardField}
         */
        protected expMonth: CardField;

        /**
         * Expiry year card field
         * @var {CardField}
         */
        protected expYear: CardField;
        
        /**
         * CardForm constructor. Expects the card fields for the number, cvc
         * and expiration fields. Both a general expiration field or separate
         * fields for month and year can be provided
         * @param {ProcessOut} instance
         * @param {CardField} number
         * @param {callback} success
         * @param {callback} error
         */
        public constructor(instance: ProcessOut, form: HTMLElement,
            success: (form: CardForm) => void, 
            error:   (err: Exception) => void) {

            this.instance = instance;

            var numberReady   = false;
            var cvcReady      = false;
            var expMonthReady = false;
            var expYearReady  = false;

            // Our handler to check everytime we receive a ready state we got
            // all of them
            var t = this;
            var ev = function() {
                if (numberReady && cvcReady && expMonthReady && expYearReady) {
                    // All values are fetched
                    success(t);
                    return;
                }
            }

            this.number = new CardField(this.instance, CardField.number,
                <HTMLInputElement>form.querySelector("[data-processout-input=cc-number]"), 
                function() {
                    numberReady = true; ev();
                }, error);
            var cvcEl = form.querySelector("[data-processout-input=cc-cvc]");
            if (cvcEl) {
                this.cvc = new CardField(this.instance, CardField.cvc,
                <HTMLInputElement>cvcEl,
                function() {
                    cvcReady = true; ev();
                }, error);
            } else {
                cvcReady = true;
            }
            var expEl = form.querySelector("[data-processout-input=cc-exp]");
            if (expEl) {
                this.exp = new CardField(this.instance, CardField.expiry,
                    <HTMLInputElement>expEl,
                function() {
                    expMonthReady = true; expYearReady = true; ev();
                }, error);
            } else {
                this.expMonth = new CardField(this.instance, CardField.expiryMonth,
                    <HTMLInputElement>form.querySelector("[data-processout-input=cc-exp-month]"),
                function() {
                    expMonthReady = true; ev();
                }, error);
                this.expYear = new CardField(this.instance, CardField.expiryYear,
                    <HTMLInputElement>form.querySelector("[data-processout-input=cc-exp-year]"),
                function() {
                    expYearReady = true; ev();
                }, error);
            }
        }

        /**
         * Validate validates the card form and calls error if any validation
         * error were found
         * @param {callback} success
         * @param {callback} error
         * @return {void}
         */
        public validate(success: ()               => void,
                        error:   (err: Exception) => void): void {

            // Let's setup the value booleans
            var number   = false;
            var cvc      = false;
            var expMonth = false;
            var expYear  = false;

            // Our handler to check everytime we receive a validation we got
            // all of them
            var t = this;
            var ev = function() {
                if (number && cvc && expMonth && expYear) {
                    // All values are validated
                    success();
                }
            }

            // And let's finally validate everything
            this.number.validate(function() {
                number = true; ev();
            }, error);
            // The cvc is optional
            if (this.cvc)
                this.cvc.validate(function() {
                    cvc = true; ev();
                }, error);
            else
                cvc = true;
            if (this.exp) {
                this.exp.validate(function() {
                    expMonth = true; expYear  = true; ev();
                }, error);
            } else {
                this.expMonth.validate(function() {
                    expMonth = true; ev();
                }, error);
                this.expYear.validate(function() {
                    expYear = true; ev();
                }, error);
            }
        }

        /**
         * FetchValues will fetch the values of all the inputs of the CardForm
         * and call the callback function. If the values couldn't be fetched
         * after the defined timeout, the error callback is executed
         * @param {Callback} success
         * @param {Callback} error
         * @return {void}
         */
        public fetchValues(success: (number: string, cvc: string, 
                                expMonth: string, expYear: string,
                                metadata: any) => void,
                            error: (err: Exception) => void): void {

            // Let's setup the values we want to fetch
            var number:   string = null;
            var cvc:      string = null;
            var expMonth: string = null;
            var expYear:  string = null;

            // Our handler to check everytime we receive a value if we have
            // all of them
            var ev = function() {
                if (number != null && cvc != null && 
                    expMonth != null && expYear != null) {

                    // All values are fetched
                    success(number, cvc, expMonth, expYear, {});
                    return;
                }
            }

            // And let's finally fetch everything
            this.number.value(function(val: CardFieldValue): void {
                number = val.number; ev();
            }, error);
            if (this.cvc) {
                this.cvc.value(function(val: CardFieldValue): void {
                    cvc = val.cvc; ev();
                }, error);
            } else {
                cvc = "";
            }
            if (this.exp) {
                this.exp.value(function(val: CardFieldValue): void {
                    expMonth = val.expiryMonth; expYear = val.expiryYear; ev();
                }, error);
            } else {
                this.expMonth.value(function(val: CardFieldValue): void {
                    expMonth = val.expiryMonth; ev();
                }, error);
                this.expYear.value(function(val: CardFieldValue): void {
                    expYear = val.expiryYear; ev();
                }, error);
            }
        }
    }
}
