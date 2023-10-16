/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  const NATIVE_APM_EVENTS = {
    WIDGET_LOADING: 'processout_native_apm_loading',
    WIDGET_READY: 'processout_native_apm_ready',
    GATEWAY_CONFIGURATION_ERROR:
      'processout_native_apm_gateway_configuration_error',
    PAYMENT_INIT: 'processout_native_apm_payment_init',
    PAYMENT_ADDITIONAL_INPUT: 'processout_native_apm_payment_additional_input',
    PAYMENT_SUCCESS: 'processout_native_apm_payment_success',
    PAYMENT_ERROR: 'processout_native_apm_payment_error',
  };

  /**
   * ProcessOut Native APM class to handle event dispatching
   */
  export class EventsUtils {
    static dispatchGatewayConfigurationErrorEvent(errorData: any) {
      const event = new CustomEvent(
        NATIVE_APM_EVENTS.GATEWAY_CONFIGURATION_ERROR,
        {
          detail: errorData,
        }
      );
      return window.dispatchEvent(event);
    }

    static dispatchPaymentInitEvent() {
      const event = new CustomEvent(NATIVE_APM_EVENTS.PAYMENT_INIT);
      return window.dispatchEvent(event);
    }

    static dispatchWidgetLoadingEvent() {
      const event = new CustomEvent(NATIVE_APM_EVENTS.WIDGET_LOADING);
      return window.dispatchEvent(event);
    }

    static dispatchWidgetReadyEvent() {
      const event = new CustomEvent(NATIVE_APM_EVENTS.WIDGET_READY);
      return window.dispatchEvent(event);
    }

    static dispatchPaymentAdditionalInputEvent() {
      const event = new CustomEvent(NATIVE_APM_EVENTS.PAYMENT_ADDITIONAL_INPUT);
      return window.dispatchEvent(event);
    }

    static dispatchPaymentSuccessEvent() {
      const event = new CustomEvent(NATIVE_APM_EVENTS.PAYMENT_SUCCESS);
      return window.dispatchEvent(event);
    }

    static dispatchPaymentErrorEvent(errorData: any) {
      const event = new CustomEvent(NATIVE_APM_EVENTS.PAYMENT_ERROR, {
        detail: errorData,
      });
      return window.dispatchEvent(event);
    }
  }
}
