/// <reference path="../references.ts" />

module ProcessOut {
  type ErrorReport = {
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
    RawData?: any;
    InvoiceId?: string;
  }

  export class ErrorReporter {
    protected processOutInstance: ProcessOut

    constructor(processOutInstance: ProcessOut) {
      this.processOutInstance = processOutInstance
    }

    public reportError(error: ErrorReport) {
      if (!error) {
        return null
      }
      
      let attributes: Attributes = {
        Host: error.host,
        Category: error.category || "JS Error",
        File: error.fileName,
        Line: error.lineNumber,
        Stack: error.stack,
      }

      if (error.data) {
        attributes.RawData = JSON.stringify(error.data);
      }

      if (error.invoiceId) {
        attributes.InvoiceId = error.invoiceId;
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
              level: "error",
              timestamp: new Date().toISOString(),
              message: error.message,
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
