/// <reference path="../references.ts" />

module ProcessOut {
  const DYNAMIC_CHECKOUT_EVENTS = {
    WIDGET_LOADING: "processout_dynamic_checkout_loading",
    WIDGET_READY: "processout_dynamic_checkout_ready",
    INVOICE_FETCHING_ERROR: "processout_dynamic_checkout_invoice_fetching_error",
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
    DELETE_PAYMENT_METHOD: "processout_dynamic_checkout_delete_payment_method_success",
    DELETE_PAYMENT_METHOD_ERROR: "processout_dynamic_checkout_delete_payment_method_error",
    PAYMENT_SUBMITTED: "processout_dynamic_checkout_payment_submitted",
    PAYMENT_PENDING: "processout_dynamic_checkout_payment_pending",
  }

  interface DynamicCheckoutEventDetail {
    payment_method_name: string | null
    return_url: string | null
    card_id?: string
  }

  interface DynamicCheckoutPaymentErrorEventDetail extends DynamicCheckoutEventDetail {
    error_type: string | null
    error_message: string | null
    invoice_id: string
    transaction_status?: string
    customer_token_id?: string
  }

  interface DynamicCheckoutPaymentSuccessEventDetail extends DynamicCheckoutEventDetail {
    invoice_id: string
    customer_token_id?: string
  }

  export class DynamicCheckoutEventsUtils {
    static dispatchInvoiceFetchingErrorEvent(
      invoiceId: string,
      errorData: any,
      returnUrl: string | null,
    ) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.INVOICE_FETCHING_ERROR,
        {
          ...errorData,
          invoice_id: invoiceId,
          payment_method_name: null,
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchWidgetLoadingEvent(invoiceId: string, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_LOADING, {
        invoice_id: invoiceId,
        payment_method_name: null,
        return_url: returnUrl,
      })
      return window.dispatchEvent(event)
    }

    static dispatchWidgetReadyEvent(invoiceId: string, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(DYNAMIC_CHECKOUT_EVENTS.WIDGET_READY, {
        invoice_id: invoiceId,
        return_url: returnUrl,
      })
      return window.dispatchEvent(event)
    }

    static dispatchNoDynamicCheckoutConfigurationEvent(errorData: any, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.NO_DYNAMIC_CHECKOUT_CONFIGURATION,
        {
          ...errorData,
          payment_method_name: null,
          return_url: returnUrl,
        },
      )
      return window.dispatchEvent(event)
    }

    static dispatchPaymentErrorEvent(
      invoiceId: string,
      errorData: any,
      paymentMethodName?: string,
      cardId?: string,
      returnUrl?: string | null,
      customerTokenId?: string,
    ) {
      const normalizedError = DynamicCheckoutEventsUtils.normalizePaymentError(
        invoiceId,
        errorData,
        paymentMethodName || null,
        cardId,
        returnUrl || null,
        customerTokenId,
      )

      // TODO: Temporary fix until we fix properly the field unavailable error
      if (normalizedError.error_type === "processout-js.field.unavailable") {
        return
      }

      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.PAYMENT_ERROR,
        normalizedError,
      )
      return window.dispatchEvent(event)
    }

    static dispatchPaymentSuccessEvent(response: DynamicCheckoutPaymentSuccessEventDetail) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.PAYMENT_SUCCESS,
        {
          ...response,
          payment_method_name: response.payment_method_name || null,
          return_url: response.return_url || null,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchApplePayNewSessionEvent(invoiceId: string, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_NEW_SESSION,
        {
          invoice_id: invoiceId,
          payment_method_name: "apple_pay",
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchApplePayAuthorizedPostProcessEvent(invoiceId: string, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_AUTHORIZED_POST_PROCESS,
        {
          invoice_id: invoiceId,
          payment_method_name: "apple_pay",
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchApplePaySessionError(invoiceId: string, err: any, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.APPLE_PAY_SESSION_ERROR,
        {
          ...err,
          invoice_id: invoiceId,
          payment_method_name: "apple_pay",
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchDeletePaymentMethodEvent(
      invoiceId: string,
      paymentMethodName: string | null,
      returnUrl: string | null,
    ) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.DELETE_PAYMENT_METHOD,
        {
          invoice_id: invoiceId,
          payment_method_name: paymentMethodName,
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchDeletePaymentMethodErrorEvent(
      invoiceId: string,
      err: any,
      paymentMethodName: string | null,
      returnUrl: string | null,
    ) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.DELETE_PAYMENT_METHOD_ERROR,
        {
          ...err,
          invoice_id: invoiceId,
          payment_method_name: paymentMethodName,
          return_url: returnUrl,
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchGooglePayLoadError(errorData: any, invoiceId: string, returnUrl: string | null) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.GOOGLE_PAY_LOAD_ERROR,
        {
          ...DynamicCheckoutEventsUtils.getEventDetail(errorData),
          invoice_id: invoiceId,
          return_url: returnUrl,
          payment_method_name: "google_pay",
        },
      )

      return window.dispatchEvent(event)
    }

    static dispatchPaymentSubmittedEvent(details: {
      payment_method_name: string
      invoice_id: string
      return_url: string | null
      customer_token_id?: string
    }) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.PAYMENT_SUBMITTED,
        details,
      )

      return window.dispatchEvent(event)
    }

    static dispatchPaymentCancelledEvent(details: {
      payment_method_name: string
      invoice_id: string
      return_url: string | null
    }) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.PAYMENT_CANCELLED,
        details,
      )

      return window.dispatchEvent(event)
    }

    static dispatchPaymentPendingEvent(details: {
      payment_method_name: string
      invoice_id: string
      return_url: string | null
      customer_token_id?: string
    }) {
      const event = DynamicCheckoutEventsUtils.createEvent(
        DYNAMIC_CHECKOUT_EVENTS.PAYMENT_PENDING,
        details,
      )

      return window.dispatchEvent(event)
    }

    private static getEventDetail(data: any) {
      if (typeof data === "object" && data !== null && "detail" in data) {
        return data.detail
      }

      return data
    }

    private static normalizePaymentError(
      invoiceId: string,
      errorData: any,
      paymentMethodName: string | null,
      cardId?: string,
      returnUrl?: string | null,
      customerTokenId?: string,
    ): DynamicCheckoutPaymentErrorEventDetail {
      const normalizedError = DynamicCheckoutEventsUtils.getEventDetail(errorData)
      const isObject = typeof normalizedError === "object" && normalizedError !== null

      return {
        invoice_id: invoiceId,
        payment_method_name: paymentMethodName,
        return_url: returnUrl || null,
        ...(cardId && { card_id: cardId }),
        ...(customerTokenId && { customer_token_id: customerTokenId }),
        error_type: isObject ? normalizedError.error_type || normalizedError.code || null : null,
        error_message: isObject
          ? normalizedError.error_message || normalizedError.message || null
          : normalizedError == null
            ? null
            : String(normalizedError),
        ...(isObject &&
          normalizedError.transaction_status && {
            transaction_status: normalizedError.transaction_status,
          }),
      }
    }

    private static sanitizeEventDetail(data?: any) {
      if (!data || Object.prototype.toString.call(data) !== "[object Object]") {
        return data
      }

      return Object.keys(data).reduce((sanitizedData, key) => {
        if (data[key] !== null && data[key] !== undefined) {
          sanitizedData[key] = data[key]
        }

        return sanitizedData
      }, {})
    }

    // IE 11 polyfill
    static createEvent(eventName: string, data?: any) {
      const sanitizedData = DynamicCheckoutEventsUtils.sanitizeEventDetail(data)

      if (typeof window.CustomEvent === "function") {
        return new CustomEvent(eventName, {
          bubbles: true,
          detail: sanitizedData,
        })
      } else {
        const event = document.createEvent("CustomEvent")
        event.initCustomEvent(eventName, true, false, sanitizedData)
        return event
      }
    }
  }
}
