/**
 * @module TestProviders
 * @description Test wrapper providing the contexts pages need.
 *
 *   - QueryClient (TanStack Query) — required for every page using useQuery.
 *
 *   Notes on what is NOT bundled here:
 *     - LanguageProvider — half the tests mock '@/lib/i18n' partially, and
 *       importing LanguageProvider here breaks them with
 *       "No LanguageProvider export is defined on the mock". The fallback
 *       context inside `useLanguageContext` returns a passthrough `t(key)=key`
 *       so pages render fine without an explicit provider.
 *     - TooltipProvider — pages that need Tooltip should wrap themselves;
 *       the Radix primitive throws otherwise (one or two AppSidebar tests).
 */

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function TestProviders({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={qc}>
      {children}
    </QueryClientProvider>
  );
}
