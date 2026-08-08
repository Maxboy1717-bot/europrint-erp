# DIRECTIVE — P4 DESIGN STANDARDIZATION · MODULE 1/17: MOLIYA (FINANCE)

> **Advisor (Claude) → Executor (Muslimbek).** Owner-gated, 2026-06-18.
> This is the FIRST P4 checkpoint of the massive cleanup. We standardize the **Finance (Moliya)** module's
> 25 pages onto the EuroPrint EP design system — **presentation only**. When Finance is verified by the
> advisor + owner, the same template (§1–§3, §5, §7, §9, §10, §12) is reused for the next module; only the
> per-page sections (§4, §6, §11) change.
>
> ⭐ **THE ONE RULE THAT OVERRIDES EVERYTHING (Q-46):** you are adjusting how pages LOOK. You are **not**
> removing anything that works. Every stat card, every table column, every button, every dialog, every
> query, every mutation, every tab — **stays**. If you ever find yourself deleting a working feature to
> "make it cleaner", STOP — that is the exact mistake we are fixing. Restyle, don't remove.

---

## §0 — CONTEXT, ROLES, SCOPE

- **You are the EXECUTOR (🟢).** You write code + commit. I (advisor) only review and verify.
- **Module:** Finance / "Moliya". **25 page components**, route file `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx`
  (30 routes; `FinanceExtended` serves 6 of them via tabs).
- **This pass is FRONT-END PRESENTATION ONLY.** You touch only:
  - page-shell layout (header, KPI row, card grid, scroll container),
  - swapping bespoke markup for EP components (`EPPageHeader`, `EPKpiCard`, `EPCard`, `EPStatusPill`,
    `EPErrorState`, `EPEmptyState`, `EPLoader`, `EPSkeleton*`),
  - replacing raw colors (inline `#hex`, Tailwind palette classes like `bg-amber-100`) with EP design tokens,
  - filling any raw i18n keys that render as code.
- **You do NOT touch:** any `useQuery`/`useMutation` logic, any `apiRequest` URL, any backend file, any DDL,
  any GL-posting / payroll-closure / `entries` logic, any business calculation. (Details in §1.)
- **Cadence:** Finance is ONE checkpoint. Do the whole module, run self-verify (§9), commit (§10), report, then
  STOP for advisor + owner review before the next module. Do **not** start another module on your own.
- **Working dir:** `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`
- **Frontend root:** `artifacts/erp-dashboard/` · pages live in `artifacts/erp-dashboard/src/pages/`.
- **Why this module first:** Finance is a core, table/KPI-heavy module where the EP standard shows clearly, and
  it has no recruiting entanglement. We prove the pattern + the checkpoint rhythm here, then scale to the rest.

---

## §1 — RULES BLOCK (read every line; these are binding)

### 1.1 — Q-46: working code never deleted / broken code fully deleted ⭐ (MOST IMPORTANT)
- ✅ Anything that **works correctly** is **NEVER deleted** — not for design, not for "decluttering", not for
  "consistency". You may restyle it, move it, re-wrap it in an EP component, recolor it with a token — but the
  **content, the data, the feature, the action all remain**. Example: a page with 9 stat cards keeps **all 9**.
  A table with 12 columns keeps **all 12**. A toolbar with 4 buttons keeps **all 4**.
- ❌ Code that is genuinely **broken** (crashes, dead/unreachable, fake/echo/hardcoded that pretends to be real)
  is deleted **completely** or fixed — never left half-working. **But:** before deleting anything you must
  (a) prove it is truly broken (live check), and (b) prove nothing imports it (grep). In a *design* pass you
  will almost never delete — if you think something must go, **do not delete it; report it to the advisor** and
  leave it in place. Design-pass default = **delete nothing**.
- The recruiting redesign earlier removed 4 of 9 stat cards "to declutter" — that was a Q-46 **violation** and
  was reverted. Do not repeat it. Here it means: a cramped 9-card row gets **restyled into a tidy uniform
  strip of 9** (smaller tiles, wrap, EP tokens) — NOT reduced to 5.

### 1.2 — FE-presentation-only fence (Q-39 no-regression)
- Touch only `.tsx`/`.css` under `artifacts/erp-dashboard/src/`. **No** `apps/api/**`, **no** `*.sql`, **no**
  schema, **no** migrations.
- **Do not change any of these, even if they look improvable:**
  - `useQuery` / `useMutation` definitions, their `queryKey`, their `mutationFn`, `apiRequest(...)` method+URL.
  - `onSuccess` / `onError` / `invalidateQueries` keys.
  - zod schemas, form field names, `react-hook-form` wiring.
  - tab `value` strings and the routing/`useSearch` logic (even if you spot a value mismatch — that is a
    separate logic ticket; **flag it, don't fix it here**).
  - data-shape handling (`Array.isArray(...)` guards, mapping, formatting like `formatCurrency`).
- After your changes each page must still: load, fetch the same data, open the same dialogs, fire the same
  mutations, render the same rows. **Same behavior, new skin.**

### 1.3 — GL / payroll / posting = LOGIC DON'T-TOUCH (binding constraint)
- Finance contains the financial core. The following pages touch GL/payroll/posting **logic**; you may restyle
  their **shell** (header/cards/layout/tokens) but you must **NOT** alter any posting, journal, closure, or
  calculation code path on them:
  - `PayrollAutomation.tsx`, `GLDocuments.tsx`, `PeriodClosing.tsx`, `ChartOfAccounts.tsx`,
    `FinanceDashboard.tsx` (its Payroll tab calls `/calculate` and `/close`).
- Specifically NEVER touch anything related to: GL journal posting, `entries`, `gl_journal_entries`/`gl_lines`
  (SAP#76), payroll period **close/calculate** mutations. Restyle the visual container around them; leave the
  calls byte-for-byte identical.

### 1.4 — AI pages = Q-41 exception
- `AIFinancePage.tsx` (`/ai/finance`, sidebar "AI Moliya") and the `fi/risk-ai` view ("Moliyaviy Risk AI"):
  if the page uses a **bespoke futuristic / Aisha-style** look, **do NOT force the EP standard on it** (Q-41).
  Only (a) fix raw i18n keys and (b) replace any inline `#hex` that would break dark mode with a token.
  If the page already uses plain EP layout (it currently imports `EPPageHeader`), treat it like a normal page.

### 1.5 — Commit safety
- `git add <exact-file-path>` only. **Never** `git add -A`, `git add .`, or `git add -u`.
- One executor only (Q-23). If `git status` shows files you did not touch, STOP and tell the owner a parallel
  session is active — do not commit over them.
- Never commit logs, `_audit/`, `node_modules`, build output, `.env`. Never print or commit secrets.

### 1.6 — Self-verify is mandatory (§9). No "done" without the proof in §9.

---

## §2 — THE EP DESIGN STANDARD (component spec — exact, from source)

These are the canonical building blocks. Import from the barrel: `import { ... } from "@/components/ep";`.
Use them instead of bespoke markup. **Exact props below — do not invent props.**

### 2.1 — `EPPageHeader` — every page starts with this
```ts
interface EPPageHeaderProps {
  title: React.ReactNode;        // REQUIRED. 20px / semibold. Uzbek sentence case. e.g. "Pul oqimi"
  subtitle?: React.ReactNode;    // 13px muted line under the title (the page's one-line description)
  breadcrumb?: React.ReactNode;  // 12px muted, e.g. <>Moliya · <b>Byudjet</b></>
  actions?: React.ReactNode;     // right-aligned buttons (1–3). Put page buttons/dialog triggers HERE.
  status?: React.ReactNode;      // a status pill next to the title (e.g. live/period state)
  icon?: React.ReactNode;        // optional icon beside the title
  children?: React.ReactNode;    // extra row after the header (e.g. a <TabsList/>)
  className?: string;
  "data-testid"?: string;
}
```
**Rule:** the page title, its one-line description, and its top-right action buttons all go **through these
props** — not as separate sibling `<h1>` / `<p>` / `<div className="flex justify-between">` markup. (See §5.1.)
**Never** use `text-3xl/4xl/5xl` bespoke headings for a page title; `EPPageHeader` is the title.

### 2.2 — `EPKpiCard` — the stat tiles at the top of dashboards
```ts
interface EPKpiCardProps {
  label: string;                 // REQUIRED. UPPERCASE eyebrow (the component styles it; you write the label).
  value?: number;                // numeric — animates 0→value over ~1.2s
  staticValue?: React.ReactNode; // non-numeric / pre-formatted (e.g. "48 / 50", "—", a currency string)
  formatValue?: (n: number) => string;  // format the animated number (compact/percent/currency)
  icon: LucideIcon;              // REQUIRED. Lucide icon shown in the 42px round tile.
  iconBg?: EPModuleColor | string;       // tile color. For Finance pass "fi" (cyan) unless semantic.
  delta?: { value: string; trend: "up" | "down" | "flat" };  // small arrow + % under the value
  linkLabel?: string;            // optional bottom link ("Hammasi →")
  onLinkClick?: () => void;
  onClick?: () => void;          // makes the whole tile clickable (hover-lift)
  className?: string;
  enterDelayMs?: number;         // stagger in a row (e.g. i * 60)
}
```
- For a currency stat use `staticValue={formatCurrency(x)}`. For a count use `value={n}`. For a percent use
  `value={p} formatValue={(n)=>`${n.toFixed(1)}%`}`.
- **Default Finance tile color is `iconBg="fi"`** (cyan, `--mod-fi`). Use a semantic color ONLY when it means
  something: success/green for positive (profit, collected), red for negative (overdue, loss).

### 2.3 — `EPCard` — the generic surface (panels, list containers, form blocks)
```ts
interface EPCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;   // hover-lift + icon rotate (use for clickable cards)
  module?: EPModuleColor;  // 3px colored left border accent ("fi" for Finance)
  padding?: number|string; // default 18px; pass 0 for flush (e.g. wrapping a table)
  elevated?: boolean;      // inset shadow
}
// EPModuleColor = "sd" | "pp" | "hr" | "warehouse" | "fi" | "primary"
```
Replace bespoke `<div className="bg-white rounded-lg border shadow p-6">` with `<EPCard>`.

### 2.4 — `EPStatusPill` — status chips (replace ALL colored Badges that mean status)
```ts
interface EPStatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: "success" | "warning" | "danger" | "info" | "brand" | "neutral";  // REQUIRED
  hideDot?: boolean;
  size?: "sm" | "md";   // sm default
}
```
Mapping guidance: paid/closed/approved/active → `success`; pending/processing/draft → `warning`;
overdue/rejected/error → `danger`; informational → `info`; brand/highlight (e.g. "open") → `brand`;
unknown/other → `neutral`. **Never** hand-roll `bg-green-100 text-green-700` for a status — use the pill.

### 2.5 — States: `EPErrorState`, `EPEmptyState`, `EPLoader`, `EPSkeleton*`
```ts
EPErrorState   { title?, description?, onRetry?, retryLabel?, variant?: "card"|"inline",
                 severity?: "error"|"warning", error?, url?, className? }
EPEmptyState   { icon: LucideIcon, title, description?, action?, variant?: "card"|"inline", className? }
EPLoader       { size?: number=16, tone?: "primary"|"muted"|"white" }       // also: EPSpinnerBlock
EPSkeletonKpiRow({ count?=4 })  EPSkeletonTable({ rows?=6, cols?=5 })  EPSkeletonCard({ lines?=3 })  EPSkeletonBar
```
- **Error:** `if (isError) return <EPErrorState onRetry={refetch} />;` (FinanceDashboard already does this — copy it).
- **Loading:** while `isLoading`, render `<EPSkeletonKpiRow/>` + `<EPSkeletonTable/>` instead of a blank or a bespoke spinner.
- **Empty:** when a list is empty, render `<EPEmptyState icon={Inbox} title={t('noData')} />` instead of a bare "—".
- Do **not** delete existing error/empty handling — upgrade it to these components.

### 2.6 — `EPNumberedSection` (stepped flows) & `EPComingSoon`
```ts
EPNumberedSection { step: number, title, status?: tone, statusLabel?, active?, children?, className? }
EPComingSoon      { title?, description?, variant?: "card"|"inline", className? }
```
Use `EPNumberedSection` only where a page already shows a numbered/step flow (e.g. period-closing steps).
Use `EPComingSoon` only for a view that is genuinely a placeholder — **never** to replace a working view.

### 2.7 — Buttons
Use the existing `@/components/ui/button` `Button` with `variant`:
`default` (primary orange), `outline` (secondary), `ghost` (tertiary), `destructive` (delete/danger).
Do not hand-roll buttons with raw palette classes. Keep all existing buttons; only normalize their variant.

### 2.8 — Usage quick-reference (copy-paste skeletons)
```tsx
import {
  EPPageHeader, EPKpiCard, EPCard, EPStatusPill,
  EPErrorState, EPEmptyState, EPSkeletonKpiRow, EPSkeletonTable,
} from "@/components/ep";
import { TrendingUp, Wallet, Inbox } from "lucide-react";

// header with subtitle + actions:
<EPPageHeader title="Pul oqimi" subtitle="Kirim/chiqim oqimi" actions={<Button>+ Yangi</Button>} />

// KPI row (keep ALL tiles; stagger optional):
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <EPKpiCard label="JAMI DAROMAD" staticValue={formatCurrency(total)} icon={TrendingUp} iconBg="fi" />
  <EPKpiCard label="OCHIQ HISOBLAR" value={openCount} icon={Wallet} iconBg="fi" />
</div>

// surface + states:
<EPCard>{/* table or content */}</EPCard>
{isError ? <EPErrorState onRetry={refetch} />
  : isLoading ? <EPSkeletonTable rows={8} />
  : rows.length === 0 ? <EPEmptyState icon={Inbox} title={t('noData')} />
  : <table>…</table>}

// status chip:
<EPStatusPill tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
  {t(inv.status)}
</EPStatusPill>
```

---

## §3 — DESIGN TOKENS (use these; never raw hex / never Tailwind palette numbers)

Defined in `src/erp-modern-ui/design-tokens.css`, `europrint-mockup-theme.css`, `ep-motion-helpers.css`.
**Light + dark mode are handled by the tokens** — that is *why* raw hex breaks (it doesn't flip in dark mode).

### 3.1 — Color tokens
| Token | Light value | Use |
|---|---|---|
| `--ep-primary` | `#FF902F` | brand orange — primary actions, active |
| `--ep-primary-dark` | `#F07F1B` | hover |
| `--ep-primary-soft` | `rgba(255,144,47,.10)` | brand tint bg |
| `--ep-dark` / `--ep-text` | `#15171A` | primary text |
| `--ep-muted` | `#6B6E72` | secondary text |
| `--ep-subtle` | `#9A9CA0` | tertiary text |
| `--ep-bg` | `#F5E6E1` | page background |
| `--ep-surface` | `#FFFFFF` | card surface |
| `--ep-border` | `#E7E2D8` | borders |
| `--ep-green` | `#2E8A5A` | success / positive |
| `--ep-yellow` | `#B5891C` | warning |
| `--ep-red` | `#C0432F` | danger / negative |
| `--ep-blue` | `#3563AC` | info |
| `--ep-purple` | `#7A4FB1` | accent |
| `--ep-cyan` | `#1A8FAF` | accent |
| `--ep-pink` | `#C45C7A` | accent |
| `*-soft` (each above) | `rgba(...,.10–.15)` | soft tint backgrounds |

### 3.2 — Module colors (icon tiles, left-accents)
`--mod-sd #3563AC` · `--mod-pp #2E8A5A` · `--mod-hr #7A4FB1` · `--mod-warehouse #B5891C` ·
**`--mod-fi #1A8FAF` (Finance — use this for Finance KPI tiles / card accents)**. Each has a `*-light` variant.

### 3.3 — How to apply a token
- In `style`: `style={{ color: "var(--ep-red)" }}`, `style={{ background: "var(--ep-green-soft)" }}`.
- Existing Tailwind semantic classes that already map to tokens are fine: `text-foreground`, `text-muted-foreground`,
  `bg-card`, `border-border`, `bg-primary text-primary-foreground`, `text-primary`, `bg-muted`.
- The FinanceDashboard tax dialog already does it right: `text-[var(--ep-red)]`, `text-[var(--ep-green)]` — copy that.

### 3.4 — Spacing scale (4px base) — use these, don't hardcode px
| Token | px | Typical use |
|---|---|---|
| `--space-1` | 4 | tightest gap |
| `--space-2` | 8 | chip/badge gap |
| `--space-3` | 12 | KPI-row gap |
| `--space-4` | 14 | card inner padding |
| `--space-5` | 16 | section gap |
| `--space-6` | 20 | page padding (mobile) |
| `--space-7` | 24 | page padding (lg) |
| `--space-8` | 32 | block separation |
| `--space-10..20` | 40..96 | large vertical rhythm |

### 3.5 — Radius scale
| Token | px | Use |
|---|---|---|
| `--r-sm` | 6 | small chips |
| `--r-md` | 8 | buttons, inputs |
| `--r-lg` | 10 | cards, modals (DEFAULT) |
| `--r-xl` | 12 | feature cards |
| `--r-2xl` | 16 | hero panels |
| `--r-pill` | 9999 | pills/dots |

### 3.6 — Shadows (Linear-soft) & motion
- Shadows: `--sh-xs` (hairline), `--sh-sm` (resting card), `--sh-md` (hover card), `--sh-lg`/`--sh-xl`
  (popovers/modals), `--sh-primary` (brand-tinted, for the primary CTA). Don't hardcode `box-shadow` — use these.
- Motion easings: `--ease-out-quart` (hover), `--ease-out-back` (icon pop), `--ease-out-soft` (bar growth).
  Durations: `--d-fast .18s`, `--d .28s`, `--d-slow .48s`. The EP components already animate; you rarely add motion.

### 3.7 — Typography classes (apply, don't set raw font-size)
| Class | size/weight | Use |
|---|---|---|
| `.ep-h2` | 18 / 600 | section heading |
| `.ep-h3` | 16 / 600 | sub-section |
| `.ep-card-title` | 14 / 600 | card title |
| `.ep-body` | 13 | body text |
| `.ep-muted` | 13 muted | secondary text |
| `.ep-eyebrow` | 10 upper, ls .6 | KPI label |
| `.ep-kpi-value` | 28 / 700 | KPI number |
| `.ep-label` | 12 / 500 | form label |
| `.ep-caption` | 11 | captions |

### 3.8 — Utility classes you may reuse
`.ep-card` (surface) · `.ep-card-interactive` (hover-lift) · `.ep-pill` + `--success/--warning/--danger/--info/--brand`
(status chip) · `.ep-icon-tile` (42px round icon) · `.ep-live-dot` (pulsing live indicator) · `.ep-fade-up` /
`.ep-fade-in` / `.ep-scale-in` (entrance) · `.ep-mono` (numeric tabular). Prefer the EP **components** (§2) over
raw utility classes; reach for the classes only when wrapping markup the components don't cover.

### 3.9 — FORBIDDEN in this pass
- ❌ inline `#rrggbb` hex anywhere in `.tsx` (use a token). The guard `check-design-tokens.mjs` flags these.
- ❌ Tailwind palette numbers: `bg-red-500`, `text-green-600`, `bg-amber-100`, `border-indigo-400`,
  `from-violet-500`, `to-emerald-400`, etc. → replace with a token or a semantic class.
- ❌ bespoke page-title headings `text-3xl/4xl/5xl font-light` → use `EPPageHeader`.
- ❌ rainbow KPI rows (each card a different bright color) → uniform `iconBg="fi"` + semantic only where meaningful.

---

## §4 — FINANCE: CURRENT-STATE AUDIT (live-measured 2026-06-18)

25 pages. `EPH` = #EPPageHeader refs · `raw` = Tailwind palette color classes · `bigH` = bespoke `text-[3-6]xl`
headings · `hex` = inline `#hex`. **Class A** = already has EPPageHeader, only token/hex cleanup. **Class B** =
no EPPageHeader, needs header + states + token cleanup. **Class C** = special (AI/extended).

| # | Page (route) | EPH | raw | bigH | hex | lines | Class | Headline work |
|---|---|---|---|---|---|---|---|---|
| 1 | FinanceDashboard (`/finance-dashboard`) | 2 | 1 | 0 | 0 | 335 | A | header props consolidation; mixed Badge→pill |
| 2 | CFODashboard (`/cfo/dashboard`) | 6 | 0 | 1 | 0 | 244 | A | kill the 1 bespoke big heading |
| 3 | CashFlowManagement (`/finance/cashflow`) | 2 | 0 | 0 | 0 | 162 | A | verify states; minor |
| 4 | BudgetManagement (`/finance/budgets`) | 3 | 0 | 0 | 0 | 260 | A | verify states; minor |
| 5 | OrderCosting (`/finance/order-costing`) | 0 | 1 | 0 | 0 | 157 | B | add header; raw→token |
| 6 | FinancialReports (`/finance/reports`) | 0 | 1 | 0 | 0 | 201 | B | add header; raw→token |
| 7 | ProductProfitability (`/finance/profitability`) | 0 | 1 | 0 | 0 | 193 | B | add header; raw→token |
| 8 | DailyKPIDashboard (`/finance/daily-kpi`) | 0 | 2 | 0 | 4 | 167 | B | add header; **4 inline hex**→token; KPI tiles→EPKpiCard |
| 9 | AccountsReceivable (`/accounting/ar`) | 3 | 0 | 0 | 0 | 172 | A | verify states; minor |
| 10 | AccountsPayable (`/accounting/ap`) | 3 | 0 | 0 | 0 | 172 | A | verify states; minor |
| 11 | PayrollAutomation (`/accounting/payroll-automation`) | 0 | 3 | 0 | 0 | 216 | B ⚠️GL | add header; raw→token; **don't touch payroll logic** |
| 12 | MaterialsAccounting (`/accounting/materials`) | 0 | 1 | 0 | 0 | 205 | B | add header; raw→token |
| 13 | GLDocuments (`/accounting/gl-documents`) | 3 | 1 | 3 | 0 | 443 | A ⚠️GL | kill **3 bespoke headings**; raw→token; **don't touch GL logic** |
| 14 | ChartOfAccounts (`/accounting/chart-of-accounts`) | 2 | 0 | 0 | 0 | 146 | A ⚠️GL | minor; **don't touch GL logic** |
| 15 | PeriodClosing (`/accounting/period-closing`) | 0 | 5 | 0 | 0 | 294 | B ⚠️GL | add header; **5 raw colors**→token; steps→EPNumberedSection; **don't touch closure logic** |
| 16 | CashRegister (`/accounting/cash-register`) | 0 | 0 | 0 | 0 | 129 | B | add header only (clean otherwise) |
| 17 | IncomeExpense (`/accounting/income-expense`) | 0 | 1 | 0 | 0 | 250 | B | add header; raw→token |
| 18 | InventoryValuation (`/accounting/inventory-valuation`) | 0 | 1 | 0 | 0 | 351 | B | add header; raw→token |
| 19 | AssetManagement (`/accounting/asset-management`) | 0 | 1 | 0 | 0 | 303 | B | add header; raw→token |
| 20 | FinanceExtended (`/fi/cost-centers` +5 tabs) | 0 | 0 | 0 | 0 | 170 | C | add header; 6-tab page |
| 21 | CfoConfigSettings (`/cfo/config`) | 0 | 0 | 0 | 0 | 168 | B | add header only |
| 22 | FinanceVariance (`/finance/variance`) | 2 | 1 | 0 | 7 | 316 | A | **7 inline hex**→token; raw→token |
| 23 | FinanceBreakEven (`/finance/break-even`) | 2 | 3 | 0 | 4 | 301 | A | **4 hex + 3 raw**→token |
| 24 | PricingTiers (`/finance/pricing-tiers`) | 2 | 0 | 0 | 0 | 285 | A | verify states; minor |
| 25 | AIFinancePage (`/ai/finance`) | 2 | 0 | 0 | 0 | 138 | C(Q-41) | i18n + hex only; **don't force EP look if futuristic** |

**Totals (top-level page files only):** 12 pages Class A (header present), 11 Class B (need header), 2 Class C.
Inline hex hotspots: DailyKPI(4), FinanceVariance(7), FinanceBreakEven(4) = 15. Raw-palette hotspots: PeriodClosing(5),
PayrollAutomation(3), FinanceBreakEven(3). Bespoke big headings: GLDocuments(3), CFODashboard(1).

### §4.1 — ⚠️ CO-LOCATED FILES CARRY MOST OF THE DEBT (re-measured 2026-06-18 — the §4 table above was page-file-only and UNDERCOUNTED)
A Finance "page" is the top-level `<Page>.tsx` **plus** its co-located files with the same name prefix
(`<Page>Sections.tsx`, `<Page>Tabs.tsx`, `<Page>Dialogs.tsx`, `<Page>Cards.tsx`, `<Page>Charts.tsx`,
`<Page>Detail.tsx`, `<Page>Extra.tsx`, `<Page>Types.tsx`). **The per-page work + acceptance INCLUDE these.**
Live grep of raw palette / inline hex across all Finance-related files:

| File | palette | hex | belongs to |
|---|---|---|---|
| FinanceDashboardTabs.tsx | 6 | 0 | FinanceDashboard (6.1) |
| CFODashboardCards.tsx | 1 | 0 | CFODashboard (6.1) |
| CFODashboardCharts.tsx | 3 | 3 | CFODashboard (6.1) |
| CFODashboardExtra.tsx | 10 | 0 | CFODashboard (6.1) |
| CashFlowManagementSections.tsx | 1 | 0 | CashFlowManagement (6.1) |
| AccountsReceivableSections.tsx | 5 | 0 | AccountsReceivable (6.1) |
| AccountsPayableSections.tsx | 5 | 0 | AccountsPayable (6.1) |
| ChartOfAccountsSections.tsx | 6 | 0 | ChartOfAccounts (6.1) — getAccountTypeBadge() 5 raw Badges |
| OrderCosting.tsx / OrderCostingDetail.tsx / OrderCostingSections.tsx | 1 / 5 / 2 | 0 | OrderCosting (6.3) |
| FinancialReports.tsx | 1 | 0 | FinancialReports (6.3) |
| ProductProfitability.tsx / Charts / Sections | 1 / 0 / 4 | 0 / 2 / 0 | ProductProfitability (6.3) |
| PayrollAutomation.tsx | 3 | 0 | PayrollAutomation (6.4 ⚠️GL) |
| MaterialsAccounting.tsx / Sections | 1 / 4 | 0 | MaterialsAccounting (6.3) |
| GLDocuments.tsx | 1 | 0 | GLDocuments (6.4 ⚠️GL) |
| PeriodClosing.tsx | 5 | 0 | PeriodClosing (6.4 ⚠️GL) |
| IncomeExpense.tsx | 1 | 0 | IncomeExpense (6.3) |
| InventoryValuation.tsx | 1 | 0 | InventoryValuation (6.3) |
| AssetManagement.tsx | 1 | 0 | AssetManagement (6.3) |
| AIFinancePageSections.tsx | 3 | 0 | AIFinancePage (6.4, Q-41 — verify if futuristic; convert only if not) |

**Rule:** for every page, grep `<Page>*.tsx` (all co-located, excluding `*.test/*.smoke`) for hex + palette and
convert ALL of them. A page is not "done" until its co-located files are clean too. The diff-aware
`check-design-tokens.mjs` will NOT flag pre-existing palette in files you didn't touch — so co-located debt is
invisible to the guard; you must grep explicitly.

---

## §5 — BEFORE / AFTER CODE GALLERY (real Finance patterns)

These are the exact transformations. Match them everywhere the pattern appears.

### 5.1 — Header: consolidate sibling subtitle + actions into props (FinanceDashboard.tsx:210–272)
**BEFORE** (subtitle is a stray `<p>`, actions are an external flex div):
```tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <EPPageHeader
      breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Moliya {t('dashboard1')}</b></>}
      title={`Moliya ${t('dashboard1')}`}
    />
    <p className="text-muted-foreground mt-1">{t('financialReport')}</p>
  </div>
  <div className="flex items-center gap-2">
    <Dialog open={taxCalcOpen} onOpenChange={setTaxCalcOpen}> ... </Dialog>
  </div>
</div>
```
**AFTER** (one header, subtitle + actions via props — DELETE-NOTHING: the dialog, button, breadcrumb all stay):
```tsx
<EPPageHeader
  breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Moliya {t('dashboard1')}</b></>}
  title={`Moliya ${t('dashboard1')}`}
  subtitle={t('financialReport')}
  actions={
    <Dialog open={taxCalcOpen} onOpenChange={setTaxCalcOpen}> ... unchanged ... </Dialog>
  }
/>
```

### 5.2 — Mixed Badge/pill → all `EPStatusPill` (FinanceDashboard.tsx:187–198 getStatusBadge)
**BEFORE** (two raw Badges + one pill — inconsistent; `bg-amber-100 text-amber-800` is the raw=1 hit):
```tsx
case "open":       return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('periodOpen')}</Badge>;
case "processing": return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('inProgress')}</Badge>;
case "closed":     return <EPStatusPill tone="success">{t('periodClosed')}</EPStatusPill>;
default:           return <Badge variant="outline">{status}</Badge>;
```
**AFTER** (uniform pills; labels unchanged, every state still rendered):
```tsx
case "open":       return <EPStatusPill tone="brand">{t('periodOpen')}</EPStatusPill>;
case "processing": return <EPStatusPill tone="warning">{tCommon('inProgress')}</EPStatusPill>;
case "closed":     return <EPStatusPill tone="success">{t('periodClosed')}</EPStatusPill>;
default:           return <EPStatusPill tone="neutral">{status}</EPStatusPill>;
```

### 5.3 — Bespoke page title → `EPPageHeader` (Class B pages with no header)
**BEFORE:**
```tsx
<div className="mb-6">
  <h1 className="text-3xl font-bold">Buyurtma tannarxi</h1>
  <p className="text-gray-500">Har bir buyurtma uchun tannarx hisobi</p>
</div>
```
**AFTER:**
```tsx
<EPPageHeader title="Buyurtma tannarxi" subtitle="Har bir buyurtma uchun tannarx hisobi" />
```
(Keep any action buttons — move them into `actions={...}`.)

### 5.4 — Inline hex → token (DailyKPIDashboard / FinanceVariance / FinanceBreakEven)
**BEFORE:** `<span style={{ color: "#16a34a" }}>` · `<div style={{ background: "#fee2e2" }}>` ·
`stroke="#3b82f6"` (chart) · `className="text-[#dc2626]"`
**AFTER:** `style={{ color: "var(--ep-green)" }}` · `style={{ background: "var(--ep-red-soft)" }}` ·
`stroke="var(--ep-blue)"` · `className="text-[var(--ep-red)]"`
(Map: green/positive `#16a34a/#22c55e`→`--ep-green`; red/negative→`--ep-red`; blue→`--ep-blue`;
amber/warn→`--ep-yellow`. For chart libs that need a literal color string, pass `"var(--ep-...)"` — it resolves.)

### 5.5 — Raw Tailwind palette → token/semantic class
**BEFORE:** `className="bg-green-50 text-green-700 border-green-200"`
**AFTER:** `className="ep-pill ep-pill--success"` (if it's a status chip) **or**
`style={{ background: "var(--ep-green-soft)", color: "var(--ep-green)" }}`.
**BEFORE:** `className="bg-indigo-500 text-white"` (a primary action) **AFTER:** `className="bg-primary text-primary-foreground"`.

### 5.6 — Bespoke card → `EPCard`
**BEFORE:** `<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">…</div>`
**AFTER:** `<EPCard>…</EPCard>` (default 18px padding, token border/shadow). For a clickable card add `interactive onClick={…}`.

### 5.7 — Raw KPI tile → `EPKpiCard` (DailyKPIDashboard top metrics)
**BEFORE:**
```tsx
<div className="bg-white rounded-lg p-4 border">
  <p className="text-xs text-gray-500 uppercase">Jami daromad</p>
  <p className="text-2xl font-bold">{formatCurrency(total)}</p>
</div>
```
**AFTER:**
```tsx
<EPKpiCard label="JAMI DAROMAD" staticValue={formatCurrency(total)} icon={TrendingUp} iconBg="fi" />
```
(For counts use `value={n}`; for percent `value={p} formatValue={(n)=>`${n.toFixed(1)}%`}`. **Keep every tile** —
if there were 6 tiles, produce 6 `EPKpiCard`s.)

### 5.8 — Loading / error / empty states
**BEFORE:** `{isLoading && <div>Yuklanmoqda...</div>}` · `{!data && <p>—</p>}`
**AFTER:** `{isLoading ? <EPSkeletonTable rows={8}/> : ...}` · `{rows.length === 0 && <EPEmptyState icon={Inbox} title={t('noData')} />}` ·
top of render: `if (isError) return <EPErrorState onRetry={refetch} />;`

### 5.9 — Page root = `space-y-6` (the shell already pads + scrolls — do NOT re-pad/re-scroll) ⚠️ CORRECTED 2026-06-18
**Live-verified:** `erp-modern-ui/AppShellModern.tsx:180` wraps ALL page content in
`<div className="p-4 lg:p-6" style={{ flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden" }}>{children}</div>`
— i.e. the shell ALREADY provides the page padding AND the scroll container. Therefore a page must **NOT** add its
own padding or `h-full overflow-auto`; doing so double-pads and nests a second scrollbar (cramped/odd scrolling).
The correct page root is plain **`space-y-6`** — exactly the advisor-verified FinanceDashboard MAIN return
(`FinanceDashboard.tsx:208`):
```tsx
<div className="space-y-6" data-testid="<page>-page">
  <EPPageHeader ... />
  {/* KPI row, cards, tables — they scroll inside the shell's own container */}
</div>
```
❌ Do NOT use `flex flex-col h-full p-5 lg:p-6 gap-5 overflow-auto` (the prior version of this section showed that;
it was copied from FinanceDashboard's ERROR path at line 201, which itself double-pads — a pre-existing minor bug,
not the pattern to follow). ✅ Root = `space-y-6`, no own padding, no own scroll.

### 5.10 — Tabs row → `EPPageHeader` children (multi-tab pages: FinanceDashboard, FinanceExtended)
**BEFORE:** a `<TabsList>` floating under a bespoke header.
**AFTER:** keep the `<Tabs>`/`<TabsList>` exactly (same `value`s — §1.2), but render the `TabsList` inside the
header's `children` slot OR directly under `EPPageHeader`. Do not rename any tab `value`.

### 5.11 — Table wrapper → `EPCard padding={0}`
**BEFORE:** `<div className="border rounded-lg overflow-hidden"><table>…</table></div>`
**AFTER:** `<EPCard padding={0} className="overflow-hidden"><table>…</table></EPCard>` (token border/radius; all columns kept).

---

## §6 — PER-PAGE DIRECTIVES (do in group order; commit per group as in §10)

> For **every** page: keep all queries/mutations/tabs/columns/buttons/dialogs. Apply §5 patterns. End-state =
> EPPageHeader present, no inline hex, no Tailwind palette numbers, no bespoke `text-Nxl` page title, states use
> EP components, status uses EPStatusPill, KPI tiles use EPKpiCard, generic surfaces use EPCard. Each block ends
> with a **KEEP** line (the delete-nothing ledger items) and an **ACCEPT** line (per-page pass bar).
>
> ⭐ **SCOPE = the page + ALL its co-located files (§4.1).** Before starting a page, run
> `grep -lE "#[0-9a-fA-F]{6}|(bg|text|border|from|to)-(red|green|blue|...)-[0-9]{3}" <Page>*.tsx` and fix every
> match across `<Page>.tsx` AND `<Page>Sections/Tabs/Dialogs/Cards/Charts/Detail/Extra.tsx`. The page is "done"
> only when all its co-located files are palette/hex-clean too. (The 6.1 pages were prematurely marked done on a
> page-file-only audit — their co-located files in §4.1 still need this pass.)

### Group 6.1 — Class A cleanup (header already present)

#### 1. FinanceDashboard — `/finance-dashboard` · "Bosh Buxgalter" · pages/FinanceDashboard.tsx (335) · A ⚠️GL(payroll tab)
- **Current:** EPH=2, raw=1 (the `bg-amber-100 text-amber-800` in `getStatusBadge`).
- **Find:** `grep -n "bg-amber-100\|flex items-center justify-between mb-8\|getStatusBadge" FinanceDashboard.tsx`
- **Do:** apply §5.1 (move the `<p>` subtitle into `subtitle=`, the tax `Dialog` into `actions=`, drop the
  `mb-8 flex justify-between` wrapper). Apply §5.2 (4 status branches → `EPStatusPill`). The tax-dialog
  `text-[var(--ep-red/green)]` is already correct — leave it.
- **KEEP:** the 4 Tabs (dashboard/payroll/accounts/reports — same `value`s), the tax Dialog + its calculate
  button, the breadcrumb, the period create/calculate/close flows.
- **Don't touch:** `createPeriod`/`calculatePayroll`/`closePeriod`/`seedAccounts` mutations + their URLs (§1.3).
- **ACCEPT:** header consolidated, 4 pills uniform, 0 raw palette; all 4 tabs + dialog still work.

#### 2. CFODashboard — `/cfo/dashboard` · "CFO Dashboard" · pages/CFODashboard.tsx (244) · A
- **Current:** EPH=6 (page header + section headers), **bigH=1** (one bespoke `text-[3-6]xl`).
- **Find:** `grep -n "text-[3-6]xl" CFODashboard.tsx`
- **Do:** replace that one big heading with a `.ep-h2` section title (or fold into the page `EPPageHeader`).
- **KEEP:** all 6 header/section blocks and every CFO KPI/section.
- **ACCEPT:** 0 bespoke big headings; all sections intact.

#### 3. CashFlowManagement — `/finance/cashflow` · "Pul Oqimi" · pages/CashFlowManagement.tsx (162) · A
- **Current:** EPH=2, clean.
- **Do:** confirm `subtitle` set; ensure `isLoading→EPSkeletonTable`, `isError→EPErrorState onRetry`, empty list→`EPEmptyState`.
- **KEEP:** cashflow chart + the inflow/outflow table (all rows/columns).
- **ACCEPT:** states use EP components; data unchanged.

#### 4. BudgetManagement — `/finance/budgets` · "Byudjet" · pages/BudgetManagement.tsx (260) · A
- **Current:** EPH=3, clean.
- **Do:** states check (as #3); ensure header subtitle.
- **KEEP:** budget rows + the budget **save** mutation (mirrors GL `saveBudget` — do NOT touch the mutation).
- **ACCEPT:** states EP; budget save still fires identically.

#### 9. AccountsReceivable — `/accounting/ar` · "Debitorlar" · pages/AccountsReceivable.tsx (172) · A
- **Current:** EPH=3, clean.
- **Do:** invoice status → `EPStatusPill` (paid=success, overdue=danger, pending=warning); states check.
- **KEEP:** AR CRUD (create/edit/delete invoice), aging buckets, all columns.
- **ACCEPT:** statuses are pills; CRUD intact.

#### 10. AccountsPayable — `/accounting/ap` · "Kreditorlar" · pages/AccountsPayable.tsx (172) · A
- **Current:** EPH=3, clean. Mirror of AR.
- **Do:** status → pill; states check.
- **KEEP:** AP CRUD + vendor columns.
- **ACCEPT:** as AR.

#### 14. ChartOfAccounts — `/accounting/chart-of-accounts` · "Hisoblar Rejasi" · pages/ChartOfAccounts.tsx (146) · A ⚠️GL
- **Current:** EPH=2, clean.
- **Do:** header subtitle; wrap account tree/table in `EPCard` (§5.11); token colors.
- **Don't touch:** `/api/gl/accounts`, seed logic, account hierarchy logic (§1.3).
- **KEEP:** the full account tree + all account-type groupings.
- **ACCEPT:** EPCard wrapper; GL logic byte-identical.

#### 24. PricingTiers — `/finance/pricing-tiers` · "Narx Darajalari" · pages/PricingTiers.tsx (285) · A
- **Current:** EPH=2, clean.
- **Do:** uniform `EPCard` tier cards; any tier badge → `EPStatusPill`; states check.
- **KEEP:** every tier + the pricing computation/inputs.
- **ACCEPT:** uniform tier cards; tiers + logic intact.

### Group 6.2 — Inline-hex hotspots

#### 8. DailyKPIDashboard — `/finance/daily-kpi` · "Kunlik KPI" · pages/DailyKPIDashboard.tsx (167) · B
- **Current:** EPH=0, raw=2, **hex=4**.
- **Find:** `grep -nE "#[0-9a-fA-F]{6}" DailyKPIDashboard.tsx` and `grep -nE "(bg|text)-(red|green|blue|amber|...)-[0-9]{3}"`.
- **Do:** add `EPPageHeader` (title "Kunlik KPI", subtitle from existing strap line); convert all 4 inline hex (§5.4);
  convert the top metric tiles to `EPKpiCard` (§5.7) — **keep every metric**; convert the 2 raw palette classes;
  chart colors → `var(--ep-*)`.
- **KEEP:** every KPI metric + any trend chart/series.
- **ACCEPT:** header added; 0 hex; metrics are EPKpiCards (count unchanged).

#### 22. FinanceVariance — `/finance/variance` · "Farq Tahlili" · pages/FinanceVariance.tsx (316) · A
- **Current:** EPH=2, raw=1, **hex=7** (the most).
- **Find:** `grep -nE "#[0-9a-fA-F]{6}" FinanceVariance.tsx`
- **Do:** convert all 7 hex (positive variance→`--ep-green`, negative→`--ep-red`, neutral→`--ep-muted`); 1 raw→token.
- **KEEP:** the variance table + every variance column/row + any drill-down.
- **ACCEPT:** 0 hex, 0 raw; variance table intact.

#### 23. FinanceBreakEven — `/finance/break-even` · "Zararsizlik Nuqtasi" · pages/FinanceBreakEven.tsx (301) · A
- **Current:** EPH=2, **raw=3**, **hex=4**.
- **Find:** hex + raw greps.
- **Do:** convert 4 hex + 3 raw to tokens; break-even chart lines → `var(--ep-*)`.
- **KEEP:** the chart, the cost/price inputs, the computed break-even output.
- **ACCEPT:** 0 hex, 0 raw; chart + computation intact.

### Group 6.3 — Class B "add header + token cleanup"

#### 5. OrderCosting — `/finance/order-costing` · "Buyurtma Tannarxi" · pages/OrderCosting.tsx (157) · B
- **Do:** add `EPPageHeader` ("Buyurtma tannarxi"); 1 raw→token; states check.
- **KEEP:** costing breakdown + all line items. **ACCEPT:** header; 0 raw.

#### 6. FinancialReports — `/finance/reports` · "Hisobotlar" · pages/FinancialReports.tsx (201) · B
- **Do:** add header ("Moliyaviy hisobotlar"); 1 raw→token; states check.
- **KEEP:** every report type + export buttons. **ACCEPT:** header; 0 raw; reports intact.

#### 7. ProductProfitability — `/finance/profitability` · "Foyda Tahlili" · pages/ProductProfitability.tsx (193) · B
- **Do:** add header ("Foyda tahlili"); 1 raw→token; states.
- **KEEP:** profitability table + every product row. **ACCEPT:** header; 0 raw; rows intact.

#### 12. MaterialsAccounting — `/accounting/materials` · "Ombor Hisobi" · pages/MaterialsAccounting.tsx (205) · B
- **Do:** add header ("Ombor hisobi"); 1 raw→token; states.
- **KEEP:** material valuation rows + columns. **ACCEPT:** header; 0 raw.

#### 16. CashRegister — `/accounting/cash-register` · "Kassa" · pages/CashRegister.tsx (129) · B
- **Do:** add header ("Kassa"); page is otherwise clean; states check.
- **KEEP:** cash in/out entries + running balance. **ACCEPT:** header added.

#### 17. IncomeExpense — `/accounting/income-expense` · "Kirim/Chiqim" · pages/IncomeExpense.tsx (250) · B
- **Do:** add header ("Kirim/Chiqim"); 1 raw→token; states.
- **KEEP:** income/expense entries + totals + filters. **ACCEPT:** header; 0 raw.

#### 18. InventoryValuation — `/accounting/inventory-valuation` · "Inventarizatsiya" · pages/InventoryValuation.tsx (351) · B
- **Do:** add header ("Inventarizatsiya"); 1 raw→token; states.
- **KEEP:** valuation method selector + all rows/columns. **ACCEPT:** header; 0 raw.

#### 19. AssetManagement — `/accounting/asset-management` · "Asosiy Vositalar" · pages/AssetManagement.tsx (303) · B
- **Do:** add header ("Asosiy vositalar"); 1 raw→token; states.
- **KEEP:** asset list + depreciation columns + add/edit. **ACCEPT:** header; 0 raw.

#### 21. CfoConfigSettings — `/cfo/config` · "CFO Sozlamalari" · pages/CfoConfigSettings.tsx (168) · B
- **Do:** add header ("CFO sozlamalari"); clean otherwise.
- **KEEP:** every config field + the save action. **ACCEPT:** header; save intact.

### Group 6.4 — GL/payroll-shell + special

#### 11. PayrollAutomation — `/accounting/payroll-automation` · "Ish Haqi" · pages/PayrollAutomation.tsx (216) · B ⚠️GL
- **Current:** EPH=0, **raw=3**.
- **Do:** add header ("Ish haqi avtomatlashtirish"); convert 3 raw-palette classes → tokens; states.
- **Don't touch:** payroll run/calculate/close calls, the calculation display logic (§1.3).
- **KEEP:** every payroll control + result table. **ACCEPT:** header; 0 raw; payroll logic byte-identical.

#### 13. GLDocuments — `/accounting/gl-documents` · "GL Hujjatlar" · pages/GLDocuments.tsx (443) · A ⚠️GL
- **Current:** EPH=3, raw=1, **bigH=3**.
- **Find:** `grep -n "text-[3-6]xl" GLDocuments.tsx`
- **Do:** replace the 3 bespoke big headings with `.ep-h2`/section titles (or fold into page `EPPageHeader`);
  convert the 1 raw color; states.
- **Don't touch:** journal/document **posting** logic (SAP#76) — restyle shell only.
- **KEEP:** all document rows, the create dialog, the line-item table (every column). **ACCEPT:** 0 big headings, 0 raw; posting untouched.

#### 15. PeriodClosing — `/accounting/period-closing` · "Davr Yopish" · pages/PeriodClosing.tsx (294) · B ⚠️GL
- **Current:** EPH=0, **raw=5**.
- **Do:** add header ("Davr yopish"); convert 5 raw-palette classes → tokens; if the page shows numbered closing
  steps, wrap them in `EPNumberedSection` (step/title/active) **without** changing the step or close logic.
- **Don't touch:** the period **close** mutation + the closing-step business logic (§1.3).
- **KEEP:** every closing step + its action button. **ACCEPT:** header; 0 raw; closure logic untouched.

#### 20. FinanceExtended — `/fi/cost-centers` (+transfer-pricing/tax-management/tax-calendar/audit-log/risk-ai) · pages/FinanceExtended.tsx (170) · C
- **Current:** EPH=0, clean. One component serves 6 routes via tabs.
- **Do:** add ONE `EPPageHeader`; token-clean. The 6 tabs share this component — keep all 6 and their content.
  For the `risk-ai` tab: if futuristic, apply Q-41 (§1.4) to that tab only.
- **KEEP:** all 6 tabs/views + their data. **ACCEPT:** header; all 6 tabs intact.

#### 25. AIFinancePage — `/ai/finance` · "AI Moliya" · pages/AIFinancePage.tsx (138) · C (Q-41)
- **Current:** EPH=2, clean.
- **Do:** fix raw i18n keys + any inline hex ONLY. If it's a bespoke futuristic AI page, **do not** impose the
  EP card/header standard; if it already uses `EPPageHeader` plainly, a light token pass is fine.
- **KEEP:** all AI panels/insights. **ACCEPT:** i18n clean; no forced restyle if futuristic.

---

## §7 — DELETE-NOTHING PITFALLS (Finance-specific) ⭐

| Tempting "cleanup" | Why it's WRONG (Q-46) | Do instead |
|---|---|---|
| "9 KPI tiles is too many → show 5" | removes working metrics (the recruiting mistake) | render all 9 as uniform `EPKpiCard`, let them wrap |
| "This table has too many columns" | removes data the owner needs | keep all columns; only restyle header/rows |
| "Two banners stacked → drop one" | removes information | keep both; make them compact (collapse if needed) — don't delete |
| "This secondary button is clutter" | removes an action | keep it; use `variant="outline"/"ghost"` to de-emphasize |
| "This dialog looks old → remove it" | removes a feature | restyle the dialog contents; keep the trigger + logic |
| "Empty page section → delete" | may be a real (currently-empty) view | keep; show `EPEmptyState`, not deletion |
| "Refactor the query to be cleaner" | logic change, regression risk (§1.2) | **do not** touch queries/mutations at all |
| "This GL/payroll calc can be simplified" | forbidden zone (§1.3, SAP#76) | restyle shell only; never touch the calc/posting |

If something is genuinely broken (throws, dead): **do not delete in this pass** — note it in the report under
"Broken-found (advisor to triage)" and leave it. Design pass = zero deletions unless I explicitly approve one.

---

## §8 — i18n (raw keys that render as code)

- After styling, scan Finance pages for raw i18n keys showing as camelCase text. Run the existing filler:
  `node scripts/i18n-fill-from-fallbacks.mjs` (P2's tool — fills locale-missing keys from the in-source fallback,
  mechanical, no guessed translation; uz + uz-cyr only, leaves ru for the Yandex pipeline).
- Then `node scripts/i18n-status.mjs` and confirm **0 missing** for uz/uz-cyr on the namespaces these pages use
  (`finance`, `common`). Do **not** hand-write ru (owner decision: ru → Yandex pipeline).
- If a page calls `t("someKey")` with **no** fallback and the key is missing, add the proper Uzbek value to the
  right namespace file (`src/locales/uz/finance.json` or `common.json`) — real Uzbek, sentence case.

---

## §9 — SELF-VERIFY (mandatory — no "done" without this proof)

Run from repo root `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`:

1. **FE typecheck:** `pnpm --filter erp-dashboard tsc --noEmit` (or the project's tsc) → **0 errors**.
   (After deleting bespoke markup, a leftover import will error — fix it.)
2. **Design tokens guard:** `node scripts/check-design-tokens.mjs` → no new raw-hex / palette violations on the
   Finance pages. (It is diff-aware.)
3. **Sidebar routes guard:** `node scripts/check-sidebar-routes.mjs` → PASS (unchanged count; you didn't add/remove routes).
4. **i18n:** `node scripts/i18n-status.mjs` → uz/uz-cyr 0 missing for `finance`/`common`.
5. **Build (optional but preferred):** `pnpm --filter erp-dashboard build` → succeeds.
6. **Live no-regression** (the important one — DELETE-NOTHING proof): start the dev server and for **each** page:
   - the page loads (no white screen / console error),
   - the **same** data renders (same KPI tile count, same table columns, same rows),
   - dialogs still open, buttons still fire their mutations, tabs still switch.
   - `health 200`, `login 401/422` unaffected.
7. **Screenshots:** capture before/after of at least: FinanceDashboard, DailyKPIDashboard, PeriodClosing,
   GLDocuments, FinanceVariance (the high-change pages). Owner verifies visually.
8. **Backend untouched** → golden-thread harness not required (no BE change). If you somehow touched anything
   under `apps/api`, STOP — that's out of scope for P4.

**Acceptance for the Finance checkpoint:** all 25 pages have `EPPageHeader`; 0 inline hex; 0 Tailwind palette
numbers **across page files AND their co-located `*Sections/*Tabs/*Dialogs/*Cards/*Charts/*Detail/*Extra` files
(§4.1)**; 0 bespoke `text-[3-6]xl` page titles; status via `EPStatusPill`; KPI via `EPKpiCard`; states via EP
components; **every** pre-existing stat/column/button/dialog/tab still present (Q-46); FE tsc 0; guards pass.
**Self-check before claiming done:** `grep -rlE "#[0-9a-fA-F]{6}|(bg|text|border|from|to)-(red|green|blue|indigo|violet|emerald|amber|orange|purple|pink|cyan|teal|rose|sky|lime)-[0-9]{3}"`
over all 25 page prefixes returns **only** AIFinancePage* (if Q-41 futuristic) — everything else clean.

---

## §10 — COMMIT + REPORT

- Commit per group (6.1, 6.2, 6.3, 6.4) so review is incremental. `git add <exact files>` only.
- Commit message format:
  `style(finance): EP-standardize <group> — header/tokens/states, DELETE-NOTHING (P4 1/17)`
- After all groups + §9 pass, **STOP** and report to the advisor with:
  1. Per page: Class, what changed (header added? hex converted count? pill mapping? states?), commit hash.
  2. A **DELETE-NOTHING ledger**: for each page, confirm "stats N→N, columns N→N, buttons N→N, dialogs N→N, tabs
     N→N" (the before/after counts must be **equal**). This is the proof you removed nothing.
  3. Guard outputs (tsc 0, check-design-tokens, check-sidebar-routes, i18n-status).
  4. Screenshots (the 5 high-change pages).
  5. "Broken-found" list (anything throwing/dead you left in place for advisor triage) — or "none".
- Then wait. Advisor verifies (DB/live/Q-40 vision-alignment), owner confirms visually, THEN next module.

---

## §11 — PER-PAGE CHECKLIST (tick each; one line per page)

Mark `[x]` when the page passes §9's per-page bar. Counts in parentheses are the headline work from §4.

Group 6.1 — Class A cleanup:
- [ ] 1. FinanceDashboard — header props (§5.1) + pill mapping (§5.2); payroll mutations untouched
- [ ] 2. CFODashboard — remove 1 bespoke big heading; keep 6 sections
- [ ] 3. CashFlowManagement — states (skeleton/error/empty); subtitle
- [ ] 4. BudgetManagement — states; subtitle; budget save untouched
- [ ] 9. AccountsReceivable — invoice status → pill; states; AR CRUD kept
- [ ] 10. AccountsPayable — status → pill; states; AP CRUD kept
- [ ] 14. ChartOfAccounts ⚠️GL — subtitle + EPCard wrap; GL logic untouched
- [ ] 24. PricingTiers — uniform EPCard tiers; tier badges → pill; tiers kept

Group 6.2 — inline-hex hotspots:
- [ ] 8. DailyKPIDashboard — add header; 4 hex→token; metrics→EPKpiCard (all kept); 2 raw→token
- [ ] 22. FinanceVariance — 7 hex→token; 1 raw→token; variance table kept
- [ ] 23. FinanceBreakEven — 4 hex + 3 raw→token; chart + inputs kept

Group 6.3 — Class B add-header + token:
- [ ] 5. OrderCosting — add header; 1 raw→token
- [ ] 6. FinancialReports — add header; 1 raw→token; report types kept
- [ ] 7. ProductProfitability — add header; 1 raw→token; rows kept
- [ ] 12. MaterialsAccounting — add header; 1 raw→token
- [ ] 16. CashRegister — add header (clean otherwise)
- [ ] 17. IncomeExpense — add header; 1 raw→token; entries kept
- [ ] 18. InventoryValuation — add header; 1 raw→token; rows kept
- [ ] 19. AssetManagement — add header; 1 raw→token; depreciation columns kept
- [ ] 21. CfoConfigSettings — add header (clean); config fields + save kept

Group 6.4 — GL/payroll-shell + special:
- [ ] 11. PayrollAutomation ⚠️GL — add header; 3 raw→token; payroll logic untouched
- [ ] 13. GLDocuments ⚠️GL — 3 bespoke headings removed; 1 raw→token; GL posting untouched; all columns kept
- [ ] 15. PeriodClosing ⚠️GL — add header; 5 raw→token; steps→EPNumberedSection; closure logic untouched
- [ ] 20. FinanceExtended — 1 header; all 6 tabs kept; token-clean; risk-ai tab Q-41 if futuristic
- [ ] 25. AIFinancePage ⚠️Q-41 — i18n + hex only; don't force EP look if futuristic

Final gates:
- [ ] FE tsc 0
- [ ] `node scripts/check-design-tokens.mjs` clean (Finance pages)
- [ ] `node scripts/check-sidebar-routes.mjs` PASS
- [ ] `node scripts/i18n-status.mjs` uz/uz-cyr 0 missing (finance/common)
- [ ] DELETE-NOTHING ledger: every page stats/columns/buttons/dialogs/tabs N→N equal
- [ ] Screenshots of 5 high-change pages
- [ ] Reported to advisor; awaiting owner visual confirm before module 2/17

---

## §12 — APPENDIX: COMMAND CHEATSHEET + GLOSSARY

```bash
# from repo root: C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
# find work on a page:
grep -n "text-[3-6]xl" artifacts/erp-dashboard/src/pages/<Page>.tsx          # bespoke headings
grep -nE "#[0-9a-fA-F]{6}" artifacts/erp-dashboard/src/pages/<Page>.tsx       # inline hex
grep -nE "(bg|text|border|from|to)-(red|green|blue|indigo|violet|emerald|amber|orange|purple|pink|cyan|teal|rose|sky|lime)-[0-9]{3}" artifacts/erp-dashboard/src/pages/<Page>.tsx  # raw palette
grep -n "EPPageHeader" artifacts/erp-dashboard/src/pages/<Page>.tsx           # header present?

# guards / verify:
node scripts/check-design-tokens.mjs
node scripts/check-sidebar-routes.mjs
node scripts/i18n-fill-from-fallbacks.mjs
node scripts/i18n-status.mjs
bash scripts/run-all-reviewers.sh        # all checks

# commit (exact files only):
git add artifacts/erp-dashboard/src/pages/<Page>.tsx
git commit -m "style(finance): EP-standardize <group> — header/tokens/states, DELETE-NOTHING (P4 1/17)"
```

**Glossary:** EP = EuroPrint design system (`components/ep/`). Token = a `--ep-*`/`--mod-*` CSS variable (dark-mode safe).
Class A = page already has EPPageHeader. Class B = needs header added. Class C = AI/extended special.
Q-46 = working-code-never-deleted. Q-41 = AI/futuristic pages exempt from EP standard.
⚠️GL = restyle shell only, never touch posting/closure/calc.

---

## §13 — WORKED EXAMPLE: DailyKPIDashboard end-to-end (Class B, the full recipe)

This is what "done" looks like for one page. Follow the same five steps on every page.

**Step 0 — measure (before):**
```bash
grep -c EPPageHeader artifacts/erp-dashboard/src/pages/DailyKPIDashboard.tsx          # 0  → needs header
grep -nE "#[0-9a-fA-F]{6}" artifacts/erp-dashboard/src/pages/DailyKPIDashboard.tsx     # 4  → convert
grep -nE "(bg|text)-(red|green|blue|amber|emerald|rose)-[0-9]{3}" .../DailyKPIDashboard.tsx  # 2  → convert
```
Record the **delete-nothing baseline** by eye: e.g. "6 KPI tiles, 1 table (5 cols), 1 date-range button".

**Step 1 — add the header; root = `space-y-6` (§5.3, §5.9 — the shell pads+scrolls, do NOT re-pad/re-scroll).**
Wrap the existing return body; do NOT remove any child:
```tsx
return (
  <div className="space-y-6" data-testid="daily-kpi-page">
    <EPPageHeader title="Kunlik KPI" subtitle={t('dailyKpiSubtitle','Kunlik ko‘rsatkichlar')}
      actions={/* the existing date-range button, refresh, CSV — moved here unchanged */} />
    {/* everything that was in the old body goes here, unchanged except the swaps below */}
  </div>
);
```

**Step 2 — KPI tiles → EPKpiCard (§5.7), keep all 6:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  <EPKpiCard label="JAMI DAROMAD"  staticValue={formatCurrency(d.revenue)} icon={TrendingUp} iconBg="fi" />
  <EPKpiCard label="BUYURTMALAR"   value={d.orders}                       icon={ShoppingCart} iconBg="fi" />
  <EPKpiCard label="SAMARADORLIK"  value={d.oee} formatValue={(n)=>`${n.toFixed(1)}%`} icon={Gauge} iconBg="fi" />
  {/* ...the remaining 3 tiles — count must stay 6 */}
</div>
```

**Step 3 — inline hex → token (§5.4), all 4:** e.g. `color:"#16a34a"` → `color:"var(--ep-green)"`,
`background:"#fee2e2"` → `background:"var(--ep-red-soft)"`, chart `stroke="#3b82f6"` → `stroke="var(--ep-blue)"`.

**Step 4 — states (§5.8):** `if (isError) return <EPErrorState onRetry={refetch} />;` at the top;
`isLoading ? <EPSkeletonKpiRow/> : ...`; empty table → `<EPEmptyState icon={Inbox} title={t('noData')} />`.

**Step 5 — verify the delete-nothing ledger:** after the change, re-count: 6 tiles → 6, table 5 cols → 5,
1 button → 1. Equal on both sides. Then `tsc`, `check-design-tokens`, screenshot, commit.

**Result:** header present, 0 hex, 0 raw palette, EP KPI tiles, EP states — and **nothing removed**. That is the
bar for all 25 pages.

---

## §14 — ANTI-PATTERNS + THE ADVISOR REVIEW RUBRIC

### 14.1 — Anti-patterns (the advisor will reject these on sight)
| ❌ Anti-pattern | ✅ Correct |
|---|---|
| Removing a stat/column/button "to declutter" | keep it; restyle/de-emphasize (Q-46) |
| `<h1 className="text-4xl">` page title | `EPPageHeader title=...` |
| `style={{ color: '#16a34a' }}` | `style={{ color: 'var(--ep-green)' }}` |
| `className="bg-amber-100 text-amber-800"` status | `<EPStatusPill tone="warning">` |
| New `<div className="bg-white rounded border shadow p-6">` | `<EPCard>` |
| Editing a `useMutation`/`queryKey` "while I'm here" | leave it; FE-presentation only (§1.2) |
| Touching GL/payroll posting/closure | restyle shell only (§1.3, SAP#76) |
| Forcing EP cards onto a futuristic AI page | leave it (Q-41, §1.4) |
| `git add -A` / committing untracked files | `git add <exact file>` only (§1.5) |
| Inventing an EP prop that isn't in §2 | use only the documented props |

### 14.2 — The rubric the advisor applies to your report (know it before you submit)
1. **DELETE-NOTHING ledger present and balanced?** Every page shows stats/columns/buttons/dialogs/tabs N→N
   equal. If any count dropped, the checkpoint is **rejected** until restored. (This is the #1 gate.)
2. **Live no-regression?** Advisor opens the high-change pages: same data, dialogs open, mutations fire. A blank
   screen or a missing feature = reject.
3. **Standard actually applied?** `grep` across the 25 pages: 0 inline hex, 0 Tailwind palette numbers, 0 bespoke
   `text-[3-6]xl` page titles, every page has `EPPageHeader`. Partial = back to the unfinished pages.
4. **Logic untouched?** `git diff` shows no change to queries/mutations/URLs/schemas/BE. Any logic diff = reject.
5. **Guards green?** tsc 0, check-design-tokens clean, check-sidebar-routes PASS, i18n-status uz/uz-cyr 0 missing.
6. **Vision alignment (Q-40)?** The page still does what the owner expects it to do — design changed, purpose didn't.
Only when all six pass does the owner do the visual confirm and we move to module 2/17.

---

## §15 — FAQ / EDGE CASES

- **Q: A page has a genuinely broken section (throws / shows fake hardcoded data). Delete it?**
  A: **No — not in this pass.** Note it under "Broken-found" in the report and leave it in place. The advisor
  decides (Q-46 deletion needs proof + owner gate). Design pass = zero deletions.
- **Q: The KPI row is cramped with 9 tiles. Reduce to 5?**
  A: **No.** Keep all 9; make them a uniform `EPKpiCard` grid that wraps (e.g. `grid-cols-2 md:grid-cols-3
  xl:grid-cols-5`). Tidiness comes from uniformity + wrapping, not deletion.
- **Q: A chart library wants a literal color, not a CSS var. Can I keep the hex?**
  A: Pass `"var(--ep-blue)"` as the string — most libs (Recharts/Chart.js) resolve CSS vars. If one truly cannot,
  leave a single `// design-token-exception: <lib> needs literal` comment so the guard/advisor knows it's intentional.
- **Q: EPPageHeader already present but the page also has a stray `<h1>`/`<p>` subtitle. Remove the `<h1>`?**
  A: Don't "remove" content — **migrate** the subtitle text into the `subtitle=` prop, then delete the now-empty
  duplicate markup wrapper. The text survives; only redundant markup goes.
- **Q: A status has a state I can't map to a tone.**
  A: Use `tone="neutral"`. Never invent a tone outside success/warning/danger/info/brand/neutral.
- **Q: tsc errors after I swap a component.**
  A: Usually a leftover import of the removed bespoke markup, or a missing `import { EPx } from "@/components/ep"`.
  Fix the import; never silence with `@ts-ignore`.
- **Q: Should I touch the POS Monitor / `pos-monitor` sidebar item under Moliya?**
  A: No — `pos-monitor` is its own app surface, not one of the 25 Finance pages in §4. Out of scope here.
- **Q: The page already looks fine (Class A, clean). Do I still need to commit it?**
  A: Yes — at minimum confirm `EPPageHeader` is present with a `subtitle`, states use EP components, and run the
  greps to prove 0 hex / 0 palette. If it's already perfect, record it in the report as "verified, no change
  needed" — don't make a cosmetic no-op edit just to have a diff.
- **Q: A dialog/form inside a page uses raw colors. Is that in scope?**
  A: Yes — the page includes its dialogs. Restyle the dialog's colors/markup to tokens/EP too, but keep every
  field, the submit button, and the mutation it calls (§1.2). The dialog is a feature; only its skin changes.
- **Q: I finished 20 of 25 pages and ran out of time. Commit partial?**
  A: Yes — commit the finished groups (they're independently valid), report exactly which pages are done vs
  pending, and STOP. Do not mark the Finance checkpoint "complete" until all 25 pass §9. Partial honesty > false done.
- **Q: A page imports a shared section component also used by another module. Restyle it?**
  A: Be careful — if the shared component is used outside Finance, restyling it changes those pages too. Apply
  tokens (safe, dark-mode-correct everywhere) but do NOT restructure its layout; note the shared usage in the report.

---

## §16 — REUSE FOR NEXT MODULE (template note)

When Finance is verified by advisor + owner, the next module's directive copies **§1–§3, §5, §7, §9, §10, §12
verbatim** (they are module-agnostic) and replaces only:
- **§4** — re-run the per-page audit grep (EPH/raw/bigH/hex) on that module's route file → new current-state table.
- **§6** — per-page blocks for that module's pages, with module-specific ⚠️ zones (e.g. for Production: don't
  touch MES/scheduling logic; for Warehouse: don't touch stock-movement posting).
- **§11** — per-page checklist for that module.
The EP standard itself never changes — that's the whole point of standardization. One module per checkpoint;
advisor + owner sign-off between each.

## §17 — EXACT FILE PATHS + PER-GROUP COMMIT PLAN (zero ambiguity)

All paths relative to repo root `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`. Some pages have
co-located helper files (`*Tabs.tsx`, `*Types.tsx`, `*Section.tsx`) — if you restyle inside them, `git add` them
too, but **only the ones you actually edited**.

**Group 6.1 files (Class A cleanup):**
```
artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx
artifacts/erp-dashboard/src/pages/FinanceDashboardTabs.tsx        # if edited
artifacts/erp-dashboard/src/pages/FinanceDashboardPayrollTab.tsx  # if edited (DON'T touch payroll logic)
artifacts/erp-dashboard/src/pages/FinanceDashboardTabsExtra.tsx   # if edited
artifacts/erp-dashboard/src/pages/CFODashboard.tsx
artifacts/erp-dashboard/src/pages/CashFlowManagement.tsx
artifacts/erp-dashboard/src/pages/BudgetManagement.tsx
artifacts/erp-dashboard/src/pages/AccountsReceivable.tsx
artifacts/erp-dashboard/src/pages/AccountsPayable.tsx
artifacts/erp-dashboard/src/pages/ChartOfAccounts.tsx
artifacts/erp-dashboard/src/pages/PricingTiers.tsx
```
Commit: `git commit -m "style(finance): EP-standardize Class-A pages — header/tokens/states, DELETE-NOTHING (P4 1/17)"`

**Group 6.2 files (inline-hex hotspots):**
```
artifacts/erp-dashboard/src/pages/DailyKPIDashboard.tsx
artifacts/erp-dashboard/src/pages/FinanceVariance.tsx
artifacts/erp-dashboard/src/pages/FinanceBreakEven.tsx
```
Commit: `git commit -m "style(finance): convert inline hex/raw palette to tokens — DELETE-NOTHING (P4 1/17)"`

**Group 6.3 files (Class B add-header):**
```
artifacts/erp-dashboard/src/pages/OrderCosting.tsx
artifacts/erp-dashboard/src/pages/FinancialReports.tsx
artifacts/erp-dashboard/src/pages/ProductProfitability.tsx
artifacts/erp-dashboard/src/pages/MaterialsAccounting.tsx
artifacts/erp-dashboard/src/pages/CashRegister.tsx
artifacts/erp-dashboard/src/pages/IncomeExpense.tsx
artifacts/erp-dashboard/src/pages/InventoryValuation.tsx
artifacts/erp-dashboard/src/pages/AssetManagement.tsx
artifacts/erp-dashboard/src/pages/CfoConfigSettings.tsx
```
Commit: `git commit -m "style(finance): add EPPageHeader + tokens to Class-B pages — DELETE-NOTHING (P4 1/17)"`

**Group 6.4 files (GL/payroll-shell + special):**
```
artifacts/erp-dashboard/src/pages/PayrollAutomation.tsx     # ⚠️ shell only, payroll logic untouched
artifacts/erp-dashboard/src/pages/GLDocuments.tsx           # ⚠️ shell only, GL posting untouched
artifacts/erp-dashboard/src/pages/PeriodClosing.tsx         # ⚠️ shell only, closure logic untouched
artifacts/erp-dashboard/src/pages/FinanceExtended.tsx
artifacts/erp-dashboard/src/pages/AIFinancePage.tsx         # ⚠️ Q-41, don't force EP if futuristic
```
Commit: `git commit -m "style(finance): EP-standardize GL/payroll shells + AI page (Q-41) — DELETE-NOTHING (P4 1/17)"`

Plus any locale files you fill: `git add artifacts/erp-dashboard/src/locales/uz/finance.json artifacts/erp-dashboard/src/locales/uz/common.json` (+ uz-cyr equivalents). **Never** add ru files (Yandex pipeline).

---

## §18 — EP COMPONENT DECISION TREE (which component for which situation)

```
Is it the page title block?            → EPPageHeader (title/subtitle/breadcrumb/actions/status)
Is it a top-of-page metric number?     → EPKpiCard (value|staticValue, icon, iconBg="fi")
Is it a status word (paid/open/...)?   → EPStatusPill (tone=success/warning/danger/info/brand/neutral)
Is it a generic panel/box/table-wrap?  → EPCard (padding, module="fi", interactive?)
Is the query erroring?                 → EPErrorState (onRetry=refetch)  [early return]
Is the query loading?                  → EPSkeletonKpiRow / EPSkeletonTable / EPSkeletonCard
Is the list empty?                     → EPEmptyState (icon, title, action?)
Is it a numbered/step flow?            → EPNumberedSection (step, title, active)
Is it a genuine placeholder view?      → EPComingSoon  (NEVER to replace a working view)
Is it a small inline spinner?          → EPLoader (size, tone) / EPSpinnerBlock
None of the above (bespoke widget)?    → keep it, just apply tokens (§3) + .ep-* utility classes
```

**EPSkeleton variants (loading):** `EPSkeletonKpiRow({count=4})` for the KPI strip; `EPSkeletonTable({rows=6,
cols=5})` for tables; `EPSkeletonCard({lines=3})` for a panel; `EPSkeletonBar` for a single line. Pick the shape
that matches what's loading so the layout doesn't jump.

**EPKpiCard count-up:** numeric `value` animates 0→value automatically (via `useCountUp`); for non-numeric
(currency string, "48 / 50", "—") use `staticValue` to skip the animation. Don't call `useCountUp` yourself.

**Icon import:** all icons are `lucide-react` (e.g. `import { TrendingUp, Wallet, Inbox, Gauge } from "lucide-react";`).
Pick a sensible Finance icon per KPI; reuse what the page already imports where possible.

**When in doubt:** the component is almost always the answer. Hand-rolled markup is the exception, and when you do
hand-roll, it must use tokens (no hex, no palette numbers) and EP typography/utility classes.

---

> END OF DIRECTIVE — Finance (module 1/17). DELETE-NOTHING. Restyle, don't remove.
