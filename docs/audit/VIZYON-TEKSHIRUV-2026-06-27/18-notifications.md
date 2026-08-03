# Modul 18 — Bildirishnoma / Botlar — MUSTAQIL TEKSHIRUV

- Savollar: 82 | Doc self-claim: **27%** vizyon
- Tekshiruvchi recompute (verifiable=81, egasi-data=1): **realPct ≈ 15%**
  - bor=2, qisman=21, yo'q=58, egasi-data=1
- Umumiy xulosa: doc flaglari (bor/qisman/yo'q) deyarli to'g'ri. Lekin bir nechta Isbot **dalil noaniq/xato** — mavjud bo'lmagan jadval nomlari ("count=0" deb yozilgan, aslida jadval umuman yo'q), `org_nodes` (mavjud emas, aslida `org_departments`), va "BullMQ yo'q" (aslida BullMQ kodbazada bor, faqat NTF'ga ulanmagan).

## REFUTED CLAIMS (dalil xato/oshirilgan — xulosa yo'nalishi to'g'ri bo'lsa ham)
- **18.8 / 18.9** — `org_nodes.telegram_group_id` "JONLI mavjud" → `org_nodes` jadvali **umuman yo'q**; `telegram_group_id` ustuni `org_departments`da.
- **18.23** — `users.telegram_id UNIQUE` → index bor (`idx_users_telegram_id`) lekin **UNIQUE emas** (partial non-unique btree).
- **18.6 / 18.32** — "BullMQ yo'q" → BullMQ kodbazada **bor** (app.module, pos queue.service, forecast-weekly.job, eoq cron); NTF'ga ulanmagan, lekin "yo'q" xato.
- **18.25** — "BullMQ delayed-job yo'q" → BullMQ mavjud (delayed-job NTF muddat uchun ishlatilmaydi, ammo blanket "yo'q" noaniq).
- **18.3 / 18.79** — `notification_schedules ... count=0` → jadval **mavjud emas** (count=0 emas).
- **18.7 / 18.74** — `kanban_column_sla ... count=0` → jadval **mavjud emas**.
- **18.70** — `ntf_doc_views ... count=0` → jadval **mavjud emas**.

> Eslatma: yuqoridagilar asosan dalil-aniqlik nuqsoni. Vizyon-qoplama hukmi (feature qurilganmi) hamma holatda to'g'ri qoladi (count=0 yoki jadval-yo'q — ikkalasi ham "qurilmagan"ni tasdiqlaydi).

---

## 18.1 — EP-NTF-001 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ShVB 4 komanda (/zvs_status, /my_gsd, /company_state, /weekly_digest)?
- Doc Isbot: bot.helpers 151/178/224 da 3 komanda REAL SQL, /my_gsd yo'q.
- Tekshiruv: bot.helpers.ts:154 buildZvsStatusReply (SQL FROM zvs), :181 buildCompanyStateReply (cash_registers/cash_transactions/purchase_invoices), :226 buildWeeklyDigestReply — barchasi real SQL. `grep my_gsd` butun src = 0 natija. Tasdiq.

## 18.2 — EP-NTF-002 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Mening holatim' karta-markazli holat komandasi?
- Doc Isbot: director.bot faqat /kpi /ai /summary; karta-holat yo'q.
- Tekshiruv: director.bot.ts:25-29 — faqat /kpi /ai /summary. Shaxsiy karta-status komanda yo'q. Tasdiq.

## 18.3 — EP-NTF-003 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Haftalik digest egasi-sozlanadigan vaqtda?
- Doc Isbot: fp-cycle hardcoded @Cron('0 9 * * 2/3'); notification_schedules count=0.
- Tekshiruv: fp-cycle.cron.ts haqiqatda 4 hardcoded cron: '0 9 * * 2','* * 3','* * 4','* * 1' (doc soddalashtirgan). `notification_schedules` jadvali **mavjud emas** (count=0 emas). Hardcoded cron real → qisman to'g'ri.

## 18.4 — EP-NTF-004 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Digest org-marshrut bo'yicha (daraja)?
- Doc Isbot: fp-cycle ZVS faqat manager'larga; daraja-marshrut yo'q.
- Tekshiruv: fp-cycle.cron.ts:26-44 — hrDepartments.headId orqali managerlarga; daraja-umumlashtirish yo'q. Tasdiq.

## 18.5 — EP-NTF-005 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: FP-tsikl eslatmalari (4 bosqich)?
- Doc Isbot: fp-cycle real Telegram cron bor, lekin 2 cron, 4-bosqich emas.
- Tekshiruv: fp-cycle.cron.ts da 4 ta @Cron real Telegram sendMessage (ZVS/FP-day/bank/cash). To'liq FP-tsikl 4 bosqich emas. Tasdiq (doc "GSD" deb yozgani aslida FP-day, kichik nuqson).

## 18.6 — EP-NTF-006 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Holat-alert chegaradan o'tganda darrov signal?
- Doc Isbot: alerts.service bor lekin threshold-trigger+debounce yo'q; BullMQ yo'q.
- Tekshiruv: alerts.service.ts faqat CRUD (findAll/create/update/remove), threshold/debounce yo'q — to'g'ri. Lekin "BullMQ yo'q" XATO: BullMQ kodbazada bor (app.module.ts, pos/queue.service.ts, forecast-weekly.job.ts). Xulosa (yo'q) to'g'ri.

## 18.7 — EP-NTF-007 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Alert chegaralarini egasi belgilaydi?
- Doc Isbot: kanban_column_sla h.k. count=0; egasi-sozlash jadval yo'q.
- Tekshiruv: `kanban_column_sla` jadvali **mavjud emas** (count=0 emas). Config UI/jadval yo'q — xulosa to'g'ri.

## 18.8 — EP-NTF-008 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Kanal: shaxsiy→shaxsiy chat, bo'lim→guruh?
- Doc Isbot: users.telegram_chat_id + org_nodes.telegram_group_id ustunlari bor; marshrut yo'q.
- Tekshiruv: users.telegram_chat_id MAVJUD. Lekin `org_nodes` jadvali **yo'q**; telegram_group_id `org_departments`da. Citation xato, ammo linking ustun mavjud → qisman.

## 18.9 — EP-NTF-009 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Telegram guruhlarini org-tugunga bog'lash?
- Doc Isbot: org_nodes.telegram_group_id "JONLI mavjud".
- Tekshiruv: `org_nodes` jadvali mavjud emas. `telegram_group_id` ustuni `org_departments`da bor (information_schema tasdiqladi). Bog'lash nuqtasi bor lekin boshqa jadvalda; marshrut ulanmagan → qisman.

## 18.10 — EP-NTF-010 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Vertikal yo'naltirish (manager_id zanjiri)?
- Doc Isbot: cc-org-resolver:127-164 manager_id zanjiri REAL (CC), NTF'ga ulanmagan.
- Tekshiruv: cc-org-resolver.service.ts:39 resolveApprover + resolveBase (CEO/DIRECTOR/MANAGER_OF_SENDER) real Result-based. CC modulida, NTF emas. Tasdiq.

## 18.11 — EP-NTF-011 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: /company_state 7 otdeleniye ko'rsatkichlari?
- Doc Isbot: bot.helpers:178 kassa+30kun+overdue REAL; 7-otdeleniye emas (moliya-fokus).
- Tekshiruv: bot.helpers.ts:181-221 buildCompanyStateReply — kassa balansi+30kun kirim/chiqim+overdue. Faqat moliya. Tasdiq.

## 18.12 — EP-NTF-012 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Leaderboard digestda?
- Doc Isbot: NTF digestda leaderboard qurilmagan.
- Tekshiruv: Digest fayllarda leaderboard yo'q (gamification alohida). Tasdiq.

## 18.13 — EP-NTF-013 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Karta-AI bahosi digestda?
- Doc Isbot: NTF digestda karta-AI baho yetkazish yo'q.
- Tekshiruv: NTF event-handlerlarda AI-fit yetkazish yo'q. Tasdiq.

## 18.14 — EP-NTF-014 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Razryad o'zgarishi xabari (3 adresat)?
- Doc Isbot: razryad.changed NTF eventi/listeneri yo'q.
- Tekshiruv: `grep razryad.changed` = 0 natija. Tasdiq.

## 18.15 — EP-NTF-015 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Bildirishnoma profil tilida?
- Doc Isbot: notifications title_uz/ru + message_uz/ru + locales json; snapshot yo'q.
- Tekshiruv: \d notifications — title_uz, title_ru, message_uz, message_ru ustunlari MAVJUD. Per-user til marshrut qisman, snapshot-at-enqueue yo'q. Tasdiq.

## 18.16 — EP-NTF-016 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: O'qilganini tasdiqlash (inline ACK tugma)?
- Doc Isbot: read_at/read bor (web); Telegram inline ACK + callback ack yo'q; ack_at ustuni yo'q.
- Tekshiruv: \d notifications — read_at, read bor; `ack_at` ustuni YO'Q (information_schema tasdiq). `grep ack_at` = 0. Tasdiq.

## 18.17 — EP-NTF-017 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Javob bermasa eskalatsiya?
- Doc Isbot: cc-sla.cron escalateApprovals REAL, faqat cc_documents; umumiy NTF taymer yo'q.
- Tekshiruv: cc-sla.cron.ts:161 escalateApprovals(), :37 @Cron EVERY_30_MINUTES, UPDATE cc_documents/cc_approvals. CC scope. Tasdiq.

## 18.18 — EP-NTF-018 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tinchlik vaqti (tunda faqat shoshilinch)?
- Doc Isbot: quiet-hours logikasi/jadval yo'q.
- Tekshiruv: `grep quiet` NTF'da yo'q (faqat invariants/schema-business da boshqa kontekst). Tasdiq.

## 18.19 — EP-NTF-019 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Per-modul bot ERP'ga ulangan?
- Doc Isbot: bot-gateway.controller /bot/:bot/webhook 9 modul-bot, jonli SQL.
- Tekshiruv: bot-gateway.controller.ts:23 BOT_NAMES = 9 (crm/mes/hr/logistics/fin/qc/director/ombor/pos); :69 @Post(':bot/webhook'); director.bot real kpi_metrics SQL. Tasdiq.

## 18.20 — EP-NTF-020 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Digestga PDF/grafik?
- Doc Isbot: PDF biriktirish yo'q; sendMessage faqat matn.
- Tekshiruv: telegram.service/bot reply faqat text (HTML). PDF biriktirish yo'q. Tasdiq.

## 18.21 — EP-NTF-021 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Telegram orqali tugma bilan javob?
- Doc Isbot: bot-gateway callback_query qabul qiladi (38-42); inline-keyboard tasdiq-flow botlarda yo'q.
- Tekshiruv: bot-gateway.controller.ts:38-42 callback_query zod schema; :89 text=callback_query.data. Inline keyboard CC/POS botda bor lekin 9 modul-botda flow yo'q. Tasdiq.

## 18.22 — EP-NTF-022 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Bot komandalariga RBAC?
- Doc Isbot: director.bot:21 hasBotPermission + TelegramAuthGuard.
- Tekshiruv: director.bot.ts:21 `if (!hasBotPermission('director', msg.role)) return deniedReply`; bot-gateway @UseGuards(TelegramAuthGuard). Tasdiq.

## 18.23 — EP-NTF-023 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Yangi xodim ulanishi (deep-link/OTP)?
- Doc Isbot: users.telegram_id UNIQUE linking ustuni bor; deep-link bor; 24h OTP to'liq emas.
- Tekshiruv: users.telegram_id ustuni MAVJUD, lekin index `idx_users_telegram_id` UNIQUE EMAS (partial non-unique btree, indexdef tasdiq). Ustun bor → qisman holatda. "UNIQUE" xato.

## 18.24 — EP-NTF-024 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Oltin-ip holati bo'yicha bildirishnoma?
- Doc Isbot: order-created-notification.listener:42-50 REAL saqlaydi; faqat 'created'.
- Tekshiruv: order-created-notification.listener.ts:40-51 — OrderCreatedEvent → warehouse_manager'larga Notification real save. Faqat created (har-bosqich emas; warehouse_manager, sotuv menejeri emas). Tasdiq (REAL save).

## 18.25 — EP-NTF-025 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Kechikish/muddat signali (ikki bosqich)?
- Doc Isbot: ikki-bosqich muddat-taymer yo'q; BullMQ delayed-job yo'q.
- Tekshiruv: Muddat-taymer yo'q — to'g'ri. "BullMQ delayed-job yo'q" noaniq: BullMQ kodbazada bor (NTF uchun ishlatilmaydi). Xulosa (yo'q) to'g'ri.

## 18.26 — EP-NTF-026 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ЦКП haftalik xabar?
- Doc Isbot: ckp.weekly eventi/cron yo'q.
- Tekshiruv: `grep ckp.weekly` = 0 natija. Tasdiq.

## 18.27 — EP-NTF-027 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Bildirishnoma jurnali?
- Doc Isbot: notifications 3735 qator + read_at/sent_via_telegram + controller; notification_logs count=0.
- Tekshiruv: notifications count=**3925** (doc 3735, o'sgan), read_at + sent_via_telegram ustunlari MAVJUD. notification_logs jadvali mavjud, count=0. Tasdiq.

## 18.28 — EP-NTF-028 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Shablonlarni egasi tahrirlaydi?
- Doc Isbot: notification-schema.service faqat ensurePreferencesTables; shablon CRUD yo'q.
- Tekshiruv: notification-schema.service.ts:15 faqat repo.ensurePreferencesTables(). Template CRUD/grep yo'q. Tasdiq.

## 18.29 — EP-NTF-029 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Avariya signali (3 adresat)?
- Doc Isbot: mro-machine-stopped.listener:41-48 → direktorga REAL; 3-adresat fan-out emas.
- Tekshiruv: mro-machine-stopped-notification.listener.ts:39-50 — MroMaintenanceStopEvent → role='director' Notification real save. Faqat direktor. Tasdiq.

## 18.30 — EP-NTF-030 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Maqtov/tanbeh marshruti?
- Doc Isbot: Feedback/maqtov NTF zanjiri yo'q.
- Tekshiruv: NTF event-handlerlarda yo'q. Tasdiq.

## 18.31 — EP-NTF-031 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 6 tur 'yozma majburiy' → rasmiy yozuv?
- Doc Isbot: ntf.written.formalize handler yo'q.
- Tekshiruv: Bunday handler yo'q. Tasdiq.

## 18.32 — EP-NTF-032 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Og'zaki topshiriq 24h yozma qayd?
- Doc Isbot: kanban_tasks source='verbal' + verbal_confirmed_at + 24h taymer yo'q; BullMQ yo'q.
- Tekshiruv: `grep verbal_confirmed_at` = 0. Taymer yo'q — to'g'ri. "BullMQ yo'q" XATO (BullMQ bor). Xulosa to'g'ri.

## 18.33 — EP-NTF-033 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tex-kartada xato 15daq signal?
- Doc Isbot: TechCardErrorDetectedEvent listener + 15daq taymer yo'q.
- Tekshiruv: NTF'da bunday listener/taymer yo'q. Tasdiq.

## 18.34 — EP-NTF-034 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tex-karta 1 soatlik countdown?
- Doc Isbot: ntf.techcard.fix1hour yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.35 — EP-NTF-035 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tungi smena telefon-eskalatsiya?
- Doc Isbot: call.log qayd yo'q.
- Tekshiruv: Telefon-qayd jadval/handler yo'q. Tasdiq.

## 18.36 — EP-NTF-036 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tungi yakka qaror belgisi + digest?
- Doc Isbot: night.soloDecision yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.37 — EP-NTF-037 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Rahbarni chetlab o'tish signali?
- Doc Isbot: bypass.emergency yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.38 — EP-NTF-038 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yuboruvchi vs qabul qiluvchi mas'uliyat?
- Doc Isbot: notifications user_id+read_at bor; sender_id yo'q.
- Tekshiruv: \d notifications — user_id, read_at bor; sender_id ustuni YO'Q (information_schema tasdiq). Tasdiq.

## 18.39 — EP-NTF-039 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Mijoz muammosi savdo menejeriga?
- Doc Isbot: problem.routeSales yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.40 — EP-NTF-040 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: RD-2/4/5 uchlik yig'ilish chaqirig'i?
- Doc Isbot: trio.meeting1hour yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.41 — EP-NTF-041 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Vaqtincha to'xtatish' zanjirga e'lon?
- Doc Isbot: halt.broadcast yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.42 — EP-NTF-042 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yangi оргополитика e'loni?
- Doc Isbot: orgpolicy.announce yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.43 — EP-NTF-043 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Takroriy xato → оргополитика topshirig'i?
- Doc Isbot: repeatError.policy yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.44 — EP-NTF-044 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kun yakuni НО-3 hisobot eslatma?
- Doc Isbot: no3.dailyReport yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.45 — EP-NTF-045 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kunlik/haftalik/oylik 3 ritm?
- Doc Isbot: fp-cycle haftalik bor; kunlik+oylik uchlik yo'q.
- Tekshiruv: fp-cycle haftalik cron real; report.triRhythm yo'q. Tasdiq.

## 18.46 — EP-NTF-046 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Smenalik hisobot yo'naltirish?
- Doc Isbot: shift.report yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.47 — EP-NTF-047 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Xom-ashyo yetishmasligi signali?
- Doc Isbot: material.shortage trigger yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.48 — EP-NTF-048 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Jihoz nosozligi eng yuqori ustuvor?
- Doc Isbot: EquipmentFaultEvent listener yo'q.
- Tekshiruv: NTF'da equipment.fault yo'naltirish yo'q. Tasdiq.

## 18.49 — EP-NTF-049 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kechikish xavfi tugmasi?
- Doc Isbot: delayRisk.button yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.50 — EP-NTF-050 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'O'z vaqtida xabar bermaslik' qaydi?
- Doc Isbot: lateReport.measure yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.51 — EP-NTF-051 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kartochka status o'zgarishi → keyingi mas'ul?
- Doc Isbot: orphan-events.listener:92 kanban.task.moved 'TODO: notify' — saqlamaydi.
- Tekshiruv: orphan-events.listener.ts:92-98 handleKanbanTaskMoved — faqat logger.log + `// TODO: notify`. Saqlamaydi/yubormaydi. Tasdiq.

## 18.52 — EP-NTF-052 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Тасдиқда' tasdiq-kutish signali?
- Doc Isbot: card.approvalWait yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.53 — EP-NTF-053 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ТТ to'liqsiz signali?
- Doc Isbot: tt.incomplete yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.54 — EP-NTF-054 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Korrektor xato → blok?
- Doc Isbot: corrector.block yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.55 — EP-NTF-055 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tasdiqsiz fayl signali?
- Doc Isbot: file.unapproved yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.56 — EP-NTF-056 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Og'zaki reja 'rasmiy emas' ogohlantirish?
- Doc Isbot: plan.notFormal yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.57 — EP-NTF-057 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Reja o'zgarishi → bog'liq bo'limga e'lon?
- Doc Isbot: plan.broadcast yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.58 — EP-NTF-058 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Analitik kommunikatsiya kanali?
- Doc Isbot: analytic.channel yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.59 — EP-NTF-059 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brak rol-cheklab yo'naltirish?
- Doc Isbot: defect.routeByRole yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.60 — EP-NTF-060 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Shikastlangan xom-ashyo + karantin?
- Doc Isbot: material.damaged yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.61 — EP-NTF-061 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Eslatma turlari belgilari (5 tur)?
- Doc Isbot: botlar emoji ishlatadi; notifications priority/type bor; 5-tur tasnif yo'q.
- Tekshiruv: director.bot.ts:50 emoji (✅⚠️❌); \d notifications — priority, type ustunlari bor. Tizimli 5-tur belgi yo'q. Tasdiq.

## 18.62 — EP-NTF-062 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Alert ustuvorlik 3 daraja?
- Doc Isbot: notifications.priority varchar bor; 3-darajali logika yo'q.
- Tekshiruv: \d notifications — priority character varying. Tartiblash logikasi yo'q. Tasdiq.

## 18.63 — EP-NTF-063 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Darhol' tunda o'tadimi (KRITIK istisno)?
- Doc Isbot: quiet.criticalException yo'q.
- Tekshiruv: quiet-hours logika yo'q (18.18). Tasdiq.

## 18.64 — EP-NTF-064 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Muddat eslatmasi ikki bosqich?
- Doc Isbot: deadline.twoStage yo'q.
- Tekshiruv: Muddat-taymer yo'q. Tasdiq.

## 18.65 — EP-NTF-065 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Departament umumlashtirilgan hisobot?
- Doc Isbot: report.aggregateVertical yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.66 — EP-NTF-066 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Mas'uliyat kartaga bog'lab yo'naltirish?
- Doc Isbot: notifications.user_id (xodimga) ishlatadi; recipient_card_id yo'q.
- Tekshiruv: \d notifications — user_id bor; `recipient_card_id` ustuni YO'Q (information_schema tasdiq). Tasdiq.

## 18.67 — EP-NTF-067 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Og'zaki o'tkazish taqiqi?
- Doc Isbot: responsibility.writtenOnly yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.68 — EP-NTF-068 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Oylik mas'uliyat digesti?
- Doc Isbot: monthly.responsibilityDigest yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.69 — EP-NTF-069 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Rasmiy ma'lumot talabi (muddat)?
- Doc Isbot: dataRequest.deadline yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.70 — EP-NTF-070 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Eski ma'lumot ogohlantirishi?
- Doc Isbot: staleData.warn (ntf_doc_views count=0) yo'q.
- Tekshiruv: `ntf_doc_views` jadvali **mavjud emas** (count=0 emas). doc_version kuzatuvi yo'q — xulosa to'g'ri.

## 18.71 — EP-NTF-071 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yig'ilish topshiriqlari eslatma?
- Doc Isbot: meeting.taskReminder yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.72 — EP-NTF-072 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Telefon-qo'ng'iroq qaydi?
- Doc Isbot: call.log yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.73 — EP-NTF-073 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Buyurtma tugamasdan reja o'zgarsa signal?
- Doc Isbot: plan.midOrderChange yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.74 — EP-NTF-074 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Kanban qotib qolgan kartochka signali?
- Doc Isbot: kanban.stuck (kanban_column_sla count=0) yo'q.
- Tekshiruv: `kanban_column_sla` jadvali **mavjud emas** (count=0 emas). SLA-cron CC-da bor (cc_documents). Xulosa to'g'ri.

## 18.75 — EP-NTF-075 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Buyurtma bajarilishi hisoboti?
- Doc Isbot: order.completionReport yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.76 — EP-NTF-076 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Bo'lim boshqaning vazifasiga aralashsa signal?
- Doc Isbot: scope.violation yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.77 — EP-NTF-077 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Adaptatsiya yakunini bot tasdiqlasinmi?
- Doc Isbot: adaptation.confirm yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.78 — EP-NTF-078 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Smenalararo topshirish bildirishnomasi?
- Doc Isbot: shift_handovers jadval mavjud; NTF avto-topshirish yo'q.
- Tekshiruv: `shift_handovers` jadvali MAVJUD (count=0). shift.handover scheduled NTF yo'q. Tasdiq.

## 18.79 — EP-NTF-079 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: refuted)
- Savol: 'Kim-nima-oladi' matritsasi (kanal xaritasi)?
- Doc Isbot: markaziy marshrut-matritsa jadval/UI yo'q (notification_schedules count=0); egasi-qaror.
- Tekshiruv: `notification_schedules` jadvali **mavjud emas**. Markaziy matritsa yo'q — egasi-data sifatida to'g'ri (qiymat+jadval egasidan).

## 18.80 — EP-NTF-080 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 'Ma'lumot yo'qolmaydi' immutable arxiv?
- Doc Isbot: notifications 3735 qator saqlanadi; immutable flag/DELETE-trigger yo'q.
- Tekshiruv: notifications count=3925 saqlanadi; `immutable` ustuni YO'Q (information_schema tasdiq), DELETE-trigger yo'q. Tasdiq.

## 18.81 — EP-NTF-081 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brak statistikasi haftalik digest bo'lim kesimida?
- Doc Isbot: defect.weeklyStats yo'q.
- Tekshiruv: Yo'q. Tasdiq.

## 18.82 — EP-NTF-082 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ko'rilmagan xabar qayta-yuborish?
- Doc Isbot: resend.schedule (BullMQ retry) yo'q.
- Tekshiruv: Qayta-yuborish jadval/cron yo'q — to'g'ri. (BullMQ kodbazada bor, NTF retry uchun ishlatilmaydi.)
