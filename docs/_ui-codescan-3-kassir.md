# UI KOD-SKAN — MODUL 3: KASSIR / MOLIYA

> **Rol:** 🔵 Tahlilchi (QAT'IY read-only) — faqat kod qatlami, brauzer YO'Q.
> **Sana:** 2026-06-02
> **FE root:** `Uzbek-Language-Module/artifacts/erp-dashboard/src`
> **Vizyon manbasi:** `docs/ombor-pos-master-plan.md` (§0, §2.1, §7.4, §7.10, §14.2–14.4) + egasi vizyoni A+.18b (kassir-hub).
> **Eslatma:** Bu hisobot FAQAT koddan aniqlanadigan narsani yozadi (fayl:satr dalili bilan). Vizual/brauzer qatlamni asosiy sessiya alohida qo'shadi.

---

## 0. XULOSA (TL;DR)

| O'lcham | Baho | Izoh |
|---|---|---|
| Konsept (vizyonga moslik) | ❌ **YOMON** | "Kassa" = **chakana do'kon POS** (savat/barkod/QQS/qaytim). Vizyon A+.18b = **kassir-hub** (oylik/avans tarqatish + naqd nazorat + podotchet/qarz + PIN + qoldiq + kunlik PDF). Konsept tubdan boshqa. |
| Dizayn token (Qoida 21) | ✅ **YAXSHI** | Xom rang deyarli yo'q (1 ta data-driven `item.color`, 1 ta CSS-var fallback). Tailwind `[#hex]` = **0**. |
| Komponent qayta-ishlatish | ✅ **YAXSHI** | 34 moliya sahifadan 26 tasi `@/components/ep` + `ui/` shablonidan; `components/finance/income-expense/` va `reports/` toza bo'lingan. |
| i18n (3 til) | ⚠️ **QISMAN** | Kalitlar **hal bo'ladi** (raw ko'rinmaydi), uz/ru/uz-cyr = 574 kalit har biri (to'liq). Lekin **146 ta camelCase auto-gen "axlat" kalit nomi** (kod-smell) + CashRegier'da i18n-bypass. |
| Dublikat / eski sahifa | ⚠️ **TUZATISH** | **Payroll 2 marta** (PayrollAutomation + FinanceDashboard?tab=payroll, 2 xil API). Kassa/POS Monitor/pos-monitor = 3 ta naqd-yuzasi. |
| Kassir-hub xususiyatlari (PIN/qoldiq/smena/podotchet) | ❌ **YO'Q** | PIN=0, kassa-qoldiq/smena UI=0, avans/podotchet FE faqat HR employee-profile ichida (markazsiz). |

**Bir jumlada:** Moliya moduli **texnik jihatdan toza** (token, shablon, i18n hal bo'ladi, fayllar kichik), lekin **kassir konsepti butunlay noto'g'ri** — vizyon kassir-hub o'rniga chakana do'kon kassasi qurilgan; vizyonning yuragi (oylik/avans tarqatish + naqd nazorat hub + PIN + podotchet ko'rinishi) **kodda umuman yo'q**.

---

## 1. SAHIFA INVENTARI

### 1.1 Modulga tegishli sahifalar (route manbasi: `src/routes/FinanceRoutes.tsx`)

`FINANCE_ROUTES` (`routes/FinanceRoutes.tsx:34-65`) — 29 route, ~28 sahifa komponenti:

| Sidebar guruh (tz10 "Moliya", `components/sidebar/constants.ts:348-392`) | Route | Sahifa fayl |
|---|---|---|
| Bosh Buxgalter | `/finance-dashboard` | `FinanceDashboard.tsx` (335 q.) |
| CFO Dashboard | `/cfo/dashboard` | `CFODashboard.tsx` (244 q.) |
| AI Moliya | `/ai/finance` | `AIFinancePage.tsx` |
| GL Hujjatlar | `/accounting/gl-documents` | `GLDocuments.tsx` |
| Hisoblar Rejasi | `/accounting/chart-of-accounts` | `ChartOfAccounts.tsx` |
| Davr Yopish | `/accounting/period-closing` | `PeriodClosing.tsx` |
| Pul Oqimi | `/finance/cashflow` | `CashFlowManagement.tsx` |
| Byudjet | `/finance/budgets` | `BudgetManagement.tsx` |
| Foyda Tahlili | `/finance/profitability` | `ProductProfitability.tsx` |
| Hisobotlar | `/finance/reports` | `FinancialReports.tsx` |
| Debitorlar | `/accounting/ar` | `AccountsReceivable.tsx` (172 q.) |
| Kreditorlar | `/accounting/ap` | `AccountsPayable.tsx` |
| Moliya Tasdiqlash | `/finance/approval` | `FinanceApproval.tsx` |
| **Kassa** | `/accounting/cash-register` | **`CashRegister.tsx` (129 q.) ← NOTO'G'RI KONSEPT** |
| **Kirim/Chiqim** | `/accounting/income-expense` | `IncomeExpense.tsx` (250 q.) |
| POS Monitor | `pos-monitor` | `pos-monitor/PosMonitorApp.tsx` (alohida sub-app) |
| **Ish Haqi** | `/accounting/payroll-automation` | **`PayrollAutomation.tsx` (216 q.)** |
| Buyurtma Tannarxi | `/finance/order-costing` | `OrderCosting.tsx` |
| Ombor Hisobi | `/accounting/materials` | `MaterialsAccounting.tsx` |
| Inventarizatsiya | `/accounting/inventory-valuation` | `InventoryValuation.tsx` |
| Asosiy Vositalar | `/accounting/asset-management` | `AssetManagement.tsx` |
| Xarajat Markazlari / Transfer / Soliq / Audit / Risk AI (6 ta) | `/fi/*` | **`FinanceExtended.tsx` (170 q.) — 1 komponent, tab orqali 6 route** |
| Variance / Break-even / Pricing | `/finance/variance`, `/finance/break-even`, `/finance/pricing-tiers` | `FinanceVariance/Break-Even/PricingTiers.tsx` |
| CFO config | `/cfo/config` | `CfoConfigSettings.tsx` |
| Kunlik KPI | `/finance/daily-kpi` | `DailyKPIDashboard.tsx` |

**Sanoq:** ~65 `.tsx` fayl moliya/buxgalteriya/payroll oilasiga tegishli (asosiy sahifalar + `*Tabs/*Sections/*Cards/*Dialogs` bo'laklari + `components/finance/**` + `components/pos/**`), test/worktree fayllari chiqarib tashlangan.

### 1.2 Payroll oilasi (2 ta alohida UI)
- `pages/PayrollAutomation.tsx` + `pages/payroll/{ContractsTab,CalculationsTab,PayrollStatsCards,AIPayrollDialog,CalculatePayrollDialog}.tsx`
- `pages/FinanceDashboardPayrollTab.tsx` (FinanceDashboard ichidagi "payroll" tab)

✅ Sahifalar **kichik va bo'lingan** (eng kattasi FinanceDashboard 335 q. — 900 limitdan ancha past).

---

## 2. i18n RAW-KALIT / RASVO MATN

### 2.1 ⚠️ camelCase auto-generatsiya kalit nomlari (kod-smell, ammo ekranda RASVO EMAS)
Moliya 34 sahifada **146 ta noyob** camelCase raw kalit (167 ta chaqiruv) topildi (`grep -hoE 't("[a-z]...[A-Z]...")'`). MUHIM nuans: bu kalitlar `locales/uz/finance.json` da **MAVJUD va hal bo'ladi** — ekranda raw ko'rinmaydi. Lekin kalit **nomlari** o'zbekcha jumladan avto-translit qilingan "axlat":

| Kalit (kod) | uz qiymati (`locales/uz/finance.json`) | ru qiymati | Muammo |
|---|---|---|---|
| `t("pulOqimi1")` (`CFODashboardExtra.tsx:47`) | "Pul oqimi 1" | "Денежный поток" | trailing `1` = kalit to'qnashuvi suffiksi |
| `t("mpvMqvLrvLevOv")` (`CFODashboardExtra.tsx:75`) | "MPV · MQV · LRV · LEV · OV" | — | o'qib bo'lmaydigan kalit nomi |
| `t("cvpBepTahlili")` (`CFODashboardExtra.tsx:82`) | "CVP · BEP tahlili" | "Анализ CVP · BEP" | aralash-kod kalit |
| `t("varianceTahlili")` (`CFODashboardExtra.tsx:74`) | **"Variance tahlili"** | "Анализ отклонений" | uz qiymatida inglizcha "Variance" qoldig'i |
| `t("moliyaviyKorsatkichlarVaXavfTahlili")` (`CFODashboard.tsx:140,156,184`) | "Moliyaviy korsatkichlar va xavf tahlili" | … | 40+ belgili kalit nomi |
| `t("debitorlarAr")` / `t("kreditorlarAp")` (`CFODashboardExtra.tsx:226,232`) | "Debitorlar (AR)" | "Дебиторы (AR)" | OK qiymat, axlat nom |

> **Hukm 2.1:** ⚠️ TUZATISH KERAK (past ustuvorlik) — bu **vizual rasvo emas** (kalitlar hal bo'ladi), balki **maintainability/kod-smell**: kalit nomlari mazmunsiz, qo'lda boshqarib bo'lmaydi. Vizyon §1.4 "har matn `tLabel` bilan" — bajarilgan, lekin nomlash sifatsiz.

### 2.2 ❌ i18n-bypass — CashRegister hardcoded uz/ru map + buzilgan `{t()}` print blokida
`pages/CashRegister.tsx:30-35` — to'lov usullari uchun **i18n namespace o'rniga hardcoded ikki tilli obyekt**:
```ts
const paymentMethodLabels = {
  cash: { uz: "Naqd", ru: "Наличные", icon: Banknote },
  card: { uz: "Karta", ru: "Карта", icon: CreditCard },
  transfer: { uz: "O'tkazma", ru: "Перевод", icon: Building2 },
  mixed: { uz: "Aralash", ru: "Смешанная", icon: Shuffle },
};
```
- ❌ uz-cyr (kirill) **yo'q** — bu map faqat uz+ru (vizyon §1.4 = 3 til). 3-til buziladi.
- ❌ `pages/CashRegister.tsx:61` — chek PDF `printWindow.document.write(...)` HTML satri ichida `<title>{t("chek1")}</title>`, `<th>{t("Mahsulot")}</th>`, `<th>{t("count")}</th>` va h.k. — bu **JSX EMAS, oddiy string**, shuning uchun `{t("chek1")}` chop etilgan chekda **literal `{t("chek1")}` matni** sifatida chiqadi (haqiqiy bug). Yonida `Tel:`, `INN:`, `Chek:`, `Sana:`, `Jami:`, `Mijoz:` = hardcoded o'zbekcha (tarjima qilinmagan).

> **Hukm 2.2:** ❌ YOMON — CashRegister i18n buzilgan (lekin baribir butun sahifa noto'g'ri konsept, pastda §6).

### 2.3 Tri-lingual to'liqlik (yaxshi tomoni)
✅ `locales/{uz,ru,uz-cyr}/finance.json` = har biri **574 kalit**; tekshirilgan namunalar to'liq tarjimali (`cvpBepTahlili`: uz="CVP · BEP tahlili", ru="Анализ CVP · BEP", uz-cyr="CVP · BEP таҳлили"). RU = haqiqiy ruscha (translit qoldiq emas), uz-cyr = haqiqiy kirill.
⚠️ `malumotYoq` finance.json da **YO'Q** (faqat `common` da bor) — lekin moliya sahifalari uni `tCommon(...)` orqali chaqiradi (masalan `IncomeExpense.tsx:176` `tCommon("noData")`), shuning uchun finance-ns sahifalarda raw chiqmaydi. (Tekshirildi: birorta finance-ns sahifa bare `t("malumotYoq")` chaqirmaydi.)

---

## 3. DIZAYN TOKEN BUZILISHI (Qoida 21)

✅ **Deyarli toza.** Butun moliya/kassir sahifa to'plamida (`{CashRegister,Payroll...,CFO...}*.tsx`, 34 fayl):
- Inline `style={{ color/background }}` xom rang: **2 ta**, ikkalasi ham maqbul:
  - `CFODashboardCharts.tsx:78` — `style={{ backgroundColor: item.color }}` (chart palitradan **data-driven**, xom hex emas).
  - `CFODashboardCards.tsx:126` — `style={{ color: valueColor ?? "hsl(var(--foreground))" }}` (CSS-var fallback — token-ga mos).
- Tailwind arbitrary hex `text-[#...]` / `bg-[#...]`: **0 ta**.
- ✅ Semantik token ishlatiladi: `text-[var(--ep-green)]` (`IncomeExpense.tsx:159`), `text-[var(--ep-red)]` (`:191`), `bg-[var(--ep-purple)]` (`PayrollAutomation.tsx:119`), `text-[var(--ep-blue)]` (employee FinanceTab:135).

> **Hukm 3:** ✅ YAXSHI — vizyon §1.13 "raw hex/rgb TAQIQ" bajarilgan. Qoida 21 buzilmagan.

---

## 4. DUBLIKAT / ESKI SAHIFALAR

### 4.1 ❌ Payroll FE **2 marta** (2 xil backend API)
| Sahifa | Route | API |
|---|---|---|
| `PayrollAutomation.tsx` (sidebar "Ish Haqi") | `/accounting/payroll-automation` | `/api/finance-extended/payroll/run`, `/api/finance-extended/payroll-contracts`, `/api/finance-extended/payroll-calculations` (`PayrollAutomation.tsx:42,57,61`) |
| `FinanceDashboardPayrollTab.tsx` (FinanceDashboard "payroll" tab) | `/finance-dashboard?tab=payroll` | `/api/payroll/periods` + `/calculate` + `/close` (`FinanceDashboard.tsx:85,129,143`) |

Ikki UI bir biznes-domen (oylik), lekin **butunlay boshqa endpoint oilasi** (`finance-extended/payroll*` vs `payroll/periods`). Memory tasdig'i: `session_2026-05-29_payroll_be_verification.md` — "2 ta payroll yo'li dublikat". Foydalanuvchi qaysi biri "haqiqiy" ekanini bilmaydi.

> **Hukm 4.1:** ⚠️ TUZATISH KERAK — payroll UI/API yo'lini bittaga birlashtirish kerak.

### 4.2 ⚠️ Naqd-yuzasi 3 ta
- `/accounting/cash-register` (`CashRegister.tsx`) — retail POS.
- `pos-monitor` (`pos-monitor/PosMonitorApp.tsx`) — zavod ombori tableti (Qoida 22 kanonik; "kassa → Finance").
- (Vizyon istagan **kassir-hub** = uchinchisi, lekin u **yo'q**.)
CashRegister ≠ pos-monitor dublikat emas (har xil sub-app), lekin sidebar'da "Kassa" + "POS Monitor" yonma-yon = foydalanuvchiga chalkash. Qoida 22 kommentariga ko'ra "POS Kassa → Kassa" birlashtirilgan, ammo Kassa endi noto'g'ri konsept.

### 4.3 ✅ Dublikat EMAS (false-positive oldini olish)
- `FinanceExtended.tsx` 6 ta sidebar route'ga (`/fi/cost-centers..risk-ai`) xizmat qiladi — bu **dublikat emas**, balki `URL_TAB_MAP[location]` orqali tab almashtirish (`FinanceExtended.tsx:43-51`). Toza pattern.
- `@deprecated` / `TODO` / `FIXME` / `legacy` — asosiy moliya sahifalarida **0 ta**.
- Route dublikati yo'q (har route → 1 komponent).

---

## 5. KOMPONENT QAYTA-ISHLATISH

✅ **Yaxshi shablon intizomi:**
- 34 moliya sahifadan **26 tasi** `@/components/ep` (EPErrorState, EPStatusPill, EPEmptyState, EPPageHeader) yoki `components/ui/*` shablonidan foydalanadi.
- `components/finance/income-expense/` — 7 ta bo'lingan bola komponent (CategoryTree, SummaryCards, TransactionTable/Dialog/Filters, CategoryDialog) — `IncomeExpense.tsx` faqat orkestratsiya (250 q.).
- `components/finance/reports/` — 13 ta hisobot komponenti (BalanceSheet, IncomeStatement, RatioAnalysis, CashFlowARAP, MonthlyTrendChart...) — qayta-ishlatiladigan.
- `pages/payroll/` — PayrollAutomation 5 ta bolaga bo'lingan (Tab/Dialog/Cards).
- `CFODashboard` → `CFODashboardCards/Charts/Extra` bo'laklari.
- ✅ EP shablon: `EPErrorState` (CashRegister:70, IncomeExpense:62, PayrollAutomation:90), `EPStatusPill` (CashRegister:81).

⚠️ Kichik nuans: CashRegister `components/pos/*` (retail) shablonidan foydalanadi — texnik jihatdan qayta-ishlatish, lekin **noto'g'ri domen** (retail POS bloklari).

> **Hukm 5:** ✅ YAXSHI — har sahifa o'ziniki emas; umumiy EP + ui + domen-papka shablonlari ishlatiladi. Vizyon §1.13 (EP dizayn-tizim komponentlari) bajarilgan.

---

## 6. VIZYONGA MOSLIK (A+.18b kassir-hub vs kod)

**Vizyon A+.18b / §0 / §7.4 / §7.10 / §14.3 — kassir kim:** bitta kassir = (a) xodimlarga **oylik/avans tarqatadi**, (b) butun korxona **naqd nazorati** (kim qancha oldi, kim qarzdor, podotchet), (c) Kanban→kassir oqimi + reyting navbati, (d) **PIN** bilan kirish, (e) kassa **qoldig'i**, (f) **kunlik PDF** hisobot. (§7.10: "Kassa = naqd nazorati; har xarid ombordan prixod/kassadan rasxod; pul olgan xodim nomiga".)

| # | Vizyon talab (A+.18b) | Kod holati | Dalil |
|---|---|---|---|
| a | Oylik tarqatish ro'yxati (kassir ko'rinishi) | ❌ YO'Q — oylik faqat **hisoblash** UI (PayrollAutomation), "tarqatish/berish" kassir ko'rinishi yo'q | `PayrollAutomation.tsx` butunlay calc/contracts; "tarqatish" yo'q |
| b | Avans tarqatish (kassir) | ❌ Markazsiz — avans UI faqat **HR employee-profile** ichida (har xodim alohida), kassir-hub emas | `pages/employee-profile/FinanceTab.tsx:135` `t("avanslar")`, `CashAdvanceList/Dialog` (`FinanceTabRecordLists`, `FinanceTabDialogsOA`) |
| c | Naqd nazorat markazi (kim qancha/qarzdor/podotchet) | ❌ YO'Q — `cashierBalance/kassaQoldiq/openShift/closeShift` qidiruv = **0 natija** | grep `pages/ components/` → bo'sh |
| d | **PIN** bilan kirish | ❌ YO'Q — `pinCode/enterPin/kassirPin` qidiruv = **0 natija** | grep → bo'sh |
| e | Kassa **qoldig'i** | ❌ YO'Q — `CashRegister` "Bugun: sales" ko'rsatadi (`:82`), kassa qoldiq/balans yo'q | `CashRegister.tsx:80-84` faqat `dashboard.salesToday` |
| f | Kunlik **PDF** hisobot (kassir) | ❌ YO'Q — CashRegier'da faqat **chek** print (retail), kassir kunlik hisobot PDF emas | `CashRegister.tsx:55-63` `handlePrintReceipt` = retail chek |
| — | Podotchet/qarz ko'rinishi | ❌ FE markazsiz; `payroll_advances`/`employee_inventory_ledger` jadvallariga ulangan kassir-hub yo'q | grep `payroll-advances\|inventory-ledger` FE → **0** |
| ✗ | **CashRegier aslida nima** | ❌ Chakana do'kon POS: ProductCatalog+CartPanel+PaymentPanel, Naqd/Karta/O'tkazma/Aralash, QQS 12%, Olingan naqd, **Qaytim** (changeAmount), "Sotishni yakunlash" | `CashRegister.tsx:17-27,100-108,102` (`addToCart`, `handleBarcodeScan`), `:106` (`changeAmount`, `taxRate`) |

**Kod nima ko'rsatadi (Kassa sahifasi):** Shtrix-kod skanerlab tovar savatga qo'shish (`ProductCatalog`, `handleBarcodeScan`), to'lov paneli (Naqd/Karta/O'tkazma/Aralash + qaytim), QQS, chek chop etish, tranzaksiya tarixi, dashboard (bugungi sotuv). Bu **do'kon kassasi**.

**Vizyon nima istaydi:** Naqd-nazorat + oylik/avans tarqatish hub'i. **Hech bir** element (PIN, qoldiq, smena, podotchet ko'rinishi, oylik/avans tarqatish ro'yxati, kunlik PDF) kodda yo'q.

> **Hukm 6:** ❌ **YOMON / YO'Q.** Kassir vizyoni FE'da ~**10%** (faqat noto'g'ri-domen retail POS + markazsiz HR avans tab). Vizyonning eng muhim modulining yuragi kodda mavjud emas. (BE qatlami `docs/agent7-kassir-moliya-2026-06-02.md` ga ko'ra dvigatel qismlari bor lekin ulanmagan + 0 qator data — bu FE skan emas, ammo mos keladi.)

---

## 7. TOPILMALAR RO'YXATI (ustuvorlik bilan)

### ❌ YOMON / YO'Q (konseptual, FE)
1. **CashRegister = chakana POS, kassir-hub emas** — `pages/CashRegister.tsx` butunlay retail (savat/QQS/qaytim/chek). Vizyon A+.18b kassir-hub talablarining 0 tasi bor. *(§6)*
2. **PIN, kassa-qoldiq, smena (open/close) UI = 0** — butun FE'da topilmadi. *(§6 c,d,e)*
3. **Oylik/avans TARQATISH (kassir ko'rinishi) yo'q** — faqat hisoblash (PayrollAutomation) + markazsiz HR avans tab. *(§6 a,b)*
4. **Kunlik kassir PDF hisobot yo'q** — faqat retail chek (`CashRegister.tsx:55-63`). *(§6 f)*
5. **CashRegister i18n buzilgan** — `:61` print HTML string ichida `{t("chek1")}` literal chiqadi (bug); `:30-35` hardcoded uz/ru map (uz-cyr yo'q). *(§2.2)*

### ⚠️ TUZATISH KERAK (kod sifati)
6. **Payroll FE 2 marta** (PayrollAutomation `finance-extended/payroll*` vs FinanceDashboard tab `payroll/periods`) — birlashtirish. *(§4.1)*
7. **146 ta camelCase auto-gen "axlat" kalit nomi** (`pulOqimi1`, `mpvMqvLrvLevOv`, `cvpBepTahlili`, `moliyaviyKorsatkichlarVaXavfTahlili`) — ekranda raw EMAS (hal bo'ladi), lekin maintainability past. *(§2.1)*
8. **`varianceTahlili` uz qiymatida "Variance"** inglizcha qoldiq (`locales/uz/finance.json`). *(§2.1)*
9. **Naqd-yuzasi sidebar'da 3 ta** (Kassa + POS Monitor + yo'q-kassir-hub) — chalkash. *(§4.2)*

### ✅ YAXSHI
10. **Dizayn token toza** — xom hex 0, inline xom rang 2 (ikkalasi maqbul). Qoida 21 ✅. *(§3)*
11. **Komponent qayta-ishlatish** — 26/34 sahifa EP+ui shablonidan; income-expense/reports/payroll toza bo'lingan. *(§5)*
12. **Fayl hajmi** — eng katta 335 q. (FinanceDashboard); hammasi 900 limitdan past. *(§1)*
13. **Tri-lingual to'liq** — uz/ru/uz-cyr finance.json = 574 kalit, haqiqiy tarjima (ru ruscha, uz-cyr kirill). *(§2.3)*
14. **FinanceExtended 6-route-1-komponent** — tab-routing, dublikat emas. *(§4.3)*
15. **IncomeExpense ("Kirim/Chiqim")** — vizyon §0 "prixod/rasxod" ga eng yaqin toza implementatsiya (kategoriya daraxti + tranzaksiya + summary), lekin bu **umumiy buxgalteriya kirim/chiqimi**, kassir naqd-nazorat emas. *(§1, `IncomeExpense.tsx`)*

---

## 8. DALIL-INDEKS (fayl:satr)

- Retail POS konsept: `pages/CashRegister.tsx:17-27` (pos import), `:100-108` (savat+to'lov panel), `:102` (`handleBarcodeScan`), `:106` (`changeAmount`/`taxRate`/`canComplete`).
- Chek print bug: `pages/CashRegister.tsx:61` (`{t("chek1")}`, `{t("Mahsulot")}` HTML string ichida).
- Hardcoded uz/ru map (uz-cyr yo'q): `pages/CashRegister.tsx:30-35`.
- Payroll dublikat: `pages/PayrollAutomation.tsx:42,57,61` vs `pages/FinanceDashboard.tsx:85,129,143` (+`FinanceDashboardPayrollTab.tsx`).
- Avans markazsiz (HR ichida): `pages/employee-profile/FinanceTab.tsx:9,11,135-143` (`CashAdvanceList/Dialog`, `t("avanslar")`).
- Token (maqbul) inline rang: `pages/CFODashboardCharts.tsx:78`, `pages/CFODashboardCards.tsx:126`.
- camelCase axlat kalitlar: `pages/CFODashboardExtra.tsx:47,74,75,82,226,232`; `pages/CFODashboard.tsx:140,156,184`.
- Sidebar tz10 ("Moliya"): `components/sidebar/constants.ts:348-392` (Kassa `:371`, Kirim/Chiqim `:372`, Ish Haqi `:378`, POS Monitor `:377`).
- Route jadval: `routes/FinanceRoutes.tsx:34-65`.
- FinanceExtended tab-routing: `pages/FinanceExtended.tsx:43-51`.
- i18n manba: `locales/{uz,ru,uz-cyr}/finance.json` (574 kalit har biri).
- Vizyon: `docs/ombor-pos-master-plan.md:11-12` (§0 prixod/rasxod), `:38` (§2.1 kassir roli), `:136` (§7.4 avans), `:142` (§7.10 kassa=naqd nazorati), `:211` (§14.3 moliya dashboard).

---

## 9. ESLATMA (skan chegaralari)
- Bu **FAQAT kod-skan** (brauzer yo'q). "Ekranda ko'rinadi" deyilmadi; i18n kalit hal bo'lishi `node -e require(...finance.json)` bilan tekshirildi (statik, runtime emas).
- BE/DB holati (0 qator, gl_account_mappings, soliqsiz payroll) bu hisobot doirasidan tashqari — `docs/agent7-kassir-moliya-2026-06-02.md` da batafsil; FE topilmalari unga mos keladi.
- Hech bir fayl o'zgartirilmadi (read-only). Worktree nusxalari (`.claude/worktrees/*`) e'tiborga olinmadi — faqat jonli `artifacts/erp-dashboard/src`.

*Skan 2026-06-02 — 🔵 Tahlilchi (read-only). Faqat shu hisobot fayli yozildi.*
