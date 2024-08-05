/// <reference path="../references.ts" />

module ProcessOut {
  export class DynamicCheckoutColorsUtils {
    static hexToRgba(hex: string): string {
      const r = parseInt(hex.slice(2, 4), 16);
      const g = parseInt(hex.slice(4, 6), 16);
      const b = parseInt(hex.slice(6, 8), 16);
      const a = parseInt(hex.slice(8, 10), 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
}
