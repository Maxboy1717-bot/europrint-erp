# Director / Strategiya — Yagona Vizyon Registri (EP-DIR) — 2026-08-07

> **Manbalar:** `decisions/05-director.md` (85 qaror) · `FULL-ITEM-LEVEL [Module-05]` (135 item) · `FULL-VISION-EXTRACTION` QISM A (vision-1000 jadval) / QISM C (TASDIQ-2146 §05) / QISM D (V-VERIFY cross-ref) · `vision-1000-answers/05-director.md` (50 tavsiya-javob)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida `modules/director/` va director-FE ga tegilgan 15 commit qayta tekshirildi va jonli kodda spot-verify qilindi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-DIR-001..085)** | **85** |
| **Qaror holati:** ✅ javoblangan | 12 |
| **Qaror holati:** 🔵 ochiq (A-default) | 73 |
| **Qurilish:** Ha | 12 |
| **Qurilish:** Qisman | 38 |
| **Qurilish:** Yo'q | 32 |
| **Qurilish:** STALE-DOC | 3 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| ⭐ **Qurilgan (Ha/Qisman) LEKIN qarori hali 🔵 OCHIQ** | **41** (Ha 8 + Qisman 33) |
| 2026-07-11 dan beri o'zgargan (Δ) | 16 |
| ⚠️ Manbalar orasida ziddiyat (band-darajali `⚠️ ZIDDIYAT` qatorlari) | 32 |
| — shundan III.3 reestrida raqamlangan (Z-01..Z-17) | 17 |

> **Eslatma (bu modulning o'ziga xosligi):** Director — registrdagi eng **qaror-kambag'al, qurilish-boy** modul.
> 85 banddan atigi 12 tasi egasining to'g'ridan-to'g'ri javobi (Q123/Q144) yoki ShVB promptining aniq
> dizayn-belgilashi bilan yopilgan; qolgan **73** band `🔵 OCHIQ (A-default)` — ya'ni **egasi aytmagan**,
> agent tavsiya bergan. Shu bilan birga 50 band allaqachon qurilgan (Ha/Qisman). Demak ⭐ **41 band
> "kod bor, qaror yo'q"** holatida (qurilgan 50 dan atigi 9 tasi javoblangan qarorga tayanadi) —
> bu modulning bosh xavfi (Q-40: ishlaydi ≠ to'g'ri).
> Ikkala o'q shu faylda **hech qachon aralashtirilmaydi**.

> **Eslatma (tipografiya / sanoq):** vazifa sharti kirill `JAVОБЛАНГАН` variantini ham sanashni talab qilgan —
> jonli faylda tekshirildi (`grep -c "JAVОБЛАНГАН"` → **0**), hammasi lotin `JAVOBLANGAN`.
> ⚠️ Manba faylning **o'z sarlavhasi va XULOSA JADVALI 9 ✅ / 76 🔵** deydi, lekin band-darajali sanoq
> (`grep "^- \*\*Holat:\*\* ✅"`) **12** beradi (EP-DIR-003/004/005/007/011/012/015/017/018/020/025/044).
> Manba faylning o'z prozasi ham 11 ta + EP-DIR-044 ni sanab o'tadi — ya'ni sarlavhadagi "9" eskirgan.
> Bu registrda **band-darajali haqiqat** (12/73) ishlatiladi. → `VR-DIR-I01`.

> **Eslatma (mapping — 1:1, taxminiy emas):** `FULL-ITEM-LEVEL [Module-05]` **Item 51..135** = `TASDIQ-2146 §05 #1..#85`
> = **EP-DIR-001..085** (aniq 1:1, `Item N → EP-DIR-(N−50)`). `Item 1..50` = `vision-1000-answers/05-director.md #1..#50`
> — EP-kodsiz **operatsion aniqlashtirishlar**; ular mavzu bo'yicha o'z EP-bandiga biriktirilgan va
> `vision-1000 #M` sifatida belgilangan (biriktirish taxminiy bo'lsa `(taxminiy)` qo'yilgan).

> **Eslatma (qamrov):** bu fayl **I QISM** (85 EP-band) + **II QISM** (`VR-DIR-I01..I12` — EP-kodsiz
> vizyon-realizatsiya bo'shliqlari) + **III QISM** (xoch-havola xaritasi, ziddiyat reestri, Δ reestri).

---

## I QISM — EP-kodli qarorlar (EP-DIR-001..085)

### EP-DIR-001 · Kompaniya holat formulasi — qanday hisoblansin
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) To'liq formula — pul oqimi + ishlab chiqarish + buyurtma + xodim + sifat 5 ko'rsatkich birga. ShVB "Формула Состояний" + Q123 ("hammasini va to'liq, har modul asosiy ko'rsatkichlari") to'liq formulani qo'llab-quvvatlaydi.
- **Manba:** v1 Q1 · ShVB YO'NALISH 13 (company-state.service.calculateState) · Q123
- **Dalil (kod):** `director-holat.service.ts` `computeHolat()` (103-260) — 5-metrikli vaznli o'rtacha, null/NaN qo'riqchilari bilan sof funksiya. `state_thresholds` jonli **25 qator** (cash.25 / prod.25 / orders.20 / hr.15 / qual.15 × 5 daraja).
- **Bog'liqlik:** EP-DIR-002 (chegaralar), EP-DIR-024 (karta-modeldan yig'ilishi), EP-DIR-074
- **action:** CRON (op=dir.companyState.calc)
- **⤳ Ta'sir:** FIN (pul oqimi), PP/MES (ishlab chiqarish), SD (buyurtma), HR (xodim), QC (sifat) — barcha modul KPI agregati
- **Xoch-havolalar:** `[Module-05] Item 51` · `EXTRACTION QISM C #05.1` · `TASDIQ-2146 §05 #1` · `vision-1000 #1/#2/#4/#9` *(operatsion aniqlashtirishlar)*
- **⚠️ ZIDDIYAT:** `vision-1000 #1` (QISM A) "Yo'q — SB0399 STILL-OPEN, KPI vazn-konfiguratsiyasi yo'q" vs `[Module-05] Item 1` jonli tekshiruv "`state_thresholds.weight` to'g'ridan tahrirlanadi + `@UseInterceptors(AuditInterceptor)` avtomatik audit-log beradi". Yangi + kod-dalilli manba ustun → QISM A qatori **STALE-DOC**.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-002 · Holat chegaralari (ostona qiymatlar)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Boshliq o'zi belgilaydi — har ko'rsatkich uchun sozlanuvchi chegara (state-thresholds.entity sozlanuvchi). Tez boshlanish uchun B (tizim standarti) seed sifatida, keyin egasi tuzatadi.
- **Manba:** v1 Q2 · ShVB YO'NALISH 13 (state-thresholds.entity.ts "sozlanuvchi chegaralar")
- **Dalil (kod):** `company-state.controller.ts:91-115` — `GET/PATCH /company-state/thresholds/:id`, `state_thresholds` (`metric_key, level_code, min_value, max_value, weight`) ustida ishlaydi, 25 seed qator jonli.
- **Nima yetishmaydi:** qiymatlar hamon **seed-default** — egasi ko'rib chiqmagan (bu kod bo'shlig'i emas, egasi-DATA bo'shlig'i). Ikkinchi, mustaqil konfiguratsiya sirti (`kpi_definitions`/`kpi_score_weights`, `dashboard.controller.ts:155,194`) parallel yashaydi.
- **Bog'liqlik:** EP-DIR-001, EP-DIR-080 (bir xil mantiq)
- **action:** UPDATE (op=dir.stateThreshold.set)
- **⤳ Ta'sir:** Holat formulasi (EP-DIR-001), master-data sozlamalar
- **Xoch-havolalar:** `[Module-05] Item 52` · `EXTRACTION QISM C #05.2` · `TASDIQ-2146 §05 #2` · `vision-1000 #1`
- **⚠️ ZIDDIYAT:** ikkita mustaqil ostona-mexanizm jonli — `state_thresholds` (company-state.controller) va `kpi_definitions`/`kpi_score_weights` (dashboard.controller). Qaysi biri kanonik ekani hech qayerda belgilanmagan → dublikat master-data xavfi. → `VR-DIR-I02`.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-003 · Holatni kunlik avtomatik hisoblash (cron)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) Har kuni ertalab avtomatik 07:00. ShVB prompti aniq belgilaydi: "Cron: har kuni 07:00 holat qayta hisoblanadi, o'zgansa direktor ogohlantiriladi".
- **Manba:** ShVB YO'NALISH 13 §5 (`@Cron 07:00`)
- **Dalil (kod):** `company-state-snapshot.cron.ts:40` — `@Cron('0 7 * * *', { timeZone: 'Asia/Tashkent' })`, kod izohi bevosita "vizyon 05.3/#18: 07:00" deydi. `company_state_log` = **42 jonli qator**.
- **Bog'liqlik:** EP-DIR-004 (tarix yozuvi), EP-DIR-005 (alert), EP-DIR-073 (snapshot rejimi)
- **action:** CRON (op=dir.companyState.cron)
- **⤳ Ta'sir:** EP-DIR-005 (alert), EP-DIR-004 (tarix yozuvi)
- **Xoch-havolalar:** `[Module-05] Item 53` · `EXTRACTION QISM C #05.3` · `TASDIQ-2146 §05 #3`
- **⚠️ ZIDDIYAT:** QISM C (2026-06-27) "cron `@Cron('0 6 * * *')` — vaqt 06:00, 07:00 emas; `company_state_log`=0" vs jonli kod 07:00 + 42 qator. Yangi + kod-dalilli manba ustun → QISM C qatori **STALE-DOC**, cron oralig'ida to'g'rilangan.
- **Δ 2026-07-11→08-07:** — *(`company-state-snapshot.cron.ts` ga 07-11 dan beri tegilmagan)*

### EP-DIR-004 · Holat tarixini saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) Har kuni saqlanadi + grafik. ShVB prompti: company-state-log.entity {state, kpis, detectedAt, resolvedAt} + getHistory(days) + "O'tgan 30 kun mini-grafik".
- **Manba:** ShVB YO'NALISH 13 §2 (company-state-log) §3 (30 kun mini-grafik)
- **Dalil (kod):** `company-state.controller.ts:38` `getHistory()` + `:54` `getTrend()` — ikkalasi real. `company_state_log` = 42 qator, 2026-06-30 .. 2026-07-08 oralig'ida. `company-state-snapshot.cron.ts:76-79` — INSERT-only (`state_code`+`kpis`+`score_total`+`detected_at`).
- **Nima yetishmaydi:** kunlik idempotentlik kafolati amalda ushlanmayapti — `GROUP BY detected_at::date` **kuniga 7 qator** ko'rsatadi, kod izohi esa "idempotent-per-day" deydi.
- **Bog'liqlik:** EP-DIR-003 (cron), EP-DIR-020 (stat-reglament versiyasi), EP-DIR-069 (trend)
- **action:** EVENT (op=dir.companyState.log)
- **⤳ Ta'sir:** Director dashboard trend grafigi
- **Xoch-havolalar:** `[Module-05] Item 54` · `EXTRACTION QISM C #05.4` · `TASDIQ-2146 §05 #4` · `vision-1000 #5/#20`
- **⚠️ ZIDDIYAT:** QISM C "`company_state_log`=0 (bo'sh)" vs jonli 42 qator → **STALE-DOC**. Ikkinchi ziddiyat: "idempotent per day" kod izohi vs kuniga 7 qator jonli namuna → `VR-DIR-I03`.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-005 · Holat yomonlashganda ogohlantirish (alert)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Telegram + tizim ichida darhol. ShVB prompti: sendAlert(state) "holat o'zgarganda bildirishnoma" + "o'zgansa direktor ogohlantiriladi"; Telegram bot YO'NALISH 38 da mavjud.
- **Manba:** ShVB YO'NALISH 13 §2/§5 (sendAlert) · v1 Q5
- **Dalil (kod):** `director.bot.ts:25-29` — Telegram infra real va config-gated (`/kpi`, `/ai`, `/summary`). **Δ:** `7abcfa17` — FE `AlertFeed` tugmalari endi haqiqiy amallarni dispatch qiladi (avval faqat `markRead` qilardi — Q-40 soxta-javob holati edi).
- **Nima yetishmaydi:** holat **yomonlashuvi bo'yicha push-triggerli** real-vaqt alert yo'q — mavjudi faqat pull (bot buyrug'i) va kunlik digest. `vision-1000 #3` talab qilgan "3 kun ketma-ket tushish → alert" rate-of-change detektori umuman yo'q (grep `rate_of_change|consecutive` → 0).
- **Bog'liqlik:** EP-DIR-006 (kim oladi), EP-DIR-028 (digest), EP-DIR-070 (trend condition)
- **action:** EVENT (op=dir.companyState.alert)
- **⤳ Ta'sir:** NTF (bildirishnoma), CC (Telegram bot)
- **Xoch-havolalar:** `[Module-05] Item 55` · `EXTRACTION QISM C #05.5` · `TASDIQ-2146 §05 #5` · `vision-1000 #3` · `EXTRACTION QISM D #3`
- **Δ 2026-07-11→08-07:** `7abcfa17` — AlertFeed tugmalari real amal dispatch qiladi (soxta-javob yopildi); push-triggerli holat-alerti hamon yo'q.

### EP-DIR-006 · Holat alertini kim oladi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Boshliq + sababchi bo'lim rahbari (pul muammosi → moliyachi ham). Karta-model bilan: sababchi ko'rsatkich egasi (EP-DIR-074) kartasiga alert boradi.
- **Manba:** v1 Q6
- **Dalil (kod):** `stat_regulations.owner_card_id` ustuni jonli DB'da tasdiqlangan (jadval 15 ustun). Bo'lim-kesim mavjud.
- **Nima yetishmaydi:** `stat_regulations` = **0 qator** → jonli marshrutlash ma'lumoti yo'q; sababchi kartaga **avto-yuborish kodi** topilmadi (eskalatsiya-grep'lari 22/33/36 bo'yicha 0 natija).
- **Bog'liqlik:** EP-DIR-023 (egasi), EP-DIR-071 (mas'ul karta alerti), EP-DIR-074
- **action:** EVENT (op=dir.alert.route)
- **⤳ Ta'sir:** NTF, org-struktura (manager_id zanjiri), EP-DIR-074
- **Xoch-havolalar:** `[Module-05] Item 56` · `EXTRACTION QISM C #05.6` · `TASDIQ-2146 §05 #6`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-007 · Bajarish kundaligi (Dnevnik) — bo'lishi kerakmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Ha, to'liq kundalik — 5 bo'lim (holat / KPI / muammo / yechim / ertangi reja). ShVB ДНЕВНИК ВЫПОЛНЕНИЯ.docx (real 2020 yozuvlar) aynan shu 5 maydonni belgilaydi.
- **Manba:** ShVB YO'NALISH 14 (diary-entry: state, mainKpiValue, mainIssue, solution, tomorrowPlan)
- **Dalil (kod):** `diary_entries` 5 maydon jonli (`daily_state` / `main_kpi` / `main_issue` / `solution` / `tomorrow_plan` + `carry_over_issues`); `diary.service.ts:53` `created.data.daily_state` — uchidan-uchiga ulangan. FE `DirectorDiaryPage`. 2 jonli qator (id 2, 4). **Δ:** `b546a7f7` — `dir_chronic_days` ustuni + FE kengaytmasi qo'shildi.
- **Bog'liqlik:** EP-DIR-008 (kim yozadi), EP-DIR-009 (autofill), EP-DIR-010 (carry-over)
- **action:** CREATE (op=dir.diary.create)
- **⤳ Ta'sir:** ShVB jarayonlari (LOYIHA-BITGAN §A.3 execution diary)
- **Xoch-havolalar:** `[Module-05] Item 57` · `EXTRACTION QISM C #05.7` · `TASDIQ-2146 §05 #7` · `vision-1000 #6` · `EXTRACTION QISM D #6`
- **⚠️ ZIDDIYAT:** `vision-1000 #6` "to'liqsiz kundalik `to'liqsiz` **tegi** bilan saqlansin" vs QISM D dalili `diary.repository.ts:111-126` — chala yozuv `status='draft'` bilan saqlanadi, alohida "to'liqsiz" teg-ustuni yo'q. Semantik ekvivalent, lekin vizyon so'ragan filtr-teg emas.
- **Δ 2026-07-11→08-07:** `b546a7f7` — `dir_chronic_days` ustuni + `DirectorDiaryPage` surunkali-muammo ko'rinishi qo'shildi.

### EP-DIR-008 · Kundalik kim uchun — faqat boshliqmi yoki bo'lim rahbarlari ham
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Boshliq + har bo'lim rahbari o'z kundaligini yozadi (boshliq hammasini ko'radi). Karta-markaz vizyoniga mos — pastdan to'liq manzara.
- **Manba:** v1 Q8 · ShVB diary (authorId maydoni ko'p muallifni qo'llaydi)
- **Dalil (kod):** `diary.service.ts:29-31` `openDiaryForUser()` → `resolveAuthorCard(userId)` → `author_card_id` (= `org_functions.id`); jonli `diary_entries.author_card_id=1`. `directorList(from,to,cardId?)` filtrlanadi. **Δ:** `d23e650b` — `diary.service.ts:74-101` IDOR yopildi: `PATCH /diary/:id` va `POST /diary/:id/submit` endi `existing.data.author_card_id !== cardId` bo'lsa rad etadi (avval **istalgan `manager` roli boshqa kartaning xom kundalik yozuvini o'qiy va qayta yoza olardi**).
- **Bog'liqlik:** EP-DIR-007, EP-DIR-044 (RBAC/audit)
- **action:** CREATE (op=dir.diary.create)
- **⤳ Ta'sir:** Org-struktura (bo'lim rahbari = karta), RBAC
- **Xoch-havolalar:** `[Module-05] Item 58` · `EXTRACTION QISM C #05.8` · `TASDIQ-2146 §05 #8` · `vision-1000 #8` · `EXTRACTION QISM D #8`
- **⚠️ ZIDDIYAT:** `vision-1000 #8` ikkinchi yarmi — "director kundalikning FAQAT **yig'ma** holatini ko'radi (muammo/yechim EMAS), **maydon-darajali** RBAC" — hamon qurilmagan. IDOR-fix egalik tekshiruvi qo'shdi (bir karta ↔ boshqa karta), lekin director↔bo'lim-rahbari maydon-yashirish emas.
- **Δ 2026-07-11→08-07:** `d23e650b` — kundalik IDOR (egalik tekshiruvi) yopildi; `org_functions` bo'sh bo'lgani uchun bug uyquda edi, ikkinchi manager-karta paydo bo'lishi bilan faol kesishma-oqim bo'lardi.

### EP-DIR-009 · Kundalikni avtomatik to'ldirish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Holat + KPI avtomatik to'ladi (formuladan/KPI'dan), boshliq faqat muammo/yechim/reja yozadi. ShVB kundalik state+mainKpiValue tizimdan keladi.
- **Manba:** v1 Q9 · ShVB YO'NALISH 14 (dailyState, dailyMainKpi)
- **Dalil (kod):** `diary.service.ts:44` izohi "getOrCreateToday (auto-fill) → carryOverIssues" — autofill oqimi kodda bor.
- **Nima yetishmaydi:** jonli ikkala `diary_entries` qatorida `daily_state = null` — autofill amalda qiymat yozmagan. (Sabab 07-11 da `company_state_log` bo'sh deb qaralgan edi; endi 42 qator bor → **qayta sinash kerak**.)
- **Bog'liqlik:** EP-DIR-004 (holat-log), EP-DIR-007
- **action:** AI (op=dir.diary.autofill)
- **⤳ Ta'sir:** EP-DIR-001 (holat), KPI agregat
- **Xoch-havolalar:** `[Module-05] Item 59` · `EXTRACTION QISM C #05.9` · `TASDIQ-2146 §05 #9` · `vision-1000 #9`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-010 · Kundalikda hal qilinmagan muammolarni kuzatish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Ha, yechilmagan muammo "ochiq" deb keyingi kunga o'tadi. ShVB "takrorlanuvchi muammolar" oylik tahlilga mos (YO'NALISH 14 §4).
- **Manba:** v1 Q10 · ShVB YO'NALISH 14 §4 (takrorlanuvchi muammolar)
- **Dalil (kod):** `diary.repository.ts:160` `carryOverIssues()` + `getOpenIssues()` SQL real. **Δ:** `b546a7f7` — carry-over avval **faqat 1 kun** orqaga qarardi (zanjir bir sakrashdan keyin uzilardi). Endi `carryOverIssues()` kechagi `main_issue` ni avvaldan ko'chib kelganlar bilan birlashtiradi, har bandning kun-hisoblagichini qaritadi (`:185` `days`), `dir_chronic_days` ni yozadi (`:194`) va ostonadan oshganda `notifyChronicEscalation()` (`:211`) — `notifications` ga `reference_type='diary_chronic'` dedup bilan. Oston sozlanuvchi: `business_settings` `director.diary_chronic_threshold_days` (default 3).
- **Bog'liqlik:** EP-DIR-007, EP-DIR-072 (eskalatsiya zanjiri)
- **action:** UPDATE (op=dir.diary.carryOver)
- **⤳ Ta'sir:** Director dashboard ochiq-muammolar ro'yxati
- **Xoch-havolalar:** `[Module-05] Item 60` · `EXTRACTION QISM C #05.10` · `TASDIQ-2146 §05 #10` · `vision-1000 #7` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** `b546a7f7` — `vision-1000 #7` (3 kun surunkali → eskalatsiya, `dir_chronic_days`) to'liq yopildi: hisoblagich + sozlanuvchi oston + `org_functions.manager_id` zanjiri bo'ylab eskalatsiya. 07-11 da bu "Yo'q, grep `chronic` = 0" edi.

### EP-DIR-011 · Ideal kartina (Ideal Rasm) — maqsad ko'rsatkichlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) To'liq ideal kartina — foyda + daromad + filial + xodim. ShVB Идеальная картина.xlsx + seed: 100M foyda, 800M daromad, 15 filial, 500 xodim.
- **Manba:** ShVB YO'NALISH 15 §2 (ideal-targets.entity {metric, idealValue, currentValue, unit, year}) + seed
- **Dalil (kod):** `ideal-rasm.service.ts:24` `ensureSeeded()` real.
- **Nima yetishmaydi:** `ideal_rasm_targets` = **0 qator** — seed kodda bor, lekin jadvalni to'ldirmagan. ShVB seed raqamlari (100M/800M/15/500) jonli DB'ga hech qachon tushmagan.
- **Bog'liqlik:** EP-DIR-012 (gap), EP-DIR-013 (avto-actual), EP-DIR-014 (versiya)
- **action:** CREATE (op=dir.ideal.set)
- **⤳ Ta'sir:** ShVB ideal-kartina (LOYIHA-BITGAN §A.3)
- **Xoch-havolalar:** `[Module-05] Item 61` · `EXTRACTION QISM C #05.11` · `TASDIQ-2146 §05 #11`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-012 · Ideal vs haqiqat farqini (gap) ko'rsatish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) Ha, har maqsad uchun maqsad/haqiqat/farq + bajarilish foizi. ShVB: getGapAnalysis() + "Progress bar haqiqat/maqsad" + "Erishish uchun qancha qoldi".
- **Manba:** ShVB YO'NALISH 15 §2/§3 (getGapAnalysis, gapAnalysis, timeToIdeal)
- **Dalil (kod):** `ideal-rasm.service.ts:26-42` — `getWeeklyRevenue()`, `getActiveEmployeesCount()` jonli so'rovlar; `achievementPct` `target_value` asosida hisoblanadi (`:42`) — **hardcode emas, jonli hisoblanadi**, `ideal_rasm_targets` bo'sh bo'lsa ham ishlaydi. FE `IdealVsActualPanel`.
- **Bog'liqlik:** EP-DIR-011 (to'liq maqsadlar uchun seed data)
- **action:** READ (op=dir.ideal.gap)
- **⤳ Ta'sir:** IdealPicturePanel komponenti
- **Xoch-havolalar:** `[Module-05] Item 62` · `EXTRACTION QISM C #05.12` · `TASDIQ-2146 §05 #12`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-013 · Ideal kartinaning haqiqiy raqamlari qayerdan olinsin
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Avtomatik — foyda moliyadan, xodimlar soni HR dan. ShVB updateCurrent() metodi avtomatik yangilashni qo'llaydi; har doim to'g'ri.
- **Manba:** v1 Q13 · ShVB YO'NALISH 15 §2 (updateCurrent)
- **Dalil (kod):** `ideal-rasm.service.ts:26-34` — `weeklyRevenue` va `employeesCount` jonli so'raladi.
- **Nima yetishmaydi:** 5 ta "ideal" raqamdan faqat 2 tasi jonli; `:30-34` da `weekly_profit: 0`, `branches_count: 1`, `market_share: 0` **literal hardcode** — so'rov emas. Foyda uchun Moliya modulida profit-endpoint borligi tasdiqlanmagan.
- **Bog'liqlik:** FIN (foyda so'rovi), HR (xodim soni), EP-DIR-011
- **action:** CRON (op=dir.ideal.refresh)
- **⤳ Ta'sir:** FIN (foyda/daromad), HR (xodim soni), SD (filial)
- **Xoch-havolalar:** `[Module-05] Item 63` · `EXTRACTION QISM C #05.13` · `TASDIQ-2146 §05 #13`
- **⚠️ ZIDDIYAT:** 3 ta hardcode literal (`weekly_profit=0`/`branches_count=1`/`market_share=0`) **Qoida 10 (soxta javob)** ga zid — dashboardda haqiqiy raqam sifatida ko'rinadi. Bu Q-40 "yashil lekin noto'g'ri" holati. → `VR-DIR-I04`.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-014 · Ideal kartina versiyalari (yil bo'yicha)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har yil/davr uchun alohida versiya (tarix qoladi). ShVB ideal-targets.entity `year` maydoni yillik versiyani qo'llaydi.
- **Manba:** v1 Q14 · ShVB YO'NALISH 15 §2 (`year` ustuni)
- **Dalil (kod):** `ideal-rasm.service.ts:52-65` `updateTarget(key, value, horizonYears, description)` — `horizonYears` parametri bor (default 3).
- **Nima yetishmaydi:** `horizonYears` ≠ yillik arxiv-versiyalash; haqiqiy yil-bo'yicha versiya ustuni tasdiqlanmadi. Jadval 0 qator → jonli sinov imkonsiz.
- **Bog'liqlik:** EP-DIR-011 (seed data)
- **action:** CREATE (op=dir.ideal.version)
- **⤳ Ta'sir:** Yillik solishtirish, arxiv
- **Xoch-havolalar:** `[Module-05] Item 64` · `EXTRACTION QISM C #05.14` · `TASDIQ-2146 §05 #14`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-015 · Strategik reja (OKR) — maqsad va natija strukturasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) Maqsad → o'lchanadigan natijalar (klassik OKR). ShVB: strategic-goal.entity {keyResults JSONB} + "OKR formatidagi maqsadlar (Objective → Key Results)".
- **Manba:** ShVB YO'NALISH 32 §2/§3 (strategic-goal, keyResults JSONB, OKR)
- **Dalil (kod):** jadval + service + 11 route + FE real. Jonli: `okr_objectives` = **207 qator**, `okr_key_results` = **207 qator** (hujjat "ikkalasi = 0" degan edi).
- **Nima yetishmaydi:** 207 qatorning barchasida `parent_goal_id`/`department_id`/`owner_card_id` = NULL, sarlavhalar generik plasholder ("Grow", "X"), 2026-07-02..07-09 oralig'ida yaratilgan → **avtomatlashtirilgan test-artefaktlari**, real strategik maqsad emas. Funksional jihatdan xususiyat hamon ishlatilmayapti.
- **Bog'liqlik:** EP-DIR-016 (kaskad), EP-DIR-017 (taktik reja)
- **action:** CREATE (op=dir.okr.create)
- **⤳ Ta'sir:** ShVB strategik OKR (LOYIHA-BITGAN §A.3)
- **Xoch-havolalar:** `[Module-05] Item 65` · `EXTRACTION QISM C #05.15` · `TASDIQ-2146 §05 #15`
- **⚠️ ZIDDIYAT:** QISM C "ikkala jadval = 0 (bo'sh)" vs jonli 207/207 → **STALE-DOC** raqam bo'yicha; lekin mazmun bo'yicha hujjat **haq** — data soxta/test. "Bo'sh emas" ≠ "ishlatilyapti" (Q-40).
- **Δ 2026-07-11→08-07:** —

### EP-DIR-016 · OKR qaysi darajalarda bo'lsin
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Kompaniya → bo'lim → karta (lavozim) — "oltin ip". Karta-markaz vizyoni (har lavozim katta maqsadga hissa qo'shadi) bilan to'liq mos.
- **Manba:** v1 Q16 · karta-model vizyoni
- **Dalil (kod):** `getCascade` + `okr_objectives.parent_goal_id`/`department_id`/`owner_card_id` ustunlari sxemada real.
- **Nima yetishmaydi:** `count(*) FILTER (WHERE parent_goal_id IS NOT NULL)` → **has_parent=0, has_dept=0, has_owner=0** (207 qatordan). Kaskad ustunlari 100% to'ldirilmagan → oltin-ip sxema-tayyor, funksional isbotlanmagan.
- **Bog'liqlik:** EP-DIR-015 (real OKR data), ORG (karta)
- **action:** CREATE (op=dir.okr.cascade)
- **⤳ Ta'sir:** ORG/KARTALAR (karta OKR), bo'lim OKR
- **Xoch-havolalar:** `[Module-05] Item 66` · `EXTRACTION QISM C #05.16` · `TASDIQ-2146 §05 #16` · `vision-1000 #10` · `EXTRACTION QISM D` *(#10 → MASTER-STATUS-BOARD `817fa27c`)*
- **⚠️ ZIDDIYAT:** `vision-1000 #10` "kaskad uzilsa alert + director **qo'lda** qayta ulaydi (avto YO'Q, E1)" — `817fa27c` 99 orfan `okr_key_results` ni `notes ILIKE '%NEEDS_REVIEW%'` bilan belgilagan (jonli 99/207 tasdiqlangan), lekin **qo'lda qayta-ulash UI/endpoint** topilmadi. Ya'ni "inson qaror qiladi" printsipi uchun insonda vosita yo'q. → `VR-DIR-I05`.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-017 · Taktik reja — strategiyadan oylik rejaga o'tish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, strategiya → oylik taktik vazifalar. ShVB: monthly-plan.entity {objectives JSONB} + "oylik maqsadlar strategik maqsaddan keladi".
- **Manba:** ShVB YO'NALISH 33 §2/§4 (monthly-plan, taktik reja)
- **Dalil (kod):** `monthly_plans` ustunlari sxemada tasdiqlangan: `strategic_goal_id, month, objectives, weekly_tasks, completion_pct` — talab shakliga to'liq mos. Service + controller + FE real.
- **Nima yetishmaydi:** `monthly_plans` = **0 qator** — jonli data yo'q, strategiya→oylik zanjir hech qachon ishlatilmagan.
- **Bog'liqlik:** EP-DIR-015/016 (yuqori oqim OKR data)
- **action:** CREATE (op=dir.tactical.create)
- **⤳ Ta'sir:** EP-DIR-015 (strategik OKR), oylik reja
- **Xoch-havolalar:** `[Module-05] Item 67` · `EXTRACTION QISM C #05.17` · `TASDIQ-2146 §05 #17`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-018 · Oylikdan haftalikga dekompozitsiya
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, oylik → haftalik bo'lib beriladi. ShVB: monthly-plan {weeklyTasks JSONB} + "4 hafta → har hafta uchun asosiy vazifalar + hafta oxirida % bajarilish".
- **Manba:** ShVB YO'NALISH 33 §2/§3 (weeklyBreakdown, weeklyTasks)
- **Dalil (kod):** `monthly_plans.weekly_tasks` (JSONB) + `completion_pct` ustunlari jonli DB'da tasdiqlangan.
- **Nima yetishmaydi:** 0 qator → haftalik-bo'lish xatti-harakati tekshirilmagan. `vision-1000 #11` talab qilgan **`weekly_breakdowns` jadval yo'q** (`to_regclass` → null); ishchi-kunlarga mutanosib bo'lish va "% ni karta egasi kiritadi" logikasi qurilmagan.
- **Bog'liqlik:** EP-DIR-017 (`monthly_plans`), EP-DIR-019 (karta egasi)
- **action:** CREATE (op=dir.tactical.weekly)
- **⤳ Ta'sir:** HR haftalik reja, EP-DIR-066 (haftalik trend)
- **Xoch-havolalar:** `[Module-05] Item 68` · `EXTRACTION QISM C #05.18` · `TASDIQ-2146 §05 #18` · `vision-1000 #11` · `[Module-05] Item 11`
- **⚠️ ZIDDIYAT:** ikki sxema-yondashuv ochiq — alohida `weekly_breakdowns` jadval (vizyon-1000 #11) vs mavjud `monthly_plans.weekly_tasks` JSONB. Qaysi biri tanlanishi **egasi/arxitektura qarori** (Q-35). → `VR-DIR-I06`.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-019 · Taktik vazifa kim bilan bog'lansin
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Har vazifa kartaga (lavozimga) biriktiriladi — bajaruvchi va kuzatuv aniq. Karta-markaz vizyoniga mos (taskOwner = karta).
- **Manba:** v1 Q19 · ShVB YO'NALISH 33 §1 (taskOwner) · karta-model
- **Dalil (kod):** `strategic_tasks` da `owner_card_id` va `assigned_user_id` ustunlari jonli DB'da tasdiqlangan.
- **Nima yetishmaydi:** `strategic_tasks` = **0 qator** → karta-biriktirish xatti-harakati jonli isbotlanmagan. `vision-1000 #12` (vakant kartaga vazifa → yuqori kartaga eskalatsiya, band bo'lsa pending) umuman qurilmagan (grep 0).
- **Bog'liqlik:** EP-DIR-017, ORG (karta vakantlik holati)
- **action:** UPDATE (op=dir.tactical.assign)
- **⤳ Ta'sir:** ORG/KARTALAR, Kanban (vazifa)
- **Xoch-havolalar:** `[Module-05] Item 69` · `EXTRACTION QISM C #05.19` · `TASDIQ-2146 §05 #19` · `vision-1000 #12` · `EXTRACTION QISM D #12`
- **⚠️ ZIDDIYAT:** QISM C hujjati ustun nomini `assignee_id` deb keltiradi; jonli sxemada `assigned_user_id`. Hujjat nomlashi noaniq → registrda jonli nom kanonik.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-020 · Statistika reglamenti (Stat-reglament) — bo'lishi kerakmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) Ha, to'liq stat-reglament — har ko'rsatkich uchun ta'rif/formula/birlik/chastota/egasi. ShVB "Регламент по статистикам.docx" → stat-regulation.entity aynan shu maydonlar.
- **Manba:** ShVB YO'NALISH 23 §2 (stat-regulation.entity {definition, formula, unit, frequency, source, ownerId, targetValue})
- **Dalil (kod):** `stat_regulations` — **15 ustun** jonli: `definition, formula, unit, frequency, owner_card_id, version` + `name_uz, name_ru, source_module, target_value, valid_from, is_active` — ShVB talabiga **AYNAN** mos.
- **Bog'liqlik:** EP-DIR-021/022/023 (chastota/versiya/egasi), EP-DIR-080 (targetValue)
- **action:** CREATE (op=dir.statReg.create)
- **⤳ Ta'sir:** ShVB GSD/ЦКП (LOYIHA-BITGAN §A.3), barcha modul KPI ta'rifi
- **Xoch-havolalar:** `[Module-05] Item 70` · `EXTRACTION QISM C #05.20` · `TASDIQ-2146 §05 #20` · `vision-1000 #13/#14` · `[Module-05] Item 13/14`
- **⚠️ ZIDDIYAT:** `vision-1000 #13/#14` (QISM A) "**Yo'q** — SB0372/SB0387 STILL-OPEN, `stat_reglament` jadval yo'q, `to_regclass=null`" vs jonli `stat_regulations` 15 ustun bilan mavjud. Yangi + kod-dalilli manba ustun → QISM A ikkala qatori **STALE-DOC**; jadval bor, faqat **0 qator** (data yo'q).
- **Δ 2026-07-11→08-07:** —

### EP-DIR-021 · Stat-reglamentda chastota (qanchalik tez o'lchanadi)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Har ko'rsatkichga alohida chastota (kunlik/haftalik/oylik) — moslashuvchan. ShVB stat-regulation `frequency` maydoni har ko'rsatkichga alohida.
- **Manba:** v1 Q21 · ShVB YO'NALISH 23 §2 (`frequency`)
- **Dalil (kod):** `stat_regulations.frequency` ustuni jonli sxemada tasdiqlangan.
- **Nima yetishmaydi:** jadval **0 qator** → chastota haqiqatan ko'rsatkichdan ko'rsatkichga farq qilishini tekshirib bo'lmaydi; chastotaga bog'langan cron-jadval ham yo'q.
- **Bog'liqlik:** EP-DIR-020 (jadval to'ldirilishi)
- **action:** UPDATE (op=dir.statReg.freq)
- **⤳ Ta'sir:** Cron jadvali (qachon yangilanadi)
- **Xoch-havolalar:** `[Module-05] Item 71` · `EXTRACTION QISM C #05.21` · `TASDIQ-2146 §05 #21`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-022 · Stat-reglament versiyalari
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har o'zgarish yangi versiya + amal qilish sanasi (eski hisobot to'g'ri qoladi). ShVB: "CRUD + versioning (o'zgarish tarixi saqlanadi)", `version` maydoni.
- **Manba:** v1 Q22 · ShVB YO'NALISH 23 §2 (versioning, `version`)
- **Dalil (kod):** `stat_regulations.version` + `valid_from` ustunlari jonli sxemada tasdiqlangan.
- **Nima yetishmaydi:** 0 qator; `getHistory()` metodi mustaqil tekshirilmagan (hujjat bor deydi). `vision-1000 #13` talab qilgan **`formula_version` kanonik ustuni** aynan shu nom bilan yo'q — `version` bor, lekin tarixiy hisobotni eski formula versiyasi bilan qayta o'qish mexanizmi qurilmagan.
- **Bog'liqlik:** EP-DIR-020
- **action:** UPDATE (op=dir.statReg.version)
- **⤳ Ta'sir:** Hisobot izchilligi, audit
- **Xoch-havolalar:** `[Module-05] Item 72` · `EXTRACTION QISM C #05.22` · `TASDIQ-2146 §05 #22` · `vision-1000 #13`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-023 · Stat-reglament ko'rsatkichlarining egasi (mas'uli)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Har ko'rsatkich kartaga (lavozimga) biriktiriladi — odam ketsa ham egasi qoladi. Karta-model. ShVB `ownerId` → kartaga ko'chiriladi.
- **Manba:** v1 Q23 · ShVB YO'NALISH 23 §2 (`ownerId`) · karta-model
- **Dalil (kod):** `stat_regulations.owner_card_id` ustuni jonli sxemada tasdiqlangan (log bilan).
- **Nima yetishmaydi:** 0 qator → real karta-bog'lash yo'q. `vision-1000 #14` talab qilgan **egasi almashganda oniy o'tish + eski tarix ko'rinishi + handoff hujjati** topilmadi (grep `handoff` → 0).
- **Bog'liqlik:** EP-DIR-020, EP-DIR-071 (mas'ul karta alerti), ORG (karta)
- **action:** UPDATE (op=dir.statReg.owner)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-074 (mas'ul lavozim)
- **Xoch-havolalar:** `[Module-05] Item 73` · `EXTRACTION QISM C #05.23` · `TASDIQ-2146 §05 #23` · `vision-1000 #14` · `[Module-05] Item 14`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-024 · Holat formulasi karta-model bilan bog'lansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, holat kartalardan yig'iladi — "qaysi lavozim sabab" darrov ochiladi (oltin ip). Karta-markaz asosiy vizyon (LOYIHA-BITGAN §C: ORG poydevor).
- **Manba:** v1 Q24 · karta-model vizyoni
- **Dalil (kod):** `company-state.repository.ts:131` `getRawMetrics()` — **jadval-darajali agregat** so'rov (`sales_invoices`/`employees`/`sessions` uslubidagi jadvallardan to'g'ridan), `org_functions` karta-model ma'lumotidan **umuman yig'ilmaydi** (kod izohi `:221` "Mirrors getRawMetrics()'s CTE + COALESCE-guard pattern").
- **Nima yetishmaydi:** butun karta→holat zanjiri. Qurish uchun `getRawMetrics()` ni `org_functions` karta-darajali KPI hissalaridan yig'adigan qilib qayta yozish kerak — bu esa **karta-darajali KPI atributsiyasi** mavjudligini talab qiladi (yo'q).
- **Bog'liqlik:** ⭐ **Boshliq band** — EP-DIR-001, EP-DIR-032 (ЦКП→formula), EP-DIR-079 (karta-AI agregat), EP-DIR-074 (root-cause) hammasi shunga tayanadi. Loyiha xotirasi: "card-gates OFF" — modullararo poydevor bo'shliq.
- **action:** CRON (op=dir.companyState.fromCards)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-001 (holat formulasi), EP-DIR-083 (karta-AI agregat)
- **Xoch-havolalar:** `[Module-05] Item 74` · `EXTRACTION QISM C #05.24` · `TASDIQ-2146 §05 #24` · `vision-1000 #15/#30` · `EXTRACTION QISM D #30`
- **⚠️ ZIDDIYAT:** egasi-qarori kerak — `org_functions` ning qaysi maydonlari 5 holat-metrikasiga (cash/prod/orders/hr/qual) xaritalanishi hech qayerda belgilanmagan. Bu **arxitektura qarori** (Q-34), fabrikatsiya qilinmaydi. Ikkinchidan `vision-1000 #30` (ko'p-karta xodim ulush-cap) QISM D da "**Yo'q**, grep `EP-ORG-066` = 0" deyilgan, lekin `[Module-05] Item 30` jonli tekshiruvi `card.repository.ts:293` `employeeActiveStakeSum()` + `org-mutations.repo.ts:300` "ulush-cap guard (EP-ORG-066/142)" ni topgan → QISM D qatori **STALE-DOC**, ulush-cap **qurilgan**.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-025 · Director dashboard — boshliq ekranida nima ko'rinadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Holat + ideal kartina farqi + bugungi muammolar + alertlar bir ekranda (to'liq qo'mondonlik markazi). Q123: "hammasini va to'liq ko'rinsin, har modul bo'yicha asosiy ko'rsatkichlar".
- **Manba:** **Q123** (egasi javobi) · ShVB DirectorDashboard.tsx (CompanyStateWidget + IdealPicturePanel + StrategicTasksPanel)
- **Dalil (kod):** `dashboard.controller.ts:53-77` `getDashboard()` — `Promise.all` bilan `directorData.getDashboard()` + `getPlanFact()` + `getOrderProgress()` + `getStatTrends()` + `getOpenIssues()`, `@Roles(Role.SUPER_ADMIN, Role.DIRECTOR)` bilan gated. FE `DirectorDashboard`. **Δ:** `:59,65,80` endi `getCardAiAggregate()` ham `Promise.all` ichida va `aiInsights` ga uzatiladi (`a3a641a9`); `OwnerSummaryCard` (`f1caa337`) va `CardAiInsightsCard` (+ `SendKanbanTaskDialog`, `91eaaa5b`) FE'ga ulandi.
- **Bog'liqlik:** EP-DIR-026 (AI), EP-DIR-036/053/062 (plan-fact), EP-DIR-069 (trend), EP-DIR-073 (rejim)
- **action:** READ (op=dir.dashboard.view)
- **⤳ Ta'sir:** Barcha modul KPI (oltin ip agregati)
- **Xoch-havolalar:** `[Module-05] Item 75` · `EXTRACTION QISM C #05.25` · `TASDIQ-2146 §05 #25`
- **Δ 2026-07-11→08-07:** `a3a641a9` + `f1caa337` + `91eaaa5b` + `a66e840d` — dashboard 3 yangi jonli panel oldi (karta-AI agregati, egasi-digesti, Kanban-ga vazifa yuborish) va plan-fact JOIN kanonik jadvalga to'g'rilandi.

### EP-DIR-026 · Strategik AI tahlilchi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, AI har kuni qisqa tahlil + 1-2 tavsiya. ShVB director-ai.service: analyzeCompanyState() "holat formulasi asosida sabablar + tavsiyalar" + generateWeeklyBriefing().
- **Manba:** v1 Q26 · ShVB YO'NALISH (director-ai.service) · LOYIHA-BITGAN §A.6 (70% tahlil+AI)
- **Dalil (kod):** `director-ai.service.ts` — `explainKpi()` (`:39`), `assessRisks()` (`:102`), `generateExecutiveSummary()` (`:162`) real va chaqiriladigan. **Δ:** `dashboard.controller.ts:80` endi `aiInsights: Array.isArray(cardAiAggregate) ? cardAiAggregate : []` — avvalgi hardcode `[]` + "P35/P36 ga deferred" izohi olib tashlandi (`a3a641a9`).
- **Nima yetishmaydi:** `aiInsights` endi **torroq** vazifani bajaradi (`:78` kod izohi: "item #104/#129 — qaysi karta erishmayapti"), EP-DIR-026 ning to'liq qamrovi emas: kunlik avtomatik "sabab + 1-2 tavsiya" matn-tahlili va `generateWeeklyBriefing()` ning kunlik cron-ga ulanishi hamon yo'q. `vision-1000 #17` (director "bajaramiz/inkor" belgilaydi, bajarilmagan tavsiya og'irlashadi) qurilmagan.
- **Bog'liqlik:** EP-DIR-079 (karta-AI agregat), EP-DIR-024, AI integratsiya
- **action:** AI (op=dir.ai.analyze)
- **⤳ Ta'sir:** AI integratsiya, markaziy-AI
- **Xoch-havolalar:** `[Module-05] Item 76` · `EXTRACTION QISM C #05.26` · `TASDIQ-2146 §05 #26` · `vision-1000 #17` · `[Module-05] Item 17`
- **Δ 2026-07-11→08-07:** `a3a641a9` — `aiInsights: []` hardcode (Qoida 10 buzilishi) yopildi, o'rniga real `getCardAiAggregate()` agregati keladi.

### EP-DIR-027 · Holat va kundalik Telegram bot orqali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, /holat /kundalik /ideal_rasm buyruqlari + kunlik digest. ShVB Telegram bot YO'NALISH 38: `/company_state` buyrug'i va kunlik xulosa mavjud.
- **Manba:** v1 Q27 · ShVB YO'NALISH 38 (`/company_state`, har kun 18:00)
- **Dalil (kod):** `director.bot.ts:25-29` — faqat `/kpi`, `/ai`, `/summary` ro'yxatdan o'tgan; yordam matni (`:29`) aynan shu uchtasini sanaydi. `/holat`, `/kundalik`, `/ideal_rasm` **yo'q**.
- **Nima yetishmaydi:** uchala buyruq handleri. Barcha orqa-xizmatlar allaqachon real (`company-state.controller.ts` `getHistory()`, `diary.service.ts`, `ideal-rasm.service.ts`) — sof wiring ishi, hech narsa bloklamaydi.
- **Bog'liqlik:** yo'q (uchala xizmat tayyor)
- **action:** READ (op=dir.telegram.cmd)
- **⤳ Ta'sir:** CC (Telegram bot), NTF
- **Xoch-havolalar:** `[Module-05] Item 77` · `EXTRACTION QISM C #05.27` · `TASDIQ-2146 §05 #27` · `vision-1000 #18` · `[Module-05] Item 18`
- **⚠️ ZIDDIYAT:** `vision-1000 #18` "`/holat` 07:00 cron'dan **OXIRGI saqlanganini** qaytaradi (real-time trigger emas)" — bu muhim spetsifikatsiya; buyruq qo'shilganda `company_state_log` dan o'qilishi shart, jonli qayta-hisoblash emas.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-028 · Kunlik boshliq digesti (ertalabki xulosa)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Ha, har ertalab avtomatik digest (Telegram + tizim). LOYIHA-BITGAN §A.4 "avto kunlik hisobot" + ShVB "Har kun 18:00 kompaniya holati direktorga".
- **Manba:** v1 Q28 · ShVB YO'NALISH 38 (kunlik holat) · LOYIHA-BITGAN §A.4
- **Dalil (kod):** `owner-summary-daily.cron.ts:32` — `@Cron('0 8 * * *')` kunlik digest croni jonli. `GET /director/owner-summary` + `POST /director/owner-summary/send` to'liq qurilgan (holat + 5 real SD/CRM raqami, Telegram digest, config-gated graceful send). Ikkinchi cron `company-state-snapshot.cron.ts:40` `@Cron('0 7 * * *')` holat-snapshotini yozadi. **Δ:** `f1caa337` — `OwnerSummaryCard.tsx` FE ga ulandi (avval endpointning **hech qanday FE iste'molchisi yo'q edi** — faqat cron ichidan yoki qo'lda curl bilan).
- **Bog'liqlik:** EP-DIR-003 (07:00 snapshot), EP-DIR-005 (alert), EP-DIR-027 (bot)
- **action:** CRON (op=dir.digest.morning)
- **⤳ Ta'sir:** NTF, CC, EP-DIR-005 (alert)
- **Xoch-havolalar:** `[Module-05] Item 78` · `EXTRACTION QISM C #05.28` · `TASDIQ-2146 §05 #28` · `vision-1000 #19` · `[Module-05] Item 19`
- **⚠️ ZIDDIYAT:** QISM C "avto-cron ertalabki trigger **yo'q** (GET compute-only)" vs jonli ikkita cron (07:00 snapshot + 08:00 digest) → **STALE-DOC** yopildi. Qolgan ochiq nuqta: `vision-1000 #19` "digest va alert **ALOHIDA** xabar (birlashmaydi), avval digest keyin alert" — bu tartib-kafolati kodda tasdiqlanmagan.
- **Δ 2026-07-11→08-07:** `f1caa337` — owner-summary kunlik digest FE'ga ulandi (holat badge + 5 raqam + qo'lda "hozir yubor" tugmasi); 08:00 cron jonli tasdiqlandi → band `STALE-DOC` dan **Ha** ga ko'chdi.

### EP-DIR-029 · Holat darajalari ro'yxatini sozlash (master-data)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) 5 daraja + rang (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) — ShVB modeliga mos. ShVB enum 4 (NORMAL/RISK/CRITICAL/GROWTH) — egasi 5-darajali (EHTIYOT qo'shimcha) variantga moyil; tasdiq kutiladi.
- **Manba:** v1 Q29 · ShVB YO'NALISH 13 §2 (CompanyState enum) §3 (🟢/🟡/🟠/🔴 rang)
- **Dalil (kod):** `SELECT code, color_hex FROM company_state_levels ORDER BY id` → aynan **5 qator**: OSISH (#10B981), NORMAL (#3B82F6), EHTIYOT (#F59E0B), XAVF (#F97316), INQIROZ (#EF4444). `HOLAT_LEVELS` konstantasi.
- **Bog'liqlik:** EP-DIR-001 (holat), EP-DIR-070 (trend condition)
- **action:** UPDATE (op=dir.stateLevel.config)
- **⤳ Ta'sir:** master-data, CompanyStateWidget rang
- **Xoch-havolalar:** `[Module-05] Item 79` · `EXTRACTION QISM C #05.29` · `TASDIQ-2146 §05 #29` · `vision-1000 #20`
- **⚠️ ZIDDIYAT:** ShVB prompti **4 darajali** enum belgilaydi, qaror A-default **5 darajani** taklif qiladi — kod 5 bilan qurilgan, ya'ni **qaror ochiq bo'lgani holda ijro allaqachon bir tomonni tanlagan**. Egasi 4 ni tanlasa regressiya bo'ladi. Bu modulning "kod bor, qaror yo'q" naqshining eng aniq misoli.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-030 · Strategiya yutuqlarini umumiy ko'rsatish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, yetilgan maqsadlar "bajarildi" deb belgilanadi + tarix saqlanadi (motivatsiya + tarix). ShVB milestone.entity {completedAt} bajarilgan bosqichni saqlaydi.
- **Manba:** v1 Q30 · ShVB YO'NALISH 32 §2 (milestone.completedAt)
- **Dalil (kod):** `strategic.repository.ts:139-155` `createMilestone()` + status-update SQL real; `strategic_milestones` = **4 jonli qator**. **Δ:** `f938bad5` — `approval-request.aggregate.ts:35-37` umumiy HITL tasdiqlash uchun SoD qo'riqchisi qo'shildi (`userId === this.requestedBy` → rad); avval **director so'rov yaratib o'zi tasdiqlay olardi**.
- **Nima yetishmaydi:** `vision-1000 #42` uchta talabidan ikkitasi yo'q — milestone "bajarildi" ga **maxsus RBAC gate** (`strategic.controller.ts:195` da rol cheklovi topilmadi) va **undo** mexanizmi (grep `undo` → 0). Uchinchisi (audit) `AuditInterceptor` orqali qoplanadi.
- **Bog'liqlik:** EP-DIR-015 (OKR), EP-DIR-018 (haftalik dekompozitsiya, SB0377)
- **action:** UPDATE (op=dir.milestone.complete)
- **⤳ Ta'sir:** OKR (EP-DIR-015), motivatsiya/nishonlash
- **Xoch-havolalar:** `[Module-05] Item 80` · `EXTRACTION QISM C #05.30` · `TASDIQ-2146 §05 #30` · `vision-1000 #42` · `[Module-05] Item 42` · `EXTRACTION QISM D #42`
- **Δ 2026-07-11→08-07:** `f938bad5` — umumiy HITL o'z-o'zini-tasdiqlash SoD teshigi yopildi (milestone-maxsus RBAC emas, lekin bir xil sinf muammosi).

---

## I QISM (davomi) — v2 kitob-grounded bandlar (EP-DIR-031..085)

### EP-DIR-031 · Har lavozim "Лавозим мақсади" maydonini ERP saqlaydimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har kartada majburiy `position_purpose` matn maydoni — yo'riqnomadan ko'chiriladi. Karta-markaz vizyoniga to'liq mos.
- **Manba:** v2 Q1 (RD5 Лавозим йўриқномаси)
- **Dalil (kod):** `org_functions.function_description` ustuni mavjud (≈ "lavozim maqsadi" semantikasi), lekin **alohida `position_purpose` ustuni yo'q**. Jonli: `total=97, desc_filled=0` — 97 kartaning **hech birida** to'ldirilmagan.
- **Nima yetishmaydi:** nom bo'yicha kanonik `position_purpose` ustuni; va butun master-data (97 karta uchun matn) — bu **egasi-DATA**, koddan chiqarib bo'lmaydi.
- **Bog'liqlik:** ORG/KARTALAR, EP-DIR-050 (yo'riqnoma versiyasi)
- **action:** CREATE (op=dir.card.purpose)
- **⤳ Ta'sir:** ORG/KARTALAR, AI baholash (xodim↔karta mosligi), EP-DIR-001 (holat)
- **Xoch-havolalar:** `[Module-05] Item 81` · `EXTRACTION QISM C #05.31` · `TASDIQ-2146 §05 #31`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-032 · ЦКП (Лавозимнинг ЦКП си) har kartaning asosiy chiqishimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har kartada `ckp` maydoni + holat formulasi ЦКП bajarilishiga bog'lanadi. ShVB GSD/ЦКП (LOYIHA-BITGAN §A.3) bilan mos.
- **Manba:** v2 Q2
- **Dalil (kod):** `org_functions` da `tskp`, `tskp_target`, `tskp_ru`, `tskp_measurement_unit` — **to'rttasi ham jonli**. To'ldirilgan: **19/97** karta.
- **Nima yetishmaydi:** talabning **ikkinchi yarmi** — ЦКП qiymatining holat formulasiga bog'lanishi umuman yo'q (EP-DIR-024 ning natijasi: `getRawMetrics` `org_functions` ni o'qimaydi). 78/97 karta ЦКП siz.
- **Bog'liqlik:** ⭐ EP-DIR-024 (karta-markaz holat formulasi) — bog'lanish yarmi shunga bog'liq
- **action:** CREATE (op=dir.card.ckp)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-001 (holat formulasi)
- **Xoch-havolalar:** `[Module-05] Item 82` · `EXTRACTION QISM C #05.32` · `TASDIQ-2146 §05 #32`
- **⚠️ ZIDDIYAT:** QISM C hujjati ustunni `tskp_unit` deb qisqartiradi; jonli nom `tskp_measurement_unit`. Registrda jonli nom kanonik.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-033 · Yo'riqnomadagi "1-4 продукт" bo'sh maydonlari nima
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada 1-4 produkt + har biriga statistika ko'rsatkichi (ЦКП ni 4 o'lchovga bo'lish). Sub-savol (produkt soni): A) moslashuvchan 2-4 (lavozimga qarab).
- **Manba:** v2 Q3
- **Dalil (kod):** `org_functions` to'liq ustun ro'yxati tekshirildi — `product_1..product_4` **hech biri yo'q**.
- **Nima yetishmaydi:** 4 ta nullable matn ustuni (kod-quriladigan), **va** 97 karta uchun haqiqiy produkt ma'lumoti — **egasi-DATA**, fabrikatsiya qilinmaydi.
- **Bog'liqlik:** EP-DIR-032 (ЦКП ni bo'lish), EP-DIR-071 (har produkt → stat ko'rsatkich)
- **action:** CREATE (op=dir.card.products)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-074 (har produkt → stat ko'rsatkich)
- **Xoch-havolalar:** `[Module-05] Item 83` · `EXTRACTION QISM C #05.33` · `TASDIQ-2146 §05 #33`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-034 · Оргсхема joylashuvi "5-Департамент, 13-бўлим, Секция" formatida saqlansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, `department_no` + `unit_no` + `section_name` 3 maydon — hujjat formatiga aynan mos. Vysotskiy-7 daraxti bilan ulanadi.
- **Manba:** v2 Q4
- **Dalil (kod):** `org_functions` da `department_no`, `unit_no`, `section_name` **uchalasi ham yo'q**; faqat `department_id` (FK) + `sub_department_name` mavjud.
- **Nima yetishmaydi:** 3 ustun (yoki `department_id` FK zanjiridan Vysotskiy-7 raqamli kodini hisoblaydigan derived view). **Egasi-gated:** aniq 5-Departament / 13-bo'lim raqamlash sxemasi tasdiqlanishi kerak.
- **Bog'liqlik:** ORG (`org_departments` ierarxiyasi), EP-DIR-035 (drill-down shunga tayanadi)
- **action:** CREATE (op=dir.card.orgLocation)
- **⤳ Ta'sir:** Org-struktura (Vysotskiy-7), vertikal manager_id zanjiri
- **Xoch-havolalar:** `[Module-05] Item 84` · `EXTRACTION QISM C #05.34` · `TASDIQ-2146 §05 #34`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-035 · 5-Департамент ichida 5 ta bo'lim drill-down
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, 5-departament alohida drill-down: 5 bo'lim (sifat/reja/dizayn/konstruktor/...) har biri o'z holati bilan. Owner uni eng murakkab zona deb belgilagan.
- **Manba:** v2 Q5
- **Dalil (kod):** `dashboard.controller.ts` endpoint ro'yxati (`plan-fact`, `order-progress`, `stat-trends`, `open-issues`, `kpis`, `production-summary`, `finance-summary`, `hr-summary`) — **5-departamentga maxsus route yo'q**; `getPlanFact()`/`getOrderProgress()` umumiy departament-JOIN so'rovlari.
- **Nima yetishmaydi:** departament-scope'li drill-down endpoint. EP-DIR-034 raqamlash sxemasi hal bo'lmaguncha "5-Departament" ni bir ma'noli aniqlab bo'lmaydi.
- **Bog'liqlik:** ⭐ EP-DIR-034 (raqamlash sxemasi) — to'g'ridan bog'liq
- **action:** READ (op=dir.dept5.drilldown)
- **⤳ Ta'sir:** Director dashboard, org-struktura
- **Xoch-havolalar:** `[Module-05] Item 85` · `EXTRACTION QISM C #05.35` · `TASDIQ-2146 §05 #35`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-036 · "режа бажарилиш даражаси (%)" — director uchun bosh KPI
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, "Reja bajarilish %" fabrika bo'ylab agregat + har bo'lim breakdown. Yo'riqnomadagi yagona umumiy metrika.
- **Manba:** v2 Q6
- **Dalil (kod):** `dashboard.controller.ts:80` `@Get('plan-fact')` real; bo'lim-kesim SQL. `production_orders` = **7 qator** (hujjat "0" degan edi). **Δ:** `a66e840d` — `dashboard-query.repository.ts` `getPlanFact()`/`getOrderProgress()` avval eskirgan `departments` jadvaliga `production_orders.org_department_id` orqali JOIN qilardi, lekin bu ustun `org_departments(id)` ga FK qiladi → **JOIN hech qachon mos kelmasdi**. Endi kanonik `org_departments` ga JOIN qiladi.
- **Nima yetishmaydi:** `production_orders` 7 qator — real "reja bajarilish %" uchun juda siyrak. `vision-1000 #24` talab qilgan **PP oy-boshidan kesimi kanonik / MES kunlik faktni oylik kvotaga tenglashtirish** normalizatsiyasi yo'q (grep `EP-DIR-036` → 0). `vision-1000 #48` (faqat tugagan ishlar "fakt", in-progress alohida ustun) ham qurilmagan.
- **Bog'liqlik:** PP/MES ikki-olam kelishuvi (loyiha xotirasidagi ochiq masala), EP-DIR-053
- **action:** READ (op=dir.kpi.planFulfill)
- **⤳ Ta'sir:** PP (reja), MES (fakt), EP-DIR-001 (holat formulasi markaziy raqami)
- **Xoch-havolalar:** `[Module-05] Item 86` · `EXTRACTION QISM C #05.36` · `TASDIQ-2146 §05 #36` · `vision-1000 #24/#48` · `[Module-05] Item 24/48`
- **⚠️ ZIDDIYAT:** egasi-qarori kerak — "oy boshidan kesim" uchun qaysi jadval kanonik: PP `production_orders` yoki MES `mes_production_sessions`? Ikkalasi mustaqil yashaydi (ikki-olam).
- **Δ 2026-07-11→08-07:** `a66e840d` — plan-fact/order-progress JOIN buzuq edi (hech qachon mos kelmasdi), kanonik `org_departments` ga to'g'rilandi. Ya'ni 07-11 dagi "SQL real" bahosi optimistik edi — so'rov **jimgina bo'sh** qaytarardi.

### EP-DIR-037 · "Кечикишлар сони" va "режадан оғиш ҳолатлари сони" — alohida hisoblansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, 2 alohida counter: `delay_count` + `plan_deviation_count` har bo'lim uchun (sabab/oqibat ajratiladi). Sub-savol: A) majburiy sabab kategoriyasi (material/transport/operator).
- **Manba:** v2 Q7
- **Dalil (kod):** `grep -rln "delay_count|plan_deviation_count"` butun `apps/api/src` bo'yicha → **0 natija**.
- **Nima yetishmaydi:** ikkala hisoblagich (`production_orders` reja-vs-fakt sanalaridan chiqariladi) + sabab-kategoriya breakdown. **Egasi-gated:** sabab-kategoriya taksonomiyasi belgilanmagan.
- **Bog'liqlik:** EP-DIR-036 (plan-fact data), EP-DIR-074 (root-cause shunga tayanadi)
- **action:** EVENT (op=dir.deviation.count)
- **⤳ Ta'sir:** PP, MES, EP-DIR-077 (root-cause drill)
- **Xoch-havolalar:** `[Module-05] Item 87` · `EXTRACTION QISM C #05.37` · `TASDIQ-2146 §05 #37`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-038 · "Бекор туриш" (downtime) — director kuzatsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, "Bekor turish (downtime)" director dashboardda soat + sabab bo'yicha. Fabrikaning eng katta yo'qotish manbai (glossariy rasmiy atama).
- **Manba:** v2 Q8
- **Dalil (kod):** `downtime_logs` (0 qator) va `downtime_events` (2 qator) jadvallari mavjud. MES tomonida agregat real: `get-downtime-summary.handler.ts` + `drizzle-downtime.repo.ts` `getDowntimeSummary`; `downtime-event.aggregate.ts:32` sabab-kategoriyalari (breakdown) bor. `record-downtime.handler.ts:38` sababni **majburiy** qiladi.
- **Nima yetishmaydi:** director-tomonidagi widget/ulanish yo'q. `vision-1000 #23` "director **taniqladim, chora ko'rilmoqda**" bayrog'i yo'q (grep `acknowledg|taniqla` → 0). `vision-1000 #22` (sabab ko'rsatilmasa 2 soat→eslatma, 4 soat→director+HR eskalatsiya) yo'q — majburiy-sabab ≠ timeout eskalatsiya.
- **Bog'liqlik:** MES (downtime), EP-DIR-081 (paddon yetishmovchiligi → downtime)
- **action:** READ (op=dir.downtime.view)
- **⤳ Ta'sir:** MES (downtime), EP-DIR-064 (paddon yetishmovchiligi → downtime)
- **Xoch-havolalar:** `[Module-05] Item 88` · `EXTRACTION QISM C #05.38` · `TASDIQ-2146 §05 #38` · `vision-1000 #22/#23` · `EXTRACTION QISM D #22/#23`
- **⚠️ ZIDDIYAT:** QISM C "downtime_logs/**events/reasons** jadval bor" vs jonli `to_regclass('public.downtime_reasons')` → **null** (jadval umuman yo'q). Uchtadan ikkitasi bor, uchinchisi hujjat da'vosi — **noto'g'ri**.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-039 · A-System (eski tizim) bilan EuroPrint ERP qanday bog'lanadi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) EuroPrint A-System ni TO'LIQ o'rnini bosadi — eski tizim arxivga (yagona haqiqat manbai). LOYIHA-BITGAN §A.1 "yagona haqiqat manbai" bilan mos. ⚠️ Egasi qarori muhim — ko'chish strategiyasi.
- **Manba:** v2 Q9
- **Dalil (kod):** hujjatning o'zi "egasi qarori kutiladi" deydi. Hech qanday A-System integratsiya kodi topilmadi.
- **Nima yetishmaydi:** hammasi — lekin **kod-buildable hech narsa yo'q** qaror qabul qilinmaguncha. Bu **sof egasi-qarori**: to'liq almashtirish vs parallel ishlash vs bir tomonlama import.
- **Bog'liqlik:** ⭐ Katta hajmdagi keyingi ishni bloklaydi, o'zi esa faqat egasi qaroriga bog'liq
- **action:** UPDATE (op=dir.asystem.migrate)
- **⤳ Ta'sir:** Butun ERP (yagona manba), import/migratsiya
- **Xoch-havolalar:** `[Module-05] Item 89` · `EXTRACTION QISM C #05.39` · `TASDIQ-2146 §05 #39`
- **⚠️ ZIDDIYAT:** bu **eng strategik ochiq qaror** — A-default "to'liq almashtirish" deydi, lekin egasi hech qachon tasdiqlamagan. Yo'riqnomalarda A-System "lavozim vositasi" sifatida sanaladi (EP-DIR-052), ya'ni hozircha ishlatilyapti.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-040 · "1 суткалик ишлаб чиқариш режаси" — kunlik 24-soatlik reja ob'ekti
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Sutkalik reja" alohida ob'ekt (har kuni tuziladi) + bajarilish % director da. Butun logistika/statistika shu kunlik rejaga bog'langan.
- **Manba:** v2 Q10
- **Dalil (kod):** `grep -rln "daily_plan|sutka.*reja"` (`modules/director` + `modules/pp`) → **0 natija**; `daily_plan`/`sutka` jadvali yo'q.
- **Nima yetishmaydi:** rasmiy 24-soatlik ob'ekt. Mavjud `getPlanFact()` kunlik kesimi asos bo'la oladi. **Egasi-gated:** ob'ektga qaysi maydonlar kirishi (mavjud plan-fact kesimidan farqi) belgilanmagan.
- **Bog'liqlik:** EP-DIR-036 (plan-fact — data manbai)
- **action:** CREATE (op=dir.dailyPlan.create)
- **⤳ Ta'sir:** Planning (PP), MES, ichki logistika
- **Xoch-havolalar:** `[Module-05] Item 90` · `EXTRACTION QISM C #05.40` · `TASDIQ-2146 §05 #40`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-041 · "Кўп учрайдиган хатолар" ro'yxati AI risk-reyestriga aylansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada "tipik xatolar" ro'yxati + AI har birini real-time tekshiradi (xato yuz bersa alert). Owner har lavozim uchun yozgan xatolar AI risk-reyestri.
- **Manba:** v2 Q11
- **Dalil (kod):** `org_functions` ustun ro'yxatida `risk_registry` (yoki shunga o'xshash) ustun **yo'q**; AI real-time xato-tekshirish kodi yo'q.
- **Nima yetishmaydi:** `risk_registry` JSONB ustuni + umumiy xato naqshlarini agregatlaydigan AI ishi. **Egasi-gated:** "ko'p uchraydigan xato" ma'lumoti qayerdan keladi (QC nuqsonlari? HR intizom loglari?) — belgilanmagan.
- **Bog'liqlik:** EP-DIR-076 (AI xato-tasnif) — u ham qurilmagan
- **action:** AI (op=dir.card.riskRegistry)
- **⤳ Ta'sir:** AI integratsiya, ORG/KARTALAR, EP-DIR-079 (xato tasnif)
- **Xoch-havolalar:** `[Module-05] Item 91` · `EXTRACTION QISM C #05.41` · `TASDIQ-2146 §05 #41`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-042 · "Муваффақиятли ҳаракатлар" ro'yxati ideal-kartina manbai bo'lsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada "muvaffaqiyatli harakatlar" = ideal model + AI xodimni shu modelga qarab baholaydi. Kartaning ideal kartinasi.
- **Manba:** v2 Q12
- **Dalil (kod):** `org_functions` da `ideal_model` ustuni **yo'q**; AI baholash kodi yo'q.
- **Nima yetishmaydi:** `ideal_model` ustuni + AI-baholash ishi. **Egasi-gated:** har karta/rol uchun "muvaffaqiyatli harakat" nima ekanini egasi ta'riflashi shart — aks holda AI bahosi mazmunsiz.
- **Bog'liqlik:** EP-DIR-011 (ideal kartina), AI integratsiya
- **action:** AI (op=dir.card.idealActions)
- **⤳ Ta'sir:** AI baholash, ORG/KARTALAR, EP-DIR-011 (ideal kartina)
- **Xoch-havolalar:** `[Module-05] Item 92` · `EXTRACTION QISM C #05.42` · `TASDIQ-2146 §05 #42`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-043 · "Жавобгарликлари" — moddiy/ma'naviy javobgarlik darajalari saqlansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada "javobgarlik bandlari" + sodir bo'lganda HR voqeasiga bog'lanadi. Nizo/jazo holatlarida asos.
- **Manba:** v2 Q13
- **Dalil (kod):** `org_functions` da `responsibility`/`javobgarlik` ustuni **yo'q**.
- **Nima yetishmaydi:** `responsibility` matn/JSONB ustuni (kod-quriladigan) + 97 karta uchun haqiqiy javobgarlik matni — **sof egasi-DATA**.
- **Bog'liqlik:** HR (intizom voqeasi)
- **action:** CREATE (op=dir.card.responsibility)
- **⤳ Ta'sir:** ORG/KARTALAR, HR (intizom voqeasi)
- **Xoch-havolalar:** `[Module-05] Item 93` · `EXTRACTION QISM C #05.43` · `TASDIQ-2146 §05 #43`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-044 · "Тижорат сирларини ошкор этиш" javobgarligini tizim kuzatsinmi
- **Qaror holati:** ✅ JAVOBLANGAN (qisman — audit-log siyosati Q144 bilan)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, maxfiy ma'lumot (narx, mijoz, formula) kirishi audit-log + director ko'radi. Q144: audit-log faqat Super Admin (IT/Direktor) ko'radi — bu A variantga mos.
- **Manba:** v2 Q14 · **Q144** (audit-log = faqat Super Admin/IT/Direktor)
- **Dalil (kod):** `@UseInterceptors(AuditInterceptor)` `dashboard.controller.ts` va `company-state.controller.ts` sinf darajasida (to'g'ridan fayl o'qish bilan tasdiqlangan) — umumiy audit real va keng qo'llangan. `Role.SUPER_ADMIN` RBAC mavjud. **Δ:** `dbb78bee` — `zno.controller.ts` da `create`/`list` da **umuman rol-gate yo'q edi** (istalgan autentifikatsiyalangan xodim moliyaviy to'lov-so'rovlarini ko'ra va yarata olardi); endi `APPROVE_ROLES` qo'llangan.
- **Nima yetishmaydi:** **maydon-darajali** maxfiy-ma'lumot audit qoidasi (narx/mijoz/formula ga kirishni alohida qayd etish) yo'q — mavjudi umumiy so'rov-audit. `vision-1000 #34` (director o'z bo'limi maxfiy logini real-time ko'radi, Super Admin barchasini) uchun scope-gated log endpointi yo'q (grep `Q144` → 0).
- **Bog'liqlik:** RBAC, xavfsizlik (LOYIHA-BITGAN §A.5)
- **action:** READ (op=dir.secret.audit)
- **⤳ Ta'sir:** Audit-log (Super Admin only), RBAC, xavfsizlik (LOYIHA-BITGAN §A.5)
- **Xoch-havolalar:** `[Module-05] Item 94` · `EXTRACTION QISM C #05.44` · `TASDIQ-2146 §05 #44` · `vision-1000 #34` · `EXTRACTION QISM D #34`
- **Δ 2026-07-11→08-07:** `dbb78bee` — ZNO controllerdagi rol-gate bo'shlig'i yopildi (uchinchi tomon auditi topgan, mustaqil tasdiqlangan). Maydon-darajali maxfiylik auditi hamon yo'q.

### EP-DIR-045 · "Энергия ресурслари тежалиши (сув, газ, свет)" — director ko'rsatkichimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, suv/gaz/elektr oylik sarfi director dashboardda (manual yoki schyotchik) + trend. Owner energiya tejamkorligini rasmiy javobgarlik qilgan.
- **Manba:** v2 Q15
- **Dalil (kod):** `company-state.repository.ts:66-72` da aniq kod izohi: energiya raqami **ataylab yo'q** — `mes_telemetry.metric_type` da hech qachon energiya o'qishi bo'lmagan (jonli DB'ga qarshi tekshirilgan: 684 qator, nol energiya/quvvat qatori). IoT energiya sensorlari **jismonan o'rnatilmagan**; halol javob real sensor paydo bo'lguncha HTTP 501. Energiya raqamini **o'ylab topish taqiqlangan (Qoida 10)**.
- **Nima yetishmaydi:** qo'lda-kiritish + moliya-tasdiq zaxira yo'li (IoT yo'qligi tasdiqlangani uchun aynan shu qurilishi kerak) + `vision-1000 #35` ning "(joriy − o'tgan) / o'tgan × 100%" formulasi.
- **Bog'liqlik:** **Egasi-gated (uskuna):** jismoniy energiya IoT schyotchiklari sotib olinishi, yoki doimiy qo'lda-rejimga aniq imzo
- **action:** CREATE (op=dir.energy.track)
- **⤳ Ta'sir:** Moliya (xarajat), ekologik ko'rsatkich
- **Xoch-havolalar:** `[Module-05] Item 95` · `EXTRACTION QISM C #05.45` · `TASDIQ-2146 §05 #45` · `vision-1000 #35` · `[Module-05] Item 35` · `EXTRACTION QISM D #35`
- **⚠️ ZIDDIYAT:** `mro_utility_readings` jadvali mavjud, lekin u **MRO moduliga** tegishli, Director'ga emas. Ikkita "kommunal o'qish" manbai bo'lishi ehtimoli bor — egasi qaysi biri director-ko'rsatkichini oziqlantirishini belgilashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-046 · "Турникет" (kirish-chiqish) davomat statistikasiga ulansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, turniket → davomat integratsiyasi (kirish/chiqish avtomatik) + director kech kelish statistikasi. (AI kamera davomati LOYIHA-BITGAN §A.4 bilan birga ishlaydi.)
- **Manba:** v2 Q16
- **Dalil (kod):** `attendance_logs` jadvali mavjud + `getAttendanceToday` metodi bor.
- **Nima yetishmaydi:** `attendance_logs` = **0 qator**; turniket **uskuna integratsiyasi** kodi topilmadi; director "kech kelish" paneli yo'q.
- **Bog'liqlik:** **Egasi-gated (uskuna):** turniket qurilmasi + integratsiya (EP-DIR-045/085 bilan bir sinf)
- **action:** EVENT (op=dir.turnstile.attendance)
- **⤳ Ta'sir:** HR davomat, ish haqi (kun normasi), IoT
- **Xoch-havolalar:** `[Module-05] Item 96` · `EXTRACTION QISM C #05.46` · `TASDIQ-2146 §05 #46`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-047 · "Назорат варақаси" (control sheet) — har karta uchun o'quv jarayoni ob'ektimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada "Nazorat varaqasi" = mavzular + xodim "tasdiqladim" qadamlari. Vizyon: darslik kartaga (xodimga emas).
- **Manba:** v2 Q17 (RD5 Назорат варақаси)
- **Dalil (kod):** `to_regclass('public.control_sheet')` → jadval ro'yxatida **yo'q**. (`org_functions.ai_exam_enabled` alohida mavjud — EP-DIR-049.)
- **Nima yetishmaydi:** `control_sheet`/`nazorat_varaq` jadvali (`org_functions` kartalariga bog'langan) **va** har rol uchun haqiqiy nazorat-varaqa mavzu/mazmun strukturasi — **o'quv-kontent master-data, egasi-DATA**.
- **Bog'liqlik:** LMS (kontent strukturasi), EP-DIR-048 (to'g'ridan shunga tayanadi), EP-DIR-049
- **action:** CREATE (op=dir.card.controlSheet)
- **⤳ Ta'sir:** LMS (darslik), ORG/KARTALAR, EP-DIR-048
- **Xoch-havolalar:** `[Module-05] Item 97` · `EXTRACTION QISM C #05.47` · `TASDIQ-2146 §05 #47`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-048 · Nazorat varaqasidagi "тасдиқлайман" qadamlari (тема-тема) kuzatilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har mavzu "o'qildi/tushundim" checkbox + sana + xodim imzosi (raqamli). Mas'uliyat izi — hujjatga aynan mos.
- **Manba:** v2 Q18
- **Dalil (kod):** EP-DIR-047 bilan bir xil yo'qlik — mavzu-tasdiq qadamlarini biriktiradigan `control_sheet` jadvali umuman yo'q.
- **Nima yetishmaydi:** hammasi; **mustaqil qurib bo'lmaydi** — EP-DIR-047 jadvali avval bo'lishi shart.
- **Bog'liqlik:** ⭐ EP-DIR-047 (to'g'ridan, qattiq bog'liqlik)
- **action:** UPDATE (op=dir.controlSheet.confirm)
- **⤳ Ta'sir:** LMS, audit izi, EP-DIR-047
- **Xoch-havolalar:** `[Module-05] Item 98` · `EXTRACTION QISM C #05.48` · `TASDIQ-2146 §05 #48`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-049 · Nazorat varaqasidagi senariy-savollar (A/B/D) AI imtihon bo'lsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, senariy savollar = karta AI imtihoni (to'g'ri javob ball beradi). Vizyon: har karta o'z AI'si bilan xodimni sinaydi.
- **Manba:** v2 Q19
- **Dalil (kod):** `org_functions.ai_exam_enabled` boolean ustuni jonli sxemada tasdiqlangan. Hujjat "ai-exam route (stub)" borligini da'vo qiladi.
- **Nima yetishmaydi:** senariy-savol (A/B/D) → AI-imtihon quvuri; ai-exam route bu o'tishda mustaqil kuzatilmadi (hujjatning "stub" tavsifidan nariga o'tilmagan). Imtihon senariylarining tabiiy manbai — EP-DIR-047 nazorat varaqasi — mavjud emas. `vision-1000 #44` (yig'ma natija → LMS "qayta o'qish" + HR "razryad ushlab turish" avto-uzatish) yo'q.
- **Bog'liqlik:** ⭐ EP-DIR-047/048 (kontent manbai), LMS, HR razryad
- **action:** AI (op=dir.card.aiExam)
- **⤳ Ta'sir:** AI integratsiya, LMS, ORG/KARTALAR
- **Xoch-havolalar:** `[Module-05] Item 99` · `EXTRACTION QISM C #05.49` · `TASDIQ-2146 §05 #49` · `vision-1000 #44` · `EXTRACTION QISM D #44`
- **⚠️ ZIDDIYAT:** `ai_exam_enabled` bayrog'i mavjud, lekin uni yoqadigan mazmun (nazorat varaqasi) yo'q — bayroq **yoqilsa ham hech narsa qilmaydi**. Bu Q-46 "yarim-ishlaydigan kod" sinfiga tushadi.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-050 · Yo'riqnoma "ТАСДИҚЛАЙМАН директор Позилов А.А." imzosi — versiya nazorati
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har karta yo'riqnomasi versiyalanadi: tasdiqlovchi + sana + "tanishdim" imzo. Rasmiy hujjat oqimi (audit, mehnat nizosi).
- **Manba:** v2 Q20
- **Dalil (kod):** `org_functions.last_reviewed_at` ustuni jonli sxemada tasdiqlangan.
- **Nima yetishmaydi:** ustun **97 qatordan 0 tasida** to'ldirilgan; tasdiqlovchi-shaxs, versiya raqami va "tanishdim" imzo hujjat-oqimi umuman yo'q. `vision-1000 #43` (yangi versiyada faqat **O'ZGARGAN** bo'limga qayta imzo + diff ko'rsatish) yo'q — `last_reviewed_at` bitta timestamp, unga hech qanday diff/versiyalash logikasi ulanmagan.
- **Bog'liqlik:** EP-DIR-031 (position_purpose), immutable hujjat (LOYIHA-BITGAN §A.4)
- **action:** UPDATE (op=dir.card.docVersion)
- **⤳ Ta'sir:** ORG/KARTALAR, immutable hujjat (LOYIHA-BITGAN §A.4), audit
- **Xoch-havolalar:** `[Module-05] Item 100` · `EXTRACTION QISM C #05.50` · `TASDIQ-2146 §05 #50` · `vision-1000 #43` · `[Module-05] Item 43` · `EXTRACTION QISM D #43`
- **⚠️ ZIDDIYAT:** egasi-qarori kerak — diff maqsadida yo'riqnoma hujjatining "bo'lim"i nima deb hisoblanadi? Bu belgilanmaguncha "faqat o'zgargan bo'limga imzo" quriladigan emas.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-051 · "Малака талаблари" (tajriba, ta'lim) — kartaga talab maydonimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada malaka talablari (ta'lim, tajriba yili, ko'nikma) + AI nomzodni baholaydi. Vizyon: kartaga xodim qidiriladi.
- **Manba:** v2 Q21
- **Dalil (kod):** `org_functions` da `requirement`/`malaka`/`tajriba`/`ta'lim` uslubidagi ustunlar **yo'q** (o'rniga `min_salary`/`max_salary` bor).
- **Nima yetishmaydi:** `requirement`/`qualification` matn yoki JSONB ustuni + har karta uchun haqiqiy malaka talablari (**egasi-DATA**) + AI nomzod-baholash rubrikasi (**egasi ta'riflashi kerak**).
- **Bog'liqlik:** HR recruitment, AI xodim-karta moslik bahosi
- **action:** CREATE (op=dir.card.requirements)
- **⤳ Ta'sir:** HR recruitment, AI xodim-karta moslik bahosi (LOYIHA-BITGAN §A.4 80% AI rekruterlik)
- **Xoch-havolalar:** `[Module-05] Item 101` · `EXTRACTION QISM C #05.51` · `TASDIQ-2146 §05 #51`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-052 · "Лавозим воситалари" (A-System, hisobot, tex karta) kartaga biriktirilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har kartada "kerakli vositalar/dasturlar/hujjatlar" ro'yxati + yetishmasa flag. Vizyon "kerakli jihozlar modeli YO'Q" edi — hujjatda ro'yxat bor.
- **Manba:** v2 Q22
- **Dalil (kod):** `org_functions` da `tools`/`vosita` ustuni **yo'q**. Hujjatning o'zi qayd etadi: "vizyonda ham yo'q edi" — ya'ni bu bo'shliq dastlabki vizyon-intervyudan beri mavjud.
- **Nima yetishmaydi:** `tools` JSONB/massiv ustuni + kanonik vosita-ro'yxat taksonomiyasi (**egasi ta'riflashi kerak**). `vision-1000 #45` ("vosita yo'q" bayrog'i → IT Coordination vazifasiga + vositasiz ishlagan kunlar logi) ham yo'q — Coordination moduli real (`dokla`/`rasporyazhenie`), lekin wiring yo'q.
- **Bog'liqlik:** Coordination (vazifa yaratish), EP-DIR-039 (A-System vositalar ro'yxatida sanaladi)
- **action:** CREATE (op=dir.card.tools)
- **⤳ Ta'sir:** ORG/KARTALAR (kerakli jihozlar modeli)
- **Xoch-havolalar:** `[Module-05] Item 102` · `EXTRACTION QISM C #05.52` · `TASDIQ-2146 §05 #52` · `vision-1000 #45` · `[Module-05] Item 45` · `EXTRACTION QISM D #45`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-053 · "режа бажарилиш %" har bo'lim (25-04.xlsx ustunlari) director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, har operatsiya/bo'lim "Reja / Fakt / Qoldiq" director real-time (Excel ustunlariga mos). Owner allaqachon Excelда yuritgan.
- **Manba:** v2 Q23 (25-04.xlsx)
- **Dalil (kod):** `dashboard.controller.ts:80` `getPlanFact()` real; bo'lim-darajali Reja/Fakt/Qoldiq SQL jonli. `production_orders` = 7 qator. **Δ:** `a66e840d` — JOIN kanonik `org_departments` ga to'g'rilandi (avval eskirgan `departments` ga JOIN qilardi va **hech qachon mos kelmasdi**).
- **Nima yetishmaydi:** **operatsiya-darajali** kesim yo'q (faqat bo'lim-darajali) — Excel esa operatsiya bo'yicha yuritilgan. Data siyrak (7 qator). `vision-1000 #48` (faqat tugagan ishlar "fakt", in-progress alohida ustun) qurilmagan.
- **Bog'liqlik:** EP-DIR-036 (bir xil so'rov), EP-DIR-059 (operatsiya turlari — operatsiya o'qi uchun)
- **action:** READ (op=dir.planFact.view)
- **⤳ Ta'sir:** PP, MES, EP-DIR-036 (reja %)
- **Xoch-havolalar:** `[Module-05] Item 103` · `EXTRACTION QISM C #05.53` · `TASDIQ-2146 §05 #53` · `vision-1000 #48` · `EXTRACTION QISM D #48`
- **Δ 2026-07-11→08-07:** `a66e840d` — buzuq JOIN to'g'rilandi (`departments` → `org_departments`).

### EP-DIR-054 · "Зарур заказлар" (ustuvor buyurtmalar) navbati director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, buyurtmaga "zarur/ustuvor" flag + navbat tartibi director ko'radi va o'zgartira oladi. Director'ning ustuvorlik qaroriga ta'sir qiladi.
- **Manba:** v2 Q24 (25-04.xlsx ЗАРУР ЗАКАЗЛАР)
- **Dalil (kod):** `director-state.service.ts:60` `markOrderVip(orderId)` → `director-extended.controller.ts:60` (`POST orders/:id/vip`) real va ulangan. **Δ:** `00cda627` — `director-state.repository.ts:139-146`: VIP belgilash avval faqat `sales_orders.is_vip` ni qo'yardi, PP navbat-ustuvorligi esa (`ProductionPriorityService.buildQueue`, `GET /pp/queue`, operator `PPQueue.tsx` "ZARUR" nishoni) faqat `production_orders.is_urgent` ni o'qiydi va `sales_orders` ga hech qachon JOIN qilmaydi → **VIP ishlab chiqarishda umuman ko'rinmasdi**. Endi qo'shimcha `UPDATE production_orders SET is_urgent = true` mavjud `EP-PP-097` mexanizmini qayta ishlatadi.
- **Nima yetishmaydi:** `vision-1000 #21` talab qilgan **`EP-DIR-054 dir.order.priority` domen-eventi** hamon yo'q (grep `EP-DIR-054` → 0) — hozirgi yechim to'g'ridan `UPDATE`, event emas. Navbat tartibini director'ning **o'zi qayta tartiblashi** (drag/reorder) ham yo'q — faqat bayroq qo'yish.
- **Bog'liqlik:** SD (buyurtma), PP (navbat/reja)
- **action:** UPDATE (op=dir.order.priority)
- **⤳ Ta'sir:** SD (buyurtma), PP (navbat/reja)
- **Xoch-havolalar:** `[Module-05] Item 104` · `EXTRACTION QISM C #05.54` · `TASDIQ-2146 §05 #54` · `vision-1000 #21` · `[Module-05] Item 21` · `EXTRACTION QISM D #21`
- **⚠️ ZIDDIYAT:** vizyon **event** so'raydi (`dir.order.priority` → PP), ijro **to'g'ridan UPDATE** bilan bordi. Funksional natija bir xil, arxitektura shartnomasi (`docs/MODUL_SHARTNOMASI.md` — modul A → modul B faqat event orqali) buzilgan. → `VR-DIR-I07`.
- **Δ 2026-07-11→08-07:** `00cda627` — VIP belgilash endi PP navbatiga yetib boradi (`production_orders.is_urgent`); 07-11 dagi "PP-tomon yetib bormaydi" bo'shlig'i funksional yopildi, event-shakli emas.

### EP-DIR-055 · "Брак сони" (brak miqdori) — director sifat-yo'qotish ko'rsatkichimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, "Brak soni/%" director dashboardda (operatsiya/bo'lim/material bo'yicha) + trend. Brak = bevosita pul yo'qotish.
- **Manba:** v2 Q25 (25-04.xlsx Брак сони)
- **Dalil (kod):** `company-state.repository.ts` `quality` metrikasini `defect_qty` dan hisoblaydi va `computeHolat()` ga uzatadi — yagona agregat real. Manba-modul nuqson ma'lumotlari mavjud: `qc-defects-extended.repository.ts` (QC) va `mes-brak-limit.repo.ts` (MES).
- **Nima yetishmaydi:** director-tomonidagi **operatsiya/bo'lim/material kesim paneli** yo'q. `vision-1000 #25` talab qilgan **3 alohida kategoriya** (QC qaytargan / MES qayd etgan / yetkazishda aniqlangan) + jami yo'q; ayniqsa **yetkazish-brak manbai umuman mavjudligi tasdiqlanmagan**.
- **Bog'liqlik:** QC, MES; yetkazish/logistika brak manbai (mavjudligi tasdiqlanmagan)
- **action:** READ (op=dir.defect.view)
- **⤳ Ta'sir:** QC (sifat nazorati), Moliya (yo'qotish)
- **Xoch-havolalar:** `[Module-05] Item 105` · `EXTRACTION QISM C #05.55` · `TASDIQ-2146 §05 #55` · `vision-1000 #25` · `[Module-05] Item 25` · `EXTRACTION QISM D #25`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-056 · "Длительность / Начат / Завершит" — operatsiya davomiyligi director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Rejalashtirilgan davomiylik vs Fakt davomiylik" director da + og'ish %. Vaqt og'ishi samaradorlik ko'rsatkichi.
- **Manba:** v2 Q26 (25-04.xlsx)
- **Dalil (kod):** `grep -rln "davomiylik.*panel|dlitelnost"` (`modules/director`) → **0**. `production_sessions`/`mes_production_sessions` jadvallari mavjud, lekin director-tomonidagi reja-vs-fakt davomiylik paneli yo'q.
- **Nima yetishmaydi:** `mes_production_sessions` boshlanish/tugash timestamp'larini rejalashtirilgan davomiylikka qarshi qo'yadigan panel. Bog'liq: MES sessiya ma'lumotlarida ishonchli start/end timestamp bo'lishi kerak.
- **Bog'liqlik:** MES (sessiya vaqt ma'lumotlari)
- **action:** READ (op=dir.duration.view)
- **⤳ Ta'sir:** MES, PP, EP-DIR-058 (setup vaqti)
- **Xoch-havolalar:** `[Module-05] Item 106` · `EXTRACTION QISM C #05.56` · `TASDIQ-2146 §05 #56`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-057 · "Ден / Ноч" (kunduzgi/tungi smena) bo'yicha statistika ajratilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, kunduzgi/tungi smena holati + reja% alohida director da. Qaysi smena yaxshi ishlashi muhim qaror.
- **Manba:** v2 Q27 (25-04.xlsx ден/ноч)
- **Dalil (kod):** `grep -rln "den.*noch|kunduz.*tun|shift.*statistic"` (`modules/director` + `modules/mes`) → **0 natija**.
- **Nima yetishmaydi:** `mes_production_sessions` ustidan kunduz/tun kesim so'rovi (smena-bayrog'i yoki vaqt-oynasi kerak). **Egasi-gated:** smena chegara soatlari (kunduz qachon tugaydi / tun boshlanadi) boshqa joyda kodlanmagan bo'lsa, egasi tasdiqlashi kerak.
- **Bog'liqlik:** MES (sessiyaga smena-teg qo'yilishi — tasdiqlanmagan)
- **action:** READ (op=dir.shift.compare)
- **⤳ Ta'sir:** MES, HR (smena), EP-DIR-001 (holat smenadan)
- **Xoch-havolalar:** `[Module-05] Item 107` · `EXTRACTION QISM C #05.57` · `TASDIQ-2146 §05 #57`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-058 · Ishchi normasi "%" (Iyun ishchilar.xlsx) — mehnat-samaradorlik paneli
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har ishchi "Norma %, Oylik %, Ishlagan kuniga %" director/HR da (Excel formulalariga mos). Ish haqi va samaradorlik asosi.
- **Manba:** v2 Q28 (Iyun ishchilar.xlsx)
- **Dalil (kod):** `grep -rln "norma.*%|norma_pct"` (`modules/director` + `modules/hr`) → **0** (norma-foiz paneli uchun). HR'da razryad/koeffitsiyent logikasi umuman mavjud, lekin bu aniq formula yo'q.
- **Nima yetishmaydi:** norma% kalkulyatori. **Egasi-gated:** aniq norma% formulasi (maxraj oylik maqsadmi yoki kunlik maqsad?) tasdiqlanishi kerak.
- **Bog'liqlik:** ⭐ EP-DIR-059 (operatsiya turlari normasi = "norma" manbai) — u ham yo'q
- **action:** READ (op=dir.workerNorm.view)
- **⤳ Ta'sir:** HR, ish haqi (razryad→talab→o'sish→oylik)
- **Xoch-havolalar:** `[Module-05] Item 108` · `EXTRACTION QISM C #05.58` · `TASDIQ-2146 §05 #58`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-059 · Operatsiya turlari bo'yicha norma (avtokley, GTO, kley...) saqlansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, har operatsiya turi uchun norma + fakt + % director da (Excel ro'yxatiga aynan mos: avtokley/GTO/kley/oynakcha/paypoq/rezka/samokley/skleyka/tigel/yoni/laminatsiya/lak/vib.lak). Narx va samaradorlik asosi.
- **Manba:** v2 Q29 (Iyun ishchilar.xlsx)
- **Dalil (kod):** `to_regclass('public.operation_norm')` → jadval ro'yxatida **yo'q**.
- **Nima yetishmaydi:** `operation_norm` jadvali 13 seed operatsiya-turi qatori bilan. ⚠️ **Egasi-DATA:** 13 operatsiya turi uchun **haqiqiy norma qiymatlari** — o'ylab topib bo'lmaydi (Q-40).
- **Bog'liqlik:** ⭐ **Bloklovchi band** — EP-DIR-058 (ishchi normasi), EP-DIR-060 (lak normasi), EP-DIR-068 (operatsiya o'qi) hammasi shunga tayanadi
- **action:** CREATE (op=dir.opNorm.set)
- **⤳ Ta'sir:** PP (norma), MES, narxlash
- **Xoch-havolalar:** `[Module-05] Item 109` · `EXTRACTION QISM C #05.59` · `TASDIQ-2146 §05 #59`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-060 · "Oddiy lak" va "Vib lak" alohida norma — director taqqoslasinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, oddiy lak / vib lak alohida norma+% (Excel ustunlariga mos). Har biri har xil hosildorlik.
- **Manba:** v2 Q30 (Iyun ishchilar.xlsx)
- **Dalil (kod):** EP-DIR-059 bilan bir xil yo'qlik — lak-turi sub-normasini saqlaydigan `operation_norm` jadvali yo'q.
- **Nima yetishmaydi:** hammasi; **mustaqil qurib bo'lmaydi** — EP-DIR-059 jadvali avval bo'lishi shart. Egasi haqiqiy lak norma qiymatlarini berishi kerak.
- **Bog'liqlik:** ⭐ EP-DIR-059 (to'g'ridan, qattiq bog'liqlik)
- **action:** READ (op=dir.lak.compare)
- **⤳ Ta'sir:** PP/MES (operatsiya turi), EP-DIR-059
- **Xoch-havolalar:** `[Module-05] Item 110` · `EXTRACTION QISM C #05.60` · `TASDIQ-2146 §05 #60`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-061 · Bandlik.xlsx — operatsiyaga ketadigan min/soat/kun (pragon) director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Bo'limlar yuklamasi (pragon) — min/soat/kun" director da (Excel formulasiga mos). Sig'im rejalashtirish (CRP) asosi.
- **Manba:** v2 Q31 (Bandlik.xlsx)
- **Dalil (kod):** `grep -rln "pragon|yuklama.*crp"` (`modules/director` + `modules/mes`) → **0 natija**.
- **Nima yetishmaydi:** CRP yuklama kalkulyatori (min/soat/kun) — `work_centers` sig'im ma'lumotlaridan quriladi (loyiha xotirasi: `efficiency_rate` shu jadvalda oldindan mavjud edi). **Egasi-DATA:** asl Bandlik.xlsx manba ma'lumoti/formulasi aynan takrorlanishi uchun kerak.
- **Bog'liqlik:** `work_centers` sig'im maydonlari to'liqligi (xotira: `efficiency_rate` bo'shlig'i avval belgilangan)
- **action:** READ (op=dir.loading.view)
- **⤳ Ta'sir:** Planning (CRP), MES sig'im
- **Xoch-havolalar:** `[Module-05] Item 111` · `EXTRACTION QISM C #05.61` · `TASDIQ-2146 §05 #61`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-062 · "Buyurtma tayyorligi %" har buyurtma uchun progress paneli
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, har buyurtma "tayyorligi % + qaysi bo'limda" director da (Excel ustuniga mos). Owner necha % tayyor va necha bo'limdan o'tganini kuzatadi.
- **Manba:** v2 Q32 (Bandlik.xlsx, ketgan kun.xlsx)
- **Dalil (kod):** `dashboard.controller.ts:87` `@Get('order-progress')` real; `readiness_pct` + `current_department` SQL jonli. `sales_orders` = 13 qator, `production_orders` = 7 qator (hujjat "ikkalasi bo'sh" degan edi). **Δ:** `a66e840d` — `getOrderProgress()` JOIN i kanonik `org_departments` ga to'g'rilandi.
- **Nima yetishmaydi:** manba ma'lumoti juda siyrak (13/7 qator) — "oltin ip kuzatuvi" real hajmda sinalmagan.
- **Bog'liqlik:** SD, PP, MES
- **action:** READ (op=dir.orderProgress.view)
- **⤳ Ta'sir:** SD, PP, MES (oltin ip kuzatuvi)
- **Xoch-havolalar:** `[Module-05] Item 112` · `EXTRACTION QISM C #05.62` · `TASDIQ-2146 §05 #62`
- **⚠️ ZIDDIYAT:** QISM C "data=0 (sales/production_orders bo'sh)" vs jonli 13/7 qator → raqam bo'yicha **STALE-DOC** (yumshoq), lekin xulosa (siyrak) o'zgarmaydi.
- **Δ 2026-07-11→08-07:** `a66e840d` — buzuq JOIN to'g'rilandi.

### EP-DIR-063 · "Ishlab chiqarishga ketgan kun / qolgan kun" — sikl-vaqt trendmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, buyurtma "sikl vaqti (kun) — reja vs fakt" director da + kechikkanlar (Excel ustuniga mos). Yetkazish va'da nazorati.
- **Manba:** v2 Q33 (ketgan kun.xlsx)
- **Dalil (kod):** `grep -rln "sikl.*vaqt|cycle.*time"` (`modules/director`) → **0 natija**.
- **Nima yetishmaydi:** sikl-vaqt (o'tgan kun vs qolgan kun) paneli — `sales_orders`/`production_orders` sana maydonlaridan quriladi. Egasi-gate yo'q, sof kod ishi.
- **Bog'liqlik:** EP-DIR-062 (order-progress — tabiiy kengaytma bazasi)
- **action:** READ (op=dir.cycleTime.view)
- **⤳ Ta'sir:** SD (yetkazish va'da), PP, EP-DIR-037 (kechikish)
- **Xoch-havolalar:** `[Module-05] Item 113` · `EXTRACTION QISM C #05.63` · `TASDIQ-2146 §05 #63`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-064 · "Прокатка / приладка вақти (соат)" — setup vaqti yo'qotishi director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Priladka/setup vaqti (soat)" director da operatsiya/buyurtma bo'yicha. Sub-savol: kichik buyurtmalarda setup nisbati yuqori — director alohida belgilasin (EP-DIR-068 bilan bog'liq).
- **Manba:** v2 Q34 (ketgan kun.xlsx)
- **Dalil (kod):** `grep -rln "priladka|setup.*vaqt|setupTime"` (`modules/director` + `modules/mes`) → **0 natija**.
- **Nima yetishmaydi:** setup-vaqt yo'qotish paneli. ⭐ Asosiy blok: **MES setup-vaqtini ishlab-chiqarish vaqtidan alohida qayd etishi** tasdiqlanmagan. `vision-1000 #27` (setup/ishlab-chiqarish nisbati >30% → AI format-optimizatsiya tavsiyasi, 3× takror → eskalatsiya) shu sababdan qurilmagan.
- **Bog'liqlik:** ⭐ MES (setup-vs-run vaqt ajratimi), EP-DIR-065/066
- **action:** READ (op=dir.setupTime.view)
- **⤳ Ta'sir:** MES (setup), EP-DIR-068 (kichik buyurtma), yashirin yo'qotish
- **Xoch-havolalar:** `[Module-05] Item 114` · `EXTRACTION QISM C #05.64` · `TASDIQ-2146 §05 #64` · `vision-1000 #27` · `[Module-05] Item 27` · `EXTRACTION QISM D #27`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-065 · Kichik buyurtmalar tahlili — strategik foyda paneli
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Kichik buyurtmalar — kichiklashish %, dona/kg foyda" strategik panel director da (Excel hisobiga mos). Owner (M.Nosirov) zarar keltirayotganini hisoblagan — strategik narx qaror.
- **Manba:** v2 Q35 (Kichik buyurtmalar.xlsx)
- **Dalil (kod):** `grep -rln "small_order"` butun `apps/api/src` bo'yicha → **0 natija** (hujjatning "grep bo'sh" da'vosiga mos). Yaqin qarindosh mavjud: `finance/order-costing/drizzle-order-costing.repo.ts:55` `findTopLoss(limit)` — `orderCostings` ni eng past `marginPercent` bo'yicha saralaydi ("Top zarar buyurtmalar").
- **Nima yetishmaydi:** kichik-buyurtma tahlil so'rovi (`sales_orders` hajm/qiymatini order-costing birlik-foydasi bilan birlashtiradi). **Egasi-gated:** "kichik buyurtma" hajm ostonasi belgilanmagan. `vision-1000 #28` (zarar buyurtma **faqat eslatma**, blok yo'q — E1) yarim holatda: `findTopLoss` passiv Moliya hisoboti, **director'ga faol alert sifatida ulanmagan**; bloklash mexanizmi esa (to'g'ri) yo'q.
- **Bog'liqlik:** Moliya order-costing moduli (mavjud)
- **action:** READ (op=dir.smallOrder.analysis)
- **⤳ Ta'sir:** SD (savdo narx), Moliya (foyda marjasi)
- **Xoch-havolalar:** `[Module-05] Item 115` · `EXTRACTION QISM C #05.65` · `TASDIQ-2146 §05 #65` · `vision-1000 #28` · `[Module-05] Item 28` · `EXTRACTION QISM D #28`
- **⚠️ ZIDDIYAT:** QISM D "#28 **Yo'q** — grep `loss.?order|zarar.?buyurt` = 0" vs `[Module-05] Item 28` jonli topilma `findTopLoss()` Moliyada real. Yangi + kod-dalilli manba ustun → QISM D qatori **STALE-DOC**; so'rov bor, faqat Director'ga ulanmagan.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-066 · "Razmer eski → yangi" optimizatsiyasi director tavsiyasiga aylansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, AI strategik tahlilchi "format optimizatsiyasi" tavsiyasini avtomatik beradi (42x58 → 40x58 kabi). Owner qog'oz formatini kichraytirib kg-foydani oshirgan.
- **Manba:** v2 Q36 (Kichik buyurtmalar.xlsx)
- **Dalil (kod):** `grep -rln "format.*opt|razmer.*optimizat"` (`modules/ai` + `modules/director`) → **0 natija**. `strategic-agent.service.ts` mavjud, lekin unda format-opt metodi topilmadi.
- **Nima yetishmaydi:** `strategic-agent.service.ts` ga `formatOptimization()` metodi. **Egasi-DATA:** tavsiya mantig'ini o'rgatish/qattiq kodlash uchun tarixiy razmer-optimizatsiya qoidalari/misollari kerak.
- **Bog'liqlik:** EP-DIR-026 (AI tahlilchi), EP-DIR-064 (setup-nisbati — bir xil qobiliyat bo'shlig'i)
- **action:** AI (op=dir.ai.formatOpt)
- **⤳ Ta'sir:** AI tahlilchi (EP-DIR-026), SD narx, ombor (qog'oz)
- **Xoch-havolalar:** `[Module-05] Item 116` · `EXTRACTION QISM C #05.66` · `TASDIQ-2146 §05 #66` · `vision-1000 #27`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-067 · Buyurtma kodi formati (2024-0499, KT/PT/E) director qidiruvida
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, buyurtma=`yil-raqam`, klishe=`KT/PT/E+raqam` rasmiy format + qidiruv. Owner kodlash tizimini yillar yuritgan — ERP shu kodlar bilan ishlashi shart.
- **Manba:** v2 Q37 (Excel buyurtma kodlari)
- **Dalil (kod):** `sales_orders.order_number` ustuni jonli sxemada tasdiqlangan; `sales_orders` = 13 jonli qator; qidiruvda ishlatiladi.
- **Nima yetishmaydi:** `KT/PT/E` prefiks-formatini **majburlash** va maxsus klishe-qidiruv UX i mustaqil tasdiqlanmadi. `vision-1000 #29` (eski yil buyurtmalari arxiv qatlamdan + "arxiv" belgisi + yil filtri) yo'q — **egasi-gated:** arxiv chegara yili belgilanmagan.
- **Bog'liqlik:** SD (buyurtma kod), klishe/papka kodi
- **action:** READ (op=dir.order.search)
- **⤳ Ta'sir:** SD (buyurtma kod), klishe/papka kodi
- **Xoch-havolalar:** `[Module-05] Item 117` · `EXTRACTION QISM C #05.67` · `TASDIQ-2146 §05 #67` · `vision-1000 #29` · `[Module-05] Item 29` · `EXTRACTION QISM D #29`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-068 · Director "departament bo'yicha" ham "operatsiya bo'yicha" ham (2 o'q)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, director 2 o'q: Departament (5/13/секция) ╳ Operatsiya turi — har ikkisi bo'yicha drill. Owner ham vertikal, ham gorizontal tahlil qiladi.
- **Manba:** v2 Q38
- **Dalil (kod):** `dashboard.controller.ts` endpoint ro'yxati (plan-fact, order-progress, stat-trends, open-issues, kpis, production/finance/hr-summary) — faqat **departament o'qi** kesimlari; operatsiya-turi o'qi endpointi yo'q.
- **Nima yetishmaydi:** operatsiya-turi o'qi. ⭐ **Bloklangan:** EP-DIR-059 (`operation_norm` jadvali) — operatsiya o'qining tabiiy manbai — mavjud emas va o'zi egasi-DATA ga bog'liq.
- **Bog'liqlik:** ⭐ EP-DIR-059 (to'g'ridan), EP-DIR-034 (departament raqamlash)
- **action:** READ (op=dir.dashboard.twoAxis)
- **⤳ Ta'sir:** Director dashboard navigatsiya, EP-DIR-034/EP-DIR-059
- **Xoch-havolalar:** `[Module-05] Item 118` · `EXTRACTION QISM C #05.68` · `TASDIQ-2146 §05 #68`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-069 · Statistik ko'rsatkich grafigi (Vysotskiy "статистика") — trend
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) Ha, har ko'rsatkich vaqt-trend grafigi (haftalik nuqta) + yo'nalish (o'sish/tushish). Vysotskiy modeli: son emas, yo'nalish muhim.
- **Manba:** v2 Q39 (Vysotskiy statistika)
- **Dalil (kod):** `dashboard.controller.ts:94` `@Get('stat-trends')` real; `kpi_definitions × kpi_values` `json_agg` `trend_points` SQL. `kpi_values` = **60 jonli qator** — trend ma'lumoti haqiqatan mavjud (faqat sxema emas).
- **Bog'liqlik:** EP-DIR-004 (holat tarixi), EP-DIR-070 (trend condition)
- **action:** READ (op=dir.stat.trend)
- **⤳ Ta'sir:** Director dashboard, EP-DIR-004 (holat tarixi), EP-DIR-070
- **Xoch-havolalar:** `[Module-05] Item 119` · `EXTRACTION QISM C #05.69` · `TASDIQ-2146 §05 #69` · `vision-1000 #26/#31`
- **⚠️ ZIDDIYAT:** `vision-1000 #26` (bayram/smena kunlari outlier sifatida kulrang) va `#31` (director qo'lda "anormallik, trendga qo'shma" belgilaydi) — ikkalasi ham **yo'q** (grep `outlier` faqat CRM lead-scoring da). `getStatTrends()` real bo'lgani uchun outlier-bayrog'ini iste'mol qilishi oson; `#26` uchun **egasi-DATA** kerak (qaysi kunlar bayram).
- **Δ 2026-07-11→08-07:** —

### EP-DIR-070 · Trend "yiqilish/o'sish holati" (condition) avtomatik aniqlansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, trend qiyaligi → holat (keskin tushish=Danger) avtomatik + chora-tadbir taklif. Vysotskiy: trenddan holat chiqarish boshqaruv tilining o'zagi.
- **Manba:** v2 Q40 (Vysotskiy holat: Normal/Emergency/Danger/Power)
- **Dalil (kod):** `kpi_values.status` ustuni jonli sxemada tasdiqlangan (60 qatorli jadvalning bir qismi) — har qator uchun trend-daraja klassifikatsiyasini aks ettiradi.
- **Nima yetishmaydi:** **qiyalikdan avtomatik holat chiqarish** va **chora-tadbir taklifi** kodi yo'q. Bu `vision-1000 #3` bilan bir xil ildiz: butun kod bazasida rate-of-change hisoblash umuman yo'q.
- **Bog'liqlik:** EP-DIR-005 (alert), EP-DIR-029 (5 daraja ro'yxati), EP-DIR-069 (trend data)
- **action:** AI (op=dir.stat.condition)
- **⤳ Ta'sir:** EP-DIR-001 (holat formulasi), AI tahlilchi, EP-DIR-029 (daraja ro'yxati)
- **Xoch-havolalar:** `[Module-05] Item 120` · `EXTRACTION QISM C #05.70` · `TASDIQ-2146 §05 #70` · `vision-1000 #3` · `[Module-05] Item 3` · `EXTRACTION QISM D #3`
- **⚠️ ZIDDIYAT:** Vysotskiy modeli 4 holat nomlaydi (Normal/Emergency/Danger/Power), `company_state_levels` esa 5 (EP-DIR-029). Trend-condition qurilganda qaysi ro'yxatga bog'lanishi ochiq.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-071 · Har ko'rsatkich uchun "mas'ul lavozim" (egasi) hujjatdan biriktirilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, har ko'rsatkichda "mas'ul karta/lavozim" + pasayganda o'sha kartaga alert. Owner har ko'rsatkichni egasiga bog'lagan (yo'riqnoma).
- **Manba:** v2 Q41
- **Dalil (kod):** `stat_regulations.owner_card_id` ustuni jonli sxemada tasdiqlangan.
- **Nima yetishmaydi:** jadval **0 qator** → jonli marshrutlash yo'q; **pasayganda kartaga alert** dispatch kodi topilmadi. `vision-1000 #32` (vakant karta + past KPI → yuqori karta + HR ga "kritik vakansiya" alerti) yo'q — u o'z navbatida `vision-1000 #12` (vakantlik eskalatsiyasi) ga bog'liq, u ham yo'q.
- **Bog'liqlik:** EP-DIR-006 (alert marshruti), EP-DIR-023 (egasi ustuni) — bir xil ildiz bo'shliq
- **action:** UPDATE (op=dir.stat.owner)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-023 (stat-reglament egasi), EP-DIR-006 (alert)
- **Xoch-havolalar:** `[Module-05] Item 121` · `EXTRACTION QISM C #05.71` · `TASDIQ-2146 §05 #71` · `vision-1000 #32` · `EXTRACTION QISM D #32`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-072 · "Ҳисоботларни ўз вақтида тайёрлаш" — hisobot-reglament director da
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, har bo'lim "hisobot topshirildi/kechikdi" director da + eslatma. Owner o'z vaqtida hisobotni reglament qilgan.
- **Manba:** v2 Q42
- **Dalil (kod):** `coordination.controller.ts` `dokla`/`rasporyazhenie` endpointlari real (`:92-190`). **Δ:** `35b727f7` — ikkala eskalatsiya croni avval **faqat bir marta** ishga tushardi (bitta xabar), endi 3 bosqichli: `rasporyazhenie-escalation.cron.ts:52,84,112` `escalation_stage = 1 → 2 → 3`, org-yurish (`director-escalation-org-resolver.util.ts`, manager zanjiri / `org_departments` rahbari fallback) va 3-bosqichda HR `discipline_records` ga uzatish. Ostonalar `business_settings` da (`director.rasp_escalation_stage2_days` default 1, `stage3_days` default 2; ZNO/ZVS uchun `director.escalation_stage2/3_sla_multiplier`). Cronlar jonli: `@Cron('0 9 * * *')` va `@Cron('15 * * * *')`. **Δ:** `ca379007` — dokla/rasporyazhenie hard-delete → soft-delete.
- **Nima yetishmaydi:** "hisobot **topshirildi / kechikdi**" maxsus deadline-tracker ko'rinishi yo'q — mavjudi umumiy dokla oqimi + SLA eskalatsiyasi. `vision-1000 #46` talab qilgan **sozlanadigan javob muddati (default 24 soat)** va `EP-DIR-072` statistikasiga yozilishi tasdiqlanmagan (grep `EP-DIR-072` → 0).
- **Bog'liqlik:** Coordination (dokla mexanizmi), EP-DIR-078 (bir xil mexanizm), HR (intizom)
- **action:** EVENT (op=dir.report.track)
- **⤳ Ta'sir:** NTF (eslatma), Coordination, EP-DIR-028 (digest)
- **Xoch-havolalar:** `[Module-05] Item 122` · `EXTRACTION QISM C #05.72` · `TASDIQ-2146 §05 #72` · `vision-1000 #33/#46` · `[Module-05] Item 33/46` · `EXTRACTION QISM D #33/#46`
- **Δ 2026-07-11→08-07:** `35b727f7` — `vision-1000 #33` (2× eslatma → rahbarning rahbariga, 3× → HR intizom, E1: avto-jazo yo'q) **to'liq yopildi**; 07-11 da "Yo'q — maxsus ko'p-bosqichli zanjir topilmadi" edi. `ca379007` — soft-delete.

### EP-DIR-073 · Director "real-time" yoki "kunlik kesim" ko'rsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) Real-time + kunlik snapshot ikkalasi (jonli kuzatuv + tugagan kun raqami). To'liq manzara — smena tugaganda barqaror raqam ham bo'ladi.
- **Manba:** v2 Q43
- **Dalil (kod):** `dashboard.controller.ts:56-58` — `getDashboard(@Query('mode') mode?: string)` + `isSnapshot = mode === 'snapshot'` shoxlanish mantiqi (kod izohi: "P30 EP-DIR-025/053"). `company-state-snapshot.cron.ts` kunlik qatorlarni avtomatik yozadi (07:00 cron, EP-DIR-003 da tasdiqlangan).
- **Bog'liqlik:** EP-DIR-003 (07:00 snapshot cron), EP-DIR-025 (dashboard)
- **action:** READ (op=dir.dashboard.mode)
- **⤳ Ta'sir:** Director dashboard, EP-DIR-003 (07:00 snapshot cron)
- **Xoch-havolalar:** `[Module-05] Item 123` · `EXTRACTION QISM C #05.73` · `TASDIQ-2146 §05 #73` · `vision-1000 #16` · `[Module-05] Item 16` · `EXTRACTION QISM D #16`
- **⚠️ ZIDDIYAT:** `vision-1000 #16` (real-time vs snapshot farqi **>5%** bo'lsa eslatma; MES/FIN eng kritik) — farq-detektori **yo'q** (grep `snapshot.*diff|realtime.*snapshot` = 0). Ikki rejim mavjud, lekin ular bir-biriga qarshi tekshirilmaydi → jimgina nomuvofiqlik xavfi.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-074 · Director og'ish yuz berganda "tomir-kesish" (root-cause) ko'rsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, og'ishdan → sabab kategoriyasi → aniq buyurtma/operatsiya drill (root-cause zanjiri). Verify-don't-trust, tomir-kesish madaniyatiga mos.
- **Manba:** v2 Q44
- **Dalil (kod):** `dashboard.controller.ts:87` `getOrderProgress()` `current_department` qaytaradi — departament-darajali drill boshlang'ich nuqta sifatida real.
- **Nima yetishmaydi:** to'liq **og'ish → sabab → buyurtma/operatsiya** zanjiri yo'q. ⭐ Bloklangan: EP-DIR-037 (`delay_count`/`plan_deviation_count` hisoblagichlari — root-cause ning tabiiy kirishi) mavjud emas.
- **Bog'liqlik:** ⭐ EP-DIR-037 (to'g'ridan), EP-DIR-024 (karta-darajali sabab), EP-DIR-076 (xato tasnif)
- **action:** READ (op=dir.rootCause.drill)
- **⤳ Ta'sir:** EP-DIR-037 (og'ish counter), EP-DIR-079 (xato tasnif)
- **Xoch-havolalar:** `[Module-05] Item 124` · `EXTRACTION QISM C #05.74` · `TASDIQ-2146 §05 #74`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-075 · "Smena rejasi 2 xil buyurtma aralashib ketishi" — konflikt alerti
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, bir vaqtda o'xshash material talab qiladigan 2 buyurtma → "aralashish riski" alert (5/3 qavatli gofra senariysi). Owner tipik va qimmat xatoni real misol qilib yozgan.
- **Manba:** v2 Q45 (Назорат варақаси senariy)
- **Dalil (kod):** `grep -rln "smena.*aralash|shiftConflict"` butun `apps/api/src` bo'yicha → **0 natija**. `mes-shifts-stats.repo.ts:74` da smena-topshirish "acknowledged" bo'shlig'i bor, lekin bu **aralashish** deteksiyasi emas.
- **Nima yetishmaydi:** hammasi. `vision-1000 #36` qo'shimcha talab qiladi: alert **director + PP rejalashtiruvchi + smena ustasi** ga bir vaqtda, 30 daqiqada "ko'rdim" bo'lmasa yuqoriga eskalatsiya. Kirish sifatida MES smena/sessiya konflikt-deteksiyasi kerak (mavjudligi tasdiqlanmagan).
- **Bog'liqlik:** MES (smena/sessiya konflikt deteksiyasi), PP (smena rejasi), tex-karta, NTF
- **action:** EVENT (op=dir.mixup.alert)
- **⤳ Ta'sir:** PP (smena rejasi), MES, tex-karta, NTF
- **Xoch-havolalar:** `[Module-05] Item 125` · `EXTRACTION QISM C #05.75` · `TASDIQ-2146 §05 #75` · `vision-1000 #36` · `[Module-05] Item 36` · `EXTRACTION QISM D #36`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-076 · Director "Лавозим мақсади tushunilmadi" holatini (xato-tasnif) ko'rsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, AI xato sodir bo'lganda uni "tushunmaslik/e'tiborsizlik/qoidabuzarlik" deb tasniflaydi + o'quv tavsiya. Owner xatolarning ko'pi tushunmaslikdan kelishini belgilagan.
- **Manba:** v2 Q46
- **Dalil (kod):** `grep -rln "tushunmaslik|e'tiborsizlik|qoidabuzarlik"` butun `apps/api/src` bo'yicha → **0 natija**.
- **Nima yetishmaydi:** HR/QC hodisalarini 3 kategoriyaga teglaydigan AI klassifikatsiya ishi. **Egasi-gated:** 3-yo'nalishli klassifikator uchun **belgilangan (labeled) o'quv misollari** kerak, yoki qoida-asosli (AI emas) o'rinbosarga aniq imzo. `vision-1000 #50` (xodim e'tirozi → HR+director tasdig'i → "corrected label" AI o'rganishi uchun) ham yo'q va aynan shu modelga ulanadi.
- **Bog'liqlik:** ⭐ EP-DIR-041 (AI risk-reyestri — bir xil model), LMS (o'quv tavsiya), HR
- **action:** AI (op=dir.error.classify)
- **⤳ Ta'sir:** AI integratsiya, LMS (o'quv tavsiya), EP-DIR-041 (risk-reyestr)
- **Xoch-havolalar:** `[Module-05] Item 126` · `EXTRACTION QISM C #05.76` · `TASDIQ-2146 §05 #76` · `vision-1000 #50` · `[Module-05] Item 50` · `EXTRACTION QISM D #50`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-077 · "Чиқиндилар ва қолдиқлар" (chiqindi) — director ekologik ko'rsatkichmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, "Chiqindi/qoldiq miqdori (kg)" director da + qayta ishlash%. Qoldiq (qog'oz) — qayta ishlash va xarajat manbai.
- **Manba:** v2 Q47
- **Dalil (kod):** `waste_records` va `waste_targets` jadvallari mavjud (ikkalasi ham **0 qator**). `remaining/waste.{controller,service,repository}.ts` mavjud; makulatura ombor-turi ham (`warehouse-types-config.sql:37 waste_paper`).
- **Nima yetishmaydi:** director-widget ulanishi yo'q, jonli data yo'q. `vision-1000 #47` (chiqindi qayta-ishlash % ↔ Moliya "makulatura kirim"; (chiqindi kg − qayta sotilgan kg) farqi oylik GL `entries` ga "yo'qotish" sifatida) qurilmagan.
- **Bog'liqlik:** ⭐ **GL ikki-olam qarori** (loyiha xotirasi: `gl_entries` vs `gl_journal_entries` kanonikligi) hal bo'lmaguncha GL-yozuv qismi qurilmaydi
- **action:** READ (op=dir.waste.view)
- **⤳ Ta'sir:** Ombor (qoldiq karton rulon), Moliya (qayta sotish)
- **Xoch-havolalar:** `[Module-05] Item 127` · `EXTRACTION QISM C #05.77` · `TASDIQ-2146 §05 #77` · `vision-1000 #47` · `[Module-05] Item 47` · `EXTRACTION QISM D #47`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-078 · Director "huquqlari" — ma'lumot so'rash huquqi ERP da aks etsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Ha, "ma'lumot/reja so'rovi" bo'limlararo workflow (so'rov→javob izi). Owner bo'limlararo ma'lumot talabini rasmiy huquq qilgan — gorizontal workflow.
- **Manba:** v2 Q48
- **Dalil (kod):** `coordination.controller.ts` `dokla`/`rasporyazhenie` mexanizmi real. ZNO/ZVS moduli ham: `zno.service.ts` (create/approve/reject + o'z-so'rovini-tasdiqlamaslik qo'riqchisi) + `zno-zvs-sla-escalation.cron.ts`. **Δ:** `dbb78bee` (ZNO `create`/`list` ga rol-gate), `f938bad5` (`approval-request.aggregate.ts:35-37` — so'rovchi o'z so'rovini tasdiqlay olmaydi, SoD), `d0f86666` (`coordination.controller.ts` ichidagi inline SQL repo/service ga ko'chirildi — Qoida 6/15), `ca379007` (hard-delete → soft-delete).
- **Nima yetishmaydi:** umumiy dokla/rasporyazhenie oqimidan **ajratilgan, kuzatiladigan info-request → javob izi** alohida xususiyat sifatida tasdiqlanmagan. `vision-1000 #46` ning **sozlanadigan javob muddati (default 24 soat)** qismi yo'q.
- **Bog'liqlik:** Coordination (gorizontal `workflow_rules`), EP-DIR-072 (bir xil mexanizm)
- **action:** CREATE (op=dir.info.request)
- **⤳ Ta'sir:** Coordination (gorizontal workflow_rules)
- **Xoch-havolalar:** `[Module-05] Item 128` · `EXTRACTION QISM C #05.78` · `TASDIQ-2146 §05 #78` · `vision-1000 #46` · `[Module-05] Item 46` · `EXTRACTION QISM D #46`
- **Δ 2026-07-11→08-07:** `dbb78bee` + `f938bad5` + `d0f86666` + `ca379007` — so'rov-oqimining **xavfsizlik va yaxlitlik** qatlami mustahkamlandi (rol-gate, SoD, soft-delete, arxitektura tozalash); funksional bo'shliq (muddat + ajratilgan info-request izi) o'zgarmadi.

### EP-DIR-079 · Strategik tahlilchi AI "Лавозим мақсади amalga oshyaptimi" baholasinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A) Ha, har karta-AI hisoboti → director uchun "qaysi lavozimlar maqsadga erishmayapti" agregat. Vizyon: karta-AI lar o'zaro ishlaydi, director eng yuqori agregat.
- **Manba:** v2 Q49 · karta-model vizyoni · LOYIHA-BITGAN §A.6 (markaziy-AI)
- **Dalil (kod):** **Δ `a3a641a9`:** `getCardAiAggregate()` (repo + service + controller) qo'shildi — AI-daily-report mexanizmi mashinasiz xodimlarga ЦКП bajarilishini AI-chat orqali hisobot qilish imkonini beradi va real `achievement_pct` ni `ckp_fact_values` ga (`org_departments.id` = kanonik KARTA kaliti bilan) yozadi; agregat kartalar bo'yicha so'nggi `achievement_pct` o'rtachasini oladi va ostonadan pastdagilarni chiqaradi. Barcha parametrlar `business_settings` da: `director.card_ai_underperform_threshold_pct` (default 80), lookback (default 7 kun), limit (default 10) — **hech biri hardcode emas**. `dashboard.controller.ts:65,80` orqali `aiInsights` ga uzatiladi. **Δ `91eaaa5b`:** `CardAiInsightsCard.tsx` + `SendKanbanTaskDialog.tsx` — agregat ro'yxatidagi kartaga to'g'ridan Kanban vazifasi yuborish tugmasi (`POST /api/kanban/cards`, `CreateTaskModal.tsx` naqshini qayta ishlatadi), karta nomi/bali/AI izohi bilan oldindan to'ldirilgan.
- **Bog'liqlik:** EP-DIR-024 (to'liq karta-markaz holat formulasi hamon yo'q — bu agregat `ckp_fact_values` dan keladi, `getRawMetrics` dan emas), Kanban moduli
- **action:** AI (op=dir.cardAi.aggregate)
- **⤳ Ta'sir:** AI integratsiya, HR karta-model, EP-DIR-024 (holat kartalardan)
- **Xoch-havolalar:** `[Module-05] Item 129` · `EXTRACTION QISM C #05.79` · `TASDIQ-2146 §05 #79` · `vision-1000 #15/#37` · `[Module-05] Item 15/37` · `EXTRACTION QISM D #37`
- **⚠️ ZIDDIYAT:** `vision-1000 #15` (karta AI hisoboti **300ms timeout → "stale" teg bilan o'tgan kun qiymati**, "qolib ketdi" deb hisoblanmaydi) hamon qurilmagan — agregatda timeout/stale semantikasi yo'q (grep `300ms|timeout|stale` → 0). Ya'ni band asosiy talab bo'yicha **Ha**, lekin degradatsiya-siyosati bo'yicha ochiq.
- **Δ 2026-07-11→08-07:** `a3a641a9` — 07-11 da "**Yo'q** — karta-AI agregat kodi yo'q, `aiInsights: []` hardcode" edi; endi real agregat. `91eaaa5b` — `vision-1000 #37` ("vazifa yubor" tugmasi, hisobot faqat o'qish emas) ham yopildi. Band **Yo'q → Ha**.

### EP-DIR-080 · Director ko'rsatkichlarining "ideal qiymati" hujjatdan yoki o'rnatilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Owner har ko'rsatkichga ideal/ostona belgilaydi (reja% > 95 = yashil) — sozlanadigan master-data. Sub-savol: A) har karta o'z ostonasi. EP-DIR-002 (holat chegaralari) bilan bir xil mantiq.
- **Manba:** v2 Q50
- **Dalil (kod):** EP-DIR-002 bilan bir xil dalil — `company-state.controller.ts:91-115` `GET/PATCH /company-state/thresholds/:id` to'liq qurilgan va ishlaydi, `state_thresholds` 25 seed qator.
- **Nima yetishmaydi:** **kod bo'shlig'i emas** — sxema + PATCH endpoint tayyor. Jonli qiymatlar hamon **seed-default**, egasi ko'rib chiqmagan. Sub-savol ("har karta o'z ostonasi") uchun karta-darajali ostona modeli yo'q.
- **Bog'liqlik:** EP-DIR-002 (bir xil mexanizm), EP-DIR-020 (`stat_regulations.target_value`)
- **action:** UPDATE (op=dir.stat.threshold)
- **⤳ Ta'sir:** EP-DIR-002 (holat chegaralari), EP-DIR-020 (stat-reglament targetValue)
- **Xoch-havolalar:** `[Module-05] Item 130` · `EXTRACTION QISM C #05.80` · `TASDIQ-2146 §05 #80`
- **⚠️ ZIDDIYAT:** QISM C bu bandni "**egasi-data**" deb belgilaydi (kod emas). Registrda **qurilish = Qisman** (kod tayyor, data yo'q) — ikki o'q ajratilgani uchun. Bu 44 ta "kod bor, qaror yo'q" bandining eng sof namunasi.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-081 · "Поддон" (paddon) — qayta ishlatiladigan resurs sifatida hisoblansinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, paddon zaxirasi/aylanishi director da (yetishmovchilik bekor turish bilan bog'lanadi). Paddon yetishmasligi downtime'ga olib keladi.
- **Manba:** v2 Q51
- **Dalil (kod):** `ow_pallet_recoveries` jadvali mavjud (`to_regclass` non-null), **0 qator**. `material-life` da `pallet_unit_qty` bor.
- **Nima yetishmaydi:** jonli data yo'q; director-ulanish va **downtime bilan bog'lanish** yo'q. `vision-1000 #39` (paddon zaxira kritik → WMS alert; PR **avto YARATILMAYDI**, inson tasdiqlaydi — E1) qurilmagan. Diqqat: "avto-PR yo'q" talabi hozircha bajarilgan ko'rinadi, lekin **faqat hech narsa qurilmagani uchun** — bu ataylab qilingan gate emas.
- **Bog'liqlik:** WMS (zaxira alerti), EP-DIR-038 (downtime bog'lanishi)
- **action:** READ (op=dir.pallet.view)
- **⤳ Ta'sir:** Ombor (ichki resurs), EP-DIR-038 (downtime)
- **Xoch-havolalar:** `[Module-05] Item 131` · `EXTRACTION QISM C #05.81` · `TASDIQ-2146 §05 #81` · `vision-1000 #39` · `[Module-05] Item 39` · `EXTRACTION QISM D #39`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-082 · Director "haftalik ishlab chiqargan vs qolgan" (ketgan kun.xlsx) ko'rsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Hafta ishlab chiqarildi vs qoldi" director da + haftalik trend (Excel ustuniga mos). Taktik (oylik→haftalik) darajaga mos.
- **Manba:** v2 Q52 (ketgan kun.xlsx)
- **Dalil (kod):** `grep -rln "haftalik.*fakt|weekly.*produced"` (`modules/director`) → **0 natija**. `monthly_plans.weekly_tasks` mavjud, lekin u **rejalashtirish maydoni**, fakt-kuzatuv maydoni emas (ustun to'g'ridan tekshirilgan).
- **Nima yetishmaydi:** haftalik fakt-vs-qolgan paneli (`production_orders`/MES sessiya ma'lumotidan). Solishtirish uchun `monthly_plans` real haftalik maqsadlar bilan to'ldirilishi kerak (hozir 0 qator).
- **Bog'liqlik:** EP-DIR-017/018 (`monthly_plans` to'ldirilishi)
- **action:** READ (op=dir.weekly.view)
- **⤳ Ta'sir:** EP-DIR-018 (haftalik dekompozitsiya), PP/MES
- **Xoch-havolalar:** `[Module-05] Item 132` · `EXTRACTION QISM C #05.82` · `TASDIQ-2146 §05 #82` · `vision-1000 #49` · `EXTRACTION QISM D #49`
- **⚠️ ZIDDIYAT:** `vision-1000 #49` (haftalik hisobot **yangilangan rejaga** nisbatan; og'ish = yangilangan reja − fakt; **asl reja** arxivda toggle bilan) — bu ikki-reja modelini talab qiladi, hozirgi `monthly_plans` da bunday ajratim yo'q.
- **Δ 2026-07-11→08-07:** —

### EP-DIR-083 · Yo'nalish (ofs kar / ofs gof / flx gof) bo'yicha statistika ajratilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, "Ofset-karton / Ofset-gofra / Flekso-gofra" yo'nalishlari bo'yicha holat+hajm director da. Har yo'nalish har xil samaradorlik (texnologiya turi).
- **Manba:** v2 Q53 (ketgan kun.xlsx йўналишлар)
- **Dalil (kod):** `grep -rln "yo'nalish.*statistika|ofs.*kar|ofs.*gof|flx.*gof"` butun `apps/api/src` bo'yicha → **0 natija**.
- **Nima yetishmaydi:** `sales_orders` da "yo'nalish" ustunini aniqlash/qo'shish. **Egasi-gated:** aniq yo'nalish taksonomiyasi (ofs-kar / ofs-gof / flx-gof va boshqalar) tasdiqlanishi kerak. `vision-1000 #40` (bir buyurtma ko'p yo'nalishga tegsa **ASOSIY** yo'nalishga to'liq hisoblanadi; "aralash" kategoriya **kerak emas**) — bu atribusiya qoidasi ham yo'q, lekin qaror allaqachon aniq berilgan.
- **Bog'liqlik:** SD (`sales_orders` yo'nalish ustuni — mavjud emas), PP (routing)
- **action:** READ (op=dir.direction.compare)
- **⤳ Ta'sir:** PP (routing/yo'nalish), MES
- **Xoch-havolalar:** `[Module-05] Item 133` · `EXTRACTION QISM C #05.83` · `TASDIQ-2146 §05 #83` · `vision-1000 #40` · `[Module-05] Item 40` · `EXTRACTION QISM D #40`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-084 · "Algoritm turi" (2-8 ta bo'lim oqimi) — buyurtma murakkabligi ko'rsatkichimi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ha, buyurtmaga "algoritm turi (2-8 bo'lim)" + murakkablikka qarab vaqt prognozi. Owner buyurtmani o'tadigan bo'limlar soni bilan tasniflaydi.
- **Manba:** v2 Q54 (ketgan kun.xlsx алгоритм тури)
- **Dalil (kod):** `grep -rln "algoritm.*turi|complexity.*forecast"` butun `apps/api/src` bo'yicha → **0 natija**.
- **Nima yetishmaydi:** `algorithm_type`/murakkablik-klassifikatsiya ustuni (`sales_orders` yoki `production_orders` da) + vaqt-prognoz modeli. **Egasi-gated:** "2-8 bo'lim" murakkablik-darajalari taksonomiyasi va tegishli vaqt baholari. `vision-1000 #41` (murakkab buyurtma MES real-vaqtda kuzatiladi; prognozdan **>15% ortiq** bo'lsa director alert) yo'q.
- **Bog'liqlik:** MES (sessiya-vs-prognoz kuzatuvi — tasdiqlanmagan), PP (routing)
- **action:** CREATE (op=dir.order.complexity)
- **⤳ Ta'sir:** Planning (yo'nalish/routing), buyurtma vaqt prognozi
- **Xoch-havolalar:** `[Module-05] Item 134` · `EXTRACTION QISM C #05.84` · `TASDIQ-2146 §05 #84` · `vision-1000 #41` · `[Module-05] Item 41` · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### EP-DIR-085 · Director paneliga "tozalik/intizom" (5S) ko'rsatkichi qo'shilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Ha, "Tozalik/intizom" holati director da (tekshiruv/voqea asosida). Owner tozalik va ish-joy intizomini har lavozim hujjatiga qo'shgan — madaniyat ko'rsatkichi.
- **Manba:** v2 Q55
- **Dalil (kod):** `kaizen_suggestions` jadvali mavjud, **1 jonli qator**. HR-intizom infratuzilmasi umuman mavjud (loyiha xotirasi: razryad/intizom klassifikatori). IoT kamera-AI infra ham bor (`camera-ai`, `camera-recognition.controller.ts`).
- **Nima yetishmaydi:** Director dashboardida maxsus 5S/tozalik paneli yo'q. `grep -rln "5S\b"` → **0 natija**. `vision-1000 #38` (QC/IoT kamera → AI belgilaydi → sifat rahbari tasdiqlaydi (E1) → dashboard; **avto-jarima YO'Q**) uchun 5S-maxsus deteksiya quvuri yo'q.
- **Bog'liqlik:** **Egasi-gated (uskuna):** jismoniy IoT kameralar + AI vision model/vendor + sifat-rahbari tasdiqlash oqimi (EP-DIR-045/046 bilan bir sinf)
- **action:** READ (op=dir.discipline.view)
- **⤳ Ta'sir:** HR (intizom voqealari), ORG/KARTALAR (qoidabuzarlik)
- **Xoch-havolalar:** `[Module-05] Item 135` · `EXTRACTION QISM C #05.85` · `TASDIQ-2146 §05 #85` · `vision-1000 #38` · `[Module-05] Item 38` · `EXTRACTION QISM D #38`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-DIR-I01..I12)

> Bu bandlar **hech qanday `EP-DIR-NNN` ga tegishli emas** — ular manba-hujjatlarning o'zidagi
> nomuvofiqliklar, arxitektura qarorlari va modul-darajali bo'shliqlar. I QISM bandlari
> ulardan **Bog'liqlik** yoki **⚠️ ZIDDIYAT** qatorlarida foydalanadi.

### VR-DIR-I01 · `decisions/05-director.md` ning o'z sanog'i band-darajali haqiqatga zid
- **Tur:** Manba-nomuvofiqlik (hujjat)
- **Tavsif:** Manba faylning sarlavhasi (9-11-qator) va `## XULOSA JADVALI` (623-625-qator) **9 ✅ / 76 🔵** deydi. Band-darajali `grep "^- \*\*Holat:\*\* ✅"` esa **12** beradi: EP-DIR-003, 004, 005, 007, 011, 012, 015, 017, 018, 020, 025, 044. Faylning o'z prozasi ("✅ JAVOBLANGAN (9):") ham 11 ta bandni sanaydi + EP-DIR-044 ni qavs ichida — ya'ni "9" raqami hech qaysi ro'yxatga mos kelmaydi.
- **Ta'sir:** har qanday keyingi hisobot noto'g'ri bazadan hisoblaydi.
- **Yechim:** manba faylning sarlavhasi va XULOSA JADVALI 12/73 ga to'g'rilanishi kerak. Bu registrda band-darajali haqiqat ishlatilgan.

### VR-DIR-I02 · Ikkita parallel ostona/vazn konfiguratsiya sirti — kanonik belgilanmagan
- **Tur:** Dublikat master-data (arxitektura)
- **Tavsif:** `state_thresholds` (`company-state.controller.ts:91-115`, 25 jonli qator, `weight` ustuni bilan) va `kpi_definitions`/`kpi_score_weights` (`dashboard.controller.ts:155,194`) — ikkalasi ham jonli, ikkalasi ham "ko'rsatkich ostonasi/vazni" ni sozlaydi. Hech qayerda qaysi biri kanonik ekani yozilmagan.
- **Ta'sir:** EP-DIR-002, EP-DIR-080. Egasi bir sirtda qiymat o'zgartirsa, ikkinchisi eski qiymat bilan qoladi → holat formulasi kutilmagan natija beradi (Q-40 "yashil lekin noto'g'ri").
- **Yechim:** **arxitektura qarori** — bittasi kanonik, ikkinchisi VIEW yoki o'chiriladi (`docs/MASTER_DATA_STANDARTLARI.md` jadval-egasi qoidasiga ko'ra).

### VR-DIR-I03 · `company_state_log` kunlik idempotentlik kafolati ushlanmayapti
- **Tur:** Ma'lumot yaxlitligi
- **Tavsif:** `company-state-snapshot.cron.ts:11` kod izohi "idempotent-per-day" deydi, lekin jonli `GROUP BY detected_at::date` tekshiruvi **kuniga 7 qator** ko'rsatadi (42 qator / 2026-06-30..07-08). Sabab noaniq: qo'lda `snapshotNow()` test-triggerlari yoki har-metrika-bir-qator naqshi.
- **Ta'sir:** EP-DIR-004 (tarix), EP-DIR-073 (snapshot rejimi), EP-DIR-020 (immutable tarix). 30-kun mini-grafik nuqtalari takrorlanadi.
- **Yechim:** DB-daraja unique constraint (`detected_at::date`) yoki upsert; keyin `vision-1000 #5` (IMMUTABLE arxiv + `changedBy/changedAt/prevValue/newValue` 4 maydonli audit-log) qurilishi mumkin.

### VR-DIR-I04 · Ideal-rasm servisida 3 ta hardcode literal — Qoida 10 buzilishi
- **Tur:** Soxta javob (Qoida 10 / Q-40)
- **Tavsif:** `ideal-rasm.service.ts:30-34` — `weekly_profit: 0`, `branches_count: 1`, `market_share: 0` literal qiymatlar, so'rov emas; lekin dashboardda haqiqiy ko'rsatkich sifatida ko'rinadi.
- **Ta'sir:** EP-DIR-013, EP-DIR-012 (gap tahlili shu raqamlarga tayanadi → gap ham soxta).
- **Yechim:** Moliya modulida profit-endpoint (mavjudligi tasdiqlanmagan) + filial/bozor-ulush manbalari aniqlanishi; topilmaguncha `HTTP 501` yoki `null` qaytarish (EP-DIR-045 dagi energiya bilan bir xil halol naqsh).

### VR-DIR-I05 · 99 orfan `okr_key_results` — "inson qaror qiladi" uchun insonda vosita yo'q
- **Tur:** Yarim-qurilgan oqim (Q-46)
- **Tavsif:** `817fa27c` 99 orfan qatorni `notes ILIKE '%NEEDS_REVIEW%'` bilan belgilagan (jonli 99/207 tasdiqlangan). `vision-1000 #10` printsipi: avto-relink **YO'Q** (E1), director **qo'lda** qayta ulaydi. Lekin qo'lda qayta-ulash UI/endpointi topilmadi.
- **Ta'sir:** EP-DIR-016 (OKR kaskad). 99 qator abadiy "ko'rib chiqilishi kerak" holatida qoladi.
- **Yechim:** relink endpoint + FE ro'yxat; yoki egasi 99 qatorni o'chirishga ruxsat beradi (ular test-artefaktlari bo'lishi mumkin — VR-DIR-I08 ga qarang).

### VR-DIR-I06 · Haftalik dekompozitsiya sxemasi tanlanmagan (jadval vs JSONB)
- **Tur:** Arxitektura qarori (Q-35)
- **Tavsif:** `vision-1000 #11` alohida `weekly_breakdowns` jadvalini nazarda tutadi (`to_regclass` → null, mavjud emas); mavjud muqobil — `monthly_plans.weekly_tasks` JSONB (0 qator). Ikkisidan qaysi biri tanlanishi hal qilinmagan.
- **Ta'sir:** EP-DIR-018, EP-DIR-082, EP-DIR-030 (SB0377).
- **Yechim:** egasi/arxitektura qarori; yangi jadval `Q-35` (egasi ruxsati) talab qiladi.

### VR-DIR-I07 · Modul-shartnoma buzilishi — Director→PP to'g'ridan `UPDATE`, event emas
- **Tur:** Arxitektura shartnomasi (`docs/MODUL_SHARTNOMASI.md`)
- **Tavsif:** `00cda627` VIP bo'shlig'ini `director-state.repository.ts:146` dagi `UPDATE production_orders SET is_urgent = true` bilan yopdi. Shartnoma esa "modul A → modul B **faqat event orqali**" deydi; vizyon ham aynan `EP-DIR-054 dir.order.priority` eventini so'ragan.
- **Ta'sir:** EP-DIR-054. Pragmatik yechim ishlaydi, lekin PP jadvalini Director moduli to'g'ridan yozadi.
- **Yechim:** `dir.order.priority` domen-eventi + PP tomonda listener; yoki shartnomaga aniq istisno yoziladi.

### VR-DIR-I08 · OKR jadvallarida 207 test-artefakt qator — "bo'sh emas" ≠ "ishlatilyapti"
- **Tur:** Ma'lumot sifati (Q-40)
- **Tavsif:** `okr_objectives`/`okr_key_results` har biri 207 qator, lekin `parent_goal_id`/`department_id`/`owner_card_id` 100% NULL, sarlavhalar generik ("Grow", "X"), 2026-07-02..07-09 da yaratilgan. Bu **avtomatlashtirilgan test-yugurishlari** izi, real strategiya emas.
- **Ta'sir:** EP-DIR-015, EP-DIR-016, EP-DIR-017. Har qanday "jadval to'lgan" hisoboti chalg'ituvchi.
- **Yechim:** test-artefaktlarni tozalash (egasi ruxsati bilan) yoki `is_test` bayrog'i; keyin real OKR kiritish.

### VR-DIR-I09 · Majlis (council) strukturasi — modul bor, data yo'q, org-sxemadan avto-to'ldirish yo'q
- **Tur:** Modul bo'shlig'i (EP-kodsiz)
- **Tavsif:** `RECONCILIATION SB0403 (PARTIALLY)` — majlis moduli mavjud, jadval **0 qator**; org-sxemadan avtomatik a'zo-inference qurilmagan. Δ: `a66e840d` `council-quorum.service.ts`, `council-members.repository.ts`, `council-votes.repository.ts` (102 yangi qator) kengaytirildi.
- **Ta'sir:** ShVB boshqaruv qatlami; hech bir EP-DIR bandiga xaritalanmaydi.
- **Yechim:** org-sxemadan a'zo avto-to'ldirish + egasi majlis tarkibini tasdiqlashi.

### VR-DIR-I10 · Uskuna-gated bandlar klasteri — 4 band jismoniy qurilma kutmoqda
- **Tur:** Egasi-gated (uskuna sotib olish)
- **Tavsif:** EP-DIR-045 (energiya IoT schyotchik — jonli tasdiq: `mes_telemetry` 684 qator, **nol** energiya qatori), EP-DIR-046 (turniket — `attendance_logs` 0 qator), EP-DIR-085 + `vision-1000 #38` (5S IoT kamera + AI vision). Kod tomondan hech narsa qilib bo'lmaydi.
- **Ta'sir:** 4 band abadiy "Yo'q/Qisman" holatida qoladi.
- **Yechim:** egasi qарori — uskuna sotib olish, yoki har biri uchun **qo'lda-kiritish + tasdiq** zaxira yo'liga aniq imzo. ⚠️ `company-state.repository.ts:66-72` allaqachon to'g'ri yo'l tutgan: raqam **o'ylab topilmaydi**, HTTP 501 qaytariladi.

### VR-DIR-I11 · Rate-of-change (og'ish tezligi) — butun kod bazasida yo'q, 3 bandni bloklaydi
- **Tur:** Ko'ndalang qobiliyat bo'shlig'i
- **Tavsif:** `grep -rln "rate_of_change|rateOfChange|consecutive"` → **0**. Bu yagona yo'qlik uchta talabni bloklaydi: `vision-1000 #3` (3 kun ketma-ket tushish → EP-DIR-005 alert), EP-DIR-070 (qiyalikdan avto-holat + chora-taklif), `vision-1000 #26/#31` (outlier belgilash trendni buzmasligi uchun).
- **Ta'sir:** EP-DIR-005, EP-DIR-069, EP-DIR-070.
- **Yechim:** `company_state_log` (42 qator) / `kpi_values` (60 qator) ustidan bitta rate-of-change modul — ikkala jadvalda ham data allaqachon bor, hech narsa bloklamaydi.

### VR-DIR-I12 · Karta-markaz KPI atributsiyasi yo'q — modulning bosh vizyon-ipi uzilgan
- **Tur:** ⭐ Poydevor bo'shliq (modullararo)
- **Tavsif:** `getRawMetrics()` (`company-state.repository.ts:131`) jadval-darajali agregat — `org_functions` dan **umuman** yig'ilmaydi. Loyiha xotirasi buni "card-gates OFF" deb belgilagan. `a3a641a9` qisman aylanma yo'l topdi (`ckp_fact_values` orqali karta-AI agregati), lekin holat formulasining o'zi hamon karta-ko'r.
- **Ta'sir:** ⭐ EP-DIR-024 (bevosita), EP-DIR-001, EP-DIR-032 (ЦКП→formula bog'lanishi), EP-DIR-074 (root-cause), EP-DIR-079 (qisman aylanib o'tildi).
- **Yechim:** **egasi qarori kerak** — `org_functions` ning qaysi maydonlari 5 holat-metrikasiga (cash/prod/orders/hr/qual) xaritalanadi. Bu fabrikatsiya qilinmaydi (Q-40); arxitektura qarori sifatida so'ralishi mumkin (Q-34).

---

## III QISM — Xoch-havola xaritasi, ziddiyat reestri va Δ reestri

### III.1 — Manba xaritasi (1:1 mapping)

| Manba | Diapazon | EP-DIR ga xaritalanishi |
|---|---|---|
| `decisions/05-director.md` | EP-DIR-001..030 (v1, 30 savol) | to'g'ridan |
| `decisions/05-director.md` | EP-DIR-031..085 (v2, 55 kitob-grounded savol) | to'g'ridan |
| `FULL-ITEM-LEVEL [Module-05]` | **Item 51..135** | ⭐ `Item N → EP-DIR-(N−50)` — **aniq 1:1** |
| `FULL-ITEM-LEVEL [Module-05]` | Item 1..50 | = `vision-1000 #1..#50`; EP-kodsiz, mavzu bo'yicha biriktirilgan |
| `EXTRACTION QISM C` (TASDIQ-2146 §05) | `#05.1..#05.85` | ⭐ `#05.N → EP-DIR-N` — **aniq 1:1** |
| `EXTRACTION QISM A` (vision-1000 jadval) | `#1..#50` | mavzu bo'yicha (quyidagi jadval) |
| `EXTRACTION QISM D` (V-VERIFY cross-ref) | `#3..#50` (48 ta) | QISM A ning hal qilingan holati |

### III.2 — `vision-1000 #1..#50` → EP-DIR biriktirish jadvali

| vision-1000 # | Mavzu (qisqa) | Biriktirilgan EP-DIR | Aniqlik |
|---|---|---|---|
| #1 | `state_weights` sozlanadigan + audit | EP-DIR-002 (+001) | ishonchli |
| #2 | Timeout → o'tgan kun qiymati + sariq badge | EP-DIR-001 | ishonchli |
| #3 | Rate-of-change 3 kun → alert | EP-DIR-005 / EP-DIR-070 | ⭐ matnda `EP-DIR-005` aniq |
| #4 | Ziddiyatli signal → vaznli o'rtacha + banner | EP-DIR-001 | ishonchli |
| #5 | Kunlik holat IMMUTABLE + 4 maydon audit | EP-DIR-004 | ishonchli |
| #6 | To'liqsiz kundalik "to'liqsiz" teg bilan | EP-DIR-007 | ishonchli |
| #7 | 3 kun chronic → eskalatsiya, `dir_chronic_days` | EP-DIR-010 | ishonchli |
| #8 | Bo'lim rahbari kundaligi + maydon-RBAC | EP-DIR-008 | ishonchli |
| #9 | Null → o'tgan kun + "yangilanmagan" teg | EP-DIR-001 | ishonchli |
| #10 | OKR kaskad uzilsa alert + qo'lda relink | EP-DIR-016 | ishonchli |
| #11 | Haftalik dekompozitsiya ishchi kunlarga | EP-DIR-018 | ishonchli |
| #12 | Vakant kartaga vazifa → eskalatsiya | EP-DIR-019 | ishonchli |
| #13 | `formula_version` kanonik | EP-DIR-022 (+020) | ishonchli |
| #14 | Egasi almashsa oniy o'tish + handoff | EP-DIR-023 (+020) | ishonchli |
| #15 | Karta AI 300ms timeout → stale | EP-DIR-079 (+024) | ishonchli |
| #16 | Real-time vs snapshot >5% farq | EP-DIR-073 | ishonchli |
| #17 | "Bajaramiz/inkor" + tavsiya og'irlashadi | EP-DIR-026 | ishonchli |
| #18 | Telegram `/holat` cron'dan oxirgisini | EP-DIR-027 | ishonchli |
| #19 | Digest va alert ALOHIDA xabar | EP-DIR-028 | ishonchli |
| #20 | Tarixdagi kunlar eski daraja bilan | EP-DIR-004 (+029) | ishonchli |
| #21 | Zarur zakaz navbati → PP real-vaqt event | EP-DIR-054 | ⭐ matnda `EP-DIR-054` aniq |
| #22 | Sabab 2s→eslatma, 4s→director+HR | EP-DIR-038 | ishonchli |
| #23 | Downtime agregat + "taniqladim" bayrog'i | EP-DIR-038 | ishonchli |
| #24 | PP oy-boshidan kesim kanonik | EP-DIR-036 | ⭐ matnda `EP-DIR-036` aniq |
| #25 | Brak 3 kategoriya alohida | EP-DIR-055 | ishonchli |
| #26 | Bayram/smena outlier kulrang | EP-DIR-069 | ishonchli |
| #27 | Setup >30% → format-opt, 3× eskalatsiya | EP-DIR-064 / EP-DIR-066 | ishonchli |
| #28 | Zarar buyurtma faqat eslatma (blok yo'q) | EP-DIR-065 | *(taxminiy)* |
| #29 | Eski yil buyurtmalari arxiv qatlamdan | EP-DIR-067 | *(taxminiy)* |
| #30 | Ko'p-karta xodim ulush-cap (EP-ORG-066) | EP-DIR-024 | *(taxminiy — asosan ORG moduli)* |
| #31 | Qo'lda outlier "trendga qo'shma" | EP-DIR-070 (+069) | ishonchli |
| #32 | Vakant + past KPI → "kritik vakansiya" | EP-DIR-071 | ishonchli |
| #33 | 2× → rahbarning rahbari, 3× → HR intizom | EP-DIR-072 | ishonchli |
| #34 | Maxfiy log RBAC scope (Q144) | EP-DIR-044 | ⭐ Q144 aniq |
| #35 | Energiya IoT / qo'lda + moliya tasdiq | EP-DIR-045 | ishonchli |
| #36 | Smena aralashish → 3 qabul qiluvchi + 30 daq | EP-DIR-075 | ishonchli |
| #37 | Karta-agregatdan Kanban "vazifa yubor" | EP-DIR-079 | ishonchli |
| #38 | 5S kamera→AI→sifat rahbar tasdiq | EP-DIR-085 | ishonchli |
| #39 | Paddon kritik → WMS alert, avto-PR yo'q | EP-DIR-081 | ishonchli |
| #40 | Ko'p yo'nalish → ASOSIY yo'nalishga to'liq | EP-DIR-083 | ishonchli |
| #41 | Murakkab buyurtma >15% → director alert | EP-DIR-084 | ishonchli |
| #42 | Milestone RBAC + undo + audit | EP-DIR-030 | ishonchli |
| #43 | Faqat O'ZGARGAN bo'limga imzo + diff | EP-DIR-050 | ishonchli |
| #44 | Yig'ma → LMS qayta-o'qish + HR razryad | EP-DIR-049 | *(taxminiy)* |
| #45 | "Vosita yo'q" bayroq → IT Coordination | EP-DIR-052 | ishonchli |
| #46 | Info-request muddat 24s + eskalatsiya | EP-DIR-078 (+072) | ⭐ matnda `EP-DIR-072` aniq |
| #47 | Chiqindi % ↔ Moliya makulatura → GL | EP-DIR-077 | ishonchli |
| #48 | Faqat tugagan "fakt", in-progress alohida | EP-DIR-053 (+036) | ishonchli |
| #49 | Haftalik hisobot yangilangan rejaga | EP-DIR-082 | ishonchli |
| #50 | Xato tasnifiga e'tiroz → corrected label | EP-DIR-076 | ishonchli |

### III.3 — Ziddiyat reestri (Z-01..Z-17 raqamlangan; jami 32 band-darajali)

> I QISM da **32 band** `⚠️ ZIDDIYAT` qatori olib yuradi (EP-DIR-001, 002, 003, 004, 007, 008, 013,
> 015, 016, 018, 019, 020, 024, 027, 028, 029, 032, 036, 038, 039, 045, 049, 050, 054, 062, 065,
> 069, 070, 073, 079, 080, 082). Quyida **17 tasi** — hal qilinishi qaror yoki arxitektura talab
> qiladiganlari — raqamlangan; qolgan 15 tasi band ichida o'z o'rnida qayd etilgan (jadval ostidagi
> "Qo'shimcha" bandiga qarang).

| # | Band | Ziddiyat turi | Qisqa tavsif | Hal |
|---|---|---|---|---|
| Z-01 | EP-DIR-001 | STALE-DOC | QISM A "vazn-config yo'q (SB0399)" vs jonli `state_thresholds.weight` + audit | kod ustun |
| Z-02 | EP-DIR-002/080 | Dublikat master-data | `state_thresholds` vs `kpi_definitions`/`kpi_score_weights` | ⭕ ochiq → `VR-DIR-I02` |
| Z-03 | EP-DIR-003 | STALE-DOC | QISM C "cron 06:00" vs jonli `@Cron('0 7 * * *')` | kod ustun |
| Z-04 | EP-DIR-004 | STALE-DOC + yaxlitlik | "log=0" vs 42 qator; "idempotent/kun" vs 7 qator/kun | ⭕ ochiq → `VR-DIR-I03` |
| Z-05 | EP-DIR-007 | Semantik drift | vizyon "to'liqsiz **teg**" vs kod `status='draft'` | ⭕ ochiq |
| Z-06 | EP-DIR-008 | Qamrov | IDOR yopildi, lekin **maydon-darajali** RBAC (director yig'ma ko'radi) yo'q | ⭕ ochiq |
| Z-07 | EP-DIR-013 | Qoida 10 (soxta javob) | 3 hardcode literal dashboardda haqiqiy raqam sifatida | ⭕ ochiq → `VR-DIR-I04` |
| Z-08 | EP-DIR-015 | STALE-DOC (yumshoq) | "jadval=0" vs 207 qator — **lekin test-artefakt** | ⭕ ochiq → `VR-DIR-I08` |
| Z-09 | EP-DIR-016 | Yarim-oqim | 99 orfan belgilangan, qo'lda relink vositasi yo'q | ⭕ ochiq → `VR-DIR-I05` |
| Z-10 | EP-DIR-018 | Sxema tanlovi | `weekly_breakdowns` jadval vs `weekly_tasks` JSONB | ⭕ ochiq → `VR-DIR-I06` |
| Z-11 | EP-DIR-019/032 | Ustun nomlash | hujjat `assignee_id`/`tskp_unit` vs jonli `assigned_user_id`/`tskp_measurement_unit` | jonli nom kanonik |
| Z-12 | EP-DIR-020 | STALE-DOC | QISM A "`stat_reglament` jadval yo'q (SB0372)" vs jonli 15 ustun | kod ustun |
| Z-13 | EP-DIR-024 | STALE-DOC (QISM D) | QISM D "ulush-cap yo'q" vs `card.repository.ts:293` `employeeActiveStakeSum()` real | kod ustun |
| Z-14 | EP-DIR-028 | STALE-DOC | QISM C "avto-cron yo'q" vs 07:00 + 08:00 ikki cron | kod ustun |
| Z-15 | EP-DIR-029 | ⭐ Qaror-ijro drifti | ShVB **4 daraja** vs A-default **5 daraja** — kod 5 bilan qurilgan, qaror ochiq | ⭕ ochiq |
| Z-16 | EP-DIR-038 | Hujjat xatosi | QISM C "downtime **reasons** jadval bor" vs `to_regclass` → **null** | kod ustun |
| Z-17 | EP-DIR-054 | Arxitektura shartnomasi | vizyon **event** so'raydi, ijro to'g'ridan `UPDATE` bilan bordi | ⭕ ochiq → `VR-DIR-I07` |

> Qo'shimcha (I QISM ichida qayd etilgan, reestrga alohida raqamlanmagan): EP-DIR-039 (A-System — strategik ochiq qaror), EP-DIR-045 (`mro_utility_readings` MRO modulida — ikkilanish), EP-DIR-049 (`ai_exam_enabled` bayrog'i mazmunsiz — Q-46 yarim-kod), EP-DIR-050 (hujjat "bo'lim"i ta'riflanmagan), EP-DIR-062/065 (yumshoq STALE-DOC raqam bo'yicha), EP-DIR-070 (Vysotskiy 4 vs `company_state_levels` 5), EP-DIR-073 (>5% farq-detektori yo'q), EP-DIR-079 (300ms stale siyosati yo'q), EP-DIR-082 (ikki-reja modeli yo'q).

### III.4 — Δ reestri: 2026-07-11 → 2026-08-07 (16 band, 11 commit)

| Commit | Tavsif | Tegilgan bandlar | Qurilish o'zgarishi |
|---|---|---|---|
| `a3a641a9` | `aiInsights: []` hardcode → real karta-AI agregat (`getCardAiAggregate`, `business_settings` ostonalar) | EP-DIR-025, **EP-DIR-026**, **EP-DIR-079** | EP-DIR-079: **Yo'q → Ha** |
| `91eaaa5b` | Karta-AI agregatiga "Kanban'ga vazifa yubor" tugmasi (`SendKanbanTaskDialog`) | EP-DIR-025, **EP-DIR-079** | `vision-1000 #37` yopildi |
| `f1caa337` | owner-summary kunlik digest FE'ga ulandi (`OwnerSummaryCard`); 08:00 cron tasdiqlandi | EP-DIR-025, **EP-DIR-028** | EP-DIR-028: **STALE-DOC → Ha** |
| `b546a7f7` | Kundalik carry-over 1-kunlik edi → surunkali-muammo zanjiri + `dir_chronic_days` + eskalatsiya | **EP-DIR-007**, **EP-DIR-010** | `vision-1000 #7` yopildi |
| `35b727f7` | ZNO/ZVS + rasporyazhenie SLA eskalatsiyasi tekis edi → 3 bosqichli (org-yurish + HR handoff) | **EP-DIR-072** | `vision-1000 #33` yopildi |
| `00cda627` | VIP belgilash PP navbatiga yetib bormasdi → `production_orders.is_urgent` | **EP-DIR-054** | funksional bo'shliq yopildi |
| `a66e840d` | `getPlanFact`/`getOrderProgress` JOIN i eskirgan `departments` ga edi → **hech qachon mos kelmasdi**; kanonik `org_departments` | EP-DIR-025, **EP-DIR-036**, **EP-DIR-053**, **EP-DIR-062** | ⚠️ 07-11 bahosi optimistik edi |
| `d23e650b` | Kundalik IDOR — istalgan `manager` boshqa kartaning yozuvini o'qiy/yoza olardi | **EP-DIR-008** | xavfsizlik |
| `dbb78bee` | `zno.controller.ts` `create`/`list` da **umuman** rol-gate yo'q edi | **EP-DIR-044**, EP-DIR-078 | xavfsizlik |
| `f938bad5` | HITL `approve()` faqat PENDING ni tekshirardi → so'rovchi o'z so'rovini tasdiqlay olardi (SoD) | **EP-DIR-030**, EP-DIR-078 | xavfsizlik |
| `d0f86666` + `ca379007` | coordination inline SQL → repo/service (Qoida 6/15); dokla/rasporyazhenie hard-delete → soft-delete | **EP-DIR-072**, **EP-DIR-078** | yaxlitlik |
| `7abcfa17` | `AlertFeed` tugmalari faqat `markRead` qilardi → real amal dispatch (Q-40) | **EP-DIR-005** | soxta-javob yopildi |

**Δ xulosasi:** 16 band tegilgan. **2 band holat o'zgartirdi** (EP-DIR-028 `STALE-DOC → Ha`, EP-DIR-079 `Yo'q → Ha`).
5 ta `vision-1000` operatsion talabi yopildi (#7, #21 qisman, #33, #37, va `aiInsights` orqali #104/#129).
4 ta xavfsizlik/yaxlitlik nuqsoni tuzatildi (IDOR, rol-gate, SoD, soxta-javob).
⚠️ Eng muhim topilma: `a66e840d` — 07-11 dagi "plan-fact SQL real" bahosi **noto'g'ri optimizm** edi;
JOIN eskirgan jadvalga ketgani uchun so'rov **jimgina bo'sh** qaytarardi (Q-40 "yashil lekin noto'g'ri").

