/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

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
            this.year  = year;

            if (this.year < 2000) {
                this.year += 2000;
            }
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
         */
        protected expiry: Expiry;

        /**
         * CVC is the CVC of the card
         */
        protected cvc: string;

        /**
         * Constructor of the card class
         */
        constructor(number: string, expiry: Expiry, cvc: string) {
            this.number = number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, "");
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
         * setExpiry sets the expiry date of the card
         * @param {Expiry} exp
         * @return {void}
         */
        public setExpiry(exp: Expiry): void {
            this.expiry = exp;
        }

        /**
         * validate validates a credit card details
         * @return {string}
         */
        public validate(): string {
            if (this.number.length != 16)
                return "card.invalid-number";

            if (!Card.luhn(Number(this.number)))
                return "card.invalid-number";

            if (this.expiry == null)
                return "card.invalid-date";

            if (this.expiry.getMonth() > 12 || this.expiry.getMonth() < 0)
                return "card.invalid-month";

            var date = new Date();
            if (this.expiry.getYear() < date.getFullYear())
                return "card.invalid-year";

            if (this.expiry.getMonth() < date.getMonth() && this.expiry.getYear() == date.getFullYear())
                return "card.invalid-date";

            if (this.cvc.length > 4)
                return "card.invalid-cvc";

            return null;
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
