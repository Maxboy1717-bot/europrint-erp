# EXECUTOR DIRECTIVE #02F — ORG Phase 2: razryad master-data (BE CRUD + UI)
> Phase 1 (card model + CRUD + FE) is done + advisor-verified (6-lens, commit 09a16ae0). Now razryad. 2026-06-08

## ✅ Where we are
Phase 1 closed: `org_functions` = canonical card, BE CRUD + FE card UI live and verified (real persistence, contract-aligned, no fake). The card form has a `razryadLevelId` dropdown — but `razryad_levels` is an EMPTY table (created in the Phase-1 migration, no rows, no UI). Phase 2 builds the razryad master-data so cards can actually be graded.

## 🎯 Vision (consult VISION-1000 ORG answers + OCHIQ-JAVOBLAR + decisions/01-org-kartalar)
Razryad = configurable competency GRADE (daraja). Each level: requirement → growth → salary. A card references a razryad; the razryad sets the expected salary band + exam/certificate. razryad→talab→o'sish→oylik. This is master-data the owner manages (like a catalog), not per-employee.

## ▶️ PHASE 2 — razryad CRUD (extend org-structure, mirror the card pattern you just built)
**No rewrite — mirror `card.{repository,service,controller}.ts` + `OrgCards.tsx`/`CardFormDialog.tsx` exactly (same patterns, same EP components).**

1. **BE (Result + Zod + parametrized SQL, mirror CardRepository):** new `razryad.{repository,service,controller}.ts` in `modules/org-structure`, registered in the module.
   - Table `razryad_levels` columns (already exist — NO new DDL): `id, level (UNIQUE), name, min_requirement, salary_min, salary_max, exam_type, certificate, description, is_active, created_at, updated_at`.
   - Routes `@Controller('org-structure/razryad-levels')`: GET list (filter is_active), GET :id (404), POST create, PATCH :id, DELETE :id.
   - **Soft-delete = `is_active = false`** (the table has `is_active`, NOT `deleted_at`) → NO new DDL. Reads default to `is_active = true` (with an `?all=true` to show archived). This avoids a migration (Q-35).
   - **UNIQUE(level)** — on duplicate level, return a clean Result error (the controller maps to 409/400 + FE toast), never a raw 500.
   - Same guards as CardController (`@UseGuards(JwtAuthGuard)` + `@Roles(...)` + AuditInterceptor).

2. **FE (mirror OrgCards + CardFormDialog):** `pages/RazryadLevels.tsx` (list: EPLoader/EPErrorState/EPEmptyState + table + DeleteConfirmDialog) + `components/hr/org/RazryadFormDialog.tsx` (create/edit → POST/PATCH, invalidateQueries round-trip, onError toast). Route in HR_ROUTES + sidebar entry near "Kartalar". EP tokens + existing components only (Q-41) — no new design.

3. **Wire the card form dropdown:** in `CardFormDialog.tsx`, make the `razryadLevelId` field a real `<Select>` fetching `useQuery(['/api/org-structure/razryad-levels'])` (currently it's empty/placeholder). Now creating a card can pick a real grade. (Q-39: don't break the existing card form — extend the one field.)

4. **i18n:** UZ + RU + UZ-CYR keys for all new labels (keep 3-locale parity — your card keys held parity; do the same).

## ⭐ SELF-VERIFY before reporting (each task)
Re-read diff · FE `tsc` 0 + FE `build` (catches broken imports) · BE `tsc` 0 + `run-all-reviewers` PASS · **DB-proof** (create a razryad via BEGIN/ROLLBACK → row appears with the right level; duplicate level → unique violation surfaced as a clean error; is_active=false hides it from default list) · **FE round-trip** (the card form's razryad dropdown now lists the grades you created) · live probe (routes 401-guarded, server 200) · be your own strict reviewer (no fake, no `-A`, op-code logged, no regression to the card CRUD/UI).

## DoD-7
real BE · real FE · doc note · a test (razryad service + unique-level guard) · UZ+RU+UZ-CYR i18n · edge-cases (duplicate level, is_active filter, empty list) · the card-form dropdown wired.

## COMMIT + REPORT
Separate commit per task (`git add <exact-file>`, never `-A`). Log EP-ORG op-codes (EP-ORG-009 razryad create, 043 razryad master, 008 card↔razryad link). Report to owner in Uzbek WITH PROOF → wait "davom" → then card-gate (EP-ORG-003) or Phase 3.

## RAILS
Mirror the card pattern (don't invent new) · NO new DDL (use is_active for soft-delete) · no regression (card CRUD/UI keeps working) · honest 501 over fake · EP tokens + existing templates only · self-verify everything · canonical card stays `org_functions`.

## (Trivial, optional — not a blocker) i18n nit
The global `"saqlash"` (Save) key is identical "Saqlash" in all 3 locales (should be ru="Сохранить", uz-cyr="Сақлаш"). Pre-existing app-wide, not yours — if you touch the locale files anyway, fix it in passing (one line, improves every Save button). Skip if not.
