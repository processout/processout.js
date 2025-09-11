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
            let dateMonth = date.getMonth() + 1;
            if (this.getMonth() < dateMonth && this.getYear() == date.getFullYear())
                return new Exception("card.invalid-date");

            return null;
        }

        /**
         * Format formats an expiry date string
         * @param {string} exp
         * @return {string}
         */
        public static format(exp: string): string {
            let res = exp

            // only way to have length 4 is if user pressed backspace when at "MM / ". The key event will have taken
            // place by this event being raised, so the current format is "MM /"
            if (res.length === 4) {
                res = res.slice(0, -3) // slice format to just be "M"
            }

            return res
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
                /(\/.*)\//g,
                "$1" // prevent entering more than 1 `/`
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
            const iin = this.getIIN();
            const scheme = Card.getPossibleSchemes(iin)[0];
            const lengths = Card.getPossibleCardLength(iin)
            var err = Card.validateNumber(this.number, lengths);
            if (err)
                return err;

            if (this.expiry == null)
                return new Exception("card.invalid-date");

            err = this.expiry.validate();
            if (err)
                return err;

            return Card.validateCVC(this.cvc, scheme);
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
        public static validateNumber(number: string, limit: number[]): Exception {
            number = Card.parseNumber(number); // Remove potential spaces

            if (number.length < limit[0] || number.length > limit[1])
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
        public static validateCVC(cvc: string, scheme?: string): Exception {
            if(!scheme) {
                if (cvc && !cvc.match(/^\d{3,4}$/g)) {
                    return new Exception("card.invalid-cvc");
                }
            } else {
                if (scheme === 'american-express') {
                    if (cvc && !cvc.match(/^\d{4}$/g)) {
                        return new Exception("card.invalid-cvc");
                    }
                } else {
                    if (cvc && !cvc.match(/^\d{3}$/g)) {
                        return new Exception("card.invalid-cvc");
                    }
                }
            }

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
            let lastLen = 0;
            exp.addEventListener("input", function(e) {
                const field = <HTMLInputElement>this;
                const l = field.value.length;

                field.value = Expiry.format(field.value.substring(0, 7));

                if (next && l > lastLen && field.value && field.value.length == 7)
                    next();

                lastLen = l;
            });
        }

        public static autoFormatCvc(cvc: HTMLInputElement): void {
            cvc.addEventListener("keydown", function (e) {
                const field = <HTMLInputElement>this;

                const isNumericInput = /\d/.test(e.key)

                // only allow numerics - and backspace, delete, arrows etc.
                if (e.key && e.key.length === 1 && !isNumericInput && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    return
                }

                // limit length to 4 - check is numeric input to allow backspace/delete/arrows etc. to pass through
                if (isNumericInput && field.value.length > 3) {
                    e.preventDefault()
                }
            })
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
                    minLength = Math.min(minLength, 16);
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
                "american-express":     ["30", "31", "34", "35", "37"],
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
                "omannet": ["40380", "40402", "40570", "41046", "41329", "41637", "41924", "41929", "42268", "42282", "42637", "43241", "43308", "43323", "43382", "43594", "43742", "44716", "45659", "46001",
                     "46415", "46417", "46442", "46736", "47429", "48379", "48413", "48417", "48909", "51072", "52367", "52866", "53441", "53598", "53602", "53915", "53954", "54216", "54918", "55975", "51572",
                      "53422", "53918", "54913", "40754", "42261", "47382", "40474", "43935", "47245", "43663", "44747", "43347", "47971", "42147", "42136", "40277", "43909"],
                "mada": ["40302", "40613", "40699", "40719", "40739", "40752", "40920", "41062", "41068", "41083", "41256", "41763", "41959", "42013", "42114", "42281", "42833", "42867", "43136", "43232",
                     "43410", "43995", "44053", "44064", "44079", "44246", "44556", "44639", "44640", "44667", "45503", "45570", "45786", "45799", "45845", "46222", "46854", "47449", "48301", "48478", "48609",
                      "48931", "50430", "51321", "52005", "52107", "52413", "52451", "52941", "52974", "53006", "53090", "53109", "53119", "53201", "53582", "53598", "53602", "53776", "54308", "54335", "54976",
                       "55418", "55856", "58526", "58884", "58885", "58898", "58900", "60490", "60514", "22402", "42689", "50696", "52166", "22337", "51613", "51507", "55561", "43126", "43573", "53973", "52494",
                        "49098", "40545", "49246", "44242", "42222", "45501", "40177", "40728", "45488", "44661"],
                "carte bancaire": ["37745", "40158", "40209", "40210", "40223", "40355", "40357", "40575", "40593", "40594", "40657", "41384", "41481", "41505", "41506", "41507", "41628", "41653", "41657",
                     "41717", "42011", "42012", "42140", "42142", "42346", "43472", "43504", "43505", "43600", "43601", "43603", "43604", "43609", "43783", "43787", "43950", "43951", "43953", "43959", "43961", "43962",
                      "43967", "44244", "44245", "44661", "44841", "44995", "44996", "44997", "45051", "45054", "45056", "452", "45330", "45331", "45332",
                        "45333", "45334", "45335", "45336", "45337", "45338", "45339", "45566", "45567", "45568", "45610", "45611", "45612", "45613", "45614", "45615", "45616", "45617", "45618", "45619", "45620", "45621",
                         "45622", "45623", "45624", "45625", "45626", "45627", "45628", "45629", "45695", "45720", "45721", "45771", "45929", "45930", "45932", "45933", "45937", "45939", "45940", "45950", "45954", "45958",
                          "46099", "46321", "46547", "46609", "46625", "46657", "46703", "46969", "46978", "46986", "47410", "47717", "47718", "47722", "47726", "47729", "47802", "47809", "47961", "48109", "48362", "48369",
                           "48373", "48651", "49030", "49050", "49110", "49270", "49271", "49272", "49273", "49274", "49330", "49331", "49332", "49333", "49334", "49335", "49336", "49337", "49338", "49339", "49360", "49390",
                            "49391", "49392", "49393", "49394", "49395", "49396", "49397", "49398", "49399", "494", "495", "496", "497", "498", "499", "50163", "50176", "50438", "50447", "50452", "50497", "50758",
                                             "50759", "513", "51521", "51736", "51764", "51810", "51992", "52371", "52742", "52922", "52931", "52941", "52942", "52943", "52944", "52945",
                                                "52946", "52947", "52948", "52949", "52954", "53090", "53102", "53103", "53234", "53410", "53411", "53610", "53611", "53801", "54504", "54515", "54953", "54985", "55397", "55399", "55420", "55496",
                                                 "55700", "55886", "55888", "55892", "55961", "55980", "55981", "56014", "56040", "56041", "56071", "56078", "56120", "56121", "56122", "56123", "56124", "56125", "56126", "56127", "56128", "56129",
                                                  "58118", "58170", "58171", "58172", "58173", "58174", "58175", "58176", "58177", "58178", "58179", "58540", "58541", "58542", "58543", "58544", "58545", "58546", "58547", "58548", "58549", "58550",
                                                   "58551", "58552", "58553", "58554", "58555", "58556", "58557", "58558", "58559", "58863", "58865", "58927", "62724", "63901", "63902", "63903", "63904", "63907", "63908", "63909", "63910", "67090",
                                                    "67510", "67514", "67530", "92500", "92502", "92507"],
                "bancontact": ["6703", "487104", "670305", "670330", "670319", "670300", "670342", "487109", "670397", "670375", "670310"]
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
