# 22 — Testing and Build Health

**Audit date:** 2026-05-27
**Monorepo root:** `/sessions/vibrant-festive-mccarthy/mnt/EuroPrint-Clean/Uzbek-Language-Module/`
**Auditor note:** The Linux workspace (bash tool) was unavailable during this analysis — the `mcp__workspace__bash` service returned persistent RPC errors for all sessions. All findings below are derived from static file reads of configs, test files, and CI definitions. Live execution output is therefore UNVERIFIED and is flagged as such throughout. Where command output would be expected, the corresponding section is marked `[NOT EXECUTED — workspace unavailable]` and the analysis is based on source-code inspection alone.

---

## 1. Environment & Toolchain Versions

**Declared in root `package.json` and per-package `package.json`:**

| Tool | Declared version |
|---|---|
| Node.js | `>=20.0.0` (engines field) |
| pnpm | `9.15.9` (packageManager field), `>=9.0.0` (engines) |
| TypeScript (api) | `~5.9.2` (devDependencies in `apps/api/package.json`) |
| TypeScript (erp-dashboard) | resolved from `tsconfig.base.json` target `es2022`; exact version not declared in dashboard's own `package.json` — inherits workspace resolution |
| Jest (backend) | `^29.7.0` |
| ts-jest | `^29.4.9` |
| Vitest (frontend) | `^4.1.2` |
| @vitest/coverage-v8 | `^4.1.2` |
| Playwright | `^1.58.2` |
| Stryker | `^9.6.1` (mutation testing, backend only) |

**Runtime observed:** `[NOT EXECUTED — workspace unavailable]`

Commands that would be run:
```bash
node --version
npm --version
npx tsc --version
```

---

## 2. TypeScript Check Results (Backend)

**Command:** `npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | head -200`

**Result:** `[NOT EXECUTED — workspace unavailable]`

### Static analysis of `apps/api/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": { ... 20 path mappings ... },
    "incremental": true,
    "allowJs": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictBindCallApply": false,
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**Noteworthy compiler flags:**
- `strict: true` is set, but `strictBindCallApply: false` and `strictPropertyInitialization: false` — two sub-flags of strict are explicitly relaxed. This is common for NestJS projects that rely on decorators and class-based injection, but it means a subset of strict checks is not enforced.
- `skipLibCheck: true` — type errors inside `node_modules` are silently ignored.
- `moduleResolution: "node"` — using the legacy Node 10 resolution algorithm, not `node16` or `bundler`. This can mask ESM/CJS interop problems that only surface at runtime.
- `@workspace/db` is mapped to `../../lib/db/dist/cjs/index` — requires that `lib/db` be built before typechecking. If the CJS dist does not exist, the typecheck will fail with `Cannot find module` errors.
- `@europrint/schemas` path maps to a local compat shim (`src/shared/db/europrint-compat.ts`), not to the actual library — a deliberate facade.
- The `_moduleAliases` section in `package.json` (for runtime `module-alias`) uses `dist/` paths, which requires a prior build before production startup.

**Known risk: the Jest config (`test/jest.config.js`) explicitly maps `uuid` to a CJS shim (`test/_setup/uuid-mock.js`) because `uuid@14` is pure ESM. The same issue can surface during `tsc --noEmit` if any declaration files reference the ESM-only uuid exports under `moduleResolution: node`.**

---

## 3. TypeScript Check Results (Frontend)

**Command:** `npx tsc --noEmit -p artifacts/erp-dashboard/tsconfig.json 2>&1 | head -200`

**Result:** `[NOT EXECUTED — workspace unavailable]`

### Static analysis of `artifacts/erp-dashboard/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["esnext", "dom", "dom.iterable"],
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "types": ["node", "vite/client"],
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "useUnknownInCatchVariables": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/schema": ["./src/shared-schema.ts"]
    }
  }
}
```

**Inherits from `tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "isolatedModules": true,
    "lib": ["es2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmitOnError": true,
    "noImplicitReturns": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "skipLibCheck": true,
    "target": "es2022",
    "customConditions": ["workspace"]
  }
}
```

**Noteworthy:**
- `moduleResolution: "bundler"` and `allowImportingTsExtensions: true` are correct for Vite. However, `allowImportingTsExtensions` requires `noEmit: true` — satisfied.
- `isolatedModules: true` from base means each file must be independently type-checkable — compatible with Vite/esbuild's single-file transpilation model.
- `**/*.test.ts` and `**/*.test.tsx` are excluded from typecheck, so test files are not type-checked by `tsc`. Vitest checks them via its own type resolution.
- `@assets` alias is defined in Vite config but NOT in `tsconfig.json`, meaning `import x from "@assets/..."` will produce a "Cannot find module" error from `tsc` even if Vite resolves it at runtime. This is a latent TS error source.
- `customConditions: ["workspace"]` from base is a relatively advanced feature — used with `exports` field in workspace packages. Requires all workspace packages to declare appropriate `exports` conditions.

---

## 4. Test Suite Results (Backend)

**Command:** `cd apps/api && npx jest --passWithNoTests --forceExit 2>&1 | tail -100`

**Result:** `[NOT EXECUTED — workspace unavailable]`

### Static reconstruction of what Jest would encounter

**Jest configuration (`test/jest.config.js`):**

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.stryker-tmp/'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false,
      isolatedModules: true,
    }],
  },
  coverageThreshold: {
    global: { lines: 25, functions: 25, branches: 20, statements: 25 }
  },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: { ...21 alias mappings... }
};
```

**Key observations:**

1. `testRegex: 'test/.*\\.spec\\.ts$'` — only files inside the top-level `test/` directory matching `*.spec.ts` are collected. The `src/**/*.spec.ts` DTO tests are covered by a separate config (`jest.dto.config.js`).

2. `ts-jest` with `diagnostics: false` — TypeScript compilation errors inside test files are suppressed during transformation. This means a test file with a type error will still be compiled and run, but the error will be silently ignored.

3. `transformIgnorePatterns` explicitly allows `uuid`, `nanoid`, `jose`, `@anthropic-ai`, `@noble`, `@scure` to be transformed (they are ESM-only). The uuid ESM issue is further worked around by mapping `uuid` → `test/_setup/uuid-mock.js` via `moduleNameMapper`.

4. `setupFiles: ['reflect-metadata']` — required for NestJS decorator metadata. Correct.

5. `@workspace/db` maps to `../../lib/db/dist/cjs/index.js` — this file must exist on disk; if `lib/db` has not been built, tests will fail with `Cannot find module` immediately.

**DTO test suite (`jest.dto.config.js`):**

```javascript
module.exports = {
  rootDir: '..',
  testRegex: 'src/.*\\.dto\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  testEnvironment: 'node',
  moduleNameMapper: { ...6 alias mappings... }
};
```

Note: `diagnostics` is NOT set to false here, so DTO test type errors would be reported. Also lacks `@workspace/db` mapper — if any DTO imports something that eventually touches the db package, this would fail.

**Stryker mutation config (`stryker.config.json`):**

Critically misconfigured: the stryker config references `karma` and `angular-cli` as the test runner, which is completely wrong for a NestJS/Jest codebase. This config appears to be a left-over from an Angular project template and was never updated. `pnpm test:mutation` (`stryker run`) would fail immediately.

```json
{
  "testRunner": "karma",
  "karma": {
    "configFile": "karma.conf.js",
    "projectType": "angular-cli"
  }
}
```

---

## 5. Test Suite Results (Frontend)

**Command:** `cd artifacts/erp-dashboard && npx vitest run 2>&1 | tail -100`

**Result:** `[NOT EXECUTED — workspace unavailable]`

### Static reconstruction

**Vitest configuration (`vitest.config.ts`):**

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    reporters: ['default', ['junit', { outputFile: 'test-results/vitest-junit.xml' }]],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    sequence: { hooks: 'list' },
    coverage: {
      provider: 'v8',
      thresholds: { lines: 5, functions: 5, branches: 5, statements: 5 }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared/schema': path.resolve(__dirname, 'src/shared-schema.ts'),
      '@assets': path.resolve(__dirname, '..', '..', 'attached_assets'),
      '@picovoice/porcupine-web': path.resolve(__dirname, 'src/test/__mocks__/porcupine-web.ts'),
    }
  }
});
```

**Key observations:**

1. `include: ['src/**/*.test.{ts,tsx}']` — Vitest collects `.test.ts` and `.test.tsx` only. The `aisha-i18n.spec.ts` in `src/test/` would NOT be collected by this pattern (it uses `.spec.ts`). The e2e `*.spec.ts` files in `e2e/` also would not be collected (Playwright handles those separately).

2. Coverage thresholds are very low: 5% for all metrics. A comment in the config acknowledges this: "Intentionally low baseline (5%) so we can ratchet upward as new tests land without blocking CI today." This means coverage enforcement is essentially absent.

3. `@picovoice/porcupine-web` is stubbed out — the wake-word SDK ships browser-native WASM/AudioWorklet that cannot run in jsdom. The mock is at `src/test/__mocks__/porcupine-web.ts`.

4. The setup file (`src/test/setup.ts`) provides polyfills for `window.matchMedia`, `ResizeObserver`, and `IntersectionObserver` — all absent from jsdom. This is correct and necessary.

5. `fake-indexeddb/auto` is imported in setup, providing an in-memory IndexedDB for Dexie/POS offline store tests.

6. The `aisha-i18n.spec.ts` file in `src/test/` uses `.spec.ts` extension — it will not be found by the `include` glob. This is a gap: one spec file is effectively dead unless the include pattern is changed.

**E2E tests (Playwright, `playwright.config.ts`):**

- 46 spec files found in `e2e/` directory.
- In CI mode (`process.env.CI`), only `aisha-director-flow.spec.ts` is run. All other e2e specs require a live NestJS + Postgres backend.
- Playwright webServer config starts both a mock backend (`e2e/mock-backend.mjs`) and a Vite dev server.
- The `e2e/` directory was not found by the initial glob for `e2e/*.spec.ts` — confirmed only via the `**/*.spec.ts` glob which revealed they are present.

---

## 6. Test File Inventory

### Backend (`apps/api/`)

**Category A: Top-level integration/domain test files in `test/`:**

| File | Describes |
|---|---|
| `test/pp-intelligence.spec.ts` | PP/MRP/CRP/Scheduling — 9 describe blocks, ~65 test cases |
| `test/demand-forecast.spec.ts` | SMA, EMA, Holt-Winters, OLS regression |
| `test/crm-analytics.spec.ts` | CRM analytics |
| `test/logistics-search.spec.ts` | Logistics search |

These 4 files are collected by the main `jest.config.js` (`testRegex: 'test/.*\\.spec\\.ts$'`).

**Category B: Stub contract tests in `test/_stubs/`:**

Counted from glob results — approximately **200+ stub spec files** following this pattern:
`test/_stubs/<ServiceName>.spec.ts`

Each stub verifies only that the module is importable and exports the expected class. Example:
```typescript
describe('DrizzleService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/common/database/drizzle.service');
    expect(mod).toBeDefined();
    expect(mod.DrizzleService ?? mod.default).toBeDefined();
  });
  ...
});
```

These stub files are also inside `test/` directory, so they ARE matched by `testRegex: 'test/.*\\.spec\\.ts$'`. They will all be collected and run.

Note: `test/_stubs/` is a sub-path under `test/`, so the regex `test/.*\\.spec\\.ts$` matches `test/_stubs/DrizzleService.spec.ts`. All ~200 stub files will run under the main jest config.

**Category C: DTO unit tests in `src/`:**

| File | Module |
|---|---|
| `src/modules/ai/presentation/dto/ai-crm.dto.spec.ts` | AI/CRM DTOs |
| `src/modules/ai/presentation/dto/ai-director.dto.spec.ts` | AI/Director DTOs |
| `src/modules/ai/presentation/dto/ai-finance.dto.spec.ts` | AI/Finance DTOs |
| `src/modules/ai/presentation/dto/ai-hr.dto.spec.ts` | AI/HR DTOs |
| `src/modules/ai/presentation/dto/ai-marketing.dto.spec.ts` | AI/Marketing DTOs |
| `src/modules/ai/presentation/dto/ai-wms.dto.spec.ts` | AI/WMS DTOs |
| `src/modules/hr/applications/dto/applications.dto.spec.ts` | HR Applications DTO |
| `src/modules/chat/dto/chat.dto.spec.ts` | Chat DTO |
| `src/modules/crm/presentation/dto/crm-activities.dto.spec.ts` | CRM Activities DTO |
| `src/modules/crm/presentation/dto/crm-ai-extended.dto.spec.ts` | CRM AI Extended DTO |
| `src/modules/crm/presentation/dto/crm-ai.dto.spec.ts` | CRM AI DTO |
| `src/modules/crm/presentation/dto/crm-auto-lead.dto.spec.ts` | CRM Auto-lead DTO |
| `src/modules/crm/presentation/dto/crm-bitrix-compat.dto.spec.ts` | CRM Bitrix DTO |
| `src/modules/crm/presentation/dto/crm-comms.dto.spec.ts` | CRM Comms DTO |
| `src/modules/crm/presentation/dto/crm-companies.dto.spec.ts` | CRM Companies DTO |
| `src/modules/crm/presentation/dto/crm-contacts.dto.spec.ts` | CRM Contacts DTO |
| `src/modules/crm/presentation/dto/crm-custom-fields.dto.spec.ts` | CRM Custom Fields DTO |
| `src/modules/crm/presentation/dto/crm-extras.dto.spec.ts` | CRM Extras DTO |
| `src/modules/crm/presentation/dto/crm-leads-ops.dto.spec.ts` | CRM Leads Ops DTO |
| `src/modules/director/presentation/dto/director.dto.spec.ts` | Director DTO |
| `src/modules/ecommerce/dto/ecommerce.dto.spec.ts` | Ecommerce DTO |
| `src/modules/erp/dto/erp.dto.spec.ts` | ERP DTO |
| `src/modules/hr/presentation/dto/hr.dto.spec.ts` | HR DTO |
| `src/modules/sd/presentation/dto/sd-quotations.dto.spec.ts` | SD Quotations DTO |
| `src/modules/security/presentation/dto/raci.dto.spec.ts` | Security/RACI DTO |
| `src/modules/wms/presentation/dto/wms-counts.dto.spec.ts` | WMS Counts DTO |

These 26 DTO spec files are NOT collected by main jest config. They are collected only by `jest.dto.config.js` via `testRegex: 'src/.*\\.dto\\.spec\\.ts$'`. Running with `pnpm test` calls the main config only; `pnpm test:dto` is required separately.

### Frontend (`artifacts/erp-dashboard/src/`)

**Unit tests (`.test.ts`/`.test.tsx`) — collected by Vitest:**

| Category | Files | Examples |
|---|---|---|
| Business logic | 2 | `lib/__tests__/business-logic.test.ts`, `lib/__tests__/format.test.ts` |
| Hooks (HR) | 11 | `use-hr-employees.test.ts`, `use-hr-payroll.test.ts`, `use-hr-attendance.test.ts`, ... |
| Hooks (general) | 11 | `use-auth.test.ts`, `use-wms.test.ts`, `use-finance.test.ts`, `use-crm.test.ts`, ... |
| Hooks (chat) | 3 | `useRooms.test.ts`, `useChatMutations.test.ts`, `useChatSocket.test.ts` |
| Hooks (permissions) | 3 | `usePermissions.test.ts`, `usePositionPermissions.test.ts`, `usePermission.test.ts` |
| Lib utilities | 16 | `safe-array.test.ts`, `sanitize.test.ts`, `apiBase.test.ts`, `auth-refresh.test.ts`, ... |
| i18n | 3 | `loader.test.ts`, `utils.test.ts`, `completeness.test.ts` |
| Sidebar | 1 | `hrNavI18n.test.ts` |
| Routes | 1 | `hrRouteDedup.test.ts` |

**Total frontend unit test files: approximately 65**

**One orphan spec:** `src/test/aisha-i18n.spec.ts` — uses `.spec.ts` extension, excluded from Vitest `include` glob, will never run.

### E2E tests (Playwright, `artifacts/erp-dashboard/e2e/`)

46 spec files covering: auth flows, CRM, HR, SD, Finance, WMS, LMS, Kanban, POS, IoT, i18n leakage.

### Shared library tests

| File | Library |
|---|---|
| `lib/db/src/schema/__tests__/numeric-money.test.ts` | lib/db schema |

This test uses `vitest` imports — it would only run if vitest is also configured at the `lib/db` level (no `vitest.config.ts` found there), or if included by the erp-dashboard vitest config. Currently it is not collected by any running test suite.

---

## 7. Error Classification

Because live typecheck and test commands could not be executed, this section classifies known risk categories derived from static analysis.

### 7.1 TypeScript error risk categories (Backend)

| Risk | Description | Source |
|---|---|---|
| `Cannot find module '@workspace/db'` | lib/db CJS dist must be built before typechecking. If `lib/db/dist/cjs/index.js` is absent, every import of `@workspace/db` fails. | `tsconfig.json` path mapping |
| `Cannot find module '@europrint/schemas'` | Mapped to local compat shim, but the shim re-exports from lib/db CJS — same root dependency. | `tsconfig.json` |
| ESM/CJS interop (uuid@14, nanoid, jose) | These packages are pure ESM; `moduleResolution: node` in `tsconfig.json` does not natively handle ESM-only packages. May produce type-check errors for default imports. | `tsconfig.json`, jest.config.js comments |
| Decorator metadata missing | If any file uses `@Inject()` or `@InjectRepository()` without `reflect-metadata` being imported first, runtime errors occur. TypeScript does not catch these. | NestJS pattern |
| Strict null violations in legacy service code | `strictNullChecks: true` + `noImplicitAny: true` but `strictPropertyInitialization: false` — class properties that are `!` asserted may hide initialization bugs. | tsconfig flags |

### 7.2 TypeScript error risk categories (Frontend)

| Risk | Description | Source |
|---|---|---|
| `@assets` alias not in tsconfig | `vite.config.ts` defines `@assets` alias; `tsconfig.json` does not. Any file importing from `@assets/...` will produce a TS error during `tsc --noEmit`. | tsconfig vs vite.config mismatch |
| `allowImportingTsExtensions` side effects | Importing `.ts` files directly is valid in bundler mode but forbidden in node/node16 resolution — keeps the project locked to bundler mode. | tsconfig |
| `noImplicitReturns: true` | All code paths in functions must return. Some generated or auto-converted code may violate this. | base tsconfig |
| useUnknownInCatchVariables | `catch (e)` requires `e` to be typed as `unknown` before accessing properties. Some legacy catch blocks may use `e.message` directly. | base tsconfig |

### 7.3 Jest/Vitest runtime risk categories

| Risk | Description |
|---|---|
| lib/db not built | Both main jest config and dto config reference `lib/db/dist/cjs/index.js`. If this file does not exist (first clone, clean workspace), all tests fail immediately with `Cannot find module`. |
| ESM-only packages | `uuid@14`, `nanoid`, `jose` are ESM-only. The `transformIgnorePatterns` in jest.config.js whitelists them for transformation. This workaround requires `ts-jest` to successfully transform ESM syntax — which it can with `isolatedModules: true`. The uuid shim in `moduleNameMapper` further mitigates this. |
| Stryker config broken | `stryker.config.json` references `karma`/`angular-cli` test runner. `pnpm test:mutation` will fail immediately without a Stryker Jest runner configuration. |
| DTO test isolation | `jest.dto.config.js` lacks the `@workspace/db` moduleNameMapper and lacks `diagnostics: false`. If any DTO imports from db, it will fail. |
| `aisha-i18n.spec.ts` not collected | Uses `.spec.ts` extension; Vitest include is `*.test.{ts,tsx}` only. Dead test. |
| `lib/db` test not collected | `lib/db/src/schema/__tests__/numeric-money.test.ts` is not included in any running test runner configuration. |
| Coverage thresholds too low | Backend threshold: 25% lines/functions, 20% branches. Frontend threshold: 5% across all metrics. Neither enforces meaningful quality gates. |

---

## 8. Build Configuration Notes

### Root workspace `package.json` scripts

```json
{
  "build":      "pnpm --filter @europrint/api run build",
  "build:erp":  "pnpm --filter @workspace/erp-dashboard run build",
  "build:site": "pnpm --filter @workspace/europrint-site run build",
  "build:all":  "pnpm run build && pnpm run build:erp && pnpm run build:site",
  "typecheck":  "pnpm --filter @europrint/api exec tsc --noEmit && pnpm --filter @workspace/erp-dashboard run typecheck",
  "test":       "pnpm --filter @europrint/api run test && pnpm --filter @workspace/erp-dashboard run test",
  "ci:check":   "pnpm run typecheck && pnpm run lint && pnpm run test"
}
```

**Gap:** `build:all` does not include `@workspace/db` build step. If `lib/db` has not been built previously, the API build will fail because `@workspace/db` is mapped to `../../lib/db/dist/cjs/index`. CI workflows do include `pnpm --filter @workspace/db run build` explicitly, but the local `build:all` script does not.

### Backend build (`apps/api`)

- `nest build` — uses NestJS CLI which invokes `tsc` with the project's `tsconfig.json`.
- Output: `dist/` directory.
- Module aliases resolved at runtime via `module-alias` package (`_moduleAliases` in package.json maps to `dist/` paths).
- The `incremental: true` flag in tsconfig enables incremental builds via `.tsbuildinfo` file — speeds up repeated builds but can cause stale cache issues if files are deleted without cleaning `.tsbuildinfo`.

### Frontend build (`artifacts/erp-dashboard`)

- `vite build --config vite.config.ts`
- Output: `dist/public/` (pre-existing in repo, contains built assets).
- Sourcemaps: disabled unless `SENTRY_AUTH_TOKEN` is set (hidden sourcemaps for Sentry).
- PWA: VitePWA plugin enabled; `devOptions.enabled: false` — service worker not active in dev.
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` are loaded only when `REPL_ID` is set — these are Replit-specific and will not load in standard environments.
- `posAuthDirectPlugin`: custom Vite dev middleware that intercepts `POST /api/pos/auth/login` and forwards it directly to NestJS. This bypasses the standard proxy and has custom CORS header injection. Note: `access-control-allow-origin` is set from the request `origin` header — this is safe only because this plugin runs in development mode only.

### CI/CD configuration (`.github/workflows/`)

**`ci.yml` (main pipeline):**
- Jobs: `typecheck` → `unit-tests` → `lint` → `build` (sequential dependency chain)
- `security-audit` runs in parallel (`pnpm audit --audit-level=high`)
- TypeScript typecheck requires `lib/db` build step first — correctly included
- Backend tests pass `DATABASE_URL` and `JWT_SECRET` from GitHub secrets — tests need a real or test database

**`code-quality.yml` (quality gate):**
- `test-backend`: spins up Postgres 15 and Redis 7 as service containers. Runs `pnpm --filter @europrint/api run test -- --coverage`. Uploads coverage to Codecov.
- `test-frontend`: runs Vitest coverage.
- `test-architecture`: runs 22 reviewer shell scripts + an architecture spec test. References `scripts/run-all-reviewers.sh` — this file was not verified to exist.
- `test-e2e`: Playwright only on `pull_request` events. CI mode runs only `aisha-director-flow.spec.ts`. Playwright browsers installed via `playwright install --with-deps chromium`.
- `i18n-leakage`: runs `scripts/i18n-leak-detector.mjs` and fails the build if any hardcoded UI strings are found.
- `security`: runs Semgrep with custom rules from `.config/replit/.semgrep/semgrep_rules.json`.

**Gap in CI:** `code-quality.yml` runs `pnpm --filter erp-dashboard run test` (no `@workspace/` prefix) — this filter pattern may not match if the package name in `package.json` is `@workspace/erp-dashboard`. The `ci.yml` correctly uses `pnpm --filter @workspace/erp-dashboard run test:coverage`. The discrepancy between `erp-dashboard` and `@workspace/erp-dashboard` as filter values may cause the frontend tests to be silently skipped in `code-quality.yml`.

---

## Summary

The EuroPrint monorepo has a comprehensive test infrastructure on paper — multiple test suites, CI pipelines, coverage thresholds, mutation testing, E2E, and architecture gate scripts. However, several critical gaps undermine the actual test health:

1. **Live test results are unknown.** The bash workspace was unavailable for this audit. No command output was captured. All findings are from static analysis only.

2. **lib/db build prerequisite is fragile.** Both backend typecheck and all Jest tests depend on `lib/db/dist/cjs/index.js` being present. Local workflows (`build:all`) do not include this step; developers running tests on a fresh clone will encounter `Cannot find module` failures immediately.

3. **Stryker mutation config is broken.** `stryker.config.json` references `karma`/`angular-cli` — wrong runner for a NestJS/Jest project. Mutation testing (`pnpm test:mutation`) is non-functional.

4. **Coverage thresholds are too low to enforce quality.** Backend: 25%/20%. Frontend: 5%. These prevent regression to zero but do not ensure meaningful coverage.

5. **One dead test file in frontend.** `src/test/aisha-i18n.spec.ts` uses `.spec.ts` and is never collected by Vitest.

6. **lib/db unit test is orphaned.** `lib/db/src/schema/__tests__/numeric-money.test.ts` is not included in any configured test runner.

7. **`@assets` alias missing from frontend tsconfig.** Will cause `tsc --noEmit` errors for any file importing from `@assets/...`.

8. **DTO tests are a separate manual step.** `pnpm test:dto` must be run explicitly; `pnpm test` does not include DTO tests. CI (`ci.yml`) does not appear to run the DTO suite.

9. **`code-quality.yml` filter mismatch.** `pnpm --filter erp-dashboard` vs `@workspace/erp-dashboard` may silently skip frontend tests in one of the two CI workflows.

10. **ts-jest `diagnostics: false` masks type errors in test files.** Main jest config suppresses TypeScript compilation errors inside test files, which can allow broken tests to run and obscure real problems.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| lib/db build not in local `build:all` script | High | `package.json` scripts; jest.config.js maps `@workspace/db` to `dist/cjs` | Fresh-clone typecheck and all Jest tests fail | Add `pnpm --filter @workspace/db run build` as first step in `build:all` |
| Stryker config references Karma/Angular runner | High | `apps/api/stryker.config.json` lines 10-16 | `pnpm test:mutation` fails immediately; mutation testing is non-functional | Replace with `@stryker-mutator/jest-runner` config targeting Jest |
| Coverage thresholds too low (5% frontend, 25% backend) | High | `vitest.config.ts` thresholds; `jest.config.js` thresholds | Coverage gate does not enforce meaningful quality | Raise thresholds incrementally per the step-up plan referenced in configs |
| `@assets` alias missing from `tsconfig.json` | Medium | `vite.config.ts` resolve alias vs `tsconfig.json` paths | `tsc --noEmit` errors for any import from `@assets/...` | Add `"@assets": ["../../attached_assets"]` to `tsconfig.json` paths |
| `aisha-i18n.spec.ts` uses `.spec.ts` extension, excluded from Vitest | Medium | `vitest.config.ts` include pattern; `src/test/aisha-i18n.spec.ts` exists | i18n spec never runs | Rename to `.test.ts` or update Vitest include pattern |
| `lib/db` numeric-money test not in any runner | Medium | `lib/db/src/schema/__tests__/numeric-money.test.ts`; no vitest.config at lib/db level | Db schema type behavior untested | Add vitest config to lib/db or include in erp-dashboard vitest include paths |
| DTO tests not in main `pnpm test` pipeline | Medium | `jest.dto.config.js` separate; `ci.yml` does not reference it | DTO schema validation can regress without CI catching it | Add `pnpm --filter @europrint/api run test:dto` to CI `unit-tests` job |
| `code-quality.yml` filter `erp-dashboard` vs `@workspace/erp-dashboard` | Medium | `.github/workflows/code-quality.yml` line 86 | Frontend unit tests may be silently skipped in code-quality pipeline | Change to `pnpm --filter @workspace/erp-dashboard run test` |
| ts-jest `diagnostics: false` hides type errors in tests | Medium | `test/jest.config.js` line 20 | Type-broken test files compile and run, masking real bugs | Enable diagnostics selectively or add a separate `tsc --noEmit` step over test files |
| E2E tests (Playwright) only run in `pull_request` context; CI mode runs 1 of 46 specs | Medium | `.github/workflows/code-quality.yml`; `playwright.config.ts` CI_TEST_MATCH | 45 of 46 e2e specs never run in CI | Provision a test database + API in CI and run the full e2e suite on main branch |
| Stale `dist/public/` in repo | Low | `artifacts/erp-dashboard/dist/public/` present in repo | Build outputs committed to VCS cause merge conflicts and bloat repo size | Add `artifacts/erp-dashboard/dist/` to `.gitignore` |
| `incremental: true` in backend tsconfig can cause stale build cache | Low | `apps/api/tsconfig.json` line 41 | After file deletions, `tsbuildinfo` may cause phantom type errors or skip files | Add `clean` step before CI typecheck; or use `--force` flag |
| Module alias at runtime uses `module-alias` (runtime) vs tsconfig paths (compile time) | Low | `apps/api/package.json` `_moduleAliases`; `tsconfig.json` paths | Two sets of path mappings must be kept in sync manually | Consider consolidating to a single mechanism or automate sync |

---

## Open Questions / UNVERIFIED

1. **UNVERIFIED: Does `pnpm --filter @europrint/api exec tsc --noEmit` currently pass with zero errors?** Static analysis suggests it will fail if `lib/db` dist is absent. The exact error count and categories cannot be determined without live execution.

2. **UNVERIFIED: Does `npx vitest run` produce passing results?** The frontend has ~65 unit test files. Whether they all pass, and the exact pass/fail/skip counts, is unknown without running the suite.

3. **UNVERIFIED: Does `pnpm --filter @europrint/api run test` produce results above the 25%/20% coverage thresholds?** The 200+ stub files test only importability; the 4 integration tests (pp-intelligence, demand-forecast, crm-analytics, logistics-search) do the actual behavioral testing. Whether coverage from these files reaches 25% is unknown.

4. **UNVERIFIED: Does `lib/db/dist/cjs/index.js` exist in the current tree?** The `Glob` search found `lib/db/drizzle/` and schema files but did not confirm the presence of `dist/cjs/` output files. If absent, all backend tests fail at startup.

5. **UNVERIFIED: Do all 200+ stub spec files actually import and instantiate their target classes successfully?** The stubs use dynamic `import()` — if any target module has a hard dependency on a NestJS module system (IoC container), the import will throw at test time.

6. **UNVERIFIED: Does `scripts/run-all-reviewers.sh` exist and pass?** Referenced in `code-quality.yml` `test-architecture` job but not found during file search.

7. **UNVERIFIED: Do the Playwright e2e tests (excluding the CI-only `aisha-director-flow.spec.ts`) pass against a real backend?** These require a live NestJS + PostgreSQL environment.

8. **UNVERIFIED: Does the `pnpm audit --audit-level=high` step pass?** Security vulnerabilities at high or critical severity would block the CI `security-audit` job. The `pnpm.overrides` in `package.json` suggests active patching of known vulnerabilities, but current status is unknown.

9. **UNVERIFIED: Is `scripts/i18n-leak-detector.mjs` passing?** The i18n leakage gate in `code-quality.yml` runs a static scan for hardcoded UI strings. Whether the current codebase passes this gate is unknown without execution.

10. **UNVERIFIED: Is the `aisha-director-flow.spec.ts` Playwright spec passing in CI?** This is the only e2e spec that runs in CI. Its pass/fail status determines whether the e2e gate is green.
