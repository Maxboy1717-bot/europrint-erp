# SECTION 2 — UZILISHLAR (uzilgan bog'lanishlar)

> Sana: 2026-06-06 · Rol: 🔵 Tahlilchi (qat'iy read-only) · Manba: jonli kod + jonli `europrint` DB (`_audit/q.cjs`, faqat SELECT).
> Metodologiya: VERIFY-DON'T-TRUST — har bir da'vo `fayl:satr` yoki endpoint yoki DB natija bilan **jonli kodda qayta tasdiqlangan**.
> Tasnif: REAL · 501-stub · YASHIL-YOLG'ON · DUBLIKAT. Bu bo'lim faqat **UZILISHLAR**ni (uzilgan bog'lanish) sanaydi.

> ⚠️ **MUHIM (verify-don't-trust natijasi):** Shu faylning oldingi versiyasi (va `modulN-FULL` kataloglari) bugun, 2026-06-06 da, kodga kirgan ikki katta tuzatish to'lqinidan keyin **eskirgan**. Quyidagi 6 ta da'vo jonli kodda **SOXTA-POZITIV bo'lib chiqdi va olib tashlandi** (pastda "ESKIRGAN DA'VOLAR" bo'limiga ko'chirildi):
> 1. Operator planshet (iot-tablet) start/stop/defect/inline-qc/handover **501** — endi REAL DB (`iot-tablet.controller.ts`, "Category-C Phase-1 2026-06-06").
> 2. Marketing exhibitions/pr/inbox/settings/blog PATCH/DELETE **501** — endi REAL DB (`marketing-analytics-stubs.controller.ts`, "Phase 1 DDL-free sweep 2026-06-06").
> 3. Design notifications/tooling/messages **501** — endi REAL DB (`design.controller.ts:159-214`).
> 4. LMS `lms.certificate.issued`/`lms.course.enrolled` **dot↔underscore nom-mos** — jonli kodda IKKALA tomon ham **dot**, listener `hr/telegram-bots/learning-bot.service.ts:247,265` — MOS, uzilish EMAS.
> 5. CC `MANAGER_OF_SENDER` **har doim throw** — endi org-daraxt **fallback** bor (`cc-org-resolver.service.ts:65-87`), manager_id NULL bo'lsa ham bo'lim rahbarini topadi.
> 6. Order yaratish **outbox yo'lini chetlab o'tadi** — `create-order.handler.ts:86-110` aggregate + outbox'ni BIR tranzaksiyada yozadi; raw insert shu tranzaksiya ICHIDA.

## XULOSA (eng og'ir uchligi)

1. **POS→GL→Ledger UZILGAN** — POS harakatlari `pos_gl_posting_log`ga (AWAITING_REVIEW staging) yoziladi, kanonik `entries` defteriga **HECH QACHON** o'tmaydi; ustiga listener oluvchi voqea (`pos.movement.data.completed`) **hech qaerdan emit qilinmaydi** → butun GL-avto zanjiri o'lik-xat (`pos-gl-auto.listener.ts:18-21` o'zi "dead-letter" deb yozadi). **Money mismatch.**
2. **Goods-receipt → GL UZILGAN** — `goods-receipt.handler.ts:27-83` faqat 3-tomonlama moslik + PO status saqlaydi; **GL legi YO'Q** (`entries` insert yo'q, GL emit yo'q). Mol kirimi buxgalteriyaga umuman tushmaydi. **Money mismatch.**
3. **CC `MANAGER_OF_SENDER` to'liq ishonchsiz** — `employees.manager_id` jonli DB'da **30/30 NULL**; direct-yo'l hech qachon ishlamaydi, faqat org-daraxt fallback'iga tayanadi (u ham `org_departments.head_user_id` bo'sh bo'lsa throw qiladi). Tasdiqlash workflow'i menejer-hop'ida mo'rt.

**Jami sanab chiqilgan uzilish: 33** (quyidagi 6 kategoriya jadvallarida; barchasi jonli kodda/DB'da tasdiqlangan).

---

## 1. FE→BE drift (FE noto'g'ri metod/path/maydon chaqiradi)

`scripts/check-fe-api-urls.mjs` (Qoida 18, WARNING-gate) FE↔BE shartnoma driftini ko'rsatadi. Pastdagilar jonli kodda qayta tasdiqlangan (wildcard/param soxta-pozitivlardan tozalangan):

| # | FE chaqiruvi | BE holati | Jiddiylik | Dalil |
|---|---|---|---|---|
| 1 | `POST /api/security/incidents` | BE'da faqat `GET incidents` (`security.controller.ts:158`); CREATE route yo'q | data yo'qotadi | hodisa qo'shish formasi 404 |
| 2 | `POST /api/security/visitors` | BE'da `GET visitors` + `POST visitors/:id/exit`; create route yo'q | data yo'qotadi | tashrif qaydi saqlanmaydi |
| 3 | `POST /api/security/ppe-checks` | BE'da faqat `GET ppe-checks` | data yo'qotadi | PPE tekshiruv yozilmaydi |
| 4 | `POST /api/crm/ai/extended/chat/respond` · `churn/analyze` · `voice/analyze-call` · `auto-tasks/create` | BE'da faqat `auto-tasks/suggest` (`crm-ai-extended.controller.ts:114`); qolgan 4 path yo'q | workflow bloklaydi | path drift |
| 5 | `POST /api/employees/*/files` · `POST /api/hr/employees/*/documents` | mos POST route topilmadi | data yo'qotadi | fayl yuklash uzilgan |

> Eslatma: drift ro'yxatining katta qismi (`DELETE /api/cameras/*`, `GET /api/progress/summary`, `PATCH /api/chat/rooms/*`) wildcard/param-matching tufayli **soxta-pozitiv** — yuqoridagi 5 ta jonli kodda tasdiqlangan haqiqiy driftlar. Marketing/design driftlari (oldingi ro'yxatda) endi REAL route'lar (2-bo'lim eski da'volari) — bekor qilindi.

---

## 2. FE chaqiradigan 501-stub'lar (forma/tugma bor, endpoint 501)

> ⚠️ **Eski hisobotda bu eng katta bo'lim edi (16 ta 501); jonli kodda ko'pchiligi bugun tuzatilgan.** Qolgan haqiqiy 501'lar — barchasi **AI-gated** (model/integratsiya kutadi, DB-yozuvchi uzilishi EMAS) yoki **DDL-gated** (jadval yo'q) yoki **qasddan** (boshqa kanonik yo'l bor).

| # | Endpoint(lar) | 501 turi | Jiddiylik | Dalil |
|---|---|---|---|---|
| 6 | `POST /marketing/content/ai-generate` · `churn-risk/ai-signal` · `ai-assistant` · `leads/recalculate-scores` · `leads/:id/convert-to-crm` · `inbox/ai-reply/:id` · `website/blog/ai-generate` | **AI-gated** `stub()` | kosmetik (AI yo'q, DB uzilishi emas) | `marketing-analytics-stubs.controller.ts:115,173,183-187,204,208,261,562` |
| 7 | `POST /design/orders` | **qasddan** `NotImplementedException` | kosmetik | `design.controller.ts:229` — "Use POST /design (requestDesign)"; kanonik yo'l mavjud (orphan oldini olish uchun) |
| 8 | `iot/production-sessions/:id/crew` — GET bor (jadval `machine_crews`), lekin INSERT crew route **yo'q** | **DDL/route-gate** | qisman workflow | `iot-tablet.controller.ts:9` "DDL-GATE: crew"; GET (`:270`), POST crew yo'q |

> Eng muhim o'zgarish: **operator planshet butun ishlab-chiqarish sessiyasi endi REAL** — `production-sessions/:id/start` (`:282`), `/stop` (`:295`), `/defect` (`:308` → `downtime_events` INSERT), `/evaluation` (`:332` → `shift_evaluations`), `/material-return` (`:363` → `material_movements`), `/inline-qc` (`:389` → `inline_qc_checks`), `/handover` (`:183` → `shift_handovers`), `material-kit-items/:id/scan` (`:214` → `material_kit_items` UPDATE). Oldingi "#18-#20 hammasi 501" da'vosi SOXTA-POZITIV edi.

---

## 3. Yo'q FK (jadvallar bog'lanishi kerak, lekin FK yo'q)

| # | Jadval/ustun | Kutilgan bog' | Holat | Jiddiylik | Dalil |
|---|---|---|---|---|---|
| 9 | `papka_orders` ↔ `sales_orders` | `sales_order_id`→`sales_orders.id` FK | ustun bor, FK YO'Q | data izchilligi | memory Phase-2: papka_orders FK qoldirilgan (messaging-conflated, ehtiyot) |
| 10 | 12 ta `ow_*` uuid ustun (`production_order_id` va h.k.) | buyurtma olamiga FK | uuid↔int mos kelmaydi → FK yo'q | ikki-olam yadrosi | memory two-worlds: type-migration kerak |

> ✅ MUSBAT (uzilish EMAS): Phase-2 da 7 FK qo'shilgan va jonli tasdiqlangan — `sales_order_items`, `ow_cliches`, `ow_molds`, `ow_material_requirements`, `ow_shipping_requests`, `ow_tech_cards`, `sd_order_departments` → barchasi `sales_orders(id)`ga FK.
> ✅ MUSBAT: `orders` (base) jadvali **2026-06-06 da DROP qilingan** (memory `024e2b11`) — `information_schema`'da endi YO'Q (`SELECT ... WHERE table_name='orders'` → 0 qator). Oldingi "orders 0 FK / o'lik-olam" da'vosi endi mavzuga aloqasiz (jadval mavjud emas).

---

## 4. "Ikki olam" (data 2+ jadvalga bo'lingan)

| # | Olam A (kanonik) | Olam B (parallel) | Real holat | Jiddiylik | Dalil |
|---|---|---|---|---|---|
| 11 | `sales_orders` (12 qator, FK'lar, SD/PP olami) | `papka_orders` (0 qator, MES/messaging-conflated) | `mes_papka_orders`=`papka_orders` ustidagi VIEW; xabarlashish + buyurtma maydoni aralash; #9 FK yo'q | data bo'linishi | DB count: sales_orders=12, papka_orders=0 |
| 12 | `entries` (kanonik GL, 0 qator) | `gl_journal_entries`+`gl_lines` (faol yozuvchilar: finance/payroll repo) · `pos_gl_posting_log` (POS staging) | 3 GL modeli; POS→`pos_gl_posting_log`, defter→`entries`, ko'prik yo'q | **money mismatch** | memory GL-two-worlds: kanonik=`entries`, SAP #76 migratsiya kutadi; DB: entries=0, gl_journal_entries=0, pos_gl_posting_log=0 |
| 13 | `warehouse_stock` (25 qator, kanonik; `current_stock`=ustidagi VIEW) | `stocks` (0) · `wms_stock`/`pos_stock_*`/`stock_ledger` | bir nechta stok jadvali; WMS receiveFg→`stocks`, POS→ledger | data bo'linishi | DB count: warehouse_stock=25, stocks=0 |
| 14 | `attendance` (payroll O'QIYDI) | `hr_tz2_daily_attendance` (territory/IoT yuz) · `attendance_logs` (telegram bot) · `attendance_records`/`security_attendance`/`hr_ai_attendance` (7+ jadval) | **Yozuvchilar har xil jadvalga yozadi, payroll faqat `attendance`ni O'QIYDI** | data yo'qotadi (yozuvchi/o'quvchi olam ajragan) | yozuvchilar: `territory-log.repository.ts:219`→hr_tz2, `manager.repo.ts:201`→attendance_logs; o'quvchi: `finance-extended-payroll.service.ts:272` FROM attendance. (DB hozir bo'sh: 4×0 qator → struktura uzilishi, jonli data-loss hali yo'q) |
| 15 | `crm_leads` (5 qator, faol) | `leads` (0) · `marketing_leads` · `exhibition_leads` · `sd_lead_activities` | lid datasi 4+ jadvalga sochilgan; `leads` bo'sh, `crm_leads` faol | data bo'linishi | DB count: crm_leads=5, leads=0 |

---

## 5. 0-listener / 0-emit voqealar (publisher bor, listener yo'q yoki aksincha)

EventEmitter2/CQRS `emit`/`publish`'lari `@OnEvent`/`@EventsHandler` bilan solishtirildi (socket.io `.emit` chiqarib tashlandi). Har biri jonli grep bilan tasdiqlandi.

### 5a. 0-listener (emit/publish bor, hech qaerda handler yo'q)

| # | Voqea | Emitter (fayl:satr) | Jiddiylik | Dalil |
|---|---|---|---|---|
| 16 | `iot.anomaly` (string topic) | `agents/iot-agent.service.ts:41,45` (`this.bus.emit`, AgentEventBus) | workflow (agent-anomaliya yetib bormaydi) | `@OnEvent('iot.anomaly')` butun kodda YO'Q. **Nuance:** IoT modulida ALOHIDA tipli `AnomalyDetectedEvent`→`AnomalyDetectedHandler` (`iot_alerts` INSERT) ISHLAYDI — agent string-yo'li o'lik, tipli CQRS yo'li tirik (parallel) |
| 17 | 7+ agent voqeasi: `finance.fraud_suspected`, `stock.critical`, `warehouse.roll_low`, `crm.hot_leads_found`, `production.delayed`, `quality.defect_rising`, `security.emergency` | `agents/*-agent.service.ts` (`this.bus.emit`, AgentEventBus) | workflow (alert yetib bormaydi) | har 7 voqea uchun `OnEvent`=0 (grep tasdiq); AgentEventBus REAL emit, lekin hech bir listener yo'q |
| 18 | `pos.requisition.{submitted,approved,rejected,fulfilled,cancelled}` | `pos-requisition-workflow.service.ts` | workflow | 5 voqea, `OnEvent('pos.requisition...')`=0 |
| 19 | `pos.gl.auto_posted` | `pos-gl-auto.listener.ts:109` | kosmetik (qasddan) | listener yo'q — fayl izohida "no listener by design (owner decision 2026-06-06)" |
| 20 | `pos.movement.data.completed` (oluvchi voqea) | **hech qaerdan emit qilinmaydi** | **money (zanjir o'lik)** | `pos-gl-auto.listener.ts:18-21`: "No production code currently publishes ... listener was therefore already a dead-letter" — GL-avto listener bor, lekin uni hech narsa qo'zg'atmaydi |
| 21 | `sales.copilot.pdf_dispatch` | `ai-agents/sales/sales-copilot.service.ts:240` | workflow (PDF jo'natilmaydi) | `OnEvent('sales.copilot.pdf_dispatch')`=0 (faqat `auto_price`/`director_approval_required` listenerlari bor: `ai-alerts.service.ts:92,151`) |
| 22 | `employee.created`, `hr.attendance.recorded`, `payroll.period.closed`, `rbac.permission.changed` | turli (`employees.service.ts` va h.k.) | kosmetik–workflow | listener yo'q |

### 5b. Durablik — outbox YO'Li REAL, `domain_events` BO'SH (data-loss EMAS, ishlatilmagan)

| # | Nima | Holat | Jiddiylik | Dalil |
|---|---|---|---|---|
| 23 | Aggregate → outbox → `domain_events` durable log | **YO'L TO'G'RI ULANGAN** (oldingi da'vo soxta-pozitiv) | past (DB bo'sh sabab) | `create-order.handler.ts:86-110` aggregate-save + `outboxRepo.insertBatch` BIR tranzaksiyada; raw `execSdSalesOrderInsert` shu tx ICHIDA (`drizzle-sales-order.repo.ts:38`). `domain_events`=0 — bo'sh DB'da hali buyurtma yaratilmagan, **uzilish emas** |

---

## 6. Modul↔modul bog'lanish yo'q (vizyon zanjiri uzilgan)

| # | Zanjir | Holat | Jiddiylik | Dalil |
|---|---|---|---|---|
| 24 | **POS → GL → defter** | listener `pos_gl_posting_log`ga (AWAITING_REVIEW) yozadi, `entries`ga PROMOSIYA YO'Q; ustiga oluvchi voqea hech qaerdan emit qilinmaydi (#20) | **money mismatch** | `pos-gl-auto.listener.ts:87` (`glRepo.insertLog`→`pos_gl_posting_log`); `:18-21` dead-letter |
| 25 | **Goods-receipt → GL** | `goods-receipt.handler.ts:27-83` faqat 3-way match + PO status; **GL legi YO'Q** | **money mismatch** | handler to'liq o'qildi — `entries` insert yo'q, GL emit yo'q. (`ThreeWayMatchFailedEvent` listeneri bor — `hitl_approvals`ga yozadi — lekin bu GL EMAS, faqat tasdiqlash) |
| 26 | **MES → QC** | `mes/**`da QC bog'lanish (createReclamation/qcService/reclamation) **0 ta** | workflow bloklaydi | grep mes modulida qc-link=0 |
| 27 | **CC → Kanban → Kassir** | CC kanban task yaratmaydi (faqat 1 ta izoh-ref `cc-baskets.repo.ts:13`, real chaqiruv yo'q); Kanban'da `kassir/finance/payment` ref YO'Q | workflow bloklaydi | grep: CC real kanban-call=0, kanban modulida kassir/finance=0 |
| 28 | **ERP voqea → ichki Chat** | `chat/**`da `@OnEvent` **0 ta**; hech bir ERP domen voqeasi (buyurtma/invoys/lid) ichki chatga post qilmaydi | kosmetik–workflow | grep `chat/**` `@OnEvent`=bo'sh; chat xabarlari Telegram'ga ketadi, in-app chatga emas |
| 29 | **Dizayn → Ishlab chiqarish** | `design/**`da `production_order` yaratish ref **0 ta**; `POST /design/orders` qasddan 501 (#7) | workflow | grep design modulida production-link=0 |

> #24, #25 — money-mismatch (POS va xarid buxgalteriyaga ulanmagan). #26-#29 — "voqea boshqaruvi orqali modullararo workflow" vizyonining asosiy uzilishlari. Barchasi kod darajasida tasdiqlandi.

---

## ILOVA — ESKIRGAN DA'VOLAR (oldingi hisobot soxta-pozitivlari, qayta tekshirilib bekor qilindi)

Bu da'volar `modulN-FULL`/oldingi `s2`/D:\kitob kataloglarida UZILISH deb belgilangan edi — jonli kodda **soxta-pozitiv** bo'lib chiqdi (asosan 2026-06-06 tuzatishlari):

| Eski da'vo | Haqiqat (fayl:satr) |
|---|---|
| iot-tablet start/stop/defect/inline-qc/handover/sessions **501** | REAL DB — `iot-tablet.controller.ts:183,214,282,295,308,332,363,389` |
| marketing exhibitions/pr/inbox/settings/blog PATCH/POST/DELETE **501** | REAL DB — `marketing-analytics-stubs.controller.ts:217-559` ("Phase 1 DDL-free sweep") |
| design notifications/tooling/wear-forecast/messages **501** | REAL DB — `design.controller.ts:159,179,189,208,236` |
| LMS `certificate.issued`/`course.enrolled` **dot↔underscore nom-mos** | IKKALA tomon ham **dot**, MOS — emit `issue-certificate.handler.ts:53`/`enroll-course.handler.ts:55`, listen `hr/telegram-bots/learning-bot.service.ts:265,247` |
| CC `MANAGER_OF_SENDER` **har doim throw** | org-daraxt fallback bor — `cc-org-resolver.service.ts:65-87` (manager_id NULL bo'lsa ham bo'lim rahbarini topadi) |
| Order yaratish **outbox'ni chetlab o'tadi** (data-loss) | aggregate+outbox BIR tx — `create-order.handler.ts:86-110`; `domain_events`=0 faqat bo'sh DB sabab |
| `orders` (base) **o'lik olam / 0 FK** | jadval 2026-06-06 da DROP qilingan — `information_schema`'da YO'Q |
| `ThreeWayMatchFailedEvent` **0-listener** | listener bor — `three-way-match-failed.listener.ts` (`hitl_approvals` INSERT) |

## ILOVA — Tasniflanmagan musbatlar (uzilish EMAS)

- `sd_sales_orders`, `mes_papka_orders`, `current_stock`, `pp_orders`, `pos_orders`, `mm_purchase_orders` = VIEW'lar (kanonik jadval ustida) — DUBLIKAT-jadval EMAS.
- `employees.user_id` = 30/30 backfill qilingan (REAL, DB tasdiq: null_user=0) — bu hop ishlaydi; faqat `manager_id` (30/30 NULL) mo'rt.
- Phase-2 7 FK + Phase-4 order→dept fan-out (`sd_order_departments`) REAL.
- Attendance→payroll O'QISH yo'li REAL (`finance-extended-payroll.service.ts:272`) — uzilish faqat YOZUVCHI tomonda (#14).
- IoT tipli `AnomalyDetectedHandler` (`iot_alerts` INSERT) ISHLAYDI — faqat agent string `iot.anomaly` (#16) o'lik.

*Hisobot tugadi — barcha 33 uzilish jonli kod/DB bilan tasdiqlandi; 8 ta eski soxta-pozitiv bekor qilindi; hech narsa o'zgartirilmadi (read-only).*
