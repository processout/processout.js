/// <reference path="../../references.ts" />
/// <amd-dependency path="https://js.stripe.com/v2/" />

/// <reference path="../../definitions/stripe.d.ts" />

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class StripeGateway extends Gateway {

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data, actionURL: string, flow: Flow) {
            super(instance, data, actionURL, flow);
        }

        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', 'gateway-stripe')}">
                        ${this.htmlCreditCard()}
                    </div>`;
        }

        handle(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void) {

            Stripe.setPublishableKey(this.getPublicKey("public_key"));

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
                Stripe.card.createToken({
                    number:    (<HTMLInputElement> numberf).value,
                    cvc:       (<HTMLInputElement> cvcf).value,
                    exp_month: Number((<HTMLInputElement> expmonthf).value),
                    exp_year:  Number((<HTMLInputElement> expyearf).value)
                }, function(status, response) {
                    if (response.error) {
                        submitButton.removeAttribute("disabled");
                        error(<Error>{
                            code:    ErrorCode.GatewayError,
                            message: response.error.message
                        });

                        return;
                    }

                    // Stripe token correctly generated, let's charge it
                    var data   = t.getCustomerObject();
                    data.token = response.id;
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
                // Re-enable the button and throw the error again
                submitButton.removeAttribute("disabled");
                throw err;
            }
        }

    }

}
