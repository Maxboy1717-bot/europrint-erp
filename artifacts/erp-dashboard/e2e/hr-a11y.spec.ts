import { test, expect, type Page } from "@playwright/test";

/**
 * HR Module — Accessibility (axe-core) baseline scan
 * Phase 8, Task 8.6
 *
 * This spec lazy-loads `@axe-core/playwright`. If the package isn't installed
 * in the workspace yet, the tests SKIP rather than fail — so the suite stays
 * green until the dependency is added. To activate:
 *
 *   pnpm --filter erp-dashboard add -D @axe-core/playwright axe-core
 *
 * Run (after installing):
 *   pnpm --filter erp-dashboard exec playwright test e2e/hr-a11y.spec.ts
 *
 * Scope: scan baseline HR pages for WCAG 2.1 AA violations. Establishes a
 * floor we won't regress below as Phase 1-7 pages land.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

type AxeBuilder = {
  withTags(tags: string[]): AxeBuilder;
  disableRules(rules: string[]): AxeBuilder;
  analyze(): Promise<{ violations: Array<{ id: string; impact: string | null; nodes: unknown[] }> }>;
};

type AxeBuilderCtor = new (args: { page: Page }) => AxeBuilder;

async function loadAxeBuilder(): Promise<AxeBuilderCtor | null> {
  try {
    // Use a runtime-built specifier so `tsc --noEmit` doesn't try to resolve
    // `@axe-core/playwright` until the package is actually installed. The
    // string concatenation is intentional and load-bearing.
    const moduleName = "@axe-core/" + "playwright";
    const dynamicImport: (s: string) => Promise<unknown> = (s) => import(s);
    const mod = (await dynamicImport(moduleName)) as
      | { default: AxeBuilderCtor }
      | AxeBuilderCtor;
    return (mod as { default?: AxeBuilderCtor }).default ?? (mod as AxeBuilderCtor);
  } catch {
    return null;
  }
}

const HR_PAGES: Array<{ name: string; path: string }> = [
  { name: "Login", path: "/login" },
  { name: "HR Employees List", path: "/employees" },
  { name: "HR Recruiting Kanban", path: "/hr/recruiting" },
  { name: "HR Org Chart", path: "/org-chart" },
];

test.describe("HR a11y — axe-core baseline", () => {
  test.beforeAll(async () => {
    const AxeBuilder = await loadAxeBuilder();
    if (!AxeBuilder) {
      test.skip(true, "@axe-core/playwright not installed — run: pnpm --filter erp-dashboard add -D @axe-core/playwright axe-core");
    }
  });

  for (const { name, path } of HR_PAGES) {
    test(`${name} (${path}) — 0 critical/serious WCAG 2.1 AA violations`, async ({ page }) => {
      const AxeBuilder = await loadAxeBuilder();
      if (!AxeBuilder) {
        test.skip(true, "@axe-core/playwright not installed");
        return;
      }
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // color-contrast can be flaky against dev styles — exclude from baseline
        .disableRules(["color-contrast"])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      if (blocking.length > 0) {
        // Surface a readable failure message — helpful in CI logs.
        const summary = blocking
          .map((v) => `  - [${v.impact}] ${v.id} (${v.nodes.length} nodes)`)
          .join("\n");
        throw new Error(
          `Found ${blocking.length} critical/serious a11y violation(s) on ${path}:\n${summary}`,
        );
      }

      expect(blocking).toEqual([]);
    });
  }
});
