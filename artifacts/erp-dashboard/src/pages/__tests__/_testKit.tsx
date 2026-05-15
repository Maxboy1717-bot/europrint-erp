/**
 * @module _testKit
 * @description Shared helpers for page-level Vitest tests.
 *   Provides a query-aware wrapper that lets each test seed cache data
 *   per-URL and force errors, plus a mocked apiRequest so mutations are
 *   observable.
 *
 *   Not a smoke test — utilities only (no describe blocks).
 */

import { QueryClient, QueryClientProvider, type QueryFunction } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export type UrlResponses = Record<string, unknown | (() => unknown)>;

export interface TestQueryOptions {
  /** URL → response payload (object/array/null) or thrower */
  responses?: UrlResponses;
  /** Override the queryFn entirely */
  queryFn?: QueryFunction;
  /** If true, every query rejects with an Error so error branches render. */
  fail?: boolean;
}

/**
 * Build a wrapper that injects a fresh QueryClient with a default `queryFn`
 * that responds based on `queryKey[0]` → URL.
 *
 * Usage:
 *   const Wrapper = makeQueryWrapper({ responses: { '/api/ap/aging': { totals: {...} } } });
 *   render(<Page />, { wrapper: Wrapper });
 */
export function makeQueryWrapper(opts: TestQueryOptions = {}) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        queryFn:
          opts.queryFn ??
          (async ({ queryKey }) => {
            if (opts.fail) throw new Error('Test forced error');
            const key = String(queryKey[0] ?? '');
            const map = opts.responses ?? {};
            if (key in map) {
              const v = map[key];
              return typeof v === 'function' ? (v as () => unknown)() : v;
            }
            // Default empty payload — useQuery resolves with [] / {} as needed.
            return null;
          }),
      },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

/** Stay-loading wrapper: queries hang forever so loading state renders. */
export function makePendingWrapper() {
  return makeQueryWrapper({
    queryFn: () => new Promise(() => {
      /* never resolves — loading branch */
    }),
  });
}

/** Failing wrapper: every query throws, error branch renders. */
export function makeErrorWrapper() {
  return makeQueryWrapper({ fail: true });
}
