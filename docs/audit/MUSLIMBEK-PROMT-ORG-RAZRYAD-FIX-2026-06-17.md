# DIRECTIVE — ORG fix: razryad INSIDE Org Tuzilma; remove the separate Kartalar/Razryadlar pages

> Advisor (Claude) → Executor (Muslimbek). Owner-approved 2026-06-17. The owner explicitly said: razryad must
> live INSIDE the Org Structure (Tashkiliy Tuzilma) — there must be NO separate "Kartalar"/"Razryadlar" pages.
> The current build violates this. Fix it. Source vision: the card-centric org model (each card carries
> lavozim+dept+razryad+darslik+oylik+ЦКП). Advisor-verified facts below.

## RULES BLOCK
- EXECUTOR (🟢). Do EXACTLY this; no extra scope. `git add <exact-file>` only. No logs committed.
- This is FE-only + sidebar; NO DDL expected (the data model is already correct — see below). If you think DDL is
  needed, STOP and show SQL. Don't touch payroll/GL.
- Q-39 no-regression: Org Tuzilma (org-structure/hierarchy) must keep working; whatever you remove must not break it.

## ADVISOR-VERIFIED FACTS (don't re-derive)
- The canonical card table `org_functions` ALREADY has `razryad_level_id` (FK) + `level` (int). So razryad is
  already part of the card at the data level — this is a UI/navigation fix, NOT a schema change.
- `razryad_levels` = the grade catalog (currently 0 rows).
- The WRONG separate pieces (to fix), all under sidebar group tz11 "Xodimlar" → TASHKILOT
  (`artifacts/erp-dashboard/src/components/sidebar/constants.ts:402-403`):
  - `{ title: "Kartalar", url: "org-structure/cards" }` → page `pages/OrgCards.tsx`
  - `{ title: "Razryadlar", url: "org-structure/razryad-levels" }` → page `pages/RazryadLevels.tsx`
  - plus `pages/CardDetail.tsx`
- The page to KEEP + enrich: "Org Tuzilma" → `org-structure/hierarchy` (the org chart in the owner's screenshot).

## FIX (razryad belongs INSIDE Org Tuzilma)
1. **Remove the two sidebar entries** `Kartalar` (org-structure/cards) and `Razryadlar` (org-structure/razryad-levels)
   from constants.ts:402-403 (canonical sidebar source). Run `node scripts/check-sidebar-routes.mjs` after.
2. **Show razryad ON the org card** in the Org Tuzilma hierarchy: each card displays its razryad (e.g. a small
   badge/label like "Razryad 4") sourced from `org_functions.razryad_level_id` / `level`. Use the existing card
   component + EP tokens (Qoida 21) — no bespoke design.
3. **Assign razryad in the card detail/edit** (within Org Tuzilma): when you open/edit a node's card, razryad is a
   selectable field (dropdown of razryad_levels). The card detail must live INSIDE the Org Tuzilma flow — not a
   separate top-level route. (Reuse the logic from CardDetail.tsx if useful, but as part of Org Tuzilma, not a
   standalone sidebar page.)
4. **Razryad catalog (the grade list 1..N + salary/requirements)** must be managed from WITHIN the Org Tuzilma page
   — e.g. a "Razryadlar" TAB or a settings panel ON the org-structure/hierarchy page (Q-42: max 2 tab levels) —
   NOT a separate sidebar entry. Reuse RazryadLevels.tsx's table/form as that tab's content if convenient.
5. **Routes:** drop the standalone `org-structure/cards` + `org-structure/razryad-levels` routes from AppRouter
   (or redirect them into Org Tuzilma). Don't leave dead sidebar→missing-page or orphan routes (Qoida 20).
6. Decide OrgCards.tsx / RazryadLevels.tsx / CardDetail.tsx: fold their useful parts into the Org Tuzilma page
   (as the card-detail + razryad-catalog-tab), then remove the standalone pages. The backend endpoints
   (/api/org-structure/razryad-levels, /api/org-structure/cards) STAY — they're now consumed from inside Org Tuzilma.

## ADDITIONAL (owner-confirmed 2026-06-17, same sidebar file)
7. **Dedup "Ko'nikmalar Matritsasi"** — it appears TWICE in the sidebar, both `url: "skills-matrix"`:
   - constants.ts:419 (tz11 HR "Ko'nikmalar Matritsasi") — **KEEP this one** (owner: skills = HR competency).
   - constants.ts:464 (tz12 LMS "Ko'nikmalar") — **REMOVE this duplicate entry.**
   Only remove the sidebar line; the page/route stays (HR entry still points to it). Run check-sidebar-routes after.

## OUT OF SCOPE (owner said DO NOT touch — 2026-06-17)
Do NOT change these (they are an audit agent's architectural opinion, NOT an owner instruction):
Goals/Maqsadlar placement (constants.ts:411), Assets/Aktivlar (constants.ts:415), OrgNodeDetail-as-route
(HRRoutes.tsx:69). Leave them exactly as they are.

## SELF-VERIFY
- FE tsc 0; `check-sidebar-routes.mjs` PASS (no sidebar→missing-page); `check-design-tokens` PASS (EP tokens).
- Org Tuzilma loads; a card shows its razryad; opening a card lets you assign razryad; the razryad catalog is a
  tab/panel inside Org Tuzilma. NO "Kartalar"/"Razryadlar" entries left in the sidebar.
- Backend health 200, login 401/422 (no regression). golden-thread exit 0.
- Screenshot the Org Tuzilma with razryad visible on a card + the razryad tab.

## COMMIT + REPORT
- `git add <exact files>` only. Commit: `fix(org): razryad inside Org Tuzilma; remove separate Kartalar/Razryadlar pages`.
- Report: what merged/removed, commit hash, sidebar-check PASS, screenshot, no-regression. Then stop — advisor
  re-verifies (this time against the owner's instruction, not just technical correctness).
