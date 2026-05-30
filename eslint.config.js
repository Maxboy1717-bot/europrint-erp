import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Lightweight inline rule: warn whenever JSX uses `dangerouslySetInnerHTML`
// without going through `sanitizeHtml()` (artifacts/erp-dashboard/src/lib/sanitize.ts).
// We don't depend on eslint-plugin-react because it's not in the workspace; this
// AST scan covers the same surface area (audit C.27).
const noUnsanitizedDangerouslySetInnerHTML = {
  meta: {
    type: "problem",
    docs: { description: "Require sanitizeHtml() wrapper around dangerouslySetInnerHTML." },
    messages: {
      raw: "dangerouslySetInnerHTML must wrap content with sanitizeHtml() from src/lib/sanitize.ts.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== "dangerouslySetInnerHTML") return;
        // Walk the attribute expression looking for any CallExpression named
        // sanitizeHtml / sanitizeText / DOMPurify.sanitize. If none is found,
        // warn — the developer is inserting raw HTML.
        const src = context.getSourceCode().getText(node);
        // Accept anything that looks like an explicit sanitizer call:
        //   sanitizeHtml / sanitizeText / sanitizeCss (chart.tsx) / DOMPurify.sanitize
        // The rule is a guard against raw HTML, not a stylistic single-helper enforcer.
        if (/sanitize\w*\s*\(|DOMPurify\.sanitize\s*\(/.test(src)) return;
        context.report({ node, messageId: "raw" });
      },
    };
  },
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.cache/**",
      "**/build/**",
      "**/*.d.ts",
      // Generated code is not ours to lint — it's regenerated from source, so
      // hand-fixing lint there is pointless (e.g. the `/* eslint-disable */`
      // banner in apps/api/src/generated/i18n.generated.ts produced by
      // nestjs-i18n). Required for the `--max-warnings 0` gate to be green.
      "**/generated/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "europrint": {
        rules: {
          "no-unsanitized-dangerously-set-inner-html": noUnsanitizedDangerouslySetInnerHTML,
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // High-noise rules disabled while we work through the existing backlog.
      // Once individual files are cleaned up these can be re-enabled per-file.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-this-alias": "off",
      "no-undef": "off",
      "no-unsafe-optional-chaining": "off",
      "no-useless-escape": "off",
      "no-unreachable": "off",
      // Audit C.27 — DOMPurify enforcement. Warn (not error) so we don't
      // block the build while the backlog is being cleaned up.
      "europrint/no-unsanitized-dangerously-set-inner-html": "warn",
    },
  },
];
