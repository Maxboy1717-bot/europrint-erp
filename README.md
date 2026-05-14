# EuroPrint ERP

Internal ERP + customer-facing platform for **EuroPrint** — Uzbekistan's №1
industrial printing company.

[![CI](https://github.com/Maxboy1717-bot/europrint-erp/actions/workflows/ci.yml/badge.svg)](https://github.com/Maxboy1717-bot/europrint-erp/actions/workflows/ci.yml)

---

## What's inside

```
apps/api/                  ← NestJS 11 + Fastify backend (TypeScript)
artifacts/erp-dashboard/   ← React 19 + Vite 7 internal dashboard (~947 pages)
artifacts/europrint-site/  ← Public marketing site (europrint.uz)
lib/db/                    ← Drizzle ORM schema (817 tables) + migrations
lib/api-zod/               ← Shared Zod DTOs (server-validated request/response)
lib/api-spec/              ← OpenAPI v3 specification
lib/api-client-react/      ← Auto-generated React Query hooks
lib/math-utils/            ← Shared math helpers
scripts/                   ← Audit reviewers + maintenance scripts (90 .sh files)
contrib/                   ← systemd unit + monitoring (Prometheus/Grafana)
EuroPrint Design System/   ← Brand tokens + UI kit reference
```

---

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Backend | NestJS 11 + Fastify 5 | DDD + CQRS architecture |
| Frontend | React 19 + Vite 7 | Tailwind v4, TanStack Query |
| Database | PostgreSQL 15 | Drizzle ORM (parameterised queries only) |
| Cache / Queue | Redis 7 | BullMQ for background jobs |
| Auth | JWT (Passport) | Helmet + RBAC + SoD + Permission guards |
| i18n | Custom uz/ru loader | 49 namespaces, 13K+ keys |
| Build | pnpm workspaces | TypeScript 5.9 strict mode |
| CI | GitHub Actions | typecheck, lint, test, build, security audit |

---

## Quick start (development)

```bash
# Prereqs: Node ≥20, pnpm ≥9, PostgreSQL 15, Redis 7
git clone https://github.com/Maxboy1717-bot/europrint-erp.git
cd europrint-erp
pnpm install

# 1. Copy env template and fill secrets
cp apps/api/.env.example apps/api/.env
vim apps/api/.env

# 2. Build the schema package (required for API to resolve @workspace/db)
pnpm --filter @workspace/db run build

# 3. Apply migrations
pnpm --filter @workspace/db run db:migrate

# 4. Seed initial admin
ADMIN_SEED_PASSWORD='LocalDev!1' pnpm --filter @europrint/api run seed

# 5. Run backend + frontend (two terminals)
pnpm --filter @europrint/api run dev:unsafe   # API on :3000
pnpm --filter erp-dashboard run dev            # frontend on :5173
```

Open <http://localhost:5173> → login as `admin` / `LocalDev!1`.

---

## Common scripts

```bash
# Type-check both workspaces
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test                                       # all
pnpm --filter @europrint/api run test           # backend only

# Production build
pnpm --filter @workspace/db run build
pnpm --filter @europrint/api run build
pnpm --filter @workspace/erp-dashboard run build

# Run code-quality reviewers (custom static analysis)
bash scripts/run-all-reviewers.sh
```

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Step-by-step production deployment (Docker or PM2) |
| [`MONITORING.md`](./MONITORING.md) | Prometheus + Grafana + alerting setup |
| [`SECURITY.md`](./SECURITY.md) | Vulnerability disclosure policy + built-in protections |
| [`CLAUDE.md`](./CLAUDE.md) | Codebase conventions (16 rules + tooling) |
| `EuroPrint Design System/README.md` | Visual identity, components, page templates |

---

## Architecture highlights

- **DDD per module:** every business domain has `application/` (commands +
  handlers), `domain/` (aggregates + events), `infrastructure/` (repositories),
  `presentation/` (controllers + DTOs).
- **Result pattern:** all repository/service methods return `Promise<Result<T>>`
  — no thrown errors leak through the data access layer.
- **5-layer global guard chain:** ThrottlerGuard → JwtAuthGuard → RolesGuard →
  SodGuard → PermissionGuard. Routes opt out via `@Public()` only.
- **Event-driven cross-module integration:** 39 ERP events propagate via
  `EventEmitter2` (string keys) + `CQRS EventBus` (DomainEvent classes).
- **Zero `raw SQL` injection vectors:** all `sql.raw()` calls take literal
  strings; user input flows through parameterised `sql\`\`` template tags.

---

## Modules (high-level)

| Code | Module | Owner |
|------|--------|-------|
| **SD** | Sales & distribution (CRM, leads, deals, orders) | Sales lead |
| **PP** | Production planning (BOM, MRP, MES) | Production lead |
| **WMS** | Warehouse management (inventory, FIFO/FEFO, ABC) | Warehouse lead |
| **HR** | Human resources (400+ employees, payroll, KPI) | HR lead |
| **FI** | Finance (GL, AP/AR, budgets, cashflow) | CFO |
| **QC** | Quality control (SPC, FMEA, AQL) | Quality lead |
| **POS** | Point of sale (retail + B2B) | Sales floor |
| **MES** | Manufacturing execution (shop floor) | Production lead |
| **IoT** | Cameras + sensors integration | IT |
| **LMS** | Learning management system (training) | HR + L&D |

---

## Contributing

1. Branch from `main`: `git checkout -b feat/<short-name>`
2. Follow [`CLAUDE.md`](./CLAUDE.md) coding rules (Result pattern, Zod
   validation, no `class-validator`, etc.)
3. Run reviewers locally before push: `bash scripts/run-all-reviewers.sh`
4. Open a PR targeting `main`; CI must be green.
5. Two approvals required for changes to `apps/api/src/modules/auth/*`,
   `apps/api/src/common/database/*`, or `.github/workflows/*`.

---

## License

Proprietary — © 2026 EuroPrint LLC. All rights reserved.
Not for redistribution outside the EuroPrint organisation.

---

## Contact

- Repo: <https://github.com/Maxboy1717-bot/europrint-erp>
- Issues: <https://github.com/Maxboy1717-bot/europrint-erp/issues>
- Security: see [`SECURITY.md`](./SECURITY.md)
