/// <reference path="../references.ts" />

module ProcessOut {
  export type DynamicCheckoutThemeType = {
    payButtonColor?: string;
    payButtonTextColor?: string;
  };

  export class DynamicCheckoutTheme {
    payButtonColor?: string;
    payButtonTextColor?: string;

    constructor(config?: DynamicCheckoutThemeType) {
      this.payButtonColor = config?.payButtonColor;
      this.payButtonTextColor = config?.payButtonTextColor;
    }

    public getConfig(): DynamicCheckoutThemeType {
      return {
        payButtonColor: this.payButtonColor,
        payButtonTextColor: this.payButtonTextColor,
      };
    }
  }
}
