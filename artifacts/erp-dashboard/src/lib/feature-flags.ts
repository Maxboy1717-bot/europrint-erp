/**
 * @module feature-flags
 * @description Centralised feature-flag accessors backed by Vite env vars.
 *
 * Flags here are evaluated once at module-load time so consumers can use them
 * synchronously inside `useMemo` / render. Add a new flag by exporting a
 * `FEATURE_<NAME>` constant and documenting it in `.env.example`.
 *
 * NOTE: Vite only exposes env vars that are prefixed `VITE_`. All flag env
 * names must therefore start with `VITE_FEATURE_`.
 */

/**
 * Read a `VITE_FEATURE_*` env var and return a boolean.
 *
 * The flag is "on" only when the env var is the literal string `'true'`. Any
 * other value (including unset, `'1'`, `'yes'`, etc.) is treated as off. This
 * mirrors the convention used by most Vite-based feature-flag setups and keeps
 * the on/off decision unambiguous.
 */
function readFlag(name: string): boolean {
  // import.meta.env values are typed as `any` in user code; coerce explicitly.
  const raw = (import.meta.env as Record<string, string | undefined>)[name];
  return raw === 'true';
}

/**
 * Marketing module (tz02) — backend currently returns 501 for ~60/99 endpoints,
 * so we hide the menu group from end users until the API ships. Defaults to
 * off; flip to `true` in `.env.local` to surface the menu during development.
 */
export const FEATURE_MARKETING: boolean = readFlag('VITE_FEATURE_MARKETING');

/**
 * Internal helper for tests/debug — never call from product code.
 */
export const __FEATURE_FLAGS_FOR_TEST = {
  readFlag,
} as const;
