/// <reference path="../references.ts" />

module ProcessOut {
  const DYNAMIC_CHECKOUT_EVENTS = {
    WIDGET_LOADING: "processout_dynamic_checkout_loading",
    WIDGET_READY: "processout_dynamic_checkout_ready",
    INVOICE_FETCHING_ERROR: "processout_dynamic_checkout_invoice_fetching_error",
    TOKENIZE_PAYMENT_SUCCESS: "processout_dynamic_checkout_tokenize_payment_success",
    TOKENIZE_PAYMENT_ERROR: "processout_dynamic_checkout_tokenize_payment_error",
    PAYMENT_ERROR: "processout_dynamic_checkout_payment_error",
    PAYMENT_SUCCESS: "processout_dynamic_checkout_payment_error",
  }

  export class DynamicCheckoutEventsUtils {
    static dispatchInvoiceFetchingErrorEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.INVOICE_FETCHING_ERROR,
        errorData,
      )

      return window.dispatchEvent(event)
    }

    static dispatchWidgetLoadingEvent() {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_LOADING)
      return window.dispatchEvent(event)
    }

    static dispatchWidgetReadyEvent() {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_READY)
      return window.dispatchEvent(event)
    }

    static dispatchTokenizePaymentSuccessEvent(token: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_SUCCESS, {
        token,
      })
      return window.dispatchEvent(event)
    }

    static dispatchTokenizePaymentErrorEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_ERROR,
        errorData,
      )
      return window.dispatchEvent(event)
    }
    
    static dispatchPaymentErrorEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_ERROR,
        errorData,
      )
      return window.dispatchEvent(event)
    }

    static dispatchPaymentSuccessEvent() {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_SUCCESS,
      )
      return window.dispatchEvent(event)
    }

    // IE 11 polyfill
    static createEvent(eventName: string, data?: any) {
      if (typeof window.CustomEvent === "function") {
        return new CustomEvent(eventName, {
          bubbles: true,
          detail: data,
        })
      } else {
        const event = document.createEvent("CustomEvent")
        event.initCustomEvent(eventName, true, false, data)
        return event
      }
    }
  }
}
