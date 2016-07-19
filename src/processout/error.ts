/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export class ErrorCode {
        static ProcessOutUnavailable = "processout.unavailable";
        static ResourceNotFound      = "resource.not-found";
        static GatewayError          = "gateway.error";
        static GatewayInvalidInput   = "gateway.invalid-input";
    }

    /**
     * ProcessOut Error interface
     */
    export interface Error {
        code:    string;
        message: string;
    }

}
