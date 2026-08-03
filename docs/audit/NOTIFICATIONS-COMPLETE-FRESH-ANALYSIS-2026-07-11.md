# Notifications (18-notifications) Moduli — To'liq Yangi Tekshiruv

> **Sana:** 2026-07-11 · **Rol:** 🔵 Tahlilchi · **READ-ONLY** — hech bir kod, sxema, konfiguratsiya yoki ma'lumot o'zgartirilmadi. Yagona yaratilgan fayl — shu hisobot.
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` (`node _audit/q.cjs`).
>
> **Metodologiya (Q-29 verify-don't-trust).** `docs/audit/` hujjatlari (vizyon-1000 `18-notifications` + `decisions/18-notifications` EP-NTF, master-reja `[Module-18]`, Guruh-B, QARORLAR/OWNER-JAVOBLAR-2026-07-11) faqat "qayerga qarash" ko'rsatkichi bo'ldi; har bir da'vo **shu tahlirda** olingan `fayl:qator` yoki `SQL natija` bilan qo'llab-quvvatlandi. `CC-…-2026-07-11.md` va `KANBAN-…-2026-07-11.md` faqat **struktura/rigor namunasi** sifatida ishlatildi.
> **Ish tartibi:** deterministik inventar → 2 mustaqil read-only sub-agent (FE sahifa/API/dizayn · cross-module producer/listener/telegram/cron) → har bir P0 da'vo shaxsan qayta tekshirildi (jonli jadval/qatorlar, routing-resolver rol-so'rovi, create→telegram userId=chatId bug, schema-gap alert_thresholds/kanban_column_sla, taksonomiya seed, view pass-through).

⚠️ **Qamrov chegarasi.** Bu audit **18-notifications = markaziy bildirishnoma/ogohlantirish tizimi**ni qamraydi: (a) `modules/notifications/*` (3 controller — `notifications`, `notification-routing-rules`, `notification-schedules`; 7 listener; SMS/Email/Telegram adapter; schedule cron; pref-matritsa); (b) FE bildirishnoma sahifalar (`NotificationCenter`, `NotificationSettings`, `kanban/NotificationsPanel`) va ~10 alert-sirt (director/WMS/HR/camera/POS/IoT). **Telegram INBOUND bot-gateway** (`modules/bot-gateway` — 9 bot, webhook) alohida modul; u faqat qayd etildi (Telegram tayyorligi bahosida muhim, §3.5). Har modulning o'z ogohlantirish-mantiqi (masalan MES SOS eskalatsiyasi) o'z modulida qoladi — bu yerda faqat "notifications jadvaliga yozadimi" nuqtai-nazaridan ko'riladi.

---

## 0. Eng kritik topilma (bir jumlada)

**Bildirishnoma moduli — kod jihatidan g'ayrioddiy chuqur va deyarli soxta-CRUD-siz qurilgan (3 real controller + `notification_routing_rules`/`notification_schedules` to'liq CRUD, per-tur × per-kanal granular pref-matritsa REAL round-trip, hodisa→rol markaziy marshrut-resolver, soatlik jadval-cron REAL INSERT, 7 event-listener, SMS/Email/Telegram port-adapter, `withRetry`), lekin (a) jonli baza BUGUN reset — kanonik `notifications` jadval = 0 qator, `users`=1 (faqat super_admin), va BUTUN qabul-qiluvchi hal qilish (routing-jadval qoidalari + qattiq rol-fallback + jadval-cron rol-fan-out) `users.role` ustiga qurilgan → hozir bildirishnomalar HECH KIMGA yetmaydi (jimgina warn-log); (b) vizyonning yagona-jadval va'dasi (`ntf_notifications` module_code/channel/status/immutable ustunlari bilan, DELETE-trigger immutability) qurilmagan — kanonik `notifications` 24 eskirgan ustun, in-app oqim POS/CC/Kanban VIEW'lari + ~15 to'g'ridan `INSERT INTO notifications` yozuvchisi bilan PARCHALANGAN, `CreateNotificationCommand` blessed-yo'lini faqat Finance/MM ishlatadi; (c) Telegram INBOUND/ACK halqasi module-18'da YO'Q (inbound alohida `bot-gateway`da), va yagona ulangan create→telegram yo'li `userId`ni `chat_id` sifatida yuboradi (yetkazish bug'i, chat_id hal qilinmaydi), `TelegramSvc` klassi + adapterning 5 tipli `send*` metodi O'LIK.** Master-reja bo'yicha 132 Module-18 item: **Ha 3 · Qisman 31 · Yo'q 93 · STALE-DOC 5**.

Uch eng og'ir strukturaviy nuqson:

| # | Nuqson | Dalil |
|---|---|---|
| **1** | **Jonli baza bo'sh + qabul-qiluvchi hal qilish 0 user'ga tushadi.** Kanonik `notifications`=0 qator; `users`=1 (super_admin). Har bir adresat-hal (routing-jadval, qattiq rol-fallback, jadval-cron rol-fan-out) = `SELECT id FROM users WHERE role IN (...)` — org-ierarxiyaga EMAS, `users.role`ga tayanadi. `warehouse_keeper`/`production_manager`/`director` rolli user yo'q → 4 routing-qoida ham, fallback ham 0 qabul-qiluvchi. Listenerlar crash bermay warn-log yozadi (jimgina no-delivery). | jonli: `notifications`=0, `users`=1 (§1.3); `notification-routing.repository.ts:147-149`; `qc-failed-notification.listener.ts:47` |
| **2** | **Vizyon "yagona `ntf_notifications` jadval" va immutability QURILMAGAN; in-app oqim parchalangan.** Kanonik jadval = `notifications` (24 eskirgan ustun: `module_code`/`channel`/`status`/`payload_json`/`immutable` YO'Q). `ntf_notifications` jadvali umuman yo'q. `pos_notifications` va `cc_notifications` = `notifications` ustidan FILTRSIZ pass-through VIEW. ~15 modul `CreateNotificationCommand`ni chetlab to'g'ridan `INSERT INTO notifications` qiladi. DELETE-immutability trigger yo'q. | `to_regclass('ntf_notifications')`→null; view-def §1.4; cross-module §3.4 |
| **3** | **Telegram: inbound/ACK yo'q + create→telegram yetkazish bug'i + o'lik kod.** Module-18 Telegram FAQAT outbound (polling yo'q, webhook yo'q). Yagona ulangan yo'l `create-notification.handler.ts:53,57-60` — `channels ?? ['telegram','in_app']`, `telegramService.sendMessage(command.userId, ...)` — ya'ni `userId` `chat_id` sifatida uzatiladi, foydalanuvchining `telegram_chat_id`si HAL QILINMAYDI. Chat_id'ni to'g'ri hal qiladigan `TelegramSvc` (butun klass) tashqi chaqiruvchisiz; adapterning `sendOrderStatusUpdate/sendAdvanceReminder/sendCertExpiry/sendStockAlert/sendQcResult` — xabar quradi, HECH QACHON yubormaydi (o'lik stub). | `create-notification.handler.ts:57-60`; `telegram-bot.adapter.ts:198-247`; `TelegramSvc` 0 chaqiruvchi (§3.5) |

---

## 1. SAHIFA INVENTARI (noldan chiqarilgan)

### 1.1 Manba va usul

- **FE marshrutlar:**
  - `routes/AnalyticsRoutes.tsx:25,29` → `/notifications` (NotificationCenter, lazy) → `AppRouter.tsx:105` `ModuleGroup roles={ALL_AUTHENTICATED}` (eng keng darvoza).
  - `routes/WarehouseRoutes.tsx:35,84` → `/wms/notifications` (NotificationCenter, **legacy alias**) → `AppRouter.tsx:109` WAREHOUSE_ROLES.
  - `routes/AdminRoutes.tsx:12,42` → `/settings/notifications` (NotificationSettings) → `AppRouter.tsx:108` `ADMIN_ROLES` (`['admin','super_admin']`).
- **Sidebar:** `components/sidebar/constants.ts:438` — `{ title: "Bildirishnomalar", url: "notifications", icon: Inbox }` (HR/DAVOMAT guruhida). `NotificationSettings` sidebar'da YO'Q (faqat to'g'ridan-URL yoki Settings-sahifadan link).
- **BE controllerlar:** `notifications.module.ts:79` → `NotificationsController` (`/api/notifications`), `NotificationSchedulesController` (`/api/notification-schedules`), `NotificationRoutingController` (`/api/notification-routing-rules`). Qo'shimcha o'qish-sirtlar (boshqa modul controllerlari, ayni `notifications` jadval/VIEW ustidan): `pos-notifications.controller.ts` (`/api/pos/notifications`), `kanban-boards.controller.ts:180-204` (`/api/kanban/notifications`).
- **Rol darvozasi (BE):** `NotificationsController` class `@Roles('admin','manager','supervisor','operator','employee','viewer','director')` (`:41`), `POST /notifications` yaratish `@Roles('admin','super_admin')` (`:187`). Routing/Schedules controller `@Roles('admin','super_admin','director')`.

### 1.2 Raqamlar (shu tahlirda hisoblangan)

| O'lchov | Qiymat |
|---|---|
| Module-18 FE marshrut (routed) | **3** (`/notifications`, `/wms/notifications` alias, `/settings/notifications`) |
| Module-18 BE controller | **3** (`notifications`, `notification-routing-rules`, `notification-schedules`) |
| `notifications` jadvalini o'qiydigan BOSHQA controller | **3** (`pos/notifications`, `kanban/notifications`, + `cc_notifications` VIEW yozuvchilari) |
| BE event-listener (`event-handlers/`) | **8 fayl** (7 faol provider + `erp-events` o'lik `export {}`) |
| BE port-adapter (SMS/Email/Telegram) | **3** (Eskiz SMS, SMTP email, Telegram bot) |
| FE bildirishnoma/alert sirt (sahifa+embedded) | **~13** (3 asosiy + 10 alert-sirt) |
| Jonli `*notif*`/`*alert*` jadval | **27** (ko'pi boshqa modul; kanonik = `notifications`) |
| ORPHAN BE fayl (import/registratsiyasiz) | **≥5** (`alerts/alerts.service`+`repo`, `domain/services/{telegram,sms,email-notification}.service`) |
| O'LIK listener (emittersiz) | **5 topik** (`notifications.create` + 4×`kanban.task.*`) |
| O'LIK adapter-metod | **5** (`telegram-bot.adapter.ts:198-247`) |
| Schema-gap (vizyon talab qiladi, jadval YO'Q) | **2** (`alert_thresholds`, `kanban_column_sla`) + `ntf_notifications` |
| >900 qatorli fayl (Qoida 13) | **0** (eng katta FE: kanban/NotificationsPanel 205, NotificationCenter 204) |

### 1.3 Jonli DB holati (RESET tasdig'i)

```
── KONFIGURATSIYA (qisman seed) ──
notification_routing_rules = 4   (wms.low_stock→warehouse_keeper · qc.failed→production_manager
                                  · mro.machine_stopped→director · wms.lot_expiring→director)
notification_schedules     = 1   (#1 "Kunlik kompaniya digesti" company_digest→super_admin, 24h, active)
taxonomy_entries           = 96  (notification_category 6 · contact_type 5 · document_type 6 · ...)

── TRANZAKSION / FEED (hammasi BO'SH) ──
notifications=0  notification_logs=0  notification_preferences=0  notification_type_preferences=0
kanban_notifications=0  task_notifications=0  boomerang_notifications=0
cc_notifications=0(VIEW)  pos_notifications=0(VIEW)
system_alerts=0  ai_alerts=0  iot_alerts=0  camera_alerts=0  sos_alerts=0  low_stock_alerts=0  wms_alerts=0
workflow_rules=0

── SCHEMA-GAP (vizyon talab qiladi — JADVAL YO'Q) ──
alert_thresholds       → to_regclass = NULL  (MAVJUD EMAS)
kanban_column_sla      → to_regclass = NULL  (MAVJUD EMAS)
ntf_notifications      → to_regclass = NULL  (MAVJUD EMAS — kanonik = notifications)

── ORG RESET ──
users=1 (admin/super_admin)  org_departments/positions/org_functions/employees = 0/0/0/0
```

⚠️ **Prompt-kontekst tasdiqlandi (jonli):** `alert_thresholds` va `kanban_column_sla` **haqiqatan mavjud emas**. Vizyon (Module-18 Item 19 — "har status uchun alohida SLA `kanban_column_sla`") va per-modul alert-chegara "bugun CRUD-default tasdiqlandi" da'volari — **schema-gap** (jadval yaratilmagan). `notifications` BASE TABLE (VIEW emas); `pos_notifications`/`cc_notifications` = uning ustidan filtrsiz VIEW.

⚠️ **Master-reja evidensiyasi ESKIRGAN (reset tufayli).** `FULL-ITEM-LEVEL-MASTER-PLAN` Item 2 "notifications = 7030 qator", Guruh-B "6483 LOW_STOCK qator user_id=0" — BUGUNGI reset ularni 0 ga tushirdi. Bu tahlilda hamma qator-sanog'i JONLI qayta olindi.

### 1.4 Kanonik jadval qarori (muhim)

- **`notifications` = kanonik BASE TABLE** — 24 ustun (`id/user_id/type/title/title_ru/body/message_ru/is_read/created_at/reference_id/reference_type/message/read/entity_type/entity_id/updated_at/document_id/priority/title_uz/message_uz/read_at/sent_via_telegram/telegram_message_id/notification_type/metadata`). ⚠️ Vizyon (Item 2) talab qilgan `module_code`/`channel`/`status`/`payload_json`/`immutable` ustunlari **yo'q**; ikkilangan ustunlar bor (`is_read`╳`read`, `body`╳`message`, `title`╳`title_uz`) — legacy-drift.
- **`pos_notifications` = VIEW** (`SELECT ... FROM notifications;` — FILTRSIZ pass-through, 25/25 ustun). **`cc_notifications` = VIEW** (aynan bir xil pass-through). Ya'ni "POS bildirishnoma" va "CC bildirishnoma" = bir jadvalning har xil nomli ko'zoynagi.
- **Feed parchalanishi:** FE `NotificationCenter` `/api/pos/notifications` (POS VIEW) dan o'qiydi — module-18'ning o'z `/api/notifications` controlleridan EMAS. Ya'ni "Markaziy bildirishnoma sahifasi" POS-controller orqali `pos.movements.read` ruxsati bilan ishlaydi. In-app oqim `pos`/`kanban`/`agents`/`camera`/`hr`/`director` bo'ylab tarqoq — **yagona feed yo'q**.

---

## 2. HAR SAHIFA / KO'RINISH TAHLILI

> Manba: FE sub-agent (`fayl:qator`). Har bir BE-endpoint mavjudligi grep bilan tasdiqlandi.

| Sahifa/Ko'rinish | Reachable? | API holati | Fake-save | Green-lie | RBAC holati | Dizayn muvofiqligi | Boshqa topilma |
|---|---|---|---|---|---|---|---|
| **`/notifications` (NotificationCenter, 204q)** | ✅ sidebar `constants.ts:438`; ALL_AUTHENTICATED | REAL — `GET /api/pos/notifications` (`:70`, 30s poll), `POST /api/pos/notifications/:id/read` (`:85`), `.../read-all` (`:92`) — 3 endpoint `pos-notifications.controller.ts:35,42,52` da mavjud | Yo'q — mutation real, lokal state optimistik ko'zgu | Yo'q | route-darvoza + BE `PermissionGuard` `pos.movements.read` (`pos-notifications.controller.ts:36`) | ❌ EPPageHeader YO'Q (bespoke `<h1>`+Bell `:112-127`); 🟡 raw `<select>` tur-filtri (`:146`); div-list (EPTable emas); token+Tailwind-palette (xom-hex yo'q) | 🔴 **Feed-drift:** "Markaziy bildirishnoma" POS-VIEW'dan o'qiydi + `pos.movements.read` gate (umumiy user'ga POS-ruxsat kerak); `TYPE_CONFIG` faqat WMS/POS turlar (MOVEMENT_*/LOW_STOCK/QC_PENDING) — 6 rasmiy toifa (buyruq/ogohlantirish/...) ULANMAGAN |
| **`/settings/notifications` (NotificationSettings, 178q)** | ✅ `AdminRoutes.tsx:42`; ADMIN_ROLES; **sidebar'da yo'q** | REAL — `GET /api/notifications/preferences` (useQuery `:54`), `PATCH /api/notifications/preferences` (`:66`) — `notifications.controller.ts:108,169` | Yo'q — real PATCH matritsa; server-data `safeArray` bilan hidratsiya (`:57-62`) | Yo'q | route ADMIN_ROLES; BE class `@Roles(admin,manager,...employee)` | ✅ Switch-grid + `EPStatusPill`; ⚠️ EPPageHeader YO'Q (bespoke sticky header `:96-111`); saqlash o'ngda (Q-41 mos) | ✅ **Per-tur × per-kanal granular matritsa REAL** (`notification_type_preferences`, d39c33e5) — round-trip DB-proof kod darajasida (jonli 0 qator). ⚠️ Per-USER pref sahifasi ADMIN-gated (nomувofiqlik: har user o'z sozlamasini ko'ra olmaydi) |
| **`kanban/NotificationsPanel` (205q, popover)** | ✅ embedded `BoardHeader.tsx:301`; `/kanban` gate | REAL — `GET /api/kanban/notifications` (`:35`), `PUT .../:id/read` (`:41`), `.../read-all` (`:51`) — `kanban-boards.controller.ts:180,204,196` | Yo'q | Yo'q (asosiy yo'l real; BE'da soft-fallback bor — Kanban auditida qayd) | class-level | ✅ `EPStatusPill`; token-ranglar | Kanban'ning o'z `kanban_notifications` jadvali (jonli 0) — `notifications` dan ALOHIDA |
| **`director/AlertFeed` (108q)** | ✅ embedded `DirectorDashboard.tsx:156`; `/` DIRECTOR_ROLES | REAL — `GET /api/agents/alerts` (`useAgentAlerts.ts:29`, 30s), `POST /api/agents/alerts/:id/read` (`:37`) — `agents.controller.ts:195,201` | Yo'q | 🟠 **GREEN-LIE** — alert-amal tugmalari (`:94-99`) `onClick={() => { /* future: dispatch act.action */ onResolve(); }}` — nomlangan amal HECH QACHON dispatch qilinmaydi, faqat "o'qildi" | route DIRECTOR_ROLES | token-ranglar + Tailwind-palette bg; `:47` hardcode "yangi" (i18n yo'q) | Alert = AI-agent (`agent_alerts`), notifications jadval EMAS |
| **`director/AlertsCard` (54q)** | ✅ embedded `DirectorDashboard.tsx:199` | Propsdan (parent `GET /api/director/alerts`) | — | — | display-only | token+palette | Faqat ko'rinish |
| **`WMSDashboardAlerts` (148q)** | ✅ embedded `WMSDashboard.tsx:152`; WAREHOUSE_ROLES | Propsdan (parent egasi) | — | — | display-only | token+palette; `:108,130` hardcode string; `:134` inline `style` progress (dinamik, maqbul) | ⚠️ **Dublikat** `AlertsCard` `WMSDashboardSections.tsx:202` da (orphan bo'lishi mumkin) |
| **`HRAlertBanner` (160q)** | ✅ embedded `RecruitingKanban.tsx:253`; ALL_AUTHENTICATED | REAL(read) — `GET /api/hr/recruitment/checklist-alerts` (`:49`) — `hr-vacancies-analytics.controller.ts:39` | Yo'q (dismiss=lokal state, maqbul) | Yo'q | route-gate | raw `<button>`; token+palette; `:29-34,112,145` hardcode string | `tel:` link (`:150`) |
| **`camera-alerts` (117q)** | ✅ `CameraRoutes.tsx:36` `/camera-alerts`; CAMERA_ROLES; sidebar `:514` | REAL — `GET /api/camera-alerts` (`:29`), `POST .../:id/acknowledge` (`:34`), `.../resolve` (`:47`) — `iot/.../camera-alerts.controller.ts:48,59,69` | Yo'q | Yo'q | CAMERA_ROLES | `EPErrorState`/`EPStatusPill`; parallel `buildTranslations` (i18n `t()` emas) | `camera_alerts` jadval (jonli 0) |
| **`pos-monitor/PosNotificationsDrawer` (116q)** | ✅ embedded `PosLayout.tsx:135`; POS-monitor SPA (o'z auth) | REAL — `GET/POST /api/pos/notifications*` (pos-monitor.api.ts:150-152) — mavjud | Yo'q | Yo'q | POS-monitor auth | 🔴 **Xom rgba inline** (`:89-90,107` `rgba(0,212,255,0.05)` va h.k.); `--pos-*` tizim (EP emas) | EP dizayn-tizimidan tashqari (o'z-o'zicha) |
| **`IotOeeAlertsTab` (163q)** | ✅ embedded `IoTDashboard.tsx:265` (tab); IOT_ROLES | Propsdan (parent) | — | — | display-only | 🔴 **Xom hex** recharts (`#22c55e/#3b82f6/#f59e0b` `:62-64,87-89`) — chart-istisno, lekin token emas | Sidebar `iot/alerts` (`:574`) BOSHQA komponentga (`IoTExtended`) boradi |

### 2.1 Green-lie / green-fallback tekshiruvi (BE) — sub-agent tasdig'i

| Amal | Verdikt | Dalil |
|---|---|---|
| `NotificationsController` CRUD (list/my/unread-count/mark-read/mark-all/preferences/create) | **REAL** | `notifications.controller.ts` — `assertOk` throw qiladi; pref-matritsa real upsert+round-trip |
| `NotificationRoutingController` CRUD | **REAL** | `notification-routing.controller.ts` + `notification-routing.repository.ts` real runQuery |
| `NotificationSchedulesController` CRUD | **REAL** | `notification-schedules.repository.ts:80-129` real INSERT/UPDATE/DELETE |
| `notification-schedule.cron.runDue` (soatlik) | **REAL INSERT** (rol-fan-out `INSERT...SELECT`) | `notification-schedule.cron.ts:38-94` |
| `company_digest` jadval agregati | ⛔ **PLACEHOLDER** — hech qanday agregat/KPI qurmaydi; jadval-qatordagi STATIK `title/body`ni ko'chiradi | grep `company_digest` module-18'da 0 hit; `fire()` `:68-94` |
| create→telegram yetkazish | 🟠 **BUG** — `sendMessage(userId, ...)` → userId=chat_id (chat_id hal qilinmaydi) | `create-notification.handler.ts:57-60` |
| `telegram-bot.adapter` 5 tipli metod | ⛔ **O'LIK STUB** — xabar quradi, yubormaydi, chaqiruvchi yo'q | `telegram-bot.adapter.ts:198-247` |
| `TelegramSvc` (butun klass) | ⛔ **O'LIK** — eksport, lekin tashqi chaqiruvchi yo'q | `telegram/telegram.service.ts` (§3.5) |
| `orphan-events.listener` 10/11 handler | ⛔ **LOG-ONLY / TODO** — faqat 1 handler (`notifications.create`) yozadi | `orphan-events.listener.ts:64-166` |

> **Muhim:** Module-18 CONTROLLER kodida soxta-CRUD/echo YO'Q — pref-matritsa, routing, schedule hammasi real DB. Green-lie'lar chekkalarga to'plangan: FE `AlertFeed` amal-tugmasi, create→telegram bug, o'lik adapter-metodlar, `company_digest` placeholder, orphan-listener log-only handlerlar.

---

## 3. CROSS-MODULE INTEGRATSIYA JADVALI (yadro bo'lim)

Bu modul HAR modul-triggeridan bildirishnoma OLADI. Uch mexanizm bor: (1) CQRS `@EventsHandler(EventClass)` listener → `NOTIFICATION_REPO.save()`; (2) EventEmitter2 `@OnEvent(string)` → save yoki log-only; (3) boshqa modul TO'G'RIDAN `INSERT INTO notifications` yoki `CreateNotificationCommand`.

### 3.1 INBOUND — kim bildirishnoma tug'diradi va qanday

| Ishlab-chiqaruvchi modul + hodisa | Bor/Yo'q | Mexanizm + adresat-hal | Dalil (file:line) |
|---|---|---|---|
| **SD** — buyurtma YARATISH (`OrderCreatedEvent`) | ✅ **BOR** | CQRS listener; **QATTIQ** `role='warehouse_manager' LIMIT 50` | `order-created-notification.listener.ts:21,34`; emitter `create-order.handler.ts:154`, `sd-quotations.repository.ts:379` |
| **SD** — buyurtma STATUS o'zgarishi | 🔴 **YO'Q** (bildirishnoma) | status-change eventini notifications tinglamaydi | grep — faqat OrderCreated |
| **QC** — brak/rad (`QcFailedEvent`) | ✅ **BOR** | CQRS listener; **ROUTING-JADVAL** `resolveUserIds('qc.failed','production_manager')` | `qc-failed-notification.listener.ts:31,44`; emitter `submit-inspection.handler.ts:138`. ⚠️ `report-defect.handler` POJO chiqaradi (klass emas) → bu CQRS handlerga TEGMAYDI |
| **QC** — "mijoz aybi" defekt → savdo-menejerga avto-marshrut | 🔴 **YO'Q** | notifications'da mijoz-aybi flag→SD-manager wiring yo'q | grep `mijoz\|customer.*defect.*sales` in notifications → 0 |
| **MRO** — mashina to'xtash (`MroMaintenanceStopEvent`) | ✅ **BOR** | CQRS listener; **ROUTING-JADVAL** `resolveUserIds('mro.machine_stopped','director')` | `mro-machine-stopped-notification.listener.ts:22,40`; emitter `stop-machine.handler.ts:23` |
| **MES** — SOS eskalatsiya / brak-limit | ✅ **BOR (to'g'ridan INSERT)** | listener EMAS — modul o'zi `INSERT INTO notifications` | `mes-sos-escalation.repo.ts:169`, `mes-brak-limit.repo.ts:174` |
| **MES** — smena-handover / stop | 🔴 **YO'Q (bildirishnoma)** | smena-topshiriq notifications'ga event chiqarmaydi | grep — 0 |
| **WMS** — past qoldiq / lot muddati | ✅ **BOR (to'g'ridan INSERT + routing)** | `stock-alert.cron.ts:68` (`resolveUserIds('wms.lot_expiring')` `:56`); pos-yon `pos-low-stock.job.ts:50` (`wms.low_stock`); + escalation/gtd/daily/count-accuracy crons | §3.4 |
| **HR** — ta'til tasdig'i (`LeaveApprovedEvent`) | ✅ **BOR** | EventEmitter2 listener; TO'G'RIDAN `event.props.userId` | `leave-approved-notification.listener.ts:40`; emitter `approve-leave.handler.ts:79` |
| **HR** — davomatsizlik (`employee.absence.day1/day2/blocked`) | 🟠 **QISMAN** | orphan listener'da — LOG-ONLY (persist YO'Q) | `orphan-events.listener.ts:145-166`; emitter `cron/absence-block.cron.ts:73,106,170` |
| **HR** — onboarding | 🔴 **YO'Q** | onboarding→notification yo'li topilmadi | grep — 0 |
| **PP** — reja kechikish/o'zgarish | 🔴 **YO'Q** | PP `MroMaintenanceStopEvent` tinglaydi lekin bildirishnoma chiqarmaydi | `pp/.../mro-stop.listener.ts:15`; INSERT yo'q |
| **CC/Koordinatsiya** — tasdiq/SLA eskalatsiya | ✅ **BOR (to'g'ridan INSERT)** | director-crons | `zno-zvs-sla-escalation.cron.ts:179`, `rasporyazhenie-escalation.cron.ts:77` |
| **Kanban** — overdue eskalatsiya | ✅ **BOR (to'g'ridan INSERT)** | `kanban-overdue-escalation.cron.ts:90`; `drizzle-kanban-engagement-base.repo.ts:56` | — |
| **Kanban** — `kanban.task.created/moved/assigned/deleted` | 🔴 **O'LIK** | orphan listener kutadi, LEKIN kanban 0 event chiqaradi | `orphan-events.listener.ts:84-116`; grep `.emit(` in kanban → 0 |
| **IoT** — uskuna nosozlik/anomaliya | 🔴 **YO'Q (in-app)** | IoT-fault→notification yo'li yo'q; `iot.attendance.block` handler = TODO stub | `orphan-events.listener.ts:127-132` |
| **Finance / MM** — Z-hisobot / kassa-limit / sverka-digest | ✅ **BOR (BLESSED CQRS)** | `CreateNotificationCommand` (yagona to'g'ri yo'l) | `cashier-daily-zreport.cron.ts:113`, `cashier-cash-limit-alert.cron.ts:100`, `fp-cycle-cron.service.ts:44`, `mm-reconciliation-digest.cron.ts:69` |
| **CRM/Marketing** — bitim yutuq (`DealWonEvent`) | ✅ **BOR** | CQRS listener; **QATTIQ** `role='director' LIMIT 50` | `deal-won-notification.listener.ts:19,32`; emitter `mark-deal-won.handler.ts:87` |
| **LMS** — sertifikat muddati (`CertificateExpiredEvent`) | ✅ **BOR** | CQRS listener (yarim-tunlik cron); operator + `hr_manager` fan-out | `lms-cert-expired-notification.listener.ts:27,58`; emitter `cert-expiry.handler.ts:68` |

### 3.2 O'LIK / emittersiz listener (Q-46)

| Listener topik | Emitter | Verdikt |
|---|---|---|
| `@OnEvent('notifications.create')` (`orphan-events.listener.ts:64`) | grep `.emit('notifications.create')` → **0** | 🔴 O'lik (yagona persist qiluvchi handler, lekin hech kim chiqarmaydi) |
| `@OnEvent('kanban.task.created/moved/assigned/deleted')` (`:84-116`) | kanban 0 `.emit(` | 🔴 O'lik (bundan tashqari log-only) |
| `erp-events.listener.ts` | `export {}` — provider EMAS | ⚠️ O'lik breadcrumb (Wave-4 deprekatsiya izohi) |
| `access.chip.revoke`/`iot.attendance.block`/`email.account.disable` (`:118-143`) | `absence-block.cron.ts:171-173` emit qiladi | 🟠 Emitter bor, LEKIN handler = TODO stub (hardware integratsiya yo'q) |

### 3.3 Taksonomiya / seed holati (jonli)

| Taksonomiya | Holat | Dalil |
|---|---|---|
| **6 rasmiy xabar-toifasi** (`notification_category`) | ✅ **SEED** — buyruq · ogohlantirish · talab · tasdiqlash_sorovi · hisobot · elon | `taxonomy_entries` (6 qator). ⚠️ `name_ru` = NULL (i18n chala) |
| **5 aloqa-turi** (`contact_type`) | ✅ SEED — buyruq/malumot_talabi/bildirishnoma/sorov/hisobot | 5 qator (CC modulida ham ishlatiladi) |
| **6 hujjat-turi** (`document_type`) | ✅ SEED | 6 qator |
| ⚠️ Toifa ↔ notifications engine ulanishi | 🔴 **ULANMAGAN** | `notifications` jadvalda `category_id`/`notification_category` FK yo'q; FE `TYPE_CONFIG` faqat WMS/POS kodlar — 6 rasmiy toifa hech qayerda ishlatilmaydi |
| **4 routing-qoida** (`notification_routing_rules`) | ✅ SEED (§1.3); admin-CRUD | `notification-routing.controller.ts` |
| **1 jadval** (`notification_schedules`) | ✅ SEED (company_digest); admin-CRUD | `notification-schedules.controller.ts` |

### 3.4 To'g'ridan `INSERT INTO notifications` yozuvchilar (modul-chegara buzilishi)

**BLESSED yo'l (`CreateNotificationCommand` → aggregate + Telegram/Email/SMS fan-out):** faqat Finance ×3 + MM ×1.
**Chegarani buzuvchi to'g'ridan-INSERT (~15):** `cron/employee-daily-invoice.cron.ts:207`, `cron/stock-alert.cron.ts:68`, `agents/.../agent-alert-notification.listener.ts:45`, `mes-sos-escalation.repo.ts:169`, `mes-brak-limit.repo.ts:174`, `wms/.../internal-request-escalation.repository.ts:84`, `wms/.../gtd-flag.repository.ts:87`, `wms/.../daily-warehouse-report.cron.ts:97`, `wms/.../count-accuracy-alert.cron.ts:94`, `director/.../zno-zvs-sla-escalation.cron.ts:179`, `director/.../rasporyazhenie-escalation.cron.ts:77`, `pos/.../procurement-request.service.ts:379`, `lms/.../drizzle-lms.repo.ts:680`, `lms/.../drizzle-lms-exams.repo.ts:395`, `kanban/.../kanban-overdue-escalation.cron.ts:90`. ⚠️ Bular aggregate/immutability/kanal-fan-out'ni chetlab o'tadi — Item 2 (yagona kanal) uchun to'siq.

### 3.5 Telegram tayyorligi (prior-claim verify) — MUHIM

Ikki parallel Telegram implementatsiyasi + uchinchi (alohida modul):

| Sirt | Holat | Dalil |
|---|---|---|
| **A) `TelegramSvc`** (`telegram/telegram.service.ts`) — DB-birinchi dispatcher, `chat_id`ni to'g'ri hal qiladi | ⛔ **BUTUNLAY O'LIK** — eksport (`module:90`), lekin controller/modul inject qilmaydi (grep `TelegramSvc` → faqat modul+o'zi). `sendMessage/sendNotification/sendBulk` tashqarida chaqirilmaydi | token `configService.get(...)` soft (`:49`); polling YO'Q; inbound YO'Q |
| **B) `TelegramBotAdapter`** (`TELEGRAM_SENDER` port) — outbound-only, `withRetry` | 🟠 **YAGONA ULANGAN** — `create-notification.handler.ts:57-60` chaqiradi. LEKIN `sendMessage(command.userId, ...)` → **userId'ni chat_id sifatida yuboradi** (telegram_chat_id hal QILINMAYDI) → yetkazish bug'i | token `cfg.get(...) ?? ''` (`:38`); bo'sh→no-op `Ok` (`:42-46`) |
| **B) o'lik metodlar** | ⛔ `sendOrderStatusUpdate/sendAdvanceReminder/sendCertExpiry/sendStockAlert/sendQcResult` xabar quradi, YUBORMAYDI, chaqiruvchi yo'q | `telegram-bot.adapter.ts:198-247` |
| **C) `bot-gateway`** (ALOHIDA modul) — INBOUND webhook | ✅ **MEXANIZM bor** — `POST /bot/:bot/webhook` (`bot-gateway.controller.ts:69`), `TelegramAuthGuard`, 9 bot (crm/mes/hr/logistics/fin/qc/director/ombor/pos), inline-keyboard uzatish (`:140`), RBAC-rad, ulanmagan-user javobi | ⚠️ Vizyon Item 1 "bitta dispatcher-bot" — bu 9 bot (Qisman); token bitta `TELEGRAM_BOT_TOKEN` (`env.schema.ts:26`) |

**Xulosa:** Module-18 Telegram = faqat outbound, va u ham `chat_id` hal qilmaydigan bug bilan. Haqiqiy inbound/ACK/inline-tugma halqasi `bot-gateway`da (alohida modul, notifications bilan ULANMAGAN). Egasi token bersa — inbound bot-gateway ishga tushishi mumkin, LEKIN "ko'rildi=ACK", eskalatsiya, digest-yuborish, chat_id-bog'lash zanjiri module-18'da qurilmagan.

### 3.6 Org-reset ta'siri (aniq baho)

| Bog'liqlik | Reset ta'siri |
|---|---|
| **Marshrut-resolver** (`notification-routing.repository.ts:147-149`) | 🔴 **Ta'sirlanadi (kritik)** — `SELECT id FROM users WHERE role IN (...)`; `users`=1 (super_admin) → 4 routing-qoida + qattiq fallback = **0 qabul-qiluvchi**. ✅ LEKIN org-ierarxiya (`head_user_id`/`manager_id`) ISHLATMAYDI — bu sof RBAC rol-so'rov (`count-accuracy-alert.cron.ts:13` izohi tasdiqlaydi). Reset-dan keyin `users` seed yetarli (org-daraxt shart emas) |
| **Jadval-cron rol-fan-out** (`notification-schedule.cron.ts:85-90`) | 🔴 Bir xil — `role=$role` fan-out 0 qator; `target_user_id` jadvallari ishlaydi |
| **Qattiq-rol listenerlar** (deal-won→director, order-created→warehouse_manager, lms→hr_manager) | 🔴 0 qabul-qiluvchi (routing-jadvalni ham ishlatmaydi — qotirilgan) |
| **create→telegram** | 🔴 Ikki tomonlama muammo: userId=chatId bug + user'lar 0 |
| **BE RBAC (`@Roles`)** | 🔴 Amalda faqat super_admin — jonli `users`=1 |
| **Prefs-matritsa / schedule/routing CRUD** | ✅ **Ta'sirlanmaydi** — per-user/config, org-mustaqil |
| **Vizyon eskalatsiya-zanjiri (Item 3/12: i.o.→manager_id→L0)** | 🔴 Qurilmagan; mavjud manager_id-zanjir resolver CC-modulida (`cc-org-resolver.service.ts:127-164`), notifications'da EMAS — reset undan mustaqil, chunki umuman ulanmagan |

---

## 4. VIZYON SOLISHTIRISH

### 4.1 Master-reja `[Module-18]` tally (shu tahlirda `sed`+`grep`+`uniq`)

| Holat | Soni | % |
|---|---|---|
| **Ha (to'liq)** | **3** | ~2.3% |
| **Qisman** | **31** | ~23% |
| **STALE-DOC** | **5** | ~4% |
| **Yo'q (qurilmagan)** | **93** | ~70% |
| **JAMI** | **132** | 100% |

> Manba: `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md:23394-24902` "Current status:" markerlari. ⚠️ Master-reja evidensiyasidagi qator-sanog'i (7030/6483) reset tufayli eskirgan (§1.3).

### 4.2 Yadro vizyon-nuqtalari bo'yicha holat (fully / partial / missing)

| Vizyon bloki | Holat | Dalil |
|---|---|---|
| Markaziy egasi-sozlanadigan `notification_schedules` cron (Item 9) | **Fully (kod)** / **bo'sh (data)** | `notification-schedule.cron.ts` REAL; jonli 1 jadval, `notifications`=0 |
| Hodisa→rol markaziy marshrut-jadvali (Item 32/EP-NTF-079) | **Fully (kod)** / **1-user (data)** | `notification-routing.repository.ts` REAL CRUD+resolve; 4 qoida seed; users=1 → 0 adresat |
| Per-tur × per-kanal pref-matritsa (Item 8 batch) | **Fully (kod)** | `notification-preferences.service.ts:88-138` REAL round-trip; `notification_type_preferences` (d39c33e5) |
| A2 (reader `body` o'qiydi) / A3 (markAllRead `is_read`) | **Fully** | `drizzle-notification.repo.ts:104-105,165-168,145` — shipped `9400075d` |
| Bir profilga birlashtirilgan oqim + digest_window debounce (Item 8) | **Missing** | debounce/batching kodi yo'q; grep `digest_window` → 0 |
| Yagona `ntf_notifications` (module_code/channel/status/immutable) (Item 2) | **Missing** | jadval yo'q; kanonik `notifications` 24 eskirgan ustun (§1.4) |
| DB immutability (DELETE-trigger + immutable flag) (Item 10) | **Missing** | trigger yo'q; `updated_at` MAVJUD (immutable bilan zid) |
| "Ko'rildi"=inline ACK + 2× qayta-yuborish→eskalatsiya (Item 5/13) | **Missing** | inbound ACK yo'q (§3.5); retry-count/resend-timer yo'q |
| Bo'sh kartaga→i.o.→manager_id zanjiri→unroutable navbat (Item 3/12) | **Missing (notifications)** | manager_id-resolver CC'da bor (`cc-org-resolver.service.ts:127-164`), notifications'ga ULANMAGAN; unroutable-navbat yo'q |
| Quiet-hours + `priority='CRITICAL'` bypass (Item 4) | **Missing** | grep `quiet_hours` → 0 fayl; priority ustun bor lekin gating yo'q |
| Deep-link/OTP `t.me/bot?start=TOKEN` 24h + telegram_id UNIQUE (Item 7) | **Missing** | OTP/deep-link ulash mexanizmi yo'q |
| Har status uchun alohida SLA (`kanban_column_sla`) (Item 19) | **Missing (SCHEMA-GAP)** | `kanban_column_sla` jadval MAVJUD EMAS (§1.3) |
| Per-modul alert-chegara (`alert_thresholds`) | **Missing (SCHEMA-GAP)** | `alert_thresholds` jadval MAVJUD EMAS |
| Telegram bitta dispatcher-bot + webhook (Item 1) | **Partial** | `bot-gateway` 9 bot + 1 webhook + 1 token (§3.5) — bitta emas, 9 |
| Telegram emoji (Item 27) | **Partial** | adapter `sendAlert` emoji ishlatadi (`telegram-bot.adapter.ts:181-185`) |
| Xabar turini yuboruvchi qo'lda tanlaydi (Item 18) | **Missing** | 6 toifa seed, lekin FE tanlov/UI ulanmagan |
| Digest = real agregat (KPI/leaderboard top-3/past-3) (Item 26/30/34) | **Missing** | `company_digest` = statik matn (§2.1); ranking-KPI aniqlanmagan (egasi-ochiq) |
| Immutable audit-log (Item 13/45 yuridik kuch) | **Missing** | `notification_logs`=0, DELETE-trigger yo'q |
| Outbox (`ntf_outbox`) + offline saqlash (Item 23) | **Missing** | `ntf_outbox` jadval yo'q |
| Bot health monitoring (`ntf_bot_health`, Item 50) | **Missing** | jadval yo'q; `/api/ntf/health` yo'q |
| 6 rasmiy toifa taksonomiya seed | **Partial** | seed bor (`notification_category`), engine'ga ulanmagan (§3.3) |
| SMS/Email kanal adapter | **Partial** | Eskiz-SMS + SMTP-email adapter bor (`create-notification.handler.ts:68-86`); lekin email/sms faqat `recipientEmail/Phone` berilsa — resolver yo'q |

---

## 5. ORPHAN / O'LIK KOD (Q-46 look-before-delete)

| Element | Qator | Import/registratsiya tekshiruvi | Verdikt |
|---|---|---|---|
| `alerts/alerts.service.ts` + `alerts/alerts.repository.ts` | 65 + 62 | grep `notifications/alerts` → 0 tashqi import; modul-provider EMAS | 🔴 **ORPHAN** — controller yo'q, hech kim inject qilmaydi; o'lik CRUD |
| `domain/services/telegram.service.ts` | 11 | grep → 0 import (adapterga "Moved from") | 🔴 ORPHAN stub-qoldiq |
| `domain/services/sms.service.ts` | 9 | grep → 0 import | 🔴 ORPHAN stub-qoldiq |
| `domain/services/email-notification.service.ts` | 8 | grep → 0 import | 🔴 ORPHAN stub-qoldiq |
| `TelegramSvc` (`telegram/telegram.service.ts`) | 203 | eksport, lekin tashqi inject 0 | 🔴 **O'lik klass** — DrizzleTelegramSvcRepo + i-repo bilan birga (chat_id hal qiladigan yagona real kod, lekin ulanmagan) |
| `telegram-bot.adapter.ts` 5 tipli metod | :198-247 | grep chaqiruvchi → 0 (faqat port interface) | 🔴 O'lik stub-metodlar |
| `erp-events.listener.ts` | `export {}` | provider EMAS | ⚠️ O'lik breadcrumb |
| `orphan-events.listener` `notifications.create`+`kanban.task.*` | :64-116 | emitter 0 | 🔴 O'lik handler (emittersiz) |
| `NotificationSchemaService` | 17 | modulda ro'yxatda (`:80`), lekin `onModuleInit` faqat `ensurePreferencesTables()` chaqiradi; boshqa joyda inject 0 | ⚠️ Registered-but-narrow (init-only) — o'lik emas, lekin faqat DDL-ensure |
| `WMSDashboardSections.tsx:202` `AlertsCard` | — | `WMSDashboard` `WMSDashboardAlerts`dan import qiladi | ⚠️ Ehtimoliy dublikat (FE) |

> **FE→BE drift:** Module-18'da 404-drift **topilmadi** — barcha FE-endpoint (pos/notifications, notifications/preferences, kanban/notifications, agents/alerts, camera-alerts, hr/recruitment/checklist-alerts, director/alerts) BE'da mavjud va REAL. Yagona "buzuq ulanish" — `AlertFeed.tsx:96` amal-dispatch qilinmaydi (green-lie, drift emas).

---

## 6. SEVERITY XULOSA (P0 / P1 / P2)

### 🔴 P0 — bloklovchi / vizyon-yadro / qarorga-zid
1. **Jonli baza bo'sh + qabul-qiluvchi 0 user'ga tushadi** — `notifications`=0, `users`=1; routing/fallback/schedule-fan-out hammasi `users.role` → 0 adresat (§3.6). Hech narsa jonli isbotlanmagan; org+users seed shart.
2. **Yagona `ntf_notifications` + immutability qurilmagan (Item 2/10)** — kanonik `notifications` 24 eskirgan ustun, `module_code`/`channel`/`status`/`immutable` yo'q; DELETE-trigger yo'q; feed POS/CC/Kanban VIEW + ~15 to'g'ridan-INSERT bilan parchalangan (§1.4, §3.4).
3. **Telegram inbound/ACK yo'q + create→telegram bug** — module-18 outbound-only; `sendMessage(userId,...)` chat_id'ni hal qilmaydi (§3.5); "ko'rildi=ACK"→eskalatsiya (Item 5/13) qurilmagan.
4. **Schema-gap: `alert_thresholds` + `kanban_column_sla` MAVJUD EMAS** — vizyon per-status SLA (Item 19) va per-modul chegara CRUD talab qiladi; "CRUD-default tasdiqlandi" da'vosi noto'g'ri (§1.3).
5. **Digest = statik matn, real agregat yo'q (Item 26/34)** — `company_digest` KPI/leaderboard qurmaydi; ranking-KPI (top-3/past-3) aniqlanmagan (§2.1).

### 🟠 P1 — funksional nuqson
6. **`AlertFeed.tsx:96` green-lie** — amal-tugmasi nomlangan amalni dispatch qilmaydi, faqat o'qildi.
7. **6 rasmiy toifa seed lekin engine'ga ULANMAGAN** — `notifications`da `category` FK yo'q; FE `TYPE_CONFIG` faqat WMS/POS (§3.3).
8. **~15 modul `CreateNotificationCommand`ni chetlab to'g'ridan-INSERT** — aggregate/kanal-fan-out/immutability chetlanadi (§3.4).
9. **O'lik listenerlar** — `notifications.create` + 4×`kanban.task.*` emittersiz; `access/iot/email` handlerlar TODO stub (§3.2).
10. **HR absence handler LOG-ONLY** (`orphan-events.listener.ts:145-166`) — event keladi, persist qilmaydi.
11. **QC "mijoz aybi"→savdo-manager avto-marshrut yo'q**; MES-smena / PP-reja / IoT-fault / onboarding → notification YO'Q (§3.1).
12. **Feed-drift + RBAC** — "Markaziy bildirishnoma" POS-VIEW'dan + `pos.movements.read` gate; per-user pref-sahifasi ADMIN-gated (§2).

### 🟡 P2 — sifat / dizayn / muhit
13. **EPPageHeader yo'q** (barcha 3 asosiy sahifa + alert-sirtlar bespoke header).
14. **Xom rang** — `PosNotificationsDrawer.tsx:89-90` rgba, `IotOeeAlertsTab.tsx:62-64` hex (chart), Qoida 21.
15. **Raw `<select>`** `NotificationCenter.tsx:146` (EP Select emas).
16. **ORPHAN fayllar** — `alerts/*` (65+62q), `domain/services/{telegram,sms,email}` (11+9+8q), `TelegramSvc`, 5 adapter-metod, `erp-events` breadcrumb (§5).
17. **`name_ru` NULL** — `notification_category` (i18n chala); FE `AlertFeed/HRAlertBanner/WMSDashboardAlerts` hardcode string; `camera-alerts` parallel `buildTranslations`.
18. **Token soft-load** — `TELEGRAM_BOT_TOKEN` `get(...)`/`?? ''` (getOrThrow emas, Qoida 7 yumshoq) — ataylab graceful, lekin token yo'q → jimgina o'chadi.
19. **Ikkilangan ustunlar** `notifications` — `is_read`╳`read`, `body`╳`message`, `title`╳`title_uz` (legacy-drift).
20. **WMS `AlertsCard` dublikat** (`WMSDashboardSections.tsx:202`).

---

## 7. TAVSIYALAR (bog'liqlik tartibida, 34 ta)

> Belgi: **FIX** = toza kod (egasi-ruxsatisiz mumkin, Q-34) · **DECISION/DATA/SCHEMA** = egasi-darvozasi. 🔒 = Org/users-reset ga bog'liq.

**A bosqichi — jonli-sinov poydevori**
1. **🔒 DATA** — `users` seed (rol bo'yicha: warehouse_keeper/production_manager/director/hr_manager/warehouse_manager); aks holda BUTUN routing/fallback/schedule adresat-hal 0 qator (`notification-routing.repository.ts:147`). **Users-reset blokli.**
2. **FIX** — bo'sh oqimni jonli smoke-test: 1 `CreateNotificationCommand` → `notifications` INSERT → FE feed'da ko'rinish DB-proof (hozir 0 qator, sinovsiz).
3. **DATA** — `notification_routing_rules`ni `target_user_id` bilan to'ldirish (users seed bo'lguncha rol-hal 0) yoki users seed'ni kuting.

**B bosqichi — yagona kanal + immutability (vizyon-yadro, SCHEMA-og'ir)**
4. **🔒 SCHEMA/DECISION** — `notifications`ga `module_code`/`channel`/`status`/`payload_json`/`immutable` ustun (yoki `ntf_notifications`ga migratsiya, Item 2). Egasi Q-35 tasdig'i. Barcha ~15 to'g'ridan-INSERT yozuvchi + listener yangilanadi.
5. **SCHEMA** — DELETE-immutability trigger (`RAISE EXCEPTION`) + `updated_at` olib tashlash yoki soft-cancel pattern (Item 10/45); `notification_logs`ni immutable audit-log qilish.
6. **FIX** — ~15 to'g'ridan-`INSERT INTO notifications`ni `CreateNotificationCommand`ga o'tkazish (§3.4) — kanal-fan-out + immutability markazlashadi.

**C bosqichi — Telegram inbound/ACK halqasi (DATA + FIX)**
7. **DATA** — `TELEGRAM_BOT_TOKEN` (+ per-bot secret) — CAPEX/BotFather. **Egasi-DATA.**
8. **FIX (kritik)** — create→telegram bug: `create-notification.handler.ts:60` `sendMessage(userId,...)`ni `telegram_chat_id` hal qilishga o'zgartirish (o'lik `TelegramSvc.getUserChatId` mantiqini qayta ishlatish yoki adapterni chat_id-resolver bilan bog'lash).
9. **FIX** — `bot-gateway` (9 bot, inbound) ↔ notifications'ni bog'lash: inline "✅ Ko'rdim" ACK → `notifications.read_at` (Item 5/13); ACK-log immutable.
10. **SCHEMA/FIX** — ACK-timeout retry (2×) → eskalatsiya (Item 5); `ntf_outbox` offline-saqlash (Item 23) — BullMQ/Redis infra-qaror.
11. **FIX** — o'lik `TelegramSvc` klassini yo ulash (blessed dispatcher qilib), yo o'chirish; adapterning 5 o'lik metodini (`:198-247`) olib tashlash.

**D bosqichi — schema-gap yopish (egasi-DATA + SCHEMA)**
12. **🔒 SCHEMA/DATA** — `kanban_column_sla` jadval (per-status SLA, Item 19) — hozir MAVJUD EMAS; egasi har status uchun daqiqa qiymatini bersin.
13. **SCHEMA/DATA** — `alert_thresholds` (per-modul chegara CRUD) — hozir MAVJUD EMAS.
14. **DECISION** — digest ranking-KPI (top-3/past-3, Item 26/30/34): qaysi metrika? Hozir aniqlanmagan — **egasi-DATA (fabrikatsiya QILINMAYDI)**.

**E bosqichi — eskalatsiya-zanjiri (org-bog'liq)**
15. **🔒 FIX/SCHEMA** — bo'sh-karta→i.o.→manager_id zanjiri→unroutable-navbat (Item 3/12): CC'dagi `cc-org-resolver.service.ts:127-164` manager_id-walk'ni notifications'ga qayta ishlatish + `unroutable` navbat + NTF-health. **Org-seed blokli.**
16. **DECISION** — quiet-hours oynasi (Item 4, masalan 22:00-07:00) + `priority='CRITICAL'` bypass — egasi vaqt-oynasini bersin, keyin FIX telegram-yo'liga gate qo'shadi.

**F bosqichi — cross-module event to'ldirish**
17. **FIX** — SD buyurtma-STATUS o'zgarishi → notification (hozir faqat OrderCreated).
18. **FIX** — QC "mijoz aybi" defekt → savdo-menejerga avto-marshrut (hozir yo'q).
19. **FIX** — MES smena-handover, PP reja-o'zgarish, IoT uskuna-fault, HR onboarding → notification event + listener.
20. **FIX** — o'lik listenerlarni hal qilish: `notifications.create`/`kanban.task.*` emitterini qo'shish yoki listenerni olib tashlash (`orphan-events.listener.ts:64-116`); `access/iot/email` TODO stublarni hardware-integratsiya bilan yoki olib tashlash.
21. **FIX** — HR absence handler LOG-ONLY → real persist (`orphan-events.listener.ts:145-166`).

**G bosqichi — taksonomiya / toifa**
22. **FIX/SCHEMA** — 6 rasmiy toifa (`notification_category`)ni `notifications.category_id` FK bilan engine'ga ulash + FE tur-tanlov UI (Item 18); `TYPE_CONFIG`ni WMS/POS-dan kengaytirish.
23. **DATA** — `notification_category.name_ru` (+ boshqa NULL) to'ldirish (i18n).

**H bosqichi — o'lik/orphan tozalash (Q-46 toza FIX)**
24. **FIX** — `alerts/alerts.service.ts`+`repo` orphanni olib tashlash (0 chaqiruvchi, §5).
25. **FIX** — `domain/services/{telegram,sms,email-notification}.service.ts` stub-qoldiqlarni olib tashlash (adapterga ko'chgan).
26. **FIX** — `erp-events.listener.ts` `export {}` breadcrumb'ni olib tashlash.
27. **FIX** — WMS `AlertsCard` dublikat (`WMSDashboardSections.tsx:202`) tekshirib olib tashlash.

**I bosqichi — feed birlashtirish / RBAC**
28. **DECISION/FIX** — yagona feed: `NotificationCenter`ni `/api/pos/notifications` (POS-VIEW+`pos.movements.read`) o'rniga `/api/notifications`ga o'tkazish; POS/CC VIEW'lar o'rnini aniqlashtirish.
29. **FIX** — per-user pref-sahifasi (`/settings/notifications`) ADMIN-gate'ni har-user-o'zi ko'radigan qilish (RBAC nomувofiqligi).

**J bosqichi — company_digest / cron**
30. **FIX/SCHEMA** — `company_digest`ga real agregat-builder (kechki 23:00 GROUP BY, N+1 yo'q, Item 34); hozir statik matn (`notification-schedule.cron.ts:68-94`).
31. **DECISION** — cron BullMQ/Redis (persistent, Item 4/23/38 debounce) ga o'tsinmi — infra-qaror.

**K bosqichi — dizayn / kod-sifat (P2)**
32. **FIX** — `NotificationCenter`/`NotificationSettings`ga `EPPageHeader` + `NotificationCenter.tsx:146` raw `<select>`→EP Select.
33. **FIX** — xom rang: `PosNotificationsDrawer.tsx:89-90` rgba, `IotOeeAlertsTab.tsx:62-64` hex→token (Qoida 21); FE hardcode stringlarni i18n.
34. **FIX** — token `getOrThrow` yoki startup-validatsiya bilan aniq-fail (Qoida 7); `notifications` ikkilangan ustunlarni (`is_read`╳`read`) kanonlashtirilsin.

---

## 8. EGASI-QAROR NUQTALARI (kod-fixdan ALOHIDA)

> Fix-ish boshlanishidan OLDIN egasi javob berishi kerak. 🔒 = Org/users-reset ga bog'liq.

1. **🔒 Users + org seed qachon?** Butun bildirishnoma adresat-hal (routing/fallback/schedule/eskalatsiya) shunga bog'liq (§3.6). Bildirishnomalar hozir hech kimga yetmaydi. — *Blokli.*
2. **Yagona `ntf_notifications` sxemasi** — `notifications`ga `module_code`/`channel`/`status`/`immutable` ustun qo'shilsinmi yoki yangi jadvalga migratsiya (Item 2, Q-35)? DELETE-immutability trigger (Item 10)? — *DECISION/SCHEMA.*
3. **Telegram token** — `TELEGRAM_BOT_TOKEN` (+ 9 bot secret) — BotFather CAPEX. Inbound `bot-gateway` shu bilan ishga tushadi. — *DATA.*
4. **Digest ranking-KPI** — top-3/past-3 leaderboard qaysi metrikaga asoslanadi (achievement/quality/OEE?)? Hozir aniqlanmagan — **fabrikatsiya QILINMAYDI, egasi bersin.** — *DATA.*
5. **Per-status SLA (`kanban_column_sla`) + per-modul chegara (`alert_thresholds`)** — jadvallar MAVJUD EMAS; egasi har status/modul uchun daqiqa/chegara qiymatlarini bersin (Item 19). — *DATA/SCHEMA.*
6. **Quiet-hours oynasi** — CRITICAL bypass uchun aniq vaqt (masalan 22:00-07:00, Item 4)? — *DATA.*
7. **🔒 Eskalatsiya-zanjiri** — bo'sh-karta→i.o.→manager_id→L0-owner→unroutable (Item 3/12); resend-interval (Item 5). `manager_id` org-reset blokli. — *DECISION + org-seed.*
8. **6 rasmiy toifa** — `notifications`ga FK-ulanib, yuboruvchi qo'lda tanlaydigan (Item 18) qilinsinmi? — *DECISION.*
9. **Feed birlashtirish** — "Markaziy bildirishnoma" `/api/pos/notifications` (POS-VIEW+`pos.movements.read`) o'rniga `/api/notifications`ga o'tsinmi? POS/CC/Kanban feed chegaralari? — *DECISION.*
10. **Cross-module trigger siyosati** — SD-status/QC-mijoz-aybi/MES-smena/PP-reja/IoT-fault/onboarding → qaysi bildirishnoma tug'iladi, dedup qanday? — *DECISION.*
11. **"Совершенствование" (improvement) Telegram chat_id** — un-fabrikatsiya id; egasi bermasa ochiq qoladi. — *DATA.*
12. **TT (texnik topshiriq) majburiy-maydonlar + 24h eskalatsiya (Item 42)** — qaysi maydonlar majburiy? SD `TtValidationService`da tekshiriladi, notifications faqat signal. — *DECISION.*
13. **Cron infra** — BullMQ/Redis (persistent outbox/debounce, Item 4/23/38)? — *DECISION/infra.*

---

## 9. XULOSA

Bildirishnoma moduli **kod-injeneriya jihatidan boy va deyarli soxta-CRUD-siz** (3 real controller, hodisa→rol markaziy marshrut-resolver, per-tur × per-kanal granular pref-matritsa REAL round-trip, egasi-sozlanadigan soatlik jadval-cron, 7 event-listener, SMS/Email/Telegram port-adapter `withRetry` bilan) — SD/CRM auditidagi "ko'rinadi lekin saqlamaydi" holati controller-darajada **topilmadi**. Lekin **uch jiddiy bo'shliq**: (1) jonli baza BUGUN bo'sh — kanonik `notifications`=0, `users`=1, va BUTUN qabul-qiluvchi hal qilish `users.role` ustiga qurilgani uchun bildirishnomalar hozir HECH KIMGA yetmaydi (jimgina warn-log; org-ierarxiyaga emas, sof RBAC — bu reset uchun users-seed yetarli); (2) vizyonning yagona-jadval va'dasi (`ntf_notifications` module_code/channel/status/immutable + DELETE-trigger) qurilmagan — feed POS/CC/Kanban VIEW'lari + ~15 to'g'ridan-INSERT bilan parchalangan, blessed `CreateNotificationCommand`ni faqat Finance/MM ishlatadi; (3) Telegram module-18'da faqat outbound, va u ham `chat_id`ni hal qilmaydigan bug bilan — haqiqiy inbound/ACK halqasi alohida `bot-gateway`da (ulanmagan). Bundan tashqari ikki schema-gap (`alert_thresholds`, `kanban_column_sla` MAVJUD EMAS), o'lik kod (orphan `alerts/*`, `TelegramSvc`, 5 adapter-metod, emittersiz listenerlar), va `company_digest`=statik-matn. Master-reja bo'yicha 132 Module-18 itemning **~70% qurilmagan** (Ha 3 · Qisman 31 · Yo'q 93 · STALE 5). Modul "markaziy bildirishnoma skeleti" sifatida chuqur, lekin "EuroPrint asab-tizimi" (yagona immutable kanal, inbound ACK-halqasi, org-eskalatsiya, real digest, taksonomiya-driven) sifatida hali yo'q. Eng katta bloklar egasi-darvozasida (users/org seed, yagona-sxema qarori, Telegram token, digest-KPI, SLA-data) — toza-FIXlar (create→telegram chat_id bug, o'lik kod tozalash, feed-drift, EP-dizayn, toifa-FK) esa darhol bajarilishi mumkin.

---
*Tayyorladi: 🔵 Tahlilchi sessiyasi · 2026-07-11 · READ-ONLY · barcha da'volar `fayl:qator`/SQL bilan · 2 mustaqil sub-agent (FE + cross-module) + shaxsiy P0 qayta-tekshiruv (jonli DB qatorlar, routing-resolver, create→telegram bug, schema-gap, view pass-through, taksonomiya seed).*
