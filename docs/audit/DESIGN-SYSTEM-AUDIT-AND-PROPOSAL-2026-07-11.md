# EuroPrint ERP — Design System Audit + Unification Proposal (2026-07-11)

This was a strictly read-only design audit; no code was changed. The only artifact is the one
proposal document below.

## What this document is

A read-only inventory of visual/layout inconsistency across the EuroPrint ERP frontend
(`artifacts/erp-dashboard/src`), a root-cause trace for a representative sample of the worst
offenders, and a proposed unified design system to fix them — **proposal only, not applied**.
Produced by 9 read-only agents (8 parallel inventory/root-cause agents + this synthesis pass),
plus direct static-code tracing of the flagship CRM Kanban layout bug by the orchestrating
session. No file in this repository was created, edited, or deleted except this one document.
One incidental note on process: an early attempt to add a temporary dev-server port to
`.claude/launch.json` for live-browser verification was correctly blocked by the permission
system as an unrequested self-modification of shared tooling config — every finding below is
static-code-analysis-only as a result, with that limitation called out explicitly wherever it
matters (see Part 1b §6).

## Executive summary — five things worth knowing before reading further

1. **The "peach/cream modal" the owner flagged is not scattered inline styling — it is one CSS
   variable.** `erp-modern-ui/europrint-mockup-theme.css` sets `--background`/`--ep-bg` to
   `#F5E6E1` (a "SHIPNOW warm-blush" experiment from 2026-05-29), and shadcn's shared
   `DialogContent`/`AlertDialogContent`/`SheetContent` components hardcode `bg-background` as
   their **unconditional default**. Roughly 75-80% of the ~430 `DialogContent` instances in the
   app are peach purely by inheritance, with zero color-related code in the calling file. The
   canonical design doc (`DIZAYN_QOIDALARI.md`, written three weeks *after* the blush commit)
   already documents the intended value as `#FAFAF9` — the CSS was simply never reconciled to the
   doc that superseded it. **This means the single highest-leverage fix in this entire proposal
   is a two-line CSS correction, not a page-by-page migration.** (Part 1 §1, Part 2 #1-3.)
2. **The CRM Kanban cutoff bug is app-wide, not CRM-specific — and its fix is also one line.**
   `AppShellModern.tsx`'s shared page-content wrapper (parent of every routed page) hardcodes
   `overflowX: "hidden"`, unrevisited since 2026-05-14. Up to ~88 components across the app that
   correctly implement their own `overflow-x-auto` are silently defeated by this one ancestor.
   (Part 1b.)
3. **A canonical component library exists and is well-designed (`components/ep/`,
   `DIZAYN_QOIDALARI.md`) — but it has two structural gaps (no modal, no table component) and is
   inconsistently reached for even where it does apply** (`EPPageHeader` adoption: 42.5% of routed
   pages by exhaustive count). The "no shared system exists" framing this task's own instructions
   raised as a possibility turned out to be the less common story: **6 of 9 root-caused instances
   are "a good component already existed and wasn't used," only 1 of 9 is a genuine structural
   gap with no existing pattern to reuse, and a fully-built, zero-adoption generic table
   component (`components/dizayn-new/DataTable.tsx`) has sat unused since the project's first
   commit.** (Part 2.)
4. **The table-separation complaint is real but concentrated, not universal** — 30 of 40 sampled
   tables already have proper visual separation; the unseparated minority clusters specifically
   in Finance (GL, AR/AP, budget, cash flow) and SD (customers, contracts, quotes, orders) — i.e.
   exactly the pages the owner looks at daily — via a second, competing "flat card"
   (`bg-card rounded-xl`, no border/shadow) convention used in parallel with the properly-bordered
   one. (Part 1 §3.)
5. **The proposal below deliberately does NOT reinvent the app's visual language from scratch.**
   The existing orange accent (`#FF902F`) and warm-neutral background direction are kept and
   explicitly justified against this project's own "generic AI-default" warning (Part 4). What's
   proposed is: fix the two token-layer bugs above, fill the two missing component gaps (modal
   surface color, canonical table) by promoting patterns that already exist and already work well
   in this same codebase (POS Monitor's table treatment, the existing wizard stepper, the
   long-unused `DataTable.tsx`), and consolidate the page-shell duplication that's causing the
   spacing drift.

---
# Part 1 — Inventory of the Actual Scope of Inconsistency

*Produced by 6 parallel read-only agents. Each section below is that agent's full report,
reorganized under the task's own Part 1 item numbering — content is theirs, verbatim, only
headers/framing added for assembly.*

# Part 1, Item 1 — Modal/Dialog Component Inventory

## Headline finding: the "peach/cream" background is not a per-modal styling choice — it is a single hijacked CSS variable, inherited by nearly every modal in the app by default

Before the itemized inventory, one discovery changes how every row in the table below should be read.

**`artifacts/erp-dashboard/src/erp-modern-ui/europrint-mockup-theme.css`** (imported in `index.css` *after* `design-tokens.css`, explicitly commented `/* EP Linear Soft theme (overrides base tokens) */` — i.e. it is the deliberate final-layer override) sets:

```css
--ep-bg:      #F5E6E1;   /* SHIPNOW warm-blush page bg */
--background: 15 50% 92%;    /* #F5E6E1 — SHIPNOW warm blush */
```

`15 50% 92%` in HSL converts to **`#F5E6E0`** — functionally identical to the owner's screenshot description of `~#F5E6DC` (a 4-unit difference in the blue channel, invisible to the eye). This directly contradicts the canonical `--ep-bg:#FAFAF9` documented in `DIZAYN_QOIDALARI.md`. `design-tokens.css` itself even carries the comment `/* Overridden by europrint-mockup-theme.css (Layer 2) */` at line 3, confirming this is a known, intentional second layer, not an accident.

This variable is registered as a Tailwind theme color in `index.css`: `--color-background: hsl(var(--background))`. That means every Tailwind `bg-background` class anywhere in the app resolves to this peach/blush color, not near-white.

Critically, **the shared shadcn `DialogContent` component itself hardcodes this class as its unconditional default background**:

- `artifacts/erp-dashboard/src/components/ui/dialog.tsx:49` — `"...border bg-background p-6 shadow-lg...sm:rounded-lg"`
- `artifacts/erp-dashboard/src/components/ui/alert-dialog.tsx:42` — identical `bg-background ... sm:rounded-lg`
- `artifacts/erp-dashboard/src/components/ui/sheet.tsx:40` — identical `bg-background`

Since the vast majority of call sites (see table) pass only sizing classes (`max-w-2xl p-6`, `max-h-[90vh] overflow-y-auto`, etc.) and never override the background, **every one of those dialogs is peach by inheritance alone, with zero code in the calling file mentioning color.** Only the minority of files that explicitly add `bg-card` (white, `--card: 0 0% 100%`) escape it. A few files go further and explicitly re-assert `bg-background` — i.e. someone deliberately typed the peach class — which is the closest literal-code match to the owner's screenshots:

- `artifacts/erp-dashboard/src/pages/PapkaOrdersDialogs.tsx:52` (**PP module**) — `className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-none shadow-lg p-6"`
- `artifacts/erp-dashboard/src/pages/SalesOrdersDialogs.tsx:159` (**SD module**) — `className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-none shadow-lg p-6"`

These are exactly the two modules (PP, SD) the owner's screenshots called out. Literal hex strings `F5E6DC`/`f5e6dc`/`F4F1EA`/`f4f1ea` were grepped across the entire `src` tree and appeared **zero times** — the peach the owner is seeing is not a copy-pasted hex anywhere in a modal file, it is the computed value of the app-wide `--background` token, surfaced through the shared `DialogContent`/`AlertDialogContent`/`SheetContent` primitives.

---

## Modal/dialog instance table (32 sampled, spread across modules)

| # | File | Background value (as coded) | Border-radius | Shared component / one-off | Module |
|---|------|------------------------------|----------------|------------------------------|--------|
| 1 | `pages/PapkaOrdersDialogs.tsx:52` | `bg-background` (explicit, peach `#F5E6E1`) | `sm:rounded-lg` (default) | shadcn `DialogContent` | PP |
| 2 | `pages/SalesOrdersDialogs.tsx:159` | `bg-background` (explicit, peach `#F5E6E1`) | `sm:rounded-lg` (default) | shadcn `DialogContent` | SD |
| 3 | `pages/DesignOrders.tsx:178` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | PP |
| 4 | `pages/BOMManagement.tsx:284` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | PP |
| 5 | `pages/TechCardsDialogs.tsx:65` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | PP |
| 6 | `pages/SDCustomersDialogs.tsx:36` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | SD |
| 7 | `pages/SDLeads.tsx:527` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | SD |
| 8 | `components/sd/Customer360View.tsx:330` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | SD |
| 9 | `pages/crm/RobotsViewDialog.tsx:52` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | CRM |
| 10 | `pages/CRMSettingsDialogs.tsx:67` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | CRM |
| 11 | `pages/crm/QuickCreateModal.tsx:144` | `bg-card` (explicit, white) | `rounded-lg` (explicit) | **one-off** `motion.div` (framer-motion, not `<Dialog>`) | CRM |
| 12 | `components/finance/income-expense/TransactionDialog.tsx:59` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Finance |
| 13 | `components/finance/income-expense/CategoryDialog.tsx:60` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Finance |
| 14 | `pages/BudgetManagementDialogs.tsx:44` | `bg-card border-none` (explicit, white) | `rounded-xl` (explicit) | shadcn `DialogContent`, overridden | Finance |
| 15 | `pages/CashFlowManagementDialogs.tsx:36` | `bg-card border-none` (explicit, white) | `rounded-xl` (explicit) | shadcn `DialogContent`, overridden | Finance |
| 16 | `components/production/report/ShiftDetailModal.tsx:90` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | MES |
| 17 | `components/production/report/CreateShiftModal.tsx:62` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | MES |
| 18 | `pages/qc/QCParameterDialog.tsx:146` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | QC |
| 19 | `pages/QCApprovalDialogs.tsx:264` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | QC |
| 20 | `components/wms/MaterialDialog.tsx:111` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | WMS |
| 21 | `components/wms/receiving/ItemEntryDialog.tsx:59` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | WMS |
| 22 | `pages/warehouse/RollManagementPage.tsx:148` | `<Card>` default → `bg-card` (white) | `rounded-[10px]` (from `ui/card.tsx`) | **one-off** custom `fixed inset-0` overlay wrapping shared `<Card>` | WMS |
| 23 | `pages/MMPurchaseOrders.tsx:292` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | MM |
| 24 | `pages/MMExtendedDialogs.tsx:33` | `bg-card border-none` (explicit, white) | `rounded-xl` (explicit) | shadcn `DialogContent`, overridden | MM |
| 25 | `pages/LMSExtended.tsx:200` | `bg-card border-border` (explicit, white) | `sm:rounded-lg` (default, no radius override) | shadcn `DialogContent`, bg overridden only | LMS |
| 26 | `components/AddCourseDialog.tsx:217` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | LMS |
| 27 | `pages/MarketingCampaigns.tsx:198` | `bg-card border-none` (explicit, white) | `sm:rounded-lg` (default) | shadcn `DialogContent`, bg overridden | Marketing |
| 28 | `pages/MarketingLeadsDialogs.tsx:56` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Marketing *(inconsistent w/ #27 in same module)* |
| 29 | `pages/kanban/FlowsDialog.tsx:91` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Kanban |
| 30 | `pages/kanban/TemplatesDialog.tsx:146` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Kanban |
| 31 | `pages/iot/IoTProductionDashboard.tsx:66` | `bg-card border-border` (explicit, white) | `sm:rounded-lg` (default) | shadcn `DialogContent`, bg overridden | IoT |
| 32 | `pages/iot/IoTChecklistModal.tsx:43` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | IoT *(inconsistent w/ #31 in same module)* |
| 33 | `components/cc/NewDocumentModal.tsx:161` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | CC (Communication Center) |
| 34 | `components/cc/DocumentDetailModal.tsx:110` | none set → inherits `bg-background` (peach), `p-0` | `sm:rounded-lg` (default) | shadcn `DialogContent` | CC |
| 35 | `pages/SuperAdminPanelSections.tsx:113` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Admin/SuperAdmin |
| 36 | `pages/SecurityExtendedDialogs.tsx:36` | `bg-card border-border` (explicit, white) | `sm:rounded-lg` (default) | shadcn `DialogContent`, bg overridden | Security/Director-adjacent |
| 37 | `pages/CoordinationDocsDialogs.tsx:68` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Coordination |
| 38 | `components/chat/page/RoomSettingsModal.tsx:88` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | Chat/Notifications-adjacent |
| 39 | `components/hr/JobOfferDialog.tsx:109` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | HR |
| 40 | `components/hr/org/CardDetailDialog.tsx:190` | none set → inherits `bg-background` (peach) | `sm:rounded-lg` (default) | shadcn `DialogContent` | HR-Org |
| 41 | `camera-ai-modern/components/CameraMissionEditor.tsx:88` | `bg-card` + `border-cyan-500/30` (explicit, white) | `sm:rounded-xl` (explicit) | shadcn `DialogContent`, heavily overridden | AI (Camera) |
| 42 | `pages/cameras-management-dialogs.tsx:230` vs `:277` | one `bg-card rounded-xl` (white), the other unset (peach) — **two different backgrounds in the same file** | mixed (`rounded-xl` vs default) | shadcn `DialogContent` | AI/Camera |
| 43 | `pages/accountant/AuditConsoleDialogs.tsx:28` | `<Card>` default → `bg-card` (white) | `rounded-[10px]` (from `ui/card.tsx`) | **one-off** custom `fixed inset-0 bg-black/50` overlay wrapping `<Card>` | Finance/Admin |
| 44 | `pages/GLDocuments.tsx:413` | none set → inherits `bg-background` (peach), no `p-6` at all | `sm:rounded-lg` (default) | shadcn `DialogContent` | Finance/GL |

---

## Peach/cream pattern hunt (owner's ~`#F5E6DC` description)

- **Literal hex `F5E6DC` / `f5e6dc` / `F4F1EA` / `f4f1ea`**: zero matches anywhere in `artifacts/erp-dashboard/src`. No modal file hardcodes this color directly.
- **The actual source**: `erp-modern-ui/europrint-mockup-theme.css:26,47` — `--ep-bg` and `--background` both set to `#F5E6E1` / `15 50% 92%`, which renders as **`#F5E6E0`**, a match within 4 units of blue channel to the owner's `#F5E6DC` estimate (indistinguishable on screen, well within screenshot JPEG/compression tolerance).
- **Files that explicitly, deliberately re-type `bg-background`** (i.e. a human wrote the peach class on purpose, not just left it unset): `pages/PapkaOrdersDialogs.tsx:52` (**PP**) and `pages/SalesOrdersDialogs.tsx:159` (**SD**) — these are the two exact modules the owner's screenshots singled out.
- No Tailwind `bg-orange-50` / `bg-amber-50` literal was found used as a *modal container* background in the sample — those two classes appear ~185 times repo-wide but overwhelmingly as small inline warning/badge chips inside cards and dashboards (e.g. `components/cc/DocumentDetailModal.tsx:155`, `pages/agents/QualityDashboard.tsx:81`), not as the full-dialog surface. They are a visually adjacent but functionally distinct pattern from the full-dialog peach.

## Rough counts

- **Distinct literal background *expressions* observed across the sampled modals**: 4 — (1) unset/default `bg-background` (peach `#F5E6E0`) — by far the majority; (2) explicit `bg-background` (same peach, restated); (3) explicit `bg-card` alone or with `border-none`/`border-border` (white `#FFFFFF`); (4) a handful of one-off custom overlays (`crm/QuickCreateModal.tsx`, `warehouse/RollManagementPage.tsx`, `accountant/AuditConsoleDialogs.tsx`) that wrap the shared `<Card>` and land on white via a completely different code path (`fixed inset-0` div + Card, not `<Dialog>` at all).
- **Visual-pattern breakdown across the 44 files/instances above and the ~250+ additional `DialogContent` call sites scanned in bulk (`grep` totals: ~430 `DialogContent className=` occurrences repo-wide)**:
  - **Peach/cream card** (default or explicit `bg-background`, `sm:rounded-lg`): roughly **75–80%** of all `DialogContent` instances scanned — this is the dominant, unintentional default, not an edge case. It shows up in HR, PP, SD, CRM, Finance, MES, QC, WMS, MM, Kanban, Coordination, Admin, and half of IoT/Marketing.
  - **White card** (explicit `bg-card`, sometimes with `rounded-xl` override): roughly **15–20%**, concentrated in Marketing, MM, Finance-budget dialogs, LMS, IoT, Security, and the camera-AI module — these look like isolated fixes applied file-by-file rather than a systemic pattern, since sibling files in the *same* module (Marketing: `MarketingCampaigns.tsx` white vs `MarketingLeadsDialogs.tsx` peach; IoT: `IoTProductionDashboard.tsx` white vs `IoTChecklistModal.tsx` peach) disagree with each other.
  - **"Something else" — one-off custom overlays** (`fixed inset-0` + hand-built `<Card>`/`motion.div`, bypassing `<Dialog>` entirely): a small remainder, roughly **5%**, found in `pages/crm/QuickCreateModal.tsx`, `pages/warehouse/RollManagementPage.tsx`, `pages/accountant/AuditConsoleDialogs.tsx`, and similar files — these render white by accident of using `<Card>`, not by following any documented modal spec.
  - The "full white multi-step wizard with numbered circles" example (`pages/OrderCreationWizard.tsx` + `components/orders/WizardStepper.tsx`/`WizardHeader.tsx`) is **not a modal at all** — it is a route-level page (`Card className="bg-card border-none shadow-sm"`), confirming it is architecturally a different code path from the Dialog-based peach modals, even though the owner is visually comparing them side by side as "PP screens."

**Files referenced in this section** (all read-only): `DIZAYN_QOIDALARI.md`; `artifacts/erp-dashboard/src/index.css`; `artifacts/erp-dashboard/src/erp-modern-ui/europrint-mockup-theme.css`; `artifacts/erp-dashboard/src/erp-modern-ui/design-tokens.css`; `artifacts/erp-dashboard/src/components/ui/dialog.tsx`; `artifacts/erp-dashboard/src/components/ui/alert-dialog.tsx`; `artifacts/erp-dashboard/src/components/ui/sheet.tsx`; `artifacts/erp-dashboard/src/components/ui/card.tsx`; plus the 44 modal files enumerated in the table.

---

# Part 1, Item 2 — Create/Edit Flow UI-Pattern Inventory (20 modules)

*Read-only inventory. All findings below are descriptive classifications of the current codebase state — none of this is a proposal or an instruction to change anything.*

## Table: module | flow | file(s) | UI pattern

| # | Module | Flow (create unless noted) | File(s) | Columns | Classification |
|---|--------|------|---------|---------|----------------|
| 1 | **Org** | "Yangi KARTA" — `AddNodeDialog` | `artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx` (`DialogContent className="max-w-md p-6..."`, `grid grid-cols-2` at :208), used from `pages/OrgStructureHierarchy.tsx` | 2-col | **Simple modal** (centered Radix Dialog) |
| 2 | **HR** | "Yangi xodim qo'shish" / edit — `EmployeeDialog` / `EditEmployeeDialog` | `artifacts/erp-dashboard/src/components/EmployeeDialog.tsx` (`DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6"` :230; sub-section `components/hr/employee-dialog/BasicInfoSection.tsx` :14 `grid-cols-2`), used from `pages/Employees.tsx` :359-364. Edit mirror: `components/employee/dialogs/EditEmployeeDialog.tsx` :67 | 2-col | **Simple modal**, large (7 stacked `<section>`s inside one scrolling Dialog, not tabs/steps) |
| 3 | **Finance** | "Hujjat yaratish" (GL document) | `artifacts/erp-dashboard/src/pages/GLDocuments.tsx` :412-464 (`DialogContent className="sm:max-w-[440px]"`, self-contained, no sub-file) | 1-col | **Simple modal**, small/narrow variant |
| 4 | **Coordination** | "Yangi dokla" — `CreateDoklaDialog` | `artifacts/erp-dashboard/src/pages/CoordinationPageDialogs.tsx` :58 (`DialogContent className="max-w-lg p-6"`), used from `pages/CoordinationPage.tsx` :327-331 | 1-col | **Simple modal** |
| 5 | **Director** | "Yangi vazifa" (strategic task) | `artifacts/erp-dashboard/src/pages/StrategicTasksPanel.tsx` :370-407 (`<DialogContent>` unstyled = shadcn default `max-w-lg`, self-contained) | 1-col | **Simple modal** |
| 6 | **SD** | "Yangi buyurtma" (sales order) | `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx` :597-762 (`<DialogContent>` default width, self-contained) | 1-col | **Simple modal** |
| 7 | **PP** | (a) "Yangi operatsiya" — `OperationFormDialog`; (b) "Yangi buyurtma yaratish" — `OrderCreationWizard` | (a) `artifacts/erp-dashboard/src/pages/planning/PlanningDialogsA.tsx` :32-147 (`DialogContent className="max-w-2xl p-6"`), wired via `pages/PlanningBoard.tsx` :260, alt. `pages/RoutingConfigurationDialogs.tsx` :70-207 `AddOperationDialog` (same family, `className="p-6"`, `grid-cols-2`); (b) `pages/OrderCreationWizard.tsx` (route `/order-create`) + `components/orders/{WizardHeader,WizardStepper,CustomerStep,ProductsStep,PricingStep,DeliveryStep,ReviewStep}.tsx` | (a) 2-col / (b) n/a | **(a) Simple modal** vs **(b) multi-step wizard (numbered steps/progress rail)** — see Item 3 |
| 8 | **MES** | "Ish markazi yaratish" (work center) | `artifacts/erp-dashboard/src/pages/MESWorkCentersDialogs.tsx` :30-81 `CreateWCDialog` (`<DialogContent>` default width), used from `pages/MESWorkCenters.tsx` :90-98 | 1-col | **Simple modal** |
| 9 | **QC** | "Brak qo'shish" (defect record) | `artifacts/erp-dashboard/src/pages/qc/QCBraksTab.tsx` :261-340 (`DialogContent className="max-w-lg p-6"`, `grid-cols-2` at :268,278), trigger button :86 | 2-col | **Simple modal** |
| 10 | **WMS** | "Kirim" (goods receiving) — 5-step wizard; edit/detail = `ReceiptDetailSheet` | Create: `artifacts/erp-dashboard/src/pages/WarehouseKirimWizard.tsx` + `WarehouseKirimWizardSteps.tsx` + `WarehouseKirimWizardSections.tsx` (route `/wms/kirim-new`). Detail: `components/wms/receiving/ReceiptDetailSheet.tsx` :59 (`SheetContent className="w-full sm:max-w-4xl..."`), used from `pages/GoodsReceiving.tsx` :221 | n/a | **Create = multi-step wizard** (own `StepIndicator`, comment: *"5 bosqichli kirim wizard"*); **edit/detail = slide-over panel** |
| 11 | **MM** | "Yetkazib beruvchi qo'shish" (vendor) — `CreateVendorDialog` | `artifacts/erp-dashboard/src/pages/MMVendorsDialogs.tsx` :43-76 (`DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6"`), used from `pages/MMVendors.tsx` :188 (Plus button) | 1-col | **Simple modal**. ⚠️ Side finding: `pages/MMPurchaseOrders.tsx` also declares a full create-PO stack (`useState openDialog`, `createMutation`, react-hook-form `POFormValues`, imported `DialogTrigger`/`Plus`) but **none of it is rendered in JSX** — no `<Plus` element, no `<Form>`/`<FormField>` usage, and `openDialog` is set but never read. The only `<Dialog>` actually rendered in that file (:291-365) is the **view**-PO dialog, not create. Purchase-order creation is currently unreachable from this page's UI. |
| 12 | **LMS** | "Kurs qo'shish" — `AddCourseDialog` | `artifacts/erp-dashboard/src/components/AddCourseDialog.tsx` :217-263 (`DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6"`), used from `pages/Courses.tsx` :304-312 | 1-col | **Simple modal** |
| 13 | **CRM** | create = `QuickCreateModal`; edit/detail = `DetailSheet` | Create: `artifacts/erp-dashboard/src/pages/crm/QuickCreateModal.tsx` :132-144 (custom `motion.div`, `fixed inset-0 ... flex items-center justify-center`, inner `w-full max-w-md rounded-lg`, NOT Radix Dialog); sub-fields in `QuickCreateModalSections.tsx` :149 `grid-cols-2`. Detail: `pages/crm/DetailSheet.tsx` :211 (`SheetContent className="w-full sm:max-w-4xl ... p-0" side="right"`). Both wired from `pages/CRMWorkspace.tsx` :24-25, 74, 190-206 | 2-col (partial) | **Create = simple modal** (custom animated, not shadcn Dialog); **edit/detail = slide-over panel** |
| 14 | **Marketing** | "Yangi kampaniya" | `artifacts/erp-dashboard/src/pages/MarketingCampaigns.tsx` :191-218 (`DialogContent className="max-w-lg bg-card border-none p-6"`, 3× `grid-cols-2` at :203/207/211) | 2-col | **Simple modal** |
| 15 | **Kanban** | create = `BoardDialogs` (board/card); edit/detail = `TaskDetailSheet` | Create: `artifacts/erp-dashboard/src/components/kanban/BoardDialogs.tsx` :119-320 (`<DialogContent>` default / `style={{maxWidth:480}}`). Detail: `pages/kanban/TaskDetailSheet.tsx` :131 (`SheetContent className="w-full sm:max-w-4xl p-0..."`). Both wired from `pages/KanbanBoard.tsx` :192-221 | 1-col | **Create = simple modal**; **edit/detail = slide-over panel** |
| 16 | **IoT** | "Yangi qurilma" (sensor/CAPEX device) | `artifacts/erp-dashboard/src/pages/IotSensorCapex.tsx` :125-190 (`DialogContent className="max-w-lg"`, 4× `grid-cols-2`) | 2-col | **Simple modal** |
| 17 | **AI** | — | Checked `pages/AIAgentsPage.tsx` (only `triggerMutation` POST-to-trigger, no create form) and the 5 dedicated `pages/ai-planning/*.tsx` (TZ-06) pages — `AIShiftManagementPage`, `BottleneckAnalysisPage`, `DemandForecastingPage`, `OEELiveMonitorPage` have **zero** Dialog/Sheet/mutation-create code; `RushOrderPage.tsx` has only an `AlertDialog` approve/reject action on rows created elsewhere. | — | **NOT FOUND** — genuinely absent. AI-labeled pages are read-only dashboards or approve/reject actions over records owned by other modules; no standalone "create AI entity" flow exists. `/ai/agents` isn't even linked from the sidebar (grep found zero sidebar references). |
| 18 | **Notifications** | — | `pages/NotificationCenter.tsx` (no Dialog/Sheet/create-mutation — a read feed of system-generated events) and `pages/NotificationSettings.tsx` (`saveMutation` only toggles/PUTs existing preference rows, no INSERT-new-record path) | — | **NOT FOUND** — genuinely absent. This module has a settings/preferences PUT and a read feed, not a create-record CRUD flow. |
| 19 | **POS** | "Kirim" (movement, external-in) — 5-step wizard; alt. "Yangi material" — dedicated full page | Wizard: `artifacts/erp-dashboard/src/pos-monitor/pages/PosMovementKirim.tsx` (comment: *"5-step wizard for EXTERNAL_IN warehouse movements"*) + `PosMovementKirimSteps.tsx` (route `/pos-monitor/movements/new/kirim`, `PosMonitorApp.tsx` :228). Full-page form: `pos-monitor/pages/PosMaterialNew.tsx` (route `/pos-monitor/materials/new`, `PosMonitorApp.tsx` :212-217) — no Dialog/Sheet/step state at all, single continuous page | n/a | **Movement-kirim = multi-step wizard**; **material-new = full-page form** (two genuinely different patterns for two entities inside the same module — note POS Monitor is a separate mini-app under `pos-monitor/`, outside `AppShellModern`) |
| 20 | **CC** (Camera Center) | "Kamera qo'shish" — `AddCameraDialog` | `artifacts/erp-dashboard/src/pages/cameras-management-dialogs.tsx` :230-247 (`DialogContent className="max-w-lg bg-card border-none rounded-xl p-6"`, `grid-cols-2` at :36,112), used from `pages/cameras-management.tsx` :233-235 | 2-col | **Simple modal** |

---

## Item 3 — PP's two visibly different patterns, confirmed

Both live in the **same module (PP)**, both are reachable from the live route table (`ProductionRoutes.tsx`):

**(a) "Yangi operatsiya" — `OperationFormDialog`**
`artifacts/erp-dashboard/src/pages/planning/PlanningDialogsA.tsx:38-40`:
```tsx
<DialogContent className="max-w-2xl p-6">
  <DialogHeader>
    <DialogTitle className="text-[18px] font-semibold">
      {editingOperation ? t("PlanningBoard.editTitle") : t("PlanningBoard.createTitle")}
```
where `production.json:526` defines `"PlanningBoard.createTitle": "Yangi operatsiya"`. It renders through the shadcn `Dialog` primitive, whose base class (`components/ui/dialog.tsx:49`) is:
```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] ...
```
i.e. a screen-centered overlay card (width capped at `max-w-2xl` here), with a dark `bg-black/80` backdrop (`dialog.tsx:30`), fields laid out `grid grid-cols-1 sm:grid-cols-2 gap-4` (`PlanningDialogsA.tsx:44`). Wired from `pages/PlanningBoard.tsx:260` at route `/planning`.

**(b) "Yangi buyurtma yaratish" — `OrderCreationWizard`**
`artifacts/erp-dashboard/src/pages/OrderCreationWizard.tsx:60-78`, route `/order-create`:
```tsx
<div className="space-y-8 min-h-full">
  <WizardHeader ... />
  <div className="max-w-4xl mx-auto space-y-6">
    <Card className="bg-card border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-muted/40/50">
        <WizardStepper steps={STEPS} currentStep={currentStep} />
```
`WizardHeader.tsx:25` literally prints the subtitle `"Sotuv va ishlab chiqarish — Yangi buyurtma"`. `WizardStepper.tsx:16-44` renders 5 numbered circular step indicators (`w-12 h-12 rounded-full border-2`, filled/checked when complete) connected by a `flex-1 h-1` progress-fill bar between each — the canonical "numbered steps + progress rail" pattern. Critically, **there is no `Dialog`, no overlay, no backdrop, no centering transform anywhere in this file or its five step sub-components** (`CustomerStep`, `ProductsStep`, `PricingStep`, `DeliveryStep`, `ReviewStep`) — it is ordinary in-page document content occupying the full routed page.

**Conclusion:** the owner's observation is accurate and reproducible in code — one PP create-flow is a small centered overlay dialog (672px cap, dismissible, backdrop-dimmed), the other is an entire full-bleed routed page with a 5-step numbered progress rail and no dialog machinery at all. They share no visual vocabulary (no common header treatment, no common width, no common chrome) beyond both using the app's Card/Button components. Note also that PP's *other* operation-creation entry point — `RoutingConfigurationDialogs.tsx:83` `AddOperationDialog` (`route /erp/pp/routing`) — is consistent with pattern (a), a `max-w`-capped centered modal with `grid-cols-2` fields, so the inconsistency is specifically "order creation" vs "everything else in PP," not a 50/50 split.

---

## Tally (primary create-flow classification, one per module, 20 modules)

| UI pattern | Count | Modules |
|---|---|---|
| Simple modal (centered Dialog, 1- or 2-column) | **15** | Org, HR, Finance, Coordination, Director, SD, MES, QC, MM, LMS, CRM, Marketing, Kanban, IoT, CC |
| Multi-step wizard (numbered steps/progress rail) | **3** | PP (order creation), WMS (kirim), POS (movement-kirim) |
| Full-page form (routed page, no steps, no dialog) | **0** as primary — 1 secondary instance noted (POS `PosMaterialNew.tsx`, not counted in the 20 since POS's primary create-flow is the wizard) |
| Slide-over panel | **0** as a *create* pattern — used only for **edit/detail** in 3 modules (CRM `DetailSheet`, Kanban `TaskDetailSheet`, WMS `ReceiptDetailSheet`) |
| Other | 0 |
| **Not found** (no create-record flow exists) | **2** | AI, Notifications |
| **Total** | **20** | |

Secondary observation (not part of the 5-bucket tally, but relevant to the "inconsistency" theme): among the 15 simple-modal rows, field layout itself is inconsistent — 8 use a `grid-cols-2` field grid (Org, HR, QC, Marketing, IoT, CC, and both PP-modal instances) while 8 use a plain single-column stack (MM, Coordination, Finance, Director, SD, MES, LMS, Kanban's `BoardDialogs`), with no shared width convention either (observed dialog widths: default/`max-w-lg` shadcn default, `max-w-[440px]`, `max-w-2xl`, `max-w-3xl`, custom `max-w-md`).

Files referenced above are all under `artifacts/erp-dashboard/src/` (repo root: `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`). No file was modified, created, or deleted in the course of this inventory — it was produced entirely via Read/Grep/Glob and read-only `bash` (`find`, `grep`, `sed -n`, `wc`).

---

# Part 1, Item 3 — Data-Table Inventory (READ-ONLY audit)

**Scope:** `artifacts/erp-dashboard/src` — 245 files import the shared `@/components/ui/table` primitive; a further ~65 files render raw `<table>` markup (grep confirmed, list included below). Sample below covers 40 distinct table instances across 20+ modules (HR, WMS, QC, MES, Finance/GL, SD, MM, CRM, MRO, Security, Marketing, POS Monitor, Kanban, PP).

## Table 1 — Sample inventory

| # | File:Line | Separation treatment (exact evidence) | Header style | Density | Shared-or-one-off |
|---|---|---|---|---|---|
| 1 | `components/EmployeeTable.tsx:138` | `rounded-lg border border-border overflow-hidden` wrapper | `bg-muted/60` + uppercase/bold, `py-3 px-6` | Comfortable (py-3 px-6) | Shared `Table` |
| 2 | `components/assets/AssetsTab.tsx:121` | `border rounded-md overflow-x-auto` wrapper | `bg-muted/50` row | Default | Shared `Table` |
| 3 | `components/hr/org/OrgCardsPanel.tsx:103` | `rounded-lg border border-border overflow-x-auto` | Default (no header bg) | Default | Shared `Table` |
| 4 | `components/wms/valuation/MaterialInventoryTable.tsx:52` | `border rounded-md overflow-hidden` | `bg-muted/50` row | Default | Shared `Table` |
| 5 | `components/finance/income-expense/TransactionTable.tsx:84` (via `pages/IncomeExpense.tsx:102-119`) | Wrapped in shadcn `<Card>` (border-border) | Default | Default | Shared `Table`, wrapped in `Card` |
| 6 | `components/wms/reports/AbcAnalysisTab.tsx:135` (Card at :99) | Wrapped in `<Card>` | Default | Default | Shared `Table` in `Card` |
| 7 | `pages/MMPurchaseOrders.tsx:252` | Wrapped in `<Card><CardContent>` via `PageState` | `bg-muted/60`, uppercase, `py-3 px-6` | Comfortable | Shared `Table` in `Card` |
| 8 | `pages/MESExtendedTabsA.tsx:28` | Wrapped in `<Card>` (:26) | Default | Default | Shared `Table` in `Card` |
| 9 | `pages/WarehouseDashboardPage.tsx` (~line 100) | Wrapped in `<Card><CardContent>` | `border-b text-muted-foreground` | Default (`py-2`) | Raw `<table>` in `Card` |
| 10 | `pages/ReceptionPage.tsx` (LOG tab) | Wrapped in `<Card className="bg-card border-border">` | `border-b border-border` | Default | Raw `<table>` in `Card` |
| 11 | `pages/WarehouseStockPage.tsx:122` | Wrapped in `<Card><CardContent>` | `border-b text-muted-foreground` | Default | Raw `<table>` in `Card` |
| 12 | `pages/AuditLogPageSections.tsx:95` | Wrapped in `<Card><CardContent className="p-0">` | `border-b bg-muted/50` | `px-4 py-3` compact | Raw `<table>` in `Card` |
| 13 | `pages/kanban/ResourceAllocationView.tsx:39` | `rounded-lg border overflow-hidden` wrapper | `bg-muted/50` | `px-4 py-3` | Raw `<table>`, one-off |
| 14 | `pages/WarehouseBinsPage.tsx` (~line 90) | Inline `style={{background:"var(--ep-surface)", boxShadow:"0 1px 4px rgba(0,0,0,.08)", borderRadius:14}}` | `background: var(--ep-bg)` row + `border-bottom` | Default | Raw `<table>`, one-off (shadow-based) |
| 15 | `pages/PPEquipmentPage.tsx` (~line 30) | Same inline shadow pattern as #14 | Same pattern | Default | Raw `<table>`, one-off |
| 16 | `pages/qc/QualityTrendPage.tsx:93` | Wrapped via `Section` helper → `<Card>` (`DedicatedPageShell.tsx:86-96`) | `border-b bg-muted/50` | `p-2` compact | Raw `<table>` in `Card` |
| 17 | `pages/RulonCards.tsx:360` | Same `Section`→`Card` wrap | `border-b text-xs` | `py-2 pr-4` | Raw `<table>` in `Card` |
| 18 | `pages/mro/SparePartsPage.tsx:78` | Same `Section`→`Card` wrap | `border-b bg-muted/50` | `p-2` compact | Raw `<table>` in `Card` |
| 19 | `pages/ai-planning/DemandForecastingPage.tsx` | Same `Section`→`Card` wrap | `border-b bg-muted/50` | `p-2` compact | Raw `<table>` in `Card` |
| 20 | `pages/CrmCohortAnalysis.tsx:181-192` | Wrapped in `<Card><CardContent>` (heatmap, not a plain grid) | Custom | Compact heatmap cells | Custom, in `Card` |
| 21 | `pages/qc/RootCausesPage.tsx:82` | `overflow-x-auto rounded-lg border` | `bg-muted/50 border-b` | `p-3` | Raw `<table>`, one-off |
| 22 | `pages/WarehouseKirimWizardSteps.tsx` (~line 55) | `border rounded overflow-hidden` | `bg-gray-50` (hardcoded, not token) | `p-2` compact | Raw `<table>`, one-off |
| 23 | `pages/mro/CanteenManagementPage.tsx` (~line 70) | `overflow-x-auto rounded-md border` | `border-b bg-muted/50` | `p-2` compact | Raw `<table>`, one-off |
| 24 | `pages/agents/ProcurementDashboard.tsx:37` | Wrapped in `<Card className="p-5">` | `text-xs uppercase border-b` | `py-2` | Raw `<table>` in `Card` |
| 25 | `pages/RecruiterKPIPageAnalytics.tsx:40` | Wrapped in `<Card><CardContent>` | Default | Default | Raw `<table>` in `Card` |
| 26 | `pages/ShiftScheduleSections.tsx:38` (`GridTab`) | Wrapped in `<Card><CardContent>` | `border-b bg-muted font-semibold`, sticky col | Default | Raw `<table>` in `Card` |
| 27 | `pages/warehouse/RollManagementPage.tsx` (~line 47) | Wrapped in `<Card className="p-5">` | `border-b uppercase text-xs` | Default | Raw `<table>` in `Card` |
| 28 | `components/sd/OrdersTab.tsx` (~line 42) | `rounded-xl border bg-card overflow-hidden` | `border-b bg-muted/30` | Default | Raw `<table>`, one-off |
| 29 | `components/wms/material360/StockTab.tsx` | Wrapped in `<Card><CardContent className="p-0">` | `border-b bg-muted/50` | `px-4 py-2` compact | Raw `<table>` in `Card` |
| 30 | `pages/WarehouseRentalTable.tsx:106` | `border rounded-md overflow-auto` | Sticky `bg-card` header | Default | Shared `Table`, one-off wrap |
| 31 | `pages/MaterialBalanceTables.tsx:94` | Wrapped in `<Card><CardContent>` | Default | Default | Shared `Table` in `Card` |
| 32 | `pages/RecruiterKPIPageTables.tsx:30` | Wrapped in `<Card><CardContent>` | `border-b border-border text-xs` | Default | Raw `<table>` in `Card` |
| 33 | `pages/StrategicTasksPanelTable.tsx:61` (`TasksTable`) → caller `StrategicTasksPanel.tsx:240` | Wrapped in `<Card>` by caller | Default | Default | Shared `Table` in `Card` |
| 34 | `pages/ApplicationsTable.tsx:53` (`TemplatesTable`) → caller `Applications.tsx:223-235` | Wrapped in `<Card>` by caller | Default | Default | Shared `Table` in `Card` |
| 35 | `pos-monitor/pages/PosInventory.tsx:303,415,465` | `.pos-card` wrapper (`border:1px solid var(--pos-border); box-shadow: var(--pos-shadow-card)`) | `.pos-table th` — bold, uppercase, `bg:rgba(248,250,252,1)`, `border-bottom` | `12px 14px` + **zebra striping** (`nth-child(even)`) | Custom `.pos-table`/`.pos-card`, consistent module pattern |
| 36 | `pos-monitor/components/GlTab.tsx` (~line 30) | `.pos-card` wrapper (same as #35) | Same `.pos-table` | Same, zebra-striped | Custom `.pos-table` in `.pos-card` |
| 37 | `pos-monitor/pages/PosMaterialBalance.tsx` | Inline `style={{background:"var(--pos-card)", border:"1px solid var(--pos-border)", borderRadius:12}}` | `background: var(--pos-bg)` header | Default | Raw `<table>`, one-off (still bordered) |
| 38 | `pages/WorkflowRules.tsx:244` (Card at :243) | Wrapped in **`EPCard`** (canonical `ep-card` class) | Default | Default | Shared `Table` in `EPCard` — **only instance found using EPCard** |
| 39 | `pages/SDDashboard.tsx:393,421,457` | `.card` wrapper (`border:1px solid var(--line-warm); border-radius:18px`) | `.tbl th` uppercase, `border-bottom` | `14px 22px` header / `16px 22px` body — spacious | Custom `.tbl` in `.card`, consistent |
| 40 | `pages/CrmCohortAnalysis.tsx` (see #20) — already counted | — | — | — | — |

### NOT separated — table blends into page background

| # | File:Line | Evidence it blends |
|---|---|---|
| A | `components/crm/workspace/ListView.tsx:34` — rendered from `pages/CRMWorkspace.tsx:149` inside `<div className="flex-1 overflow-hidden flex flex-col">` → `<div className="p-6">` | **No Card, no border, no bg-card at all.** Root of `CRMWorkspace.tsx:70` sets `style={{background:"var(--ep-bg)"}}` directly on the page, and the table sits straight on it. This is the CRM Kanban/List flagship page — the owner's own example. |
| B | `pages/SDCustomers.tsx:327` | `<div className="bg-card rounded-xl border-none overflow-hidden">` — **`border-none` is explicit**, no shadow class present. Only differentiator is `bg-card` (`#FFFFFF`) vs page `--ep-bg` (`#FAFAF9`) — a 3-point RGB difference, imperceptible without zoom. |
| C | `pages/SDContracts.tsx:216` | Identical pattern: `bg-card rounded-xl overflow-hidden border-none` |
| D | `pages/SDSalesManagement.tsx:232` (commission tab) | `<div className="bg-card rounded-xl p-6">` — no `Card` import in the whole file, no border/shadow class anywhere near the table |
| E | `pages/WarehouseReportsAllSections.tsx:36` (`ReportTable`, generic report renderer used by `WarehouseReportsAllSections.tsx:196`) | **Zero wrapper** — only `<div className="overflow-x-auto"><table>`. Also uses hardcoded `bg-gray-50`, `text-gray-600`, `border-gray-200` instead of `--ep-*`/`bg-muted` tokens — a second, compounding design-token violation on the same table. |
| F | `pages/DesignOrders.tsx:301,311` | `<Card className="bg-card rounded-xl border-none shadow-none ...">` — explicitly strips *both* border AND shadow from the shadcn `Card` component itself |

### The dominant systemic pattern behind the "not separated" cases

This is not scattered — it is a **second, competing "card" convention** used across the codebase in parallel with the bordered shadcn `<Card>`:

```
<div className="bg-card rounded-xl p-6">   ← no border, no shadow
```

`grep -rn "bg-card rounded-xl" artifacts/erp-dashboard/src --include="*.tsx"` returns **~95 occurrences**; of those, **24 files** also contain a `<Table>`/`<table>` in the same file:

`AccountsPayableSections.tsx`, `AccountsReceivableSections.tsx`, `BudgetManagementSections.tsx`, `CashFlowManagementSections.tsx`, `GLDocuments.tsx`, `HRDashboardSections.tsx`, `HRDashboardTabs.tsx`, `IotMaintenanceMonitorTab.tsx`, `LMSExtended.tsx`, `MarketingExtendedSections.tsx`, `PPDashboardSections.tsx`, `PapkaOrdersSections.tsx`, `SDContracts.tsx`, `SDCustomers.tsx`, `SDDebitors.tsx`, `SDKpi.tsx`, `SDSalesManagement.tsx`, `SDSalesQuotes.tsx`, `SalesOrdersSections.tsx`, `SecurityDashboardManagement.tsx`, `SecurityDashboardSections.tsx`, `hr-dashboard/RiskTab.tsx`, `lms-extended/GamificationTab.tsx`, `components/wms/receiving/ReceivingList.tsx`.

Directly confirmed (opened and inspected) that the table itself sits inside this exact no-border div, not just co-located in the file: `GLDocuments.tsx:312` (`data-testid="card-documents-table"`), `AccountsPayableSections.tsx:90` (`data-testid="card-aging-table"`), `AccountsReceivableSections.tsx:90`, `SDKpi.tsx:219`, `SDSalesQuotes.tsx:255`, `SalesOrdersSections.tsx:107`, `PapkaOrdersSections.tsx:114`, `SDCustomers.tsx:327`, `SDContracts.tsx:216`, `SDSalesManagement.tsx:232`, `SDDebitors.tsx:149`, `CashFlowManagementSections.tsx:176→211`, `BudgetManagementSections.tsx:215→255`. That is **13 confirmed table instances** using the flat, unbordered `bg-card` div as their sole container, concentrated heavily in **Finance/GL (AR/AP aging, GL documents, budget, cash flow) and SD (customers, contracts, quotes, sales orders, debitors, KPI)** — i.e., exactly the modules the owner works in daily.

## Summary — confirming the owner's complaint

**Numerically, in the 40-instance sample, most individual table components DO get visual separation** when a caller wraps them in the bordered shadcn `Card` (or an equivalent bordered/shadowed one-off div): **30 of 40 sampled instances have a border and/or box-shadow** distinguishing them from the page (examples: rows 1-19, 21-27, 29-38, 39).

**But the complaint is real and structural, not a fluke:**

1. **A second, unbordered "flat card" convention (`bg-card rounded-xl p-6`, no border, no shadow) is used to wrap tables in at least 13 confirmed instances**, concentrated in Finance (GL documents, AR/AP aging, budget, cash flow) and SD (Customers, Contracts, Quotes, Sales Orders, Debitors, KPI) — modules the owner uses constantly. In these cases the only differentiator from the page is `bg-card` (`#FFFFFF`) vs `--ep-bg` (`#FAFAF9` per `DIZAYN_QOIDALARI.md`), a ~3-point RGB delta that is effectively invisible at normal viewing without zooming in on a color picker.
2. **Two flagship, heavily-trafficked pages have *zero* container at all**: the CRM Kanban/List view (`components/crm/workspace/ListView.tsx`, rendered by `CRMWorkspace.tsx` — the same page already flagged for the horizontal-scroll cutoff bug) and the generic Warehouse report renderer (`WarehouseReportsAllSections.tsx`'s `ReportTable`), the latter also using raw Tailwind gray instead of design tokens.
3. Three pages (`SDCustomers.tsx`, `SDContracts.tsx`, `DesignOrders.tsx`) go further and **explicitly strip** `border-none`/`shadow-none` off what would otherwise be a bordered element — this looks like a deliberate stylistic choice made at some point (possibly to match a specific "flat/minimal" mockup) that was then applied inconsistently, leaving those specific pages visually flatter than their siblings using the same underlying component (`Table`/`Card`).
4. Row-level separation (zebra striping) is rare: only the POS Monitor module's `.pos-table` CSS class (rows 35-37) implements `tr:nth-child(even)` striping. Every other sampled table relies solely on `hover:bg-muted/40` (visible only on mouseover) or a `border-b` under each row — meaning in a static screenshot, most tables' *rows* are separated from each other only by a 1px line, if that.

**Net verdict:** the owner's complaint is **confirmed for a real, identifiable minority of tables that happen to sit on his most-used pages** (SD, Finance/GL, CRM), even though a numeric majority of tables elsewhere in the app (WMS, QC, MES, HR, POS Monitor, MRO) do have a border via `Card`. The root cause is not "developers forgot borders everywhere" — it's that **two incompatible card conventions coexist** (bordered shadcn `Card` vs. borderless `bg-card rounded-xl` div), and the borderless one was applied to exactly the pages the owner looks at most.

## Item 4 — Canonical EP table component: confirmed gap

- `grep -rn "EPTable" artifacts/erp-dashboard/src` returns **zero matches** (exit code 1) — no `EPTable` component exists anywhere, confirming the directory-listing observation.
- `artifacts/erp-dashboard/src/components/ep/index.ts` and the directory listing confirm the canonical library is exactly: `DefectDropdown`, `EPCard`, `EPComingSoon`, `EPDocumentPreview`, `EPEmptyState`, `EPErrorState`, `EPKpiCard`, `EPLoader`, `EPNumberedSection`, `EPPageHeader`, `EPSkeleton`, `EPStatusPill`. No table-specific component.
- `EPCard.tsx`'s own doc comment explicitly says it should be used "instead of raw `<div className="rounded-lg border p-6">`" and lists "tables, info blocks" as an intended static (non-interactive) use case — meaning **the design system's own documentation anticipated `EPCard` wrapping tables**, but in practice this is **not followed**: across the whole sample, only **one file** (`pages/WorkflowRules.tsx:243-244`) actually wraps a `<Table>` in `EPCard`. Every other separated table in the sample uses the plain shadcn `Card` (or a hand-rolled bordered/shadowed div), and every unseparated table uses the borderless `bg-card` div or nothing at all.
- **Conclusion: this is a real, confirmed structural gap** — not merely under-application of an existing canonical table wrapper, but the near-total absence of any single governing pattern for "how a table should be bordered/elevated" at all. Three different conventions currently coexist for the *same visual intent* (separate a table from the page): shadcn `Card` (bordered), raw `bg-card rounded-xl` (borderless), and ad-hoc inline `boxShadow` styles (`WarehouseBinsPage.tsx`, `PPEquipmentPage.tsx`) — with no `EPTable`/`EPCard`-for-tables convention actually enforced anywhere except one file.

---

# Part 1, Item 4 — Color Drift Audit: Real Counts vs. Declared Tokens

*(Read-only investigation. All figures below are grep-derived, commands shown. Repo root: `Uzbek-Language-Module`, scope: `artifacts/erp-dashboard/src`.)*

## 1. Raw color-literal counts

**Raw hex codes** — `grep -rEo '#[0-9a-fA-F]{3,8}' artifacts/erp-dashboard/src | wc -l`
```
1238 occurrences, across 145 files (112 .tsx / 24 .ts / 9 .css)
240 distinct normalized values (2 are false positives — see note below — so 238 true colors)
```
Note on false positives: `#8226` is `&#8226;` (an HTML bullet entity) in `WasteTracking.tsx:137`; `#101` is a test-fixture ID string `'#101'` in `LeadCard.test.tsx:50`. Excluded from color analysis below.

**`rgb()`/`rgba()` inline values** — same pattern for `rgba?\(...\)`:
```
673 occurrences, across 79 files (67 .tsx / 9 .css / 3 .ts)
360 distinct full strings (hex+alpha exact match)
63 distinct RGB triples once alpha is stripped (i.e. ~5.7 alpha-variants per base color on average —
   confirms most rgba() usage is the SAME handful of base colors re-typed at different opacities,
   e.g. rgba(255,255,255,·) appears at 14/9/9/8/7/5/4 different alphas, rgba(163,177,198,·) at 7 different alphas)
```

**Tailwind arbitrary-value color classes:**
```
bg-[#hex]/text-[#hex]/border-[#hex]/etc:  60 occurrences, 10 files, 14 distinct classes
  top: bg-[#0d1117]×18, border-[#30363d]×16, bg-[#161b22]×11, bg-[#F0E6E1]×3
bg-[rgba(...)]/etc arbitrary rgba:        18 occurrences, 6 distinct
  all bg-[rgba(...)] status-tint chips: rgba(192,67,47,.12) rgba(181,137,28,.14)
  rgba(46,138,90,.12) rgba(53,99,172,.12) rgba(233,69,96,.14) rgba(122,79,177,.12)
```
(These 60+18 are a *subset* of the raw-hex/rgba totals above, not additive — the `#`/`rgba` inside the `[...]` bracket is also matched by the raw-literal regexes.)

## 2. On-token vs. off-token fraction

```
var(--ep-*)  usages: 4377  (30 distinct token names, 759 files)
var(--mod-*) usages:   16  (7 distinct token names)
```
`--mod-*` (the 15 per-module accents) is almost unused in practice — 16 live usages against a declared 15-module palette suggests most modules aren't actually drawing their accent from the token at all (consistent with the raw hex/rgb inventory below being full of ad-hoc status-color maps per module instead).

Off-token total (raw hex 1238 + rgb/rgba 673, non-overlapping categories) = **1911**
On-token total (var(--ep-*) 4377 + var(--mod-*) 16) = **4393**

**→ ~69.7% of color usage is on-token, ~30.3% is raw/off-token.** Roughly **1 in 3** color expressions in the frontend bypasses the design-token system entirely. `var(--ep-*)` usage is real and widespread (759 distinct files, not concentrated in 2-3 files — `kit.css`/`europrint-mockup-theme.css` are the top two as token *definers*, then it fans out across ~30 ordinary page files at 15-55 usages each), so this isn't a case of the tokens being unused — it's a case of token-usage and raw-literal-usage coexisting at roughly 7:3 throughout the same codebase.

## 3. Distinct color inventory vs. DIZAYN_QOIDALARI.md

DIZAYN_QOIDALARI.md itself declares **31 distinct hex values** (not ~15-20 as estimated going in — `grep -oE '#[0-9a-fA-F]{3,8}' DIZAYN_QOIDALARI.md | sort -u | wc -l` = 31; covers light+dark `--ep-*` base tokens plus the 15 `--mod-*` module accents).

Diffing the codebase's 238 true distinct hex values against those 31 declared ones:
```
comm -23 codebase_hex.txt declared_hex.txt | wc -l  →  213
```
**213 of 240 (≈89%) distinct raw hex values found in the codebase have no textual declaration anywhere in DIZAYN_QOIDALARI.md.** These are almost entirely ad-hoc Tailwind default-palette hex twins (`#3b82f6`, `#ef4444`, `#22c55e`, `#f59e0b`, `#8b5cf6`, `#06b6d4`... — i.e. developers reaching for blue-500/red-500/green-500/amber-500/violet-500/cyan-500 by hand instead of a status/mod token) plus module-specific one-offs (POS-monitor category chips, CRM funnel-stage colors, Telegram-clone chat-bubble theme, AI-interview GitHub-dark-mode palette).

Rough role grouping of the top-volume distinct raw values:
- **Status/semantic reds-greens-ambers-blues** (the bulk of the 213 undeclared): `#ef4444`(59), `#22c55e`(50), `#f59e0b`(45), `#10b981`(31), `#8b5cf6`(29), `#f97316`(28), `#06b6d4`(20), `#eab308`(19), `#6366f1`(17), `#dc2626`(16), `#ec4899`(12) — these are Tailwind's own default palette values, reimplemented by hand per-page instead of routed through `--status-success/warn/danger/info` tokens.
- **Grays/neutrals off the declared set:** `#6b7280`(18), `#e2e8f0`(11), `#374151`(3), `#9ca3af`(4), `#f1f5f9`(7).
- **A parallel dark-theme palette unrelated to DIZAYN_QOIDALARI.md's dark mode**, used specifically for AI-interview + Telegram-clone pages: `#0d1117`(18), `#30363d`(17), `#161b22`(11) — a GitHub-dark clone, not the app's own `--ep-dark:#0E0F11`.
- **On-brand but hand-typed instead of tokenized:** `#ff902f`(7 raw occurrences of the exact primary orange — it *is* canonical, but 7 places spell it out instead of `var(--ep-primary)`), `#15171a`(26 raw occurrences of the canonical text/dark color).
- **The peach/cream family** — covered in detail in section 4 below.

Interesting corollary: `comm -12` (declared ∩ codebase-raw) = 27 of the 31 declared values also show up **hardcoded raw** somewhere in the code — meaning even "correct" colors are frequently typed by hand rather than referenced via `var(--ep-*)`. This is invisible drift (pixel-correct today, but silently detached from the token — a future rebrand/theme edit to `DIZAYN_QOIDALARI.md`'s `--ep-primary` would not reach these 7 raw `#FF902F` spots).

## 4. `scripts/check-design-tokens.mjs` — exact behavior (read in full, 100 lines)

**It is diff-aware only — never a whole-repo scan.** Confirmed from the source:
- Line 57: `execSync('git diff --cached --unified=0 -- "*.tsx" "*.ts"')` — inspects **only staged changes**, and only within `*.ts`/`*.tsx` (never `*.css`, by pathspec, in addition to the allowlist below).
- Line 69: `if (!line.startsWith('+') ...)` — only newly **added** lines are inspected; a pre-existing off-token line untouched by the current diff is invisible to it even if the file itself is being edited elsewhere.
- The file's own header comment (lines 10-11) states this explicitly: *"This guard is DIFF-AWARE: it only inspects lines ADDED in the staged commit, so the ~950 pre-existing violations never block a commit — only NEW regressions do."* Dated 2026-05-29. My grep counts above show the actual current backlog is **1911** raw hex+rgba occurrences (1238+673) — over double the 950 figure the tool's own comment cites, and growing, since nothing forces it down.
- **What it actually flags, and how narrowly:**
  - `HEX_IN_STYLE` / `FN_IN_STYLE` (line 50-51) → **BLOCK** (exit 1), but *only* a `#hex` or `rgba?()/hsla?()` literal that appears on the **same single line** as `style={{`. A multi-line `style={{ \n color: '#fff' \n }}` would not match (the regex requires `style=\{\{[^}]*#hex` with no `}` in between, on one line).
  - `TW_ARB_HEX` (line 53) → **WARN only, never blocks** the commit — Tailwind `text-[#hex]`/`bg-[#hex]`/etc. This is graduated deliberately ("escalate to BLOCK after FAZA 2" — never happened per current code).
  - Tailwind arbitrary **rgba** classes (`bg-[rgba(...)]`) are **not matched by any regex** in the file — the 18 occurrences found in section 1 are entirely invisible to this tool, neither BLOCK nor WARN.
  - Plain non-JSX raw color strings (e.g. a module-level `const STATUS_COLORS = { active: '#22c55e' }` map, which is exactly the pattern found repeatedly in `crm-types.ts`, `PosMaterials.tsx`, `PosWarehouseDetail.types.ts`, `KanbanCard.tsx` from section 1's top-offenders list) are **not caught** — the check only fires inside a literal `style={{...}}` JSX attribute or a Tailwind arbitrary-value class string, not on an arbitrary JS object/string literal.
- **The allowlist is a structural (not just temporal) blind spot.** Lines 37-44 unconditionally exempt, for *any* diff at *any* time:
  - `/\/erp-modern-ui\//` — the entire token-definition directory (`design-tokens.css`, `europrint-mockup-theme.css`, `kit.css`, `ep-motion-helpers.css`, `shell-overrides.css`, `global-surface.css`)
  - `/\/components\/ep\//`, chart components, and **`/\.css$/` globally** (every CSS file in the project, not just erp-modern-ui)
  - This means even a hypothetical future "run this against the whole repo, not just the diff" mode would still never catch drift *inside the token-declaration files themselves* — which is exactly where the root cause in section 5 below lives. The tool's design assumes files under `erp-modern-ui/` "legitimately own raw colors" (true, they must contain literal hex to *define* tokens) but has no check that the values they define match `DIZAYN_QOIDALARI.md`.
  - If nothing is staged / not in a git repo, `execSync` throws and the script `process.exit(0)` silently (line 58-59) — no output, just a silent pass.

**Conclusion for Part 2's root-cause question:** the tool cannot explain why drift *persists* in old code (by design — it never looks at unstaged/pre-existing lines), and it structurally cannot explain drift *in the token layer itself* even for new changes, because `erp-modern-ui/**` and all `*.css` are permanently allowlisted. Both are working as coded, not as bugs in the script — but together they leave the actual flagship bug (section 5) in a location this gate was never able to see.

## 5. Peach/cream flagship investigation — every file:line

Searched the full distinct-hex inventory for warm pale (R>G>B, light) tones and located every occurrence:

```
--- #F0E6E1 (7 uses) ---
components/ui/badge.tsx:50   "bg-[#F0E6E1] text-muted-foreground before:bg-[var(--ep-muted)]",
components/ui/badge.tsx:53   "bg-[#F0E6E1] text-muted-foreground border border-border before:bg-[var(--ep-muted)]",
components/ui/badge.tsx:62   "bg-[#F0E6E1] text-muted-foreground before:bg-[var(--ep-muted)]",
erp-modern-ui/kit.css:158    .sb-bdg.muted { background: #F0E6E1; color: var(--fg2); }
erp-modern-ui/kit.css:326    .bar.muted    { background: #F0E6E1; }
erp-modern-ui/kit.css:327    .bar.muted.stripe { background-image: repeating-linear-gradient(-45deg, #F0E6E1 0 4px, #E5D9D3 4px 8px); }
erp-modern-ui/kit.css:394    .pill.neutral { background: #F0E6E1; color: var(--fg2); }

--- #FBF1ED (4 uses) ---
components/ui/button.tsx:37  hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:border-primary hover:text-primary
components/ui/button.tsx:39  hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:border-primary hover:text-primary
components/ui/button.tsx:45  hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:text-foreground
erp-modern-ui/kit.css:16     --bg-blush-soft:   #FBF1ED;

--- #F5E6E1 (3 uses — see ROOT CAUSE below) ---
erp-modern-ui/europrint-mockup-theme.css:26   --ep-bg:      #F5E6E1;   /* SHIPNOW warm-blush page bg */
erp-modern-ui/europrint-mockup-theme.css:47   --background:   15 50% 92%;    /* #F5E6E1 — SHIPNOW warm blush */
erp-modern-ui/kit.css:15                      --bg-blush:        #F5E6E1;   /* warm-blush page bg (SHIPNOW) */

--- #E7E2D8 (2 uses — see ROOT CAUSE below) ---
erp-modern-ui/europrint-mockup-theme.css:28   --ep-border:  #E7E2D8;
erp-modern-ui/europrint-mockup-theme.css:49   --border:       38 17% 88%;    /* #E7E2D8 */

--- #FBF6F3 (1) --- erp-modern-ui/kit.css:458   (gradient stop)
--- #FAF7F2 (1) --- erp-modern-ui/europrint-mockup-theme.css:46   /* Background #FAF7F2 → warm cream */ (comment only — stale, doesn't match line 47's actual value)
--- #F8F1DD (1) --- erp-modern-ui/ep-motion-helpers.css:32   --mod-warehouse-light: #F8F1DD;
--- #F8E6E0 (1) --- erp-modern-ui/kit.css:114   .sb-user:hover { background: #F8E6E0; }
--- #F3E6E1 (1) --- erp-modern-ui/kit.css:19    --line-warm-dim:   #F3E6E1;   /* nearly invisible divider */
--- #ECE5DD (1) --- src/index.css:99             --tg-chat-bg: #ece5dd;   (Telegram-clone chat theme, unrelated subsystem)
--- #EBDFDB (1) --- erp-modern-ui/kit.css:18     --line-warm:       #EBDFDB;   /* soft warm border */
--- #E5D9D3 (1) --- erp-modern-ui/kit.css:327    (gradient stripe stop, paired with #F0E6E1 above)
--- #D8D0CC (1) --- erp-modern-ui/kit.css:52     .ep-shipnow ::-webkit-scrollbar-thumb { background: #d8d0cc; }
```
None of these equal `--ep-bg` (#FAFAF9) or `--ep-surface` (#FFFFFF) — every one is a distinct warm off-white, confirming this is not one typo but a whole parallel warm/"blush" palette.

**ROOT CAUSE (traced, not inferred):** `erp-modern-ui/europrint-mockup-theme.css` lines 26 and 28 declare the actual, sole, live values of the canonical `--ep-bg` / `--ep-border` custom properties (design-tokens.css never declares `--ep-bg`/`--ep-surface`/`--ep-border`/`--ep-fg` at all — grep confirms zero hits). This file's own header comment (lines 1-13) states the *intended* values match DIZAYN_QOIDALARI.md exactly:
```
--ep-bg:  #FAFAF9  (warm off-white page bg)
--ep-border: #EBEAE6  (warm subtle border)
```
but the `:root` block 13-15 lines below contradicts its own header and sets:
```
26:  --ep-bg:      #F5E6E1;   /* SHIPNOW warm-blush page bg */
28:  --ep-border:  #E7E2D8;
```
The same file also redeclares the parallel shadcn/Tailwind HSL tokens at lines 47/49 to the same peach/beige values (`--background: 15 50% 92%` = #F5E6E1, `--border: 38 17% 88%` = #E7E2D8), which is significant because `index.css` maps `--color-background: hsl(var(--background))` for Tailwind's `bg-background` utility class. Import order in `index.css` is: `design-tokens.css` (line 3, declares a *different* cooler `--background: 220 20% 98%` / #f8f9fc) → `shell-overrides.css` (4) → `global-surface.css` (5) → **`europrint-mockup-theme.css` (7, explicitly commented `/* EP Linear Soft theme (overrides base tokens) */`)** → `ep-motion-helpers.css` (9) → `kit.css` (12). Nothing loaded after line 7 redeclares `--background`, `--border`, `--ep-bg`, or `--ep-border` back to the canonical values (confirmed by grep across all six files) — plain CSS cascade means the peach declaration at line 7's import wins and stays won for the rest of the cascade.

**Practical implication:** the live, runtime value of `--ep-bg` (and Tailwind's `bg-background`, and any component correctly using `var(--ep-bg)` per Qoida 21's own recommended fix) currently resolves to `#F5E6E1` peach, not the documented `#FAFAF9`. This is drift **inside the token's own source of truth**, not merely scattered inline-hex violations in page files — meaning even fully "compliant" code (zero raw hex, 100% `var(--ep-*)`) is still rendering the wrong background today. `kit.css` compounds this with its own separate, undeclared "blush" sub-palette (`--bg-blush`, `--bg-blush-soft`, `--line-warm`, `--line-warm-dim`) that shared primitives `components/ui/badge.tsx` and `components/ui/button.tsx` (base UI components used app-wide, not page-specific) reference directly for hover/muted states — so the warm palette also propagates through what look like generic, reusable, "safe" components.

Both `europrint-mockup-theme.css` and `kit.css` are live/active imports (confirmed via `@import` in `src/index.css` lines 7 and 12, not orphaned/dead files) — this is currently rendering, not legacy dead code.

## Files referenced (absolute paths)
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\DIZAYN_QOIDALARI.md`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\index.css`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\erp-modern-ui\design-tokens.css`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\erp-modern-ui\europrint-mockup-theme.css` (root cause, lines 26/28/47/49 vs its own header lines 1-13)
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\erp-modern-ui\kit.css` (lines 15-19, 52, 114, 158, 326-327, 394, 458)
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\erp-modern-ui\ep-motion-helpers.css:32`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\components\ui\badge.tsx:50,53,62`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\components\ui\button.tsx:37,39,45`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\scripts\check-design-tokens.mjs` (full 100-line file read)
- Top raw-hex-count non-CSS offenders (for later scoping): `pages/crm/crm-types.ts` (30), `pos-monitor/pages/PosMaterials.tsx` (24), `pages/kanban/KanbanCard.tsx` (19), `pages/AIInterviewPublicPageSections.tsx` (19), `pos-monitor/pages/PosWarehouseDetail.types.ts` (18), `pos-monitor/pages/PosMovements.types.ts` (18)

No files were modified, created, or deleted; no commits were made. All commands run were read-only (`grep`, `sed -n` via Bash's `sed` for viewing, `comm`, `sort`/`uniq`, and the `Read`/`Bash` tools).

---

# Part 1 Item 5 — Font-Size/Weight and Spacing-Unit Usage Audit

Scope: `artifacts/erp-dashboard/src` (2,139 `.ts`/`.tsx` files, confirmed no `node_modules` contamination). All figures below are real grep/read counts taken this pass — no estimates. Read-only throughout: no file was edited, created, or deleted; no git write command was run.

---

## 1. Font-size class distribution (Tailwind `text-*`)

| Class | Count | vs. declared scale |
|---|---:|---|
| `text-xs` | 4,383 | ✅ declared (`small`/`caption`) |
| `text-sm` | 3,586 | ✅ declared (`body`) |
| `text-base` | 358 | ✅ declared (`h3`) |
| `text-lg` | 370 | ❌ not in declared scale (h1/h2/h3/body/small/caption = xs/sm/base/xl/2xl only) |
| `text-xl` | 210 | ✅ declared (`h2`) |
| `text-2xl` | 548 | ✅ declared (`h1`) |
| `text-3xl` | 144 | ❌ not declared |
| `text-4xl` | 184 | ❌ not declared |
| `text-5xl` | 10 | ❌ not declared |
| `text-6xl` | 4 | ❌ not declared |
| `text-7xl`/`8xl`/`9xl` | 0 | — |

**Total `text-*` usages: 9,797.** The 6-step declared scale (`xs, sm, base, xl, 2xl` + implicitly `lg` isn't even in the doc's h1–caption list) accounts for the bulk of volume, but **342 instances of `text-3xl`/`4xl`/`5xl`/`6xl`** (plus 370 of undeclared `text-lg`) sit entirely outside the documented type scale — these are concentrated in KPI/hero-number displays (e.g. `pages/crm/workspace/CRMKpiCards.tsx` uses raw `fontSize: 28` inline on top of this, see §3) and dashboard headline widgets, not just the declared h1/h2/h3/body/small/caption set.

## 2. Font-weight class distribution (Tailwind `font-*`)

| Class | Count |
|---|---:|
| `font-thin` / `font-extralight` | 0 |
| `font-light` | 6 |
| `font-normal` | 44 |
| `font-medium` | 2,019 |
| `font-semibold` | 2,372 |
| `font-bold` | 1,957 |
| `font-extrabold` | 2 |
| `font-black` | 56 |

**Total `font-*` usages: 6,456.** The declared scale only names two weights per level (600 for h1/h2, 500 for h3, 400 for body) — i.e. `font-semibold`/`font-medium`/`font-normal`. In practice `font-bold` (1,957 uses) is nearly as common as `font-semibold`, and is not mentioned anywhere in the documented type scale at all — it's a fourth weight in heavy real use alongside the three the doc names.

## 3. Raw inline `fontSize`/`fontWeight` (bypasses Tailwind/the type scale entirely)

- `fontSize` inline-style occurrences: **990**, across **114 files**.
- `fontWeight` inline-style occurrences: **394**, across **76 files**.
- Of the `fontSize` hits, **94** are inside Recharts `tick={{...}}` / `contentStyle`/`labelStyle` props (a defensible library-API use, not a raw div style) — leaving **~896 genuine inline-style bypasses** on DOM elements.
- **Distinct raw pixel `fontSize` values found:** 27 (8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 48, 52, 56, 60) — vs. the declared scale's handful of named steps. Top values: `12` (208×), `11` (194×), `13` (174×), `10` (133×).
- **Distinct raw `fontWeight` values found (numeric, cleaned of regex noise):** `700` (175×), `600` (157×), `800` (25×), `500` (22×), `900` (1×), `400` (1×), plus literal `'bold'` (2×).
- **Top offenders by file (fontSize inline count):** all in `pos-monitor/`:
  - `pos-monitor/pages/PosMaterialDetail.tsx` — 48
  - `pos-monitor/pages/PosMovementKirimSteps.tsx` — 47
  - `pos-monitor/pages/PosInventory.tsx` — 35
  - `pos-monitor/pages/PosMovementChiqimRight.tsx` — 28
  - `pos-monitor/components/PosAdminSections.tsx` — 28
  - Plus `PosKpiDashboard.tsx` (26), `PosMyInventory.tsx` (23), `PosMovementDetail.tsx` (23), `PosWarehouses.tsx` (22), `PosReports.tsx` (22), `PosHandovers.tsx` (22) — the entire POS Monitor module is built almost exclusively on raw inline styles rather than Tailwind classes or `--ep-*` tokens, and additionally references its own separate `var(--pos-text-muted)` / `var(--pos-accent)` / `var(--pos-card)` custom-property namespace (e.g. `pos-monitor/pages/PosMaterialDetail.tsx:113,121,122`) that is outside the `--ep-*`/`--mod-*` tokens DIZAYN_QOIDALARI.md declares.
- Representative file:line citations:
  - `components/aisha/AishaPanel.tsx:72,80,88,93,95,108,114` — `style={{ fontSize: 12, ... }}` etc.
  - `components/aisha/TransparencyPanel.tsx:41,47,50,68,84,92,110` — `style={{ fontSize: 14, fontWeight: 600, ... }}`
  - `components/camera-ai/MachineUtilizationChart.tsx:59-61`, `components/camera-ai/SafetyTrendsChart.tsx:41-43` — Recharts `tick={{ fontSize: 10 }}` (library-API caveat noted above)
  - `components/cc/GlobalInboxBadge.tsx:61` — `fontSize: 10, fontWeight: 700`
  - `components/chat/ChatWidget.helpers.tsx:61`, `components/chat/page/ChatAvatar.tsx:54,61` — `fontSize: size * 0.35` (computed, not even a fixed scale step)
  - `pages/crm/workspace/CRMKpiCards.tsx:221` — `fontSize: 28`
  - `pos-monitor/pages/PosMaterialDetail.tsx:113` — `const lbl = { fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, ... }`

## 4. Spacing utility distribution

### Padding (`p-/px-/py-/pt-/pb-/pl-/pr-`, all directions summed per value)

| Value (×4px) | Count | | Value | Count |
|---:|---:|---|---:|---:|
| 0 | 716 | | 8 | 458 |
| 0.5 | 427 | | 9 | 32 |
| 1 | 647 | | 10 | 95 |
| 1.5 | 285 | | 11 | 2 |
| 2 | 2,099 | | 12 | 211 |
| 2.5 | 400 | | 14 | 7 |
| 3 | 1,957 | | 16 | 32 |
| 3.5 | 11 | | 20 | 20 |
| 4 | 1,728 | | 24 | 6 |
| 5 | 596 | | 32 | 2 |
| 6 | 1,728 | | | |
| 7 | 6 | | | |

→ **22 distinct numeric padding values** in active use.

### Gap (`gap-/gap-x-/gap-y-`)
Values in use: 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 — **11 distinct values**. Heaviest: `gap-2` (2,679), `gap-1` (1,070), `gap-4` (1,260), `gap-3` (1,078).

### `space-y-*`/`space-x-*`
Values in use: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10 — **13 distinct values**. Heaviest: `space-y-1` (1,180), `space-y-4` (830), `space-y-1.5` (383).

### Margin (`m-/mx-/my-/mt-/mb-/ml-/mr-`)
Values in use: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, plus `auto` — **16 distinct tokens** (15 numeric + `auto`).

### Union across all four spacing families
**22 distinct numeric spacing steps** (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 32) are in active use, plus `auto` for margins — **23 distinct spacing tokens total**, versus the **~6** the declared scale implies (`p-1/p-2/p-3/p-4/p-6/p-8` ≈ 4/8/12/16/24/32px). That is roughly **3.7× more spacing granularity** than documented, even before counting arbitrary values below.

### Arbitrary bracket-value spacing (fully off-scale, e.g. `p-[18px]`)
**~20 distinct arbitrary-value spacing classes** found, concentrated in shared components: `components/ui/card.tsx` (`py-[14px]`, `px-[18px]`, `p-[18px]`), `components/ui/button.tsx` (`py-[10px]`, `px-[18px]`), `components/ui/badge.tsx` (`py-[4px]`, `px-[11px]`, `gap-[5px]`), `components/ep/EPSkeleton.tsx:px-[18px]`, `components/dizayn-new/AppSidebar.tsx:pl-[calc(0.75rem-2px)]`. Notably these appear in the **shared `components/ui/*` primitives** used everywhere, not just page-level one-offs — meaning arbitrary-value drift is baked into foundational components, not only page code.

### Raw inline `padding`/`margin` (bypasses Tailwind entirely)
- Inline `padding:` — **281 occurrences across 75 files**; heaviest again in `pos-monitor/` (`PosWarehouses.tsx` 20, `PosMovementKirimSteps.tsx` 20, `PosMaterials.tsx` 15) plus `pages/WarehouseBinsPage.tsx` (13).
- Inline `margin:` — **54 occurrences**. Representative: `components/aisha/TransparencyPanel.tsx:47` (`margin: '8px 0'`), `components/kanban/BoardDialogs.tsx:267` (`margin: 0`), `main.tsx:65` (`margin: "80px auto"`), `pages/CandidateReport.tsx:168` / `pages/CandidateReportDialog.tsx:159` (`@page { margin: 1.5cm; }` inside print-CSS template strings), `pages/DirectorExtended.tsx:51,60` (print-CSS template string), `pages/BarcodeSystem.tsx:132` (large inline `<style>` template string with `padding`/`margin`/`font-size` all hardcoded for a print window).

---

## 5. Page-root wrapper pattern: bare `space-y-6` vs. double-pad anti-pattern

DIZAYN_QOIDALARI.md D-3/D-4 (already confirmed this pass): *"AppShell allaqachon `p-4 lg:p-6` + `overflowY:auto` beradi — sahifa root `space-y-6` XOLOS"* (AppShell already gives `p-4 lg:p-6` + `overflowY:auto` — the page root should be `space-y-6` ONLY).

### 5a. The dominant, quantifiable cause: a shared component that itself violates D-4

`artifacts/erp-dashboard/src/components/DedicatedPageShell.tsx:30`:
```tsx
export function DedicatedPageShell({ title, description, actions, children }: DedicatedPageShellProps) {
  ...
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader ... />
      {children}
    </div>
  );
}
```
Its own doc-comment calls it *"standart shell — ARCHITECTURE.md §40.4 talab"* (the mandated standard shell) — yet its root div re-applies `p-5 lg:p-6` (note: `p-5`, not even matching AppShellModern's own `p-4`) and `h-full` on top of `AppShellModern.tsx`'s already-applied `p-4 lg:p-6` + `overflowY:auto` wrapper. This is D-4's exact anti-pattern, built into the component that is documented as the canonical fix for placeholder→real-page migrations.

Grep confirms the blast radius:
- **21 files** consume it via `<DedicatedPageShell`.
- **191 files** contain the identical literal wrapper string `h-full p-5 lg:p-6` copy-pasted directly into their own root div (190 inside `pages/`, 1 being `DedicatedPageShell.tsx` itself) — i.e. the anti-pattern has propagated by copy-paste independently of the shared component, not only through reuse of it.
- Variant gap values found riding the same template: `gap-5` (167), `gap-4` (12), `gap-8` (3), `gap-6` (1).
- Combined, **≈211 of 361 routed page files (~58%)** are hit by this one specific double-pad template shape alone (component-usage + copy-paste, roughly deduplicated).

### 5b. A second, parallel shell system with a *different* non-canonical spacing value

`artifacts/erp-dashboard/src/components/ui/module-page.tsx:132` — `ModulePage`:
```tsx
return (
  <div className={cn("space-y-4", className)}>
    <div className={cn("flex items-center justify-between gap-4 p-4 rounded-lg border-l-4", ...)}>...</div>
    {children}
  </div>
);
```
This is a **completely separate page-header/layout component** from the canonical `EPPageHeader` (`components/ep/`), with its own per-module color map (`bg-module-sd-light`, etc.) that duplicates — via a different mechanism — the `--mod-*` accent-token concept DIZAYN_QOIDALARI.md declares, and its root wrapper uses **`space-y-4`, not the mandated `space-y-6`.**
- **45 files** in `pages/` use `<ModulePage`.
- **162 files** use `<EPPageHeader` (the canonical one).
- Only **2 files** use both. These are two parallel, non-interoperating page-shell systems in concurrent use.

### 5c. Manually-verified stride sample (n=38 files, every ~9th entry from the 361 routed pages extracted from `routes/*.tsx`, root return statement read directly — not grepped blindly, to exclude nested `.map()` callback returns and helper-subcomponent returns defined later in the same file)

| Classification | Count | Examples |
|---|---:|---|
| **Bare canonical** (`space-y-6` only, no padding/height/flex added) | 4 | `Certificates.tsx`, `ExpenseManagement.tsx`, `StockReservation.tsx`, `camera-employee-ratings.tsx` |
| Bare + minor extra (`space-y-6 min-h-full`, no padding dup) | 1 | `SDQuotaDashboard.tsx` |
| **Parallel `ModulePage` shell** (`space-y-4`, not `space-y-6`) | 2 | `ApplicationResponsesPage.tsx`, `EmployeeZoneHistoryPage.tsx` |
| **Double-pad anti-pattern** (own `p-4/5/6` / `h-full` / `flex` wrapper on top of AppShell's) | 28 | `AccountantView.tsx` (`h-full p-5 lg:p-6 gap-8`), `CrmCohortAnalysis.tsx` (`p-6 space-y-6`), `PayrollAutomation.tsx` (`h-full p-5 lg:p-6 space-y-6` — triple redundancy), `OrdersRegistry.tsx`, `Questionnaire.tsx`, `RecruiterKPIPage.tsx` (`p-6 space-y-6 print:p-4`), `WarehouseTypePage.tsx` (`space-y-4 p-4`), `agents/QualityDashboard.tsx` (`p-6 space-y-5 max-w-7xl mx-auto`), `qc/InProcessQcPage.tsx` (via `<DedicatedPageShell>`), + 19 more (HR*, MMDashboard, MarketingCalendar, ForecastAnalytics, DesignDashboard, ERPDailyReports, SDDebitors, SecurityDashboard, TelegramBotAdmin, WMSSettings, WmsGoodsIssuePage, LMSSupport, AuditorPanel) |
| Other/custom bespoke pattern | 3 | `CameraAIModernHub.tsx` (`cai-module space-y-8 pb-12 -mx-1 sm:-mx-2` — a separate bespoke "modern" redesign shell), `CRMWorkspace.tsx` (`flex flex-col h-full -m-4 lg:-m-6` — a *deliberate* negative-margin full-bleed override that cancels AppShellModern's padding, functionally distinct from careless double-padding), `WarehouseKpiHub.tsx` (bare `<div>` with **no className at all** — no spacing convention applied) |

**Real ratio: 4/38 (~11%) use the sanctioned bare `space-y-6` root. ~34/38 (~89%) deviate from D-3/D-4 in some way; ~28/38 (~74%) specifically hit the double-pad anti-pattern the doc calls out in section 3.** This manually-verified rate is higher than the blunt single-string grep rate (58%, §5a) because the grep only catches one literal template shape — the broader "family" of the same mistake (padding/height/flex re-applied at the page root) appears in several slightly different copy-pasted forms (`p-6 space-y-6`, `p-6 space-y-5 max-w-7xl mx-auto`, `space-y-4 p-4`, `h-full flex flex-col gap-4`, etc.), all converging on the same underlying defect.

---

## Summary of real counts

- **9,797** Tailwind `text-*` usages across 10 size steps (declared scale names ~5 of them); **6,456** `font-*` weight usages across 8 weight steps (declared scale names ~3).
- **~896** genuine raw inline `fontSize`/`fontWeight` DOM-style bypasses (990/394 raw hits minus 94 defensible Recharts prop uses), spanning **27 distinct raw pixel sizes** and concentrated overwhelmingly in `pos-monitor/*` (top 6 offending files all there).
- **23 distinct spacing tokens** (22 numeric + `auto`) in active use across padding/gap/space-y/space-x/margin, vs. **~6** implied by the declared scale (~3.7× drift), plus **~20 fully arbitrary bracket-value overrides** baked into shared `components/ui/*` primitives themselves.
- **281** inline `padding:` + **54** inline `margin:` raw-style occurrences, again `pos-monitor/*`-dominated.
- Page-root wrapper: **only ~11%** of sampled routed pages use the sanctioned bare `space-y-6` root; **~74%** hit the double-pad anti-pattern, traceable in large part to one shared component (`components/DedicatedPageShell.tsx:30`, ~211 pages affected) that itself was built non-compliant, plus a second, parallel `ModulePage` shell system (`components/ui/module-page.tsx:132`, 45 pages, own `space-y-4` root) competing with the canonical `EPPageHeader`.

All findings above are descriptive characterizations of current repository state as of this read-only pass; no files were modified, and nothing in this report should be interpreted as authorization to make any change.

---

# Part 1, Item 6 — Routed Page Count & Visual-Pattern Cluster Breakdown

**Scope of this pass:** strictly read-only (Read/Grep/Glob/git log/cat/ls only). No files were edited, created, or deleted; no commits made. All findings below are descriptive.

---

## 1. Routed-page-count finding

**Route files, confirmed by direct listing** (`artifacts/erp-dashboard/src/routes/`, today's HEAD):
12 `*.tsx` files carry route data — `AdminRoutes.tsx, AnalyticsRoutes.tsx, AppRouter.tsx, CameraRoutes.tsx, CRMRoutes.tsx, DirectorRoutes.tsx, FinanceRoutes.tsx, HRRoutes.tsx, ModuleGroup.tsx, ProductionRoutes.tsx, StubRoutes.tsx, WarehouseRoutes.tsx` (plus `roleConstants.ts` — not `.tsx`, and a `__tests__/` subfolder, both excluded by the guard script's own `.tsx`-only glob).

**Three genuinely different numbers exist for "how many pages," and the prior session's citation was one specific one of them — here's the reconciliation:**

| Metric | Value (confirmed today) | What it actually counts |
|---|---|---|
| **Sidebar menu links** | 285 (per `scripts/check-sidebar-routes.mjs`, not re-run — I did not execute it, since running a script falls outside this pass's read-only tool allowlist; cited from its own source code) | Curated navigation entries in `components/sidebar/constants.ts` — a *subset* of all routes (excludes `:id` detail routes, redirect aliases, etc.) |
| **Unique routed page files** | **360** | `grep`-extracted, deduped `@/pages/...` import paths actually referenced by a `[path, Component]` tuple or JSX `<Route>` across all 12 route files — the real "how many distinct page components does the app route to" number |
| **Total routed URL patterns** | **477** | 473 tuple entries (`grep -c "^\s*\['[^']+',"` across the 10 tuple-bearing files) + 4 direct JSX routes in `AppRouter.tsx` (`/`, `/chat`, `/chat/admin`, `/aisha`). One page file is often reused across multiple URL patterns (list + `:id` detail, etc.), explaining 477 > 360. `AppRouter.tsx` additionally carries 54 pure `<Redirect>` aliases (old URL → canonical URL) — these are **not** pages, just redirects, and are excluded from the 477. |
| **Raw scanner "route patterns"** | 528 (prior citation, not independently reproduced) | Produced by `scripts/check-sidebar-routes.mjs`'s `STRING_PATH_RE` pass, which — by its own source comment — also scans **bare `"/..."` string literals** in the two shell files (`App.tsx`, `AppRouter.tsx`), not just genuine `<Route>`/tuple paths. That pass is a noisy superset (catches any quoted string starting with a letter/digit after a leading slash) — it is the union of real routes + redirect aliases + non-route string literals, which is why it's larger than the clean 477. |
| **"14 files" in the prior citation** | Currently 13 (12 route `.tsx` files + `App.tsx`, `AppRouter.tsx` deduped since it's in both the glob and the shell list) | 1-file gap unexplained — checked `git log --follow` on `roleConstants.ts` for a `.tsx→.ts` rename that would account for it; no rename found in history. Likely the file set simply changed by one file in the ~day(s) since that pre-commit run (this repo has an actively-running build loop per project memory). Immaterial to the actual page count either way — both scans cover the same route files. |

**Bottom line for "how many routed pages exist": ~360 unique page files / ~477 routed URL patterns.** This is the number I sampled against below. (For cross-reference: `docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`, dated 4 days prior, independently arrived at "~380 page routes" via the same per-file `lazy()` count method — consistent with mine within normal day-to-day drift of an actively-changing route set.)

Separately, `find` over `artifacts/erp-dashboard/src/pages` shows **1,182 total `.tsx` files** (928 after excluding obvious split-file suffixes `*Types/*Helpers/*Sections/*Dialogs/*Tabs`). That gap (928 vs. 360 routed) means roughly two-thirds of files under `src/pages` are either non-page sub-components co-located with a routed page, or orphaned/unrouted page files — **not** itself a "routed page count," included here only so the two numbers aren't confused.

---

## 2 & 3. Sample classification and extrapolation

**Sample size:** 63 page files (exceeds the requested 40–50), hand-picked for spread across roughly 20 business-domain clusters (HR, Finance, PP, MES, QC, Warehouse/WMS, SD/CRM, Marketing, Design, MRO, IoT, Camera/Security, Admin, LMS, Director, Analytics, AI-agent pages, Kaizen/Registry, POS). This is **19% of the 360-file population**, not exhaustive — treat the cluster splits below as directional, not precise.

To reduce guesswork I also ran two **exhaustive** (non-sampled) checks across all 360 routed files, which anchor the sample's extrapolation (see §3b).

### Sample table

| Page file | Module | Cluster | Evidence |
|---|---|:---:|---|
| Employees.tsx | HR | (a) | EPPageHeader×3, EP import, no raw hex |
| HRDashboard.tsx | HR | (a) | EPPageHeader×3, EP import |
| HRCapitalTests.tsx | HR | (a) | EPPageHeader×2, EP import |
| OrgStructureHierarchy.tsx | HR | (c) | No EPPageHeader; only imports `EPErrorState, EPStatusPill`; local hand-rolled `KpiCard` with raw-hex `color="#1d4ed8"` etc. (lines 218-222) |
| SkillsMatrix.tsx | HR | (c) | No EPPageHeader; only `EPErrorState` imported |
| Discipline.tsx | HR | (c) | No EPPageHeader; only `EPErrorState` imported |
| FinanceDashboard.tsx | Finance | (a) | EPPageHeader×2, EP import |
| AccountsPayable.tsx | Finance | (a) | EPPageHeader×3 |
| ChartOfAccounts.tsx | Finance | (a) | EPPageHeader×2 |
| BudgetManagement.tsx | Finance | (a) | EPPageHeader×3 |
| CashFlowManagement.tsx | Finance | (a) | EPPageHeader×2 |
| PPDashboard.tsx | Production/PP | (a) | EPPageHeader×2 |
| PlanningBoard.tsx | Production/PP | (c) | No EPPageHeader; only `EPErrorState` |
| RoutingConfiguration.tsx | Production/PP | (a) | EPPageHeader×2 |
| BOMManagement.tsx | Production/PP | (c) | No EPPageHeader; `EPErrorState/EPStatusPill/EPLoader` imported but no page shell |
| CapacityPlanning.tsx | Production/PP | (a) | EPPageHeader×2 |
| MESHomeDashboard.tsx | MES | (c) | Zero EP-component imports at all |
| MESWorkCenters.tsx | MES | (c) | Zero EP-component imports at all |
| MESDowntimes.tsx | MES | (c) | No EPPageHeader; only `EPStatusPill` |
| MESWorkerAssignments.tsx | MES | (c) | Zero EP-component imports at all |
| QCDashboard.tsx | QC | (c) | Zero EP-component imports at all |
| QCApproval.tsx | QC | (c) | Zero EP-component imports at all |
| QCFinalInspection.tsx | QC | (a) | EPPageHeader×2 |
| WarehouseDashboardPage.tsx | WMS | (a) | EPPageHeader×2 |
| WMSDashboard.tsx | WMS | (a) | EPPageHeader×2 |
| WarehouseBinsPage.tsx | WMS | (c) | Zero EP imports; but 15 inline `style={{ ...var(--...) }}` token usages — tokenized custom, not header-shell compliant |
| WarehouseKirimWizard.tsx | WMS | (c) | Zero EP imports |
| SDDashboard.tsx | SD/CRM | (c) | No EPPageHeader; `EPSkeletonKpiRow/EPErrorState` only; 21 `var(--)` token inline styles (no raw hex) |
| SDCustomers.tsx | SD/CRM | (a) | EPPageHeader×3 |
| CRMWorkspace.tsx | SD/CRM | (c) | No EPPageHeader; 2 raw-hex occurrences — this is the flagship Kanban-cutoff-bug page already root-caused elsewhere in this audit |
| SalesOrders.tsx | SD/CRM | (a) | EPPageHeader×2 |
| SDSalesOrders.tsx | SD/CRM | (a) | EPPageHeader×2 (899 lines — at the Qoida-13 900-line file-size ceiling, tangential note) |
| MarketingDashboard.tsx | Marketing | (a) | EPPageHeader×3 |
| MarketingCampaigns.tsx | Marketing | (a) | EPPageHeader×2 |
| MarketingCalendar.tsx | Marketing | (a) | EPPageHeader×2 |
| DesignDashboard.tsx | Design | (b) | EPPageHeader×2 present, **but** raw-hex status-color map (`STATUS_COLORS = {"#3b82f6", "#f59e0b", ...}`, lines 42-47) instead of `EPStatusPill`/tokens |
| DesignOrders.tsx | Design | (a) | EPPageHeader×2 |
| DesignApproval.tsx | Design | (a) | EPPageHeader×2 |
| MRODashboard.tsx | MRO | (a) | EPPageHeader×2 |
| IoTDashboard.tsx | IoT | (a) | EPPageHeader×2 |
| IotSensorsPage.tsx | IoT | (c) | No EPPageHeader; only `EPErrorState` |
| CameraLiveMonitoring.tsx | Camera | (a) | EPPageHeader×2 |
| Settings.tsx | Admin | (c) | No EPPageHeader; only `EPErrorState` |
| UsersPage.tsx | Admin | (c) | No EPPageHeader; only `EPErrorState` |
| SuperAdminPanel.tsx | Admin | (c) | Zero EP imports |
| AuditLogPage.tsx | Admin | (c) | Zero EP imports |
| LMSDashboard.tsx | LMS | (b) | EPPageHeader×2 present + 1 raw-hex occurrence |
| Courses.tsx | LMS | (a) | EPPageHeader×2 |
| CourseDetail.tsx | LMS | (a) | EPPageHeader×2 |
| DirectorDashboard.tsx | Director | (a) | EPPageHeader×2 |
| DirectorAiAudit.tsx | Director | (c) | Zero EP imports, plain custom `<h1>`. Named "Ai" but is an audit-log viewer, not a genuine Qoida-9 AI-visualization page — checked and does **not** qualify for the exemption despite the name |
| DirectorExtended.tsx | Director | (b) | EPPageHeader×2 present + an embedded raw-hex HTML `<style>` block (print/export template, lines 51-67) |
| Analytics.tsx | Analytics | (a) | EPPageHeader×2 |
| ForecastAnalytics.tsx | Analytics | (c) | No EPPageHeader; only `EPLoader`; 8 raw-hex Recharts series colors |
| AIAgentsPage.tsx | AI/agent | (d) | EPPageHeader×2 present — but Qoida-9-class page regardless |
| AIFinancePage.tsx | AI/agent | (d) | Named explicitly in DIZAYN_QOIDALARI.md §9 as the canonical exemption example |
| AiCrmPage.tsx | AI/agent | (d) | EPPageHeader×2 present, Qoida-9-class |
| KaizenPage.tsx | Kaizen | (c) | Zero EP imports |
| OrdersRegistry.tsx | Orders Registry | (c) | Zero EP imports |
| KanbanBoard.tsx | Kanban | (c) | No EPPageHeader; only `EPErrorState` |
| PosMonitorPage.tsx | POS | (c) | Zero EP imports (892 lines, near the 900-line ceiling) |
| SecurityDashboard.tsx | Security | (a) | EPPageHeader×2 |
| CashierHub.tsx | POS/Finance | (a) | EPPageHeader×2 (1,125 lines — **over** the Qoida-13 900-line cap; tangential file-size flag, not a design-cluster issue) |

### Sample cluster counts (N=63)

| Cluster | Count | % of sample |
|---|---:|---:|
| (a) EPPageHeader + EP-based, compliant | 31 | 49% |
| (b) EPPageHeader present, custom styling elsewhere | 3 | 5% |
| (c) No EPPageHeader, custom/legacy | 26 | 41% |
| (d) AI/agent page (Qoida-9 exempt) | 3 | 5% |
| (e) other/unclear | 0 | 0% |

### 3b. Exhaustive population checks (all 360 routed files — not a sample)

Because the hand-picked sample deliberately favored one flagship/dashboard page per module (the natural choice when sampling "for spread"), I ran two full, non-sampled `grep` passes over **all 360** unique routed page files to check the sample for bias:

| Check (all 360 files) | Count | % |
|---|---:|---:|
| Imports `EPPageHeader` | 153 | **42.5%** |
| Imports *any* `@/components/ep` primitive | 261 | 72.5% |
| Imports **zero** `@/components/ep` primitives (strictest "fully custom" floor) | 99 | 27.5% |

**Bias check:** my sample's "has EPPageHeader" rate — (a)+(b)+(d) = 37/63 = **59%** — runs about 16 points hotter than the exhaustive 42.5% population figure. This confirms the sample skews optimistic (I picked mostly `*Dashboard`-style flagship pages, which the codebase's own newer template pass tends to favor); the long tail of `*Config`, list/CRUD, and secondary pages within each module — underrepresented in my 63 — is where non-compliance concentrates (consistent with `MESHomeDashboard/MESWorkCenters/QCDashboard/SuperAdminPanel/AuditLogPage/KaizenPage/OrdersRegistry/PosMonitorPage` all landing at "zero EP touch" in the sample itself).

### Extrapolation, reconciled

Anchoring to the exhaustive 42.5%-with-header figure rather than the sample's 59%, and applying the sample's internal (a):(b) split among header-havers (~91:9) and treating headerless pages as predominantly (c) with a small (d) share:

| Cluster | Extrapolated share of all ~360-477 routed pages |
|---|---|
| (a) Compliant | **~38%** |
| (b) Header present, custom elsewhere | **~4%** |
| (c) No header, custom/legacy | **~53%** (of which ~28 points are "zero EP touch whatsoever," the rest use at least `EPErrorState`) |
| (d) AI/agent exempt | **~4-5%** |
| (e) other/unclear | negligible in both checks |

**Confidence caveat (explicit, as instructed):** this is an extrapolation from a 63-page hand-picked sample (17.5% of 360) *cross-checked* against two exhaustive-but-narrow grep signals (header presence, any-EP-primitive presence) over the full 360-file population. The exhaustive checks are reliable counts of *those two specific signals*; the full (a)/(b)/(c)/(d)/(e) split is not independently verified past the 63-page sample, since distinguishing "(a) fully compliant" from "(b) header + one hex leak" requires reading each file, which was only done for the 63. Treat the final percentage table as directional (±5-10 points), not precise.

---

## 4. Cross-reference with existing docs (this substantially pre-answers the task)

Two existing audits in `docs/audit/`, dated 3-4 days before this pass, already investigated this exact question in much greater depth than this pass had time for, and should be treated as the primary source — this pass's numbers are a smaller, fresher confirmation, not a replacement:

- **`docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`** — read-only, ~380 routes counted the same way (per-file `lazy()` tallies), ~67 pages opened in full (18%), rest pattern-scanned. Per-module `EPPageHeader` adoption: **HR only ~7/48 (15%)**; **Admin/LMS/Kaizen/Stub only ~22/76 (29%)**; headline: "`EPPageHeader` non-adoption (INCONSISTENT, ~54–95 pages)" flagged as one of 3 systemic root causes, alongside a duplicate-Tailwind-breakpoint bug (since fixed per the second doc) and app-shell double-padding (the same `AppShellModern.tsx:180` `p-4 lg:p-6` ancestor already root-caused for the CRM Kanban cutoff bug in this pass's established context — that doc independently confirms it as a systemic, not one-off, issue).
- **`docs/audit/DESIGN-FULL-ANALYSIS-2026-07-06.md`** — a deeper follow-up with **exact, already-computed numbers that directly answer this task**, over a broader denominator of "~619 top-level pages" (all page-shaped files under `src/pages`, not filtered to only currently-routed ones):
  - `EPPageHeader` adoption: **163/619 ≈ 26%**
  - Any `@/components/ep` primitive: **404/619 ≈ 65%**
  - No shared layout primitive at all: **276/619 ≈ 45%**
  - Explicit per-page judgment table (their "Part B") of ~40-50 pages the doc itself identifies as "should-be-templated but built ad-hoc" — including `Warehouse*`, `*Config` (11+), and HR-cluster pages, which overlaps heavily with this pass's own (c)-cluster findings (`WarehouseBinsPage`, `WarehouseKirimWizard`, HR pages) found independently.
  - Its own Part D cross-reference explicitly marks "(4c) EPPageHeader non-adoption — STILL OPEN, adoption ~26%" as of 2026-07-06.

**Reconciling the two different adoption percentages (26% in that doc vs. 42.5% found in this pass, both today's-repo-state checks 3 days apart):** the denominators differ — that doc's 619 is "all page-shaped files in `src/pages`," while this pass's 360 is "only files actually imported by a route file today." The gap is plausibly explained by orphaned/unrouted page files (which would sit in their 619 denominator without ever having been migrated, since nothing routes to them) rather than genuine regression-free progress — though real incremental progress from the actively-running build loop noted in project memory (`project_vision_build_loop_2026_07_08.md`) is also a plausible contributor. This pass did not have time to isolate which factor dominates; flagging it rather than asserting a resolved number is the honest position.

**Net effect:** items 2-3 of this task (sample + extrapolation) are **not new information** so much as a smaller, independently-derived confirmation that lands in the same range as the pre-existing, more rigorous `DESIGN-FULL-ANALYSIS-2026-07-06.md` figures — both say EPPageHeader/EP-compliance is a **minority-to-roughly-half** phenomenon across the routed page population, with the non-compliant majority concentrated in QC/MES dashboards, `*Config` pages, Admin/Kaizen/Registry utility pages, and (per the second doc's much larger 692-hardcoded-color-line finding) a deeper "three coexisting color languages" problem — Kanban's neumorphic palette, CRM's Material-Design palette, and the EP token system — that this pass's smaller sample also touched (`CRMWorkspace`, `OrgStructureHierarchy`'s local raw-hex `KpiCard`) but did not have scope to quantify at that depth.

---

# Part 1b — Layout Overflow / Clipping Defects (distinct from style inconsistency)

# Design Audit — Part 1b: Layout Overflow/Clipping Bug Sweep

**Role: read-only analysis.** Everything below is a description of what the code currently does. Nothing in this report was executed as an instruction to change anything — no file was edited, no command beyond `grep`/`git`/`Read` was run. Any phrase resembling a recommendation is a finding for a future, separately-authorized session.

**Live verification not available this pass** (concurrent session holds the dev-server port; editing the shared `launch.json` to add a port was correctly treated as an off-limits write). Every conclusion below is static-analysis-only, and I've flagged specifically where that's a hard boundary vs. where CSS semantics make the conclusion effectively certain without a browser.

---

## 1. AppShellModern is the parent of every routed page — confirmed, with exact bypass list

`artifacts/erp-dashboard/src/App.tsx:114-124` mounts `<AppShellModern>` exactly once, wrapping `<AppRouter/>` (all 25 `ModuleGroup` route tables — HR, SD/Sales, MES, QC, Warehouse, Finance, Admin, LMS, Kaizen, etc., `artifacts/erp-dashboard/src/routes/AppRouter.tsx:41-51,105-129`). `AppShellModern.tsx:180` is the single content wrapper for `{children}` in that mount — there is no second call site.

Routes that bypass it entirely (handled by earlier `return` branches in `App.tsx`'s `MainApp()`, before `<AppShellModern>` is ever reached — different DOM root, not a nested-clip case at all):
- `/login`, `/otp-verify`, `/iot/tablet`, `/ai-interview/*`, `/public/hrc-test/*`, `/mini-app*`, `/pos-monitor*` (standalone `PosMonitorApp`), `/chat` and `/chat/*` (`App.tsx:99-109`).

Aside: `AppRouter.tsx:190-200` also defines `/chat` and `/chat/admin` routes, but `MainApp()`'s `location.startsWith("/chat/")` branch (`App.tsx:99`) intercepts before `AppRouter` ever renders, so those two `<Route>` entries are unreachable dead code — not an overflow finding, just a byproduct of tracing the mount chain, noted for completeness only.

Every other authenticated URL — the entire HR/SD/MES/QC/WMS/Finance/Admin/LMS surface — renders as `{children}` inside `AppShellModern.tsx:180`'s `overflowX:"hidden"` div. Confirmed genuinely universal for that surface, not partial.

---

## 2 & 3. The 97-file overflow-x-auto sweep — classification and the affected-instance list

Reproduced the file list: `grep -rl "overflow-x-auto" artifacts/erp-dashboard/src --include="*.tsx" | wc -l` → **97**, matching the given count.

### Method
For each candidate: grep the file for `DialogContent|SheetContent|PopoverContent|AlertDialogContent` and compare line numbers against the `overflow-x-auto` line(s) to see whether the overflowing container is textually *inside* a portaled block or in the component's main (non-portaled) return. Then traced each component's usage site(s) via `grep -rln "<ComponentName"` to confirm whether it's mounted as direct page content (via `routes/*.tsx`) or exclusively inside a `<Dialog>`/`<Sheet>`. Confirmed the portal mechanism itself is real, not just naming convention: `components/ui/dialog.tsx:19,44`, `sheet.tsx:22,68`, `popover.tsx:19` all wrap their content in the Radix `*Primitive.Portal`, which does a genuine `ReactDOM.createPortal(…, document.body)` — a real DOM relocation, not a CSS trick. Sample size: **57 files individually inspected with line-level evidence** (well above the 30 asked for), covering every distinct pattern found in the full 97.

### Category A — Confirmed AFFECTED (in-page, no portal, structurally clipped)

This is the overwhelming majority: **~88 of the 97 files** have their `overflow-x-auto` container in the component's main render path, and that component is mounted as direct routed-page content (verified against `routes/*.tsx` or a traced parent-page chain). Representative entries — component | page(s) | clipped content:

| Component | Page(s) | What gets clipped |
|---|---|---|
| `components/crm/workspace/KanbanView.tsx:34` | CRMWorkspace.tsx (`/crm-workspace`) | CRM pipeline stage columns (flagship bug — see §6) |
| `components/crm/workspace/CRMHeader.tsx` | CRMWorkspace.tsx | header filter/tab strip |
| `components/Material360Card.tsx` | WMSMaterials.tsx (material detail route) | material-360 tabs (incl. nested FinanceTab table) |
| `components/employee/EmployeeCardsSummary.tsx` | EmployeeProfile.tsx | employee card summary table |
| `components/hr/org/RazryadLevelsPanel.tsx` | OrgNodeDetail.tsx (`/org-structure/hierarchy/node/:id`, via RazryadTab) | razryad level table |
| `components/hr/orgnode/CkpCascadeDashboard.tsx`, `CkpTab.tsx` | OrgNodeDetail.tsx | CKP cascade table |
| `components/hr/orgnode/DarslikTab.tsx` (in-page instance only) | OrgNodeDetail.tsx | darslik table |
| `components/kanban/KanbanBoardView.tsx` | KanbanBoard.tsx (`/kanban`) | task board columns |
| `components/recruiting/KanbanBoardGrid.tsx` | RecruitingKanban.tsx | recruiting pipeline columns |
| `components/sd/Customer360View.tsx` | Customer360Page.tsx | customer-360 tabs incl. OrdersTab/FinanceTab tables |
| `components/sd/europrint/LeadsTab.tsx` | SD leads view | leads table |
| `components/sd/FinanceTab.tsx` | Customer360View, Material360Card, DirectorExtended.tsx, EmployeeProfile.tsx | finance line-item table |
| `components/sd/OrdersTab.tsx` | Customer360View, OrdersRegistry.tsx, PPDashboard.tsx | orders table |
| `pages/CRMFunnelSettings.tsx:111,141` | its route | 2 funnel-stage config tables |
| `pages/ErrorCatalogConfig.tsx:370` | its route | error code catalog table |
| `pages/GLDocuments.tsx:324` | its route | GL documents table |
| `pages/IotSensorCapex.tsx:216` | its route | sensor capex table |
| `pages/mro/CanteenManagementPage.tsx:254` | its route | canteen menu/orders table |
| `pages/OrderApprovalWorkflowSections.tsx:57` | its route | approval workflow pipeline strip |
| `pages/PeriodClosing.tsx:234` | its route | period-closing checklist table |
| `pages/PosMonitorPage.tsx:324` | **`/wms/pos-monitor` route only** (see special case below) | stock table |
| `pages/PPReasonCodes.tsx:162` | its route | reason codes table |
| `pages/qc/InProcessQcPage.tsx:259`, `RootCausesPage.tsx:243`, `SupplierQualityPage.tsx:212` | their routes | QC data tables |
| `pages/QuestionBankConfig.tsx:466` | its route | question bank table |
| `pages/RulonCards.tsx:359` | its route | roll (rulon) cards table |
| `pages/SDKpi.tsx:236,341` | its route | 2 KPI tables |
| `pages/WarehouseStockPage.tsx:121` | its route | stock table |
| `pages/WorkCenterNormsConfig.tsx:152` | its route | work-center norms table |
| `pages/SuperAdminPanelSections.tsx:198` (only this instance) | its route | audit-ish table |
| `pages/AccountsPayableSections.tsx`, `AccountsReceivableSections.tsx` | AccountsPayable.tsx / AccountsReceivable.tsx | AP/AR line-item tables |
| `pages/AuditLogPageSections.tsx:94,211` | AuditLogPage.tsx | audit log table + JSON diff `<pre>` blocks |
| `pages/BudgetManagementSections.tsx`, `CashFlowManagementSections.tsx`, `ChartOfAccountsSections.tsx` | their `*Management.tsx`/`*Accounts.tsx` pages | budget/cashflow/CoA tables |
| `pages/EmployeeDailyKPIPanelSections.tsx`, `FaceRecognitionMonitoringSections.tsx`, `HRAssetManagementSections.tsx` | their pages | data tables |
| `pages/MaterialsAccountingPanels.tsx:143` | MaterialsAccounting.tsx | sticky-header materials table (`max-h-80`) |
| `pages/MaterialsAccountingSections.tsx`, `OrdersRegistrySections.tsx`, `ShiftScheduleSections.tsx`, `WarehouseReportsAllSections.tsx` | their pages | data tables/grids |
| `pages/accountant/AuditConsoleDialogs.tsx` (`AuditLogDetailDialog`) | AuditConsole.tsx | JSON diff `<pre>` blocks — see the fixed-position nuance in §5 |
| ~35 more `pages/*.tsx` files confirmed via direct route-table match (`routes/*.tsx`) **and** confirmed to contain zero `DialogContent`/`SheetContent`/`PopoverContent` anywhere in the file (so no portal escape is even structurally possible): `DemandForecastingPage`, `CompanyStateThresholdConfig`, `CrmCohortAnalysis`, `CustomerPortalConfig`, `ERPProduction`, `GofraWasteConfig`, `IoTExtended`, `KpiScoreWeightsConfig`, `KpiThresholdConfig`, `LMSCourseCardBinding`, `MROExtended`, `MrpMatrix`, `RazryadLevelConfig`, `ReceptionPage`, `SaaSExtended`, `SDSalesManagement`, `SecurityExtended`, `TechPPExtended`, `WarehouseAuditLog`, `WarehouseDashboardPage`, `WarehouseMaterial360`, `WasteTracking`, `WmsAnalyticsPage`, `WMSVarianceApproval`, `mro/SparePartsPage`, `mro/UtilityReadingsPage`, `qc/PaperParametersPage`, `qc/QcDpmoCalculator`, `qc/QcParametersConfig`, `qc/QualityTrendPage`, `camera-employee-ratings`, `planning/PlanningTabPanels` (→ PlanningBoard.tsx), `pages/iot/IotMaintenanceMonitorTab` (→ IoTDashboard.tsx), `RecruiterKPIPageAnalytics`/`RecruiterKPIPageTables` (→ RecruiterKPIPage.tsx), `pages/FinanceExtended.tsx:166` (see caveat below) | | tables/charts/grids |

**One caveat inside that last batch:** `pages/FinanceExtended.tsx:166` is `<div className="border-b border-border/50 px-4 overflow-x-auto" />` — a **self-closing, empty div** (no children). It's genuinely inside the affected DOM subtree, but there's nothing in it to clip — looks like vestigial markup from a removed `TabsList`. Listed for completeness, not as a real clipped-content instance.

### Category B — Confirmed NOT AFFECTED (Radix Portal escape, verified at the primitive level, not by name-guessing)

| Component | Where it's mounted | Why it's exempt |
|---|---|---|
| `components/hr/org/CardCoursesDialog.tsx:76` | inside its own `DialogContent:56-121` | portaled |
| `components/hr/org/CardDetailDialog.tsx:282,580` | both inside `DialogContent:190-571` (line 580 is a `SimpleTable` helper called only at line 561, inside the same Dialog's Tabs) | portaled |
| `components/hr/org/CardExamsDialog.tsx`, `CardKnowledgeDialog.tsx`, `CardMentorsDialog.tsx` | each is entirely a `DialogContent` body | portaled |
| `components/hr/orgnode/CkpCardProductsDialog.tsx:236` | inside `DialogContent:141-291` | portaled |
| `pages/AIProductionPlanningChart.tsx` (`GanttChart`) | imported and rendered **only** at `AIProductionPlanningDetailDialog.tsx:183`, itself inside `DialogContent:107-241` | portaled — this one is a genuine trap: it lives in `pages/` and looks like a page file by name, but it's a dialog-body helper with zero other consumers |
| `pages/hr/orgnode/DarslikTab.tsx` — **second usage only** | inside `CardDetailDialog.tsx`'s `DialogContent` | portaled (same component also has an in-page use — see Category A) |
| `pages/SuperAdminPanelSections.tsx:258,263` — **these two instances only** | inside a second, separate `DialogContent:240-268` in the same file | portaled (same file also has an in-page instance at line 198 — Category A) |
| `components/sidebar/MobileSidebar.tsx` | `Sheet`/`SheetContent` (`components/ui/sheet.tsx:22,68`) | portaled — checked as part of the sidebar surgical pass (§5) |

### Category C — Orphaned (never mounted anywhere — can't be "affected" because it never renders)

- `components/dizayn-new/DataTable.tsx` (`DataTableRedesign`) — zero consumers found anywhere outside its own folder and its own test file.
- `components/hr/org/OrgCardsPanel.tsx` — zero consumers found anywhere in the repo (no import, no JSX usage).

### Category D — Special dual-routing case

`pages/PosMonitorPage.tsx` is imported by **two** different mounts:
- `pos-monitor/PosMonitorApp.tsx` (the standalone app reached via `/pos-monitor*`, which per §1 bypasses `AppShellModern` entirely — **not affected**, different DOM root)
- `routes/WarehouseRoutes.tsx:59` (`/wms/pos-monitor`, routed through the normal `AppRouter` → `AppShellModern` — **affected**)

Same component, same file, two mount points, only one of them clipped. Worth knowing precisely which URL reproduces the bug for this page.

---

## 4. Vertical clipping (`overflow-y-hidden`, `overflow-hidden`) sweep

`overflow-y-hidden`: only **2 hits**, both `flex-1 overflow-x-auto overflow-y-hidden` on Kanban board containers (`components/crm/workspace/KanbanView.tsx:34`, `components/kanban/KanbanBoardView.tsx:56`). This is intentional, correct Kanban design — the board row itself shouldn't scroll vertically; each column handles its own internal vertical scroll. **Not a bug.**

`overflow-hidden` (both axes): **208 hits** — far too many to individually inspect at the same depth as the x-auto sweep. Targeted the highest-risk structural patterns instead of an exhaustive pass (this is a genuine scope limitation, noted honestly rather than glossed over):

- **`max-h-[…] … overflow-hidden` without an escape route** — found 2 hits (`camera-ai-modern/components/CameraMissionEditor.tsx:88`, `pages/iot/IoTChecklistModal.tsx:43`). Both looked suspicious on the Tailwind-class grep alone, but both turned out to delegate scrolling to a Radix `<ScrollArea>` component internally (`IoTChecklistModal.tsx:51`, `CameraMissionEditor.tsx:103`) — `ScrollArea` sets its own overflow via a different mechanism the grep can't see. **Confirmed false positives, not bugs.**
- **`sticky top-*` co-occurring with `overflow-hidden` in the same file** — 8 files (`ReceiptDetailSheet.tsx`, `CandidateChecklistDialogs.tsx`, `CVScreeningGuide.tsx`, `HRCareerPath.tsx`, `IoTProductionDashboardSections.tsx`, `kanban/GanttView.tsx`, `LMSExtended.tsx`, `MMExtended.tsx`). Sampled 3 (`GanttView.tsx`, `MMExtended.tsx`, `HRCareerPath.tsx`) and checked line-level proximity: in every case the `overflow-hidden` was either (a) on an unrelated small decorative element (a progress-bar chip, a task-bar truncation box) with no structural relationship to the sticky header, or (b) the *correct* idiomatic pattern — an outer `flex-1 flex flex-col overflow-hidden` height-constraint wrapper containing an inner `overflow-auto` scroll div, with the sticky `<TableHeader>` nested inside that inner div (its correct nearest scrolling ancestor). This is in fact the exact same "outer clip + inner scroll" pattern used by `AppShellModern` itself and by `ModuleSidebar.tsx:156,170` (`aside overflow-hidden` → inner `flex-1 min-h-0 overflow-y-auto overflow-x-hidden`) — it's the house style here, and it's implemented correctly everywhere sampled. **No genuine sticky-header-clip or vertical-content-unreachable bug found in the sample.**

Net for point 4: unlike the x-auto sweep, I did **not** find a systemic y-clipping analog to the CRM Kanban bug. The 5 remaining `sticky top` + `overflow-hidden` co-occurrence files were not individually traced — flagged as the highest-value next check if this needs to be exhaustive, but nothing in the sample suggests a hidden pattern is lurking there.

---

## 5. Modals/dialogs/sidebars — surgical check, plus one real nuance worth flagging

**Sidebars:** `ModuleSidebar.tsx` (desktop) and `MobileSidebar.tsx` both checked — both follow the correct outer-clip/inner-scroll pattern or portal (Sheet), no clipping bug found.

**Dialog/Sheet `max-h + overflow-hidden` combos repo-wide:** `grep -rln "DialogContent.*overflow-hidden\|SheetContent.*overflow-hidden"` → 4 files (`CameraMissionEditor.tsx`, `components/ui/command.tsx`, `pages/crm/DetailSheet.tsx`, `pages/iot/IoTChecklistModal.tsx`). All 4 checked line-by-line — all correctly nest either an `overflow-y-auto` div or a Radix `ScrollArea`/cmdk-list (`command.tsx:66` — `max-h-[300px] overflow-y-auto`) inside the clipped outer shell. **No content-cutoff bug found in this set.**

**The one real nuance — hand-rolled `fixed inset-0` modals that don't use Radix Dialog/Sheet at all.** Found 13 such components (`grep -rl "fixed inset-0"` minus files with `DialogContent`/`SheetContent`/`createPortal`): `ForwardModal.tsx`, `ImageLightbox.tsx`, `PollCreator.tsx`, `DataTable.atoms.tsx`, `EPDocumentPreview.tsx`, `EPLoader.tsx`, `AuditConsoleDialogs.tsx`, `AgentsHub.tsx`, `AuditLogPageSections.tsx`, `QuickCreateModal.tsx`, `IoTProductionDashboardSections.tsx`, `RollManagementPage.tsx`, `WarehouseMaterial360.tsx`. My first instinct was "not portaled → still nested inside AppShellModern's clip → affected," but that's actually **wrong**, and worth stating precisely:

CSS `position: fixed` elements resolve their containing block to the viewport (not to any ancestor's box) **unless** an ancestor between them and the viewport sets `transform`, `perspective`, `filter`, `backdrop-filter`, `will-change: transform`, or `contain: layout/paint/strict/content`. When that's true, a `position: fixed` element visually escapes an ancestor's `overflow: hidden` clip *without needing a portal* — this is a well-established (if easy to get backwards) piece of CSS behavior. I checked `AppShellModern.tsx`'s own wrapper chain (the shell `<div>`, `<main>`, and the `p-4 lg:p-6` inner div) and the shell's own CSS (`erp-modern-ui/global-surface.css:7-10` — `main.erp-main-canvas { position: relative; isolation: isolate; }`) for any of those trigger properties: **none found** — `position: relative` and `isolation: isolate` do *not* create a new containing block for fixed descendants.

So, with moderate-to-high confidence (contingent on no page-specific wrapper further down introducing a `transform`/`filter` I didn't individually check for all 13 files' exact mount points — that residual gap is the honest boundary of static analysis here): `EPDocumentPreview.tsx`, `AuditConsoleDialogs.tsx`'s `AuditLogDetailDialog`, and the other hand-rolled `fixed inset-0` overlays most likely **also escape** the AppShellModern clip, structurally, the same way Radix's portal does — just via a different mechanism (viewport-anchored positioning instead of DOM relocation) rather than being newly-affected instances. This reverses my own first-pass assumption and I'm flagging it explicitly so it isn't mistaken for a confirmed finding — it is the one conclusion in this report that most wants a live-browser check before being treated as settled, specifically because it hinges on an absence (no stray `transform`/`filter` anywhere in the chain) that I sampled rather than exhaustively proved for every one of the 13 files.

---

## 6. CRM Kanban flagship — full container chain, static-only

Confirmed the complete DOM ancestor chain by file and line:

1. `App.tsx:114-124` — `<AppShellModern>` wraps `<AppRouter/>`.
2. `AppShellModern.tsx:170` — `<main style={{ overflow: "hidden", display:"flex", flexDirection:"column", height:"calc(100dvh - 3.5rem)" }}>`.
3. `AppShellModern.tsx:180` — `<div className="p-4 lg:p-6" style={{ flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden" }}>{children}</div>` — **the clipping ancestor**, unchanged since `bacfb4485` per the prior finding.
4. `{children}` → `AppRouter` → route `/crm-workspace` → `CRMWorkspace.tsx`.
5. `CRMWorkspace.tsx:70` — `<div className="flex flex-col h-full -m-4 lg:-m-6" style={{background:"var(--ep-bg)"}}>`.
6. `CRMWorkspace.tsx:113` — `<div className="flex-1 overflow-hidden flex flex-col">` (its own nested height-containment wrapper).
7. `CRMWorkspace.tsx:127` — `<KanbanView … />` mounted inside step 6's div.
8. `KanbanView.tsx:34` — board container `className="flex-1 overflow-x-auto overflow-y-hidden"`.

**What the `-m-4 lg:-m-6` at step 5 does and does not do:** it's a negative margin that exactly cancels the `p-4 lg:p-6` padding applied by step 3's div, so `CRMWorkspace`'s own content (its custom header/toolbar) can render edge-to-edge/full-bleed instead of inset by the shell's default page padding. This is a **spacing/cosmetic** trick only — margin and padding do not interact with the `overflow` property at all. It has zero effect on step 3's `overflowX: "hidden"`, which remains active on that ancestor regardless of the margin trick applied three levels below it.

**What is confirmed by static analysis alone, with certainty (no browser needed):** step 3 is a genuine ancestor of step 8 in the React tree with no Radix Portal, no `position: fixed`, and no `createPortal` call anywhere in between (verified: `CRMWorkspace.tsx` and `KanbanView.tsx` use plain `flex`/`overflow` divs throughout that section). CSS overflow clipping for normal-flow boxes is deterministic: an ancestor with `overflow-x: hidden` structurally prevents any descendant, no matter how many nested `overflow-x: auto` declarations exist below it, from producing a working horizontal scrollbar or scrolling past that ancestor's clip boundary. This is not probabilistic — it's how the CSS box model works. So it is certain, without opening a browser, that if the Kanban board's stage columns are collectively wider than the visible content area, the overflow columns are unreachable.

**What genuinely needs live-render confirmation, and why I can't state it from code alone:**
- The exact viewport width at which the clipping becomes visible (depends on the runtime count of CRM pipeline stages × each column's actual rendered width vs. the user's actual screen width — a runtime fact, not something in the source).
- Whether any scrollbar renders "faintly" — moot in the strict CSS sense (`overflow-x: hidden` means no scrollbar renders, full stop), but worth confirming there isn't some browser-specific rendering quirk or a JS-driven scroll shim I didn't find (dnd-kit's `sensors`/`handleDragStart` props on `KanbanView` suggest drag-and-drop is present; I found no evidence of a custom auto-scroll-on-drag helper in `KanbanView.tsx`, but did not exhaustively search for one repo-wide).
- Whether this is visible on the developer's actual working monitor size vs. only on narrower laptop screens — can't be answered without opening the app.

---

## Summary counts

- 97 files use `overflow-x-auto` in `artifacts/erp-dashboard/src`.
- ~88 have at least one instance that is genuine in-page content, unprotected by any portal, and structurally clipped by `AppShellModern.tsx:180`'s `overflowX:"hidden"`.
- 7 components (CardCoursesDialog, CardDetailDialog, CardExamsDialog, CardKnowledgeDialog, CardMentorsDialog, CkpCardProductsDialog, AIProductionPlanningChart's GanttChart) are exclusively mounted inside a Radix `DialogContent` and confirmed exempt via the portal mechanism itself, not just naming.
- 2 components (DarslikTab.tsx, SuperAdminPanelSections.tsx) have **both** an affected in-page instance and an exempt portaled instance in the same file.
- 2 components (dizayn-new/DataTable.tsx, OrgCardsPanel.tsx) are orphaned — never mounted anywhere, not applicable to this bug.
- 1 component (PosMonitorPage.tsx) is affected on one of its two mount routes only (`/wms/pos-monitor`) and exempt on the other (`/pos-monitor*`, which bypasses the shell entirely).
- `overflow-y-hidden`: 2 hits, both intentional Kanban-board design, not bugs.
- `overflow-hidden` (208 hits): sampled the highest-risk structural intersections (max-height dialogs, sticky-header co-occurrence); found zero genuine vertical-clipping bugs in that sample — this was a targeted pass, not exhaustive.
- One technical correction surfaced along the way: hand-rolled `position: fixed` modals (not using Radix Dialog/Sheet) most likely also escape the shell's clip via native CSS fixed-positioning semantics, not because they're portaled but because nothing in the shell's ancestor chain creates a new containing block for them — this is the one conclusion here that most needs a live-browser check before being treated as settled.

---

# Part 2 — Root-Cause Analysis: 9 Design-Inconsistency Instances

*Read-only investigation. All findings below are descriptive (git history + code inspection). No files were modified. All commits found under a single git author identity, "Muslimbek Nosirov" — noted factually, not evaluatively.*

---

## 1. `europrint-mockup-theme.css` — the actual root of the "peach modal" pattern

**File:** `artifacts/erp-dashboard/src/erp-modern-ui/europrint-mockup-theme.css:26,47`

**Git evidence:**
- The token file's own header docblock (unchanged) reads: *"Direction A: Minimal SaaS, warm off-white bg... `--ep-bg: #FAFAF9` (warm off-white page bg)"* — this is the same value DIZAYN_QOIDALARI.md documents as canonical.
- But line 26/47 of the *same file* actually sets `--ep-bg: #F5E6E1` and `--background: 15 50% 92%` (`#F5E6E1`), both labeled in-line `/* SHIPNOW warm-blush */` — directly contradicting the file's own header comment.
- `git log --follow` on this file (7 commits total) shows the value's evolution:
  - `bacfb448` (2026-05-14) — file created as part of the big design-system-migration commit.
  - `6d77f359` (2026-05-28) `style(design): warm cream tokens #FAF7F2 bg...` — still cream-family.
  - `f4a80e6c` (2026-05-29 16:15) `feat(design): apply SHIPNOW warm-blush bg + #FF902F orange (verified live)` — commit body states explicitly: *"Token-only change... `--background 37 35% 97% -> 15 50% 92% (#F5E6E1 warm blush)`... Verified live via Claude-in-Chrome: main bg rgb(245,230,224)."* This is the value still live today.
  - 3 more same-day commits (`98c1a56`, `eba53a7`, `c14cbd17`) tuned adjacent sidebar/tint colors but never touched `--background` again.
- `DIZAYN_QOIDALARI.md` was authored **later**, on 2026-06-18 (`3b53e1ef`, its first and only commit touching the file), and documents `--ep-bg:#FAFAF9` as canonical — i.e. the canonical doc was written *after* the live CSS had already diverged to blush, and nobody reconciled the two.
- This value is imported globally: `index.css:7` → `@import "./erp-modern-ui/europrint-mockup-theme.css";`, and shadcn's `DialogContent` (`components/ui/dialog.tsx:49`) uses class `bg-background`, which resolves to `hsl(var(--background))` = the blush value. So **every unstyled Dialog in the app**, not just 2-3 files, renders on this peach/blush tone.

**Root-cause classification: (c) — drifted from canonical spec.** The token was deliberately changed (labeled "verified live") on 2026-05-29; the canonical doc (DIZAYN_QOIDALARI.md), written three weeks later, documents the pre-drift value and was never reconciled against the live CSS. Direction of drift is unusual (doc postdates the divergent CSS rather than predating it) but the effect is identical to the task's definition of (c): implementation and canonical spec disagree, and the file wasn't updated to match.

**Would `check-design-tokens.mjs` have caught it?** No, by design, twice over. The hook was created at `360c3425` (2026-05-29 14:50:34) — **1h25m before** the blush commit `f4a80e6c` (16:15:22), so it did exist at the time. But its `ALLOW` list explicitly exempts `/\/erp-modern-ui\//` and `/\.css$/` (`scripts/check-design-tokens.mjs:37-44`), with the comment *"Files that legitimately define/handle raw colors → never flagged."* Token-definition files are intentionally out of scope; the hook only watches *consumers* of tokens (`.tsx`/`.ts` files) for hardcoded literals, never the token source itself.

---

## 2. `components/cc/NewDocumentModal.tsx` — a Dialog that inherited the peach drift

**File:** `artifacts/erp-dashboard/src/components/cc/NewDocumentModal.tsx:161`

**Git evidence:** `git blame -L 161,161` attributes `<DialogContent className="max-w-2xl p-6">` to `bacfb4485` (2026-05-14) — the same commit that created the EP component library and the original (pre-blush, `#FAF7F2`-era) design tokens. The file's only later touch (`f4010f4a`, 2026-06-20, "feat(modules): 13 features real (wave 12)") did not touch this line. The Dialog was written correctly per shadcn convention (no manual background override, relying on the token) and has not been re-visited since.

**Root-cause classification: (c) — drifted from canonical spec.** Correct at the time it was authored; the token beneath it (finding #1) moved two weeks later, silently repainting it.

**Would the hook have caught it?** No — this file contains no hex literal to flag; the defect lives entirely in the CSS token, not in this component.

---

## 3. `components/chat/page/RoomSettingsModal.tsx` — second Dialog inheriting the same drift

**File:** `artifacts/erp-dashboard/src/components/chat/page/RoomSettingsModal.tsx:88`

**Git evidence:** `git blame -L 88,88` also attributes `<DialogContent className="sm:max-w-md p-6">` to `bacfb4485` (2026-05-14), identical situation to #2 — untouched since.

**Root-cause classification: (c)** — same mechanism as #2, independent confirmation that this is systemic (token-layer), not a per-file styling choice. Together, #1–#3 show that "the peach modal" is one CSS-variable bug wearing hundreds of faces, not several files that separately copy-pasted a peach color.

**Would the hook have caught it?** No, same reasoning as #2.

---

## 4. `pages/OrderCreationWizard.tsx` — white full-page wizard shell (SD/PP order creation)

**File:** `artifacts/erp-dashboard/src/pages/OrderCreationWizard.tsx:64` (`<Card className="bg-card border-none shadow-sm overflow-hidden">` wrapping the whole 5-step wizard)

**Git evidence:** This page existed since the very first commit (`bde66482`, 2026-05-02, "initial commit - EuroPrint ERP baseline"), using raw shadcn `Card`/`CardContent`/`CardHeader` — before the EP library existed. It was then touched by `bacfb448` (2026-05-14) — the exact commit that *created* `components/ep/EPCard.tsx` — but that touch only swapped `ErrorState` → `EPErrorState`/`EPLoader` (visible in the diff: `-import { ErrorState } from "@/components/ui/error-state";` → later `import { EPErrorState, EPLoader } from "@/components/ep";`). The `Card`/`CardContent`/`CardHeader` wizard shell itself was left untouched, in the same commit that introduced its canonical replacement.

**Root-cause classification: (b) — existed but wasn't applied.** Not a "no system yet" case: the very commit that had EPCard in hand chose to migrate only the error/loading sub-components of this file and left the dominant page-shell pattern (a shadcn `Card`, not `EPPageHeader`+`EPCard`) alone — a partial, selective migration within a single commit.

---

## 5. `pages/WarehouseKirimWizard.tsx` — second independently-built white full-page wizard (WMS)

**File:** `artifacts/erp-dashboard/src/pages/WarehouseKirimWizard.tsx:11` (`import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";`)

**Git evidence:** `git log --diff-filter=A` shows this file was **added** in `bacfb448` (2026-05-14) — literally the same commit, by the same author, that created `EPCard.tsx`. It has its own bespoke `WizardHeader`/`StepIndicator`/`NavigationBar` (in `WarehouseKirimWizardSections.tsx`), completely independent from — and structurally near-identical to — the `components/orders/WizardHeader.tsx` used by finding #4. The file was revisited later at `cca602b4` (2026-06-26, `chore(t14-polish): design-token amalda tugadi (qolgan hex qonuniy)...` — "design-token work is finished, remaining hex is legitimate"); that diff only added an `i18n` `t()` wrap around a hardcoded `alert()` string, and did not touch the `Card` import.

**Root-cause classification: (b) — existed but wasn't applied**, and more decisively than #4: EPCard was created in the *exact same commit* as this file, ruling out any "wasn't available yet" excuse. Worth flagging separately: the 2026-06-26 commit that self-declared "design-token PASS" is evidence that the project's own tracking metric considers this file clean — but that metric (see `check-design-tokens.mjs` below) only measures raw-hex-literal usage, not component-choice (`Card` vs `EPCard`), so "design-token PASS" masks this category of drift entirely. Two independently-built wizards (#4 SD, #5 WMS) converging on the same non-canonical shell pattern is a strong signal this is a systemic gap, not a one-off oversight.

**Would the hook have caught either #4 or #5?** No — structurally out of scope. `check-design-tokens.mjs` only regexes for `#hex`/`rgb()`/`hsl()` literals in inline styles and Tailwind arbitrary-value classes (`HEX_IN_STYLE`, `TW_ARB_HEX`, lines 50-53); it has no concept of "which component was imported," so a `Card`-vs-`EPCard` choice is invisible to it by design, regardless of whether the hook existed at the time.

---

## 6. `pages/RulonCards.tsx` — table with zero header/body background separation

**File:** `artifacts/erp-dashboard/src/pages/RulonCards.tsx:361-362` (`<thead>` with no className; `<tr className="border-b text-muted-foreground text-xs">` — no `bg-*` at all)

**Git evidence:** `git blame -L 358,363` → commit `27aa62a2a`, 2026-06-24, `feat(wms): rulon-cards list + create form (iter-39)`.

**Root-cause classification: (b) — existed but wasn't applied.** By 2026-06-24, `components/ui/table.tsx` (the shared shadcn `Table`/`TableHeader`/`TableRow` primitives, already imported in 245+ files repo-wide, confirmed by grep) had a built-in `TableHeader` default of `bg-muted/60` and `TableRow` default of `hover:bg-muted/40`. This page bypasses that shared primitive entirely and hand-rolls raw `<table>`/`<thead>`/`<tr>` HTML, and in doing so simply forgot to add a header background — something the shared component would have supplied automatically had it been used.

---

## 7. `pages/qc/QcDpmoCalculator.tsx` — same day, same author, correctly-separated table (contrast pair with #6)

**File:** `artifacts/erp-dashboard/src/pages/qc/QcDpmoCalculator.tsx:227` (`<thead className="bg-muted/50 border-b">`)

**Git evidence:** `git blame -L 225,230` → commit `a2bbcebef`, **also 2026-06-24**, `feat(qc): DPMO + Six Sigma kalkulyator sahifasi qo'shildi [iter-73]`.

**Root-cause classification: (b) — existed but wasn't applied**, same as #6, but the contrast is the interesting evidence: this file *also* bypasses the shared `Table` primitive in favor of a raw `<table>`, but this time the header background was manually re-added (`bg-muted/50`) by hand. Same author, same day, same technique (raw HTML table instead of the shared component), opposite outcome — because neither page used the canonical primitive, each one is a coin-flip on whether the developer happened to remember to hand-add separation styling that the shared component would have supplied for free. This is direct evidence that the inconsistency is not about "different sessions/agents with no shared system" (they're contemporaneous) but about the shared table primitive being available and simply not reached for.

---

## 8. `components/dizayn-new/DataTable.tsx` — a full-featured table component that already existed and was never adopted

**File:** `artifacts/erp-dashboard/src/components/dizayn-new/DataTable.tsx`

**Git evidence:** `git log --diff-filter=A --follow` → `bde66482` (2026-05-02), the **very first commit** ("initial commit - EuroPrint ERP baseline"). Reading the file confirms it is a genuinely complete, generic, reusable data table: search, client-side sort, pagination, row-action menu, status-badge config, `Array.isArray` guards (`DataTable.tsx`, `DataTable.atoms.tsx`, `DataTable.types.ts`, plus a preset `DataTable.employee.tsx` and test coverage in `__tests__/DataTable.test.tsx`). A grep for `DataTableRedesign` (its exported component name) across the whole `src/` tree returns matches **only inside its own folder and its own test file** — it is never imported by a single page or feature module. (By contrast, its sibling `dizayn-new/EmptyState.tsx` and `dizayn-new/AppSidebar.tsx` *are* re-exported through thin shim files — `components/EmptyState.tsx` and `components/AppSidebar.tsx` — and are in active use.)

**Root-cause classification: (b) — existed but wasn't applied**, and arguably the single most direct explanation in this whole set for *why* no `EPTable` exists in `components/ep/` and why 148+ pages independently hand-roll tables (raw `<table>`) or lean on the bare `components/ui/table.tsx` primitives (245+ files): a fully-built, generic, day-one table component sat unused the entire life of the project. It was never promoted into the `ep/` canonical set, never wired into any page, and evidently never discovered/considered by the many sessions that subsequently reinvented table rendering per-page (findings #6, #7, and the `PPEquipmentPage.tsx` raw-inline-style variant noted during this pass).

**Would the hook catch this?** N/A — there's no "violation commit" to check; this is a non-adoption/discoverability gap, not a rule violation.

---

## 9. `erp-modern-ui/AppShellModern.tsx` — the `overflowX:"hidden"` line, dug one level deeper

**File:** `artifacts/erp-dashboard/src/erp-modern-ui/AppShellModern.tsx` (content-wrapper div, ~line 180 in current HEAD)

**Git evidence — origin:** `git show bacfb448 -- .../AppShellModern.tsx` shows the *before* state was simply `<div className="p-4 lg:p-6 max-w-[1920px] mx-auto">{children}</div>` — no overflow control of any kind (the whole document scrolled). `bacfb448` (2026-05-14, the same omnibus "design system migration" commit as findings #4/#5) replaced this with the current flex-column, fixed-height shell: `main` gets `style={{ height: "calc(100dvh - 3.5rem)", ..., overflow: "hidden" }}`, and the inner content div gets `style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}`, with an explanatory inline comment (`/* flex-1 + min-h-0 gives children a real height to fill with h-full */`) confirming this was a deliberate, reasoned layout-engineering decision, not an accident — the goal being an internally-scrolling shell instead of document-level scroll.

**Git evidence — was it ever reconsidered later?** Six further commits touch `AppShellModern.tsx` between 2026-05-14 and 2026-05-28 (`8e59fd73`, `3f347f7c`, `d3e7ae1f`, `8d65821d`, `9e52f2dd`, `9c0f136f`). Diffing each of them for the word `overflow` shows only two unrelated hits: `3f347f7c` *removed* a horizontally-scrolling module-tabs strip (`overflow-x-auto`) from the header nav, and `9c0f136f` *added* `overflow-hidden` to a different flex container when restoring that nav. **The specific `p-4 lg:p-6` / `overflowX:"hidden"` content-wrapper line has never been touched by any commit since `bacfb448` on 2026-05-14** — confirmed directly from the diffs, not inferred from blame alone. This is genuine, still-live, never-revisited drift — not something "partially addressed and missed only for kanban-type pages": it was never addressed at all after its introduction.

**Root-cause classification: (d) — doesn't map cleanly onto (a)/(b)/(c), stating so rather than forcing a fit.** Categories (a)-(c) are about *reusing an existing separate component*; this defect is different in shape — `AppShellModern` **is** the one-and-only canonical shell (every page necessarily uses it), and the flaw is a global layout constraint, introduced as part of a deliberate architecture choice, that lacks any per-page escape hatch for content that legitimately needs horizontal scroll (Kanban boards, wide tables). It isn't "a canonical component wasn't used" (it's used everywhere, unavoidably) and it isn't "token drift" (there is no documented overflow policy in DIZAYN_QOIDALARI.md to drift from). It is closest in spirit to (b) in that the fix is straightforward (add an opt-out prop/class), but I'm flagging it as (d) rather than force-fitting, per the instruction to say so rather than guess.

**Would the hook have caught it?** No — `check-design-tokens.mjs` didn't exist yet at `bacfb448`'s commit time (2026-05-14; the hook was first added on 2026-05-29 per its own `git log --diff-filter=A`), and even if it had, `overflowX:"hidden"` is not a color literal, so it is outside the hook's regex scope regardless.

---

## Closing Tally

| Case | Count | Instances |
|---|---|---|
| **(a) No system existed yet** | **0** | — none of the 9 instances is a clean "no shared component was available at the time" case. Even the oldest file (finding #4, from the 2026-05-02 baseline) was later touched by the exact commit that introduced its canonical replacement, which makes it (b), not (a). |
| **(b) Existed but wasn't applied** | **6** | #4 OrderCreationWizard.tsx, #5 WarehouseKirimWizard.tsx, #6 RulonCards.tsx, #7 QcDpmoCalculator.tsx, #8 dizayn-new/DataTable.tsx (the "canonical component" itself, unused for 2+ months), and arguably the umbrella pattern all three modal/table pairs share |
| **(c) Drifted since (correct when built, spec/token changed later)** | **3** | #1 europrint-mockup-theme.css (root cause), #2 NewDocumentModal.tsx, #3 RoomSettingsModal.tsx |
| **(d) Unclear / doesn't map cleanly** | **1** | #9 AppShellModern.tsx overflowX — a structural gap in the single canonical shell itself, not a reuse failure |

**What this tally answers directly:** two-thirds of the investigated instances (6 of 9, case b) are "apply an existing, already-built good system more consistently" — small-to-medium effort, since `EPCard`, `components/ui/table.tsx`, and even a full `DataTable` component already exist in the repo and simply need to be reached for. The remaining third (case c, 3 of 9) is not a missing-system problem at all but a **single upstream CSS-variable bug** (`--background` in `europrint-mockup-theme.css`) that, once fixed at the token source, silently repairs every inheriting Dialog across the app — effectively a one-line fix with app-wide blast radius, not hundreds of file-by-file fixes. Only 1 of 9 (case d, `AppShellModern.tsx`) requires genuinely new design work (a per-page overflow override mechanism) rather than "apply the existing system." **Zero instances required building a missing component from scratch that didn't already exist somewhere in the repo** — even the table gap (finding #8) turns out to be a non-adoption problem, not a build-from-scratch problem, since a working generic `DataTable` has existed since day one.

A secondary, cross-cutting observation from the git evidence: `check-design-tokens.mjs` (the pre-commit hook) is architecturally incapable of catching 8 of these 9 instances even now — not because it's diff-aware and blind to old files (which is its documented, intentional design for the hex-literal cases), but because most of these defects are *categorically outside its detection scope*: it only regexes for hex/rgb/hsl literals and Tailwind arbitrary-hex classes in `.tsx`/`.ts` files. It cannot detect a wrong CSS-variable *value* inside an allowlisted `.css` file (#1-#3), a wrong *component choice* like `Card` vs `EPCard` (#4-#5, #8), a *missing* utility class such as an absent `bg-muted/50` (#6-#7), or a structural layout property like `overflowX` (#9). This is worth surfacing on its own: the "design-token PASS" status the project tracks in CLAUDE.md measures a narrower slice of design consistency than the instances that actually turned up in this audit.---

# Part 3 — Proposed Unified Design System

*Following this project's own frontend-design guidance: brainstorm first, then critique against
being a generic default (Part 4) before finalizing. Everything below is a proposal for a future,
separately-authorized session to apply — nothing here was implemented in this pass.*

## 3.1 Color

**Keep, unchanged:** `--ep-primary: #FF902F` (orange). This is not a generic SaaS accent choice —
`DIZAYN_QOIDALARI.md` itself carries the emphatic annotation *"⭐ `--ep-primary = #FF902F`
(ORANGE) — **BLUE EMAS**. Har qanday 'tone-flip' tekshiruvida shu rangni hisobga ol"* (any
tone-flip check must account for this) — language that only makes sense if the project
previously drifted toward blue and orange was deliberately reasserted as correct. Orange also
does real semantic work for a packaging/print factory that a generic blue wouldn't: it reads as
warm/industrial without being a hazard-red, and it's distinctive against the sea of blue-accented
ERPs (SAP, Odoo, most shadcn-based dashboards default to blue). Keep it as the sole CTA/active-state
color, unchanged.

**Fix, not replace:** the page/surface background. The evidence in Part 1 §4 and Part 2 #1 shows
`--ep-bg` currently resolves live to `#F5E6E1` (peach/blush) instead of the already-documented
`#FAFAF9`. This is exactly the "AI-generated-default" pattern this project's own guidance warns
against — and critically, it is **not even the more recent decision**: `DIZAYN_QOIDALARI.md`
(2026-06-18) postdates the blush experiment (2026-05-29) and already supersedes it on paper. The
proposal here is not a new color choice; it's finishing a correction that was already decided and
never applied to the CSS:

| Token | Current (live, buggy) | Proposed (already documented, unapplied) |
|---|---|---|
| `--ep-bg` (page background) | `#F5E6E1` | `#FAFAF9` |
| `--background` (shadcn/Tailwind `bg-background`) | `15 50% 92%` (#F5E6E1) | `220 20% 98%` (#FAFAF9-equivalent HSL — matches what `design-tokens.css` itself already declares before being overridden) |
| `--ep-border` | `#E7E2D8` | `#EBEAE6` |
| `--border` | `38 17% 88%` | matching HSL equivalent |

Why `#FAFAF9` and not pure `#FFFFFF` for the page background, stated explicitly rather than
defaulted-to: a factory ERP is looked at for entire 8-12 hour shifts by both office staff (desks,
controlled lighting) and floor/warehouse staff (tablets, variable lighting, POS Monitor). A
barely-warm off-white reduces glare/eye fatigue versus clinical pure white over long sessions,
without tipping into the "lifestyle SaaS" peach territory the guidance warns about. The difference
from the current peach is not subtle in practice (peach is visibly, unmistakably tinted; `#FAFAF9`
reads as "white" to the eye) — this is a real distinction, not a hair-splitting one.

**Retire, don't just leave alone:** the parallel "blush" sub-palette in `kit.css`
(`--bg-blush: #F5E6E1`, `--bg-blush-soft: #FBF1ED`, `--line-warm`, `--line-warm-dim`,
`#F0E6E1` in `badge.tsx`, `#FBF1ED` in `button.tsx`'s hover states). These are a second, undeclared
source of the same peach family baked directly into shared base UI primitives (`badge.tsx`,
`button.tsx` — used everywhere, not page-specific). Fixing `--ep-bg` alone will not fix these; they
need their own explicit removal/redirect to the corrected token set, or the peach will keep
resurfacing on hover/badge states even after the modal fix lands.

**Keep, unchanged:** the 4 semantic status tokens (`--ep-success`/`warn`/`danger`/`info` +
`-soft` variants) — no evidence of drift was found in these specifically, and the values
(`#2E8A5A`/`#B5891C`/`#C0432F`/`#3563AC`) are reasonable, accessible, non-generic choices already.

**Keep the concept, fix the application:** the 15 per-module `--mod-*` accent colors. This is
already a genuinely good, distinctive idea for a multi-department factory ERP (see §3.6 —
proposed as the signature element) — the problem found in Part 1 §4 is that it's barely used (16
live usages against a 15-color palette), not that the palette itself is wrong. No color changes
proposed here; the fix is application discipline (§3.6), not a redesign.

**On the ~1,911 off-token raw color expressions found in Part 1 §4:** most of these are developers
reaching for Tailwind's default palette (`#3b82f6`, `#ef4444`, `#22c55e`, etc.) by hand instead of
the semantic status tokens, for things like chart series colors and ad-hoc status maps. This is
real drift but it is not what the owner's screenshots flagged, and fixing it is a long-tail,
page-by-page cleanup (scoped honestly in Part 5) rather than a systemic single fix like the two
above — deprioritized relative to the modal/background/table/layout fixes, not ignored.

## 3.2 Typography

**Keep:** Inter (UI/body) + JetBrains Mono (numbers, tabular-aligned) — no evidence this needs to
change, and it's a sound, deliberate pairing for a data-heavy ERP (mono numerals genuinely help
scanning columns of quantities/currency on a factory floor tablet).

**Extend the documented scale to match reality, rather than pretend the extra steps don't exist.**
Part 1 §5 found `text-lg` (370 uses) and `text-3xl`–`text-6xl` (342 uses combined) in heavy real
use, entirely outside the current 5-step documented scale. Rather than force everything back down
to 5 steps (which would fight against a real, load-bearing use case — large KPI/hero numbers), the
proposal is to name what's already there:

| Tier | Tailwind | Use |
|---|---|---|
| Display (**new**, formalizing existing use) | `text-3xl`/`4xl` `font-semibold`, tabular-mono for numerals | Large single-metric KPI/hero numbers (dashboard headline widgets) — the one legitimate reason to exceed h1 |
| h1 | `text-2xl font-semibold` | Page title (unchanged) |
| h2 | `text-xl font-semibold` | Section heading (unchanged) |
| h3 | `text-base font-medium` | Card title (unchanged) |
| Large body (**new**, formalizing `text-lg`) | `text-lg font-normal` | Emphasis body text, dialog lead paragraphs — explicitly not a heading substitute |
| body | `text-sm` | Default (unchanged) |
| small/label | `text-xs` | Unchanged |
| caption | `text-xs font-medium uppercase tracking-wide` | Unchanged |

`text-5xl`/`6xl` (14 combined uses) and raw inline `fontSize` values outside this set (27 distinct
pixel values found) are **not** formalized — they're the genuine drift to clean up, concentrated
almost entirely in `pos-monitor/*` (Part 1 §5's top-offender list). POS Monitor is architecturally
a separate mini-app (outside `AppShellModern`, its own `--pos-*` token namespace) — recommend it
either adopts the main scale or is explicitly documented as its own governed sub-system, rather
than silently drifting further. Not resolving that architectural question is itself a Part 5
sizing input, not something this proposal decides unilaterally.

**Font-weight:** formalize `font-bold` (1,957 uses, nearly as common as `font-semibold`'s 2,372)
as a 4th named weight rather than leaving it undocumented — reserved for numeric/KPI emphasis
specifically (paired with the Display tier above), keeping `font-semibold` for headings and
`font-medium` for card titles/labels as already documented.

## 3.3 Modal/dialog pattern — exactly two, named precisely

**Pattern 1 — Simple modal (the default, ~90% of create/edit flows per Part 1 §2).** This is
already the dominant pattern (15/20 modules' primary create-flow) and mechanically almost correct
today — it just inherits the wrong background (§3.1). The fix is narrow and highest-leverage in
the whole proposal:

- Change `components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`'s default `className` from
  `bg-background` to `bg-card` (i.e. `--ep-surface: #FFFFFF`) — a **~3-line change across 3 shared
  files** that corrects the color on all ~430 `DialogContent`/`AlertDialogContent`/`SheetContent`
  instances at once, per Part 1 §1's finding that this is inheritance, not per-file styling.
  Combined with the `--ep-bg` fix in §3.1, this also means the ~15-20% of files that already
  explicitly wrote `bg-card` to escape the peach become redundant (harmless, but a future cleanup
  candidate) rather than necessary.
- Width: standardize on `max-w-lg` (shadcn default) for ≤6 fields, `max-w-2xl` for 7-15 fields
  laid out `grid-cols-2`, matching the two width tiers already dominant in Part 1 §2's sample
  rather than the 5+ ad-hoc widths currently in use (`max-w-md`/`max-w-[440px]`/`max-w-3xl`
  retired in favor of these two).
- Field layout: `grid grid-cols-1 sm:grid-cols-2 gap-4` for any form with 4+ fields (matching the
  already-common convention in 8 of the 15 sampled simple-modal instances); single-column stack
  only for ≤3 fields.

**Pattern 2 — Multi-step wizard, used only when a create-flow has genuinely sequential,
validated stages** (order creation with distinct customer/products/pricing/delivery/review
stages; multi-step goods-receiving). Currently built independently, twice, by two different
sessions (`components/orders/WizardHeader.tsx`/`WizardStepper.tsx` for SD/PP order creation, and
`WarehouseKirimWizardSections.tsx`'s own near-identical `StepIndicator` for WMS) — per Part 2 #4-5,
both are well-executed and visually similar (numbered circular step indicators, connecting
progress-fill bar) but are two separate implementations of the same idea. Proposal: promote the
existing `WizardHeader`/`WizardStepper` pair (or a merged component drawing the best of both) into
`components/ep/EPWizard.tsx`/`EPWizardStepper.tsx`, and have both current wizards, plus any future
one, consume it. **Explicit rule for when to reach for this pattern instead of Pattern 1:** the
flow requires ≥3 logically-distinct stages where later stages depend on validated earlier-stage
data (e.g. product selection depends on customer's price tier) — not merely "this form has a lot
of fields" (that's still Pattern 1 with `max-w-2xl` + 2-column grid).

**Everything else collapses into these two.** The hand-rolled `motion.div` overlay
(`crm/QuickCreateModal.tsx`) and the `fixed inset-0` + `<Card>` one-offs (`RollManagementPage.tsx`,
`AuditConsoleDialogs.tsx`, etc.) found in Part 1 §1 and Part 1b §5 are not proposed as a third
pattern — they should migrate to Pattern 1, both for visual consistency and because Part 1b §5
found they rely on CSS `position: fixed` viewport-escape semantics that are easy to get wrong
(the exact mechanism that made them "accidentally correct" on background color is not something
to depend on going forward).

**Slide-over panel — kept as the canonical EDIT/DETAIL pattern, not a create pattern.** Part 1 §2
found this is already used consistently for exactly that purpose in 3 modules (CRM `DetailSheet`,
Kanban `TaskDetailSheet`, WMS `ReceiptDetailSheet`) — formalize this as the rule rather than
invent something new: **create = Pattern 1 or 2 above; view/edit an existing record = slide-over
Sheet from the right, `sm:max-w-4xl`.**

## 3.4 Table pattern — one canonical `EPTable`, built from what already works

Directly targeting the "jadvallar ajralmagan fondan" complaint (Part 1 §3): specify exactly one
separation treatment, and stop the two-competing-conventions problem (bordered `Card` vs.
borderless `bg-card rounded-xl`) at the source.

- **Container:** `border border-[var(--ep-border)] rounded-lg overflow-hidden` — this is already
  the majority-good pattern (`EmployeeTable.tsx`, `MaterialInventoryTable.tsx`, and 27 of the 40
  sampled instances), not an invented one. The specific anti-pattern to eliminate is the
  borderless `bg-card rounded-xl` div (confirmed wrapping 13 tables, concentrated in Finance/SD)
  and the zero-wrapper cases (`ListView.tsx` on the CRM page, `WarehouseReportsAllSections.tsx`).
- **Header:** `bg-[var(--ep-bg-muted)]`, uppercase or medium-weight label text — already the
  dominant convention (`bg-muted/60`/`bg-muted/50` across the majority of the sample); formalize
  it as mandatory, since Part 2 #6-7's direct contrast (`RulonCards.tsx` vs. `QcDpmoCalculator.tsx`
  — same day, same author, one has a header background and one doesn't) shows this is currently a
  coin-flip whenever a raw `<table>` is hand-rolled instead of the shared component.
  - **Zebra striping: recommended for dense financial/inventory tables, optional elsewhere.**
    Base this on the one table treatment in the whole app the audit found genuinely well-executed
    end-to-end: POS Monitor's `.pos-table` (bordered card, bold uppercase header,
    `tr:nth-child(even)` striping, `12px 14px` cell padding) — reuse this as `EPTable`'s reference
    implementation and density spec rather than inventing a new one.
- **Build path — don't start from zero.** Part 2 #8 found `components/dizayn-new/DataTable.tsx`
  is a complete, tested, generic table component (search, client-side sort, pagination, row-action
  menu, status-badge config, `Array.isArray` guards) that has existed since the project's first
  commit and has **zero adoption** anywhere in the app. The concrete recommendation is to promote
  this component (after a design-token pass to bring its styling in line with the spec above,
  since it predates `DIZAYN_QOIDALARI.md` entirely) into `components/ep/EPTable.tsx`, rather than
  building a new table component from scratch — this single fact substantially changes the Part 5
  sizing estimate for this item from "build" to "promote and restyle."

## 3.5 Spacing/layout scale

**Formalize the already-documented 6-step scale as the only sanctioned set** (`p-1`/`4px`,
`p-2`/`8px`, `p-3`/`12px`, `p-4`/`16px`, `p-6`/`24px`, `p-8`/`32px`, and their `gap`/`space-y`/
`margin` equivalents), replacing the 22-23 distinct spacing values Part 1 §5 found in active use.
This is not a new proposal — it restates what `DIZAYN_QOIDALARI.md` §3 already says — the
proposal is *how* to actually get there, since restating the rule alone clearly hasn't worked (11%
compliance per Part 1 §5's manual sample):

- **Fix `components/DedicatedPageShell.tsx` itself.** Part 1 §5a and Part 2's investigation both
  land on the same finding: the component *documented as the mandated standard shell* re-applies
  `p-5 lg:p-6 gap-5 h-full` on top of `AppShellModern`'s own padding — the exact double-pad
  anti-pattern the design doc calls out as wrong, built into the component that's supposed to be
  the fix. Correcting this one file to a bare `space-y-6` root (per Qoida D-3/D-4) automatically
  fixes its 21 direct consumers with no further work.
- **Deprecate the second, parallel `ModulePage` shell** (`components/ui/module-page.tsx`, 45
  files, its own `space-y-4` root and its own separate per-module color-map mechanism that
  duplicates `--mod-*`) in favor of `EPPageHeader` — two non-interoperating page-shell systems
  should not coexist long-term.
- **The ~190 files that copy-pasted the same literal `h-full p-5 lg:p-6` string directly** (rather
  than importing `DedicatedPageShell`) do not get fixed by the component correction above — these
  need individual conversion, and are the single largest page-by-page bucket in Part 5's sizing.

**Fix the `overflowX: "hidden"` root cause directly, globally, once.** Per Part 1b, changing
`AppShellModern.tsx`'s content-wrapper from `overflowX: "hidden"` to `overflowX: "auto"` is safe
by construction: a container with `overflow-x: auto` renders identically to `overflow-x: hidden`
whenever its content does *not* overflow (no visible scrollbar appears either way) — the change
only has any visible effect on the ~88 components in Part 1b's confirmed-affected list, all of
which currently want the scroll and can't get it. Add a subtle scroll-shadow affordance (a CSS
gradient fade on the trailing edge when more content exists off-screen, a common, low-effort
pattern) so the newly-working scroll is discoverable rather than silent. This is proposed as a
single global fix, not a per-page opt-in — a future session should double check no page currently
depends on the clip as an intentional design choice (Part 1b found no evidence of this in its
sweep, but flags it as the one residual assumption worth a final live-browser confirmation before
landing).

## 3.6 Signature element

Rather than introduce a new decorative motif, the proposal is to **fully commit to a signature
that already exists in the codebase but is under-used: the 15-color per-module accent system
(`--mod-*`) as a factory wayfinding device.** Physical factories commonly color-code zones, pipes,
and safety signage by function — EuroPrint's ERP already has the digital equivalent half-built
(Finance=cyan, HR=violet, PP=amber, MES=red, WMS=emerald, QC=orange, CRM=blue, etc.) but Part 1 §4
found it live in only 16 places against a 15-module palette. The proposal: every module's
`EPPageHeader` icon, every KPI number in that module's dashboard, and a thin left-border accent
stripe on that module's cards should consistently draw from its `--mod-*` token — turning "which
module am I in" into an instant, peripheral-vision color cue rather than something read off a
breadcrumb. This is deliberately not an elaborate addition (matching the task's "doesn't need to
be elaborate, but should be a real choice" framing) — it's committing to and finishing something
this project already started, which is precisely what distinguishes it from a generic template
flourish.

---
---

# Part 4 — Self-Critique Against the "Generic Default" Warning

*Required step, performed explicitly rather than silently, per the task's own instruction.*
Checking each piece of Part 3 against: does this read as a generic default a similar ERP brief
would produce anywhere, or is it a choice made specifically for a packaging/printing factory used
by both office and floor staff?

**Color — passes, with one revision made.** The original draft of this section (before this
critique pass) considered simply "picking white, since peach is clearly the AI-default mistake."
That would itself have been a second generic default — swapping one templated choice (peach) for
another (clinical white) without engaging with why either is right for this specific product. The
revised proposal keeps the warm-off-white direction (`#FAFAF9`) that was *already* the documented,
considered choice before the blush drift, and states explicitly why it suits a factory context
(long-shift eye comfort for both desk and floor staff) rather than defaulting to it. The orange
accent is kept with its rationale stated (industrial warmth, distinct from ubiquitous SaaS blue,
already load-bearing brand recognition per the doc's own emphatic anti-blue note) rather than
kept merely because changing it felt risky.

**Typography — passes.** Formalizing an existing, real usage pattern (the Display tier, `text-lg`)
rather than importing a generic type-scale template is specifically grounded in this codebase's
actual KPI-dashboard-heavy content, not a textbook scale.

**Modal pattern — the part most at risk of being generic, addressed directly.** "One modal, `max-w-lg`/`max-w-2xl`, bordered, white surface" is, on its own, indistinguishable from what any
shadcn-based project would ship by default — this is the one place in Part 3 that could fairly be
called templated if it stood alone. What makes it specific to EuroPrint rather than generic: (a)
the fix is explicitly scoped to *correcting inheritance from a broken token*, not redesigning the
modal from scratch — the actual visual language (rounded corners, centered overlay, `bg-black/80`
backdrop) is left alone because nothing in the audit suggested it was wrong, only the color feeding
into it; (b) the second pattern (wizard) is explicitly NOT collapsed into "just use one modal for
everything" — a packaging/print factory's order-creation flow (customer → product spec →
gofra/pricing → delivery → review) is genuinely multi-stage in a way a generic CRUD app's "add
contact" form is not, and the proposal preserves that distinction rather than flattening it for
uniformity's own sake.

**Table pattern — passes, and this is the strongest evidence against genericness in the whole
proposal.** The proposed `EPTable` spec is not derived from a generic library or textbook pattern
— it's explicitly built by promoting two things that already exist *in this exact codebase*
(`dizayn-new/DataTable.tsx`, POS Monitor's `.pos-table`), chosen because the audit found them to be
the two best-executed table implementations already present, not because they're a common
pattern elsewhere. Revised from an earlier draft that considered specifying zebra-striping as
mandatory everywhere (a common "polished dashboard" default) to "recommended for dense
financial/inventory tables, optional elsewhere" — mandatory striping on every table, including
sparse 3-column config lists, would itself have been an unconsidered default.

**Spacing scale — passes.** This section doesn't propose new values at all; it identifies which
*existing, shared component* is the actual mechanical cause of drift (`DedicatedPageShell.tsx`)
and fixes that specific file, rather than issuing a generic "use consistent spacing" directive
that would leave the real propagation mechanism untouched — this is the opposite of a generic
default; it's diagnosis-specific.

**AppShellModern overflow fix — passes, not applicable to genericness (a bug fix, not a style
choice).**

**Signature element — the part revised most substantially during this critique.** The first
instinct here (before this critique step) was a corrugated-cardboard visual texture motif — a
literal, on-the-nose "packaging company" reference. On reflection, that is close to the same
category of mistake this task warns about: reaching for an easy, surface-level "industry theme"
decoration rather than a choice grounded in how the product is actually used. It was replaced with
committing to the module-color wayfinding system, which is (a) already half-built in this specific
codebase rather than imported from a template, (b) functionally motivated (faster navigation
across a 20-module ERP used by people in different departments) rather than decorative, and (c)
scales to every module automatically instead of being a one-off flourish on a handful of screens.

**Net verdict:** no part of Part 3 was left unexamined; the modal-width/pattern spec is
acknowledged as the section closest to generic-template territory and is defended on its own
specific grounds; the signature-element choice was substantively changed as a direct result of
this critique step, which is itself the intended outcome of doing this step for real rather than
as a formality.

---

# Part 5 — Effort Sizing (sizing only, not a build plan)

Grounded in Part 1's real counts. Categorized into **"fixes once, propagates everywhere"** (shared
component/token corrections) vs. **"needs page-by-page conversion"** (one-offs with no shared
component to fix upstream).

## Fixes once, propagates everywhere

| # | Fix | Files touched | Automatic blast radius |
|---|---|---|---|
| 1 | `--ep-bg`/`--background`/`--ep-border`/`--border` correction | 1 file (`europrint-mockup-theme.css`, ~4 lines) | Every page background app-wide; the modal-background fix (#2) depends on this landing first |
| 2 | Shared Dialog/AlertDialog/Sheet default background (`bg-background` → `bg-card`) | 3 files (`dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, ~3 lines total) | ~430 `DialogContent`/`AlertDialogContent`/`SheetContent` instances — the single largest fix-to-impact ratio in this entire proposal |
| 3 | Retire the `kit.css` blush sub-palette (`--bg-blush*`, `--line-warm*`) + its 2 consumers (`badge.tsx`, `button.tsx` hover states) | ~3 files | Every badge/button hover state app-wide |
| 4 | `AppShellModern.tsx` content-wrapper `overflowX: "hidden"` → `"auto"` + scroll-shadow affordance | 1 file, ~1 line + one small new CSS/utility for the fade | Up to ~88 confirmed-affected components app-wide (Part 1b) — highest leverage-per-line-changed fix in the whole document |
| 5 | `DedicatedPageShell.tsx` root-div padding correction | 1 file | 21 direct consumers automatically |
| 6 | `EPTable` — promote `dizayn-new/DataTable.tsx` into `components/ep/`, restyle to the spec in §3.4 | 1 new/promoted component (plus its 3 sibling files: `.atoms.tsx`, `.types.ts`, `.employee.tsx`) | Available to all future table work immediately; does not retroactively fix existing tables (see page-by-page list below) |
| 7 | `EPWizard`/`EPWizardStepper` — merge the two existing wizard-stepper implementations into one | 1-2 new/merged components | The 2 existing wizards (order creation, WMS kirim) each need one migration pass to consume it — small, bounded, listed under page-by-page since each wizard's own step-content still needs individual review |

## Needs page-by-page conversion

| # | Item | Real count (from Part 1) | Notes |
|---|---|---|---|
| 1 | Pages copy-pasting the `h-full p-5 lg:p-6` double-pad string directly (not via `DedicatedPageShell`) | ~190 files | The single largest page-by-page bucket by file count; fix #5 above does not reach these |
| 2 | Pages using the parallel `ModulePage` shell (`space-y-4`, separate color-map) | 45 files | Requires a decision (migrate to `EPPageHeader` vs. keep as a documented second system) before sizing further |
| 3 | Pages/routed files with **zero** `EPPageHeader` adoption | ~207 of 360 routed pages (100% − 42.5%, exhaustive count) | The largest single number in this whole sizing section; concentrated per the cross-referenced `DESIGN-FULL-ANALYSIS-2026-07-06.md` in QC/MES dashboards, `*Config` pages, and Admin/Kaizen/Registry utility pages |
| 4 | Tables using the "flat card" (`bg-card rounded-xl`, no border) anti-pattern | 13 confirmed instances | Highest-priority page-by-page item since it directly maps to the owner's own most-used pages (Finance GL/AR/AP/budget/cashflow, SD customers/contracts/quotes/orders/debitors/KPI) |
| 5 | Raw `<table>` one-offs not using any shared table primitive at all | ~65 files (grep-estimated) | Lower priority than #4 — some already have adequate ad-hoc separation (Part 1 §3's sample found roughly half of raw-table instances already wrap in a bordered `Card`); would benefit from `EPTable` but aren't actively broken |
| 6 | Modal files with a bespoke `fixed inset-0` overlay instead of Radix `Dialog` (`QuickCreateModal.tsx`, `RollManagementPage.tsx`, `AuditConsoleDialogs.tsx`, + ~10 more per Part 1b §5) | ~13 files | Migrate to Pattern 1 (§3.3); currently accidentally-correct on background color via `position: fixed` viewport-escape, not something to keep relying on |
| 7 | Raw hex/rgba color literals not routed through any token | 1,911 expressions across ~145+79 files | Longest tail in the whole audit; lowest urgency relative to the owner's stated complaints (mostly ad-hoc status-color maps and chart series colors, not modal/table surfaces) |
| 8 | `pos-monitor/*` typography/spacing (raw inline `fontSize`/`padding`, its own `--pos-*` token namespace) | ~15-20 files (the module's top offenders account for the bulk of the 990 inline-`fontSize` and 281 inline-`padding` totals) | Architectural question first (does POS Monitor adopt the main EP scale, or stay a deliberately separate governed sub-system?) — sizing depends on that answer, not decided here |

## What this sizing does *not* include

Per the task's own scope: no timeline, no sequencing/priority beyond what's implied by the
"fixes once" vs. "page-by-page" split above, and no assignment of who does the work. Those are a
separate, future, explicitly-authorized task once the owner has reviewed and responded to this
proposal.

---

## Back-matter

**Read-only confirmation, restated:** no file in this repository was created, edited, or deleted
in the course of producing this document, except the document itself. Every classification word
above ("code-buildable," "fixes once, propagates," "page-by-page") is descriptive of what a
future, separately-authorized session could do — none of it was executed in this pass.

**On an illustrative HTML/CSS preview:** this environment can render a self-contained preview
artifact of the proposed token/component system (colors, modal, table, spacing) without touching
the main app's source. Offering this as a follow-up if useful, rather than building it
unrequested into this already-large document.
