# EuroPrint ERP — Transmissiya (Integratsiya) Xaritasi — Hisobot

> **Sana:** 2026-06-05
> **Rol:** Agent 2 — Tahlilchi (🔵 QAT'IY read-only). Hech narsa o'zgartirilmadi — faqat fayl/kod o'qish + `SELECT` + bitta hisobot.
> **Maqsad:** Tizimdagi har bir modul-modul ulanishini (transmissiya nuqtasini) xaritalash va dalil bilan ko'rsatish: qaysi uzatma haqiqatan ma'lumotni A→B yetkazadi, qaysi biri uzilgan — va nega.
> **Metod:** Verify-don't-trust. Har hukm uchun: `fayl:satr`, jonli `SELECT` natijasi yoki kod sitatasi. Eski zanjir tahlillari (D:\kitob, memory) yetakchi (lead) sifatida ishlatildi, qaytadan isbotlandi.

---

## 0. ENG MUHIM XULOSA (egasi uchun qisqacha)

Skelet (jadval + FK + listener strukturasi) kuchli. Lekin **transmissiya — uzatma — eng zaif joy**. Asosiy sabab: tizim **qurilish bosqichida** (jonli DB deyarli bo'sh) va **bir nechta "ikki dunyo" bo'linishi** zanjirni uzib qo'ygan:

1. **Ikki buyurtma dunyosi** (eng katta uzilish): `sales_orders` (savdo/avans dunyosi, 12 qator) ╳ `orders` (ishlab chiqarish dunyosi, 0 qator). Ularning **orasida FK YO'Q**, PP modulida `OrderCreatedEvent` uchun **listener YO'Q**. Savdo buyurtmasi hech qachon ishlab chiqarishga o'tmaydi.
2. **Ikki bosh kitob (GL) dunyosi:** `entries` (kanonik, `GlPostingService` shunga yozadi) ╳ `gl_journal_entries`+`gl_lines` (ishlatilmaydigan parallel model). Ikkalasi ham 0 qator. Iqtisodiy hodisalarning deyarli hech biri GLga avtomatik tushmaydi.
3. **Ikki ombor-zaxira dunyosi:** `warehouse_stock` (kanonik, 25 qator, `current_stock` view shuni ko'rsatadi) ╳ `stocks` (0 qator). WMS tayyor mahsulot qabuli (`receiveFg`) **`stocks`ga** yozadi — UI o'qiydigan `warehouse_stock`ga emas.
4. **Org-sxema rezolveri o'lik:** `employees.manager_id` 30/30 NULL → Coordination Center `MANAGER_OF_SENDER` qadami `BadRequestException` tashlaydi → hujjat birinchi inboxga yetmaydi.

> ⚠️ **Muhim nuance — "kod ulangan" vs "jonli ishlagan":** Jonli DB qurilish bosqichida, ko'p jadval bo'sh. Shuning uchun status quyidagicha belgilandi: **ULANGAN** = kod yo'li haqiqiy INSERT/double-entry qiladi va to'g'ri keyingi jadvalga tushadi (kod isbotlangan; data bor joyda jonli ham tasdiqlangan). **UZUQ** = mavjud lekin buzuq (no-op stub / 501 / 0-listener / noto'g'ri jadval / event nomi mos emas). **YO'Q** = ko'prik umuman yo'q. Har qatorda "jonli dalil" alohida ko'rsatilgan ("0 qator" = oqim hech qachon ishlamagan, bu ham dalil).

---

## 1. SIM-DIAGRAMMA (matnda) — orqa miya bir qarashda

**Asosiy zanjir (Savdo → IshChiq → QC → Ombor → Moliya):**

```
CRM Lead ──✅──> CRM Deal ──🟡──> SD Order (sales_orders) ──❌──> Production (orders/pp_orders)
                                        │                              │
                                        │                              ▼
                                        │                         MES sessiya ──❌(qo'lda)
                                        │                              │
                                        │                              ▼
                                        │                         MES tugadi ──🟡(stub)──> QC
                                        │                              │
                                        │                              ▼
                                        │                         QC qaror ──🟡(stocks≠warehouse_stock)──> Ombor
                                        │                                                                      │
                                        ▼                                                                      ▼
                              Avans (advance) ──✅──> CC fan-out (5 bo'lim)                     Tayyor mahsulot ──❌──> SD Yetkazib berish
                                        │                                                                      
                                        ❌ GL ga tushmaydi                                                      
```

**Pul zanjiri (hamma → Bosh kitob `entries`):**

```
SD to'lov (payment) ──✅(kod)──> GL entries     SD invoice ──❌──> GL
MM xarid invoice (AP) ──❌──> GL                 Avans ──❌──> GL
Ombor harakati ──❌──> GL                        Payroll ──🟡(qo'lda)──> GL
POS/kassa ──🟡(pos_gl_postings, ledger emas)──> GL    Amortizatsiya ──❌──> GL
```

**Belgilar:** ✅ ULANGAN · 🟡 QISMAN · ❌ UZUQ/YO'Q

**Hukm:** Backbone'ning **birinchi bo'g'ini (SD→Production) uzilgan** — shu sababli undan keyingi hamma narsa (MES, QC, Ombor, Yetkazib berish) jonli hech qachon ishlamaydi. Pul zanjirida amalda **bitta** haqiqiy GL yo'li bor (mijoz to'lovi), u ham qo'lda/jonli ishlamagan.

---

## 2. HISOB (counts)

| Status | Soni | Nuqtalar |
|--------|------|----------|
| **ULANGAN** (haqiqatan oqadi / kod isbotlangan) | 4 | #1b(order INSERT), #17(avans fan-out), Outbox relay, (qisman #10 to'lov yo'li) |
| **QISMAN** (bir tomonlama / qisman) | 7 | #1, #5, #10, #16, #19, #22, Event-bus |
| **UZUQ** (mavjud, buzuq) | 9 | #4, #6, #7, #11, #13, #15, #18, GL-ikki-dunyo, Ombor-ikki-dunyo |
| **YO'Q** (ko'prik umuman yo'q) | 8 | #2, #3, #8, #9, #12, #14, #20, #21 |

> Jami ~28 transmissiya nuqtasi tekshirildi. **Asosiy backbone'da ULANGAN nuqta deyarli yo'q** — eng kuchli bo'g'inlar yordamchi (CC fan-out, outbox infratuzilma).

---

## 3. LEVERAGE ( richag) reytingi — qaysi tuzatish eng ko'p oqimni ochadi

### 🥇 #1 — Ikki buyurtma dunyosini ulash (SD order → Production)
**Nega eng yuqori:** Bu butun asosiy zanjirning (Savdo→IshChiq→QC→Ombor→Moliya) **birinchi bo'g'ini**. Hozir SD buyurtmasi hech qachon ishlab chiqarishga o'tmaydi → MES, QC, Ombor, Yetkazib berishning hech biri jonli ishlay olmaydi. Bu bitta ulanish 5+ keyingi oqimni ochadi.
**Dalil:** `orders` ╳ `sales_orders` orasida FK YO'Q (`information_schema` — 0 ta FK); `pp.module.ts` listener'lari orasida `OrderCreatedEvent` YO'Q (faqat 5 ta: Advance/MroStop/Design/LabTest/WmsGoodsIssued); `sales_orders` 12 qatorning hammasida `pp_released_at`=NULL.
**Phase 2 ko'lami (kod yo'q, faqat tegadigan joylar):**
- Jadval: `orders` (`lib/db/src/schema/pp/pp-production.ts`), `sales_orders`, `pp_orders`, `sd_order_departments`.
- Fayl: `sd/application/commands/create-order.handler.ts` (OrderCreatedEvent chiqaradi), `pp/pp.module.ts` (listener yo'q), `sd/infrastructure/event-handlers/advance-approved-fanout.listener.ts:82-85` (production atayin deferred), `pp/application/commands/create-production-order.handler.ts` (hozir faqat qo'lda HTTP).
- Egasi qarori kerak: kanonik buyurtma jadvali bittami (`sales_orders`) yoki ikkala dunyo qoladimi + ko'prik (production_order_id / sales_order_id FK)?

### 🥈 #2 — Pul zanjirini GL ga ulash (iqtisodiy hodisa → `entries`)
**Nega:** Pul domeni eng uzilgan. Hozir faqat mijoz to'lovi kodi GLga yozadi (u ham qo'lda + jonli 0). MM(AP), SD invoice, Ombor harakati, Avans, Payroll(avto), POS(ledger), Amortizatsiya — hech biri avtomatik GLga tushmaydi. Bitta posting-listener qatlamini ulash 7 ta pul oqimini ochadi. + ikki GL model (`entries` ╳ `gl_journal_entries/gl_lines`) ni birlashtirish kerak.
**Dalil:** `entries`=0, `gl_journal_entries`=0, `gl_lines`=0, `pos_gl_posting_log`=0. `GlPostingService.insertJournal` faqat `entries`ga yozadi (`gl-posting` repo:43,85). `goods-receipt.handler.ts` da GL chaqiruvi yo'q; `depreciation.service.ts` faqat hisoblaydi; POS `AutoGlPostingService` `pos_gl_postings`/`gl_posting_log`ga (AWAITING_REVIEW) yozadi, `entries`ga emas.
**Phase 2 ko'lami:**
- Jadval: `entries` (kanonik), `gl_journal_entries`+`gl_lines` (parallel — egasi bittasini tanlasin), `pos_gl_postings`, `gl_posting_log`, `gl_account_mappings`.
- Fayl: `finance/.../gl-posting.service.ts`, `finance/presentation/finance-gl.controller.ts`, `mm/application/commands/goods-receipt.handler.ts`, `pos/.../auto-gl-posting.service.ts` + `auto-gl-posting.repository.ts`, `finance/.../finance-payroll.service.ts`, `finance/.../depreciation.service.ts`.
- Egasi qarori: kanonik GL = `entries` (bir qatorda dr/cr) yoki `gl_journal_entries`+`gl_lines` (haqiqiy journal/lines)?

### 🥉 #3 — Org-sxema rezolveri / `employees.manager_id`
**Nega:** Coordination Center (kompaniyaning hujjat/tasdiq nervi) `MANAGER_OF_SENDER` qadamida o'lik. `manager_id` 30/30 NULL → exception → hujjat birinchi inboxga yetmaydi. Bu kichik tuzatish (backfill yoki DEPT_HEAD avto-fallback) CC marshrutlash + hujjat workflow + har qanday "rahbarga" tasdiqni ochadi.
**Dalil:** `SELECT count(manager_id) FROM employees` = 0 (30 dan); `cc-org-resolver.service.ts:54-63` — `LEFT JOIN employees m ON m.id=e.manager_id`, `if (!id) throw new BadRequestException("...bo'lim rahbari orgsxemada belgilanmagan")`. DEPT_HEAD fallback kodi bor (`resolveDeptHead`) lekin manager topilmaganda **avtomatik chaqirilmaydi**.
**Phase 2 ko'lami:**
- Jadval: `employees` (manager_id ustuni), `org_departments` (head_user_id).
- Fayl: `communication-center/application/cc-org-resolver.service.ts:36,53-64`, `org-structure` backfill (`OrgStructureService.onModuleInit` allaqachon user_id backfill qiladi — shu yerga manager_id qo'shilishi mumkin).
- Eslatma: bu **toza fix emas** — manager_id ni qaysi manbadan to'ldirish (org-tree?) semantik qaror, egasi belgilaydi.

> Keyingi (4-o'rin, #1 dan keyin avtomatik dolzarb bo'ladi): MES→QC stub + material iste'moli→ombor + tayyor mahsulot→yetkazish — bularning hammasi ishlab chiqarish zanjiri ichida, #1 ulangach navbatda.

---

## 4. TO'LIQ TRANSMISSIYA XARITASI

> Status: **ULANGAN** · **QISMAN** · **UZUQ** · **YO'Q**. "200 qaytaradi" ≠ ulangan.

### A) Buyurtma orqa miyasi (eng yuqori ustuvorlik)

| # | Ulanish (A → B) | Tur | Holat | Dalil | Sabab | Bloklaydigan oqim |
|---|---|---|---|---|---|---|
| 1 | CRM lead → deal → SD order | event (DealWonEvent→CreateOrderCommand) | **QISMAN** | `crm/.../mark-deal-won.handler.ts:47` chiqaradi → `sd/.../event-handlers/deal-won.listener.ts:15` → `sd/.../create-order.handler.ts` → real INSERT. JONLI: `crm_deals`=0, `sales_orders` 12/12 da `crm_deal_id`=NULL | Kod to'liq ulangan; lekin hech bir deal "won" bo'lmagan → oqim jonli hech qachon ishlamagan (12 qator = seed) | Mijozdan kelgan buyurtma savdo bosqichidan o'tmaydi (jonli) |
| 1b | SD order create → `sales_orders` INSERT | call (Drizzle) | **ULANGAN** | `common/database/queries-sd.ts` — `.insert(sd_sales_orders).values({...}).returning()`; `drizzle-sales-order.repo.ts` — `assignPersistedId(newId)`. `sd_sales_orders` = auto-updatable VIEW → `sales_orders` (`is_insertable_into=YES`) | Haqiqiy INSERT, real id qaytadi, transaction + outbox atomic | — |
| 2 | **SD order → Production (ikki dunyo)** | FK / event | **YO'Q** | `orders` ╳ `sales_orders` orasida FK = 0 (`information_schema`); `sd_orders` VIEW → `orders` (0 qator), `sd_sales_orders` VIEW → `sales_orders` (12). `pp.module.ts` da `OrderCreatedEvent` listener YO'Q | Ikki parallel buyurtma jadvali, ko'prik yo'q; PP avtomatik production order yaratmaydi | ⭐ Butun backbone (buyurtma ishlab chiqarishga o'tmaydi) |
| 3 | Production order → MES sex-routing | event (PpReleasedEvent) | **YO'Q** | `pp/.../release-production-order.handler.ts:49` PpReleasedEvent → listener faqat `mm/.../pp-released.listener.ts` (MM, MES emas). MES sessiya `mes-production-sessions.controller.ts` orqali faqat **qo'lda** POST. `pp_routing_operations`=0 | PP→MES avtomatik ko'prik yo'q; routing sexdan-sexga uzatilmaydi | Ishlab chiqarish sexlarga taqsimlanmaydi |
| 4 | MES → QC (partiya tugadi → tekshiruv) | event (MesCompletedEvent) | **UZUQ** | `mes/.../complete-session.handler.ts:71` chiqaradi → `qc/.../mes-completed.listener.ts:28-39` **no-op stub** ("QC inspection will be opened by PP callback" — callback yo'q). `CreateInspectionCommand` e'lon qilingan, `@CommandHandler` YO'Q. `qc_inspections`=0 | Listener bo'sh; handler yo'q → QC avtomatik ochilmaydi | Ishlab chiqarilgan partiya tekshirilmaydi |
| 5 | QC qaror → Ombor (qabul/qayta/rad) | event (QcPassedEvent) | **QISMAN** | `qc/.../submit-inspection.handler.ts:51` QcPassedEvent → `wms/.../qc-passed.listener.ts:20` → `receiveFg()` → `drizzle-wms.repo.ts:51` `exec.insert(stocks)`. ⚠️ `stocks`ga yozadi (0 qator), kanonik `warehouse_stock`ga (25) EMAS. Rad/qayta-ishlash yo'li YO'Q (faqat QcPassed listener) | Qabul yo'li `stocks`ga yozadi → UI ko'radigan viewga tushmaydi; rad/rework kodi yo'q | Tayyor mahsulot omborda ko'rinmaydi; brak qaytarish yo'q |
| 6 | Ishlab chiqarish material iste'moli → ombor zaxira kamayishi | call | **UZUQ** | `mes/.../mes-shifts-stats.repo.ts:131-137` `recordMaterialConsumption()` faqat `mes_material_consumption`ga INSERT; `warehouse_stock`/`stocks` kamaytirilmaydi. `production_consumption`=0 | Iste'mol MESda yoziladi, omborda kamaymaydi | Zaxira soni noto'g'ri; MRP buziladi |
| 7 | Ombor tayyor mahsulot → SD yetkazib berish/logistika | event (WmsFgReceivedEvent) | **UZUQ** | `wms/.../receive-fg.handler.ts:55` → `finance/.../wms-fg-received.listener.ts:25-29` `orderId/areaM2` undefined bo'lgani uchun **skip** (WARN, return). `ow_deliveries`=0, `mm_deliveries`=0 | Event payload to'liq emas (orderId yo'q) → listener jim o'tkazib yuboradi; SD delivery yaratilmaydi | Tayyor mahsulot yetkazishga o'tmaydi |

### B) Pul orqa miyasi (eng uzilgan domen)

| # | Ulanish (A → B) | Tur | Holat | Dalil | Sabab | Bloklaydigan oqim |
|---|---|---|---|---|---|---|
| 8 | Ombor harakati (kirim/chiqim) → GL | service | **YO'Q** | `modules/wms`da GL posting service/repo topilmadi; `warehouse_transactions`=0 | WMS↔GL integratsiyasi yo'q | Ombor harakati bosh kitobga tushmaydi |
| 9 | MM xarid invoice → Moliya/GL (AP) | service | **YO'Q** | `mm/.../goods-receipt.handler.ts:26-86` da GL chaqiruvi yo'q (faqat PO status). `GlPostingService.postGoodsReceipt()` e'lon qilingan, **hech qachon chaqirilmaydi** (orphan) | AP avtomatik posting yo'q | Xarid xarajati GLga tushmaydi |
| 10 | SD invoice/to'lov → Moliya/GL (AR) | service / command | **QISMAN** | To'lov: `finance/.../record-payment.handler.ts:91,134` → `glPostingService.postCustomerPayment()` → `insertJournal()` → `entries` (real Dr Kassa/Cr AR) = **ULANGAN kod**. Invoice yaratish: `sd/.../create-invoice.handler.ts` da GL chaqiruvi YO'Q. JONLI: `entries`=0 | To'lov yo'li haqiqiy double-entry; invoice yo'li avtomatik emas; jonli hech narsa post qilinmagan | Sotuv invoice GLga tushmaydi; to'lov jonli ishlamagan |
| 11 | Payroll → GL | service | **UZUQ** | `GlPostingService.postPayroll()` mavjud, faqat `finance-gl.controller.ts:74-84` qo'lda endpoint orqali. Listener YO'Q; `finance-payroll.service.ts` faqat read-only agregatsiya | Avtomatik payroll→GL listener yo'q | Ish haqi xarajati avtomatik GLga tushmaydi |
| 12 | Avans (advance) → GL | event | **YO'Q** | `advance-approved-fanout.listener.ts` faqat bo'lim ishlarini yaratadi, GL logikasi yo'q | AdvanceApprovedEvent listenerda GL posting yo'q | Avans tushumi bosh kitobga tushmaydi |
| 13 | POS/kassa → GL | event | **UZUQ** | `pos.events.ts:131` → `AutoGlPostingService.postForMovement()` → `auto-gl-posting.repository.ts:79-91` `pos_gl_postings`/`gl_posting_log` (status=AWAITING_REVIEW)ga yozadi, kanonik `entries`ga EMAS. `pos_gl_posting_log`=0 | Parallel log jadvaliga yozadi, haqiqiy ledgerga aylanmaydi | POS harakati bosh kitobga tushmaydi |
| 14 | Amortizatsiya/depreciation → GL | service | **YO'Q** | `depreciation.service.ts` faqat `buildSchedule()` hisoblaydi; GL posting handler/cron yo'q | Hisoblanadi, post qilinmaydi | Amortizatsiya xarajati GLga tushmaydi |

### C) Kesishuvchi (cross-cutting) sim

| # | Ulanish (A → B) | Tur | Holat | Dalil | Sabab | Bloklaydigan oqim |
|---|---|---|---|---|---|---|
| 15 | CC org-rezolver `MANAGER_OF_SENDER` | call (SQL) | **UZUQ** | `cc-org-resolver.service.ts:54-63` `manager_id`ga tayanadi; `if(!id) throw BadRequestException`. JONLI: `manager_id` 30/30 NULL | manager_id NULL → exception → hujjat CC inboxga kirmaydi; DEPT_HEAD avto-fallback yo'q | Hujjat workflow boshlanmaydi (manager yo'li) |
| 16 | Hujjat marshrutlash (org-sxema, vertikal+gorizontal) | DB + hardcoded | **QISMAN** | `cc-org-resolver.service.ts:42-81` — CEO/DEPT_HEAD `org_departments.head_user_id`dan (data-driven, ishlaydi); lekin MANAGER_OF_SENDER buzuq; gorizontal/matritsa marshrut YO'Q | Vertikal zanjir data-driven lekin hardcoded qadamlar; yon (peer) tasdiq yo'q | Bo'limlararo gorizontal tasdiq yo'q |
| 17 | Avans → CC fan-out (5 bo'lim) | event (AdvanceApprovedEvent) | **ULANGAN** | `advance-approved-fanout.listener.ts:25-87` → `sd/orders/drizzle-sd-order-departments.repo.ts` real idempotent INSERT: `ow_molds`(47), `ow_tech_cards`(61), `ow_cliches`(92), `ow_shipping_requests`(126), `ow_material_requirements`(184). (Memory: 2026-06-01 jonli isbotlangan). JONLI hozir: `sd_order_departments`=0, `ow_*`=0 | Kod haqiqiy + oldin jonli; production bo'limi atayin deferred (82-85) | Production bo'limi avtomatik emas |
| 18 | IoT sensor → DB → anomaliya → harakat | controller+handler | **UZUQ** | Ingest+`RecordSensorReadingCommand` → `iot_sensor_readings` INSERT kodi bor. `AnomalyDetectedEvent` → `anomaly-detected.handler.ts:16` **pure no-op** (faqat `logger.error`). JONLI: `iot_sensor_readings`=0 | Anomaliya aniqlanadi lekin harakat qatlami bo'sh (alert/notif/CC yo'q) | Anomaliya jim yutiladi; sensor jonli ishlamagan |
| 19 | Design tasdiqlandi → Production (ow_tech_cards) | event (DesignApprovedEvent) | **QISMAN** | `design-approved-trigger5.listener.ts:26-42` → `design-lab-join.service.ts:43-66` lab bilan join → DESIGN_AND_LAB_COMPLETED chiqaradi. `setDesignStatus()` (ow_tech_cards UPDATE) bor lekin **bu listener chaqirmaydi** | Tech-card update mavjud, event bilan avto bog'lanmagan | ow_tech_cards avtomatik tasdiqlanmaydi |
| 20 | Kanban ↔ CC; Kanban ↔ Kassir | event | **YO'Q** | Order→Kanban kiruvchi ULANGAN (`order-created-kanban.handler.ts:29`). Lekin Kanban→CC (cc.spawn) listener YO'Q; Kanban→Kassir/Finance listener YO'Q | Kanban yakkalangan; chiquvchi ko'prik yo'q | Kanban CC/kassa bilan bog'lanmaydi |
| 21 | HR → bog'liq (davomat→payroll→moliya; HR→ombor jihoz) | event | **YO'Q** | HR domen eventlari (attendance/payroll-run/leave) bor; Finance modulida ularga listener YO'Q (faqat delivery/tech-checkpoint/wms-fg). "Kerakli jihoz" HR→ombor ko'prik yo'q | Bog'liq modullarda iste'mol qiluvchi listener yo'q; davomat legacy-protsedura | Payroll davomatsiz; GL avto post yo'q; jihoz qo'lda |
| 22 | Marketing lead → CRM | event | **QISMAN** | Website→CRM ULANGAN (`crm/.../website-lead.service.ts:40` → `crm_leads` INSERT). Lekin ichki marketing leadlari (`marketing/.../leads.service.ts`) uchun listener YO'Q | Website kanali ulangan; ichki kampaniya leadlari avtomatik o'tmaydi | Kampaniya→savdo qo'lda |

### D) Event-shina (event bus) — alohida muhim

| Holat | Tafsilot (dalil) |
|---|---|
| **QISMAN** | ~40 event publisher; ko'pchiligi CQRS CLASS bilan to'g'ri ulangan. Lekin **13+ event 0-listener** (bo'shlikka chiqadi) + string/class nomuvofiqlik bor. |
| **Outbox relay: ULANGAN (lekin ishlatilmaydi)** | `shared/outbox/outbox-publisher.service.ts:31` har 10 soniyada `domain_events`ni o'qib `EventEmitter2.emit(event_name, payload)` qiladi. JONLI: `domain_events`=0 → eventlar to'g'ridan-to'g'ri chiqariladi, outbox orqali emas. |

**0-listener eventlar (bo'shlikka chiqadi):**
- CQRS CLASS: `DealLostEvent`, `MesToHr360Event`, `StockUpdatedEvent`, `InvoicePartiallyPaidEvent`, `DeliveryCompletedEvent`, `ApprovalRequested/Approved/Rejected` (3×, director), `HitlApprovalRequested/Approved/Rejected` (3×), `SosAlertRaisedEvent`.
- Agent STRING eventlari: `stock.critical` (`agents/inventory-agent.service.ts:90`), `iot.anomaly` (`agents/iot-agent.service.ts:41`), `crm.hot_leads_found` (`agents/lead-scoring-agent.service.ts:104`) — publisher bor, listener YO'Q.
- Publisher-siz listener (o'lik): `access.chip.revoke`, `iot.attendance.block`, `email.account.disable`, `employee.absence.day1/2`, `employee.blocked` (orphan-events.listener.ts); AI: `CrmLeadCreatedEvent`, `HrCandidateAddedEvent`, `FinanceInvoiceCreatedEvent`.
- **String/class double-emit:** `PosMovementCompletedEvent` ham CLASS, ham `'pos.movement.data.completed'` STRING sifatida chiqariladi → ba'zi listenerlar ikki marta.

### E) Tahlil jarayonida topilgan qo'shimcha "ikki dunyo" bo'linishlari

| # | Bo'linish | Holat | Dalil | Ta'sir |
|---|---|---|---|---|
| E2 | **Ikki GL model:** `entries` (kanonik, `gl_entries` VIEW shuni o'qiydi) ╳ `gl_journal_entries`+`gl_lines` (parallel, ishlatilmaydi) | **UZUQ** | `gl_entries` VIEW def = `FROM entries`; `GlPostingService` faqat `entries`ga yozadi; `gl_journal_entries`/`gl_lines` 0 qator, yozuvchi yo'q | Moliya hisobotlari qaysi modelni o'qiydi? Chalkashlik xavfi |
| E3 | **Ikki zaxira jadval:** `warehouse_stock` (kanonik, 25, `current_stock` VIEW) ╳ `stocks` (0) | **UZUQ** | WMS `receiveFg` → `stocks` (drizzle-wms.repo:51); `current_stock` VIEW = `FROM warehouse_stock` | WMS qabuli UI ko'rsatadigan jadvalga tushmaydi |

---

## 5. JONLI DB DALILLARI (asosiy `SELECT` natijalari)

| Tekshiruv | Natija |
|---|---|
| Buyurtma jadval turlari | `sales_orders`=BASE(12), `sd_sales_orders`=VIEW(→sales_orders), `orders`=BASE(0), `sd_orders`=VIEW(→orders) |
| `orders` ↔ `sales_orders` FK | **0 ta** (ikki dunyo isboti) |
| `sales_orders` 12 qator | hammasi `crm_deal_id`=NULL, `advance_status`=NULL, `pp_released_at`=NULL (seed; spine ishlamagan) |
| `employees` | total=30, `manager_id` to'la=**0**, `user_id` to'la=30 |
| GL jadvallar | `entries`=0, `gl_journal_entries`=0, `gl_lines`=0, `gl_entries`=VIEW(→entries), `pos_gl_posting_log`=0 |
| Zaxira jadvallar | `warehouse_stock`=25, `stocks`=0, `current_stock`=VIEW(→warehouse_stock) |
| Production/QC | `pp_orders`=0, `mes_production_sessions`=0, `qc_inspections`=0, `pp_routing_operations`=0 |
| Fan-out maqsadlari | `sd_order_departments`=0, `ow_tech_cards/ow_molds/ow_cliches/ow_material_requirements/ow_shipping_requests`=0, `ow_deliveries`=0 |
| Event/IoT | `domain_events`=0, `iot_sensor_readings`=0, `warehouse_transactions`=0, `pos_movements`=2 |
| 7 ta FK → `sales_orders(id)` | tasdiqlandi: `sales_order_items`, `sd_order_departments`, `ow_cliches`, `ow_material_requirements`, `ow_molds`, `ow_shipping_requests`, `ow_tech_cards` |

---

## 6. O'Z-O'ZINI TEKSHIRUV (verify-don't-trust, 5 ta "ULANGAN" qayta isbotlandi)

1. **#1b order INSERT:** `sd_sales_orders` VIEW `is_insertable_into=YES` (auto-updatable, bir-jadval SELECT) → INSERT `sales_orders`ga propagatsiya bo'ladi. ✅ Haqiqiy.
2. **#10 to'lov→GL:** `gl-posting` repo:43,85 `.insert(entries)` (`gl_journal_entries`/`gl_lines` emas) — yagona haqiqiy double-entry yo'li. ✅ Kod haqiqiy (jonli 0).
3. **#17 avans fan-out:** `drizzle-sd-order-departments.repo.ts:47,61,92,126,184` — 5 ta `ow_*` jadvalga real idempotent INSERT. ✅ Haqiqiy.
4. **#5 QC→ombor:** `drizzle-wms.repo.ts:51` `exec.insert(stocks)` — haqiqiy INSERT, lekin **`stocks`ga, `warehouse_stock`ga emas**. ✅ Ulanish bor, ammo noto'g'ri jadval (shuning uchun QISMAN, ULANGAN emas).
5. **#18 IoT anomaliya:** `anomaly-detected.handler.ts:16-26` — `handle()` faqat `logger.error`, boshqa harakat yo'q. ✅ No-op tasdiqlandi (shuning uchun UZUQ).

---

## 7. XULOSA

- Tizim **strukturaviy kuchli, integratsion zaif**. FK, jadval, listener karkasi mavjud — lekin asosiy bo'g'inlar uzilgan yoki hech qachon ishlamagan.
- **Eng katta richag:** ikki buyurtma dunyosini ulash (#1) — u butun ishlab chiqarish zanjirini ochadi.
- **Ikkinchi:** GL posting qatlamini ulash (#2) — pul zanjirini ochadi.
- **Uchinchi:** `employees.manager_id` (#3) — CC/hujjat nervini ochadi.
- Ko'p jadval bo'sh bo'lgani **muammoning o'zi emas, qurilish bosqichi** — ammo u "kod ulangan" da'volarini jonli isbotlab bo'lmasligini bildiradi; shuning uchun har hukm kod + struktura bilan tasdiqlandi.
- **Tizim o'zgartirilmadi.** Bu hisobot faqat holatni ko'rsatadi; qaror egasiniki (Phase 2), tuzatish bajaruvchiniki (Phase 3).

*Hisobot tugadi — 2026-06-05.*
