# EuroPrint ERP — Backend (`apps/api/src`)

> NestJS backend for EuroPrint, an Uzbekistan-based corrugated/printed packaging
> manufacturer. This document is the onboarding map for new engineers — it tells
> you what lives where, why the architecture is shaped this way, and where to
> read deeper docs for each domain.

## 1. Stack

| Layer            | Tech                                                                 |
|------------------|----------------------------------------------------------------------|
| Runtime          | Node 20+, TypeScript 5 (strict)                                      |
| Framework        | NestJS 10 (modular DI, decorators, CQRS handlers in `application/`)  |
| Database         | PostgreSQL 15 via **Drizzle ORM** (raw SQL only for LATERAL/CTE)     |
| Queue            | BullMQ on Redis (label print, telegram, MRP recalc, PDF gen)         |
| Cache            | Redis with `@Cacheable()` decorator (`common/decorators`)            |
| Validation       | **Zod** only — no `class-validator`                                  |
| Auth             | JWT + refresh tokens, role/permission RBAC                           |
| Telemetry        | OpenTelemetry traces, Pino structured logs                           |

## 2. Top-level layout

```
apps/api/src/
├── main.ts                  Bootstrap, Pino logger, global pipes/filters
├── app.module.ts            Root NestJS module — imports every domain module
├── config/                  ConfigModule schema (NEVER read process.env directly)
├── common/                  Cross-cutting helpers (see §4)
├── shared/                  DB layer, Drizzle schemas, typed-execute, invariants
├── infrastructure/          Redis, mailer, queues, OpenAPI, OTel
├── database/seeds/          Master data + admin seeder
├── cron/                    Scheduled tasks (Nest @Cron) — badge awards, etc.
├── events/                  Cross-module event bus (typed payloads)
├── telegram/                Bot gateway (Director/HR/CRM bots run here)
└── modules/                 57 domain modules — see §3
```

## 3. Domain modules — what each one is for

ERP-standard codes are used:
**HR**=human resources, **FI**=financial accounting, **PP**=production planning,
**MES**=manufacturing execution, **QC**=quality control, **WMS**=warehouse management,
**SD**=sales & distribution, **MRO**=maintenance/repair/ops, **CRM**=customer relationship,
**POS**=point of sale terminals on the shop floor.

### Sales & customer-facing
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `crm/`                       | Leads → deals → won → SO trigger. DDD aggregates + analytics (CLV, RFM)  |
| `sd/`                        | Sales orders, quotations, contracts, deliveries, customer master         |
| `marketing/`                 | Campaigns, leads from website, A/B tests, social inbox                   |
| `website/` + `ecommerce/`    | Public site backend + storefront API                                     |

### Manufacturing
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `pp/`                        | Production planning, **MRP**, capacity (CRP), routing                    |
| `production/`                | Production order lifecycle, sex (shop-floor) load                        |
| `mes/`                       | Real-time execution: downtime, OEE, production sessions, defects         |
| `qc/`                        | Quality control: inspections, SPC, FMEA, reclamations                    |
| `design/`                    | Design-order workflow (prepress → approval → tech-card)                  |
| `mm/`                        | Material management & vendors (bridges PP and WMS)                       |

### Warehouse & inventory
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `wms/`                       | Full WMS: catalog, ABC analysis, EOQ, expiry, turnover, valuation        |
| `pos/`, `pos-v2/`            | POS terminals on the floor — kirim/chiqim, 3-way match, GL posting       |
| `logistics/`                 | Route planning, geo, shipment tracking                                   |

### Finance
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `fi/`                        | GL, AP/AR, depreciation, tax (UZ general/simplified)                     |
| `finance/`                   | CFO dashboard: cashflow, break-even, Altman Z-score, variance            |

### People & maintenance
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `hr/`                        | Employees, attendance, payroll (INPS/JSHD), KPI, recruitment, adaptation |
| `hr-assets/`                 | Assets assigned to employees                                             |
| `lms/`                       | Learning management — courses, tests, certificates                       |
| `mro/`                       | Maintenance, spare parts, utility readings, canteen                      |
| `feedback-360/`              | 360° performance reviews                                                 |

### Cross-cutting / platform
| Module                       | Purpose                                                                  |
|------------------------------|--------------------------------------------------------------------------|
| `auth/`                      | JWT, refresh, roles, permissions, password hashing                       |
| `admin/`                     | Super-admin: users, SaaS tenants, system settings                        |
| `ai/`, `ai-agents/`          | Claude/OpenAI integration, agent audit, decision log, alerts             |
| `agents/`                    | Domain agents (Production, Supplier, IoT, Security, HR-perf)             |
| `iot/`                       | Sensor data, machine telemetry, energy monitoring                        |
| `chat/`                      | Internal messaging (rooms, messages, pins, push)                         |
| `communication-center/`      | Document workflow with multi-step PIN-signed approvals                   |
| `kanban/`                    | Generic kanban boards used across modules (with robot automation)        |
| `notifications/`             | Email/Telegram/push fanout                                               |
| `director/`                  | Director dashboard, AI summary, alerts, problems-of-the-day              |
| `security/`                  | Audit trail, sensitive log scanner                                       |
| `legacy/`, `compatibility/`  | Backwards-compat shims for the pre-DDD API surface                       |
| `integration/`, `sap/`       | External system integrations                                             |
| `bot-gateway/`, `telegram/`  | Telegram bot endpoints (separate from internal chat)                     |
| `org-structure/`             | Departments, positions, ШВБ council hierarchy                            |
| `coordination/`              | Document flow (Доклад/Распоряжение) for ШВБ                              |
| `applications/`              | Internal request/application workflows                                   |
| `core/`, `analytics/`        | Shared dashboards & cross-domain analytics                               |
| `export/`, `storage/`        | Excel/PDF export, file storage                                           |
| `technology/`                | Tech-card definitions                                                    |
| `order-workflow/`            | Order-to-cash multi-step state machine                                   |
| `adaptation/`                | New-employee onboarding plans                                            |
| `camera/`                    | Camera-AI: face attendance, safety violations, machine util              |
| `remaining/`                 | Legacy holding area — being migrated out                                 |
| `queue/`                     | BullMQ processors (label print, email, telegram, PDF, MRP)               |
| `modules/`                   | Module registry (which modules are enabled per tenant)                   |

## 4. Cross-cutting patterns (`common/`)

These are **load-bearing** — used by every domain module. Read these first.

### `common/result.ts` — Result pattern
Every service method returns `Promise<Result<T>>`:
```ts
const r = await this.repo.findUser(id);
if (!r.ok) throw new NotFoundException(r.error.message);
return r.data;
```
Why: avoids thrown exceptions inside business logic, makes failure paths
type-safe, lets controllers translate domain errors to HTTP without try/catch
noise. `safeCall()` wraps third-party code that throws.

### `common/http-result.ts` — Result → HttpException
Maps `AppErrorCode` → HTTP status (e.g. `NOT_FOUND` → 404). Used by
`unwrapOrThrow()` in controllers.

### `common/constants/business.constants.ts` — Single source of truth
KPI weights, tax rates, churn thresholds, discount tiers. NEVER inline these
as magic numbers — the audit script flags it.

### `common/db-rows.ts` + `shared/db/typed-execute.ts`
Type-safe raw SQL execution. Use `typedExecute<RowType>(sql\`...\`)` instead
of `as unknown as { rows: T[] }`.

### `common/decorators/`
- `@Cacheable(ttl)` — Redis-backed memoization
- `@Calculation()` — marks a method as deterministic for batch optimization

### `common/time/`
`TashkentTimeService` — wraps Date with `Asia/Tashkent` timezone. NEVER use
raw `new Date()` for business timestamps (DST drift, server-tz drift).

## 5. Architecture rules (enforced by `scripts/run-all-reviewers.sh`)

All 22 rules live in `ARCHITECTURE_RULES.md` at the repo root. The reviewer
runs in CI and fails the build on violation. Highlights:

| Rule | What it enforces                                                            |
|-----:|------------------------------------------------------------------------------|
|    1 | Every repo/service returns `Promise<Result<T>>` — no thrown errors           |
|    2 | `Array.isArray()` guard before `.map/.filter/.reduce/.forEach/.find`         |
|    3 | All `@Body()` validated with Zod                                             |
|    4 | Raw SQL only for queries Drizzle can't express (LATERAL, CTE) + `// NOTE:`   |
|    7 | `process.env.X` is banned — use `ConfigService.getOrThrow()`                 |
|    8 | Every controller has `@UseGuards(JwtAuthGuard)` or `@Public()`               |
|    9 | DB calls inside repos/services wrapped in `try/catch` or `safeCall()`        |
|   13 | No non-null assertions (`!`) — use optional chaining + fallbacks             |
|   16 | Files under 300 lines (split into `*Types.ts`, `*Sections.tsx`, etc.)        |

## 6. Data layer — `shared/db/`

- `shared/db/schema-*.ts` — Drizzle schema definitions per domain
- `shared/db/index.ts` — exports the connected `db` instance + all schemas
- `shared/db/invariants.ts` — startup DB invariants (FKs, indices, triggers)
- `shared/db/typed-execute.ts` — typed wrapper around `db.execute`
- `database/seeds/` — idempotent seeders run on `pnpm seed`

Migrations live in `apps/api/src/shared/db/migrations/` (raw SQL, not Drizzle
migrate — we control them explicitly).

## 7. Where to read deeper

| Topic                     | Doc                                                                |
|---------------------------|---------------------------------------------------------------------|
| DDD slice for CRM + SD    | `modules/ARCHITECTURE.md`                                           |
| AI module integration     | `modules/ai/ARCHITECTURE.md`, `modules/ai/INTEGRATION.md`           |
| Auth flow + RBAC          | `modules/auth/ARCHITECTURE.md`                                      |
| Core dashboard contracts  | `modules/core/INTEGRATION.md`                                       |
| All 22 architecture rules | `../../../ARCHITECTURE_RULES.md` (repo root)                        |

## 8. Running locally

```bash
# From repo root
pnpm install
pnpm --filter @europrint/api run dev:unsafe   # skips DB invariants check
pnpm --filter @europrint/api run seed         # seed master data + admin

# Reviewers (do this before every PR)
bash scripts/run-all-reviewers.sh
```

Environment variables are documented in `config/` schema files — `pnpm
--filter @europrint/api run config:print` prints the resolved config.

## 9. Common gotchas

- **`db.execute(sql\`...\`)` returns `{ rows }`** — extract `.rows` or use `typedExecute<T>()`.
- **NestJS swallows `Promise.reject` in cron handlers** — log errors explicitly with `.catch(this.logger.error)`.
- **Drizzle does NOT support LATERAL JOIN** — drop to raw SQL and add `// NOTE:` to satisfy the reviewer.
- **The `legacy/` module is _not_ deprecated** — it backs the pre-DDD frontend pages. Read `legacy.service.ts` carefully before touching.
- **Default timezone is UZS/Tashkent**, not UTC. Use `TashkentTimeService` for any user-visible timestamp.
