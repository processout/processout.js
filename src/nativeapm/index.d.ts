export {};

declare global {
  interface Window {
    globalThis: any;
    CustomEvent: any;
  }
}
