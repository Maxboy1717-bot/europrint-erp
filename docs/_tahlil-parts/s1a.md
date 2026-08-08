# SECTION 1 — MODUL STATUS (s1a): Savdo/CRM, SD, Marketing, Dizayn, QC

> Manba: jonli kod (`apps/api/src/modules/<modul>/**/*.controller.ts`) + jonli DB (`node _audit/q.cjs`, read-only).
> Tasnif: REAL · 501-stub · yashil-yolg'on (200 qaytaradi, DB ga yozmaydi/o'qimaydi) · dublikat.
> ESLATMA: Jonli DB `europrint` qurilish bosqichida — deyarli BO'SH. Hamma modul jadvali 0 qator.
> Demak "0 qator" ishlatilmaganni emas, **data hali kiritilmaganni** bildiradi (memory: reference_live_db_location).

---

## Umumiy raqamlar (5 modul)

| Modul | Jami route | REAL | 501-stub | Yashil-yolg'on | Dublikat (alias) |
|-------|-----------:|-----:|---------:|---------------:|-----------------:|
| Savdo/CRM (crm) | 121 | 119 | 0 | 1 | 1+ (yo'l alias) |
| SD (sd + sales) | 106 | 106 | 0 | 0 | bir nechta GET/PUT alias |
| Marketing | 108 | 100 | 8 | 0 | 0 |
| Dizayn (design) | 22 | 19 | 1 | 2 | 0 |
| QC (qc + print) | 80 | 79 | 0 | 1 | bir nechta PATCH/POST alias |
| **JAMI** | **437** | **423** | **9** | **4** | — |

Umumiy holat: 4 modulning 5 controller-guruhi ham asosan REAL (service/CQRS/repo orqali jonli DB). Faqat 9 ta 501-stub (hammasi marketing+design da, AI/DDL-kutilayotgan) va 4 ta yashil-yolg'on bor.

---

### Savdo/CRM (crm)

- Jami route: 121 · REAL: 119 · 501-stub: 0 · yashil-yolg'on: 1 · dublikat: 1+ alias
- 15 controller: leads(9), deals(8), companies(17), contacts(6), activities(7), extras(10), comms(4), custom-fields(6), ai(6), ai-extended(12), auto-lead(8), bitrix-compat(14), followup-compat(5), leads-ops(4), analytics(5).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| CrmLeads create/list/update/qualify | REAL | crm-leads.controller.ts:148-203 → LeadsService → `db.insert(crmLeads)` drizzle-crm-leads.repo.ts:114 |
| CrmLeadsOps convert/update/delete | REAL | crm-leads-ops.controller.ts:55-111 (CommandBus → CQRS handler) |
| CrmDeals create/markWon/patch/delete | REAL | crm-deals.controller.ts:108-203 (CommandBus + DealsService) |
| CrmCompanies CRUD + lead-stages + contacts | REAL | crm-companies.controller.ts:53-244 (CrmCompaniesService) |
| CrmActivities CRUD/complete | REAL | crm-activities.controller.ts:42-132 (CrmActivitiesService) |
| CrmExtras comments/tasks/history/pipeline | REAL | crm-extras.controller.ts:45-144 (CrmExtrasService) |
| CrmComms sendEmail/Sms/Whatsapp/meeting | REAL (log) | crm-comms.service.ts:16-39 — repo.logEmail/logSms ga **yozadi**; "yuborildi" emas, halol log |
| CrmBitrixCompat robots/proposals/invoices | REAL | crm-bitrix-compat.controller.ts:51-140 (CrmBitrixCompatService) |
| CrmAi analyze/score/forecast/NBA | REAL | crm-ai.controller.ts:44-109 (CrmAiService — DB-based heuristic) |
| CrmAutoLead ingest call/form/tg/website | REAL | crm-auto-lead.controller.ts:79-114 (CrmAutoLeadService) |
| CrmAnalytics funnel/cohort/rfm/churn | REAL | crm-analytics.controller.ts (Funnel/Cohort/KMeans/Churn servislar) |
| **crm/ai/nba/create-task** | **YASHIL-YOLG'ON** | **crm-ai-extended.controller.ts:137-141 — `return { created: true, taskId: Date.now() }` — DB ga YOZMAYDI** |
| CrmAiExtended postNba/postChurnRescue/scoreLeadV2 | REAL (transform) | crm-ai-extended.controller.ts:146-259 — real svc natijasini FE shakliga o'giradi |
| Dublikat: quick-score, churn-rescue, nba | alias | auto-lead + ai-extended ikkalasida `crm/quick-score/:type/:id`, `crm/nba`, `crm/churn-rescue` — bir-biriga yaqin yo'llar |

- DB: crm_leads (BASE, 0), crm_companies (0), crm_contacts (0), crm_activities (0), crm_comments (0), crm_history (0), crm_tasks (0), crm_proposals (0), crm_robots (0), crm_lead_stages (0). **crm_deals / crm_invoices / crm_products = VIEW** (base emas).
- Holat: CRM to'liq xizmat/CQRS bilan ulangan, jonli DB ga yozadi/o'qiydi. Yagona haqiqiy nuqson: `nba/create-task` soxta-create (qolgan NBA yo'llari real).

---

### SD (Savdo-Distribyutsiya: sd + sales)

- Jami route: 106 · REAL: 106 · 501-stub: 0 · yashil-yolg'on: 0 · dublikat: alias (GET/PUT juftliklari)
- 11 controller: customers(25), quotations(23), leads(12), orders(10), sales(9), payments(7), order-departments(8), contracts(3), dashboard(3), invoices(3), deliveries(3).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| SdCustomers CRUD + 360 + contacts/docs/nps/complaints | REAL | sd-customers.controller.ts:107-446 (SdCustomersService) |
| delete → `return {}` | REAL (bo'sh javob) | sd-customers.controller.ts:219-225 — izoh LEGACY_NOOP: svc.softDelete() **real ish qiladi**, faqat javob bo'sh |
| SdOrders create/status/advance-payment/bypass | REAL | sd-orders.controller.ts:122-213 (CommandBus → CQRS) |
| SdQuotations CRUD + calc-price + convert + kpi | REAL | sd-quotations.controller.ts:66-239 (SdQuotationsService) |
| SdLeads CRUD/convert/import/activities | REAL | sd-leads.controller.ts:43-180 (SdLeadsService) |
| SdPayments list/create/debitors/overdue | REAL | sd-payments.controller.ts:51-99 (SdPaymentsService) |
| SdPayments updatePayment | REAL (xom SQL) | sd-payments.controller.ts:106-123 — `db.execute(UPDATE sd_payments ...)` (Qoida 15 buzilishi, lekin haqiqiy yozadi) |
| SdInvoices get/create | REAL | sd-invoices.controller.ts:58-117 (CommandBus + QueryBus) |
| SdDeliveries get/updateStatus | REAL | sd-deliveries.controller.ts:44-71 (DeliveriesService) |
| SdContracts list/sign | REAL | sd-contracts.controller.ts:36-96 (drizzle `db.select`/`db.update`; catch→[] fallback) |
| SdDashboard overview/manager-actions/quota | REAL | sd-dashboard.controller.ts:38-55 (SdDashboardService) |
| SdOrderDepartments saga/fan-out + dept status | REAL | sd-order-departments.controller.ts:30-103 (SdOrderDepartmentsService — Phase 4 fan-out) |
| Sales invoices/forecast/commission/leaderboard | REAL | sales.controller.ts:49-142 (SalesService) |
| Dublikat: GET/PUT, PATCH/POST juftliklari | alias | sd-quotations: send/approve/cancel/mark-paid (Patch+Put); sd-orders status (Patch+Put) — bir svc metod |

- DB: sd_customers (BASE, 0), sd_contracts (0), sd_order_departments (0), sd_quotation_items (0), sd_customer_interactions (0), sd_lead_activities (0). **sd_sales_orders / sd_quotations / sd_invoices / sd_payments = VIEW**; sales_orders (BASE, 0).
- Holat: SD eng to'liq ulangan modul — barcha 106 yo'l haqiqiy service/CQRS/SQL. Stub yoki soxta-create topilmadi.

---

### Marketing

- Jami route: 108 · REAL: 100 · 501-stub: 8 · yashil-yolg'on: 0 · dublikat: 0
- 5 controller: analytics-stubs(47), analytics(22), group2(19), content(14), campaigns(6).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| Campaigns CRUD/launch | REAL | marketing.controller.ts:61-149 (CampaignsService → marketing_campaigns) |
| Content posts/social-accounts CRUD | REAL | marketing-content.controller.ts:46-135 (MarketingExtService) |
| Analytics social-posts/leads/email-templates/funnel | REAL | marketing-analytics.controller.ts:58-219 (MarketingExtService + LeadsService) |
| Group2 blog/budget/calendar/competitors/lead-contacts | REAL | marketing-group2.controller.ts:88-298 (MarketingGroup2Service + xom SQL) |
| Stubs-fayl: nps/churn-risk/hot-leads/inbox/exhibitions/pr/settings/blog | REAL (SQL) | marketing-analytics-stubs.controller.ts:118-576 — `db.execute(INSERT/UPDATE/SELECT)` jonli jadvallarga |
| `content/ai-generate` | 501-stub | marketing-analytics-stubs.controller.ts:115 `stub(...)` |
| `churn-risk/ai-signal` (POST) | 501-stub | :173 |
| `ai-assistant` (GET+POST) | 501-stub ×2 | :183, :187 |
| `leads/recalculate-scores` | 501-stub | :204 |
| `leads/:id/convert-to-crm` | 501-stub | :208 |
| `inbox/ai-reply/:id` | 501-stub | :261 |
| `website/blog/ai-generate` | 501-stub | :562 |

- DB tasdiqlandi (hammasi MAVJUD): exhibitions, exhibition_leads, social_api_configs, blog_posts, pr_activities, nps_responses, social_conversations, social_messages, marketing_settings, marketing_ab_tests, marketing_campaigns, marketing_leads, marketing_budget_lines, marketing_calendar_events (hammasi 0 qator).
- Holat: 2026-06-06 "stub sweep" ko'pchilik stubni real SQL ga aylantirgan (fayl sarlavhasi shuni aytadi, kodda tasdiqlandi). Qolgan 8 stub — hammasi **AI-bog'liq** (rostgo'ylik bilan 501 qaytaradi, soxta-AI emas). Yashil-yolg'on yo'q.

---

### Dizayn (design)

- Jami route: 22 · REAL: 19 · 501-stub: 1 · yashil-yolg'on: 2 · dublikat: 0
- 2 controller: design(11), design-extended(11).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| Design getAll/getById/requestDesign/updateStatus | REAL | design.controller.ts:77-155 (CommandBus + QueryBus) |
| Design notifications/statistics/tooling/messages | REAL | design.controller.ts:159-247 (xom SQL designOrderNotifications/design_tooling/designOrderMessages) |
| createOrderMessage | REAL | design.controller.ts:236-247 (`INSERT INTO designOrderMessages`) |
| **POST design/orders (createOrder)** | **501-stub** | **design.controller.ts:219-230 — `throw NotImplementedException` (qasddan; POST /design real yo'lga yo'naltiradi)** |
| DesignExtended generate/orders/templates/status/revisions/approve/reject | REAL | design-extended.controller.ts:33-114 → repo `INSERT INTO designs` / `UPDATE designs` (design-extended.repository.ts:78,106,116) |
| **`:id/verify` (verifyDesign)** | **YASHIL-YOLG'ON** | **design-extended.repository.ts:98-100 — `Ok({checks: Math.random()..., overallScore: 75+random})` — DB yo'q, soxta AI** |
| **`:id/mockup` (generateMockup)** | **YASHIL-YOLG'ON** | **design-extended.repository.ts:102-104 — `Ok({ mockupUrl: '/mockups/...png' })` — soxta URL, DB yo'q** |
| getTemplates | qattiq-kodlangan ro'yxat | design-extended.repository.ts:70-75 (5 ta statik shablon — DB emas, lekin GET-only) |

- DB: design_orders (BASE, 0), designs (0), design_tooling (0), design_order_revisions (0), design_comments (0); designOrderMessages/Notifications (camelCase BASE).
- Holat: Dizayn yadrosi (request→generate→approve/reject) real va DB ga yozadi (avval echo edi, tuzatilgan). Faqat 2 ta AI-simulyatsiya (verify/mockup) Math.random/soxta-URL qaytaradi (yashil-yolg'on) + 1 qasddan 501 (createOrder, halol deferral).

---

### QC (Sifat nazorati: qc + print)

- Jami route: 80 · REAL: 79 · 501-stub: 0 · yashil-yolg'on: 1 · dublikat: alias (PATCH/POST juftliklari)
- 9 controller: defects(15), defects-extended(13), extended(13), parameters(12), new(11), inspections(6), reclamations(4), print(4), dpmo(2).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| QcDefects report/resolve/get/stats | REAL | qc-defects.controller.ts:68-133 (CommandBus + QueryBus) |
| QcDefects approve/reject/inspector-submit | REAL | qc-defects.controller.ts:167-249 → `_setQcStatus` `UPDATE qc_inspections` (avval echo edi, tuzatilgan: :59-64) |
| QcDefects braks/cost-impact, pending/qc | REAL | qc-defects.controller.ts:138-161 (xom SQL qc_braks/qc_defects) |
| QcInspections CRUD/submit | REAL | qc-inspections.controller.ts:54-130 (CommandBus + QcNewService) |
| QcNew dashboard/checkpoints/lab-tests/spc/certificates | REAL | qc-new.controller.ts:54-148 (QcNewService + SpcService + xom SQL qc_spc_data) |
| QcExtended standards/final-insp/in-process/root-causes | REAL | qc-extended.controller.ts:46-176 (QcExtendedService) |
| QcDefectsExtended braks/supplier-quality/approvals/reclamations | REAL | qc-defects-extended.controller.ts:44-191 (QcDefectsExtendedService) |
| QcParameters CRUD/grouped/tests/seed/ai-analyze | REAL | qc-parameters.controller.ts:51-148 (QcParametersService) |
| **QcParameters `tests/:id` (getTestById)** | **YASHIL-YOLG'ON** | **qc-parameters.controller.ts:118-125 — `return { id, results: [], passed: null, testedAt: null }` — DB o'qimaydi, qattiq-kodlangan null** |
| QcReclamations get/create/stats | REAL | qc-reclamations.controller.ts:49-104 (CommandBus + runQuery xom SQL stats) |
| QcDpmo calculate/byProcess | REAL | qc-dpmo.controller.ts:39-55 (DpmoService — Six Sigma hisob) |
| Print ink/imposition/spoilage | REAL | print.controller.ts:71-124 (InkConsumption/Imposition/Spoilage hisob servislari) |
| Dublikat: approve/reject/inspector-submit | alias | qc-defects: har biri Patch+Post juftligi (bir `_setQcStatus`) |

- DB: qc_inspections (0), qc_defects (0), qc_reclamations (0), qc_parameters (0), qc_braks (0), qc_standards (0), qc_spc_data (0), qc_final_inspections (0), qc_lab_tests (0), qc_supplier_quality (0), qc_root_causes (0). **qc_certificates = VIEW**.
- Holat: QC keng va deyarli to'liq real (CQRS + service + xom SQL stats/SPC). Yagona nuqson: `tests/:id` soxta-null javob (svc findById helper hali yo'q). Print/DPMO sof hisob-kitob mexanizmi (DB kam, lekin haqiqiy logika).

---

## Eng muhim topilmalar (xulosa)

1. **4 ta yashil-yolg'on (200 qaytaradi, DB ga tegmaydi):** crm-ai-extended.controller.ts:137-141 (nba/create-task soxta-create); design-extended.repository.ts:98-104 (verifyDesign Math.random + generateMockup soxta-URL); qc-parameters.controller.ts:118-125 (tests/:id qattiq-null).
2. **9 ta 501-stub — hammasi halol va AI/DDL-kutilayotgan:** 8 marketing (ai-generate/ai-assistant/ai-reply/recalculate-scores/convert-to-crm), 1 design (createOrder qasddan POST /design ga yo'naltiradi). Soxta-AI emas — 501 qaytaradi.
3. **SD eng mustahkam:** 106/106 route haqiqiy (service/CQRS/SQL); orders fan-out saga (Phase 4) jonli ulangan.
4. **VIEW haqiqati:** crm_deals/crm_invoices/sd_sales_orders/sd_quotations/sd_invoices/sd_payments/qc_certificates — hammasi VIEW (base jadval emas). "Ikki dunyo" (sales_orders ↳ sd_sales_orders view) memory bilan mos.
5. **Barcha modul jadvali 0 qator** — bu ishlatilmaslik emas, DB qurilish bosqichida bo'shligi (kod yozish/o'qish yo'llari ulangan).
6. **Marketing 2026-06-06 stub-sweep tasdiqlandi:** marketing-analytics-stubs.controller.ts deyarli butun real SQL (exhibitions/pr/inbox/settings/nps jonli jadvallarga yozadi) — eski katalogdagi "47 stub" da'vosi ESKIRGAN.
7. **Mayda Qoida buzilishlari (funksional emas):** sd-payments.controller.ts:106 va bir nechta marketing/qc/design yo'lida controller ichida xom `db.execute` (Qoida 15/6), lekin haqiqiy yozadi — soxta emas.
