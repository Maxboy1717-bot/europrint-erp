# Zanjir-2: Sinxron-data tahlili (EuroPrint ERP)

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (read-only) — hech narsa o'zgartirilmadi, faqat shu hisobot
**Manba:** kod (file:line) + jonli `europrint` DB tuzilmasi (read-only `_audit/q.cjs`)
**Eslatma:** Jonli DB deyarli BO'SH (qurilish bosqichi) — xulosalar asosan KOD + DB STRUKTURA dalillariga tayanadi, runtime ma'lumotga emas.

---

## 0. Xulosa (1 qarash)

| # | Sinxron bo'lishi kerak data | Joylar | Holat | Mexanizm |
|---|------------------------------|--------|-------|----------|
| 1 | Jihoz/aktiv (warehouse "issued" + xodim profili + moliya/kapital) | `asset_items` + `employee_assets` + (GL) | ⚠️ qisman (2/3) | service tx (warehouse+profil); moliya YO'Q |
| 2 | Material chiqim/kirim (ombor qoldig'i + harakat jurnali) — POS yo'li | `warehouse_stock` + `material_cards.current_stock` + `material_movements` | ⚠️ qisman (tranzaksiyasiz) | service (3 ketma-ket raw SQL, `db.transaction` YO'Q) |
| 3 | Material ishlab-chiqarish sarfi — "remaining" yo'li | faqat `production_material_balance` | ❌ sinxron emas | qoldiq kamaymaydi |
| 4 | Xodim qarzi/avans (kassir + profil + moliya) | faqat `payroll_advances` | ❌ sinxron emas | bitta jadval, moliyaga ulanmagan |
| 5 | Buyurtma → bo'limlar fan-out (mold/design/cliche/logistics/warehouse) | `sd_order_departments` + `ow_*` jadvallar | ✅ sinxron | event (AdvanceApprovedEvent) |
| 6 | Buyurtma → Kanban | `sd_sales_orders` + `kanban_*` | ✅ sinxron | event (OrderCreatedEvent, outbox) |
| 7 | Payroll davr yopilishi → Bosh kitob (GL) | `payroll_*` + `gl_journal_entries` | ✅ sinxron | service (closePeriod → insertGlJournalLines) |
| 8 | Xodim ismi (denormalizatsiya) | `employees.full_name` → `users` + 5 jadval | ✅ sinxron | DB TRIGGER |
| 9 | Mijoz/material/vendor/ombor nomi (denormalizatsiya) | master → ~10 jadval | ✅ sinxron | DB TRIGGER ×4 |
| 10 | employees ↔ users bog'lanish | `employees.user_id` ↔ `users.employee_id` | ✅ sinxron | boot backfill (onModuleInit) |

**Asosiy xulosa:** Sinxronizatsiya **TENGSIZ** — yangi event-driven oqimlar (buyurtma, payroll-GL, fan-out) va denormalizatsiya triggerlari yaxshi ishlaydi; lekin **3 ta egasi aytgan asosiy vizyon to'liq ulanmagan**: jihozning moliya/kapital tomoni (#1), material ishlab-chiqarish sarfi qoldiqqa tushmaydi (#3), xodim qarzi moliya/kassirga ulanmagan (#4).

---

## 1. Sinxronizatsiya mexanizmlari (umumiy manzara)

Tizimda 3 xil sinxronizatsiya usuli mavjud:

1. **DB triggerlar** (`information_schema.triggers`) — 5 ta denormalizatsiya "name-sync" + bir nechta tekshiruv (check) trigger.
2. **Event listenerlar** (`@nestjs/cqrs` + EventBridge/outbox) — buyurtma → kanban, avans → fan-out, avans → PP unlock.
3. **Service-darajadagi ko'p-jadval yozuv** — bitta service metodi bir nechta jadvalga yozadi (payroll→GL, jihoz assign, ombor chiqim).

Jonli DB triggerlari (tasdiqlangan):
```
trg_employees_name_sync   → employees   (AFTER UPDATE)  → sync_employee_full_name()
trg_materials_name_sync   → material_cards (AFTER UPDATE) → sync_material_name()
trg_customers_name_sync   → sd_customers (AFTER UPDATE)  → sync_customer_name()
trg_vendors_name_sync     → vendors     (AFTER UPDATE)  → sync_vendor_name()
trg_warehouses_name_sync  → warehouses  (AFTER UPDATE)  → sync_warehouse_name()
+ check triggerlar: trg_bom_cycle_check, trg_payroll_net_check, trg_production_qty_check,
  trg_inventory_nonneg, trigger_conflict_escalation, sync_content_text
```

---

## 2. ✅ ISHLAYDIGAN sinxronizatsiyalar

### 2.1 Xodim ismi denormalizatsiyasi (DB trigger)
`sync_employee_full_name()` — `employees.full_name` o'zgarsa → `users`, `audit_logs`, `audit_trail_log`, `rule_violations`, `ppe_violations`, `security_ppe_checks` jadvallarining ism nusxalari yangilanadi. **To'liq sinxron** (DB darajasida, kod aralashuvisiz).

### 2.2 Mijoz/Material/Vendor/Ombor nomi denormalizatsiyasi (DB trigger ×4)
- `sync_customer_name()` → `sales_orders`, `quotations`, `invoices`, `sd_invoices`, `deliveries`, `sd_deliveries`, `mm_deliveries`, `orders`, `sales_invoices`, `pos_transactions` (10 jadval).
- `sync_material_name()` → `material_consumption`, `material_movements`, `material_norms`, `production_material_balance`, `inventory_valuation` (5 jadval; `material_cards.xom_ashyo` manba).
- `sync_vendor_name()` → 8 jadval (`material_cards.supplier_name`, `goods_receipts`, ...).
- `sync_warehouse_name()` → `warehouse_rental_records`.

Bularning hammasi `name`/`xom_ashyo` o'zgarganda denormalizatsiya nusxalarini yangilaydi — **manba aniq (master jadval), sinxron kafolatlangan**.

### 2.3 Buyurtma → Kanban (event)
`create-order.handler.ts:150` `OrderCreatedEvent` chiqaradi (outbox pattern bilan — ishonchli, `:87` izoh). `order-created-kanban.handler.ts:29-35` uni qabul qilib `createKanbanForOrder()` chaqiradi → kanban karta yaratiladi. **Sinxron** (xato bo'lsa ham buyurtma to'xtamaydi, faqat log).

### 2.4 Buyurtma avansi → bo'limlar fan-out (event)
`confirm-advance-payment.handler.ts:112-116` — avans ≥70% bo'lganda `AdvanceApprovedEvent` chiqaradi (faqat bir marta — pending→approved o'tishida). Qabul qiluvchilar:
- `advance-approved-fanout.listener.ts` — `sd_order_departments` dan tanlangan bo'limlar bo'yicha har biriga ish (job) yaratadi: mold/design/cliche/logistics/warehouse → tegishli `ow_*` jadval + status `started`. (production DEFERRED — `:82`.)
- `pp/advance-approved.listener.ts` — PP rejalashtirishni ochadi (`unlockPlanning`).

**Sinxron** (idempotent, event-driven). Bu egasining "buyurtma → ishlab chiqarish + ombor" vizyonining ishlaydigan o'zagi.

### 2.5 Payroll davr yopilishi → Bosh kitob (GL)
`payroll.service.ts:74-85` `closePeriod()` → `closure.buildJournal()` (balansli debit/credit qatorlar) → `hrPayrollRepo.insertGlJournalLines()` → `drizzle-hr-payroll.repo.ts:97` `gl_journal_entries` ga INSERT. **Sinxron** (payroll va moliya GL bir oqimda). Balans tekshiruvi bor (`payroll-closure.service.ts:137`).

### 2.6 employees ↔ users bog'lanishi (boot backfill)
`org-structure.service.ts` `onModuleInit()` → `backfillEmployeeUserId()` (`@common/database/ddl-migrations`). Idempotent, ADD-ONLY, faqat NULL qatorlar. Reseed `employees.user_id` ni NULL qoldirsa, boot vaqtida o'zini tuzatadi. **Sinxron** (self-heal).

---

## 3. ⚠️ QISMAN sinxronizatsiyalar

### 3.1 Jihoz/aktiv — 3 joydan FAQAT 2 tasi sinxron
Egasining vizyoni: jihoz = **ombor ("issued") + xodim profili + moliya (kapital)** — uch joy.

**Mavjud kod** (`queries-hr-assets.ts:161` `execAssignAsset`):
```ts
// 1) Ombor tomoni:
db.update(asset_items_ext).set({ status: 'assigned', assigned_to: empId })
// 2) Profil tomoni:
db.insert(employee_assets).values({ asset_id, employee_id, assigned_date, ... })
```
✅ Ombor (`asset_items.status/assigned_to`) + ✅ Profil (`employee_assets`) — sinxron.
❌ **Moliya/kapital tomoni YO'Q** — assign paytida GL/kapital postingi yo'q.

Moliya tomoni alohida va **ulanmagan**: `depreciation.service.ts` — bu sof KALKULYATOR (`buildSchedule()`), natijani hech qayerga yozmaydi. `buildSchedule`/`annualDepreciation` faqat o'z faylida ishlatiladi (boshqa chaqiruvchi YO'Q). `asset_items.accumulated_depreciation`/`current_value` ustunlari mavjud, lekin ularni davriy yangilaydigan oqim topilmadi.
**Natija:** jihoz qiymati/amortizatsiyasi moliya bilan sinxron emas — ⚠️ qisman (2/3).

> Eslatma: tranzaksiya — `execAssignAsset` ikki yozuvni `db.update`+`db.insert` ketma-ket bajaradi, aniq `db.transaction` o'rami ko'rinmaydi → birinchisi o'tib, ikkinchisi yiqilsa desync xavfi (kichik).

### 3.2 Material chiqim/kirim (POS yo'li) — sinxron, lekin tranzaksiyasiz
`pos/warehouse-config.service.ts` `issueStock()` (`:99`) va `receiveStock()` (`:152`) **3 joyni** yangilaydi:
```
1) warehouse_stock        (ombor qoldig'i, atomik WHERE available>=qty)   :113
2) material_cards.current_stock  (global qoldiq)                          :121
3) material_movements     ('ISSUE'/'RECEIVE' jurnali)                     :125
```
Bu egasining "raw-material ombor + bo'lim ombor" vizyoniga eng yaqin to'g'ri implementatsiya. **AMMO:** uchala statement `safeCall` ichida, ammo **`db.transaction` bilan o'ralmagan** — agar 2-statement (`material_cards`) yiqilsa, `warehouse_stock` allaqachon kamaygan bo'ladi → ikki qoldiq DESYNC bo'ladi. ⚠️ atomiklik kafolati yo'q.

---

## 4. ❌ SINXRON EMAS (yo'qolgan ulanish)

### 4.1 Material ishlab-chiqarish sarfi — qoldiqqa tushmaydi
`remaining/material-balance.service.ts` `takeMaterial/useMaterial/returnMaterial` → `productionAction()` → repository (`material-balance.repository.ts:66`):
```ts
INSERT INTO production_material_balance (material_card_id, action_type, quantity, ...) VALUES (...)
```
**Faqat `production_material_balance` ga yoziladi.** `material_cards.current_stock` KAMAYTIRILMAYDI, hech qaysi ombor jadvali (`warehouse_stock`) yangilanmaydi.

➡️ **Manba-ziddiyat (source-of-truth ambiguity):** material chiqimining IKKI xil yo'li bor va ular bir-biriga mos kelmaydi:
- POS yo'li (3.2) → qoldiqni kamaytiradi.
- "remaining" ishlab-chiqarish yo'li (4.1) → faqat balance jurnaliga yozadi, qoldiq o'sha-o'sha qoladi.
Bu egasining "+2 kg ikki joyda" vizyoni uchun ❌ **buzuq** — bir bo'limga material berilsa, raw-ombor qoldig'i avtomatik kamaymaydi.

### 4.2 Xodim qarzi/avansi — moliya va kassirga ulanmagan
Egasining vizyoni: qarz = **kassir + xodim profili + moliya** — uch joy.

`employees-compat-financials.service.ts`:
- `createCashAdvance()` (`:166`) → faqat `payroll_advances` ga INSERT.
- `getCashAdvances()` (`:49`) → faqat `payroll_advances` dan o'qiydi.
- `createFine()` (`:179`) → faqat `disciplinary_actions` ga INSERT (jarima = qarzning bir turi).

❌ **Hech qaysi finance/kassa jadvaliga (`cash_transactions`, `cash_advances`, `creditor_debts`, GL) yozuv bormaydi.** Avans yaratilsa, moliya buni "ko'rmaydi"; kassa balansi o'zgarmaydi; GL postingi yo'q. Bundan tashqari `advance_payments`, `advances`, `cash_advances`, `creditor_debts` jadvallari DB da mavjud, lekin bu oqim ulardan emas, faqat `payroll_advances` dan foydalanadi → **manba ziddiyati** (qaysi jadval qarz uchun kanonik — noaniq).

> Qo'shimcha: fayl `@deprecated` shim deb belgilangan (`:1-7`, "canonical: Finance module"), lekin haqiqiy Finance moduliga ko'chirilmagan — ya'ni ulanish vada qilingan, ammo bajarilmagan.

---

## 5. Manba-ziddiyati (source-of-truth) joylari — yig'indi

| Data | Ziddiyatli jadvallar | Muammo |
|------|----------------------|--------|
| Material qoldig'i | `material_cards.current_stock` ⟷ `warehouse_stock` ⟷ `production_material_balance` | POS yo'li 1+2 ni yangilaydi; production yo'li faqat 3 ni → qoldiq desync |
| Xodim qarzi/avans | `payroll_advances` ⟷ `cash_advances`/`advances`/`advance_payments`/`creditor_debts` | Faqat `payroll_advances` ishlatiladi; qolgan 4 jadval o'lik/ulanmagan |
| Jihoz qiymati | `asset_items.current_value`/`accumulated_depreciation` ⟷ GL | Amortizatsiya kalkulyatori hech qayerga yozmaydi |
| Mijoz nomi | `sd_customers.name` ⟷ 10 ta denormalizatsiya nusxasi | ✅ trigger bilan hal qilingan (ziddiyat yo'q) |

---

## 6. Sinxronizatsiya qanday majburlanadi — yig'indi

| Mexanizm | Qayerda | Misol |
|----------|---------|-------|
| **DB trigger** | denormalizatsiya nomlari | `trg_*_name_sync` ×5 (✅ ishonchli) |
| **Event (CQRS + outbox)** | buyurtma oqimi | `OrderCreatedEvent`→Kanban, `AdvanceApprovedEvent`→fan-out/PP (✅) |
| **Service ko'p-jadval yozuv** | payroll/jihoz/ombor | `closePeriod`→GL (✅ tx-siz lekin bitta repo); `issueStock` (⚠️ tx-siz); `execAssignAsset` (⚠️ tx-siz) |
| **Boot self-heal** | bog'lanish | `backfillEmployeeUserId` onModuleInit (✅) |
| **YO'Q (manual/ulanmagan)** | qarz→moliya, material-sarf→qoldiq, jihoz→kapital | ❌ sinxron yo'q |

---

## 7. Tavsiyalar (faqat tahlil — bajarish egasi ruxsatisiz EMAS)

1. **#4.2 qarz→moliya:** `createCashAdvance`/`createFine` ni Finance GL/kassa postingiga ulash (event yoki bitta tx). Hozir vada `@deprecated` izohda qolgan.
2. **#4.1 material-sarf→qoldiq:** `productionAction('take'/'use')` da `material_cards.current_stock` ni kamaytirish + `warehouse_stock` ni yangilash (POS yo'li bilan birxillashtirish). Eng yaxshisi ikkala yo'lni bitta umumiy "stock movement" servisga yig'ish (manba-ziddiyatni yo'qotish uchun).
3. **#3.1/3.2/jihoz atomiklik:** ko'p-statement yozuvlarni (`issueStock`, `execAssignAsset`) `db.transaction()` ichiga o'rab, qisman-yozuv desync xavfini yopish.
4. **#3.1 jihoz→kapital:** davriy amortizatsiya jobi `buildSchedule()` natijasini `asset_items.accumulated_depreciation`/`current_value` ga va GL ga yozsin.

---

*Tahlilchi rolida tayyorlandi (Qoida 23 🔵). Manba: kod file:line + jonli DB struktura. Hech bir kod/DB/commit o'zgartirilmadi.*
