/// <reference path="../references.ts" />

/**
 * ProcessOut module/namespace
 */
module ProcessOut {
  /**
   * ProcessOut Native APM class for handling styling of the elements
   */
  export class StylesUtils {
    static styleElement(node: HTMLElement, styles: Record<string, string>) {
      return Object.keys(styles).forEach((style) => {
        node.style[style] = styles[style];
      });
    }
  }
}
