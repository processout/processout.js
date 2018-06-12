/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * Message class used to communicate between iframes
     */
    export class Message {
        public static modalNamespace    = "processout.modal";
        public static checkoutNamespace = "processout.checkout";
        public static fieldNamespace    = "processout.field";

        public messageID:    string;
        public frameID:      string;
        public formID:       string
        public projectID:    string;
        public namespace:    string;
        public action:       string;
        public data:         any;
        public errorCode:    string;
        public errorMessage: string;

        public static parseEvent(e: MessageEvent): Message {
            try {
                var d = JSON.parse(e.data);
                return <Message>d;
            } catch (e) {
                return new Message();
            }
        }
    }
}
