# EXECUTOR KICKOFF — MASSIVE MODE: one agent executes ALL the remaining build autonomously
> Owner switched to massive single-agent mode (2026-06-13). You run card-gate + #03→#22 yourself, no per-phase owner gate. 2 light rails only.

## 🔄 MODE CHANGE (owner-approved 2026-06-13)
ORG foundation (Phases 1-7) is DONE + advisor-verified. The owner now wants you, **ONE executor (Muslimbek)**, to execute **ALL the remaining work autonomously** — card-gate + modules #03→#22 — **WITHOUT asking owner permission per phase**. You self-verify everything and report **per MODULE** (not per phase).

⛔ Still **NO agent fleet / no parallel massive execution** — you alone edit and commit, sequentially, one module at a time (Qoida 23). "Massive" = less owner gating, NOT parallel agents.

## ✅ THE ONLY 2 RAILS THAT REMAIN (owner-locked — everything else is autonomous)
1. **DDL is shown before running.** Any `CREATE TABLE` / `ALTER TABLE` / migration → write it with `-- APPROVED: owner 2026-06-13`, **post the exact SQL, wait for the owner's "ha", THEN run** (Q-35). DDL is irreversible + infrequent — this is the one place you still pause. (The advisor checks every DDL too.)
2. **The advisor reviews each MODULE** (read-only, after your module-completion report). So at the end of each module, report to the owner in Uzbek with PROOF → the advisor verifies live → then you continue to the next module.

Everything else (per-phase permission, per-phase "davom") is DROPPED — you proceed autonomously.

## ⭐ BECAUSE THERE IS NO PER-PHASE OWNER GATE, YOUR SELF-VERIFICATION IS THE GATE
Self-verify EVERY change before moving on (this is non-negotiable in massive mode):
- Re-read your diff (regression? fake? wrong canonical table? missed edge-case?).
- `tsc` 0 + `bash scripts/run-all-reviewers.sh` PASS.
- **DB-proof** (real query/INSERT via `node _audit/q.cjs` or BEGIN…ROLLBACK — real data, not assumption).
- **FE round-trip** (enter → save → reopen → persisted) where applicable.
- **Live probe** (endpoint 200/401, not 500; restart server if 000 — Q-44).
- Be your own strict reviewer. If not perfect → fix BEFORE continuing. You caught the FORMULA-A double-pay bug yourself — keep that rigor.

## ▶️ ORDER (read #00 START + the build plan; execute in this sequence)
1. **card-gate (EP-ORG-003)** — FINISH ORG. ⚠️ HIGHEST RISK (auth/login/payroll: card_id NULL → no login + no salary; RBAC from card; wire the atomic guard into the assignment flow). **Extra care:** re-audit the login + salary path FIRST; the login path MUST keep working (probe server-up + a real login before AND after); never break auth. Show the advisor before/after. There's a directive to write — if not present, build to build-prompt §EP-ORG-003 + the 6 principles.
2. **#03 golden-thread** — one real order SD→PP→MES→QC→WMS→FIN live (event-driven, acceptance-test green).
3. **#04 SD → #05 PP → #06 MES → #07 QC → #08 WMS → #09 MM → #10 FIN** (T1 core).
4. **#11 HR → #12 DIR → #13 COR → #14 LMS → #15 AI → #16 CC** (T2).
5. **#17 CRM → #18 MKT → #19 KAN → #20 IOT → #21 NTF → #22 POS** (T3).

Per module: read `MUSLIMBEK-PROMT-NN-*.md` + that module's 50 answers in `VISION-1000-SAVOL-JAVOB` + `decisions/NN` + `OCHIQ-JAVOBLAR` (overrides). **Phase 0 re-audit (read-only) first** → build phase-by-phase autonomously → module-end report → advisor review → next.

## HARD RAILS (always — these never drop)
- **No fake (Q-40/43):** real DB persistence; honest 501 / EPComingSoon if not ready — never a fake "saved/paid/0-that-looks-real".
- **Verify-don't-trust (Q-29):** catalogs/claims stale until DB-proven.
- **No regression (Q-39):** what worked must still work; what's deleted stays deleted.
- **Canonical tables:** orders=`sales_orders`, stock=`warehouse_stock`, GL=`entries`/`gl_entries`; `gl_journal_entries`/`gl_lines` = DON'T TOUCH (SAP #76). **C6 one-truth:** check existing infra before creating; NO parallel worlds (like you correctly reused vacancies/certificates/ai-exam — keep doing that; re-audit-first on any module with duplication risk).
- **Design (Q-41):** EP Linear Soft tokens + existing templates (ListPage/FormPage/DetailPage/DashboardPage/BoardPage) only; no new design; no raw hex.
- **Code:** Result<T> + Zod + parametrized SQL (no `sql.raw(var)`); file ≤900/func ≤150.
- **Commits:** separate, `git add <exact-file>` (NEVER `-A`); log EP-`<MODULE>`-### op-codes; **log files NEVER committed** (Q-45).
- **Security:** RBAC from card; no JWT mint; secrets never printed.
- **6 cross-cutting principles** apply everywhere: AI flags→human confirms · card-centric · AI plans orders · operator IoT-tablet · org-chart routing→director · one canonical truth.

## REPORT (per module)
At each module's completion: Uzbek report — what was built (BE+FE), DB-proof, tsc/reviewers, which DDLs (+ owner-approved), EP-codes, anything deferred/ComingSoon (honest), commits. Then the advisor verifies live and you continue. The owner watches module-completion reports; the advisor catches bugs.

## ▶️ START NOW
Restart the server if it's 000 (Q-44). Begin with **card-gate (EP-ORG-003)** — re-audit the auth/salary path first, then build it carefully (login must never break), report + show the advisor, then roll straight into #03→#22 module by module. Go.
