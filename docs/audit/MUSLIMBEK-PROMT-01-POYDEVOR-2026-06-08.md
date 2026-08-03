# EXECUTOR PROMPT #01 — CLEAN FOUNDATION (drift + fake-create + duplicates)
> Owner (Maxboy) approved: clean the foundation BEFORE building any new module.
> Written by advisor (Claude) · Executor = Muslimbek (Claude Code) · 2026-06-08
> Language: English (executor prompts are English; owner-facing reports in Uzbek/Latin).

═══════════════════════════════════════════════════════════════
## 0. ROLE & GROUND RULES

You are the **🟢 EXECUTOR**. You write code and commit. The owner (Maxboy) approves each package. Only ONE executor at a time (Rule 23). If you spawn subagents, they are **READ-ONLY analysis only** — you alone edit and commit (Q-31).

**Read before starting** (Q-24): `CLAUDE.md`, `docs/agent-constitution.md`, `docs/dedup-safety-rules.md`, `docs/modules/INDEX.md`.

**Hard rules (non-negotiable):**
- **Style:** TypeScript strict · validation = **Zod** only · DB = **Drizzle ORM** (raw SQL only for LATERAL/complex, with comment) · errors = **Result<T>** pattern (no `throw`, no `return null`) · file ≤ 900 lines, function ≤ 150 lines · constants from `apps/api/src/common/constants/business.constants.ts`.
- **Security (Rule A/B):** NEVER `sql.raw(variable)` — parametrized only. No hardcoded passwords/JWT secrets. No JWT minting (Q-30).
- **No fake (Q-40/Q-43):** every form/endpoint must do a REAL DB INSERT/UPDATE. `return {ok:true}`, echo, `[] as unknown` = FORBIDDEN. If the table genuinely does not exist → honest `501 NOT_IMPLEMENTED`, never a fake "saved/paid" flag.
- **Verify-don't-trust (Q-29):** treat every audit/catalog claim as STALE until you confirm it LIVE against code + DB. Use read-only DB helper: `node _audit/q.cjs "SELECT ..."`. Probe `:3030` endpoints live (or static fallback if server is down — Q-44).
- **Permission gate (Q-28):** before ANY change, post `file:line` + exact change + reason, and get the owner's explicit "yes".
- **DDL gate (Q-35):** new `CREATE TABLE` / migration ONLY with owner approval (add `APPROVED:` comment in the migration file).
- **No regressions (Q-39):** whatever worked before MUST still work after your change (prove it).
- **Reports (Q-38):** after each package, show the owner: done / deferred / commit hashes — in **Uzbek (Latin)**.
- **Git:** `git add <exact-file>` only — NEVER `git add -A`/`git add .`. Commit at every step. No `git stash`. End commit messages with the Co-Authored-By trailer if configured.
- **Branch:** work on `chore/schema-convergence` (de-facto main). Pull/check `git status` + `git log -5` first (Q-24).
- **Environment (Q-44):** if `:3030` returns 000 after a big rebuild, it's the Windows `nest watch` tree-kill bug (env, not your code) — restart with `pnpm --filter @europrint/api run dev:unsafe`, don't panic; verify via static fallback (typecheck + rollback-tx DB-proof).

**Goal of this prompt:** Before building new modules, clean the foundation along three axes — (1) **DRIFT** (code expects a column/table name that differs from the live DB), (2) **FAKE-CREATE** (form says "saved" but nothing hits the DB), (3) **DUPLICATES** ("two worlds" — two tables/flows for one concept).

⛔ **DO NOT REWRITE.** The system is ~70% functional. Only **fix and connect**. Full rewrites are forbidden (Q-39). The measure of "correct" is the vision in `docs/audit/` (Q-40) — if code runs but contradicts the vision, it's wrong.

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT (READ-ONLY) — DO THIS FIRST, THEN STOP FOR APPROVAL

The existing catalogs (`status1/2/3-*`, `xato1/2-*`, `default-loss-audit-*`, `yashirin-xatolar-*`) are likely **STALE** — much was already fixed in the DRIFT-NN sprint, Two-Worlds Phase 1+2, the 4-P0 sprint, and PAKET 1-4. **Do not blindly apply them.**

For EACH suspected item below, confirm the LIVE state before touching anything:

```bash
# Column existence (example: does material_cards.name exist, or is it xom_ashyo?)
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='material_cards' ORDER BY 1"
# Table existence (example: gl_journal_lines)
node _audit/q.cjs "SELECT to_regclass('public.gl_journal_lines')"
# Row counts (is it empty = build stage, or has data)
node _audit/q.cjs "SELECT count(*) FROM warehouse_stock"
```

Then probe the endpoint live (if `:3030` is up):
```bash
# get a token first (login), then:
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3030/api/finance/gl | head
```

**Write the result to** `docs/POYDEVOR-RE-AUDIT-2026-06-08.md` as a table:
`| item | file:line | live state (STILL BROKEN / ALREADY FIXED) | proposed fix | effort |`

**Suspected items to verify (from memory — confirm each, many may already be fixed):**

### DRIFT — Group B (column name mismatch)
| Code expects | DB actually has | Impact / files |
|---|---|---|
| `material_cards.name` | `xom_ashyo` | 8+ files, 15+ queries — erp/production-facts, production-plans, daily-reports. Fix once via `xom_ashyo AS name` alias or code. |
| `warehouse_stock.material_card_id` | `material_id` | 10+ files, WMS broken |
| `mes_sessions.start_time / end_time / pp_order_id` | `started_at / completed_at / production_order_id` | MES sessions 500 |
| `erp_daily_reports.work_center_id` (+ shift, planned_qty) | missing | INSERT/SELECT 500 |
| `erp_downtime_logs.work_center_id / duration_minutes / reported_by` | `machine_id / duration_min` | name+column drift |
| `mes_shift_handovers.incoming_supervisor` | `received_by` | mes/shifts 503 |
| `mes_maintenance_requests.assigned_to / work_center_id` | missing | mes/maintenance 503 |
| `wms_transactions.deleted_at` | missing | wms/transactions 503 |
| `production_orders.customer_name / due_date` | missing | INSERT 500 |
| `internal_requests.material_card_id / from_warehouse_id` | `material_id / warehouse_id` | name drift |

### DRIFT — Group A (table missing → CREATE, needs owner approval Q-35)
- `gl_journal_lines` (finance/gl, finance/ratios 503) — ⚠️ BUT first check "two worlds": canonical GL is `entries`/`gl_entries`; do NOT create a competing table without confirming.
- `mes_downtime_events`, `warehouse_stock_balance` — verify they're truly used and truly missing.

### DRIFT — Group C (FK type uuid↔int)
- `mes_sessions.work_center_id` (uuid) ↔ `work_centers.id` (int) → safe `::text` cast.
- `wms_transactions` ↔ `mm_materials.id` (uuid↔int).

→ **STOP. Show `POYDEVOR-RE-AUDIT-2026-06-08.md` to the owner. Get approval before fixing.** (Fixing before analysis is forbidden.)

═══════════════════════════════════════════════════════════════
## PACKAGES (owner approves each separately — Q-38)

### 🅰️ PACKAGE A — DRIFT (only items RE-AUDIT confirmed still broken)
- **Group B (column drift):** prefer **code/alias** fix (`xom_ashyo AS name`) over ALTER when the DB column already has the data. Where a column is genuinely missing → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent, owner-approved).
- **Group A (table missing):** before `CREATE TABLE`, run the **"two worlds" check** — is there already a table for this concept under another name? If yes, USE THE EXISTING ONE. Only create if truly absent + owner-approved (`APPROVED:` comment).
- **Group C (FK type):** safe `::text` cast in the join/where, no data migration.
- **Per item:** verify (`tsc` 0 + DB-proof: endpoint returns 200 with REAL data) + SEPARATE commit per item.

### 🅱️ PACKAGE B — FAKE-CREATE (remaining)
- The original 18-item fake-create list had #1-4 fixed in PAKET 4 (inventory-counts, asset-inventory, insurance, GRN lines). **Use RE-AUDIT to find the REMAINING ones** → convert each to a real INSERT/UPDATE into the table the FE GET reads from (the #1 lesson: write to the table the frontend actually reads).
- Known fake patterns to hunt: `chat.controller.ts:307,315,369` (`return {ok:true}`), `wms-integration.controller.ts:60,66,88` (`return {data:[]}`), `sd-customers.controller.ts:111,152,184,204` (`return {}`).
- If the table genuinely doesn't exist (e.g., vendor-invoice payment) → honest **501**, never a fake "paid" flag.
- **Verify (Q-43):** enter → save → reopen page → confirm it persisted.

### 🅲️ PACKAGE C — DUPLICATES ("two worlds")
- **2 lead tables:** `crm_leads` ╳ `sd_leads` → merge into one (owner picks canonical).
- **2 order worlds:** `sd_sales_orders` (VIEW over `sales_orders`) ╳ `sales_orders` ╳ `orders`. Canonical = **`sales_orders`**. `orders` was already DROPPED (commit 024e2b11). Build the SD↔sales_orders bridge if missing.
- **Canonical stock = `warehouse_stock`** (conflict #8). `current_stock` is a VIEW over it. `stocks` = **KEEP** (it holds batch/expiry for the cardboard warehouse — owner D3).
- **Canonical GL = `entries` / `gl_entries`.** ⚠️ `gl_journal_entries` + `gl_lines` have ACTIVE writers (finance/payroll repos) → **DO NOT TOUCH** them now; they migrate in the SAP audit #76.
- Other dups to canonicalize/shim: `chat` ╳ `hr-v2`, POS prefix tables, `camera`, `kpi` ╳ `kpis`. Follow `docs/dedup-safety-rules.md` (15 rules — no cyclic shims, one-way re-export only).

═══════════════════════════════════════════════════════════════
## DELIVERABLE (definition of "clean foundation")
- ✅ 0 fake-create (every form persists for real — Q-43)
- ✅ 0 open 503/500 drift (the RE-AUDIT-confirmed set)
- ✅ Duplicates canonicalized (one source of truth)
- ✅ BE `tsc` 0 · FE `tsc` 0 · pre-commit PASS · a commit at every step
- ✅ `POYDEVOR-RE-AUDIT-2026-06-08.md` + a final status report (Uzbek) listing done/deferred/commits
→ Next prompt: **#02 — Build T1 ORG/KARTALAR** (vision ready: `OCHIQ-JAVOBLAR` + `decisions/01-org-kartalar.md`).

═══════════════════════════════════════════════════════════════
## SOURCE OF TRUTH (the vision = the measure of "correct", Q-40)
Under `docs/audit/`: `OCHIQ-JAVOBLAR-2026-06-08.md` · `OMBOR-KASSIR-INTERVYU-2026-06-08.md` · `CHAT-TARIXI-YANGI-2026-06-08.md` · `IOT-MES-CURRENT-STATE-2026-06-08.md` · `MASTER-SAVOL-JAVOB-2026-06-08.md` · `decisions/01-20*.md`.
If code runs but contradicts the vision → it's wrong. When unsure → ASK the owner (never assume).

═══════════════════════════════════════════════════════════════
## WORKFLOW SUMMARY (the loop)
1. Phase 0 RE-AUDIT (read-only) → write report → **show owner, get approval**.
2. Package A (drift) → per-item: permission → fix → verify (tsc + DB-proof) → commit → report.
3. Package B (fake-create) → same loop.
4. Package C (duplicates) → same loop.
5. Final report (Uzbek) → hand back to advisor for prompt #02 (ORG build).
Never skip the permission gate. Never fix before the RE-AUDIT is approved. Never rewrite.
