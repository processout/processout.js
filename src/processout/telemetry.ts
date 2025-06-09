/// <reference path="../references.ts" />

module ProcessOut {
  type TelemetryEventData = {
    host: string
    fileName: string
    lineNumber: number
    message: string
    stack?: string
    invoiceId?: string
    category?: string
    data?: Record<string, any>
  }

  type Attributes = {
    Host: string
    Category: string
    File: string
    Line: number
    Stack: string
    RawData?: any
    InvoiceId?: string
  }

  export class TelemetryClient {
    protected processOutInstance: ProcessOut

    constructor(processOutInstance: ProcessOut) {
      this.processOutInstance = processOutInstance
    }

    public reportError(data: TelemetryEventData) {
      return this.report(data, "error")
    }

    public reportWarning(data: TelemetryEventData) {
      return this.report(data, "warn")
    }

    public report(data: TelemetryEventData, level: "error" | "warn" | "info" = "error") {
      if (!data) {
        return null
      }

      let attributes: Attributes = {
        Host: data.host,
        Category: data.category || "JS data",
        File: data.fileName,
        Line: data.lineNumber,
        Stack: data.stack,
      }

      if (data.data) {
        attributes.RawData = JSON.stringify(data.data)
      }

      if (data.invoiceId) {
        attributes.InvoiceId = data.invoiceId
      }

      this.processOutInstance.apiRequest(
        "POST",
        "telemetry",
        {
          metadata: {
            application: {
              name: "processout.js",
              version: SCRIPT_VERSION,
            },
            device: {
              model: "web",
            },
          },
          events: [
            {
              level: level,
              timestamp: new Date().toISOString(),
              message: data.message,
              attributes: attributes,
            },
          ],
        },
        () => {},
        () => {},
      )
    }
  }
}
