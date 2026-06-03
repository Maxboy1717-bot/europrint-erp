# AGENT9 — KOMMUNIKATSIYA MARKAZI (Coordination) CHUQUR TAHLIL — 2026-06-02

> **FAQAT TAHLIL (read-only).** Hech narsa o'zgartirilmadi. Har da'vo kod (fayl:satr) + jonli DB
> (`europrint`@127.0.0.1:5432, `node _audit/q.cjs`) bilan tasdiqlandi. UI holati uchun mavjud
> brauzer-hisobotlariga tayanildi (`asl-holat-...-2026-06-02.md` — Super Admin sessiyasi),
> brauzer tabи ochilmadi (umumiy resurs).
>
> Bu hisobot `communication-center-roadmap.md` (egasi roadmap'i, "✅ bajarildi" deydi) va
> `asl-holat-...-2026-06-02.md` (CC ~30%, "bo'sh qobiq" deydi) ni **KENGAYTIRADI** — endi
> aniq fayl:satr + DB raqamlari + ikki parallel tizim aniqlandi.

---

## 0. XULOSA (eng muhim)

**Kommunikatsiya Markazi backend'i HAQIQATAN ham chuqur va sifatli qurilgan** (taxmin emas — kod o'qildi):
real workflow engine, AI Claude intervyu, bcrypt PIN imzo, org-sxema resolver, Telegram bot,
SLA cron, public QR verify, webhook (HMAC) — hammasi stub EMAS, Result pattern + Zod bilan.
**LEKIN tizim end-to-end ISHLAMAYDI va bir marta ham ishlatilmagan** (jonli DB: `cc_documents=0`).

**Ikki sabab tufayli "qobiq":**
1. **Org-sxema tayyor emas → workflow birinchi qadami ya'ni dvigatel ishga tushmaydi.** Har 14 shablonning
   **1-qadami `MANAGER_OF_SENDER`** (DB: 14 ta step), lekin jonli DB'da **`employees.manager_id` = 0 ta xodimda
   to'ldirilgan** → har hujjat "send" qilinganda *"Birinchi bosqich uchun mas'ul xodim topilmadi"* xatosi bilan
   to'xtaydi. Ya'ni bironta hujjat hech qachon birinchi inboxgacha yetib bormaydi.
2. **Ikki parallel "koordinatsiya" tizimi bir-biriga ulanmagan.** `/coordination` sahifasi foydalanuvchi avval
   ko'radigan **Doklad/Rasporyajenie/5 Kengash** tablari **`/api/coordination/*`** (director moduli, `dokla`
   jadvali) bilan ishlaydi; **3 Savat / AI hujjat / PIN / 14 shablon** esa butunlay boshqa **`/api/cc/*`**
   (`cc_*` 17 jadval) tizimi bo'lib, faqat "baskets" tab ichida embed qilingan. Foydalanuvchi ikkalasini
   bitta narsa deb o'ylaydi — aslida ulanmagan.

**Bajarilish bahosi: ~40%** (backend ~75%, ma'lumot/jonli-foydalanish ~5%, integratsiya ~15%, UI ~55%).
`asl-holat` hisobotidagi "~30%" ga yaqin; backend sifati hisobga olinsa bir oz yuqori. Struktura BOR,
ma'lumot YO'Q, oqim UZILGAN.

---

## 1. DB HOLATI — 17 cc_* jadval (jonli count, 2026-06-02)

`node _audit/q.cjs` bilan har jadval sanaldi:

| # | Jadval | Qator | Nima saqlaydi | Holat |
|---|--------|------:|---------------|-------|
| 1 | `cc_document_templates` | **14** | 14 hujjat turi shabloni + `ai_questions` (JSON) + `number_format` | ✅ SEED |
| 2 | `cc_workflow_steps` | **34** | Har shablon uchun tasdiq zanjiri qadamlari (approver_position_code) | ✅ SEED |
| 3 | `cc_rejection_reasons` | **84** | Rad etish sabablari (har shablonga bog'liq) | ✅ SEED |
| 4 | `cc_ai_sessions` | **3** | AI intervyu sessiyalari (test/sinov) | ⚠️ 3 test |
| 5 | `cc_notifications` | **33** | Bildirishnomalar (cron/test natijasi) | ⚠️ 33 |
| 6 | `cc_documents` | **0** | **ASOSIY hujjatlar jadvali — BO'SH** | ❌ 0 |
| 7 | `cc_approvals` | **0** | Tasdiqlash yozuvlari (imzo + hash) | ❌ 0 |
| 8 | `cc_basket_history` | **0** | Savatlar o'rtasida ko'chish tarixi | ❌ 0 |
| 9 | `cc_audit_trail` | **0** | Audit jurnali | ❌ 0 |
| 10 | `cc_document_versions` | **0** | Hujjat versiyalari (resubmit) | ❌ 0 |
| 11 | `cc_delegations` | **0** | Delegatsiya (o'rinbosar) | ❌ 0 |
| 12 | `cc_print_log` | **0** | Chop etish jurnali (sabab bilan) | ❌ 0 |
| 13 | `cc_complaints` | **0** | Direktorga shikoyatlar | ❌ 0 |
| 14 | `cc_attachments` | **0** | Hujjat ilovalari | ❌ 0 |
| 15 | `cc_branches` | **0** | Filiallar | ❌ 0 |
| 16 | `cc_user_pins` | **0** | **Xodim PIN hash'lari — BO'SH (hech kim PIN qo'ymagan)** | ❌ 0 |
| 17 | `cc_notification_prefs` | **0** | Bildirishnoma sozlamalari | ❌ 0 |

**Xulosa:** seed (shablon/qadam/sabab) bor (14 + 34 + 84 = 132 yozuv), lekin **transaksion ma'lumot 0**.
`cc_documents` 28 ustunli to'liq jadval — lekin **0 qator** = klassik "bo'sh qobiq". `cc_user_pins=0` →
**hech kim PIN o'rnatmagan** → hech kim hujjat yubora/tasdiqlay olmaydi (PIN majburiy).

14 shablon kodlari: `ADVANCE, CONTRACT_END, DOKLAD, FINANCIAL_AID, FIX_ERRORS, IMPROVEMENT, ORDER,
REPORT, SALARY_RAISE, SCHEDULE_CHANGE, TRAINING, TRANSFER, VACATION, ZRS_ZVS` — har birida 2-3 ta
`ai_questions` mavjud (tasdiqlandi: `jsonb_array_length(ai_questions)` 2-3).

---

## 2. ⚠️ ASOSIY KASHFIYOT: IKKI PARALLEL KOORDINATSIYA TIZIMI

`/coordination` sahifasi 5 tab ko'rsatadi (`CoordinationPage.tsx:220-275`), lekin ular **ikki butunlay
boshqa backend** bilan ishlaydi:

### Tizim A — "Director Coordination" (foydalanuvchi avval ko'radi)
- **Tablar:** Umumiy / Докладлар / Распоряжения / 5 Kengash (`CoordinationPage.tsx`)
- **Backend:** `apps/api/src/modules/director/presentation/coordination.controller.ts` → `@Controller('coordination')`
  → `/api/coordination/*`
- **Jadval:** `dokla` (yagona, 13 ustun) — doklad VA rasporyajenie ikkisi shu jadvalda (`coordination.repository.ts`)
- **5 Kengash:** `coordination.controller.ts:38-47` da **HARDCODED** 5 ta static obyekt (Boshqaruv/Sifat/Moliya/HR/Texnik) — DB jadval YO'Q
- **DB holati:** `dokla` = **0 qator** (jonli) → Доклад/Распоряжения tablari ham bo'sh
- **CRUD:** to'liq (create/list/update/delete/mark-read/mark-resolved/mark-done) + Result + Zod ✅

### Tizim B — "Communication Center / 3 Savat" (asl AI tizim)
- **Tab:** faqat "3 Savat" tab → `<BasketsSection />` → `<CommunicationCenter />` (`CoordinationPage.tsx:273`)
- **Backend:** `apps/api/src/modules/communication-center/` (35+ fayl) → `/api/cc/*`
- **Jadvallar:** `cc_*` (17 ta)
- **DB holati:** `cc_documents` = **0 qator** → 3 Savat bo'sh ("Savat bo'sh")

> **Natija:** Foydalanuvchi `/coordination` ochsa, "Доклад/Распоряжения" (Tizim A, `dokla`) bilan
> "3 Savat / Yangi hujjat" (Tizim B, `cc_documents`) **bir-biriga aloqasiz** ikki olam. `CoordinationPage.tsx:77`
> da `/api/coordination/baskets` ham chaqiriladi (Tizim A's getBaskets), lekin uning natijasi ishlatilmaydi
> (kod izohi: *"BasketDoc query kept for potential future use; data flows to CommunicationCenter internally"*).
> Ya'ni sahifa ikki tizim o'rtasida bo'lingan. Bu — vizyondagi "yagona markaz" emas.

---

## 3. BACKEND — har komponent ALOHIDA (kod tasdiqlangan, stub EMAS)

### 3.1 Modul ro'yxatdan o'tgan ✅
`app.module.ts:50,151` + `feature-modules.ts:43` — `CommunicationCenterModule` registered.
Modul (`communication-center.module.ts`): 6 controller + 16 provider + 7 export. AiModule + AgentsModule
import qiladi (AI router + DirectorAgent/StrategicAgent uchun).

### 3.2 Endpointlar — jami **27 ta** (5 controller + public + webhook)

| Controller | Prefiks | Endpoint | Holat |
|------------|---------|----------|-------|
| `CcBasketsController` | `/api/cc/baskets` | `stats/kpi`, `inbox`, `pending`, `outbox`, `summary`, `:id`, `:id/move` (7) | ✅ REAL (repo+DB) |
| `CcDocumentsController` | `/api/cc` | `documents/:id/pdf`, `templates`, `documents/:id/rejection-reasons`, `pin`, `pin/status`, `documents/draft`, `documents/:id`, `.../send`, `/approve`, `/reject`, `/resubmit`, `/cancel`, `/complaint`, `/print` (14) | ✅ REAL |
| `CcAiController` | `/api/cc/ai` | `start`, `sessions/:id/answer`, `sessions/:id/finalize`, `sessions/:id` (4) | ✅ REAL (Claude) |
| `CcNotificationPrefsController` | `/api/cc/notification-prefs` | `GET`, `PUT`, `POST` (3) | ⚠️ GET/PUT real; POST → `{ success:true }` stub |
| `CcWebhookController` | `/api/cc/webhooks` | `:source` (1) | ✅ REAL (HMAC+idempotency) |
| `CcPublicController` | `/api/cc/verify` | `:id` (1, `@Public`) | ✅ REAL (QR verify) |

Roadmap "25 endpoint" degandi — aniq son **27** (kpi + verify qo'shilgan).

**Guard holati:** Hammasi `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` bilan himoyalangan.
Faqat `CcPublicController` `@Public()` (QR verify — ataylab, 10 req/min throttle bilan, security-pentest
hisobotida ham ko'rilgan pattern). `CcWebhookController` guardsiz lekin HMAC-SHA256 + idempotency bilan
himoyalangan (`cc-webhook.controller.ts:64-88`).

### 3.3 Workflow engine — REAL, lekin org-sxemaga BOG'LIQ ✅/⚠️
`cc-workflow.service.ts` (248 satr) — 5 operatsiya: `sendDocument / approve / reject / resubmit / cancel`
+ `createDraft / createComplaint / logPrint`. To'liq Result pattern, helper'larga bo'lingan (Rule 16):
- **Sequential + parallel approval** (`createFirstStepApprovals` — bir qadamda bir nechta approver),
- **rejection_stops** logikasi (1 ta rad butun zanjirni to'xtatadi yoki yo'q),
- **delegation** (faol o'rinbosarga yo'naltirish),
- **resubmit** transaksiya ichida versiyani oshiradi.

> ⚠️ **Lekin:** `sendDocument` (`:88-93`) birinchi qadamga approver topa olmasa
> *"Birinchi bosqich (N) uchun mas'ul xodim topilmadi"* BadRequest tashlaydi — bu **hozir har hujjatda
> sodir bo'ladi** (3.5-bo'limga qarang).

### 3.4 AI Claude intervyu — REAL ✅
`cc-ai-interview.service.ts` (299 satr): `start → answer → finalize` oqimi.
- `start`: sessiya yaratadi (`cc_ai_sessions`, 2 soat expiry), birinchi savolni qaytaradi.
- `answer`: javobni validatsiya qiladi (`validateAnswer`), keyingisini qaytaradi.
- `finalize`: **haqiqiy Claude chaqiruvi** (`this.ai.callClaude({ taskType: 'cc.generate_document', ... })`,
  `:213-219`) — rasmiy hujjat matnini yaratadi, `cc_documents` ga draft saqlaydi.
- **Test mode:** `number_format` da `TEST` bo'lsa AI chaqirilmaydi (`:210-212`).
- `AiRouterCallService` orqali — ya'ni AI moduli bilan haqiqatan integratsiya.

DB tasdiq: `cc_ai_sessions=3` → 3 marta sinovdan o'tgan (ehtimol test mode). Lekin natija `cc_documents`
ga draft yaratmagan (cc_documents=0) yoki yaratilgan draftlar o'chirilgan → real foydalanish yo'q.

### 3.5 Org-sxema resolver — KOD REAL, lekin DATA YO'Q ❌ (ASOSIY BLOKER)
`cc-org-resolver.service.ts` (115 satr) 4 kod turini hal qiladi:
- `CEO` → `org_departments` root `head_user_id`
- `MANAGER_OF_SENDER` → `employees.manager_id` → manager.user_id
- `DEPT_HEAD` → `employee_org_departments` (is_primary) → `org_departments.head_user_id`
- `POSITION:<CODE>` → `positions.code` bo'yicha faol xodim
- + faol `cc_delegations` tekshiruvi

**Jonli DB org-sxema tayyorligini tekshirdim (`node _audit/q.cjs`):**

| Resolver kodi | Bog'liq DB | Jonli son | Resolver natijasi |
|---------------|-----------|----------:|-------------------|
| `MANAGER_OF_SENDER` | `employees.manager_id IS NOT NULL` | **0** | ❌ **HAR DOIM XATO** |
| `CEO` | `org_departments parent_id IS NULL AND head_user_id` | 12 | ⚠️ ishlaydi (lekin 12 ta root — chalkash) |
| `DEPT_HEAD` | `org_departments.head_user_id` | 18 / 142 dept | ⚠️ qisman (faqat 18 bo'limda rahbar) |
| `POSITION:HR_HEAD/CFO/KASSIR` | `positions` + xodim | 96 positions | ⚠️ pozitsiya bor, biriktirilgan xodim bormi noaniq |

**Workflow steps approver kodlari (jonli, 34 qadam):**
- `MANAGER_OF_SENDER` = **14 ta** (har shablonning 1-qadami!)
- `CEO` = 7, `POSITION:HR_HEAD` = 7, `POSITION:CFO` = 4, `POSITION:KASSIR` = 2

> ❌ **Hal qiluvchi xulosa:** **Har 14 shablonning birinchi qadami `MANAGER_OF_SENDER`** (masalan ADVANCE
> step1, VACATION step1, DOKLAD step1, ORDER step1 — DB'dan tasdiqlandi), lekin **jonli DB'da bironta
> xodimning `manager_id` to'ldirilmagan (0)**. Demak foydalanuvchi PIN qo'yib hujjat "send" qilsa ham,
> `resolveManagerOfSender` *"Yuboruvchining bo'lim rahbari orgsxemada belgilanmagan"* tashlaydi →
> `createFirstStepApprovals` bo'sh qaytaradi → `sendDocument` *"mas'ul xodim topilmadi"* bilan to'xtaydi.
> **Ya'ni hozirgi DB holatida bironta hujjat hech qachon birinchi inboxga yetib bormaydi.** Bu — CC
> bo'shligining texnik sababi (faqat "hech kim ishlatmagan" emas, balki "ishlata olmaydi").

### 3.6 PIN imzo — REAL ✅ (lekin 0 PIN o'rnatilgan)
`cc-pin.service.ts` (75 satr): bcrypt hash (`BCRYPT_ROUNDS` security konstanta), `verifyAndSign`
sha256 audit imzo (`cc:v1:<ts>:<sig>`) qaytaradi. ON CONFLICT upsert. Kod sifatli, lekin
`cc_user_pins=0` → **hech kim PIN qo'ymagan** → send/approve/reject hammasi PIN talab qiladi →
hech kim ishlata olmaydi.

### 3.7 14 hujjat turi shablon + seed ✅
DB: 14 shablon, har birida 2-3 AI savol, 34 workflow qadam, 84 rad sababi. Roadmap "14 hujjat turi"
da'vosi **DB bilan tasdiqlandi** (taxmin emas). Seed faktик mavjud.

### 3.8 Telegram bot — REAL ✅ (lekin token kerak)
`cc-bot.service.ts` (266 satr): `telegraf` bilan. Komandlar: `/start /savat /kiruvchi /kutish /chiquvchi
/yangi /profil` + direktor komandlari + inline `approve:/reject:/view:/reject_reason:`. PIN flow Telegram
ichida (chat-id'dan user'ga resolve, PIN matnli kiritish → `wf.approve/reject`). `OnModuleInit` da
`TELEGRAM_CC_BOT_TOKEN` bo'lmasa *"CC bot o'chirilgan"* warn bilan jim o'chadi (`:61-63`). Ya'ni kod tayyor,
lekin token sozlanmaган bo'lsa ishlamaydi. **`/yangi` komandasi:** AI intervyu Telegram'da hali yo'q —
veb-sahifaga yo'naltiradi (`:123-129`, *"Telegram orqali AI intervyu kelajakda qo'shiladi"*).

### 3.9 SLA cron — REAL ✅
`cc-sla.cron.ts` (219 satr): har 30 daqiqa — 24h inbox overdue belgilash + **48h auto-reject** +
approval escalation + delegation expire. Har soat — recurring (lekin `spawnRecurringDocuments` **placeholder,
hech narsa qilmaydi**, `:197-202`). cc_documents=0 bo'lgani uchun cron amalda hech nimaga ta'sir qilmaydi.

### 3.10 Public QR verify — REAL ✅
`cc-public.controller.ts` (127 satr): `@Public` `/api/cc/verify/:id` — JWTsiz, imzolar zanjirini
ko'rsatadi (hash oxirgi 12 belgi), 10 req/min throttle. PDF QR uchun. Real SQL, ishlaydi (lekin
tekshiradigan hujjat yo'q).

### 3.11 Webhook — REAL ✅
`cc-webhook.controller.ts` (120 satr): `POST /api/cc/webhooks/:source`, HMAC-SHA256 + idempotency
(in-memory, Redis emas — kodda WARN bor), `timingSafeEqual`. `cc.spawn` event emit qiladi.
**Audit yozuvi placeholder** (`:94-96` — *"webhook log jadvali keyingi versiyada"*, `SELECT 1`).

### 3.12 Event listener — REAL, lekin autoSend ISHLAMAYDI ⚠️
`cc-event.listener.ts` (107 satr): `@EventsHandler(CcSpawnRequestedEvent)`. Boshqa modullar `cc.spawn`
chiqarsa, kod bo'yicha draft yaratadi (`cc_documents` ga). **LEKIN `autoSend=true` bo'lsa ham send qilmaydi**
(`:97-102`): *"autoSend=true bo'ldi, lekin send uchun PIN talab qilinadi. Draft holatda qoldirildi"*.
> ⚠️ **Demak boshqa ERP modullari (Savdo, Ombor P2P) CC'ga avtomatik hujjat yubora olmaydi** — eng yaxshi
> holatda draft yaratiladi, lekin tasdiq zanjiriga tushmaydi. Bu — `asl-holat`dagi "P2P → CC ulanmagan"
> ва "Kanban 3-savat mock" muammosining ildizi: real avto-spawn oqimi yo'q.

---

## 4. FRONTEND — komponentlar real, lekin bo'sh ma'lumot

### 4.1 6 ta CC komponent (`artifacts/erp-dashboard/src/components/cc/`)
| Fayl | Vazifa | Holat |
|------|--------|-------|
| `CommunicationCenter.tsx` (154) | 3 ustun (Kiruvchi/Kutish/Chiquvchi) + badge + 24h banner | ✅ REAL, `/api/cc/baskets/*` ga ulangan, 30s refetch |
| `BasketColumn.tsx` | Ustun + DocumentCard | ✅ |
| `NewDocumentModal.tsx` | 4 qadamli AI intervyu modali | ✅ (AI start/answer/finalize) |
| `DocumentDetailModal.tsx` | Hujjat tafsilot + approve/reject | ✅ |
| `PinPromptModal.tsx` | PIN kiritish | ✅ |
| `GlobalInboxBadge.tsx` (80) | Sidebar header badge, `/api/cc/baskets/summary`, 30s | ✅ REAL |

`CommunicationCenter.tsx` to'g'ridan `/api/cc/baskets/{summary,inbox,pending,outbox}` chaqiradi
(`:29-49`) — **Tizim B (cc_*) ga ulangan**, doklad sahifasi (Tizim A) emas. cc_documents=0 →
hamma savat bo'sh ("Savat bo'sh").

> ⚠️ **Dizayn-token buzilishi:** `GlobalInboxBadge.tsx:37-67` inline xom rang (`rgba(...)`, `#EF4444`,
> `#3B82F6`) ishlatadi — bu CLAUDE.md Qoida 21 (token majburiy) ga zid. Kichik, lekin regress-guard
> nazarda tutgan pattern.

### 4.2 CoordinationPage (5 fayl)
`CoordinationPage.tsx` + `...Sections/Dialogs/Helpers/Overview.tsx`. 5 tab (`:220-275`). Doklad/Raspo
tablari `/api/coordination/*` (Tizim A) bilan to'liq CRUD (create dialog, mark-read/resolved/done
mutatsiyalari) — `dokla=0` bo'lsa ham UI funksional. "3 Savat" tab → `<BasketsSection />` →
`CommunicationCenter` (Tizim B). 5 Kengash tab → hardcoded 5 kengash.

### 4.3 Sidebar
`constants.ts:613-622`: `coordination` guruhi 4 link — "Kommunikatsiya Markazi"
(`coordination?tab=baskets`), "5 Kengash Tizimi", "Hisobot Yuborish" (dokla), "Ko'rsatma Berish" (raspo).
`coordination = "DIRECTOR"` (689-satr) → faqat direktor/admin ko'radi (rol-gate bor).

---

## 5. VIZYON vs HOZIRGI (egasi roadmap nuqtalari)

| # | Vizyon nuqtasi | Holat | Dalil |
|---|----------------|-------|-------|
| 1 | AI hujjat yozish (Claude intervyu) | ✅ KOD REAL, ⚠️ data yo'q | `cc-ai-interview.service.ts:213` callClaude; `cc_ai_sessions=3` (test) |
| 2 | 3 Savat (Kiruvchi/Kutish/Chiquvchi) | ⚠️ STRUKTURA, BO'SH | `CommunicationCenter.tsx` real; `cc_documents=0` → hammasi bo'sh |
| 3 | Org-sxema oqimi (tasdiq zanjiri) | ❌ BLOKED | `MANAGER_OF_SENDER` 14 step, lekin `emp_with_mgr=0` → 1-qadam ishlamaydi |
| 4 | PIN imzo | ✅ KOD REAL, ❌ 0 PIN | `cc-pin.service.ts` bcrypt+sha256; `cc_user_pins=0` |
| 5 | 14 hujjat turi (shablon) | ✅ BOR | DB: `cc_document_templates=14` + ai_questions |
| 6 | Telegram bot | ✅ KOD REAL, ⚠️ token | `cc-bot.service.ts` telegraf; token yo'q bo'lsa jim o'chadi; AI intake Telegram'da yo'q |
| 7 | Tasdiq zanjiri + 24h SLA | ✅ KOD, ⚠️ amal yo'q | `cc-sla.cron.ts` 24h/48h; cc_documents=0 → hech nimaga ta'sir yo'q |
| 8 | Boshqa modullardan avto-hujjat (spawn) | ❌ UZILGAN | `cc-event.listener.ts:97` autoSend draft holatda qoladi (PIN sababi) |
| 9 | QR public verify | ✅ REAL | `cc-public.controller.ts` `@Public`; tekshiradigan hujjat yo'q |
| 10 | Webhook (tashqi) | ✅ REAL | `cc-webhook.controller.ts` HMAC; audit log placeholder |
| 11 | Tab vs alohida sahifa | ⚠️ TAB + ikki tizim | `/coordination` ichida tab; CC (Tizim B) + Doklad (Tizim A) aralash |

---

## 6. HUKM — har narsa 3 toifa

### ✅ ISHLAYDI (kod sifatli, stub emas) — backend asoslari
- 27 endpoint (5 controller + public + webhook), hammasi guard/throttle bilan
- Workflow engine (5 op + sequential/parallel/delegation/rejection_stops) — `cc-workflow.service.ts`
- AI Claude intervyu (start/answer/finalize, real callClaude) — `cc-ai-interview.service.ts`
- PIN service (bcrypt + sha256 imzo) — `cc-pin.service.ts`
- Org resolver (4 kod turi + delegatsiya) — `cc-org-resolver.service.ts` *(kod, data emas)*
- SLA cron (24h/48h/escalation/delegation expire) — `cc-sla.cron.ts`
- Public QR verify + Webhook HMAC — `cc-public/cc-webhook.controller.ts`
- Telegram bot (komandlar + inline PIN flow) — `cc-bot.service.ts`
- 6 FE komponent + GlobalInboxBadge, `/api/cc/*` ga ulangan
- Seed: 14 shablon + 34 qadam + 84 sabab (DB tasdiq)
- Director Coordination CRUD (dokla) — `coordination.controller.ts` (Tizim A)

### ⚠️ QISMAN / STUB
- `CcNotificationPrefsController.create()` → `{ success:true }` (Qoida 10 buzilishi, `:38-40`)
- Webhook audit yozuvi → `SELECT 1` placeholder (`cc-webhook.controller.ts:94-96`)
- Cron `spawnRecurringDocuments()` → bo'sh placeholder (`cc-sla.cron.ts:197-202`)
- Telegram `/yangi` AI intake → yo'q, veb-sahifaga yo'naltiradi
- 5 Kengash → hardcoded static (DB jadval yo'q)
- HMAC idempotency → in-memory (multi-pod'da ishlamaydi, kodda WARN)
- `GlobalInboxBadge` inline xom rang (Qoida 21)

### ❌ YO'Q / BUZUQ (real foydalanishni bloklaydi)
- **`cc_documents=0`** + 11 transaksion jadval bo'sh → hech qachon ishlatilmagan
- **`cc_user_pins=0`** → hech kim PIN qo'ymagan → send/approve/reject ishlamaydi
- **`employees.manager_id=0`** → `MANAGER_OF_SENDER` (14 shablonning 1-qadami) har doim xato → **hujjat
  hech qachon birinchi inboxga yetmaydi** (eng kritik texnik bloker)
- **autoSend ishlamaydi** → boshqa modullar (P2P, Savdo) CC'ga real hujjat yubora olmaydi
- **Ikki parallel tizim** (`/api/cc/*` vs `/api/coordination/*`, `cc_documents` vs `dokla`) ulanmagan
- Director Coordination data: `dokla=0` → Доклад/Распоряжения tablari ham bo'sh

---

## 7. NECHA % — yakuniy baho

| Qatlam | % | Izoh |
|--------|---:|------|
| Backend kod (workflow/AI/PIN/cron/bot/webhook) | **~75%** | Sifatli, real, stub emas; bir nechta placeholder |
| Seed (shablon/qadam/sabab) | **~90%** | 14+34+84 mavjud |
| Org-sxema tayyorligi (oqim uchun) | **~15%** | manager_id=0 → dvigatel ishlamaydi |
| Transaksion ma'lumot / jonli foydalanish | **~5%** | cc_documents=0, cc_user_pins=0 |
| Integratsiya (boshqa modul → CC) | **~15%** | autoSend bloked; spawn draft'da qoladi |
| Frontend (komponentlar) | **~55%** | komponent bor, ma'lumot yo'q, ikki tizim aralash |

> **UMUMIY: ~40%.** (`asl-holat` "~30%" ga yaqin — backend chuqurligi hisobga olinsa biroz yuqori.)
> **Struktura va kod BOR (kuchli), ma'lumot va oqim YO'Q.** Bu "ishlamaydigan" emas, balki
> **"ishga tushirilmagan + ulanmagan"** holat. To'g'ri tashxis: *bo'sh-lekin-qurilgan qobiq + uzilgan oqim*.

---

## 8. EGASI UCHUN — nima qilsa CC "tirilad" (tavsiya, ixtiyoriy)

1. **Org-sxemani to'ldirish** (eng muhim, 1-qadamlik): `employees.manager_id` ni to'ldirish YOKI 14
   shablonning 1-qadamini `MANAGER_OF_SENDER` dan `DEPT_HEAD`/`POSITION:` ga o'zgartirish — shusiz hech
   qanday hujjat yubora bo'lmaydi.
2. **PIN onboarding**: foydalanuvchilarni majburan PIN o'rnatishga undash (UI'da "PIN qo'ying" oqimi).
3. **Ikki tizimni birlashtirish**: Doklad/Rasporyajenie (`dokla`) ni CC `cc_documents` shabloniga
   ko'chirish YOKI aksincha — `/coordination` da bitta haqiqat manbai bo'lishi kerak.
4. **autoSend uchun "tizim PIN"** mexanizmi (`cc-event.listener.ts:97` da aytilgan) — shusiz modullararo
   spawn faqat draft yaratadi.
5. **Sinov ma'lumoti**: bitta to'liq hujjatni uchidan-uchiga o'tkazib (draft→send→approve→archive) oqimni
   isbotlash; hozir bironta yopiq sikl yo'q.

---

*Tahlil 2026-06-02 (agent9-kommunikatsiya). FAQAT read-only — hech narsa o'zgartirilmadi. Manbalar:
kod (35+ BE fayl + 11 FE fayl, fayl:satr) + jonli DB `node _audit/q.cjs` (17 cc_* + dokla + org count) +
`communication-center-roadmap.md` + `asl-holat-...-2026-06-02.md` (brauzer, Super Admin).*
