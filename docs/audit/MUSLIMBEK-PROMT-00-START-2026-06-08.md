# EXECUTOR KICKOFF PROMPT #00 — START HERE (read this first)
> Give this to Muslimbek FIRST. It tells you WHERE everything is and WHAT to do. 2026-06-08
> Project root: `C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module`

═══════════════════════════════════════════════════════════════
## YOUR ROLE
You are the 🟢 **EXECUTOR** (the only one). You build the EuroPrint ERP **module by module, in order, SEQUENTIALLY**. You write code + commit. The owner (Maxboy) approves each step. Reports to owner in **Uzbek (Latin)**.

⛔ **NO AGENT FLEET. NO parallel massive execution.** One module, one phase at a time (Qoida 23). Read-only analysis subagents are OK, but you alone edit and commit.

═══════════════════════════════════════════════════════════════
## STEP 1 — READ THESE FIRST (orientation, in this order)
All paths under `docs/` (and root `CLAUDE.md`):
1. **`CLAUDE.md`** (root) — code-style rules A/B, 1-23, process Q-24..Q-45.
2. **`docs/agent-constitution.md`** + **`docs/dedup-safety-rules.md`** — methodology + 15 safety rules.
3. **`docs/audit/LOYIHA-QOIDALARI-2026-06-08.md`** — the PROJECT rules (architecture, correctness, 6 cross-cutting principles, security, design, canonical tables). ⭐ This is your rules block.
4. **`docs/audit/MUSLIMBEK-TOLIQ-BUILD-REJA-2026-06-08.md`** — the FULL BUILD PLAN (the ordered roadmap of all 21 modules + the per-module loop). ⭐ Your master plan.
5. **`docs/audit/MUSLIMBEK-PROMT-INDEX-2026-06-08.md`** — index of all 22 build prompts in order.

═══════════════════════════════════════════════════════════════
## STEP 2 — WHERE EVERYTHING IS (the map)
Everything lives in **`docs/audit/`**:

**A) Build prompts (one per module, the spec you execute):**
- `MUSLIMBEK-PROMT-01*` … `MUSLIMBEK-PROMT-22-*.md` (#01 foundation DONE; #02 ORG … #22 POS).
- Order: see `MUSLIMBEK-PROMT-INDEX-2026-06-08.md` and the build plan.

**B) Vision (what the system must do — the measure of "correct", Q-40):**
- `MASTER-SAVOL-JAVOB-2026-06-08.md` — all 2146 module Q&A.
- `OCHIQ-JAVOBLAR-2026-06-08.md` — owner's answers + **overrides** (these override A-defaults) + the 6 cross-cutting principles.
- `OMBOR-KASSIR-INTERVYU-2026-06-08.md` — warehouse / cashier / supply-chain deep vision.
- `CHAT-TARIXI-YANGI-2026-06-08.md` — reyting 7-factor, AI-planning 7-step, gofra 3-formula, production routing, AI-camera.
- `IOT-MES-CURRENT-STATE-2026-06-08.md` — current IoT-tablet/MES build state.
- `decisions/01-org-kartalar.md` … `decisions/20-cc.md` — per-module decision maps.

**C) Implementation detail (HOW to build each feature — your technical answers):**
- `VISION-1000-SAVOL-JAVOB-2026-06-08.md` — **1000 deep Q&A** (50 per module): event vs cron, locks, transactions, rollback, formulas, race-safety. ⭐ Consult your module's 50 answers when implementing.
- Source: `vision-1000-answers/<NN>.md` per module.

**D) Foundation / standards:**
- `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (Definition of Finished + EP-code numbering), `ERP-SIFAT-STANDARTLARI-2026-06-08.md` (DoD-7), `ZIDDIYATLAR-HAL-2026-06-08.md` (9 resolved conflicts).

**E) Read-only DB helper:** `node _audit/q.cjs "SELECT ..."` (never writes).

═══════════════════════════════════════════════════════════════
## STEP 3 — WHAT TO DO (the per-module loop — repeat for #02 → #22)
For EACH module, in order, do exactly this:
1. **Read** its build prompt (`MUSLIMBEK-PROMT-NN-*.md`) + its 50 answers (in `VISION-1000-SAVOL-JAVOB`, that module's section) + its `decisions/NN` + its `OCHIQ-JAVOBLAR` section.
2. **PHASE 0 — RE-AUDIT (read-only):** map what ALREADY exists for this module (tables via `q.cjs`, BE endpoints real vs stub, FE pages) vs the vision. Write `docs/<MODULE>-RE-AUDIT-2026-06-08.md`. **STOP → show the owner → wait for "davom".** (System is ~70% built — fix & connect, NEVER rewrite.)
3. **Build phase-by-phase** (each phase in the prompt): 
   - **Permission (Q-28):** post `file:line` + exact change + reason → owner "ha".
   - **BE + FE in parallel** (both, never one half).
   - **Verify (Q-29/Q-40):** `tsc` 0 + DB-proof (the live query/INSERT resolves with real data) + FE round-trip (enter → save → reopen → persisted).
   - **DoD-7** for the phase (real BE, real FE, doc, test, UZ+RU i18n, edge-cases, automation).
   - **Separate commit** (`git add <exact-file>`; NEVER `-A`). Log the `EP-<MODULE>-###` op-code.
   - **Report to owner in Uzbek** (nima qilindi / DB isboti / tsc / qaysi EP-kodlar / keyingi) → wait "davom".
4. **DDL needed?** → write a migration proposal → owner `APPROVED:` comment → then run (idempotent `IF NOT EXISTS`). Never create tables unilaterally (Q-35).
5. **Module done** = DoD-7 complete + tsc 0 + pre-commit PASS + server 200 (Q-44 restart if 000) + op-codes logged → move to the NEXT prompt.

═══════════════════════════════════════════════════════════════
## ⭐ SELF-VERIFY EVERYTHING — check your OWN work before reporting (owner's explicit rule)
**Whatever you do, you verify it YOURSELF first, then report.** Never report "done" on trust — prove it to yourself, because compiling ≠ working (Q-40):
1. **Re-read your own diff** — does it do EXACTLY what was intended? Any regression, fake data, missed edge-case, wrong canonical table?
2. **`tsc` = 0** + **`bash scripts/run-all-reviewers.sh` = PASS** (Result/Array/Zod/guard/no-stub).
3. **DB-proof** — run the real query/INSERT via `node _audit/q.cjs` (or `BEGIN…ROLLBACK` for writes); confirm REAL data appears, not an assumption.
4. **FE round-trip** — enter → save → reopen the page → confirm it actually persisted (Q-43).
5. **Live probe** — hit the endpoint (or static fallback if `:3030` is down, Q-44); confirm 200 + correct data, no 500.
6. **Be your own strict reviewer** — would a tough reviewer accept this? Check: no fake/echo, no `-A` commit, op-code logged, no regression to existing endpoints. If not perfect → fix BEFORE reporting.
7. Only AFTER all the above pass → report to the owner **with the proof** (the DB count, the tsc result, the probe output). The owner reads your PROOF, not your claim.
⛔ If you can't verify it (server down, unclear) → say so honestly and ask; do NOT claim success.

## HARD RULES (always)
- **Sequential, single executor, NO agent fleet** (Qoida 23).
- **Vision = the measure of correct** (Q-40): if code runs but contradicts `docs/audit/` → it's wrong. Unsure → ASK the owner.
- **No fake** (Q-40/43): real DB persistence; honest 501 if not ready — never a fake "saved/paid".
- **Verify-don't-trust** (Q-29): catalogs are stale until proven live.
- **No rewrite / no regression** (C6/Q-39): fix & connect; what worked must still work.
- **Canonical tables (H):** orders=`sales_orders`, stock=`warehouse_stock`, GL=`entries`; `gl_journal_entries`/`gl_lines` = DON'T TOUCH (SAP #76); no two-world (check existing before creating).
- **Design (Q-41):** EP Linear Soft tokens + existing templates only; no new design.
- **6 cross-cutting principles** apply everywhere: (1) AI flags → human confirms negative effects, (2) card-centric, (3) AI plans orders, (4) operator IoT-tablet, (5) org-chart routing → director, (6) one canonical truth.
- **Security:** RBAC from card (BE-side projection first); no JWT mint; log files never committed.

═══════════════════════════════════════════════════════════════
## ▶️ YOUR FIRST ACTION (right now)
1. Read STEP 1 docs (CLAUDE.md, LOYIHA-QOIDALARI, the build plan, the index).
2. Run the session protocol (Q-24): `git status`, `git log -5`, `git branch`, check `:3030` health.
3. Open **`docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md`** (the first module).
4. Do its **PHASE 0 — RE-AUDIT (read-only)** → write `docs/ORG-RE-AUDIT-2026-06-08.md` → **show the owner and wait for approval**. Do NOT build anything yet.

That's it. Foundation (#01) is already clean. You start the build at #02 ORG, Phase 0. One module at a time, in order, to #22. The owner approves each step.
