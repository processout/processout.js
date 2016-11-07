/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class CardHolder {
        /**
         * Card holder name
         * @var {string}
         */
        public name: string;

        /**
         * Card holder address line 1
         * @var {string}
         */
        public address1: string;

        /**
         * Card holder address line 2
         * @var {string}
         */
        public address2: string;

        /**
         * Card holder city
         * @var {string}
         */
        public city: string;

        /**
         * Card holder state
         * @var {string}
         */
        public state: string;

        /**
         * Card holder zip
         * @var {string}
         */
        public zip: string;

        /**
         * Card holder country
         * @var {string}
         */
        public country: string;
    }

    /**
     * Expiry class, mainly used in the Card class
     */
    export class Expiry {
        /**
         * Month is the expiry month
         */
        protected month: number;

        /**
         * Year is the expiry year
         */
        protected year: number;

        /**
         * Constructor of the Expiry class. Accepts 2 or 4 digits year
         * @param {number} month
         * @param {number} year
         */
        constructor(month: number, year: number) {
            this.month = month;
            this.year  = Expiry.parseYear(year);
        }

        /**
         * Parse parses a date string composed of the month and the year
         * and returns an Expiry object
         * @param {string} exp
         * @return {Expiry}
         */
        public static parse(exp: string): Expiry {
            var exps = exp.split(" / ");
            if (exps.length <= 1) {
                exps = exp.split("/");

                if (exps.length <= 1)
                    return null;
            }

            return new Expiry(Number(exps[0]), Number(exps[1]));
        }

        /**
         * ParseYear parses the given year and makes it a 4 digits year
         * @param {string|number} year
         * @return {number}
         */
        public static parseYear(yearsn: string|number): number {
            var year = Number(yearsn);
            if (year < 2000) {
                year += 2000;
            }

            return year;
        }

        /**
         * getMonth returns the expiry month of the card
         * @return {number}
         */
        public getMonth(): number {
            return this.month;
        }

        /**
         * getYear returns the expiry year of the card
         * @return {number}
         */
        public getYear(): number {
            return this.year;
        }

        /**
         * string converts the expiry object back to its string representation
         * @return {string}
         */
        public string(): string {
            return this.month + " / " + this.year;
        }

        /**
         * Validate validates the card expiry fields
         * @return {Exception}
         */
        public validate(): Exception {
            var err = Expiry.validateMonth(this.getMonth());
            if (err)
                return err;
            
            err = Expiry.validateYear(this.getYear());
            if (err)
                return err;
            
            var date = new Date();
            if (this.getMonth() < date.getMonth() && this.getYear() == date.getFullYear())
                return new Exception("card.invalid-date");
            
            return null;
        }

        /**
         * Format formats an expiry date string
         * @param {string} exp
         * @return {string}
         */
        public static format(exp: string): string {
            if (exp.length == 2)
                return exp + " / ";

            if (exp.length == 4)
                return exp.slice(0, -3);

            return exp;
        }

        /**
         * ValidateMonth validates the month field of the card
         * @param {number} month
         * @return {Exception}
         */
        public static validateMonth(month: number): Exception {
            if (month < 1 || month > 12)
                return new Exception("card.invalid-month");

            return null;
        }

        /**
         * ValidateYear validates the year field of the card
         * @param {number} year
         * @return {Exception}
         */
        public static validateYear(year: number): Exception {
            if (year < 100)
                year += 2000;
            
            var date = new Date();
            if (year < date.getFullYear())
                return new Exception("card.invalid-year");

            return null;
        }
    }

    /**
     * Card class
     */
    export class Card {
        /**
         * Number is the card number
         * @type {string}
         */
        protected number: string;

        /**
         * Expiry is the expiry date of the card stored in an Expiry object
         * @type {string}
         */
        protected expiry: Expiry;

        /**
         * CVC is the CVC of the card
         * @type {string}
         */
        protected cvc: string;

        /**
         * Constructor of the card class
         */
        constructor(number: string, expiry: Expiry, cvc: string) {
            this.number = Card.parseNumber(number);
            this.cvc    = cvc;
            this.expiry = expiry;
        }

        /** 
         * getNumber returns the card number trimmed from all spaces
         * @return {string}
         */
        public getNumber(): string {
            return this.number;
        }

        /**
         * getExpiry returns the expiry date of the card in the Expiry object
         * @return {Expiry}
         */
        public getExpiry(): Expiry {
            return this.expiry;
        }

        /**
         * getCVC returns the CVC of the card
         * @return {string}
         */
        public getCVC(): string {
            return this.cvc;
        }

        /**
         * luhn does a basic luhn check on the card number
         * @param {number} cardNo
         * @return {boolean}
         */
        protected static luhn(cardNo): boolean {
            var s = 0;
            var doubleDigit = false;
            for (var i = cardNo.length - 1; i >= 0; i--) {
                var digit = +cardNo[i];
                if (doubleDigit) {
                    digit *= 2;
                    if (digit > 9)
                        digit -= 9;
                }
                s += digit;
                doubleDigit = !doubleDigit;
            }

            return s % 10 == 0;
        }

        /**
         * validate validates a credit card details
         * @return {Exception}
         */
        public validate(): Exception {
            var err = Card.validateNumber(this.number);
            if (err)
                return err;

            if (this.expiry == null)
                return new Exception("card.invalid-date");

            err = this.expiry.validate();
            if (err)
                return err;

            return Card.validateCVC(this.cvc);
        }

        /**
         * GetIIN returns the IIN of the card number
         * @return {string}
         */
        public getIIN(): string {
            return Card.getIIN(this.number);
        }

        /** 
         * GetLast4Digits returns the last 4 digits of the card number
         * @return {string}
         */
        public getLast4Digits(): string {
            return Card.getLast4Digits(this.number);
        }

        /**
         * formatNumber formats a card number
         * @param {string} number
         * @return {string}
         */
        public static formatNumber(number: string): string {
            var v       = number.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
            var matches = v.match(/\d{4,16}/g);
            var match   = matches && matches[0] || "";
            var parts   = [];

            for (var i = 0; i < match.length; i += 4) {
                parts.push(match.substring(i, i + 4));
            }

            if (!parts.length)
                return number;

            return parts.join(" ");
        }

        /**
         * ParseNumber parses the formatted card number
         * @param {string} number
         * @return {string}
         */
        public static parseNumber(number: string): string {
            return number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, "");
        }

        /**
         * ValidateNumber validates the card number
         * @param {string} number
         * @return {Exception}
         */
        public static validateNumber(number: string): Exception {
            if (number.length < 14)
                return new Exception("card.invalid-number");

            if (!Card.luhn(Number(number)))
                return new Exception("card.invalid-number");

            return null;
        }

        /**
         * ValidateCVC validates the given CVC
         * @param {string} cvc
         * @return {Exception}
         */
        public static validateCVC(cvc: string): Exception {
            if (!cvc)
                return null;

            if (cvc.length < 3)
                return new Exception("card.invalid-cvc");

            return null;
        }

        /**
         * GetIIN returns the IIN of the card
         * @param {string} number
         * @return {string}
         */
        public static getIIN(number: string): string {
            var l = number.length;
            if (l > 6)
                l = 6;
            return number.substring(0, l);
        }

        /**
         * GetLast4Digits returns the last4 digits of the card number
         * @param {string} number
         * @return {string}
         */
        public static getLast4Digits(number: string): string {
            var l = number.length;
            if (l > 4)
                 l = 4;

            return number.substr(number.length - l);
        }

        /**
         * autoFormatFields formats the given number, expiry and cvc fields
         * and updates the focus depending on the state of these fields
         * @param {HTMLInputElement} number
         * @param {HTMLInputElement} expiry
         * @param {HTMLInputElement} cvc
         * @return {void}
         */
        public static autoFormatFields(number: HTMLInputElement,
            expiry: HTMLInputElement, cvc: HTMLInputElement): void {
            
            number.addEventListener("input", function(e) {
                this.value = Card.formatNumber(this.value);
            });
            expiry.addEventListener("input", function(e) {
                this.value = Expiry.format(this.value);

                if (this.value.length >= 7)
                    cvc.focus();
            });
        }
    }
}
