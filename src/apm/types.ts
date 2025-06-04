module ProcessOut {
    export type DeepPartial<T> = T extends object ? {
      [P in keyof T]?: DeepPartial<T[P]>
    } : T;


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

    export interface InitialData {
      email: string
    }
}



