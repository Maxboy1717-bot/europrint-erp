# Modul 15 — Kanban / Vazifa — Mustaqil Tekshiruv

**Tekshiruvchi:** Adversarial verifier (jonli kod + DB)
**Sana:** 2026-06-27
**Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (satr 5692-6241)

## Jami

- Savollar: 137 (15.1 .. 15.137)
- Doc flag taqsimoti: ✅ bor = 3, 🟡 qisman = 34, ❌ yo'q = 100, 🔑 egasi-data = 0
- Mening qayta-bahom: bor = 3, qisman = 34, yoq = 100, egasi-data = 0 (doc bilan bir xil)
- CLAIM: confirmed = 136, refuted = 1 (kichik)
- claimedPct (doc sarlavhasi "vizyon 31%") vs realPct (formula bor=1/qisman=0.5/yoq=0) = **31% vs 15%**

> Eslatma: doc sarlavhasidagi "31%" o'z flaglariga mos kelmaydi: (3·1 + 34·0.5)/137 = 14.6% ≈ 15%.
> Hatto bor+qisman'ni to'liq "mavjud" deb sanasa ham 37/137 = 27%. Demak umumiy "31%" sarlavhasi
> biroz shishirilgan. LEKIN har bir savol bo'yicha Isbot da'volari deyarli butunlay rost va tekshiruvdan o'tdi.

## REFUTED CLAIMS (overstated/noto'g'ri)

- **15.119 (K34)** — Doc: "kanban_cards.priority ustuni (USER-DEFINED enum) bor". Reality: `\d kanban_cards`
  ko'rsatadi `priority | character varying(20)` — bu USER-DEFINED enum EMAS, oddiy varchar.
  Doc o'zining 15.27-savolida to'g'ri ("varchar ... erkin matn") degan; 15.119 esa "enum" deb xato yozgan.
  Status verdikti (qisman) o'zgarmaydi — faqat ustun tipi noto'g'ri tavsiflangan.

Boshqa barcha 136 savol bo'yicha Isbot dalillari (fayl:satr, jadval, ustun, endpoint) jonli tekshiruvda tasdiqlandi.

## Tekshiruv asoslari (jonli isbot)

- DB jadvallar: 23 ta kanban_* jadval mavjud (psql \dt). Jonli qatorlar: kanban_cards=2, kanban_columns=10,
  kanban_time_tracks=48, kanban_observers=4, kanban_co_executors=4, kanban_card_comments=0, kanban_card_watchers=0.
- kanban_columns jonli nomlari = test-axlat: board 1 = `as/salom/sALOM/SADSD/SDSD/SALOM`, board 2 =
  `Birinchi bosqich/Salom/savol/1231322` — kanonik 3-savat YO'Q (15.1/15.68/15.98 tasdiq).
- `\d kanban_cards` ustunlari: title, description, priority(varchar20), related_type/related_id,
  owner_user_id, assigner_user_id, due_date, parent_card_id, estimated_time, recurrence_pattern,
  telegram_message_id/telegram_chat_id, accepted_at/by, completed_at, completion_report, rating(smallint, CHECK 1-5).
  YO'Q: category, confidential/maxfiy, quantity/tiraj/progress, payment_balance, mention, visibility/scope, card_id (lavozim-karta).
- grep kanban moduli: escalat/wip/reopen/rollover/moveBack/category/confidential/mention/urgentLimit/autoObserver/
  fromDeficiency/probationDecision/mentorWatch = 0 natija (barcha tegishli "yo'q" da'volar tasdiq).
- @Cron kanban'da faqat 1 ta: kanban-recurring.cron.ts:23 `@Cron('0 7 * * *')` — eskalatsiya cron umuman yo'q.
- FE/BE personal-program/shaxsiy-dastur: find + grep = 0 natija (15.18-25, 15.58-59, 15.88-89, 15.116 "yo'q" tasdiq).

---

## Savol bo'yicha (asosiy struktur da'volar)

## 15.1 — Q1 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanbanColumns + sort_order = schema-kanban.ts:21-30 ✓ (aniq shu satrlar). Jonli data test-axlat ✓ (psql tasdiq).

## 15.2 — Q2 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Assigner-guard drizzle-kanban-cards.repo.ts:238-246 ✓ (completeCard ichida, bajaruvchi o'zi yakunlay olmaydi).
  Eslatma: guard faqat completeCard'da, acceptCard'da yo'q — doc "accept/complete" deyishi biroz keng, lekin cited satr to'g'ri.

## 15.3–15.17 — Q3..Q17 [DOC: ko'pi yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- moveBack/reopen/wip/escalation/rollover/category grep = 0 ✓. moveToColumn (kanban-task.aggregate.ts:79-85) faqat DONE tekshiradi ✓.
  createCardFlat (repo:172-196) muddatsiz/ijrochisiz karta, title default 'Yangi vazifa' (176) ✓.
  completeCard completionReport `?? null` ixtiyoriy (251) ✓.

## 15.9 — Q9 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban_time_tracks=48 qator ✓; accepted_at/completed_at ustun bor ✓; transition-log yo'q ✓.

## 15.14 — Q14 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban.handler.ts onTaskAssigned/onTaskDueSoon → telegramService.sendMessage (48) JONLI ✓; eskalatsiya-event yo'q ✓.

## 15.24 / 15.56 / 15.86 — recurring [DOC: qisman/yo'q] → [VERIFIED: qisman/yoq] (CLAIM: confirmed)
- kanban-recurring.cron.ts:23 @Cron 07:00, completed+recurrence_pattern kartani qayta yaratadi ✓; НО-3 17:30 maxsus yo'q ✓.

## 15.27 — Q27 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- priority varchar(20) default 'normal' schema-kanban.ts:38 ✓; Telegram emoji HIGH/MEDIUM/LOW handler:31-36 ✓; enum standart yo'q ✓.

## 15.30 — Q30 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- getAllCards ORDER BY kc.sort_order (kanban-cards.controller.ts:126) ✓; priority+due_date avtomat saralash yo'q ✓.

## 15.40 / 15.70 — Q40 [DOC: qisman/bor] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban_observers=4 ✓; GET/POST/DELETE cards/:id/observers (controller:294-314) JONLI ✓; rol-guard yo'q (read-cheklov kod darajasida yo'q) ✓.

## 15.41/15.71, 15.42/15.72, 15.43/15.73, 15.44/15.74, 15.45/15.75, 15.46/15.76 — kuzatuvchi
- addObserver endpoint (300) RBAC yo'q ✓; kanban_notifications status_changed accept/complete (repo:212,259) ✓ lekin selektiv filtr yo'q ✓;
  autoObserver grep=0 ✓; max-5 limit yo'q ✓; confidential ustuni yo'q (psql) ✓; mention ustuni yo'q (kanban_card_comments=id/card_id/user_id/content/created_at) ✓.

## 15.48 / 15.78 — Q48 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- owner_user_id + kanban_co_executors + kanban_observers jadval ✓; co-executor endpoint controller:318-338 JONLI ✓. Egasi vizyoniga mos.

## 15.49/15.79 — Q49 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- assignCard owner_user_id'ni almashtiradi (controller:165-180) ✓; sabab/X→Y tarix yo'q ✓.

## 15.50/15.80 — Q50 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban_checklists+kanban_checklist_items jadval ✓; checklist controller CRUD+toggle (37-104) JONLI ✓; "hammasi belgilanmaguncha" gate completeCard'da yo'q ✓.

## 15.51/15.81 — Q51 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- related_type/related_id schema-kanban.ts:39-40 ✓; OrderCreatedKanbanHandler ✓; jonli related_type=null (psql) ✓.

## 15.52/15.82, 15.104 — bekor [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- moveOrderCardToCancelled (kanban-cards.repo.ts:217) kartani 'bekor/cancel' ustuniga ilike bilan ko'chiradi + note ✓; alohida status-enum + majburiy sabab yo'q ✓.

## 15.53/15.83 — Q53 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban_files + kanban_result_files + task_chat_message_files jadval mavjud (psql to_regclass) ✓; fayl endpointlar JONLI ✓; ovozli izoh maxsus yo'q ✓.

## 15.54/15.84 — Q54 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- getAllCards LIMIT 500 (controller:119-128) scope-filtr yo'q ✓; @Roles employee hammasini ko'radi ✓.

## 15.55/15.85 — Q55 [DOC: qisman/yo'q] → [VERIFIED: qisman/yoq] (CLAIM: confirmed)
- telegram_message_id/telegram_chat_id ustun bor lekin null (psql) ✓; inbound bot-command handler yo'q ✓.

## 15.62/15.92 — K7 [DOC: qisman/yo'q] → [VERIFIED: qisman/yoq] (CLAIM: confirmed)
- task_templates + kanban_templates jadval ✓; createFlow assignmentType='round_robin' (kanban-core.controller.ts:55-61, flows-robots.repo:46) ✓; НО-rol master-mapping yo'q ✓. Seed = generik shablon (Bosim/Dizayn/Mijoz), НО-1/РД-4/ТХ yo'q ✓.

## 15.63/15.93 — K8 [DOC: qisman/yo'q] → [VERIFIED: qisman/yoq] (CLAIM: confirmed)
- estimated_time + target_minutes/duration_minutes schema-kanban.ts:140-141 ✓; vazifa-turi norma master-data + solishtirish yo'q ✓.

## 15.67/15.97 — K12 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- OrderCreatedKanbanHandler.handle → createKanbanForOrder (handler:29-35) ✓; cards=2, related_type=null, ustun=axlat-nom ✓.

## 15.102 — K17 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- kanban_co_executors jadval+endpoint ✓; hissa-ulush % maydoni va GSD ulanish yo'q ✓.

## 15.119 — K34 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: **refuted** — kichik)
- priority ustuni BOR, lekin "USER-DEFINED enum" XATO: psql `priority | character varying(20)`. Bu varchar, enum emas.
  RBAC 'faqat boshliq' + kunlik shoshilinch-limit yo'q ✓ (status to'g'ri, faqat tip noto'g'ri tavsiflangan).

## 15.123 — K38 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- rating ustun (smallint, CHECK 1-5) + PUT cards/:id/rating (controller:135-146) JONLI ✓; jonli rating=4 (card 2, psql) ✓; GSD/KPI o'rtacha ulanish yo'q ✓.

## 15.134 — K49 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- time-entries start/stop (kanban-card-files.controller.ts:214-235) JONLI ✓; kanban_time_tracks=48 ✓; norma-vaqt taqqoslash yo'q ✓.

## 15.105 — K20 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- overdue faqat read-hisobot: drizzle-kanban-stats.repo.ts:37 COUNT FILTER ... overdue_tasks ✓; aktiv eskalatsiya/xabar cron yo'q ✓.

## 15.6,15.7,15.8,15.10–15.13,15.15–15.23,15.25,15.26,15.28,15.29,15.31–15.39,15.43–15.47,15.57–15.61,15.64–15.66,15.68,15.69,15.72–15.77,15.86–15.101,15.103,15.106–15.118,15.120,15.122,15.124–15.133,15.135–15.137 — [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Barcha "yo'q" da'volari grep/psql/find bilan tasdiqlandi: tegishli ustun/jadval/cron/endpoint/listener jonli kodda mavjud emas
  (category, confidential, quantity/progress, payment_balance, mention, visibility/scope, card_id lavozim-karta, escalation cron,
  rollover, personal program, vacation-handover, dependency-gate, brak→rework, station-operator master-data, plan-fakt — hammasi YO'Q).

---

**Xulosa:** Bu modul hujjati g'ayrioddiy darajada halol. 137 savoldan 136 tasi to'liq tasdiqlandi;
faqat 15.119 da kichik tip-tavsifi xatosi (varchar'ni "enum" deb atash). Sarlavhadagi umumiy "31%"
o'z flaglariga (≈15%) nisbatan biroz yuqori, lekin har bir savol bo'yicha Isbot dalillari rost.
