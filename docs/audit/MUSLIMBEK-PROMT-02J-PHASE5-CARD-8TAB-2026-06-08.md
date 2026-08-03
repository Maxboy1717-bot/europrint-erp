# EXECUTOR DIRECTIVE #02J — ORG Phase 5: card 8-tab detail UI (consolidation, mostly FE)
> Phases 1-4 done + advisor-verified. Phase 5 = the unified card detail page. Reuse what you built. 2026-06-08

## ✅ Where we are
The card (`org_functions`) has: CRUD + razryad + 6-section folder + ЦКП + per-card AI exam — all live and verified, each via its own dialog (CardFormDialog, CardFolderDialog, CardExamsDialog). Phase 5 consolidates them into ONE card **detail page with 8 tabs** (DetailPage template).

## 🎯 Phase 5 spec (build prompt #02 §PHASE 5)
A card DetailPage (`/org-structure/cards/:id`) with **8 flat tabs (≤2 levels, Q-42)**, each REAL data, real mutations where it edits — NO fake (Q-40/43):
1. **Asosiy** — card core fields (GET `/cards/:id`); edit reuses CardFormDialog.
2. **Xodimlar** — employees on this card (real: `employees WHERE org_function_id = :id` — there's likely an existing endpoint; reuse it, else a thin GET). Show who occupies the seat.
3. **Farzandlar** — child cards. **Determine the model first:** `org_functions WHERE manager_id = :id` (the parent-card link added in Phase 1) is the likely source — confirm in your mini-audit. If no children, empty state.
4. **Vakant** — vacancy view (cards/seats with `status='vacant'` for this unit/dept). If the vacancy model isn't built yet → honest EPComingSoon, NOT fake.
5. **Papka** — the 6-section folder + completeness% (reuse CardFolderDialog content / GET `/cards/:cardId/folder`, Phase 3).
6. **Statistika** — the card's stats: completeness%, AI-exam attempts (reuse `/ai-exam/by-card/:id`, Phase 4), razryad. Real numbers only.
7. **Portret** — `org_node_portret` (the existing Portret wizard/data — reuse it; per memory it persists). If a piece is still 501 (getNodeHistory) → honest, not fake.
8. **Tarix-jurnali** — card change history. **Source check:** is there a real history/audit source for the card? If yes, wire it; if not → honest EPComingSoon (do NOT fabricate history).

## ▶️ STEP 1 — mini-audit (read-only, quick): map each tab's data source
Before building, list per tab: data source (endpoint/table) · exists? · reuse-or-ComingSoon. Especially Farzandlar (manager_id?), Vakant, Tarix (real source?). Show the owner this 1-page map if any tab has NO real source (so we agree on ComingSoon vs build). Small/quick — then proceed.

## ▶️ STEP 2 — build the DetailPage
- **DetailPage template + EP tokens** (Q-41) — no new design. Tabs flat (one level, 8 tabs — Q-42 OK). Route `/org-structure/cards/:id` in HR_ROUTES; open from the OrgCards row (a "Ko'rish/Detal" action) — keep the existing row actions (Papka/Imtihon) working or fold them into the detail tabs (your call, but no regression Q-39).
- **Each tab REAL:** wire to the real endpoint; **reuse** the dialogs/queries you already built (don't duplicate the logic). Loading (F1) + error states per tab.
- **Edit mutations** where the tab edits (Asosiy, Papka) — real persist, round-trip (Q-43). Read-only tabs (Xodimlar/Statistika/Tarix) just display real data.
- **Honest incomplete:** any tab without a real backend → `EPComingSoon`, never fake data (Q-40). List which tabs are ComingSoon in the report.

## ⭐ SELF-VERIFY + DoD-7
FE tsc 0 + FE build · each REAL tab: the endpoint returns real data (DB-proof or live probe) · round-trip on the editable tabs · no regression (OrgCards list + the 3 dialogs + all prior endpoints still work) · be your own strict reviewer (no fake tab, no `-A`). DoD: real FE, doc, i18n UZ+RU+UZ-CYR for the 8 tab labels + any new strings (3-locale parity), edge-cases (card with 0 employees / no folder / no exams → graceful empty), op-codes (EP-ORG-007 folder, 142-prep). Report which tabs are real vs ComingSoon.

## COMMIT + REPORT
Separate commit(s) (`git add <file>`, never `-A`). Report in Uzbek WITH PROOF (which tabs real + their data source, which ComingSoon + why) → wait "davom" → Phase 6 (employee↔card + salary — owner will confirm the EP-ORG-142 formula first).

## RAILS
DetailPage template + EP tokens only · tabs ≤2 levels (Q-42) · REUSE your Phase 1-4 dialogs/queries (no duplication) · honest ComingSoon over fake (Q-40) · no regression (Q-39) · canonical card stays `org_functions` · self-verify everything.

## STOP POINTS
- After the tab-source mini-audit IF any tab lacks a real source (agree ComingSoon vs build).
- After the phase — report (real vs ComingSoon tabs + proof), wait "davom".
