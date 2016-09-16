/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut Exception class
     */
    export class Exception extends Error {
        public code:    string;
        public message: string;
        public stack:   string;

        constructor(code: string, message?: string) {
            if (! message)
                message = Translator.translate(code);

            super(message);

            this.code    = code;
            this.message = message;

            this.name  = "ProcessOutException";
            this.stack = (<any> new Error()).stack;
        }
    }

}
