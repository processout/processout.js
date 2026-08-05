/// <reference path="../references.ts" />

module ProcessOut {
  // The SDK raises "customer.canceled" for cancellations it detects itself
  // (overlay cancel, tab/window closed), while cancellations that happen on a
  // gateway's hosted page come back from the API as "customer.cancelled".
  // Both must be treated as a customer cancellation.
  export function isCustomerCancellationError(error: { code?: string }): boolean {
    return error.code === "customer.canceled" || error.code === "customer.cancelled"
  }
}
