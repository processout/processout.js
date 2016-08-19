/// <reference path="../../references.ts" />

declare var CKOAPI: any;

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class CheckoutcomGateway extends Gateway {

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
                f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
            else
                f.setAttribute("src", "https://cdn.checkout.com/js/checkoutkit.js");
            f.setAttribute("data-namespace", "CKOAPI");

            document.body.appendChild(f);
        }

        /**
         * Get the gateway's HTML
         * @return {string}
         */
        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', 'gateway-checkoutcom')}">
                        ${this.htmlCreditCard()}
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

            var submitButton = el.querySelector(`input[type="submit"]`);
            // We disable submit button to prevent from multiple submition
            submitButton.setAttribute("disabled", "1");

            var numberf = el.getElementsByClassName(this.instance.classNames(
                "credit-card-number-input"))[0];
            var cvcf = el.getElementsByClassName(this.instance.classNames(
                "credit-card-cvc-input"))[0];
            var expmonthf = el.getElementsByClassName(this.instance.classNames(
                "credit-card-expiry-month-input"))[0];
            var expyearf = el.getElementsByClassName(this.instance.classNames(
                "credit-card-expiry-year-input"))[0];

            var t = this;
            try {
                (<any>CKOAPI).configure({
                    publicKey: t.getPublicKey("public_key"),
                    apiError: function (event) {
                        submitButton.removeAttribute("disabled");
                        // 7xxx errors are validation errors
                        if (event.data.errorCode[0] == "7")
                            error(<Error>{
                                code: ErrorCode.GatewayInvalidInput,
                                message: event.data.message
                            });
                        else
                            error(<Error>{
                                code: ErrorCode.GatewayError,
                                message: event.data.message
                            });
                    }
                });
                (<any>CKOAPI).createCardToken({
                    "number":      (<HTMLInputElement> numberf).value,
                    "cvv":         (<HTMLInputElement> cvcf).value,
                    "expiryMonth": Number((<HTMLInputElement> expmonthf).value),
                    "expiryYear":  Number((<HTMLInputElement> expyearf).value)
                }, function(v) {
                    if (!v.id)
                        return;

                    // Checkout.com token correctly generated, let's charge it
                    var data   = t.getCustomerObject();
                    data.token = v.id;
                    t.instance.apiRequest("post", t.getEndpoint(true), data,
                        function(resp) {
                            submitButton.removeAttribute("disabled");

                            if (!resp.success) {
                                error(<Error>{
                                    code:    ErrorCode.GatewayError,
                                    message: resp.message
                                });
                                return;
                            }

                            var url = resp.customer_action.url;

                            // Redirect URL is empty
                            if (url == undefined || url == "") {
                                success(t.name);
                                return;
                            }

                            // Redirect URL is ProcessOut
                            if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(url)) {
                                success(t.name);
                                return;
                            }

                            window.location.href = url;
                        }, function (request, err) {
                            submitButton.removeAttribute("disabled");
                            error(<Error>{
                                code:    ErrorCode.ProcessOutUnavailable,
                                message: "An error occured trying to communicate with ProcessOut"
                            });
                        });
                });
            } catch(err) {
                submitButton.removeAttribute("disabled");
                error(<Error>{
                    code:    ErrorCode.GatewayError,
                    message: err
                });
            }
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
