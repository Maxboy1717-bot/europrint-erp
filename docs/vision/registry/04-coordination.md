# Koordinatsiya — Yagona Vizyon Registri (EP-COR) — 2026-08-07

> **Manbalar:** `decisions/04-coordination.md` (135 qaror) · `FULL-ITEM-LEVEL [Module-04]` (168 item) · `_parts/B04-coordination.md` (117 qatorli traceability jadval + Step-3 ochiq ro'yxat) · `FULL-VISION-EXTRACTION` QISM A (#1..#50) / QISM C (04.1..04.117) / QISM D (26 cross-ref hal) · `vision-1000-answers/04-coordination.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 `FULL-ITEM-LEVEL` tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida `communication-center/`, `director/presentation/coordination*`, `director/presentation/workflow-rules*` va `WorkflowRules.tsx` ga tegan 22 commit qayta ko'rildi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-COR-001..135)** | **135** |
| **Qaror holati:** ✅ javoblangan | 73 |
| **Qaror holati:** 🔵 ochiq | 62 |
| **Qurilish:** Ha | 4 |
| **Qurilish:** Qisman | 58 |
| **Qurilish:** Yo'q | 58 |
| **Qurilish:** STALE-DOC | 15 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| 2026-07-11 dan beri o'zgargan (Δ) | 12 (9 EP + 3 VR) |
| ⚠️ Manbalar orasida ziddiyat | 39 (36 EP + 3 VR) |
| **II QISM — VR-COR-I01..I33** | 33 (vision-1000 #1..#50 ni to'liq qoplaydi) |

> **Eslatma (qurilish ≠ qaror):** ikki o'q mustaqil. Masalan **EP-COR-033/034** (kvorum foizi, ovoz usuli) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi 2/3 va "oddiy ko'pchilik" A-defaultini tasdiqlamagan), lekin qurilish bo'yicha **STALE-DOC** — `council-quorum.service.ts` 2/3 kvorum va `chair_tiebreak` mantiqini allaqachon qurgan. Teskari misol: **EP-COR-062/063** (protokol shabloni, 2-imzo) qaror bo'yicha ✅ **JAVOBLANGAN**, lekin qurilishda faqat bitta `sign()` status-flip bor.

> **Eslatma (tipografiya):** vazifa sharti kirill `JAVОБЛАНГАН` variantini ham sanashni talab qildi — jonli faylda tekshirildi (`grep -c "JAVОБЛАНГАН" docs/audit/decisions/04-coordination.md` → **0**), hammasi lotin `JAVOBLANGAN`. Sanoq: 73 ✅ + 62 🔵 = 135, `decisions/` faylining o'z yakuniy qatori bilan ("DONE: Coordination — 135 (javoblangan 73, ochiq 62)") mos.

> **Eslatma (mapping — MUHIM):** `_parts/B04-coordination.md` = `FULL-VISION-EXTRACTION` QISM C dagi `TASDIQ-2146 §04` jadvalining to'liq varianti (117 qator: `04.1`..`04.117`). `FULL-ITEM-LEVEL [Module-04]` da esa:
> - `Item #1..#50` = QISM A = `vision-1000-answers` #1..#50 (**EP-kodsiz** → II QISM ga chiqarildi);
> - `Item #51..#108` = `TASDIQ §04 #1..#58` (ya'ni `Item #(N+50)` = `04.N`);
> - `Item 59..117` (`#` belgisisiz) = `TASDIQ §04 #59..#117` (1:1);
> - `Item 71-alt` = manba hujjatning o'z "Step 2b" raqam-to'qnashuvi (`04.71` ikki xil mavzuga berilgan).
>
> B04 esa EP-COR kodlarini bevosita nomlaydi: `04.1..04.55` → **EP-COR-031..085**, `04.56..04.64` → **EP-COR-015/016/017/018/026/027/028/029/030**, `04.65..04.67` → **EP-COR-089/106/097**, `04.68..04.117` → **EP-COR-086..135**.
> ⚠️ Shundan kelib chiqib **EP-COR-001..014 va 019..025 uchun B04 da ham, `TASDIQ §04` da ham mos qator YO'Q** — ular uchun qurilish-dalili mavzu-mosligi orqali olindi va har birida `(taxminiy)` deb belgilandi (Qoida 4).

> **Eslatma (threshold qiymatlar):** bu modulning A-default javoblarida ko'p raqam bor (2/3 kvorum, 2 ish kuni, 3 soat, 30/90 daqiqa, 2 soat SLA, 10 MB, N kun). Egasi qoidasi bo'yicha bunday qiymatlar chatda so'ralmaydi — `business_settings` ga default bilan qo'shilib CRUD orqali sozlanadi. 2026-08-06 dagi `09582d90` aynan shu naqshni ko'rsatadi (48h/24h eslatma intervallari `business_settings` ga ko'chirildi) — qolgan barcha threshold-band shu yo'ldan borishi kerak.

---

## I QISM — EP-kodli qarorlar (EP-COR-001..135)

### EP-COR-001 · 5 kengash ro'yxati (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5 kengash (Asoschilar/Ijroiya/Tavsiya·Рек.Совет/Qomita/O'rinbosarlar) `council_levels` jadvalida (nom/tur/tavsif/faollik); kengaytirsa bo'ladi.
- **Manba:** ShVB-40 Yo'nalish 7 (council-levels.entity) + master reja
- **Dalil (kod):** `councils` jadval jonli — `node _audit/q.cjs "SELECT id, chairperson_id FROM councils"` → **5 qator**, `chairperson_id` 5/5 NULL; `GET /coordination/councils` (`coordination.controller.ts:41`) real DB'ga boradi. `SELECT DISTINCT council_type FROM councils` → `hr, quality, finance, technical, management`.
- **Nima yetishmaydi:** jonli 5 kengash **domen** turlari (hr/quality/finance/technical/management), vizyon so'ragan **ShVB 5 kengash** (Asoschilar/Ijroiya/Рек.Совет/Qomita/O'rinbosarlar) emas; `council_levels` nomli alohida master-data jadval yo'q; rais (`chairperson_id`) to'ldirilmagan.
- **Bog'liqlik:** EP-COR-031 (a'zolik), EP-COR-037 (majlis turlari)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, butun COR moduli poydevori
- **Xoch-havolalar:** `[Module-04] Item #51 (TASDIQ §04 #1)` *(taxminiy)* · `[Module-04] Item #57 (TASDIQ §04 #7)` *(taxminiy)* · `B04-trace 04.1/04.7`
- **⚠️ ZIDDIYAT:** vizyon "5 ShVB kengash" vs jonli DB "5 domen-kengash (hr/quality/finance/technical/management)" — soni bir xil bo'lgani uchun audit "master-data bor" deb o'tkazgan, lekin mazmunan boshqa ro'yxat. Egasi qaysi 5 tani kanonik deb belgilashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-COR-002 · Kengash a'zoligi va rollar
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har a'zoga rol (rais/kotib/a'zo); imzo va yo'naltirish a'zolik+roldan keladi.
- **Manba:** ShVB-40 Yo'nalish 7+10 (protokol imzosi rais/kotib)
- **Dalil (kod):** `council_members` jadval MAVJUD (`id, council_id, user_id, role, is_permanent, created_at, updated_at`) + to'liq CRUD (`council-members.repository.ts`, `council-members.controller.ts`); `council-members.controller.ts:20` `RoleEnum = z.enum(['chair','secretary','member','guest'])`. `SELECT count(*) FROM council_members` → **0 qator**.
- **Nima yetishmaydi:** 0 qator (a'zolik hech kimga berilmagan); imzo oqimi rol-dan kelib chiqmaydi — `protocol.sign()` bitta status-flip (EP-COR-063); yo'naltirish a'zolikdan emas, `council_level` matnidan keladi (EP-COR-006).
- **Bog'liqlik:** EP-COR-031, EP-COR-032, EP-COR-063
- **action:** CREATE
- **⤳ Ta'sir:** Protokol imzo oqimi, Доклад yo'naltirish
- **Xoch-havolalar:** `[Module-04] Item #51 (TASDIQ §04 #1)` *(taxminiy)* · `[Module-04] Item #52 (TASDIQ §04 #2)` *(taxminiy)* · `B04-trace 04.1/04.2`
- **⚠️ ZIDDIYAT:** `B04 04.1/04.2` (2026-06-27) "council_members jadval YO'Q; rol ustuni yo'q" vs `FULL-ITEM-LEVEL` (2026-07-11) "jadval + 4-rol enum + CRUD real, 0 qator". Yangi + kod-dalilli manba ustun → B04 qatori STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-COR-003 · A'zolik karta-model bilan bog'lash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — a'zolik lavozim KARTASIga bog'lanadi (kim kartada bo'lsa, o'sha a'zo); xodim almashsa avtomatik o'tadi.
- **Manba:** Vizyon (karta asosiy, xodim ikkilamchi — MEMORY org_card_centric)
- **Dalil (kod):** `council_members` ustunlari `user_id` ga bog'langan — `card_id` ustuni YO'Q. `add()`/`updateRole()` (to'liq o'qilgan) faqat qo'lda API chaqiruvlari; org-lavozim o'zgarishiga ulangan trigger/listener topilmadi.
- **Nima yetishmaydi:** karta↔a'zolik FK; lavozim almashinuvida avto-o'tish (EP-COR-084 bilan bitta bo'shliq).
- **Bog'liqlik:** EP-COR-084 (avto-o'tish), EP-ORG (card_id kanonizatsiyasi)
- **action:** UPDATE
- **⤳ Ta'sir:** ORG/KARTALAR (card_id FK), HR
- **Xoch-havolalar:** `[Module-04] Item #104 (TASDIQ §04 #54)` *(taxminiy)* · `[Module-04] Item #51 (TASDIQ §04 #1)` · `B04-trace 04.54`
- **Δ 2026-07-11→08-07:** —

### EP-COR-004 · Доклад shakli (Mavzu/Muammo/Natija/Taklif)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — 4 maydon alohida (subject/problem/result/proposal); ShVB blankiga aynan mos.
- **Manba:** ShVB-40 Yo'nalish 8 (dokla.entity: subject/problem/result/proposal)
- **Dalil (kod):** `information_schema.columns WHERE table_name='dokla'` → `id, title, employee_id, status, created_at, updated_at, from_user_id, from_name, council_level, **subject, problem, result, proposal**` — vizyon so'ragan 4 maydon aynan alohida ustun sifatida mavjud; `SELECT count(*) FROM dokla` → **2 qator** (jonli ishlatilgan).
- **Bog'liqlik:** EP-COR-046 (6 maydonga kengaytma)
- **action:** CREATE
- **⤳ Ta'sir:** AI (struktura tahlil), Reports
- **Xoch-havolalar:** `[Module-04] Item #66 (TASDIQ §04 #16)` *(taxminiy)* · `[Module-04] Item #63 (TASDIQ §04 #13)` · `B04-trace 04.16`
- **Δ 2026-07-11→08-07:** —

### EP-COR-005 · Доклад holatlari oqimi (status)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq oqim: Yuborildi→O'qildi→Hal qilindi→Arxiv (har bosqich vaqti bilan).
- **Manba:** ShVB-40 Yo'nalish 8 (sent/read/resolved/archived)
- **Dalil (kod):** `dokla.status` oddiy `text` ustun; controller'da `dokla/:id/read`, `dokla/:id/resolved` marshrutlari ulangan — `sent/read/resolved` 3 bosqich jonli.
- **Nima yetishmaydi:** `archived` bosqichi yo'q; har bosqich vaqti uchun alohida timestamp ustunlari yo'q (faqat `updated_at`).
- **Bog'liqlik:** EP-COR-048 (5 holatli kengaytma), EP-COR-077 (arxiv)
- **action:** UPDATE
- **⤳ Ta'sir:** NTF (bildirishnoma), Arxiv
- **Xoch-havolalar:** `[Module-04] Item #68 (TASDIQ §04 #18)` *(taxminiy)* · `B04-trace 04.18`
- **Δ 2026-07-11→08-07:** —

### EP-COR-006 · Dokladni kengash darajasiga yo'naltirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yuboruvchi kengash darajasini (councilLevel) tanlaydi, tizim a'zolarga yetkazadi; lekin asosiy yo'naltirish org-sxema avto (EP-COR-028).
- **Manba:** ShVB-40 Yo'nalish 8 (doklaCouncilLevel) + BARCHA_JAVOBLAR Q79 (org-sxema yuradi)
- **Dalil (kod):** `coordination.service.ts` `createDoklaWithValidation` `council_level` ni mijozdan kelgan matn sifatida qabul qiladi — "yuboruvchi tanlaydi" qismi ishlaydi. `dokla.council_level` ustuni jonli.
- **Nima yetishmaydi:** "tizim a'zolarga yetkazadi" — `council_members` ga fan-out bildirishnoma yo'q; org-sxema bo'yicha avto-yo'naltirish yo'q (EP-COR-028 Yo'q).
- **Bog'liqlik:** EP-COR-028, EP-COR-031, EP-COR-080
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, kengash a'zolari
- **Xoch-havolalar:** `[Module-04] Item 62 (TASDIQ §04 #62)` *(taxminiy)* · `B04-trace 04.62`
- **Δ 2026-07-11→08-07:** —

### EP-COR-007 · Доклад yuborilganda bildirishnoma
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Telegram + ilova ichi bildirishnoma; ShVB Telegram kanaliga mos.
- **Manba:** ShVB-40 Yo'nalish 8 (push notification) + Yo'nalish 38 (telegramDoclaReceived)
- **Dalil (kod):** `rasporyazhenie-escalation.cron.ts` va `zno-zvs-sla-escalation.cron.ts` bevosita `INSERT INTO notifications` qiladi (ikkalasi to'liq o'qilgan) — lekin **doklad yaratilishiga** ulangan bildirishnoma yo'q; `/zvs_status` (`bot.helpers.ts:151,164`) so'rovga javob beruvchi buyruq, push emas.
- **Nima yetishmaydi:** `dokla` INSERT dan keyin NTF/Telegram push; `telegramDoclaReceived` grep=0.
- **Bog'liqlik:** EP-COR-080 (kanal), VR-COR-I11 (yetkazish kafolati)
- **action:** EVENT
- **⤳ Ta'sir:** NTF, AI Integratsiya (Telegram bot)
- **Xoch-havolalar:** `[Module-04] Item #100 (TASDIQ §04 #50)` *(taxminiy)* · `EXTRACTION QISM A #15` · `B04-trace 04.50`
- **Δ 2026-07-11→08-07:** `c7d4d0f8` (2026-08-07) COR-ga **bevosita tegmaydi**, lekin CC-tomonda `pushNotification()` endi `TELEGRAM_SENDER` orqali ham yetkazadi — dokla uchun ham qayta ishlatiladigan tayyor naqsh paydo bo'ldi.

### EP-COR-008 · Распоряжение muddati va ustuvorligi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — muddat (deadline) majburiy + ustuvorlik (yuqori/o'rta/past) tanlanadi.
- **Manba:** ShVB-40 Yo'nalish 9 (raspDeadline/raspPriority)
- **Dalil (kod):** `rasporyazhenie` ustunlari: `id, title, issued_by, status, created_at, updated_at, from_user_id, to_user, task, **deadline, priority**, done_at, done_by, done_note` — ikkala maydon ham jonli; `rasporyazhenie-escalation.cron.ts` `deadline` ni real iste'mol qiladi.
- **Nima yetishmaydi:** ustuvorlikdan standart muddatni avto-hisoblash yo'q (bu EP-COR-050 ning ochiq qismi, EP-COR-008 ning o'zi emas).
- **Bog'liqlik:** EP-COR-050 (4 daraja + avto muddat), EP-COR-009
- **action:** CREATE
- **⤳ Ta'sir:** Eskalatsiya, KPI
- **Xoch-havolalar:** `[Module-04] Item #70 (TASDIQ §04 #20)` *(taxminiy)* · `B04-trace 04.20`
- **Δ 2026-07-11→08-07:** —

### EP-COR-009 · Kechikkan Распоряжение avto-belgilash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — cron har kuni muddati o'tganni status='overdue' qiladi + rahbarga ogohlantirish.
- **Manba:** ShVB-40 Yo'nalish 9 (markOverdue cron) + BARCHA_JAVOBLAR Q122 (eskalatsiya)
- **Dalil (kod):** `rasporyazhenie-escalation.cron.ts` — real `@Cron('0 9 * * *')`, `UPDATE rasporyazhenie SET status='overdue' WHERE status NOT IN ('done','overdue','cancelled') AND deadline < CURRENT_DATE`, so'ng `INSERT INTO notifications` **ikkala** tomonga (bajaruvchi `to_user` + beruvchi `from_user_id`).
- **Bog'liqlik:** EP-COR-027 (zinapoya), EP-COR-053 (3 bosqich)
- **action:** CRON
- **⤳ Ta'sir:** NTF, Org-struktura (rahbar)
- **Xoch-havolalar:** `[Module-04] Item 61 (TASDIQ §04 #61)` *(taxminiy)* · `[Module-04] Item #73 (TASDIQ §04 #23)` · `EXTRACTION QISM A #37` · `B04-trace 04.61`
- **⚠️ ZIDDIYAT:** `B04 04.23/04.61` "@Cron yo'q; overdue faqat `SELECT CASE` (repo:111)" vs `FULL-ITEM-LEVEL` "real `@Cron('0 9 * * *')` mavjud". Kod-dalilli yangi manba ustun → B04 qatori STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-COR-010 · Распоряжение qabul/bajarish tasdig'i
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 2 bosqich: qabul qildi (acceptedAt) → bajardi (completedAt, izoh bilan).
- **Manba:** ShVB-40 Yo'nalish 9 (accept/complete)
- **Dalil (kod):** `coordination.repository.ts:140` `markRaspDone()` — yagona holat-yopish metodi; `done_at`/`done_by`/`done_note` ustunlari bor (izoh qismi bajarilgan).
- **Nima yetishmaydi:** `accepted_at` ustuni va "qabul qildim" bosqichi umuman yo'q — bir bosqichda `done` ga o'tadi.
- **Bog'liqlik:** EP-COR-055 (8 holat), EP-COR-072 (yopish huquqi)
- **action:** UPDATE
- **⤳ Ta'sir:** Nazorat zanjiri
- **Xoch-havolalar:** `[Module-04] Item #92 (TASDIQ §04 #42)` *(taxminiy)* · `B04-trace 04.42`
- **Δ 2026-07-11→08-07:** —

### EP-COR-011 · Majlis protokoli — YANGI funksiya
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq protokol moduli (kun tartibi + ishtirokchilar + qarorlar + keyingi majlis sanasi).
- **Manba:** ShVB-40 Yo'nalish 10 (protocol.entity)
- **Dalil (kod):** `protocol` jadval + `ProtocolController` (`coordination-docs.controller.ts:96-131`, `@Controller('protocols')`: list/get/create/update/sign/amend) + `protocol.repository.ts` real — migratsiya `prikaz-protocol-2026-06-30.sql` (TASDIQ-2146 auditidan 3 kun keyin). Ustunlar: `agenda`, `decisions`, `chairperson_id`, `secretary_id`, `dissenting_opinion JSONB`, `parent_protocol_id`. **0 qator**.
- **Nima yetishmaydi:** `agenda`/`decisions` erkin matn (strukturalangan kun tartibi va qaror entiteti yo'q); ishtirokchilar ro'yxati yo'q; "keyingi majlis sanasi" maydoni yo'q; majlis entiteti umuman yo'q.
- **Bog'liqlik:** EP-COR-013 (action item), EP-COR-040 (povestka), EP-COR-074 (arxiv paketi)
- **action:** CREATE
- **⤳ Ta'sir:** Qaror→topshiriq zanjiri, Arxiv
- **Xoch-havolalar:** `[Module-04] Item #82 (TASDIQ §04 #32)` *(taxminiy)* · `[Module-04] Item 60 (TASDIQ §04 #60)` · `B04-trace 04.32`
- **⚠️ ZIDDIYAT:** `B04 04.32` "protocol jadval/controller YO'Q (grep=0)" vs jonli `ProtocolController` + `protocol` jadval. B04 auditi (2026-06-27) migratsiyadan (2026-06-30) oldin o'tkazilgan → butun protokol/приказ klasteri bo'yicha B04 eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-012 · Protokol PDF eksporti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — PDF eksport (zavod blanki); +BARCHA_JAVOBLAR Q77 "pechat qilish imkoni" majburiy.
- **Manba:** ShVB-40 Yo'nalish 10 (generatePdf) + BARCHA_JAVOBLAR Q77
- **Dalil (kod):** `ProtocolController` va `PrikazController` (ikkalasi to'liq o'qilgan) da eksport marshruti YO'Q — faqat list/get/create/update/sign/cancel/amend. `document_hashes` jadval ham yo'q (`to_regclass` → null) → imzolangan PDF quvuri umuman qurilmagan.
- **Nima yetishmaydi:** PDF generatsiya quvuri, zavod blanki shabloni, pechat oqimi.
- **Bog'liqlik:** EP-COR-024 (приказ PDF), EP-COR-079 (davr hisoboti), VR-COR-I05 (`document_hashes`)
- **action:** EXPORT
- **⤳ Ta'sir:** Arxiv, tashqi tomonlar
- **Xoch-havolalar:** `[Module-04] Item #99 (TASDIQ §04 #49)` *(taxminiy)* · `[Module-04] Item #6` · `EXTRACTION QISM A #6` · `B04-trace 04.49`
- **Δ 2026-07-11→08-07:** —

### EP-COR-013 · Protokol qaroridan topshiriq (action item)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har qarordan avtomatik Распоряжение (mas'ul + muddat bilan).
- **Manba:** ShVB-40 Yo'nalish 10 (actionItems) + v2 Q38 (avto-topshiriq)
- **Dalil (kod):** `protocol.decisions` — yagona erkin-matn ustun; strukturalangan "qaror" entiteti yo'q; director modulida `actionItem→rasp` avto-yaratish kodi topilmadi. `grep actionItem|action_item` butun `apps/api/src` → 1 mos (HR `hr-employee-goals.controller.ts`, aloqasiz).
- **Nima yetishmaydi:** qaror entiteti (`protocol_decisions`), undan `rasporyazhenie` ga avto-konvertatsiya.
- **Bog'liqlik:** EP-COR-068 (bir xil talab), EP-COR-069, EP-COR-115
- **action:** CREATE
- **⤳ Ta'sir:** Распоряжение, butun nazorat zanjiri
- **Xoch-havolalar:** `[Module-04] Item #88 (TASDIQ §04 #38)` *(taxminiy)* · `[Module-04] Item 97 (TASDIQ §04 #97)` · `B04-trace 04.38`
- **Δ 2026-07-11→08-07:** —

### EP-COR-014 · Protokol arxivida qidirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kengash turi + sana + matn bo'yicha qidiruv.
- **Manba:** ShVB-40 Yo'nalish 10 ("arxivda qidirish funksiyasi")
- **Dalil (kod):** `ProtocolController.list()` / `PrikazController.list()` (ikkalasi to'liq o'qilgan) — filtrsiz `SELECT ... ORDER BY id DESC`, birorta `@Query()` parametri, filtr yoki tsvector yo'q.
- **Nima yetishmaydi:** filtr parametrlari, FTS indeks. (Umumiy tsvector infratuzilma `fuzzy-search.service.ts` + `search-fts-indexes.sql` da bor — COR ga ulanmagan.)
- **Bog'liqlik:** EP-COR-075 (arxiv mezonlari), VR-COR-I20 (tsvector + RBAC filtr)
- **action:** READ
- **⤳ Ta'sir:** Arxiv, AI (tabiiy til qidiruv)
- **Xoch-havolalar:** `[Module-04] Item #95 (TASDIQ §04 #45)` *(taxminiy)* · `[Module-04] Item #40` · `EXTRACTION QISM A #40` · `B04-trace 04.45`
- **Δ 2026-07-11→08-07:** —

### EP-COR-015 · Рек.Совет sessiyasi — ЗВС ko'rib chiqish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq sessiya: ochiladi → ЗВС lar qo'shiladi → har biriga qaror → yopiladi + hisobot.
- **Manba:** ShVB-40 Yo'nalish 22 (rec-council-session) — Seshanba ЗВС
- **Dalil (kod):** `zvs.controller.ts` (to'liq o'qilgan) — real `POST /hr/zvs`, `GET /hr/zvs`, `PATCH :id/approve`, `PATCH :id/reject`; `zvs` jadval jonli (`department_id, submitted_by, amount, purpose, priority, week_date, level, status, reviewed_by, reviewed_at, comment, escalated_at`).
- **Nima yetishmaydi:** sessiya-o'rovchi entitet yo'q — `to_regclass('public.zvs_sessions')` va `zvs_records` ikkalasi ham `null`; ochish/yopish chegarasi va sessiya hisoboti yo'q.
- **Bog'liqlik:** EP-COR-016, EP-COR-017, EP-COR-018
- **action:** CREATE
- **⤳ Ta'sir:** Finance (ЗВС), Tasdiqlash matritsasi
- **Xoch-havolalar:** `[Module-04] Item #106 (TASDIQ §04 #56)` · `[Module-04] Item 59 (TASDIQ §04 #59)` · `B04-trace 04.56`
- **Δ 2026-07-11→08-07:** —

### EP-COR-016 · Рек.Совет qarori: to'liq/qisman/rad
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 xil qaror: to'liq / qisman (summa bilan) / rad.
- **Manba:** ShVB-40 Yo'nalish 22 (approvedAmount/rejectedAmount/partialApproval)
- **Dalil (kod):** `zvs` ustunlarida faqat bitta `amount` bor — `approved_amount` YO'Q; `zvs.controller.ts` faqat `approve`/`reject` ni ochadi — 2/3 qaror turi.
- **Nima yetishmaydi:** `approved_amount` ustuni + "qisman tasdiqlash" marshruti.
- **Bog'liqlik:** EP-COR-015, EP-COR-018 (hisobot summasi)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (byudjet), Sessiya hisoboti
- **Xoch-havolalar:** `[Module-04] Item #107 (TASDIQ §04 #57)` · `B04-trace 04.57`
- **Δ 2026-07-11→08-07:** —

### EP-COR-017 · Рек.Совет sessiyasidan oldin eslatma
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Seshanba 08:45 cron: a'zolarga "bugun sessiya, X ta ЗВС kutmoqda" (Telegram + ilova).
- **Manba:** ShVB-40 Yo'nalish 22 (Seshanba 08:45 cron)
- **Dalil (kod):** director modulida jami **3 cron**: `zno-zvs-sla-escalation.cron.ts` (`'15 * * * *'`), `rasporyazhenie-escalation.cron.ts` (`'0 9 * * *'`), `owner-summary-daily.cron.ts` (`'0 8 * * *'`) — birortasi Seshanba-maxsus yoki 08:45 emas. `/zvs_status` so'rovga javob beruvchi buyruq.
- **Nima yetishmaydi:** haftalik (Seshanba) rejalashtirilgan eslatma cron'i.
- **Bog'liqlik:** EP-COR-038 (doimiy jadval), EP-COR-080
- **action:** CRON
- **⤳ Ta'sir:** NTF, AI Integratsiya
- **Xoch-havolalar:** `[Module-04] Item #108 (TASDIQ §04 #58)` · `B04-trace 04.58`
- **Δ 2026-07-11→08-07:** —

### EP-COR-018 · Рек.Совет sessiya hisoboti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avto-hisobot (tasdiqlangan/rad/jami summa) + protokolga bog'lanadi.
- **Manba:** ShVB-40 Yo'nalish 22 (generateSessionReport)
- **Dalil (kod):** `zvs.controller.ts` da hisobot marshruti yo'q; `zvs_sessions` jadval `null`; `generateSessionReport` grep=0.
- **Nima yetishmaydi:** `zvs_sessions` o'rovchi jadval + `GET /hr/zvs/sessions/:id/report` (FULL-ITEM-LEVEL buni "sof qurish vazifasi, egasi qarori kerak emas" deb baholagan).
- **Bog'liqlik:** EP-COR-015, EP-COR-016, EP-COR-011 (protokolga bog'lanish)
- **action:** EXPORT
- **⤳ Ta'sir:** Finance, Director, Protokol
- **Xoch-havolalar:** `[Module-04] Item 59 (TASDIQ §04 #59)` · `B04-trace 04.59`
- **Δ 2026-07-11→08-07:** —

### EP-COR-019 · Приказлар registri — kategoriyalar (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — tayyor kategoriyalar (HR/Moliya/Operatsion/Strategik/Umumiy); kengaytirsa bo'ladi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderCategory: HR/Moliya/Operatsion/Strategik)
- **Dalil (kod):** `prikaz` jadval ustunlari (migratsiyadan): `id, prikaz_number, title, content, issued_by, status, signed_at, cancelled_at, cancel_reason, supersedes_id, created_at, updated_at` — **kategoriya ustuni yo'q**; kategoriya master-data jadvali ham yo'q.
- **Nima yetishmaydi:** `category` ustuni + kategoriya lug'ati (seed) + ruxsat bog'lanishi.
- **Bog'liqlik:** EP-COR-057 (kategoriya + prefiks), EP-COR-076 (kim ko'radi)
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv, ruxsat (kim qaysi turni ko'radi)
- **Xoch-havolalar:** `[Module-04] Item #77 (TASDIQ §04 #27)` *(taxminiy)* · `B04-trace 04.27`
- **Δ 2026-07-11→08-07:** —

### EP-COR-020 · Приказ raqamlash (registr nomeri)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik (yil + ketma-ket: 2026-001); takror/bo'sh bo'lmaydi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderNumber)
- **Dalil (kod):** `prikaz-protocol-2026-06-30.sql:9` `CREATE SEQUENCE IF NOT EXISTS prikaz_number_seq;` + `prikaz.repository.ts:80-91` `sign()` ichida `prikaz_number = nextval('prikaz_number_seq')` + unique indeks — takror raqam DB-darajasida imkonsiz.
- **Nima yetishmaydi:** raqam **yalang'och butun son**, vizyon so'ragan `2026-001` (yil + ketma-ket, har yil 001 dan) formati emas; yillik reset yo'q.
- **Bog'liqlik:** EP-COR-056 (`PR-YYYY-NNN`), EP-COR-058 (teshik)
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv, qonuniy talab
- **Xoch-havolalar:** `[Module-04] Item #76 (TASDIQ §04 #26)` *(taxminiy)* · `[Module-04] Item #5` · `EXTRACTION QISM A #5` · `B04-trace 04.26`
- **⚠️ ZIDDIYAT:** uch xil format bir vaqtda hujjatlangan — EP-COR-020 "2026-001", EP-COR-056 "PR-YYYY-NNN", kod "bare integer". Egasi bittasini tanlashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-COR-021 · Приказ kuchga kirish sanasi (effective date)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kuchga kirish sanasi alohida maydon (chiqarilgan sanadan farqli bo'lishi mumkin).
- **Manba:** ShVB-40 Yo'nalish 31 (orderEffectiveDate)
- **Dalil (kod):** `prikaz` da faqat `signed_at` va `cancelled_at` sana ustunlari bor — `effective_date`/`expiry_date` YO'Q (migratsiya ustun ro'yxati o'qilgan).
- **Nima yetishmaydi:** `effective_date` ustuni; kelajak-sana приказини kuchga kirituvchi kunlik cron (VR-COR-I19 bilan bitta bo'shliq).
- **Bog'liqlik:** EP-COR-060 (bir xil talab), VR-COR-I19 (ish-kun kalendari)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Finance (qachondan kuchda)
- **Xoch-havolalar:** `[Module-04] Item #80 (TASDIQ §04 #30)` *(taxminiy)* · `[Module-04] Item #22` · `EXTRACTION QISM A #22` · `B04-trace 04.30`
- **Δ 2026-07-11→08-07:** —

### EP-COR-022 · Приказ imzosi va imzolovchi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — imzo bosqichi (Loyiha→Imzolandi→Kuchda) + imzolovchi yoziladi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderSignedBy/orderStatus) + BARCHA_JAVOBLAR Q78 (imzo tartibi)
- **Dalil (kod):** `prikaz.status` (`draft`/`signed`/`cancelled`) + `signed_at` + `prikaz.repository.ts` `sign()` real; `updateDraft()` `WHERE id=... AND status='draft'` — loyiha bosqichi enforce qilingan.
- **Nima yetishmaydi:** uchinchi bosqich "Kuchda" holati yo'q (EP-COR-021 `effective_date` siz mumkin emas); `signed_by` alohida ustun yo'q — faqat `issued_by` bor, ya'ni imzolovchi chiqaruvchidan ajratilmagan.
- **Bog'liqlik:** EP-COR-021, EP-COR-023, EP-COR-061
- **action:** APPROVE
- **⤳ Ta'sir:** Org-struktura (imzo huquqi), Arxiv
- **Xoch-havolalar:** `[Module-04] Item #76 (TASDIQ §04 #26)` *(taxminiy)* · `[Module-04] Item #81 (TASDIQ §04 #31)` · `[Module-04] Item #83 (TASDIQ §04 #33)` · `B04-trace 04.26/04.31`
- **Δ 2026-07-11→08-07:** —

### EP-COR-023 · Приказ imzosi turi (elektron/qo'lda)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** B (egasi tasdig'i bilan) — fizik imzo qo'yiladi, yozgan xodim "rahbar imzoladi" deb belgilaydi, imzolovchiga Telegram+ERP tasdiq so'rovi ketadi (2-imzo).
- **Manba:** BARCHA_JAVOBLAR Q78 (fizik imzo + xodim tasdig'i + imzolovchi tasdiq)
- **Dalil (kod):** `PrikazController`/`ProtocolController` sinf darajasida `@UseInterceptors(AuditInterceptor)` — umumiy so'rov-audit real; lekin "imzo turi" maydoni, ikkinchi-imzo tasdiq so'rovi yoki imzolovchiga Telegram so'rovi topilmadi. `grep signed_by_external|signed_document_url` butun `apps/` → 0.
- **Nima yetishmaydi:** `signature_type` maydoni; imzolovchiga Telegram/ERP tasdiq so'rovi; skanerlangan imzo fayli.
- **Bog'liqlik:** EP-COR-064 (imzo turi), VR-COR-I09 (tashqi imzo)
- **action:** APPROVE
- **⤳ Ta'sir:** NTF (Telegram), Audit-log
- **Xoch-havolalar:** `[Module-04] Item #84 (TASDIQ §04 #34)` *(taxminiy)* · `[Module-04] Item #12` · `EXTRACTION QISM A #12` · `B04-trace 04.34`
- **📌 Eslatma:** bu modulda **A-dan farq qilgan yagona javob** — egasi B variantini tanlagan (fizik imzo + ikki tomonlama tasdiq).
- **Δ 2026-07-11→08-07:** —

### EP-COR-024 · Приказ PDF va arxiv
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — PDF eksport + doimiy arxiv (qidiruv bilan); +tasdiqlangani immutable.
- **Manba:** ShVB-40 Yo'nalish 31 (generatePdf/archive) + BARCHA_JAVOBLAR Q83 (immutable)
- **Dalil (kod):** immutable qismi **qurilgan** — `prikaz.repository.ts:64-77` `updateDraft()` `WHERE id=${id} AND status='draft'`, imzolangan приказni tahrirlab bo'lmaydi; `PrikazRepository` da hech qanday `delete` metodi yo'q (o'chirish imkonsiz).
- **Nima yetishmaydi:** PDF eksport marshruti yo'q; arxiv qidiruvi yo'q (`list()` filtrsiz); `document_hashes` yo'q (kriptografik buzilmaslik dalili yo'q).
- **Bog'liqlik:** EP-COR-012, EP-COR-061, EP-COR-077, VR-COR-I05
- **action:** EXPORT
- **⤳ Ta'sir:** Arxiv, qonuniy saqlash
- **Xoch-havolalar:** `[Module-04] Item #99 (TASDIQ §04 #49)` *(taxminiy)* · `[Module-04] Item #97 (TASDIQ §04 #47)` · `[Module-04] Item #81 (TASDIQ §04 #31)` · `B04-trace 04.47/04.49`
- **Δ 2026-07-11→08-07:** —

### EP-COR-025 · Приказ xodimga yetkazish (tanishtirish)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — приказ tegishli xodimlarga yuboriladi + "tanishdim" tasdig'i yig'iladi.
- **Manba:** BARCHA_JAVOBLAR Q77 (xodim hujjat taqdirini belgilashi) + Q84 (tanishuv imzosi)
- **Dalil (kod):** `grep tanishuv` butun `apps/` → **0 fayl**; `prikaz` da qabul qiluvchi/tanishuv jadvali yo'q; Telegram `/tanishuv` buyrug'i yo'q.
- **Nima yetishmaydi:** `prikaz_acknowledgements` turidagi jadval, xodimga yetkazish fan-out'i, 2 ish kunlik muddat va rahbar-mas'uliyat qoidasi.
- **Bog'liqlik:** VR-COR-I21 (`/tanishuv` buyrug'i), EP-COR-117 (nazorat varaqasi)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, NTF, Audit
- **Xoch-havolalar:** `[Module-04] Item #41` *(taxminiy)* · `EXTRACTION QISM A #41` · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### EP-COR-026 · Koordinatsiya boshqaruv paneli (umumiy ko'rinish)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — yagona panel (ochiq dokladlar/kutilayotgan rasporyajeniye/yaqin majlis/kuchdagi приказ soni).
- **Manba:** ShVB-40 Yo'nalish 7 (CoordinationPage 3 panel)
- **Dalil (kod):** `coordination.controller.ts` — jonli `GET /coordination/stats`, `/dokla`, `/rasporyazhenie`, `/baskets`, `/councils`, hammasi `CoordinationService` orqali real DB'ga boradi; FE `CoordinationPage.tsx` Overview + Councils tab. **Δ:** `d0f86666` (2026-08-06) — controller ichidagi inline SQL `coordination.repository.ts` (+46 qator) va `coordination.service.ts` ga ko'chirildi (Qoida 6/15 muvofiqligi); funksional o'zgarish yo'q.
- **Nima yetishmaydi:** "yaqin majlis" vidjeti uchun majlis entiteti yo'q; "kuchdagi приказ soni" — `PrikazController` mavjud, lekin panel/stats endpoint'iga **ulanmagan** (0 qator).
- **Bog'liqlik:** EP-COR-011, EP-COR-037 (majlis), EP-COR-019
- **action:** READ
- **⤳ Ta'sir:** Director, butun COR
- **Xoch-havolalar:** `[Module-04] Item 60 (TASDIQ §04 #60)` · `B04-trace 04.60`
- **Δ 2026-07-11→08-07:** `d0f86666` — `coordination.controller.ts` inline-SQL repo/service'ga ko'chirildi (arxitektura tozalash, panel xatti-harakati o'zgarmadi).

### EP-COR-027 · Eskalatsiya: bajarilmagan masalani yuqoriga ko'tarish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — avtomatik eskalatsiya org-tuzilma bo'yicha yuqoriga (2x eslatma → eskalatsiya → HR).
- **Manba:** BARCHA_JAVOBLAR Q122 (2x + eskalatsiya + HR) + master reja (Vysotskiy 7)
- **Dalil (kod):** `rasporyazhenie-escalation.cron.ts` (`'0 9 * * *'`) — overdue belgilash + 2 tomonga bildirishnoma; `zno-zvs-sla-escalation.cron.ts` `resolveNextLevel()` bilan org-daraxtdan **bir** pog'ona yuqoriga chiqadi (`manager_id` → `org_departments.head_user_id`). **Δ:** `d6da370f` (2026-08-06) — CC tomonda eskalatsiya avval faqat holatni belgilar edi, endi haqiqiy xabar yuboradi va qayta yo'naltiradi; `c7d4d0f8` (2026-08-07) — eskalatsiya bildirishnomasi endi **Telegram**'ga ham yetkaziladi (`TELEGRAM_SENDER`, best-effort `@Optional`).
- **Nima yetishmaydi:** "2x eslatma" hisoblagichi COR-tomonda yo'q; zanjir CEO'gacha bormaydi (`resolveNextLevel` birinchi topilgan boshliqda to'xtaydi); HR'ga yakuniy ko'tarish yo'q; `escalation_log` jadvali yo'q.
- **Bog'liqlik:** EP-COR-009, EP-COR-053, EP-COR-134, VR-COR-I17
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura (manager_id), HR, NTF
- **Xoch-havolalar:** `[Module-04] Item 61 (TASDIQ §04 #61)` · `[Module-04] Item #33` · `EXTRACTION QISM A #33` · `B04-trace 04.61`
- **⚠️ ZIDDIYAT:** `B04 04.61` "@Cron yo'q; HR'ga ko'tarish yo'q" — birinchi yarmi noto'g'ri (cron bor), ikkinchi yarmi to'g'ri (HR yo'q). Qatorni bo'lib qayta baholash kerak.
- **Δ 2026-07-11→08-07:** `d6da370f` (eskalatsiya endi xabar yuboradi + qayta yo'naltiradi) · `c7d4d0f8` (eskalatsiya Telegram'ga yetadi) · `09582d90` (48h/24h eslatma intervallari `business_settings` CRUD'ga chiqarildi).

### EP-COR-028 · Org-tuzilma bilan yo'naltirish (vertikal zanjir)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — org-tuzilma zanjiri bo'yicha avto-yo'naltirish (Vysotskiy 7); hujjat sakramaydi: avval vertikal, keyin gorizontal.
- **Manba:** BARCHA_JAVOBLAR Q79 (vertikal→gorizontal, sakramaydi) + Q80 (org-sxema avto) + Q81 (admin paneldan konfiguratsiya)
- **Dalil (kod):** `coordination.service.ts` `createDoklaWithValidation` `council_level` ni mijozdan kelgan matn sifatida oladi, org-ierarxiya/`manager_id` bilan hech qanday qidiruv qilmaydi. `grep manager_id.*rout|autoRoute|auto_route` director modulida → 2 aloqasiz fayl (KPI query handler + eskalatsiya cron'ining `SELECT CASE`).
- **Nima yetishmaydi:** vertikal marshrut hal qiluvchi (resolver); "sakramaslik" invarianti; `workflow_rules` bilan bog'lanish (EP-COR-119 CRUD bor, chaqiruvchi yo'q).
- **Bog'liqlik:** EP-COR-089 (sektsiya darajasi), EP-COR-119 (gorizontal), EP-COR-006
- **action:** EVENT
- **⤳ Ta'sir:** ORG (manager_id + workflow_rules), butun COR
- **Xoch-havolalar:** `[Module-04] Item 62 (TASDIQ §04 #62)` · `[Module-04] Item 65 (TASDIQ §04 #65)` · `B04-trace 04.62`
- **Δ 2026-07-11→08-07:** —

### EP-COR-029 · Telegram orqali koordinatsiya buyruqlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Telegram buyruqlari (topshiriqlarim/dokladlarim/bajardim).
- **Manba:** ShVB-40 Yo'nalish 38 (telegram-shvb.service: /zvs_status, komandalar)
- **Dalil (kod):** `bot.helpers.ts:151-164` `/zvs_status` — jonli `zvs` qatorlarini so'rab holat+summa xulosasini qaytaradigan **real** buyruq. `director.bot.ts` faqat `/kpi`, `/ai`, `/summary` ni ushlaydi.
- **Nima yetishmaydi:** `grep topshiriqlarim|dokladlarim|/bajardim` butun `apps/api/src` → **0 mos** — vizyon so'ragan uchala buyruq ham yo'q.
- **Bog'liqlik:** EP-COR-080, EP-COR-007
- **action:** READ
- **⤳ Ta'sir:** AI Integratsiya (Telegram bot), NTF
- **Xoch-havolalar:** `[Module-04] Item 63 (TASDIQ §04 #63)` · `B04-trace 04.63`
- **Δ 2026-07-11→08-07:** —

### EP-COR-030 · Karta-model: kengash hisoboti AI bilan
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — karta AI'si koordinatsiya hisobotini ham tahlil qiladi (kim kechiktiradi, qaysi masala takrorlanadi).
- **Manba:** Vizyon (har kartaning AI'si — org_card_centric) + ShVB-40 Yo'nalish 39 (AI tahlil)
- **Dalil (kod):** `grep AI.*listener|@OnEvent` `apps/api/src/modules/director` → **0 mos** — hech qanday AI xizmati koordinatsiya hodisalariga obuna emas.
- **Nima yetishmaydi:** dokla/rasp tarixini o'qib takroriy-kechikish naqshini aniqlaydigan AI xizmati. (Xom ma'lumot — `dokla`, `rasporyazhenie` jadvallari — allaqachon mavjud; `ai_decision_log` naqshi loyihada o'rnatilgan, yangi egasi-qarori talab qilinmaydi.)
- **Bog'liqlik:** EP-COR-135 (karta-AI signal), EP-COR-102 (KPI)
- **action:** AI
- **⤳ Ta'sir:** HR (karta AI), Reports, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 64 (TASDIQ §04 #64)` · `B04-trace 04.64`
- **Δ 2026-07-11→08-07:** —

### EP-COR-031 · Kengash a'zolari ro'yxati qayerdan (v2-Q1)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — org-strukturadan avtomat (CEO + 7 otdeleniye boshlig'i = doimiy a'zo); karta orqali.
- **Manba:** Vizyon (Vysotskiy 7 + karta-model) + ShVB-40 Yo'nalish 7
- **Dalil (kod):** `to_regclass('public.council_members')` → **jadval MAVJUD**; ustunlar `id, council_id, user_id, role, is_permanent, created_at, updated_at`; to'liq CRUD repository (`council-members.repository.ts`) + controller (`council-members.controller.ts`), ikkalasi to'liq o'qilgan. `SELECT count(*) FROM council_members` → **0**; `councils.chairperson_id` 5/5 NULL.
- **Nima yetishmaydi:** "avto keladimi" qismi qurilmagan — a'zolik faqat qo'lda `POST /councils/:id/members` orqali qo'shiladi; org-strukturadan (CEO + 7 otdeleniye boshlig'i) avto-sinxronizatsiya yo'q; `is_permanent` bor lekin to'ldirilmagan.
- **Bog'liqlik:** EP-COR-003 (karta bog'lanishi), EP-COR-084 (avto-o'tish), EP-COR-089
- **action:** READ
- **⤳ Ta'sir:** HR / Org-struktura
- **Xoch-havolalar:** `[Module-04] Item #51 (TASDIQ §04 #1)` · `B04-trace 04.1` · `EXTRACTION QISM C #04.1`
- **⚠️ ZIDDIYAT:** `B04 04.1` (2026-06-27) "council_members jadval YO'Q" vs jonli DB "jadval + CRUD bor, 0 qator". Jadval `council-members-2026-06-30.sql` migratsiyasi bilan B04 auditidan **keyin** yaratilgan → B04 qatori eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-032 · Kengash a'zosi turlari (rol) (v2-Q2)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 4 rol: Rais/Kotib/A'zo/Mehmon (faqat A'zo+Rais ovoz beradi).
- **Manba:** EP-COR-002 (rol) + ShVB protokol imzosi
- **Dalil (kod):** `council-members.controller.ts:20` — `const RoleEnum = z.enum(['chair','secretary','member','guest'])`, `AddSchema` va `UpdateSchema` ikkalasida ham enforce qilingan; `council_members.role` real `text` ustun.
- **Nima yetishmaydi:** ovoz huquqi qoidasi vizyonga to'liq mos emas — `council-members.repository.ts:47-57` `countVotingMembers()` faqat `role='guest'` ni chiqaradi, ya'ni **kotib ham ovozga sanaladi**, vizyon esa "faqat A'zo+Rais ovoz beradi" deydi.
- **Bog'liqlik:** EP-COR-033 (kvorum bazasi), EP-COR-034 (ovoz), EP-COR-036
- **action:** CREATE
- **⤳ Ta'sir:** Ovoz/kvorum/imzo
- **Xoch-havolalar:** `[Module-04] Item #52 (TASDIQ §04 #2)` · `B04-trace 04.2`
- **⚠️ ZIDDIYAT:** (1) `B04 04.2` "rol/a'zolik ustuni yo'q" vs jonli 4-rol enum → B04 eskirgan. (2) vizyon "faqat A'zo+Rais ovoz" vs kod "guest'dan boshqa hamma ovoz beradi" — kod vizyonga zid (Q-40: ishlaydi ≠ to'g'ri).
- **Δ 2026-07-11→08-07:** —

### EP-COR-033 · Kvorum foizi (v2-Q3)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A-default — 2/3 (66%) shart; kvorum yetmasa "maslahat majlisi" (qaror kuchsiz). Egasi tasdiqlasin.
- **Manba:** A-default (egasi keyin hal qiladi)
- **Dalil (kod):** `council-quorum.service.ts` (to'liq o'qilgan) — `quorumRequired = ceil((n*2)/3)`, konstantalar `COUNCIL_QUORUM_NUMERATOR=2`, `COUNCIL_QUORUM_DENOMINATOR=3` (`business.constants.ts:538-539`), `GET /councils/:councilId/quorum` orqali ochilgan.
- **Nima yetishmaydi:** kvorum yetmaganda "maslahat majlisi" (qarori kuchsiz) rejimi yo'q; kvorum ulushi **konstanta** — `business_settings` orqali CRUD-sozlanmaydi (egasi qaror qabul qilganda o'zgartirish uchun kod tahriri kerak bo'ladi).
- **Bog'liqlik:** EP-COR-032, EP-COR-082 (favqulodda 50%), EP-COR-035
- **action:** READ
- **⤳ Ta'sir:** Qaror qonuniyligi
- **Xoch-havolalar:** `[Module-04] Item #53 (TASDIQ §04 #3)` · `B04-trace 04.3`
- **⚠️ ZIDDIYAT:** `B04 04.3` "grep quorum/kvorum apps/api/src=0 (faqat chat polls)" vs jonli `council-quorum.service.ts` + 2 ta nomli konstanta. B04 qatori eskirgan.
- **📌 Ikki o'q namunasi:** qaror 🔵 OCHIQ, lekin qurilish deyarli tugagan — egasi 2/3 dan boshqa qiymatni tanlasa, kod o'zgartirilishi kerak bo'ladi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-034 · Ovoz berish usuli va g'olib chegarasi (v2-Q4)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A-default — oddiy ko'pchilik; teng bo'lsa Rais ovozi hal qiladi.
- **Manba:** A-default
- **Dalil (kod):** `council-quorum.service.ts:73-82` `evaluateDecision()` — `votesFor > votesAgainst` → `'approved'`, `<` → `'rejected'`, `=` → `'chair_tiebreak'`; `POST /councils/:councilId/quorum/evaluate` orqali ochilgan. Vizyon mantig'i aynan qurilgan.
- **Nima yetishmaydi:** ovoz **yozuvlari** yo'q — `evaluateDecision` faqat xom `presentCount/votesFor/votesAgainst` sonlarini qabul qiladi; a'zo-bo'yicha ovoz jadvali bo'lmagani uchun delegatsiya (EP-COR-035) va chetlashtirish (EP-COR-036) ustiga qurilmaydi.
- **Bog'liqlik:** EP-COR-035, EP-COR-036, EP-COR-033
- **action:** APPROVE
- **⤳ Ta'sir:** Qaror jarayoni
- **Xoch-havolalar:** `[Module-04] Item #54 (TASDIQ §04 #4)` · `B04-trace 04.4`
- **⚠️ ZIDDIYAT:** `B04 04.4` "grep vote/ovoz = faqat chat poll" vs jonli `evaluateDecision()` + `chair_tiebreak`. B04 qatori eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-035 · A'zo o'rniga vakil (delegatsiya) (v2-Q5)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — faqat oldindan yozma ishonchnoma bilan vakil ovoz beradi (kvorumga sanaladi).
- **Manba:** A-default
- **Dalil (kod):** `council-members.controller.ts` va `council-quorum.service.ts` (ikkalasi to'liq o'qilgan) da delegat/proxy maydoni yoki marshruti YO'Q.
- **Nima yetishmaydi:** `council_vote_delegations` jadval + `evaluateDecision` ga delegatlangan ovozni kiritish. **Egasi-gate:** yozma ishonchnoma nima hisoblanadi (qog'oz vs raqamli imzo) — huquqiy qaror.
- **Bog'liqlik:** EP-COR-034 (a'zo-bo'yicha ovoz yozuvi yo'q — birinchi shart)
- **action:** CREATE
- **⤳ Ta'sir:** Kvorum hisobi
- **Xoch-havolalar:** `[Module-04] Item #55 (TASDIQ §04 #5)` · `B04-trace 04.5`
- **Δ 2026-07-11→08-07:** —

### EP-COR-036 · A'zolik manfaat to'qnashuvi (v2-Q6)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — aloqador a'zo o'sha bandda "chetlashtirildi", ovozi sanalmaydi.
- **Manba:** A-default
- **Dalil (kod):** `council-members.repository.ts:47-57` `countVotingMembers()` faqat `role='guest'` ni chiqaradi; `information_schema` `council_members` ustunlari `id/council_id/user_id/role/is_permanent/created_at/updated_at` — **manfaat-to'qnashuvi bayrog'i yo'q**.
- **Nima yetishmaydi:** `conflict_of_interest` boolean/sabab (yoki sessiya-bo'yicha jadval); band-darajasida kvorum va ovozdan chiqarish.
- **Bog'liqlik:** VR-COR-I02 (`council_session_members` + SERIALIZABLE qayta-hisob), EP-COR-034
- **action:** UPDATE
- **⤳ Ta'sir:** Adolat, audit
- **Xoch-havolalar:** `[Module-04] Item #56 (TASDIQ §04 #6)` · `[Module-04] Item #2` · `EXTRACTION QISM A #2` · `B04-trace 04.6`
- **Δ 2026-07-11→08-07:** —

### EP-COR-037 · Majlis turlari (v2-Q7)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — 4 tur: Operativ/Oylik/Choraklik/Favqulodda.
- **Manba:** A-default
- **Dalil (kod):** `SELECT DISTINCT council_type FROM councils` → `hr, quality, finance, technical, management` — bu **domen** kategoriyalari, majlis-chastotasi turlari emas; majlis/sessiya jadvali umuman yo'q.
- **Nima yetishmaydi:** `meeting`/`council_session` entiteti — bu butun majlis klasterining (EP-COR-039..042, 070, 074, 081, 082, 094, 101, 102) **umumiy boshlig'i**.
- **Bog'liqlik:** ⭐ MAJLIS ENTITETI — EP-COR-039/040/041/042/070/074/081/082 hammasi shunga bog'liq
- **action:** CREATE
- **⤳ Ta'sir:** Chastota/kvorum/doklad talablari
- **Xoch-havolalar:** `[Module-04] Item #57 (TASDIQ §04 #7)` · `B04-trace 04.7`
- **Δ 2026-07-11→08-07:** —

### EP-COR-038 · Doimiy jadval (raspisaniye) (v2-Q8)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avto takrorlanuvchi jadval (haftalik/oylik shablon); ShVB tsikli (Seshanba Рек.Совет) cron bilan.
- **Manba:** ShVB-40 Yo'nalish 22 (Seshanba cron) + Yo'nalish 4 (FP-tsikl cron)
- **Dalil (kod):** `SELECT id, name, meeting_schedule FROM councils` → 5 kengashning **hammasida `meeting_schedule: null`** (ustun mavjud, sxema tayyor). Director modulida `@Cron` grep → 3 cron, birortasi ЗВС/majlis jadvali bilan bog'liq emas.
- **Nima yetishmaydi:** `meeting_schedule` to'ldirilmagan (5/5 NULL) va uni o'qib majlis ochadigan cron yo'q.
- **Bog'liqlik:** EP-COR-017 (Seshanba 08:45), EP-COR-037 (majlis entiteti), VR-COR-I19 (bayram surish)
- **action:** CRON
- **⤳ Ta'sir:** AI Integratsiya (eslatma), HR
- **Xoch-havolalar:** `[Module-04] Item #58 (TASDIQ §04 #8)` · `B04-trace 04.8`
- **Δ 2026-07-11→08-07:** —

### EP-COR-039 · Chaqiriqni oldindan ogohlantirish muddati (v2-Q9)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — oddiy 2 ish kuni oldin; favqulodda kamida 3 soat oldin.
- **Manba:** A-default
- **Dalil (kod):** majlis entiteti umuman yo'q (director modulining fayl ro'yxati bilan tasdiqlangan) — ogohlantirish muddatini bog'laydigan ob'ekt yo'q.
- **Nima yetishmaydi:** majlis entiteti + `notice_period` sozlamasi (threshold → `business_settings`) + eslatma cron'i.
- **Bog'liqlik:** EP-COR-037 (majlis entiteti), EP-COR-082 (favqulodda 3 soat)
- **action:** CRON
- **⤳ Ta'sir:** NTF
- **Xoch-havolalar:** `[Module-04] Item #59 (TASDIQ §04 #9)` · `B04-trace 04.9`
- **Δ 2026-07-11→08-07:** —

### EP-COR-040 · Kun tartibi (povestka) muddati (v2-Q10)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — majlisdan 1 ish kuni oldin qulflanadi, keyin faqat Rais ruxsati bilan band qo'shiladi.
- **Manba:** A-default
- **Dalil (kod):** alohida povestka/agenda jadvali topilmadi; `protocol.agenda` — bitta erkin-matn ustun, qulflash timestamp'i yo'q, strukturalangan band ro'yxati emas.
- **Nima yetishmaydi:** strukturalangan `agenda_items` jadvali + `locked_at` + "Rais ruxsati bilan qo'shildi" bayrog'i (VR-COR-I30).
- **Bog'liqlik:** EP-COR-037, EP-COR-011, VR-COR-I30 (kech band + qayta NTF)
- **action:** UPDATE
- **⤳ Ta'sir:** Protokol
- **Xoch-havolalar:** `[Module-04] Item #60 (TASDIQ §04 #10)` · `[Module-04] Item #21` · `EXTRACTION QISM A #21` · `B04-trace 04.10`
- **Δ 2026-07-11→08-07:** —

### EP-COR-041 · Davomat (yo'qlama) va kechikish (v2-Q11)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — 4 holatli davomat avto; sababsiz yo'q 3 marta = HR ogohlantirish.
- **Manba:** A-default (turniket bilan bog'liq — EP-COR-105)
- **Dalil (kod):** `grep attendance` `apps/api/src/modules/director` → faqat dashboard read-only fayllari (`dashboard-query.repository.ts`, `dashboard.controller.ts`) HR davomat statistikasini ko'rsatadi; koordinatsiyaga xos 4-holatli davomat jadvali yo'q.
- **Nima yetishmaydi:** koordinatsiya-tomon davomat jadvali; `attendance_reason` (sababli/sababsiz) — VR-COR-I06; 3-marta→HR qoidasi.
- **Bog'liqlik:** EP-COR-037, EP-COR-105 (turniket), VR-COR-I06
- **action:** UPDATE
- **⤳ Ta'sir:** HR (intizom, KPI)
- **Xoch-havolalar:** `[Module-04] Item #61 (TASDIQ §04 #11)` · `[Module-04] Item #26` · `EXTRACTION QISM A #7/#26` · `B04-trace 04.11`
- **Δ 2026-07-11→08-07:** —

### EP-COR-042 · Majlis davomiyligi cheklovi (v2-Q12)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — Operativ 30 daq, Oylik 90 daq maqsad; oshsa "qoldirilgan bandlar" keyingiga ko'chadi.
- **Manba:** A-default
- **Dalil (kod):** majlis entiteti yo'q (bu tekshiruvda bir necha bor tasdiqlangan) — davomiylikni o'lchaydigan ob'ekt yo'q.
- **Nima yetishmaydi:** majlis entiteti + `duration_cap` (threshold → `business_settings`) + "qoldirilgan band" ko'chirish mantig'i (EP-COR-070 bilan bir).
- **Bog'liqlik:** EP-COR-037, EP-COR-070
- **action:** UPDATE
- **⤳ Ta'sir:** Samaradorlik
- **Xoch-havolalar:** `[Module-04] Item #62 (TASDIQ §04 #12)` · `B04-trace 04.12`
- **Δ 2026-07-11→08-07:** —

### EP-COR-043 · Доклад turlari va kim topshiradi (v2-Q13)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — 3 tur (rejali/so'rovga javob/muammo-doklad); har otdeleniye boshlig'i oylik kengashga rejali doklad majbur.
- **Manba:** A-default
- **Dalil (kod):** `dokla` ustunlari (`information_schema`): `id, title, employee_id, status, created_at, updated_at, from_user_id, from_name, council_level, subject, problem, result, proposal` — **`type` ustuni YO'Q**; `SELECT count(*) FROM dokla` → **2 qator** (jadval real va ishlatilgan).
- **Nima yetishmaydi:** `type` ustuni (3 tur) va "otdeleniye boshlig'i oylik doklad majbur" qoidasi/cron'i.
- **Bog'liqlik:** EP-COR-046 (maydonlar), EP-COR-101 (hisobot ritmi)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura
- **Xoch-havolalar:** `[Module-04] Item #63 (TASDIQ §04 #13)` · `B04-trace 04.13`
- **Δ 2026-07-11→08-07:** —

### EP-COR-044 · Доклад javob muddati (deadline) qoidasi (v2-Q14)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — standart 3 ish kuni, shoshilinch 1 ish kuni (ish kunlari bo'yicha); umumiy prinsip "hujjat turiga qarab muddat".
- **Manba:** BARCHA_JAVOBLAR Q121 (hujjat turiga qarab: avans 4 soat, ta'til 24 soat)
- **Dalil (kod):** yuqoridagi `dokla` ustun ro'yxati **`deadline` ustuni yo'qligini** tasdiqlaydi.
- **Nima yetishmaydi:** `deadline` ustuni; hujjat-turiga bog'langan muddat lug'ati (CC tomonda `cc_document_templates.inbox_sla_hours` naqshi bor — 17 qator jonli — dokla uchun qayta ishlatilishi mumkin); ish-kun kalendari (VR-COR-I19).
- **Bog'liqlik:** EP-COR-043 (`type`), EP-COR-045 (eskalatsiya shu ustunga bog'liq), EP-COR-134
- **action:** CREATE
- **⤳ Ta'sir:** Eskalatsiya
- **Xoch-havolalar:** `[Module-04] Item #64 (TASDIQ §04 #14)` · `[Module-04] Item 116 (TASDIQ §04 #116)` · `B04-trace 04.14`
- **Δ 2026-07-11→08-07:** —

### EP-COR-045 · Доклад kechiksa (eskalatsiya) (v2-Q15)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — muddat-1kun eslatma → tugagach yuqori rahbarga eskalatsiya → 2 kun o'tsa KPI'ga "kechikish".
- **Manba:** BARCHA_JAVOBLAR Q122 (2x eslatma + eskalatsiya + HR)
- **Dalil (kod):** director modulida jami 3 cron (`@Cron` grep bilan tasdiqlangan) — birortasi dokladga qaratilmagan.
- **Nima yetishmaydi:** doklad eskalatsiya cron'i; **oldingi shart** — EP-COR-044 `deadline` ustuni bo'lmasa qurish mumkin emas.
- **Bog'liqlik:** EP-COR-044 (birinchi navbatda), EP-COR-027, EP-COR-073 (KPI)
- **action:** CRON
- **⤳ Ta'sir:** HR/KPI, AI
- **Xoch-havolalar:** `[Module-04] Item #65 (TASDIQ §04 #15)` · `B04-trace 04.15`
- **Δ 2026-07-11→08-07:** —

### EP-COR-046 · Доклад formati va majburiy maydonlar (v2-Q16)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — 6 majburiy maydon (Davr/Bajarilgan/Reja-fakt farqi/Muammolar/Takliflar/Ilova). EP-COR-004 ning kengaytmasi.
- **Manba:** A-default + ShVB blank
- **Dalil (kod):** `dokla` da `subject, problem, result, proposal` — vizyonning 6 maydonidan **4 tasi**; davr (period), reja-fakt farqi va ilova (attachment) ustunlari yo'q.
- **Nima yetishmaydi:** `period`, `plan_fact_delta`, `attachment` ustunlari; majburiylik Zod darajasida enforce qilinishi.
- **Bog'liqlik:** EP-COR-004 (4 maydon bazasi), EP-COR-047 (reja-fakt raqamlari ERP'dan)
- **action:** CREATE
- **⤳ Ta'sir:** AI (xulosa), Production/Finance (raqam manbasi)
- **Xoch-havolalar:** `[Module-04] Item #66 (TASDIQ §04 #16)` · `B04-trace 04.16`
- **Δ 2026-07-11→08-07:** —

### EP-COR-047 · Доклад raqamlari qayerdan keladi (v2-Q17)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — asosiy raqamlar ERP'dan avto (Production/Finance/Warehouse), izoh qo'lda — manipulyatsiyasiz (vizyon: 30% kiritish / 70% tahlil).
- **Manba:** LOYIHA-BITGAN-XOLAT (oltin ip, 30/70) + master reja
- **Dalil (kod):** `grep dokla_number|dokla.*erp.*pull` `apps/` → 0 fayl; `dokla` da o'z serial `id` sidan boshqa havola-raqam ustuni yo'q; doklad mazmuni **faqat erkin matn**.
- **Nima yetishmaydi:** Production/Finance/Warehouse dan avto-tortish (auto-pull) qatlami; "qo'lda o'zgartirib bo'lmaydigan" raqam maydonlari.
- **Bog'liqlik:** EP-COR-046 (reja-fakt maydoni), EP-COR-102 (30/70 KPI), VR-COR-I14 (CONFIRMED-only)
- **action:** AI
- **⤳ Ta'sir:** Production, Finance, Warehouse
- **Xoch-havolalar:** `[Module-04] Item #67 (TASDIQ §04 #17)` · `[Module-04] Item #29` · `EXTRACTION QISM A #29` · `B04-trace 04.17`
- **Δ 2026-07-11→08-07:** —

### EP-COR-048 · Доклад holatlari (status) (v2-Q18)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5 holat: Qoralama→Topshirildi→Ko'rib chiqilmoqda→Qabul/Qaytarildi (EP-COR-005 bilan bir oqim).
- **Manba:** ShVB-40 Yo'nalish 8 (status oqimi)
- **Dalil (kod):** `dokla.status` — oddiy `text` ustun (enum emas); B04 04.18 bo'yicha jonli qiymatlar `sent/read/resolved` (3/5), controller'da `dokla/:id/read` va `dokla/:id/resolved` marshrutlari ulangan.
- **Nima yetishmaydi:** `qoralama` (draft) va `qaytarildi` (returned) holatlari; DB-darajali enum/CHECK; qaytarish sababi + versiya (VR-COR-I24).
- **Bog'liqlik:** EP-COR-005, VR-COR-I24 (kodlangan qaytarish sabablari)
- **action:** UPDATE
- **⤳ Ta'sir:** Doklad oqimi
- **Xoch-havolalar:** `[Module-04] Item #68 (TASDIQ §04 #18)` · `[Module-04] Item #48` · `EXTRACTION QISM A #48` · `B04-trace 04.18`
- **Δ 2026-07-11→08-07:** —

### EP-COR-049 · Распоряжение va Приказ farqi (v2-Q19)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — alohida: Распоряжение = bo'lim boshlig'i operativ; Приказ = faqat CEO/Owner rasmiy.
- **Manba:** ShVB-40 (Распоряжение vs Приказлар alohida modullar) + BARCHA_JAVOBLAR Q102 (direktor tasdig'i)
- **Dalil (kod):** `to_regclass('public.prikaz')` → **jadval MAVJUD**; `prikaz.repository.ts` (to'liq CRUD + `sign()` + `cancel()`) + `PrikazController` (`coordination-docs.controller.ts:51-87`); migratsiya `prikaz-protocol-2026-06-30.sql`. `rasporyazhenie` jadval alohida va mustaqil — ikkala entitet ham real, ajratilgan.
- **Nima yetishmaydi:** "Приказ faqat CEO/Owner" darvozasi enforce qilinmagan — `PrikazCreate` Zod sxemasi (`coordination-docs.controller.ts:23-27`) faqat `title` ni talab qiladi, chiqaruvchi roli tekshirilmaydi (sinf-darajali `@Roles` dan boshqa).
- **Bog'liqlik:** EP-COR-132 (direktor darvozasi), EP-COR-022
- **action:** CREATE
- **⤳ Ta'sir:** Ierarxiya, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item #69 (TASDIQ §04 #19)` · `[Module-04] Item 60 (TASDIQ §04 #60)` · `B04-trace 04.19`
- **⚠️ ZIDDIYAT:** `B04 04.19` "Приказ jadval/controller YO'Q (information_schema=0)" vs jonli `prikaz` jadval + repo + controller. B04 auditi 2026-06-27, migratsiya 2026-06-30 → **butun Приказ/Протокол klasteri (04.19, 04.26–04.37) B04 da eskirgan**.
- **Δ 2026-07-11→08-07:** —

### EP-COR-050 · Распоряжение ustuvorlik darajalari (v2-Q20)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 4 daraja (Past/O'rta/Yuqori/Shoshilinch), har darajaga standart muddat (Shoshilinch=shu kun, Yuqori=2 kun, O'rta=5, Past=10).
- **Manba:** ShVB-40 Yo'nalish 9 (raspHigh/Medium/Low) + EP-COR-008
- **Dalil (kod):** `rasporyazhenie.priority` va `.deadline` ikkalasi ham mavjud; `rasporyazhenie-escalation.cron.ts` allaqachon o'rnatilgan `deadline` ni iste'mol qiladi.
- **Nima yetishmaydi:** ustuvorlikdan standart muddatni **avto-hisoblash** yo'q (kod hech qayerda `priority → deadline` xaritasini qo'llamaydi); 4 darajaning o'zi enum bilan cheklanmagan; muddat qiymatlari (0/2/5/10 kun) `business_settings` da emas.
- **Bog'liqlik:** EP-COR-008, EP-COR-055 (holatlar), EP-COR-110 (navbat)
- **action:** CREATE
- **⤳ Ta'sir:** Navbat, eskalatsiya
- **Xoch-havolalar:** `[Module-04] Item #70 (TASDIQ §04 #20)` · `B04-trace 04.20`
- **Δ 2026-07-11→08-07:** —

### EP-COR-051 · Распоряжение majburiy maydonlari (v2-Q21)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — 6 majburiy maydon: Beruvchi/Bajaruvchi/Vazifa/Muddat/Ustuvorlik/Asos.
- **Manba:** A-default + ShVB-40 Yo'nalish 9 (entity maydonlari)
- **Dalil (kod):** `rasporyazhenie` ustun ro'yxatida 5 maydon bor (`issued_by`/`to_user`/`task`/`deadline`/`priority`) — **`Asos` (asos-hujjat havolasi) ustuni YO'Q**.
- **Nima yetishmaydi:** `basis_document_id` (asos) ustuni — bu EP-COR-059 (приказ asosi) va "oltin ip" zanjiri bilan bir bo'shliq; majburiylik Zod'da enforce qilinishi.
- **Bog'liqlik:** EP-COR-059 (приказ asosi), EP-COR-097 (papka №)
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik aniqligi
- **Xoch-havolalar:** `[Module-04] Item #71 (TASDIQ §04 #21)` · `B04-trace 04.21`
- **Δ 2026-07-11→08-07:** —

### EP-COR-052 · Bajaruvchi bitta yoki ko'pmi (v2-Q22)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — bitta asosiy mas'ul + ixtiyoriy yordamchilar.
- **Manba:** A-default
- **Dalil (kod):** `rasporyazhenie.to_user` — bitta ustun (`information_schema` bilan tasdiqlangan); `soispolnitel`/hammuallif ustuni topilmadi.
- **Nima yetishmaydi:** yordamchi(lar) ro'yxati (`rasporyazhenie_helpers` jadval yoki massiv ustun) va ularga ham signal borishi.
- **Bog'liqlik:** EP-COR-124 (operator+yordamchi juftligi — bir xil naqsh), EP-COR-109
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik
- **Xoch-havolalar:** `[Module-04] Item #72 (TASDIQ §04 #22)` · `B04-trace 04.22`
- **Δ 2026-07-11→08-07:** —

### EP-COR-053 · Распоряжение eskalatsiya zinapoyasi (v2-Q23)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 bosqich (muddat-1kun eslatma → bevosita boshliq → +2 kun otdeleniye boshlig'i → +3 kun CEO); zanjir org-sxema manager_id'dan (vertikal).
- **Manba:** BARCHA_JAVOBLAR Q122 (eskalatsiya) + master reja (Vysotskiy 7 manager_id)
- **Dalil (kod):** `rasporyazhenie-escalation.cron.ts` (to'liq o'qilgan) — **real ishlaydigan bir bosqichli** eskalatsiya: kunlik 09:00 da overdue belgilaydi + bajaruvchi VA beruvchiga xabar beradi. `resolveNextLevel()` org-yurish naqshi faqat alohida `zno-zvs-sla-escalation.cron.ts` da bor, rasporyazhenie'ga ulanmagan.
- **Nima yetishmaydi:** 3 bosqichli vertikal zinapoya (bevosita boshliq → otdeleniye → CEO); "muddat-1kun" oldindan eslatma; `escalation_log`. FULL-ITEM-LEVEL: `resolveNextLevel()` ni qayta ishlatish yetarli, yangi bog'liqlik yo'q.
- **Bog'liqlik:** EP-COR-009, EP-COR-027, VR-COR-I17 (`escalation_log` + CEO skip)
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura (manager_id), AI
- **Xoch-havolalar:** `[Module-04] Item #73 (TASDIQ §04 #23)` · `[Module-04] Item #33` · `EXTRACTION QISM A #33` · `B04-trace 04.23`
- **⚠️ ZIDDIYAT:** `B04 04.23` "@Cron/escalation yo'q; overdue faqat SELECT CASE (repo:111)" vs jonli kunlik cron + 2 tomonlama bildirishnoma → B04 kam baholagan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-054 · Farmoyishni rad etish yoki muddat so'rash (v2-Q24)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — "Rad etish/Uzaytirish so'rovi" (sabab majburiy) → beruvchi tasdiqlaydi/rad etadi.
- **Manba:** A-default + BARCHA_JAVOBLAR Q82 (izoh majburiy)
- **Dalil (kod):** `grep markRaspDone|rasp.*reject|rasp.*extend|acceptRasp` director modulida → faqat `markRaspDone` (yagona "bajarildi" o'tishi); rad etish yoki muddat uzaytirish marshruti/metodi YO'Q.
- **Nima yetishmaydi:** rad/uzaytirish so'rov entiteti + tasdiqlash oqimi + majburiy sabab.
- **Bog'liqlik:** EP-COR-055 (8 holat), EP-COR-010 (2 bosqich)
- **action:** UPDATE
- **⤳ Ta'sir:** Shaffoflik
- **Xoch-havolalar:** `[Module-04] Item #74 (TASDIQ §04 #24)` · `B04-trace 04.24`
- **Δ 2026-07-11→08-07:** —

### EP-COR-055 · Распоряжение holatlari (v2-Q25)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — 8 holatli to'liq oqim (Yangi/Qabul/Jarayonda/Bajarildi/Tekshiruvda/Yopildi/Bekor/Kechikkan).
- **Manba:** A-default + ShVB-40 Yo'nalish 9 (assigned/inProgress/done/overdue)
- **Dalil (kod):** `coordination.repository.ts:96,125,239-240` — jonli holat qiymatlari `'assigned'`, `'in_progress'`, `'done'` + eskalatsiya cron'idan `'overdue'` = **4 holat** (vizyon 8 ta so'raydi).
- **Nima yetishmaydi:** `Qabul` (EP-COR-010), `Tekshiruvda`/`Yopildi` (EP-COR-072 ikki bosqichli yopish), `Bekor` (EP-COR-054) holatlari.
- **Bog'liqlik:** EP-COR-010, EP-COR-054, EP-COR-072
- **action:** UPDATE
- **⤳ Ta'sir:** Nazorat
- **Xoch-havolalar:** `[Module-04] Item #75 (TASDIQ §04 #25)` · `B04-trace 04.25`
- **Δ 2026-07-11→08-07:** —

### EP-COR-056 · Приказ raqamlash formati (v2-Q26)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — "PR-YYYY-NNN" (yillik, har yil 001 dan, avto o'sadi); EP-COR-020 bilan bir.
- **Manba:** ShVB-40 Yo'nalish 31 (orderNumber) + LOYIHA-BITGAN-XOLAT (raqamlash tizimi)
- **Dalil (kod):** `prikaz.repository.ts:80-91` `sign()` — `prikaz_number = nextval('prikaz_number_seq')` (SEQUENCE `prikaz-protocol-2026-06-30.sql:9` da, unique indeks bilan). Raqamlash mexanizmi **real va race-himoyalangan**.
- **Nima yetishmaydi:** raqam yalang'och butun son — `PR-YYYY-NNN` formatlangan satr emas; yillik reset yo'q; kategoriya-prefiks yo'q (EP-COR-057).
- **Bog'liqlik:** EP-COR-020 (bir xil talab, boshqa format), EP-COR-057, EP-COR-058
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv qidiruv
- **Xoch-havolalar:** `[Module-04] Item #76 (TASDIQ §04 #26)` · `[Module-04] Item #5` · `EXTRACTION QISM A #5` · `B04-trace 04.26`
- **⚠️ ZIDDIYAT:** (1) `B04 04.26` "Приказ jadval/controller YO'Q" vs jonli SEQUENCE + repo → eskirgan. (2) EP-COR-020 "2026-001" vs EP-COR-056 "PR-YYYY-NNN" vs kod "integer" — uch xil format.
- **Δ 2026-07-11→08-07:** —

### EP-COR-057 · Приказ kategoriyalari va raqam prefiksi (v2-Q27)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A-default — 4 kategoriya, har biriga alohida prefiks va raqam qatori (Kadrlar К / Asosiy ОД / Moliya Ф / Xo'jalik АХ).
- **Manba:** A-default + EP-COR-019 (kategoriyalar)
- **Dalil (kod):** `prikaz` ustunlari (migratsiyadan): `id, prikaz_number, title, content, issued_by, status, signed_at, cancelled_at, cancel_reason, supersedes_id, created_at, updated_at` — baza entitet real (B04 ni inkor qiladi), lekin **kategoriya/prefiks ustuni yo'q** va har kategoriyaga alohida SEQUENCE yo'q (bitta global `prikaz_number_seq`).
- **Nima yetishmaydi:** `category` ustuni + kategoriya-bo'yicha SEQUENCE (4 ta) + prefiks formatlash.
- **Bog'liqlik:** EP-COR-019 (kategoriya master-data), EP-COR-056
- **action:** CREATE
- **⤳ Ta'sir:** HR (kadrlar buyruqlari), Finance
- **Xoch-havolalar:** `[Module-04] Item #77 (TASDIQ §04 #27)` · `B04-trace 04.27`
- **⚠️ ZIDDIYAT:** `B04 04.27` "Приказ entiteti yo'q" vs jonli `prikaz` jadval → eskirgan; haqiqiy bo'shliq faqat kategoriya ustuni.
- **Δ 2026-07-11→08-07:** —

### EP-COR-058 · Raqam ketma-ketligi va bekor teshigi (v2-Q28)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A-default — raqam teshigi qoldiriladi, bekor приказ "Bekor qilindi" holatida raqami bilan saqlanadi (qonuniy, immutable bilan mos).
- **Manba:** A-default + BARCHA_JAVOBLAR Q83 (immutable)
- **Dalil (kod):** `prikaz.repository.ts:94-104` `cancel()` — `status='cancelled'` qo'yadi va `prikaz_number` ga **umuman tegmaydi** (93-qatordagi izoh teshik ataylab saqlanishini tasdiqlaydi). Vizyon talabi aynan shu tarzda qurilgan.
- **Nima yetishmaydi:** talabning o'zi bajarilgan — qolgani egasi tasdig'i (🔵). Yagona ochiq nuqta: raqam `sign()` da beriladi, ya'ni **imzolanmagan** bekor приказ raqamsiz qoladi (teshik ham hosil bo'lmaydi) — bu vizyon niyatiga mos-mosligini egasi tasdiqlashi kerak.
- **Bog'liqlik:** EP-COR-056, EP-COR-061 (immutable)
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniy shaffoflik
- **Xoch-havolalar:** `[Module-04] Item #78 (TASDIQ §04 #28)` · `B04-trace 04.28`
- **⚠️ ZIDDIYAT:** `B04 04.28` "raqamlash umuman yo'q" vs jonli `cancel()` teshik-saqlash mantig'i → eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-059 · Приказ ilovasi va asos hujjati (v2-Q29)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — asos majburiy: kamida bitta hujjatga havola (majlis qarori/ariza/doklad) — to'liq zanjir.
- **Manba:** BARCHA_JAVOBLAR Q79 (hujjatlar sakramaydi, zanjir to'liq) + master reja (oltin ip)
- **Dalil (kod):** entitet mavjudligi tasdiqlangan (EP-COR-056/057/058), lekin `prikaz` ustunlarida **asos/basis FK yo'q**; `PrikazCreate` Zod sxemasi (`coordination-docs.controller.ts:23-27`) faqat `title` ni talab qiladi — asos hujjati umuman so'ralmaydi.
- **Nima yetishmaydi:** `basis_document_type` + `basis_document_id` (yoki polimorf havola) + majburiylik; `rasporyazhenie` da ham xuddi shunday `Asos` yo'q (EP-COR-051).
- **Bog'liqlik:** EP-COR-051, EP-COR-097 (papka №), EP-COR-013 (qaror→topshiriq)
- **action:** CREATE
- **⤳ Ta'sir:** Audit zanjiri
- **Xoch-havolalar:** `[Module-04] Item #79 (TASDIQ §04 #29)` · `B04-trace 04.29`
- **⚠️ ZIDDIYAT:** `B04 04.29` "Приказ yo'q" vs entitet bor → eskirgan; haqiqiy bo'shliq — asos FK.
- **Δ 2026-07-11→08-07:** —

### EP-COR-060 · Приказ amal qilish muddati va kuchga kirishi (v2-Q30)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — standart imzolangan kundan; ixtiyoriy "kuchga kirish sanasi" + "tugash sanasi" (EP-COR-021 bilan bir).
- **Manba:** ShVB-40 Yo'nalish 31 (orderEffectiveDate)
- **Dalil (kod):** `prikaz` jadval mavjud (B04 ni inkor qiladi), lekin sana ustunlari faqat `signed_at`, `cancelled_at` — `effective_date`/`expiry_date` YO'Q. Ya'ni "standart imzolangan kundan" qismi ishlaydi, ixtiyoriy sanalar yo'q.
- **Nima yetishmaydi:** `effective_date` + `expiry_date` ustunlari; kelajak-sanani faollashtiruvchi cron (VR-COR-I19 — ish-kun kalendari bilan).
- **Bog'liqlik:** EP-COR-021 (bir xil talab), VR-COR-I19
- **action:** CREATE
- **⤳ Ta'sir:** HR/Finance (qachondan)
- **Xoch-havolalar:** `[Module-04] Item #80 (TASDIQ §04 #30)` · `[Module-04] Item #22` · `B04-trace 04.30`
- **⚠️ ZIDDIYAT:** `B04 04.30` "Приказ jadval yo'q" vs jadval bor → eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-061 · Приказни o'zgartirish va bekor qilish (v2-Q31)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — imzolangan приказ qulflanadi (immutable); o'zgartirish faqat yangi "o'zgartirish kiritish to'g'risida" приказ bilan.
- **Manba:** BARCHA_JAVOBLAR Q83 (tasdiqlangan hujjat immutable)
- **Dalil (kod):** `prikaz.repository.ts:64-77` `updateDraft()` — `WHERE id = ${id} AND status = 'draft'`: imzolangan yoki bekor qilingan приказni bu repository orqali tahrirlab **bo'lmaydi** → dastur-darajali immutability real. `supersedes_id` ustuni ham bor (yangi приказ eskisini almashtirishi mumkin).
- **Nima yetishmaydi:** kriptografik buzilmaslik dalili yo'q — `document_hashes` jadval `null` (VR-COR-I05); "o'zgartirish kiritish to'g'risida" приказ turi alohida tasniflanmagan (EP-COR-057 kategoriya yo'qligi bilan bir).
- **Bog'liqlik:** VR-COR-I05 (`document_hashes`), EP-COR-024, VR-COR-I32 (bekor→HR)
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniylik, audit
- **Xoch-havolalar:** `[Module-04] Item #81 (TASDIQ §04 #31)` · `[Module-04] Item #31` · `[Module-04] Item #6` · `EXTRACTION QISM A #31/#6` · `B04-trace 04.31`
- **⚠️ ZIDDIYAT:** `B04 04.31` "Приказ + document_hashes jadval yo'q" — birinchi qismi noto'g'ri (приказ bor), ikkinchi qismi to'g'ri (`document_hashes` haqiqatan yo'q).
- **Δ 2026-07-11→08-07:** —

### EP-COR-062 · Протокол kim yozadi va shabloni (v2-Q32)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — kotib avto-shablonda (kun tartibi + qarorlar + ovoz natijasi + mas'ul + muddat avto); AI majlis yozuvidan qoralash.
- **Manba:** ShVB-40 Yo'nalish 10 (protocol) + Yo'nalish 39 (AI)
- **Dalil (kod):** `ProtocolController` (`coordination-docs.controller.ts:96-131`) real — `@Controller('protocols')`, list/get/create/update/sign/amend; `protocol.repository.ts` real; `secretary_id` ustuni bor.
- **Nima yetishmaydi:** avto-shablon generatsiyasi yo'q — `create()` mijoz yuborgan maydonlarni shundayligicha INSERT qiladi; AI-qoralash yo'q (`grep AI.*listener|@OnEvent` director'da = 0); ovoz natijasi/mas'ul/muddat avto to'ldirilmaydi.
- **Bog'liqlik:** EP-COR-011, EP-COR-013, VR-COR-I03 (AI diarizatsiya)
- **action:** CREATE
- **⤳ Ta'sir:** AI (qoralash)
- **Xoch-havolalar:** `[Module-04] Item #82 (TASDIQ §04 #32)` · `[Module-04] Item #3` · `EXTRACTION QISM A #3` · `EXTRACTION QISM D #3` · `B04-trace 04.32`
- **⚠️ ZIDDIYAT:** `B04 04.32` "protocol jadval/controller YO'Q (grep=0)" vs jonli controller+repo → eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-063 · Протокол imzo zanjiri (tartibi) (v2-Q33)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 2 bosqich: Kotib imzolaydi → Rais imzolaydi → "Tasdiqlangan"; 2-imzo prinsipiga mos.
- **Manba:** BARCHA_JAVOBLAR Q78 (2-imzo) + EP-COR-002 (rais/kotib)
- **Dalil (kod):** `protocol` jadvalda real `chairperson_id` va `secretary_id` ustunlari bor; `protocol.repository.ts:104-113` `sign()` mavjud.
- **Nima yetishmaydi:** `sign()` — **bitta status-flip**, kotib-keyin-rais ikki alohida imzo bosqichi yo'q; `councils.chairperson_id` 5/5 NULL (rais tayinlanmagan) → zanjir amalda ishga tushmaydi.
- **Bog'liqlik:** EP-COR-002 (rollar), EP-COR-064, EP-COR-065, VR-COR-I33 (kech e'tiroz imzoni bekor qiladi)
- **action:** APPROVE
- **⤳ Ta'sir:** Qaror kuchga kirishi
- **Xoch-havolalar:** `[Module-04] Item #83 (TASDIQ §04 #33)` · `[Module-04] Item #38` · `EXTRACTION QISM A #38` · `B04-trace 04.33`
- **⚠️ ZIDDIYAT:** `B04 04.33` "protokol entiteti yo'q; rais/kotib roli yo'q" vs jonli `chairperson_id`/`secretary_id` + `sign()` → eskirgan; haqiqiy bo'shliq — bitta imzo bosqichi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-064 · Imzo turi (raqamli) (v2-Q34)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tizim ichidagi "Tasdiqlash" (kim/qachon/IP audit yoziladi); fizik imzo + xodim tasdig'i modeli (EP-COR-023).
- **Manba:** BARCHA_JAVOBLAR Q78 (fizik imzo + tasdiq) + Q83 (audit)
- **Dalil (kod):** `ProtocolController` va `PrikazController` sinf darajasida `@UseInterceptors(AuditInterceptor)` — umumiy so'rov-darajali audit-log real va ishlaydi.
- **Nima yetishmaydi:** "imzo turi" maydoni yo'q; imzoga xos audit izi (kim/qachon/IP) umumiy interceptor'dan ajratilmagan; tashqi/skanerlangan imzo (VR-COR-I09) yo'q.
- **Bog'liqlik:** EP-COR-023, EP-COR-063, EP-COR-078 (audit izi), VR-COR-I09
- **action:** APPROVE
- **⤳ Ta'sir:** Audit-log
- **Xoch-havolalar:** `[Module-04] Item #84 (TASDIQ §04 #34)` · `B04-trace 04.34`
- **⚠️ ZIDDIYAT:** `B04 04.34` "protokol/imzo entiteti yo'q" vs jonli imzo metodi + audit interceptor → eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-065 · Imzo muddati va kechikishi (v2-Q35)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — majlisdan 2 ish kuni ichida Rais imzolashi shart; o'tsa eslatma + CEO ro'yxatiga; +rahbar har kuni imzo holatini belgilashi.
- **Manba:** BARCHA_JAVOBLAR Q77 (rahbar har kuni imzolaganini belgilashi, sabab) + Q122
- **Dalil (kod):** director modulida jami 3 cron (`@Cron` grep) — birortasi protokol/приказ imzo muddatiga qaratilmagan.
- **Nima yetishmaydi:** imzo muddati ustuni + kunlik eslatma cron'i + CEO ro'yxatiga ko'tarish; "2 ish kuni" ish-kun kalendarisiz hisoblanmaydi (VR-COR-I19).
- **Bog'liqlik:** EP-COR-063, EP-COR-027, VR-COR-I19
- **action:** CRON
- **⤳ Ta'sir:** NTF, Director
- **Xoch-havolalar:** `[Module-04] Item #85 (TASDIQ §04 #35)` · `B04-trace 04.35`
- **Δ 2026-07-11→08-07:** —

### EP-COR-066 · Imzolangan протоколни o'zgartirish (versiya) (v2-Q36)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — tasdiqlangach qulflanadi (immutable); tuzatish faqat "tuzatish protokoli" bilan, asl saqlanadi.
- **Manba:** BARCHA_JAVOBLAR Q83 (immutable)
- **Dalil (kod):** `protocol.repository.ts:116-126` `amend()` — yangi qator yaratadi, unda `parent_protocol_id` asl protokolga ishora qiladi, asl protokol `status='amended'` ga o'tadi; `updateDraft()` faqat `status='draft'` da ishlaydi → imzolangan protokol tahrirlanmaydi. Vizyon talabi aynan qurilgan.
- **Nima yetishmaydi:** kriptografik hash-verify yo'q (VR-COR-I05); kech e'tiroz qo'shilganda imzoni avto-bekor qilish yo'q (VR-COR-I33).
- **Bog'liqlik:** EP-COR-061, VR-COR-I05, VR-COR-I33
- **action:** UPDATE
- **⤳ Ta'sir:** Shaffoflik, audit
- **Xoch-havolalar:** `[Module-04] Item #86 (TASDIQ §04 #36)` · `[Module-04] Item #13` · `EXTRACTION QISM A #13` · `B04-trace 04.36`
- **⚠️ ZIDDIYAT:** `B04 04.36` **noto'g'ri jadvalni ko'rsatgan** — "cc_documents bor lekin 0, ulanmagan" deb yozilgan; `cc_documents` esa Communication Center ning alohida tizimi (hozir 2 qator). Haqiqiy `protocol` versiyalash (`amend()` + `parent_protocol_id`) real va ishlaydi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-067 · E'tiroz (osoboye mneniye) yozish (v2-Q37)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A-default — a'zo "alohida fikr" yozadi, protokolga ilova bo'ladi.
- **Manba:** A-default
- **Dalil (kod):** `protocol.dissenting_opinion JSONB` — real, yoziladigan maydon (`prikaz-protocol-2026-06-30.sql:39`), `create()` va `updateDraft()` ikkalasida ham o'rnatiladi (`protocol.repository.ts` to'liq o'qilgan).
- **Nima yetishmaydi:** a'zo-bo'yicha e'tiroz yozuvi (kim yozgani JSONB ichida strukturasiz); imzo bilan bog'liq oqim (VR-COR-I33 — e'tiroz qo'shilganda kotib imzosi avto-bekor bo'lishi) qurilmagan.
- **Bog'liqlik:** EP-COR-063, EP-COR-066, VR-COR-I33
- **action:** CREATE
- **⤳ Ta'sir:** Adolat
- **Xoch-havolalar:** `[Module-04] Item #87 (TASDIQ §04 #37)` · `[Module-04] Item #13` · `EXTRACTION QISM A #13` · `B04-trace 04.37`
- **⚠️ ZIDDIYAT:** `B04 04.37` "protokol/e'tiroz entiteti yo'q" vs jonli `dissenting_opinion JSONB` → eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-068 · Qaror = topshiriqqa avto aylanishi (v2-Q38)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har qarorga majlisda mas'ul + muddat belgilanadi, avto Распоряжение ochiladi (EP-COR-013).
- **Manba:** ShVB-40 Yo'nalish 10 (actionItems)
- **Dalil (kod):** `protocol.decisions` — bitta erkin-matn ustun; strukturalangan qaror entiteti yo'q; director modulida `actionItem→rasp` avto-yaratish kodi topilmadi.
- **Nima yetishmaydi:** `protocol_decisions` jadvali (mas'ul + muddat bilan) va undan `rasporyazhenie` ga avto-INSERT. ⭐ Bu **"oltin ip" ning COR-tomondagi asosiy uzilishi**.
- **Bog'liqlik:** EP-COR-013 (bir xil talab), EP-COR-069, EP-COR-070, EP-COR-115
- **action:** CREATE
- **⤳ Ta'sir:** butun COR zanjiri
- **Xoch-havolalar:** `[Module-04] Item #88 (TASDIQ §04 #38)` · `B04-trace 04.38`
- **Δ 2026-07-11→08-07:** —

### EP-COR-069 · Bajarilish foizi va holat ko'rsatkichi (v2-Q39)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — holat + foiz; har majlis boshida "o'tgan qarorlar holati" avto ko'rsatiladi.
- **Manba:** A-default
- **Dalil (kod):** bajarilish foizini hisoblash uchun strukturalangan qaror entiteti yo'q (EP-COR-068 bilan bir ildiz); `coordination.repository.ts` da faqat `COUNT(*) FILTER (WHERE status=...)` xom agregatlari bor.
- **Nima yetishmaydi:** qaror entiteti → keyin foiz hisobi va majlis-boshi vidjeti.
- **Bog'liqlik:** EP-COR-068 (birinchi shart), EP-COR-073, VR-COR-I04 (event bilan real-vaqt yangilanish)
- **action:** READ
- **⤳ Ta'sir:** Uzluksiz nazorat
- **Xoch-havolalar:** `[Module-04] Item #89 (TASDIQ §04 #39)` · `[Module-04] Item #4` · `EXTRACTION QISM A #4` · `B04-trace 04.39`
- **Δ 2026-07-11→08-07:** —

### EP-COR-070 · Bajarilmagan qarorni keyingi majlisga ko'chirish (v2-Q40)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — avto keyingi kun tartibiga "bajarilmagan qaror" bo'limida, mas'ul sabab tushuntiradi.
- **Manba:** A-default
- **Dalil (kod):** majlis/agenda entiteti yo'q — qarorni ko'chiradigan manzil yo'q; `RasporyazheniеCancelled` event grep=0.
- **Nima yetishmaydi:** majlis+agenda entiteti (EP-COR-037/040) va qaror entiteti (EP-COR-068) — ikkalasi ham oldingi shart.
- **Bog'liqlik:** EP-COR-037, EP-COR-040, EP-COR-068, VR-COR-I04
- **action:** CRON
- **⤳ Ta'sir:** Protokol, nazorat
- **Xoch-havolalar:** `[Module-04] Item #90 (TASDIQ §04 #40)` · `[Module-04] Item #9` · `EXTRACTION QISM A #9` · `B04-trace 04.40`
- **⚠️ ZIDDIYAT:** `decisions` EP-COR-070 `action: CRON` deb belgilaydi, `vision-1000 #9` esa aynan shu bandga ishora qilib **"EP-COR-070 — cron emas, event-driven zanjir"** deydi. Ikki manba mexanizm bo'yicha bir-biriga zid; egasi tanlashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-COR-071 · Bajarish dalili (pruf) talab (v2-Q41)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — Yuqori/Shoshilinch qarorlarga dalil majburiy, oddiyga ixtiyoriy.
- **Manba:** A-default
- **Dalil (kod):** `rasporyazhenie.done_note` — erkin matn ustun; jadvalda **fayl/ilova ustuni yo'q** (`information_schema` bilan tasdiqlangan). `grep proof_status|proof_url` → 0 (faqat vizyon hujjatlarida).
- **Nima yetishmaydi:** fayl-ilova ustuni + yuklash oqimi + `proof_status` (VR-COR-I12: 10 MB, jpg/png/pdf/mp4, buzilsa `missing` bayrog'i).
- **Bog'liqlik:** VR-COR-I12 (dalil fayli spetsifikatsiyasi), EP-COR-050 (ustuvorlik darajasi)
- **action:** UPDATE
- **⤳ Ta'sir:** Ishonch
- **Xoch-havolalar:** `[Module-04] Item #91 (TASDIQ §04 #41)` · `[Module-04] Item #16` · `EXTRACTION QISM A #16` · `B04-trace 04.41`
- **Δ 2026-07-11→08-07:** —

### EP-COR-072 · Bajarilishni kim tasdiqlaydi (yopish huquqi) (v2-Q42)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — bajaruvchi "Bajardim" → beruvchi/Rais "Qabul qildim" deb yopadi (2 bosqich, EP-COR-010 bilan bir).
- **Manba:** BARCHA_JAVOBLAR Q78 (yozgan xodim qabul qiladi) + EP-COR-010
- **Dalil (kod):** `coordination.repository.ts:140` `markRaspDone()` — yagona holat-yopish metodi (bir bosqichli "done"); `done_by` ustuni bor (kim yopgani yoziladi).
- **Nima yetishmaydi:** beruvchi/Rais tomonidan alohida "Qabul qildim" bosqichi va uni faqat beruvchi bajara olishini ta'minlaydigan huquq tekshiruvi.
- **Bog'liqlik:** EP-COR-010, EP-COR-055 (Tekshiruvda/Yopildi holatlari)
- **action:** APPROVE
- **⤳ Ta'sir:** Nazorat
- **Xoch-havolalar:** `[Module-04] Item #92 (TASDIQ §04 #42)` · `B04-trace 04.42`
- **Δ 2026-07-11→08-07:** —

### EP-COR-073 · Qaror bajarilish reytingi (mas'ullar) (v2-Q43)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — oylik bajarilish reytingi (o'z vaqtida %/kechikkan %) KPI'ga ulanadi.
- **Manba:** A-default
- **Dalil (kod):** `coordination.repository.ts` da faqat xom `COUNT(*) FILTER (WHERE status=...)` agregatlari — davomiy "o'z vaqtida %" reyting hisobi yo'q.
- **Nima yetishmaydi:** oylik reyting agregatsiyasi + KPI (`ckp_fact_values`) ga yozish; `ckp_fact_values` 0 qator (EP-COR-102/120 bilan bir bo'shliq).
- **Bog'liqlik:** EP-COR-102, EP-COR-120, EP-COR-135, VR-COR-I22 (KPI outbox/prorata)
- **action:** AI
- **⤳ Ta'sir:** HR/KPI (boshliq samaradorligi)
- **Xoch-havolalar:** `[Module-04] Item #93 (TASDIQ §04 #43)` · `B04-trace 04.43`
- **Δ 2026-07-11→08-07:** —

### EP-COR-074 · Arxivda nima saqlanadi (v2-Q44)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — to'liq paket har majlisga (protokol+kun tartibi+doklad+ovoz+qaror+davomat+ilova); butun hujjatlar ERP ichida saqlanadi.
- **Manba:** BARCHA_JAVOBLAR Q77 (barcha hujjatlar ERP ichida) + Q83 (immutable arxiv)
- **Dalil (kod):** majlis entiteti yo'q — 6 bo'lakni bog'laydigan markaz yo'q (kengash/protokol/приказ modullari o'qilganda bir necha bor tasdiqlangan).
- **Nima yetishmaydi:** majlis entiteti — bu **butun arxiv klasterining (EP-COR-074..079) ildiz to'sig'i**.
- **Bog'liqlik:** ⭐ EP-COR-037 (majlis entiteti) — EP-COR-075/076/077/078/079 hammasi shunga bog'liq
- **action:** CREATE
- **⤳ Ta'sir:** To'liq tarix
- **Xoch-havolalar:** `[Module-04] Item #94 (TASDIQ §04 #44)` · `B04-trace 04.44`
- **Δ 2026-07-11→08-07:** —

### EP-COR-075 · Arxivda qidiruv mezonlari (v2-Q45)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — ko'p mezonli (sana oralig'i + mavzu/kalit so'z + mas'ul + raqam + holat).
- **Manba:** A-default + EP-COR-014
- **Dalil (kod):** `ProtocolController.list()` / `PrikazController.list()` — filtrsiz `SELECT ... ORDER BY id DESC`, `@Query()` parametrlari yo'q, tsvector yo'q.
- **Nima yetishmaydi:** filtr parametrlari + FTS. Umumiy tsvector infratuzilmasi mavjud (`fuzzy-search.service.ts`, `search-fts-indexes.sql`) — qayta ishlatish mumkin (VR-COR-I20).
- **Bog'liqlik:** EP-COR-014, VR-COR-I20, EP-COR-076 (server-tomon maxfiylik filtri)
- **action:** READ
- **⤳ Ta'sir:** AI (tabiiy til qidiruv)
- **Xoch-havolalar:** `[Module-04] Item #95 (TASDIQ §04 #45)` · `[Module-04] Item #40` · `EXTRACTION QISM A #40` · `B04-trace 04.45`
- **Δ 2026-07-11→08-07:** —

### EP-COR-076 · Arxivga kirish huquqi (kim ko'radi) (v2-Q46)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — majlisga "Ochiq/Maxfiy" belgisi; maxfiyni faqat a'zolar+CEO; RBAC kartadan, maydon darajasi.
- **Manba:** BARCHA_JAVOBLAR Q43 (maxfiy hujjat ruxsati) + LOYIHA-BITGAN-XOLAT (RBAC kuchli, kartadan)
- **Dalil (kod):** `protocol` va `prikaz` da `visibility`/maxfiylik ustuni YO'Q (migratsiya ustun ro'yxati o'qilgan); yagona nazorat — sinf-darajali `@Roles(...)` guard, hujjat-bo'yicha ko'rinuvchanlik emas.
- **Nima yetishmaydi:** `visibility` (ochiq/maxfiy) ustuni + a'zolik/CEO bo'yicha server-tomon filtr + karta/maydon darajasidagi RBAC (EP-COR-131 bilan bir bo'shliq); maxfiy majlis RLS (VR-COR-I18).
- **Bog'liqlik:** EP-COR-131 (RBAC granularligi), VR-COR-I18, VR-COR-I20
- **action:** READ
- **⤳ Ta'sir:** HR (jazo/oylik maxfiyligi), Finance, Security
- **Xoch-havolalar:** `[Module-04] Item #96 (TASDIQ §04 #46)` · `[Module-04] Item #34` · `EXTRACTION QISM A #34` · `B04-trace 04.46`
- **Δ 2026-07-11→08-07:** —

### EP-COR-077 · Arxiv saqlash muddati va o'chirish taqiqi (v2-Q47)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — rasmiy hujjat o'chirilmaydi (faqat arxiv holati); kadrlar приказ muddatsiz, qolgani min. 5 yil.
- **Manba:** BARCHA_JAVOBLAR Q83 (immutable, o'chirib bo'lmaydi)
- **Dalil (kod):** `PrikazRepository` ham, `ProtocolRepository` ham (ikkalasi to'liq o'qilgan) **hech qanday delete metodini ochmaydi** — bu ikki entitet uchun hard-delete imkonsiz. Lekin aniq soft-delete/saqlash-siyosati ham yo'q.
- **Nima yetishmaydi:** `retention_until` / arxiv-holati ustuni; 5 yillik siyosat; **B04 aytgan `dokla`/`rasp` HARD DELETE (`repo db.delete`) muammosi bu ikki repo'ga tegishli emas — `dokla`/`rasp` tomonida alohida tekshirilishi kerak**.
- **Bog'liqlik:** EP-COR-024, EP-COR-074, EP-COR-078
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniylik
- **Xoch-havolalar:** `[Module-04] Item #97 (TASDIQ §04 #47)` · `B04-trace 04.47`
- **⚠️ ZIDDIYAT:** `B04 04.47` "dokla/rasp HARD DELETE (repo db.delete)" vs `FULL-ITEM-LEVEL` "Prikaz/Protocol repo'da delete metodi umuman yo'q" — **ikki manba turli entitetlar haqida gapiryapti**; B04 ni COR arxivi bo'yicha umumlashtirib bo'lmaydi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-078 · Arxiv o'zgarmasligi (audit izi) (v2-Q48)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har ko'rish/o'zgartirish/yuklab olish audit izga (kim/qachon).
- **Manba:** LOYIHA-BITGAN-XOLAT (to'liq audit-log) + BARCHA_JAVOBLAR Q83
- **Dalil (kod):** `AuditInterceptor` `PrikazController` va `ProtocolController` sinf dekoratorlarida tasdiqlangan — umumiy so'rov-darajali audit real. **Δ:** `e5bac042` (2026-07-13) — `document-control` moduli qo'shildi: `document-access-log.service.ts` (+118 qator) + `document-access.controller.ts`, **ko'rish/nusxalash/chop etish** hodisalarini loglaydi, CC hujjatlarida pilot qilingan.
- **Nima yetishmaydi:** yangi `document-access-log` **приказ/протокол** controller'lariga hali ulanmagan (faqat CC); `document_hashes` yo'q (VR-COR-I05) → "o'zgarmaganini" kriptografik isbotlash yo'q.
- **Bog'liqlik:** VR-COR-I05, EP-COR-131 (watermark/ruxsat), EP-COR-064
- **action:** EVENT
- **⤳ Ta'sir:** Ishonch, Security
- **Xoch-havolalar:** `[Module-04] Item #98 (TASDIQ §04 #48)` · `[Module-04] Item #6` · `B04-trace 04.48`
- **Δ 2026-07-11→08-07:** `e5bac042` — ko'rish/nusxalash/chop etish access-logging (CC'da pilot) · `3728606f` — tier-driven watermark hujjat ko'ruvchilarida.

### EP-COR-079 · Arxivdan eksport va hisobot (v2-Q49)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — bir tugma bilan davr hisoboti (qarorlar+bajarilish%+kechikkanlar) PDF/Excel.
- **Manba:** A-default
- **Dalil (kod):** `PrikazController` va `ProtocolController` da eksport marshruti yo'q — faqat list/get/create/update/sign/cancel/amend.
- **Nima yetishmaydi:** eksport endpoint + PDF/Excel generatori; bajarilish% hisobi (EP-COR-069) ham hali yo'q.
- **Bog'liqlik:** EP-COR-012, EP-COR-069, EP-COR-101
- **action:** EXPORT
- **⤳ Ta'sir:** Director, tekshiruv
- **Xoch-havolalar:** `[Module-04] Item #99 (TASDIQ §04 #49)` · `B04-trace 04.49`
- **Δ 2026-07-11→08-07:** —

### EP-COR-080 · Eslatma kanali (qaerga xabar boradi) (v2-Q50)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ERP ichi + Telegram (otdeleniye guruhi/shaxsiy); kimga yuborilishi manager_id/telegram_group'dan.
- **Manba:** ShVB-40 Yo'nalish 38 (Telegram) + master reja (telegram_group) + EP-COR-007
- **Dalil (kod):** `rasporyazhenie-escalation.cron.ts` va `zno-zvs-sla-escalation.cron.ts` (ikkalasi to'liq o'qilgan) ERP ning o'z `notifications` jadvaliga yozadi — ilova-ichi kanal real. **Δ:** `c7d4d0f8` (2026-08-07) — CC SLA cron'ining `pushNotification()` endi `TELEGRAM_SENDER` (`i-telegram-sender.port`) orqali **Telegram'ga ham** yetkazadi (`CreateNotificationHandler` bilan bir xil bog'langan-chat qidiruvi, `@Optional` — ulanish bo'lmasa cron sinmaydi).
- **Nima yetishmaydi:** COR-tomonda (dokla/rasp yaratilishi) hali Telegram push yo'q — Δ faqat CC hujjatlari eskalatsiyasini qamraydi; `telegram_group` (otdeleniye guruhi) manzillash tasdiqlanmagan.
- **Bog'liqlik:** EP-COR-007, EP-COR-029, VR-COR-I11 (yetkazish kafolati)
- **action:** EVENT
- **⤳ Ta'sir:** AI Integratsiya, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item #100 (TASDIQ §04 #50)` · `[Module-04] Item #15` · `EXTRACTION QISM A #15` · `EXTRACTION QISM D #15` · `B04-trace 04.50`
- **Δ 2026-07-11→08-07:** ⭐ `c7d4d0f8` — eskalatsiya bildirishnomasi **endi Telegram'ga yetadi** (avval faqat `cc_notifications` qatori yozilardi, oluvchi ilovani ochmasa bilmasdi).

### EP-COR-081 · Majlisni o'tkazmaslik/qoldirish qoidasi (v2-Q51)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — avto keyingi sanaga ko'chiriladi; tayyor dokladlar+kun tartibi saqlanib o'tadi.
- **Manba:** A-default
- **Dalil (kod):** majlis entiteti yo'q (bir necha bor tasdiqlangan).
- **Nima yetishmaydi:** majlis entiteti + ko'chirish cron'i + kun tartibi/doklad ilovasini saqlash.
- **Bog'liqlik:** EP-COR-037, EP-COR-040, VR-COR-I19 (bayram surish)
- **action:** CRON
- **⤳ Ta'sir:** Ma'lumot yo'qolmasligi
- **Xoch-havolalar:** `[Module-04] Item #101 (TASDIQ §04 #51)` · `B04-trace 04.51`
- **Δ 2026-07-11→08-07:** —

### EP-COR-082 · Favqulodda majlis va shoshilinch qaror (v2-Q52)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — 3 soatda chaqiriladi, yengil kvorum (50%), keyingi oddiy majlisda tasdiqlanadi.
- **Manba:** A-default
- **Dalil (kod):** `council-quorum.service.ts` (to'liq o'qilgan) 2/3 ulushini `COUNCIL_QUORUM_NUMERATOR/DENOMINATOR` konstantalarida **qattiq** belgilaydi — muqobil "favqulodda" ulush parametri yo'q; favqulodda sessiyani boshlaydigan majlis entiteti ham yo'q.
- **Nima yetishmaydi:** majlis entiteti + sozlanadigan kvorum ulushi (`business_settings`) + 3 soatlik taymer va "kvorum yetmadi" bayrog'i (VR-COR-I01/I02 bilan qo'shni).
- **Bog'liqlik:** EP-COR-033 (kvorum), EP-COR-037, EP-COR-039
- **action:** CREATE
- **⤳ Ta'sir:** Tezkor qaror
- **Xoch-havolalar:** `[Module-04] Item #102 (TASDIQ §04 #52)` · `[Module-04] Item #8` · `EXTRACTION QISM A #8` · `EXTRACTION QISM D #8` · `B04-trace 04.52`
- **Δ 2026-07-11→08-07:** —

### EP-COR-083 · Coordination ↔ boshqa modul bog'lanishi (v2-Q53)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — qaror turi bo'yicha tegishli modulga avto vazifa/signal (Production/Finance/HR/Warehouse) — oltin ip integratsiyasi.
- **Manba:** LOYIHA-BITGAN-XOLAT (modullararo sinxron, oltin ip) + ShVB-40 Yo'nalish 39
- **Dalil (kod):** `grep @OnEvent` `apps/api/src/modules/director` → **0 fayl** (director moduli boshqa modullarni faqat statik import qiladi). **Δ:** `48bcb53c` (2026-07-13) — CC tomonda **birinchi haqiqiy modullararo avto-signal** qurildi: `cc-approved-gl-posting.listener.ts` (+101 qator) `CcDocumentFullyApprovedEvent` ni eshitib moliyaviy shablon hujjatlari uchun **GL'ga avto-posting** qiladi; `seed-gl-account-mappings-cc-2026-07-13.sql` bilan hisob-xaritalari seed qilingan.
- **Nima yetishmaydi:** director/COR tomonda (dokla/rasp/protokol/приказ) hech qanday event emit/listen yo'q; qaror-turi → modul xaritasi yo'q. Δ faqat CC→GL yo'nalishini qamraydi.
- **Bog'liqlik:** VR-COR-I04 (7 yo'q event), EP-COR-068, EP-COR-114
- **action:** EVENT
- **⤳ Ta'sir:** Production, Finance, HR, Warehouse
- **Xoch-havolalar:** `[Module-04] Item #103 (TASDIQ §04 #53)` · `[Module-04] Item #50` · `EXTRACTION QISM A #50` · `B04-trace 04.53`
- **⚠️ ZIDDIYAT:** vizyon "event-driven, polling emas" (vision-1000 #4/#9) vs COR kodi "kunlik cron-polling" — **arxitektura ziddiyati**, `FULL-VISION-EXTRACTION` Step-3 da ham ochiq savol sifatida qayd etilgan.
- **Δ 2026-07-11→08-07:** ⭐ `48bcb53c` — CC-tasdiq → GL avto-posting listener (moliyaviy shablonlar uchun). Bu koordinatsiya qatlamidan chiqqan **birinchi jonli modullararo avto-signal**.

### EP-COR-084 · Kengash a'zosi o'zgarishi (lavozim almashinuvi) (v2-Q54)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lavozim o'zgarsa a'zolik avto yangi egasiga o'tadi (karta-model), ochiq topshiriqlar yangi mas'ulga ko'chadi (eslatma bilan).
- **Manba:** Vizyon (karta-model — kartaga xodim) + EP-COR-003
- **Dalil (kod):** `council_members` jadval mavjud (EP-COR-031), lekin org-lavozim o'zgarishiga bog'langan trigger/listener yo'q — `add()`/`updateRole()` (to'liq o'qilgan) faqat qo'lda API chaqiruvlari; org-lavozim-o'zgarish eventi bu tekshiruvda topilmadi.
- **Nima yetishmaydi:** ORG tomondan lavozim-o'zgarish eventi + COR listener; ochiq topshiriqlarni ko'chirish; `card_id` bog'lanishi (EP-COR-003).
- **Bog'liqlik:** EP-COR-003, EP-COR-031, VR-COR-I01 (ochiq sessiya snapshot'i)
- **action:** EVENT
- **⤳ Ta'sir:** HR/Org-struktura
- **Xoch-havolalar:** `[Module-04] Item #104 (TASDIQ §04 #54)` · `[Module-04] Item #1` · `EXTRACTION QISM A #1` · `B04-trace 04.54`
- **Δ 2026-07-11→08-07:** —

### EP-COR-085 · Majlis tili va ko'p tillilik (v2-Q55)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — asosiy til o'zbek lotin, har hujjatga til tanlash (lotin/kirill/rus).
- **Manba:** Master reja (i18n uz/uz-cyr/ru — loyiha 3 tilli)
- **Dalil (kod):** `coordination.json` uz/uz-cyr/ru mavjud (UI tili real, 3 til); lekin `protocol` ham, `prikaz` ham **til ustuniga ega emas** (migratsiya ustun ro'yxati o'qilgan).
- **Nima yetishmaydi:** hujjat-bo'yicha `language` ustuni; hujjatni tanlangan tilda chiqarish/pechat qilish.
- **Bog'liqlik:** EP-COR-012 (PDF), EP-COR-024
- **action:** CREATE
- **⤳ Ta'sir:** i18n
- **Xoch-havolalar:** `[Module-04] Item #105 (TASDIQ §04 #55)` · `B04-trace 04.55`
- **Δ 2026-07-11→08-07:** —

### EP-COR-086 · 1-sutkalik (24h) ishlab chiqarish rejasi (v2-Q56)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — har kuni 1-sutkalik reja generatsiya → logistika+uchastka+ombor kartasiga avto; o'zgarsa darrov push + log.
- **Manba:** A-default (kitob — rejalashtirish bo'limi)
- **Dalil (kod):** `daily-report.cron.ts:20` faqat `markAbsentEmployees` qiladi; 24h reja generatori/push mexanizmi topilmadi — mavjud cronlar (`rasporyazhenie-escalation`, `zno-zvs-sla-escalation`) reja bilan ishlamaydi.
- **Nima yetishmaydi:** 24h rejani o'qib 3 yo'nalishga (logistika/uchastka/ombor) fan-out push qiluvchi cron. **Modullararo bog'liqlik:** PP (Area 06/07) tomonda 24h reja manbasi avval tayyor bo'lishi kerak. (`notify()` INSERT naqshi `rasporyazhenie-escalation.cron.ts` da tayyor.)
- **Bog'liqlik:** PP/MPS moduli (24h reja manbasi), VR-COR-I04 (`ProductionPlanUpdated` event)
- **action:** CRON
- **⤳ Ta'sir:** Production (MPS/MES), Warehouse, Internal Logistics
- **Xoch-havolalar:** `[Module-04] Item 68 (TASDIQ §04 #68)` · `[Module-04] Item #47` · `EXTRACTION QISM A #47` · `B04-trace 04.68`
- **Δ 2026-07-11→08-07:** —

### EP-COR-087 · "Bekor turish" (downtime) koordinatsiya yozuvi (v2-Q57)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — bekor turish hodisasi (sabab + boshlanish/tugash + mas'ul bo'lim) → avto statistika.
- **Manba:** A-default (kitob — logistika KPI)
- **Dalil (kod):** `downtime_events` jadval real — ustunlar `session_id, event_type, reason_code, work_center_id, duration_minutes` va h.k.; `SELECT * FROM downtime_events LIMIT 2` → **2 qator**, ikkalasi ham test/isbot yozuvi (`notes: "mes proof"`, `"test db-proof insert"`), ishlab chiqarish ma'lumoti emas.
- **Nima yetishmaydi:** **"mas'ul bo'lim" (department/manager) atribut ustuni umuman yo'q**; downtime yozuvidan koordinatsiya-tomon event/bildirishnoma chiqmaydi → KPI'ga oziqlanmaydi va topshiriq ochmaydi.
- **Bog'liqlik:** MES (Area 10 — manba jadval egasi), EP-COR-108/122 (rahbar atributsiyasi), EP-COR-130
- **action:** EVENT
- **⤳ Ta'sir:** Production OEE, Internal Logistics KPI, Reports
- **Xoch-havolalar:** `[Module-04] Item 69 (TASDIQ §04 #69)` · `B04-trace 04.69`
- **Δ 2026-07-11→08-07:** —

### EP-COR-088 · Techkarta↔material: logistika STOP huquqi (v2-Q58)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — logistika "techkartaga mos emas" STOP qo'ya oladi → chiqish bloklanadi + rejalashtirish/dizaynerga xabar; STOP'ni faqat rejalashtirish/dizayn rahbari yechadi.
- **Manba:** A-default (kitob — 1-vazifa misoli)
- **Dalil (kod):** `outbound-enforcement.service.ts` `checkIssueAllowed()` (74-122) — `tech_card_bom` talablarini chiqim so'roviga solishtiradi va mos kelmasa **qattiq blok** qaytaradi (stub emas, jonli ishlaydigan kod).
- **Nima yetishmaydi:** vakolatli **override** (STOP yechish) yo'li yo'q; blok ishga tushganda **dizaynerga xabar** yo'q (`grep override|dizayner.*xabar` WMS'da 0); STOP'ni kim yechishi (rejalashtirish/dizayn rahbari) roli bilan bog'lanmagan.
- **Bog'liqlik:** EP-COR-112 (gofra qavati bloki — bir xil xizmat), VR-COR-I08 (i.o. STOP yechish huquqi)
- **action:** UPDATE
- **⤳ Ta'sir:** Quality, Warehouse, Production
- **Xoch-havolalar:** `[Module-04] Item 70 (TASDIQ §04 #70)` · `[Module-04] Item #11` · `EXTRACTION QISM A #11` · `B04-trace 04.70`
- **Δ 2026-07-11→08-07:** —

### EP-COR-089 · 5-Dept/13-bo'lim org-sxema yo'naltirish manbai (v2-Q59)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yo'naltirish 7-departament + bo'lim + sektsiya ierarxiyasiga bog'lanadi (Vysotskiy 7, sektsiya darajasigacha).
- **Manba:** Master reja (Vysotskiy 7 L0-L5: ...→Sektsiyalar→Sektorlar) + BARCHA_JAVOBLAR Q79
- **Dalil (kod):** `workflow_rules` jadval real, ustunlari `source_department_id, source_function_id, approver_department_id, approver_function_id, step_order` — **departament + funksiya darajasi**; `workflow-rules.repository.ts` + `workflow-rules.controller.ts` CRUD real; `SELECT count(*) FROM workflow_rules` → **0**.
- **Nima yetishmaydi:** ⭐ sxemada **`section_id` (sektsiya) darajasi umuman yo'q** — bu ma'lumot yetishmasligi emas, strukturaviy imkonsizlik; jadval ham bo'sh; hujjat yaratishda hech kim `resolve` ni chaqirmaydi.
- **Bog'liqlik:** EP-COR-028 (vertikal), EP-COR-119 (gorizontal, bir xil jadval), VR-COR-I16 (`rule_version_id`)
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura, butun koordinatsiya yo'nalishi
- **Xoch-havolalar:** `[Module-04] Item 65 (TASDIQ §04 #65)` · `[Module-04] Item 71-alt (TASDIQ §04 #71 — rekonsiliatsiya)` · `[Module-04] Item 101 (TASDIQ §04 #101)` · `B04-trace 04.65/04.71`
- **⚠️ ZIDDIYAT:** manba hujjatning o'zida **raqam to'qnashuvi** — `04.71` ikki xil mavzuga berilgan: B04 da "Koord hujjat 7-dept→bo'lim→sektsiya" (EP-COR-089), asosiy QISM C jadvalida esa "Bo'lim hisobot ritmi" (EP-COR-101). `FULL-ITEM-LEVEL` buni `Item 71` va `Item 71-alt` deb ajratgan.
- **Δ 2026-07-11→08-07:** —

### EP-COR-090 · Dizayn↔Savdo↔IChQ "ahborot uzluksizligi" (v2-Q60)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — har buyurtma handoff nuqtalari vaqt bilan yoziladi (savdo→dizayn, dizayn→IChQ); uzilish ko'rinadi.
- **Manba:** A-default (kitob — dizayn ЦКП)
- **Dalil (kod):** `to_regclass('public.sd_order_timeline')` → jadval mavjud, `count(*)` → **0 qator**. Strukturaviy jihatdan handoff hodisalarini yozishga qodir.
- **Nima yetishmaydi:** "bo'limlararo o'tishda sarflangan vaqt" (segment) tushunchasi yo'q; jadval bo'sh; uzilishni o'lchash/ko'rsatish yo'q.
- **Bog'liqlik:** EP-COR-103 (tayyorlik %) — shu jadvalga bog'liq, EP-COR-113, EP-COR-127
- **action:** EVENT
- **⤳ Ta'sir:** CRM/Sales, Design, Production
- **Xoch-havolalar:** `[Module-04] Item 72 (TASDIQ §04 #72)` · `B04-trace 04.72`
- **Δ 2026-07-11→08-07:** —

### EP-COR-091 · Bitrix24 karta-status zanjirini ko'chirish (v2-Q61)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — 4 status standart (ТТ keldi→Dizayn tayyorlanyapti→Tasdiqda→IChQ ga topshirildi); "Tasdiqda" — buyurtmachi tasdiqlaydi (podpisnoy list).
- **Manba:** A-default (kitob — Bitrix24 dizayn statuslari)
- **Dalil (kod):** `grep DesignStatus` `apps/api/src/modules/design` → 8 real fayl, jumladan `domain/enums/design-status.enum.ts`, `application/commands/update-design-status.handler.ts`, `domain/aggregates/design-order.aggregate.ts` — haqiqiy status-zanjir enum + CQRS buyruq handler. `design_orders` → **0 qator**.
- **Nima yetishmaydi:** Bitrix 1:1 moslik tasdiqlanmagan; "Tasdiqda" bosqichi buyurtmachi tasdig'iga (podpisnoy list) bog'lanmagan (EP-COR-092 Yo'q); jonli ishlatilmagan (0 qator).
- **Bog'liqlik:** EP-COR-092 (podpisnoy gate), EP-COR-133 (ТТ gate), EP-COR-113
- **action:** UPDATE
- **⤳ Ta'sir:** Design, CRM, Production handoff
- **Xoch-havolalar:** `[Module-04] Item 73 (TASDIQ §04 #73)` · `B04-trace 04.73`
- **Δ 2026-07-11→08-07:** —

### EP-COR-092 · Podpisnoy list — IChQ ruxsat darvozasi (v2-Q62)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — podpisnoy list bo'lmasa IChQ ga o'tkazish bloklanadi (qattiq gate).
- **Manba:** A-default (kitob — podpisnoy list asosiy tasdiq)
- **Dalil (kod):** `grep podpisnoy` butun `apps/api/src` → **0 mos** (hatto qisman ham yo'q); `podpisnoy_lists` jadval yo'q.
- **Nima yetishmaydi:** `podpisnoy_lists` jadval + `update-design-status.handler.ts` ichida qattiq gate. **Egasi-gate:** qaysi rol/hujjat haqiqiy "podpisnoy" yozuvi hisoblanishi hal qilinishi kerak.
- **Bog'liqlik:** EP-COR-091 (`DesignStatus` — kiritish nuqtasi), EP-COR-133, VR-COR-I29 (mutlaq muddat — vizyon "bloklash faqat podpisnoy gate uchun" deydi)
- **action:** UPDATE
- **⤳ Ta'sir:** Design→Production gate, Quality, Sales
- **Xoch-havolalar:** `[Module-04] Item 74 (TASDIQ §04 #74)` · `[Module-04] Item #20` · `EXTRACTION QISM A #20` · `B04-trace 04.74`
- **Δ 2026-07-11→08-07:** —

### EP-COR-093 · Qolip (СТП/kesuvchi) tayyorligi koordinatsiyasi (v2-Q63)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — har buyurtmada qolip holati (tayyor/buyurtma berilgan/kerak emas) → IChQ rejasiga bog'lanadi.
- **Manba:** A-default (kitob — dizayn rahbari qolip muvofiqligi)
- **Dalil (kod):** `design_tooling` jadval mavjud, **0 qator**; `design.controller.ts:191-206` `GET tooling/:id/wear-forecast` real endpoint — `wear_percentage`/`remaining_uses`/`next_maintenance_date` ni so'raydi (stub emas).
- **Nima yetishmaydi:** aniq IChQ reja-slotini aniq qolip tayyorligiga (tayyor/buyurtma berilgan/kerak emas) bog'laydigan buyurtma-bo'yicha aloqa yo'q; 0 qator.
- **Bog'liqlik:** EP-COR-096 (marshrut), EP-COR-130 (smena tayyorligi)
- **action:** READ
- **⤳ Ta'sir:** Production scheduling, Design, Procurement
- **Xoch-havolalar:** `[Module-04] Item 75 (TASDIQ §04 #75)` · `B04-trace 04.75`
- **Δ 2026-07-11→08-07:** —

### EP-COR-094 · Rohler/poddon (ichki transport) tayyorligi (v2-Q64)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — ichki transport reestri: holat (soz/ta'mirda/band) + band jadval.
- **Manba:** A-default (kitob — logistika rohler/poddon)
- **Dalil (kod):** transport-jihoz reestri jadval/xizmati topilmadi; yagona yaqin nom `ow_pallet_recoveries` — boshqa maqsad (poddon qaytarish), jihoz rejalashtirish emas, 0 qator.
- **Nima yetishmaydi:** `internal_transport_registry` jadval (jihoz id, holat soz/ta'mir/band, band jadval) + CRUD. **Egasi-DATA:** rohler/poddon aktivlar ro'yxati seed sifatida kerak.
- **Bog'liqlik:** EP-COR-095 (chiqindi), EP-COR-130
- **action:** READ
- **⤳ Ta'sir:** Internal Logistics, Maintenance, Production
- **Xoch-havolalar:** `[Module-04] Item 76 (TASDIQ §04 #76)` · `B04-trace 04.76`
- **Δ 2026-07-11→08-07:** —

### EP-COR-095 · Chiqindi/qoldiq chiqarish koordinatsiyasi (v2-Q65)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — uchastka "chiqindi to'ldi" signal → logistikaga topshiriq → bajarish tasdig'i (yopiq tsikl).
- **Manba:** A-default (kitob — logistika chiqindi)
- **Dalil (kod):** `waste_records` jadval mavjud, **0 qator**; yozuvni topshiriq-yaratishga bog'laydigan event/listener kodi topilmadi.
- **Nima yetishmaydi:** "to'ldi" chegara tekshiruvi + event → `rasporyazhenie` yaratish (naqsh `coordination.service.ts` da isbotlangan) → bajarish tasdig'i. **Threshold:** har konteyner turi uchun "to'la" qiymati `business_settings` da bo'lishi kerak.
- **Bog'liqlik:** EP-COR-094, EP-COR-129 (ichki xizmat so'rovi)
- **action:** EVENT
- **⤳ Ta'sir:** Internal Logistics, Warehouse, Safety
- **Xoch-havolalar:** `[Module-04] Item 77 (TASDIQ §04 #77)` · `B04-trace 04.77`
- **Δ 2026-07-11→08-07:** —

### EP-COR-096 · Algoritm turi (2–8 bo'lim) bo'lim-marshruti (v2-Q66)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — har buyurtmaga bo'lim-zanjiri (algoritm turi) → keyingi bo'lim avto ko'rinadi.
- **Manba:** A-default (Excel — algoritm turi)
- **Dalil (kod):** `mes_operations` jadval mavjud, **0 qator**; `document_routing_rules` ham bor (B04 04.78). Strukturaviy poydevor MES tomonda mavjud.
- **Nima yetishmaydi:** "algoritm turi" tasnif ustuni/mantig'i yo'q — buyurtmadan 2–8 bo'limli zanjirni avto-chiqarish yo'q; jadval bo'sh.
- **Bog'liqlik:** EP-COR-126 (yo'nalish turi — **bir xil bo'shliq**), MES (Area 10 marshrut poydevori)
- **action:** READ
- **⤳ Ta'sir:** Production routing, Internal Logistics, MES
- **Xoch-havolalar:** `[Module-04] Item 78 (TASDIQ §04 #78)` · `[Module-04] Item 108 (TASDIQ §04 #108)` · `B04-trace 04.78`
- **⚠️ ZIDDIYAT:** EP-COR-096 va EP-COR-126 bir xil jadval va bir xil yetishmayotgan tasnif ustuni haqida — manba ularni ikki alohida band qilib ajratgan (dublikat mavzu).
- **Δ 2026-07-11→08-07:** —

### EP-COR-097 · Buyurtma №/Papka № — yagona identifikator (v2-Q67)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — buyurtma/papka № yagona kalit, har koordinatsiya hujjati shunga bog'lanadi (fabrika tili); EP-COR-059 (asos hujjati) bilan mos.
- **Manba:** Master reja (oltin ip — buyurtma yagona kalit) + Excel (papka № amaliyot)
- **Dalil (kod):** `design_orders.papka_order_id` — real FK ustun (jonli sxema so'rovi bilan tasdiqlangan), `qc_braks.papka_order_id` ham bor. Ammo `coordination.service.ts` ning `createDoklaWithValidation`/`createRaspWithValidation` metodlarida `order_id`/`papka_no`/`papka_order_id` maydoni **umuman yo'q**; `cc_documents` da ham order-bog'lash ustuni yo'q.
- **Nima yetishmaydi:** `dokla`/`rasporyazhenie`/`cc_documents` ga `papka_order_id` FK (naqsh `design_orders` da tayyor) + create DTO'lariga o'tkazish. Egasi qarori talab qilinmaydi.
- **Bog'liqlik:** EP-COR-059 (asos hujjati), EP-COR-051 (Asos maydoni), oltin ip
- **action:** CREATE
- **⤳ Ta'sir:** barcha modullar (Sales, Production, Warehouse)
- **Xoch-havolalar:** `[Module-04] Item 67 (TASDIQ §04 #67)` · `[Module-04] Item 79 (TASDIQ §04 #79)` · `B04-trace 04.67/04.79`
- **⚠️ ZIDDIYAT:** bitta EP kod ikki itemga bo'lingan va **ikki xil holat** olgan — `Item 67` = "Yo'q" (koordinatsiya hujjatlari tomoni), `Item 79` = "Qisman" (dizayn tomoni). Registrda ikkalasi birlashtirildi: dizayn-yarmi bor, koordinatsiya-yarmi yo'q → **Qisman**.
- **Δ 2026-07-11→08-07:** —

### EP-COR-098 · Priladka (sozlash) vaqti koordinatsiyasi (v2-Q68)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — smena rejasida priladka oralig'i → logistika va keyingi buyurtma moslanadi.
- **Manba:** A-default (Excel — priladka soati)
- **Dalil (kod):** `grep priladka|changeover-coord` butun `apps/api/src` → **0 mos**.
- **Nima yetishmaydi:** MES tomonda "priladka/changeover" hodisa modeli hali yo'q — koordinatsiya iste'mol qiladigan manba tushunchasi mavjud emas (Area 10 bilan modullararo to'siq).
- **Bog'liqlik:** MES (Area 10 — changeover event modeli), EP-COR-099, EP-COR-130
- **action:** READ
- **⤳ Ta'sir:** Production scheduling, Internal Logistics
- **Xoch-havolalar:** `[Module-04] Item 80 (TASDIQ §04 #80)` · `B04-trace 04.80`
- **Δ 2026-07-11→08-07:** —

### EP-COR-099 · Smena (den/noch) topshirig'i — handover (v2-Q69)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — smena handover yozuvi (tugamagan buyurtma + ochiq STOP/bekor turish + eslatma) → keyingi smenaga o'tadi.
- **Manba:** A-default (Excel — den/noch smena)
- **Dalil (kod):** `mes_shift_handovers` jadval mavjud, **0 qator**; `mes-shifts-stats.controller.ts:49-73` — real `POST shifts/handover` (`notes`/`issues` maydonlari bilan kutilayotgan handover yaratadi) **va** `PATCH shifts/handover/:id/confirm` — qabul qiluvchi smena boshlig'ining imzo-darvozasi (kodda `SB0429` deb belgilangan). Auditning o'zi buni "minimal maydon" tavsifidan **ko'proq qurilgan** deb baholaydi.
- **Nima yetishmaydi:** vizyon so'ragan **strukturalangan** maydonlar (tugamagan buyurtma / ochiq STOP / bekor turish alohida tiplangan maydonlar) o'rniga erkin `notes`/`issues`; hech qachon ishlatilmagan (0 qator).
- **Bog'liqlik:** EP-COR-087 (bekor turish), EP-COR-130 (smena tayyorligi), VR-COR-I26 (MES avto-yopish)
- **action:** CREATE
- **⤳ Ta'sir:** Production (smena), Internal Logistics, HR
- **Xoch-havolalar:** `[Module-04] Item 81 (TASDIQ §04 #81)` · `[Module-04] Item #17` · `EXTRACTION QISM A #17` · `B04-trace 04.81`
- **Δ 2026-07-11→08-07:** —

### EP-COR-100 · "Muvaffaqiyatli harakat / odatiy xato" blanki (v2-Q70)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — har bo'lim/karta uchun blank davriy to'ldiriladi + AI tahlilga kiradi (bilim-yig'ish).
- **Manba:** A-default (kitob — har yo'riqnoma blanki)
- **Dalil (kod):** `lessons` jadval mavjud (13 qator), lekin bu **LMS kurs-darsi** jadvali — muvaffaqiyat/xato blanki emas; `success_blank`/`mistake_blank`/AI bilim-yig'ish jadvali yo'q.
- **Nima yetishmaydi:** alohida blank jadvali + davriy to'ldirish oqimi + AI bilim-bazasi quvuri. **Egasi-gate:** davriylik (kunlik/haftalik) va kim to'ldirishi majburiy ekani hal qilinmagan.
- **Bog'liqlik:** EP-COR-135 (karta-AI signal — birinchi shart), LMS (Area 03/12)
- **action:** CREATE
- **⤳ Ta'sir:** HR (LMS/karta AI), Quality
- **Xoch-havolalar:** `[Module-04] Item 82 (TASDIQ §04 #82)` · `[Module-04] Item #39` · `EXTRACTION QISM A #39` · `EXTRACTION QISM D #39` · `B04-trace 04.82`
- **Δ 2026-07-11→08-07:** —

### EP-COR-101 · Kunlik/haftalik/oylik hisobot ritmi (v2-Q71)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bo'limga kunlik/haftalik/oylik hisobot topshirig'i avto ochiladi + kechiksa eskalatsiya; avto kunlik hisobot (mashina→PDF).
- **Manba:** LOYIHA-BITGAN-XOLAT (avto kunlik hisobot mashina→PDF) + master reja
- **Dalil (kod):** `ai-daily-report.cron.ts` + `.service.ts` real; cron `@Cron('0 7 * * 1-6', { timeZone: 'Asia/Tashkent' })` — **faqat kunlik** (Du–Sh); shu faylda `weekly|monthly|haftalik|oylik` grep → hech narsa. `ckp-daily-aggregate.cron` ham bor.
- **Nima yetishmaydi:** haftalik va oylik ritm cronlari (3 dan 2 tasi yo'q); hisobot topshirilmasa eskalatsiya mantig'i yo'q; mashina→PDF quvuri tasdiqlanmagan.
- **Bog'liqlik:** EP-COR-043 (doklad turlari), EP-COR-045 (eskalatsiya), EP-COR-079 (eksport)
- **action:** CRON
- **⤳ Ta'sir:** barcha bo'lim rahbarlari, Reports
- **Xoch-havolalar:** `[Module-04] Item 71 (TASDIQ §04 #71)` · `[Module-04] Item 83 (TASDIQ §04 #83)` · `B04-trace 04.83`
- **⚠️ ZIDDIYAT:** manba jadvalning o'zi `04.71` va `04.83` ni **bir xil mavzu** deb tan oladi (dublikat qator); bundan tashqari `04.71` raqami EP-COR-089 bilan ham to'qnashadi (`Item 71-alt` ga qarang).
- **Δ 2026-07-11→08-07:** —

### EP-COR-102 · Statistik KPI — koordinatsiyada avto o'lchov (v2-Q72)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har lavozim yo'riqnomadagi KPI lari koordinatsiya hodisalaridan avto hisoblanadi (manipulyatsiyasiz); 30/70 prinsip.
- **Manba:** LOYIHA-BITGAN-XOLAT (30% kiritish/70% tahlil) + vizyon (karta KPI)
- **Dalil (kod):** `ckp_fact_values` jadval mavjud, **0 qator**; `ckp-cascade.listener` va `ckp-daily-aggregate.cron` real; `org-structure/ckp-fact.service.ts` — jonli dastur kodi (stub emas).
- **Nima yetishmaydi:** hech qanday koordinatsiya hodisasi (dokla/rasp yopilishi, eskalatsiya) `ckp_fact_values` ga **yozmaydi** — jadval bo'sh, KPI koordinatsiya faoliyatidan oziqlanmaydi.
- **Bog'liqlik:** EP-COR-120 (bir xil jadval), EP-COR-135, EP-COR-073, VR-COR-I22
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Reports, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 84 (TASDIQ §04 #84)` · `[Module-04] Item 102 (TASDIQ §04 #102)` · `B04-trace 04.84`
- **Δ 2026-07-11→08-07:** —

### EP-COR-103 · Buyurtma "tayyorlik %" — bo'limlararo ko'rsatkich (v2-Q73)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — har buyurtmaga tayyorlik % (o'tilgan bo'lim/jami bo'lim) — real vaqtda.
- **Manba:** A-default (Excel — buyurtma tayyorligi %)
- **Dalil (kod):** `sd_order_timeline` mavjud lekin **0 qator** (EP-COR-090 bilan bir jadval); koordinatsiya yoki SD modullarida foiz-progress hisoblash kodi topilmadi.
- **Nima yetishmaydi:** `(o'tilgan bo'lim / marshrutdagi jami bo'lim)` hisobi — lekin **avval `sd_order_timeline` real handoff hodisalari bilan to'ldirilishi kerak** (EP-COR-090). STOP bo'limlarini denominatordan chiqarish qoidasi ham yo'q (VR-COR-I15).
- **Bog'liqlik:** EP-COR-090 (birinchi shart), VR-COR-I15 (STOP kategoriyasi)
- **action:** READ
- **⤳ Ta'sir:** CRM, Production, Coordination dashboard
- **Xoch-havolalar:** `[Module-04] Item 85 (TASDIQ §04 #85)` · `[Module-04] Item #30` · `EXTRACTION QISM A #30` · `B04-trace 04.85`
- **Δ 2026-07-11→08-07:** —

### EP-COR-104 · Menejer buyurtma egasi sifatida (v2-Q74)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — buyurtma menejerga bog'lanadi → kechikish/STOP/handoff menejerga ham bildiriladi.
- **Manba:** A-default (Excel — menejer biriktirilgan)
- **Dalil (kod):** `design_orders.manager_id` — real FK ustun (jonli sxema so'rovi bilan tasdiqlangan); lekin kechikish/STOP/handoff hodisasini shu `manager_id` ga bog'laydigan bildirishnoma zanjiri topilmadi (design modulida `@OnEvent`/notification-insert naqshi yo'q).
- **Nima yetishmaydi:** FK bor, lekin **inert** — hech qanday event menejerga xabar yubormaydi; `ManagerReassigned` eventi ham yo'q (VR-COR-I04).
- **Bog'liqlik:** VR-COR-I04 (`ManagerReassigned`), EP-COR-111 (broadcast), EP-COR-114
- **action:** EVENT
- **⤳ Ta'sir:** CRM/Sales, Notifications
- **Xoch-havolalar:** `[Module-04] Item 86 (TASDIQ §04 #86)` · `[Module-04] Item #25` · `EXTRACTION QISM A #25` · `B04-trace 04.86`
- **Δ 2026-07-11→08-07:** —

### EP-COR-105 · Turniket (kirish-chiqish) — "ish joyida bormi" (v2-Q75)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — topshiriq berishda turniket holati ko'rinadi (ishda/ishda emas) → yo'q odamga bermaslik/qayta yo'naltirish.
- **Manba:** A-default (kitob — turniket) + AI kamera davomat (LOYIHA-BITGAN-XOLAT)
- **Dalil (kod):** `attendance_logs` jadval mavjud, **0 qator**; `coordination.service.ts` `createRaspWithValidation` da turniket/davomat tekshiruvi YO'Q.
- **Nima yetishmaydi:** rasporyazhenie biriktirish oqimiga davomat-darvoza/ogohlantirish; `attendance_logs` turniket/IoT integratsiyasi bilan to'ldirilishi (hozir 0 qator).
- **Bog'liqlik:** EP-COR-041 (davomat), VR-COR-I06 (`attendance_conflicts`), HR/IoT
- **action:** READ
- **⤳ Ta'sir:** HR (davomat/turniket), Notifications
- **Xoch-havolalar:** `[Module-04] Item 87 (TASDIQ §04 #87)` · `[Module-04] Item #7` · `EXTRACTION QISM A #7` · `B04-trace 04.87`
- **Δ 2026-07-11→08-07:** —

### EP-COR-106 · "Uch karzina" (3-tray) hujjat tizimi (v2-Q76)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har xodim paneli 3 ustun: Yangi/Jarayonda/Tugagan (uch karzina metaforasi).
- **Manba:** ShVB-40 Yo'nalish 19 (3-savat: incoming/pending/outgoing) — Kanban moduli
- **Dalil (kod):** `coordination.controller.ts:84-87` real `GET /coordination/baskets` → `CoordinationService.getBaskets()` → `coordination.repository.ts:178` `listBaskets()` (`cc_documents.basket_state`); FE `CoordinationPage.tsx` + `components/kanban/ThreeBasketsPanel.tsx` + `components/cc/BasketColumn.tsx`. `SELECT count(*) FROM cc_documents` → **2 qator** (2026-07-01/07-03 da yaratilgan, ikkalasi ham `basket_state='outbox'`).
- **Nima yetishmaydi:** birorta qator Yangi→Jarayonda→Tugagan bo'ylab **harakatlanmagan** — 3 ustunli oqim uchdan-uchgacha sinalmagan.
- **Bog'liqlik:** EP-COR-128 (shoshilinch bayroq — bir xil so'rov), VR-COR-I28 (Kanban izolyatsiyasi)
- **action:** READ
- **⤳ Ta'sir:** Coordination UI, Kanban, HR (karta)
- **Xoch-havolalar:** `[Module-04] Item 66 (TASDIQ §04 #66)` · `[Module-04] Item 88 (TASDIQ §04 #88)` · `[Module-04] Item #24` · `EXTRACTION QISM D #24` · `B04-trace 04.66/04.88`
- **⚠️ ZIDDIYAT:** `B04 04.66/04.88` "cc_documents=0, ma'lumotsiz" vs jonli **2 qator** (2026-07-11 tekshiruvi). Kichik, lekin "umuman ishlatilmagan" degan xulosani yumshatadi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-107 · "Ishni tashlab ketish"/boshqa ish — intizom signali (v2-Q77)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — topshiriq X soat harakatsiz qolsa → rahbarga "harakatsiz" signal (yumshoq nazorat).
- **Manba:** A-default (kitob — intizom xatosi)
- **Dalil (kod):** `grep inactivity|harakatsiz` `apps/api/src` → 4 mos, hammasi aloqasiz (CRM lead-scoring, POS inactive-materials). Yagona yaqin mexanizm — overdue cron (EP-COR-009), lekin u **`deadline` o'tishiga** ishlaydi, "X soat harakatsizlik"ka emas (topshiriq muddat ichida bo'lib ham tegilmagan bo'lishi mumkin).
- **Nima yetishmaydi:** `last_touched_at` ustuni + mavjud cron naqshiga qo'shimcha tekshiruv. **Threshold:** "X soat" `business_settings` da bo'lishi kerak.
- **Bog'liqlik:** EP-COR-009 (bir xil cron infratuzilmasi), EP-COR-109
- **action:** EVENT
- **⤳ Ta'sir:** HR (intizom), Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 89 (TASDIQ §04 #89)` · `B04-trace 04.89`
- **Δ 2026-07-11→08-07:** —

### EP-COR-108 · "Rahbar kamchiligi" prinsipi — xato bo'lim rahbariga (v2-Q78)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bo'lim ichidagi xato/qayta-ishlash bo'lim rahbarining ko'rsatkichiga ham yoziladi (kitob falsafasi: mas'uliyat rahbarda).
- **Manba:** Kitob (aniq prinsip — "rahbar boshqaruvidagi kamchilik") + vizyon (karta KPI)
- **Dalil (kod):** `grep responsible_manager` `apps/api/src` → 3 mos, hammasi `modules/pp/production/*` da (`responsible_manager_name`/`_id` ishlab chiqarish buyurtmalarida) — **`qc_braks` da yo'q**; `qc_braks` jadval mavjud, 0 qator, atributsiya ustunisiz.
- **Nima yetishmaydi:** `qc_braks` ga `responsible_manager_id`/`responsible_department_id` + shu kalit bo'yicha KPI agregatsiyasi. **Egasi-gate:** atributsiya qoidasi (operatorning rahbari? nuqson chiqargan bo'lim? QC ko'ruvchining rahbari?) hech qayerda belgilanmagan.
- **Bog'liqlik:** EP-COR-122 (**bir xil jadval, bir xil yetishmayotgan ustun**), EP-COR-102, EP-COR-135
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Quality, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 90 (TASDIQ §04 #90)` · `[Module-04] Item 104 (TASDIQ §04 #104)` · `B04-trace 04.90`
- **⚠️ ZIDDIYAT:** EP-COR-108 va EP-COR-122 bitta texnik bo'shliq (`qc_braks` da atributsiya ustuni yo'qligi) — manba ikki alohida band qilib bergan; `FULL-ITEM-LEVEL` ni o'zi "duplicate topic" deb belgilaydi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-109 · Ish yuklamasini muvozanatlash (v2-Q79)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — bo'lim ichida yuklama ko'rinishi (har xodimda ochiq ish soni/og'irligi) + bir tugmada qayta biriktirish.
- **Manba:** A-default (kitob — yuklama muvozanati)
- **Dalil (kod):** `grep reassign|workload` `apps/api/src/modules/kanban` → **0 fayl**. Kanban'da `assignee` maydoni bor, lekin yuklama-hisobi yoki bir-tugmali qayta biriktirish endpoint'i yo'q.
- **Nima yetishmaydi:** bo'lim/bajaruvchi bo'yicha ochiq-ish sonini agregatlovchi `GET` + kanban kartasida `PATCH reassign`.
- **Bog'liqlik:** EP-COR-052 (yordamchilar), EP-COR-105 (turniket holati), Kanban (Area 15)
- **action:** UPDATE
- **⤳ Ta'sir:** HR (karta), Design
- **Xoch-havolalar:** `[Module-04] Item 91 (TASDIQ §04 #91)` · `B04-trace 04.91`
- **Δ 2026-07-11→08-07:** —

### EP-COR-110 · Ustuvorlik (1/2/keyingi navbat) — navbat huquqi (v2-Q80)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — buyurtmaga ustuvorlik (1/2/keyingi) belgilanadi → reja/navbat shunga qarab tartiblanadi.
- **Manba:** A-default (kitob/Excel — ochered navbati)
- **Dalil (kod):** `design_orders.priority` real; `cc-baskets.repo.ts:68` da `CASE d.priority WHEN 'urgent' THEN 0 ...` tartiblash naqshi jonli. `grep priority.*queue|sales_orders.*priority|queue_position` → 2 aloqasiz fayl (PP production-orders repo, logistics route service).
- **Nima yetishmaydi:** ⭐ **`sales_orders`** — tashkilotning kanonik buyurtma jadvali — da ustuvorlik/navbat ustuni yoki mantig'i **yo'q**; ustuvorlik faqat dizayn va CC savatlarida yashaydi.
- **Bog'liqlik:** EP-COR-128 (shoshilinch bayroq), EP-COR-050, SD moduli (`sales_orders`)
- **action:** UPDATE
- **⤳ Ta'sir:** Production scheduling, Design, Sales
- **Xoch-havolalar:** `[Module-04] Item 92 (TASDIQ §04 #92)` · `B04-trace 04.92`
- **Δ 2026-07-11→08-07:** —

### EP-COR-111 · Material yetishmovchiligi — koordinatsiya signali (v2-Q81)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — uchastka "material yetishmadi" signal → logistika + ombor + rejalashtirish bir vaqtda xabardor.
- **Manba:** A-default (kitob — bekor turish sababi)
- **Dalil (kod):** `downtime_events.reason_code` `MATERIAL` qiymatini qo'llab-quvvatlaydi (`aggregate:27`); `grep MATERIAL_SHORTAGE|stock.alert|StockAlert` → 35 mos, jumladan real `apps/api/src/cron/stock-alert.cron.ts` va `pos-notifications.service.ts`; `remaining/exception-log.controller.ts:76` `POST material-shortage` → `exception-log.service.ts:105` faqat `exception_log` ga INSERT (status `pending`).
- **Nima yetishmaydi:** uchta mexanizm (downtime sabab, stock-alert cron, exception-log) **alohida** ishlaydi — Logistika + Ombor + Reja(PP) ga bir vaqtda ketadigan yagona fan-out event yo'q; "harakatdaman" holati yo'q (vision-1000 #43).
- **Bog'liqlik:** VR-COR-I04 (fan-out event), EP-COR-087, WMS/PP (Area 13/06)
- **action:** EVENT
- **⤳ Ta'sir:** Warehouse, Internal Logistics, Production, Planning
- **Xoch-havolalar:** `[Module-04] Item 93 (TASDIQ §04 #93)` · `[Module-04] Item #43` · `EXTRACTION QISM A #43` · `EXTRACTION QISM D #43` · `B04-trace 04.93`
- **Δ 2026-07-11→08-07:** —

### EP-COR-112 · Gofra qavati (3/5) aralashtirish xatosi oldini olish (v2-Q82)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** **Ha** *(2026-07-11)*
- **Talab:** A-default — material chiqarishda skaner techkarta gofra-turini solishtiradi → mos kelmasa ogohlantirish.
- **Manba:** A-default (kitob — 2-vazifa misoli)
- **Dalil (kod):** `outbound-enforcement.service.ts:74-115` — jonli ishlaydigan mantiq: `tech_card_bom` bilan JOIN, `row.bom_layer !== issuedLayer` solishtiruvi, mos kelmasa `{ allowed: false, blockCode: 'BLOCK_GOFRA_LAYER_MISMATCH' }` + `EP-WMS-085` ogohlantirish logi. Stub emas — haqiqiy qattiq blok.
- **Bog'liqlik:** EP-COR-088 (bir xil xizmat, STOP tomoni)
- **action:** UPDATE
- **⤳ Ta'sir:** Warehouse, Quality, POS Monitor
- **Xoch-havolalar:** `[Module-04] Item 94 (TASDIQ §04 #94)` · `B04-trace 04.94`
- **📌 Eslatma:** bu modulning **yagona to'liq "Ha"** bandi (kitobdagi 2-vazifa misoli aynan qurilgan). Qaror bo'yicha hamon 🔵 (A-default egasi tasdig'isiz), qurilish bo'yicha tugagan — ikki o'q mustaqilligining eng aniq namunasi.
- **Δ 2026-07-11→08-07:** —

### EP-COR-113 · Konstruktor↔dizayn koordinatsiyasi (5-Dept) (v2-Q83)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — dizayn↔konstruktor handoff alohida bosqich (o'lcham/begovka/vysechka tasdig'i bilan).
- **Manba:** A-default (kitob — 5-Dept dizayn+konstruktor)
- **Dalil (kod):** `grep konstruktor|begovka` `apps/api/src` bilan cheklab → **0 mos** (repo-bo'ylab faqat `docs/` vizyon fayllarida uchraydi, dastur kodida yo'q).
- **Nima yetishmaydi:** "konstruktor" handoff bosqichi + o'lcham/begovka/vysechka tasdiq maydonlari, mavjud `DesignStatus` avtomatiga kiritilishi. **Egasi-gate:** "konstruktor" yangi alohida rol/karta mi yoki dizayner ichidagi ruxsatmi — belgilanmagan.
- **Bog'liqlik:** EP-COR-091 (`DesignStatus` — kiritish nuqtasi), EP-COR-090 (handoff)
- **action:** EVENT
- **⤳ Ta'sir:** Design, Production, Quality
- **Xoch-havolalar:** `[Module-04] Item 95 (TASDIQ §04 #95)` · `B04-trace 04.95`
- **Δ 2026-07-11→08-07:** —

### EP-COR-114 · Buyurtma o'zgarishi — o'zgarish bildirishnomasi (v2-Q84)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — buyurtma o'zgarishi → ta'sirlangan bo'limlarga (logistika/ombor/IChQ/dizayn) bildirishnoma + tasdiq talab.
- **Manba:** LOYIHA-BITGAN-XOLAT (modullararo sinxron) + kitob (logistika xatosi: o'zgarishni hisobga olmaslik)
- **Dalil (kod):** `design_order_revisions` jadval mavjud, **0 qator**; `sd_order_timeline` ham bor (0 qator). `grep broadcast|acknowledge|ack_` `apps/api/src/modules/design` → **0 mos**.
- **Nima yetishmaydi:** ta'sirlangan bo'limlarga broadcast; "tanishdim/tasdiqladim" (acknowledge) kuzatuvi; ikkala jadval ham bo'sh.
- **Bog'liqlik:** EP-COR-104 (menejerga xabar), EP-COR-083 (modullararo signal), VR-COR-I04
- **action:** EVENT
- **⤳ Ta'sir:** barcha modullar, Notifications
- **Xoch-havolalar:** `[Module-04] Item 96 (TASDIQ §04 #96)` · `B04-trace 04.96`
- **Δ 2026-07-11→08-07:** —

### EP-COR-115 · Yig'ilish ishtiroki + topshiriq bajarilishi bog'lanishi (v2-Q85)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — yig'ilish ishtiroki yoziladi + undan chiqqan topshiriqlar bajarilishi shu yig'ilishga ulanadi (yopiq tsikl).
- **Manba:** A-default + EP-COR-068 (qaror→topshiriq)
- **Dalil (kod):** `grep actionItem|action_item` `apps/api/src` → 1 mos, HR `hr-employee-goals.controller.ts` (aloqasiz). Majlis entiteti yo'q; davomat↔rasporyazhenie bog'lanishi yo'q. B04 "protokol→action-item zanjiri qism A da bor" degani amalda `dokla` dan `rasporyazhenie` yaratish imkoniyati (ikkalasi ham real CRUD) — **haqiqiy protokol-qaror action-item emas**.
- **Nima yetishmaydi:** majlis + davomat entitetlari (EP-COR-037/041) va qaror entiteti (EP-COR-068) — uchalasi ham oldingi shart.
- **Bog'liqlik:** EP-COR-037, EP-COR-041, EP-COR-068, EP-COR-013
- **action:** EVENT
- **⤳ Ta'sir:** Coordination (protokol), HR, Reports
- **Xoch-havolalar:** `[Module-04] Item 97 (TASDIQ §04 #97)` · `B04-trace 04.97`
- **Δ 2026-07-11→08-07:** —

### EP-COR-116 · Energiya/resurs tejash (suv/gaz/svet) — javobgarlik (v2-Q86)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — energiya tejash karta javobgarligiga KPI sifatida ulanadi.
- **Manba:** A-default (kitob — logistika javobgarligi)
- **Dalil (kod):** `grep -i energy` `apps/api/src` → 14 mos, hammasi IoT sensor/energiya-iste'moli monitoringi (`iot-main.controller.ts`, `sensor-status.enum.ts`) yoki aloqasiz moliya-hisobot maydonlari — **karta-darajali KPI yoki koordinatsiya signaliga ulangani yo'q**.
- **Nima yetishmaydi:** mavjud `kpi_definitions`/`kpi_values` naqshi asosida karta-darajali energiya KPI'si, IoT sensor ma'lumotidan agregatlangan. **Threshold:** karta turi bo'yicha tejash maqsadi `business_settings` da kerak.
- **Bog'liqlik:** IoT (Area 08 — sensor ma'lumoti mavjud), EP-COR-102, EP-COR-120
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Operations, Reports
- **Xoch-havolalar:** `[Module-04] Item 98 (TASDIQ §04 #98)` · `B04-trace 04.98`
- **Δ 2026-07-11→08-07:** —

### EP-COR-117 · "Nazorat varaqasi" (onboarding) bilan bog'lash (v2-Q87)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — nazorat varaqasi tugamasa kartaning to'liq topshiriqlari ochilmaydi (yumshoq gate); onboarding karta papkasidan.
- **Manba:** Vizyon (karta papka + darslik kartaga) + ShVB-40 Yo'nalish 16/17 (onboarding/papka) + BARCHA_JAVOBLAR Q84
- **Dalil (kod):** `grep onboarding_gate|onboarding.*gate|card.*gate.*onboarding` → 1 mos, HR `onboarding-plan.aggregate.ts` — HR tomonidagi onboarding agregati **real**; LMS `lessons` 13 qator.
- **Nima yetishmaydi:** koordinatsiya tomonida **hech qanday kod** topshiriq/rasporyazhenie biriktirishdan oldin onboarding tugaganini tekshirmaydi — darvoza ulanmagan.
- **Bog'liqlik:** HR onboarding agregati (mavjud, so'ralishi kerak), EP-COR-025 (tanishuv), LMS
- **action:** UPDATE
- **⤳ Ta'sir:** HR (LMS/karta), Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 99 (TASDIQ §04 #99)` · `B04-trace 04.99`
- **Δ 2026-07-11→08-07:** —

### EP-COR-118 · Rejalashtirishdan ma'lumot "talab qilish" huquqi (v2-Q88)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — bo'limlararo rasmiy "ma'lumot so'rovi" hujjati (muddat + javob holati bilan) — kuzatiladi.
- **Manba:** A-default (kitob — logistika huquqi) + EP-COR-089 (gorizontal)
- **Dalil (kod):** `internal_requests` jadval mavjud (`request_no`, `urgency`, `approved_by`), **0 qator**; `grep internal_requests` `apps/api/src` → 8 fayl, **hammasi WMS'da** (`wms-counts.repository.ts`, `wms-warehouse-gateway.repo.ts`, `material-balance.repository.ts`) — faqat ombor-sanoq so'rovlari uchun.
- **Nima yetishmaydi:** umumiy bo'limlararo "rasmiy ma'lumot so'rovi" turi/oqimi COR'da yo'q — jadval tor doirada (WMS count) ishlatiladi.
- **Bog'liqlik:** EP-COR-129 (**bir xil jadval, bir xil tor qo'llanish**), EP-COR-119
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (gorizontal), Planning, Production
- **Xoch-havolalar:** `[Module-04] Item 100 (TASDIQ §04 #100)` · `[Module-04] Item 111 (TASDIQ §04 #111)` · `B04-trace 04.100`
- **⚠️ ZIDDIYAT:** EP-COR-118 va EP-COR-129 — bitta jadval (`internal_requests`), bitta bo'shliq; manba dublikat band bergan (`FULL-ITEM-LEVEL` ni o'zi "duplicate topic" deydi).
- **Δ 2026-07-11→08-07:** —

### EP-COR-119 · Gorizontal (bo'limlararo) workflow qoidalari (v2-Q89)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — bo'limlararo workflow qoidalari jadvali (manba bo'lim → maqsad bo'lim → hujjat turi) — avto-yo'naltirish; admin paneldan konfiguratsiya.
- **Manba:** Master reja (workflow_rules jadval — gorizontal) + BARCHA_JAVOBLAR Q81 (admin paneldan yo'l chiziladi)
- **Dalil (kod):** `workflow_rules` jadval + `workflow-rules.repository.ts` + `workflow-rules.controller.ts` — admin-tomon CRUD API **haqiqatan mavjud va kod-jihatdan to'liq**; `WorkflowRulesService.resolve()` ham bor. `SELECT count(*) FROM workflow_rules` → **0**. **Δ:** `6e2fea7c` (2026-08-06) — `WorkflowRules.tsx` sahifasida **tahrirlash UI si yo'q edi**, backend `PUT` bo'lsa ham; +105 qator bilan qo'shildi (admin endi paneldan qoidani o'zgartira oladi).
- **Nima yetishmaydi:** 0 ta sozlangan qoida (**egasi-DATA**: kim nimani tasdiqlaydi); hujjat yaratish oqimi `resolve()` ni **chaqirmaydi** — qoidalar hech narsani yo'naltirmaydi; `rule_version_id` snapshot yo'q (VR-COR-I16).
- **Bog'liqlik:** EP-COR-028 (vertikal), EP-COR-089 (sektsiya darajasi yo'q), VR-COR-I16
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (gorizontal), barcha bo'limlar
- **Xoch-havolalar:** `[Module-04] Item 101 (TASDIQ §04 #101)` · `[Module-04] Item 65 (TASDIQ §04 #65)` · `[Module-04] Item #32` · `EXTRACTION QISM A #32` · `B04-trace 04.101`
- **Δ 2026-07-11→08-07:** `6e2fea7c` — WorkflowRules FE sahifasiga tahrirlash UI si qo'shildi (backend `PUT` allaqachon bor edi, FE'da ochilmagan edi — "ERP tashqarisida ish yo'q" qoidasiga muvofiqlashtirish).

### EP-COR-120 · ЦКП (Qimmatli Yakuniy Mahsulot) — bo'lim natijasi (v2-Q90)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bo'lim/karta ЦКП chiqishi o'lchanadi (son + vaqt) — natijaga yo'naltirilgan boshqaruv.
- **Manba:** Vizyon (har karta ЦКП — org_card_centric) + LOYIHA-BITGAN-XOLAT (GSD/ЦКП)
- **Dalil (kod):** `grep ckp_fact_values` → real fayl `org-structure/ckp-fact.service.ts` (stub emas); `ckp_card_products` + `ckp_fact_values` jadvallari + `ckp-daily-aggregate.cron` + `ckp-cascade.listener` real. `count(*) FROM ckp_fact_values` → **0**.
- **Nima yetishmaydi:** norma va fakt qiymatlari to'ldirilmagan → norma-vs-fakt o'lchovi amalda ishlamayapti (**egasi-DATA**: har karta ЦКП normasi).
- **Bog'liqlik:** EP-COR-102 (bir xil jadval), EP-COR-135, EP-ORG (karta ЦКП)
- **action:** AI
- **⤳ Ta'sir:** HR (karta AI), Reports, Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 102 (TASDIQ §04 #102)` · `[Module-04] Item 84 (TASDIQ §04 #84)` · `B04-trace 04.102`
- **Δ 2026-07-11→08-07:** —

### EP-COR-121 · Buyurtma muddati (plan vs fakt) kechikish koordinatsiyasi (v2-Q91)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — plan-fakt og'ishi real vaqtda hisoblanadi → og'ish chegaradan oshsa signal (erta ogohlantirish).
- **Manba:** A-default (Excel — planovaya/fakt)
- **Dalil (kod):** `grep plan.*fakt.*og|deviation.*threshold|variance.*alert` `apps/api/src/modules/mes` → **0 mos**. MES ishlab chiqarish miqdorlarini yozadi (`mes_operations`, `mes_shift_handovers` tasdiqlangan), lekin og'ish-chegara/ogohlantirish mantig'i yo'q.
- **Nima yetishmaydi:** MES miqdor-yozuviga chegara-solishtirish + signal. **Threshold:** operatsiya/buyurtma turi bo'yicha og'ish foizi `business_settings` da kerak.
- **Bog'liqlik:** EP-COR-123 (**bir xil ma'lumot manbai**), EP-COR-104 (menejerga xabar), MES (Area 10)
- **action:** EVENT
- **⤳ Ta'sir:** Production, CRM (menejer), Reports
- **Xoch-havolalar:** `[Module-04] Item 103 (TASDIQ §04 #103)` · `B04-trace 04.103`
- **Δ 2026-07-11→08-07:** —

### EP-COR-122 · Brak soni — bo'lim koordinatsiyasi va sabab (v2-Q92)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — brak hodisasi (bo'lim + sabab + buyurtma №) → mas'ul rahbar KPI siga ulanadi (EP-COR-108 bilan mos).
- **Manba:** A-default (Excel — brak soni) + kitob (rahbar kamchiligi)
- **Dalil (kod):** `qc_braks` jadval mavjud (`papka`, `stage`, `reason`, `cost` maydonlari) + `qc_defects` real, **0 qator**; `responsible_manager` grep (EP-COR-108) `qc_braks` da bunday ustun yo'qligini tasdiqlaydi.
- **Nima yetishmaydi:** bo'lim/mas'ul rahbar atributsiya ustuni → nuqsonlarni rahbar KPI'siga yig'ib bo'lmaydi; jadval bo'sh.
- **Bog'liqlik:** EP-COR-108 (**bir xil texnik bo'shliq**), EP-COR-102, EP-COR-135
- **action:** EVENT
- **⤳ Ta'sir:** Quality, Production, Design
- **Xoch-havolalar:** `[Module-04] Item 104 (TASDIQ §04 #104)` · `[Module-04] Item 90 (TASDIQ §04 #90)` · `B04-trace 04.104`
- **⚠️ ZIDDIYAT:** EP-COR-108 "Yo'q" vs EP-COR-122 "Qisman" — **bir xil jadval va bir xil yetishmayotgan ustun** bo'lgani holda ikki xil qurilish-holati berilgan (manba dublikatidan kelib chiqqan nomuvofiqlik).
- **Δ 2026-07-11→08-07:** —

### EP-COR-123 · Norma vs fakt (ish-normasi) — uchastka koordinatsiyasi (v2-Q93)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — real norma-bajarilish % (xodim/uchastka) koordinatsiyada → past bo'lsa rahbarga signal.
- **Manba:** A-default (Excel — norma/fakt %)
- **Dalil (kod):** B04 hozirgi holatni "oy-oxiri Excel-uslub" deb belgilaydi; EP-COR-121 bilan bir xil grep (`deviation.*threshold|variance.*alert`) MES'da → 0 mos — real-vaqt norma-% signali yo'q.
- **Nima yetishmaydi:** uchastka bo'yicha joriy fakt/norma foizini hisoblovchi operatsion so'rov + chegaradan pastda signal. **Threshold:** "past" chegarasi `business_settings` da.
- **Bog'liqlik:** EP-COR-121 (bir xil MES manbai), HR (norma), EP-COR-102
- **action:** EVENT
- **⤳ Ta'sir:** HR (norma/oylik), Production
- **Xoch-havolalar:** `[Module-04] Item 105 (TASDIQ §04 #105)` · `B04-trace 04.105`
- **Δ 2026-07-11→08-07:** —

### EP-COR-124 · Operator + yordamchi (Помощник) juftligi (v2-Q94)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — dastgoh/buyurtmaga operator+yordamchi juftligi → ikkisi ham koordinatsiya signalini oladi.
- **Manba:** A-default (Excel — operator/pomoshnik)
- **Dalil (kod):** `grep assistant_operator|helper_operator|operator2|second_operator` `apps/api/src/modules/mes` → **0 mos**; `operator_id` grep → 4 fayl (`mes-shifts-stats.repo.ts`, `drizzle-mes.repo.ts`, `mes.dto.ts`, `mes-production-sessions.repo.ts`), hammasi sessiyaga **bitta** operator beradi.
- **Nima yetishmaydi:** MES sessiya jadvali/DTO'siga `assistant_operator_id` + signal-bildirishnomani ikkalasiga dublikatlash (egasi qarori talab qilinmaydi).
- **Bog'liqlik:** EP-COR-052 (bitta mas'ul + yordamchi — bir xil naqsh), MES (Area 10)
- **action:** UPDATE
- **⤳ Ta'sir:** HR (smena), Production
- **Xoch-havolalar:** `[Module-04] Item 106 (TASDIQ §04 #106)` · `B04-trace 04.106`
- **Δ 2026-07-11→08-07:** —

### EP-COR-125 · Kichiklashgan buyurtma (razmer optimizatsiyasi) qarori (v2-Q95)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — razmer/optimizatsiya taklifi koordinatsiya qarori sifatida (dizayn→savdo→rahbar tasdiq).
- **Manba:** A-default (Excel — kichik buyurtmalar)
- **Dalil (kod):** `hitl-document-type.enum.ts` (to'liq o'qilgan) — 11 tur (`PURCHASE_ORDER, PAYMENT, THREE_WAY_MATCH, CREDIT_LIMIT_EXCEED, DISCOUNT_OVERRIDE, EMPLOYEE_TARDINESS, QC_FAIL_CRITICAL, MRO_REPAIR_HIGH_VALUE, EMPLOYEE_TERMINATION, INVENTORY_WRITEOFF, ADVANCE_BYPASS`) — razmer/optimizatsiya turi YO'Q. `approval_workflows` 0 qator; amalda ishlatiladigan `approval_requests` — **4 real qator**.
- **Nima yetishmaydi:** `HitlDocumentType.SIZE_OPTIMIZATION` qiymati + mavjud, jonli `ApprovalRequest` agregati/controller'i orqali o'tkazish. **Threshold:** qachon bu tasdiq zanjiri talab qilinishi (egasi).
- **Bog'liqlik:** EP-COR-132 (direktor darvozasi — bir xil infratuzilma)
- **action:** APPROVE
- **⤳ Ta'sir:** Design, Sales, Finance (foyda)
- **Xoch-havolalar:** `[Module-04] Item 107 (TASDIQ §04 #107)` · `B04-trace 04.107`
- **Δ 2026-07-11→08-07:** —

### EP-COR-126 · Yo'nalish turi (ofs-kar/ofs-gof/flx-gof) bo'lim-marshruti (v2-Q96)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — yo'nalish turi → mos bo'lim-marshruti avto ochiladi.
- **Manba:** A-default (Excel — yo'nalishlar) + EP-COR-096
- **Dalil (kod):** `mes_operations` jadval mavjud, **0 qator**, marshrut-turi tasnif ustuni yo'q (EP-COR-096 bilan bir xil tekshiruv).
- **Nima yetishmaydi:** `mes_operations` ga marshrut-turi ustuni + shu kalit bo'yicha avto-marshrut qidiruvi. **Egasi-DATA:** kanonik yo'nalish turlari ro'yxati (ofs-kar/ofs-gof/flx-gof/...) va ularning bo'lim zanjirlari — kodda hujjatlashtirilmagan biznes master-data.
- **Bog'liqlik:** EP-COR-096 (**bir xil jadval/bo'shliq**), MES (Area 10)
- **action:** READ
- **⤳ Ta'sir:** Production routing, Internal Logistics, MES
- **Xoch-havolalar:** `[Module-04] Item 108 (TASDIQ §04 #108)` · `[Module-04] Item 78 (TASDIQ §04 #78)` · `B04-trace 04.108`
- **⚠️ ZIDDIYAT:** EP-COR-096 "Qisman" vs EP-COR-126 "Yo'q" — bir xil `mes_operations` jadvali va bir xil yetishmayotgan tasnif ustuni uchun ikki xil baho (manba dublikatidan).
- **Δ 2026-07-11→08-07:** —

### EP-COR-127 · "Boshlanmasdan qolgan kunlar" — kechikkan-start signali (v2-Q97)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — ochilgan lekin N kun boshlanmagan buyurtmalar avto signal → rejalashtirish/logistikaga.
- **Manba:** A-default (Excel — boshlanmagan kunlar)
- **Dalil (kod):** `grep created.*started|kechikkan.start|not.started.*cron|StartedLate` `apps/api/src` → 2 mos (`shared/db/invariants/migrations-drift.ts`, `sd/orders/drizzle-sd-order-departments.repo.ts`) — ikkalasi ham cron emas, aloqasiz yordamchi kod.
- **Nima yetishmaydi:** `sales_orders.created_at` ni "birinchi bo'limga tegilgan" vaqti bilan solishtiruvchi cron (`notify()` naqshi tayyor). **Threshold:** N kun (egasi → `business_settings`). **Oldingi shart:** `sd_order_timeline` bo'sh (EP-COR-090) — "boshlangan" vaqtini bilish uchun kerak.
- **Bog'liqlik:** EP-COR-090 (timeline ma'lumoti), EP-COR-107 (harakatsizlik signali)
- **action:** CRON
- **⤳ Ta'sir:** Planning, Internal Logistics, Coordination dashboard
- **Xoch-havolalar:** `[Module-04] Item 109 (TASDIQ §04 #109)` · `B04-trace 04.109`
- **Δ 2026-07-11→08-07:** —

### EP-COR-128 · "Зарур заказлар" (shoshilinch) — koordinatsiya bayrog'i (v2-Q98)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — "shoshilinch" bayrog'i → barcha bo'lim panelida ajralib + navbat tepasida.
- **Manba:** A-default (Excel — ZARUR ZAKAZLAR)
- **Dalil (kod):** `cc-baskets.repo.ts:68` — real `CASE d.priority WHEN 'urgent' THEN 0 ...` tartiblash savat so'rovida; `design_orders.priority` ham bor. `cc_documents` → 2 qator.
- **Nima yetishmaydi:** shoshilinch-birinchi tartib **faqat bitta so'rovda** (CC savatlar ro'yxati) mavjud — vizyon so'ragan "barcha panelda" global vizual bayroq yo'q (`coordination.controller.ts` `stats`/dashboard endpointlarida ham chiqarilmagan).
- **Bog'liqlik:** EP-COR-106 (savatlar), EP-COR-110 (`sales_orders` da ustuvorlik yo'q)
- **action:** UPDATE
- **⤳ Ta'sir:** Production, Sales, Internal Logistics
- **Xoch-havolalar:** `[Module-04] Item 110 (TASDIQ §04 #110)` · `B04-trace 04.110`
- **Δ 2026-07-11→08-07:** —

### EP-COR-129 · Kesilgan qog'oz/qoldiq rulon — ichki xizmat so'rovi (v2-Q99)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — ichki xizmat so'rovi (kesish/rulon) — so'rovchi → bajaruvchi bo'lim, muddat + bajarish tasdig'i.
- **Manba:** A-default (Excel — kesilgan qog'oz xizmati) + EP-COR-118 (so'rov)
- **Dalil (kod):** `internal_requests` jadval real, **0 qator**; kod qo'llanishi faqat `wms-counts.repository.ts` (ombor sanoq so'rovlari).
- **Nima yetishmaydi:** "kesish/rulon" turdagi ichki xizmat so'rovi turi/oqimi kodda umuman yo'q.
- **Bog'liqlik:** EP-COR-118 (**bir xil jadval/bo'shliq**), EP-COR-095 (chiqindi tsikli)
- **action:** CREATE
- **⤳ Ta'sir:** Internal Logistics, Production
- **Xoch-havolalar:** `[Module-04] Item 111 (TASDIQ §04 #111)` · `[Module-04] Item 100 (TASDIQ §04 #100)` · `B04-trace 04.111`
- **Δ 2026-07-11→08-07:** —

### EP-COR-130 · Smena tayyorligi cheklisti (10 daq oldin) (v2-Q100)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A-default — smena boshida "tayyorlik" cheklisti (material/qolip/dastgoh/xodim) → tasdiqlanmaguncha bekor turish hisoblanmaydi.
- **Manba:** A-default (kitob — 10 daqiqa oldin)
- **Dalil (kod):** `kanban_checklists` jadval mavjud, **0 qator** — bu umumiy Kanban cheklisti, smena-tayyorligiga xos darvoza emas; cheklist tugashini `downtime_events` yozuviga bog'laydigan kod topilmadi.
- **Nima yetishmaydi:** smena-tayyorligiga xos cheklist turi + `downtime_events` yozish oqimida darvoza. **Egasi-DATA:** smena/ish-markazi turi bo'yicha tayyorlik band ro'yxati.
- **Bog'liqlik:** EP-COR-087 (`downtime_events` — darvozalanadigan amal), EP-COR-099, VR-COR-I26 (TB cheklisti birinchi gate)
- **action:** CREATE
- **⤳ Ta'sir:** Production (smena), Internal Logistics, HR
- **Xoch-havolalar:** `[Module-04] Item 112 (TASDIQ §04 #112)` · `[Module-04] Item #35` · `EXTRACTION QISM A #35` · `B04-trace 04.112`
- **Δ 2026-07-11→08-07:** —

### EP-COR-131 · Tijorat siri/dizayn fayllari maxfiyligi — ko'rish huquqi (v2-Q101)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — koordinatsiya hujjatlari ko'rish-ruxsati bo'lim/daraja/karta bo'yicha cheklanadi (RBAC kuchli, maydon darajasi).
- **Manba:** LOYIHA-BITGAN-XOLAT (RBAC eng kuchli, kartadan, maydon darajasi, shifrlangan) + BARCHA_JAVOBLAR Q43
- **Dalil (kod):** `coordination.controller.ts:14,31,33` — real `@UseGuards(RolesGuard)` + `@Roles('admin','manager','supervisor','director','ceo')`, jonli enforce qilinadi (rol-darajali RBAC ishlaydi). **Δ:** `e5bac042` (2026-07-13) ko'rish/nusxalash/chop etish access-logging; `3728606f` (2026-07-13) tier-driven watermark hujjat ko'ruvchilarida; `31fbc7df` (2026-07-11) `GET /cc/documents/:id` da **ownership tekshiruvi yo'qligi xavfsizlik teshigi tuzatildi**.
- **Nima yetishmaydi:** karta-darajali va **maydon-darajali** (maydon-bo'yicha) nozik ruxsat yo'q — hozirgi model rol bo'yicha "hammasi yoki hech nima"; hujjat-bo'yicha maxfiylik ustuni yo'q (EP-COR-076); shifrlash yo'q.
- **Bog'liqlik:** EP-COR-076 (Ochiq/Maxfiy), VR-COR-I18 (maxfiy majlis RLS), VR-COR-I20 (server-tomon filtr)
- **action:** READ
- **⤳ Ta'sir:** Security/permissions, Design, Sales
- **Xoch-havolalar:** `[Module-04] Item 113 (TASDIQ §04 #113)` · `B04-trace 04.113`
- **Δ 2026-07-11→08-07:** `31fbc7df` (ownership tekshiruvi qo'shildi) · `e5bac042` (ko'rish/nusxa/chop audit-logi) · `3728606f` (tier-watermark).

### EP-COR-132 · Direktor (Pozilov A.A.) tasdig'i — eng yuqori darvoza (v2-Q102)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — belgilangan turdagi qarorlar (yangi lavozim/katta xarajat/приказ) direktor tasdiq darvozasidan o'tadi (elektron imzo qadami).
- **Manba:** Kitob (har yo'riqnoma "ТАСДИҚЛАЙМАН директор/Позилов А.А.") + BARCHA_JAVOBLAR Q78 (imzo) + tasdiqlash matritsasi (ShVB-40 Yo'nalish 6)
- **Dalil (kod):** `approvals.controller.ts:1-40` — real CQRS controller (`CreateApprovalRequestCommand`, `ApproveRequestCommand`, `RejectRequestCommand`, `GetPendingApprovalsQuery`) + `ApprovalRequest` agregati; `approval_requests` → **4 jonli qator** (haqiqiy foydalanish); `approval_workflows` → 0 qator.
- **Nima yetishmaydi:** `HitlDocumentType` enum'ida "yangi lavozim" va "приказ" darvoza turlari yo'q — tur→darvoza marshrut ma'lumoti to'liq emas; jonli `prikaz` entiteti bu tasdiq oqimiga **ulanmagan**.
- **Bog'liqlik:** EP-COR-049 (Приказ CEO-only), EP-COR-125 (yangi HITL turi), EP-COR-022
- **action:** APPROVE
- **⤳ Ta'sir:** Coordination (приказ/sessiya), Org-struktura, Finance
- **Xoch-havolalar:** `[Module-04] Item 114 (TASDIQ §04 #114)` · `[Module-04] Item 107 (TASDIQ §04 #107)` · `B04-trace 04.114`
- **Δ 2026-07-11→08-07:** —

### EP-COR-133 · ТТ (Texnik topshiriq) to'liqligi — dizayn boshlash darvozasi (v2-Q103)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A-default — ТТ majburiy maydonlari (mahsulot turi/o'lcham/material/bosma/ranglar/matn/logotip/miqdor/maxsus talab) to'ldirilmasa — dizaynga o'tkazib bo'lmaydi (gate).
- **Manba:** A-default (kitob — dizayn rahbari xatosi)
- **Dalil (kod):** `design.controller.ts:41-47,224,241` — real Zod sxemalar (`CreateOrderSchema`, `CreateOrderMessageSchema`) `.parse(body)` bilan; `design_orders` da `product_type`/`requirements`/`quantity` ustunlari bor. Maydon-darajali validatsiya jonli va enforce qilinadi.
- **Nima yetishmaydi:** bu validatsiya **to'liq ТТ to'plamini** (9 element) qamrayotgani tasdiqlanmagan — umumiy majburiy-maydon tekshiruvi bilan biznes-darvoza farqlanmagan; `design_orders` 0 qator, jonli izlanadigan misol yo'q.
- **Bog'liqlik:** EP-COR-091 (status zanjiri), EP-COR-092 (podpisnoy gate)
- **action:** UPDATE
- **⤳ Ta'sir:** Sales→Design handoff, CRM, Quality
- **Xoch-havolalar:** `[Module-04] Item 115 (TASDIQ §04 #115)` · `B04-trace 04.115`
- **Δ 2026-07-11→08-07:** —

### EP-COR-134 · Bo'lim rahbari javob muddati (SLA) — "zudlik bilan chora" (v2-Q104)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har muammo signaliga rahbar javob SLA si (masalan 2 soat) → o'tsa avto yuqoriga; hujjat turiga qarab muddat (avans 4 soat) prinsipiga mos.
- **Manba:** BARCHA_JAVOBLAR Q121 (hujjat turiga qarab muddat) + Q122 (eskalatsiya)
- **Dalil (kod):** `cc-sla.cron.ts:37-47` — real `@Cron(EVERY_30_MINUTES)` (`markInboxOverdue`, `autoRejectOverdue48h`, `escalateApprovals`, `expireDelegations`); `SELECT code, category, inbox_sla_hours, escalation_hours FROM cc_document_templates` → **17 real qator**, har hujjat turiga to'ldirilgan `escalation_hours` (48–96 soat). **Δ:** `cd940c4d` (2026-07-11) 48h avto-rad olib tashlandi, 24h takroriy eslatma qo'shildi; `09582d90` (2026-08-06) 48h/24h intervallar `business_settings` orqali **CRUD-sozlanadigan** qilindi; `d6da370f` (2026-08-06) eskalatsiya endi xabar yuboradi + qayta yo'naltiradi; `c7d4d0f8` (2026-08-07) eskalatsiya **Telegram**'ga yetadi; `8113fb80` (2026-07-13) `archive_after_days` + 90-kunlik eskirgan-qoralama arxiv cron'i.
- **Nima yetishmaydi:** 17 sozlangan hujjat turining birortasi ham **"muammo signali"** turi emas, va har bir `escalation_hours` 48–96 soat — vizyon so'ragan **2 soat** tezkor yo'l yo'q. Umumiy SLA mashinasi qurilgan, biznes-qoida hali yo'q.
- **Bog'liqlik:** EP-COR-027 (eskalatsiya), EP-COR-044 (doklad muddati — bir xil naqsh), EP-COR-045
- **action:** CRON
- **⤳ Ta'sir:** Coordination (eskalatsiya), Org-struktura, KPI
- **Xoch-havolalar:** `[Module-04] Item 116 (TASDIQ §04 #116)` · `B04-trace 04.116`
- **⚠️ ZIDDIYAT:** `B04 04.116` "per-document-type SLA-muddat konfig-datasiz; cc_documents=0" vs jonli **17 qator** `cc_document_templates` to'ldirilgan `escalation_hours` bilan → B04 kam baholagan; haqiqiy bo'shliq — 2-soatlik "muammo" turi yo'qligi.
- **Δ 2026-07-11→08-07:** ⭐ 5 ta commit — SLA mashinasi sezilarli mustahkamlandi (`cd940c4d`, `8113fb80`, `d6da370f`, `09582d90`, `c7d4d0f8`); intervallar endi CRUD-sozlanadigan (threshold-qoidasiga muvofiq).

### EP-COR-135 · Koordinatsiya hodisalari karta-AI ga oziq (lavozim mosligi) (v2-Q105)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — koordinatsiya hodisalari (kechikish/STOP/brak/norma %/javob SLA) karta-AI ga real signal → xodim-karta mosligi dinamik baholanadi.
- **Manba:** Vizyon (har karta AI'si xodim↔karta mosligini baholaydi — org_card_centric) + LOYIHA-BITGAN-XOLAT (markaziy AI)
- **Dalil (kod):** `to_regclass('public.ai_ckp_scores')` → jadval mavjud, **0 qator** — karta-AI baholash infratuzilmasi qurilganini bildiradi; `ai_ckp_config` + `AiDailyReportService` + `ckp-cascade.listener` ham real.
- **Nima yetishmaydi:** ⭐ birorta koordinatsiya hodisasi bu jadvalga **yozmaydi** — chunki sanab o'tilgan signallarning o'zi (kechikish/STOP/brak/norma/SLA) hali **alohida event sifatida chiqmaydi** (EP-COR-108, 121, 123, 134 ga qarang). Bu band — hali mavjud bo'lmagan signallarning **yakuniy iste'molchisi**.
- **Bog'liqlik:** ⭐ EP-COR-108 (brak KPI), EP-COR-121 (plan-fakt), EP-COR-123 (norma %), EP-COR-134 (SLA), EP-COR-102/120 (ЦКП), VR-COR-I25 (multi-karta atribusiyasi)
- **action:** AI
- **⤳ Ta'sir:** HR (karta-markazli model, AI), Org-struktura
- **Xoch-havolalar:** `[Module-04] Item 117 (TASDIQ §04 #117)` · `[Module-04] Item #19` · `EXTRACTION QISM A #19` · `B04-trace 04.117`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-COR-I01..I33)

> **Manba:** `vision-1000-answers/04-coordination.md` #1..#50 = `FULL-VISION-EXTRACTION QISM A` = `FULL-ITEM-LEVEL [Module-04] Item #1..#50`. Bu 50 javob **EP-COR kodiga ega emas** — ular granular chekka-holatlar va texnik kafolatlar. Ular quyida 33 ta bandga birlashtirildi (bir nechta javob bitta texnik bo'shliqni tasvirlaganda birlashtirilgan). Har bandda qamragan `#N` javoblar ko'rsatilgan — **50 tadan hammasi qoplangan**.
> **Qaror holati** ustuni bu yerda "✅ tavsiya-javob berilgan" degani (vision-1000 = 50 tavsiya-javob); egasi ularni alohida imzolamagan.

### VR-COR-I01 · Ochiq sessiyada a'zolik snapshot bilan qotiriladi
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#1)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ochiq sessiya davomida karta o'zgarsa a'zolik o'zgarmaydi — sessiya snapshot'i DB'ga yoziladi (`card_member_snapshot`), o'zgarish audit-logga, HR'ga bildirishnoma.
- **Dalil (kod):** `to_regclass('public.card_member_snapshot')` → `null`; `grep card_member_snapshot` `apps/`/`lib/` → 0 fayl (faqat hujjat havolalari).
- **Nima yetishmaydi:** jadval + sessiya ochilishida yozish. **Bloklovchi:** sessiya/majlis entiteti mavjud emas (EP-COR-037).
- **Bog'liqlik:** EP-COR-037, EP-COR-031, EP-COR-084
- **action:** CREATE · **⤳ Ta'sir:** Council sessiya, audit, HR
- **Xoch-havolalar:** `[Module-04] Item #1` · `EXTRACTION QISM A #1`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I02 · Chetlashtirilgan a'zo → SERIALIZABLE kvorum qayta-hisobi
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#2)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** `council_session_members` + `conflict_of_interest` bayrog'i; SERIALIZABLE tranzaksiya ichida kvorum avto qayta hisoblanadi, ovoz bekor bo'ladi, audit-logga tushadi.
- **Dalil (kod):** `to_regclass('public.council_session_members')` → `null`; `council-members.repository.ts:47-57` `countVotingMembers()` faqat `guest` ni chiqaradi.
- **Nima yetishmaydi:** sessiya-a'zo jadvali + konflikt bayrog'i + SERIALIZABLE qayta-hisob.
- **Bog'liqlik:** EP-COR-036, EP-COR-033, EP-COR-034, VR-COR-I01
- **action:** CREATE · **⤳ Ta'sir:** Kvorum/ovoz butunligi
- **Xoch-havolalar:** `[Module-04] Item #2` · `EXTRACTION QISM A #2`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I03 · Doklad transkripsiyasi — per-camera VLM diarizatsiya
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#3)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Bir vaqtda gapirishda per-camera VLM (Gemini) diarizatsiya + speaker embedding; kotib "to'g'rilash" tugmasi, tuzatish audit-logga, AI qayta o'rgatilmaydi.
- **Dalil (kod):** Gemini faqat HR `ai-interview-v2/gemini-live.gateway.ts` va IoT `camera-ai.service.ts` da; COR `createDokla` faqat matn (`coordination.controller.ts:92`); `grep diariz|speaker_embedding` COR'da → 0.
- **Nima yetishmaydi:** majlis-yozuv quvuri, speaker embedding jadvali, kotib-tuzatish UI. **Egasi-gate:** AI vendor/kalit va kamera↔kengash-xonasi xaritasi.
- **Bog'liqlik:** EP-COR-062 (AI qoralash), EP-COR-037, IoT (Area 08)
- **action:** AI · **⤳ Ta'sir:** Doklad AI, Protokol
- **Xoch-havolalar:** `[Module-04] Item #3` · `EXTRACTION QISM A #3` · `EXTRACTION QISM D #3`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I04 · ⭐ Event-driven ip — 7 ta yo'q event (arxitektura ziddiyati)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#4, #9, #25, #38, #43, #47, #49)
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** Kanban/CRM/PP/AI hodisalari **event** (outbox) orqali COR'ga yetadi, **polling emas**: `RasporyazheniеStatusChanged`, `RasporyazheniеCancelled`, `ManagerReassigned`, `ProtocolFullySigned`, `ProductionPlanUpdated`, `MaterialShortage` (fan-out), `AIScheduleChanged`.
- **Dalil (kod):** har yetti event nomi bo'yicha `grep` butun `apps/` → **0 fayl**; `grep @OnEvent` `modules/director` → 0. Mavjud mexanizm — kunlik `rasporyazhenie-escalation.cron.ts` (polling). **Δ:** `48bcb53c` (2026-07-13) CC tomonda birinchi haqiqiy event-listener juftligi qurildi (`CcDocumentFullyApprovedEvent` → `cc-approved-gl-posting.listener.ts` → GL posting) — naqsh isbotlandi, lekin COR eventlariga tarqatilmadi.
- **Nima yetishmaydi:** yettala event ham; outbox/EventEmitter2 naqshi COR'da qabul qilinishi.
- **Bog'liqlik:** ⭐ EP-COR-083, EP-COR-069, EP-COR-070, EP-COR-104, EP-COR-111, EP-COR-114, VR-COR-I27
- **action:** EVENT · **⤳ Ta'sir:** butun oltin ip (Kanban/CRM/PP/AI ↔ COR)
- **Xoch-havolalar:** `[Module-04] Item #4/#9/#25/#38/#43/#47/#49` · `EXTRACTION QISM A #4/#9/#25/#38/#43/#47/#49` · `EXTRACTION QISM Step-3 (arxitektura ziddiyati)`
- **⚠️ ZIDDIYAT:** vizyon aniq **"event, polling emas"** talab qiladi; joriy COR arxitekturasi **cron-polling**. `FULL-VISION-EXTRACTION` Step-3 buni ochiq arxitektura ziddiyati deb qayd etgan. Shuningdek `decisions` EP-COR-070 ni `CRON` deb belgilaydi, vision-1000 #9 esa "cron emas" deydi.
- **Δ 2026-07-11→08-07:** `48bcb53c` — CC→GL event-listener (koordinatsiya qatlamida birinchi jonli event zanjiri).

### VR-COR-I05 · Imzolangan PDF sha256 → `document_hashes` + download-verify
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#6)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Imzolangan protokol/приказ PDF hash'i `document_hashes` jadvalga; yuklab olishda BE avto tekshiradi, mos kelmasa "hujjat o'zgartirilgan" xatosi + audit-log.
- **Dalil (kod):** `to_regclass('public.document_hashes')` → `null`; `grep` `apps/`/`lib/` → 0 fayl.
- **Nima yetishmaydi:** jadval + hash hisoblash + verify middleware. **Egasi-gate:** PDF qayerda render qilinishi hal qilinmagan (приказ/протокол uchun PDF quvuri umuman yo'q — EP-COR-012).
- **Bog'liqlik:** EP-COR-012, EP-COR-024, EP-COR-061, EP-COR-066, EP-COR-078
- **action:** CREATE · **⤳ Ta'sir:** Hujjat butunligi, audit
- **Xoch-havolalar:** `[Module-04] Item #6` · `EXTRACTION QISM A #6`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I06 · Davomat ziddiyati va sababi (`attendance_conflicts` / `attendance_reason`)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#7, #26)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Turniket "keldi" vs AI kamera "yo'q" ziddiyatida **kamera ustun**, ziddiyat `attendance_conflicts` ga yoziladi, HR + nazoratchi xabardor (E1: AI belgilaydi, inson tasdiqlaydi). Sababli/sababsiz uchun `attendance_reason` (rahbar 2 ish kunida to'ldiradi, operator emas).
- **Dalil (kod):** `to_regclass('public.attendance_conflicts')` → `null`; `grep attendance_reason` `apps/`/`lib/` → 0 fayl.
- **Nima yetishmaydi:** ikkala jadval/ustun; rol-darvozasi (rahbar+); 2 ish kunlik muddat (ish-kun kalendari — VR-COR-I19).
- **Bog'liqlik:** EP-COR-041, EP-COR-105, IoT kamera (Area 08), HR
- **action:** CREATE · **⤳ Ta'sir:** Davomat aniqligi, HR intizom
- **Xoch-havolalar:** `[Module-04] Item #7` · `[Module-04] Item #26` · `EXTRACTION QISM A #7/#26`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I07 · PP↔COR optimistik qulf (409 Conflict)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#10)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** PP va COR bir vaqtda o'zgartirsa `version`/`updated_at` tekshiruvi → keyingi yozuvchi 409 oladi ("reja o'zgarib qoldi, yangilang"). PP bloklanmaydi, COR faqat xabar oladi.
- **Dalil (kod):** `grep version.*updated_at|optimistic.*lock|409.*Conflict|@Version` `modules/director` → 0 fayl; `coordination.service.ts` da versiya tekshiruvi yo'q.
- **Nima yetishmaydi:** versiya ustuni + check-and-increment. **Ochiq:** PP aynan qaysi COR entitetini bir vaqtda tahrirlashi aniqlanmagan (modullararo qamrov kerak).
- **Bog'liqlik:** EP-COR-086 (24h reja), VR-COR-I04 (`ProductionPlanUpdated`)
- **action:** UPDATE · **⤳ Ta'sir:** Konkurent yozuv xavfsizligi
- **Xoch-havolalar:** `[Module-04] Item #10` · `EXTRACTION QISM A #10` · `EXTRACTION QISM D #10`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I08 · i.o. (acting officer) granular vakolati
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#11, #44)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Direktor/rahbar yo'q bo'lsa i.o. tayinlanadi; i.o. faqat **belgilangan turdagi** qaror/приказ uchun teng huquqli (`acting_officer_permissions` jadvalida tur ro'yxati) — umumiy vakolat emas. Logistika STOP yechish huquqi ham i.o.ga event bilan o'tadi.
- **Dalil (kod):** `to_regclass('public.acting_officer_permissions')` → `null`; `grep acting_officer_id|ActingOfficerAssigned` `apps/`/`lib/` → 0 fayl.
- **Nima yetishmaydi:** jadval + `ActingOfficerAssigned` event + COR RBAC listener. **Bloklovchi:** `EP-ORG-060` (ORG modulida i.o. modeli) hali qurilmagan.
- **Bog'liqlik:** EP-ORG-060, EP-COR-088 (STOP yechish), EP-COR-132
- **action:** CREATE · **⤳ Ta'sir:** RBAC, ORG→COR vakolat
- **Xoch-havolalar:** `[Module-04] Item #11` · `[Module-04] Item #44` · `EXTRACTION QISM A #11/#44`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I09 · Tashqi buyurtmachi imzosi (skan majburiy)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#12)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Tashqi buyurtmachi ERP'da yo'q bo'lsa: menejer belgi qo'yadi + **skanerlangan imzo fayli majburiy**; BE `signed_by_external` + `signed_document_url` + `signed_at` saqlaydi (not-null tekshiruvi); menejerning "tasdiqladim" belgisi yolg'iz yetarli emas.
- **Dalil (kod):** `grep signed_by_external|signed_document_url` `apps/` → 0 fayl.
- **Nima yetishmaydi:** uchala maydon + fayl yuklash majburiyligi.
- **Bog'liqlik:** EP-COR-023 (imzo turi), EP-COR-064, EP-COR-092 (podpisnoy list)
- **action:** CREATE · **⤳ Ta'sir:** Rasmiy imzo, Sales
- **Xoch-havolalar:** `[Module-04] Item #12` · `EXTRACTION QISM A #12`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I10 · Finance byudjet qoldig'i — sinxron 5s timeout
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#14)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Byudjet qoldig'i **sinxron** REST/RPC, timeout 5 s; javob kelmasa sessiya "byudjet tasdiqsiz" bilan davom etadi, qisman tasdiq "Finance qayta tekshirilgunga qadar" holatida.
- **Dalil (kod):** `modules/director` da Finance↔COR sinxron byudjet tekshiruvi kodi yo'q; `coordination.service.ts` faqat dokla/rasp/council CRUD.
- **Nima yetishmaydi:** sinxron chaqiruv + timeout + "tasdiqsiz" holati. **Egasi/modul-gate:** Finance real-vaqt byudjet-qoldiq API sini ochishi tasdiqlanmagan.
- **Bog'liqlik:** EP-COR-015/016 (ЗВС sessiyasi), Finance moduli
- **action:** READ · **⤳ Ta'sir:** COR→Finance
- **Xoch-havolalar:** `[Module-04] Item #14` · `EXTRACTION QISM A #14` · `EXTRACTION QISM D #14`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I11 · Telegram yetkazish kafolati (BullMQ backoff)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#15)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Telegram uzilsa doklad ERP'da saqlanadi, bildirishnoma "yuborilmadi" holatida; BullMQ exponential backoff **3 urinish** (1/5/15 daq); 15 daq dan keyin "yetkazilmadi" statusi.
- **Dalil (kod):** `QISM D #15` — BullMQ TELEGRAM navbati + exponential backoff **MAVJUD** (`queue/queue.module.ts:51,54,87`, `queue/processors/telegram.processor.ts:25`), lekin `attempts: 10` (vizyon 3 dedi). `rasporyazhenie-escalation.cron.ts:76-81` va `zno-zvs-sla-escalation.cron.ts:178-183` esa navbatni chetlab, to'g'ridan-to'g'ri `INSERT INTO notifications` qiladi. **Δ:** `c7d4d0f8` (2026-08-07) — CC SLA eskalatsiyasi endi `TELEGRAM_SENDER` orqali yetkazadi.
- **Nima yetishmaydi:** urinishlar soni vizyondan farq qiladi (10 vs 3, va `business_settings` da emas); COR cronlari navbatdan foydalanmaydi; "yetkazilmadi" holati COR bildirishnomalarida ko'rsatilmaydi.
- **Bog'liqlik:** EP-COR-007, EP-COR-080, NTF moduli
- **action:** UPDATE · **⤳ Ta'sir:** NTF yetkazish kafolati
- **Xoch-havolalar:** `[Module-04] Item #15` · `EXTRACTION QISM A #15` · `EXTRACTION QISM D #15`
- **⚠️ ZIDDIYAT:** vizyon "3 urinish" vs kod `attempts: 10`.
- **Δ 2026-07-11→08-07:** `c7d4d0f8` — eskalatsiya Telegram'ga yetkaziladigan bo'ldi (best-effort, `@Optional`).

### VR-COR-I12 · Bajarish dalili fayli (10 MB, `proof_status`)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#16)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Dalil fayli: 10 MB chegara, [jpg/png/pdf/mp4], S3 yoki `/uploads/proofs/`; fayl buzilsa `proof_status: missing` + Kanban'da qizil ogohlantirish + mas'ulga xabar — lekin bajarilgan holat o'zgartirilmaydi (E1).
- **Dalil (kod):** `grep proof_status|stale_at` `apps/` → 0 fayl.
- **Nima yetishmaydi:** fayl yuklash + `proof_status` enum + qizil bayroq. **Threshold:** 10 MB va format ro'yxati `business_settings` ga chiqarilishi kerak.
- **Bog'liqlik:** EP-COR-071 (dalil talabi), Kanban (Area 15)
- **action:** CREATE · **⤳ Ta'sir:** Kanban proof, ishonch
- **Xoch-havolalar:** `[Module-04] Item #16` · `EXTRACTION QISM A #16` · `EXTRACTION QISM D #16`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I13 · COR panel graceful degradation (`stale_at`)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#28)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Kanban servisi yo'q bo'lsa COR panel oxirgi ma'lum qiymatni `stale_at` belgisi bilan ko'rsatadi + "Ma'lumot yangilanmagan (HH:MM dan)" inline status (toast emas).
- **Dalil (kod):** `grep stale_at|staleAt` `apps/` → **0 fayl** (faqat vizyon hujjatlarida).
- **Nima yetishmaydi:** kesh + `stale_at` + inline status; Kanban health-check mexanizmi ham tasdiqlanmagan.
- **Bog'liqlik:** EP-COR-026 (panel), VR-COR-I28 (Kanban izolyatsiyasi)
- **action:** READ · **⤳ Ta'sir:** COR panel barqarorligi
- **Xoch-havolalar:** `[Module-04] Item #28` · `EXTRACTION QISM A #28` · `EXTRACTION QISM D #28`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I14 · Dokladga faqat CONFIRMED ma'lumot + "qisman" bayrog'i
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#29)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Doklad faqat tasdiqlangan (smena yopilgan) MES ma'lumotini ko'rsatadi; smena ochiq bo'lsa "smena yopilmagan, qisman ma'lumot" belgisi; GL draft ham "tasdiqlanmagan" bilan.
- **Dalil (kod):** `dokla` ustunlarida smena-yopilish holatiga bog'langan filtr yo'q; `grep CONFIRMED|confirmed.*filter` `modules/director` → 0 fayl.
- **Nima yetishmaydi:** MES tasdiq-holatini COR'dan o'qish shartnomasi (modullararo, hal qilinmagan) + filtr + "qisman" bayrog'i.
- **Bog'liqlik:** EP-COR-047 (ERP raqamlari), MES (Area 10), VR-COR-I26
- **action:** READ · **⤳ Ta'sir:** Doklad ishonchliligi
- **Xoch-havolalar:** `[Module-04] Item #29` · `EXTRACTION QISM A #29` · `EXTRACTION QISM D #29`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I15 · STOP kategoriyasi tayyorlik-% denominatoridan chiqariladi
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#30)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** STOP holatidagi bo'lim "o'tilgan" hisoblanmaydi; tayyorlik foiziga kirmaydi, alohida "STOP: N bo'lim" ko'rsatkich sifatida CRM/menejer paneliga chiqadi.
- **Dalil (kod):** `grep STOP.*denominator|STOP.*tayyorlik|N STOP` `apps/` → 0 fayl; `coordination.service.ts` da STOP kategoriyasi mantig'i yo'q.
- **Nima yetishmaydi:** tayyorlik-% hisobining o'zi hali yo'q (EP-COR-103) — bu qoida shundan keyin qo'llanadi.
- **Bog'liqlik:** EP-COR-103 (birinchi shart), EP-COR-088 (STOP manbai)
- **action:** READ · **⤳ Ta'sir:** Dashboard/CRM
- **Xoch-havolalar:** `[Module-04] Item #30` · `EXTRACTION QISM A #30` · `EXTRACTION QISM D #30`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I16 · `workflow_rules` snapshot (`rule_version_id`)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#32)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Qoida o'zgarsa **jarayondagi** hujjatlar eski qoidada qoladi — hujjatda `rule_version_id` FK snapshot; yangi hujjatlar yangi qoidada (migration trigger emas).
- **Dalil (kod):** `workflow-rules-2026-06-20.sql` + repository + controller real (6 fayl); `count(*) FROM workflow_rules` → 0; `grep rule_version_id` `apps/`/`lib/` → **0 fayl**.
- **Nima yetishmaydi:** `rule_version_id` ustuni hujjat jadvallarida + qoidalarni versiyalash; `workflow_rules` ni to'ldirish (egasi-DATA).
- **Bog'liqlik:** EP-COR-119, EP-COR-089, EP-COR-028
- **action:** CREATE · **⤳ Ta'sir:** Workflow barqarorligi
- **Xoch-havolalar:** `[Module-04] Item #32` · `EXTRACTION QISM A #32`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I17 · `escalation_log` + 3 kunda CEO'ga skip
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#33)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Otdeleniye boshlig'i ham eskalatsiya qilmasa 3 kundan keyin avto CEO'ga skip; skip `escalation_log` da `level_skipped: dept_head, reason: no_acting_officer` sifatida yoziladi.
- **Dalil (kod):** `to_regclass('public.escalation_log')` → `null`; `rasporyazhenie-escalation.cron.ts` kunlik 09:00 da overdue belgilaydi + 2 tomonga xabar; `zno-zvs-sla-escalation.cron.ts` `resolveNextLevel()` bilan **bir** pog'ona yuqoriga chiqadi (`manager_id` → `org_departments.head_user_id`). **Δ:** `d6da370f` — CC eskalatsiyasi endi haqiqatan xabar yuboradi va qayta yo'naltiradi.
- **Nima yetishmaydi:** `escalation_log` jadvali; 3 kunlik taymer; CEO'ga yakuniy skip (`resolveNextLevel` birinchi topilgan boshliqda to'xtaydi).
- **Bog'liqlik:** EP-COR-027, EP-COR-053, EP-COR-134, VR-COR-I08 (i.o. yo'qligi sababi)
- **action:** CREATE · **⤳ Ta'sir:** Eskalatsiya uzluksizligi
- **Xoch-havolalar:** `[Module-04] Item #33` · `EXTRACTION QISM A #33`
- **Δ 2026-07-11→08-07:** `d6da370f` · `c7d4d0f8` (CC eskalatsiya xabari + Telegram).

### VR-COR-I18 · Maxfiy majlis RLS (tayinlanishdan keyingi majlislar)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#34)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Maxfiy majlis a'zosi faqat **tayinlanishdan keyingi** maxfiy majlislarni ko'radi (`created_at > assignment_date` + row-level security).
- **Dalil (kod):** `grep created_at.*assignment_date|maxfiy.*majlis|secret.*meeting` `apps/` → 0 fayl; majlis/sessiya entiteti umuman yo'q.
- **Nima yetishmaydi:** majlis entiteti (EP-COR-037) + maxfiylik ustuni (EP-COR-076) + RLS filtri.
- **Bog'liqlik:** EP-COR-037, EP-COR-076, EP-COR-131
- **action:** READ · **⤳ Ta'sir:** Maxfiylik, Security
- **Xoch-havolalar:** `[Module-04] Item #34` · `EXTRACTION QISM A #34` · `EXTRACTION QISM D #34`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I19 · Ish-kun/bayram kalendari + cron surish + catch-up
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#22, #36, #37)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** (a) HR приказ `effective_date` kelganda kunlik 00:05 cron event yuboradi, bayramga to'g'ri kelsa keyingi ish kuniga suriladi; (b) bayram kuni cron avto suriladi, yuborilgan eslatma bekor emas — "Sana o'zgardi" **update** xabari; (c) cron o'tkazib yuborilsa catch-up run + `overdue_marked_at`.
- **Dalil (kod):** `common/time/tashkent-time.service.ts:37` dam-kunini o'tkazadi, lekin `:38` da **"public holiday support" ochiq TODO**; ish-kun kalendari jadvali yo'q (`grep holiday|bayram|working.?day.?calendar` `modules/director` → 0). `rasporyazhenie-escalation.cron.ts` har safar to'liq skan qiladi (`deadline < CURRENT_DATE`) → tasodifan catch-up-xavfsiz, lekin `overdue_marked_at` yo'q. HR sxemasida `effective_date` ustuni bor, 00:05 cron yo'q.
- **Nima yetishmaydi:** ish-kun/bayram kalendari jadvali (⭐ **egasi-DATA**: qo'lda O'zbekiston bayramlari ro'yxati vs tashqi kalendar); 00:05 приказ-faollashtirish cron'i; ataylab catch-up + audit izi.
- **Bog'liqlik:** EP-COR-021/060 (`effective_date`), EP-COR-038, EP-COR-039, EP-COR-044, EP-COR-065, EP-COR-081
- **action:** CRON · **⤳ Ta'sir:** butun cron/eslatma qatlami, HR
- **Xoch-havolalar:** `[Module-04] Item #22/#36/#37` · `EXTRACTION QISM A #22/#36/#37` · `EXTRACTION QISM D #22/#36`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I20 · tsvector FTS + server-tomon maxfiylik filtri
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#40)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Qidiruv PostgreSQL `tsvector` (simple/russian + `unaccent`) bilan — Elasticsearch kerak emas; maxfiy hujjat filtri **faqat server-tomon** (`WHERE rbac_visible AND user_has_access(card_id)`), FE filtri yetarli emas.
- **Dalil (kod):** `common/search/fuzzy-search.service.ts` + `shared/db/migrations/search-fts-indexes.sql` — umumiy tsvector FTS infratuzilmasi **real va ilova-bo'ylab**; `grep rbac_visible|WHERE.*visible|maxfiy.*filter` `fuzzy-search.service.ts` da → 0 mos.
- **Nima yetishmaydi:** COR hujjatlariga FTS ulanishi (EP-COR-014/075); maxfiylik ustuni (EP-COR-076); `unaccent` konfiguratsiyasi tasdiqlanmagan.
- **Bog'liqlik:** EP-COR-014, EP-COR-075, EP-COR-076, EP-COR-131
- **action:** READ · **⤳ Ta'sir:** Arxiv qidiruv, Security
- **Xoch-havolalar:** `[Module-04] Item #40` · `EXTRACTION QISM A #40`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I21 · Telegram `/tanishuv` buyrug'i (приказ tanishuvi)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#41)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Yangi xodim ERP'ga kirmagan bo'lsa Telegram orqali `/tanishuv <приказ_raqami>`; 2 ish kunidan keyin tanishuv berilmasa **rahbar mas'ul** + HR ogohlantirish; tanishmagan приказ audit-logda belgilanadi.
- **Dalil (kod):** `grep tanishuv|acquaint|familiariz` `apps/api/src` → **0** — buyruq umuman yo'q.
- **Nima yetishmaydi:** bot buyrug'i + tanishuv yozuvi (EP-COR-025) + 2 ish kunlik taymer (VR-COR-I19).
- **Bog'liqlik:** EP-COR-025, EP-COR-029, VR-COR-I19
- **action:** CREATE · **⤳ Ta'sir:** Приказ tanishuvi, NTF
- **Xoch-havolalar:** `[Module-04] Item #41` · `EXTRACTION QISM A #41` · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I22 · KPI outbox + `POST /kpi/recompute` + `kpi_card_split` prorata
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#27, #45)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** (a) KPI eventi yuborilmasa transactional outbox → restartda qayta yuboriladi; admin uchun `POST /kpi/recompute?from=&to=` **shart**; (b) oy o'rtasida karta almashsa KPI prorata ikkala kartaga yoziladi, nomuvofiqlik `kpi_card_split` da qayd etiladi.
- **Dalil (kod):** umumiy transactional outbox infratuzilmasi mavjud (`shared/db/schema-outbox.ts`); COR-maxsus `recompute` endpoint yo'q (`grep recompute` → faqat `customer-abc`, `supplier-rating`); `to_regclass('public.kpi_card_split')` → `null`.
- **Nima yetishmaydi:** COR KPI recompute endpoint'i; `kpi_card_split` jadval + prorata hisobi; `ckp_fact_values` 0 qator (EP-COR-102/120).
- **Bog'liqlik:** EP-COR-073, EP-COR-102, EP-COR-120, EP-COR-135, EP-ORG (karta almashinuvi)
- **action:** CREATE · **⤳ Ta'sir:** KPI ishonchliligi va adolati
- **Xoch-havolalar:** `[Module-04] Item #27` · `[Module-04] Item #45` · `EXTRACTION QISM A #27/#45` · `EXTRACTION QISM D #27`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I23 · ERP chat = RASMIY kanal bayrog'i
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#46)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** ERP ichidagi Coordination chat **rasmiy** kanal (protokolga bog'liq xabarlar auditga tushadi, arxivga kiradi); Telegram = operativ/norasmiy (audit bor, lekin rasmiy hujjat emas).
- **Dalil (kod):** Chat moduli mavjud (`components/cc/CommunicationCenter.tsx`), lekin rasmiy-kanal/audit-arxiv bayrog'i yo'q — `grep official.*channel|is_official|rasmiy.*kanal` → 0 kod.
- **Nima yetishmaydi:** `is_official` bayrog'i + arxivga kiritish qoidasi + audit ajratmasi.
- **Bog'liqlik:** EP-COR-074 (arxiv), EP-COR-078 (audit izi), Chat/CC moduli
- **action:** UPDATE · **⤳ Ta'sir:** Chat/COR kanal maqomi
- **Xoch-havolalar:** `[Module-04] Item #46` · `EXTRACTION QISM A #46` · `EXTRACTION QISM D #46`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I24 · Kodlangan qaytarish sabablari + `version`
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#48)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Doklad qaytarish sabablari **kodlangan ro'yxat** (`to'liq_emas`, `format_xato`, `raqamlar_xato`, `boshqa`) + ixtiyoriy erkin izoh; qayta yuborilganda arxivda v1 "Qaytarildi" va v2 "Topshirildi" ko'rinadi, `version` ustuni avto o'sadi (default 1).
- **Dalil (kod):** `dokla` ustunlarida sabab-kodi ustuni yo'q — faqat erkin `problem`/`proposal`/`result`; `version` ustuni ham yo'q; `coordination.service.ts` `updateDokla` faqat statusni o'zgartiradi.
- **Nima yetishmaydi:** sabab-kodi lug'ati (**master-data, CRUD-sozlanadigan**) + `version` ustuni + versiya tarixi.
- **Bog'liqlik:** EP-COR-048 (5 holat — `qaytarildi`), EP-COR-005
- **action:** CREATE · **⤳ Ta'sir:** Doklad sifat tsikli
- **Xoch-havolalar:** `[Module-04] Item #48` · `EXTRACTION QISM A #48` · `EXTRACTION QISM D #48`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I25 · Multi-karta signal atribusiyasi (buyurtma-kartaga) + karta-bo'yicha blank
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#19, #39)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** (a) Xodim bir nechta kartada bo'lsa kechikish/STOP/brak signali **buyurtmaga bog'liq kartaga** yoziladi (hammasiga emas); yakuniy baho inson tasdig'i bilan (E1). (b) Bilim blanki har karta uchun alohida, konsolidatsiyasiz.
- **Dalil (kod):** (a) `grep card.*signal|order.*card.*attribut` → 0 kod — buyurtma-karta atribusiya mexanizmi yo'q. (b) LMS per-karta bilim moduli **REAL**: `lms/presentation/card-required-knowledge.controller.ts` + `application/services/card-required-knowledge.service.ts` + `infrastructure/repositories/drizzle-card-required-knowledge.repo.ts` — dizayn bo'yicha karta-doirasida (konsolidatsiyasiz).
- **Nima yetishmaydi:** signal atribusiyasi (a) — LMS yarmi (b) tayyor.
- **Bog'liqlik:** EP-COR-135 (karta-AI), EP-COR-100 (blank), EP-ORG (ko'p karta)
- **action:** AI · **⤳ Ta'sir:** Karta-AI baho adolati, LMS
- **Xoch-havolalar:** `[Module-04] Item #19` · `[Module-04] Item #39` · `EXTRACTION QISM A #19/#39` · `EXTRACTION QISM D #19/#39`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I26 · Smena/tablet operatsion kafolatlari (avto-yopish, TB gate, offline, manual_entry)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#17, #18, #23, #35)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** (#17) MES cron har 5 daq tekshiradi, ish vaqti tugagach 15 daq o'tsa smena avto "yopilmagan", handover trigger, ochiq STOP keyingi smenaga ko'chadi. (#18) IoT tablet offline bo'lsa cheklist IndexedDB'da, tarmoq qaytganda sync; OEE retroaktiv qayta hisob. (#23) Skaner o'qimasa **smena boshlig'i** qo'lda kiritadi (operator emas), `manual_entry: true` + audit + QC signali. (#35) TB xavfsizlik cheklisti **BIRINCHI qattiq gate**, so'ng smena cheklisti — ketma-ket, parallel emas.
- **Dalil (kod):** (#17) MES smena infratuzilmasi bor (`mes-shifts-stats.service.ts`, `production-session.aggregate.ts`, `cron/mes-sos-escalation.cron.ts`), lekin **aniq 5/15 daq avto-yopish cron'i topilmadi**. (#18) Offline IndexedDB sync naqshi real va qayta ishlatiladi (`lib/erp-offline-db.ts`, `hooks/useErpOfflineSync`, `pos-monitor/hooks/useOfflineSync.ts`) — IoT tablet TB-cheklistiga ulangani tasdiqlanmagan. (#23) `iot-tablet.schemas.ts:165` `eventType: z.string().max(100).default('manual_entry')` — bayroq real; to'liq audit+QC signali tasdiqlanmagan. (#35) IoT tablet safety-checklist bor (`iot-tablet.controller.ts`, `drizzle-iot-main.repo.ts`, `hr-gsd.controller.ts`), lekin **ketma-ket qattiq gate tartibi tasdiqlanmagan**.
- **Nima yetishmaydi:** 5/15 daq avto-yopish cron'i; TB→smena ketma-ketlik darvozasi; qo'lda-kiritish rol-cheklovi (smena boshlig'i) va QC signali.
- **Bog'liqlik:** MES (Area 10), IoT (Area 08), EP-COR-099, EP-COR-130, EP-COR-087
- **action:** CRON · **⤳ Ta'sir:** MES smena, IoT tablet, QC
- **Xoch-havolalar:** `[Module-04] Item #17/#18/#23/#35` · `EXTRACTION QISM A #17/#18/#23/#35` · `EXTRACTION QISM D #17/#18/#35`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I27 · COR "tayyor" DoD D5 — 5 cron + 5 event + 3 AI qadam
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#50)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** (1) 5 cron: overdue-belgilash (kunlik), sessiya eslatmasi (Seshanba 08:45), imzo muddati (kunlik), KPI to'plash (kunlik), catch-up retroaktiv. (2) 5 event: `ProtocolSigned`, `RaspStatusChanged`, `ManagerReassigned`, `ProductionPlanUpdated`, `MaterialShortage`. (3) 3 AI qadam: doklad qoralash (kamera→transkripsiya→AI), KPI signal, karta-AI baho. Har biriga isbot: integration test + DB-proof.
- **Dalil (kod):** ⭐ **Cron: 3/5** — `rasporyazhenie-escalation.cron.ts`, `zno-zvs-sla-escalation.cron.ts`, `owner-summary-daily.cron.ts` (Seshanba sessiya eslatmasi va imzo-muddati cron'lari yo'q). ⭐ **Event: 0/5** — beshala nom bo'yicha grep `apps/` da 0 fayl. ⭐ **AI qadam: 0/3** — bu modul uchun AI qadam dalili topilmadi.
- **Nima yetishmaydi:** 2 cron + 5 event + 3 AI qadam va ularning integration-test/DB-proof isboti.
- **Bog'liqlik:** ⭐ VR-COR-I04 (eventlar), EP-COR-017/065 (yo'q cronlar), EP-COR-030/062/135 (AI qadamlar), VR-COR-I19 (catch-up)
- **action:** EVENT · **⤳ Ta'sir:** butun COR "tayyorlik" mezoni
- **Xoch-havolalar:** `[Module-04] Item #50` · `EXTRACTION QISM A #50`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I28 · Uch karzina ↔ Kanban izolyatsiyasi
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#24)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** "Uch karzina" va Kanban — **alohida sahifalar**; COR 3-karzinada faqat COR hujjatlari (доклад/протокол/приказ), Kanban vazifalari COR panelida faqat "bajarilish %" vidjeti sifatida; COR karzinasidan Kanban vazifasini yopib bo'lmaydi (izolyatsiya).
- **Dalil (kod):** `QISM D #24` bu bandni **"Ha"** deb hal qilgan: `coordination.repository.ts:178` `listBaskets` (`cc_documents.basket_state`), `GET /coordination/baskets` (`coordination.controller.ts:84`), FE `CoordinationPage.tsx` + `components/kanban/ThreeBasketsPanel.tsx` + `components/cc/BasketColumn.tsx` — izolyatsiya qilingan panel real.
- **Nima yetishmaydi:** "bajarilish %" vidjeti (EP-COR-069 hali Yo'q) → izolyatsiya bor, lekin ko'prik hali yo'q; `cc_documents` 2 qator.
- **Bog'liqlik:** EP-COR-106, EP-COR-069, VR-COR-I13
- **action:** READ · **⤳ Ta'sir:** COR panel / Kanban chegarasi
- **Xoch-havolalar:** `[Module-04] Item #24` · `EXTRACTION QISM A #24` · `EXTRACTION QISM D #24`
- **⚠️ ZIDDIYAT:** `QISM D #24` = "Ha", `FULL-ITEM-LEVEL Item #24` = "Qisman" (`cc_documents` 2 qator, real kundalik foydalanish yo'q). Registrda ehtiyotkorroq baho olindi.
- **Δ 2026-07-11→08-07:** —

### VR-COR-I29 · Ish vaqtidan tashqari tasdiq — mutlaq muddat, avto-blok yo'q
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#20)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ish vaqtidan tashqarida buyurtma o'zgarsa tasdiq so'rovi Telegram + ilova ichi; muddat **mutlaq vaqt** (ish vaqtiga bog'liq emas); tasdiq kelmasa eslatma, lekin **avto blok yo'q** — bloklash faqat podpisnoy gate uchun (EP-COR-092).
- **Dalil (kod):** `modules/director` da ish-vaqtidan-tashqari tasdiq/mutlaq-muddat mantig'i topilmadi.
- **Nima yetishmaydi:** mutlaq-muddat maydoni + Telegram tasdiq so'rovi oqimi.
- **Bog'liqlik:** EP-COR-092 (yagona qattiq gate), EP-COR-114, EP-COR-080
- **action:** UPDATE · **⤳ Ta'sir:** Tasdiq oqimi, NTF
- **Xoch-havolalar:** `[Module-04] Item #20` · `EXTRACTION QISM A #20` · `EXTRACTION QISM D #20`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I30 · Rais ruxsati bilan kech band → qayta bildirishnoma + doklad talabi
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#21)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Rais ruxsati bilan band qo'shilsa barcha a'zolarga **qayta** bildirishnoma (Telegram + ERP); yangi band uchun doklad talab qilinadi; protokolda "Rais ruxsati bilan qo'shildi" belgisi bilan ko'rsatiladi.
- **Dalil (kod):** `modules/director` fayl ro'yxatida kengash uchun faqat `council-members.repository.ts`/`.controller.ts` va `council-quorum.service.ts` bor — **agenda/majlis repository yo'q**.
- **Nima yetishmaydi:** agenda entiteti (EP-COR-040) + qayta-NTF + "Rais ruxsati" belgisi.
- **Bog'liqlik:** EP-COR-040, EP-COR-037, EP-COR-011
- **action:** CREATE · **⤳ Ta'sir:** Majlis kun tartibi
- **Xoch-havolalar:** `[Module-04] Item #21` · `EXTRACTION QISM A #21` · `EXTRACTION QISM D #21`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I31 · Bir kunda ko'p majlis vidjeti (real-vaqt)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#42)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Bir kunda bir nechta majlis bo'lsa vidjet ikkalasini ko'rsatadi (yaqinrog'i birinchi); majlis tugagach vidjet real-vaqtda yangilanadi (SSE / WebSocket / 30 s polling) — sahifa qayta yuklanmaydi.
- **Dalil (kod):** majlis entiteti yo'q. `QISM D #42`: FE'da Councils tab bor (`CoordinationPage.tsx:85` `useQuery /coordination/councils`), lekin `refetchInterval`/SSE/WS **yo'q** (real-vaqt emas) va kunlik ko'p-majlis vidjeti yo'q.
- **Nima yetishmaydi:** majlis entiteti + real-vaqt yangilanish qatlami.
- **Bog'liqlik:** EP-COR-037, EP-COR-026 ("yaqin majlis" vidjeti)
- **action:** READ · **⤳ Ta'sir:** FE vidjet
- **Xoch-havolalar:** `[Module-04] Item #42` · `EXTRACTION QISM A #42` · `EXTRACTION QISM D #42`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I32 · Bekor приказ HR'ni retroaktiv qaytarmaydi (`supersedes_id`)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#31)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Bekor qilingan приказ HR operatsiyasini retroaktiv qaytarmaydi — alohida **teskari приказ** talab qilinadi; tizim faqat "Bekor qilindi" holatiga o'tkazadi, HR trigger emas (yuridik audit izi to'liq saqlanadi).
- **Dalil (kod):** `prikaz-protocol-2026-06-30.sql:19-21` `supersedes_id INTEGER`; `prikaz.repository.ts` `create()` `supersedesId` ni qabul qiladi, `cancel()` (94-104) `status='cancelled'` + `cancel_reason` qo'yadi va **HR'ga hech qanday event yubormaydi** — vizyon talabi shu jihatdan bajarilgan.
- **Nima yetishmaydi:** "teskari приказ" oqimi alohida tur/shablon sifatida rasmiylashtirilmagan (EP-COR-057 kategoriya yo'qligi bilan bir); HR listener'i ataylab yo'qligi hujjatlashtirilmagan.
- **Bog'liqlik:** EP-COR-061, EP-COR-057, HR moduli
- **action:** UPDATE · **⤳ Ta'sir:** Приказ yuridik izi, HR
- **Xoch-havolalar:** `[Module-04] Item #31` · `EXTRACTION QISM A #31`
- **Δ 2026-07-11→08-07:** —

### VR-COR-I33 · Kech e'tiroz imzoni avto-bekor qiladi (versiya o'sadi)
- **Qaror holati:** ✅ TAVSIYA-JAVOB (#13)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Kotib imzolagan, Rais hali imzolamagan holatda "alohida fikr" qo'shilsa — **kotib imzosi avtomatik bekor** qilinadi, versiya o'sadi, kotib qayta imzolaydi; asl variant arxivda saqlanadi (immutable + versiya tarixi).
- **Dalil (kod):** `prikaz-protocol-2026-06-30.sql:39,42` — `dissenting_opinion JSONB` + `parent_protocol_id`; `protocol.repository.ts` (to'liq o'qilgan) `dissentingOpinion` ni `create()`/`updateDraft()` da o'rnatadi, `amend()` yangi versiyalangan protokol yaratib asl nusxani `'amended'` qiladi.
- **Nima yetishmaydi:** kech e'tiroz qo'shilganda **imzoni avto-bekor qilish** mantig'i yo'q — `updateDraft()` faqat `status='draft'` da ishlaydi, ya'ni imzolangan protokol majburan `amend()` (yangi hujjat) yo'lidan boradi, avtomatik imzo-bekor emas.
- **Bog'liqlik:** EP-COR-063 (2-imzo zanjiri), EP-COR-066, EP-COR-067
- **action:** UPDATE · **⤳ Ta'sir:** Protokol imzo butunligi
- **Xoch-havolalar:** `[Module-04] Item #13` · `EXTRACTION QISM A #13`
- **Δ 2026-07-11→08-07:** —

---

## III QISM — Ziddiyatlar reestri, manba-xaritasi va Δ jurnali

### §III.1 — Ziddiyatlar reestri (39 ta)

> **A guruh — B04/TASDIQ-2146 eskirgan (2026-06-27 audit vs 2026-06-30 migratsiyalar).** Bu eng katta va eng muhim guruh: `_parts/B04-coordination.md` auditi `council-members-2026-06-30.sql` va `prikaz-protocol-2026-06-30.sql` migratsiyalaridan **3 kun oldin** o'tkazilgan, shuning uchun kengash-a'zolik, kvorum/ovoz, приказ va протокол klasterlarini "YO'Q" deb belgilagan — aslida ular jonli.

| # | Band | B04/TASDIQ da'vosi | Jonli kod (2026-07-11) | Xulosa |
|---|---|---|---|---|
| 1 | EP-COR-031 | `council_members` jadval YO'Q | jadval + to'liq CRUD, 0 qator | B04 eskirgan |
| 2 | EP-COR-032 | rol/a'zolik ustuni yo'q | `RoleEnum` 4 rol enforce | B04 eskirgan |
| 3 | EP-COR-033 | `grep quorum` = 0 | `council-quorum.service.ts` 2/3 + konstantalar | B04 eskirgan |
| 4 | EP-COR-034 | `grep vote` = faqat chat poll | `evaluateDecision()` + `chair_tiebreak` | B04 eskirgan |
| 5 | EP-COR-049 | `prikaz` jadval/controller YO'Q | jadval + repo + `PrikazController` | B04 eskirgan |
| 6 | EP-COR-056 | приказ entiteti yo'q | `prikaz_number_seq` + `nextval` | B04 eskirgan |
| 7 | EP-COR-057 | приказ entiteti yo'q | jadval bor, faqat kategoriya ustuni yo'q | B04 eskirgan |
| 8 | EP-COR-058 | raqamlash umuman yo'q | `cancel()` teshikni ataylab saqlaydi | B04 eskirgan |
| 9 | EP-COR-059 | приказ yo'q | entitet bor, asos FK yo'q | B04 eskirgan |
| 10 | EP-COR-060 | приказ jadval yo'q | jadval bor, `effective_date` yo'q | B04 eskirgan |
| 11 | EP-COR-061 | приказ + `document_hashes` yo'q | приказ bor; `document_hashes` haqiqatan yo'q | B04 yarim eskirgan |
| 12 | EP-COR-062 | `protocol` controller YO'Q (grep=0) | `ProtocolController` real | B04 eskirgan |
| 13 | EP-COR-063 | protokol entiteti/rollar yo'q | `chairperson_id`+`secretary_id`+`sign()` | B04 eskirgan |
| 14 | EP-COR-064 | imzo entiteti yo'q | `sign()` + `AuditInterceptor` | B04 eskirgan |
| 15 | EP-COR-066 | **noto'g'ri jadval** (`cc_documents`) | `protocol.amend()`+`parent_protocol_id` real | B04 xato manba |
| 16 | EP-COR-067 | e'tiroz entiteti yo'q | `dissenting_opinion JSONB` real | B04 eskirgan |
| 17 | EP-COR-002 | (04.1/04.2 orqali) a'zolik yo'q | jadval + 4 rol | B04 eskirgan |
| 18 | EP-COR-011 | protokol jadval/controller YO'Q | real | B04 eskirgan |
| 19 | EP-COR-009 | `@Cron` yo'q, faqat `SELECT CASE` | `@Cron('0 9 * * *')` real | B04 eskirgan |
| 20 | EP-COR-027 | `@Cron` yo'q; HR ko'tarish yo'q | cron bor; HR yo'q | B04 **yarim** eskirgan |
| 21 | EP-COR-053 | eskalatsiya yo'q | 1 bosqichli real eskalatsiya bor | B04 kam baholagan |
| 22 | EP-COR-106 | `cc_documents` = 0 | jonli **2 qator** | B04 eskirgan (kichik) |
| 23 | EP-COR-134 | per-tur SLA konfig **datasiz** | `cc_document_templates` **17 qator** to'ldirilgan | B04 kam baholagan |

> **B guruh — manba ichidagi raqam/dublikat to'qnashuvlari.**

| # | Band(lar) | Tavsif |
|---|---|---|
| 24 | EP-COR-089 ↔ EP-COR-101 | ⭐ `04.71` raqami **ikki xil mavzuga** berilgan: B04 da "sektsiya darajasigacha marshrut" (089), QISM C da "bo'lim hisobot ritmi" (101). `FULL-ITEM-LEVEL` buni `Item 71` / `Item 71-alt` deb ajratgan. |
| 25 | EP-COR-101 | `04.71` va `04.83` — bir xil mavzu, ikki qator (manba jadvalining o'zi tan oladi). |
| 26 | EP-COR-097 | bitta EP kod ikki itemga bo'lingan va **ikki xil holat** olgan: `Item 67` = Yo'q (COR tomoni), `Item 79` = Qisman (dizayn tomoni). |
| 27 | EP-COR-108 ↔ EP-COR-122 | bitta texnik bo'shliq (`qc_braks` da atributsiya ustuni yo'q), lekin `Item 90` = Yo'q, `Item 104` = Qisman. |
| 28 | EP-COR-096 ↔ EP-COR-126 | bitta `mes_operations` bo'shlig'i, lekin `Item 78` = Qisman, `Item 108` = Yo'q. |
| 29 | EP-COR-118 ↔ EP-COR-129 | bitta `internal_requests` bo'shlig'i, ikki band (manba "duplicate topic" deb belgilaydi). |
| 30 | EP-COR-102 ↔ EP-COR-120 | bitta `ckp_fact_values` jadvali, ikki band. |
| 31 | VR-COR-I28 | `QISM D #24` = "Ha" vs `FULL-ITEM-LEVEL Item #24` = "Qisman". |

> **C guruh — vizyon ichidagi mazmuniy ziddiyatlar (egasi hal qilishi kerak).**

| # | Band(lar) | Ziddiyat |
|---|---|---|
| 32 | EP-COR-001 | vizyon "5 ShVB kengash (Asoschilar/Ijroiya/Рек.Совет/Qomita/O'rinbosarlar)" vs jonli "5 domen-kengash (hr/quality/finance/technical/management)" — soni bir xil, mazmuni boshqa. |
| 33 | EP-COR-020 ↔ EP-COR-056 | приказ raqam formati **uch xil**: "2026-001" / "PR-YYYY-NNN" / kodda bare integer. |
| 34 | EP-COR-032 | vizyon "faqat A'zo+Rais ovoz beradi" vs kod `countVotingMembers()` faqat `guest` ni chiqaradi (kotib ham ovozga sanaladi) — **kod vizyonga zid** (Q-40). |
| 35 | EP-COR-070 | `decisions` `action: CRON` vs `vision-1000 #9` aynan shu bandga "**cron emas, event-driven zanjir**" deydi. |
| 36 | EP-COR-077 | B04 "dokla/rasp HARD DELETE" vs FULL-ITEM-LEVEL "Prikaz/Protocol repo'da delete yo'q" — **turli entitetlar**, umumlashtirilib bo'lmaydi. |
| 37 | EP-COR-083 / VR-COR-I04 | ⭐ vizyon "**event, polling emas**" vs COR arxitekturasi "cron-polling" — `FULL-VISION-EXTRACTION` Step-3 da ochiq arxitektura ziddiyati. |
| 38 | VR-COR-I11 | vizyon "BullMQ 3 urinish" vs kod `attempts: 10`. |
| 39 | EP-COR-134 | vizyon "muammo signaliga 2 soat SLA" vs jonli barcha `escalation_hours` 48–96 soat, "muammo" turi umuman yo'q. |

### §III.2 — Manba → EP-COR xaritasi

| Manba oralig'i | EP-COR | FULL-ITEM-LEVEL |
|---|---|---|
| `vision-1000` #1..#50 = `QISM A` #1..#50 | **EP kodsiz** → II QISM (VR-COR-I01..I33) | `Item #1..#50` |
| `B04 04.1..04.55` = `TASDIQ §04 #1..#55` | EP-COR-031..085 (1:1) | `Item #51..#105` |
| `B04 04.56..04.64` | EP-COR-015/016/017/018/026/027/028/029/030 | `Item #106/#107/#108`, `Item 59..64` |
| `B04 04.65..04.67` | EP-COR-089 / 106 / 097 | `Item 65 / 66 / 67` |
| `B04 04.68..04.117` | EP-COR-086..135 (1:1) | `Item 68..117` |
| `B04 04.71` (ikkinchi ma'no) | EP-COR-089 (sektsiya darajasi) | `Item 71-alt` |
| **manbada yo'q** | **EP-COR-001..014, 019..025 (21 band)** | mavzu-mosligi orqali, hammasi `(taxminiy)` |

> **Konvertatsiya formulasi:** `TASDIQ §04 #N` → `FULL-ITEM-LEVEL Item #(N+50)` (N ≤ 58) yoki `Item N` (N ≥ 59).
> **Qamrov nazorati:** `grep -c "^### EP-COR-"` → **135**; `grep -c "^### VR-COR-"` → **33**; ikkala holat-o'qi har bandda mavjud (`Qaror holati` va `Qurilish holati` = 168 tadan).

### §III.3 — Δ jurnali 2026-07-11 → 2026-08-07

> Ko'rilgan yo'llar: `apps/api/src/modules/communication-center/`, `apps/api/src/modules/director/presentation/coordination*`, `.../workflow-rules*`, `artifacts/erp-dashboard/src/pages/WorkflowRules.tsx` — jami **22 commit**. Quyida koordinatsiya vizyoniga ta'sir qilganlari.

| Commit | Sana | Nima o'zgardi | Ta'sirlangan bandlar |
|---|---|---|---|
| `31fbc7df` | 07-11 | `GET /cc/documents/:id` da ownership tekshiruvi yo'q edi — xavfsizlik teshigi yopildi | EP-COR-131 |
| `cd940c4d` | 07-11 | 48h avto-rad olib tashlandi, 24h takroriy eslatma qo'shildi | EP-COR-134 |
| `48bcb53c` | 07-13 | ⭐ **CC-tasdiq → GL avto-posting** listener (`cc-approved-gl-posting.listener.ts`) + GL hisob-xaritalari seed | EP-COR-083, VR-COR-I04 |
| `8113fb80` | 07-13 | `archive_after_days` + 90-kunlik eskirgan-qoralama arxiv cron'i | EP-COR-134 |
| `e5bac042` | 07-13 | Ko'rish/nusxalash/chop etish access-logging (`document-access-log.service.ts`), CC'da pilot | EP-COR-078, EP-COR-131 |
| `3728606f` | 07-13 | Tier-driven watermark hujjat ko'ruvchilarida | EP-COR-131 |
| `6e2fea7c` | 08-06 | `WorkflowRules.tsx` sahifasiga **tahrirlash UI** qo'shildi (backend `PUT` bor edi, FE'da ochilmagan edi) | EP-COR-119 |
| `d6da370f` | 08-06 | Tasdiq eskalatsiyasi avval faqat holat belgilardi — endi **xabar yuboradi + qayta yo'naltiradi** | EP-COR-027, EP-COR-134, VR-COR-I17 |
| `09582d90` | 08-06 | Overdue-eslatma 48h/24h intervallari **`business_settings` CRUD-sozlanadigan** bo'ldi | EP-COR-027, EP-COR-134 |
| `d0f86666` | 08-06 | `coordination.controller.ts` inline SQL repo/service'ga ko'chirildi (Qoida 6/15) | EP-COR-026 |
| `c7d4d0f8` | **08-07** | ⭐ SLA-eskalatsiya `pushNotification()` avval faqat `cc_notifications` qatorini yozardi (oluvchi ilovani ochmasa bilmasdi) — **endi `TELEGRAM_SENDER` orqali Telegram'ga ham yetkazadi** (`@Optional`, best-effort) + Qoida-6 tozalash (`CcDocumentsReadRepo`) | EP-COR-007, EP-COR-027, EP-COR-080, EP-COR-134, VR-COR-I11, VR-COR-I17 |

### §III.4 — Uslub va qamrov izohlari

1. **Ikki o'q hech qachon aralashtirilmadi.** `Qaror holati` faqat `decisions/04-coordination.md` dan (✅/🔵), `Qurilish holati` faqat `FULL-ITEM-LEVEL` + jonli DB dalilidan olindi. Ajratish eng aniq ko'rinadigan misollar: **EP-COR-033/034** (qaror 🔵 OCHIQ, qurilish deyarli tugagan) va **EP-COR-112** (qaror 🔵 A-default, qurilish **Ha**) — teskarisi esa **EP-COR-062/063/068** (qaror ✅, qurilish yo'q/qisman).
2. **STALE-DOC** — qurilish o'qidagi alohida qiymat: "manba hujjat kodni yo'q deb yozgan, lekin kod jonli". 15 ta band shunday; hammasi §III.1 A guruhida.
3. **`(taxminiy)`** — EP-COR-001..014 va 019..025 uchun mos item `Vision citation` orqali topilmadi (bu 21 band `B04`/`TASDIQ §04` jadvalida umuman yo'q), shuning uchun mavzu-mosligi bo'yicha eng yaqin item ishlatildi va har birida ochiq belgilandi. **Hech bir dalil to'qilmadi (Q-40).**
4. **Qurilish holati "—" bo'lgan band yo'q** — 21 ta EP-kodsiz-manbali band uchun ham jonli kod dalili topildi (приказ/протокол/доклад/kengash jadvallari o'sha itemlarda tekshirilgan).
5. **Threshold qiymatlar.** Bu modulda kamida **19 band** raqamli chegara talab qiladi (kvorum %, ogohlantirish muddati, majlis davomiyligi, doklad/приказ muddatlari, SLA soatlari, dalil fayl hajmi, harakatsizlik soati, og'ish %, N kun, chiqindi "to'la" darajasi). Egasi qoidasi bo'yicha ular chatda so'ralmaydi — `business_settings` ga default bilan qo'shilib CRUD orqali sozlanadi. `09582d90` bu naqshning ishlaydigan namunasi.
6. **Yakuniy tugunlar (bir necha bandni bir vaqtda ochadigan ishlar):**
   - ⭐ **Majlis/sessiya entiteti yo'qligi** — EP-COR-037/039/040/041/042/070/074/081/082/094/101/102 va VR-COR-I01/I02/I18/I30/I31 (17 band) shu bitta bo'shliqqa bog'liq.
   - ⭐ **Event-driven ip yo'qligi** (7 event, `@OnEvent` = 0) — EP-COR-069/070/083/104/111/114 va VR-COR-I04/I27.
   - ⭐ **Strukturalangan qaror entiteti yo'qligi** (`protocol.decisions` erkin matn) — EP-COR-013/068/069/070/115.
   - ⭐ **`workflow_rules` 0 qator + `resolve()` chaqirilmasligi + sektsiya darajasi yo'qligi** — EP-COR-028/089/119 va VR-COR-I16.
   - ⭐ **Bo'sh jadvallar** (`ckp_fact_values`, `ai_ckp_scores`, `sd_order_timeline`, `design_orders`, `qc_braks`, `internal_requests`, `workflow_rules`, `council_members` — hammasi 0 qator) — infratuzilma qurilgan, **ma'lumot yo'q**; bu egasi-DATA to'siqlari, kod to'siqlari emas.
