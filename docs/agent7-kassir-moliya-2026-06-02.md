# AGENT7 — KASSIR / PUL / MOLIYA — CHUQUR TAHLIL (2026-06-02)

> READ-ONLY tahlil. Kod (fayl:satr) + jonli DB (`europrint`@127.0.0.1:5432, `_audit/q.cjs`) bilan dalillangan.
> Egasi vizyoni (#2): **1 kassir** = oylik/avans tarqatuvchi + butun korxona **naqd nazorati** +
> xodim **podotchet/qarz** + Kanban→kassir oqimi + reyting navbati + kunlik PDF hisobot.
> Avvalgi hisobot (`docs/asl-holat-...-2026-06-02.md`) kassirni **~10%** deb baholagan — bu tahlil
> uni **kod darajasida tasdiqlaydi va kengaytiradi**: backend qismlari kutilganidan ko'proq tayyor,
> lekin **noto'g'ri ulangan / UI-yetim / hammasi 0 qator**.

---

## 0. QISQA HUKM

| O'lcham | Baho |
|---|---|
| **Kassir vizyoni (egasi #2)** bajarilishi | **~12–15%** |
| **Umumiy moliya/buxgalteriya moduli** (texnik tayyorlik) | **~55–60%** (kod bor, ulanish/data yo'q) |
| **Asosiy konsept muammosi** | "Kassa" = **chakana do'kon POS** (barkod skaner, Naqd/Karta, QQS, qaytim). Egasi esa **naqd-nazorat + oylik/avans hub** istaydi. Ikkalasi har xil narsa. |

**Bir jumlada:** Moliya moduli texnik jihatdan ancha boy (GL, trial-balance, payroll-calc, avans-tekshiruv, auto-GL, FIFO, podotchet — hammasi **real kod**), lekin (1) "Kassa" sahifasi butunlay noto'g'ri konsept, (2) kassir-hub UI umuman yo'q, (3) avans/podotchet/GL hammasi **0 qator** va UI'ga ulanmagan, (4) auto-GL `gl_account_mappings` jadvalini o'qimaydi (hardcoded), (5) payroll **ataylab soliqsiz** ("gross-only, soliq 1C'da").

---

## 1. DB JADVALLAR — count (jonli `europrint`)

`_audit/q.cjs` bilan olingan **haqiqiy qatorlar soni** (24 ta asosiy jadval):

| Jadval | Qator | Jadval | Qator |
|---|---|---|---|
| cash_registers | **0** | payroll | **0** |
| cash_sessions | **0** | payroll_contracts | **0** |
| cash_transactions | **0** | payroll_calculations | **0** |
| cash_advances | **0** | payroll_periods | **1** |
| cash_flow_transactions | **0** | payroll_entries | **0** |
| advances | **0** | payroll_rows | **0** |
| advance_payments | **0** | payroll_advances | **0** |
| employee_inventory_ledger (podotchet) | **0** | salary_history | **0** |
| gl_account_mappings (auto-GL config) | **0** | salary_bands | **0** |
| gl_documents | **0** | gl_entries | **0** |
| gl_lines | **0** | finance_payments | **0** |
| fi_gl_documents | **0** | payments | **0** |
| pos_gl_postings | **0** | pos_stock_ledger | **0** |
| pos_gl_posting_log | **0** | stock_ledger | **0** |
| pos_movements | **2** | pos_products | **5** |
| pos_transactions | **0** | stock_gl_postings | **0** |

**Xulosa:** Moliyaga oid **hamma operatsion jadval bo'sh** (yagona istisno `payroll_periods=1`, `pos_movements=2`, `pos_products=5` — test qoldig'i). Ya'ni **hech qachon birorta real oylik hisoblanmagan, avans berilmagan, GL yozuvi yozilmagan, kassa smenasi ochilmagan**. Bu "qurilish bosqichi" holatiga mos (memory: `europrint` DB bo'sh).

Jadvallar soni juda ko'p (cash×5, payroll×11, gl×6, advance×4) — bu **DB-darajasidagi dublikat/bo'linish** alomati (boshqa agentlar master-data aud`ti bilan mos).

---

## 2. KASSIR KONSEPTI — "Kassa" sahifasi NOTO'G'RI ❌

### 2.1 Frontend `/accounting/cash-register` = chakana POS
**Fayl:** `artifacts/erp-dashboard/src/pages/CashRegister.tsx` (129 satr)
**Route:** `artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx:50` → `['/accounting/cash-register', CashRegister]`
**Sidebar:** `components/sidebar/constants.ts:371` → `{ title: "Kassa", url: "accounting/cash-register", icon: DollarSign }`

Sahifa importlari (satr 17–27) **to'liq chakana sotuv POS** ekanligini isbotlaydi:
- `ProductCatalog`, `CartPanel`, `PaymentDialog`, `TransactionHistory`, `PosReports`, `AddProductDialog`, `PaymentPanel`, `ProductList` — barchasi `@/components/pos/*` dan
- `useCashRegister` hook (POS savatchasi)
- Tab'lar (satr 93–96): **Kassa (barkod skaner) / Mahsulotlar / Tranzaksiyalar / Dashboard**
- To'lov turlari (satr 30–35): `Naqd / Karta / O'tkazma / Aralash`
- Chek chop etish (`handlePrintReceipt`, satr 55–63): QQS, chegirma, **Qaytim (changeAmount)**, INN — bu **do'kon kassa cheki**

### 2.2 Backend ham retail POS, "kassir" deb nomlangan
**Fayl:** `apps/api/src/modules/pos/presentation/cash-register.controller.ts`
- `@Controller('pos')` — **POS modulida**, finance'da emas (satr 28)
- `@ApiTags('POS — Kassa (Cashier)')`, `@Roles('cashier', 'pos_manager', ...)` (satr 23–25)
- Endpointlar: `GET pos/products`, `POST pos/products`, `GET pos/scan/:barcode`, `GET pos/transactions`, `POST pos/transactions` (satr 32–60)
**Servis:** `apps/api/src/modules/pos/application/services/cash-register.service.ts`
- `taxRate` default **12** (satr 36), `scanBarcode` (satr 66), `taxAmount = (taxableBase * taxRate)/(100+taxRate)` (satr 121), `pos_products` o'qiydi (satr 94)

**HUKM 2:** "Kassa" = **chakana do'kon kassasi** (barkod, savat, qaytim, chek). Egasi vizyonidagi
**"korxona naqd-nazorat markazi + oylik/avans hub"** EMAS. Konsept tubdan boshqa. ❌ NOTO'G'RI KONSEPT.

### 2.3 To'g'ri kassir jadvallari MAVJUD, lekin KOD YO'Q
`cash_registers / cash_sessions / cash_transactions / finance_payments` jadvallari DB'da bor,
lekin **birorta backend yozuvchi yo'q** (grep `insert(cash_transactions|cash_sessions|cash_registers|finance_payments)` → **0 natija**). Ya'ni "real kassir" sxemasi yaratilgan, **ammo ulanmagan/yozuvsiz**.

---

## 3. PAYROLL (Ish Haqi) — kod REAL, lekin SOLIQSIZ + DATA YO'Q ⚠️

### 3.1 Frontend `/accounting/payroll-automation`
**Fayl:** `artifacts/erp-dashboard/src/pages/PayrollAutomation.tsx` (216 satr) — **REAL CRUD sahifa**:
- `useQuery` → `/api/finance-extended/payroll-contracts`, `/api/finance-extended/payroll-calculations`, `/api/hr/employees`
- `useMutation` → `POST /api/finance-extended/payroll/run` (satr 42), AI-calc, yangi-calc, approve
- Tab'lar: Shartnomalar / Hisob-kitoblar; KPI kartalar; "Maosh hisoblash" dialogi
**Boshqa FE fayllar (real mutation):**
- `payroll/CalculatePayrollDialog.tsx:61` → `POST /api/finance-extended/payroll/calculate`
- `payroll/AIPayrollDialog.tsx:43` → `POST /api/finance-extended/payroll/ai-calculate`
- `payroll/CalculationsTab.tsx:69` → `PATCH /api/finance-extended/payroll-calculations/:id/approve`

### 3.2 Backend `FinanceExtendedPayrollService` — REAL Drizzle
**Fayl:** `apps/api/src/modules/finance/finance-extended/finance-extended-payroll.service.ts` (380 satr)
- `listContracts / listCalculations` → `payroll_contracts`, `payroll_calculations` o'qiydi (Result pattern) ✅
- `calculate()` (satr 177): faol shartnoma topadi → `compute()` → `payroll_calculations`'ga **INSERT .returning()** ✅
- `aiCalculate()` (satr 206): AI tavsiyalar + insert ✅
- `runPayroll(period)` (satr 331): **idempotent** batch (notes===period bo'lganlar skip), barcha faol shartnoma uchun hisoblaydi ✅
- `approveCalculation()` (satr 304): status→approved ✅
- `compute()` (satr 77): `fixed→baseSalary`, `hourly→hours*rate`, `piecework→units*rate`; gross = base+bonus+allowance

### 3.3 ⚠️ MUHIM KONSEPT MUAMMOSI — payroll ATAYLAB SOLIQSIZ
Satr 17–18, 87, 159–160 (sharhlar):
> *"ERP is gross-only: tax (INPS/JSHD) and the statutory min-wage guarantee are computed in 1C, NOT here. This service handles gross + NON-TAX deductions only."*

- `totalDeductions = advances + loans + otherDeductions` (satr 88) — **soliq yo'q**
- `tax_inps / tax_jshd / total_taxes / min_wage_top_up` ustunlari DB'da bor, lekin **0 default'da qoldiriladi** (yozilmaydi)

Bu **memory'dagi eski da'voga zid**: `session_2026-05-29_payroll_be_verification.md` —
*"compute() FE bilan bayt-ma-bayt: INPS8/JSHD12/1.12M"*. Hozirgi kod **soliqni olib tashlagan**
(keyingi refactor). Ya'ni real INPS 8% / JSHD 12% / min-ish-haqi kafolati **endi yo'q** — net = gross − (avans+qarz). Egasi "to'liq oylik hisoblash" istasa, soliq qismi **boshqa tizimga (1C) tashlangan**.

### 3.4 Ikkinchi payroll yo'li (eski/dublikat)
- `finance-payroll.controller.ts` + `payroll/payroll.service.ts` + `payroll-periods.controller.ts` — alohida payroll slice'i bor (period yopish). Bu `finance-extended` payroll bilan **bo'linish** (2 payroll yo'li).

**HUKM 3:** Payroll backend **texnik real va ishlaydi** (FE→BE→DB to'liq ulangan), lekin
(a) **0 shartnoma / 0 hisob-kitob** (DB bo'sh → UI "Ma'lumot topilmadi"), (b) **soliqsiz konsept**
(egasining "to'liq oylik" kutilmasiga qisman zid), (c) **2 ta payroll yo'li dublikat**.
Payroll = **QISMAN ishlaydi (mexanizm tayyor, data+soliq yetishmaydi)**.

---

## 4. AVANS (Podotchet/avans pul) — kod REAL, UI-YETIM ⚠️

### 4.1 Backend avans-tekshiruv = REAL biznes logika
**Controller:** `apps/api/src/modules/finance/presentation/finance-advance.controller.ts`
- `GET finance/advances` (list, satr 45), `POST finance/advances/request` (satr 59),
  `POST finance/advances/override` (satr 72), `GET finance/advances/pending` (satr 84)
- `@Roles(FINANCE_OFFICER, DIRECTOR, SUPER_ADMIN)`
**Handler:** `apps/api/src/modules/finance/application/commands/check-advance.handler.ts` — **haqiqiy qoida**:
- `advance_percent` sozlamasini o'qiydi → `threshold = %/100` (satr 38–39)
- `advanceLimit = baseSalary * threshold` (satr 44)
- amount ≤ limit → **avtomatik approved** + `recordAdvance(status:'approved')` (satr 46–60)
- override bor → `approved_override` (satr 62–73)
- limit oshsa → `pending_advance` (satr 75–88)
**Repo yozadi/o'qiydi:** `payroll_advances` jadvali (yagona, izchil):
- yozish: `drizzle-finance-ops.repo.ts:57` `INSERT INTO payroll_advances (...)`
- o'qish: `finance-actions.repository.ts:61,86` `payroll_advances` SELECT

### 4.2 ❌ Avans uchun FE sahifa YO'Q
`grep "finance/advances"` butun `artifacts/erp-dashboard/src` bo'yicha → **0 natija**.
Ya'ni avans-tekshiruv API tayyor, lekin **birorta UI sahifa uni chaqirmaydi** (UI-yetim/orphan).
(Eslatma: FE'dagi `advancePercentage` faqat `OrderApprovalWorkflow.tsx` da — bu **buyurtma 70% avansi**,
Phase-4 boshqa konsept, kassir-avans EMAS.)

### 4.3 Jadval bo'linishi
`advances` (0 qator, **ishlatilmaydi** — orphan) vs `payroll_advances` (0 qator, **haqiqiy ishlatiladigan**).
Yana `advance_payments`, `cash_advances` ham bor (0). 4 ta avans jadvali = dublikat/bo'linish.

**HUKM 4:** Avans/limit mexanizmi **real va to'g'ri** (baseSalary × % + override + pending),
lekin **UI yo'q** + DB **0 qator** → amalda **ishlamaydi**. Avans = **QISMAN (backend tayyor, UI yo'q)**.

---

## 5. PODOTCHET (employee_inventory_ledger) — kod REAL, MATERIAL podotchet (pul emas) ⚠️

### 5.1 Servis to'liq yozilgan
**Fayl:** `apps/api/src/modules/pos/application/services/employee-ledger.service.ts` (129 satr)
- `§38 ARCHITECTURE: Xodim moddiy javobgarlik daftarchasi` (sharh satr 11)
- `addEntry` (satr 44): DEBIT (xodimga material berildi) / CREDIT (qaytardi) → `employee_inventory_ledger`
- `getEmployeeBalance` (satr 66): DEBIT − CREDIT = joriy balans
- `getDepartmentBalance`, `getEmployeeStatement`, `openLiabilityCase` (LC-... raqami, satr 93)
- `checkDismissalBlock` (satr 122): **balans bo'lsa ishdan bo'shatish bloklanadi** ✅
**Consumer'lar (ulangan!):** `employee-write-off.service.ts:90`, `pos-movement.service.ts`,
`pos-movement-status.service.ts:178`, `pos-requisition-workflow.service.ts:180`,
`pos-employee-balance.service.ts:153` — hammasi `addEntry` chaqiradi.
**Controller:** `pos/presentation/employee.controller.ts:61,73,168` — balans/dismissal endpointlari.

### 5.2 ❗ Konsept nuanzi
Bu **MATERIAL podotchet** (xodimga *jihoz/material* berish, moddiy javobgarlik), egasining
"xodimga **pul** podotchet/qarz berish" (kassir-naqd) qismi **emas**. Pul-podotchet = avans
(4-bo'lim, alohida) yoki kassa-chiqim (mavjud emas). Ya'ni vizyondagi "podotchet" ikki xil
ma'noda — material-podotchet **bor**, pul-podotchet **yo'q/uzilgan**.

**HUKM 5:** Material-podotchet mexanizmi **to'liq va ulangan** (POS harakatlariga bog'langan),
lekin **0 qator** (`employee_inventory_ledger=0`) + bu **material**, kassir-**pul** emas.
Podotchet = **QISMAN (material bor & ulangan, pul yo'q, data yo'q)**.

---

## 6. AUTO-GL (gl_account_mappings ulanganmi?) — qisman ❌

### 6.1 Ikki xil GL-posting servis bor, ikkalasi ham HARDCODED hisoblar
**A) `GlPostingService`** (`finance/domain/services/gl-posting.service.ts`, 121 satr):
- `postSalesInvoice / postCustomerPayment / postGoodsReceipt / postVendorPayment / postMaterialConsumption / postPayroll`
- Hisoblar **`GL` konstantasidan** (`domain/constants/gl-accounts.constants.ts`) — **hardcoded**, mappings'dan emas
- Double-entry balans tekshiruvi bor (satr 90) ✅
- `postPayroll`: gross-only (Dr Salary Expense / Cr Salary Payable), soliq legi yo'q (satr 74)
- **Chaqiruvchi:** faqat `finance-gl.controller.ts` **MANUAL** endpointlar (`POST finance/gl/post-sales-invoice`, `post-payroll`). **Avtomatik trigger YO'Q** (payroll-calc tugaganda GL yozmaydi).

**B) `AutoGlPostingService`** (`pos/application/services/auto-gl-posting.service.ts`, 147 satr):
- `postForMovement(movementId)` — POS ombor harakati tugaganda GL yozadi → `pos_gl_postings`
- Harakat turlari: EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE, INVENTORY_ADJUST (satr 42–64)
- Hisoblar **`GL_ACCOUNTS` lokal const** (satr 19–32, masalan '1010','9110') — **hardcoded**, mappings'dan emas
- **Avtomatik ulangan!** `pos/application/event-handlers/pos.events.ts:131` → harakat event'ida chaqiriladi ✅
- Idempotent (countExistingPostings, satr 94) ✅

### 6.2 ❌ gl_account_mappings JONLI ulanmagan
`gl_account_mappings` jadvali (ustunlar: `transaction_type, debit_account, credit_account, ...`)
= **auto-GL konfiguratsiya jadvali** bo'lishi kerak edi. Lekin:
- **Hech bir posting servis uni o'qimaydi** (grep → faqat `integration-extended` controller `findGlAccountMapping()` **list** qiladi, `integration-extended-mro.repo.ts:222`).
- Ikkala posting servis ham **kodda hardcoded** hisoblar ishlatadi.
- Jadval **0 qator**.

**HUKM 6:** Auto-GL **qisman bor**: POS harakat→GL avtomatik (real, ulangan), moliya→GL manual.
Lekin **`gl_account_mappings` jadvali umuman ishlatilmaydi** (konfiguratsiya o'rniga hardcode) +
hammasi **0 qator** (`pos_gl_postings=0`, faqat 2 ta movement bor). Auto-GL = **QISMAN-STUB**.

---

## 7. MOLIYA DASHBOARD + GL — kod REAL, data BO'SH

### 7.1 Finance Dashboard (Bosh Buxgalter)
**Sidebar:** `constants.ts:357` `finance-dashboard`. **Backend:** `finance-main.controller.ts:50` `GET finance/dashboard`
→ `finance-accounting.service.ts:17` → `drizzle-finance-accounting.repo.ts:30 getDashboard()`:
**REAL agregatsiya** (satr 31–42): `gl_documents`, `gl_lines`, `accounting_periods`,
`sales_invoices` (AR), `purchase_invoices` (AP) COUNT/SUM. ✅
**Ammo** bu jadvallar bo'sh → dashboard **nol ko'rsatadi**.

### 7.2 GL Controller
**Fayl:** `finance-gl.controller.ts` (110 satr):
- `GET finance/gl` (list, CQRS query), `GET finance/gl/trial-balance`, `GET finance/gl/ledger/:accountCode` — hammasi `GlService`'ga delegate
- `GlService.getTrialBalance` (`gl/gl.service.ts:133`) → repo `getTrialBalance` (`drizzle-finance-gl.repo.ts:90`):
  **REAL** — `gl_entries` jadvalidan debit/credit SUM, `balanced` flag (satr 93–100). ✅
- **Lekin** `gl_entries=0` → trial-balance **0/0/balanced=true** (vakuum-balans, ma'nosiz)
- `ChartOfAccounts` seed real (`defaultChartOfAccounts`, 10 ta hisob, satr 155–168), CRUD bor

### 7.3 Boshqa moliya sahifalari (FE bor, BE controller bor)
~26 ta finance/accounting sidebar yozuvi (`constants.ts:354–391, 560`):
AR (`accounting/ar`), AP (`accounting/ap`), Cashflow, Byudjet, Foyda tahlili, Hisobotlar,
Kirim/Chiqim, Ombor hisobi, Inventarizatsiya, Asosiy vositalar, Xarajat markazlari,
Transfer pricing, Ichki soliqlar, Soliq kalendari, Audit log, Risk AI, Order-costing, CFO×2.
Backend: `finance` modulida **30+ controller, 25+ servis** (FI, AR, AP, GL, cashflow, budgets,
break-even, ratios, variance, standard-cost, order-costing, reports-hub, financial-reports...).
Bu **juda katta texnik baza** — lekin DB bo'sh bo'lgani uchun ko'pi nol/bo'sh ko'rsatadi.

**HUKM 7:** Moliya dashboard + GL **kod darajasida real** (haqiqiy SQL agregatsiya, trial-balance,
CoA), lekin **butun operatsion data 0 qator** → amalda nol ko'rsatkichlar. = **QISMAN (mexanizm real, data yo'q)**.

---

## 8. FIFO TANNARX — REAL, lekin faqat allocate/expiry

**Servis:** `pos/application/services/pos-fifo.service.ts` (149 satr):
- `getCandidates` (satr 46): `pos_batches`'dan eng eski partiyalar (FIFO tartibi)
- `allocate(warehouseId, materialId, requiredQty)` (satr 78): kerakli miqdorni **eng eski partiyalardan** ajratadi, har partiya `unitPrice` bilan — **haqiqiy FIFO** ✅
- `markExpiredBatches` (satr 108): muddati o'tgan partiyalarni belgilash
- `getLowStockMaterials` (satr 129)
**Cron:** `pos-fifo-recalculate.job.ts:17` `@Cron('0 2 * * *')` → faqat `markExpiredBatches` (FIFO qayta-hisoblash emas, nomi yanglish)
**Tannarx (cost) boshqa joylarda:** `finance/domain/services/standard-cost.service.ts` (standart tannarx),
`variance-analysis.service.ts` (og'ish), `order-costing.service.ts` (buyurtma tannarxi) — alohida modullar.

**HUKM 8:** FIFO **real implementatsiya** (partiya-bo'yicha eng-eski-birinchi ajratish, narx bilan),
POS harakatlariga ulangan. Lekin `pos_batches`/`stock_ledger` **bo'sh** → ishlatilmagan.
FIFO = **ISHLAYDI (kod), lekin data yo'q**.

---

## 9. 3 TOIFA — UMUMLASHTIRISH

### ✅ ISHLAYDI (kod real + ulangan; faqat data 0)
1. **Payroll calc mexanizmi** — FE→BE→DB to'liq (calculate/runPayroll/approve/AI), idempotent. *(lekin soliqsiz + 0 data)*
2. **Avans-limit qoidasi** — baseSalary×% + override + pending, `payroll_advances`'ga yozadi. *(lekin UI yo'q + 0 data)*
3. **Material-podotchet** — DEBIT/CREDIT ledger, balans, dismissal-block, POS'ga ulangan. *(lekin 0 data)*
4. **FIFO allocate** — partiya-bo'yicha eng-eski, narx bilan. *(lekin 0 data)*
5. **Auto-GL (POS harakat→GL)** — event'ga ulangan, idempotent. *(lekin 0 data, hardcoded hisob)*
6. **Trial-balance / GL ledger / CoA / Finance dashboard** — real SQL agregatsiya. *(lekin 0 data)*

### ⚠️ QISMAN-STUB (mexanizm bor, lekin ulanish/konsept nuqson)
7. **auto-GL `gl_account_mappings`** — jadval bor, **hech kim o'qimaydi** (hardcode ishlatiladi).
8. **Moliya→GL avtomatlashtirish** — payroll/AR/AP tugaganda GL **avtomatik yozmaydi** (faqat manual endpoint).
9. **Payroll soliq** — INPS/JSHD/min-ish-haqi **ataylab olib tashlangan** ("1C'da").
10. **Avans UI** — backend tayyor, **FE sahifa yo'q**.

### ❌ YO'Q / BUZUQ (vizyon talab qiladi, mavjud emas)
11. **Kassir-hub UI** — egasining "oylik/avans tarqatuvchi + naqd nazorat markazi" sahifasi **umuman yo'q**.
12. **"Kassa" konsepti** — chakana do'kon POS qilingan (barkod/savat/qaytim), naqd-nazorat emas. ❌ NOTO'G'RI.
13. **Real kassir-naqd jadvallari** (`cash_transactions/cash_sessions/cash_registers/finance_payments`) — **0 backend yozuvchi** (sxema bor, kod yo'q).
14. **Pul-podotchet** (xodimga naqd qarz, kassa-chiqim) — yo'q (faqat material-podotchet).
15. **Kanban→Kassir oqimi** — yo'q (avvalgi hisobot tasdiqlagan).
16. **Reyting navbati + kunlik PDF hisobot** — yo'q.
17. **DB dublikat/bo'linish** — cash×5, payroll×11, gl×6, advance×4 jadval (master-data audit bilan mos).

---

## 10. KONSEPT MUAMMOSI (egasiga, sodda til)

> **Asosiy muammo:** "Kassa" sahifasi **do'kon kassasi** qilib yasalgan — mahsulotni barkod bilan
> skanerlab, Naqd/Karta olib, chek chiqarib, qaytim qaytaradi. Sizning korxonangizda esa kassir —
> bu **bitta odam** bo'lib, u **xodimlarga oylik/avans tarqatadi** va **korxonaning hamma naqd
> pulini nazorat qiladi** (kim qancha oldi, kim qarzdor, podotchet). Bu ikkisi butunlay boshqa narsa.

**Texnik haqiqat (yaxshi xabar):** Sizga kerak bo'lgan **dvigatel qismlarining ko'pi allaqachon
yozilgan** — avans qoidasi (oylikning %i, direktor override), oylik hisoblash, podotchet daftarchasi
(ishdan bo'shashda blok), avto-buxgalteriya yozuvi, FIFO tannarx. Lekin ular:
1. **bir-biriga ulanmagan** (avansning UI'si yo'q, oylik→buxgalteriya avtomatik emas),
2. **noto'g'ri sahifa ostida** (Kassa = do'kon POS),
3. **hammasi bo'sh** (hech qachon ishlatilmagan — 0 qator).

**Tavsiya (qisqa):**
1. "Kassa" sahifasini **kassir-hub**ga aylantirish: smena ochish/yopish, naqd kirim/chiqim, oylik/avans tarqatish ro'yxati, podotchet/qarz ko'rinishi (mavjud `payroll_advances` + `employee_inventory_ledger` + `cash_*` jadvallariga ulash).
2. Avans backend'iga **FE sahifa** qo'shish (API tayyor: `finance/advances/*`).
3. Oylik tasdiqlanganda **avtomatik GL yozuv** (mavjud `postPayroll`'ni payroll-approve event'iga ulash).
4. `gl_account_mappings`'ni **haqiqatan o'qish** (hardcode o'rniga) yoki jadvalni o'chirish.
5. Soliq (INPS/JSHD/min-ish-haqi) konsepti bo'yicha egasi bilan kelishish (1C'da qoladimi yoki bu yerda?).
6. Chakana POS kerak bo'lsa — uni **alohida** "Do'kon/Retail" moduliga ko'chirish, kassirdan ajratish.

---

## 11. DALIL-INDEKS (fayl:satr)

| Da'vo | Dalil |
|---|---|
| Kassa = retail POS (FE) | `pages/CashRegister.tsx:17–35,93–96`; route `routes/FinanceRoutes.tsx:50` |
| Kassa = retail POS (BE) | `pos/presentation/cash-register.controller.ts:23–60`; `pos/.../cash-register.service.ts:36,66,121` |
| Real kassir jadval, kod yo'q | grep `insert(cash_transactions/...)`→0; DB count cash_*=0 |
| Payroll real Drizzle | `finance-extended-payroll.service.ts:112,177,331,304` |
| Payroll **soliqsiz** (konsept) | `finance-extended-payroll.service.ts:17–18,87,159–160` |
| Payroll FE→BE ulangan | `pages/PayrollAutomation.tsx:42,57,61`; `payroll/*Dialog.tsx` |
| Avans qoidasi real | `application/commands/check-advance.handler.ts:38–88` |
| Avans→payroll_advances | `drizzle-finance-ops.repo.ts:57`; `finance-actions.repository.ts:61` |
| Avans FE yo'q | grep `finance/advances` in FE → 0 |
| Material-podotchet real+ulangan | `pos/.../employee-ledger.service.ts:44,66,122`; consumers `pos-movement*.service.ts`, `employee-write-off.service.ts:90` |
| Auto-GL POS event'ga ulangan | `auto-gl-posting.service.ts:71`; trigger `pos.events.ts:131` |
| gl_account_mappings ishlatilmaydi | grep posting servis→0; faqat `integration-extended-mro.repo.ts:222` list |
| Trial-balance real | `gl/drizzle-finance-gl.repo.ts:90–100` |
| Finance dashboard real SQL | `drizzle-finance-accounting.repo.ts:30–43` |
| FIFO real allocate | `pos/.../pos-fifo.service.ts:46,78`; cron `pos-fifo-recalculate.job.ts:17` |
| Hamma moliya jadval 0 | `_audit/q.cjs` count (2-bo'lim) |

---
*Agent7-kassir-moliya · 2026-06-02 · READ-ONLY · kod+DB dalillangan*
