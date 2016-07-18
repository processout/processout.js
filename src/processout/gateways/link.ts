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

        html(): string {
            return `<div class="${this.instance.classNames('gateway-form-wrapper', `gateway-${this.name}`)}">
                        ${this.htmlLink()}
                    </div>`;
        }

        handle(el: HTMLElement, success: (gateway: string) => void,
            error: (err: Error) => void) {

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
                        code:    ErrorCode.GatewayError,
                        message: err
                    });
                });
        }

    }

}
