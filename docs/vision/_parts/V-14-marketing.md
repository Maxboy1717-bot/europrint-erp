## [V/VERIFY] Marketing (14) — cross-ref hal qilindi

> Metod: `apps/api/src/modules/marketing/**`, `apps/api/src/modules/crm/**`, `sd/**`, `lib/db` schema jonli kod trace (read-only). Marketing modul = CRUD-og'ir (campaigns/leads/NPS/ROI/content/social/exhibitions/PR/blog/budget/calendar/competitors/A-B/inbox/settings), lekin vizyonning ilg'or avtomatikasi (aging cron, round-robin, attribution model, dedup-merge, budget-gate escalation, business-hour SLA, seasonal→PP, win-back cron va h.k.) ko'pincha YO'Q.

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 2 | Telefon +998 normalizatsiya + dublikat merge + boshliq tasdiq | cross-ref kerak | **Qisman** | Umumiy `phone-number.vo.ts` VO bor (`apps/api/src/modules/shared/domain/value-objects/phone-number.vo.ts`) lekin lid kiritishga ULANMAGAN — `leads.repository.ts:56` xom `phone` INSERT qiladi; normalize/dedup/merge/tasdiq oqimi yo'q |
| 4 | Byudjet tugaganda soft-warning + kampaniya "tasdiq kerak" + 24s eskalatsiya | cross-ref kerak | **Yo'q** | Faqat byudjet CRUD (`marketing-group2.controller.ts:149-197`, `marketing_budget_items`). grep `escalat|budget.*gate` marketing modulda = yo'q; gate/warning/eskalatsiya yo'q |
| 5 | Inbox SLA faqat ish soatlarida | cross-ref kerak | **Yo'q** | Inbox = `social_conversations`/`social_messages` CRUD (`marketing-analytics-stubs.controller.ts:319-393`); grep `SLA|business-hour|ish-soat` marketing = 0. SLA hisobi umuman yo'q |
| 6 | Bir telefon 2 kanal = merge; multi-touch (last-touch asosiy, first qayd) | cross-ref kerak | **Yo'q** | Channel-ROI faqat `marketing_leads.source` bitta manba bo'yicha (`marketing-ext.service.ts:77-153`). Merge/multi-touch attribution modeli yo'q |
| 7 | NPS aktiv QC reklamatsiyada keyinga suriladi, yopilgach avto | cross-ref kerak | **Qisman** | NPS avto-trigger REAL: `nps-auto-request.listener.ts:18` (`delivery.completed`→`nps_requests` pending), lekin QC-reklamatsiya gate/defer logikasi YO'Q — har delivery'da so'rov yaratiladi |
| 8 | Dizayn bosqichga o'tganda marketing→dizayn Kanban avto-task; rad→matn | cross-ref kerak | **Yo'q** | grep marketing modulda `design.*task|kanban.*creat` = 0. Marketing→dizayn kanban avtomatikasi yo'q (mavjud design-lab listenerlar PP→dizayn) |
| 9 | GL "reklama xarajati" sub-kod (marketing+bosh hisobchi, owner-gate) | cross-ref kerak | **Yo'q** (owner-DATA) | Marketing modulda GL sub-kod konfiguratsiya yo'q; owner-DATA qarori (main-doc Step-3 bilan mos) |
| 10 | Offline lidlar lokal saqlash + sync + dedup | cross-ref kerak | **Yo'q** | BE marketingda offline-store/sync yo'q; `leads.service.ts` faqat oddiy create. grep offline/sync = 0 |
| 11 | "Ritm" birinchi 3 buyurtmadan keyin, sozlanadigan N | cross-ref kerak | **Yo'q** | grep `ritm|rhythm` marketing = faqat budget-so'z fayllar; ritm hisobi/N-sozlama yo'q |
| 12 | "Kichiklashgan buyurtma" signali faqat pul qiymati kamayganda | cross-ref kerak | **Yo'q** | Bunday signal/alert marketingda yo'q (grep 0) |
| 13 | ROI 90-kun oynada 2 kampaniya → oxirgisiga to'liq kredit | cross-ref kerak | **Yo'q** | `marketing-roi.service.ts` per-channel ROI hisoblaydi, lekin 90-kun oyna atribusiya qoidasi yo'q |
| 14 | Namuna materiali yetmasa "material kutilmoqda" + MM avto-signal | cross-ref kerak | **Yo'q** | Marketingda namuna/MM-signal oqimi yo'q (grep 0) |
| 15 | Sodiqlik toifa tushishi faqat yangi buyurtmalarga | cross-ref kerak | **Yo'q** | grep `loyalty|sodiqlik` marketingda toifa-o'zgarish logikasi = yo'q |
| 17 | Raqobatchi kartaga 3 oyda "yangilash" Kanban; 90+ kun "eskirgan" filtr | cross-ref kerak | **Yo'q** | `getCompetitors` = `sd_customer_competitors` GROUP-BY read-view (`marketing-group2.controller.ts:272`); cron-task va eskirish-filtri YO'Q |
| 18 | Bitrix "Aktivlik" alohida `crm_activities` jadvaliga (comment emas) | cross-ref kerak | **Qisman** | `crm_activities` jadval + to'liq CRUD REAL (`crm/application/crm-activities.service.ts`, `crm/infrastructure/repositories/crm-activities.repository.ts`); ammo Bitrix import mapping topilmadi |
| 20 | Promo-kod 1 mijoz/1 kampaniya default, boshliq sozlaydi | cross-ref kerak | **Yo'q** | Marketingda promo-kod entity/limit yo'q (grep `promo` = faqat budget-so'z) |
| 21 | Mavsumiy talab kalendari → PP/MPS "orientir" signal | cross-ref kerak | **Yo'q** | Marketingda seasonal-calendar→PP signal yo'q (grep `seasonal` = 0 real logika) |
| 22 | Lid mahsulot turi → menejer+preyskurant tavsiya, rahbar tasdiq | cross-ref kerak | **Yo'q** | grep `preyskurant/preiskurant` marketingda tavsiya-birikma yo'q |
| 23 | "Oprosny list" draft qisman saqlash + SD-transfer gate | cross-ref kerak | **Yo'q** | Marketingda oprosny-list draft/gate yo'q (grep `oprosny/questionnaire` marketing = 0) |
| 24 | Egaga "5 raqam" hisoboti (EP-MKT-116) Director dashboard widget | cross-ref kerak | **Yo'q** | Marketing dashboard/stats bor (`marketing-content.controller.ts:40`) lekin alohida EP-MKT-116 "5-raqam" widget topilmadi |
| 25 | Noto'g'ri spam qo'lda tiklanadi ("spam emas"), AI faqat warn | cross-ref kerak | **Yo'q** | grep `spam` marketing = 0; spam-filtr/tiklash oqimi yo'q |
| 26 | Tavsiya bonusi CRM kartaga, to'lov Finance (Payroll emas) | cross-ref kerak | **Yo'q** | Marketingda referral-bonus modeli yo'q; alohida chiqim oqimi topilmadi |
| 27 | QC muammosida mijozga umumiy "kechikishi mumkin", menejerga to'liq | cross-ref kerak | **Yo'q** | QC→marketing ikki-xil xabar (tashqi/ichki) oqimi yo'q (grep 0) |
| 28 | "Bo'sh davr aksiyasi" ega+savdo boshlig' Kanban tasdiq, 48s timeout | cross-ref kerak | **Yo'q** | Bunday kampaniya-tasdiq Kanban/timeout marketingda yo'q |
| 29 | Mijoz ABC har buyurtma yopilganda real-time qayta hisob; A→B tavsiya | cross-ref kerak | **Qisman** | `sd/application/customer-abc.service.ts:86 recompute()` MAVJUD, lekin faqat qo'lda endpoint (`sd-customers.controller.ts`) — buyurtma-yopilish listeneri YO'Q (real-time emas); marketing-tomon A→B tavsiya yo'q |
| 30 | Diler AR balansi field-RBAC (faqat moliya+marketing boshliq) | cross-ref kerak | **Yo'q** | Marketingda AR uchun field-level RBAC yo'q; controller darajali `@Roles` bor, ammo maydon-darajali maxfiylik yo'q |
| 31 | Ko'rgazma follow-up 48s HR ish-kunlari kalendari bo'yicha | cross-ref kerak | **Yo'q** | Exhibitions CRUD bor (`marketing-analytics-stubs.controller.ts:427`) lekin follow-up SLA + HR ish-kun kalendari integratsiya yo'q |
| 32 | Lid to'lov intizomi Finance AR'dan kunlik cron, 48s eslatma | cross-ref kerak | **Yo'q** | AR→marketing kunlik sync cron yo'q (grep marketing cron = faqat NPS listener) |
| 33 | ROI foyda formulasi Finance FIFO tannarxdan (eng so'nggi) | cross-ref kerak | **Qisman** | Profit-asosli ROI engine bor (`marketing-roi.service.ts:151`) lekin `revenue`=tayyor kirish; Finance FIFO tannarx feed'i ULANMAGAN |
| 34 | Upsell AI tavsiya real-time har buyurtma yopilganda, 90-kun TTL | cross-ref kerak | **Yo'q** | Marketingda real-time upsell + 90-kun TTL yo'q (CRM/AI'da `upsell` havolalar bor, ammo bu buyurtma-yopilish+TTL oqimi emas) |
| 35 | Ijtimoiy statistika webhook real-time sync + 15daq retry | cross-ref kerak | **Qisman** | `social_api_configs` jadval + telegram webhook setup bor (`marketing-analytics-stubs.controller.ts:677`), lekin real-time sync + retry + "qo'lda yangilash" belgisi YO'Q |
| 36 | Mijoz yillik forecast → PP/MPS "orientir", ±30% alert | cross-ref kerak | **Yo'q** | Marketingda mijoz-forecast→PP orientir signali yo'q (forecast = ai/forecast, SD-tomon) |
| 38 | LMS darslik tugalanmasa HR signal + Payroll gate (LMS→HR event) | cross-ref kerak | **Yo'q** | LMS→HR payroll-gate event zanjiri topilmadi (LMS exam→razryad boshqa oqim); grep 0 |
| 39 | "Takror qil"da eski texkarta narxi o'rniga joriy narx, seller draft tasdiq | cross-ref kerak | **Qisman** | SD-tomon RepeatOrderDialog mavjud (main-doc note), lekin yangi-narx avto-almashuv + draft-tasdiq logikasi marketing scope'da tasdiqlanmadi — cross-module SD |
| 41 | Yangi Pantone kodi → dizaynga avto-bildirishnoma + impact | cross-ref kerak | **Yo'q** | grep `pantone` butun `apps/api/src/modules` = 0 fayl. Yo'q |
| 42 | Menejer ogohlantirishni ko'rib davom etsa audit-log (7 yil) | cross-ref kerak | **Yo'q** | Marketing controllerlarda `AuditInterceptor` bor, ammo "lid ogohlantirish override" tizimi yo'q (ogohlantirishning o'zi yo'q) |
| 43 | Diler faqat marketing xodimi nomidan, "manba: diler" maydoni | cross-ref kerak | **Qisman** | Lidda erkin `source` maydoni bor (`leads.repository.ts:58` `source`) — 'diler' qiymatini saqlay oladi, ammo maxsus diler-manba enum/handling yo'q |
| 44 | Mahsulot rentabelligi field-RBAC + CSV eksportda foyda yashirin | cross-ref kerak | **Yo'q** | Marketingda mahsulot-rentabellik field-RBAC yoki CSV-eksport filtri yo'q |
| 45 | Ko'rgazma komandirovka xarajati HR'dan → ROI avto (EP-MKT-115) | cross-ref kerak | **Yo'q** | Exhibitions'da `budget` maydoni bor, ammo HR travel-xarajat→ROI avto-ulanish yo'q |
| 46 | 3 oy buyurtmasiz mijozga win-back avto-start + SD aktiv lid tekshiruv | cross-ref kerak | **Yo'q** | Win-back cron + SD-lid tekshiruvi yo'q; grep matches = SD/CRM RFM/churn analitika (`crm/analytics/churn.service.ts`), win-back kampaniya emas |
| 47 | "Yangi mahsulot turi talabi" oylik 6-dept; 10+ so'rovda darhol notif | cross-ref kerak | **Yo'q** | Bunday statistika+trigger→Rivojlanish (6-dept) marketingda yo'q |
| 48 | Kontakt o'zgarish Kanban vazifasi joriy menejerga, 48s | cross-ref kerak | **Yo'q** | Kontakt-o'zgarish Kanban avto-task yo'q (grep marketing kanban = 0) |
| 50 | Telegram bot webhook ishlamasa polling fallback + xato notif | cross-ref kerak | **Yo'q** | `setupTelegramWebhook` bor (`marketing-analytics-stubs.controller.ts:677`), lekin webhook→polling fallback logikasi YO'Q (mavjud gatewaylar = websocket) |

### Yakuniy: 43 cross-ref hal qilindi → 0 Ha, 8 Qisman, 35 Yo'q, 0 data-check
- **Qisman (8):** #2 (phone VO unwired), #7 (NPS auto-trigger bor, QC-gate yo'q), #18 (crm_activities jadval real, Bitrix mapping yo'q), #29 (SD ABC recompute on-demand, real-time emas), #33 (ROI engine bor, FIFO feed yo'q), #35 (social_api_configs+webhook setup, sync/retry yo'q), #39 (SD RepeatOrderDialog cross-module), #43 (source maydoni bor, diler-enum yo'q).
- **Yo'q (35):** vizyonning ilg'or avtomatikasi (aging/round-robin/attribution/dedup-merge/budget-gate/SLA/seasonal→PP/win-back/pantone/upsell-TTL/LMS-payroll-gate va h.k.) marketing modulda qurilmagan.
