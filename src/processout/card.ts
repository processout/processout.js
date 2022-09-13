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
            }

            var month = Number(exps[0]);
            var year  = 0;
            if (exps.length > 1)
                year = Number(exps[1]);

            return new Expiry(month, year);
        }

        /**
         * ParseMonth parses the given month
         * @param {string|number} monthn
         * @return {number}
         */
        public static parseMonth(monthn: string|number): number {
            var month = Number(monthn);
            if (!month) month = 0;
            return month;
        }

        /**
         * ParseYear parses the given year and makes it a 4 digits year
         * @param {string|number} yearn
         * @return {number}
         */
        public static parseYear(yearn: string|number): number {
            var year = Number(yearn);
            if (!year) year = 0;
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
            return exp
              .replace(
                /\s/g,
                "" // remove whitespace
              )
              .replace(
                /^([1-9]\/|[2-9])$/g,
                "0$1/" // add 0 for digits with invalid months e.g. 3 -> 03/
              )
              .replace(
                /^(0[1-9]|1[0-2])$/g,
                "$1/" // add / automatically e.g. 11 -> 11/
              )
              .replace(
                /^1([3-9])$/g,
                "01/$1" // format month/year if input would be invalid month e.g. 13 -> 01/3
              )
              .replace(
                /^(0[1-9]|1[0-2])([0-9][0-9])$/,
                "$1/$2" // format valid 4 digit numbers to MM/YY e.g. 0535 -> 05/35
              )
              .replace(
                /^0\/|0+$/g,
                "0" // prevent 0/ and double 00 e.g. 0/ -> 0 and 00 -> 0
              )
              .replace(
                /[^\d|^\/]*/g,
                "" // remove any characters that are not digits or `/`
              )
              .replace(
                /\/\//g,
                "/" // prevent entering more than 1 `/`
              )
              .replace(
                /\//g,
                " / " // add spaces either side of `/` i.e. `/` -> ` / `
              );
        }

        /**
         * ValidateMonth validates the month field of the card
         * @param {number} month
         * @return {Exception}
         */
        public static validateMonth(month: number): Exception {
            if (!month || month < 1 || month > 12)
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
            if (!year || year < date.getFullYear())
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
            // Make sure to return a String as IE sometimes detects it as 
            // an object (?)
            return String(number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, ""));
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
            if (cvc && !cvc.match(/^\d{3,4}$/g))
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
            exp.addEventListener("keyup", function(e) {
                const field = <HTMLInputElement>this;
                // We want to keep the cursor position when possible
                const cursor = field.selectionStart;
                const l = field.value.length;

                // if user presses backspace (keyCode = 8) when format is "MM / ", reduce to M
                // length is 4 because the backspace has already occurred at this point in the keyup, so the current
                // format is "MM /"
                let formatted = field.value
                if (e.keyCode === 8 && formatted.length === 4) {
                    formatted = formatted.slice(0, -3)
                }
                formatted = Expiry.format(formatted);

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
                "argencard": ["501105"],

                "carte bancaire": ["49707", "49783", "49771", "45950", "45334", "51336", "49836", "47722", "45721", "54515", "49732", "51345", "45626", "49774", "49734", "49738", "40220", "53253", "56125", "49835", "49715", "58171", "45619", "45954", "49793", "43782", "41506", "49773", "53710", "51338", "53102", "45940", "45627", "49766", "46978", "49720", "45611", "49902", "55700", "49796", "49733", "45930", "55961", "49792", "51348", "52945", "49708", "49726", "45610", "44995", "49739", "41507", "47717", "54985", "58170", "51327", "47260", "45335", "43951", "51365", "43950", "49746", "40100", "45629", "49731", "51810", "45332", "42011", "55420", "42346", "41993", "45333", "49723", "51361", "49719", "45929", "55426", "44244", "51330", "55981", "49752", "45621", "49764", "49755", "51321", "45615", "49765", "51375", "47802", "51372", "49742", "51377", "55886", "49837", "51623", "46983", "49716", "55391", "67759", "45613", "45568", "49758", "46609", "47480", "44841", "45958", "51320", "47729", "51319", "49722", "51317", "49745", "67117", "49797", "51313", "49714", "49704", "47726", "44996", "42012", "49791", "49749", "51341", "41503", "51325", "55980", "46657", "49711", "52948", "51371", "49717", "49838", "51314", "46703", "40355", "51324", "51350", "55892", "53103", "51353", "43783", "55496", "49839", "45612", "45620", "46547", "51316", "49763", "49721", "51379", "49728", "49770", "49776", "51521", "49909", "45616", "52954", "51312", "49901", "45939", "49712", "49775", "45720", "52166", "49735", "46982", "51337", "46361", "51374", "49788", "47961", "49785", "49741", "51385", "46986", "51364", "49795", "51992", "49703", "45937", "51323", "52931", "45617", "49760", "53119", "49709", "49724", "45566", "45623", "52922", "46969", "53506", "51360", "47427", "45560", "40593", "45628", "51357", "41505", "51315", "45337", "52942", "53610", "53611", "40594", "45624", "48651", "51366", "45567", "46896", "40657", "51750", "52933", "49756", "52943", "49790", "54953", "49761", "45056", "48373", "49906", "47809", "54284", "48369", "51332", "55399", "44855", "40223", "49777", "43787", "58175", "41509", "45614", "48160", "51301", "49754", "49753", "45054", "46980", "49737", "52920", "51356", "49713", "49706", "49725", "51390", "49779", "51370", "51318", "47268", "51354", "49750", "51386", "40221", "51367", "49744", "49730", "51373", "45771", "51736", "45745", "53411", "52371", "51300", "43953", "47718", "49748", "58177", "53711", "58176", "52886", "48362", "45330", "44245", "49740", "45622", "46625", "41717", "51302", "44997", "52944", "51369", "49747", "49772", "58178", "49768", "52941", "51363", "51362", "49781", "45618", "53234", "49789", "51326", "49799", "40209", "45331", "49702", "58173", "58174", "49743", "51352", "51311", "45625", "51335", "49905", "49786", "41628", "49798", "58179", "53801", "49767", "45339", "49769", "53250", "51328", "49782", "53410", "58172", "49778", "45051", "49736", "49718", "49900", "49903", "49784", "55397", "46321", "51376", "51331", "49710", "56124", "44853", "49759", "51351", "52949", "53532", "49904", "49787", "51322", "49762", "55888", "51620", "49794", "51355", "45932", "52946", "49780", "49757", "49729", "52947", "51310", "51329", "53502", "49751", "53255", "51378", "51303", "49727", "45933"]
            };

            var matches = new Array<string>();
            for (let scheme in schemes) {
                var options = schemes[scheme];
                for (let optionKey in options) {
                    var option = options[optionKey];
                    var l = (iin.length > option.length) ? option.length : iin.length;
                    if (iin.substring(0, l) == option.toString().substring(0, l)) {
                        matches.push(scheme);
                        break;
                    }
                }
            }

            return matches;
        }
    }
}
