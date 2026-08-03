# MARKETING — Decision Map (EP-MKT) — 2026-06-08

> Manba savollar: v1 (`vision-questions/14-marketing.md`, 30) + v2 (`vision-questions-v2/14-marketing.md`, 88) = **118**. Kodlar: v1 → EP-MKT-001..030, v2 → EP-MKT-031..118 (fayl tartibida; v2 Q1→031 … Q88→118).
> Status manbalari:
> - `SHvB-40-Yonalish-Prompt.md` **YO'NALISH 25 = Marketing 4-Otdelenie KPI** (ShVB): `marketingGsd`/`leadsCount`/`newLeads`/`qualifiedLeads`/`conversionRate`/`costPerLead`/`marketingRoi`/`campaignEfficiency`/`socialReach`/`marketingBudgetUsed`/`marketingBudgetRemain`; MarketingDashboard GSD="Yangi leads soni — haftalik"; **kanal taqsimoti (SMM/reklama/tavsiya)**; `marketing-ai.service.ts → analyzeCampaignEfficiency()` "qaysi kanal eng samarali". Bu ShVB reglamenti yuqoridagi ko'p savolni bevosita **JAVOBLANGAN** qiladi (lead-funnel, kanal-ROI, CPL, kampaniya-samara, AI-tavsiya, NPS/churn).
> - `EUROPRINT_BARCHA_JAVOBLAR.md` egasi javoblari: **Q12/Q27 employer-branding = ERP DAN TASHQARI tashqi web sayt** (europrint.uz ga bo'lim qo'shiladi — HR-brand careers) → Marketing kontent/CMS shu tashqi sayt bilan; **Q99 rekruter→HR-brand→Marketing** (vakansiya matni "asosan HR brend bilan shug'ullanadigan marketing bo'limga tegishli"; rekruter Marketingga topshiriq beradi); **Q172 HR↔Marketing integratsiyasi** vakansiya reklamasi workflow "1-2-3" (ketma-ket tasdiq); **Q909** org-jadval: **6-departament (Rivojlanish) = Marketing strategiyasi**, **1-bo'linma = Marketing (operatsion)**.
> - `kitob (REAL 2025 zavod hujjatlari)`: EuroPrint = **B2B BUYURTMA QADOQLASH zavodi** — "marketing" = iste'molchi brendi EMAS, balki (1) yangi B2B mijoz, (2) takroriy buyurtmachini ushlash, (3) mavjud zanjir (Bitrix24 + savdo menejer + dizayn + опросный лист) bilan ulanish. Real hujjatlar: Bitrix24 (dizayn yo'riqnoma), опросный лист→тех карта, подписной лист (ЦКП), папка № (PT/KT/E), "Menedjer" ustuni (Azizov Avazxon), M.Nosirov "Kichiklashgan buyurtmalar" Excel, Bandlik.xlsx (dastgoh quvvati), брен стандартлари (MIJOZ brendi), Формат листа/гофро (texnik chegara).
> - `LOYIHA-BITGAN-XOLAT-2026-06-08.md`: EP-MKT-### raqamlash; **Marketing = T3 QO'LLAB-QUVVATLOVCHI** ("Yordamchi/operatsion; ko'pi mavjud yoki sodda") — strategik qism 6-departamentga, operatsion 1-bo'linmaga ulanadi.
> - Vizyon master reja: **oltin-ip (lead→buyurtma→pul)** lead'dan boshlanadi; **karta-markazli RBAC** (har vazifa lavozim kartasiga); 70% AI-tahlil; **Bitrix24 olib tashlanadi → to'liq ERP** (CRM Q33 bilan birga).
>
> **MAVJUD KOD (verify):** `apps/api/src/modules/marketing/` to'liq slice — campaigns (CQRS: create/update/launch + aggregate + drizzle-campaign.repo + campaign-status.enum), leads (leads.service/repo), marketing-ext (social-inbox/content/exhibitions/NPS/budget — marketing-ext.service + drizzle-marketing-ext.repo + schema-marketing-ext), `marketing.controller`/`marketing-analytics.controller`/`marketing-content.controller`. AI: `modules/ai/services/marketing-ai.service.ts` + `ai-marketing.controller`. FE: `MarketingDashboard/Leads/Campaigns/Calendar/Content/SocialInbox/Exhibitions/Budget/PR/WebsiteCMS/Settings/Extended` (+ Dialogs/Sections/Helpers/Types, smoke-testlar). Schema: `lib/db/schema/marketing-schema.ts`. ⇒ ko'p v1/erta-v2 feature **kod allaqachon shu yo'nalishda** (vizyon = mavjudni tugatish/ulash, noldan emas). Memory (session 2026-05-28 "Marketing GURUH 1+2 real DB": NPS/hot-leads/blog/budget/calendar) buni tasdiqlaydi.

## Xulosa
- **Jami:** 118
- **✅ JAVOBLANGAN:** 92 (ShVB YO'NALISH 25 Marketing KPI reglamenti — leadsCount/newLeads/qualifiedLeads/conversionRate/costPerLead/marketingRoi/campaignEfficiency/socialReach/budgetUsed/budgetRemain + kanal taqsimoti + marketing-ai analyzeCampaignEfficiency — yuqoridagi lid-funnel/kanal-ROI/CPL/kampaniya-samara/AI-tavsiya/inbox/NPS savollarini bevosita yopadi; egasi Q12/Q27 tashqi-sayt HR-brand + Q99/Q172 rekruter→marketing + Q909 6-dep strategiya/1-bo'linma operatsion + kitob B2B-zanjir realligi (Bitrix24→ERP, опросный/подписной лист, папка №, Menedjer ustuni, churn/kichiklashish, mijoz-brend pasporti, Bandlik quvvat) + vizyon oltin-ip/karta-RBAC/70%-AI + MAVJUD kod (campaigns/leads/ext/social-inbox/content/exhibitions/budget/NPS + AI) bilan tasdiqlangan)
- **🔵 OCHIQ:** 26 (egasi keyin hal qiladi; har biriga A-default tavsiya — ShVB/kitob/karta-modelга eng mos). Ko'pchiligi "tamoyil tasdiq, faqat aniq RAQAM/MEZON/RO'YXAT egasidan": kanallar to'liq ro'yxati (EP-MKT-003, 031), lid-skoring ball-vazni (EP-MKT-044), majburiy maydonlar (EP-MKT-045), taqsimlash qoidasi raqami (EP-MKT-047), lid eskirish SOATI (EP-MKT-048), voronka bosqich nomlari (EP-MKT-049), yo'qotish sabab ro'yxati (EP-MKT-050), ROI formula+marja manbasi (EP-MKT-051), atribusiya OYNASI kun (EP-MKT-055/056), inbox SLA daqiqa (EP-MKT-063), kontent rukn nisbati (EP-MKT-071), KPI marketing-vs-sotuv chegarasi (EP-MKT-077). Arxitektura-bog'liq OCHIQ: **EP-MKT-083 (Bitrix24 ko'chirish rejasi — CSV yoki API ko'prik)**, EP-MKT-088 (опросный лист maydon-egasi), EP-MKT-062 (ijtimoiy inbox provayder — Instagram/FB API kim ulaydi), EP-MKT-079 (UTM infratuzilma), EP-MKT-091 (to'lov-intizom blok yoki ogohlantirish — Finance bilan), EP-MKT-115 (egaga 5-raqam tanlash).

---

## I QISM — v1 (30 savol) — EP-MKT-001..030

### EP-MKT-001 · Lid (mijoz nomzodi) yagona ro'yxati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — barcha kanaldan kelgan lid avtomatik bitta ro'yxatga. Oltin-ip lead'dan boshlanadi; ShVB GSD "Yangi leads soni — haftalik"; mavjud `marketing/leads` + `MarketingLeads.tsx`. Kitob "egasiz lid = o'lik lid" — yagona ro'yxat + egalik shart.
- **Manba:** ShVB YO'NALISH 25 (leadsCount/newLeads) + mavjud leads kod + master reja oltin-ip + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (lead→buyurtma), CRM (mijoz kartasi), Director dashboard

### EP-MKT-002 · 4 ta lid kanali (SMM / reklama / tavsiya / ko'rgazma)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kanal alohida belgilanadi + statistika. ShVB MarketingDashboard "Kanal bo'yicha taqsimot (SMM, reklama, tavsiya)" — bu 4 kanal aynan ShVB reglamentidan. Ko'rgazma = zavodning eng kuchli B2B kanali (kitob).
- **Manba:** ShVB YO'NALISH 25 (kanal taqsimoti SMM/reklama/tavsiya) + kitob (ko'rgazma B2B kuchli) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kanal ROI), CRM (lid manbasi), SD

### EP-MKT-003 · Kanallar ro'yxatini kim belgilaydi (master-data)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sozlamalarda kanal ro'yxati, marketing boshlig'i o'zi qo'shadi/o'chiradi (master-data). Tamoyil tasdiq; aniq dastlabki kanal RO'YXATI (4 yoki 8 — EP-MKT-031 bilan) egasidan. `MarketingSettings.tsx` mavjud → shu yerda boshqariladi.
- **Manba:** mavjud MarketingSettings kod + v1-A (ro'yxat egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** butun marketing (kanal master-data), Hisobot

### EP-MKT-004 · Lid bosqichlari (status oqimi / voronka)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq voronka (5-6 bosqich) + har bosqich lid soni. ShVB `conversionRate`; oltin-ip; kitob B2B voronkasi (namuna→подписной лист→mijoz). Aniq bosqich nomlari EP-MKT-049/093 da egasidan.
- **Manba:** ShVB YO'NALISH 25 (conversionRate) + kitob (namuna/подписной лист bosqichlari) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (deal pipeline), CRM, Hisobot (voronka tahlil)

### EP-MKT-005 · Lid → Savdo (SD) bilan ulanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik: lid yutilganda SDда mijoz kartochkasi yaratiladi. Oltin-ip uzluksiz zanjir; kitob опросный лист→тех карта zanjiri (EP-MKT-088). Bir marta kiritiladi, ikki joyda bor.
- **Manba:** master reja oltin-ip + kitob (lid→опросный лист) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (mijoz/buyurtma), CRM, Dizayn (опросный лист)

### EP-MKT-006 · Kampaniya kartochkasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq kartochka (byudjet + muddat + maqsad + bog'langan lidlar + natija). Mavjud `marketing/campaigns` CQRS slice (aggregate/create/update/launch/status-enum) + `MarketingCampaigns.tsx`. ShVB `campaignEfficiency`.
- **Manba:** mavjud campaigns CQRS kod + ShVB YO'NALISH 25 (campaignEfficiency) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (byudjet), Hisobot (kampaniya foydasi)

### EP-MKT-007 · Kampaniya ROI (foyda qaytishi) hisobi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik ROI (xarajat Moliyadan, savdo SDдан). ShVB `marketingRoi` GSD; MarketingDashboard "Marketing ROI grafigi". Formula tafsiloti (foyda yoki aylanma) EP-MKT-051 da.
- **Manba:** ShVB YO'NALISH 25 (marketingRoi grafigi) + v1-A
- **action:** AI
- **⤳ Ta'sir:** Moliya (xarajat/foyda), SD (savdo), Hisobot

### EP-MKT-008 · Cost-per-lead (bitta lid narxi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik CPL (kanal xarajati / lid soni) har kanal uchun. ShVB `costPerLead` GSD bevosita.
- **Manba:** ShVB YO'NALISH 25 (costPerLead) + v1-A
- **action:** AI
- **⤳ Ta'sir:** Moliya (xarajat), Hisobot (kanal arzonligi), byudjet qarori

### EP-MKT-009 · Marketing KPI panosi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq KPI paneli (lid soni, konversiya %, CPL, ROI, NPS), avtomatik yangilanadi. ShVB Marketing 4-Otdelenie GSD paneli aynan shu (11 ko'rsatkich); mavjud `MarketingDashboard.tsx` + panels/sections.
- **Manba:** ShVB YO'NALISH 25 (11 KPI) + mavjud MarketingDashboard kod + v1-A
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, HR (KPI), butun marketing

### EP-MKT-010 · Ko'rgazmadan lid yig'ish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tez kiritish formasi (telefon+ism+qiziqish) ko'rgazma tugmasi bilan. Mavjud `MarketingExhibitions.tsx`; kitob — ko'rgazma B2B eng kuchli kanal, qog'oz vizitka yo'qoladi. Mobil/planshet kirish (EP-MKT-072).
- **Manba:** mavjud MarketingExhibitions kod + kitob (ko'rgazma kuchli) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid bazaga), Mobil ilova, SD

### EP-MKT-011 · Ko'rgazma natijasini o'lchash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'rgazma kampaniya sifatida ochiladi, xarajat + lid/savdo natijasi ulanadi (ko'rgazma ROI). Mavjud Exhibitions + campaigns; kitob "ko'rgazma qimmat — natijasini bilmasak kelasi yil qaror asossiz".
- **Manba:** mavjud Exhibitions/campaigns kod + kitob (ko'rgazma ROI) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya, SD, Hisobot (ko'rgazma taqqos)

### EP-MKT-012 · Ijtimoiy inbox (bitta joyda barcha xabar)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — barcha tarmoq xabari bitta inboxga, javob shu yerdan. Mavjud `MarketingSocialInbox.tsx` (+ Sections/Helpers/Types) + marketing-ext; ShVB `socialReach`. Provayder ulanishi EP-MKT-062 da (OCHIQ).
- **Manba:** mavjud SocialInbox kod + ShVB (socialReach) + v1-A
- **action:** READ
- **⤳ Ta'sir:** CRM (suhbatdan lid), AI integratsiya (avto-javob)

### EP-MKT-013 · Inboxdagi xabarni lidga aylantirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — suhbatdan "lid yarat" tugmasi (manba avtomatik shu kanal). Oltin-ip uzluksiz; mavjud social-inbox + leads. Xabar yo'qolmaydi, savdoga o'tadi.
- **Manba:** mavjud social-inbox/leads kod + master reja oltin-ip + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, CRM (lid kartasi)

### EP-MKT-014 · Inboxga javob berish vaqti nazorati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har xabarga javob vaqti o'lchanadi, kechikkanlar belgilanadi. Kitob "tez javob bergan kompaniya buyurtmani oladi"; ShVB nazorat ruhi. Aniq SLA daqiqasi EP-MKT-063 da.
- **Manba:** kitob (tez javob = buyurtma) + v1-A (SLA raqami EP-MKT-063)
- **action:** EVENT
- **⤳ Ta'sir:** HR/KPI (javob tezligi), xizmat sifati

### EP-MKT-015 · NPS (mijoz sadoqati) so'rovi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma yopilgach NPS so'rovi avtomatik (0-10) + ball saqlanadi. Memory (NPS real DB done); mavjud marketing-ext; ShVB `customerRetention` ruhi. Brak tarixi bilan bog'lash EP-MKT-105 da.
- **Manba:** memory (NPS real DB) + mavjud marketing-ext kod + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (mijoz mamnuniyati), Sifat (shikoyat), CRM

### EP-MKT-016 · NPS dan keyingi harakat
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — past ball (0-6) avtomatik ogohlantirish + mas'ulga vazifa. Karta-markazli model (vazifa→mas'ul kartasi); "eng arzon mijoz saqlash usuli". Kitob brak→uzr+chegirma (EP-MKT-105).
- **Manba:** karta-model (vazifa→mas'ul) + kitob (uzr+chegirma) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** CRM (vazifa), Bildirishnoma, Sifat

### EP-MKT-017 · Blog / kontent boshqaruvi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq (kontent ro'yxati + holati + qaysi kanalga + natija). Mavjud `MarketingContent.tsx` + marketing-content.controller; memory (blog real DB). Tasdiq oqimi EP-MKT-070 da.
- **Manba:** mavjud MarketingContent kod + memory (blog real DB) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** tashqi sayt (europrint.uz — Q27), Dizayn (post dizayni)

### EP-MKT-018 · Marketing kontent kalendari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kalendar ko'rinishi, mas'ul va kanal belgilanadi. Mavjud `MarketingCalendar.tsx`; memory (calendar real DB).
- **Manba:** mavjud MarketingCalendar kod + memory (calendar real DB) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (post vazifasi), Bildirishnoma (eslatma)

### EP-MKT-019 · Kim marketingni yuritadi (rollar)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rollar bo'yicha: marketolog (lid/inbox), boshliq (kampaniya/byudjet), direktor (hisobot). Karta-markazli RBAC; Q909 org-jadval (1-bo'linma operatsion / 6-dep strategiya). Rol-asosli kirish (CRM Q13 ruhi).
- **Manba:** karta-model RBAC + BARCHA_JAVOBLAR Q909 (org-jadval) + v1-A
- **action:** READ
- **⤳ Ta'sir:** Org-karta (lavozim), HR (RBAC), Xavfsizlik

### EP-MKT-020 · Karta-model bilan integratsiya (kartochka markazli)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har marketing vazifasi tegishli lavozim kartochkasiga bog'lanadi (talab/razryad/ЦКП). Vizyonning yadrosi — karta-markazli model; ish kartaga biriktirilgan. "Vizyonга to'liq mos."
- **Manba:** master reja karta-markazli model (org_card_centric) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (poydevor), HR (razryad/oylik), AI (karta AI)

### EP-MKT-021 · Marketing AI yordamchisi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI lid/kanal/kampaniya ma'lumotini tahlil qilib tavsiya beradi. Mavjud `marketing-ai.service.ts → analyzeCampaignEfficiency()`; vizyon 70% AI-tahlil; ShVB "qaysi kanal eng samarali".
- **Manba:** mavjud marketing-ai.service + ShVB (analyzeCampaignEfficiency) + LOYIHA-BITGAN (70% AI) + v1-A
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, Hisobot, karta AI

### EP-MKT-022 · Issiq lid belgilash (lid skoring)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — belgilar bo'yicha avtomatik baholanadi (qaytib yozgan, narx so'ragan = issiq). ShVB `qualifiedLeads`; mavjud lead-scoring yo'nalishi (CRM agents). Ball-vazni EP-MKT-044 da (OCHIQ).
- **Manba:** ShVB YO'NALISH 25 (qualifiedLeads) + mavjud lead-scoring + v1-A
- **action:** AI
- **⤳ Ta'sir:** SD (lid navbati), Hisobot (sifatli lid ulushi)

### EP-MKT-023 · Tavsiya kanalini kuzatish (kim tavsiya qildi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har tavsiya lidida "tavsiya qilgan mijoz/odam" yoziladi + kim ko'p olib kelgani. Kitob "karton bozorida tavsiya = eng ishonchli kanal". Bonus mexanizmi EP-MKT-117 da.
- **Manba:** kitob (tavsiya kuchli kanal) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (tavsiya zanjiri), SD, Moliya (rag'bat)

### EP-MKT-024 · Reklama xarajatini Moliya bilan ulash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — marketing xarajati Moliyadagi haqiqiy to'lovlardan avtomatik. ShVB `marketingBudgetUsed/Remain`; ROI/CPL to'g'ri bo'lishi uchun haqiqiy raqam shart. Zavod realiga mos moddalar EP-MKT-115 da.
- **Manba:** ShVB YO'NALISH 25 (budgetUsed/Remain) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** Moliya (xarajat moddasi), ROI/CPL hisobi

### EP-MKT-025 · Lid manbasi → mijoz umrbod qiymati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kanal bo'yicha kelgan mijozlarning umumiy savdosi (LTV manbasi). CRM RFM/CLV kod bor (EP-CRM-019); kitob — yirik takroriy mijoz (Benazir) kanalga bog'lanadi. LTV/CAC EP-MKT-054 da.
- **Manba:** CRM RFM/CLV kod (EP-CRM-019) + kitob (yirik mijoz kanali) + v1-A
- **action:** AI
- **⤳ Ta'sir:** CRM (takroriy sotuv), Moliya, SD

### EP-MKT-026 · Inboxda tayyor javob shablonlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor javob shablonlari (narx/muddat/minimal partiya), bir tugma bilan. Mavjud social-inbox; kitob FAQ (narx/eng kam buyurtma/yetkazib berish). Tez xizmat + bir xil to'g'ri ma'lumot.
- **Manba:** mavjud social-inbox kod + kitob (FAQ savollari) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SocialInbox, xizmat tezligi

### EP-MKT-027 · Marketing hisobotlari (kim ko'radi va qachon)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik oylik/haftalik hisobot direktor va boshliqqa. ShVB "haftalik marketing statistika"; kitob "har lavozim kunlik/haftalik/oylik hisobot rahbariyatga". Egaga 5-raqam EP-MKT-116 da.
- **Manba:** ShVB YO'NALISH 25 (haftalik statistika) + kitob (hisobot reglamenti) + v1-A
- **action:** CRON
- **⤳ Ta'sir:** Director dashboard, 7-departament (Administratsiya)

### EP-MKT-028 · Kampaniya ko'p kanaldan birga yuritish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bitta kampaniya ostida har kanal alohida lid/xarajat bilan. ShVB kanal taqsimoti; eng aniq tahlil (qaysi kanal kuchli). Atribusiya EP-MKT-085/086 bilan.
- **Manba:** ShVB YO'NALISH 25 (kanal taqsimoti) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kanal ulushi), Moliya (xarajat taqsim)

### EP-MKT-029 · Yo'qotilgan lid sababini saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rad sababi ro'yxatdan tanlanadi + statistika. Kitob qisqartirish-jadval (narx/format/чиқим) real sabablarni beradi; CRM EP-CRM-020 bilan bir xil tamoyil. Sabab RO'YXATI EP-MKT-050 da (OCHIQ).
- **Manba:** kitob (qisqartirish jadval sabablari) + CRM EP-CRM-020 + v1-A
- **action:** UPDATE
- **⤳ Ta'sir:** SD (narx siyosati), Hisobot (yo'qotish tahlili)

### EP-MKT-030 · Ko'rgazma/kampaniya material va byudjet rejasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kampaniyaga tayyorgarlik ro'yxati (banner/broshyura/sovg'a) + byudjet rejasi biriktiriladi. Mavjud Budget/Exhibitions; kitob "xom-ashyo to'liq bo'lmagan zakaz kiritilmaydi" ruhi (oldindan reja). Real moddalar EP-MKT-115.
- **Manba:** mavjud Budget/Exhibitions kod + kitob (oldindan to'liqlik) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (byudjet), Ombor (sovg'a/namuna material)

---

## II QISM — v2 granular (88 savol) — EP-MKT-031..118

### EP-MKT-031 · Marketing kanallari ro'yxati (qaysi kanallarni kuzatamiz) [v2-Q1]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — tayyor 8 kanal (Instagram, Telegram, Facebook, veb-sayt, ko'rgazma, sovuq qo'ng'iroq, tavsiya, vositachi-diler) + "boshqa". ShVB 3 kanalni (SMM/reklama/tavsiya) tasdiqlagan, B2B uchun ko'rgazma+vositachi qo'shiladi. Yakuniy ro'yxat (8 yoki 4) egasidan.
- **Manba:** ShVB (SMM/reklama/tavsiya) + kitob (ko'rgazma/vositachi B2B) + v2-A (yakuniy ro'yxat egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid manbasi), Hisobot (kanal ROI), SD

### EP-MKT-032 · Kanal ierarxiyasi (kanal + sub-manba / UTM) [v2-Q2]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ikki bosqich: kanal + sub-manba (UTM/kampaniya tegi). To'g'ri byudjet taqsimi uchun; lekin kiritish intizomi talab. UTM infratuzilma EP-MKT-079 bilan birga. Tamoyil tasdiq, joriy etish bosqichi egasidan.
- **Manba:** EP-MKT-079 (UTM) + v2-A (intizom egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** UTM kuzatuvi, Hisobot (sub-kanal ROI)

### EP-MKT-033 · Kanal byudjeti (oylik/choraklik reja) [v2-Q3]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kanal × oy byudjet jadvali (reja/sarflangan/qoldiq). ShVB `marketingBudgetUsed/Remain` reja-fakt nazorati; mavjud `MarketingBudget.tsx`. Sub-savol (oshganda kim tasdiqlaydi) → A: marketing rahbari avtomatik ogohlantirish.
- **Manba:** ShVB YO'NALISH 25 (budgetUsed/Remain) + mavjud MarketingBudget kod + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya/Byudjet (marketing moddasi), Hisobot (reja vs fakt)

### EP-MKT-034 · Byudjet valyutasi va reklama xarajat turlari [v2-Q4]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 6 xarajat turi (onlayn reklama, blogger, bosma material, ko'rgazma, namuna mahsulot, transport). Kitob — namuna quti+ko'rgazma stendi katta xarajat, "reklama"ga yashirilmasligi kerak. Zavod realiga mos modda tuzilmasi EP-MKT-115 da kengaytiriladi.
- **Manba:** kitob (namuna/ko'rgazma xarajati) + EP-MKT-115 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (xarajat turi), ROI/CPL aniqligi

### EP-MKT-035 · Kanal egasi (mas'ul xodim) [v2-Q5]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kanalga bitta mas'ul + zaxira. Karta-markazli model (kanal→lavozim kartasi); KPI shunga bog'lanadi (EP-MKT-076). Javobgarlik aniq.
- **Manba:** karta-model RBAC + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR/KPI (kanal natijasi), Org-karta

### EP-MKT-036 · Kampaniya asosiy maydonlari [v2-Q6]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq to'plam (nomi, maqsad turi, kanal(lar), byudjet, sana, mas'ul, maqsadli mijoz turi, kutilgan lid). Mavjud `campaign.aggregate` + campaign.dto; standart maydonlar = taqqoslanadi.
- **Manba:** mavjud campaign aggregate/dto kod + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (kampaniya taqqos), Moliya

### EP-MKT-037 · Kampaniya maqsad turi [v2-Q7]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 maqsad turi (yangi lid, brend tanitish, mavjud mijoz qaytarish, yangi mahsulot e'loni, ko'rgazmaga taklif) + har biriga asosiy ko'rsatkich. Maqsadga qarab muvaffaqiyat o'lchovi farq qiladi.
- **Manba:** mavjud campaigns kod + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (maqsadga mos KPI)

### EP-MKT-038 · Kampaniya holati (status) qiymatlari [v2-Q8]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 6 holat (Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor). Mavjud `campaign-status.enum.ts` + launch-campaign.handler — status hayot tsikli allaqachon kodda.
- **Manba:** mavjud campaign-status.enum kod + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (faol pul oqimi), Moliya

### EP-MKT-039 · Kampaniya maqsadli auditoriya (tarmoq) [v2-Q9]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor tarmoq ro'yxatidan ko'p tanlov (oziq-ovqat, meva-sabzavot eksport, qandolat, farmatsevtika, elektronika, savdo). Kitob — quti turi mijoz tarmog'iga bog'liq (meva ≠ qandolat quti). Segment manbasi sd_customers (EP-MKT-110 ABC).
- **Manba:** kitob (mijoz tarmog'i↔quti turi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz segmenti), SD (mahsulot mosligi)

### EP-MKT-040 · Kampaniya geografiyasi [v2-Q10]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — hudud tanlovi (viloyat/shahar) + eksport bayrog'i. Kitob — yetkazish narxi hududga bog'liq; eksport (Tojikiston) boshqa hujjat/narx (EP-MKT-108). Logistika bilan ulanadi.
- **Manba:** kitob (Tojikiston eksport, yetkazish narxi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (yetkazish), SD, Moliya

### EP-MKT-041 · Kampaniya natija o'lchovlari (kutilgan vs haqiqiy) [v2-Q11]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — reja va fakt yonma-yon (lid, sotuv, ROI) avtomatik. ShVB reja-fakt (campaignEfficiency); kuchli tahlil. Mavjud campaigns natija maydonlari.
- **Manba:** ShVB (campaignEfficiency reja-fakt) + mavjud campaigns kod + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (kampaniya samarasi), Moliya

### EP-MKT-042 · Kampaniya promo-kod / chegirma bog'lanishi [v2-Q12]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kampaniyaga promo-kod biriktiriladi, sotuvda kuzatiladi ("EXPO2026"). Kitob — yangi mijoz jalbida chegirma muhim, kim qaysi kod bilan kelganini bilmasak samara o'lchanmaydi. Sodiqlik imtiyozi qoidasi EP-MKT-108 bilan.
- **Manba:** kitob (chegirma B2B jalb) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (chegirma qo'llash), Moliya (chegirma xarajati)

### EP-MKT-043 · Lid sifati darajalari (issiq/iliq/sovuq) [v2-Q13]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 daraja (issiq/iliq/sovuq) + avtomatik ball asosida. ShVB `qualifiedLeads`; "son emas, sifat muhim" — sotuvchi issiqlarga vaqt. Ball formulasi EP-MKT-044 da.
- **Manba:** ShVB (qualifiedLeads) + EP-MKT-044 + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD (lid navbati), Hisobot (sifatli lid ulushi)

### EP-MKT-044 · Lid sifat ballari (qanday hisoblanadi) [v2-Q14]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 5 mezon (buyurtma hajmi, shoshilinchlik, byudjet aniqligi, mahsulot mosligi, qayta mijoz) → ball → daraja. Tamoyil tasdiq; har mezon VAZNI (foizi) egasidan — sub-savol: A (buyurtma hajmi eng og'ir 40%) tavsiya, lekin egasi belgilaydi.
- **Manba:** kitob (buyurtma hajmi/qayta mijoz muhim) + v2-A (vazn egasidan)
- **action:** AI
- **⤳ Ta'sir:** CRM/SD (lid navbati), Hisobot

### EP-MKT-045 · Lid minimal majburiy maydonlari [v2-Q15]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — majburiy: telefon + manba kanali + mahsulot qiziqishi; qolgani ixtiyoriy. Tamoyil tasdiq (telefonsiz/manbasiz = chala lid); aniq majburiy maydon ro'yxati egasidan (mahsulot turi EP-MKT-089 bilan).
- **Manba:** kitob (telefon+manba+mahsulot turi) + v2-A (yakuniy ro'yxat egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (sifatli ma'lumot), SD

### EP-MKT-046 · Takroriy (dublikat) lid nazorati [v2-Q16]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — telefon bo'yicha avtomatik dublikat aniqlash + ogohlantirish + birlashtirish taklifi. CRM yagona mijoz kartasi (EP-CRM-017); bir mijozga 3 sotuvchi qo'ng'iroq qilmasin. Toza baza.
- **Manba:** CRM EP-CRM-017 (yagona karta) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz kartasi yagonaligi), SD

### EP-MKT-047 · Lidni sotuvchiga taqsimlash qoidasi [v2-Q17]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mahsulot turi + hudud bo'yicha avtomatik, bo'lmasa navbat (round-robin). CRM EP-CRM-005 bilan bir xil tamoyil; kitob "Menedjer" ustuni (EP-MKT-090). Aniq qoida ustuvorligi (hudud yoki mahsulot avval) egasidan.
- **Manba:** CRM EP-CRM-005 + kitob (Menedjer ustuni) + v2-A (qoida tafsili egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** SD (lid egasi), HR/KPI (sotuvchi yuklamasi)

### EP-MKT-048 · Lid eskirishi (qancha vaqt javobsiz qolsa) [v2-Q18]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — belgilangan soat (mas. 4 soat) javobsiz → rahbarga signal + 24 soatdan keyin boshqa sotuvchiga. Kitob "issiq lid 1-2 kunda raqobatchiga ketadi". Aniq SOATlar (4/24) egasidan.
- **Manba:** kitob (issiq lid tez ketadi) + v2-A (soat raqami egasidan)
- **action:** CRON
- **⤳ Ta'sir:** SD (lid qayta taqsim), Bildirishnoma, HR/KPI

### EP-MKT-049 · Lid bosqichlari (lid → mijoz yo'li) [v2-Q19]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 6-7 bosqichli voronka (karton zavodga moslangan: namuna qutisi bosqichi bilan). Kitob — намуна→подписной лист B2B tugun (EP-MKT-093). Aniq bosqich NOMLARI egasidan (EP-MKT-004 bilan birga).
- **Manba:** kitob (namuna/подписной лист bosqichlari) + v2-A (nomlar egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (deal pipeline), Ishlab chiqarish (namuna qutisi)

### EP-MKT-050 · Lid yo'qotish sabablari [v2-Q20]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — tayyor sabablar ro'yxati (7-8: narx baland, raqobatchiga ketdi, miqdor kam, sifat mos emas, javob bermadi) + izoh. Kitob qisqartirish-jadval real sabablar; tamoyil tasdiq, aniq RO'YXAT egasidan (win/loss EP-MKT-104 bilan).
- **Manba:** kitob (qisqartirish jadval) + EP-MKT-104 + v2-A (ro'yxat egasidan)
- **action:** UPDATE
- **⤳ Ta'sir:** SD (narx siyosati), Hisobot (yo'qotish tahlili)

### EP-MKT-051 · ROI hisoblash formulasi [v2-Q21]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ROI = (kampaniyadan kelgan sotuv FOYDASI − marketing xarajat) / marketing xarajat (foyda asosli, aylanma emas). ShVB `marketingRoi`; tamoyil tasdiq. Sub-savol: foyda marjasi qayerdan — A (mahsulot tannarxidan avtomatik) tavsiya, egasidan.
- **Manba:** ShVB (marketingRoi) + kitob (foyda/dona, foyda/kg — Nosirov) + v2-A (marja manbasi egasidan)
- **action:** AI
- **⤳ Ta'sir:** Moliya (foyda marjasi), Hisobot

### EP-MKT-052 · Lid narxi (CPL) [v2-Q22]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kanal va kampaniya kesimida avtomatik CPL (xarajat / lidlar soni). ShVB `costPerLead` bevosita; byudjet qaroriga asos.
- **Manba:** ShVB YO'NALISH 25 (costPerLead) + v2-A
- **action:** AI
- **⤳ Ta'sir:** Moliya, byudjet qarori, Hisobot

### EP-MKT-053 · Mijoz jalb narxi (CAC) [v2-Q23]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — CAC = davr marketing xarajati / yangi mijozlar soni, kanal kesimida. ShVB ROI/CPL oilasiga mantiqan qo'shiladi (lid ≠ mijoz, haqiqiy samara CACда). 
- **Manba:** ShVB YO'NALISH 25 (ROI/CPL oilasi) + v2-A
- **action:** AI
- **⤳ Ta'sir:** Moliya, Hisobot (kanal samarasi)

### EP-MKT-054 · Mijoz umrbod qiymati (LTV) va ROI ufqi [v2-Q24]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 12 oylik takroriy sotuvni hisobga olgan ROI (LTV/CAC nisbati). Kitob — mijoz takroriy buyurtma beradi (Benazir), birinchi sotuvда zarar ko'rinsa ham yil davomida foydali. CRM CLV (EP-CRM-019).
- **Manba:** kitob (takroriy buyurtma) + CRM CLV (EP-CRM-019) + v2-A
- **action:** AI
- **⤳ Ta'sir:** CRM (takroriy sotuv tarixi), Moliya

### EP-MKT-055 · ROI bog'lanish davri (atribusiya oynasi) [v2-Q25]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 90 kunlik atribusiya oynasi (B2B sekin tsiklga mos). Kitob — karton qutining sotuv tsikli uzun (lid 2 oydan keyin sotib oladi). Tamoyil tasdiq, aniq KUN (90/30/cheksiz) egasidan.
- **Manba:** kitob (uzun B2B tsikl) + v2-A (kun raqami egasidan)
- **action:** AI
- **⤳ Ta'sir:** ROI/CAC hisobi, Hisobot

### EP-MKT-056 · Ko'p kanal atribusiyasi (kim hisobga olinadi) [v2-Q26]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — oxirgi teginish asosiy + birinchi teginish ham qayd (ikkalasi ko'rinadi). Muvozanatli; dastlabki kanal "befoyda" ko'rinmaydi. Tamoyil tasdiq, model (oxirgi/birinchi/bo'linadigan) egasidan.
- **Manba:** v2-A (atribusiya modeli egasidan)
- **action:** AI
- **⤳ Ta'sir:** Hisobot (kanal ROI adolatli), Moliya

### EP-MKT-057 · Ko'rgazma (vystavka) ro'yxatga olish [v2-Q27]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'rgazma kartochkasi (xarajat, sana, joy, stend o'lchami, mas'ul, kutilgan lid). Mavjud `MarketingExhibitions.tsx`; kitob — ko'rgazma eng kuchli, lekin qimmat (to'liq hisob shart).
- **Manba:** mavjud MarketingExhibitions kod + kitob (ko'rgazma kuchli/qimmat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (ko'rgazma xarajati), SD

### EP-MKT-058 · Ko'rgazmada lid yig'ish usuli [v2-Q28]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — telefondagi tezkor forma (ism, telefon, qiziqish) bir necha soniyada → joyida bazaga. Kitob — 200 ta odam, qog'oz yo'qoladi. EP-MKT-010 bilan bir xil; mobil ilova.
- **Manba:** mavjud Exhibitions kod + kitob (qog'oz yo'qoladi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (lid avtomatik), Mobil ilova

### EP-MKT-059 · Ko'rgazma lidini sotuvga ulash va kuzatish [v2-Q29]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har lid ko'rgazma tegiga bog'lanadi, sotuvgacha kuzatiladi (ko'rgazma ROI avtomatik). Oltin-ip; kitob — 3 yirik mijoz bersa ko'rgazma foydali. Aniq qaytim.
- **Manba:** master reja oltin-ip + kitob (ko'rgazma ROI) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (sotuvga ulash), Moliya, Hisobot

### EP-MKT-060 · Ko'rgazma keyingi ish (follow-up) jadvali [v2-Q30]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'rgazma tugagach avtomatik vazifalar (48 soat ichida bog'lanish) + bajarilishini kuzatish. Kitob — ko'rgazmadan keyin lid "issiq", kech bo'lsa qiziqish so'nadi. Karta-model vazifa→mas'ul.
- **Manba:** kitob (issiq lid tez so'nadi) + karta-model + v2-A
- **action:** CRON
- **⤳ Ta'sir:** CRM (vazifalar), HR/KPI

### EP-MKT-061 · Ko'rgazma natija hisobotini taqqoslash [v2-Q31]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'rgazmalar bo'yicha tarixiy taqqoslash jadvali (yillar kesimida: xarajat/lid/sotuv/ROI). ShVB hisobot reglamenti; kitob — qaysi ko'rgazma har yili foyda, qaysi pul yeydi.
- **Manba:** ShVB (hisobot) + kitob (yillik taqqos) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Hisobot (strategik qaror), Moliya

### EP-MKT-062 · Ijtimoiy inbox (yagona xabarlar oynasi) [v2-Q32]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — barcha kanal xabarlari bitta inboxda (kim javob berdi, holati). Mavjud `MarketingSocialInbox.tsx` UI tayyor; lekin Instagram/FB/Telegram API PROVAYDER ulanishi (kim/qaysi avval) egasidan — Telegram bot (egasi ekotizimi) eng avval.
- **Manba:** mavjud SocialInbox kod + ShVB (socialReach) + v2-A (provayder ulanishi egasidan)
- **action:** READ
- **⤳ Ta'sir:** CRM (suhbatdan lid), AI integratsiya (Telegram), Bildirishnoma

### EP-MKT-063 · Inbox xabariga javob vaqti (SLA) [v2-Q33]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ish vaqtida 15 daqiqa, tashqarisida ertasi ertalab SLA + kechikkanlar signal. Kitob (tez javob = buyurtma); EP-MKT-014 bilan. Aniq SLA daqiqasi (15/30) egasidan.
- **Manba:** kitob (tez javob muhim) + EP-MKT-014 + v2-A (daqiqa egasidan)
- **action:** EVENT
- **⤳ Ta'sir:** HR/KPI (javob tezligi), xizmat sifati

### EP-MKT-064 · Inbox xabaridan lid yaratish [v2-Q34]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — suhbatdan "Lid yarat" tugmasi (manba avtomatik shu kanal). EP-MKT-013 bilan bir xil; uzilishsiz o'tish.
- **Manba:** mavjud social-inbox/leads kod + master reja oltin-ip + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM, SD

### EP-MKT-065 · Inbox javob shablonlari va tezkor javoblar [v2-Q35]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — shablonlar kutubxonasi (narx so'rovi, namuna, muddat, minimal partiya). EP-MKT-026 bilan; tez va bir xil to'g'ri.
- **Manba:** mavjud social-inbox kod + kitob (FAQ) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SocialInbox, xizmat tezligi

### EP-MKT-066 · Inbox mas'ul va kanal egasi tayinlash [v2-Q36]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — suhbat ochilganda biriktiriladi yoki avtomatik navbat + "javob berilmoqda" belgisi. Karta-model (mas'ul→karta); ikki xodim bir mijozga javob bermasin. EP-MKT-035 kanal egasi bilan.
- **Manba:** karta-model + EP-MKT-035 + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** HR (mas'uliyat), SocialInbox

### EP-MKT-067 · Inbox spam/ahamiyatsiz xabar filtri [v2-Q37]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — spam belgisi + alohida papka, statistikadan chiqariladi. Spam orasida haqiqiy lid yo'qolmasin, statistika buzilmasin. Toza ko'rinish.
- **Manba:** mavjud social-inbox kod + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** SocialInbox (toza statistika), AI (avto-spam)

### EP-MKT-068 · Kontent kalendar asoslari [v2-Q38]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — taqvim ko'rinishi (oy/hafta) + post kartochkalari. Mavjud `MarketingCalendar.tsx`; tartibli reja (postlar tartibsiz chiqmasin). EP-MKT-018 bilan.
- **Manba:** mavjud MarketingCalendar kod + memory (calendar real DB) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (post vazifasi), Bildirishnoma

### EP-MKT-069 · Kontent posti maydonlari [v2-Q39]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq (sana, kanal(lar), sarlavha, matn, media, mas'ul, holat, bog'liq kampaniya). Mavjud MarketingContent; standart maydonlar = bir qarashda tayyor-tayyormas ko'rinadi.
- **Manba:** mavjud MarketingContent kod + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn (media), kampaniya bog'lanishi

### EP-MKT-070 · Kontent holati va tasdiqlash oqimi [v2-Q40]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 bosqichli oqim (g'oya→matn tayyor→dizayn tayyor→tasdiqlangan→joylandi) + rahbar tasdig'idan keyin joylash. BARCHA_JAVOBLAR Q172 (HR↔Marketing reklama "1-2-3" ketma-ket tasdiq) shu oqim ruhi; tasdiqsiz post brendga zarar bermaydi.
- **Manba:** BARCHA_JAVOBLAR Q172 (1-2-3 tasdiq) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Dizayn moduli (post dizayni vazifasi), kontent sifati

### EP-MKT-071 · Kontent rukni (kontent turlari rejasi) [v2-Q41]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 5-6 kontent turi (mahsulot ko'rsatish, mijoz tavsiyasi, "zakulis" ishlab chiqarish, aksiya, foydali maslahat) + har haftaga muvozanat. Tamoyil tasdiq; aniq turlar va NISBAT (mas. kamida 1 foydali maslahat) egasidan.
- **Manba:** v2-A (turlar/nisbat egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** Kontent kalendari, Dizayn

### EP-MKT-072 · Kontent posti natija ko'rsatkichlari [v2-Q42]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asosiy ko'rsatkichlar (qamrov, layk, izoh, saqlash) + "shu postdan kelgan lid" bog'lanishi. ShVB `socialReach`; qaysi kontent lid keltiradi ko'rinadi.
- **Manba:** ShVB (socialReach) + mavjud MarketingContent kod + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (kontent samarasi), CRM (post→lid)

### EP-MKT-073 · Kontent joylash eslatmalari [v2-Q43]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — post vaqtidan oldin avtomatik eslatma (mas'ulga). Karta-model vazifa eslatmasi; rejalashtirilgan post unutilmasin. Bildirishnoma bilan.
- **Manba:** karta-model + mavjud calendar kod + v2-A
- **action:** CRON
- **⤳ Ta'sir:** Bildirishnoma (NTF), Kontent kalendari

### EP-MKT-074 · Marketing → Sotuv lidni topshirish nuqtasi [v2-Q44]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lid "iliq" yoki undan yuqori bo'lganda avtomatik sotuvga + qabul belgisi. Oltin-ip aniq mas'uliyat chizig'i; "marketing bermadi / sotuv olmadi" ayblashuvi tugaydi. EP-MKT-090 Menedjer ustuni.
- **Manba:** master reja oltin-ip + kitob (Menedjer ustuni) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (lid qabul), HR/KPI (marketing vs sotuv javobgarligi)

### EP-MKT-075 · Namuna qutisi (sample) so'rovi marketingda [v2-Q45]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — namuna so'rovi lid kartochkasidan ishlab chiqarishga yuboriladi + holati kuzatiladi. Kitob — B2B mijoz avval namuna so'raydi, jarayon uzilmasligi kerak. EP-MKT-094 namuna ROI bilan.
- **Manba:** kitob (namuna so'rovi B2B) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (namuna buyurtma), Ombor (namuna materiali)

### EP-MKT-076 · Marketing umumiy boshqaruv paneli (dashboard) [v2-Q46]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq panel (6-8 ko'rsatkich + ogohlantirishlar). Mavjud `MarketingDashboard.tsx` + Panels/Sections; ShVB Marketing 4-Otdelenie GSD paneli. EP-MKT-009 bilan. Egaga 5-raqam alohida EP-MKT-116.
- **Manba:** ShVB YO'NALISH 25 + mavjud MarketingDashboard kod + v2-A
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, butun marketing

### EP-MKT-077 · Marketing xodimi KPI ko'rsatkichlari [v2-Q47]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3-4 KPI (sifatli lid, konversiya %, kanal ROI, SLA). ShVB `marketingGsd`; karta statistik ko'rsatkichlari. Sub-savol: konversiya sotuvchiga ham bog'liq, marketing aybi qayerda tugaydi — A (faqat sifatli lidgacha javobgar) tavsiya, egasidan.
- **Manba:** ShVB (marketingGsd) + kitob (lavozim statistik ko'rsatkichi) + v2-A (chegara egasidan)
- **action:** READ
- **⤳ Ta'sir:** HR/Payroll (bonus), Org-karta

### EP-MKT-078 · Raqobatchi kuzatuvi (karton bozori) [v2-Q48]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — raqobatchi kartochkasi (nomi, mahsulot turi, taxminiy narx, kuchli/zaif tomon) muntazam yangilanadi. Kitob — mijoz "falon zavod arzonroq" deydi (Qo'qon/vodiy raqobat); narxni dalil bilan moslash. EP-MKT-104 win/loss bilan.
- **Manba:** kitob (Qo'qon/vodiy raqobat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx siyosati), Moliya

### EP-MKT-079 · UTM / havola kuzatuvi (veb va ijtimoiy) [v2-Q49]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har reklama/postga maxsus kuzatuv havolasi + lidga avtomatik manba. Tamoyil to'g'ri (aniq bog'lanish); lekin UTM infratuzilma (vebsayt analitika ulanishi, kim sozlaydi) egasidan. EP-MKT-032 sub-manba bilan.
- **Manba:** EP-MKT-032 (sub-manba) + v2-A (infratuzilma egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** vebsayt (analitika), CRM (lid manbasi)

### EP-MKT-080 · Sodiqlik / takroriy mijoz kampaniyasi [v2-Q50]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz tarixiga qarab avtomatik segment (3 oy buyurtma bermaganlar) + maxsus kampaniya. Kitob — yangi mijoz takroriydan 5x qimmat; eski mijozni qaytarish eng arzon. Churn (EP-MKT-084) + win-back (EP-MKT-103) bilan.
- **Manba:** kitob (takroriy 5x arzon) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM (mijoz segmenti), SD (takroriy buyurtma)

### EP-MKT-081 · Marketing material va brending arxivi [v2-Q51]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — markaziy material kutubxonasi (versiya bilan: logotip, katalog, narx ro'yxati, namuna foto, prezentatsiya). BARCHA_JAVOBLAR Q77 (hammasi ERPda) ruhi; sotuvchi yangi/to'g'ri katalog yuborsin. MIJOZ brendi alohida EP-MKT-095 (farqli).
- **Manba:** BARCHA_JAVOBLAR Q77 (hammasi ERPda) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (katalog), Dizayn arxivi

### EP-MKT-082 · Mijoz so'rovnoma / mamnuniyat (NPS) [v2-Q52]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma yetkazilgach avtomatik qisqa so'rovnoma (0-10 + izoh). EP-MKT-015 bilan; memory NPS real DB. Brak tarixi bilan bog'lash EP-MKT-105.
- **Manba:** memory (NPS real DB) + mavjud marketing-ext + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (mamnuniyat), Sifat (shikoyat tahlili)

### EP-MKT-083 · Bitrix24 bilan kelishuv (o'rin bosadimi / yonida) [v2-Q53]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — **ERP yagona manba bo'lsin, Bitrix24 dan lid/mijoz ko'chiriladi va keyin Bitrix24 dan voz kechiladi** (bitta haqiqat). Egasi CRM Q33 da Bitrix24→to'liq ERP qarorini bergan → bu bilan to'liq mos. Lekin O'TISH REJASI (sub-savol: bir martalik CSV yoki avtomatik API ko'prik) egasidan. ⚠️ "Ikki dunyo" muammosini qaytarmaslik uchun A shart.
- **Manba:** BARCHA_JAVOBLAR/CRM Q33 (Bitrix24→ERP) + memory (ikki-dunyo) + v2-A (ko'chirish rejasi egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** CRM (yagona baza), SD, Dizayn bo'limi (Bitrix24 kanban)

### EP-MKT-084 · Takroriy buyurtmachining yo'qolishini erta sezish (churn) [v2-Q54]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozning o'z ritmiga nisbatan kechikkani aniqlanadi (Benazir har hafta, Fortech har 3 oy) → savdo menejerga signal. Kitob — daromad takroriy mijozdan, bittasi to'xtasa 2 oydan keyin sezamiz = kech. ShVB `customerRetention`; CRM churn kod (EP-CRM-014).
- **Manba:** kitob (Benazir/Panda/Krember ritmi) + ShVB (customerRetention) + CRM churn (EP-CRM-014) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD savdo tarixi, CRM, Bildirishnoma

### EP-MKT-085 · "Kichiklashgan buyurtmalar" signali (M.Nosirov tahlili) [v2-Q55]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik: mijozning oylik buyurtma summasi/soni/razmeri tushsa "kamayish" belgisi + sabab so'raladi. Kitob — Nosirov "Kichiklashgan buyurtmalar tahlili" Excel (razmer eski→yangi, foyda/dona, foyda/kg) ERPga avtomatlashtiriladi. Sub: kamayish sabab ro'yxati (raqib/sifat/biznes qisqardi/razmer) A.
- **Manba:** kitob (Nosirov Kichiklashgan buyurtmalar Excel) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD, Moliya (daromad trendi, foyda/kg)

### EP-MKT-086 · Mijoz brend standartlari kutubxonasi (MIJOZ brendi) [v2-Q56]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mijoz kartochkasida "brend pasporti": logo fayl + rang kodlari (Pantone/CMYK) + shrift + taqiqlar. Kitob — дизайн "брен стандартлари" = MIJOZ brendi (Tefal qizil noto'g'ri chiqsa rad). Sub: kim yuritadi — A (dizayn bo'limi rahbari). v2-Q51 (bizning material) dan FARQLI.
- **Manba:** kitob (брен стандартлари = mijoz brendi, Tefal/Benazir) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi (ЦКП), SD mijoz kartasi, Sifat

### EP-MKT-087 · Mahsulot namunalari portfolio (bizning ish ko'rgazmasi) [v2-Q57]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mahsulot turi bo'yicha portfolio (shirinlik/pizza/filtr/etiketka/gofra) — namuna rasmlar + texnik imkoniyat. Kitob — B2B "mening qutimni qila olasizmi", avval qilingan ish (Panda/Tefal A-19/Ganga Pizza) ishonch beradi. Sub: brendlangan PDF — A (ha).
- **Manba:** kitob (Panda/Tefal/Ganga namunalari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD savdo vositasi, Dizayn arxivi

### EP-MKT-088 · "Опросный лист" (mijoz brifi) — marketing/savdo kirish nuqtasi [v2-Q58]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — lid'dagi talab ("Benazir uchun 25x19x12 quti") опросный лист ga old-to'ldirilgan holda o'tadi. Kitob — опросный лист = тех карта asosi; lid ma'lumoti qayta yozilmasin. Tamoyil tasdiq; sub: опросный лист MAYDONLARI ro'yxatini kim kiritadi — A (bosh texnolog + savdo birga) egasidan.
- **Manba:** kitob (опросный лист→тех карта zanjiri) + v2-A (maydon-egasi egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** SD, Dizayn (опросный→тех карта→лаборатория), Ishlab chiqarish

### EP-MKT-089 · Lid mahsulot turi bo'yicha tasniflash (zavod realiga mos) [v2-Q59]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lid'da mahsulot turi majburiy (ofset karton quti / gofra mikro-makro / etiketka samokley / flekso gofra / pechat blanka). Kitob — har tur boshqa dastgoh/narx/menejer. Sub: tur ro'yxati — A (ishlab chiqarish mahsulot turlari katalogidan, yagona master).
- **Manba:** kitob (zavod mahsulot turlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Ishlab chiqarish (mahsulot turi→dastgoh)

### EP-MKT-090 · Savdo menejerga lid biriktirish ("Menedjer" ustuni) [v2-Q60]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lid keladi → menejerga biriktiriladi (mahsulot turi/hudud bo'yicha avtomatik), biriktirilmagan lid "egasiz" ro'yxatida qizil. Kitob — buyurtma Excel "Azizov Avazxon - Menedjer (54)" ustuni; "egasiz lid = o'lik lid". EP-MKT-047 (umumiy qoida) dan aniq holat.
- **Manba:** kitob (Menedjer ustuni, Azizov) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD menejer, HR (menejer KPI)

### EP-MKT-091 · Mijozning to'lov intizomi marketingga signal [v2-Q61]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz/lid kartasida to'lov intizomi belgisi (Moliyadan: kechikkan to'lov, qarz) ko'rinadi. Kitob ruhi — to'lamaydigan mijozга vaqt sarflash zarar (Дебитор siyosati). Sub: ogohlantirishmi yoki bloklaydimi — A (ogohlantirish, qaror menejerda) tavsiya, egasidan (Finance bilan).
- **Manba:** kitob (Дебитор қарздорлик siyosati) + v2-A (blok/ogoh egasidan)
- **action:** READ
- **⤳ Ta'sir:** Moliya (AR/qarz), SD, CRM

### EP-MKT-092 · Mavsumiy talab kalendari (zavod mavsumlariga mos) [v2-Q62]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mavsumiy talab kalendari (o'tgan yillar buyurtma tarixidan avtomatik) + "shu mijozga shu oyda qo'ng'iroq qil" eslatmasi. Kitob — Yangi yil oldidan Benazir/Panda 3x oshadi, dastgoh band bo'lishidan oldin band qilamiz (Bandlik.xlsx). v2-Q38 (kontent kalendari) dan FARQLI = talab kalendari.
- **Manba:** kitob (Yangi yil shirinlik 3x, Bandlik.xlsx) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD, Ishlab chiqarish rejasi (dastgoh bandligi)

### EP-MKT-093 · Dizayn namuna (макет) tasdiqlash marketing voronkasida [v2-Q63]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — voronkaga "Namuna tayyorlandi → Namuna tasdiqida → Tasdiqlandi (подписной лист)" bosqichlari qo'shiladi. Kitob — подписной лист = mijoz tasdiqlagan dizayn = dizayn ЦКП si; sotuvning haqiqiy "ha" nuqtasi. EP-MKT-049 voronka bilan. v2-Q19 dan FARQLI.
- **Manba:** kitob (подписной лист = ЦКП) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Dizayn bo'limi (подписной лист), CRM voronka, SD

### EP-MKT-094 · Mahsulot namunasi (fizik sample) XARAJATI va ROI [v2-Q64]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — namuna so'rovi kartochkasi: material+vaqt xarajati + natija (mijoz bo'ldimi) → namuna ROI va konversiya. Kitob ruhi — bepul namuna berib mijoz topmaslik = sof zarar. EP-MKT-075 (qayd) dan chuqurroq. Sub: namuna xarajati CPLга qo'shiladimi — A (ha).
- **Manba:** kitob (namuna xarajati hisobi) + Ombor (material chiqimi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (material chiqimi), Moliya (xarajat), CRM

### EP-MKT-095 · Mijozning kelajak ehtiyoji — yillik forecast olish [v2-Q65]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yirik mijozdan yillik ehtiyoj prognozi olinadi → ishlab chiqarish/material rejasiga ulanadi (orientir, majburiyat emas). Kitob — Benazir "yilda 500 ming quti", material+dastgoh oldindan reja, B2B sodiqlik vositasi.
- **Manba:** kitob (yirik mijoz yillik ehtiyoj) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish rejasi (MPS), Ombor (material), Moliya

### EP-MKT-096 · Lid texnik amalga oshirilishi (biz qila olamizmi) tekshiruvi [v2-Q66]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lid talabini texnik imkoniyatga (dastgoh formati/material — "Формат листа"/"Формат гофро") avtomatik solishtirish → "qila olamiz/qiyin/yo'q". Kitob — yolg'on va'da (keyin ishlab chiqarish "qila olmaymiz") sharmandalik. Sub: qila olmasak alternativa — A (eng yaqin imkoniyat).
- **Manba:** kitob (Формат листа/гофро texnik chegara) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish (dastgoh formati), Dizayn

### EP-MKT-097 · Papka raqami (PT/KT/E) bo'yicha "takror qil" tezligi [v2-Q67]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz kartasida barcha papka raqamlari (PT/KT/E) + oxirgi buyurtma → "takror qil" bir tugma (eski тех карта + yangi narx). Kitob — PT1153/KT3919/E9358 kodlari; "o'tgan yilgi Tefal A-19 qutini qaytadan" noldan ishlash kerak emas = savdo tezligi.
- **Manba:** kitob (папка № PT/KT/E + Tefal A-19) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Dizayn arxivi (макет), Ishlab chiqarish (тех карта)

### EP-MKT-098 · Mijoz "wallet share" — u bizdan yana nimani olishi mumkin [v2-Q68]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz kartasida "biz qilayotgan / qila oladigan lekin olmayotgan" mahsulotlar + AI tavsiyasi. Kitob — Benazir 7 xil quti, lekin etiketkani boshqadan olsa biz ham olishimiz mumkin. Vizyon 70% AI-tahlil (upsell).
- **Manba:** kitob (Benazir 7 xil quti, upsell) + LOYIHA-BITGAN (70% AI) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD (upsell), mahsulot katalogi

### EP-MKT-099 · Mijoz qoniqishini sifat shikoyati bilan bog'lash [v2-Q69]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz kartasida shikoyat/brak tarixi (qc_reclamations) NPS bilan birga + brak bo'lsa avtomatik "uzr+chegirma". Kitob/Sifat — brak bo'lgan mijozga "tavsiya qilasizmi" so'rash noto'g'ri vaqt. v2-Q52 (NPS yig'ish) dan FARQLI.
- **Manba:** kitob/Sifat (qc_reclamations) + EP-MKT-016 (NPS harakat) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (reklamatsiya), CRM, SD

### EP-MKT-100 · Yutilgan/yo'qotilgan lid sababi + raqobat surati (win/loss) [v2-Q70]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har yutilgan/yo'qolgan lid'da raqib nomi + sabab (narx/sifat/muddat) majburiy → raqobat va sabab hisoboti. Kitob — Qo'qon/vodiy raqobat, "X zavod arzonroq qildi" to'planib turса dalil bilan moslaymiz. v2-Q48 (umumiy raqobat) + EP-MKT-050 (sabab) bilan, lekin har lid bo'yicha aniq.
- **Manba:** kitob (vodiy raqobat, win/loss) + EP-MKT-078 + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** SD, narx siyosati (Moliya)

### EP-MKT-101 · Sotuvchi tavsiya skripti (karta-darslik modeliga mos) [v2-Q71]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mahsulot bo'yicha savdo skripti + FAQ (lavozim kartasi darsligiga bog'liq). Kitob/vizyon — har lavozimda "darslik+nazorat varaqasi" (karta-markazli); darslik kartaga biriktirilgan (memory org_card). Yangi menejer tez ishga tushadi.
- **Manba:** master reja karta-markazli (darslik kartaga) + kitob (RD-5 darslik) + v2-A
- **action:** READ
- **⤳ Ta'sir:** HR (lavozim kartasi+darslik), LMS, karta-model

### EP-MKT-102 · Hudud/eksport segmenti (Qo'qon + vodiy + Tojikiston) [v2-Q72]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mijoz/lid hudud (viloyat/davlat) + eksport/ichki belgisi + hudud bo'yicha savdo xaritasi. Kitob — "Apricot usti qizil (Tojikiston)"; eksport boshqa hujjat+narx. v2-Q10 (kampaniya geo) dan FARQLI = mijoz segmenti.
- **Manba:** kitob (Tojikiston eksport) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Logistika (yetkazib berish), Moliya

### EP-MKT-103 · Mijoz aloqa shaxsi (kontakt) o'zgarishini kuzatish [v2-Q73]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozda bir nechta kontakt + "asosiy kontakt o'zgardi" belgisi → darrov aloqa vazifasi. Kitob ruhi — xaridor almashganda yangi odam eski yetkazuvchisini olib keladi, biz yo'qolamiz; tez munosabat quramiz.
- **Manba:** kitob (kontakt almashish xavfi) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** SD, CRM

### EP-MKT-104 · "Sovuq" eski mijozni qayta uyg'otish (win-back, dormant) [v2-Q74]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "uzoq sukut saqlagan eski mijoz" ro'yxati (mijoz ritmiga nisbatan) + qayta aloqa vazifasi menejerga. Kitob — 2023 yilgi ko'p papka; eski mijoz tanish/ishonchli, "sog'indik" qo'ng'irog'i bir qismini qaytaradi = deyarli bepul savdo. v2-Q50 (aktiv sodiqlik) dan FARQLI = dormant.
- **Manba:** kitob (2023 papka, dormant) + EP-MKT-084 churn + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD savdo tarixi, CRM

### EP-MKT-105 · Mijoz toifalash (ABC) → xizmat darajasi [v2-Q75]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik ABC (yillik summa+takror+foyda) + har toifaga xizmat darajasi (A-mijoz ustuvor reja+narx). Kitob — A mijoz (Benazir/Panda) ketsa katta zarar, doimiy e'tibor; C ga ko'p vaqt zarar. sd_customers ABC kod bor (EP-SD-007).
- **Manba:** mavjud sd_customers ABC (EP-SD-007) + kitob (A/B/C mijoz) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD (ABC), Moliya

### EP-MKT-106 · Yangi mahsulot turi talabini o'lchash (flekso liniya qarori) [v2-Q76]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — so'rov/lid'larda mahsulot turi statistikasi → "qaysi turga talab o'syapti" → egasi + Rivojlanish bo'limi (6-departament) hisoboti. Kitob/egasi — flekso gofra 90 metrli liniya rejada; investitsiya dalilli. Q909 6-dep = Marketing strategiyasi/Innovatsiya.
- **Manba:** kitob (flekso liniya rejasi) + BARCHA_JAVOBLAR Q909 (6-dep Rivojlanish) + v2-A
- **action:** AI
- **⤳ Ta'sir:** SD, Ishlab chiqarish (yangi liniya), 6-departament (Rivojlanish)

### EP-MKT-107 · Mijozga buyurtma holati shaffofligi (B2B kuzatuv) [v2-Q77]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozga buyurtma holati ko'rinadigan link/bot (faqat o'z buyurtmasi, umumiy bosqich+%). Kitob — B2B mijoz "qutim tayyormi" deb qo'ng'iroq qiladi, menejer vaqtini oladi; mijoz o'zi ko'rsa qo'ng'iroq kamayadi, ishonch ortadi. Egasi Telegram bot ekotizimi.
- **Manba:** kitob (B2B kuzatuv talabi) + egasi Telegram bot + v2-A
- **action:** READ
- **⤳ Ta'sir:** SD, Ishlab chiqarish (буюртма тайёрлиги %), POS Monitor

### EP-MKT-108 · Sodiqlik imtiyozi qoidasi (B2B bonus, suiiste'molsiz) [v2-Q78]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sodiqlik darajasi (yillik hajmga ko'ra) + avtomatik imtiyoz qoidasi (ega+savdo boshlig'i belgilaydi). Kitob — chegirma menejer kayfiyatiga bog'liq = suiiste'mol xavfi; qoida asosida adolatli/shaffof. v2-Q50 (aloqa kampaniyasi) dan FARQLI = imtiyoz QOIDASI.
- **Manba:** kitob (chegirma suiiste'mol xavfi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx), Moliya

### EP-MKT-109 · Marketing va Dizayn bo'limi ish yuki muvozanati [v2-Q79]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — marketing dizayn bo'limi bandligini (kanban yuki) ko'radi → realdan ko'p va'da bermaydi. Kitob — bir nechta buyurtma birga kelganda rahbar ustuvorlik belgilaydi; dizayn 2 hafta kechiksa mijoz ketadi. Bitrix24→ERP kanban (EP-MKT-083).
- **Manba:** kitob (dizayn ustuvorlik, tor bo'g'in) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Dizayn bo'limi (ish taqsimoti), Ishlab chiqarish rejasi, CRM

### EP-MKT-110 · Ishlab chiqarish bo'sh quvvatini to'ldirish signali [v2-Q80]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ishlab chiqarish bo'sh quvvati marketingga signal → "bo'sh davr aksiyasi" (ega+savdo boshlig'i tasdiqlaydi). Kitob — dastgoh bo'sh tursa sof zarar (ijara/oylik to'lanadi); Bandlik.xlsx quvvat. Aksiya bilan bo'shliqni to'ldiramiz.
- **Manba:** kitob (Bandlik.xlsx bo'sh dastgoh zarar) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (dastgoh bandligi), SD, Moliya

### EP-MKT-111 · Mahsulot rentabelligi marketing fokusini yo'naltirsinmi [v2-Q81]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz/mahsulot foyda darajasi marketingga ko'rinadi (faqat boshliq+ega — maxfiy) → yuqori foydaliga e'tibor. Kitob — Nosirov foyda/dona, foyda/kg; ko'p buyurtma ≠ ko'p foyda. Rol-asosli maxfiylik (CRM Q13). 
- **Manba:** kitob (Nosirov foyda/dona, foyda/kg) + rol-maxfiylik (CRM Q13) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Moliya (foyda/dona, foyda/kg), SD

### EP-MKT-112 · Savdo menejer faolligi (karta statistik ko'rsatkichi) [v2-Q82]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — menejer kartasida faollik (aloqa soni, qisman CRMдан avtomatik) + natija (buyurtma/summa). Kitob — har lavozimda "статистик кўрсаткичлар" (karta-markazli); faollik past bo'lsa sabab aniqlanadi, adolatli. v2-Q47 (marketing KPI) dan FARQLI rol.
- **Manba:** kitob (lavozim статистик кўрсаткичлар) + karta-model + v2-A
- **action:** READ
- **⤳ Ta'sir:** HR (lavozim kartasi, KPI), SD

### EP-MKT-113 · Dizayn yangilash taklifi mijozga (upsell dizayn) [v2-Q83]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — dizayn yangilash takliflari ro'yxati → savdo menejer mijozga taqdim → qabul qilinsa опросный лист old-to'ldiriladi. Kitob — "yangi dizayn", "yangi lagatip" ko'p; eski qutini yangilab taklif = yangi buyurtma + sodiqlik. EP-MKT-088 опросный лист bilan.
- **Manba:** kitob (yangi dizayn/lagatip takliflari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi, SD, CRM

### EP-MKT-114 · Mijozning ishlab chiqarish/aksiya kalendariga moslashish [v2-Q84]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz kartasida uning mahsulot/aksiya kalendari + "shu sanadan oldin quti kerak" eslatmasi. Kitob — Benazir Yangi yil shirinligini noyabrda chiqaradi; rejasini bilsak proaktiv taklif. Sub: kalendarni kim kiritadi — A (savdo menejer mijozdan) / B (AI tarixdan taxmin). EP-MKT-092 mavsumiy bilan.
- **Manba:** kitob (Benazir noyabr aksiya) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Ishlab chiqarish rejasi

### EP-MKT-115 · Marketing xarajati zavod realiga mos moddalar [v2-Q85]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — byudjet zavod moddalari bo'yicha: ko'rgazma / vakil safari / namuna / matbaa (katalog) / raqamli (vakil safari HR komandировка bilan ulanadi). Kitob — B2B zavodda "reklama byudjeti" noto'g'ri; asl xarajat ko'rgazma/vakil/namuna/katalog. v2-Q4 dan FARQLI = real modda + HR safar.
- **Manba:** kitob (B2B real xarajat moddalari) + EP-MKT-034 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Moliya (xarajat moddalari), HR (vakil safari/komandировка)

### EP-MKT-116 · Egaga (Ayubxon Pozilov) marketing hisoboti — aniq 5 raqam [v2-Q86]
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — egaga aniq 5 raqam (yangi mijoz, yo'qolgan mijoz, kichiklashayotgan mijoz, savdo trendi, eng katta xavf) + 1 "diqqat talab" bo'limi. Kitob — har lavozim rahbariyatga hisobot; ega vaqti tor, 50 grafik kerak emas. Tamoyil tasdiq; sub: 5 raqamni kim belgilaydi — A (ega o'zi tanlaydi) egasidan. v2-Q46 (umumiy dashboard) dan FARQLI auditoriya.
- **Manba:** kitob (lavozim hisobot reglamenti) + BARCHA_JAVOBLAR Q909 (7-dep Administratsiya) + v2-A (5 raqam egasidan)
- **action:** READ
- **⤳ Ta'sir:** butun marketing, 7-departament (Administratsiya)

### EP-MKT-117 · Tavsiya zanjiri (kim kimni keltirdi) + rahmat/bonus [v2-Q87]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lid'da "kim tavsiya qildi" maydoni + tavsiya zanjiri + tavsiyachiga rahmat/bonus qoidasi. Kitob — B2B eng kuchli/arzon kanal = mijoz tavsiyasi; kim kimni keltirgani bilinsa rag'batlantiriladi. EP-MKT-023 (kuzatish) dan aniq bonus mexanizmi.
- **Manba:** kitob (tavsiya eng kuchli B2B kanal) + EP-MKT-023 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** CRM, SD, Moliya (bonus)

### EP-MKT-118 · Mijoz hujjat/shartnoma to'liqligi marketingdan savdoga o'tishda [v2-Q88]
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz savdoga o'tishidan oldin majburiy rekvizit (STIR, shartnoma, manzil) tekshiruvi — to'liq bo'lmasa o'tmaydi. Kitob siyosat ruhi — "xom-ashyosi to'liq bo'lmagan zakazni ishlab chiqarishga kiritmaslik"; rekvizitsiz mijoz keyin invoys/to'lov muammosi. EP-MKT-088 опросный лист bilan birga darvoza.
- **Manba:** kitob (to'liqlik siyosati: xom-ashyo to'liq bo'lmasa kirmaydi) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** SD, Moliya (invoys/rekvizit), CRM

---

DONE: Marketing — 118 (javoblangan 92, ochiq 26).
