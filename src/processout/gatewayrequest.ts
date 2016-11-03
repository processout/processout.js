/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * GatewayRequest is the class used to abstract away a gateway request
     */
    export class GatewayRequest {
        public gatewayConfigurationID: string;
        public url: string;
        public method: string;
        public headers: {[key:string]:string};
        public body: string;
        public prepare: boolean;

        public token(): string {
            return `gway_req_${btoa(JSON.stringify({
                "gateway_configuration_id": this.gatewayConfigurationID,
                "url":                      this.url,
                "method":                   this.method,
                "headers":                  this.headers,
                "body":                     this.body,
                "prepare":                  this.prepare
            }))}`;
        }
    }
}
