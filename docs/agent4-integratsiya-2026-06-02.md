# MODULLARARO INTEGRATSIYA — TO'LIQ XARITA (agent4, 2026-06-02)

> **FAQAT TAHLIL — read-only.** Har bog'lanish kod dalili (event/listener/service-call/import) +
> jonli DB (europrint @127.0.0.1:5432) bilan tasdiqlandi. Verify-don't-trust: har da'vo `fayl:satr`.
> Manba hisobotlar o'qildi va KENGAYTIRILDI: `asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`
> (F=integratsiya ~15% degandi), `phase4-order-department-fanout-2026-06-01.md`, `ombor-pos-master-plan.md` §15.

---

## 0. INTEGRATSIYA ARXITEKTURASI — UCH MEXANIZM (asos)

EuroPrint'da hodisa (event) uzatishning **3 ta raqobatlashuvchi mexanizmi** bor — bu integratsiyaning
asosiy murakkabligi va eng katta yashirin uzilish manbai:

1. **CQRS EventBus** (`@nestjs/cqrs`) — `eventBus.publish(new SomeEvent(...))` → `@EventsHandler(SomeEvent)`.
   Sinf-referensi bo'yicha moslashtiradi (nom bo'yicha emas).
2. **EventEmitter2 + ERP_EVENTS** — `eventEmitter.emit(ERP_EVENTS.X, ...)` → `@OnEvent(ERP_EVENTS.X)` (string topik).
3. **EventEmitter2 + xom string** — `eventEmitter.emit('pos.movement.data.completed', ...)`.

**Ko'prik:** `apps/api/src/modules/shared/events/event-bridge.service.ts` — CQRS EventBus'ga obuna bo'lib,
hodisa sinf nomini `EVENT_NAME_MAP` (37 ta yozuv) orqali ERP_EVENTS stringiga aylantirib **qayta emit qiladi**.
⚠️ **MUHIM: ko'prik FAQAT bir tomonlama** (CQRS → EventEmitter2). String emit qilingan hodisa CQRS
`@EventsHandler`'ga YETMAYDI. Bu sabab bir nechta listener "o'lik xat" (dead-letter).

**Raqamlar (kod skanidan):**
- `@EventsHandler(...)` deklaratsiya: **68**
- `@OnEvent(...)` deklaratsiya: **66**
- `eventBus.publish(...)` chaqiruv joyi: **72**
- EventBridge `EVENT_NAME_MAP`: **37** sinf→string moslama

---

## 1. JONLI DB HOLATI (integratsiya jadvallari) — dalil asosi

`node _audit/q.cjs` (faqat SELECT) bilan o'lchandi:

| Jadval | Qator | Ma'no (integratsiya uchun) |
|---|---:|---|
| `sales_orders` (BASE TABLE) | **12** | buyurtmalar bor; QC/tech listenerlar shuni o'qiydi |
| `sd_sales_orders` (**VIEW** over sales_orders) | 12 | Phase 4 fan-out shu view'ni o'qiydi (mos) |
| `sd_order_departments` | **0** | ⚠️ **hech kim bo'lim tanlamagan** → fan-out amalda ishga tushmaydi |
| `domain_events` (outbox) | **0** | ⚠️ hech bir hodisa persist qilinmagan |
| `warehouse_stock` (kanonik stok) | **24** | jonli stok (PosMonitorPage shuni yozadi) |
| `warehouse_transactions` | **0** | ⚠️ POS event-yo'li hech narsa yozmagan (dead-letter isboti) |
| `material_movements` | **3** | ✅ to'g'ridan-to'g'ri controller yo'li YOZGAN (jonli yo'l shu) |
| `gl_posting_log` | **MAVJUD EMAS** | ⚠️ POS GL listener mavjud bo'lmagan jadvalga yozadi |
| `gl_journal_entries` | **0** | ⚠️ hech bir GL yozuv yaratilmagan |
| `cc_documents` | **0** | ⚠️ Kommunikatsiya markazi bo'sh (asl-holat tasdiq) |
| `pos_movements` | **2** | POS harakat (status-yo'li) deyarli ishlatilmagan |
| `kanban_cards` / `kanban_boards` | **2 / 2** | Kanban karta bor |
| `ow_molds`/`ow_tech_cards`/`ow_cliches`/`ow_material_requirements`/`ow_shipping_requests`/`ow_deliveries` | **0** har biri | Phase 4 isbotdan keyin tozalangan (bo'sh) |
| `qc_inspections` | **0** | ⚠️ hech qachon QC tekshiruvi o'tkazilmagan |
| `offboarding_cases` | **3** | ✅ HR offboarding 3 marta ishlagan |
| `employee_inventory_ledger` | **0** | ⚠️ podotchet bo'sh |
| `org_departments` / `employee_org_departments` | **142 / 30** | ✅ org-sxema TO'LIQ to'ldirilgan (eng yaxshi ta'minlangan substrat) |
| `mm_purchase_requisitions` / `pos_material_requests` | **0 / 0** | ⚠️ ikkala P2P so'rov ombori bo'sh |
| `inventory_policy` (ROP config) | **0** | ⚠️ ROP avto-buyurtma uchun siyosat qatori yo'q |

**Asosiy DB xulosa:** integratsiya KODI mavjud, lekin **deyarli hech qaysi zanjir jonli data bilan
oxirigacha o'tmagan** — chunki (a) ba'zi hodisalar hech qachon publish qilinmaydi, (b) jonli stok yo'li
integratsiya hodisasini chiqarmaydi, (c) tetiklovchi config jadvallar (inventory_policy, sd_order_departments) bo'sh.

---

## 2. 11 BOG'LANISH — BIRMA-BIR (kod + DB dalili bilan)

### (1) SAVDO → OMBOR — ✅ ULANGAN (eng kuchli zanjir, lekin UI yo'q + tetik bo'sh)

**Vizyon:** buyurtma → menejer bo'lim tanlaydi → 70% avans → har bo'limga tracked job (fan-out).

**Kod dalili (REAL spine):**
- Tetik: `POST /api/sd/orders/:id/advance-payment` → `sd-orders.controller.ts:190` → `ConfirmAdvancePaymentCommand`.
- `confirm-advance-payment.handler.ts:115` → `eventBus.publish(new AdvanceApprovedEvent(orderId, advancePaid, pct))`.
- Orkestrator: `sd/infrastructure/event-handlers/advance-approved-fanout.listener.ts:19` `@EventsHandler(AdvanceApprovedEvent)`
  → `sd_order_departments` o'qiydi → **5 bo'lim** uchun job yaratadi:
  - `mold` → `createMoldJob` (`ow_molds`), `design` → `ow_tech_cards`, `cliche` → `ow_cliches`,
    `logistics` → `ow_shipping_requests`, `warehouse` → `ow_material_requirements` (listener:41-80).
  - `production` ataylab DEFERRED (line-item+katalog yo'q).
- FE tetik bor: `SDSalesPayments.tsx:162` → `POST /api/sd/orders/:id/advance-payment` (lekin `{ amount: 0 }` hardcode — placeholder).

**Holat:** ✅ **ULANGAN va backend-isbotlangan** (Phase 4 doc: 1 buyurtma/5 bo'lim/1 avans → hammasi job→done).
**Lekin:**
- ⚠️ `sd_order_departments`=0 (DB) → amalda hech kim bo'lim tanlamagan → jonli ishga tushmagan.
- ⚠️ Bo'lim-tanlash UI yo'q: `PATCH /api/sd/orders/:id/departments` va `GET /api/sd/orders/:id/saga` ni
  **hech bir FE sahifa chaqirmaydi** (FE grep: 0 moslik). Fan-out faqat curl bilan sinalgan.
- ⚠️ Avtomatik yuqori-tetik o'lik: `TechThreeCheckpointEvent` (tech 3-checkpoint → avans tekshiruvi → ADVANCE_APPROVED)
  **0 publisher** (`tech-three-checkpoint.listener.ts:20` o'zi "dead-letter" deb yozadi). Ya'ni avans faqat
  qo'lda endpoint orqali tasdiqlanadi.

**Bonus boshi: CRM → SAVDO** ✅ — `crm/mark-deal-won.handler.ts:47` `new DealWonEvent` →
`sd/deal-won.listener.ts:15` → `CreateOrderCommand` → sotuv buyurtmasi avto-yaratiladi. Zanjir boshi real.

---

### (2) OMBOR → TA'MINOT (P2P) — ⚠️ QISMAN (ikki alohida P2P + jonli yo'l uziq)

**Vizyon:** qoldiq kam → AI/avto so'rov → org-sxema tasdiq zanjiri → xarid.

**A. Org-sxema tasdiq zanjiri — ✅ REAL (eng yaxshi qism):**
- `pos/application/services/procurement-approval-chain.service.ts:64` — rekursiv CTE `org_departments.parent_id`
  bo'ylab yuqoriga yuradi, har bosqichda `head_user_id` ni tasdiqlovchi sifatida oladi; requester'ning
  `employee_org_departments`'idan boshlaydi.
- DB: `org_departments`=142, `employee_org_departments`=30 → zanjir **rezolyutsiya qila oladi**.

**B. Avto-reorder (qoldiq→so'rov) — ⚠️ QURILGAN, lekin JONLI YO'LDAN UZIQ:**
- `wms/infrastructure/event-handlers/rop-trigger.handler.ts:98` `@EventsHandler(StockUpdatedEvent)` —
  `inventory_policy.reorder_point` vs `material_cards.current_stock` solishtiradi, dedup qiladi, va
  **`mm_purchase_requisitions` + items INSERT qiladi** (handler:167-180). To'liq, real kod.
- `StockUpdatedEvent` publisher BOR: `pos/application/services/stock-ledger.service.ts:81`.
- ❌ **UZILISH:** jonli stok yo'li (`warehouse-config.service.ts` `issueStock`/`receiveStock`,
  `pos-operations.controller.ts:104,128`) **to'g'ridan-to'g'ri `UPDATE warehouse_stock` + `INSERT material_movements`**
  qiladi va `stockLedger`ni chaqirmaydi / `StockUpdatedEvent` chiqarmaydi (grep: 0). Demak jonli kirim/chiqim
  **ROP tetikni ishga tushirmaydi**. ROP faqat boshqa yo'ldan (`pos-movement-status.service` → `stockLedger`,
  `pos_movements`=2, deyarli ishlatilmaydi) fire bo'ladi.
- ❌ DB: `inventory_policy`=0 (ROP siyosati yo'q) + `mm_purchase_requisitions`=0 → tetik fire bo'lsa ham
  hech narsa topilmaydi.

**C. Ikki P2P fragmentatsiyasi:** ROP `mm_purchase_requisitions` (MM modul) ga yozadi; lekin asl-holat
tasdiqlagan ishlaydigan P2P UI (`/wms/procurement`) `pos_material_requests` (POS modul) ishlatadi. **Ikki
alohida P2P tizimi** — bir-biriga ulanmagan.

**Holat:** ⚠️ **QISMAN** — org-tasdiq zanjiri real; avto-reorder kodi real lekin jonli stok yo'lidan uziq +
config bo'sh + 2 P2P bo'linishi.

---

### (3) KOMMUNIKATSIYA → KANBAN — ❌ UZILGAN (ikki alohida 3-savat, ko'prik yo'q)

**Vizyon:** so'rov/doklad CC ga → CC dan Kanban'ga.

**Kod dalili:**
- CC ichiga kirish: `cc/events/cc-event.listener.ts:41` `@EventsHandler(CcSpawnRequestedEvent)` →
  CC **draft hujjat** yaratadi (Kanban karta EMAS).
- `CcSpawnRequestedEvent` yagona publisher: `cc/presentation/cc-webhook.controller.ts:99`
  `emit('cc.spawn', ...)` — tashqi webhook. **Boshqa hech bir ERP modul CC ga publish qilmaydi**
  (P2P/procurement → CC ulanmagan, master-plan §7.2 talab qiladi).
- ❌ **CC → Kanban ko'prigi YO'Q:** `cc_documents` o'qib `kanban_*` ga yozadigan listener topilmadi
  (grep: 0 moslik).
- Savdo → Kanban (ALOHIDA, real): `kanban/application/event-handlers/order-created-kanban.handler.ts:21`
  `@EventsHandler(OrderCreatedEvent)` → `createKanbanForOrder()` → `kanban-cards.repo.ts:129` real karta INSERT.
  Lekin bu CC'dan KELMAYDI, to'g'ridan SD'dan.

**Holat:** ❌ **UZILGAN.** CC va Kanban — alohida ikki "3-savat" (asl-holat: CC bo'sh qobiq, Kanban 3-savat mock).
DB: `cc_documents`=0. CC↔Kanban hech qanday kod ko'prigi yo'q.

---

### (4) KANBAN → KASSIR — ❌ YO'Q (hech qanday kod ulanishi)

**Vizyon:** Kanban'dagi tasdiq/job → kassirga pul vazifasi (oylik/avans/xarid to'lovi).

**Kod dalili:**
- Kanban event-handlerlar (`order-created-kanban`, `order-cancelled-kanban`) faqat karta yaratadi/yopadi —
  kassir/cash/payroll'ga hech narsa yubormaydi.
- Kassir (`accounting/cash-register`) = chakana POS (asl-holat: noto'g'ri konsept). Hech bir Kanban event
  uni tetiklamaydi (grep: kassir↔kanban 0).
- "Kassir = pul vazifalari hub" vizyoni umuman yo'q (payroll bo'sh, podotchet bo'sh).

**Holat:** ❌ **YO'Q.** Kanban→Kassir oqimi mavjud emas.

---

### (5) KASSIR → OMBOR — ⚠️ QISMAN (jonli yo'l to'g'ridan ishlaydi; event-yo'l O'LIK)

**Vizyon:** kassa/POS harakati → ombor prixod/rasxod (atomik).

**A. Jonli (ishlaydigan) yo'l — ✅ to'g'ridan service-call:**
- `pos-operations.controller.ts:104` `POST warehouses/:id/issue` + `:128 /receive` →
  `warehouse-config.service.ts` `issueStock`/`receiveStock` → atomik `UPDATE warehouse_stock` +
  `INSERT material_movements` (service:113,125,168). DB: `material_movements`=3 → bu yo'l **JONLI ishlagan**.
- Bu PosMonitorPage ishlatadigan kanonik yo'l (asl-holat tasdiq).

**B. Event-yo'l (integratsiya) — ❌ DEAD-LETTER:**
- `PosMovementCompletedEvent` **0 publisher** (grep tasdiq). 3 ta consumer o'lik xat:
  - `pos-wms-sync-completed.listener.ts:24` (warehouse_stock upsert + warehouse_transactions) — o'z faylida
    "no emit site exists today" yozadi. DB: `warehouse_transactions`=0 (isbot).
  - `pos-gl-auto.listener.ts:35` (auto-GL) — o'lik.
  - `pos.events.ts:166` `@OnEvent('pos.movement.data.completed')` (broadcast) — string emit
    (`pos-movement-status.service.ts:86`) faqat shu @OnEvent'ga yetadi, CQRS listenerlarga emas.
- `PosMovementCreatedEvent` esa publish qilinadi (`pos-movement.service.ts:171`) →
  `pos-wms-sync-created.listener.ts` (warehouse_transactions DRAFT). Lekin "created" yo'l ham deyarli
  ishlatilmaydi (pos_movements=2).

**Holat:** ⚠️ **QISMAN** — jonli stok yangilash to'g'ridan-to'g'ri ishlaydi, lekin **bu integratsiya emas,
sinxron service-call**. Event-asosli POS→WMS sinxronizatsiya butunlay o'lik. Natija: stok yangilanadi, lekin
GL/auto-reorder/broadcast tetiklanmaydi.

---

### (6) OMBOR → QC / KARANTIN — ⚠️ QISMAN (QC→ombor real; ombor→QC kirish o'lik)

**Vizyon:** EXTERNAL_IN → karantin → QC 3-qaror → asosiy ombor.

**Kod dalili:**
- QC → ombor (chiqish) — ✅ REAL: `qc/submit-inspection.handler.ts:51` `new QcPassedEvent` →
  `wms/infrastructure/event-handlers/qc-passed.listener.ts:20` → `wmsRepo.receiveFg()`
  (`drizzle-wms.repo.ts:192`) → tayyor mahsulot kirim. Trigger 11.
- QC → ta'minotchi (rad) — ✅ REAL: `new SupplierQualityFailEvent` →
  `mm/supplier-quality-fail.listener.ts:19`.
- ❌ Ombor/Savdo → QC (kirish) **O'LIK:** `SoSampleRequestedEvent` va `SoDesignRequestedEvent`
  **0 publisher** (grep). Demak `qc/so-sample-requested.listener.ts` va `design/so-design-requested.listener.ts`
  dead-letter — buyurtmadan QC namuna / dizayn so'rovi avto-yaratilmaydi.
- POS karantin (`pos.events.ts` `@OnEvent('pos.movement.data.qc_approved/qc_rework/qc_rejected')`,
  `pos.qc.decision`) string-topik bilan ichki POS'da bog'langan, lekin markaziy QC modul
  (`qc_inspections`) bilan ko'prik yo'q.
- DB: `qc_inspections`=0 → QC hech qachon ishga tushmagan.

**Holat:** ⚠️ **QISMAN** — QC→ombor (FG kirim) va QC→ta'minotchi real; lekin ombor karantin → markaziy QC
kirish uzilgan, jonli QC data yo'q.

---

### (7) MES → OMBOR — ⚠️ QISMAN (MES→QC o'rta bo'g'in NO-OP; QC→ombor real)

**Vizyon:** MES ishlab chiqarish → QC → tayyor mahsulot ombori.

**Kod dalili:**
- MES tugashi — ✅ publish: `mes/complete-session.handler.ts:71` `new MesCompletedEvent` (+ `:75`
  `new MesToHr360Event` → HR 360/kapital).
- ❌ **MES → QC bo'g'ini NO-OP:** `qc/mes-completed.listener.ts:28` faqat log qiladi —
  fayl ichida "QC inspection will be opened by PP module callback" (satr:34), lekin
  bunday PP callback **mavjud emas** (`openInspection`/`createInspection` grep pp/mes da 0). Ya'ni MES
  tugashi avtomatik QC tekshiruvini OCHMAYDI.
- QC → ombor (keyingi bo'g'in) — ✅ real (link 6: QcPassed → receiveFg).
- WMS FG kirim → moliya — ✅ `wms/receive-fg.handler.ts:56` `new WmsFgReceivedEvent` →
  `finance/wms-fg-received.listener.ts:14`.

**Holat:** ⚠️ **QISMAN** — uchlari (MES tugadi-publish, QC o'tdi→ombor, WMS FG→moliya) real, lekin
**o'rta bo'g'in (MES→QC tekshiruv ochish) uzilgan** → zanjir avtomatik oqmaydi.

---

### (8) HR → KASSIR / OSHXONA — ❌ asosan YO'Q (offboarding yarim; kassir/oshxona umuman yo'q)

**Vizyon:** kassir = oylik/avans tarqatuvchi; ishdan chiqishda inventar qaytarish→HR access; oshxona.

**Kod dalili:**
- HR → kassir (oylik tarqatish) — ❌ **YO'Q:** `hr/payroll/drizzle-hr-payroll.repo.ts` faqat
  `salaryHistory/payrollPeriods/payrollRows` yozadi; kassir/cash disbursement'ga ulanmaydi (grep 0).
  Kassir hub vizyoni mavjud emas (asl-holat ~10%).
- Oshxona (canteen/kitchen/meal) — ❌ **YO'Q:** modullarda umuman topilmadi (mro hitlari noto'g'ri).
- HR offboarding — ⚠️ **YARIM:** `hr/document-workflow/document-workflow.processor.ts:138-190`
  (`@EventsHandler(DocumentApprovedEvent)`) ishdan-bo'shatish hujjati tasdiqlansa `offboarding_cases` +
  `offboarding_checklist_items` yaratadi va xodim status→'terminated'. DB: `offboarding_cases`=3 (ishlagan).
- ❌ **POS↔HR offboarding bloki (§10.5) YO'Q:** POS `offboarding_cases`/`employees.status`ni o'qib chiqishni
  bloklamaydi (grep pos da 0). Diqqat: `pos/lifecycle-block.service.ts` — bu offboarding EMAS, balki bir xil
  materialni qayta-tez berishni cheklovchi (`min_interval_days`) servis. Ya'ni "qaytarmaguncha access yo'q"
  qoidasi qurilmagan.

**Holat:** ❌ **asosan YO'Q.** Faqat HR-ichki offboarding case yaratish ishlaydi; kassir, oshxona, va
POS↔HR offboarding bloki yo'q.

---

### (9) MOLIYA ← HAMMA (GL) — ⚠️ QISMAN (HR→GL real; POS→GL o'lik+jadval yo'q; fragmentlangan)

**Vizyon:** har harakat → Debit/Credit avtomatik → moliya tasdiqlaydi (AWAITING_REVIEW).

**Kod dalili (GL yozuvchilar bir nechta, lekin ZID):**
- HR payroll → GL — ✅ REAL: `hr/payroll/drizzle-hr-payroll.repo.ts:97` `db.insert(gl_journal_entries)`
  (`insertGlJournalLines`, `payroll-closure.service.ts`dan chaqiriladi). Davr yopilganda GL satr yozadi.
- POS harakat → GL — ❌ O'LIK + JADVAL YO'Q: `pos/pos-gl-auto.listener.ts:35` `gl_posting_log`ga yozadi,
  lekin (a) `PosMovementCompletedEvent` 0 publisher (dead-letter), (b) DB'da **`gl_posting_log` jadvali
  MAVJUD EMAS**. Ikki tomonlama o'lik.
- SD to'lov → buyurtma yopish — ✅ qisman: `finance/invoice.aggregate.ts:200` `new InvoiceFullyPaidEvent` →
  `sd/payment-received.listener.ts:32` (delivered→closed). Bu GL emas, status.
- Logistika → moliya — ✅ `logistics/complete-delivery.handler.ts:22` `new DeliveryCompletedEvent` →
  `finance/delivery-completed.listener.ts:15`.
- Tech-checkpoint → moliya avans — ❌ O'LIK (`tech-three-checkpoint.listener.ts`, 0 publisher).
- ⚠️ **GL fragmentatsiyasi:** HR `gl_journal_entries` ga, POS `gl_posting_log` ga (yo'q), finance repo'lari
  o'z jadvallariga — **yagona GL ledger yo'q**.
- DB: `gl_journal_entries`=0, `gl_posting_log`=MAVJUD EMAS → **hech bir GL yozuv jonli yaratilmagan**.

**Holat:** ⚠️ **QISMAN (zaif)** — HR→GL kodi real (lekin jonli 0); POS→GL o'lik+jadvalsiz; GL fragmentlangan;
"har harakat→GL" markaziy invarianti yo'q.

---

### (10) AI REJALASHTIRISH → OMBOR — ⚠️ QISMAN (AI o'qiydi/hisoblaydi; avto-yozuv uziq)

**Vizyon:** AI BOM + rezerv + qoldiq/sarf bashorati → avto-so'rov / rejalashtirish.

**Kod dalili:**
- `agents/inventory-agent.service.ts` — ✅ O'QIYDI: `warehouse_stock_balance`dan demand forecast,
  `daysUntilOut`, `reorderPoint` hisoblaydi (`checkCriticalStock`, satr:65-81). Bu tahlil/tavsiya.
- AI rulon yozish — ✅ qisman WRITE: `inventory-agent.service.ts:161,214` `INSERT warehouse_rolls` /
  `warehouse_roll_usage` (rulon QR/sarf) — bu AI tool, lekin avto-reorder emas.
- ❌ AI → avto-so'rov uzilishi: AI hisobi → procurement so'rov YARATISHGA bevosita ulanmagan. Avto-reorder
  faqat ROP tetik orqali (`rop-trigger.handler` — link 2), u esa jonli stok yo'lidan uziq.
- ⚠️ DB: `inventory_policy`=0 → ROP/EOQ siyosati yo'q, AI tavsiyasi amaliy tetikka aylanmaydi.

**Holat:** ⚠️ **QISMAN** — AI o'qish/bashorat/rulon-yozish bor; lekin AI→avto-so'rov→ombor yopiq halqasi yo'q.

---

### (11) ORG-SXEMA → HAMMA — ✅ ULANGAN (eng yaxshi ta'minlangan integratsiya)

**Vizyon:** rahbar quyi bo'limlarni, direktor hammasini; tasdiq zanjiri org-sxema bo'yicha.

**Kod dalili:**
- P2P tasdiq zanjiri — ✅ REAL: `procurement-approval-chain.service.ts:64` rekursiv CTE
  `org_departments` (parent_id/head_user_id/level) bo'ylab tasdiqlovchilarni rezolyutsiya qiladi;
  `employee_org_departments`dan requester bo'limini oladi (link 2A).
- SD/dashboard/quotations ham `org_departments`ni o'qiydi (grep: `sd-dashboard.repository.ts`,
  `sd-quotations.repository.ts`, `sales.service.ts`).
- DB: `org_departments`=142, `employee_org_departments`=30 → **to'liq to'ldirilgan**, ierarxiya real.

**Holat:** ✅ **ULANGAN** — org-sxema integratsiya substrati sifatida ishlaydi (asosan tasdiq-marshrutlash uchun).
Kengaytirish kerak: ruxsat (row-scope) hamma modulda emas; org→Kanban maxfiylik isbotlanmagan (asl-holat).

---

## 3. INTEGRATSIYA XARITASI (ASCII)

```
                          [CRM]
                  mark-deal-won.handler
                   new DealWonEvent ──┬───────────────► [Notifications] deal-won-notif ✅
                                      └──► [SD] deal-won.listener → CreateOrderCommand ✅
                                                     │
                                          create-order.handler
                                          new OrderCreatedEvent ──┬──► [Kanban] order-created-kanban → karta INSERT ✅
                                                                  ├──► [Logistics] order-created-delivery ✅
                                                                  └──► [Notifications] order-created-notif ✅
   POST /sd/orders/:id/advance-payment (FE: SDSalesPayments ✅, amount:0 placeholder)
        confirm-advance-payment.handler
        new AdvanceApprovedEvent ──► [SD] advance-approved-fanout.listener  ✅ (5 dept)
             │                          ├ mold → ow_molds
             │  (DB sd_order_depts=0    ├ design → ow_tech_cards
             │   → amalda fire bo'lmaydi)├ cliche → ow_cliches
             │                          ├ logistics → ow_shipping_requests
             │                          └ warehouse → ow_material_requirements
             │                              │
             │                    ow_* ◄────┴──── [order-workflow] GET /saga-status  ✅ (FE: OrderWorkflowPage)
             │                                    (2-saga split: /sd/orders/:id/saga FE'siz ❌)
             └◄─✗─ TechThreeCheckpointEvent (0 publisher, DEAD-LETTER) ── avtomatik tetik yo'q

   [POS Monitor] ─── jonli yo'l (sinxron) ───► warehouse_stock + material_movements(=3) ✅
        pos-operations issue/receive → warehouse-config.service
        ✗ StockUpdatedEvent CHIQARMAYDI → ROP tetik fire bo'lmaydi
   [POS] pos-movement-status (pos_movements=2, kam) → stockLedger
        new StockUpdatedEvent ──► [WMS] rop-trigger.handler → mm_purchase_requisitions INSERT ✅
                                     (DB: inventory_policy=0, mm_req=0 → amalda hech narsa)

   [MES] complete-session  new MesCompletedEvent ──► [QC] mes-completed.listener  ⚠️ NO-OP (faqat log)
                           new MesToHr360Event   ──► [HR] mes-completed.listener ✅
   [QC] submit-inspection  new QcPassedEvent ──► [WMS] qc-passed.listener → receiveFg ✅
                           new QcFailedEvent ──► [Notifications] ✅
                           new SupplierQualityFailEvent ──► [MM] ✅
        ✗ SoSampleRequestedEvent / SoDesignRequestedEvent (0 publisher) → SD→QC/Design kirish DEAD

   [HR] document-workflow (DocumentApproved) → offboarding_cases(=3) ✅
        ✗ POS offboarding_cases'ni O'QIMAYDI → access-block YO'Q
   [HR] payroll-closure → gl_journal_entries INSERT ✅ (DB=0)
   [POS] pos-gl-auto.listener → gl_posting_log ✗ (0 publisher + JADVAL YO'Q)

   [CC] cc-event.listener (CcSpawnRequested) → cc_documents draft ✅ (DB=0)
        publisher: faqat cc-webhook.controller (tashqi) ; boshqa modul → CC YO'Q
        ✗ CC → Kanban ko'prigi YO'Q

   [Org-sxema] org_departments(142)/employee_org_departments(30)
        └──► procurement-approval-chain (rekursiv CTE) ✅  ; SD repos ✅
```

---

## 4. ENG KATTA UZILISHLAR (ustuvorlik bo'yicha)

| # | Uzilish | Dalil | Ta'sir |
|---|---|---|---|
| U1 | **CC ↔ Kanban ko'prigi umuman yo'q** | grep: cc_documents→kanban 0; ikki alohida 3-savat | Vizyon yuragi (link 3+4) yo'q |
| U2 | **Kanban → Kassir oqimi yo'q** | grep 0; kassir=retail POS | Pul-vazifa hub (link 4) yo'q |
| U3 | **Jonli stok yo'li integratsiya hodisasini chiqarmaydi** | warehouse-config.service `StockUpdatedEvent` emas; material_movements=3 vs warehouse_transactions=0 | ROP/GL/broadcast tetiklanmaydi (link 2,5,9) |
| U4 | **3 ta kritik hodisa 0-publisher (dead-letter)** | PosMovementCompleted, TechThreeCheckpoint, SoSample/SoDesign | POS-GL, avto-avans, SD→QC/Design o'lik |
| U5 | **MES→QC o'rta bo'g'in NO-OP** | qc/mes-completed.listener:34 "PP callback" yo'q | MES→QC→ombor avtomatik oqmaydi (link 7) |
| U6 | **GL fragmentlangan + jonli 0** | HR=gl_journal_entries, POS=gl_posting_log(yo'q); ikkalasi 0 | "har harakat→GL" invarianti yo'q (link 9) |
| U7 | **Phase 4 fan-out UI'siz + tetik bo'sh** | /departments,/saga FE'siz; sd_order_departments=0; amount:0 | Eng kuchli backend zanjir foydalanuvchiga ulanmagan (link 1) |
| U8 | **2 P2P tizimi** | mm_purchase_requisitions (ROP) vs pos_material_requests (UI) | Avto-reorder ↔ qo'lda P2P ajralgan (link 2) |
| U9 | **POS↔HR offboarding bloki yo'q** | POS offboarding_cases o'qimaydi | §10.5 (link 8) yo'q |

---

## 5. NIMA ISHLAYDI (kuchli tomonlar)

1. **CRM→SD→Kanban+Logistics+Notif** — DealWon → order → 3 consumer. To'liq event-fan, real INSERT. ✅
2. **Phase 4 Savdo→ombor fan-out** — advance → 5 bo'lim job. Backend isbotlangan (lekin tetik bo'sh, UI yo'q). ✅
3. **Org-sxema tasdiq zanjiri** — rekursiv CTE, DB to'liq (142/30). ✅
4. **QC→ombor (FG kirim) + QC→ta'minotchi** — QcPassed→receiveFg, SupplierFail→MM. ✅
5. **POS→ombor jonli stok** (sinxron service-call, event emas) — material_movements=3. ✅
6. **EventBridge infratuzilmasi** — 37 hodisa CQRS→string ko'prigi mavjud (lekin bir tomonlama). ✅

---

## 6. XULOSA — NECHA % INTEGRATSIYALASHGAN

**Hisoblash metodi:** 11 vizyon-bog'lanish, har biri kod+DB dalili bilan baholandi
(ULANGAN=1.0, QISMAN=0.5, YO'Q/UZILGAN=0).

| # | Bog'lanish | Ball | Holat |
|---|---|---:|---|
| 1 | Savdo→Ombor (fan-out) | 0.75 | ✅ backend real; UI yo'q + tetik bo'sh |
| 2 | Ombor→P2P | 0.5 | ⚠️ org-tasdiq real; avto-reorder uziq + config bo'sh |
| 3 | CC→Kanban | 0.0 | ❌ ko'prik yo'q |
| 4 | Kanban→Kassir | 0.0 | ❌ yo'q |
| 5 | Kassir→Ombor | 0.5 | ⚠️ jonli sinxron yo'l; event-yo'l o'lik |
| 6 | Ombor→QC/Karantin | 0.5 | ⚠️ QC→ombor real; ombor→QC kirish o'lik |
| 7 | MES→Ombor | 0.5 | ⚠️ uchlari real; MES→QC o'rta bo'g'in no-op |
| 8 | HR→Kassir/Oshxona | 0.1 | ❌ offboarding case faqat; kassir/oshxona/blok yo'q |
| 9 | Moliya←GL | 0.4 | ⚠️ HR→GL real; POS→GL o'lik; fragmentlangan; jonli 0 |
| 10 | AI→Ombor | 0.4 | ⚠️ o'qish/bashorat real; avto-yozuv halqasi yo'q |
| 11 | Org-sxema→Hamma | 0.9 | ✅ tasdiq-marshrut real, DB to'liq |
| | **JAMI** | **5.05 / 11** | |

# 🎯 UMUMIY INTEGRATSIYA: ~46% (kod-darajada qurilgan), lekin JONLI-OQIM ~15–20%

**Ikki xil raqam, ikkalasi ham to'g'ri:**
- **Kod-darajada ~46%** — event/listener/service-call infratuzilmasi yarmidan ko'pi mavjud va to'g'ri yozilgan
  (68 @EventsHandler, real fan-out, real CTE tasdiq-zanjir, QC→ombor).
- **Jonli-oqim ~15–20%** (asl-holat F=15% bilan mos) — chunki kodning katta qismi:
  (a) **dead-letter** (publisher yo'q: 4+ kritik hodisa),
  (b) **jonli yo'ldan uziq** (warehouse-config StockUpdated chiqarmaydi),
  (c) **tetik/config bo'sh** (sd_order_departments=0, inventory_policy=0, cc_documents=0),
  (d) **UI'siz** (Phase 4 saga/departments FE'siz).

**Asosiy diagnoz (egasi "ballonsiz mashina" sababi, integratsiya nuqtai nazaridan):** Integratsiya
zanjirlari **alohida bo'g'inlar sifatida qurilgan, lekin uchlari ulanmagan** — eng kuchli backend spine
(Savdo→fan-out, org-tasdiq) foydalanuvchi UI'siga ulanmagan; jonli operatsion yo'llar (POS stok)
integratsiya hodisalarini chiqarmasligi tufayli quyi modullarni (GL, auto-reorder) tetiklamaydi; va CC↔Kanban,
Kanban↔Kassir kabi vizyon-yuragi bog'lanishlar umuman yo'q. Ya'ni dvigatel qismlar tayyor, lekin
**transmissiya (oqim)** ulanmagan.

**Tavsiya (egasi rejasi uchun, ustuvorlik):**
1. Jonli stok yo'lini (`warehouse-config.service`) `StockUpdatedEvent` chiqaradigan qilish → ROP+GL jonlanadi (U3).
2. Phase 4 fan-out'ga bo'lim-tanlash + saga UI ulash + tetikni `sd_order_departments`ga to'ldirish (U7).
3. `gl_posting_log` jadvalini yaratish + POS GL'ni `PosMovementCompletedEvent` publish qilib jonlantirish, GL ledger'ni birlashtirish (U4,U6).
4. CC→Kanban ko'prigi (CcDocument tasdiqlangach Kanban karta) + boshqa modullardan CC'ga publish (U1).
5. MES→QC avto-inspection ochish (PP callback yoki to'g'ridan QcOpenInspection) (U5).
6. Kassir konseptini qayta belgilash → Kanban→Kassir + HR→Kassir pul-vazifa hub (U2, link 8).

---

*Tahlil 2026-06-02 — agent4-integratsiya. Kod (Read/Grep) + jonli DB (node _audit/q.cjs, SELECT) +
mavjud hisobotlar. Hech narsa o'zgartirilmadi (read-only). Brauzer ishlatilmadi — barcha da'volar
kod+DB dalili bilan; UI holati uchun asl-holat-2026-06-02 hisobotiga tayanildi.*
