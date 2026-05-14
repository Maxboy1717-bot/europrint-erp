/**
 * @module use-auth
 * @description Deprecated shim. The canonical auth hook lives in useAuth.tsx
 * (Context-based). This file remains as a re-export to avoid breaking older
 * imports. New code MUST import from `@/hooks/useAuth`.
 */

// NOTE: deprecation shim. Removal is gated on migrating every
// `@/hooks/use-auth` import across the dashboard to `@/hooks/useAuth`.
// Run `grep -rn "@/hooks/use-auth" artifacts/erp-dashboard/src` to find
// remaining callers before deleting this file.
export { useAuth } from "./useAuth";
export type { AuthUser } from "./useAuth";
