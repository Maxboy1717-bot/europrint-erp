# SD / CRM — To'liq Modul Yakunlash Tahlili
## PART 2 — Phase 1 Extension: Orphan Sweep + Integratsiya Izi

> **Sana:** 2026-07-10 · **Rol:** 🔵 Tahlilchi (read-only)
> **Part 1:** [`SD-CRM-MODUL-TOLIQ-TEKSHIRUV-2026-07-10.md`](SD-CRM-MODUL-TOLIQ-TEKSHIRUV-2026-07-10.md) — 15 sidebar sahifasi (fake-save / green-lie / RBAC). Bu hujjat uni **takrorlamaydi**, kengaytiradi.
> **Bog'liq:** [`DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md`](DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md) (D3/D4/D9 metodologiyasi)
>
> Hech bir kod, sxema yoki ma'lumot o'zgartirilmadi. Bazaga faqat `SELECT` va `BEGIN…ROLLBACK` sinovlari yuborildi (hech narsa saqlanmadi).
> **Metod:** deterministik inventar → 3 mustaqil agent chuqur iz → **har bir bosh da'vo shaxsan qayta tekshirildi** (Q-29). Agentlarning bir nechta asosiy da'vosi tuzatildi — §5.

⚠️ **Concurrent-session ogohlantirishi:** tekshiruv boshida ish daraxtida `apps/api/src/modules/compatibility/crm-extended.controller.ts` o'zgargan holatda edi (`git status: M`). Boshqa sessiya shu faylda ishlayotgan bo'lishi mumkin. Phase 3 commit'laridan oldin qayta tekshirilsin.

---

## 0. Qamrov va usul

**Reachability ta'rifi** (dublikat-sahifalar metodologiyasi bilan bir xil): marshrut foydalanuvchiga ochiq hisoblanadi, agar quyidagilardan biri bo'lsa — (a) sidebar `url`/`defaultUrl`, (b) kod ichidagi `setLocation`/`navigate`/`href=`/`<Link to=`, (c) `<Redirect to=>` nishoni, (d) dinamik detail marshruti (`:id`). Hech biri bo'lmasa → **orphan**.

**O'chirish nomzodi mezoni (100% ishonch):** komponentga butun repo bo'ylab 0 ta murojaat (o'z fayllari va `routes/` dan tashqari) **va** yo'l-satri (`"/x"`) hech qayerda uchramaydi **va** boshqa marshrutda ro'yxatdan o'tmagan.

---

## 1. ORPHAN SWEEP

### 1.1 Marshrut inventari

SD / CRM / Marketing qamrovida **57 ta ro'yxatdan o'tgan marshrut**:

| Holat | Soni |
|---|---|
| Sidebar orqali ochiladi | 32 |
| Dinamik detail (`:id`) | 4 |
| Redirect nishoni | 3 |
| Kod ichidagi nav-havola | 0 |
| **ORPHAN** | **19** |

### 1.2 Alias-marshrutlar — komponent tirik, faqat ortiqcha yo'l (3 ta)

Bu uchtasida sahifa o'chirilmaydi; faqat ortiqcha route-yozuvi olib tashlanadi.

| Orphan yo'l | Route | Komponent | Tirik yo'li |
|---|---|---|---|
| `/ai-crm` | `CRMRoutes.tsx:51` | `AiCrmPage` | `/ai/crm` [sidebar] |
| `/sd/quotations` | `CRMRoutes.tsx:62` | `SDSalesQuotes` | `/sd/sales-quotes` [sidebar] |
| `/sd/manager-panel` | `CRMRoutes.tsx:83` | `SDExtended` | `/sd/warehouse-rental`, `/sd/advance-control` [sidebar] |

### 1.3 To'liq o'lik sahifalar (12 ta, 16 marshrut)

Har biri uchun tasdiq: **faqat o'z fayli + `CRMRoutes`/`AdminRoutes` lazy-import + route tuple**. Boshqa hech qayerda murojaat yo'q; yo'l-satri repo bo'ylab 0 marta uchraydi.

| # | Komponent | Orphan marshrut(lar) | Route | Fayl | Qator |
|---|---|---|---|---|---|
| 1 | `CrmFunnelAnalytics` | `/crm/funnel` | `CRMRoutes.tsx:53` | 1 | 383 |
| 2 | `CrmRfmClusters` | `/crm/rfm` | `:54` | 1 | 166 |
| 3 | `CrmCohortAnalysis` | `/crm/cohort` | `:55` | 1 | 200 |
| 4 | `CRMActivities` | `/crm/activities` | `:56` | 4 | 643 |
| 5 | `CRMSettings` | `/crm/settings` | `:57` | 5 | 947 |
| 6 | `SDEuroprint` | `/sd/crm` | `:63` | 1 | 65 |
| 7 | `SDSalesManagement` | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` | `:72-76` | 3 | 613 |
| 8 | `SDDebitors` | `/sd/debitors` | `:80` | 2 | 292 |
| 9 | `SDOverviewDashboard` | `/sd/dashboard/overview` | `:81` | 2 | 351 |
| 10 | `SDLeads` | `/sd/leads` | `:86` | 1 | 752 |
| 11 | `SDDeliveries` | `/sd/deliveries` | `:87` | 1 | 496 |
| 12 | `OrdersRegistry` | `/orders-registry` | `AdminRoutes.tsx:92` | 4 | 603 |
| | **JAMI** | **16 marshrut** | | **26 fayl** | **5511 qator** |

**Qo'shimcha:** `SDEuroprint` yagona iste'molchi bo'lgan `components/sd/europrint/` — **8 fayl, 1221 qator** (`OverviewDashboard`, `CustomersTab`, `LeadsTab`, `QuotationsTab`, `OrdersTab`, `PaymentsTab`, `KPITab`, `SectionHeader`). U bilan birga o'ladi.

**Umumiy o'chirilishi mumkin hajm: ~6732 qator.**

### 1.4 ⚠️ O'lik sahifa ≠ o'lik backend

Bu **muhim nuance** — FE sahifasini o'chirish backend endpointini o'ldirmaydi, chunki ko'pchiligining boshqa iste'molchisi bor:

| O'lik sahifa | Uning endpointi | Boshqa iste'molchi |
|---|---|---|
| `CRMSettings` | `/api/crm/settings` | `CRMFunnelSettings.tsx` (jonli sahifa) |
| `CRMActivities` | `/api/crm/activities` | `components/crm/activity/*` (7 forma) + `BitrixActivityPanel` |
| `SDDeliveries` | `/api/sd/deliveries` | `lib/api/sd.ts`, `hooks/use-sd.ts` |
| `SDDebitors` | `/api/sd/debitors` | `hooks/use-sd.ts` |
| **`OrdersRegistry`** | `/api/orders-registry` | **YO'Q — yagona iste'molchi** |

Ya'ni `OrdersRegistry` o'chirilsa, `OrdersRegistryCompatController` ham o'lik qoladi (2 route).

### 1.5 Backend controllerlari

`modules/sd` (12) + `modules/crm` (17) = **29 controller. Hammasi modulda ro'yxatdan o'tgan. Birortasi ham o'lik emas.** Yana 3 ta SD/CRM prefiksli controller boshqa modullarda (`compatibility`, `general`, `integration/sap`).

**FE chaqiruvchisi 0 bo'lgan yagona controller:** `CrmAutoLeadController` (10 route, `crm-auto-lead.controller.ts`).
❌ **Bu o'lik EMAS.** U tashqi kanal intake'i: `@Public()` + `WebhookSignatureGuard` (`common/guards/webhook-signature.guard.ts:6,18`), route'lari `POST /crm/auto-lead/{call,form,sms,telegram,website,whatsapp}`. Tashqi tizimlar chaqiradi, FE emas.

**Qisman qoplangan (FE ba'zi route'larni chaqirmaydi):** `CrmExtendedCompatController` 4/11, `CrmAiController` 3/6, `CrmAnalyticsController` 3/6, `SalesController` 5/9, `CrmExtrasController` 6/10.

---

## 2. INTEGRATSIYA IZI (DB-isbot bilan)

### 2.1 Jonli ma'lumot holati — zanjirni tushunish uchun asos

Barcha raqamlar `SELECT` bilan olingan (`europrint`@localhost:5432).

| Jadval | Qator | Muhim ustunlar to'ldirilganligi |
|---|---|---|
| `sales_orders` | 13 | `master_status` **0/13** · `total_value` **0/13** · `advance_percent` **0/13** · `advance_required` **0/13** · `tech_*_approved` **0/13** · `customer_id` 13/13 · `crm_lead_id` **0/13** · `deal_id` **0/13** |
| `sales_order_items` | 2 | `product_id` 2/2 · lekin 13 buyurtmadan faqat **1 tasida** qator bor |
| `crm_leads` | 16 | `assigned_to` **0/16** · `manager_id` **0/16** · `assigned_by_id` 8/16 |
| `deals` | 5 | `assigned_to` **0/5** · `lead_id` **0/5** · `metadata->>'lead_id'` 1/5 |
| `marketing_leads` | 14 | `crm_lead_id` 2/14 |
| `sd_quotations` | **0** | — |
| `sd_contracts` | **0** | — |
| `payments` (base) | **0** | — |
| `production_orders` | 7 | `sales_order_id` 1/7 (u ham `status='completed'` seed qatori) |
| `papka_orders` | **0** | — |
| `deliveries` | 1 | `sales_order_id` 1/1 |
| `delivery_items` | **0** | **yozuvchi kod yo'q** |
| `warehouse_stock_fg` | 0 | — |
| `entries` (kanonik GL) | 6 | prefikslar: `GL-0`×4, `PAYR`×1, `POS-`×1 — **`CP-` (mijoz to'lovi) yo'q** |

`sales_orders.status` taqsimoti: `delivered`×8, `in_progress`×2, `confirmed`×1, `closed`×1, `cancelled`×1. **`ready_for_planning` — 0 ta.**

---

### 2.2 SD buyurtma → PP (ishlab chiqarish rejasi)

**Ikki mustaqil yo'l mavjud.**

#### Path A — qo'lda status o'tkazish (kod to'liq ulangan, hech qachon ishlatilmagan)

```
PATCH /sd/orders/:id/status  (newStatus='ready_for_planning')
  → UpdateOrderStatusCommand
  → agregat darvozasi checkAdvanceAndBlock()   sales-order.aggregate.ts:146
  → atomik status UPDATE + outbox 'sd.order.status_changed'
  → OrderStatusChangedEvent
  → SalesOrderReadyPlanningListener            pp/…/sales-order-ready-planning.listener.ts:58
     (PLANNING_GATE_STATUS = 'ready_for_planning', :48)
  → createPlanFromSalesOrder()                 pp/…/drizzle-pp.repo.ts:144-188
  → INSERT production_orders (status='created')
```

Zanjir **butun va ro'yxatdan o'tgan** (`pp.module.ts:129`). Lekin hech qachon ishga tushmagan: 13 buyurtmaning **hech biri** `ready_for_planning` da emas. Ustiga, `createPlanFromSalesOrder` faqat `product_id` bog'langan qatorlar ustida ishlaydi — 13 buyurtmadan **1 tasida** qator bor.

#### Path B — avtomatik tech→avans darvozasi (birinchi bo'g'inda uzilgan)

```
PATCH /sd/orders/:id/tech-checkpoint
  → agregat tech_bom/routing/card_approved = true   sales-order.aggregate.ts:225-232
  → orderRepo.update(order)                          drizzle-sales-order.repo.ts:153
  → execSdSalesOrderUpdate(status, advanceStatus, id) queries-sd.ts:148-165
     ⛔ .set({ status, advance_status, updated_at })   ← uchta boolean TUSHIB QOLADI
```

**Butun backend bo'ylab `sales_orders.tech_bom_approved` ga yozuvchi 0 ta.** (`queries-technology.ts:143` dagi `execTechApproveOrder` boshqa jadvalga — `papka_orders` + `technology_approvals` — yozadi.)

Natijada:

```
TechThreeCheckpointListener   finance/…/tech-three-checkpoint.listener.ts:69
  allTechApproved = (tech_bom_approved === true && …)   → doim false
  → listener :73 da qaytadi, hech narsa qilmaydi
  → AdvanceApprovedEvent hech qachon chiqmaydi
  → PP AdvanceApprovedListener (pp.module.ts:130) hech qachon uyg'onmaydi
```

Ustiga, agar bu tuzatilsa ham, keyingi bo'g'in ham buzuq: listener `total_value` (13/13 NULL) va `advance_percent` (13/13 NULL) o'qiydi → `advancePaidPct = 0` → `advanceOk = false` → `markReadyForPlanning()` chaqirilmaydi.

`markReadyForPlanning` (`listener:132-149`) `master_status='ready_for_planning'`, `advance_status='advance_completed'`, `pp_queued_at=NOW()` yozadi. **13 qatorda `master_status` NULL** — ya'ni bu funksiya hech qachon bajarilmagan.

#### `tech_*_approved` ni kim o'qiydi (yozuvchi yo'q bo'lsa ham)

| O'quvchi | Fayl:qator | Nima buziladi |
|---|---|---|
| Finance Trigger-6 darvozasi | `tech-three-checkpoint.listener.ts:69-71` | Avtomatik PP-unlock hech qachon ishlamaydi |
| Agregat rehydration | `drizzle-sales-order.repo.ts:278-280` | Har `findById` da tasdiqlar `false` bo'lib qaytadi — tasdiqlashdan keyingi buyruq ham ularni yo'qotadi |
| `GET /sd/orders/:id` | `get-order-by-id.handler.ts:44-49` | API doim `threeCheckpointPassed=false` deydi |

**QC bog'liqligi yo'q** — QC/`technology_approvals` boshqa jadval ustida ishlaydi.

#### PP `OrderCreatedEvent` ni tinglamaydi

`OrderCreatedEvent` tinglovchilari: Kanban (`order-created-kanban.handler.ts:21`), Logistics (`order-created-delivery.listener.ts:36`), Notifications (`order-created-notification.listener.ts:21`). **PP yo'q.** Ya'ni buyurtma yaratilishi o'z-o'zidan ishlab chiqarishga hech narsa yubormaydi.

> **Verdikt:** Bugun birorta SD buyurtmasi ishlab chiqarish rejalashtiruviga yetib bormaydi. Path A ishlashi mumkin, lekin hech qachon haydab ko'rilmagan va qatorsiz buyurtmada no-op bo'ladi. Path B **uch bo'g'inda** uzilgan: (1) tech-checkpoint saqlanmaydi, (2) `total_value` yozilmaydi, (3) `advance_percent` yozilmaydi.

---

### 2.3 SD buyurtma → yetkazib berish → tayyor mahsulot ombori (#51)

**Jadval nomlari (Part 1 taxminini tuzatadi):** yetkazib berish jadvali **`deliveries`**, `sd_deliveries` **umuman mavjud emas**. Qatorlar: `deliveries` 1, `delivery_items` **0**.

#### Uzilgan bo'g'inlar, tartib bo'yicha

**1. `POST /sd/deliveries` jonli bazada 500 qaytaradi.** Drizzle sxemasi `deliveries.id` ni `uuid` + cuid default deb e'lon qiladi (`schema-misc.ts:20`), jonli DB'da esa u `integer` + `nextval('deliveries_id_seq')`.

DB-isbot (rollback tranzaksiyasi, hech narsa saqlanmadi):
```
INSERT INTO deliveries (id, delivery_number, status) VALUES ('cuid_test_abc', …)
  → XATO: неверный синтаксис для типа integer: "cuid_test_abc"
INSERT INTO deliveries (delivery_number, status) VALUES (…)   → OK, id=8 (serial)
```
Qo'shimcha: create DTO camelCase (`salesOrderId`, `driverName`) — snake_case ustunlarga mos kelmaydi, jimgina tushadi.

**2. `delivery_items` ga hech kim yozmaydi.** Butun backend bo'ylab `INSERT INTO delivery_items` — **0 marta**. `SdDeliveriesController.createDelivery` (`sd-deliveries.controller.ts:54-65`) faqat sarlavha yozadi; `sales_order_items` dan qatorlarni ko'chirmaydi.

**3. `#51` tinglovchisi qattiq o'chirilgan.** `delivery-goods-issued.listener.ts:54`:
```
const DELIVERY_51_DISABLED = true;   // ← env emas, KODDA konstanta
…
if (DELIVERY_51_DISABLED) { return; }   // :74
```
> ⚠️ Part 1 va loyiha xotirasi buni `.env` bayrog'i deb belgilagan. **Bu noto'g'ri** — `.env` da bunday kalit yo'q.

**4.** Agar #51 yoqilsa ham, u bo'sh `delivery_items` ni o'qiydi → toza no-op.

**5.** Hozirgi FG chiqim yo'li — `DeliveryRequestFulfillmentService.fulfillReal` (`delivery-request-fulfillment.service.ts:169-174`) — POS zayavka oqimidan haydaladi, SD `deliveries` dan **emas**.

#### Ishlayotgan qismlar

- FK topologiyasi sog'lom: `deliveries.sales_order_id → sales_orders(id)`, `warehouse_stock_fg.product_id → products(id)`
- Kontaminatsiya gardi joyida: `qc-passed.listener.ts:113-150` FG'ni faqat `product_id` bo'yicha kalitlaydi, `material_id` ga fallback yo'q
- `warehouse_stock_fg` da `material_id` ustuni **umuman yo'q** — strukturaviy himoya
- `sales_order_items.product_id` to'ldirilgan (2/2)

> **Verdikt:** SD buyurtmasi bugun to'g'ri FG chiqimini hosil qila olmaydi. **SD tomonidagi ayb:** create yo'lining sxema drifti (1) va `delivery_items` yozuvchisining yo'qligi (2). **Ombor tomonidagi ayb:** `#51` bayrog'i (3) va FG chiqimini POS zayavkasiga yo'naltirish qarori (5).

---

### 2.4 CRM lid / deal → marketing_leads / sd_leads

**Model (Part 1 topilmasini DB bilan mustahkamlaydi):**

- `crm_leads` (16 qator) — **haqiqiy markaz**. `/crm/leads` API ham, `/sd/leads` API ham (`sd-leads.repository.ts:23,55,74`) aynan shu jadvalni o'qiydi. Veb-sayt intake ham shunga yozadi (`website-lead.repository.ts:91`), e-commerce ham (`ecommerce.repository.ts:153`).
- `sd_leads` — **jadval mavjud emas** (faqat Drizzle sxemasi).
- `leads` (uuid) — 0 qator, o'lik yetim.
- `marketing_leads` (14) — alohida silo; `crm_leads` ga **nusxa** ko'chiriladi (`marketing-analytics-stubs.controller.ts:298`), bog'lanish `crm_lead_id` yumshoq ustuni orqali (**FK yo'q**), 14 dan faqat **2 tasi** bog'langan.
- `deals` (5) → `crm_leads` bog'lanishi faqat `metadata->>'lead_id'` jsonb orqali (5 dan **1 tasida**). Fizik `deals.lead_id` ustuni **5/5 NULL**.
- Butun zanjirdagi yagona haqiqiy FK: `sales_orders.crm_lead_id → crm_leads` — va u **13/13 NULL** (hech qachon lid orqali buyurtma yaratilmagan).

#### ⭐ Amaliy oqibat: Batch-1 scoping hech kimga hech narsa ko'rsatmaydi

Batch-1 filtri egalik ustuni bo'yicha ishlaydi:
- lead: `eq(crmLeads.manager_id, ownerId)` → fizik ustun `assigned_to` (`drizzle-crm-leads.repo.ts:74,93`)
- deal: `AND assigned_to = ${ownerId}` (`drizzle-crm-deals.repo.ts:30,48`)

Jonli ma'lumot:

| Manba | Qator | `assigned_to` | `manager_id` | `assigned_by_id` |
|---|---|---|---|---|
| `(null)` | 9 | 0 | 0 | 8 |
| `website` | 4 | 0 | 0 | 0 |
| `email` | 1 | 0 | 0 | 0 |
| `facebook` | 1 | 0 | 0 | 0 |
| `CALL` | 1 | 0 | 0 | 0 |
| **crm_leads jami** | **16** | **0** | **0** | 8 |
| **deals** | **5** | **0** | — | — |

`crmOwnerScope()` fail-closed `-1` qaytaradi (`crm-row-scope.ts:27-30`). Ya'ni:
- `super_admin` / `admin` / `director` → hammasini ko'radi
- **`sales_manager` → 0 lid, 0 deal ko'radi**

Batch-1 kodda **buzilmagan**, lekin egalik ustuni hech qachon to'ldirilmagani uchun u aslida "hammasini yashirish" filtriga aylangan. `marketing-analytics-stubs.controller.ts:298` konvert qilganda `assigned_by_id` yozadi (`assigned_to` emas); `ecommerce.repository.ts:153` umuman yozmaydi.

---

### 2.5 SD to'lov / avans → Finance GL

**Sxema tuzatishi:** `sd_payments` — **BASE TABLE emas, VIEW** (`payments` ustidan, auto-updatable, INSTEAD-OF trigger yo'q). Kanonik GL — `entries` (BASE TABLE, 6 qator); `gl_entries` — uning ustidagi VIEW.

| Obyekt | Turi | Qator |
|---|---|---|
| `payments` | BASE TABLE | 0 |
| `sd_payments` | **VIEW** → `payments` | 0 |
| `entries` | BASE TABLE | 6 |
| `gl_entries` | **VIEW** → `entries` | 6 |
| `gl_journal_entries` / `gl_lines` | BASE TABLE | 0 / 0 |
| `pos_gl_postings` | BASE TABLE | 0 |

#### (a) Mijoz to'lovi → GL: **YETIB BORMAYDI**

```
PATCH /sd/payments/:id/mark-paid
  → drizzle-quotation.repo.ts:210  UPDATE sd_payments SET status='paid' …
       RETURNING id, status, updated_at        ← ⛔ `amount` YO'Q
  → sd-quotations.service.ts:301   const amount = Number(r.data['amount'] ?? 0);   → 0
  → :302                            if (amount > 0)                                 → hech qachon
```

Ya'ni `postCustomerPayment()` **hech qachon chaqirilmaydi**. DB tasdig'i: `entries` da `CP-` prefiksli qator **0 ta**.

Ikkinchi nuqson (agar birinchisi tuzatilsa ham chiqadi): `Number.isFinite(Number(id)) ? Number(id) : 0` — `id` uuid, shuning uchun **har qanday to'lov `CP-0` referensiga tushadi** va idempotentlik tekshiruvi yolg'on-pozitiv beradi (ikkinchi to'lov "allaqachon joylangan" deb o'tkazib yuboriladi).

Uchinchi: GL yozuvi `sd_payments` UPDATE **commit'idan keyin**, alohida chaqiruvda. Xato bo'lsa faqat `logger.warn` (`:304`) — to'lov `paid` bo'lib qoladi.

#### (b) Avans to'lovi → GL: **UMUMAN YOZILMAYDI**

`confirm-advance-payment.handler.ts` faqat `sales_orders.advance_paid` ni atomik yangilaydi va `AdvanceApprovedEvent` chiqaradi. Uning **barcha** tinglovchilari:

| Tinglovchi | Fayl:qator | GL ga yozadimi |
|---|---|---|
| `AdvanceApprovedFanoutListener` | `sd/…/advance-approved-fanout.listener.ts:20` | ❌ (bo'lim vazifalari) |
| `AdvanceApprovedListener` (PP) | `pp/…/advance-approved.listener.ts:14` | ❌ (reja ochadi) |

**Hech biri ledgerga yozmaydi.** Avans pul yig'iladi, lekin buxgalteriyada aks etmaydi.

#### (c) Hisob kodlari sog'lom

Kodlar `finance/domain/constants/gl-accounts.constants.ts` da konstanta (`CASH:'5010'`, `AR:'4000'`, …). `drizzle-gl-posting.repo.ts:28` ularni `accounts.id` ga hal qiladi; topilmasa halol `Err` qaytaradi. Jonli DB: 7 ta kod (5010, 4000, 9010, 6310, 9100, 1000, 6000) — **hammasi mavjud va `is_active=true`**. Ya'ni blokerlik kod-yo'qligida emas.

#### (d) Overpay gardi inert

`sd-payments.repository.ts:143`:
```sql
FROM invoices WHERE sales_order_id = ${orderId}
```
`invoices.sales_order_id` — **uuid**, `orderId` esa integer. DB-isbot:
```
select id from invoices where sales_order_id = 123
  → XATO: неверный синтаксис для типа uuid: "123"
```
Xato `safeCall` bilan yutiladi → `if (invoiceRows.ok …)` false → **tekshiruv o'tkazib yuboriladi**. Ustiga, garddan oldin `if (orderId)` sharti bor, `order_id` esa camelCase-drop tufayli NULL — ya'ni ikki qavat o'tkazib yuboriladi. (`invoices` da alohida `order_id integer` ustuni bor, ishlatilmaydi.)

> **Rad etilgan da'vo:** "debounce SELECT `payments` ga, INSERT `sd_payments` ga — noto'g'ri jadval". `sd_payments` — `payments` ustidagi VIEW, ikkalasi **bir xil bazaviy jadval**. Bu xato emas.

> **Verdikt:** SD inkasso operatsion jadvalda (`payments`) qayd etiladi, lekin **kanonik `entries` ledgeriga na mijoz to'lovi, na avans yetib bormaydi**. `entries` dagi yagona SD-kelib chiqishli qatorlar (`SD_INVOICE/COGS/VAT/DELIVERY`) yetkazib-berish/faktura yo'lidan kelgan, inkassodan emas.

---

### 2.6 Bog'liqlik xaritasi

#### SD nimaga tayanadi (SD tinglaydigan eventlar)

| Event | Manba modul | SD tinglovchisi | Yozadi |
|---|---|---|---|
| `DealWonEvent` | CRM | `deal-won.listener.ts:137,142` | `crm_deals` (VIEW→`deals`), `sales_orders` |
| `InvoiceFullyPaidEvent` | Finance | `payment-received.listener.ts` | — |
| `PpCancelledEvent` | PP | `pp-cancelled-sd.listener.ts:40` | `sales_orders` |
| `AdvanceApprovedEvent` | Finance | `advance-approved-fanout.listener.ts:20` | `sd_order_departments` |
| `AdvanceBypassApprovedEvent` | SD | — | — |
| `OrderStatusChangedEvent` | SD | — | — |
| `TechThreeCheckpointEvent` | SD | — | — |
| `OrderMaterialWaitingEvent` | SD | — | — |

Hammasi `sd.module.ts:105` `eventListeners` massivida ro'yxatda.

#### SD ga nima tayanadi (SD chiqaradigan eventlar)

| Event | Iste'molchi modullar |
|---|---|
| `OrderCreatedEvent` | Kanban, Logistics, Notifications — **PP EMAS** |
| `TechThreeCheckpointEvent` | Finance (Trigger 6) |
| `AdvanceApprovedEvent` | PP (reja ochish), SD (bo'lim fan-out) |
| `DeliveryGoodsIssuedEvent` | WMS (`#51`, **o'chirilgan**) |
| `OrderMaterialWaitingEvent` | SD |

#### `sales_orders` ga FK bilan bog'langan 14 jadval

`billing_documents`, `deals`, `deliveries`, `delivery_request_fulfillment_shadow`, `ow_cliches`, `ow_material_requirements`, `ow_molds`, `ow_shipping_requests`, `ow_tech_cards`, `papka_orders`, `production_orders`, `sales_order_items`, `sd_lost_orders`, `sd_order_departments`, `sd_reclamations`.

Kod bo'yicha `sales_orders` ga murojaat qiladigan modullar: `sd`(22), `aisha`(7), `pp`(6), `finance`(6), `director`(6), `marketing`(5), `wms`(2), `qc`(2), `crm`(2), `bot-gateway`(2), `pos`(1).

#### Har bir tuzatish nimani buzishi mumkin

| Tuzatish | Ta'sir doirasi | Xavf |
|---|---|---|
| `tech_*_approved` ni saqlash | Finance Trigger-6 **birinchi marta** ishga tushadi → `AdvanceApprovedEvent` → PP reja ochadi + SD bo'lim fan-out | 🔴 **Yuqori.** Hozir uxlab yotgan ikki listener birdan uyg'onadi. Avval `total_value`/`advance_percent` to'g'ri bo'lmasa, darvoza baribir yopiq qoladi (xavfsiz), lekin ikkalasi birga tuzatilsa — jonli PP rejalari va bo'lim vazifalari yaratila boshlaydi |
| `total_value` / `advance_percent` ni to'ldirish | Trigger-6 matematikasi | 🔴 **Yuqori.** Faqat `tech_*` bilan birga ma'noli; alohida xavfsiz |
| To'lov camelCase→snake_case | `payments.customer_id`/`order_id` to'ladi | 🟠 O'rta. **Yaxshilanadi:** debitor-aging (`getDebitors`), mijoz AR balansi, SD dashboard inkassosi, cashflow-agent, `fin.bot`. Overpay gardi ham **birinchi marta** ishlay boshlaydi (uuid nomuvofiqligi tuzatilsa) |
| `mark-paid` `RETURNING amount` | GL `entries` ga `CP-` qatorlar tusha boshlaydi | 🔴 **Yuqori.** `Number(id)` uuid nuqsoni **birga** tuzatilishi shart, aks holda barcha to'lovlar `CP-0` da to'qnashadi |
| Avansni GL ga joylash | Yangi listener kerak | 🔴 Yuqori — yangi buxgalteriya yozuvi, egasi qarori |
| `deliveries` sxema drifti | `POST /sd/deliveries` ishlay boshlaydi | 🟠 O'rta. `delivery_items` yozuvchisisiz baribir #51 no-op |
| `#51` ni yoqish | `warehouse_stock_fg` kamayadi | 🔴 **Yuqori, ombor tomoni.** Hozir FG chiqim POS zayavkasidan; ikkalasi yoqilsa **ikki marta kamayish** xavfi |
| `assigned_to` ni to'ldirish | Batch-1 scoping haqiqatan ishlay boshlaydi | 🟠 O'rta. Hozir `sales_manager` hech narsa ko'rmaydi; to'ldirilgach faqat o'zinikini ko'radi |
| Orphan sahifalarni o'chirish | `OrdersRegistryCompatController` o'lik qoladi | 🟢 Past |

---

## 3. Part 1 da bo'lmagan yangi topilmalar

| # | Topilma | Isbot |
|---|---|---|
| N1 | `sd_payments` — VIEW, bazaviy jadval `payments` | `information_schema.tables` |
| N2 | `mark-paid` GL legi **hech qachon bajarilmaydi** (`RETURNING` da `amount` yo'q) | `drizzle-quotation.repo.ts:213` ↔ `sd-quotations.service.ts:301` + `entries` da `CP-` yo'q |
| N3 | GL referensi `CP-0` ga tushadi (uuid → `Number()` → NaN → 0) | `sd-quotations.service.ts:303` |
| N4 | Avans **hech qanday ledgerga** yozilmaydi | `AdvanceApprovedEvent` ning 2 tinglovchisi ham GL ga tegmaydi |
| N5 | Overpay gardi inert (`invoices.sales_order_id` uuid ↔ integer) | rollback-probe: `invalid syntax for uuid: "123"` |
| N6 | `POST /sd/deliveries` jonli bazada 500 (Drizzle uuid ↔ live integer serial) | rollback-probe |
| N7 | `delivery_items` ga yozuvchi kod **yo'q** (0 qator, 0 INSERT) | repo-wide grep |
| N8 | `DELIVERY_51_DISABLED` — env emas, **kodda konstanta** | `delivery-goods-issued.listener.ts:54` |
| N9 | `crm_leads` 16/16 va `deals` 5/5 da `assigned_to` NULL → Batch-1 scoping oddiy menejerga **0 qator** ko'rsatadi | DB SELECT |
| N10 | `master_status` 13/13 NULL — master-oqim hech qachon boshlanmagan | DB SELECT |
| N11 | PP `OrderCreatedEvent` ni tinglamaydi | grep: Kanban/Logistics/Notifications |
| N12 | `deal-won.listener.ts:137` `crm_deals` **VIEW**'iga yozadi (auto-updatable, ishlaydi) | `is_insertable_into=YES` |
| N13 | `production_orders` 7 qator, faqat 1 tasi `sales_order_id` bilan, u ham seed | DB SELECT |
| N14 | `OrdersRegistry` — yagona iste'molchi; o'chirilsa BE controller ham o'ladi | grep |

---

## 4. Oldingi taxminlarning tuzatilishi

| Oldingi da'vo | Haqiqat |
|---|---|
| `sd_leads` — uchinchi lid jadvali | **Jadval mavjud emas**; `/sd/leads` API `crm_leads` ni o'qiydi |
| `sd_deliveries` — yetkazib berish jadvali | **Mavjud emas**; jadval nomi `deliveries` |
| `sd_payments` — bazaviy jadval | **VIEW** (`payments` ustidan) |
| `DELIVERY_51_DISABLED` — `.env` bayrog'i | **Kodda qattiq yozilgan konstanta** |
| "debounce SELECT `payments`, INSERT `sd_payments` → noto'g'ri jadval" | **Xato emas** — ikkalasi bir xil bazaviy jadval |
| `CrmAutoLeadController` — 0 FE chaqiruvchi → o'lik | **O'lik emas** — tashqi webhook intake (`@Public` + imzo gardi) |
| Batch-1 scoping "buzilmagan, ishlayapti" | Kod buzilmagan, **lekin egalik ustuni bo'sh** → amalda hamma narsani yashiradi |

---

## 5. Ishonch darajasi

**Yuqori (shaxsan `file:line` yoki DB so'rovi / rollback-probe bilan tasdiqlangan):** §1 ning butun orphan ro'yxati; N1–N14; PP event zanjiri (`pp.module.ts:129-130`); `tech_*_approved` ga 0 yozuvchi; `deliveries` id turi; `entries` prefikslari; `assigned_to` bo'shligi; overpay gardi xatosi.

**O'rta (agent izidan, tanlab tekshirdim):** Path A ning to'liq ulanganligi (statik iz, runtime'da haydab ko'rilmagan); `createPlanFromSalesOrder` ichki idempotentligi.

**Tekshirilmagan:**
- Hech bir oqim **runtime'da haydab ko'rilmadi** (read-only faza). "Path A ishlardi" — statik xulosa.
- `entries` dagi `GL-0000000x` `SD_*` qatorlarini aynan `postDeliveryCompleted` yozganmi (prefiks `DC-` emas, `GL-`) — noaniq, ehtimol seed.
- `CrmAiService` ichki mantiqi (haqiqiy LLM chaqiruvimi).
- `crm-bitrix/*` scope holati.
- Marketing modulining ichki sahifalari (bu qamrovdan tashqarida).

---

## 6. Phase 2 ga kiritiladigan yangi qaror nuqtalari

Part 1 ning §11 dagi 18 nuqtasiga qo'shimcha:

**Group E (orphan) ga:**
19. 12 o'lik sahifa (~6732 qator) — o'chirilsinmi yoki ba'zilari sidebar'ga chiqarilsinmi? Ayniqsa `CRMSettings` (947), `SDDeliveries` (496 — #51 zanjiri uchun kerak bo'lishi mumkin), `OrdersRegistry` (603 + BE controller), `SDSalesManagement` (613, 5 tab).
20. `OrdersRegistry` o'chirilsa `OrdersRegistryCompatController` ham o'chirilsinmi?

**Group F (cross-module) ga:**
21. `#51` yoqilsinmi, yoki FG chiqimi POS zayavkasida qolsinmi? (Ikkalasi bir vaqtda = ikki marta kamayish)
22. `delivery_items` ni kim to'ldiradi — SD delivery-create, yoki PP/WMS?
23. Avans to'lovi GL ga joylanishi kerakmi? Qaysi hisoblar (DR/CR)?
24. `deliveries` sxema drifti — Drizzle'ni jonli DB'ga moslashtiramizmi (uuid→integer), yoki DB'ni migratsiya qilamizmi? (Q-35)

**Group C (avans-darvoza) ga:**
25. `tech-checkpoint` va `total_value`/`advance_percent` **birga** tuzatilsinmi? (Alohida tuzatilsa darvoza baribir yopiq, lekin birga tuzatilganda PP rejalari va bo'lim vazifalari jonli yaratila boshlaydi — bu ataylab bo'lishi kerak.)

**Group D (RBAC) ga:**
26. `assigned_to` ni kim to'ldiradi — lead yaratilganda avtomatik (round-robin) yoki qo'lda tayinlash? Mavjud 16 lid va 5 deal backfill qilinsinmi?

---

*Phase 1 Extension tugadi. Kod, sxema, ma'lumot o'zgartirilmadi. Keyingi qadam — Phase 2 (egasi intervyusi, guruh bo'yicha bittadan savol).*
