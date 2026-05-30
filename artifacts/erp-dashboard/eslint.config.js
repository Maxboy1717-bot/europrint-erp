// FE ESLint config — SINGLE SOURCE OF TRUTH.
// Extends the workspace root config (../../eslint.config.js) so the rule set
// never drifts from the backend. The root config correctly disables the base
// `no-undef` / `no-unused-vars` rules, which are false-positive machines on
// TypeScript/JSX (they previously produced ~4358 phantom errors here).
//
// Only FE-specific additions live below:
//   • P1-2 — ban bare fetch() in PAGE components; use apiRequest()
//   • extra ignores for test + local config files
import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    // FE-only ignores (root already ignores node_modules/dist/build/*.d.ts).
    ignores: ["src/test/**", "**/*.config.{js,ts}"],
  },
  {
    // P1-2 fetch-ban is scoped to PAGES only. The data-access / auth /
    // realtime infrastructure (src/lib/api-request.ts, src/hooks/useAuth.tsx,
    // auth-refresh, errorLogger, pos-monitor/api/*, service worker) MUST use
    // bare fetch() — they are the implementation apiRequest() is built on, so
    // banning fetch there is a false positive. Page components should call
    // apiRequest() instead of fetch() directly.
    files: ["src/pages/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      // Istisno kerak bo'lsa: // eslint-disable-next-line no-restricted-globals
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Use apiRequest() from @/lib/queryClient instead of bare fetch(). It handles auth, 401 retry, and response unwrapping.",
        },
      ],
    },
  },
];
