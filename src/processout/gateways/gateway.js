/// <reference path="../../references.ts" />
/**
 * ProcessOut Gateways module/namespace
 */
var ProcessOut;
(function (ProcessOut) {
    var Gateways;
    (function (Gateways) {
        /**
         * ProcessOut Gateway class
         */
        var Gateway = (function () {
            /**
             * Constructor, copies data to object
             * @param {ProcessOut} instance
             * @param {Object} data
             * @param {string} resourceURL
             * @param {Flow} flow
             */
            function Gateway(instance, data, resourceURL, flow) {
                this.instance = instance;
                this.resourceURL = resourceURL;
                this.flow = flow;
                this.name = data.name;
                this.displayName = data.display_name;
                this.publicKeys = data.public_keys;
                this.supportedMethod = data.supported_methods;
            }
            /**
             * Get the requested public key in the publicKey object array
             * @param {string} key
             * @return {string}
             */
            Gateway.prototype.getPublicKey = function (key) {
                for (var _i = 0, _a = this.publicKeys; _i < _a.length; _i++) {
                    var v = _a[_i];
                    if (v.key == key) {
                        return v.value;
                    }
                }
                return "";
            };
            /**
             * Format the customer object to an object understandable by the
             * ProcessOut API
             * @return {Object}
             */
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
            /**
             * Get the endpoint for the current flow
             * @return {string}
             */
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
            /**
             * Return the default template for redirections
             * @return {string}
             */
            Gateway.prototype.htmlLink = function () {
                return "<form action=\"\" method=\"POST\" class=\"" + this.instance.classNames('link-form') + "\">\n                        <div class=\"" + this.instance.classNames('link-submit-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('link-submit-lower-wrapper') + "\">\n                                <input type=\"submit\" class=\"" + this.instance.classNames('link-submit') + "\" value=\"Pay now!\">\n                            </div>\n                        </div>\n                    </form>";
            };
            Gateway.prototype._htmlCreditCard = function () {
                return "    <div class=\"" + this.instance.classNames('credit-card-number-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-number-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-number-label') + "\">Card number</label>\n                                <input type=\"text\" size=\"20\" placeholder=\"8888 8888 8888 8888\" autocomplete=\"cc-number\" class=\"" + this.instance.classNames('credit-card-number-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-expiry-month-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-expiry-month-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-expiry-month-label') + "\">Expiry month</label>\n                                <input type=\"text\" placeholder=\"MM\" autocomplete=\"cc-exp-month\" class=\"" + this.instance.classNames('credit-card-expiry-month-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-expiry-year-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-expiry-year-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-expiry-year-label') + "\">Expiry year</label>\n                                <input type=\"text\" placeholder=\"YYYY\" autocomplete=\"cc-exp-year\" class=\"" + this.instance.classNames('credit-card-expiry-year-input') + "\" />\n                            </div>\n                        </div>\n                        <div class=\"" + this.instance.classNames('credit-card-cvc-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-cvc-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-cvc-label') + "\">CVC</label>\n                                <input type=\"text\" size=\"4\" placeholder=\"123\" autocomplete=\"off\" class=\"" + this.instance.classNames('credit-card-cvc-input') + "\" />\n                            </div>\n                        </div>\n\n                        <div class=\"" + this.instance.classNames('credit-card-submit-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-submit-lower-wrapper') + "\">\n                                <input type=\"submit\" class=\"" + this.instance.classNames('credit-card-submit') + "\" value=\"Pay now!\">\n                            </div>\n                        </div>";
            };
            /**
             * Return the default template for credit cards
             * @return {string}
             */
            Gateway.prototype.htmlCreditCard = function () {
                return "<form action=\"#\" method=\"POST\" class=\"" + this.instance.classNames('credit-card-form') + "\">\n                        " + this._htmlCreditCard() + "\n                    </form>";
            };
            /**
             * Return the default template for credit cards, and asks for the card
             * holder name as well
             * @return {string}
             */
            Gateway.prototype.htmlCreditCardWithName = function () {
                return "<form action=\"#\" method=\"POST\" class=\"" + this.instance.classNames('credit-card-form', 'credit-card-form-name') + "\">\n                        <div class=\"" + this.instance.classNames('credit-card-name-upper-wrapper') + "\">\n                            <div class=\"" + this.instance.classNames('credit-card-name-lower-wrapper') + "\">\n                                <label class=\"" + this.instance.classNames('credit-card-name-label') + "\">Card holder name</label>\n                                <input type=\"text\" size=\"20\" placeholder=\"John Smith\" class=\"" + this.instance.classNames('credit-card-name-input') + "\" />\n                            </div>\n                        </div>\n                        " + this._htmlCreditCard() + "\n                    </form>";
            };
            /**
             * Return the default template for SEPA payments (EU bank transfers)
             * @return {string}
             */
            Gateway.prototype.htmlSEPA = function () {
                return "SEPA payments are not supported yet.";
            };
            /**
             * Append the gateway html to the given html element, and return the
             * inner created form
             * @param {HTMLElement} root
             * @return {HTMLElement}
             */
            Gateway.prototype.appendTo = function (root) {
                if (root.jquery)
                    root = root[0];
                var div = document.createElement("div");
                div.innerHTML = this.html();
                root.appendChild(div);
                var form = div.firstChild.querySelector("form");
                return form;
            };
            /**
             * Hook the given element to be automatically handled when the form
             * is submitted
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
            Gateway.prototype.hook = function (el, success, error) {
                if (el.jquery)
                    el = el[0];
                var t = this;
                el.onsubmit = function () {
                    t.handle(el, success, error);
                    return false;
                };
            };
            /**
             * Setup the current gateway (such as loading the required js library)
             * @return {void}
             */
            Gateway.prototype.setup = function () {
                //
            };
            /**
             * Handle the gateway's form submission
             * @param {HTMLElement} el
             * @param {callback?} success
             * @param {callback?} error
             * @return {void}
             */
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
