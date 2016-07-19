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
            this.cssPrefix = "processout-";
            this.debug = false;
            this.projectID = projectID;
            if (this.projectID == "") {
                console.log("No project ID was specified, skipping setup.");
                return;
            }
            this.setup();
        }
        ProcessOut.prototype.endpoint = function (subdomain, path) {
            return "https://" + subdomain + ".processout.com" + path;
        };
        ProcessOut.prototype.classNames = function () {
            var names = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                names[_i - 0] = arguments[_i];
            }
            var str = "";
            for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
                var n = names_1[_a];
                if (str != "") {
                    str += " ";
                }
            }
            str += this.cssPrefix + n;
            return str;
        };
        ProcessOut.prototype.apiRequest = function (method, path, data, success, error) {
            if (method != "get")
                data = JSON.stringify(data);
            else {
                var formData = new FormData();
                for (var key in data) {
                    formData.append(key, data[key]);
                }
                data = formData;
            }
            if (method == "get")
                path += "?" + formData;
            var request = new XMLHttpRequest();
            request.open(method, this.endpoint("api", path), true);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("API-Version", "1.1.0.0");
            request.setRequestHeader("Authorization", "Basic " + btoa(this.projectID + ":"));
            request.onload = function () {
                if (request.status >= 200 && request.status < 500) {
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
        ProcessOut.prototype.setup = function () {
            this.apiRequest("get", "/gateways", {}, function (data, code, jqxhr) {
                if (!data.success) {
                    throw new Error(data.message);
                }
                for (var _i = 0, _a = data.gateways; _i < _a.length; _i++) {
                    var gateway = _a[_i];
                    var g = ProcessOut_1.Gateways.Handler.buildGateway(this, gateway, "", ProcessOut_1.Flow.None);
                    console.log(g);
                    g.setup();
                }
            }, function () {
                throw new Error("Could not load project's gateways. Are you sure your project ID is valid?");
            });
        };
        ProcessOut.prototype.setCustomer = function (customer) {
            this.customer = customer;
        };
        ProcessOut.prototype.getCustomer = function () {
            return this.customer;
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
            var iframeError = setTimeout(function () {
                if (typeof (error) === typeof (Function))
                    error({
                        code: ProcessOut_1.ErrorCode.ProcessOutUnavailable,
                        message: "Could not properly load the modal."
                    });
            }, this.timeout);
            iframe.onload = function () {
                clearTimeout(iframeError);
                if (typeof (success) === typeof (Function))
                    success(new ProcessOut_1.Modal(this, iframe, uniqId));
            };
            document.body.appendChild(iframe);
        };
        ProcessOut.prototype.findInvoice = function (uid, success, error) {
            var invoice = new ProcessOut_1.Invoice(this);
            invoice.find(uid, success, error);
        };
        ProcessOut.prototype.findRecurringInvoice = function (uid, success, error) {
            var invoice = new ProcessOut_1.RecurringInvoice(this);
            invoice.find(uid, success, error);
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
                    error({
                        message: "The modal does not seem to be available.",
                        code: "modal.unavailable"
                    });
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
    var Invoice = (function () {
        function Invoice(instance) {
            this.instance = instance;
        }
        Invoice.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/invoices/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/invoices/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/invoices/" + uid, ProcessOut.Flow.OneOff);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The invoice's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The invoice could not be found."
                });
            });
        };
        Invoice.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return Invoice;
    }());
    ProcessOut.Invoice = Invoice;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var RecurringInvoice = (function () {
        function RecurringInvoice(instance) {
            this.instance = instance;
        }
        RecurringInvoice.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/recurring-invoices/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/recurring-invoices/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/recurring-invoices/" + uid, ProcessOut.Flow.Recurring);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The recurring invoice's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The recurring invoice could not be found."
                });
            });
        };
        RecurringInvoice.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return RecurringInvoice;
    }());
    ProcessOut.RecurringInvoice = RecurringInvoice;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    (function (Flow) {
        Flow[Flow["None"] = 1] = "None";
        Flow[Flow["OneOff"] = 2] = "OneOff";
        Flow[Flow["Recurring"] = 3] = "Recurring";
        Flow[Flow["OneClickAuthorization"] = 4] = "OneClickAuthorization";
    })(ProcessOut.Flow || (ProcessOut.Flow = {}));
    var Flow = ProcessOut.Flow;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var ErrorCode = (function () {
        function ErrorCode() {
        }
        ErrorCode.ProcessOutUnavailable = "processout.unavailable";
        ErrorCode.ResourceNotFound = "resource.not-found";
        ErrorCode.GatewayError = "gateway.error";
        ErrorCode.GatewayInvalidInput = "gateway.invalid-input";
        return ErrorCode;
    }());
    ProcessOut.ErrorCode = ErrorCode;
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var Handler = (function () {
            function Handler() {
            }
            Handler.buildGateway = function (instance, data, resourceURL, flow) {
                switch (data.name) {
                    case "stripe":
                        return new Gateways.StripeGateway(instance, data, resourceURL, flow);
                    case "checkoutcom":
                        return new Gateways.CheckoutcomGateway(instance, data, resourceURL, flow);
                    case "adyen":
                        return new Gateways.AdyenGateway(instance, data, resourceURL, flow);
                    case "checkoutcom":
                        return new Gateways.GocardlessGateway(instance, data, resourceURL, flow);
                }
                return new Gateways.LinkGateway(instance, data, resourceURL, flow);
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
            function Gateway(instance, data, resourceURL, flow) {
                this.instance = instance;
                this.resourceURL = resourceURL;
                this.flow = flow;
                this.name = data.name;
                this.displayName = data.display_name;
                this.publicKeys = data.public_keys;
                this.supportedMethod = data.supported_methods;
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
            Gateway.prototype.getCustomerObject = function () {
                if (!this.instance.customer) {
                    return {};
                }
                return {
                    email: this.instance.customer.Email,
                    first_name: this.instance.customer.FirstName,
                    last_name: this.instance.customer.LastName,
                    address1: this.instance.customer.Address1,
                    address2: this.instance.customer.Address2,
                    city: this.instance.customer.City,
                    state: this.instance.customer.State,
                    zip: this.instance.customer.ZIP,
                    country_code: this.instance.customer.CountryCode
                };
            };
            Gateway.prototype.getEndpoint = function (async) {
                switch (this.flow) {
                    case ProcessOut.Flow.OneOff:
                        if (!async)
                            return this.resourceURL + ("/gateways/" + this.name);
                        else
                            return this.resourceURL + ("/gateways/" + this.name + "/charges");
                    case ProcessOut.Flow.Recurring:
                    case ProcessOut.Flow.OneClickAuthorization:
                        if (!async)
                            return this.resourceURL + ("/gateways/" + this.name);
                        else
                            return this.resourceURL + ("/gateways/" + this.name + "/tokens");
                    default:
                        throw new Error("Could not find flow.");
                }
            };
            Gateway.prototype.htmlLink = function () {
                return "<form action=\"\" method=\"POST\" class=\"" + this.instance.classNames('link-form') + "\">\n                        <div class=\"" + this.instance.classNames('link-submit-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('link-submit-lower-wrapper') + "\">\n                                <input type=\"submit\" class=\"" + this.instance.classNames('link-submit') + "\" value=\"Pay now!\">\n                            </div>\n                        </div>\n                    </form>";
            };
            Gateway.prototype._htmlCreditCard = function () {
                return "    <div class=\"" + this.instance.classNames('credit-card-number-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-number-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-number-label') + "\">Card number</label>\n                                <input type=\"text\" size=\"20\" placeholder=\"8888 8888 8888 8888\" autocomplete=\"cc-number\" class=\"" + this.instance.classNames('credit-card-number-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-expiry-month-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-expiry-month-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-expiry-month-label') + "\">Expiry month</label>\n                                <input type=\"text\" placeholder=\"MM\" autocomplete=\"cc-exp-month\" class=\"" + this.instance.classNames('credit-card-expiry-month-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-expiry-year-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-expiry-year-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-expiry-year-label') + "\">Expiry year</label>\n                                <input type=\"text\" placeholder=\"YYYY\" autocomplete=\"cc-exp-year\" class=\"" + this.instance.classNames('credit-card-expiry-year-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-cvc-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-cvc-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-cvc-label') + "\">CVC</label>\n                                <input type=\"text\" size=\"4\" placeholder=\"123\" autocomplete=\"off\" class=\"" + this.instance.classNames('credit-card-cvc-input') + "\" />\n                            </div>\n                        </div>\n\n                        <div class=\"" + this.instance.classNames('credit-card-submit-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-submit-lower-wrapper') + "\">\n                                <input type=\"submit\" class=\"" + this.instance.classNames('credit-card-submit') + "\" value=\"Pay now!\">\n                            </div>\n                        </div>";
            };
            Gateway.prototype.htmlCreditCard = function () {
                return "<form action=\"#\" method=\"POST\" class=\"" + this.instance.classNames('credit-card-form') + "\">\n                        " + this._htmlCreditCard() + "\n                    </form>";
            };
            Gateway.prototype.htmlCreditCardWithName = function () {
                return "<form action=\"#\" method=\"POST\" class=\"" + this.instance.classNames('credit-card-form', 'credit-card-form-name') + "\">\n                        <div class=\"" + this.instance.classNames('credit-card-name-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-name-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-name-label') + "\">Card holder name</label>\n                                <input type=\"text\" size=\"20\" placeholder=\"John Smith\" class=\"" + this.instance.classNames('credit-card-name-input') + "\" />\n                            </div>\n                        </div>\n                        " + this._htmlCreditCard() + "\n                    </form>";
            };
            Gateway.prototype.htmlSEPA = function () {
                return "SEPA payments are not supported yet.";
            };
            Gateway.prototype.appendTo = function (root) {
                if (root.jquery)
                    root = root[0];
                var div = document.createElement("div");
                div.innerHTML = this.html();
                root.appendChild(div);
                var form = div.firstChild.querySelector("form");
                return form;
            };
            Gateway.prototype.hook = function (el, success, error) {
                if (el.jquery)
                    el = el[0];
                var t = this;
                el.onsubmit = function () {
                    t.handle(el, success, error);
                    return false;
                };
            };
            Gateway.prototype.setup = function () {
            };
            Gateway.prototype.handle = function (el, success, error) {
                switch (this.flow) {
                    case ProcessOut.Flow.OneOff:
                        return this.handleOneOff(el, success, error);
                    case ProcessOut.Flow.Recurring:
                        return this.handleRecurring(el, success, error);
                    case ProcessOut.Flow.OneClickAuthorization:
                        return this.handleOneClickAuthorization(el, success, error);
                    default:
                        throw new Error("The flow may be not handled.");
                }
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
            function StripeGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            StripeGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://js.stripe.com/v2/");
                document.body.appendChild(f);
            };
            StripeGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-stripe') + "\">\n                        " + this.htmlCreditCard() + "\n                    </div>";
            };
            StripeGateway.prototype.handleForm = function (el, success, error) {
                Stripe.setPublishableKey(this.getPublicKey("public_key"));
                var submitButton = el.querySelector("input[type=\"submit\"]");
                submitButton.setAttribute("disabled", "1");
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var t = this;
                try {
                    Stripe.card.createToken({
                        number: numberf.value,
                        cvc: cvcf.value,
                        exp_month: Number(expmonthf.value),
                        exp_year: Number(expyearf.value)
                    }, function (status, response) {
                        if (response.error) {
                            submitButton.removeAttribute("disabled");
                            error({
                                code: ProcessOut.ErrorCode.GatewayInvalidInput,
                                message: response.error.message
                            });
                            return;
                        }
                        var data = t.getCustomerObject();
                        data.token = response.id;
                        t.instance.apiRequest("post", t.getEndpoint(true), data, function (resp) {
                            submitButton.removeAttribute("disabled");
                            if (!resp.success) {
                                error({
                                    code: ProcessOut.ErrorCode.GatewayError,
                                    message: resp.message
                                });
                                return;
                            }
                            if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(resp.url)) {
                                success(t.name);
                                return;
                            }
                            window.location.href = resp.url;
                        }, function (request, err) {
                            submitButton.removeAttribute("disabled");
                            error({
                                code: ProcessOut.ErrorCode.ProcessOutUnavailable,
                                message: "An error occured trying to communicate with ProcessOut"
                            });
                        });
                    });
                }
                catch (err) {
                    submitButton.removeAttribute("disabled");
                    error({
                        code: ProcessOut.ErrorCode.GatewayError,
                        message: err
                    });
                }
            };
            StripeGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            StripeGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            StripeGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
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
            function CheckoutcomGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            CheckoutcomGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.instance.debug)
                    f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
                else
                    f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
                f.setAttribute("data-namespace", "CKOAPI");
                document.body.appendChild(f);
            };
            CheckoutcomGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-checkoutcom') + "\">\n                        " + this.htmlCreditCard() + "\n                    </div>";
            };
            CheckoutcomGateway.prototype.handleForm = function (el, success, error) {
                var submitButton = el.querySelector("input[type=\"submit\"]");
                submitButton.setAttribute("disabled", "1");
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var t = this;
                try {
                    CKOAPI.configure({
                        publicKey: t.getPublicKey("public_key"),
                        apiError: function (event) {
                            submitButton.removeAttribute("disabled");
                            if (event.data.errorCode[0] == "7")
                                error({
                                    code: ProcessOut.ErrorCode.GatewayInvalidInput,
                                    message: event.data.message
                                });
                            else
                                error({
                                    code: ProcessOut.ErrorCode.GatewayError,
                                    message: event.data.message
                                });
                        }
                    });
                    CKOAPI.createCardToken({
                        "number": numberf.value,
                        "cvv": cvcf.value,
                        "expiryMonth": Number(expmonthf.value),
                        "expiryYear": Number(expyearf.value)
                    }, function (v) {
                        if (!v.id)
                            return;
                        var data = t.getCustomerObject();
                        data.token = v.id;
                        t.instance.apiRequest("post", t.getEndpoint(true), data, function (resp) {
                            submitButton.removeAttribute("disabled");
                            if (!resp.success) {
                                error({
                                    code: ProcessOut.ErrorCode.GatewayError,
                                    message: resp.message
                                });
                                return;
                            }
                            if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(resp.url)) {
                                success(t.name);
                                return;
                            }
                            window.location.href = resp.url;
                        }, function (request, err) {
                            submitButton.removeAttribute("disabled");
                            error({
                                code: ProcessOut.ErrorCode.ProcessOutUnavailable,
                                message: "An error occured trying to communicate with ProcessOut"
                            });
                        });
                    });
                }
                catch (err) {
                    submitButton.removeAttribute("disabled");
                    error({
                        code: ProcessOut.ErrorCode.GatewayError,
                        message: err
                    });
                }
            };
            CheckoutcomGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            CheckoutcomGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            CheckoutcomGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
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
            function AdyenGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            AdyenGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");
                document.body.appendChild(f);
            };
            AdyenGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-adyen') + "\">\n                        " + this.htmlCreditCardWithName() + "\n                    </div>";
            };
            AdyenGateway.prototype.handleForm = function (el, success, error) {
                var Adyen = adyen.encrypt.createEncryption(this.getPublicKey("merchant_account"), {});
                var submitButton = el.querySelector("input[type=\"submit\"]");
                submitButton.setAttribute("disabled", "1");
                var namef = el.getElementsByClassName(this.instance.classNames("credit-card-name-input"))[0];
                var numberf = el.getElementsByClassName(this.instance.classNames("credit-card-number-input"))[0];
                var cvcf = el.getElementsByClassName(this.instance.classNames("credit-card-cvc-input"))[0];
                var expmonthf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-month-input"))[0];
                var expyearf = el.getElementsByClassName(this.instance.classNames("credit-card-expiry-year-input"))[0];
                var validate = Adyen.validate({
                    "number": numberf.value,
                    "cvc": cvcf.value,
                    "month": Number(expmonthf.value),
                    "year": Number(expyearf.value)
                });
                for (var k in validate) {
                    if (!validate[k]) {
                        error({
                            code: ProcessOut.ErrorCode.GatewayInvalidInput,
                            message: "The provided credit card is invalid."
                        });
                        return;
                    }
                }
                var data = t.getCustomerObject();
                data.token = Adyen.encrypt({
                    number: numberf.value,
                    cvc: cvcf.value,
                    holderName: namef.value,
                    expiryMonth: Number(expmonthf.value),
                    expiryYear: Number(expyearf.value),
                    generationtime: Math.floor(Date.now() / 1000)
                });
                var t = this;
                this.instance.apiRequest("post", this.getEndpoint(true), data, function (resp) {
                    submitButton.removeAttribute("disabled");
                    if (!resp.success) {
                        error({
                            code: ProcessOut.ErrorCode.GatewayError,
                            message: resp.message
                        });
                        return;
                    }
                    if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(resp.url)) {
                        success(t.name);
                        return;
                    }
                    window.location.href = resp.url;
                }, function (request, err) {
                    submitButton.removeAttribute("disabled");
                    error({
                        code: ProcessOut.ErrorCode.ProcessOutUnavailable,
                        message: "An error occured trying to communicate with ProcessOut"
                    });
                });
            };
            AdyenGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            AdyenGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            AdyenGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
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
        var GocardlessGateway = (function (_super) {
            __extends(GocardlessGateway, _super);
            function GocardlessGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            GocardlessGateway.prototype.setup = function () {
                var f = document.createElement("script");
                f.setAttribute("type", "text/javascript");
                if (this.instance.debug)
                    f.setAttribute("src", "https://pay-sandbox.gocardless.com/js/beta");
                else
                    f.setAttribute("src", "https://pay.gocardless.com/js/beta");
                document.body.appendChild(f);
            };
            GocardlessGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', 'gateway-gocardless') + "\">\n                        " + this.htmlSEPA() + "\n                    </div>";
            };
            GocardlessGateway.prototype.handleForm = function (el, success, error) {
                throw new Error("GoCardless is not supported by processout.js yet.");
            };
            GocardlessGateway.prototype.handleOneOff = function (el, success, error) {
                throw new Error("GoCardless does not support one-off payments.");
            };
            GocardlessGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            GocardlessGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return GocardlessGateway;
        }(Gateways.Gateway));
        Gateways.GocardlessGateway = GocardlessGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        var LinkGateway = (function (_super) {
            __extends(LinkGateway, _super);
            function LinkGateway(instance, data, actionURL, flow) {
                _super.call(this, instance, data, actionURL, flow);
            }
            LinkGateway.prototype.html = function () {
                return "<div class=\"" + this.instance.classNames('gateway-form-wrapper', "gateway-" + this.name) + "\">\n                        " + this.htmlLink() + "\n                    </div>";
            };
            LinkGateway.prototype.handleForm = function (el, success, error) {
                var t = this;
                this.instance.apiRequest("get", this.getEndpoint(false), this.getCustomerObject(), function (resp) {
                    if (!resp.success) {
                        error({
                            code: ProcessOut.ErrorCode.GatewayError,
                            message: resp.message
                        });
                        return;
                    }
                    window.location.href = resp.customer_action.url;
                }, function (request, err) {
                    error({
                        code: ProcessOut.ErrorCode.ProcessOutUnavailable,
                        message: "An error occured trying to communicate with ProcessOut"
                    });
                });
            };
            LinkGateway.prototype.handleOneOff = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            LinkGateway.prototype.handleRecurring = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            LinkGateway.prototype.handleOneClickAuthorization = function (el, success, error) {
                return this.handleForm(el, success, error);
            };
            return LinkGateway;
        }(Gateways.Gateway));
        Gateways.LinkGateway = LinkGateway;
    })(Gateways = ProcessOut.Gateways || (ProcessOut.Gateways = {}));
})(ProcessOut || (ProcessOut = {}));
var ProcessOut;
(function (ProcessOut) {
    var Authorization = (function () {
        function Authorization(instance) {
            this.instance = instance;
        }
        Authorization.prototype.find = function (uid, success, error) {
            var t = this;
            t.uid = uid;
            t.instance.apiRequest("get", "/authorizations/" + uid, {}, function (data, code, jqxhr) {
                t.data = data;
                t.instance.apiRequest("get", "/authorizations/" + uid + "/gateways", {}, function (data, code, jqxhr) {
                    t.gatewaysList = [];
                    for (var i = 0; i < data.gateways.length; i++) {
                        t.gatewaysList[i] = ProcessOut.Gateways.Handler.buildGateway(t.instance, data.gateways[i], "/authorizations/" + uid, ProcessOut.Flow.OneClickAuthorization);
                    }
                    success(t);
                }, function () {
                    error({
                        code: ProcessOut.ErrorCode.ResourceNotFound,
                        message: "The authorization's gateways could not be fetched."
                    });
                });
            }, function () {
                error({
                    code: ProcessOut.ErrorCode.ResourceNotFound,
                    message: "The authorization could not be found."
                });
            });
        };
        Authorization.prototype.gateways = function () {
            return this.gatewaysList;
        };
        return Authorization;
    }());
    ProcessOut.Authorization = Authorization;
})(ProcessOut || (ProcessOut = {}));
