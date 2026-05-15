/**
 * @module apiBase.test
 * @description Vitest tests for the API base URL helpers.
 */

import { describe, it, expect } from 'vitest';
import { getApiBase, getNestApiBase, getChatApiBase } from '../apiBase';

describe('apiBase helpers', () => {
  it('getApiBase returns the canonical /api prefix', () => {
    expect(getApiBase()).toBe('/api');
  });

  it('getNestApiBase returns the /api/hr-v2 prefix', () => {
    expect(getNestApiBase()).toBe('/api/hr-v2');
  });

  it('getChatApiBase returns the /api/chat prefix', () => {
    expect(getChatApiBase()).toBe('/api/chat');
  });

  it('all helpers return strings starting with /api', () => {
    expect(getApiBase().startsWith('/api')).toBe(true);
    expect(getNestApiBase().startsWith('/api')).toBe(true);
    expect(getChatApiBase().startsWith('/api')).toBe(true);
  });

  it('all helpers are pure (return same value across invocations)', () => {
    expect(getApiBase()).toBe(getApiBase());
    expect(getNestApiBase()).toBe(getNestApiBase());
    expect(getChatApiBase()).toBe(getChatApiBase());
  });
});
