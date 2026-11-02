/// <reference path="../references.ts" />

type NativeApmCustomerActionBarcode = {
  type: string
  value: string
}

/**
 * Customer instructions sent by the API in native APM parameter values.
 * The barcode comes as an object from GET native-payment and as flat keys from process native-payment.
 */
type NativeApmCustomerInstructionsValues = {
  customer_action_message?: string
  customer_action_barcode?: NativeApmCustomerActionBarcode
  customer_action_barcode_type?: string
  customer_action_barcode_value?: string
}

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for rendering customer instructions (message and QR code)
   */
  export class NativeApmCustomerInstructions {
    /**
     * This function returns the customer action message, or an empty string
     */
    static getMessage(values?: NativeApmCustomerInstructionsValues): string {
      return values && values.customer_action_message ? values.customer_action_message : ""
    }

    /**
     * This function returns the customer action barcode from the object or the flat keys
     */
    static getBarcode(
      values?: NativeApmCustomerInstructionsValues,
    ): NativeApmCustomerActionBarcode | undefined {
      if (!values) {
        return undefined
      }

      if (values.customer_action_barcode && values.customer_action_barcode.value) {
        return values.customer_action_barcode
      }

      if (values.customer_action_barcode_value) {
        return {
          type: values.customer_action_barcode_type || "qr",
          value: values.customer_action_barcode_value,
        }
      }

      return undefined
    }

    /**
     * This function creates the customer message element, rendered as markdown when the library is loaded
     */
    static createMessageElement(
      markdownLibraryInstance: any,
      theme: NativeApmThemeConfigType,
      message: string,
    ) {
      const customerMessage = document.createElement("p")

      customerMessage.setAttribute("class", "native-apm-message")

      StylesUtils.styleElement(customerMessage, theme.message)

      if (markdownLibraryInstance && markdownLibraryInstance.makeHtml) {
        customerMessage.innerHTML = markdownLibraryInstance.makeHtml(message)
      } else {
        customerMessage.textContent = message
      }

      return customerMessage
    }

    /**
     * This function creates the QR code element from a base64 encoded barcode value
     */
    static createQrCodeElement(
      theme: NativeApmThemeConfigType,
      barcode?: NativeApmCustomerActionBarcode,
    ) {
      const qrCodeElement = document.createElement("div")

      qrCodeElement.setAttribute("class", "native-apm-qr-code")

      StylesUtils.styleElement(qrCodeElement, theme.actionImage)

      const text =
        barcode && barcode.value
          ? NativeApmCustomerInstructions.decodeBarcodeValue(barcode.value)
          : null

      window.globalThis.QRCode &&
        text &&
        new window.globalThis.QRCode(qrCodeElement, {
          text,
          width: 128,
          height: 128,
        })

      return qrCodeElement
    }

    /**
     * This function decodes the base64 barcode value. An invalid value draws no QR code instead of breaking the view.
     */
    private static decodeBarcodeValue(value: string): string | null {
      try {
        return atob(value)
      } catch {
        return null
      }
    }
  }
}
