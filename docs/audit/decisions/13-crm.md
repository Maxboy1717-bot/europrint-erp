# CRM / MIJOZLAR BILAN ISHLASH — Decision Map (EP-CRM) — 2026-06-08

> Manba savollar: v1 (`vision-questions/13-crm.md`, 30) + v2 (`vision-questions-v2/13-crm.md`, 55) = **85**. Kodlar: v1 → EP-CRM-001..030, v2 → EP-CRM-031..085 (fayl tartibida).
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` (egasi javoblari — **Q33: Bitrix24 olib tashlanadi → o'rniga to'liq ERP**; **Q41: ERP ichida ichki chat (xodimdan xodimga)**; mijoz bazasi 2500 faol / 24000 jami (20 yil) — root.md/КП asosida; Q13/Q43 maxfiy hujjat + rol-asosli kirish; Q108/Q88 AI kamera+blok+jarima; Q77/Q78 hujjat org-sxema marshrut), `SHvB-40-Yonalish-Prompt.md` (**YO'NALISH 26 = CRM/Sotish 6-Otdelenie KPI**: `weeklySalesVolume`/`closedDeals`/`averageDealSize`/`conversionRate`/`salesCycleLength`/`customerRetention`/`debtorControl`/`salesTarget`/`salesVsTarget`; menejer leaderboard; debitorlik trend grafigi; **YO'NALISH 25 Marketing**: `leadsCount`/`newLeads`/`qualifiedLeads`/`conversionRate`/`costPerLead`/`churn`), `kitob-extracted` НО-2 "Телефон бериш тартиби" (korporativ raqam, abonent doirasi, Инспекция назорати) + "Дебитор қарздорлик" siyosati (Даромадлар бўлими — savdodan ajratilgan) + Заявка бумаги/Папка № + ГП-kod + ГП топшириш blankasi (3 imzo: омборчи/хайдовчи/Савдо менеджери Azizov A) + qisqartirish jadvali (razmer plan↔fakt, чиқимли/чиқимсиз, шошилмаслик) + Oylik diog (kg), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-CRM-### raqamlash; CRM = **T3 qo'llab-quvvatlovchi** modul — "ko'pi mavjud yoki sodda", lekin oltin-ip/360°/karta-RBAC qismlari T1 ga ulanadi), vizyon master reja (oltin-ip + karta-markazli RBAC + ShVB 2020 + 360° mijoz).
> v1 kontekst: CRM kodi ALLAQACHON mavjud (`modules/crm/leads`, `crm/analytics`, `agents/lead-scoring-agent.service.ts`, `compatibility/crm-extended.*`, churn/NBA/RFM-CLV referenslari) — bir nechta savol "kod allaqachon shu yo'nalishda" deydi (Q4 avto-lead, Q13 NBA, Q14 churn, Q19 RFM/CLV). Mijoz bazasi DB bo'sh holatda (sd_customers/sales_orders=0) — qurish bosqichi. Har savol birinchi varianti (A) = vizyonga eng mos = tavsiya.

## Xulosa
- **Jami:** 85
- **✅ JAVOBLANGAN:** 73 (egasi javoblari — ayniqsa Bitrix24→ERP Q33, ichki chat Q41, rol-asosli maxfiylik Q13/Q43, AI kamera+blok, hujjat org-sxema marshrut — + ShVB YO'NALISH 25/26 CRM KPI reglament + НО-2/Дебитор/Папка/ГП-kod/blanka/qisqartirish-jadval real kitob hujjatlari + oltin-ip/karta-RBAC/360° vizyon bilan bevosita tasdiqlangan)
- **🔵 OCHIQ:** 12 (egasi keyin hal qiladi; har biriga A-default tavsiya — ShVB/kitob/karta-modelga eng mos variant). Ko'pchiligi "tamoyil tasdiq, faqat aniq RAQAM/MEZON egasidan": EP-CRM-002 (voronka bosqich nomlari), EP-CRM-012 (lead-scoring ball-formulasi), EP-CRM-018 (segment ro'yxati nomlari), EP-CRM-020 (yutqaz-sabab ro'yxati), EP-CRM-024 (qarz limiti — Finance bilan), EP-CRM-057 (qog'oz narx qayta-hisob trigger %), EP-CRM-063 (egasizlantirish N kun). Integratsiya/arxitektura-bog'liq OCHIQ: EP-CRM-007 (4 kanal qaysi avval ulanadi + provayder), EP-CRM-028 (telefoniya/ATS provayder + yozuv qonuniyligi), EP-CRM-079 (STP/format versiyalash modeli — Dizayn bilan), EP-CRM-081 (import-bog'liqlik toifa manbasi — Ta'minot feed bilan), EP-CRM-085 (operator↔mijoz reja-qoidasi — Ishlab chiqarish bilan).

---

## I QISM — v1 (30 savol) — EP-CRM-001..030

### EP-CRM-001 · Lid → bitim → voronka bosqichlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq voronka (Yangi → Aloqa → Kommercheskiy taklif → Muzokara → Yutdik/Yutqazdik) + har bosqich konversiya foizi. ShVB YO'NALISH 26 `conversionRate`/`salesCycleLength` GSD; vizyon oltin-ip lead'dan boshlanadi.
- **Manba:** SHvB YO'NALISH 26 (conversionRate, closedDeals) + master reja oltin-ip + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (lead→buyurtma), KPI (konversiya), Director dashboard

### EP-CRM-002 · Voronka bosqichlarini kim belgilaydi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — zavod jarayoniga moslab (namuna/обrazets → klişe/STP tasdiq → narx kelishildi → shartnoma), keyin egasi tahrir qiladi. Aniq bosqich NOMLARI egasidan (kitob qisqartirish-jadval "дизайн қилиш/аниқ ўлчов/шошилмаслик" → EP-CRM-061 dizayn bosqichi bilan birga belgilanadi).
- **Manba:** kitob qisqartirish jadval (dizayn/o'lcham bosqichlari) + v1-A (egasi keyin tahrir)
- **action:** CREATE
- **⤳ Ta'sir:** SD voronka, Dizayn bo'limi (kelishuv bosqichi)

### EP-CRM-003 · Lidlar qayerdan keladi (manbalar)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'p manba (vebsayt + Telegram + qo'ng'iroq + qo'lda); har lidda "manba" majburiy. Egasi Telegram bot (har modulга) + europrint.uz sayt (HR Q12/Q27) ekotizimini tasdiqlagan → lid manbalari shulardan keladi.
- **Manba:** BARCHA_JAVOBLAR Q41/Q101 (modul botlari) + europrint.uz + ShVB Marketing costPerLead (manba-ROI) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Marketing (costPerLead/ROI), AI integratsiya (Telegram)

### EP-CRM-004 · Vebsayt va Telegramdan avtomatik lid yaratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik lid + darhol sotuvchiga bildirishnoma (Telegram). Savol "kod allaqachon shu yo'nalishda" deydi; egasi modul botlari + bildirishnoma vaqti sozlanadigan (Q140) tizimni tasdiqlagan.
- **Manba:** v1-A + BARCHA_JAVOBLAR Q140 (bildirishnoma) + mavjud crm/leads kod
- **action:** EVENT
- **⤳ Ta'sir:** Bildirishnoma (NTF), AI (Telegram bot), SD

### EP-CRM-005 · Lidni avtomatik sotuvchiga biriktirish (taqsimot)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik navbat (round-robin) yoki hudud/mahsulot qoidasi; boshliq qayta taqsimlay oladi. Karta-modelga ulanadi (kim qaysi mijozni ko'radi — EP-CRM-022/030).
- **Manba:** karta-model RBAC + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (sotuvchi kartasi), HR (yuklama balansi)

### EP-CRM-006 · Faollik (activity) jurnali
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq faollik jurnali (qo'ng'iroq/xat/uchrashuv/eslatma; sana + kim). Egasi to'liq audit-log + versiya tarixi ruhini tasdiqlagan (Q107/Q144); НО-2 Инспекция qo'ng'iroq nazorati shuni talab qiladi.
- **Manba:** BARCHA_JAVOBLAR Q107/Q144 (audit) + НО-2 (qo'ng'iroq nazorati) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (audit), 360° karta, Inspeksiya bo'limi

### EP-CRM-007 · Aloqa kanallari (SMS / Email / Telegram / WhatsApp)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'rttasi (Telegram + WhatsApp + SMS + Email), hammasi kartada. Egasi Email+Telegram (Q59) tasdiqlagan; WhatsApp/SMS qaysi avval ulanishi va provayder egasidan. Korporativ raqam (EP-CRM-031/035) WhatsApp/Telegram biznes akkaunt bilan birga (EP-CRM-035).
- **Manba:** BARCHA_JAVOBLAR Q59 (Email+Telegram) + НО-2 korporativ raqam + v1-A (qolgan kanal navbati egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** AI integratsiya (Telegram/WhatsApp), Bildirishnoma

### EP-CRM-008 · Yozishmalar tarixini saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — hamma yozishma avtomatik saqlanadi va kartada ko'rinadi. Egasi "butun tizimdagi barcha hujjat/yozishma ERPda saqlanadi" (Q77) + korporativ akkaunt menejer ketsa qoladi (EP-CRM-035) prinsipini tasdiqlagan.
- **Manba:** BARCHA_JAVOBLAR Q77 (hammasi ERPda) + НО-2 (raqam zavodniki) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (immutable arxiv), 360° karta

### EP-CRM-009 · Vazifalar (task) va eslatmalar
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — vazifa + avtomatik eslatma (Telegram) + bajarilmasa boshliqqa signal. Egasi vazifa-eslatma + eskalatsiya (Q122 "eslatma 2x → eskalatsiya → HR/boshliq") modelini tasdiqlagan.
- **Manba:** BARCHA_JAVOBLAR Q122 (eslatma+eskalatsiya) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Bildirishnoma, Coordination (eskalatsiya)

### EP-CRM-010 · Kechiktirilgan vazifa ustidan nazorat
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kechikkan vazifalar avtomatik boshliq paneliga + sotuvchiga ogohlantirish. Заявка bumagi "Прошло (дней)" (EP-CRM-040) zavod amaliyoti; egasi 3-kun→blok kabi qat'iy muddat nazoratini yoqlaydi.
- **Manba:** kitob Заявка бумаги "Прошло (дней)" + BARCHA_JAVOBLAR Q122 + v1-A
- **action:** CRON
- **⤳ Ta'sir:** Director/boshliq dashboard, Bildirishnoma

### EP-CRM-011 · Hot-lead (qaynoq mijoz) belgisi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik (faollik + summa) tizim qaynoq lidni ajratadi va tepaga chiqaradi; menejer ko'radi. Mavjud `lead-scoring-agent.service.ts` + crm-ai kod; egasi 30% kiritish/70% AI-tahlil ruhini tasdiqlagan. (C aralash ham maqbul, lekin A vizyon "AI 70%"ga mos.)
- **Manba:** mavjud lead-scoring-agent kod + LOYIHA-BITGAN (70% AI tahlil) + v1-A
- **action:** AI
- **⤳ Ta'sir:** AI (scoring), SD (ustuvorlik)

### EP-CRM-012 · Lid baholash (lead scoring) — ball berish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik ballash; QOIDALAR/MEZONLAR egasi kriteriyalariga moslab yoziladi. Kod bor (`lead-scoring-agent`, CLAUDE.md Q12 churn-day konstantalari), lekin aniq ball-formulasi (qiziqish/summa/javob-tezligi vazni) egasidan.
- **Manba:** mavjud lead-scoring kod + CLAUDE.md Q12 (CHURN_HIGH_DAYS konstanta) + v1-A (mezon egasidan)
- **action:** AI
- **⤳ Ta'sir:** AI, SD (ustuvorlik)

### EP-CRM-013 · AI — Keyingi eng yaxshi harakat (NBA)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI taklif beradi, sotuvchi tasdiqlab bajaradi. Savol "kod allaqachon shu yo'nalishda" deydi; egasi AI nazorat sotuvchida (tasdiqlash+tahrir, Q99) modelini tasdiqlagan.
- **Manba:** v1-A + BARCHA_JAVOBLAR Q99 (AI taklif, inson tasdiq) + mavjud crm-ai kod
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, SD

### EP-CRM-014 · AI — Churn (mijoz ketib qolishi) bashorati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI "ketish xavfi yuqori" mijozlarni ro'yxatga chiqaradi + sotuvchiga qaytarish vazifasi. churn.service kod bor; ShVB Marketing/CRM `customerRetention`/churn GSD; kitob kg-trend pasayishi signal (EP-CRM-064).
- **Manba:** mavjud churn kod + ShVB YO'NALISH 25/26 (retention/churn) + v1-A
- **action:** AI
- **⤳ Ta'sir:** AI, Marketing (qaytarish kampaniyasi), SD

### EP-CRM-015 · Mijoz tarixi (360° ko'rinish)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq 360° (buyurtma + to'lov + qarz + yozishma + shikoyat) bir kartada, ERP modullari bilan bog'langan. Vizyon 360° mijoz; oltin-ip har modulni mijozga ulaydi; egasi "davlatda inson kabi to'liq" (Q106) ruhini tasdiqlagan.
- **Manba:** master reja 360° + oltin-ip + BARCHA_JAVOBLAR Q106 (to'liq profil) + v1-A
- **action:** READ
- **⤳ Ta'sir:** Finance (qarz/to'lov), QC (shikoyat), SD (buyurtma), WMS

### EP-CRM-016 · CRM mijozi ↔ zavod buyurtmasi (oltin ip)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bitim yutilsa → sotuv buyurtmasi avtomatik yaratiladi (bir tugma), to'liq oltin ip. Vizyon yadrosi; EP-SD-001/137 lead→buyurtma; "ikki buyurtma dunyosi" hal qilingan (eski `orders` DROP, kanon `sales_orders`).
- **Manba:** master reja oltin-ip + EP-SD-001/137 + transmission map (kanonik sales_orders) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** SD (buyurtma), PP (reja), butun oltin-ip

### EP-CRM-017 · Mijoz bazasi qayerda — yagona manba
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yagona kanonik mijoz bazasi; hamma modul shundan oladi. Vizyon master-data; kanonik nomzod `sd_customers` (faol UI; AI `customers` kutadi=bo'linish hal qilinadi). Egasi yagona ishonchli baza ruhini tasdiqlagan.
- **Manba:** master reja master-data + reference_live_db (kanonik nomzod sd_customers) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Finance, butun ERP (mijoz master-data)

### EP-CRM-018 · Mijoz turlari va segmentlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — segment ro'yxati egasi mezonlariga (oborot/sodiqlik) moslab tuziladi. ABC avto-toifa kod bor (EP-SD-007). Aniq segment NOMLARI (VIP/tarmoq/asosiy — EP-CRM-052 asosiy-mijoz bayrog'i bilan) egasidan.
- **Manba:** mavjud ABC repo (EP-SD-007) + kitob (Indorama=asosiy mijoz) + v1-A (segment ro'yxati egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** SD (ABC), Finance (kredit limiti), Hisobot

### EP-CRM-019 · RFM / CLV tahlili (mijoz qadr-qiymati)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — RFM + CLV hisobi panelga chiqadi. rfm/clv kod bor; vizyon 70% AI-tahlil; ShVB top-mijoz/leaderboard ruhi. Kitob kg-hajm (EP-CRM-064) RFM uchun "Monetary" manbasi.
- **Manba:** mavjud rfm/clv kod + LOYIHA-BITGAN (70% tahlil) + v1-A
- **action:** AI
- **⤳ Ta'sir:** AI, Hisobot (top mijoz), SD

### EP-CRM-020 · Yutqazilgan bitim sababini yozish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — majburiy sabab (tayyor ro'yxat) + ixtiyoriy izoh → hisobot. Sabab RO'YXATI (narx/muddat/sifat/raqobatchi) egasidan; kitob qisqartirish-jadval "format/narx/чиқим" real sabablarni beradi.
- **Manba:** kitob qisqartirish jadval (narx/чиқим/format sabablari) + v1-A (ro'yxat egasidan)
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (yutqaz tahlil), SD

### EP-CRM-021 · Kommercheskiy taklif / narx-taklif yuborish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tizim ichida KP tayyorlash + yuborish + holat kuzatish (ko'rildi/qabul/rad). Kitob КП Пепси real rasmiy hujjat (raqam, narx jadvali, Коммерческий директор imzo); EP-SD-003/004 KP konvertatsiya+tasdiq.
- **Manba:** kitob КП Пепси.docx + EP-SD-003/004 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (kotirovka), Org-karta (komdir tasdiq), Marketing (brending)

### EP-CRM-022 · Karta-model bilan integratsiya (kim CRMda ishlaydi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — CRM huquqlari karta bo'yicha (sotuvchi faqat o'z mijozini, boshliq hammasini) — karta-modelga to'liq bog'lash. Vizyon karta-markazli RBAC (maydon darajasi); kitob "Савдо рахбари / Савдо менежерлари" alohida lavozim (EP-CRM-062).
- **Manba:** master reja karta-RBAC + kitob (savdo rahbari/menejer) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (lavozim), Xavfsizlik (RBAC)

### EP-CRM-023 · Sotuvchi ЦКП va KPI bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — CRMdagi yopilgan bitim/oborot avtomatik sotuvchi KPI/ЦКП paneliga ulanadi. ShVB YO'NALISH 26 aynan shu GSD'lar (`weeklySalesVolume`/`closedDeals`/`averageDealSize`); karta=GSD vizyoni.
- **Manba:** SHvB YO'NALISH 26 (sotuv GSD) + master reja karta-GSD + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (GSD/ЦКП), HR (reyting/bonus), Director dashboard

### EP-CRM-024 · Mijoz qarzdorligi bo'yicha ogohlantirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — qarz limitidan oshsa avtomatik ogohlantirish; boshliq ruxsatisiz yangi bitim ochilmaydi. ShVB `debtorControl` GSD; kitob Дебитор siyosati. Aniq LIMIT qiymati + bloklash oqimi Finance/Даромадлар bilan (EP-CRM-036) egasidan.
- **Manba:** ShVB YO'NALISH 26 (debtorControl) + kitob Дебитор siyosati + v1-A (limit egasidan)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (debitorlik), Даромадлар bo'limi, SD

### EP-CRM-025 · Mijoz shikoyatlari / reklamatsiyalar bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — shikoyatlar mijoz kartasida ko'rinadi va hal bo'lguncha qizil belgi. Vizyon 360° + Sifat moduli bog'lanishi; EP-CRM-073/074 reklamatsiya hal bo'lmaguncha yangi yuk ushlash.
- **Manba:** master reja 360° + kitob Сифат бўлими↔мижоз (EP-CRM-034) + v1-A
- **action:** READ
- **⤳ Ta'sir:** Sifat nazorati (QC), SD

### EP-CRM-026 · Avtomatik eslatma kampaniyalari (follow-up)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qoidaga ko'ra avtomatik eslatma (30/60/90 kun jimlikdan keyin) + sotuvchiga vazifa. Churn/retention vizyoni; EP-CRM-033 N-kun faolliksiz egasizlantirish bilan bir mexanizm.
- **Manba:** ShVB churn/retention + EP-CRM-033 (N kun) + v1-A
- **action:** CRON
- **⤳ Ta'sir:** Bildirishnoma, Marketing (kampaniya), AI churn

### EP-CRM-027 · CRM boshqaruv paneli (boshliq uchun)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq panel (voronka + sotuvchi reytingi + AI signal churn/hot + kechikkan vazifa) bitta ekran. ShVB YO'NALISH 26 (leaderboard + debitor trend); egasi direktor to'liq dashboard (Q123) ruhini tasdiqlagan.
- **Manba:** SHvB YO'NALISH 26 (leaderboard/trend) + BARCHA_JAVOBLAR Q123 (direktor dashboard) + v1-A
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, KPI, AI

### EP-CRM-028 · Telefon qo'ng'irog'ini yozib olish va biriktirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — telefoniya ulanadi, qo'ng'iroqlar avtomatik kartaga (kim/qachon/davomiylik/yozuv). НО-2 Инспекция qo'ng'iroq nazoratini talab qiladi (EP-CRM-033/032), demak tamoyil tasdiq; PROVAYDER/ATS texnik tanlovi + yozuv saqlash qonuniyligi egasidan (qo'shimcha sozlash).
- **Manba:** НО-2 (Инспекция qo'ng'iroq nazorati) + v1-A (provayder egasidan)
- **action:** EVENT
- **⤳ Ta'sir:** Inspeksiya bo'limi, AI (qo'ng'iroq tahlili), 360° karta

### EP-CRM-029 · Mobil ilovada CRM (sotuvchi tashqarida)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mobil/telefonda asosiy CRM amallari (lid, vazifa, yozishma) ishlaydi. Egasi responsive web (PC+planshet+smartfon, POS Q3) + modul Telegram botlari (Q101) ruhini tasdiqlagan; sotuvchi ko'pincha tashqarida.
- **Manba:** BARCHA_JAVOBLAR POS Q3 (responsive) + Q101 (modul botlari) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** AI (Telegram bot), Bildirishnoma, SD

### EP-CRM-030 · Mijoz ma'lumotlariga kirish chegarasi (maxfiylik)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har sotuvchi faqat o'z mijozini, boshliq hammasini (karta-modelga bog'liq). Vizyon karta-RBAC; НО-2 "хизмат маълумоти ташқарига чиқиш хавфи" → maxfiylik majburiy; EP-CRM-075/076 kontakt yashirish + eksport blok.
- **Manba:** master reja karta-RBAC + НО-2 (ma'lumot himoyasi) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (RBAC, eksport blok), Org-karta

---

## II QISM — v2 (55 savol, kitob-grounded) — EP-CRM-031..085

### BO'LIM 1 — Korporativ aloqa siyosati (НО-2)

### EP-CRM-031 · Savdo menejeriga korporativ raqam biriktirish (v2 Q1)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — korporativ raqam menejer kartasiga biriktiriladi; ketsa raqam+baza yangi menejerga o'tadi (mijoz uzilmaydi). НО-2 "корпоратив мобил рақамни тақдим этиш" real qoida; egasi korporativ email/telefon ERPda ro'yxatga olinishini (Q74) tasdiqlagan.
- **Manba:** НО-2 "Телефон бериш тартиби" + BARCHA_JAVOBLAR Q74 (korporativ tel ERPda) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR (ishga qabul), Org-karta, Aloqa kanallari

### EP-CRM-032 · Aloqa abonentlari ro'yxati cheklovi (v2 Q2)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat tasdiqlangan abonent doirasi (mijoz bazasi + qarindosh ro'yxati); tashqari raqam CRMda flaglanadi. НО-2 "Алоқа абонентлари" lavozimga aniq belgilangan; egasi ma'lumot-sizish himoyasini yoqlaydi.
- **Manba:** НО-2 (abonent doirasi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik, AI (anomaliya), Inspeksiya bo'limi

### EP-CRM-033 · Qo'ng'iroqlar nazorati (Инспекция бўлими) (v2 Q3)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qo'ng'iroq jurnali avtomatik Инспекция бўлими paneliga (kim/qachon/davomiylik/mijoz). НО-2 "Инспекция ва хисоотлар бўлими бошлиғи томонидан қўнғироқлар назорати" — aniq reglament.
- **Manba:** НО-2 (Инспекция qo'ng'iroq nazorati) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura (Инспекция bo'limi), AI tahlil

### EP-CRM-034 · Sifat bo'limi boshlig'i ham mijoz bilan gaplashadi (v2 Q4)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Сифат бошлиғи ↔ mijoz aloqasi ham shu kartada ko'rinadi (turi: "sifat/reklamatsiya"). НО-2 Сифат бўлими бошлиғи abonentlari orasida "мижозлар" bor; vizyon yagona 360° tarix.
- **Manba:** НО-2 (Сифат бошлиғи мижоз abonenti) + master reja 360° + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Sifat nazorati (QC), 360° karta

### EP-CRM-035 · Korporativ raqamda Telegram/biznes-akkaunt (v2 Q5)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — korporativ Telegram/WhatsApp akkaunt → yozishma CRMda; menejer ketsa akkaunt qoladi. EP-CRM-031 amaliy davomi; egasi yozishma ERPda saqlanishi (Q77) prinsipini tasdiqlagan.
- **Manba:** НО-2 (raqam zavodniki) + BARCHA_JAVOBLAR Q77 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** AI integratsiya (Telegram bot), Aloqa kanallari

### BO'LIM 2 — Qarzdorlik mas'uliyati bo'linishi (Даромадлар бўлими)

### EP-CRM-036 · Debitor qarz Даромадлар bo'limida, savdoda emas (v2 Q6)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qarz undirish vazifasi avtomatik Даромадлар bo'limiga; savdo menejeri faqat xabardor. (Nuance ↳: qarzli mijozga yangi bitim → avtomatik blok + Даромадлар tasdig'i; aniq oqim EP-CRM-024 limiti bilan.) Kitob Дебитор siyosati savdo↔undirishni ataylab ajratgan.
- **Manba:** kitob "Дебитор қарздорлик / Даромадлар бўлими бошлиғи" + EP-SD (Даромадлар=Дебитор) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (debitorlik), Org-struktura (Даромадлар bo'limi)

### EP-CRM-037 · Mijoz "qarz holati" kim tomonidan yangilanadi (v2 Q7)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat Finance/Даромадлар modulidan avtomatik; savdo o'zgartira olmaydi (xolis raqam). Vizyon xolis ma'lumot manbasi; EP-CRM-073/067 narx/qarz manbasi avtomatik prinsipi bilan bir.
- **Manba:** kitob Дебитор siyosati + master reja (avtomatik manba) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Finance

### EP-CRM-038 · Qarz bo'yicha mijozga aloqa qilish bayoni (v2 Q8)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qarz aloqalari mijoz kartasida ko'rinadi (savdo + Даромадлар bir tarixda). Vizyon yagona 360°; ikki bo'lim parallel gaplashishi muvofiqlashtirilishi kerak (EP-CRM-034 mantiq).
- **Manba:** master reja 360° + kitob (Даромадлар↔mijoz) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Finance, 360° karta

### BO'LIM 3 — Papka / Заявка tizimi

### EP-CRM-039 · "Папка №" — mijozning buyurtma papkasi (v2 Q9)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har CRM bitimi → Папка № bilan bog'lanadi; kartada mijoz papkalari ro'yxati. Kitob Заявка бумаги real "Папка №/Название заказа"; EP-SD-100 status ro'yxati shu papkadan; zavod bir tilda gaplashadi.
- **Manba:** kitob Заявка бумаги (Папка №) + EP-SD-100 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (papka), SD (buyurtma)

### EP-CRM-040 · "Прошло (дней)" — buyurtma necha kun turibdi (v2 Q10)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "o'tgan kun" avtomatik hisoblanadi + limitdan oshsa menejer va Даромадлар/ИшЧ boshlig'iga signal. Kitob Заявка bumagi "Прошло (дней)" real ustun; EP-CRM-010 kechikkan-vazifa bilan bir.
- **Manba:** kitob Заявка бумаги "Прошло (дней)" + v2-A
- **action:** CRON
- **⤳ Ta'sir:** SD, Даромадлар/IshChiqarish boshlig'i, Bildirishnoma

### EP-CRM-041 · Mijozning qog'oz zayavkasi (Заявка бумаги) CRMda (v2 Q11)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozning odatiy qog'oz profili (Наименование/Формат/Грам) saqlanadi va yangi bitimga avtomatik tortiladi. Kitob Заявка bumagi spetsifikatsiya; doimiy mijoz bir xil qog'oz → qayta buyurtma tez (EP-CRM-049/053).
- **Manba:** kitob Заявка бумаги (qog'oz spetsifikatsiyasi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot (qog'oz zayavkasi), Ishlab chiqarish

### EP-CRM-042 · "Примечание" (izoh) papkadan kartaga (v2 Q12)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — papka izohlari mijoz tarixida ko'rinadi (to'liq kontekst). Kitob Заявка jadval "Примечание" real ustun; izoh ko'pincha eng muhim kelishuv nuansi.
- **Manba:** kitob Заявка бумаги "Примечание" + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** 360° karta, Ishlab chiqarish (izoh)

### BO'LIM 4 — Takroriy buyurtma va mahsulot kodi (ГП-...)

### EP-CRM-043 · ГП kodi bo'yicha takroriy buyurtma (v2 Q13)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kartada ГП-kod tarixi + "qayta buyurtma" tugmasi (eski spetsifikatsiya bilan). Kitob real ГП kodlari (ГП-2026-0187 Compact cotton, ГП-2025-4779 Indorama); doimiy mijoz qayta-qayta bir xil mahsulot.
- **Manba:** kitob ГП-kod (Compact cotton/Indorama) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (tex-karta), SD (buyurtma)

### EP-CRM-044 · Mahsulot konstruksiya parametrlari kartada (v2 Q14)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mahsulotga to'liq konstruksiya profili (sloy/o'lcham/model/yozuv). Kitob ГП "5 sloylik", "68.1x45.6x34.8", "new model" real parametrlar; saqlansa tex-karta avto-to'ladi.
- **Manba:** kitob ГП parametrlari (sloy/o'lcham/model) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (tex-karta), Dizayn

### EP-CRM-045 · Brend/yozuv (Indorama) maketni eslab qolish (v2 Q15)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz maket/logotip/yozuv kutubxonasi kartada (versiyalar bilan). Kitob ГП yozuvlari "Indorama yozuvi yo'q / Indorama" real brend belgilari; saqlansa dizayn vaqti tejaladi, xato bosma yo'q.
- **Manba:** kitob ГП (brend/yozuv) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn, Ishlab chiqarish (bosma)

### BO'LIM 5 — ГП topshirish blankasi

### EP-CRM-046 · ГП topshirish blankasi savdo menejeri imzosi (v2 Q16)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — elektron blanka: омборчи + хайдовчи + савдо менежери tasdig'i; uchchovsiz yuk "chiqdi" bo'lmaydi. Kitob ГП топшириш blankasi 3 imzo (Azizov A real savdo menejeri imzosi); EP-SD-138 yetkazish fakti qayd.
- **Manba:** kitob ГП топшириш blankasi (3 imzo) + EP-SD-138 + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Ombor (chiqim), Logistika (Eltib berish), SD

### EP-CRM-047 · Yetkazilgandan keyin mijoz kartasini yangilash (v2 Q17)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yetkazish tasdig'i → karta "yetkazildi" + keyingi buyurtma eslatmasi (proaktiv). Oltin-ip yetkazish bosqichi; EP-SD-138 + EP-CRM-026 follow-up bilan bir; takroriy sotuvga turtki.
- **Manba:** kitob ГП топшириш + master reja oltin-ip + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Logistika, SD (takroriy sotuv), Bildirishnoma

### EP-CRM-048 · Haydovchi/transport mijoz kartasida (v2 Q18)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yetkazish tarixida transport/haydovchi saqlanadi. Kitob blankada haydovchi yoziladi; EP-SD-138 haydovchi+mashina qayd; ba'zi yirik mijoz muayyan transport biladi (EP-CRM-085 ombor-kirish bilan bog'liq).
- **Manba:** kitob ГП топшириш (haydovchi) + EP-SD-138 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (Eltib berish bo'limi)

### BO'LIM 6 — Format/o'lcham va dizayn kelishuvi

### EP-CRM-049 · "Razmer planda va aslida" farqi kartada (v2 Q19)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bitimda "kelishilgan o'lcham" qulflanadi; ishlab chiqarish farq qilsa flaglanadi + mijoz tasdig'i so'raladi. Kitob qisqartirish jadval "Razmer планда / aslida" real ustun; nizoda dalil.
- **Manba:** kitob qisqartirish jadval (plan↔fakt o'lcham) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish, Sifat (QC)

### EP-CRM-050 · Format kichraytirish (qisqartirish) menejer roziligi (v2 Q20)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — format o'zgarishi → mijoz + menejer elektron roziligi (kim/qachon) saqlanadi. Kitob qisqartirish jadval "Менежер фикри / Менежер хохиши / маслаҳат" real ustunlar; "men rozi emasdim" nizosi tugaydi.
- **Manba:** kitob qisqartirish jadval (menejer roziligi ustunlari) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Dizayn, Ishlab chiqarish (chiqim/chiqimsiz)

### EP-CRM-051 · Dizayner bilan kelishuv bosqichi voronkada (v2 Q21)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Dizayn/o'lcham kelishuvi" alohida voronka bosqichi + dizayner mas'ul + kun limiti. Kitob jadval "Дизайн қилиш / Дизайнер билан маслаҳат / Аниқ ўлчов" real bosqichlar; ko'p buyurtma shu yerda osiladi (EP-CRM-002 bosqich ro'yxati bilan).
- **Manba:** kitob qisqartirish jadval (dizayn bosqichlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi, Voronka (SD)

### EP-CRM-052 · "Shoshilmaslik" — o'lchov tasdig'isiz ishga tushmaslik (v2 Q22)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "o'lcham tasdiqlandi" majburiy bayroq; usiz ishlab chiqarishga o'tmaydi. Kitob "Аниқ ўлчовларни олиш + Шошилмаслик" real tamoyil; aniq o'lchovsiz=brak=zarar (zavod bu xatoni ko'rgan).
- **Manba:** kitob qisqartirish jadval ("Шошилмаслик") + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Ishlab chiqarish (gate), Sifat (QC)

### BO'LIM 7 — Mijoz turi: korxona (B2B)

### EP-CRM-053 · Mijoz = ishlab chiqaruvchi korxona (oxirgi mahsulot) (v2 Q23)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozning mahsuloti/biznesi profili saqlanadi (nima qadoqlaydi). Kitob mijozlar=qadoqlovchi korxonalar (Indorama=yarn/cotton, Compact cotton); aniq taklif + kross-sotuv.
- **Manba:** kitob (Indorama/Compact cotton biznesi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (taklif), Marketing

### EP-CRM-054 · Mavsumiy/hajmli mijoz (Indorama tipidagi) (v2 Q24)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "asosiy mijoz" bayrog'i + ustuvor ishlab chiqarish + material zaxirasi ogohlantirishi. Kitob 1-2 yirik mijoz katta hajm beradi (Indorama); ular kechiksa katta zarar (EP-CRM-018 segment bilan).
- **Manba:** kitob (Indorama asosiy hajm) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot (zaxira), Ishlab chiqarish (ustuvorlik)

### EP-CRM-055 · Mijoz odatiy buyurtma hajmi (kg) (v2 Q25)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz oylik kg-trendi + pasayishda signal. Kitob zavod hammasini kg da o'lchaydi (Oylik diог "Olingan/Tayyor kg"); 5t→1t pasayish=raqobatchiga ketdi signali (EP-CRM-014 churn + EP-CRM-080 oylik diog bilan).
- **Manba:** kitob Oylik diog (kg) + ShVB churn + v2-A
- **action:** AI
- **⤳ Ta'sir:** Hisobot (kg-trend), AI churn

### BO'LIM 8 — Narx, qisqartirish va chiqim mantiqi

### EP-CRM-056 · "Chiqimli / Chiqimsiz" narx mantiqi (v2 Q26)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — narx taklifida чиқимли/чиқимсиз variant + tejamkor taklif ko'rsatiladi. Kitob qisqartirish jadval "Чиқимли / Чиқимсиз" real ustun; chiqimsiz format=arzonroq=savdo dalili.
- **Manba:** kitob qisqartirish jadval (чиқимли/чиқимсиз) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (format optimizatsiya), Finance (narx)

### EP-CRM-057 · Qog'oz narxi o'zgarishida mijoz narxini qayta hisoblash (v2 Q27)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — qog'oz narxi o'zgarsa → ta'sirlangan mijozlar ro'yxati + narxni qayta ko'rish vazifasi. Kitob "Қоғоз нархи / Умумий қоғоз сўммаси" real ustunlar; tamoyil tasdiq, lekin avto-qayta-hisob TRIGGER % chegarasi (qancha oshganda) egasidan + Ta'minot narx-feed bog'lanishi.
- **Manba:** kitob qisqartirish jadval (Қоғоз нархи) + v2-A (trigger % egasidan)
- **action:** CRON
- **⤳ Ta'sir:** Ta'minot (qog'oz narxi), Finance

### EP-CRM-058 · Bir mijozga ko'p formatli narx jadvali (v2 Q28)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz × mahsulot/format kesimida narx jadvali. Kitob bir mijoz turli format (133 format, 105 format); bitta "mijoz narxi" yetarli emas — har mahsulotga narx (EP-CRM-084 mahsulot liniyalari bilan).
- **Manba:** kitob (133/105 format) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (narx), SD

### BO'LIM 9 — Mijoz↔ishlab chiqarish reja zanjiri

### EP-CRM-059 · Bitim → ishlab chiqarish rejasiga tushishi (v2 Q29)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yutilgan bitim → ishlab chiqarish reja navbatiga avtomatik (muddat bilan). Kitob "станокларни иш билан таъминлаш"; oltin-ip buyurtma→reja; stanok bo'sh qolmaydi.
- **Manba:** kitob ("станокларни иш билан таъминлаш") + master reja oltin-ip + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (PP rejalashtirish), MES

### EP-CRM-060 · Mijozga real muddat (stanok yukiga qarab) (v2 Q30)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — muddat taklifi stanok yukidan avtomatik hisoblanadi (real va'da). Vizyon CRP/quvvat (mavjud pp crp); "ertaga tayyor" og'zaki va'da aldovini tugatadi.
- **Manba:** mavjud PP/CRP (work_centers yuk) + master reja oltin-ip + v2-A
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish (CRP/quvvat), MES

### EP-CRM-061 · Stanok turlari bo'yicha mahsulot mosligi (v2 Q31)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mahsulot → stanok marshrutiga bog'lanadi; muddat shu stanok navbatidan. Kitob aniq stanoklar (Flexo tigel/gofra/печать, SM 72, SM 52, Laminatsiya, Kashirovka) real; mahsulot-stanok mosligi=aniq muddat/narx.
- **Manba:** kitob (stanoklar ro'yxati) + mavjud PP routing + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (marshrut), MES

### BO'LIM 10 — Menejer mas'uliyati va kuzatuvi

### EP-CRM-062 · Savdo bo'limi rahbari vs menejer ko'rinishi (v2 Q32)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Савдо рахбари=hamma; менежер=o'ziniki; karta-modelga bog'liq. Kitob "Савдо бўлими рахбари / Савдо бўлими менежерлари" alohida lavozim; EP-CRM-022/030 RBAC bilan bir ierarxiya.
- **Manba:** kitob (savdo rahbari/menejerlari) + master reja karta-RBAC + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik (RBAC)

### EP-CRM-063 · Menejer mijozni "egasizlantirmaslik" qoidasi (v2 Q33)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — N kun faolliksiz mijoz boshliq paneliga "qayta taqsimlash" uchun chiqadi. Tamoyil tasdiq (adolat + EP-CRM-026 follow-up bilan bir); aniq N (30/60 kun) egasidan.
- **Manba:** master reja (adolatli taqsimot) + EP-CRM-026 + v2-A (N egasidan)
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura, HR

### EP-CRM-064 · Menejer kunlik hisoboti (necha kg sotdi) (v2 Q34)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — menejer kunlik kg + summa hisoboti avtomatik boshliqqa. Kitob zavod kunlik "Olingan buyurtma kg" (Oylik diог); egasi avto kunlik hisobot (mashina→PDF, Q116/Q119) ruhini tasdiqlagan; ShVB `weeklySalesVolume`.
- **Manba:** kitob Oylik diog (kg) + BARCHA_JAVOBLAR Q116/Q119 (avto hisobot) + ShVB YO'NALISH 26 + v2-A
- **action:** CRON
- **⤳ Ta'sir:** HR (KPI), Hisobot, Director dashboard

### EP-CRM-065 · Yangi menejer mentor davri (RD-4 tizimi) (v2 Q35)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "sinov davri" bayrog'i + bitim mentor tasdig'idan o'tadi (2 oy). Kitob RD-4 mentor+sinov; egasi sinov muddati kuzatuvi (Q91) + 2 mentor (Q145) modelini tasdiqlagan; yangi menejer xato narx/va'da xavfi.
- **Manba:** kitob RD-4 (mentor/sinov) + BARCHA_JAVOBLAR Q91/Q145 + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** HR (adaptatsiya), LMS

### BO'LIM 11 — Maxfiylik va xizmat ma'lumoti himoyasi

### EP-CRM-066 · "Xizmat ma'lumoti tashqariga chiqishi" oldini olish (v2 Q36)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ommaviy eksport bloklangan; faqat boshliq ruxsati bilan; har eksport loglanadi. НО-2 asosiy maqsadi "хизмат маълумотларининг ташқарига чиқиш хавфи"; menejer butun bazani (24000 mijoz) Excelga olib ketmasin.
- **Manba:** НО-2 (ma'lumot himoyasi) + v2-A
- **action:** EXPORT
- **⤳ Ta'sir:** Xavfsizlik (eksport blok + log)

### EP-CRM-067 · Mijoz kontaktini ko'rish chegarasi (v2 Q37)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — o'z mijozi=to'liq; o'zganiki=faqat nomi (kontakt yashirin). Vizyon karta-RBAC (maydon darajasi); НО-2 maxfiylik (EP-CRM-030/032 davomi); ichki "o'g'irlik" oldini olish.
- **Manba:** master reja karta-RBAC (maydon darajasi) + НО-2 + v2-A
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik (field-level RBAC)

### EP-CRM-068 · CRM harakatlari audit jurnali (v2 Q38)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq audit jurnali (ko'rish/o'zgartirish/eksport) + Инспекция бўлими ko'radi. Egasi to'liq audit-log (Q144 super-admin/direktor) + НО-2 nazorat ruhi; har EP-kod loglanadi (LOYIHA-BITGAN B.4).
- **Manba:** BARCHA_JAVOBLAR Q144 (audit) + НО-2 + LOYIHA-BITGAN (EP-kod log) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik, Инспекция бўлими

### BO'LIM 12 — Mijoz bilan moliyaviy munosabat

### EP-CRM-069 · Oldindan to'lov (avans) holati kartada (v2 Q39)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avans bayrog'i + foizi; belgilangan avanssiz ishlab chiqarishga o'tmaydi. Kitob "50% avans + 5 kun postoplata / 100% avans → 5% chegirma" (EP-SD); avanssiz=material zarari.
- **Manba:** kitob (avans siyosati) + EP-SD (50%/100% avans) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, Ishlab chiqarish (gate)

### EP-CRM-070 · Naqd / o'tkazma to'lov turi mijozda (v2 Q40)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijozning odatiy to'lov turi saqlanadi (naqd/o'tkazma/bartar). Kitob "Цена без НДС / o'tkazma QQS"; to'lov turi narx+hujjatga ta'sir (naqd chegirma vs o'tkazma hisob-faktura).
- **Manba:** kitob (Цена без НДС, to'lov turlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (hisob-faktura)

### EP-CRM-071 · Valyuta (USD bog'liq narx) (v2 Q41)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — narx USD-bog'liq saqlanadi + kurs o'zgarsa qayta ko'rish signali. Egasi "har qanday valyuta — qaysi valyutada xarajat bo'lsa" (POS Q36); qog'oz importga bog'liq (EP-CRM-085 import-toifa bilan); so'm tushsa zarar.
- **Manba:** BARCHA_JAVOBLAR POS Q36 (valyuta) + kitob (import qog'oz) + v2-A
- **action:** CRON
- **⤳ Ta'sir:** Finance, Ta'minot

### BO'LIM 13 — Reklamatsiya, brak va sifat aloqasi

### EP-CRM-072 · Brak/qaytarish mijoz kartasida (v2 Q42)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — brak/qaytarish kartada + sabab kodi (o'lcham/bosma/material). Vizyon 360°; takror brak=tizimli muammo (EP-CRM-049 o'lcham nizosi bilan bog'lanadi); QC moduli.
- **Manba:** master reja 360° + EP-CRM-049/050 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Sifat nazorati (QC)

### EP-CRM-073 · Reklamatsiya hal bo'lmaguncha yangi yuk (v2 Q43)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ochiq reklamatsiya bayrog'i + yangi bitimda boshliq ogohlantirishi. Vizyon 360° + sifat-bog'lanish; EP-CRM-025 qizil belgi bilan bir; avval eski masala yopilsin.
- **Manba:** master reja 360° + EP-CRM-025 + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Sifat nazorati (QC), SD

### EP-CRM-074 · Kompensatsiya/chegirma tarixi (v2 Q44)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kompensatsiya/chegirma tarixi + jami summa kartada (suiiste'mol ko'rinadi). Vizyon 360° + audit ruhi; ba'zi mijoz har gal "brak" deb chegirma so'raydi.
- **Manba:** master reja 360° + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (chegirma), Sifat

### BO'LIM 14 — Hisobot va boshqaruv

### EP-CRM-075 · "Oylik diog" mijoz kesimida (v2 Q45)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — oylik kg mijoz kesimida + o'tgan oyga nisbatan o'zgarish. Kitob "Oylik diог" real jadval (Olingan/Tayyor/Chiqarilgan kg); mijoz kesimi=kim asosiy/pasaygan (EP-CRM-055/080 bilan).
- **Manba:** kitob Oylik diог (kg) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Hisobot, Director dashboard

### EP-CRM-076 · "Yil boshidan chiqarilgan mahsulot soni" mijozga taqsim (v2 Q46)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yillik hajm mijozlar kesimida (top ro'yxat). Kitob "Йил бошидан бери чиқарилган маҳсулот сони 115000" real ko'rsatkich; top mijoz=strategik e'tibor (EP-CRM-019 RFM bilan).
- **Manba:** kitob ("115000 mahsulot") + v2-A
- **action:** READ
- **⤳ Ta'sir:** Hisobot (yillik top mijoz)

### EP-CRM-077 · Buyurtma↔tayyor↔chiqarilgan zanjiri mijozda (v2 Q47)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma holati (olingan→tayyor→chiqarildi) real-vaqt kartada. Kitob 3 holat (Olingan/Tayyor bo'lgan/Ombordan chiqarilgan kg); EP-SD-100 status ro'yxati; mijoz "buyurtmam qayerda" → aniq javob.
- **Manba:** kitob (3 holat kg) + EP-SD-100 (statuslar) + master reja oltin-ip + v2-A
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish, Ombor (WMS), 360° karta

### BO'LIM 15 — Chekka holatlar va granular nuqtalar

### EP-CRM-078 · Bir korxona — bir nechta brend/quti turi (v2 Q48)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz ostida alohida mahsulot liniyalari (har biriga narx/hajm/brak). Kitob Indorama bir nechta mahsulot (gofra list/konteyner/5-sloylik); aralash=qaysi foydali/muammoli ko'rinmaydi (EP-CRM-058 narx bilan).
- **Manba:** kitob (Indorama ko'p mahsulot) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx/hajm), Hisobot

### EP-CRM-079 · Mijoz almashtirilgan o'lcham/STP tarixi (v2 Q49)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz mahsuloti uchun STP/format versiya tarixi. Kitob "Қолиб янги STP / Тигел қолиб" real qayd; tamoyil tasdiq, lekin VERSIYALASH modeli (har o'zgarishni saqlash chuqurligi, kim tasdiqlaydi) Dizayn/Ishlab chiqarish bilan birga aniqlanadi.
- **Manba:** kitob ("Қолиб янги STP") + EP-CRM-045 (versiya) + v2-A (model egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish, Dizayn

### EP-CRM-080 · Mijoz "yaqin qarindosh" aloqasi (НО-2 nuance) (v2 Q50)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — aloqa "mijoz" yoki "shaxsiy" deb teglanadi; statistikaga faqat mijoz aloqasi kiradi. НО-2 abonentlar orasida "Яқин қариндошлар" bor; Инспекция nazorati (EP-CRM-033) shaxsiy/ish aralashmasligi kerak.
- **Manba:** НО-2 ("Яқин қариндошлар" abonent) + EP-CRM-033 + v2-A
- **action:** AI
- **⤳ Ta'sir:** Инспекция бўлими, Maxfiylik

### EP-CRM-081 · Mijoz toifasi: import-bog'liq vs mahalliy (v2 Q51)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz import-bog'liqlik toifasi + import muammosida ta'sirlangan mijoz ro'yxati. Kitob Indorama=import paxta/yarn; qog'oz import (EP-CRM-071 USD bilan); tamoyil tasdiq, toifa MANBASI (Ta'minot import-feed bog'lanishi) egasidan.
- **Manba:** kitob (import xom-ashyo) + EP-CRM-071 + v2-A (toifa manbasi egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot, Ishlab chiqarish

### EP-CRM-082 · Mijoz ombor kirish cheklovi (yetkazish nuance) (v2 Q52)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yetkazish nuqtasiga kirish talablari (vaqt/hujjat/sanitariya) saqlanadi. Yirik mijoz (oziq-ovqat/farma) propusk+sanitariya talab qiladi; EP-CRM-048 transport tarixi bilan; bir martada yetkazish.
- **Manba:** kitob (mijoz korxona toifasi) + EP-CRM-048 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (Eltib berish)

### EP-CRM-083 · Mijoz bilan kelishilgan o'rash/qadoqlash usuli (v2 Q53)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz mahsulotiga yig'ish/o'rash usuli biriktiriladi (stepler/yelim/qo'lda/oyna). Kitob "Упаковка Степлер / Склейка ручная / Окошка" real usullar; saqlanmasa noto'g'ri yig'ilib qaytariladi (EP-CRM-072 brak bilan).
- **Manba:** kitob ("Упаковка Степлер/Склейка/Окошка") + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (yig'ish), Ombor (WMS)

### EP-CRM-084 · "Akademiyaga" / namuna ishlab chiqarish belgisi (v2 Q54)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "namuna/sinov" turi sotuvdan ajratiladi (daromadga kirmaydi, material hisobiga kiradi). Kitob "Академияга" (ichki o'quv/namuna) real belgi; namuna pul keltirmaydi-yu material sarflaydi → toza statistika (EP-CRM-064 kg bilan).
- **Manba:** kitob ("Академияга") + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance, Ishlab chiqarish (namuna xarajati)

### EP-CRM-085 · Mijoz uchun mas'ul operator/usta tarixi (v2 Q55)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz mahsuloti ↔ tajribali operator bog'lanadi (rejada ustuvor). Kitob aniq operatorlar (Yuldasheva Z/Xolmatov M/Shomansurov A); tamoyil tasdiq, lekin reja-qoidasi (usta-mosligi PP rejaga qattiq qoidami yoki tavsiyami) Ishlab chiqarish bilan birga aniqlanadi.
- **Manba:** kitob (operatorlar ro'yxati) + EP-CRM-061 (stanok marshruti) + v2-A (reja-qoida egasidan)
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (rejalashtirish), Sifat

---

DONE: CRM — 85 (javoblangan 73, ochiq 12).
