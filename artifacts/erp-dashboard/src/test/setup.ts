/**
 * @module setup
 * @description Vitest global setup — testing-library matchers + IndexedDB polyfill.
 *
 * IndexedDB mock (fake-indexeddb) — POS offline store (Dexie) testlarda kerak.
 * Optional import: agar paket o'rnatilmagan bo'lsa, setup baribir ishlaydi.
 */

import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// jsdom doesn't implement window.matchMedia — many UI components (theme,
// responsive hooks) call it. Polyfill it with a no-op implementation.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom lacks ResizeObserver and IntersectionObserver — Radix UI primitives
// (Tooltip, Dialog) and many chart libraries rely on them.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  } as unknown as typeof IntersectionObserver;
}
