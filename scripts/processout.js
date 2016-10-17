var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    var GatewayConfiguration = (function () {
        function GatewayConfiguration() {
        }
        return GatewayConfiguration;
    }());
    ProcessOut.GatewayConfiguration = GatewayConfiguration;
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
            "processout-js.not-hosted": "ProcessOut.js was not loaded from ProcessOut CDN. Please do not host ProcessOut.js yourself but rather use ProcessOut CDN: https://js.processout.com/processout.js",
            "processout-js.modal.unavailable": "The ProcessOut.js modal is unavailable.",
            "processout-js.invalid-config": "The provided gateway configuration is invalid.",
            "resource.invalid-type": "The provided resource was invalid. It must be an invoice, a subscription or an authorization request."
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
        return Translator;
    }());
    Translator.locale = "en";
    ProcessOut.Translator = Translator;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Exception = (function (_super) {
        __extends(Exception, _super);
        function Exception(code, message) {
            var _this;
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
    var ProcessOut = (function () {
        function ProcessOut(resourceID, debug) {
            this.timeout = 10000;
            this.debug = false;
            this.host = "processout.com";
            this.apiVersion = "1.3.0.0";
            this.gateways = new Array();
            if (debug != null)
                this.debug = debug;
            var scripts = document.getElementsByTagName("script");
            var jsHost = "";
            for (var i = 0; i < scripts.length; i++) {
                if (/^https?:\/\/.*\.processout\.((com)|(ninja)|(dev))\//.test(scripts[i].getAttribute("src"))) {
                    jsHost = scripts[i].getAttribute("src");
                }
            }
            if (jsHost == "" && !this.isDebug()) {
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
            this.resourceID = resourceID;
            if (this.resourceID.substring(0, 3) != "iv_" &&
                this.resourceID.substring(0, 4) != "sub_" &&
                this.resourceID.substring(0, 9) != "auth_req_" &&
                this.resourceID != "") {
                throw new ProcessOut_1.Exception("resource.invalid-type");
            }
        }
        ProcessOut.prototype.getResourceID = function () {
            return this.resourceID;
        };
        ProcessOut.prototype.isDebug = function () {
            return this.debug;
        };
        ProcessOut.prototype.setGateways = function (gateways) {
            for (var _i = 0, gateways_1 = gateways; _i < gateways_1.length; _i++) {
                var gc = gateways_1[_i];
                if (gc.id == "")
                    throw new ProcessOut_1.Exception("processout-js.invalid-config", "The gateway configuration must contain an ID.");
                var g = ProcessOut_1.Gateways.Handler.buildGateway(this, gc);
                this.gateways.push(g);
            }
        };
        ProcessOut.prototype.tokenize = function (card, success, error) {
            if (this.gateways.length == 0) {
                throw new ProcessOut_1.Exception("request.gateway.not-available", "No gateway is available to tokenize a credit card.");
            }
            this.gateways[0].tokenize(card, success, error);
        };
        ProcessOut.prototype.endpoint = function (subdomain, path) {
            return "https://" + subdomain + "." + this.host + "/" + path;
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
            if (path.substring(0, 4) != "http" && path[0] != "/")
                path = this.endpoint("api", path);
            var request = new XMLHttpRequest();
            request.open(method, path, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("API-Version", this.apiVersion);
            request.onload = function (e) {
                if (e.currentTarget.readyState == 4)
                    success(JSON.parse(request.responseText), request.status, request, e);
                return;
            };
            request.onerror = function (e) {
                console.log(e);
                error(request.status, request, e);
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
    ProcessOut.namespace = "processout";
    ProcessOut_1.ProcessOut = ProcessOut;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Modal = (function () {
        function Modal(instance, iframe, uniqId) {
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
            iframeW.postMessage(ProcessOut.ProcessOut.namespace + " " + frameid + " check", "*");
            var redirectTimeout = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error(new ProcessOut.Exception("processout-js.modal.unavailable"));
            }, this.instance.timeout);
            function receiveMessage(event) {
                var eventSplit = event.data.split(" ");
                if (eventSplit[0] != ProcessOut.ProcessOut.namespace)
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
                        iframeW.postMessage(ProcessOut.ProcessOut.namespace + " " + frameid + " launch", "*");
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
    var Gateways;
    (function (Gateways) {
        var Handler = (function () {
            function Handler() {
            }
            Handler.buildGateway = function (p, gatewayConfiguration) {
                switch (gatewayConfiguration.gateway.name) {
                    case "stripe":
                        return new Gateways.StripeGateway(gatewayConfiguration, p);
                    case "checkoutcom":
                        return new Gateways.CheckoutcomGateway(gatewayConfiguration, p);
                    case "adyen":
                        return new Gateways.AdyenGateway(gatewayConfiguration, p);
                    case "braintree":
                        return new Gateways.BraintreeGateway(gatewayConfiguration, p);
                    case "test-credit-card":
                        return new Gateways.TestGateway(gatewayConfiguration, p);
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
            function Gateway(gatewayConfiguration, instance) {
                this.configuration = gatewayConfiguration;
                this.instance = instance;
                this.setup();
                this.fetchCustomerAction();
            }
            Gateway.prototype.getPublicKey = function (key) {
                if (this.configuration.public_keys[key])
                    return this.configuration.public_keys[key];
                return "";
            };
            Gateway.prototype.fetchCustomerAction = function () {
                var r = this.instance.getResourceID();
                var resourceName = "invoices";
                if (r.substring(0, 4) == "sub_") {
                    resourceName = "subscriptions";
                }
                if (r.substring(0, 9) == "auth_req_") {
                    resourceName = "authorization-requests";
                }
                var url = resourceName + "/" + r + "/gateway-configurations/" + this.configuration.id + "/customer-action";
                var t = this;
                this.instance.apiRequest("GET", url, null, function (data, code, req) {
                    if (code < 200 || code > 299) {
                        return;
                    }
                    t.token = data.customer_action.value;
                }, function (code, req) { });
            };
            Gateway.prototype.createProcessOutToken = function (token) {
                var req = {
                    "gateway_configuration_id": this.configuration.id,
                    "url": "",
                    "method": "POST",
                    "headers": {
                        "content-type": "applicatio/json"
                    },
                    "body": JSON.stringify({ "token": token })
                };
                return "gway_req_" + btoa(JSON.stringify(req));
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
            function StripeGateway(gatewayConfiguration, instance) {
                return _super.call(this, gatewayConfiguration, instance) || this;
            }
            StripeGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://js.stripe.com/v2/");
                document.body.appendChild(f);
            };
            StripeGateway.convertError = function (code) {
                var map = {
                    "invalid_number": "card.invalid-number",
                    "invalid_expiry_month": "card.invalid-date",
                    "invalid_expiry_year": "card.invalid-date",
                    "invalid_cvc": "card.invalid-cvc",
                    "incorrect_number": "card.invalid-number",
                    "expired_Card": "card.expired",
                    "incorrect_cvc": "card.invalid-cvc",
                    "incorrect_zip": "card.invalid-zip",
                    "card_declined": "card.declined"
                };
                if (map[code])
                    return map[code];
                return "default";
            };
            StripeGateway.prototype.tokenize = function (card, success, error) {
                var t = this;
                Stripe.setPublishableKey(this.getPublicKey("public_key"));
                Stripe.card.createToken({
                    number: card.getNumber(),
                    exp: card.getExpiry().string(),
                    cvc: card.getCVC()
                }, function (status, response) {
                    if (response.error) {
                        error(new ProcessOut.Exception(StripeGateway.convertError(response.error.code)));
                        return;
                    }
                    success(t.createProcessOutToken(response.id));
                });
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
            function CheckoutcomGateway(gatewayConfiguration, instance) {
                return _super.call(this, gatewayConfiguration, instance) || this;
            }
            CheckoutcomGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.instance.isDebug())
                    f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
                else
                    f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
                f.setAttribute("data-namespace", "CKOAPI");
                document.body.appendChild(f);
            };
            CheckoutcomGateway.prototype.tokenize = function (card, success, error) {
                CKOAPI.configure({
                    publicKey: this.getPublicKey("public_key"),
                    apiError: function (event) {
                        if (event.data.errorCode == "70000") {
                            error(new ProcessOut.Exception("default"));
                            return;
                        }
                        error(new ProcessOut.Exception("card.declined"));
                    }
                });
                var t = this;
                CKOAPI.createCardToken({
                    "number": card.getNumber(),
                    "cvv": card.getCVC(),
                    "expiryMonth": card.getExpiry().getMonth(),
                    "expiryYear": card.getExpiry().getYear()
                }, function (v) {
                    if (!v.id) {
                        error(new ProcessOut.Exception("card.declined"));
                        return;
                    }
                    success(t.createProcessOutToken(v.id));
                });
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
            function AdyenGateway(gatewayConfiguration, instance) {
                return _super.call(this, gatewayConfiguration, instance) || this;
            }
            AdyenGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");
                document.body.appendChild(f);
            };
            AdyenGateway.prototype.tokenize = function (card, success, error) {
                var cseInstance = adyen.encrypt.createEncryption(this.getPublicKey("hosted_client_encryption_token"), {
                    enableValidations: false
                });
                success(this.createProcessOutToken(cseInstance.encrypt({
                    number: card.getNumber(),
                    cvc: card.getCVC(),
                    holderName: name,
                    expiryMonth: card.getExpiry().getMonth().toString(),
                    expiryYear: card.getExpiry().getYear().toString(),
                    generationtime: new Date(Date.now()).toISOString()
                })));
            };
            return AdyenGateway;
        }(Gateways.Gateway));
        Gateways.AdyenGateway = AdyenGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var BraintreeGateway = (function (_super) {
            __extends(BraintreeGateway, _super);
            function BraintreeGateway(gatewayConfiguration, instance) {
                return _super.call(this, gatewayConfiguration, instance) || this;
            }
            BraintreeGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://js.braintreegateway.com/web/3.2.0/js/client.min.js");
                document.body.appendChild(f);
            };
            BraintreeGateway.prototype.tokenize = function (card, success, error) {
                var t = this;
                braintree.client.create({
                    authorization: this.token
                }, function (err, client) {
                    if (err) {
                        console.log(err);
                        error(new ProcessOut.Exception("request.gateway.not-available"));
                        return;
                    }
                    client.request({
                        endpoint: 'payment_methods/credit_cards',
                        method: 'post',
                        data: {
                            creditCard: {
                                number: card.getNumber(),
                                expirationDate: card.getExpiry().string(),
                                cvv: card.getCVC()
                            }
                        }
                    }, function (err, response) {
                        if (err) {
                            error(new ProcessOut.Exception("card.declined"));
                            return;
                        }
                        success(t.createProcessOutToken(response.creditCards[0].nonce));
                    });
                });
            };
            return BraintreeGateway;
        }(Gateways.Gateway));
        Gateways.BraintreeGateway = BraintreeGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var TestGateway = (function (_super) {
            __extends(TestGateway, _super);
            function TestGateway(gatewayConfiguration, instance) {
                return _super.call(this, gatewayConfiguration, instance) || this;
            }
            TestGateway.prototype.setup = function () {
            };
            TestGateway.prototype.tokenize = function (card, success, error) {
                if (card.getNumber() != "4242424242424242") {
                    error(new ProcessOut.Exception("card.declined"));
                    return;
                }
                switch (card.getCVC()) {
                    case "666":
                        success(this.createProcessOutToken("test-will-chargeback"));
                        return;
                    case "500":
                        success(this.createProcessOutToken("test-declined"));
                        return;
                    case "600":
                        success(this.createProcessOutToken("test-authorize-only"));
                        return;
                }
                success(this.createProcessOutToken("test-valid"));
            };
            return TestGateway;
        }(Gateways.Gateway));
        Gateways.TestGateway = TestGateway;
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
        Expiry.format = function (exp) {
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
        Card.prototype.getNumber = function () {
            return this.number;
        };
        Card.prototype.getExpiry = function () {
            return this.expiry;
        };
        Card.prototype.getCVC = function () {
            return this.cvc;
        };
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
