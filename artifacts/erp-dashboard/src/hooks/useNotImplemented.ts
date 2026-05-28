/**
 * @module isNotImplementedError
 * @description Pure helper to detect HTTP 501 NOT_IMPLEMENTED errors from
 *   TanStack Query. When a backend endpoint is intentionally stubbed (returns
 *   501), the page should gracefully show <EPComingSoon /> instead of an
 *   error state.
 *
 *   Usage:
 *     import { isNotImplementedError } from "@/hooks/useNotImplemented";
 *     import { EPComingSoon } from "@/components/ep";
 *
 *     const { data, error } = useQuery({ queryKey: ["/api/hr/fp-cycle"] });
 *     if (isNotImplementedError(error)) return <EPComingSoon />;
 *
 *   Note: despite the filename, this is a plain utility function, not a React
 *   hook (no hook calls inside). It may be called conditionally without
 *   violating the Rules of Hooks.
 */

/** Returns true if the error represents HTTP 501 NOT_IMPLEMENTED. */
export function isNotImplementedError(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  // TanStack Query wraps Axios/fetch errors; status may be nested
  const status =
    (err['status'] as number | undefined) ??
    ((err['response'] as Record<string, unknown> | undefined)?.['status'] as number | undefined) ??
    ((err['cause'] as Record<string, unknown> | undefined)?.['status'] as number | undefined);
  return status === 501;
}

/**
 * @deprecated Renamed to `isNotImplementedError`. Use that instead.
 * This alias will be removed in a future cleanup.
 */
export const useNotImplemented = isNotImplementedError;
