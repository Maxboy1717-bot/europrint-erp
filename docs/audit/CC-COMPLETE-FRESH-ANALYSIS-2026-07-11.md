# CC / Koordinatsiya (20-cc + 04-coordination) Moduli — To'liq Yangi Tekshiruv

> **Sana:** 2026-07-11 · **Rol:** 🔵 Tahlilchi · **READ-ONLY** — hech bir kod, sxema, konfiguratsiya yoki ma'lumot o'zgartirilmadi. Yagona yaratilgan fayl — shu hisobot.
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` (`node _audit/q.cjs`).
>
> **Metodologiya (Q-29 verify-don't-trust).** `docs/audit/` hujjatlari (vizyon-1000 `20-cc`+`04-coordination`, master-reja `[Module-20]`/`[Module-04]`, Guruh-B, QARORLAR/OWNER-JAVOBLAR-2026-07-11) faqat "qayerga qarash" ko'rsatkichi bo'ldi; har bir da'vo **shu tahlirda** olingan `fayl:qator` yoki `SQL natija` bilan qo'llab-quvvatlandi. `SD-CRM-…-2026-07-10-v3.md` va `KANBAN-…-2026-07-11.md` faqat **struktura/rigor namunasi** sifatida ishlatildi.
> **Ish tartibi:** deterministik inventar → 3 mustaqil read-only sub-agent (BE controller/RBAC/green-lie · FE sahifa/API/dizayn · cross-module event/taksonomiya) → har bir P0 da'vo shaxsan qayta tekshirildi (kvorum konstanta, GL-post yo'qligi, template-CRUD yo'qligi, CcSpawn emitterlari, jonli DB qatorlari).

⚠️ **Qamrov chegarasi.** Bu audit **CC = hujjat/koordinatsiya workflow** ni qamraydi: (a) `communication-center` moduli (`cc_*` jadvallar, 3-savat hujjat engine, PIN-imzo, AI-intervyu, kassir-ko'prik) va (b) `director` modulining koordinatsiya qismi (`coordination` controller — doklad/rasporyazhenie/kengash, `coordination-docs` — prikaz/protokol, `workflow-rules`, `council-members`). Direktor modulining KPI/dashboard/agent qismlari (05-director) **alohida modul**, bu auditga kirmaydi.

---

## 0. Eng kritik topilma (bir jumlada)

**CC/Koordinatsiya moduli — kod jihatidan g'ayrioddiy chuqur qurilgan (10 controller, ~73 real-SQL endpoint, 3-savat engine, PIN-imzo idempotent, org-resolver darvoza, 2/3 kvorum, SLA cron, AI-intervyu draft, kassir-ko'prik, Socket.IO gateway) va soxta-CRUD/echo deyarli YO'Q — lekin (a) jonli baza BUGUN to'liq bo'sh: har bir tranzaksion `cc_*` va koordinatsiya jadval (cc_documents/approvals/audit/complaints/dokla/rasporyazhenie/prikaz/protocol/councils/workflow_rules) = 0 qator; faqat konfiguratsiya seed qilingan (cc_document_templates=18, cc_workflow_steps=59, cc_rejection_reasons=84, taxonomy_entries=96), users=1 (admin) — ya'ni hech qachon jonli-sinovdan o'tmagan; (b) vizyonning uchta yadro-va'dasi qurilmagan yoki BUGUNGI QARORGA ZID: GL-avto-posting YO'Q (faqat kassir-bildirishnoma), shablon-CRUD YO'Q (seed-only), cross-module trigger deyarli YO'Q (5 kutilgan manbadan faqat POS-procurement ulangan).** Master-reja bo'yicha 298 CC-item: **Ha 21 · Qisman 101 · Yo'q 161 · STALE-DOC 15**.

Uch eng og'ir strukturaviy nuqson:

| # | Nuqson | Dalil |
|---|---|---|
| **1** | **CC tasdiqdan keyin GL'ga avto-posting YO'Q — BUGUNGI QARORGA ZID.** `QARORLAR-JURNALI-2026-07-11.md:33` (20-cc #49): "CC tasdiqdan keyin GL'ga auto". Jonli kod: to'liq tasdiqda faqat `CcDocumentFullyApprovedEvent` chiqadi (faqat ADVANCE/FINANCIAL_AID uchun), uni yagona tinglovchi `cc-approved-kassir.listener.ts` — u faqat `cc_notifications` "payment_ready" yozadi, GL/accounting'ga HECH NARSA yozmaydi. `cc_documents`da `amount` ustuni ham, GL-post-status ustuni ham yo'q. | `cc-workflow.service.ts:245-265`; `cc-approved-kassir.listener.ts:9-12,73-80`; grep `gl_entries\|accounting` in CC → 0 |
| **2** | **Cross-module INBOUND trigger deyarli yo'q + CC 0 domain-event chiqaradi.** 5 kutilgan manbadan (MES stop/smena · QC brak → cc_complaints · HR onboarding/NDA · SD/PLAN_CHANGE · PP tungi-smena) HECH BIRI CC'ga event chiqarmaydi. `CcSpawnRequestedEvent` ni faqat 2 joy chiqaradi: POS-procurement va tashqi webhook. `cc_complaints` jadvaliga yozuvchi kod umuman yo'q. | grep `CcSpawn\|coordination` in mes/qc/hr/sd/pp → 0; emitter `procurement-request.service.ts:139`, `cc-webhook.controller.ts:105` |
| **3** | **Jonli baza to'liq bo'sh + faqat super_admin.** Barcha tranzaksion CC/koordinatsiya jadval 0 qator; `users`=1, `employees`=0, `positions`=0, `org_functions`=0. Marshrut-resolver (`cc-org-resolver`), kvorum (`council_members`=0), kassir-topish, workflow_rules (=0) — hammasi org+users seed bo'lmaguncha amalda ishlamaydi. Shablon-engine 0 hujjat bilan sinovsiz. | §1.3 DB tally |

---

## 1. SAHIFA INVENTARI (noldan chiqarilgan)

### 1.1 Manba va usul

- **Sidebar:** `components/sidebar/constants.ts:644-666` — guruh `coordination`, `defaultUrl:"coordination"` (`:647`), rol-guruh `coordination:"DIRECTOR"` (`:723`). 6 yozuv:
  - `coordination?tab=baskets` "Kommunikatsiya Markazi" (`:650`)
  - `coordination?tab=councils` "5 Kengash Tizimi" (`:651`)
  - `coordination/quorum` "Kengash Kvorumi" (`:652`)
  - `coordination?tab=dokla` "Hisobot Yuborish" (`:653`)
  - `coordination?tab=raspo` "Ko'rsatma Berish" (`:654`)
  - `coordination/workflow-rules` "Workflow qoidalari" (`:655`)
- **Marshrutlar:** `routes/DirectorRoutes.tsx:42-44` → `/coordination` (CoordinationPage), `/coordination/workflow-rules` (WorkflowRules), `/coordination/quorum` (CouncilQuorum).
- **Rol darvozasi:** `AppRouter.tsx:116` → `<ModuleGroup roles={DIRECTOR_ROLES} routes={DIRECTOR_ROUTES} />`. `DIRECTOR_ROLES = ['director','admin','super_admin','manager']` (`roleConstants.ts:19`). Guard = `RoleRoute` (klient `hasRole`, `RoleRoute.tsx:31`). ⇒ jonli yagona user (super_admin) **kiradi** (Kanban'dagi kabi "faqat super_admin" holati, lekin bu yerda modul allaqachon director-darvozali).

### 1.2 Raqamlar (shu tahlirda hisoblangan)

| O'lchov | Qiymat |
|---|---|
| Ro'yxatdan o'tgan CC/koordinatsiya marshrut | **3** (`/coordination`, `/coordination/quorum`, `/coordination/workflow-rules`) |
| `/coordination` ichidagi tab (viewMode) | **6+** (baskets · councils · dokla · raspo · prikaz · protocol · overview — `CoordinationPageTypes.ts` `VALID_TABS`) |
| FE sahifa/komponent fayl (Coordination* + CommunicationCenter + ThreeBaskets) | **~12** |
| BE controller (communication-center) | **6** (CcDocuments, CcBaskets, CcAi, CcNotificationPrefs, CcPublic@Public, CcWebhook-HMAC) |
| BE controller (director/coordination) | **5** (Coordination, Prikaz, Protocol, CouncilMembers, WorkflowRules) |
| BE `/api/cc/*` + `/api/coordination/*` + `/api/prikaz` `/api/protocols` `/api/councils/*` endpoint | **~73** (cc-documents 17 · cc-baskets 7 · cc-ai 4 · notif-prefs 3 · public 1 · webhook 1 · coordination 16 · prikaz+protocol 12 · council-members 6 · workflow-rules 6) |
| Jonli `cc_*` jadval | **17** — 3 seed (templates 18, steps 59, reasons 84), **14 = 0 qator** |
| ORPHAN CC sahifa | **0** (hech bir CC-sahifa de-routed emas) |
| FE→BE o'lik/behuda chaqiruv | **1** (`GET /api/coordination/baskets` natijasi tashlanadi — `CoordinationPage.tsx:113`) |
| >900 qatorli fayl (Qoida 13) | **0** (eng katta: CoordinationPage 610, cc-workflow.service 354) |

### 1.3 Jonli DB holati (RESET tasdig'i)

```
── SEED (konfiguratsiya, to'ldirilgan) ──
cc_document_templates = 18   cc_workflow_steps = 59   cc_rejection_reasons = 84
taxonomy_entries = 96  (contact_type 5, document_type 6, + boshqalar)

── TRANZAKSION (hammasi BO'SH) ──
cc_documents=0  cc_approvals=0  cc_attachments=0  cc_audit_trail=0  cc_basket_history=0
cc_branches=0  cc_complaints=0  cc_delegations=0  cc_document_versions=0  cc_ai_sessions=0
cc_notification_prefs=0  cc_notifications=0  cc_print_log=0  cc_user_pins=0
dokla=0  rasporyazhenie=0  prikaz=0  protocol=0  councils=0  council_members=0  workflow_rules=0

── ORG RESET ──
users=1 (admin/super_admin)  org_departments=1  positions=0  org_functions=0  employees=0
```
⚠️ Har bir tranzaksion jadval **0 qator** → engine hech qachon jonli hujjat oqizmagan; har "ishlaydi" da'vosi faqat **kod-o'qish** darajasida (Q-32 static-fallback). PIN-imzo, kvorum, kassir-topish, org-resolver — hammasi org+users seed'ga tayanadi.

⚠️ **Prompt-kontekst tuzatildi (jonli):** prompt `org_departments=0` deydi; jonli **=1**. Boshqa org-jadvallar (positions/org_functions/employees) haqiqatan 0. `protocol` jadval mavjud (singular), `protocols` YO'Q — ProtocolController `protocol` ga yozadi (`protocol.repository.ts:48,69`).

### 1.4 Kanonik jadval qarori (muhim)

- **`cc_documents` = kanonik hujjat jadvali** (barcha shablon turlari bitta jadvalda; tur = `template_id`; forma-ma'lumot = `ai_answers` JSONB blob — vizyon #32 mos).
- **`cc_notifications` = VIEW** (global `notifications` ustida; NOT-NULL `title`+`body` → har INSERT `title_uz`/`message_uz` nusxalaydi). Yozuvchilar: kassir-listener, SLA cron, write-repo. ⚠️ Kanban'dagi kabi VIEW-yozish naqshi — base jadval = `notifications`.
- **Ikki dunyo (koordinatsiya vs cc):** `director/coordination` (dokla/rasporyazhenie/prikaz/protocol/councils/workflow_rules — sodda operatsion CRUD) va `communication-center` (cc_documents 3-savat engine) — **ikki alohida hujjat-olam**. FE `CoordinationPage` ikkalasini bir sahifada birlashtiradi (tablar), lekin BE'da ular ulanmagan (masalan `POST /coordination/dokla` `dokla` jadvaliga yozadi, `cc_documents` engine'iga EMAS).

---

## 2. HAR SAHIFA / KO'RINISH TAHLILI

> Uch marshrut, lekin `/coordination` ichida 6+ tab. Har biri quyida. Manba: FE sub-agent (`fayl:qator`).

| Sahifa/Ko'rinish | Reachable? | API holati | Fake-save | Green-lie | RBAC holati | Dizayn muvofiqligi | Boshqa topilma |
|---|---|---|---|---|---|---|---|
| **`/coordination` (CoordinationPage, 610q)** | ✅ sidebar `constants.ts:647`; DIRECTOR | REAL — 7 GET + ~14 mutation (dokla/rasporyazhenie/councils/prikaz/protocol) `CoordinationPage.tsx:96-315` | Yo'q — har dialog real mutation + `invalidateQueries` | Yo'q | route-darvoza + BE `@Roles`; sahifa ichida klient-check yo'q | ❌ EPPageHeader YO'Q (bespoke `<h1>` `:423`); ✅ token-ranglar, `window.confirm` yo'q, xom-hex yo'q | 🟠 **o'lik query** `GET /api/coordination/baskets` (`:113`) natija ISHLATILMAYDI (izoh tan oladi); real savat `/api/cc/baskets/*` dan keladi |
| **Baskets tab → `CommunicationCenter` (153q)** | ✅ `?tab=baskets`; `CoordinationPageSections.tsx:244` | REAL — `GET /api/cc/baskets/summary` (30s poll), `/inbox`, `/pending`, `/outbox` (`CommunicationCenter.tsx:31-47`) | Yo'q (yozuv `NewDocumentModal`/`DocumentDetailModal`da) | Yo'q | class `@Roles` (7 rol) | 🟡 **24h-qoida banneri HARDCODE** (`:82-91`); bespoke lokal `Badge` (`:142`); token-ranglar | 3-savat (Inbox/Pending/Outbox) UI mavjud |
| **Councils tab (5 Kengash)** | ✅ `?tab=councils` | REAL — `GET /api/coordination/councils` (`:120`), `PATCH /coordination/councils/:id` (`:204`) | Yo'q | Yo'q | class `@Roles`; PATCH = admin/director/ceo | raw `<select>` filtrlar; token-ranglar | 5-daraja ierarxiya `COUNCIL_LEVELS` HARDCODE (`CoordinationPageTypes.ts:8-49`) |
| **Dokla tab (Hisobot Yuborish)** | ✅ `?tab=dokla` | REAL — `POST/GET /coordination/dokla`, `PATCH .../read`, `.../resolved` (`:140,186,191`) | Yo'q | Yo'q | class `@Roles` | card-list (EPTable emas), bespoke `<button>` statusi | 🔴 `dokla` HARD-delete (`coordination.repository.ts:85`) — retention yo'q (Guruh-B) |
| **Raspo tab (Ko'rsatma)** | ✅ `?tab=raspo` | REAL — `POST /coordination/rasporyazhenie`, `PATCH .../:id/done` (`:159,177`) | Yo'q | Yo'q | class `@Roles` | card-list; token-ranglar | 🔴 `rasporyazhenie` HARD-delete (`:187`); done→event chiqadi |
| **Prikaz tab (CoordinationDocs)** | ✅ tab; `CoordinationDocsSections.tsx` | REAL — `POST /api/prikaz`, `PATCH`, `/sign`, `/cancel` (`:232-270`) | Yo'q | Yo'q | `@Roles(admin,super_admin,director,ceo)` | ✅ `CancelPrikazDialog`=AlertDialog+majburiy sabab (Qoida 14 mos); card-list | `prikaz` jadval mavjud, 0 qator; imzoda raqam beriladi (immutable) |
| **Protocol tab** | ✅ tab | REAL — `POST /api/protocols`, `PATCH`, `/sign`, `/amend` (`:281-315`) | Yo'q | Yo'q | `@Roles(...,manager)` | shadcn Dialog; raw `<select>` | ⚠️ `protocol` (singular) jadvalga yozadi (`protocol.repository.ts`), 0 qator |
| **`/coordination/quorum` (CouncilQuorum, 128q)** | ✅ `constants.ts:652` | REAL — `GET /api/coordination/councils`, `GET /api/councils/:id/quorum`, `POST /api/councils/:id/quorum/evaluate` (`CouncilQuorum.tsx:45,51,56`) | 🟠 **evaluator, persister EMAS** — natija faqat lokal state (`setResult:59`); ovoz-yozuvi (ballot) SAQLANMAYDI | Yo'q (real POST) | class `@Roles(admin,super_admin,director,manager,ceo)` | ✅ `ModulePage` shell, `EPErrorState`; token-ranglar | Kvorum = qo'lda kiritilgan agregat (present/for/against) `:102-104` → hisoblangan natija; per-a'zo ovoz-berish UI YO'Q |
| **`/coordination/workflow-rules` (WorkflowRules, 288q)** | ✅ `constants.ts:655` | REAL — `GET`, `POST`, `DELETE /api/coordination/workflow-rules` (`:91,117,127`) | Yo'q — real CRUD | Yo'q | class read `@Roles(manager,director,super_admin)`; write `@Roles(director,super_admin)` | ✅ **eng yaxshi** — `EPPageHeader`+`EPCard`+`EPStatusPill`+`Table`+`ConfirmDialog` (Qoida 14) | 🟠 **UPDATE/PUT UI yo'q** (create+soft-delete only, garchi BE'da PUT bor `workflow-rules.controller.ts:111`); bu **amount-tier emas** — gorizontal dept/funksiya marshrut-qadamlar |
| **`ThreeBasketsPanel` (Kanban widget, 99q)** | ✅ Kanban-board'da; CC'ga `navigate("/coordination?tab=baskets")` (`:30,66`) | REAL — `GET /api/cc/baskets/summary` (30s, `retry:false`) | Yo'q (read-only) | Yo'q | — | ✅ token-ranglar, `isError` bo'sh-holat | CC↔Kanban ko'prikning FE-uchi |

### 2.1 Green-lie / green-fallback tekshiruvi (BE) — sub-agent tasdig'i

| Amal | Verdikt | Dalil |
|---|---|---|
| Barcha cc/coordination CRUD (draft/send/approve/reject/dokla/rasporyazhenie/prikaz/protocol/council/workflow-rule) | **REAL** | 10 controller, har `{ok:true}`/`{success:true}` real DB-yozuvdan KEYIN (assertOk throw qiladi) |
| `POST /api/cc/pin` → `{ok:true}` | **REAL** (yozuv `pin.setPin`da) | `cc-documents.controller.ts:168-174` |
| `POST /api/cc/notification-prefs` | **REAL upsert** (izoh: avvalgi `{success:true}` green-lie TUZATILDI) | `cc-notification-prefs.controller.ts:42-44` |
| `POST /api/cc/webhooks/:source` → `{ok,queued}` | **REAL** (event chindan publish) | `cc-webhook.controller.ts:105` |
| `spawnRecurringDocuments` (soatlik cron) | ⛔ **PLACEHOLDER stub** — hech narsa qilmaydi | `cc-sla.cron.ts:197-201` (izoh: "Hozir hech narsa qilmaydi") |
| `autoSend=true` (cc.spawn) | ⛔ **NO-OP** — "tizim PIN" yo'q, draft holatda qoladi | `cc-event.listener.ts:112-116` |

> **Muhim:** Bu modulda soxta-CRUD/echo deyarli YO'Q — SD/CRM auditidagi kabi "ko'rinadi lekin saqlamaydi" holati topilmadi. Yagona haqiqiy stub'lar: `spawnRecurringDocuments` placeholder va `autoSend` no-op. CouncilQuorum "evaluator" (ovoz saqlamaydi) — green-lie EMAS, lekin vizyon-to'liq emas.

---

## 3. CROSS-MODULE INTEGRATSIYA JADVALI

CC listenerlar CQRS `@EventsHandler` (CqrsEventBus). Emitterlar `eventBus.publish(new ...)`.

### 3.1 INBOUND — kim CC-hujjat tug'dirishi KERAK va tug'diradimi

| Kutilgan trigger | Bor/Yo'q | Dalil (file:line) |
|---|---|---|
| **POS procurement (P2P)** → CC "PROCUREMENT" hujjat | ✅ **BOR (yagona real cross-module emitter)** | `pos/application/services/procurement-request.service.ts:139` → `CcSpawnRequestedEvent`; izoh (`:132-135`): CC = ko'rinadigan hujjat + Kanban karta, ASL tasdiq `procurement_approvals`da qoladi |
| Tashqi webhook (HMAC) → CC hujjat | ✅ **MEXANIZM bor** (ichki modul chaqirmaydi) | `cc-webhook.controller.ts:105`; idempotency in-memory (pod-lararo dedup yo'q, `:73-74`) |
| **MES** smena-handover / stop / mashina-to'xtash → CC hujjat | 🔴 **YO'Q** | grep `cc\|CcSpawn\|coordination` in `modules/mes` → 0 |
| **QC** brak/reklamatsiya → `cc_complaints` | 🔴 **YO'Q** | grep in `modules/qc` → 0; `cc_complaints` ga yozuvchi kod umuman yo'q (`POST /cc/documents/:id/complaint` faqat UI'dan) |
| **HR** onboarding / NDA / intizom → CC hujjat | 🔴 **YO'Q** (shablonlar bor, chaqiruvchi yo'q) | grep in `modules/hr` → 0; VACATION/TRANSFER/SALARY_RAISE/CONTRACT_END shablonlari faqat CC-UI orqali ochiladi |
| **SD** / PLAN_CHANGE (reja o'zgartirish) → CC hujjat | 🔴 **YO'Q** | grep `cc\|PLAN_CHANGE` in `modules/sd`,`modules/pp` → 0 |
| **PP** tungi-smena / smena-qaror → CC hujjat | 🔴 **YO'Q** | grep in `modules/pp` → 0 |

**`CcSpawnRequestedEvent` emitterlari (jami 2):** `procurement-request.service.ts:139`, `cc-webhook.controller.ts:105`. Handler: `cc-event.listener.ts:42-54` → template topadi → draft → Kanban-ko'prik (`:102`).

### 3.2 OUTBOUND — CC tasdiqda nima ishga tushiradi

| Kutilgan chiqim | Bor/Yo'q | Dalil |
|---|---|---|
| **GL / buxgalteriya posting** (tasdiqda GL-yozuv, vizyon #49/#37/#12) | 🔴 **YO'Q — BUGUNGI QARORGA ZID** | grep `gl_entries\|gl_lines\|accounting\|journal(post)` in CC → 0; to'liq tasdiqda faqat `CcDocumentFullyApprovedEvent` (ADVANCE/FINANCIAL_AID) → `cc-approved-kassir.listener.ts` faqat `cc_notifications` yozadi (`:73-80`); "To'lov AVTO yaratilmaydi" (`:10-11`) |
| **Kassir bildirishnoma** (avans/moddiy yordam to'lovga tayyor) | ✅ **BOR** | `cc-workflow.service.ts:254` → `cc-approved-kassir.listener.ts:44-89`; 3-bosqichli kassir-topish (position/karta/rol) |
| **Kanban karta** (har CC draft uchun) | ✅ **BOR** (draft'da, tasdiqda emas) | `cc-kanban-bridge.service.ts:35-73` → `kanban_cards` INSERT (`related_type='cc_document'`); 2 chaqiruvchi: `cc-event.listener.ts:102`, `cc-ai-interview.service.ts` |
| **CC → boshqa modul domain-event** (SD/PP/MES/QC/Finance tinglaydi) | 🔴 **YO'Q — CC 0 tashqi event chiqaradi** | grep `.publish(`/`.emit(` in CC → faqat `CcSpawn` (self-webhook), `CcDocumentFullyApproved` (o'zining kassir-listeneri), Socket.IO gateway (UI push) |
| **Finance outbox / ZVS→Finance** (vizyon #12/#45/#50 outbox) | 🔴 **YO'Q** | `cc_outbox`/`document_hashes` jadval yo'q; outbox-worker yo'q |
| **Coordination protocol → auto-rasporyazhenie** | 🟠 **QISMAN** — dokla `resolved`→auto-rasp bor | `coordination.controller.ts:179` (dokla resolved → auto-rasporyazhenie); lekin protokol→rasporyazhenie (Kanban golden-thread, COR #4/#9) YO'Q |

### 3.3 Taksonomiya / seed holati (jonli)

| Taksonomiya | Holat | Dalil |
|---|---|---|
| **5 aloqa-turi** (`contact_type`) | ✅ **SEED** — buyruq, malumot_talabi, bildirishnoma, sorov, hisobot | `taxonomy_entries` (5 qator) |
| **6 majburiy-yozma hujjat-turi** (`document_type`) | ✅ **SEED** — tex_karta, ish_rejasi, sifat_hisoboti, smena_topshirigi, xavfsizlik_brifingi, nazorat_varaqasi | `taxonomy_entries` (6 qator) |
| ⚠️ Taksonomiya ↔ engine ulanishi | 🔴 **ULANMAGAN** | `taxonomy_entries` `cc_documents`/`cc_document_templates` ga FK EMAS; engine `template_id`/`code` bilan ishlaydi — 5/6 vokabulyar seed lekin ishlatilmaydi |
| **18 hujjat-shablon** (`cc_document_templates`) | ✅ SEED (ariza 12 · xabar 2 · buyruq 1 · hisobot 2) | jonli dump §4 |
| **59 workflow-qadam** (`cc_workflow_steps`) | ✅ SEED — per-template tasdiq-zanjir (position-kodli, amount-tier EMAS) | ADVANCE: MANAGER_OF_SENDER→CEO→POSITION:CFO→POSITION:KASSIR |
| **84 rad-sabab** (`cc_rejection_reasons`) | ✅ SEED — per-template dropdown (~3×18); `category` ustuni YO'Q | reason_uz/reason_ru/is_active/sort_order |

### 3.4 Org-reset ta'siri (aniq baho)

| Bog'liqlik | Reset ta'siri |
|---|---|
| **SLA cron** (`cc-sla.cron.ts`) | ✅ **Ta'sirlanmaydi** — `basket_owner_user_id`/`sender_user_id` hujjat qatoridan (org emas); `head_user_id` ishlatmaydi |
| **Marshrut-resolver** (`cc-org-resolver.service.ts`) | 🔴 **Ta'sirlanadi** — `MANAGER_OF_SENDER`/`CEO`/dept-head'ni `org_departments.head_user_id`+`employees.manager_id` dan hal qiladi; **qotirilgan**: `manager_id<>0` guard (`:134`) + rekursiv CTE org-daraxt bo'ylab yuqoriga (`:143-160`) + `Err()` qaytaradi (crash emas). Lekin head_user_id BIROR joyda to'lmasa → approver topilmaydi, `approver_unresolved` |
| **Kvorum** (`council_members`=0) | 🔴 **Ta'sirlanadi** — 0 a'zo → `votingMembers=0` → doim `advisory` |
| **Kassir-ko'prik** | 🔴 **Ta'sirlanadi** — `employees`/`positions`/`org_functions`=0 → kassir topilmaydi, `logger.warn` (fabrikatsiya yo'q, `cc-approved-kassir.listener.ts:48-54`) |
| **BE RBAC (`@Roles`)** | 🔴 **Amalda faqat super_admin** — jonli `users`=1; manager/director/ceo rolli user yo'q → rol-farqi seed bo'lguncha ma'nosiz |

---

## 4. VIZYON SOLISHTIRISH

### 4.1 Master-reja tally (shu tahlirda `sed`+`grep`+`uniq`)

| Modul-blok | Ha | Qisman | Yo'q | STALE-DOC | Jami |
|---|---|---|---|---|---|
| `[Module-20]` (CC, 20-cc) | **19** | **39** | **72** | 0 | **130** |
| `[Module-04]` (Koordinatsiya, 04-coordination) | **2** | **62** | **89** | **15** | **168** |
| **JAMI** | **21** (~7%) | **101** (~34%) | **161** (~54%) | **15** (~5%) | **298** |

### 4.2 Yadro vizyon-nuqtalari bo'yicha holat (fully / partial / missing)

| Vizyon bloki | Holat | Dalil |
|---|---|---|
| 3-savat hujjat engine (Inbox/Pending/Outbox + basket_state) | **Fully (kod)** / **bo'sh (data)** | `cc-baskets.*`, `cc_documents.basket_state`; DB 0 qator |
| PIN-imzo idempotent (unique doc+approver+step) | **Fully** | `cc-pin.service.verifyAndSign`; vizyon #16 mos |
| Marshrut per-template (workflow_steps position-kodli) | **Fully (kod)** | `cc-org-resolver` + `cc_workflow_steps` 59 qator |
| Hujjat immutable + versiya + resubmit-zanjir | **Fully** | `cc_document_versions`, `parent_document_id`, `markCardStale` |
| Retention position-tier (rahbar 10y / ishchi 3y) | **Partial** | `cc-retention.service.ts:43-106` REAL; lekin `archive_after_days` ustunini ISHLATMAYDI (jonli hammasi NULL); `retention_class`/`retention_until` `users.role` dan |
| Qoralama avto-saqlash (30s) + 90-kun arxiv | **Partial** | AI-intervyu har-javob saqlaydi (`cc-ai-interview.service.ts:141-155`); lekin 30s-timer yo'q, 90-kun arxiv-cron YO'Q |
| Kvorum 2/3 + natija (advisory/approved/tiebreak) | **Partial** | `council-quorum.service.ts:35-92` REAL 2/3; lekin **HARDCODE konstanta** (`business.constants.ts:576-577`), CRUD-sozlanmaydi; per-a'zo ovoz-yozuvi UI yo'q |
| Shablon "asosiy maydonlar + CRUD kengaytirish" (bugungi qaror) | **Missing** | faqat `GET /cc/templates`; POST/PUT/DELETE YO'Q; INSERT faqat seed-SQL. Shablon in-app tahrirlanmaydi (egasi "ERP tashqarisida ish yo'q" ga ZID) |
| Maydon×rol tahrir-huquqi (texnolog→tex, sifat→QC) | **Missing** | maydon-darajali RBAC yo'q; forma = yagona `ai_answers` JSONB blob; butun-hujjat `@Roles` + ownership only |
| GL avto-posting tasdiqda (#49) | **Missing** | §3.2 — faqat kassir-bildirishnoma; GL-yozuv yo'q |
| AI pre-approval (100 hujjat to'planguncha, #41/#72) | **Missing** | `cc-ai-interview.service.ts` — hisoblagich/chegara yo'q; AI = draft-yozish (har-session), analitika emas |
| Tungi-smena "ziddiyatli ijro" oynasi (#7/#22) | **Missing** | grep `night\|tungi\|conflict(exec)` in CC → 0 |
| 5 aloqa + 6 hujjat taksonomiya | **Partial** | seed bor (`taxonomy_entries`), lekin engine'ga FK-ULANMAGAN |
| Cross-module trigger (MES/QC/HR/SD/PP → CC) | **Missing** | §3.1 — 5/5 yo'q |
| Outbox + Finance reversal (#12/#45/#50) | **Missing** | `cc_outbox`/`document_hashes` jadval yo'q; `spawnRecurringDocuments` placeholder |
| Full-text qidiruv (tsvector kirill+lotin, #20/#39) | **Missing/unverified** | GIN/tsvector indeks tekshirilmadi; FE'da server-side qidiruv-endpoint ko'rinmaydi |
| Delegatsiya (maks 3 daraja, #33) | **Partial** | `cc_delegations` jadval + `expireDelegations` cron (`cc-sla.cron.ts:185`); 3-daraja cap tasdiqlanmadi |
| SLA/eskalatsiya (inbox overdue, 48h auto-reject) | **Partial** | `cc-sla.cron.ts:63,115,161` REAL; lekin tier-2/direktor-48h/HR-xabar to'liq emas; re-route yo'q (faqat `escalated` belgisi) |
| Koordinatsiya dokla/rasporyazhenie/prikaz/protokol CRUD | **Fully (kod)** / **bo'sh (data)** | 5 controller REAL; DB 0 qator; ⚠️ dokla/rasp HARD-delete |
| Prikaz SEQUENCE gapless raqamlash (#5) | **Partial/unverified** | imzoda raqam (`coordination-docs.controller.ts:78`); DB SEQUENCE ishlatilishini tasdiqlash kerak |

---

## 5. ORPHAN / O'LIK KOD (Q-46 look-before-delete)

| Element | Qator | Import/route tekshiruvi | Verdikt |
|---|---|---|---|
| CC/Koordinatsiya FE-sahifalar | — | hammasi routed yoki embedded | ✅ **ORPHAN YO'Q** — hech bir CC-sahifa de-routed emas |
| `GET /api/coordination/baskets` (FE) | `CoordinationPage.tsx:113` | natija ISHLATILMAYDI (izoh tan oladi) | 🟠 **O'lik query** — real savat `/api/cc/baskets/*` dan; olib tashlash mumkin (Q-46) |
| `spawnRecurringDocuments` | `cc-sla.cron.ts:197-201` | soatlik cron chaqiradi, lekin bo'sh | ⚠️ **Placeholder stub** — takror-hujjat hech qachon spawn qilinmaydi |
| `autoSend` shoxi | `cc-event.listener.ts:112-116` | doim no-op ("tizim PIN yo'q") | ⚠️ **O'lik shox** — draft holatda qoldiradi |
| `cc_complaints` jadval | — | 0 yozuvchi (faqat UI endpoint) | ⚠️ Cross-module (QC) yozuvchi yo'q |
| Taksonomiya `contact_type`/`document_type` | `taxonomy_entries` (5+6) | engine'ga FK yo'q | ⚠️ **Seed-only, ulanmagan** — vokabulyar ishlatilmaydi |
| `protocol` vs `protocols` | — | ProtocolController `protocol`(singular)ga yozadi | ✅ To'g'ri (chalkash nom, lekin ishlaydi) |

> **FE→BE drift:** ThreeBasketsPanel + CommunicationCenter → `/api/cc/baskets/*` (mavjud, REAL). Koordinatsiya `/api/coordination/baskets` (mavjud lekin FE natijani tashlaydi). Kanban auditidagi `resource-allocation` kabi 404-drift bu modulda **topilmadi**.

---

## 6. SEVERITY XULOSA (P0 / P1 / P2)

### 🔴 P0 — bloklovchi / vizyon-yadro / qarorga-zid
1. **GL avto-posting YO'Q — bugungi qarorga zid** (`QARORLAR:33` 20-cc#49). Tasdiqda faqat kassir-bildirishnoma; GL-yozuv, `amount` ustuni, outbox — hech biri yo'q (§3.2).
2. **Cross-module INBOUND trigger deyarli yo'q** — MES/QC/HR/SD/PP → CC = 5/5 yo'q; CC 0 tashqi domain-event chiqaradi (§3.1-3.2). "Golden-thread"ning CC-uchi uzilgan.
3. **Shablon-CRUD YO'Q (seed-only)** — bugungi "asosiy maydonlar + CRUD kengaytirish" qaroriga zid; egasi "ERP tashqarisida ish yo'q" ga zid (§4.2).
4. **Jonli DB to'liq bo'sh + faqat super_admin** — barcha tranzaksion jadval 0; org+users seed bo'lmaguncha resolver/kvorum/kassir/RBAC amalda ishlamaydi (§1.3, §3.4).
5. **Maydon×rol tahrir-huquqi YO'Q** — vizyon #27/#90/#91 (har bo'lim faqat o'z qismini) qurilmagan; forma = yagona JSONB blob (§4.2).

### 🟠 P1 — funksional nuqson
6. **`cc_complaints` yozuvchi yo'q** — QC reklamatsiya → CC-shikoyat ulanmagan.
7. **Taksonomiya seed lekin ulanmagan** — 5 aloqa + 6 hujjat-turi engine'ga FK-siz (§3.3).
8. **AI pre-approval 100-hujjat hisoblagichi yo'q** (#41/#72).
9. **`spawnRecurringDocuments` placeholder + `autoSend` no-op** — takror-hujjat va avto-yuborish ishlamaydi.
10. **dokla/rasporyazhenie HARD-delete** — retention/audit yo'q (Guruh-B `:139`).
11. **Kvorum 2/3 hardcode konstanta** — CRUD-sozlanmaydi; per-a'zo ovoz-yozuvi UI yo'q (CouncilQuorum faqat evaluator).
12. **Outbox/Finance reversal yo'q** (#12/#45/#50) — `cc_outbox`/`document_hashes` jadval yo'q.
13. **90-kun draft-arxiv cron + 30s avto-saqlash yo'q** (#4).

### 🟡 P2 — sifat / dizayn / muhit
14. **EPPageHeader yo'q + bespoke `<h1>`** — `CoordinationPage.tsx:423`; faqat `WorkflowRules.tsx` to'liq EP-kit ishlatadi.
15. **Raw `<select>` (EP Select emas) + card-list (EPTable emas)** — CoordinationPage/Docs/CommunicationCenter (`CoordinationPageSections.tsx:60,164` va h.k.).
16. **HARDCODE UI bloklar** — 24h-banner (`CommunicationCenter.tsx:82-91`), haftalik-jadval (`CoordinationPageOverview.tsx:76-81`), 5-daraja `COUNCIL_LEVELS` (`CoordinationPageTypes.ts:8-49`).
17. **O'lik query** `GET /api/coordination/baskets` (`CoordinationPage.tsx:113`).
18. **Qoida 6 — controllerda inline SQL** — `coordination.controller.ts:45-54,226-239`, `cc-documents.controller.ts:130-142,151-160`.
19. **2 controller explicit JwtAuthGuard'siz** (global guardga tayanadi) — `coordination.controller.ts:31`, `workflow-rules.controller.ts:64`.
20. **`GlobalInboxBadge.tsx:37,52,55,72` inline `style={{}}`** (token-qiymat, xom-hex emas — Qoida 21 yumshoq buzilish).

---

## 7. TAVSIYALAR (bog'liqlik tartibida, 34 ta)

> Belgi: **FIX** = toza kod (egasi-ruxsatisiz mumkin, Q-34) · **DECISION/DATA/SCHEMA** = egasi-darvozasi. 🔒 = Org-reset/head_user_id ga bog'liq.

**A bosqichi — jonli-sinov poydevori (hamma narsa shunga tayanadi)**
1. **🔒 DATA** — `users` + org (`org_departments.head_user_id`, `positions`, `org_functions`, `employees`) seed qilinsin; aks holda marshrut-resolver (`cc-org-resolver.service.ts:143-160`), kvorum, kassir-topish, RBAC amalda ishlamaydi. **Org-reset blokli.**
2. **DATA** — `council_members` seed (5 kengash a'zolari) — kvorum `votingMembers=0` → doim `advisory` (`council-quorum.service.ts:71`).
3. **FIX** — bo'sh engine'ni jonli smoke-test: 1 draft → send → approve → 3-savat harakati DB-proof (hozir cc_documents=0, sinovsiz).

**B bosqichi — qarorga-zid bo'shliqlarni yopish (vizyon-yadro)**
4. **🔒 SCHEMA/FIX** — **GL avto-posting** (`QARORLAR:33` #49): to'liq-tasdiq listeneriga GL-post hook qo'shilsin (placeholder-hisob bilan ham); `cc_documents` ga `amount` + `gl_posting_status` ustun; `reference_document = ZVS-raqami` (#49). Hozir `cc-approved-kassir.listener.ts` faqat bildirishnoma. **Hisob-raqam mapping = egasi/buxgalter-DATA.**
5. **SCHEMA/DECISION** — **shablon-CRUD** (`cc_document_templates` + `ai_questions` + `cc_workflow_steps`): POST/PUT/DELETE endpoint + admin-UI. Hozir seed-only (`cc-documents.controller.ts:128` faqat GET). Egasi "asosiy maydonlar + CRUD kengaytirish" qarori (`QARORLAR:102-103`) buni talab qiladi.
6. **SCHEMA** — **maydon×rol tahrir-huquqi** (#27/#90/#91): `ai_answers` JSONB blobni per-maydon `{value, editable_by_role}` tuzilmaga ajratish + optimistik locking (`document_version`); texnolog→tex, QC→sifat maydonini tahrirlaydi.

**C bosqichi — cross-module event to'ldirish (golden-thread CC-uchi)**
7. **FIX/SCHEMA** — QC brak/reklamatsiya → `cc_complaints` (yoki CcSpawn "COMPLAINT"): QC modulida emitter + CC listener; hozir `cc_complaints` yozuvchisiz.
8. **FIX** — MES smena-handover/stop → CC "Smena yakuni"/"ziddiyatli ijro" (#6/#7/#22): MES event + CC listener.
9. **FIX** — HR onboarding/NDA/intizom → CC (#13/#14 orgpolitika-tanishuv): HR event + `cc_policy_acknowledgments` jadval (#14).
10. **FIX** — SD/PP PLAN_CHANGE → CC "Reja o'zgartirish" (#22): outbox orqali MES'ga qайta uzatish.
11. **FIX** — CC domain-event chiqarsin (hozir 0): `CcDocumentApprovedEvent`/`CcDocumentRejectedEvent` — SD/PP/Finance tinglashi uchun.
12. **DECISION** — qaysi CC hujjat-turlari qaysi modul-triggeridan tug'iladi (dedup-strategiya, KAN-13 kabi)? Egasi event-siyosati.

**D bosqichi — outbox / Finance reversal (SCHEMA-og'ir)**
13. **SCHEMA** — `cc_outbox` transactional-outbox jadval + worker (30s, exponential backoff, dead_letter) (#12/#45/#50).
14. **SCHEMA** — `document_hashes` (sha256, #6 COR) — imzolangan PDF butunligini tekshirish.
15. **FIX** — `spawnRecurringDocuments` placeholder'ni real qilish yoki olib tashlash (`cc-sla.cron.ts:197`, is_recurring shablonlar uchun).

**E bosqichi — AI / analitika (Faza 2)**
16. **SCHEMA/DECISION** — AI pre-approval hisoblagich (100 hujjat to'planguncha, #41/#72): `cc_documents` sanoq + trigger; faqat orgpolitika/tex-karta/reja-o'zgartirish turlariga.
17. **DECISION** — AI-intervyu OCR/full-text (Faza 2, #46) — egasi AI-key + faza-qaror.

**F bosqichi — kvorum / kengash / retention to'liqlash**
18. **DECISION/SCHEMA** — kvorum 2/3 CRUD-sozlanadigan qilish (`council_quorum_config` jadval yoki `councils.quorum_numerator/denominator`); hozir hardcode (`business.constants.ts:576-577`). Egasi "aniq kvorum chegarasi egasi tasdig'i bilan" (#38).
19. **SCHEMA/FIX** — per-a'zo ovoz-yozuvi (`council_votes` jadval) + CouncilQuorum UI'da real ballot (hozir faqat agregat-evaluator, `CouncilQuorum.tsx:102-104`).
20. **SCHEMA** — retention `archive_after_days` shablon-ustunini ISHLATISH (hozir NULL, `cc-retention.service.ts` `users.role` dan hisoblaydi) yoki ustunni olib tashlash; + 90-kun draft-arxiv cron (#4).
21. **FIX** — dokla/rasporyazhenie HARD-delete → soft-delete (`deleted_at`) + audit (Guruh-B `:139`); `coordination.repository.ts:85,187`.

**G bosqichi — SLA / eskalatsiya to'liqlash**
22. **SCHEMA/FIX** — eskalatsiya re-route: hozir faqat `escalated` belgisi (`cc-sla.cron.ts:161`); tier-2 (manager_id) + direktor-48h + HR-xabar (#30/#33 COR skip-to-CEO).
23. **FIX** — SLA cron ish-vaqti hisobini qo'shsin (#29 "2 soat SLA", #20 mutlaq-vaqt) — hozir astronomik.
24. **FIX** — 48h auto-reject hardcode INTERVAL → shablon `escalation_hours` (`cc-sla.cron.ts:125`).

**H bosqichi — taksonomiya / delegatsiya**
25. **FIX/SCHEMA** — 5 aloqa + 6 hujjat-turi taksonomiyani engine'ga FK-ulash (`cc_documents.contact_type_id`/`document_type_id`); hozir seed-only.
26. **FIX** — delegatsiya 3-daraja cap tekshiruvi (#33) — `cc_delegations` zanjir-chuqurligi.
27. **FIX** — self-route SoD (yuboruvchi=qabul qiluvchi blok, #21) + `ambiguous_route` log (#3, hozir `resolveDeptHead` jimgina `LIMIT 1`).

**I bosqichi — o'lik/stub tozalash (Q-46 toza FIX)**
28. **FIX** — o'lik query `GET /api/coordination/baskets` olib tashlansin (`CoordinationPage.tsx:113`).
29. **FIX** — `autoSend` no-op shoxini hal qilish: yo "tizim PIN" mexanizmi, yo shoxni olib tashlash (`cc-event.listener.ts:112`).
30. **FIX** — `cc-webhook` idempotency in-memory → DB-jadval (pod-lararo dedup, `:73-74`).

**J bosqichi — dizayn / kod-sifat (P2)**
31. **FIX** — `CoordinationPage`/`Docs`/`CommunicationCenter` ga `EPPageHeader` + `EPTable` + EP `Select` (bespoke `<h1>` `:423`, raw `<select>`); `WorkflowRules.tsx` etaloni bo'yicha.
32. **FIX** — HARDCODE UI bloklarni real-fetch qilish: 24h-banner, haftalik-jadval, COUNCIL_LEVELS (yoki config-jadval).
33. **FIX** — Qoida 6 inline-SQL'ni servisga ko'chirish (`coordination.controller.ts:45-54,226-239`); 2 controllerga explicit `JwtAuthGuard` (`:31`, `workflow-rules.controller.ts:64`).
34. **FIX** — `GlobalInboxBadge.tsx:37,52,55,72` inline-style → Tailwind/token-class (Qoida 21).

---

## 8. EGASI-QAROR NUQTALARI (kod-fixdan ALOHIDA)

> Fix-ish boshlanishidan OLDIN egasi javob berishi kerak. 🔒 = Org-reset/head_user_id ga bog'liq.

1. **🔒 Users + org seed qachon?** Butun CC resolver/kvorum/kassir/RBAC shunga bog'liq (§3.4). — *Blokli.*
2. **GL-hisob mapping** — CC tasdiqda qaysi GL-hisob-raqamga posting (avans/moddiy-yordam/…)? Bugungi qaror "auto GL, aniq hisob-raqam buxgalter bilan keyin" (`QARORLAR:93`). — *Owner/buxgalter-DATA.*
3. **Shablon-CRUD ko'lami** — qaysi maydonlar in-app tahrirlanadi (ai_questions/workflow_steps/SLA)? Kim (super-admin only, #9)? Приказ+NDA yuridik matn alohida sessiya (`QARORLAR:103,119`). — *DECISION + matn-DATA.*
4. **Cross-module trigger siyosati** — MES/QC/HR/SD/PP dan qaysi eventlar CC-hujjat tug'diradi, dedup qanday? (tavsiya 7-12) — *DECISION.*
5. **🔒 Marshrut-resolver** — `MANAGER_OF_SENDER`/dept-head `head_user_id`/`manager_id` ga tayanadi; org qachon to'ladi? (§3.4) — *Blokli.*
6. **Kvorum sozlanishi** — 2/3 hardcode qoladimi yoki kengash-bo'yicha CRUD (#38)? Per-a'zo ovoz-yozuvi kerakmi? (tavsiya 18-19) — *DECISION.*
7. **Maydon×rol tahrir** — #27/#90/#91 (har bo'lim faqat o'z qismini) qurilsinmi, qachon? (tavsiya 6) — *DECISION/SCHEMA.*
8. **Outbox/Finance reversal** — #12/#45/#50 (transactional-outbox + backoff) qurilsinmi? BullMQ/Redis infra-qarori (`QARORLAR`). — *DECISION/infra.*
9. **AI pre-approval** — 100-hujjat chegarasi (#41/#72) + AI-key; faza-2 qachon? — *DECISION + AI-key-DATA.*
10. **Retention** — `archive_after_days` shablon-bo'yicha to'ldirilsinmi yoki position-tier (10y/3y) yetarlimi? 90-kun draft-arxiv (#4) kerakmi? — *DECISION/DATA.*
11. **Telegram imzo/tanishuv** — Telegram orqali imzo (#35), `/tanishuv` buyruq (COR #41) — bot-token (CAPEX). — *DATA.*
12. **Prikaz raqamlash** — DB SEQUENCE gapless (#5) tasdiqlansinmi + yil-boshi reset (#24)? — *DECISION.*
13. **dokla/rasporyazhenie retention** — soft-delete + audit (hozir hard-delete, Guruh-B `:139`) — *DECISION.*

---

## 9. XULOSA

CC/Koordinatsiya moduli **kod-injeneriya jihatidan boy va deyarli soxta-CRUD-siz** (10 controller, ~73 real-SQL endpoint, 3-savat engine, PIN-imzo idempotent, org-resolver qotirilgan darvoza, 2/3 kvorum, SLA cron, AI-intervyu draft, kassir-ko'prik, Socket.IO) — SD/CRM auditidagi "ko'rinadi lekin saqlamaydi" holati bu yerda **topilmadi**. Lekin **uch jiddiy bo'shliq**: (1) jonli baza BUGUN to'liq bo'sh — barcha tranzaksion `cc_*`/koordinatsiya jadval 0 qator, faqat konfiguratsiya seed (templates/steps/reasons/taxonomy), users=1 — hech narsa jonli isbotlanmagan; (2) vizyonning uch yadro-va'dasi **bugungi qarorga ZID yoki qurilmagan**: GL-avto-posting yo'q (faqat kassir-bildirishnoma), shablon-CRUD yo'q (seed-only), maydon×rol tahrir yo'q; (3) cross-module trigger deyarli yo'q — 5 kutilgan manbadan faqat POS-procurement ulangan, CC 0 tashqi domain-event chiqaradi. Master-reja bo'yicha 298 CC-itemning **~54% qurilmagan** (Ha 21 · Qisman 101 · Yo'q 161 · STALE 15). Modul "ichki hujjat-workflow skeleti" sifatida chuqur, lekin "EuroPrint koordinatsiya asab-tizimi" (golden-thread, GL, taksonomiya-driven, CRUD-sozlanadigan) sifatida hali yo'q. Eng katta bloklar egasi-darvozasida (org seed, GL-mapping, shablon-CRUD, event-siyosat) — toza-FIXlar (o'lik query, hard-delete, inline-SQL, EP-dizayn, taksonomiya-FK) esa darhol bajarilishi mumkin.

---
*Tayyorladi: 🔵 Tahlilchi sessiyasi · 2026-07-11 · READ-ONLY · barcha da'volar `fayl:qator`/SQL bilan · 3 mustaqil sub-agent + shaxsiy P0 qayta-tekshiruv.*
