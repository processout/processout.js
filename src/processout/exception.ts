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

        construct(code: string, message?: string) {
            this.code = code;
            if (message)
                this.message = message;
            else
                this.message = Translator.translate(this.code);
            this.name  = this.code;
            this.stack = (<any> new Error()).stack;
        }
    }

}
