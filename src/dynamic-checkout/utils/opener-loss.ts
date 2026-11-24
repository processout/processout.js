module ProcessOut {
  /**
   * Rollout mode for treating a `tab_closed` as a lost opener (e.g. after a COOP page) instead of a cancel.
   * Sent by the API per APM payment method; a missing value means "off".
   */
  export type OpenerLossHandling = "off" | "shadow" | "on"

  export type OpenerLossVerdict = "real_close" | "severed_link"

  /**
   * What DC does after a `tab_closed`:
   * - `cancel`: today's "payment cancelled".
   * - `opener_loss`: wait for the outcome (awaiting view and polling).
   * - `confirm_close`: check the transaction once, then show success or "payment cancelled".
   */
  export type TabClosedHandling = "cancel" | "opener_loss" | "confirm_close"

  export type OpenerLossPageState = {
    hasFocus: boolean
    visibilityState: string
  }

  export type OpenerLossContext = {
    mode?: string
    gatewayName?: string
    invoiceId?: string
    actionStartedAt?: number
  }

  const OPENER_LOSS_MODES: OpenerLossHandling[] = ["off", "shadow", "on"]
  // Read by checkout /redirect, so /continue can show a "you can close this tab" landing instead of
  // forwarding to the merchant when the PSP tab lost its link to the checkout.
  const DYNAMIC_CHECKOUT_FLOW_QUERY = "po_flow=dynamic-checkout"
  const OPENER_LOSS_TELEMETRY_MESSAGE = "dynamic checkout opener loss verdict"

  export class DynamicCheckoutOpenerLossUtils {
    static markRedirectUrl(url: string): string {
      if (!url) {
        return url
      }
      return url + (url.indexOf("?") === -1 ? "?" : "&") + DYNAMIC_CHECKOUT_FLOW_QUERY
    }

    static getMode(value?: string): OpenerLossHandling {
      return OPENER_LOSS_MODES.indexOf(value as OpenerLossHandling) !== -1
        ? (value as OpenerLossHandling)
        : "off"
    }

    static readPageState(doc: Document = document): OpenerLossPageState {
      return {
        hasFocus: doc.hasFocus(),
        visibilityState: doc.visibilityState,
      }
    }

    /**
     * After a real close the browser activates the DC page before PO.js notices the closed tab.
     * A severed opener leaves the shopper on the PSP tab, so the DC page is hidden or unfocused.
     */
    static getVerdict(state: OpenerLossPageState): OpenerLossVerdict {
      return state.hasFocus && state.visibilityState === "visible" ? "real_close" : "severed_link"
    }

    /**
     * Decides how DC handles a `customer.canceled` with reason `tab_closed`. It must run synchronously at the start of the error
     * callback: PO.js calls `window.focus()` right after it, which would change the page state.
     * Returns true when DC should treat the payment as pending instead of cancelled.
     */
    static isOpenerLoss(
      processOutInstance: ProcessOut,
      error: Exception,
      context: OpenerLossContext,
      doc: Document = document,
    ): boolean {
      return (
        DynamicCheckoutOpenerLossUtils.getTabClosedHandling(
          processOutInstance,
          error,
          context,
          doc,
        ) === "opener_loss"
      )
    }

    /**
     * Same check as `isOpenerLoss`, with the outcome for a real close in `on` mode: `confirm_close`.
     * A shopper whose PSP tab lost only its own opener sees the "you can close this tab" landing, closes it,
     * and DC sees a real close although the payment may be done; one status check avoids a false "cancelled".
     */
    static getTabClosedHandling(
      processOutInstance: ProcessOut,
      error: Exception,
      context: OpenerLossContext,
      doc: Document = document,
    ): TabClosedHandling {
      if (
        error.code !== "customer.canceled" ||
        !error.metadata ||
        error.metadata.reason !== "tab_closed"
      ) {
        return "cancel"
      }

      const mode = DynamicCheckoutOpenerLossUtils.getMode(context.mode)
      if (mode === "off") {
        return "cancel"
      }

      const state = DynamicCheckoutOpenerLossUtils.readPageState(doc)
      const verdict = DynamicCheckoutOpenerLossUtils.getVerdict(state)

      DynamicCheckoutOpenerLossUtils.report(processOutInstance, context, mode, verdict, state)

      if (mode !== "on") {
        return "cancel"
      }
      return verdict === "severed_link" ? "opener_loss" : "confirm_close"
    }

    private static report(
      processOutInstance: ProcessOut,
      context: OpenerLossContext,
      mode: OpenerLossHandling,
      verdict: OpenerLossVerdict,
      state: OpenerLossPageState,
    ) {
      processOutInstance.telemetryClient.report(
        {
          host: window && window.location ? window.location.host : "",
          fileName: "dynamic-checkout/utils/opener-loss.ts",
          lineNumber: 0,
          message: OPENER_LOSS_TELEMETRY_MESSAGE,
          category: "dynamic-checkout",
          invoiceId: context.invoiceId,
          data: {
            mode: mode,
            verdict: verdict,
            gateway_name: context.gatewayName || "",
            has_focus: state.hasFocus,
            visibility_state: state.visibilityState,
            ms_since_action_start: context.actionStartedAt
              ? Date.now() - context.actionStartedAt
              : null,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          },
        },
        "info",
      )
    }
  }
}
