/// <reference path="../../references.ts" />
/// <amd-dependency path="https://js.stripe.com/v2/" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class LinkGateway extends Gateway {

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data, actionURL: string, flow: Flow) {
            super(instance, data, actionURL, flow);
        }

        /**
         * Get the gateway's HTML
         * @return {string}
         */
        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', `gateway-${this.name}`)}">
                        ${this.htmlLink()}
                    </div>`;
        }

        /**
         * Checkout.com uses the same code for one-off, recurring and
         * authorizations
         * @param {HTMLElement} el
         * @param {callback?} success
         * @param {callback?} error
         * @return {void}
         */
        protected handleForm(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            var t = this;
            this.instance.apiRequest("get", this.getEndpoint(false),
                this.getCustomerObject(),
                function(resp) {
                    if (!resp.success) {
                        error(<Error>{
                            code:    ErrorCode.GatewayError,
                            message: resp.message
                        });
                        return;
                    }

                    window.location.href = resp.customer_action.url;
                }, function (request, err) {
                    error(<Error>{
                        code:    ErrorCode.ProcessOutUnavailable,
                        message: "An error occured trying to communicate with ProcessOut"
                    });
                });
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

            return this.handleForm(el, success, error);
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
