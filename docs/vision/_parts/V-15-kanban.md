## [V/VERIFY] Kanban (15) — cross-ref hal qilindi

> Jonli kod trace 2026-07-07. Search roots: `apps/api/src/modules/kanban/`, `apps/api/src/cron/`, `apps/api/src/telegram/`, `apps/api/src/modules/communication-center/`, `apps/api/src/shared/db/`, `lib/db/src/schema/`, FE `artifacts/erp-dashboard/src/`.
> Umumiy topilma: `kanban_cards` (canonical schema-kanban.ts) = board/column/card + owner/assigner + rating(1-5) + recurrence + accepted/completed. YO'Q: WIP-limit, confidential/disciplinary, source_event_id, card_id(org), GSD, slot/smena, task_escalations, target_cards, IoT-hook, formula-og'irliklar. Kanban cron'lari = `@nestjs/schedule @Cron` (BullMQ EMAS). AI-biriktirish/AI-pattern YO'Q (robot = manual config engine).

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 1 | 3-savat CC bilan birlashsin | cross-ref kerak | **Qisman** | `cc-kanban-bridge.service.ts:35-73` CC-hujjat→kanban karta (bir tomonlama). `/api/basket/unified` endpoint kodda YO'Q (grep → faqat docs). Sync-event/kanonik-CC birlashuv qurilmagan |
| 2 | Rasporyajenie→avtomat vazifa (WIP=3 queue) | cross-ref kerak | **Qisman** | CC/farmoyish→auto karta `cc-kanban-bridge.service.ts` (CcSpawnRequestedEvent). WIP=3 queue/queued-status YO'Q (grep `wip_limit` → faqat i18n error stringlar, service yo'q) |
| 3 | Egasiz karta 48h eskalatsiya | cross-ref kerak | **Yo'q** | grep `task_escalations` → 0. `kanban-overdue-escalation.cron.ts` faqat kunlik owner/assigner notif; 48h/2-daraja eskalatsiya + bo'sh-slot handling yo'q |
| 4 | Topshiruvchi inaktiv HR handover o'rinbosar | cross-ref kerak | **Yo'q** | grep `auto_redirect`/HR-handover kanban'da → 0. Inaktiv-topshiruvchi fallback yo'q |
| 5 | Rollover cron smena + FOR UPDATE | cross-ref kerak | **Qisman** | `kanban-recurring.cron.ts:23` yagona kunlik `@Cron('0 7 * * *')` — takrorlanuvchi kartalarni qayta yaratadi. Smena-bog'liq rollover, `SELECT FOR UPDATE`, 3-smena alohida cron YO'Q |
| 6 | WIP limit SERVICE + override log | cross-ref kerak | **Yo'q** | grep `wip_limit`/`wipLimit` service-qatlamda → 0. WIP tekshiruv/override log qurilmagan |
| 7 | "Jarayonda" band slot ogohlantirish | cross-ref kerak | **Yo'q** | Slot/vaqt-slot konsepsiyasi kanban'da yo'q. `kanban-boards.service.ts:188` move-guard faqat "Bajarildi" assigner-confirm bloklaydi |
| 8 | Karta arxivlanganda GSD hissasi card_id | cross-ref kerak | **Yo'q** | `kanban_cards` (schema-kanban.ts:32) da card_id/GSD ustuni yo'q. GSD-hisob card_id bo'yicha mexanizm yo'q |
| 9 | Tiraj o'zgarsa progress qayta hisob + PP/MES event | cross-ref kerak | **Yo'q** | Tiraj/progress-delta + PP/MES event kanban'da yo'q (grep → 0) |
| 10 | Ikki xodim — faqat asosiy mas'ul ko'radi | cross-ref kerak | **Qisman** | `kanban_co_executors` jadval + endpoint mavjud (schema-kanban.ts:193; facade `addCoExecutor`). UNIQUE(card_id,user_id). LEKIN `kanban-visibility.helper.ts:55` hamijrochini ham ko'ruvchiga qo'shadi — "faqat asosiy ko'radi" to'liq emas |
| 11 | Estafeta rad/kechiksa 30daq log + MES handover | cross-ref kerak | **Yo'q** | Estafeta/handover/30-daq/MES kanban'da yo'q (grep → 0) |
| 12 | Maxfiy intizom-tergov avto-kuzatuvchi qo'shilmaydi | cross-ref kerak | **Yo'q** | `kanban_cards` da `confidential`/`disciplinary` ustuni yo'q (schema-kanban.ts). Maxfiy-tip mexanizmi qurilmagan |
| 13 | Brak vazifasi dedup source_event_id | cross-ref kerak | **Yo'q** | grep `source_event_id`/`sourceEventId` butun apps/api → 0. Brak-vazifa idempotent dedup yo'q |
| 14 | warehouse_stock rezerv + outbox lock | cross-ref kerak | **Yo'q** | Stock/rezerv/outbox-lock kanban'da yo'q (grep → 0) |
| 15 | Kunlik SHOSHILINCH limit (max 2) | cross-ref kerak | **Yo'q** | Urgent-count/kunlik-limit mexanizmi yo'q (grep → 0) |
| 16 | Shablon N-qadam cascade-freeze | cross-ref kerak | **Qisman** | `kanban_templates` jadval + CRUD mavjud (schema-kanban.ts:121; `getTemplates`/`createTemplate`). Cascade-freeze/qayta-qulflash logikasi YO'Q |
| 17 | Bekor qism KPI formula inson tasdiq | cross-ref kerak | **Yo'q** | Formula `business.constants.ts` da qurilmagan (Step3 tasdiq: Magic-Numbers Kanban QUEUED). KPI% neytral-sabab logikasi yo'q |
| 18 | @so'rov sub-vazifa mentioned basket, muddat meros | cross-ref kerak | **Qisman** | `parent_card_id` ustun mavjud (`kanban-boards.service.ts:109`, migration). LEKIN @mention→avto-subtask + muddat-meros logikasi yo'q |
| 19 | Takror-vazifa cron ta'tilda o'rinbosarga | cross-ref kerak | **Qisman** | `kanban-recurring.cron.ts` takror-karta cron mavjud. HR-ta'til `auto_redirect` o'rinbosarga yo'naltirish YO'Q (grep → 0) |
| 20 | 3-smena kun-yopilar atomik tranzaksiya | cross-ref kerak | **Yo'q** | Smena/kun-yopilar atomik blok kanban'da yo'q (grep → 0) |
| 21 | Eskalatsiya CEO→Owner Telegram immutable | cross-ref kerak | **Yo'q** | grep `task_escalations` → 0. Owner Telegram eskalatsiya + immutable qayd yo'q; overdue cron faqat notifications INSERT |
| 22 | Muddat cho'zilsa SD/PP TaskDeadlineChangedEvent | cross-ref kerak | **Yo'q** | grep `TaskDeadlineChanged` → 0. SD/PP listener yo'q |
| 23 | Telegram-yopish checklist BLOK + virus-scan fayl | cross-ref kerak | **Qisman** | Checklist CRUD (`kanban-checklist.controller.ts`) + Telegram notif (`telegram/handlers/kanban.handler.ts` faqat taskAssigned/dueSoon) mavjud. Checklist-to'lmasa-BLOK darvozasi + virus-scan YO'Q |
| 24 | Ta'til 50+ bulk-assign UI + queue | cross-ref kerak | **Yo'q** | Bulk-assign/queue mexanizmi yo'q (grep → 0) |
| 25 | Stansiya-operator o'zgarsa ochiq kartalar queue | cross-ref kerak | **Yo'q** | Master-data operator-change event + WIP-queue kanban'da yo'q (grep → 0) |
| 26 | Buyurtma bekor bosqich material GL chiqit | cross-ref kerak | **Qisman** | `order-cancelled-kanban.handler.ts` → `moveOrderCardToCancelled` (karta "bekor"ga). GL "ishlab chiqarish→chiqit" material-hisob + QC/FIN birga-tasdiq YO'Q |
| 27 | Kechikish CRM avto-yangilash dedup | cross-ref kerak | **Qisman** | `kanban-overdue-escalation.cron.ts:29-47` kunlik eskalatsiya + dedup (notifications NOT EXISTS, kuniga-bir). LEKIN CRM murojaat avto-yangilash + `order_id` 24h dedup YO'Q |
| 28 | Norma-vaqt IoT boshladim fallback status-change | cross-ref kerak | **Qisman** | `kanban_time_tracks` + `startTimeTracking`/`stopTimeTracking` (manual) mavjud. IoT-tablet timestamp integratsiyasi + `NORM_TIME_START_FALLBACK` YO'Q (grep → 0) |
| 29 | To'lov qoldig'i >0 Eltib berish BLOK | cross-ref kerak | **Yo'q** | To'lov-qoldiq/kredit-limit blok kanban'da yo'q (grep `paymentBalance`/`kredit` kanban → 0) |
| 30 | AI takror-muammo naqsh KAN+QC+COR+HR | cross-ref kerak | **Yo'q** | AI ko'p-manba pattern tahlil kanban'da yo'q (Step3/Reconciliation: AI-data 0 rows) |
| 31 | Qotirilgan slot HR smena ShiftChangedEvent | cross-ref kerak | **Yo'q** | Slot/ShiftChangedEvent kanban'da yo'q (grep → 0) |
| 32 | SHOSHILINCH kun to'lsa past siljiydi AI taklif | cross-ref kerak | **Yo'q** | Urgent-rollover sanagich + AI-taklif yo'q (grep → 0) |
| 33 | PP Gantt kechiksa StageBlockedEvent AI | cross-ref kerak | **Yo'q** | grep `StageBlocked` → 0. `card.blockedBy` event + BullMQ AI-xabar yo'q |
| 34 | Летучка materialized view 5daq | cross-ref kerak | **Yo'q** | Kanban materialized view yo'q (grep `letuchka`/`летучка` kanban → 0; mavjud MV-refresh service EOQ/boshqa modul uchun) |
| 35 | Оргполитика target=lavozim-karta | cross-ref kerak | **Yo'q** | grep `target_cards` → 0. Policy→karta yo'naltirish kanban'da yo'q |
| 36 | Mentor yo'q LMS darslik uzaytirish | cross-ref kerak | **Yo'q** | LMS-027 event + HR-adaptatsiya integratsiya kanban'da yo'q (grep → 0) |
| 37 | Intizom alohida jadval, KAN taxtada ko'rinmaydi | cross-ref kerak | **Qisman** | `discipline_records` jadval HR modulda mavjud (`hr/attendance/discipline-record.repository.ts`). `kanban_cards` da intizom-ustuni yo'q → kanban taxtasida ko'rinmaydi (talab bajarilgan tomon). Kanban↔RBAC ko'rish cheklovi cross-modul |
| 38 | Ta'minot vazifa oldin ochiq PO tekshirish MM | cross-ref kerak | **Yo'q** | Kanban'dan `purchase_order` ochiq-PO tekshiruv/trigger yo'q (grep → 0) |
| 39 | Reyting formula achievement*0.7-escalation*0.3 | cross-ref kerak | **Yo'q** | Formula-og'irliklar `business.constants.ts` da yo'q (Step3: formulalar QUEUED). Mavjud: `kanban_cards.rating` manual 1-5 yulduz (`ddl-kanban-cards-rating-2026-06-20.sql`) — bu formula EMAS |
| 40 | "3 ish-kuni"=smena+bayram WORK_DAY_CALENDAR | cross-ref kerak | **Yo'q** | grep `WORK_DAY_CALENDAR` → 0. MES-smena + HR-bayram ish-kuni hisobi yo'q |
| 41 | Stansiya ta'mirda blocked_maintenance StationDown | cross-ref kerak | **Yo'q** | grep `blocked_maintenance`/`StationDown` → 0. PP qayta-rejalash trigger yo'q |
| 42 | Ichki (Академия) buyurtma AI past ustuvorlik | cross-ref kerak | **Yo'q** | AI stansiya-navbat ustuvorlik kanban'da yo'q (grep → 0) |
| 43 | Примечание badge tasdiq operatorga, o'tish BLOK | cross-ref kerak | **Yo'q** | Note-badge tasdiq darvozasi yo'q; move-guard faqat "Bajarildi" assigner-confirm bloklaydi (`kanban-boards.service.ts:201`) |
| 44 | AI biriktirish history*0.4+workload*0.3+razryad*0.3 | cross-ref kerak | **Yo'q** | AI-biriktirish + feedback-loop yo'q. `kanban-robot.service.ts` = manual-config engine (`assign_user` action = qattiq targetUserId), AI emas; og'irliklar `business.constants.ts` da yo'q |
| 45 | Boshliq tasdiq 2 soat kechiksa xodim ishlaydi (SLA=2h) | cross-ref kerak | **Yo'q** | 2h-SLA timeout + o'z-o'zi-davom logikasi yo'q. Assigner-confirm bor, lekin vaqt-cheklov yo'q |
| 46 | Vaqt-logi majburiylik karta time_tracking_required + kategoriya | cross-ref kerak | **Yo'q** | `kanban_cards` da `time_tracking_required` flag yo'q; `TIME_LOG_REQUIRED_CATEGORIES` grep → 0. `kanban_time_tracks` manual bor, lekin darvoza/Payroll integratsiya yo'q |
| 47 | Inspeksiya reestr InspectionAddedEvent outbox idempotent | cross-ref kerak | **Yo'q** | grep `InspectionAddedEvent`/outbox kanban → 0. COR+HR asinxron tinglash yo'q |
| 48 | Fayl 10MB virus-scan QC 8D/CAPA link | cross-ref kerak | **Qisman** | Fayl yuklash ishlaydi (`kanban-card-files.controller.ts:33-38`: 25MB limit + ext-whitelist, real disk-save + `kanban_files`). Virus-scan (ClamAV) YO'Q; `linked_qc_id`/CAPA link YO'Q (grep `clamav`/`virus` kanban → 0; Step3 SB0464 CAPA-link STILL-OPEN). Chegara 25MB (10MB emas) |
| 49 | Recruitment Kanban HR+karta egalari RBAC | cross-ref kerak | **Qisman** | `kanban-visibility.helper.ts:46` org-sxema scoped RBAC predicate mavjud (super_admin/director full; boshqalar bo'lim-daraxti bo'yicha). FE `recruiting/KanbanBoardGrid.tsx` mavjud. `ERP_PERMISSION` maydon + alohida nomzod-portali + Design-QA QUEUED (Step3 MASTER-STATUS-BOARD:309) — to'liq emas |
| 50 | Hamma cron BullMQ persistent, offline drain | cross-ref kerak | **Yo'q** | Kanban cron'lari `@nestjs/schedule @Cron` (in-memory): `kanban-recurring.cron.ts:23`, `kanban-overdue-escalation.cron.ts:29`. BullMQ (queue.module) boshqa modullar uchun, kanban unga ulanmagan. removeOnFail/attempts/IndexedDB-drain YO'Q |
