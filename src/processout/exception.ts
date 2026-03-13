/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    export interface ExceptionMetadata {
        [key: string]: any;
    }

    /**
     * ProcessOut Exception class
     */
    export class Exception extends Error {
        public code:    string;
        public message: string;
        public metadata: ExceptionMetadata;
        public stack:   string;

        constructor(code: string, message?: string, metadata?: ExceptionMetadata) {
            if (! message)
                message = Translator.translateError(code);

            super(message);

            this.code    = code;
            this.message = message;
            this.metadata = metadata;

            this.name  = "ProcessOutException";
            this.stack = (<any> new Error()).stack;
        }
    }

}
