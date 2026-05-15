/**
 * @module faceApiLoader.test
 * @description Vitest tests for the loadFaceApi script-loader.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface FaceWindow {
  __faceApiLoaded?: boolean;
  faceapi?: unknown;
}

describe('loadFaceApi', () => {
  beforeEach(() => {
    vi.resetModules();
    const w = window as Window & FaceWindow;
    delete w.__faceApiLoaded;
    delete w.faceapi;
    // Clear any previously appended scripts
    document.head
      .querySelectorAll('script[src*="face-api"]')
      .forEach((s) => s.remove());
  });

  afterEach(() => {
    document.head
      .querySelectorAll('script[src*="face-api"]')
      .forEach((s) => s.remove());
  });

  it('exports loadFaceApi as a function', async () => {
    const mod = await import('../faceApiLoader');
    expect(typeof mod.loadFaceApi).toBe('function');
  });

  it('returns cached module when window.faceapi is already populated', async () => {
    const stub = { nets: {} };
    const w = window as Window & FaceWindow;
    w.__faceApiLoaded = true;
    w.faceapi = stub;
    const { loadFaceApi } = await import('../faceApiLoader');
    await expect(loadFaceApi()).resolves.toBe(stub);
  });

  it('appends a <script> tag pointing at the face-api CDN', async () => {
    const { loadFaceApi } = await import('../faceApiLoader');
    void loadFaceApi();
    const script = document.head.querySelector('script[src*="face-api"]');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('src')).toContain('face-api');
  });

  it('resolves once the loaded script populates window.faceapi', async () => {
    const { loadFaceApi } = await import('../faceApiLoader');
    const promise = loadFaceApi();
    const script = document.head.querySelector(
      'script[src*="face-api"]',
    ) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    const w = window as Window & FaceWindow;
    w.faceapi = { nets: {} };
    script?.dispatchEvent(new Event('load'));
    await expect(promise).resolves.toBeDefined();
  });

  it('rejects when the script errors out', async () => {
    const { loadFaceApi } = await import('../faceApiLoader');
    const promise = loadFaceApi();
    const script = document.head.querySelector(
      'script[src*="face-api"]',
    ) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event('error'));
    await expect(promise).rejects.toThrow(/Failed to load/);
  });
});
