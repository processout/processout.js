/// <reference path="../../references.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export abstract class Gateway {

        /**
         * ProcessOut instance
         * @type {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * ProcessOut API URL of the resource that interacts with the gateway
         * @type {string}
         */
        protected resourceURL: string;

        /**
         * Requested payment/authorization flow
         * @type {Flow}
         */
        protected flow: Flow;

        /**
         * Code name of the gateway
         * @type {string}
         */
        protected name: string;

        /**
         * Displayable name of the gateway
         * @type {string}
         */
        protected displayName: string;

        /**
         * Map containing the public keys of the gateway
         * @type {Object[]}
         */
        protected publicKeys: {key: string, value: string}[];

        /**
         * Slice containing the available methods of the gateway
         * @type {string[]}
         */
        protected supportedMethod: string[];

        /**
         * Constructor, copies data to object
         * @param {ProcessOut} instance
         * @param {Object} data
         * @param {string} resourceURL
         * @param {Flow} flow
         */
        constructor(instance: ProcessOut, data, resourceURL: string, flow: Flow) {
            this.instance = instance;

            this.resourceURL = resourceURL;
            this.flow        = flow;

            this.name        = data.name;
            this.displayName = data.display_name;
            this.publicKeys  = data.public_keys;
            this.supportedMethod     = data.supported_methods;
        }

        /**
         * Get the requested public key in the publicKey object array
         * @param {string} key
         * @return {string}
         */
        getPublicKey(key: string): string {
            for (var v of this.publicKeys) {
                if (v.key == key) {
                    return v.value;
                }
            }

            return "";
        }

        /**
         * Format the customer object to an object understandable by the
         * ProcessOut API
         * @return {Object}
         */
        protected getCustomerObject(): any {
            if (!this.instance.customer) {
                return {};
            }

            return {
                email:        this.instance.customer.Email,
                first_name:   this.instance.customer.FirstName,
                last_name:    this.instance.customer.LastName,
                address1:     this.instance.customer.Address1,
                address2:     this.instance.customer.Address2,
                city:         this.instance.customer.City,
                state:        this.instance.customer.State,
                zip:          this.instance.customer.ZIP,
                country_code: this.instance.customer.CountryCode
            };
        }

        /**
         * Get the endpoint for the current flow
         * @return {string}
         */
        protected getEndpoint(async: boolean): string {
            switch (this.flow) {
            case Flow.OneOff:
                if (!async)
                    return this.resourceURL+`/gateways/${this.name}`;
                else
                    return this.resourceURL+`/gateways/${this.name}/charges`;

            case Flow.Recurring:
            case Flow.OneClickAuthorization:
                if (!async)
                    return this.resourceURL+`/gateways/${this.name}`;
                else
                    return this.resourceURL+`/gateways/${this.name}/tokens`;

            default:
                throw new Error("Could not find flow.");
            }
        }

        /**
         * Return the default template for redirections
         * @return {string}
         */
        protected htmlLink(): string {
            return `<form action="" method="POST" class="${this.instance.classNames('link-form')}">
                        <div class="${this.instance.classNames('link-submit-upper-wrapper')}">
                            <div class="${this.instance.classNames('link-submit-lower-wrapper')}">
                                <input type="submit" class="${this.instance.classNames('link-submit')}" value="Pay now!">
                            </div>
                        </div>
                    </form>`;
        }

        protected _htmlCreditCard(): string {
            return `    <div class="${this.instance.classNames('credit-card-number-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-number-lower-wrapper')}">
                                <label class="${this.instance.classNames('credit-card-number-label')}">Card number</label>
                                <input type="text" size="20" placeholder="8888 8888 8888 8888" autocomplete="cc-number" class="${this.instance.classNames('credit-card-number-input')}" />
                            </div>
                        </div>
                        <div class="${this.instance.classNames('credit-card-expiry-month-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-expiry-month-lower-wrapper')}">
                                <label class="${this.instance.classNames('credit-card-expiry-month-label')}">Expiry month</label>
                                <input type="text" placeholder="MM" autocomplete="cc-exp-month" class="${this.instance.classNames('credit-card-expiry-month-input')}" />
                            </div>
                        </div>
                        <div class="${this.instance.classNames('credit-card-expiry-year-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-expiry-year-lower-wrapper')}">
                                <label class="${this.instance.classNames('credit-card-expiry-year-label')}">Expiry year</label>
                                <input type="text" placeholder="YYYY" autocomplete="cc-exp-year" class="${this.instance.classNames('credit-card-expiry-year-input')}" />
                            </div>
                        </div>
                        <div class="${this.instance.classNames('credit-card-cvc-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-cvc-lower-wrapper')}">
                                <label class="${this.instance.classNames('credit-card-cvc-label')}">CVC</label>
                                <input type="text" size="4" placeholder="123" autocomplete="off" class="${this.instance.classNames('credit-card-cvc-input')}" />
                            </div>
                        </div>

                        <div class="${this.instance.classNames('credit-card-submit-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-submit-lower-wrapper')}">
                                <input type="submit" class="${this.instance.classNames('credit-card-submit')}" value="Pay now!">
                            </div>
                        </div>`;
        }

        /**
         * Return the default template for credit cards
         * @return {string}
         */
        protected htmlCreditCard(): string {
            return `<form action="#" method="POST" class="${this.instance.classNames('credit-card-form')}">
                        ${this._htmlCreditCard()}
                    </form>`;
        }

        /**
         * Return the default template for credit cards, and asks for the card
         * holder name as well
         * @return {string}
         */
        protected htmlCreditCardWithName(): string {
            return `<form action="#" method="POST" class="${this.instance.classNames('credit-card-form', 'credit-card-form-name')}">
                        <div class="${this.instance.classNames('credit-card-name-upper-wrapper')}">
                            <div class="${this.instance.classNames('credit-card-name-lower-wrapper')}">
                                <label class="${this.instance.classNames('credit-card-name-label')}">Card holder name</label>
                                <input type="text" size="20" placeholder="John Smith" class="${this.instance.classNames('credit-card-name-input')}" />
                            </div>
                        </div>
                        ${this._htmlCreditCard()}
                    </form>`;
        }

        /**
         * Return the default template for SEPA payments (EU bank transfers)
         * @return {string}
         */
        protected htmlSEPA(): string {
            return `SEPA payments are not supported yet.`;
        }

        /**
         * Append the gateway html to the given html element, and return the
         * inner created form
         * @param {HTMLElement} root
         * @return {HTMLElement}
         */
        appendTo(root: any): HTMLElement {
            if (root.jquery)
                root = root[0];

            var div = document.createElement("div");
            div.innerHTML = this.html();

            root.appendChild(div);

            var form = (<HTMLElement>div.firstChild).querySelector("form");
            return <HTMLElement>form;
        }

        /**
         * Hook the given element to be automatically handled when the form
         * is submitted
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        hook(el: any, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            if (el.jquery)
                el = el[0];

            var t = this;

            el.onsubmit = function() {
                t.handle(el, success, error);
                return false;
            };
        }

        /**
         * Setup the current gateway (such as loading the required js library)
         * @return {void}
         */
        setup(): void {
            //
        }

        /**
         * Handle the gateway's form submission
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        handle(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            switch (this.flow) {
            case Flow.OneOff:
                return this.handleOneOff(el, success, error);
            case Flow.Recurring:
                return this.handleRecurring(el, success, error);
            case Flow.OneClickAuthorization:
                return this.handleOneClickAuthorization(el, success, error);

            default:
                throw new Error("The flow may be not handled.");
            }
        }

        /**
         * Handle the gateway's form submission for one-off payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleOneOff(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void;

        /**
         * Handle the gateway's form submission for recurring invoice payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleRecurring(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void;

        /**
         * Handle the gateway's form submission for one-click authorizations
         * flow
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected abstract handleOneClickAuthorization(el: HTMLElement,
            success: (gateway: string) => void, error: (err: Error) => void): void;

        /**
         * Get the gateway's HTML
         * @return {string}
         */
        abstract html(): string;

    }

}
