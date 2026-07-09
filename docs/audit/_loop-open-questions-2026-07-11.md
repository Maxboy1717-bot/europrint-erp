# Loop Open-Questions / Skipped Items — 2026-07-11

> Single running file for the combined Design-System + 1,163-item build loop.
> Sections: (a) owner-gated items, (b) safety-skipped items, (c) scope/naming ambiguities.
> All raised TOGETHER at the very end — never mid-loop.

---

## (a) Owner-gated items (need data / decision / credential / schema approval)

### Q-A1 — Deprecate the parallel `ModulePage` shell? (design §3.5 / Part 5 page-by-page #2)
Two non-interoperating page-shell systems coexist: canonical `EPPageHeader` (162 files)
and the parallel `ModulePage` (`components/ui/module-page.tsx`, 45 files) with its own
per-module color map that duplicates the `--mod-*` accent concept. Phase-1 Item D4b already
corrected ModulePage's root spacing (`space-y-4` → `space-y-6`) so it no longer violates the
scale. The proposal's further recommendation — **migrate all 45 ModulePage consumers to
EPPageHeader and retire ModulePage** — is a 45-file page-by-page effort AND a design
decision (keep two documented systems vs. converge on one). Not done in this loop.
**Question:** converge on EPPageHeader (retire ModulePage), or keep ModulePage as a
documented second shell?

---

## (b) Items skipped for a genuine safety concern (regression / wrong premise / collision)

_(none yet)_

---

## (c) Scope / naming ambiguities needing a quick owner call

### Q-C1 — Phase-1 modal fix: proposal has 3 parts, only 1 is in the D-item queue
The design proposal's "peach modal" remedy is three coordinated fixes (Part 3.1 + sizing table
Fix #1/#2/#3):
- **Fix #1** = correct `--ep-bg`/`--background`/`--ep-border`/`--border` tokens in
  `europrint-mockup-theme.css`. → **This is Phase-1 Item D1. DONE.**
- **Fix #2** = change shared `components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx` default
  from `bg-background` → `bg-card` (#FFFFFF), so modals get a pure-white surface that separates
  from the now-#FAFAF9 page. **NOT present as any D1–D6 item.** After D1, page and modal are both
  #FAFAF9 (peach is gone — D1's goal met — but modal↔page surface separation is lost until Fix #2).
- **Fix #3** = retire the `kit.css` blush sub-palette (`--bg-blush*`, `--line-warm*`) + its
  `badge.tsx`/`button.tsx` hover consumers. **NOT present as any D1–D6 item.** Peach can still
  resurface on badge/button hover states until this lands.

**Question:** Do you want Fix #2 and Fix #3 built too (each as its own commit, same discipline)?
They're low-risk shared-component corrections but were not enumerated in the D1–D6 list, so per
no-scope-creep I did not build them. D1 alone already removes the peach page/modal background.

### Q-C2 — D5: how EPTable adoption was interpreted (safety-driven), + remainder
`EPTable` (built in D3) is a **config-driven smart-table** (its `onRowAction` renders a single
⋯ dropdown; columns/cells come from a `columns` array). The audit's "NOT separated" tables are
**bespoke JSX tables** with inline multi-button row actions, per-row `data-testid`s, and
per-column alignment that a wholesale swap to `<EPTable>` **cannot reproduce without changing
behavior** (inline buttons→dropdown, lost testids/alignment). D5 itself says "preserving actions
exactly … not a behavior change," and this loop forbids forcing an unsafe (behavior-changing)
build. So I delivered D5's actual intent — **separation matching §3.4** — by applying the §3.4
separation **spec in-place** (bordered `border border-[var(--ep-border)]` container where missing;
`bg-muted/50` uppercase header; remove `border-none`/`shadow-none` strips), which is
behavior-preserving. `EPTable` remains the canonical component for **new/greenfield** tables and
any future table that is a clean config-fit.
**If you'd rather** these specific tables be genuinely re-implemented on `<EPTable>` (accepting
the actions→dropdown UX change and testid rework), say so and I'll convert them properly.

**D5 done this pass (7, one commit each):** RulonCards (header bg), SDCustomers, SDContracts
(border-none→border), GLDocuments, AccountsPayable, AccountsReceivable, SDKpi (flat→bordered).
**Correctly skipped:** SalesOrdersSections:107 & SDDebitors:149 (table already inner-bordered —
adding outer border would double it); DesignOrders:301/311 (a clickable order **card grid** +
empty-state, not a data table — flat style intentional).
**Named remainder for a future pass (~7 + long-tail):** CRM `ListView.tsx` (zero wrapper — needs
a container built), `WarehouseReportsAllSections.tsx` ReportTable (zero wrapper + hardcoded gray
`bg-gray-50`/`text-gray-600` → also needs token fix), `SDSalesManagement.tsx:232`,
`SDSalesQuotes.tsx:255`, `PapkaOrdersSections.tsx:114`, `CashFlowManagementSections.tsx:176→211`,
`BudgetManagementSections.tsx:215→255`; plus the broader long-tail (~65 raw `<table>` one-offs,
Part 5 page-by-page #5, most already have adequate ad-hoc separation).
