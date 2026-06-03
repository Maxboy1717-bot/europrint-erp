# YAKUNIY ZANJIR XARITASI — Butun Tizim Ulanish Tahlili (2026-06-02)

**Rol:** 🔵 Tahlilchi / Yakuniy sintez (QAT'IY read-only — kod/DB/commit o'zgartirilmadi; faqat shu hisobot yozildi)
**Manba:** 4 ta tahlilchi hisoboti sintezi + kerak bo'lganda kod/DB spot-check.

| # | Sub-hisobot | Doira |
|---|-------------|-------|
| Z1 | `zanjir1-data-oqim-2026-06-02.md` | Ma'lumot oqimi (6 biznes zanjir) |
| Z2 | `zanjir2-sinxron-data-2026-06-02.md` | Sinxron-data (10 sinxron nuqta) |
| Z3 | `zanjir3-event-tizimi-2026-06-02.md` | Event tizimi (5 mexanizm + outbox) |
| Z4 | `zanjir4-jadval-boglanish-2026-06-02.md` | FK / jadval bog'lanish (183 FK) |

> ⚠️ **Asosiy kontekst:** Jonli `europrint` DB deyarli BO'SH (qurilish bosqichi). Shuning uchun barcha dalil = KOD + DB STRUKTURA, qator soni emas. Bu **struktura/ulanish** masalasi, migratsiya emas.

---

## 0. ENG YUQORI ISHONCHLI XULOSA — 3 ta TAKRORLANGAN topilma

Quyidagi 3 topilma **bir nechta sub-hisobotda mustaqil ravishda tasdiqlandi** — eng yuqori ishonch:

| Takrorlangan topilma | Qayerda tasdiqlangan | Mohiyat |
|----------------------|----------------------|---------|
| **IKKI "ORDER" OLAMI** (`sd_sales_orders` ╳ `sales_orders`) | Z1 §"ikki olam", Z2 #6, Z4 §4.3 | Ikkalasi ham 12 qator, FK YO'Q, hech qachon JOIN bo'lmaydi. SD-buyurtma PP/MES/QC ga o'tmaydi. |
| **`order_id` uuid↔int drift** | Z1 §5 (QC lookup buzuq), Z4 §3 | ~12 `ow_*` hali `uuid`, qolgani `integer` → integer order PK bilan join qilolmaydi. |
| **Payroll → GL bo'shlig'i** | Z1 §6, Z2 #7 (qarama-qarshi!), Z3 §4.2/§7 | Z2 closePeriod→GL ishlaydi DEYDI; Z1+Z3 `hr.payroll.calculated` + `payroll.period.closed` **0-listener** DEYDI. Spot-check pastda. |

**Payroll-GL ziddiyatini hal qilish (spot-check):** Ikkalasi ham TO'G'RI, lekin **ikki xil yo'l haqida**:
- `closePeriod()` → `closure.buildJournal()` → `insertGlJournalLines()` = **to'g'ridan-to'g'ri service yozuvi** (Z2 #7 ✅) — bu ishlaydi.
- `'hr.payroll.calculated'` (calculate bosqichi) va `'payroll.period.closed'` (emit) = **event'lar, 0-listener** (Z1/Z3 ❌) — bular dead.

Ya'ni: oylik **yopilganda** GL ga tushadi (service ichida), lekin **hisoblanganida** chiqgan event hech kimga yetmaydi, va `period.closed` event'iga ham hech kim ulanmagan (Telegram/qo'shimcha posting yo'q). **Asosiy GL posting bor; event-darajadagi fan-out yo'q.**

---

## 1. BUTUN TIZIM ULANISH XARITASI (modul + data + event)

```
                          ┌─────────── OLAM A: SD / Phase-4 (JONLI, ulangan) ───────────┐
                          │                                                              │
  WEBSITE ──WebsiteOrder/ContactEvent──▶ CRM                                            │
                                          │                                              │
  crm_leads ──ConvertLeadToDeal──▶ crm_deals ──MarkDealWon──▶ DealWonEvent              │
                                                                   │                      │
                                              (DealWonListener = STUB, SO yaratmaydi) ⚠️  │
                                                                   ▼                      │
                                          [CreateOrderCommand] ──▶ sd_sales_orders ──OrderCreatedEvent──▶ kanban_* ✅
                                                   │                    │ (outbox: domain_events, 0 qator)
                                                   │                    └─SO_DESIGN/SAMPLE_REQUESTED (string)─▶ ✗ 0-listener ❌
                                                   ▼
                          POST /advance-payment (Moliya roli, QO'LDA) ──▶ avans ≥70%
                                                   │
                                       AdvanceApprovedEvent (CQRS) ◀── YAGONA JONLI KASKAD ✅
                            ┌──────────────────────┼─────────────────────────────────┐
                            ▼                      ▼                                   ▼
              AdvanceApprovedListener(pp)   AdvanceApprovedFanoutListener(sd)    EventBridge→fi.advance.approved
                  unlockPlanning()          (sd_order_departments fan-out)
                                            ├─ mold      → ow_molds            ✅
                                            ├─ design    → ow_tech_cards       ✅
                                            ├─ cliche    → ow_cliches          ✅
                                            ├─ logistics → ow_shipping_requests → ow_deliveries(DELIVERED) ✅
                                            ├─ warehouse → ow_material_requirements ✅
                                            └─ production → DEFERRED (katalog yo'q) ❌
                          └──────────────────────────────────────────────────────────┘
                          │
   ╳━━━━━━━━━━━━━━━ FK YO'Q / JOIN YO'Q / order_id uuid↔int drift ━━━━━━━━━━━━━━━╳
                          │
                          ┌──────────── OLAM B: Legacy PP/MES/QC/WMS (izolyatsiya) ─────┐
                          │                                                              │
  sales_orders ──ReleaseProductionOrder──▶ PpReleasedEvent ──▶ ✗ 0-listener ⚠️         │
       │                                                                                 │
  GoodsIssue ──WmsGoodsIssuedEvent──▶ sales_orders.master_status='in_production' ✅      │
       │                                                                                 │
  MES complete ──MesCompletedEvent──▶ MesCompletedListener(qc) = NO-OP ❌               │
       │                              (QC inspeksiya avto-OCHILMAYDI)                     │
  QC submit (QO'LDA) ──QcPassedEvent──▶ qc-passed.listener: sales_orders.product_id/    │
       │                                quantity O'QIYDI — USTUN YO'Q ❌ (lookup buzuq)  │
       ▼                                                                                 │
  receiveFg ──WmsFgReceivedEvent──▶ WMS FG → Finance ⚠️ (trigger uzilgan)              │
  ow_packaging_records: HECH KIM YOZMAYDI ❌                                            │
                          └──────────────────────────────────────────────────────────┘

  ┌─── OMBOR (POS modul — zavod tableti, nisbatan to'liq) ───┐
  EXTERNAL_IN ─▶ pos_movements(draft→pending) ─▶ moveToQuarantine(karantin)
     ─cron─▶ qc_review ─▶ qcDecision(approved) ─▶ _processCompletedMovement
     ─▶ warehouse_stock + stock_ledger ─▶ INTERNAL_ISSUE(chiqim→sex) ─▶ employee_ledger DEBIT
     ─▶ 'pos.movement.data.completed' (string) ─▶ PosGlAutoListener typed event kutadi ❌ (GL yozilmaydi)
  └──────────────────────────────────────────────────────────┘

  ┌─── MONEY (eng uzuq) ───┐
  POS requisition: submit→approve→fulfill ─▶ 'pos.requisition.*' ─▶ ✗ 0-consumer ❌
  Finance: RecordPayment ─▶ finance_payments + postCustomerPayment → gl_* ─InvoiceFullyPaidEvent─▶ order closed ✅
  Avans to'lovi ─▶ GL YOZILMAYDI ❌    |    KASSIR tushunchasi = kodda YO'Q (0) ❌
  └────────────────────────┘

  ┌─── DOCUMENT (CC) ───┐
  CcSpawnRequested ─▶ cc_documents(draft) ─▶ approval chain (cc_document_workflow_steps) ✅
     ─▶ Kanban: YO'Q ❌  |  arxiv: YO'Q ❌  |  autoSend: PIN bilan bloklangan ⚠️
  └─────────────────────┘

  ┌─── HR ───┐
  employees ──user_id backfill──▶ users ✅  |  org assignment darvozasi ──▶ payroll ✅
  closePeriod ──service──▶ gl_journal_entries ✅   (event 'hr.payroll.calculated'/'period.closed' = 0-listener ❌)
  └──────────┘

  ┌─── DENORMALIZATSIYA (DB TRIGGER ×5, ✅ ishonchli) ───┐
  employees.full_name → 6 jadval | sd_customers.name → 10 | material_cards.xom_ashyo → 5
  vendors → 8 | warehouses → 1
  └─────────────────────────────────────────────────────┘

  ┌─── AI-AGENT EVENT'LARI (~13 ta, 0-listener) ❌ ───┐
  stock.critical, production.delayed, iot.anomaly, crm.hot_leads_found, ... → faqat logger.debug
  └───────────────────────────────────────────────────┘
```

**Markaziy graf yadrosi (Z4 §1):** `employees`(30 FK) + `org_functions`(28) + `users`(27) + `org_departments`(26) = **111 FK / 183 (61%)**. Butun ERP shu 4 jadval atrofida.

---

## 2. ENG KUCHLI ZANJIRLAR (uchidan-uchiga ISHLAYDI)

| Zanjir | Mexanizm | Dalil (sub-hisobot) |
|--------|----------|---------------------|
| ✅ **CRM lead→deal→won→order** | CQRS event zanjiri (LeadConverted/DealWon/OrderCreated), `sd_sales_orders` ga yetadi | Z1 §1, Z3 §2.1 |
| ✅ **AVANS → bo'lim fan-out** (YAGONA jonli isbotlangan uchidan-uchiga kaskad) | `AdvanceApprovedEvent` → fan-out 5/6 bo'lim (mold/design/cliche/logistics/warehouse) + PP unlock | Z1 §1, Z2 #5, Z3 §5.2 |
| ✅ **Buyurtma → Kanban** | `OrderCreatedEvent` (outbox pattern) → `createKanbanForOrder()` | Z2 #6, Z3 §2.1 |
| ✅ **OMBOR kirim→karantin→QC→ombor→chiqim** (POS) | direct call + cron + stok ko'chishi (warehouse_stock/stock_ledger/employee_ledger) | Z1 §2 |
| ✅ **Mijoz to'lovi → GL → order yopilishi** | `postCustomerPayment` → `InvoiceFullyPaidEvent` → order closed | Z1 §3, Z3 §2.1 |
| ✅ **Payroll davr yopilishi → GL** (service yo'li, event yo'li EMAS) | `closePeriod()` → `insertGlJournalLines()` (balansli) | Z2 #7 |
| ✅ **CC hujjat approval chain** | `CcSpawnRequestedEvent` → ko'p bosqichli imzo (org-resolver) | Z1 §4 |
| ✅ **Denormalizatsiya name-sync** (DB trigger ×5) | `trg_*_name_sync` master→nusxalar | Z2 §1, §2.1-2.2 |
| ✅ **HR org-sxema darvozasi** | org-assignmentsiz oylik kiritilmaydi | Z1 §6 |
| ✅ **employees ↔ users** | boot backfill (onModuleInit self-heal) | Z2 #10, Z4 §2.2 |
| ✅ **MES complete → QC + HR360** (kichik kaskad) | `MesCompletedEvent` + `MesToHr360Event` bitta commanddan | Z3 §5.3 |
| ✅ **FK-toza klasterlar** | cc_documents(10 bola), pos_movements(6), LMS, recruitment, warehouse | Z4 §5 |

---

## 3. ENG ZAIF / UZILGAN ZANJIRLAR (data oqmaydi)

| # | Uzilish | Sabab | Ta'sir | Sub-hisobot |
|---|---------|-------|--------|-------------|
| 1 | **`sd_sales_orders` ╳ `sales_orders`** (IKKI OLAM) | FK yo'q, JOIN yo'q | SD-buyurtma hech qachon PP/MES/QC ga o'tmaydi | Z1, Z4 §4.3 |
| 2 | **MES tugadi → QC** | `MesCompletedListener` no-op (faqat log) | Ishlab chiqarishdan keyin QC avto-ochilmaydi | Z1 §5, Z3 §2.1 |
| 3 | **QC o'tdi → FG receipt** | listener `sales_orders.product_id/quantity` o'qiydi — ustun YO'Q (+ uuid↔int drift) | FG receipt yaratilmaydi | Z1 §5, Z4 §3 |
| 4 | **POS chiqim → GL** | `pos.movement.data.completed` (string) ni hech kim publish qilmaydi; listener typed event kutadi | Avto-buxgalteriya yozuvi yo'q | Z1 §2, Z3 §4 |
| 5 | **Oylik → GL/kassir (event yo'li)** | `hr.payroll.calculated` + `payroll.period.closed` = 0-listener | Event-darajadagi fan-out yo'q (Telegram/qo'shimcha posting) | Z1 §6, Z3 §4.2 |
| 6 | **Avans to'lovi → GL** | `confirm-advance-payment` GL yozmaydi | 70% avans buxgalteriyaga tushmaydi | Z1 §3 |
| 7 | **CC approval → Kanban → arxiv** | bog'lanish kodi yo'q | Hujjat CC ichida qoladi | Z1 §4 |
| 8 | **Money so'rov → Kanban → kassir** | bu zanjir kod sifatida MAVJUD EMAS; "kassir" = 0 grep | "Pul so'rovi" oqimi qurilmagan | Z1 §3 |
| 9 | **DealWon → SO avto-yaratish** | `DealWonListener` = STUB (faqat log) | SO qo'lda yaratilishi kerak (Trigger 2 buzuq) | Z3 §2.1, §7 |
| 10 | **SD CreateOrder → Design/Sample** | outbox STRING emit ↔ listener CQRS class — yetib bormaydi | Trigger 3/4 hech qachon ishlamaydi | Z3 §6 |
| 11 | **Design+Lab → TechThreeCheckpoint → Advance** | `DESIGN_AND_LAB_COMPLETED` + `TechThreeCheckpointEvent` 0-publisher | Avtomatik avans-checkpoint zanjiri o'lik (Trigger 5→6) | Z3 §3, §5.1 |
| 12 | **Material ishlab-chiqarish sarfi → qoldiq** | `productionAction` faqat `production_material_balance` ga yozadi; `material_cards.current_stock` kamaymaydi | Bo'limga material berilsa raw-ombor qoldig'i avto-kamaymaydi | Z2 §4.1 |
| 13 | **order → delivery (logistics modul)** | `OrderCreatedDeliveryListener` no-op (payload da manzil yo'q) | Delivery faqat ow_* (OLAM A) da ishlaydi | Z1 §1 |
| 14 | **Qadoqlash** (`ow_packaging_records`) | hech kim yozmaydi | Qadoqlash bosqichi bo'sh | Z1 §5 |
| 15 | **AI-agent event'lari** (~13 ta) | `modules/agents/` ichida `@OnEvent` = 0 | Agentlar bir-birini eshitmaydi | Z3 §4.1 |

---

## 4. SINXRONIZATSIYA HOLATI (manba-ziddiyat / source-of-truth)

| Data | Ziddiyatli jadvallar | Holat | Sub-hisobot |
|------|----------------------|-------|-------------|
| **Material qoldig'i** | `material_cards.current_stock` ⟷ `warehouse_stock` ⟷ `production_material_balance` | ❌ **2 xil chiqim yo'li**: POS yo'li (1+2) kamaytiradi; production yo'li (faqat 3) kamaytirmaydi → DESYNC | Z2 §4.1, §5 |
| **Xodim qarzi/avans** | faqat `payroll_advances` (4 boshqa jadval o'lik: cash_advances/advances/advance_payments/creditor_debts) | ❌ moliya/kassirga ulanmagan; kanonik jadval noaniq | Z2 §4.2, §5 |
| **Jihoz qiymati** | `asset_items.current_value/accumulated_depreciation` ⟷ GL | ⚠️ amortizatsiya kalkulyatori hech qayerga yozmaydi (2/3 sinxron) | Z2 §3.1, §5 |
| **Mijoz** | `sd_customers`(jonli) vs `crmCompanies`(Drizzle ref) vs `customers`(YO'Q) | ❌ uch xil "mijoz" manzili; AI nomavjud `customers` kutadi | Z4 §4.1 |
| **Buyurtma** | `sd_sales_orders`(12) vs `sales_orders`(12) | ❌ ikkalasi 12 qator — kanonik noaniq | Z2 #6, Z4 §4.3 |
| **Material chiqim atomikligi** | `issueStock`/`execAssignAsset` | ⚠️ 3 statement `db.transaction` SIZ → qisman-yozuv desync xavfi | Z2 §3.1, §3.2 |
| **Mijoz/material/vendor nomi (denorm)** | master → ~10 nusxa | ✅ DB trigger bilan HAL QILINGAN | Z2 §2.2 |
| **employees.user_id** | `employees.user_id` ↔ `users.employee_id` | ✅ backfill + self-heal (lekin DB FK EMAS) | Z2 #10, Z4 §2.2 |

**Xulosa:** Yangi event-driven oqimlar + denormalizatsiya triggerlari yaxshi sinxron; lekin **eski/legacy multi-jadval data (material qoldig'i, qarz, jihoz qiymati) ziddiyatli** — kanonik manba aniq emas.

---

## 5. EVENT HOLATI (o'lik event'lar + yetishmayotgan)

**5 ta raqobatlashuvchi event mexanizmi** + 2 ko'prik (`EventBridgeService`, `OutboxPublisher`). Z3 §1.

### 5a. O'lik event'lar — 0-LISTENER (emit bor, eshituvchi yo'q)
- **AI-agent ~13 ta:** `stock.critical`, `production.delayed`, `iot.anomaly`, `crm.hot_leads_found`, `quality.defect_rising`, `security.emergency`, `director.briefing_sent`, `warehouse.roll_low`, `hr.low_performance`, `procurement.delivery_risk`, `finance.fraud_suspected`, `ai.planner.deadline_risk`, `mes.machine.resumed` (Z3 §4.1).
- **Boshqalar:** `hr.payroll.calculated`, `payroll.period.closed`, `employee.created`, `rbac.permission.changed`, `hr.attendance.recorded`, `sales.copilot.pdf_dispatch`, `pos.requisition.*`(5), `lms.certificate.issued`, `lms.course.enrolled`, `MRO_MAINTENANCE_COMPLETED`, `DESIGN_AND_LAB_COMPLETED` (Z3 §4.2).

### 5b. O'lik event'lar — 0-PUBLISHER (listener bor, emit yo'q = dead-letter)
- `TechThreeCheckpointEvent`, `SoDesignRequestedEvent`, `SoSampleRequestedEvent`, `CertificateExpiredEvent`, `CertificateEarnedEvent`, `DesignApprovedEvent`, `LabTestPassedEvent`, `CrmLeadCreatedEvent`/`HrCandidateAddedEvent`/`FinanceInvoiceCreatedEvent` (ai-automation), `SUPPLIER_QUALITY_FAIL` (Z3 §3).

### 5c. Outbox (`domain_events`) holati
- **0 qator** (qurilish bosqichi). Yagona yozuvchi = `create-order.handler`. Publisher har 10s bo'sh aylanadi.
- ⚠️ **Mexanizm nomuvofiqligi (eng nozik xato):** outbox STRING emit qiladi (`'sd.order.design_requested'`), listenerlar CQRS `@EventsHandler(Class)` — yetib bormaydi (Z3 §6). Outbox ishga tushsa ham Design/Sample triggerlari ishlamaydi.

### 5d. Yetishmayotgan event'lar (chiqarilishi kerak edi)
- **Yagona `StockUpdatedEvent`** har balans o'zgarishida (hozir faqat POS `stock-ledger` da; WMS adjust/transfer event chiqarmaydi) — Z3 §7.
- `USER_CREATED`/`ROLE_CHANGED` umuman emit qilinmaydi (audit/sessiya invalidatsiya yo'q).

---

## 6. VIZYON TALAB QILGAN, LEKIN YO'Q ULANISHLAR (egasi vizyoni)

Egasining asosiy vizyon nuqtalari va ularning holati:

| Vizyon | Talab | Hozirgi holat | Yetishmayapti | Sub-hisobot |
|--------|-------|---------------|---------------|-------------|
| **Jihoz 3-joy sinxron** | ombor + xodim profili + moliya(kapital) | 2/3 ✅ (ombor `asset_items` + profil `employee_assets`) | ❌ **moliya/kapital tomoni**: assign'da GL yo'q; amortizatsiya kalkulyatori hech qayerga yozmaydi | Z2 §3.1 |
| **Material 2-joy qisman** (+kg ikki joyda) | raw-ombor qoldig'i + bo'lim ombor, har ikkisi avto | POS yo'li 2 joyni yangilaydi | ❌ **production yo'li qoldiqni kamaytirmaydi** → "+kg ikki joyda" buzuq | Z2 §4.1 |
| **Xodim qarzi 3-joy** | kassir + xodim profili + moliya | 1/3 (faqat `payroll_advances`) | ❌ **kassir YO'Q (0 grep) + moliya GL YO'Q** | Z1 §3, Z2 §4.2 |
| **MES → QC → FG** | ishlab chiqarish → sifat → tayyor mahsulot avto | trigger'lar mavjud lekin uzuq | ❌ **MES→QC no-op + QC→FG buzuq lookup (ustun yo'q + uuid↔int)** | Z1 §5, Z3 §2.1 |
| **Pul zanjiri (kassir)** | so'rov → Kanban tasdiq → kassir → to'lov → GL | qismlar bor (POS requisition, Finance payment→GL) | ❌ **butun "kassir" bosqichi kodda YO'Q; so'rov→Kanban→kassir zanjiri qurilmagan; avans→GL yo'q** | Z1 §3 |
| **Production fan-out** | avans → ishlab chiqarish bo'limi ham | 5/6 bo'lim jonli | ❌ **production bo'lim DEFERRED (line-item + katalog yo'q)** | Z1 §1, Z3 §5.2 |

**Vizyon xulosasi:** Eng katta umumiy yetishmovchilik = **MOLIYA/GL ulanishi** uch joyda yo'q (jihoz→kapital, qarz→moliya, avans→GL, POS chiqim→GL) va **KASSIR** tushunchasi butunlay qurilmagan. Ishlab chiqarish zanjiri (MES→QC→FG) trigger'lar darajasida uzuq.

---

## 7. KEYINGI BAJARISH UCHUN — USTUVOR ULASH RO'YXATI

> ⚠️ Qoida 23: bu **tavsiya ≠ ruxsat**. Ustuvorlik = (a) takrorlangan/yuqori-ishonchli topilma, (b) eng ko'p zanjirni ochadi, (c) kichik o'zgarish katta natija beradi.

### P0 — Order olamlarini birlashtirish (eng ko'p zanjirni ochadi)
1. **`sd_sales_orders` vs `sales_orders` kanonikni hal qilish** (Z1+Z2+Z4 — 3 hisobotda). Bittasini VIEW/o'chirish; ikkalasi 12 qator = sun'iy bo'linish. **Rationale:** bu OLAM A↔OLAM B ko'prigi — buni yopmasdan SD→PP→MES→QC umuman ulanmaydi.
2. **`order_id` uuid→int repoint** qolgan `ow_*` (contracts, order_lines, production_plans, payment_plan_entries, rework_events, samples, surveys, status_history, fg_transfers, pallet_recoveries) + `order_costings` text→int + `sales_invoices` varchar→int (Z4 §3). **Rationale:** QC→FG lookup va FK qo'yish shunga bog'liq.

### P1 — Ishlab chiqarish zanjirini tiklash (MES→QC→FG vizyoni)
3. **MES→QC trigger:** `MesCompletedListener` no-op ni real QC inspeksiya ochishga ulash (Z1 §5, Z3). **Rationale:** ishlab chiqarish→sifat avto-oqimi.
4. **QC→FG lookup tuzatish:** `qc-passed.listener` `sales_orders.product_id/quantity` o'rniga to'g'ri manba (Z1 §5). P0.2 (uuid→int) ga bog'liq. **Rationale:** tayyor mahsulot yaratiladi.

### P2 — Moliya/GL ulanishi (vizyon: 3 joyda yo'q moliya)
5. **Avans to'lovi → GL:** `confirm-advance-payment` GL posting qo'shsin (Z1 §3). **Rationale:** kichik o'zgarish, 70% avans buxgalteriyaga tushadi.
6. **POS chiqim → GL:** `pos.movement.data.completed` ni typed `PosMovementCompletedEvent` ga moslash (yoki listener ni string topic'ga) (Z1 §2, Z3 §4). **Rationale:** mexanizm nomuvofiqligi, kichik tuzatish.
7. **Xodim qarzi → moliya:** `createCashAdvance`/`createFine` ni Finance GL/kassa postingiga ulash (Z2 §4.2). **Rationale:** vizyon 3-joy qarzi.

### P3 — Event mexanizmi nomuvofiqligi
8. **Outbox↔listener nomuvofiqligi:** `create-order.handler` outbox'ga CQRS class nomi yozsin YOKI `@OnEvent('sd.order.design_requested')` adapter (Z3 §6). **Rationale:** Design/Sample triggerlari (3/4) shunsiz hech qachon ishlamaydi.
9. **Stub listenerlarni to'ldirish:** `DealWonListener` (SO yaratish — Trigger 2), `SoDesignRequestedListener`, `SoSampleRequestedListener` (Z3 §3). **Rationale:** DealWon→SO avto-yaratish vizyoni.

### P4 — Sinxron-data atomikligi + manba birlashtirish
10. **Material chiqim ikki yo'lini birlashtirish:** POS `issueStock` + production `productionAction` ni bitta "stock movement" servisiga (Z2 §4.1, tavsiya 2). **Rationale:** "+kg ikki joyda" vizyoni + source-of-truth ziddiyatini yo'qotadi.
11. **Multi-statement yozuvlarni `db.transaction()` ga o'rash:** `issueStock`, `execAssignAsset` (Z2 §3). **Rationale:** desync xavfini yopadi.

### P5 — Strukturaviy himoya + uzoq muddat
12. **FK qo'shish:** `sd_order_departments/sd_invoices/sd_payments.order_id → sd_sales_orders.id`; `sd_sales_orders.customer_id → sd_customers.id`; `employees.manager_id` to'ldirish + FK (Z4 §2, §6).
13. **Kassir moduli + pul-so'rov→Kanban zanjiri:** yangi qurish kerak (Z1 §3) — eng katta yangi ish, oxirida.
14. **AI-agent event'lariga listener** yoki Notification/Director dashboard'ga ulash (Z3 §4.1) — 13 ta event hozir bekorga yo'qoladi.
15. **CC approval → Kanban → arxiv** davomini qo'shish; qadoqlash (`ow_packaging_records`) yozuvchisini yaratish (Z1 §4, §5).

---

*Yakuniy sintez: 2026-06-02 | 🔵 Tahlilchi rejimi | hech narsa o'zgartirilmadi (faqat shu hisobot). Manba: 4 sub-hisobot + payroll-GL ziddiyat spot-check.*
