# POS Monitor — QAROR XARITASI (Decision Map)

> Modul: **POS Monitor** (zavod ombori planshet ilovasi — kirim/chiqim/inventar/ichki ko'chirish). **Kassa EMAS** (pul → Finance).
> Manba savollar: v1 (`docs/audit/vision-questions/19-pos.md`, Q1–Q30) + v2 (`docs/audit/vision-questions-v2/19-pos.md`, Q31–Q82).
> Javob manbai (⭐⭐): `docs/audit/shvb-extracted/EUROPRINT_BARCHA_JAVOBLAR.md` — POS bo'limi 60 javob (Q1–Q60).
> Kod konvensiyasi: `EP-POS-###` (`docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` §B).

**XULOSA:** Jami 82 savol (v1=30, v2=52). ✅ JAVOBLANGAN **57** · 🔵 OCHIQ **25**.
BARCHA_JAVOBLAR'dagi 60 ta POS javobi v1'ning deyarli hammasini va v2'ning ko'pini bevosita yopadi. Ochiq qolganlar — asosan v2'ning kitob-grounded nozik qarorlari (poddon/tara, makulatura ombori, lab karantin chiqishi tasdig'i, norma-fakt anomaliya, davальческое material, freeze, til-uchinchi (kirill), GSD 3-ko'rsatkich) — bularga A-default tavsiya qo'yildi.

---

## I QISM — v1 SAVOLLARI (Q1–Q30 → EP-POS-001..030)

### EP-POS-001 · POS Monitor asosiy vazifasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Zavod ombori harakatlari (kirim/chiqim/inventar/ichki ko'chirish) — kassa Finance'da qoladi. Tayyor mahsulot (FG) ham shu POS tizimida boshqariladi; amortizatsiya/moliya → FI moduli. (v1-A + kengaytma)
- **Manba:** BARCHA_JAVOBLAR Q1 (ERP ichida modul), Q34 (FG POS'da), Q46 (POS faqat inventar kuzatadi)
- **action:** READ
- **⤳ Ta'sir:** Butun ombor zanjiri; Finance chegarasi

### EP-POS-002 · Ombor xodimi planshetda kim sifatida kiradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** ERP login (SSO/JWT) bilan kiradi, rol ERP'dan avto tortiladi — har harakat shaxsga bog'lanadi (v1-A varianti, shaxsiy login).
- **Manba:** BARCHA_JAVOBLAR Q2 (SSO), Q10 (ERP login, rol avto), Q11 (smena emas, faqat audit log)
- **action:** LOGIN
- **⤳ Ta'sir:** Audit log, javobgarlik, HR rol

### EP-POS-003 · Qaysi omborlar planshetda ko'rinadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Bo'lim asosida — faqat o'sha bo'lim xodimlari o'z ombori chiqimini qiladi; xodim bir necha bo'lim omboriga ega bo'lishi mumkin (HR sozlaydi). Qurilma→ombor qat'iy biriktirish emas, rol/bo'lim asosida ko'rinadi.
- **Manba:** BARCHA_JAVOBLAR Q12 (faqat o'sha bo'lim chiqim), Q13 (30+ bo'lim), Q14 (bir necha bo'lim, HR sozlaydi)
- **action:** READ
- **⤳ Ta'sir:** HR (ombor-rol mapping), 30+ bo'lim ombori

### EP-POS-004 · Kirim (priyomka) jarayoni qanday boshlanadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** EXTERNAL_IN 5 bosqichli oqim: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL. Yetkazib beruvchi/zakaz konteksti bilan boshlanadi; skan/AI kamera bilan. (v1-A/C ruhida)
- **Manba:** BARCHA_JAVOBLAR Q21 (EXTERNAL_IN 5 bosqich), Q30 (kirim avval karantinga), Q40 (inventar pasporti faqat EXTERNAL_IN)
- **action:** CREATE
- **⤳ Ta'sir:** MM (zakaz/narx), QC (karantin), GL

### EP-POS-005 · Chiqim (otpusk) sababi majburiymi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Sabab majburiy — harakat turi orqali ro'yxatdan: INTERNAL_ISSUE (bo'limga), EXTERNAL_OUT (tayyor mahsulot sotuvi), INTERNAL_TRANSFER (ko'chirish), DAMAGE (brak), INTERNAL_RETURN (qaytarish, sabab majburiy). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q22–Q26 (harakat turlari), Q24 (INTERNAL_RETURN sabab majburiy)
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot, GL-yozuv, QC (DAMAGE)

### EP-POS-006 · Barcode/QR skanerlash — material identifikatsiyasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Skaner asosiy, qo'lda qidirish zaxira. Ikki usul: dedicated scanner (USB/Bluetooth) + AI kamera (ZXing.js brauzerda, OpenCV server fallback). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q16 (ikkalasi: scanner + AI kamera), Q17 (ZXing.js + OpenCV), Q18 (topilmasa qo'lda qidirish)
- **action:** READ
- **⤳ Ta'sir:** AI kamera, MM (kartochka)

### EP-POS-007 · Material barcode'i qayerdan keladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Kirim paytida ERP o'z label'ini avto chop etadi (EXTERNAL_IN tasdiqlanganda) + qo'lda reprint. Format: ZPL/EPL/PDF. Standart barcode: EAN-13 + Code-128 (partiya uchun). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (EAN-13 + Code-128), Q19 (avto label EXTERNAL_IN + reprint, ZPL/EPL/PDF)
- **action:** CREATE
- **⤳ Ta'sir:** Printer, MM (barcode standarti)

### EP-POS-008 · Harakat tasdiqlash — bir yoki ikki bosqich
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Harakat turiga qarab: EXTERNAL_IN = 5 bosqich (karantin+QC+menejer); EXTERNAL_OUT = menejer+moliya+AI; INTERNAL_ISSUE = menejer 1 imzo; INTERNAL_RETURN = tasdiqsiz; bir xil tip TRANSFER = tezkor (tasdiqsiz). Muvozanat (v1-A).
- **Manba:** BARCHA_JAVOBLAR Q21–Q25 (har tip uchun tasdiq darajasi)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (tasdiqlovchi), Finance (EXTERNAL_OUT)

### EP-POS-009 · Tasdiqni kim beradi (karta-model bilan bog'liq)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ombor menejeri asosiy tasdiqlovchi (INTERNAL_ISSUE 1 imzo, TRANSFER boshqa tip), EXTERNAL_OUT'da +moliya. Bo'lim so'rovida: bo'lim menejeri tasdiq. Org-karta vertikali bilan uyg'unlashtiriladi.
- **Manba:** BARCHA_JAVOBLAR Q23 (ombor menejer), Q22 (EXTERNAL_OUT +moliya), Q50 (bo'lim menejer tasdiq)
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (manager_id), HR

### EP-POS-010 · Balans-guard — manfiy qoldiqni taqiqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Differensial: aktivlar → TO'LIQ BLOK (qoldiqdan ortiq chiqarib bo'lmaydi); iste'mol materiallar → OGOHLANTIRISH + ruxsat. (v1-A aktivga, v1-B iste'molga — material turiga qarab)
- **Manba:** BARCHA_JAVOBLAR Q38 (aktiv blok / iste'mol ogohlantirish+ruxsat)
- **action:** CREATE (guard)
- **⤳ Ta'sir:** Inventar aniqligi, GL

### EP-POS-011 · Balans-guard chegarasi — minimal qoldiq ogohlantirishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har materialga minimal qoldiq belgilanadi, pasayganda avto-ogohlantirish (AI rejalashtirish + ta'minot). AI to'liq yordamchi (EP-POS-019) bilan birlashadi. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q56 (ombor qoldiqlari hisoboti) + EP-POS-019/065 bilan bog'liq
- **action:** EVENT/AI
- **⤳ Ta'sir:** AI, MM (snabjeniye), Notifications

### EP-POS-012 · GL-koprik — harakat moliyaga qanday tushadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har harakatda avto GL-yozuv (Debit/Credit) — EXTERNAL_IN 5-bosqichida AI hisoblaydi. Real-time. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q43 (avto GL, AI hisoblaydi), Q21 (5-bosqich AI_GL), Q39 (real-time PostgreSQL)
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** Finance (entries), AI

### EP-POS-013 · GL-yozuv qaysi hisoblarga tushadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Harakat turi/sababiga qarab AI Debit/Credit hisoblaydi (chiqim sababi → tegishli hisob). 1C integratsiya yo'q — ERP moliya moduli yetarli; faqat ichki hisobot. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q43 (AI Debit/Credit), Q44 (1C yo'q), Q45 (ichki hisobot)
- **action:** AI/CREATE
- **⤳ Ta'sir:** Finance (CoA), AI

### EP-POS-014 · Materialni baholash usuli (kirimda narx)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** FIFO (partiya narxi bo'yicha). Valyuta — qaysi valyutada xarajat bo'lsa o'sha. (v1-B FIFO — egasi tavsiyadagi o'rtacha emas, FIFO tanlagan)
- **Manba:** BARCHA_JAVOBLAR Q35 (FIFO partiya narxi), Q36 (har qanday valyuta)
- **action:** CREATE
- **⤳ Ta'sir:** GL summasi, ombor qiymati

### EP-POS-015 · Inventar (sanab chiqish) jarayoni
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Planshetda skaner bilan sanash, tizim farqni avto ko'rsatadi. Tunda yoki dam olish kunida o'tkaziladi (ish to'xtamaydi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q52 (tunda/dam kuni), Q16 (skan), Q39 (real-time)
- **action:** CREATE
- **⤳ Ta'sir:** GL, ombor balansi

### EP-POS-016 · Inventar farqini kim tasdiqlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Avto GL posting, lekin moliya bo'limi tekshiradi va tasdiqlaydi (farq → zarar/ortiqcha yozuvi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q53 (avto GL + moliya tasdig'i)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, audit

### EP-POS-017 · Inventar qancha tez-tez o'tkaziladi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Sikl-sanash (har kuni bir guruh material aylanma) — uzluksiz aniqlik. BARCHA_JAVOBLAR faqat "qachon" (tunda/dam kuni) ni belgilagan, "qancha tez-tez" (davriylik) ni emas — egasi tasdig'i kerak.
- **Manba:** v1 Q17 (A-default); BARCHA_JAVOBLAR Q52 faqat vaqtni belgilaydi, davriylikni emas
- **action:** —
- **⤳ Ta'sir:** Aniqlik darajasi, MES (ish to'xtamasligi)

### EP-POS-018 · Ichki ko'chirish (ombordan omborga)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Yagona INTERNAL_TRANSFER harakati: bir xil tip = tezkor (tasdiqsiz), boshqa tip = menejer tasdiq. Manba kamayadi, qabul qo'shiladi. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q25 (INTERNAL_TRANSFER)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor balansi, menejer tasdiq

### EP-POS-019 · AI-taklif — nima tavsiya qiladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** AI to'liq yordamchi: rejalashtirish (zakaz tavsiyasi), Debit/Credit hisoblash, GL. AI analytics rejalashtirish uchun. (v1-A ruhida — to'liq aqlli yordamchi)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q43 (AI GL), Q58 (real-time ERP integratsiya)
- **action:** AI
- **⤳ Ta'sir:** AI, MM, Notifications

### EP-POS-020 · AI anomaliya aniqlash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** AI shubhali harakatni belgilab boshliqqa signal (proaktiv). BARCHA_JAVOBLAR AI'ni rejalashtirish/GL uchun tasdiqlagan, lekin anomaliya-signal mexanizmini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-077 bilan birga).
- **Manba:** v1 Q20 (A-default); BARCHA_JAVOBLAR Q57 (AI bor, anomaliya aniq emas)
- **action:** —
- **⤳ Ta'sir:** AI, HR (boshliq signal)

### EP-POS-021 · Offline rejim — internet yo'qda
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq offline rejim ishlaydi (internet o'chsa ham), keyin avto-sinxron. Responsive web (PWA). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q8 (to'liq offline), Q3 (responsive web)
- **action:** CREATE
- **⤳ Ta'sir:** Sinxron, balans/GL

### EP-POS-022 · Harakatni bekor qilish/tuzatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Faqat DRAFT holatda bekor; tasdiqlangan harakat — teskari (storno) harakat yoziladi (o'chirish yo'q, tarix saqlanadi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q27 (DRAFT bekor / tasdiqlangan = teskari harakat)
- **action:** DELETE/CREATE (storno)
- **⤳ Ta'sir:** Audit, GL tarixi

### EP-POS-023 · Brak/yaroqsiz material harakati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Alohida DAMAGE (zarar akti) harakati — QC moduliga avtomatik o'tadi + GL zarar hisobiga. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q26 (DAMAGE → QC avto)
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** QC, Finance (zarar)

### EP-POS-024 · Tayyor mahsulot (FG) ishlab chiqarishdan ombarga qabuli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** FG bir xil POS tizimida boshqariladi; ERP MES bilan to'liq real-time integratsiya (REST API) — MES sessiyasidan FG-kirim. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q34 (FG POS'da), Q58 (MES real-time integratsiya)
- **action:** CREATE/EVENT
- **⤳ Ta'sir:** MES, ombor balansi

### EP-POS-025 · Partiya/seriya (lot) kuzatuvi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Partiya kuzatiladi (Code-128 partiya uchun, FIFO/FEFO partiya narxi bo'yicha). Muddatli → FEFO, muddatsiz → FIFO. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (Code-128 partiya), Q35 (FIFO partiya narxi), Q37 (FEFO/FIFO)
- **action:** CREATE
- **⤳ Ta'sir:** QC, MM, muddat

### EP-POS-026 · POS Monitor planshet ekrani ko'rinishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Responsive web (PC + planshet + smartphone), skaner-markaz. Xato: kichik → toast, katta → modal dialog. (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q3 (responsive web), Q9 (toast/modal)
- **action:** READ
- **⤳ Ta'sir:** UX, i18n

### EP-POS-027 · Harakat hisoboti va smena yopilishi
- **Holat:** ✅ JAVOBLANGAN (qisman — smena formal yopilishi sodda)
- **Javob/Tavsiya:** Smena boshqaruvi kerak emas — faqat audit log (kim qachon kirdi/chiqdi). Kunlik harakat jurnali + ombor qoldiqlari hisoboti bor. (v1-B ruhida — rasmiy yopilish yumshoq)
- **Manba:** BARCHA_JAVOBLAR Q11 (smena emas, audit log), Q56 (harakat jurnali, qoldiqlar)
- **action:** READ/EXPORT
- **⤳ Ta'sir:** Audit, HR
- **Eslatma:** v2 EP-POS-050 (smena topshirish akti, 2 imzo) bu qarorni nozik to'ldiradi — egasi qaror.

### EP-POS-028 · Master-data — harakat turlari ro'yxati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Harakat turlari aniq belgilangan: EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE (kod-darajada qat'iy). Yangi sabab/sozlama admin panelda kengaytiriladi (Notifications matritsasi bilan birga). (v1-A/B aralash — turlar qat'iy, sabablar moslashuvchan)
- **Manba:** BARCHA_JAVOBLAR Q21–Q26 (movement types qat'iy)
- **action:** CREATE (admin)
- **⤳ Ta'sir:** GL mapping, Notifications

### EP-POS-029 · POS Monitor karta-model bilan integratsiya (GSD)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq ERP integratsiya (HR ham). Omborchi statistikasi POS harakatlaridan chiqadi (analytics: ombor menejer kunlik). Aniq 3-ko'rsatkichli GSD formula EP-POS-056'da nozik (ochiq).
- **Manba:** BARCHA_JAVOBLAR Q58 (HR real-time integratsiya), Q57 (ombor menejer kunlik analytics)
- **action:** AI/READ
- **⤳ Ta'sir:** HR (karta GSD), Director

### EP-POS-030 · POS Monitor va ikki-ombor dunyosi (kanonik jadval)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Real-time har harakat darhol PostgreSQL'ga yoziladi; ERP DB ning bir qismi (alohida server yo'q). Kanonik jadval = yagona haqiqat (WMS warehouse_stock yo'nalishi). (v1-A)
- **Manba:** BARCHA_JAVOBLAR Q1 (ERP DB qismi), Q39 (real-time PostgreSQL); memory `reference_live_db_location` (kanonik=warehouse_stock)
- **action:** CREATE
- **⤳ Ta'sir:** WMS, butun ombor balansi

---

## II QISM — v2 SAVOLLARI (Q31–Q82 → EP-POS-031..082)

### EP-POS-031 · Ichki logistika harakati alohida turmi (yarim tayyor ko'chirish)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — INTERNAL_TRANSFER (ombor ko'chirish) harakati mavjud; yarim tayyor sex-pozitsiyalar orasida shu orqali ko'chadi, balans ko'rinadi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q25 (INTERNAL_TRANSFER), Q29 (PRODUCTION_* omborlari)
- **action:** CREATE
- **⤳ Ta'sir:** MES (sex qoldig'i), PP, ombor balansi

### EP-POS-032 · Texkarta-material mosligi tekshiruvi (chiqimdan oldin)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Chiqimda buyurtma tanlanadi → texkarta materiali bilan skan mos kelmasa qizil ogohlantirish + bloklash (A3: hech kim — qat'iy blok yoki A1: smena boshlig'i ruxsati). BARCHA_JAVOBLAR bu texkarta-mosligi guardini aniq yoritmagan — eng qimmat xato bo'lgani uchun egasi tasdig'i muhim.
- **Manba:** v2 Q32 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **action:** —
- **⤳ Ta'sir:** PP (texkarta), MES (to'xtash), QC (brak)

### EP-POS-033 · Gofra qavati / qog'oz grammaji chiqimda farqlanadimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har grammaj/qavat alohida material kartasi (barcode darajasida farqli) — EAN-13 har kartochka uchun unikal; aralashtirib bo'lmaydi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q15 (EAN-13 har material), Q18 (yangi kartochka)
- **action:** CREATE
- **⤳ Ta'sir:** MM (katalog), QC

### EP-POS-034 · Laboratoriya qabuli — kirim laborantga bog'liqmi (karantin)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — barcha EXTERNAL_IN avval KARANTIN omboriga; QC tasdiqlasa → asosiy omborga, chiqim shundan keyin. Karantindan chiqishni QC tasdiqlaydi. (v2-A; A2/A3)
- **Manba:** BARCHA_JAVOBLAR Q30 (kirim → karantin → QC), Q21 (5-bosqich KARANTIN→QC), Q29 (QUARANTINE ombori)
- **action:** APPROVE
- **⤳ Ta'sir:** QC (lab xulosasi), MM, PP

### EP-POS-035 · Lab "rad etdi" bo'lsa material taqdiri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** QC CHIQARISH qarori → ta'minotchiga qaytariladi; yoki DEFECTIVE omborga. Bloklangan holatda chiqarib bo'lmaydi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q31 (QC CHIQARISH → ta'minotchiga qaytish), Q29 (DEFECTIVE ombori)
- **action:** CREATE/REJECT
- **⤳ Ta'sir:** QC, MM (yetkazib beruvchi reytingi), Finance (qaytarish)

### EP-POS-036 · Chiqindi va qoldiq (отходы) hisobga olinadimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Alohida "chiqindi/qoldiq kirimi" harakati (makulatura ombori) — keyin sotuv/qayta ishlatish hisobga tushadi (A1: stanok normasidan avto reja-fakt). BARCHA_JAVOBLAR chiqindi-harakatini aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q36 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **action:** —
- **⤳ Ta'sir:** Finance (chiqindi sotuvi), MM (makulatura kartasi)

### EP-POS-037 · Makulatura (ikkilamchi qog'oz) ombori alohida turmi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Makulatura alohida ombor turi + barcode rangida farqli (toza topliner bilan aralashmaydi). BARCHA_JAVOBLAR ombor turlarini (MAIN/QUARANTINE/PRODUCTION/FINISHED/DEPARTMENT/QC/DEFECTIVE) sanagan, makulaturani alohida belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q37 (A-default); BARCHA_JAVOBLAR Q29 (ombor turlari, makulatura yo'q)
- **action:** —
- **⤳ Ta'sir:** MM, EP-POS-032 (texkarta mosligi)

### EP-POS-038 · Rohler/poddon (ko'chirish vositasi) kuzatiladimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Poddon + o'lchov birligi ikkalasi (1 poddon = N rulon/kg avto konversiya) — amaliyotga mos. BARCHA_JAVOBLAR poddon-birligini aniq yoritmagan — egasi tasdig'i kerak.
- **Manba:** v2 Q38 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** MM (poddon konversiyasi), IoT

### EP-POS-039 · Bo'sh poddon/rohler qaytishi hisobga olinadimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Poddon — qaytariladigan aktiv, ketdi/qaytdi balansi yuritiladi (yo'qolish ko'rinadi). BARCHA_JAVOBLAR tara-aylanmasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q39 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** IoT (aktiv kuzatuvi), Finance (aktiv)

### EP-POS-040 · Kunlik ishlab chiqarish rejasi planshetga tushadimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — POS MES/PP bilan to'liq real-time integratsiya; kunlik reja → "bugun chiqariladigan materiallar" PP'dan ko'rinadi (A1: % ko'rsatkich bilan). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q58 (PP/MES real-time integratsiya), Q57 (AI rejalashtirish)
- **action:** READ
- **⤳ Ta'sir:** PP (kunlik reja), MES

### EP-POS-041 · Bekor turish (простой) signali — material yetishmasa
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Sex "material kutyapman" tugmasi → vaqt sanog'i → omborchi/boshliqqa signal (sabab aniq qayd). BARCHA_JAVOBLAR bu logistika-prostoy mexanizmini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q41 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** MES (to'xtash sababi), Coordination, HR (logist GSD)

### EP-POS-042 · Sexning material talabi (so'rov) planshetdan keladimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — tasdiqlanadigan ichki so'rov majburiy: xodim → bo'lim menejer tasdiq → ombor xodimi beradi → Ledger DEBIT (talab↔chiqim bog'liq). (v2-A; A1 sex/bo'lim menejer)
- **Manba:** BARCHA_JAVOBLAR Q50 (bo'lim so'rov workflow), Q51 (so'rov majburiy)
- **action:** CREATE/APPROVE
- **⤳ Ta'sir:** MES, Coordination, Kanban

### EP-POS-043 · Buyurtmaga material sarfini biriktirish (kalkulyatsiya)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — POS MM/FI/MES bilan to'liq integratsiya; har chiqim buyurtmaga biriktiriladi → buyurtma material tannarxi avto yig'iladi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q58 (MM/FI/MES integratsiya), Q43 (avto GL)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (tannarx), SD (rentabellik), PP (norma-fakt)

### EP-POS-044 · Norma-fakt farqi (ortiqcha sarf) ogohlantirishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Norma oshsa qizil ogohlantirish + sabab so'raydi (brak/qayta sozlash). BARCHA_JAVOBLAR norma-fakt anomaliya-guardini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-020/077 bilan).
- **Manba:** v2 Q44 (A-default); BARCHA_JAVOBLAR'da to'g'ridan to'g'ri yo'q
- **action:** —
- **⤳ Ta'sir:** PP (norma), Finance, AI (anomaliya)

### EP-POS-045 · Turniket/kirish-chiqish bilan bog'lanishmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Login ERP SSO orqali (rol avto). Turniket RFID alohida HR/davomat tizimi — POS login = ERP login (B varianti ruhida, ikki tizim ajratilgan). RFID=login majburiy emas.
- **Manba:** BARCHA_JAVOBLAR Q2 (SSO), Q10 (ERP login)
- **action:** LOGIN
- **⤳ Ta'sir:** HR (davomat), IoT (RFID), EP-POS-002

### EP-POS-046 · A-System bilan bog'liqlik (eski tizim)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** ERP A-System'ni butunlay almashtiradi (yagona haqiqat). BARCHA_JAVOBLAR 1C-yo'qligini aytgan, lekin A-System taqdirini aniq hal qilmagan — egasi qarori (Q-25 master reja).
- **Manba:** v2 Q46 (A-default); BARCHA_JAVOBLAR Q44 (1C yo'q) — A-System emas
- **action:** —
- **⤳ Ta'sir:** Butun ombor/PP zanjiri

### EP-POS-047 · Yarim tayyor (yarim tayyor) bosqichlari kuzatiladimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — PRODUCTION_* omborlari mavjud; har bosqichdan keyin yarim tayyor alohida pozitsiya (WIP ko'rinadi), MES integratsiya. (v2-A/C)
- **Manba:** BARCHA_JAVOBLAR Q29 (PRODUCTION_* omborlari), Q58 (MES integratsiya)
- **action:** CREATE
- **⤳ Ta'sir:** MES (WIP), PP, Finance (WIP qiymati)

### EP-POS-048 · Texnik pasport / partiya hujjati FG kirimda
- **Holat:** ✅ JAVOBLANGAN (qisman)
- **Javob/Tavsiya:** Har harakatda akt (PDF) + invoice; partiya kuzatiladi (Code-128). Texnik pasport QC/SD bilan bog'lanadi (FG kirimda partiya+pasport, jo'natishda tayyor). (v2-A ruhida; pasport-FG bog'lanishi nozik)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti+invoice PDF), Q15 (Code-128 partiya), Q58 (QC/SD integratsiya)
- **action:** CREATE
- **⤳ Ta'sir:** QC (texnik pasport), SD (jo'natish), EP-POS-025

### EP-POS-049 · Lab namuna olish ombordan harakatmi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** "Lab namunasi" alohida chiqim sababi (kichik, lekin qayd) — balans aniq. BARCHA_JAVOBLAR namuna-harakatini aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q49 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** QC (lab), EP-POS-005 (chiqim sababi)

### EP-POS-050 · Smenadan smenaga material topshirish (Omborchi akti)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Smena topshirish akti (2 imzo: topshiruvchi/qabul qiluvchi). BARCHA_JAVOBLAR Q11'da "smena boshqaruvi kerak emas, faqat audit log" deydi — bu A-default bilan ZIDLIKDA; egasi qaror qilishi kerak (audit-log yetarli yoki rasmiy topshirish akti).
- **Manba:** v2 Q50 (A-default) ╳ BARCHA_JAVOBLAR Q11 (smena emas, audit log) — ZIDLIK
- **action:** —
- **⤳ Ta'sir:** HR (javobgarlik), EP-POS-027 (smena yopilishi)

### EP-POS-051 · Yuk topshirish-qabul akti (kirimda yetkazib beruvchi bilan)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har harakatda akt (PDF): harakat raqami, sana, materiallar, kim topshirdi/qabul qildi, rekvizitlar. EXTERNAL_IN'da zakaz-fakt farqi qayd etiladi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti), Q42 (kim topshirdi/qabul qildi PDF'da)
- **action:** CREATE/EXPORT
- **⤳ Ta'sir:** Finance (da'vo), MM, EP-POS-004

### EP-POS-052 · Kam yetkazilgan/buzuq material qabul rejimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Qisman qabul (kelgan miqdor) + ochiq qoldiq + buzuq qismi alohida sabab (DAMAGE/karantin). BARCHA_JAVOBLAR qisman-qabulni aniq belgilamagan (faqat karantin+QC oqimi bor) — egasi tasdig'i kerak.
- **Manba:** v2 Q52 (A-default); BARCHA_JAVOBLAR Q30 (karantin) qisman holatni yopmaydi
- **action:** —
- **⤳ Ta'sir:** MM, Finance, EP-POS-051

### EP-POS-053 · Tozalik / 5S holati planshetda
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Tozalik/5S POS Monitor doirasidan tashqarida (Coordination/checklist moduli) — POS faqat material harakati. (v2-A; toza chegara)
- **Manba:** BARCHA_JAVOBLAR Q56 (POS hisobotlari faqat material/ombor/inventar), POS scope material-faqat
- **action:** READ
- **⤳ Ta'sir:** Coordination, HR (intizom)

### EP-POS-054 · Ish jоyni ruxsatsiz tashlab ketish (planshet bog'liqligi)
- **Holat:** ✅ JAVOBLANGAN (qisman)
- **Javob/Tavsiya:** Audit log har klik/kirish-chiqishni qaydlaydi (IP+timestamp). Maxsus "harakatsizlik signali" alohida belgilanmagan — audit log asosida nazorat (B ruhida, turniket/davomat HR'da). Proaktiv signal — ochiq nozik.
- **Manba:** BARCHA_JAVOBLAR Q6 (to'liq audit log: har klik, IP, timestamp), Q11 (kim qachon kirdi/chiqdi)
- **action:** READ/EVENT
- **⤳ Ta'sir:** HR (intizom), EP-POS-041

### EP-POS-055 · Energiya/resurs (suv/gaz/svet) tejash POS'da
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Energiya — IoT/Coordination moduli, POS Monitor'da YO'Q (toza chegara). POS faqat material harakati + inventar. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q56 (POS hisobotlari material-faqat), Q46 (POS faqat inventar)
- **action:** READ
- **⤳ Ta'sir:** IoT (hisoblagich), Director (KPI)

### EP-POS-056 · Omborchi GSD: "reja bajarilish %" kitobdan
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Uch ko'rsatkich (reja % + kechikish soni + og'ish soni) POS harakatlaridan avto → logist kartasiga. BARCHA_JAVOBLAR HR integratsiya + ombor menejer analytics borligini aytgan, lekin aynan 3-ko'rsatkich formulasini belgilamagan — egasi tasdig'i kerak (kitob aynan bu raqamlarni belgilagan).
- **Manba:** v2 Q56 (A-default); BARCHA_JAVOBLAR Q57/Q58 (analytics bor, aniq formula yo'q)
- **action:** —
- **⤳ Ta'sir:** HR (karta GSD), Director, EP-POS-029

### EP-POS-057 · Material birligi konversiyasi (rulon↔kg↔m)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har materialga konversiya jadvali (1 rulon = N kg = M metr) → avto o'tkazish (FIFO partiya narxi shu birlikda). Valyuta ham har xil. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q35 (FIFO partiya), Q36 (har qanday valyuta); MM birlik integratsiyasi Q58
- **action:** CREATE
- **⤳ Ta'sir:** MM (birlik), EP-POS-014

### EP-POS-058 · Buyurtma yopilgach ortib qolgan material
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** INTERNAL_RETURN (qaytarish) harakati — ortgan material omborga qaytadi, sabab majburiy, tannarxdan chiqadi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q24 (INTERNAL_RETURN, sabab majburiy), Q48 (iste'mol → stokka qaytadi)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (tannarx), EP-POS-043

### EP-POS-059 · Yetkazib beruvchiga qaytarish (vozvrat)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** QC CHIQARISH qarori → ta'minotchiga qaytish harakati → Finance da'vo/kredit-nota. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q31 (CHIQARISH → ta'minotchiga qaytish)
- **action:** CREATE/REJECT
- **⤳ Ta'sir:** Finance (kredit-nota), MM (yetkazib beruvchi reytingi)

### EP-POS-060 · Material muddati (срок годности) — bo'yoq/elim
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Muddatli materiallarga FEFO (muddati qisqa birinchi) + yaqinlashganda ogohlantirish; muddatsiz → FIFO. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q37 (muddatli → FEFO)
- **action:** EVENT/AI
- **⤳ Ta'sir:** QC, MM, EP-POS-025

### EP-POS-061 · Joylashuv (ombordagi joy / yacheyka) kuzatiladimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Bin location freeform (operator o'zi yozadi: A-3-12, Tokcha-5, istalgan matn), kirimda belgilanadi, chiqimda ko'rsatiladi. (v2-A ruhida, freeform)
- **Manba:** BARCHA_JAVOBLAR Q33 (Bin location freeform)
- **action:** CREATE
- **⤳ Ta'sir:** IoT, MES, ichki logistika marshruti

### EP-POS-062 · Mijoz materiali (давальческое) ajratiladimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** "Mijoz materiali" alohida turi — miqdor kuzatiladi, qiymat zavod GL'ga tushmaydi (to'g'ri huquqiy holat). BARCHA_JAVOBLAR davальческое-ni belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q62 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** Finance (balans), SD (mijoz), EP-POS-012

### EP-POS-063 · Inventar paytida ombor "muzlatiladimi" (freeze)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Inventar tunda yoki dam olish kunida o'tkaziladi (ish to'xtatilmaydi) — freeze muammosi shu bilan hal: harakat yo'q vaqtda sanaladi. Zona-level freeze alohida talab emas. (v2-A muqobili)
- **Manba:** BARCHA_JAVOBLAR Q52 (tunda/dam kuni, ish to'xtatilmaydi)
- **action:** —
- **⤳ Ta'sir:** MES, EP-POS-015

### EP-POS-064 · Inventar farqi chegarasi (avto-tasdiq limiti)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Belgilangan chegaragacha (±N% yoki summa) avto, undan ortig'i tasdiq talab. BARCHA_JAVOBLAR Q53 "avto GL + moliya tasdig'i" deydi (har farqqa), lekin avto-limit chegarasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q64 (A-default); BARCHA_JAVOBLAR Q53 (moliya tasdig'i, limit aniq emas)
- **action:** —
- **⤳ Ta'sir:** Finance, EP-POS-016

### EP-POS-065 · Tezkor minimal qoldiq — kim zakaz beradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Minimaldan tushsa AI rejalashtirish → avto sotib olish talabi MM/snabjeniyega (proaktiv). MM bilan real-time integratsiya. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (AI rejalashtirish), Q58 (MM integratsiya)
- **action:** AI/EVENT
- **⤳ Ta'sir:** MM (snabjeniye), Finance (byudjet), EP-POS-011

### EP-POS-066 · Buyurtma uchun rezerv (band qilish)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Reja material rezervlaydi → erkin qoldiq alohida ko'rinadi (jami ╳ erkin). BARCHA_JAVOBLAR rezerv/band mexanizmini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q66 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** PP (reja), MES, EP-POS-040

### EP-POS-067 · Shoshilinch chiqim (rejasiz/ruxsatli)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Rejasiz chiqim ruxsat etiladi, lekin majburiy sabab + boshliq darhol xabardor. BARCHA_JAVOBLAR sabab-majburiyligini (Q24) yopadi, lekin "rejadan tashqari" maxsus oqimni belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q67 (A-default); BARCHA_JAVOBLAR Q24 qisman (sabab), rejasiz-oqim yo'q
- **action:** —
- **⤳ Ta'sir:** PP, EP-POS-042

### EP-POS-068 · Bichish/qirqish chiqimi (ko'p materialdan bo'lak)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Qisman chiqim — rulon qoldig'i o'lchov birligida kamayadi (ochiq rulon). BARCHA_JAVOBLAR qisman-rulon chiqimini aniq belgilamagan (real-time stok bor, lekin bo'lak-chiqim nozik) — egasi tasdig'i kerak (EP-POS-057 konversiya bilan).
- **Manba:** v2 Q68 (A-default); BARCHA_JAVOBLAR Q39 (real-time) qisman
- **action:** —
- **⤳ Ta'sir:** MM (o'lchov), EP-POS-057

### EP-POS-069 · Foto-dalil (kirim/brak/inventar farqi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Buzuq qabul/brak/katta farqda foto majburiy (planshet kamerasidan) — dalil bilan himoya. BARCHA_JAVOBLAR AI kamera barcode-o'qish uchun bor, lekin foto-dalil biriktirishni aniq belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q69 (A-default); BARCHA_JAVOBLAR Q16/Q20 (kamera barcode uchun, foto-dalil emas)
- **action:** —
- **⤳ Ta'sir:** QC, Finance (da'vo), EP-POS-051

### EP-POS-070 · Offline yozilgan harakat to'qnashuvi (konflikt)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Sinxronda to'qnashuv aniqlansa — harakat "tekshirilsin" holatiga, boshliq hal qiladi. BARCHA_JAVOBLAR to'liq offline (Q8) + real-time (Q39) ni tasdiqlagan, lekin konflikt-rezolyutsiyasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q70 (A-default); BARCHA_JAVOBLAR Q8 (offline), Q39 (real-time) — konflikt yo'q
- **action:** —
- **⤳ Ta'sir:** EP-POS-010 (balans-guard), EP-POS-021 (offline)

### EP-POS-071 · Telegram/bildirishnoma — qaysi hodisa kimga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq Telegram Mini App (barcode skan, so'rov, tarix, tasdiqlash); topilmasa admin Telegram xabar. Hodisa→rol matritsasi admin panelda sozlanadi (v2-A ruhida). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q59 (Telegram Mini App), Q18 (admin Telegram xabar)
- **action:** EVENT/NTF
- **⤳ Ta'sir:** Notifications, EP-POS-028

### EP-POS-072 · Tayyor mahsulot jo'natish (отгрузка) POS'dami
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** EXTERNAL_OUT FAQAT tayyor mahsulot ombori (POS'da), SD bilan bog'liq: tasdiq ombor menejer + moliya + AI (to'lov tekshiruv). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q22 (EXTERNAL_OUT FG ombori, +moliya+AI), Q58 (SD integratsiya)
- **action:** CREATE/APPROVE
- **⤳ Ta'sir:** SD (jo'natish), Finance (sotuv), EP-POS-024

### EP-POS-073 · Marshrut varaqasi (накладная) chop etish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har harakatda akt (PDF) + invoice (alohida PDF) chop etiladi; label ZPL/EPL/PDF. Qog'oz накладная opsiyasi printerga. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q41 (harakat akti PDF + invoice), Q19 (label ZPL/EPL/PDF), Q55 (PDF+Excel)
- **action:** EXPORT
- **⤳ Ta'sir:** EP-POS-007 (printer), SD (jo'natish hujjati)

### EP-POS-074 · Razряd/malaka — kim qaysi harakatni qila oladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Rol ERP'dan avto tortiladi; faqat o'sha bo'lim xodimlari chiqim qila oladi; har harakat turi tegishli tasdiq (menejer/moliya) talab qiladi. Razряd-darajali huquq org-karta bilan uyg'unlashadi. (v2-A ruhida)
- **Manba:** BARCHA_JAVOBLAR Q10 (rol avto), Q12 (faqat bo'lim chiqim), Q21–Q25 (tasdiq darajalari)
- **action:** APPROVE
- **⤳ Ta'sir:** HR (razряd), EP-POS-009, EP-POS-002

### EP-POS-075 · Kunlik hisobotni kim ko'radi (vertikal)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Analytics: AI (rejalashtirish) + Direktor (strategik) + Moliya (oylik) + Ombor menejer (kunlik) — har daraja o'z kesimini ko'radi (vertikal). (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q57 (analytics kim uchun — AI/Direktor/Moliya/Menejer)
- **action:** READ/EXPORT
- **⤳ Ta'sir:** Director, Coordination, EP-POS-056

### EP-POS-076 · Buyurtma o'zgarishi (chiqarilgan materialga ishlov)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Buyurtma o'zgarsa POS ogohlantiradi + chiqarilgan material qaytarish taklif qilinadi. BARCHA_JAVOBLAR buyurtma-o'zgarish reaktsiyasini belgilamagan (qaytarish harakati bor, lekin o'zgarish-trigger yo'q) — egasi tasdig'i kerak.
- **Manba:** v2 Q76 (A-default); BARCHA_JAVOBLAR Q24 (qaytarish bor), o'zgarish-trigger yo'q
- **action:** —
- **⤳ Ta'sir:** PP (reja o'zgarishi), SD, EP-POS-058

### EP-POS-077 · Tunги smena / kechki harakat anomaliyasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Smena jadvalidan tashqari vaqt + norma-oshiq chiqim avto shubhali belgilanadi → boshliq. BARCHA_JAVOBLAR audit log (Q6) + AI (Q57) ni tasdiqlagan, lekin vaqt+miqdor anomaliya-detektorini aniq belgilamagan — egasi tasdig'i kerak (EP-POS-020/044 bilan).
- **Manba:** v2 Q77 (A-default); BARCHA_JAVOBLAR Q6 (audit log), Q57 (AI) — anomaliya aniq emas
- **action:** —
- **⤳ Ta'sir:** AI (anomaliya), HR (smena jadvali), EP-POS-044

### EP-POS-078 · Material kartasini kim yaratadi (omborchimi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Skanerda topilmasa — yangi kartochka yaratish + admin Telegram xabar (MM tasdiqi yo'nalishida). MM bilan to'liq integratsiya; yangi material MM'ga so'rov sifatida boradi. (v2-A ruhida; topilmasa yaratish + admin xabar)
- **Manba:** BARCHA_JAVOBLAR Q18 (topilmasa: qo'lda qidirish + yangi kartochka + admin Telegram), Q58 (MM integratsiya)
- **action:** CREATE
- **⤳ Ta'sir:** MM (master-data), EP-POS-033, EP-POS-037

### EP-POS-079 · Eski tizimdan boshlang'ich qoldiq (начальный остаток)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Ishga tushishda bir martalik to'liq inventar (real sanash) → boshlang'ich qoldiq (eng ishonchli). EP-POS-046 (A-System) hal bo'lgach aniqlanadi. BARCHA_JAVOBLAR boshlang'ich-qoldiq strategiyasini belgilamagan — egasi tasdig'i kerak.
- **Manba:** v2 Q79 (A-default); BARCHA_JAVOBLAR'da yo'q
- **action:** —
- **⤳ Ta'sir:** EP-POS-046 (A-System), EP-POS-015 (inventar)

### EP-POS-080 · Harakat tarixini kim ko'ra oladi (audit)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** To'liq audit log (har klik, har o'zgarish, IP, timestamp) 7 yil saqlanadi; tarix o'zgarmas (faqat o'qish). Xodim "Mening inventarim" sahifasidan o'zinikini, boshliq/menejer hammasini ko'radi. (v2-A)
- **Manba:** BARCHA_JAVOBLAR Q6 (to'liq audit), Q7 (7 yil retention), Q47 (xodim o'z inventari)
- **action:** READ
- **⤳ Ta'sir:** Director (audit), EP-POS-022 (storno)

### EP-POS-081 · Yuk topshirishda nomuvofiqlik (topshir↔qabul farqi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** **A-default:** Topshirish↔qabul 2 imzo; farq bo'lsa "nizo" holati + boshliq hal qiladi. BARCHA_JAVOBLAR akt (Q42 kim topshirdi/qabul qildi) ni tasdiqlagan, lekin farq-nizo rezolyutsiyasini belgilamagan — egasi tasdig'i kerak (EP-POS-050 bilan bog'liq, Q11-zidlik).
- **Manba:** v2 Q81 (A-default); BARCHA_JAVOBLAR Q42 qisman (akt bor), nizo-oqim yo'q
- **action:** —
- **⤳ Ta'sir:** MES (sex qabuli), EP-POS-050, EP-POS-031

### EP-POS-082 · POS Monitor til/ko'rinish (omborchi uchun)
- **Holat:** ✅ JAVOBLANGAN (qisman — kirill ochiq)
- **Javob/Tavsiya:** O'zbek + Rus (foydalanuvchi tanlaydi), ikonka-markaz responsive dizayn. **Nozik:** kitob kirill-o'zbekda — uchinchi til (kirill) qo'shilishi v2-A taklifi, lekin BARCHA_JAVOBLAR faqat O'zbek(lotin)+Rus deydi → kirill qo'shish egasi qarori.
- **Manba:** BARCHA_JAVOBLAR Q4 (O'zbek + Rus, foydalanuvchi tanlaydi), Q3 (responsive)
- **action:** READ
- **⤳ Ta'sir:** i18n, EP-POS-026

---

## OCHIQ SAVOLLAR RO'YXATI (egasi qarori kerak — 25 ta)

| Kod | Mavzu | A-default tavsiya |
|---|---|---|
| EP-POS-017 | Inventar davriyligi | Sikl-sanash (har kun bir guruh) |
| EP-POS-020 | AI anomaliya signali | AI → boshliqqa signal (proaktiv) |
| EP-POS-032 | Texkarta-material mosligi guard | Skan mos kelmasa blok (qat'iy) |
| EP-POS-036 | Chiqindi/qoldiq hisobi | Alohida chiqindi-kirim (makulatura) |
| EP-POS-037 | Makulatura ombori | Alohida ombor turi + rang barcode |
| EP-POS-038 | Poddon birligi | Poddon + o'lchov ikkalasi (avto konversiya) |
| EP-POS-039 | Bo'sh poddon/tara qaytishi | Qaytariladigan aktiv balansi |
| EP-POS-041 | Bekor turish (prostoy) signali | "Material kutyapman" → vaqt sanog'i + signal |
| EP-POS-044 | Norma-fakt anomaliya | Norma oshsa qizil + sabab |
| EP-POS-046 | A-System taqdiri | ERP butunlay almashtiradi |
| EP-POS-049 | Lab namuna chiqimi | Alohida "lab namunasi" sababi |
| EP-POS-050 | Smena topshirish akti | 2 imzo (⚠️ Q11 audit-log bilan ZIDLIK) |
| EP-POS-052 | Qisman/buzuq qabul | Qisman qabul + ochiq qoldiq + buzuq sabab |
| EP-POS-056 | Logist GSD 3-ko'rsatkich | Reja% + kechikish + og'ish avto |
| EP-POS-062 | Mijoz materiali (давальческое) | Alohida tur, qiymat GL'siz |
| EP-POS-064 | Inventar avto-tasdiq limiti | ±N% gacha avto, ortig'i tasdiq |
| EP-POS-066 | Buyurtma rezervi (band) | Reja rezervlaydi, erkin qoldiq alohida |
| EP-POS-067 | Shoshilinch rejasiz chiqim | Ruxsat + majburiy sabab + boshliq xabar |
| EP-POS-068 | Qisman rulon (bichish) chiqimi | Qisman chiqim, qoldiq o'lchovda |
| EP-POS-069 | Foto-dalil | Buzuq/brak/katta farqda foto majburiy |
| EP-POS-070 | Offline konflikt | "Tekshirilsin" → boshliq hal qiladi |
| EP-POS-076 | Buyurtma o'zgarishi reaktsiyasi | Ogohlantirish + qaytarish taklifi |
| EP-POS-077 | Vaqt+miqdor anomaliya | Smena tashqarisi + norma-oshiq → shubhali |
| EP-POS-079 | Boshlang'ich qoldiq | Bir martalik to'liq inventar |
| EP-POS-081 | Topshir↔qabul nomuvofiqligi | 2 imzo + nizo holati → boshliq |

> Eslatma: rasmiy ochiq son = **25** (yuqorida har EP-POS holatida 🔵 belgilangan). EP-POS-082 til yarim-ochiq (kirill) — yakuniy javoblangan deb sanaldi (O'zbek+Rus tasdiqlangan), faqat kirill nozik.

DONE: POS — 82 (javoblangan 57, ochiq 25).
