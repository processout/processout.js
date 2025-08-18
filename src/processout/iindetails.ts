/// <reference path="../references.ts" />

module ProcessOut {
    /**
     * CardInformation interface represents the card information returned by the IIN details API
     */
    export interface CardInformation {
        bank_name: string;
        brand: string;
        category: string;
        co_scheme: string | null;
        combo_card_types: string | null;
        country: string;
        scheme: string;
        type: string;
    }

    /**
     * IINDetailsResponse interface represents the complete response from the IIN details API
     */
    export interface IINDetailsResponse {
        card_information: CardInformation;
        success: boolean;
    }

    /**
     * IINDetails class for handling IIN (Issuer Identification Number) details
     * and API calls to retrieve card information based on IIN numbers.
     */
    export class IINDetails {
        /**
         * ProcessOut instance
         * @var {ProcessOut}
         */
        protected instance: ProcessOut;

        /**
         * IINDetails constructor.
         * @param {ProcessOut} instance
         */
        public constructor(instance: ProcessOut) {
            this.instance = instance;
        }

        /**
         * getIINDetails retrieves the IIN (Issuer Identification Number) details
         * for a given card number string. The IIN is truncated to 6 digits for lookup.
         * @param {string} cardNumber
         * @param {callback} success
         * @param {callback} error
         * @return {Promise<IINDetailsResponse>} Promise that resolves to the IIN details response
         */
        public getIINDetails(
            cardNumber: string,
            success?: (data: IINDetailsResponse) => void,
            error?: (err: Exception) => void
        ): Promise<IINDetailsResponse> {
            return new Promise((resolve, reject) => {
                // Add a timeout to detect if the Promise hangs
                const timeoutId = setTimeout(() => {
                    const timeoutException = new Exception("processout-js.iin-timeout", 
                        "IIN details request timed out");
                    reject(timeoutException);
                    if (error) error(timeoutException);
                }, 10000); // 10 second timeout
                
                // Validate the IIN number first
                if (!this.validateIIN(cardNumber)) {
                    clearTimeout(timeoutId);
                    const exception = new Exception("processout-js.iin-invalid-length", 
                        "IIN number must be more than 6 digits.");
                    reject(exception);
                    if (error) error(exception);
                    return;
                }

                // Truncate the IIN number to appropriate length
                const truncatedIIN = this.truncateIIN(cardNumber);
                if (!truncatedIIN) {
                    clearTimeout(timeoutId);
                    const exception = new Exception("processout-js.iin-invalid-length", 
                        "Failed to truncate IIN number.");
                    reject(exception);
                    if (error) error(exception);
                    return;
                }

                // Make API request to get IIN details using ProcessOut apiRequest with basicAuth disabled
                // Use the same URL pattern as tokenize method: "iins/{iin}" instead of "/iins/{iin}"
                const iinPath = `iins/${truncatedIIN}`;
                this.instance.apiRequest("get", iinPath, {}, 
                    function(data: IINDetailsResponse, req: XMLHttpRequest, e: Event): void {
                        clearTimeout(timeoutId);
                        resolve(data);
                        if (success) success(data);
                    }, 
                    function(req: XMLHttpRequest, e: Event, errorCode: any): void {
                        clearTimeout(timeoutId);
                        const exception = new Exception("processout-js.iin-details-error", 
                            "Failed to retrieve IIN details.");
                        reject(exception);
                        if (error) error(exception);
                    },
                    undefined, // retry parameter
                    { 
                        isLegacy: false,
                        basicAuth: false
                    } // disable basic auth for this endpoint
                );
            });
        }

        /**
         * validateIIN validates that the IIN number has sufficient length for processing
         * @param {string} iinNumber
         * @return {boolean} true if valid, false otherwise
         */
        public validateIIN(iinNumber: string): boolean {
            return iinNumber.length >= 6;
        }

        /**
         * truncateIIN truncates the IIN number to the appropriate length for API lookup
         * @param {string} iinNumber
         * @return {string | null} truncated IIN number or null if invalid
         */
        public truncateIIN(iinNumber: string): string | null {
            if (iinNumber.length >= 6) {
                return iinNumber.substring(0, 6);
            }
            return null;
        }
    }
}
