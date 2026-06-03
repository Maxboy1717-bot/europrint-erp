# MANTIQ-1 — Hisob-kitob Formulalari Audit (2026-06-02)

**Rol:** Tahlilchi (read-only) · **Tekshirilgan:** `apps/api/src` backend hisob-kitob servislari
**Maqsad:** Formula MAVJUDmi + NATIJA TO'G'RImi (faqat "ishlaydi" emas). Pul/buxgalteriya ustuvor.

> Eslatma: `.claude/worktrees/agent-*` ostidagi nusxalar e'tiborga olinmadi (kanonik = `apps/api/src`).

---

## Umumiy verdikt jadvali

| # | Hisob-kitob | Verdikt | Asosiy fayl |
|---|-------------|---------|-------------|
| 1 | COST (tannarx) | ⚠️ Shubhali — FIFO/average YO'Q; faqat M+L+OH yig'indi | `pp/.../costing.service.ts`, `finance/order-costing/drizzle-order-costing.repo.ts` |
| 2 | m² (rulon: kg+zichlik→m²) | ❌ YO'Q — rulon kg→m² konversiyasi umuman yo'q | (faqat ink sheet m², `qc/.../ink-consumption.service.ts`) |
| 3 | Qatlam/kesim (3/5 layer, chet trim) | ❌ YO'Q — model umuman yo'q | — |
| 4 | Oylik (sdelnyi + stavka) | ⚠️ To'g'ri lekin gross-only (INPS/JSHD YO'Q) | `finance/finance-extended/finance-extended-payroll.service.ts` |
| 5 | Brak/kamomad normasi | ⚠️ Qisman — spoilage rate to'g'ri; kamomad (inventarizatsiya) yo'q | `qc/.../spoilage.service.ts` |
| 6 | GL provodka (debit=credit) | ⚠️ Balans tekshiruvi bor lekin "jurnal" emas (har leg alohida qator) + payroll balans formulasi noto'g'ri risk | `finance/.../gl-posting.service.ts`, `hr/payroll/payroll-closure.service.ts` |
| 7 | Amortizatsiya | ✅ To'g'ri (SL/DB/SYD/UOP) — lekin sof kalkulyator, hech qayerga yozmaydi | `finance/.../depreciation.service.ts` |
| 8 | Ombor balansi (kirim−chiqim) | ⚠️ Formula to'g'ri lekin TRANZAKSIYA-XAVFSIZ EMAS + fail-open guard | `pos/.../pos-wms-sync.helpers.ts`, `pos-balance-guard.service.ts` |

---

## 1. COST (tannarx) — ⚠️ SHUBHALI

**Formula joyi:**
- `pp/domain/services/costing.service.ts:118-135` — `calculateStandardCost`: `material + labor + overhead`.
- `finance/.../standard-cost.service.ts:105-108` — `materialCost = Σ(qty×unitCost)`, `labor = stdHours×laborRate`, `overhead = stdHours×overheadRate`.
- `finance/order-costing/drizzle-order-costing.repo.ts:66-79` — `calculate()`: `totalCost = materialCost + laborCost + overheadCost`; `margin% = (sell−cost)/sell×100`.

**Baho:**
- Standart tannarx yig'indisi (M+L+OH) **to'g'ri** va matematik jihatdan benuqson.
- ❌ **FIFO/average/weighted-cost YO'Q.** Material xarajati `unitCost` yoki BOM `stdPrice` orqali keladi — real partiya (batch) narxidan FIFO/o'rtacha bo'yicha **kelmaydi**. Ya'ni real iste'molning haqiqiy tannarxi (COGS) partiya narxlaridan emas, qo'lda kiritilgan/standart narxdan olinadi.
- `PosFifoService.allocate` (`pos-fifo.service.ts:78`) FIFO/FEFO **tanlash** mantig'i bor, lekin u **faqat low-stock/recalculate joblariga** ulangan (`pos-fifo-recalculate.job.ts` faqat `markExpiredBatches` chaqiradi). Real chiqimda (`pos-movement.service`) `allocate` **chaqirilmaydi** va `pos_batches.current_qty` **hech qachon kamaymaydi**. Demak FIFO qatlamli COGS amalda **qo'llanilmaydi**.

**Xulosa:** Yig'indi formulasi to'g'ri, lekin "qaysi narx" masalasida real FIFO/average yo'q — tannarx standart/qo'lda kiritilgan kirituvga bog'liq.

---

## 2. m² (rulon: kg + zichlik → m²) — ❌ YO'Q

- Rulon materialni **kg + zichlik (gsm/density) → m²** ga aylantiruvchi formula backendda **topilmadi**.
- `area_m2` ishlatilgan barcha joylar — **ombor ijarasi** (`warehouse_rental_records`, `wms-crud.dto.ts`, rental cron), material konversiyasi emas.
- Yagona m² hisobi `qc/.../ink-consumption.service.ts:121` `sheetAreaFromDimsMm` = `(w/1000)×(h/1000)` — bu **list (sheet)** o'lchami, rulon kg→m² emas.
- `wms/README.md:103-104`: "Unit conversions (kg ↔ litre ↔ piece) live on `material_cards`. Never hardcode density." — ya'ni konversiya **ma'lumotga** (material_cards ustunlari) tayanishi kerak, lekin uni o'qib m² hisoblovchi **servis kodi yo'q**.

**Xulosa:** Rulon kg→m² formulasi mavjud emas. (Egasi aniq formulani keyin beradi.)

---

## 3. Qatlam/kesim (3/5 layer, chet trim) — ❌ YO'Q

- 3/5 qatlam, rulon-chet trim (kesish chiqindisi) bo'yicha hech qanday model/servis **topilmadi** (`layer`, `qatlam`, `trim`, `cut`, `kesim` qidiruvi bo'yicha 0 ta tegishli formula).
- Eng yaqin narsa — `qc/.../spoilage.service.ts` (brak %) va ink TAC, lekin bular qatlam/kesim geometriyasi emas.

**Xulosa:** Mavjud emas — egasi formulani bergach yangidan qurish kerak.

---

## 4. Oylik — sdelnyi (piece-rate) + stavka — ⚠️ TO'G'RI, lekin GROSS-ONLY

**Formula joyi:** `finance/finance-extended/finance-extended-payroll.service.ts:77-95` (`compute`):
```
fixed:     basePay     = baseSalary
hourly:    hourlyPay   = workHours × hourlyRate
piecework: pieceworkPay= productionUnits × pieceworkRate
grossPay        = base + hourly + piece + bonuses + allowances
totalDeductions = advances + loans + otherDeductions   (NON-TAX)
netPay          = grossPay − totalDeductions
```

**Baho:**
- Piece-rate (`productionUnits × pieceworkRate`) va stavka (hourly/fixed) **to'g'ri**. FE `calculatePreview` bilan bayt-ma-bayt deb hujjatlangan.
- ⚠️ **MEMORY ESKIRGAN:** xotiradagi "INPS8/JSHD12/1.12M byte-for-byte" endi **NOTO'G'RI**. Kod izohi (`:17-18`, `:87`) va `business.constants.ts:123-124` aniq aytadi: **ERP gross-only**, INPS/JSHD/income-tax konstantalari **o'chirilgan**, soliq va min-ish-haqi kafolati **1C da** hisoblanadi. Demak `netPay` faqat avans/qarz/boshqa cheklovni ayiradi — daromad solig'i emas.
- Bu **dizayn qarori** (xato emas), lekin natija: backend `netPay` ≠ xodim qo'liga oladigan sof maosh (soliqsiz). Foydalanuvchi buni bilishi shart.

**Xulosa:** Hisob matematik to'g'ri; ammo "sof maosh" emas, "gross − non-tax" — chalkashlik xavfi.

---

## 5. Brak / kamomad normasi — ⚠️ QISMAN

**Formula joyi:** `qc/domain/services/spoilage.service.ts:62-95`:
```
actualRate = defectiveSheets / totalSheets
standardRate = {4color: 0.03, 8color: 0.05}
variance = actual − standard
isAlarm  = actual > 2 × standard        (SPOILAGE_ALARM_MULTIPLIER)
costOfSpoilage = defectiveSheets × (paperCost + inkCost + laborCost)
```

**Baho:**
- Brak darajasi (spoilage rate) va alarm mantig'i **to'g'ri**, sanoat standartlariga (4-rang 3%, 8-rang 5%) mos.
- `costOfSpoilage` unitCost taqsimoti `getJobSpoilageData`da: paper 40% / ink 35% / labor 25% (`COST_SPLIT_*`) — bu **heuristik split**, real komponent narxlari emas (taxminiy).
- ⚠️ **Kamomad (inventarizatsiya yetishmovchiligi / shrinkage)** alohida norma sifatida **topilmadi**. Brak (ishlab chiqarish chiqindisi) bor, lekin ombor inventarizatsiyasidagi kamomad normasi modellanmagan. `DAMAGE` harakat turi bor (`pos-movement`), lekin "norma %" yo'q.

**Xulosa:** Brak normasi to'g'ri; kamomad (shrinkage) normasi yo'q.

---

## 6. GL provodkalar (debit=credit) — ⚠️ BALANS BOR, AMMO RISKLAR

**Formula joyi:**
- `finance/domain/services/gl-posting.service.ts:85-92` — `createJournalEntry`: `|Σdebit − Σcredit| > 0.01` bo'lsa `Err`. Ikki tomonlama yozuv shablonlari (sotuv/to'lov/GR/iste'mol/payroll) **to'g'ri** (Dr/Cr juftliklari klassik).
- `hr/payroll/payroll-closure.service.ts:117-141` — `buildJournal`: Dr Salary + Dr Bonus = Cr Deductions + Cr Net.

**Baho — 2 ta muammo:**
1. ⚠️ **`createJournalEntry` "jurnal" sifatida saqlamaydi.** Har bir `JournalLine` `glPostingRepo.insertEntry` orqali **alohida yozuv** sifatida kiritiladi, qarama-qarshi tomon `'OFFSET'` deb yoziladi (`:106-107`). Ya'ni bitta balanslangan jurnal entry o'rniga N ta mustaqil qator — `entryNumber` da `Date.now()+random` ishlatilgani uchun bir jurnalning leglari **boshqa-boshqa raqam** oladi. Balans **insertdan oldin** tekshiriladi (yaxshi), lekin DB darajasida leglar bir entry sifatida bog'lanmagan → audit/storno qiyin.
2. ⚠️ **Payroll balans formulasi shubhali.** `buildJournal` balans sharti: `totalBase + totalBonus == totalDeductions + totalNet` (tolerance 0.5). Bu faqat agar `netPay = base + bonus − deductions` bo'lsagina to'g'ri. Lekin `compute` (#4) da `grossPay = base + bonus + **allowances + hourly + piece**`, `net = gross − deductions`. Agar payroll qatorida `allowances`/`hourlyPay`/`pieceworkPay` bo'lsa, `totalBase`(faqat baseSalary) + `totalBonus` ≠ `totalNet + totalDeductions` → **jurnal balansdan chiqib `VALIDATION` Err qaytaradi** yoki noto'g'ri summalar. HR closure `normalizeRow` faqat `baseSalary/bonus/deductions/netPay` o'qiydi — allowance/piece yo'qoladi. Bu **real piecework/allowance bo'lgan oyda davr yopilishini buzishi** mumkin.
3. `gl-posting.service.ts:99` — `if (amount <= 0) continue` — nol summali leg tashlanadi (odatda to'g'ri), lekin `createJournalEntry` `firstId`ni qaytaradi, transaction (atomic) **yo'q** — bir leg insert bo'lib, keyingisi fail bo'lsa **yarim provodka** qoladi.

**Xulosa:** Debit=credit tekshiruvi MAVJUD va to'g'ri, lekin (a) leglar atomik bitta jurnal emas, (b) payroll closure balans formulasi piece/allowance bo'lganda buziladi, (c) insert atomik emas.

---

## 7. Amortizatsiya — ✅ TO'G'RI

**Formula joyi:** `finance/domain/services/depreciation.service.ts`:
- SL (`:79`): `(cost − salvage) / years / 12` ✅
- DB 200% (`:89`): `bookValue × (2/years) / 12`, `buildSchedule:131` da `min(dep, bv−salvage)` clamp ✅
- SYD (`:104-112`): `remaining/SYD × (cost−salvage) / 12`, `SYD = n(n+1)/2`, yil indeksi `ceil(month/12)` ✅
- UOP (`:114-117`): `(cost−salvage) × produced/total` ✅
- `buildSchedule` salvage floor + book value capping to'g'ri (`:140-145`).

**Baho:** To'rt metod ham **matematik to'g'ri**, IFRS/UZ soliq amaliyotiga mos. Validatsiya (`cost ≥ salvage`, `life > 0`) bor.

⚠️ **Bitta nozik nuqta (UOP):** `buildSchedule:138` UOP da `unitsProduced / months` deb oylik birlikka bo'ladi — bu butun umr davomida bir xil ishlab chiqarish deb taxmin qiladi; real oylik `unitsProduced` kiritilmaydi (schedule bir martalik paramdan keladi). Real metered amortizatsiya uchun oylik birliklar massivi kerak edi.

**Eslatma:** Servis **sof kalkulyator** — `buildSchedule`/`annualDepreciation` natijani **hech qayerga yozmaydi** (xotira eslatmasi tasdiqlandi). GL ga amortizatsiya provodkasi avtomatik tushmaydi.

---

## 8. Ombor balansi (kirim − chiqim) — ⚠️ FORMULA TO'G'RI, TRANZAKSIYA-XAVFSIZ EMAS

**Formula joyi:**
- `pos/.../pos-wms-sync.helpers.ts:82-117` `upsertWarehouseStock`: kirim → `qty + Δ`; chiqim → `GREATEST(0, qty − Δ)`; transfer → from `−Δ`, to `+Δ` (`pos-wms-sync.service.ts:103-110`).
- `pos-balance-guard.service.ts:44-96` — chiqimdan oldin `available_quantity` tekshiruvi.

**Baho — formula to'g'ri, lekin jiddiy risklar:**
1. ❌ **TRANZAKSIYA YO'Q.** Balans yangilash event listenerda (`onMovementCompleted`) ketma-ket `runQuery` chaqiruvlari bilan bajariladi — `warehouse_stock` upsert + `warehouse_transactions` insert **bitta DB tranzaksiyasida emas**. Agar tx insert fail bo'lsa (`:123` catch), stock allaqachon o'zgargan → **stock va transaction tarixi nomuvofiq** bo'lib qolishi mumkin.
2. ❌ **RACE CONDITION (oversell).** Guard `available_quantity` ni **o'qiydi** (`checkLine`), keyin alohida `upsertWarehouseStock` yozadi — `SELECT ... FOR UPDATE` yoki atomik shart yo'q. Ikki parallel chiqim bir vaqtda guardni o'tib, balansni manfiyga (GREATEST(0,...) tufayli 0 ga) tushirishi mumkin — ya'ni mavjuddan ko'p chiqim.
3. ⚠️ **FAIL-OPEN guard.** `pos-balance-guard.service.ts:61-65` — DB xatosida `available_qty: null` qaytaradi va **ruxsat beradi** (fail-open). DB nosozligida cheksiz chiqimga yo'l ochadi.
4. ⚠️ **Consumable yumshoq blok** — `available < required` bo'lsa ham `allowed: true` (faqat ogohlantirish), menejer override bilan **manfiy balans** yaratishi mumkin (dizayn bo'yicha, lekin nazoratsiz).
5. ⚠️ **Ikki marta yozish ehtimoli:** `onMovementCreated` (`:209`) draft uchun `warehouse_transactions`ga `'kirim'` yozadi, `onMovementCompleted` yana yozadi — agar ikkalasi ham ishga tushsa tranzaksiya tarixi ikkilanishi mumkin (movement turidan qat'i nazar created'da har doim 'kirim' yoziladi — bu ham shubhali).

**Xulosa:** kirim−chiqim arifmetikasi to'g'ri (GREATEST floor), lekin atomiklik/lock yo'qligi tufayli yuqori yuklamada **balans noto'g'ri bo'lishi mumkin**.

---

## QO'SHIMCHA topilgan risklar (hisob-kitobga aloqador)

- ⚠️ **Nolga bo'lish (KPI):** `hr/domain/services/kpi.service.ts:62,87` — `actualQuantity / targetQuantity` da `targetQuantity = 0` bo'lsa `NaN/Infinity` (guard yo'q). Spoilage/tax servislarda `safeDiv`/validatsiya bor, lekin KPI da yo'q.
- ⚠️ **Warehouse-rental cron STUB:** `cron/warehouse-rental.cron.ts` — formula faqat **izohda** (`areaM2 × billableDays × dailyRatePerM2`), `processed = 0`, DB ga hech narsa hisoblamaydi/yozmaydi. Ijara hisob-kitobi amalda **ishlamaydi**.
- ✅ **Soliq (VAT) kalkulyatori to'g'ri:** `finance/.../general-tax.service.ts:119-153` — INCLUSIVE `tax = total×rate/(1+rate)`, EXCLUSIVE `tax = base×rate` — ikkalasi ham **to'g'ri**, DB-driven stavka (yaxshi).
- ✅ **Variance (MPV/MQV/LRV/LEV):** `costing.service.ts:86-91` — standart variance formulalari **to'g'ri** (kitob bo'yicha).
- ✅ **Ink consumption:** `qc/.../ink-consumption.service.ts:184-186` — `grams = area×cov%×rate×sheets`, `litres = grams/(density×1000)` — **to'g'ri**.

---

## PUL / BUXGALTERIYA TO'G'RILIGI — XULOSA (ustuvor)

**Eng xavfli (pul/buxgalteriya):**
1. 🔴 **Ombor balansi atomik emas + fail-open guard** (#8) — real pul (zaxira qiymati) noto'g'ri bo'lishi mumkin; oversell/manfiy balans.
2. 🔴 **GL leglari atomik jurnal emas** (#6.1) — yarim provodka qolishi; storno/audit qiyin.
3. 🟠 **Payroll closure balans formulasi piece/allowance bo'lganda buziladi** (#6.2) — davr yopilishi fail yoki noto'g'ri jurnal.
4. 🟠 **FIFO/average COGS amalda qo'llanilmaydi** (#1) — tannarx standart/qo'lda narxga tayanadi, real partiya narxidan emas.
5. 🟡 **Payroll gross-only** (#4) — `netPay` daromad solig'isiz; "sof maosh" deb noto'g'ri talqin qilinishi mumkin (memory eskirgan).

**Matematik jihatdan to'g'ri va ishonchli:** Amortizatsiya (#7), VAT (general-tax), Variance (costing), Ink consumption, Spoilage rate, payroll piece-rate/stavka arifmetikasi.

**Umuman yo'q (qurish kerak):** Rulon kg→m² (#2), 3/5 qatlam + chet-trim kesim (#3), kamomad/shrinkage normasi (#5), real FIFO COGS ulanishi (#1), ishlaydigan ijara cron.

---
*Tahlilchi sessiya — read-only. Hech qanday kod/DB o'zgartirilmadi.*
