# Report 01 — Monorepo Architecture

**Project:** EuroPrint ERP
**Audit pass:** Round 2 (forensic re-verification)
**Date:** 2026-05-27
**Repository root:** `Uzbek-Language-Module/` (referred to as `$ROOT`)
**Package manager:** pnpm 9.15.9
**Node engine pinned:** `>=20.0.0`

---

## Diff vs round 1

- **`.env` files are NOT committed to git.** Round 1 listed `$ROOT/.env`, `apps/api/.env` and `artifacts/erp-dashboard/.env.local` as "committed — SECURITY RISK". `git ls-files` shows only the `.example`/`.production.example` siblings are tracked; the real env files exist on disk but `.gitignore` (`/Uzbek-Language-Module/.gitignore:39-44`) excludes them. The actual leak is elsewhere — see next bullet.
- **`.replit` IS tracked and contains a real Neon Postgres URL + password.** Round 1 listed `.replit` only as "deployment config" without inspecting it. The file has `NEON_DATABASE_URL = "postgresql://neondb_owner:npg_Nq7S5FRhXBDk@ep-gentle-night-abiu1cup.eu-west-2.aws.neon.tech/neondb?sslmode=require"` at `/Uzbek-Language-Module/.replit:34` and is in git. This is the real P0 secret leak.
- **`@workspace/math-utils` is unused.** Round 1 flagged the missing `_moduleAliases` entry as a runtime risk. Verified: no file under `apps/api/src/`, `artifacts/`, or `lib/` other than `lib/math-utils` itself imports `@workspace/math-utils`. The declaration in `apps/api/package.json:83` is dead weight — no runtime breakage but the dependency is a phantom.
- **`@workspace/api-client-react`, `@workspace/api-zod`, `@workspace/api-spec` have ZERO consumers in app code.** Round 1 listed `api-client-react` as consumed by erp-dashboard and europrint-site. Grep confirms no `import … from '@workspace/api-client-react'` (or `-zod`/`-spec`) under `apps/api/src/`, `artifacts/erp-dashboard/src/`, `artifacts/europrint-site/src/`, or `artifacts/mockup-sandbox/src/`. They are declared in package.json but never imported.
- **`@workspace/types` is a phantom dep in erp-dashboard.** Imported at `artifacts/erp-dashboard/src/components/hr/OnboardingRoadmapDialog.types.ts:2` but NOT declared in `artifacts/erp-dashboard/package.json`. Works only because pnpm hoists symlinks.
- **`pnpm db:migrate` is broken.** `package.json:26` runs `pnpm --filter @europrint/api run migrate`, but `apps/api/package.json` has no `migrate` script. Round 1's "duplicate db:migrate" observation is wrong — the root delegate is a dead alias.
- **`lib/db/tsconfig.cjs.json` disables strict mode** (`strict: false`, `strictNullChecks: false`, `noImplicitAny: false`). Round 1 did not call this out. Since `apps/api` compiles **against the CJS output** of lib/db (`@workspace/db` -> `lib/db/dist/cjs/index`), the entire database surface enters the API with weakened type guarantees.
- **`artifacts/api-server/` exists as a workspace match** (`pnpm-workspace.yaml:3` -> `artifacts/*`). Round 1 missed it. Its only content is `public/opengraph.jpg` — no `package.json`, so pnpm silently skips it, but the directory is misleading scaffolding.
- **Round 1's `54 backend modules` count was wrong.** `apps/api/src/modules/*/` returns **50 directories** today.
- **Dockerfile vs Dockerfile.prod port mismatch.** `Dockerfile` exposes/runs on port 3000 (`Dockerfile:103`), `Dockerfile.prod` on port 4000 (`Dockerfile.prod:55`). Compose files do not converge — `docker-compose.yml` uses `Dockerfile` & 3000, `docker-compose.prod.yml` uses `Dockerfile.prod` & 4000.

---

## 1. Workspace topology

### 1.1 Top-level directory tree

```
$ROOT/
├── apps/
│   └── api/                          @europrint/api          (NestJS + Fastify)
├── artifacts/
│   ├── api-server/                   (NOT a workspace; only public/opengraph.jpg)
│   ├── erp-dashboard/                @workspace/erp-dashboard (React 19 + Vite 7 SPA)
│   ├── europrint-site/               @workspace/europrint-site (React 19 + Vite 7 marketing)
│   └── mockup-sandbox/               @workspace/mockup-sandbox (React 19 + Vite 7 playground)
├── lib/
│   ├── api-client-react/             @workspace/api-client-react
│   ├── api-spec/                     @workspace/api-spec       (Orval codegen)
│   ├── api-zod/                      @workspace/api-zod        (Zod schemas)
│   ├── db/                           @workspace/db             (Drizzle ORM)
│   ├── math-utils/                   @workspace/math-utils
│   └── types/                        @workspace/types
├── scripts/                          @workspace/scripts        (audit tooling, tsx)
├── docs/
│   ├── full-analysis-2026-05-27/     (Round 1 audit)
│   └── full-analysis-2026-05-27-v2/  (this round)
├── package.json                      @europrint/workspace v2.0.0 (private)
├── pnpm-workspace.yaml               (single source of workspace globs)
├── pnpm-lock.yaml                    lockfileVersion: '9.0'
├── tsconfig.base.json                shared compiler options (customConditions: ["workspace"])
├── .npmrc                            auto-install-peers=false; strict-peer-dependencies=false
├── Dockerfile / Dockerfile.prod      (two parallel container builds)
├── docker-compose.yml | .prod.yml | .test.yml
├── nginx.conf
├── ecosystem.config.cjs              PM2 cluster config
├── .replit                           Replit deployment (LEAKS NEON DB URL)
├── .env                              Local secrets (gitignored but lives on disk)
├── .env.example / .env.production.example
└── (~50 root-level audit *.mjs / *.cjs / *.sh / *.txt / *.json files)
```

### 1.2 pnpm workspace globs

`pnpm-workspace.yaml:1-6`:
```yaml
packages:
  - apps/*
  - artifacts/*
  - lib/*
  - lib/integrations/*
  - scripts
```

Two facts to highlight:

1. **`lib/integrations/*` matches no directory.** `lib/integrations/` does not exist on disk; pnpm silently ignores the empty glob. Round 1 listed the same glob without verifying.
2. **`scripts` is a bare path** (singular, not `scripts/*`). It is the only non-glob entry; the directory does have a `package.json` (`scripts/package.json` -> `@workspace/scripts`).
3. **`artifacts/api-server/` matches the `artifacts/*` glob** but has no `package.json`, so pnpm skips it — confirmed by absence of any `artifacts/api-server` entry in `pnpm-lock.yaml`.

### 1.3 No `workspaces` field in package.json

`package.json` has no `workspaces` property (verified by `grep '"workspaces"' package.json` returning nothing). This is correct for pnpm (which uses `pnpm-workspace.yaml`) but means tools that read npm/yarn-style `workspaces` arrays — for example some IDE plugins — will not detect the workspace structure.

### 1.4 Engines

Root `package.json:30-33`:
```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=9.0.0"
}
```

No per-package `engines` field exists in `apps/api/package.json`, `artifacts/erp-dashboard/package.json`, or `lib/db/package.json`. The root engine is the only floor.

---

## 2. Package inventory

### 2.1 `@europrint/workspace` — root

Path: `/Uzbek-Language-Module/`
File: `package.json`

```json
"name": "@europrint/workspace",
"version": "2.0.0",
"private": true,
"packageManager": "pnpm@9.15.9"
```

Scripts (selected, `package.json:6-29`):

| Script | Command | Status |
|---|---|---|
| `build` | `pnpm --filter @europrint/api run build` | OK — builds API only |
| `build:erp` | `pnpm --filter @workspace/erp-dashboard run build` | OK |
| `build:site` | `pnpm --filter @workspace/europrint-site run build` | OK |
| `build:all` | `pnpm --filter @workspace/db run build && pnpm run build && pnpm run build:erp && pnpm run build:site` | OK — orders db first |
| `start` | `pnpm --filter @europrint/api run start` | OK |
| `dev:api` | `pnpm --filter @europrint/api run dev:unsafe` | Uses **dev:unsafe** (no `--type-check`) |
| `dev:erp` | `pnpm --filter @workspace/erp-dashboard run dev` | OK |
| `typecheck` | `pnpm --filter @europrint/api exec tsc --noEmit && pnpm --filter @workspace/erp-dashboard run typecheck` | Only api + erp; site, sandbox, lib/* skipped |
| `lint` | `pnpm --filter @europrint/api exec eslint src/ --ext .ts --max-warnings 100 && pnpm --filter @workspace/erp-dashboard run lint` | `--max-warnings 100` tolerates 100 warns |
| `test` | `pnpm --filter @europrint/api run test && pnpm --filter @workspace/erp-dashboard run test` | OK |
| `db:migrate` | `pnpm --filter @europrint/api run migrate` | **BROKEN** — no `migrate` script in apps/api |
| `ci:check` | `pnpm run typecheck && pnpm run lint && pnpm run test` | OK |
| `prepare` | `husky install` | OK |

DevDependencies are minimal (eslint stack, husky, lint-staged, prettier, typescript-eslint).

A large `pnpm.overrides` block (`package.json:46-150`) duplicates much of `pnpm-workspace.yaml`'s `overrides`. The two override blocks both include `picomatch`, `lodash`, `yaml`, `postcss`, etc. — they are nearly identical but not byte-equal. The root `pnpm.overrides` has an extra `minimatch: "^9.0.5"`, `fast-uri`, `fast-xml-builder`, `@babel/plugin-transform-modules-systemjs`, and uses `brace-expansion: "^2.0.1"` while `pnpm-workspace.yaml:88` says `brace-expansion: ">=4.0.0"`.

### 2.2 `@europrint/api`

Path: `apps/api/`
File: `apps/api/package.json:2` -> `"name": "@europrint/api", "version": "2.0.0"`

**Dependencies of interest** (`apps/api/package.json:47-127`):

| Dep | Version | Notes |
|---|---|---|
| `@nestjs/core` / `common` / `platform-fastify` | `^11.0.0` | NestJS 11 |
| `@nestjs/swagger` | `^11.4.2` | |
| `@nestjs/throttler` | `^6.2.1` | |
| `@nestjs/cqrs` | `^11.0.3` | |
| `@nestjs/cache-manager` | `^3.0.1` | |
| `@nestjs/bullmq` / `bull` | `^11.0.4` / `^11.0.4` | both registered |
| `fastify` | `^5.8.5` | (also overridden in workspace to `>=5.8.5`) |
| `drizzle-orm` | `catalog:` -> `^0.45.2` | |
| `zod` | `^3.23.8` | **Direct version, NOT catalog** (catalog: 3.25.76) |
| `@anthropic-ai/sdk` | `^0.32.0` | |
| `openai` | `^4.67.0` | |
| `@google/generative-ai` | `^0.21.0` | |
| `socket.io` | `^4.8.3` | |
| `bcrypt` AND `bcryptjs` | `^5.1.1` / `^2.4.3` | both present — likely redundant |
| `module-alias` | `^2.3.4` | runtime path resolver |
| `@workspace/db` | `workspace:*` | active |
| `@workspace/math-utils` | `workspace:*` | **never imported** — dead workspace dep |

**DevDependencies of interest** (`apps/api/package.json:128-160`):

| Dep | Version | Notes |
|---|---|---|
| `@nestjs/cli` | `^11.0.21` | |
| `@swc/core` | `^1.15.24` | builder for `nest build` (see `nest-cli.json`) |
| `typescript` | `~5.9.2` | |
| `@types/node` | `^20.0.0` | **conflicts with catalog `^25.3.3`** |
| `jest` + `@swc/jest` + `ts-jest` + `babel-jest` | mixed | unusual: three Jest transformers declared together |
| `@stryker-mutator/core` | `^9.6.1` | mutation testing |
| `tsconfig-paths` | `^4.2.0` | (alternative to module-alias; both included) |

`apps/api/package.json:5-30` defines `_moduleAliases` for runtime resolution. Every alias maps to `dist/*` directories — i.e. the compiled JS output:

```json
"_moduleAliases": {
  "@europrint/schemas": "../../lib/db/dist/cjs",
  "@common": "dist/common",
  "@modules": "dist/modules",
  "@config": "dist/config",
  "@shared/db": "dist/shared/db",
  …
  "@workspace/db": (NOT LISTED — missing)
}
```

Confirmed: `_moduleAliases` has **no `@workspace/db` entry**, even though tsconfig maps `@workspace/db` -> `../../lib/db/dist/cjs/index`. Runtime resolution must rely on Node's module resolution finding `@workspace/db` via `node_modules/@workspace/db` (pnpm symlink to `lib/db`), which then reads `lib/db/package.json`'s `"main": "./dist/cjs/index.js"`. That works because pnpm creates the symlink, but the API depends on **two distinct mechanisms** for path resolution in a single file: `module-alias` for `@common/*` etc., and Node + pnpm symlinks for `@workspace/*`. There is no `@workspace/math-utils` alias either.

### 2.3 `@workspace/erp-dashboard`

Path: `artifacts/erp-dashboard/`
File: `artifacts/erp-dashboard/package.json:2-5` -> `"name": "@workspace/erp-dashboard", "version": "0.0.0"`, `type: module`.

Key dependencies (selected):

| Dep | Version | Source |
|---|---|---|
| `react` / `react-dom` | `catalog:` -> `19.1.0` | |
| `vite` | `catalog:` -> `^7.3.2` | |
| `@vitejs/plugin-react` | `catalog:` -> `^5.0.4` | |
| `vite-plugin-pwa` | `^1.2.0` | |
| `@tanstack/react-query` | `catalog:` -> `^5.90.21` | |
| `wouter` | `^3.3.5` | router (not React Router) |
| `tailwindcss` / `@tailwindcss/vite` | `catalog:` -> `^4.1.14` | Tailwind 4 |
| `@sentry/react` / `@sentry/vite-plugin` | `^9.0.0` / `^3.0.0` | |
| `socket.io-client` | `^4.8.3` | runtime |
| `dexie` | `^4.4.2` | offline POS |
| `vitest` | `^4.1.2` | unit testing |
| `@playwright/test` | `^1.58.2` | e2e |
| `zustand` | `^5.0.12` | global state |
| `@workspace/api-client-react` | `workspace:*` | **declared but never imported in src/** |

`@workspace/types` is **NOT declared** but is imported at one site (`artifacts/erp-dashboard/src/components/hr/OnboardingRoadmapDialog.types.ts:2`). Resolution succeeds only because pnpm's hoisting policy makes `node_modules/.pnpm/@workspace+types/node_modules/@workspace/types` reachable.

Two Windows-specific binary deps appear in `devDependencies` even though Vite builds rely on platform auto-detection: `@rollup/rollup-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc`, `lightningcss-win32-x64-msvc`. CI on Linux/macOS will install these but they will be no-ops; they exist to satisfy local Windows installs.

### 2.4 `@workspace/europrint-site`

Path: `artifacts/europrint-site/`
File: `artifacts/europrint-site/package.json:2-5` -> `"name": "@workspace/europrint-site", "version": "0.0.0"`, `type: module`.

Declares `@workspace/api-client-react: workspace:*` (`artifacts/europrint-site/package.json:51`) but no import sites in `artifacts/europrint-site/src/` reference it (verified via grep). Like the dashboard, the workspace dep is dead.

Scripts: `dev`, `build`, `serve`, `typecheck` — standard Vite stack. No test scripts.

### 2.5 `@workspace/mockup-sandbox`

Path: `artifacts/mockup-sandbox/`
File: `artifacts/mockup-sandbox/package.json:2-5` -> `"name": "@workspace/mockup-sandbox", "version": "2.0.0"`, `type: module`.

No workspace deps. Standalone playground for UI mock screens. Includes a local Vite plugin file: `artifacts/mockup-sandbox/mockupPreviewPlugin.ts` (referenced in its `tsconfig.json:3` include list).

### 2.6 `@workspace/api-client-react`

Path: `lib/api-client-react/`
File: `lib/api-client-react/package.json:2-15`:
```json
{
  "name": "@workspace/api-client-react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@tanstack/react-query": "catalog:" },
  "peerDependencies": { "react": ">=18" }
}
```

**No build step.** Exports raw TS source via `customConditions: ["workspace"]` (set in `tsconfig.base.json:23`).

Source surface (`lib/api-client-react/src/index.ts`):
```ts
export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
```

`src/generated/api.ts` = 101 lines, `src/custom-fetch.ts` = 373 lines. Generated by Orval from `lib/api-spec/openapi.yaml`.

**Consumer count: 0.** No code under `apps/`, `artifacts/`, or `lib/` imports `@workspace/api-client-react`. The library is built but never consumed.

### 2.7 `@workspace/api-spec`

Path: `lib/api-spec/`
File: `lib/api-spec/package.json:2-11`:
```json
{
  "name": "@workspace/api-spec",
  "version": "0.0.0",
  "private": true,
  "scripts": { "codegen": "orval --config ./orval.config.ts" },
  "devDependencies": { "orval": "^8.5.2" }
}
```

Contents:
- `openapi.yaml` — source spec
- `orval.config.ts` — codegen targets (presumably writes to `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`)

No runtime exports; pure dev tooling.

### 2.8 `@workspace/api-zod`

Path: `lib/api-zod/`
File: `lib/api-zod/package.json:2-12`:
```json
{
  "name": "@workspace/api-zod",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "catalog:" }
}
```

`lib/api-zod/src/generated/api.ts` = 16 lines. Index file is a 7-line barrel.

**Consumer count: 0** (verified).

### 2.9 `@workspace/db`

Path: `lib/db/`
File: `lib/db/package.json`:

```json
"name": "@workspace/db",
"version": "0.0.0",
"main": "./dist/cjs/index.js",
"types": "./dist/cjs/index.d.ts",
"exports": {
  ".": {
    "import": "./src/index.ts",
    "require": "./dist/cjs/index.js",
    "types": "./dist/cjs/index.d.ts"
  },
  "./schema": {
    "import": "./src/schema/index.ts",
    "require": "./dist/cjs/schema/index.js",
    "types": "./dist/cjs/schema/index.d.ts"
  }
}
```

Build script (`lib/db/package.json:20`): `"build": "tsc -p tsconfig.cjs.json"` — compiles to `dist/cjs/`.

Drizzle scripts (`lib/db/package.json:22-25`):
```json
"db:generate": "drizzle-kit generate --config ./drizzle.config.ts",
"db:migrate":  "drizzle-kit migrate  --config ./drizzle.config.ts",
"push":        "drizzle-kit push     --config ./drizzle.config.ts",
"push-force":  "drizzle-kit push --force --config ./drizzle.config.ts"
```

Runtime deps (`lib/db/package.json:27-32`):

| Dep | Version |
|---|---|
| `drizzle-orm` | `catalog:` -> `^0.45.2` |
| `drizzle-zod` | `0.7.0` (exact pin) |
| `pg` | `^8.20.0` |
| `zod` | `catalog:` -> `3.25.76` |

Optional peer: `@opentelemetry/api ^1.9.1`.

**TWO tsconfigs** in `lib/db/`:
- `tsconfig.json` — extends root base, `composite: true`, `emitDeclarationOnly: true`, `outDir: dist`, `rootDir: src` (used for project references / typecheck only).
- `tsconfig.cjs.json` — **does NOT extend the base**, sets `module: commonjs`, `target: ES2022`, and explicitly relaxes `strict: false`, `strictNullChecks: false`, `noImplicitAny: false`, `esModuleInterop: true`. This is the config the `build` script uses.

So the CJS output that `apps/api` consumes is built with weakened strictness. Round 1 reported `lib/db` as a build target but did not flag the strict-mode opt-out.

Active migrations (excluding `archive/`): 14 files in `lib/db/drizzle/`:
```
0000_nice_kylun.sql
0001_add_indexes_only.sql
0002_recruitment_funnel_refs_offers.sql
0003_pos_schema_extensions.sql
0004_hr_tz2_foundation.sql
0005_lms_kanban_website_extended.sql
0006_fix_varchar_fk_to_integer.sql
0007_hr_architecture_additions.sql
0008_fk_int_parallel_columns.sql
0009_master_data_unique_codes.sql
0010_financial_reports_tables.sql
0011_consolidated_legacy_fixes.sql
0016_add_tenant_id_to_hr_tables.sql
0050_migrate_departments_to_org.sql
```
Numbering gap (0012-0015 missing, 0017-0049 missing) is consistent with manual renumbering after archival. The `archive/` subdirectory still exists and pnpm has not yet been verified to exclude it from drizzle-kit's migration discovery — but `drizzle-kit migrate` only reads the directory pointed to by `out:` in `drizzle.config.ts`, and the archive lives one level deeper.

### 2.10 `@workspace/math-utils`

Path: `lib/math-utils/`
File: `lib/math-utils/package.json:2-13`:
```json
{
  "name": "@workspace/math-utils",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": { "import": "./src/index.ts", "require": "./src/index.ts" } }
}
```

**No build step. No dependencies.** A 1-file package — `src/index.ts` exports `safeNum`, `safeDiv`, etc.

**Used by: nobody.** Grep across `apps/`, `artifacts/`, `lib/` (excluding the package itself) returns zero hits for `@workspace/math-utils`. The package is declared as a runtime dep of `apps/api` but never imported.

Note: `exports[.] .require` points to a `.ts` file — Node cannot `require()` a `.ts` file without a loader. If any code ever did `require('@workspace/math-utils')` at runtime under the default Node loader, it would crash. The package is safe only because nobody calls it.

### 2.11 `@workspace/types`

Path: `lib/types/`
File: `lib/types/package.json:2-15`:
```json
{
  "name": "@workspace/types",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts", "./*": "./src/*.ts" }
}
```

Source files (`lib/types/src/`): `analytics.ts`, `crm.ts`, `employee.ts`, `hr.ts`, `index.ts`, `invoice.ts`, `lms.ts`, `order.ts`, `product.ts`, `user.ts` — 10 files.

`lib/types/src/index.ts:7-15`:
```ts
export * from './employee';
export * from './user';
export * from './lms';
…
```

**Used by:** exactly one site in app code — `artifacts/erp-dashboard/src/components/hr/OnboardingRoadmapDialog.types.ts:2`:
```ts
export type { Employee } from '@workspace/types';
```

But `@workspace/types` is **not declared** in `artifacts/erp-dashboard/package.json` — phantom dependency.

### 2.12 `@workspace/scripts`

Path: `scripts/`
File: `scripts/package.json`:
```json
"name": "@workspace/scripts",
"version": "0.0.0",
"private": true,
"type": "module",
"scripts": {
  "hello":           "tsx ./src/hello.ts",
  "typecheck":       "tsc -p tsconfig.json --noEmit",
  "audit:api":       "bash ../apps/api/audit.sh",
  "audit:404":       "tsx ../scripts/audit-api-endpoints.ts",
  …
}
```

All scripts shell-out to sibling `.ts` / `.sh` / `.cjs` files in the `scripts/` directory itself or in `apps/api/`. Many `audit:*` scripts point to a `src/` subdirectory that may or may not exist (e.g. `bash src/master-audit.sh`, `bash ../scripts/src/frontend-gap-audit.sh`) — not verified.

DevDeps: `@types/node: catalog:`, `tsx: catalog:` only.

---

## 3. Build pipelines

### 3.1 Per-package build commands

| Package | Build script | Output |
|---|---|---|
| `@europrint/api` | `nest build` (SWC builder per `nest-cli.json:5-9`) | `apps/api/dist/` |
| `@workspace/db` | `tsc -p tsconfig.cjs.json` | `lib/db/dist/cjs/` (verified present) |
| `@workspace/erp-dashboard` | `vite build --config vite.config.ts` | `artifacts/erp-dashboard/dist/public/` (overridden in `vite.config.ts:99-100`) |
| `@workspace/europrint-site` | `vite build --config vite.config.ts` | `artifacts/europrint-site/dist/` |
| `@workspace/mockup-sandbox` | `vite build` | `artifacts/mockup-sandbox/dist/` |
| `@workspace/api-client-react` | — (no build) | exports raw `./src/index.ts` |
| `@workspace/api-zod` | — (no build) | exports raw `./src/index.ts` |
| `@workspace/api-spec` | — (`codegen` only) | runs Orval; outputs into sibling packages |
| `@workspace/math-utils` | — (no build) | exports raw `./src/index.ts` |
| `@workspace/types` | — (no build) | exports raw `./src/*.ts` |
| `@workspace/scripts` | — | shell scripts only |

### 3.2 Build order dependency

API compilation requires `lib/db/dist/cjs/` to exist because `apps/api/tsconfig.json:38` declares:
```json
"@workspace/db": ["../../lib/db/dist/cjs/index"]
```

The path target is a `.js` file (no `.ts`) — so TypeScript reads the `.d.ts` sibling. If the build has never run, `dist/cjs/` is empty and TS reports `Cannot find module '@workspace/db'`.

The root `build:all` script (`package.json:10`) honors the order:
```json
"build:all": "pnpm --filter @workspace/db run build && pnpm run build && pnpm run build:erp && pnpm run build:site"
```

But the bare `build` script (`package.json:7`) does NOT pre-build lib/db:
```json
"build": "pnpm --filter @europrint/api run build"
```

This will fail on a clean checkout. Dockerfile (`Dockerfile:67-68`) explicitly orders it:
```dockerfile
RUN pnpm --filter @workspace/db run build && \
    pnpm --filter @europrint/api run build
```

### 3.3 NestJS build pipeline detail

`apps/api/nest-cli.json:1-20`:
```json
{
  "compilerOptions": {
    "builder": "swc",
    "deleteOutDir": true,
    "assets": [{ "include": "i18n/**/*.json", "outDir": "dist", "watchAssets": true }],
    "plugins": [
      { "name": "@nestjs/swagger", "options": { "introspectComments": true } }
    ]
  }
}
```

- SWC instead of tsc — fast compile, but **SWC does not type-check**. The only type-check pass is `pnpm typecheck` (`apps/api exec tsc --noEmit`).
- `dev` script (`apps/api/package.json:33`) uses `nest start --watch --type-check`; `dev:unsafe` (`:34`) drops `--type-check`. Root `dev:api` calls `dev:unsafe` (see `package.json:12`). So the default developer dev loop has **no compile-time type checks**.
- Assets: i18n JSON files copied to `dist/i18n/` at build time.

### 3.4 Frontend build pipeline

`artifacts/erp-dashboard/vite.config.ts:97-101`:
```ts
build: {
  sourcemap: sentryAuthToken ? "hidden" : false,
  outDir: path.resolve(import.meta.dirname, "dist/public"),
  emptyOutDir: true,
},
```

Source maps are off unless `SENTRY_AUTH_TOKEN` is set, in which case they are uploaded to Sentry but not served (mode `"hidden"`). Build output goes to `dist/public/` — not the default `dist/`.

PWA plugin (`vite.config.ts:119-280`) emits a Service Worker with runtime caching strategies per route family. `BASE_PATH` defaults to `/erp-dashboard/` (`vite.config.ts:20`), used for both the PWA scope and the asset prefix.

Dev server (`vite.config.ts:304-342`) proxies:
- `${basePrefix}/api` -> `nestApiUrl` (default `http://localhost:3030`), with prefix stripping
- `/api` -> same
- `/storage` -> rewritten to `/api/storage`
- `/socket.io` and `${basePrefix}/socket.io` -> nest, WS-enabled

Custom middleware plugin `posAuthDirectPlugin` (`vite.config.ts:27-83`) intercepts `POST /api/pos/auth/login` to forward to Nest directly, bypassing the proxy for that one route. Justification not in code.

### 3.5 Test pipelines

- API: `jest --config test/jest.config.js --passWithNoTests --testPathIgnorePatterns=stryker-tmp` (`apps/api/package.json:42`). Also `test:dto` (separate config) and `test:mutation` (Stryker).
- ERP dashboard: `vitest run --config vitest.config.ts` (`artifacts/erp-dashboard/package.json:11`). Plus `test:e2e` for Playwright.
- europrint-site: no `test` script.
- mockup-sandbox: no `test` script.
- lib/*: no test scripts in any of `db`, `math-utils`, `types`, `api-client-react`, `api-zod`, `api-spec`.

---

## 4. TypeScript path aliases

### 4.1 `tsconfig.base.json`

`tsconfig.base.json:1-25`:
```json
{
  "compilerOptions": {
    "isolatedModules": true,
    "lib": ["es2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmitOnError": true,
    …
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "skipLibCheck": true,
    "target": "es2022",
    "types": [],
    "customConditions": ["workspace"]
  }
}
```

`customConditions: ["workspace"]` is what makes the `exports[. ].import = "./src/index.ts"` condition resolve in workspace packages — letting TS read raw `.ts` source without a build step (used by `@workspace/types`, `math-utils`, `api-client-react`, `api-zod`).

**The base is not actually extended everywhere.** It is extended by:
- `artifacts/erp-dashboard/tsconfig.json:2`
- `artifacts/europrint-site/tsconfig.json:2`
- `artifacts/mockup-sandbox/tsconfig.json:2`
- `lib/db/tsconfig.json:2` (only the declaration-emit config, not the CJS build config)

It is **NOT extended** by:
- `apps/api/tsconfig.json` (uses its own self-contained config; `module: commonjs`, `target: ES2021`, `moduleResolution: node`, `customConditions` absent)
- `lib/db/tsconfig.cjs.json` (the actual build config — completely independent)

So the workspace TS config is **inconsistent across the API/DB boundary**. Frontend uses ES2022 + bundler resolution + `customConditions: ["workspace"]`; backend uses ES2021 + node resolution + no custom conditions.

### 4.2 `apps/api/tsconfig.json`

`apps/api/tsconfig.json:13-40` — path aliases:

| Alias | Target | Notes |
|---|---|---|
| `@europrint/schemas` | `src/shared/db/europrint-compat.ts` | Compile-time only (single file with selective re-exports — 60 lines) |
| `@common/*` | `src/common/*` | |
| `@modules/*` | `src/modules/*` | |
| `@config/*` | `src/config/*` | |
| `@shared/db` | `src/shared/db/index.ts` | |
| `@shared/db/*` | `src/shared/db/*` | |
| `@shared/utils/*` | `src/shared/utils/*` | |
| `@shared/guards/*` | `src/modules/shared/guards/*` | |
| `@shared/decorators/*` | `src/modules/shared/decorators/*` | |
| `@shared/interceptors/*` | `src/modules/shared/interceptors/*` | |
| `@shared/infrastructure/*` | `src/modules/shared/infrastructure/*` | |
| `@shared/domain/*` | `src/modules/shared/domain/*` | |
| `shared/guards/*` (and 4 more) | duplicate of above without `@` prefix | Five duplicate aliases without the `@` — accommodates legacy imports |
| `@/*` | `src/*` | |
| `@core/*` | `src/common/*` | Aliases the same dir as `@common/*` |
| `@auth/*` | `src/modules/auth/*` | |
| `@auth/decorators/*` | `src/modules/auth/infrastructure/decorators/*` | |
| `@auth/guards/*` | `src/modules/auth/infrastructure/guards/*` | |
| `@auth/types/*` | `src/modules/auth/types/*` | |
| `@workspace/math-utils` | `../../lib/math-utils/src/index.ts` | **Unused** (no imports anywhere) |
| `@workspace/db` | `../../lib/db/dist/cjs/index` | Compile-time -> CJS output |
| `@workspace/db/*` | `../../lib/db/dist/cjs/*` | |

`apps/api/tsconfig.json:51-52`:
```json
"moduleResolution": "node",
"preserveSymlinks": true
```

`preserveSymlinks: true` is mandatory in pnpm monorepos when paths point into `node_modules`, otherwise the deep-resolved real path breaks the alias system.

**Issues:**

1. **`@common/*` and `@core/*` both map to `src/common/*`** — silent duplicate alias. Two import idioms exist for the same dir.
2. **5 "shared/X/*" aliases without the `@`** (`shared/guards/*`, `shared/decorators/*`, …) duplicate the `@shared/...` aliases. Cleanup target.
3. **`@workspace/db/*`** uses a dist-only path. Sub-imports like `@workspace/db/schema/core/core-users` (which DO occur in `apps/api/src/` — verified) resolve only after `lib/db` is built.

### 4.3 Runtime `_moduleAliases` (`apps/api/package.json:5-30`)

The runtime alias set is **NOT the same** as the tsconfig set:

| Alias type | Compile-time (tsconfig.paths) | Runtime (_moduleAliases) |
|---|---|---|
| `@europrint/schemas` | `src/shared/db/europrint-compat.ts` | `../../lib/db/dist/cjs` |
| `@common`, `@modules`, `@config` | `src/X/*` | `dist/X` (compiled JS) |
| `@shared/guards` etc. | `src/modules/shared/guards/*` | `dist/modules/shared/guards` |
| `@workspace/db` | `../../lib/db/dist/cjs/index` | **MISSING** — resolved via Node pnpm symlink |
| `@workspace/math-utils` | `../../lib/math-utils/src/index.ts` | **MISSING** — but unused |
| `@/*` | `src/*` | `dist` |

**The `@europrint/schemas` split:** At compile time, `@europrint/schemas` resolves to a 60-line **local file** that re-exports a hand-curated subset (`europrint-compat.ts`). At runtime, it resolves to **the entire `lib/db/dist/cjs` barrel**. The two surfaces are not guaranteed to match — if anyone imports `someSymbol` from `@europrint/schemas` that is exported by `lib/db` but not by `europrint-compat.ts`, TS will reject the import; if anyone imports a symbol re-exported by `europrint-compat` but later renamed in `lib/db`, TS passes but runtime crashes with `undefined`. UNVERIFIED whether drift exists today, but the architecture invites it.

### 4.4 `apps/api/tsconfig.json` — known-bad aliases

Aliases in `paths` that point to non-existent or build-required files:

| Alias | Target | Status |
|---|---|---|
| `@workspace/db` | `../../lib/db/dist/cjs/index` | OK only after build (verified: `dist/cjs/index.d.ts` exists in checked-out tree) |
| `@workspace/db/*` | `../../lib/db/dist/cjs/*` | Same — build-required |
| `@workspace/math-utils` | `../../lib/math-utils/src/index.ts` | File exists, never imported |
| `@europrint/schemas` | `src/shared/db/europrint-compat.ts` | File exists (60 lines) |

No outright broken alias targets verified, but the build-required nature of `@workspace/db` is a fragility (clean checkouts cannot typecheck without first running `pnpm --filter @workspace/db run build`).

### 4.5 `artifacts/erp-dashboard/tsconfig.json`

`artifacts/erp-dashboard/tsconfig.json:1-25`:
```json
{
  "extends": "../../tsconfig.base.json",
  …
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
      "@shared/schema": ["./src/shared-schema.ts"],
      "@assets/*": ["../../attached_assets/*"]
    }
  },
  "references": []
}
```

Aliases are minimal: `@/*`, `@shared/schema`, `@assets/*`. Vite mirrors the first two; `@assets/*` is mirrored at `vite.config.ts:299`.

The `references` array is empty even though both `europrint-site/tsconfig.json` AND `lib/db/tsconfig.json` declare `composite: true`. The dashboard cannot benefit from project-reference incremental builds.

### 4.6 `artifacts/europrint-site/tsconfig.json`

`artifacts/europrint-site/tsconfig.json:17-21`:
```json
"references": [
  { "path": "../../lib/api-client-react" }
]
```

This is a **broken reference** because `lib/api-client-react/` has no `tsconfig.json` (verified: only `lib/db/` has tsconfigs). `tsc --build` against this project would fail.

### 4.7 `artifacts/mockup-sandbox/tsconfig.json`

Standard extends-base config with `@/*` alias.

### 4.8 `lib/db/tsconfig.json` vs `lib/db/tsconfig.cjs.json`

`lib/db/tsconfig.json` extends `../../tsconfig.base.json`, sets `composite: true`, `emitDeclarationOnly: true`, `outDir: dist`, `rootDir: src`. This is what other projects' `references` would target.

`lib/db/tsconfig.cjs.json` does NOT extend the base. Critical setting (`tsconfig.cjs.json:14-21`):
```json
"skipLibCheck": true,
"noImplicitAny": false,
"strictNullChecks": false,
"strict": false,
"allowSyntheticDefaultImports": true,
"esModuleInterop": true,
"experimentalDecorators": true
```

`apps/api` consumes `dist/cjs/index.d.ts` — produced by `tsc -p tsconfig.cjs.json`. The output declarations carry whatever loose typings tsc produced under those relaxed settings. Functions can have implicit `any` returns; nullable surfaces are not modeled. This silently weakens the database type surface as it flows into the API.

---

## 5. Environment configuration

### 5.1 What is on disk vs what is in git

`git ls-files | grep -E '^(\.env|apps/api/\.env|artifacts/erp-dashboard/\.env)'`:
```
.env.example
.env.production.example
apps/api/.env.example
artifacts/erp-dashboard/.env.example
```

`ls -la`:
```
$ROOT/.env                              (1288 bytes, on disk)
$ROOT/.env.example                      (988 bytes, tracked)
$ROOT/.env.production.example           (6075 bytes, tracked)
apps/api/.env                           (3231 bytes, on disk)
apps/api/.env.example                   (4111 bytes, tracked)
artifacts/erp-dashboard/.env.example    (1128 bytes, tracked)
artifacts/erp-dashboard/.env.local      (635 bytes, on disk)
```

`.gitignore:38-44`:
```
# Local env (NEVER commit secrets!)
.env
.env.local
.env.*.local
.env.production
apps/api/.env
apps/api/.env.production
```

Verdict: **the actual `.env` files are correctly gitignored.** Round 1's "SECURITY RISK — committed" claim was incorrect. But the disk files exist on the auditor's machine and contain real (or look-like-real) secrets — see next subsection.

### 5.2 Secrets present on disk

`.env` (`/Uzbek-Language-Module/.env`):
- `JWT_SECRET=INRuYyu2xPUAHxjr5XafMqyxF24m0QUTaPoMD59VzJDcNOmO` (looks like real hex)
- `POSTGRES_PASSWORD=fP1EJqAppsa9vXKmDJdqyxoMmhZSEWzF`
- `JWT_REFRESH_SECRET=gSTOGlAWvyeiqrGNgbpwT9HI4cqd3dMP8wmEsjbgpLkQh2Va`
- `ADMIN_SEED_PASSWORD=aDA5fYbav68xQ15u1RDOUoog`

`apps/api/.env`:
- `JWT_SECRET=local-dev-jwt-secret-please-change-in-prod-x7q9w2-min32chars` (placeholder)
- `ANTHROPIC_API_KEY=***ANTHROPIC-KEY-REMOVED***rojNLUYDGALNItZczoqFfTlnTAU4D_WmZ3V50AOYHTTZ9zw43afJ64x3Aw_ZfAZFHrJTj_lyPZKpyp_Rtw-zJmIDAAA` (**looks real**)
- `YANDEX_API_KEY=***YANDEX-KEY-REMOVED***` (**looks real**)
- `YANDEX_FOLDER_ID=b1gsmsn0lnbfh0pmqpvo`
- `JITSI_APP_ID=vpaas-magic-cookie-54503c57f60b470484f84f4736226c40`

`artifacts/erp-dashboard/.env.local`:
- `VITE_SENTRY_DSN=https://07123ba1953abd72c0da380d08b48f3c@o4510862145814528.ingest.de.sentry.io/4511394235613264` (frontend DSN — semi-public; OK in client bundles)

### 5.3 Real P0 leak: `.replit` is tracked

`.replit:34` (tracked by git):
```
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_Nq7S5FRhXBDk@ep-gentle-night-abiu1cup.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

This is a **plaintext production-grade database URL with credentials in a tracked file**. `.replitignore` does not exclude it. Anyone with read access to the repo (including via past clones, forks, or any leaked copy) has the Neon DB password.

Additionally, `.replit:35`:
```
ALLOWED_ORIGINS = "https://europrinterp.uz,https://www.europrinterp.uz"
```
This pins the production origin in the deployment config — not sensitive but informative.

### 5.4 `.env.example` template quality

`/Uzbek-Language-Module/.env.example` (15 lines) is minimal — covers `JWT_SECRET` and `JWT_REFRESH_SECRET` only. Refers users to `apps/api/.env.example` for the full template.

`apps/api/.env.example` covers DATABASE_URL, JWT, Redis, App, Admin seed, Telegram routing — and contains placeholder strings (e.g. `change-me-min-32-chars-random-string`). Reasonable template.

No `artifacts/erp-dashboard/.env.example` for the Vite-side variables apart from what is in the file — it does cover `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_JITSI_URL`, `PORT`, `NEST_API_URL`, `API_URL`, `BASE_PATH`.

### 5.5 `.env.production.example`

6075 bytes — large enough to look like a real prod template. Not inspected exhaustively but its existence is good practice.

### 5.6 Main bootstrap reads `.env`

`apps/api/src/main.ts:14`:
```ts
import 'dotenv/config';
```

Loaded before `module-alias/register` and before any Nest code. `apps/api/src/main.ts:11-13` justifies this — `@workspace/db` (which is also loaded via reflection) reads `process.env.DATABASE_URL` at import time.

Effect: the CWD when launching the API determines which `.env` is found. Running `node apps/api/dist/main.js` from repo root picks up `$ROOT/.env`; running from `apps/api/` picks up `apps/api/.env`. The two files have different values for shared keys (e.g. JWT_SECRET) — silent precedence.

---

## 6. Containerization & deployment

### 6.1 Two parallel Dockerfiles

The repo has both `Dockerfile` (109 lines) and `Dockerfile.prod` (63 lines). Each is targeted by a different compose file:

| Compose file | Build dockerfile | Container port | Healthcheck path | Purpose |
|---|---|---|---|---|
| `docker-compose.yml` | `Dockerfile` | 3000 | `/health` | Local-prod-like |
| `docker-compose.prod.yml` | `Dockerfile.prod` | 4000 | `/api/health` | Production |
| `docker-compose.test.yml` | (not inspected here) | n/a | n/a | Test runner |

Port and healthcheck path disagree. If both compose files coexist in deploy automation, the healthcheck or port-mapping must be reconciled.

### 6.2 `Dockerfile` (line-by-line highlights)

- Stage 1 `deps` (`Dockerfile:17-46`): Node 20-alpine. Installs `python3 make g++` for bcrypt native compile. Disables husky via `HUSKY=0`. Activates pnpm via corepack. Copies lockfile + all per-workspace `package.json` files manually (cache-friendly), then `pnpm install --frozen-lockfile` with pnpm-store mount.
- Stage 2 `build` (`Dockerfile:49-68`): re-runs `pnpm install` to materialize per-workspace `node_modules/.bin`. Then explicitly orders `lib/db` build before API:
  ```
  RUN pnpm --filter @workspace/db run build && \
      pnpm --filter @europrint/api run build
  ```
  **Frontend is intentionally NOT built** in this image (see `Dockerfile:7-13` header comment — Rollup native binary issues on Alpine musl).
- Stage 3 `runtime` (`Dockerfile:71-109`): minimal Node 20 alpine, postgresql-client (for pg_dump backups), tini for PID-1 signal handling. Non-root user `nodejs` (uid 1001). Copies whole `/app` from build stage to preserve pnpm symlink chains. Trims `apps/api/src`, `apps/api/test`, `artifacts`, `scripts`, `docs`, `.husky`, `.github`. Keeps `lib/*/src` because compiled HR repositories have baked-in relative requires to `../../../../../../lib/db/src` that bypass the `@workspace/db` alias (per the explicit comment at `Dockerfile:91-94`).

The keep-`lib/*/src` workaround is a code-smell flag: there exists API code that does NOT use `@workspace/db` and instead reaches into `lib/db/src` via long relative paths. If those relative requires use TypeScript source files in production, the runtime must support `.ts` resolution — but the image runs plain `node`. UNVERIFIED whether the requires actually load `.ts` or whether they hit `.js` files copied via pnpm into `node_modules/.pnpm/@workspace+db@.../node_modules/@workspace/db/src/` (which would not normally exist).

### 6.3 `Dockerfile.prod`

`Dockerfile.prod:5-29` — single-builder + runtime, builds API AND frontend:
```
RUN pnpm --filter @workspace/db run build || true
RUN pnpm --filter @europrint/api run build
RUN pnpm --filter @workspace/erp-dashboard run build
```

The `|| true` after `lib/db` build silently swallows compile failures — if the DB build fails, the API build still runs and may produce a typecheck-clean but logically-broken binary. P1.

Runtime stage copies dist + node_modules + lib + workspace manifests; uses `wget` for health-check and `tini` for PID 1. Healthcheck path `/api/health` on port 4000.

### 6.4 `.replit`

`/Uzbek-Language-Module/.replit`:

- Modules: `nodejs-20, python-3.11, postgresql-16` (`:1`).
- Port mapping (`:3-30`): localPort 8080 -> 80, 8081 -> 8081, 8082 -> 4200, 19721 -> 3001, 19722 -> 3003, 20806 -> 3000, 20807 -> 3002.
- `userenv.shared` (`:34-35`) contains the leaked Neon URL and ALLOWED_ORIGINS.
- `workflows` (`:41-152`) define two parallel automated endpoint smoke-test workflows (`check-404-endpoints`, `check-500-endpoints`) that POST and GET against ~50 endpoints. These embed real expected-OK fixtures (`crm/rfm/cluster`, `print/imposition`, …) — useful inventory of "endpoints the maintainers consider critical".
- `[deployment].deploymentTarget = "gce"` (`:165-166`).

### 6.5 `ecosystem.config.cjs` — PM2

`ecosystem.config.cjs:16-51` — cluster mode, `instances: 'max'`, `max_memory_restart: '1G'`, log files under `/var/log/europrint/`. `kill_timeout: 30000` and `listen_timeout: 60000` are generous values appropriate for a heavy NestJS bootstrap.

Deploy block (`:57-74`) references a placeholder remote (`europrint-erp-prod-01.internal`) and a `post-deploy` hook that:
```
pnpm --filter @europrint/lib-db run migrate
```
The package `@europrint/lib-db` **does not exist** in the workspace (verified: pnpm filter would yield no matches). The package is `@workspace/db`. The deploy command is broken. P1.

### 6.6 Nginx

`nginx.conf` exists at repo root (not inspected in depth this round — Round 1 covered it). Compose files mount it at `/etc/nginx/nginx.conf:ro`.

---

## 7. Findings summary

### P0 (critical — must fix)

1. **`.replit` leaks a production-grade Neon Postgres URL with password.** File `/Uzbek-Language-Module/.replit:34` is tracked in git. The credential `npg_Nq7S5FRhXBDk` for `neondb_owner` is published to anyone with read access to the repo. Rotate the password, replace `.replit` with a Replit-secrets-backed reference, and audit git history (`git log --all --oneline -p .replit`) for prior values.

### P1 (high — should fix)

2. **`pnpm db:migrate` does not exist as a runnable script.** `package.json:26` runs `pnpm --filter @europrint/api run migrate`, but `apps/api/package.json` has no `migrate` script. The actual migrate command lives at `lib/db/package.json:23` (`drizzle-kit migrate ...`). Root script should be `pnpm --filter @workspace/db run db:migrate`.

3. **`ecosystem.config.cjs` post-deploy filters a non-existent package.** Line 70: `pnpm --filter @europrint/lib-db run migrate` — should be `@workspace/db run db:migrate`. Production deploys via PM2 deploy will silently no-op the migration step.

4. **`lib/db/tsconfig.cjs.json` disables strict mode.** `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` (`tsconfig.cjs.json:14-21`). The CJS output is what `apps/api` consumes — the entire database type surface enters the API with relaxed guarantees. Either set `strict: true` and fix fallout, or extend the base config (which has `strict: true`) and keep only the CJS-output-specific overrides.

5. **Dockerfile.prod silently swallows lib/db build failures.** `Dockerfile.prod:27`: `RUN pnpm --filter @workspace/db run build || true`. If the schema build fails, API build runs anyway. Drop the `|| true`.

6. **`@europrint/schemas` compile-time vs runtime split.** Compile target = 60-line local `europrint-compat.ts`; runtime target = entire `lib/db/dist/cjs` barrel. Drift between the two is silent and only manifests when imports succeed at compile and crash at runtime (or vice versa).

7. **`Dockerfile` vs `Dockerfile.prod` divergence.** Different ports (3000 vs 4000), different healthcheck paths (`/health` vs `/api/health`), different sets of stages, different image trimming policies. Pick one and delete the other.

8. **No `_moduleAliases` entry for `@workspace/db` despite tsconfig alias.** `apps/api/package.json:5-30` defines `_moduleAliases` for every internal path but omits the workspace deps. Runtime resolution depends entirely on pnpm symlinks + Node's default lookup. If pnpm hoisting policy ever changes, the API breaks.

### P2 (medium — clean-up debt)

9. **`@workspace/api-client-react`, `@workspace/api-zod`, `@workspace/api-spec` have zero consumers.** Verified by grep across `apps/api/src/`, `artifacts/*/src/`. Either wire them in or delete the packages.

10. **`@workspace/math-utils` is a dead dependency.** Declared in `apps/api/package.json:83` but no `import … from '@workspace/math-utils'` anywhere in the workspace. Drop the dep or use it.

11. **`@workspace/types` is a phantom dep in erp-dashboard.** Imported at `artifacts/erp-dashboard/src/components/hr/OnboardingRoadmapDialog.types.ts:2` without being declared in `artifacts/erp-dashboard/package.json`. Add the workspace dep.

12. **`artifacts/europrint-site/tsconfig.json` references a non-existent project.** `references: [{ path: "../../lib/api-client-react" }]` (`:17-21`) — but `lib/api-client-react` has no `tsconfig.json`. `tsc --build` would fail.

13. **Duplicate alias `@common/*` vs `@core/*`.** Both map to `src/common/*` (`apps/api/tsconfig.json:15, 32`). Consolidate.

14. **5 aliases for `shared/X/*` and `@shared/X/*` are duplicated** (`apps/api/tsconfig.json:21-30`). Pick one prefix convention.

15. **API uses BOTH `module-alias` AND `tsconfig-paths`** (both in `apps/api/package.json` deps and devDeps). Two competing path-resolver systems coexist. Pick one.

16. **API declares BOTH `bcrypt` AND `bcryptjs`** (`apps/api/package.json:85-86`). Pick one — bcryptjs is pure JS and slower; bcrypt is native and faster but adds a build step.

17. **API declares THREE Jest transformers** (`@swc/jest`, `babel-jest`, `ts-jest`) plus `@nestjs/testing`. Only one is used per Jest config — others are dead deps.

18. **`@types/node: ^20.0.0` in `apps/api/devDependencies:146` conflicts with pnpm catalog `^25.3.3`** (`pnpm-workspace.yaml:32`). API and frontend will pin different `@types/node` versions, causing potential global-type clashes.

19. **`apps/api` direct-pins `zod: ^3.23.8`** (`apps/api/package.json:126`) instead of using `catalog:` (which is 3.25.76). All other workspace packages use catalog. Force consistency.

20. **`pnpm-workspace.yaml:5` includes `lib/integrations/*` glob, but the directory does not exist.** Either remove the glob or create the directory as a tracked placeholder.

21. **`artifacts/api-server/` matches workspace glob but has no `package.json`.** Either promote it to a real workspace or delete the directory.

22. **Root `package.json` and `pnpm-workspace.yaml` both declare `pnpm.overrides`** with overlapping entries (`brace-expansion: ^2.0.1` vs `>=4.0.0`, etc.). Conflict resolution rules in pnpm 9 are deterministic but the duplication is confusing. Consolidate into one place.

23. **Default `pnpm dev:api` skips type-checking.** Root `dev:api` (`package.json:12`) calls `pnpm --filter @europrint/api run dev:unsafe`, which is `nest start --watch` without `--type-check`. The `dev` script (with type-check) exists but is not exposed at the root.

24. **Root `pnpm typecheck` skips `lib/db`, `lib/types`, `europrint-site`, `mockup-sandbox`.** Only api + erp are type-checked. Drift in lib/types or europrint-site goes undetected in CI unless workspace-wide typecheck is added.

25. **Root `pnpm build` (without `:all`) does not build lib/db first.** `package.json:7` runs only the API build. A fresh checkout that ran `pnpm install && pnpm build` would fail with `Cannot find module '@workspace/db'`. Only `pnpm build:all` honors the dependency order.

26. **lib/db migration numbering has gaps.** Active files jump from 0011 to 0016 and from 0016 to 0050. May be intentional after archival, but document the policy to prevent ordering bugs in `drizzle-kit`.

27. **`lib/math-utils` `exports[. ].require` points to a `.ts` file.** If anything ever `require()`s the package under default Node, MODULE_NOT_FOUND or syntax error. Safe today only because no one imports it.

28. **Round 1 reported 54 backend modules, current count is 50.** Drift in the module count between audits suggests modules were merged or removed without changelog. Verify ground truth with `ls apps/api/src/modules/`.

---

**End of Report 01.**
