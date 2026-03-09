/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  export const NATIVE_APM_EVENTS = {
    WIDGET_LOADING: "processout_native_apm_loading",
    WIDGET_READY: "processout_native_apm_ready",
    GATEWAY_CONFIGURATION_ERROR:
      "processout_native_apm_gateway_configuration_error",
    PAYMENT_INIT: "processout_native_apm_payment_init",
    PAYMENT_ADDITIONAL_INPUT: "processout_native_apm_payment_additional_input",
    PAYMENT_SUCCESS: "processout_native_apm_payment_success",
    PAYMENT_ERROR: "processout_native_apm_payment_error",
  };

  /**
   * ProcessOut Native APM class to handle event dispatching
   */
  export class EventsUtils {
    static dispatchGatewayConfigurationErrorEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        NATIVE_APM_EVENTS.GATEWAY_CONFIGURATION_ERROR,
        errorData
      );

      return window.dispatchEvent(event);
    }

    static dispatchPaymentInitEvent() {
      const event = EventsUtils.createEvent(NATIVE_APM_EVENTS.PAYMENT_INIT);
      return window.dispatchEvent(event);
    }

    static dispatchWidgetLoadingEvent() {
      const event = EventsUtils.createEvent(NATIVE_APM_EVENTS.WIDGET_LOADING);
      return window.dispatchEvent(event);
    }

    static dispatchWidgetReadyEvent() {
      const event = EventsUtils.createEvent(NATIVE_APM_EVENTS.WIDGET_READY);
      return window.dispatchEvent(event);
    }

    static dispatchPaymentAdditionalInputEvent() {
      const event = EventsUtils.createEvent(
        NATIVE_APM_EVENTS.PAYMENT_ADDITIONAL_INPUT
      );
      return window.dispatchEvent(event);
    }

    static dispatchPaymentSuccessEvent(data: { returnUrl: string }) {
      const event = EventsUtils.createEvent(
        NATIVE_APM_EVENTS.PAYMENT_SUCCESS,
        data
      );
      return window.dispatchEvent(event);
    }

    static dispatchPaymentErrorEvent(errorData: any) {
      const event = EventsUtils.createEvent(
        NATIVE_APM_EVENTS.PAYMENT_ERROR,
        errorData
      );
      return window.dispatchEvent(event);
    }

    private static sanitizeEventDetail(data?: any) {
      if (!data || Object.prototype.toString.call(data) !== "[object Object]") {
        return data;
      }

      return Object.keys(data).reduce((sanitizedData, key) => {
        if (data[key] !== null && data[key] !== undefined) {
          sanitizedData[key] = data[key];
        }

        return sanitizedData;
      }, {});
    }

    // IE 11 polyfill
    static createEvent(eventName: string, data?: any) {
      const sanitizedData = EventsUtils.sanitizeEventDetail(data);

      if (typeof window.CustomEvent === "function") {
        return new CustomEvent(eventName, {
          bubbles: true,
          detail: sanitizedData,
        });
      } else {
        const event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, false, sanitizedData);
        return event;
      }
    }
  }
}
