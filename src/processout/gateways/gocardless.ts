/// <reference path="../../references.ts" />

declare var adyen: any;

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class GocardlessGateway extends Gateway {

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data, actionURL: string, flow: Flow) {
            super(instance, data, actionURL, flow);
        }

        /**
         * Setup the current gateway (such as loading the required js library)
         * @return {void}
         */
        setup(): void {
            var f = document.createElement("script");
            f.setAttribute("type", "text/javascript");
            if (this.instance.debug)
                f.setAttribute("src", "https://pay-sandbox.gocardless.com/js/beta");
            else
                f.setAttribute("src", "https://pay.gocardless.com/js/beta");

            document.body.appendChild(f);
        }

        /**
         * Get the gateway's HTML
         * @return {string}
         */
        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', 'gateway-gocardless')}">
                        ${this.htmlSEPA()}
                    </div>`;
        }

        /**
         * Stripe uses the same code for one-off, recurring and authorizations
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected handleForm(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            throw new Error("GoCardless is not supported by processout.js yet.");
        }

        /**
         * Handle the gateway's form submission for one-off payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected handleOneOff(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            throw new Error("GoCardless does not support one-off payments.");
        }

        /**
         * Handle the gateway's form submission for recurring invoice payments
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected handleRecurring(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            return this.handleForm(el, success, error);
        }

        /**
         * Handle the gateway's form submission for one-click authorizations
         * flow
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected handleOneClickAuthorization(el: HTMLElement,
            success: (gateway: string) => void, error: (err: Error) => void): void {

            return this.handleForm(el, success, error);
        }

    }

}
