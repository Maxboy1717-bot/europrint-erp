# EXECUTOR PROMPT #02 — BUILD T1: ORG / KARTALAR (foundation module)
> Foundation is clean (prompt #01 done). Now build the most important module: the card-centric org model.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES (same as #01)
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply: Zod · Drizzle · Result<T> · parametrized SQL · file ≤900/func ≤150 · **no fake (Q-40/43)** · **verify-don't-trust (Q-29)** · **permission gate (Q-28)** · **DDL = owner approval (Q-35, `APPROVED:` comment)** · **no regressions (Q-39)** · `git add <file>` only · commit every step · report after each phase in Uzbek (Q-38) · **NO REWRITE — fix & connect (~70% exists)**.

**Design (mandatory, Q-41/Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (ListPage/FormPage/DetailPage/DashboardPage) — no new design. ORG module color = HR purple family. Fix the 2 known design issues only if you touch them (soft-tints, dark mode) — otherwise leave design to a separate pass.

## 1. WHY THIS MODULE FIRST (Q-40 — the measure of "correct")
ORG/KARTALAR is the **T1 foundation** — every other module links to it (salary, permissions, GSD, AI, training all flow from the card). Vision = card-centric: the CARD is primary, the employee secondary. 1 card = 1 seat = 1 employee; an employee may hold several cards; data **aggregates from cards up to the employee profile**.

**Source of truth (read these, build to them — do NOT invent):**
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → ORG section (the 54 owner answers: EP-ORG-043…142)
- `docs/audit/decisions/01-org-kartalar.md` → full per-question map (143 decisions)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` → org-unit model (Bo'lim→Sex→Uskuna→Ishchi; unit = code+QYM(uz/ru)+camera-zone+Telegram-group-ID; position = level/salary-range/role-ID/folder/KPI/adaptation)
- `docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` → numbering (EP-ORG-### logged) + DoD
- `docs/audit/ERP-SIFAT-STANDARTLARI-2026-06-08.md` → DoD 7 conditions + design

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing ORG/card implementation (READ-ONLY) — FIRST
The org-chart/card model is **partially built** (e.g. `OrgStructureService`, `org_node_portret`, `node_hr_requests`, org-queries, `OrgChartPage.tsx`, employees↔users link). **Do not rebuild.** Map what EXISTS vs what the vision NEEDS:
- Tables: `org_departments`, `org_functions`, positions, razryad/skills, card/node tables — list columns + row counts (`node _audit/q.cjs`).
- BE: existing org endpoints/services/repos (what's real vs stub).
- FE: `OrgChartPage` + card/node pages — what renders, what saves.
- Gap table → `docs/ORG-RE-AUDIT-2026-06-08.md`: feature (from vision) · exists? · gap · effort.
→ **STOP, show owner, get approval before building.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES (each: permission → BE+FE parallel → verify (tsc+DB-proof+FE persist) → DoD → commit → report)

### PHASE 1 — Card data-model + atomic CARD CRUD
- Card = master-data row (position+department), **atomic** (no merge/split — EP-ORG-064/065), **soft-delete** (EP-ORG-005). `card_id NULL` → no login + no salary (EP-ORG-003).
- Org-unit hierarchy **Bo'lim→Sex→Uskuna→Ishchi**; unit fields: code, QYM/ЦКП text (uz/ru), AI-camera-zone, Telegram-group-ID.
- Position fields: level/razryad, salary-range, ERP role-ID, folder-path, KPI-template, adaptation-period.
- CRUD: create/read/update/soft-delete a card; real DB; FE form persists (Q-43).
- ⭐ Org change → ERP roles auto-update; new department → POS warehouse auto-created (CHAT-TARIXI).

### PHASE 2 — Razryad (grades) master-data + card linkage
- Razryad = **configurable master-data** (EP-ORG-009/043/055/056): per level → name+number, min-requirement, salary-band ("dan-gacha"), exam-type, certificate, description. **Shown inside the card, colored by level** (EP-ORG-043).
- Razryad change → HR document + internal certificate (EP-ORG-013). Promotion: exam pass → HR + manager approve (EP-ORG-010). Demotion only on clear cause, AI-suggest → manager-confirm (EP-ORG-134).

### PHASE 3 — GSD/ЦКП + 6-section card folder
- GSD/ЦКП per card: HR writes the definition as text + measure = **SON/FOIZ/VAQT** (EP-ORG-049). Norm in card + per-employee adjustment (EP-ORG-051).
- Card folder = **6 sections** (vazifa / javobgarlik / GSD / reglament / jarayon / ta'lim) + completeness% (EP-ORG-007).
- Statistics auto-fill from formulas (EP-ORG-113); glossary + tooltip (EP-ORG-129).

### PHASE 4 — Exam / certification + per-card AI exam
- Exam = theory test + practical (EP-ORG-046); pass-threshold **configurable** (EP-ORG-055); retake rule **configurable** (EP-ORG-056); question-bank by card-type+razryad (EP-ORG-053).
- Each card has its own AI exam (scenario questions). Certificate list in card + expiry warning 30 days (EP-ORG-047).

### PHASE 5 — Card 8-tab UI (DetailPage template + tabs, ≤2 levels Q-42)
8 tabs (CHAT-TARIXI): **Asosiy · Xodimlar · Farzandlar · Vakant · Papka · Statistika · Portret · Tarix-jurnali**. Each tab real data, real mutations.

### PHASE 6 — Employee ↔ card link + salary → profile aggregation
- Employee↔card many-to-many. ⭐ **Each card shows its FULL salary; the employee PROFILE aggregates all cards' salaries** (EP-ORG-142). Multi-card stavka rule (EP-ORG-066).
- Data (salary, GSD results, ratings) flows card → profile.

### PHASE 7 — Vacancy + i.o. (acting) + glossary + history
- Vacancy: aging (0-14/15-45/45+ EP-ORG-072), priority (EP-ORG-073), SLA (EP-ORG-074), bulk import (EP-ORG-075/076).
- I.o.: dated, auto-reverts (EP-ORG-060); acting salary = own + supplement (EP-ORG-061); acting rights = ops yes / money+HR no (EP-ORG-062).
- Card staleness: last-reviewed date, 1-year reminder (EP-ORG-137).

═══════════════════════════════════════════════════════════════
## DoD per phase (ERP-SIFAT-STANDARTLARI — all 7)
1. BE real (CRUD + Result + Zod + real DB) · 2. FE real (template+token, loading/error, persists) · 3. docs · 4. tests (BE unit + FE) · 5. i18n UZ+RU · 6. all edge-cases · 7. automation (AI/cron/event). Each operation logs its **EP-ORG-### op-code** (LOYIHA-BITGAN §B).

## RAILS
Per-phase: permission gate · BE+FE parallel · verify (tsc 0 + DB-proof + FE persist round-trip) · separate commits · no regressions · no rewrite · honest 501 over fake · DDL = owner approval · report to owner in Uzbek after each phase, then wait for "continue".

## STOP POINTS (ask owner)
- After Phase 0 RE-AUDIT (before any build).
- Before any new table / DDL (Q-35).
- Multi-card salary final formula (EP-ORG-142) — confirm with owner before Phase 6.
- After each phase — show, get "continue".
