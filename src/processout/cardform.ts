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
        protected isRefreshCVC: boolean;

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
         * ID of the form
         * @var {string}
         */
        protected uid: string

        /**
         * CardForm constructor.
         * @param {ProcessOut} instance
         */
        public constructor(instance: ProcessOut, el: HTMLElement) {
            this.instance = instance;
            this.element  = el;
            this.uid      = Math.random().toString();
        }

        /**
         * GetUID returns the ID of the form
         * @param {string}
         */
        public getUID(): string {
            return this.uid;
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

            // Our handler to check if, everytime we receive a ready state,
            // we received all of them
            var ev = function(opts: CardFieldOptions) {
                if (numberReady && cvcReady && expMonthReady && expYearReady) {
                    if(opts && opts.cardNumberAutoNext) {
                        this.number.setNext(function() {
                            if (this.exp)       this.exp.focus();
                            if (this.expMonth)  this.expMonth.focus();
                        }.bind(this));
                    }
                    if (this.exp && opts && opts.expiryAutoNext) {
                        this.exp.setNext(function() {
                            if (this.cvc) this.cvc.focus();
                        }.bind(this));
                    }
                    // All values are fetched
                    success(this);
                    return;
                }
            }.bind(this);

            this.number = new CardField(this.instance, this, new CardFieldOptions(CardField.number).apply(options),
                <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-number]"), 
                function() {
                    numberReady = true; ev();
                }, error);
            var cvcEl = this.element.querySelector("[data-processout-input=cc-cvc]");
            if (cvcEl) {
                const opts = new CardFieldOptions(CardField.cvc).apply(options);
                this.cvc = new CardField(this.instance, this, opts,
                <HTMLInputElement>cvcEl,
                function() {
                    cvcReady = true; ev(opts);
                }, error);
            } else {
                cvcReady = true;
            }
            var expEl = this.element.querySelector("[data-processout-input=cc-exp]");
            if (expEl) {
                const opts = new CardFieldOptions(CardField.expiry).apply(options);
                this.exp = new CardField(this.instance, this, opts,
                    <HTMLInputElement>expEl,
                function() {
                    expMonthReady = true; expYearReady = true; ev(opts);
                }, error);
            } else {
                const expiryMonthOpts = new CardFieldOptions(CardField.expiryMonth).apply(options);
                this.expMonth = new CardField(this.instance, this, expiryMonthOpts,
                    <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-exp-month]"),
                function() {
                    expMonthReady = true; ev(expiryMonthOpts);
                }, error);
                const expiryYearOpts = new CardFieldOptions(CardField.expiryYear).apply(options);
                this.expYear = new CardField(this.instance, this, expiryYearOpts,
                    <HTMLInputElement>this.element.querySelector("[data-processout-input=cc-exp-year]"),
                function() {
                    expYearReady = true; ev(expiryYearOpts);
                }, error);
            }

            return this;
        }

        /**
         * Setup prepares the card form specific to CVC refreshes
         * @param {HTMLElement} form
         * @param {callback} success
         * @param {callback} error
         * @return {CardForm}
         */
        public setupCVC(options: CardFieldOptions,
            success:        (form: CardForm)  => void,
            error:          (err:  Exception) => void): CardForm {

            this.isRefreshCVC = true;

            this.cvc = new CardField(this.instance, this, new CardFieldOptions(CardField.cvc).apply(options),
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

            if (this.isRefreshCVC) {
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
         * tokenize tokenizes the cards from the card form fields and calls
         * the success callback with the newly created card token when 
         * successfull. If an error arises, the error callback is called
         * @param {any}      any
         * @param {Callback} success
         * @param {Callback} error
         * @return {void}
         */
        public tokenize(data: any,  success: (token: string)  => void,
                                    error:   (err: Exception) => void): void {

            // Fields are the fields the leader should wait for to tokenize
            var fields = ["number"];
            if (this.cvc)      fields.push("cvc");
            if (this.exp)      fields.push("exp");
            if (this.expMonth) fields.push("exp-month");
            if (this.expYear)  fields.push("exp-year");

            this.number.tokenize(fields, data, success, error);
        }

        /**
         * refreshCVC refreshes the given card CVC and calls the success
         * callback with the card token when successful. If an error arises,
         * the error callback is called
         * @param {string}   cardUID
         * @param {Callback} success
         * @param {Callback} error
         * @return {void}
         */
        public refreshCVC(cardUID: string, success: (token: string)  => void,
                                           error:   (err: Exception) => void): void {

            if (!this.cvc)
                error(new Exception("processout-js.wrong-type-for-action", 
                    "RefreshCVC was called but the form has no CVC field initialized."));

            this.cvc.refreshCVC(cardUID, success, error);
        }
    }
}
