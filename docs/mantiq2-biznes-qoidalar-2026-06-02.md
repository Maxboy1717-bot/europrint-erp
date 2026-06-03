# MANTIQ-2 — Biznes Qoidalar / Validatsiya / Guard Audit

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (READ-ONLY) — hech narsa o'zgartirilmadi, faqat shu hisobot.
**Doira:** `apps/api/src` (backend) + jonli `europrint` DB (read-only `_audit/q.cjs`).
**Maqsad:** Har bir biznes qoidasi kodda haqiqatan ham bajarilishini tekshirish (guard'ni topib, `fayl:satr` keltirish).

Belgilar: ✅ ishlaydi · ⚠️ qisman · ❌ yo'q

---

## Qisqa jadval

| # | Qoida | Holat | Asosiy joy |
|---|-------|-------|-----------|
| 1 | Manfiy qoldiq bloki (negative-stock) | ✅ (POS) / ⚠️ (WMS aggregate) | `pos-balance-guard.service.ts`; `pos-fifo.service.ts` |
| 2 | Bron/zaxira bloki | ⚠️ qisman | `stock-reservation.service.ts`; `drizzle-wms.repo.ts` |
| 3 | Ortiqcha to'lov bloki (over-payment) | ✅ | `record-payment.handler.ts:71`; `invoice.aggregate.ts:156,190`; `sd-payments.repository.ts:76` |
| 4 | Tasdiqlash zanjiri (amount/threshold → menejer) | ⚠️ qisman | `cc-org-resolver.service.ts`; ❌ `approval-request.aggregate.ts:59` (dead) |
| 5 | Permission (rol) — har rol o'z ishi | ✅ | 4 global guard `app.module.ts:194-197`; `sod.guard.ts` |
| 6 | Karantin bloki (QC o'tmaguncha ishlatib bo'lmaydi) | ⚠️ qisman | `quarantine-workflow.service.ts` |
| 7 | Oylik darvozasi (org-assign'siz oylik yo'q) | ✅ | `calculate-payroll.handler.ts:51-64` |

---

## 1. Manfiy qoldiq bloki — ✅ (POS yo'li) / ⚠️ (WMS aggregate)

**POS harakat yo'li (jonli, asosiy):** `PosMovementService.createMovement` chiqim turlari
(`EXTERNAL_OUT/INTERNAL_ISSUE/INTERNAL_RETURN/INTERNAL_TRANSFER/DAMAGE`) uchun
`PosBalanceGuardService.checkMovementLines` chaqiradi.
- `pos-movement.service.ts:90-118` — guard natijasi `blocks.length>0` bo'lsa `BadRequestException`.
- `pos-balance-guard.service.ts:72-95` — `material_type='asset'` → **qattiq blok**;
  `consumable` → **yumshoq** (ogohlantirish, menejer `overrideReason` bilan o'tadi, audit log).
- `pos-fifo.service.ts:97-100` va `goods-issue.handler.ts:68-69` — yetmagan miqdor → `Err`.
- Jonli DB: `warehouse_stock` da `available_quantity` ustuni MAVJUD (24 qator) — so'rov ishlaydi.

**Zaiflik (⚠️):**
- `pos-balance-guard.service.ts:61-65` — DB xatosida **fail-open** (ruxsat beradi). DB nosozligida
  manfiy qoldiq o'tib ketishi mumkin (faqat loglanadi).
- WMS domen aggregate `Stock.issue()` (`stock.aggregate.ts:84-95`) `quantity` ni manfiy qilishdan
  himoyalamaydi — u faqat `reservedQuantity` ga qaraydi (1-qoidani emas, 2-qoidani tekshiradi);
  ad-hoc chiqimni `goods-issue.handler.ts` `getAvailableQuantity()` orqali cheklaydi, lekin
  reset-qiymat muammosi bor (2-qoidaga qarang).

---

## 2. Bron/zaxira bloki — ⚠️ qisman

**Bron yaratishda:** `stock-reservation.service.ts:53-58` — `available = on_hand − already_reserved`;
so'ralgan miqdor > available bo'lsa `BadRequestException`. ✅ to'g'ri.

**Chiqimda bronni hisobga olish (SQL repo yo'li):** `drizzle-wms.repo.ts:159-181` — `issueStock`
ikki rejim: *reserved issue* (bronlangandan kamaytiradi) va *ad-hoc issue*
(`available = quantity − reserved_quantity` dan oladi, bronlangan tegmaydi). ✅ bu yo'l to'g'ri.

**XATO (⚠️ latent bug):** `drizzle-wms.repo.ts:37-38` `toStock()` mapper `new Stock(...)` ni
**`reserved_quantity` siz** quradi → aggregate ichida `reservedQuantity` doim `0`
(`stock.aggregate.ts:35`). Natijada `GoodsIssueHandler` (`goods-issue.handler.ts:52-58`)
`getAvailableQuantity()` = `quantity − 0` deb hisoblaydi va `stock.issue()` ni chaqiradi, lekin
`issue()` `amount > reservedQuantity(=0)` bo'lsa **"Belgilangan miqdor yetarli emas"** qaytaradi —
ya'ni bu DDD yo'li orqali bron real qoldiqdan **chegirilmaydi** (yoki har doim xato beradi).
Jonli chiqim SQL repo yo'lidan ketgani uchun ishlaydi, ammo aggregate-yo'l noto'g'ri.

**Xulosa:** bron tekshiruvi bron-*yaratish* bosqichida bor, chiqim bosqichida faqat SQL repo
yo'lida ishonchli; domen aggregate yo'li buzuq.

---

## 3. Ortiqcha to'lov bloki — ✅ (eng kuchli himoyalangan)

Uch qatlamli himoya:
1. **CQRS handler:** `record-payment.handler.ts:64-73` — cent-aniqlikda
   `commandAmountCents > remainingCents` → `Err('Ortiqcha to'lov ruxsat etilmaydi')`.
2. **Aggregate invariant:** `invoice.aggregate.ts:156-160` (`markAsPartiallyPaid` — `amount > remaining`)
   va `:190-194` (`markAsFullyPaid` — `finalAmount < remaining`) → `BUSINESS_RULE_VIOLATION`.
3. **SD to'lov yo'li (alohida REST):** `sd-payments.repository.ts:63-82` — buyurtmaga bog'liq
   `invoices` jami − to'langan = qolgan; `amount > remaining` → `Err`. Shuningdek `amount<=0` bloki (:61).

Hammasi haqiqiy. Eng yaxshi himoyalangan qoida.

---

## 4. Tasdiqlash zanjiri (summa/threshold bo'yicha to'g'ri menejerga) — ⚠️ qisman

**Bor (org asosida marshrutlash):** `cc-org-resolver.service.ts:26-99` — Communication-Center
workflow `approver_position_code` ni real org-sxemaga aylantiradi:
`CEO` (root `head_user_id`), `MANAGER_OF_SENDER` (employee.manager_id→user), `DEPT_HEAD`
(bo'lim boshlig'i), `POSITION:<CODE>`; faol delegatsiya (`cc_delegations`) ham hisobga olinadi.
Workflow bosqichlari ketma-ket (`cc-workflow.service.ts:86-96`, `step_order`), PIN imzo bilan
(`cc-workflow.service.ts:159`). Jonli: `cc_workflow_steps` = 34 qator.

**YETISHMAYDI (❌ summa-darvozasi):**
- `approval-request.aggregate.ts:59-77` `isHitlRequired(documentType, amount)` (PO≥50mln, PAYMENT≥100mln,
  MRO≥20mln, WRITEOFF≥10mln) — **HECH QAYERDA CHAQIRILMAYDI** (butun kod bazasida 0 ta chaqiruvchi).
  Ya'ni HITL summa-thresholdi **o'lik kod**.
- `approvals.service.ts:102-110` `needsApproval(type, amount)` — bor, lekin bu metod ham hech qaysi
  controller/handler tomonidan chaqirilmaydi (faqat e'lon qilingan). `approval_requests` jadvali jonli=0 qator.
- CC workflow bosqichlari **statik** (har template uchun qat'iy `approver_position_code`); **summaga
  bog'liq shartli marshrutlash YO'Q** (`min_amount/max_amount/threshold` ustunlari yo'q —
  communication-center'da topilmadi).

**Xulosa:** "kim tasdiqlaydi" org-sxema asosida ishlaydi, ammo "summa oshsa yuqori darajaga ko'tarilish"
(escalation by amount) amalga oshmagan — threshold mantiq'i yozilgan, lekin **ulanmagan**.

---

## 5. Permission (rol) — har rol faqat o'z ishini bajaradi — ✅

**4 global guard** `app.module.ts:194-197` da ro'yxatdan o'tgan (APP_GUARD):
`JwtAuthGuard → RolesGuard → SodGuard → PermissionGuard` (+ throttler). Memory bilan mos.

**SoD guard** `sod.guard.ts:51-118` — vazifalar ajratilishi (bir kishida bo'lmasligi):
PO yaratish+tasdiqlash, invoice yaratish+to'lov tasdiqlash, omborga qabul+chiqim,
payroll hisoblash+tasdiqlash, material yaratish+o'chirish, CRM RFM+churn. Fail-closed.

**Eslatma:** guard'lar permission-set (`user.permissions`/`permissionSet.actions`) ga tayanadi.
`sod.guard.ts:35-37` — `user` yo'q bo'lsa `return true` (lekin JwtAuthGuard avval ishlaydi,
shuning uchun anonim so'rov bu yergacha yetmaydi). Rol modeli (memory): manager×27/super_admin×3/director×1.

---

## 6. Karantin bloki (QC o'tmaguncha material ishlatilmaydi) — ⚠️ qisman

**Workflow bor:** `quarantine-workflow.service.ts` — `EXTERNAL_IN` uchun
`DRAFT→KARANTIN→QC_REVIEW→APPROVED→COMPLETED` (`:15-24` STATUS_FLOW).
- `moveToQuarantine` (:32-61) — kelgan tovarni **QC-HOLD** omboriga qo'shadi
  (`warehouse_stock`), `quarantine_required=true`, status `karantin`.
- `qcDecision` (:79-134) — `QABUL` → QC-HOLD dan **RM-MAIN** ga ko'chiradi; `CHIQARISH` → QC-HOLD dan
  chiqaradi; `REWORK`/reject — alohida.
- Eskalatsiya: `escalateExpiredQuarantine` (:63) + cron `pos-quarantine-check.job.ts` (48 soatdan keyin).

**Kuchsiz tomon (⚠️):**
- Karantin himoyasi **fizik ombor ajratishga** tayanadi (QC-HOLD ≠ RM-MAIN): material QC-HOLD da
  turadi va faqat tasdiqdan keyin asosiy omborga o'tadi. Lekin **chiqim guardlari (1-qoida) QC-HOLD
  omboridan chiqimni ATAYIN bloklamaydi** — agar kimdir `fromWarehouseId=QC-HOLD` bilan chiqim
  yaratsa, `pos-balance-guard` faqat qoldiqqa qaraydi, "bu karantin ombori" degan maxsus blok yo'q.
- `qcDecision` da QC-HOLD→RM-MAIN ko'chirish `karantin` statusiga bog'liq emas (status tekshiruvi
  yo'q) — to'g'ri status-mashinasi `STATUS_FLOW` da bor, lekin `qcDecision` uni majburlamaydi.

**Xulosa:** karantin oqimi mavjud va material fizik ajratiladi, ammo "karantin omboridan chiqimni
bloklash" qat'iy guard sifatida yo'q — ajratish konvensiyaga tayanadi.

---

## 7. Oylik darvozasi (org-assign'siz oylik yo'q) — ✅

`calculate-payroll.handler.ts:49-64` — aniq biznes qoida:
1. `findUserIdByEmployee(employeeId)` — user yo'q bo'lsa `Err('user yaratilmagan — oylik kiritilmaydi')`.
2. `hasAnyOrgAssignment(userId)` — org-strukturaga biriktirilmagan bo'lsa
   `Err('tashkiliy tuzilmaga biriktirilmagan — oylik kiritilmaydi')`.

Helper: `compatibility/employees-org-assignment.helper.ts`. Memory'dagi "HR org-chart gate" tasdiqlandi —
**haqiqiy va majburiy**. (Eslatma: bu CQRS `CalculatePayrollCommand` yo'lida; agar boshqa to'g'ridan-to'g'ri
payroll yozish yo'llari bo'lsa, ular bu darvozani aylanib o'tishi mumkin — `payroll.service.ts:create`
darvozasiz, lekin u `hr_payroll_records` ga to'g'ridan yozadi; tekshirish tavsiya etiladi.)

---

## Eng xavfli yetishmayotgan guardlar (pul/qoldiq himoyasi)

1. **❌ Summa-bo'yicha tasdiqlash darvozasi ulanmagan (4-qoida).** HITL thresholdlari (PO≥50mln,
   to'lov≥100mln va h.k.) `isHitlRequired`/`needsApproval` da yozilgan, lekin **hech qayerda
   chaqirilmaydi**. Yirik to'lov/xarid avtomatik yuqori tasdiqqa ko'tarilmaydi → **moliyaviy nazorat teshigi**.
2. **⚠️ Balance-guard fail-open (1-qoida).** `pos-balance-guard.service.ts:63-65` DB xatosida ruxsat
   beradi. DB nosozligi/timeout vaqtida manfiy qoldiq o'tishi mumkin → **stok himoyasi teshigi**.
3. **⚠️ WMS aggregate bron-yo'li buzuq (2-qoida).** `drizzle-wms.repo.ts:37` `reserved_quantity` ni
   aggregate'ga uzatmaydi → DDD `GoodsIssueHandler` yo'li ishonchsiz; faqat SQL repo yo'li to'g'ri.
4. **⚠️ Karantin omboridan chiqim qat'iy bloklanmaydi (6-qoida).** QC-HOLD dan chiqim maxsus
   guard bilan to'silmagan; ajratish faqat ombor-kodi konvensiyasiga tayanadi.

---

## Umumiy xulosa

- **Kuchli (✅):** Ortiqcha to'lov (3) — uch qatlamli; Permission/SoD (5) — 4 global guard;
  Oylik darvozasi (7) — real org-assign sharti.
- **Qisman (⚠️):** Manfiy qoldiq (1) — POS da ishlaydi, lekin fail-open + WMS aggregate zaif;
  Bron (2) — yaratishda bor, chiqimda faqat SQL yo'lida; Karantin (6) — oqim bor, qat'iy chiqim-blok yo'q.
- **Yo'q (❌):** Summa-threshold tasdiqlash marshrutlashi (4) — kod yozilgan ammo **ulanmagan**
  (dead code).

Eng dolzarb tuzatish: 4-qoidani ulash (yirik summa → majburiy yuqori tasdiq) va 1-qoidadagi
fail-open ni fail-closed ga o'zgartirish. Bular pul va stok himoyasidagi eng katta teshiklar.

*Manba fayllar yuqorida `fayl:satr` ko'rinishida keltirilgan. Jonli DB tekshiruvlari:*
*warehouse_stock=24 qator (available_quantity bor), cc_workflow_steps=34, approval_requests=0.*
