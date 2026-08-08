# Marketing — Yagona Vizyon Registri (EP-MKT) — 2026-08-07

> **Manbalar:** `decisions/14-marketing.md` (118 qaror) · `FULL-ITEM-LEVEL [Module-14]` (99 item) · `FULL-VISION-EXTRACTION` QISM A (Marketing 50 qaror, 1040-1112) / QISM C (TASDIQ-2146 §14, 99 qator, 3955-4108) / QISM D (V/VERIFY cross-ref, 43 qator, 5522-5575) · `vision-1000-answers/14-marketing.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida marketing kodiga tegan **9 commit** qayta tekshirildi va tegishli bandlarda `Δ` qatorida belgilandi (jonli kodda spot-verify qilindi).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-MKT-001..118)** | **118** |
| **Qaror holati:** ✅ javoblangan | 97 |
| **Qaror holati:** 🔵 ochiq | 21 |
| **Qurilish:** Ha | 16 |
| **Qurilish:** Qisman | 51 |
| **Qurilish:** Yo'q | 44 |
| **Qurilish:** STALE-DOC | 7 |
| 2026-07-11 dan beri o'zgargan (Δ) | 18 EP + 2 VR = **20** |
| ⚠️ Manbalar orasida ziddiyat | 15 band *(III QISM §3.5 da 14 qatorga guruhlangan)* |
| **II QISM — EP-kodsiz band (VR-MKT-I01..I14)** | **14** |

> **⚠️ Eslatma (Qoida 7 — manba Xulosasi XATO):** `decisions/14-marketing.md` ning o'z Xulosasi "**JAVOBLANGAN 92 / OCHIQ 26**" deydi va fayl oxiri ham "DONE: Marketing — 118 (javoblangan 92, ochiq 26)". **Band-ma-band sanadim:** `awk` bilan har `### EP-MKT-NNN` ostidagi `- **Holat:**` qatorini yig'ib → **97 ✅ + 21 🔵 = 118**. Manba Xulosasidagi ro'yxat ham noto'g'ri: u `EP-MKT-115` ni OCHIQ deb ko'rsatadi, lekin bandning o'zi ✅ JAVOBLANGAN (OCHIQ bo'lgani `EP-MKT-116`). Registrda **band-ma-band sanoq** ishlatildi.
>
> Haqiqiy 21 ta 🔵 OCHIQ: `003 · 031 · 032 · 044 · 045 · 047 · 048 · 049 · 050 · 051 · 055 · 056 · 062 · 063 · 071 · 077 · 079 · 083 · 088 · 091 · 116`.

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-MKT-042 (promo-kod) qaror bo'yicha ✅ JAVOBLANGAN edi va qurilish bo'yicha 2026-07-11 auditida **Yo'q** ("promo jadval yo'q, grep=0"), lekin o'sha kunning o'zida `cd412d3a` bilan to'liq CRUD qurildi → endi **Qisman**. Teskarisi ham bor: EP-MKT-047 (lid taqsimlash qoidasi) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi ustuvorlikni tasdiqlamagan), lekin qurilish bo'yicha **STALE-DOC** — `pickNextSalesManager()` round-robin jonli kodda ishlaydi.

> **⭐ Eslatma (2026-07-10 "ko'r nuqta" — 3 servis):** FULL-ITEM-LEVEL (2026-07-11) uchta narsani "Yo'q" deb belgilagan, lekin ular **audit kunidan bir kun oldin** qurilgan va jonli kodda ishlaydi. Sabab — auditor grep naqshlari mos kelmagan (`ritm\b` "rhythm" ni topmaydi; `shrink|kichiklash` "order-trend" ni topmaydi):
> - `application/order-trend.service.ts` + `GET marketing/analytics/order-trend` — `8832a34d` (2026-07-10) → Item 12/55/63, **EP-MKT-085**
> - `application/customer-rhythm.service.ts` + `GET marketing/customers/:id/rhythm` — `c8b2efd9` (2026-07-10) → Item 11/54/62, **EP-MKT-084**
> - `application/manager-kpi.service.ts` + `GET marketing/managers/kpi` — `2d2d4659` (2026-07-10) → Item 19/90, **EP-MKT-077 / EP-MKT-112**

> **Eslatma (raqamlash siljishi — III QISMda to'liq):** `FULL-ITEM-LEVEL [Module-14]` da **99** item, EP-kod esa **118**. Item ≠ EP: Item 1..50 = `vision-1000-answers` #1..#50 (EP-kodsiz, mavzu bo'yicha ulanadi), Item 51..99 = `TASDIQ-2146 §14` #51..#99 (ko'pchiligi sarlavhada EP-kodni o'zi ko'rsatadi). Qolgan **EP-MKT-001..080** ga to'g'ri keladigan item YO'Q — ular uchun `EXTRACTION QISM C §14 #N` (offset −30) manba sifatida ishlatildi.

---

## I QISM — EP-kodli qarorlar (EP-MKT-001..118)

### EP-MKT-001 · Lid (mijoz nomzodi) yagona ro'yxati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — barcha kanaldan kelgan lid avtomatik bitta ro'yxatga. Oltin-ip lead'dan boshlanadi; ShVB GSD "Yangi leads soni — haftalik"; mavjud `marketing/leads` + `MarketingLeads.tsx`. Kitob "egasiz lid = o'lik lid" — yagona ro'yxat + egalik shart.
- **Manba:** ShVB YO'NALISH 25 (leadsCount/newLeads) + mavjud leads kod + master reja oltin-ip + v1-A
- **Dalil (kod):** `marketing/leads/leads.service.ts` + `leads.repository.ts` real CRUD; `crm_leads` jonli (3 qator `crm_activities`). Ammo `STATUS-BOARD: Two-Worlds A13 Leads` — **`crm_leads` va `marketing_leads` ikki jadval** (QUEUED-NOT-STARTED), ya'ni "yagona ro'yxat" ikkiga bo'lingan.
- **Nima yetishmaydi:** ikki-dunyo (crm_leads ╳ marketing_leads) birlashtirilmagan; kanal-bo'yicha avtomatik oqim (webhook/UTM) ulanmagan → "barcha kanaldan avtomatik" qismi qo'lda.
- **Bog'liqlik:** EP-MKT-046 (dublikat), EP-MKT-062 (inbox), EP-MKT-079 (UTM)
- **action:** CREATE
- **⤳ Ta'sir:** SD (lead→buyurtma), CRM (mijoz kartasi), Director dashboard
- **Xoch-havolalar:** `[Module-14] Item 2` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #16` · `EXTRACTION QISM D #2`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-002 · 4 ta lid kanali (SMM / reklama / tavsiya / ko'rgazma)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — har kanal alohida belgilanadi + statistika. ShVB MarketingDashboard "Kanal bo'yicha taqsimot (SMM, reklama, tavsiya)" — bu 4 kanal aynan ShVB reglamentidan. Ko'rgazma = zavodning eng kuchli B2B kanali (kitob).
- **Manba:** ShVB YO'NALISH 25 (kanal taqsimoti SMM/reklama/tavsiya) + kitob (ko'rgazma B2B kuchli) + v1-A
- **Dalil (kod):** `marketing-roi.constants.ts` → `MKT_CHANNELS` 8 kanal + `OTHER`; `leads.channel`/`leads.source` ustunlari jonli (14 qator). `getChannelRoi` real rollup.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-003 (master-data), EP-MKT-031 (to'liq ro'yxat)
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kanal ROI), CRM (lid manbasi), SD
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #1`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-003 · Kanallar ro'yxatini kim belgilaydi (master-data)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — sozlamalarda kanal ro'yxati, marketing boshlig'i o'zi qo'shadi/o'chiradi (master-data). Tamoyil tasdiq; aniq dastlabki kanal RO'YXATI (4 yoki 8 — EP-MKT-031 bilan) egasidan. `MarketingSettings.tsx` mavjud → shu yerda boshqariladi.
- **Manba:** mavjud MarketingSettings kod + v1-A (ro'yxat egasidan)
- **Dalil (kod):** `MKT_CHANNELS` = **konstanta massiv** (`marketing-roi.constants.ts`), jadval emas. Kanal CRUD endpointi yo'q; `marketing_settings` KV bor lekin kanal ro'yxati unda saqlanmaydi.
- **Nima yetishmaydi:** kanal master-data jadvali + CRUD (marketing boshlig'i qo'shadi/o'chiradi) butunlay yo'q — hardcode konstanta.
- **Bog'liqlik:** EP-MKT-002, EP-MKT-031, EP-MKT-032
- **action:** CREATE
- **⤳ Ta'sir:** butun marketing (kanal master-data), Hisobot
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #1` · `STATUS-BOARD: Magic-Numbers CRM/Marketing`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-004 · Lid bosqichlari (status oqimi / voronka)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq voronka (5-6 bosqich) + har bosqich lid soni. ShVB `conversionRate`; oltin-ip; kitob B2B voronkasi (namuna→подписной лист→mijoz). Aniq bosqich nomlari EP-MKT-049/093 da egasidan.
- **Manba:** ShVB YO'NALISH 25 (conversionRate) + kitob (namuna/подписной лист bosqichlari) + v1-A
- **Dalil (kod):** `getMarketingFunnel` + `crm_lead_stages` real; lekin `status` erkin matn — qat'iy bosqich enum yo'q. `RECONCILIATION SB0669`: **`crm_lead_stage_history` jadvali mavjud emas** — voronka tarixi saqlanmaydi.
- **Nima yetishmaydi:** bosqich nomlari egasi-data (EP-MKT-049); bosqich-tarixi (stage journey) jadvali yo'q → "har bosqichda qancha kun turdi" hisoblanmaydi.
- **Bog'liqlik:** EP-MKT-049, EP-MKT-093
- **action:** CREATE
- **⤳ Ta'sir:** SD (deal pipeline), CRM, Hisobot (voronka tahlil)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #19`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-005 · Lid → Savdo (SD) bilan ulanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik: lid yutilganda SDда mijoz kartochkasi yaratiladi. Oltin-ip uzluksiz zanjir; kitob опросный лист→тех карта zanjiri (EP-MKT-088). Bir marta kiritiladi, ikki joyda bor.
- **Manba:** master reja oltin-ip + kitob (lid→опросный лист) + v1-A
- **Dalil (kod):** `deal-won.listener.ts` — real `@OnEvent`, idempotent qo'riqchisi bilan ("Sales order already exists for deal — skipping"), `STATUS-BOARD B14 slice 10 DONE 42056eb4`. Ammo `convertLeadToCrm` (`marketing-analytics-stubs.controller.ts:286+`) **CRM ga** INSERT qiladi, SD ga emas; marketing→SD avto-trigger `emit=0`.
- **Nima yetishmaydi:** lid→SD to'g'ridan-to'g'ri avto-yaratish yo'q (faqat deal-won orqali); marketing tomonidan "topshirildi→qabul qilindi" ikki-event handshake yarim.
- **Bog'liqlik:** EP-MKT-074 (topshirish nuqtasi), EP-MKT-118 (rekvizit darvozasi)
- **action:** EVENT
- **⤳ Ta'sir:** SD (mijoz/buyurtma), CRM, Dizayn (опросный лист)
- **⚠️ ZIDDIYAT:** uch manba uch xil holat beradi — `EXTRACTION QISM C §14 #5` = **Qisman**, `QISM C §14 #44` (marketing→sotuv topshirish) = **Yo'q**, `[Module-14] Item 49` = **Ha**. Sabab: Item 49 faqat `deal-won.listener` (CRM→SD) ni tekshirgan, #44/#5 esa marketing→SD yo'nalishini. Real: **CRM→SD ishlaydi, marketing→SD ishlamaydi**.
- **Xoch-havolalar:** `[Module-14] Item 49` · `EXTRACTION QISM C §14 #5/#44` · `EXTRACTION QISM A #49`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-006 · Kampaniya kartochkasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq kartochka (byudjet + muddat + maqsad + bog'langan lidlar + natija). Mavjud `marketing/campaigns` CQRS slice (aggregate/create/update/launch/status-enum) + `MarketingCampaigns.tsx`. ShVB `campaignEfficiency`.
- **Manba:** mavjud campaigns CQRS kod + ShVB YO'NALISH 25 (campaignEfficiency) + v1-A
- **Dalil (kod):** `campaigns` jadvali 16 ustun, CRUD real (`marketing.controller.ts:51 @Controller('marketing/campaigns')`); `campaign.aggregate` + `launch-campaign.handler`. `owner` = `created_by`, "kutilgan lid" maydoni **YO'Q**. **Δ:** `56489f4d` — bu controller `5f26a02b` rol-fiksiga kirmay qolgan edi; endi `@Roles(...SUPER_ADMIN, DIRECTOR, SALES_MANAGER, MANAGER)` 5 endpointda (jonli kodda tasdiqlandi).
- **Nima yetishmaydi:** mas'ul (owner) alohida maydon emas; "kutilgan lid" (reja) maydoni yo'q → reja-fakt taqqoslash yarim (EP-MKT-041). `DELETE :id` hamon faqat `SUPER_ADMIN, DIRECTOR` — real `manager` kampaniyani o'chira olmaydi.
- **Bog'liqlik:** EP-MKT-036, EP-MKT-041
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (byudjet), Hisobot (kampaniya foydasi)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #6`
- **Δ 2026-07-11→08-07:** `56489f4d` (2026-08-07) — Campaigns controller `sales_manager` talab qilardi, real `manager` kampaniyalar ro'yxatini ham ocha olmasdi; 5 endpointga `Role.MANAGER` qo'shildi. `DELETE` ataylab qoldirildi.

### EP-MKT-007 · Kampaniya ROI (foyda qaytishi) hisobi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik ROI (xarajat Moliyadan, savdo SDдан). ShVB `marketingRoi` GSD; MarketingDashboard "Marketing ROI grafigi". Formula tafsiloti (foyda yoki aylanma) EP-MKT-051 da.
- **Manba:** ShVB YO'NALISH 25 (marketingRoi grafigi) + v1-A
- **Dalil (kod):** `marketing-roi.service.ts:137` — foyda-asosli ROI real (`profitAbsolute = revenue - spend`, 171-satr). `getChannelRoi` real rollup.
- **Nima yetishmaydi:** `revenue` tayyor kirish sifatida keladi — Moliya FIFO tannarx feed'i **ULANMAGAN** (Item 33); "foyda" aslida `daromad − marketing xarajati`, COGS chegirilmagan.
- **Bog'liqlik:** EP-MKT-051 (formula), EP-MKT-024 (xarajat manbasi)
- **action:** AI
- **⤳ Ta'sir:** Moliya (xarajat/foyda), SD (savdo), Hisobot
- **Xoch-havolalar:** `[Module-14] Item 33` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #21` · `EXTRACTION QISM D #33`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-008 · Cost-per-lead (bitta lid narxi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — avtomatik CPL (kanal xarajati / lid soni) har kanal uchun. ShVB `costPerLead` GSD bevosita.
- **Manba:** ShVB YO'NALISH 25 (costPerLead) + v1-A
- **Dalil (kod):** `marketing-roi.service.ts` — `CPL = spend / leads`; `getChannelRoi` real per-kanal rollup (QISM C §14 #22 = **Ha**).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-052, EP-MKT-033 (byudjet manbasi)
- **action:** AI
- **⤳ Ta'sir:** Moliya (xarajat), Hisobot (kanal arzonligi), byudjet qarori
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #22`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-009 · Marketing KPI panosi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-05 Δ)*
- **Talab:** A — to'liq KPI paneli (lid soni, konversiya %, CPL, ROI, NPS), avtomatik yangilanadi. ShVB Marketing 4-Otdelenie GSD paneli aynan shu (11 ko'rsatkich); mavjud `MarketingDashboard.tsx` + panels/sections.
- **Manba:** ShVB YO'NALISH 25 (11 KPI) + mavjud MarketingDashboard kod + v1-A
- **Dalil (kod):** `getDashboardStats` + `getMarketingOverview` real + FE `MarketingDashboard` (QISM C §14 #46 = **Ha**). **Δ:** `429f37cd` — `totalSpent` maydoni hech qachon hisoblanmagan edi (`drizzle-marketing-ext.repo.ts`), endi hisoblanadi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-076, EP-MKT-116 (egaga 5-raqam)
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, HR (KPI), butun marketing
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #46`
- **Δ 2026-07-11→08-07:** `429f37cd` (2026-08-05) — panel `totalSpent` raqami doim bo'sh chiqardi; repo'da hisoblash qo'shildi.

### EP-MKT-010 · Ko'rgazmadan lid yig'ish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — tez kiritish formasi (telefon+ism+qiziqish) ko'rgazma tugmasi bilan. Mavjud `MarketingExhibitions.tsx`; kitob — ko'rgazma B2B eng kuchli kanal, qog'oz vizitka yo'qoladi. Mobil/planshet kirish (EP-MKT-072).
- **Manba:** mavjud MarketingExhibitions kod + kitob (ko'rgazma kuchli) + v1-A
- **Dalil (kod):** `POST exhibitions/:id/leads` real INSERT + QR (`marketing-analytics-stubs.controller.ts:474`); `exhibitions` 23 ustun.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-058, EP-MKT-057
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid bazaga), Mobil ilova, SD
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #28`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-011 · Ko'rgazma natijasini o'lchash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ko'rgazma kampaniya sifatida ochiladi, xarajat + lid/savdo natijasi ulanadi (ko'rgazma ROI). Mavjud Exhibitions + campaigns; kitob "ko'rgazma qimmat — natijasini bilmasak kelasi yil qaror asossiz".
- **Manba:** mavjud Exhibitions/campaigns kod + kitob (ko'rgazma ROI) + v1-A
- **Dalil (kod):** `exhibitions` da `roi`/`lead_count`/`deal_count` ustunlari mavjud (struktura bor), lekin ularni to'ldiradigan **avto-bog'lash event YO'Q** — qo'lda kiritiladi (QISM C §14 #29 = Qisman).
- **Nima yetishmaydi:** `exhibition_leads → sotuv` zanjiri avtomatlashtirilmagan; HR komandirovka xarajati ROIga qo'shilmaydi (EP-MKT-115).
- **Bog'liqlik:** EP-MKT-059, EP-MKT-061, EP-MKT-115
- **action:** CREATE
- **⤳ Ta'sir:** Moliya, SD, Hisobot (ko'rgazma taqqos)
- **Xoch-havolalar:** `[Module-14] Item 97` · `EXTRACTION QISM C §14 #29/#97` · `[Module-14] Item 45` *(mavzu bo'yicha)*
- **Δ 2026-07-11→08-07:** —

### EP-MKT-012 · Ijtimoiy inbox (bitta joyda barcha xabar)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-13 Δ)*
- **Talab:** A — barcha tarmoq xabari bitta inboxga, javob shu yerdan. Mavjud `MarketingSocialInbox.tsx` (+ Sections/Helpers/Types) + marketing-ext; ShVB `socialReach`. Provayder ulanishi EP-MKT-062 da (OCHIQ).
- **Manba:** mavjud SocialInbox kod + ShVB (socialReach) + v1-A
- **Dalil (kod):** `social_conversations`/`social_messages` + CRUD + FE real; ammo `SELECT count(*) FROM social_conversations` → **0**, `social_api_configs` → **0** — hech qanday provayder ulanmagan. **Δ:** `b0ff014f` — inbox suhbatlari xom SQL'dagi tiplanmagan `null` parametr sababli **503** qaytarardi; tuzatildi.
- **Nima yetishmaydi:** Instagram/FB/Telegram provayder ulanishi yo'q (EP-MKT-062 = 🔵 OCHIQ, egasi qaroriga bog'liq) → inbox "arxitektura jihatdan bor, ma'lumotsiz".
- **Bog'liqlik:** EP-MKT-062, EP-MKT-064, EP-MKT-063
- **action:** READ
- **⤳ Ta'sir:** CRM (suhbatdan lid), AI integratsiya (avto-javob)
- **Xoch-havolalar:** `[Module-14] Item 99` · `EXTRACTION QISM C §14 #32/#99` · `EXTRACTION QISM D #35`
- **Δ 2026-07-11→08-07:** `b0ff014f` (2026-07-13) — inbox endpointi 503 qaytarardi; endi ochiladi (lekin jadval hamon 0 qator).

### EP-MKT-013 · Inboxdagi xabarni lidga aylantirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — suhbatdan "lid yarat" tugmasi (manba avtomatik shu kanal). Oltin-ip uzluksiz; mavjud social-inbox + leads. Xabar yo'qolmaydi, savdoga o'tadi.
- **Manba:** mavjud social-inbox/leads kod + master reja oltin-ip + v1-A
- **Dalil (kod):** jadvallar + `convert-to-crm` mavjud, lekin **"create lead from conversation" endpointi YO'Q** (QISM C §14 #34). Suhbat→lid ko'prigi qurilmagan.
- **Nima yetishmaydi:** conversation→lead endpoint + FE tugma; manba-kanalni avtomatik meros qilish.
- **Bog'liqlik:** EP-MKT-064 (aynan bir mavzu), EP-MKT-062
- **action:** CREATE
- **⤳ Ta'sir:** SD, CRM (lid kartasi)
- **Xoch-havolalar:** `[Module-14] Item 99` · `EXTRACTION QISM C §14 #34`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-014 · Inboxga javob berish vaqti nazorati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har xabarga javob vaqti o'lchanadi, kechikkanlar belgilanadi. Kitob "tez javob bergan kompaniya buyurtmani oladi"; ShVB nazorat ruhi. Aniq SLA daqiqasi EP-MKT-063 da.
- **Manba:** kitob (tez javob = buyurtma) + v1-A (SLA raqami EP-MKT-063)
- **Dalil (kod):** `grep "SLA|businessHours|ish.soat" apps/api/src/modules/marketing` → **0 mos**. `getInboxStats` bor, lekin SLA hisobi/signal logikasi yo'q.
- **Nima yetishmaydi:** SLA taymer + kechikkan belgisi butunlay yo'q; ish-soati kalendari ham yo'q (Item 5).
- **Bog'liqlik:** EP-MKT-063 (daqiqa — 🔵 OCHIQ), EP-MKT-012
- **action:** EVENT
- **⤳ Ta'sir:** HR/KPI (javob tezligi), xizmat sifati
- **Xoch-havolalar:** `[Module-14] Item 5` · `EXTRACTION QISM C §14 #33` · `EXTRACTION QISM D #5`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-015 · NPS (mijoz sadoqati) so'rovi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-13 Δ)*
- **Talab:** A — buyurtma yopilgach NPS so'rovi avtomatik (0-10) + ball saqlanadi. Memory (NPS real DB done); mavjud marketing-ext; ShVB `customerRetention` ruhi. Brak tarixi bilan bog'lash EP-MKT-105 da.
- **Manba:** memory (NPS real DB) + mavjud marketing-ext kod + v1-A
- **Dalil (kod):** `nps-auto-request.listener.ts:18` — real `@OnEvent(ERP_EVENTS.DELIVERY_COMPLETED)` ("Modul 14 (Marketing) — NPS avto-yig'ish (14.60)"), `marketing.module.ts:66` da ro'yxatdan o'tgan; `nps_responses` 9 qator jonli; `nps-requests.controller.ts` (`GET`, `POST :id/responded`). **Δ:** `8fd71616` — NPS/Churn ro'yxati yaratilgan yozuvlarni **hech qachon ko'rsatmasdi**; tuzatildi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-082 (aynan bir mavzu), EP-MKT-016, EP-MKT-099
- **action:** EVENT
- **⤳ Ta'sir:** SD (mijoz mamnuniyati), Sifat (shikoyat), CRM
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #52` "avto-trigger event YO'Q, qo'lda" deydi, `QISM D #7` esa "NPS avto-trigger REAL" deydi. `[Module-14] Item 52` = **STALE-DOC** (listener jonli kodda o'qib tasdiqlangan). Real holat: **avto-trigger bor**.
- **Xoch-havolalar:** `[Module-14] Item 52` · `[Module-14] Item 60` · `EXTRACTION QISM C §14 #52/#60` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** `8fd71616` (2026-07-13) — NPS/Churn ro'yxat FE'da bo'sh ko'rinardi; servis+repo tuzatildi.

### EP-MKT-016 · NPS dan keyingi harakat
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — past ball (0-6) avtomatik ogohlantirish + mas'ulga vazifa. Karta-markazli model (vazifa→mas'ul kartasi); "eng arzon mijoz saqlash usuli". Kitob brak→uzr+chegirma (EP-MKT-105).
- **Manba:** karta-model (vazifa→mas'ul) + kitob (uzr+chegirma) + v1-A
- **Dalil (kod):** NPS javobi saqlanadi, lekin **past ball → vazifa/ogohlantirish oqimi yo'q**; `grep` marketing modulda kanban/task yaratish = 0 (Item 8 dalili bilan bir xil).
- **Nima yetishmaydi:** detraktor (0-6) triggeri + mas'ul kartasiga avto-vazifa + uzr/chegirma oqimi.
- **Bog'liqlik:** EP-MKT-015, EP-MKT-099 (QC bog'lanishi)
- **action:** EVENT
- **⤳ Ta'sir:** CRM (vazifa), Bildirishnoma, Sifat
- **Xoch-havolalar:** `[Module-14] Item 7` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #77` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-017 · Blog / kontent boshqaruvi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-13 Δ)*
- **Talab:** A — to'liq (kontent ro'yxati + holati + qaysi kanalga + natija). Mavjud `MarketingContent.tsx` + marketing-content.controller; memory (blog real DB). Tasdiq oqimi EP-MKT-070 da.
- **Manba:** mavjud MarketingContent kod + memory (blog real DB) + v1-A
- **Dalil (kod):** `marketing_content` 16 ustun + CRUD real + FE (QISM C §14 #39 = **Ha**); `marketing-content.controller.ts`. **Δ:** `16be54fc` — "Blog Maqola" yaratish doim **422** qaytarardi va SEO/cover/tags maydonlarini tashlab yuborardi; `eff7b4cb` — kontent-post CREATE doim muvaffaqiyatsiz edi (`platform` yo'q, `body`/`content` DTO drift).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-069, EP-MKT-070, EP-MKT-072
- **action:** CREATE
- **⤳ Ta'sir:** tashqi sayt (europrint.uz — Q27), Dizayn (post dizayni)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #39`
- **Δ 2026-07-11→08-07:** `16be54fc` + `eff7b4cb` (2026-07-13) — blog maqola va kontent-post yaratish ikkalasi ham buzuq edi (422 / DTO drift); tuzatildi.

### EP-MKT-018 · Marketing kontent kalendari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — kalendar ko'rinishi, mas'ul va kanal belgilanadi. Mavjud `MarketingCalendar.tsx`; memory (calendar real DB).
- **Manba:** mavjud MarketingCalendar kod + memory (calendar real DB) + v1-A
- **Dalil (kod):** `calendar_events` CRUD real + FE `MarketingCalendar` (`marketing-group2.controller.ts:197`) — QISM C §14 #38 = **Ha**.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-068 (aynan bir mavzu), EP-MKT-073 (eslatma)
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (post vazifasi), Bildirishnoma (eslatma)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #38`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-019 · Kim marketingni yuritadi (rollar)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — rollar bo'yicha: marketolog (lid/inbox), boshliq (kampaniya/byudjet), direktor (hisobot). Karta-markazli RBAC; Q909 org-jadval (1-bo'linma operatsion / 6-dep strategiya). Rol-asosli kirish (CRM Q13 ruhi).
- **Manba:** karta-model RBAC + BARCHA_JAVOBLAR Q909 (org-jadval) + v1-A
- **Dalil (kod):** Controller-darajali `@Roles(...)` hamma marketing controllerlarda real. **Δ:** `5f26a02b` — 117 endpointdan **74 tasi `marketing_manager` talab qilardi, jonli bazada esa 0 real foydalanuvchi** shu rolda; 6 controllerda 69 qatorga `'manager'` qo'shildi. `56489f4d` — Campaigns controller o'sha fiksga kirmay qolgan edi.
- **Nima yetishmaydi:** rol → **karta** (org_functions) bog'lanishi yo'q — `RECONCILIATION SB0629`: `crm_leads/deals/companies/contacts` da `card_id` FK YO'Q. Maydon-darajali RBAC ham yo'q (Item 30/44).
- **Bog'liqlik:** EP-MKT-020, EP-MKT-035, EP-MKT-111
- **action:** READ
- **⤳ Ta'sir:** Org-karta (lavozim), HR (RBAC), Xavfsizlik
- **⚠️ ZIDDIYAT:** FE `artifacts/erp-dashboard/src/hooks/useAuth.tsx:15-19` da izoh "*Mirror backend ROLE_ALIASES so UI permissions consistently match server authorization*" deydi, lekin `grep -rn "ROLE_ALIASES\|roleAliases" apps/api/src` → **0 natija** — backendda bunday alias YO'Q. FE `manager → director` va `marketing → sales_manager` deb tarjima qiladi, backend esa xom rol satrini tekshiradi. Ya'ni FE ruxsat-ko'rinishi bilan BE 403 javobi bir xil emas: `marketing` rolli foydalanuvchi FE'da `sales_manager` deb hisoblanadi va `marketing_manager` gate'iga hech qachon tushmaydi.
- **Xoch-havolalar:** `— (mos item topilmadi)` · `RECONCILIATION SB0629` · `STATUS-BOARD: SoD-OrgChart Part B`
- **Δ 2026-07-11→08-07:** `5f26a02b` (2026-08-06) + `56489f4d` (2026-08-07) — `'manager'` roli marketing endpointlariga qo'shildi (403 blokirovkasi yopildi); FE↔BE alias drifti tuzatilmadi.

### EP-MKT-020 · Karta-model bilan integratsiya (kartochka markazli)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har marketing vazifasi tegishli lavozim kartochkasiga bog'lanadi (talab/razryad/ЦКП). Vizyonning yadrosi — karta-markazli model; ish kartaga biriktirilgan. "Vizyonга to'liq mos."
- **Manba:** master reja karta-markazli model (org_card_centric) + v1-A
- **Dalil (kod):** `RECONCILIATION SB0629` — `crm_leads`/`crm_deals`/`crm_companies`/`crm_contacts` da **`card_id` FK YO'Q**. `STATUS-BOARD: SoD-OrgChart Part B` = **BLOCKED-OWNER** (`head_user_id` root blocker) — Marketing/Logistics/PR/Training SoD org-chart qurilmagan.
- **Nima yetishmaydi:** karta FK butunlay yo'q; marketing vazifasi→lavozim kartasi zanjiri uzuq. Egadan `head_user_id` (kim kimni boshqaradi) ma'lumoti kutilmoqda.
- **Bog'liqlik:** EP-MKT-019, EP-MKT-035, EP-MKT-112
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (poydevor), HR (razryad/oylik), AI (karta AI)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `RECONCILIATION SB0629` · `STATUS-BOARD: SoD-OrgChart Part B`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-021 · Marketing AI yordamchisi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — AI lid/kanal/kampaniya ma'lumotini tahlil qilib tavsiya beradi. Mavjud `marketing-ai.service.ts → analyzeCampaignEfficiency()`; vizyon 70% AI-tahlil; ShVB "qaysi kanal eng samarali".
- **Manba:** mavjud marketing-ai.service + ShVB (analyzeCampaignEfficiency) + LOYIHA-BITGAN (70% AI) + v1-A
- **Dalil (kod):** `modules/ai/services/marketing-ai.service.ts` mavjud, lekin fayl ro'yxati tekshiruvi bo'yicha **faqat kontent/SEO generatsiyasi**ni qamraydi. `agents/marketing-agent.service.ts` — faqat ROI/content/segment; upsell/wallet-share AI = **0 hit**.
- **Nima yetishmaydi:** lid-skoring AI kalibrovkasi (Item 1), upsell AI (EP-MKT-098), "kichiklashgan buyurtma" AI-tahlili — agent scope'idan tashqarida. AI kaliti hamon egadan kutiladi.
- **Bog'liqlik:** EP-MKT-044, EP-MKT-098, EP-MKT-104
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, Hisobot, karta AI
- **Xoch-havolalar:** `[Module-14] Item 76` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #63/#76`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-022 · Issiq lid belgilash (lid skoring)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — belgilar bo'yicha avtomatik baholanadi (qaytib yozgan, narx so'ragan = issiq). ShVB `qualifiedLeads`; mavjud lead-scoring yo'nalishi (CRM agents). Ball-vazni EP-MKT-044 da (OCHIQ).
- **Manba:** ShVB YO'NALISH 25 (qualifiedLeads) + mavjud lead-scoring + v1-A
- **Dalil (kod):** `RECONCILIATION SB0640/652/673` "Lead-scoring INACTIVE/hardcoded, skoring UI ham yo'q" da'vosi **yolg'on**: `crm/domain/services/crm-lead-scoring.service.ts` — real 5-mezonli vaznli formula, `crm-ai-extended.service.ts:347` orqali jonli marshrutga (`@Post('leads/:entityId/scoring-v2')`, `crm-ai-extended.controller.ts:241`) ulangan; `LeadScoreBar.tsx` ham mavjud (2026-05-14). Marketing tomonda `recalc-scores` faqat 2 omil (channel+status).
- **Nima yetishmaydi:** `LeadScorerV2Service` `crm.module.ts` da ro'yxatdan o'tgan lekin **hech qayerdan chaqirilmaydi** (o'lik kod); `LeadScoreBar.tsx` faqat o'z testi tomonidan import qilinadi — hech bir sahifada emas. Oylik avto-kalibrovka + ikki-versiya + rahbar tasdig'i (Item 1) yo'q.
- **Bog'liqlik:** EP-MKT-043, EP-MKT-044 (🔵 vazn), EP-MKT-074
- **action:** AI
- **⤳ Ta'sir:** SD (lid navbati), Hisobot (sifatli lid ulushi)
- **⚠️ ZIDDIYAT:** `RECONCILIATION SB0640/652/673` "hardcoded mock + UI yo'q" deydi; `[Module-14] Item 1` bu da'voni jonli kodda **rad etadi** (STALE-DOC). Registrda Item 1 ning tekshirilgan xulosasi olindi.
- **Xoch-havolalar:** `[Module-14] Item 1` · `EXTRACTION QISM C §14 #13/#14` · `EXTRACTION QISM A #1`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-023 · Tavsiya kanalini kuzatish (kim tavsiya qildi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har tavsiya lidida "tavsiya qilgan mijoz/odam" yoziladi + kim ko'p olib kelgani. Kitob "karton bozorida tavsiya = eng ishonchli kanal". Bonus mexanizmi EP-MKT-117 da.
- **Manba:** kitob (tavsiya kuchli kanal) + v1-A
- **Dalil (kod):** `information_schema.columns` tekshiruvi — hech bir lid/mijoz jadvalida **`referrer` ustuni YO'Q**. `employee_referrals` = HR (xodim yollash), mijoz tavsiyasi emas.
- **Nima yetishmaydi:** `referrer` ustuni + tavsiya zanjiri (kim kimni keltirdi) + eng ko'p keltirganlar reytingi.
- **Bog'liqlik:** EP-MKT-117 (bonus qoidasi), EP-MKT-031 (kanal ro'yxati)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (tavsiya zanjiri), SD, Moliya (rag'bat)
- **Xoch-havolalar:** `[Module-14] Item 95` · `[Module-14] Item 26` · `EXTRACTION QISM C §14 #95`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-024 · Reklama xarajatini Moliya bilan ulash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — marketing xarajati Moliyadagi haqiqiy to'lovlardan avtomatik. ShVB `marketingBudgetUsed/Remain`; ROI/CPL to'g'ri bo'lishi uchun haqiqiy raqam shart. Zavod realiga mos moddalar EP-MKT-115 da.
- **Manba:** ShVB YO'NALISH 25 (budgetUsed/Remain) + v1-A
- **Dalil (kod):** `SELECT account_code,account_name FROM accounts WHERE account_name ILIKE '%reklama%' OR '%marketing%'` → **aynan 1 qator**: `9200 — "Sotuv xarajatlari (logistika, marketing)"` — umumiy birlashgan hisob, alohida "reklama xarajati" sub-kodi yo'q. Marketing byudjeti (`marketing_budget_lines`) GL bilan **ulanmagan**.
- **Nima yetishmaydi:** GL sub-kod (9200 ostida) + marketing byudjet↔GL to'lov avtomatik ulanishi. **Egadan ma'lumot kutiladi:** yangi GL sub-kodi Chart of Accounts o'zgarishi → owner ruxsati shart (`vision-1000-answers #9`).
- **Bog'liqlik:** EP-MKT-033, EP-MKT-034, EP-MKT-115
- **action:** EVENT
- **⤳ Ta'sir:** Moliya (xarajat moddasi), ROI/CPL hisobi
- **Xoch-havolalar:** `[Module-14] Item 9` · `EXTRACTION QISM A #9` · `EXTRACTION QISM D #9`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-025 · Lid manbasi → mijoz umrbod qiymati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har kanal bo'yicha kelgan mijozlarning umumiy savdosi (LTV manbasi). CRM RFM/CLV kod bor (EP-CRM-019); kitob — yirik takroriy mijoz (Benazir) kanalga bog'lanadi. LTV/CAC EP-MKT-054 da.
- **Manba:** CRM RFM/CLV kod (EP-CRM-019) + kitob (yirik mijoz kanali) + v1-A
- **Dalil (kod):** `ChannelRoiRow.cac = spend / conversions` real; CRM `rfm.service.ts` mavjud. Ammo **LTV/CAC 12-oylik hisobi marketing modulida YO'Q** (QISM C §14 #24 = Qisman) — CRM RFM alohida turadi.
- **Nima yetishmaydi:** kanal→LTV bog'lanishi; 12-oylik takroriy sotuv oynasi; CRM RFM natijasini marketing kanal-kesimiga olib kelish.
- **Bog'liqlik:** EP-MKT-053, EP-MKT-054
- **action:** AI
- **⤳ Ta'sir:** CRM (takroriy sotuv), Moliya, SD
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #24`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-026 · Inboxda tayyor javob shablonlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tayyor javob shablonlari (narx/muddat/minimal partiya), bir tugma bilan. Mavjud social-inbox; kitob FAQ (narx/eng kam buyurtma/yetkazib berish). Tez xizmat + bir xil to'g'ri ma'lumot.
- **Manba:** mavjud social-inbox kod + kitob (FAQ savollari) + v1-A
- **Dalil (kod):** `email_templates` CRUD real, lekin **inbox FAQ-javobiga bog'lanmagan** (QISM C §14 #35 = Qisman) — suhbat oynasida "shablon qo'y" tugmasi yo'q.
- **Nima yetishmaydi:** inbox-maxsus tezkor-javob kutubxonasi + suhbatga bir tugma bilan qo'yish.
- **Bog'liqlik:** EP-MKT-065 (aynan bir mavzu), EP-MKT-062
- **action:** CREATE
- **⤳ Ta'sir:** SocialInbox, xizmat tezligi
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #35`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-027 · Marketing hisobotlari (kim ko'radi va qachon)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik oylik/haftalik hisobot direktor va boshliqqa. ShVB "haftalik marketing statistika"; kitob "har lavozim kunlik/haftalik/oylik hisobot rahbariyatga". Egaga 5-raqam EP-MKT-116 da.
- **Manba:** ShVB YO'NALISH 25 (haftalik statistika) + kitob (hisobot reglamenti) + v1-A
- **Dalil (kod):** `getDashboardStats`/`getMarketingOverview` real (so'rov asosida). `grep "@Cron" marketing` → faqat NPS listener; **avtomatik haftalik/oylik hisobot jo'natish croni YO'Q**.
- **Nima yetishmaydi:** cron + adresat (direktor/boshliq) + jo'natish kanali (bildirishnoma/Telegram). Egaga-maxsus 5-raqam widget alohida yo'q (EP-MKT-116).
- **Bog'liqlik:** EP-MKT-076, EP-MKT-116
- **action:** CRON
- **⤳ Ta'sir:** Director dashboard, 7-departament (Administratsiya)
- **Xoch-havolalar:** `[Module-14] Item 24` *(mavzu bo'yicha)* · `[Module-14] Item 94` · `EXTRACTION QISM C §14 #46/#94`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-028 · Kampaniya ko'p kanaldan birga yuritish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bitta kampaniya ostida har kanal alohida lid/xarajat bilan. ShVB kanal taqsimoti; eng aniq tahlil (qaysi kanal kuchli). Atribusiya EP-MKT-085/086 bilan.
- **Manba:** ShVB YO'NALISH 25 (kanal taqsimoti) + v1-A
- **Dalil (kod):** `leads.source` **bitta kanal** (single-touch); kampaniya↔kanal ko'p-ko'p bog'lanishi yo'q. `MKT_ATTRIBUTION_WINDOW_DAYS = 90` (`marketing-roi.constants.ts:121`) e'lon qilingan lekin `marketing-roi.service.ts` da **hech qachon ishlatilmaydi**.
- **Nima yetishmaydi:** kampaniya×kanal jadvali; kanal bo'yicha xarajat/lid taqsimoti; multi-touch atribusiya.
- **Bog'liqlik:** EP-MKT-055, EP-MKT-056, EP-MKT-032
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kanal ulushi), Moliya (xarajat taqsim)
- **Xoch-havolalar:** `[Module-14] Item 6` · `[Module-14] Item 13` · `EXTRACTION QISM C §14 #26` · `EXTRACTION QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-029 · Yo'qotilgan lid sababini saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — rad sababi ro'yxatdan tanlanadi + statistika. Kitob qisqartirish-jadval (narx/format/чиқим) real sabablarni beradi; CRM EP-CRM-020 bilan bir xil tamoyil. Sabab RO'YXATI EP-MKT-050 da (OCHIQ).
- **Manba:** kitob (qisqartirish jadval sabablari) + CRM EP-CRM-020 + v1-A
- **Dalil (kod):** `lost_reason` ustuni `leads` va `crm_leads` da real; `getLossAnalysis` real hisobot. Lekin qat'iy enum yo'q — **erkin matn**.
- **Nima yetishmaydi:** qat'iy sabab enum/seed (7-8 ta ro'yxat egasidan — EP-MKT-050 🔵); raqib nomi ustuni (EP-MKT-100).
- **Bog'liqlik:** EP-MKT-050 (🔵 ro'yxat), EP-MKT-100 (raqib nomi)
- **action:** UPDATE
- **⤳ Ta'sir:** SD (narx siyosati), Hisobot (yo'qotish tahlili)
- **Xoch-havolalar:** `[Module-14] Item 78` · `EXTRACTION QISM C §14 #20/#78`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-030 · Ko'rgazma/kampaniya material va byudjet rejasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-05 Δ)*
- **Talab:** A — kampaniyaga tayyorgarlik ro'yxati (banner/broshyura/sovg'a) + byudjet rejasi biriktiriladi. Mavjud Budget/Exhibitions; kitob "xom-ashyo to'liq bo'lmagan zakaz kiritilmaydi" ruhi (oldindan reja). Real moddalar EP-MKT-115.
- **Manba:** mavjud Budget/Exhibitions kod + kitob (oldindan to'liqlik) + v1-A
- **Dalil (kod):** `marketing_budget_lines` 12 qator CRUD real (`marketing-group2.controller.ts:149-197`); `exhibitions` 23 ustun. Ammo `SELECT DISTINCT category FROM marketing_budget_lines` → **kanal nomlari** (`email, tiktok, website, google, facebook, youtube, telegram, instagram`), material/tayyorgarlik moddalari emas. **Δ:** `429f37cd` — `totalSpent` hisoblanmasdi.
- **Nima yetishmaydi:** kampaniyaga biriktiriladigan material-tayyorgarlik ro'yxati (banner/broshyura/sovg'a) yo'q; byudjet `category` = kanal, zavod-real modda emas (EP-MKT-115).
- **Bog'liqlik:** EP-MKT-033, EP-MKT-034, EP-MKT-115
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (byudjet), Ombor (sovg'a/namuna material)
- **Xoch-havolalar:** `[Module-14] Item 93` · `EXTRACTION QISM C §14 #3/#93`
- **Δ 2026-07-11→08-07:** `429f37cd` (2026-08-05) — byudjet paneli `totalSpent` doim bo'sh edi; hisoblash qo'shildi.

### EP-MKT-031 · Marketing kanallari ro'yxati (qaysi kanallarni kuzatamiz) [v2-Q1]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — tayyor 8 kanal (Instagram, Telegram, Facebook, veb-sayt, ko'rgazma, sovuq qo'ng'iroq, tavsiya, vositachi-diler) + "boshqa". ShVB 3 kanalni (SMM/reklama/tavsiya) tasdiqlagan, B2B uchun ko'rgazma+vositachi qo'shiladi. Yakuniy ro'yxat (8 yoki 4) egasidan.
- **Manba:** ShVB (SMM/reklama/tavsiya) + kitob (ko'rgazma/vositachi B2B) + v2-A (yakuniy ro'yxat egasidan)
- **Dalil (kod):** `marketing-roi.constants.ts` → `MKT_CHANNELS` **8 kanal + OTHER**; `leads.channel`/`source` 14 qator jonli (QISM C §14 #1 = **Ha**).
- **Nima yetishmaydi:** — *(qurilish bo'yicha; qaror bo'yicha yakuniy ro'yxatni ega tasdiqlashi kerak)*
- **Bog'liqlik:** EP-MKT-002, EP-MKT-003 (master-data CRUD)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid manbasi), Hisobot (kanal ROI), SD
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #1`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-032 · Kanal ierarxiyasi (kanal + sub-manba / UTM) [v2-Q2]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ikki bosqich: kanal + sub-manba (UTM/kampaniya tegi). To'g'ri byudjet taqsimi uchun; lekin kiritish intizomi talab. UTM infratuzilma EP-MKT-079 bilan birga. Tamoyil tasdiq, joriy etish bosqichi egasidan.
- **Manba:** EP-MKT-079 (UTM) + v2-A (intizom egasidan)
- **Dalil (kod):** `campaign_id` bor; **UTM/sub-manba ustuni YO'Q**; `ads.platform` faqat kanal (QISM C §14 #2 = Qisman).
- **Nima yetishmaydi:** sub-manba ustuni + normalizatsiya; UTM parse/generatsiya (EP-MKT-079).
- **Bog'liqlik:** EP-MKT-079 (🔵 UTM), EP-MKT-003
- **action:** CREATE
- **⤳ Ta'sir:** UTM kuzatuvi, Hisobot (sub-kanal ROI)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #2/#49`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-033 · Kanal byudjeti (oylik/choraklik reja) [v2-Q3]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-05 Δ)*
- **Talab:** A — kanal × oy byudjet jadvali (reja/sarflangan/qoldiq). ShVB `marketingBudgetUsed/Remain` reja-fakt nazorati; mavjud `MarketingBudget.tsx`. Sub-savol (oshganda kim tasdiqlaydi) → A: marketing rahbari avtomatik ogohlantirish.
- **Manba:** ShVB YO'NALISH 25 (budgetUsed/Remain) + mavjud MarketingBudget kod + v2-A
- **Dalil (kod):** `budget_lines` 12 qator CRUD real; `category` jonli qiymatlari aslida **kanal nomlari** — ya'ni kanal o'lchovi de-fakto bor, lekin alohida `channel` ustuni sifatida emas. **Δ:** `429f37cd` — `totalSpent` hisoblandi.
- **Nima yetishmaydi:** kanal×oy matritsasi (hozir tekis qatorlar); byudjet oshganda ogohlantirish/eskalatsiya yo'q (Item 4 = **Yo'q**, `grep escalat|budget.*gate` = 0).
- **Bog'liqlik:** EP-MKT-034, EP-MKT-115, EP-MKT-024
- **action:** CREATE
- **⤳ Ta'sir:** Moliya/Byudjet (marketing moddasi), Hisobot (reja vs fakt)
- **Xoch-havolalar:** `[Module-14] Item 4` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #3` · `EXTRACTION QISM D #4`
- **Δ 2026-07-11→08-07:** `429f37cd` (2026-08-05) — `totalSpent` hisoblash qo'shildi; byudjet-darvozasi hamon yo'q.

### EP-MKT-034 · Byudjet valyutasi va reklama xarajat turlari [v2-Q4]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 6 xarajat turi (onlayn reklama, blogger, bosma material, ko'rgazma, namuna mahsulot, transport). Kitob — namuna quti+ko'rgazma stendi katta xarajat, "reklama"ga yashirilmasligi kerak. Zavod realiga mos modda tuzilmasi EP-MKT-115 da kengaytiriladi.
- **Manba:** kitob (namuna/ko'rgazma xarajati) + EP-MKT-115 + v2-A
- **Dalil (kod):** `budget_lines.category` = **erkin matn** (min2/max50), qat'iy 6 tur enum **YO'Q** (QISM C §14 #4 = Qisman). Jonli qiymatlar kanal nomlari.
- **Nima yetishmaydi:** 6 qat'iy tur enum/seed; valyuta maydoni tasdiqlanmadi; ko'rgazma/namuna xarajati alohida ajratilmaydi.
- **Bog'liqlik:** EP-MKT-033, EP-MKT-115 (zavod-real modda)
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (xarajat turi), ROI/CPL aniqligi
- **Xoch-havolalar:** `[Module-14] Item 93` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #4`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-035 · Kanal egasi (mas'ul xodim) [v2-Q5]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har kanalga bitta mas'ul + zaxira. Karta-markazli model (kanal→lavozim kartasi); KPI shunga bog'lanadi (EP-MKT-076). Javobgarlik aniq.
- **Manba:** karta-model RBAC + v2-A
- **Dalil (kod):** `MKT_CHANNELS` konstanta massiv — **mas'ul maydoni yo'q**, kanal jadvali ham yo'q (EP-MKT-003). Karta FK umuman yo'q (`RECONCILIATION SB0629`).
- **Nima yetishmaydi:** kanal jadvali + `owner_card_id`/`backup_card_id`; kanal natijasi→KPI bog'lanishi.
- **Bog'liqlik:** EP-MKT-003, EP-MKT-020, EP-MKT-066, EP-MKT-077
- **action:** CREATE
- **⤳ Ta'sir:** HR/KPI (kanal natijasi), Org-karta
- **⚠️ ZIDDIYAT (raqamlash):** `TASDIQ-2146 §14` ro'yxatida **#5 = EP-MKT-005** (lid→SD), ya'ni offset +30 shu joyda uziladi va **EP-MKT-035 uchun TASDIQ item umuman yo'q**. Bu registrdagi yagona "yo'qolgan" QISM C tugun (III QISMga qarang).
- **Xoch-havolalar:** `— (mos item topilmadi)` · `— (QISM C §14 da #5 o'rniga EP-MKT-005 turibdi)`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-036 · Kampaniya asosiy maydonlari [v2-Q6]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq to'plam (nomi, maqsad turi, kanal(lar), byudjet, sana, mas'ul, maqsadli mijoz turi, kutilgan lid). Mavjud `campaign.aggregate` + campaign.dto; standart maydonlar = taqqoslanadi.
- **Manba:** mavjud campaign aggregate/dto kod + v2-A
- **Dalil (kod):** `campaigns` 16 ustun CRUD real; `owner = created_by` (alohida mas'ul emas), **"kutilgan lid" maydoni YO'Q**, **maqsad-turi maydoni YO'Q** (`dto type` = kanal/format turi — QISM C §14 #6/#7). **Δ:** `56489f4d` rol-fiksi.
- **Nima yetishmaydi:** `expected_leads`, `goal_type`, alohida `owner_id` (mas'ul), kanal ko'p-tanlov.
- **Bog'liqlik:** EP-MKT-006, EP-MKT-037, EP-MKT-041
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kampaniya taqqos), Moliya
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #6`
- **Δ 2026-07-11→08-07:** `56489f4d` (2026-08-07) — Campaigns controller `manager` roliga ochildi.

### EP-MKT-037 · Kampaniya maqsad turi [v2-Q7]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — 5 maqsad turi (yangi lid, brend tanitish, mavjud mijoz qaytarish, yangi mahsulot e'loni, ko'rgazmaga taklif) + har biriga asosiy ko'rsatkich. Maqsadga qarab muvaffaqiyat o'lchovi farq qiladi.
- **Manba:** mavjud campaigns kod + v2-A
- **Dalil (kod):** `dto type` enum = **kanal/format turi**, maqsad-turi emas; maqsad-turi maydoni umuman yo'q (QISM C §14 #7 = **Yo'q**).
- **Nima yetishmaydi:** `goal_type` enum (5 tur) + har turga bog'langan asosiy ko'rsatkich; hisobotni maqsadga qarab o'lchash.
- **Bog'liqlik:** EP-MKT-036, EP-MKT-041
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (maqsadga mos KPI)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #7`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-038 · Kampaniya holati (status) qiymatlari [v2-Q8]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — 6 holat (Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor). Mavjud `campaign-status.enum.ts` + launch-campaign.handler — status hayot tsikli allaqachon kodda.
- **Manba:** mavjud campaign-status.enum kod + v2-A
- **Dalil (kod):** `dto status` = **5 holat**; "Tasdiqlangan" (approved) bosqichi **YO'Q** (QISM C §14 #8 = Qisman). `launch-campaign.handler.ts` real. **Δ:** `56489f4d` — `POST :id/launch` endi `manager` uchun ham ochiq.
- **Nima yetishmaydi:** `approved` holati + tasdiqlash oqimi (byudjet oshsa "tasdiqlash kerak" — Item 4).
- **Bog'liqlik:** EP-MKT-033 (byudjet darvozasi), EP-MKT-036
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (faol pul oqimi), Moliya
- **Xoch-havolalar:** `[Module-14] Item 4` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #8`
- **Δ 2026-07-11→08-07:** `56489f4d` (2026-08-07) — launch/update endpointlari `manager` roliga ochildi.

### EP-MKT-039 · Kampaniya maqsadli auditoriya (tarmoq) [v2-Q9]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tayyor tarmoq ro'yxatidan ko'p tanlov (oziq-ovqat, meva-sabzavot eksport, qandolat, farmatsevtika, elektronika, savdo). Kitob — quti turi mijoz tarmog'iga bog'liq (meva ≠ qandolat quti). Segment manbasi sd_customers (EP-MKT-110 ABC).
- **Manba:** kitob (mijoz tarmog'i↔quti turi) + v2-A
- **Dalil (kod):** `target_audience` **JSONB** bor, lekin sanoat-sektor ro'yxati **YO'Q** — erkin `interests` (QISM C §14 #9 = Qisman).
- **Nima yetishmaydi:** zavod tarmoq (sektor) enum/seed; `sd_customers` segmenti bilan bog'lanish.
- **Bog'liqlik:** EP-MKT-105 (ABC), EP-MKT-089 (mahsulot turi)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz segmenti), SD (mahsulot mosligi)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #9`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-040 · Kampaniya geografiyasi [v2-Q10]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — hudud tanlovi (viloyat/shahar) + eksport bayrog'i. Kitob — yetkazish narxi hududga bog'liq; eksport (Tojikiston) boshqa hujjat/narx (EP-MKT-108). Logistika bilan ulanadi.
- **Manba:** kitob (Tojikiston eksport, yetkazish narxi) + v2-A
- **Dalil (kod):** `targetAudience.region` — oddiy **string**; struktura (viloyat/shahar) va **eksport bayrog'i YO'Q** (QISM C §14 #10 = Qisman).
- **Nima yetishmaydi:** viloyat/shahar strukturasi + `is_export` bayrog'i; Logistika narx-jadvaliga ulanish.
- **Bog'liqlik:** EP-MKT-102 (mijoz hududi), EP-MKT-108
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (yetkazish), SD, Moliya
- **Xoch-havolalar:** `[Module-14] Item 80` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #10`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-041 · Kampaniya natija o'lchovlari (kutilgan vs haqiqiy) [v2-Q11]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — reja va fakt yonma-yon (lid, sotuv, ROI) avtomatik. ShVB reja-fakt (campaignEfficiency); kuchli tahlil. Mavjud campaigns natija maydonlari.
- **Manba:** ShVB (campaignEfficiency reja-fakt) + mavjud campaigns kod + v2-A
- **Dalil (kod):** `getCampaignStats` real (**fakt** tomoni ishlaydi); ammo `campaigns` da **"reja" maydonlari YO'Q** (QISM C §14 #11 = Qisman) → yonma-yon taqqoslash imkonsiz.
- **Nima yetishmaydi:** `expected_leads`/`expected_revenue`/`expected_roi` maydonlari (EP-MKT-036 bilan bir ildiz).
- **Bog'liqlik:** EP-MKT-036, EP-MKT-037, EP-MKT-007
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (kampaniya samarasi), Moliya
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #11`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-042 · Kampaniya promo-kod / chegirma bog'lanishi [v2-Q12]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11 Δ)*
- **Talab:** A — kampaniyaga promo-kod biriktiriladi, sotuvda kuzatiladi ("EXPO2026"). Kitob — yangi mijoz jalbida chegirma muhim, kim qaysi kod bilan kelganini bilmasak samara o'lchanmaydi. Sodiqlik imtiyozi qoidasi EP-MKT-108 bilan.
- **Manba:** kitob (chegirma B2B jalb) + v2-A
- **Dalil (kod):** 2026-07-11 auditi: `information_schema.columns WHERE table_name ILIKE '%promo%'` → **bo'sh massiv**, `campaigns` 16 ustunda `promo_code`/`discount` YO'Q. **Δ:** o'sha kuni `cd412d3a` bilan `marketing/promo-codes/` (repository + service) + `presentation/promo-codes.controller.ts` qurildi, `marketing.module.ts` ga ro'yxatdan o'tkazildi — default cheklov **1 mijoz / 1 kampaniya**. Jonli kodda mavjudligi tasdiqlandi.
- **Nima yetishmaydi:** promo-kod↔**sotuv** kuzatuvi (SD tomonida kodni qo'llash va atribusiya) qurilmagan — kod yaratiladi, lekin "kim shu kod bilan keldi" zanjiri yopilmagan.
- **Bog'liqlik:** EP-MKT-108 (sodiqlik imtiyozi), EP-MKT-055 (atribusiya)
- **action:** CREATE
- **⤳ Ta'sir:** SD (chegirma qo'llash), Moliya (chegirma xarajati)
- **Xoch-havolalar:** `[Module-14] Item 20` · `EXTRACTION QISM C §14 #12` · `EXTRACTION QISM A #20`
- **Δ 2026-07-11→08-07:** `cd412d3a` (2026-07-11) — promo-kod CRUD noldan qurildi (1 mijoz/1 kampaniya limiti bilan); FULL-ITEM-LEVEL "Yo'q" bahosi shu commit bilan eskirdi.

### EP-MKT-043 · Lid sifati darajalari (issiq/iliq/sovuq) [v2-Q13]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 daraja (issiq/iliq/sovuq) + avtomatik ball asosida. ShVB `qualifiedLeads`; "son emas, sifat muhim" — sotuvchi issiqlarga vaqt. Ball formulasi EP-MKT-044 da.
- **Manba:** ShVB (qualifiedLeads) + EP-MKT-044 + v2-A
- **Dalil (kod):** `leads.score` + `status` real; `getHotLeads` + `recalc-scores` real endpointlar. Ammo **qat'iy 3-daraja enum emas** (QISM C §14 #13 = Qisman).
- **Nima yetishmaydi:** issiq/iliq/sovuq qat'iy enum + ball chegaralari (EP-MKT-044 🔵 vaznlari bilan bog'liq).
- **Bog'liqlik:** EP-MKT-022, EP-MKT-044 (🔵), EP-MKT-074
- **action:** AI
- **⤳ Ta'sir:** SD (lid navbati), Hisobot (sifatli lid ulushi)
- **Xoch-havolalar:** `[Module-14] Item 1` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #13`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-044 · Lid sifat ballari (qanday hisoblanadi) [v2-Q14]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5 mezon (buyurtma hajmi, shoshilinchlik, byudjet aniqligi, mahsulot mosligi, qayta mijoz) → ball → daraja. Tamoyil tasdiq; har mezon VAZNI (foizi) egasidan — sub-savol: A (buyurtma hajmi eng og'ir 40%) tavsiya, lekin egasi belgilaydi.
- **Manba:** kitob (buyurtma hajmi/qayta mijoz muhim) + v2-A (vazn egasidan)
- **Dalil (kod):** CRM tomonda `crm-lead-scoring.service.ts` — real **5-mezonli vaznli formula** (EP-CRM-012), jonli marshrutga ulangan. Marketing tomonda `recalc-scores` faqat **2 omil** (channel + status) — 5 mezon YO'Q (QISM C §14 #14 = Qisman).
- **Nima yetishmaydi:** marketing lidlari CRM skoreriga ulanmagan (ikki xil formula); vaznlar **egasi-DATA** (foizlar); oylik avto-kalibrovka + ikki-versiya + rahbar tasdig'i yo'q (Item 1).
- **Bog'liqlik:** EP-MKT-022, EP-MKT-043, EP-MKT-001 (two-worlds)
- **action:** AI
- **⤳ Ta'sir:** CRM/SD (lid navbati), Hisobot
- **Xoch-havolalar:** `[Module-14] Item 1` · `EXTRACTION QISM C §14 #14` · `EXTRACTION QISM A #1`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-045 · Lid minimal majburiy maydonlari [v2-Q15]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — majburiy: telefon + manba kanali + mahsulot qiziqishi; qolgani ixtiyoriy. Tamoyil tasdiq (telefonsiz/manbasiz = chala lid); aniq majburiy maydon ro'yxati egasidan (mahsulot turi EP-MKT-089 bilan).
- **Manba:** kitob (telefon+manba+mahsulot turi) + v2-A (yakuniy ro'yxat egasidan)
- **Dalil (kod):** `phone`/`source`/`channel` ustunlari bor, lekin **hammasi optional**; mahsulot-qiziqish maydoni yo'q (QISM C §14 #15 = Qisman).
- **Nima yetishmaydi:** majburiy validatsiya (DTO + DB NOT NULL); `product_type` ustuni umuman yo'q (EP-MKT-089). Yakuniy majburiy ro'yxat = **egasi-DATA**.
- **Bog'liqlik:** EP-MKT-089, EP-MKT-118 (rekvizit darvozasi)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (sifatli ma'lumot), SD
- **Xoch-havolalar:** `[Module-14] Item 59` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #15`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-046 · Takroriy (dublikat) lid nazorati [v2-Q16]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — telefon bo'yicha avtomatik dublikat aniqlash + ogohlantirish + birlashtirish taklifi. CRM yagona mijoz kartasi (EP-CRM-017); bir mijozga 3 sotuvchi qo'ng'iroq qilmasin. Toza baza.
- **Manba:** CRM EP-CRM-017 (yagona karta) + v2-A
- **Dalil (kod):** `grep "normalizePhone|phoneNormaliz|dedup" marketing crm` → faqat aloqasiz NPS-so'rov dedup izohlari. `create` da dublikat tekshiruvi **YO'Q** (grep=0) — har INSERT yangi qator. Umumiy `shared/domain/value-objects/phone-number.vo.ts` VO mavjud lekin lid kiritishga **ULANMAGAN** (`leads.repository.ts:56` xom `phone` INSERT qiladi).
- **Nima yetishmaydi:** E.164 (+998) normalizatsiya utiliti + dublikat-so'rov + boshliq tasdiqlaydigan merge endpointi.
- **Bog'liqlik:** EP-MKT-001 (yagona ro'yxat), EP-MKT-056 (merge+atribusiya)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz kartasi yagonaligi), SD
- **Xoch-havolalar:** `[Module-14] Item 2` · `EXTRACTION QISM C §14 #16` · `EXTRACTION QISM D #2`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-047 · Lidni sotuvchiga taqsimlash qoidasi [v2-Q17]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — mahsulot turi + hudud bo'yicha avtomatik, bo'lmasa navbat (round-robin). CRM EP-CRM-005 bilan bir xil tamoyil; kitob "Menedjer" ustuni (EP-MKT-090). Aniq qoida ustuvorligi (hudud yoki mahsulot avval) egasidan.
- **Manba:** CRM EP-CRM-005 + kitob (Menedjer ustuni) + v2-A (qoida tafsili egasidan)
- **Dalil (kod):** `RECONCILIATION SB0662` "round-robin+HR-status STILL-OPEN" (round-robin yo'q ma'nosida) **noto'g'ri**: `website-lead.repository.ts:pickNextSalesManager()` (37-51) — real, ishlaydigan eng-kam-yuklangan round-robin (`ORDER BY COUNT(l.id) ASC`), `employees.is_active` bo'yicha filtrlangan; ham dastlabki tayinlashda, ham `lead-aging-reassign.cron.ts` da ishlatiladi.
- **Nima yetishmaydi:** mahsulot-turi/hudud bo'yicha qoida yo'q (ikkala ustun ham lidda yo'q — EP-MKT-089/102); HR ABSENT holati tekshirilmaydi (faqat umumiy `is_active`); sozlanadigan ish-yuklama limiti yo'q. Qoida ustuvorligi = **egasi-DATA**.
- **Bog'liqlik:** EP-MKT-048, EP-MKT-090, EP-MKT-089, EP-MKT-102
- **action:** CREATE
- **⤳ Ta'sir:** SD (lid egasi), HR/KPI (sotuvchi yuklamasi)
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #17` = "**Yo'q**, avto-taqsimlash grep=0" va `RECONCILIATION SB0662` = STILL-OPEN; `[Module-14] Item 37` esa jonli kodda round-robin funksiyasini **o'qib tasdiqlagan** (STALE-DOC). Real: **round-robin bor, HR-status/qoida-ustuvorlik yo'q**.
- **Xoch-havolalar:** `[Module-14] Item 37` · `[Module-14] Item 3` · `EXTRACTION QISM C §14 #17/#68` · `EXTRACTION QISM A #3/#37`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-048 · Lid eskirishi (qancha vaqt javobsiz qolsa) [v2-Q18]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — belgilangan soat (mas. 4 soat) javobsiz → rahbarga signal + 24 soatdan keyin boshqa sotuvchiga. Kitob "issiq lid 1-2 kunda raqobatchiga ketadi". Aniq SOATlar (4/24) egasidan.
- **Manba:** kitob (issiq lid tez ketadi) + v2-A (soat raqami egasidan)
- **Dalil (kod):** `RECONCILIATION SB0668` "aging cron yozilmagan" **eskirgan**: `crm/cron/lead-aging-reassign.cron.ts` — real, to'liq `@Cron('0 7 * * *')`, `findColdLeadsForReassignment` bilan sovuq lidlarni topadi, `pickNextSalesManager` orqali qayta taqsimlaydi, audit-izoh yozadi; `f855ca16` (2026-07-08), `crm.module.ts` da ro'yxatdan o'tgan. `getOverdueLeads` ham real (READ).
- **Nima yetishmaydi:** HR `ABSENT` holati tekshirilmaydi (ta'tildagi sotuvchiga topshirilishi mumkin); rahbarga eskalatsiya bosqichi yo'q. Aniq **soat raqamlari (4/24) = egasi-DATA** — Q-40 bo'yicha to'qimadim.
- **Bog'liqlik:** EP-MKT-047, EP-MKT-074 (15-daqiqa eskalatsiya)
- **action:** CRON
- **⤳ Ta'sir:** SD (lid qayta taqsim), Bildirishnoma, HR/KPI
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #18` = "cron+reassign YO'Q"; `[Module-14] Item 3` = **STALE-DOC** (cron jonli kodda to'liq o'qilgan, `f855ca16` 2026-07-08). Real: **cron bor, HR-ABSENT tekshiruvi yo'q**.
- **Xoch-havolalar:** `[Module-14] Item 3` · `EXTRACTION QISM C §14 #18` · `EXTRACTION QISM A #3`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-049 · Lid bosqichlari (lid → mijoz yo'li) [v2-Q19]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 6-7 bosqichli voronka (karton zavodga moslangan: namuna qutisi bosqichi bilan). Kitob — намуна→подписной лист B2B tugun (EP-MKT-093). Aniq bosqich NOMLARI egasidan (EP-MKT-004 bilan birga).
- **Manba:** kitob (namuna/подписной лист bosqichlari) + v2-A (nomlar egasidan)
- **Dalil (kod):** `getMarketingFunnel` + `crm_lead_stages` real; `status` **erkin matn**. `RECONCILIATION SB0669` — `crm_lead_stage_history` jadvali yo'q.
- **Nima yetishmaydi:** qat'iy bosqich enum; B2B bosqichlari (Namuna→Namuna tasdiqida→Tasdiqlandi/подписной лист — EP-MKT-093); bosqich-tarixi jadvali. Bosqich **NOMLARI = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-004, EP-MKT-093
- **action:** CREATE
- **⤳ Ta'sir:** CRM (deal pipeline), Ishlab chiqarish (namuna qutisi)
- **Xoch-havolalar:** `[Module-14] Item 71` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #19` · `RECONCILIATION SB0669`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-050 · Lid yo'qotish sabablari [v2-Q20]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — tayyor sabablar ro'yxati (7-8: narx baland, raqobatchiga ketdi, miqdor kam, sifat mos emas, javob bermadi) + izoh. Kitob qisqartirish-jadval real sabablar; tamoyil tasdiq, aniq RO'YXAT egasidan (win/loss EP-MKT-104 bilan).
- **Manba:** kitob (qisqartirish jadval) + EP-MKT-104 + v2-A (ro'yxat egasidan)
- **Dalil (kod):** `lost_reason` + `getLossAnalysis` real; qat'iy enum **yo'q**, erkin matn (QISM C §14 #20 = Qisman).
- **Nima yetishmaydi:** sabab enum/seed jadvali + FE tanlov ro'yxati. **RO'YXAT = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-029, EP-MKT-100
- **action:** UPDATE
- **⤳ Ta'sir:** SD (narx siyosati), Hisobot (yo'qotish tahlili)
- **Xoch-havolalar:** `[Module-14] Item 78` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #20`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-051 · ROI hisoblash formulasi [v2-Q21]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ROI = (kampaniyadan kelgan sotuv FOYDASI − marketing xarajat) / marketing xarajat (foyda asosli, aylanma emas). ShVB `marketingRoi`; tamoyil tasdiq. Sub-savol: foyda marjasi qayerdan — A (mahsulot tannarxidan avtomatik) tavsiya, egasidan.
- **Manba:** ShVB (marketingRoi) + kitob (foyda/dona, foyda/kg — Nosirov) + v2-A (marja manbasi egasidan)
- **Dalil (kod):** `marketing-roi.service.ts:137` — **foyda-asosli ROI real** (QISM C §14 #21 = **Ha**). Ammo `grep "FIFO|fifo"` shu faylda → **0**; `profitAbsolute = revenue − spend` (171-satr) — bu COGS chegirilgan foyda emas, `revenue` tashqaridan tayyor keladi.
- **Nima yetishmaydi:** Moliya FIFO tannarx feed'i (`revenue`→`grossProfit` aylantirish). **Marja manbasi = egasi-DATA** (sub-savol ochiq).
- **Bog'liqlik:** EP-MKT-007, EP-MKT-111 (foyda maxfiyligi)
- **action:** AI
- **⤳ Ta'sir:** Moliya (foyda marjasi), Hisobot
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #21` = **Ha** ("profit-based ROI real"); `[Module-14] Item 33` = **Yo'q** (FIFO ulanmagan); `QISM D #33` = **Qisman**. Registrda **Qisman** olindi — formula bor, tannarx manbai yo'q.
- **Xoch-havolalar:** `[Module-14] Item 33` · `EXTRACTION QISM C §14 #21` · `EXTRACTION QISM D #33` · `EXTRACTION QISM A #33`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-052 · Lid narxi (CPL) [v2-Q22]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — kanal va kampaniya kesimida avtomatik CPL (xarajat / lidlar soni). ShVB `costPerLead` bevosita; byudjet qaroriga asos.
- **Manba:** ShVB YO'NALISH 25 (costPerLead) + v2-A
- **Dalil (kod):** `CPL = spend / leads`; `getChannelRoi` real rollup (QISM C §14 #22 = **Ha**).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-008, EP-MKT-094 (namuna xarajati CPLga)
- **action:** AI
- **⤳ Ta'sir:** Moliya, byudjet qarori, Hisobot
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #22`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-053 · Mijoz jalb narxi (CAC) [v2-Q23]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — CAC = davr marketing xarajati / yangi mijozlar soni, kanal kesimida. ShVB ROI/CPL oilasiga mantiqan qo'shiladi (lid ≠ mijoz, haqiqiy samara CACда).
- **Manba:** ShVB YO'NALISH 25 (ROI/CPL oilasi) + v2-A
- **Dalil (kod):** `ChannelRoiRow.cac = spend / conversions` real (QISM C §14 #23 = **Ha**).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-054 (LTV/CAC), EP-MKT-055 (atribusiya oynasi)
- **action:** AI
- **⤳ Ta'sir:** Moliya, Hisobot (kanal samarasi)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #23`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-054 · Mijoz umrbod qiymati (LTV) va ROI ufqi [v2-Q24]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 12 oylik takroriy sotuvni hisobga olgan ROI (LTV/CAC nisbati). Kitob — mijoz takroriy buyurtma beradi (Benazir), birinchi sotuvда zarar ko'rinsa ham yil davomida foydali. CRM CLV (EP-CRM-019).
- **Manba:** kitob (takroriy buyurtma) + CRM CLV (EP-CRM-019) + v2-A
- **Dalil (kod):** CAC bor; **LTV va LTV/CAC 12-oylik hisobi marketing modulida YO'Q** (QISM C §14 #24 = Qisman) — CRM RFM alohida turadi va marketing kanal-kesimiga ulanmagan.
- **Nima yetishmaydi:** 12-oylik takroriy sotuv agregatsiyasi; LTV/CAC nisbati; kanal bo'yicha kesim.
- **Bog'liqlik:** EP-MKT-025, EP-MKT-053
- **action:** AI
- **⤳ Ta'sir:** CRM (takroriy sotuv tarixi), Moliya
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #24`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-055 · ROI bog'lanish davri (atribusiya oynasi) [v2-Q25]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — 90 kunlik atribusiya oynasi (B2B sekin tsiklga mos). Kitob — karton qutining sotuv tsikli uzun (lid 2 oydan keyin sotib oladi). Tamoyil tasdiq, aniq KUN (90/30/cheksiz) egasidan.
- **Manba:** kitob (uzun B2B tsikl) + v2-A (kun raqami egasidan)
- **Dalil (kod):** `MKT_ATTRIBUTION_WINDOW_DAYS = 90` `marketing-roi.constants.ts:121` da **e'lon qilingan**, lekin `grep "attributionWindowDays|MKT_ATTRIBUTION" marketing-roi.service.ts` → **0 mos** — konstanta hech qachon iste'mol qilinmaydi. Vaqt-oyna filtri topilmadi (QISM C §14 #25 = **Yo'q**).
- **Nima yetishmaydi:** konstantani ROI hisobiga ulash; ikki-kampaniya krediti qoidasi (Item 13). **KUN raqami = egasi-DATA** (konstantada 90 turibdi lekin ega tasdiqlamagan).
- **Bog'liqlik:** EP-MKT-056, EP-MKT-042 (promo atribusiya)
- **action:** AI
- **⤳ Ta'sir:** ROI/CAC hisobi, Hisobot
- **Xoch-havolalar:** `[Module-14] Item 13` · `[Module-14] Item 6` · `EXTRACTION QISM C §14 #25` · `EXTRACTION QISM A #13`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-056 · Ko'p kanal atribusiyasi (kim hisobga olinadi) [v2-Q26]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — oxirgi teginish asosiy + birinchi teginish ham qayd (ikkalasi ko'rinadi). Muvozanatli; dastlabki kanal "befoyda" ko'rinmaydi. Tamoyil tasdiq, model (oxirgi/birinchi/bo'linadigan) egasidan.
- **Manba:** v2-A (atribusiya modeli egasidan)
- **Dalil (kod):** `marketing_leads.source` **bitta kanal** (single-touch); `marketing-ext.service.ts:77-153` channel-ROI faqat shu bitta manbadan. Merge/multi-touch model **YO'Q** (QISM C §14 #26 + QISM D #6).
- **Nima yetishmaydi:** `lead_touchpoints` jadvali (first/last touch); telefon bo'yicha merge (EP-MKT-046 ga bog'liq). **Model tanlovi = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-046, EP-MKT-055, EP-MKT-032
- **action:** AI
- **⤳ Ta'sir:** Hisobot (kanal ROI adolatli), Moliya
- **Xoch-havolalar:** `[Module-14] Item 6` · `EXTRACTION QISM C §14 #26` · `EXTRACTION QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-057 · Ko'rgazma (vystavka) ro'yxatga olish [v2-Q27]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — ko'rgazma kartochkasi (xarajat, sana, joy, stend o'lchami, mas'ul, kutilgan lid). Mavjud `MarketingExhibitions.tsx`; kitob — ko'rgazma eng kuchli, lekin qimmat (to'liq hisob shart).
- **Manba:** mavjud MarketingExhibitions kod + kitob (ko'rgazma kuchli/qimmat) + v2-A
- **Dalil (kod):** `exhibitions` **23 ustun** + CRUD real (`marketing-analytics-stubs.controller.ts:454`), jumladan `roi`, `lead_count`, `deal_count`, `budget` (QISM C §14 #27 = **Ha**).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-058, EP-MKT-059, EP-MKT-061, EP-MKT-115
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (ko'rgazma xarajati), SD
- **Xoch-havolalar:** `[Module-14] Item 97` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #27`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-058 · Ko'rgazmada lid yig'ish usuli [v2-Q28]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — telefondagi tezkor forma (ism, telefon, qiziqish) bir necha soniyada → joyida bazaga. Kitob — 200 ta odam, qog'oz yo'qoladi. EP-MKT-010 bilan bir xil; mobil ilova.
- **Manba:** mavjud Exhibitions kod + kitob (qog'oz yo'qoladi) + v2-A
- **Dalil (kod):** `POST exhibitions/:id/leads` real INSERT + **QR** (`marketing-analytics-stubs.controller.ts:474`) — QISM C §14 #28 = **Ha**.
- **Nima yetishmaydi:** *(qurilish bo'yicha yopiq; offline rejim alohida band — Item 10 = Yo'q)*
- **Bog'liqlik:** EP-MKT-010, EP-MKT-057
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid avtomatik), Mobil ilova
- **Xoch-havolalar:** `[Module-14] Item 10` *(mavzu bo'yicha)* · `EXTRACTION QISM C §14 #28` · `EXTRACTION QISM D #10`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-059 · Ko'rgazma lidini sotuvga ulash va kuzatish [v2-Q29]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har lid ko'rgazma tegiga bog'lanadi, sotuvgacha kuzatiladi (ko'rgazma ROI avtomatik). Oltin-ip; kitob — 3 yirik mijoz bersa ko'rgazma foydali. Aniq qaytim.
- **Manba:** master reja oltin-ip + kitob (ko'rgazma ROI) + v2-A
- **Dalil (kod):** `roi`/`lead_count` ustunlari mavjud (struktura), `exhibition_leads` QR bilan yig'iladi; ammo **`exhibition_leads → sotuv` avto-bog'lash event YO'Q** — qo'lda (QISM C §14 #29/#97 = Qisman).
- **Nima yetishmaydi:** lid→deal→sotuv zanjirini ko'rgazma tegiga qaytarib bog'lovchi listener; ROI avtomatik to'ldirilmaydi.
- **Bog'liqlik:** EP-MKT-011, EP-MKT-060, EP-MKT-061
- **action:** EVENT
- **⤳ Ta'sir:** SD (sotuvga ulash), Moliya, Hisobot
- **Xoch-havolalar:** `[Module-14] Item 97` · `EXTRACTION QISM C §14 #29/#97`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-060 · Ko'rgazma keyingi ish (follow-up) jadvali [v2-Q30]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ko'rgazma tugagach avtomatik vazifalar (48 soat ichida bog'lanish) + bajarilishini kuzatish. Kitob — ko'rgazmadan keyin lid "issiq", kech bo'lsa qiziqish so'nadi. Karta-model vazifa→mas'ul.
- **Manba:** kitob (issiq lid tez so'nadi) + karta-model + v2-A
- **Dalil (kod):** `drizzle-marketing-ext.repo.ts:496` da izoh: "*Schema has no `next_follow_up_at` column*" — follow-up cron/jadval **YO'Q** (QISM C §14 #30 = **Yo'q**). HR ish-kun kalendari integratsiyasi ham yo'q (Item 31).
- **Nima yetishmaydi:** `next_follow_up_at` ustuni + 48-soatlik avto-vazifa cron + HR ish-kunlari kalendari (bayram o'tkazib yuborish).
- **Bog'liqlik:** EP-MKT-059, EP-MKT-057, HR (ish-kun kalendari)
- **action:** CRON
- **⤳ Ta'sir:** CRM (vazifalar), HR/KPI
- **Xoch-havolalar:** `[Module-14] Item 31` · `[Module-14] Item 97` · `EXTRACTION QISM C §14 #30/#97` · `EXTRACTION QISM D #31`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-061 · Ko'rgazma natija hisobotini taqqoslash [v2-Q31]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ko'rgazmalar bo'yicha tarixiy taqqoslash jadvali (yillar kesimida: xarajat/lid/sotuv/ROI). ShVB hisobot reglamenti; kitob — qaysi ko'rgazma har yili foyda, qaysi pul yeydi.
- **Manba:** ShVB (hisobot) + kitob (yillik taqqos) + v2-A
- **Dalil (kod):** `GET exhibitions` ma'lumoti bor, lekin **maxsus yillik agregat endpoint YO'Q** (QISM C §14 #31 = Qisman).
- **Nima yetishmaydi:** yil kesimidagi agregat so'rovi + FE taqqoslash jadvali; ROI ustuni avtomatik to'lmagani uchun (EP-MKT-059) taqqoslash bazasi ham ishonchsiz.
- **Bog'liqlik:** EP-MKT-057, EP-MKT-059, EP-MKT-011
- **action:** READ
- **⤳ Ta'sir:** Hisobot (strategik qaror), Moliya
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #31`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-062 · Ijtimoiy inbox (yagona xabarlar oynasi) [v2-Q32]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-13 Δ)*
- **Talab:** A — barcha kanal xabarlari bitta inboxda (kim javob berdi, holati). Mavjud `MarketingSocialInbox.tsx` UI tayyor; lekin Instagram/FB/Telegram API PROVAYDER ulanishi (kim/qaysi avval) egasidan — Telegram bot (egasi ekotizimi) eng avval.
- **Manba:** mavjud SocialInbox kod + ShVB (socialReach) + v2-A (provayder ulanishi egasidan)
- **Dalil (kod):** `social_conversations`/`social_messages` + CRUD + FE real (`marketing-analytics-stubs.controller.ts:319-393`); `social_api_configs` jadvali + `setupTelegramWebhook` (677-satr) bor. Ammo `SELECT count(*)` ikkalasida ham → **0** — hech qanday provayder ulanmagan. **Δ:** `b0ff014f` inbox 503 xatosini yopdi.
- **Nima yetishmaydi:** provayder ulanishi (**egasi-DATA**: qaysi tarmoq avval, kim ulaydi); real-time sync + 15-daq retry (Item 35); webhook→polling fallback (Item 50).
- **Bog'liqlik:** EP-MKT-012, EP-MKT-064, EP-MKT-063, EP-MKT-107 (Telegram bot)
- **action:** READ
- **⤳ Ta'sir:** CRM (suhbatdan lid), AI integratsiya (Telegram), Bildirishnoma
- **Xoch-havolalar:** `[Module-14] Item 99` · `[Module-14] Item 35` · `[Module-14] Item 50` · `EXTRACTION QISM C §14 #32/#99` · `EXTRACTION QISM D #35/#50`
- **Δ 2026-07-11→08-07:** `b0ff014f` (2026-07-13) — inbox suhbatlari endpointi 503 qaytarardi (xom SQL'da tiplanmagan `null`); tuzatildi.

### EP-MKT-063 · Inbox xabariga javob vaqti (SLA) [v2-Q33]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ish vaqtida 15 daqiqa, tashqarisida ertasi ertalab SLA + kechikkanlar signal. Kitob (tez javob = buyurtma); EP-MKT-014 bilan. Aniq SLA daqiqasi (15/30) egasidan.
- **Manba:** kitob (tez javob muhim) + EP-MKT-014 + v2-A (daqiqa egasidan)
- **Dalil (kod):** `grep "SLA|business-hour|ish-soat" marketing` → **0**. `getInboxStats` real, lekin SLA hisobi/signal logikasi umuman yo'q (QISM C §14 #33 + QISM D #5).
- **Nima yetishmaydi:** ish-soati kalendari utiliti + SLA taymer + kechikkan signal. **DAQIQA raqami = egasi-DATA** — `business_settings` ga default bilan qo'shilishi kerak.
- **Bog'liqlik:** EP-MKT-014, EP-MKT-062 (provayder), EP-MKT-066
- **action:** EVENT
- **⤳ Ta'sir:** HR/KPI (javob tezligi), xizmat sifati
- **Xoch-havolalar:** `[Module-14] Item 5` · `EXTRACTION QISM C §14 #33` · `EXTRACTION QISM D #5` · `EXTRACTION QISM A #5`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-064 · Inbox xabaridan lid yaratish [v2-Q34]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — suhbatdan "Lid yarat" tugmasi (manba avtomatik shu kanal). EP-MKT-013 bilan bir xil; uzilishsiz o'tish.
- **Manba:** mavjud social-inbox/leads kod + master reja oltin-ip + v2-A
- **Dalil (kod):** jadvallar + `convert-to-crm` mavjud, lekin **"create lead from conversation" YO'Q** (QISM C §14 #34 = Qisman-da shu qism yetishmaydi; Item 99 = Qisman, "AI-reply/conversion-to-lead piece is unbuilt").
- **Nima yetishmaydi:** conversation→lead endpoint + manba-kanal merosi + FE tugma.
- **Bog'liqlik:** EP-MKT-013, EP-MKT-062
- **action:** CREATE
- **⤳ Ta'sir:** CRM, SD
- **Xoch-havolalar:** `[Module-14] Item 99` · `EXTRACTION QISM C §14 #34/#99`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-065 · Inbox javob shablonlari va tezkor javoblar [v2-Q35]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — shablonlar kutubxonasi (narx so'rovi, namuna, muddat, minimal partiya). EP-MKT-026 bilan; tez va bir xil to'g'ri.
- **Manba:** mavjud social-inbox kod + kitob (FAQ) + v2-A
- **Dalil (kod):** `email_templates` CRUD real, lekin **inbox FAQ-javobiga bog'lanmagan** (QISM C §14 #35 = Qisman).
- **Nima yetishmaydi:** inbox-maxsus shablon kutubxonasi + suhbatga bir tugma bilan qo'yish; B2B FAQ (narx/minimal partiya/muddat) seed'i.
- **Bog'liqlik:** EP-MKT-026, EP-MKT-062, EP-MKT-101 (savdo skripti)
- **action:** CREATE
- **⤳ Ta'sir:** SocialInbox, xizmat tezligi
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #35`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-066 · Inbox mas'ul va kanal egasi tayinlash [v2-Q36]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — suhbat ochilganda biriktiriladi yoki avtomatik navbat + "javob berilmoqda" belgisi. Karta-model (mas'ul→karta); ikki xodim bir mijozga javob bermasin. EP-MKT-035 kanal egasi bilan.
- **Manba:** karta-model + EP-MKT-035 + v2-A
- **Dalil (kod):** suhbat `status` PATCH bor; **mas'ul (`assigned_to`) va qulflash YO'Q** (QISM C §14 #36 = Qisman).
- **Nima yetishmaydi:** `assigned_to` ustuni + "javob berilmoqda" qulfi + avtomatik navbat; karta FK (EP-MKT-020).
- **Bog'liqlik:** EP-MKT-035, EP-MKT-020, EP-MKT-063
- **action:** UPDATE
- **⤳ Ta'sir:** HR (mas'uliyat), SocialInbox
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #36`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-067 · Inbox spam/ahamiyatsiz xabar filtri [v2-Q37]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — spam belgisi + alohida papka, statistikadan chiqariladi. Spam orasida haqiqiy lid yo'qolmasin, statistika buzilmasin. Toza ko'rinish.
- **Manba:** mavjud social-inbox kod + v2-A
- **Dalil (kod):** `grep "spam" apps/api/src/modules/marketing` → **0 mos** (Item 25: "*stronger than the table's implied 'manual recovery exists' — nothing exists*"). Spam-filtr, papka, istisno logikasi umuman yo'q.
- **Nima yetishmaydi:** spam bayrog'i + alohida papka + statistikadan chiqarish; qo'lda "spam emas" tiklash tugmasi; AI faqat-ogohlantirish rejimi.
- **Bog'liqlik:** EP-MKT-062 (provayder — spam 0 qatorda ma'nosiz), EP-MKT-021 (AI)
- **action:** UPDATE
- **⤳ Ta'sir:** SocialInbox (toza statistika), AI (avto-spam)
- **Xoch-havolalar:** `[Module-14] Item 25` · `EXTRACTION QISM C §14 #37` · `EXTRACTION QISM D #25` · `EXTRACTION QISM A #25`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-068 · Kontent kalendar asoslari [v2-Q38]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — taqvim ko'rinishi (oy/hafta) + post kartochkalari. Mavjud `MarketingCalendar.tsx`; tartibli reja (postlar tartibsiz chiqmasin). EP-MKT-018 bilan.
- **Manba:** mavjud MarketingCalendar kod + memory (calendar real DB) + v2-A
- **Dalil (kod):** `calendar_events` CRUD real + FE `MarketingCalendar` (`marketing-group2.controller.ts:197`) — QISM C §14 #38 = **Ha**.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-018, EP-MKT-069, EP-MKT-073
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (post vazifasi), Bildirishnoma
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #38`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-069 · Kontent posti maydonlari [v2-Q39]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-13 Δ)*
- **Talab:** A — to'liq (sana, kanal(lar), sarlavha, matn, media, mas'ul, holat, bog'liq kampaniya). Mavjud MarketingContent; standart maydonlar = bir qarashda tayyor-tayyormas ko'rinadi.
- **Manba:** mavjud MarketingContent kod + v2-A
- **Dalil (kod):** `marketing_content` **16 ustun** + CRUD real + FE (QISM C §14 #39 = **Ha**). **Δ:** `eff7b4cb` — kontent-post CREATE doim muvaffaqiyatsiz edi (`platform` maydoni yo'q + `body`/`content` DTO drifti); `16be54fc` — blog maqola 422 + SEO/cover/tags maydonlari tashlanardi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-017, EP-MKT-070, EP-MKT-072
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (media), kampaniya bog'lanishi
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #39`
- **Δ 2026-07-11→08-07:** `eff7b4cb` + `16be54fc` (2026-07-13) — post/maqola yaratish oqimlari buzuq edi (DTO drift, tashlangan maydonlar); tuzatildi.

### EP-MKT-070 · Kontent holati va tasdiqlash oqimi [v2-Q40]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5 bosqichli oqim (g'oya→matn tayyor→dizayn tayyor→tasdiqlangan→joylandi) + rahbar tasdig'idan keyin joylash. BARCHA_JAVOBLAR Q172 (HR↔Marketing reklama "1-2-3" ketma-ket tasdiq) shu oqim ruhi; tasdiqsiz post brendga zarar bermaydi.
- **Manba:** BARCHA_JAVOBLAR Q172 (1-2-3 tasdiq) + v2-A
- **Dalil (kod):** `status` + `publish` bor, lekin **5-bosqich standartlashtirilmagan** (QISM C §14 #40 = Qisman). Marketing→dizayn Kanban avto-vazifasi ham yo'q (Item 8, `grep "kanban" marketing` → bo'sh).
- **Nima yetishmaydi:** 5-bosqich enum + rahbar-tasdiq gate'i (tasdiqsiz publish bloklanmaydi); dizayn bosqichida Kanban vazifa + rad→matn qaytish oqimi.
- **Bog'liqlik:** EP-MKT-069, EP-MKT-109 (dizayn yuki)
- **action:** APPROVE
- **⤳ Ta'sir:** Dizayn moduli (post dizayni vazifasi), kontent sifati
- **Xoch-havolalar:** `[Module-14] Item 8` · `EXTRACTION QISM C §14 #40` · `EXTRACTION QISM D #8`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-071 · Kontent rukni (kontent turlari rejasi) [v2-Q41]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 5-6 kontent turi (mahsulot ko'rsatish, mijoz tavsiyasi, "zakulis" ishlab chiqarish, aksiya, foydali maslahat) + har haftaga muvozanat. Tamoyil tasdiq; aniq turlar va NISBAT (mas. kamida 1 foydali maslahat) egasidan.
- **Manba:** v2-A (turlar/nisbat egasidan)
- **Dalil (kod):** `content.type` ustuni bor, lekin **5-6 enum + haftalik muvozanat tekshiruvi YO'Q** (QISM C §14 #41 = Qisman).
- **Nima yetishmaydi:** rukn enum/seed + haftalik muvozanat validatori. **Turlar va NISBAT = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-069, EP-MKT-068
- **action:** CREATE
- **⤳ Ta'sir:** Kontent kalendari, Dizayn
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #41`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-072 · Kontent posti natija ko'rsatkichlari [v2-Q42]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — asosiy ko'rsatkichlar (qamrov, layk, izoh, saqlash) + "shu postdan kelgan lid" bog'lanishi. ShVB `socialReach`; qaysi kontent lid keltiradi ko'rinadi.
- **Manba:** ShVB (socialReach) + mavjud MarketingContent kod + v2-A
- **Dalil (kod):** `getContentAnalytics` + `social_posts` real; ammo **post→lid atribusiyasi YO'Q** (QISM C §14 #42 = Qisman). Statistika real-time sync ham yo'q (Item 35: `social_api_configs` 0 qator, retry logikasi yo'q).
- **Nima yetishmaydi:** post→lid bog'lanish (UTM orqali — EP-MKT-079); webhook real-time sync + 15-daq retry + "qo'lda yangilash" belgisi.
- **Bog'liqlik:** EP-MKT-079 (UTM), EP-MKT-062 (provayder)
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (kontent samarasi), CRM (post→lid)
- **Xoch-havolalar:** `[Module-14] Item 35` · `EXTRACTION QISM C §14 #42` · `EXTRACTION QISM D #35`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-073 · Kontent joylash eslatmalari [v2-Q43]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — post vaqtidan oldin avtomatik eslatma (mas'ulga). Karta-model vazifa eslatmasi; rejalashtirilgan post unutilmasin. Bildirishnoma bilan.
- **Manba:** karta-model + mavjud calendar kod + v2-A
- **Dalil (kod):** eslatma cron/notification **YO'Q** (QISM C §14 #43 = **Yo'q**). `grep "@Cron" marketing` → faqat NPS listener.
- **Nima yetishmaydi:** post-vaqti eslatma croni + mas'ulga bildirishnoma; karta-model vazifa integratsiyasi.
- **Bog'liqlik:** EP-MKT-068, EP-MKT-018, Bildirishnoma (NTF)
- **action:** CRON
- **⤳ Ta'sir:** Bildirishnoma (NTF), Kontent kalendari
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #43`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-074 · Marketing → Sotuv lidni topshirish nuqtasi [v2-Q44]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lid "iliq" yoki undan yuqori bo'lganda avtomatik sotuvga + qabul belgisi. Oltin-ip aniq mas'uliyat chizig'i; "marketing bermadi / sotuv olmadi" ayblashuvi tugaydi. EP-MKT-090 Menedjer ustuni.
- **Manba:** master reja oltin-ip + kitob (Menedjer ustuni) + v2-A
- **Dalil (kod):** `convert-to-crm` faqat **INSERT**; avto-trigger / `accepted` belgisi / event **YO'Q** (`emit=0`) — QISM C §14 #44 = **Yo'q**. 15-daqiqalik eskalatsiya ham yo'q (`grep "15.*minute|15.*daqiqa|ESCALATION" crm` → 0; `RECONCILIATION SB0661` STILL-OPEN).
- **Nima yetishmaydi:** ball chegarasi triggeri (iliq+) → avto-topshirish; `accepted` belgisi + ikki-event handshake; 15-daq javob bermasa savdo boshlig'iga eskalatsiya.
- **Bog'liqlik:** EP-MKT-005, EP-MKT-043 (iliq daraja), EP-MKT-090, EP-MKT-118
- **action:** EVENT
- **⤳ Ta'sir:** SD (lid qabul), HR/KPI (marketing vs sotuv javobgarligi)
- **Xoch-havolalar:** `[Module-14] Item 40` · `[Module-14] Item 49` *(qarama-qarshi yo'nalish)* · `EXTRACTION QISM C §14 #44` · `RECONCILIATION SB0661`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-075 · Namuna qutisi (sample) so'rovi marketingda [v2-Q45]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — namuna so'rovi lid kartochkasidan ishlab chiqarishga yuboriladi + holati kuzatiladi. Kitob — B2B mijoz avval namuna so'raydi, jarayon uzilmasligi kerak. EP-MKT-094 namuna ROI bilan.
- **Manba:** kitob (namuna so'rovi B2B) + v2-A
- **Dalil (kod):** lidda **sample so'rov maydoni/holati YO'Q**; lid→PP event yo'q (QISM C §14 #45 = **Yo'q**). `ow_order_samples` jadvali mavjud (0 qator) lekin ustunlari `id, order_id, iteration, requested_at, produced_at, customer_decision, feedback, rejection_reason` — lidga ham, materialga ham bog'lanmagan.
- **Nima yetishmaydi:** lid kartasida namuna-so'rov maydoni + PP ga event; "material kutilmoqda" holati + MM ga avto-signal (Item 14).
- **Bog'liqlik:** EP-MKT-094 (namuna ROI), EP-MKT-093 (voronka bosqichi), MM
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (namuna buyurtma), Ombor (namuna materiali)
- **Xoch-havolalar:** `[Module-14] Item 14` · `[Module-14] Item 72` · `EXTRACTION QISM C §14 #45/#72` · `EXTRACTION QISM D #14`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-076 · Marketing umumiy boshqaruv paneli (dashboard) [v2-Q46]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-05 Δ)*
- **Talab:** A — to'liq panel (6-8 ko'rsatkich + ogohlantirishlar). Mavjud `MarketingDashboard.tsx` + Panels/Sections; ShVB Marketing 4-Otdelenie GSD paneli. EP-MKT-009 bilan. Egaga 5-raqam alohida EP-MKT-116.
- **Manba:** ShVB YO'NALISH 25 + mavjud MarketingDashboard kod + v2-A
- **Dalil (kod):** `getDashboardStats` + `getMarketingOverview` real + FE Dashboard (QISM C §14 #46 = **Ha**). **Δ:** `429f37cd` — `totalSpent` hisoblanmasdi, tuzatildi.
- **Nima yetishmaydi:** *(qurilish bo'yicha yopiq; "ogohlantirishlar" bloki yupqa — byudjet/SLA/aging signallari qurilmagani uchun ko'rsatadigan narsa yo'q)*
- **Bog'liqlik:** EP-MKT-009, EP-MKT-116
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, butun marketing
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #46`
- **Δ 2026-07-11→08-07:** `429f37cd` (2026-08-05) — panel `totalSpent` maydoni hisoblandi.

### EP-MKT-077 · Marketing xodimi KPI ko'rsatkichlari [v2-Q47]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 3-4 KPI (sifatli lid, konversiya %, kanal ROI, SLA). ShVB `marketingGsd`; karta statistik ko'rsatkichlari. Sub-savol: konversiya sotuvchiga ham bog'liq, marketing aybi qayerda tugaydi — A (faqat sifatli lidgacha javobgar) tavsiya, egasidan.
- **Manba:** ShVB (marketingGsd) + kitob (lavozim statistik ko'rsatkichi) + v2-A (chegara egasidan)
- **Dalil (kod):** `RECONCILIATION SB0592/612` "Marketing/menejer KPI + leaderboard endpointi yo'q" va `[Module-14] Item 19/90` = **Yo'q** — bu **eskirgan**: `apps/api/src/modules/marketing/application/manager-kpi.service.ts` + `presentation/manager-kpi.controller.ts` (`GET marketing/managers/kpi`, `@Roles('super_admin','marketing_manager','manager','director','sales_manager')`) `2d2d4659` (2026-07-10) bilan qurilgan va jonli kodda mavjud.
- **Nima yetishmaydi:** KPI **event-driven** emas (har "sifatli lid" event'ida real-time yangilanmaydi — so'rov asosida); SLA ko'rsatkichi yo'q (EP-MKT-063 qurilmagan); karta FK yo'q (EP-MKT-020). **Marketing↔sotuv javobgarlik chegarasi = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-112, EP-MKT-020, EP-MKT-063
- **action:** READ
- **⤳ Ta'sir:** HR/Payroll (bonus), Org-karta
- **⚠️ ZIDDIYAT:** `RECONCILIATION SB0592/612` + `[Module-14] Item 19/90` "KPI endpoint yo'q" deydi; jonli kodda `manager-kpi.controller.ts` **mavjud** (`2d2d4659`, audit sanasidan 1 kun oldin). Auditor grepi `marketing.*kpi|kpi.*marketing` naqshi bilan `managers/kpi` marshrutini topolmagan.
- **Xoch-havolalar:** `[Module-14] Item 19` · `[Module-14] Item 90` · `EXTRACTION QISM C §14 #47/#90` · `RECONCILIATION SB0592/612`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-078 · Raqobatchi kuzatuvi (karton bozori) [v2-Q48]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — raqobatchi kartochkasi (nomi, mahsulot turi, taxminiy narx, kuchli/zaif tomon) muntazam yangilanadi. Kitob — mijoz "falon zavod arzonroq" deydi (Qo'qon/vodiy raqobat); narxni dalil bilan moslash. EP-MKT-104 win/loss bilan.
- **Manba:** kitob (Qo'qon/vodiy raqobat) + v2-A
- **Dalil (kod):** `getCompetitors()` real agregat (`marketing-group2.service.ts:78`, `drizzle-marketing-group2.repo.ts:283-298`, `sd_customer_competitors` ustidan GROUP BY, `GET /competitors`). Ammo `SELECT count(*) FROM sd_customer_competitors` → **0 qator**; bu **mijoz-kesim** ko'rinish, mustaqil raqobatchi entity emas.
- **Nima yetishmaydi:** mustaqil raqobatchi-karta CRUD (nomi/mahsulot/narx/kuchli-zaif); 3 oylik "yangilash" Kanban vazifasi; 90+ kun "eskirgan" filtri.
- **Bog'liqlik:** EP-MKT-100 (win/loss raqib nomi), EP-MKT-050
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx siyosati), Moliya
- **Xoch-havolalar:** `[Module-14] Item 98` · `[Module-14] Item 17` · `EXTRACTION QISM C §14 #48/#98` · `EXTRACTION QISM D #17`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-079 · UTM / havola kuzatuvi (veb va ijtimoiy) [v2-Q49]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har reklama/postga maxsus kuzatuv havolasi + lidga avtomatik manba. Tamoyil to'g'ri (aniq bog'lanish); lekin UTM infratuzilma (vebsayt analitika ulanishi, kim sozlaydi) egasidan. EP-MKT-032 sub-manba bilan.
- **Manba:** EP-MKT-032 (sub-manba) + v2-A (infratuzilma egasidan)
- **Dalil (kod):** UTM jadval/logika **YO'Q** (grep=0); `source` qo'lda kiritiladi (QISM C §14 #49 = **Yo'q**).
- **Nima yetishmaydi:** UTM generatsiya/parse + veb→lid landing hook + sub-manba ustuni. **Infratuzilma (kim sozlaydi, qaysi analitika) = egasi-DATA**.
- **Bog'liqlik:** EP-MKT-032, EP-MKT-072 (post→lid), EP-MKT-056
- **action:** CREATE
- **⤳ Ta'sir:** vebsayt (analitika), CRM (lid manbasi)
- **Xoch-havolalar:** `— (mos item topilmadi)` · `EXTRACTION QISM C §14 #2/#49`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-080 · Sodiqlik / takroriy mijoz kampaniyasi [v2-Q50]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mijoz tarixiga qarab avtomatik segment (3 oy buyurtma bermaganlar) + maxsus kampaniya. Kitob — yangi mijoz takroriydan 5x qimmat; eski mijozni qaytarish eng arzon. Churn (EP-MKT-084) + win-back (EP-MKT-103) bilan.
- **Manba:** kitob (takroriy 5x arzon) + v2-A
- **Dalil (kod):** `getChurnRisk` real (READ, `drizzle-marketing-ext.repo.ts:668-712`); ammo **avto win-back/segment trigger YO'Q** (QISM C §14 #50 = Qisman). `win_back_potential` — qo'lda kiritiladigan varchar; `rfm.service.ts` da faqat `'At-Risk'` yorlig'i.
- **Nima yetishmaydi:** avto-segment croni + win-back kampaniya triggeri + SD da aktiv lid tekshiruvi (parallel muloqot bo'lmasin).
- **Bog'liqlik:** EP-MKT-084, EP-MKT-104, EP-MKT-108
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz segmenti), SD (takroriy buyurtma)
- **Xoch-havolalar:** `[Module-14] Item 46` · `[Module-14] Item 82` · `EXTRACTION QISM C §14 #50/#82` · `EXTRACTION QISM D #46`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-081 · Marketing material va brending arxivi [v2-Q51]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — markaziy material kutubxonasi (versiya bilan: logotip, katalog, narx ro'yxati, namuna foto, prezentatsiya). BARCHA_JAVOBLAR Q77 (hammasi ERPda) ruhi; sotuvchi yangi/to'g'ri katalog yuborsin. MIJOZ brendi alohida EP-MKT-095 (farqli).
- **Manba:** BARCHA_JAVOBLAR Q77 (hammasi ERPda) + v2-A
- **Dalil (kod):** umumiy fayl-saqlash infratuzilmasi real (ecommerce media + blog + storage), lekin **marketing-maxsus versiyalangan kutubxona YO'Q** (Item 51 = Qisman, QISM C §14 #51).
- **Nima yetishmaydi:** marketing material jadvali + versiyalash (v1/v2/joriy) + toifalar (logotip/katalog/preyskurant/prezentatsiya).
- **Bog'liqlik:** EP-MKT-086 (mijoz brendi — FARQLI), EP-MKT-087 (portfolio)
- **action:** CREATE
- **⤳ Ta'sir:** SD (katalog), Dizayn arxivi
- **Xoch-havolalar:** `[Module-14] Item 51` · `EXTRACTION QISM C §14 #51`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-082 · Mijoz so'rovnoma / mamnuniyat (NPS) [v2-Q52]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-13 Δ)*
- **Talab:** A — buyurtma yetkazilgach avtomatik qisqa so'rovnoma (0-10 + izoh). EP-MKT-015 bilan; memory NPS real DB. Brak tarixi bilan bog'lash EP-MKT-105.
- **Manba:** memory (NPS real DB) + mavjud marketing-ext + v2-A
- **Dalil (kod):** `nps_responses` **9 qator** jonli; `POST` real INSERT; `nps-auto-request.listener.ts` `marketing.module.ts:66` da ro'yxatdan o'tgan, `ERP_EVENTS.DELIVERY_COMPLETED` ga ulangan (event `logistics.controller.ts` dan haqiqatan emit qilinadi); `nps-requests.controller.ts` (`GET`, `POST :id/responded`). **Δ:** `8fd71616` — NPS/Churn ro'yxati yaratilgan yozuvlarni ko'rsatmasdi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-MKT-015, EP-MKT-016, EP-MKT-099 (QC gate)
- **action:** EVENT
- **⤳ Ta'sir:** SD (mamnuniyat), Sifat (shikoyat tahlili)
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #52` "avto-trigger event YO'Q, qo'lda" va `#60` "avto-trigger hali yo'q (qo'lda)"; `[Module-14] Item 52` = **STALE-DOC**, `Item 60` = **Ha** (listener to'liq o'qilgan). Real: **avto-trigger bor**.
- **Xoch-havolalar:** `[Module-14] Item 52` · `[Module-14] Item 60` · `EXTRACTION QISM C §14 #52/#60` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** `8fd71616` (2026-07-13) — NPS ro'yxati FE'da bo'sh chiqardi; servis+repo tuzatildi.

### EP-MKT-083 · Bitrix24 bilan kelishuv (o'rin bosadimi / yonida) [v2-Q53]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — **ERP yagona manba bo'lsin, Bitrix24 dan lid/mijoz ko'chiriladi va keyin Bitrix24 dan voz kechiladi** (bitta haqiqat). Egasi CRM Q33 da Bitrix24→to'liq ERP qarorini bergan → bu bilan to'liq mos. Lekin O'TISH REJASI (sub-savol: bir martalik CSV yoki avtomatik API ko'prik) egasidan. ⚠️ "Ikki dunyo" muammosini qaytarmaslik uchun A shart.
- **Manba:** BARCHA_JAVOBLAR/CRM Q33 (Bitrix24→ERP) + memory (ikki-dunyo) + v2-A (ko'chirish rejasi egasidan)
- **Dalil (kod):** ERP tomon slice **real va jonli** (`crm_leads`, `crm_activities`, deal-won listener). `crm-bitrix-compat.service.ts`/`.repository.ts` mavjud lekin **haqiqiy CSV/API import kodi yo'q** (0 hit).
- **Nima yetishmaydi:** eksport/import ko'prigi. **O'TISH REJASI = egasi-DATA** (bir martalik CSV yoki doimiy API ko'prik) — Q-40 bo'yicha to'qimadim.
- **Bog'liqlik:** EP-MKT-001 (two-worlds), EP-MKT-109 (dizayn kanban Bitrixdan)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (yagona baza), SD, Dizayn bo'limi (Bitrix24 kanban)
- **⚠️ ZIDDIYAT:** `[Module-14] Item 53` = **Qisman** (ERP slice real, ko'prik yo'q); `[Module-14] Item 61` = **Yo'q** (bir xil dalil, boshqa baho). Registrda **Qisman** olindi (maqsad-tizim mavjud, faqat ko'prik yo'q).
- **Xoch-havolalar:** `[Module-14] Item 53` · `[Module-14] Item 61` · `[Module-14] Item 18` · `EXTRACTION QISM C §14 #53/#61` · `EXTRACTION QISM D #18`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-084 · Takroriy buyurtmachining yo'qolishini erta sezish (churn) [v2-Q54]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-13 Δ)*
- **Talab:** A — mijozning o'z ritmiga nisbatan kechikkani aniqlanadi (Benazir har hafta, Fortech har 3 oy) → savdo menejerga signal. Kitob — daromad takroriy mijozdan, bittasi to'xtasa 2 oydan keyin sezamiz = kech. ShVB `customerRetention`; CRM churn kod (EP-CRM-014).
- **Manba:** kitob (Benazir/Panda/Krember ritmi) + ShVB (customerRetention) + CRM churn (EP-CRM-014) + v2-A
- **Dalil (kod):** Audit "per-ritm YO'Q, qat'iy 30/60/90" degan (`getChurnRisk`, `drizzle-marketing-ext.repo.ts:668-712` — bu qism to'g'ri). **AMMO** `application/customer-rhythm.service.ts` + `presentation/customer-rhythm.controller.ts` (`GET marketing/customers/:customerId/rhythm`, `@Roles('super_admin','marketing_manager','manager','director')`) `c8b2efd9` (2026-07-10) bilan qurilgan: `minOrders` **`marketing_settings` dan sozlanadi**, `avgIntervalDays`, `rhythmAvailable`, `ordersUntilRhythm` qaytaradi. **Δ:** `8fd71616` — Churn ro'yxati yaratilgan yozuvlarni ko'rsatmasdi.
- **Nima yetishmaydi:** ritm hisobi **churn signaliga ulanmagan** — `getChurnRisk` hamon qat'iy 30/60/90 kun ishlatadi; menejerga **push signal** yo'q (faqat READ so'rov).
- **Bog'liqlik:** EP-MKT-080, EP-MKT-104, EP-MKT-085
- **action:** AI
- **⤳ Ta'sir:** SD savdo tarixi, CRM, Bildirishnoma
- **⚠️ ZIDDIYAT:** `[Module-14] Item 11` = **Yo'q** ("grep `ritm\b` faqat `qc/delta-e.service.ts` ni topdi"), lekin `customer-rhythm.service.ts` audit sanasidan **1 kun oldin** qurilgan — grep naqshi `ritm` inglizcha `rhythm` ni topa olmagan. Item 54/62 = Qisman (churn qismi to'g'ri).
- **Xoch-havolalar:** `[Module-14] Item 11` · `[Module-14] Item 54` · `[Module-14] Item 62` · `EXTRACTION QISM C §14 #54/#62` · `EXTRACTION QISM A #11`
- **Δ 2026-07-11→08-07:** `8fd71616` (2026-07-13) — Churn ro'yxati FE'da bo'sh chiqardi; tuzatildi.

### EP-MKT-085 · "Kichiklashgan buyurtmalar" signali (M.Nosirov tahlili) [v2-Q55]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — avtomatik: mijozning oylik buyurtma summasi/soni/razmeri tushsa "kamayish" belgisi + sabab so'raladi. Kitob — Nosirov "Kichiklashgan buyurtmalar tahlili" Excel (razmer eski→yangi, foyda/dona, foyda/kg) ERPga avtomatlashtiriladi. Sub: kamayish sabab ro'yxati (raqib/sifat/biznes qisqardi/razmer) A.
- **Manba:** kitob (Nosirov Kichiklashgan buyurtmalar Excel) + v2-A
- **Dalil (kod):** Audit uch marta (Item 12/55/63) "**Yo'q**, grep `shrink|kichiklash` = 0" degan. **AMMO** `application/order-trend.service.ts` `8832a34d` (2026-07-10) bilan qurilgan va `GET marketing/analytics/order-trend` da ochiq (`marketing-analytics.controller.ts:226`), `marketing.module.ts:73` da ro'yxatdan o'tgan. Fayl izohi: "*Vision 14-marketing #12 (dup #55/#63) — 'Kichiklashgan buyurtma' signali… keyed strictly on money value (`sales_orders.total_amount`), not size or quantity*". `RECENT_WINDOW=1`, `MIN_ORDERS_FOR_TREND=3`, ixtiyoriy chegara `marketing_settings` KV (`marketing.order_trend.min_decline_pct`, default 0).
- **Nima yetishmaydi:** signal faqat **READ endpoint** — avto-bildirishnoma/kanban vazifasi yo'q; "sabab so'raladi" oqimi yo'q; foyda/dona va foyda/kg o'lchovlari (Nosirov Excel) hisoblanmaydi.
- **Bog'liqlik:** EP-MKT-084 (ritm), EP-MKT-111 (foyda/dona), EP-MKT-104
- **action:** AI
- **⤳ Ta'sir:** SD, Moliya (daromad trendi, foyda/kg)
- **⚠️ ZIDDIYAT:** `[Module-14] Item 12/55/63` va `EXTRACTION QISM C §14 #55/#63` hammasi "**Yo'q**" deydi — uchalasi ham bir xil grep naqshiga (`shrink|kichiklash`) tayangan va `order-trend` nomini o'tkazib yuborgan. Jonli kodda servis **bor**.
- **Xoch-havolalar:** `[Module-14] Item 12` · `[Module-14] Item 55` · `[Module-14] Item 63` · `EXTRACTION QISM C §14 #55/#63` · `EXTRACTION QISM A #12`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-086 · Mijoz brend standartlari kutubxonasi (MIJOZ brendi) [v2-Q56]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mijoz kartochkasida "brend pasporti": logo fayl + rang kodlari (Pantone/CMYK) + shrift + taqiqlar. Kitob — дизайн "брен стандартлари" = MIJOZ brendi (Tefal qizil noto'g'ri chiqsa rad). Sub: kim yuritadi — A (dizayn bo'limi rahbari). v2-Q51 (bizning material) dan FARQLI.
- **Manba:** kitob (брен стандартлари = mijoz brendi, Tefal/Benazir) + v2-A
- **Dalil (kod):** `SELECT count(*) FROM brand_templates` → **0**; `grep -rln "pantone" apps/api/src` → **0 fayl** (jumladan `lib/db/src/schema`). `brand_passport` jadval/ustun yo'q.
- **Nima yetishmaydi:** `brand_passport` modeli (logo/Pantone/CMYK/shrift/taqiq) + mijoz kartasiga bog'lash; Pantone o'zgarganda dizayn/QC ga avto-bildirishnoma (Item 41).
- **Bog'liqlik:** EP-MKT-081 (bizning material — FARQLI), Dizayn ЦКП, Sifat
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi (ЦКП), SD mijoz kartasi, Sifat
- **Xoch-havolalar:** `[Module-14] Item 56` · `[Module-14] Item 64` · `[Module-14] Item 41` · `EXTRACTION QISM C §14 #56/#64` · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-087 · Mahsulot namunalari portfolio (bizning ish ko'rgazmasi) [v2-Q57]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mahsulot turi bo'yicha portfolio (shirinlik/pizza/filtr/etiketka/gofra) — namuna rasmlar + texnik imkoniyat. Kitob — B2B "mening qutimni qila olasizmi", avval qilingan ish (Panda/Tefal A-19/Ganga Pizza) ishonch beradi. Sub: brendlangan PDF — A (ha).
- **Manba:** kitob (Panda/Tefal/Ganga namunalari) + v2-A
- **Dalil (kod):** `website_portfolio` jadvali + CRUD **real**, lekin `SELECT count(*)` → **0 qator** va tuzilishi umumiy veb-kontent CRUD — mahsulot-turi kaliti bo'yicha B2B savdo katalogi emas.
- **Nima yetishmaydi:** mahsulot-turi bo'yicha tuzilma; marketing/savdo-tomon API (veb moduldan ajratilgan); brendlangan PDF eksport; ma'lumot (0 qator).
- **Bog'liqlik:** EP-MKT-081, EP-MKT-089 (mahsulot turi), EP-MKT-097 (papka №)
- **action:** CREATE
- **⤳ Ta'sir:** SD savdo vositasi, Dizayn arxivi
- **Xoch-havolalar:** `[Module-14] Item 57` · `[Module-14] Item 65` · `EXTRACTION QISM C §14 #57/#65`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-088 · "Опросный лист" (mijoz brifi) — marketing/savdo kirish nuqtasi [v2-Q58]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lid'dagi talab ("Benazir uchun 25x19x12 quti") опросный лист ga old-to'ldirilgan holda o'tadi. Kitob — опросный лист = тех карта asosi; lid ma'lumoti qayta yozilmasin. Tamoyil tasdiq; sub: опросный лист MAYDONLARI ro'yxatini kim kiritadi — A (bosh texnolog + savdo birga) egasidan.
- **Manba:** kitob (опросный лист→тех карта zanjiri) + v2-A (maydon-egasi egasidan)
- **Dalil (kod):** `grep -rln "oprosn|brif|questionnaire" apps/api/src` → faqat **HR/rekrutment/LMS** fayllari (`hr-questionnaire.controller.ts`, `recruitment-funnel.service.ts`, `lms-questionnaire.dto.ts`) — marketing/SD/dizayn kontekstida **0**.
- **Nima yetishmaydi:** опросный лист jadvali + lid→brif old-to'ldirish + draft saqlash + SD-transfer to'liqlik darvozasi (Item 23). **MAYDON RO'YXATI = egasi-DATA** (bosh texnolog + savdo).
- **Bog'liqlik:** EP-MKT-113 (dizayn upsell brifi), EP-MKT-118 (rekvizit darvozasi), EP-MKT-005
- **action:** CREATE
- **⤳ Ta'sir:** SD, Dizayn (опросный→тех карта→лаборатория), Ishlab chiqarish
- **Xoch-havolalar:** `[Module-14] Item 58` · `[Module-14] Item 66` · `[Module-14] Item 23` · `EXTRACTION QISM C §14 #58/#66` · `EXTRACTION QISM D #23`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-089 · Lid mahsulot turi bo'yicha tasniflash (zavod realiga mos) [v2-Q59]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lid'da mahsulot turi majburiy (ofset karton quti / gofra mikro-makro / etiketka samokley / flekso gofra / pechat blanka). Kitob — har tur boshqa dastgoh/narx/menejer. Sub: tur ro'yxati — A (ishlab chiqarish mahsulot turlari katalogidan, yagona master).
- **Manba:** kitob (zavod mahsulot turlari) + v2-A
- **Dalil (kod):** `information_schema.columns` tekshiruvi — `leads`, `crm_leads`, `marketing_leads` **uchalasida ham `product_type` ustuni YO'Q**.
- **Nima yetishmaydi:** `product_type` ustuni (ishlab chiqarish katalogidan FK) + majburiy validatsiya. Bu **4 ta boshqa bandning ildizi**: EP-MKT-047 (taqsimlash), EP-MKT-045 (majburiy maydon), EP-MKT-106 (tur-talab statistikasi), Item 22 (menejer/preyskurant tavsiyasi).
- **Bog'liqlik:** EP-MKT-045, EP-MKT-047, EP-MKT-106, EP-MKT-096
- **action:** CREATE
- **⤳ Ta'sir:** SD, Ishlab chiqarish (mahsulot turi→dastgoh)
- **Xoch-havolalar:** `[Module-14] Item 59` · `[Module-14] Item 67` · `[Module-14] Item 22` · `EXTRACTION QISM C §14 #59/#67` · `EXTRACTION QISM D #22`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-090 · Savdo menejerga lid biriktirish ("Menedjer" ustuni) [v2-Q60]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — lid keladi → menejerga biriktiriladi (mahsulot turi/hudud bo'yicha avtomatik), biriktirilmagan lid "egasiz" ro'yxatida qizil. Kitob — buyurtma Excel "Azizov Avazxon - Menedjer (54)" ustuni; "egasiz lid = o'lik lid". EP-MKT-047 (umumiy qoida) dan aniq holat.
- **Manba:** kitob (Menedjer ustuni, Azizov) + v2-A
- **Dalil (kod):** `assigned_to`/`manager_id` ustunlari real; `pickNextSalesManager` round-robin mavjud va **qayta-taqsimlash** croni tomonidan ishlatiladi. Ammo `grep "egasiz|unassigned.*red"` → **yangi lid yaratilganda avto-tayinlash yo'li tasdiqlanmadi**, "egasiz = qizil" ro'yxat/belgisi yo'q.
- **Nima yetishmaydi:** lid CREATE paytida avto-tayinlash; "egasiz lid" qizil filtri/ro'yxati; mahsulot-turi/hudud qoidasi (EP-MKT-089/102 ustunlari yo'q).
- **Bog'liqlik:** EP-MKT-047, EP-MKT-089, EP-MKT-102, EP-MKT-112
- **action:** CREATE
- **⤳ Ta'sir:** SD menejer, HR (menejer KPI)
- **Xoch-havolalar:** `[Module-14] Item 68` · `[Module-14] Item 37` · `EXTRACTION QISM C §14 #68/#17`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-091 · Mijozning to'lov intizomi marketingga signal [v2-Q61]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz/lid kartasida to'lov intizomi belgisi (Moliyadan: kechikkan to'lov, qarz) ko'rinadi. Kitob ruhi — to'lamaydigan mijozга vaqt sarflash zarar (Дебитор siyosati). Sub: ogohlantirishmi yoki bloklaydimi — A (ogohlantirish, qaror menejerda) tavsiya, egasidan (Finance bilan).
- **Manba:** kitob (Дебитор қарздорлик siyosati) + v2-A (blok/ogoh egasidan)
- **Dalil (kod):** `getChurnRisk` `sd_customers.openDebt` ni **o'qiydi**, lekin bu churn-risk agregati — **lid kartasida ko'rinadigan AR-belgi emas**. AR→marketing kunlik sync croni yo'q (`grep marketing cron` → faqat NPS listener).
- **Nima yetishmaydi:** lid/mijoz kartasida AR-belgi + kunlik sync cron + 48-soatlik menejer eslatmasi; maydon-darajali RBAC (oddiy menejer summani ko'rmasin — Item 30). **BLOK yoki OGOHLANTIRISH tanlovi = egasi-DATA** (Finance bilan).
- **Bog'liqlik:** EP-MKT-111 (foyda maxfiyligi), Moliya AR
- **action:** READ
- **⤳ Ta'sir:** Moliya (AR/qarz), SD, CRM
- **Xoch-havolalar:** `[Module-14] Item 69` · `[Module-14] Item 32` · `[Module-14] Item 30` · `EXTRACTION QISM C §14 #69` · `EXTRACTION QISM D #30/#32`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-092 · Mavsumiy talab kalendari (zavod mavsumlariga mos) [v2-Q62]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mavsumiy talab kalendari (o'tgan yillar buyurtma tarixidan avtomatik) + "shu mijozga shu oyda qo'ng'iroq qil" eslatmasi. Kitob — Yangi yil oldidan Benazir/Panda 3x oshadi, dastgoh band bo'lishidan oldin band qilamiz (Bandlik.xlsx). v2-Q38 (kontent kalendari) dan FARQLI = talab kalendari.
- **Manba:** kitob (Yangi yil shirinlik 3x, Bandlik.xlsx) + v2-A
- **Dalil (kod):** `grep "seasonal" marketing pp` → `seasonal` faqat `pp/application/services/pp-intelligence.service.ts` da (PP ning o'z AI/forecast mantiqi) — **marketingdan PP ga oqadigan signal YO'Q**; vizyon talab qilgan yo'nalish (marketing → PP orientir) qurilmagan.
- **Nima yetishmaydi:** mavsumiy talab kalendari (tarixdan avtomatik) + "shu oyda qo'ng'iroq qil" eslatmasi + PP/MPS ga orientir signal.
- **Bog'liqlik:** EP-MKT-095 (yillik forecast), EP-MKT-114 (mijoz aksiya kalendari), PP/MPS
- **action:** AI
- **⤳ Ta'sir:** SD, Ishlab chiqarish rejasi (dastgoh bandligi)
- **Xoch-havolalar:** `[Module-14] Item 70` · `[Module-14] Item 21` · `EXTRACTION QISM C §14 #70` · `EXTRACTION QISM D #21`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-093 · Dizayn namuna (макет) tasdiqlash marketing voronkasida [v2-Q63]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — voronkaga "Namuna tayyorlandi → Namuna tasdiqida → Tasdiqlandi (подписной лист)" bosqichlari qo'shiladi. Kitob — подписной лист = mijoz tasdiqlagan dizayn = dizayn ЦКП si; sotuvning haqiqiy "ha" nuqtasi. EP-MKT-049 voronka bilan. v2-Q19 dan FARQLI.
- **Manba:** kitob (подписной лист = ЦКП) + v2-A
- **Dalil (kod):** `grep "подписн|signed.*list|subscription.*list" marketing crm` → **0 mos**; voronka bosqichlari erkin matn (`crm_lead_stages`/`getMarketingFunnel` umumiy).
- **Nima yetishmaydi:** B2B bosqich nomlari (Namuna→tasdiqda→Tasdiqlandi) enum sifatida; подписной лист artefakti + dizayn ЦКП bog'lanishi.
- **Bog'liqlik:** EP-MKT-049 (🔵 nomlar), EP-MKT-004, EP-MKT-075
- **action:** UPDATE
- **⤳ Ta'sir:** Dizayn bo'limi (подписной лист), CRM voronka, SD
- **Xoch-havolalar:** `[Module-14] Item 71` · `EXTRACTION QISM C §14 #71`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-094 · Mahsulot namunasi (fizik sample) XARAJATI va ROI [v2-Q64]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — namuna so'rovi kartochkasi: material+vaqt xarajati + natija (mijoz bo'ldimi) → namuna ROI va konversiya. Kitob ruhi — bepul namuna berib mijoz topmaslik = sof zarar. EP-MKT-075 (qayd) dan chuqurroq. Sub: namuna xarajati CPLга qo'shiladimi — A (ha).
- **Manba:** kitob (namuna xarajati hisobi) + Ombor (material chiqimi) + v2-A
- **Dalil (kod):** `ow_order_samples` jadvali real (0 qator), ustunlari: `id, order_id, iteration, requested_at, produced_at, customer_decision, feedback, rejection_reason` — **xarajat/material/ROI ustuni umuman YO'Q**.
- **Nima yetishmaydi:** material+vaqt xarajati ustunlari; namuna→konversiya/ROI hisobi; xarajatni CPLga qo'shish; MM material chiqimi bog'lanishi.
- **Bog'liqlik:** EP-MKT-075, EP-MKT-052 (CPL), Ombor (MM)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (material chiqimi), Moliya (xarajat), CRM
- **Xoch-havolalar:** `[Module-14] Item 72` · `[Module-14] Item 14` · `EXTRACTION QISM C §14 #72`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-095 · Mijozning kelajak ehtiyoji — yillik forecast olish [v2-Q65]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yirik mijozdan yillik ehtiyoj prognozi olinadi → ishlab chiqarish/material rejasiga ulanadi (orientir, majburiyat emas). Kitob — Benazir "yilda 500 ming quti", material+dastgoh oldindan reja, B2B sodiqlik vositasi.
- **Manba:** kitob (yirik mijoz yillik ehtiyoj) + v2-A
- **Dalil (kod):** `grep "customerForecast|annualForecast|mijoz.*forecast|yillik.*forecast" apps/api/src` → **0 mos** butun backendda. Mijoz-forecast olish/saqlash endpointi/jadvali yo'q.
- **Nima yetishmaydi:** mijoz-forecast CREATE (jadval + endpoint) + PP/MPS ga orientir signal + ±30% og'ish ogohlantirishi.
- **Bog'liqlik:** EP-MKT-092, EP-MKT-114, PP/MPS
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish rejasi (MPS), Ombor (material), Moliya
- **Xoch-havolalar:** `[Module-14] Item 73` · `[Module-14] Item 36` · `EXTRACTION QISM C §14 #73` · `EXTRACTION QISM D #36`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-096 · Lid texnik amalga oshirilishi (biz qila olamizmi) tekshiruvi [v2-Q66]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lid talabini texnik imkoniyatga (dastgoh formati/material — "Формат листа"/"Формат гофро") avtomatik solishtirish → "qila olamiz/qiyin/yo'q". Kitob — yolg'on va'da (keyin ishlab chiqarish "qila olmaymiz") sharmandalik. Sub: qila olmasak alternativa — A (eng yaqin imkoniyat).
- **Manba:** kitob (Формат листа/гофро texnik chegara) + v2-A
- **Dalil (kod):** `grep "dastgoh.*format|machineCapability|technicalFeasib" apps/api/src` → **0 mos** — lid qabuliga bog'langan dastgoh-format/material solishtirish mantiqi yo'q.
- **Nima yetishmaydi:** PP dastgoh-imkoniyat ma'lumotini so'rovga ochish + lid talabini solishtirish + "qila olamiz/qiyin/yo'q" natijasi + eng yaqin alternativa taklifi.
- **Bog'liqlik:** EP-MKT-089 (mahsulot turi), PP (dastgoh formati)
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish (dastgoh formati), Dizayn
- **Xoch-havolalar:** `[Module-14] Item 74` · `EXTRACTION QISM C §14 #74`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-097 · Papka raqami (PT/KT/E) bo'yicha "takror qil" tezligi [v2-Q67]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz kartasida barcha papka raqamlari (PT/KT/E) + oxirgi buyurtma → "takror qil" bir tugma (eski тех карта + yangi narx). Kitob — PT1153/KT3919/E9358 kodlari; "o'tgan yilgi Tefal A-19 qutini qaytadan" noldan ishlash kerak emas = savdo tezligi.
- **Manba:** kitob (папка № PT/KT/E + Tefal A-19) + v2-A
- **Dalil (kod):** `grep "reorder" crm marketing` → faqat `crm-custom-fields.service.ts` ning aloqasiz `reorder()` metodi (maydon tartibini surish). Papka-raqami bo'yicha takror-buyurtma qidiruvi **yo'q**. SD tomonda `SDSalesOrders.tsx:356-390, 820-869` da `repeatForm` mavjud, lekin **eski narxni** default qiladi (yangi joriy narx avto-tortilmaydi).
- **Nima yetishmaydi:** mijoz kartasida papka № ro'yxati; "takror qil" tugmasi; eski тех карта + **joriy** narx avtomatik almashuvi.
- **Bog'liqlik:** EP-MKT-087 (portfolio), SD RepeatOrder
- **action:** CREATE
- **⤳ Ta'sir:** SD, Dizayn arxivi (макет), Ishlab chiqarish (тех карта)
- **Xoch-havolalar:** `[Module-14] Item 75` · `[Module-14] Item 39` · `EXTRACTION QISM C §14 #75` · `EXTRACTION QISM D #39`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-098 · Mijoz "wallet share" — u bizdan yana nimani olishi mumkin [v2-Q68]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz kartasida "biz qilayotgan / qila oladigan lekin olmayotgan" mahsulotlar + AI tavsiyasi. Kitob — Benazir 7 xil quti, lekin etiketkani boshqadan olsa biz ham olishimiz mumkin. Vizyon 70% AI-tahlil (upsell).
- **Manba:** kitob (Benazir 7 xil quti, upsell) + LOYIHA-BITGAN (70% AI) + v2-A
- **Dalil (kod):** `grep "walletShare|wallet.share" apps/api/src` → **0 mos**. `upsell` faqat `rfm.service.ts` va `customer-360.builder/helpers.ts` da umumiy RFM yorlig'i sifatida. `marketing-ai.service.ts` faqat kontent/SEO.
- **Nima yetishmaydi:** mijoz×mahsulot matritsasi (olayotgan / olmayotgan) + AI tavsiya generatori + 90 kunlik TTL + "eskirgan" belgisi.
- **Bog'liqlik:** EP-MKT-021 (AI), EP-MKT-113 (dizayn upsell), EP-MKT-105
- **action:** AI
- **⤳ Ta'sir:** SD (upsell), mahsulot katalogi
- **Xoch-havolalar:** `[Module-14] Item 76` · `[Module-14] Item 34` · `EXTRACTION QISM C §14 #76` · `EXTRACTION QISM D #34`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-099 · Mijoz qoniqishini sifat shikoyati bilan bog'lash [v2-Q69]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz kartasida shikoyat/brak tarixi (qc_reclamations) NPS bilan birga + brak bo'lsa avtomatik "uzr+chegirma". Kitob/Sifat — brak bo'lgan mijozga "tavsiya qilasizmi" so'rash noto'g'ri vaqt. v2-Q52 (NPS yig'ish) dan FARQLI.
- **Manba:** kitob/Sifat (qc_reclamations) + EP-MKT-016 (NPS harakat) + v2-A
- **Dalil (kod):** `grep "qc_reclamation|reclamation" apps/api/src/modules/marketing` → **0 mos**. NPS avto-triggeri real (EP-MKT-082), lekin uning ustida **QC-darvozasi yo'q** — har `delivery.completed` da so'rov yaratiladi, aktiv reklamatsiya tekshirilmaydi.
- **Nima yetishmaydi:** `NpsAutoRequestListener` oldiga QC-reklamatsiya gate'i + reklamatsiya yopilgach avto-davom; "noto'g'ri vaqt" bayrog'i; brak→uzr+chegirma oqimi.
- **Bog'liqlik:** EP-MKT-082, EP-MKT-015, EP-MKT-016, QC
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (reklamatsiya), CRM, SD
- **Xoch-havolalar:** `[Module-14] Item 77` · `[Module-14] Item 7` · `EXTRACTION QISM C §14 #77` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-100 · Yutilgan/yo'qotilgan lid sababi + raqobat surati (win/loss) [v2-Q70]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — har yutilgan/yo'qolgan lid'da raqib nomi + sabab (narx/sifat/muddat) majburiy → raqobat va sabab hisoboti. Kitob — Qo'qon/vodiy raqobat, "X zavod arzonroq qildi" to'planib turса dalil bilan moslaymiz. v2-Q48 (umumiy raqobat) + EP-MKT-050 (sabab) bilan, lekin har lid bo'yicha aniq.
- **Manba:** kitob (vodiy raqobat, win/loss) + EP-MKT-078 + v2-A
- **Dalil (kod):** `lost_reason` `leads` va `crm_leads` da real; `getLossAnalysis` real hisobot. Ammo **`competitor`/`raqib` ustuni yo'qotish yo'lida YO'Q** (`information_schema` tekshiruvi bilan tasdiqlangan).
- **Nima yetishmaydi:** `competitor_name` ustuni + majburiy validatsiya; sabab enum (EP-MKT-050 🔵); raqib-kesim hisobot.
- **Bog'liqlik:** EP-MKT-029, EP-MKT-050, EP-MKT-078
- **action:** UPDATE
- **⤳ Ta'sir:** SD, narx siyosati (Moliya)
- **Xoch-havolalar:** `[Module-14] Item 78` · `EXTRACTION QISM C §14 #78`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-101 · Sotuvchi tavsiya skripti (karta-darslik modeliga mos) [v2-Q71]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mahsulot bo'yicha savdo skripti + FAQ (lavozim kartasi darsligiga bog'liq). Kitob/vizyon — har lavozimda "darslik+nazorat varaqasi" (karta-markazli); darslik kartaga biriktirilgan (memory org_card). Yangi menejer tez ishga tushadi.
- **Manba:** master reja karta-markazli (darslik kartaga) + kitob (RD-5 darslik) + v2-A
- **Dalil (kod):** `grep "savdo.*skript|sales.*script|salesScript" apps/api/src` → faqat kalit-so'z ustma-ustligi bo'yicha aloqasiz fayllar (SD sales-order so'rovlari, dizayn agregatlari, kanban card repo, ai-agents controller) — skript/FAQ kutubxonasi **yo'q**. `email_templates` boshqa maqsad uchun.
- **Nima yetishmaydi:** savdo-skript/FAQ kutubxonasi + lavozim kartasi darsligiga bog'lash (LMS). Karta FK yo'q (EP-MKT-020) → bog'lanadigan tugun ham yo'q.
- **Bog'liqlik:** EP-MKT-020, EP-MKT-065 (inbox shablonlari), LMS
- **action:** READ
- **⤳ Ta'sir:** HR (lavozim kartasi+darslik), LMS, karta-model
- **Xoch-havolalar:** `[Module-14] Item 79` · `[Module-14] Item 38` · `EXTRACTION QISM C §14 #79` · `EXTRACTION QISM D #38`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-102 · Hudud/eksport segmenti (Qo'qon + vodiy + Tojikiston) [v2-Q72]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mijoz/lid hudud (viloyat/davlat) + eksport/ichki belgisi + hudud bo'yicha savdo xaritasi. Kitob — "Apricot usti qizil (Tojikiston)"; eksport boshqa hujjat+narx. v2-Q10 (kampaniya geo) dan FARQLI = mijoz segmenti.
- **Manba:** kitob (Tojikiston eksport) + v2-A
- **Dalil (kod):** `information_schema.columns` — `leads` da `region` ham, `export_flag` ham **YO'Q**; hech bir lid jadvalida topilmadi.
- **Nima yetishmaydi:** `region` + `is_export` ustunlari; hudud bo'yicha savdo xaritasi; Logistika narx-jadvaliga ulanish.
- **Bog'liqlik:** EP-MKT-040 (kampaniya geo — FARQLI), EP-MKT-047 (hudud qoidasi), Logistika
- **action:** CREATE
- **⤳ Ta'sir:** SD, Logistika (yetkazib berish), Moliya
- **Xoch-havolalar:** `[Module-14] Item 80` · `EXTRACTION QISM C §14 #80`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-103 · Mijoz aloqa shaxsi (kontakt) o'zgarishini kuzatish [v2-Q73]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mijozda bir nechta kontakt + "asosiy kontakt o'zgardi" belgisi → darrov aloqa vazifasi. Kitob ruhi — xaridor almashganda yangi odam eski yetkazuvchisini olib keladi, biz yo'qolamiz; tez munosabat quramiz.
- **Manba:** kitob (kontakt almashish xavfi) + v2-A
- **Dalil (kod):** `lib/db/src/schema/marketing-schema.ts:630-651` `marketingLeadContacts` jadvali real + CRUD (`marketing-group2.*`). **AMMO** bu **aloqa-urinishlari jurnali** modeli (`type: call/meeting/email/whatsapp/telegram`, `outcome`), alohida kontakt-**shaxs** yozuvi emas; "asosiy kontakt" bayrog'i yo'q.
- **Nima yetishmaydi:** ko'p-shaxs kontakt modeli + `is_primary` bayrog'i + "asosiy kontakt o'zgardi" triggeri + 48-soatlik Kanban vazifasi.
- **Bog'liqlik:** EP-MKT-104 (dormant), CRM kontaktlari
- **action:** UPDATE
- **⤳ Ta'sir:** SD, CRM
- **Xoch-havolalar:** `[Module-14] Item 81` · `[Module-14] Item 48` · `EXTRACTION QISM C §14 #81` · `EXTRACTION QISM D #48`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-104 · "Sovuq" eski mijozni qayta uyg'otish (win-back, dormant) [v2-Q74]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "uzoq sukut saqlagan eski mijoz" ro'yxati (mijoz ritmiga nisbatan) + qayta aloqa vazifasi menejerga. Kitob — 2023 yilgi ko'p papka; eski mijoz tanish/ishonchli, "sog'indik" qo'ng'irog'i bir qismini qaytaradi = deyarli bepul savdo. v2-Q50 (aktiv sodiqlik) dan FARQLI = dormant.
- **Manba:** kitob (2023 papka, dormant) + EP-MKT-084 churn + v2-A
- **Dalil (kod):** `sd_customer_competitors.win_back_potential` — real varchar ustun, lekin **qo'lda kiritiladi**; avto-hisoblangan dormant-segment yoki avto-triggerli win-back vazifasi yo'q. `rfm.service.ts` faqat `'At-Risk'` yorlig'i.
- **Nima yetishmaydi:** dormant avto-segment (mijoz **ritmiga** nisbatan — EP-MKT-084 dagi `customer-rhythm.service` bilan ulanishi mumkin) + menejerga win-back vazifasi + SD aktiv-lid tekshiruvi.
- **Bog'liqlik:** EP-MKT-080, EP-MKT-084 (ritm servisi mavjud), EP-MKT-103
- **action:** AI
- **⤳ Ta'sir:** SD savdo tarixi, CRM
- **Xoch-havolalar:** `[Module-14] Item 82` · `[Module-14] Item 46` · `EXTRACTION QISM C §14 #82` · `EXTRACTION QISM D #46`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-105 · Mijoz toifalash (ABC) → xizmat darajasi [v2-Q75]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik ABC (yillik summa+takror+foyda) + har toifaga xizmat darajasi (A-mijoz ustuvor reja+narx). Kitob — A mijoz (Benazir/Panda) ketsa katta zarar, doimiy e'tibor; C ga ko'p vaqt zarar. sd_customers ABC kod bor (EP-SD-007).
- **Manba:** mavjud sd_customers ABC (EP-SD-007) + kitob (A/B/C mijoz) + v2-A
- **Dalil (kod):** `sd/application/customer-abc.service.ts:86 recompute()` real, `sd_customers.abc_class` ga yozadi. Ammo bu **paketli qayta-hisob**, buyurtma-yopilish listeneri **YO'Q** (real-time emas); marketing tomonda xizmat-darajasi mantiqi umuman yo'q.
- **Nima yetishmaydi:** `order.closed` listeneri (real-time ABC); har toifaga xizmat darajasi ta'rifi; A→B tushganda xizmat o'zgarishi + menejer almashtirish tavsiyasi.
- **Bog'liqlik:** EP-MKT-039 (segment), EP-MKT-111 (foyda), SD ABC
- **action:** AI
- **⤳ Ta'sir:** SD (ABC), Moliya
- **Xoch-havolalar:** `[Module-14] Item 83` · `[Module-14] Item 29` · `EXTRACTION QISM C §14 #83` · `EXTRACTION QISM D #29`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-106 · Yangi mahsulot turi talabini o'lchash (flekso liniya qarori) [v2-Q76]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — so'rov/lid'larda mahsulot turi statistikasi → "qaysi turga talab o'syapti" → egasi + Rivojlanish bo'limi (6-departament) hisoboti. Kitob/egasi — flekso gofra 90 metrli liniya rejada; investitsiya dalilli. Q909 6-dep = Marketing strategiyasi/Innovatsiya.
- **Manba:** kitob (flekso liniya rejasi) + BARCHA_JAVOBLAR Q909 (6-dep Rivojlanish) + v2-A
- **Dalil (kod):** `grep "dept6|6.departament|Rivojlanish" marketing` → **0 mos**. Ildiz sabab: `product_type` ustuni hech bir lid jadvalida yo'q (EP-MKT-089) → statistika quriladigan manba ham yo'q.
- **Nima yetishmaydi:** `product_type` ustuni (EP-MKT-089 avval) + tur-talab statistikasi + oylik 6-departamentga avto-hisobot + 10+ so'rovda darhol bildirishnoma.
- **Bog'liqlik:** EP-MKT-089 (ildiz), 6-departament (Rivojlanish)
- **action:** AI
- **⤳ Ta'sir:** SD, Ishlab chiqarish (yangi liniya), 6-departament (Rivojlanish)
- **Xoch-havolalar:** `[Module-14] Item 84` · `[Module-14] Item 47` · `EXTRACTION QISM C §14 #84` · `EXTRACTION QISM D #47`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-107 · Mijozga buyurtma holati shaffofligi (B2B kuzatuv) [v2-Q77]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijozga buyurtma holati ko'rinadigan link/bot (faqat o'z buyurtmasi, umumiy bosqich+%). Kitob — B2B mijoz "qutim tayyormi" deb qo'ng'iroq qiladi, menejer vaqtini oladi; mijoz o'zi ko'rsa qo'ng'iroq kamayadi, ishonch ortadi. Egasi Telegram bot ekotizimi.
- **Manba:** kitob (B2B kuzatuv talabi) + egasi Telegram bot + v2-A
- **Dalil (kod):** `grep "orderStatusLink|status.*bot|buyurtma.*holati.*link"` → faqat kalit-so'z ustma-ustligi bo'yicha aloqasiz fayllar. `order-workflow` sagasida progress ma'lumoti bor (`get-order-saga.handler.ts`) lekin **tashqariga ochilmagan**. Telegram bot: `setupTelegramWebhook` bor, lekin polling fallback yo'q (Item 50).
- **Nima yetishmaydi:** mijozga-ochiq token-li status linki yoki Telegram bot komandasi; sagadan progress % ni tashqi API ga chiqarish; faqat-o'z-buyurtmasi cheklovi.
- **Bog'liqlik:** EP-MKT-062 (Telegram provayder), POS Monitor, SD
- **action:** READ
- **⤳ Ta'sir:** SD, Ishlab chiqarish (буюртма тайёрлиги %), POS Monitor
- **Xoch-havolalar:** `[Module-14] Item 85` · `[Module-14] Item 50` · `EXTRACTION QISM C §14 #85` · `EXTRACTION QISM D #50`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-108 · Sodiqlik imtiyozi qoidasi (B2B bonus, suiiste'molsiz) [v2-Q78]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — sodiqlik darajasi (yillik hajmga ko'ra) + avtomatik imtiyoz qoidasi (ega+savdo boshlig'i belgilaydi). Kitob — chegirma menejer kayfiyatiga bog'liq = suiiste'mol xavfi; qoida asosida adolatli/shaffof. v2-Q50 (aloqa kampaniyasi) dan FARQLI = imtiyoz QOIDASI.
- **Manba:** kitob (chegirma suiiste'mol xavfi) + v2-A
- **Dalil (kod):** `grep "avto.*chegirma|autoDiscount|loyaltyDiscount" apps/api/src` → **0 mos**; `grep "sodiqlik|loyalty" marketing` → **0 mos**. Sodiqlik-daraja tushunchasi butunlay yo'q.
- **Nima yetishmaydi:** sodiqlik darajasi (yillik hajm chegaralari — **egasi-DATA**, `business_settings` ga qo'shilishi kerak) + avto-imtiyoz qoidasi + toifa tushganda eski shartnomalarni saqlash qoidasi (Item 15).
- **Bog'liqlik:** EP-MKT-042 (promo-kod), EP-MKT-080, EP-MKT-105 (ABC)
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx), Moliya
- **Xoch-havolalar:** `[Module-14] Item 86` · `[Module-14] Item 15` · `EXTRACTION QISM C §14 #86` · `EXTRACTION QISM D #15`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-109 · Marketing va Dizayn bo'limi ish yuki muvozanati [v2-Q79]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — marketing dizayn bo'limi bandligini (kanban yuki) ko'radi → realdan ko'p va'da bermaydi. Kitob — bir nechta buyurtma birga kelganda rahbar ustuvorlik belgilaydi; dizayn 2 hafta kechiksa mijoz ketadi. Bitrix24→ERP kanban (EP-MKT-083).
- **Manba:** kitob (dizayn ustuvorlik, tor bo'g'in) + v2-A
- **Dalil (kod):** `grep "kanban.*yuk|kanbanWorkload|design.*workload" apps/api/src` → **0 mos**; `grep -rln "kanban" marketing --include=*.ts` → **bo'sh** — marketing modulida kanban integratsiyasi umuman yo'q.
- **Nima yetishmaydi:** Kanban moduldan ish-yuki so'rovi API + marketing panelida ko'rsatish; dizayn bosqichida avto-vazifa (Item 8).
- **Bog'liqlik:** EP-MKT-070 (kontent tasdiq oqimi), EP-MKT-083 (Bitrix kanban), Kanban
- **action:** READ
- **⤳ Ta'sir:** Dizayn bo'limi (ish taqsimoti), Ishlab chiqarish rejasi, CRM
- **Xoch-havolalar:** `[Module-14] Item 87` · `[Module-14] Item 8` · `EXTRACTION QISM C §14 #87` · `EXTRACTION QISM D #8`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-110 · Ishlab chiqarish bo'sh quvvatini to'ldirish signali [v2-Q80]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ishlab chiqarish bo'sh quvvati marketingga signal → "bo'sh davr aksiyasi" (ega+savdo boshlig'i tasdiqlaydi). Kitob — dastgoh bo'sh tursa sof zarar (ijara/oylik to'lanadi); Bandlik.xlsx quvvat. Aksiya bilan bo'shliqni to'ldiramiz.
- **Manba:** kitob (Bandlik.xlsx bo'sh dastgoh zarar) + v2-A
- **Dalil (kod):** `grep "bo.sh.quvvat|idleCapacity|emptyCapacity" apps/api/src` → **0 mos** (MES/PP ni ham qamrab); `grep "bo.sh.davr|idle.*promo|slow.*period"` → **0 mos**.
- **Nima yetishmaydi:** MES/PP dan bo'sh-quvvat eventi + marketingda "bo'sh davr aksiyasi" taklifi + ega/savdo boshlig'i Kanban tasdig'i + 48 soat timeout.
- **Bog'liqlik:** EP-MKT-092 (mavsumiy), MES/PP quvvat
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (dastgoh bandligi), SD, Moliya
- **Xoch-havolalar:** `[Module-14] Item 88` · `[Module-14] Item 28` · `EXTRACTION QISM C §14 #88` · `EXTRACTION QISM D #28`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-111 · Mahsulot rentabelligi marketing fokusini yo'naltirsinmi [v2-Q81]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz/mahsulot foyda darajasi marketingga ko'rinadi (faqat boshliq+ega — maxfiy) → yuqori foydaliga e'tibor. Kitob — Nosirov foyda/dona, foyda/kg; ko'p buyurtma ≠ ko'p foyda. Rol-asosli maxfiylik (CRM Q13).
- **Manba:** kitob (Nosirov foyda/dona, foyda/kg) + rol-maxfiylik (CRM Q13) + v2-A
- **Dalil (kod):** `grep "profitLevel|foydaDaraja" marketing` → **0 mos**. `marketing-roi.service.ts` dagi `profitAbsolute` (171-172) — oddiy maydon, **RBAC qo'riqchisi yo'q, CSV-eksport maskasi yo'q**. Moliya foydasi marketingga ulanmagan.
- **Nima yetishmaydi:** Moliyadan foyda/dona, foyda/kg feed'i + **maydon-darajali RBAC** (boshliq/ega ko'radi) + CSV eksportda foyda ustunlarini yashirish.
- **Bog'liqlik:** EP-MKT-051 (FIFO), EP-MKT-091 (AR maxfiyligi), EP-MKT-019 (RBAC)
- **action:** READ
- **⤳ Ta'sir:** Moliya (foyda/dona, foyda/kg), SD
- **Xoch-havolalar:** `[Module-14] Item 89` · `[Module-14] Item 44` · `EXTRACTION QISM C §14 #89` · `EXTRACTION QISM D #44`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-112 · Savdo menejer faolligi (karta statistik ko'rsatkichi) [v2-Q82]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — menejer kartasida faollik (aloqa soni, qisman CRMдан avtomatik) + natija (buyurtma/summa). Kitob — har lavozimda "статистик кўрсаткичлар" (karta-markazli); faollik past bo'lsa sabab aniqlanadi, adolatli. v2-Q47 (marketing KPI) dan FARQLI rol.
- **Manba:** kitob (lavozim статистик кўрсаткичлар) + karta-model + v2-A
- **Dalil (kod):** `[Module-14] Item 90` "sd_lead_activities bor lekin karta-statistikaga yig'ilmaydi" degan — **eskirgan**: `application/manager-kpi.service.ts` + `presentation/manager-kpi.controller.ts` (`GET marketing/managers/kpi`) `2d2d4659` (2026-07-10) bilan qurilgan va jonli kodda mavjud, aynan "savdo menejer KPI karta (faollik+natija)" nomi bilan.
- **Nima yetishmaydi:** natija **karta** (org_functions) ga bog'lanmagan — `card_id` FK yo'q (`RECONCILIATION SB0629`); real-time event-driven yangilanish yo'q (Item 19).
- **Bog'liqlik:** EP-MKT-077 (aynan bir servis), EP-MKT-020 (karta FK), EP-MKT-090
- **action:** READ
- **⤳ Ta'sir:** HR (lavozim kartasi, KPI), SD
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §14 #90` + `[Module-14] Item 90` = "**Yo'q**"; jonli kodda `manager-kpi.controller.ts` mavjud (audit sanasidan 1 kun oldingi commit).
- **Xoch-havolalar:** `[Module-14] Item 90` · `[Module-14] Item 19` · `EXTRACTION QISM C §14 #90/#47` · `RECONCILIATION SB0592/612`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-113 · Dizayn yangilash taklifi mijozga (upsell dizayn) [v2-Q83]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — dizayn yangilash takliflari ro'yxati → savdo menejer mijozga taqdim → qabul qilinsa опросный лист old-to'ldiriladi. Kitob — "yangi dizayn", "yangi lagatip" ko'p; eski qutini yangilab taklif = yangi buyurtma + sodiqlik. EP-MKT-088 опросный лист bilan.
- **Manba:** kitob (yangi dizayn/lagatip takliflari) + v2-A
- **Dalil (kod):** `grep "oprosn|brif|questionnaire"` → faqat HR/LMS; upsell-taklif jadvali ham yo'q (`walletShare` = 0 mos). Dizayn-upsell + brif old-to'ldirish kodi **yo'q**.
- **Nima yetishmaydi:** upsell taklif ro'yxati (mijoz eski maketlaridan) + опросный лист old-to'ldirish (EP-MKT-088 avval qurilishi kerak).
- **Bog'liqlik:** EP-MKT-088 (ildiz), EP-MKT-098 (wallet share), Dizayn
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi, SD, CRM
- **Xoch-havolalar:** `[Module-14] Item 91` · `EXTRACTION QISM C §14 #91`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-114 · Mijozning ishlab chiqarish/aksiya kalendariga moslashish [v2-Q84]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz kartasida uning mahsulot/aksiya kalendari + "shu sanadan oldin quti kerak" eslatmasi. Kitob — Benazir Yangi yil shirinligini noyabrda chiqaradi; rejasini bilsak proaktiv taklif. Sub: kalendarni kim kiritadi — A (savdo menejer mijozdan) / B (AI tarixdan taxmin). EP-MKT-092 mavsumiy bilan.
- **Manba:** kitob (Benazir noyabr aksiya) + v2-A
- **Dalil (kod):** `grep "aksiya.*kalendar|promoCalendar" apps/api/src` → **0 mos** — aksiya-kalendar jadvali ham, eslatma kodi ham yo'q.
- **Nima yetishmaydi:** mijoz aksiya-kalendari jadvali + "shu sanadan oldin quti kerak" eslatma croni. Kiritish usuli (menejer qo'lda yoki AI taxmin) sub-savol sifatida A/B qoldirilgan.
- **Bog'liqlik:** EP-MKT-092 (mavsumiy talab), EP-MKT-095 (yillik forecast)
- **action:** CREATE
- **⤳ Ta'sir:** SD, Ishlab chiqarish rejasi
- **Xoch-havolalar:** `[Module-14] Item 92` · `EXTRACTION QISM C §14 #92`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-115 · Marketing xarajati zavod realiga mos moddalar [v2-Q85]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-05 Δ)*
- **Talab:** A — byudjet zavod moddalari bo'yicha: ko'rgazma / vakil safari / namuna / matbaa (katalog) / raqamli (vakil safari HR komandировка bilan ulanadi). Kitob — B2B zavodda "reklama byudjeti" noto'g'ri; asl xarajat ko'rgazma/vakil/namuna/katalog. v2-Q4 dan FARQLI = real modda + HR safar.
- **Manba:** kitob (B2B real xarajat moddalari) + EP-MKT-034 + v2-A
- **Dalil (kod):** `marketing_budget_lines` CRUD real, lekin `SELECT DISTINCT category` → `email, tiktok, website, google, facebook, youtube, telegram, instagram` — ya'ni **kanal nomlari**, zavod-real moddalar emas. `grep "komandirovka|business.trip" marketing hr` → **0 mos** — HR safar-xarajati↔ko'rgazma ROI ulanishi yo'q. **Δ:** `429f37cd` `totalSpent`.
- **Nima yetishmaydi:** zavod-real modda taksonomiyasi (ko'rgazma/vakil safari/namuna/katalog/raqamli) + HR komandirovka xarajatini avto-ulash + ko'rgazma ROI hisobotiga qo'shish.
- **Bog'liqlik:** EP-MKT-034, EP-MKT-033, EP-MKT-011/059 (ko'rgazma ROI), HR
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (xarajat moddalari), HR (vakil safari/komandировка)
- **⚠️ ZIDDIYAT:** `decisions/14-marketing.md` ning Xulosa ro'yxati `EP-MKT-115` ni "🔵 OCHIQ (egaga 5-raqam tanlash)" deb ko'rsatadi — bu **noto'g'ri**: bandning o'zi ✅ JAVOBLANGAN, "egaga 5-raqam" esa `EP-MKT-116`.
- **Xoch-havolalar:** `[Module-14] Item 93` · `[Module-14] Item 45` · `EXTRACTION QISM C §14 #93` · `EXTRACTION QISM D #45`
- **Δ 2026-07-11→08-07:** `429f37cd` (2026-08-05) — byudjet `totalSpent` hisoblandi; modda taksonomiyasi o'zgarmadi.

### EP-MKT-116 · Egaga (Ayubxon Pozilov) marketing hisoboti — aniq 5 raqam [v2-Q86]
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — egaga aniq 5 raqam (yangi mijoz, yo'qolgan mijoz, kichiklashayotgan mijoz, savdo trendi, eng katta xavf) + 1 "diqqat talab" bo'limi. Kitob — har lavozim rahbariyatga hisobot; ega vaqti tor, 50 grafik kerak emas. Tamoyil tasdiq; sub: 5 raqamni kim belgilaydi — A (ega o'zi tanlaydi) egasidan. v2-Q46 (umumiy dashboard) dan FARQLI auditoriya.
- **Manba:** kitob (lavozim hisobot reglamenti) + BARCHA_JAVOBLAR Q909 (7-dep Administratsiya) + v2-A (5 raqam egasidan)
- **Dalil (kod):** `grep "5.raqam|fiveNumber|ownerWidget" apps/api/src` → faqat `business.constants.ts` (yolg'on-ijobiy). Alohida ega-widget'i **yo'q**; `getDashboardStats`/`getMarketingOverview` umumiy panel sifatida bor.
- **Nima yetishmaydi:** Director dashboard'da alohida 5-raqam widget + "diqqat talab" bloki. **QAYSI 5 RAQAM = egasi-DATA** — Q-40 bo'yicha to'qimadim (talabda taklif qilingan 5 ta A-variant, ammo ega tasdiqlamagan).
- **Bog'liqlik:** EP-MKT-076, EP-MKT-009, EP-MKT-085 (kichiklashayotgan mijoz raqami — servis mavjud), Director
- **action:** READ
- **⤳ Ta'sir:** butun marketing, 7-departament (Administratsiya)
- **Xoch-havolalar:** `[Module-14] Item 94` · `[Module-14] Item 24` · `EXTRACTION QISM C §14 #94` · `EXTRACTION QISM D #24`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-117 · Tavsiya zanjiri (kim kimni keltirdi) + rahmat/bonus [v2-Q87]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — lid'da "kim tavsiya qildi" maydoni + tavsiya zanjiri + tavsiyachiga rahmat/bonus qoidasi. Kitob — B2B eng kuchli/arzon kanal = mijoz tavsiyasi; kim kimni keltirgani bilinsa rag'batlantiriladi. EP-MKT-023 (kuzatish) dan aniq bonus mexanizmi.
- **Manba:** kitob (tavsiya eng kuchli B2B kanal) + EP-MKT-023 + v2-A
- **Dalil (kod):** `information_schema.columns` — hech bir lid/mijoz jadvalida **`referrer` ustuni YO'Q**. `employee_referrals` = HR (xodim yollash), mijoz-tavsiya zanjiri emas (`hr-gsd.*` fayl yo'li bilan tasdiqlangan).
- **Nima yetishmaydi:** `referrer` ustuni + tavsiya zanjiri ko'rinishi + bonus qoidasi (CRM mijoz kartasiga yoziladi, to'lov Payroll emas — alohida Moliya chiqimi).
- **Bog'liqlik:** EP-MKT-023, Moliya (bonus chiqimi), CRM
- **action:** CREATE
- **⤳ Ta'sir:** CRM, SD, Moliya (bonus)
- **Xoch-havolalar:** `[Module-14] Item 95` · `[Module-14] Item 26` · `EXTRACTION QISM C §14 #95` · `EXTRACTION QISM D #26`
- **Δ 2026-07-11→08-07:** —

### EP-MKT-118 · Mijoz hujjat/shartnoma to'liqligi marketingdan savdoga o'tishda [v2-Q88]
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11 Δ)*
- **Talab:** A — mijoz savdoga o'tishidan oldin majburiy rekvizit (STIR, shartnoma, manzil) tekshiruvi — to'liq bo'lmasa o'tmaydi. Kitob siyosat ruhi — "xom-ashyosi to'liq bo'lmagan zakazni ishlab chiqarishga kiritmaslik"; rekvizitsiz mijoz keyin invoys/to'lov muammosi. EP-MKT-088 опросный лист bilan birga darvoza.
- **Manba:** kitob (to'liqlik siyosati: xom-ashyo to'liq bo'lmasa kirmaydi) + v2-A
- **Dalil (kod):** 2026-07-11 auditi: `convertLeadToCrm` (`marketing-analytics-stubs.controller.ts:286-294+`) faqat `name`/`phone`/`email` bilan ishlardi — rekvizit tekshiruvi yo'q edi. **Δ:** o'sha kuni `ef9f43a1` bilan `leads.repository.ts:110-115` ga `stir`, `contract_number`, `address` ustunlari qo'shildi, izoh bilan: "*VISION EP-MKT-118 / #96: STIR/shartnoma/manzil rekvizitlari — convertLeadToCrm darvozasi shu maydonlarni tekshiradi (owner qaror 2026-07-11)*". Jonli kodda tasdiqlandi.
- **Nima yetishmaydi:** опросный лист to'liqlik darvozasi (EP-MKT-088) hamon yo'q — rekvizit yarmi yopildi, brif yarmi ochiq; SD tomonda qabul-tasdig'i yo'q (EP-MKT-074).
- **Bog'liqlik:** EP-MKT-088, EP-MKT-005, EP-MKT-074
- **action:** APPROVE
- **⤳ Ta'sir:** SD, Moliya (invoys/rekvizit), CRM
- **Xoch-havolalar:** `[Module-14] Item 96` · `[Module-14] Item 23` · `EXTRACTION QISM C §14 #96` · `EXTRACTION QISM D #23`
- **Δ 2026-07-11→08-07:** `ef9f43a1` (2026-07-11) — `stir`/`contract_number`/`address` rekvizit maydonlari va `convertLeadToCrm` darvozasi qurildi; FULL-ITEM-LEVEL "Yo'q" bahosi shu commit bilan eskirdi.

---

## II QISM — EP-kodsiz talablar (VR-MKT-I01..I14)

> Bu bandlar `vision-1000-answers/14-marketing.md`, `RECONCILIATION` va `STATUS-BOARD` da bor, lekin `decisions/14-marketing.md` da alohida `EP-MKT-NNN` kodi berilmagan. Ular EP-bandlarning sub-savoli emas — mustaqil talab yoki mustaqil texnik nuqson.

### VR-MKT-I01 · Ikki-dunyo: `crm_leads` ╳ `marketing_leads`
- **Qaror holati:** 🔵 OCHIQ *(arxitektura qarori — qaysi jadval kanonik)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Lid yagona ro'yxatda bo'lishi kerak (EP-MKT-001). Hozir ikki mustaqil jadval mavjud → dublikat, atribusiya buzilishi, KPI ikki xil.
- **Manba:** `STATUS-BOARD: Two-Worlds A13 Leads` (QUEUED-NOT-STARTED)
- **Dalil (kod):** `crm_leads` (3 qator `crm_activities` bilan) va `marketing_leads` alohida; `leads.repository.ts` `marketingLeads` ga yozadi, CRM esa `crm_leads` ga.
- **Nima yetishmaydi:** kanonik jadval tanlovi + migratsiya + VIEW/adapter.
- **Bog'liqlik:** EP-MKT-001, EP-MKT-046, EP-MKT-056
- **action:** CREATE
- **⤳ Ta'sir:** CRM, SD, butun marketing analitikasi
- **Xoch-havolalar:** `EXTRACTION QISM A Step-3` · `STATUS-BOARD: Two-Worlds A13 Leads`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I02 · FE↔BE rol-alias drifti (`ROLE_ALIASES`)
- **Qaror holati:** ✅ JAVOBLANGAN *(texnik nuqson — qaror talab qilmaydi)*
- **Qurilish holati:** Yo'q *(2026-08-07, bugungi tekshiruv)*
- **Talab:** FE ruxsat-ko'rinishi BE avtorizatsiyasi bilan bir xil bo'lishi kerak.
- **Manba:** bugungi jonli-kod tekshiruvi (2026-08-07)
- **Dalil (kod):** `artifacts/erp-dashboard/src/hooks/useAuth.tsx:15-19` — izoh "*Mirror backend ROLE_ALIASES so UI permissions consistently match server authorization*", jadval: `manager: "director"`, `marketing: "sales_manager"`, `crm_manager: "sales_manager"`. `grep -rn "ROLE_ALIASES\|roleAliases" apps/api/src` → **0 natija** — backendda bunday alias jadvali **yo'q**, `RolesGuard` xom rol satrini solishtiradi.
- **Nima yetishmaydi:** yoki BE ga bir xil alias jadvali qo'shish, yoki FE aliaslarini olib tashlab BE ro'yxatiga moslash. Hozir `marketing` rolli foydalanuvchi FE'da `sales_manager` deb hisoblanadi va `marketing_manager` gate'iga hech qachon tushmaydi → FE tugmani ko'rsatadi, BE 403 qaytaradi (yoki teskarisi).
- **Bog'liqlik:** EP-MKT-019, `5f26a02b`, `56489f4d`
- **action:** UPDATE
- **⤳ Ta'sir:** butun FE ruxsat qatlami (faqat marketing emas), Xavfsizlik
- **Xoch-havolalar:** `— (mos item topilmadi)` · `commit 5f26a02b` · `commit 56489f4d`
- **Δ 2026-07-11→08-07:** ⭐ Bugun (2026-08-07) aniqlandi — `56489f4d` ni tekshirish jarayonida ochildi; **hali tuzatilmagan**.

### VR-MKT-I03 · Offline lid kiritish (ko'rgazmada aloqa yo'q)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Offline rejimda kiritilgan lidlar lokal saqlanadi, aloqa tiklanganda avto-sinxronlanadi; sinxronizatsiyada telefon bo'yicha dublikat birlashtiriladi, xatolik hisoboti ko'rsatiladi.
- **Manba:** `vision-1000-answers/14-marketing.md #10`
- **Dalil (kod):** `grep "offline" marketing` → **0 mos**; BE'da lidlar uchun offline-saqlash qatlami umuman yo'q.
- **Nima yetishmaydi:** FE offline-store (IndexedDB/localStorage navbati) + sync endpointi + merge-vaqtidagi dedup (EP-MKT-046 ga bog'liq).
- **Bog'liqlik:** EP-MKT-058 (ko'rgazma lid), EP-MKT-046 (dedup)
- **action:** CREATE
- **⤳ Ta'sir:** Mobil ilova, CRM
- **Xoch-havolalar:** `[Module-14] Item 10` · `EXTRACTION QISM A #10` · `EXTRACTION QISM D #10`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I04 · Sifatli lid 30 kun ichida sotilmasa — sotuvchi KPI'ga tushadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** "Sifatli lid yetkazildi" nuqtasidan keyin marketing javobgarligi tugaydi; 30 kun ichida sotuv bo'lmasa bu **sotuvchi** KPI'siga tushadi (savdo ko'nikmasi muammosi).
- **Manba:** `vision-1000-answers/14-marketing.md #16`
- **Dalil (kod):** `EloRatingService` (KPI/leaderboard shakliga eng yaqin servis) `crm.module.ts` da ro'yxatdan o'tgan, lekin `grep -rln "EloRatingService"` → **faqat modul fayli** havola qiladi — hech bir controller/servis chaqirmaydi. 30-kunlik sotilmagan-lid qoidasi yo'q.
- **Nima yetishmaydi:** KPI atribusiya qoidasi (marketing↔sotuv chegarasi) + 30 kunlik hisoblagich. Chegara ta'rifi EP-MKT-077 dagi 🔵 sub-savolga bog'liq.
- **Bog'liqlik:** EP-MKT-077, EP-MKT-112, EP-MKT-074
- **action:** CREATE
- **⤳ Ta'sir:** HR/KPI, SD
- **Xoch-havolalar:** `[Module-14] Item 16` · `EXTRACTION QISM A #16` · `RECONCILIATION SB0592/612`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I05 · Bitrix24 "Sdo'cha"/"Aktivlik" maydonlari → `crm_activities`
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Bitrix24 dagi "Sdo'cha" va "Aktivlik" maydonlari lid kartasiga izoh sifatida emas, **alohida `crm_activities` jadvaliga** tushadi — faoliyat tarixi to'liq saqlanadi.
- **Manba:** `vision-1000-answers/14-marketing.md #18`
- **Dalil (kod):** `crm_activities` jadvali + to'liq CRUD **real** (`crm/application/crm-activities.service.ts`, `crm/infrastructure/repositories/crm-activities.repository.ts`), jonli — 3 qator, `lead-aging-reassign.cron.ts` audit-izohlarini yozadi. Ammo `crm-bitrix-compat.service.ts` da **Bitrix-maydon mapping'i yo'q**.
- **Nima yetishmaydi:** Bitrix import mapping'i. EP-MKT-083 (ko'chirish rejasi) tasdiqlanmaguncha ma'nosiz.
- **Bog'liqlik:** EP-MKT-083 (🔵 ko'chirish rejasi)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (faoliyat tarixi)
- **Xoch-havolalar:** `[Module-14] Item 18` · `EXTRACTION QISM A #18` · `EXTRACTION QISM D #18`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I06 · QC sifat muammosida ikki xil xabar (mijozga umumiy / menejerga to'liq)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** QC bosqichida sifat muammosi bo'lsa mijozga avtomatik umumiy "kechikish mumkin" xabari (sabab **maxfiy**), menejer esa ichki bildirishnomada to'liq ma'lumot oladi.
- **Manba:** `vision-1000-answers/14-marketing.md #27`
- **Dalil (kod):** `grep "kechikish mumkin|qc.*customer.*message" marketing qc` → **0 mos** — QC eventiga bog'langan ikki-yo'nalishli (tashqi/ichki) xabar mantiqi yo'q.
- **Nima yetishmaydi:** QC eventi listeneri + ikki shablon (tashqi umumiy / ichki to'liq) + jo'natish kanali.
- **Bog'liqlik:** EP-MKT-099 (NPS↔QC — FARQLI), EP-MKT-107 (mijoz status linki), QC
- **action:** EVENT
- **⤳ Ta'sir:** Sifat, Bildirishnoma, SD
- **Xoch-havolalar:** `[Module-14] Item 27` · `EXTRACTION QISM A #27` · `EXTRACTION QISM D #27`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I07 · LMS darslik tugalanmasa → HR signal → Payroll "to'siq"
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** LMS darslik tugalanmaganda HR'ga signal ketadi, HR oylik hisoblashda "to'siq" qo'yadi (Payroll gate); LMS→HR event, Payroll HR qarorini o'qiydi; kechikish 1 ish kuni (async zanjir).
- **Manba:** `vision-1000-answers/14-marketing.md #38`
- **Dalil (kod):** `grep "darslik.*to.siq|lms.*payroll.*gate|LmsPayrollGate" apps/api/src` → faqat `hr.module.ts` umumiy moslik (modul ro'yxati), aniq gate mantiqi yo'q. (LMS imtihon→razryad boshqa oqim, `SB0500` RESOLVED.)
- **Nima yetishmaydi:** LMS kurs-tugallash eventi + HR gate + Payroll o'qish zanjiri.
- **Bog'liqlik:** EP-MKT-101 (savdo skripti darsligi), LMS, HR, Payroll
- **action:** EVENT
- **⤳ Ta'sir:** LMS, HR, Payroll
- **Xoch-havolalar:** `[Module-14] Item 38` · `EXTRACTION QISM A #38` · `EXTRACTION QISM D #38`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I08 · Yangi Pantone kodi → dizaynga avto-bildirishnoma + ta'sir tekshiruvi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Yangi Pantone kodi yuklanganda dizayn bo'limiga avto-bildirishnoma; faol buyurtmalardagi maketlarda shu rang ishlatilgan bo'lsa QC va Dizayn xabardor qilinadi.
- **Manba:** `vision-1000-answers/14-marketing.md #41`
- **Dalil (kod):** `grep -rln "pantone" apps/api/src --include=*.ts -i` → **0 fayl** butun backendda (jumladan `lib/db/src/schema`). Pantone entity ham, bildirishnoma ham yo'q.
- **Nima yetishmaydi:** Pantone katalogi (EP-MKT-086 brend pasporti bilan bir ildiz) + o'zgarish eventi + faol maketlarda ta'sir tekshiruvi.
- **Bog'liqlik:** EP-MKT-086 (brend pasporti), Dizayn, QC
- **action:** EVENT
- **⤳ Ta'sir:** Dizayn, Sifat
- **Xoch-havolalar:** `[Module-14] Item 41` · `EXTRACTION QISM A #41` · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I09 · Ogohlantirishni ko'rib davom etish → audit-log (7 yil)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Menejer ogohlantirishni (mas. to'lov intizomi belgisini) ko'rib ham lid ishini davom ettirsa — audit-log'da saqlanadi (foydalanuvchi ID, vaqt, "ogohlantirish ko'rildi" belgisi), A6 qoidasi bo'yicha 7 yil.
- **Manba:** `vision-1000-answers/14-marketing.md #42`
- **Dalil (kod):** marketing controllerlarda `AuditInterceptor` bor, lekin **"ogohlantirish override" tizimi yo'q** — ogohlantirishning o'zi qurilmagani uchun (EP-MKT-091) yozadigan hodisa ham yo'q.
- **Nima yetishmaydi:** avval ogohlantirish (EP-MKT-091), keyin override yozuvi + 7 yillik saqlash siyosati.
- **Bog'liqlik:** EP-MKT-091 (ildiz), Compliance
- **action:** CREATE
- **⤳ Ta'sir:** Audit-log, Compliance
- **Xoch-havolalar:** `[Module-14] Item 42` · `EXTRACTION QISM A #42` · `EXTRACTION QISM D #42`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I10 · Diler manbasi ("manba: diler") — diler portali YO'Q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Diler faqat marketing xodimi nomidan kiritiladi (diler portali rejalashtirilmagan); marketing xodimi diler nomini "manba: diler" maydoni bilan kiritadi; diler uchun alohida RBAC roli yo'q (B2B zavod modeli).
- **Manba:** `vision-1000-answers/14-marketing.md #43`
- **Dalil (kod):** `SELECT ... WHERE column_name ILIKE '%diler%' OR '%dealer%'` → **bo'sh massiv**. Lidda erkin `source` maydoni bor (`leads.repository.ts:58`) — `'diler'` qiymatini saqlay oladi, lekin maxsus diler-manba enum/ishlov yo'q.
- **Nima yetishmaydi:** `source` enum'ida `dealer` qiymati + diler nomi maydoni; portal **ataylab qurilmaydi** (qaror).
- **Bog'liqlik:** EP-MKT-031 (kanal ro'yxatida "vositachi-diler"), EP-MKT-091 (diler AR)
- **action:** UPDATE
- **⤳ Ta'sir:** CRM (lid manbasi), SD
- **Xoch-havolalar:** `[Module-14] Item 43` · `EXTRACTION QISM A #43` · `EXTRACTION QISM D #43`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I11 · Telegram bot webhook ishlamasa → polling fallback
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Telegram bot webhook ishlamay qolsa tizim polling rejimiga o'tadi (fallback); mas'ulga xato bildirishnomasi darhol yuboriladi; A5 uptime talabi saqlanadi.
- **Manba:** `vision-1000-answers/14-marketing.md #50`
- **Dalil (kod):** `grep -rln "polling" apps/api/src/modules/bot-gateway` → **0 mos**. `setupTelegramWebhook` bor (`marketing-analytics-stubs.controller.ts:677`), lekin webhook→polling fallback logikasi yo'q (mavjud gatewaylar = websocket).
- **Nima yetishmaydi:** polling rejimi + sog'liq tekshiruvi + mas'ulga xato bildirishnomasi.
- **Bog'liqlik:** EP-MKT-062 (🔵 provayder), EP-MKT-107 (mijoz bot)
- **action:** CREATE
- **⤳ Ta'sir:** Bot-gateway, Bildirishnoma, SocialInbox
- **Xoch-havolalar:** `[Module-14] Item 50` · `EXTRACTION QISM A #50` · `EXTRACTION QISM D #50`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I12 · Lid bosqich-tarixi jadvali (`crm_lead_stage_history`) yo'q
- **Qaror holati:** ✅ JAVOBLANGAN *(texnik nuqson)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Voronka bosqichlari tarixi saqlanishi kerak — "qaysi bosqichda necha kun turdi" ko'rsatkichi shundan chiqadi.
- **Manba:** `RECONCILIATION SB0669`
- **Dalil (kod):** `crm_lead_stage_history` jadvali **mavjud emas**; `getMarketingFunnel` faqat joriy holatni sanaydi.
- **Nima yetishmaydi:** bosqich-o'tish jurnali jadvali + har o'zgarishda yozuv + davomiylik hisobi.
- **Bog'liqlik:** EP-MKT-004, EP-MKT-049, EP-MKT-093
- **action:** CREATE
- **⤳ Ta'sir:** CRM voronka analitikasi, Hisobot
- **Xoch-havolalar:** `— (mos item topilmadi)` · `RECONCILIATION SB0669` · `EXTRACTION QISM A Step-3`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I13 · CRM/Marketing magic-number tuzatishlari (16 topilma)
- **Qaror holati:** ✅ JAVOBLANGAN *(⭐ Owner qoidasi: chegara qiymatlar doim CRUD)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Biznes-konstantalar kodda hardcode bo'lmasin — `business_settings`/`marketing_settings` ga default bilan chiqarilib, CRUD orqali sozlansin.
- **Manba:** `STATUS-BOARD: Magic-Numbers CRM/Marketing` (QUEUED-NOT-STARTED, 16 topilma)
- **Dalil (kod):** `MKT_ATTRIBUTION_WINDOW_DAYS = 90`, `MKT_CHANNELS` massiv, `getChurnRisk` dagi qat'iy `30/60/90`, `order-trend.service.ts` dagi `RECENT_WINDOW=1`/`MIN_ORDERS_FOR_TREND=3` — hammasi kod-konstanta. (Ijobiy istisno: `customer-rhythm.service` `minOrders` ni `marketing_settings` dan o'qiydi; `order-trend` ixtiyoriy `min_decline_pct` ni KV dan o'qiydi.)
- **Nima yetishmaydi:** qolgan konstantalarni sozlamalar jadvaliga ko'chirish + CRUD ekrani.
- **Bog'liqlik:** EP-MKT-003, EP-MKT-055, EP-MKT-084, EP-MKT-085, EP-MKT-063
- **action:** UPDATE
- **⤳ Ta'sir:** butun marketing sozlanuvchanligi
- **Xoch-havolalar:** `— (mos item topilmadi)` · `STATUS-BOARD: Magic-Numbers CRM/Marketing`
- **Δ 2026-07-11→08-07:** —

### VR-MKT-I14 · Kampaniya `DELETE` faqat `SUPER_ADMIN`/`DIRECTOR`
- **Qaror holati:** 🔵 OCHIQ *(ataylabmi yoki qoldiqmi — tasdiq kerak)*
- **Qurilish holati:** Qisman *(2026-08-07, bugungi tekshiruv)*
- **Talab:** `5f26a02b`/`56489f4d` mantig'i bo'yicha real `manager` roli marketing ishini bajara olishi kerak. Kampaniya o'chirish bundan istisno qilindi.
- **Manba:** bugungi jonli-kod tekshiruvi (2026-08-07)
- **Dalil (kod):** `marketing.controller.ts:131-133` — `@Delete(':id')` + `@Roles(Role.SUPER_ADMIN, Role.DIRECTOR)`; qolgan 5 endpoint (`GET`, `GET :id`, `POST`, `PATCH :id`, `POST :id/launch`) `Role.MANAGER` ni ham qabul qiladi.
- **Nima yetishmaydi:** ega tasdig'i — o'chirish ataylab cheklanganmi (destruktiv amal) yoki rol-fiks qoldig'imi. Qoida sifatida yozilmagan.
- **Bog'liqlik:** EP-MKT-006, EP-MKT-019, VR-MKT-I02
- **action:** APPROVE
- **⤳ Ta'sir:** Kampaniya boshqaruvi, Xavfsizlik
- **Xoch-havolalar:** `— (mos item topilmadi)` · `commit 56489f4d`
- **Δ 2026-07-11→08-07:** ⭐ Bugun (2026-08-07) `56489f4d` tekshiruvida aniqlandi.

---

## III QISM — Raqamlash siljishi va xaritalash

### 3.1 Umumiy manzara

| Manba | Elementlar soni | EP-kod bilan bog'lanishi |
|---|---|---|
| `decisions/14-marketing.md` | **118** (`EP-MKT-001..118`) | asos — registrning kaliti |
| `FULL-ITEM-LEVEL [Module-14]` | **99** (`Item 1..99`) | 1..50 = EP-kodsiz · 51..99 = ko'pincha EP-kod sarlavhada |
| `EXTRACTION QISM A` (1040-1112) | **50** | = `vision-1000-answers` #1..#50 = `Item 1..50` |
| `EXTRACTION QISM C` (3955-4108) | **99** (`TASDIQ-2146 §14 #1..#99`) | #1..#59 ≈ `EP-MKT-031..089` (offset +30) · #60..#96 = `EP-MKT-082..118` |
| `EXTRACTION QISM D` (5522-5575) | **43** cross-ref | = `vision-1000-answers` #N (2..50 orasida, 7 tasi tashlangan) |
| `vision-1000-answers/14-marketing.md` | **50** | EP-kodsiz |

### 3.2 `Item ↔ EP-MKT` xaritasi (5 blok)

| Blok | Item oralig'i | EP-kod | Izoh |
|---|---|---|---|
| **B1** | `Item 1..50` | **EP-kod YO'Q** | `vision-1000-answers` #1..#50. Registrda faqat **mavzu bo'yicha** ulandi va shunday belgilandi *(mavzu bo'yicha)*. 14 tasi hech qaysi EP ga to'liq mos kelmadi → **II QISM (VR-MKT-I01..I14)**. |
| **B2** | `Item 51..59` | **EP-MKT-081..089** | offset **+30** (`TASDIQ #51..#59`). |
| **B3** | `Item 60..96` | **EP-MKT-082..118** | offset **+22**. Sarlavhada EP-kod ochiq yozilgan. **B2 bilan 082..089 takrorlanadi** (8 EP ikki itemga ega). |
| **B4** | `Item 97 / 98 / 99` | `EP-MKT-059+060` / `EP-MKT-078` / `EP-MKT-062+064` | Ortga qaytish — `TASDIQ` ro'yxati oxirida oldingi mavzular qayta ochilgan. |
| **B5** | `EP-MKT-001..080` (`035` bundan mustasno) | **Item YO'Q** | 80 EP-kodning **hech biriga** to'g'ridan-to'g'ri item to'g'ri kelmaydi → registrda `— (mos item topilmadi)` yoki `QISM C §14 #N` (offset −30) ishlatildi. |

### 3.3 QISM C offset uzilishi (yagona anomaliya)

`TASDIQ-2146 §14` ro'yxati `#1..#59` da izchil **+30** offset bilan `EP-MKT-031..089` ga to'g'ri keladi, **bitta istisno bilan**:

| QISM C # | Kutilgan EP | Haqiqiy mavzu | Haqiqiy EP |
|---|---|---|---|
| `#5` | `EP-MKT-035` (Kanal egasi / mas'ul xodim) | "Lid yutilganda SD mijoz kartochkasi avto (oltin-ip)" | **`EP-MKT-005`** |

**Natija:** `EP-MKT-035` **yagona** EP-kod bo'lib, unga na `Item`, na `QISM C #` to'g'ri keladi — registrda ikkalasi ham `— (mos item topilmadi)` deb belgilandi va band ichida `⚠️ ZIDDIYAT (raqamlash)` qatori qo'yildi.

### 3.4 Takroriy itemlar (bir EP → ikki item)

`FULL-ITEM-LEVEL` ning o'zi bularni "*Duplicate of item N — build once*" deb belgilagan:

| EP-kod | Itemlar | Ikki bahoning farqi |
|---|---|---|
| `EP-MKT-082` | 52, 60 | 52 = **STALE-DOC**, 60 = **Ha** — ikkalasi ham "avto-trigger real" xulosasiga keladi |
| `EP-MKT-083` | 53, 61 | 53 = **Qisman**, 61 = **Yo'q** ⚠️ — bir xil dalil, boshqa baho |
| `EP-MKT-084` | 54, 62 | ikkalasi **Qisman** |
| `EP-MKT-085` | 55, 63 (+12) | uchalasi **Yo'q** ⚠️ — uchalasi ham `order-trend.service.ts` ni o'tkazib yuborgan |
| `EP-MKT-086` | 56, 64 | ikkalasi **Yo'q** |
| `EP-MKT-087` | 57, 65 | ikkalasi **Qisman** |
| `EP-MKT-088` | 58, 66 | ikkalasi **Yo'q** |
| `EP-MKT-089` | 59, 67 | ikkalasi **Yo'q** |
| `EP-MKT-078` | 17, 98 | ikkalasi **Qisman** |
| `EP-MKT-059/060` | 31, 97 | 31 = Yo'q, 97 = Qisman |
| `EP-MKT-062/064` | 35, 99 | 35 = Yo'q, 99 = Qisman |

### 3.5 ⚠️ Ziddiyatlar ro'yxati (14)

| # | EP-kod | Ziddiyat | Registr qарори |
|---|---|---|---|
| 1 | — (Xulosa) | `decisions/14-marketing.md` Xulosa "92/26" ✕ band-ma-band sanoq **97/21** | Band-ma-band sanoq |
| 2 | `EP-MKT-115` | Xulosa uni 🔵 OCHIQ deb ro'yxatlaydi ✕ bandning o'zi ✅ JAVOBLANGAN (aslida 🔵 = `EP-MKT-116`) | Band ustuvor → ✅ |
| 3 | `EP-MKT-005` | QISM C #5 = **Qisman** ✕ #44 = **Yo'q** ✕ Item 49 = **Ha** | **Qisman** (CRM→SD bor, marketing→SD yo'q) |
| 4 | `EP-MKT-015/082` | QISM C #52/#60 "avto-trigger yo'q" ✕ QISM D #7 + Item 52/60 "real" | **Ha** (listener jonli kodda) |
| 5 | `EP-MKT-022` | `RECONCILIATION SB0640/652/673` "hardcoded mock, UI yo'q" ✕ Item 1 dalil bilan rad etadi | **STALE-DOC** |
| 6 | `EP-MKT-047` | QISM C #17 + `SB0662` "round-robin yo'q" ✕ Item 37 "real, ishlatiladi" | **STALE-DOC** |
| 7 | `EP-MKT-048` | QISM C #18 + `SB0668` "cron yo'q" ✕ Item 3 "`f855ca16` real" | **STALE-DOC** |
| 8 | `EP-MKT-051` | QISM C #21 = **Ha** ✕ Item 33 = **Yo'q** ✕ QISM D #33 = **Qisman** | **Qisman** |
| 9 | `EP-MKT-083` | Item 53 = **Qisman** ✕ Item 61 = **Yo'q** (bir xil dalil) | **Qisman** |
| 10 | `EP-MKT-084` | Item 11 "ritm yo'q" ✕ `customer-rhythm.service.ts` `c8b2efd9` (2026-07-10) | **STALE-DOC** |
| 11 | `EP-MKT-085` | Item 12/55/63 + QISM C #55/#63 "yo'q" ✕ `order-trend.service.ts` `8832a34d` (2026-07-10) | **STALE-DOC** |
| 12 | `EP-MKT-077/112` | Item 19/90 + `SB0592/612` "KPI endpoint yo'q" ✕ `manager-kpi.controller.ts` `2d2d4659` (2026-07-10) | **STALE-DOC** |
| 13 | `EP-MKT-019` / `VR-MKT-I02` | FE `useAuth.tsx` izohi "backend bilan bir xil" ✕ backendda `ROLE_ALIASES` **yo'q** | FE↔BE drift — **ochiq nuqson** |
| 14 | `EP-MKT-035` | QISM C offseti #5 da uziladi — 035 ga hech qanday manba item to'g'ri kelmaydi | `— (mos item topilmadi)` |

### 3.6 Δ jurnal (2026-07-11 → 2026-08-07) — 9 commit

| Commit | Sana | Ta'sir qilgan EP |
|---|---|---|
| `cd412d3a` | 2026-07-11 | `EP-MKT-042` (promo-kod CRUD noldan qurildi) |
| `ef9f43a1` | 2026-07-11 | `EP-MKT-118` (STIR/shartnoma/manzil rekvizit darvozasi) |
| `eff7b4cb` | 2026-07-13 | `EP-MKT-069`, `EP-MKT-017` (kontent-post CREATE tuzatildi) |
| `b0ff014f` | 2026-07-13 | `EP-MKT-012`, `EP-MKT-062` (inbox 503 tuzatildi) |
| `8fd71616` | 2026-07-13 | `EP-MKT-015`, `EP-MKT-082`, `EP-MKT-084` (NPS/Churn ro'yxati) |
| `16be54fc` | 2026-07-13 | `EP-MKT-017`, `EP-MKT-069` (Blog maqola 422 + SEO/cover/tags) |
| `429f37cd` | 2026-08-05 | `EP-MKT-009`, `EP-MKT-030`, `EP-MKT-033`, `EP-MKT-076`, `EP-MKT-115` (`totalSpent`) |
| `5f26a02b` | 2026-08-06 | `EP-MKT-019` + 6 controller (`manager` roli, 69 qator) |
| `56489f4d` | 2026-08-07 | `EP-MKT-006`, `EP-MKT-019`, `EP-MKT-036`, `EP-MKT-038` (Campaigns controller) |

> **Chegaraviy holat:** `c8b2efd9`, `2d2d4659`, `8832a34d` (hammasi **2026-07-10**) — Δ oynasidan **tashqarida**, lekin FULL-ITEM-LEVEL ularni ko'rmagan. Registrda `Δ` sifatida emas, **STALE-DOC** sifatida qayd etildi (⭐ eslatmaga qarang).

