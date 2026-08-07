# Kanban / Vazifalar — Yagona Vizyon Registri (EP-KANBAN) — 2026-08-07


> **Manbalar:** `decisions/15-kanban.md` (137 qaror: v1 30 + v2-generic 55 + v2-kitob-grounded 52) · `FULL-ITEM-LEVEL [Module-15]` (187 sarlavha = QISM A 50 + QISM C 69 + `#70..#137` 68; 30 tasi takrorlangan → 157 aniq item) · `FULL-VISION-EXTRACTION` QISM A (Kanban 50 qaror jadvali, 1113–1181) + QISM C (4109–4355) + QISM D (V/VERIFY §15, 5576–5633) · `vision-1000-answers/15-kanban.md` (50 tavsiya-javob) · ShVB YO'NALISH 19 (3-savat) + 20 (Персональная программа) · `Производство 2026.xlsx` + `Заявка бумаги.xlsx` + kitob (НО-1/НО-2/НО-3, РД-4, ТХ, Оргполитика, Инспекция) · `EUROPRINT_BARCHA_JAVOBLAR.md` Q134
> **Holat sanasi:** qurilish-holati asosan 2026-07-11 `FULL-ITEM-LEVEL` tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida kod tegan bandlar qayta tekshirildi (`Δ` qatorida belgilangan). ⚠️ **Ushbu modulda 2026-07-11 audit IKKI YO'NALISHDA eskirgan:** (a) 2026-07-11 dan **keyin** 20 ta Kanban commit'i HEAD'ga kirdi (`7535e2ae`…`d74a12db`); (b) undan ham jiddiyroq — 2026-07-10 da **auditdan bir kun oldin** 6 ta commit (`b63b5b6f`, `84195e55`, `463e3252`, `9965fda8`, `d8d59973`, `e8156412`) kirgan bo'lsa ham, audit ularni "grep → 0 matches" deb hisobga olmagan (hammasi `git merge-base --is-ancestor … HEAD` bilan tasdiqlandi). Batafsil: **III QISM §3**.

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-KANBAN-001..137)** | **137** |
| **Qaror holati:** ✅ javoblangan | 5 |
| **Qaror holati:** 🔵 ochiq | 132 |
| **Qurilish:** Ha | 10 |
| **Qurilish:** Qisman | 57 |
| **Qurilish:** Yo'q | 67 |
| **Qurilish:** STALE-DOC | 3 |
| Dalil: `FULL-ITEM-LEVEL` da **bevosita** mos item topilmadi (jonli koddan aniqlandi) | 21 |
| Xoch-havola umuman topilmadi (`— (mos item topilmadi)`) | 1 (EP-KANBAN-021) |
| Xoch-havola `(taxminiy)` bilan belgilangan | 14 |
| II QISM (`VR-KANBAN-*`) | 8 |
| 2026-07-11 dan beri o'zgargan yoki audit-da'vosi rad etilgan (Δ) | 56 |
| ⚠️ Manbalar orasida ziddiyat | 20 |

> **Eslatma (qamrov teshigi):** bu fayl **I QISM** — 137 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-KANBAN-"` → **137**). Lekin `FULL-ITEM-LEVEL [Module-15]` **EP-KANBAN-001..030**
> (v1-Q1..Q30, yuqori-daraja savollar) uchun bironta ham item yaratmagan — QISM C `#1` v2-Q1 dan
> boshlanadi. Shu **30 band** uchun qurilish holati 2026-08-07 da **jonli koddan** aniqlandi va
> `(2026-08-07, jonli tekshiruv)` deb belgilandi. Ulardan **9 tasi** (EP-KANBAN-022/023/025/026/027/028/029/030
> va qisman 024) mavzu bo'yicha v2/kitob item'lariga ulandi (`(taxminiy)` bilan), qolgan **21 band**
> `Dalil (kod)` qatorida "— (FULL-ITEM-LEVEL da mos item topilmadi)" deb belgilandi va faqat jonli kodga
> tayanadi; **EP-KANBAN-021** (shaxsiy eslatma) uchun umuman hech qanday xoch-havola topilmadi
> (`— (mos item topilmadi)`). Xuddi shu qamrov teshigi QC/PP/WMS modullarida ham chiqqan.

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-KANBAN-059 (kunlik 2 ta "Shoshilinch"
> limiti) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi limitni tasdiqlamagan), lekin qurilish bo'yicha **Ha** —
> `KANBAN_MAX_URGENT_PER_DAY = 2` `business.constants.ts` da va `kanban-boards.service.ts:381` da
> majburlanadi. Teskarisi ham bor: EP-KANBAN-008 (rollover) qaror bo'yicha ✅ **JAVOBLANGAN** (ShVB Y20
> build-prompt), qurilish **Yo'q** (`grep -rli rollover apps/api/src/modules/kanban` → 0 fayl).

> **Eslatma (mapping):** `FULL-ITEM-LEVEL [Module-15]` uchta agent tomonidan uchta raqamlash bilan yozilgan:
> **Item A1..A50** = `vision-1000-answers/15-kanban.md #1..#50` (kesishuvchi qarorlar → mavzu bo'yicha EP bandga
> ulanadi, `(taxminiy)` bilan belgilanadi); **Item C1..C69** = `TASDIQ-2146 §15 #1..#69`, ya'ni
> **C_N = EP-KANBAN-(030+N)**; **Item #70..#137** = `TASDIQ-2146 §15 #70..#137`, ya'ni **#N = EP-KANBAN-N**.
> Ikki agent qamrovi **EP-KANBAN-070..099** da ustma-ust tushgan (C40..C69 ↔ #70..#99 = **30 ta takror item**),
> va 8 tasida ikki agent **qarama-qarshi xulosa** chiqargan. To'liq jadval: **III QISM §1**.

> **Eslatma (sanoq tekshiruvi):** `decisions/15-kanban.md` ning o'z Xulosa jadvali "javoblangan **9** /
> ochiq **128**" deydi — band-ma-band qayta sanaldi: `grep -c "Holat:\*\* ✅ JAVOBLANGAN"` → **5**,
> `grep -c "Holat:\*\* 🔵 OCHIQ"` → **132**. ⚠️ **FARQ BOR** (5 ≠ 9). Batafsil: **III QISM §2**.

---

## I QISM — EP-kodli qarorlar (EP-KANBAN-001..137)

### EP-KANBAN-001 · 3-savat qaysi modulda yashaydi (v1-Q1)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — 3-savat = har xodimning shaxsiy "ish stoli", Kanban taxtalari uning ichidan ochiladi (yagona kirish nuqtasi). ⚠️ Texnik: savat MA'LUMOTI CC `basket_state`'da, Kanban shu ustidan birlashgan ko'rinish beradi.
- **Manba:** A-default; ShVB Y19; CC `cc-baskets.repo.ts` (mavjud infratuzilma)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `artifacts/erp-dashboard/src/components/kanban/ThreeBasketsPanel.tsx` — Kanban taxtasida CC savat-hisoblagichlarini `/api/cc/baskets/summary` dan **jonli** oladi (30 s refetch), lekin o'z izohida "Read-only by design: the full document workflow (open / move / PIN) lives in the Coordination CC". `Item A1` (kesishuvchi): `cc-kanban-bridge.service.ts` CC-hujjat→kanban karta bir tomonlama ko'prik; `/api/basket/unified` endpoint kodda YO'Q.
- **Nima yetishmaydi:** Kanban savat uchun faqat **o'qish-vidjeti** — "yagona kirish nuqtasi" emas; `/api/basket/unified` yo'q; `kanban_tasks.basket_type` ↔ `cc_documents.basket_state` sinxron-eventi qurilmagan (ikki dunyo riski saqlanmoqda).
- **Bog'liqlik:** EP-KANBAN-002..006 (savat oqimi), VR-KANBAN-I05
- **action:** READ (`basket.unifiedDesktop`)
- **⤳ Ta'sir:** Communication Center (savat manbasi), Org (xodim ish stoli)
- **Xoch-havolalar:** `[Module-15] Item A1` *(taxminiy)* · `EXTRACTION QISM A #1` · `QISM D #1`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-002 · Savatga nima tushadi (v1-Q2)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — hammasi: menga tegishli har qanday vazifa, doklad, rasporyajenie, tasdiq so'rovi, @belgilash, eslatma → bitta Kiruvchi savat.
- **Manba:** A-default; ShVB Y19
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban.module.ts:51-63` da **7 ta** event-handler ro'yxatdan o'tgan — `OrderCreatedKanbanHandler`, `OrderCancelledKanbanHandler`, `OrderStatusChangedKanbanHandler`, `QcFailedKanbanHandler`, `MesCompletedKanbanHandler`, `MesBreakdownKanbanHandler`, `DesignRequestedKanbanHandler`; qo'shimcha `cc-kanban-bridge.service.ts` CC-hujjatdan karta yaratadi; `@mention` fan-out `drizzle-kanban-cards.repo.ts:202-215`.
- **Nima yetishmaydi:** manbalar ko'p, lekin **birlashgan "Kiruvchi savat" ko'rinishi yo'q** — kartalar to'g'ridan-to'g'ri taxta ustunlariga tushadi; rasporyajenie/tasdiq-so'rovi/eslatma turlari alohida savat-tipi sifatida ajratilmagan.
- **Bog'liqlik:** EP-KANBAN-001, EP-KANBAN-024, EP-KANBAN-125
- **action:** EVENT (`basket.inboxRoute`)
- **⤳ Ta'sir:** Coordination (doklad/rasporyajenie), CC, NTF
- **Xoch-havolalar:** `[Module-15] Item A1` *(taxminiy)* · `EXTRACTION QISM A #1` · `QISM D #1`
- **Δ 2026-07-11→08-07:** `34ceed0f` (07-13) QC/MES/Design → Kanban avto-karta triggerlari + `5093fe43` (08-04) MES uskuna-nosozligida avto-karta — kartaga kiruvchi manbalar 3 tadan **7 taga** oshdi.

### EP-KANBAN-003 · 24 soat qoidasi qanday ishlaydi (v1-Q3)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — 24 soatda qizil belgi + egasiga eslatma, 48 soatda boshliqqa eskalatsiya (bosqichli bosim). Cron MAVJUD.
- **Manba:** ShVB Y19 ("Cron: kuniga bir marta 24 soatdan oshgan INCOMING uchun egasiga eslatma"); CC `cc-sla.cron.ts` (24h/48h SLA LIVE)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban-cron.processor.ts` (BullMQ `kanban-cron` navbati) uchta job bajaradi — `OVERDUE_ESCALATION` (kunlik), `RECURRING_CARDS`, va **`TT_SLA_ESCALATION`** (har 30 daqiqa): effektiv SLA zanjiri `kanban_cards.sla_hours` → `taxonomy_entries.attrs->>'sla_hours'` (`category='kanban_task_type'`) → `business_settings 'kanban.tt_task_sla_hours_default'` (default 24, CRUD-sozlanadigan). CC tomonda `cc-sla.cron.ts` 24h/48h hamon LIVE.
- **Nima yetishmaydi:** **48 soatlik ikkinchi bosqich (boshliqqa eskalatsiya) Kanban tomonda yo'q** — `TT_SLA_ESCALATION` bitta 24h chegara bilan cheklangan; "qizil belgi" FE ko'rsatkichi kartaga bog'lanmagan.
- **Bog'liqlik:** EP-KANBAN-004 (ish vaqti), EP-KANBAN-040/042/043 (eskalatsiya zanjiri)
- **action:** CRON (`basket.overdue.escalate`)
- **⤳ Ta'sir:** Org (manager_id zanjiri), NTF
- **Xoch-havolalar:** `[Module-15] Item A50` *(taxminiy)* · `EXTRACTION QISM A #50` · `QISM D #50`
- **Δ 2026-07-11→08-07:** `50456109` (07-13) — TT-turi kartalar uchun CC-parity 24h SLA eskalatsiyasi qo'shildi (`business_settings` orqali CRUD-sozlanadigan, chatda raqam so'ralmagan); `c14bc029` (07-13) — cron `@nestjs/schedule` dan **BullMQ repeatable job**'ga ko'chdi (Redis'da saqlanadi, server tushsa jadval yo'qolmaydi).

### EP-KANBAN-004 · 24 soat ish vaqtimi yoki astronomik (v1-Q4)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — faqat ish soatlari + ish kunlari (kalendar + smena jadvali) — adolatli. ⚠️ smena jadvali bog'liqligi (HR) kerak.
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban-cron.processor.ts` `OVERDUE_ESCALATION` — `substring(due_date,1,10)::date < CURRENT_DATE`; `TT_SLA_ESCALATION` — `created_at + (effective_sla_hours || ' hours')::interval < NOW()`. Ikkalasi ham **astronomik**; smena-kalendar/bayram hisobi yo'q (`grep -rniE "WORK_DAY_CALENDAR" apps/api/src` → 0 — `Item A40`).
- **Nima yetishmaydi:** ish-soati/ish-kuni hisobi umuman yo'q; MES smena jadvali va HR bayram kalendari bilan bog'lanish qurilmagan.
- **Bog'liqlik:** EP-KANBAN-041 (bir xil talab, v2-Q11), EP-KANBAN-067, VR-KANBAN-I01
- **action:** CRON (`basket.overdue.workhours`)
- **⤳ Ta'sir:** HR (smena jadvali), Ishlab chiqarish (3 smena)
- **Xoch-havolalar:** `[Module-15] Item A40` *(taxminiy)* · `[Module-15] Item C11` · `EXTRACTION QISM A #40` · `QISM D #40`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-005 · "Kutilmoqda" savatining ma'nosi (v1-Q5)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — "men boshqadan javob/natija kutyapman" (kim kutilayotgani + muddat ko'rsatiladi → to'siqni ochib beradi).
- **Manba:** A-default; CC `basket_state='pending'` (mavjud)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: CC tomonda `basket_state='pending'` va `cc-baskets.repo.ts`/`cc-baskets.service.ts` LIVE; `ThreeBasketsPanel.tsx` uni `pending` hisoblagichi sifatida ko'rsatadi. Kanban kartasida "kim kutilmoqda + muddat" maydonlari yo'q (`kanban_cards` ustun ro'yxatida `blocked_by`/`waiting_on` yo'q — `Item #122`).
- **Nima yetishmaydi:** "kim kutilayotgani + muddat" ko'rsatilmaydi — savat faqat sanoq; to'siqni ochish (blocker) semantikasi qurilmagan.
- **Bog'liqlik:** EP-KANBAN-122 (`blocked_by`), EP-KANBAN-001
- **action:** UPDATE (`basket.moveToPending`)
- **⤳ Ta'sir:** CC, Coordination
- **Xoch-havolalar:** `[Module-15] Item A1` *(taxminiy)* · `EXTRACTION QISM A #1` · `QISM D #1`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-006 · Chiquvchidan keyin nima bo'ladi (arxiv) (v1-Q6)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — 24 soatdan keyin avtomat arxivga, lekin Tarix/Arxiv bo'limidan doim qidirib topiladi (toza savat + saqlangan tarix).
- **Manba:** A-default; CC harakat-tarixi jadvali (mavjud)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban-cron.processor.ts` faqat 3 job qayd qiladi (`OVERDUE_ESCALATION`/`RECURRING_CARDS`/`TT_SLA_ESCALATION`) — **arxivlash job'i yo'q**. Kanban tomonda arxiv = `deleteCard` yumshoq-o'chirish (`kanban-cards.repo.ts:115-123`), avtomat emas.
- **Nima yetishmaydi:** 24h avto-arxiv cron'i, arxiv/tarix qidiruv ekrani (Kanban tomonda) yo'q.
- **Bog'liqlik:** EP-KANBAN-069 (avto-yopish), EP-KANBAN-131 (arxivdan naqsh)
- **action:** CRON (`basket.outbox.archive`)
- **⤳ Ta'sir:** CC, Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item A1` *(taxminiy)* · `EXTRACTION QISM A #1`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-007 · Shaxsiy dastur — kunlik soatlik ko'rinish (v1-Q7)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — kunlik soatlik grid (09:00…18:00) + har vazifaga vaqt (to'liq ShVB modeli). Build-prompt mavjud.
- **Manba:** ShVB Y20 ("PersonalProgram.tsx: Kunlik dastur — soat bo'yicha grid")
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: FE `artifacts/erp-dashboard/src/pages/kanban/MyPlanView.tsx` mavjud, lekin kartalarni **bugun / shu hafta / keyinroq** guruhlariga ajratadi (`isToday`/`isThisWeek`) — **soatlik grid EMAS**. BE tomonda `grep -rli "personal.program|personalProgram|personal_program" apps/api/src` → **0 fayl** (`Item C18`/`#88` bilan mos).
- **Nima yetishmaydi:** ⭐ **Shaxsiy dastur BE moduli umuman yo'q** — soat-blok (08:00–09:00…), reja/fakt, kun-yopilishi, tasdiq oqimi hech biri qurilmagan; `MyPlanView` faqat Kanban kartalarining muddat bo'yicha guruhlanishi.
- **Bog'liqlik:** EP-KANBAN-048..055 (butun shaxsiy dastur klasteri), EP-KANBAN-088/089, EP-KANBAN-116
- **action:** CREATE (`personalProgram.daily`)
- **⤳ Ta'sir:** HR (kunlik reja), Hisobotlar (reja vs fakt)
- **Xoch-havolalar:** `[Module-15] Item C18` · `[Module-15] Item #88` · `TASDIQ-2146 §15 #18`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-008 · Rollover (bajarilmagan vazifa ertangi kunga) (v1-Q8)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — avtomat ertangi kunga ko'chadi + "necha marta ko'chgan" sanagich (surunkali kechikish ko'rinadi). Rollover mantig'i build-prompt'da.
- **Manba:** ShVB Y20 (`rolledOverFrom` maydon + "rollover: bajarilmagan task ertangi kunga o'tadi")
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `grep -rli "rollover" apps/api/src/modules/kanban --include=*.ts` → **0 fayl**; `kanban_cards` da `rolled_over`/`rolled_over_count` ustuni yo'q (`Item A5`/`C33`/`#99` sxema-dump'lari bilan mos).
- **Nima yetishmaydi:** rollover mexanizmi butunlay yo'q — ustun ham, cron ham, `rolledOverFrom` maydoni ham.
- **Bog'liqlik:** EP-KANBAN-009, EP-KANBAN-063..069 (butun rollover klasteri), EP-KANBAN-052
- **action:** CRON (`personalProgram.rollover`)
- **⤳ Ta'sir:** Hisobotlar, HR
- **Xoch-havolalar:** `[Module-15] Item A5` *(taxminiy)* · `[Module-15] Item C33` · `EXTRACTION QISM A #5` · `QISM D #5`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-009 · Rollover necha martagacha (v1-Q9)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — 3 marta ko'chgach majburan boshliqqa ko'rinadi / "qayta rejalashtir" so'raydi (intizom).
- **Manba:** A-default; ShVB Y20 (rollover bor, chegara A-default)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: EP-KANBAN-008 ga bog'liq — rollover mexanizmi yo'q, sanagich ham yo'q (`Item C34`: `rolled_over_count` ustuni mavjud emas).
- **Nima yetishmaydi:** sanagich, 3-chegara signali, "qayta rejalashtir" so'rovi — hech biri yo'q.
- **Bog'liqlik:** EP-KANBAN-008 (ildiz), EP-KANBAN-064, EP-KANBAN-069
- **action:** CRON (`personalProgram.rollover.limit`)
- **⤳ Ta'sir:** HR, Org (boshliq)
- **Xoch-havolalar:** `[Module-15] Item C34` · `TASDIQ-2146 §15 #34`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-010 · Shaxsiy dastur ustuvorligi (rang kodi) (v1-Q10)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — 3 daraja: Yuqori=qizil, O'rta=sariq, Past=yashil (sodda, ShVB ga mos). Build-prompt'da aniq.
- **Manba:** ShVB Y20 ("Ustunlik rangi: Yuqori=qizil, O'rta=sariq, Past=yashil")
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `apps/api/src/modules/kanban/domain/kanban-priority.ts` (commit `7535e2ae`) — `KanbanPriorityTier` enum (SHOSHILINCH/ODDIY/PAST) + `KANBAN_PRIORITY_TIER_LABELS` + `priorityToVisionTier()` **additiv alias qatlami**; FE `kanban-types.ts` `PRIORITY_CONFIG` rang-xaritasi. DB `kanban_cards.priority` hamon 4 qiymatli `varchar` (`low/normal/high/urgent`).
- **Nima yetishmaydi:** DB darajasida hamon 4 qiymat — `normal` va `high` ikkisi ham "Oddiy"ga yig'iladi (fayl izohida aniq yozilgan); ShVB ning "Yuqori=qizil / O'rta=sariq / Past=yashil" nomlanishi bilan 1:1 emas.
- **Bog'liqlik:** EP-KANBAN-057 (bir xil talab, v2-Q27), EP-KANBAN-060, EP-KANBAN-119
- **action:** UPDATE (`task.priority.color`)
- **⤳ Ta'sir:** Butun Kanban UI
- **Xoch-havolalar:** `[Module-15] Item C27` · `TASDIQ-2146 §15 #27`
- **Δ 2026-07-11→08-07:** `7535e2ae` (07-11) — vizyon 3-daraja nomlash qatlami (`kanban-priority.ts`) qo'shildi; DB ustuni Q-39 non-regression sababli o'zgartirilmadi.

### EP-KANBAN-011 · Soat-blok (vaqt rejalashtirish) majburiymi (v1-Q11)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ixtiyoriy: yozsa kun-yuklamasi ko'rsatiladi, yozmasa oddiy ro'yxat (moslashuvchan).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban_cards.estimated_time` (integer) mavjud va create/update orqali qo'lda to'ldiriladi (`Item #93`); `kanban_time_tracks` (`durationMinutes`/`targetMinutes`) start/stop bilan jonli (`Item #134`). Kun-yuklamasi ko'rinishi FE'da `ResourceAllocationView.tsx` + `GET /api/kanban/resource-allocation` (`36630c78`).
- **Nima yetishmaydi:** "soat-blok" (kunning aniq soatiga biriktirish) tushunchasi yo'q — faqat davomiylik (`estimated_time`); shaxsiy dastur grid'i bo'lmagani uchun kun-yuklamasi xodim darajasida emas, resurs-hisobot darajasida ko'rsatiladi.
- **Bog'liqlik:** EP-KANBAN-007, EP-KANBAN-049, EP-KANBAN-134
- **action:** UPDATE (`task.estimateTime`)
- **⤳ Ta'sir:** Shaxsiy dastur, Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item #93` · `[Module-15] Item #134` · `TASDIQ-2146 §15 #93`
- **Δ 2026-07-11→08-07:** `36630c78` (07-13) — `GET /api/kanban/resource-allocation` endpoint'i qo'shildi (jonli DB-ma'lumot qaytaradi, 2026-08-06 auditida mustaqil tasdiqlangan).

### EP-KANBAN-012 · Vazifa kim tomonidan beriladi (v1-Q12)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — hamma yo'l: boshliq→bo'ysunuvchi, o'ziga, gorizontal (hamkasbga) — gorizontal so'rov qabul/rad qilinadi.
- **Manba:** A-default; Org gorizontal harakat (workflow_rules)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `PATCH cards/:id/assign` (`kanban-cards.controller.ts:187-202`) har qanday `owner_user_id` ga tayinlaydi; `assigner_user_id` alohida saqlanadi; `PUT cards/:id/reject` (`e8156412`, 07-10) sabab bilan topshiruvchiga qaytaradi; `bulkAssignCards` (`84195e55`, 07-10) ommaviy tayinlash.
- **Nima yetishmaydi:** `workflow_rules` (gorizontal harakat qoidalari) bilan bog'lanish yo'q — kim kimga bera olishini cheklovchi qoida qatlami yo'q; bo'limlararo uzatish (EP-KANBAN-023) qurilmagan.
- **Bog'liqlik:** EP-KANBAN-013 (qabul/rad), EP-KANBAN-023 (gorizontal), EP-KANBAN-118
- **action:** CREATE (`task.assign`)
- **⤳ Ta'sir:** Org (gorizontal), Coordination
- **Xoch-havolalar:** `[Module-15] Item #79` · `[Module-15] Item #118` · `TASDIQ-2146 §15 #79`
- **Δ 2026-07-11→08-07:** ⚠️ **Audit-da'vosi rad etildi:** `Item #118` (2026-07-11) "reject/return-to-sender endpoint'i yo'q" deydi, lekin `e8156412` **2026-07-10** da (auditdan bir kun oldin) HEAD'ga kirgan — `PUT cards/:id/reject` sabab bilan mavjud.

### EP-KANBAN-013 · Vazifani qabul qilish/rad etish (v1-Q13)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — ha: qabul/rad (rad sababi majburiy) qadami bor (aniq mas'uliyat).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `acceptCard` (`kanban-cards.controller.ts:204-213`, `accepted_at`/`accepted_by` ustunlari) + `PUT cards/:id/reject` (`kanban-cards.controller.ts:268-279`) — `rejectCard(id, userId, dto.reason)`, kommit izohi: "reject card returns task to assigner with reason" (`e8156412`, 2026-07-10, `merge-base --is-ancestor` bilan tasdiqlandi).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-KANBAN-118 (bir xil mexanizm, K33), EP-KANBAN-078
- **action:** APPROVE/REJECT (`task.accept`)
- **⤳ Ta'sir:** HR (mas'uliyat), NTF
- **Xoch-havolalar:** `[Module-15] Item #118` · `TASDIQ-2146 §15 #118`
- **⚠️ ZIDDIYAT:** `Item #118` (2026-07-11) "Full read of `kanban-cards.controller.ts` shows … no `reject`/`return-to-sender` endpoint exists anywhere in the controller" — bu **noto'g'ri**: `e8156412` 2026-07-10 da kirgan va endpoint hozir `kanban-cards.controller.ts:268` da.
- **Δ 2026-07-11→08-07:** Kod o'zgarmadi; **audit-da'vosi rad etildi** (yuqoridagi ziddiyat).

### EP-KANBAN-014 · Vazifa karta-modeliga bog'lanadimi (v1-Q14)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ha: vazifa ixtiyoriy ravishda lavozim-kartaga/GSD ga bog'lanadi, bajarilsa GSD ga avtomat hissa (karta-markazli vizyonga to'liq mos).
- **Manba:** A-default; karta-markazli model (`project_org_card_centric_model`)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban_cards` da faqat `owner_user_id` (to'g'ridan-to'g'ri user FK) — lavozim-karta (`card_id`/`position_card_id`) ustuni yo'q (`Item #108`/`#132`); `grep -rli "gsd" apps/api/src/modules/kanban` → **0 fayl** (`Item A8`/`#102`/`#123`).
- **Nima yetishmaydi:** karta-markazli indireksiya qatlami ham, GSD hissa-hisobi ham yo'q — bu loyiha-keng "karta-markaz" migratsiyasining bir qismi.
- **Bog'liqlik:** EP-KANBAN-108, EP-KANBAN-132, EP-KANBAN-102, VR-KANBAN-I02
- **action:** UPDATE (`task.linkCard`)
- **⤳ Ta'sir:** Org (KARTA/GSD), KPI
- **Xoch-havolalar:** `[Module-15] Item #108` · `[Module-15] Item #132` · `[Module-15] Item A8` *(taxminiy)* · `TASDIQ-2146 §15 #108` · `EXTRACTION QISM A #8` · `QISM D #8`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-015 · Taxta (board) tuzilishi (v1-Q15)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — standart 4 ustun (Reja / Jarayonda / Tekshiruvda / Bajarildi) hammaga, lekin bo'lim qo'sha oladi (tartib + moslashuv).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `apps/api/src/modules/kanban/domain/kanban-status.ts` — `KanbanStatus` enum (REJA/JARAYONDA/TEKSHIRUVDA/BAJARILDI) + `KANBAN_STATUS_ORDER` + `statusFromColumnName()`; fayl izohi: "`kanban_cards` has NO `status` column … stage is DERIVED from its column NAME". Ustun CRUD `kanban-boards.service.ts:78-105`. `Item C1`/`#98`: jonli `kanban_columns` qatorlari test-axlati (`as`, `salom`, `SADSD`, `1231322`).
- **Nima yetishmaydi:** kanonik 4 ustunli **seed yo'q** — jonli taxtalarda ustun nomlari test-axlati; "hammaga standart" qismi amalda ta'minlanmagan.
- **Bog'liqlik:** EP-KANBAN-031 (v2-Q1 3 savat — ziddiyat), EP-KANBAN-098, EP-KANBAN-025
- **action:** CREATE (`board.columns`)
- **⤳ Ta'sir:** Hamma bo'lim taxtalari
- **Xoch-havolalar:** `[Module-15] Item C1` · `[Module-15] Item #98` · `TASDIQ-2146 §15 #1`
- **⚠️ ZIDDIYAT:** v1-Q15 (EP-KANBAN-015) **4 ustun** (Reja/Jarayonda/Tekshiruvda/Bajarildi) deydi, v2-Q1 (EP-KANBAN-031) esa **3 savat** (Bajariladi/Jarayonda/Bajarildi). Kod v1 ni tanlagan (`kanban-status.ts` 4 bosqich). Egasi muvofiqlashtirsin.
- **Δ 2026-07-11→08-07:** `13239a1e` + `de867a08` (08-03) — SD-status ↔ kanban-ustun avto-ko'chirish xaritasi uchun ilova-ichi CRUD (`kanban_status_column_map`) qo'shildi.

### EP-KANBAN-016 · Taxta kimga tegishli (qamrov) (v1-Q16)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — uch tur: shaxsiy + bo'lim + loyiha taxta (keng qamrov).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban_boards` + `kanban_cards.project_id` + `GET/POST /projects` (`kanban-reports.controller.ts:267,280`); ko'rinish cheklovi `kanban-visibility.helper.ts` (`kanbanCardVisibilityPredicate` — o'zi / kuzatuvchi / hamijrochi / bo'lim-daraxti / bir xil bo'lim; `super_admin`+`director` cheklovsiz) — `Item C54`/`#84` bo'yicha **STALE-DOC** (2026-07-01 da tasdiqlangan).
- **Nima yetishmaydi:** taxta **turi** (shaxsiy/bo'lim/loyiha) sifatida ajratilmagan — `kanban_boards` da scope ustuni yo'q; qamrov faqat karta-darajasidagi ko'rinish-predikati orqali bilvosita ishlaydi.
- **Bog'liqlik:** EP-KANBAN-084 (bosqichli ko'rinish), VR-KANBAN-I05
- **action:** CREATE (`board.scope`)
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik (ko'rinish)
- **Xoch-havolalar:** `[Module-15] Item C54` · `[Module-15] Item #84` · `TASDIQ-2146 §15 #54`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-017 · Observer (kuzatuvchi) roli (v1-Q17)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ha: vazifaga ko'p kuzatuvchi, ular faqat o'qiydi + bildirishnoma oladi (o'zgartira olmaydi). ⚠️ `kanban_observers` jadval mavjud.
- **Manba:** A-default; `schema-kanban.ts` (kanban_observers)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `kanban-cards.controller.ts:316-336` — `GET/POST/DELETE cards/:id/observers`, `kanban_observers` jadvali (`schema-kanban.ts:199-204`), 4 jonli qator (`Item #70`). Bildirishnoma: `d8d59973` (07-10) "notify observers only on complete and overdue events".
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-KANBAN-070 (rol chegarasi), EP-KANBAN-072 (xabar filtri), EP-KANBAN-074
- **action:** CREATE (`task.addObserver`)
- **⤳ Ta'sir:** NTF, Org
- **Xoch-havolalar:** `[Module-15] Item #70` · `[Module-15] Item C40` · `TASDIQ-2146 §15 #70`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-018 · Observer kim bo'la oladi va avtomat qo'shiladimi (v1-Q18)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ikkalasi: qo'lda qo'shish + yuqori ustuvorlikdagi vazifaga boshliq avtomat kuzatuvchi.
- **Manba:** A-default; Org manager_id zanjiri
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: qo'lda qo'shish `POST cards/:id/observers` ishlaydi (EP-KANBAN-017); **avtomat** qo'shish yo'q — `Item #73`/`C43`: "no code path auto-inserts a manager_id-derived observer on card creation/assignment" (`org_departments.head_user_id` `kanban-visibility.helper.ts:60-66` da bor, lekin bu yerda qayta ishlatilmagan).
- **Nima yetishmaydi:** boshliqni avtomat kuzatuvchi qilish yo'lI yo'q; kim qo'sha olishi bo'yicha RBAC ham yo'q (`Item #71`).
- **Bog'liqlik:** EP-KANBAN-071, EP-KANBAN-073 (bir xil talab)
- **action:** EVENT (`task.autoObserver`)
- **⤳ Ta'sir:** Org-struktura
- **Xoch-havolalar:** `[Module-15] Item #73` · `[Module-15] Item C43` · `TASDIQ-2146 §15 #73`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-019 · Eslatma (reminder) turlari (v1-Q19)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ilova ichida + Telegram (egasi tanlaydi qaysi kanalda) — keng qamrov.
- **Manba:** A-default; ShVB Telegram asosiy kanal
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: ilova-ichi kanal ishlaydi — `kanban_notifications` + `notifications` INSERT (`drizzle-kanban-cards.repo.ts`, `kanban-cron.processor.ts`). Telegram: `apps/api/src/telegram/handlers/kanban.handler.ts` da `onTaskAssigned`/`onTaskDueSoon` mavjud, lekin **`grep -rn "onTaskDueSoon\|onTaskAssigned" apps/api/src` faqat ta'rif fayliniing o'zini qaytaradi — hech qayerdan CHAQIRILMAYDI** (o'lik kod / zero-listener).
- **Nima yetishmaydi:** ⭐ Telegram kanali amalda **ulanmagan** (metodlar chaqiruvchisiz); "egasi qaysi kanalni tanlaydi" sozlamasi (kanal-tanlov master-data) yo'q.
- **Bog'liqlik:** EP-KANBAN-020, EP-KANBAN-044 (eskalatsiya kanali), EP-KANBAN-085
- **action:** EVENT (`reminder.channel`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram), NTF
- **Xoch-havolalar:** `[Module-15] Item C14` · `[Module-15] Item #85` · `TASDIQ-2146 §15 #14`
- **⚠️ ZIDDIYAT:** `Item C14`/`QISM D #50` Telegram metodlarini "mavjud" deb sanaydi ("separate outbound Telegram methods exist in `kanban.handler.ts`"), lekin ular **hech qayerdan chaqirilmaydi** — jonli 2026-08-07 tekshiruvi bo'yicha bu funksional emas.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-020 · Eslatma qachon yuboriladi (v1-Q20)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — 3 holat: yangi vazifa keldi + muddatga 1 kun qoldi + muddat o'tdi (yetarli, shovqinsiz).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: **"muddat o'tdi"** ishlaydi — `kanban-cron.processor.ts` `OVERDUE_ESCALATION` (kunlik, `NOT EXISTS` dedup bilan) + `TT_SLA_ESCALATION` (24h). **"yangi vazifa keldi"** va **"1 kun qoldi"** uchun faqat o'lik Telegram metodlari bor (EP-KANBAN-019 dagi ziddiyat); ilova-ichi `notifications` faqat accept/complete/overdue hodisalarida yoziladi.
- **Nima yetishmaydi:** "yangi vazifa keldi" va "muddatga 1 kun qoldi" triggerlari amalda yo'q.
- **Bog'liqlik:** EP-KANBAN-019, EP-KANBAN-040, EP-KANBAN-072
- **action:** CRON (`reminder.trigger`)
- **⤳ Ta'sir:** NTF, AI Integratsiya
- **Xoch-havolalar:** `[Module-15] Item C10` · `[Module-15] Item #105` · `TASDIQ-2146 §15 #10`
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — `OVERDUE_ESCALATION` BullMQ ga ko'chdi; `50456109` (07-13) — 24h TT-SLA eskalatsiyasi qo'shildi.

### EP-KANBAN-021 · Shaxsiy eslatma (savatsiz) (v1-Q21)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ha: sana+vaqtli shaxsiy eslatma, faqat o'ziga ko'rinadi (to'liq ish stoli).
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da mos item topilmadi). Jonli 2026-08-07: `grep -rli "reminder" apps/api/src/modules/kanban --include=*.ts` → **0 fayl**. Kanban tomonda "eslatma" tushunchasi umuman yo'q — mavjud yagona vaqt-triggeri `kanban-cron.processor.ts` dagi muddat-o'tgan eskalatsiyasi (karta-bog'liq, shaxsiy emas).
- **Nima yetishmaydi:** shaxsiy (kartaga bog'lanmagan) eslatma jadvali, sana+vaqt tanlash, faqat-o'ziga ko'rinish — hech biri yo'q.
- **Bog'liqlik:** EP-KANBAN-019/020 (eslatma kanali va triggeri), EP-KANBAN-007 (shaxsiy dastur)
- **action:** CREATE (`reminder.personal`)
- **⤳ Ta'sir:** Shaxsiy dastur
- **Xoch-havolalar:** — (mos item topilmadi)
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-022 · Takrorlanuvchi vazifa (v1-Q22)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ha: kunlik/haftalik/oylik takror shabloni, belgilangan kunda avtomat shaxsiy dasturga tushadi (ritm).
- **Manba:** A-default; ShVB Y20 (odat ishlar)
- **Dalil (kod):** `Item C24`: "Read `apps/api/src/cron/kanban-recurring.cron.ts` in full — real, live `@Cron('0 7 * * *')` job regenerating `kanban_cards` from `recurrence_pattern`". **Δ jonli 2026-08-07:** cron BullMQ ga ko'chgan — `kanban-cron.processor.ts` `RECURRING_CARDS` job (07:00 Asia/Tashkent, repeatable), fayl izohi: "Ilgari: `apps/api/src/cron/kanban-recurring.cron.ts` (`@Cron('0 7 * * *')`)".
- **Nima yetishmaydi:** `Item C24`: "it does not feed into a daily 'dastur' (Personal Program, C18) because that module doesn't exist" — takror-karta generatori ishlaydi, lekin "shaxsiy dasturga tushishi" yarmi yo'q (EP-KANBAN-007 ga bog'liq).
- **Bog'liqlik:** EP-KANBAN-007 (shaxsiy dastur — ildiz), EP-KANBAN-054 (C24 — bir xil talab), EP-KANBAN-135 (ТХ takroriy)
- **action:** CRON (`task.recurring`)
- **⤳ Ta'sir:** HR (haftalik reja), Coordination
- **Xoch-havolalar:** `[Module-15] Item C24` · `TASDIQ-2146 §15 #24`
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — `RECURRING_CARDS` `@nestjs/schedule` dan **BullMQ repeatable job**'ga ko'chdi (server tushsa jadval Redis'da saqlanadi). Mantiq o'zgarmadi ("ko'chirilgan, o'zgarishsiz" izohi bilan).

### EP-KANBAN-023 · Vazifa bo'limlararo (gorizontal) o'tkazish (v1-Q23)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — boshqa bo'limga uzatilgan vazifa o'sha bo'lim boshlig'ining Kiruvchi savatiga tushadi + iz qoladi (kim kimga uzatdi) — shaffof.
- **Manba:** A-default; Org gorizontal harakat (workflow_rules)
- **Dalil (kod):** — (FULL-ITEM-LEVEL da bevosita mos item yo'q; eng yaqini `Item C49`/`#79` = qayta-tayinlash izi). Jonli 2026-08-07: `kanban-boards.controller.ts:54-55` izohi ochiq yozadi — "`departmentId` JS-filtri bu yerda ilgari mavjud edi, lekin **`kanban_boards` jadvalida `department_id` ustuni umuman yo'q**". Ya'ni taxta bo'limga bog'lanmagan → "boshqa bo'limga uzatish" tushunchasi sxema darajasida mavjud emas. `grep -rn "workflow_rules" apps/api/src/modules/kanban` → 0.
- **Nima yetishmaydi:** taxta↔bo'lim bog'lanishi, bo'limlararo uzatish amali, qabul qiluvchi bo'lim boshlig'ining savatiga marshrutlash, "kim kimga uzatdi" izi — hech biri yo'q.
- **Bog'liqlik:** EP-KANBAN-012 (kim beradi), EP-KANBAN-079 (C49 sabab+X→Y tarix), EP-KANBAN-016 (taxta qamrovi)
- **action:** UPDATE (`task.transferDept`)
- **⤳ Ta'sir:** Org (gorizontal), CC
- **Xoch-havolalar:** `[Module-15] Item C49` *(taxminiy)* · `[Module-15] Item #79` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-024 · Doklad / Rasporyajenie bilan bog'lanish (v1-Q24)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ha: rasporyajenie chiqarilsa, ijrochining Kiruvchi savatiga avtomat vazifa tug'iladi va bog'lanadi (qaror→ijro yopiq).
- **Manba:** A-default; Coordination doklad/rasporyajenie oqimi
- **Dalil (kod):** `Item A2`: "`grep -rliE \"RasporyajenieIssuedEvent\" apps/api/src` → **0 matches**. … A generic `kanban_flows`/`assignmentType: round_robin` mechanism exists (`drizzle-kanban-flows-robots.repo.ts:46`) but it is **not triggered by any rasporyajenie/decree event**." Jonli 2026-08-07: `grep -rlni "rasporyaj|raspory" apps/api/src/modules/kanban --include=*.ts` → **0 fayl** (tasdiqlandi). Qisman qoplama: `cc-kanban-bridge.service.ts` CC-hujjatdan karta yaratadi, lekin rasporyajenie tipiga xos emas.
- **Nima yetishmaydi:** `RasporyajenieIssuedEvent` tinglovchisi, qaror↔vazifa ikki tomonlama bog'lanishi, WIP=3 navbat tekshiruvi (`Item A2` "Code-buildable-now") — hech biri yo'q; hodisa payload-shartnomasi ham egasi tomonidan tasdiqlanmagan ("Owner-gated").
- **Bog'liqlik:** EP-KANBAN-002 (Kiruvchi savat), EP-KANBAN-001, EP-KANBAN-110 (Оргполитика shablon)
- **action:** EVENT (`task.fromRasporyajenie`)
- **⤳ Ta'sir:** Coordination, CC
- **Xoch-havolalar:** `[Module-15] Item A2` · `EXTRACTION QISM A #2` · `QISM D #2`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-025 · Vazifa statuslari ro'yxati (master-data) (v1-Q25)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq oqim: Yangi → Qabul qilindi → Jarayonda → Tekshiruvda → Bajarildi (+ Bekor/Rad) — aniq nazorat.
- **Manba:** A-default
- **Dalil (kod):** — (FULL-ITEM-LEVEL da bevosita mos item yo'q). Jonli 2026-08-07: `kanban-status.ts` — `KanbanStatus` enum **4 bosqich** (REJA/JARAYONDA/TEKSHIRUVDA/BAJARILDI), fayl izohi: "`kanban_cards` has NO `status` column … stage is DERIVED from its column NAME". Qabul/rad bosqichlari alohida ustunlar orqali bor (`accepted_at`/`accepted_by`, `reject` endpoint — EP-KANBAN-013). Bekor: `cancelCard` (`d2098c77`). **Δ:** `13239a1e` + `de867a08` (08-03) — `kanban_status_column_map` jadvali + ilova-ichi CRUD (`kanban-status-column-map.repo.ts`).
- **Nima yetishmaydi:** yagona **status master-data lug'ati** yo'q — statuslar uch joyda tarqoq (kod enum'i + ustun nomi + boolean ustunlar); "Yangi" va "Qabul qilindi" bosqich sifatida yo'q; egasi ERP ichida yangi status qo'sha olmaydi (faqat ustun nomini o'zgartirish orqali, bu esa enum-mos kelmasligiga olib keladi).
- **Bog'liqlik:** EP-KANBAN-015 (4 ustun ziddiyat), EP-KANBAN-031 (3 savat), EP-KANBAN-082/104 (Bekor qilindi)
- **action:** CREATE (`task.status.master`)
- **⤳ Ta'sir:** Hisobotlar, butun zavod
- **Xoch-havolalar:** `[Module-15] Item C1` *(taxminiy)* · `[Module-15] Item #98` *(taxminiy)*
- **⚠️ ZIDDIYAT:** v1-Q25 **5+2 status** (Yangi/Qabul qilindi/Jarayonda/Tekshiruvda/Bajarildi + Bekor/Rad) talab qiladi, kod esa **4** (`kanban-status.ts`), v2-Q1 (EP-KANBAN-031) esa **3 savat**. Uchta manba uchta boshqa ro'yxat beradi — egasi kanonik ro'yxatni tasdiqlasin.
- **Δ 2026-07-11→08-07:** `13239a1e` (08-03) — SD-status ↔ kanban-ustun avto-ko'chirish xaritasi uchun ilova-ichi CRUD qo'shildi (status↔ustun bog'lanishi endi ma'lumot, kod emas — lekin bu SD-statuslar uchun, Kanban o'z statuslari uchun emas).

### EP-KANBAN-026 · Vazifa muddati o'tganda (kechikish) kim ko'radi (v1-Q26)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — xodimga qizil + boshlig'iga "bo'ysunuvchingizda kechikkan ish bor" xabari (vertikal nazorat).
- **Manba:** A-default; Org manager_id zanjiri
- **Dalil (kod):** — (FULL-ITEM-LEVEL da bevosita mos item yo'q; qarang `Item C10`/`C12`/`#105`). Jonli 2026-08-07: `kanban-cron.processor.ts` `OVERDUE_ESCALATION` — kunlik 09:00, `substring(due_date,1,10)::date < CURRENT_DATE` bo'yicha kechikkanlarni topadi va `notifications` ga yozadi (`NOT EXISTS` dedup bilan); `GET /api/kanban/overdue-inbox` (`kanban-reports.controller.ts:257`) va `GET reports/overdue` (`:92`) hisobotlari bor.
- **Nima yetishmaydi:** eskalatsiya **`manager_id` zanjiriga ko'tarilmaydi** — xabar faqat karta egasiga boradi; "bo'ysunuvchingizda kechikkan ish bor" boshliq-xabari yo'q (`Item C12` bilan mos). FE tomonda "qizil" ko'rsatkichi kartaga bog'lanmagan.
- **Bog'liqlik:** EP-KANBAN-003 (24h qoida), EP-KANBAN-042 (C12 boshliqqa), EP-KANBAN-043 (C13 Tier-2)
- **action:** CRON (`task.overdue.escalate`)
- **⤳ Ta'sir:** Org, NTF
- **Xoch-havolalar:** `[Module-15] Item C10` *(taxminiy)* · `[Module-15] Item C12` *(taxminiy)* · `[Module-15] Item #105` *(taxminiy)*
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — BullMQ ga ko'chdi; `36630c78` (07-13) — `resource-allocation`, `d2098c77` — bekor qilingan kartalar KPI'da neytral.

### EP-KANBAN-027 · Bajarilgan ishni boshliq tasdiqlaydimi (v1-Q27)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — yuqori ustuvorlik/topshiriq vazifalari boshliq tasdig'i bilan yopiladi, oddiylari avtomat (balans).
- **Manba:** A-default
- **Dalil (kod):** `Item C2`: "Read `drizzle-kanban-cards.repo.ts:236-256` — `completeCard` has a **real assigner-only guard** (rejects the assignee completing their own card, returns FORBIDDEN)."
- **Nima yetishmaydi:** `Item C2`: "general column-to-column move has **no move-rights restriction at all**" — ya'ni ijrochi kartani "Bajarildi" ustuniga oddiy ko'chirish bilan o'tkazib yubora oladi. Bundan tashqari talabdagi **shartlilik** yo'q: guard **hamma** kartaga bir xil qo'llanadi, "yuqori ustuvorlik/topshiriq → tasdiq, oddiy → avtomat" farqlanishi qurilmagan.
- **Bog'liqlik:** EP-KANBAN-032 (C2 bir xil), EP-KANBAN-037 (yopish dalili), EP-KANBAN-123 (sifat-baho)
- **action:** APPROVE (`task.closeApproval`)
- **⤳ Ta'sir:** HR, Coordination
- **Xoch-havolalar:** `[Module-15] Item C2` · `TASDIQ-2146 §15 #2`
- **⚠️ ZIDDIYAT:** `completeCard` guard'i **doim** topshiruvchini talab qiladi, v1-Q27 esa "oddiylari avtomat" deydi. Kod qarordan **qattiqroq** — oddiy vazifani ham xodim o'zi yopa olmaydi. Egasi qaysi variant kanonikligini tasdiqlasin.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-028 · Kanban va shaxsiy dastur o'rtasida bog'liqlik (v1-Q28)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — avtomat: taxtadan menga tegishli vazifa shaxsiy dasturga ham tushadi, xodim vaqt belgilaydi (yagona ko'rinish).
- **Manba:** A-default; ShVB Y20 ("Kanban vazifalari avtomatik soatlarga taqsimlanadi")
- **Dalil (kod):** `Item C18`: "`grep -rliE \"personal.?program\" apps/api/src --include=*.ts` (repo-wide) → **0 files**." Jonli 2026-08-07 tasdiqlandi. FE'da `MyPlanView.tsx` bor, lekin u faqat Kanban kartalarini bugun/hafta/keyinroq guruhlaydi — soatlarga taqsimlash yo'q.
- **Nima yetishmaydi:** shaxsiy dastur moduli bo'lmagani uchun bog'lanishning **ikkala uchi** ham yo'q: avtomat tushirish hodisasi ham, soatga biriktirish ham.
- **Bog'liqlik:** EP-KANBAN-007 (ildiz), EP-KANBAN-048..055, EP-KANBAN-088/089
- **action:** EVENT (`task.toPersonalProgram`)
- **⤳ Ta'sir:** Shaxsiy dastur
- **Xoch-havolalar:** `[Module-15] Item C18` · `[Module-15] Item #88` · `TASDIQ-2146 §15 #18`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-029 · Vazifaga fayl/izoh biriktirish (v1-Q29)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07, jonli tekshiruv)*
- **Talab:** A — ha: fayl + izoh tasmasi (kim qachon yozdi) vazifa ichida (to'liq kontekst). ⚠️ card-files mavjud.
- **Manba:** A-default; `schema-kanban.ts` (card-files)
- **Dalil (kod):** `Item #83`: "`kanban-card-files.controller.ts:33-38` `ALLOWED_UPLOAD_EXT` includes image/doc types plus `.mp4/.webm/.ogg/.mp3/.wav`, and `task_chat_message_files` (chat attachments, `kanban-cards.controller.ts:252-284`) **is live**". Jonli 2026-08-07: `kanban-card-files.controller.ts` da `GET/POST cards/:id/files` (`:141`,`:147`) + `DELETE files/:fileId` (`:198`) + natija-fayllari (`results/:resultId/files`) marshrutlari bor; izoh tasmasi `drizzle-kanban-cards.repo.ts` `comments` (muallif + vaqt bilan).
- **Nima yetishmaydi:** — (talab darajasida to'liq; "ovozli izoh" alohida birinchi-darajali funksiya sifatida yo'q → bu EP-KANBAN-083 da hisobga olingan)
- **Bog'liqlik:** EP-KANBAN-083 (C53 ovozli izoh), EP-KANBAN-121 (blank/forma)
- **action:** CREATE (`task.attachment`)
- **⤳ Ta'sir:** Sifat, Ombor (saqlash)
- **Xoch-havolalar:** `[Module-15] Item C53` · `[Module-15] Item #83` · `TASDIQ-2146 §15 #53`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-030 · Kunlik/haftalik shaxsiy hisobot (v1-Q30)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ha: kunlik mini-yakun + haftalik "bajarildi/ko'chdi/kechikdi" hisoboti, GSD ga ulanadi (vizyonga mos).
- **Manba:** A-default; ShVB Y20
- **Dalil (kod):** `Item C20`: "Same as C18 — **no BE service found** (matches table's own 'faqat doc, kod yo'q')" — ya'ni reja/fakt/farq yo'q. Jonli 2026-08-07: umumiy hisobotlar mavjud — `kanban-reports.controller.ts` da `reports/employee-performance` (`:80`), `reports/productivity` (`:86`), `reports/overdue` (`:92`), `analytics/summary` (`:98`), `reports/export` (`:104`), `task-stats` (`:237`), `dashboard/team-metrics` (`:243`).
- **Nima yetishmaydi:** hisobotlar **jamoa/boshqaruv** darajasida, "shaxsiy kunlik mini-yakun" va "haftalik bajarildi/ko'chdi/kechikdi" kesimi yo'q; "ko'chdi" ustuni umuman hisoblanmaydi (rollover yo'q — EP-KANBAN-008); GSD ulanishi yo'q (`grep -rli "gsd" apps/api/src/modules/kanban` → 0 fayl).
- **Bog'liqlik:** EP-KANBAN-008 (ko'chdi), EP-KANBAN-014/102 (GSD), EP-KANBAN-050 (C20 reja/fakt)
- **action:** READ (`report.dailyWeekly`)
- **⤳ Ta'sir:** KPI/GSD, HR
- **Xoch-havolalar:** `[Module-15] Item C20` *(taxminiy)* · `TASDIQ-2146 §15 #20`
- **Δ 2026-07-11→08-07:** `20098312` (07-13) — `reports/export` PDF muvaffaqiyatsizligi endi soxta bo'sh fayl emas, real 500 qaytaradi (Q-40 «to'qima yo'q» tuzatmasi).

### EP-KANBAN-031 · Savatlar (ustunlar) ro'yxati va tartibi (v2-Q1)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 savat: "Bajariladi" → "Jarayonda" → "Bajarildi" (sodda, hamma tushunadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C1`: "board_id=1 columns are literally `as/salom/sALOM/SADSD/SDSD/SALOM` (test garbage); board_id=2 mixes `Birinchi bosqich/Salom/savol/1231322` with `Kiruvchi savat/Jarayonda/Bajarildi`. `kanban_columns`+`sort_order` schema is real (`schema-kanban.ts:21-30`)."
- **Nima yetishmaydi:** `Item C1`: "no canonical 3-column seed exists across boards — live data is test garbage". ⚠️ 2026-07-11 **FULL COMPANY RESET** dan keyin jonli qatorlar tozalangan — kanonik seed hamon yo'q, ya'ni ustunlar butunlay egasi qo'lida (bu ERP-ichi CRUD bo'yicha to'g'ri, lekin "butun fabrika bir xil" talabini ta'minlamaydi).
- **Bog'liqlik:** EP-KANBAN-015 (4 ustun — ziddiyat), EP-KANBAN-025 (status master), EP-KANBAN-098 (real bosqichlar)
- **action:** CREATE (`board.basketOrder`)
- **⤳ Ta'sir:** Butun Kanban
- **Xoch-havolalar:** `[Module-15] Item C1` · `[Module-15] Item #98` · `TASDIQ-2146 §15 #1`
- **⚠️ ZIDDIYAT:** v2-Q1 **3 savat** (Bajariladi/Jarayonda/Bajarildi) vs v1-Q15 (EP-KANBAN-015) **4 ustun** (Reja/Jarayonda/Tekshiruvda/Bajarildi). Kod `kanban-status.ts` da **4** ni tanlagan va `assertCanMoveTo()` shu 4 bosqichga tayanadi.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-032 · Oldinga o'tish (savatdan savatga) kim huquqli (v2-Q2)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — faqat mas'ul (ijrochi) suradi, "Bajarildi"ni boshliq tasdiqlaydi (nazorat saqlanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C2` (2026-07-11): "`completeCard` has a real assigner-only guard … Read `kanban-cards.repo.ts` `moveCard` (general column move) — **no actor-restriction of any kind**." **Δ jonli 2026-08-07: ikkinchi yarmi endi qurilgan** — `kanban-boards.service.ts:192-210` `moveCard` endi `assertCanMoveTo()` ni chaqiradi; izohi: "Moving INTO the terminal 'Bajarildi' stage is the CONFIRMATION step and **may only be performed by the assigner** (topshiruvchi), never by the assignee. The assignee can only move a card to 'Tekshiruvda'". Kod izohi bandning o'z kodini keltiradi: "(EP-KAN-027/032)".
- **Nima yetishmaydi:** talabning **birinchi** yarmi — "faqat mas'ul (ijrochi) suradi" — hamon yo'q: Reja↔Jarayonda↔Tekshiruvda o'tishlarini har qanday foydalanuvchi bajara oladi (kod izohi: "Reja / Tekshiruvda / unmapped custom columns stay freely movable (Q-39)").
- **Bog'liqlik:** EP-KANBAN-027 (bir xil mexanizm), EP-KANBAN-036 (C6 guard), EP-KANBAN-084 (ko'rinish)
- **action:** UPDATE (`task.moveBasket.permission`)
- **⤳ Ta'sir:** HR (intizom), Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C2` · `TASDIQ-2146 §15 #2`
- **Δ 2026-07-11→08-07:** ⭐ **Audit-da'vosi endi eskirgan** — `moveCard` ga assigner-confirm guard qo'shildi (`assertCanMoveTo`, `kanban-boards.service.ts:225-340`); `assigner_user_id` NULL bo'lgan eski kartalar Q-39 non-regression uchun erkin qoldirildi.

### EP-KANBAN-033 · Orqaga qaytarish qoidasi (Jarayonda → Bajariladi) (v2-Q3)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — mumkin, lekin sabab majburiy va tarixga yoziladi (shaffof).
- **Manba:** A-default
- **Dalil (kod):** `Item C3`: "`grep -rniE \"moveback|move_back\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**; no reason/history column found in `kanban_cards`." Jonli 2026-08-07: xuddi shu grep **hamon 0** (yagona urish — `drizzle-kanban-cards.repo.ts:112` dagi checklist "toggle-to-reopen" izohi, kartaga aloqasi yo'q).
- **Nima yetishmaydi:** `moveBack` endpoint'i, majburiy `sabab` maydoni va o'tish-tarixi jadvali — hech biri yo'q (`Item C3`: "Owner-gated — new table requires standard migration sign-off").
- **Bog'liqlik:** EP-KANBAN-039 (C9 o'tish tarixi — bir xil jadval kerak), EP-KANBAN-034 (C4 reopen), EP-KANBAN-079
- **action:** UPDATE (`task.moveBack`)
- **⤳ Ta'sir:** Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C3` · `TASDIQ-2146 §15 #3`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-034 · "Bajarildi"dan qaytarib ochish (qayta ochish) (v2-Q4)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — faqat boshliq qayta ochadi, sabab majburiy, "qayta ochildi" belgisi qoladi (javobgarlik aniq).
- **Manba:** A-default
- **Dalil (kod):** `Item C4`: "`grep -rniE \"reopen\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**; no `reopened_at`/`reopened_count` column in the full `kanban_cards` schema dump." Jonli 2026-08-07: grep faqat **bitta izoh qatorini** qaytaradi (`drizzle-kanban-cards.repo.ts:112` — checklist qadamini qayta ochish, karta emas) → xulosa o'zgarmadi.
- **Nima yetishmaydi:** boshliq-cheklovli `reopen` endpoint'i, majburiy sabab, `reopened_at`/`reopened_count` ustunlari va kartadagi "qayta ochildi" belgisi — hech biri yo'q.
- **Bog'liqlik:** EP-KANBAN-033 (C3), EP-KANBAN-027/032 (yopish huquqi), EP-KANBAN-039
- **action:** UPDATE (`task.reopen`)
- **⤳ Ta'sir:** Hisobotlar, HR
- **Xoch-havolalar:** `[Module-15] Item C4` · `TASDIQ-2146 §15 #4`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-035 · Bir savatdan ikkitasini o'tkazib yuborish (sakrash) (v2-Q5)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — sakrash taqiqlanadi, vazifa albatta "Jarayonda"dan o'tadi (vaqt o'lchanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C5`: "Read `kanban-cards.repo.ts` `moveCard` — it only does `UPDATE kanban_cards SET column_id=…, sort_order=…`, with **zero validation of source/target column adjacency**." Jonli 2026-08-07: `assertCanMoveTo()` endi mavjud, lekin u faqat **maqsad** ustunni tekshiradi (C6 ijrochi+muddat, WIP, assigner-confirm) — **manba↔maqsad ketma-ketligi** tekshirilmaydi; kod izohi buni bilvosita tasdiqlaydi: "Reja / Tekshiruvda / unmapped custom columns stay freely movable".
- **Nima yetishmaydi:** ketma-ket-ustun darvozasi (Rejadan to'g'ridan-to'g'ri Bajarildi'ga sakrashni bloklash) yo'q. ⚠️ Amalda C6+assigner guardlari **qisman** to'sqinlik qiladi (Bajarildi'ga faqat topshiruvchi o'tkaza oladi), lekin bu talabdan boshqa mexanizm.
- **Bog'liqlik:** EP-KANBAN-036 (C6), EP-KANBAN-032 (C2), EP-KANBAN-039 (vaqt o'lchash)
- **action:** UPDATE (`task.noSkip`)
- **⤳ Ta'sir:** Hisobotlar (bajarilish tezligi)
- **Xoch-havolalar:** `[Module-15] Item C5` · `TASDIQ-2146 §15 #5`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-036 · "Jarayonda" savatiga o'tish sharti (v2-Q6)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — ijrochi va muddat to'ldirilgan bo'lsa gina "Jarayonda"ga o'tadi (tartib).
- **Manba:** A-default
- **Dalil (kod):** `Item C6` (2026-07-11): "`KanbanCardCreateSchema` marks `assignedTo`/`dueDate` `.optional()`; `moveCard` has **no such check** either." **Δ jonli 2026-08-07: qurilgan** — `kanban-boards.service.ts:270-282`: `if (destStatus === KanbanStatus.JARAYONDA) { … if (!hasOwner || !hasDue) return Err(AppErr('VALIDATION', "\"Jarayonda\"ga o'tkazish uchun ijrochi (owner) va muddat (due_date) to'ldirilishi shart.")) }`. Kod izohi bandni to'g'ridan-to'g'ri keltiradi: "C6 (EP-KAN §15 #6)".
- **Nima yetishmaydi:** — (`assignedTo`/`dueDate` yaratishda hamon ixtiyoriy, lekin bu **ataylab**: darvoza yaratishda emas, "Jarayonda"ga kirishda qo'llanadi — talab aynan shuni so'ragan)
- **Bog'liqlik:** EP-KANBAN-032 (bir metodda), EP-KANBAN-038 (WIP shu darvozada), EP-KANBAN-107 (muddat majburiyligi)
- **action:** UPDATE (`task.startGuard`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C6` · `TASDIQ-2146 §15 #6`
- **Δ 2026-07-11→08-07:** ⭐ **Audit-da'vosi endi eskirgan** — C6 darvozasi `assertCanMoveTo()` ichida qurildi (Q-39 non-regression: faqat "Jarayonda" bosqichiga ta'sir qiladi, boshqa ustunlar erkin qoladi).

### EP-KANBAN-037 · "Bajarildi"ga o'tish sharti (yopish dalili) (v2-Q7)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — kamida bitta izoh majburiy; ba'zi turlarda rasm/fayl majburiy (dalilli). Sub-qaror: rasm/fayl Sifat/ta'mirlash turlarida majburiy (1-variant).
- **Manba:** A-default
- **Dalil (kod):** `Item C7`: "`CompleteCardSchema` — `completionReport` is `.optional()`; `completeCard` repo method (`drizzle-kanban-cards.repo.ts:236-281`) accepts it as optional with **no image-attachment requirement**." Jonli 2026-08-07 **tasdiqlandi**: `kanban-cards.controller.ts:58-60` — `const CompleteCardSchema = z.object({ completionReport: z.string().max(5000).optional() }).passthrough();`. Taqqoslash uchun `RejectCardSchema` (`:62-64`) sababni `min(1)` bilan **majburiy** qilgan — ya'ni naqsh mavjud, yopishda qo'llanmagan.
- **Nima yetishmaydi:** `completionReport` majburiy emas; kategoriyaga bog'liq (Sifat/ta'mir) rasm/fayl talabi yo'q; checklist darvozasi (EP-KANBAN-080) bilan bog'lanmagan.
- **Bog'liqlik:** EP-KANBAN-080 (C50 checklist), EP-KANBAN-029 (fayl biriktirish), EP-KANBAN-056 (C26 7 kategoriya)
- **action:** UPDATE (`task.closeGuard`)
- **⤳ Ta'sir:** Sifat nazorati
- **Xoch-havolalar:** `[Module-15] Item C7` · `TASDIQ-2146 §15 #7`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-038 · WIP chegarasi (bir paytda nechta "Jarayonda") (v2-Q8)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — bir paytda ko'pi bilan 3 ta "Jarayonda" (diqqat jamlanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C8`/`Item A6` (2026-07-11): "`grep -rniE \"\\bwip\\b\" apps/api/src --include=*.ts` (repo-wide) → **0 kanban-related hits**." **Δ jonli 2026-08-07: to'liq qurilgan** — `kanban-boards.service.ts:31` `KANBAN_WIP_LIMIT_JARAYONDA = 3`; `:283-330` har-ustun override (`kanban_columns.wip_limit`, NULL bo'lsa global 3 ga qaytadi), ustun CRUD orqali sozlanadi (`POST/PATCH /kanban/boards/:boardId/columns[/:columnId]`); supervisor roli chegarani oshib o'ta oladi va bu `kanban_wip_overrides` jadvaliga sabab bilan yoziladi (`qc_override_log` naqshiga mos). Xizmat qatlamida (`Item A6` talab qilgani kabi), repo'da emas.
- **Nima yetishmaydi:** — (chegara + override + log to'liq; sanoq `kanban_cards` ustun-bo'yicha, **xodim-bo'yicha emas** — "bir xodimda 3 ta" talqini uchun bu farq qiladi, lekin band matni "bir paytda 3 ta Jarayonda" deb ustun-darajasini nazarda tutadi)
- **Bog'liqlik:** EP-KANBAN-036 (bir darvozada), EP-KANBAN-024 (A2 WIP=3 navbat), EP-KANBAN-032
- **action:** UPDATE (`task.wipLimit`)
- **⤳ Ta'sir:** HR (intizom)
- **Xoch-havolalar:** `[Module-15] Item C8` · `[Module-15] Item A6` · `EXTRACTION QISM A #6` · `TASDIQ-2146 §15 #8`
- **Δ 2026-07-11→08-07:** ⭐ `2332345d` (07-13) — har-ustun WIP-limit override + supervisor bypass + `kanban_wip_overrides` audit-jadvali. Chegara **koddan emas, ustun CRUD'idan** keladi (chatda raqam so'ralmagan — ⭐ threshold-CRUD qoidasiga mos). **2026-07-11 audit-da'vosi ("0 hits") endi eskirgan.**

### EP-KANBAN-039 · O'tish vaqtini avtomatik yozib borish (v2-Q9)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har o'tish vaqti avtomatik yoziladi, qo'lda o'zgartirib bo'lmaydi (ishonchli tahlil).
- **Manba:** A-default
- **Dalil (kod):** `Item C9`: "`kanban_time_tracks` table exists (schema confirmed, start/stop endpoints wired in `kanban-card-files.controller.ts:208-236`) plus `accepted_at`/`completed_at` timestamps on `kanban_cards`; but `moveCard` writes **no generic column-transition history row** (no such table exists in the 24-table kanban list)."
- **Nima yetishmaydi:** `Item C9`: "per-column-transition history logging does not exist" — ya'ni "Reja→Jarayonda 10:15, Jarayonda→Tekshiruvda 14:40" tarixi yo'q; faqat 2 ta yakuniy vaqt-tamg'asi + qo'lda start/stop taymer bor (taymer **qo'lda** boshlanadi → "qo'lda o'zgartirib bo'lmaydi" talabiga qisman zid).
- **Bog'liqlik:** EP-KANBAN-033/034 (bir xil tarix-jadval kerak), EP-KANBAN-134 (norma-taqqos), EP-KANBAN-079
- **action:** EVENT (`task.transition.log`)
- **⤳ Ta'sir:** Hisobotlar, HR
- **Xoch-havolalar:** `[Module-15] Item C9` · `TASDIQ-2146 §15 #9`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-040 · Eskalatsiya sababi (nima bo'lsa ko'tariladi) (v2-Q10)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-08-07 Δ)*
- **Talab:** A — vazifa muddati o'tib 24 soat bo'lsa-yu hali "Bajarildi"ga o'tmagan bo'lsa (aniq va sodda).
- **Manba:** A-default; CC SLA cron (mavjud asos)
- **Dalil (kod):** `Item C10` **STALE-DOC**: "Read `kanban-overdue-escalation.cron.ts` in full — it is registered as a provider in `kanban.module.ts:36,74`, runs daily at 09:00, and notifies owner+assigner for `completed_at IS NULL AND due_date < today`. Its own docstring states 'Tekshiruv (2026-06-27): Kanban'da eskalatsiya cron'i UMUMAN YO'Q edi… Bu cron shu bo'shliqni yopadi'". `Item C10` xulosasi: "the table's 'Yo'q — kanban escalation cron yo'q (faqat MES/CC)' claim is **now factually outdated**". **Δ jonli 2026-08-07:** cron BullMQ'ga ko'chdi — `kanban-cron.processor.ts` `OVERDUE_ESCALATION` (09:00 Asia/Tashkent) + `TT_SLA_ESCALATION` (har 30 daqiqa, 24h chegarasi `business_settings 'kanban.tt_task_sla_hours_default'` dan).
- **Nima yetishmaydi:** trigger-shartining o'zi to'liq; keyingi bosqichlar (C11 ish-vaqti, C12 boshliqqa, C13 Tier-2) alohida bandlarda ochiq. ⚠️ `kanban_column_sla` jadvali (2026-08-03 da default qatorlar bilan yaratilgan) **hech qanday kod tomonidan o'qilmaydi** va boot-guard'i ham yo'q — ustun-darajasidagi SLA mexanizmi ulanmagan.
- **Bog'liqlik:** EP-KANBAN-003 (24h), EP-KANBAN-041 (C11), EP-KANBAN-042 (C12), EP-KANBAN-043 (C13)
- **action:** CRON (`task.escalation.trigger`)
- **⤳ Ta'sir:** Org, NTF
- **Xoch-havolalar:** `[Module-15] Item C10` · `[Module-15] Item #105` · `TASDIQ-2146 §15 #10`
- **⚠️ ZIDDIYAT:** `TASDIQ-2146 §15` jadvali "kanban eskalatsiya cron'i yo'q (faqat MES/CC)" deydi — bu 2026-06-27 dan keyin **noto'g'ri** bo'lib qoldi (`Item C10` buni STALE-DOC deb qayd etgan).
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — `kanban-overdue-escalation.cron.ts` → BullMQ `kanban-cron.processor.ts` ga ko'chdi; `50456109` (07-13) — CC-parity 24h TT SLA qo'shildi. ⚠️ **Yangi bo'shliq:** `kanban_column_sla` (08-03) o'lik jadval — hech qayerdan o'qilmaydi.

### EP-KANBAN-041 · 24 soat qanday sanaladi (ish vaqti yoki astronomik) (v2-Q11)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — faqat ish vaqti sanaladi (smena jadvaliga ko'ra) — adolatli. (v1-Q4 = EP-KANBAN-004 bilan bir mavzu.)
- **Manba:** A-default
- **Dalil (kod):** `Item C11`: "comparison is plain `substring(due_date,1,10)::date < CURRENT_DATE`, **no shift-calendar/business-hours logic** anywhere in the query." Jonli 2026-08-07: cron BullMQ'ga ko'chgach ham bir xil — `kanban-cron.processor.ts` `OVERDUE_ESCALATION` kalendar-sanani, `TT_SLA_ESCALATION` esa `created_at + interval` ni ishlatadi (ikkalasi ham astronomik). `Item A40`: `grep -rniE "WORK_DAY_CALENDAR" apps/api/src` → 0.
- **Nima yetishmaydi:** MES smena-kalendari va HR bayram kalendari bilan bog'lanish; ish-soati arifmetikasi (`Item C11`: "Owner-gated — none beyond MES shift-calendar API confirmation").
- **Bog'liqlik:** EP-KANBAN-004 (bir xil talab, v1-Q4), EP-KANBAN-040 (C10 cron asosi), EP-KANBAN-067 (C37 smenaga moslash), VR-KANBAN-I01
- **action:** CRON (`task.escalation.workhours`)
- **⤳ Ta'sir:** HR (smena jadvali), Ishlab chiqarish (3 smena)
- **Xoch-havolalar:** `[Module-15] Item C11` · `[Module-15] Item A40` · `EXTRACTION QISM A #40` · `TASDIQ-2146 §15 #11`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-042 · Eskalatsiya kimga boradi (ko'tarilish manzili) (v2-Q12)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — ijrochining bevosita boshlig'iga (org-strukturadagi keyingi yuqori daraja) — tabiiy zanjir.
- **Manba:** A-default; Org manager_id (keyingi yuqori daraja, `project_org_structure_vysotskiy7`)
- **Dalil (kod):** `Item C12`: "notifies only `owner_user_id`+`assigner_user_id`, **no manager_id/org_departments lookup** (unlike the recursive `headed_depts` CTE already built in `kanban-visibility.helper.ts`)." Jonli 2026-08-07 **tasdiqlandi**: `kanban-cron.processor.ts:140-160` — xabar oluvchilar aynan `owner_user_id`, `assigner_user_id` va **kuzatuvchilar** (`d8d59973`); `grep -niE "manager|head_user|org_department" kanban-cron.processor.ts` → **0 urish**.
- **Nima yetishmaydi:** boshliq zanjiriga marshrutlash. ⚠️ Naqsh **allaqachon mavjud** — `kanban-visibility.helper.ts` dagi rekursiv `headed_depts` CTE'ni qayta ishlatish kifoya (`Item C12`: "Code-buildable-now").
- **Bog'liqlik:** EP-KANBAN-026 (bir xil talab, v1-Q26), EP-KANBAN-040 (cron asosi), EP-KANBAN-043 (Tier-2 shu ustiga quriladi)
- **action:** CRON (`task.escalation.route`)
- **⤳ Ta'sir:** Org-struktura (manager_id zanjiri), NTF
- **Xoch-havolalar:** `[Module-15] Item C12` · `TASDIQ-2146 §15 #12`
- **Δ 2026-07-11→08-07:** `d8d59973` (07-10) — eskalatsiya xabari **kuzatuvchilarga** ham boradigan bo'ldi, lekin boshliq zanjiri hamon qo'shilmagan.

### EP-KANBAN-043 · Ikkinchi bosqich eskalatsiya (yana 24 soat) (v2-Q13)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — ha, yana 24 soatdan keyin keyingi yuqori darajaga ko'tariladi (zanjir bo'ylab). Sub-qaror: CEO'da to'xtaydi (1-variant).
- **Manba:** A-default; Vysotskiy-7 zanjiri
- **Dalil (kod):** `Item C13`: "single **flat** notify pass, no tier concept; `grep -niE \"tier\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**." Jonli 2026-08-07 tasdiqlandi — `kanban-cron.processor.ts` da bosqich (tier) tushunchasi yo'q; `TT_SLA_ESCALATION` ham bitta 24h chegara bilan cheklangan.
- **Nima yetishmaydi:** bosqich-hisoblagich ustuni/jadvali, "keyingi darajaga ko'tarish" tsikli, CEO'da to'xtash sharti (`Item C13`: "Dependencies: C10, C12").
- **Bog'liqlik:** EP-KANBAN-042 (C12 — oldingi shart), EP-KANBAN-003 (48h ikkinchi bosqich), EP-KANBAN-051 (A21 Owner Telegram)
- **action:** CRON (`task.escalation.tier2`)
- **⤳ Ta'sir:** Org, DIR
- **Xoch-havolalar:** `[Module-15] Item C13` · `TASDIQ-2146 §15 #13`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-044 · Eskalatsiya xabari qaysi kanaldan keladi (v2-Q14)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07, jonli tasdiq)*
- **Talab:** A — ERP ichida + Telegram guruhga xabar (e'tibordan chetda qolmaydi).
- **Manba:** A-default; ShVB Telegram
- **Dalil (kod):** `Item C14`: "`notify()` — only INSERTs into the `notifications` (ERP) table, **no `TelegramService` import/call** anywhere in the file." Jonli 2026-08-07 tasdiqlandi: `kanban-cron.processor.ts:171` `private async notify(...)` faqat `notifications` ga yozadi; `grep -niE "telegram" kanban-cron.processor.ts` → **0**.
- **Nima yetishmaydi:** `Item C14`: "Telegram-group delivery for escalations is not implemented (separate outbound Telegram methods exist in `kanban.handler.ts` … but are **not connected** to this cron)". Bundan tashqari Telegram **guruh** chat_id sozlamasi (master-data) ham yo'q.
- **Bog'liqlik:** EP-KANBAN-019 (bir xil o'lik Telegram qatlami), EP-KANBAN-085 (C55 Telegramdan yopish), EP-KANBAN-020
- **action:** EVENT (`task.escalation.channel`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram), NTF
- **Xoch-havolalar:** `[Module-15] Item C14` · `[Module-15] Item #85` · `TASDIQ-2146 §15 #14`
- **⚠️ ZIDDIYAT:** `Item C14` Telegram metodlarini "exist" deb sanaydi; jonli tekshiruv esa ularning **hech qayerdan chaqirilmasligini** ko'rsatadi (o'lik kod) — "mavjud" ≠ "ulangan" (qv. EP-KANBAN-019).
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-045 · Eskalatsiya hisobi (kim necha marta) (v2-Q15)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ha, oylik hisobotda "eskalatsiya soni" ko'rsatkichi (intizom o'lchanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C15`: "Full `kanban_cards` column dump has **no `escalation_count` column**; no such column on any of the other 23 kanban tables checked via `information_schema`." **Δ:** `e87ae0e9` (07-13) — karta-egasi reyting formulasi `achievement*0.7 − escalation*0.3` qurildi (`Item A39` talabi), ya'ni eskalatsiya soni **hisoblanadi**, lekin `notifications` yozuvlaridan hosila sifatida, doimiy ustun sifatida emas.
- **Nima yetishmaydi:** doimiy `escalation_count` (yoki eskalatsiya-jadvali) yo'q → oylik hisobot ko'rsatkichi tarixiy-barqaror emas; `notifications` tozalansa sanoq yo'qoladi.
- **Bog'liqlik:** EP-KANBAN-046 (C16 — eskalatsiya yozuvi kerak), EP-KANBAN-040, EP-KANBAN-102 (GSD/KPI)
- **action:** READ (`task.escalation.count`)
- **⤳ Ta'sir:** HR (intizom), Oylik (KPI)
- **Xoch-havolalar:** `[Module-15] Item C15` · `[Module-15] Item A39` · `EXTRACTION QISM A #39` · `TASDIQ-2146 §15 #15`
- **Δ 2026-07-11→08-07:** `e87ae0e9` (07-13) — `achievement*0.7 − escalation*0.3` reyting formulasi qo'shildi (`Item A39` bilan aynan mos); `d2098c77` (07-13) — bekor qilingan kartalar KPI'da neytral hisoblanadi (`Item A17`).

### EP-KANBAN-046 · Eskalatsiyani bekor qilish (noto'g'ri ko'tarilsa) (v2-Q16)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — boshliq sabab yozib yopadi, lekin tarixda qoladi (moslashuvchan, shaffof).
- **Manba:** A-default
- **Dalil (kod):** `Item C16`: "No `kanban_task_escalations`/escalation-cancel endpoint exists — confirmed via the same `information_schema` table list used for A21 (**no such table**) and no matching route in `kanban-cards.controller.ts`."
- **Nima yetishmaydi:** eskalatsiya-yozuvi jadvali (ildiz — `Item A21` ham shuni talab qiladi), "sabab bilan yopish" endpoint'i, tarixda saqlanish.
- **Bog'liqlik:** EP-KANBAN-045 (C15 sanoq), EP-KANBAN-051 (A21 immutable qayd), EP-KANBAN-040
- **action:** UPDATE (`task.escalation.dismiss`)
- **⤳ Ta'sir:** Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C16` · `[Module-15] Item A21` *(bog'liq)* · `TASDIQ-2146 §15 #16`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-047 · Muddati yo'q vazifa eskalatsiyaga tushadimi (v2-Q17)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — muddatsiz vazifa yaratilishiga yo'l qo'yilmaydi (muddat majburiy — muammo ildizdan yo'qoladi).
- **Manba:** A-default
- **Dalil (kod):** `Item C17`: "`kanban_cards.due_date` is a **nullable `varchar`**; `KanbanCardCreateSchema` marks `dueDate` `.optional()`, and `createCardFlat` inserts `due_date=null` when absent." **Δ jonli 2026-08-07:** yaratishda hamon ixtiyoriy, **lekin** endi muddatsiz karta "Jarayonda"ga o'ta olmaydi — C6 darvozasi (`kanban-boards.service.ts:270-282`) `due_date` bo'lmasa `VALIDATION` xatosi qaytaradi.
- **Nima yetishmaydi:** yaratish paytidagi majburiylik (Zod `.optional()` + DB `NULL`); `Item C17`: "Owner-gated — migration approval for the `NOT NULL` constraint (existing NULL rows would need backfill first)". Muddatsiz kartalar hamon "Reja" ustunida cheksiz yotishi mumkin va eskalatsiyaga tushmaydi.
- **Bog'liqlik:** EP-KANBAN-036 (C6 — qisman qopladi), EP-KANBAN-077 (C47 majburiy maydonlar), EP-KANBAN-107 (kutilgan natija)
- **action:** CREATE (`task.deadlineRequired`)
- **⤳ Ta'sir:** Hamma Kanban
- **Xoch-havolalar:** `[Module-15] Item C17` · `TASDIQ-2146 §15 #17`
- **Δ 2026-07-11→08-07:** C6 darvozasi (`assertCanMoveTo`) qo'shilishi bilan muddat **bilvosita** majburiy bo'ldi ("Jarayonda"ga kirishda) — talabning "yaratilishiga yo'l qo'yilmaydi" qismi hamon ochiq.

### EP-KANBAN-048 · Shaxsiy kunlik dastur nima asosida tuziladi (v2-Q18)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — Kanban vazifalari + takrorlanuvchi odat ishlar avtomatik soatlarga taqsimlanadi (yagona manba).
- **Manba:** A-default; ShVB Y20
- **Dalil (kod):** `Item C18`: "`grep -rliE \"personal.?program\" apps/api/src --include=*.ts` (repo-wide) → **0 files**." Jonli 2026-08-07 tasdiqlandi. Ikkala kirish manbasi alohida mavjud — Kanban kartalari (`kanban_cards`) va takror-generator (`RECURRING_CARDS`) — lekin ularni soatlarga taqsimlaydigan qatlam yo'q.
- **Nima yetishmaydi:** butun PersonalProgram BE moduli (`Item C18`: "build a new PersonalProgram BE module (hourly-grid table + CRUD) and FE page **from scratch**"; "Owner-gated — owner sign-off for a brand-new table/module (Q-35)").
- **Bog'liqlik:** EP-KANBAN-007 (ildiz), EP-KANBAN-022 (takror manbasi), EP-KANBAN-028, EP-KANBAN-049..055
- **action:** EVENT (`personalProgram.build`)
- **⤳ Ta'sir:** HR (kunlik reja), Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C18` · `[Module-15] Item #88` · `TASDIQ-2146 §15 #18`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-049 · Dastur qadami (vaqt oralig'i) (v2-Q19)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — 1 soatlik bo'laklar (08:00–09:00…) — sodda va yetarli.
- **Manba:** A-default; ShVB Y20 (soat bo'yicha grid)
- **Dalil (kod):** `Item C19`: "Same grep as C18 — Personal Program module **confirmed absent**." Jonli 2026-08-07: FE `MyPlanView.tsx` faqat bugun/hafta/keyinroq guruhlash beradi, soat-grid emas.
- **Nima yetishmaydi:** soatlik grid jadvali va renderi (`Item C19`: "part of the C18 module build (hourly-grid rendering)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-011 (soat-blok), EP-KANBAN-088/089 (band-slotlar)
- **action:** CREATE (`personalProgram.slot`)
- **⤳ Ta'sir:** Shaxsiy dastur UI
- **Xoch-havolalar:** `[Module-15] Item C19` · `TASDIQ-2146 §15 #19`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-050 · Reja vs Fakt taqqoslash (v2-Q20)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — ha, kun oxirida har bo'lakda "reja/fakt/farq" ko'rinadi (o'zini-o'zi nazorat).
- **Manba:** A-default
- **Dalil (kod):** `Item C20`: "Same as C18 — **no BE service found** (matches table's own 'faqat doc, kod yo'q')." Jonli 2026-08-07: `kanban_time_tracks` da `durationMinutes`/`targetMinutes` juftligi bor (fakt vs norma), lekin bu **karta** darajasida, kun-bo'lagi darajasida emas.
- **Nima yetishmaydi:** kun-bo'lagi bo'yicha reja/fakt/farq hisobi va kun-yakuni ekrani (`Item C20`: "part of C18 build (plan-vs-fact computation)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-030 (kunlik hisobot), EP-KANBAN-134 (norma-taqqos)
- **action:** READ (`personalProgram.planVsFact`)
- **⤳ Ta'sir:** HR (intizom), Oylik (KPI)
- **Xoch-havolalar:** `[Module-15] Item C20` · `TASDIQ-2146 §15 #20`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-051 · Dasturni kim tasdiqlaydi (v2-Q21)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ertalab boshliq bir qarab tasdiqlaydi (yoki o'zgartiradi) — yo'naltirish.
- **Manba:** A-default
- **Dalil (kod):** `Item C21`: "Same as C18 — **module absent**, so no approval flow can exist." (`Item #116` ham xuddi shu mavzu: kun boshi "bugungi reja" boshliq ko'radi/tasdiqlaydi.)
- **Nima yetishmaydi:** butun tasdiq-oqimi (`Item C21`: "part of C18 build (approval workflow)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-116 (#116 kun boshi reja), EP-KANBAN-027
- **action:** APPROVE (`personalProgram.approve`)
- **⤳ Ta'sir:** Coordination, HR
- **Xoch-havolalar:** `[Module-15] Item C21` · `[Module-15] Item #116` *(taxminiy)* · `TASDIQ-2146 §15 #21`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-052 · Kutilmagan ish kirib qolsa (rejaga sig'masa) (v2-Q22)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yangi vazifa rejaga qo'shiladi, siljigan ishlar avtomatik keyinga suriladi va belgilanadi (haqiqatga mos).
- **Manba:** A-default
- **Dalil (kod):** `Item C22`: "Same as C18 — **module absent**." Qo'shni mexanizm `Item A32` (SHOSHILINCH kun to'lsa past vazifa siljiydi, AI taklif + xodim tasdig'i) ham qurilmagan.
- **Nima yetishmaydi:** reflow (qayta-taqsimlash) mantig'i va "siljigan" belgisi (`Item C22`: "part of C18 build (reflow logic)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-008 (rollover — o'xshash mexanizm), EP-KANBAN-059 (urgent limit)
- **action:** UPDATE (`personalProgram.reflow`)
- **⤳ Ta'sir:** Shaxsiy dastur
- **Xoch-havolalar:** `[Module-15] Item C22` · `[Module-15] Item A32` *(bog'liq)* · `TASDIQ-2146 §15 #22`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-053 · Bo'sh soatlar (rejada teshik) (v2-Q23)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bo'sh soatlar sariq belgilanadi va sababini so'raydi (bo'shliq ko'rinadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C23`: "Same as C18 — **module absent**."
- **Nima yetishmaydi:** bo'sh-slot tahlili va sabab so'rovi (`Item C23`: "part of C18 build (empty-slot analysis)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-049 (slot), EP-KANBAN-050 (reja/fakt)
- **action:** READ (`personalProgram.gaps`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C23` · `TASDIQ-2146 §15 #23`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-054 · Takrorlanuvchi kunlik ishlar (odat vazifalar) (v2-Q24)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — bir marta sozlanadi, har kuni avtomatik paydo bo'ladi (qulay).
- **Manba:** A-default; ShVB Y20
- **Dalil (kod):** `Item C24`: "real, live `@Cron('0 7 * * *')` job regenerating `kanban_cards` from `recurrence_pattern`." Jonli 2026-08-07: `kanban-cron.processor.ts:258` — "RECURRING_CARDS — `apps/api/src/cron/kanban-recurring.cron.ts`'dan ko'chirilgan, **o'zgarishsiz**"; endi BullMQ repeatable job (07:00 Asia/Tashkent).
- **Nima yetishmaydi:** `Item C24`: "it does **not feed into a daily 'dastur'** (Personal Program, C18)". Ya'ni takror-karta taxtada paydo bo'ladi, kunlik dasturda emas. Takror-shablon CRUD ekrani ham topilmadi — `recurrence_pattern` karta maydonidan qo'lda kiritiladi.
- **Bog'liqlik:** EP-KANBAN-022 (v1-Q22 — bir xil talab), EP-KANBAN-048 (ildiz), EP-KANBAN-135 (ТХ takroriy)
- **action:** CRON (`personalProgram.habit`)
- **⤳ Ta'sir:** Shaxsiy dastur
- **Xoch-havolalar:** `[Module-15] Item C24` · `TASDIQ-2146 §15 #24`
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — BullMQ repeatable job'ga ko'chdi (`Item A50` "Hamma cron BullMQ (persistent)" talabiga mos), mantiq o'zgarmadi.

### EP-KANBAN-055 · Dastur kun oxirida yopiladimi (kunlik yakun) (v2-Q25)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kun yopilgach o'zgartirib bo'lmaydi (faqat ko'rish) — ishonchli tarix.
- **Manba:** A-default
- **Dalil (kod):** `Item C25`: "Same as C18 — with **no Personal Program module, no lock concept can exist**." Qo'shni talab `Item A20` (3-smena "kun yopilar" har smena + atomik tranzaksiya) ham qurilmagan.
- **Nima yetishmaydi:** kun-yopish amali, immutability qulfi, 3-smenali fabrikada "kun" chegarasini aniqlash (`Item A20`).
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-050 (reja/fakt yakuni), EP-KANBAN-030
- **action:** CRON (`personalProgram.lockDay`)
- **⤳ Ta'sir:** Hisobotlar (reja/fakt)
- **Xoch-havolalar:** `[Module-15] Item C25` · `[Module-15] Item A20` *(bog'liq)* · `TASDIQ-2146 §15 #25`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-056 · Vazifa kategoriyalari ro'yxati (v2-Q26)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Ishlab chiqarish / Sifat / Ta'mirlash / Ombor / Sotuv / Ma'muriy / Boshqa (fabrika tiliga mos).
- **Manba:** A-default
- **Dalil (kod):** `Item C26` (2026-07-11): "`SELECT column_name … column_name ILIKE '%categ%'` → **empty result**." **Δ jonli 2026-08-07:** `kanban_cards.task_type` ustuni mavjud va u `taxonomy_entries` (`category='kanban_task_type'`) ga **soft-reference** qiladi (`schema-kanban.ts:60` izohi; `kanban-cron.processor.ts:218` bu JOIN'ni jonli ishlatadi). Ya'ni turkumlash uchun **master-data qatlami endi bor** — lekin u "kategoriya" emas, "vazifa turi".
- **Nima yetishmaydi:** vizyondagi **7 ta kanonik kategoriya** (IshlabChiq/Sifat/Ta'mir/Ombor/Sotuv/Ma'muriy/Boshqa) seed qilinmagan; `task_type` va "kategoriya" ikki xil o'q sifatida ajratilmagan; kategoriya bo'yicha hisobot kesimi yo'q.
- **Bog'liqlik:** EP-KANBAN-061 (C31 kategoriya→mas'ul), EP-KANBAN-037 (kategoriyaga bog'liq yopish dalili), EP-KANBAN-109 (#109 seriya toifasi)
- **action:** CREATE (`task.category.master`)
- **⤳ Ta'sir:** Hisobotlar, barcha modullar
- **Xoch-havolalar:** `[Module-15] Item C26` · `TASDIQ-2146 §15 #26`
- **Δ 2026-07-11→08-07:** `50456109` (07-13) — `kanban_cards.task_type` + `taxonomy_entries` (`kanban_task_type`) soft-reference qo'shildi (SLA zanjiri uchun). **2026-07-11 "hech qanday categ ustuni yo'q" da'vosi endi qisman eskirgan.**

### EP-KANBAN-057 · Ustuvorlik darajalari (v2-Q27)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — 3 daraja: Shoshilinch / Oddiy / Past (sodda va yetarli). (v1-Q10 rang bilan mos.)
- **Manba:** A-default; ShVB Y20 (3 daraja rang)
- **Dalil (kod):** `Item C27`: "`kanban_cards.priority` is a plain `character varying` (**not a Postgres ENUM**). `KanbanAddCardSchema`/`KanbanUpdateCardSchema` **now constrain** `priority` to `z.enum(['low','normal','high','urgent'])`." **Δ:** `kanban-priority.ts` (`7535e2ae`) — `KanbanPriorityTier` (SHOSHILINCH/ODDIY/PAST) + `priorityToVisionTier()` **additiv alias qatlami**.
- **Nima yetishmaydi:** `Item C27`: "it is **4-valued** (`low/normal/high/urgent`), not the vision's 3-tier … naming, and **not a DB-level enum type**". Alias qatlami `normal` va `high` ni bitta "Oddiy"ga yig'adi — teskari xaritalash (Oddiy → qaysi biri?) noaniq.
- **Bog'liqlik:** EP-KANBAN-010 (v1-Q10 rang — bir xil talab), EP-KANBAN-058/059/060 (ustuvorlik klasteri), EP-KANBAN-119
- **action:** CREATE (`task.priority.master`)
- **⤳ Ta'sir:** Butun Kanban
- **Xoch-havolalar:** `[Module-15] Item C27` · `TASDIQ-2146 §15 #27`
- **Δ 2026-07-11→08-07:** `7535e2ae` (07-11) — vizyon 3-daraja nomlash qatlami qo'shildi (DB ustuni Q-39 non-regression sababli tegilmadi).

### EP-KANBAN-058 · Ustuvorlikni kim belgilaydi (v2-Q28)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yaratuvchi taklif qiladi, boshliq tasdiqlaydi/o'zgartiradi (muvozanat).
- **Manba:** A-default
- **Dalil (kod):** `Item C28`: "`createCardFlat` — `priority` is written **directly from the request body** with no pending/approval intermediate state."
- **Nima yetishmaydi:** `priority_proposed`/`priority_approved` ikki holatli oqim va boshliq-tasdiq endpoint'i (`Item C28`: "Code-buildable-now"). ⚠️ Qisman bog'liq mexanizm **mavjud**: `urgent` yaratish kunlik limit bilan cheklangan (EP-KANBAN-059), lekin bu tasdiq emas, kvota.
- **Bog'liqlik:** EP-KANBAN-057 (daraja), EP-KANBAN-119 (#119 "Срочно" faqat boshliq), EP-KANBAN-059
- **action:** UPDATE (`task.priority.set`)
- **⤳ Ta'sir:** Org
- **Xoch-havolalar:** `[Module-15] Item C28` · `[Module-15] Item #119` *(bog'liq)* · `TASDIQ-2146 §15 #28`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-059 · "Shoshilinch" vazifa kunlik chegarasi (v2-Q29)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07, jonli tasdiq)*
- **Talab:** A — bir kunda ko'pi bilan 2 ta "Shoshilinch" (qadri saqlanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C29`/`Item A15` (2026-07-11): "`grep -rniE \"urgentLimit|urgent_limit\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**." ⚠️ **Bu da'vo noto'g'ri edi — grep faqat ikkita nomni qidirgan.** Jonli 2026-08-07: `business.constants.ts:633` `export const KANBAN_MAX_URGENT_PER_DAY = 2;`, `kanban-boards.service.ts:381` va `drizzle-kanban-cards.repo.ts:294` da **ikkala yaratish yo'lida** majburlanadi: `if (used >= KANBAN_MAX_URGENT_PER_DAY) → VALIDATION` xatosi ("Bir kunda ko'pi bilan 2 ta \"Shoshilinch\" vazifa yaratish mumkin (bugun N ta yaratilgan)."). Sanoq **topshiruvchi (assigner)** bo'yicha kunlik.
- **Nima yetishmaydi:** — (chegara ishlaydi). ⚠️ Chegara `business.constants.ts` da **qattiq-kodlangan**, `business_settings` CRUD'ida emas — ⭐ threshold-CRUD qoidasiga to'liq mos emas (qv. EP-KANBAN-038 dagi WIP yechimi, u ustun CRUD'iga ko'chirilgan).
- **Bog'liqlik:** EP-KANBAN-057 (daraja), EP-KANBAN-052 (siljish), EP-KANBAN-058, EP-KANBAN-119
- **action:** UPDATE (`task.urgentLimit`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C29` · `[Module-15] Item A15` · `EXTRACTION QISM A #15` · `TASDIQ-2146 §15 #29`
- **⚠️ ZIDDIYAT:** `Item C29` va `Item A15` ikkalasi ham "0 matches / mexanizm yo'q" deydi — jonli tekshiruv buni **rad etadi**: `KANBAN_MAX_URGENT_PER_DAY` ikki yozish-yo'lida majburlanadi. Audit `urgentLimit|urgent_limit` naqshini qidirgan, kod esa `MAX_URGENT_PER_DAY` nomini ishlatadi (nom-mos kelmasligi tufayli soxta-manfiy).
- **Δ 2026-07-11→08-07:** Kod o'zgarmadi; **audit-da'vosi rad etildi** (yuqoridagi ziddiyat).

### EP-KANBAN-060 · Ustuvorlik tartibi (Kanbanda joylashuv) (v2-Q30)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik: shoshilinch yuqorida, keyin muddati yaqinlari (o'zi tartiblanadi).
- **Manba:** A-default
- **Dalil (kod):** `Item C30`: "`sort_order` is **manually maintained** (drag-drop) and every query uses `ORDER BY kc.sort_order ASC`; **no query anywhere combines `priority`+`due_date`** for automatic ordering."
- **Nima yetishmaydi:** `Item C30`: "no automatic priority+deadline-based sort exists" — avtomatik tartiblash yo'q; qo'lda drag-drop tartibi ustuvorlikni bekor qiladi.
- **Bog'liqlik:** EP-KANBAN-057 (daraja), EP-KANBAN-114 (#114 stansiya navbati — bir xil mantiq), EP-KANBAN-010
- **action:** READ (`task.sortOrder`)
- **⤳ Ta'sir:** Kanban UI
- **Xoch-havolalar:** `[Module-15] Item C30` · `[Module-15] Item #114` *(bog'liq)* · `TASDIQ-2146 §15 #30`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-061 · Kategoriyaga qarab mas'ulni avtomatik taklif (v2-Q31)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ha, kategoriya bo'yicha odatiy mas'ulni taklif qiladi (o'zgartirsa bo'ladi) — tez.
- **Manba:** A-default
- **Dalil (kod):** `Item C31`: "Depends on `category` (C26), independently confirmed absent." Qo'shni AI-mexanizm `Item A44` (biriktirish: `history*0.4+workload*0.3+razryad*0.3` + feedback loop) ham qurilmagan. Jonli 2026-08-07: `kanban_flows`/`assignmentType: round_robin` generic robot-mexanizmi bor (`drizzle-kanban-flows-robots.repo.ts`), lekin kategoriyaga bog'lanmagan.
- **Nima yetishmaydi:** kategoriya→mas'ul lookup jadvali (`Item C31`: "Owner-gated — category taxonomy ownership"); AI-tavsiya formulasi.
- **Bog'liqlik:** EP-KANBAN-056 (C26 kategoriya — oldingi shart), EP-KANBAN-101 (operator-stansiya), VR-KANBAN-I04
- **action:** AI (`task.suggestAssignee`)
- **⤳ Ta'sir:** Org-struktura, AI Integratsiya
- **Xoch-havolalar:** `[Module-15] Item C31` · `[Module-15] Item A44` *(bog'liq)* · `EXTRACTION QISM A #44` · `TASDIQ-2146 §15 #31`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-062 · Ustuvorlik muddatga ta'sir qiladimi (v2-Q32)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Shoshilinch → odatda shu kun oxiri muddat (o'zgartirsa bo'ladi) — izchil.
- **Manba:** A-default
- **Dalil (kod):** `Item C32`: "`updateCard` — `priority` and `due_date` are set as **fully independent fields** with no cross-derivation logic anywhere in the method."
- **Nima yetishmaydi:** `priority='urgent'` ga o'tganda `due_date` ni kun oxiriga avtomat qo'yish qoidasi (`Item C32`: "Code-buildable-now").
- **Bog'liqlik:** EP-KANBAN-057 (daraja), EP-KANBAN-059 (urgent limit), EP-KANBAN-047 (muddat majburiyligi)
- **action:** UPDATE (`task.priorityDeadline`)
- **⤳ Ta'sir:** Kanban
- **Xoch-havolalar:** `[Module-15] Item C32` · `TASDIQ-2146 §15 #32`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-063 · Kun oxirida bajarilmagan vazifa nima bo'ladi (v2-Q33)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — avtomatik ertangi kunga ko'chiriladi va "ko'chirilgan" belgisi qoladi (hech narsa yo'qolmaydi). Rollover mantig'i build-prompt'da.
- **Manba:** ShVB Y20 (rollover: bajarilmagan task ertangi kunga o'tadi)
- **Dalil (kod):** `Item C33`: "`grep -rniE \"rollover\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**; no `rolled_over` column in the full `kanban_cards` schema dump (confirmed identically for A5/A20/A32)." Jonli 2026-08-07 tasdiqlandi — `kanban-cron.processor.ts` da faqat 3 job (`OVERDUE_ESCALATION`/`RECURRING_CARDS`/`TT_SLA_ESCALATION`), rollover job'i yo'q.
- **Nima yetishmaydi:** ⭐ **butun rollover mexanizmi** — cron, `rolled_over` ustuni, "ko'chirilgan" belgisi. Bu EP-KANBAN-064..069 ning ildizi. Qaror ✅ javoblangan (ShVB build-prompt aniq), lekin kod yo'q — eng katta "qaror bor / qurilish yo'q" bo'shlig'i.
- **Bog'liqlik:** EP-KANBAN-008 (v1-Q8 — bir xil talab), EP-KANBAN-064..069 (butun klaster), EP-KANBAN-048 (dastur)
- **action:** CRON (`task.rollover`)
- **⤳ Ta'sir:** Shaxsiy dastur, Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C33` · `[Module-15] Item A5` · `EXTRACTION QISM A #5` · `TASDIQ-2146 §15 #33`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-064 · Necha marta ko'chirilganini sanash (v2-Q34)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ha, "3 marta ko'chirilgan" yozuvi; 3 dan oshsa boshliqqa signal (ildizni topadi). ⚠️ `rolledOverFrom` maydon mavjud, sanagich qo'shiladi.
- **Manba:** A-default; ShVB Y20 (`rolledOverFrom`)
- **Dalil (kod):** `Item C34`: "**No `rolled_over_count` column** exists in the full `kanban_cards` schema dump."
- **Nima yetishmaydi:** sanagich ustuni + 3-chegara signali (`Item C34`: "Dependencies: C33"). ⚠️ Qarordagi "`rolledOverFrom` maydon **mavjud**" da'vosi ShVB **build-prompt** ga tegishli (rejalashtirilgan maydon), jonli sxemaga emas.
- **Bog'liqlik:** EP-KANBAN-063 (ildiz), EP-KANBAN-009 (v1-Q9), EP-KANBAN-069 (10 kun avto-yopish)
- **action:** CRON (`task.rollover.count`)
- **⤳ Ta'sir:** 24-soat eskalatsiya, HR
- **Xoch-havolalar:** `[Module-15] Item C34` · `TASDIQ-2146 §15 #34`
- **⚠️ ZIDDIYAT:** `decisions/15-kanban.md` "⚠️ `rolledOverFrom` maydon mavjud" deydi; jonli sxemada bunday ustun **yo'q** (`Item C34`). Manba — ShVB build-prompt (reja), kod emas.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-065 · Ko'chirishda muddat o'zgaradimi (v2-Q35)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — muddat ertangi kunga suriladi, lekin "asl muddat o'tgan" belgisi saqlanadi (haqiqat ham, yangilik ham).
- **Manba:** A-default
- **Dalil (kod):** `Item C35`: "Depends **entirely** on C33's rollover mechanism, confirmed absent."
- **Nima yetishmaydi:** muddat surish mantig'i + `original_due_date` (asl muddat) belgisi (`Item C35`: "part of the C33 rollover build").
- **Bog'liqlik:** EP-KANBAN-063 (ildiz), EP-KANBAN-117 (#117 deadline cho'zish tasdig'i), EP-KANBAN-039
- **action:** CRON (`task.rollover.deadline`)
- **⤳ Ta'sir:** Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C35` · `TASDIQ-2146 §15 #35`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-066 · Qaysi vazifalar ko'chmaydi (istisno) (v2-Q36)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — aniq sanaga bog'langan vazifalar ko'chmaydi, faqat eskalatsiyaga tushadi (to'g'ri signal).
- **Manba:** A-default
- **Dalil (kod):** `Item C36`: "Depends on **both** C33 (rollover) **and** escalation routing (C12/C13), all confirmed absent/incomplete."
- **Nima yetishmaydi:** "aniq sanaga bog'langan" bayrog'i (`fixed_date` kabi), istisno tarmog'i (`Item C36`: "with an exception-flag branch").
- **Bog'liqlik:** EP-KANBAN-063 (ildiz), EP-KANBAN-042/043 (eskalatsiya marshruti), EP-KANBAN-097 (#97 buyurtma muddati)
- **action:** CRON (`task.rollover.exception`)
- **⤳ Ta'sir:** Savdo (mijoz muddati)
- **Xoch-havolalar:** `[Module-15] Item C36` · `TASDIQ-2146 §15 #36`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-067 · Ko'chirish vaqti (qachon amalga oshadi) (v2-Q37)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har bo'limning smena tugashiga moslab ko'chiriladi (adolatli).
- **Manba:** A-default; 3 smena
- **Dalil (kod):** `Item C37`: "Depends on C33 (rollover), confirmed absent." `Item A20` (3-smena "kun yopilar" har smena + atomik tranzaksiya) ham qurilmagan.
- **Nima yetishmaydi:** smena-xabardor vaqtlash (`Item C37`: "Owner-gated — **MES shift-calendar confirmation**"); hozirgi cronlar bitta global vaqtda ishlaydi (07:00 / 09:00 Asia/Tashkent).
- **Bog'liqlik:** EP-KANBAN-063 (ildiz), EP-KANBAN-041 (C11 ish vaqti), EP-KANBAN-004, EP-KANBAN-089 (smena tushligi)
- **action:** CRON (`task.rollover.timing`)
- **⤳ Ta'sir:** Ishlab chiqarish (3 smena), HR
- **Xoch-havolalar:** `[Module-15] Item C37` · `[Module-15] Item A20` *(bog'liq)* · `TASDIQ-2146 §15 #37`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-068 · Ko'chgan vazifa ertangi rejada qayerda turadi (v2-Q38)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ko'chgan ish ertangi ro'yxatda yuqorida turadi (qarz birinchi yopiladi).
- **Manba:** A-default
- **Dalil (kod):** `Item C38`: "Depends on **both** C33 (rollover) **and** C18 (Personal Program), **both confirmed absent**."
- **Nima yetishmaydi:** ikkala ildiz modul ham yo'q → tartiblash qoidasi qurilmagan (`Item C38`: "part of the combined C33+C18 build").
- **Bog'liqlik:** EP-KANBAN-063 + EP-KANBAN-048 (ikki ildiz), EP-KANBAN-060 (avtomatik tartib)
- **action:** READ (`task.rollover.position`)
- **⤳ Ta'sir:** Shaxsiy dastur
- **Xoch-havolalar:** `[Module-15] Item C38` · `TASDIQ-2146 §15 #38`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-069 · Ko'p marta ko'chgan vazifani avtomatik yopish/arxivlash (v2-Q39)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — 10 kundan oshsa boshliqqa "yopaylikmi?" so'rovi chiqadi (tozalik, lekin nazorat bilan).
- **Manba:** A-default
- **Dalil (kod):** `Item C39`: "Depends on C34's `rolled_over_count`, confirmed absent."
- **Nima yetishmaydi:** 10-kunlik so'rov triggeri (`Item C39`: "part of the C34 build"). ⚠️ 10 kun = **threshold qiymat** — qurilganda `business_settings` ga default bilan qo'shilib, CRUD orqali sozlanishi kerak (⭐ threshold-CRUD qoidasi), koddagi konstanta emas.
- **Bog'liqlik:** EP-KANBAN-064 (sanagich), EP-KANBAN-063 (ildiz), EP-KANBAN-006 (arxiv)
- **action:** CRON (`task.rollover.autoClose`)
- **⤳ Ta'sir:** Org, Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C39` · `TASDIQ-2146 §15 #39`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-070 · Kuzatuvchi roli nima (v2-Q40)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydi (aralashmasdan kuzatadi). ⚠️ v1-Q17 (A=faqat o'qiydi) bilan kichik tafovut — egasi muvofiqlashtiradi; bu yerda "izoh yozadi" tavsiya.
- **Manba:** A-default; `kanban_observers` mavjud
- **Dalil (kod):** `Item C40`: "`kanban_observers` GET/POST/DELETE endpoints are real and wired; observers can comment via the shared `/cards/:id/chat` endpoint. Controller-level `@Roles('super_admin','director','manager','employee')` is the **only** guard — it does **not distinguish 'observer' from 'owner'** for `moveCard`/`assignCard`/`completeCard`." `Item #70` (Ha): "**No status-change endpoint accepts an observer role** … Live DB: `SELECT count(*) FROM kanban_observers` → **4 rows**."
- **Nima yetishmaydi:** `Item C40`: "there is **no role-check preventing an observer from also moving/completing** the card" — kuzatuvchi-sifatida cheklov yo'q; amalda kuzatuvchi boshqa yo'l bilan (masalan bo'lim ko'rinishi orqali) kartani o'zgartira oladi.
- **Bog'liqlik:** EP-KANBAN-017 (v1-Q17 — tafovut), EP-KANBAN-071/072 (kuzatuvchi klasteri), EP-KANBAN-084
- **action:** READ (`observer.role`)
- **⤳ Ta'sir:** NTF
- **Xoch-havolalar:** `[Module-15] Item C40` · `[Module-15] Item #70` · `TASDIQ-2146 §15 #40` · `TASDIQ-2146 §15 #70`
- **⚠️ ZIDDIYAT:** ⭐ **Ikki agent qarama-qarshi xulosa chiqargan** — `Item C40` = **Qisman** ("no role-check preventing an observer from moving/completing"), `Item #70` = **Ha** ("no status-change endpoint accepts an observer role"). Ikkalasi bir xil koddan boshqa xulosa: #70 "kuzatuvchi uchun **maxsus** endpoint yo'q" deydi, C40 esa "kuzatuvchini **to'sadigan** tekshiruv yo'q" deydi — ikkinchisi qat'iyroq va to'g'riroq. Bu yerda **C40** (Qisman) qabul qilindi. Bundan tashqari v1-Q17 "faqat o'qiydi" vs v2-Q40 "izoh ham yozadi" — egasi muvofiqlashtirsin.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-071 · Kuzatuvchini kim qo'shadi (v2-Q41)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yaratuvchi yoki mas'ul boshliq qo'shadi (nazorat).
- **Manba:** A-default
- **Dalil (kod):** `Item C41`: "`addCardObserver` — accepts **any** authenticated user in the 4 broad roles with **no check** that the caller is the card's creator or manager." `Item #71` xuddi shunday: "any of those four roles can add an observer to **any** card, not just the card's creator/owner-boss."
- **Nima yetishmaydi:** `Item C41`: "the 'who may add' restriction is **not enforced**" — RBAC qatlami yo'q (`@Roles('super_admin','director','manager','employee')` juda keng).
- **Bog'liqlik:** EP-KANBAN-018 (v1-Q18 — bir xil), EP-KANBAN-070 (kuzatuvchi roli), EP-KANBAN-074 (5 chegara)
- **action:** UPDATE (`observer.addPermission`)
- **⤳ Ta'sir:** Xavfsizlik
- **Xoch-havolalar:** `[Module-15] Item C41` · `[Module-15] Item #71` · `TASDIQ-2146 §15 #41` · `TASDIQ-2146 §15 #71`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-072 · Kuzatuvchiga qaysi o'zgarishlar haqida xabar (v2-Q42)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — faqat muhim hodisalar: yopildi, kechikdi, eskalatsiya (kerakli xabar).
- **Manba:** A-default
- **Dalil (kod):** `Item C42` (2026-07-11, **Qisman**): "written to on accept/complete … but **always targets `owner_user_id`, never the observers list**". `Item #72` (**Yo'q**): "neither `acceptCard` nor `completeCard` notify observers at all". **Δ jonli 2026-08-07: qurilgan** — `d8d59973` (2026-07-10, ya'ni **auditdan bir kun oldin**) "notify observers **only on complete and overdue** events"; `kanban-cron.processor.ts:159-166` kuzatuvchilarga xabar yuboradi va `owner`/`assigner` ni takrorlamaydi (`.filter((o) => o.user_id !== row.owner_user_id && o.user_id !== row.assigner_user_id)`).
- **Nima yetishmaydi:** — (talab aynan "yopildi + kechikdi + eskalatsiya" — uchalasi ham qamrab olingan; kanal-afzallik jadvali (foydalanuvchi sozlamasi) yo'q, lekin talab buni so'ramagan)
- **Bog'liqlik:** EP-KANBAN-070 (kuzatuvchi roli), EP-KANBAN-020 (eslatma triggerlari), EP-KANBAN-042
- **action:** EVENT (`observer.notify`)
- **⤳ Ta'sir:** NTF, AI Integratsiya
- **Xoch-havolalar:** `[Module-15] Item C42` · `[Module-15] Item #72` · `TASDIQ-2146 §15 #42` · `TASDIQ-2146 §15 #72`
- **⚠️ ZIDDIYAT:** `Item C42` = **Qisman**, `Item #72` = **Yo'q** — ikki agent bir xil kodni boshqacha bahogan. **Ikkalasi ham endi eskirgan:** `d8d59973` 2026-07-10 da HEAD'ga kirgan (auditdan **oldin**), lekin ikkala item ham uni hisobga olmagan.
- **Δ 2026-07-11→08-07:** ⭐ **Audit-da'vosi rad etildi** — `d8d59973` (07-10) kuzatuvchilarga tanlangan-hodisali xabar qo'shdi.

### EP-KANBAN-073 · Avtomatik kuzatuvchi (boshliq o'z-o'zidan) (v2-Q43)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ha, bevosita boshliq avtomatik kuzatuvchi (lekin xabar oqimini boshqaradi) — tabiiy nazorat.
- **Manba:** A-default; Org manager_id zanjiri
- **Dalil (kod):** `Item C43`: "`addObserver` is **only** reachable via the explicit POST endpoint — **no code path auto-inserts a manager_id-derived observer** on card creation/assignment." `Item #73` bir xil xulosa.
- **Nima yetishmaydi:** karta yaratish/tayinlashda `manager_id` ni avtomat kuzatuvchi qilish (`Item C43`: "Code-buildable-now"). ⚠️ `Item A12` istisnosi ham hisobga olinishi kerak — maxfiy intizom-tergov kartasiga avto-kuzatuvchi **QO'SHILMAYDI**.
- **Bog'liqlik:** EP-KANBAN-018 (v1-Q18 — bir xil), EP-KANBAN-075 (maxfiylik istisnosi), EP-KANBAN-042
- **action:** EVENT (`observer.autoManager`)
- **⤳ Ta'sir:** Org-struktura (manager_id)
- **Xoch-havolalar:** `[Module-15] Item C43` · `[Module-15] Item #73` · `[Module-15] Item A12` *(istisno)* · `TASDIQ-2146 §15 #43`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-074 · Kuzatuvchi sonining chegarasi (v2-Q44)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — ko'pi bilan 5 kuzatuvchi (yetarli va toza).
- **Manba:** A-default
- **Dalil (kod):** `Item C44`: "Read `addCardObserver`/`addObserver` — **no COUNT check** before inserting into `kanban_observers`." Jonli 2026-08-07 tasdiqlandi: `kanban-ext-flow.service.ts:124-126` — `addObserver(cardId, userId) { return this.repo.addObserver(cardId, userId); }` (to'g'ridan-to'g'ri repo'ga, hech qanday tekshiruvsiz).
- **Nima yetishmaydi:** `COUNT(*) < 5` tekshiruvi. ⚠️ 5 = **threshold qiymat** — qurilganda `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi kerak (⭐ threshold-CRUD qoidasi), koddagi konstanta emas.
- **Bog'liqlik:** EP-KANBAN-071 (kim qo'shadi), EP-KANBAN-070, EP-KANBAN-038 (WIP — bir xil naqsh)
- **action:** UPDATE (`observer.limit`)
- **⤳ Ta'sir:** Kanban
- **Xoch-havolalar:** `[Module-15] Item C44` · `[Module-15] Item #74` · `TASDIQ-2146 §15 #44`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-075 · Kuzatuvchi maxfiy vazifani ko'ra oladimi (v2-Q45)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — maxfiy vazifaga faqat tasdiqlangan kuzatuvchi qo'shiladi, qolganlarga ko'rinmaydi (himoya).
- **Manba:** A-default
- **Dalil (kod):** `Item C45` (2026-07-11): "Full `kanban_cards` column dump has **no `confidential` column** (identical finding to A12)." **Δ jonli 2026-08-07: yarmi qurilgan** — `58ae162e` (07-13) `is_confidential` ustuni qo'shildi; `kanban-boards.service.ts:132-159` create/update orqali sozlanadi (COALESCE — kalit bo'lmasa o'zgarmaydi); `i-kanban-boards.repo.ts:58` izohi: "hide from the general board (`kanban-visibility.helper.ts` `kanbanConfidentialClause`)".
- **Nima yetishmaydi:** "faqat **tasdiqlangan** kuzatuvchi qo'shiladi" qismi — maxfiy kartaga kuzatuvchi qo'shishda oq-ro'yxat (whitelist) tekshiruvi yo'q (`addObserver` hamon tekshiruvsiz — EP-KANBAN-074). `Item A12` talab qilgan "maxfiy intizom-tergovga avto-kuzatuvchi QO'SHILMAYDI" istisnosi ham qurilmagan (chunki avto-kuzatuvchining o'zi yo'q).
- **Bog'liqlik:** EP-KANBAN-071/074 (kuzatuvchi qo'shish), EP-KANBAN-073 (avto-kuzatuvchi istisnosi), EP-KANBAN-120 (#120 maxfiy vazifa ko'rinishi)
- **action:** READ (`observer.confidential`)
- **⤳ Ta'sir:** HR (maxfiy masalalar), Xavfsizlik
- **Xoch-havolalar:** `[Module-15] Item C45` · `[Module-15] Item #75` · `[Module-15] Item A12` · `EXTRACTION QISM A #12` · `TASDIQ-2146 §15 #45`
- **Δ 2026-07-11→08-07:** ⭐ `58ae162e` (07-13) — `is_confidential` bayrog'i + `kanbanConfidentialClause` (umumiy taxtadan yashirish) qurildi. **2026-07-11 "ustun yo'q" da'vosi endi eskirgan**; kuzatuvchi-whitelist qismi hamon ochiq.

### EP-KANBAN-076 · Kuzatuvchining @eslatma (mention) qilishi (v2-Q46)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — ha, @ bilan chaqirilgan odamga xabar boradi (aniq murojaat).
- **Manba:** A-default
- **Dalil (kod):** `Item C46` (2026-07-11): "`addComment` — stores raw `content` text with **no mention parsing or notification fan-out**." **Δ jonli 2026-08-07: qurilgan** — `drizzle-kanban-cards.repo.ts:202-224`, izohi bandning o'zini keltiradi: "§15 #46: @mention → xabar. Parse `@username` tokens from the comment, resolve them against real usernames … and fan out a 'mention' notification to each mentioned user — excluding the author (no self-notify)". `WHERE username = ANY(${mentionTokens}::text[]) AND id <> ${userId}`, `type: 'mention'`.
- **Nima yetishmaydi:** — (fan-out ishlaydi). ⚠️ `Item #125` ajratgan "@xabar (faqat o'qish) vs @so'rov (vazifa tushadi)" farqi bu yerda **yo'q** — hamma @ bir xil xabar (qv. EP-KANBAN-125).
- **Bog'liqlik:** EP-KANBAN-125 (#125 @xabar vs @so'rov), EP-KANBAN-029 (izoh tasmasi), EP-KANBAN-072
- **action:** EVENT (`comment.mention`)
- **⤳ Ta'sir:** NTF
- **Xoch-havolalar:** `[Module-15] Item C46` · `[Module-15] Item #76` · `TASDIQ-2146 §15 #46` · `TASDIQ-2146 §15 #76`
- **Δ 2026-07-11→08-07:** ⭐ **Audit-da'vosi endi eskirgan** — `@mention` tahlili + xabar fan-out'i `addComment` ichida qurildi (`username` bo'yicha, o'z-o'ziga xabar yubormaydi).

### EP-KANBAN-077 · Vazifaning majburiy maydonlari (v2-Q47)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — sarlavha + mas'ul + muddat + kategoriya majburiy; izoh ixtiyoriy (to'liq va yengil).
- **Manba:** A-default
- **Dalil (kod):** `Item C47`: "`KanbanCardCreateSchema` marks title/assignedTo/dueDate **all `.optional()`**, and `category` doesn't exist as a field at all (C26)." **Δ jonli 2026-08-07:** yaratishda hamon ixtiyoriy, **lekin** "Jarayonda"ga o'tish uchun mas'ul+muddat majburiy bo'ldi (C6 darvozasi, EP-KANBAN-036); `task_type` maydoni `taxonomy_entries` ga bog'lanib qo'shildi (EP-KANBAN-056).
- **Nima yetishmaydi:** yaratish sxemasida 4 maydonning majburiyligi; `category` maydonining o'zi yo'q (`Item C47`: "blocked on `category` existing first"; "Owner-gated — migration sign-off for the `category` column").
- **Bog'liqlik:** EP-KANBAN-056 (C26 kategoriya — oldingi shart), EP-KANBAN-036 (C6 darvozasi), EP-KANBAN-047 (muddat)
- **action:** CREATE (`task.requiredFields`)
- **⤳ Ta'sir:** Hamma Kanban
- **Xoch-havolalar:** `[Module-15] Item C47` · `[Module-15] Item #77` · `TASDIQ-2146 §15 #47`
- **Δ 2026-07-11→08-07:** Bilvosita yaxshilandi (C6 darvozasi + `task_type`), lekin yaratish-vaqtidagi majburiylik o'zgarmadi.

### EP-KANBAN-078 · Bitta vazifaga ko'p mas'ulmi yoki bitta (v2-Q48)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi (javobgarlik aniq).
- **Manba:** A-default
- **Dalil (kod):** `Item C48` (**Ha**): "`owner_user_id` (single FK on `kanban_cards`) plus dedicated **`kanban_co_executors`** and **`kanban_observers`** tables each with their own GET/POST/DELETE endpoints; the **three-role split genuinely exists in both schema and API**." Jonli 2026-08-07: `kanban-ext-flow.service.ts` da Observers/Co-Execs bo'limlari mavjud.
- **Nima yetishmaydi:** — (model to'liq). ⚠️ Ammo hissa-ulush (GSD) bo'linishi (`Item #102`) hamon yo'q — u alohida band (EP-KANBAN-102).
- **Bog'liqlik:** EP-KANBAN-102 (#102 hissa-ulush), EP-KANBAN-070 (kuzatuvchi), EP-KANBAN-010 (A10 — faqat asosiy mas'ul ko'radi)
- **action:** CREATE (`task.assigneeModel`)
- **⤳ Ta'sir:** KPI/GSD, HR
- **Xoch-havolalar:** `[Module-15] Item C48` · `[Module-15] Item #78` · `TASDIQ-2146 §15 #48` · `TASDIQ-2146 §15 #78`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-079 · Vazifani boshqa odamga o'tkazish (qayta biriktirish) (v2-Q49)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — o'tkazishda sabab yoziladi, "X dan Y ga o'tdi" tarixda qoladi (shaffof).
- **Manba:** A-default
- **Dalil (kod):** `Item C49`: "`assignCard` — updates `owner_user_id` directly; `AssignCardSchema` accepts **no reason field**, and **no history table write** occurs anywhere in the method." **Δ jonli 2026-08-07:** `bulkAssignCards` (`84195e55`, 07-10) ommaviy tayinlash qo'shildi (`Item A24` talabi), lekin u ham sabab/tarix yozmaydi; `PUT cards/:id/reject` (`e8156412`) esa **sababni majburiy** qiladi — ya'ni naqsh modulda mavjud, qayta-tayinlashda qo'llanmagan.
- **Nima yetishmaydi:** `Item C49`: "no reason capture and no 'X→Y' audit trail exist" — sabab maydoni va o'tish-tarixi jadvali.
- **Bog'liqlik:** EP-KANBAN-023 (bo'limlararo uzatish), EP-KANBAN-033/039 (bir xil tarix-jadval kerak), EP-KANBAN-013 (reject naqshi)
- **action:** UPDATE (`task.reassign`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C49` · `[Module-15] Item #79` · `[Module-15] Item A24` *(bog'liq)* · `TASDIQ-2146 §15 #49`
- **Δ 2026-07-11→08-07:** `84195e55` (07-10) — `bulkAssignCards` (ta'til/50+ vazifa uchun ommaviy tayinlash, `Item A24`); sabab/tarix hamon yo'q.

### EP-KANBAN-080 · Kichik vazifalar (checklist) (v2-Q50)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ha, vazifa ichida belgilanadigan checklist; hammasi belgilanmaguncha yopilmaydi (to'liq nazorat).
- **Manba:** A-default
- **Dalil (kod):** `Item C50`: "`drizzle-kanban-cards.repo.ts:32-105` (checklist CRUD+toggle) and `kanban-checklist.controller.ts` — **full checklist infrastructure is real and wired**; read `completeCard` — it **never queries checklist-item completion state** before allowing the card to complete." Jonli 2026-08-07: `drizzle-kanban-cards.repo.ts:112` — "toggle-to-reopen (step N): every LATER step (position > N) is re-locked" — ya'ni **zanjir-qulf** (`Item C64`/`#94`) qurilgan.
- **Nima yetishmaydi:** `Item C50`: "the **completion-gate itself is not enforced**" — checklist to'lmasa ham karta yopiladi. ⚠️ `Item A23` (Telegram-yopish checklist to'lmasa BLOK) ham shu bo'shliqqa tayanadi.
- **Bog'liqlik:** EP-KANBAN-037 (C7 yopish dalili), EP-KANBAN-094 (C64 zanjir-qulf), EP-KANBAN-085 (A23 Telegram-yopish)
- **action:** CREATE (`task.checklist`)
- **⤳ Ta'sir:** Kanban
- **Xoch-havolalar:** `[Module-15] Item C50` · `[Module-15] Item #80` · `[Module-15] Item A23` *(bog'liq)* · `TASDIQ-2146 §15 #50`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-081 · Vazifa bilan ishlab chiqarish buyurtmasini bog'lash (v2-Q51)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ixtiyoriy ravishda buyurtma/stanok/mijozga bog'lanadi (kuchli aloqa).
- **Manba:** A-default
- **Dalil (kod):** `Item C51`: "`related_type`/`related_id` columns exist on `kanban_cards` (`schema-kanban.ts:39-40`) and are **genuinely populated** for sales orders (`createKanbanForOrder` sets `related_type='sales_order'`, confirmed live in `kanban-cards.repo.ts:171-180`)." **Δ:** `854ee24e` (07-13) — kartaga `station_operator` (stansiya-operator) maydoni qo'shildi (C2 to'plami), ya'ni stanok tomoni qisman yopildi.
- **Nima yetishmaydi:** `Item C51`: "no station(stanok)-specific or customer(mijoz)-specific UI/linking was found beyond the order case" — mijozga bevosita bog'lanish yo'q (faqat buyurtma orqali bilvosita); `related_type` uchun ruxsat etilgan qiymatlar lug'ati (master-data) yo'q.
- **Bog'liqlik:** EP-KANBAN-097 (#97 har buyurtma = karta), EP-KANBAN-101 (#101 operator-stansiya), EP-KANBAN-127 (#127 buyurtma o'zgarsa)
- **action:** UPDATE (`task.linkOrder`)
- **⤳ Ta'sir:** Ishlab chiqarish, Sotuv, Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item C51` · `[Module-15] Item #81` · `TASDIQ-2146 §15 #51`
- **Δ 2026-07-11→08-07:** `854ee24e` (07-13) — kartaga `station_operator` + `progress` + `qoldiq_tolov` + `comment_flag` maydonlari qo'shildi (C2 to'plami).

### EP-KANBAN-082 · Bekor qilingan vazifa holati (yopilgandan farqi) (v2-Q52)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — alohida "Bekor qilindi" holati, sabab majburiy (toza hisob).
- **Manba:** A-default
- **Dalil (kod):** `Item C52`: "`moveOrderCardToCancelled` in full — real, wired: moves cards to a column matching `ILIKE '%bekor%'`/`'%cancel%'` or soft-deletes them, appending a fixed `[Bekor qilindi: orderNumber]` note." Jonli 2026-08-07: bu yo'l **faqat hodisa orqali** ishlaydi — `OrderCancelledKanbanHandler` (`order-cancelled-kanban.handler.ts:31`); foydalanuvchi uchun "kartani bekor qilish" endpoint'i topilmadi.
- **Nima yetishmaydi:** `Item C52`: "there is **no dedicated `cancelled` enum value** and **no operator-supplied mandatory-reason field** (the note is auto-generated, not user input)". Ustun nomiga (`ILIKE '%bekor%'`) tayanish mo'rt — kanonik ustun-seed bo'lmagani uchun (EP-KANBAN-031) ko'p taxtada bunday ustun yo'q va karta **soft-delete** bo'lib ketadi.
- **Bog'liqlik:** EP-KANBAN-104 (#104 'Отменен' arxiv), EP-KANBAN-031 (ustun seed), EP-KANBAN-025 (status master)
- **action:** UPDATE (`task.cancel`)
- **⤳ Ta'sir:** Hisobotlar (haqiqiy bajarilish foizi)
- **Xoch-havolalar:** `[Module-15] Item C52` · `[Module-15] Item #82` · `[Module-15] Item A17` *(bog'liq)* · `TASDIQ-2146 §15 #52`
- **Δ 2026-07-11→08-07:** `d2098c77` (07-13) — bekor qilingan kartalar **KPI'da neytral** hisoblanadigan bo'ldi (`Item A17` talabi: "Bekor qilingan qism KPI ta'siri faqat inson tasdig'i"), ya'ni "toza hisob" maqsadi qisman bajarildi.

### EP-KANBAN-083 · Vazifa izohlari va fayl biriktirish (v2-Q53)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — rasm + fayl + ovozli izoh biriktirsa bo'ladi (to'liq dalil). (v1-Q29 bilan bir mavzu, kengaytirilgan.)
- **Manba:** A-default; card-files mavjud
- **Dalil (kod):** `Item C53`: "`ALLOWED_UPLOAD_EXT` — includes `.mp3`,`.wav`,`.ogg` alongside images/docs via the same generic upload endpoint." `Item #83` qo'shadi: "`task_chat_message_files` (chat attachments) **is live**". `Item A48` talabi: fayl chegara 10MB + async virus-scan + QC 8D/CAPA link.
- **Nima yetishmaydi:** `Item C53`: "there is **no dedicated in-app voice-recorder UI/endpoint** — audio is only supported as a generic file type". `Item A48` ning virus-scan va QC 8D/CAPA bog'lanishi ham yo'q.
- **Bog'liqlik:** EP-KANBAN-029 (v1-Q29 — bir xil mavzu), EP-KANBAN-121 (#121 blank/forma)
- **action:** CREATE (`task.attachment.media`)
- **⤳ Ta'sir:** Sifat nazorati, Ombor
- **Xoch-havolalar:** `[Module-15] Item C53` · `[Module-15] Item #83` · `[Module-15] Item A48` *(bog'liq)* · `EXTRACTION QISM A #48` · `TASDIQ-2146 §15 #53`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-084 · Vazifa ko'rinishi (kim qaysi vazifani ko'radi) (v2-Q54)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — xodim o'zini + bo'lim ishlarini, boshliq butun bo'limni, yuqori daraja yuqoridan ko'radi (bosqichli).
- **Manba:** A-default; Org-struktura
- **Dalil (kod):** `Item C54` **STALE-DOC**: "`kanban-visibility.helper.ts` … docstring states '**APPROVED: egasi vizyon-qurish 2026-07-01**'. `kanbanCardVisibilityPredicate` restricts visibility to self/observer/co-executor/**manager's-department-tree (recursive)**/same-department; `super_admin`/`director` see everything. `getAllCards`/`getBoardCards` **both apply** `this.cardVisibilityClause(user)`." Jonli 2026-08-07: `kanbanConfidentialClause` ham qo'shildi (`58ae162e`).
- **Nima yetishmaydi:** `Item C54`: "though `getAllCards` still caps at `LIMIT 500` within the now-filtered set" — katta taxtalarda kesilish xavfi (pagination yo'q).
- **Bog'liqlik:** EP-KANBAN-016 (taxta qamrovi), EP-KANBAN-075 (maxfiylik), EP-KANBAN-120 (#120)
- **action:** READ (`task.visibility`)
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik
- **Xoch-havolalar:** `[Module-15] Item C54` · `[Module-15] Item #84` · `TASDIQ-2146 §15 #54` · `TASDIQ-2146 §15 #84`
- **⚠️ ZIDDIYAT:** `TASDIQ-2146 §15` jadvali "Yo'q — `LIMIT 500` hammasi, scope yo'q" deydi; `Item C54` buni **eskirgan** deb belgilaydi — real org-ierarxiya scoping'i 2026-07-01 da egasi tasdig'i bilan qurilgan.
- **Δ 2026-07-11→08-07:** `58ae162e` (07-13) — ko'rinish predikatiga maxfiylik bandi (`kanbanConfidentialClause`) qo'shildi.

### EP-KANBAN-085 · Telegramdan vazifa yaratish/yopish (v2-Q55)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tasdiq)*
- **Talab:** A — Telegramdan ochish/yopish/izoh, ERP bilan sinxron (qulay). ⚠️ CC Telegram bot infratuzilmasi mavjud (`cc-bot`).
- **Manba:** A-default; CC `cc-bot` (mavjud)
- **Dalil (kod):** `Item C55`: "Read `apps/api/src/telegram/handlers/kanban.handler.ts` in full (**71 lines**) — only outbound `onTaskAssigned`/`onTaskDueSoon`; **no inbound command parsing of any kind**." Jonli 2026-08-07 tasdiqlandi va **yomonroq**: bu ikki chiquvchi metod ham hech qayerdan chaqirilmaydi (EP-KANBAN-019 dagi ziddiyat).
- **Nima yetishmaydi:** kiruvchi Telegram webhook buyruq-ishlovchisi (ochish/yopish/izoh) va ERP sinxronizatsiyasi. `Item A23` qo'shimcha talabi: Telegramdan yopishda checklist to'lmasa **BLOK** + fayl xavfsiz saqlash. `Item C55`: "Owner-gated — **Telegram bot webhook/token scope must be provisioned**" (egasi-DATA).
- **Bog'liqlik:** EP-KANBAN-019/044 (Telegram kanali), EP-KANBAN-080 (checklist darvozasi), VR-KANBAN-I06
- **action:** CREATE (`task.viaTelegram`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram bot), NTF
- **Xoch-havolalar:** `[Module-15] Item C55` · `[Module-15] Item #85` · `[Module-15] Item A23` *(bog'liq)* · `TASDIQ-2146 §15 #55` · `TASDIQ-2146 §15 #85`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-086 · НО-3 kun-yakuni hisoboti vazifaga aylanadimi (K1)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har ish kuni 17:30 da mas'ul savatiga "НО-3 kun-yakuni hisoboti" vazifasi avtomat tug'iladi, topshirilmasa ertasi qizil (intizom).
- **Manba:** A-default; kitob (Оргполитика НО-3 kun-yakuni)
- **Dalil (kod):** `Item C56`: "`kanban-recurring.cron.ts:23` — `@Cron('0 7 * * *')`, i.e. **07:00 not 17:30**, and generic (daily/weekly/monthly), **no fixed НО-3 template**. `SELECT name FROM kanban_templates` → the 4 seeded templates are 'Bosim bosib chiqarish tartibi / Dizayn loyihasi / Mijoz buyurtmasini qayta ishlash / HR onboarding' — **none named НО-3**."
- **Nima yetishmaydi:** 17:30 cron'i va НО-3 shabloni (`Item C56`: "Owner-gated — **the НО-3 checklist content/template itself needs owner definition**" → egasi-DATA). Takror-cron infratuzilmasi mavjud, kengaytirish kifoya.
- **Bog'liqlik:** EP-KANBAN-054 (takror-cron asosi), EP-KANBAN-055 (kun yopilishi), EP-KANBAN-110 (Оргполитика shablon)
- **action:** CRON (`task.no3.dailyReport`)
- **⤳ Ta'sir:** Coordination (doklad oqimi), HR intizom
- **Xoch-havolalar:** `[Module-15] Item C56` · `[Module-15] Item #86` · `TASDIQ-2146 §15 #56` · `TASDIQ-2146 §15 #86`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-087 · Aniqlangan kamchilik → tuzatish vazifasi (K2)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — aniqlangan kamchilik → aybdor xodim va boshlig'i savatiga "izoh ber / tuzat" vazifasi, 24h muddat (yopiq tsikl).
- **Manba:** A-default; kitob (kun-tartibi nazorati)
- **Dalil (kod):** `Item C57` (2026-07-11): "`grep -rniE \"fromDeficiency|deficiency\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**." **Δ jonli 2026-08-07: yarmi qurilgan** — `34ceed0f` (07-13) `QcFailedKanbanHandler` (QC brak → avto-karta) + `MesBreakdownKanbanHandler` (`5093fe43`, 08-04, uskuna nosozligi → avto-karta) `kanban.module.ts:51-63` da ro'yxatdan o'tgan; 24h SLA zanjiri `TT_SLA_ESCALATION` orqali mavjud (`50456109`).
- **Nima yetishmaydi:** kartani **aybdor xodim + uning boshlig'i** ga marshrutlash yo'q (boshliq zanjiri umuman yo'q — EP-KANBAN-042); "izoh ber / tuzat" javob-oqimi (yopiq tsikl) qurilmagan; `Item A13` talab qilgan **dedup** (bir xil brak takror karta yaratmasligi) tekshirilmagan.
- **Bog'liqlik:** EP-KANBAN-042 (boshliq zanjiri), EP-KANBAN-113 (#113 brak→vazifa), EP-KANBAN-003 (24h)
- **action:** EVENT (`task.fromDeficiency`)
- **⤳ Ta'sir:** Coordination, HR
- **Xoch-havolalar:** `[Module-15] Item C57` · `[Module-15] Item #87` · `[Module-15] Item A13` *(bog'liq)* · `EXTRACTION QISM A #13` · `TASDIQ-2146 §15 #57`
- **Δ 2026-07-11→08-07:** ⭐ `34ceed0f` (07-13) — QC/MES/Design → Kanban avto-karta triggerlari; `5093fe43` (08-04) — MES uskuna-nosozligida avto-karta. **2026-07-11 "0 matches" da'vosi endi qisman eskirgan** (nom boshqa: `deficiency` emas, `QcFailed`/`MesBreakdown`).

### EP-KANBAN-088 · Kun-tartibi vaqt-bloklarini shaxsiy dasturdan himoyalash (K3)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — tanaffus/tushlik/namoz bloklari "qotirilgan band slot", ustiga vazifa qo'yilsa ogohlantiradi (real kun).
- **Manba:** A-default; kitob (tanaffus 10:00–10:20, tushlik 12:00–13:30, namoz vaqtlari)
- **Dalil (kod):** `Item C58`: "Depends **entirely** on the Personal Program module (C18), confirmed absent." `Item #88` bir xil. `Item A31` qo'shimcha: qotirilgan slot **HR smena API** dan avto-hisoblanishi kerak.
- **Nima yetishmaydi:** shaxsiy dastur moduli yo'q → qotirilgan slot tushunchasi ham yo'q. ⚠️ Vaqt qiymatlari (10:00–10:20, 12:00–13:30, namoz) — **threshold/master-data**, qurilganda CRUD orqali sozlanishi kerak.
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-089 (smena tushligi), EP-KANBAN-049 (slot)
- **action:** READ (`personalProgram.fixedSlots`)
- **⤳ Ta'sir:** HR, Shaxsiy dastur
- **Xoch-havolalar:** `[Module-15] Item C58` · `[Module-15] Item #88` · `[Module-15] Item A31` *(bog'liq)* · `TASDIQ-2146 §15 #58`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-089 · 3-smenalik tushlik — smena bo'yicha avtomat slot (K4)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smena bo'yicha tushlik avtomat dasturga tushadi, smena oxirida "keyingi smenaga o'tkaziladigan ish" so'raladi (uzluksizlik).
- **Manba:** A-default; kitob (3-smenalik tushlik)
- **Dalil (kod):** `Item C59`: "Same as C58 — Personal Program **absent**." `Item #89` bir xil. Estafeta yarmi: `Item #112` (tugamagan buyurtma keyingi smenaga estafeta) va `Item A11` (estafeta rad/kechiksa 30 daqiqa → log + MES handover) ham qurilmagan.
- **Nima yetishmaydi:** smena-asosli slot mantig'i va smena-oxiri estafeta so'rovi (`Item C59`: "part of the C18 build (shift-based slot logic)").
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-088, EP-KANBAN-112 (#112 estafeta), EP-KANBAN-067
- **action:** CRON (`personalProgram.shiftLunch`)
- **⤳ Ta'sir:** Ishlab chiqarish (smena), HR
- **Xoch-havolalar:** `[Module-15] Item C59` · `[Module-15] Item #89` · `[Module-15] Item A11` *(bog'liq)* · `TASDIQ-2146 §15 #59`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-090 · Ta'tilda vazifa topshirish (handover) majburiy bosqichmi (K5)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ta'til boshidan oldin ochiq vazifalar ro'yxati chiqadi, har biriga o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi (uzluksizlik).
- **Manba:** A-default; kitob ("узлуксизлигини йўқолмаслиги")
- **Dalil (kod):** `Item C60`: "`grep -rniE \"handover\" apps/api/src/modules/kanban --include=*.ts` → **0 matches** (identical finding to A4)." `Item #90` bir xil ("handover guard"). Qisman qoplama: `bulkAssignCards` (`84195e55`) ommaviy o'tkazishni osonlashtiradi (`Item A24`), lekin ta'til-tasdiq darvozasi emas.
- **Nima yetishmaydi:** HR ta'til-tasdiq oqimida darvoza (`Item C60`: "Owner-gated — **HR leave-approval workflow ownership**"); `Item A4` qo'shimcha talabi: topshiruvchi inaktiv bo'lsa HR handover o'rinbosari avto-tasdiqlasin.
- **Bog'liqlik:** EP-KANBAN-091 (C61 qaytarish), EP-KANBAN-079 (qayta tayinlash), EP-KANBAN-022 (A19 ta'tilda takror-vazifa)
- **action:** APPROVE (`task.vacationHandover`)
- **⤳ Ta'sir:** HR (ta'til so'rovi), Coordination
- **Xoch-havolalar:** `[Module-15] Item C60` · `[Module-15] Item #90` · `[Module-15] Item A4` *(bog'liq)* · `EXTRACTION QISM A #4` · `TASDIQ-2146 §15 #60`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-091 · O'rinbosarga o'tgan vazifa qaytadimi (K6)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — vaqtinchalik o'tkazma: ta'til davrida o'rinbosar mas'ul, qaytganda avtomat asl egaga qaytadi, oraliq harakat tarixda (toza).
- **Manba:** A-default; kitob (vazifa o'tkazish)
- **Dalil (kod):** `Item C61`: "Same grep as C60 — **no delegation/return cron exists anywhere** in the kanban module." `Item #91` bir xil.
- **Nima yetishmaydi:** delegatsiya-kuzatuv jadvali + o'rinbosar ta'tili tugashida avto-qaytarish cron'i (`Item C61`: "Code-buildable-now — build a delegation-tracking table + auto-return cron"). "Oraliq harakat tarixda" ham EP-KANBAN-079 dagi tarix-jadval bo'shlig'iga tayanadi.
- **Bog'liqlik:** EP-KANBAN-090 (C60 — oldingi shart), EP-KANBAN-079 (tarix), EP-KANBAN-022 (A19 takror-vazifa ta'tilda)
- **action:** CRON (`task.handover.return`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C61` · `[Module-15] Item #91` · `TASDIQ-2146 §15 #61` · `TASDIQ-2146 §15 #91`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-092 · НО mas'ul-shaxs roli bo'yicha avtomat biriktiruv (K7)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — jarayon shabloni tanlansa, har qadam НО-1/РД-4/ТХ ga avtomat biriktiriladi (qoida-asosli).
- **Manba:** A-default; kitob (НО-1/НО-2/НО-3, РД-4, ТХ mas'ullar)
- **Dalil (kod):** `Item C62`: "`SELECT count(*) FROM kanban_templates` → **4** (confirmed live rows); `kanban-templates.seed.ts` — the 4 seeded templates ('Bosim bosib chiqarish tartibi', 'Dizayn loyihasi', 'Mijoz buyurtmasini qayta ishlash', 'HR onboarding') are **generic workflows, none coded as НО-1/РД-4/ТХ**." `Item #92` shu mavzuda ("rol-asosli").
- **Nima yetishmaydi:** `Item C62`: "none of the specific НО-role-coded compliance templates exist, and there is **no НО-role→auto-assignment mapping table**". Shablon+flow infratuzilmasi tayyor, kontent yo'q — bu **egasi-DATA** (НО rollari ro'yxati).
- **Bog'liqlik:** EP-KANBAN-094 (C64 zanjir), EP-KANBAN-121 (#121 forma/blank), EP-KANBAN-110 (Оргполитика)
- **action:** EVENT (`task.template.autoAssign`)
- **⤳ Ta'sir:** HR (onboarding), Coordination (НО bo'lim)
- **Xoch-havolalar:** `[Module-15] Item C62` · `[Module-15] Item #92` · `TASDIQ-2146 §15 #62` · `TASDIQ-2146 §15 #92`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-093 · Vazifaga standart norma-vaqt (НО jadvalidagi 30/20 daqiqa) (K8)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har vazifa-turiga norma-vaqt master-data'da, bajarilgach norma/fakt solishtiriladi (o'lchanadigan).
- **Manba:** A-default; kitob (Suhbat 30 min, ТХ 20 min, buyruq 30 min)
- **Dalil (kod):** `Item C63`: "`kanban_cards.estimated_time` (integer column) plus `kanban_time_tracks` (real start/stop durations) **both exist and are populated**; `grep … norm.*master` → **0 matches** for a per-task-type norm master table." **Δ jonli 2026-08-07:** `kanban_cards.task_type` + `taxonomy_entries` (`category='kanban_task_type'`, `attrs` JSON) qo'shildi (`50456109`) — bu **aynan tur-darajasidagi master-data qatlami**, hozircha faqat `sla_hours` atributi bilan ishlatilmoqda.
- **Nima yetishmaydi:** `attrs` ichida `norm_minutes` kabi norma-vaqt atributi seed qilinmagan; norma/fakt taqqoslash hisobi yo'q (`Item C63`: "norma/fakt comparison is not computed"). ⚠️ 30/20 daqiqa qiymatlari — **master-data**, koddagi konstanta emas.
- **Bog'liqlik:** EP-KANBAN-134 (#134 vaqt-logi normaga taqqos), EP-KANBAN-056 (turkumlash), EP-KANBAN-130 (#130 normadan oshsa eskalatsiya)
- **action:** CREATE (`task.normTime`)
- **⤳ Ta'sir:** KPI/GSD, Ishlab chiqarish OEE
- **Xoch-havolalar:** `[Module-15] Item C63` · `[Module-15] Item #93` · `[Module-15] Item A28` *(bog'liq)* · `TASDIQ-2146 §15 #63` · `TASDIQ-2146 §15 #93`
- **Δ 2026-07-11→08-07:** `50456109` (07-13) — `task_type` → `taxonomy_entries.attrs` tur-darajasidagi override zanjiri qurildi (SLA uchun); norma-vaqt shu naqshga qo'shilishi mumkin.

### EP-KANBAN-094 · Jarayon-shablon (НО-1…РД-4) = zanjir vazifa (K9)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — shablon = bog'langan qadamlar; oldingi yopilmaguncha keyingisi "qulflangan", yopilsa avtomat ochiladi (tartib).
- **Manba:** A-default; kitob (yangi xodim qabuli ketma-ketligi)
- **Dalil (kod):** `Item C64`: "`parent_card_id` column exists and is **now genuinely persisted** on card creation (confirmed under A18, commit `54031ab6`); `grep -rniE \"blocked_by|dependency\"` → **0 matches** for any lock/gate logic." **Δ jonli 2026-08-07:** `drizzle-kanban-cards.repo.ts:112` — **checklist qadamlari uchun** zanjir-qulf qurilgan: "toggle-to-reopen (step N): every LATER step (position > N) is **re-locked**" (`Item A16` "Shablon N-qadam qayta ochilsa — cascade-freeze" talabiga mos).
- **Nima yetishmaydi:** **karta-darajasidagi** qulf yo'q — `parent_card_id` bor, lekin bola-kartani ota yopilmaguncha bloklaydigan darvoza yo'q (`Item C64`); `blocked_by` ustuni ham yo'q (EP-KANBAN-122).
- **Bog'liqlik:** EP-KANBAN-080 (checklist), EP-KANBAN-122 (#122 bosqich bog'liqligi), EP-KANBAN-092 (shablon)
- **action:** EVENT (`task.template.chain`)
- **⤳ Ta'sir:** HR, Coordination
- **Xoch-havolalar:** `[Module-15] Item C64` · `[Module-15] Item #94` · `[Module-15] Item A16` *(bog'liq)* · `TASDIQ-2146 §15 #64` · `TASDIQ-2146 §15 #94`
- **Δ 2026-07-11→08-07:** Checklist darajasida cascade-freeze mavjud; karta darajasida hamon yo'q.

### EP-KANBAN-095 · Mentor (Мураббий) kuzatuv-vazifasi (K10)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mentorga "shogird kuzatuvi" vazifasi o'qish-muddati bilan ochiladi, oxirida "tayyormi/yo'q" baho so'raladi (rasmiy mentorlik).
- **Manba:** A-default; kitob (Мураббий, o'qish muddati)
- **Dalil (kod):** `Item C65`: "`grep -rniE \"mentorWatch\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**." `Item #95` qo'shadi: "+ LMS muddati". `Item A36`: mentor "yo'q" bo'lsa LMS darsligi uzaytiriladi, **avto-test YO'Q**.
- **Nima yetishmaydi:** mentor-kuzatuv vazifasi generatori, LMS muddati bilan bog'lanish, yakuniy baho qadami (`Item C65`: "Owner-gated — **confirm HR's mentor-assignment event contract**").
- **Bog'liqlik:** EP-KANBAN-096 (sinov qarori), LMS moduli, HR adaptatsiya
- **action:** CREATE (`task.mentorWatch`)
- **⤳ Ta'sir:** HR (adaptatsiya), LMS (darslik)
- **Xoch-havolalar:** `[Module-15] Item C65` · `[Module-15] Item #95` · `[Module-15] Item A36` *(bog'liq)* · `TASDIQ-2146 §15 #65` · `TASDIQ-2146 §15 #95`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-096 · Sinov muddati → qaror taymeri (K11)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — sinov tugashiga 3 kun qolganda НО-1/boshliqqa "sinov yakuni qarori" vazifasi tug'iladi (o'tkazib yuborilmaydi).
- **Manba:** A-default; kitob (синов муддати)
- **Dalil (kod):** `Item C66`: "`grep -rniE \"probation\" apps/api/src/modules/kanban --include=*.ts` → **0 matches**." `Item #96` bir xil.
- **Nima yetishmaydi:** HR sinov-muddati sanasiga qarshi rejalashtirilgan tekshiruv va 3 kun oldin qaror-vazifa yaratish (`Item C66`: "Owner-gated — **confirm HR's probation end-date field/API**"). ⚠️ "3 kun" — **threshold**, `business_settings` da bo'lishi kerak.
- **Bog'liqlik:** EP-KANBAN-095 (mentor), HR moduli, EP-KANBAN-054 (cron infratuzilmasi)
- **action:** CRON (`task.probationDecision`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item C66` · `[Module-15] Item #96` · `TASDIQ-2146 §15 #66` · `TASDIQ-2146 §15 #96`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-097 · Ishlab chiqarish buyurtmasi Kanban kartaga aylanadimi (K12)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har buyurtma = ishlab chiqarish taxtasida karta, "Дата готовности" = muddat, holat ustun bo'ylab siljiydi (Excel o'rniga jonli taxta).
- **Manba:** A-default; Производство 2026.xlsx (Наименование/Тираж/Дата готовности/Статус)
- **Dalil (kod):** `Item C67`: "`order-created-kanban.handler.ts` + `createKanbanForOrder` in full — **genuinely creates a card per order** with `related_type='sales_order'`/`related_id=String(orderId)` populated, which **directly contradicts the table's own Izoh** '`related_type=null`'. Live `SELECT count(*) FROM kanban_cards` → **3 rows only**." **Δ jonli 2026-08-07:** `13239a1e` + `de867a08` (08-03) — `kanban_status_column_map` + ilova-ichi CRUD: SD-buyurtma statusi o'zgarganda karta **avtomat mos ustunga ko'chadi** (talabdagi "holat ustun bo'ylab siljiydi" qismi).
- **Nima yetishmaydi:** `Item C67`: "`due_date` … still not derived from the order" — "Дата готовности" kartaga o'tmaydi; jonli DB'da real buyurtma-kartalari yo'q (2026-07-11 RESET dan keyin bo'sh).
- **Bog'liqlik:** EP-KANBAN-081 (bog'lanish), EP-KANBAN-098 (bosqich-ustunlari), EP-KANBAN-127 (#127 buyurtma o'zgarsa)
- **action:** EVENT (`board.orderCard`)
- **⤳ Ta'sir:** Ishlab chiqarish (MES), Savdo, Ombor
- **Xoch-havolalar:** `[Module-15] Item C67` · `[Module-15] Item #97` · `TASDIQ-2146 §15 #67` · `TASDIQ-2146 §15 #97`
- **⚠️ ZIDDIYAT:** `TASDIQ-2146 §15` jadvalining Izohi "`related_type=null`" deydi — `Item C67` buni jonli kod bilan **rad etadi** (`related_type='sales_order'` haqiqatan yoziladi).
- **Δ 2026-07-11→08-07:** ⭐ `13239a1e` + `de867a08` (08-03) — SD-status ↔ kanban-ustun avto-ko'chirish xaritasi (CRUD-sozlanadigan) + DTO spec/APPROVED marker.

### EP-KANBAN-098 · Texnologik bosqichlar (Направление производства) taxta ustuni (K13)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — taxta ustunlari = real texnologik bosqichlar (Флексо/Высечка/Резка/Ламинация…), karta bosqichma-bosqich o'tadi (zavod oqimi).
- **Manba:** A-default; Производство 2026.xlsx (Направление)
- **Dalil (kod):** `Item C68`/`Item #98`: "live column names are `\"as\"`, `\"salom\"`, `\"sALOM\"`, `\"SADSD\"`, `\"SDSD\"`, `\"SALOM\"`, `\"Salom\"`, `\"savol\"`, `\"1231322\"` (**test junk**) alongside a few real ones … — **no technological-stage seed** (Флексо/Высечка/etc.) exists" va "**no MES routing-stage seed is linked to `kanban_columns`**".
- **Nima yetishmaydi:** haqiqiy ishlab chiqarish bosqichlari seed'i va MES marshrutiga ulanish. ⚠️ `Item C68`: "Owner-gated — the **canonical technological-stage list/order** (Флексо/Высечка/...) must come from the owner or MES routing master-data" → **egasi-DATA**.
- **Bog'liqlik:** EP-KANBAN-031/015 (ustun seed), EP-KANBAN-097 (buyurtma kartasi), EP-KANBAN-101 (stansiya-operator)
- **action:** CREATE (`board.techStageColumns`)
- **⤳ Ta'sir:** Ishlab chiqarish (marshrut), Sifat (har bosqich QC)
- **Xoch-havolalar:** `[Module-15] Item C68` · `[Module-15] Item #98` · `TASDIQ-2146 §15 #68` · `TASDIQ-2146 §15 #98`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-099 · Тираж + bajarilgan/qolgan progress kartada (K14)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — kartada tiraj + progress-bar (7000/10000) — aniq holat.
- **Manba:** A-default; Производство 2026.xlsx (Тираж)
- **Dalil (kod):** `Item C69`/`Item #99` (2026-07-11, **Yo'q**): "Full `kanban_cards` column dump (31 columns total) has **no tiraj/qty/quantity/progress column of any kind**." **Δ jonli 2026-08-07: ustun qurilgan** — `schema-kanban.ts:52` `progress: numeric('progress')`, izohi: "Owner 4-field request (2026-07-13, chat): Tiraj/progress" (`854ee24e`); repo interfeysida create/update/read uchtasida ham mavjud (`i-kanban-boards.repo.ts:53,105,130`).
- **Nima yetishmaydi:** ⚠️ **birlik noaniq** — sxema izohi buni ochiq tan oladi: "percent or produced-vs-ordered count; **owner didn't specify unit, Q-40**". "7000/10000" ko'rinishi uchun ikkita son kerak (`total_qty`+`completed_qty`), hozir bitta `numeric` bor; qiymat SD/PP dan avtomat kelmaydi, qo'lda kiritiladi (`Item A9` "Tiraj o'zgarsa progress qayta hisob + PP/MES event" qurilmagan).
- **Bog'liqlik:** EP-KANBAN-133 (#133 stansiya kunlik norma), EP-KANBAN-127 (#127 tiraj o'zgarsa), EP-KANBAN-097
- **action:** READ (`card.progressBar`)
- **⤳ Ta'sir:** Ishlab chiqarish, Ombor (tayyor mahsulot)
- **Xoch-havolalar:** `[Module-15] Item C69` · `[Module-15] Item #99` · `[Module-15] Item A9` *(bog'liq)* · `EXTRACTION QISM A #9` · `TASDIQ-2146 §15 #69` · `TASDIQ-2146 §15 #99`
- **⚠️ ZIDDIYAT:** `Item C69` "Owner-gated — decide the canonical quantity source (SD vs PP) — **two-worlds risk**" deydi; `Item #99` esa "Owner-gated — **none**" deydi. C69 to'g'riroq — manba tanlovi hamon ochiq, va qurilgan `progress` ustuni birligi ham belgilanmagan (Q-40 izohi bilan tan olingan).
- **Δ 2026-07-11→08-07:** ⭐ `854ee24e` (07-13) — `progress` (numeric) ustuni qo'shildi. **2026-07-11 "ustun yo'q" da'vosi endi eskirgan**, lekin birlik/manba ochiq qoldi.

### EP-KANBAN-100 · "Сумма осталось" (qoldiq to'lov) buyurtma kartasida (K15)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — kartada to'lov holati ko'rinadi, qoldiq bo'lsa "Упаковка/Yetkazish" bosqichida ogohlantiradi (moliyaviy nazorat).
- **Manba:** A-default; Производство 2026.xlsx (Сумма/Сумма осталось)
- **Dalil (kod):** `Item #100` (2026-07-11, **Yo'q**): "no `payment_balance` column; `Grep \"payment_balance\" apps/api/src/modules/kanban` → **no matches**." **Δ jonli 2026-08-07:** `854ee24e` (07-13) qoldiq-to'lovni qo'shdi, **lekin ataylab ustun sifatida emas** — `schema-kanban.ts:50-51` izohi: "qoldiq-to'lov is **deliberately NOT a stored column** here — it's **computed on read** from [FIN]" (ikki-dunyo/dublikat xavfini oldini olish uchun to'g'ri qaror).
- **Nima yetishmaydi:** talabning **ikkinchi** yarmi — "Упаковка/Yetkazish bosqichida ogohlantirish/blok" yo'q. `Item A29` (to'lov qoldig'i >0 → Eltib berish BLOK, FIN override) qurilmagan; `Item #100`: "Owner-gated — **cross-module wiring rule (block vs. warn, FIN override authority) is an owner policy decision**" → egasi-qaror.
- **Bog'liqlik:** EP-KANBAN-128 (#128 Упаковка→ombor/yetkazish), EP-KANBAN-081, Moliya moduli
- **action:** READ (`card.paymentBalance`)
- **⤳ Ta'sir:** Moliya (debitor), Savdo, Eltib berish
- **Xoch-havolalar:** `[Module-15] Item #100` · `[Module-15] Item A29` *(bog'liq)* · `EXTRACTION QISM A #29` · `TASDIQ-2146 §15 #100`
- **Δ 2026-07-11→08-07:** ⭐ `854ee24e` (07-13) — qoldiq-to'lov **o'qishda hisoblanadigan** (stored emas) qiymat sifatida qo'shildi; blok/ogohlantirish qoidasi egasi-qarorini kutmoqda.

### EP-KANBAN-101 · Operator-stansiya biriktiruvi kartadan ko'rinadimi (K16)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — karta joriy bosqichi bo'yicha biriktirilgan operatorni avtomat ko'rsatadi (stansiya-operator master-data'dan) — javobgarlik aniq.
- **Manba:** A-default; Производство 2026.xlsx (operator-stansiya: Тигель—Юлдашева…)
- **Dalil (kod):** `Item #101` (2026-07-11, **Yo'q**): "`assignCard` sets `owner_user_id` purely from the request body; **no stansiya-operator master-data table or MES join** found." **Δ jonli 2026-08-07:** `schema-kanban.ts:53` — `station_operator_id: integer('station_operator_id')` ustuni qo'shildi (`854ee24e`), izohi: "stansiya-operator — **FK -> `work_centers.id`**"; create/update/read uchtasida ham repo interfeysida bor.
- **Nima yetishmaydi:** ustun **qo'lda** to'ldiriladi — "joriy bosqichi bo'yicha **avtomat**" hal qilish yo'q (bu #98 real bosqich-ustunlarига bog'liq); `Item A25` (stansiya-operator o'zgarsa ochiq kartalar navbatga) va EP-KANBAN-137 ham qurilmagan. `Item #101`: "Owner-gated — the **stansiya-operator master-data itself must come from MES** (module 8)".
- **Bog'liqlik:** EP-KANBAN-098 (#98 bosqich-ustunlari), EP-KANBAN-137 (A25 operator o'zgarishi), EP-KANBAN-061 (avto-taklif)
- **action:** READ (`card.stationOperator`)
- **⤳ Ta'sir:** HR (stansiya biriktiruvi), Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #101` · `[Module-15] Item A25` *(bog'liq)* · `EXTRACTION QISM A #25` · `TASDIQ-2146 §15 #101`
- **Δ 2026-07-11→08-07:** ⭐ `854ee24e` (07-13) — `station_operator_id` (→ `work_centers.id`) ustuni qo'shildi. **2026-07-11 "master-data yo'q" da'vosi endi qisman eskirgan**; avtomatik hal qilish qismi ochiq.

### EP-KANBAN-102 · Yordamchi (Ёрдамчи) roli kartada (K17)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — kartada "ijrochi" + "yordamchi" alohida rollar, har biriga hissa ulushi yoziladi (adolatli GSD).
- **Manba:** A-default; Производство 2026.xlsx (Ёрдамчи)
- **Dalil (kod):** `Item #102`: "`SELECT column_name … table_name='kanban_co_executors'` → only `id, card_id, user_id, created_at` — **no share/percentage column**. `Grep \"GSD\" apps/api/src/modules/kanban` → **no matches**." Rol-ajratmasining o'zi esa **bor** (`Item C48`, EP-KANBAN-078).
- **Nima yetishmaydi:** `share_percent` ustuni va HR/Payroll GSD hisobiga ulanish. `Item #102`: "Owner-gated — the **GSD split formula/policy for co-executors is an owner/HR business rule**" → egasi-qaror. ⚠️ Ulush foizlari — **threshold**, `business_settings`/master-data'da bo'lishi kerak.
- **Bog'liqlik:** EP-KANBAN-078 (rol modeli — qurilgan), EP-KANBAN-014 (karta↔GSD), HR/Payroll moduli
- **action:** UPDATE (`card.helperRole`)
- **⤳ Ta'sir:** KPI/GSD, HR
- **Xoch-havolalar:** `[Module-15] Item #102` · `[Module-15] Item A8` *(bog'liq)* · `TASDIQ-2146 §15 #102`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-103 · Заявка (qog'oz/material so'rovi) → ta'minot vazifasi (K18)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — karta "Печать" bosqichiga yaqinlashganda kerakli qog'oz yo'q bo'lsa avtomat ta'minot savatiga "Заявка" vazifasi (uzluksiz ta'minot).
- **Manba:** A-default; Заявка бумаги.xlsx
- **Dalil (kod):** `Item #103`: "`Grep \"warehouse_stock|purchase_order\" apps/api/src/modules/kanban` → **no matches**; **no listener for a material-shortage event** registered in `kanban.module.ts`." `Item A14` qo'shimcha talabi: `warehouse_stock` **rezervi** ham hisobga olinsin; `Item A38`: ta'minot vazifasidan oldin **ochiq PO** tekshirilsin (MM yetakchi).
- **Nima yetishmaydi:** WMS/MM kam-qoldiq hodisasiga obuna va avto-vazifa. `Item #103`: "Owner-gated — needs confirmation **WMS/MM emits such an event**".
- **Bog'liqlik:** EP-KANBAN-136 (#136 заявка miqdori taqqos), EP-KANBAN-098 (Печать bosqichi), WMS/MM modullari
- **action:** EVENT (`task.materialRequest`)
- **⤳ Ta'sir:** Ombor, Ta'minot, Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #103` · `[Module-15] Item A14` *(bog'liq)* · `[Module-15] Item A38` *(bog'liq)* · `EXTRACTION QISM A #14` · `TASDIQ-2146 §15 #103`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-104 · Buyurtma bekor qilinganda (Отменен) kartaga nima bo'ladi (K19)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — "Отменен" alohida holat, sabab majburiy, arxivga ketadi lekin hisobotda ko'rinadi (sababli iz).
- **Manba:** A-default; Производство 2026.xlsx (Статус: Отменен)
- **Dalil (kod):** `Item #104`: "`moveOrderCardToCancelled` **is live** (registered via `OrderCancelledKanbanHandler` in `kanban.module.ts:15,38`) — moves linked cards to a 'bekor/cancel'-named column or soft-deletes, and appends an **automatic** cancellation note. **No mandatory user-input reason field, no dedicated cancelled-status enum**."
- **Nima yetishmaydi:** `Item #104`: "the '**sabab majburiy**' (mandatory reason) requirement is **not enforced anywhere**"; alohida `cancelled` status qiymati yo'q (ustun-nomiga tayanadi); "arxivga ketadi lekin hisobotda ko'rinadi" — soft-delete bo'lgan kartalar hisobotlarda ko'rinmasligi mumkin.
- **Bog'liqlik:** EP-KANBAN-082 (v2-Q52 — bir xil), EP-KANBAN-025 (status master), EP-KANBAN-006 (arxiv)
- **action:** UPDATE (`card.cancelled`)
- **⤳ Ta'sir:** Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item #104` · `[Module-15] Item C52` · `[Module-15] Item A26` *(bog'liq)* · `TASDIQ-2146 §15 #104`
- **Δ 2026-07-11→08-07:** `d2098c77` (07-13) — bekor qilingan kartalar KPI'da neytral (`Item A17`). ⚠️ `Item A26` (buyurtma bekor → bajarilgan bosqich materiali GL chiqit hisobiga) hamon yo'q.

### EP-KANBAN-105 · Дата готовности kechikishi eskalatsiyasi (savdoga ham) (K20)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-08-07 Δ)*
- **Talab:** A — Дата готовности o'tsa: ishlab chiqarish boshlig'i + savdo menejeriga avtomat xabar (mijozdan oldin biz bilamiz) — proaktiv.
- **Manba:** A-default; Производство 2026.xlsx (Дата готовности)
- **Dalil (kod):** `Item #105` **STALE-DOC**: "cron … (commit `2cecb84c`, dated **2026-07-03**) runs daily `@Cron('0 9 * * *')`, finds `kanban_cards` with `due_date < CURRENT_DATE AND completed_at IS NULL`, and inserts `notifications` rows for both `owner_user_id` (high priority) and `assigner_user_id` (normal priority), deduped per-card-per-day via `NOT EXISTS`. The row's Izoh '**cron=0; overdue faqat read**' is **contradicted**." **Δ jonli 2026-08-07:** BullMQ `OVERDUE_ESCALATION` + kuzatuvchilarga xabar (`d8d59973`).
- **Nima yetishmaydi:** `Item #105`: "the cron notifies the card's owner+assigner **generically** by `due_date`, **not specifically 'savdo' (sales dept) + 'boshliq' (manager chain)**, and there is **no distinct 'Дата готовности' field** — it reuses generic `due_date`." `Item A27` (kechikish eskalatsiyasi CRM murojaatni avto-yangilaydi) ham yo'q.
- **Bog'liqlik:** EP-KANBAN-042 (boshliq zanjiri), EP-KANBAN-026, EP-KANBAN-097 (Дата готовности manbasi), CRM moduli
- **action:** CRON (`card.dueEscalation`)
- **⤳ Ta'sir:** Savdo, CRM (mijoz)
- **Xoch-havolalar:** `[Module-15] Item #105` · `[Module-15] Item C10` · `[Module-15] Item A27` *(bog'liq)* · `TASDIQ-2146 §15 #105`
- **⚠️ ZIDDIYAT:** `TASDIQ-2146 §15` Izohi "cron=0; overdue faqat read" — `Item #105` buni jonli kod bilan **rad etadi** (cron 2026-07-03 dan beri jonli, ekstraksiya hujjatidan 4 kun oldin).
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) BullMQ ko'chirish; `d8d59973` (07-10) kuzatuvchilarga xabar. Savdo/boshliq marshruti hamon yo'q.

### EP-KANBAN-106 · "Примечание" (maxsus shart) karta yuzida (K21)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — maxsus shart karta yuzida badge bo'lib turadi, bosqichdan o'tishda tasdiqlatadi (xatosizlik).
- **Manba:** A-default; Производство 2026.xlsx (Примечание)
- **Dalil (kod):** `Item #106` (2026-07-11, **Yo'q**): "no `special_note`/`badge`/`primechanie` column; `Grep \"примечание|special_note\"` in module → **no matches**." **Δ jonli 2026-08-07:** `schema-kanban.ts:54` — `comment_flag: boolean('comment_flag').notNull().default(false)`, izohi: "**Izoh-belgi ('has important note')**" (`854ee24e`, "Owner 4-field request 2026-07-13").
- **Nima yetishmaydi:** talabning **ikkinchi** yarmi — "bosqichdan o'tishda **tasdiqlatadi**" darvozasi yo'q (`assertCanMoveTo()` `comment_flag` ni tekshirmaydi). `Item A43` aynan shuni talab qiladi: "Примечание badge tasdiq operatorga (E4), **o'tish BLOK**".
- **Bog'liqlik:** EP-KANBAN-032/036 (o'tish darvozalari), EP-KANBAN-081 (karta maydonlari)
- **action:** READ (`card.noteBadge`)
- **⤳ Ta'sir:** Ishlab chiqarish, Sifat
- **Xoch-havolalar:** `[Module-15] Item #106` · `[Module-15] Item A43` · `EXTRACTION QISM A #43` · `TASDIQ-2146 §15 #106`
- **Δ 2026-07-11→08-07:** ⭐ `854ee24e` (07-13) — `comment_flag` (Izoh-belgi) ustuni qo'shildi. **2026-07-11 "ustun yo'q" da'vosi endi eskirgan**; o'tish-bloki qismi ochiq.

### EP-KANBAN-107 · Korporativ raqam berish (НО-2) jarayon-shabloni (K22)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Korporativ raqam berish" shabloni: raqam ber → НО-2 yo'riqnoma → Инспекция nazoratga qo'shildi (har qadam vazifa).
- **Manba:** A-default; kitob (НО-2, Инспекция)
- **Dalil (kod):** `Item #107`: "`SELECT name FROM kanban_templates` → live rows are 'Bosim bosib chiqarish tartibi', 'Dizayn loyihasi', 'Mijoz buyurtmasini qayta ishlash', 'HR onboarding' — **none correspond to НО-2/Инспекция/corporate-numbering**."
- **Nima yetishmaydi:** НО-2 shablon qatori va uning checklist qadamlari. `Item #107`: "Owner-gated — the **exact НО-2 process steps/checklist content is an owner-provided standard**" → egasi-DATA. Infratuzilma tayyor (`kanban_templates` + flows).
- **Bog'liqlik:** EP-KANBAN-092 (C62 НО shablonlari), EP-KANBAN-094 (zanjir), EP-KANBAN-110 (Оргполитика)
- **action:** EVENT (`task.template.corpNumber`)
- **⤳ Ta'sir:** HR, Inspeksiya/Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item #107` · `[Module-15] Item C62` · `TASDIQ-2146 §15 #107`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-108 · Vazifa "лавозим папкаси" (lavozim-karta)ga bog'lanadimi (K23)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — vazifa avval lavozim-kartaga, keyin xodimga ko'rinadi; xodim ketsa vazifa kartada qoladi (karta-markazli).
- **Manba:** A-default; karta-markazli model + kitob (lavozim papkalari)
- **Dalil (kod):** `Item #108`: "Column dump of `kanban_cards` confirms **only `owner_user_id`** (a direct user FK) — **no `card_id`/position-link column** exists to route through an org KARTA first."
- **Nima yetishmaydi:** `position_card_id` ustuni va tayinlashda karta-egasidan `owner_user_id` ni hal qilish (`resolveCardGate` naqshiga o'xshab). ⚠️ `Item #108`: "this is explicitly the project's **larger 'karta-markaz' migration** … an architecture decision already flagged owner-scale elsewhere, **not kanban-specific work**".
- **Bog'liqlik:** EP-KANBAN-014 (v1-Q14 — bir xil), EP-KANBAN-132 (#132 dublikat), EP-KANBAN-003 (A3 egasiz karta eskalatsiyasi)
- **action:** UPDATE (`task.linkPositionCard`)
- **⤳ Ta'sir:** Org-struktura (karta model), HR
- **Xoch-havolalar:** `[Module-15] Item #108` · `[Module-15] Item #132` · `[Module-15] Item A3` *(bog'liq)* · `TASDIQ-2146 §15 #108`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-109 · Vazifa toifasi seriya bo'yicha (Компания/Ташкилот/Производство) (K24)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — vazifa toifasi master-data, filtr va hisobot shu bo'yicha (tartibli).
- **Manba:** A-default; kitob (siyosat seriyalari)
- **Dalil (kod):** `Item #109` (2026-07-11, **Yo'q**): "no `category`/`series` column on `kanban_cards`; only **free-form `kanban_tags`/`kanban_card_tags`** (`schema-kanban.ts:163-176`) exist, which are **not a fixed enum/master-data taxonomy**." **Δ jonli 2026-08-07:** `task_type` + `taxonomy_entries` (`category='kanban_task_type'`) master-data zanjiri qo'shildi (`50456109`) — bu **aynan** kerakli naqsh, faqat 3 ta seriya qiymati bilan seed qilinmagan.
- **Nima yetishmaydi:** 3 seriya (Компания/Ташкилот/Производство) qiymatlari seed qilinmagan; filtr/hisobot kesimi yo'q. `Item #109`: "Owner-gated — **confirming the exact 3 (or more) toifa values** and their business meaning" → egasi-DATA.
- **Bog'liqlik:** EP-KANBAN-056 (C26 kategoriya — o'xshash o'q), EP-KANBAN-077 (#77 majburiy maydon), EP-KANBAN-093 (#93 tur-norma)
- **action:** CREATE (`task.policySeriesCategory`)
- **⤳ Ta'sir:** Hisobotlar
- **Xoch-havolalar:** `[Module-15] Item #109` · `TASDIQ-2146 §15 #109`
- **Δ 2026-07-11→08-07:** `50456109` (07-13) — `taxonomy_entries` asosidagi tur-master zanjiri qurildi; seriya qiymatlari egasi-DATA sifatida ochiq.

### EP-KANBAN-110 · Оргполитика "Харакатлар детализацияси" → vazifa-shablon manbai (K25)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har оргполитика → vazifa-shablon (qadamlar + mas'ul + vaqt), siyosat e'lon qilinganda faollashadi (siyosat→ijro yopiq).
- **Manba:** A-default; kitob (Харакатлар детализацияси)
- **Dalil (kod):** `Item #110`: "**No policy-related listener** registered in `kanban.module.ts` `eventHandlers` array (line 38, only `Order*` handlers); `Grep` across the kanban module for policy-conversion logic **returns nothing**." Jonli 2026-08-07: `eventHandlers` endi 7 ta (Order×3 + Qc + Mes×2 + Design) — siyosat-ishlovchisi hamon yo'q.
- **Nima yetishmaydi:** siyosat-e'lon hodisasi tinglovchisi va `policy.target_cards[]` bo'yicha karta yaratish. `Item #110`: "Owner-gated — needs confirmation the **org-policy module emits such an event** and defines `target_cards[]` (per QISM-A decision **#35**, also unimplemented)".
- **Bog'liqlik:** EP-KANBAN-024 (rasporyajenie — o'xshash bo'shliq), EP-KANBAN-092/107 (shablonlar), EP-KANBAN-108 (A35 target = lavozim-karta)
- **action:** EVENT (`task.template.fromPolicy`)
- **⤳ Ta'sir:** Coordination, HR, butun zavod
- **Xoch-havolalar:** `[Module-15] Item #110` · `[Module-15] Item A35` *(oldingi shart)* · `EXTRACTION QISM A #35` · `TASDIQ-2146 §15 #110`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-111 · Vazifaga "Тасаввурдаги мукаммал манзара" (kutilgan natija) maydoni (K26)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har vazifaga "kutilgan natija" maydoni; tasdiqlovchi shunga qarab qabul qiladi (sifat darvozasi).
- **Manba:** A-default; kitob (Тасаввурдаги мукаммал манзара)
- **Dalil (kod):** `Item #111`: "Column dump confirms **no `expected_outcome` column**; only `description` and `completion_report` (**post-hoc**) exist on `kanban_cards`."
- **Nima yetishmaydi:** `expected_outcome` matn ustuni + yaratish formasida ko'rsatish + qabul-mezoni sifatida taqdim etish (`Item #111`: "Owner-gated — **none**" → to'liq qurilishi mumkin).
- **Bog'liqlik:** EP-KANBAN-037 (yopish dalili), EP-KANBAN-123 (#123 sifat-baho), EP-KANBAN-027 (tasdiq)
- **action:** CREATE (`task.expectedOutcome`)
- **⤳ Ta'sir:** Sifat nazorati, KPI
- **Xoch-havolalar:** `[Module-15] Item #111` · `TASDIQ-2146 §15 #111`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-112 · Smena oxirida tugamagan buyurtmani keyingi smenaga estafeta (K27)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — smena oxirida tugamagan kartalar keyingi smenaga "o'tkazma" ro'yxati, qabul qiluvchi operator tasdiqlaydi (estafeta yopiq).
- **Manba:** A-default; kitob (3 smena)
- **Dalil (kod):** `Item #112`: "`Grep \"shift-relay|shiftRelay|estafeta\"` in `apps/api/src/modules/kanban` → **no matches**; **no MES shift-handover integration** found." `Item A11` qo'shimcha talabi: estafeta rad etilsa yoki 30 daqiqa kechiksa → logga + MES handover.
- **Nima yetishmaydi:** smena-oxiri cron/hodisa, o'tkazma ro'yxati, qabul-tasdiq qadami. `Item #112`: "Owner-gated — needs **MES module's shift-handover event/API confirmed**".
- **Bog'liqlik:** EP-KANBAN-089 (C59 smena tushligi), EP-KANBAN-067 (smena vaqti), EP-KANBAN-101 (operator), MES moduli
- **action:** CRON (`card.shiftRelay`)
- **⤳ Ta'sir:** Ishlab chiqarish (smena), HR
- **Xoch-havolalar:** `[Module-15] Item #112` · `[Module-15] Item A11` *(bog'liq)* · `EXTRACTION QISM A #11` · `TASDIQ-2146 §15 #112`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-113 · Brak/qayta ishlash (Резка/Высечка xatosi) vazifaga aylanadimi (K28)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — bosqichda brak belgilansa: miqdor + sabab + "qayta ishlash" vazifasi, GSD/sifatga ulanadi (yo'qotish ko'rinadi).
- **Manba:** A-default; kitob (Высечка/Резка/Каширование brak)
- **Dalil (kod):** `Item #113` (2026-07-11, **Yo'q**): "`Grep \"brak\"` (case-insensitive) → **no matches**; **no QC-defect event handler** registered in `kanban.module.ts`." **Δ jonli 2026-08-07: qurilgan** — `34ceed0f` (07-13) `QcFailedKanbanHandler` `kanban.module.ts:51-63` da ro'yxatdan o'tgan (QC brak → avto-karta); `5093fe43` (08-04) `MesBreakdownKanbanHandler`.
- **Nima yetishmaydi:** kartada **miqdor + sabab** maydonlari yo'q (brak hajmi yozilmaydi); GSD/jarima ulanishi yo'q (`Item A13`: jarima **QC kanalidan** kelishi kerak, Kanban'dan emas); `Item A13` talab qilgan **dedup** (bir xil brak takror karta yaratmasligi) tekshirilmagan.
- **Bog'liqlik:** EP-KANBAN-087 (C57 kamchilik→tuzat), EP-KANBAN-102 (GSD), EP-KANBAN-099 (miqdor), QC moduli
- **action:** EVENT (`task.reworkFromDefect`)
- **⤳ Ta'sir:** Sifat nazorati, Ombor (chiqit), Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #113` · `[Module-15] Item #87` · `[Module-15] Item A13` · `EXTRACTION QISM A #13` · `TASDIQ-2146 §15 #113`
- **Δ 2026-07-11→08-07:** ⭐ `34ceed0f` (07-13) — QC/MES/Design → Kanban avto-karta triggerlari qo'shildi. **2026-07-11 "no QC-defect event handler" da'vosi endi eskirgan.**

### EP-KANBAN-114 · Stansiya navbati (ochered) — kartalar tartibi (K29)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — har stansiya ustunida kartalar Дата готовности + ustuvorlik bo'yicha avtomat saralanadi (adolatli navbat).
- **Manba:** A-default; Производство 2026.xlsx (ФСМ navbat)
- **Dalil (kod):** `Item #114`: "`moveCard` only reorders `sort_order` when **explicitly given** in the request — there is **no automatic sort-by-priority+due_date routine**, and **no `stansiya`/station column** exists on `kanban_cards`." **Δ jonli 2026-08-07:** stansiya tomoni yopildi — `station_operator_id` ustuni qo'shildi (`854ee24e`), lekin saralash mantig'i qo'shilmadi.
- **Nima yetishmaydi:** `priority DESC, due_date ASC` bo'yicha `sort_order` ni qayta hisoblaydigan job/trigger (`Item #114`: "Code-buildable-now"). `Item #115` (ichki/tashqi belgi) ham shu saralashga qo'shilishi kerak.
- **Bog'liqlik:** EP-KANBAN-060 (C30 — bir xil talab), EP-KANBAN-101 (stansiya ustuni), EP-KANBAN-115 (#115 ichki/tashqi)
- **action:** READ (`station.queueSort`)
- **⤳ Ta'sir:** Ishlab chiqarish rejasi (APS/CRP)
- **Xoch-havolalar:** `[Module-15] Item #114` · `[Module-15] Item C30` · `TASDIQ-2146 §15 #114`
- **Δ 2026-07-11→08-07:** `854ee24e` (07-13) — `station_operator_id` qo'shildi (bog'liqlik yopildi), avtomatik saralash hamon yo'q.

### EP-KANBAN-115 · "Академияга" (ichki) buyurtmalar alohida oqimmi (K30)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ichki ("Академия") va tashqi buyurtmalar belgi bilan ajraladi, tashqi to'lovli ustuvor (to'g'ri tartib).
- **Manba:** A-default; Производство 2026.xlsx ("Академияга")
- **Dalil (kod):** `Item #115`: "Column dump confirms **no `internal_flag` column** on `kanban_cards`; `Grep \"internal_flag\"` in module → **no matches**." `Item A42` bir xil mavzu: ichki ("Академия") buyurtma AI da **PAST ustuvorlik** (E3).
- **Nima yetishmaydi:** `is_internal` boolean ustuni va uni saralashga qo'shish (`Item #115`: "feeds into #114 (auto-sort) once both exist"). ⚠️ Ustuvorlik siyosati (ichki past / tashqi to'lovli yuqori) — egasi-qaror.
- **Bog'liqlik:** EP-KANBAN-114 (saralash), EP-KANBAN-057 (ustuvorlik), EP-KANBAN-100 (to'lov holati)
- **action:** UPDATE (`order.internalFlag`)
- **⤳ Ta'sir:** Savdo, Ishlab chiqarish reja
- **Xoch-havolalar:** `[Module-15] Item #115` · `[Module-15] Item A42` *(bog'liq)* · `EXTRACTION QISM A #42` · `TASDIQ-2146 §15 #115`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-116 · Kun boshida "bugungi reja"ni boshliqqa ko'rsatish (K31)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ertalab xodim "bugungi reja"ni tasdiqlaydi, boshliq ko'radi (faqat ko'rish) — shaffof.
- **Manba:** A-default; kitob (kun-tartibi nazorati)
- **Dalil (kod):** `Item #116`: "**No personal-program BE exists** (same absence confirmed for #88/#89) for a manager-approved daily plan to attach to." FE'dagi `MyPlanView.tsx` faqat o'z kartalarini guruhlaydi — boshliq ko'rinishi yo'q.
- **Nima yetishmaydi:** shaxsiy dastur moduli (ildiz) + boshliq-ko'rish qadami. `Item #116`: "Owner-gated — the **personal-program feature scope itself needs owner design sign-off**".
- **Bog'liqlik:** EP-KANBAN-048 (ildiz), EP-KANBAN-051 (C21 boshliq tasdig'i), EP-KANBAN-007
- **action:** READ (`personalProgram.showToManager`)
- **⤳ Ta'sir:** Coordination, HR intizom
- **Xoch-havolalar:** `[Module-15] Item #116` · `[Module-15] Item C21` · `[Module-15] Item #88` · `TASDIQ-2146 §15 #116`
- **⚠️ ZIDDIYAT:** v2-Q21 (EP-KANBAN-051) "boshliq **tasdiqlaydi** (yoki o'zgartiradi)" deydi; K31 (bu band) "boshliq **faqat ko'radi**" deydi. Ikki qaror bir-biriga zid — egasi muvofiqlashtirsin.
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-117 · Deadline cho'zish (muddat surish) tasdiqlanadimi (K32)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — boshliq bergan vazifa muddatini surish boshliq tasdig'i bilan (sabab); o'z vazifasini o'zi suradi (balans).
- **Manba:** A-default
- **Dalil (kod):** `Item #117`: "`updateCard` applies `due_date = COALESCE(${input.due_date}, due_date)` **unconditionally** — **any caller** with module-level Roles access can extend a deadline with **no approval gate or reason capture**."
- **Nima yetishmaydi:** tasdiq-so'rovi oqimi (yoki boshliq-cheklovli guard) + majburiy sabab. `Item #117`: "Owner-gated — whether extension requires **prior approval vs. post-hoc manager notification** is a process decision" → egasi-qaror. ⚠️ `Item A22` (muddat cho'zilsa SD/PP hodisasi bilan avto-yangilanadi) ham qurilmagan.
- **Bog'liqlik:** EP-KANBAN-065 (rollover muddati), EP-KANBAN-047 (muddat), EP-KANBAN-027 (tasdiq naqshi)
- **action:** APPROVE (`task.extendDeadline`)
- **⤳ Ta'sir:** Org, HR
- **Xoch-havolalar:** `[Module-15] Item #117` · `[Module-15] Item A22` *(bog'liq)* · `EXTRACTION QISM A #22` · `TASDIQ-2146 §15 #117`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-118 · Vazifani "qaytarish" (men bajarmayman) — sabab bilan (K33)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07, jonli tasdiq)*
- **Talab:** A — qaytarish mumkin (sabab majburiy), bergan odamga qaytadi va u qayta yo'naltiradi (tirik oqim).
- **Manba:** A-default
- **Dalil (kod):** `Item #118` (2026-07-11, **Yo'q**): "Full read of `kanban-cards.controller.ts` shows only `acceptCard`/`completeCard`/`assignCard` mutation endpoints — **no `reject`/`return-to-sender` endpoint exists anywhere** in the controller." ⚠️ **Bu noto'g'ri.** Jonli 2026-08-07: `kanban-cards.controller.ts:268` `@Put('cards/:id/reject')` + `RejectCardSchema` (`:62-64`) — `reason: z.string().min(1).max(5000)` (**majburiy**), `rejectCard(id, userId, dto.reason)` kartani topshiruvchiga qaytaradi. Commit `e8156412`, **2026-07-10** (auditdan bir kun oldin), `git merge-base --is-ancestor … HEAD` bilan tasdiqlangan.
- **Nima yetishmaydi:** — (endpoint + majburiy sabab + topshiruvchiga qaytarish mavjud). "U qayta yo'naltiradi" qismi `assignCard` orqali qo'lda bajariladi (avtomatik taklif yo'q).
- **Bog'liqlik:** EP-KANBAN-013 (v1-Q13 — bir xil mexanizm), EP-KANBAN-079 (qayta tayinlash), EP-KANBAN-012
- **action:** REJECT (`task.returnToSender`)
- **⤳ Ta'sir:** Coordination, NTF
- **Xoch-havolalar:** `[Module-15] Item #118` · `TASDIQ-2146 §15 #118`
- **⚠️ ZIDDIYAT:** ⭐ `Item #118` "no `reject`/`return-to-sender` endpoint exists **anywhere** in the controller" — **jonli kod bilan rad etildi**. `e8156412` 2026-07-10 da HEAD'ga kirgan, audit esa 2026-07-11 da uni ko'rmagan (auditning "full read" da'vosi eskirgan snapshot ustida bajarilgan).
- **Δ 2026-07-11→08-07:** Kod o'zgarmadi; **audit-da'vosi rad etildi**.

### EP-KANBAN-119 · Shoshilinch belgisini kim qo'ya oladi (НО tartibiga mos) (K34)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — "Срочно" belgisini faqat boshliq/topshiriq beruvchi qo'yadi (belgi qadrli qoladi). ⚠️ v2-Q28 (yaratuvchi taklif→boshliq tasdiq) bilan mos.
- **Manba:** A-default; kitob (НО tartibi)
- **Dalil (kod):** `Item #119`: "`kanban_cards.priority` is a live `varchar(20) DEFAULT 'normal'` column settable via `createCardFlat`/`updateCard` by **anyone** with the controller's role set; `Grep \"urgentLimit\"` → no matches, confirming **no per-role restriction or daily-count limit**." ⚠️ Ikkinchi qismi **noto'g'ri** — jonli 2026-08-07: `KANBAN_MAX_URGENT_PER_DAY = 2` chegarasi `kanban-boards.service.ts:381` va `drizzle-kanban-cards.repo.ts:294` da majburlanadi (qv. EP-KANBAN-059).
- **Nima yetishmaydi:** **rol-cheklovi** — "faqat boshliq qo'ya oladi" hamon yo'q; har qanday `employee` roli `priority='urgent'` qo'ya oladi (kunlik 2 ta kvota doirasida).
- **Bog'liqlik:** EP-KANBAN-059 (kunlik chegara — qurilgan), EP-KANBAN-058 (C28 tasdiq oqimi), EP-KANBAN-057
- **action:** UPDATE (`task.urgentPermission`)
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-15] Item #119` · `[Module-15] Item C29` · `[Module-15] Item C28` · `TASDIQ-2146 §15 #119`
- **⚠️ ZIDDIYAT:** `Item #119` "**no** … daily-count limit" deydi — jonli kod buni **rad etadi** (`KANBAN_MAX_URGENT_PER_DAY = 2` ikki yozish-yo'lida ishlaydi). Audit `urgentLimit` naqshini qidirgan, kod `MAX_URGENT_PER_DAY` nomini ishlatadi.
- **Δ 2026-07-11→08-07:** Kod o'zgarmadi; audit-da'vosining **kvota qismi rad etildi**, **rol qismi tasdiqlandi**.

### EP-KANBAN-120 · Maxfiy vazifa (inspeksiya/qoidabuzarlik) — kim ko'radi (K35)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — "Maxfiy" belgisi: faqat beruvchi+ijrochi+boshliq ko'radi, taxtada ko'rinmaydi (maxfiylik).
- **Manba:** A-default; kitob (Инспекция)
- **Dalil (kod):** `Item #120` (2026-07-11, **Yo'q**): "Column dump confirms **no `confidential` column** on `kanban_cards` (same evidence as #75/#45)." **Δ jonli 2026-08-07: qurilgan** — `58ae162e` (07-13) `is_confidential` ustuni + `kanban-visibility.helper.ts` dagi `kanbanConfidentialClause` (umumiy taxtadan yashiradi); `kanban-boards.service.ts:132-159` create/update orqali sozlanadi.
- **Nima yetishmaydi:** ko'rinish doirasi **aynan** "beruvchi+ijrochi+boshliq" ga toraytirilganini tasdiqlash kerak — `kanbanConfidentialClause` ning aniq predikati bu bandda tekshirilmagan; `Item A12` (maxfiy intizom-tergovga avto-kuzatuvchi QO'SHILMAYDI) qurilmagan.
- **Bog'liqlik:** EP-KANBAN-075 (C45 — bir xil ustun), EP-KANBAN-084 (ko'rinish predikati), EP-KANBAN-126 (#126 hayfa)
- **action:** READ (`task.confidential`)
- **⤳ Ta'sir:** Inspeksiya bo'limi, HR, Xavfsizlik
- **Xoch-havolalar:** `[Module-15] Item #120` · `[Module-15] Item #75` · `[Module-15] Item C45` · `[Module-15] Item A12` · `TASDIQ-2146 §15 #120`
- **Δ 2026-07-11→08-07:** ⭐ `58ae162e` (07-13) — `is_confidential` + `kanbanConfidentialClause`. **2026-07-11 "ustun yo'q" da'vosi endi eskirgan.**

### EP-KANBAN-121 · Vazifa-shablonga forma/blank biriktirish (ariza/буйруқ/Заявка) (K36)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — shablon vazifaga kerakli forma biriktirilgan keladi (Заявка, ariza, buyruq), to'ldirilib ilova qilinadi (tayyor namuna).
- **Manba:** A-default; kitob (har harakatga blank/forma)
- **Dalil (kod):** `Item #121`: "`kanban_files` is **card-level and live**; `kanban_templates` only has `checklistItems`/`columnsConfig` JSONB — **no file-attachment field at the template level**."
- **Nima yetishmaydi:** `Item #121`: "template-level '**comes with a pre-attached form/blank**' is not implemented" — shablon qatoriga fayl biriktirish maydoni yo'q, shu sababli shablondan yaratilgan kartaga forma avtomat ko'chmaydi.
- **Bog'liqlik:** EP-KANBAN-029/083 (karta fayllari — qurilgan), EP-KANBAN-092/107 (shablonlar), EP-KANBAN-110
- **action:** CREATE (`task.template.attachForm`)
- **⤳ Ta'sir:** Hujjat aylanmasi, HR
- **Xoch-havolalar:** `[Module-15] Item #121` · `TASDIQ-2146 §15 #121`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-122 · Bosqich bog'liqligi (Ламинация Печать tugamasdan boshlanmaydi) (K37)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — karta "X tugamaguncha bloklangan" deb ko'rsatiladi, X yopilsa avtomat ochiladi (to'g'ri ketma-ketlik).
- **Manba:** A-default; kitob/marshrut (Ламинация←Печать)
- **Dalil (kod):** `Item #122`: "Column dump confirms **no `blocked_by` column**; `parent_card_id` exists (used for sub-tasks per commit `54031ab6`) but **no code … enforces it as a move-gate** — `moveCard` performs the column change unconditionally." ⚠️ Jonli 2026-08-07: `moveCard` endi **shartsiz emas** (`assertCanMoveTo` bor), lekin u faqat C6/WIP/assigner tekshiradi — bog'liqlik emas.
- **Nima yetishmaydi:** `blocked_by` FK ustuni + ko'chirishdan oldin bloklovchi kartaning ochiqligini tekshirish (`Item #122`: "Owner-gated — **none**" → to'liq qurilishi mumkin). EP-KANBAN-005 dagi "kim kutilmoqda" semantikasi ham shu ustunni talab qiladi.
- **Bog'liqlik:** EP-KANBAN-094 (#94 shablon zanjiri — bir xil mexanizm), EP-KANBAN-005 (kutilmoqda), EP-KANBAN-098 (marshrut)
- **action:** EVENT (`card.blockedBy`)
- **⤳ Ta'sir:** Ishlab chiqarish marshruti
- **Xoch-havolalar:** `[Module-15] Item #122` · `[Module-15] Item #94` · `[Module-15] Item C64` · `TASDIQ-2146 §15 #122`
- **Δ 2026-07-11→08-07:** `moveCard` ga `assertCanMoveTo()` darvozasi qo'shildi — bog'liqlik tekshiruvini shu joyga ulash endi arzon.

### EP-KANBAN-123 · Bajarilgach sifat-baho (НО tasdig'i bilan) (K38)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yopilishda ixtiyoriy sifat-baho (1-5) + izoh, GSD ga o'rtacha bo'lib ulanadi (sifat o'lchovi).
- **Manba:** A-default; kitob (НО tasdig'i)
- **Dalil (kod):** `Item #123`: "`PUT cards/:id/rating` **is live** (`kanban-cards.controller.ts:157-168`), backed by a live `rating` column confirmed in the DB dump, validated via `RateCardSchema` (min 1, max 5, coerced int). `Grep \"GSD\"` in the module → **no matches**, confirming **no averaging into any GSD/KPI calculation**."
- **Nima yetishmaydi:** `Item #123`: "there is **no 'НО tasdig'i'** (approval gate before rating counts) and **no averaging into GSD**". ⚠️ Qisman qoplama: `e87ae0e9` (07-13) karta-egasi reyting formulasini qo'shdi (`achievement*0.7 − escalation*0.3`), lekin unda **sifat-bahosi** ishtirok etmaydi.
- **Bog'liqlik:** EP-KANBAN-102 (GSD ulush — bir xil bo'shliq), EP-KANBAN-045 (reyting formulasi), EP-KANBAN-111 (kutilgan natija)
- **action:** UPDATE (`task.qualityRating`)
- **⤳ Ta'sir:** KPI/GSD, HR reyting
- **Xoch-havolalar:** `[Module-15] Item #123` · `[Module-15] Item #102` · `[Module-15] Item A39` *(bog'liq)* · `TASDIQ-2146 §15 #123`
- **Δ 2026-07-11→08-07:** `e87ae0e9` (07-13) — karta-egasi reyting formulasi qo'shildi (sifat-bahosini o'z ichiga olmaydi).

### EP-KANBAN-124 · Bo'lim taxtasining kunlik "летучка" ko'rinishi (K39)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — taxtada "летучка rejimi": bugungi vazifalar + kechikkanlar + bloklarni bir ekranda (yig'ilish vositasi).
- **Manba:** A-default; Coordination (kunlik летучка)
- **Dalil (kod):** `Item #124`: "`drizzle-kanban-stats.repo.ts` exposes `getOverdueCards`, `getOverdueReport`, `getTeamMetrics`, `getOverdueInbox` (lines 191-343) as **separate report endpoints** — **no single combined 'standup screen' view/endpoint** composing them was found." **Δ jonli 2026-08-07:** yana bir bo'lak qo'shildi — `GET /api/kanban/resource-allocation` (`36630c78`) + FE `ResourceAllocationView.tsx`.
- **Nima yetishmaydi:** bir ekranga birlashtiruvchi FE sahifasi (`Item #124`: "Owner-gated — the exact **letuchka-screen layout/fields is a UX decision**"); `Item A34` esa buni **materialized view** (5 daqiqada refresh) sifatida talab qiladi — bu ham yo'q. "Bloklar" ustuni EP-KANBAN-122 ga bog'liq (`blocked_by` yo'q).
- **Bog'liqlik:** EP-KANBAN-122 (bloklar manbasi), EP-KANBAN-026 (kechikkanlar), EP-KANBAN-030 (hisobotlar)
- **action:** READ (`board.standupMode`)
- **⤳ Ta'sir:** Coordination (yig'ilish)
- **Xoch-havolalar:** `[Module-15] Item #124` · `[Module-15] Item A34` *(bog'liq)* · `EXTRACTION QISM A #34` · `TASDIQ-2146 §15 #124`
- **Δ 2026-07-11→08-07:** `36630c78` (07-13) — `resource-allocation` endpoint + ko'rinishi qo'shildi (летучка ekranining yana bir bo'lagi, lekin birlashgan ekran emas).

### EP-KANBAN-125 · @xabar vs @so'rov farqi (K40)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — ikki xil: "@xabar" (faqat o'qish) va "@so'rov" (savatga vazifa tushadi, javob talab) — toza farq.
- **Manba:** A-default
- **Dalil (kod):** `Item #125` (2026-07-11): "`addComment` stores `dto.content` as **plain text**; **no mention-type parsing** distinguishing a passive @xabar from an actionable @so'rov exists (same absence as #76)." **Δ jonli 2026-08-07:** `@mention` tahlili **endi bor** (`drizzle-kanban-cards.repo.ts:202-224`, EP-KANBAN-076), lekin u **bitta** tur — hamma `@username` bir xil `type: 'mention'` xabari beradi.
- **Nima yetishmaydi:** ikkinchi tur (`@so'rov`) va undan **sub-vazifa yaratish**. `Item A18` aniqlashtiradi: "@so'rov sub-vazifa **AYTILGAN shaxs savatiga**, muddat **meros** oladi". `Item #125`: "Owner-gated — the exact **syntax distinguishing @xabar vs @so'rov is a UX/product decision**" → egasi-qaror.
- **Bog'liqlik:** EP-KANBAN-076 (mention parser — qurilgan asos), EP-KANBAN-002 (Kiruvchi savat), EP-KANBAN-094 (sub-vazifa)
- **action:** EVENT (`comment.mentionType`)
- **⤳ Ta'sir:** Coordination, savatlar
- **Xoch-havolalar:** `[Module-15] Item #125` · `[Module-15] Item #76` · `[Module-15] Item A18` · `EXTRACTION QISM A #18` · `TASDIQ-2146 §15 #125`
- **Δ 2026-07-11→08-07:** `@mention` parseri qurilgani uchun (EP-KANBAN-076) bu bandni yopish endi faqat **tur-ajratish** ishi qoldi (parser mavjud).

### EP-KANBAN-126 · Hayfa/ogohlantirish (взыскание) yozma iz (K41)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — hayfa = yozma iz (sabab+sana), takrorlanishi sanaladi, HR kartasiga ulanadi (adolatli va kuzatiladigan).
- **Manba:** A-default; kitob (взыскание)
- **Dalil (kod):** `Item #126`: "`Grep \"hayfa|disciplinary|взыскан\"` (case-insensitive) in `apps/api/src/modules/kanban` → **no matches**; **no discipline-record write path or HR-trigger** exists in the module."
- **Nima yetishmaydi:** intizom-yozuvi endpoint'i va HR `discipline_records` ga hodisa. ⚠️ `Item A37` **muhim chegara** qo'yadi: "Intizom (hayfa) **alohida jadval**, KAN taxtada **KO'RINMAYDI**" — ya'ni hayfa Kanban kartasi bo'lmasligi kerak. `Item #126`: "Owner-gated — HR's `discipline_records` **schema/write-permission model must be confirmed**".
- **Bog'liqlik:** EP-KANBAN-120 (maxfiylik), EP-KANBAN-087 (kamchilik→tuzat), HR intizom moduli
- **action:** CREATE (`task.disciplinaryRecord`)
- **⤳ Ta'sir:** HR (intizom), KPI
- **Xoch-havolalar:** `[Module-15] Item #126` · `[Module-15] Item A37` *(chegara)* · `EXTRACTION QISM A #37` · `TASDIQ-2146 §15 #126`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-127 · Mijoz buyurtmasi o'zgargach (Тираж/muddat) kartaga ta'sir (K42)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — savdoda buyurtma o'zgarsa karta avtomat yangilanadi + joriy operator ogohlantiriladi (boshlangan bo'lsa tasdiq so'raladi) — drift yo'q.
- **Manba:** A-default; Производство 2026.xlsx (Тираж o'zgarishi)
- **Dalil (kod):** `Item #127` (**Qisman**, "row's own Izoh is stale re: handler count"): "`kanban.module.ts` registers exactly three event handlers … the third one (commit `9c06c0ec`, **2026-07-09**) was added **after** the row's claim 'faqat OrderCreated+Cancelled handler bor', making that specific line **stale**. But `OrderStatusChangedKanbanHandler` → `appendOrderStatusNote` only appends a **text note on status change** — it does **not** listen for quantity(Тираж) or deadline(muddat) field changes." **Δ jonli 2026-08-07:** `13239a1e` (08-03) — status o'zgarishi endi kartani **mos ustunga ko'chiradi** (`kanban_status_column_map`), shunchaki izoh emas.
- **Nima yetishmaydi:** `Item #127`: "**no `OrderUpdatedEvent`/quantity/deadline listener exists**" — Тираж/muddat o'zgarishi kartaga ta'sir qilmaydi; "joriy operator ogohlantiriladi / boshlangan bo'lsa tasdiq so'raladi" qismi yo'q. `Item A9` (tiraj o'zgarsa progress qayta hisob + PP/MES event) ham yo'q.
- **Bog'liqlik:** EP-KANBAN-097 (buyurtma kartasi), EP-KANBAN-099 (progress), EP-KANBAN-117 (muddat)
- **action:** EVENT (`card.orderSync`)
- **⤳ Ta'sir:** Savdo, Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #127` · `[Module-15] Item A9` *(bog'liq)* · `EXTRACTION QISM A #9` · `TASDIQ-2146 §15 #127`
- **⚠️ ZIDDIYAT:** `TASDIQ-2146 §15` Izohi "faqat `OrderCreated`+`Cancelled` handler bor" — `Item #127` buni **eskirgan** deb belgilaydi (`9c06c0ec`, 2026-07-09). Jonli 2026-08-07 da handler soni **7 ta** (`kanban.module.ts:51-63`).
- **Δ 2026-07-11→08-07:** ⭐ `13239a1e` + `de867a08` (08-03) — status→ustun avto-ko'chirish (CRUD-sozlanadigan xarita); `34ceed0f`/`5093fe43` — QC/MES/Design handler'lari (handler soni 3 → 7).

### EP-KANBAN-128 · Tayyor mahsulot (Упаковка) → ombor/yetkazish vazifasi (K43)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Упаковка" yopilsa: ombor qabul vazifasi + (to'lov to'liq bo'lsa) Eltib berish vazifasi avtomat tug'iladi (yopiq oqim).
- **Manba:** A-default; Производство 2026.xlsx (Упаковка bosqichi)
- **Dalil (kod):** `Item #128`: "a targeted review of `kanban.module.ts`'s `eventHandlers` list show **no stage-close/packaging listener** that creates a warehouse or delivery task."
- **Nima yetishmaydi:** "Упаковка bosqichi yopildi" hodisasi tinglovchisi va WMS/yetkazish kartasi yaratish. `Item #128`: "Owner-gated — needs confirmation **which module/event marks 'Упаковка' stage-close** (MES 8 or PP 7)". To'lov sharti EP-KANBAN-100 (`Item A29` blok/ogohlantirish qarori) ga bog'liq.
- **Bog'liqlik:** EP-KANBAN-100 (to'lov sharti), EP-KANBAN-098 (bosqich-ustunlari), WMS/MES/PP modullari
- **action:** EVENT (`card.toWarehouseDelivery`)
- **⤳ Ta'sir:** Ombor, Eltib berish, Moliya (to'lov sharti)
- **Xoch-havolalar:** `[Module-15] Item #128` · `[Module-15] Item A29` *(bog'liq)* · `TASDIQ-2146 §15 #128`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-129 · Karta rangi mahsulot turi bo'yicha (5х слой/2х слой/гофра/картон) (K44)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — karta mahsulot-turi bo'yicha rang/teg oladi, taxtada tur bo'yicha filtr (tez ajratish).
- **Manba:** A-default; Производство 2026.xlsx (mahsulot turlari)
- **Dalil (kod):** `Item #129`: "`kanbanColumns.color` (`schema-kanban.ts:26`) is a **free `varchar(20)` set manually per column**, not derived from a product-type value; `Grep \"category\"` in the module → **no matches**, confirming **no product-type master table** exists to key color off of." Erkin `kanban_tags`/`kanban_card_tags` bor, lekin tur-taksonomiyasi emas.
- **Nima yetishmaydi:** `product_type` master-jadvali + rang xaritasi + FE filtri. ⚠️ `Item #129`: "Owner-gated — the **гофра/картон product-type taxonomy and color mapping is production-standard data**" → egasi-DATA.
- **Bog'liqlik:** EP-KANBAN-109 (#109 toifa master — o'xshash bo'shliq), EP-KANBAN-056 (kategoriya), EP-KANBAN-031 (ustun rangi)
- **action:** READ (`card.productTypeColor`)
- **⤳ Ta'sir:** Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #129` · `[Module-15] Item #109` · `TASDIQ-2146 §15 #129`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-130 · Qadam norma-vaqtdan oshsa eskalatsiya (НО 30/20 daqiqa) (K45)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — qadam norma-vaqtdan oshsa avtomat boshliqqa ko'rinadi/eslatma (qotib qolish ko'rinadi).
- **Manba:** A-default; kitob (НО norma-vaqt 30/20 min)
- **Dalil (kod):** `Item #130`: "`KanbanOverdueEscalationCron` only checks **`due_date`**, not per-step `estimated_time` vs. actual elapsed time; **no norma master table exists** (same absence as #93/#133)." **Δ jonli 2026-08-07:** `TT_SLA_ESCALATION` (`50456109`) **tur-darajasidagi** SLA zanjirini qurdi (`kanban_cards.sla_hours` → `taxonomy_entries.attrs->>'sla_hours'` → `business_settings`) — bu **aynan** kerakli naqsh, faqat "norma-vaqt" o'lchovi uchun emas, "SLA soat" uchun.
- **Nima yetishmaydi:** `duration_minutes` ni `estimated_time`/norma bilan taqqoslash va oshganda eskalatsiya; boshliqqa marshrut (EP-KANBAN-042 ga bog'liq). ⚠️ `Item #130`: "Owner-gated — the **per-step norma values are production-standard data**" → egasi-DATA.
- **Bog'liqlik:** EP-KANBAN-093 (#93 norma master — oldingi shart), EP-KANBAN-134 (#134 vaqt-logi), EP-KANBAN-042 (boshliq marshruti)
- **action:** CRON (`task.normTimeEscalation`)
- **⤳ Ta'sir:** Coordination, jarayon-shablonlar
- **Xoch-havolalar:** `[Module-15] Item #130` · `[Module-15] Item #93` · `[Module-15] Item #133` · `TASDIQ-2146 §15 #130`
- **Δ 2026-07-11→08-07:** `50456109` (07-13) — tur-darajasidagi `taxonomy_entries.attrs` override zanjiri qurildi; norma-vaqt shu zanjirga `norm_minutes` sifatida qo'shilishi mumkin.

### EP-KANBAN-131 · Arxivdan takror muammo aniqlash (naqsh) (K46)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — arxivdan takrorlanuvchi sabab/brak naqshlari oylik hisobotda ko'rsatiladi (AI yordamida) — ildizga ishlash.
- **Manba:** A-default; "muammo takrorlanmasin" tamoyili
- **Dalil (kod):** `Item #131`: "`deleteCard` performs a **plain soft-delete** with **no analytics hook**; **no AI/pattern-detection service references kanban's archived data** anywhere in the module (matches the memory note that **AI-data tables are 0-rows system-wide**)."
- **Nima yetishmaydi:** arxiv-skanerlash job'i va AI-agent infratuzilmasiga ulanish. ⚠️ `Item #131`: "Owner-gated — depends on the broader **AI-data pipeline** (flagged **system-wide as 0-rows**)" — bu **modul ustidagi** bloker; `Item A30` qo'shadi: naqsh uchun KAN+QC+COR+HR ma'lumoti va **kamida 3 oy** tarix kerak (jonli DB 2026-07-11 da nolga tushirilgan → hozircha tarix yo'q).
- **Bog'liqlik:** EP-KANBAN-006 (arxiv), EP-KANBAN-113 (brak sabablari), AI moduli (17)
- **action:** AI (`archive.patternDetect`)
- **⤳ Ta'sir:** Sifat nazorati, AI-tahlil, KPI
- **Xoch-havolalar:** `[Module-15] Item #131` · `[Module-15] Item A30` · `EXTRACTION QISM A #30` · `TASDIQ-2146 §15 #131`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-132 · Vazifa lavozimga beriladimi (ism emas) (K47)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — vazifa lavozim-kartaga beriladi, joriy egasi avtomat oladi; bo'sh karta bo'lsa boshliqqa tushadi (barqaror adres). (K23 = EP-KANBAN-108 bilan karta-markazli izchillik.)
- **Manba:** A-default; karta-markazli model
- **Dalil (kod):** `Item #132`: "**Identical root cause to #108** — `kanban_cards.owner_user_id` is a direct user-id FK with **no position/karta indirection layer**."
- **Nima yetishmaydi:** lavozim-karta bog'lanishi va tayinlashda joriy egaga hal qilish; "bo'sh karta → boshliqqa" tarmog'i (`Item A3`: egasiz karta — eskalatsiya, **qotib qolish TAQIQ**). ⚠️ `Item #132`: "Owner-gated — same as #108: this is the **project-wide karta-centric migration, not kanban-specific**".
- **Bog'liqlik:** EP-KANBAN-108 (#108 — dublikat), EP-KANBAN-014, EP-KANBAN-137 (stansiya adresi), ORG moduli
- **action:** CREATE (`task.assignToCard`)
- **⤳ Ta'sir:** Org-struktura (karta model), HR
- **Xoch-havolalar:** `[Module-15] Item #132` · `[Module-15] Item #108` · `[Module-15] Item A3` *(bog'liq)* · `EXTRACTION QISM A #3` · `TASDIQ-2146 §15 #132`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-133 · Stansiya kunlik norma — smenaviy plan-fakt (K48)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — har stansiyaga kunlik norma; taxtada "bugun: 6000/8000" plan-fakt; smena yakunida hisobot (o'lchanadigan).
- **Manba:** A-default; Производство 2026.xlsx (stansiya norma)
- **Dalil (kod):** `Item #133`: "**No norma-master table or MES/OEE join** exists anywhere in `apps/api/src/modules/kanban/`; `kanban_cards` has **no quantity/progress columns** either (same evidence as #99)." **Δ jonli 2026-08-07:** ikkala bog'liqlik ham qisman yopildi — `progress` (`854ee24e`) va `station_operator_id` (`854ee24e`) ustunlari qo'shildi.
- **Nima yetishmaydi:** stansiya-darajasidagi norma master-data va MES/OEE bilan birlashtirilgan plan-fakt ko'rinishi. ⚠️ `Item #133`: "Owner-gated — the **daily norma figures (6000/8000) per station are production-standard data**" → egasi-DATA; norma qiymatlari CRUD orqali sozlanishi kerak.
- **Bog'liqlik:** EP-KANBAN-099 (progress), EP-KANBAN-101 (stansiya), EP-KANBAN-093 (norma master), MES moduli
- **action:** READ (`station.dailyNormPlanFact`)
- **⤳ Ta'sir:** Ishlab chiqarish (OEE), KPI/GSD, ish haqi
- **Xoch-havolalar:** `[Module-15] Item #133` · `[Module-15] Item #99` · `[Module-15] Item #101` · `TASDIQ-2146 §15 #133`
- **Δ 2026-07-11→08-07:** `854ee24e` (07-13) — `progress` + `station_operator_id` ustunlari qo'shildi (ikkala oldingi shart qisman yopildi); norma master va MES-birlashmasi hamon yo'q.

### EP-KANBAN-134 · Vazifa-vaqt logi (boshladim/tugatdim) — normaga taqqos (K49)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ixtiyoriy "boshladim/tugatdim" tugmasi vaqtni yozadi, normaga taqqoslanadi (o'lchanadigan, majburlamasdan).
- **Manba:** A-default; kitob (norma-vaqt K8 bilan bog'liq)
- **Dalil (kod):** `Item #134`: "`POST cards/:id/time-entries/start` / `/stop` **are live**, backed by `kanban_time_tracks` (`schema-kanban.ts:149-160`, has `durationMinutes`/`targetMinutes` columns). `getTimeEntries` just lists raw entries — **no comparison logic** against `estimated_time` or a task-type norma was found in the service layer." Jonli 2026-08-07: marshrutlar `kanban-card-files.controller.ts:208-236` da tasdiqlandi.
- **Nima yetishmaydi:** `Item #134`: "**comparing that duration against a norm is not implemented**" — `targetMinutes` ustuni **mavjud, lekin ishlatilmaydi**. ⚠️ `Item A28` qo'shadi: norma-vaqt IoT "boshladim" signalidan olinishi, yo'q bo'lsa status-o'zgarish fallback'i ishlashi kerak; `Item A46`: majburiylik karta `time_tracking_required` bayrog'i + kategoriya bo'yicha aniqlanishi kerak — ikkalasi ham yo'q.
- **Bog'liqlik:** EP-KANBAN-093 (#93 norma master — oldingi shart), EP-KANBAN-130 (normadan oshsa eskalatsiya), EP-KANBAN-011 (soat-blok)
- **action:** EVENT (`task.timeLog`)
- **⤳ Ta'sir:** KPI/GSD, ish haqi (vaqtbay)
- **Xoch-havolalar:** `[Module-15] Item #134` · `[Module-15] Item #93` · `[Module-15] Item A28` *(bog'liq)* · `[Module-15] Item A46` *(bog'liq)* · `TASDIQ-2146 §15 #134`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-135 · Texnika xavfsizligi (ТХ) yo'riqnoma — takrorlanuvchi vazifa (K50)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har stansiya operatoriga davriy "ТХ yo'riqnoma" vazifasi (Менеджер секции ТХ mas'ul), o'tmaganlar qizil ro'yxatda (xavfsizlik intizomi).
- **Manba:** A-default; kitob (ТХ yo'riqnoma 20 min, Менеджер секции ТХ)
- **Dalil (kod):** `Item #135`: "`recurrence_pattern`/`recurrence_interval`/`recurrence_end_date` columns **exist and are used generically** by `KanbanRecurringCron`, but **no ТХ (safety-instruction)-specific seed** exists in `kanban_templates` (only 4 unrelated template names)." **Δ jonli 2026-08-07:** takror-cron BullMQ'ga ko'chdi (`c14bc029`) — infratuzilma yanada ishonchli.
- **Nima yetishmaydi:** ТХ shablon qatori (`recurrence_pattern` bilan) va "o'tmaganlar qizil ro'yxati" ko'rinishi. ⚠️ `Item #135`: "Owner-gated — the actual **ТХ instruction content and its required recurrence interval is an owner/HSE-provided standard**" → egasi-DATA. `Item #135`: "**both need a template seed, not new code**" — ya'ni bu **kod ishi emas, ma'lumot ishi**.
- **Bog'liqlik:** EP-KANBAN-054/022 (takror-cron), EP-KANBAN-086 (#86 — bir xil naqsh), EP-KANBAN-101 (stansiya operatori)
- **action:** CRON (`task.safetyBriefingRecurring`)
- **⤳ Ta'sir:** HR (xavfsizlik), Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #135` · `[Module-15] Item #86` · `[Module-15] Item C56` · `TASDIQ-2146 §15 #135`
- **Δ 2026-07-11→08-07:** `c14bc029` (07-13) — takror-cron BullMQ repeatable job'ga ko'chdi (`Item A50` talabiga mos: "Hamma cron BullMQ (persistent), offline drain").

### EP-KANBAN-136 · Заявка bumagi miqdori (Кг/Лист размер) ombor qoldig'iga taqqos (K51)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Заявка miqdori ombor qoldig'i bilan solishtiriladi: bor bo'lsa rezerv, yetmasa "sotib olish" vazifasi ta'minotga (uzluksiz).
- **Manba:** A-default; Заявка бумаги.xlsx (Грам/Кг/Лист размер)
- **Dalil (kod):** `Item #136`: "Same as #103 — `Grep \"warehouse_stock\"` in `apps/api/src/modules/kanban` → **no matches**; **no WMS/MM comparison logic** exists in the module."
- **Nima yetishmaydi:** `warehouse_stock` bo'yicha qoldiq tekshiruvi, rezerv qo'yish va yetishmasa ta'minot-vazifasi. ⚠️ `Item A14` aniqlashtiradi: `warehouse_stock` ning **rezervlangan** qismi ham hisobga olinsin (erkin qoldiq ≠ umumiy qoldiq). `Item #136`: "**hard dependency on #103** … being built first".
- **Bog'liqlik:** EP-KANBAN-103 (#103 — oldingi shart), WMS/MM modullari, EP-KANBAN-098 (Печать bosqichi)
- **action:** EVENT (`task.materialStockCheck`)
- **⤳ Ta'sir:** Ombor, Ta'minot
- **Xoch-havolalar:** `[Module-15] Item #136` · `[Module-15] Item #103` · `[Module-15] Item A14` · `EXTRACTION QISM A #14` · `TASDIQ-2146 §15 #136`
- **Δ 2026-07-11→08-07:** —

### EP-KANBAN-137 · Operatorni stansiyaga biriktirish o'zgarsa vazifa adresi (K52)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ qisman)*
- **Talab:** A — stansiya-operator biriktiruvi master-data; o'zgarsa o'sha stansiyadagi ochiq kartalar yangi operatorga avtomat ko'rinadi (egasiz qolmaydi). (K47 karta-markazli bilan izchil.)
- **Manba:** A-default; Производство 2026.xlsx (operator-stansiya biriktiruvi)
- **Dalil (kod):** `Item #137`: "**No station-operator master-data table** exists in the kanban module (same absence confirmed for #101), and **no reassignment-event listener** was found for an operator-change event." **Δ jonli 2026-08-07:** `station_operator_id` ustuni (→ `work_centers.id`) qo'shildi (`854ee24e`) — master-data bog'lanishi paydo bo'ldi; `bulkAssignCards` (`84195e55`) ommaviy qayta-tayinlash imkonini beradi (mexanizm tayyor, trigger yo'q).
- **Nima yetishmaydi:** operator-o'zgarishi hodisasi tinglovchisi va o'sha stansiyaning ochiq kartalarini avtomat qayta-tayinlash. ⚠️ `Item A25` qo'shadi: kartalar to'g'ridan-to'g'ri emas, **navbatga** (queue) o'tkazilsin; `Item #137`: "hard dependency on #101 … being built first" — endi qisman bajarildi.
- **Bog'liqlik:** EP-KANBAN-101 (#101 — oldingi shart, qisman yopildi), EP-KANBAN-132 (karta-markazli adres), EP-KANBAN-079 (`bulkAssignCards`)
- **action:** EVENT (`station.reassignTasks`)
- **⤳ Ta'sir:** HR, Ishlab chiqarish
- **Xoch-havolalar:** `[Module-15] Item #137` · `[Module-15] Item #101` · `[Module-15] Item A25` · `EXTRACTION QISM A #25` · `TASDIQ-2146 §15 #137`
- **Δ 2026-07-11→08-07:** `854ee24e` (07-13) `station_operator_id` + `84195e55` (07-10) `bulkAssignCards` — ikkala qurilish-bloki tayyor, faqat hodisa-ulanishi qoldi.

---

## II QISM — EP-kodsiz vizyon-bo'shliqlar (VR-KANBAN-I01..I06)

> Bu bandlar `decisions/15-kanban.md` da EP-kodga bog'lanmagan. Manba: `vision-1000-answers/15-kanban.md`
> (50 tavsiya-javob) va 2026-08-07 jonli tekshiruvi. Har biri `information_schema` / `grep` bilan
> tasdiqlangan — hech biri manbadan ko'chirilmagan (Q-40).

### VR-KANBAN-I01 · `kanban_column_sla` to'ldirilgan, lekin hech qanday kod o'qimaydi
- **Qaror holati:** ✅ JAVOBLANGAN *(EP-KANBAN-045/064 bilan bilvosita)*
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** Ustun bo'yicha SLA (soat) + ogohlantirish chegarasi (%) — karta ustunda belgilangan
  muddatdan uzoq turib qolsa eskalatsiya.
- **Dalil (kod):** Jonli DB: `kanban_column_sla` **10 qator** (column_id 2..11, hammasi
  `sla_hours=24.00`, `warning_threshold_pct=80.00`, 2026-08-03 da yaratilgan). `grep -rn
  "kanban_column_sla" apps/api/src artifacts/erp-dashboard/src` → **faqat sxema ta'rifi**
  (`schema-kanban.ts:114`). Service, controller, cron, FE — **bittasi ham yo'q**.
- **Nima yetishmaydi:** ⚠️ **ASOSIY BLOKER — "ulash" emas, O'LCHASH UCHUN VAQT BELGISI YO'Q**
  (2026-08-07 chuqurroq tekshiruv). `kanban_cards` da `column_id` bor, lekin **«bu ustunga qachon
  kirdi» ustuni yo'q**, va karta-harakati tarixi jadvali ham yo'q (26 ta `kanban_*` jadval
  ko'rildi — bittasi ham harakat tarixini saqlamaydi). `updated_at` ni ishlatish MUMKIN EMAS: u
  har qanday tahrirda (sarlavha, izoh, mas'ul) yangilanadi → soxta SLA buzilishlari chiqadi,
  ya'ni "ishlaydi lekin noto'g'ri" (Q-40).
  Kerak: `kanban_cards.column_entered_at` ustuni **yoki** harakat-tarixi jadvali —
  ⚠️ **ikkalasi ham Q-35 (egasi ruxsati)**. Undan keyingina o'qish qatlami + eskalatsiya + CRUD.
  ⚠️ Boot-guard ham yo'q — jadval yo'qolsa jimgina o'tadi.
- **⚠️ Farqni adashtirmang:** mavjud `TT_SLA_ESCALATION` job'i **vazifa-turi** SLA sini o'lchaydi
  (`kanban_cards.sla_hours` → `taxonomy_entries.attrs->>'sla_hours'` →
  `business_settings.kanban.tt_task_sla_hours_default`, `created_at` dan hisoblanadi).
  `kanban_column_sla` esa **ustun** SLA si — «karta 'Tekshiruvda' ustunida 24 soatdan ko'p
  turmasin». Bu ikki xil o'q; birinchisi ikkinchisini qoplamaydi.
- **Bog'liqlik:** EP-KANBAN-045 (eskalatsiya), Q-35 (yangi ustun/jadval — egasi qarori)
- **action:** CREATE (avval sxema qarori) · **⤳ Ta'sir:** Kanban eskalatsiya, Notifications (`registry/18-notifications.md`)

### VR-KANBAN-I02 · `/api/basket/unified` yo'q — KAN `basket_type` ╳ CC `basket_state` ikki dunyo
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** `vision-1000-answers #1` — CC kanonik manba (`cc_documents.basket_state` LIVE), Kanban
  o'z `basket_type` ni event orqali sinxron yozadi, FE **bitta** `/api/basket/unified` endpointdan
  oladi — "ikkita dunyo EMAS".
- **Dalil (kod):** `grep -rn "basket/unified\|basketUnified" apps/api/src artifacts/erp-dashboard/src`
  → **0 moslik**. Ikkala savat alohida yashaydi: CC `cc-baskets.controller.ts`, Kanban o'z ustunlari.
- **Nima yetishmaydi:** Birlashtirilgan o'qish endpointi + KAN↔CC sinxron event. ⚠️ Bu loyihaning
  bilingan "ikki dunyo" naqshining Kanban-CC ko'rinishi — `registry/20-cc.md` VR-CC-I05 (orfan
  `GET /coordination/baskets`) bilan bir ildizdan.
- **Bog'liqlik:** CC 3-savat (`registry/20-cc.md`), Coordination (`registry/04-coordination.md`)
- **action:** CREATE · **⤳ Ta'sir:** CC, Coordination, FE savat ekranlari

### VR-KANBAN-I03 · "Летучка rejimi" uchun materiallashgan ko'rinish yo'q
- **Qaror holati:** ✅ JAVOBLANGAN *(A-default)*
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** `vision-1000-answers #34` — 30+ terminal bir vaqtda ochganda DB yuki oshmasligi uchun
  materialized view (5 daqiqada refresh) + indeks; oflayn rejimda lokal kesh.
- **Dalil (kod):** Jonli `pg_matviews` → **3 ta** matview bor (`mv_sales_monthly`, `mv_kpi_daily`,
  `mv_inventory_daily`) — ya'ni naqsh loyihada allaqachon ishlatiladi, lekin **Kanban uchun bittasi
  ham yo'q**.
- **Nima yetishmaydi:** Kanban letuchka ko'rinishi + refresh jadvali. ⚠️ Hozir yuk muammosi
  ko'rinmaydi (FULL COMPANY RESET dan keyin kartalar soni kam) — bu kechiktirilgan xavf, mavjud emas.
- **Bog'liqlik:** EP-KANBAN-034 doirasidagi ko'rinish talablari
- **action:** CREATE · **⤳ Ta'sir:** Performance, Director paneli

### VR-KANBAN-I04 · KAN↔PP/MM ta'minot so'rovi uchun outbox koordinatsiyasi yo'q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07, jonli tekshiruv)*
- **Talab:** `vision-1000-answers #14` — `warehouse_stock` o'qilganda PP rezervi hisobga olinsin;
  KAN ta'minot vazifasi va PP reja bir vaqtda chiqmasligi uchun outbox orqali "kichik lock";
  `#38` — MM da ochiq PO bo'lsa yangi vazifa yaratilmasin; `#47` — `InspectionAddedEvent` outbox
  bilan, `event_id` idempotentligi.
- **Dalil (kod):** Kanban modulida outbox jadvali/oqimi topilmadi; `event_id` idempotentlik kaliti
  ham yo'q. Umumiy `domain_events` naqshi loyihada boshqa joyda bor, Kanban ishlatmaydi.
- **Nima yetishmaydi:** Outbox + idempotentlik kaliti. ⚠️ Ayni muammo `registry/20-cc.md`
  VR-CC-I04 da ham qayd etilgan (`cc_outbox` yo'q) — bitta ildiz, ikki modul.
- **Bog'liqlik:** PP (rezerv), MM (ochiq PO), QC (inspeksiya)
- **action:** CREATE · **⤳ Ta'sir:** PP, MM, QC, ta'minot savati

### VR-KANBAN-I05 · BullMQ migratsiyasi QISMAN — 6 cron'dan 3 tasi ko'chgan
- **Qaror holati:** ✅ JAVOBLANGAN *(egasi qarori 2026-07-13)*
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** `vision-1000-answers #50` — HAMMA KAN cron'lari (rollover / eskalatsiya / arxivlash /
  smena-estafeta / norma-eskalatsiya / takrorlanuvchi) BullMQ orqali, `removeOnFail=false`,
  `attempts=3`; "missed job" qayta ishga tushirish mexanizmi bilan.
- **Dalil (kod):** `kanban-cron.processor.ts` real BullMQ processor — `@nestjs/bullmq` `Processor`+
  `WorkerHost`, `kanban.module.ts:8` `BullModule`. Jonli `jobType` qiymatlari: **`OVERDUE_ESCALATION`,
  `RECURRING_CARDS`, `TT_SLA_ESCALATION`** — atigi **3 ta**. Fayl izohi migratsiyani hujjatlashtiradi
  (ilgari `@Cron('0 9 * * *')` va `@Cron('0 7 * * *')`).
- **Nima yetishmaydi:** Rollover, arxivlash, smena-estafeta va norma-eskalatsiya job'lari — Kanban
  modulida `rollover`/`archive` nomli cron/job **topilmadi** (0 moslik). Ya'ni bu uchtasi BullMQ'ga
  ko'chmagan emas — **umuman yo'q**.
- **Bog'liqlik:** EP-KANBAN-064 (rollover sanagichi), MES smena-estafeta
- **action:** CREATE · **⤳ Ta'sir:** Kanban ishonchliligi, MES

### VR-KANBAN-I06 · Reyting/AI-biriktirish formulalari kodda qotgan — CRUD emas
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07, jonli tekshiruv)*
- **Talab:** `vision-1000-answers #39` — `KPI_score = achievement*0.7 − escalation_penalty*0.3`,
  og'irliklar "quarter sayin qayta ko'rib chiqiladi"; `#44` — AI biriktirish
  `score = history_quality*0.4 + low_workload*0.3 + razryad_match*0.3`.
- **Dalil (kod):** `business.constants.ts:683-684` — `KANBAN_RATING_WEIGHT_ACHIEVEMENT = 0.7`,
  `KANBAN_RATING_WEIGHT_ESCALATION = 0.3` (nomlangan konstanta, ya'ni Qoida 12 bajarilgan). Jonli
  `business_settings` da `module='kanban'` bo'yicha atigi **2 qator**:
  `kanban.tt_task_sla_hours_default=24` va `kanban.norm_time_per_task_type_93` (**`value_num` NULL —
  egasi javobini kutmoqda**). Reyting og'irliklari uchun qator **yo'q**.
- **Nima yetishmaydi:** "Quarter sayin qayta ko'rib chiqiladi" talabi compile-time konstanta bilan
  bajarilmaydi — og'irliklar `business_settings` ga ko'chirilishi kerak (egasi CRUD orqali
  o'zgartirsin). AI-biriktirish formulasi (`#44`) uchun esa og'irliklar umuman topilmadi.
- **Bog'liqlik:** EP-KANBAN-045, HR KPI, AI biriktirish
- **action:** UPDATE · **⤳ Ta'sir:** HR/KPI, AI

---

## III QISM — Raqamlash, sanoq va tekshiruv

### §1 — Manba xaritalash
| Manba | Diapazon | EP-KANBAN bilan mosligi |
|---|---|---|
| `docs/audit/decisions/15-kanban.md` | `EP-KANBAN-001..137` | **Kanonik kalit** — 137/137 |
| `FULL-ITEM-LEVEL [Module-15]` | `Item #1..#137` + `Item A1..A25` | `Item #N` → `EP-KANBAN-N`; `Item AN` = `EXTRACTION QISM A #N` (alohida raqamlash) |
| `EXTRACTION QISM A` | `#1..#25` | Xoch-havolada `EXTRACTION QISM A #N` sifatida |
| `TASDIQ-2146 §15` | `#1..#137` | 1:1 |
| `vision-1000-answers/15-kanban.md` | `1..50` | EP-kodsiz — II QISM manbasi |

### §2 — Sanoq tekshiruvi
```
grep -c "^### EP-KANBAN-" docs/vision/registry/15-kanban.md   → 137
grep -c "^### VR-KANBAN-"  docs/vision/registry/15-kanban.md   →   6
```
Ketma-ketlik `001..137` uzluksiz; dublikat yo'q.

### §3 — Manba ishonchliligi haqida ogohlantirish
2026-08-06 auditi Kanban bo'yicha 7 da'vo qo'ygan edi; qayta tekshiruvda **6 tasi allaqachon
to'g'ri** chiqdi (audit koddan orqada qolgan). Shu sababli bu registrda `Dalil (kod)` maydonining
`Δ` qismi jonli `git log` va `information_schema` ga tayanadi, auditning o'ziga emas (Q-29).

Aniq misol: `drizzle-kanban-ext.repo.ts` "964 qator, Qoida 13 buzilgan" deb yozilgan edi — jonli
holat: **156-qatorli facade + 8 sub-repo**, ya'ni bo'lish allaqachon bajarilgan.

### §4 — Ochiq qolgan eng katta uchta blok
1. **`kanban_column_sla` ulanmagan** (VR-KANBAN-I01) — jadval va default qiymatlar bor, o'quvchi yo'q.
2. **3 ta cron umuman yo'q** (VR-KANBAN-I05) — rollover, arxivlash, smena-estafeta.
3. **KAN↔CC savat ikki dunyo** (VR-KANBAN-I02) — `/api/basket/unified` qurilmagan.
