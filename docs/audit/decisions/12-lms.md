# LMS / Ta'lim — Decision Map (EP-LMS) — 2026-06-08

> Manba savollar: v1 (`vision-questions/12-lms.md`, 30) + v2 (`vision-questions-v2/12-lms.md`, 55) = **85**.
> Kodlar fayl tartibida: v1 → EP-LMS-001..030, v2 → EP-LMS-031..085.
> Status manbalari: `shvb-extracted/EUROPRINT_BARCHA_JAVOBLAR.md` (Q32/Q71/Q72/Q75/Q148/Q149/Q170/Q176/Q177/Q197), `shvb-extracted/SHvB-40-Yonalish-Prompt.md` (YO'NALISH 27=lavozim kurslari, 28=reglament testlari, 34=kaizen PDCA), `kitob-extracted/` (НАЗОРАТ ВАРАҚАСИ + 12-mavzu + glossariy + "мустақил иш фаолиятига қўйиш тартиби" + Сборник упражнений + ЯКУНИЙ ТОПШИРИҚЛАР), `KARTALAR-JAVOBLAR-IMPACT-2026-06-08.md` (Q7/Q8/Q10/Q11/Q13/Q27/Q28/Q29/Q33), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-kod + action turlari).
> 🔵 OCHIQ = egasi granular qarorni aniq belgilamagan — A-default (vizyonga eng mos) tavsiya berildi.
> ⭐ KARTALAR vizyoni: **darslik kartaga biriktiriladi** (xodimga emas) — **darslik tugamasa o'sha karta oyligi yo'q** (Q27/Q28).

## Xulosa
- **Jami:** 85
- **✅ JAVOBLANGAN:** 75 (BARCHA_JAVOBLAR / SHvB 40-yo'nalish / kitob / KARTALAR-modeldan to'g'ridan-to'g'ri)
- **🔵 OCHIQ:** 10 (granular tafsilot — A-default tavsiya berildi)

---

## I QISM — v1 (30 savol) — EP-LMS-001..030

### EP-LMS-001 · Darslik kimga biriktiriladi — kartaga yoki xodimga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Kartaga biriktiriladi — xodim almashsa darslik karta bilan qoladi, voris avtomatik o'sha darslikni oladi (A).
- **Manba:** KARTALAR Q28 ("Darslik kartaga = A; xodim emas, yangi xodim avto-oladi") + karta-model vizyon
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (darslik karta atributi), HR (voris avto-oladi)

### EP-LMS-002 · Darslik tugamaguncha oylik yo'q
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, bloklaydi — karta darsligi 100% tugamasa o'sha karta oyligi to'xtaydi (ogohlantirish bilan) (A).
- **Manba:** KARTALAR Q27 ("Darslik tugamasa oylik yo'q = A; o'sha karta oyligi to'xtaydi") + vizyon bo'lim 7/9
- **action:** EVENT
- **⤳ Ta'sir:** Payroll (oylik-gate), Org-karta, HR

### EP-LMS-003 · Ishga olinganda kurs avto-tayinlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Avtomatik — kartaga biriktirish bo'lishi bilan kartaning barcha majburiy kurslari xodimga tushadi + muddat boshlanadi (A).
- **Manba:** SHvB YO'NALISH 27 ("Yangi xodim qabul qilinganda → lavozimga biriktirilgan barcha majburiy kurslar avtomatik tayinlanadi") + KARTALAR Q28
- **action:** EVENT
- **⤳ Ta'sir:** HR (onboarding), Org-karta (majburiy kurslar)

### EP-LMS-004 · Kurs tugamaguncha MES (mashinaga) bloklash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, qattiq blok — majburiy xavfsizlik/operatsiya kursi tugamasa MES o'sha xodimga ishni boshlatmaydi (`blocks_mes` ustuni allaqachon bor) (A).
- **Manba:** vizyon (blocks_mes ulanishi) + kitob ("Техника хавфсизлиги бўйича йўриқномадан ўтиш" majburiy) + ERP-SIFAT 7 (avtomatlashtirish)
- **action:** EVENT
- **⤳ Ta'sir:** MES (ish-boshlash gate), Org-karta, HR (xavfsizlik jurnali)

### EP-LMS-005 · Reglament testlari (yangi feature)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq — har reglament uchun test banki + topshirish + ball + qayd ("o'qidim" tugmasi yetarli emas) (A).
- **Manba:** SHvB YO'NALISH 28 ("Регламент Testlari": testFromRegulation, testPassRequired, testPassScore) + Director/GSD integratsiya ("Har yangi reglament → avto LMS test")
- **action:** CREATE
- **⤳ Ta'sir:** Director (reglament/GSD), Hujjat boshqaruvi, AI (test generatsiya)

### EP-LMS-006 · Reglament testi uchun 7-kunlik muddat
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 7 kun — standart muddat, hammaga bir xil, sanagich avtomatik (A).
- **Manba:** SHvB YO'NALISH 28 ("Kechikish: 7 kun ichida o'tmasa — rahbarga bildirishnoma")
- **action:** CRON
- **⤳ Ta'sir:** Notifications (deadline), HR

### EP-LMS-007 · 7-kun o'tib test topshirilmasa nima bo'ladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Bosqichma-bosqich — avval ogohlantirish, keyin rahbar/HR'ga raport, keyin o'sha kartaning oyligi/MES bloklanadi (A).
- **Manba:** SHvB YO'NALISH 28 (kechikish → rahbarga bildirishnoma) + KARTALAR Q27 (oylik-gate) + EP-LMS-002/004
- **action:** EVENT
- **⤳ Ta'sir:** Payroll (oylik-gate), MES (blok), Notifications, Coordination

### EP-LMS-008 · Test yiqilganda qayta-test
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Cheklangan qayta — masalan 2 marta qayta, keyin majburiy qayta-o'qish + rahbar/HR aralashuvi (A).
- **Manba:** SHvB YO'NALISH 28 ("testRetake, testHistory") + vizyon yo'n.28 (qayta-test); qayta-urinish soni granular → A-default 2
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Coordination, AI

### EP-LMS-009 · O'tish bali (necha foiz = o'tdi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Kurs turiga qarab — xavfsizlik/TX kursi 100%, oddiy bilim kursi 60-80% (HR/Settings sozlaydi); master-data sifatida (B variant tavsiya — adolatli + xavfsizlik qattiq).
- **Manba:** SHvB YO'NALISH 28 ("testPassScore" maydon bor, qiymat egasi sozlovi); aniq foiz egasi tomonidan belgilanmagan
- **action:** CREATE
- **⤳ Ta'sir:** HR/Settings (master-data), QC (xavfsizlik chegarasi)

### EP-LMS-010 · Micro-modullar (qisqa o'quv bo'laklari)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har kurs micro-modullarga bo'linadi, har biri alohida o'tiladi va belgilanadi (smena oralig'ida o'tadi) (A).
- **Manba:** SHvB YO'NALISH 27 ("gsdTrainingModule") + AI (yo'riqnomadan micro-modul generatsiyasi, v2 Q40) + stub `/micro-modules` ulanishi
- **action:** CREATE
- **⤳ Ta'sir:** POS Monitor (sex tableti ekran), AI (modulga bo'lish)

### EP-LMS-011 · Micro-modul ketma-ketligi majburiymi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ketma-ket — keyingisi oldingisi tugamaguncha ochilmaydi (xavfsizlik/operatsiya uchun); kitob "Назорат варақаси кетма-кетликда бажарилади" deydi (A).
- **Manba:** kitob (НАЗОРАТ ВАРАҚАСИ "кетма-кетликда бажарилади"); granular tartib qoidasi egasi tomonidan aniq belgilanmagan
- **action:** UPDATE
- **⤳ Ta'sir:** LMS progress logikasi

### EP-LMS-012 · Kursni kim tayyorlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** O'quv bo'limi yaratadi → AI nazorat/tekshiruv → HR qaror → rahbar tasdiq (vizyon oqimi) (A).
- **Manba:** KARTALAR Q29 ("Darslik o'quv-bo'limi→AI→HR+rahbar = A") + kitob НО-14 (o'quv bo'limi) + vizyon bo'lim 9
- **action:** APPROVE
- **⤳ Ta'sir:** Org (o'quv bo'limi НО-14), AI, Coordination, HR

### EP-LMS-013 · AI kurs/o'qish nazorati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — AI o'qish holatini kuzatadi + PDF hisobot (xodim/rahbar/HR'ga); kim o'qidi/kim qoldi/tushundimi (A).
- **Manba:** vizyon bo'lim 9/10 (AI nazorat + hisobot) + ERP-SIFAT 30/70 (70% tahlil+AI) + KARTALAR Q30 (markaziy AI manbasi: LMS)
- **action:** AI
- **⤳ Ta'sir:** AI (markaziy), Reports, Director

### EP-LMS-014 · AI chatbot orqali o'qitish/savol berish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — AI chatbot darslikni tushuntiradi va kichik savollar beradi (telegram/ilovada); savodi past/mashinasiz ishchiga (A).
- **Manba:** vizyon bo'lim 10 ("Chatbot o'qitish") + KARTALAR Q16 (mashinasiz ЦКП = AI-chatbot kunlik) + kitob glossariy-uslubi
- **action:** AI
- **⤳ Ta'sir:** AI Integratsiya, Telegram bot, Notifications

### EP-LMS-015 · Razryad imtihoni LMS ichida
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — razryad imtihoni LMS test sifatida, o'tsa HR'ga signal + ichki sertifikat (A).
- **Manba:** KARTALAR Q8 ("Razryad har kartada → LMS imtihon") + Q10 (imtihon→HR+rahbar) + Q13 (o'zgarsa sertifikat) + vizyon bo'lim 6
- **action:** CREATE
- **⤳ Ta'sir:** HR (razryad), Payroll (razryad→oylik), Coordination (tasdiq)

### EP-LMS-016 · Razryad imtihonining 3 oylik oralig'i
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 3 oy — standart, tizim oxirgi imtihondan 3 oy o'tmaguncha yangisini ochmaydi (xodim o'zi murojaat qiladi) (A).
- **Manba:** KARTALAR Q11 ("Imtihon min 3 oy = A; 2 imtihon orasi ≥3 oy, xodim o'zi murojaat") + vizyon bo'lim 6
- **action:** CRON
- **⤳ Ta'sir:** HR, LMS

### EP-LMS-017 · Razryad o'sishi avtomatikmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Tasdiq bilan — test o'tsa ham, razryad faqat HR + yuqori rahbar tasdig'idan keyin ko'tariladi (avtomatik EMAS) (A).
- **Manba:** KARTALAR Q10 ("Razryad o'sishi imtihon→HR+rahbar tasdiq = A") + vizyon bo'lim 6
- **action:** APPROVE
- **⤳ Ta'sir:** HR, Coordination (tasdiq), Payroll

### EP-LMS-018 · Ichki sertifikat berish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — avtomatik PDF sertifikat (kurs nomi, sana, razryad, raqam) + arxivga saqlanadi (A).
- **Manba:** KARTALAR Q13 ("O'zgarsa HR hujjat+ichki sertifikat majburiy = A") + BARCHA_JAVOBLAR Q170 (sertifikatlar HR bilan = Hammasi) + vizyon bo'lim 6
- **action:** CREATE
- **⤳ Ta'sir:** CC/Hujjat (arxiv), HR

### EP-LMS-019 · Sertifikatning amal qilish muddati (qayta-sertifikatlash)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Muddatli — masalan 1 yil, muddat tugashidan oldin qayta-test eslatmasi keladi (xavfsizlik/reglament bilimi eskiradi) (A); aniq muddat HR sozlovi.
- **Manba:** vizyon (davriy qayta-test mantig'i) + v2 Q52 (davriy qayta-tasdiq); aniq muddat egasi tomonidan belgilanmagan
- **action:** CRON
- **⤳ Ta'sir:** Notifications (eslatma), HR

### EP-LMS-020 · Kaizen taklif kiritish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, to'liq — taklif kiritish + holat (yangi/ko'rilmoqda/qabul/rad) + javob xodimga (`kaizen_suggestions` jadval bor) (A).
- **Manba:** SHvB YO'NALISH 34 ("kaizen-idea.entity: status, KaizenBoard: taklif/ko'rilayotgan/amalga oshirilgan") + vizyon yo'n.34
- **action:** CREATE
- **⤳ Ta'sir:** AI, HR, Coordination

### EP-LMS-021 · Kaizen uchun rasmiy PDCA tsikli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq PDCA — har taklif 4 bosqichdan (Reja-Bajar-Tekshir-Harakat) o'tadi, mas'ul + muddat + natija qayd qilinadi (A).
- **Manba:** SHvB YO'NALISH 34 ("pdcaCycle, plan, do, check, act"; kaizen.service: create/review/implement/measureImpact)
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (mas'ul/muddat), AI (ta'sir o'lchovi)

### EP-LMS-022 · Kaizen rag'bati (mukofot)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ha — qabul qilingan kaizen kartaning bonus tizimiga ulanadi (HR/rahbar belgilaydi) (A); aniq bonus shkalasi egasi sozlovi.
- **Manba:** SHvB YO'NALISH 34 ("kaizenImpact") + karta-model bo'lim 7 (bonus tizimi); aniq rag'bat miqdori belgilanmagan
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll (bonus), HR, Org-karta

### EP-LMS-023 · Kurs holati ro'yxati (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Tayinlandi → Boshlandi → Tugatildi → Muddati o'tdi → Yiqildi (to'liq, real holat) (A).
- **Manba:** `status-catalog-2026-06-07.md` (master-data status ro'yxati standartlashtirish) + ERP-SIFAT (modullararo bitta haqiqat)
- **action:** CREATE
- **⤳ Ta'sir:** Reports (rang/foiz), barcha LMS ekran

### EP-LMS-024 · Video darslik va ko'rilganlik nazorati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — video qancha ko'rilgani kuzatiladi, oxirigacha ko'rmasa "tugatildi" bo'lmaydi (stub `/video-progress` ulanadi) (A).
- **Manba:** BARCHA_JAVOBLAR Q197 ("Majburiy: ko'rmasdan ishlatib bo'lmaydi") + KARTALAR Q7 (papka: video) + ERP-SIFAT 7 (avtomatlashtirish)
- **action:** UPDATE
- **⤳ Ta'sir:** POS Monitor, Storage (video)

### EP-LMS-025 · Lavozim papkasi (position folder) bilan bog'lanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har karta papkasida darslik+video+test bir joyda, xodim shu yerdan o'qiydi (papkaning 6-bo'limi = Ta'lim → LMS) (A).
- **Manba:** BARCHA_JAVOBLAR Q32 ("Har lavozim uchun ERP virtual papka: hujjatlar, video, testlar") + KARTALAR Q7 (6-bo'lim ta'lim) + SHvB YO'NALISH (papka 6-bo'lim → LMS)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (lavozim papkasi), HR

### EP-LMS-026 · O'qish kim majburiyligini belgilaydi (majburiy vs ixtiyoriy)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Kartada belgilanadi — HR har karta uchun qaysi kurs majburiy/ixtiyoriy ekanini kartada sozlaydi (`is_mandatory` ustuni bor) (A).
- **Manba:** SHvB YO'NALISH 27 ("mandatoryCourse, optionalCourse; course.entity ga is_mandatory field") + KARTALAR Q28 (kartaga biriktirish)
- **action:** UPDATE
- **⤳ Ta'sir:** Org-karta, Payroll (majburiy→oylik-gate)

### EP-LMS-027 · O'qish davomati 3-kun blokiga ta'sir qiladimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Faqat eslatma — o'qish tashlansa AI eslatadi; profil bloki davomat (3-kun yo'qlik) bilan bog'liq, o'qish kursi bilan emas — o'qish kechikishi alohida oylik-gate orqali boshqariladi (A).
- **Manba:** vizyon bo'lim 10 (3-kun davomat bloki) — bu davomat bloki, o'qish-kechikish EP-LMS-002/007 oylik-gate orqali; granular bog'lanish egasi tomonidan aniq belgilanmagan
- **action:** EVENT
- **⤳ Ta'sir:** HR (davomat ayri), Notifications

### EP-LMS-028 · Yangi reglament chiqqanda kimni qamrab oladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Kartaga bog'lab — reglament qaysi kartalarga tegishli bo'lsa, faqat o'sha xodimlarga test tushadi (A).
- **Manba:** SHvB YO'NALISH 28 ("Reglament yangilanganda: tegishli xodimlar qayta test topshiradi") + karta-model (kartaga bog'lash)
- **action:** EVENT
- **⤳ Ta'sir:** Director (reglament tegishliligi), Org-karta, Notifications

### EP-LMS-029 · O'quv hisoboti va dashboard
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — bo'lim/karta kesimida tugatish foizi + orqadagilar ro'yxati + AI tahlil; HR dashboard mini-widget (A).
- **Manba:** SHvB YO'NALISH 27 ("LMSDashboard: kurs bo'yicha progress, eng ko'p kechikkan kurslar; HRDashboard mini widget: tugallanmagan majburiy kurslar soni") + ERP-SIFAT 30/70
- **action:** READ
- **⤳ Ta'sir:** Reports, Director, HR dashboard, AI

### EP-LMS-030 · Onboarding (90 kun) o'qish rejasi bilan bog'lanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — onboarding bosqichlari LMS kurslari bilan bog'lanadi, mentor o'qishni kuzatadi (A).
- **Manba:** SHvB YO'NALISH 27 ("onboardingCourse") + BARCHA_JAVOBLAR Q14/Q169 (onboarding milestone) + EP-HR-001/002 (onboarding reja kartaga)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding), Mentorlik, Org-karta

---

## II QISM — v2 (kitob-grounded, 55 savol) — EP-LMS-031..085

### EP-LMS-031 · "Nazorat varaqasi" raqamli artefakt sifatida
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har kartaga "Nazorat varaqasi" obyekti: FIO + sana + mavzular ro'yxati + har biriga raqamli tasdiq (kitob struktura aynan ko'chiriladi); imzo o'rniga raqamli tasdiq tugmasi (vaqt+xodim qayd) — A1 (A).
- **Manba:** kitob (`ЎҚУВ ЖАРАЁНИНИНГ НАЗОРАТ ВАРАҚАСИ` — FIO/sana/mavzu-mavzu тасдиқ) + BARCHA_JAVOBLAR Q75 ("erp tizimini shu asosda qurish") + Q71 (LMS integratsiya)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding hujjati), Org-karta (har karta o'z varaqasi)

### EP-LMS-032 · Ikki xil nazorat varaqasi — Lavozim + Ishga xos
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, ikkita — har kartada 2 varaqa: "Lavozim yo'riqnomasi" (umumiy 12 mavzu) + "Ishga xos yo'riqnoma" (amaliy), ikkalasi alohida tugatiladi (A).
- **Manba:** kitob (ЛАВОЗИМ ЙЎРИҚНОМАСИ БЎЙИЧА + ЛАВОЗИМГА ХОС ikkita varaqa) + Q75
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (2 varaqa atributi)

### EP-LMS-033 · 12 universal mavzu shabloni
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — yangi kurs ochilganda 12 mavzu bo'sh qolip bo'lib chiqadi (maqsad, orgsxema joylashuv, malaka talablari, ish joyi/vositalar, umumiy vazifalar, lavozimga xos vazifalar, ЦКП, ko'p uchraydigan xatolar, muvaffaqiyatli harakatlar, huquqlar, javobgarlik, statistik ko'rsatkichlar), o'quv bo'limi faqat kontentni to'ldiradi (A).
- **Manba:** kitob ("12 та мавзу" aniq ro'yxat + "мақсадимиз мазкур 12 та мавзу бўйича ... тушунча шакллантириш") + Q75
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ЦКП/malaka talablari kartadan), HR (statistik ko'rsatkichlar=KPI), AI (12-qolipdan generatsiya)

### EP-LMS-034 · Mavzu-mavzu tasdiq ("o'qib chiqqaningizni tasdiqlang")
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har mavzu yonida tasdiq, progress mavzular bo'yicha hisoblanadi (masalan 7/12) (A).
- **Manba:** kitob ("___ ўқиб чиққанингизни тасдиқланг" har 12 mavzuga alohida qator)
- **action:** UPDATE
- **⤳ Ta'sir:** LMS progress, Nazorat varaqasi

### EP-LMS-035 · Har mavzu oxiridagi vaziyat-savol (А/Б/В + izohlang)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, ikki qismli — har savol: variant tanlash (avto-baholanadi) + ochiq izoh (AI birlamchi baho + rahbar tasdiq — A1) (A).
- **Manba:** kitob ("А)... Б)... В)... Танловингизни изоҳланг" — ЯКУНИЙ ТОПШИРИҚЛАР format) + ERP-SIFAT 30/70 (AI tahlil)
- **action:** CREATE
- **⤳ Ta'sir:** AI (izoh baholash), Coordination (rahbar tasdiq)

### EP-LMS-036 · "Сборник упражнений" (amaliy mashqlar) alohida bo'lim
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har kursda ayrim "Amaliy mashqlar" bloki (ochiq javob, murabbiy baholaydi); nazorat varaqasi="o'qidingmi", mashqlar="qo'llay olasanmi" (A).
- **Manba:** kitob (Сборник упражнений — nazorat varaqasidan alohida ochiq-javobli mashqlar)
- **action:** CREATE
- **⤳ Ta'sir:** Murabbiy baholash, LMS test banki

### EP-LMS-037 · Glossariy (lug'at) har kursga + matn ichida atama izohi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har kursning lug'ati + matnda atama bosilganda izoh chiqadi (kitob uslubi) (A).
- **Manba:** kitob ("ГЛОССАРИЙ (ЛУҒАТ)" har material oxirida + "атаманинг маъносига ишонч ҳосил қилмаса ... глоссарийга мурожаат қилиши шарт")
- **action:** CREATE
- **⤳ Ta'sir:** AI chatbot (lug'atdan tushuntirish)

### EP-LMS-038 · Mustaqil ishga qo'yish tartibi — bosqichli buyruq zanjiri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha, to'liq workflow — har bosqich (mas'ul + vaqt) tizimda kuzatiladi, oldingisi tugamasa keyingisi ochilmaydi: suhbat(НО-1) → РД-4 lavozim aniqlash+murabbiy+muddat → TX yo'riqnoma → buyruq → o'quv bo'limi → ish joyida instruktaj → 2 oy amaliy → imtihon → yozma xulosa → mustaqil ishga ruxsat (A).
- **Manba:** kitob ("Ходимни мустақил иш фаолиятига қўйиш тартиби" — aniq bosqich+mas'ul+vaqt jadvali) + BARCHA_JAVOBLAR Q71 (LMS integratsiya)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding), Org (РД-4), MES (ruxsatsiz mashina yo'q)

### EP-LMS-039 · РД-4 lavozim aniqlash suhbati onboarding boshida
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — onboardingda "РД-4 suhbati" qadami: karta + murabbiy + o'qish muddati + sinov muddati shu yerda kiritiladi (A).
- **Manba:** kitob ("РД-4 га лавазимини аниқлаш учун сухбатга юбориш. РД-4 қарори, Мураббий ... ўқиш муддати ва синов муддати")
- **action:** CREATE
- **⤳ Ta'sir:** Org (РД-4 = uchastka rahbari roli), HR

### EP-LMS-040 · 2 oylik amaliy o'qish muddati taymeri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — o'qish boshlanish sanasidan 2 oy sanaladi, tugashga yaqin murabbiy+РД-4 ga imtihon eslatmasi (A).
- **Manba:** kitob ("Янги ходим учун амалий машғулотлар — 2 ой")
- **action:** CRON
- **⤳ Ta'sir:** Notifications (imtihon eslatma), HR

### EP-LMS-041 · Mustaqil ishga o'tishdan oldin ikki imtihon (nazariy + amaliy)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — ikkalasi ham o'tilishi shart: nazariy (tizim testi) + amaliy (murabbiy/РД-4 baholaydi) (A).
- **Manba:** kitob ("Мустақил ишлашга ўтишдан олдин амалий ва назарий имтихонлардан ўтиш")
- **action:** CREATE
- **⤳ Ta'sir:** HR, Murabbiy, MES (gate)

### EP-LMS-042 · РД-4 ning yozma xulosasi ("yozma xulosa")
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — imtihondan keyin РД-4 (uchastka rahbari) yozma xulosa + tasdiq, shundan keyingina "mustaqil ishga ruxsat" (A).
- **Manba:** kitob ("Мустақил иш бошлаш учун участка рахбарининг ёзма хулосаси — РД-4")
- **action:** APPROVE
- **⤳ Ta'sir:** Org (РД-4), HR (mas'uliyatli qaror)

### EP-LMS-043 · Mustaqil ishga ruxsat = buyruq bilan rasmiylashtirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — barcha bosqich tugagach tizim buyruq loyihasini chiqaradi (HR tasdiqlaydi) + razryad/oylik faollashadi (A).
- **Manba:** kitob ("Буйруқ чиқариш (лавозим, унвон, фамилия ... устози, ўқиш даври)" + "Мустақил ишлашга рухсат") + KARTALAR Q3 (kartaga bog'lansa oylik+ERP)
- **action:** CREATE
- **⤳ Ta'sir:** HR (buyruq arxivi), Payroll (to'liq oylik), Org-karta (rasman bog'lanish)

### EP-LMS-044 · Texnika xavfsizligi (TX instruktaj) o'qishga kirish sharti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — TX instruktaji birinchi majburiy modul, tasdiqlanmaguncha boshqa o'qish/MES ochilmaydi (A).
- **Manba:** kitob ("Техника хавфсизлиги бўйича йўриқномадан ўтиш — Менеджер секции ТХ, 20 минут" — buyruqdan oldin) + EP-LMS-004 (MES gate)
- **action:** EVENT
- **⤳ Ta'sir:** MES (TX'siz mashina yo'q), HR (xavfsizlik jurnali)

### EP-LMS-045 · Ish joyida birinchi instruktaj qayd qilinishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "ish joyida instruktaj" qadami (mas'ul: РД-4/sex menejeri, sana, tasdiq) (A).
- **Manba:** kitob ("Иш жойида биринчи инструктаждан ўтказиш — РД-4, секция менеджери, 30 минут")
- **action:** UPDATE
- **⤳ Ta'sir:** Org (РД-4/sex menejeri), HR

### EP-LMS-046 · ЦКП har kursda, kartadan keladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — kursning ЦКП mavzusi kartaning ЦКП maydonidan avtomatik keladi (yagona manba) (A).
- **Manba:** kitob ("Лавозимнинг ЦКП си" 12-mavzudan biri) + KARTALAR Q14 (GSD/ЦКП kartaga) + Q40 (bitta DDL/yagona manba)
- **action:** READ
- **⤳ Ta'sir:** Org-karta (ЦКП atribut), AI (xodim-karta mosligi)

### EP-LMS-047 · "Ko'p uchraydigan xatolar" bloki + jonli yangilanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha + jonli — kursda "ko'p uchraydigan xatolar" bloki, sifat/MES'dan kelgan real xatolar bilan boyitiladi (A).
- **Manba:** kitob ("Кўп учрайдиган хатолар" 12-mavzudan biri) + ERP-SIFAT 30/70 (AI tahlil) + Sifat moduli (brak/reklamatsiya)
- **action:** AI
- **⤳ Ta'sir:** Sifat/QC (brak sabablari → xatolar bloki), AI

### EP-LMS-048 · "Muvaffaqiyatli harakatlar" bloki + blanka
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "muvaffaqiyatli harakatlar" blankasi: rahbar real misol qo'shadi, kursga ulanadi (A).
- **Manba:** kitob ("Мувафаққиятли харакатлар" 12-mavzudan biri + rahbar muntazam to'ldiradigan blanka)
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (rahbar kiritadi), Org-karta

### EP-LMS-049 · "Lavozim bo'yicha malaka talablari" kursda va kartada
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — karta malaka talablari → kurs mavzulari shu talablardan kelib chiqadi (talab = o'rganish maqsadi) (A).
- **Manba:** kitob ("Лавозим бўйича малака талаблари" 12-mavzudan biri; misol: o'rta-maxsus/oliy, qog'oz/gofra turlari) + karta-model (malaka talablari atribut)
- **action:** READ
- **⤳ Ta'sir:** Org-karta (malaka talablari), Razryad (talab→razryad)

### EP-LMS-050 · Konkret domen-bilim modullari — "qog'oz turlari", "gofra turlari"
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — domen-bilim modullari material/mahsulot katalogiga bog'lanadi (gofra turi o'zgarsa kurs ham yangilanadi) (A).
- **Manba:** kitob ("Қоғоз турларини билиши керак", "Гофра турларини билиши керак" — ichki logistika kartasi) + KARTALAR Q40 (yagona master-data)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor/Material katalogi (gofra/qog'oz turlari = master data)

### EP-LMS-051 · "Statistik ko'rsatkichlar" mavzusi = karta KPI
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "statistik ko'rsatkichlar" mavzusi kartaning KPI/ЦКП o'lchovlaridan keladi (xodim qanday baholanishini biladi) (A).
- **Manba:** kitob ("Статистик кўрсаткичлар" 12-mavzudan biri) + KARTALAR Q14 (GSD o'lchov)
- **action:** READ
- **⤳ Ta'sir:** HR (KPI), Org-karta (statistik ko'rsatkich atribut)

### EP-LMS-052 · "Lavozim huquqlari" va "Lavozim javobgarligi" o'qitilishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "huquqlar" va "javobgarlik" alohida mavzular, kartadan keladi, test bilan tekshiriladi (A).
- **Manba:** kitob ("Хуқуқларингиз" + "Жавобгарлик" 12-mavzudan ikkitasi, alohida тасдиқ qatorlari bor)
- **action:** READ
- **⤳ Ta'sir:** Org-karta (huquq/javobgarlik atributlari)

### EP-LMS-053 · "Ish joyi va lavozim vositalari" — jihozlar katalogi bilan bog'lanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "ish joyi vositalari" mavzusi aktivlar/jihozlar katalogiga bog'lanadi (kartaning "kerakli jihozlar"i) (A).
- **Manba:** kitob ("Иш жойи ва лавозим воситалари" 12-mavzudan biri) + memory (karta-model "kerakli jihozlar" hozir YO'Q → shu yerga ulanadi)
- **action:** CREATE
- **⤳ Ta'sir:** Aktivlar/Jihozlar moduli, Org-karta ("kerakli jihozlar")

### EP-LMS-054 · "Orgsxemadagi joylashuvi" mavzusi org-chartdan keladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — mavzu jonli org-chartdan keladi (xodim o'z kartasini, rahbarini, hamkor bo'limlarni ko'radi) (A).
- **Manba:** kitob ("Оргсхемадаги жойлашуви" 2-mavzu + "изоляцияда олиб бориши ... ахборот узилишига олиб келади") + Vysotskiy-7 org-model
- **action:** READ
- **⤳ Ta'sir:** Org (Vysotskiy-7 daraxti), Coordination (gorizontal hamkorlik)

### EP-LMS-055 · 7 departament tuzilmasi umumiy kursda
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — barcha yangi xodimga majburiy "Korxona tuzilmasi (7 departament)" kursi (A).
- **Manba:** kitob (7 departament sanaladi: Ходимлар/Савдо/Бухгалтерия/Ишлаб чиқариш/ИЧ+сифат/Ривожлантириш/Администрация) + Vysotskiy-7 model + EP-LMS-068 (qatlamlash)
- **action:** CREATE
- **⤳ Ta'sir:** Org (departament ierarxiyasi)

### EP-LMS-056 · O'quv bo'limi (НО-14) "o'quv dasturi hajmini aniqlash" roli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — o'quv bo'limi har yangi xodim/karta uchun o'quv dasturi hajmini belgilaydi (qaysi kurslar, qancha vaqt) (A).
- **Manba:** kitob ("Ўқув дастурининг хажмини аниқлаш учун ўқув бўлимига йўналтириш — НО-1, НО-14") + KARTALAR Q29 (o'quv bo'limi yozadi)
- **action:** CREATE
- **⤳ Ta'sir:** Org (o'quv bo'limi=НО-14), HR (o'quv rejasi)

### EP-LMS-057 · Murabbiyning o'zi malakali ekanini tekshirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ha — murabbiy bo'lish uchun min. razryad + o'sha karta sertifikati + (ixtiyoriy) "murabbiylik" moduli shart (A); aniq razryad chegarasi HR sozlovi.
- **Manba:** karta-model (razryad/sertifikat mavjud) + sifat mantig'i; egasi murabbiy-malaka qoidasini aniq belgilamagan
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Razryad

### EP-LMS-058 · Murabbiy bo'lmaganda (kichik bo'lim) — zaxira tartib
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Zaxira tartib — murabbiy yo'q bo'lsa yuqori rahbar yoki yondosh karta egasi murabbiy bo'ladi; AI nazariyni qoplaydi (A).
- **Manba:** karta-model (vertikal yuqori rahbar) + AI-chatbot (EP-LMS-014); granular zaxira qoidasi egasi tomonidan aniq belgilanmagan
- **action:** UPDATE
- **⤳ Ta'sir:** Org (vertikal), AI

### EP-LMS-059 · Murabbiy shogird progressini real vaqtda ko'rishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — murabbiyda "mening shogirdlarim" paneli (har birining mavzu/test holati) (A).
- **Manba:** BARCHA_JAVOBLAR Q72 (mentor amaliy topshiriq kuzatadi) + kitob (murabbiy mas'ul) + ERP-SIFAT 30/70 (tahlil panel)
- **action:** READ
- **⤳ Ta'sir:** Mentorlik panel, HR

### EP-LMS-060 · Yakuniy topshiriqlar — bo'lim oxiridagi yig'ma test
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har bo'lim oxirida yakuniy topshiriqlar bloki (o'tilmasa keyingi bo'lim ochilmaydi) (A).
- **Manba:** kitob ("БИРИНЧИ/ИККИНЧИ БЎЛИМ БЎЙИЧА ЯКУНИЙ ТОПШИРИҚЛАР" — har bo'lim oxirida yig'ma savol+topshiriq)
- **action:** CREATE
- **⤳ Ta'sir:** LMS progress (bo'lim-gate)

### EP-LMS-061 · Sinov muddati natijasi LMS bilan bog'liqligi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — sinov muddati yakunida LMS natijasi (imtihon + murabbiy bahosi) qaror uchun yig'iladi (A).
- **Manba:** kitob (buyruqda "синов муддати" + imtihon natijasi) + BARCHA_JAVOBLAR Q91 (sinov: baholash+avtomatik o'tish) + EP-HR-003
- **action:** EVENT
- **⤳ Ta'sir:** HR (probatsiya qarori), AI (xodim-karta mosligi)

### EP-LMS-062 · Amaliy imtihonni baholash varaqasi (murabbiy/РД-4)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — amaliy imtihon baholash varaqasi: mezonlar + ball + baholovchi izohi (murabbiy/РД-4) (A).
- **Manba:** kitob (amaliy imtihon РД-4 baholaydi) + BARCHA_JAVOBLAR Q175 ("Task+Rubrika+Real vaziyat") + EP-LMS-041
- **action:** CREATE
- **⤳ Ta'sir:** Murabbiy/РД-4 baholash, HR

### EP-LMS-063 · Lavozim o'zgarganda yangi nazorat varaqasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — yangi kartaga o'tganda o'sha kartaning nazorat varaqasi avto-tayinlanadi (eski yopiladi, arxivda qoladi) (A).
- **Manba:** kitob (har lavozimning o'z yo'riqnoma+varaqasi) + KARTALAR Q28 (darslik kartaga) + EP-LMS-003 (avto-tayinlash)
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (lavozim ko'chishi), HR (transfer)

### EP-LMS-064 · Nazorat varaqasini kitob formatida PDF eksport
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — tugatilgan varaqa kitob formatida PDF (FIO, tashkilot, sanalar, mavzu-tasdiqlar, imtihon natijasi) (A).
- **Manba:** kitob (НАЗОРАТ ВАРАҚАСИ qog'oz formati) + ERP-SIFAT (immutable hujjat/audit) + EP-LMS-018 (PDF sertifikat)
- **action:** EXPORT
- **⤳ Ta'sir:** HR (shaxsiy ish papkasi), CC/Hujjat

### EP-LMS-065 · Lavozimga xos yo'riqnoma o'zgarsa — qayta-o'qish (kartadagi hammaga)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — yo'riqnoma versiyasi o'zgarsa, o'sha kartadagi xodimlarga "yangilangan qism" qayta-o'qish + qisqa test tushadi (A).
- **Manba:** SHvB YO'NALISH 28 ("Reglament yangilanganda: tegishli xodimlar qayta test") + kitob (ishga xos yo'riqnoma) + EP-LMS-028
- **action:** EVENT
- **⤳ Ta'sir:** Hujjat boshqaruvi (versiya), MES (eski usul blok), Notifications

### EP-LMS-066 · ERP/CRM tizimida ishlash ko'nikmasi alohida modul
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "ERP tizimida ishlash" majburiy modul, kartaga qarab kerakli ekranlar (kanban, status, kartochka) o'rgatiladi (A).
- **Manba:** kitob (dizayn rahbari yo'riqnomasi Bitrix24 ishlash bloki → bizning ERP) + BARCHA_JAVOBLAR Q197 ("LMS da video qo'llanma + majburiy: ko'rmasdan ishlatib bo'lmaydi")
- **action:** CREATE
- **⤳ Ta'sir:** Kanban, barcha modul (tizim savodxonligi)

### EP-LMS-067 · Onboarding hujjatlar to'plami (ariza, buyruq, TX, varaqa, xulosa)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har yangi xodim onboardingida hujjatlar checklist + har biri tizimda fayl/qayd sifatida (ariza, buyruq, TX instruktaj, nazorat varaqasi, yozma xulosa, mustaqil ish buyrug'i) (A).
- **Manba:** kitob (tartib bir nechta hujjat keltirib chiqaradi: ariza/buyruq/TX/varaqa/xulosa) + ERP-SIFAT (immutable hujjat)
- **action:** CREATE
- **⤳ Ta'sir:** HR (shaxsiy ish papkasi)

### EP-LMS-068 · Departament/sex bo'yicha o'quv qatlamlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Uch qatlam — "umumiy korxona" + "departament/sex" + "lavozim-karta" kurslari qatlamlanadi (A).
- **Manba:** kitob (7 departament + sex/sektsiya) + Vysotskiy-7 org-model + EP-LMS-055 (umumiy korxona kursi)
- **action:** CREATE
- **⤳ Ta'sir:** Org (departament/sex ierarxiyasi)

### EP-LMS-069 · O'qish eslatmasi kanali — Telegram bot
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Telegram bot + ilova ichi — asosiy Telegram bot orqali + ilovada belgi (operator ilovani har kuni ochmaydi) (A).
- **Manba:** BARCHA_JAVOBLAR Q197 ("Bot orqali xabar + link") + KARTALAR Q14/Q16 (telegram bot so'rov) + memory (telegram-bots cron mavjud)
- **action:** CRON
- **⤳ Ta'sir:** Telegram bot integratsiyasi, Notifications

### EP-LMS-070 · "Materialni to'liq o'zlashtirish" o'lchovi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Uch mezon — nazariy test (o'tish bali) + amaliy imtihon (murabbiy) + mavzu-tasdiqlar 100% — uchalasi (A).
- **Manba:** kitob ("материални тўлиқ ўзлаштирилишини таъминлаш" maqsadi) + EP-LMS-034/036/041 (mavzu-tasdiq + amaliy + nazariy)
- **action:** READ
- **⤳ Ta'sir:** LMS tugatish logikasi, Payroll (oylik-gate manbasi)

### EP-LMS-071 · O'quv tarixi arxivi (xodim ketsa ham, karta varaqasi qoladi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — o'quv tarixi xodim profilida doimiy arxiv + nazorat varaqasi karta tarkibida qoladi (voris o'sha varaqani oladi) (A).
- **Manba:** KARTALAR Q28 ("darslik kartaga") + ERP-SIFAT (7 yil retention, audit-log) + EP-LMS-001/063
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta ("darslik kartaga" vizyoni), HR (arxiv)

### EP-LMS-072 · Davriy qayta-tasdiq (yo'riqnoma o'zgarmasa ham)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ha — yiliga bir marta lavozim varaqasini qayta tasdiqlash (qisqartirilgan test bilan) (A); aniq davr (yil/chorak) egasi sozlovi.
- **Manba:** ERP-SIFAT (davriy nazorat) + EP-LMS-019 (qayta-sertifikatlash); aniq davriylik egasi tomonidan belgilanmagan
- **action:** CRON
- **⤳ Ta'sir:** Notifications, HR

### EP-LMS-073 · Tashkiliy siyosat (ОРГПОЛИТИКА) hujjatlari ham testga bog'lanadimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — tashkiliy siyosat hujjatlari "umumiy reglament" sifatida tegishli xodimlarga o'qish + tasdiq sifatida tushadi (A).
- **Manba:** kitob (ОРГПОЛИТИКА / ТАШКИЛИЙ СИЁСАТ hujjatlari mavjud) + SHvB YO'NALISH 28 (reglament testlari) + EP-LMS-005
- **action:** EVENT
- **⤳ Ta'sir:** Hujjat boshqaruvi, HR

### EP-LMS-074 · Tijorat siri / maxfiylik moduli majburiy
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "tijorat siri va maxfiylik" majburiy modul + yozma tasdiq (NDA o'rnida iz qoladi) (A).
- **Manba:** kitob ("Корхона тижорат сирларини ошкор этганлик учун ... жиноят кодексига кўра жавобгар" + dizayn-fayllar himoyasi vazifasi) + ERP-SIFAT 5 (data shifrlangan/RBAC)
- **action:** CREATE
- **⤳ Ta'sir:** HR (huquqiy himoya), Xavfsizlik/Security

### EP-LMS-075 · Tashqi malaka/sertifikatni ichki kurs o'rniga hisoblash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — tashqi sertifikat/diplom yuklanadi + HR tasdiqlaydi → tegishli ichki kurs/malaka-talab "qondirilgan" hisoblanadi (TX/xavfsizlikdan istisno yo'q) (A).
- **Manba:** BARCHA_JAVOBLAR Q176 (tashqi ta'lim: Ariza+Shartnoma+Natija) + Q177 (tugatgach hammasi) + kitob (malaka talablari "o'rta-maxsus/oliy")
- **action:** APPROVE
- **⤳ Ta'sir:** HR (malaka tarixi), Razryad

### EP-LMS-076 · Replication testi — rahbar dars yaratadi, xodimlar o'qiydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — LMS ichida modul sifatida: rahbar o'z yutuqlarini/metodologiyasini dars qilib yaratadi, jamoa o'qiydi (Replication metodologiyasi) (A).
- **Manba:** BARCHA_JAVOBLAR Q149 ("Replication testi → LMS ichida modul: rahbar dars yaratadi, xodimlar o'qiydi") — *EP-LMS-012 oqimidan farqli: bu rahbar-muallif kanali*
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (rahbar muallif), LMS kontent

### EP-LMS-077 · Leadership / Origin liderlik testi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — "liderlik salohiyati" baholash testi: yillik + zaxira (vorislik) + lavozim o'zgarishi holatlarida (A).
- **Manba:** BARCHA_JAVOBLAR Q148 ("liderlik salohiyati testi = Hammasi: yillik + zaxira + lavozim o'zgarish"; Origin Liderlik testi)
- **action:** CREATE
- **⤳ Ta'sir:** HR (vorislik/zaxira), Org-karta (rahbar kartalari), AI

### EP-LMS-078 · "Ishdagi vaziyat" interaktiv simulyatsiya rejimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ha — vaziyat-mashqlar interaktiv (qaror tanla → oqibatni ko'r → izoh); operator xavfsiz muhitda xato qilib o'rganadi (A); to'liq simulyatsiya ko'lami egasi prioriteti.
- **Manba:** kitob ("Ишдаги вазият: ..." mashqlar) + ERP-SIFAT 30/70 (AI/tahlil); interaktiv simulyatsiya ko'lami egasi tomonidan aniq belgilanmagan
- **action:** CREATE
- **⤳ Ta'sir:** AI (oqibat modellashtirish), LMS

### EP-LMS-079 · Imtihon savollarini kim tuzadi va tasdiqlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** O'quv bo'limi tuzadi (AI yordamida) → rahbar/HR tasdiq (A).
- **Manba:** KARTALAR Q29 (o'quv bo'limi→AI→HR+rahbar) + kitob (НО-14 o'quv bo'limi) + EP-LMS-012
- **action:** APPROVE
- **⤳ Ta'sir:** AI (yo'riqnomadan test generatsiya), Coordination

### EP-LMS-080 · AI yo'riqnomadan avto test + glossariy + micro-modul generatsiyasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — AI yo'riqnomadan test/glossariy/micro-modul loyihasini chiqaradi, odam tasdiqlaydi (drafting) (A).
- **Manba:** BARCHA_JAVOBLAR Q75 ("erp tizimini shu asosda qurish" — yo'riqnoma matni tayyor) + ERP-SIFAT 30/70 + KARTALAR Q29/Q30 (AI)
- **action:** AI
- **⤳ Ta'sir:** AI Integratsiya moduli, O'quv bo'limi

### EP-LMS-081 · O'qish davomida savol berish (murabbiy/AI'ga)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har mavzuda "savol berish" tugmasi: AI birlamchi javob, murabbiy/rahbarga eskalatsiya (A).
- **Manba:** kitob (glossariy + murabbiy mas'ul) + EP-LMS-014 (AI chatbot) + ERP-SIFAT 7 (avtomatlashtirish)
- **action:** AI
- **⤳ Ta'sir:** AI chatbot, Mentorlik, Coordination

### EP-LMS-082 · Imtihon natijasi murabbiy reytingiga ta'siri
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** Ijobiy bog'lash — shogird muvaffaqiyati murabbiy reytingi/bonusiga qo'shiladi (salbiy jazo yo'q, demotivatsiya bo'lmasin) (A); aniq vazn HR sozlovi.
- **Manba:** kitob (murabbiy mas'ul) + karta-model (KPI/bonus); murabbiy-reyting bog'lanishi egasi tomonidan aniq belgilanmagan
- **action:** UPDATE
- **⤳ Ta'sir:** HR (murabbiy KPI), Payroll

### EP-LMS-083 · Kursga namuna fayl/rasm ilova qilish (texkarta, maket, podpisnoy)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har mavzuga namuna fayl/rasm ilova (to'g'ri va noto'g'ri misol) (A).
- **Manba:** kitob (texkarta, podpisnoy list, maket atamalari + glossariy) + BARCHA_JAVOBLAR Q32 (papka: hujjatlar/video)
- **action:** CREATE
- **⤳ Ta'sir:** Storage (fayl/rasm), Org-karta (papka)

### EP-LMS-084 · Ko'p kartali xodim o'quvi navbati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har karta alohida — birlamchi karta o'quvi birinchi (oylik unga bog'liq), qolganlar navbat bilan (A).
- **Manba:** KARTALAR Q4 ("1 xodim ko'p karta = A; oylik=kartalar yig'indisi") + Q2 (1 seat=1 oylik) + EP-LMS-002 (oylik-gate)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ko'p karta-xodim), Payroll

### EP-LMS-085 · O'qish qaysi qurilmada — sex tableti (POS Monitor) / telefon
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — telefon + sex tableti (POS Monitor)da o'qish; smena oralig'ida qisqa modul (operator kompyuter oldida o'tirmaydi) (A).
- **Manba:** KARTALAR Q16 (mashinasiz operator → AI-chatbot/mobil) + memory (POS Monitor = sex tablet) + EP-LMS-010 (micro-modul)
- **action:** READ
- **⤳ Ta'sir:** POS Monitor (sex tableti = o'quv ekrani ham), Mobile

---

## OCHIQ savollar ro'yxati (10 — egasi granular qarorini kutadi, A-default ishlamoqda)
EP-LMS-009 (o'tish bali %), 011 (micro-modul ketma-ketlik), 019 (sertifikat muddati), 022 (kaizen bonus miqdori), 027 (o'qish↔davomat blok), 057 (murabbiy malaka chegarasi), 058 (murabbiy zaxira tartib), 072 (davriy qayta-tasdiq davri), 078 (simulyatsiya ko'lami), 082 (murabbiy reyting vazni).

> **Eslatma:** v2 ning barcha 55 savoli kitob (`kitob-extracted/`) hujjatlaridan to'g'ridan-to'g'ri grounded — НАЗОРАТ ВАРАҚАСИ, 12-mavzu shabloni, glossariy, Сборник упражнений, ЯКУНИЙ ТОПШИРИҚЛАР, "мустақил иш фаолиятига қўйиш тартиби" zanjiri zavodda allaqachon QOG'OZDA mavjud → ERP aynan shuni raqamlashtiradi.

DONE: LMS — 85 (javoblangan 75, ochiq 10).
</content>
</invoke>
