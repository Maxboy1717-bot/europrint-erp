# Zanjir-1: Ma'lumot oqimi (data-flow) to'liq tahlili — 2026-06-02

**Rol:** Tahlilchi (READ-ONLY). Kod + jonli DB strukturasi asosida. Hech narsa o'zgartirilmadi.
**Doira:** 6 ta biznes zanjir — har biri boshidan oxirigacha kod ichida kuzatildi (controller → service → repo → event → listener → keyingi qadam).
**Eslatma:** Jonli DB `europrint` deyarli BO'SH (qurilish bosqichi) — shuning uchun asosiy dalil = KOD + DB strukturasi, qator soni emas.

Status belgilari: ✅ ULANGAN · ⚠️ QISMAN · ❌ UZILGAN

---

## ENG MUHIM XULOSA — IKKI "ORDER" OLAMI

Tizimda **bir-biriga ulanmagan ikki buyurtma jadvali** bor va zanjirlar shu yerda ikkiga bo'linadi:

| Olam | Jadval | Kim ishlatadi | Holat |
|------|--------|---------------|-------|
| **A — SD/Phase-4** | `sd_sales_orders` (+ `sd_order_departments`, `ow_molds/ow_tech_cards/ow_cliches/ow_shipping_requests/ow_deliveries/ow_material_requirements`) | CRM→SD order, avans fan-out | ✅ JONLI, ulangan |
| **B — Legacy PP/MES/QC/WMS** | `sales_orders` (`master_status`, `pp_released_at`) | PP planning, MES, QC, WMS FG-receipt | ⚠️ izolyatsiya |

**DB dalili:** `sales_orders` da `product_id` / `quantity` / `sd_order_id` ustunlari **YO'Q**; `sd_sales_orders`↔`sales_orders` o'rtasida **FK yo'q**. Ikki olam hech qachon `JOIN` bo'lmaydi.

```
CRM lead → deal → sd_sales_orders → (avans) → ow_* bo'limlar   ← OLAM A (ishlaydi)
                        ╳ ULANISH YO'Q ╳
sales_orders → PP planning → MES → QC → WMS FG               ← OLAM B (izolyatsiya, deyarli dead-letter)
```

---

## 1. SALES zanjiri: lead → deal → order → ishlab chiqarish → ombor → yetkazish

```
crm_leads ──(ConvertLeadToDealCommand)──▶ crm_deals
   [convert-lead-to-deal.handler.ts:57,68 + LeadConvertedEvent]
crm_deals ──(MarkDealWonCommand → DealWonEvent)──▶ SD
   [mark-deal-won.handler.ts:47]
DealWonEvent ──(deal-won.listener.ts:30 → CreateOrderCommand)──▶ sd_sales_orders
   [create-order.handler.ts:92 tx: order save + outbox]
sd_sales_orders ──(POST /sd/orders/:id/advance-payment, Moliya roli)──▶ avans ≥70%
   [confirm-advance-payment.handler.ts:112 → AdvanceApprovedEvent]
AdvanceApprovedEvent ──(EventBridge → advance-approved-fanout.listener.ts)──▶ sd_order_departments fan-out
   ├─ mold      → ow_molds (createMoldJob)                ✅
   ├─ design    → ow_tech_cards                           ✅
   ├─ cliche    → ow_cliches                              ✅
   ├─ logistics → ow_shipping_requests → ow_deliveries    ✅
   ├─ warehouse → ow_material_requirements                ✅
   └─ production → (ataylab DEFERRED — katalog yo'q)      ⚠️
ow_deliveries.status='DELIVERED' ──▶ markStatus(logistics,'done')  ✅ (yetkazish tugaydi shu yerda)
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| lead → deal | direct command + `LeadConvertedEvent` | ✅ ULANGAN |
| deal → won | `DealWonEvent` (CQRS) | ✅ |
| won → order | `DealWonListener` → `CreateOrderCommand` (`deal-won.listener.ts:30`) | ✅ |
| order → avans | **HTTP** (`sd-orders.controller.ts:190`, Moliya qo'lda) — Kanban EMAS | ⚠️ qo'lda |
| avans → bo'limlar | `AdvanceApprovedEvent` → fan-out (5/6 bo'lim jonli) | ✅ |
| bo'lim → "ishlab chiqarish" | production bo'lim ulanmagan (DEFERRED) | ❌ UZILGAN |
| order → delivery (avto) | `OrderCreatedDeliveryListener` — **no-op** (payload da customer/manzil yo'q, `order-created-delivery.listener.ts:65`) | ❌ dead-letter |

**Eslatma:** Yetkazish OLAM A da `ow_shipping_requests/ow_deliveries` orqali ishlaydi (logistics bo'lim). Lekin alohida `logistics` moduli `OrderCreatedEvent` → delivery avto-yaratish **ishlamaydi** (dead-letter). Ya'ni "yetkazish" ikki xil joyda — biri jonli (ow_*), biri o'lik (logistics modul).

**Eng katta uzilish:** order → **production** (haqiqiy sex ishlab chiqarish). Phase-4 fan-out production bo'limini ataylab tashlab ketgan (`advance-approved-fanout.listener.ts:82`). Ishlab chiqarishning o'zi OLAM B (`sales_orders`/PP/MES) da, lekin u OLAM A bilan ulanmagan.

---

## 2. WAREHOUSE zanjiri: kirim → karantin → QC → ombor → chiqim → sex

Bu zanjir **POS modulida** (zavod ombori tableti), va u nisbatan to'liq ulangan:

```
POST POS movement (EXTERNAL_IN) ──▶ pos_movements (status='draft'→'pending')
   [pos-movement.service.ts:140 insertMovement + addLines → pos_movement_lines]
moveToQuarantine(movementId) ──▶ status='karantin', stok QC-HOLD omborga
   [quarantine-workflow.service.ts:40 updateMovementStatus + upsertWarehouseStock]
escalateExpiredQuarantine (cron) ──▶ status='qc_review'
   [quarantine-workflow.service.ts:65]
qcDecision(QABUL) ──▶ status='approved' + stok QC-HOLD → RM-MAIN
   [quarantine-workflow.service.ts:97-114 reduceWarehouseStock + upsertWarehouseStock]
status='completed' ──▶ _processCompletedMovement: warehouse_stock yangilanadi + stock_ledger
   [pos-movement-status.service.ts:150 upsertStockIn/decrementStock]
INTERNAL_ISSUE (chiqim → sex) ──▶ employee_ledger DEBIT + lifecycle block
   [pos-movement-status.service.ts:177-190]
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| kirim → karantin | direct call (`moveToQuarantine`) | ✅ ULANGAN |
| karantin → qc_review | **cron** (`escalateExpiredQuarantine`) | ✅ |
| qc_review → approved | direct call (`qcDecision`) + stok ko'chish | ✅ |
| approved → ombor (stok) | `_processCompletedMovement` upsertStockIn | ✅ |
| ombor → chiqim (sex) | `INTERNAL_ISSUE` movement + employee_ledger | ✅ |
| chiqim → GL (avto-buxgalteriya) | `pos.movement.data.completed` string topic emit, lekin `PosGlAutoListener` faqat **typed `PosMovementCompletedEvent`** ga ulangan (`pos-gl-auto.listener.ts:18` — "dead-letter today") | ❌ UZILGAN |

**Eng katta uzilish:** POS chiqim → GL avto-posting. Listener o'z izohida tan oladi: "No production code currently publishes `pos.movement.data.completed` on either bus" → GL yozuvi avtomatik tushmaydi.

---

## 3. MONEY zanjiri: so'rov → tasdiq (Kanban) → kassir → to'lov → GL

Bu **eng uzuq zanjir**. Aslida 2 ta alohida, ulanmagan oqim bor:

**3a. Material so'rovi (POS requisition)** — Kanban EMAS:
```
submitRequisition ──▶ pos_material_requests (SUBMITTED) + 'pos.requisition.submitted' emit
approveRequisition ──▶ APPROVED + reserveStock + 'pos.requisition.approved' emit
fulfillRequisition ──▶ INTERNAL_ISSUE movement + employee_ledger DEBIT + FULLY_ISSUED
   [pos-requisition-workflow.service.ts:46,72,131]
```
`'pos.requisition.*'` event'lariga **HECH KIM ulanmagan** (grep: 0 consumer) — faqat notifikatsiya.

**3b. Mijoz to'lovi → GL** (Finance):
```
RecordPaymentCommand ──▶ finance_payments + glPostingService.postCustomerPayment → gl_*
   [record-payment.handler.ts:91 → InvoiceFullyPaidEvent]
InvoiceFullyPaidEvent ──(payment-received.listener.ts:71)──▶ order 'closed'
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| so'rov → tasdiq | POS requisition (Kanban EMAS) | ✅ ichida ishlaydi |
| tasdiq → **Kanban** | **YO'Q** — money request Kanban'ga ulanmagan | ❌ |
| so'rov → **kassir** | **YO'Q** — "kassir/cashier" tushunchasi finance kodida umuman yo'q (grep: 0) | ❌ |
| mijoz to'lovi → GL | `glPostingService.postCustomerPayment` (`record-payment.handler.ts:91`) | ✅ |
| to'lov → order yopilishi | `InvoiceFullyPaidEvent` → `UpdateOrderStatusCommand` | ✅ |
| **avans** to'lovi → GL | `confirm-advance-payment.handler` GL yozmaydi (faqat order.advance_paid yangilaydi) | ❌ |

**Eng katta uzilish:** "so'rov → Kanban tasdiq → kassir → to'lov" zanjiri kod sifatida **mavjud emas**. Bor narsalar: (a) POS material requisition (pul emas, material), (b) Finance mijoz-to'lovi→GL. Ular bir-biriga ulanmagan, va o'rtada na Kanban-approval, na kassir bosqichi bor. Avans to'lovi ham GL ga tushmaydi.

---

## 4. DOCUMENT zanjiri: Kommunikatsiya → approval chain → Kanban → arxiv

```
CcSpawnRequestedEvent / sendDocument ──▶ cc_documents (draft → in_progress)
   [cc-event.listener.ts:75 createDraft + cc-workflow.service.ts]
approve ──▶ cc_document_workflow_steps imzo + keyingi approver
   [cc-workflow.service.ts → cc-workflow-approve.helpers.ts executeApproveTransaction]
barcha approver tasdiq ──▶ hujjat yakuniy holatga
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| spawn → draft | `CcSpawnRequestedEvent` (CQRS, EventBridge `cc.spawn`) | ✅ ULANGAN |
| draft → approval chain | `cc-workflow.service` sendDocument + approve/reject/resubmit | ✅ |
| approval → keyingi bosqich | `executeApproveTransaction` (org-resolver bilan approver zanjiri) | ✅ |
| autoSend → avto-jo'natish | **bloklangan** — "send uchun PIN talab qilinadi, draft holatda qoldirildi" (`cc-event.listener.ts:98`) | ⚠️ |
| approval → **Kanban** | **YO'Q** — CC workflow Kanban'ga ulanmagan (grep: cc-workflow ichida kanban/emit/publish = 0) | ❌ |
| tugatilgan → **arxiv** | Alohida `archived` status / arxiv jadvaliga ko'chirish topilmadi (grep: archive/arxiv = 0) | ❌ |

**Eng katta uzilish:** CC approval chain ichida to'liq ishlaydi, lekin "→ Kanban → arxiv" davomi YO'Q. Hujjat oxirgi tasdiqdan keyin CC ichida qoladi; alohida arxivlash yoki Kanban karta yaratish bog'lanishi yo'q. AutoSend ham PIN tufayli bloklangan.

---

## 5. PRODUCTION zanjiri: reja → sex → sex → qadoqlash → tayyor mahsulot

Bu OLAM B (legacy `sales_orders`) da va deyarli butunlay event-zanjir, lekin trigger'lar uzuq:

```
AdvanceApprovedEvent ──(advance-approved.listener.ts:26)──▶ ppRepo.unlockPlanning(orderId)  ✅
ReleaseProductionOrderCommand ──▶ PpReleasedEvent (release-production-order.handler.ts:49)
PpReleasedEvent ──▶ MES task yaratish (kutilgan)
GoodsIssueCommand ──▶ WmsGoodsIssuedEvent (goods-issue.handler.ts:80)
WmsGoodsIssuedEvent ──(wms-goods-issued.listener.ts:66)──▶ sales_orders.master_status='in_production'  ✅
CompleteSessionCommand ──▶ MesCompletedEvent (complete-session.handler.ts:71)
MesCompletedEvent ──(qc/mes-completed.listener.ts:34)──▶ "QC inspection will be opened" — NO-OP  ❌
submit-inspection (QC qo'lda) ──▶ QcPassedEvent (submit-inspection.handler.ts:51)
QcPassedEvent ──(wms/qc-passed.listener.ts)──▶ sales_orders dan lookup → receiveFg → WMS FG  ⚠️
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| avans → planning unlock | `AdvanceApprovedEvent` → `unlockPlanning` | ✅ |
| planning → release | `ReleaseProductionOrderCommand` → `PpReleasedEvent` | ✅ |
| goods issue → in_production | `WmsGoodsIssuedEvent` → `sales_orders` UPDATE | ✅ (lekin `sales_orders` bo'sh) |
| MES tugadi → QC | `MesCompletedListener` **no-op** (`mes-completed.listener.ts:34` — faqat log) | ❌ UZILGAN |
| QC o'tdi → FG receipt | `QcPassedEvent` → `qc-passed.listener.ts:33` `sales_orders` dan `product_id`/`quantity` o'qiydi — **bu ustunlar DB da YO'Q** | ❌ buziq lookup |
| sex → sex → qadoqlash | `ow_packaging_records` jadvali bor, lekin uni yozadigan kod topilmadi | ❌ |
| → tayyor mahsulot | `receiveFg` → WMS, lekin trigger uzilgan | ⚠️ |

**Eng katta uzilish:** (1) MES→QC trigger no-op — ishlab chiqarish tugagach QC inspeksiyasi avtomatik **ochilmaydi**. (2) QC→FG listener `sales_orders.product_id/quantity` o'qiydi, lekin DB da bu ustunlar yo'q → lookup `material_id` topa olmaydi → FG receipt skip. (3) Qadoqlash (`ow_packaging_records`) hech kim yozmaydi.

---

## 6. HR zanjiri: xodim → org-sxema → tasdiq → oylik/kassir

```
employees ──(user_id backfill)──▶ users (org-link)
   [project_employees_users_link_fix: employees.user_id endi to'ldirilgan]
org-structure assign ──▶ org_department_assignments (org-sxema)
CalculatePayrollCommand ──▶ org-assignment tekshiruvi (shart!) → savePayroll → payroll
   [calculate-payroll.handler.ts:58 hasAnyOrgAssignment guard + :77 savePayroll]
'hr.payroll.calculated' emit ──▶ ??? HECH KIM ulanmagan
```

| Bog'lanish | Mexanizm | Status |
|-----------|----------|--------|
| xodim → user/org-link | `employees.user_id` backfill (bijection) | ✅ |
| xodim → org-sxema | org assignment (`hasAnyOrgAssignment`) | ✅ |
| org-sxema → oylik darvozasi | `calculate-payroll.handler.ts:58` — org-assignment YO'Q bo'lsa oylik kiritilmaydi | ✅ (biznes-qoida ishlaydi) |
| oylik → tasdiq | `payroll-closure.service` (closePeriod) mavjud | ✅ qisman |
| oylik → **GL** | `'hr.payroll.calculated'` event (`:95`) ga **HECH KIM ulanmagan** (grep: 0 consumer) | ❌ UZILGAN |
| oylik → **kassir/to'lov** | Kassir tushunchasi yo'q; oylik→to'lov→GL bog'lanishi yo'q | ❌ |

**Eng katta uzilish:** Payroll hisoblanadi va saqlanadi, lekin `hr.payroll.calculated` event'iga hech kim quloq solmaydi → oylik **GL ga tushmaydi** va **kassir/to'lov** bosqichiga o'tmaydi. Zanjir `payroll` jadvalida tugaydi.

---

## UMUMIY UZILISH XARITASI (eng kritiklar)

| # | Uzilish nuqtasi | Sabab | Ta'sir |
|---|-----------------|-------|--------|
| 1 | `sd_sales_orders` ╳ `sales_orders` | FK yo'q, ikki order olami | SD order hech qachon PP/MES/QC ga o'tmaydi |
| 2 | MES tugadi → QC | `mes-completed.listener` no-op | Ishlab chiqarishdan keyin QC avto-ochilmaydi |
| 3 | QC o'tdi → FG | listener `sales_orders.product_id/quantity` o'qiydi — ustun YO'Q | FG receipt yaratilmaydi |
| 4 | POS chiqim → GL | `pos.movement.data.completed` ni hech kim publish qilmaydi | Avto-buxgalteriya yozuvi yo'q |
| 5 | Oylik → GL/kassir | `hr.payroll.calculated` ga consumer yo'q | Oylik moliyaga ulanmaydi |
| 6 | Avans to'lovi → GL | `confirm-advance-payment` GL yozmaydi | 70% avans buxgalteriyaga tushmaydi |
| 7 | CC approval → Kanban → arxiv | bog'lanish kodi yo'q | Hujjat CC ichida qoladi |
| 8 | Money so'rov → Kanban → kassir | bu zanjir kod sifatida mavjud emas | "Pul so'rovi" oqimi qurilmagan |
| 9 | order → delivery (logistics modul) | `OrderCreatedDeliveryListener` no-op | Delivery faqat ow_* (OLAM A) da ishlaydi |
| 10 | Qadoqlash (`ow_packaging_records`) | hech kim yozmaydi | Qadoqlash bosqichi bo'sh |

## ULANGAN (sog'lom) zanjirlar

- ✅ **CRM lead→deal→won→order** (event zanjiri to'liq, `sd_sales_orders` ga yetadi)
- ✅ **Avans→bo'lim fan-out** (5/6 bo'lim jonli: mold/design/cliche/logistics/warehouse, har biri `ow_*` jadval bilan)
- ✅ **WAREHOUSE kirim→karantin→QC→ombor→chiqim** (POS modul, stok ko'chishi bilan)
- ✅ **Mijoz to'lovi→GL→order yopilishi** (Finance, `record-payment` → `postCustomerPayment`)
- ✅ **CC document approval chain** (ko'p bosqichli imzo zanjiri, org-resolver bilan)
- ✅ **HR org-sxema darvozasi** (org-assignmentsiz oylik kiritilmaydi)

---

*Tahlilchi sessiyasi — READ-ONLY. Faqat shu hisobot yozildi. Kod/DB/commit o'zgartirilmadi.*
*Dalil manbalari: kod fayl:satr (yuqorida ko'rsatilgan) + jonli DB strukturasi (`_audit/q.cjs` information_schema).*
