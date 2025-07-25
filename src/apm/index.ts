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
        let containerEl = container

        if (typeof containerEl === 'string') {
          containerEl = document.querySelector(containerEl);
        }

        const { theme, ...data } = options

        if (theme) {
          ThemeImpl.instance.update(theme)
        }

        ContextImpl.instance.initialise({
          allowCancelation: true,
          ...data,
          success: {
            enabled: true,
            requiresAction: false,
            autoDismissDuration: 3,
            manualDismissDuration: 60,
            ...data.success,
          },
          confirmation: {
            requiresAction: false,
            timeout: MIN_15 / 1000,
            allowCancelation: true,
            ...data.confirmation,
          },
          logger: {
            error: (options: Omit<Parameters<TelemetryClient['reportError']>[0], 'stack'>) => {
              if (DEBUG === true) {
                console.error(options.message)
                return;
              }

              logger.reportError({
                ...options,
                stack: new Error().stack
              });
            },
            warn: (options: Omit<Parameters<TelemetryClient['reportWarning']>[0], 'stack'>) => {
              if (DEBUG === true) {
                console.warn(options.message)
                return;
              }

              logger.reportWarning({
                ...options,
                stack: new Error().stack
              });
            }
          },
          events: new APMEventsImpl(),
          reload: () => {
            ContextImpl.context.page.render(APMViewLoading)
            ContextImpl.context.page.load(APIImpl.getCurrentStep)
          },
          page: new APMPageImpl(containerEl),
          poClient: poClient,
        })
      }

      public initialise() {
        ContextImpl.context.events.emit('initialised')
        ContextImpl.context.page.render(APMViewLoading)
        
        ContextImpl.context.page.load(APIImpl.initialise, (err) => {
          ContextImpl.context.events.emit('start')
          if (err) {
            ContextImpl.context.events.emit('failure', { failure: { code: 'processout-js.internal-error', message: err.message } })
          }
        })
      }

      public cleanUp() {
        ContextImpl.context.page.cleanUp()
      }

      public on<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.on(key, handler);
      }

      public off<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        ContextImpl.context.events.off(key, handler);
      }
    }
}
