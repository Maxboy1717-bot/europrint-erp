# Moliya / GL / Kassir — Yagona Vizyon Registri (EP-FIN) — 2026-08-07

> **Manbalar:** `decisions/03-finance.md` (86 qaror) · `FULL-ITEM-LEVEL [Module-03]` (136 item) · `FULL-VISION-EXTRACTION` QISM A (50) / QISM C (86) / QISM D (25 hal-qilingan cross-ref) + I2-OMBOR·POS·KASSIR intervyu · `vision-1000-answers/03-finance.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida moliya kodiga tegan 7 commit qayta tekshirildi va jonli kodda spot-verify qilindi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-FIN-001..086)** | **86** |
| **Qaror holati:** ✅ javoblangan | 56 |
| **Qaror holati:** 🔵 ochiq | 30 |
| **Qurilish:** Ha | 19 |
| **Qurilish:** Qisman | 40 |
| **Qurilish:** Yo'q | 20 |
| **Qurilish:** STALE-DOC | 7 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| 2026-07-11 dan beri o'zgargan (Δ) | 10 (+1 II QISM da) |
| ⚠️ Manbalar orasida ziddiyat | 13 (+1 II QISM da = **14**) |
| **II QISM** — EP-kodsiz vizyon-bandlar (VR-FIN-I01..I10) | 10 (Ha 2 / Qisman 7 / Yo'q 1) |

> **Eslatma (qamrov):** bu fayl **I QISM** — 86 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-FIN-"` → **86**). **II QISM** = I2-OMBOR·POS·KASSIR intervyusidan
> kelgan, EP-kodi yo'q 10 kassir/naqd bandi (`VR-FIN-I01..I10`). **III QISM** = kesishuvchi
> bloklovchilar, egasi-DATA navbati va Δ-jurnali.
>
> **Eslatma (qurilish ≠ qaror):** ikki o'q mustaqil. Masalan EP-FIN-072 (naqd kassa limiti)
> qaror bo'yicha hamon 🔵 OCHIQ (limit QIYMATI egasidan), lekin qurilish bo'yicha mexanizm
> **Qisman** jonli (`cashier-hub.service.ts` `limitExceeded` + `cashier-cash-limit-alert.cron.ts`).
> Teskarisi ham bor: EP-FIN-033 (Режа қоғози) qaror bo'yicha ✅ JAVOBLANGAN, qurilish bo'yicha **Yo'q**
> (grep butun repo bo'yicha 0 fayl).
>
> **Eslatma (tipografiya):** `decisions/03-finance.md` da kirill `JAVОБЛАНГАН` varianti
> tekshirildi (`grep -c "JAVОБЛАНГАН"` → **0**); hammasi lotin `JAVOBLANGAN` (57 moslik = 56 band + 1 Xulosa qatori).
> `🔵 OCHIQ` → 31 moslik = 30 band + 1 Xulosa qatori. Sanoq: 56 ✅ + 30 🔵 = 86. ⚠️ Manba faylning
> **maydon nomlarida** kirill aralashmasi bor (`Манба`, `Ta'sир`, `Ta'sір`) — bu registrda lotinlashtirildi,
> band mazmuni o'zgartirilmadi.
>
> **Eslatma (mapping):** `FULL-ITEM-LEVEL [Module-03]` da **ikki xil raqamlash** bor va ~50 qator ikki
> agent tomonidan qoplangan. Kanonik moslik:
> `Item C1..C18` = `TASDIQ-2146 §03 #1..#18` = **EP-FIN-001..018**;
> `Item 69..136` = `TASDIQ-2146 §03 #19..#86` = **EP-FIN-019..086** (`Item N` → `EP-FIN-(N−50)`).
> `Item 1..50` = `vision-1000-answers #1..#50` — EP-kodsiz, mavzu bo'yicha ulanadi → `(taxminiy)` bilan belgilanadi.

---

## I QISM — EP-kodli qarorlar (EP-FIN-001..086)

### EP-FIN-001 · ZVS arizasi (haftalik byudjet so'rovi) ekrani
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — to'liq ekran (kiritish + ro'yxat + holat), ShVB blankiga mos. ShVB reglamentida ZVS yadro forma; FP-tsikl arizadan boshlanadi.
- **Manba:** SHvB-40 YO'NALISH 1 (ZVS forma + Kanban) + v1-A
- **Dalil (kod):** `apps/api/src/modules/director/presentation/zvs.controller.ts` + `.../application/zvs.service.ts` — `createZvsWithValidation` to'liq o'qildi (2026-07-11); FE `HRZvsPage.tsx`. `SELECT count(*) FROM zvs` → **0 qator** (qurilish bosqichi, jadval mavjud).
- **Bog'liqlik:** EP-FIN-003 (koordinatsiya), EP-FIN-007 (matritsa), EP-FIN-018 (byudjet-taqqos)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (3-savat), Org-karta (bo'lim), Byudjet
- **Xoch-havolalar:** `[Module-03] Item C1` · `TASDIQ-2146 §03 #1`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-002 · ZNO arizasi (majburiyat/to'lov so'rovi) ekrani
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — to'liq ZNO ekran (yetkazib beruvchi, summa, hujjat, ZVS ga bog'lab). ShVB: ZVS byudjet ajratadi, ZNO real to'lovni boshlaydi.
- **Manba:** SHvB-40 YO'NALISH 2 (ZNO entity + dashboard) + v1-A
- **Dalil (kod):** `apps/api/src/modules/director/` ostida `zno.controller.ts` + `zno.service.ts` + `zno.repository.ts` — uchalasi mavjud (grep 2026-07-11). `SELECT count(*) FROM zno` → **0 qator**.
- **Bog'liqlik:** EP-FIN-025 (ZNO→GL), EP-FIN-080 (navbat), EP-FIN-026 (hujjat-gate)
- **action:** CREATE
- **⤳ Ta'sir:** Kreditor (AP), MM (yetkazib beruvchi), Kassa/bank
- **Xoch-havolalar:** `[Module-03] Item C2` · `TASDIQ-2146 §03 #2`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-003 · ZVS/ZNO ni 3-savatli koordinatsiyaga ulash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — avtomatik koordinatsiya savatiga + 24/48 soat muddat. Hujjat org-sxema bo'yicha yuradi, sakramaydi.
- **Manba:** BARCHA_JAVOBLAR Org-7 §4/§7 (hujjat vert+goriz) + HR Q79-80 (avans ariza marshruti) + v1-A
- **Dalil (kod):** `zno-zvs-sla-escalation.cron.ts` to'liq o'qildi — `@Cron('15 * * * *')`, `UPDATE ... RETURNING` bilan real 24h(ZNO)/48h(ZVS) SLA-eskalatsiyasi + ikki tomonlama bildirishnoma (so'rovchi + keyingi daraja `resolveNextLevel`). Manba jadval "24/48h cron tasdiqlanmadi" degan edi — **eskirgan**.
- **Nima yetishmaydi:** "3-savatli" Coordination-inbox marshruti alohida tasdiqlanmagan (faqat muddat-eskalatsiya tomoni isbotlangan).
- **Bog'liqlik:** EP-FIN-010 (eskalatsiya), Coordination moduli (3-savat)
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, NTF (eslatma), Org-karta (marshrut)
- **Xoch-havolalar:** `[Module-03] Item C3` · `TASDIQ-2146 §03 #3` · `[Module-03] Item C10` (bir xil cron)
- **Δ 2026-07-11→08-07:** —

### EP-FIN-004 · 4-hisob ajratish (MAIN / TAX / HEAD / WORKING)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'rttala hisob alohida + har biri balans/harakat. ShVB poydevori (Справка о счетах).
- **Manba:** SHvB-40 YO'NALISH 3 (AccountType enum MAIN/TAX/HEAD/WORKING_CAPITAL) + v1-A
- **Dalil (kod):** `income-split.service.ts` — `FundKey` konstantalar (BHMS: 9010/6310/8500/5110); `finance-accounting.service.ts:66`. `SELECT count(*) FROM income_split_config` → **4 qator** (4-fond konfiguratsiyasiga mos).
- **Nima yetishmaydi:** "alohida balans" (har fond bo'yicha alohida qoldiq/harakat ko'rinishi) dashboard/query topilmadi — faqat teglash mexanizmi tasdiqlangan.
- **Bog'liqlik:** EP-FIN-005 (avto-taqsim), EP-FIN-046 (pul-oqim indikatori MAIN+WORKING)
- **action:** CREATE
- **⤳ Ta'sir:** GL, Kassa/bank, Dashboard
- **Xoch-havolalar:** `[Module-03] Item C4` · `TASDIQ-2146 §03 #4` · `EXTRACTION QISM A #46` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-FIN-005 · Tushumni 4-hisobga avtomatik taqsimlash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik foiz bilan taqsim (intizom kafolati). ShVB ruhi avtomatga moyil, lekin foiz-qiymat va trigger nuqtasi egasidan.
- **Manba:** v1-A (A-default) — egasidan tasdiq kutiladi
- **Dalil (kod):** `income-split.service.ts` `splitAndPost` → balansli journal → `entries`; foizlar `income_split_config` dan (4 qator jonli).
- **Nima yetishmaydi:** foiz QIYMATLARI egasi-tasdig'idan o'tmagan (Q-40); versiyalash/immutable tarix yo'q (EP-FIN-006 bilan bir); `SdOrderPaidEvent`/`CashReceivedEvent` dan atomik trigger tasdiqlanmagan (`entries` = 6 qator, yo'lni isbotlash uchun kam).
- **Bog'liqlik:** EP-FIN-004, EP-FIN-006, EP-FIN-022 (kanonik GL)
- **action:** EVENT
- **⤳ Ta'sir:** Kassa (kirim trigger), GL, 4-hisob
- **Xoch-havolalar:** `[Module-03] Item C5` · `TASDIQ-2146 §03 #5` · `[Module-03] Item 1/Item 2` *(taxminiy)* · `EXTRACTION QISM A #1/#2/#46` · `vision-1000 #1/#2`
- **⚠️ ZIDDIYAT:** QISM A #2/#46 (RECON SB0799/SB0809 STILL-OPEN) — "4-hisob taqsimlash mexanizmi **umuman yo'q**, ShVB poydevori qurilmagan" ╳ QISM C #4/#5 + Item C4/C5 — "`income-split.service.ts` `splitAndPost` real, `income_split_config` = 4 qator". Yangi + kod-dalilli manba ustun → **teglash+posting mexanizmi jonli**, lekin QISM A haq bo'lgan qismi: alohida fond-balans ko'rinishi va versiyali foiz-konfig hamon yo'q.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-006 · Taqsim foizlarini kim belgilaydi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — faqat egasi (direktor) o'zgartiradi, qolganlar ko'radi. Pul taqsimoti = eng xavfli sozlama.
- **Manba:** v1-A (A-default) + karta-model (vakolat kartaga)
- **Dalil (kod):** `income_split_config` jadval mavjud, **4 qator** jonli (`node _audit/q.cjs`). Konfig-yangilash endpointida egasi-only RBAC gate izlanmagan/topilmagan.
- **Nima yetishmaydi:** (a) egasi-only yozish cheklovi (RBAC guard) tasdiqlanmagan; (b) o'zgargan foizni faqat KEYINGI davrlarga qo'llash + immutable versiya tarixi (vision-1000 #2) umuman qurilmagan — `effective_from`/versiya ustuni yo'q.
- **Bog'liqlik:** EP-FIN-005, EP-FIN-030 (SoD), EP-FIN-064 (davr qulfi)
- **action:** UPDATE
- **⤳ Ta'sir:** RBAC (egasi-only), 4-hisob, Audit-log
- **Xoch-havolalar:** `[Module-03] Item C6` · `TASDIQ-2146 §03 #6` · `[Module-03] Item 2` *(taxminiy)* · `vision-1000 #2`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-007 · Tasdiqlash matritsasi: summalik bosqichlar (500k / 5M / direktor)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 3 bosqich (bo'lim ≤500k / Рек.Совет ≤5M / direktor >5M) avtomatik tanlanadi. ShVB reglament aniq chegara beradi.
- **Manba:** SHvB-40 YO'NALISH 6 (approval-matrix getRequiredLevel) + v1-A
- **Dalil (kod):** `zvs.service.ts` to'liq o'qildi — `computeLevelFromMatrix()` endi DB-asosli (`approval_matrix_config`, **3 qator** jonli), `HARDCODE_FALLBACK_MATRIX` (500k/5M) faqat DB bo'sh/erishib bo'lmas bo'lganda. Manba jadval "computeLevel satr:16-20 (faqat hardcode)" degan edi — kod `b4e76a72` bilan qayta yozilgan, **iqtibos eskirgan**; xatti-harakat (3 bosqich) hamon amal qiladi.
- **Bog'liqlik:** EP-FIN-008 (sozlanadigan chegara), EP-FIN-009 (karta-resolver)
- **action:** APPROVE
- **⤳ Ta'sir:** ZVS/ZNO, Coordination (Рек.Совет), Org-karta
- **Xoch-havolalar:** `[Module-03] Item C7` · `TASDIQ-2146 §03 #7`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-008 · Tasdiqlash chegaralari sozlanadigan bo'lsinmi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — sozlamada ekrandan o'zgartiriladigan chegara (inflyatsiya bilan moslashuvchan, dasturchi kerak emas).
- **Manba:** v1-A (A-default)
- **Dalil (kod):** `zvs.service.ts` `getMatrix()` → `this.repo.getZvsApprovalMatrix()` → `approval_matrix_config` (**3 qator**, 3 tasdiq darajasiga mos). Commit `b4e76a72` "summa-tasdiq darvozasi sozlanadigan qildi (2.15)" — TASDIQ sanasidan (2026-06-27) keyin. Manba jadval "chegara KODDA qotirilgan" degan edi — **to'g'ridan-to'g'ri rad etildi**.
- **Nima yetishmaydi:** `approval_matrix_config` ni tahrirlash UI si mustaqil tasdiqlanmagan (faqat o'qish yo'li isbotlangan).
- **Bog'liqlik:** EP-FIN-007
- **action:** UPDATE
- **⤳ Ta'sir:** Approval-matrix, Settings, Egasi (vakolat)
- **Xoch-havolalar:** `[Module-03] Item C8` · `TASDIQ-2146 §03 #8`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-009 · Tasdiqlovchini lavozimga emas, kartaga bog'lash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — tasdiqlovchi = karta (lavozim), egasi avtomatik topiladi. Karta-model poydevori: odam almashsa karta qoladi.
- **Manba:** Karta-model vizyon (MASTER) + BARCHA_JAVOBLAR Org-7 §6 (rol kartadan) + v1-A
- **Dalil (kod):** `zvs.service.ts:157-184` — yangi `verifyOrgChainApprover()` metodi tasdiqlovchining topshiruvchining haqiqiy `org_departments` zanjirida ekanini tekshiradi (`resolveOrgChainForDepartment`), ya'ni real karta/org-resolver. Manba jadval "Rol-asosli, karta-resolver emas" degan edi — **rad etildi**.
- **Nima yetishmaydi:** zanjir hal bo'lmasa rol-only tasdiqqa qaytadi (`chain.length === 0 → Ok(true)`), va `org_departments` ning faqat **18/143** tasida `head_user_id` bor → gate amalda ko'p hollarda inert.
- **Bog'liqlik:** EP-FIN-032 (karta-limit), Org `head_user_id` backfill (egasi-DATA)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (resolver), Approval, Coordination
- **Xoch-havolalar:** `[Module-03] Item C9` · `TASDIQ-2146 §03 #9` · `[Module-03] Item 4/Item 34` *(taxminiy)* · `EXTRACTION QISM A #4/#34`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-010 · Tasdiqlash muddati o'tib ketsa nima bo'ladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — yuqori bosqichga avtomatik eskalatsiya + ogohlantirish. 460 javob: eslatma 2x → eskalatsiya → HR/rahbar xabardor.
- **Manba:** BARCHA_JAVOBLAR HR Q122 (2x eslatma + eskalatsiya) + v1-A
- **Dalil (kod):** `zno-zvs-sla-escalation.cron.ts` — to'liq, ishlaydigan implementatsiya: `@Cron('15 * * * *')`, `UPDATE zvs SET escalated_at=NOW() ... WHERE status='pending' AND escalated_at IS NULL AND created_at + '48 hours' < NOW()`, ikki tomonlama bildirishnoma. Manba jadval "cron tasdiqlanmadi" degan edi — **rad etildi**.
- **Bog'liqlik:** EP-FIN-003 (bir xil cron), EP-FIN-009 (`resolveNextLevel` → `head_user_id`)
- **action:** CRON
- **⤳ Ta'sir:** Coordination, NTF, Org-karta (keyingi daraja)
- **Xoch-havolalar:** `[Module-03] Item C10` · `TASDIQ-2146 §03 #10` · `[Module-03] Item 16` *(taxminiy — 4h/8h/3-marta bosqichli variant)*
- **Δ 2026-07-11→08-07:** —

### EP-FIN-011 · Haftalik FP-tsikl jadvali (Se/Ch/Pa/Du)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram eslatma (cron bor). ShVB reglament ritmi.
- **Manba:** SHvB-40 YO'NALISH 4 (fp-cycle.cron Se/Ch/Pa/Du) + v1-A
- **Dalil (kod):** `fp-cycle-cron.service.ts` — 4×`@Cron`, `timeZone: Asia/Tashkent` (Seshanba ZVS-kuni, Chorshanba FP-kuni, Payshanba Bank-kuni, Dushanba Naqd-kuni), har biri `notifyRoles` chaqiradi.
- **Bog'liqlik:** EP-FIN-012 (kunlarni sozlash), EP-FIN-013 (kanallar), EP-FIN-019 (davr-jamlanma)
- **action:** CRON
- **⤳ Ta'sir:** NTF/Telegram, ZVS/ZNO, Dashboard timeline
- **Xoch-havolalar:** `[Module-03] Item C11` · `TASDIQ-2146 §03 #11`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-012 · FP-tsikl kunlarini egasi o'zgartira oladimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ekrandan kunlarni o'zgartirish mumkin (bank/bayram kuniga moslashuvchan).
- **Manba:** v1-A (A-default)
- **Dalil (kod):** `fp-cycle-cron.service.ts` — `@Cron('0 9 * * 2')` KODDA qotirilgan, sozlash UI yo'q. Grep `bank.*holiday|bayram|ish.kun|business.day` (case-insensitive) `apps/api/src/modules/finance` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** kun/vaqtni `@Cron` satridan DB-konfigga ko'chirish (yoki `SchedulerRegistry` bilan qayta ro'yxatdan o'tkazish) + sozlash ekrani; bayram-kalendari master-jadvali (egasi-DATA: O'zbekiston bank/milliy bayramlari ro'yxati).
- **Bog'liqlik:** EP-FIN-011 (bir xil cron fayli)
- **action:** UPDATE
- **⤳ Ta'sir:** FP-cron, Settings
- **Xoch-havolalar:** `[Module-03] Item C12` · `TASDIQ-2146 §03 #12` · `[Module-03] Item 5` *(taxminiy)* · `EXTRACTION QISM D #5` · `vision-1000 #5`
- **⚠️ ZIDDIYAT:** Item C12/Item 5 — "Finance'da ish-kun/bayram surish logikasi umuman yo'q (Yo'q)" ╳ QISM D #5 (hal qilingan) — "`common/time/tashkent-time.service.ts:122` `addBusinessDays()` SAT/SUN o'tkazadi, ish-kun surish **REAL**". Ikkalasi ham to'g'ri, chegara boshqacha: ish-kun surish **Finance'dan tashqarida** (`common/time`) mavjud lekin FP-cronga ulanmagan; **DB bayram-kalendari** (Navruz/Mustaqillik) hech qayerda yo'q (fayl izohi: "if/when we add public holiday support ... extend with a holiday list").
- **Δ 2026-07-11→08-07:** —

### EP-FIN-013 · FP-tsikl eslatmalari qayerga boradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Telegram + ERP bildirishnoma birga. 460 javob: ko'p joyda "Telegram + ERP ikkalasi".
- **Manba:** BARCHA_JAVOBLAR HR Q113/Q55 (Telegram+ERP) + SHvB-40 YO'NALISH 38 + v1-A
- **Dalil (kod):** `fp-cycle-cron.service.ts` `notify→roles` + `financial-reports-telegram.service.ts`; Telegram tomoni mustaqil tasdiqlangan — `bot.helpers.ts:151-164` real DB-asosli `/zvs_status` buyrug'i.
- **Bog'liqlik:** EP-FIN-011, EP-FIN-028 (Telegram buyruqlari)
- **action:** CRON
- **⤳ Ta'sir:** NTF, Telegram-bot, Org-karta (routing)
- **Xoch-havolalar:** `[Module-03] Item C13` · `TASDIQ-2146 §03 #13`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-014 · To'lanmagan schyotlar yoshi (aging) ko'rinishi (0-30/31-60/61-90/90+)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq aging (4 guruh + jami + eng eski yuqorida). ShVB "Список неоплаченных счетов".
- **Manba:** SHvB-40 YO'NALISH 5 (unpaid-invoices aging rang-kodli) + v1-A
- **Dalil (kod):** `finance-ap.service.ts:52-57` — real bucket hisobi (`getAgingBuckets()`, `recalculateAging()` — to'lanmagan `purchase_invoices` ni `due_date` bo'yicha current/31-60/61-90/91-120/120+ ga ajratib, aging jadvalini atomik almashtiradi); FE `ArApAging.tsx`. `SELECT count(*) FROM ap_aging_buckets` → **0 qator**.
- **Nima yetishmaydi:** bucket jadvali jonli bo'sh — hisoblash kodi real, lekin hech qanday aging natijasi saqlanmayapti (`purchase_invoices`/`vendor_invoices` = 0).
- **Bog'liqlik:** EP-FIN-015, EP-FIN-016, EP-FIN-054 (yetkazuvchi muddat-profili), EP-FIN-037
- **action:** READ
- **⤳ Ta'sir:** Kreditor/debitor, ZNO, Dashboard
- **Xoch-havolalar:** `[Module-03] Item C14` · `TASDIQ-2146 §03 #14` · `[Module-03] Item 6` *(taxminiy)* · `vision-1000 #6`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-015 · Aging — debitor (bizga qarz) va kreditor (biz qarzdor) alohidami
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ikki alohida ekran (debitor / kreditor), har birida aging (aralashmaydi). ShVB unpaid asosan kreditor; debitor SD ga ulanadi.
- **Manba:** v1-A (A-default) + SHvB-40 YO'NALISH 5 (debtorList)
- **Dalil (kod):** `apps/api/src/modules/finance/application/` da `finance-ap.service.ts` va `finance-ar.service.ts` alohida fayllar; har birining o'z repo+controlleri (`finance-ap.repository.ts`, `finance-ar.repository.ts`, `finance-ap.controller.ts`, `finance-ar.controller.ts`) — hammasi tasdiqlangan.
- **Nima yetishmaydi:** FE ekranlari (`AccountsPayable.tsx` / `AccountsReceivable.tsx`) mustaqil ochib tekshirilmagan; jonli aging datasi yo'q.
- **Bog'liqlik:** EP-FIN-014
- **action:** READ
- **⤳ Ta'sir:** SD (debitor), MM (kreditor), Aging
- **Xoch-havolalar:** `[Module-03] Item C15` · `TASDIQ-2146 §03 #15`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-016 · Eski qarz haqida avtomatik ogohlantirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — kunlik avtomatik alert (90+ kun = direktorga ham). ShVB: escalateToDirector + sendReminder.
- **Manba:** SHvB-40 YO'NALISH 5 (sendReminder/escalateToDirector) + v1-A
- **Dalil (kod):** `apps/api/src/modules/finance/financial-reports/cron/financial-reports-alerts.cron.ts:81` — `this.query.getOverdueDebtAlerts()` chaqiruvi real (o'qildi).
- **Nima yetishmaydi:** "90+ → direktorga" maxsus marshrutlash mantiqi topilmadi (eskalatsiya-manzili kuzatilmagan); asos jadval `ap_aging_buckets` = 0 qator, ya'ni alert uchun jonli ma'lumot yo'q.
- **Bog'liqlik:** EP-FIN-014 (bucketlar)
- **action:** CRON
- **⤳ Ta'sir:** NTF, Aging, Org-karta (direktor)
- **Xoch-havolalar:** `[Module-03] Item C16` · `TASDIQ-2146 §03 #16`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-017 · Byudjet rejalash darajasi (umumiy ╳ bo'lim/karta)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bo'lim (va karta) bo'yicha byudjet, ZVS shunga taqqoslanadi. Karta-model: har karta o'z byudjet/limitini biladi.
- **Manba:** Karta-model vizyon (MASTER) + v1-A
- **Dalil (kod):** `SELECT count(*) FROM budgets` / `budget_lines` / `budget_controls` → **uchalasi ham 0 qator**. Sxema va (manba iqtibosiga ko'ra) FE mavjud, lekin butunlay bo'sh.
- **Nima yetishmaydi:** muhandislik to'sig'i yo'q — bu **egasi-DATA** vazifasi: bo'lim/karta darajasidagi byudjet raqamlarini egasi/moliya bo'limi kiritishi kerak.
- **Bog'liqlik:** EP-FIN-018, EP-FIN-019, EP-FIN-032, EP-FIN-066
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (limit), ZVS, Xarajat-markaz
- **Xoch-havolalar:** `[Module-03] Item C17` · `TASDIQ-2146 §03 #17`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-018 · ZVS so'rovini byudjetga taqqoslash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avtomatik taqqoslash + qolgan summa + oshsa ogohlantirish. Tasdiqlovchi ko'r-ko'rona tasdiqlamaydi.
- **Manba:** SHvB-40 YO'NALISH 6 (summa→matritsa xabar) + EP-FIN-017 byudjet + v1-A
- **Dalil (kod):** `zvs.service.ts` `createZvsWithValidation` to'liq o'qildi — yaratish yo'lida **hech qanday byudjet-taqqos/rezervatsiya chaqiruvi yo'q** (faqat maqsad/summa validatsiyasi + daraja hisobi). `zvs.repository.ts:19-21` `createZvs` = oddiy `INSERT INTO zvs (... status 'pending')`; `SELECT FOR UPDATE`/`reserveBudget` yo'q. `budget_controls` = 0 qator.
- **Nima yetishmaydi:** `createZvsWithValidation` ichida byudjet-qoldiq tekshiruvi + pessimistik rezerv (vision-1000 #3); byudjet ma'lumotining o'zi (EP-FIN-017).
- **Bog'liqlik:** EP-FIN-017 (bo'sh byudjet jadvallari), EP-FIN-001
- **action:** READ
- **⤳ Ta'sir:** Byudjet, ZVS, Approval
- **Xoch-havolalar:** `[Module-03] Item C18` · `TASDIQ-2146 §03 #18` · `[Module-03] Item 3` *(taxminiy)* · `EXTRACTION QISM D #3` · `vision-1000 #3`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-019 · Byudjet davri (haftalik/oylik/yillik)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — haftalik asosiy + oylik/yillik jamlanma. ShVB haftalik FP ritmiga mos.
- **Manba:** SHvB-40 (FP haftalik) + v1-A
- **Dalil (kod):** Ikki mustaqil tekshiruv qarama-qarshi baho bergan (Yo'q ╳ Qisman); `fp-cycle-cron.service.ts` to'g'ridan-to'g'ri o'qish bilan hal qilindi — fayl **sof haftalik bildirishnoma cron**i (har kun faqat `notifyRoles` chaqiradi), hech qanday davr-agregatsiya/rollup mantiqi yo'q. `budgets` = 0, `accounting_periods` = 0.
- **Nima yetishmaydi:** hafta→oy→yil rollup so'rovi (`budgets`/`budget_lines` ustidan); FP-cron buni bajara olmaydi (funksional jihatdan aloqasiz).
- **Bog'liqlik:** EP-FIN-017/018 (bo'sh byudjet jadvallari), EP-FIN-064 (`accounting_periods`)
- **action:** READ
- **⤳ Ta'sir:** Byudjet, FP-tsikl, Hisobotlar
- **Xoch-havolalar:** `[Module-03] Item 69` · `TASDIQ-2146 §03 #19`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-020 · Kassa (naqd) hisobi tizimda
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — kassa to'liq ERP ichida (har kirim/chiqim + kunlik qoldiq). 460 javob: 1C yo'q, ERP moliya yetarli; pul harakati 4-hisob/aging bilan bog'lanadi.
- **Manba:** BARCHA_JAVOBLAR POS Q44 (1C yo'q, ERP FI) + v1-A
- **Dalil (kod):** ⚠️ Ikki oldingi tekshiruv **noto'g'ri jadvalni** so'rgan (`cash_registers`/`cash_transactions` — ikkalasi ham bo'sh/ishlatilmaydi). `cashier-hub.service.ts` to'liq o'qib hal qilindi: jonli jadvallar = **`cashier_shifts` (1 qator)** va **`cashier_movements` (0 qator)**. Servis to'liq kirim/chiqim+qoldiq tsiklini bajaradi: `openShift`, `recordMovement` (PIN-gated, `GlPostingService` orqali real GL yozadi), `closeShift` (X/Z solishtirish: kutilgan = ochilish+kirim−chiqim, farq), `getShiftLedger` (har satr uchun yuguruvchi qoldiq, valyuta/FX-xabardor), `getDailyReportPayload` + `cashier-hub-pdf.service.ts` (`pdf-lib` `PDFDocument.create()` bilan real Z-hisobot PDF).
- **Bog'liqlik:** EP-FIN-021, EP-FIN-057, EP-FIN-072, EP-FIN-049
- **action:** CREATE
- **⤳ Ta'sir:** GL, 4-hisob, POS (kirim/chiqim)
- **Xoch-havolalar:** `[Module-03] Item 70` · `TASDIQ-2146 §03 #20` · `[Module-03] Item 31` *(taxminiy — smena-yopish trigger)*
- **Δ 2026-07-11→08-07:** —

### EP-FIN-021 · Kassa va POS/ombor bilan bog'lanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — avtomatik bog'lanish: POS/ombor harakati kassa+GL ga o'zi yoziladi. POS Q43: har harakatda Debit/Credit avtomatik.
- **Manba:** BARCHA_JAVOBLAR POS Q43 (avto GL) + Q58 (real-time REST MM/FI/MES/HR/QC) + v1-A
- **Dalil (kod):** `cashier-podotchet.service.ts:152` — `issueAdvance()` ochiq-oydin `this.hub.recordMovement(...)` ni chaqiradi, izoh: "Cash-out + GL via KAS-1 (PIN-gated, owner #8; posts Dr 4000 AR / Cr 5010 Cash to `entries`)" — real, PIN-gated, idempotent naqd-harakat→kanonik-GL quvuri, kod darajasida uchma-uch tasdiqlangan.
- **Bog'liqlik:** EP-FIN-020, EP-FIN-022 (kanonik daftar), EP-FIN-049
- **action:** EVENT
- **⤳ Ta'sir:** POS/WMS, GL, Kassa
- **Xoch-havolalar:** `[Module-03] Item 71` · `TASDIQ-2146 §03 #21` · `[Module-03] Item 12` *(taxminiy)* · `EXTRACTION QISM A #12` · `vision-1000 #12`
- **⚠️ ZIDDIYAT:** QISM C #21 + Item 71 — "Ha, kanonik `entries` ga yozadi" ╳ QISM A #12 (RECON SB0817 STILL-OPEN) — "POS→GL **`pos_gl_postings` subledger** orqali, kanonik `entries` emas; ikki dedup-kalit → **double-post xavfi**". Ikkalasi ham qisman haq: **kassir-tomon** (KAS-1 podotchet/naqd) kanonik `entries` ga yozadi, **POS-tomon** (`auto-gl-posting.service.ts` + `gl-posting-log.repository.ts`) parallel subledger yo'lida qoladi. Ikki-olam xavfi bandning "Ha" bahosini toraytiradi.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-022 · GL-buxgalteriya: yagona daftar (canonical)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — yagona kanonik GL (kassa, ZNO, payroll hammasi shunga yozadi). Oltin-ip vizyoni "uzilishsiz GL"; memory: kanonik = `gl_entries` (gl_journal_entries SAP #76 da migratsiya).
- **Manba:** MASTER oltin-ip (LOYIHA-BITGAN §A.2) + memory GL-decision (kanonik gl_entries) + v1-A
- **Dalil (kod):** `grep -rl "postJournal|GlPostingService" apps/api/src/modules` → **6 ta yuqori-daraja modul** (compatibility, finance, hr, pos, remaining, sd) — modullararo ulanish kod darajasida real. `entries` = 6 qator; `gl_lines` = 0, `gl_journal_entries` = 0 (eski yo'l uxlab yotibdi, SAP#76 TAQIQ hurmat qilingan). **Δ:** `633bc74b` — 3 ta eskirgan `gl_entries`/`gl_lines` **o'quvchi** kanonik `entries` ga yo'naltirildi (reports-hub `glEntries.total` doim 0 edi; accounting dashboard stat `gl_lines` dan olinardi — 0 yozuvchi; finance-ai anomaliya-aniqlash `gl_entries` ni o'qib jimgina bo'sh ko'rardi).
- **Nima yetishmaydi:** POS tomonining parallel subledgeri (EP-FIN-021 ZIDDIYAT) hamon kanonik daftardan tashqarida.
- **Bog'liqlik:** EP-FIN-021, EP-FIN-023, EP-FIN-024, EP-FIN-025, EP-FIN-064
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA moliya-yozadigan modul (POS/Payroll/ZNO/SD/MM)
- **Xoch-havolalar:** `[Module-03] Item 72` · `TASDIQ-2146 §03 #22` · `[Module-03] Item 46` *(taxminiy)*
- **Δ 2026-07-11→08-07:** `633bc74b` — 3 ta muzlab qolgan `gl_entries`/`gl_lines` o'quvchi `entries` ga ko'chirildi (jonli 0-ko'rsatkich bug'i yopildi); shu commit'da yetishmayotgan `4200` (ADVANCE mapping) hisobi seed qilindi — avval har ADVANCE tasdig'ining GL-postingi `resolveAccountIds()` da jimgina yiqilardi.

### EP-FIN-023 · Buxgalteriya yozuvi har doim ikki tomonlama (debet/kredit)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — doim ikki tomonlama, balanslashmasa yozuv qabul qilinmaydi. POS Q43 Debit/Credit; buxgalteriya asosiy qonuni.
- **Manba:** BARCHA_JAVOBLAR POS Q43 (Debit/Credit) + v1-A
- **Dalil (kod):** `gl-posting.service.ts:177-202` (shuningdek 151-155) — `totalDebitCents !== totalCreditCents` bo'lsa "Double-entry validation failed" xatosi; `totalDebit > 0` ham majburiy. Ikki mustaqil tekshiruvda to'g'ridan-to'g'ri kod o'qish bilan tasdiqlangan.
- **Bog'liqlik:** EP-FIN-022, EP-FIN-036 (COA hisob topilmasa halol-fail)
- **action:** CREATE
- **⤳ Ta'sir:** GL (invariant), barcha posting
- **Xoch-havolalar:** `[Module-03] Item 73` · `TASDIQ-2146 §03 #23`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-024 · Hisoblar rejasi (COA) standarti (BHMS ╳ ShVB sodda)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — milliy BHMS hisoblar rejasi + ShVB 4-hisob ustiga qo'yiladi (rasmiy + boshqaruv birga). Memory: CoA seed 42 BHMS allaqachon bor.
- **Manba:** memory master-data (CoA 42 BHMS seed) + v1-A
- **Dalil (kod):** `SELECT count(*) FROM accounts` → **42 qator** (jonli, seed qilingan), iqtibos qilingan BHMS rejaga aynan mos; FE `ChartOfAccounts.tsx`; `income-split.service.ts` `FundKey` 4-fond tuzilmasini tasdiqlaydi. **Δ:** `gl-accounts.constants.ts` da 2026-07-13 egasi-intervyusi bo'yicha **5 yangi hisob** qo'shildi (jonli o'qildi 2026-08-07): `PRODUCTION_LOSS 9520`, `OTHER_INCOME_WASTE_PAPER 9820`, `MARKETING_EXPENSE 9210`, `REFERRAL_BONUS_EXPENSE 9220`, `GOODS_IN_TRANSIT 1020`; `633bc74b` da yana `4200` (ADVANCE) seed qilindi.
- **Bog'liqlik:** EP-FIN-004 (4-fond), EP-FIN-050 (xarajat toifalari), EP-FIN-036 (halol-fail)
- **action:** CREATE
- **⤳ Ta'sir:** GL, 4-hisob, Soliq-hisobot
- **Xoch-havolalar:** `[Module-03] Item 74` · `TASDIQ-2146 §03 #24`
- **Δ 2026-07-11→08-07:** `4241faa0` (5 hisob: 9520/9820/9210/9220/1020) + `633bc74b` (`4200` seed) — COA 42 dan kengaydi; `REFERRAL_BONUS_EXPENSE 9220` **ataylab ulanmagan** (mos to'lov-yo'li yo'q, Q-40).

### EP-FIN-025 · Tasdiqlangan ZNO avtomatik GL yozuviga aylansinmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — avtomatik GL yozuvi (tasdiq→to'lov→daftar). POS Q43 avto-GL ruhi; uzluksiz zanjir.
- **Manba:** BARCHA_JAVOBLAR POS Q43 (avto GL) + v1-A
- **Dalil (kod):** `zno` = 0 qator. `gl-posting.service.ts` `postJournal` real, chaqiriladigan GL-yozish primitivi, **lekin ZNO-tasdiq→GL listeneri yo'q**: `zno.service.ts` to'liq o'qildi — `approveZnoWithAuth` (satr 46) faqat `this.repo.approveZno(...)` ni chaqiradi, faylda `GlPostingService` importi umuman yo'q. Alohida (aloqasiz) oqim — `finance-actions.service.ts:37-55 verifyPayment()` — `glPostingService.postCustomerPayment(...)` ni chaqiradi, ammo bu **mijoz-to'lovi**, ZNO-tasdig'i emas.
- **Nima yetishmaydi:** `approveZnoWithAuth` → `GlPostingService` ulanishi (event yoki bevosita chaqiruv); ZNO jonli ma'lumoti.
- **Bog'liqlik:** EP-FIN-002 (ZNO ekrani), EP-FIN-022 (GL dvigateli — tayyor), EP-FIN-080 (navbat)
- **action:** EVENT
- **⤳ Ta'sir:** ZNO, GL, Kassa/bank
- **Xoch-havolalar:** `[Module-03] Item 75` · `TASDIQ-2146 §03 #25`
- **⚠️ ZIDDIYAT:** kod↔izoh drifti (jonli tekshirildi 2026-08-07): `finance-actions.service.ts:29-34` JSDoc hamon "*If the GL post fails we still return the payment row (soft-fail logged) so the status flip is not rolled back*" deydi, lekin `fcf401fa` dan keyin kod **kompensatsiya qiladi** va `Err('EXTERNAL_5XX')` qaytaradi. Izoh yangilanmagan — keyingi o'quvchini chalg'itadi.
- **Δ 2026-07-11→08-07:** 3 ta commit shu bandning to'lov↔GL oynasini mustahkamladi: `fcf401fa` — `verifyPayment` GL-posting yiqilsa to'lovni oldingi holatiga qaytaradi (CTE bilan tutilgan `previous_status`), revert ham yiqilsa CRITICAL log; `285e2e73` — `approvePayment` endi haqiqiy `finance_payments` ni yangilaydi (avval yetim `customer_payments` ga `UPDATE` qilib, shartsiz `Ok` qaytarardi — jimgina no-op); `0e068ec5` — `sd_payments.id` (uuid) `Number()` orqali `NaN→0` ga aylanib har to'lovning GL referensi `CP-0` ga tushib qolardi, natijada idempotentlik tekshiruvi birinchidan keyingi HAR to'lovni "dublikat" deb o'tkazib yuborardi.

### EP-FIN-026 · To'lov so'roviga hujjat (chek/shartnoma) biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — hujjat biriktirish majburiy (ma'lum summadan yuqorida). Оргполитика: og'zaki ma'lumot qaror asosi emas (v2 Q16 bilan bir).
- **Manba:** kitob оргполитика (v2 Q16) + BARCHA_JAVOBLAR HR Q77 (hamma hujjat ERP) + v1-A
- **Dalil (kod):** `zvs.service.ts` `createZvsWithValidation` to'liq o'qildi — faqat `purpose`/`amount` validatsiya qilinadi; `attachment`/`document_url`/`receipt_url` maydoni ham, gate tekshiruvi ham **yo'q**. `storage.controller.ts` umumiy rol-gated fayl-saqlash/yuklab-olish modulini tasdiqlaydi, lekin hujjatsiz ZVS/ZNO topshirishni hech narsa bloklamaydi.
- **Nima yetishmaydi:** kod darajasidagi invariant: hujjat biriktirilmagan so'rov topshirilmasin (summa chegarasidan yuqorida).
- **Bog'liqlik:** EP-FIN-048 (aynan bir xil talab — dublikat)
- **action:** CREATE
- **⤳ Ta'sir:** ZNO, Hujjat-ombori, Audit
- **Xoch-havolalar:** `[Module-03] Item 76` · `TASDIQ-2146 §03 #26` · `[Module-03] Item 98` (dublikat)
- **Δ 2026-07-11→08-07:** —

### EP-FIN-027 · Kompaniya holati ko'rsatkichiga moliyani ulash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — moliya ko'rsatkichlari holat formulasiga kiradi (kam kassa/katta qarz = XAVF). ShVB holat-formulasi boshqaruv paneliga ulanadi.
- **Manba:** SHvB-40 YO'NALISH 13 (company-state KPI) + LOYIHA-BITGAN §A.3 + v1-A
- **Dalil (kod):** `company-state.service.ts:242` → `cash_flow: 0.30,` — to'g'ridan-to'g'ri o'qish bilan tasdiqlangan; holat formulasidagi vaznli `cash_flow` metrikasiga aynan mos; snapshot cron mavjud.
- **Bog'liqlik:** EP-FIN-046 (4-hisob filtri — hozircha yo'q), EP-FIN-082 (egasi dashboardi)
- **action:** EVENT
- **⤳ Ta'sir:** Director (holat), Dashboard, AI
- **Xoch-havolalar:** `[Module-03] Item 77` · `TASDIQ-2146 §03 #27`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-028 · Telegram ShVB komandasi: /zvs_status
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — asosiy buyruqlar (/zvs_status, /company_state, /weekly_digest). ShVB Telegram = asosiy operativ kanal.
- **Manba:** SHvB-40 YO'NALISH 38 (telegram-shvb /zvs_status) + BARCHA_JAVOBLAR HR Q101 (har modul boti) + v1-A
- **Dalil (kod):** Ikki yo'ldan tasdiqlangan: `bot.helpers.ts:151-164` — real `/zvs_status` buyrug'i (to'liq DB-asosli so'rov mantiqi); `apps/api/src/modules/bot-gateway/bots/fin.bot.ts:21-24` — faqat `/cashflow` va `/debts`.
- **Nima yetishmaydi:** `/zno_status` va vizyondagi "va h.k." buyruqlari ikkala faylda ham yo'q (`grep zno_status` `bot.helpers.ts` da → moslik yo'q); ikki bot orasida buyruq to'plami bo'lingan/nomuvofiq.
- **Bog'liqlik:** EP-FIN-013 (kanal), EP-FIN-001/002 (data to'liqligi)
- **action:** READ
- **⤳ Ta'sir:** NTF/Telegram, ZVS, Director-holat
- **Xoch-havolalar:** `[Module-03] Item 78` · `TASDIQ-2146 §03 #28`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-029 · ZVS/ZNO statuslari ro'yxati (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq 6 holatli oqim (Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad, qaytarish bilan). ShVB approval matritsasi = ko'p bosqich.
- **Manba:** SHvB-40 YO'NALISH 1/6 (status oqim) + v1-A
- **Dalil (kod):** `pg_constraint` `zvs` ustida → faqat PK/NOT-NULL, `status` da CHECK-enum **yo'q**. `zvs.repository.ts` → faqat `status='approved'` (satr 54) va `status='rejected'` (satr 63) o'tishlari; `zvs.service.ts` `approveZvsWithAuth`/`rejectZvsWithAuth` daraja-asosli gate'ni tasdiqlaydi.
- **Nima yetishmaydi:** to'liq 6-holatli mashina (ayniqsa "qaytarish / qayta ishlashga yuborish" holati) va DB-daraja enum cheklovi yo'q.
- **Bog'liqlik:** EP-FIN-007 (daraja), EP-FIN-003 (koordinatsiya)
- **action:** CREATE
- **⤳ Ta'sir:** ZVS/ZNO, Coordination, Master-data
- **Xoch-havolalar:** `[Module-03] Item 79` · `TASDIQ-2146 §03 #29`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-030 · Moliya rollarini kim-nima-qiladi (SoD master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har rolga aniq huquq (kassir kiritadi, boshliq tekshiradi, direktor tasdiqlaydi) = vazifa bo'linishi (SoD). Rollar org-sxemadan; SodGuard mavjud.
- **Manba:** BARCHA_JAVOBLAR Org-7 §6 (RBAC kartadan) + memory (4 global guard SodGuard) + v1-A
- **Dalil (kod):** `zvs.service.ts:131-132,198-199` — yaratuvchi o'z so'rovini tasdiqlay olmasligi qoidasi **ikkala** yo'lda ham majburlangan: tasdiq (`if (String(zvs.submitted_by) === String(userId)) return Err({code:'FORBIDDEN', message:"SoD ihlol: ZVS yaratuvchi uni tasdiqlay olmaydi (code: ZVS_SOD_001)"})`) va rad etish ("...uni rad eta olmaydi") — haqiqiy, simmetrik, kod-darajada majburlangan SoD. Alohida: `cashier-hub.service.ts` — `PIN_REQUIRED_TYPES`, bcrypt-tekshirilgan 4-raqamli PIN (naqd-chiqim/oylik/avans/xarajat uchun).
- **Nima yetishmaydi:** (kod emas, provizion) jonli alohida `accountant`/`finance_officer` foydalanuvchilar yo'q — hammasi `super_admin`/`director` ga tushadi (FINANCE-FULL G26/G27, egasi-DATA).
- **Bog'liqlik:** EP-FIN-006 (egasi-only), EP-FIN-064 (davr ochish SoD)
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC/SoD, Org-karta, Approval
- **Xoch-havolalar:** `[Module-03] Item 80` · `TASDIQ-2146 §03 #30` · `EXTRACTION QISM A Step-3 (SoD inert)`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-031 · Hisobotlar to'plami (kunlik kassa/haftalik FP/oylik P&L/aging)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — to'liq to'plam + PDF eksport. POS Q55/Q56: PDF+Excel, GL/ABC hisobotlar.
- **Manba:** BARCHA_JAVOBLAR POS Q55-57 (PDF+Excel hisobot) + v1-A
- **Dalil (kod):** Ikki tekshiruv PDF-eksportni tekshirmagan edi; yangi grep bilan hal qilindi — `finance/cashier-hub/cashier-hub-pdf.service.ts` (real, `pdf-lib` `PDFDocument.create()`, kunlik Z-hisobot) va `finance/reports/trial-balance-pdf.service.ts` (real, `pdf-lib` balans-uslubidagi PDF) — ikkalasi ham mavjud. Bundan tashqari 4-faylli cron to'plami (`financial-reports-alerts/-monthly/-weekly/-daily.cron.ts`) + `financial-reports-query.service.ts`/`financial-reports.controller.ts` real.
- **Bog'liqlik:** EP-FIN-014 (aging), EP-FIN-049 (P&L), EP-FIN-082 (dashboard)
- **action:** EXPORT
- **⤳ Ta'sir:** Hisobotlar, Dashboard, Director
- **Xoch-havolalar:** `[Module-03] Item 81` · `TASDIQ-2146 §03 #31`
- **Δ 2026-07-11→08-07:** `b4dd38ce` + `2cfeb8c2` — `reports.controller.ts` dagi o'lik `notImplemented` importi olib tashlandi (0 chaqiruvchi); funksional o'zgarish yo'q, faqat Qoida 17 tozalash. `633bc74b` — reports-hub `glEntries.total` endi kanonik `entries` dan o'qiydi (avval doim 0 ko'rsatardi).

### EP-FIN-032 · Karta-model integratsiya: moliyaviy mas'uliyat kartaga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har kartaga byudjet limiti + tasdiqlash huquqi biriktiriladi. Karta-model poydevori (MASTER).
- **Manba:** Karta-model vizyon (MASTER) + LOYIHA-BITGAN §C (ORG poydevor) + v1-A
- **Dalil (kod):** `budget_controls` da real chegara-dvigatel sxemasi bor (`reference_id`, `warning_percent`, `block_percent`) lekin **0 jonli qator** va `org_departments`/`head_user_id` ga FK yo'q; `budgets.department` — oddiy matn ustuni, kartaga FK yo'q. `org_departments.head_user_id` = **18/143** to'ldirilgan.
- **Nima yetishmaydi:** karta↔limit biriktirish (FK + rezolyutsiya); `head_user_id` backfill (egasi-DATA).
- **Bog'liqlik:** EP-FIN-009 (`head_user_id`), EP-FIN-017 (byudjet seed), EP-FIN-066
- **action:** UPDATE
- **⤳ Ta'sir:** Org-karta, Byudjet, Approval
- **Xoch-havolalar:** `[Module-03] Item 82` · `TASDIQ-2146 §03 #32` · `EXTRACTION QISM C Step-3 (nodash reconciliation 2026-07-07)`
- **⚠️ ZIDDIYAT:** manba hujjatning **o'z ichida** kelishmovchilik: `B03-finance.md` (nodash) buni ❌ **Yo'q** deb baholaydi (karta-daraja limit biriktirish ulanmagan), dash/master jadval esa 🟡 **Qisman** deydi — bir xil topilma, ikki xil status. Item 82 buni hal qilmasdan ochiq qoldirgan ("amalda Yo'q ga yaqin, dash-jadval ramkasi bo'yicha Qisman saqlandi") — **egasi spot-check qilishi kerak**.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-033 · Режа қоғози → Бухгалтерия avtomatik ulanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ombor chiqim/kirim qaydidan avtomatik Режа қоғози tuziladi va moliyaga oqadi. Oltin-ip: ombor→moliya uzilishsiz; kitob "qo'lda topshirish" muammosini bartaraf.
- **Manba:** kitob Режа қоғози hujjati (v2 manba) + oltin-ip vizyon + v2-A
- **Dalil (kod):** `grep "reja.*qog|paper.*plan|WMS.*imzo|receipt.*sign"` (case-insensitive) butun `apps/api/src` bo'yicha → **0 fayl**. Umumiy `approval_request_steps` zanjir-infratuzilmasi mavjud (`approval-steps.repository.ts`), lekin WMS tovar-harakatiga bog'langan "reja qog'ozi" domen-oqimi yo'q.
- **Nima yetishmaydi:** Finance'da WMS tovar-harakati listeneri → "reja qog'ozi" yozuvi avto-yaratish → mavjud umumiy tasdiq-zanjiri orqali imzolash.
- **Bog'liqlik:** EP-FIN-083 (imzo-zanjiri — bir xil bo'shliq), EP-FIN-035 (real sarf)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (chiqim/kirim), MES (sarf), Coordination
- **Xoch-havolalar:** `[Module-03] Item 83` · `TASDIQ-2146 §03 #33` · `[Module-03] Item 133` (imzo-zanjiri)
- **⚠️ Diqqat (qaror ╳ qurilish):** band ✅ JAVOBLANGAN belgisiga ega, lekin kodda **umuman yo'q** — QISM C buni ochiq "EP-FIN-033 ✅-belgi lekin kod yo'q" deb qayd etgan. Ikki o'q mustaqilligining eng aniq misoli.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-034 · Камомад (qog'oz kamomadi) moliyaviy aks-etishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — Камомад kg × narx = zarar summasi avtomatik, smenaga bog'lanadi. Sub-savol "zararni kimga yozish (smena/IchQ bo'lim/umumiy)" = egasi belgilaydi.
- **Manba:** kitob (Бухгалтерия Камомад nazorati) + v2-A; sub-qaror egasidan
- **Dalil (kod):** `grep "kamomad|shortage.*loss|discrepancy.*loss"` (case-insensitive) butun `apps/api/src` bo'yicha → **0 fayl**. **Δ (qisman poydevor):** `4241faa0` bilan kamomad/brak zararining **maqsad hisobi** yaratildi — `PRODUCTION_LOSS 9520` ("Ishlab chiqarish zarari"), avval 9500 ni aloqasiz boshqa-xarajat postinglari bilan bo'lishardi; ikkala jonli GL-posting yo'li (`gl_account_mappings` + `auto-gl-posting.service.ts` hardcode konstantasi) kelishtirilgan.
- **Nima yetishmaydi:** hisob-servis `(berilgan − ishlatilgan − qaytgan) × birlik_narx`, WMS smena-yopishidan trigger, tasdiqdan keyin GL zarar-yozuvi; "kamomad ╳ normal og'ish" tolerantligi = egasi-DATA.
- **Bog'liqlik:** EP-FIN-035 (real sarf), EP-FIN-041 (brak/makulatura), EP-FIN-022 (GL dvigateli)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor, MES, HR (javobgarlik/KPI)
- **Xoch-havolalar:** `[Module-03] Item 84` · `TASDIQ-2146 §03 #34`
- **Δ 2026-07-11→08-07:** `4241faa0` — `PRODUCTION_LOSS 9520` hisobi yaratildi (DAMAGE + INVENTORY_ADJ_MINUS endi shunga tushadi); hisob-dvigatelning o'zi hamon yo'q.

### EP-FIN-035 · Rejada 1200 / faktda 1500 — qaysi qiymat tannarxga kiradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — faqat haqiqatda ishlatilgan kg (berilgan − qaytarilgan) tannarxga. Kitob aniq shu vaziyatni yozadi; real sarf = to'g'ri tannarx.
- **Manba:** kitob Режа қоғози (1200/1500 misol) + v2-A
- **Dalil (kod):** `batch-selection.service.ts` va `goods-issue.handler.ts` — WMS'da real FIFO/FEFO tovar-chiqim mantiqi; `wms-goods-issued.listener.ts` Finance'ning `infrastructure/event-handlers/` ida — tovar-chiqim→Moliya quvuri real.
- **Nima yetishmaydi:** reja↔fakt (rejalashtirilgan ╳ haqiqiy kg) farqining tannarxga oqishi kuzatilmadi/topilmadi.
- **Bog'liqlik:** EP-FIN-042 (price variance), EP-FIN-067 (buyurtma tannarxi), EP-FIN-034
- **action:** READ
- **⤳ Ta'sir:** SD (narx), PP (norma), Ombor
- **Xoch-havolalar:** `[Module-03] Item 85` · `TASDIQ-2146 §03 #35` · `[Module-03] Item 42` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-FIN-036 · Qog'oz narxini kim/qayerdan oladi (tannarx uchun)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A (v2) — o'rtacha tortilgan narx (weighted average), barqaror. ⚠️ ZIDDIYAT: 460 javob POS Q35 = FIFO. Egasi hal qilsin (FIFO standart-javob ╳ weighted-avg v2-tavsiya). Tan olingan: aktiv standart = FIFO.
- **Manba:** BARCHA_JAVOBLAR POS Q35 (FIFO) ╳ v2-A (weighted avg) — KONFLIKT, egasidan
- **Dalil (kod):** `batch-selection.service.ts:3-76` — ochiq-oydin "Pure FIFO/FEFO batch-lot selection", `return anyDated ? BatchIssueStrategy.FEFO : BatchIssueStrategy.FIFO;`. Faylda **weighted-average kod yo'li umuman yo'q**.
- **Nima yetishmaydi:** —(qurilish jihatidan hech narsa "yetishmaydi": FIFO to'liq qurilgan; yetishmayotgani = **egasi qarori**).
- **Bog'liqlik:** EP-FIN-042 (FIFO price-variance), EP-FIN-086 (narx master-data egaligi)
- **action:** READ
- **⤳ Ta'sir:** Ombor (partiya), MM (xarid), tannarx
- **Xoch-havolalar:** `[Module-03] Item 86` · `TASDIQ-2146 §03 #36`
- **⚠️ ZIDDIYAT:** `decisions` va TASDIQ hujjatlari buni "ikki aktiv implementatsiya orasidagi KONFLIKT" deb ramkalaydi; Item 86 buni **oshirib yuborilgan** deb baholaydi: kodda faqat FIFO bor, weighted-avg **hech qachon qurilmagan** — ya'ni bu jonli kod-konflikt emas, **qurilmagan tavsiya ╳ ishlaydigan FIFO**. Egasi tanlamaguncha FIFO amal qiladi.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-037 · Счёт-фактура (kelgan rulon) tizimda ro'yxatga olinishi → AP
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Счёт-фактура kiritilganda avtomatik kreditor qarz (AP) yoziladi, aging boshlanadi. Kitob Счёт-фактура № maydoni; to'lov nazorati.
- **Manba:** kitob (Счёт-фактура jadvali) + EP-FIN-014 aging + v2-A
- **Dalil (kod):** Uch tekshiruv qarama-qarshi baho bergan (Yo'q ╳ Qisman ╳ Ha); `finance-ap.service.ts` to'liq o'qish bilan hal qilindi — real, jiddiy servis: `getAgingBuckets()`, `getOverdue()`, `createEntry()` (→ `repo.createApEntry(dto)`) va `recalculateAging()` (to'lanmagan `purchase_invoices` ni `due_date` bo'yicha bucketlaydi va aging jadvalini atomik almashtiradi). `purchase_invoices`/`vendor_invoices` = **0 qator**. `purchase_invoices.due_date` ustuni mavjudligi tasdiqlangan.
- **Nima yetishmaydi:** tovar-qabuli paytida **avtomatik** chaqirilishi (qo'lda/talab bo'yicha emas) uchma-uch kuzatilmagan; jonli faktura ma'lumoti yo'q.
- **Bog'liqlik:** EP-FIN-014 (aging), EP-FIN-054 (muddat-profili), EP-FIN-084 (3-way match — trigger nuqtasi)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (kirim), MM (yetkazib beruvchi), Kreditor aging
- **Xoch-havolalar:** `[Module-03] Item 87` · `TASDIQ-2146 §03 #37`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-038 · Счёт-фактура vazni farqi (kelgan gr ╳ qabul gr) → da'vo
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — farq avtomatik hisoblanib yetkazib beruvchi to'lovidan chegirma (da'vo). Kitob ikkala maydonni alohida beradi = tizimli farq.
- **Manba:** kitob (kelgan/qabul gr maydonlari) + v2-A
- **Dalil (kod):** `grep "da'vo|claim.*receivable|bahsli|weight.diff|weight_diff"` (case-insensitive) butun `apps/api/src` bo'yicha → **haqiqiy moslik yo'q** (1 ta soxta-ijobiy: `migrations-drift.ts:184` — aloqasiz izoh). 3-way-match dvigateli (`ThreeWayMatchFailedEvent`, `goods-receipt.handler.ts`) mavjud va nomuvofiqlik hodisasini chiqaradi, lekin **hech narsa uni da'vo/receivable yozuviga aylantirmaydi**.
- **Nima yetishmaydi:** `ThreeWayMatchFailedEvent` listeneri → vazn/miqdor kamchiligida da'vo-receivable yozuvi + keyingi to'lovdan chegirma; tolerantlik chegarasi va da'vo-marshruti siyosati = egasi-DATA.
- **Bog'liqlik:** EP-FIN-084 (3-way match — hodisa manbai, real), EP-FIN-048 (da'vo hayot-tsikli — bir xil bo'shliq)
- **action:** EVENT
- **⤳ Ta'sir:** MM, Kreditor to'lov, Ombor QC
- **Xoch-havolalar:** `[Module-03] Item 88` · `TASDIQ-2146 §03 #38` · `[Module-03] Item 48` *(taxminiy)* · `EXTRACTION QISM D #48` · `vision-1000 #48`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-039 · Станоклар норма → ish haqi/tannarx asosimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har stanok normasi × ish haqi stavkasi = operatsiya tannarxi (material + mehnat). Kitob normasi Ген.Директор tasdiqlagan = tannarx asosi.
- **Manba:** kitob "Станоклар норма.xlsx" (Утверждено Ген.Директор) + v2-A
- **Dalil (kod):** `standard-cost.service.ts:95-126` — real: `laborCostPerUnit = stdHours * laborRate`, manba `cfoConfig.getNumber('std_labor_rate_per_hour', 25000)`, har routing-qadam bo'yicha `stdLaborUzs` ga yig'iladi. `variance-analysis.service.ts` va `order-costing.service.ts` ham real. `SELECT count(*) FROM standard_cost` → **0 qator**.
- **Nima yetishmaydi:** `stdHours` ning **stanok-bo'yicha normaga** (umumiy routing soatiga emas) bog'langani tasdiqlanmagan; jonli standart-tannarx qatori yo'q.
- **Bog'liqlik:** `vision-1000 #28` (mehnat tannarxi MES sessiyasidan — bir xil dvigatel), EP-FIN-077 (versiyali std-cost), routing/`technology_cards` datasi
- **action:** READ
- **⤳ Ta'sir:** PP (norma), MES, HR (ish haqi), SD (narx)
- **Xoch-havolalar:** `[Module-03] Item 89` · `TASDIQ-2146 §03 #39` · `[Module-03] Item 28` *(taxminiy)* · `vision-1000 #28`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-040 · "иш йук" (ish yo'q) vaqti — bo'sh turgan stanok xarajati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "иш йук" soatlari × stanok soatlik xarajati = yo'qotilgan quvvat hisobi (oylik hisobot). Kitob Norма Excelda qayd qiladi = yashirin zarar.
- **Manba:** kitob (Norма "иш йук" qaydi) + v2-A
- **Dalil (kod):** `grep "иш йук|idle.capacity|idleCapacity|opportunity.cost|bo'sh stanok"` (case-insensitive) `break-even.service.ts` va butun `apps/api/src` bo'yicha → **moslik yo'q**. `break-even.service.ts` mavjud va real, lekin bo'sh-quvvat/opportunity-cost hisobi yo'q. QISM D #43: yagona yaqin moslik — `mes/.../mes-shifts-stats.repo.ts:210` izohi (bo'sh mashina OEE'dan chiqariladi), bu opportunity-cost formulasi emas.
- **Nima yetishmaydi:** boshqaruv-hisobot servisiga `idleCapacityCost(machineHoursIdle, hourlyOverheadRate)` funksiyasi (GL'ga tushmaydi — vizyon "rasmiy buxgalteriya emas" deydi); stanok soatlik ustama-xarajat stavkasi = egasi-DATA; IoT/MES bo'sh-soat ma'lumot manbai.
- **Bog'liqlik:** EP-FIN-076 (marjinal narx — shu ma'lumotga tayanadi), EP-FIN-051 (energiya taqsimi)
- **action:** READ
- **⤳ Ta'sir:** MES, PP, boshqaruv hisoboti
- **Xoch-havolalar:** `[Module-03] Item 90` · `TASDIQ-2146 §03 #40` · `[Module-03] Item 43` (dublikat) · `EXTRACTION QISM D #43` · `vision-1000 #43`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-041 · Брак va Макулатура moliyaviy hisobi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — Брак = to'liq zarar, Макулатура = qisman qaytariladigan qoldiq (sotuvga). Sub-savol "makulatura sotuvi qaysi hisobga (asosiy/boshqa daromad/zararni kamaytirish)" = egasidan.
- **Manba:** kitob (Брак/Макулатура/Рулон брак kg maydonlari) + v2-A
- **Dalil (kod):** `grep "defect_catalog|brak.*variance|brak.*tannarx|makulatura|Брак|Макулатура"` (case-insensitive) `apps/api/src/modules/finance` bo'yicha → **0 fayl**. QC'ning `defect_catalog` i mavjud, lekin Finance tomonida brak/makulatura uchun pul-postingi yo'q. QISM D #27 aniqroq: `pos/dto/movement-enums.ts:16` `WASTE_IN` (makulatura KIRIM) bor edi, ammo `pos-gl-auto.service.ts` da `EXTERNAL_OUT` (sotuv) → **9010 oddiy Daromad** ga tushardi; 9910 faqat `INVENTORY_ADJ_PLUS` uchun edi — makulatura-sotuv toifasi ajratilmagan.
- **Nima yetishmaydi:** brak → to'liq-zarar GL yozuvi (endi 9520 ga), makulatura sotuvi → "boshqa daromad" yozuvi (endi 9820 ga) — **ikkalasini QC `defect_catalog` dan triggerlaydigan handler**; makulatura sotuv-narxi/daromad-hisobi marshruti = egasi-DATA.
- **Bog'liqlik:** EP-FIN-034 (kamomad — bir xil zarar-hisobi), EP-FIN-050 (xarajat toifalari), EP-FIN-085 (brak% og'ishi), QC `defect_catalog`
- **action:** EVENT
- **⤳ Ta'sir:** Ombor, QC, SD (chiqindi sotuvi)
- **Xoch-havolalar:** `[Module-03] Item 91` · `TASDIQ-2146 §03 #41` · `[Module-03] Item 27` *(taxminiy)* · `EXTRACTION QISM D #27` · `vision-1000 #27`
- **Δ 2026-07-11→08-07:** `4241faa0` — makulatura qayta-sotuv daromadiga **alohida hisob** berildi: `OTHER_INCOME_WASTE_PAPER 9820` (9810 kurs-farqi daromadi bilan aralashib ketmasligi uchun, uning farzand-hisobi) + yangi `WASTE_OUT` harakat-turi va mapping (mavjud `WASTE_IN` naqshini oynalab). Zarar tomoni uchun `PRODUCTION_LOSS 9520`. Toifa-hisoblari endi bor; **triggerlaydigan handler hamon yo'q** → qurilish holati Yo'q da qoladi.

### EP-FIN-042 · Гильза (gilza) qaytarish — depozit/qaytariladigan tara hisobi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — gilza qaytariladigan tara depoziti sifatida alohida hisoblanadi (yo'qolish ko'rinadi). Kitob "Гильза" maydoni.
- **Manba:** kitob (Гильза maydoni) + v2-A
- **Dalil (kod):** `grep "gilza|гильза"` (case-insensitive) butun `apps/api/src` bo'yicha → **0 fayl** (ikki mustaqil tekshiruvda bir xil natija).
- **Nima yetishmaydi:** qaytariladigan-depozit subledgeri (berilganda depozit, 90 kun ichida qaytarilsa reversal, keyin avtomatik zarar-yozuvi); depozit qiymati, 90-kun chegarasi va depozit GL hisobi = egasi-DATA; "gilza berildi" ni belgilaydigan WMS hodisasi.
- **Bog'liqlik:** EP-FIN-034 (yo'qotish/zarar naqshi), WMS
- **action:** CREATE
- **⤳ Ta'sir:** Ombor, MM
- **Xoch-havolalar:** `[Module-03] Item 92` · `TASDIQ-2146 §03 #42` · `[Module-03] Item 25` (dublikat) · `EXTRACTION QISM D #25` · `vision-1000 #25`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-043 · Хайдовчи/Транспорт xarajati — yetkazib berish tannarxi (landed cost)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — transport summasi material kirim tannarxiga taqsimlanadi (landed cost). Kitob "Транспорт тури/Автомобиль/Хайдовчи" maydonlari.
- **Manba:** kitob (transport maydonlari) + v2-A
- **Dalil (kod):** `grep "landed|freight|transport.*cost|landing.*cost"` (case-insensitive) butun `apps/api/src` bo'yicha → **haqiqiy moslik yo'q** (3 soxta-ijobiy: `iot-tablet.controller.ts`, `queries-sd.ts`, `gl-posting.service.ts:211` dagi aloqasiz "time landed on the previous calendar day" sana izohi).
- **Nima yetishmaydi:** tovar-qabulida kg-proporsional taqsimlash: `transport_cost × (item_weight_kg / total_shipment_weight_kg)` → material birlik-tannarxiga. **Formula allaqachon hujjatlashtirilgan** (EP-FIN-043, vision-1000 #19) — faqat implementatsiya yo'q; egasi-qarori talab qilinmaydi.
- **Bog'liqlik:** EP-FIN-037 (AP tovar-qabuli oqimi), EP-FIN-051 (energiya taqsimi — bir xil allocation bo'shlig'i)
- **action:** READ
- **⤳ Ta'sir:** MM (xarid), Ombor, tannarx
- **Xoch-havolalar:** `[Module-03] Item 93` · `TASDIQ-2146 §03 #43` · `[Module-03] Item 19` (dublikat) · `vision-1000 #19`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-044 · Клей tayyorlash xarajati (Крустик сода/Краxмал/Бура)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yelim tarkibiy moddalari alohida sarf-norma bilan, ortiqchasi zarar (nazorat). Kitob retsept maydonlari.
- **Manba:** kitob (Клей тайёрлаш maydonlari) + v2-A
- **Dalil (kod):** `grep "kley|yelim.*norm|сода|крахмал|бура|глютен"` (case-insensitive) butun `apps/api/src` bo'yicha → **faqat soxta-ijobiylar** (WMS xavf-tasnifi/saqlash-zonasi havolalari, masalan `material-life.constants.ts:18` — saqlash-xavfsizligi izohi, tannarx-nazorati bilan aloqasiz).
- **Nima yetishmaydi:** yelim-komponenti sarf-norma master-datasi + mavjud `variance-analysis.service.ts` dvigatelini qayta ishlatuvchi og'ish-ogohlantirishi; norma QIYMATLARI (soda/kraxmal/bura nisbatlari) = egasi-DATA.
- **Bog'liqlik:** `vision-1000 #26` (ortiqcha yelim ±5% chegara), `variance-analysis.service.ts` (qayta ishlatiladigan infratuzilma)
- **action:** READ
- **⤳ Ta'sir:** MM, MES, tannarx
- **Xoch-havolalar:** `[Module-03] Item 94` · `TASDIQ-2146 §03 #44` · `[Module-03] Item 26` *(taxminiy)* · `vision-1000 #26`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-045 · Haftalik "berilgan xom-ashyo hisoboti" → moliya
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — haftalik sarf hisoboti avtomatik moliyaga tushadi, byudjet bilan taqqoslanadi (erta ogohlantirish). Kitob "Флексо берилган хом ашё ҳафталик" + оргполитика "bitta manba".
- **Manba:** kitob (haftalik hisobot hujjati) + EP-FIN-018 byudjet-taqqos + v2-A
- **Dalil (kod):** `variance-analysis.service.ts` / `finance-variance.controller.ts` real (umumiy og'ish dvigateli); `fp-cycle-cron.service.ts` real (haftalik ritm). `grep "flekso|weekly.*raw.*material"` `apps/api/src/modules/finance` bo'yicha → Flekso-maxsus haftalik xom-ashyo hisobot oqimi **topilmadi**.
- **Nima yetishmaydi:** Flekso-bo'lim haftalik hisobotining Finance'ga avtomatik marshruti; byudjet-taqqos (EP-FIN-018 bo'sh).
- **Bog'liqlik:** EP-FIN-011 (haftalik ritm), EP-FIN-018 (byudjet taqqos), EP-FIN-065/066 (og'ish marshruti)
- **action:** EVENT
- **⤳ Ta'sir:** PP, Ombor, byudjet
- **Xoch-havolalar:** `[Module-03] Item 95` · `TASDIQ-2146 §03 #45`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-046 · Buyurtmalar tahlili (listlar bo'yicha) — daromad o'sish ko'rinishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — daromad dashboard (list-soni + summa, oy/yil taqqos, o'sish %). Kitobda format bor; egasi o'sish dinamikasini xohlaydi.
- **Manba:** kitob ("Buyurtmalar tahlili" + "O'sish surati 2017/2018") + LOYIHA-BITGAN §A.6 (70% tahlil) + v2-A
- **Dalil (kod):** `order-costing.service.ts:43-53` — real `findTopProfitable(limit=10)`, `findTopLoss(limit=10)` va `calculate`; controller (`order-costing.controller.ts`) va repo (`drizzle-order-costing.repo.ts`) mavjud.
- **Nima yetishmaydi:** davr-ustidan-davr **o'sish-% vidjeti** (oy/yil taqqos dinamikasi) topilmadi.
- **Bog'liqlik:** EP-FIN-067 (rentabellik kartochkasi — bir xil servis)
- **action:** READ
- **⤳ Ta'sir:** SD, boshqaruv hisoboti
- **Xoch-havolalar:** `[Module-03] Item 96` · `TASDIQ-2146 §03 #46`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-047 · "Faqat bitta bo'lim ma'lumotni shakllantiradi" — moliya raqamlarining egasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tannarx/qarz = Бухгалтерия egaligida, sotiш narxi = SD egaligida, boshqalar o'qiydi. Оргполитика "bitta egа" + karta-model master-data egaligi.
- **Manba:** kitob оргполитика (МАЪЛУМОТ САҚЛАШ) + karta-model + v2-A
- **Dalil (kod):** `MASTER_DATA_STANDARTLARI.md` = hujjatlashtirilgan egalik konvensiyasi, **o'zi kod bilan majburlanmagan** — `apps/api/src` ichida `MASTER_DATA_STANDARTLARI` ga havola topilmadi. Biroq `finance-gl.controller.ts:36,51-139` da real `@UseGuards(RolesGuard)` + `@Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)` GL-yozish gate'i bor.
- **Nima yetishmaydi:** gate'ning SD va tannarx master-datasidagi HAR bir "narx" yozish yo'liga izchil cho'zilishi kuzatilmagan.
- **Bog'liqlik:** EP-FIN-086 (aynan bir xil talab — dublikat), EP-FIN-030 (SoD)
- **action:** APPROVE
- **⤳ Ta'sir:** Barcha modullar, master-data
- **Xoch-havolalar:** `[Module-03] Item 97` · `TASDIQ-2146 §03 #47` · `[Module-03] Item 136` (dublikat)
- **Δ 2026-07-11→08-07:** —

### EP-FIN-048 · "Og'zaki ma'lumot qaror asosi emas" — to'lov tasdig'i hujjatsiz bo'lmasin
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har to'lov so'roviga hujjat majburiy, bo'lmasa tasdiqlash bloklanadi. Оргполитика to'g'ridan-to'g'ri taqiqlaydi; 460 javob: hamma hujjat ERP da (EP-FIN-026 bilan bir).
- **Manba:** kitob оргполитика + BARCHA_JAVOBLAR HR Q77 + v2-A
- **Dalil (kod):** `zvs.service.ts` ning to'liq yaratish/tasdiqlash/rad-etish oqimi o'qildi — yo'lda **hech qanday hujjat-majburiy maydoni yoki tekshiruvi yo'q**. `storage.controller.ts` umumiy fayl-saqlash beradi (rol-gated yuklab-olish, majburiy "sabab"), lekin ZVS/ZNO ga bog'langan topshirishni bloklovchi invariant yo'q.
- **Nima yetishmaydi:** kod-darajadagi invariant "hujjatsiz to'lov bloklanadi".
- **Bog'liqlik:** EP-FIN-026 (dublikat), EP-FIN-083 (imzo-zanjiri)
- **action:** APPROVE
- **⤳ Ta'sir:** ZNO, Approval, Hujjat-ombori
- **Xoch-havolalar:** `[Module-03] Item 98` · `TASDIQ-2146 §03 #48` · `[Module-03] Item 76` (dublikat)
- **Δ 2026-07-11→08-07:** —

### EP-FIN-049 · Avans hisoboti (подотчёт) — naqd berilgan pul hisoboti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — avans berildi → xodim chek bilan hisob beradi → qoldiq qaytariladi (to'liq tsikl). Sub "hisob bermagan avans muddat o'tsa" → 460 javob: oylikdan avtomatik chegiriladi (Q182).
- **Manba:** BARCHA_JAVOBLAR HR Q119/Q182 (kassadan olgan pul → oylikdan chegirma) + v2-A
- **Dalil (kod):** Ikki tekshiruv qarama-qarshi baho bergan (Qisman ╳ Ha); `cashier-podotchet.service.ts` to'liq o'qish bilan hal qilindi — haqiqatan to'liq tsikl: `issueAdvance()` (KAS-1 naqd-chiqim, PIN-gated, Dr4000 AR / Cr5010 Kassa, `employee_debt` ochadi), `submitAdvanceReport()` (majburiy chek, ixtiyoriy AI-OCR summa-solishtirish `AiRouterService` orqali, AI yo'q bo'lsa muloyim fallback), `approveAdvanceReport()` (inson tasdig'i qarzni yopadi, idempotent), `getEmployeeDebt()` (to'liq profil: jami berilgan / ochiq / hisobot kutilayotgan / toifa bo'yicha). Hammasi referens bo'yicha idempotent. `employee_debt`/`advance_reports` = 0 jonli qator (qurilish bosqichi — kod uchma-uch ulangan).
- **Nima yetishmaydi:** (band doirasidan tashqarida) 24h/30-kun avans-aging cron'i (`vision-1000 #50` — "overdue advance receivable" subhisob) topilmadi; mavjud `zno-zvs-sla-escalation.cron.ts` boshqa domen.
- **Bog'liqlik:** EP-FIN-020/021 (KAS-1/GL — real), EP-FIN-073 (oylikdan chegirma — real)
- **action:** CREATE
- **⤳ Ta'sir:** HR (ish haqi), Kassa, Approval
- **Xoch-havolalar:** `[Module-03] Item 99` · `TASDIQ-2146 §03 #49` · `[Module-03] Item 14/Item 50` *(taxminiy)* · `vision-1000 #14/#50`
- **Δ 2026-07-11→08-07:** `633bc74b` — `gl_account_mappings` dagi ADVANCE qatori hisoblar rejasiga hech qachon seed qilinmagan `4200` kodiga havola qilardi, ya'ni **har ADVANCE tasdig'ining GL-postingi `resolveAccountIds()` da jimgina yiqilardi**; hisob idempotent (data-only) seed qilindi.

### EP-FIN-050 · Xarajat kategoriyalari (xarajat moddalari) ro'yxati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — standart xarajat moddalari ro'yxati (sozlanadigan), har xarajat bittasiga bog'lanadi. Toifasiz tahlil imkonsiz; BHMS COA bilan moslanadi.
- **Manba:** EP-FIN-024 BHMS COA + v2-A
- **Dalil (kod):** `information_schema.tables` bo'yicha `%expense_categor%`/`%expense_type%` → **bo'sh, bunday jadval yo'q**. `accounts` = 42 qator (COA — xarajat-toifa taksonomiyasi emas), `cost_centers` = 1 qator.
- **Nima yetishmaydi:** `expense_categories` master-jadvali + seed + xarajat-qayd oqimlaridan FK; taksonomiyaning o'zi = egasi/moliya-DATA.
- **Bog'liqlik:** EP-FIN-024 (COA), EP-FIN-041 (makulatura "boshqa daromad" manzili), EP-FIN-078 (xarajat-markazi)
- **action:** CREATE
- **⤳ Ta'sir:** Byudjet, Hisobotlar, GL
- **Xoch-havolalar:** `[Module-03] Item 100` · `TASDIQ-2146 §03 #50` · `EXTRACTION QISM C Step-3 (nodash reconciliation 2026-07-07)`
- **⚠️ ZIDDIYAT:** dash/master jadval 🟡 **Qisman** (dalil sifatida `accounts(42)` + `cost_centers(1)` ni ko'rsatgan) ╳ `B03-finance.md` (nodash) ❌ **Yo'q**. Item 100 buni `information_schema` so'rovi bilan **Yo'q foydasiga hal qildi**: iqtibos qilingan jadvallar COA/xarajat-markaz vazifasini bajaradi, xarajat-toifalash vazifasini emas.
- **Δ 2026-07-11→08-07:** `4241faa0` — COA'da 4 ta yangi **toifa-hisobi** ajratildi (9520 zarar / 9820 makulatura-daromadi / 9210 marketing / 9220 referal), ya'ni "hamma narsa 9500/9200 ga tushadi" muammosi qisman yumshadi; ammo bu COA-daraja, **`expense_categories` master-datasi emas** → qurilish holati Yo'q da qoladi.

### EP-FIN-051 · Energiya (elektr/gaz/suv) xarajati — stanokga taqsimlash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — stanok soatlik energiya quvvati × ish soati → tannarxga taqsim. Kitob stanoklari (SM-52/72, KBA-105, гофра) ko'p energiya yeydi.
- **Manba:** kitob (stanok ro'yxati) + v2-A
- **Dalil (kod):** `grep "energy.alloc|energyAlloc|elektr.*taqsim|energiya.*taqsim"` (case-insensitive) → **0 fayl**. `entries` da `cost_center_id` ustuni **mavjud** (migratsiya `gl-entries-cost-center-2026-07-08.sql`), lekin `gl-posting.service.ts:1-24` o'qildi: bu faqat **ixtiyoriy o'tkazma-teg** ("Does NOT affect any debit/credit/balance logic") — orqasida hech qanday taqsimlash formulasi/dvigateli yo'q.
- **Nima yetishmaydi:** IoT stanok-soat ma'lumotini o'qib, `cost_center_id` bilan teglangan proporsional GL yozuvlarini yozadigan energiya-taqsim servisi; energiya-faktura↔stanok-soat stavka formulasi = egasi/muhandislik-DATA.
- **Bog'liqlik:** EP-FIN-078 (`cost_centers` = 1 qator), EP-FIN-043 (bir xil allocation bo'shlig'i), IoT stanok-soat ma'lumoti
- **action:** READ
- **⤳ Ta'sir:** MES (soat), tannarx, byudjet
- **Xoch-havolalar:** `[Module-03] Item 101` · `TASDIQ-2146 §03 #51` · `[Module-03] Item 24` *(taxminiy, STALE-DOC)* · `vision-1000 #24`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-052 · Stanok amortizatsiyasi — asosiy vositalar reestri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 tekshirildi)*
- **Talab:** A — har stanok asosiy vosita kartochkasi (qiymat, muddat, oylik amortizatsiya). POS Q46: amortizatsiyani FI moduli hal qiladi; memory: depreciation.service mavjud.
- **Manba:** BARCHA_JAVOBLAR POS Q46 (FI amortizatsiya) + memory (depreciation.service) + v2-A
- **Dalil (kod):** `finance/domain/services/depreciation.service.ts:6-119` — 4 usul (`'SL'|'DB'|'SYD'|'UOP'`) + `buildSchedule(params)`, real kalkulyator. **Jonli tekshirildi 2026-08-07:** `grep -rn "depreciation.service" apps/api/src` → **yagona moslik = faylning o'z `@module` izohi**, ya'ni **hech qayerdan import qilinmagan (o'lik kod)**. Amaldagi jonli dvigatel — `compatibility/asset-management.service.ts:191-221` `depreciateAsset()` → `glPosting.postJournal` (Dr 9430 / Cr 0200), idempotent kalit `DEP-{id}-{YYYY-MM}`. `asset_items` = 0 qator, `asset_disposals` = 0 qator.
- **Nima yetishmaydi:** (a) `createDisposal()` (`asset-management.service.ts:130`) faqat qator INSERT qiladi — **write-off GL postingi yo'q**; (b) pro-rata o'rta-oy hisobi faqat o'lik kalkulyatorda bor, jonli SQL yo'lida emas; (c) asosiy-vosita reestri bo'sh (egasi-DATA: 30 stanok ro'yxati).
- **Bog'liqlik:** EP-FIN-022 (GL), asosiy-vosita seed (egasi-DATA #89 30-stanok ro'yxati)
- **action:** CREATE
- **⤳ Ta'sir:** MES (jihoz), tannarx, soliq
- **Xoch-havolalar:** `[Module-03] Item 102` · `TASDIQ-2146 §03 #52` · `[Module-03] Item 23` *(taxminiy)* · `EXTRACTION QISM D #23` · `vision-1000 #23`
- **⚠️ ZIDDIYAT:** QISM C #52 + Item 102 — "`depreciation.service.ts` amortizatsiya dvigateli **haqiqatan real va to'liq**" ╳ QISM D #23 — "u **HECH QAYERDA import qilinmagan (o'lik)**; repo `depreciateAsset` SQL'i ishlatiladi". **2026-08-07 da jonli grep bilan QISM D tasdiqlandi** (0 importer). Q-46 bo'yicha: o'lik dvigatel yo to'g'ri yo'lga ulanadi, yo to'liq o'chiriladi — chala qoldirilmaydi.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-053 · Valyuta — import xom-ashyo (qog'oz/kimyo) valyutada
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ko'p valyuta + kun kursi → so'mda avtomatik, kurs farqi alohida hisob. POS Q36: "har qanday valyuta — qaysi valyutada xarajat bo'lsa o'sha".
- **Manba:** BARCHA_JAVOBLAR POS Q36 (har valyuta) + v2-A
- **Dalil (kod):** `exchange_rates` = **12 qator**, `currencies` = **4 qator** (jonli). `currency_transactions.exchange_difference` ustuni mavjud, lekin `currency_transactions` = **0 qator**. `grep "kurs.farq|exchange.*rate.*diff|fxGainLoss|currencyGainLoss"` `apps/api/src/modules/finance` bo'yicha → **0 fayl** — kurs-farqini GL'ga yozadigan kod yo'q.
- **Nima yetishmaydi:** kurs-farqi (FX gain/loss) hisoblab GL'ga postlash; MB kursi offline-fallback + "taxminiy kurs" belgisi (vision-1000 #11) — QISM A E21: feed **fake-success cron** (0 fetch, 0 insert, "✅ processed=5" logi), `updated_at` yo'q.
- **Bog'liqlik:** EP-FIN-022 (GL — real), EP-FIN-058 (ko'p bank/valyuta)
- **action:** CREATE
- **⤳ Ta'sir:** MM (import), Kreditor, tannarx
- **Xoch-havolalar:** `[Module-03] Item 103` · `TASDIQ-2146 §03 #53` · `[Module-03] Item 11` *(taxminiy)* · `EXTRACTION QISM A #11` · `vision-1000 #11`
- **Δ 2026-07-11→08-07:** `4241faa0` — yo'ldagi tovar uchun real GL yozuvi qo'shildi (Dr Materiallar / Cr `GOODS_IN_TRANSIT 1020`) `wms-in-transit.service.ts` `markArrived()` da; **chet-valyutadagi jo'natmalar ataylab o'tkazib yuboriladi va sabab loglanadi** ("no FX-rate source exists to fabricate a conversion") — Q-40 ga muvofiq soxta konvertatsiya qilinmadi, ya'ni FX bo'shlig'i endi kodda **ochiq belgilangan**.

### EP-FIN-054 · Kreditor (yetkazib beruvchi) to'lov muddati — Счёт-фактура shartlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har yetkazib beruvchi to'lov muddati profili → aging shu muddatga nisbatan. Hozir aging faqat sana; shartnoma muddati har xil.
- **Manba:** v2-A + EP-FIN-014 aging
- **Dalil (kod):** Ikki tekshiruv turli yorliq bergan (Yo'q ╳ Qisman) lekin bir xil faktni topgan: `purchase_invoices.due_date` ustuni mavjud va **bugun aging'ni haydaydi** (yashirin 30-kun fallback bilan). `grep "vendor.*profile|supplier.*payment.*term|due.*date.*profile"` `apps/api/src/modules/finance` bo'yicha → **0 fayl**. Aniq ustun real xatti-harakatni haydagani uchun Qisman aniqroq yorliq.
- **Nima yetishmaydi:** yetkazuvchi→kredit-kun profili jadvali/servisi (tekis fallback'ni bekor qiluvchi); standart muddat = egasi/master-DATA.
- **Bog'liqlik:** EP-FIN-014 (aging), EP-FIN-037 (AP yozuvi), EP-FIN-061 (to'lov taqsimoti)
- **action:** CREATE
- **⤳ Ta'sir:** MM, Aging, ZNO
- **Xoch-havolalar:** `[Module-03] Item 104` · `TASDIQ-2146 §03 #54` · `[Module-03] Item 6` *(taxminiy)* · `vision-1000 #6`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-055 · Soliqlar (QQS/НДС) — Счёт-фактурада ajratish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har fakturada QQS stavkasi + summasi ajratiladi, kirim/chiqim QQS reestri. ⚠️ POS Q45: "faqat ichki hisobot" (rasmiy fiskal yo'q) — QQS reestri ichki tahlil uchun. Egasi rasmiy soliq integratsiya darajasini aniqlasin.
- **Manba:** v2-A ╳ BARCHA_JAVOBLAR POS Q45 (faqat ichki hisobot) — egasidan
- **Dalil (kod):** `gl-accounts.constants.ts:35` — `TAX: { code: GL.SALES_TAX_PAYABLE, name: 'Soliq zaxirasi (QQS)' }` = **6310** (2026-08-07 da jonli faylda qayta tasdiqlandi); `accounts` = 42 qator bunga mos. `income-split.service.ts` `FundKey` TAX-fondiga marshrutlaydi.
- **Nima yetishmaydi:** ichki QQS **reestr ekrani/servisi** (kirim/chiqim) topilmadi; QQS stavkasi **12% hardcoded**, konfig yo'q (RECON SB0808 STILL-OPEN).
- **Bog'liqlik:** EP-FIN-004 (TAX fond), EP-FIN-024 (COA), EP-FIN-056 (mehnat soliqlari)
- **action:** CREATE
- **⤳ Ta'sir:** SD (chiqim faktura), MM (kirim faktura), soliq-hisobot
- **Xoch-havolalar:** `[Module-03] Item 105` · `TASDIQ-2146 §03 #55` · `[Module-03] Item 47` *(taxminiy)* · `vision-1000 #47`
- **⚠️ ZIDDIYAT:** `decisions` o'zi KONFLIKT deb belgilagan: v2-A "to'liq QQS reestri" ╳ BARCHA_JAVOBLAR POS Q45 "**faqat ichki hisobot**, rasmiy fiskal integratsiya YO'Q". vision-1000 #47 buni "fiskal integratsiya yo'q — EP-FIN-055 hal" deb yozgan, ammo `decisions` hamon 🔵 OCHIQ. **Egasi rasmiy-fiskal darajani yakuniy tasdiqlashi kerak** (bu QQS reestri hajmini belgilaydi).
- **Δ 2026-07-11→08-07:** —

### EP-FIN-056 · Mehnat haqi soliqlari (ИНПС/ЖШДС) → moliya GL ulanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — payroll yopilganda avtomatik GL: xarajat (ish haqi) + kreditor (soliq, xodim). 460 javob Q181: hamma komponent avtomatik Payroll; memory: payroll GL lines insert mavjud (INPS8/JSHD12).
- **Manba:** BARCHA_JAVOBLAR HR Q181 (hamma payroll avto) + memory (payroll GL lines) + v2-A
- **Dalil (kod):** `grep -rn "postPayrollEntry" apps/api/src/` → **butun repo bo'yicha nol moslik** — `gl-posting.service.ts`/`finance-gl.controller.ts` da `postPayrollEntry` bor degan da'vo **tasdiqlanmadi**. `payroll-tax.service.ts` (to'liq o'qildi, commit `e61d325c`) o'zini shunday hujjatlaydi: "*It does NOT post GL journal lines (GlPostingService owns that)*" va "*the main ERP payroll path is GROSS-ONLY (1C handles JSHD/INPS)*". `grep -rl "PayrollTaxService" apps/api/src/` → servisga faqat o'z konstantalar fayli va o'zi murojaat qiladi — **hech qanday controller yoki payroll-yopish servisi `compute()` ni chaqirmaydi**. `payroll_journal_entries` sxemada bor, **0 qator**.
- **Nima yetishmaydi:** HR `PayrollClosureService` → `PayrollTaxService.compute()` → `GlPostingService.postJournal` ulanishi (uch zveno ham mavjud, orasida sim yo'q).
- **Bog'liqlik:** HR payroll-yopish yo'li (Modul 03 dan tashqarida), EP-FIN-022 (GL)
- **action:** EVENT
- **⤳ Ta'sir:** HR (payroll), GL, soliq
- **Xoch-havolalar:** `[Module-03] Item 106` · `TASDIQ-2146 §03 #56` · `[Module-03] Item 38` *(taxminiy)* · `EXTRACTION QISM A #38 + Step-3` · `vision-1000 #38`
- **⚠️ ZIDDIYAT:** QISM C #56 — "✅ **Ha** — `payroll-tax.service.ts` INPS+JSHD; `gl-posting postPayrollEntry`; `payroll_journal_entries`" ╳ Item 106 — "`grep postPayrollEntry` = **0 moslik**, servis hech kim tomonidan chaqirilmaydi". Grep-dalil ustun → **STALE-DOC**. Ayni paytda QISM A #38 ning "4-xil soliq stavkasi ziddiyati (24/20/13/0%)" da'vosi ham **eskirgan** — `payroll-tax.constants.ts` da endi yagona toza to'plam: INPS=12%, xodim JSHD=1%, ish beruvchi JSHD=12%. Ya'ni **ziddiyat yo'qoldi, funksional bo'shliq qoldi**.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-057 · To'lov usuli (naqd/plastik/o'tkazma/o'zaro hisob)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'lov usuli majburiy maydon, har usul o'z hisobiga (kassa/bank) bog'lanadi. POS Q36/Q44 ERP FI; naqd qattiq nazorat.
- **Manba:** v2-A + EP-FIN-020 kassa + EP-FIN-004 4-hisob
- **Dalil (kod):** `information_schema.columns` `cash_transactions` bo'yicha → `payment_method | is_nullable: NO` — DB-darajada majburiy enum ustuni. `cash_registers`/`bank_accounts` = 0 qator.
- **Nima yetishmaydi:** "o'zaro hisob" (usul bo'yicha o'zaro-hisob solishtirish) tomoni qurilmagan (EP-FIN-070 bilan bir).
- **Bog'liqlik:** EP-FIN-020 (kassa), EP-FIN-058 (bank), EP-FIN-070 (o'zaro hisob)
- **action:** CREATE
- **⤳ Ta'sir:** Kassa, bank, ZNO
- **Xoch-havolalar:** `[Module-03] Item 107` · `TASDIQ-2146 §03 #57` · `[Module-03] Item 70` (jonli jadval tuzatishi)
- **⚠️ ZIDDIYAT:** bu bandning yagona kod-dalili `cash_transactions.payment_method` ga tayanadi, **lekin aynan shu jadval Item 70 da o'lik deb aniqlangan** — jonli kassir oqimi `cashier_shifts`/`cashier_movements` orqali ketadi. Ya'ni majburiy-maydon kafolati **ishlatilmaydigan jadvalda** bo'lishi mumkin. `cashier_movements` da `payment_method` NOT NULL bormi — **tekshirilishi shart**.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-058 · Bir nechta bank hisobi (so'm/valyuta) — qoldiq ko'rinishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bank hisobi alohida, umumiy qoldiq dashboard. ShVB Справка о счетах + ko'p valyuta (EP-FIN-053).
- **Manba:** SHvB-40 YO'NALISH 3 (hisob справка) + v2-A
- **Dalil (kod):** Ikki tekshiruv qarama-qarshi baho bergan (Yo'q ╳ Qisman); yangi tekshiruv bilan hal qilindi: `bank_accounts` jadvali mavjud (`information_schema.tables`) lekin **0 qator**; FE `CashFlowManagement` real va jiddiy — `grep -rl "CashFlowManagement" artifacts/erp-dashboard/src/` → **7 fayl** (`CashFlowManagement.tsx`, `...Dialogs.tsx`, `...Sections.tsx`, `...Types.ts`, 2 test fayli, `FinanceRoutes.tsx` da routed).
- **Nima yetishmaydi:** jonli bank-hisob qatorlari yo'q → hech narsa render bo'lmaydi. **Egasi-DATA**: bank hisob raqamlari/qoldiqlari.
- **Bog'liqlik:** EP-FIN-053 (valyuta), EP-FIN-004 (4-hisob), EP-FIN-082 (dashboard)
- **action:** READ
- **⤳ Ta'sir:** Kassa, ZNO, byudjet
- **Xoch-havolalar:** `[Module-03] Item 108` · `TASDIQ-2146 §03 #58`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-059 · To'lov kalendari (kun bo'yicha kirim/chiqim prognozi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — kun bo'yicha kirim/chiqim kalendari + qoldiq prognozi (cash-flow). Bo'shliq oldindan ko'rinadi; AI forecastCashFlow bilan mos.
- **Manba:** SHvB-40 YO'NALISH 39 (finance-ai forecastCashFlow) + v2-A
- **Dalil (kod):** `cashflow-forecast.service.ts:21-130` — real, **lekin interfeys aniq `WeeklyForecast` (satr 21)** va `loadWeeklyData(...)` (satr 101), optimistik/bazaviy/pessimistik ssenariylar bilan. Faylda kunlik/`kunlik` kalendar tuzilmasi **yo'q**.
- **Nima yetishmaydi:** vizyon talab qilgan **kun-bo'yicha** kalendar (hozir faqat haftalik granularlik); to'lov-sanasi majburiy maydoni ZNO'da (vision-1000 #33).
- **Bog'liqlik:** EP-FIN-081 (pul aylanma davri), EP-FIN-080 (ZNO navbati), EP-FIN-002 (ZNO sanasi)
- **action:** READ
- **⤳ Ta'sir:** Aging, ZNO, byudjet
- **Xoch-havolalar:** `[Module-03] Item 109` · `TASDIQ-2146 §03 #59` · `[Module-03] Item 33` *(taxminiy)* · `vision-1000 #33`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-060 · Debitor (mijoz qarzi) limiti — SD ga bog'lash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mijoz kredit limiti → oshsa SD buyurtmasi bloklanadi/tasdiqqa chiqadi. Sub "limitni kim oshira oladi (egasi/moliya rahbari/sotiш rahbari)" = egasidan (karta-vakolat).
- **Manba:** v2-A + karta-model (vakolat); sub-qaror egasidan
- **Dalil (kod):** `sd-customers.service.ts` `getCreditStatus(cid, amount)` — izohi bilan: "EP-SD-060/061/062 credit-limit check (**flag, not auto-block** — E1)"; `sd_customers.credit_limit` ustuni tasdiqlangan. QISM D #7 aniqroq: `drizzle-sd-customers.repo.ts:68-88` — `credit_limit` ╳ `outstanding`, `exceeds` bo'lsa yumshoq flag "direktor tasdig'i kerak (EP-SD-061)"; endpoint `sd-customers.controller.ts:205`. `customer_accounts` = 0 qator.
- **Nima yetishmaydi:** bu **maslahat-check endpoint**, buyurtma hayot-tsikliga "kredit-tasdiq" **HOLATI** sifatida qotirilmagan (gate emas); "umumiy ochiq summa" agregatsiyasi tasdiqlanmagan.
- **Bog'liqlik:** EP-FIN-014/015 (AR aging), EP-FIN-068 (narx blok), SD buyurtma hayot-tsikli
- **action:** APPROVE
- **⤳ Ta'sir:** SD, CRM, Aging
- **Xoch-havolalar:** `[Module-03] Item 110` · `TASDIQ-2146 §03 #60` · `[Module-03] Item 7` *(taxminiy)* · `EXTRACTION QISM D #7` · `vision-1000 #7`
- **⚠️ Diqqat (vizyonga moslik, Q-40):** "flag, not auto-block" **kamchilik emas** — vision-1000 #7 aynan shuni talab qiladi ("qattiq blok emas"). Haqiqiy bo'shliq boshqa: flagning buyurtma **holati** sifatida qotirilmagani va tasdiq kutilayotganda to'lov/yetkazish bloklanmasligi.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-061 · Qisman to'lov va to'lovni fakturalarga taqsimlash
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'lov fakturalarga qo'lda/avtomatik (eng eski avval) taqsimlanadi (aniq aging).
- **Manba:** v2-A + EP-FIN-014 aging
- **Dalil (kod):** Ikki tekshiruv bir xil topilmani turlicha yorliqlagan (Yo'q ╳ Qisman): `grep "invoice_payment_matching|invoice_payments"` butun `apps/api/src` bo'yicha → faqat **sxema/migratsiya** fayllarida (`schema-finance-extended.ts`, `drift-fix-*.sql`), **hech qanday servis faylida emas** — FIFO-taqsimlash algoritmi yo'q. QISM D #8 mustaqil tasdiqlagan: `grep "allocat|apply.*payment|oldest.*invoice"` SD+Finance da = **0**; FIFO faqat COGS/tannarx uchun ishlatiladi (`wms-goods-issued.listener.ts`). `purchase_invoices`/`vendor_invoices` = 0 qator.
- **Nima yetishmaydi:** `PaymentAllocationService.allocateFifo(customerId, amount)` — ochiq `finance_invoices` ni eng eskisidan boshlab yopib, `invoice_payment_matching` ga yozadi + qo'lda o'zgartirish uchun audit-log yozuvi (vision-1000 #8).
- **Bog'liqlik:** EP-FIN-014 (aging), EP-FIN-054 (muddat), EP-FIN-025 (to'lov→GL)
- **action:** UPDATE
- **⤳ Ta'sir:** SD, Aging, Debitor
- **Xoch-havolalar:** `[Module-03] Item 111` · `TASDIQ-2146 §03 #61` · `[Module-03] Item 8` *(taxminiy)* · `EXTRACTION QISM D #8` · `vision-1000 #8`
- **Δ 2026-07-11→08-07:** `0e068ec5` — taqsimlashning **oldingi** zvenosi tuzatildi: `sd_payments.id` (uuid) `Number()` orqali `NaN→0` ga aylanib, har SD to'lovining GL referensi `CP-0` ga tushardi; `GlPostingService` idempotentlik tekshiruvi birinchidan keyingi HAR to'lovni "allaqachon postlangan dublikat" deb o'tkazib yuborardi (faqat eng birinchi mijoz-to'lovi daftarga tushardi). Endi uuid ning oxirgi 12 hex belgisi ishlatiladi (`entries.entry_number varchar(50)` chegarasi sabab). Taqsimlash algoritmining o'zi hamon yo'q.

### EP-FIN-062 · Пеня/jarima — kechikkan to'lovga
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — shartnomaga ko'ra пеня foizi avtomatik (kechikkan kun × stavka). Intizom; egasi standart stavka/qo'llashni tasdiqlasin.
- **Manba:** v2-A
- **Dalil (kod):** `grep "penya|jarima.*to.lov|late.*payment.*penalty"` (case-insensitive) `apps/api/src/modules/finance` bo'yicha → **0 fayl**. Faqat aloqasiz HR payroll `penalty` tushunchasi bor. QISM D #18 aniqroq: yagona yaqin moslik = `wms/dto/wms.dto.ts:24 late_fee_percent` — bu yetkazuvchi-shartnoma **maydoni**, hisob-dvigateli emas.
- **Nima yetishmaydi:** kunlik cron `kechikkan_kun × stavka` ni AR aging ustidan hisoblab, **faqat egasi/moliya-rahbar tasdig'idan keyin** "da'vo receivable" GL yozuvini yozadi (E1); пеня stavkasi va qaysi aging-bucket triggerlashi = egasi-DATA.
- **Bog'liqlik:** `vision-1000 #48` (da'vo hayot-tsikli — bir xil bo'shliq), EP-FIN-038 (vazn farqi→da'vo), EP-FIN-014 (aging)
- **action:** EVENT
- **⤳ Ta'sir:** SD, Aging, Kreditor
- **Xoch-havolalar:** `[Module-03] Item 112` · `TASDIQ-2146 §03 #62` · `[Module-03] Item 18` (dublikat) · `EXTRACTION QISM D #18` · `vision-1000 #18`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-063 · Inventarizatsiya farqi (ombor sanоq) → moliya
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — sanoq farqi avtomatik GL tuzatmasi (kamomad=zarar, ortiqcha=daromad), lekin moliya tekshiradi/tasdiqlaydi. POS Q52-53: inventar GL avtomatik + moliya tasdiq.
- **Manba:** BARCHA_JAVOBLAR POS Q52-53 (inventar GL avto + moliya tasdiq) + v2-A
- **Dalil (kod):** `grep "asset_inventory"` butun `apps/api/src` bo'yicha → **5 moslik, hammasi Finance'dan tashqarida** (`common/database/queries-hr-assets.ts`, `modules/compatibility/repositories/asset-management.repo.ts`, sxema/migratsiya fayllari) — `modules/finance/` da bittasi ham yo'q. `gl-posting.service.ts` posting primitivlari real.
- **Nima yetishmaydi:** sanoq-farqini avtomatik GL'ga postlaydigan listener (moliya tasdig'i gate'i bilan) topilmadi.
- **Bog'liqlik:** EP-FIN-034 (kamomad — ustma-ust domen), EP-FIN-022 (GL — real), WMS cycle-count
- **action:** EVENT
- **⤳ Ta'sir:** Ombor, GL, tannarx
- **Xoch-havolalar:** `[Module-03] Item 113` · `TASDIQ-2146 §03 #63`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-064 · Davr yopish (oy yopilishi) — qulflangan davrga yozuv taqiqi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — davr yopilganda qulflanadi, faqat egasi/moliya rahbari ocha oladi. Immutable tasdiqlangan hujjat (HR Q83) ruhiga mos; mumtoz buxgalteriya.
- **Manba:** BARCHA_JAVOBLAR HR Q83 (immutable tasdiqlangan) + v2-A
- **Dalil (kod):** `gl-posting.service.ts:217-228` — to'g'ridan-to'g'ri o'qish bilan tasdiqlangan: `// EP-FIN-064 PERIOD LOCK` izohi + aniq majburlangan xato `Davr yopilgan (EP-FIN-064): ${entryDate} sanasi yopilgan hisob davriga (${lock.data.periodCode})...`. `accounting_periods` = **0 qator** (qurilish bosqichi — hech bir davr yopilmagan, lekin mexanizm real va majburlangan).
- **Nima yetishmaydi:** *(qurilish uchun yo'q; risk mavjud)* — qulf **faqat `GlPostingService` ichida** yashaydi; boshqa yozuvchilar (payroll/SD/POS yo'llari) chetlab o'tishi mumkinligi qayta tekshirilmagan (QISM A A-cross#2). Davr ochish SoD-endpointi (egasi/moliya rahbari) + correction-entry belgisi (vision-1000 #10/#15) alohida tasdiqlanmagan.
- **Bog'liqlik:** EP-FIN-022 (GL), EP-FIN-030 (SoD), `vision-1000 #49` (P&L "tasdiqlangan" snapshot davr-yopilishiga tayanadi)
- **action:** UPDATE
- **⤳ Ta'sir:** GL, Hisobotlar, Audit
- **Xoch-havolalar:** `[Module-03] Item 114` · `TASDIQ-2146 §03 #64` · `[Module-03] Item 10/Item 15/Item 37` *(taxminiy)* · `vision-1000 #10/#15/#37`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-065 · Совершенствование bo'limi → moliyaviy tahlil roli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — moliyaviy og'ish hisobotlari Совершенствование oylik tahliliga avtomatik kiradi (yagona tahlil markazi). Оргполитика tahlil rolini shu bo'limga beradi; Org-7: 6-Rivojlanish.
- **Manba:** kitob оргполитика + BARCHA_JAVOBLAR Org-7 (6-Rivojlanish) + v2-A
- **Dalil (kod):** `variance-analysis.service.ts` real, jumladan `needsAudit` flagi (`const needsAudit = variancePct > VARIANCE_AUDIT_THRESHOLD_PCT;`, satr 142); `fp-cycle-cron.service.ts` haftalik ritm infratuzilmasi real; oylik cron ham bor.
- **Nima yetishmaydi:** belgilangan og'ishlarning "Rivojlanish" (Coordination) navbatiga **avtomatik marshrutlanishi** tasdiqlanmadi.
- **Bog'liqlik:** EP-FIN-066 (расмий талаб), Coordination moduli
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, Hisobotlar, boshqaruv
- **Xoch-havolalar:** `[Module-03] Item 115` · `TASDIQ-2146 §03 #65`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-066 · Byudjet-fakt og'ishiga talab (расмий талаб) jo'natish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — og'ish chegaradan oshsa → mas'ul kartaga avtomatik tushuntirish talabi (Coordination). Kitob расмий ёзма талаб mexanizmi; karta-model javobgarlik.
- **Manba:** kitob оргполитика (расмий талаб) + karta-model + v2-A
- **Dalil (kod):** `variance-analysis.service.ts:17,142,145,163` — `needsAudit` flagi real va natija obyektida qaytariladi; `financial-reports-alerts.cron.ts` real.
- **Nima yetishmaydi:** flagni **mas'ul KARTAga yo'naltirilgan rasmiy-talab hodisasiga** aylantirish topilmadi; `budget_controls` = 0 qator → jonli byudjet↔fakt taqqos ma'lumoti umuman yo'q, ya'ni trigger baribir ishlamaydi.
- **Bog'liqlik:** EP-FIN-017/018 (byudjet datasi), EP-FIN-032 (karta-limit biriktirish), EP-FIN-065
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, byudjet, karta-model
- **Xoch-havolalar:** `[Module-03] Item 116` · `TASDIQ-2146 §03 #66`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-067 · Buyurtma rentabelligi (har buyurtmadan foyda)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har buyurtma yopilganda rentabellik kartochkasi (daromad − to'liq tannarx). Sub "zararli buyurtma topilsa (narx qayta/ogohlantirish/qabul qilinmaydi)" → EP-FIN-073 minimal narx bilan birga egasidan. Oltin-ip yakuni = foyda.
- **Manba:** LOYIHA-BITGAN §A.2 (oltin-ip→foyda) + §A.6 (70% tahlil) + v2-A
- **Dalil (kod):** `order-costing.service.ts:43-53` — real `findTopProfitable`/`findTopLoss`/`calculate`; controller (`order-costing.controller.ts`) + repo (`drizzle-order-costing.repo.ts`) — jami 6 fayl mos keldi; FE `OrderCosting.tsx`.
- **Nima yetishmaydi:** *(band doirasida qurilgan)* — sub-savol (zararli buyurtma topilganda nima qilish) hamon **egasi-qarori**, EP-FIN-068 bilan birga.
- **Bog'liqlik:** EP-FIN-039 (mehnat tannarxi — asos), EP-FIN-068 (minimal narx), EP-FIN-046
- **action:** READ
- **⤳ Ta'sir:** SD, PP, tannarx
- **Xoch-havolalar:** `[Module-03] Item 117` · `TASDIQ-2146 §03 #67`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-068 · Минимал buyurtma narxi / narxdan past sotuv taqiqi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — narx tannarxdan past bo'lsa → bloklash yoki egasi tasdig'i (zararga sotuv oldi olinadi). EP-FIN-076 marjinal-narx bilan bog'liq.
- **Manba:** v2-A + EP-FIN-067 rentabellik
- **Dalil (kod):** Ikki tekshiruv qarama-qarshi baho bergan (Yo'q ╳ Qisman); `tiered-pricing.service.ts` to'liq o'qish bilan hal qilindi — fayl **faqat hajm-chegirmali narxlash dvigateli** (`calculatePrice`, `listTiers`, `upsertTier`, `minQty`/`maxQty` polosalari bo'yicha moslash); `block`/`min-price`/`below-cost` mantiqi umuman yo'q va tannarx-poli validatsiyasi bilan funksional aloqasi yo'q. `grep "sort.*narx|min.*narx.*blok|minPrice"` `modules/finance` → 0 fayl. `standard_cost` = 0 qator. QISM D #29 qo'shimcha: QC tomonda `qc/domain/services/grade-pricing.service.ts` **real** (`graded_price = base × koeff`, koeff yo'q bo'lsa VALIDATION gate, soxta fallback yo'q; `qc_grade_price_coefficients`/`qc_sort_price_config` VIEW) — lekin bu **narx hisoblaydi**, sotuvni bloklamaydi.
- **Nima yetishmaydi:** SD buyurtma-satri yaratishda saqlashdan-oldingi validatsiya: birlik narxni `order-costing.service.ts` hisoblagan tannarx bilan solishtirib, past bo'lsa bloklash yoki egasi tasdig'ini talab qilish; sort (1/2/3) bo'yicha minimal narx chegara QIYMATLARI = egasi-DATA; "qattiq blok ╳ tasdiq" tanlovi = egasi-qarori.
- **Bog'liqlik:** EP-FIN-067 (tannarx dvigateli — real), EP-FIN-069 (chegirma vakolati), EP-FIN-076 (marjinal narx)
- **action:** APPROVE
- **⤳ Ta'sir:** SD, tannarx, Approval
- **Xoch-havolalar:** `[Module-03] Item 118` · `TASDIQ-2146 §03 #68` · `[Module-03] Item 29` *(taxminiy)* · `EXTRACTION QISM D #29` · `vision-1000 #29`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-069 · Chegirma (skidka) vakolat darajasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11 — "Qisman, Yo'q ga moyil"; 🔑 egasi-DATA)*
- **Talab:** A — chegirma vakolat darajasi (sotuvchi ≤5%, rahbar ≤15%, egasi >15%). Karta-model vakolat; aniq foizlar egasidan.
- **Manba:** v2-A + karta-model (vakolat)
- **Dalil (kod):** EP-FIN-068 bilan bir xil fayl tekshirildi (`tiered-pricing.service.ts`) — u faqat **miqdorga asoslangan narx pog'onalari** (`PriceTier`, `tierName`, `findPriceTierForQty`), tasdiqlovchi roliga bog'langan **vakolat-darajali chegirma foizlari emas**. QISM D #39 qo'shimcha: `director/.../hitl-document-type.enum.ts:11 DISCOUNT_OVERRIDE` mavjud (chegirma > 15% → HITL tasdiq) — bu bandning ruhiga yaqin, lekin per-qator vakolat tekshiruvi emas.
- **Nima yetishmaydi:** 5%/15%/egasi foizlari **ma'lumot sifatida ham, alohida kod yo'li sifatida ham yo'q**; per-qator vakolat tekshiruvi + GL'da chegirma = daromad-ayirma satri (vision-1000 #39) yo'q.
- **Bog'liqlik:** EP-FIN-068, karta-model vakolat; **egasi-DATA: 5%/15% foizlari**
- **action:** APPROVE
- **⤳ Ta'sir:** SD, Approval, karta-model
- **Xoch-havolalar:** `[Module-03] Item 119` · `TASDIQ-2146 §03 #69` · `[Module-03] Item 39` *(taxminiy)* · `EXTRACTION QISM D #39` · `vision-1000 #39`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-070 · О'заро hisob (vzaimозачёт / barter) hisobi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — o'zaro hisob akti tuziladi, ikki tomon qarzi bir vaqtda yopiladi (hujjatli). Hujjatsiz qolsa nazorat yo'qoladi (оргполитика).
- **Manba:** v2-A + EP-FIN-048 (hujjat majburiy)
- **Dalil (kod):** `grep "netting|vzaimoz|взаимозачет|barter"` (case-insensitive) butun `apps/api/src` bo'yicha → **1 moslik, `erp-extra.repository.ts:96`**, kontekstda o'qilganda bu PP modulining MRP lot-sizing/"netting" algoritmi haqidagi **izoh** — inventar-rejalashtirish tushunchasi, moliyaviy o'zaro-hisob emas. QISM D #22 mustaqil tasdiqlagan: ikki-QC-tasdiq + PIN-imzo atomik yopish kodi yo'q; `cc-pin.service.ts` (umumiy CC PIN servisi) aloqasiz.
- **Nima yetishmaydi:** o'zaro-hisob (взаимозачёт) akti entitisi — ikki QC tasdig'idan keyin ikki kontragent AR/AP qoldig'ini **bitta tranzaksiyada atomik** yopadi; PIN-imzo bosqichi uchun `cc-pin.service.ts` qayta ishlatiladi; asimmetrik qoldiq qoidasi (kichik tomon to'liq yopiladi) = vision-1000 #22.
- **Bog'liqlik:** EP-FIN-022 (GL — real), EP-FIN-057 (to'lov usuli "o'zaro hisob"), EP-FIN-048 (hujjat)
- **action:** CREATE
- **⤳ Ta'sir:** SD, MM, debitor/kreditor
- **Xoch-havolalar:** `[Module-03] Item 120` · `TASDIQ-2146 §03 #70` · `[Module-03] Item 22` (dublikat) · `EXTRACTION QISM D #22` · `vision-1000 #22`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-071 · Yetkazib beruvchini moliyaviy baholash (eng arzon/ishonchli)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yetkazib beruvchi reytingi: narx + brak% + kechikiш (eng foydali tanlov). Eng arzon ≠ eng foydali (yashirin brak xarajati).
- **Manba:** v2-A
- **Dalil (kod):** `grep "mm_vendor_ratings|supplier-agent"` butun `apps/api/src` bo'yicha → **11 fayl**, jumladan `modules/agents/supplier-agent.service.ts` va migratsiya `vendor-rating-unified-view-2026-07-02.sql`.
- **Nima yetishmaydi:** narx+brak%+kechikish ni **birlashtiruvchi kunlik cron** tasdiqlanmagan; **Finance-tomon integratsiya yo'q** (Finance faqat iste'molchi bo'lishi kerak edi); "blokni faqat inson (MM rahbari) ochadi" gate'i tasdiqlanmagan (vision-1000 #21, E1).
- **Bog'liqlik:** MM/WMS (asosiy egasi), EP-FIN-037 (AP), EP-FIN-080 (to'lov navbati)
- **action:** READ
- **⤳ Ta'sir:** MM, QC (brak), Ombor
- **Xoch-havolalar:** `[Module-03] Item 121` · `TASDIQ-2146 §03 #71` · `[Module-03] Item 21/Item 44` *(taxminiy, dublikat)* · `EXTRACTION QISM D #21/#44` · `vision-1000 #21/#44`
- **⚠️ ZIDDIYAT:** Item 121 dvigatelni **MM/agents** da joylashtiradi (`mm_vendor_ratings`, `agents/supplier-agent.service.ts`) ╳ QISM D #21 aniqroq manzil beradi: **WMS** — `wms/application/supplier-rating.service.ts` + `wms/presentation/wms-supplier-rating.controller.ts` + `wms/.../supplier-rating.listener.ts` (**event-asosli, KUNLIK cron EMAS**) va `mm/application/mm-vendor-rating.service.ts`. QISM D ustun (fayl-darajali aniqroq) → mexanizm bor lekin **cron emas, listener**; vizyon aynan barqarorlik uchun kunlik cron talab qiladi.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-072 · Naqd kassa limiti va kunlik inkассация
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 tekshirildi — mexanizm "Ha" ga moyil; 🔑 QIYMAT egasi-DATA)*
- **Talab:** A — kassa limiti + oshsa inkассация (bankka topshirish) eslatmasi (xavfsizlik). Klassik naqd nazorat qoidasi; aniq limit egasidan.
- **Manba:** v2-A + EP-FIN-020 kassa
- **Dalil (kod):** `cashier-hub.service.ts:245-263` — real: `perShiftRaw = shiftRes.data.dailyCashLimit`, yo'q bo'lsa `this.repo.findGlobalDailyCashLimit()` ga (manba `cfo_config`) tushadi, `limitExceeded = dailyCashLimit !== null && balance > dailyCashLimit` ni hisoblaydi. **Jonli tekshirildi 2026-08-07:** `apps/api/src/modules/finance/cashier-hub/` katalogida **`cashier-cash-limit-alert.cron.ts` MAVJUD** — ya'ni limit-oshdi alert-cron'i qurilgan.
- **Nima yetishmaydi:** limitning **QIYMATI** (`cfo_config` da, egasi-DATA); "инкассация" (bankka topshirish) amali/hujjati alohida entiti sifatida yo'q — faqat alert bor.
- **Bog'liqlik:** EP-FIN-020 (kassa), EP-FIN-058 (bank), EP-FIN-080 (naqd yetmaganda navbat)
- **action:** CRON
- **⤳ Ta'sir:** Kassa, bank
- **Xoch-havolalar:** `[Module-03] Item 122` · `TASDIQ-2146 §03 #72` · `[Module-03] Item 17` *(taxminiy)* · `EXTRACTION QISM D #17` · `vision-1000 #17`
- **⚠️ ZIDDIYAT:** Item 122 — "'инкассация' (bank-deposit) eslatma/bildirishnoma triggeri **alohida alert sifatida mavjudligi tasdiqlanmadi**" ╳ QISM D #17 + **jonli katalog ro'yxati (2026-08-07)** — `cashier-cash-limit-alert.cron.ts` **fayl sifatida bor** (QISM D uni "EP-FIN-072 = inkassatsiya-alert, limit oshsa xabar" deb ta'riflaydi). Jonli dalil ustun → **alert-cron qurilgan**; qolgan bo'shliq faqat limit QIYMATI va inkassatsiya-hujjati.
- **Δ 2026-07-11→08-07:** —

### EP-FIN-073 · Ish haqi avansi (oyning yarmida) hisobi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — avans HR payroll tsiklida qayd → oxirgi hisob avansni chegiradi. 460 javob Q181 (hamma payroll avto) + Q182 (oylikdan chegirma).
- **Manba:** BARCHA_JAVOBLAR HR Q181/Q182 + memory (payroll compute) + v2-A
- **Dalil (kod):** `apps/api/src/modules/finance/finance-extended/finance-extended-payroll.service.ts:31,49,59,90` — real: `totalDeductions = i.advances + i.loans + i.otherDeductions` — avanslar yakuniy oylik hisob-kitobidan chegirilishi kod bilan tasdiqlangan.
- **Bog'liqlik:** EP-FIN-049 (podotchet/avans berish — real), EP-FIN-074 (ushlanma)
- **action:** EVENT
- **⤳ Ta'sir:** HR, kassa/bank
- **Xoch-havolalar:** `[Module-03] Item 123` · `TASDIQ-2146 §03 #73`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-074 · Jarima/ushlanma (xodim zarari) ish haqidan
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — zarar summasi → tasdiqlansa ish haqidan ushlanma (qonuniy chegara ichida). 460 javob: jarima tasdiqlanmasa yozilmaydi (Q108) + zarar oylikdan chegiriladi (Q182). Sub "maks ushlanma foizi" = egasi/yurist.
- **Manba:** BARCHA_JAVOBLAR HR Q108 (jarima tasdiq) + Q182 (oylikdan chegirma) + v2-A; sub egasidan
- **Dalil (kod):** `finance-extended-payroll.service.ts:67,230-271` — real `type: 'bonus' | 'penalty' | 'adjustment' | 'warning' | 'optimization'` maydoni va aniq izoh bloki: "3.2-brak-ushlanma-zanjiri: ... MES defect-report → `work_centers.brak_limit_pct` gate → HR `fine_rules` siyosati ... **mavjud jarima (fabrikatsiya emas)**", `otherDeductions: brakFines` chegirma-jamiga ulangan. QISM D #13 mustaqil tasdiqlagan (satr 230-242, 271): hal qilinmagan ('open') brak `discipline_records` → `brakFines` → payroll `otherDeductions`.
- **Nima yetishmaydi:** MES tomonining `brak_limit_pct` trigger-emitteri shu faylga qadar uchma-uch kuzatilmagan; ikki-adres alert (sex yetakchi **VA** QC rahbar) + alohida HR-tasdiq gate'i Finance-tomonda yo'q (QC domeni, vision-1000 #13); **maksimal ushlanma foizi = egasi/yurist-DATA**.
- **Bog'liqlik:** MES defect-report → `work_centers.brak_limit_pct` (QC/MES), HR `fine_rules`, EP-FIN-085 (brak% og'ishi)
- **action:** EVENT
- **⤳ Ta'sir:** HR, MES (brak), karta-model
- **Xoch-havolalar:** `[Module-03] Item 124` · `TASDIQ-2146 §03 #74` · `[Module-03] Item 13` *(taxminiy)* · `EXTRACTION QISM D #13` · `vision-1000 #13`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-075 · Loyiha/buyurtma avans to'lovi (mijozdan oldindan)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mijoz avansi alohida (kreditor-mijoz) hisob → yetkazilgach daromadga o'tadi. Avans daromad emas; accrual to'g'riligi (EP-FIN-081 bilan bir).
- **Manba:** v2-A + EP-FIN-081 (accrual standart)
- **Dalil (kod):** `grep "advance_payments|sd_payments.*advance|Money"` `apps/api/src/modules/sd` bo'yicha → **6 fayl** (`drizzle-sales-order.repo.ts`, `create-order.handler.ts`, `sd-invoice-pdf.service.ts`, `sales-order.aggregate.ts` va b.) — avans/Money VO infratuzilmasi SD'da real. RECON SB0811: `advance_percent`/`status` ustunlari bor, **jonli qiymatlar NULL**.
- **Nima yetishmaydi:** avans→daromad **accrual o'tkazish** alohida kod yo'li sifatida tasdiqlanmadi; qisman yetkazishda proporsional daromad va bekor bo'lganda **atomik refund** (vision-1000 #30 — "partial commit yo'q") topilmadi.
- **Bog'liqlik:** EP-FIN-079 (daromad tan olish triggeri), EP-FIN-061 (to'lov taqsimoti)
- **action:** CREATE
- **⤳ Ta'sir:** SD, soliq, debitor
- **Xoch-havolalar:** `[Module-03] Item 125` · `TASDIQ-2146 §03 #75` · `[Module-03] Item 30` *(taxminiy)* · `vision-1000 #30`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-076 · Quvvat-narx: bo'sh quvvat ortganda narx pasaytirish qarori
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bo'sh quvvat + marjinal-narx tahlili → qaror egaga chiqadi (aqlli to'ldirish). EP-FIN-040 ("иш йук") + EP-FIN-068 minimal-narx bilan bog'liq.
- **Manba:** v2-A + EP-FIN-040/068
- **Dalil (kod):** `break-even.service.ts` to'liq o'qildi — real break-even hisob-servisi mavjud, lekin **shu faylda** `grep "idle|marginal|bo.sh.*quvvat"` (case-insensitive) → **moslik yo'q**. Bo'sh-quvvat marjinal-narx tahlili yo'q.
- **Nima yetishmaydi:** `break-even.service.ts` ni bo'sh-stanok buyurtma-to'ldirish ssenariysi uchun marjinal-tannarx narxlash kalkulyatori bilan kengaytirish (qaror-yordamchisi sifatida, **avtomatik qo'llanmaydi** — vizyon bo'yicha yakuniy qaror egasida).
- **Bog'liqlik:** EP-FIN-040 (bo'sh-soat ma'lumoti — qurilmagan), EP-FIN-068 (minimal narx), EP-FIN-067
- **action:** READ
- **⤳ Ta'sir:** PP (quvvat), SD (narx), MES
- **Xoch-havolalar:** `[Module-03] Item 126` · `TASDIQ-2146 §03 #76`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-077 · Tannarx versiyasi (norma o'zgarganda tarix)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — norма/narx versiyali (amal qilish sanasi bilan) → har buyurtma o'z davridagi qiymat bilan. Kitob normasi sanali; immutable tarix (HR Q83/Q107 versiya tarixi).
- **Manba:** kitob (sanali norма hujjati) + BARCHA_JAVOBLAR HR Q107 (versiya tarixi) + v2-A
- **Dalil (kod):** `apps/api/src/modules/finance/domain/services/standard-cost.service.ts:15` — izoh tasdiqlaydi: "recent standard for a period is used; older revisions remain queryable", ya'ni versiyali standart tannarx real, "immutable tarix" talabiga mos; `technology_cards` versiyalash bilan mos.
- **Nima yetishmaydi:** *(qurilish jihatidan yo'q)* — `standard_cost` = 0 qator, ya'ni versiyalash jonli ma'lumot bilan sinalmagan.
- **Bog'liqlik:** EP-FIN-039 (std-cost dvigateli), EP-FIN-035/042 (real sarf), ADR technology_cards
- **action:** CREATE
- **⤳ Ta'sir:** PP (norма), tannarx, hisobotlar
- **Xoch-havolalar:** `[Module-03] Item 127` · `TASDIQ-2146 §03 #77`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-078 · Xarajat-markazi (бўлим/участка bo'yicha xarajат)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har xarajat xarajат-markaziga (bo'limga) bog'lanadi → bo'lim-bo'yicha hisobот (javobgarlik). Kitobda bo'limlar aniq (Флексо/Офсет); karta-model.
- **Manba:** kitob (Флексо/Офсет bo'limlari) + karta-model + EP-FIN-017 byudjet + v2-A
- **Dalil (kod):** `SELECT count(*) FROM cost_centers` → **1 qator** (jonli, minimal). Migratsiya `apps/api/src/shared/db/migrations/gl-entries-cost-center-2026-07-08.sql` mavjud va `entries.cost_center_id` ustuni jonli DB'da tasdiqlangan — **ya'ni "entries'da cost_center_id yo'q" da'vosi eskirgan**. Biroq `gl-posting.service.ts:1-24`: `costCenterId` faqat **ixtiyoriy o'tkazma-teg** ("Does NOT affect any debit/credit/balance logic").
- **Nima yetishmaydi:** xarajat→markaz **avtomatik bog'lanishi** va markaz-darajali hisobot uchma-uch kuzatilmagan; `cost_centers` da atigi 1 qator (egasi-DATA: bo'lim/uchastka ro'yxati).
- **Bog'liqlik:** EP-FIN-051 (energiya taqsimi), EP-FIN-043 (transport), EP-FIN-050 (xarajat toifalari), EP-FIN-017
- **action:** CREATE
- **⤳ Ta'sir:** Barcha ishlаб chiqариш bo'limlari, byudjet, karta-model
- **Xoch-havolalar:** `[Module-03] Item 128` · `TASDIQ-2146 §03 #78` · `[Module-03] Item 24` *(taxminiy, STALE-DOC)* · `vision-1000 #24`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-079 · Daromad tan olish vaqti (yetkazilganda / to'langanда)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yetkazilganda (акт/накладной bilan) tan olinadi (standart accrual). To'g'ri foyda/soliq; EP-FIN-075 mijoz avansi bilan izchil.
- **Manba:** v2-A + EP-FIN-075 (avans ≠ daromad)
- **Dalil (kod):** `gl-posting.service.ts:34` — real `async postSalesInvoice(invoiceId, amount, tax)` metodi, F2 ma'lumot-sifati gate'i bilan (`invoiceId` haqiqiy `finance_invoices` qatoriga olib borishi shart) — yetkazish/faktura-triggerli daromad tan olish mavjudligini ko'rsatadi.
- **Nima yetishmaydi:** uni chaqiradigan **накладной (yetkazish-hujjati) avto-triggeri** mustaqil tasdiqlanmagan; ijara daromadi uchun kunlik akkrual (vision-1000 #40) — `wms-fg-received.listener.ts` mavjud, lekin kunlik-akkrual ritmi tasdiqlanmagan.
- **Bog'liqlik:** EP-FIN-022 (GL — real), EP-FIN-075 (avans→daromad), `vision-1000 #49` (real-time P&L)
- **action:** READ
- **⤳ Ta'sir:** SD, soliq, hisobotlar
- **Xoch-havolalar:** `[Module-03] Item 129` · `TASDIQ-2146 §03 #79` · `[Module-03] Item 40` *(taxminiy)* · `vision-1000 #40`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-080 · To'lov so'rovi (ЗНО) navbati/ustuvorligi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — to'lov ustuvorlik darajasi (sozlanadigan) → navbat avtomatik taklif (ish haqi > soliq > xom-ashyo > boshqa). Pul cheklanganda kritik to'lov kechikmaydi; aniq tartib egasidan.
- **Manba:** v2-A
- **Dalil (kod):** `grep "priority.*queue|ustuvor.*navbat|PriorityQueue"` (case-insensitive) `apps/api/src/modules/finance` bo'yicha → **0 fayl**. Naqd-limit ogohlantirish mexanizmi (EP-FIN-072) bor, lekin ZNO to'lovi uchun tartiblangan ustuvorlik-navbati yo'q. QISM D #17 mustaqil tasdiqlagan: `cashier-cash-limit-alert.cron.ts` = **inkassatsiya-alert (boshqa funksiya)**, "oylik+soliq oldin" ustuvorlik gate'i emas.
- **Nima yetishmaydi:** kutilayotgan ZNO qatorlari ustidan ustuvorlik-tartiblash funksiyasi (oylik > soliq > xom-ashyo) + kassa qoldig'i yetmaganda "Kuting — mablag' yetarli emas" holati (vision-1000 #17); aniq tartib va "yetadi" chegarasi = **egasi-DATA**.
- **Bog'liqlik:** EP-FIN-072 (naqd-limit — real), EP-FIN-002/029 (ZNO ma'lumot modeli), EP-FIN-059 (kalendar)
- **action:** READ
- **⤳ Ta'sir:** ZNO, kassa, byudjet
- **Xoch-havolalar:** `[Module-03] Item 130` · `TASDIQ-2146 §03 #80` · `[Module-03] Item 17` *(taxminiy)* · `EXTRACTION QISM D #17` · `vision-1000 #17`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-081 · Pul aylanма davri (mijoz to'lashi − biz to'lashimiz)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — pul aylanма davri dashboard (debitor kun − kreditor kun + ombor kun) — likвidlik nazorati. AI cash-flow bilan mos.
- **Manba:** v2-A + EP-FIN-059 to'lov-kalendar
- **Dalil (kod):** `grep "financial-ratios|cash.conversion|CCC"` `apps/api/src/modules/finance` bo'yicha → **5 fayl**, jumladan `financial-ratios.service.ts` va `finance-ratios.controller.ts` — ikkalasi real.
- **Nima yetishmaydi:** uchta komponentni (AR aging + AP aging + ombor kun) **bitta raqamga** birlashtiruvchi yagona CCC vidjeti topilmadi; kunlik snapshot va "debitor 60+ kun signal" (vision-1000 #32) tasdiqlanmagan.
- **Bog'liqlik:** EP-FIN-014/015 (aging — real), EP-FIN-059 (forecast — real), EP-FIN-082 (dashboard)
- **action:** READ
- **⤳ Ta'sir:** Aging, ombor, byudjet
- **Xoch-havolalar:** `[Module-03] Item 131` · `TASDIQ-2146 §03 #81` · `[Module-03] Item 32` *(taxminiy)* · `vision-1000 #32`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-082 · Moliyaviy dashboard egasi uchun (1 ekran)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — egaga moliya dashboardи (qoldiq + 7-kun prognoz + qarzlar + foyda). 460 javob Q123: direktorga to'liq, har modul asosiy ko'rsatkichlari.
- **Manba:** BARCHA_JAVOBLAR HR Q123 (direktor to'liq dashboard) + LOYIHA-BITGAN §A.6 + v2-A
- **Dalil (kod):** `grep "FinanceDashboard"` `artifacts/erp-dashboard/src` bo'yicha → **8 fayl**: `FinanceDashboard.tsx`, `FinanceDashboardTabs.tsx`, `FinanceDashboardTabsExtra.tsx`, `FinanceDashboardPayrollTab.tsx`, `FinanceDashboardTypes.ts` + `FinanceDashboard.test.tsx` va `FinanceDashboard.smoke.test.tsx` — real, testlangan egasi-dashboard sahifasi.
- **Nima yetishmaydi:** *(qurilish jihatidan yo'q)* — oziqlantiruvchi manbalarning ba'zilari bo'sh (bank hisoblari 0, aging bucketlar 0), ya'ni ekran render bo'ladi lekin ko'p bloki bo'sh chiqadi.
- **Bog'liqlik:** EP-FIN-027 (company-state), EP-FIN-059 (prognoz), EP-FIN-014/015 (aging), EP-FIN-058 (bank)
- **action:** READ
- **⤳ Ta'sir:** Barcha moliya ekranlari, boshqaruv
- **Xoch-havolalar:** `[Module-03] Item 132` · `TASDIQ-2146 §03 #82`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-083 · "Режа қоғози"da imzo/qabul-topshириш zanjiri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har bosqichda elektron tasdiq (kim berdi / kim oldi / qachon) — uzilmas zanjir. Kitob "Qabul qildim: F.I.O/Imzo"; 460 javob: hujjat status zanjiri + imzo tasdiq (Q77-78).
- **Manba:** kitob (Режа қоғози imzo) + BARCHA_JAVOBLAR HR Q77-78 (imzo/status zanjiri) + v2-A
- **Dalil (kod):** `grep "approval_request_steps|podotchet.*inson.*tasdiq"` butun `apps/api/src` bo'yicha → **3 fayl**: `create-approval-request.handler.ts`, `approval-steps.repository.ts`, migratsiya `approval-request-steps-2026-06-21.sql` — umumiy ko'p-bosqichli tasdiq-zanjiri mexanizmi real.
- **Nima yetishmaydi:** "reja qog'ozi"ga **maxsuslashtirilgan** imzo/qabul-topshirish zanjiri (kim berdi / kim oldi / qachon) yo'q — umumiy mexanizm shu hujjat turiga moslashtirilmagan.
- **Bog'liqlik:** EP-FIN-033 (reja qog'ozi oqimining o'zi — Yo'q), EP-FIN-048 (hujjat majburiyligi)
- **action:** APPROVE
- **⤳ Ta'sir:** Ombor, Coordination, karta-model
- **Xoch-havolalar:** `[Module-03] Item 133` · `TASDIQ-2146 §03 #83` · `[Module-03] Item 83` (asosiy oqim)
- **Δ 2026-07-11→08-07:** —

### EP-FIN-084 · Faktura-to'lov-yetkaziш uchligi (3-way match)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — 3-way match: zakaz=faktura=kirim bo'lmasa to'lов bloklanadi (ortiqcha to'lov oldi olinadi). POS Q22 EXTERNAL_OUT: Ombor menejer + Moliya + AI to'lov tekshiruv; kitob kelgan/qabul farqi (EP-FIN-038).
- **Manba:** BARCHA_JAVOBLAR POS Q22 (moliya+AI to'lov tekshiruv) + kitob (qabul gr) + v2-A
- **Dalil (kod):** `grep "validateThreeWayMatch|ThreeWayMatchFailedEvent"` `apps/api/src/modules/mm` bo'yicha → **5 fayl**: `goods-receipt.handler.ts`, `three-way-match-failed.listener.ts`, `three-way-match-failed.event.ts`, `drizzle-mm.repo.ts`, `mm.repository.ts` — real, ulangan 3-way-match validatsiyasi maxsus xato-hodisasi va listeneri bilan.
- **Nima yetishmaydi:** ⚠️ **muhim nuans** — moslik **tovar-qabuli vaqtida** amalga oshadi, **to'lov vaqtida emas**: to'lov chiqarish match-statusini qayta tekshirmaydi (Item 20 / QISM A #20 / FINANCE-FULL B10). Ya'ni "**to'lov bloklanadi**" talabining aynan bloklash qismi qurilmagan. Qisman yetkazishda (80%) proporsional match/to'lov ham yo'q.
- **Bog'liqlik:** EP-FIN-038 (vazn farqi→da'vo — hodisa iste'molchisi yo'q), EP-FIN-037 (AP), EP-FIN-025 (to'lov→GL)
- **action:** APPROVE
- **⤳ Ta'sir:** MM, Ombor, ZNO, kreditor
- **Xoch-havolalar:** `[Module-03] Item 134` · `TASDIQ-2146 §03 #84` · `[Module-03] Item 20` *(taxminiy)* · `EXTRACTION QISM A #20 + Step-3` · `vision-1000 #20`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-085 · Brak% chegarasi oshsa tannarx ogohlantiruvi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — brak% > norма → tannarx og'ishi + ogohlantirish (erta nazorat). Kitob "Станоклар норма брак %"; QC bilan ulanadi.
- **Manba:** kitob (норма брак %) + v2-A
- **Dalil (kod):** `grep "defect_catalog|brak.*norma|defectRate|defect_rate"` (case-insensitive) `apps/api/src/modules/finance` bo'yicha → **0 fayl**. QC'ning `defect_catalog` i mavjud, lekin Finance'ning og'ish/tannarx-deviatsiya dvigateliga **ulanmagan**.
- **Nima yetishmaydi:** QC `defect_catalog`/brak-darajasi hodisalari uchun listener → mavjud `variance-analysis.service.ts` `needsAudit` chegara mantiqiga ulash (sababni brak%-asosli deb teglash); trigger qiluvchi brak-darajasi chegarasi = egasi-DATA.
- **Bog'liqlik:** EP-FIN-066 (variance dvigateli — real), EP-FIN-041 (brak zarar-hisobi), EP-FIN-074 (ushlanma), QC `defect_catalog`
- **action:** EVENT
- **⤳ Ta'sir:** QC, MES, tannarx
- **Xoch-havolalar:** `[Module-03] Item 135` · `TASDIQ-2146 §03 #85`
- **Δ 2026-07-11→08-07:** —

### EP-FIN-086 · Yangi material/stanok narxini kim kiritadi (master-data egaligi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — narx master-data faqat Бухгалтерия/moliya kartasi egaligida, boshqalar o'qiydi (yagona haqiqat). Оргполитика "bitta egа" + karta-model (EP-FIN-047 bilan bir).
- **Manba:** kitob оргполитика + karta-model + EP-FIN-047 + v2-A
- **Dalil (kod):** `grep "MASTER_DATA_STANDARTLARI|material.*narx.*faqat|narx.*yozish.*huquq"` `docs/MASTER_DATA_STANDARTLARI.md` bo'yicha → bu aniq invariant iborasi uchun **to'g'ridan-to'g'ri matn mosligi yo'q**. `grep "RolesGuard|@Roles"` `apps/api/src/modules/mm/presentation` → **8 controller** `RolesGuard` ishlatadi, lekin **"narx maydoni faqat Moliya roli uchun"** deb majburlaydigan MM controlleri topilmadi; `finance-gl.controller.ts` esa `Role.ACCOUNTANT/DIRECTOR/SUPER_ADMIN` ga gated (EP-FIN-047 dalili).
- **Nima yetishmaydi:** material/stanok **NARX** yozuvini faqat Moliya/Buxgalteriya **kartasiga** cheklovchi aniq invariant; haqiqiy karta-darajali yozish-qulfi uchun `head_user_id` (egasi-DATA) kerak.
- **Bog'liqlik:** EP-FIN-047 (dublikat), EP-FIN-032 (karta-daraja biriktirish), EP-FIN-036 (narx metodi)
- **action:** APPROVE
- **⤳ Ta'sir:** Master-data, barcha modullar, karta-model
- **Xoch-havolalar:** `[Module-03] Item 136` · `TASDIQ-2146 §03 #86` · `[Module-03] Item 97` (dublikat)
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-bandlar (VR-FIN-I01..I10)

> **Manba:** `FULL-VISION-EXTRACTION` I2-intervyu — `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md`
> (asli `EUROPRINT-INTERVYU-SAVOL-JAVOB.md`, 59 savol, egasining to'g'ridan-to'g'ri javoblari, 1-4 iyun 2026).
> Intervyu OMBOR·POS·KASSIR·TA'MINOT ni qamraydi; quyida faqat **kassir/naqd/moliya** tegishli bandlar.
> Bu bandlarning **EP-FIN kodi yo'q** — ular `decisions/03-finance.md` ga kirmagan, shuning uchun
> "Qaror holati" ustuni egasining intervyudagi bevosita gapiga tayanadi.

### VR-FIN-I01 · Qog'ozsiz naqd: BARCHA chiqim CC 3-savat + Kanban orqali kassirga
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §0 s14)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** "Hech kim qog'oz bilan kelmaydi" — oylik/avans ham qo'shilib, **HAR qanday naqd chiqim** Coordination 3-savat + Kanban orqali kassirga keladi (markazlashgan, qog'ozsiz naqd nazorati).
- **Manba:** I2-OMBOR·KASSIR §0, s14
- **Dalil (kod):** Kassir sub-moduli real va jiddiy (`cashier-hub.service.ts` + `cashier-podotchet.service.ts` + `cashier-payroll.service.ts`, PIN-gated); ammo CC 3-savat ↔ Kanban ↔ kassir **birlashuvi to'liq emas** (I2 Step-3: "CC 3-Savat hujjat oqimi TO'LIQ EMAS — egasi 'keyingi rejalarga to'liq qilish' dedi").
- **Nima yetishmaydi:** CC 3-savat → Kanban → kassir-to'lov zanjirining uchma-uch ulanishi; QISM A Step-3 ham buni tasdiqlaydi: "Karta→kassir oylik-to'lov zanjiri ulanmagan; `/salary-payouts/pay` FE-caller yo'q — to'liq tasdiqlangan to'lovni UI'dan bajarib bo'lmaydi (pul drawer'dan chiqmaydi)".
- **Bog'liqlik:** EP-FIN-003 (3-savat), EP-FIN-020/021 (kassir), Coordination + Kanban modullari
- **action:** EVENT
- **⤳ Ta'sir:** Finance-Kassir, CC, Kanban, HR (oylik/avans)
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #2` · `EXTRACTION QISM A Step-3 (D19 salary-payout)` · `[Module-03] Item 45` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I02 · Bitta kassir: oylik + avans tarqatadi va HAMMA naqdni nazorat qiladi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §8 s9-14)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Kompaniyada **1 ta kassir** — oylik va avansni tarqatadi hamda barcha naqd harakatini nazorat qiladi (markaziy naqd nazorati).
- **Manba:** I2-OMBOR·KASSIR §8, s9-14
- **Dalil (kod):** `cashier-hub.service.ts` — `openShift`/`recordMovement`/`closeShift`/`getShiftLedger` to'liq tsikl (EP-FIN-020 dalili); `cashier-payroll.service.ts` + `cashier-payroll.controller.ts` mavjud; `FinanceExtendedPayroll` real.
- **Nima yetishmaydi:** "yagona kassir" roli **kod-invarianti** sifatida majburlanmagan (bir vaqtda bir necha ochiq smenani cheklovchi qoida topilmadi); jonli `cashier_shifts` = 1 qator (doim-ochiq smena), `cashier_movements` = 0.
- **Bog'liqlik:** VR-FIN-I01, EP-FIN-020, EP-FIN-030 (SoD/PIN)
- **action:** CREATE
- **⤳ Ta'sir:** Finance-Kassir, HR
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #17` · `[Module-03] Item 70`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I03 · Oylik/avans NAVBATI xodim REYTINGIga qarab
- **Qaror holati:** 🔵 OCHIQ — **egasi ATAYLAB keyinga qoldirdi** ("chalg'ib ketamiz", I2 §8 s12)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** To'lov navbati xodim reytingi bo'yicha belgilanadi; **reyting formulasining o'zi keyinga qoldirilgan**.
- **Manba:** I2-OMBOR·KASSIR §8 s12 + §16 (Step-3 ochiq savol)
- **Dalil (kod):** Reyting-asosli to'lov navbati kodi topilmadi; formula ham yo'q. I2 Step-3 buni ochiq savol sifatida qayd etgan.
- **Nima yetishmaydi:** **egasi-DATA/qaror**: xodim reyting formulasi. Ko'p narsa shunga bog'liq (to'lov navbati) — bu bandni qurishdan oldin formula kerak.
- **Bog'liqlik:** HR reyting/KPI moduli, VR-FIN-I01, EP-FIN-080 (ZNO navbati — o'xshash ustuvorlik muammosi)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance-Kassir, HR
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #18` · `I2 Step-3 (xodim reyting formulasi)`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I04 · Har xodim kunlik ishlagan pulini har kuni PDF oladi (Telegram + ERP)
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §8 s63 + A4/A7)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har xodim kun oxirida avtomatik PDF oladi (Telegram + ERP). A4: uskunachi uchun = real ishlab chiqargani; ofis uchun = oylik ÷ ish-kuni. A7: kun oxirida avtomatik.
- **Manba:** I2-OMBOR·KASSIR §8 s63 + A4/A7
- **Dalil (kod):** PDF infratuzilmasi real (`cashier-hub-pdf.service.ts`, `trial-balance-pdf.service.ts` — `pdf-lib`); Telegram kanali real (`financial-reports-telegram.service.ts`, `bot.helpers.ts`). `payroll_journal_entries`/`payroll_rows` = **0 qator**.
- **Nima yetishmaydi:** MES-sessiya × stavka bo'yicha kunlik PDF generatori + cron 22:00 + 3 marta qayta urinish (`vision-1000 #45`); sessiya yopilmagan bo'lsa yubormaslik gate'i.
- **Bog'liqlik:** MES sessiya ma'lumoti, EP-FIN-031 (hisobot/PDF), EP-FIN-039 (stavka)
- **action:** CRON
- **⤳ Ta'sir:** Finance, NTF/Telegram, HR
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #19` · `[Module-03] Item 45` *(taxminiy)* · `vision-1000 #45`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I05 · HAR SO'M HISOBLI — pul olsa xodim profiliga qarz, omborga kirim bo'lmaguncha yopilmaydi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §8 s64)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Xodim pul olsa profiliga qarz yoziladi; **omborga kirim bo'lmaguncha** profilda qarz bo'lib turadi (to'liq podotchet).
- **Manba:** I2-OMBOR·KASSIR §8, s64
- **Dalil (kod):** `cashier-podotchet.service.ts` — `issueAdvance()` (Dr 4000 AR / Cr 5010 Kassa, `employee_debt` ochadi), `submitAdvanceReport()` (majburiy chek), `approveAdvanceReport()` (inson tasdig'i qarzni yopadi, idempotent), `getEmployeeDebt()` (jami/ochiq/hisobot-kutilayotgan/toifa bo'yicha). `employee_debt`/`advance_reports` = 0 qator (qurilish bosqichi).
- **Nima yetishmaydi:** *(kod jihatidan yo'q)* — "omborga kirim" hodisasi bilan avtomatik yopilish (hozir inson tasdig'i orqali) tasdiqlanmagan.
- **Bog'liqlik:** EP-FIN-049 (podotchet — real), VR-FIN-I06
- **action:** CREATE
- **⤳ Ta'sir:** Finance-Kassir, HR, WMS
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #20` · `[Module-03] Item 99` · `[Module-03] Item 14` *(taxminiy)* · `vision-1000 #14`
- **Δ 2026-07-11→08-07:** `633bc74b` — ADVANCE mapping'ining seed qilinmagan `4200` hisobi seed qilindi; avval har ADVANCE tasdig'ining GL-postingi jimgina yiqilardi (EP-FIN-049 Δ bilan bir).

### VR-FIN-I06 · Chek (taksi va h.k.): xodim yuklaydi → AI o'qiydi va solishtiradi → ODAM yakuniy tasdiqlaydi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §8 s68/s11 — **E1 printsipi**)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Xodim chekni yuklaydi → AI o'qiydi va summani solishtiradi → **yakuniy qarorni ODAM (kassir/moliya) qabul qiladi** (E1: salbiy ta'sir inson tasdig'isiz emas).
- **Manba:** I2-OMBOR·KASSIR §8, s68 + s11
- **Dalil (kod):** `cashier-podotchet.service.ts` `submitAdvanceReport()` — majburiy chek + ixtiyoriy AI-OCR summa-solishtirish (`AiRouterService` orqali) + AI mavjud bo'lmasa muloyim fallback; `approveAdvanceReport()` — inson tasdig'i qarzni yopadi (idempotent).
- **Nima yetishmaydi:** *(kod jihatidan yo'q)* — AI noto'g'ri o'qib, kassir ham o'tkazib yuborsa correction-entry oqimi (`vision-1000 #15`) — reversal kodi real (`finance-accounting.service.ts:360-382`), lekin "davr yopiq bo'lsa avtomatik ochish" tarmog'i topilmadi.
- **Bog'liqlik:** EP-FIN-049, EP-FIN-064 (davr qulfi), AI-router
- **action:** APPROVE
- **⤳ Ta'sir:** Finance-Kassir, AI
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #21` · `[Module-03] Item 99` · `[Module-03] Item 15` *(taxminiy)* · `vision-1000 #15`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I07 · Oylik/avans/kredit — jarima va mukofot pullaridan ALOHIDA turadi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §8 s67)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Oylik / avans / kredit pul oqimi bilan jarima va mukofot pullari **aralashmaydi** — alohida hisobda turadi.
- **Manba:** I2-OMBOR·KASSIR §8, s67
- **Dalil (kod):** `finance-extended-payroll.service.ts:67` — `type: 'bonus' | 'penalty' | 'adjustment' | 'warning' | 'optimization'` maydoni turlarni ajratadi; `totalDeductions = i.advances + i.loans + i.otherDeductions` (satr 31/49/59/90) avans va kreditni alohida komponent sifatida saqlaydi.
- **Nima yetishmaydi:** turlarning **alohida GL hisoblariga**/alohida naqd oqimiga ajralishi tasdiqlanmagan (hozir bitta chegirma-jamiga qo'shiladi); kassir tomonida alohida "jarima/mukofot" savati yo'q.
- **Bog'liqlik:** EP-FIN-073 (avans chegirmasi), EP-FIN-074 (ushlanma), EP-FIN-050 (toifalash)
- **action:** UPDATE
- **⤳ Ta'sir:** Finance-Kassir, HR-Payroll
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #22` · `[Module-03] Item 123/Item 124`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I08 · Tayyor-mahsulot ombori IJARA daromadi: 30 kun bepul → keyin kunlik m² (sozlanadigan)
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §6 s53 + A2 — "**SOZLANADIGAN**, muhim mijozga moslash uchun")
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Tayyor mahsulot omborda 30 kun bepul turadi → keyin kunlik m² bo'yicha ijara haqi hisoblanadi → menejerga tushadi. **Chegara va tarif sozlanadigan bo'lishi shart.**
- **Manba:** I2-OMBOR·KASSIR §6 s53 + §17 A2
- **Dalil (kod):** `apps/api/src/modules/finance/infrastructure/event-handlers/wms-fg-received.listener.ts` mavjud (RECON SB0280 RESOLVED — `areaM2` ixtiyoriy).
- **Nima yetishmaydi:** kunlik akkrual ritmi (`vision-1000 #40`: "har kuni kichik yozuv bilan accrual") va 90+ kun ijara qarzining aging'ga tushishi tasdiqlanmagan; **30 kun / kunlik m² tarifi = egasi-DATA** (business_settings orqali CRUD bo'lishi kerak).
- **Bog'liqlik:** EP-FIN-079 (accrual standarti), EP-FIN-014 (aging), WMS FG
- **action:** CRON
- **⤳ Ta'sir:** WMS, Finance, SD
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #15` · `[Module-03] Item 40` *(taxminiy)* · `vision-1000 #40`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I09 · Brak normadan oshiq bo'lsa xodim ish haqidan ushlanadi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §5 s39-48)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har buyurtmaga brak NORMASI belgilanadi; normadan oshgan brak xodim ish haqidan ushlanadi (isrof/o'g'irlik nazorati).
- **Manba:** I2-OMBOR·KASSIR §5, s39-48 (+ vision-1000-answers HR#5 bilan bog'liq: salbiy ball faqat rahbar tasdig'i bilan)
- **Dalil (kod):** `finance-extended-payroll.service.ts:230-271` — "3.2-brak-ushlanma-zanjiri" izoh bloki: MES defect-report → `work_centers.brak_limit_pct` gate → HR `fine_rules` siyosati; hal qilinmagan ('open') brak `discipline_records` → `brakFines` → payroll `otherDeductions` (**mavjud jarima, fabrikatsiya emas**).
- **Nima yetishmaydi:** MES tomonining emitteri uchma-uch kuzatilmagan; **maksimal ushlanma foizi = egasi/yurist-DATA**; brak% > norma → tannarx-og'ish ogohlantiruvi (EP-FIN-085) hamon yo'q.
- **Bog'liqlik:** EP-FIN-074 (dublikat mavzu), EP-FIN-085, QC/MES defect
- **action:** EVENT
- **⤳ Ta'sir:** WMS, HR-Payroll, QC, MES
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #11` · `[Module-03] Item 124` · `EXTRACTION QISM D #13` · `vision-1000 #13`
- **Δ 2026-07-11→08-07:** —

### VR-FIN-I10 · "Lahtak" (qoldiq) javobgarligi — aybdorni ombor menejeri qo'lda belgilaydi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi bevosita, I2 §6 s54)
- **Qurilish holati:** Qisman *(2026-07-11, STALE-DOC tuzatilgan)*
- **Talab:** Lahtak (qoldiq) aybdor profiliga yoki tayyor-mahsulot omboriga o'tadi; **aybdorni ombor menejeri qo'lda belgilaydi**. Moliyaviy tomoni (`vision-1000 #41`): lahtak inventar **aktiv bo'lib qoladi** — menejer balansiga o'tmaydi, GL'da o'tkazma yozilmaydi; faqat **mas'uliyat belgisi + KPI ta'siri**; lahtak sotilsa daromad kompaniyaga tushadi.
- **Manba:** I2-OMBOR·KASSIR §6 s54 + `vision-1000 #41`
- **Dalil (kod):** Manba hujjatda "holat yo'q" edi; yangi tekshiruvda topildi — `apps/api/src/modules/wms/application/rulon-card.service.ts` `full → opened → remnant` rulon-holat hayot-tsiklini amalga oshiradi (`RULON_STATUS_REMNANT` = "remnant" = lahtak), commit `041d1abf` bilan tasdiqlangan. `rulon_cards` ustunlari o'qildi: `roll_code, qr_label, width_mm, ..., status` — **`responsible_user_id`/KPI/GL ustuni yo'q**. `rulon_cards` = 0 qator.
- **Nima yetishmaydi:** "mas'uliyat belgisi" (javobgar menejer profili) va KPI-ulanish sxemada yo'q. ⚠️ Diqqat: GL o'tkazmasining **yo'qligi to'g'ri** — vizyon aynan shuni talab qiladi (Q-40: "ishlamayapti" deb noto'g'ri baholanmasin).
- **Bog'liqlik:** WMS rulon-karta, HR KPI, EP-FIN-034 (kamomad)
- **action:** UPDATE
- **⤳ Ta'sir:** WMS, HR (KPI), Finance (hisobot)
- **Xoch-havolalar:** `I2-OMBOR·KASSIR #16` · `[Module-03] Item 41` *(STALE-DOC)* · `EXTRACTION QISM D #41` · `vision-1000 #41`
- **⚠️ ZIDDIYAT:** QISM D #41 — "`grep lahtak` butun `apps/api/src` = **0 fayl**, lahtak-model yo'q" ╳ Item 41 — "`rulon-card.service.ts` da `RULON_STATUS_REMNANT` hayot-tsikli **bor**". Ikkalasi ham to'g'ri: o'zbekcha "lahtak" atamasi kodda ishlatilmagan, ingliz "remnant" ishlatilgan. **Terminologiya drifti** — `docs/LUGAT.md` ga `lahtak = remnant` yozilishi kerak.
- **Δ 2026-07-11→08-07:** —

---

## III QISM — Kesishuvchi bloklovchilar, egasi-DATA navbati va Δ-jurnali

### §III.1 — Kesishuvchi bloklovchilar (BL-FIN-01..11)

> Manba: `FULL-VISION-EXTRACTION` QISM A Step-3 (Finance ochiq savollari, 2026-06-08) —
> 2026-07-11 FULL-ITEM-LEVEL tekshiruvi bilan yangilangan. Bular alohida band emas: har biri
> bir nechta EP-FIN bandini bir vaqtda bloklaydi.

| # | Bloklovchi | Ta'sirlangan bandlar | 2026-08-07 holati |
|---|---|---|---|
| **BL-FIN-01** | **4-hisob (MAIN/TAX/HEAD/WORKING) balans-ko'rinishi yo'q** — teglash bor (`income-split.service.ts`, `income_split_config`=4), alohida fond-balans va versiyali foiz-konfig yo'q | EP-FIN-004, 005, 006, 046 *(vision-1000 #46)*, 055 | Qisman hal — QISM A "umuman yo'q" bahosi eskirgan (⚠️ EP-FIN-005 ZIDDIYAT) |
| **BL-FIN-02** | **POS→GL ikki-olam**: `pos_gl_postings` subledger ╳ kanonik `entries`; ikki dedup-kalit → **double-post xavfi** (SAP#76 regress) | EP-FIN-021, 022, 025, 063 · `vision-1000 #12` | Qisman hal — `633bc74b` 3 ta o'quvchini `entries` ga qaytardi; **POS yozuvchi tomoni hamon parallel** (⚠️ EP-FIN-021 ZIDDIYAT) |
| **BL-FIN-03** | **Payroll soliqlari close-path'da hisoblanmaydi** — `PayrollTaxService` real lekin **hech kim chaqirmaydi**; `postPayrollEntry` repo'da yo'q | EP-FIN-056, 073, 074 · `vision-1000 #38/#45` | Ochiq — "4-xil stavka ziddiyati" **hal bo'lgan** (yagona to'plam: INPS 12% / xodim JSHD 1% / ish beruvchi JSHD 12%), lekin **sim yo'q** |
| **BL-FIN-04** | **AR/AP aging kanonik jadval noaniqligi** — `finance_invoices` (8 qator) ╳ eski `fi_invoices` (7 qator); aging qaysi birini o'qishi qayta tasdiqlanmagan | EP-FIN-014, 015, 016, 037, 054, 061 | Ochiq — ikkala jadvalda ham data bor, "~85M kam ko'rsatadi" ramkasi eskirgan |
| **BL-FIN-05** | **62.8B UZS axlat POS qator** butun ledgerni buzadi (manba `total_amount=0`) | EP-FIN-046, 049 *(P&L)*, 082 | Ochiq — purge kerak; posting summasi manba-hujjatga tekshirilmagan |
| **BL-FIN-06** | **FX kursi jim eskiradi** — fake-success cron (0 fetch, 0 insert, "✅ processed=5" logi), `updated_at` yo'q; `currencies` ╳ `exchange_rates` 1.5–3.7% farq | EP-FIN-053, 058 · `vision-1000 #11` | Ochiq — `4241faa0` FX-siz jo'natmalarni **ataylab o'tkazib yuboradi + sabab loglaydi** (soxta konvertatsiya qilinmadi, Q-40) |
| **BL-FIN-07** | **To'lov-vaqtida 3-way match gate yo'q** (faqat qabul-vaqtida); vendor-payment GL'ga ulanmagan | EP-FIN-084, 038, 025, 037 · `vision-1000 #20` | Ochiq |
| **BL-FIN-08** | **Davr yopish inert** — `accounting_periods`=0; period-lock faqat `GlPostingService` ichida, boshqa yozuvchilar (payroll/SD/POS) chetlab o'tishi mumkin | EP-FIN-064, 019, 049 · `vision-1000 #10/#15/#37` | Ochiq |
| **BL-FIN-09** | **Karta→kassir oylik-to'lov zanjiri ulanmagan** — `/salary-payouts/pay` FE-caller yo'q (pul drawer'dan chiqmaydi) | VR-FIN-I01, I02, I04 · `vision-1000 #45/#50` | Ochiq — terminal UI bo'shlig'i, GL mantiqidan alohida bloker |
| **BL-FIN-10** | **Allocation dvigateli yo'q** — transport/energiya/cost-center taqsimlash; `entries.cost_center_id` faqat **passiv teg** | EP-FIN-043, 051, 078, 024 *(#24)* | Qisman hal — ustun endi **mavjud** (`gl-entries-cost-center-2026-07-08.sql`), lekin formula/dvigatel yo'q |
| **BL-FIN-11** | **SoD inert** — jonli `accountant`/`finance_officer` foydalanuvchi yo'q, hammasi `super_admin`/`director` ga tushadi; `org_departments.head_user_id` = **18/143** | EP-FIN-009, 030, 032, 066, 086 | Ochiq — kod-daraja SoD **real**, provizion/egasi-DATA yetishmaydi |

### §III.2 — Egasi-DATA navbati (qiymat kutayotgan bandlar)

> ⭐ **Qoida (memory `feedback_threshold_values_always_crud`):** bu qiymatlar chatda so'ralmaydi —
> `business_settings`/`cfo_config` ga **default bilan qo'shilib**, CRUD orqali egasi tomonidan sozlanadi.
> Quyidagi ro'yxat "qaysi sozlama-yozuvlari yaratilishi kerak" degan ish-ro'yxati.

| Band | Kutilayotgan qiymat/qaror | Turi |
|---|---|---|
| EP-FIN-005/006 | Tushum-taqsim foizlari (MAIN/TAX/HEAD/WORKING) | CRUD-sozlama (`income_split_config` — jadval bor, qiymat tasdiqsiz) |
| EP-FIN-012 | O'zbekiston bank/milliy bayramlari kalendari | Master-data seed |
| EP-FIN-017 | Bo'lim/karta darajasidagi byudjet raqamlari | Master-data (egasi/moliya) |
| EP-FIN-034 | "Kamomad ╳ normal og'ish" tolerantligi + zararni kimga yozish | CRUD-sozlama |
| EP-FIN-036 | ⭐ **FIFO ╳ weighted-average** — tannarx metodi | **Arxitektura qarori** (chatda so'raladigan turdagi) |
| EP-FIN-038 | Vazn-farqi tolerantligi + da'vo marshruti | CRUD-sozlama |
| EP-FIN-040/051/076 | Stanok soatlik ustama-xarajat va energiya stavkasi | CRUD-sozlama |
| EP-FIN-041 | Makulatura sotuv-narxi va daromad-hisobi marshruti | CRUD-sozlama (hisob 9820 tayyor) |
| EP-FIN-042 | Gilza depozit qiymati + 90-kun chegarasi | CRUD-sozlama |
| EP-FIN-044 | Yelim retsepti sarf-normalari (сода/крахмал/бура) | Master-data |
| EP-FIN-050 | Xarajat-toifalar taksonomiyasi | Master-data |
| EP-FIN-052 | 30 stanok/asosiy-vosita reestri (qiymat, muddat) | Master-data (memory: egasi-DATA #89) |
| EP-FIN-054 | Yetkazuvchi standart kredit-muddati profillari | Master-data |
| EP-FIN-055 | ⭐ **Rasmiy-fiskal QQS integratsiya darajasi** | **Arxitektura qarori** |
| EP-FIN-058 | Bank hisob raqamlari va boshlang'ich qoldiqlari | Master-data |
| EP-FIN-062 | Пеня stavkasi + qaysi aging-bucket triggerlashi | CRUD-sozlama |
| EP-FIN-068 | Sort (1/2/3) bo'yicha minimal narx chegaralari + "blok ╳ tasdiq" tanlovi | CRUD-sozlama + qaror |
| EP-FIN-069 | Chegirma vakolat foizlari (5% / 15% / egasi) | CRUD-sozlama |
| EP-FIN-072 | Naqd kassa kunlik limiti (`cfo_config`) | CRUD-sozlama |
| EP-FIN-074 / VR-FIN-I09 | Maksimal ushlanma foizi (qonuniy chegara) | CRUD-sozlama + yurist |
| EP-FIN-078 | Bo'lim/uchastka (`cost_centers`) ro'yxati — hozir 1 qator | Master-data |
| EP-FIN-080 | ZNO ustuvorlik tartibi + "yetadi" chegarasi | CRUD-sozlama |
| EP-FIN-085 | Brak% chegarasi (tannarx-og'ish triggeri) | CRUD-sozlama |
| VR-FIN-I03 | ⭐ **Xodim reyting formulasi** (to'lov navbatini belgilaydi) | **Egasi ataylab keyinga qoldirdi** |
| VR-FIN-I08 | Ombor ijarasi: bepul kunlar (30) + kunlik m² tarifi | CRUD-sozlama (egasi "sozlanadigan" dedi) |

### §III.3 — Δ-jurnali (2026-07-11 → 2026-08-07)

> Buyruq: `git log --since=2026-07-11 --oneline -- apps/api/src/modules/finance/ artifacts/erp-dashboard/src/pages/Finance* artifacts/erp-dashboard/src/pages/CashierHub.tsx` → **7 commit**.
> Hech biri FE `Finance*`/`CashierHub.tsx` ga tegmagan — barchasi backend.

| Commit | Mazmun | Ta'sirlangan bandlar |
|---|---|---|
| `fcf401fa` | **`verifyPayment` GL-fail kompensatsiyasi (T25)** — eng zaif pul↔GL oynasi: status `verified` ga o'tib, GL posting yiqilsa to'lov **daftarsiz** qolardi (faqat hech kim o'qimaydigan `glError` maydoni bilan). Endi CTE bilan `previous_status` tutiladi, GL yiqilsa qaytariladi va `Err('EXTERNAL_5XX')` qaytadi; revert ham yiqilsa CRITICAL log. **Jonli o'qildi 2026-08-07** — kod tasdiqlandi; ⚠️ **fayl JSDoc'i (satr 29-34) yangilanmagan**, hamon eski "soft-fail" xatti-harakatini tasvirlaydi. | EP-FIN-025 (asosiy), 022 |
| `0e068ec5` | **`CP-0` to'qnashuvi** — `sd_payments.id` (uuid) `Number()` orqali `NaN→0` ga aylanib, HAR SD to'lovining GL referensi bir xil `CP-0` bo'lardi; idempotentlik tekshiruvi birinchidan keyingi hammasini "dublikat" deb tashlab yuborardi (faqat **eng birinchi** mijoz-to'lovi daftarga tushardi). Uuid ning oxirgi 12 hex belgisi ishlatiladi (`entries.entry_number varchar(50)` chegarasi + `gl_entries` VIEW bog'liqligi sabab ustun kengaytirilmadi). | EP-FIN-025, 061, 022 |
| `285e2e73` | **`approvePayment` jimgina no-op edi** — `UPDATE customer_payments` (yetim jadval, hech kim `INSERT` qilmaydi) qilib, rows-affected tekshirmasdan `Ok` qaytarardi; API HTTP 200 muvaffaqiyat deb hisobot berardi. Endi `finance_payments` ga `RETURNING *` bilan yozadi, 0 qatorda aniq `Err`. | EP-FIN-025 |
| `633bc74b` | **3 ta muzlab qolgan `gl_entries`/`gl_lines` o'quvchi `entries` ga yo'naltirildi** (reports-hub `glEntries.total` doim 0; accounting dashboard stat 0 yozuvchili `gl_lines` dan; finance-ai anomaliya-aniqlash jimgina bo'sh ko'rardi). **+ jiddiy bug**: `gl_account_mappings` dagi ADVANCE qatori seed qilinmagan `4200` hisobiga havola qilardi → har ADVANCE tasdig'ining GL-postingi `resolveAccountIds()` da jimgina yiqilardi; hisob idempotent seed qilindi. | EP-FIN-022, 031, 049, VR-FIN-I05 |
| `4241faa0` | **5 yangi GL hisobi** (2026-07-13 egasi intervyusi): `PRODUCTION_LOSS 9520` (brak/kamomad, avval 9500 ni bo'lishardi), `OTHER_INCOME_WASTE_PAPER 9820` (makulatura sotuvi, avval 9810 kurs-farqi bilan aralashardi) + yangi `WASTE_OUT` harakat-turi, `MARKETING_EXPENSE 9210` va `REFERRAL_BONUS_EXPENSE 9220` (9200 dan ajratildi; **referal bonusi ataylab ulanmagan** — mos to'lov yo'li yo'q, Q-40), `GOODS_IN_TRANSIT 1020` (yo'ldagi tovar `markArrived()` da real GL yozadi; **chet-valyutali jo'natmalar o'tkazib yuboriladi + sabab loglanadi**, chunki FX-kurs manbai yo'q — soxta konvertatsiya qilinmadi). **Jonli o'qildi 2026-08-07** — `gl-accounts.constants.ts` da beshalasi ham bor. | EP-FIN-024 (asosiy), 034, 041, 050, 053 |
| `b4dd38ce` | `reports.controller.ts` dagi o'lik `notImplemented` importi olib tashlandi (0 chaqiruvchi) — Qoida 17 tozalash. | EP-FIN-031 |
| `2cfeb8c2` | Repo-keng 15 ta o'lik `notImplemented` import + 2 eskirgan izoh tuzatildi. | EP-FIN-031 (kesishuvchi) |

### §III.4 — Registr sanoq-tekshiruvi

```bash
F=docs/vision/registry/03-finance.md
grep -c '^### EP-FIN-'              $F   # 86   ← I QISM
grep -c '^### VR-FIN-'              $F   # 10   ← II QISM
grep -c '^- \*\*Qaror holati:\*\*'     $F   # 96   = 86 + 10
grep -c '^- \*\*Qurilish holati:\*\*'  $F   # 96   = 86 + 10
grep -c '^- \*\*⚠️ ZIDDIYAT:\*\*'       $F   # 14   = 13 (I QISM) + 1 (II QISM)

# Qurilish taqsimoti (I+II birga): Ha 21 · Qisman 47 · Yo'q 21 · STALE-DOC 7 = 96
grep '^- \*\*Qurilish holati:\*\*' $F | awk '{print $4}' | sort | uniq -c
# I QISM alohida (II QISM: Ha 2 / Qisman 7 / Yo'q 1) → Ha 19 · Qisman 40 · Yo'q 20 · STALE-DOC 7 = 86

# Qaror taqsimoti: I QISM 56 ✅ + 30 🔵 = 86 · II QISM 9 ✅ + 1 🔵 = 10
grep -c '^- \*\*Qaror holati:\*\* ✅' $F   # 65 = 56 + 9
grep -c '^- \*\*Qaror holati:\*\* 🔵' $F   # 31 = 30 + 1
```

> **Yakuniy eslatma (Q-40):** bu registr **hech bir statusni to'qib chiqarmaydi**. Har "Dalil (kod)"
> qatori yo `FULL-ITEM-LEVEL` ning 2026-07-11 tekshiruvidan, yo `FULL-VISION-EXTRACTION` QISM A/C/D dan,
> yo 2026-08-07 da bu sessiyada bevosita jonli kod/git tekshiruvidan keladi (oxirgisi matnda ochiq
> "jonli tekshirildi 2026-08-07" deb belgilangan). Manbalar to'qnashganda ikkalasi ham
> `⚠️ ZIDDIYAT` ostida ochiq keltiriladi — yashirilmaydi.
