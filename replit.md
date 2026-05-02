# EuroPrint ERP — Loyiha Hujjati

## Overview

EuroPrint ERP is a comprehensive Enterprise Resource Planning system designed to manage various aspects of a manufacturing business, from e-commerce and website management to internal communications, production, HR, and logistics. The project aims to consolidate legacy systems into a modern, scalable architecture, primarily migrating from Express.js to NestJS. Key capabilities include real-time chat, robust HR management (including offboarding, gamification, and probation reviews), detailed organizational structure visualization, onboarding roadmap generation, and advanced thermal label printing. The system integrates modules for CRM, sales & distribution, material management, production planning, manufacturing execution, quality control, warehouse management, and IoT monitoring, providing a unified platform for efficient business operations.

## User Preferences

I prefer iterative development with clear, concise communication. When making changes, please explain the "why" behind them, not just the "what." I appreciate detailed explanations of complex changes and potential impacts. Please ask before making major architectural changes or introducing new external dependencies. Do not make changes to the `artifacts/api-server` directory as it contains archived legacy code.

## System Architecture

The EuroPrint ERP system is built as a monorepo, primarily leveraging a microservices-like architecture, currently undergoing a migration from an Express.js backend to a NestJS + Fastify framework.

**Backend:**
- **Core Framework:** NestJS with Fastify adapter (port 8080) — ALL routes now served here. Express migration is COMPLETE.
- **Legacy Backend:** Express.js API server (port 3005) has been fully decommissioned. The `artifacts/api-server` directory is archived and no longer active.
- **Database:** PostgreSQL, accessed via Drizzle ORM. The database schema is extensive, covering over 200 tables across various modules (core, CRM, sales, procurement, inventory, production, HR, IoT, POS, and onboarding). Raw SQL is used via `db.execute()` through `runQuery<T>()` and `rawSql()` helpers. Note: several SD/CRM tables have varchar foreign-key columns that reference integer primary keys (e.g. `sd_leads.manager_id`, `sd_payments.customer_id`); queries use `::integer` casts to compensate.
- **Real-time Communication:** Socket.IO for WebSocket-based internal chat with JWT authentication.
- **Modularity:** The NestJS API is organized into numerous modules (e.g., admin, auth, core, crm, finance, hr, iot, lms, logistics, marketing, mes, mm, mro, notifications, pos, pp, qc, sd, security, wms, ai, remaining).
- **RemainingModule:** Final migration module containing 13 controllers: WasteController, ExceptionLogController, ReportsHubController, SystemController, SystemSettingsController, WeeklyPlanController, MaterialBalanceController, CompanyStateController, FiController, IdealRasmController, ProductionFactsController, OrderStatusController, ThreeWayMatchController.
- **i18n System:** Supports Uzbek (UZ) and Russian (RU) translations across 29 modules.
- **Authentication:** JWT-based authentication with an LRU cache for token revocation.

**Frontend:**
- **Main Dashboard:** React 19 with Vite and shadcn/ui (port 20806) for the ERP dashboard.
- **Public Website:** A separate React application for the public-facing website.
- **UI/UX:** Utilizes shadcn/ui for consistent design components. Org structure visualization uses distinct color schemes for different hierarchy levels and includes features like search, filtering, and PDF export.
- **API Proxying:** The ERP dashboard's Vite configuration proxies `/api/*` requests to the NestJS API (port 8080). Express migration is complete — no more port 3005.

**Sprint 3 — CRM Analytics, Print Industry, Forecast (2026-04-25):**
- Fixed 7 remaining check-500 failures: mes/shifts/current (removed UUID→INT join), mes/maintenance-requests (removed non-existent work_center_id JOIN), qc/reclamations/stats (replaced broken CQRS with direct SQL matching actual `qc_reclamations` schema), reports/kpi-dashboard (fixed `desc(financialKPIs.createdAt)` → `kpiDate`), safety-violations + iot/attendance/live (replaced undefined Drizzle column refs employees.first_name/last_name/department_id with raw SQL literals), warehouse/materials (removed non-existent `is_active`/`barcode` columns from query).
- All 51 check-500 + 18 check-404 endpoints now PASS (0 failures).
- Sprint 3 API (12 endpoints fully working): POST /print/ink-coverage, POST /print/imposition, GET /print/spoilage/:jobId, GET /crm/funnel, GET /crm/cohort, POST /crm/rfm/cluster (K-Means++), POST /crm/churn/retrain, GET /qc/dpmo/:processId, POST /validate/stir, POST /validate/luhn, POST /forecast/:id/croston (Croston TSB), POST /forecast/:id/ensemble.
- Sprint 3 Frontend (6 pages): CrmFunnelAnalytics at /crm/funnel, CrmRfmClusters at /crm/rfm, CrmCohortAnalysis at /crm/cohort, InkCoverageCalculator at /print/ink-coverage, ImpositionCalculator at /print/imposition, ForecastAnalytics at /ai/forecast.
- `ERP_ADMIN_PASSWORD` env var set in development environment for check workflows.

**Sprint 1 — Finance Module (Task #483):**
- Standard Cost service: calculates std_material_uzs, std_labor_uzs, std_overhead_uzs from BOM+routing; stores with product_id FK (INTEGER) + product_name.
- Variance Analysis (5 formulas): MPV, MQV, LRV, LEV, OV with correct types. orderId is INTEGER (serial), ::uuid casts removed. Auto-creates kaizen audit task when variancePct > 20%.
- Break-even service: 400 if productName missing, 404 if no cost_structure data.
- 13-week Cashflow Forecast: day-based horizon with configurable multiplier.
- Financial Ratios (Altman Z-Score): interestCoverage is number|null, X4=0 when totalDebt=0. Auto-flags distress in kaizen when Z < 1.81.
- Tiered Pricing: listTiers and calculatePrice use product_id FK + product_name JOIN.
- DB schema: standard_cost, price_tier, cost_structure all have product_id INTEGER FK + created_by INTEGER FK added via invariants.
- Frontend i18n: FinanceBreakEven.tsx and PricingTiers.tsx use t() for all strings; uz/ru finance.json has unitsSuffix, xSuffix keys.

**Key Features & Implementations:**
- **Ecommerce Module:** Comprehensive CRUD for products, categories, customer orders, and customer management, along with public-facing APIs.
- **Website Module:** Manages settings, pages, banners, portfolios, and news.
- **Internal Chat Module:** Supports direct and group chats, department-based auto-grouping, read/unread badges, real-time messaging, file/image sharing, and typing indicators. Telegram notifications are integrated for new messages.
- **HR V2 Module:** A complete 17-module system covering discipline, gamification, eNPS, PIP, reception, daily reports, skills matrix, document workflows, career paths, shift scheduling, and AI interview sessions. Includes a robust offboarding process with automated checklists and employee blocking.
- **Onboarding & Probation:** Features an automated Onboarding Roadmap Generator (5-phase Gantt-style timeline) and structured 30/90-day Probation Review forms with scored criteria and decision gating.
- **Organizational Structure:** Dynamic hierarchy visualization with detailed node views, including employee lists, sub-departments, vacant positions, statistics, and history.
- **Thermal Label Printing:** Backend support for generating and printing ZPL/EPL/PDF labels via TCP/IP printers. Frontend interface for batch management, barcode generation, scanning, and printer configuration.
- **POS V2 Module:** A fully integrated Point of Sale system with extensive controllers (movements, barcode, requests, inventory count, employees, reports) and shared services for lifecycle blocking and stock reservation.
- **Warehouse Management:** Features batch management, material card handling, barcode generation and scanning, and configuration for thermal label printing.

**Workspace Structure:**
The project follows a monorepo structure with `apps/` for primary applications (e.g., `api`), `lib/` for shared libraries (e.g., `@workspace/db`), and `artifacts/` for various frontends and archived projects.

## External Dependencies

- **PostgreSQL:** Primary relational database.
- **Drizzle ORM:** Object-Relational Mapper for database interaction.
- **NestJS & Fastify:** Backend framework and HTTP server.
- **React & Vite:** Frontend library and build tool.
- **shadcn/ui:** UI component library for the frontend.
- **Socket.IO:** For real-time, bidirectional event-based communication (internal chat).
- **Redis (Optional):** Used for caching, though the API can function in a degraded mode without it.
- **Telegram Bot API:** Used for notifications (e.g., new chat messages, HR offboarding alerts).
- **PDF-lib:** Library for PDF generation (used in label printing).
- **DOMPurify:** For sanitizing HTML and preventing XSS attacks in frontend components.

