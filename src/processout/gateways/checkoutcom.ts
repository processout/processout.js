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

        setup(): void {
            var f = document.createElement("script");
            f.setAttribute("type", "text/javascript");
            f.setAttribute("src", "https://cdn.checkout.com/sandbox/js/checkoutkit.js");
            f.setAttribute("data-namespace", "CKOAPI");

            document.body.appendChild(f);
        }

        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', 'gateway-checkoutcom')}">
                        ${this.htmlCreditCard()}
                    </div>`;
        }

        handle(el: HTMLElement, success: (gateway: string) => void,
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

                            if (/^https?:\/\/checkout\.processout\.((com)|(ninja)|(dev))\//.test(resp.url)) {
                                success(t.name);
                                return;
                            }

                            window.location.href = resp.url;
                        }, function (request, err) {
                            submitButton.removeAttribute("disabled");
                            error(<Error>{
                                code:    ErrorCode.GatewayError,
                                message: err
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

    }

}
