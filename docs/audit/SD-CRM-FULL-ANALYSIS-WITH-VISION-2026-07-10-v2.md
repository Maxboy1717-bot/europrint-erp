# SD / CRM — To'liq Tahlil + Vizyon Taqqoslash (v2)

> **Sana:** 2026-07-10 · **Rol:** 🔵 Tahlilchi (READ-ONLY — kod, sxema, ma'lumot **umuman o'zgartirilmadi**)
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` va `BEGIN…ROLLBACK` sinovlari (hech narsa saqlanmadi)
> **Oldingi hujjatlar:** [Part 1](SD-CRM-MODUL-TOLIQ-TEKSHIRUV-2026-07-10.md) (15 sahifa) · [Part 2](SD-CRM-FULL-COMPLETION-ANALYSIS-2026-07-10.md) (orphan + integratsiya) · [Dublikatlar](DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md)
> **Yangi:** §4 Vizyon taqqoslash (292 item) · §5 Modernizatsiya bo'shliqlari · §6 30+ tavsiya

---

## 0. Oldingi tahlildan keyin O'ZGARGANLAR

Barcha Part 1 / Part 2 topilmalari **jonli kodda va bazada qayta tekshirildi**. Quyidagilardan tashqari hech narsa o'zgarmagan.

### 0.1 ⚠️ CHANGED SINCE PRIOR ANALYSIS — commit qilinmagan o'zgarish

`apps/api/src/modules/compatibility/crm-extended.controller.ts` — boshqa sessiya tomonidan tahrirlangan, **hali commit qilinmagan** (`git status: M`, 4 insertion / 4 deletion).

O'zgarish mazmuni: massiv-route aliaslar olib tashlanmoqda —
```diff
-  @Post(['chat', 'ai/extended/chat/respond'])
+  @Post('chat')
-  @Post(['auto-tasks', 'ai/extended/auto-tasks/create'])
+  @Post('auto-tasks')
-  @Post(['ai/churn', 'ai/extended/churn/analyze'])
+  @Post('ai/churn')
-  @Post(['ai/voice', 'ai/extended/voice/analyze-call'])
+  @Post('ai/voice')
```

**Ta'siri:** Part 1 da qayd etilgan `lib/api/ai.ts:80` dagi `POST /api/crm/ai/extended/churn/analyze` helperi **hozirgacha ham 404** edi (BE `CrmAiExtendedController` da u `@Get`). Bu o'zgarish `CrmExtendedCompatController` dagi POST aliasini ham olib tashlaydi — ya'ni helper endi **ikki tomondan ham** o'lik. Bu Part 1 ning P2 topilmasini kuchaytiradi, zid emas.

⚠️ Phase 3 commit'laridan oldin bu faylning holati qayta tekshirilishi shart (Q-24 concurrency).

### 0.2 O'zgarmagan — qayta tasdiqlangan

| Tekshiruv | Natija |
|---|---|
| `tech_bom_approved` yozuvchisi | **0 ta** (4 murojaat, hammasi o'qish) — P0-2 kuchda |
| `queries-sd.ts:162-164` UPDATE | `.set({ status, advance_status, updated_at })` — o'zgarmagan |
| `SdCreatePaymentSchema` | hali `.passthrough()`; repo hali `body['customer_id']` o'qiydi — P0-3 kuchda |
| `markPaymentPaid` `RETURNING` | `id, status, updated_at` — `amount` hali yo'q (N2 kuchda) |
| `DELIVERY_51_DISABLED` | hali kodda `const … = true` (N8 kuchda) |
| `INSERT INTO delivery_items` | butun repo bo'ylab **0 ta** (N7 kuchda) |
| Taklifnoma `items[].product_id` majburiy | hali shunday; FE hali yubormaydi |
| `sap.repository.ts` `body['totalAmount']` | hali o'qiydi; FE'da bu nom **0 marta** uchraydi |
| `/sd/crm`, `/sd/dashboard/overview`, `/sales→/erp/sales` | uchalasi hali ro'yxatda (D3, D9, D4) |

### 0.3 O'zgarmagan — jonli DB snapshot

| Jadval | Part 2 (2026-07-10) | Hozir |
|---|---|---|
| `sales_orders` | 13 (tv 0, ap 0, tb 0, ms 0) | **bir xil** |
| `crm_leads` | 16 (`assigned_to` 0) | **bir xil** |
| `deals` | 5 (`assigned_to` 0) | **bir xil** |
| `entries` | 6 | **bir xil** |
| `payments` (base) | 0 | **bir xil** |
| `delivery_items` | 0 | **bir xil** |
| `sd_quotations` | 0 | **bir xil** |

### 0.4 ⭐ YANGI ILDIZ-SABAB (Part 2 da yo'q edi)

Part 2 da N9 sifatida qayd etilgan edi: `crm_leads.assigned_to` 16/16 NULL → Batch-1 scoping hech kimga hech narsa ko'rsatmaydi. **Sababi endi topildi.**

`pickNextSalesManager()` (`website-lead.repository.ts:37-50`) shunday so'raydi:
```sql
FROM employees e … WHERE COALESCE(e.role,'') = 'sales_manager' AND COALESCE(e.is_active,true) = true
```

Jonli bazada:

| So'rov | Natija |
|---|---|
| `employees` rollari | **31 xodim, hammasida `role` NULL** |
| `role='sales_manager'` va faol | **0 ta** |
| `users` da `role ILIKE '%sales%'` | **0 ta** |

Ya'ni round-robin doim `null` qaytaradi → yangi lidga hech kim biriktirilmaydi → `assigned_to` NULL → owner-scope filtri (`assigned_to = ownerId`) hech qanday qatorga mos kelmaydi.

**Bu kod xatosi emas — master-data bo'shlig'i.** `employees.role` hech qachon to'ldirilmagan. Ikki nuqson (round-robin ochligi va RBAC ko'rinmasligi) bitta ildizdan.

---

## 1. Tasdiqlangan sahifa jadvali (15 sidebar sahifasi)

Part 1 ning to'liq jadvali takrorlanmaydi — quyida faqat **tekshiruv natijasi** va o'zgarishlar.

| Sahifa | Ochiladi | Fake-save | Green-lie | RBAC | Tekshiruv |
|---|---|---|---|---|---|
| SD Dashboard `/sd/dashboard` | ✅ | — | — | scope yo'q | ✅ o'zgarmagan; D9 dublikat hali route'da |
| Mijozlar `/sd/customers` | ✅ | 🔴 5 maydon tushadi | — | class-`@Roles` yo'q | ✅ o'zgarmagan |
| Lidlar `/crm-workspace` | ✅ | 🔴 4 create'dan 3 tasi 400 | — | lead/deal scoped, boshqasi yo'q | ✅ o'zgarmagan · ⭐ scope **amalda 0 qator** ko'rsatadi (§0.4) |
| Sotish Paneli `/sales`→`/erp/sales` | ✅ | 🔴🔴 deyarli butunlay | — | scope yo'q | ✅ o'zgarmagan (D4) |
| AI CRM `/ai/crm` | ✅ | — | ⚠️ natija saqlanmaydi | rol-gated | ✅ o'zgarmagan |
| Taklifnomalar `/sd/sales-quotes` | ✅ | 🔴 CREATE doim 400 | — | scope yo'q | ✅ o'zgarmagan · `sd_quotations` = 0 qator (izchil) |
| Buyurtmalar `/sd/sales-orders` | ✅ | `currency` tushadi | 🔴 tech-checkpoint | class-`@Roles` yo'q | ✅ o'zgarmagan (P0-2) |
| Papka Buyurtmalari `/papka-orders` | ✅ | `deadline` tushadi | — | ⚠️ na `@Roles`, na `@UseGuards` | ✅ o'zgarmagan |
| Shartnomalar `/sd/contracts` | ✅ | 🔴 3 maydon tushadi | — | scope yo'q | ✅ o'zgarmagan · `sd_contracts` = 0 qator |
| Buyurtma Yaratish `/order-create` | ✅ | 🔴 9 maydon tushadi | — | `@Roles` yo'q | ✅ o'zgarmagan · `papka_orders` = 0 qator |
| Ombor Ijara `/sd/warehouse-rental` | ✅ | — (o'qish) | — | scope yo'q | ✅ o'zgarmagan |
| Yo'qotilgan/Reklamatsiya `/sd/lost-orders` | ✅ | ✅ toza | — | scope yo'q | ✅ modulning eng toza sahifasi |
| To'lovlar `/sd/sales-payments` | ✅ | 🔴🔴 P0-3 | — | scope yo'q | ⭐ **kuchaydi:** `mark-paid` GL legi **hech qachon bajarilmaydi** (N2) — Part 1 "real, GL yozadi" deb baholagan edi |
| 70% Avans Nazorat `/sd/advance-control` | ✅ | — | 🟠 literal `0` | scope yo'q | ✅ o'zgarmagan · `papka_orders`=0 → sahifa bo'sh |
| KPI `/sd/kpi` | ✅ | 🟠 2 maydon tushadi | — | scope yo'q | ✅ o'zgarmagan |
| Sozlamalar `/sd/settings` | ✅ | ✅ toza | — | — | ✅ o'zgarmagan |
| Voronka Sozlamalari `/crm/funnel-settings` | ✅ | ✅ toza | — | — | ✅ o'zgarmagan |

> ⭐ **Part 1 ga tuzatish:** "To'lovlar — mark-paid real, GL entries yozadi" **noto'g'ri edi**. Part 2 ning N2 topilmasi buni rad etadi va bu tahlirda qayta tasdiqlandi: `entries` da `CP-` prefiksli birorta qator yo'q.

---

## 2. Tasdiqlangan orphan ro'yxati

57 SD/CRM/Marketing marshruti: 32 sidebar, 4 dinamik, 3 redirect nishoni, **19 orphan**. Hammasi qayta tasdiqlandi.

### 2.1 Alias-marshrutlar (3) — sahifa tirik, faqat ortiqcha yo'l

| Orphan yo'l | Route | Tirik yo'li |
|---|---|---|
| `/ai-crm` | `CRMRoutes.tsx:51` | `/ai/crm` [sidebar] |
| `/sd/quotations` | `CRMRoutes.tsx:62` | `/sd/sales-quotes` [sidebar] |
| `/sd/manager-panel` | `CRMRoutes.tsx:83` | `/sd/warehouse-rental`, `/sd/advance-control` [sidebar] |

### 2.2 To'liq o'lik sahifalar (12 ta, 16 marshrut, ~6732 qator)

100% ishonch: har birida faqat o'z fayli + route-tuple + lazy-import. Yo'l-satri repo bo'ylab 0 marta.

| Komponent | Marshrut(lar) | Fayl | Qator | ⚠️ Ehtiyot |
|---|---|---|---|---|
| `CrmFunnelAnalytics` | `/crm/funnel` | 1 | 383 | Vizyon **M13 #51** (voronka) shu sahifaga tayanadi |
| `CrmRfmClusters` | `/crm/rfm` | 1 | 166 | Vizyon **M13 #69** (RFM/CLV panel) shu sahifaga tayanadi |
| `CrmCohortAnalysis` | `/crm/cohort` | 1 | 200 | — |
| `CRMActivities` | `/crm/activities` | 4 | 643 | BE `/api/crm/activities` — 7 forma + `BitrixActivityPanel` ishlatadi |
| `CRMSettings` | `/crm/settings` | 5 | 947 | BE `/api/crm/settings` — jonli `CRMFunnelSettings.tsx` ishlatadi |
| `SDEuroprint` | `/sd/crm` | 1 (+8) | 65 (+1221) | D3 to'liq modul dublikati; `components/sd/europrint/` u bilan o'ladi |
| `SDSalesManagement` | 5 marshrut | 3 | 613 | — |
| `SDDebitors` | `/sd/debitors` | 2 | 292 | BE `hooks/use-sd.ts` ham ishlatadi; to'lov tuzatilgach kerak bo'ladi |
| `SDOverviewDashboard` | `/sd/dashboard/overview` | 2 | 351 | D9 |
| `SDLeads` | `/sd/leads` | 1 | 752 | `crm_leads` ni scope'siz o'qiydi (Batch-1 bypass) |
| `SDDeliveries` | `/sd/deliveries` | 1 | 496 | ⚠️ #51 zanjiri uchun kerak bo'lishi mumkin |
| `OrdersRegistry` | `/orders-registry` | 4 | 603 | Yagona iste'molchi — o'chirilsa `OrdersRegistryCompatController` (2 route) ham o'ladi |

### 2.3 Backend

29 controller (`modules/sd` 12 + `modules/crm` 17) — **hammasi ro'yxatda, birortasi ham o'lik emas**. `CrmAutoLeadController` FE'dan chaqirilmaydi, lekin tashqi webhook intake'i (`@Public()` + `WebhookSignatureGuard`) — o'lik emas.

---

## 3. Tasdiqlangan integratsiya / bog'liqlik xaritasi

### 3.1 Zanjir holati (uchalasi ham uzilgan)

| Zanjir | Holat | Uzilgan bo'g'in |
|---|---|---|
| SD → PP (oltin-ip) | ❌ | Path A: kod to'liq, **hech qachon haydalmagan** (`master_status` 0/13). Path B: `tech_*_approved` ga yozuvchi **0 ta** → Trigger-6 doim `false` |
| SD → Yetkazish → FG ombor (#51) | ❌ | `POST /sd/deliveries` → 500 (sxema drifti) · `delivery_items` yozuvchisi **yo'q** · `DELIVERY_51_DISABLED = true` (kodda) |
| SD → Finance GL | ❌ | Mijoz to'lovi: `RETURNING` da `amount` yo'q → GL hech qachon chaqirilmaydi. Avans: **hech qanday ledgerga** yozilmaydi |

### 3.2 Lid modeli

`crm_leads` (16) — haqiqiy markaz (CRM UI, `/sd/leads` API, veb-sayt intake, e-commerce hammasi shunga yozadi).
`marketing_leads` (14) — alohida silo, `crm_lead_id` yumshoq ustuni (FK yo'q), 2/14 bog'langan.
`deals` (5) — `metadata->>'lead_id'` jsonb orqali (1/5); fizik `deals.lead_id` **5/5 NULL**.
`sd_leads`, `sd_deliveries` — **jadval sifatida mavjud emas**. `sd_payments` — `payments` ustidagi VIEW.
Yagona haqiqiy FK: `sales_orders.crm_lead_id → crm_leads`, va u **13/13 NULL**.

### 3.3 Master-data ochligi (⭐ yangi tushuncha)

Uchta alohida ko'ringan nuqson bitta ildizdan chiqadi:

```
employees.role = NULL (31/31)
      │
      ├──▶ pickNextSalesManager() → null → crm_leads.assigned_to NULL (16/16)
      │           │
      │           └──▶ Batch-1 owner-scope → sales_manager 0 qator ko'radi
      │
      └──▶ deals.assigned_to NULL (5/5) → yaratuvchi o'z bitimini ko'rmaydi
```

Bu **kod xatosi emas**; hech kimda `sales_manager` roli yo'q.

### 3.4 Bog'liqlik xaritasi

**SD ga tayanadi:** PP (`AdvanceApprovedEvent`), WMS (`DeliveryGoodsIssuedEvent`, o'chirilgan), Kanban / Logistics / Notifications (`OrderCreatedEvent`), Finance (`TechThreeCheckpointEvent`).
**SD tayanadi:** CRM (`DealWonEvent`), Finance (`InvoiceFullyPaidEvent`, `AdvanceApprovedEvent`), PP (`PpCancelledEvent`).
**`sales_orders` ga FK bilan bog'langan 14 jadval:** `production_orders`, `papka_orders`, `deliveries`, `sales_order_items`, `deals`, `billing_documents`, `sd_order_departments`, `sd_lost_orders`, `sd_reclamations`, `delivery_request_fulfillment_shadow`, `ow_cliches`, `ow_molds`, `ow_tech_cards`, `ow_material_requirements`, `ow_shipping_requests`.
**PP `OrderCreatedEvent` ni tinglamaydi** — buyurtma yaratilishi o'z-o'zidan ishlab chiqarishga hech narsa yubormaydi.

### 3.5 Tuzatish → ta'sir doirasi

| Tuzatish | Xavf | Nima uyg'onadi |
|---|---|---|
| `tech_*_approved` saqlash | 🔴 Yuqori | Trigger-6 **birinchi marta** ishlaydi → `AdvanceApprovedEvent` → PP reja ochadi + SD bo'lim fan-out |
| `total_value`/`advance_percent` to'ldirish | 🔴 Yuqori | Faqat `tech_*` bilan **birga** ma'noli; alohida darvoza xavfsiz yopiq qoladi |
| `mark-paid` `RETURNING amount` | 🔴 Yuqori | `entries` ga `CP-` qatorlar tushadi. **N3 (uuid→`Number()`→0) bilan birga tuzatilishi shart**, aks holda barcha to'lovlar `CP-0` da to'qnashadi |
| To'lov camelCase→snake_case | 🟠 O'rta | Debitor-aging, mijoz AR, SD dashboard inkassosi, `cashflow-agent`, `fin.bot` jonlanadi |
| Avansni GL ga joylash | 🔴 Yuqori | Yangi ledger yozuvi — egasi DR/CR qarori kerak |
| `employees.role` to'ldirish | 🟠 O'rta | Round-robin va Batch-1 scoping **birinchi marta** ishlaydi |
| `deliveries` sxema drifti | 🟠 O'rta | `POST` ishlaydi, lekin `delivery_items` yozuvchisisiz #51 baribir no-op |
| `#51` yoqish | 🔴 Yuqori (ombor) | FG hozir POS zayavkasidan kamayadi → **ikki marta kamayish** xavfi |
| Orphan o'chirish | 🟢 Past | `OrdersRegistryCompatController` birga o'ladi |

---

## 4. VIZYON TAQQOSLASH

**Manba:** `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md` (27 640 qator)
— **Module-06 SD/Sotuv** (6871-8593 qatorlar, 157 item) va **Module-13 CRM** (16068-17582 qatorlar, 135 item). Jami **292 item**.

### 4.1 Metodologiya va yakuniy natija

Master-reja har item uchun `Current status` (Ha / Qisman / Yo'q / STALE-DOC) va evidence saqlaydi. Uning baholashi asosan **kod mavjudligiga** tayanadi. Bu tahlil unga **runtime haqiqatini** qo'shadi (Q-40: *ishlaydi ≠ to'g'ri*).

`STALE-DOC` = manba vizyon hujjatidagi status eskirgan (masalan `order_cancellation_rules` jadvali "Qisman" deb belgilangan, aslida umuman mavjud emas). Tasnifda `MISSING` deb hisoblanadi.

**Men reja `Ha` bergan 21 itemning hammasini shaxsan qayta tekshirdim.** 11 tasi runtime tekshiruvida pasaytirildi:

| Item | Reja | Yakuniy | Sabab |
|---|---|---|---|
| M06 #94 To'lov→GL, debitor kamayadi | `Ha` | **MISSING** | ⛔ Yolg'on Ha — `RETURNING` da `amount` yo'q → GL hech qachon chaqirilmaydi; `entries` da `CP-` 0 ta |
| M06 #93 Tasdiqlangan buyurtma→PP | `Ha` | PARTIALLY | Kod bor, hech qachon ishlamagan (`master_status` 0/13) |
| M06 #119 Summa/Ostalos avto | `Ha` | PARTIALLY | `balance_due_amount` 1/13 |
| M06 #137 Yetkazish fakti qayd | `Ha` | PARTIALLY | 1 seed qator; `POST /sd/deliveries` → 500 |
| M13 #51 Voronka + konversiya | `Ha` | PARTIALLY | Servis real, FE sahifasi **orphan** |
| M13 #55 Avto biriktirish (round-robin) | `Ha` | PARTIALLY | 0 ta `sales_manager` xodim → doim `null` |
| M13 #63 AI Next Best Action | `Ha` | PARTIALLY | Natija saqlanmaydi, inson-tasdiq oqimi yo'q |
| M13 #64 AI churn + qaytarish vazifasi | `Ha` | PARTIALLY | Compat endpoint hardcoded `{score:0}`; vazifa yaratilmaydi |
| M13 #66 Oltin ip: bitim→buyurtma | `Ha` | PARTIALLY | `won` deal'da `sales_order_id` NULL; `deal_id` 0/13 |
| M13 #69 RFM/CLV panel | `Ha` | PARTIALLY | Servislar bor, FE paneli **orphan** |
| M13 #77 Boshliq CRM dashboard | `Ha` | PARTIALLY | FE sahifasi tekshirilmagan |

**Haqiqatan FULLY DELIVERED bo'lgan 10 item:** M06 #57 (narx formulasi komponentlari), #68 (ABC 80/15/5), #73 (kotirovka→buyurtma tugmasi), #86 (ko'p qatorli buyurtma), #95 (mijoz rekvizitlari) · M13 #53 (ko'p manba), #54 (veb+Telegram avto lid), #61 (hot-lead chegaralari), #65 (Mijoz 360°), #67 (yagona kanonik mijoz bazasi).

### Yakuniy tasnif

| Tasnif | SD (157) | CRM (135) | **Jami (292)** | % |
|---|---|---|---|---|
| **FULLY DELIVERED** | 5 | 5 | **10** | **3.4%** |
| **PARTIALLY DELIVERED** | 70 | 41 | **111** | **38.0%** |
| **MISSING** | 82 | 89 | **171** | **58.6%** |

> Taqqoslash uchun: master-rejaning o'z baholashi `Ha` 21 (7.2%). Runtime tekshiruvi uni **10 ga (3.4%)** tushirdi — ya'ni "qurilgan" deb belgilangan har ikkinchi item aslida **ishlamaydi**.

Quyida **292 itemning to'liq ro'yxati** — hech biri "mayda" deb tashlanmadi.

### 4.2 Module-06 SD/Sotuv — 157 item

| # | Vizyon itemi | Reja statusi | **Yakuniy tasnif** | Izoh / tekshiruv |
|---|---|---|---|---|
| 1 | Har qatorga alohida ishlab chiqarish buyurtmasi (OrderLineConfirmed event) | `Qisman` | **PARTIALLY** |  |
| 2 | MaterialRequiredEvent outbox; MM rad/24s→eskalatsiya | `Yo'q` | **MISSING** |  |
| 3 | Uch shart ketma-ket gate (kredit→to'lov→maket), gate_status JSONB | `Yo'q (advance leg alone is Qis` | **MISSING** |  |
| 4 | FIFO partiya narxi tasdiqda muzlatiladi (unit_cost_snapshot) | `Yo'q` | **MISSING** |  |
| 5 | Kotirovka 14-kun muddat, narx avto-yangilanish, +5% menejer tasdiq | `Yo'q` | **MISSING** |  |
| 6 | Davallческое material owner_type='client', kafolat depoziti Moliyada | `Qisman` | **PARTIALLY** |  |
| 7 | ±10% og'ish ruxsat, 15%+ menejer tasdiq, hisob-faktura real miqdorga | `Yo'q` | **MISSING** |  |
| 8 | Jarima % order_cancellation_rules (30/70/100%), GL entries | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 9 | debtorControl GSD = menejer ochiq qarzi; 30+ kun 1.5x; haftalik | `Qisman (STALE-DOC on the "lead` | **PARTIALLY** |  |
| 10 | HR EmployeeDeactivated→mijozlar rahbar tanlagan menejerga | `Yo'q` | **MISSING** |  |
| 11 | Avans bank tasdig'ini kutadi, PaymentConfirmedEvent | `Yo'q` | **MISSING** |  |
| 12 | Chegirma faqat 100% avansda (95%=chegirmasiz) | `Yo'q` | **MISSING** |  |
| 13 | Umumiy chegirma poli ≈15% maks, checkDiscountCap() | `Yo'q` | **MISSING** |  |
| 14 | Klishe ≈3 yil saqlash, cron ogohlantirish, hisobdan chiqarish akti | `Yo'q` | **MISSING** |  |
| 15 | Mavsum-oldi 8 hafta cron, AI tavsiya miqdor | `Yo'q` | **MISSING** |  |
| 16 | Qisman blok per_line: bitta qator Ожд.Сырьё, boshqalar davom | `Yo'q` | **MISSING** |  |
| 17 | Har rang alohida: bo'yoq=rang×qoplama%×yuza | `Qisman` | **PARTIALLY** |  |
| 18 | Shared forma avto-aniqlash + ogohlantirish (blok yo'q) | `Yo'q` | **MISSING** |  |
| 19 | CRP dan keyingi va'da → delay_risk_days, urgent flag, AI xavf | `Yo'q` | **MISSING** |  |
| 20 | ReclamationOpenedEvent→QC; ResolvedEvent→GL kredit-nota+WMS restock | `Qisman (STALE-DOC on the doc's` | **PARTIALLY** |  |
| 21 | Leaderboard Dush-Yaksh; HR ta'til kuni KPI'dan chiqadi, LeaveApprovedEvent | `Qisman (STALE-DOC on the doc's` | **PARTIALLY** |  |
| 22 | Buyurtma ID=sales_orders.id (int)+order_number; hamma modul int FK | `Qisman` | **PARTIALLY** |  |
| 23 | PDF internal/external shablon, margin rolga qarab yashirin | `Yo'q` | **MISSING** |  |
| 24 | Qisman yetkazishga alohida faktura (invoice_type='partial'), GL | `Yo'q` | **MISSING** |  |
| 25 | Bildirishnoma fallback: Telegram→SMS→email→menejer; notification_channel | `Yo'q` | **MISSING** |  |
| 26 | ABC event-based recalc; A→B alert; kredit limit avto (CreditLimitAdjustedEvent) | `Qisman` | **PARTIALLY** |  |
| 27 | Nofaol mijoz cron (tunda), crm_inactivity_rules A=90/B=60/C=30 | `Yo'q` | **MISSING** |  |
| 28 | AI Офсет vs Флексо tavsiya (blok emas), 100% yuklamada alternativ | `Yo'q` | **MISSING** |  |
| 29 | Ko'p qatorli buyurtmada per-line muddat, per_line_scheduling=true | `Yo'q` | **MISSING** |  |
| 30 | 1C raqam INN/telefon match, sd-customers-import.service; doimiy saqlash | `Yo'q` | **MISSING** |  |
| 31 | WMS EXTERNAL_OUT mashina/pallet taqqoslash, logistika ogohlantirish | `Yo'q` | **MISSING** |  |
| 32 | Папка № folder_number unique; 1 papka:N buyurtma; papka_orders VIEW | `Qisman (STALE-DOC — better tha` | **PARTIALLY** |  |
| 33 | Eng yuqori revision aktiv, eski immutable; v2>v1 avto-bekor | `Qisman` | **PARTIALLY** |  |
| 34 | Faqat menejer SHAXSIY chegirmasi bonusdan tushadi; payroll_calculations | `Yo'q` | **MISSING** |  |
| 35 | Davallческое QC karantin, QC rad→QC_HOLD; menejer hal | `Yo'q` | **MISSING** |  |
| 36 | Mijoz AI'ga qarshi marka (E1): AI xavf, menejer tasdiq, client_override_log JSONB | `Yo'q` | **MISSING** |  |
| 37 | Hisob-faktura raqami DB SEQUENCE (invoices_number_seq) atomic | `Qisman` | **PARTIALLY** |  |
| 38 | Maqsad oy o'rtasida rasmiy so'rov→yuqori tasdiq; leaderboard retroaktiv emas | `Qisman (STALE-DOC on the "lead` | **PARTIALLY** |  |
| 39 | INN/telefon dublikat QATTIQ BLOK; qo'lda merge; Coordination vazifa | `Qisman (STALE-DOC — better tha` | **PARTIALLY** |  |
| 40 | Кашировка offset+gofra sinxron: predecessor_order_id, MES hard constraint | `Yo'q` | **MISSING** |  |
| 41 | Nofaol menejer hujjatlari immutable (F5); yangi mas'ul ko'rsatiladi | `Qisman` | **PARTIALLY** |  |
| 42 | NDS BE service qatlamida (price_with_vat), tax_rates jadval; FE/PDF BE'dan | `Qisman` | **PARTIALLY** |  |
| 43 | Margin @Roles guard; SdOrderProjection::forRole query-darajasida chiqarish | `Yo'q` | **MISSING** |  |
| 44 | отгрузка+N kun hisob, OrderShippedEvent, payment_delay_days; faqat keyingi отгрузка | `Yo'q` | **MISSING** |  |
| 45 | Etiketka руlon birligi; PP rulon→dona unit_conversion_rules; WMS material_type='roll' | `Yo'q` | **MISSING** |  |
| 46 | Prosrochka bo'yicha yangi buyurtmani Daromadlar boshlig'i tasdiqlaydi; razryad RBAC; SLA 24s | `Qisman` | **PARTIALLY** |  |
| 47 | PP AI navbat 3 mezon (promised_date/ABC/yuklama); queue_position, estimated_start | `Yo'q` | **MISSING** |  |
| 48 | Muzlatilgan zona ≈3 kun; shoshilinch faqat director/egasi; urgent_order_surcharge | `Qisman` | **PARTIALLY** |  |
| 49 | AI haftalik pattern (sifat 3+ hafta) → Director+QC signal, QC CAPA avto (E3/E1) | `Qisman` | **PARTIALLY** |  |
| 50 | Distributed transaction outbox; kompensatsiya event; idempotent handler | `Qisman` | **PARTIALLY** |  |
| 51 | Buyurtma majburiy maydonlar (tur+o'lcham+tiraj+muddat+mijoz+narx) | `Qisman` | **PARTIALLY** |  |
| 52 | Mahsulot turlari qattiq ro'yxati (~15 tur) | `Yo'q` | **MISSING** |  |
| 53 | O'lcham U×K×B → avto yuza (m²) + priklad % | `Qisman (egasi-data)` | **PARTIALLY** |  |
| 54 | Tiraj birligi mahsulot turiga qarab (dona/m²/list) | `Qisman` | **PARTIALLY** |  |
| 55 | Muddat: mijoz-so'ragan + zavod-va'dasi ikki sana | `Qisman` | **PARTIALLY** |  |
| 56 | MOQ + kichik-partiya ustamasi | `Yo'q` | **MISSING** |  |
| 57 | Narx formulasi har komponent ko'rinadi | `Ha` | **FULLY** |  |
| 58 | Qog'oz narxi ombor FIFO/o'rtacha tannarxdan | `Qisman` | **PARTIALLY** |  |
| 59 | Bo'yoq (rang×qoplama%×yuza) hisobi | `Qisman` | **PARTIALLY** |  |
| 60 | Ish haqi marshrut tariflaridan yig'iladi | `Qisman` | **PARTIALLY** |  |
| 61 | Qo'shimcha operatsiyalar alohida qator+tarif | `Qisman` | **PARTIALLY** |  |
| 62 | Klishe/shtamp alohida, mijoz to'laydi, takrorda olinmaydi | `Qisman (egasi-data)` | **PARTIALLY** |  |
| 63 | Narx pog'onasi (tiraj oshsa dona narx pasayadi) | `Yo'q` | **MISSING** |  |
| 64 | Chegirma turlari ro'yxati, har biri foiz limiti | `Yo'q` | **MISSING** |  |
| 65 | Chegirmalar jamlanish shifti (~15% maks) | `Yo'q` | **MISSING** |  |
| 66 | Chegirmaga pog'onali ruxsat (0-5/5-10/10%+) | `Qisman` | **PARTIALLY** |  |
| 67 | Narx floor (tannarxdan past bloklanadi) | `Yo'q` | **MISSING** |  |
| 68 | Mijoz ABC toifasi (80/15/5) avto | `Ha` | **FULLY** |  |
| 69 | Toifaga bog'liq imtiyoz-paket avto | `Yo'q (egasi-data claim in the ` | **MISSING** |  |
| 70 | Kotirovka (KP) hujjat, raqam, PDF, convert | `Qisman` | **PARTIALLY** |  |
| 71 | Kotirovka amal muddati (14 kun) → muddati o'tgan | `Qisman` | **PARTIALLY** |  |
| 72 | Kotirovka status zanjiri + har o'tishda sana | `Qisman` | **PARTIALLY** |  |
| 73 | Kotirovka→Buyurtma aylantirish tugmasi | `Ha` | **FULLY** |  |
| 74 | Buyurtma statuslari zavod Rus statuslari | `Yo'q` | **MISSING** |  |
| 75 | IChga o'tkazish sharti (to'lov%+maket+limit OK) | `Qisman` | **PARTIALLY** |  |
| 76 | Maket/dizayn tasdig'i majburiy (imzo saqlanadi) | `Qisman` | **PARTIALLY** |  |
| 77 | Shartnoma turlari (bir martalik/ramochnyy/spets) | `Qisman` | **PARTIALLY** |  |
| 78 | Shartnoma strukturalangan shartlar (to'lov/jarima/penya) | `Yo'q` | **MISSING** |  |
| 79 | To'lov sharti turlari (100%/50-50/N kun/konsignatsiya) | `Qisman` | **PARTIALLY** |  |
| 80 | Debitor limiti mijozga (oshsa bloklanadi) | `Qisman` | **PARTIALLY** |  |
| 81 | Limit oshganda direktor tasdig'i bilan ochiladi | `Qisman` | **PARTIALLY** |  |
| 82 | Prosrochka → yangi buyurtma avto-tasdiqqa | `Qisman` | **PARTIALLY** |  |
| 83 | Qayta buyurtma tugmasi (o'lcham/dizayn/shtamp ko'chadi) | `Qisman` | **PARTIALLY** |  |
| 84 | Takrorda narx avto-qayta, eski narx yonida | `Qisman` | **PARTIALLY** |  |
| 85 | Mijoz kartasida mahsulot/dizayn arxivi | `Qisman` | **PARTIALLY** |  |
| 86 | Bir buyurtmada ko'p mahsulot (ko'p qator) | `Ha` | **FULLY** |  |
| 87 | Qisman yetkazish + qisman to'lov | `Qisman` | **PARTIALLY** |  |
| 88 | Ortiqcha/kam ICh (+/-N%), faktura real chiqimdan | `Yo'q` | **MISSING** |  |
| 89 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | `Qisman` | **PARTIALLY** |  |
| 90 | Sotuv KPI (hajm/bitim/o'rtacha/debitor/aging) | `Qisman` | **PARTIALLY** |  |
| 91 | Lead voronka (lead→kotirovka→buyurtma) | `Qisman` | **PARTIALLY** |  |
| 92 | Sotuvchi biriktiriladi + bonus marjadan | `Qisman` | **PARTIALLY** |  |
| 93 | Tasdiqlangan buyurtma avto PP'ga (oltin-ip) | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** Kod bor (Path A `update-order-status.handler.ts`), lekin **hech qachon ishlamagan**: `master_status` 0/13, `ready_for_planning` 0 buyurtma. Path B (avtomatik) uzilgan. |
| 94 | To'lov tasdiqlangach avto GL, debitor kamayadi | `Ha` | **MISSING** | ⭐ **Qayta tekshirildi.** ⛔ **Yolg'on Ha.** `markPaymentPaid` `RETURNING id,status,updated_at` — `amount` yo'q → `if (amount>0)` doim false → `postCustomerPayment()` hech qachon chaqirilmaydi. `entries` da `CP-` prefiksli qator 0 ta. |
| 95 | Mijoz kartasi rekvizitlari (INN/bank/toifa/limit) | `Ha` | **FULLY** |  |
| 96 | Mijoz unikalligi (INN/telefon dublikat) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 97 | Narx/tiraj/muddat o'zgarish jurnali | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 98 | Karta-model RBAC (menejer/rahbar/direktor) | `Qisman` | **PARTIALLY** |  |
| 99 | Buyurtma statuslari zavod Rus statuslari | `Yo'q` | **MISSING** |  |
| 100 | Ojd.Syryo → Ta'minotga material signal | `Yo'q` | **MISSING** |  |
| 101 | Bosma yo'nalishi Ofset/Flekso (+AI tavsiya) | `Yo'q` | **MISSING** |  |
| 102 | Mashina formati (72/52SM/KVA) tavsiya+narx | `Yo'q` | **MISSING** |  |
| 103 | Birlik (list/sht/m2) turdan avto | `Qisman` | **PARTIALLY** |  |
| 104 | Material kimniki — davalcheskoe belgisi | `Yo'q` | **MISSING** |  |
| 105 | Mijoz fayllari (maket/trafaret) buyurtmaga | `Qisman` | **PARTIALLY** |  |
| 106 | Buyurtma tasdig'idan TZ avto KB/DB ga (event) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 107 | Gruzopodyomnost (kg) → gofra qatlam AI tavsiya | `Yo'q` | **MISSING** |  |
| 108 | KP avto-PDF (logo+narx+to'lov+imzo) | `Yo'q` | **MISSING** |  |
| 109 | Kotirovka imzosi (komdir ism+tel) karta-modeldan avto | `Yo'q` | **MISSING** |  |
| 110 | KP yuborish huquqi faqat komdir/rahbar | `Qisman` | **PARTIALLY** |  |
| 111 | Debitor 'Daromadlar bo'limi' alohida rol | `Yo'q` | **MISSING** |  |
| 112 | Korporativ raqamdan aloqa + qo'ng'iroq jurnali (NO-2) | `Qisman` | **PARTIALLY** |  |
| 113 | Menejer ketsa mijoz avto qayta biriktiriladi | `Yo'q` | **MISSING** |  |
| 114 | Lead bosqichi + konversiya % | `Qisman` | **PARTIALLY** |  |
| 115 | Mavsumiy mahsulot signal + o'tgan yil mijoz | `Yo'q` | **MISSING** |  |
| 116 | Mahsulot katalogi ~15 toifaga moslansin | `Yo'q` | **MISSING** |  |
| 117 | Stakan/pizza maxsus o'lcham shabloni | `Yo'q` | **MISSING** |  |
| 118 | Rulonnye samokleyki rulon parametrlari | `Yo'q` | **MISSING** |  |
| 119 | Summa/Ostalos (Jami/To'langan/Qoldiq) avto | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `paid_amount` 13/13, lekin `balance_due_amount` 1/13. Avtomatik qoldiq hisobi yo'q. |
| 120 | Va'da sanasi ICh quvvatidan tasdiqlansin | `Qisman` | **PARTIALLY** |  |
| 121 | Va'da↔real → kechikish kuni+sababi | `Qisman` | **PARTIALLY** |  |
| 122 | Upakovka turi (stepler/pallet/veryovka)→vaqt+material | `Yo'q` | **MISSING** |  |
| 123 | Palletda dona soni + pallet o'lchami | `Yo'q` | **MISSING** |  |
| 124 | Klishe/forma egaligi + arxiv muddati (3 yil) | `Yo'q` | **MISSING** |  |
| 125 | Buyurtma rentabelligi real-vaqt, margin<X qizil | `Qisman` | **PARTIALLY** |  |
| 126 | Tannarx/margin RBAC (faqat rahbar+ ko'radi) | `Qisman` | **PARTIALLY** |  |
| 127 | To'lov sharti shabloni (50%+5kun; 100%; N kun) | `Qisman` | **PARTIALLY** |  |
| 128 | Otgruzka+5 kun→qoldiq muddati avto+ogohlantirish | `Qisman` | **PARTIALLY** |  |
| 129 | 100% avans → 5% chegirma avto | `Yo'q` | **MISSING** |  |
| 130 | Narx NDS'siz saqlanib QQS alohida qatorda | `Qisman` | **PARTIALLY** |  |
| 131 | Buyurtma o'zgartirish jurnali (tiraj/muddat/narx) | `Qisman` | **PARTIALLY** |  |
| 132 | Maket/dizayn tasdig'idan keyingina bosma — majburiy gate | `Qisman` | **PARTIALLY** |  |
| 133 | Reklamatsiya buyurtma+sex/uchastka+sabab kodi | `Qisman` | **PARTIALLY** |  |
| 134 | Yangi vs takror mijoz har xil oqim | `Yo'q` | **MISSING** |  |
| 135 | Faollik segmenti + ABC ikki o'lcham | `Qisman` | **PARTIALLY** |  |
| 136 | Buyurtma ID=oltin-ip, har bosqich shu ID ga | `Qisman` | **PARTIALLY** |  |
| 137 | Yetkazish fakti (haydovchi+mashina+vaqt) qayd | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** 1 ta seed qator bor, lekin `POST /sd/deliveries` jonli bazada 500 (Drizzle `uuid` vs DB `integer serial`). |
| 138 | Kongrev va tisnenie ALOHIDA operatsiya | `Yo'q` | **MISSING** |  |
| 139 | Tisnenie rangi zoloto/serebro → ombor folga | `Yo'q` | **MISSING** |  |
| 140 | Laminatsiya turi (glyants/mat/metal) ro'yxatdan | `Yo'q` | **MISSING** |  |
| 141 | Lak turi (sploshnoy/trafaret/VD) + qoplama % | `Yo'q` | **MISSING** |  |
| 142 | Kashirovka (offset+gofra) alohida operatsiya+narx | `Yo'q` | **MISSING** |  |
| 143 | Vysechka turi (avtotigel/rotatsion/plotter) | `Yo'q` | **MISSING** |  |
| 144 | Skleyka turi (avtomat/ruchnaya/FSM)→vaqt+narx | `Yo'q` | **MISSING** |  |
| 145 | Bez oborota/s oborotom (bir/ikki tomon) 2x | `Yo'q` | **MISSING** |  |
| 146 | 3-makro/3-mikro gofra turi (lug'atdan) | `Yo'q` | **MISSING** |  |
| 147 | Gofroyashik qatlami (2/3/5-sloy) + AI yuk | `Yo'q` | **MISSING** |  |
| 148 | Banderol alohida pozitsiya | `Yo'q` | **MISSING** |  |
| 149 | Latok standart SKU katalogi (Latok-449...) | `Yo'q` | **MISSING** |  |
| 150 | 'Tex opisanie po bumagam' avto-matn | `Yo'q` | **MISSING** |  |
| 151 | Marka T22/profil S markaziy lug'atdan | `Yo'q` | **MISSING** |  |
| 152 | Plyonka qalinligi (30/100 mkr) ro'yxatdan | `Yo'q` | **MISSING** |  |
| 153 | 'Papka No' buyurtmaga bog'lansin (UNIQUE) | `Qisman` | **PARTIALLY** |  |
| 154 | 'Zakaz 1S' eski raqamni ixtiyoriy saqlash | `Yo'q` | **MISSING** |  |
| 155 | Qisman yetkazish + qisman faktura | `Qisman` | **PARTIALLY** |  |
| 156 | Hisob-faktura raqami DB SEQUENCE (invoices_number_seq) atomic | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 157 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | `Yo'q` | **MISSING** |  |

### 4.3 Module-13 CRM — 135 item

| # | Vizyon itemi | Reja statusi | **Yakuniy tasnif** | Izoh / tekshiruv |
|---|---|---|---|---|
| 1 | Lid-scoring real-time trigger bilan (cron emas) | `Yo'q` | **MISSING** |  |
| 2 | Round-robin race `SELECT FOR UPDATE SKIP LOCKED` bilan | `Yo'q` | **MISSING** |  |
| 3 | Ochiq qarzda egasizlantirish bloklanadi (Finance signal) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 4 | Menejer tashrifini o'zi mobil orqali kiritadi (GPS ixtiyoriy) | `Yo'q` | **MISSING** |  |
| 5 | KP ko'rildi: email pixel + Telegram belgisi, aks holda qo'lda | `Yo'q` | **MISSING** |  |
| 6 | Narx oshganda ta'sirlangan mijoz ro'yxati + eski narx blok | `Yo'q` | **MISSING** |  |
| 7 | Qarz holati Finance'dan keshlanadi (5 daq TTL) + SD real-time tekshiruv | `Yo'q` | **MISSING** |  |
| 8 | Egasizlantirish CRON QC/Finance da'vosini tekshiradi | `Qisman` | **PARTIALLY** |  |
| 9 | Caller ID ko'p mijozda korporativ liniya flagi + qo'lda tanlash | `Yo'q` | **MISSING** |  |
| 10 | Sinov davri bayrog'i HR "sinov tugadi" eventidan avto | `Yo'q` | **MISSING** |  |
| 11 | VIP/segment har buyurtmadan keyin trigger bilan qayta hisob | `Yo'q` | **MISSING** |  |
| 12 | Kredit limiti oshganda blok + Daromadlar+direktor tasdig'i | `Qisman` | **PARTIALLY** |  |
| 13 | KP 14 kun o'tsa narx FIFO avto-yangilanadi + menejer tasdig'i | `Yo'q` | **MISSING** |  |
| 14 | Eksportda SQL `WHERE assigned_to=current_user` + field-RBAC + audit | `Yo'q` | **MISSING** |  |
| 15 | QC reklamatsiya `QcReclamationOpenedEvent` → CRM jadvaliga (bir yo'nalish) | `Yo'q` | **MISSING** |  |
| 16 | 360° ko'rinish parallel so'rov + har blok skeleton | `Yo'q` | **MISSING** |  |
| 17 | Menejer ketganda korporativ akkaunt HR'da + yozishma arxiv (read-only) | `Yo'q` | **MISSING** |  |
| 18 | AI churn vazifasi faqat CRM ichida (Kanban'ga tushmaydi) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 19 | Format o'zgarishi dialogi faqat ta'sirlangan mahsulot liniyasida | `Yo'q` | **MISSING** |  |
| 20 | "O'lcham tasdiqlandi" bayrog'i Dizayn bosqichida dizayner belgilaydi (gate) | `Yo'q` | **MISSING** |  |
| 21 | ГП blanka 3 imzo (omborchi+haydovchi+menejer) PIN F5 elektron | `Yo'q` | **MISSING** |  |
| 22 | Qayta buyurtmada diff view + har maydon alohida tasdiq | `Yo'q` | **MISSING** |  |
| 23 | Imzolangan spetsifikatsiyada ham Finance qarz bloki ustun | `Yo'q` | **MISSING** |  |
| 24 | O'zga mijoz qidiruvida faqat nom+turi (field-RBAC) + audit | `Yo'q` | **MISSING** |  |
| 25 | Ta'minot import muammosi `SupplyImportIssueEvent` → CRM vazifa+direktor panel | `Yo'q` | **MISSING** |  |
| 26 | Dizayn/STP kun limiti oshsa Dizayn bo'lim boshlig'i+sotuvchiga bildirishnoma (E5) | `Yo'q` | **MISSING** |  |
| 27 | Qog'oz zayavka profili yangi bitim formasiga pre-fill + alohida snapshot | `Yo'q` | **MISSING** |  |
| 28 | AI churn + Marketing kampaniya bir vaqtda: "faol kampaniya" flagi tekshiriladi | `Qisman` | **PARTIALLY** |  |
| 29 | Chegirma suiiste'mol bayrog'i: 90 kun 3+ marta yoki 10%+ (business.constants) | `Yo'q` | **MISSING** |  |
| 30 | Namuna buyurtmasi PP'ga "namuna" past ustuvorlik + daromad statistikasidan tashqari | `Yo'q` | **MISSING** |  |
| 31 | Korporativ raqam abonent doirasi real-time webhook + ruxsatsizda INCIDENT | `Yo'q` | **MISSING** |  |
| 32 | HR "ishdan ketdi" eventida avto-reassign + oraliqda "kutish" holati | `Qisman` | **PARTIALLY** |  |
| 33 | HR holati (ta'til/kasal/sinov) real-time round-robin'ga ta'sir (`HR_EmployeeStatusChangedEvent`) | `Yo'q` | **MISSING** |  |
| 34 | Chiqimli/chiqimsiz narx IChM ma'lumotidan avto + "chiqim normasiz" ogohlantirish | `Yo'q` | **MISSING** |  |
| 35 | ГП-kod profiliga QC "brak/rad" belgisi + qayta buyurtmada ogohlantirish | `Yo'q` | **MISSING** |  |
| 36 | "Прошло (дней)" "Yuk chiqdi"da to'xtaydi; qisman to'lov to'xtatmaydi | `Yo'q` | **MISSING** |  |
| 37 | Yutildi→bekor qilinganda KPI avto-tuzatish eventi | `Yo'q` | **MISSING** |  |
| 38 | Keyingi buyurtma eslatma vaqti AI avto-hisob (standart 30 kun) | `Yo'q` | **MISSING** |  |
| 39 | Valyuta 5%+ sakrasa KP/bitim "qayta hisob kerak" statusiga (avto yangilanmaydi) | `Yo'q` | **MISSING** |  |
| 40 | Ombor kirish talablari Logistika rejasida `sales_orders`dan avto-tortiladi | `Yo'q` | **MISSING** |  |
| 41 | Yutqazilgan bitim root-cause real-time Director dashboard + haftalik hisobot | `Qisman` | **PARTIALLY** |  |
| 42 | "Menejer fikri/hohishi" strukturali (kategoriya+matn) + AI onboarding tavsiya | `Yo'q` | **MISSING** |  |
| 43 | Korporativ raqam nazorati real-time + ruxsatsizda INCIDENT (НО-2) | `Yo'q` | **MISSING** |  |
| 44 | Korporativ kanal bypass texnik to'liq oldini olib bo'lmaydi — НО-2+siyosat+HR | `Yo'q` | **MISSING** |  |
| 45 | Leaderboard haftalik (Monday reset), faqat "Yutdik"; forecast alohida | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 46 | Mas'ul operator/usta PP rejalashtirishda "tavsiya" (majburiy emas) | `Yo'q` | **MISSING** |  |
| 47 | "Asosiy mijoz" bayrog'i PP'ga `sales_orders` event orqali + WMS bron | `Qisman` | **PARTIALLY** |  |
| 48 | CRM audit tizim-wide `audit_log`ga (A6, 7 yil) + `WHERE module='CRM'` filtr | `Yo'q` | **MISSING** |  |
| 49 | Klishe/STP 3 kun javob yo'q→Dizayn boshlig'i; 7 kun→Vysotskiy-7 bir daraja yuqori (E5) | `Yo'q` | **MISSING** |  |
| 50 | CRM oflayn (PWA): lid+faollik mumkin, KP faqat onlayn; conflict=server ustun | `Yo'q` | **MISSING** |  |
| 51 | Lid→bitim voronka + bosqich konversiyasi | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `funnel.service.ts` real, lekin FE sahifasi `CrmFunnelAnalytics` — **orphan** (`/crm/funnel`). Ustiga `PATCH /crm/deals/close` BE'da yo'q. |
| 52 | Voronka bosqichlarini kim belgilaydi (zavod jarayoni) | `Yo'q` | **MISSING** |  |
| 53 | Ko'p manba + manba majburiy | `Ha` | **FULLY** |  |
| 54 | Vebsayt+Telegramdan avto lid + bildirishnoma | `Ha` | **FULLY** |  |
| 55 | Avto sotuvchiga biriktirish (round-robin/hudud) | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `pickNextSalesManager()` real, lekin `employees` da `role='sales_manager'` **0 ta** -> doim `null` -> `crm_leads.assigned_to` 0/16. |
| 56 | Faollik jurnali (qo'ng'iroq/xat/uchrashuv) | `Qisman` | **PARTIALLY** |  |
| 57 | Aloqa kanallari (SMS/Email/TG/WhatsApp) kartada | `Qisman` | **PARTIALLY** |  |
| 58 | Yozishma tarixi avto kartada | `Qisman` | **PARTIALLY** |  |
| 59 | Vazifa+eslatma+eskalatsiya | `Qisman` | **PARTIALLY** |  |
| 60 | Kechikkan vazifa boshliq paneliga | `Qisman` | **PARTIALLY** |  |
| 61 | Hot-lead avto ajratish (faollik+summa) | `Ha` | **FULLY** |  |
| 62 | Lead scoring 5 mezon vaznli ball | `Qisman` | **PARTIALLY** |  |
| 63 | AI Next Best Action (taklif+inson tasdiq) | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `getNextBestAction()` obyekt qaytaradi, natija saqlanmaydi (faqat FE state); inson-tasdiq oqimi yo'q. |
| 64 | AI churn bashorati + qaytarish vazifasi | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `churn.service.ts` real; lekin `POST /crm/ai/churn` (`crm-extended.service.ts:167-169`) hardcoded `{churnRisk:'low',score:0}`. Qaytarish vazifasi yaratilmaydi. |
| 65 | Mijoz 360° (buyurtma+to'lov+qarz+shikoyat) | `Ha` | **FULLY** |  |
| 66 | Oltin ip: bitim yutilsa→sales_order avto | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `deal-won.listener.ts` kanonik yaratuvchi. Lekin `won` deal (1 ta) da `sales_order_id` NULL, `sales_orders.deal_id` 0/13 -> hech qachon ishlamagan. |
| 67 | Yagona kanonik mijoz bazasi | `Ha` | **FULLY** |  |
| 68 | Mijoz segmentlari (VIP/asosiy/oddiy) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 69 | RFM/CLV panel | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** `rfm/clv/kmeans.service.ts` bor, lekin FE paneli `CrmRfmClusters` — **orphan** (`/crm/rfm`). |
| 70 | Yutqazish sababi majburiy + hisobot | `Qisman` | **PARTIALLY** |  |
| 71 | KP tayyorlash+yuborish+holat kuzatish | `Qisman` | **PARTIALLY** |  |
| 72 | Karta-model integratsiya (sotuvchi o'ziniki) | `Qisman` | **PARTIALLY** |  |
| 73 | Yopilgan bitim→sotuvchi KPI/ЦКП avto | `Qisman` | **PARTIALLY** |  |
| 74 | Qarz limitidan oshsa blok+tasdiq | `Qisman` | **PARTIALLY** |  |
| 75 | Shikoyat/reklamatsiya kartada qizil belgi | `Qisman` | **PARTIALLY** |  |
| 76 | Avto follow-up kampaniyalari (30/60/90) | `Qisman` | **PARTIALLY** |  |
| 77 | Boshliq CRM dashboard (voronka+reyting+signal) | `Ha` | **PARTIALLY** | ⭐ **Qayta tekshirildi.** Reja `Ha` deydi; FE sahifasi **tekshirilmagan** (sidebar'da alohida yozuv yo'q). |
| 78 | Telefon qo'ng'irog'ini yozib kartaga | `Yo'q` | **MISSING** |  |
| 79 | Mobil CRM (sotuvchi tashqarida) | `Qisman` | **PARTIALLY** |  |
| 80 | Ma'lumot kirish chegarasi (o'ziniki) | `Qisman` | **PARTIALLY** |  |
| 81 | НО-2: korporativ raqam menejer kartasiga | `Yo'q` | **MISSING** |  |
| 82 | НО-2: abonent doirasi cheklovi + flag | `Yo'q` | **MISSING** |  |
| 83 | НО-2: qo'ng'iroq nazorati Инспекция paneliga | `Yo'q` | **MISSING** |  |
| 84 | Сифат boshlig'i↔mijoz aloqasi kartada | `Qisman` | **PARTIALLY** |  |
| 85 | Korporativ TG/biznes-akkaunt→CRM, menejer ketsa qoladi | `Yo'q` | **MISSING** |  |
| 86 | Debitor qarz Даромадлар bo'limiga (savdoda emas) | `Yo'q` | **MISSING** |  |
| 87 | Qarz holatini faqat Finance yangilaydi | `Qisman` | **PARTIALLY** |  |
| 88 | Qarz aloqasi bir tarixda ko'rinadi | `Yo'q` | **MISSING** |  |
| 89 | Папка№ — buyurtma papkasi kartada | `Yo'q` | **MISSING** |  |
| 90 | Прошло (дней) — avto hisoblagich+limit signal | `Qisman` | **PARTIALLY** |  |
| 91 | Mijoz qog'oz profili saqlash+pre-fill | `Yo'q` | **MISSING** |  |
| 92 | Примечание papkadan kartaga | `Yo'q` | **MISSING** |  |
| 93 | ГП-kod takror buyurtma tugmasi | `Yo'q` | **MISSING** |  |
| 94 | Mahsulot konstruksiya parametrlari kartada | `Yo'q` | **MISSING** |  |
| 95 | Mijoz maket/logotip kutubxonasi (versiyalar) | `Yo'q` | **MISSING** |  |
| 96 | ГП topshirish 3-imzo elektron blanka | `Yo'q` | **MISSING** |  |
| 97 | Yetkazilgach karta yangilash + follow-up | `Qisman` | **PARTIALLY** |  |
| 98 | Haydovchi/transport mijoz kartasida | `Yo'q` | **MISSING** |  |
| 99 | Razmer plan↔aslida farqi qulf+flag | `Yo'q` | **MISSING** |  |
| 100 | Format o'zgarishi elektron rozilik | `Yo'q` | **MISSING** |  |
| 101 | Dizayn/o'lcham kelishuvi alohida voronka bosqichi | `Yo'q` | **MISSING** |  |
| 102 | Шошилмаслик — o'lcham tasdiqsiz PP ga o'tmaydi | `Yo'q` | **MISSING** |  |
| 103 | Mijoz mahsulot/biznes profili (nima qadoqlaydi) | `Qisman` | **PARTIALLY** |  |
| 104 | Asosiy mijoz bayrog'i+ustuvorlik+zaxira | `Qisman` | **PARTIALLY** |  |
| 105 | Mijoz kg-trend + pasayish signali | `Yo'q` | **MISSING** |  |
| 106 | Чиқимли/чиқимсиз narx varianti | `Yo'q` | **MISSING** |  |
| 107 | Qog'oz narxi o'zgarsa→qayta-narx vazifasi | `Yo'q` | **MISSING** |  |
| 108 | Mijoz×format narx jadvali | `Yo'q` | **MISSING** |  |
| 109 | Yutilgan bitim→PP reja navbatiga avto | `Qisman` | **PARTIALLY** |  |
| 110 | Muddat stanok yukidan avto hisob | `Yo'q` | **MISSING** |  |
| 111 | Mahsulot→stanok marshruti, muddat navbatdan | `Yo'q` | **MISSING** |  |
| 112 | Савдо рахбари=hamma, менежер=o'ziniki | `Qisman` | **PARTIALLY** |  |
| 113 | Egasizlantirmaslik: N kun faolliksiz→reassign | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan — reja tuzatgan. |
| 114 | Menejer kunlik kg+summa boshliqqa | `Qisman` | **PARTIALLY** |  |
| 115 | Yangi menejer mentor davri (RD-4) gate | `Yo'q` | **MISSING** |  |
| 116 | Ommaviy eksport blok+ruxsat+log | `Yo'q` | **MISSING** |  |
| 117 | Kontakt ko'rish chegarasi (field-level) | `Yo'q` | **MISSING** |  |
| 118 | CRM audit jurnali Инспекция ko'rinadi | `Qisman` | **PARTIALLY** |  |
| 119 | Avans bayrog'i+foiz, avanssiz PP ga o'tmaydi | `Yo'q` | **MISSING** |  |
| 120 | Odatiy to'lov turi mijozda (naqd/o'tkazma/bartar) | `Yo'q` | **MISSING** |  |
| 121 | USD-bog'liq narx + kurs ogohlantirish | `Yo'q` | **MISSING** |  |
| 122 | Brak/qaytarish kartada + sabab kodi | `Qisman` | **PARTIALLY** |  |
| 123 | Ochiq reklamatsiya→yangi yuk ogohlantirish | `Yo'q` | **MISSING** |  |
| 124 | Kompensatsiya/chegirma tarixi+suiiste'mol flag | `Yo'q` | **MISSING** |  |
| 125 | Oylik диог mijoz kesimida (kg) | `Yo'q` | **MISSING** |  |
| 126 | Yillik hajm mijoz kesimida (top ro'yxat) | `Qisman` | **PARTIALLY** |  |
| 127 | Buyurtma↔tayyor↔chiqarilgan real-vaqt kartada | `Qisman` | **PARTIALLY** |  |
| 128 | Mijoz ostida mahsulot liniyalari (narx/hajm/brak) | `Yo'q` | **MISSING** |  |
| 129 | STP/format versiya tarixi | `Yo'q` | **MISSING** |  |
| 130 | Korp-raqam aloqa teglash (mijoz/shaxsiy) | `Yo'q` | **MISSING** |  |
| 131 | Import-bog'liqlik toifasi + ta'sirlangan mijoz | `Yo'q` | **MISSING** |  |
| 132 | Mijoz ombor kirish talablari saqlash | `Yo'q` | **MISSING** |  |
| 133 | Kelishilgan o'rash/qadoqlash usuli kartada | `Yo'q` | **MISSING** |  |
| 134 | Namuna/Академияga sotuvdan ajratish | `Yo'q` | **MISSING** |  |
| 135 | Mijoz↔mas'ul operator/usta tarixi | `Yo'q` | **MISSING** |  |
---

## 5. MODERNIZATSIYA BO'SHLIQLARI

> **Qamrov cheklovi:** bu bo'lim **yangi sahifa taklif qilmaydi**. Har bir taklif §1 dagi 15 sahifadan bittasini nomlaydi va uni kuchaytiradi.
> **Manba:** umumiy ERP/CRM domen bilimi (veb-qidiruv ishlatilmadi). Ishonchsiz joylar aniq belgilangan.

### 5.1 Bugun mavjud analitik "dvigatel"lar

Muhim nuance: EuroPrint'da analitik **servislar** bor, lekin ularning ko'pchiligi **orphan sahifa** ortida yoki umuman yuzaga chiqmagan.

| Servis (mavjud) | Fayl | Bugun qayerda ko'rinadi |
|---|---|---|
| Voronka + bosqich konversiyasi | `crm/analytics/funnel.service.ts` | `CrmFunnelAnalytics` — **orphan** |
| RFM / CLV / k-means klasterlash | `crm/analytics/{rfm,clv,kmeans}.service.ts` | `CrmRfmClusters` — **orphan** |
| Churn bashorati + qayta-o'qitish | `crm/analytics/{churn,churn-retrain}.service.ts` | Hech qayerda (compat endpoint hardcoded) |
| Kogorta tahlili | — | `CrmCohortAnalysis` — **orphan** |
| Mijoz ABC (Pareto 80/15/5) | `sd/application/customer-abc.service.ts` | `/sd/customers` (ABC nishoni) ✅ |
| Mijoz 360° | `drizzle-sd-customers/customer-360.builder.ts` | `/sd/customers/:id` ✅ |
| Debitor qarzdorlik yoshi (aging) | `sd-payments.repository.ts:43 getDebitors` | `SDDebitors` — **orphan** |
| Oylik savdo trendi | `/api/sales/analytics/monthly-trend` | `/sd/dashboard` ✅ |
| Kvota / leaderboard / menejer amallari | `sd-dashboard.repository.ts` | `/sd/dashboard` ✅ |
| Narx formulasi (komponentlar bo'yicha) | `sd-quotations.service.ts:118-124` | `/sd/sales-quotes` ✅ (lekin CREATE 400) |

⭐ **Asosiy xulosa:** modulning eng katta analitik bo'shlig'i **yangi hisobot yozish emas** — allaqachon yozilgan to'rt servisni (voronka, RFM/CLV, churn, kogorta) mavjud sahifalarga **ulash**.

### 5.2 (a) Ma'lumot-analitika bo'shliqlari

| # | Bo'shliq | Bugun bormi | Qaysi mavjud sahifani kuchaytiradi |
|---|---|---|---|
| A1 | **Voronka konversiyasi va bosqich-vaqti** | Servis bor, sahifasi orphan | `/crm-workspace` — Kanban ustunlari ustiga konversiya % va o'rtacha bosqichda-turish kuni |
| A2 | **RFM segmentlari va CLV** | Servis bor, sahifasi orphan | `/sd/customers` — mijoz qatoriga RFM-segment ustuni; `/sd/customers/:id` (360°) ga CLV bloki |
| A3 | **Churn xavfi** | Servis bor, hech qayerda | `/sd/customers` ro'yxatida xavf nishoni; `/crm-workspace` da xavfli bitim bayrog'i |
| A4 | **Kogorta ushlab qolish (retention)** | Sahifa orphan | `/sd/dashboard` — oylik kogorta issiqlik xaritasi bloki |
| A5 | **Debitor qarzdorlik yoshi (0-30/31-60/61-90/90+)** | `getDebitors` bor, sahifasi orphan | `/sd/sales-payments` — hozir shunchaki to'lov ro'yxati; aging bloki qo'shilsa sahifaning maqsadi to'liq bo'ladi |
| A6 | **DSO (o'rtacha inkasso kuni) va to'lov xulqi** | ❌ yo'q | `/sd/sales-payments` + `/sd/dashboard` |
| A7 | **Kotirovka→buyurtma konversiya darajasi va yopilish vaqti** | ❌ yo'q (`sd_quotations` = 0 qator) | `/sd/sales-quotes` — sarlavha KPI qatori |
| A8 | **Chegirma sizishi / marja realizatsiyasi** (rejalashtirilgan marja ↔ haqiqiy) | Narx formulasi marja hisoblaydi, lekin **taqqoslash yo'q** | `/sd/sales-quotes` va `/sd/kpi` |
| A9 | **Yo'qotish sabablari klasteri** (`sd_lost_orders.reason_code` mavjud) | Ma'lumot yig'iladi, **tahlil yo'q** | `/sd/lost-orders` — sabab bo'yicha Pareto diagrammasi |
| A10 | **Prognoz aniqligi** (bashorat ↔ fakt) | `SDSalesManagement` forecast tabi — **orphan** | `/sd/kpi` |
| A11 | **Avans yig'ilish darajasi va muddati o'tganlar** | ❌ yo'q (sahifa literal `0` ko'rsatadi) | `/sd/advance-control` — asosiy maqsadi shu |
| A12 | **Menejer bo'yicha pipeline tezligi** (bitim/hafta, o'rtacha chek) | Leaderboard bor, tezlik yo'q | `/sd/dashboard` |
| A13 | **Mijoz kontsentratsiyasi xavfi** (top-5 mijoz ulushi) | ABC bor, kontsentratsiya yo'q | `/sd/dashboard` |
| A14 | **Shartnoma muddati tugashi ogohlantirishi** | `valid_until` yoziladi, kuzatuv yo'q | `/sd/contracts` |

> **Ishonchsiz:** A6 (DSO) uchun `payments.paid_date` va `invoices.due_date` mavjudmi — `payments` bo'sh (0 qator), shuning uchun ustunlar bor-yo'qligini tasdiqlay olmadim. Amalga oshirishdan oldin sxema tekshirilishi kerak.

### 5.3 (b) AI-yordamchi bo'shliqlari (faqat mavjud sahifalar ichida)

Har bir taklif — **mavjud sahifaga qo'shiladigan yordamchi**, alohida sahifa emas.

| # | AI yordami | Qaysi mavjud sahifada | Nimaga tayanadi (bugun bor) |
|---|---|---|---|
| B1 | **Xavfli bitim bayrog'i** — uzoq turgan / faolliksiz bitimlarni ajratish | `/crm-workspace` | `churn.service.ts` + `crm_activities` |
| B2 | **Keyingi eng yaxshi harakat** (taklif + inson tasdig'i) | `/crm-workspace` (bitim kartasi ichida) | `crm-ai.service.ts:94 getNextBestAction()` — bugun natija **saqlanmaydi** |
| B3 | **Dublikat lid ogohlantirishi** yaratish paytida | `/crm-workspace` (QuickCreateModal) | ⭐ `CrmDedupController` (`crm/lead-dedup`) **allaqachon mavjud**, FE ishlatmaydi |
| B4 | **To'lov anomaliyasi** — g'ayrioddiy summa/sana/takroriy to'lov | `/sd/sales-payments` | Bugun anomaliya aniqlash yo'q; `payments` ustida qurish mumkin |
| B5 | **To'lov sanasi bashorati** (mijoz xulqi asosida) | `/sd/sales-payments` | Ishonchsiz — tarixiy to'lov ma'lumoti hozircha 0 qator |
| B6 | **Kotirovka yutish ehtimoli** | `/sd/sales-quotes` | `crm-lead-scoring` formulasi qayta ishlatilishi mumkin |
| B7 | **Narx/marja qo'riqchisi** — marja pol ostiga tushsa ogohlantirish | `/sd/sales-quotes` | `calculatePrice()` marjani qaytaradi; chegara `sd/settings` da |
| B8 | **Kredit-limit tavsiyasi** to'lov tarixidan | `/sd/customers` (mijoz kartasi) | `credit_limit` ustuni bor (16/16), tarix kerak |
| B9 | **Churn xavfi nishoni + saqlab qolish taklifi** | `/sd/customers` ro'yxati | `churn.service.ts` |
| B10 | **Avans darvozasi tushuntiruvchisi** — "nega bu buyurtma bloklangan" | `/sd/sales-orders` (buyurtma detali) | ⭐ Ayni hozir foydali bo'lardi: darvoza sababini hech kim ko'rmaydi (P0-1) |
| B11 | **Muddati o'tgan avanslarni ustuvorlashtirish** | `/sd/advance-control` | Sahifaning haqiqiy maqsadi shu |
| B12 | **Yo'qotish sababini avto-tasniflash** (erkin matndan kodga) | `/sd/lost-orders` | `reason_text` + `reason_code` ikkalasi ham yoziladi |
| B13 | **Kvota-prognoz hikoyasi** ("shu sur'atda oy oxirida 82%") | `/sd/kpi` | Leaderboard + quota ma'lumoti bor |
| B14 | **AI natijalarini saqlash va audit izi** | `/ai/crm` | Bugun natijalar faqat FE state'da — hech qanday tarix yo'q |
| B15 | **Anomaliya hikoyasi** (dashboard'da "nima o'zgardi") | `/sd/dashboard` | Trend ma'lumoti bor |

> **Halol cheklov:** B5 va B8 tarixiy to'lov ma'lumotiga tayanadi; `payments` jadvali bugun **0 qator**. Ular P0-3 tuzatilib, real to'lovlar to'plangandan keyin ma'noli bo'ladi. Buni "best practice" deb emas, **kutish sharti** deb belgilayman.
> **Ishonchsiz:** `CrmAiService` ichida haqiqiy LLM chaqiruvi bormi yoki evristikami — tekshirilmadi. B1/B2/B6 ni loyihalashdan oldin shu aniqlanishi kerak.

---

## 6. YAKUNIY TAVSIYALAR (34 ta)

Yagona raqamlangan ro'yxat. Har biri: tavsiya · manba · og'irlik.
Tartib — **ustuvorlik bo'yicha**, guruh bo'yicha emas.

| # | Tavsiya | Manba | Og'irlik |
|---|---|---|---|
| 1 | `sales_orders` ning avans ustunlarini kanonizatsiya qilish (`advance_required`+`advance_paid`+`total_amount` **yoki** `advance_percent`+`advance_paid_amount`+`total_value`) — hozir yozuvchi bir juftga, darvoza boshqasiga tegadi | §3.1, P0-1 | **P0** |
| 2 | `tech_bom/routing/card_approved` ni `execSdSalesOrderUpdate` orqali saqlash — hozir butun BE'da yozuvchi 0 ta | §0.2, P0-2 | **P0** |
| 3 | 1 va 2 ni **birga** chiqarish, chunki alohida chiqsa darvoza baribir yopiq; birga chiqsa Trigger-6 birinchi marta uyg'onadi (PP reja + bo'lim fan-out) | §3.5 | **P0** |
| 4 | `markPaymentPaid` `RETURNING` ga `amount` qo'shish — hozir GL legi hech qachon bajarilmaydi (`entries` da `CP-` 0 ta) | §0.2, N2 | **P0** |
| 5 | 4 bilan **birga** `Number(id)` uuid nuqsonini tuzatish, aks holda barcha to'lovlar `CP-0` referensida to'qnashadi | N3 | **P0** |
| 6 | `POST /sd/payments` ni camelCase→snake_case moslashtirish (`orderId`/`customerId`/`dueDate` hozir jimgina yo'qoladi) | Part 1 P0-3 | **P0** |
| 7 | Taklifnoma yaratishni tuzatish: FE `calcForm` da `product_id` yo'q, Zod uni majburiy qiladi → CREATE **doim 400** (`sd_quotations` = 0 qator, izchil) | Part 1 | **P0** |
| 8 | `/erp/sales` (Sotish Paneli) SAP-shim'ini hal qilish — repo `body['totalAmount']` o'qiydi, FE bu nomni umuman yubormaydi → `net_value`/`total_value` doim 0 | §1, D4 | **P0** |
| 9 | `employees.role` master-datasini to'ldirish — 31/31 NULL; round-robin va Batch-1 scoping ikkalasi shu sababdan ishlamaydi | §0.4 | **P0** |
| 10 | `crm_leads.assigned_to` va `deals.assigned_to` ni backfill qilish (16 va 5 qator) — aks holda 9 tuzatilgach ham eski qatorlar ko'rinmaydi | §3.3 | **P1** |
| 11 | Avans to'lovini GL ga joylash — hozir `advance_paid` yangilanadi, hech qanday ledgerga tushmaydi (DR/CR hisoblar = egasi qarori) | N4 | **P1** |
| 12 | Overpay gardini tuzatish — `invoices.sales_order_id` uuid, integer bilan solishtiriladi, xato yutiladi, tekshiruv o'tkazib yuboriladi | N5 | **P1** |
| 13 | `deliveries` sxema driftini hal qilish (Drizzle `uuid` ↔ jonli `integer serial`) — `POST /sd/deliveries` hozir 500 qaytaradi | N6 | **P1** |
| 14 | `delivery_items` yozuvchisini qurish — jadval bor, INSERT kodi butun repoda **0 ta**; usiz #51 zanjiri hech qachon ishlamaydi | N7 | **P1** |
| 15 | `#51` (`DELIVERY_51_DISABLED`) bo'yicha qaror — FG hozir POS zayavkasidan kamayadi; ikkalasi yoqilsa **ikki marta kamayish** | N8, §3.5 | **P1** |
| 16 | Mijoz yaratishda tushib qolayotgan 5 maydon (`customerType`, `industry`, `source`, `creditLimit`, `paymentTermsDays`) — ustun qo'shish yoki formadan olib tashlash | Part 1 | **P1** |
| 17 | Shartnoma yaratishda tushib qolayotgan 3 maydon (`start_date`, `total_amount`, `payment_terms`) — aynan ro'yxat ko'rsatmoqchi bo'lgan maydonlar | Part 1 | **P1** |
| 18 | Buyurtma-yaratish sehrgaridagi 9 maydon (`texnolog`, `menedzherZakaza`, `krasok`, …) | Part 1 | **P1** |
| 19 | `QuickCreateModal` ning 3 buzuq create'i (deal / kontakt / kompaniya) — FE↔BE maydon shartnomasi mos emas, doim 400 | Part 1 | **P1** |
| 20 | Yaratilgan deal'ga `assigned_to` yozish — hozir NULL, yaratuvchi o'z bitimini ko'rmaydi | Part 1, §3.3 | **P1** |
| 21 | `GET /api/sd/payments/export` ni qurish yoki CSV tugmasini olib tashlash — hozir 404 | Part 1 | **P2** |
| 22 | `PATCH /api/crm/deals/close` — BE'da yo'q, so'rov `@Patch(':id')` ga `id='close'` bilan tushadi va hech narsa qilmaydi | Part 1 | **P1** |
| 23 | Class-`@Roles` yo'q controllerlarni yopish (`/sd/orders`, `/sd/customers`, `/sd/leads`, `/papka-orders`, `/crm/contacts`, `/crm/companies`, `/crm/activities`) — `RolesGuard` metadata topmasa `true` qaytaradi | Part 1 §7 | **P1** |
| 24 | Satr-scoping qamrovini kengaytirish (taklifnoma, buyurtma, shartnoma, to'lov, mijoz) yoki "hamma hammani ko'radi" siyosatini rasmiylashtirish | Part 1 §8 | **P1** |
| 25 | `/sd/leads` bypass'ini yopish — `crm_leads` ni `@Roles` siz va owner-filtrsiz o'qiydi, Batch-1 ni butunlay aylanib o'tadi | Part 1 §8 | **P1** |
| 26 | 3 alias-marshrutni o'chirish (`/ai-crm`, `/sd/quotations`, `/sd/manager-panel`) — komponentlar tirik, faqat ortiqcha yozuv | §2.1 | **P2** |
| 27 | 12 o'lik sahifa bo'yicha qaror (~6732 qator). ⚠️ `SDDeliveries` (#51 uchun kerak bo'lishi mumkin), `SDDebitors` (A5 uchun kerak), `CrmFunnelAnalytics`/`CrmRfmClusters` (vizyon M13 #51/#69 shularga tayanadi) — **o'chirishdan oldin §5 qarori kerak** | §2.2 | **P2** |
| 28 | `OrdersRegistry` o'chirilsa `OrdersRegistryCompatController` (2 route) ham o'chirilsin — yagona iste'molchi | §2.2 | **P2** |
| 29 | D3 `SDEuroprint` (`/sd/crm`) — butun SD klasterining orphan takrori; o'chirish nomzodi | §2.2 | **P2** |
| 30 | D9 `SDOverviewDashboard` — `/sd/dashboard` bilan bir xil endpoint, orphan | §2.2 | **P2** |
| 31 | Mavjud analitik servislarni (voronka, RFM/CLV, churn, kogorta) **mavjud sahifalarga ulash** — yangi sahifa qurmasdan; bu modulning eng katta "arzon" yutug'i | §5.1, §5.2 A1-A4 | **P1** |
| 32 | `/sd/advance-control` ni haqiqiy manbaga ulash — hozir `papka_orders` (0 qator) o'qiydi va ikkita literal `0` ko'rsatadi; u `sales_orders.advance_*` ni ko'rsatishi kerak | Part 1, §5.2 A11 | **P1** |
| 33 | `/sd/sales-payments` ga debitor-aging blokini qo'shish (`getDebitors` allaqachon yozilgan, orphan sahifada) | §5.2 A5 | **P2** |
| 34 | `CrmDedupController` (`crm/lead-dedup`) ni `QuickCreateModal` ga ulash — dublikat lid ogohlantirishi; BE allaqachon mavjud, FE ishlatmaydi | §5.3 B3 | **P2** |

**Og'irlik taqsimoti:** P0 = 9 · P1 = 17 · P2 = 8 · **Jami 34**

> **Halollik izohi:** 34 ta tavsiyaning hammasi §1-§5 dagi aniq topilmadan kelib chiqadi. To'ldiruvchi ("filler") item kiritilmadi. Agar 30 tadan kam haqiqiy item bo'lganda, shuni aytardim.

---

## 7. Ishonch darajasi

**Yuqori** (shaxsan `file:line`, jonli `SELECT` yoki rollback-probe bilan): §0 ning barcha qayta-tekshiruvlari · §2 orphan ro'yxati · §3 zanjir uzilishlari · §4 dagi 21 `Ha` itemning qayta baholanishi · `employees.role` ochligi (§0.4).

**O'rta** (master-reja evidence'iga tayanadi, tanlab tekshirdim): §4 dagi qolgan 271 itemning statusi. Reja ularni 30 read-only agent bilan jonli kodga solishtirib ishlab chiqqan; men `Ha` bo'lganlarini to'liq, `Qisman`/`Yo'q` bo'lganlaridan namunani tekshirdim.

**Tekshirilmagan / ishonchsiz:**
- Hech bir oqim **runtime'da haydab ko'rilmadi** (read-only faza). "Path A ishlardi" — statik xulosa.
- `CrmAiService` ichida haqiqiy LLM chaqiruvi bormi — noma'lum (§5.3 ga ta'sir qiladi).
- M13 #77 ("Boshliq CRM dashboard") uchun FE sahifasi qaysi ekani aniqlanmadi.
- A6 (DSO) uchun kerakli ustunlar (`paid_date`, `due_date`) mavjudligi — `payments` bo'sh bo'lgani uchun tasdiqlanmadi.
- `crm-bitrix/*` marshrutlarining scope holati.
- Marketing moduli (Module-14, 99 item) — bu tahlir qamrovidan tashqarida.

---

*Hisobot 2026-07-10 da 🔵 Tahlilchi rolida tuzildi. Kod, sxema, ma'lumot o'zgartirilmadi. Keyingi qadam — egasi qarori (Phase 2).*
