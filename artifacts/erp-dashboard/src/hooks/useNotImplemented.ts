/**
 * @module useNotImplemented
 * @description Helper to detect HTTP 501 NOT_IMPLEMENTED errors from TanStack
 *   Query. When a backend endpoint is intentionally stubbed (returns 501),
 *   the page should gracefully show <EPComingSoon /> instead of an error state.
 *
 *   Usage:
 *     import { useNotImplemented } from "@/hooks/useNotImplemented";
 *     import { EPComingSoon } from "@/components/ep";
 *
 *     const { data, error } = useQuery({ queryKey: ["/api/hr/fp-cycle"] });
 *     if (useNotImplemented(error)) return <EPComingSoon />;
 */

/** Returns true if the error represents HTTP 501 NOT_IMPLEMENTED. */
export function useNotImplemented(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  // TanStack Query wraps Axios/fetch errors; status may be nested
  const status =
    (err['status'] as number | undefined) ??
    ((err['response'] as Record<string, unknown> | undefined)?.['status'] as number | undefined) ??
    ((err['cause'] as Record<string, unknown> | undefined)?.['status'] as number | undefined);
  return status === 501;
}
