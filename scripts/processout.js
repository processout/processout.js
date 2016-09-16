var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ProcessOut;
(function (ProcessOut_1) {
    var ProcessOut = (function () {
        function ProcessOut(projectID) {
            this.timeout = 10000;
            this.debug = false;
            var scripts = document.getElementsByTagName("script");
            var ok = false;
            for (var i = 0; i < scripts.length; i++) {
                if (/^https?:\/\/cdn\.processout\.((com)|(ninja)|(dev))\//.test(scripts[i].getAttribute("src"))) {
                    ok = true;
                }
            }
            if (!ok) {
                throw new ProcessOut_1.Exception("processout-js.not-hosted");
            }
            this.projectID = projectID;
            if (this.projectID == "") {
                console.log("No project ID was specified, skipping setup.");
                return;
            }
        }
        ProcessOut.prototype.setGateways = function (gateways) {
            for (var _i = 0, gateways_1 = gateways; _i < gateways_1.length; _i++) {
                var gc = gateways_1[_i];
                var g = ProcessOut_1.Gateways.Handler.buildGateway(this, gc);
                this.gateways.push(g);
            }
        };
        ProcessOut.prototype.endpoint = function (subdomain, path) {
            return "https://" + subdomain + ".processout.com" + path;
        };
        ProcessOut.prototype.apiRequest = function (method, path, data, success, error) {
            if (method != "get")
                data = JSON.stringify(data);
            else {
                path += "?";
                for (var key in data) {
                    path += key + "=" + encodeURIComponent(data[key]) + "&";
                }
            }
            var request = new XMLHttpRequest();
            request.open(method, this.endpoint("api", path), true);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("API-Version", "1.1.0.0");
            request.setRequestHeader("Authorization", "Basic " + btoa(this.projectID + ":"));
            request.onload = function () {
                if (request.status >= 200 && request.status < 300) {
                    success(JSON.parse(request.responseText), request.status, request);
                    return;
                }
                error(request.status, request);
            };
            request.onerror = function () {
                error(request.status, request);
            };
            request.send(data);
        };
        ProcessOut.prototype.newModal = function (url, success, error) {
            var uniqId = Math.random().toString(36).substr(2, 9);
            var iframe = document.createElement('iframe');
            iframe.className = "processout-iframe";
            iframe.setAttribute("id", "processout-iframe-" + uniqId);
            iframe.setAttribute("src", url);
            iframe.setAttribute("style", "position: fixed; top: 0; left: 0; background: none;"
                + "-webkit-transform:translateZ(1px);\n                    -moz-transform:translateZ(1px);\n                    -o-transform:translateZ(1px);\n                    transform:translateZ(1px);");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowtransparency", "1");
            iframe.style.display = "none";
            var t = this;
            var iframeError = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error(new ProcessOut_1.Exception("processout-js.modal.unavailable"));
            }, this.timeout);
            iframe.onload = function () {
                clearTimeout(iframeError);
                if (typeof (success) === typeof (Function))
                    success(new ProcessOut_1.Modal(t, iframe, uniqId));
            };
            document.body.appendChild(iframe);
        };
        return ProcessOut;
    }());
    ProcessOut_1.ProcessOut = ProcessOut;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Modal = (function () {
        function Modal(instance, iframe, uniqId) {
            this.namespace = 'processout';
            this.deleted = false;
            this.instance = instance;
            this.iframe = iframe;
            this.uniqId = uniqId;
        }
        Modal.prototype.show = function (onShow, onHide, error) {
            var modal = this;
            var iframe = modal.iframe;
            var iframeW = iframe.contentWindow;
            var frameid = modal.uniqId;
            iframeW.postMessage(this.namespace + " " + frameid + " check", "*");
            var redirectTimeout = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error(new ProcessOut.Exception("processout-js.modal.unavailable"));
            }, this.instance.timeout);
            function receiveMessage(event) {
                var eventSplit = event.data.split(" ");
                if (eventSplit[0] != modal.namespace)
                    return;
                if (eventSplit[1] != frameid)
                    return;
                switch (eventSplit[2]) {
                    case "openModal":
                        clearTimeout(redirectTimeout);
                        document.body.style.overflow = "hidden";
                        window.onresize = function () {
                            iframe.width = window.outerWidth + "px";
                            iframe.height = window.outerHeight + "px";
                        };
                        window.dispatchEvent(new Event('resize'));
                        iframe.style.display = "block";
                        iframeW.postMessage(modal.namespace + " " + frameid + " launch", "*");
                        if (typeof (onShow) === typeof (Function))
                            onShow(this);
                        break;
                    case "closeModal":
                        modal.hide();
                        if (typeof (onHide) === typeof (Function))
                            onHide(this);
                        break;
                    case "url":
                        window.location.href = eventSplit[3];
                        break;
                    default:
                        console.log("Could not read event action from modal.", event.data);
                        break;
                }
            }
            window.addEventListener("message", receiveMessage, false);
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
    (function (Flow) {
        Flow[Flow["None"] = 1] = "None";
        Flow[Flow["OneOff"] = 2] = "OneOff";
        Flow[Flow["Subscription"] = 3] = "Subscription";
        Flow[Flow["Tokenization"] = 4] = "Tokenization";
    })(ProcessOut.Flow || (ProcessOut.Flow = {}));
    var Flow = ProcessOut.Flow;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Exception = (function (_super) {
        __extends(Exception, _super);
        function Exception() {
            _super.apply(this, arguments);
        }
        Exception.prototype.construct = function (code, message) {
            this.code = code;
            if (message)
                this.message = message;
            else
                this.message = ProcessOut.Translator.translate(this.code);
            this.name = this.code;
            this.stack = (new Error()).stack;
        };
        return Exception;
    }(Error));
    ProcessOut.Exception = Exception;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var messages = {
        "en": {
            "default": "An error occured.",
            "card.declined": "The credit card has been declined.",
            "card.expired": "The given card has exprired.",
            "card.invalid": "The given card is invalid.",
            "card.invalid-number": "The card number is invalid.",
            "card.invalid-date": "The card expiry date is invalid.",
            "card.invalid-month": "The card expiry month is invalid.",
            "card.invalid-year": "The card expiry year is invalid.",
            "card.invalid-cvc": "The card CVC is invalid.",
            "card.invalid-zip": "The card's ZIP code is valid.",
            "customer.canceled": "The customer canceled the payemnt.",
            "payment.declined": "The payment has been declined.",
            "request.validation.error": "The provided information is invalid or missing.",
            "request.validation.invalid-country": "The provided country is invalid.",
            "request.validation.missing-name": "A name must be provided.",
            "request.validation.invalid-name": "The provided name is invalid.",
            "request.validation.missing-email": "An email must be provided.",
            "request.validation.invalid-email": "The provided email is invalid.",
            "request.validation.invalid-address": "The provided address is invalid.",
            "request.gateway.not-available": "The requested gateway is currently unavailable.",
            "request.gateway.not-supported": "The gateway is not supported by ProcessOut.js",
            "processout-js.not-hosted": "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://cdn.processout.com/processout-min.js",
            "processout-js.modal.unavailable": "The ProcessOut.js modal is unavailable."
        }
    };
    var Translator = (function () {
        function Translator() {
        }
        Translator.translate = function (code) {
            if (!messages[Translator.locale][code])
                return messages[Translator.locale]["default"];
            return messages[Translator.locale][code];
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
    var GatewayConfiguration = (function () {
        function GatewayConfiguration() {
        }
        return GatewayConfiguration;
    }());
    ProcessOut.GatewayConfiguration = GatewayConfiguration;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var Handler = (function () {
            function Handler() {
            }
            Handler.buildGateway = function (p, gatewayConfiguration) {
                switch (gatewayConfiguration.gateway.name) {
                    case "stripe":
                        return new Gateways.StripeGateway(gatewayConfiguration, p.debug);
                    case "checkoutcom":
                        return new Gateways.CheckoutcomGateway(gatewayConfiguration, p.debug);
                    case "adyen":
                        return new Gateways.AdyenGateway(gatewayConfiguration, p.debug);
                }
                throw new ProcessOut.Exception("request.gateway.not-supported");
            };
            return Handler;
        }());
        Gateways.Handler = Handler;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var Gateway = (function () {
            function Gateway(gatewayConfiguration, debug) {
                this.configurationID = gatewayConfiguration.id;
                this.publicKeys = gatewayConfiguration.public_keys;
                this.debug = debug;
            }
            Gateway.prototype.getPublicKey = function (key) {
                for (var _i = 0, _a = this.publicKeys; _i < _a.length; _i++) {
                    var v = _a[_i];
                    if (v.key == key) {
                        return v.value;
                    }
                }
                return "";
            };
            Gateway.prototype.setup = function () {
            };
            return Gateway;
        }());
        Gateways.Gateway = Gateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var StripeGateway = (function (_super) {
            __extends(StripeGateway, _super);
            function StripeGateway(gatewayConfiguration, debug) {
                _super.call(this, gatewayConfiguration, debug);
            }
            StripeGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://js.stripe.com/v2/");
                document.body.appendChild(f);
            };
            StripeGateway.prototype.tokenize = function (card, success, error) {
            };
            return StripeGateway;
        }(Gateways.Gateway));
        Gateways.StripeGateway = StripeGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var CheckoutcomGateway = (function (_super) {
            __extends(CheckoutcomGateway, _super);
            function CheckoutcomGateway(gatewayConfiguration, debug) {
                _super.call(this, gatewayConfiguration, debug);
            }
            CheckoutcomGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.debug)
                    f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
                else
                    f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
                f.setAttribute("data-namespace", "CKOAPI");
                document.body.appendChild(f);
            };
            CheckoutcomGateway.prototype.tokenize = function (card, success, error) {
            };
            return CheckoutcomGateway;
        }(Gateways.Gateway));
        Gateways.CheckoutcomGateway = CheckoutcomGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var AdyenGateway = (function (_super) {
            __extends(AdyenGateway, _super);
            function AdyenGateway(gatewayConfiguration, debug) {
                _super.call(this, gatewayConfiguration, debug);
            }
            AdyenGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");
                document.body.appendChild(f);
            };
            AdyenGateway.prototype.tokenize = function (card, success, error) {
            };
            return AdyenGateway;
        }(Gateways.Gateway));
        Gateways.AdyenGateway = AdyenGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Expiry = (function () {
        function Expiry(month, year) {
            this.month = month;
            this.year = year;
            if (this.year < 2000) {
                this.year += 2000;
            }
        }
        Expiry.parse = function (exp) {
            var exps = exp.split(" / ");
            if (exps.length <= 1) {
                exps = exp.split("/");
                if (exps.length <= 1)
                    return null;
            }
            return new Expiry(Number(exps[0]), Number(exps[1]));
        };
        Expiry.prototype.getMonth = function () {
            return this.month;
        };
        Expiry.prototype.getYear = function () {
            return this.year;
        };
        Expiry.prototype.string = function () {
            return this.month + "/" + this.year;
        };
        Expiry.formatExpiry = function (exp) {
            if (exp.length == 2)
                return exp + " / ";
            if (exp.length == 4)
                return exp.slice(0, -3);
            return exp;
        };
        return Expiry;
    }());
    ProcessOut.Expiry = Expiry;
    var Card = (function () {
        function Card(number, expiry, cvc) {
            this.number = number.replace(/ /gi, "").replace(/\-/gi, "").replace(/\-/gi, "");
            this.cvc = cvc;
            this.expiry = expiry;
        }
        Card.formatNumber = function (number) {
            var v = number.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
            var matches = v.match(/\d{4,16}/g);
            var match = matches && matches[0] || "";
            var parts = [];
            for (var i = 0; i < match.length; i += 4) {
                parts.push(match.substring(i, i + 4));
            }
            if (!parts.length)
                return number;
            return parts.join(" ");
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
        Card.prototype.setExpiry = function (exp) {
            this.expiry = exp;
        };
        Card.prototype.validate = function () {
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
        };
        return Card;
    }());
    ProcessOut.Card = Card;
})(ProcessOut || (ProcessOut = {}));
