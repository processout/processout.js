/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * MessageHub class used to communicate cross domains
     */
    export class MessageHub {
        protected hubPath = "/messagehub.html";

        protected instance:      ProcessOut;
        protected static iframe: HTMLIFrameElement;
        protected onnotify?:     (k: string, v: any) => void;
        protected active:        boolean;

        public constructor(instance: ProcessOut, onready?: (hub: MessageHub) => void, onnotify?: (k: string, v: any) => void) {
            this.instance = instance;
            this.onnotify = onnotify;

            this.load(onready);
        }

        protected load(onready: (hub: MessageHub) => void): void {
            var src = this.instance.endpoint("js", this.hubPath);

            window.addEventListener("message", function (event) {
                if (!this.active) return;

                var data = Message.parseEvent(event);
                if (data.namespace != Message.messageHubNamespace)
                    return;

                if (data.action != "value")
                    return;

                if (!this.onnotify)
                    return;
                this.onnotify(data.data.key, data.data.value);
            }.bind(this));

            if (!MessageHub.iframe) {
                var ready = false;
                window.addEventListener("message", function(event) {
                    if (ready)
                        return;

                    var data = Message.parseEvent(event);
                    if (data.namespace != Message.messageHubNamespace)
                        return;
                    if (data.action != "ready")
                        return;

                    ready = true;
                    if (onready) onready(this);
                }.bind(this));

                MessageHub.iframe = document.createElement("iframe");
                MessageHub.iframe.id = "processout-message-hub";
                MessageHub.iframe.name = "processout message hub";
                MessageHub.iframe.setAttribute("src", src);
                MessageHub.iframe.setAttribute("style", "background: none; width: 0; height: 0");
                MessageHub.iframe.setAttribute("frameborder", "0");
                MessageHub.iframe.setAttribute("allowtransparency", "1");

                document.body.appendChild(MessageHub.iframe);
            } else {
                if (onready) onready(this);
            }

            this.active = true;
        }

        public get(key: string): void {
            if (!this.active) return;
            MessageHub.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.messageHubNamespace,
                "action":    "get",
                "data": {
                    "key": key,
                }
            }), "*");
        }

        public set(key: string, val: any): void {
            if (!this.active) return;
            MessageHub.iframe.contentWindow.postMessage(JSON.stringify({
                "namespace": Message.messageHubNamespace,
                "action":    "set",
                "data": {
                    "key":   key,
                    "value": val,
                }
            }), "*");
        }
    }
}
