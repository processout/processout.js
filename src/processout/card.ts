/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * Expiry class, mainly used in the Card class
     */
    export class Expiry {
        protected month: number;
        protected year:  number;

        constructor(month: number, year: number) {
            this.month = month;
            this.year  = year;

            if (this.year < 2000) {
                this.year += 2000;
            }
        }

        public static parse(exp: string): Expiry {
            var exps = exp.split(" / ");
            if (exps.length <= 1) {
                exps = exp.split("/");

                if (exps.length <= 1)
                    return null;
            }

            return new Expiry(Number(exps[0]), Number(exps[1]));
        }

        public getMonth(): number {
            return this.month;
        }

        public getYear(): number {
            return this.year;
        }

        public string(): string {
            return this.month + "/" + this.year;
        }

        public static formatExpiry(exp: string): string {
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
        protected number: string;
        protected expiry: Expiry;
        protected cvc:    string;

        constructor(number: string, expiry: Expiry, cvc: string) {
            this.number = number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, "");
            this.cvc    = cvc;
            this.expiry = expiry;
        }

        public getNumber(): string {
            return this.number;
        }

        public getExpiry(): Expiry {
            return this.expiry;
        }

        public getCVC(): string {
            return this.cvc;
        }

        /**
         * formatNumber formats a card number
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
         * luhn does a basic luhn check on the card number
         */
        protected static luhn(cardNo) {
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
         */
        public setExpiry(exp: Expiry): void {
            this.expiry = exp;
        }

        /**
         * validate validates a credit card details
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
    }
}
