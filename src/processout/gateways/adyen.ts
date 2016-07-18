/// <reference path="../../references.ts" />

declare var adyen: any;

/**
 * ProcessOut Gateways module/namespace
 */
module ProcessOut.Gateways {

    /**
     * ProcessOut Gateway class
     */
    export class AdyenGateway extends Gateway {

        /**
         * Constructor, copies data to object
         */
        constructor(instance: ProcessOut, data, actionURL: string, flow: Flow) {
            super(instance, data, actionURL, flow);
        }

        setup(): void {
            var f = document.createElement("script");
            f.setAttribute("type", "text/javascript");
            f.setAttribute("src", "https://cdn.processout.com/scripts/adyen.encrypt.nodom.min.js");

            document.body.appendChild(f);
        }

        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', 'gateway-stripe')}">
                        ${this.htmlCreditCard()}
                    </div>`;
        }

        handle(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void): void {

            var Adyen = adyen.encrypt.createEncryption(
                this.getPublicKey("merchant_account"), {});

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

            var validate = Adyen.validate({
                "number": (<HTMLInputElement> numberf).value,
                "cvc":    (<HTMLInputElement> cvcf).value,
                "month":  Number((<HTMLInputElement> expmonthf).value),
                "year":   Number((<HTMLInputElement> expyearf).value)
            });
            for(var k in validate) {
                if (! validate[k]) {
                    error(<Error>{
                        code:    ErrorCode.GatewayInvalidInput,
                        message: "The provided credit card is invalid."
                    });
                    return;
                }
            }

            var data  = t.getCustomerObject();
            data.token = Adyen.encrypt({
                number:         (<HTMLInputElement> numberf).value,
                cvc:            (<HTMLInputElement> cvcf).value,
                holderName:     name,
                expiryMonth:    Number((<HTMLInputElement> expmonthf).value),
                expiryYear:     Number((<HTMLInputElement> expyearf).value),
                generationtime: Math.floor(Date.now() / 1000) // Timestamp
            });

            var t = this;
            this.instance.apiRequest("post", this.getEndpoint(true), data,
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
        }

    }

}
