module ProcessOut {
    export interface APMEvents extends EventMap {
      // Initial event that is sent prior any other event
      "initialised": never
      
      // Indicates that implementation successfully loaded initial portion of data and currently waiting for user
      // to fulfil needed info
      "start": never
      
      // This event is emitted when a user clicks the "Cancel payment" button, prompting the system to display a
      // confirmation dialog. This event signifies the initiation of the cancellation confirmation process
      "request-cancel": never
      
      // Event is sent when the user changes any editable value
      "field-change": {
        parameter: { key: string, value: FormState['values'][string] }
      }
      
      // Event is sent just before sending user input, this is usually a result of a user action, e.g. button press
      "submit": {
        parameters: { key: string, value: FormState['values'][string] }[]
      }
      
      // Sent in case parameters were submitted successfully. You could inspect the associated value to understand
      // whether additional input is required
      "submit-success": {
        additionalParametersExpected: boolean
      }
      
      // Sent in case parameters submission failed and if error is retriable, otherwise expect `did-fail` event
      "submit-error": {
        failure: { message: string; code: string }
      }
      
      // Event is sent after all information is collected, and implementation is waiting for a PSP to confirm payment.
      // You could check associated value `additionalActionExpected` to understand whether user needs
      // to execute additional action(s) outside application, for example confirming operation in his/her banking app
      // to finalize payment
      "payment-pending": never
      
      // This event is triggered during the `PENDING` state when the user confirms that they have completed
      // any required external action (if applicable). Once the event is triggered, the implementation
      // proceeds with the actual completion confirmation process
      "pending-confirmed": never

      "payment-cancelled": never
      
      // Event is sent after payment was confirmed to be completed. This is a final event
      "success": {
        trigger: 'user' | 'timeout' | 'immediate'
      }
      
      // Event is sent in case unretryable error occurs. This is a final event
      "failure": {
        // Failure
        failure: { message: string; code: string }
        
        // Indicates the payment state at the moment the failure occurred
        // This provides additional context about where in the payment process the failure happened
        paymentState?: string
      }

      "copy-to-clipboard": {
        text: string
      }

      "download-image": never
        
      // Catch-all event that fires for every event with unified structure
      "*": {
        [K in keyof Omit<APMEvents, '*'>]: APMEvents[K] extends never 
          ? { type: K }
          : { type: K } & APMEvents[K]
      }[keyof Omit<APMEvents, '*'>]
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

      emit<K extends keyof Omit<APMEvents, '*'>>(key: K, ...payload: APMEvents[K] extends never ? [] : [payload: APMEvents[K]]
      ) {
        if (key === '*') {
          return;
        }
        super.emit(key, ...payload);
      }
    }
}
