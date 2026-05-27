# Report 22 — Testing & Build Health

**Audit date:** 2026-05-27 (second-pass)
**Monorepo root:** `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\`
**Shell mount:** `/sessions/lucid-vibrant-clarke/mnt/EuroPrint-Clean/Uzbek-Language-Module/`
**Round-1 source:** `docs/full-analysis-2026-05-27/22-testing-and-build-health.md`
**Workspace mode:** Linux bash via MCP available (intermittent RPC errors but all reads completed). No `pnpm` / `tsc` / `jest` execution was attempted — only static file inspection. All findings are derived from on-disk evidence.

---

## Diff vs round 1

Round 1 was assembled entirely from static reads with the bash workspace unavailable. Several of its claims are now demonstrably wrong, and several real problems were missed. The table below lists every diff.

| Topic | Round 1 claim | Actual (this pass) | Verdict |
|---|---|---|---|
| Stryker test runner | "References `karma`/`angular-cli` — wrong runner. Mutation testing non-functional." | `stryker.config.json` declares `"testRunner": "jest"` with `jest.configFile: test/jest.config.js`. `@stryker-mutator/jest-runner` is installed in `apps/api/package.json`. | **R1 WRONG** |
| ts-jest `diagnostics: false` masking type errors | "diagnostics: false — TypeScript compilation errors inside test files are suppressed." | `test/jest.config.js:23-25` uses `diagnostics: { ignoreCodes: [2322, 2345, 7006] }` — diagnostics are ON for everything except those three codes. The comment explicitly notes Task 9 fixed the prior `diagnostics: false` regression. | **R1 STALE** |
| Vitest coverage threshold | "5% across all metrics" | `vitest.config.ts:50-55` thresholds are `lines: 15, functions: 15, branches: 10, statements: 15`. The stale comment above (line 47) still says "5%". | **R1 WRONG (stale comment confused R1)** |
| Backend test file count | "4 integration files (pp-intelligence, demand-forecast, crm-analytics, logistics-search) + 200+ stubs + 26 DTO" | Top-level `test/*.spec.ts` = **38** files. `test/_stubs/*.spec.ts` = **151** files. `src/**/*.dto.spec.ts` = **26**. Total backend = **215** spec files. | **R1 WRONG (counted 4 vs 38 top-level)** |
| Frontend unit test file count | "approximately 65" | `find artifacts/erp-dashboard/src -name '*.test.ts*'` = **434** files (71 `.test.ts` + 363 `.test.tsx`). | **R1 WRONG (off by ~7x)** |
| `aisha-i18n.spec.ts` orphan | "Uses `.spec.ts` extension; not collected by Vitest." | File on disk is `src/test/aisha-i18n.test.ts` — already `.test.ts`. Will be picked up. | **R1 STALE** |
| `@assets` alias missing from tsconfig | "`@assets` alias defined in vite.config but NOT in tsconfig.json." | `artifacts/erp-dashboard/tsconfig.json:21` declares `"@assets/*": ["../../attached_assets/*"]`. | **R1 STALE** |
| `build:all` missing lib/db step | "`build:all` does not include `@workspace/db` build step." | `package.json` root: `"build:all": "pnpm --filter @workspace/db run build && pnpm run build && pnpm run build:erp && pnpm run build:site"`. lib/db is FIRST step. | **R1 WRONG** |
| `code-quality.yml` filter typo | "Uses `pnpm --filter erp-dashboard` vs `@workspace/erp-dashboard` — silent skip." | Line 86: `pnpm --filter @workspace/erp-dashboard run test -- --coverage`. Filter prefix is present. | **R1 WRONG** |
| Backend coverage threshold | "25%/20%" | `lines/functions/statements: 25, branches: 20` — confirmed. | R1 correct |
| Stryker `mutate` scope | not mentioned | `stryker.config.json:9-15` restricts mutation to `src/modules/{finance,hr,sd}/**/*.ts` only — 3 modules of ~60. | new gap |
| `@workspace/types` alias | not mentioned | Used in `OnboardingRoadmapDialog.types.ts` but NOT declared in any tsconfig — resolved purely via pnpm workspace + package `exports`. Works in IDE but fragile under `moduleResolution: bundler` without explicit type-roots. | new finding |
| `attached_assets/` directory | not flagged | Directory does NOT exist on disk; two files (`PublicFooter.tsx:9`, `PublicHeader.tsx:10`) import `@assets/Logo_Euro_Print_1769616882846.png`. Vite build will fail. | **NEW P0** |
| Stale `vitest.config.ts` 5% comment | not flagged | Lines 47-49 still say "Intentionally low baseline (5%)" while thresholds are 15/10. Misleading. | minor |
| `lib/db` numeric-money test orphan | flagged | Still true — no `vitest.config` at `lib/db/` level. | confirmed |
| DTO suite not in CI | flagged | Still true — neither `ci.yml` nor `code-quality.yml` references `test:dto` or `jest.dto.config.js`. | confirmed |
| `lib/db/dist/cjs/index.js` existence | "UNVERIFIED" | File EXISTS — `ls lib/db/dist/cjs/index.js` returns OK. Tests will start cleanly. | now verified |
| `scripts/run-all-reviewers.sh` existence | "UNVERIFIED" | File exists. | now verified |

---

## 1. Jest configuration (api)

### 1.1 Primary config — `apps/api/test/jest.config.js`

Full text (80 lines, complete):

```javascript
// L1
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.spec\\.ts$',
  // Stryker .stryker-tmp sandbox-* dir-larini test'dan ajratish (B bo'lim, Task 6).
  // Stryker alohida `pnpm test:mutation` script orqali ishlaydi.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.stryker-tmp/',
  ],
  // L13
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: {
        ignoreCodes: [2322, 2345, 7006],
      },
      isolatedModules: true,
    }],
  },
  // ...
  coverageThreshold: {
    global: { lines: 25, functions: 25, branches: 20, statements: 25 },
  },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^shared/interceptors/(.*)$': '<rootDir>/src/modules/shared/interceptors/$1',
    '^shared/infrastructure/(.*)$': '<rootDir>/src/modules/shared/infrastructure/$1',
    '^shared/domain/(.*)$': '<rootDir>/src/modules/shared/domain/$1',
    '^@shared/domain/(.*)$': '<rootDir>/src/modules/shared/domain/$1',
    '^@shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^@shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@shared/db(.*)$': '<rootDir>/src/shared/db/$1',
    '^@europrint/schemas$': '<rootDir>/src/shared/db/europrint-compat.ts',
    '^@workspace/db$': '<rootDir>/../../lib/db/dist/cjs/index.js',
    '^@workspace/db/(.*)$': '<rootDir>/../../lib/db/dist/cjs/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/common/$1',
    '^@auth/types$': '<rootDir>/src/modules/auth/types',
    '^@auth/types/(.*)$': '<rootDir>/src/modules/auth/types/$1',
    '^@auth/decorators/(.*)$': '<rootDir>/src/modules/auth/infrastructure/decorators/$1',
    '^@auth/guards/(.*)$': '<rootDir>/src/modules/auth/infrastructure/guards/$1',
    '^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
    '^uuid$': '<rootDir>/test/_setup/uuid-mock.js',
  },
};
```

Observations:

1. **`testRegex: 'test/.*\\.spec\\.ts$'`** — collects every `*.spec.ts` under the `test/` tree, including the 151 stubs under `test/_stubs/` and 38 integration specs under `test/`. The architecture spec at `test/architecture/rules.spec.ts` is also matched.
2. **`diagnostics: { ignoreCodes: [2322, 2345, 7006] }`** (L20-25) — Round 1's claim that "diagnostics: false hides type errors" is **stale**. Diagnostics are enabled; only TS2322 (Type X not assignable to Y), TS2345 (Argument of type X is not assignable to Y), and TS7006 (Parameter has implicit `any`) are suppressed. Comment on L20-21 explicitly says "diagnostics: false was hiding real TS errors in test files — see Task 9."
3. **`@workspace/db` mapper points to `<rootDir>/../../lib/db/dist/cjs/index.js`** (L67). The file exists on disk:
   - `lib/db/dist/cjs/index.js` — verified present
   - So tests will not fail at startup with "Cannot find module".
4. **`uuid` shim** (L77) maps to `test/_setup/uuid-mock.js`. `uuid@14` is in `pnpm.overrides` as `>=14.0.0` so this workaround is correct.
5. **`setupFiles: ['reflect-metadata']`** required for NestJS decorators.
6. **`transformIgnorePatterns`** (L14-16) allow-list `uuid`, `nanoid`, `jose`, `@anthropic-ai`, `@noble`, `@scure` to be transformed (they are ESM-only).
7. **Coverage thresholds** (L43-49): global `25/25/20/25`. The comment on L41-42 explicitly states the step-up plan: 25% (current) → 50% (S3) → 70% (S5) → 80% (S6 final).

### 1.2 DTO config — `apps/api/test/jest.dto.config.js`

Full text (20 lines):

```javascript
// L1
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'src/.*\\.dto\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@europrint/schemas$': '<rootDir>/../../lib/db/dist/cjs/index.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/common/$1',
  },
};
```

Gaps vs main config:
- No `@workspace/db` mapper — any DTO that transitively pulls `@workspace/db` will fail with `Cannot find module '@workspace/db'`.
- No `@auth/*` mapper.
- No `@shared/db` mapper.
- No `transformIgnorePatterns` — if a DTO under test imports an ESM-only dep, transform will fail.
- No `setupFiles: ['reflect-metadata']` — class-validator decorators that rely on metadata may misbehave.
- `^@europrint/schemas$` (L15) bypasses the local compat shim and goes straight to the CJS dist. Inconsistent with main config (which uses the shim).
- No coverage threshold or `collectCoverageFrom`.

### 1.3 Babel config (`apps/api/babel.config.js`)

Exists, but ts-jest does its own transformation. Babel is used by NestJS CLI build path; not by Jest. No conflict.

### 1.4 `apps/api/package.json` test scripts

```json
"test":         "jest --config test/jest.config.js --passWithNoTests --testPathIgnorePatterns=stryker-tmp",
"test:ci":      "jest --config test/jest.config.js --passWithNoTests --forceExit --testPathIgnorePatterns=stryker-tmp",
"test:dto":     "jest --config test/jest.dto.config.js --passWithNoTests --forceExit",
"test:mutation":"stryker run"
```

`test:dto` is not invoked from any `pnpm test:*` aggregator at the root, nor from any CI workflow.

---

## 2. Stryker configuration

### 2.1 `apps/api/stryker.config.json`

Full text (21 lines):

```json
{
  "$schema": "https://stryker-mutator.io/schemas/stryker-core.schema.json",
  "testRunner": "jest",
  "jest": {
    "configFile": "test/jest.config.js",
    "projectType": "custom"
  },
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/modules/finance/**/*.ts",
    "src/modules/hr/**/*.ts",
    "src/modules/sd/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.dto.ts"
  ],
  "reporters": ["html", "progress", "dashboard"],
  "htmlReporter": { "fileName": "reports/mutation.html" },
  "timeoutMS": 60000,
  "concurrency": 4
}
```

**Round 1 was wrong.** The runner is `jest` with `projectType: "custom"` and `configFile: test/jest.config.js`. No Karma, no Angular. Installed deps in `apps/api/package.json` confirm:

```
"@stryker-mutator/core": "^9.6.1",
"@stryker-mutator/jest-runner": "^9.6.1",
```

### 2.2 Real Stryker gaps (new)

- **Scope is narrow:** only `src/modules/{finance,hr,sd}` are mutated. The repo has ~60 modules under `src/modules/` (CRM, SD/quotations, WMS, MES, PP, MM, LMS, etc.). Mutation coverage is therefore < 10% of the surface area.
- **No fail-on-low-score threshold** — `stryker.config.json` lacks `thresholds: { high, low, break }`. The default `break: 0` means the suite never fails CI based on mutation score.
- **No CI wiring** — neither `ci.yml` nor `code-quality.yml` runs `pnpm test:mutation`. It is a manual-only command.
- **Reporter `"dashboard"`** requires `STRYKER_DASHBOARD_API_KEY`; absent ⇒ silent skip but ok.

---

## 3. Vitest configuration (erp)

### 3.1 `artifacts/erp-dashboard/vitest.config.ts` (70 lines, full text)

```typescript
// L1
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/*.types.ts',
        'src/**/generated/**',
      ],
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      // L47-49 STALE COMMENT:
      // "Intentionally low baseline (5%) so we can ratchet upward as new tests
      //  land without blocking CI today. See docs/TESTING_PROMPT.md §2 for the
      //  step-up plan."
      thresholds: {
        lines: 15,
        functions: 15,
        branches: 10,
        statements: 15,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared/schema': path.resolve(__dirname, 'src/shared-schema.ts'),
      '@assets': path.resolve(__dirname, '..', '..', 'attached_assets'),
      '@picovoice/porcupine-web': path.resolve(__dirname, 'src/test/__mocks__/porcupine-web.ts'),
    },
  },
});
```

Observations:

1. **Thresholds (L50-55)** = `15/15/10/15` — not 5% as round 1 said. The L47-49 comment is stale and misleads readers; the actual code is one notch higher.
2. **`include: 'src/**/*.test.{ts,tsx}'`** correctly captures `.test.ts` and `.test.tsx`. Confirmed 434 files match.
3. **Setup at `src/test/setup.ts`** — polyfills `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `fake-indexeddb/auto`.
4. **`@picovoice/porcupine-web` stub** — wake-word SDK needs browser WASM; replaced with mock for jsdom.
5. **`@assets` alias (L62)** — resolves to `../../attached_assets` relative to `artifacts/erp-dashboard/`, i.e. `<repo root>/attached_assets`. **This directory does NOT exist on disk** (see Section 5.4). Any test that exercises `PublicFooter.tsx` / `PublicHeader.tsx` will fail with `Failed to load url …/attached_assets/Logo_Euro_Print_1769616882846.png`.

### 3.2 Test file collected by Vitest — totals

```
$ find src -name '*.test.ts'  | wc -l    →  71
$ find src -name '*.test.tsx' | wc -l    →  363
TOTAL                                    →  434
```

By directory (top-level):

| Dir | `.test.tsx` count |
|---|---|
| `src/pages/` | 314 |
| `src/components/` | 45 |
| `src/lib/` | 2 |
| `src/hooks/` | 2 |

Hook tests use `.test.ts`: `src/hooks/` contains 44 `.test.ts` files.

`src/test/aisha-i18n.test.ts` — file IS `.test.ts` (round 1 was looking at an older snapshot). Will be collected.

### 3.3 Spec files in `src/`

```
$ find artifacts/erp-dashboard/src -name '*.spec.ts*' → 0
```

No `.spec.ts` orphans in the dashboard tree. The 45 `*.spec.ts` files live exclusively under `e2e/` and are owned by Playwright (Section 4).

---

## 4. Playwright e2e

### 4.1 `artifacts/erp-dashboard/playwright.config.ts` (70 lines)

Key bits:

```typescript
// L8-9
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const MOCK_API_PORT = process.env.MOCK_API_PORT ?? "8080";

// L11-13 — CI mode runs ONE spec only
const CI_TEST_MATCH = ['**/aisha-director-flow.spec.ts'];

export default defineConfig({
  testDir: "./e2e",
  testMatch: process.env.CI ? CI_TEST_MATCH : undefined,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  globalTimeout: process.env.CI ? 300_000 : undefined,
  ...
  webServer: [
    { command: "node e2e/mock-backend.mjs", url: `http://localhost:${MOCK_API_PORT}/health`, ... },
    { command: "pnpm run dev",              url: BASE_URL, ... timeout: 120_000, ... },
  ],
});
```

### 4.2 E2E spec inventory

```
$ find artifacts/erp-dashboard/e2e -name '*.spec.ts' | wc -l → 45
```

Full list (45 files):

| Category | Files |
|---|---|
| Auth | `auth.spec.ts`, `auth-account-lock.spec.ts`, `auth-change-password.spec.ts`, `auth-otp-verify.spec.ts`, `auth-rbac-routes.spec.ts`, `login-flow.spec.ts`, `login-dashboard.spec.ts` |
| Aisha (CI-only) | `aisha-director-flow.spec.ts`, `director-dashboard.spec.ts` |
| CRM | `crm-deal-lifecycle.spec.ts`, `crm-lead-crud.spec.ts`, `crm-pipeline-drag-drop.spec.ts`, `crm-to-sd-trigger.spec.ts` |
| Finance | `finance-budget-approval.spec.ts`, `finance-cashflow-report.spec.ts`, `finance-gl-posting.spec.ts` |
| HR | `hr-a11y.spec.ts`, `hr-assets.spec.ts`, `hr-attendance-flow.spec.ts`, `hr-discipline-record.spec.ts`, `hr-employee-payroll.spec.ts`, `hr-employees.spec.ts`, `hr-leave-request-approval.spec.ts`, `hr-org-structure.spec.ts`, `hr-recruiting.spec.ts`, `hr-recruitment-funnel.spec.ts` |
| SD | `sd-delivery-tracking.spec.ts`, `sd-invoice-payment.spec.ts`, `sd-quotation-to-order.spec.ts` |
| WMS / Inventory | `wms-inventory-receive.spec.ts`, `wms-transfer-flow.spec.ts`, `pos-sale-gl.spec.ts` |
| Production / QC | `production-lifecycle.spec.ts`, `production-orders.spec.ts`, `qc-certificates.spec.ts` |
| Kanban / Tasks | `kanban-task-flow.spec.ts`, `zvs-coordination.spec.ts` |
| LMS | `lms-course-enrollment.spec.ts`, `lms-test-attempt.spec.ts` |
| Chat / Notifications | `chat-message-send.spec.ts`, `iot-sensor-alert.spec.ts` |
| Misc | `api-health.spec.ts`, `i18n-leakage.spec.ts`, `security.spec.ts`, `website-management.spec.ts` |

Round 1 said "46 spec files"; actual is **45**. (R1 likely counted `aisha-director-flow.spec.ts` twice.)

### 4.3 CI coverage

- `code-quality.yml` `test-e2e` job runs only when `github.event_name == 'pull_request'` (line 129).
- In CI, `testMatch` filter narrows to `aisha-director-flow.spec.ts` only.
- The other 44 e2e specs require a real NestJS + Postgres backend (`pnpm test:e2e:api` locally) — they never run in CI.

### 4.4 Mock backend

`artifacts/erp-dashboard/e2e/mock-backend.mjs` — provides the zero-dep mock for the single CI spec. Two npm scripts exercise it:
- `test:e2e:api`: targets `api-health.spec.ts`, `security.spec.ts`, `production-orders.spec.ts` against a presumed-running real API.
- `test:e2e:ui`: targets `auth.spec.ts`.

---

## 5. tsconfig aliases

### 5.1 `apps/api/tsconfig.json` (57 lines, full)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@europrint/schemas": ["src/shared/db/europrint-compat.ts"],
      "@common/*":   ["src/common/*"],
      "@modules/*":  ["src/modules/*"],
      "@config/*":   ["src/config/*"],
      "@shared/db":  ["src/shared/db/index.ts"],
      "@shared/db/*":["src/shared/db/*"],
      "@shared/utils/*":         ["src/shared/utils/*"],
      "@shared/guards/*":        ["src/modules/shared/guards/*"],
      "@shared/decorators/*":    ["src/modules/shared/decorators/*"],
      "@shared/interceptors/*":  ["src/modules/shared/interceptors/*"],
      "@shared/infrastructure/*":["src/modules/shared/infrastructure/*"],
      "@shared/domain/*":        ["src/modules/shared/domain/*"],
      "shared/guards/*":         ["src/modules/shared/guards/*"],
      "shared/decorators/*":     ["src/modules/shared/decorators/*"],
      "shared/interceptors/*":   ["src/modules/shared/interceptors/*"],
      "shared/infrastructure/*": ["src/modules/shared/infrastructure/*"],
      "shared/domain/*":         ["src/modules/shared/domain/*"],
      "@/*":   ["src/*"],
      "@core/*":["src/common/*"],
      "@auth/*":["src/modules/auth/*"],
      "@auth/decorators/*":["src/modules/auth/infrastructure/decorators/*"],
      "@auth/guards/*":    ["src/modules/auth/infrastructure/guards/*"],
      "@auth/types/*":     ["src/modules/auth/types/*"],
      "@workspace/math-utils": ["../../lib/math-utils/src/index.ts"],
      "@workspace/db":         ["../../lib/db/dist/cjs/index"],
      "@workspace/db/*":       ["../../lib/db/dist/cjs/*"]
    },
    "incremental": true,
    "allowJs": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": false,
    "strictPropertyInitialization": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "strict": true,
    "moduleResolution": "node",
    "preserveSymlinks": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

Gaps vs `apps/api/package.json#_moduleAliases`:

| Alias | tsconfig paths | runtime `_moduleAliases` | Gap |
|---|---|---|---|
| `@common` | `src/common/*` | `dist/common` | OK (both layers) |
| `@modules` | `src/modules/*` | `dist/modules` | OK |
| `@auth/types` | `src/modules/auth/types/*` | `dist/modules/auth/types` | OK |
| `shared` (no prefix) | not present | `dist/modules/shared` | **runtime-only** |
| `src/common`, `src` | not present | `dist/common`, `dist` | **runtime-only** |
| `@` | not present | `dist` | **runtime-only** |
| `@workspace/api-client-react`, `@workspace/api-spec`, `@workspace/api-zod`, `@workspace/types` | not present | not present | **NO mapping anywhere — used at compile via `customConditions: ["workspace"]` only** |

The runtime-only entries (`shared`, `src`, `@`, `src/common`) are dangerous: any file using `import X from 'shared/...'` will typecheck (because the prefixed `shared/...` paths exist) but the lookup falls through unprefixed in runtime via `module-alias`. The two surfaces are kept in sync manually.

### 5.2 `apps/api/test/jest.config.js#moduleNameMapper` vs `tsconfig.json` paths

Differences:

| Mapping | tsconfig | jest main | jest DTO |
|---|---|---|---|
| `@workspace/db` | `lib/db/dist/cjs/index` | `lib/db/dist/cjs/index.js` | (missing) |
| `@workspace/math-utils` | `lib/math-utils/src/index.ts` | (missing) | (missing) |
| `@europrint/schemas` | `src/shared/db/europrint-compat.ts` | `src/shared/db/europrint-compat.ts` | `lib/db/dist/cjs/index.js` |
| `uuid` | (none) | `test/_setup/uuid-mock.js` | (missing) |

A DTO that imports `uuid` (or that pulls a transitive `@workspace/db` through a domain entity) will fail under `test:dto`.

### 5.3 `artifacts/erp-dashboard/tsconfig.json` (25 lines, full)

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
      "@/*":           ["./src/*"],
      "@shared/schema":["./src/shared-schema.ts"],
      "@assets/*":     ["../../attached_assets/*"]
    }
  },
  "references": []
}
```

Round 1 said `@assets` is missing — line 21 shows it IS present. (R1 was looking at an earlier snapshot; this audit confirms the alias is wired.)

### 5.4 `@workspace/types` — alias gap

`OnboardingRoadmapDialog.types.ts:9` does:
```typescript
export type { Employee } from '@workspace/types';
```

But neither `artifacts/erp-dashboard/tsconfig.json` nor `tsconfig.base.json` declares a `@workspace/types` path. Resolution relies on:
- `pnpm-workspace.yaml` listing `lib/*` as a workspace
- `lib/types/package.json` declaring `"name": "@workspace/types"` and `"exports": { ".": "./src/index.ts" }`
- `customConditions: ["workspace"]` in `tsconfig.base.json:23`

This works for the IDE and for Vite (which respects `package.json exports`). It is fragile because:
- A consumer who runs `tsc` outside the pnpm workspace context (e.g. an isolated `pnpm --filter`) may see `customConditions: ["workspace"]` but no resolvable target.
- Type-only re-exports under `bundler` resolution mode need an `import type` discipline that isn't enforced.

### 5.5 `attached_assets/` directory missing — **NEW P0**

```
$ ls Uzbek-Language-Module/attached_assets
ls: cannot access '…/attached_assets': No such file or directory
```

But two source files reference it:
- `artifacts/erp-dashboard/src/components/public/PublicFooter.tsx:9` — `import logoImage from '@assets/Logo_Euro_Print_1769616882846.png';`
- `artifacts/erp-dashboard/src/components/public/PublicHeader.tsx:10` — same import.

`find … -name 'Logo_Euro_Print*'` returns no hits. **Vite's build pipeline will throw `Could not resolve …/attached_assets/Logo_Euro_Print_1769616882846.png`** the first time it bundles either of those two files. `pnpm build:erp` (and `pnpm build:all` by extension) will fail on a clean checkout.

The TS typecheck wouldn't catch this (`tsc --noEmit` skips `.png` resolution), but the runtime bundler will.

### 5.6 Other potential alias gaps

Searched `artifacts/erp-dashboard/src` for `@workspace/...`:
- `@workspace/types` (2 occurrences in `OnboardingRoadmapDialog.types.ts`)
- No other `@workspace/*` aliases used in the dashboard.

Searched `apps/api/src` for `@workspace/...`:
- `@workspace/db`, `@workspace/db/schema/...` (the only ones in use). All have tsconfig paths.

`@workspace/math-utils` is declared in `tsconfig.json` but not used in any `import` in either app — dead alias.

---

## 6. CI pipelines

### 6.1 `.github/workflows/ci.yml` (227 lines)

Jobs: `typecheck`, `unit-tests`, `lint`, `security-audit`, `build` (depends on first three).

Key fixes vs round 1 narrative:

- **`build` depends on `[typecheck, unit-tests, lint]`** (line 179) — sequential gate.
- **`lib/db` is built before typecheck** (lines 45-46):
  ```yaml
  - name: lib/db build (kerak: @workspace/db CJS importi uchun)
    run: pnpm --filter @workspace/db run build
  ```
- **Same step is repeated in `unit-tests`** (lines 81-82).
- **NOT repeated in `build`** — meaning the `build` job re-runs `pnpm install --frozen-lockfile` (line 202) but doesn't explicitly build `lib/db` before `pnpm --filter @europrint/api run build`. The api's `nest build` will then fail to resolve `@workspace/db` via the tsconfig path because `lib/db/dist/cjs/index` doesn't exist in a fresh runner. **Latent CI gap.**
- **DTO suite not invoked** — no reference to `test:dto` or `jest.dto.config.js` anywhere in the workflow.
- **Stryker not invoked** — no reference to `test:mutation`.

### 6.2 `.github/workflows/code-quality.yml` (194 lines)

Jobs: `test-backend`, `test-frontend`, `test-architecture`, `test-e2e` (PR-only), `i18n-leakage`, `security`.

- **`test-backend`** spins up `postgres:15` + `redis:7` service containers and runs `pnpm --filter @europrint/api run test -- --coverage` with secrets:
  ```yaml
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/europrint_test
  REDIS_URL:    redis://localhost:6379
  JWT_SECRET:   test-secret-min-32-chars-for-testing-only
  JWT_REFRESH_SECRET: test-refresh-min-32-chars-for-testing
  ```
- **`test-frontend`** uses `pnpm --filter @workspace/erp-dashboard run test -- --coverage` (line 86). Round 1's claim that the filter prefix was wrong is **incorrect**.
- **`test-architecture`** runs three steps:
  1. `bash scripts/run-all-reviewers.sh` (file exists, verified)
  2. `node scripts/update-architecture-rules-doc.mjs` followed by `git diff --exit-code ARCHITECTURE_RULES.md` (fails on drift)
  3. `pnpm --filter @europrint/api run test -- --testPathPattern test/architecture`
- **`test-e2e`** only on `pull_request` events; CI mode runs 1 of 45 specs.
- **`i18n-leakage`** runs `node scripts/i18n-leak-detector.mjs --mode=static --out=ci-i18n-leaks.json` and fails if `totalLeaks > 0`. Current baseline (`docs/i18n-leakage-baseline.json`) is `totalLeaks: 0` — so CI will fail on any new leak.
- **`security`** runs Semgrep with rules from `.config/replit/.semgrep/semgrep_rules.json`.

### 6.3 `.replit` workflows

166 lines. Two workflow blocks (both runtime smoke probes, not tests):
- `check-404-endpoints` — logs in as `admin` and hits 18 GET endpoints. Fails on any non-200/201/304.
- `check-500-endpoints` — same pattern over 57 GETs + 8 POSTs.

Neither runs unit tests, Jest, or Vitest. There is no `pnpm test` invocation in `.replit`.

Post-merge hook: `scripts/post-merge.sh`, timeout 120s.

### 6.4 Husky / lint-staged

- `.husky/pre-commit` (40 lines, verified):
  - Runs `pnpm lint-staged || exit 1`.
  - Then runs `node scripts/i18n-leak-detector.mjs --mode=static --out=.husky/_i18n-tmp.json` and fails if `LEAKS > BASELINE` (ratchet against `docs/i18n-leakage-baseline.json`).
- `.husky/commit-msg`: enforces Conventional Commits via `^(feat|fix|docs|chore|style|refactor|perf|test|build|ci|revert)(\([a-z0-9_-]+\))?!?: .{1,100}$`.
- `package.json` `lint-staged`:
  ```json
  "apps/api/src/**/*.ts":              ["eslint --max-warnings 100"],
  "artifacts/erp-dashboard/src/**/*.{ts,tsx}": ["eslint"],
  "**/*.{ts,tsx,js,json,css,md}":      ["prettier --check"]
  ```
- A separate `.lintstagedrc` file exists with a stale stub: `{ "_comment": "ESLint/Prettier hozircha o'rnatilmagan…" }`. Because `lint-staged` reads `package.json` first by convention, this stale file is ignored — but it should be deleted to avoid confusion.

### 6.5 CI gaps (summary)

| Gap | Severity |
|---|---|
| `ci.yml#build` does not pre-build `lib/db` | P1 |
| Stryker (`test:mutation`) never runs in CI | P2 |
| DTO suite (`test:dto`) never runs in CI | P1 |
| 44 of 45 Playwright specs never run in CI | P1 |
| `lib/db/src/schema/__tests__/numeric-money.test.ts` never runs in any runner | P2 |
| `.lintstagedrc` stale stub coexists with `package.json` config | P2 |

---

## 7. Test count & coverage areas

### 7.1 Backend

| Source | File count | Collector |
|---|---|---|
| `apps/api/test/*.spec.ts` (top-level integration) | **38** | `jest.config.js` |
| `apps/api/test/_stubs/*.spec.ts` (importability contracts) | **151** | `jest.config.js` |
| `apps/api/test/architecture/rules.spec.ts` | **1** | `jest.config.js` (also separately invoked in code-quality) |
| `apps/api/src/**/*.dto.spec.ts` (DTO schema tests) | **26** | `jest.dto.config.js` (not run by `pnpm test`) |
| **Backend total** | **216** | |

Top-level integration spec list (38) — covers:

| File | Domain |
|---|---|
| `pp-intelligence.spec.ts` | PP/MRP/CRP/Scheduling |
| `demand-forecast.spec.ts` | SMA, EMA, Holt-Winters, OLS |
| `crm-analytics.spec.ts` | CRM analytics |
| `crm-extended.spec.ts` | CRM extended ops |
| `logistics-search.spec.ts` | Logistics search |
| `finance-accounting.spec.ts`, `finance-engine.spec.ts`, `finance-security.spec.ts` | Finance — 3 files |
| `cfo-risk.service.spec.ts` | CFO risk |
| `chat-security.spec.ts` | Chat security guard |
| `hr-analytics.spec.ts`, `hr-leave-accrual.spec.ts`, `hr-offboarding.spec.ts`, `hr-onboarding.spec.ts`, `hr-payroll-closure.spec.ts` | HR — 5 files |
| `infrastructure-cache-queue.spec.ts` | Cache + queue infra |
| `mes-qc-extended.spec.ts`, `qc-spc-fmea.spec.ts` | MES/QC |
| `mm-wms-extended.spec.ts`, `wms-intelligence.spec.ts` | MM/WMS |
| `misc-extended.spec.ts` | Misc extended |
| `org-structure-move.spec.ts` | Org structure |
| `platform-foundation.spec.ts` | Platform foundation |
| `pos-balance-guard.service.spec.ts`, `pos-fifo.service.spec.ts`, `pos-gl-auto.service.spec.ts`, `pos-movement-transaction.spec.ts`, `pos-requisition-workflow.service.spec.ts`, `pos-warehouse-integration-movement.service.spec.ts`, `pos-warehouse-integration-queries.service.spec.ts` | POS — 7 files |
| `roles-guard.spec.ts` | RBAC guard |
| `barcode-warehouse-queries.service.spec.ts` | Barcode/WH |
| `cc-workflow-reject.service.spec.ts` | CC workflow |
| `document-workflow-v2-decisions.service.spec.ts` | Document workflow |
| `employees-compat-profile-orm.service.spec.ts`, `employees-compat-profile-raw.service.spec.ts` | HR compat — 2 |
| `kanban-ext-card.service.spec.ts`, `kanban-ext-flow.service.spec.ts` | Kanban — 2 |

Round 1 listed only 4 of these. Real coverage is 9.5x what R1 reported.

### 7.2 Frontend

| Source | File count |
|---|---|
| `src/pages/**/*.test.tsx` | 314 |
| `src/components/**/*.test.tsx` | 45 |
| `src/hooks/**/*.test.ts` | 44 |
| `src/lib/**/*.test.ts(x)` | ~26 |
| `src/i18n/**`, `src/sidebar/**`, `src/test/aisha-i18n.test.ts`, misc | ~5 |
| **Frontend total** | **434** |

The frontend is much more thoroughly tested than round 1's "~65" estimate. Pages have near-comprehensive smoke coverage.

### 7.3 E2E (Playwright)

45 spec files in `artifacts/erp-dashboard/e2e/`. CI runs 1. Local `test:e2e:api` runs 3 (API health, security, production-orders).

### 7.4 Library tests

| File | Runner | Run in CI? |
|---|---|---|
| `lib/db/src/schema/__tests__/numeric-money.test.ts` | none configured | no |

Orphaned. Uses `vitest` imports but `lib/db/package.json` declares no `vitest.config.ts` and no `test` script.

### 7.5 What's actually covered (by file count proxy)

- **Backend:** finance (3+1), HR (5+2), POS (7), CRM (2+stubs), MES/QC (2), MM/WMS (2), infra (1), platform (1), kanban (2), org (1), roles guard (1) + 151 stubs + 26 DTOs.
- **Frontend pages:** 314 page smoke tests (one per route, broadly).
- **Frontend components:** 45 (CRM card, lead score bar, dialog inputs, dashboard tables, etc.).
- **Frontend hooks:** 44 (HR set, chat set, permissions set, auth-refresh, generic data hooks).

Coverage *thresholds* enforce only 25% backend / 15% frontend / 10% branches frontend — well below industry norms, but the file inventory is now substantial.

---

## 8. Build commands

### 8.1 Root `package.json` scripts (verified, full)

```json
"build":       "pnpm --filter @europrint/api run build",
"build:erp":   "pnpm --filter @workspace/erp-dashboard run build",
"build:site":  "pnpm --filter @workspace/europrint-site run build",
"build:all":   "pnpm --filter @workspace/db run build && pnpm run build && pnpm run build:erp && pnpm run build:site",
"start":       "pnpm --filter @europrint/api run start",
"dev:api":     "pnpm --filter @europrint/api run dev:unsafe",
"dev:erp":     "pnpm --filter @workspace/erp-dashboard run dev",
"typecheck":   "pnpm --filter @europrint/api exec tsc --noEmit && pnpm --filter @workspace/erp-dashboard run typecheck",
"typecheck:api": "pnpm --filter @europrint/api exec tsc --noEmit",
"typecheck:erp": "pnpm --filter @workspace/erp-dashboard run typecheck",
"lint":        "pnpm --filter @europrint/api exec eslint src/ --ext .ts --max-warnings 100 && pnpm --filter @workspace/erp-dashboard run lint",
"test":        "pnpm --filter @europrint/api run test && pnpm --filter @workspace/erp-dashboard run test",
"test:coverage":"pnpm --filter @europrint/api run test:cov && pnpm --filter @workspace/erp-dashboard run test:coverage",
"ci:check":    "pnpm run typecheck && pnpm run lint && pnpm run test",
"prepare":     "husky install"
```

### 8.2 `pnpm build:all` trace

1. `pnpm --filter @workspace/db run build`
   → `tsc -p tsconfig.cjs.json` (per `lib/db/package.json`)
   → emits `lib/db/dist/cjs/*` (already present on disk).
2. `pnpm run build` = `pnpm --filter @europrint/api run build`
   → `nest build` (`apps/api/package.json`)
   → invokes tsc; resolves `@workspace/db` via the path `../../lib/db/dist/cjs/index` (step 1 made this fresh).
   → emits `apps/api/dist/`.
3. `pnpm run build:erp` = `pnpm --filter @workspace/erp-dashboard run build`
   → `vite build --config vite.config.ts`
   → **WILL FAIL** because `PublicFooter.tsx` / `PublicHeader.tsx` import from `@assets/Logo_Euro_Print_1769616882846.png`, and `attached_assets/` does not exist on disk. (P0)
4. `pnpm run build:site` = `pnpm --filter @workspace/europrint-site run build`
   → Need to verify package exists; it is referenced but not investigated here.

### 8.3 `test:coverage` references missing api script

Root `test:coverage` runs `pnpm --filter @europrint/api run test:cov`, but `apps/api/package.json#scripts` has `test`, `test:ci`, `test:dto`, `test:mutation` — **no `test:cov`**. `pnpm` will exit with code 1 ("No script `test:cov` found"). The frontend `test:coverage` script does exist.

### 8.4 `typecheck:api` consistency

`apps/api/package.json#scripts.typecheck` is `"tsc --noEmit"`. The root `typecheck:api` is `pnpm --filter @europrint/api exec tsc --noEmit` — passes through. Same result, both run tsc with project tsconfig.

### 8.5 `build` (api) script

`apps/api/package.json`:
```json
"build": "nest build",
"start": "node dist/main",
"start:fast": "nest build && node dist/main.js"
```

`nest build` uses NestJS CLI which under the hood runs tsc with the local `tsconfig.json`. Output → `dist/`. The runtime uses `module-alias` (from `_moduleAliases` in `package.json`) to remap compiled imports to `dist/...` — see Section 5.1.

---

## 9. Pre-commit hooks

### 9.1 Husky scaffolding

- `.husky/_/` directory present (Husky v9 internal).
- `.husky/pre-commit` (executable, 40 lines).
- `.husky/commit-msg` (executable, 24 lines).
- `package.json#scripts.prepare = "husky install"`.

### 9.2 `pre-commit` content (verified, full)

```bash
#!/usr/bin/env sh
# EuroPrint - pre-commit hook (Husky v9)
# Staged fayllar uchun ESLint + Prettier ishlatadi (lint-staged orqali).
# Typecheck va testlar CI'da ishlaydi.

pnpm lint-staged || exit 1

# i18n leakage quick-scan. Blocks the commit if any new hardcoded UI string
# slips into a tracked source file. Fix by wrapping the string in
# `tLabel('namespace.key', 'Original Text')` or by running the bulk
# converters (fix-types-i18n.mjs / fix-jsx-and-props.mjs).
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E "artifacts/erp-dashboard/src/.*\.(tsx|ts)$" | grep -v "\.spec\.\|\.test\." || true)
if [ -n "$STAGED" ]; then
  node scripts/i18n-leak-detector.mjs --mode=static --out=.husky/_i18n-tmp.json >/dev/null 2>&1 || true
  if [ -f .husky/_i18n-tmp.json ]; then
    LEAKS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.husky/_i18n-tmp.json','utf8')).summary.totalLeaks)" 2>/dev/null || echo 0)
    rm -f .husky/_i18n-tmp.json
    BASELINE=$(node -e "try{const b=JSON.parse(require('fs').readFileSync('docs/i18n-leakage-baseline.json','utf8'));console.log(b.summary?.totalLeaks??b.totalLeaks??0);}catch(e){console.log(0);}" 2>/dev/null || echo 0)
    if [ "$LEAKS" -gt "$BASELINE" ]; then
      echo "❌ i18n leakage: $LEAKS strings detected (baseline: $BASELINE). New strings added!"
      echo "   Run: node scripts/i18n-leak-detector.mjs --mode=static"
      echo "   Or wrap text in tLabel('namespace.key', 'Original Text')"
      exit 1
    fi
  fi
fi
```

Notes:
- `pnpm lint-staged` is the only required step (typecheck/tests are deferred to CI by design).
- The i18n step runs *the full* static scan even when only one frontend file is staged, which makes commits slower for the dashboard tree.
- The baseline is `docs/i18n-leakage-baseline.json` with `totalLeaks: 0` — any new leak fails the commit.

### 9.3 `commit-msg` enforces Conventional Commits

```
^(feat|fix|docs|chore|style|refactor|perf|test|build|ci|revert)(\([a-z0-9_-]+\))?!?: .{1,100}$
```

Allowed scopes: any lowercase alnum + `-`/`_`. Subject line 1-100 chars. `!` (breaking) allowed.

### 9.4 `lint-staged` config in `package.json`

```json
"lint-staged": {
  "apps/api/src/**/*.ts":              ["eslint --max-warnings 100"],
  "artifacts/erp-dashboard/src/**/*.{ts,tsx}": ["eslint"],
  "**/*.{ts,tsx,js,json,css,md}":      ["prettier --check"]
}
```

- Backend ESLint allows up to 100 warnings before failing (lenient).
- Frontend ESLint allows zero warnings beyond the default (default is `--max-warnings -1` = unlimited unless specified; here just `eslint` so default).
- Prettier runs in `--check` mode (read-only) — does not auto-format. A developer who forgot to run `pnpm prettier --write .` will see the commit blocked.

### 9.5 Stale `.lintstagedrc`

```json
{ "_comment": "ESLint/Prettier hozircha o'rnatilmagan. Faza 4'da qo'shamiz, hozircha hooklar passive." }
```

Translation: "ESLint/Prettier not yet installed. We'll add in Phase 4, hooks are passive for now." This is now outdated and should be deleted — `package.json#lint-staged` takes precedence in lint-staged's lookup order, but the stale file is confusing.

---

## 10. Findings summary

### P0 — blocks build / CI right now

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P0-1 | `attached_assets/` directory does not exist; `PublicFooter.tsx:9` and `PublicHeader.tsx:10` import `@assets/Logo_Euro_Print_1769616882846.png` | `ls attached_assets` → ENOENT; `find -name 'Logo_Euro_Print*'` → 0 hits | `pnpm build:erp` / `pnpm build:all` will fail with "Could not resolve …/attached_assets/Logo_Euro_Print_1769616882846.png" |

### P1 — broken, but recoverable

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P1-1 | Root `test:coverage` script calls `test:cov` which doesn't exist in api package | root `package.json#scripts.test:coverage`; `apps/api/package.json#scripts` lacks `test:cov` | `pnpm test:coverage` exits non-zero before reaching frontend |
| P1-2 | `ci.yml#build` job re-runs `pnpm install --frozen-lockfile` but does NOT build `lib/db` before `pnpm --filter @europrint/api run build` | `.github/workflows/ci.yml:202-205` | api build resolves `@workspace/db` via tsconfig path to a non-existent `lib/db/dist/cjs/index` on a clean runner |
| P1-3 | `jest.dto.config.js` lacks `@workspace/db` and `uuid` mappers, no `transformIgnorePatterns`, no `setupFiles: ['reflect-metadata']` | `apps/api/test/jest.dto.config.js` | `pnpm test:dto` fails for any DTO with a transitive ESM or `@workspace/db` import |
| P1-4 | DTO suite never runs in CI (no `test:dto` step anywhere) | grep `test:dto` in `.github/workflows/*` → 0 hits | DTO schema regressions ship undetected |
| P1-5 | 44 of 45 Playwright e2e specs never run in CI | `playwright.config.ts:13`; `code-quality.yml:142` | E2E surface is essentially unguarded outside `aisha-director-flow.spec.ts` |
| P1-6 | `@workspace/types` used in code but not declared in any `tsconfig.paths` | `OnboardingRoadmapDialog.types.ts:9` | Works under workspace customConditions but fragile — isolated tsc runs may fail |
| P1-7 | `@workspace/math-utils` declared in `apps/api/tsconfig.json` but unused; if a future import lands, jest has no mapper | `apps/api/tsconfig.json:37`; no jest mapping | Latent — first import will break tests |

### P2 — quality / hygiene

| # | Finding | Evidence | Impact |
|---|---|---|---|
| P2-1 | Vitest config comment says "5% baseline" but thresholds are `15/15/10/15` | `artifacts/erp-dashboard/vitest.config.ts:47-55` | Misleads reviewers; should sync comment |
| P2-2 | Stryker mutates only finance + hr + sd; other ~60 modules unmutated | `apps/api/stryker.config.json:9-15` | Mutation coverage capped at small slice of codebase |
| P2-3 | Stryker has no `thresholds.break` set | `apps/api/stryker.config.json` (whole file) | Mutation score cannot fail any pipeline |
| P2-4 | Stryker never runs in CI | grep `test:mutation` in `.github/workflows/*` → 0 hits | Manual-only quality gate |
| P2-5 | `lib/db/src/schema/__tests__/numeric-money.test.ts` not collected by any runner | no `vitest.config.ts` in `lib/db/`; not in dashboard `include` | Schema money test is dead code |
| P2-6 | Stale `.lintstagedrc` ("hooks passive") | repo root `.lintstagedrc` | Confuses contributors; `package.json` block takes precedence |
| P2-7 | `vitest.config.ts` resolves `@assets` to a non-existent directory | `vitest.config.ts:62`; `attached_assets` absent | Any test that mounts `PublicFooter`/`PublicHeader` blows up at import time |
| P2-8 | `apps/api/package.json#_moduleAliases` has `shared`, `src`, `@`, `src/common` mappings that have no equivalent in `tsconfig.json` paths | `apps/api/package.json` `_moduleAliases`; `tsconfig.json` paths | Code that uses these at compile time may pass tsc via fallthrough but ride on runtime-only resolution; the two surfaces must be hand-synced |
| P2-9 | Coverage thresholds well below industry norm (backend 25/20, frontend 15/10) | `jest.config.js:43-49`; `vitest.config.ts:50-55` | Step-up plan in comments but no automated ratchet |
| P2-10 | `ts-jest` still suppresses TS2322 / TS2345 / TS7006 in test files | `jest.config.js:23-25` | Type-mismatch defects in tests are tolerated |
| P2-11 | `.replit` workflows are smoke probes (404/500) — no `pnpm test` invocation | `.replit` lines 44-152 | Replit IDE runs don't catch test regressions |
| P2-12 | Build output `artifacts/erp-dashboard/dist/` was committed to repo (per round 1 note; still likely true) | not re-verified this pass | Bloats history; risk of merge conflicts |

---

## Appendix A — verified file references

- `apps/api/test/jest.config.js` — read in full (80 lines).
- `apps/api/test/jest.dto.config.js` — read in full (20 lines).
- `apps/api/stryker.config.json` — read in full (21 lines).
- `apps/api/tsconfig.json` — read in full (57 lines).
- `apps/api/package.json` — `scripts` + `_moduleAliases` + Stryker deps.
- `artifacts/erp-dashboard/vitest.config.ts` — read in full (70 lines).
- `artifacts/erp-dashboard/playwright.config.ts` — read in full (70 lines).
- `artifacts/erp-dashboard/tsconfig.json` — read in full (25 lines).
- `artifacts/erp-dashboard/package.json` — `scripts`.
- `artifacts/erp-dashboard/vite.config.ts` — `resolve.alias` block (L296-302).
- `tsconfig.base.json` — read in full (25 lines).
- `package.json` (root) — full `scripts` + `lint-staged` + `pnpm.overrides`.
- `.github/workflows/ci.yml` — read in full (227 lines).
- `.github/workflows/code-quality.yml` — read in full (194 lines).
- `.husky/pre-commit` — read in full (28 lines).
- `.husky/commit-msg` — read in full (24 lines).
- `pnpm-workspace.yaml` — read in full.
- `docs/i18n-leakage-baseline.json` — content `{"summary":{"totalLeaks":0,...}}`.
- `.replit` — first 90 lines + workflow 3.

## Appendix B — verified counts (commands)

```
find apps/api/test -name '*.spec.ts'                          → 190 total
find apps/api/test -maxdepth 1 -name '*.spec.ts'              →  38
find apps/api/test/_stubs -name '*.spec.ts'                   → 151
find apps/api/test/architecture -name '*.spec.ts'             →   1
find apps/api/src -name '*.dto.spec.ts'                       →  26
find apps/api/src -name '*.spec.ts' ! -name '*.dto.spec.ts'   →   0
find artifacts/erp-dashboard/src -name '*.test.ts'            →  71
find artifacts/erp-dashboard/src -name '*.test.tsx'           → 363
find artifacts/erp-dashboard/src -name '*.spec.ts*'           →   0
find artifacts/erp-dashboard/e2e -name '*.spec.ts'            →  45
find lib/db -name '*.test.ts' -o -name '*.spec.ts'            →   1 (orphan)
```

## Appendix C — round-1 corrections at a glance

| R1 claim | Truth |
|---|---|
| Stryker uses Karma/Angular | Uses Jest with `@stryker-mutator/jest-runner` |
| ts-jest `diagnostics: false` hides type errors | `diagnostics.ignoreCodes: [2322, 2345, 7006]` only |
| Vitest threshold 5% | 15% (lines/funcs/stmts), 10% (branches) |
| `@assets` missing from tsconfig | Declared at `tsconfig.json:21` |
| `build:all` skips lib/db | First step IS `pnpm --filter @workspace/db run build` |
| `code-quality.yml` filter typo | Uses `@workspace/erp-dashboard` correctly |
| `aisha-i18n.spec.ts` orphan | File is now `.test.ts`, gets collected |
| 4 backend integration test files | 38 top-level + 151 stubs |
| ~65 frontend unit tests | 434 |
| 46 e2e specs | 45 |
| `lib/db/dist/cjs/index.js` UNVERIFIED | Exists |
| `scripts/run-all-reviewers.sh` UNVERIFIED | Exists |
| `attached_assets/` not flagged | **DOES NOT EXIST — P0 build break** |
