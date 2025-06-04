/// <reference path="./references.ts" />

module ProcessOut {
    export type APMOptions = APMUserData & {
      theme?: DeepPartial<ThemeOptions>
    }

    interface APM {
      on<K extends keyof APMEvents>(type: K, handler: EventHandler<APMEvents, K>): void;
      off<K extends keyof APMEvents>(type: K, handler: EventHandler<APMEvents, K>): void;
      initialise(): Promise<void>
    }

    export class APMImpl implements APM {
      constructor(poClient: ProcessOut, container: Container, options: APMOptions) {
        let containerEl = typeof container === 'string' ? document.querySelector(container) : container
        const { theme, ...data } = options

        if (theme) {
          ThemeImpl.instance.update(theme)
        }

        ContextImpl.instance.initialise({
          ...data,
          events: new APMEventsImpl(),
          reload: this.initialise.bind(this),
          page: new APMPageImpl(containerEl),
          poClient: poClient
        })
      }

      public async initialise() {
        ContextImpl.context.page.load(APMViewLoading)
        ContextImpl.context.events.emit('loading')
      }

      public on<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.on(key, handler);
      }

      public off<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.off(key, handler);
      }
    }
}
