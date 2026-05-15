/**
 * @module use-auth.test
 * @description Vitest tests for the deprecated use-auth shim re-export.
 */

import { describe, it, expect } from 'vitest';
import * as legacyShim from './use-auth';
import { useAuth as canonicalUseAuth } from './useAuth';

describe('use-auth shim', () => {
  it('exports the canonical useAuth function', () => {
    expect(typeof legacyShim.useAuth).toBe('function');
  });

  it('re-exports the identical useAuth reference', () => {
    expect(legacyShim.useAuth).toBe(canonicalUseAuth);
  });

  it('only forwards useAuth and AuthUser (no extra runtime exports)', () => {
    const runtimeExports = Object.keys(legacyShim).filter(
      (key) => typeof (legacyShim as Record<string, unknown>)[key] === 'function',
    );
    expect(runtimeExports).toEqual(['useAuth']);
  });

  it('useAuth re-export is callable from the shim path', () => {
    const fn = legacyShim.useAuth;
    expect(fn.name).toBe('useAuth');
  });
});
