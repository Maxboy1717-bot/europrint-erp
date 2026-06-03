# UI-3 — KASSIR / POS-PUL FRONTEND TAHLILI

**Sana:** 2026-06-02
**Rol:** Tahlilchi (QAT'IY read-only — hech qanday kod o'zgartirilmadi)
**Doira:** `artifacts/erp-dashboard/src` (jonli frontend)
**Vizyon manbalari:** `docs/ombor-pos-master-plan.md`, `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`, `docs/POS_OMBOR_TAHLIL_2026-06-01.md`
**Backend konteksti:** Oldingi BE tahlil — moliya kodida "kassir/cashier" tushunchasi grep=0 (umuman yo'q). Bu hisobot FRONTEND'da xuddi shuni tekshiradi.

---

## 1. KASSIR UI MAVJUDMI? — XULOSA (verdikt + dalil)

### Verdikt: ⚠️ VIZYON BO'YICHA KASSIR UI **YO'Q**. Mavjud "kassir" sahifa = NOTO'G'RI KONSEPSIYA (chakana do'kon POS'i).

Vizyon (§7, §10, §14.3) "kassir"ni quyidagicha ta'riflaydi: **moliya nazoratidagi naqd-nazorat xodimi** — ta'minotchiga **avans** beradi, **podotchet** (employee_ledger) yuritadi, omborga kirim bo'lganda **kassadan chiqim** yozadi, **podotchet qarzlarini** (qarz) ko'rsatadi, **reconcile** qiladi. Bu retail (chakana mahsulot sotuvchi) kassa EMAS.

**Frontend'da topilgani:**

| Element | Fayl | Nima |
|---|---|---|
| `CashRegister.tsx` | `src/pages/CashRegister.tsx` | **Chakana do'kon POS'i** — mahsulot katalogi + savat + naqd/karta/o'tkazma to'lov + QQS + chek chop etish + tranzaksiya tarixi. `/api/pos/products`, `/api/pos/transactions`, `/api/pos/scan`, `/api/pos/receipt` endpointlariga uradi. Vizyon kassiri bilan **mos kelmaydi**. |
| `useCashRegister.ts` | `src/components/pos/hooks/useCashRegister.ts` | Savat/barcode/QQS/chek logikasi — mahsulot sotuvi. Qarz/podotchet/oylik/avans YO'Q. |
| `IncomeExpense.tsx` | `src/pages/IncomeExpense.tsx` | Umumiy moliya kirim/chiqim defteri (kategoriya daraxti + tranzaksiya). Treasury asbobi, **per-xodim kassir EMAS**. |

**Grep dalillari (`src` ichida, locale fayllaridan tashqari):**
- `kassir|cashier|kassa` → **20 fayl / 57 hit**, lekin: ~15 fayl = locale JSON (uz/ru/uz-cyr tarjima); qolgani = CSS (`.pos-cart-head .cashier`), `types.ts` (`cashierId` maydoni), sidebar yorlig'i va hisobot sarlavhalari ("Kassa logi"). **Hech bir fayl vizyon-kassir (avans/podotchet/qarz) sahifasini bermaydi.**
- Vizyon kassir ish-jarayoni so'zlari — `podotchet`, `advancePayment`, `reimburse`, `reconcile` — faqat **API-qatlam** (`lib/api/procurement.api.ts`, `lib/api/pos-operations.api.ts`) va `ExpenseManagement.tsx` da bor; **maxsus kassir sahifasi sarflamaydi.**

Demak: BE'dagi "kassir=0" holatiga o'xshab, FE'da ham **vizyon ma'nosidagi kassir UI mavjud emas**. Mavjud `CashRegister` — boshqa (chakana) maqsadli, vizyonga aloqasiz sahifa.

---

## 2. pos-monitor/ HAQIQIY MAQSADI

**Tasdiqlandi: `pos-monitor/` = ZAVOD OMBORI PLANSHET ILOVASI (kirim/chiqim/inventar), KASSIR EMAS.**

Dalil — `src/pos-monitor/PosMonitorApp.tsx` route'lari (28 ta lazy sahifa): `warehouses`, `materials`, `material-balance`, `movements` (+ `kirim`/`chiqim`), `grn` (goods receipt), `lots` (lot traceability), `reservations`, `inventory`, `quarantine`, `qc-review`, `ledger`, `my-inventory`, `requests`, `reports`, `admin`, `kpi`. **Bironta pul/naqd/qarz/oylik/to'lov route'i YO'Q.**

`src/pages/PosMonitorPage.tsx` modul izohi (1-7 qatorlar) bevosita aytadi:
> "POS Monitor — zavod ombori plansheti sahifasi. Ombor xodimi: kirim, chiqim, P2P qabul + barcode qidirish. Tabs = ombor turlari."

Auth: ERP SSO (alohida login yo'q), admin rollari `pos_manager/admin/super_admin/finance_head` (`PosMonitorApp.tsx:59`). Sidebar (`constants.ts:373-377`) "POS Monitor"ni yagona kanonik POS sifatida belgilaydi va izohda **"kassa → Finance"** deydi (Qoida 22). Ya'ni loyiha o'zi POS Monitor'ni kassirdan ataylab ajratgan.

---

## 3. VIZYON KASSIR XUSUSIYATLARI → UI MAVJUDLIGI

| # | Vizyon xususiyati (manba) | UI holati | Dalil |
|---|---|---|---|
| 1 | **Naqd kirim/chiqim** (§7.10 kassa = naqd nazorat) | ⚠️ Qisman / noto'g'ri joyda | `CashRegister.tsx` faqat retail sotuv naqdi; `IncomeExpense.tsx` umumiy moliya kirim/chiqim defteri — kassir-darajali emas |
| 2 | **Xodim qarzi / podotchet** (§10 employee_ledger, §14.3 "podotchet qarzlari") | ❌ YO'Q | Maxsus xodim-balans/qarz sahifasi yo'q; `procurement.api.ts:3,60` da "podotchet reconcile" faqat API izohi, UI yo'q |
| 3 | **Avans berish** (§7.4 kassir avans beradi) | ❌ Kassir UI yo'q | `procurement.api.ts` `paymentMode: "advance"\|"reimburse"` tipi bor, lekin avans **beruvchi kassir ekrani** yo'q. `ExpenseManagement.tsx` xarajat darajasida ishlatadi |
| 4 | **Oylik to'lash (salary payout)** (rol §2.1) | ❌ YO'Q | `PayrollAutomation.tsx` = ish haqi **hisoblash/avtomatika** (INPS/JSHD), kassadan **naqd berish** ekrani emas |
| 5 | **PIN autentifikatsiya** (kassir kiritish) | ❌ Kassir uchun YO'Q | Yagona real PIN modali = `components/cc/PinPromptModal.tsx` — Communication Center **hujjat tasdiqlash** PIN'i (approve/reject/cancel), kassir-pul emas |
| 6 | **Qoldiq / balans (cash balance)** | ⚠️ Faqat dashboard ko'rsatkichi | `DailyKPIDashboard.tsx:74` "Pul qoldig'i" kartochkasi (read-only KPI); kassa qoldiq boshqaruvi ekrani yo'q |
| 7 | **Chek / kvitansiya PDF** | ⚠️ Bor, lekin retail | `CashRegister.tsx:55-63` `handlePrintReceipt` — `window.open` + HTML chek chop etish (retail sotuv cheki, kassir-pul kvitansiyasi emas) |
| 8 | **Buyurtma to'lovlari** (§4.2 to'lov tekshiruvi) | ⚠️ Sotuv tomonida bor | `SDSalesPayments.tsx` — mijoz **sotuv buyurtmasi** to'lovlari (avans/qoldiq, CRUD). Kassir-naqd emas, lekin tegishli |

**Yakuniy hisob:** 8 ta vizyon xususiyatdan **0 ✅ to'liq**, **4 ⚠️ qisman/yondosh** (1,6,7,8), **4 ❌ yo'q** (2,3,4,5).

---

## 4. TEGISHLI / QISMAN EKRANLAR (kassirga yaqin, lekin u emas)

- **`src/pages/SDSalesPayments.tsx`** (route `/sd/...` payments) — sotuv buyurtmasi to'lovlari: yaratish, tasdiqlash, CSV eksport, detal dialog. Vizyon "buyurtma to'lovlari"ga eng yaqin, lekin **mijoz-tomon (AR)**, kassir-naqd emas.
- **`src/pages/AccountsReceivable.tsx` / `AccountsPayable.tsx`** (`/accounting/ar`, `/accounting/ap`) — debitor/kreditor; qarz so'zi shu yerda chiqadi, lekin korporativ AR/AP, xodim podotcheti emas.
- **`src/pages/ExpenseManagement.tsx`** — `procurement.api.ts` ni ishlatadi (avans/reimburse), "Kassa nazorat va xarajatlar" sarlavhasi (`:155`). Kassir mantig'iga eng yaqin **API iste'molchisi**, lekin to'liq kassir ish-o'rni emas.
- **`src/pages/PayrollAutomation.tsx`** (`/accounting/payroll-automation`) — ish haqi hisoblash; "oylik **to'lash**" (payout) emas.
- **`src/pages/DailyKPIDashboard.tsx`** — "Pul qoldig'i" + "Kassa operatsiyalari" tugmasi (`/accounting/cash-register` ga link) — faqat ko'rsatkich/yo'naltirgich.
- **Sidebar (`components/sidebar/constants.ts:370-378`)** — "AVANS VA KASSA" bo'limi: `Kassa` (→`CashRegister`), `Kirim/Chiqim` (→`IncomeExpense`), `Ish Haqi`. Ya'ni navigatsiya mavjud, lekin ortidagi sahifalar vizyon-kassirni bermaydi.

---

## 5. TAVSIYALAR (faqat tavsiya — bajarish egasi ruxsatisiz YO'Q, Qoida 23)

1. **Konsepsiyani aniqlashtirish:** mavjud `CashRegister.tsx` (retail POS) ni vizyon-kassir bilan adashtirmaslik. Vizyon kassiri = moliya-nazorat naqd/avans/podotchet roli, retail sotuv emas.
2. **Yangi kassir ish-o'rni kerak:** avans berish, podotchet (employee_ledger) balans + qarz ro'yxati, reconcile (avans→settled), kassadan oylik berish, kassa qoldiq. Backend API qisman tayyor (`procurement.api.ts`: advance/reimburse/reconcile) — UI'ni shu API ustiga qurish mumkin.
3. **PIN:** kassir tranzaksiya tasdig'i uchun PIN kerak bo'lsa, `components/cc/PinPromptModal.tsx` namuna sifatida qayta ishlatilishi mumkin (lekin u hozir CC hujjat-tasdig'iga bog'langan).
4. **Buyurtma to'lovlari:** `SDSalesPayments.tsx` (AR) + §4.2 EXTERNAL_OUT to'lov tekshiruvi orasidagi ulanishni aniqlashtirish.
5. **Retail POS taqdiri:** agar zavod modeli (make-to-order, retail do'kon yo'q) bo'lsa, `CashRegister.tsx` retail POS'i vizyonga keraksiz bo'lishi mumkin — egasi qaroriga havola.

---

## DALIL XULOSASI (grep hisobi)

- `kassir|cashier|kassa` (src, locale tashqari): 20 fayl / 57 hit → 0 tasi vizyon-kassir sahifasi.
- pos-monitor route'lari: 100% ombor/inventar/QC — 0 pul/qarz/oylik.
- `podotchet|advancePayment|reimburse|reconcile`: faqat API-qatlam + `ExpenseManagement` — maxsus kassir UI yo'q.
- Real PIN modali: 1 ta (`PinPromptModal.tsx`), CC hujjat-tasdig'i, kassir emas.
