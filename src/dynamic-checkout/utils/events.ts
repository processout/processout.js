/// <reference path="../references.ts" />

module ProcessOut {
  const DYNAMIC_CHECKOUT_EVENTS = {
    WIDGET_LOADING: "processout_dynamic_checkout_loading",
    WIDGET_READY: "processout_dynamic_checkout_ready",
    INVOICE_FETCHING_ERROR: "processout_dynamic_checkout_invoice_fetching_error",
    TOKENIZE_PAYMENT_SUCCESS: "processout_dynamic_checkout_tokenize_payment_success",
    TOKENIZE_PAYMENT_ERROR: "processout_dynamic_checkout_tokenize_payment_error",
    NO_DYNAMIC_CHECKOUT_CONFIGURATION:
      "processout_dynamic_checkout_no_dynamic_checkout_configuration",
    PAYMENT_ERROR: "processout_dynamic_checkout_payment_error",
    PAYMENT_SUCCESS: "processout_dynamic_checkout_payment_success",
    PAYMENT_CANCELLED: "processout_dynamic_checkout_payment_cancelled",
GOOGLE_PAY_LOAD_ERROR: "processout_dynamic_checkout_google_pay_load_error",
    APPLE_PAY_NEW_SESSION: "processout_dynamic_checkout_apple_pay_new_session",
    APPLE_PAY_SESSION_ERROR: "processout_dynamic_checkout_apple_pay_session_error",
    APPLE_PAY_AUTHORIZED_POST_PROCESS:
      "processout_dynamic_checkout_apple_pay_authorized_post_process",
    DELETE_PAYMENT_METHOD: "processout_dynamic_checkout_delete_payment_method",
    DELETE_PAYMENT_METHOD_ERROR: "processout_dynamic_checkout_delete_payment_method_error",
    PAYMENT_SUBMITTED: "processout_dynamic_checkout_payment_submitted",
    PAYMENT_PENDING: "processout_dynamic_checkout_payment_pending",
  }

  export class DynamicCheckoutEventsUtils {
    static dispatchInvoiceFetchingErrorEvent(invoiceId: string, errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.INVOICE_FETCHING_ERROR,
        { ...errorData, invoice_id: invoiceId },
      )

      return window.dispatchEvent(event)
    }

    static dispatchWidgetLoadingEvent(invoiceId: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_LOADING, {
        invoice_id: invoiceId,
      })
      return window.dispatchEvent(event)
    }

    static dispatchWidgetReadyEvent(invoiceId: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_READY, {
        invoice_id: invoiceId,
      })
      return window.dispatchEvent(event)
    }

    static dispatchTokenizePaymentSuccessEvent(invoiceId: string, cardId: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_SUCCESS, {
        card_id: cardId,
        invoice_id: invoiceId,
      })
      return window.dispatchEvent(event)
    }

    static dispatchTokenizePaymentErrorEvent(invoiceId: string, errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.TOKENIZE_PAYMENT_ERROR,
        { ...errorData, invoice_id: invoiceId },
      )
      return window.dispatchEvent(event)
    }

    static dispatchNoDynamicCheckoutConfigurationEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.NO_DYNAMIC_CHECKOUT_CONFIGURATION,
        errorData,
      )
      return window.dispatchEvent(event)
    }

    static dispatchPaymentErrorEvent(
      invoiceId: string,
      errorData: any,
      customerTokenId?: string,
      paymentMethodName?: string,
    ) {
      const normalizedError =
        typeof errorData === "object" && errorData !== null
          ? errorData
          : { message: String(errorData) }

      // TODO: Temporary fix until we fix properly the field unavailable error
      if (normalizedError.code === "processout-js.field.unavailable") {
        return
      }

      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.PAYMENT_ERROR, {
        ...normalizedError,
        invoice_id: invoiceId,
        reason: normalizedError.message || null,
        ...(customerTokenId && { customer_token_id: customerTokenId }),
        ...(paymentMethodName && { payment_method_name: paymentMethodName }),
      })
      return window.dispatchEvent(event)
    }

    static dispatchPaymentSuccessEvent(response: {
      invoice_id: string
      return_url: string
      customer_token_id?: string
      payment_method_name?: string
    }) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.PAYMENT_SUCCESS, response)

      return window.dispatchEvent(event)
    }

    static dispatchApplePayNewSessionEvent(invoiceId: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_NEW_SESSION, {
        invoice_id: invoiceId,
      })

      return window.dispatchEvent(event)
    }

    static dispatchApplePayAuthorizedPostProcessEvent(invoiceId: string) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_AUTHORIZED_POST_PROCESS,
        { invoice_id: invoiceId },
      )

      return window.dispatchEvent(event)
    }

    static dispatchApplePaySessionError(invoiceId: string, err: any) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_SESSION_ERROR, {
        ...err,
        invoice_id: invoiceId,
      })

      return window.dispatchEvent(event)
    }

    static dispatchDeletePaymentMethodEvent(invoiceId: string) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.DELETE_PAYMENT_METHOD, {
        invoice_id: invoiceId,
      })

      return window.dispatchEvent(event)
    }

    static dispatchDeletePaymentMethodErrorEvent(invoiceId: string, err: any) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.DELETE_PAYMENT_METHOD_ERROR,
        { ...err, invoice_id: invoiceId },
      )

      return window.dispatchEvent(event)
    }

static dispatchGooglePayLoadError(errorData: { invoice_id: string; return_url: string }) {
      const event = EventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.GOOGLE_PAY_LOAD_ERROR,
        errorData,
      )

      return window.dispatchEvent(event)
    }

    static dispatchPaymentSubmittedEvent(details: {
      payment_method_name: string
      invoice_id: string
      customer_token_id?: string
    }) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.PAYMENT_SUBMITTED, details)

      return window.dispatchEvent(event)
    }

    static dispatchPaymentCancelledEvent(details: {
      payment_method_name: string
      invoice_id: string
    }) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.PAYMENT_CANCELLED, details)

      return window.dispatchEvent(event)
    }

    static dispatchPaymentPendingEvent(details: {
      payment_method_name: string
      invoice_id: string
      reason: string | null
      customer_token_id?: string
    }) {
      const event = EventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.PAYMENT_PENDING, details)

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
