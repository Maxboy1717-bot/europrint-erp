# Kanban (15-kanban) Moduli — To'liq Yangi Tekshiruv

> **Sana:** 2026-07-11 · **Rol:** 🔵 Tahlilchi · **READ-ONLY** — hech bir kod, sxema, konfiguratsiya yoki ma'lumot o'zgartirilmadi. Yagona yaratilgan fayl — shu hisobot.
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` (`node _audit/q.cjs`).
>
> **Metodologiya (Q-29 verify-don't-trust).** `docs/audit/` dagi hujjatlar (vizyon-1000, decisions, master-plan, Guruh-B, QARORLAR/OWNER-JAVOBLAR) faqat "qayerga qarash" ko'rsatkichi bo'ldi; har bir da'vo **shu tahlirda** olingan `fayl:qator` yoki `SQL natija` bilan qo'llab-quvvatlangan. `MARKETING-...-2026-07-10-v1.md` faqat **struktura namunasi** sifatida ishlatildi.
> **Ish tartibi:** deterministik inventar → 3 mustaqil read-only sub-agent (BE endpoint/RBAC · FE sahifa/API/dizayn · cross-module event) → har bir P0 da'vo shaxsan qayta tekshirildi (status_column_map, board seed, visibility helper, kanban_tasks vs kanban_cards, resource-allocation drift).

⚠️ **Qamrov chegarasi.** Bu audit **15-kanban = ishlab chiqarish/vazifa Kanban taxtasi** (`pages/KanbanBoard.tsx` + yordamchilar, `pages/kanban/*`, `components/kanban/*`, `hooks/useKanbanBoard*`, BE `modules/kanban/*`). **CRM Kanban** (`components/crm/workspace/KanbanView.tsx`, `pages/crm/KanbanColumn.tsx`) va **Rekruting Kanban** (`pages/RecruitingKanban.tsx`, `components/recruiting/Kanban*`, `hooks/use-kanban-dnd.ts`, `use-kanban-realtime.ts`) — **boshqa modullarga** tegishli alohida sirtlar; ular faqat qayd etildi, auditning fokusi emas.

---

## 0. Eng kritik topilma (bir jumlada)

**Kanban moduli — kod tomondan g'ayrioddiy TO'LIQ qurilgan skelet (6 controller, ~95 real-SQL endpoint, WIP-limit, org-ierarxiya visibility, eskalatsiya/takror cron, CC-ko'prik, fayl-yuklash), lekin (a) jonli baza BUGUN TO'LIQ RESET — barcha 24 `kanban_*` jadval 0 qator, `users`=1 (admin), `org_departments`/`employees`=0 — ya'ni taxta bo'sh va sinovsiz; (b) vizyonning ishlab-chiqarish-yadrosi (real texnologik ustunlar Флексо/Высечка, tiraj/progress, qoldiq-to'lov, stansiya-operator, norma-vaqt, shaxsiy-soatlik-dastur, QC/MES event ulanishlari) qurilmagan.** Master-reja bo'yicha 187 KAN-item: **Ha 3 · Qisman 40 · Yo'q 140 · STALE-DOC 4**.

Uch eng og'ir strukturaviy nuqson:

| # | Nuqson | Dalil |
|---|---|---|
| **1** | **Ishlab chiqarish taxtasi = generik ish-taxta, real texnologik oqim EMAS.** Vizyon (EP-KAN-098/#98) taxta ustunlari = Флексо/Высечка/Резка/Ламинация, kartada Тираж/progress/qoldiq-to'lov/stansiya-operator talab qiladi. Jonli kod: EUROPRINT board seed = 3 generik ustun (`Kiruvchi savat/Jarayonda/Bajarildi`), `kanban_cards` da tiraj/progress/payment/station/norm ustunlari **yo'q**. | `g4-kanban-europrint-columns-seed-2026-07-02.sql:20-22`; `kanban_cards` sxema (32 ustun, tiraj/progress/payment yo'q — DB) |
| **2** | **Status→ustun avto-ko'chirish mexanizmi qurilgan, lekin INERT.** Reader har SD-status o'zgarishida jonli ishlaydi, biroq jadvalga **yozuvchi kod yo'q** va 0 qator → doim no-op. | `kanban-status-column-map-2026-07-09.sql:10-12,19`; reader `kanban-cards.repo.ts:357-371`; wiring `order-status-changed-kanban.handler.ts:59`; DB: `kanban_status_column_map`=0 |
| **3** | **Cross-module ulanishlar deyarli yo'q + bitta o'lik listener.** Kanban HECH QANDAY event chiqarmaydi; QC-brak / MES-smena / Dizayn / waste → Kanban triggeri **umuman yo'q**; `OrderCancelledKanbanHandler` hech kim chiqarmaydigan `OrderCancelledEvent` ni tinglaydi (o'lik). Yagona ishlaydigan kirim yo'llari: SD `OrderCreatedEvent`→karta va CC `CcSpawnRequestedEvent`→karta. | §3 |

---

## 1. SAHIFA INVENTARI (noldan chiqarilgan)

### 1.1 Manba va usul

- **Marshrut:** `routes/AnalyticsRoutes.tsx:46` → `['/kanban', KanbanBoard]` (lazy import `:22`). Rekruting-kanban `:47` (`/hr/recruiting-kanban`) — alohida modul.
- **Rol darvozasi:** `routes/AppRouter.tsx:105` → `<ModuleGroup roles={ALL_AUTHENTICATED} routes={ANALYTICS_ROUTES} />`. `ALL_AUTHENTICATED` (`roleConstants.ts:6-11`) = 20 rol — **eng keng darvoza**, super-admin-cheklovi YO'Q.
- **Sidebar:** `components/sidebar/constants.ts:632-640` — guruh `kanban` "Vazifalar", `defaultUrl:"kanban"`; yozuvlar: "Buyurtmalar Kanbani" (`kanban`), "Rekruting Kanbani" (`hr/recruiting-kanban`), "Strategik Vazifalar" (`strategic-tasks`). Qo'shimcha kirish: `SidebarFooter.tsx:20`, `MobileSidebar.tsx:153` ("+ yangi vazifa" → `/kanban`); `AppRouter.tsx:180` `/feedback`→`/kanban` redirect.

### 1.2 Raqamlar (shu tahlirda hisoblangan)

| O'lchov | Qiymat |
|---|---|
| Ro'yxatdan o'tgan 15-kanban marshrut | **1** (`/kanban`) |
| Sahifa ichidagi ko'rinish (viewMode tab) | **8** (`KanbanViewTabs.tsx:16-24`: kanban·list·deadlines·myPlan·calendar·gantt·dashboard·allocation) |
| FE fayl (`pages/kanban/` + `components/kanban/` + `hooks/useKanbanBoard*`) | ~30 fayl |
| BE controller (`modules/kanban/presentation`) | **6** (+1 barrel re-export `kanban-ext.controller.ts`) |
| BE `/api/kanban/*` endpoint | **~95** |
| BE `kanban_*` jadval (jonli) | **24** — hammasi **0 qator** |
| FE chaqiradi, BE'da yo'q (DRIFT) | **1** (`/api/kanban/resource-allocation`) |
| ORPHAN fayl | **1** (`GanttView.tsx.bak.t2c`) |

### 1.3 Jonli DB holati (RESET tasdig'i)

```
kanban_boards=0 · kanban_columns=0 · kanban_cards=0 · kanban_tasks=0 (o'lik)
kanban_status_column_map=0 · kanban_observers/co_executors/checklists/... = hammasi 0
users=1 (admin/super_admin) · org_departments=0 · positions=0 · employees=0
```
⚠️ Barcha 24 `kanban_*` jadval **0 qator**. Ya'ni taxta hech qachon jonli sinovdan o'tmagan; har qanday "ishlaydi" da'vosi faqat **kod-o'qish + rollback-probe** darajasida (Q-32 static-fallback). Org-reset tufayli `head_user_id`/`manager_id`/rol-users ga tayangan har bir bog'liqlik **noldan** qayta baholandi.

### 1.4 Kanonik jadval qarori (muhim)

- **`kanban_cards` = kanonik** (barcha controllerlar shu ustidan yozadi/o'qiydi).
- **`kanban_tasks` = O'LIK** — hech kim yozmaydi (grep `INSERT INTO kanban_tasks` → 0); yagona ishora — stats-repo izohi: *"dead kanban_tasks table (always empty)"* (`drizzle-kanban-stats.repo.ts:239`). ⚠️ Vizyon-eslatmasidagi "ikki dunyo riski" (CC `basket_state` ╳ `kanban_tasks.basket_type`) — jonli holatda **hal bo'lgan**: `basket_type` ustuni `kanban_cards` da ham, `kanban_tasks` da ham **yo'q** (DB tekshiruvi), 3-savat FE'da to'g'ridan CC endpointdan o'qiladi (§3).

---

## 2. HAR SAHIFA / KO'RINISH TAHLILI

> Bitta marshrut (`/kanban`), lekin ichida 8 viewMode + 6 dialog. Har biri quyida.

| Sahifa/Ko'rinish | Reachable? | API holati | Fake-save | Green-lie | RBAC holati | Dizayn muvofiqligi | Boshqa topilma |
|---|---|---|---|---|---|---|---|
| **Board (kanban view)** | ✅ `/kanban` | REAL — `GET /kanban/boards`, `/boards/:id`, `/employees`, `/templates`, `/notifications/unread-count` (`useKanbanBoard.ts:55-78`) | Yo'q — create-board/column/card real (`mutations.ts:28,46,81`) | Yo'q | `ALL_AUTHENTICATED` (FE); BE class `admin/manager/supervisor/operator/employee/viewer/director` (`kanban-boards.controller.ts:38`) | ❌ EPPageHeader YO'Q (bespoke `BoardHeader`); ❌ xom hex ranglar (`BoardHeader.tsx:48-50,163,189,334`) | Board=0 → bo'sh holat (`EmptyBoardState`), quick-start 6 ustun yaratadi |
| **List view** | ✅ tab | Propsdan (board cards) — o'z API yo'q | — | — | board bilan bir xil | EPStatusPill ishlatadi | Klient-tomonda filtr |
| **Deadlines view** | ✅ tab | Propsdan | — | — | — | `DeadlineColumn.tsx` | — |
| **MyPlan (Shaxsiy dastur)** | ✅ tab | ⚠️ Propsdan (today/thisWeek/later guruhlash, `MyPlanView.tsx:30-40`) | — | — | — | Card/Badge | 🔴 **ShVB soatlik-grid EMAS** — vizyon EP-KAN-007/048-055 (09:00–18:00 grid, reja/fakt, rollover, fixed-slot) qurilmagan; bu shunchaki muddat bo'yicha guruhlash. Backend `personal_program` jadval/endpoint **yo'q** (grep → 0) |
| **Calendar view** | ✅ tab | Propsdan | — | — | — | `CalendarView.tsx` | — |
| **Gantt view** | ✅ tab | Propsdan | — | — | — | `GanttView.tsx` | ⚠️ `GanttView.tsx.bak.t2c` orphan yonida turadi |
| **Dashboard panel** | ✅ tab | REAL — `GET /kanban/dashboard/team-metrics`, `/task-stats`, `/employees`, `/overdue-inbox` (`DashboardPanel.tsx:39-51`) | — | — | BE reports class `super_admin/director/manager/employee` | Stat kartalar | Telegram-tasks stat tile (`:133-140`) — faqat sanoq, real Telegram integratsiya emas |
| **Allocation view** | ⚠️ tab, lekin **404** | 🔴 `GET /api/kanban/resource-allocation` (`ResourceAllocationView.tsx:18`) — **BE'da endpoint YO'Q** (grep → 0) | — | — | — | — | 🔴 **FE→BE DRIFT** — bu tab doim xato/bo'sh |
| **Notifications panel** | ✅ (header) | REAL — `GET /kanban/notifications`, `PUT /:id/read`, `/read-all` (`NotificationsPanel.tsx:35-51`) | Yo'q | 🟠 BE `read-all`→`{ok:true}` (`kanban-boards.controller.ts:202`), `unread-count` xato→`{unreadCount:0}` (`:176`) — soft-fallback, asosiy yo'l real | class-level | — | — |
| **RobotsDialog** | ✅ | REAL CRUD — `GET/POST /boards/:id/robots`, `DELETE /robots/:id` (`RobotsDialog.tsx:47-68`) | Yo'q | Yo'q | class-level | `DeleteConfirmDialog` ✅ | — |
| **FlowsDialog** | ✅ | REAL CRUD — `GET/POST /flows`, `DELETE /flows/:id` (`FlowsDialog.tsx:44-66`) | Yo'q | Yo'q | class-level | `ConfirmDialog` ✅ | — |
| **TemplatesDialog** | ✅ | REAL to'liq CRUD + apply (`TemplatesDialog.tsx:53-100`) | Yo'q | Yo'q | POST/apply = `super_admin/director` (`kanban-boards.controller.ts:78,259`) | ❌ xom `<table>` (`:231`), EPTable emas | apply = controllerda biznes-logika (Qoida 6 hidi, `kanban-boards.controller.ts:282-290`) |
| **ReportsDialog** | ✅ | REAL(read-only) — `GET /reports/employee-performance` (`:33`), export blob `/reports/export` (`:47`) | — | 🟠 **placeholder PDF** — pdfmake throw bo'lsa `Buffer.from('%PDF-1.4 placeholder')` (`kanban-reports.controller.ts:181`) | class-level | ❌ xom `<table>` (`:121`) | Faqat GET, saqlash mutation yo'q |
| **TaskDetailSheet** | ✅ | REAL — ~23 mutation (checklist/chat/tag/observer/co-executor/result/fayl/accept/complete/time/rating) (`useTaskDetailMutations.ts:55-177`) | Yo'q | Yo'q | class-level | `DeleteConfirmDialog` ✅ (`TaskDetailSheetActions.tsx:133`) | Eng to'liq qurilgan qism |
| **BoardHeader (delete-board)** | ✅ | REAL `DELETE /boards/:id` (`mutations.ts:157`) | Yo'q | Yo'q | POST board = super_admin/director; DELETE board = class-level | 🔴 **`window.confirm`** (`BoardHeader.tsx:361`) — Qoida 14 buzilishi | — |
| **KanbanColumn (delete-column)** | ✅ | REAL `DELETE /boards/:id/columns/:cid` (`mutations.ts:134`) | Yo'q | Yo'q | class-level | 🔴 **`window.confirm`** (`KanbanColumn.tsx:226`) — Qoida 14 buzilishi | — |

### 2.1 Green-lie / green-fallback tekshiruvi (BE)

| Amal | Verdikt | Dalil |
|---|---|---|
| board/column/card/template/robot/flow CRUD | **REAL** | barcha 6 controller real Drizzle/SQL (sub-agent BE tasdig'i) |
| `notifications/read-all` | 🟠 side-effect + `{ok:true}` | `kanban-boards.controller.ts:202` |
| `notifications/unread-count` xato | 🟠 `{unreadCount:0}` fallback | `:176` |
| `notifications` xato | 🟠 `return []` fallback | `:192` |
| `boards/:id/cards` xato | 🟠 catch→`{items:[],total:0}` | `kanban-cards.controller.ts:128,148,163` |
| `reports/export` PDF (pdfmake throw) | ⛔ **GREEN-LIE (catch)** | `kanban-reports.controller.ts:181` placeholder PDF |
| `moveOrderCardByStatusMap` | ⛔ **INERT no-op** (0 rule) | `kanban-cards.repo.ts:371` |
| `notImplemented` | **0 chaqiruv** | import bor (`kanban-reports.controller.ts:41`) lekin o'lik |

> **Muhim:** Modul kodida soxta-CRUD/echo deyarli yo'q — barcha yozuv yo'llari real. Yagona haqiqiy green-lie — catch-branch placeholder PDF. Qolganlari "green-fallback" (asosiy yo'l real, xatoda bo'sh qaytaradi).

---

## 3. CROSS-MODULE INTEGRATSIYA JADVALI

Kanban listenerlar CQRS `@EventsHandler` (EventEmitter2 emas); hammasi `kanban.module.ts:38,55` da provider.

| Kutilgan event / trigger | Bor/Yo'q | Dalil (file:line) |
|---|---|---|
| SD `OrderCreatedEvent` → karta yaratish | ✅ **BOR, emitter bor** | `order-created-kanban.handler.ts:21,30` → `createKanbanForOrder`; emitter `sd-quotations.repository.ts:379`, `sd/create-order.handler.ts:154` |
| SD `OrderStatusChangedEvent` → status-note + avto-ko'chirish | 🟠 **QISMAN** — note real, ko'chirish INERT | `order-status-changed-kanban.handler.ts:42` (note), `:59` (inert move); emitter `transition-status.handler.ts:93` |
| SD `OrderCancelledEvent` → kartani bekor | ⛔ **O'LIK LISTENER** — hech kim emit qilmaydi | listener `order-cancelled-kanban.handler.ts:22,31`; emitter grep `new OrderCancelledEvent(` → **0** |
| Coordination/CC `CcSpawnRequestedEvent` → karta | ✅ **BOR** | `cc-event.listener.ts:42,102` → `cc-kanban-bridge.service.ts:59-73` (`kanban_cards` INSERT, EUROPRINT board birinchi ustun) |
| QC brak/reklamatsiya → karta | 🔴 **YO'Q** | grep `kanban` in `modules/qc` → 0 |
| MES smena-handover / stop / stationDown → karta | 🔴 **YO'Q** | grep `kanban` in `modules/mes` → 0 |
| Dizayn bosqich kirishi → karta | 🔴 **YO'Q** | grep `kanban`/`CcKanbanBridge` in `modules/design` → 0 |
| waste-container-full → karta | 🔴 **YO'Q** | grep `waste.*kanban` → 0 |
| Kanban **chiqaradigan** eventlar (TaskDeadline/Inspection/StageBlocked/Overdue) | 🔴 **YO'Q — Kanban 0 event chiqaradi** | grep `.emit(`/`.publish(` in `modules/kanban` → 0 |
| Telegram ochish/yopish/izoh sinxron | 🔴 **YO'Q (faqat outbound, hech kim chaqirmaydi)** | `telegram/handlers/kanban.handler.ts:29,55` (onTaskAssigned/DueSoon) — 0 chaqiruvchi; `polling:false` (`telegram.service.ts:28`); token `process.env.TELEGRAM_BOT_TOKEN||''` (`:27`) |
| Eskalatsiya cron → bildirishnoma | 🟢 **BOR, org-mustaqil** | `kanban-overdue-escalation.cron.ts:29` → `notifications` ga owner/assigner/observer (`:54,60,69-71`); **manager_id/head_user_id ISHLATMAYDI** — reset-ga chidamli |
| Takror-vazifa cron | 🟢 **BOR, org-mustaqil** | `cron/kanban-recurring.cron.ts:23` (`0 7 * * *`) → `kanban_cards` copy; `cron.module.ts:45,146` |
| 3-savat (CC unified) | ✅ **BOR** | `ThreeBasketsPanel.tsx:36-37` → `GET /api/cc/baskets/summary` (real, 30s refetch) |

### 3.1 Telegram tayyorligi (prior-claim verify)

Telegram sinxron **token-blokdan KO'PROQ bloklangan**: (a) `polling:false` → kiruvchi buyruq dispatcheri umuman yo'q; (b) `onTaskAssigned/onTaskDueSoon` ni **hech bir kod chaqirmaydi** (0 producer); (c) token `getOrThrow` emas, `process.env...||''` (Qoida 7 buzilishi). Ya'ni token berilsa ham faqat outbound eslatma yuborilishi mumkin, va u ham hech kim chaqirmagani uchun jonli emas. **A23/C55/#85/#55 (Telegram) = qurilmagan.**

### 3.2 Org-reset ta'siri (aniq baho)

| Bog'liqlik | Reset ta'siri |
|---|---|
| Eskalatsiya cron | ✅ **Ta'sirlanmaydi** — owner/assigner/observer card ustunidan (org emas) |
| Takror cron | ✅ **Ta'sirlanmaydi** — owner_user_id copy |
| **Karta ko'rinishi (visibility helper)** | 🔴 **Ta'sirlanadi** — `kanban-visibility.helper.ts:60-75` `org_departments.head_user_id` + `employee_org_departments` ga tayanadi; 0 qatorda "boshliq bo'lim ko'radi" va "hamkasb bo'lim" tarmoqlari o'chadi → oddiy foydalanuvchi faqat O'Z kartasini ko'radi (super_admin/director bypass `:23-27`). Bu vizyon-mos (EP-KAN-084) lekin org to'lmaguncha bosqichli-ko'rinish ishlamaydi |
| BE RBAC (`@Roles`) | 🔴 **Amalda faqat super_admin** — jonli `users`=1 (admin/super_admin); `manager/employee/...` rolli user yo'q → RBAC farqi org+users seed bo'lguncha ma'nosiz |

---

## 4. VIZYON SOLISHTIRISH

### 4.1 Master-reja `[Module-15]` — 187 item tally (shu tahlirda `awk`+`uniq`)

| Holat | Soni | % |
|---|---|---|
| **Ha (to'liq)** | **3** | ~1.6% |
| **Qisman** | **40** | ~21% |
| **STALE-DOC** (hujjat eskirgan) | **4** | ~2% |
| **Yo'q (qurilmagan)** | **140** | ~75% |

**"Ha" (3):** #48/C48/#78 — "bitta asosiy mas'ul + yordamchi/kuzatuvchi" (co-executor+observer jadvallari bor); #70 — kuzatuvchi ko'radi+izoh. Ya'ni faqat kuzatuvchi/hamijrochi model to'liq.

**Vizyon (137 EP-KAN javob-xarita, `decisions/15-kanban.md`):** ✅ javoblangan 9 (3-savat CC · 24h SLA cron · shaxsiy-dastur build-prompt · rekruting-kanban+AI · rollover · ustuvorlik-rang · WIP · statuslar), 🔵 ochiq 128 (A-default, egasi tasdig'i kutiladi).

### 4.2 Yadro vizyon-nuqtalari bo'yicha holat (fully / partial / missing)

| Vizyon bloki | Holat | Dalil |
|---|---|---|
| Board CRUD + ustun/karta + drag | **Fully** | 6 controller real; `useKanbanBoard.drag.ts` |
| Kuzatuvchi + hamijrochi (observer/co-executor) | **Fully** | jadvallar + endpointlar (`kanban-cards.controller.ts:353-396`) |
| Checklist + izoh + tag + fayl + reyting + time-track | **Fully (kod)** / **bo'sh (data)** | `kanban-checklist/card-files.controller.ts`; DB 0 qator |
| WIP-limit (≤3 Jarayonda) | **Partial** | qurilgan, `kanban-boards.service.ts:28,240-259`; lekin qattiq-3, boshliq-override-log YO'Q (A6/C8) |
| Eskalatsiya (24h overdue) | **Partial** | cron bor (`kanban-overdue-escalation.cron.ts`); lekin tier-2, CEO-to'xtash, `task_escalations` immutable-qayd, oylik-hisob YO'Q (A21/C13/C15) |
| Takror-vazifa | **Partial** | cron bor; ta'til-o'rinbosar avto-yo'naltirish YO'Q (A19/C24) |
| Status→ustun avto-ko'chirish | **Partial (INERT)** | mexanizm bor, 0 rule, yozuvchi yo'q |
| 3-savat (CC unified) | **Partial** | ko'rish bor (`ThreeBasketsPanel`); ikki dunyo emas ✅; lekin Kanban→CC yozish/harakat FE'da yo'q, faqat CC ga link |
| Org-ierarxiya visibility | **Partial** | helper real; org-reset tufayli inert |
| Real texnologik ustunlar (Флексо/Высечка) | **Missing** | seed = generik 3 ustun (#98/C68/A "Yo'q") |
| Kartada Тираж/progress/qoldiq-to'lov/stansiya-operator/Примечание badge | **Missing** | `kanban_cards` da ustunlar yo'q (#99/#100/#101/#106) |
| Shaxsiy soatlik-dastur (grid+rollover+reja/fakt+fixed-slot) | **Missing** | `personal_program` BE yo'q; MyPlanView = derived guruhlash |
| Norma-vaqt master-data (30/20 daq) + norma/fakt | **Missing** | grep norm_minutes → 0 (`estimated_time` free-form, master-data emas) |
| QC-brak / MES-smena / Dizayn / waste → vazifa | **Missing** | §3 |
| Karta-markazli topshiruv (lavozim-kartaga, keyin xodimga) | **Missing** | `kanban_cards.card_id`/lavozim-link yo'q (#108/#132/#137) |
| Maxfiy vazifa (`confidential`) + intizom (hayfa) alohida jadval | **Missing** | ustun/jadval yo'q (A12/A37/#120/#126) |
| Bosqich bog'liqligi (X tugamaguncha blok) / cascade-freeze | **Missing** | #94/#122/A16 |
| Telegram sinxron ochish/yopish/checklist-blok | **Missing** | §3.1 |
| Bulk-assign UI (ta'til 50+) | **Partial** | `PATCH /cards/bulk-assign` bor (`kanban-cards.controller.ts:197`); ta'til-handover guard yo'q |

---

## 5. ORPHAN SAHIFALAR (Q-46 look-before-delete)

| Fayl | Qator (~) | Import tekshiruvi | Verdikt |
|---|---|---|---|
| `pages/kanban/GanttView.tsx.bak.t2c` | — (`.bak` backup) | grep `bak.t2c`/`GanttView.tsx.bak` → **0 importer** | 🔴 **ORPHAN** — o'lik backup; jonli `GanttView.tsx` ishlatiladi. O'chirish MUMKIN (lekin bu audit O'CHIRMAYDI) |
| `kanban-ext.controller.ts` | 9 | faqat re-export barrel | ⚠️ Controller emas (route yo'q); zararsiz, lekin chalkash |
| `kanban_tasks` jadval | — | 0 yozuvchi | ⚠️ **O'lik jadval** (stats-repo izohi bilan tan olingan) — DDL-only |
| `notImplemented` import | `kanban-reports.controller.ts:41` | 0 chaqiruvchi | ⚠️ o'lik import |

**FE→BE drift (o'lik chaqiruv):** `ResourceAllocationView.tsx:18` → `GET /api/kanban/resource-allocation` — BE'da yo'q → "allocation" tab doim bo'sh/xato. Bu orphan emas (fayl ishlatiladi), lekin **buzuq ulanish** (Q-46 bo'yicha: to'g'irlanadi yoki tab olib tashlanadi).

⚠️ Boshqa Kanban sirtlari (alohida modul, orphan EMAS): `RecruitingKanban.tsx` (`/hr/recruiting-kanban`), `components/crm/workspace/KanbanView.tsx`, `pages/crm/KanbanColumn.tsx`, `hooks/use-kanban-dnd.ts` + `use-kanban-realtime.ts` (rekruting pipeline, `/api/hr/recruitment/*`).

---

## 6. SEVERITY XULOSA (P0 / P1 / P2)

### 🔴 P0 — bloklovchi / vizyon-yadro
1. **Real texnologik oqim yo'q** — board = generik 3 ustun; kartada Тираж/progress/qoldiq-to'lov/stansiya yo'q (§0-1). Ishlab chiqarish Kanbani vizyonining o'zagi qurilmagan.
2. **QC/MES/Dizayn → Kanban event ulanishi umuman yo'q** (§3) — "golden-thread" ning Kanban-uchi uzilgan; Kanban 0 event chiqaradi.
3. **status_column_map INERT** — SD-status→ustun avto-ko'chirish 0 rule, yozuvchi kod yo'q (§0-2). Owner-data + writer kerak.
4. **`OrderCancelledKanbanHandler` o'lik listener** — `OrderCancelledEvent` emitteri yo'q → buyurtma bekor bo'lganda karta hech qachon yangilanmaydi.
5. **Jonli DB to'liq bo'sh + faqat super_admin** — hech narsa jonli sinovdan o'tmagan; org+users seed bo'lmaguncha visibility/RBAC/eskalatsiya-adresatlari amalda ishlamaydi.

### 🟠 P1 — funksional nuqson
6. **`/api/kanban/resource-allocation` FE→BE drift** (`ResourceAllocationView.tsx:18`) — allocation tab buzuq.
7. **Telegram sinxron faqat outbound + hech kim chaqirmaydi + polling:false** (§3.1).
8. **Shaxsiy soatlik-dastur qurilmagan** — MyPlanView derived; `personal_program` BE yo'q.
9. **Norma-vaqt master-data yo'q** — norma/fakt o'lchov imkonsiz.
10. **placeholder-PDF green-lie** (`kanban-reports.controller.ts:181`).
11. **delete-board / delete-column `window.confirm`** (Qoida 14) — `BoardHeader.tsx:361`, `KanbanColumn.tsx:226`.

### 🟡 P2 — sifat / dizayn
12. **EPPageHeader yo'q + xom hex ranglar** (Qoida 21) — `BoardHeader.tsx`, `KanbanViewTabs.tsx`, `BoardDialogs.tsx`, `KanbanBoardView.tsx`.
13. **Xom `<table>` (EPTable emas)** — `TemplatesDialog.tsx:231`, `ReportsDialog.tsx:121`.
14. **`GanttView.tsx.bak.t2c` orphan**; `kanban_tasks` o'lik jadval; `notImplemented` o'lik import; `kanban-ext.controller.ts` chalkash barrel.
15. **`drizzle-kanban-ext.repo.ts` 964 qator** (Qoida 13, >900) — bo'linishi kerak.
16. **template-apply controllerda biznes-logika** (`kanban-boards.controller.ts:282-290`, Qoida 6).

---

## 7. TAVSIYALAR (bog'liqlik tartibida, 32 ta)

> Belgi: **FIX** = toza kod (egasi-ruxsatisiz mumkin, Q-34) · **DECISION/DATA/SCHEMA** = egasi-darvozasi.

**A bosqichi — jonli-sinov poydevori (hamma narsa shunga tayanadi)**
1. **DATA** — `users` + org (`org_departments.head_user_id`, `employee_org_departments`) seed qilinsin; aks holda visibility (`kanban-visibility.helper.ts:60-75`), RBAC (`@Roles`), eskalatsiya-adresatlari amalda ishlamaydi. ⚠️ **Org-reset blokli.**
2. **FIX** — EUROPRINT board + standart ustunlarni seed qilib jonli smoke-test (board=0 hozir). `g4-...seed.sql` faqat board mavjud bo'lsa ishlaydi; board yaratilishi kerak.
3. **FIX** — `GanttView.tsx.bak.t2c` o'chirilsin (0 importer, Q-46 xavfsiz).

**B bosqichi — buzuq ulanishlarni yopish (toza FIX)**
4. **FIX** — `ResourceAllocationView.tsx:18` `/api/kanban/resource-allocation` drift: yo BE endpoint qo'shilsin (`kanban-reports` uslubida), yo "allocation" tab olib tashlansin (Q-46: buzuq to'liq to'g'irlanadi yoki o'chiriladi).
5. **FIX** — `OrderCancelledKanbanHandler` o'lik listener: yo SD `OrderCancelledEvent` emit qilinsin (bekor-qilish yo'lida), yo handler olib tashlansin. Ayni holda buyurtma-bekor kartaga hech qachon yetmaydi.
6. **FIX** — `kanban-reports.controller.ts:181` placeholder-PDF green-lie: pdfmake xatosi 500 qaytarsin (soxta PDF emas).
7. **FIX** — delete-board (`BoardHeader.tsx:361`) va delete-column (`KanbanColumn.tsx:226`) `window.confirm` → `ConfirmDialog` (Qoida 14).
8. **FIX** — `notImplemented` o'lik importini olib tashlash (`kanban-reports.controller.ts:41`).
9. **FIX** — `kanban-ext.controller.ts` barrel'ni oydinlashtirish yoki controller-ro'yxatdan chiqarish (chalkashlik).

**C bosqichi — status→ustun avto-ko'chirish jonli qilish**
10. **DATA** — egasi `kanban_status_column_map` qatorlarini bersin (`sd_status`→`kanban_column_id`); reader tayyor (`kanban-cards.repo.ts:357`), 0 rule = no-op.
11. **FIX** — egasi-data kelgach, master-data CRUD UI qo'shilsin (hozir INSERT faqat qo'lda SQL, `Guruh-B §1.5`) — Q-43 forma-saqlash.
12. **DECISION** — auto-move maqsadi: faqat `sales_order`-bog'langan kartalarmi yoki umumiy statusmi? (reader hozir order-cards ga cheklangan).

**D bosqichi — real ishlab-chiqarish taxtasi (vizyon-yadro, SCHEMA-og'ir)**
13. **SCHEMA** — `kanban_columns` ga real texnologik bosqich-seed (Флексо/Высечка/Резка/Ламинация/Упаковка) — egasi Производство-2026 marshrutini bersin (#98/EP-KAN-098). ⚠️ SD→PP→MES marshrut-master bilan muvofiqlashtirilsin.
14. **SCHEMA** — `kanban_cards` ga vizyon-ustunlari: `tirage`/`produced_qty` (progress-bar #99), `payment_balance` (#100), `station_id`/`operator_id` (#101), `note_badge` (Примечание #106). Egasi tasdig'i (Q-35).
15. **SCHEMA** — `card_id` (lavozim-karta) + karta-markazli topshiruv (#108/#132/#137) — ORG karta-modeli bilan bog'liq, org seed'dan keyin.
16. **DATA** — mahsulot-turi bo'yicha karta-rang (#129) — `product_type` taksonomiya (`QARORLAR:83-84` 15 tur) bilan ulanadi.

**E bosqichi — cross-module event to'ldirish**
17. **FIX/SCHEMA** — QC brak/reklamatsiya → Kanban rework-vazifa (`task.reworkFromDefect`, EP-KAN-113); QC dedup `source_event_id` (idempotent, KAN-13). QC modulida emitter + Kanban listener.
18. **FIX** — MES smena-handover / stationDown → Kanban (`card.shiftRelay`/`blocked_maintenance`, A11/A41/#112). MES event + Kanban listener.
19. **FIX** — Kanban `TaskDeadlineChangedEvent`/`StageBlockedEvent`/`InspectionAddedEvent` chiqarsin (hozir 0 event) — SD/PP/COR tinglashi uchun (A22/A33/A47).
20. **DECISION** — Dizayn-bosqich → Kanban va waste-container-full → Kanban triggerlari kerakmi/qayerdan? (vizyonda aniq emas).

**F bosqichi — eskalatsiya/WIP/rollover to'liqlash**
21. **SCHEMA** — `task_escalations` immutable jadval (A21/C15) — tier-2, CEO-to'xtash, oylik-hisob. Egasi tasdig'i.
22. **FIX** — eskalatsiya cron ish-vaqti hisobini qo'shsin (C11/A4 "faqat ish soati, smena jadvali") — hozir astronomik 24h.
23. **DECISION** — WIP-limit qattiq-3 → sozlanadigan (`kanban_columns.wip_limit`) + boshliq-override-log (A6/C8).
24. **FIX** — WIP guard hozir fail-open (`kanban-boards.service.ts:258` catch bo'sh) — count xatosi bloklamaydi; ataylanmi tasdiqlansin.
25. **SCHEMA** — rollover-hisoblagich (`rolled_over_count`, C34) + fixed-slot/ish-kuni-kalendar (A31/A40) — smena+bayram CRUD (OWNER-JAVOBLAR:12 "smena bo'yicha sozlanadigan CRUD").

**G bosqichi — shaxsiy dastur + norma-vaqt**
26. **SCHEMA/FIX** — ShVB soatlik shaxsiy-dastur (`personal_program` jadval + endpoint + `PersonalProgram.tsx` grid + rollover + reja/fakt, EP-KAN-007/048-055). Hozir MyPlanView faqat derived guruhlash.
27. **SCHEMA** — norma-vaqt master-data CRUD (task-type→daqiqa, #93/A28) + norma/fakt solishtirish; IoT "boshladim" fallback (A28).

**H bosqichi — maxfiylik / intizom / bog'liqlik**
28. **SCHEMA** — `kanban_cards.confidential` + maxfiy-visibility (A12/#120); intizom (`discipline_records` alohida, A37/#126, KAN taxtada ko'rinmaydi).
29. **SCHEMA** — bosqich-bog'liqligi (`blocked_by`, #94/#122) + cascade-freeze (A16).

**I bosqichi — Telegram / cron infra (CAPEX/credential)**
30. **DATA** — Telegram bot-token (OWNER-JAVOBLAR:39 CAPEX); keyin **FIX** — `polling:true` + inbound dispatcher + `onTaskAssigned/DueSoon` ni card-create/overdue yo'llariga ulash + token `getOrThrow` (Qoida 7). Token YAKKA yetarli emas (§3.1).
31. **DECISION** — barcha cron BullMQ (persistent, A50) ga o'tsinmi? (OWNER-JAVOBLAR:41 BullMQ/Redis = infra-qaror). Hozir `@Cron` (EventEmitter/nest-schedule).

**J bosqichi — dizayn/kod-sifat (P2)**
32. **FIX** — EPPageHeader + `var(--ep-*)`/`var(--mod-*)` tokenlar (`BoardHeader.tsx:48-50` va h.k.); xom `<table>`→EPTable (`TemplatesDialog.tsx:231`, `ReportsDialog.tsx:121`); `drizzle-kanban-ext.repo.ts` (964q) bo'lish (Qoida 13); template-apply logikasini servisga (Qoida 6).

---

## 8. EGASI-QAROR NUQTALARI (kod-fixdan ALOHIDA)

> Fix-ish boshlanishidan OLDIN egasi javob berishi kerak. 🔒 = Org-reset/head_user_id ga bog'liq.

1. **🔒 Users + org seed qachon?** Butun Kanban visibility/RBAC/eskalatsiya-adresati shunga bog'liq (§3.2). — *Blokli.*
2. **Texnologik ustunlar ro'yxati** — Производство-2026 dan real bosqich-nomlari (Флексо/Высечка/Резка/Ламинация/…)? Board 1 (buyurtma) bunga o'tadimi yoki alohida "ishlab-chiqarish board"mi? (#98)
3. **Karta maydonlari** — Тираж/progress/qoldiq-to'lov/stansiya-operator/Примечание `kanban_cards` ga qo'shilsinmi? (SCHEMA, Q-35) (#99-#106)
4. **status→ustun map qatorlari** — har `sd_status` uchun qaysi ustun? (masalan `confirmed→Jarayonda`, `cancelled→Bekor`). Guruh-B §1.5 kutmoqda. — *Owner-DATA.*
5. **Auto-move qamrovi** — faqat SD-order-kartalarmi yoki umumiy? (tavsiya 12)
6. **QC/MES/Dizayn/waste → Kanban** — qaysi eventlar vazifa tug'diradi, dedup qanday (KAN-13)? (tavsiya 17-20)
7. **🔒 Eskalatsiya zanjiri** — tier-2 kimga (manager_id), CEO-da to'xtash, oylik-hisob (A21/C13/C15). *manager_id org-reset blokli.*
8. **WIP-limit** — qattiq-3 qoladimi yoki sozlanadigan + override-log kim uchun? (A6)
9. **🔒 Karta-markazli topshiruv** — vazifa lavozim-kartaga (keyin xodimga)mi? ORG karta-modeli tayyor bo'lgach. (#108/#132)
10. **Shaxsiy soatlik-dastur** — ShVB Y20 modeli (grid+rollover+reja/fakt) qurilsinmi, qachon? (tavsiya 26)
11. **Norma-vaqt** — task-type→daqiqa master-data qiymatlari (#93, 30/20 daq); IoT "boshladim" fallback (A28).
12. **Maxfiy vazifa + intizom** — `confidential` flag + `discipline_records` alohida jadval (A12/A37) tasdiqlansinmi? (SCHEMA)
13. **Telegram** — bot-token (CAPEX, OWNER-JAVOBLAR:39); sinxron ochish/yopish kerakmi yoki faqat eslatma? (A23/C55)
14. **Cron infra** — BullMQ/Redis ga o'tishmi (A50, OWNER-JAVOBLAR:41)?
15. **Ish-kuni kalendar** — smena+bayram CRUD (OWNER-JAVOBLAR:12) — eskalatsiya/rollover/norma "ish-vaqti" hisobiga kerak (A40/C11).

---

## 9. XULOSA

Kanban moduli **kod-injeneriya jihatidan boy** (6 controller, ~95 real-SQL endpoint, WIP-guard, org-ierarxiya visibility, 2 cron, CC-ko'prik, fayl-yuklash, ~23 detail-mutation) — soxta-CRUD/echo deyarli yo'q. Lekin **ikki jiddiy bo'shliq**: (1) jonli baza BUGUN to'liq reset (24 jadval 0 qator, users=1) — hech narsa jonli isbotlanmagan; (2) vizyonning **ishlab-chiqarish yadrosi** (real texnologik ustunlar, karta-tiraj/progress/to'lov/stansiya, shaxsiy soatlik-dastur, norma-vaqt, QC/MES/Dizayn event-ulanishlari, Telegram sinxron) — 187 KAN-itemning **~75% qurilmagan** (Ha 3 · Qisman 40 · Yo'q 140). Modul "generik vazifa-taxta" sifatida ishlaydi, lekin "EuroPrint ishlab-chiqarish Kanbani" sifatida hali yo'q. Eng katta bloklar egasi-darvozasida (org seed, texnologik-ustun-data, status-map, event-siyosat) — toza-FIXlar (drift, o'lik-listener, green-lie PDF, window.confirm, dizayn-token) esa darhol bajarilishi mumkin.

---
*Tayyorladi: 🔵 Tahlilchi sessiyasi · 2026-07-11 · READ-ONLY · barcha da'volar `fayl:qator`/SQL bilan.*
