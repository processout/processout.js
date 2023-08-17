export const emitEvent = (type: string) => window.postMessage({ type }, '*');
