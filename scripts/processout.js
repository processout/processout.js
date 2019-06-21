!function(){function t(t){this.message=t}var r="undefined"!=typeof exports?exports:self,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=new Error,t.prototype.name="InvalidCharacterError",r.btoa||(r.btoa=function(r){for(var o,n,a=String(r),i=0,c=e,d="";a.charAt(0|i)||(c="=",i%1);d+=c.charAt(63&o>>8-i%1*8)){if(n=a.charCodeAt(i+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return d}),r.atob||(r.atob=function(r){var o=String(r).replace(/=+$/,"");if(o.length%4==1)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var n,a,i=0,c=0,d="";a=o.charAt(c++);~a&&(n=i%4?64*n+a:a,i++%4)?d+=String.fromCharCode(255&n>>(-2*i&6)):0)a=e.indexOf(a);return d})}();"function"!=typeof Object.assign&&(Object.assign=function(a,b){"use strict";if(null==a)throw new TypeError("Cannot convert undefined or null to object");for(var c=Object(a),d=1;d<arguments.length;d++){var e=arguments[d];if(null!=e)for(var f in e)Object.prototype.hasOwnProperty.call(e,f)&&(c[f]=e[f])}return c});(function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          this.parentNode.removeChild(this);
        }
      });
    });
  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);if (![].includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
      'use strict';
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(arguments[1]) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {k = 0;}
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (searchElement === currentElement ||
           (searchElement !== searchElement && currentElement !== currentElement)) {
          return true;
        }
        k++;
      }
      return false;
    };
  }var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ProcessOut;
(function (ProcessOut) {
    var Flow;
    (function (Flow) {
        Flow[Flow["None"] = 1] = "None";
        Flow[Flow["OneOff"] = 2] = "OneOff";
        Flow[Flow["Subscription"] = 3] = "Subscription";
        Flow[Flow["Tokenization"] = 4] = "Tokenization";
    })(Flow = ProcessOut.Flow || (ProcessOut.Flow = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var ApplePay = (function () {
        function ApplePay(instance, req) {
            this.instance = instance;
            if (!req.merchantCapabilities || !req.merchantCapabilities.length)
                req.merchantCapabilities = ['supports3DS'];
            if (!req.supportedNetworks || !req.supportedNetworks.length)
                req.supportedNetworks = ['amex', 'discover', 'masterCard', 'visa'];
            this.request = req;
            this.session = new ApplePaySession(1, this.request);
            var t = this;
            this.session.onvalidatemerchant = function (event) {
                t.instance.apiRequest("post", t.instance.endpoint("api", "/applepay/sessions"), {
                    "session_url": event.validationURL,
                    "domain_name": window.location.hostname
                }, function (data, req, e) {
                    if (!data.success) {
                        t.onerror(new ProcessOut.Exception(data.error_code, data.message));
                        t.session.abort();
                    }
                    else
                        t.session.completeMerchantValidation(data.session_payload);
                }, function (req, e) {
                    t.onerror(new ProcessOut.Exception("processout-js.network-issue"));
                    t.session.abort();
                });
            };
            this.session.onpaymentauthorized = function (event) {
                var req = t.data;
                if (!req)
                    req = {};
                req.applepay_response = event.payment;
                req.token_type = "applepay";
                t.instance.apiRequest("post", t.instance.endpoint("api", "/cards"), req, function (data, req, e) {
                    if (!data.success) {
                        t.onerror(new ProcessOut.Exception(data.error_code, data.message));
                        t.session.abort();
                    }
                    else
                        t.onsuccess(data.card);
                }, function (req, e) {
                    t.onerror(new ProcessOut.Exception("processout-js.network-issue"));
                    t.session.abort();
                });
            };
            this.session.oncancel = this.onCancelHandler.bind(this);
            this.session.onshippingcontactselected = this.onShippingContactSelectedHandler.bind(this);
            this.session.onshippingmethodselected = this.onShippingMethodSelectedHandler.bind(this);
        }
        ApplePay.prototype.setHandlers = function (onsuccess, onerror) {
            if (!onsuccess)
                throw new ProcessOut.Exception("applepay.no-success-handler");
            this.onsuccess = onsuccess;
            this.onerror = function (err) {
                if (onerror)
                    onerror(err);
            };
        };
        ApplePay.prototype.tokenize = function (data, onsuccess, onerror) {
            this.setHandlers(onsuccess, onerror);
            this.session.begin();
        };
        ApplePay.prototype.abort = function () {
            this.session.abort();
        };
        ApplePay.prototype.completePayment = function (status) {
            this.session.completePayment(status);
        };
        ApplePay.prototype.completePaymentMethodSelection = function (newTotal, newLineItems) {
            this.session.completePaymentMethodSelection(newTotal, newLineItems);
        };
        ApplePay.prototype.completeShippingContactSelection = function (status, newShippingMethods, newTotal, newLineItems) {
            this.session.completeShippingContactSelection(status, newShippingMethods, newTotal, newLineItems);
        };
        ApplePay.prototype.completeShippingMethodSelection = function (status, newTotal, newLineItems) {
            this.session.completeShippingMethodSelection(status, newTotal, newLineItems);
        };
        ApplePay.prototype.getSession = function () {
            return this.session;
        };
        ApplePay.prototype.onCancelHandler = function (event) {
            if (this.oncancel)
                this.oncancel(event);
        };
        ApplePay.prototype.onPaymentMethodSelectedHandler = function (event) {
            if (this.onpaymentmethodselected)
                this.onpaymentmethodselected(event);
        };
        ApplePay.prototype.onShippingContactSelectedHandler = function (event) {
            if (this.onshippingcontactselected)
                this.onshippingcontactselected(event);
        };
        ApplePay.prototype.onShippingMethodSelectedHandler = function (event) {
            if (this.onshippingmethodselected)
                this.onshippingmethodselected(event);
        };
        return ApplePay;
    }());
    ProcessOut.ApplePay = ApplePay;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var ApplePayWrapper = (function () {
        function ApplePayWrapper(instance) {
            this.instance = instance;
        }
        ApplePayWrapper.prototype.checkAvailability = function (callback) {
            if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
                callback(new ProcessOut.Exception("applepay.not-supported"));
                return;
            }
            this.instance.apiRequest("get", this.instance.endpoint("api", "/applepay/available"), {
                "domain_name": window.location.hostname
            }, function (data, req, e) {
                if (data.success)
                    callback(null);
                else
                    callback(new ProcessOut.Exception("applepay.not-available", data.message));
            }.bind(this), function (req, e) {
                callback(new ProcessOut.Exception("processout-js.network-issue"));
            });
        };
        ApplePayWrapper.prototype.newSession = function (req, onsuccess, onerror) {
            return new ProcessOut.ApplePay(this.instance, req);
        };
        return ApplePayWrapper;
    }());
    ProcessOut.ApplePayWrapper = ApplePayWrapper;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var processoutjsQuery = "processoutjs";
    var processoutjsQueryTrue = "true";
    var ThreeDS = (function () {
        function ThreeDS(instance, options) {
            this.instance = instance;
            if (!options.source) {
                throw new ProcessOut.Exception("request.validation.error", "Please provide a source to be used to start the 3-D Secure flow.");
            }
            var url = options.url;
            if (!url && options.invoiceID) {
                url = "/" + this.instance.getProjectID() + "/" + options.invoiceID + "/three-d-s/redirect/" + options.source + "?" + processoutjsQuery + "=" + processoutjsQueryTrue;
            }
            if (!url) {
                url = "/" + this.instance.getProjectID() + "/three-d-s" +
                    ("?" + processoutjsQuery + "=" + processoutjsQueryTrue) +
                    ("&amount=" + encodeURIComponent(options.amount)) +
                    ("&currency=" + encodeURIComponent(options.currency)) +
                    ("&name=" + encodeURIComponent(options.name)) +
                    ("&return_url=" + encodeURIComponent(options.returnURL ? options.returnURL : "")) +
                    ("&source=" + encodeURIComponent(options.source));
                if (options.metadata && typeof options.metadata == 'object') {
                    for (var i in options.metadata) {
                        if (!options.metadata.hasOwnProperty(i))
                            continue;
                        url += "&metadata[" + i + "]=" + encodeURIComponent(options.metadata[i]);
                    }
                }
            }
            if (!url) {
                throw new ProcessOut.Exception("request.validation.error", "Please provide a 3DS challenge URL or an invoice ID.");
            }
            this.url = url;
        }
        ThreeDS.prototype.handle = function (success, error) {
            return this.instance.handleAction(this.instance.endpoint("checkout", this.url), function (invoiceID) { success(invoiceID); }, error, new ProcessOut.ActionHandlerOptions(ProcessOut.ActionHandlerOptions.ThreeDSChallengeFlow));
        };
        return ThreeDS;
    }());
    ProcessOut.ThreeDS = ThreeDS;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var ThreeDSOptions = (function () {
        function ThreeDSOptions() {
        }
        return ThreeDSOptions;
    }());
    ProcessOut.ThreeDSOptions = ThreeDSOptions;
    var ThreeDSWrapper = (function () {
        function ThreeDSWrapper(instance) {
            this.instance = instance;
        }
        ThreeDSWrapper.prototype.authenticate = function (options, success, error) {
            return new ProcessOut.ThreeDS(this.instance, options).handle(success, error);
        };
        return ThreeDSWrapper;
    }());
    ProcessOut.ThreeDSWrapper = ThreeDSWrapper;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var GatewayRequest = (function () {
        function GatewayRequest() {
        }
        GatewayRequest.prototype.token = function () {
            return "gway_req_" + btoa(JSON.stringify({
                "gateway_configuration_id": this.gatewayConfigurationID,
                "url": this.url,
                "method": this.method,
                "headers": this.headers,
                "body": this.body,
                "prepare": this.prepare
            }));
        };
        return GatewayRequest;
    }());
    ProcessOut.GatewayRequest = GatewayRequest;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var CardHolder = (function () {
        function CardHolder() {
        }
        return CardHolder;
    }());
    ProcessOut.CardHolder = CardHolder;
    var Expiry = (function () {
        function Expiry(month, year) {
            this.month = month;
            this.year = Expiry.parseYear(year);
        }
        Expiry.parse = function (exp) {
            var exps = exp.split(" / ");
            if (exps.length <= 1) {
                exps = exp.split("/");
            }
            var month = Number(exps[0]);
            var year = 0;
            if (exps.length > 1)
                year = Number(exps[1]);
            return new Expiry(month, year);
        };
        Expiry.parseMonth = function (monthn) {
            var month = Number(monthn);
            if (!month)
                month = 0;
            return month;
        };
        Expiry.parseYear = function (yearn) {
            var year = Number(yearn);
            if (!year)
                year = 0;
            if (year < 2000) {
                year += 2000;
            }
            return year;
        };
        Expiry.prototype.getMonth = function () {
            return this.month;
        };
        Expiry.prototype.getYear = function () {
            return this.year;
        };
        Expiry.prototype.string = function () {
            return this.month + " / " + this.year;
        };
        Expiry.prototype.validate = function () {
            var err = Expiry.validateMonth(this.getMonth());
            if (err)
                return err;
            err = Expiry.validateYear(this.getYear());
            if (err)
                return err;
            var date = new Date();
            if (this.getMonth() < date.getMonth() && this.getYear() == date.getFullYear())
                return new ProcessOut.Exception("card.invalid-date");
            return null;
        };
        Expiry.format = function (exp) {
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
        };
        Expiry.validateMonth = function (month) {
            if (!month || month < 1 || month > 12)
                return new ProcessOut.Exception("card.invalid-month");
            return null;
        };
        Expiry.validateYear = function (year) {
            if (year < 100)
                year += 2000;
            var date = new Date();
            if (!year || year < date.getFullYear())
                return new ProcessOut.Exception("card.invalid-year");
            return null;
        };
        return Expiry;
    }());
    ProcessOut.Expiry = Expiry;
    var Card = (function () {
        function Card(number, expiry, cvc) {
            this.number = Card.parseNumber(number);
            this.cvc = cvc;
            this.expiry = expiry;
        }
        Card.prototype.getNumber = function () {
            return this.number;
        };
        Card.prototype.getExpiry = function () {
            return this.expiry;
        };
        Card.prototype.getCVC = function () {
            return this.cvc;
        };
        Card.luhn = function (cardNo) {
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
        };
        Card.prototype.validate = function () {
            var err = Card.validateNumber(this.number);
            if (err)
                return err;
            if (this.expiry == null)
                return new ProcessOut.Exception("card.invalid-date");
            err = this.expiry.validate();
            if (err)
                return err;
            return Card.validateCVC(this.cvc);
        };
        Card.prototype.getIIN = function () {
            return Card.getIIN(this.number);
        };
        Card.prototype.getLast4Digits = function () {
            return Card.getLast4Digits(this.number);
        };
        Card.formatNumber = function (number) {
            var format = Card.getCardFormat(Card.getIIN(number));
            number = Card.parseNumber(number);
            var formatted = "";
            var currentBlock = 0;
            var currentBlockChar = 0;
            for (var i = 0; i < number.length; i++) {
                if (isNaN(number[i]))
                    continue;
                if (currentBlockChar >= format[currentBlock]) {
                    currentBlock++;
                    currentBlockChar = 0;
                    if (currentBlock >= format.length)
                        break;
                    formatted += " ";
                }
                formatted += number[i];
                currentBlockChar++;
            }
            return formatted;
        };
        Card.parseNumber = function (number) {
            return String(number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, ""));
        };
        Card.validateNumber = function (number) {
            number = Card.parseNumber(number);
            if (number.length < 12)
                return new ProcessOut.Exception("card.invalid-number");
            if (!Card.luhn(number))
                return new ProcessOut.Exception("card.invalid-number");
            return null;
        };
        Card.validateCVC = function (cvc) {
            if (!cvc)
                return null;
            if (cvc.length < 3)
                return new ProcessOut.Exception("card.invalid-cvc");
            return null;
        };
        Card.getIIN = function (number) {
            number = Card.parseNumber(number);
            var l = number.length;
            if (l > 6)
                l = 6;
            return number.substring(0, l);
        };
        Card.getLast4Digits = function (number) {
            number = Card.parseNumber(number);
            var l = number.length;
            if (l > 4)
                l = 4;
            return number.substr(number.length - l);
        };
        Card.autoFormatNumber = function (number, next) {
            var lastLen = 0;
            number.addEventListener("input", function (e) {
                var field = this;
                var cursor = field.selectionStart;
                var l = field.value.length;
                field.value = Card.formatNumber(field.value);
                if (cursor && cursor < l) {
                    field.setSelectionRange(cursor, cursor);
                    if (cursor > 0 && field.value[cursor - 1] == " " && l > lastLen)
                        field.setSelectionRange(cursor + 1, cursor + 1);
                }
                var cardLength = Card.getPossibleCardLength(Card.getIIN(field.value));
                if (next && l > lastLen && Card.parseNumber(field.value).length == cardLength[1])
                    next();
                lastLen = l;
            });
        };
        Card.autoFormatExpiry = function (exp, next) {
            var lastLen = 0;
            exp.addEventListener("input", function (e) {
                var field = this;
                var cursor = field.selectionStart;
                var l = field.value.length;
                var formatted = Expiry.format(field.value);
                if (formatted.length > 7)
                    return;
                field.value = formatted;
                if (cursor && cursor < l) {
                    field.setSelectionRange(cursor, cursor);
                    if (cursor > 0 && field.value[cursor - 1] == " " && l > lastLen)
                        field.setSelectionRange(cursor + 1, cursor + 1);
                }
                if (next && l > lastLen && field.value.length == 7)
                    next();
                lastLen = l;
            });
        };
        Card.getCardFormat = function (iin) {
            var schemes = Card.getPossibleSchemes(iin);
            if (schemes.length == 1 && schemes[0] == "american-express")
                return [4, 6, 5];
            return [4, 4, 4, 4, 4];
        };
        Card.getPossibleCardLength = function (iin) {
            var actualMin = 12;
            var actualMax = 19;
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
            if (minLength > maxLength) {
                minLength = actualMin;
                maxLength = actualMax;
            }
            return [minLength, maxLength];
        };
        Card.getPossibleSchemes = function (iin) {
            iin = Card.parseNumber(iin);
            var schemes = {
                "visa": ["4"],
                "mastercard": ["22", "23", "24", "25", "26", "27", "51", "52", "53", "54", "55"],
                "american-express": ["34", "37"],
                "union-pay": ["62"],
                "diners-club": ["300", "301", "302", "303", "304", "305", "309", "36", "38", "39"],
                "discover": ["6011", "62", "64", "65"],
                "jcb": ["35"],
                "maestro": ["50", "56", "57", "58", "59", "6"],
                "dankort": ["5019", "4175", "4571"],
                "uatp": ["1"],
                "cardguard ead bg ils": ["5392"],
                "hipercard": ["606282"],
                "elo": ["401178", "401179", "438935", "451416", "457632", "457393", "431274", "438935", "457631", "457632",
                    "506699", "50670", "50671", "50672", "50673", "50674", "50675", "50676", "506770", "506771", "506772", "506773", "506774",
                    "506775", "506776", "506777", "506778", "504175", "509",
                    "627780", "636297", "636368", "651652", "651653", "651654", "651655", "651656", "651657", "651658", "651659", "65166", "65167",
                    "650031", "650032", "650033", "650035", "650036", "650037", "650038", "650039", "65004", "650050", "650051", "65500", "65501",
                    "650485", "650486", "650487", "650488", "650489", "65049", "65050", "65051", "65052", "650530", "650531", "650532", "650533",
                    "650534", "650535", "650536", "650537", "650538", "650541", "650542", "650543", "650544", "650545", "650546", "650547",
                    "650548", "650549", "65055", "65056", "65057", "65058", "650590", "650591", "650592", "650593", "650594", "650595", "650596",
                    "650597", "650598", "65070", "650710", "650711", "650712", "650713", "650714", "650715", "650716", "650717", "650718", "650720",
                    "650721", "650722", "650723", "650724", "650725", "650726", "650727", "655021", "655022", "655023", "655024", "655025", "655026",
                    "655027", "655028", "655029", "65503", "65504", "655050", "655051", "655052", "655053", "655054", "655055", "655056", "655057",
                    "655058", "650901", "650902", "650903", "650904", "650905", "650906", "650907", "650908", "650909", "65091", "65092", "65093",
                    "65094", "65095", "65096", "650970", "650971", "650972", "650973", "650974", "650975", "650976", "650977", "650978", "650405",
                    "650406", "650407", "650408", "650409", "65041", "65042", "65043"],
                "naranja": ["377798", "377799", "402917", "402918", "527571", "527572", "589562"],
                "cabal": ["589657", "600691", "603522", "6042", "6043", "636908"],
                "argencard": ["501105"]
            };
            var matches = new Array();
            for (var scheme in schemes) {
                var options = schemes[scheme];
                for (var optionKey in options) {
                    var option = options[optionKey];
                    var l = (iin.length > option.length) ? option.length : iin.length;
                    if (iin.substring(0, l) == option.toString().substring(0, l)) {
                        matches.push(scheme);
                        break;
                    }
                }
            }
            return matches;
        };
        return Card;
    }());
    ProcessOut.Card = Card;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var CardFieldValue = (function () {
        function CardFieldValue() {
            this.number = null;
            this.expiryMonth = null;
            this.expiryYear = null;
            this.cvc = null;
            this.name = null;
            this.metadata = null;
        }
        return CardFieldValue;
    }());
    ProcessOut.CardFieldValue = CardFieldValue;
    var CardFieldOptions = (function () {
        function CardFieldOptions(type) {
            this.type = type;
        }
        CardFieldOptions.prototype.apply = function (o) {
            if (o.placeholder)
                this.placeholder = o.placeholder;
            if (o.style)
                this.style = o.style;
            return this;
        };
        return CardFieldOptions;
    }());
    ProcessOut.CardFieldOptions = CardFieldOptions;
    var CardFieldStyle = (function () {
        function CardFieldStyle() {
        }
        return CardFieldStyle;
    }());
    ProcessOut.CardFieldStyle = CardFieldStyle;
    var CardField = (function () {
        function CardField(instance, form, options, container, success, error) {
            this.handlers = {};
            if (!options || !options.type) {
                throw new ProcessOut.Exception("processout-js.invalid-field-type", "Options and a the field type must be provided to setup the field.");
            }
            if (!container) {
                throw new ProcessOut.Exception("processout-js.undefined-field", "The card field for the " + options.type + " does not exist in the given container.");
            }
            if (container instanceof HTMLInputElement) {
                throw new ProcessOut.Exception("processout-js.invalid-field", "The card field for the " + options.type + " must be an input field.");
            }
            if (options.type != CardField.number &&
                options.type != CardField.expiry &&
                options.type != CardField.expiryMonth &&
                options.type != CardField.expiryYear &&
                options.type != CardField.cvc)
                throw new ProcessOut.Exception("processout-js.invalid-field-type");
            this.instance = instance;
            this.form = form;
            this.options = options;
            this.el = container;
            var placeholder = this.el.getAttribute("data-processout-placeholder");
            if (placeholder)
                this.options.placeholder = placeholder;
            this.spawn(success, error);
        }
        CardField.prototype.spawn = function (success, error) {
            var tmp = Math.random().toString(36).substring(7);
            this.uid = "#" + tmp;
            var endpoint = this.instance.getProcessOutFieldEndpoint("?r=" + tmp + this.uid);
            this.iframe = document.createElement("iframe");
            this.iframe.className = "processout-field-cc-iframe";
            this.iframe.name = tmp;
            this.iframe.setAttribute("src", endpoint);
            this.iframe.setAttribute("style", "background: none; width: 100%;");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("allowtransparency", "1");
            this.iframe.style.display = "none";
            this.iframe.height = "14px";
            var errored = false;
            var iframeError = setTimeout(function () {
                errored = true;
                if (typeof (error) === typeof (Function))
                    error(new ProcessOut.Exception("processout-js.field.unavailable"));
            }, CardField.timeout);
            this.iframe.onload = function () {
                try {
                    this.iframe.src = endpoint;
                }
                catch (e) { }
            }.bind(this);
            window.addEventListener("message", function (event) {
                if (errored)
                    return;
                var data = ProcessOut.Message.parseEvent(event);
                if (data.frameID != this.uid)
                    return;
                if (data.namespace != ProcessOut.Message.fieldNamespace)
                    return;
                this.handlEvent(data);
                if (data.action == "alive") {
                    this.iframe.contentWindow.postMessage(JSON.stringify({
                        "namespace": ProcessOut.Message.fieldNamespace,
                        "projectID": this.instance.getProjectID(),
                        "action": "setup",
                        "formID": this.form.getUID(),
                        "data": this.options
                    }), "*");
                }
                if (data.action == "ready") {
                    this.iframe.style.display = "block";
                    clearTimeout(iframeError);
                    success();
                    this.iframe.contentWindow.postMessage(JSON.stringify({
                        "namespace": ProcessOut.Message.fieldNamespace,
                        "projectID": this.instance.getProjectID(),
                        "action": "resize"
                    }), "*");
                    this.iframe.addEventListener("focus", function (event) {
                        this.focus();
                    }.bind(this));
                }
            }.bind(this));
            this.el.appendChild(this.iframe);
        };
        CardField.prototype.handlEvent = function (data) {
            var d = {
                field: this,
                type: this.options.type,
                element: this.el,
                data: data.data
            };
            switch (data.action) {
                case "inputEvent":
                    if (this.eventCallback)
                        this.eventCallback("oninput", d);
                    break;
                case "mouseEnterEvent":
                    if (this.eventCallback)
                        this.eventCallback("onmouseenter", d);
                    break;
                case "mouseLeaveEvent":
                    if (this.eventCallback)
                        this.eventCallback("onmouseleave", d);
                    break;
                case "focusEvent":
                    this.el.className = this.el.className + " processout-input-focused";
                    if (this.eventCallback)
                        this.eventCallback("onfocus", d);
                    break;
                case "blurEvent":
                    this.el.className = this.el.className
                        .replace(/\bprocessout-input-focused\b/g, "")
                        .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
                    if (this.eventCallback)
                        this.eventCallback("onblur", d);
                    break;
                case "next":
                    if (this.next)
                        this.next();
                    break;
                case "event":
                    if (data.data.name in this.handlers) {
                        var handlers = this.handlers[data.data.name];
                        for (var i = 0; i < handlers.length; i++)
                            handlers[0](data.data.data);
                    }
                    break;
                case "resize":
                    this.iframe.height = data.data;
                    break;
            }
        };
        CardField.prototype.setNext = function (next) {
            this.next = next;
        };
        CardField.prototype.update = function (options) {
            if (options.placeholder)
                this.options.placeholder = options.placeholder;
            if (options.style)
                this.options.style = Object.assign(this.options.style, options.style);
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "update",
                "data": this.options
            }), "*");
        };
        CardField.prototype.addEventListener = function (e, h) {
            if (!(e in this.handlers))
                this.handlers[e] = [];
            this.handlers[e].push(h);
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "registerEvent",
                "data": e
            }), "*");
        };
        CardField.prototype.on = function (e, h) {
            return this.addEventListener(e, h);
        };
        CardField.prototype.blur = function () {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "blur"
            }), "*");
        };
        CardField.prototype.focus = function () {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": Math.random().toString(),
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "focus"
            }), "*");
        };
        CardField.prototype.validate = function (success, error) {
            var id = Math.random().toString();
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "validate"
            }), "*");
            var fetchingTimeout = setTimeout(function () {
                error(new ProcessOut.Exception("processout-js.field.unavailable"));
            }, CardField.timeout);
            window.addEventListener("message", function (event) {
                var data = ProcessOut.Message.parseEvent(event);
                if (data.frameID != this.uid)
                    return;
                if (data.namespace != ProcessOut.Message.fieldNamespace)
                    return;
                if (data.messageID != id)
                    return;
                if (data.action != "validate")
                    return;
                clearTimeout(fetchingTimeout);
                if (data.data) {
                    error(new ProcessOut.Exception(data.data));
                    return;
                }
                success();
            }.bind(this));
        };
        CardField.prototype.tokenize = function (fields, data, success, error) {
            var id = Math.random().toString();
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "tokenize",
                "data": {
                    "fields": fields,
                    "data": data
                }
            }), "*");
            var fetchingTimeout = setTimeout(function () {
                error(new ProcessOut.Exception("processout-js.field.unavailable"));
            }, CardField.timeout);
            window.addEventListener("message", function (event) {
                var data = ProcessOut.Message.parseEvent(event);
                if (data.messageID != id)
                    return;
                if (data.action != "tokenize")
                    return;
                clearTimeout(fetchingTimeout);
                if (data.data.token)
                    success(data.data.token);
                else if (data.data.error)
                    error(new ProcessOut.Exception(data.data.error.code, data.data.error.message));
                else
                    error(new ProcessOut.Exception("default"));
            }.bind(this));
        };
        CardField.prototype.refreshCVC = function (cardUID, success, error) {
            var id = Math.random().toString();
            this.iframe.contentWindow.postMessage(JSON.stringify({
                "messageID": id,
                "namespace": ProcessOut.Message.fieldNamespace,
                "projectID": this.instance.getProjectID(),
                "action": "refresh-cvc",
                "data": cardUID
            }), "*");
            var fetchingTimeout = setTimeout(function () {
                error(new ProcessOut.Exception("processout-js.field.unavailable"));
            }, CardField.timeout);
            window.addEventListener("message", function (event) {
                var data = ProcessOut.Message.parseEvent(event);
                if (data.messageID != id)
                    return;
                if (data.action != "refresh-cvc")
                    return;
                clearTimeout(fetchingTimeout);
                if (data.data.token)
                    success(data.data.token);
                else if (data.data.error)
                    error(new ProcessOut.Exception(data.data.error.code, data.data.error.message));
                else
                    error(new ProcessOut.Exception("default"));
            }.bind(this));
        };
        CardField.number = "number";
        CardField.expiry = "expiry";
        CardField.expiryMonth = "expiry-month";
        CardField.expiryYear = "expiry-year";
        CardField.cvc = "cvc";
        CardField.timeout = 20000;
        return CardField;
    }());
    ProcessOut.CardField = CardField;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var CardForm = (function () {
        function CardForm(instance, el) {
            this.instance = instance;
            this.element = el;
            this.uid = Math.random().toString();
        }
        CardForm.prototype.getUID = function () {
            return this.uid;
        };
        CardForm.prototype.setup = function (options, success, error) {
            var numberReady = false;
            var cvcReady = false;
            var expMonthReady = false;
            var expYearReady = false;
            var ev = function () {
                if (numberReady && cvcReady && expMonthReady && expYearReady) {
                    this.number.setNext(function () {
                        if (this.exp)
                            this.exp.focus();
                        if (this.expMonth)
                            this.expMonth.focus();
                    }.bind(this));
                    if (this.exp) {
                        this.exp.setNext(function () {
                            if (this.cvc)
                                this.cvc.focus();
                        }.bind(this));
                    }
                    success(this);
                    return;
                }
            }.bind(this);
            this.number = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.number).apply(options), this.element.querySelector("[data-processout-input=cc-number]"), function () {
                numberReady = true;
                ev();
            }, error);
            var cvcEl = this.element.querySelector("[data-processout-input=cc-cvc]");
            if (cvcEl) {
                this.cvc = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.cvc).apply(options), cvcEl, function () {
                    cvcReady = true;
                    ev();
                }, error);
            }
            else {
                cvcReady = true;
            }
            var expEl = this.element.querySelector("[data-processout-input=cc-exp]");
            if (expEl) {
                this.exp = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.expiry).apply(options), expEl, function () {
                    expMonthReady = true;
                    expYearReady = true;
                    ev();
                }, error);
            }
            else {
                this.expMonth = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.expiryMonth).apply(options), this.element.querySelector("[data-processout-input=cc-exp-month]"), function () {
                    expMonthReady = true;
                    ev();
                }, error);
                this.expYear = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.expiryYear).apply(options), this.element.querySelector("[data-processout-input=cc-exp-year]"), function () {
                    expYearReady = true;
                    ev();
                }, error);
            }
            return this;
        };
        CardForm.prototype.setupCVC = function (options, success, error) {
            this.isRefreshCVC = true;
            this.cvc = new ProcessOut.CardField(this.instance, this, new ProcessOut.CardFieldOptions(ProcessOut.CardField.cvc).apply(options), this.element.querySelector("[data-processout-input=cc-cvc]"), function () {
                success(this);
            }.bind(this), error);
            return this;
        };
        CardForm.prototype.getElement = function () {
            return this.element;
        };
        CardForm.prototype.addEventListener = function (type, listener, useCapture) {
            return this.element.addEventListener(type, listener, useCapture);
        };
        CardForm.prototype.on = function (type, listener, useCapture) {
            return this.element.addEventListener(type, listener, useCapture);
        };
        CardForm.prototype.getNumberField = function () {
            return this.number;
        };
        CardForm.prototype.getCVCField = function () {
            return this.cvc;
        };
        CardForm.prototype.getExpiryField = function () {
            return this.exp;
        };
        CardForm.prototype.getExpiryMonthField = function () {
            return this.expMonth;
        };
        CardForm.prototype.getExpiryYearField = function () {
            return this.expYear;
        };
        CardForm.prototype.validate = function (success, error) {
            if (this.isRefreshCVC) {
                this.cvc.validate(function () {
                    success();
                }, error);
                return;
            }
            var number = false;
            var cvc = false;
            var expMonth = false;
            var expYear = false;
            var ev = function () {
                if (number && cvc && expMonth && expYear) {
                    success();
                }
            };
            this.number.validate(function () {
                number = true;
                ev();
            }, error);
            if (this.cvc)
                this.cvc.validate(function () {
                    cvc = true;
                    ev();
                }, error);
            else
                cvc = true;
            if (this.exp) {
                this.exp.validate(function () {
                    expMonth = true;
                    expYear = true;
                    ev();
                }, error);
            }
            else {
                this.expMonth.validate(function () {
                    expMonth = true;
                    ev();
                }, error);
                this.expYear.validate(function () {
                    expYear = true;
                    ev();
                }, error);
            }
        };
        CardForm.prototype.tokenize = function (data, success, error) {
            var fields = ["number"];
            if (this.cvc)
                fields.push("cvc");
            if (this.exp)
                fields.push("exp");
            if (this.expMonth)
                fields.push("exp-month");
            if (this.expYear)
                fields.push("exp-year");
            this.number.tokenize(fields, data, success, error);
        };
        CardForm.prototype.refreshCVC = function (cardUID, success, error) {
            if (!this.cvc)
                error(new ProcessOut.Exception("processout-js.wrong-type-for-action", "RefreshCVC was called but the form has no CVC field initialized."));
            this.cvc.refreshCVC(cardUID, success, error);
        };
        return CardForm;
    }());
    ProcessOut.CardForm = CardForm;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var messages = {
        "en": {
            "default": "An error occured: your payment was declined.",
            "card.declined": "The credit card has been declined.",
            "card.expired": "The given card has expired.",
            "card.duplicate": "The payment could not be completed. Please try again later.",
            "card.network-failed": "The payment could not be completed. Please try again later.",
            "card.invalid": "The given card is invalid.",
            "card.invalid-name": "The cardholder name is invalid.",
            "card.invalid-number": "The card number is invalid.",
            "card.invalid-date": "The card expiry date is invalid.",
            "card.invalid-month": "The card expiry month is invalid.",
            "card.invalid-year": "The card expiry year is invalid.",
            "card.invalid-cvc": "The card CVC is invalid.",
            "card.invalid-zip": "The card's ZIP code is valid.",
            "card.failed-cvc-and-avs": "The CVC and AVS code were invalid.",
            "card.failed-three-d-s": "The 3D-Secure authentication failed.",
            "card.bad-track-data": "The card could not be verified. Maybe your CVC is invalid?",
            "card.not-registered": "The card is not registered.",
            "card.issuer-not-found": "The card issuer could not be found. Please try another card.",
            "card.possible-fraud": "The payment could not be completed. Please contact your bank for further help.",
            "card.contact-bank": "The payment could not be completed. Please contact your bank for further help.",
            "card.not-authorized": "The payment could not be authorized using the provided card.",
            "card.do-not-honor": "The payment could not be completed. Please contact your bank for further help.",
            "card.maximum-attempts": "The card maximum attempts has been reached and the payment could not be processed.",
            "card.stolen": "The payment could not be processed as the provided card was marked as stolen.",
            "card.lost": "The payment could not be processed as the provided card was marked as lost.",
            "card.exceeded-limits": "The payment could not be processed as the payment limits of the card have been exceeded.",
            "card.no-money": "There doesn't seem to be enough money on the bank account linked to the provided card.",
            "customer.canceled": "The customer canceled the payment.",
            "customer.popup-blocked": "Please allow pop-ups to continue with your payment flow.",
            "gateway.declined": "The payment was declined.",
            "payment.declined": "The payment was declined.",
            "payment.pending": "The payment is currently pending, please wait a few minutes for it to fully go through.",
            "three-d-s-2.fingerprint-timed-out": "The 3-D Secure fingerprinting timed out.",
            "request.validation.error": "The provided information is invalid or missing.",
            "request.validation.invalid-country": "The provided country is invalid.",
            "request.validation.missing-name": "A name must be provided.",
            "request.validation.invalid-name": "The provided name is invalid.",
            "request.validation.missing-email": "An email must be provided.",
            "request.validation.invalid-email": "The provided email is invalid.",
            "request.validation.invalid-address": "The provided address is invalid.",
            "request.validation.no-method-selected": "Please select a payment method.",
            "request.gateway.not-available": "The requested gateway is currently unavailable.",
            "request.gateway.not-supported": "The gateway is not supported by ProcessOut.js",
            "processout-js.missing-project-id": "Your project ID was not specified when loading ProcessOut.js.",
            "processout-js.not-hosted": "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable": "The ProcessOut.js modal is unavailable.",
            "processout-js.field.unavailable": "The ProcessOut.js credit card field is unavailable.",
            "processout-js.invalid-config": "The provided gateway configuration is invalid.",
            "processout-js.no-customer-action": "No customer action is required for the given gateway configuration and resource.",
            "processout-js.customer-action-not-supported": "The requested customer action is not supported by ProcessOut.js.",
            "processout-js.invalid-field": "The given HTML element may not be used by ProcessOut.js: it is an input. Please only use divs when creating a ProcessOut.js credit card field.",
            "processout-js.undefined-field": "The given HTML element was undefined.",
            "processout-js.invalid-field-type": "The given field type was incorrect. It must either be number, expiry, expiryMonth, expiryYear or CVC.",
            "processout-js.network-issue": "There seems to be some connectivity issue preventing the payment from making it through. Please switch to another network or try again in a few minutes.",
            "processout-js.invalid-type": "The specified parameter had an unknown type.",
            "processout-js.missing-source": "A source must be specified.",
            "processout-js.wrong-type-for-action": "The requested action could not be performed on the given field because its type is invalid.",
            "processout-js.missing-invoice-id": "An invoice ID must be specified.",
            "processout-js.missing-resource-id": "A resource ID must be specified.",
            "resource.invalid-type": "The provided resource was invalid. It must be an invoice, a subscription or an authorization request.",
            "applepay.not-supported": "The current browser/device does not support Apple Pay.",
            "applepay.no-success-handler": "A success handler must be specified when setting up Apple Pay.",
            "applepay.not-available": "Apple Pay is not available for the current browser, device or ProcessOut project."
        }
    };
    var Translator = (function () {
        function Translator() {
        }
        Translator.translate = function (code, message) {
            if (messages[Translator.locale][code])
                return messages[Translator.locale][code];
            if (message)
                return message;
            return messages[Translator.locale]["default"];
        };
        Translator.setLocale = function (locale) {
            if (!messages[locale])
                return;
            Translator.locale = locale;
        };
        Translator.locale = "en";
        return Translator;
    }());
    ProcessOut.Translator = Translator;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Exception = (function (_super) {
        __extends(Exception, _super);
        function Exception(code, message) {
            var _this = this;
            if (!message)
                message = ProcessOut.Translator.translate(code);
            _this = _super.call(this, message) || this;
            _this.code = code;
            _this.message = message;
            _this.name = "ProcessOutException";
            _this.stack = new Error().stack;
            return _this;
        }
        return Exception;
    }(Error));
    ProcessOut.Exception = Exception;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut_1) {
    ProcessOut_1.DEBUG = false;
    ProcessOut_1.TestModePrefix = "test-";
    var ProcessOut = (function () {
        function ProcessOut(projectID, resourceID) {
            this.timeout = 10000;
            this.sandbox = false;
            this.host = "processout.com";
            this.processOutFieldEndpoint = "";
            this.apiVersion = "1.3.0.0";
            var scripts = document.getElementsByTagName("script");
            var jsHost = "";
            if (/^https?:\/\/.*\.processout\.((com)|(ninja)|(dev))\//.test(window.location.href)) {
                jsHost = window.location.href;
            }
            else {
                for (var i = 0; i < scripts.length; i++) {
                    if (/^https?:\/\/.*\.processout\.((com)|(ninja)|(dev))\//.test(scripts[i].getAttribute("src"))) {
                        jsHost = scripts[i].getAttribute("src");
                    }
                }
            }
            if (jsHost == "" && !ProcessOut_1.DEBUG) {
                throw new ProcessOut_1.Exception("processout-js.not-hosted");
            }
            if (/^https?:\/\/.*\.processout\.ninja\//.test(jsHost)) {
                this.host = "processout.ninja";
            }
            else if (/^https?:\/\/.*\.processout\.dev\//.test(jsHost)) {
                this.host = "processout.dev";
            }
            else {
                this.host = "processout.com";
            }
            if (!projectID)
                throw new ProcessOut_1.Exception("processout-js.missing-project-id");
            this.projectID = projectID;
            if (this.projectID.lastIndexOf(ProcessOut_1.TestModePrefix, 0) === 0)
                this.sandbox = true;
            this.resourceID = resourceID;
            if (this.resourceID &&
                this.resourceID != "" &&
                this.resourceID.substring(0, 3) != "iv_" &&
                this.resourceID.substring(0, 4) != "sub_" &&
                this.resourceID.substring(0, 9) != "auth_req_") {
                throw new ProcessOut_1.Exception("resource.invalid-type");
            }
            this.applePay = new ProcessOut_1.ApplePayWrapper(this);
            this.threeDS = new ProcessOut_1.ThreeDSWrapper(this);
        }
        ProcessOut.prototype.getResourceID = function () {
            return this.resourceID;
        };
        ProcessOut.prototype.getProjectID = function () {
            return this.projectID;
        };
        ProcessOut.prototype.getProcessOutFieldEndpoint = function (suffix) {
            var endpoint = this.endpoint("js", "/ccfield.html");
            if (ProcessOut_1.DEBUG && this.processOutFieldEndpoint)
                endpoint = this.processOutFieldEndpoint;
            return "" + endpoint + suffix;
        };
        ProcessOut.prototype.setProcessOutFieldEndpoint = function (endpoint) {
            if (!ProcessOut_1.DEBUG)
                return;
            this.processOutFieldEndpoint = endpoint;
        };
        ProcessOut.prototype.endpoint = function (subdomain, path) {
            return "https://" + subdomain + "." + this.host + path;
        };
        ProcessOut.prototype.apiRequest = function (method, path, data, success, error, retry) {
            if (!retry)
                retry = 0;
            method = method.toLowerCase();
            if (path.substring(0, 4) != "http" && path[0] != "/")
                path = this.endpoint("api", "/" + path);
            var headers = {
                "Content-Type": "application/json",
                "API-Version": this.apiVersion
            };
            if (this.projectID)
                headers["Authorization"] = "Basic " + btoa(this.projectID + ":");
            if (!data)
                data = {};
            if (data.idempotency_key) {
                headers["Idempotency-Key"] = data.idempotency_key;
                delete data.idempotency_key;
            }
            path += "?legacyrequest=true&project_id=" + this.projectID;
            for (var k in headers)
                path += "&x-" + k + "=" + headers[k];
            if (method == "get") {
                for (var key in data)
                    path += "&" + key + "=" + encodeURIComponent(data[key]);
            }
            var request = new XMLHttpRequest();
            if (window.XDomainRequest)
                request = new XDomainRequest();
            request.open(method, path, true);
            if (!window.XDomainRequest) {
                for (var k in headers)
                    request.setRequestHeader(k, headers[k]);
            }
            request.timeout = 0;
            request.onload = function (e) {
                var parsed;
                try {
                    parsed = JSON.parse(request.responseText);
                }
                catch (e) {
                    parsed = {};
                }
                if (window.XDomainRequest)
                    success(parsed, request, e);
                else if (e.currentTarget.readyState == 4)
                    success(parsed, request, e);
                return;
            };
            request.onerror = function (e) {
                if (request.status && request.status >= 200 &&
                    request.status < 500 && request.responseText)
                    request.onload(e);
                else
                    error(request, e);
            };
            request.ontimeout = function () { };
            request.onprogress = function () { };
            request.onabort = function () {
                if (retry > 3)
                    error(request, null);
                else
                    this.request(method, path, data, success, error, retry + 1);
            }.bind(this);
            request.send(JSON.stringify(data));
        };
        ProcessOut.prototype.setupForm = function (form, options, success, error) {
            if (!this.projectID)
                throw new ProcessOut_1.Exception("default", "You must instanciate ProcessOut.js with a valid project ID in order to use ProcessOut's hosted forms.");
            if (!form)
                throw new ProcessOut_1.Exception("default", "The provided form element wasn't set. Make sure to provide setupForm with a valid form element.");
            if (typeof options == "function")
                return new ProcessOut_1.CardForm(this, form).setup(new ProcessOut_1.CardFieldOptions(""), options, success);
            else
                return new ProcessOut_1.CardForm(this, form).setup(options, success, error);
        };
        ProcessOut.prototype.tokenize = function (val, data, success, error) {
            if (val instanceof ProcessOut_1.Card)
                return this.tokenizeCard(val, data, success, error);
            if (val instanceof ProcessOut_1.CardForm)
                return this.tokenizeForm(val, data, success, error);
            if (val instanceof ProcessOut_1.ApplePay)
                return val.tokenize(data, success, error);
            throw new ProcessOut_1.Exception("processout-js.invalid-type", "The first parameter had an unknown type/instance. The value must be an instance of either Card, CardForm or ApplePay.");
        };
        ProcessOut.prototype.tokenizeCard = function (card, data, success, error) {
            var err = card.validate();
            if (err) {
                error(err);
                return;
            }
            if (!data)
                data = {};
            if (!data.contact)
                data.contact = {};
            data.number = card.getNumber();
            data.exp_month = card.getExpiry().getMonth().toString();
            data.exp_year = card.getExpiry().getYear().toString();
            data.cvc2 = card.getCVC();
            if (screen.colorDepth)
                data.app_color_depth = Number(screen.colorDepth);
            var language = navigator.language || navigator.userLanguage;
            if (language)
                data.app_language = language;
            if (screen.height)
                data.app_screen_height = screen.height;
            if (screen.width)
                data.app_screen_width = screen.width;
            data.time_zone_offset = Number(new Date().getTimezoneOffset());
            if (window.navigator)
                data.app_java_enabled = window.navigator.javaEnabled();
            this.apiRequest("post", "cards", data, function (data, req, e) {
                if (!data.success) {
                    error(new ProcessOut_1.Exception(data.error_type, data.message));
                    return;
                }
                success(data.card.id);
            }, function (req, e) {
                error(new ProcessOut_1.Exception("processout-js.network-issue"));
            });
        };
        ProcessOut.prototype.tokenizeForm = function (form, data, success, error) {
            form.validate(function () {
                form.tokenize(data, success, error);
            }.bind(this), error);
        };
        ProcessOut.prototype.setupFormCVC = function (form, options, success, error) {
            if (typeof options == "function")
                return new ProcessOut_1.CardForm(this, form).setupCVC(new ProcessOut_1.CardFieldOptions(""), options, success);
            else
                return new ProcessOut_1.CardForm(this, form).setupCVC(options, success, error);
        };
        ProcessOut.prototype.refreshCVC = function (cardUID, val, success, error) {
            if (val instanceof ProcessOut_1.CardForm)
                return this.refreshCVCForm(cardUID, val, success, error);
            return this.refreshCVCString(cardUID, val, success, error);
        };
        ProcessOut.prototype.refreshCVCForm = function (cardUID, form, success, error) {
            form.validate(function () {
                form.refreshCVC(cardUID, success, error);
            }.bind(this), error);
        };
        ProcessOut.prototype.refreshCVCString = function (cardUID, cvc, success, error) {
            var err = ProcessOut_1.Card.validateCVC(cvc);
            if (err) {
                error(err);
                return;
            }
            this.apiRequest("put", "cards/" + cardUID, {
                "cvc": cvc
            }, function (data, req, e) {
                if (!data.success) {
                    error(new ProcessOut_1.Exception("card.invalid"));
                    return;
                }
                success(data.card.id);
            }, function (req, e) {
                error(new ProcessOut_1.Exception("processout-js.network-issue"));
            });
        };
        ProcessOut.prototype.newModal = function (options, onReady, onError) {
            var url = '';
            if (typeof (options) == 'object') {
                url = options.url;
                onReady = options.onReady;
                onError = options.onError;
                if (!url) {
                    url = this.endpoint("checkout", "/" + this.getProjectID() + "/oneoff" +
                        ("?amount=" + encodeURIComponent(options.amount)) +
                        ("&currency=" + encodeURIComponent(options.currency)) +
                        ("&name=" + encodeURIComponent(options.name)));
                    if (options.metadata && typeof options.metadata == 'object') {
                        for (var i in options.metadata) {
                            if (!options.metadata.hasOwnProperty(i))
                                continue;
                            url += "&metadata[" + i + "]=" + encodeURIComponent(options.metadata[i]);
                        }
                    }
                }
            }
            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = document.createElement('iframe');
            iframe.className = "processout-iframe";
            iframe.setAttribute("id", "processout-iframe-" + uniqId);
            iframe.setAttribute("src", url);
            iframe.setAttribute("style", "position: fixed; top: 0; left: 0; background: none; z-index: 9999999;");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowtransparency", "1");
            iframe.style.display = "none";
            var iframeError = setTimeout(function () {
                if (typeof (onError) === typeof (Function))
                    onError(new ProcessOut_1.Exception("processout-js.modal.unavailable"));
            }, this.timeout);
            iframe.onload = function () {
                clearTimeout(iframeError);
                if (typeof (onReady) === typeof (Function))
                    onReady(new ProcessOut_1.Modal(this, iframe, uniqId));
            }.bind(this);
            document.body.appendChild(iframe);
        };
        ProcessOut.prototype.fetchGatewayConfigurations = function (config, success, error) {
            if (!config)
                config = {};
            if (!config.invoiceID && (!config.customerID !== !config.tokenID))
                throw new ProcessOut_1.Exception("processout-js.missing-resource-id");
            this.apiRequest("GET", "gateway-configurations", {
                "filter": config.filter,
                "expand_merchant_accounts": "true"
            }, function (data) {
                if (!data.success) {
                    error(new ProcessOut_1.Exception(data.error_type, data.message));
                    return;
                }
                var confs = [];
                for (var _i = 0, _a = data.gateway_configurations; _i < _a.length; _i++) {
                    var conf = _a[_i];
                    conf.handleInvoiceAction = this.buildHandleInvoiceAction(config.invoiceID, conf);
                    conf.hookForInvoice = this.buildConfHookForInvoice(conf);
                    conf.handleCustomerTokenAction = this.buildHandleCustomerTokenAction(config.customerID, config.tokenID, conf);
                    conf.hookForCustomerToken = this.buildConfHookForCustomerToken(conf);
                    confs.push(conf);
                }
                success(confs);
            }.bind(this), function (req, e) {
                error(new ProcessOut_1.Exception("processout-js.network-issue"));
            });
        };
        ProcessOut.prototype.handleInvoiceAction = function (invoiceID, gatewayConf, tokenized, tokenError) {
            var gatewayConfID = gatewayConf;
            var gatewayName = null;
            var gatewayLogo = null;
            if (gatewayConf && gatewayConf.id) {
                gatewayConfID = gatewayConf.id;
                if (gatewayConf.gateway) {
                    gatewayName = gatewayConf.gateway.name;
                    gatewayLogo = gatewayConf.gateway.logo_url;
                }
            }
            var options = new ProcessOut_1.ActionHandlerOptions(gatewayName, gatewayLogo);
            var url = this.endpoint("checkout", "/" + this.getProjectID() + "/" + invoiceID + "/redirect/" + gatewayConfID);
            return this.handleAction(url, tokenized, tokenError, options);
        };
        ProcessOut.prototype.buildHandleInvoiceAction = function (invoiceID, gatewayConf) {
            return function (tokenized, tokenError) {
                return this.handleInvoiceAction(invoiceID, gatewayConf, tokenized, tokenError);
            }.bind(this);
        };
        ProcessOut.prototype.buildConfHookForInvoice = function (gatewayConf) {
            return function (el, tokenized, tokenError) {
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    gatewayConf.handleInvoiceAction(tokenized, tokenError);
                    return false;
                }.bind(this));
            }.bind(this);
        };
        ProcessOut.prototype.handleCustomerTokenAction = function (customerID, tokenID, gatewayConf, tokenized, tokenError) {
            var gatewayConfID = gatewayConf;
            var gatewayName = null;
            var gatewayLogo = null;
            if (gatewayConf && gatewayConf.id) {
                gatewayConfID = gatewayConf.id;
                if (gatewayConf.gateway) {
                    gatewayName = gatewayConf.gateway.name;
                    gatewayLogo = gatewayConf.gateway.logo_url;
                }
            }
            var options = new ProcessOut_1.ActionHandlerOptions(gatewayName, gatewayLogo);
            var url = this.endpoint("checkout", "/" + this.getProjectID() + "/" + customerID + "/" + tokenID + "/redirect/" + gatewayConfID);
            return this.handleAction(url, tokenized, tokenError, options);
        };
        ProcessOut.prototype.buildHandleCustomerTokenAction = function (customerID, tokenID, gatewayConf) {
            return function (tokenized, tokenError) {
                return this.handleCustomerTokenAction(customerID, tokenID, gatewayConf, tokenized, tokenError);
            }.bind(this);
        };
        ProcessOut.prototype.buildConfHookForCustomerToken = function (gatewayConf) {
            return function (el, tokenized, tokenError) {
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    gatewayConf.handleCustomerTokenAction(tokenized, tokenError);
                    return false;
                }.bind(this));
            }.bind(this);
        };
        ProcessOut.prototype.handleAction = function (url, success, error, options) {
            var handler = new ProcessOut_1.ActionHandler(this, options);
            return handler.handle(url, success, error);
        };
        ProcessOut.prototype.makeCardPayment = function (invoiceID, cardID, options, success, error) {
            if (!options)
                options = {};
            var source = cardID;
            if (options.gatewayRequestSource)
                source = options.gatewayRequestSource;
            var payload = {
                "authorize_only": options.authorize_only,
                "capture_amount": options.capture_amount,
                "auto_capture_at": options.auto_capture_at,
                "source": source,
                "enable_three_d_s_2": true
            };
            if (options.idempotency_key) {
                if (!options.iterationNumber)
                    options.iterationNumber = 1;
                payload.idempotency_key = options.idempotency_key + "-" + options.iterationNumber;
                options.iterationNumber++;
            }
            this.apiRequest("POST", "invoices/" + invoiceID + "/capture", payload, function (data) {
                if (!data.success) {
                    error(new ProcessOut_1.Exception(data.error_type, data.message));
                    return;
                }
                if (!data.customer_action) {
                    success(invoiceID);
                    return;
                }
                var nextStep = function (data) {
                    options.gatewayRequestSource = data;
                    this.makeCardPayment(invoiceID, cardID, options, success, error);
                }.bind(this);
                switch (data.customer_action.type) {
                    case "url":
                        this.handleAction(data.customer_action.value, function (data) {
                            options.gatewayRequestSource = null;
                            this.makeCardPayment(invoiceID, cardID, options, success, error);
                        }, error, new ProcessOut_1.ActionHandlerOptions(ProcessOut_1.ActionHandlerOptions.ThreeDSChallengeFlow));
                        break;
                    case "fingerprint":
                        this.handleAction(data.customer_action.value, nextStep, error, new ProcessOut_1.ActionHandlerOptions(ProcessOut_1.ActionHandlerOptions.ThreeDSFingerprintFlow));
                        break;
                    case "redirect":
                        this.handleAction(data.customer_action.value, nextStep, error, new ProcessOut_1.ActionHandlerOptions(ProcessOut_1.ActionHandlerOptions.ThreeDSChallengeFlow));
                        break;
                    default:
                        error(new ProcessOut_1.Exception("processout-js.wrong-type-for-action", "The customer action type " + data.customer_action.type + " is not supported."));
                        break;
                }
            }.bind(this), function (req, e) {
                error(new ProcessOut_1.Exception("processout-js.network-issue"));
            });
        };
        return ProcessOut;
    }());
    ProcessOut_1.ProcessOut = ProcessOut;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Modal = (function () {
        function Modal(instance, iframe, uniqId) {
            this.deleted = false;
            this.timeout = 10000;
            this.instance = instance;
            this.iframe = iframe;
            this.uniqId = uniqId;
        }
        Modal.prototype.show = function (options, onHide, onError) {
            var onShow = options;
            var onPayment, onPaymentError, hideAfterSuccessTimeout;
            if (typeof (options) == 'object') {
                onShow = options.onShow;
                onHide = options.onHide;
                onError = options.onError;
                onPayment = options.onPayment;
                onPaymentError = options.onPaymentError;
                hideAfterSuccessTimeout = options.hideAfterSuccessTimeout;
            }
            if (hideAfterSuccessTimeout == null)
                hideAfterSuccessTimeout = 2500;
            var modal = this;
            var iframe = modal.iframe;
            var iframeW = iframe.contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(JSON.stringify({
                namespace: ProcessOut.Message.modalNamespace,
                frameID: frameid,
                action: "check"
            }), "*");
            var redirectTimeout = setTimeout(function () {
                if (typeof (onError) === typeof (Function))
                    onError(modal, new ProcessOut.Exception("processout-js.modal.unavailable"));
            }, this.timeout);
            window.addEventListener("message", function (event) {
                var data = ProcessOut.Message.parseEvent(event);
                if (data.frameID != frameid)
                    return;
                if (data.namespace != ProcessOut.Message.modalNamespace)
                    return;
                switch (data.action) {
                    case "openModal":
                        clearTimeout(redirectTimeout);
                        document.body.style.overflow = "hidden";
                        window.addEventListener("resize", function (event) {
                            iframe.width = window.outerWidth + "px";
                            iframe.height = window.outerHeight + "px";
                        });
                        if (typeof (Event) === "function") {
                            var devent = new Event("resize");
                        }
                        else {
                            var devent = document.createEvent("Event");
                            event.initEvent("resize", true, true);
                        }
                        window.dispatchEvent(devent);
                        iframe.style.display = "block";
                        iframeW.postMessage(JSON.stringify({
                            namespace: ProcessOut.Message.modalNamespace,
                            frameID: frameid,
                            action: "launch"
                        }), "*");
                        if (typeof (onShow) === typeof (Function))
                            onShow(modal);
                        break;
                    case "closeModal":
                        modal.hide();
                        if (typeof (onHide) === typeof (Function))
                            onHide(modal);
                        break;
                    case "error":
                        clearTimeout(redirectTimeout);
                        if (typeof (onError) === typeof (Function))
                            onError(modal, new ProcessOut.Exception(data.errorCode, data.errorMessage));
                        break;
                    case "onPayment":
                        if (typeof (onPayment) === typeof (Function))
                            onPayment(modal, data.data);
                        if (hideAfterSuccessTimeout > 0) {
                            setTimeout(function () {
                                modal.hide();
                            }, hideAfterSuccessTimeout);
                        }
                        break;
                    case "onPaymentError":
                        if (typeof (onPaymentError) === typeof (Function))
                            onPaymentError(modal, new ProcessOut.Exception(data.errorCode, data.errorMessage));
                        break;
                    default:
                        console.log("Could not read event action from modal.", event.data);
                        break;
                }
            }, false);
        };
        Modal.prototype.hide = function () {
            this.iframe.style.display = "none";
            document.body.style.overflow = "";
            this.iframe.remove();
            this.deleted = true;
        };
        Modal.prototype.isDeleted = function () {
            return this.deleted;
        };
        return Modal;
    }());
    ProcessOut.Modal = Modal;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Message = (function () {
        function Message() {
        }
        Message.parseEvent = function (e) {
            try {
                var d = JSON.parse(e.data);
                return d;
            }
            catch (e) {
                return new Message();
            }
        };
        Message.modalNamespace = "processout.modal";
        Message.checkoutNamespace = "processout.checkout";
        Message.fieldNamespace = "processout.field";
        return Message;
    }());
    ProcessOut.Message = Message;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var MockedIFrameWindow = (function () {
        function MockedIFrameWindow(el, iframe) {
            this.element = el;
            this.iframe = iframe;
            window.addEventListener("resize", function (event) {
                var width = Math.max(window.outerWidth, window.innerWidth);
                this.element.style.width = width + "px";
                var height = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
                this.element.style.height = height + "px";
            }.bind(this));
            if (typeof (Event) === "function") {
                var event = new Event("resize");
            }
            else {
                var event = document.createEvent("Event");
                event.initEvent("resize", true, true);
            }
            window.dispatchEvent(event);
        }
        MockedIFrameWindow.prototype.open = function (url) {
            this.iframe.setAttribute("src", url);
            document.body.style.overflow = "hidden";
            document.body.appendChild(this.element);
        };
        MockedIFrameWindow.prototype.close = function () {
            document.body.style.overflow = "";
            this.closed = true;
            this.element.remove();
        };
        return MockedIFrameWindow;
    }());
    var ActionFlow;
    (function (ActionFlow) {
        ActionFlow[ActionFlow["NewTab"] = 0] = "NewTab";
        ActionFlow[ActionFlow["NewWindow"] = 1] = "NewWindow";
        ActionFlow[ActionFlow["IFrame"] = 2] = "IFrame";
        ActionFlow[ActionFlow["FingerprintIframe"] = 3] = "FingerprintIframe";
    })(ActionFlow = ProcessOut.ActionFlow || (ProcessOut.ActionFlow = {}));
    var ActionHandlerOptions = (function () {
        function ActionHandlerOptions(actionType, gatewayLogo) {
            this.gatewayLogo = gatewayLogo;
            switch (actionType) {
                case ActionHandlerOptions.ThreeDSChallengeFlow:
                    this.flow = ActionFlow.IFrame;
                    break;
                case ActionHandlerOptions.ThreeDSFingerprintFlow:
                    this.flow = ActionFlow.FingerprintIframe;
                    break;
                case "paypal":
                case "paypalexpresscheckout":
                    this.flow = ActionFlow.NewWindow;
                    this.newWindowHeight = 645;
                    this.newWindowWidth = 450;
                    break;
                case "test-credit-card":
                case "test-alternative-payment":
                    this.flow = ActionFlow.NewWindow;
                    this.newWindowHeight = 645;
                    this.newWindowWidth = 450;
                    break;
                default:
                    this.flow = ActionFlow.NewTab;
            }
        }
        ActionHandlerOptions.ThreeDSChallengeFlow = "three-d-s-challenge-flow";
        ActionHandlerOptions.ThreeDSFingerprintFlow = "three-d-s-fingerprint-flow";
        return ActionHandlerOptions;
    }());
    ProcessOut.ActionHandlerOptions = ActionHandlerOptions;
    var ActionHandler = (function () {
        function ActionHandler(instance, options) {
            this.canceled = false;
            this.instance = instance;
            this.options = options;
            if (!this.options)
                this.options = new ActionHandlerOptions();
            if (this.options.flow == ActionFlow.IFrame) {
                var iframeWrapper = document.createElement("div");
                iframeWrapper.id = "processoutjs-action-modal";
                iframeWrapper.style.position = "fixed";
                iframeWrapper.style.top = "0";
                iframeWrapper.style.left = "0";
                iframeWrapper.style.height = "100%";
                iframeWrapper.style.width = "100%";
                iframeWrapper.setAttribute("style", "position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 9999999; overflow: auto;");
                var iframe = document.createElement("iframe");
                iframe.setAttribute("style", "margin: 1em auto; width: 440px; height: 480px; max-width: 100%; max-height: 100%; display: block; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); background-color: #ECEFF1; background-image: url(\"" + this.instance.endpoint("js", "/images/loader.gif") + "\"); background-repeat: no-repeat; background-position: center;\")");
                iframe.setAttribute("frameborder", "0");
                var buttonWrapper = document.createElement("div");
                buttonWrapper.setAttribute("style", "width: 100%; text-align: center; margin-bottom: 1em;");
                var button = document.createElement("div");
                button.setAttribute("style", "cursor: pointer; color: white;");
                button.innerHTML = "Cancel";
                buttonWrapper.appendChild(button);
                iframeWrapper.appendChild(iframe);
                iframeWrapper.appendChild(buttonWrapper);
                this.iframeWrapper = new MockedIFrameWindow(iframeWrapper, iframe);
                button.onclick = function () {
                    this.iframeWrapper.close();
                }.bind(this);
            }
        }
        ActionHandler.prototype.handle = function (url, success, error) {
            var _a, _b;
            var t = this;
            var timeout;
            var topLayer;
            var newWindow;
            var refocus = function () {
                if (topLayer)
                    topLayer.remove();
                window.focus();
            };
            switch (this.options.flow) {
                case ActionFlow.NewWindow:
                    (_a = this.createNewWindow(url), topLayer = _a.topLayer, newWindow = _a.newWindow);
                    break;
                case ActionFlow.IFrame:
                    newWindow = this.iframeWrapper;
                    newWindow.open(url);
                    break;
                case ActionFlow.FingerprintIframe:
                    newWindow = this.createFingerprintIFrame();
                    newWindow.open(url);
                    timeout = setTimeout(function () {
                        error(new ProcessOut.Exception("three-d-s-2.fingerprint-timed-out"));
                    }, 10000);
                    break;
                default:
                    (_b = this.createNewTab(url), topLayer = _b.topLayer, newWindow = _b.newWindow);
            }
            if (!newWindow) {
                error(new ProcessOut.Exception("customer.popup-blocked"));
                refocus();
                return null;
            }
            var timer = setInterval(function () {
                if (!timer)
                    return;
                if (t.isCanceled()) {
                    clearInterval(timer);
                    timer = null;
                    newWindow.close();
                    error(new ProcessOut.Exception("customer.canceled"));
                    refocus();
                    return;
                }
                var cancelf = function () {
                    clearInterval(timer);
                    timer = null;
                    error(new ProcessOut.Exception("customer.canceled"));
                    refocus();
                };
                try {
                    if (!newWindow || newWindow.closed) {
                        cancelf();
                    }
                }
                catch (err) {
                    try {
                        newWindow.close();
                    }
                    catch (err) { }
                    cancelf();
                }
            });
            this.listenEvents(newWindow, timer, refocus, function (data) {
                if (timeout)
                    clearTimeout(timeout);
                success(data);
            }, function (err) {
                if (timeout)
                    clearTimeout(timeout);
                error(err);
            });
            return this;
        };
        ActionHandler.prototype.createNewTab = function (url) {
            return this.setupWindowObject(window.open(url, '_blank'));
        };
        ActionHandler.prototype.createNewWindow = function (url) {
            var h = this.options.newWindowHeight;
            var w = this.options.newWindowWidth;
            var y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
            var x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
            return this.setupWindowObject(window.open(url, '', "menubar=false,toolbar=false,width=" + w + ",height=" + h + ",top=" + y + ",left=" + x));
        };
        ActionHandler.prototype.setupWindowObject = function (newWindow) {
            if (!newWindow) {
                return {};
            }
            var ret = {
                topLayer: null,
                newWindow: newWindow
            };
            var onunload = function (e) {
                try {
                    ret.newWindow.close();
                }
                catch (err) {
                }
            };
            window.addEventListener("beforeunload", onunload, false);
            window.addEventListener("pagehide", onunload, false);
            ret.topLayer = document.createElement("div");
            ret.topLayer.id = "processoutjs-action-modal";
            ret.topLayer.setAttribute("style", "position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.7); z-index: 9999999; overflow: auto; height: 100%; width: 100%; cursor: pointer;");
            ret.topLayer.addEventListener("click", function () {
                ret.newWindow.focus();
            }, false);
            var topLayerMessage = document.createElement("div");
            topLayerMessage.setAttribute("style", "text-align: center; margin-top: 10%;");
            if (this.options.gatewayLogo) {
                var topLayerMessageImage = document.createElement("img");
                topLayerMessageImage.setAttribute("style", "max-height: 30px; max-width: 250px; filter: brightness(0) invert(1);");
                topLayerMessageImage.setAttribute("src", this.options.gatewayLogo);
                topLayerMessage.appendChild(topLayerMessageImage);
            }
            ret.topLayer.appendChild(topLayerMessage);
            document.body.appendChild(ret.topLayer);
            return ret;
        };
        ActionHandler.prototype.createFingerprintIFrame = function () {
            var iframeWrapper = document.createElement("div");
            iframeWrapper.id = "processoutjs-fingerprint-wrapper";
            iframeWrapper.style.height = "0";
            iframeWrapper.style.width = "0";
            var iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.setAttribute("frameborder", "0");
            iframeWrapper.appendChild(iframe);
            var wrapper = new MockedIFrameWindow(iframeWrapper, iframe);
            return wrapper;
        };
        ActionHandler.prototype.listenEvents = function (newWindow, timer, refocus, success, error) {
            ActionHandler.listenerCount++;
            var cur = ActionHandler.listenerCount;
            window.addEventListener("message", function (event) {
                var data = ProcessOut.Message.parseEvent(event);
                if (data.namespace != ProcessOut.Message.checkoutNamespace)
                    return;
                if (ActionHandler.listenerCount != cur) {
                    if (timer) {
                        clearInterval(timer);
                        timer = null;
                    }
                    return;
                }
                switch (data.action) {
                    case "success":
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        newWindow.close();
                        success(data.data);
                        refocus();
                        break;
                    case "canceled":
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        newWindow.close();
                        error(new ProcessOut.Exception("customer.canceled"));
                        refocus();
                        break;
                    case "none":
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        newWindow.close();
                        error(new ProcessOut.Exception("processout-js.no-customer-action"));
                        refocus();
                        break;
                    case "error":
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        newWindow.close();
                        error(new ProcessOut.Exception(data.errorCode, data.errorMessage));
                        refocus();
                        break;
                    default:
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        newWindow.close();
                        error(new ProcessOut.Exception("default"));
                        refocus();
                        break;
                }
            });
        };
        ActionHandler.prototype.cancel = function () {
            this.canceled = true;
        };
        ActionHandler.prototype.isCanceled = function () {
            return this.canceled;
        };
        ActionHandler.listenerCount = 0;
        return ActionHandler;
    }());
    ProcessOut.ActionHandler = ActionHandler;
})(ProcessOut || (ProcessOut = {}));

;ProcessOut.DEBUG = true;
