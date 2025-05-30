/// <reference path="../references.ts" />

module ProcessOut {
  type ErrorReport = {
    host: string
    fileName: string
    lineNumber: number
    message: string
    stack?: string
    category?: string
  }

  export class ErrorReporter {
    protected processOutInstance: ProcessOut

    constructor(processOutInstance: ProcessOut) {
      this.processOutInstance = processOutInstance
    }

    public reportError(error: ErrorReport) {
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
              attributes: {
                Host: error.host,
                Category: error.category || "JS Error",
                File: error.fileName,
                Line: error.lineNumber,
                Stack: error.stack,
              },
            },
          ],
        },
        () => {},
        () => {},
      )
    }
  }
}
