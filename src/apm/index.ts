/// <reference path="./references.ts" />

module ProcessOut {
    export type APMOptions<D extends Record<string, unknown> = APMUserData> = D & {
      theme?: DeepPartial<ThemeOptions>
    }

    interface APM {
      on<K extends keyof APMEvents>(type: K, handler: EventHandler<APMEvents, K>): void;
      off<K extends keyof APMEvents>(type: K, handler: EventHandler<APMEvents, K>): void;
      initialise(): void
    }

    export class APMImpl implements APM {
      constructor(poClient: ProcessOut, logger: TelemetryClient, container: Container, options: APMOptions) {
        let containerEl = typeof container === 'string' ? document.querySelector(container) : container
        const { theme, ...data } = options

        if (theme) {
          ThemeImpl.instance.update(theme)
        }

        ContextImpl.instance.initialise({
          ...data,
          logger: {
            error: (options: Omit<Parameters<TelemetryClient['reportError']>[0], 'stack'>) => {
              if (DEBUG === true) {
                console.error(options.message)
              }

              logger.reportError({
                ...options,
                stack: new Error().stack
              });
            },
          },
          events: new APMEventsImpl(),
          reload: () => {
            ContextImpl.context.page.render(APMViewLoading)
            ContextImpl.context.page.load(APIImpl.initialise)
          },
          page: new APMPageImpl(containerEl),
          poClient: poClient,
        })
      }

      public initialise() {
        ContextImpl.context.page.render(APMViewLoading)
        ContextImpl.context.page.load(APIImpl.initialise)
      }

      public on<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.on(key, handler);
      }

      public off<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.off(key, handler);
      }
    }
}
