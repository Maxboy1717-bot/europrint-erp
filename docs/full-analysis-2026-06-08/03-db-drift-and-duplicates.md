# 03 — DB Drift va Duplikatlar

> **Hujjat turi:** REPORT-ONLY. Hech narsa o'zgartirilmadi.
> **Sana:** 2026-06-08
> **Manbalar:** (1) canonical Drizzle parse (`lib/db`, 02-hisobot), (2) backend superset parse (`apps/api/src/shared/db`), (3) live DB snapshot `_db_tables.txt` (1024 jadval) va `_db_cols.txt` (14 840 ustun), **2026-05-25** dump, (4) mavjud `_drift_report_fresh.txt` (2026-05-25).
> **Muhim ogohlantirish:** Live DB'ga to'g'ridan-to'g'ri ulanish **yo'q**. Barcha "DB" dalillari 2026-05-25 dump'iga asoslanadi — bugungi (2026-06-08) haqiqiy holat bundan farq qilishi mumkin → `TASDIQLANMAGAN (live)`.
> **Parser cheklovi:** bu hisobotdagi tolerant parser ~10 ta jadvalni o'tkazib yuboradi (`check()`/`pgSequence` qavs murakkabligi; masalan `material_cards` `mm-material-cards.ts:60`da bor, lekin parser to'plamidan tushgan). Shu sababli **birламchi drift raqamlari mavjud `_drift_report_fresh.txt`dan** olinadi (u 957 ta nom topgan), mening qayta hisobim esa **nazorat (cross-check)** sifatida, kamchiliklari ko'rsatilgan holda beriladi.

---

## 1. Drift xulosasi (ikki manba)

| Ko'rsatkich | Mavjud hisobot (2026-05-25) `_drift_report_fresh.txt` | Mening qayta hisobim (kod 2026-06-08 vs dump 2026-05-25) |
|---|---|---|
| Drizzle pgTable (unikal nomlar) | **957** | ~947 (parser ~10 ta o'tkazib yubordi) |
| DB jadval+view | **951** | 1024 (`_db_tables.txt`) |
| Drizzle-only (kodda bor, DB'da yo'q) — **runtime xavf** | **73** | **10** (yangi feature jadvallar) |
| DB-only (DB'da bor, kodda yo'q) — dormant/legacy | (sanalmagan) | ~87 (ba'zilari parser false-positive) |
| Drifted ustunlar (jadval bor, ustun DB'da yo'q) | **527** | (alohida pattern bo'yicha quyida) |

> **Talqin:** Eski hisobot (951 DB) va joriy dump (1024 DB) orasidagi farq — oraliqda DB'ga ~70+ jadval qo'shilgan (ko'p "Drizzle-only" jadvallar endi DB'da mavjud: `ow_*`, `task_*`, `lms_*`). Ya'ni drift **sezilarli kamaygan**, lekin quyidagi aniq pattern'lar hali ham xavfli. To'liq tarixiy ro'yxatlar hamroh fayllarda: `03-drift-report-snapshot-2026-05-25.txt`, `03-drift-sets-current.json`.

---

## 2. Joriy Drizzle-only jadvallar (10) — eng dolzarb runtime xavf

Bular joriy kodda (`lib/db`/`apps/api`) ta'riflangan, lekin 2026-05-25 DB dump'ida **yo'q**. Agar runtime'da so'ralsa → `relation does not exist` xatosi (DB'ga migratsiya qilinmaguncha).

| Jadval | Manba (taxminiy) | Izoh |
|---|---|---|
| `material_layer_config` | `lib/db/.../mm-material-cards.ts:114` | `material_card_id` ustunini ishlatadi (DB'da u ham yo'q) — **ikki tomonlama buzuq** |
| `procurement_requests` | procurement (yangi modul) | Yangi xarid moduli |
| `procurement_request_items` | procurement | — |
| `procurement_approvals` | procurement | — |
| `org_node_portret` | org-structure (yangi) | Yangi org-struktura |
| `node_hr_requests` | org-structure/hr | — |
| `hr_mentorship_pairings` | hr | — |
| `hr_referrals` | hr | — |
| `marketing_calendar_events` | `europrint-compat.ts` → `schema-marketing-group2` | Mahalliy yangi jadval |
| `warehouse_types` | wms | — |

> **TASDIQLANMAGAN (live):** Bu 10 ta joriy dump asosida. Agar DB 2026-05-25'dan keyin yangilangan bo'lsa, ba'zilari allaqachon yaratilgan bo'lishi mumkin. Tekshirish: 07-hisobotdan keyin live DB introspeksiya.

---

## 3. Ma'lum problem pattern'lar (to'g'ridan-to'g'ri tasdiqlangan)

### 3.1 `material_card_id` vs `material_id` — P0/P1

Bu eng jiddiy joriy ustun-drift va nomlash chalkashligi.

- **Live DB (dump 2026-05-25):** `material_id` bilan tugaydigan **95 ta** ustun bor; `material_card_id` bilan tugaydigan **0 ta** ustun.
- **`current_stock` jadvali DB'da:** `id, warehouse_id, material_id, quantity_on_hand, quantity_reserved, quantity_available, unit_of_measure, last_movement_at, created_at` — ya'ni `material_id` (NE `material_card_id`).
- **Kod esa `material_card_id` ishlatadi:** `lib/db` sxemada 9 fayl, `apps/api/src`da **82 fayl** `material_card_id`/`materialCardId` ga murojaat qiladi.
- **Bitta faylda ikkita ziddiyatli mapping** (`lib/db/src/schema/mm-material-cards.ts`):
  - `mm-material-cards.ts:114` — `materialCardId: integer("material_card_id")` (SQL ustun `material_card_id` — DB'da YO'Q)
  - `mm-material-cards.ts:142` — `materialCardId: integer("material_id")` (xuddi shu JS prop, lekin SQL `material_id` — DB'da BOR)
  - `mm-material-cards.ts:178` — yana `materialCardId: integer("material_id")`
- **Xulosa:** JS xossasi `materialCardId` ba'zi joyda `material_card_id`ga, ba'zi joyda `material_id`ga map qilinadi. `material_card_id` SQL-nomli har qanday so'rov live DB'da **xato beradi**. `material_layer_config` (2-bo'lim, Drizzle-only) aynan `material_card_id` ustuniga FK qiladi → ikki tomonlama buzuq.
- **Runtime xavf:** **Yuqori** — 82 ta backend fayl ta'sirlanishi mumkin. Aniq qaysi endpoint'lar buziladi 12/21-hisobotlarda.

### 3.2 `tenant_id` scoping — P2

- **Live DB dump:** `tenant_id` ustuni **26 ta** jadvalda bor.
- **Eski hisobot (2026-05-25)** `tenant_id`ni ~18 jadvalda "DB'da yo'q" deb belgilagan edi (masalan `employees`, `crm_leads`, `attendance`, `payroll_periods`, `sales_orders`...). Joriy dump'da 26 jadvalda mavjud → ko'pchilik **qo'shilgan**.
- **Drizzle tomon:** parser faqat 9 jadvalda aniq `tenantId` xossasini topdi — bu **parser cheklovi** (ko'p jadvallar `tenant_id`ni umumiy helper/spread orqali qo'shadi, parser buni ko'rmaydi) → `TASDIQLANMAGAN` aniq son.
- **Qoldiq xavf:** multi-tenancy izchil emas — ba'zi jadvallarda bor, ba'zilarida yo'q. To'liq scoping auditi 04-hisobotda (auth/tenant).

### 3.3 Dormant jadvallar — P2/P3

| Jadval | DB'da | Drizzle'da | App kodida ishlatilishi | Holat |
|---|---|---|---|---|
| `payroll_calculations` | ✓ | ✓ | `apps/api/src/modules`da **1 fayl** | **Dormant** (deyarli ishlatilmaydi) |
| `pos_transactions` | ✓ | ✓ | `apps/api/src/modules`da **3 fayl** | Kam ishlatiladi |

> "Dormant" = sxemada/DB'da mavjud, lekin biznes-mantiqda deyarli o'qilmaydi/yozilmaydi. Aniq o'qish/yozish 06 (payroll) va 10/11 (POS) hisobotlarida.

### 3.4 `lms_*` jadvallar — (oldingi xavf, hozir hal bo'lgan ko'rinadi)

- Eski hisobot `lms_events`, `lms_sessions`ni Drizzle-only (DB'da yo'q) deb belgilagan edi.
- Joriy dump'da **20 ta `lms_*`** jadval bor; joriy Drizzle-only ro'yxatida birorta `lms_` yo'q.
- **Xulosa:** lms drift hal bo'lgan ko'rinadi — lekin `TASDIQLANMAGAN (live)`.

---

## 4. Duplikatlar tahlili va tasnifi

### 4.1 Canonical ichida (`lib/db`) — 1 ta haqiqiy collision

| SQL nomi | Ta'rif 1 | Ta'rif 2 | Tasnif |
|---|---|---|---|
| `stock_ledger` | `fi-payroll-ext.ts:155` (`stockLedger`, 15 ustun) | `pos-schema-extensions.ts:55` (`posStockLedger`, 9 ustun) | **HAQIQIY collision** — bitta fizik jadvalga ikki xil sxema. Qo'shimcha: `posStockLedger` SQL nomi `stock_ledger`, lekin DB'da `pos_stock_ledger` ham bor → nomlash drifti |

### 4.2 Backend superset ichida (`apps/api/src/shared/db`) — 21+ takroriy nom

Superset bir nechta `schema-*` fragment fayldan yig'ilgan; ko'p jadvallar **bir nechta faylda har xil ustun to'plami bilan qayta ta'riflangan**. `europrint-compat.ts` barreli har bir symbol uchun bittasini "authoritative" qilib tanlaydi (shuning uchun TS xato bermaydi), lekin bu fragmentatsiya.

| SQL nomi | Marta | Joylashuv (var nomi har xil!) |
|---|---|---|
| `attendance` | 4x | `schema-compat-2.ts:30` (`attendance`), `schema-business-c-2-hr-payroll.ts:44` (`hr_attendance`), `schema-misc-app-b.ts:13` (`hrAttendance`), `schema-hr-lms.ts:72` |
| `lms_tests` | 3x | `schema-business-c-1.ts:13`, `schema-compat-4.ts:94`, `schema-misc-app-b.ts:33` |
| `users` | 3x | `schema-compat-1a.ts:16` (`users`), `schema-core.ts:35`, `schema-misc-app-a.ts:19` (`appUsers`) |
| `materials` | 3x | `schema-compat-2.ts:186`, `schema-ext-a-2.ts:127`, `schema-pos-ext.ts:99` |
| `accounting_periods` | 2x | `schema-business-b-1.ts:148`, `schema-finance-extended.ts:43` |
| `salary_history` | 2x | `schema-business-c-2-hr-payroll.ts:14`, `schema-compat-5.ts:42` |
| `leave_requests` | 2x | `schema-compat-2.ts:42`, `schema-misc-app-a.ts:80` |
| `position_permissions` | 2x | `schema-compat-2.ts:62`, `schema-rbac.ts:13` |
| `sales_orders` | 2x | `schema-compat-2.ts:108`, `schema-core.ts:181` |
| `vendors` | 2x | `schema-compat-2.ts:145`, `schema-wms.ts:98` |
| `warehouses` | 2x | `schema-compat-2.ts:157`, `schema-wms.ts:25` |
| `production_orders` | 2x | `schema-compat-3.ts:23`, `schema-manufacturing.ts:64` |
| `courses` | 2x | `schema-compat-4.ts:115`, `schema-ext-a-1.ts:97` |
| `audit_logs` | 2x | `schema-core.ts:88`, `schema-rbac.ts:27` |
| `boms` | 2x | `schema-ext-a-3.ts:17`, `schema-manufacturing.ts:26` |
| `inventory_counts` | 2x | `schema-finance-extended.ts:100`, `schema-pos-ext.ts:43` |
| `invoices` | 2x | `schema-finance-invoicing.ts:20`, `schema-misc-app-b.ts:131` |
| `employees` | 2x | `schema-hr-lms.ts:46`, `schema-misc-app-a.ts:37` |
| `lms_courses` | 2x | `schema-hr-lms.ts:120`, `schema-misc-app-b.ts:41` |
| `lms_enrollments` | 2x | `schema-hr-lms.ts:140`, `schema-misc-app-b.ts:48` |
| `work_centers` | 2x | `schema-manufacturing.ts:131`, `schema-pp.ts:17` |

**Tasnif:** bularning barchasi **HAQIQIY duplikat** (alohida domen-entity emas) — bitta SQL jadval turli fragmentlarda qayta ta'riflangan. Xavf: qaysi ustun to'plami "to'g'ri" ekani barrel tanloviga bog'liq; noto'g'ri import → noto'g'ri ustunlar.

> Yana **9x `(dynamic)`** — parser nom string'ini ajrata olmagan ta'riflar (`schema-ext-c-*`, helper bilan generatsiya qilingan); bular alohida tekshirilishi kerak (`TASDIQLANMAGAN`).

### 4.3 Canonical ∩ Superset — ~150 jadval ikkala yuzada

Mening to'plam taqqosim bo'yicha **~150 SQL nomi** ham `lib/db`da, ham `apps/api`da ta'riflangan. Bu 01-hisobotdagi "ADD-ONLY superset" qarorining bevosita natijasi: `apps/api` canonical jadvallarni mahalliy qayta e'lon qiladi.

**Tasnif:** asosan **ataylab qilingan superset overlap** (legit), lekin **xavf** — ikki yuzadagi ustun to'plamlari farq qilishi mumkin (3.1 `material_card_id` aynan shunga misol). To'liq overlap ro'yxati `03-drift-sets-current.json` → `overlap`.

### 4.4 DB-only quyi-tizimlar (DB'da bor, Drizzle yo'q) — ~87

Eng diqqatga sazovori: **`cc_*` (Communication Center) 17 jadval** live DB'da, lekin Drizzle mapping yo'q (`cc_documents`, `cc_workflow_steps`, `cc_approvals`, `cc_notifications`...). Boshqalar: `approval_workflow*`, `batch_lots`/`batch_lot_movements`, `exchange_rates`, `fiscal_periods`, `stock_moves`, `material_movements`, `posting_entries`, `ai_interviews`/`ai_prompts`/`ai_tasks`.

**Tasnif:** ikki ehtimol — (a) raw SQL orqali ishlatiladi (ORM'siz), yoki (b) butunlay dormant/legacy. `cc_*` uchun 18-hisobot (communication-center) aniqlaydi. To'liq ro'yxat: `03-drift-sets-current.json` → `dbOnly` (parser false-positive'lar bo'lishi mumkin, masalan `material_cards` aslida `mm-material-cards.ts:60`da bor).

---

## 5. Drift matritsasi (yuqori xavfli kichik to'plam)

| Jadval | Drizzle fayl:satr | DB'da? | Drizzle'da? | Drifted ustun(lar) | Runtime xavf |
|---|---|---|---|---|---|
| `material_layer_config` | `mm-material-cards.ts:114` | **Yo'q** | Ha | butun jadval + `material_card_id` | **P0** |
| `current_stock` | `mm-material-cards.ts` | Ha | Ha | kod `material_card_id` so'raydi, DB'da `material_id` | **P1** |
| `procurement_requests`/`_items`/`_approvals` | procurement | **Yo'q** | Ha | butun jadval | **P1** |
| `org_node_portret`, `node_hr_requests` | org-structure | **Yo'q** | Ha | butun jadval | **P1** |
| `stock_ledger` | `fi-payroll-ext.ts:155` + `pos-schema-extensions.ts:55` | Ha | Ha (2x) | ikki xil ustun to'plami | **P1** |
| `payroll_calculations` | (canonical) | Ha | Ha | — (dormant) | P3 |
| `attendance` (superset 4x) | `apps/api/.../schema-*` | Ha | Ha (4x) | har xil ustun to'plamlari | **P2** |

> To'liq 527-ustunlik drift ro'yxati (2026-05-25): `03-drift-report-snapshot-2026-05-25.txt` ("MISSING COLUMNS" bo'limi). To'liq 73-jadval Drizzle-only (2026-05-25): xuddi shu faylda.

---

## 6. Xulosa

Tarixiy drift (2026-05-25: 73 Drizzle-only, 527 ustun) oraliqda **sezilarli kamaygan** — ko'p jadval/ustun DB'ga qo'shilgan. Lekin uchta tizimli muammo saqlanib qolgan: (1) **`material_card_id` vs `material_id`** — live DB'da 0 ta `material_card_id`, kodda 82 fayl uni ishlatadi, hatto bitta faylda JS-prop/SQL-nom ziddiyati (`mm-material-cards.ts:114` vs `:142`); (2) **backend superset fragmentatsiyasi** — 21+ jadval bir nechta `schema-*` faylda har xil ustun bilan qayta ta'riflangan (`attendance` 4x, `users` 3x); (3) **DB-only `cc_*` quyi-tizimi** (17 jadval) ORM mapping'siz. Eng dolzarb: `material_layer_config` va `procurement_*` kabi 10 ta joriy Drizzle-only jadval. Live DB holati 2026-05-25 dump'ga asoslangan — bugungi tasdiq talab qilinadi.

---

## 7. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil | Ta'sir | Tavsiya |
|---|---|---|---|---|---|
| C1 | `material_card_id` kodda, DB'da faqat `material_id` (0 ta material_card_id) | **P0** | `_db_cols.txt` (95 `material_id`, 0 `material_card_id`); `mm-material-cards.ts:114` vs `:142`; 82 fayl `apps/api` | Material so'rovlari runtime'da xato; 12-modulga keng ta'sir | Bitta nom standarti; sxema↔DB ni moslashtirish (migratsiya yoki kod) |
| C2 | `material_layer_config` Drizzle-only va yo'q ustunga FK | **P0** | 2/5-bo'lim; `mm-material-cards.ts:114` | Jadval so'ralsa xato | DB'ga migratsiya yoki kodda o'chirish (qaror) |
| C3 | 10 ta joriy Drizzle-only jadval (procurement_*, org_node_*, hr_*) | **P1** | 2-bo'lim; `03-drift-sets-current.json` | Yangi feature endpoint'lari 5xx berishi mumkin | Migratsiya holatini tekshirish; `db:migrate` ishga tushirish |
| C4 | `stock_ledger` ikki xil ta'rif (canonical) | **P1** | `fi-payroll-ext.ts:155`, `pos-schema-extensions.ts:55` | Sxema ziddiyati | Bitta ta'rif; ikkinchisini nom o'zgartirish |
| C5 | Superset'da 21+ takroriy jadval ta'rifi | **P2** | 4.2-bo'lim (har biri fayl:satr) | Noto'g'ri import → noto'g'ri ustunlar | Fragmentlarni canonical'ga konsolidatsiya |
| C6 | `tenant_id` izchil emas (multi-tenancy) | **P2** | 26 DB jadval; parser 9 Drizzle (cheklangan) | Tenant izolyatsiyasi to'liq emas | To'liq tenant audit (04-hisobot) |
| C7 | `cc_*` (17) va boshqa ~87 DB-only jadval ORM'siz | **P2** | 4.4-bo'lim; `_db_tables.txt` | Mantiq raw SQL'da yashiringan yoki dormant | 18-hisobotda aniqlash; kerakmasligi tasdiqlansa o'chirish |
| C8 | `payroll_calculations` dormant | **P3** | DB+Drizzle bor, 1 kod ref | O'lik sxema | 06-hisobotda qaror |

---

## 8. Ochiq savollar / TASDIQLANMAGAN

- **TASDIQLANMAGAN (live):** Barcha DB faktlari 2026-05-25 dump'iga asoslanadi. Bugungi (2026-06-08) live holatni faqat DB introspeksiya tasdiqlaydi (ulanish yo'q).
- **TASDIQLANMAGAN:** Aniq Drizzle `tenant_id` e'lon qilgan jadvallar soni (parser helper/spread ustunlarni ko'rmaydi).
- **TASDIQLANMAGAN:** `03-drift-sets-current.json` → `dbOnly` ro'yxatida parser o'tkazib yuborgan jadvallar (masalan `material_cards`) false-positive sifatida bo'lishi mumkin. Birламchi ishonchli ro'yxat — `_drift_report_fresh.txt`.
- **Ochiq savol:** `cc_*` jadvallar raw SQL orqali ishlatiladimi yoki to'liq dormantmi? (18-hisobot)
- **Ochiq savol:** `db:migrate` (`@europrint/api run migrate`) joriy Drizzle-only jadvallarni yaratadimi, va u qaysi migratsiya manbasidan (drizzle vs shared/db/migrations) foydalanadi? (07/21-hisobot)
