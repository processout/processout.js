/// <reference path="../references.ts" />

module ProcessOut {
  export var OUTCOME = {
    Success: "success",
    Failed: "failed",
    Pending: "pending",
  }

  export function resolveOutcome(data: any): string {
    if (
      data.outcome === OUTCOME.Success ||
      data.outcome === OUTCOME.Failed ||
      data.outcome === OUTCOME.Pending
    ) {
      return data.outcome
    }

    return data.success ? OUTCOME.Success : OUTCOME.Failed
  }
}
