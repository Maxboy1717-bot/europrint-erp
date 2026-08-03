# DIRECTIVE — hr/recruiting (RecruitingKanban) redesign: fix raw i18n keys + de-clutter

> ⛔ **SUPERSEDED 2026-06-18 (owner decision = DELETE-NOTHING redesign, Q-46).** Recruiting will be done as part
> of the **HR P4 checkpoint**, using the P4 template + Q-46. **VOID the deletion parts of this file:**
> **FIX 3 (condense 9 stat cards → 5) is CANCELLED — keep ALL 9 stats** (restyle into a uniform EPKpiCard strip
> that wraps; do not drop any). In **FIX 5**, keep ALL card actions/buttons (de-emphasize with `variant="ghost"`,
> do not remove the 3rd button). Everything else here (raw-i18n fix, EPPageHeader, token colors, single-scroll
> board, cleaner card hierarchy) stays valid. Restyle only; remove nothing. Do NOT execute this file standalone —
> it will be reissued inside the HR module directive.

> Advisor (Claude) → Executor (Muslimbek). Owner 2026-06-17 reviewed the live page (screenshot): "juda siqilgan
> va tartibsiz" (very cramped + disorganized). Root cause #1 = RAW i18n KEYS showing as text (looks broken).
> The page is well-componentized already; this is a presentation/i18n cleanup, NOT a rewrite. Keep all logic,
> data, drag-drop, dialogs, endpoints intact (Q-39 no-regression).

## RULES BLOCK
- EXECUTOR (🟢). FE-only. EP design tokens (Q-21) + standard templates (Q-41). `git add <exact-file>` only. No DDL.
  Don't break the kanban logic / mutations / WS realtime / dialogs.

## FIX 1 🔴 (highest visible impact) — RAW i18n KEYS showing as text
On the live page these render as raw camelCase CODE instead of Uzbek labels (the `t()`/`tLabel()` key is missing
from the locale AND has no fallback, so the key itself shows):
- Search placeholder: `ismYokiTelefon` → "Ism yoki telefon"
- Buttons: `yangiVakansiya` → "Yangi vakansiya", `yangiNomzod` → "Yangi nomzod"
- Green banner: `barchaCheklistBandlariMuddatidaBajarilmoqda` → "Barcha cheklist bandlari muddatida bajarilmoqda"
- Card actions: `aiIntervyu` → "AI intervyu", `suhbatBlanki` → "Suhbat blanki", `cvMezonlari52`/`skript53`/`report`
  → proper labels (strip trailing digits if they're stray; these look like raw keys).
**Method:** grep the recruiting components (RecruitingHeaderActions, HRAlertBanner, KanbanBoardGrid + card
components under components/recruiting/, JobOfferDialog etc.) for `t("...")`/`tLabel("...")` calls; for EVERY key
that's missing, ADD the proper Uzbek value to the `uz/common` (or the right namespace) locale file. Then run the
i18n scanner to confirm 0 missing keys ON THIS PAGE. (This is the single biggest "tartibsiz" fix.)

## FIX 2 — Header → standard compact EPPageHeader
Replace the bespoke `<h1 className="text-4xl font-light ...">Yollash Kanban</h1>` (RecruitingKanban.tsx:195) with
the standard `EPPageHeader` (title + subtitle + right-aligned actions), matching other pages (Q-41). Compact, not 4xl.

## FIX 3 — Condense the 9 stat cards → ~5 key, uniform, token-colored
Currently 9 `StatCard`s span the full width (cramped) with raw palette colors (`bg-green-500/red-500/indigo-500/
violet-500/emerald-500...`, Q-21 violation). Reduce to the 5 most important (Jami nomzodlar · Faol · Qabul ·
Samaradorlik · Ochiq vakansiya) as a compact uniform metric strip using EP tokens (no per-card rainbow). Move the
rest (Rad etildi / Shoshilinch / AI sessiyalar / Sinov davri) into a secondary/smaller row OR drop from the top
strip. Use semantic tone only where it means something (Qabul=success), not a different bright color per card.

## FIX 4 — Collapse the 2 banners into 1
The HC-methodology banner + the HR-alert green banner stack above the board. Make them ONE compact collapsible
strip (closed by default, 1 line) so the kanban board gets the vertical space.

## FIX 5 — Card + column de-clutter
- 7 funnel columns are inherent (the 7 stages) — keep them, but ensure smooth horizontal scroll + give each card a
  cleaner hierarchy: candidate NAME prominent (not truncated to "Se..." — allow wrap or wider), phone/email muted +
  smaller, AI%/checklist as small chips, and ONE primary action (advance stage) + reject as a subtle icon — not
  3 competing full buttons. Use EP tokens, the standard card style.
- The probation filter button (RecruitingKanban.tsx:231) uses hardcoded emerald classes → use EP token/variant.

## SELF-VERIFY
- FE tsc 0; check-design-tokens PASS (no raw hex/inline); i18n scanner: 0 missing keys on this page.
- The page still works: drag-drop moves candidates, mutations fire, dialogs open, WS realtime intact (Q-39).
- Screenshot the redesigned page (owner will visually confirm). health 200, login 401/422.

## COMMIT + REPORT
- `git add <exact files>` only. Commit: `fix(hr): recruiting kanban — i18n labels + standard header + condensed stats + cleaner cards`.
- Report: per fix, commit hash, i18n missing-count before/after on this page, screenshot, no-regression. Then stop —
  advisor + owner visually verify.
