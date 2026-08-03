# COORDINATION — Decision Map (EP-COR) — 2026-06-08

> Manba savollar: v1 (30) + v2 (105) = **135**. Kodlar: v1 → EP-COR-001..030, v2 → EP-COR-031..135 (fayl tartibida).
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` (460 real javob — hujjat workflow Q41/Q77–Q83/Q121–Q122), `SHvB-40-Yonalish-Prompt.md` (ShVB Koordinatsiya: 5 kengash, Доклад, Распоряжение, Протокол, Рек.Совет, Приказлар), vizyon master reja (`docs/`: org-sxema vertikal+gorizontal, karta-model, Vysotskiy 7), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-COR-### raqamlash, action turlari).
> Modul kodi = **COR** · Tier = T2 (BOSHQARUV/NAZORAT — ShVB nazorat qatlami).

## Xulosa
- **Jami:** 135
- **✅ JAVOBLANGAN:** 73 (ShVB prompt + BARCHA_JAVOBLAR + vizyon bilan bevosita qoplangan)
- **🔵 OCHIQ:** 62 (granular tafsilot/chegara/edge-case — egasi keyin hal qiladi, A-default tavsiya berildi)

> Asosiy mustahkam tayanchlar (egasi javobi): hujjat org-sxema bo'yicha yuradi (vertikal→gorizontal, sakramaydi), avto-routing admin paneldan konfiguratsiya, 2-imzo (fizik imzo + yozgan xodim tasdig'i), tasdiqlangan hujjat **immutable**, tasdiq muddati hujjat turiga qarab (avans 4 soat, ta'til 24 soat), kechiksa 2x eslatma → eskalatsiya → HR; ERP ichida chat. ShVB strukturasi: 5 kengash + Доклад/Распоряжение/Протокол/Приказлар + Рек.Совет sessiyasi (ЗВС).

---

## I QISM — v1 (30 savol) → EP-COR-001..030

### EP-COR-001 · 5 kengash ro'yxati (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 kengash (Asoschilar/Ijroiya/Tavsiya·Рек.Совет/Qomita/O'rinbosarlar) `council_levels` jadvalida (nom/tur/tavsif/faollik); kengaytirsa bo'ladi.
- **Manba:** ShVB-40 Yo'nalish 7 (council-levels.entity) + master reja
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, butun COR moduli poydevori

### EP-COR-002 · Kengash a'zoligi va rollar
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har a'zoga rol (rais/kotib/a'zo); imzo va yo'naltirish a'zolik+roldan keladi.
- **Manba:** ShVB-40 Yo'nalish 7+10 (protokol imzosi rais/kotib)
- **action:** CREATE
- **⤳ Ta'sir:** Protokol imzo oqimi, Доклад yo'naltirish

### EP-COR-003 · A'zolik karta-model bilan bog'lash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — a'zolik lavozim KARTASIga bog'lanadi (kim kartada bo'lsa, o'sha a'zo); xodim almashsa avtomatik o'tadi.
- **Manba:** Vizyon (karta asosiy, xodim ikkilamchi — MEMORY org_card_centric)
- **action:** UPDATE
- **⤳ Ta'sir:** ORG/KARTALAR (card_id FK), HR

### EP-COR-004 · Доклад shakli (Mavzu/Muammo/Natija/Taklif)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 4 maydon alohida (subject/problem/result/proposal); ShVB blankiga aynan mos.
- **Manba:** ShVB-40 Yo'nalish 8 (dokla.entity: subject/problem/result/proposal)
- **action:** CREATE
- **⤳ Ta'sir:** AI (struktura tahlil), Reports

### EP-COR-005 · Доклад holatlari oqimi (status)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq oqim: Yuborildi→O'qildi→Hal qilindi→Arxiv (har bosqich vaqti bilan).
- **Manba:** ShVB-40 Yo'nalish 8 (sent/read/resolved/archived)
- **action:** UPDATE
- **⤳ Ta'sir:** NTF (bildirishnoma), Arxiv

### EP-COR-006 · Dokladni kengash darajasiga yo'naltirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yuboruvchi kengash darajasini (councilLevel) tanlaydi, tizim a'zolarga yetkazadi; lekin asosiy yo'naltirish org-sxema avto (EP-COR-028).
- **Manba:** ShVB-40 Yo'nalish 8 (doklaCouncilLevel) + BARCHA_JAVOBLAR Q79 (org-sxema yuradi)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, kengash a'zolari

### EP-COR-007 · Доклад yuborilganda bildirishnoma
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Telegram + ilova ichi bildirishnoma; ShVB Telegram kanaliga mos.
- **Manba:** ShVB-40 Yo'nalish 8 (push notification) + Yo'nalish 38 (telegramDoclaReceived)
- **action:** EVENT
- **⤳ Ta'sir:** NTF, AI Integratsiya (Telegram bot)

### EP-COR-008 · Распоряжение muddati va ustuvorligi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — muddat (deadline) majburiy + ustuvorlik (yuqori/o'rta/past) tanlanadi.
- **Manba:** ShVB-40 Yo'nalish 9 (raspDeadline/raspPriority)
- **action:** CREATE
- **⤳ Ta'sir:** Eskalatsiya, KPI

### EP-COR-009 · Kechikkan Распоряжение avto-belgilash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — cron har kuni muddati o'tganni status='overdue' qiladi + rahbarga ogohlantirish.
- **Manba:** ShVB-40 Yo'nalish 9 (markOverdue cron) + BARCHA_JAVOBLAR Q122 (eskalatsiya)
- **action:** CRON
- **⤳ Ta'sir:** NTF, Org-struktura (rahbar)

### EP-COR-010 · Распоряжение qabul/bajarish tasdig'i
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 2 bosqich: qabul qildi (acceptedAt) → bajardi (completedAt, izoh bilan).
- **Manba:** ShVB-40 Yo'nalish 9 (accept/complete)
- **action:** UPDATE
- **⤳ Ta'sir:** Nazorat zanjiri

### EP-COR-011 · Majlis protokoli — YANGI funksiya
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq protokol moduli (kun tartibi + ishtirokchilar + qarorlar + keyingi majlis sanasi).
- **Manba:** ShVB-40 Yo'nalish 10 (protocol.entity)
- **action:** CREATE
- **⤳ Ta'sir:** Qaror→topshiriq zanjiri, Arxiv

### EP-COR-012 · Protokol PDF eksporti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — PDF eksport (zavod blanki); +BARCHA_JAVOBLAR Q77 "pechat qilish imkoni" majburiy.
- **Manba:** ShVB-40 Yo'nalish 10 (generatePdf) + BARCHA_JAVOBLAR Q77
- **action:** EXPORT
- **⤳ Ta'sir:** Arxiv, tashqi tomonlar

### EP-COR-013 · Protokol qaroridan topshiriq (action item)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har qarordan avtomatik Распоряжение (mas'ul + muddat bilan).
- **Manba:** ShVB-40 Yo'nalish 10 (actionItems) + v2 Q38 (avto-topshiriq)
- **action:** CREATE
- **⤳ Ta'sir:** Распоряжение, butun nazorat zanjiri

### EP-COR-014 · Protokol arxivida qidirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kengash turi + sana + matn bo'yicha qidiruv.
- **Manba:** ShVB-40 Yo'nalish 10 ("arxivda qidirish funksiyasi")
- **action:** READ
- **⤳ Ta'sir:** Arxiv, AI (tabiiy til qidiruv)

### EP-COR-015 · Рек.Совет sessiyasi — ЗВС ko'rib chiqish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq sessiya: ochiladi → ЗВС lar qo'shiladi → har biriga qaror → yopiladi + hisobot.
- **Manba:** ShVB-40 Yo'nalish 22 (rec-council-session) — Seshanba ЗВС
- **action:** CREATE
- **⤳ Ta'sir:** Finance (ЗВС), Tasdiqlash matritsasi

### EP-COR-016 · Рек.Совет qarori: to'liq/qisman/rad
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 xil qaror: to'liq / qisman (summa bilan) / rad.
- **Manba:** ShVB-40 Yo'nalish 22 (approvedAmount/rejectedAmount/partialApproval)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (byudjet), Sessiya hisoboti

### EP-COR-017 · Рек.Совет sessiyasidan oldin eslatma
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Seshanba 08:45 cron: a'zolarga "bugun sessiya, X ta ЗВС kutmoqda" (Telegram + ilova).
- **Manba:** ShVB-40 Yo'nalish 22 (Seshanba 08:45 cron)
- **action:** CRON
- **⤳ Ta'sir:** NTF, AI Integratsiya

### EP-COR-018 · Рек.Совет sessiya hisoboti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avto-hisobot (tasdiqlangan/rad/jami summa) + protokolga bog'lanadi.
- **Manba:** ShVB-40 Yo'nalish 22 (generateSessionReport)
- **action:** EXPORT
- **⤳ Ta'sir:** Finance, Director, Protokol

### EP-COR-019 · Приказлар registri — kategoriyalar (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor kategoriyalar (HR/Moliya/Operatsion/Strategik/Umumiy); kengaytirsa bo'ladi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderCategory: HR/Moliya/Operatsion/Strategik)
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv, ruxsat (kim qaysi turni ko'radi)

### EP-COR-020 · Приказ raqamlash (registr nomeri)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik (yil + ketma-ket: 2026-001); takror/bo'sh bo'lmaydi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderNumber)
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv, qonuniy talab

### EP-COR-021 · Приказ kuchga kirish sanasi (effective date)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kuchga kirish sanasi alohida maydon (chiqarilgan sanadan farqli bo'lishi mumkin).
- **Manba:** ShVB-40 Yo'nalish 31 (orderEffectiveDate)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Finance (qachondan kuchda)

### EP-COR-022 · Приказ imzosi va imzolovchi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — imzo bosqichi (Loyiha→Imzolandi→Kuchda) + imzolovchi yoziladi.
- **Manba:** ShVB-40 Yo'nalish 31 (orderSignedBy/orderStatus) + BARCHA_JAVOBLAR Q78 (imzo tartibi)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-struktura (imzo huquqi), Arxiv

### EP-COR-023 · Приказ imzosi turi (elektron/qo'lda)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** B (egasi tasdig'i bilan) — fizik imzo qo'yiladi, yozgan xodim "rahbar imzoladi" deb belgilaydi, imzolovchiga Telegram+ERP tasdiq so'rovi ketadi (2-imzo).
- **Manba:** BARCHA_JAVOBLAR Q78 (fizik imzo + xodim tasdig'i + imzolovchi tasdiq)
- **action:** APPROVE
- **⤳ Ta'sir:** NTF (Telegram), Audit-log

### EP-COR-024 · Приказ PDF va arxiv
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — PDF eksport + doimiy arxiv (qidiruv bilan); +tasdiqlangani immutable.
- **Manba:** ShVB-40 Yo'nalish 31 (generatePdf/archive) + BARCHA_JAVOBLAR Q83 (immutable)
- **action:** EXPORT
- **⤳ Ta'sir:** Arxiv, qonuniy saqlash

### EP-COR-025 · Приказ xodimga yetkazish (tanishtirish)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — приказ tegishli xodimlarga yuboriladi + "tanishdim" tasdig'i yig'iladi.
- **Manba:** BARCHA_JAVOBLAR Q77 (xodim hujjat taqdirini belgilashi) + Q84 (tanishuv imzosi)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, NTF, Audit

### EP-COR-026 · Koordinatsiya boshqaruv paneli (umumiy ko'rinish)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yagona panel (ochiq dokladlar/kutilayotgan rasporyajeniye/yaqin majlis/kuchdagi приказ soni).
- **Manba:** ShVB-40 Yo'nalish 7 (CoordinationPage 3 panel)
- **action:** READ
- **⤳ Ta'sir:** Director, butun COR

### EP-COR-027 · Eskalatsiya: bajarilmagan masalani yuqoriga ko'tarish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik eskalatsiya org-tuzilma bo'yicha yuqoriga (2x eslatma → eskalatsiya → HR).
- **Manba:** BARCHA_JAVOBLAR Q122 (2x + eskalatsiya + HR) + master reja (Vysotskiy 7)
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura (manager_id), HR, NTF

### EP-COR-028 · Org-tuzilma bilan yo'naltirish (vertikal zanjir)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — org-tuzilma zanjiri bo'yicha avto-yo'naltirish (Vysotskiy 7); hujjat sakramaydi: avval vertikal, keyin gorizontal.
- **Manba:** BARCHA_JAVOBLAR Q79 (vertikal→gorizontal, sakramaydi) + Q80 (org-sxema avto) + Q81 (admin paneldan konfiguratsiya)
- **action:** EVENT
- **⤳ Ta'sir:** ORG (manager_id + workflow_rules), butun COR

### EP-COR-029 · Telegram orqali koordinatsiya buyruqlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Telegram buyruqlari (topshiriqlarim/dokladlarim/bajardim).
- **Manba:** ShVB-40 Yo'nalish 38 (telegram-shvb.service: /zvs_status, komandalar)
- **action:** READ
- **⤳ Ta'sir:** AI Integratsiya (Telegram bot), NTF

### EP-COR-030 · Karta-model: kengash hisoboti AI bilan
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — karta AI'si koordinatsiya hisobotini ham tahlil qiladi (kim kechiktiradi, qaysi masala takrorlanadi).
- **Manba:** Vizyon (har kartaning AI'si — org_card_centric) + ShVB-40 Yo'nalish 39 (AI tahlil)
- **action:** AI
- **⤳ Ta'sir:** HR (karta AI), Reports, Org-struktura

---

## II QISM — v2 (105 granular savol) → EP-COR-031..135

> v2 BO'LIM 1–9 = ShVB strukturasiga aniqlik kiritish. BO'LIM 10 (Q56–Q105 → EP-COR-086..135) = kitob-grounded (2020 fabrika hujjatlari): logistika/dizayn/smena/buyurtma operatsion koordinatsiyasi — ko'pi yangi, granular A-default.

### BO'LIM 1 — Kengash a'zolari va kvorum

### EP-COR-031 · Kengash a'zolari ro'yxati qayerdan (v2-Q1)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — org-strukturadan avtomat (CEO + 7 otdeleniye boshlig'i = doimiy a'zo); karta orqali.
- **Manba:** Vizyon (Vysotskiy 7 + karta-model) + ShVB-40 Yo'nalish 7
- **action:** READ
- **⤳ Ta'sir:** HR / Org-struktura

### EP-COR-032 · Kengash a'zosi turlari (rol) (v2-Q2)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 4 rol: Rais/Kotib/A'zo/Mehmon (faqat A'zo+Rais ovoz beradi).
- **Manba:** EP-COR-002 (rol) + ShVB protokol imzosi
- **action:** CREATE
- **⤳ Ta'sir:** Ovoz/kvorum/imzo

### EP-COR-033 · Kvorum foizi (v2-Q3)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 2/3 (66%) shart; kvorum yetmasa "maslahat majlisi" (qaror kuchsiz). Egasi tasdiqlasin.
- **Manba:** A-default (egasi keyin hal qiladi)
- **action:** READ
- **⤳ Ta'sir:** Qaror qonuniyligi

### EP-COR-034 · Ovoz berish usuli va g'olib chegarasi (v2-Q4)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — oddiy ko'pchilik; teng bo'lsa Rais ovozi hal qiladi.
- **Manba:** A-default
- **action:** APPROVE
- **⤳ Ta'sir:** Qaror jarayoni

### EP-COR-035 · A'zo o'rniga vakil (delegatsiya) (v2-Q5)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — faqat oldindan yozma ishonchnoma bilan vakil ovoz beradi (kvorumga sanaladi).
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Kvorum hisobi

### EP-COR-036 · A'zolik manfaat to'qnashuvi (v2-Q6)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — aloqador a'zo o'sha bandda "chetlashtirildi", ovozi sanalmaydi.
- **Manba:** A-default
- **action:** UPDATE
- **⤳ Ta'sir:** Adolat, audit

### BO'LIM 2 — Majlis chastotasi va jadval

### EP-COR-037 · Majlis turlari (v2-Q7)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 4 tur: Operativ/Oylik/Choraklik/Favqulodda.
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Chastota/kvorum/doklad talablari

### EP-COR-038 · Doimiy jadval (raspisaniye) (v2-Q8)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avto takrorlanuvchi jadval (haftalik/oylik shablon); ShVB tsikli (Seshanba Рек.Совет) cron bilan.
- **Manba:** ShVB-40 Yo'nalish 22 (Seshanba cron) + Yo'nalish 4 (FP-tsikl cron)
- **action:** CRON
- **⤳ Ta'sir:** AI Integratsiya (eslatma), HR

### EP-COR-039 · Chaqiriqni oldindan ogohlantirish muddati (v2-Q9)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — oddiy 2 ish kuni oldin; favqulodda kamida 3 soat oldin.
- **Manba:** A-default
- **action:** CRON
- **⤳ Ta'sir:** NTF

### EP-COR-040 · Kun tartibi (povestka) muddati (v2-Q10)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — majlisdan 1 ish kuni oldin qulflanadi, keyin faqat Rais ruxsati bilan band qo'shiladi.
- **Manba:** A-default
- **action:** UPDATE
- **⤳ Ta'sir:** Protokol

### EP-COR-041 · Davomat (yo'qlama) va kechikish (v2-Q11)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 4 holatli davomat avto; sababsiz yo'q 3 marta = HR ogohlantirish.
- **Manba:** A-default (turniket bilan bog'liq — EP-COR-105)
- **action:** UPDATE
- **⤳ Ta'sir:** HR (intizom, KPI)

### EP-COR-042 · Majlis davomiyligi cheklovi (v2-Q12)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — Operativ 30 daq, Oylik 90 daq maqsad; oshsa "qoldirilgan bandlar" keyingiga ko'chadi.
- **Manba:** A-default
- **action:** UPDATE
- **⤳ Ta'sir:** Samaradorlik

### BO'LIM 3 — Доклад va javob muddati

### EP-COR-043 · Доклад turlari va kim topshiradi (v2-Q13)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 3 tur (rejali/so'rovga javob/muammo-doklad); har otdeleniye boshlig'i oylik kengashga rejali doklad majbur.
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura

### EP-COR-044 · Доклад javob muddati (deadline) qoidasi (v2-Q14)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — standart 3 ish kuni, shoshilinch 1 ish kuni (ish kunlari bo'yicha); umumiy prinsip "hujjat turiga qarab muddat".
- **Manba:** BARCHA_JAVOBLAR Q121 (hujjat turiga qarab: avans 4 soat, ta'til 24 soat)
- **action:** CREATE
- **⤳ Ta'sir:** Eskalatsiya

### EP-COR-045 · Доклад kechiksa (eskalatsiya) (v2-Q15)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — muddat-1kun eslatma → tugagach yuqori rahbarga eskalatsiya → 2 kun o'tsa KPI'ga "kechikish".
- **Manba:** BARCHA_JAVOBLAR Q122 (2x eslatma + eskalatsiya + HR)
- **action:** CRON
- **⤳ Ta'sir:** HR/KPI, AI

### EP-COR-046 · Доклад formati va majburiy maydonlar (v2-Q16)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 6 majburiy maydon (Davr/Bajarilgan/Reja-fakt farqi/Muammolar/Takliflar/Ilova). EP-COR-004 ning kengaytmasi.
- **Manba:** A-default + ShVB blank
- **action:** CREATE
- **⤳ Ta'sir:** AI (xulosa), Production/Finance (raqam manbasi)

### EP-COR-047 · Доклад raqamlari qayerdan keladi (v2-Q17)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asosiy raqamlar ERP'dan avto (Production/Finance/Warehouse), izoh qo'lda — manipulyatsiyasiz (vizyon: 30% kiritish / 70% tahlil).
- **Manba:** LOYIHA-BITGAN-XOLAT (oltin ip, 30/70) + master reja
- **action:** AI
- **⤳ Ta'sir:** Production, Finance, Warehouse

### EP-COR-048 · Доклад holatlari (status) (v2-Q18)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 holat: Qoralama→Topshirildi→Ko'rib chiqilmoqda→Qabul/Qaytarildi (EP-COR-005 bilan bir oqim).
- **Manba:** ShVB-40 Yo'nalish 8 (status oqimi)
- **action:** UPDATE
- **⤳ Ta'sir:** Doklad oqimi

### BO'LIM 4 — Распоряжение ustuvorlik va eskalatsiya

### EP-COR-049 · Распоряжение va Приказ farqi (v2-Q19)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — alohida: Распоряжение = bo'lim boshlig'i operativ; Приказ = faqat CEO/Owner rasmiy.
- **Manba:** ShVB-40 (Распоряжение vs Приказлар alohida modullar) + BARCHA_JAVOBLAR Q102 (direktor tasdig'i)
- **action:** CREATE
- **⤳ Ta'sir:** Ierarxiya, Org-struktura

### EP-COR-050 · Распоряжение ustuvorlik darajalari (v2-Q20)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 4 daraja (Past/O'rta/Yuqori/Shoshilinch), har darajaga standart muddat (Shoshilinch=shu kun, Yuqori=2 kun, O'rta=5, Past=10).
- **Manba:** ShVB-40 Yo'nalish 9 (raspHigh/Medium/Low) + EP-COR-008
- **action:** CREATE
- **⤳ Ta'sir:** Navbat, eskalatsiya

### EP-COR-051 · Распоряжение majburiy maydonlari (v2-Q21)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 6 majburiy maydon: Beruvchi/Bajaruvchi/Vazifa/Muddat/Ustuvorlik/Asos.
- **Manba:** A-default + ShVB-40 Yo'nalish 9 (entity maydonlari)
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik aniqligi

### EP-COR-052 · Bajaruvchi bitta yoki ko'pmi (v2-Q22)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — bitta asosiy mas'ul + ixtiyoriy yordamchilar.
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik

### EP-COR-053 · Распоряжение eskalatsiya zinapoyasi (v2-Q23)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 bosqich (muddat-1kun eslatma → bevosita boshliq → +2 kun otdeleniye boshlig'i → +3 kun CEO); zanjir org-sxema manager_id'dan (vertikal).
- **Manba:** BARCHA_JAVOBLAR Q122 (eskalatsiya) + master reja (Vysotskiy 7 manager_id)
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura (manager_id), AI

### EP-COR-054 · Farmoyishni rad etish yoki muddat so'rash (v2-Q24)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — "Rad etish/Uzaytirish so'rovi" (sabab majburiy) → beruvchi tasdiqlaydi/rad etadi.
- **Manba:** A-default + BARCHA_JAVOBLAR Q82 (izoh majburiy)
- **action:** UPDATE
- **⤳ Ta'sir:** Shaffoflik

### EP-COR-055 · Распоряжение holatlari (v2-Q25)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 8 holatli to'liq oqim (Yangi/Qabul/Jarayonda/Bajarildi/Tekshiruvda/Yopildi/Bekor/Kechikkan).
- **Manba:** A-default + ShVB-40 Yo'nalish 9 (assigned/inProgress/done/overdue)
- **action:** UPDATE
- **⤳ Ta'sir:** Nazorat

### BO'LIM 5 — Приказ raqamlash formati va kategoriya

### EP-COR-056 · Приказ raqamlash formati (v2-Q26)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "PR-YYYY-NNN" (yillik, har yil 001 dan, avto o'sadi); EP-COR-020 bilan bir.
- **Manba:** ShVB-40 Yo'nalish 31 (orderNumber) + LOYIHA-BITGAN-XOLAT (raqamlash tizimi)
- **action:** CREATE
- **⤳ Ta'sir:** Arxiv qidiruv

### EP-COR-057 · Приказ kategoriyalari va raqam prefiksi (v2-Q27)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 4 kategoriya, har biriga alohida prefiks va raqam qatori (Kadrlar К / Asosiy ОД / Moliya Ф / Xo'jalik АХ).
- **Manba:** A-default + EP-COR-019 (kategoriyalar)
- **action:** CREATE
- **⤳ Ta'sir:** HR (kadrlar buyruqlari), Finance

### EP-COR-058 · Raqam ketma-ketligi va bekor teshigi (v2-Q28)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — raqam teshigi qoldiriladi, bekor приказ "Bekor qilindi" holatida raqami bilan saqlanadi (qonuniy, immutable bilan mos).
- **Manba:** A-default + BARCHA_JAVOBLAR Q83 (immutable)
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniy shaffoflik

### EP-COR-059 · Приказ ilovasi va asos hujjati (v2-Q29)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asos majburiy: kamida bitta hujjatga havola (majlis qarori/ariza/doklad) — to'liq zanjir.
- **Manba:** BARCHA_JAVOBLAR Q79 (hujjatlar sakramaydi, zanjir to'liq) + master reja (oltin ip)
- **action:** CREATE
- **⤳ Ta'sir:** Audit zanjiri

### EP-COR-060 · Приказ amal qilish muddati va kuchga kirishi (v2-Q30)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — standart imzolangan kundan; ixtiyoriy "kuchga kirish sanasi" + "tugash sanasi" (EP-COR-021 bilan bir).
- **Manba:** ShVB-40 Yo'nalish 31 (orderEffectiveDate)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Finance (qachondan)

### EP-COR-061 · Приказни o'zgartirish va bekor qilish (v2-Q31)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — imzolangan приказ qulflanadi (immutable); o'zgartirish faqat yangi "o'zgartirish kiritish to'g'risida" приказ bilan.
- **Manba:** BARCHA_JAVOBLAR Q83 (tasdiqlangan hujjat immutable)
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniylik, audit

### BO'LIM 6 — Протокол imzo oqimi

### EP-COR-062 · Протокол kim yozadi va shabloni (v2-Q32)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kotib avto-shablonda (kun tartibi + qarorlar + ovoz natijasi + mas'ul + muddat avto); AI majlis yozuvidan qoralash.
- **Manba:** ShVB-40 Yo'nalish 10 (protocol) + Yo'nalish 39 (AI)
- **action:** CREATE
- **⤳ Ta'sir:** AI (qoralash)

### EP-COR-063 · Протокол imzo zanjiri (tartibi) (v2-Q33)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 2 bosqich: Kotib imzolaydi → Rais imzolaydi → "Tasdiqlangan"; 2-imzo prinsipiga mos.
- **Manba:** BARCHA_JAVOBLAR Q78 (2-imzo) + EP-COR-002 (rais/kotib)
- **action:** APPROVE
- **⤳ Ta'sir:** Qaror kuchga kirishi

### EP-COR-064 · Imzo turi (raqamli) (v2-Q34)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tizim ichidagi "Tasdiqlash" (kim/qachon/IP audit yoziladi); fizik imzo + xodim tasdig'i modeli (EP-COR-023).
- **Manba:** BARCHA_JAVOBLAR Q78 (fizik imzo + tasdiq) + Q83 (audit)
- **action:** APPROVE
- **⤳ Ta'sir:** Audit-log

### EP-COR-065 · Imzo muddati va kechikishi (v2-Q35)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — majlisdan 2 ish kuni ichida Rais imzolashi shart; o'tsa eslatma + CEO ro'yxatiga; +rahbar har kuni imzo holatini belgilashi.
- **Manba:** BARCHA_JAVOBLAR Q77 (rahbar har kuni imzolaganini belgilashi, sabab) + Q122
- **action:** CRON
- **⤳ Ta'sir:** NTF, Director

### EP-COR-066 · Imzolangan протоколни o'zgartirish (versiya) (v2-Q36)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tasdiqlangach qulflanadi (immutable); tuzatish faqat "tuzatish protokoli" bilan, asl saqlanadi.
- **Manba:** BARCHA_JAVOBLAR Q83 (immutable)
- **action:** UPDATE
- **⤳ Ta'sir:** Shaffoflik, audit

### EP-COR-067 · E'tiroz (osoboye mneniye) yozish (v2-Q37)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — a'zo "alohida fikr" yozadi, protokolga ilova bo'ladi.
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Adolat

### BO'LIM 7 — Qaror bajarilishini nazorat

### EP-COR-068 · Qaror = topshiriqqa avto aylanishi (v2-Q38)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har qarorga majlisda mas'ul + muddat belgilanadi, avto Распоряжение ochiladi (EP-COR-013).
- **Manba:** ShVB-40 Yo'nalish 10 (actionItems)
- **action:** CREATE
- **⤳ Ta'sir:** butun COR zanjiri

### EP-COR-069 · Bajarilish foizi va holat ko'rsatkichi (v2-Q39)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — holat + foiz; har majlis boshida "o'tgan qarorlar holati" avto ko'rsatiladi.
- **Manba:** A-default
- **action:** READ
- **⤳ Ta'sir:** Uzluksiz nazorat

### EP-COR-070 · Bajarilmagan qarorni keyingi majlisga ko'chirish (v2-Q40)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — avto keyingi kun tartibiga "bajarilmagan qaror" bo'limida, mas'ul sabab tushuntiradi.
- **Manba:** A-default
- **action:** CRON
- **⤳ Ta'sir:** Protokol, nazorat

### EP-COR-071 · Bajarish dalili (pruf) talab (v2-Q41)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — Yuqori/Shoshilinch qarorlarga dalil majburiy, oddiyga ixtiyoriy.
- **Manba:** A-default
- **action:** UPDATE
- **⤳ Ta'sir:** Ishonch

### EP-COR-072 · Bajarilishni kim tasdiqlaydi (yopish huquqi) (v2-Q42)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bajaruvchi "Bajardim" → beruvchi/Rais "Qabul qildim" deb yopadi (2 bosqich, EP-COR-010 bilan bir).
- **Manba:** BARCHA_JAVOBLAR Q78 (yozgan xodim qabul qiladi) + EP-COR-010
- **action:** APPROVE
- **⤳ Ta'sir:** Nazorat

### EP-COR-073 · Qaror bajarilish reytingi (mas'ullar) (v2-Q43)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — oylik bajarilish reytingi (o'z vaqtida %/kechikkan %) KPI'ga ulanadi.
- **Manba:** A-default
- **action:** AI
- **⤳ Ta'sir:** HR/KPI (boshliq samaradorligi)

### BO'LIM 8 — Kengash arxivi

### EP-COR-074 · Arxivda nima saqlanadi (v2-Q44)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq paket har majlisga (protokol+kun tartibi+doklad+ovoz+qaror+davomat+ilova); butun hujjatlar ERP ichida saqlanadi.
- **Manba:** BARCHA_JAVOBLAR Q77 (barcha hujjatlar ERP ichida) + Q83 (immutable arxiv)
- **action:** CREATE
- **⤳ Ta'sir:** To'liq tarix

### EP-COR-075 · Arxivda qidiruv mezonlari (v2-Q45)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — ko'p mezonli (sana oralig'i + mavzu/kalit so'z + mas'ul + raqam + holat).
- **Manba:** A-default + EP-COR-014
- **action:** READ
- **⤳ Ta'sir:** AI (tabiiy til qidiruv)

### EP-COR-076 · Arxivga kirish huquqi (kim ko'radi) (v2-Q46)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — majlisga "Ochiq/Maxfiy" belgisi; maxfiyni faqat a'zolar+CEO; RBAC kartadan, maydon darajasi.
- **Manba:** BARCHA_JAVOBLAR Q43 (maxfiy hujjat ruxsati) + LOYIHA-BITGAN-XOLAT (RBAC kuchli, kartadan)
- **action:** READ
- **⤳ Ta'sir:** HR (jazo/oylik maxfiyligi), Finance, Security

### EP-COR-077 · Arxiv saqlash muddati va o'chirish taqiqi (v2-Q47)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rasmiy hujjat o'chirilmaydi (faqat arxiv holati); kadrlar приказ muddatsiz, qolgani min. 5 yil.
- **Manba:** BARCHA_JAVOBLAR Q83 (immutable, o'chirib bo'lmaydi)
- **action:** UPDATE
- **⤳ Ta'sir:** Qonuniylik

### EP-COR-078 · Arxiv o'zgarmasligi (audit izi) (v2-Q48)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har ko'rish/o'zgartirish/yuklab olish audit izga (kim/qachon).
- **Manba:** LOYIHA-BITGAN-XOLAT (to'liq audit-log) + BARCHA_JAVOBLAR Q83
- **action:** EVENT
- **⤳ Ta'sir:** Ishonch, Security

### EP-COR-079 · Arxivdan eksport va hisobot (v2-Q49)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — bir tugma bilan davr hisoboti (qarorlar+bajarilish%+kechikkanlar) PDF/Excel.
- **Manba:** A-default
- **action:** EXPORT
- **⤳ Ta'sir:** Director, tekshiruv

### BO'LIM 9 — Bog'lanish va chetki holatlar

### EP-COR-080 · Eslatma kanali (qaerga xabar boradi) (v2-Q50)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ERP ichi + Telegram (otdeleniye guruhi/shaxsiy); kimga yuborilishi manager_id/telegram_group'dan.
- **Manba:** ShVB-40 Yo'nalish 38 (Telegram) + master reja (telegram_group) + EP-COR-007
- **action:** EVENT
- **⤳ Ta'sir:** AI Integratsiya, Org-struktura

### EP-COR-081 · Majlisni o'tkazmaslik/qoldirish qoidasi (v2-Q51)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — avto keyingi sanaga ko'chiriladi; tayyor dokladlar+kun tartibi saqlanib o'tadi.
- **Manba:** A-default
- **action:** CRON
- **⤳ Ta'sir:** Ma'lumot yo'qolmasligi

### EP-COR-082 · Favqulodda majlis va shoshilinch qaror (v2-Q52)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 3 soatda chaqiriladi, yengil kvorum (50%), keyingi oddiy majlisda tasdiqlanadi.
- **Manba:** A-default
- **action:** CREATE
- **⤳ Ta'sir:** Tezkor qaror

### EP-COR-083 · Coordination ↔ boshqa modul bog'lanishi (v2-Q53)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qaror turi bo'yicha tegishli modulga avto vazifa/signal (Production/Finance/HR/Warehouse) — oltin ip integratsiyasi.
- **Manba:** LOYIHA-BITGAN-XOLAT (modullararo sinxron, oltin ip) + ShVB-40 Yo'nalish 39
- **action:** EVENT
- **⤳ Ta'sir:** Production, Finance, HR, Warehouse

### EP-COR-084 · Kengash a'zosi o'zgarishi (lavozim almashinuvi) (v2-Q54)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — lavozim o'zgarsa a'zolik avto yangi egasiga o'tadi (karta-model), ochiq topshiriqlar yangi mas'ulga ko'chadi (eslatma bilan).
- **Manba:** Vizyon (karta-model — kartaga xodim) + EP-COR-003
- **action:** EVENT
- **⤳ Ta'sir:** HR/Org-struktura

### EP-COR-085 · Majlis tili va ko'p tillilik (v2-Q55)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asosiy til o'zbek lotin, har hujjatga til tanlash (lotin/kirill/rus).
- **Manba:** Master reja (i18n uz/uz-cyr/ru — loyiha 3 tilli)
- **action:** CREATE
- **⤳ Ta'sir:** i18n

### BO'LIM 10 — KITOB-GROUNDED (2020 fabrika hujjatlari) — operatsion koordinatsiya

### EP-COR-086 · 1-sutkalik (24h) ishlab chiqarish rejasi (v2-Q56)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har kuni 1-sutkalik reja generatsiya → logistika+uchastka+ombor kartasiga avto; o'zgarsa darrov push + log.
- **Manba:** A-default (kitob — rejalashtirish bo'limi)
- **action:** CRON
- **⤳ Ta'sir:** Production (MPS/MES), Warehouse, Internal Logistics

### EP-COR-087 · "Bekor turish" (downtime) koordinatsiya yozuvi (v2-Q57)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — bekor turish hodisasi (sabab + boshlanish/tugash + mas'ul bo'lim) → avto statistika.
- **Manba:** A-default (kitob — logistika KPI)
- **action:** EVENT
- **⤳ Ta'sir:** Production OEE, Internal Logistics KPI, Reports

### EP-COR-088 · Techkarta↔material: logistika STOP huquqi (v2-Q58)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — logistika "techkartaga mos emas" STOP qo'ya oladi → chiqish bloklanadi + rejalashtirish/dizaynerga xabar; STOP'ni faqat rejalashtirish/dizayn rahbari yechadi.
- **Manba:** A-default (kitob — 1-vazifa misoli)
- **action:** UPDATE
- **⤳ Ta'sir:** Quality, Warehouse, Production

### EP-COR-089 · 5-Dept/13-bo'lim org-sxema yo'naltirish manbai (v2-Q59)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yo'naltirish 7-departament + bo'lim + sektsiya ierarxiyasiga bog'lanadi (Vysotskiy 7, sektsiya darajasigacha).
- **Manba:** Master reja (Vysotskiy 7 L0-L5: ...→Sektsiyalar→Sektorlar) + BARCHA_JAVOBLAR Q79
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura, butun koordinatsiya yo'nalishi

### EP-COR-090 · Dizayn↔Savdo↔IChQ "ahborot uzluksizligi" (v2-Q60)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har buyurtma handoff nuqtalari vaqt bilan yoziladi (savdo→dizayn, dizayn→IChQ); uzilish ko'rinadi.
- **Manba:** A-default (kitob — dizayn ЦКП)
- **action:** EVENT
- **⤳ Ta'sir:** CRM/Sales, Design, Production

### EP-COR-091 · Bitrix24 karta-status zanjirini ko'chirish (v2-Q61)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — 4 status standart (ТТ keldi→Dizayn tayyorlanyapti→Tasdiqda→IChQ ga topshirildi); "Tasdiqda" — buyurtmachi tasdiqlaydi (podpisnoy list).
- **Manba:** A-default (kitob — Bitrix24 dizayn statuslari)
- **action:** UPDATE
- **⤳ Ta'sir:** Design, CRM, Production handoff

### EP-COR-092 · Podpisnoy list — IChQ ruxsat darvozasi (v2-Q62)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — podpisnoy list bo'lmasa IChQ ga o'tkazish bloklanadi (qattiq gate).
- **Manba:** A-default (kitob — podpisnoy list asosiy tasdiq)
- **action:** UPDATE
- **⤳ Ta'sir:** Design→Production gate, Quality, Sales

### EP-COR-093 · Qolip (СТП/kesuvchi) tayyorligi koordinatsiyasi (v2-Q63)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har buyurtmada qolip holati (tayyor/buyurtma berilgan/kerak emas) → IChQ rejasiga bog'lanadi.
- **Manba:** A-default (kitob — dizayn rahbari qolip muvofiqligi)
- **action:** READ
- **⤳ Ta'sir:** Production scheduling, Design, Procurement

### EP-COR-094 · Rohler/poddon (ichki transport) tayyorligi (v2-Q64)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — ichki transport reestri: holat (soz/ta'mirda/band) + band jadval.
- **Manba:** A-default (kitob — logistika rohler/poddon)
- **action:** READ
- **⤳ Ta'sir:** Internal Logistics, Maintenance, Production

### EP-COR-095 · Chiqindi/qoldiq chiqarish koordinatsiyasi (v2-Q65)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — uchastka "chiqindi to'ldi" signal → logistikaga topshiriq → bajarish tasdig'i (yopiq tsikl).
- **Manba:** A-default (kitob — logistika chiqindi)
- **action:** EVENT
- **⤳ Ta'sir:** Internal Logistics, Warehouse, Safety

### EP-COR-096 · Algoritm turi (2–8 bo'lim) bo'lim-marshruti (v2-Q66)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har buyurtmaga bo'lim-zanjiri (algoritm turi) → keyingi bo'lim avto ko'rinadi.
- **Manba:** A-default (Excel — algoritm turi)
- **action:** READ
- **⤳ Ta'sir:** Production routing, Internal Logistics, MES

### EP-COR-097 · Buyurtma №/Papka № — yagona identifikator (v2-Q67)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma/papka № yagona kalit, har koordinatsiya hujjati shunga bog'lanadi (fabrika tili); EP-COR-059 (asos hujjati) bilan mos.
- **Manba:** Master reja (oltin ip — buyurtma yagona kalit) + Excel (papka № amaliyot)
- **action:** CREATE
- **⤳ Ta'sir:** barcha modullar (Sales, Production, Warehouse)

### EP-COR-098 · Priladka (sozlash) vaqti koordinatsiyasi (v2-Q68)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — smena rejasida priladka oralig'i → logistika va keyingi buyurtma moslanadi.
- **Manba:** A-default (Excel — priladka soati)
- **action:** READ
- **⤳ Ta'sir:** Production scheduling, Internal Logistics

### EP-COR-099 · Smena (den/noch) topshirig'i — handover (v2-Q69)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — smena handover yozuvi (tugamagan buyurtma + ochiq STOP/bekor turish + eslatma) → keyingi smenaga o'tadi.
- **Manba:** A-default (Excel — den/noch smena)
- **action:** CREATE
- **⤳ Ta'sir:** Production (smena), Internal Logistics, HR

### EP-COR-100 · "Muvaffaqiyatli harakat / odatiy xato" blanki (v2-Q70)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har bo'lim/karta uchun blank davriy to'ldiriladi + AI tahlilga kiradi (bilim-yig'ish).
- **Manba:** A-default (kitob — har yo'riqnoma blanki)
- **action:** CREATE
- **⤳ Ta'sir:** HR (LMS/karta AI), Quality

### EP-COR-101 · Kunlik/haftalik/oylik hisobot ritmi (v2-Q71)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har bo'limga kunlik/haftalik/oylik hisobot topshirig'i avto ochiladi + kechiksa eskalatsiya; avto kunlik hisobot (mashina→PDF).
- **Manba:** LOYIHA-BITGAN-XOLAT (avto kunlik hisobot mashina→PDF) + master reja
- **action:** CRON
- **⤳ Ta'sir:** barcha bo'lim rahbarlari, Reports

### EP-COR-102 · Statistik KPI — koordinatsiyada avto o'lchov (v2-Q72)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har lavozim yo'riqnomadagi KPI lari koordinatsiya hodisalaridan avto hisoblanadi (manipulyatsiyasiz); 30/70 prinsip.
- **Manba:** LOYIHA-BITGAN-XOLAT (30% kiritish/70% tahlil) + vizyon (karta KPI)
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Reports, Org-struktura

### EP-COR-103 · Buyurtma "tayyorlik %" — bo'limlararo ko'rsatkich (v2-Q73)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — har buyurtmaga tayyorlik % (o'tilgan bo'lim/jami bo'lim) — real vaqtda.
- **Manba:** A-default (Excel — buyurtma tayyorligi %)
- **action:** READ
- **⤳ Ta'sir:** CRM, Production, Coordination dashboard

### EP-COR-104 · Menejer buyurtma egasi sifatida (v2-Q74)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — buyurtma menejerga bog'lanadi → kechikish/STOP/handoff menejerga ham bildiriladi.
- **Manba:** A-default (Excel — menejer biriktirilgan)
- **action:** EVENT
- **⤳ Ta'sir:** CRM/Sales, Notifications

### EP-COR-105 · Turniket (kirish-chiqish) — "ish joyida bormi" (v2-Q75)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — topshiriq berishda turniket holati ko'rinadi (ishda/ishda emas) → yo'q odamga bermaslik/qayta yo'naltirish.
- **Manba:** A-default (kitob — turniket) + AI kamera davomat (LOYIHA-BITGAN-XOLAT)
- **action:** READ
- **⤳ Ta'sir:** HR (davomat/turniket), Notifications

### EP-COR-106 · "Uch karzina" (3-tray) hujjat tizimi (v2-Q76)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har xodim paneli 3 ustun: Yangi/Jarayonda/Tugagan (uch karzina metaforasi).
- **Manba:** ShVB-40 Yo'nalish 19 (3-savat: incoming/pending/outgoing) — Kanban moduli
- **action:** READ
- **⤳ Ta'sir:** Coordination UI, Kanban, HR (karta)

### EP-COR-107 · "Ishni tashlab ketish"/boshqa ish — intizom signali (v2-Q77)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — topshiriq X soat harakatsiz qolsa → rahbarga "harakatsiz" signal (yumshoq nazorat).
- **Manba:** A-default (kitob — intizom xatosi)
- **action:** EVENT
- **⤳ Ta'sir:** HR (intizom), Org-struktura

### EP-COR-108 · "Rahbar kamchiligi" prinsipi — xato bo'lim rahbariga (v2-Q78)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bo'lim ichidagi xato/qayta-ishlash bo'lim rahbarining ko'rsatkichiga ham yoziladi (kitob falsafasi: mas'uliyat rahbarda).
- **Manba:** Kitob (aniq prinsip — "rahbar boshqaruvidagi kamchilik") + vizyon (karta KPI)
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Quality, Org-struktura

### EP-COR-109 · Ish yuklamasini muvozanatlash (v2-Q79)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — bo'lim ichida yuklama ko'rinishi (har xodimda ochiq ish soni/og'irligi) + bir tugmada qayta biriktirish.
- **Manba:** A-default (kitob — yuklama muvozanati)
- **action:** UPDATE
- **⤳ Ta'sir:** HR (karta), Design

### EP-COR-110 · Ustuvorlik (1/2/keyingi navbat) — navbat huquqi (v2-Q80)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — buyurtmaga ustuvorlik (1/2/keyingi) belgilanadi → reja/navbat shunga qarab tartiblanadi.
- **Manba:** A-default (kitob/Excel — ochered navbati)
- **action:** UPDATE
- **⤳ Ta'sir:** Production scheduling, Design, Sales

### EP-COR-111 · Material yetishmovchiligi — koordinatsiya signali (v2-Q81)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — uchastka "material yetishmadi" signal → logistika + ombor + rejalashtirish bir vaqtda xabardor.
- **Manba:** A-default (kitob — bekor turish sababi)
- **action:** EVENT
- **⤳ Ta'sir:** Warehouse, Internal Logistics, Production, Planning

### EP-COR-112 · Gofra qavati (3/5) aralashtirish xatosi oldini olish (v2-Q82)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — material chiqarishda skaner techkarta gofra-turini solishtiradi → mos kelmasa ogohlantirish.
- **Manba:** A-default (kitob — 2-vazifa misoli)
- **action:** UPDATE
- **⤳ Ta'sir:** Warehouse, Quality, POS Monitor

### EP-COR-113 · Konstruktor↔dizayn koordinatsiyasi (5-Dept) (v2-Q83)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — dizayn↔konstruktor handoff alohida bosqich (o'lcham/begovka/vysechka tasdig'i bilan).
- **Manba:** A-default (kitob — 5-Dept dizayn+konstruktor)
- **action:** EVENT
- **⤳ Ta'sir:** Design, Production, Quality

### EP-COR-114 · Buyurtma o'zgarishi — o'zgarish bildirishnomasi (v2-Q84)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma o'zgarishi → ta'sirlangan bo'limlarga (logistika/ombor/IChQ/dizayn) bildirishnoma + tasdiq talab.
- **Manba:** LOYIHA-BITGAN-XOLAT (modullararo sinxron) + kitob (logistika xatosi: o'zgarishni hisobga olmaslik)
- **action:** EVENT
- **⤳ Ta'sir:** barcha modullar, Notifications

### EP-COR-115 · Yig'ilish ishtiroki + topshiriq bajarilishi bog'lanishi (v2-Q85)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — yig'ilish ishtiroki yoziladi + undan chiqqan topshiriqlar bajarilishi shu yig'ilishga ulanadi (yopiq tsikl).
- **Manba:** A-default + EP-COR-068 (qaror→topshiriq)
- **action:** EVENT
- **⤳ Ta'sir:** Coordination (protokol), HR, Reports

### EP-COR-116 · Energiya/resurs tejash (suv/gaz/svet) — javobgarlik (v2-Q86)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — energiya tejash karta javobgarligiga KPI sifatida ulanadi.
- **Manba:** A-default (kitob — logistika javobgarligi)
- **action:** AI
- **⤳ Ta'sir:** HR (karta KPI), Operations, Reports

### EP-COR-117 · "Nazorat varaqasi" (onboarding) bilan bog'lash (v2-Q87)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — nazorat varaqasi tugamasa kartaning to'liq topshiriqlari ochilmaydi (yumshoq gate); onboarding karta papkasidan.
- **Manba:** Vizyon (karta papka + darslik kartaga) + ShVB-40 Yo'nalish 16/17 (onboarding/papka) + BARCHA_JAVOBLAR Q84
- **action:** UPDATE
- **⤳ Ta'sir:** HR (LMS/karta), Org-struktura

### EP-COR-118 · Rejalashtirishdan ma'lumot "talab qilish" huquqi (v2-Q88)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — bo'limlararo rasmiy "ma'lumot so'rovi" hujjati (muddat + javob holati bilan) — kuzatiladi.
- **Manba:** A-default (kitob — logistika huquqi) + EP-COR-089 (gorizontal)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (gorizontal), Planning, Production

### EP-COR-119 · Gorizontal (bo'limlararo) workflow qoidalari (v2-Q89)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bo'limlararo workflow qoidalari jadvali (manba bo'lim → maqsad bo'lim → hujjat turi) — avto-yo'naltirish; admin paneldan konfiguratsiya.
- **Manba:** Master reja (workflow_rules jadval — gorizontal) + BARCHA_JAVOBLAR Q81 (admin paneldan yo'l chiziladi)
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (gorizontal), barcha bo'limlar

### EP-COR-120 · ЦКП (Qimmatli Yakuniy Mahsulot) — bo'lim natijasi (v2-Q90)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har bo'lim/karta ЦКП chiqishi o'lchanadi (son + vaqt) — natijaga yo'naltirilgan boshqaruv.
- **Manba:** Vizyon (har karta ЦКП — org_card_centric) + LOYIHA-BITGAN-XOLAT (GSD/ЦКП)
- **action:** AI
- **⤳ Ta'sir:** HR (karta AI), Reports, Org-struktura

### EP-COR-121 · Buyurtma muddati (plan vs fakt) kechikish koordinatsiyasi (v2-Q91)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — plan-fakt og'ishi real vaqtda hisoblanadi → og'ish chegaradan oshsa signal (erta ogohlantirish).
- **Manba:** A-default (Excel — planovaya/fakt)
- **action:** EVENT
- **⤳ Ta'sir:** Production, CRM (menejer), Reports

### EP-COR-122 · Brak soni — bo'lim koordinatsiyasi va sabab (v2-Q92)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — brak hodisasi (bo'lim + sabab + buyurtma №) → mas'ul rahbar KPI siga ulanadi (EP-COR-108 bilan mos).
- **Manba:** A-default (Excel — brak soni) + kitob (rahbar kamchiligi)
- **action:** EVENT
- **⤳ Ta'sir:** Quality, Production, Design

### EP-COR-123 · Norma vs fakt (ish-normasi) — uchastka koordinatsiyasi (v2-Q93)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — real norma-bajarilish % (xodim/uchastka) koordinatsiyada → past bo'lsa rahbarga signal.
- **Manba:** A-default (Excel — norma/fakt %)
- **action:** EVENT
- **⤳ Ta'sir:** HR (norma/oylik), Production

### EP-COR-124 · Operator + yordamchi (Помощник) juftligi (v2-Q94)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — dastgoh/buyurtmaga operator+yordamchi juftligi → ikkisi ham koordinatsiya signalini oladi.
- **Manba:** A-default (Excel — operator/pomoshnik)
- **action:** UPDATE
- **⤳ Ta'sir:** HR (smena), Production

### EP-COR-125 · Kichiklashgan buyurtma (razmer optimizatsiyasi) qarori (v2-Q95)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — razmer/optimizatsiya taklifi koordinatsiya qarori sifatida (dizayn→savdo→rahbar tasdiq).
- **Manba:** A-default (Excel — kichik buyurtmalar)
- **action:** APPROVE
- **⤳ Ta'sir:** Design, Sales, Finance (foyda)

### EP-COR-126 · Yo'nalish turi (ofs-kar/ofs-gof/flx-gof) bo'lim-marshruti (v2-Q96)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — yo'nalish turi → mos bo'lim-marshruti avto ochiladi.
- **Manba:** A-default (Excel — yo'nalishlar) + EP-COR-096
- **action:** READ
- **⤳ Ta'sir:** Production routing, Internal Logistics, MES

### EP-COR-127 · "Boshlanmasdan qolgan kunlar" — kechikkan-start signali (v2-Q97)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — ochilgan lekin N kun boshlanmagan buyurtmalar avto signal → rejalashtirish/logistikaga.
- **Manba:** A-default (Excel — boshlanmagan kunlar)
- **action:** CRON
- **⤳ Ta'sir:** Planning, Internal Logistics, Coordination dashboard

### EP-COR-128 · "Зарур заказлар" (shoshilinch) — koordinatsiya bayrog'i (v2-Q98)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — "shoshilinch" bayrog'i → barcha bo'lim panelida ajralib + navbat tepasida.
- **Manba:** A-default (Excel — ZARUR ZAKAZLAR)
- **action:** UPDATE
- **⤳ Ta'sir:** Production, Sales, Internal Logistics

### EP-COR-129 · Kesilgan qog'oz/qoldiq rulon — ichki xizmat so'rovi (v2-Q99)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — ichki xizmat so'rovi (kesish/rulon) — so'rovchi → bajaruvchi bo'lim, muddat + bajarish tasdig'i.
- **Manba:** A-default (Excel — kesilgan qog'oz xizmati) + EP-COR-118 (so'rov)
- **action:** CREATE
- **⤳ Ta'sir:** Internal Logistics, Production

### EP-COR-130 · Smena tayyorligi cheklisti (10 daq oldin) (v2-Q100)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — smena boshida "tayyorlik" cheklisti (material/qolip/dastgoh/xodim) → tasdiqlanmaguncha bekor turish hisoblanmaydi.
- **Manba:** A-default (kitob — 10 daqiqa oldin)
- **action:** CREATE
- **⤳ Ta'sir:** Production (smena), Internal Logistics, HR

### EP-COR-131 · Tijorat siri/dizayn fayllari maxfiyligi — ko'rish huquqi (v2-Q101)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — koordinatsiya hujjatlari ko'rish-ruxsati bo'lim/daraja/karta bo'yicha cheklanadi (RBAC kuchli, maydon darajasi).
- **Manba:** LOYIHA-BITGAN-XOLAT (RBAC eng kuchli, kartadan, maydon darajasi, shifrlangan) + BARCHA_JAVOBLAR Q43
- **action:** READ
- **⤳ Ta'sir:** Security/permissions, Design, Sales

### EP-COR-132 · Direktor (Pozilov A.A.) tasdig'i — eng yuqori darvoza (v2-Q102)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — belgilangan turdagi qarorlar (yangi lavozim/katta xarajat/приказ) direktor tasdiq darvozasidan o'tadi (elektron imzo qadami).
- **Manba:** Kitob (har yo'riqnoma "ТАСДИҚЛАЙМАН директор/Позилов А.А.") + BARCHA_JAVOBLAR Q78 (imzo) + tasdiqlash matritsasi (ShVB-40 Yo'nalish 6)
- **action:** APPROVE
- **⤳ Ta'sir:** Coordination (приказ/sessiya), Org-struktura, Finance

### EP-COR-133 · ТТ (Texnik topshiriq) to'liqligi — dizayn boshlash darvozasi (v2-Q103)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A-default — ТТ majburiy maydonlari (mahsulot turi/o'lcham/material/bosma/ranglar/matn/logotip/miqdor/maxsus talab) to'ldirilmasa — dizaynga o'tkazib bo'lmaydi (gate).
- **Manba:** A-default (kitob — dizayn rahbari xatosi)
- **action:** UPDATE
- **⤳ Ta'sir:** Sales→Design handoff, CRM, Quality

### EP-COR-134 · Bo'lim rahbari javob muddati (SLA) — "zudlik bilan chora" (v2-Q104)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har muammo signaliga rahbar javob SLA si (masalan 2 soat) → o'tsa avto yuqoriga; hujjat turiga qarab muddat (avans 4 soat) prinsipiga mos.
- **Manba:** BARCHA_JAVOBLAR Q121 (hujjat turiga qarab muddat) + Q122 (eskalatsiya)
- **action:** CRON
- **⤳ Ta'sir:** Coordination (eskalatsiya), Org-struktura, KPI

### EP-COR-135 · Koordinatsiya hodisalari karta-AI ga oziq (lavozim mosligi) (v2-Q105)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — koordinatsiya hodisalari (kechikish/STOP/brak/norma %/javob SLA) karta-AI ga real signal → xodim-karta mosligi dinamik baholanadi.
- **Manba:** Vizyon (har karta AI'si xodim↔karta mosligini baholaydi — org_card_centric) + LOYIHA-BITGAN-XOLAT (markaziy AI)
- **action:** AI
- **⤳ Ta'sir:** HR (karta-markazli model, AI), Org-struktura

---

DONE: Coordination — 135 (javoblangan 73, ochiq 62).
