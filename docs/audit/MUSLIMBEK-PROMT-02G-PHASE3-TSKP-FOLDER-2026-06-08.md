# EXECUTOR DIRECTIVE #02G — ORG Phase 3: GSD/ЦКП + 6-section card folder (papka)
> Phases 1+2 done + advisor-verified. Now the card's content: ЦКП + the 6-section folder. 2026-06-08

## ✅ Where we are
`org_functions` = canonical card; CRUD + FE + razryad all live and verified. The card already has `tskp` / `tskp_target` / `tskp_measurement_unit` (SON/FOIZ/VAQT) columns. Phase 3 builds the card's CONTENT: the ЦКП definition + a 6-section folder + completeness%.

## 🎯 Phase 3 spec (build prompt #02 §PHASE 3 — build to this, don't invent)
- **GSD/ЦКП per card (EP-ORG-049):** HR writes the definition as text + measure = SON/FOIZ/VAQT. **Reuse the existing `tskp`/`tskp_target`/`tskp_measurement_unit` columns — NO new DDL for ЦКП.** Per-employee norm adjustment (EP-ORG-051) is DEFERRED to Phase 6 (needs the employee↔card link — note it, don't build it now).
- **Card folder = 6 sections (EP-ORG-007):** `vazifa` (task) · `javobgarlik` (responsibility) · `GSD` · `reglament` (regulation) · `jarayon` (process) · `ta'lim` (education). Each is long TEXT. Plus **completeness%** = how many of the 6 are filled.
- **Glossary + tooltip (EP-ORG-129):** short term-definitions shown as tooltips on the section labels.
- **Statistics auto-fill from formulas (EP-ORG-113):** note as a hook; full formula wiring can be a later phase.

## ⚠️ DDL NEEDED → owner approval gate (Q-35) — do this FIRST
The 6 folder sections + completeness don't exist yet. **Recommended model: a `card_folders` table** (1:1 with the card — keeps `org_functions` lean, "folder" is a clean sub-entity):
```
card_folders(
  id serial PK,
  card_id int NOT NULL REFERENCES org_functions(id),   -- 1:1, add UNIQUE(card_id)
  vazifa text, javobgarlik text, gsd text, reglament text, jarayon text, talim text,
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
)
```
(completeness% = computed in the service from the 6 sections, NOT stored — avoids staleness.)
**Steps:** (1) write the migration with `-- APPROVED: owner 2026-06-08` placeholder, (2) **show the final SQL to the owner, wait for "ha"**, (3) run idempotent (`CREATE TABLE IF NOT EXISTS`), (4) DB-proof. If you prefer 6 columns on `org_functions` instead of a table, propose that with a reason — but show the owner either way before running.

## ▶️ BUILD (after DDL approved) — mirror the established card/razryad pattern
1. **BE (Result + Zod + parametrized SQL):** `card-folder.{repository,service,controller}.ts` in `modules/org-structure` (mirror `razryad.*`). Routes `@Controller('org-structure/cards/:cardId/folder')` (or `/card-folders`): GET (by card), PUT/PATCH upsert the 6 sections, GET completeness. ЦКП edit can extend the existing card PATCH (the tskp fields already update via CardRepository) — or add a focused endpoint; don't duplicate. Soft-delete via is_active (no deleted_at — same as razryad). Guards + Roles + Audit like CardController.
2. **completeness%** computed in the service: `filled / 6 * 100` (a section counts as filled if non-empty/non-whitespace).
3. **FE:** card folder UI — 6 editable TEXT sections + ЦКП (definition + target + SON/FOIZ/VAQT measure, reusing the card fields) + a completeness% indicator (progress bar/EPStatusPill) + glossary tooltips on labels. Extend the card detail/form area (FormPage/DetailPage template + EP tokens, Q-41). Real persistence (Q-43 round-trip), onError (F2), loading (F1).
4. **i18n:** UZ+RU+UZ-CYR for the 6 section labels + ЦКП + glossary terms (3-locale parity — same as before).

## ⭐ SELF-VERIFY before reporting
Re-read diff · BE+FE `tsc` 0 + FE build · reviewers PASS · **DB-proof** (upsert folder via BEGIN/ROLLBACK → 6 sections persist; completeness% correct for 0/3/6 filled; ЦКП SON/FOIZ/VAQT saves) · **FE round-trip** (fill sections → save → reopen → persisted; completeness updates) · live probe (routes 401, server 200) · no regression (card CRUD + razryad still work) · be your own strict reviewer (no fake, no `-A`, op-codes logged).

## DoD-7 + op-codes
real BE · real FE · doc · test (folder upsert + completeness calc) · UZ+RU+UZ-CYR i18n · edge-cases (empty folder=0%, all 6=100%, soft-deleted) · automation hook. Log EP-ORG-007 (folder/completeness) · 049 (ЦКП) · 113 (stats hook) · 129 (glossary).

## STOP POINTS
- **Before running the `card_folders` DDL** — show the final SQL, wait for owner "ha" (Q-35).
- After the phase — full report + proof, wait "davom" → then Phase 4 (exam) or card-gate.

## RAILS
DDL only after owner sees the SQL · mirror the card/razryad pattern (no new invention) · reuse tskp columns for ЦКП (no dup) · per-employee norm = Phase 6 (defer) · no regression · EP tokens + templates only · self-verify everything · canonical card stays `org_functions`.
