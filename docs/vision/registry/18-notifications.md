# Bildirishnoma / Telegram — Yagona Vizyon Registri (EP-NTF) — 2026-08-07

> **Manbalar:** `decisions/18-notifications.md` (82 qaror: v1 30 → EP-NTF-001..030 + v2 52 → EP-NTF-031..082) · `FULL-ITEM-LEVEL [Module-18]` (132 item) · `FULL-VISION-EXTRACTION` QISM A (`vision-1000-answers` 50 qarorli jadval) + QISM C (`TASDIQ-2146 §18`, 82 qator) + QISM D (V/VERIFY cross-ref, 44 qator) · `vision-1000-answers/18-notifications.md` (50) · `SHvB-40-Yonalish-Prompt.md` YO'NALISH 38 + Оргополитика/RD-2/RD-4/RD-5 + `EUROPRINT_BARCHA_JAVOBLAR.md` (Q50/Q59/Q101/Q102/Q113/Q140/Q152)
> **Holat sanasi:** qurilish-holati asosan 2026-07-11 `FULL-ITEM-LEVEL` tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida `apps/api/src/modules/notifications/` ga **14 commit** kirgan, ular tegib o'tgan bandlar `Δ` qatorida belgilangan.

> **⚠️ Xaritalash (1:1, bo'shliqsiz):** `EP-NTF-N` = `FULL-ITEM [Module-18] Item (N+50)` = `TASDIQ-2146 §18 #N` = `QISM C 18.N`.
> Ya'ni Item **51..132** = EP-NTF-**001..082** to'liq qoplaydi. `FULL-ITEM Item 1..50` = `vision-1000-answers #1..#50` = `QISM A #1..#50` = `QISM D #N` — bular EP-kodsiz **kesishuvchi arxitektura javoblari**; ular EP-NTF ga QISM A jadvalining "Izoh" ustunidagi kod orqali ulanadi (5 tasida EP-kod umuman yo'q → **II QISM**).

---

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-NTF-001..082)** | **82** |
| **Qaror holati:** ✅ javoblangan | 18 |
| **Qaror holati:** 🔵 ochiq (A-default) | 64 |
| **Qurilish:** Ha | 2 |
| **Qurilish:** Qisman | 20 |
| **Qurilish:** Yo'q | 56 |
| **Qurilish:** STALE-DOC | 4 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| II QISM (`VR-NTF-*`) | 5 |
| 2026-07-11 dan beri o'zgargan (Δ) | 18 |
| ⚠️ Manbalar orasida ziddiyat | 17 |

> **Eslatma (qamrov):** bu fayl **I QISM** — 82 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-NTF-"` → **82**, bo'shliqsiz 001..082). **II QISM** (VR-NTF-I01..I05) =
> EP-kodsiz vizyon-realizatsiya bo'shliqlari. **III QISM** = xaritalash, manba-ziddiyatlari,
> `decisions` Xulosa-jadvalining tekshiruvi va bugungi 2 ta ochiq tuzilmaviy bo'shliq.

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-NTF-007 (alert chegaralari)
> qaror bo'yicha ✅ **JAVOBLANGAN** (egasi har modul uchun o'zi belgilaydi), lekin qurilish
> bo'yicha **Yo'q** — jadval yaratilgan, o'quvchi kod yo'q. Teskarisi ham bor: EP-NTF-022
> (bot RBAC) qaror bo'yicha 🔵 **OCHIQ**, qurilish **Ha**.

> **Eslatma (qurilish holati "Yo'q" ustunligi):** 82 banddan **56 tasi (68%)** qurilmagan.
> Umumiy sabab — **3 ta yetishmayotgan poydevor**, ular 40+ bandni bloklaydi:
> (1) NTF modulida **BullMQ / delayed-job navbati yo'q** → barcha taymer/muddat/eskalatsiya/
> qayta-yuborish bandlari (EP-NTF-017/025/032/033/034/052/064/069/071/082) qurilmaydi;
> (2) **inline-keyboard / ACK qatlami yo'q** → EP-NTF-016/021/037/049/077/082;
> (3) **karta-yo'naltirish (`recipient_card_id`) yo'q** → EP-NTF-066 va u orqali butun
> "masъuliyat lavozimga bog'lanadi" vizyoni.

---

## I QISM — EP-kodli qarorlar (EP-NTF-001..082)

### EP-NTF-001 · ShVB Telegram bot komandalari (/zvs_status, /my_gsd ...)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) To'rttala komanda ham: `/zvs_status` (holatim) · `/my_gsd` (mening haftalik GSD) · `/company_state` (kompaniya holati) · `/weekly_digest` (haftalik xulosa) — to'liq ShVB to'plami. ShVB YO'NALISH 38 aynan shu 4 komandani belgilaydi.
- **Manba:** v1 Q1 · SHvB-40 YO'NALISH 38
- **Dalil (kod):** `bot.helpers.ts` da `buildZvsStatusReply()` (:154), `buildCompanyStateReply()` (:183) va `/weekly_digest` builder (~:247-267) — 4 tadan 3 tasi real SQL-asosli kod sifatida mavjud. Lekin har bir funksiya nomi bo'yicha `apps/api/src` bo'ylab grep **faqat o'z ta'rif satrini** qaytaradi — 9 ta jonli botning hech biri ularni chaqirmaydi (`fin.bot.ts` faqat `/cashflow`/`/debts`, `director.bot.ts` faqat `/kpi`/`/ai`/`/summary`). `/my_gsd` umuman topilmadi (grep → 0 fayl).
- **Nima yetishmaydi:** 3 komanda = **yetib bo'lmaydigan o'lik kod**, 1 komanda (`/my_gsd`) yo'q. Ya'ni bugun **hech bir ShVB komandasi jonli bot orqali javob bermaydi**.
- **Bog'liqlik:** EP-NTF-002 (`/my_gsd`), EP-NTF-011 (`/company_state` tarkibi), EP-NTF-019 (per-modul bot)
- **action:** WIRE
- **⤳ Ta'sir:** Director (`company_state`), Finance/ЗВС, HR/GSD — barcha ko'rsatkich manbai
- **Xoch-havolalar:** `[Module-18] Item 51` · `TASDIQ-2146 §18 #1` · `QISM C 18.1`
- **⚠️ ZIDDIYAT:** `QISM C 18.1` (2026-06-27) "Qisman — 3 tasi bor" vs `[Module-18] Item 51` (2026-07-11) "STALE-DOC — 3 tasi bor, lekin hech biri chaqirilmaydi". FULL-ITEM to'g'riroq: "mavjud" ≠ "ishlaydi".
- **Δ 2026-07-11→08-07:** —

### EP-NTF-002 · "Mening holatim" komandasi tarkibi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Karta nomi + bugungi vazifa + haftalik natija foizi + razryad — karta-markazli modelga to'liq bog'liq. Org KARTA-model bilan izchil (xabar lavozimga/kartaga bog'lanadi).
- **Manba:** v1 Q2
- **Dalil (kod):** `director.bot.ts` (to'liq o'qildi) da aynan 3 komanda bor (`/kpi`, `/ai`, `/summary`) — `/my_gsd` yoki shaxsiy-holat komandasi yo'q; `apps/api/src` bo'ylab `grep "my_gsd"` → **0 fayl**.
- **Nima yetishmaydi:** butun komanda qurilmagan. Karta nomi / bugungi vazifa / haftalik % / razryad manbalari alohida modullarda bor, lekin bitta shaxsiy-holat javobiga yig'ilmagan.
- **Bog'liqlik:** EP-NTF-001 (komanda to'plami), Org-karta (razryad/ЦКП)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (razryad/ЦКП), MES (bugungi vazifa), AI (haftalik natija)
- **Xoch-havolalar:** `[Module-18] Item 52` · `TASDIQ-2146 §18 #2` · `QISM C 18.2`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-003 · Haftalik digest qachon yuborilsin
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** C) **Egasi har modul uchun o'zi vaqt belgilaydi** — Q140 "vaqtlari belgilash mumkin bo'lsin" bevosita shu variantni majburlaydi. ShVB default sifatida Du 10:00 (GSD xulosasi) qabul qilinadi, lekin sozlanadi.
- **Manba:** v1 Q3 · ShVB Q140 (C) · SHvB-40 YO'NALISH 38 (Du 10:00)
- **Dalil (kod):** `fp-cycle-cron.service.ts` (to'liq o'qildi) da 4 ta real `@Cron()` job, har biri **hardcoded** `'0 9 * * N'` (Asia/Tashkent) — real haftalik tsikl bor, lekin jadval manbadan qattiq yozilgan, `notification_schedules` dan o'qilmaydi (u jadvalda faqat 1 ta aloqasiz kunlik "company_digest" qatori bor). QISM D #9: jadval + CRUD (`notification-schedules.controller.ts`) + iste'mol (`notification-schedule.cron.ts:38` `@Cron('0 * * * *')` `next_run_at` o'qiydi) **mavjud** — ya'ni infratuzilma bor, lekin FP-tsikl cronlari undan foydalanmaydi.
- **Nima yetishmaydi:** egasi-sozlanadigan vaqt zanjiri **uzilgan** — sozlash jadvali bor, uni o'qiydigan soatlik cron bor, lekin haftalik digest cronlari hamon hardcoded. "Real-time updateJob" o'rniga DB-poll.
- **Bog'liqlik:** EP-NTF-079 (kim-nima-oladi matritsasi), EP-NTF-045 (3-ritm)
- **action:** CONFIG
- **⤳ Ta'sir:** Cron (sozlanadigan), Director, barcha modul
- **Xoch-havolalar:** `[Module-18] Item 53` · `TASDIQ-2146 §18 #3` · `QISM C 18.3` · `EXTRACTION QISM A #9` · `QISM D #9`
- **⚠️ ZIDDIYAT:** `QISM C 18.3` (2026-06-27) "`fp-cycle.cron.ts` hardcoded; jadval count=0" vs `QISM D #9` (2026-07-07) "**Ha** — jadval+CRUD+cron wired". Ikkalasi turli obyekt haqida: QISM C **FP-tsikl cronini**, QISM D **`notification_schedules` infratuzilmasini** baholagan. FULL-ITEM Item 53 (Qisman) ikkovini birlashtiradi va to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-004 · Haftalik digest kimga boradi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Org-marshrut bo'yicha: har kim o'z darajasidagini oladi (operator o'zinikini, bo'lim boshlig'i bo'limini, ega — hammasini) — Vysotskiy 7-pog'ona modeliga mos.
- **Manba:** v1 Q4 · `org_structure_vysotskiy7`
- **Dalil (kod):** `fp-cycle-cron.service.ts` ning `notifyRoles()` (:33-49, to'liq o'qildi) **hardcoded rol-nom massivi** bo'yicha yo'naltiradi (mas. `['director','manager','department_head']`), Vysotskiy org-daraja / `manager_id` zanjiri bo'yicha emas. Real fan-out bor (`getEmployeeIdsByRoles` + `CommandBus`).
- **Nima yetishmaydi:** yo'naltirish **tekis rol-nom** asosida, org-daraja kesimida emas — "har kim o'z darajasidagini oladi" bajarilmaydi; `manager_id` zanjiri chaqirilmaydi (qv. EP-NTF-010).
- **Bog'liqlik:** EP-NTF-010 (vertikal marshrut), EP-NTF-065 (daraja-agregat)
- **action:** WIRE
- **⤳ Ta'sir:** Org-struktura (`manager_id` zanjiri), Director
- **Xoch-havolalar:** `[Module-18] Item 54` · `TASDIQ-2146 §18 #4` · `QISM C 18.4`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-005 · FP-tsikl (haftalik tsikl) eslatmalari
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) To'liq FP-tsikl: har bosqichda (rejalashtir → bajar → bahola → hisobot) alohida eslatma — ShVB ritmi to'liq. Hozir 4 cron mavjud (Se/Ch/Pa/Du `fp-cycle.cron.ts`) — vizyonga moslab kengaytiriladi.
- **Manba:** v1 Q5 · SHvB-40 (`fp-cycle.cron.ts`)
- **Dalil (kod):** `fp-cycle-cron.service.ts` (to'liq o'qildi) da hozir **TO'RTTA** `@Cron` job — `onCashDay`(Du) / `onZvsDay`(Se) / `onFpDay`(Ch) / `onBankDay`(Pa). `QISM C 18.5` ning "2 cron (ZVS+GSD)" da'vosi jonli kodga **mos kelmaydi** (eskirgan).
- **Nima yetishmaydi:** 4 cron bor, lekin ular **Cash/ЗВС/ФП/Bank kunlari** — vizyondagi "rejalashtir→bajar→bahola→hisobot" semantik bosqichlari **emas**. Ya'ni ritm bor, semantika boshqa.
- **Bog'liqlik:** EP-NTF-003 (vaqt sozlash), EP-NTF-045 (3-ritm)
- **action:** WIRE
- **⤳ Ta'sir:** Finance (ЗВС/ФП), cron, Director
- **Xoch-havolalar:** `[Module-18] Item 55` · `TASDIQ-2146 §18 #5` · `QISM C 18.5`
- **⚠️ ZIDDIYAT:** `QISM C 18.5` "2 cron" (2026-06-27) vs jonli kod "4 cron" (2026-07-11) — QISM C eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-006 · Holat-alert (signal) qachon yuborilsin
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A) Belgilangan chegaradan o'tganda darrov (masalan natija 70% dan past) — tezkor nazorat. ShVB "operativlik" prinsipiga mos.
- **Manba:** v1 Q6
- **Dalil (kod):** `alerts.service.ts` (to'liq o'qildi) — sof CRUD, chegara-trigger / debounce mantiqi **nol**. `QISM A #38` (debounce 5daq/3+ birlashtirish) uchun `QISM D #38`: `grep "debounce"` NTF-da → **0**. **Δ:** `a3c74437` + `1f759fd8` bilan o'lik `AlertsService` stack **butunlay olib tashlangan**; `ba46a088` (2026-08-03) `alert_thresholds` jadvalini default qatorlar bilan yaratdi.
- **Nima yetishmaydi:** ⭐ **`alert_thresholds` ni hech qanday kod o'qimaydi** — 2026-08-07 live tekshiruv: `grep -rli "alert_thresholds|alertThresholds"` butun `apps/api/src` + `artifacts/erp-dashboard/src` + `lib` bo'yicha faqat **4 fayl** qaytardi va **hammasi DDL/sxema**: `common/database/ddl-migrations.ts`, `shared/db/migrations/alert-thresholds-2026-08-03.sql`, `shared/db/migrations/business-settings-s1-keys-2026-07-11.sql`, `shared/db/schema-business-a-1.ts`. **Bironta service / controller / cron / FE yo'q.** Chegara-trigger, debounce va BullMQ hamon qurilmagan.
- **Bog'liqlik:** EP-NTF-007 (chegara-config), EP-NTF-062 (ustuvorlik)
- **action:** CREATE
- **⤳ Ta'sir:** AI (ko'rsatkich kuzatuvi), barcha modul KPI
- **Xoch-havolalar:** `[Module-18] Item 56` · `TASDIQ-2146 §18 #6` · `QISM C 18.6` · `EXTRACTION QISM A #38` · `QISM D #38`
- **Δ 2026-07-11→08-07:** `ba46a088` — `alert_thresholds` jadvali default qatorlar bilan yaratildi (struktura tayyor), lekin **o'quvchi kod yo'q** → qurilish holati hamon **Yo'q**. `a3c74437`/`1f759fd8` — o'lik `AlertsService` stack olib tashlandi (regressiya emas: u allaqachon hech narsa qilmasdi).

### EP-NTF-007 · Alert chegaralarini kim belgilaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A) **Egasi/rahbar har karta yoki modul uchun chegarani o'zi qo'yadi** — Q140 "vaqtlari belgilash mumkin" + per-modul prinsipi bilan izchil. Universal raqam YO'Q.
- **Manba:** v1 Q7 · ShVB Q140 (egasi sozlaydi)
- **Dalil (kod):** 2026-07-11: `SELECT to_regclass('public.kanban_column_sla')` → **null** (jadval umuman yo'q edi, bo'sh emas). FULL-ITEM tavsiyasi: generik `alert_thresholds(module_code, metric, threshold, config)` + admin UI. **Δ 2026-08-07:** `ba46a088` **ikkala jadvalni ham yaratdi** — `alert-thresholds-2026-08-03.sql` va `kanban-column-sla-2026-08-03.sql`, default qatorlar bilan; Drizzle sxemalari `schema-business-a-1.ts` va `schema-kanban.ts` da.
- **Nima yetishmaydi:** ⭐ **Ikkala jadval ham "yozib qo'yilgan, o'qilmaydigan"** — `kanban_column_sla` uchun live grep faqat 4 fayl: `shared/db/index.ts` (barrel eksport), `shared/db/migrations/business-settings-s1-keys-2026-07-11.sql`, `shared/db/migrations/kanban-column-sla-2026-08-03.sql`, `shared/db/schema-kanban.ts`. **Admin CRUD UI yo'q**, egasi chegarani ERP ichidan sozlay olmaydi → "ERP tashqarisida ish YO'Q" qoidasi hamon buzilgan (faqat migratsiya orqali o'zgaradi).
- **Bog'liqlik:** EP-NTF-006 (trigger), EP-NTF-074 (Kanban SLA), EP-NTF-079 (matritsa)
- **action:** CREATE
- **⤳ Ta'sir:** Har modul (o'z me'yori), Director, Kanban
- **Xoch-havolalar:** `[Module-18] Item 57` · `TASDIQ-2146 §18 #7` · `QISM C 18.7`
- **Δ 2026-07-11→08-07:** `ba46a088` — `alert_thresholds` + `kanban_column_sla` jadvallari default qatorlar bilan qurildi (2026-07-11 dagi "`to_regclass` → null" endi noto'g'ri). Lekin **o'quvchi/CRUD yo'q** → qurilish holati **Yo'q** bo'lib qoladi; STALE-DOC emas, chunki funksional talab (egasi sozlaydi) hamon bajarilmaydi.

### EP-NTF-008 · Kanal sozlamasi: shaxsiy chat yoki guruh
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Aralash: shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga — to'g'ri taqsimot. Maxfiy natija shaxsiy, jamoaviy xulosa guruh.
- **Manba:** v1 Q8
- **Dalil (kod):** `information_schema.columns` tekshiruvi: `employees.telegram_chat_id` **va** `org_departments.telegram_group_id` ikkalasi ham real jadvallarda mavjud. Lekin `create-notification.handler.ts` (to'liq o'qildi) doim bitta `command.userId` ga `telegramService.sendMessage(...)` yuboradi — shaxsiy vs bo'lim adresati orasida **hech qanday tarmoqlanish yo'q**.
- **Nima yetishmaydi:** ikki maqsad-ustun bor, ularni tanlaydigan marshrut mantiqi bildirishnoma-yaratish yo'lida yo'q.
- **Bog'liqlik:** EP-NTF-009 (guruh↔org bog'lash), EP-NTF-030 (top guruhda / past shaxsiy), EP-NTF-066 (kartaga yo'naltirish)
- **action:** WIRE
- **⤳ Ta'sir:** Org-struktura (guruh↔org-shox), maxfiylik
- **Xoch-havolalar:** `[Module-18] Item 58` · `TASDIQ-2146 §18 #8` · `QISM C 18.8`
- **Δ 2026-07-11→08-07:** `6024b085` — 6 listener endi `CommandBus` → `CreateNotificationHandler` orqali o'tadi, ya'ni bu marshrut qurilganda **hammasi darhol foyda oladi** (yagona nuqta). Marshrutning o'zi hamon yo'q.

### EP-NTF-009 · Telegram guruhlarini org-strukturaga bog'lash
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) Har org-tugun (bo'lim/sektsiya) uchun o'z guruhi, avtomatik aniqlanadi — to'liq marshrut. (Mavjud kod: `getTelegramGroup` org-queries — bog'lash nuqtasi tayyor.)
- **Manba:** v1 Q9 · `employees_users_link_fix` (`getTelegramGroup`)
- **Dalil (kod):** Manbaning o'z iqtibosi `org_nodes`, lekin **`org_nodes` endi mavjud emas** (`to_regclass` → null, Item 25 bilan bir xil topilma). Haqiqiy vorisi `org_departments` da jonli `telegram_group_id` ustuni bor (tasdiqlangan). QISM D #25: `telegram_chat_id` **bor, lekin `employees` da** (`telegram-auth.guard.ts:86`), `org_nodes` da emas; guruh 403 → shaxsiy fallback + admin signali handleri yo'q.
- **Nima yetishmaydi:** asosiy fakt (bo'lim→Telegram-guruh ulash ustuni bor) to'g'ri, lekin **jadval nomi eskirgan**; avto-bog'lash (qo'lda to'ldirishga qarshi) tekshirilmagan; 403 fallback yo'q.
- **Bog'liqlik:** EP-NTF-008 (kanal tanlash), EP-NTF-010 (vertikal marshrut)
- **action:** WIRE
- **⤳ Ta'sir:** Org-struktura, Coordination (CC)
- **Xoch-havolalar:** `[Module-18] Item 59` · `TASDIQ-2146 §18 #9` · `QISM C 18.9` · `EXTRACTION QISM A #25` · `QISM D #25`
- **⚠️ ZIDDIYAT:** `QISM C 18.9` "`org_nodes.telegram_group_id` **jonli**" vs `[Module-18] Item 59` "`org_nodes` mavjud emas". Item 59 to'g'ri — kanonik jadval `org_departments` (qv. MEMORY: "Canonical = org_departments").
- **Δ 2026-07-11→08-07:** —

### EP-NTF-010 · Kim-nima-oladi: org-marshrut bo'yicha yo'naltirish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Vertikal: keyingi yuqori daraja (`manager_id` zanjiri) avtomatik oladi — Vysotskiy modeli. (⚠️ `employees.manager_id` 0/30 NULL — backfill kerak.)
- **Manba:** v1 Q10 · `org_structure_vysotskiy7` · `employees_users_link_fix`
- **Dalil (kod):** `cc-org-resolver.service.ts:127-164` — real `manager_id`-zanjir resolveri (`MANAGER_OF_SENDER` → `employees.manager_id` → `users.id`, `manager_id` NULL/0 bo'lsa org-daraxt fallback, depth<20 sikl-qo'riqchi, :164 da "bo'lim rahbari yo'q — escalation step skip" logi). Lekin `apps/api/src/modules/notifications` doirasida `grep "manager_id"` → **0 fayl** — resolver NTF modulidan **umuman chaqirilmaydi**.
- **Nima yetishmaydi:** algoritm real (CC modulida), lekin `notifications` ga **ulanmagan** — bugun NTF xabarlari vertikal yo'naltirilmaydi. Bundan tashqari `employees.manager_id` backfill qilinmagan (30 dan 0 tasi to'ldirilgan).
- **Bog'liqlik:** EP-NTF-004 (digest marshruti), EP-NTF-017 (eskalatsiya), EP-NTF-065 (agregat) — hammasi ayni shu resolverga tayanadi
- **action:** WIRE
- **⤳ Ta'sir:** Org-struktura (`manager_id` backfill), Coordination
- **Xoch-havolalar:** `[Module-18] Item 60` · `TASDIQ-2146 §18 #10` · `QISM C 18.10` · `EXTRACTION QISM A #3` · `EXTRACTION QISM A #12` · `QISM D #3`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-011 · "Kompaniya holati" komandasi tarkibi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) 7 otdeleniye bo'yicha asosiy ko'rsatkich (ishlab chiqarish, sotuv, sifat, pul) — ShVB panorama. ShVB `/company_state` komandasi (EP-NTF-001) shuni qaytaradi.
- **Manba:** v1 Q11 · SHvB-40 YO'NALISH 38 (`/company_state`)
- **Dalil (kod):** `buildCompanyStateReply()` (`bot.helpers.ts:183` dan boshlab, to'liq o'qildi) `cashier_shifts` / `cashier_movements` / `finance_invoices` ni so'raydi — real, lekin **faqat moliya/kassa domeni** (ochiq smena qoldiqlari, 30-kunlik oqim, muddati o'tgan xarid-hisoblari), 7-otdeleniye panoramasi emas. QISM D #6: `/company_state` mavjud (`remaining/company-state.*`, `director/owner-summary`), ulanmagan foydalanuvchiga javob `bot-gateway.controller.ts:96-103` ("HR ga murojaat qiling").
- **Nima yetishmaydi:** 7 otdeleniyedan **1 tasi** qoplanadi; bundan tashqari Item 51 bo'yicha bu funksiya hech bir jonli bot komandasiga ulanmagan (o'lik kod). Ulanmaganga **deep-link emas**, oddiy matn javobi.
- **Bog'liqlik:** EP-NTF-001 (avval jonli komandaga ulanishi shart), EP-NTF-023 (deep-link)
- **action:** WIRE
- **⤳ Ta'sir:** Director, 7 otdeleniye (PP/SD/QC/Finance)
- **Xoch-havolalar:** `[Module-18] Item 61` · `TASDIQ-2146 §18 #11` · `QISM C 18.11` · `EXTRACTION QISM A #6` · `QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-012 · Leaderboard (reyting) digestda
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Bo'lim va shaxs bo'yicha top-3 va past-3 ko'rsatilsin — to'liq reyting. ShVB usulida raqobat/motivatsiya muhim (hozir YO'Q).
- **Manba:** v1 Q12
- **Dalil (kod):** `grep -i "leaderboard|top-3|past-3|top3|past3"` butun `apps/api/src` bo'yicha → **0 fayl**; mustaqil gamifikatsiya-reyting kodi ham topilmadi. QISM D #30: NTF-da past-3/top-3 yo'naltirish yo'q (gamifikatsiya domeni, NTF tomoni yo'q).
- **Nima yetishmaydi:** reyting so'rovi ham, uni `owner-summary.service.ts` / `fp-cycle-cron.service.ts` ga ulash ham yo'q. E1 qoidasi (avto guruh-sheyming TAQIQ) bo'yicha past-3 shaxsiy / top-3 guruh ajratmasi ham qurilmagan.
- **Bog'liqlik:** EP-NTF-030 (maqtov/tanbeh — bir xil ajratma), EP-NTF-008 (kanal tanlash); egasi reyting-KPI sini belgilashi kerak
- **action:** CREATE
- **⤳ Ta'sir:** HR/KPI, gamifikatsiya, AI
- **Xoch-havolalar:** `[Module-18] Item 62` · `TASDIQ-2146 §18 #12` · `QISM C 18.12` · `EXTRACTION QISM A #30` · `QISM D #30`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-013 · Karta-AI bahosi bildirishnomada
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har hafta AI xulosasi (mos / qisman / mos emas + sabab) digestga qo'shilsin — karta-modelga to'liq. Markaziy AI (EP-AI-001) hisoboti NTF orqali yetkaziladi.
- **Manba:** v1 Q13 · AI moduli (markaziy AI)
- **Dalil (kod):** `owner-summary.service.ts`, `fp-cycle-cron.service.ts`, `alerts.service.ts`, `create-notification.handler.ts` — hammasi shu tekshiruvda to'liq o'qildi, **hech birida** AI-fit / karta-baho mantiqi yo'q.
- **Nima yetishmaydi:** karta-AI baho manbai ham (boshqa joyda mavjudligi tasdiqlanmagan), uni digestga qo'shish ham yo'q. Egasi AI model/kalitini tasdiqlashi kerak (MEMORY dagi ochiq "AI-planning/key" bandi bilan bir xil).
- **Bog'liqlik:** AI moduli (karta-AI baho funksiyasi mavjud bo'lishi shart), EP-NTF-026 (ЦКП haftalik)
- **action:** CREATE
- **⤳ Ta'sir:** AI (markaziy), Org-karta, HR
- **Xoch-havolalar:** `[Module-18] Item 63` · `TASDIQ-2146 §18 #13` · `QISM C 18.13`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-014 · Razryad o'zgarishi haqida xabar
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Xodimga + uning rahbariga + HR'ga xabar (oylik o'zgarishi bilan) — to'liq. Razryad→talab→o'sish→oylik zanjirini hamma bilishi uchun.
- **Manba:** v1 Q14 · `org_card_centric_model`
- **Dalil (kod):** shu tekshiruvda o'qilgan/greplangan hech bir faylda razryad-o'zgarish eventi yoki listeneri topilmadi; `orphan-events.listener.ts` ning o'z fayl-sarlavhasidagi qamrab olingan eventlar ro'yxatida (to'liq o'qildi) razryad eventi **yo'q**.
- **Nima yetishmaydi:** `RazryadChangedEvent` emitteri (razryad yangilanadigan joyda) + 3 adresatli (xodim + rahbar + HR) `@OnEvent` fan-out handleri — ikkalasi ham qurilmagan.
- **Bog'liqlik:** HR/Payroll (oylik o'zgarishi), EP-NTF-010 (rahbarni topish uchun `manager_id`)
- **action:** EVENT
- **⤳ Ta'sir:** HR, Payroll (oylik), Org-karta
- **Xoch-havolalar:** `[Module-18] Item 64` · `TASDIQ-2146 §18 #14` · `QISM C 18.14`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-015 · Bildirishnoma tili
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Har xodim profilidagi tanlangan tilda (lotin / kirill / rus) — shaxsiy. Tizim 3 tilni qo'llab-quvvatlaydi (i18n: uz / uz-cyr / ru); egasi 3-til vizyoni (ShVB Q21) bilan izchil.
- **Manba:** v1 Q15 · i18n 3-til config · ShVB Q21
- **Dalil (kod):** `notifications.title_uz` / `message_uz` / `title_ru` / `message_ru` ustunlari mavjud; `notification_schedules.title_uz/ru`, `body_uz/ru` ham (QISM D #28). Lekin `create-notification.handler.ts` da **per-user til tanlash yo'q** va lotin↔kirill ajratmasi yo'q (faqat `_uz`/`_ru` suffikslari).
- **Nima yetishmaydi:** profil-tili bo'yicha tanlash kodi yo'q; **uz-cyr umuman yo'q** (3 til emas, 2 til); shablon `snapshot-at-enqueue` mexanizmi yo'q; placeholder Zod-validatsiyasi yo'q. i18n C10 (server-side lokalizatsiya) hamon IN-PROGRESS.
- **Bog'liqlik:** EP-NTF-028 (shablon tahriri — bir xil i18n zanjiri), i18n moduli
- **action:** WIRE
- **⤳ Ta'sir:** i18n, HR (profil tili)
- **Xoch-havolalar:** `[Module-18] Item 65` · `TASDIQ-2146 §18 #15` · `QISM C 18.15` · `EXTRACTION QISM A #28` · `QISM D #28`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-016 · O'qilganini tasdiqlash (muhim xabarlar uchun)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Faqat muhim/shoshilinch xabarlarda tasdiq tugmasi bo'lsin — maqsadli. "Bilmadim, ko'rmadim" bahonasini yo'qotadi.
- **Manba:** v1 Q16
- **Dalil (kod):** `notifications.read_at` real web-tomon ustuni, lekin `apps/api/src/modules/bot-gateway` doirasida `grep "inline_keyboard"` → **0 fayl**, `apps/api/src/modules/notifications` doirasida `grep "ack_at"` → **0 fayl** (moduldagi yagona uchrashuv `notification-preferences.repository.ts` — u kanal-sozlamalari haqida, ACK haqida emas). QISM D #5/#35: faqat web `PATCH /:id/read` (`notifications.controller.ts:130`) + `mark-all-read`; retry×2 → eskalatsiya yo'q; 3+ xabar uchun ketma-ket ko'rsatish yo'q.
- **Nima yetishmaydi:** Telegram inline "✅" tugmasi, `ack_at` ustuni, muhim-xabar bayrog'iga ulash — hech biri yo'q. "Ko'rilmadi" ta'rifi (ACK bosilmadi) amalda o'lchanmaydi.
- **Bog'liqlik:** EP-NTF-017 (eskalatsiya ACK ga tayanadi), EP-NTF-021 (inline-keyboard infratuzilmasi), EP-NTF-082 (qayta-yuborish), EP-NTF-038 (yuridik kuchli ACK jurnali)
- **action:** CREATE
- **⤳ Ta'sir:** Bildirishnoma jurnali (EP-NTF-027), eskalatsiya
- **Xoch-havolalar:** `[Module-18] Item 66` · `TASDIQ-2146 §18 #16` · `QISM C 18.16` · `EXTRACTION QISM A #5` · `EXTRACTION QISM A #35` · `QISM D #5` · `QISM D #35`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-017 · Javob bermasa eskalatsiya
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Vaqt o'tsa avtomatik keyingi yuqori darajaga chiqsin (`manager_id` zanjiri) — Vysotskiy eskalatsiya. Muammo qotib qolmasin.
- **Manba:** v1 Q17 · `org_structure_vysotskiy7`
- **Dalil (kod):** `communication-center/cron/cc-sla.cron.ts` (to'liq o'qildi) — real `@Cron(EVERY_30_MINUTES)` job, `escalateApprovals()` (:161-183) `deadline_at < NOW()` bo'lganda `UPDATE cc_approvals SET state='escalated'`, shuningdek `markInboxOverdue()` / `autoRejectOverdue48h()`. Real va ishlaydi, **lekin faqat `cc_documents`/`cc_approvals` doirasida**. `apps/api/src/modules/notifications` da `grep "BullMQ|Bull\b|bullmq"` → **0 fayl**.
- **Nima yetishmaydi:** ixtiyoriy bildirishnoma turi uchun `manager_id` zanjirini bosib o'tadigan **umumiy NTF eskalatsiya-taymeri yo'q**; NTF modulida BullMQ navbati yo'q; `manager_id` backfill qilinmagan.
- **Bog'liqlik:** EP-NTF-010 (resolver), EP-NTF-016 (ACK signali), `employees.manager_id` backfill
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (`manager_id`), Coordination
- **Xoch-havolalar:** `[Module-18] Item 67` · `TASDIQ-2146 §18 #17` · `QISM C 18.17` · `EXTRACTION QISM A #3` · `EXTRACTION QISM A #5` · `EXTRACTION QISM A #12` · `QISM D #5`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-018 · Bildirishnoma chastotasi (tinchlik vaqti)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ish vaqtida normal, tunda faqat shoshilinch signal — muvozanat. (Q140 "vaqtlari belgilash mumkin" — tinchlik oynasini egasi sozlaydi; EP-NTF-063 KRITIK istisno bilan birga ishlaydi.)
- **Manba:** v1 Q18 · ShVB Q140
- **Dalil (kod):** `apps/api/src/modules/notifications` da `grep "quiet_hours|quietHours"` → **0 fayl**. `shared/db/schema-business-a-1.ts:70-86` — `notification_preferences.quiet_hours` (jsonb) ustuni **ta'riflangan va migratsiya bilan qo'shilgan** (`migrations-drift.ts:1065` `ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS quiet_hours JSONB`), lekin repo bo'ylab grep faqat sxema/migratsiya ta'riflarini topdi — **nol o'quvchi joy**.
- **Nima yetishmaydi:** dispetcher darajasida "non-CRITICAL xabarni yuborishdan oldin `quiet_hours` ni tekshir va oyna tugaguncha kechiktir" mantiqi yo'q. Default oyna qiymati (mas. 22:00-07:00) `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi lozim (chatda raqam so'ralmaydi).
- **Bog'liqlik:** EP-NTF-063 (KRITIK istisno — ayni bir mexanizm), EP-NTF-062 (ustuvorlik)
- **action:** CREATE
- **⤳ Ta'sir:** Cron, tungi smena protokoli (EP-NTF-035)
- **Xoch-havolalar:** `[Module-18] Item 68` · `TASDIQ-2146 §18 #18` · `QISM C 18.18` · `EXTRACTION QISM A #4` · `QISM D #4`
- **⚠️ ZIDDIYAT:** `QISM C 18.18` (2026-06-27) "quiet-hours logikasi **/jadval** yo'q" vs `[Module-18] Item 68` (2026-07-11) "ustun **bor**, o'quvchi yo'q". Item 68 aniqroq: saqlash joyi mavjud, faqat iste'molchi yo'q.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-019 · Modullararo signallarni bitta bot ostida birlashtirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** B-ga yaqin **egasi-qarori:** har modul o'z botida, lekin **hammasi bitta ERP'ga ulangan** — Q101 "ERP ichidagi har bir modul uchun" + Q50 "alohida bo'lishi kerak ERP'ga ulangan". Ya'ni per-modul bot (Ombor boti, Moliya boti, HR boti…), umumiy ERP-yadro orqali. v1 A (bitta umumiy bot) egasi vizyoni bilan ALMASHTIRILDI.
- **Manba:** v1 Q19 · ShVB Q50/Q101/Q102 (per-modul, ERP'ga ulangan)
- **Dalil (kod):** `bot-gateway.controller.ts:23` — `BOT_NAMES = ['crm','mes','hr','logistics','fin','qc','director','ombor','pos']` (**9 bot**), bitta `@Controller('bot')` + `@Post(':bot/webhook')` marshruti, `@UseGuards(TelegramAuthGuard)`, har bot xizmati konstruktorda inyeksiya qilingan (:55-60+). `telegram-auth.guard.ts:50-68` webhook maxfiy tokenini constant-time solishtiradi (`TELEGRAM_SECRET_TOKEN_<BOT>` / fallback).
- **Nima yetishmaydi:** funksional talab bajarilgan. Qoldiq nomuvofiqlik: env nomi `TELEGRAM_SECRET_TOKEN` (vizyondagi `TELEGRAM_WEBHOOK_SECRET` emas); marshrutlash kaliti URL path-param `:bot`, `module_code` payload maydoni emas; `QISM A #8` talab qilgan 30s `digest_window` debounce batching yo'q (`QISM D #8`: grep → 0).
- **Bog'liqlik:** EP-NTF-001 (komandalar shu botlarga ulanishi kerak), EP-NTF-022 (RBAC)
- **action:** —
- **⤳ Ta'sir:** HAMMA 20 modul (har biri o'z boti), ERP-yadro
- **Xoch-havolalar:** `[Module-18] Item 69` · `TASDIQ-2146 §18 #19` · `QISM C 18.19` · `EXTRACTION QISM A #1` · `EXTRACTION QISM A #8` · `QISM D #1` · `QISM D #8`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-020 · Digestga PDF/rasm hisobot biriktirish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Matn + bosib ko'riladigan PDF/grafik birga — to'liq. (Egasi PDF-invoys hisobotni boshqa modullarda ham talab qiladi — ShVB Q116/Q119; mos.)
- **Manba:** v1 Q20 · ShVB Q113 (Telegram qisqa + ERP to'liq)
- **Dalil (kod):** `apps/api/src/modules/notifications` da `grep "sendDocument|sendPhoto|PDF"` → faqat `i-email-sender.port.ts` mos keldi (email-ilova interfeysi, Telegram bilan aloqasiz). `infrastructure/external/telegram-bot.adapter.ts` — faqat `sendMessage()` (matn, `/sendMessage` HTTP API); `sendDocument`/`sendPhoto` metodi **yo'q**.
- **Nima yetishmaydi:** `TelegramBotAdapter.sendDocument()`, digest oldidan PDF-generatsiya bosqichi, PDF ishlamasa matnga graceful degrade, 50MB+ → havola qoidasi (`QISM D #29`: grep → 0) — hech biri yo'q.
- **Bog'liqlik:** Reports PDF generatsiyasi barqarorligi ("Reports 503" muammosi)
- **action:** CREATE
- **⤳ Ta'sir:** Reports (PDF gen), Director
- **Xoch-havolalar:** `[Module-18] Item 70` · `TASDIQ-2146 §18 #20` · `QISM C 18.20` · `EXTRACTION QISM A #29` · `QISM D #29`
- **Δ 2026-07-11→08-07:** `0fa6e97e` — `telegram-bot.adapter.ts` endi yuborish natijasini (`Result.ok`) tekshiradi va `status` = `sent`/`failed` yozadi (avval `.then().catch()` sabab o'lik SMTP "muvaffaqiyat" deb hisoblanardi). PDF/rasm biriktirish qo'shilmadi.

### EP-NTF-021 · Telegram orqali javob/buyruq berish
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Asosiy amallar (tasdiqla / rad et / topshiriq ber) tugma bilan bo'lsin — interaktiv. Rahbar yo'lda ham boshqarsin.
- **Manba:** v1 Q21
- **Dalil (kod):** `bot-gateway.controller.ts:38-43,81-89` — `callback_query` Zod sxemasi bilan parse qilinadi, `data`/`chat.id` dan `text`/`chatId` ajratib olinadi va tegishli botning `handle()` metodiga uzatiladi. Ya'ni callback ma'lumoti **qabul qilinadi va marshrutlanadi**. Bu xom o'tkazishdan tashqari maxsus inline-keyboard tasdiq/rad "tugma-flow" holat-mashinasi (ko'p bosqichli dialog) topilmadi.
- **Nima yetishmaydi:** strukturalangan tasdiq/rad tugma-oqimi (bosqichlar bo'ylab holat kuzatuvi) qurilmagan; NTF modulining o'zida inline keyboard yo'q (`QISM D #17`), tun/kun kanal-ustuvorligi mantiqi yo'q.
- **Bog'liqlik:** EP-NTF-016 (ACK tugmasi — bir xil infratuzilma), EP-NTF-022 (RBAC), EP-NTF-049 (`answerCallbackQuery`)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination, Kanban (tasdiq), xavfsizlik (RBAC EP-NTF-022)
- **Xoch-havolalar:** `[Module-18] Item 71` · `TASDIQ-2146 §18 #21` · `QISM C 18.21` · `EXTRACTION QISM A #17` · `QISM D #17`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-022 · Bot komandalariga ruxsat (kim nimani so'ray oladi)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A) Org-daraja bo'yicha: har kim faqat o'z huquqidagisini so'ray oladi — xavfsiz. Oddiy operator butun zavod moliyasini ko'rmasligi kerak (RBAC kartadan).
- **Manba:** v1 Q22 · `org_card_centric_model` (RBAC)
- **Dalil (kod):** `bot-gateway/bots/director.bot.ts:9,21` — komandani ishlashdan oldin `hasBotPermission('director', msg.role)` qo'riqchisi chaqiriladi; `bot-gateway.controller.ts:19,50` da kontroller darajasida `@UseGuards(TelegramAuthGuard)`.
- **Nima yetishmaydi:** funksional talab bajarilgan. Qoldiq: ruxsat **rol-nom** bo'yicha, karta/org-daraja bo'yicha emas (EP-NTF-066 "masъuliyat lavozimga/kartaga" bilan to'liq izchil emas).
- **Bog'liqlik:** EP-NTF-019 (bot-gateway), EP-NTF-066 (karta-RBAC)
- **action:** —
- **⤳ Ta'sir:** Auth/RBAC, Org-karta, xavfsizlik
- **Xoch-havolalar:** `[Module-18] Item 72` · `TASDIQ-2146 §18 #22` · `QISM C 18.22`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-023 · Yangi xodim ulanishi (botni ro'yxatdan o'tkazish)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A) HR xodimni qo'shganda Telegram havola/kod avtomatik beriladi — uzluksiz. (ShVB Q61 nomzod Telegram bot bilan ishlaydi — onboarding bilan izchil.)
- **Manba:** v1 Q23 · ShVB Q61
- **Dalil (kod):** `information_schema.columns` → `users.telegram_id` (varchar) va `users.telegram_chat_id` ikkalasi mavjud. Lekin `pg_constraint` so'rovi → **bo'sh natija**: `telegram_id` da **UNIQUE cheklov YO'Q** (manba jadvalining "telegram_id UNIQUE + deep-link bor" da'vosiga zid). `grep -i "t\.me/|start=TOKEN|deepLink|onboard.*telegram"` butun `apps/api/src` bo'yicha → **0 fayl**. `SELECT count(*) FROM users WHERE telegram_id IS NOT NULL` → **0** (ustun butunlay to'ldirilmagan).
- **Nima yetishmaydi:** 24 soatlik deep-link/OTP oqimi (`t.me/bot?start=TOKEN`), `telegram_id` UNIQUE cheklovi, HR "qayta yuborish" tugmasi — hech biri yo'q. Ustun bo'sh → **hech bir xodim Telegram orqali ulanmagan**, ya'ni butun Telegram yetkazish qatlami bugun adresatsiz.
- **Bog'liqlik:** HR (xodim qo'shish), EP-NTF-011 (ulanmaganga deep-link javobi), EP-NTF-019
- **action:** CREATE
- **⤳ Ta'sir:** HR (xodim qo'shish), Auth (`telegram_id`↔user)
- **Xoch-havolalar:** `[Module-18] Item 73` · `TASDIQ-2146 §18 #23` · `QISM C 18.23` · `EXTRACTION QISM A #6` · `EXTRACTION QISM A #7` · `QISM D #6` · `QISM D #7`
- **⚠️ ZIDDIYAT:** `QISM C 18.23` (2026-06-27) "`telegram_id` UNIQUE + deep-link **bor**" vs `[Module-18] Item 73` (2026-07-11) "UNIQUE cheklov **yo'q**, deep-link kodi umuman yo'q, ustun 0 ta to'ldirilgan". Item 73 DB-dan tasdiqlangan — QISM C xato.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-024 · Oltin-ip (buyurtma) holati bo'yicha bildirishnoma
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Har bosqichda mas'ul bo'lim + sotuv menejeri + (kechiksa) rahbar xabar oladi — to'liq kuzatuv. (v2 Q21/EP-NTF-051 kartochka-status bilan birlashadi.)
- **Manba:** v1 Q24
- **Dalil (kod):** `notifications/infrastructure/event-handlers/order-created-notification.listener.ts` (to'liq o'qildi) — real `@EventsHandler(OrderCreatedEvent)`, `users WHERE role='warehouse_manager'` so'rovi va har menejer uchun `Notification` yaratadi. `apps/api/src/modules/notifications` doirasida `grep "OrderStatusChangedEvent|OrderShippedEvent|OrderCompletedEvent|@EventsHandler.*Order"` → faqat `OrderCreatedEvent` handleri mos keladi. `QISM D #21`: `OrderStatusChangedEvent` **mavjud** (`sd/domain/events/order-status-changed.event.ts`) va listenerlari bor (logistika, PP), lekin **NTF modulida status listeneri YO'Q**.
- **Nima yetishmaydi:** keyingi bosqich-statuslari (jo'natildi / tugadi / kechikdi) uchun mas'ul + savdo + rahbarga xabar qurilmagan. NTF hozir buyurtma hayotining faqat **1 nuqtasini** (yaratilish) eshitadi.
- **Bog'liqlik:** EP-NTF-051 (kartochka status→keyingi masъul), SD (`sales_orders.status`)
- **action:** EVENT
- **⤳ Ta'sir:** SD (oltin-ip), PP/MES, CRM/Dizayn
- **Xoch-havolalar:** `[Module-18] Item 74` · `TASDIQ-2146 §18 #24` · `QISM C 18.24` · `EXTRACTION QISM A #21` · `QISM D #21`
- **Δ 2026-07-11→08-07:** ⭐ `6024b085` — `order-created` listeneri avval faqat `notificationRepo.save()` chaqirardi (DB qatori yoziladi, **kanal-sozlamalari qo'llanilmaydi, Telegram/email/SMS yubormaydi, `status` yozilmaydi**); endi `CommandBus` → `CreateNotificationCommand` → `CreateNotificationHandler` orqali o'tadi. Ya'ni "yangi buyurtma" xabari endi haqiqatan yetkaziladi (avval faqat ilova ochilganda ko'rinardi). Status-o'tishlari uchun listener qo'shilmadi.

### EP-NTF-025 · Kechikish/muddat signali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ikki bosqichli: muddatdan oldin eslatma + o'tib ketsa signal (rahbarga ham) — oldini olish. (v2 Q34/EP-NTF-064 ikki-bosqich qoidasi bilan bir xil.)
- **Manba:** v1 Q25
- **Dalil (kod):** `apps/api/src/modules/notifications` da `grep "BullMQ|bullmq"` → **0 fayl** — bu modulda kechiktirilgan-job navbati infratuzilmasi **umuman yo'q**. (`QISM D #47/#49`: BullMQ infra `queue/processors/telegram.processor.ts` da bor, lekin NTF modulidan tashqarida va muddat-taymerlariga ulanmagan.)
- **Nima yetishmaydi:** muddatgacha ogohlantirish + muddatdan keyin eskalatsiya beradigan delayed-job mexanizmi yo'q. Ikki chegara (necha vaqt oldin / keyin, har bildirishnoma turi uchun) `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi lozim.
- **Bog'liqlik:** EP-NTF-064 (aynan bir xil talab — dublikat), EP-NTF-017 (eskalatsiya), EP-NTF-082 (qayta-yuborish)
- **action:** CREATE
- **⤳ Ta'sir:** PP (muddat), Kanban, Org-struktura
- **Xoch-havolalar:** `[Module-18] Item 75` · `TASDIQ-2146 §18 #25` · `QISM C 18.25`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-026 · ЦКП (yakuniy mahsulot) bajarilishi haqida xabar
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har hafta ЦКП bajarilish foizi xodim va rahbariga yuborilsin — karta-modelga to'liq. Har karta o'z ЦКП'si bilan o'lchanadi.
- **Manba:** v1 Q26 · `org_card_centric_model` (ЦКП)
- **Dalil (kod):** `grep "ckp\.weekly|ckp_weekly|CkpWeekly"` butun `apps/api/src` bo'yicha → **hech qayerda topilmadi** — ulanmagan emas, **tushuncha kod sifatida umuman mavjud emas**.
- **Nima yetishmaydi:** haftalik cron (har xodim/karta bo'yicha ЦКП % o'qib xodim+rahbarga yuborish) yo'q. Bundan tashqari ЦКП foizi qaysi jadvalda saqlanishi ham aniqlanmagan — hisoblash/saqlash qatlamining o'zi avval qurilishi kerak.
- **Bog'liqlik:** Org-karta ЦКП hisoblash/saqlash (HR/KPI moduli — bu tekshiruvda mavjudligi tasdiqlanmagan), EP-NTF-013 (karta-AI bahosi bilan bir digestda)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ЦКП), AI, HR/KPI
- **Xoch-havolalar:** `[Module-18] Item 76` · `TASDIQ-2146 §18 #26` · `QISM C 18.26`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-027 · Bildirishnoma jurnali (kim qachon nimani oldi)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) To'liq jurnal: kimga / qachon / o'qildimi, ERP ichida ko'rinadi — to'liq nazorat. (v2 Q50/EP-NTF-080 "ma'lumot yo'qolmaydi arxivi" bilan mustahkamlanadi.)
- **Manba:** v1 Q27
- **Dalil (kod):** `SELECT to_regclass('notification_logs')` → jadval **mavjud**; `SELECT count(*) FROM notification_logs` → **0 qator**. `SELECT count(*) FROM notifications` → **7030 qator**; `information_schema.columns` `read_at` va `is_read`/`read` ustunlari borligini tasdiqlaydi. `QISM C 18.27` (2026-06-27) da 3735 qator edi.
- **Nima yetishmaydi:** `notifications` jadvalining o'zi real, to'ldirilgan per-xabar jurnali; ammo maxsus `notification_logs` audit-jadvali **butunlay bo'sh — unga hech kim yozmaydi**. "Kim/qachon" strukturali jurnali amalda ishlamaydi. FE da jurnalni ko'rsatadigan ekran ham faqat o'z xabarlarini ko'rsatadi (`/api/notifications/my`), butun-kompaniya jurnali yo'q.
- **Bog'liqlik:** EP-NTF-038 (yuboruvchi/qabul qiluvchi), EP-NTF-080 (o'chirilmaydigan arxiv), EP-NTF-016 (ACK)
- **action:** WIRE
- **⤳ Ta'sir:** Audit-log, Coordination, Совершенствование
- **Xoch-havolalar:** `[Module-18] Item 77` · `TASDIQ-2146 §18 #27` · `QISM C 18.27`
- **Δ 2026-07-11→08-07:** ⭐ `2f3cd392` — `POST /api/notifications` DTO `userId: z.string().uuid()` talab qilardi, holbuki `users.id` / `notifications.user_id` / `reference_id` hammasi **integer** (`information_schema` bilan tasdiqlangan). `main-bootstrap.ts:197` da global `ZodValidationPipe` borligi uchun bu **real darvoza** edi → endpoint **har qanday chaqiruvda 400** qaytarardi, ya'ni umuman ishlamasdi. Endi `IntegerIdSchema` (number yoki `^[1-9]\d*$` satr → String) ishlatiladi. ⚠️ **Lekin FE da bu endpointni chaqiradigan ekran hamon YO'Q** — live grep (2026-08-07) `artifacts/erp-dashboard/src` bo'yicha faqat `GET /api/notifications/my`, `GET /my/unread-count`, `PATCH /:id/read`, `POST /my/mark-all-read`, `GET|PATCH /preferences` chaqiruvlarini topdi (`DesignNotifications.tsx`, `NotificationCenter.tsx`, `NotificationSettings.tsx`). Ya'ni endpoint tuzatildi, iste'molchisi yo'q. Shuningdek `978ae170` `sender_id` ustunini, `c430ab1a` `module_code`/`channel`/`status`/`immutable` ustunlarini qo'shdi.

### EP-NTF-028 · Shablonlarni (xabar matnlari) kim tahrirlaydi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Egasi/admin ERP ichidan o'zi tahrirlaydi (kodga tegmasdan) — mustaqil. (`TelegramBotAdmin.tsx` kengaytiriladi — ShVB YO'NALISH 38.)
- **Manba:** v1 Q28 · SHvB-40 (`TelegramBotAdmin.tsx`)
- **Dalil (kod):** `notifications/infrastructure/notification-schema.service.ts` (to'liq o'qildi, 18 satr) — `onModuleInit()` faqat `this.repo.ensurePreferencesTables()` ni chaqiradi (yuklanishda idempotent jadval-mavjudlik tekshiruvi), shablon mazmuni uchun CRUD yo'q. `grep "notification-schema|ensurePreferencesTables"` → 3 fayl, hammasi infratuzilma (module/repo/service), **hech biri shablon matnini tahrirlash uchun controller/CRUD endpoint bermaydi**.
- **Nima yetishmaydi:** admin tahrirlaydigan shablon CRUD yo'q — i18n satrlar **statik JSON fayllar**, DB-asosli tahrirlanadigan shablonlar emas. Egasi ERP ichidan xabar matnini o'zgartira olmaydi ("ERP tashqarisida ish YO'Q" qoidasini buzadi). Snapshot-at-enqueue va placeholder Zod-validate ham yo'q (`QISM D #28`).
- **Bog'liqlik:** EP-NTF-015 (i18n 3-til), i18n C10
- **action:** CREATE
- **⤳ Ta'sir:** Admin UI, i18n (`notifications.json`)
- **Xoch-havolalar:** `[Module-18] Item 78` · `TASDIQ-2146 §18 #28` · `QISM C 18.28` · `EXTRACTION QISM A #28` · `QISM D #28`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-029 · Avariya/to'xtash signali (ishlab chiqarish to'xtasa)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Darrov: smena ustasi + texnik xizmat + bo'lim boshlig'i bir vaqtda xabar oladi — tezkor. Ishlab chiqarish to'xtashi = pul yo'qotish. (v2 Q18/EP-NTF-048 Roxler nosozligi bilan izchil.)
- **Manba:** v1 Q29 · IoT (anomaly)
- **Dalil (kod):** `notifications/infrastructure/event-handlers/mro-machine-stopped-notification.listener.ts` (to'liq o'qildi) — real `@EventsHandler(MroMaintenanceStopEvent)`, `this.routing.resolveUserIds('mro.machine_stopped', 'director')` ni chaqiradi, ya'ni marshrut **konfiguratsiyadan** keladi (`NotificationRoutingRepository`), koddan qattiq yozilgan emas (manba jadvalining o'z Izohi noto'g'ri). `SELECT event_type,target_role FROM notification_routing_rules WHERE event_type ILIKE '%mro%'` → **bitta qator**, `target_role='director'`.
- **Nima yetishmaydi:** marshrut mexanizmi endi ma'lumot-asosli, lekin **sozlangan ma'lumot faqat `director` ga yo'naltiradi** — vizyon talab qilgan 3 tomonlama (usta + texnik + boshliq) fan-out yo'q. Bu **kod o'zgarishi emas, `notification_routing_rules` ma'lumot o'zgarishi**.
- **Bog'liqlik:** EP-NTF-048 (Roxler — bir xil zanjir), EP-NTF-062 (ustuvorlik), IoT (`EquipmentFaultEvent`)
- **action:** CONFIG
- **⤳ Ta'sir:** MES, IoT (stanok), texnik xizmat
- **Xoch-havolalar:** `[Module-18] Item 79` · `TASDIQ-2146 §18 #29` · `QISM C 18.29` · `EXTRACTION QISM A #23` · `QISM D #23`
- **⚠️ ZIDDIYAT:** `QISM C 18.29` "listener:41-48 faqat direktorga (**hardcoded**)" vs `[Module-18] Item 79` "marshrut `notification_routing_rules` dan (**config-driven**), lekin sozlangan qator faqat `director`". Natija bir xil, sabab boshqa — Item 79 to'g'ri.
- **Δ 2026-07-11→08-07:** ⭐ `6024b085` — `mro-machine-stopped` listeneri avval faqat `notificationRepo.save()` chaqirardi (Telegram/email/SMS **yubormasdi**, `status` yozmasdi); endi `CommandBus` → `CreateNotificationHandler` orqali o'tadi. Ya'ni "Mashina to'xtadi" signali avval **faqat ilova ochilganda** ko'rinardi — endi haqiqatan yetkaziladi. 3-adresatli fan-out hamon yo'q (routing-rules ma'lumotini kengaytirish kerak).

### EP-NTF-030 · Maqtov/tanbeh (ijobiy va salbiy fidbek)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Ikkalasi: top natija — ochiq maqtov (guruhda), past natija — shaxsiy eslatma — muvozanatli. ShVB usulida tan olish kuchli motivatsiya.
- **Manba:** v1 Q30
- **Dalil (kod):** `apps/api/src/modules/notifications` doirasida `grep "gamification"` → **0 fayl**. `QISM D #30`: NTF tomonda past-3/top-3 yo'naltirish yo'q (gamifikatsiya alohida domen, NTF'ga ulanmagan).
- **Nima yetishmaydi:** gamifikatsiya maqtov/tanbeh eventlariga obuna bo'ladigan `@OnEvent` listeneri yo'q; top-3 → guruh chat, past-3 → shaxsiy chat marshruti yo'q (E1 "avto guruh-sheyming TAQIQ" qoidasi kod bilan majburlanmaydi).
- **Bog'liqlik:** EP-NTF-012 (leaderboard — bir xil ajratma), EP-NTF-008 (shaxsiy/guruh kanali); gamifikatsiya modulining event-nomlarini tasdiqlash kerak
- **action:** EVENT
- **⤳ Ta'sir:** HR, gamifikatsiya, AI (baho)
- **Xoch-havolalar:** `[Module-18] Item 80` · `TASDIQ-2146 §18 #30` · `QISM C 18.30` · `EXTRACTION QISM A #30` · `QISM D #30`
- **Δ 2026-07-11→08-07:** —

---

## I QISM (davomi) — v2 kitob-grounded qarorlar (EP-NTF-031..082)

### EP-NTF-031 · "Yozma" majburiy qarorlar avtomatik rasmiy yozuvga aylansinmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) 6 turdagi xabar (qaror / reja o'zgarishi / vazifa / texkarta o'zgarishi / sifat xulosasi / ogohlantirish) Telegramdan kelsa avtomatik rasmiy yozuvga aylanadi (raqam + sana + muallif). Оргополитика "Ёзма қайдсиз қарор қабул қилинган деб ҳисобланмайди" — hujjatning o'zi A'ni majburlaydi.
- **Manba:** v2 Q1 · Оргополитика "КОММУНИКАЦИЯ ТУРЛАРИНИ АНИҚ БЕЛГИЛАШ"
- **Dalil (kod):** `grep "ntf\.written\.formalize"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #18`: NTF-da xabar-turini tanlash UI/oqimi yo'q.
- **Nima yetishmaydi:** belgilangan Telegram xabarni raqamlangan/sanalangan/muallifli rasmiy ERP-yozuviga aylantiradigan handler yo'q. Egasi aynan qaysi "6 tur" rasmiylashtirilishini sanab berishi kerak.
- **Bog'liqlik:** EP-NTF-032 (og'zaki→yozma), EP-NTF-080 (immutable arxiv), Audit-log
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish, Sifat, Dizayn — barcha "yozma majburiy" qarorlar; Audit-log
- **Xoch-havolalar:** `[Module-18] Item 81` · `TASDIQ-2146 §18 #31` · `QISM C 18.31` · `EXTRACTION QISM A #18` · `QISM D #18`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-032 · Og'zaki topshiriq 24 soat ichida yozma qayd — bot kuzatsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Og'zaki topshiriq kiritilsa 24 soat ichida yozma qayd talab; bo'lmasa eslatma → keyin rahbarga signal — nazorat. Hujjat og'zaki topshiriq yo'qolishini taqiqlaydi.
- **Manba:** v2 Q2 · Оргополитика
- **Dalil (kod):** `grep "verbal_confirmed_at"` butun `apps/api/src` bo'yicha → **0 fayl** (vizyon bandida ko'rsatilgan ustun/maydon kodda umuman yo'q). `QISM D #14`: `grep "verbal"` NTF/telegram-bots → 0.
- **Nima yetishmaydi:** Kanban vazifa sxemasiga `source='verbal'` + `verbal_confirmed_at` qo'shish va 24 soatlik delayed-job (hamon NULL bo'lsa eskalatsiya) — ikkalasi ham yo'q.
- **Bog'liqlik:** BullMQ/delayed-job infratuzilmasi (EP-NTF-025 bilan **umumiy shart**), Kanban moduli
- **action:** CREATE
- **⤳ Ta'sir:** Coordination, eskalatsiya
- **Xoch-havolalar:** `[Module-18] Item 82` · `TASDIQ-2146 §18 #32` · `QISM C 18.32` · `EXTRACTION QISM A #14` · `QISM D #14`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-033 · Tex-kartada xato — 15 daqiqalik signal cron
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Xato belgilanishi bilan bosh texnologga darrov signal + 15 daqiqa taymer; javob bo'lmasa RD-4'ga eskalatsiya. RD-5 yo'riqnoma "смена технологи 15 дақиқа ичида бош технологга хабар беради" — aniq vaqt qoidasi hujjatda. Sub-savol (15 daqiqada javob bo'lmasa kimga): **C) ikkalasiga** (telefon-eslatma + RD-4) tavsiya.
- **Manba:** v2 Q3 · "Тех картада муаммо аниқланганда чора кўриш тартиби" (15 daqiqa)
- **Dalil (kod):** `grep -i "techcard.{0,20}15|TechCardError|tech_card_error"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #11`: `grep "TechCardErrorDetectedEvent"` → 0; ketma-ket taymer listeneri yo'q.
- **Nima yetishmaydi:** `TechCardErrorDetectedEvent` listeneri + 15 daqiqalik delayed-job (bosh texnologga eskalatsiya) yo'q. Eventning o'zi ham mavjudligi tasdiqlanmagan (PP/QC modulida tekshirish kerak).
- **Bog'liqlik:** EP-NTF-034 (davomi taymer), `TechCardErrorDetectedEvent` (PP/QC), BullMQ infra
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish + Sifat zanjiri (tex-karta → bosh texnolog → RD-5 → dizayn/konstruktor)
- **Xoch-havolalar:** `[Module-18] Item 83` · `TASDIQ-2146 §18 #33` · `QISM C 18.33` · `EXTRACTION QISM A #11` · `QISM D #11`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-034 · Tex-karta tuzatish — 1 soatlik muddat hisoblagichi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Topshiriq yuborilganda 1 soatlik countdown; 45-daqiqada eslatma, 60-daqiqada RD-5'ga "muddat o'tdi" signal. RD-5 "1 соат ичида тўғирлашни талаб қилади" — qattiq muddat hujjatda.
- **Manba:** v2 Q4 · RD-5 (1 soat qoidasi)
- **Dalil (kod):** Item 83 bilan bir xil grep (`TechCardError` oilasi) → mos kelmadi; `notifications` modulida `grep "BullMQ|bullmq"` → **0 fayl** (ketma-ket taymer infratuzilmasi yo'q).
- **Nima yetishmaydi:** ikki bosqichli ketma-ket delayed-job (45 daq eslatma → 60 daq eskalatsiya) yo'q. Vizyon aniq talab qiladi: taymerlar **parallel emas, ketma-ket** (`QISM A #11`).
- **Bog'liqlik:** EP-NTF-033 (avval u qurilishi shart — bu uning davomi taymeri)
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn/konstruktor/korrektor/rejalashtirish, RD-5
- **Xoch-havolalar:** `[Module-18] Item 84` · `TASDIQ-2146 §18 #34` · `QISM C 18.34` · `EXTRACTION QISM A #11` · `QISM D #11`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-035 · Tungi smena telefon-eskalatsiyasi (RD-4/bosh texnolog javob shart)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Tungi muammo signal qilinsa "telefon qilindi → javob berdi/bermadi" qayd; javob bo'lmasa ertalab rahbarga ko'rinadi. RD-5 "РД-4 ва бош технолог тунги вақтларда телефон қилинган тақдирда жавоб беришлари лозим" — hujjatda maxsus tungi protokol.
- **Manba:** v2 Q5 · RD-5 (tungi protokol)
- **Dalil (kod):** `grep "call\.log|call_log"` butun `apps/api/src` bo'yicha → **0 fayl**; qo'ng'iroq-protokoli jadvali umuman yo'q.
- **Nima yetishmaydi:** `call_log` jadvali (kim qildi / kimga / vaqt / javob) va uni to'ldiradigan bot komandasi ("qildim" / "javob berdim") yo'q. ⚠️ Yangi `CREATE TABLE` — Q-35 bo'yicha egasi tasdig'i talab qilinadi (schema-approval 2026-07-11 da BERILGAN).
- **Bog'liqlik:** EP-NTF-036 (tungi yakka qaror), EP-NTF-072 (telefon qaydi — **dublikat talab**), EP-NTF-018 (tun oynasi ta'rifi)
- **action:** CREATE
- **⤳ Ta'sir:** HR/masъuliyat (javob bermagan rahbar KPI/oylik), tungi smena
- **Xoch-havolalar:** `[Module-18] Item 85` · `TASDIQ-2146 §18 #35` · `QISM C 18.35`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-036 · Tungi smena texnologi "davom ettirish" qarori uchun maxsus belgi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) "Tungi yakka qaror" belgisi bilan qayd → ertalab bosh texnolog + RD-5'ga digestda ko'rinadi. RD-5 "смена технологи… давом эттиришга рухсат беради. Бу холатда сифатга тўлиқ жавобгар" — yakka qaror = to'liq shaxsiy masъuliyat.
- **Manba:** v2 Q6 · RD-5 (tungi yakka qaror)
- **Dalil (kod):** `grep "night\.soloDecision"` butun `apps/api/src` bo'yicha → **0 fayl** (shu jadvalning Izoh ustunidagi 20 ta identifikator bo'yicha birlashtirilgan grep — hammasi nol). `QISM D #45`: soft-cancel / immutable qaror-qaydi topilmadi.
- **Nima yetishmaydi:** ish vaqtidan tashqari qabul qilingan qaror uchun `night_solo_decision` bayrog'i/jadvali va uni o'qiydigan ertalabki digest cron yo'q. Bundan tashqari F5 talabi (qayd **o'zgartirilmaydi**, faqat soft-cancel yozuvi) ham qurilmagan.
- **Bog'liqlik:** EP-NTF-018 (tun oynasi ta'rifi), EP-NTF-045 (tungi qaror immutable — bir xil talab), EP-NTF-080 (immutable arxiv)
- **action:** CREATE
- **⤳ Ta'sir:** Sifat (masъuliyat), Director (ertalab digest)
- **Xoch-havolalar:** `[Module-18] Item 86` · `TASDIQ-2146 §18 #36` · `QISM C 18.36` · `EXTRACTION QISM A #45` · `QISM D #45`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-037 · Bevosita rahbarni chetlab o'tish (фавқулодда) signali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Chetlab o'tilsa favqulodda sabab so'raladi + bevosita rahbarga "sizni chetlab o'tishdi" nusxasi boradi — shaffof. Оргополитика "Бевосита раҳбарни четлаб ўтиш фавқулодда ҳолатлардан ташқари тақиқланади".
- **Manba:** v2 Q7 · Оргополитика
- **Dalil (kod):** `grep "bypass\.emergency"` butun `apps/api/src` bo'yicha → **0 fayl** (20-naqshli birlashtirilgan grep, nol mos). `QISM D #39`: inline-button bypass + majburiy sabab oqimi topilmadi.
- **Nima yetishmaydi:** majburiy sabab maydoni bilan "chetlab o'tish" oqimi va chetlab o'tilgan rahbarga nusxa-xabar yo'q. Vizyon bu oqim **faqat bot inline tugmasi** orqali bo'lishini talab qiladi (`QISM A #39`) — inline-keyboard infratuzilmasining o'zi ham yo'q (EP-NTF-021).
- **Bog'liqlik:** EP-NTF-021 (inline keyboard), EP-NTF-010 (`manager_id` — kimni chetlab o'tildi), EP-NTF-076 (gorizontal chegara)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (`manager_id`), Coordination
- **Xoch-havolalar:** `[Module-18] Item 87` · `TASDIQ-2146 §18 #37` · `QISM C 18.37` · `EXTRACTION QISM A #39` · `QISM D #39`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-038 · Yuboruvchi vs qabul qiluvchi masъuliyatini bot ajratsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Har xabarda yuboruvchi + qabul qiluvchi + ko'rilgan vaqt qayd (ikki tomonli masъuliyat) — bahssiz. Оргополитика "Юборган шахс тўғрилиги учун, қабул қилган шахс ўз вақтида кўриб чиқиш учун жавобгар".
- **Manba:** v2 Q8 · Оргополитика "МАСЪУЛИЯТНИ АНИҚ ШАХСЛАРГА БОҒЛАШ"
- **Dalil (kod):** 2026-07-11: `information_schema.columns` `notifications` bo'yicha `user_id`, `read_at`, `is_read` qaytardi, lekin **`sender_id` YO'Q**; `apps/api/src/modules/notifications` da `grep "sender_id"` → 0 fayl. Qabul qiluvchi kuzatuvi real, yuboruvchi atribusiyasi yo'q edi.
- **Nima yetishmaydi:** Δ dan keyin ham "ko'rildi" **yuridik kuchli** ACK sifatida qayd etilmaydi — `QISM D #13`: `callback_query` → immutable audit-log yo'q (grep NTF → 0). Ya'ni ikki tomonli masъuliyatning "qabul qildim va ko'rdim" tomoni hamon isbotlanmaydi.
- **Bog'liqlik:** EP-NTF-016 (ACK tugmasi), EP-NTF-027 (jurnal), EP-NTF-080 (immutable)
- **action:** WIRE
- **⤳ Ta'sir:** Bildirishnoma jurnali (EP-NTF-027), Audit-log
- **Xoch-havolalar:** `[Module-18] Item 88` · `TASDIQ-2146 §18 #38` · `QISM C 18.38` · `EXTRACTION QISM A #13` · `QISM D #13`
- **⚠️ ZIDDIYAT:** `QISM C 18.38` va `[Module-18] Item 88` ikkalasi "`sender_id` yo'q" deydi — 2026-08-07 holatiga ko'ra **ikkalasi ham eskirgan** (qv. Δ).
- **Δ 2026-07-11→08-07:** `978ae170` — commit sarlavhasi aynan "#88 `sender_id` (yuboruvchi) ustuni qo'shildi" — `notifications.sender_id` endi mavjud, ya'ni Item 88 ning asosiy topilmasi **bekor qilindi**. Shuningdek `c430ab1a` `module_code`/`channel`/`status`/`immutable` ustunlarini qo'shdi (E1). Qurilish holati Qisman bo'lib qoladi: ustun bor, ACK-isbot qatlami yo'q.

### EP-NTF-039 · Mijoz bilan bog'liq muammo — savdo menejeriga avtomatik yo'naltirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) "Mijoz masalasi" belgisi → buyurtmaning savdo menejeriga avtomatik; texnik yechim emas, faqat mijoz talabini aniqlash. RD-5 "Агар муаммо мижоз билан боғлиқ бўлса, савдо менежерига хабар берилади" — rolga aniq biriktirilgan.
- **Manba:** v2 Q9 · RD-5
- **Dalil (kod):** `grep "problem\.routeSales"` butun `apps/api/src` bo'yicha → **0 fayl** (20-naqshli birlashtirilgan grep). `QISM D #20`: brak tabiati bo'yicha NTF-tomon trigger yo'q.
- **Nima yetishmaydi:** QC defekt-kategoriyasini eshitib "mijoz masalasi" braklarini biriktirilgan savdo menejeriga yo'naltiradigan listener yo'q. QC tomonda qaysi maydon "mijozdan kelib chiqqan" braklarni belgilashi ham tasdiqlanmagan.
- **Bog'liqlik:** QC defekt-toifalash maydoni (Modul 09/20), EP-NTF-059 (brak rol-marshruti — bir xil zanjir)
- **action:** EVENT
- **⤳ Ta'sir:** Savdo (CRM) ↔ Ishlab chiqarish ↔ Sifat
- **Xoch-havolalar:** `[Module-18] Item 89` · `TASDIQ-2146 §18 #39` · `QISM C 18.39` · `EXTRACTION QISM A #20` · `QISM D #20`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-040 · RD-2/RD-4/RD-5 uchlik kelishuv yig'ilishi chaqirig'i (1 soat)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Uchlik chaqiriq → 3 rahbarga signal + 1 soat taymer + qaror qaydi (davom ettirish / vaqtincha to'xtatish). RD-5 "РД4, РД2 ва РД5 учрашиб… 1 соат ичида хал қилиш талаб қилинади".
- **Manba:** v2 Q10 · RD-5
- **Dalil (kod):** `grep "trio\.meeting"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #47`: BullMQ navbat infratuzilmasi bor (`queue/processors/telegram.processor.ts`, concurrency:2), lekin **per-event izolyatsiya + bekor qilish mantiqi (yig'ilish vs to'xtatish) yo'q**.
- **Nima yetishmaydi:** 3 tomonlama yig'ilish-triggeri, 1 soatlik taymer va qaror-qaydini olish yo'q. Egasi RD-2/RD-4/RD-5 kodlari qaysi lavozimlarga to'g'ri kelishini belgilashi kerak (org-rol xaritasi mavjudligi tasdiqlanmagan).
- **Bog'liqlik:** EP-NTF-041 (to'xtatish qarori — poyga holati bo'yicha juft), org-rol xaritasi (RD-2/4/5)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination, Director, 3 RD
- **Xoch-havolalar:** `[Module-18] Item 90` · `TASDIQ-2146 §18 #40` · `QISM C 18.40` · `EXTRACTION QISM A #47` · `QISM D #47`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-041 · "Vaqtincha to'xtatish" qarori butun zanjirga e'lon qilinsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) To'xtash qarori → buyurtma kartasidagi barcha masъullarga "to'xtatildi: sabab" signali — yagona haqiqat. Quyi bo'limlar bexabar ishlashda davom etmasin.
- **Manba:** v2 Q11 · RD-5 (vaqtincha to'xtatish)
- **Dalil (kod):** `grep "halt\.broadcast"` butun `apps/api/src` bo'yicha → **0 fayl** (20-naqshli birlashtirilgan grep). `QISM D #47`: parallel eventlar uchun alohida navbat izolyatsiyasi va **to'xtatishning ustunlik/bekor qilish mantiqi yo'q**.
- **Nima yetishmaydi:** to'xtatish qarori qayd etilganda `manager_id` zanjiridagi barcha tegishli tomonlarga fan-out broadcast yo'q; poyga holati (yig'ilish chaqirig'i vs to'xtatish qarori bir vaqtda) hal qilinmagan.
- **Bog'liqlik:** EP-NTF-040 (uchlik yig'ilish — poyga jufti), SD (buyurtma kartasi masъullari)
- **action:** CREATE
- **⤳ Ta'sir:** SD (buyurtma), Dizayn/konstruktor/ombor/savdo
- **Xoch-havolalar:** `[Module-18] Item 91` · `TASDIQ-2146 §18 #41` · `QISM C 18.41` · `EXTRACTION QISM A #47` · `QISM D #47`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-042 · Yangi оргополитика e'loni (НО-3 → adaptatsiya menejeri, 1 kun)
- **Qaror holati:** ✅ JAVOBLANGAN (egasi ShVB Q55 bilan)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Yangi оргополитика → НО-3 + adaptatsiya menejeriga signal + 1 kunlik o'qitish boshlash muddati. Hujjat "ўқитиш… 1 кундан кечиктирмай бошланиши керак". Egasi ShVB Q55 "Ikkalasi: Telegram xabar + ERP tasdiqlash" — A'ni tasdiqlaydi.
- **Manba:** v2 Q12 · Оргополитика (НО-3, 1 kun) · ShVB Q55
- **Dalil (kod):** `grep "orgpolicy\.announce"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** НО-3 siyosat-yozuvlariga bog'langan e'lon-va-adaptatsiya-kuzatuv oqimi (1 kunlik tasdiqlash oynasi bilan) yo'q. Egasi НО-3 yozuvlari qayerda saqlanishini tasdiqlashi kerak (bu tekshiruvda aniqlanmagan).
- **Bog'liqlik:** НО-3/оргополитика saqlash joyi (mavjudligi tasdiqlanmagan), EP-NTF-077 (adaptatsiya yakuni), LMS
- **action:** CREATE
- **⤳ Ta'sir:** HR/adaptatsiya + Ta'lim (LMS darslik)
- **Xoch-havolalar:** `[Module-18] Item 92` · `TASDIQ-2146 §18 #42` · `QISM C 18.42`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-043 · Takroriy xato → оргополитика yozish topshirig'i
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Bir xil xato 2-marta takrorlansa bo'lim boshlig'iga "оргополитика yoz" topshirig'i + НО-3'ga nusxa — tizimli. Hujjat takroriy xatoga tizimli javob talab qiladi.
- **Manba:** v2 Q13 · RD-5 (takroriy xato → оргополитика)
- **Dalil (kod):** `grep "defect_type_code"` butun `apps/api/src` daraxti bo'yicha → **0 fayl** — vizyon bandi tayanadigan ustun ("bir xil xato = `defect_type_code` bir xil") kodda **hech qayerda yo'q**. `QISM D #44`: `grep "ntf-repeat-error"` → 0.
- **Nima yetishmaydi:** QC defekt sxemasiga `defect_type_code` qo'shish, takror-sanagich va 2-marta uchraganda Kanban vazifasini avto-yaratish — hech biri yo'q. ⚠️ Yangi ustun/jadval → Q-35 egasi tasdig'i (2026-07-11 da BERILGAN).
- **Bog'liqlik:** QC defekt sxemasi (`defect_type_code` avval qo'shilishi shart — EP-NTF-039/059 bilan **umumiy shart**), EP-NTF-081 (brak statistikasi)
- **action:** CREATE
- **⤳ Ta'sir:** Sifat, HR/KPI (EP-NTF-081 brak statistikasi)
- **Xoch-havolalar:** `[Module-18] Item 93` · `TASDIQ-2146 §18 #43` · `QISM C 18.43` · `EXTRACTION QISM A #44` · `QISM D #44`
- **⚠️ ZIDDIYAT:** MEMORY `project_qc_*` bo'yicha `defect_catalog` jadvali **23 seed qator** bilan jonli (`severity`, `auto_reject`, `direction` ustunlari bilan), lekin `defect_type_code` **nomli ustun** yo'q. Ya'ni "defekt turi" tushunchasi mavjud, vizyon ko'rsatgan aniq ustun-nomi mavjud emas — qurish paytida `defect_catalog` ga ulanish kerak, yangi parallel taksonomiya yaratmaslik kerak.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-044 · Kun yakuni НО-3 hisoboti avtomatik eslatmasi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har kun smena oxirida masъulga eslatma; topshirilmasa НО-3'ga "hisobot kelmadi" signali — nazorat. (Egasi ShVB Q116/Q118 kunlik hisobot bot orqali — mos.)
- **Manba:** v2 Q14 · Оргополитика (НО-3 kun yakuni) · ShVB Q116/Q118
- **Dalil (kod):** `grep "no3\.dailyReport"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #36`: `grep "ShiftEndedEvent"` → 0; per-smena rejalashtirilgan bildirishnoma job'i topilmadi (MES smena jadvallari bor, NTF-job yo'q).
- **Nima yetishmaydi:** kun oxiri croni (НО-3 hisoboti topshirilganmi — yo'q bo'lsa eskalatsiya) yo'q. Vizyon smena vaqtlari `mes_shift_schedules` dan **dinamik** olinishini talab qiladi (3 smena = 3 job) — bu jadval mavjud emas (qv. EP-NTF-046).
- **Bog'liqlik:** НО-3 hisobot mexanizmi (mavjudligi tasdiqlanmagan), EP-NTF-046 (smena jadvali), EP-NTF-045 (3-ritm)
- **action:** CREATE
- **⤳ Ta'sir:** HR (kunlik hisobot), Совершенствование
- **Xoch-havolalar:** `[Module-18] Item 94` · `TASDIQ-2146 §18 #44` · `QISM C 18.44` · `EXTRACTION QISM A #36` · `QISM D #36`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-045 · Kunlik/haftalik/oylik hisobot uchligi (RD-5 boshlig'i)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Uch alohida eslatma (kunlik smena oxiri / haftalik / oy yakuni), har biri o'z adresati bilan — to'liq. Biri ikkinchisini almashtirmaydi.
- **Manba:** v2 Q15 · RD-5 (kunlik/haftalik/oylik)
- **Dalil (kod):** `apps/api/src/cron/fp-cycle.cron.ts` (to'liq o'qildi) — `grep "@Cron\("` bo'yicha **4 job** (:20, :49, :71, :96), hammasi hafta-kuni ifodalari (`'0 9 * * 2'`, `'0 9 * * 3'`, `'0 9 * * 4'`, `'0 9 * * 1'`) — ya'ni **hammasi haftalik**, har biri boshqa hafta kunida. Bu faylda **kunlik** (`'0 9 * * *'`) yoki **oylik** cron ifodasi yo'q.
- **Nima yetishmaydi:** 3 ritmning faqat **1 tasi** (haftalik) qurilgan; kunlik va oylik ritm butunlay yo'q. `QISM C 18.45` ning "haftalik bor; kunlik+oylik yo'q" xulosasi to'g'ri, lekin "2 cron" sanog'i noto'g'ri (aslida 4).
- **Bog'liqlik:** EP-NTF-003 (vaqt sozlash), EP-NTF-005 (FP-tsikl), EP-NTF-044 (kunlik), EP-NTF-068 (oylik)
- **action:** CREATE
- **⤳ Ta'sir:** Cron (3 ritm), Director, Reports
- **Xoch-havolalar:** `[Module-18] Item 95` · `TASDIQ-2146 §18 #45` · `QISM C 18.45`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #45` ning Izoh ustuni "EP-NTF-045, F5" deb yozilgan, lekin uning mavzusi **"Tungi yakka qaror qaydi o'zgartirilmaydi"** — bu EP-NTF-**036** ga tegishli, EP-NTF-045 ga emas. QISM A Izoh-kodlari bir necha joyda siljigan (batafsil: **III QISM §1**); shu sababli bu bandda QISM A xoch-havolasi **berilmadi**.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-046 · Smenalik hisobot (smena texnologi → bosh rejalashtiruvchi)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har smena oxirida texnologga eslatma + tayyor bo'lsa bosh rejalashtiruvchiga avtomatik yo'naltirish — zanjirga mos. Kechikishlar sababini saqlaydi.
- **Manba:** v2 Q16 · RD-5
- **Dalil (kod):** `grep "mes_shift_schedules"` butun `apps/api/src` bo'yicha → **0 fayl**; `SELECT to_regclass('mes_shift_schedules')` → **null** (jonli DB da ham jadval yo'q). `QISM D #24`: `shift_handovers` **real** (`d1-mes-shift-handovers-notes.sql`, `pos-shift-handover.*`, `mes_shift_handovers` = VIEW), lekin smenadan 15 daq oldin rejalashtirilgan bildirishnoma tasdiqlanmadi.
- **Nima yetishmaydi:** smena-oxiri croni (smena yakunlanish holatini o'qib bosh rejalashtiruvchiga xulosa yo'naltirish) yo'q. Egasi kanonik smena-jadval jadvalini tasdiqlashi kerak — vizyonda ko'rsatilgan `mes_shift_schedules` **mavjud emas**; mavjudi `shift_handovers` (lekin to'ldirilmagan).
- **Bog'liqlik:** `shift_handovers` to'ldirilishi (EP-NTF-078), EP-NTF-044 (kun yakuni)
- **action:** CREATE
- **⤳ Ta'sir:** PP (rejalashtirish), MES (smena)
- **Xoch-havolalar:** `[Module-18] Item 96` · `TASDIQ-2146 §18 #46` · `QISM C 18.46` · `EXTRACTION QISM A #24` · `EXTRACTION QISM A #36` · `QISM D #24` · `QISM D #36`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #36` "smena vaqtlari `mes_shift_schedules` dan dinamik" ni **mavjud manba** deb ko'rsatadi; `[Module-18] Item 96` bu jadval **umuman yo'qligini** DB dan tasdiqladi. Item 96 to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-047 · Xom-ashyo yetishmasligi → bosh rejalashtiruvchiga darhol signal
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Zaxira yetmasa darhol bosh rejalashtiruvchiga + ta'minot bo'limiga signal — zanjirga mos. Kechiksa ishlab chiqarish to'xtaydi.
- **Manba:** v2 Q17 · RD-5
- **Dalil (kod):** `grep "min_threshold|max_threshold"` butun `apps/api/src` bo'yicha → **8 fayl**, lekin `bot-gateway/bots/pos.bot.ts:39-45` ni o'qish ko'rsatdiki, yagona zaxira-chegara ishlatilishi **pull-asosli** bot so'rovi (`SELECT … FROM pos_inventory WHERE quantity < min_threshold … LIMIT 5`, foydalanuvchi komanda berganda talab bo'yicha ishlaydi) — avtomatik push/cron trigger emas. `warehouse_stock` ga xos min/max trigger yoki cron topilmadi. `QISM D #22`: `stock-alert.cron.ts:44` (lot-expiry, `@Cron('0 8 * * *')` + routing_rules) va `pos-low-stock.job.ts` bor — lekin **5 daqiqalik cron emas (kunlik)** va 2 daqiqalik `digest_window` batching yo'q.
- **Nima yetishmaydi:** zaxira chegaradan o'tganda rejalashtiruvchiga **proaktiv avtomatik push** yo'q; 5+ material bir vaqtda tushsa birlashtirilgan digest yo'q.
- **Bog'liqlik:** EP-NTF-006 (chegara-trigger — bir xil mexanizm), Ombor (`warehouse_stock` min/max)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor ↔ Rejalashtirish (PP) ↔ Ta'minot (MM)
- **Xoch-havolalar:** `[Module-18] Item 97` · `TASDIQ-2146 §18 #47` · `QISM C 18.47` · `EXTRACTION QISM A #22` · `QISM D #22`
- **⚠️ ZIDDIYAT:** `QISM C 18.47` "`warehouse_stock` `min_threshold` trigger **yo'q**" vs `QISM D #22` "`stock-alert.cron.ts` + `pos-low-stock.job.ts` **bor** (Qisman)". Item 97 aniqlashtiradi: mavjud kod `pos_inventory` ustida va **pull**, `warehouse_stock` ustida **push** yo'q — uchalasi ham qisman to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-048 · Roxler (jihoz) nosozligi — darhol xabar belgisi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Jihoz nosozligi → bo'lim boshlig'iga eng yuqori ustuvor signal (boshqa xabarlar ustida) — to'g'ri ustuvorlik. (EP-NTF-062 KRITIK darajasiga kiradi.)
- **Manba:** v2 Q18 · RD-5 (Roxler) · IoT
- **Dalil (kod):** `grep -i "EquipmentFaultEvent|equipment.fault"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #23`: IoT nosozlik→alert bor (`iot/domain/events/sos-alert-raised.event.ts`, `anomaly-detected.handler.ts`, `mes-sos-escalation`) va umumiy outbox bor (`modules/shared/outbox/`), lekin **aynan `EquipmentFaultEvent` (grep → 0) va `ntf_outbox` (grep → 0) yo'q**.
- **Nima yetishmaydi:** `priority='CRITICAL'` bilan navbatdagi boshqa xabarlardan ustun turadigan jihoz-nosozlik marshruti yo'q; oflayn holatda xabar yo'qolmasligi uchun `ntf_outbox` yo'q. IoT tomonda nosozlik-aniqlash eventi shu nom ostida mavjudligi tasdiqlanmagan.
- **Bog'liqlik:** EP-NTF-029 (avariya signali — bir xil zanjir), EP-NTF-062 (KRITIK daraja), EP-NTF-063 (tunda o'tish), IoT moduli
- **action:** EVENT
- **⤳ Ta'sir:** IoT (stanok), MES, texnik xizmat
- **Xoch-havolalar:** `[Module-18] Item 98` · `TASDIQ-2146 §18 #48` · `QISM C 18.48` · `EXTRACTION QISM A #23` · `QISM D #23`
- **Δ 2026-07-11→08-07:** `6024b085` — eng yaqin jonli zanjir (`mro-machine-stopped` listeneri) endi `CommandBus` orqali haqiqatan yetkazadi (avval faqat DB qatorini yozardi). Bu EP-NTF-029 ni yaxshilaydi; `EquipmentFaultEvent` / KRITIK ustuvorlik marshruti hamon yo'q.

### EP-NTF-049 · Kechikish/uzilish xavfi — "darhol xabardor qilish" tugmasi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Bitta "kechikish xavfi" tugmasi → bo'lim boshlig'iga darhol + qayd (kim, qachon, qaysi buyurtma) — oddiy va tez. Hujjat "ўз вақтида хабар бермаслик"ni jazolanadigan kamchilik deydi.
- **Manba:** v2 Q19 · RD-5
- **Dalil (kod):** `grep "delayRisk\.button"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #49`: BullMQ fon + retry/backoff bor (`telegram.processor.ts:33-49`), lekin `answerCallbackQuery` bilan darhol-ack aynan tasdiqlanmadi (cc-bot/pos-telegram da callback bor, **NTF-da yo'q**).
- **Nima yetishmaydi:** operator uchun bir bosishli "kechikish xavfi" tugmasi (bot inline-keyboard yoki FE) va u yaratadigan signal + audit yozuvi yo'q.
- **Bog'liqlik:** EP-NTF-021 (inline keyboard), EP-NTF-050 (kechikkan xabar KPI si)
- **action:** CREATE
- **⤳ Ta'sir:** MES, PP, Org-struktura
- **Xoch-havolalar:** `[Module-18] Item 99` · `TASDIQ-2146 §18 #49` · `QISM C 18.49` · `EXTRACTION QISM A #49` · `QISM D #49`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-050 · "O'z vaqtida xabar bermaslik" kamchiligini bot qayd qilsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Muammo yuzaga kelgan vaqt vs xabar berilgan vaqt farqi qayd; kechikkan xabarlar oylik KPI'da — o'lchanadi. Hujjatda nomi aniq aytilgan jazolanadigan xatti-harakat.
- **Manba:** v2 Q20 · RD-5
- **Dalil (kod):** `grep "lateReport\.measure"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** "muammo yuz berdi" va "xabar berildi" vaqt tamg'alari orasidagi farqni hisoblash va uni KPI quvuriga uzatish yo'q. "Kechikkan xabar" KPI vazni/chegarasi `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi lozim.
- **Bog'liqlik:** EP-NTF-049 (tugma orqali xabar vaqti), HR/KPI moduli
- **action:** CREATE
- **⤳ Ta'sir:** HR/KPI
- **Xoch-havolalar:** `[Module-18] Item 100` · `TASDIQ-2146 §18 #50` · `QISM C 18.50`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-051 · Bitrix24 kartochka status o'zgarishi → avtomatik bildirishnoma
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har status o'zgarishida keyingi bosqich masъuliga avtomatik signal (status nomi bilan) — zanjir uzilmaydi. (v1 Q24/EP-NTF-024 oltin-ip bilan birlashadi.)
- **Manba:** v2 Q21 · Bitrix24/CRM kartochka lug'ati
- **Dalil (kod):** `notifications/infrastructure/event-handlers/orphan-events.listener.ts:82-98` — `handleKanbanTaskCreated` / `handleKanbanTaskMoved` handlerlari **mavjud**, lekin tanasi faqat `this.logger.log(...)` chaqiruvi va so'ng literal `// TODO: push notification to assigned user or board watchers…` izohidan iborat — status-o'zgarish eventi uchun **hech qanday bildirishnoma yaratilmaydi va yuborilmaydi**.
- **Nima yetishmaydi:** `orphan-events.listener.ts:89,97` dagi `// TODO` log-stub'larini keyingi masъul kartaga/foydalanuvchiga yo'naltiruvchi real bildirishnoma bilan almashtirish kerak. Bu **allaqachon skelet qilingan** listenerni to'ldirish — egasi-qarori talab qilinmaydi.
- **Bog'liqlik:** EP-NTF-024 (oltin-ip — bir xil zanjir), Kanban moduli
- **action:** WIRE
- **⤳ Ta'sir:** CRM/Dizayn ↔ Ishlab chiqarish (oltin-ip), Kanban
- **Xoch-havolalar:** `[Module-18] Item 101` · `TASDIQ-2146 §18 #51` · `QISM C 18.51`
- **Δ 2026-07-11→08-07:** `6024b085` — muhim kontekst: `orphan-events.listener.ts` da `CommandBus` → `CreateNotificationCommand` naqshi **allaqachon bor edi**; bugungi tuzatish uni qo'shni 6 listenerga tarqatdi. Ya'ni bu bandni qurish uchun kerakli infratuzilma **ayni shu faylda tayyor** — faqat `// TODO` stub'lari qoldi.

### EP-NTF-052 · Kartochka "Тасдиқда" statusida tasdiq kutilayotgan signal
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Tasdiqlovchiga darhol + belgilangan vaqtdan keyin qayta eslatma → keyin yuqoriga — nazorat. Tasdiq bosqichida ishlar qotib qoladi.
- **Manba:** v2 Q22 · CRM kartochka (Тасдиқда)
- **Dalil (kod):** `grep "card\.approvalWait"` butun `apps/api/src` bo'yicha → **0 fayl**. Kengroq registrsiz `tasdiqda` grepi 8 fayl qaytardi, lekin birini o'qish (`wms-counts.repository.ts:178`, `"Tasdiqdan oldin…"`) uni **noto'g'ri-musbat** substring mosligi ekanini ko'rsatdi (Kanban karta statusi emas). `QISM D #43`: `LeaveApprovedEvent` **bor** (`hr/domain/events/leave-approved.event.ts`), lekin i.o./rahbarga yo'naltirish listeneri tasdiqlanmagan.
- **Nima yetishmaydi:** "Тасдиқда" ustuniga kirishni eshitib tasdiqlovchini xabardor qiladigan va eskalatsiya taymerini boshlaydigan listener yo'q; tasdiqlovchi ta'tilda bo'lsa i.o. kartasiga o'tkazish yo'q.
- **Bog'liqlik:** EP-NTF-017 (eskalatsiya), EP-NTF-066 (i.o./karta yo'naltirish), HR `LeaveApprovedEvent`
- **action:** EVENT
- **⤳ Ta'sir:** CRM, Kanban, eskalatsiya
- **Xoch-havolalar:** `[Module-18] Item 102` · `TASDIQ-2146 §18 #52` · `QISM C 18.52` · `EXTRACTION QISM A #33` · `EXTRACTION QISM A #43` · `QISM D #33` · `QISM D #43`
- **Δ 2026-07-11→08-07:** ⭐ `6024b085` — `leave-approved` listeneri endi `CommandBus` → `CreateNotificationHandler` orqali o'tadi (avval faqat `notificationRepo.save()` — Telegram/email/SMS **yubormasdi**, `status` yozmasdi). Ya'ni "Ta'til tasdiqlandi" xabari avval **faqat ilova ochilganda** ko'rinardi, endi haqiqatan yetkaziladi. Lekin ta'tilni **i.o. tayinlash / tasdiq-marshrutini o'zgartirish** ga ulash hamon yo'q.

### EP-NTF-053 · Texnik topshiriq (ТТ) to'liqsiz kelganda dizaynerga signal
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) ТТ kiritilganda majburiy maydonlar tekshiriladi; bo'sh bo'lsa savdoga "to'ldiring" signali, dizaynerga ish berilmaydi — oldini olish. To'liqsiz ТТ qayta ishlash/kechikishga olib keladi.
- **Manba:** v2 Q23 · CRM lug'ati (ТТ tarkibi)
- **Dalil (kod):** `grep "TtValidationService|tt\.incomplete|tt_incomplete"` butun `apps/api/src` bo'yicha → **0 fayl** — bu qator (va mos `QISM A #42` Izohi) tayanadigan `TtValidationService` **kodda hech qayerda yo'q**. `QISM D #42`: NTF-da 24 soatlik TT-timeout triggeri topilmadi.
- **Nima yetishmaydi:** avval ТТ to'liqlik validatorining o'zi qurilishi kerak (SD modulida ham yo'q), keyin maydon bo'sh bo'lganda dizaynerga (bloklovchi) va savdoga (ma'lumot uchun) signal beruvchi listener. Egasi ТТ majburiy maydonlar ro'yxatini belgilashi kerak.
- **Bog'liqlik:** `TtValidationService` (SD modulida qurilishi shart), EP-NTF-054 (blok mexanizmi)
- **action:** CREATE
- **⤳ Ta'sir:** CRM/Savdo ↔ Dizayn
- **Xoch-havolalar:** `[Module-18] Item 103` · `TASDIQ-2146 §18 #53` · `QISM C 18.53` · `EXTRACTION QISM A #42` · `QISM D #42`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #42` "SD `TtValidationService` **tekshiradi**" deb mavjud komponent sifatida yozadi; `[Module-18] Item 103` uning **umuman yo'qligini** grep bilan tasdiqladi. Item 103 to'g'ri.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-054 · Korrektor xato topganda dizaynerga darhol xabar
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Korrektor xatosi → dizaynerga darhol + kartochka keyingi bosqichga o'tishi bloklanadi (tuzatilmaguncha) — qattiq. Kitobdagi aniq muammo (maket tuzatilmay ishlab chiqarishga ketgan).
- **Manba:** v2 Q24 · kitob misoli (korrektor)
- **Dalil (kod):** `grep "corrector\.block"` va `grep "KanbanBlockRequestedEvent"` butun `apps/api/src` bo'yicha → **0 fayl**; notifications modulida korrektorga xos listener yo'q (`event-handlers/` katalogida faqat `order-created`, `mro-machine-stopped` va `orphan-events` listenerlari bor). `QISM D #41`: `KanbanBlockRequestedEvent` grep → 0.
- **Nima yetishmaydi:** korrektor-xato eventi + listeneri (dizaynerga xabar **va** keyingi bosqichni bloklash uchun `KanbanBlockRequestedEvent` chiqarish) yo'q. Vizyon modul chegarasini aniq belgilaydi: **NTF faqat signal beradi, blokni Kanban/PP qo'yadi** (E6).
- **Bog'liqlik:** Kanban (`blocked_reason`), EP-NTF-053 (ТТ blok zanjiri)
- **action:** EVENT
- **⤳ Ta'sir:** Dizayn, QC, Kanban (blok)
- **Xoch-havolalar:** `[Module-18] Item 104` · `TASDIQ-2146 §18 #54` · `QISM C 18.54` · `EXTRACTION QISM A #41` · `QISM D #41`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-055 · Dizayner rahbarni chetlab fayl yuborgani signali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Fayl tasdiq belgisisiz yuborilsa → bo'lim rahbariga signal + qayd — nazorat. Kitobdagi muammo (tasdiqsiz fayl ishlab chiqarishga ketgan).
- **Manba:** v2 Q25 · kitob misoli (dizayner)
- **Dalil (kod):** `grep "design_files"` butun `apps/api/src` bo'yicha → **0 fayl**. `SELECT to_regclass('design_files')` → **null** — vizyon bandi tayanadigan `design_files` jadvali jonli DB da **umuman yo'q**. `QISM D #40`: NTF tomonda `approved_by IS NULL` triggeri topilmadi (grep → 0).
- **Nima yetishmaydi:** avval `design_files` jadvalini `approved_by` (nullable FK) bilan yaratish, keyin `approved_by IS NULL` holatida fayl yuborilganda ishga tushadigan listener. ⚠️ Yangi jadval → Q-35 egasi tasdig'i (2026-07-11 da BERILGAN). Vizyon aniq chegara qo'yadi: **faqat ERP ichki fayl nazorat qilinadi**, Telegram orqali fayl ulashish nazorat qilinmaydi.
- **Bog'liqlik:** `design_files` jadvali qurilishi shart, EP-NTF-037 (chetlab o'tish signali)
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn, Org-struktura (`manager_id`)
- **Xoch-havolalar:** `[Module-18] Item 105` · `TASDIQ-2146 §18 #55` · `QISM C 18.55` · `EXTRACTION QISM A #40` · `QISM D #40`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-056 · Og'zaki reja "rasmiy berilgan" deb hisoblanmasligi ogohlantirishi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Yozma qayd yo'q rejaga "rasmiy emas" belgisi + tegishliga ogohlantirish — hujjatga mos. "Оғзаки хабар… режани расмий берилган деб ҳисоблаш учун асос бўлмайди".
- **Manba:** v2 Q26 · RD-5/Оргополитика
- **Dalil (kod):** `grep "plan\.notFormal"` butun `apps/api/src` bo'yicha → **0 fayl** (20-naqshli birlashtirilgan grep).
- **Nima yetishmaydi:** reja yozma qaydsiz bo'lganda ko'rsatiladigan bayroq/nishon yo'q. Egasi "rasmiy" yozma reja-yozuvi nima ekanini belgilashi kerak.
- **Bog'liqlik:** EP-NTF-031 (rasmiy yozuvga aylantirish), EP-NTF-032 (og'zaki→24h yozma)
- **action:** CREATE
- **⤳ Ta'sir:** PP (reja), Kanban
- **Xoch-havolalar:** `[Module-18] Item 106` · `TASDIQ-2146 §18 #56` · `QISM C 18.56`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-057 · Reja o'zgarishi → barcha bog'liq bo'limga e'lon (gorizontal)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Reja o'zgarishi → bog'liq bo'limlarga avtomatik e'lon + ko'rgani qayd — gorizontal kommunikatsiyaga mos. "Оргсхемадаги жойлашувига мувофиқ тегишли бўлимлар билан келишиб режалаштириш".
- **Manba:** v2 Q27 · Оргополитика (gorizontal)
- **Dalil (kod):** `grep "plan\.broadcast"` butun `apps/api/src` bo'yicha → **0 fayl**; `apps/api/src/modules/notifications` da `grep "workflow_rules"` → **0 fayl** — NTF moduli `workflow_rules` ni **umuman o'qimaydi**, ya'ni u yerda gorizontal marshrut yo'qligi tasdiqlanadi. `QISM D #16`: `workflow_rules` jadvali **BOR** (`workflow-rules-2026-06-20.sql`, director-owned CRUD), lekin NTF uni fan-out uchun iste'mol qilmaydi; BullMQ throttle ham ulanmagan.
- **Nima yetishmaydi:** o'zgargan rejaning bog'liq bo'limlarini `workflow_rules` dan o'qib broadcast qiladigan va "ko'rgani" tasdig'ini kuzatadigan listener yo'q; 10+ adresat bo'lganda 30 msg/s navbat-throttle yo'q.
- **Bog'liqlik:** `workflow_rules` (mavjud, NTF-tomon integratsiya bo'shliq), EP-NTF-076 (chegara-qoidalari — bir xil jadval)
- **action:** WIRE
- **⤳ Ta'sir:** PP ↔ barcha bog'liq bo'lim, Coordination (`workflow_rules`)
- **Xoch-havolalar:** `[Module-18] Item 107` · `TASDIQ-2146 §18 #57` · `QISM C 18.57` · `EXTRACTION QISM A #16` · `QISM D #16`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-058 · Аналитik kommunikatsiya: Совершенствование xulosalari kanali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Analitik xabarlar alohida belgi/kanal bilan, faqat Совершенствование bo'limidan chiqadi — hujjatga mos. Tahlil/xulosa oddiy operatsion xabardan farq qiladi.
- **Manba:** v2 Q28 · Оргополитика (аналитik kommunikatsiya)
- **Dalil (kod):** `grep "analytic\.channel"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** "Совершенствование" analitik xulosalari uchun operatsion signallardan **ajratilgan** Telegram kanal/chat marshruti yo'q. Egasi maqsadli kanalning `telegram_chat_id` sini berishi kerak (⚠️ **egasi-DATA**, fabrikatsiya qilinmaydi).
- **Bog'liqlik:** EP-NTF-068 (oylik masъuliyat digesti — bir xil kanal), EP-NTF-008 (kanal tanlash)
- **action:** CONFIG
- **⤳ Ta'sir:** Совершенствование, Director, Reports
- **Xoch-havolalar:** `[Module-18] Item 108` · `TASDIQ-2146 §18 #58` · `QISM C 18.58`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-059 · Brak holatida "shu joyda hal qilish" tartibi (kanal cheklash)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Brak signali → tabiati bo'yicha to'g'ri rolga (texnik → texnolog, mijoz → savdo); har rol faqat o'z vakolati doirasida javob beradi. Оргополитика "Савдо менежери муаммони эшитади, лекин техник ечим топмайди" — aniq rol cheklash hujjatda.
- **Manba:** v2 Q29 · Оргополитика (brak ideal manzarasi)
- **Dalil (kod):** `grep "defect\.routeByRole"` butun `apps/api/src` bo'yicha → **0 fayl**; butun repo bo'yicha `grep "defect_type_code"` → **0 fayl** (Item 93 bilan bir xil topilma — tayanadigan QC toifalash ustuni hali yo'q). `QISM D #20`: NTF tomonda trigger yo'q (QC-domen toifalash, NTF-da dalil topilmadi).
- **Nima yetishmaydi:** `defect_type_code` mavjud bo'lgach (EP-NTF-043), defekt kategoriyasini to'g'ri xabardor qilinadigan rolga xaritalaydigan rol-asosli router. Vizyon: brak tabiatini **QC texnologi** belgilaydi, operator faqat "brak" bosadi; noto'g'ri bo'lsa rahbar qayta toifalaydi (audit-log bilan).
- **Bog'liqlik:** EP-NTF-043 (aynan shu yetishmayotgan `defect_type_code` ustuni), EP-NTF-039 (mijoz masalasi marshruti)
- **action:** EVENT
- **⤳ Ta'sir:** QC ↔ Savdo ↔ Ishlab chiqarish (EP-NTF-039 bilan birga)
- **Xoch-havolalar:** `[Module-18] Item 109` · `TASDIQ-2146 §18 #59` · `QISM C 18.59` · `EXTRACTION QISM A #20` · `QISM D #20`
- **Δ 2026-07-11→08-07:** `6024b085` — `qc-failed` listeneri endi `CommandBus` → `CreateNotificationHandler` orqali o'tadi (avval faqat DB qatorini yozardi, kanal-sozlamalari qo'llanilmasdi). Ya'ni "QC yiqildi" xabari endi haqiqatan yetkaziladi. **Rol bo'yicha ajratish** (texnik ↔ mijoz) hamon yo'q — hamma qabul qiluvchi bir xil marshrutdan oladi.

### EP-NTF-060 · Shikastlangan xom-ashyo aniqlanganda xabar tartibi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Shikast belgilanganda → ta'minot/rahbarga darhol + material "karantin" belgisi (ishlatilmaydi) — to'liq. Shikastlangan material ishlab chiqarishga o'tib ketmasin.
- **Manba:** v2 Q30 · kitob savoli (shikastlangan xom-ashyo)
- **Dalil (kod):** `grep "material\.damaged"` butun `apps/api/src` bo'yicha → **0 fayl** (20-naqshli birlashtirilgan grep).
- **Nima yetishmaydi:** ombor zaxira yozuvida shikastlangan-material bayrog'i + karantin statusi va ta'minot/rahbarga bildirishnoma yo'q. Egasi karantin oqimining maqsadli jadvalini tasdiqlashi kerak (WMS moduli — bu tekshiruvda mustaqil tekshirilmagan).
- **Bog'liqlik:** WMS karantin mexanizmi (mavjudligi tasdiqlanmagan), EP-NTF-047 (ombor signallari)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor ↔ Sifat (karantin) ↔ Ta'minot (MM)
- **Xoch-havolalar:** `[Module-18] Item 110` · `TASDIQ-2146 §18 #60` · `QISM C 18.60`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-061 · Eslatma turlari ro'yxati (digest/signal/muddat/tasdiq/qaror)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Har tur o'z belgisi bilan (🔴 signal / ⏰ muddat / ✅ tasdiq / 📋 qaror / 📊 digest) — aniq farq. Xodim shoshilinch/oddiyni bir qarashda ajratsin.
- **Manba:** v2 Q31
- **Dalil (kod):** 2026-07-11: `apps/api/src/modules/notifications` da `grep "🔴|⏰|✅|📋|📊"` → **2 fayl**. `infrastructure/external/telegram-bot.adapter.ts:95,105` — `high: '🔴'` `urgency` parametridan xaritalanadi, `⏰` esa `sendAlert` uslubidagi xabarlarning vaqt-satriga qattiq yozilgan. `cron/fp-cycle.cron.ts:40,44,46` — `📋` va `✅`/`❌` aniq xabar satrlariga literal yozilgan, `notifications.type` ustunidan tizimli boshqarilmaydi. `QISM D #27`: Telegram xabarda emoji **ruxsat etilgan** (G1 cheklovi faqat web UI uchun) — bu jihat **Ha**.
- **Nima yetishmaydi:** emoji chaqiruv-joyi bo'yicha ad-hoc; barcha bildirishnoma yo'llarida bir xil qo'llanadigan yagona 5-belgili taksonomiya (`type`/`priority` → belgi) yo'q edi.
- **Bog'liqlik:** EP-NTF-062 (ustuvorlik darajalari — bir xil enum), Design-system
- **action:** WIRE
- **⤳ Ta'sir:** Design-system (token/belgi), i18n
- **Xoch-havolalar:** `[Module-18] Item 111` · `TASDIQ-2146 §18 #61` · `QISM C 18.61` · `EXTRACTION QISM A #27` · `QISM D #27`
- **Δ 2026-07-11→08-07:** `21a335e3` — commit sarlavhasi aynan "**#111** type/priority→icon xaritalash birlashtirildi": endi belgi-xaritalash bitta joyda markazlashtirilgan (avval har chaqiruv-joyida qattiq yozilgan edi). Item 111 ning asosiy e'tirozi qisman bartaraf etildi; 5-turli taksonomiyaning to'liq qamrovi qayta tekshirilishi kerak.

### EP-NTF-062 · Alert ustuvorlik darajalari (jihoz > kechikish > oddiy)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) 3 daraja: KRITIK (jihoz/to'xtash) → MUHIM (kechikish/muddat) → ODDIY (hisobot/digest) — tartibli. "Darhol" turdagi xabar oddiy hisobot orasida ko'milmasin.
- **Manba:** v2 Q32 · RD-5 ("дарҳол" turlari)
- **Dalil (kod):** 2026-07-11: `information_schema.columns` `notifications.priority` ustuni borligini tasdiqlaydi. `apps/api/src/modules/notifications` da `grep -i "priority ===.*urgent|priority ===.*critical|ORDER BY priority"` → **mos kelmadi**. `QISM D #4`: `priority` enum `low|normal|high|urgent` (`notifications` + `notification_schedules`), lekin vizyondagi `'CRITICAL'` qiymati **ishlatilmaydi** — enum `urgent` deydi.
- **Nima yetishmaydi:** ⚠️ enum qiymatlari vizyon bilan **mos emas**: vizyon `KRITIK/MUHIM/ODDIY` (3 daraja) va `priority='CRITICAL'` deydi, kod `low/normal/high/urgent` (4 daraja) ishlatadi. Ustuvorlikka qarab **yuborish tartibi** (jihoz signali digestdan oldin) hamon yo'q — saralash faqat ko'rsatishda.
- **Bog'liqlik:** EP-NTF-048 (KRITIK jihoz), EP-NTF-063 (KRITIK tunda o'tadi), EP-NTF-061 (belgi)
- **action:** WIRE
- **⤳ Ta'sir:** EP-NTF-063 (tinchlik istisnosi), EP-NTF-048/029
- **Xoch-havolalar:** `[Module-18] Item 112` · `TASDIQ-2146 §18 #62` · `QISM C 18.62` · `EXTRACTION QISM A #4` · `QISM D #4`
- **Δ 2026-07-11→08-07:** `5e32af91` — commit sarlavhasi aynan "**#112** bildirishnomalar priority bo'yicha saralanadi": `ORDER BY priority` endi mavjud, ya'ni Item 112 ning "saralash topilmadi" topilmasi **bekor qilindi**. Yuborish-navbati ustuvorligi (queue-level) va enum↔vizyon mosligi hamon ochiq.

### EP-NTF-063 · "Darhol" xabarlar tinchlik vaqti (тун) cheklovidan ozodmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Faqat KRITIK darajadagi signal tunda o'tadi, qolganlari ertalabga kechiktiriladi — muvozanat. RD-5 tungi smenani aniq tan oladi (RD-4 tunda javob shart) — KRITIK istisnoni hujjat asoslaydi. (Q140 bilan birga: tinchlik oynasini egasi sozlaydi.)
- **Manba:** v2 Q33 · RD-5 (tungi protokol) · ShVB Q140
- **Dalil (kod):** `apps/api/src/modules/notifications` da `grep -i "CRITICAL.*bypass|bypass.*quiet|priority.*CRITICAL"` → **0 fayl**. Item 68 topilmasi bilan birga (`quiet_hours` hech qayerda o'qilmaydi) — **chetlab o'tiladigan tinchlik-vaqti mantiqining o'zi yo'q**.
- **Nima yetishmaydi:** tinchlik-vaqti bostirishini qurish paytida `priority==='CRITICAL'` bypass shoxi qo'shilishi kerak. Hozir ikkalasi ham yo'q. ⚠️ Kod `urgent` enumini ishlatadi, vizyon `CRITICAL` deydi (EP-NTF-062 dagi nomuvofiqlik).
- **Bog'liqlik:** EP-NTF-018 (**avval tinchlik-vaqti qurilishi shart** — bypass mazmunli bo'lishi uchun), EP-NTF-062 (enum), EP-NTF-035 (tungi protokol)
- **action:** CREATE
- **⤳ Ta'sir:** EP-NTF-018 (tinchlik), EP-NTF-035 (tungi protokol)
- **Xoch-havolalar:** `[Module-18] Item 113` · `TASDIQ-2146 §18 #63` · `QISM C 18.63` · `EXTRACTION QISM A #4` · `QISM D #4`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-064 · Muddat eslatmasining ikki bosqichi (oldindan + o'tganda)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Muddatga yaqin oldindan eslatma + o'tib ketsa rahbarga signal — ikki bosqich. (15 daqiqa / 1 soat / 1 kun / kun yakuni muddatlari uchun yagona qoida; EP-NTF-025/033/034 bilan izchil.)
- **Manba:** v2 Q34 · RD-5 (muddatlar)
- **Dalil (kod):** `grep "deadline\.twoStage"` butun `apps/api/src` bo'yicha → **0 fayl**; notifications modulida BullMQ delayed-job infratuzilmasi yo'q (avvalroq tasdiqlangan).
- **Nima yetishmaydi:** modullar bo'ylab qayta ishlatiladigan umumiy ikki bosqichli muddat-eslatma utilitasi yo'q — bu **EP-NTF-025 bilan to'g'ridan-to'g'ri qoplanadi** (bitta mexanizm, ikki band). Standart oldindan-ogohlantirish chegaralari (15 daq / 1 soat / 1 kun) `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi lozim.
- **Bog'liqlik:** EP-NTF-025 (**aynan bir xil mexanizm — bir marta qurilsin**), EP-NTF-033/034 (tex-karta taymerlari), EP-NTF-069/071 (muddatli talablar)
- **action:** CREATE
- **⤳ Ta'sir:** PP, Kanban, barcha muddat-signal
- **Xoch-havolalar:** `[Module-18] Item 114` · `TASDIQ-2146 §18 #64` · `QISM C 18.64`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-065 · Departament-darajasida umumlashtirilgan hisobot (vertikal)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Yuqoriga chiqqanda darajaga ko'ra umumlashadi (operator detali → bo'lim xulosasi → departament xulosasi) — Vysotskiy modeli. "Раҳбарлар маълумотни 5-департамент даражасида умумлаштириб тақдим қилади".
- **Manba:** v2 Q35 · Оргополитика · `org_structure_vysotskiy7`
- **Dalil (kod):** `grep "report\.aggregateVertical"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #34`: kunlik agregat-cronlar bor (`director/…/owner-summary-daily.cron.ts`, `company-state-snapshot.cron.ts`; NTF-schedule cron soatlik), lekin **aniq 23:00 vaqti va `GROUP BY org_node_id` tasdiqlanmadi**.
- **Nima yetishmaydi:** vertikal-agregatsiya so'rovi (operator→bo'lim→departament rollup) va uni bildirishnomaga ulash yo'q. Vizyon N+1 muammosini oldini olish uchun **bitta `GROUP BY`** talab qiladi. Egasi qaysi ko'rsatkich(lar) rollup bo'lishini tasdiqlashi kerak (ЦКП / KPI / ishlab chiqarish — vizyon qatorining o'zida noaniq).
- **Bog'liqlik:** EP-NTF-010 (org-daraja resolveri), EP-NTF-004 (digest marshruti)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, Director, Reports
- **Xoch-havolalar:** `[Module-18] Item 115` · `TASDIQ-2146 §18 #65` · `QISM C 18.65` · `EXTRACTION QISM A #34` · `QISM D #34`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-066 · Masъuliyat lavozimga bog'langan (xodimga emas) yo'naltirish
- **Qaror holati:** ✅ JAVOBLANGAN (egasi karta-model vizyoni bilan)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Xabar lavozimga (kartaga) yuboriladi → joriy egasiga yetkaziladi; xodim almashsa avtomatik yangi egaga. Оргополитика "Масъулият бўлимга эмас, лавозимга боғланади" + egasi KARTA-markazli model (karta asosiy, xodim ikkilamchi) — A'ni majburlaydi.
- **Manba:** v2 Q36 · Оргополитика · `org_card_centric_model`
- **Dalil (kod):** `grep "recipient_card_id"` butun `apps/api/src` bo'yicha → **0 fayl**. `information_schema.columns` `notifications` bo'yicha yagona qabul qiluvchi ustuni **`user_id`** ekanini tasdiqlaydi — `recipient_card_id` yo'q.
- **Nima yetishmaydi:** ⭐ bu **eng chuqur vizyon-drift**: butun bildirishnoma tizimi **xodimga** yo'naltiradi, kartaga emas. `notifications` ga `recipient_card_id` qo'shib, yuborish vaqtida joriy tayinlangan xodimga hal qilish kerak — shunda xodim almashsa marshrut buzilmaydi. Karta-model resolverini (`cc-org-resolver.ts:127-164`) NTF ga qayta ishlatish/ulash kerak.
- **Bog'liqlik:** EP-NTF-010 (resolver), EP-NTF-022 (bot RBAC ham rol-nom bo'yicha, karta bo'yicha emas), Org karta-model (`users.card_id`)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (karta-model) ↔ HR
- **Xoch-havolalar:** `[Module-18] Item 116` · `TASDIQ-2146 §18 #66` · `QISM C 18.66`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-067 · Masъuliyatni og'zaki o'tkazish taqiqiga rioya
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Masъuliyat o'tkazish faqat rasmiy yozma topshiriq orqali; og'zaki o'tkazma qayd etilmaydi — hujjatga mos. "Масъулиятни бошқа шахсга оғзаки ўтказишга йўл қўйилмайди".
- **Manba:** v2 Q37 · Оргополитика
- **Dalil (kod):** `grep "responsibility\.writtenOnly"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #46`: Telegram "senga o'tkazaman" ni rasmiy formaga yo'naltirish oqimi topilmadi.
- **Nima yetishmaydi:** yagona qabul qilinadigan o'tkazma mexanizmi bo'lgan rasmiy "masъuliyat o'tkazma" formasi (EP-NTF-031 dagi formalize-handler naqshini takrorlaydi) yo'q; bot Telegramdagi og'zaki o'tkazmani rasmiy formaga yo'naltirmaydi.
- **Bog'liqlik:** EP-NTF-031 (rasmiylashtirish naqshi), EP-NTF-066 (karta-yo'naltirish)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination, Audit-log
- **Xoch-havolalar:** `[Module-18] Item 117` · `TASDIQ-2146 §18 #67` · `QISM C 18.67` · `EXTRACTION QISM A #46` · `QISM D #46`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-068 · Oylik masъuliyat tahlili digesti (Совершенствование)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Oy yakunida masъuliyat digesti (qaror → masъul → natija) Совершенствование va departament rahbariga — hujjatga mos. "Ҳар ой якунида… жавобгарлик ҳолати таҳлил қилинади".
- **Manba:** v2 Q38 · Оргополитика
- **Dalil (kod):** `grep "monthly\.responsibilityDigest"` butun `apps/api/src` bo'yicha → **0 fayl**; `fp-cycle.cron.ts` (Item 95) da **oylik cron slot yo'q**. `QISM D #26`: `owner-summary.service` da `trySend` infratuzilmasi bor (qisman), lekin to'liq obuna/jadval yo'q.
- **Nima yetishmaydi:** `qaror → masъul → natija` uchligini digestga yig'adigan oylik cron yo'q. Vizyon **loose coupling** talab qiladi: har modul o'z oylik digest **eventini** chiqaradi, NTF `@OnEvent` bilan yig'adi (NTF boshqa service'ni inject qilmaydi) — bu naqsh ham qurilmagan. Egasi "qaror→masъul→natija" manbasini belgilashi kerak.
- **Bog'liqlik:** EP-NTF-045 (oylik ritm sloti avval kerak), EP-NTF-058 (Совершенствование kanali)
- **action:** CREATE
- **⤳ Ta'sir:** Совершенствование, Director, HR/KPI
- **Xoch-havolalar:** `[Module-18] Item 118` · `TASDIQ-2146 §18 #68` · `QISM C 18.68` · `EXTRACTION QISM A #26` · `QISM D #26`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-069 · Rasmiy ma'lumot talabi (Совершенствование → bo'lim, muddat bilan)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Rasmiy ma'lumot talabi → bo'lim boshlig'iga signal + muddat taymeri + kechiksa eslatma — nazorat. Ma'lumot kechiksa butun oylik tahlil kechikadi.
- **Manba:** v2 Q39 · Оргополитика
- **Dalil (kod):** `grep "dataRequest\.deadline"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** muddat + eslatma bilan rasmiy ma'lumot-talabi oqimi yo'q; muddat-eslatma infratuzilmasi (EP-NTF-025/064) ham hali yo'q.
- **Bog'liqlik:** EP-NTF-025/064 (muddat-eslatma infratuzilmasi), EP-NTF-068 (oylik tahlil manbai)
- **action:** CREATE
- **⤳ Ta'sir:** Совершенствование, Reports
- **Xoch-havolalar:** `[Module-18] Item 119` · `TASDIQ-2146 §18 #69` · `QISM C 18.69`
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #33` ning Izoh ustuni "EP-NTF-**069**, E5" deb yozilgan, lekin uning mavzusi **i.o. / HR `LeaveApprovedEvent`** — bu EP-NTF-**052/066** ga tegishli, EP-NTF-069 (rasmiy ma'lumot talabi) ga emas. QISM A Izoh-kodlari siljigan (**III QISM §1**); shu sababli bu bandda QISM A xoch-havolasi berilmadi.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-070 · Eski ma'lumot ustida ishlash ogohlantirishi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Hujjat/reja yangilansa, eski versiyani ochganlarga "yangilangan, qarang" signali — oldini olish. "Эски маълумот устида ишлашга йўл қўйилмайди".
- **Manba:** v2 Q40 · Оргополитика
- **Dalil (kod):** `SELECT to_regclass('ntf_doc_views')` → **null** — bu qator tayanadigan `ntf_doc_views` jadvali jonli DB da yo'q. `QISM D #15`: `grep "ntf_doc_views"` butun repo bo'yicha → **0**.
- **Nima yetishmaydi:** `ntf_doc_views(user_id, doc_id, doc_version)` jadvalini yaratish va yangi versiya chiqqanda eski `doc_version` ni ko'rganlarga signal beruvchi listener. ⚠️ Yangi jadval → Q-35 (2026-07-11 da BERILGAN).
- **Bog'liqlik:** yo'q (yangi jadval yaratish); tex-karta versiyalash (Ishlab chiqarish/Dizayn)
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (tex-karta versiyalari) ↔ Dizayn
- **Xoch-havolalar:** `[Module-18] Item 120` · `TASDIQ-2146 §18 #70` · `QISM C 18.70` · `EXTRACTION QISM A #15` · `QISM D #15`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-071 · Yig'ilish topshiriqlari uchun eslatma (muddat bilan)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Yig'ilish topshirig'i kiritilsa, masъulga muddat eslatmasi + bajarilmasa rahbarga signal — nazorat. Yig'ilish topshiriqlari tez-tez unutiladi.
- **Manba:** v2 Q41 · RD-5 (yig'ilish topshiriqlari)
- **Dalil (kod):** `grep "meeting.*[Rr]eminder|meetingTaskReminder"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** muddatli yig'ilish-topshiriqlariga cheklangan eslatma croni yo'q. Egasi yig'ilish topshiriqlari qayerda qayd etilishini tasdiqlashi kerak (Kanban `source` maydoni yoki alohida yig'ilishlar jadvali — bu tekshiruvda aniqlanmadi).
- **Bog'liqlik:** yig'ilishlar/vazifalar saqlash mexanizmi (mavjudligi tasdiqlanmagan), EP-NTF-025/064 (muddat infratuzilmasi), EP-NTF-040 (uchlik yig'ilish)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination, Kanban
- **Xoch-havolalar:** `[Module-18] Item 121` · `TASDIQ-2146 §18 #71` · `QISM C 18.71`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-072 · Telefon-qo'ng'iroq qaydini bot saqlasinmi (tungi protokol)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Bot "qo'ng'iroq qildim" tugmasi → vaqt qayd; qarshi tomon "javob berdim" tasdig'i — ikki tomonli qayd. Tunda telefon ishlatiladi, "qildim/qilmagansan" bahsi chiqmasin.
- **Manba:** v2 Q42 · RD-5 (tungi telefon protokoli)
- **Dalil (kod):** `grep "call\.log|call_log"` butun `apps/api/src` bo'yicha → **0 fayl** (Item 85 bilan **aynan bir xil** topilma — bu bir xil yetishmayotgan `call.log` mexanizmiga ishora qiluvchi **dublikat tushuncha**).
- **Nima yetishmaydi:** ikki tomonli "qildim" / "javob berdim" tasdig'i bilan `call_log` jadvali. ⚠️ Yangi jadval → Q-35. **EP-NTF-035 bilan bir marta qurilsin, ikki marta emas.**
- **Bog'liqlik:** EP-NTF-035 (**aynan bir xil mexanizm**), EP-NTF-021 (inline tugma)
- **action:** CREATE
- **⤳ Ta'sir:** EP-NTF-035 (tungi protokol), HR/masъuliyat
- **Xoch-havolalar:** `[Module-18] Item 122` · `TASDIQ-2146 §18 #72` · `QISM C 18.72`
- **⚠️ ZIDDIYAT:** `decisions/18-notifications.md` da EP-NTF-035 va EP-NTF-072 **ikki alohida band** sifatida sanaladi, lekin FULL-ITEM Item 85 va Item 122 ikkalasi ham bir xil `call.log` mexanizmini talab qiladi — bu **raqamlash-dublikati**, qurilish rejasida bitta ish sifatida hisoblanishi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-073 · Buyurtma to'liq tugamasdan reja o'zgartirilsa signal
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Buyurtma tugamay reja o'zgartirilsa → qayd + sabab so'raladi + oylik tahlilga kiradi — o'lchanadi. Yarim qoldirilgan buyurtma dastgoh qayta sozlash/vaqt yo'qotishga olib keladi.
- **Manba:** v2 Q43 · RD-5
- **Dalil (kod):** `grep "PlanChangedMidOrderEvent|plan\.midOrderChange"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #31`: `grep "PlanChangedMidOrderEvent"` → 0; sabab-modal signali yo'q.
- **Nima yetishmaydi:** PP tomonidan chiqariladigan `PlanChangedMidOrderEvent`, majburiy-sabab modali va uni oylik tahlil uchun saqlaydigan listener. Vizyon aniq: **blok qo'ymaydi, lekin sabab so'raladi** — sabab yo'q bo'lsa o'zgarish tasdiqlanmaydi.
- **Bog'liqlik:** `PlanChangedMidOrderEvent` chiqarish nuqtasi PP modulida avval qo'shilishi shart, EP-NTF-057 (reja o'zgarishi e'loni)
- **action:** EVENT
- **⤳ Ta'sir:** PP ↔ Ishlab chiqarish samaradorligi (oylik tahlil)
- **Xoch-havolalar:** `[Module-18] Item 123` · `TASDIQ-2146 §18 #73` · `QISM C 18.73` · `EXTRACTION QISM A #31` · `QISM D #31`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-074 · Kanban doskasidagi qotib qolgan kartochkaga signal
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A) Kartochka statusda belgilangan vaqtdan ko'p qotsa → masъulga + bo'lim boshlig'iga signal — nazorat. Qotgan kartochka ko'rinadi lekin hech kim chuqurlashmaydi.
- **Manba:** v2 Q44 · CRM lug'ati (Kanban doskasi)
- **Dalil (kod):** 2026-07-11: `SELECT to_regclass('kanban_column_sla')` → **null** (jadval jonli DB da **umuman yo'q** edi — manba jadvalining "count=0" da'vosi holatni yumshatgan). Solishtirish uchun: CC modulining o'xshash mexanizmi (`cc-sla.cron.ts`, Item 67 da tasdiqlangan) real, lekin faqat `cc_documents` doirasida. `QISM A #19`: vizyon **har status uchun alohida SLA** talab qiladi (global emas) — `column_name` / `threshold_minutes` / `module_code`.
- **Nima yetishmaydi:** ⭐ jadval endi yaratilgan (Δ), lekin **hech qanday kod uni o'qimaydi** — 2026-08-07 live grep `kanban_column_sla|kanbanColumnSla` bo'yicha faqat **4 fayl**, hammasi sxema/migratsiya: `shared/db/index.ts` (barrel), `shared/db/schema-kanban.ts`, `shared/db/migrations/kanban-column-sla-2026-08-03.sql`, `shared/db/migrations/business-settings-s1-keys-2026-07-11.sql`. **SLA hisoblovchi cron yo'q, egasi uchun CRUD UI yo'q.** CC ning `cc-sla.cron.ts` foydalanishga yaroqli shablon.
- **Bog'liqlik:** EP-NTF-007 (chegara-config — bir xil "yozildi, o'qilmaydi" muammosi), Kanban moduli, `cc-sla.cron.ts` (shablon)
- **action:** CREATE
- **⤳ Ta'sir:** Kanban, Coordination
- **Xoch-havolalar:** `[Module-18] Item 124` · `TASDIQ-2146 §18 #74` · `QISM C 18.74` · `EXTRACTION QISM A #19` · `QISM D #19`
- **Δ 2026-07-11→08-07:** `ba46a088` — `kanban-column-sla-2026-08-03.sql` bilan `kanban_column_sla` jadvali default qatorlar bilan yaratildi va `schema-kanban.ts` da Drizzle sxemasi bor. Item 124 ning "`to_regclass` → null" topilmasi **bekor qilindi**, lekin funksional holat **Yo'q** bo'lib qoladi: o'quvchi cron ham, CRUD ham yo'q.

### EP-NTF-075 · Buyurtma bajarilishi hisoboti (RD-5 → rahbariyat)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Buyurtma yopilganda avtomatik bajarilish hisoboti (reja / fakt / kechikish / sabab) rahbariyatga — to'liq. Har buyurtma yakuni hisobotsiz o'tib ketmasin.
- **Manba:** v2 Q45 · RD-5
- **Dalil (kod):** `grep "order\.completionReport"` butun `apps/api/src` bo'yicha → **0 fayl**.
- **Nima yetishmaydi:** buyurtma "tugadi" statusida ishga tushadigan, reja/fakt/kechikishni solishtiruvchi hisobot-generatori yo'q. Buyurtma-status listener infratuzilmasi ham faqat `created` ni qamraydi (Item 74) — `completed` listeneri xuddi shu tarzda qo'shilishi kerak.
- **Bog'liqlik:** EP-NTF-024 (order-status listener — faqat `created` bor), EP-NTF-051 (kartochka status)
- **action:** EVENT
- **⤳ Ta'sir:** SD (buyurtma), Reports, Director
- **Xoch-havolalar:** `[Module-18] Item 125` · `TASDIQ-2146 §18 #75` · `QISM C 18.75`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-076 · Bir bo'lim ikkinchisining vazifasiga aralashganda signal (gorizontal chegara)
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Vakolatdan tashqari qaror → tegishli bo'lim boshlig'iga signal + qayd — chegara himoyasi. "Бир бўлим иккинчи бўлим вазифасига аралашмайди".
- **Manba:** v2 Q46 · Оргополитика
- **Dalil (kod):** `grep "scope\.violation"` butun `apps/api/src` bo'yicha → **0 fayl**; notifications modulida `grep "workflow_rules"` (Item 107 uchun tekshirilgan) ham 0 fayl qaytardi — ya'ni NTF tomonda chegara-himoyasi `workflow_rules` ni o'qimaydi. `QISM D #32`: `workflow_rules` jadvali **BOR** (director), lekin NTF ga avto chegara-buzilish signali ulanmagan.
- **Nima yetishmaydi:** `workflow_rules` asosidagi tekshiruv (vakolatdan tashqari harakatni belgilash + boshliqqa xabar + audit yozuvi) yo'q. Egasi har rol uchun "vakolatdan tashqari" nimani anglatishini (qaysi `workflow_rules` qatorlari qo'llanishini) belgilashi kerak.
- **Bog'liqlik:** EP-NTF-057 (**aynan bir xil yetishmayotgan `workflow_rules`↔NTF integratsiyasi**), EP-NTF-037 (chetlab o'tish)
- **action:** WIRE
- **⤳ Ta'sir:** Org-struktura, Coordination (gorizontal)
- **Xoch-havolalar:** `[Module-18] Item 126` · `TASDIQ-2146 §18 #76` · `QISM C 18.76` · `EXTRACTION QISM A #32` · `QISM D #32`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-077 · Adaptatsiya (o'qitish) yakunlanganini bot tasdiqlasinmi
- **Qaror holati:** ✅ JAVOBLANGAN (egasi ShVB Q55/Q47-jarayon bilan)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Har xodim yangi оргополитика/yo'riqnomani o'qib tasdiqlaydi; tasdiqlamaganlar НО-3'ga ko'rinadi — qayd. Kitob har bo'lim oxirida "ўқиб чиққанингизни тасдиқланг" talab qiladi. Egasi ShVB Q55 "Telegram xabar + ERP tasdiqlash" — A'ni tasdiqlaydi.
- **Manba:** v2 Q47 · kitob (har vazifa oxirida tasdiq) · ShVB Q55
- **Dalil (kod):** `grep "LmsModuleCompletedEvent"` butun `apps/api/src` bo'yicha → **0 fayl** — bu qator (va mos `QISM A #37` Izohi) tayanadigan event kodda yo'q. `QISM D #37`: NTF-da faqat `LmsCertExpiredNotificationListener` bor (**boshqa event**).
- **Nima yetishmaydi:** LMS modul-yakunlash eventi (progress=100%) mavjud bo'lgach, adaptatsiya yakunini tasdiqlovchi va tasdiqlamaganlarni НО-3 ga eskalatsiya qiluvchi listener. Vizyon: LMS 100% = **avto ACK** (inline keyboardga teng) — ikki yo'l parallel `ack_at` ni to'ldiradi (EP-NTF-016 bilan bog'liq).
- **Bog'liqlik:** LMS modul-yakunlash eventi avval qurilishi shart, EP-NTF-016 (`ack_at`), EP-NTF-042 (оргополитика e'loni)
- **action:** EVENT
- **⤳ Ta'sir:** HR/adaptatsiya ↔ Ta'lim (LMS)
- **Xoch-havolalar:** `[Module-18] Item 127` · `TASDIQ-2146 §18 #77` · `QISM C 18.77` · `EXTRACTION QISM A #37` · `QISM D #37`
- **Δ 2026-07-11→08-07:** `6024b085` — mavjud `lms-cert-expired` listeneri endi `CommandBus` → `CreateNotificationHandler` orqali o'tadi (avval faqat DB qatorini yozardi). Bu **boshqa event** (sertifikat muddati tugashi), talab qilingan `LmsModuleCompletedEvent` hamon yo'q — band holati **Yo'q** bo'lib qoladi.

### EP-NTF-078 · Smenalararo topshirish (peshma-pesh) bildirishnomasi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Smena yakunida ochiq ishlar/muammolar ro'yxati avtomatik keyingi smenaga + texnologga yetkaziladi — uzilishsiz. Smena almashganda ochiq muammo yo'qolmasin.
- **Manba:** v2 Q48 · kitob (3 smena tizimi)
- **Dalil (kod):** `SELECT to_regclass('shift_handovers')` → jadval **mavjud**; `SELECT count(*) FROM shift_handovers` → **0 qator**. `apps/api/src/modules/notifications` da `grep "shift_handovers|ShiftHandover"` → **0 fayl** (hech bir listener bu jadvalni avtomatik bildirishnoma uchun o'qimaydi). `QISM D #24`: `mes_shift_handovers` = VIEW, baza jadval = `shift_handovers`; smenadan **15 daqiqa OLDIN** rejalashtirilgan xabar tasdiqlanmadi.
- **Nima yetishmaydi:** jadval bor, lekin **bo'sh** va NTF uni o'qimaydi. Avval MES smena-yopish mantiqi `shift_handovers` ni to'ldirishi kerak, keyingina listener biror narsa ustida ishlay oladi. "15 daq oldin" rejalashtirilgan job yo'q.
- **Bog'liqlik:** MES smena-yopish mantiqi (`shift_handovers` ni to'ldirish), EP-NTF-046 (smenalik hisobot — bir xil zanjir)
- **action:** WIRE
- **⤳ Ta'sir:** MES (smena), PP
- **Xoch-havolalar:** `[Module-18] Item 128` · `TASDIQ-2146 §18 #78` · `QISM C 18.78` · `EXTRACTION QISM A #24` · `QISM D #24`
- **Δ 2026-07-11→08-07:** —

### EP-NTF-079 · "Kim-nima-oladi" matritsasini egasi ko'rib chiqsinmi (kanal xaritasi)
- **Qaror holati:** ✅ JAVOBLANGAN (egasi-qaror darvozasi)
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A) Egasi/rahbar ko'radigan yagona "hodisa → lavozim → kanal" jadvali, undan barcha yo'naltirish kelib chiqadi — yagona haqiqat. Оргополитика ideali "Ким, қачон, қандай масалада ва қайси канал орқали мулоқот қилиши аниқ белгиланган". Bu jadval Q140 (egasi vaqt/kanal sozlaydi) bilan birga NTF marshrutining markazi — egasi tasdig'idan o'tadi.
- **Manba:** v2 Q49 · Оргополитика (kommunikatsiya matritsasi) · ShVB Q140
- **Dalil (kod):** `SELECT * FROM notification_schedules` → **1 qator** (`id=1`, `name='Kunlik kompaniya digesti'`, `notification_type='company_digest'`, `target_role='super_admin'`, `interval_hours=24`, `is_active=true`). Bu manba jadvalining o'z Izohiga (`notification_schedules count=0`) **zid**. Bundan tashqari `notification_routing_rules` jadvali ham jonli va ishlatiladi (EP-NTF-029 dagi `mro.machine_stopped` marshruti undan keladi).
- **Nima yetishmaydi:** bitta qattiq jadval qatori — vizyon tasvirlagan **"hodisa → lavozim → kanal" matritsasi va egasi tahrirlaydigan UI emas**. Matritsa uchun UI/CRUD topilmadi, faqat bitta event-turi sozlangan. ⚠️ **Egasi-DATA:** to'liq `event-type × rol × kanal` matritsa mazmunini egasi berishi kerak — fabrikatsiya qilinmaydi (Q-40).
- **Bog'liqlik:** EP-NTF-003 (cron vaqti shu jadvaldan), EP-NTF-007 (chegaralar), EP-NTF-008/009/010 (marshrut), **barcha modul**
- **action:** CREATE
- **⤳ Ta'sir:** BARCHA modul (bildirishnoma marshrutining markaziy jadvali)
- **Xoch-havolalar:** `[Module-18] Item 129` · `TASDIQ-2146 §18 #79` · `QISM C 18.79` · `EXTRACTION QISM A #9` · `QISM D #9`
- **⚠️ ZIDDIYAT:** `QISM C 18.79` (2026-06-27) "`notification_schedules` **count=0**" vs `[Module-18] Item 129` (2026-07-11) "**1 qator** (2026-06-30 build-wave seed'i)". Item 129 to'g'ri — QISM C eskirgan.
- **Δ 2026-07-11→08-07:** —

### EP-NTF-080 · "Ma'lumot yo'qolmaydi" kafolati — har xabar arxivga tushsinmi
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A) Rasmiy xabar/qaror/sifat natijasi o'chirilmaydigan arxivga tushadi, qidirish mumkin; oddiy chat o'chsa ham bu qoladi — hujjatga mos. "Барча муҳим қарорлар ёзма қайд этилган, маълумот йўқолмайди" + "ОТК натижалари ўчирилмайди".
- **Manba:** v2 Q50 · Оргополитика
- **Dalil (kod):** 2026-07-11: `SELECT count(*) FROM notifications` → **7030 qator** (manba jadvalidagi "3735 qator" dan o'sgan — qator-saqlanish da'vosini yo'nalish bo'yicha tasdiqlaydi). `information_schema.triggers WHERE event_object_table='notifications'` → **bo'sh natija** — `notifications` jadvalida **DELETE-bloklovchi trigger YO'Q**. `QISM D #10`: `fix-notifications-schema.sql` da DELETE trigger/immutable yo'q; `notification-schedules` controlleri DELETE ga ruxsat beradi.
- **Nima yetishmaydi:** qatorlar amalda o'chirilmaydi (7030 to'plangan, o'sib bormoqda), lekin bu **xulq-atvor, majburlash emas** — `RAISE EXCEPTION`-on-DELETE trigger yo'q, ya'ni kelajakdagi `DELETE FROM notifications` ni hech narsa to'xtatmaydi. Arxiv = "yashirish" (soft filter) semantikasi ham qurilmagan.
- **Bog'liqlik:** EP-NTF-027 (jurnal), EP-NTF-036/045 (tungi qaror immutable), EP-NTF-031 (rasmiy yozuv)
- **action:** CREATE
- **⤳ Ta'sir:** Sifat (ОТК arxivi) ↔ Совершенствование (tahlil manbai), Audit-log
- **Xoch-havolalar:** `[Module-18] Item 130` · `TASDIQ-2146 §18 #80` · `QISM C 18.80` · `EXTRACTION QISM A #10` · `QISM D #10`
- **Δ 2026-07-11→08-07:** `c430ab1a` — `notifications` ga `module_code` / `channel` / `status` / `immutable` ustunlari qo'shildi (E1). Ya'ni `immutable` **bayrog'i endi mavjud**, lekin uni majburlaydigan **DB triggeri hamon yo'q** — Item 130 ning asosiy topilmasi (trigger yo'q) kuchda qoladi.

### EP-NTF-081 · Brak/xato statistikasi haftalik digestda bo'lim kesimida
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Haftalik digestda bo'lim kesimida xato soni + takrorlanganlari belgilangan — manba ko'rinadi. Takroriy xato manbasi ko'rinmasa, оргополитика yozish (EP-NTF-043) kimga kerakligi bilinmaydi.
- **Manba:** v2 Q51 · kitob (xato bo'limga biriktiriladi)
- **Dalil (kod):** `grep "defect\.weeklyStats"` butun `apps/api/src` bo'yicha → **0 fayl**; `fp-cycle.cron.ts` (Item 95 uchun to'liq o'qilgan) da bo'lim-kesimli QC digest croni **yo'q** (faqat ЗВС/ФП/kun-eslatma joblari, brakka aloqadori yo'q).
- **Nima yetishmaydi:** QC defekt sonlarini/takrorlarini bo'lim bo'yicha guruhlab digest yuboradigan haftalik cron yo'q. Defekt-turi kesimi uchun `defect_type_code` kerak (EP-NTF-043), lekin oddiy bo'lim-bo'yicha sanoqni usiz ham qurish mumkin.
- **Bog'liqlik:** EP-NTF-043 (`defect_type_code`), EP-NTF-045 (haftalik ritm), QC moduli
- **action:** CREATE
- **⤳ Ta'sir:** Sifat ↔ HR/KPI ↔ Совершенствование
- **Xoch-havolalar:** `[Module-18] Item 131` · `TASDIQ-2146 §18 #81` · `QISM C 18.81`
- **Δ 2026-07-11→08-07:** `6024b085` — `qc-failed` listeneri endi haqiqatan yetkazadi (EP-NTF-059 ga qarang), ya'ni **bitta-brak signali** ishlaydi; **statistik agregat digest** hamon yo'q.

### EP-NTF-082 · Ko'rilmagan muhim xabar uchun qayta-yuborish jadvali
- **Qaror holati:** 🔵 OCHIQ (A-default)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A) Muhim xabar ko'rilmasa 2 marta qayta (belgilangan oraliqda), keyin yuqoriga eskalatsiya — muvozanat. Bir marta yetarli emas, cheksiz takror bezovta qiladi. (EP-NTF-016 ack + EP-NTF-017 eskalatsiya bilan birga.)
- **Manba:** v2 Q52
- **Dalil (kod):** `apps/api/src/modules/notifications` da `grep -i "resend\.schedule"` va `grep -i "resend|retry.*notif"` → **0 fayl**; bu modulda BullMQ yo'qligi allaqachon tasdiqlangan — ya'ni **retry/resend navbat mexanizmi yo'q**.
- **Nima yetishmaydi:** N daqiqadan eski, o'qilmagan `priority IN ('high','urgent')` bildirishnomalarni topib 2 martagacha qayta yuboradigan, so'ng eskalatsiya qiladigan cron/BullMQ job yo'q. Qayta-yuborish oralig'i va eskalatsiya chegarasi `business_settings` ga default bilan qo'shilib CRUD orqali sozlanishi lozim. ⚠️ Bu band **EP-NTF-016 (ACK)** siz mazmunsiz — "ko'rilmadi" ta'rifi hozir o'lchanmaydi.
- **Bog'liqlik:** EP-NTF-016 (**ACK avval kerak**), EP-NTF-017 (eskalatsiya), EP-NTF-025/064 (delayed-job infra)
- **action:** CREATE
- **⤳ Ta'sir:** EP-NTF-016 (ack), EP-NTF-017 (eskalatsiya)
- **Xoch-havolalar:** `[Module-18] Item 132` · `TASDIQ-2146 §18 #82` · `QISM C 18.82` · `EXTRACTION QISM A #5` · `QISM D #5`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-NTF-I01..I05)

> Bular `decisions/18-notifications.md` da **EP-kod olmagan**, lekin `vision-1000-answers` / `FULL-ITEM Item 1..50` / `decisions` Step-3 da mustaqil talab sifatida turgan kesishuvchi arxitektura bandlari. `QISM A` jadvalining "Izoh" ustunida ular uchun EP-NTF kodi ko'rsatilmagan (yoki umuman kod yo'q).

### VR-NTF-I01 · Yagona `ntf_notifications` jadval (module_code filtri bilan)
- **Qaror holati:** — (EP-kodsiz; `vision-1000-answers #2`)
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Barcha modul uchun **bitta** universal xabar jadvali (`id/recipient/channel/priority/status/module_code/payload_json/immutable`), partitioning shart emas.
- **Manba:** `vision-1000-answers/18-notifications.md #2` · `EXTRACTION QISM A #2` (Izoh: H4 — partitioning egasi ruxsati)
- **Dalil (kod):** 2026-07-11: `SELECT to_regclass('public.ntf_notifications')` → **null**. Jonli jadval = `notifications` (**7030 qator**); ustunlari `id/user_id/type/title/title_ru/body/message_ru/is_read/created_at/reference_id/reference_type/message/read/entity_type/entity_id/updated_at/document_id/priority/title_uz/message_uz/read_at/sent_via_telegram/telegram_message_id/notification_type/metadata` — `recipient`, `channel`, `status`, `module_code`, `payload_json`, `immutable` maydonlari **yo'q** edi.
- **Nima yetishmaydi:** jadval **nomi** hamon `notifications` (`ntf_notifications` emas) — bu tanlov qabul qilingan deb hisoblanishi kerak (qayta nomlash 200+ chaqiruv-joyiga tegadi). `payload_json` va `recipient` (karta-asosli, qv. EP-NTF-066) hamon yo'q.
- **Bog'liqlik:** EP-NTF-066 (`recipient_card_id`), EP-NTF-080 (`immutable` majburlash)
- **action:** WIRE
- **⤳ Ta'sir:** Barcha modul (yagona xabar jadvali)
- **Xoch-havolalar:** `[Module-18] Item 2` · `EXTRACTION QISM A #2` · `QISM D #2`
- **Δ 2026-07-11→08-07:** `c430ab1a` — `module_code` / `channel` / `status` / `immutable` ustunlari qo'shildi (E1); `978ae170` — `sender_id`; `493d1fe2` — `category_code` taksonomiya soft-ref (`notification_category`). Ya'ni Item 2 sanagan 6 yetishmayotgan maydondan **4 tasi qo'shildi**; qolgani: `recipient` (karta) va `payload_json`.

### VR-NTF-I02 · Event payload versiyalash `{version,data}` + dead-letter
- **Qaror holati:** — (EP-kodsiz; `vision-1000-answers #48`)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** NTF iste'mol qiladigan event payloadlari `{version, data}` konvertiga o'raladi; noma'lum versiya → dead-letter. Breaking change oldini olish (optional-add / major-remove qoidasi).
- **Manba:** `vision-1000-answers/18-notifications.md #48` · `EXTRACTION QISM A #48` (Izoh: A8, EventEmitter2)
- **Dalil (kod):** `apps/api/src/modules/notifications` doirasida `grep -i "version.*data|payload.*version"` → **0 fayl**; `create-notification.command.ts` va `.handler.ts` (ikkalasi to'liq o'qilgan) **tekis, versiyalanmagan DTO** shaklidan foydalanadi. `QISM D #48`: BullMQ retry/backoff DLQ bor (`telegram.processor.ts:34`), EventBridge bor — lekin `{version,data}` konverti va versiya-tekshiruvi yo'q.
- **Nima yetishmaydi:** versiya konverti va noma'lum versiya uchun dead-letter yo'li. ⚠️ Bugungi `6024b085` bilan **6 ta listener** endi aynan shu `CreateNotificationCommand` DTO sidan o'tadi — ya'ni versiyalanmagan DTO endi **markaziy nuqta**, uni o'zgartirish 7 ta chaqiruv-joyiga tegadi.
- **Bog'liqlik:** `CreateNotificationCommand` DTO (endi 7 ta iste'molchi), BullMQ DLQ
- **action:** CREATE
- **⤳ Ta'sir:** Barcha event chiqaruvchi modul (SD/QC/MRO/CRM/LMS/HR)
- **Xoch-havolalar:** `[Module-18] Item 48` · `EXTRACTION QISM A #48` · `QISM D #48`
- **Δ 2026-07-11→08-07:** `6024b085` — DTO ning markaziyligi oshdi (6 yangi iste'molchi), ya'ni **bu bandning narxi bugun ko'tarildi**: versiyalash kechiktirilsa, keyinchalik o'zgartirish qimmatroq bo'ladi.

### VR-NTF-I03 · Bot salomatligi (`ntf_bot_health`) + 30s ping cron + restart
- **Qaror holati:** — (EP-kodsiz; `vision-1000-answers #50`)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Har bot uchun salomatlik yozuvi `ntf_bot_health`, 30 soniyalik ping croni; ishdan chiqsa **avto-restart + adminga signal**; `/api/ntf/health` orqali uptime.
- **Manba:** `vision-1000-answers/18-notifications.md #50` · `EXTRACTION QISM A #50` (Izoh: A5/A8)
- **Dalil (kod):** `SELECT to_regclass('public.ntf_bot_health')` → **null**; `grep "ntf/health|ntf_bot_health"` butun `apps/api/src` bo'yicha → **0 fayl**. `QISM D #50`: `TelegramSvc.getStatus()` salomatlik probi bor (`telegram/telegram.service.ts:161`, real bot-status), lekin jadval + 30s ping cron + restart yo'q.
- **Nima yetishmaydi:** `ntf_bot_health` jadvali, 30 soniyalik per-bot salomatlik croni va crash-aniqlash → restart / admin-alert handleri. ⚠️ Yangi jadval → Q-35. ⚠️ `a3c74437` bilan eski `TelegramSvc` stack **olib tashlandi** — `getStatus()` probining hozirgi holati qayta tekshirilishi kerak.
- **Bog'liqlik:** EP-NTF-019 (9 bot), Q-35 (yangi jadval)
- **action:** CREATE
- **⤳ Ta'sir:** DevOps/monitoring, barcha 9 modul-bot
- **Xoch-havolalar:** `[Module-18] Item 50` · `EXTRACTION QISM A #50` · `QISM D #50`
- **Δ 2026-07-11→08-07:** `a3c74437` + `1f759fd8` — o'lik `TelegramSvc`/`AlertsService`/`erp-events-listener` stack olib tashlandi. `QISM D #50` iqtibos qilgan `telegram.service.ts:161` `getStatus()` probi shu tozalashda tegilgan bo'lishi mumkin — **qayta tekshirish kerak**.

### VR-NTF-I04 · Telegram mini-app auth bo'shlig'i (material request approve/reject)
- **Qaror holati:** — (EP-kodsiz; `decisions` Step-3 ochiq savol)
- **Qurilish holati:** Yo'q *(2026-07-11, MASTER-STATUS-BOARD:504 A7 IN-PROGRESS 70%)*
- **Talab:** Telegram mini-app orqali material-so'rovni tasdiqlash/rad etish **autentifikatsiya qilingan** bo'lishi shart — hozir auth-dekorator qamrovida bo'shliqlar bor va bu **ekspluatatsiya qilinadigan**.
- **Manba:** `decisions/18-notifications.md` Step 3 · `vision-1000-answers #21` · `MASTER-STATUS-BOARD-2026-07-06.md:504` (A7)
- **Dalil (kod):** `MASTER-STATUS-BOARD:504` A7 "mini-app auth gap — material request approve/reject exploitable", IN-PROGRESS 70%. `QISM D #6`: bot-gateway rol tekshiruvi `req.botEmployee.role` orqali; `telegram-auth.guard.ts:50-68` constant-time secret solishtiradi (webhook darajasida). Mini-app (webhook emas) yo'li alohida.
- **Nima yetishmaydi:** auth-dekorator qamrovi to'liq emas; bu **xavfsizlik bandi**, funksional emas — qurilish navbatida ustuvor.
- **Bog'liqlik:** EP-NTF-022 (bot RBAC), EP-NTF-021 (tasdiq/rad tugma-oqimi)
- **action:** FIX
- **⤳ Ta'sir:** Ombor (material request), xavfsizlik
- **Xoch-havolalar:** `decisions/18-notifications.md` Step 3 · `EXTRACTION QISM A #21`
- **Δ 2026-07-11→08-07:** — (bu bo'shliq bugungi 14 commit ichida ko'rilmadi)

### VR-NTF-I05 · Kanal auto-ingest (WhatsApp/SMS/Email kirish oqimi) yo'q
- **Qaror holati:** — (EP-kodsiz; `decisions` Step-3 ochiq savol)
- **Qurilish holati:** Yo'q *(2026-07-11, VISION-3340:615 SB0651 STILL-OPEN)*
- **Talab:** Tashqi kanallar (Telegram / WhatsApp / SMS / Email) orqali **kelgan** xabarlar ERP ga avtomatik yutilishi (ingest). Egasi Q59 "Email + Telegram (ikkalasi ham)" tashqi muloqot kanali sifatida tasdiqlagan.
- **Manba:** `decisions/18-notifications.md` Step 3 · `vision-1000-answers #6/#25` · `VISION-3340:615` SB0651 · ShVB Q59
- **Dalil (kod):** `VISION-3340-RECONCILIATION-2026-07-04.md:615` SB0651 **STILL-OPEN** ("not checked / qurilmagan"). NTF modulida chiquvchi adapterlar bor (`telegram-bot.adapter.ts`, `i-email-sender.port.ts`), **kiruvchi ingest** yo'q — `bot-gateway` faqat Telegram webhookini qabul qiladi.
- **Nima yetishmaydi:** Email/SMS/WhatsApp kiruvchi oqimi umuman qurilmagan; Telegram kiruvchi oqimi faqat bot-komanda/callback bilan cheklangan (erkin xabar ingest emas).
- **Bog'liqlik:** EP-NTF-019 (bot-gateway), ShVB Q59 (egasi kanal-qarori)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz murojaati), Coordination
- **Xoch-havolalar:** `decisions/18-notifications.md` Step 3 · `EXTRACTION QISM A #6` · `EXTRACTION QISM A #25`
- **Δ 2026-07-11→08-07:** —

---

## III QISM — Raqamlash, manba-ziddiyatlari va sanoq tekshiruvi

### §1 — Xaritalash jadvali va QISM A Izoh-kodlarining siljishi

**Asosiy xaritalash (1:1, bo'shliqsiz):**

| Manba | Diapazon | EP-NTF ga mos |
|---|---|---|
| `FULL-ITEM [Module-18]` Item **51..132** | 82 item | **EP-NTF-001..082** (`Item N = EP-NTF-(N−50)`) |
| `TASDIQ-2146 §18 #1..#82` | 82 qator | **EP-NTF-001..082** (1:1) |
| `EXTRACTION QISM C 18.1..18.82` | 82 qator | **EP-NTF-001..082** (1:1) |
| `FULL-ITEM [Module-18]` Item **1..50** | 50 item | `vision-1000-answers #1..#50` = `QISM A #1..#50` = `QISM D #N` — **EP-kodsiz**, mavzu bo'yicha ulanadi |

Bu xaritalash **hech qanday bo'shliq yoki siljishsiz** — QC (09) modulidan farqli o'laroq bu yerda raqamlash toza. `grep -c "^### EP-NTF-"` → **82**.

**⚠️ QISM A "Izoh" ustunidagi EP-kod siljishi.** `EXTRACTION QISM A` jadvalining oxirgi ustuni har qatorni EP-NTF kodiga ulashga urinadi, lekin **kamida 2 joyda kod mavzuga mos kelmaydi**:

| QISM A # | Mavzu | Izohdagi kod | To'g'ri kod |
|---|---|---|---|
| #33 | i.o. mavjud → avto bildirishnoma; HR `LeaveApprovedEvent` | `EP-NTF-069` | **EP-NTF-052 / EP-NTF-066** |
| #45 | Tungi yakka qaror qaydi o'zgartirilmaydi (F5) | `EP-NTF-045` | **EP-NTF-036** |

Shu sababli bu ikki bandda (`EP-NTF-045`, `EP-NTF-069`) QISM A xoch-havolasi **berilmadi** va o'rniga ⚠️ ZIDDIYAT yozildi. Boshqa 48 QISM A qatorining Izoh-kodlari mavzuga mos.

### §2 — `decisions/18-notifications.md` Xulosa-jadvalining tekshiruvi

`decisions` fayli o'zining sarlavhasida "✅ **18** / 🔵 **64**" deydi va oxirida aynan qaysi 18 ta band ✅ ekanini sanaydi. **Band-ma-band qayta sanaldi — farq YO'Q:**

| Tekshiruv | Natija |
|---|---|
| `grep -c "^### EP-NTF-"` (decisions) | **82** ✔ |
| ✅ JAVOBLANGAN (band-ma-band) | **18** ✔ — 001, 003, 007, 015, 019 (v1: 5) + 031, 033, 034, 035, 036, 039, 040, 042, 059, 063, 066, 077, 079 (v2: 13) |
| 🔵 OCHIQ (A-default) | **64** ✔ |

Ya'ni bu modulda `decisions` ning o'z Xulosasi **to'g'ri** (boshqa modullardan farqli o'laroq).

### §3 — Manbalar orasidagi ziddiyatlar (17 ta)

| Band | Ziddiyat qisqacha | Kim to'g'ri |
|---|---|---|
| EP-NTF-001 | "3 komanda bor" (QISM C) vs "3 komanda bor, lekin chaqirilmaydi" (Item 51) | **Item 51** |
| EP-NTF-003 | "jadval count=0" (QISM C) vs "jadval+CRUD+cron wired" (QISM D #9) | **Item 53** (ikkovi turli obyekt) |
| EP-NTF-005 | "2 cron" (QISM C) vs "4 cron" (jonli kod) | **Item 55** |
| EP-NTF-009 | "`org_nodes` jonli" (QISM C) vs "`org_nodes` mavjud emas" (Item 59) | **Item 59** (kanonik = `org_departments`) |
| EP-NTF-018 | "quiet-hours jadval yo'q" (QISM C) vs "ustun bor, o'quvchi yo'q" (Item 68) | **Item 68** |
| EP-NTF-023 | "`telegram_id` UNIQUE + deep-link bor" (QISM C) vs "UNIQUE yo'q, deep-link yo'q, 0 qator" (Item 73) | **Item 73** (DB-dan) |
| EP-NTF-029 | "hardcoded direktorga" (QISM C) vs "config-driven, ma'lumot faqat direktor" (Item 79) | **Item 79** |
| EP-NTF-038 | "`sender_id` yo'q" (QISM C **va** Item 88) vs jonli kod | **ikkalasi ham eskirgan** (`978ae170`) |
| EP-NTF-043 | vizyon `defect_type_code` deydi; jonli `defect_catalog` (23 qator) boshqa nom | ulash `defect_catalog` ga |
| EP-NTF-045 | QISM A #45 Izoh-kodi noto'g'ri (→ EP-NTF-036) | **§1** |
| EP-NTF-046 | "`mes_shift_schedules` dan dinamik" (QISM A #36) vs "jadval umuman yo'q" (Item 96) | **Item 96** |
| EP-NTF-047 | "trigger yo'q" (QISM C) vs "stock-alert cron bor" (QISM D #22) vs "`pos_inventory` ustida, pull" (Item 97) | **Item 97** |
| EP-NTF-053 | "SD `TtValidationService` tekshiradi" (QISM A #42) vs "umuman yo'q" (Item 103) | **Item 103** |
| EP-NTF-069 | QISM A #33 Izoh-kodi noto'g'ri (→ EP-NTF-052/066) | **§1** |
| EP-NTF-072 | EP-NTF-035 bilan **dublikat mexanizm** (`call.log`) — ikki band, bitta ish | — |
| EP-NTF-074 | "count=0" (QISM C) vs "jadval umuman yo'q" (Item 124) vs "jadval yaratildi" (`ba46a088`) | **Δ 2026-08-07** |
| EP-NTF-079 | "`notification_schedules` count=0" (QISM C) vs "1 qator" (Item 129) | **Item 129** |

### §4 — ⭐ Hozir ochiq turgan 2 ta tuzilmaviy bo'shliq (2026-08-07 live tasdiq)

1. **"Yozildi, o'qilmaydi" jadvallar.** `ba46a088` (2026-08-03) `alert_thresholds` va `kanban_column_sla` jadvallarini **default qatorlar bilan** yaratdi, lekin **hech qanday kod ularni o'qimaydi**. Live grep (`apps/api/src` + `artifacts/erp-dashboard/src` + `lib`):
   - `alert_thresholds` → 4 fayl, hammasi DDL/sxema (`common/database/ddl-migrations.ts`, `migrations/alert-thresholds-2026-08-03.sql`, `migrations/business-settings-s1-keys-2026-07-11.sql`, `schema-business-a-1.ts`).
   - `kanban_column_sla` → 4 fayl, hammasi DDL/sxema (`shared/db/index.ts` barrel, `migrations/kanban-column-sla-2026-08-03.sql`, `migrations/business-settings-s1-keys-2026-07-11.sql`, `schema-kanban.ts`).
   → **Service / controller / cron / FE ekran yo'q.** Ta'sir qilgan bandlar: **EP-NTF-006, EP-NTF-007, EP-NTF-074**. Egasi chegarani ERP ichidan sozlay olmaydi (ERP tashqarisida ish YO'Q qoidasini buzadi).

2. **`POST /api/notifications` ni chaqiradigan FE ekran yo'q.** `2f3cd392` endpointning `uuid`-vs-`integer` darvozasini tuzatdi (avval **har qanday chaqiruv 400** qaytarardi). Lekin live grep (`artifacts/erp-dashboard/src`) faqat quyidagilarni topdi: `GET /api/notifications/my`, `GET /api/notifications/my/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/my/mark-all-read`, `GET|PATCH /api/notifications/preferences` (`DesignNotifications.tsx`, `NotificationCenter.tsx`, `NotificationSettings.tsx`). **Bironta ekran bildirishnoma yaratmaydi** — endpoint faqat server-ichki/integratsiya foydalanuvchisiga ochiq. Ta'sir qilgan band: **EP-NTF-027**.
