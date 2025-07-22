// Polyfill for globalThis (needed for IE11 and older browsers)
(function() {
  if (typeof globalThis === 'undefined') {
    if (typeof window !== 'undefined') {
      // Use Object.defineProperty to avoid the no-global-assign lint error
      Object.defineProperty(window, 'globalThis', {
        value: window,
        writable: true,
        configurable: true
      });
    } else if (typeof global !== 'undefined') {
      // Use Object.defineProperty to avoid the no-global-assign lint error
      Object.defineProperty(global, 'globalThis', {
        value: global,
        writable: true,
        configurable: true
      });
    } else if (typeof self !== 'undefined') {
      // Use Object.defineProperty to avoid the no-global-assign lint error
      Object.defineProperty(self, 'globalThis', {
        value: self,
        writable: true,
        configurable: true
      });
    }
  }
})(); 