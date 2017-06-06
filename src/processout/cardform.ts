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
         * Whether or not the form is only used to refresh a card CVC
         * @var {boolean}
         */
        protected refreshCVC: boolean;

        /**
         * DOM element which contains our card inputs
         * @var {HTMLFormElement}
         */
        protected element: HTMLElement;

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
         * CardForm constructor.
         * @param {ProcessOut} instance
         */
        public constructor(instance: ProcessOut, el: HTMLElement) {
            this.instance = instance;
            this.element = el;
        }

        /**
         * Setup prepares the generic card form. Expects the card fields 
         * for the number, cvc and expiration fields. Both a general expiration 
         * field or separate fields for month and year can be provided
         * @param {CardFieldOptions} options
         * @param {callback} success
         * @param {callback} error
         * @param {callback} event
         * @return {CardForm}
         */
        public setup(options: CardFieldOptions,
            success:        (form: CardForm)  => void,
            error:          (err:  Exception) => void): CardForm {

            var numberReady   = false;
            var cvcReady      = false;
            var expMonthReady = false;
            var expYearReady  = false;

            // Our handler to check everytime we receive a ready state we got
            // all of them
            var ev = function() {
                if (numberReady && cvcReady && expMonthReady && expYearReady) {
                    // Let's put our auto formatting in place
                    this.number.setNext(function() {
                        if (this.exp)       this.exp.focus();
                        if (this.expMonth)  this.expMonth.focus();
                    }.bind(this));
                    if (this.exp) {
                        this.exp.setNext(function() {
                            if (this.cvc) this.cvc.focus();
                        }.bind(this));
                    }

                    // All values are fetched
                    success(this);
                    return;
                }
            }.bind(this);

            this.number = new CardField(this.instance, new CardFieldOptions(CardField.number).apply(options),
                <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-number]"), 
                function() {
                    numberReady = true; ev();
                }, error);
            var cvcEl = this.element.querySelector("[data-processout-input=cc-cvc]");
            if (cvcEl) {
                this.cvc = new CardField(this.instance, new CardFieldOptions(CardField.cvc).apply(options),
                <HTMLInputElement>cvcEl,
                function() {
                    cvcReady = true; ev();
                }, error);
            } else {
                cvcReady = true;
            }
            var expEl = this.element.querySelector("[data-processout-input=cc-exp]");
            if (expEl) {
                this.exp = new CardField(this.instance, new CardFieldOptions(CardField.expiry).apply(options),
                    <HTMLInputElement>expEl,
                function() {
                    expMonthReady = true; expYearReady = true; ev();
                }, error);
            } else {
                this.expMonth = new CardField(this.instance, new CardFieldOptions(CardField.expiryMonth).apply(options),
                    <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-exp-month]"),
                function() {
                    expMonthReady = true; ev();
                }, error);
                this.expYear = new CardField(this.instance, new CardFieldOptions(CardField.expiryYear).apply(options),
                    <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-exp-year]"),
                function() {
                    expYearReady = true; ev();
                }, error);
            }

            return this;
        }

        /**
         * Setup prepares the generic card form. Expects the card fields 
         * for the number, cvc and expiration fields. Both a general expiration 
         * field or separate fields for month and year can be provided
         * @param {HTMLElement} form
         * @param {callback} success
         * @param {callback} error
         * @param {callback} event
         * @return {CardForm}
         */
        public setupCVC(options: CardFieldOptions,
            success:        (form: CardForm)  => void,
            error:          (err:  Exception) => void,
            eventCallback?: (name: string, data: any) => void): CardForm {

            this.refreshCVC = true;

            this.cvc = new CardField(this.instance, new CardFieldOptions(CardField.cvc).apply(options),
                <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-cvc]"), 
                function() {
                    success(this);
                }.bind(this), error);

            return this;
        }

        /**
         * getElement returns the element used to warp the form
         * @return {HTMLElement}
         */
        public getElement(): HTMLElement {
            return this.element;
        }

        /**
         * addEventListener bubbles the call back to the element wrapping
         * the form
         * @param type 
         * @param listener 
         * @param useCapture 
         */
        public addEventListener(type, listener, useCapture) {
            return this.element.addEventListener(type, listener, useCapture);
        }

        /**
         * on is an alias of addEventListener
         * @param type 
         * @param listener 
         * @param useCapture 
         */
        public on(type, listener, useCapture) {
            return this.element.addEventListener(type, listener, useCapture);
        }

        /**
         * getNumberField returns the field handling the card number
         * @return {CardField}
         */
        public getNumberField(): CardField {
            return this.number;
        }

        /**
         * getCVCField returns the field handling the card CVC code
         * @return {CardField}
         */
        public getCVCField(): CardField {
            return this.cvc;
        }

        /** 
         * getExpiryField returns the field handling the card expiration date
         * @return {CardField}
         */
        public getExpiryField(): CardField {
            return this.exp;
        }

        /**
         * getExpiryMonthField returns the field handling the card expiration 
         * month
         * @return {CardField}
         */
        public getExpiryMonthField(): CardField {
            return this.expMonth;
        }

        /**
         * getExpiryYearField returns the field handling the card expiration
         * year
         * @return {CardField}
         */
        public getExpiryYearField(): CardField {
            return this.expYear;
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

            if (this.refreshCVC) {
                // We only want to check the CVC field
                this.cvc.validate(function() {
                    success();
                }, error);

                return;
            }

            // Let's setup the value booleans
            var number   = false;
            var cvc      = false;
            var expMonth = false;
            var expYear  = false;

            // Our handler to check everytime we receive a validation we got
            // all of them
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
                                expMonth: string, expYear: string) => void,
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
                    success(number, cvc, expMonth, expYear);
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
