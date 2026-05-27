# 01 — Monorepo Architecture Analysis

**Project:** EuroPrint ERP  
**Audit date:** 2026-05-27  
**Auditor:** Forensic analysis agent (read-only)  
**Monorepo root:** `Uzbek-Language-Module/` (referred to as `$ROOT` throughout)

---

## 1. Repository Layout

```
$ROOT/
├── apps/
│   └── api/                    # NestJS backend (Fastify platform)
├── artifacts/
│   ├── erp-dashboard/          # React 19 + Vite ERP SPA
│   ├── europrint-site/         # Marketing/public website (React + Vite)
│   └── mockup-sandbox/         # UI mockup playground
├── lib/
│   ├── api-client-react/       # Shared TanStack Query API client
│   ├── api-spec/               # OpenAPI spec + Orval codegen
│   ├── api-zod/                # Shared Zod validation schemas
│   ├── db/                     # Drizzle ORM schema + migrations (@workspace/db)
│   ├── math-utils/             # Financial math utilities
│   └── types/                  # Canonical shared TypeScript types
├── scripts/                    # Audit and tooling scripts (@workspace/scripts)
├── scripts.backup/             # Archive of historical audit/fix scripts
├── docs/                       # Analysis output directory
├── package.json                # Workspace root (private, @europrint/workspace v2.0.0)
├── pnpm-workspace.yaml         # pnpm workspace config; defines globs + version catalog
├── tsconfig.base.json          # Shared TS compiler base
├── eslint.config.js            # Root ESLint flat config
├── docker-compose.yml          # Local dev compose
├── docker-compose.prod.yml     # Production compose
├── docker-compose.test.yml     # Test compose
├── nginx.conf                  # Nginx reverse-proxy config
├── Dockerfile / Dockerfile.prod
├── ecosystem.config.cjs        # PM2 process config
├── .env                        # Root env (committed — SECURITY RISK — contents not read)
├── .env.example
└── .env.production.example
```

**Source:** `$ROOT/package.json`, `$ROOT/pnpm-workspace.yaml`, filesystem enumeration.

---

## 2. Package Inventory

| Package | Path | Role | Key Dependencies | Notes |
|---|---|---|---|---|
| `@europrint/workspace` | `$ROOT/` | Monorepo root (private) | husky, lint-staged, prettier, eslint | v2.0.0; orchestrates all pnpm filters |
| `@europrint/api` | `apps/api/` | NestJS REST + WebSocket backend | NestJS 11, Fastify 5, Drizzle ORM, Passport-JWT, BullMQ, Socket.io, nestjs-i18n, Anthropic SDK, OpenAI, Sentry | v2.0.0; uses `module-alias` for runtime path aliases |
| `@workspace/erp-dashboard` | `artifacts/erp-dashboard/` | ERP SPA (main product UI) | React 19, Vite 7, TanStack Query 5, Wouter 3, Zustand 5, Tailwind 4, Radix UI, Framer Motion, Leaflet, DnD-kit, jsPDF, Dexie (IndexedDB), Socket.io-client | PWA-enabled; Sentry integration; Vitest + Playwright |
| `@workspace/europrint-site` | `artifacts/europrint-site/` | Marketing / public website | React 19, Vite 7, Tailwind 4, Wouter | Shares `@workspace/api-client-react` |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox/` | UI component playground | React 19, Vite 7, Radix UI full set, Recharts | No workspace lib deps; standalone |
| `@workspace/api-client-react` | `lib/api-client-react/` | HTTP fetch wrapper + TanStack Query hooks | `@tanstack/react-query` | Exported as `./src/index.ts` (no build step) |
| `@workspace/api-spec` | `lib/api-spec/` | OpenAPI spec + Orval codegen config | orval | No runtime exports; dev tooling only |
| `@workspace/api-zod` | `lib/api-zod/` | Shared Zod schemas (request/response) | zod (catalog) | ESM only; `./src/index.ts` direct |
| `@workspace/db` | `lib/db/` | Drizzle schema + migrations + DB client | drizzle-orm, drizzle-zod, pg, zod | Built to `dist/cjs/`; dual export (import->src, require->dist) |
| `@workspace/math-utils` | `lib/math-utils/` | Financial/decimal math helpers | (none declared) | No build step; direct TS source import |
| `@workspace/types` | `lib/types/` | Canonical shared TS types | (none declared) | No build step; `./src/index.ts` + wildcard `./src/*.ts` |
| `@workspace/scripts` | `scripts/` | Audit automation | tsx | Dev-only; 14 named audit scripts |

**Source:** all `package.json` files enumerated in section 3 below.

---

## 3. Build & Config Files

### 3.1 Root-level

| File | Purpose |
|---|---|
| `$ROOT/tsconfig.base.json` | Shared compiler options: `target: ES2022`, `module: esnext`, `moduleResolution: bundler`, `strictNullChecks`, `noImplicitAny`, `customConditions: ["workspace"]` |
| `$ROOT/pnpm-workspace.yaml` | Workspace globs: `apps/*`, `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`; version catalog for 30+ shared deps (React 19.1.0, Vite 7.3.2, Zod 3.25.76, Drizzle 0.45.2, etc.) |
| `$ROOT/package.json` | Root scripts: `build`, `dev:api`, `dev:erp`, `typecheck`, `lint`, `test`, `db:migrate`; lint-staged hooks |
| `$ROOT/eslint.config.js` | Flat ESLint config for TS + React hooks |
| `$ROOT/.env` | Root .env committed to repo — SECURITY RISK (contents not read) |
| `$ROOT/.env.example` | Template |
| `$ROOT/.env.production.example` | Production template |
| `$ROOT/docker-compose.yml` | Local dev: api + postgres + redis services |
| `$ROOT/docker-compose.prod.yml` | Production compose |
| `$ROOT/docker-compose.test.yml` | Test compose |
| `$ROOT/nginx.conf` | Reverse proxy: serves `/erp-dashboard/` -> Vite build, proxies `/api/` -> NestJS:3030 |
| `$ROOT/ecosystem.config.cjs` | PM2 process manager config |
| `$ROOT/Dockerfile` / `Dockerfile.prod` | Container build |

### 3.2 apps/api

| File | Purpose |
|---|---|
| `apps/api/tsconfig.json` | `module: commonjs`, `target: ES2021`, `outDir: ./dist`, `baseUrl: ./`, extensive `paths` aliases (see section 4) |
| `apps/api/nest-cli.json` | Builder: `swc`; assets: `i18n/**/*.json` copied to dist; Swagger introspection enabled |
| `apps/api/.env` | Per-package env committed — SECURITY RISK (contents not read) |
| `apps/api/.env.example` | Template |
| `apps/api/package.json` | `_moduleAliases` for runtime resolution (module-alias library) |

### 3.3 artifacts/erp-dashboard

| File | Purpose |
|---|---|
| `artifacts/erp-dashboard/vite.config.ts` | Vite 7 config; aliases `@` -> `src/`, `@shared/schema` -> `src/shared-schema.ts`; dev proxy `/api/*` -> NestJS `:3030`; PWA manifest (uz locale, POS offline); Sentry source-maps (conditional); custom `pos-auth-direct` middleware plugin |
| `artifacts/erp-dashboard/tsconfig.json` | Extends root base; path alias `@` -> `src/` |
| `artifacts/erp-dashboard/.env.example` | FE env template |
| `artifacts/erp-dashboard/.env.local` | Local env committed — UNVERIFIED sensitivity (contents not read) |
| `artifacts/erp-dashboard/vitest.config.ts` | Unit test config |

### 3.4 lib/db

| File | Purpose |
|---|---|
| `lib/db/drizzle.config.ts` | `schema: ./src/schema/index.ts`, `out: ./drizzle`, `dialect: postgresql`; requires `DATABASE_URL` env |
| `lib/db/tsconfig.json` | Source TS config |
| `lib/db/tsconfig.cjs.json` | CJS build output config (`outDir: dist/cjs/`) |
| `lib/db/drizzle/` | Migration SQL files (see section 5) |

**Source:** `apps/api/tsconfig.json`, `apps/api/nest-cli.json`, `artifacts/erp-dashboard/vite.config.ts`, `lib/db/drizzle.config.ts`.

---

## 4. Module Resolution

### 4.1 `@workspace/db` — how it resolves

**At build time (TypeScript in apps/api):**
`apps/api/tsconfig.json` -> `"@workspace/db": ["../../lib/db/dist/cjs/index"]`
This means the API compiles against the **built CJS output** of `lib/db`. If `lib/db` is not built first, TS compilation in `apps/api` will fail.

**At runtime (Node.js in apps/api):**
`apps/api/package.json` -> `"_moduleAliases": { "@workspace/db": "../../lib/db/dist/cjs" }`
Runtime module-alias library maps the require path to the same CJS dist.

**In lib/db/package.json:**
```json
"exports": {
  ".": {
    "import": "./src/index.ts",
    "require": "./dist/cjs/index.js",
    "types": "./dist/cjs/index.d.ts"
  }
}
```
The `"workspace"` customCondition (in `tsconfig.base.json`) lets ESM consumers import the raw TypeScript source directly. However, `erp-dashboard` does NOT declare `@workspace/db` as a dependency — it uses `@workspace/api-client-react` instead. The direct DB dependency is the API only.

### 4.2 `@europrint/schemas` — stub vs canonical

`apps/api/tsconfig.json` paths:
```
"@europrint/schemas": ["src/shared/db/europrint-compat.ts"]
```
`apps/api/package.json` _moduleAliases:
```
"@europrint/schemas": "../../lib/db/dist/cjs"
```
**Split:** At compile time, `@europrint/schemas` resolves to a **local compat shim** (`src/shared/db/europrint-compat.ts`). At runtime, it resolves to the `lib/db` CJS dist. This is a known discrepancy — the compat file likely re-exports a subset of the canonical schema. UNVERIFIED whether they are in sync.

### 4.3 `@workspace/math-utils` runtime alias gap

`apps/api/tsconfig.json`: `"@workspace/math-utils": ["../../lib/math-utils/src/index.ts"]`
`apps/api/package.json` _moduleAliases: **no entry for math-utils**.
Risk: If any code requires it at runtime (vs. compile-time inline by SWC), it will throw MODULE_NOT_FOUND. The package has no build step and no `dist/`.

### 4.4 Frontend path aliases (vite.config.ts)

```
"@"              -> artifacts/erp-dashboard/src/
"@shared/schema" -> artifacts/erp-dashboard/src/shared-schema.ts
"@assets"        -> attached_assets/ (two levels up from erp-dashboard)
```

### 4.5 Backend internal path aliases (apps/api/tsconfig.json)

| Alias | Maps to |
|---|---|
| `@common/*` | `src/common/*` |
| `@modules/*` | `src/modules/*` |
| `@config/*` | `src/config/*` |
| `@shared/db` | `src/shared/db/index.ts` |
| `@shared/guards/*` | `src/modules/shared/guards/*` |
| `@shared/decorators/*` | `src/modules/shared/decorators/*` |
| `@shared/interceptors/*` | `src/modules/shared/interceptors/*` |
| `@shared/infrastructure/*` | `src/modules/shared/infrastructure/*` |
| `@shared/domain/*` | `src/modules/shared/domain/*` |
| `@auth/*` | `src/modules/auth/*` |
| `@/*` | `src/*` |
| `@europrint/schemas` | `src/shared/db/europrint-compat.ts` (compile-time only) |
| `@workspace/math-utils` | `../../lib/math-utils/src/index.ts` |
| `@workspace/db` | `../../lib/db/dist/cjs/index` |

**Source:** `apps/api/tsconfig.json` lines 13-39, `apps/api/package.json` `_moduleAliases`.

---

## 5. Source File Counts

All counts exclude `node_modules/`, `dist/`, `.cache/`.

| Metric | Count | Source command |
|---|---|---|
| Total TS/TSX files (whole monorepo) | **16,238** | `find $ROOT -name "*.ts" -o -name "*.tsx" \| wc -l` |
| `apps/api/src` — `.ts` files | **2,532** | `find apps/api/src -name "*.ts" \| wc -l` |
| `artifacts/erp-dashboard/src` — `.tsx` files | **1,983** | `find erp-dashboard/src -name "*.tsx" \| wc -l` |
| `artifacts/erp-dashboard/src` — `.ts` files | **517** | `find erp-dashboard/src -name "*.ts" \| wc -l` |
| Backend controllers (`*.controller.ts`) | **338** | `find apps/api/src -name "*.controller.ts" \| wc -l` |
| Backend services (`*.service.ts`) | **504** | `find apps/api/src -name "*.service.ts" \| wc -l` |
| Backend repositories (`*.repository.ts`) | **228** | `find apps/api/src -name "*.repository.ts" \| wc -l` |
| Backend NestJS modules (`*.module.ts`) | **62** | `find apps/api/src -name "*.module.ts" \| wc -l` |
| Drizzle table definitions (`pgTable(` calls) | **684** | `grep -r "pgTable(" lib/db/src/schema \| wc -l` |
| DB schema TS files | **128** | `find lib/db/src/schema -name "*.ts" \| wc -l` |
| DB migration SQL files (active, excl. archive) | **14** | `find lib/db/drizzle -name "*.sql" ! -path "*/archive/*" \| wc -l` |
| Frontend page components (non-test `.tsx`) | **947** | `find erp-dashboard/src/pages -name "*.tsx" ! -name "*.smoke.test.tsx" ! -name "*.test.tsx" \| wc -l` |
| Frontend smoke test files | **275** | `find erp-dashboard/src/pages -name "*.smoke.test.tsx" \| wc -l` |
| Frontend route group files | **12** | `ls erp-dashboard/src/routes/*.tsx` |
| Frontend i18n locale files per language (uz/ru) | **56 each** | `ls erp-dashboard/src/locales/uz/ \| wc -l` |
| Backend i18n namespace files per language | **6 per locale** | `ls apps/api/src/i18n/uz/` |
| Backend cron jobs | **38** | `ls apps/api/src/cron/*.cron.ts` |

**Notable ratio:** 338 controllers / 504 services = 1 controller per 1.49 services on average. The `compatibility` module alone has 30 controllers and 39 services, suggesting significant legacy shim accumulation.

The total of 16,238 TS/TSX files includes root-level audit scripts and `scripts.backup/`. True application source: api (2,532) + erp-dashboard (2,500) + lib packages (~800) = ~5,800 files. The remaining ~10,400 are tooling, audit, and backup scripts.

---

## 6. Backend Module Map (`apps/api/src/modules/`)

Total: **54 top-level module directories** (2026-05-27).

| Module | Controllers | Services | Repositories | Purpose |
|---|---|---|---|---|
| `admin` | 5 | 7 | 1 | System administration, queue management, user admin |
| `agents` | 1 | 17 | 0 | AI agent orchestration (facilities, marketing, production, quality, security, strategic, supplier) |
| `ai` | 15 | 25 | 6 | AI feature suite: automation, CRM-AI, director-AI, exam-AI, finance-AI, HR-AI, marketing-AI, planning, reservation, WMS-AI, forecasting (ensemble + Nelder-Mead), insights |
| `ai-agents` | 1 | 8 | 0 | Higher-level AI agent coordination layer |
| `aisha` | 3 | 6 | 0 | "Aisha" conversational AI assistant (ERP-native chatbot) |
| `applications` | 0 | 1 | 1 | HR job application intake |
| `auth` | 3 | 7 | 2 | JWT auth, OTP sessions, role/permission management, me-permissions endpoint |
| `bot-gateway` | 1 | 0 | 0 | Telegram bot gateway |
| `camera` | 0 | 1 | 0 | Camera device management stub |
| `chat` | 6 | 10 | 8 | Internal real-time chat with file upload, WebSocket gateway |
| `common` | 1 | 4 | 0 | Shared validators, Drizzle service, Sprint 3 migration helper |
| `communication-center` | 6 | 10 | 0 | Communication hub: AI, baskets, documents, notification prefs, public CC |
| `compatibility` | 30 | 39 | 1 | **Legacy compat shims** — largest by controller count; wraps old EuroPrint API shapes |
| `core` | 1 | 2 | 2 | Core enterprise features, panels controller |
| `crm` | 15 | 27 | 30 | Full CRM: contacts, deals, pipelines, activities, AI-CRM, companies, follow-ups, custom fields, Bitrix compat, ELO rating, comms |
| `design` | 2 | 3 | 2 | Design workflow, file library |
| `director` | 12 | 13 | 16 | Director dashboard, approvals, coordination, kaizen, OKR, strategic planning, ZNO/ZVS reporting |
| `ecommerce` | 6 | 2 | 2 | E-commerce: catalog, customers, orders, public storefront, website |
| `erp` | 4 | 4 | 4 | Legacy ERP core: orders, products, reports, camera integration |
| `export` | 1 | 1 | 1 | Data export (Excel/PDF) |
| `feedback-360` | 0 | 1 | 0 | 360-degree employee feedback |
| `fi` | 0 | 1 | 0 | Financial instruments stub |
| `finance` | 31 | 31 | 6 | Full finance suite: AP, AR, budgets, cashflow, cashflow forecast, CFO config, invoices, payments, ratios, standard cost, variance, GL, order costing, pricing, financial reports, break-even, accounting |
| `general` | 3 | 2 | 0 | General/legacy controller aggregator |
| `hr` | 40 | 65 | 28 | **Largest module**: attendance (face recognition), career paths, daily reports, document workflow, inspection, KPI, onboarding, onboarding checklists, overtime, payroll, reception, recruitment (stats, offers), safety, shifts, skills matrix, Telegram HR bots, transfers |
| `hr-assets` | 0 | 2 | 0 | HR asset management |
| `integration` | 5 | 3 | 1 | External integrations: employee sync, MRO, SAP |
| `iot` | 12 | 10 | 3 | IoT: cameras, camera AI, alerts, dashboard, heatmaps, face recognition, sensors |
| `kanban` | 8 | 6 | 1 | Kanban boards, cards, checklists, file attachments, templates |
| `legacy` | 3 | 2 | 0 | Explicit legacy module (deprecated API routes) |
| `lms` | 11 | 11 | 0 | Learning Management System: courses, exams, knowledge base, certificates, tests |
| `logistics` | 1 | 5 | 1 | Logistics routing (geo + route services) |
| `marketing` | 4 | 3 | 2 | Marketing campaigns, marketing AI |
| `mes` | 5 | 6 | 2 | Manufacturing Execution System: work orders, maintenance, production sessions, shift stats |
| `mm` | 7 | 7 | 8 | Materials Management: materials, vendors, purchase orders, dashboard |
| `mro` | 1 | 2 | 1 | Maintenance, Repair, Operations |
| `notifications` | 1 | 7 | 3 | Push notifications, notification preferences, outbox pattern |
| `order-workflow` | 1 | 0 | 0 | Order workflow orchestration |
| `org-structure` | 1 | 3 | 3 | Organizational structure, position folders, department tree |
| `pos` | 21 | 52 | 40 | **Point of Sale**: auth, audit, events, GL posting log, goods receipt, inventory passport, movement status, notifications, printer config, requests, sync, Telegram POS, warehouse employees, write-offs; offline/PWA support |
| `pos-v2` | 4 | 0 | 0 | POS v2 stub controllers — not yet implemented |
| `pp` | 10 | 21 | 8 | Production Planning: BOM, production orders, routings, work centers, equipment, planning, technology schema |
| `qc` | 9 | 13 | 11 | Quality Control: defects, parameters, inspections, QC review, extended QC |
| `queue` | 0 | 1 | 0 | Queue management service |
| `remaining` | 12 | 12 | 11 | Legacy aggregator: company state, exception log, ideal images, material balance, order status, production facts, system, waste, weekly plans |
| `sd` | 10 | 9 | 9 | Sales and Distribution: dashboard, leads, payments, quotations |
| `security` | 2 | 3 | 3 | Security operations: access control, attendance security, RACI matrix |
| `shared` | 0 | 2 | 1 | Shared services: events (outbox), shared domain |
| `storage` | 1 | 0 | 0 | File storage (Google Cloud Storage integration) |
| `wms` | 22 | 22 | 7 | Warehouse Management System: inventory materials, IoT-enhanced WMS, warehouse rental, cycle counting, extended WMS |

**Also in `apps/api/src/` (not under modules/):**
- `cron/` — 38 scheduled cron jobs: absence-block, advance-reminder, ai-interview, attendance-check, backup-database, badge-award, birthday, boomerang-hire, budget-alert, candidate-archive, cert-expiry, cleanup-old-logs, credit-check, currency-rates, daily-report, daily-report-deadline, discipline, enps, eoq-safety-stock-refresh, fp-cycle, iot-data-cleanup, kanban-recurring, kpi-calculate, late-arrival-fine, manager-daily-routine, monthly-card-dispatch, operator-hourly-invoice, overdue-po, reference-image-compare, reminder-send, report-generate, retention, stock-alert, vacancy-deadline, warehouse-rental
- `shared/` — cross-cutting infrastructure: db, decorators, domain, guards, interceptors, result pattern, utils
- `common/` — global guards (JWT, Roles, SOD, Permission), interceptors (Audit, ResultUnwrap, TenantContext), cache, time utils
- `config/` — database, JWT, Redis config factories
- `database/` — seed scripts
- `i18n/` — locale JSON files (uz, ru, uz-cyr) with 6 namespaces: auth, common, errors, messages, telegram, validation
- `infrastructure/` — infrastructure layer
- `events/` — domain event definitions
- `generated/` — auto-generated files

**Source:** `apps/api/src/modules/` directory enumeration; per-module file counts via `find`.

---

## 7. Frontend Structure (`artifacts/erp-dashboard/src/`)

| Directory | TS/TSX Files | Purpose |
|---|---|---|
| `pages/` | 1,461 total (947 components + 275 smoke tests + misc) | All route-mapped page components; domain sub-folders: `accountant/`, `agents/`, `ai-planning/`, `chat/`, `employee-profile/`, `erp/`, `qc/`, `wms/`, and ~30 others |
| `components/` | 723 | Reusable UI components: `ui/` (Shadcn/Radix primitives), `ep/` (EuroPrint design tokens), domain components (`crm/`, `hr/`, `finance/`, `wms/`, `kanban/`, `pos/`, `mes/`, `orders/`, `camera-ai/`, `chat/`) |
| `routes/` | 14 | Route group files using Wouter: `AppRouter.tsx`, `HRRoutes.tsx`, `FinanceRoutes.tsx`, `ProductionRoutes.tsx`, `WarehouseRoutes.tsx`, `DirectorRoutes.tsx`, `CRMRoutes.tsx`, `CameraRoutes.tsx`, `AnalyticsRoutes.tsx`, `AdminRoutes.tsx`, `StubRoutes.tsx`, `ModuleGroup.tsx` |
| `hooks/` | 99 | Custom React hooks: `use-auth.ts`, 12 HR hooks (`use-hr*.ts`), `use-lms.ts`, `use-pos-offline.ts`, `use-safety.ts`, `usePermissions.ts`, `useErpOfflineSync.ts`, `useWarehousePosSync.ts` |
| `lib/` | 87 | Utilities and API clients: `api/` (domain-specific fetch modules for admin, ai, auth, camera, chat, crm, director, erp, finance, inventory, lms, mes, mm, operations, pos, pp, qc, routes, sd, wms), `apiBase.ts`, `i18n/`, `permissions.ts`, `roleRoutes.ts`, `business-logic.ts` |
| `locales/` | 0 (dirs) | i18n JSON files in `uz/` and `ru/` sub-dirs — 56 namespace files each |
| `pos-monitor/` | 85 | Standalone POS monitor sub-application (separate entry point at `/pos-monitor`) |
| `erp-modern-ui/` | 4 | Modern UI shell: `AppShellModern`, `ErpThemeProvider` |
| `aisha/` | 2 | Aisha AI assistant frontend integration |
| `camera-ai-modern/` | 10 | Modern camera AI UI module |
| `store/` | 1 | Zustand global store |
| `types/` | 6 | Frontend-local TypeScript type definitions |
| `constants/` | 1 | App-wide constants |
| `test/` | 4 | Test utilities and setup |

**Top-level files:**
- `App.tsx` — root component; handles auth routing, special routes (IoT tablet, AI interview public, Telegram mini-app, POS monitor, chat full-screen)
- `main.tsx` — Vite entry point
- `shared-schema.ts` — shared schema re-exports for frontend
- `index.css` — global styles

**Route architecture:** Uses `wouter` (not React Router). Routes are split into domain group files. `AppRouter.tsx` composes all route groups. Public routes (AI interview, HRC test, OTP verify, IoT tablet, Telegram mini-app, POS monitor) are handled directly in `App.tsx` before the authenticated shell renders.

**i18n architecture:** 56 namespace JSON files per language (uz/ru), all bundled at build time via static imports in `lib/i18n/loader.ts`. No dynamic loading. Default language: `uz`. Supported: `['uz', 'ru']`. Frontend namespaces (defined in `lib/i18n/constants.ts`): common, auth, dashboard, hr, finance, production, warehouse, wms, crm, lms, settings, errors, validation, marketing, navigation, public, sd, mes, kanban, director, security, notifications, iot, admin, mro, design, logistics, pos, ai, aisha, coordination, print, plus 24 sub-namespaces (barcode, calc, contact, footer, glPosting, inventory, ledger, lowstock, movements, myInventory, nav, qc, offline, qcreview, quarantine, reports, requests, variance, etc.).

**Source:** `artifacts/erp-dashboard/src/` directory listing, `App.tsx`, `lib/i18n/constants.ts`, `lib/i18n/loader.ts`.

---

## 8. Inter-Package Dependency Graph (ASCII)

Direction: consumer --> dependency

```
+------------------------------------------------------------------+
|                      WORKSPACE ROOT                              |
|                   @europrint/workspace                           |
+---------------------------+--------------------------------------+
                            |  pnpm workspace orchestration
         +------------------+-------------------+
         v                  v                   v
+---------------+  +------------------+  +------------------+
| @europrint/   |  | @workspace/      |  | @workspace/      |
|     api       |  |  erp-dashboard   |  | europrint-site   |
| (NestJS BE)   |  |  (React ERP SPA) |  | (marketing site) |
+-------+-------+  +--------+---------+  +--------+---------+
        |                   |                     |
        |          +--------+                     |
        |          |           +-----------------+
        |          v           v
        |  +--------------------------+
        |  |  @workspace/             |
        |  |   api-client-react       |
        |  |  (TanStack Query hooks)  |
        |  +--------------------------+
        |
        +----------------------------------+
        v                                  v
+------------------+            +------------------+
|  @workspace/db   |            | @workspace/      |
| (Drizzle schema  |            |  math-utils      |
|  + migrations)   |            | (financial math) |
+--------+---------+            +------------------+
         |
         v
   +------------+
   | PostgreSQL  |
   | (runtime)  |
   +------------+


@workspace/api-zod        --> (no workspace deps; zod only)
@workspace/api-spec       --> (no runtime deps; orval codegen only)
@workspace/types          --> (no deps; raw TS source)
@workspace/scripts        --> (tsx only; audit tooling)
@workspace/mockup-sandbox --> (no workspace deps; standalone)
```

**Dependency declarations (verified from package.json files):**

| Consumer | Declared Workspace Dep | Mechanism |
|---|---|---|
| `@europrint/api` | `@workspace/db` | `workspace:*` in dependencies |
| `@europrint/api` | `@workspace/math-utils` | `workspace:*` in dependencies |
| `@workspace/erp-dashboard` | `@workspace/api-client-react` | `workspace:*` in devDependencies |
| `@workspace/europrint-site` | `@workspace/api-client-react` | `workspace:*` in devDependencies |
| `@workspace/api-client-react` | `@tanstack/react-query` | catalog |

**Not declared but used at compile-time (alias-only):**
- `@europrint/api` references `@europrint/schemas` -> resolved to local compat shim (not a separate package)
- `@workspace/types` and `@workspace/api-zod` may be consumed via paths/aliases without package.json declarations -- UNVERIFIED

**Source:** all package.json files, `apps/api/tsconfig.json` paths section.

---

## Summary

The EuroPrint ERP monorepo is a large, mature production system built on a pnpm workspace with 12 packages. Architecture in brief:

**Backend**: NestJS 11 on Fastify 5, structured into 54 domain modules. 338 controllers, 504 services, 228 repositories, 62 NestJS modules, 38 cron jobs. The `compatibility` module (30 ctrl / 39 svc) is the largest single module and accumulates legacy shim code. The `hr` module (40/65/28) and `pos` module (21/52/40) are the most complex domain modules. All feature modules are registered in `feature-modules.ts` and composed in `app.module.ts`.

**Database**: Drizzle ORM with PostgreSQL. 128 schema files defining 684 tables across all ERP domains. 14 active SQL migration files in `lib/db/drizzle/`. Schema is owned exclusively by `@workspace/db`; the API accesses it via built CJS output.

**Frontend**: React 19 SPA with Vite 7, Wouter routing, TanStack Query, Zustand, and a PWA manifest for POS offline mode. 947 non-test page components organized into 11 route groups. 56 i18n namespace files per language (uz/ru), all bundled at build time. Smoke tests (275 files) co-located with page components in `src/pages/`.

**i18n**: Backend uses nestjs-i18n with 3 locales (uz, ru, uz-cyr) and 6 namespaces each. Frontend has a custom in-memory loader with 56 namespaces per language. Default language is Uzbek (`uz`).

**Build pipeline**: API uses `@swc/core` (via `nest build`). Frontend uses Vite 7 + esbuild. `lib/db` must be built before `apps/api` can typecheck. `lib/math-utils` and `lib/types` have no build step.

---

## Open Questions / UNVERIFIED

1. **`.env` committed at root and `apps/api/.env`** -- Files `/Uzbek-Language-Module/.env` and `apps/api/.env` exist and are not `.example` files. Contents were NOT read to avoid exposing secrets. Must be audited for committed credentials (DATABASE_URL, JWT_SECRET, API keys for Anthropic/OpenAI/Sentry/Telegram).

2. **`@europrint/schemas` compile-time vs runtime split** -- `src/shared/db/europrint-compat.ts` (compile-time) must be compared against `lib/db/dist/cjs/index.js` (runtime) to verify identical type signatures. Drift here causes silent runtime type mismatches.

3. **`@workspace/math-utils` runtime alias gap** -- No `_moduleAliases` entry exists for math-utils in `apps/api/package.json`. If compiled `dist/` code does `require('@workspace/math-utils')` at runtime, it will throw MODULE_NOT_FOUND. Verify all math-utils consumers are compile-time-only (inlined by SWC).

4. **`@workspace/types` and `@workspace/api-zod` usage in erp-dashboard** -- Not declared in `erp-dashboard/package.json` devDependencies. May be consumed via relative imports. Full import graph analysis required to confirm no phantom dependencies.

5. **16,238 total TS/TSX file count** -- Inflated by root-level audit scripts and `scripts.backup/` contents. True application source is approximately 5,800 files. The ~10,400 remainder are tooling, audit, and one-off fix scripts never cleaned up.

6. **`pos-v2` module** -- Has 4 controllers but 0 services and 0 repositories. Scaffolded but not implemented. Unclear if it is registered in `feature-modules.ts`.

7. **`lib/db/drizzle/archive/`** -- Contains `0002_special_joshua_kane.sql` superseded by `0002_recruitment_funnel_refs_offers.sql`. Verify drizzle-kit does not load the archive directory.

8. **Duplicate `db:migrate` scripts** -- `lib/db/package.json` has its own `db:migrate` and `$ROOT/package.json` has `db:migrate` delegating to `apps/api`. Unclear which is authoritative; must be kept in sync.

9. **`artifacts/erp-dashboard/.env.local` committed** -- Exists on disk (not `.example`). Contents not read; may contain sensitive local API URLs or tokens.

10. **`compatibility` module maintenance debt** -- 30 controllers + 39 services is the highest controller count of any module. No clear ownership or deprecation timeline documented. Long-term maintenance liability as features migrate to canonical modules.
