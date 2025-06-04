module ProcessOut {
    export interface APMEvents extends EventMap {
      loading: never;
      "payment-success": { ok: true };
      "payment-error": { message: string; code: string };
    }

    export class APMEventsImpl extends EventListenerImpl<APMEvents> {
      constructor() {
        super()
      }

      on<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        super.on(key, handler);
      }

      off<K extends keyof APMEvents>(key: K, handler: EventHandler<APMEvents, K>) {
        super.off(key, handler);
      }

      emit<K extends keyof APMEvents>(key: K, ...payload: APMEvents[K] extends never ? [] : [payload: APMEvents[K]]
      ) {
        super.emit(key, ...payload);
      }
    }
}
