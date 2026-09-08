module ProcessOut {
    export type DeepPartial<T> = T extends object ? {
      [P in keyof T]?: DeepPartial<T[P]>
    } : T;

    type DeepReadonlyObject<T> = {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };

    type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

    export type DeepReadonly<T> =
      T extends (infer R)[] ? DeepReadonlyArray<R> :
        T extends Function ? T :
          T extends object ? DeepReadonlyObject<T> :
            T;

    type Dot<Left extends string, Right extends string> =
      Right extends '' ? Left : `${Left}.${Right}`;

    export type Paths<T> =
      '' | (
      T extends object
        ? {
          [K in keyof T & string]:
          K | Dot<K, Paths<T[K]>>
        }[keyof T & string]
        : never
      );

    export type PathValue<T, P extends string> =
      P extends '' ? T
        : P extends `${infer Head}.${infer Tail}`
          ? Head extends keyof T ? PathValue<T[Head], Tail> : never
          : P extends keyof T ? T[P]
            : never;

    export type Container = string | Element

    /**
     * Values used to prefill the payment method's form fields.
     *
     * `email` and `phone_number` are canonical: they match the field by type, so
     * they work whatever the gateway names its own parameter. Any gateway
     * parameter key can also be passed directly, and takes precedence over the
     * canonical key for that type.
     */
    export interface InitialData {
      email: string,
      /**
       * Either an E.164 string ("+48123123123") or the split form, with the
       * country given as a dialing code ("+48").
       */
      phone_number: string | {
        dialing_code?: string,
        value?: string,
      },
      [key: string]: unknown,
    }
}



