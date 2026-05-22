/**
 * @module porcupine-web mock
 * @description Vitest test-environment stub for @picovoice/porcupine-web.
 * The real SDK ships browser-native WASM and AudioWorklet code that cannot
 * resolve in a jsdom environment. All methods are no-ops here; the real
 * package is only used when `accessKey` is non-null and we're in a browser.
 */
export const PorcupineWorker = {
  create: async () => ({
    start: () => {},
    stop: () => {},
    release: () => {},
    onmessage: null as null | ((e: unknown) => void),
  }),
};
