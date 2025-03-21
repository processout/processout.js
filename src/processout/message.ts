/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * Message class used to communicate between iframes
     */
    export class Message {
        public static modalNamespace      = "processout.modal";
        public static checkoutNamespace   = "processout.checkout";
        public static fieldNamespace      = "processout.field";
        public static messageHubNamespace = "processout.message-hub"

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
              if (e && e.data) {
                const d = JSON.parse(e.data);
                return d ? <Message>d : new Message();
              }
              return new Message();
            } catch (e) {
                return new Message();
            }
        }
    }
}
