/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {

    /**
     * ProcessOut payment flow enum
     */
    export enum Flow {
        None                  = 1,
        OneOff,
        Subscription,
        Tokenization
    }
}
