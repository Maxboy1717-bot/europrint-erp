// FE ESLint config — SINGLE SOURCE OF TRUTH.
// Extends the workspace root config (../../eslint.config.js) so the rule set
// never drifts from the backend. The root config correctly disables the base
// `no-undef` / `no-unused-vars` rules, which are false-positive machines on
// TypeScript/JSX (they previously produced ~4358 phantom errors here).
//
// Only FE-specific additions live below:
//   • P1-2 — ban bare fetch(); use apiRequest() from @/lib/queryClient
//   • extra ignores for test + local config files
import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    // FE-only ignores (root already ignores node_modules/dist/build/*.d.ts).
    ignores: ["src/test/**", "**/*.config.{js,ts}"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // P1-2: Sahifalarda to'g'ridan-to'g'ri fetch() o'rniga apiRequest() ishlating.
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
