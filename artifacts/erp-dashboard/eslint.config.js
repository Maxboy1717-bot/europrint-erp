import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // P1-2: Sahifalarda to'g'ridan-to'g'ri fetch() o'rniga apiRequest() ishlating.
      // Istisno kerak bo'lsa: // eslint-disable-next-line no-restricted-globals
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "Use apiRequest() from @/lib/queryClient instead of bare fetch(). It handles auth, 401 retry, and response unwrapping.",
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "src/test/**", "*.config.{js,ts}"],
  },
];
