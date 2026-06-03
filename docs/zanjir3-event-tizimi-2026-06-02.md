# Zanjir-3: Event (Voqea) Tizimi To'liq Tahlili — 2026-06-02

> ROL: 🔵 **Tahlilchi (qat'iy read-only)** — hech qanday kod/DB/commit o'zgartirilmadi.
> Manba: `apps/api/src` statik tahlili + `domain_events` jadval row-count (DB read-only).
> Maqsad: 7 savol — mexanizmlar, publisher→listener xaritasi, o'lik voqealar, kaskadlar, outbox, yetishmayotgan voqealar.

---

## 0. Qisqacha xulosa (TL;DR)

EuroPrint'da **5 ta raqobatlashuvchi event mexanizmi** birga yashaydi (oldingi audit "3 ta" degan edi — aslida ko'proq). Ularni bog'lash uchun **`EventBridgeService`** (CQRS → EventEmitter2) va **`OutboxPublisher`** (jadval → EventEmitter2) "yamoq" vazifasini bajaradi. Tizim yarmi ko'chirilgan migratsiya holatida (`PA2-18 Wave 1-6`).

Asosiy muammolar:
- **`domain_events` (outbox) jadvali = 0 qator** — yagona yozuvchi (`create-order.handler`) hali real ishlatilmagan (DB qurilish bosqichida); publisher har 10 soniyada bo'sh aylanadi.
- **20-trigger biznes zanjirining katta qismi UZILGAN**: Trigger 2 (DealWon→SO), Trigger 3/4 (Design/Sample so'rovi), Trigger 5→6 ulanishi.
- **~13 ta AI-agent voqeasi — 0-listener** (hech kim eshitmaydi, faqat log).
- **Kamida 8 ta canonical CQRS listener — 0-publisher** (dead-letter, hech kim emit qilmaydi).
- **Mexanizm nomuvofiqligi**: outbox STRING-topic emit qiladi, lekin listenerlar CQRS `@EventsHandler(Class)` — ular bir-birini eshitmaydi.

---

## 1. Mexanizmlar ro'yxati (5 ta + 2 ko'prik)

| # | Mexanizm | API | Misol | Kim eshitadi |
|---|----------|-----|-------|--------------|
| 1 | **CQRS EventBus** (`@nestjs/cqrs`) | `eventBus.publish(new XEvent())` | `mark-deal-won.handler.ts:47` | `@EventsHandler(XEvent)` |
| 2 | **EventEmitter2 — ERP_EVENTS namespace** | `emitter.emit(ERP_EVENTS.X, p)` | `ecommerce.service.ts:210` | `@OnEvent(ERP_EVENTS.X)` |
| 3 | **EventEmitter2 — xom string topic** | `emitter.emit('pos.movement.data.created', p)` | `pos-movement.service.ts:170` | `@OnEvent('...')` |
| 4 | **Outbox jadval** (`domain_events`) | `outboxRepo.insertBatch(rows, tx)` | `create-order.handler.ts:102` | `OutboxPublisher` → EventEmitter2 |
| 5 | **Agent EventBus** (`AgentEventBusService`) | `bus.emit(name, p, source)` | `inventory-agent.service.ts:90` | (hech kim — pastga qarang) |
| + | **Socket.IO Gateway emit** | `server.to(room).emit(ev, d)` | `chat.gateway.ts`, `mes.gateway.ts` | Frontend WS klientlari (real-time UI, event-bus EMAS) |

**2 ta ko'prik (yamoq qatlami):**
- **`EventBridgeService`** (`modules/shared/events/event-bridge.service.ts`) — CQRS EventBus'ga subscribe bo'lib, `EVENT_NAME_MAP` (class nomi → ERP_EVENTS string) bo'yicha qaytadan EventEmitter2'ga emit qiladi. **Sababi (fayl izohi, qator 5-9):** "uchta raqobatlashuvchi mexanizm bor; ko'prik bo'lmasa cross-mechanism trigger juftliklari jimgina yo'qoladi". ~35 ta map yozuvi.
- **`OutboxPublisher`** (`modules/shared/outbox/outbox-publisher.service.ts`) — har 10 soniyada `domain_events`'dan o'qib, `event_name` string'i bilan EventEmitter2'ga emit qiladi.

> ⚠️ **Diqqat**: Agent EventBus (#5) shunchaki EventEmitter2 wrapper — texnik jihatdan #2/#3 ustida ishlaydi, lekin alohida API/maqsad. Socket.IO emit'lar real-time UI uchun, server ichidagi event-bus tizimiga aralashmaydi (alohida sanaladi).

---

## 2. Publisher → Listener xaritasi (asosiy voqealar)

### 2.1 CQRS EventBus voqealari (publisher BOR + listener BOR)

| Event (class) | Publisher (fayl:qator) | Listener(lar) | Holat |
|---------------|------------------------|---------------|-------|
| `DealWonEvent` | `crm/.../mark-deal-won.handler.ts:47` | `DealWonListener` (crm) + `DealWonNotificationListener` (notif) | ⚠️ listener **STUB** (faqat log, SO yaratmaydi) |
| `LeadConvertedEvent` | `crm/.../convert-lead-to-deal.handler.ts:74` | `LeadConvertedCustomerListener` | ✅ ulangan |
| `OrderCreatedEvent` | `sd/.../create-order.handler.ts:144` | `OrderCreatedKanbanHandler` + `OrderCreatedNotificationListener` | ✅ ulangan |
| `OrderCancelledEvent` | (kanban command) | `OrderCancelledKanbanHandler` | ✅ |
| `QcPassedEvent` | `qc/.../submit-inspection.handler.ts:51` (+aggregate) | `QcPassedListener` (wms) | ✅ |
| `QcFailedEvent` | `qc/.../submit-inspection.handler.ts:54` | `QcFailedNotificationListener` | ✅ |
| `WmsFgReceivedEvent` | `wms/.../receive-fg.handler.ts:56` | `WmsFgReceivedListener` (finance) | ✅ |
| `WmsGoodsIssuedEvent` | `wms/.../goods-issue.handler.ts:80` | `WmsGoodsIssuedListener` (pp) | ✅ |
| `MesCompletedEvent` | `mes/.../complete-session.handler.ts:71` | `MesCompletedListener` (qc) | ✅ |
| `MesToHr360Event` | `mes/.../complete-session.handler.ts:75` | `MesTo360Listener` (hr) | ✅ |
| `PpReleasedEvent` | `pp/.../release-production-order.handler.ts:49` | (EventBridge → `pp.order.released` string; @OnEvent topilmadi) | ⚠️ 0-listener |
| `DeliveryCompletedEvent` | `logistics/.../complete-delivery.handler.ts:22` | `DeliveryCompletedListener` (finance) | ✅ |
| `MroMaintenanceStopEvent` | `mro/.../stop-machine.handler.ts:23` | `MroStopListener` (pp) + `MroMachineStoppedNotificationListener` | ✅ |
| `StockUpdatedEvent` | `pos/.../stock-ledger.service.ts:81` | `RopTriggerHandler` (wms) | ✅ |
| `AdvanceApprovedEvent` | `sd/.../confirm-advance-payment.handler.ts:115` **+** `finance/.../tech-three-checkpoint.listener.ts:91` | `AdvanceApprovedListener` (pp) **+** `AdvanceApprovedFanoutListener` (sd) | ✅ **2 publisher / 2 listener** |
| `AnomalyDetectedEvent` | `iot/.../record-sensor-reading.handler.ts:32` | `AnomalyDetectedHandler` (iot) | ✅ |
| `SosAlertRaisedEvent` | `iot/.../iot-tablet.service.ts:139` | (EventBridge → `iot.sos.raised`) | ⚠️ tekshirish kerak |
| `WebsiteOrderCreatedEvent` | `ecommerce.service.ts:209` | `WebsiteOrderLeadListener` (crm) | ✅ |
| `WebsiteContactSubmittedEvent` | `ecommerce.service.ts:229` | `WebsiteContactLeadListener` (crm) | ✅ |
| HITL `Approval*`/`Hitl*Event` | `director/.../*.handler.ts` | (director infra) | ✅ |
| `OrderStatusChangedEvent` | `order-workflow/.../*.handler.ts:93,92` | EventBridge → `ORDER_STATUS_CHANGED` | ⚠️ |

### 2.2 EventEmitter2 string/namespace voqealari (HR/POS — eng zich)

- **HR**: `document-workflow.service.ts`, `daily-report.service.ts`, `shift.service.ts`, `skills-matrix.service.ts`, `career-path.service.ts`, `reception.service.ts`, `ai-interview-v2.service.ts` → `HrV2Events.*` emit qiladi → `telegram-bots.service.ts`, `telegram-bots-pip-events.service.ts`, `attendance-bot.service.ts`, `learning-bot.service.ts` `@OnEvent(HrV2Events.*)` eshitadi. ✅ **Eng yaxshi ulangan domen.**
- **POS**: `pos-movement.service.ts`, `pos-request.service.ts`, `pos-movement-status.service.ts`, `stock-ledger.service.ts` → `'pos.movement.data.*'`, `'pos.request.*'`, `'pos.stock.low_alert'` → `pos.events.ts`, `pos-secondary-events.handler.ts` `@OnEvent` eshitadi. ✅ ulangan.
- **AI-Sales copilot**: `sales-copilot.service.ts` → `'sales.copilot.auto_price'`, `'...director_approval_required'` → `ai-alerts.service.ts` `@OnEvent`. ✅ qisman ulangan (`pdf_dispatch` listener YO'Q).
- **AI-MES monitor**: `mes-monitor.service.ts` → `'mes.machine.emergency_stop'`, `'...anomaly_alert'` → `ai-alerts.service.ts`. ✅ (`'mes.machine.resumed'` listener YO'Q).

---

## 3. O'lik voqealar — 0-publisher (listener bor, emit YO'Q)

Bu listenerlar tizimga ulangan, lekin hech kim ularni emit qilmaydi → **dead-letter** (kod izohlarida ham "same dead-letter state" deb yozilgan):

| Listener | Kutilayotgan event | Dalil |
|----------|--------------------|-------|
| `TechThreeCheckpointListener` (finance) | `TechThreeCheckpointEvent` | `new TechThreeCheckpoint...` = **0 marta**; fayl izohi qator 20-24: "No production code currently publishes this event". **Bu zanjirni uzadi** (3.1-bo'limga qarang). |
| `SoDesignRequestedListener` (design) | `SoDesignRequestedEvent` (CQRS class) | `new SoDesignRequestedEvent` = **0**; listener tanasi faqat `logger.log` (stub). |
| `SoSampleRequestedListener` (qc) | `SoSampleRequestedEvent` (CQRS class) | `new SoSampleRequestedEvent` = **0**; stub. |
| `CertificateExpiredEvent` listenerlari (lms/notif/mes) | `CertificateExpiredEvent` | aggregate'da `new CertificateExpiredEvent` bor (`certificate.aggregate.ts:57`), lekin aggregate hech qachon save/emit qilinmaydi → amalda dead-letter (izoh: "no-op until publisher wired"). |
| `CertificateEarnedListener` (skills-matrix) | `CertificateEarnedEvent` | publisher topilmadi; EventBridge'da "defensively bridged" deb belgilangan. |
| `CrmLeadCreatedEvent` / `HrCandidateAddedEvent` / `FinanceInvoiceCreatedEvent` (ai-automation) | mos CQRS class | EventBridge izohi (qator 63): "all three are dead-letter today, kept defensively". |
| `DesignApprovedEvent` / `LabTestPassedEvent` listenerlari (pp) | mos class | `new DesignApprovedEvent` / `new LabTestPassedEvent` = **0** → Trigger 5 manbasi ishlamaydi. |
| `SupplierQualityFailListener` (mm) | `SUPPLIER_QUALITY_FAIL` | publisher yo'q (qc submit-inspection bunaqa emit qilmaydi). |

---

## 4. O'lik voqealar — 0-listener (emit bor, eshituvchi YO'Q)

### 4.1 AI-Agent voqealari — TO'LIQ 0-listener (~13 ta)
`modules/agents/` ichida `@OnEvent` **umuman yo'q** (grep = 0). Quyidagilar emit qilinadi-yu, hech kim eshitmaydi (faqat `logger.debug`):

`stock.critical`, `production.delayed`, `iot.anomaly`, `crm.hot_leads_found`, `quality.defect_rising`, `security.emergency`, `director.briefing_sent`, `warehouse.roll_low`, `hr.low_performance`, `procurement.delivery_risk`, `finance.fraud_suspected`, `ai.planner.deadline_risk`, `mes.machine.resumed`.

> Bu "fire-and-forget" naqsh — agentlar bir-birini eshitishi kerak edi (fayl izohi: "barcha agentlar shu servis orqali muloqot qiladi"), lekin amalda muloqot YO'Q.

### 4.2 Boshqa 0-listener emitlar
| Emit | Joy | Listener |
|------|-----|----------|
| `'sales.copilot.pdf_dispatch'` | `sales-copilot.service.ts:240` | YO'Q |
| `'rbac.permission.changed'` | `position-permissions.service.ts:49` | YO'Q |
| `'hr.attendance.recorded'` | `record-attendance.handler.ts:48` | YO'Q |
| `'hr.payroll.calculated'` | `calculate-payroll.handler.ts:95` | YO'Q |
| `'payroll.period.closed'` | `payroll.service.ts:93` | YO'Q |
| `'employee.created'` | `employees.service.ts:172` | YO'Q |
| `'pos.requisition.*'` (5 ta) | `pos-requisition-workflow.service.ts` | YO'Q (`pos-secondary` faqat `pos.request.*` eshitadi) |
| `'lms.certificate.issued'`, `'lms.course.enrolled'` | `issue-certificate`/`enroll-course.handler` | YO'Q |
| `ERP_EVENTS.MRO_MAINTENANCE_COMPLETED` | `complete-maintenance.handler.ts:58` | YO'Q |
| `ERP_EVENTS.DESIGN_AND_LAB_COMPLETED` | `design-lab-join.service.ts:66` | YO'Q (zanjir 3.1) |

---

## 5. Event kaskadlari (event → event → event)

### 5.1 Maqsadli "20-trigger" zanjiri (ARCHITECTURE.md §10) va UZILISH nuqtalari

```
CRM DealWon ─(CQRS)→ DealWonListener  ✗ STUB (SO yaratmaydi)        ← UZILGAN [Trigger 2]
SD CreateOrder ─(outbox: SO_DESIGN_REQUESTED string)→ ✗ @OnEvent yo'q ← UZILGAN [Trigger 3]
SD CreateOrder ─(outbox: SO_SAMPLE_REQUESTED string)→ ✗ @OnEvent yo'q ← UZILGAN [Trigger 4]
Design✅ + Lab✅ ─→ DesignLabJoinService.emit(DESIGN_AND_LAB_COMPLETED) ─→ ✗ listener yo'q ← UZILGAN [Trigger 5 chiqishi]
   (manbasi DesignApprovedEvent/LabTestPassedEvent ham 0-publisher)
[kerak]: DESIGN_AND_LAB_COMPLETED → emit TechThreeCheckpointEvent ─→ ✗ hech kim publish qilmaydi ← UZILGAN [Trigger 6 kirishi]
TechThreeCheckpointListener ─(CQRS)→ AdvanceApprovedEvent  ✅ (lekin trigger hech qachon ishga tushmaydi)
```

### 5.2 ISHLAYDIGAN yagona to'liq kaskad — Avans fan-out (Phase 4, 2026-06-01)

Bu **yagona uchidan-uchiga jonli isbotlangan** kaskad (memory: `session_2026-06-01_phase4_fanout`):

```
SD ConfirmAdvancePayment (>=70%)
   └─(CQRS) eventBus.publish(AdvanceApprovedEvent)        confirm-advance-payment.handler.ts:115
         ├─→ AdvanceApprovedListener (pp)        → ppRepo.unlockPlanning()          [Trigger 7] ✅
         ├─→ AdvanceApprovedFanoutListener (sd)  → har bo'limga job + markStatus('started')
         │      ├─ mold     → createMoldJob()            (ow_molds)
         │      ├─ design   → createDesignJob()          (ow_tech_cards)
         │      ├─ cliche   → createClicheJob()          (ow_cliches)
         │      ├─ logistics→ createShippingRequestJob() (ow_shipping_requests)
         │      ├─ warehouse→ createMaterialRequirementJob() (ow_material_requirements)
         │      └─ production→ (DEFERRED — katalog yo'q)
         └─→ (EventBridge) re-emit fi.advance.approved (string consumerlar uchun)
```
> Eslatma: `tech-three-checkpoint.listener` ham `AdvanceApprovedEvent` publish qiladi — ya'ni 2 ta kirish nuqtasi. Lekin u dead (3.1) — shuning uchun amalda faqat `confirm-advance-payment` yo'li ishlaydi.

### 5.3 Boshqa real (kichik) kaskadlar
- **MES complete** → `MesCompletedEvent` (→ QC) **+** `MesToHr360Event` (→ HR 360) — bitta commanddan 2 event. ✅
- **QC submit** → `QcPassedEvent` (→ WMS) yoki `QcFailedEvent` (→ notif). ✅
- **POS movement created** → `'pos.movement.data.created'` → WMS-sync + GL-auto listenerlar. ✅
- **Absence cron** → `employee.blocked` + `access.chip.revoke` + `iot.attendance.block` + `email.account.disable` → `OrphanEventsListener` (lekin hammasi faqat `logger.log` + `TODO` — hardware integratsiya YO'Q).

---

## 6. Outbox / `domain_events` jadvali — holati

- **Schema**: `shared/db/schema-outbox.ts` — `id uuid DEFAULT gen_random_uuid()` (memory: avval cuid2 edi → har insert fail bo'lardi; 2026-06-01 to'g'rilangan), `event_name`, `payload jsonb`, `published_at`, `attempts`, `last_error`.
- **Yagona yozuvchi**: `sd/.../create-order.handler.ts:102` → `outboxRepo.insertBatch(rows, tx)` (aggregate save bilan bir tranzaksiyada). Boshqa hech bir modul outbox'ga yozmaydi.
- **Publisher**: `OutboxPublisher.tick()` — har 10s, 100 qator, `attempts<=10`, EventEmitter2'ga `emit(event_name, payload)`.
- **DB holati (read-only SELECT)**: `domain_events` → **`total=0, unpublished=0, failed=0`**. Jadval bo'sh (memory: `europrint` DB qurilish bosqichida, bo'sh). Publisher har 10s bo'sh aylanadi.
- **⚠️ Mexanizm nomuvofiqligi (eng nozik xato)**: outbox `SO_DESIGN_REQUESTED`/`SO_SAMPLE_REQUESTED` ni **STRING** sifatida emit qiladi (`'sd.order.design_requested'`), lekin yagona listenerlar **CQRS `@EventsHandler(SoDesignRequestedEvent)` class-based** — EventEmitter2 string emit CQRS handler'ga **YETIB BORMAYDI**, va `@OnEvent('sd.order.design_requested')` mavjud EMAS. Ya'ni outbox ishga tushsa ham, bu voqealar hech kimga yetmaydi.

---

## 7. Event chiqarmaydigan MUHIM biznes amallari (yetishmayotgan voqealar)

| Amal | Hozir | Bo'lishi kerak edi |
|------|-------|--------------------|
| **DealWon → Sales Order avtomatik yaratish** | `DealWonListener` faqat log — SO yaratmaydi | Trigger 2 ning asl maqsadi; SO yaratuvchi command chaqirilishi kerak |
| **Zaxira (stock) o'zgarishi** | `StockUpdatedEvent` faqat POS `stock-ledger` da emit qilinadi; WMS `goods-issue`/`receive-fg` alohida WMS event'lar emit qiladi, lekin umumiy "stock changed" yagona event YO'Q. Inventarizatsiya tuzatishlari, manual adjust, transfer → event YO'Q | Har qanday balans o'zgarishi yagona `StockUpdatedEvent` chiqarishi kerak (ROP/min-max trigger uchun) |
| **Ish haqi yopilishi** | `'payroll.period.closed'` emit, lekin **0 listener** | Finance GL posting, Telegram xabar listenerlari |
| **Xodim yaratilishi** | `'employee.created'` emit, **0 listener** | Onboarding, IoT chip, email account provision |
| **Hujjat to'liq to'lov (`MRO_MAINTENANCE_COMPLETED`, `lms.certificate.issued`)** | emit, 0 listener | mos modul reaksiyasi |
| **Narx o'zgarishi / mahsulot katalogi** | event umuman yo'q | (Production fan-out deferred — katalog yo'q) |
| **Foydalanuvchi/rol o'zgarishi** | `ERP_EVENTS.USER_CREATED`, `ROLE_CHANGED`, `'rbac.permission.changed'` — `rbac.permission.changed` emit bor lekin 0 listener; `USER_CREATED`/`ROLE_CHANGED` umuman emit qilinmaydi | audit-log, sessiya invalidatsiya |

---

## 8. Tavsiyalar (faqat tavsiya — bajarish egasi ruxsatisiz YO'Q, Qoida 23)

1. **Mexanizmni birlashtirish**: yangi kod faqat CQRS `eventBus.publish(new XEvent())` ishlatsin; `@OnEvent(string)` va xom `emitter.emit(string)` ni asta-sekin retire qilish (EventBridge allaqachon shu yo'lda — `Wave 1-6`). Yakuniy retire kommitida `EVENT_NAME_MAP` tozalansin.
2. **Outbox ↔ listener nomuvofiqligini tuzatish**: `create-order.handler` outbox'ga string emas, CQRS event class nomini yozsin YOKI `@OnEvent('sd.order.design_requested')` adapter qo'shilsin — aks holda Design/Sample triggerlari hech qachon ishlamaydi.
3. **Stub listenerlarni to'ldirish**: `DealWonListener` (SO yaratish), `SoDesignRequestedListener`, `SoSampleRequestedListener` — hozir faqat `logger.log`.
4. **Uzilgan zanjirni ulash**: `DESIGN_AND_LAB_COMPLETED` → `TechThreeCheckpointEvent` publisher yozilsin (Trigger 5→6→7 to'liq oqim uchun).
5. **AI-agent event'lariga listener** yoki ularni Notification/Director dashboard'ga ulash (hozir 13 ta event bekorga yo'qoladi).
6. **`StockUpdatedEvent` ni har balans o'zgarishida** (WMS goods-issue/receive-fg/adjust/transfer) emit qilish — yagona manba.

---

## Ilova — dalil fayllari (asosiy)

- Ko'prik: `apps/api/src/modules/shared/events/event-bridge.service.ts` (EVENT_NAME_MAP, qator 23-81)
- Outbox: `apps/api/src/shared/db/schema-outbox.ts`, `modules/shared/outbox/outbox-publisher.service.ts`, `outbox.repository.ts`
- Outbox yozuvchi: `modules/sd/application/commands/create-order.handler.ts:102,175-224`
- Fan-out (jonli kaskad): `modules/sd/infrastructure/event-handlers/advance-approved-fanout.listener.ts`, `confirm-advance-payment.handler.ts:115`, `pp/.../advance-approved.listener.ts`
- Dead-letter trigger: `modules/finance/infrastructure/event-handlers/tech-three-checkpoint.listener.ts:20-24,91`
- Stub listenerlar: `modules/crm/infrastructure/event-handlers/deal-won.listener.ts:18-32`, `design/.../so-design-requested.listener.ts:22-32`
- AI-agent (0-listener): `modules/agents/shared/agent-event-bus.service.ts`, `inventory-agent.service.ts:90`, va boshqalar (`@OnEvent` = 0)
- Konstantalar: `apps/api/src/common/constants/erp-events.constants.ts`
- DB row-count: `domain_events` → total=0 (read-only SELECT, `_audit/q.cjs`)

*Tahlil: 2026-06-02 | 🔵 Tahlilchi rejimi | hech narsa o'zgartirilmadi (faqat shu hisobot yozildi).*
