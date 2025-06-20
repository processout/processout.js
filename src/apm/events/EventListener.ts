module ProcessOut {
    export interface EventMap {
      [event: string]: any;
    }

    export type EventHandler<M extends EventMap, K extends keyof M = keyof M> =
      M[K] extends never ? () => void : (payload: M[K]) => void;

    interface EventListener<M extends EventMap> {
      on<K extends keyof M>(key: K, handler: EventHandler<M, K>): void;

      off<K extends keyof M>(key: K, handler: EventHandler<M, K>): void;

      emit<K extends keyof M>(
        key: K,
        ...payload: M[K] extends never ? [] : [payload: M[K]]
      ): void;
    }

    export class EventListenerImpl<M extends EventMap>
      implements EventListener<M> {

      private handlers: { [K in keyof M]?: EventHandler<M, K>[] } = {};

      on<K extends keyof M>(key: K, handler: EventHandler<M, K>) {
        (this.handlers[key] ??= []).push(handler);
      }

      off<K extends keyof M>(key: K, handler: EventHandler<M, K>) {
        const list = this.handlers[key];
        if (list) this.handlers[key] = list.filter(item => item.toString() !== handler.toString());
      }

      emit<K extends keyof M>(
        key: K,
        ...payload: M[K] extends never ? [] : [payload: M[K]]
      ) {
        const data = payload[0] as M[K];          // undefined for “no-payload” keys
        this.handlers[key]?.forEach(handler => (handler as any)(data));
      }
    }
}
