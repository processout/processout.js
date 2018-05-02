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
                    return new Expiry(0, 0);
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
            // First validate the string
            var allowed = "1234567890 /";
            var str = "";
            for (var i = 0; i < exp.length; i++) {
                if (allowed.indexOf(exp[i]) === -1)
                    continue;
                str += exp[i];
            }

            if (str.length == 2)
                return str + " / ";

            if (str.length == 4)
                return str.slice(0, -3);

            return str;
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
            var format = Card.getCardFormat(Card.getIIN(number));
            number = Card.parseNumber(number);

            var formatted = "";
            var currentBlock = 0;
            var currentBlockChar = 0;
            for (var i = 0; i < number.length; i++) {
                if (isNaN(<any> number[i])) continue;

                if (currentBlockChar >= format[currentBlock]) {
                    currentBlock++;
                    currentBlockChar = 0;

                    // If we're past our final block, we shouldn't accept
                    // more characters
                    if (currentBlock >= format.length) break;

                    formatted += " ";
                }

                formatted += number[i];
                currentBlockChar++;
            }

            return formatted;
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
            number = Card.parseNumber(number); // Remove potential spaces

            if (number.length < 12)
                return new Exception("card.invalid-number");

            if (!Card.luhn(number))
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
            number = Card.parseNumber(number); // Remove potential spaces

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
            number = Card.parseNumber(number); // Remove potential spaces

            var l = number.length;
            if (l > 4)
                 l = 4;

            return number.substr(number.length - l);
        }

        /**
         * autoFormatNumber automatically formats the number field and 
         * calls next when the input is done
         * @param {HTMLInputElement} number 
         * @param {callback} next 
         * @return {void}
         */
        public static autoFormatNumber(number: HTMLInputElement, next?: () => void): void {
            var lastLen = 0;
            number.addEventListener("input", function(e) {
                var field = <HTMLInputElement>this;
                // We want to keep the cursor position when possible
                var cursor = field.selectionStart; var l = field.value.length;
                field.value = Card.formatNumber(field.value);
                if (cursor && cursor < l) {
                    field.setSelectionRange(cursor, cursor);
                    if (cursor > 0 && field.value[cursor - 1] == " " && l > lastLen)
                        field.setSelectionRange(cursor+1, cursor+1);
                }

                var cardLength = Card.getPossibleCardLength(Card.getIIN(field.value));
                if (next && l > lastLen && Card.parseNumber(field.value).length == cardLength[1])
                    next();

                lastLen = l;
            });
        }

        /**
         * autoFormatNumber automatically formats the expiry field and calls 
         * next when the input is done
         * @param {HTMLInputElement} exp 
         * @param {callback} next 
         * @return {void}
         */
        public static autoFormatExpiry(exp: HTMLInputElement, next?: () => void): void {
            var lastLen = 0;
            exp.addEventListener("input", function(e) {
                var field = <HTMLInputElement>this;
                // We want to keep the cursor position when possible
                var cursor = field.selectionStart; var l = field.value.length;
                var formatted = Expiry.format(field.value);
                if (formatted.length > 7)
                    return;
                field.value = formatted;
                if (cursor && cursor < l) {
                    field.setSelectionRange(cursor, cursor);
                    if (cursor > 0 && field.value[cursor - 1] == " " && l > lastLen)
                        field.setSelectionRange(cursor+1, cursor+1);
                }

                if (next && l > lastLen && field.value.length == 7)
                    next();

                lastLen = l;
            });
        }

        /**
         * getCardFormat returns the most likely card format for the given
         * iin, in the format of a slice of numbers. The card should be 
         * formatted by packs of numbers, represented by the slice
         * @param {string} iin
         * @return Array<number>
         */
        public static getCardFormat(iin: string): Array<number> {
            var schemes = Card.getPossibleSchemes(iin);
            if (schemes.length == 1 && schemes[0] == "american-express")
                return [4, 6, 5];

            return [4, 4, 4, 4, 4];
        }

        /**
         * getPossibleCardLength returns an array of the possible card length,
         * with the first value being the minimum length and the 2nd the max
         * @param {string} iin
         * @return {Array<number>}
         */
        public static getPossibleCardLength(iin: string): Array<number> {
            const actualMin = 12; const actualMax = 19;
            var minLength = actualMax, maxLength = actualMin;
            var schemes = Card.getPossibleSchemes(iin);
            for (var i = 0; i < schemes.length; i++) {
                switch (schemes[i]) {
                case "visa":
                    minLength = Math.min(minLength, 13);
                    maxLength = Math.max(maxLength, 19);
                    break;
                case "mastercard":
                case "instapayment":
                case "jcb":
                case "cardguard ead bg ils":
                case "elo":
                case "hipercard":
                    minLength = Math.min(minLength, 16);
                    maxLength = Math.max(maxLength, 16);
                    break;
                case "american-express":
                case "uatp":
                    minLength = Math.min(minLength, 15);
                    maxLength = Math.max(maxLength, 15);
                    break;
                case "diners-club":
                    minLength = Math.min(minLength, 14);
                    maxLength = Math.max(maxLength, 16);
                    break;
                case "union-pay":
                case "discover":
                case "interpayment":
                case "dankort":
                case "naranja":
                case "cabal":
                case "argencard":
                    minLength = Math.min(minLength, 16);
                    maxLength = Math.max(maxLength, 19);
                    break;
                case "maestro":
                    minLength = Math.min(minLength, 12);
                    maxLength = Math.max(maxLength, 19);
                    break;
                }
            }

            // Fail-safe in case we didn't correctly support a card scheme
            // in the above switch
            if (minLength > maxLength) {
                minLength = actualMin;
                maxLength = actualMax;
            }

            return [minLength, maxLength];
        }

        /**
         * getPossibleSchemes returns an array of possible schemes for the
         * card iin (or start of its IIN).
         * @param {string} iin
         * @return {Array<string>}
         */
        public static getPossibleSchemes(iin: string): Array<string> {
            iin = Card.parseNumber(iin); // Remove potential spaces

            // Schemes is our list of possible schemes with their iin matching
            // ranges
            var schemes = {
                "visa":                 ["4"],
                "mastercard":           ["22", "23", "24", "25", "26", "27", "51", "52", "53", "54", "55"],
                "american-express":     ["34", "37"],
                "union-pay":            ["62"],
                "diners-club":          ["300", "301", "302", "303", "304", "305", "309", "36", "38", "39"],
                "discover":             ["6011", "62", "64", "65"],
                "interpayment":         ["636"],
                "instapayment":         ["637", "638", "639"],
                "jcb":                  ["35"],
                "maestro":              ["50", "56", "57", "58", "59", "6"],
                "dankort":              ["5019", "4175", "4571"],
                "uatp":                 ["1"],
                "cardguard ead bg ils": ["5392"],
                "hipercard":            ["606282"],
                "elo":                  ["401178","401179","438935","451416","457632","457393","431274","438935","457631","457632",
                    "506699","50670","50671","50672","50673","50674","50675","50676","506770","506771","506772","506773","506774",
                    "506775","506776","506777","506778","504175","509",
                    "627780","636297","636368","651652","651653","651654","651655","651656","651657","651658","651659","65166","65167",
                    "650031","650032","650033","650035","650036","650037","650038","650039","65004","650050","650051","65500","65501",
                    "650485","650486","650487","650488","650489","65049","65050","65051","65052","650530","650531","650532","650533",
                    "650534","650535","650536","650537","650538","650541","650542","650543","650544","650545","650546","650547",
                    "650548","650549","65055","65056","65057","65058","650590","650591","650592","650593","650594","650595","650596",
                    "650597","650598","65070","650710","650711","650712","650713","650714","650715","650716","650717","650718","650720",
                    "650721","650722","650723","650724","650725","650726","650727","655021","655022","655023","655024","655025","655026",
                    "655027","655028","655029","65503","65504","655050","655051","655052","655053","655054","655055","655056","655057",
                    "655058","650901","650902","650903","650904","650905","650906","650907","650908","650909","65091","65092","65093",
                    "65094","65095","65096","650970","650971","650972","650973","650974","650975","650976","650977","650978","650405",
                    "650406","650407","650408","650409","65041","65042","65043"],
                "naranja":   ["377798", "377799", "402917", "402918", "527571", "527572", "589562"],
                "cabal":     ["589657", "600691", "603522", "6042", "6043", "636908"],
                "argencard": ["501105"]
            };

            var matches = new Array<string>();
            for (let scheme in schemes) {
                var options = schemes[scheme];
                for (let optionKey in options) {
                    var option = options[optionKey];
                    var l = (iin.length > option.length) ? option.length : iin.length;
                    if (iin.substring(0, l) == option.substring(0, l)) {
                        matches.push(scheme);
                        break;
                    }
                }
            }

            return matches;
        }
    }
}
