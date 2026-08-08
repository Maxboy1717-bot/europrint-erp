# MES / Ishlab chiqarish — Decision Map (EP-MES) — 2026-06-08

> Manba savollar: v1 (`vision-questions/08-mes.md`, 30) + v2 (`vision-questions-v2/08-mes.md`, 52) = **82**. Kodlar: v1 → EP-MES-001..030, v2 → EP-MES-031..082 (fayl tartibida).
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` (460 real javob — Q116/Q119 mashina operatori avto-kunlik hisobot → rasmiy invoys PDF, Q132/Q133 smena/smenaboshchi roli orgsxemadan, Q88/Q108 AI kamera davomat+kayfiyat+sog'liq, Q98 ideal-xona AI taqqoslash), `kitob-extracted/RD5__Абдуллаев Баходиржон.md` ("Сменалик ишлаб чиқариш режасини назорат қилиш" oргполитика — har smena yakuni yozma xulosa, bajarilmaslik sabablari 6 toifaga ajratiladi [material/texnologik/sifat/kadr/режа-хато/бошқа], takror muammo = tizimli, og'zaki o'zgarish rad etiladi; "Тех карта дубликатлари" — asosiy texkarta yagona manba; "Хом-ашё тўлиқ бўлмаган заказ" taqiqi), kitob form-fakti (А смена План.xlsx, Станоклар норма.xlsx, Заявка бумаги.xlsx, Кун тартиби, 2021 ShVB mustaqil-ish siyosati), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-kod, action turlari, oltin-ip), karta-model vizyon.
> v1 kontekst: MES backend BOR (ishlab chiqarish sessiyasi, `downtime_events`+`downtime_reason_codes`, SOS, OEE snapshot, smena morning/afternoon/night, work-order holat-mashinasi). HALI yo'q: hop3, brigada, avto-norma sarf, jonli monitoring, karta-model ulanishi. Har savol birinchi varianti (A) = vizyonga/kitobga eng mos = tavsiya.

## Xulosa
- **Jami:** 82
- **✅ JAVOBLANGAN:** 33 (kitob oргполитика + zavod formasi-fakti [Станоклар норма / А смена План / Заявка бумаги / Кун тартиби] + 460 javob [Q116/Q119/Q132/Q133/Q88] + oltin-ip/karta-model vizyon bilan bevosita tasdiqlangan)
- **🔵 OCHIQ:** 49 (egasi keyin hal qiladi; har biriga A-default tavsiya — kitob/karta-model/OEE-amaliyotga eng mos variant; sub-savollar ham A-default)

---

## I QISM — v1 (30 savol) — EP-MES-001..030

### EP-MES-001 · Ishlab chiqarish sessiyasi 3-bosqich ("hop3")
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'liq 3 bosqich (tayyorgarlik/sozlash → asosiy → yakunlash). Kitob izohlari ("настройка муракаб - вакт кетди", "переделка 3 соат") sozlash va yakunlash vaqti alohida o'lchanishi kerakligini ko'rsatadi → OEE Availability to'g'ri bo'ladi.
- **Manba:** v1-A + kitob (sozlash/qayta-ishlash izohlari, EP-MES-046/047 bilan bog'liq)
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), sessiya modeli, jonli monitoring

### EP-MES-002 · Bosqichlar avtomatmi yoki operator bosadimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** B/C — operator tugmasi bilan qo'lda (sensor bor mashinada keyin avto = aralash). Zavodda IoT sensor YO'Q (EP-MES-080), hozir hamma ma'lumot qo'lda; avto-aniqlash da'vosi haqiqatga zid.
- **Manba:** BARCHA_JAVOBLAR (IoT yo'q, qog'oz/Excel) + v2 Q50 (EP-MES-080) — qo'lda boshlash
- **action:** UPDATE
- **⤳ Ta'sir:** EP-MES-080 (IoT'siz boshlash), operator UI

### EP-MES-003 · Smena modelini aniqlash (3 smena standart)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 smena, soatlari sozlanadigan. Kun tartibi hujjati 12 soatlik smena beradi; kitobda smenalar A/B/C harf-nomi bilan (EP-MES-061). Hozirgi kod morning/afternoon/night → A/B/C + vaqt oralig'iga ko'chiriladi.
- **Manba:** kitob (Кун тартиби 12 soat + "А смена") + Q132/Q133 (smena orgsxemadan) + v1-A
- **action:** UPDATE
- **⤳ Ta'sir:** Hamma hisobot bo'linishi, EP-MES-061 (A/B/C nom), EP-MES-062 (doimiy biriktirish)

### EP-MES-004 · Brigada (jamoa) tushunchasini qo'shish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq brigada (a'zolar + brigadir + smena). Zavod formasi har stansiyaga operator + yordamchi(lar) yozadi (EP-MES-033); karton sexida jamoa ishlaydi.
- **Manba:** kitob (А смена tarkibi: Тураходжаев/Маматалиев/...; operator+yordamchi) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Bonus/reyting (jamoa), karta-model, EP-MES-033 (operator+yordamchi)

### EP-MES-005 · Brigada tarkibini kim belgilaydi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — brigadir smena boshida tizimda tasdiqlaydi (jonli holatga mos) + B element: HR doimiy A/B/C biriktirish bazadan keladi, kunlik o'zgarish (kasallik/ta'til) qayd. Kitob doimiy tarkib + rotatsiya beradi.
- **Manba:** v1-A + kitob (doimiy A-smena tarkibi, EP-MES-062)
- **action:** APPROVE
- **⤳ Ta'sir:** Davomat (HR), EP-MES-062, intizom

### EP-MES-006 · Material sarfini avtomatik norma bo'yicha yechish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** B — avto-hisob, lekin operator/usta tasdiqlaganda yechiladi (nazorat saqlanadi). Karton sexida material eng katta xarajat; tashqi IoT yo'q → tasdiq bosqichi xato sarfni bloklaydi. Keyin to'liq A (avto + GL) ga o'tiladi.
- **Manba:** v1 (A/B) + BARCHA_JAVOBLAR (sarf nazorati) + karta-model (real tannarx)
- **action:** EVENT
- **⤳ Ta'sir:** WMS (ombordan yechim), FIN/GL (tannarx), EP-MES-007 (norma manbai)

### EP-MES-007 · Norma manbai (texkarta) qayerdan keladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — texkarta/BOM yagona manba (PP modulidan), MES faqat o'qiydi. Kitob "Тех карта дубликатлари" oргполитikasi: asosiy texkarta = yagona ishonchli manba, dublikat taqiqlanadi.
- **Manba:** kitob (Тех карта дубликатлари сиёсати — yagona manba) + v1-A
- **action:** READ
- **⤳ Ta'sir:** PP (texkarta/routing), EP-MES-006 (avto-sarf), dublikat-taqiq

### EP-MES-008 · Norma chetlashuvini (haqiqiy vs norma) kuzatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har sessiyada farq% + smena/brigada jamlanma + ogohlantirish. Kitob "Заявка бумаги" rejalashtirilgan material ↔ haqiqiy sarf taqqoslashni talab qiladi (EP-MES-065); ortiqcha sarf = yashirin yo'qotish.
- **Manba:** kitob (Заявка бумаги rejani sarf bilan taqqos) + BARCHA_JAVOBLAR (yashirin yo'qotish) + v1-A
- **action:** READ
- **⤳ Ta'sir:** WMS, FIN (tannarx), EP-MES-065 (zayavka↔sarf)

### EP-MES-009 · SOS (favqulodda chaqiruv) oqimini aniqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bosqichli eskalatsiya (usta → bo'lim boshlig'i → direktor, vaqt o'tsa avto-ko'tariladi). Hujjat/eskalatsiya org-sxema bo'yicha yuradi (vertikal), sakramaydi.
- **Manba:** BARCHA_JAVOBLAR Q79-80/Q122 (org-sxema marshrut + eskalatsiya) + Q132 (smena roli orgsxemadan) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura (vertikal marshrut), NTF, CC, DIR

### EP-MES-010 · SOS sabab toifalari (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5-6 standart toifa + "boshqa" (izoh majburiy). Kitobda barcha to'xtash sabablari yozma + toifalanadi (material/texnologik/sifat/kadr/режа-хато/бошқа).
- **Manba:** kitob (smena-xulosa: 6 toifali sabab ajratish) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** SOS tahlili, EP-MES-011 (downtime kodlar), takror-sabab

### EP-MES-011 · Downtime (to'xtash) sabab kodlarini boyitish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — karton/qadoq sexiga xos to'liq kodlar (15-25 ta). Kitob aniq downtime sabablari beradi: changeover/настройка, qog'oz uzilishi, bo'yoq, qolib kechikishi (EP-MES-076), remont (EP-MES-078), ish-yo'q (EP-MES-066), переделka (EP-MES-075).
- **Manba:** kitob (sabab izohlari: настройка/переделка/ремонт/колиб/иш йук) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** OEE tahlil, EP-MES-066/075/076/078

### EP-MES-012 · Rejali vs rejasiz to'xtash ajratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har sababkodga rejali/rejasiz/sifat turi avtomatik biriktiriladi → to'g'ri OEE. Kun tartibi rejali to'xtashlarni (tanaffus/tushlik/namoz) aniq beradi (EP-MES-049/050/051).
- **Manba:** kitob (Кун тартиби rejali tanaffuslar + sabab toifalash) + v1-A
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), EP-MES-049/050/051, sabab master-data

### EP-MES-013 · Downtime'ni kim va qachon kiritadi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — operator darhol (boshlanishi qo'lda belgilanadi, sabab keyin) → jonli va aniq. IoT yo'q, lekin uzun to'xtash darhol kiritilsa jonli monitoring ishlaydi; aralash (C) ham maqbul.
- **Manba:** v1-A + EP-MES-080 (qo'lda kiritish)
- **action:** CREATE
- **⤳ Ta'sir:** Jonli monitoring, OEE, operator UI

### EP-MES-014 · OEE'ni qaysi darajada ko'rsatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — hamma darajada (mashina + smena + brigada + sex). Karta-modelda har birlik o'z GSD'siga ega; brigada bali bonus bilan bog'lanadi.
- **Manba:** v1-A + karta-model (har birlik GSD) + ShVB
- **action:** READ
- **⤳ Ta'sir:** Karta-model (GSD), bonus/reyting, dashboard

### EP-MES-015 · OEE maqsad (target) va ogohlantirish chegarasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har mashina/sexga alohida maqsad + kritik chegara. Kitob har stansiyaga aniq norma (Станоклар норма) va brak% (EP-MES-073) beradi → maqsad ham stansiya darajasida mantiqiy.
- **Manba:** v1-A + kitob (stansiya-darajali norma/brak%)
- **action:** UPDATE
- **⤳ Ta'sir:** Avto-signal, GSD bajarilishi, EP-MES-073

### EP-MES-016 · Jonli monitoring ekrani (sex tablosi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'liq jonli tablo (har mashina rangli holat + jonli OEE/miqdor). Kitob "kim hozir qaysi mashinada" jonli bandlik talabini beradi (EP-MES-073/EP-MES-043).
- **Manba:** v1-A + kitob (operator→mashina jonli jadval)
- **action:** READ
- **⤳ Ta'sir:** EP-MES-043 (jonli bandlik), EP-MES-017 (yangilanish tezligi)

### EP-MES-017 · Jonli yangilanish tezligi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** B — har 1-5 daqiqada yangilanish (yengil, IoT yo'q sharoitda yetarli). Operator qo'lda kiritgani uchun real-time push hozir ortiqcha yuk; SOS alohida darhol push.
- **Manba:** v1 (A/B) + EP-MES-080 (qo'lda kiritish konteksti)
- **action:** READ
- **⤳ Ta'sir:** Monitoring yuki, SOS (alohida darhol)

### EP-MES-018 · To'xtagan mashina avto-ogohlantirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avto-signal bosqichli (15 daq → usta, 30 daq → direktor). Uzoq to'xtash = katta yo'qotish; eskalatsiya org-sxema marshruti bilan mos (EP-MES-009).
- **Manba:** v1-A + EP-MES-009 (eskalatsiya) + org-sxema
- **action:** EVENT
- **⤳ Ta'sir:** NTF, org-sxema marshrut, jonli monitoring

### EP-MES-019 · Operator kartasiga ulash (karta-model)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har sessiya/brigada natijasi operator kartasiga yoziladi (GSD bajarilishi). Karta-model = asosiy vizyon; natija kartaga yozilmasa oylik/reyting/o'sish ishlamaydi.
- **Manba:** karta-model vizyon (MEMORY org_card_centric) + LOYIHA-BITGAN (karta poydevor) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** ⭐ ORG/KARTALAR (poydevor), oylik/reyting/o'sish, EP-MES-020/021

### EP-MES-020 · Operator GSD (ЦКП) ko'rsatkichi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bir nechta GSD (yaroqli miqdor + OEE + norma ichida sarf) vaznli ball. ShVB modelida har lavozimda statistik ko'rsatkich shart; zavod formasi "соф махсулот"ni asosiy beradi (EP-MES-064).
- **Manba:** v1-A + ShVB (GSD/ЦКП) + kitob (соф махсулот, EP-MES-064)
- **action:** READ
- **⤳ Ta'sir:** Karta-model, baholash, EP-MES-064

### EP-MES-021 · Razryad (malaka darajasi) va natija bog'lanishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — razryad normani va bahoni belgilaydi, MES natijasi razryad-o'sishga ta'sir qiladi. Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; 2021 ShVB mustaqil-ish ruxsati (EP-MES-052) razryad bilan bog'liq.
- **Manba:** v1-A + karta-model (razryad zanjiri) + kitob (2021 ShVB)
- **action:** READ
- **⤳ Ta'sir:** Karta-model, HR (razryad o'sishi), EP-MES-052/053

### EP-MES-022 · Brak (defekt) sababini toifalash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor brak-sabab toifalari + mas'ul bosqich. Kitob har brak holatini yozma sabab bilan beradi; OTK sifat hujjatlarini rasmiy qayd qiladi (5-departament sifat siyosati).
- **Manba:** kitob (ОТК sifat qaydlari + brak sabab izohlari) + QC moduli + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** QC moduli, Quality OEE, EP-MES-073 (brak%)

### EP-MES-023 · Smenadan smenaga topshirish (handover)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rasmiy handover yozuvi (tugamagan ish + nosozlik + izoh, keyingi smena tasdiqlaydi). Kitob: bajarilmagan reja kelingi kunga "sababsiz ko'chib qolmaydi", smena yakuni yozma xulosa bilan yopiladi.
- **Manba:** kitob (smena-xulosa oргполитика: yozma yakun, sabab ko'chmasligi) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Javobgarlik, EP-MES-079 (AI smena xulosasi), PP (reja tuzatish)

### EP-MES-024 · Ish topshirig'i (work order) MES'ga qanday tushadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rejadan (PP) avtomatik, operator ro'yxatdan tanlaydi → reja-fakt bog'liq. Kitob: operator "режалаштириш бўлимидан берилган режа асосида" ishlaydi; smena reja PP'dan avto-tuziladi (EP-MES-063).
- **Manba:** kitob (operator режа асосида ishlaydi + Режалаштириш marshrut) + v1-A + EP-MES-063
- **action:** EVENT
- **⤳ Ta'sir:** PP (reja), reja-fakt taqqoslash, EP-MES-063

### EP-MES-025 · Reja vs fakt (ishlab chiqarish bajarilishi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har order va smenada reja/fakt/farq% + sabab (kam bajarilsa). Kitob "Сменалик режани назорат" oргполitikasi: har kuni reja-bajarilish + bajarilmaslik sababi majburiy tahlil.
- **Manba:** kitob (smena-reja-nazorat oргполитika: reja/fakt/sabab) + А смена План formasi (режа/факт) + v1-A
- **action:** READ
- **⤳ Ta'sir:** GSD/smena bali, PP (kunlik tahlil), EP-MES-077 (majburiy sabab)

### EP-MES-026 · Smenani baholash (ball)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vaznli ball (OEE + reja-fakt + brak + sarf), sozlanadigan vazn (kodda MES_SCORE_MAX bor). Bitta tushunarli ball reyting/bonus uchun asos.
- **Manba:** v1-A + kod (MES_SCORE_MAX) + ShVB (statistik ball)
- **action:** READ
- **⤳ Ta'sir:** Reyting/bonus, karta-model, EP-MES-027

### EP-MES-027 · Bonus/reytingga ulanish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ball → A/B/C toifa → bonus avto-hisob (payroll bilan). ShVB modelida natija → reyting → bonus zanjiri bor; xodim kunlik hisoboti (Q116) oylik kartaga ulanadi.
- **Manba:** v1-A + ShVB (natija→reyting→bonus) + BARCHA_JAVOBLAR Q116/Q119 (xodim hisobot→oylik)
- **action:** EVENT
- **⤳ Ta'sir:** FIN/Payroll, karta-model, HR

### EP-MES-028 · AI ishlab chiqarish nazoratchisi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI jonli kuzatadi + kunlik hisobot + anomaliya signali (kodda mes-monitor/production-agent bor). 460 javob AI nazoratni qattiq talab qiladi (kunlik hisobot, anomaliya).
- **Manba:** BARCHA_JAVOBLAR (AI kamera production monitoring, kunlik hisobot) + kod (production-agent) + v1-A
- **action:** AI
- **⤳ Ta'sir:** AI moduli, EP-MES-079 (AI smena xulosasi), DIR (kunlik)

### EP-MES-029 · Materiallar partiyasini (lot) kuzatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har sessiyada ishlatilgan partiya/rulon yoziladi (traceability). Kitob "Заявка бумаги" rulon/format/папка bilan beradi; brak chiqsa qaysi material partiyasi/yetkazib beruvchini topish kerak.
- **Manba:** kitob (Заявка бумаги: рулон/папка) + BARCHA_JAVOBLAR (POS partiya/Code-128, FIFO/FEFO) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** WMS (partiya), QC (traceability), EP-MES-065/066 (qog'oz)

### EP-MES-030 · Texkarta amal qilinishi (adherence)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har bosqich belgilanadi (checklist) + chetlashuv qaydi. Kitob: texkarta xatosi/etishmasligi aniqlansa smena texnologi 15 daqiqada bosh texnologga xabar beradi → chetlashuv qayd shart.
- **Manba:** kitob (texkarta xatosi 15-daq xabar siyosati) + PP routing + v1-A
- **action:** UPDATE
- **⤳ Ta'sir:** QC (sifat standart), PP (routing), texnolog eskalatsiya

---

## II QISM — v2 (52 savol, kitob-grounded) — EP-MES-031..082

### EP-MES-031 · "А смена План" formasini ekranga aynan ko'chirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — formani aynan ustun-ma-ustun ko'chirish (smena → mashina → buyurtma satri). Zavod 5 yil shu forma bilan ishlaydi; tanish forma = usta o'rganishsiz ishlatadi.
- **Manba:** kitob (А смена План.xlsx haqiqiy forma) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** PP reja → MES forma → smena hisobot zanjiri

### EP-MES-032 · Reja vaqti vs fakt vaqtni 4 ALOHIDA maydonda saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 4 maydon to'liq (reja-boshlash / fakt-boshlash / reja-tugatish / fakt-tugatish). Forma reja va faktni yonma-yon yozadi → kechikish shu yerdan o'lchanadi.
- **Manba:** kitob (А смена План: ишни бошлаш/тугатиш режа+факт) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Kechikish tahlili, reja-fakt (EP-MES-025), OEE

### EP-MES-033 · Operator + Ёрдамчи juftligini har stansiyaga biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har stansiyaga 1 operator + N yordamchi roli (hissa har kimga to'g'ri). Forma har mashinaga операtor + ёрдамчи alohida yozadi (mas. ФСМ: Хужамбердиева + Холмирзаева). Sub-savol (yordamchi ulushi): 🔵 A-default = razryadga qarab (EP-MES-021 bilan mos).
- **Manba:** kitob (А смена План: Оператор/Ёрдамчи satrlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Oylik/reyting (yordamchi hissasi), karta-model, EP-MES-004

### EP-MES-034 · Normani SOATLIK + 12-SOATLIK ikki bazada saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asosiy = soatlik, 12-soatlik avto-hisob (×12 − tanaffuslar). Станоклар норма ikkala bazani beradi; bitta haqiqat uchun avto-hisob.
- **Manba:** kitob (Станоклар норма: норма штук 1час + за 12 часов) + Кун тартиби (12 soat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** EP-MES-049 (sof ish vaqti), norma master-data

### EP-MES-035 · Normaning o'lchov birligini stansiyaga qarab (м2/лист/штук/удар-лист)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har stansiya turining o'z birligi (м2/лист/дона/удар). Гофра = м2, печать = лист, ФСМ = штук, тигель = удар. Birlik tasdiqlangan master-data (EP-MES-082).
- **Manba:** kitob (Станоклар норма: ед.изм har stansiyaga) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Norma/bajarilish to'g'riligi, EP-MES-082 (tasdiqlangan birlik)

### EP-MES-036 · "иш йук" (ish yo'qligi) holatini downtime'dan ALOHIDA hisoblash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "ish yo'q" alohida tur, sababi rejalashtirishga yoziladi (operator aybsiz). Kitob: "ходимлар 3 соат иш йуклиги учун арчишда ишлади" — bu mashina nosozligi emas, режа-хато (smena-xulosa 6-toifa).
- **Manba:** kitob (Станоклар норма "иш йук" ustun + smena-xulosa режа-хато toifasi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** PP rejalashtirish GSD'si, sabab toifalash (EP-MES-010/011)

### EP-MES-037 · Ish-yo'q paytida xodimni boshqa ishga o'tkazishni qayd qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ish-yo'q vaqtiga "qaytarilgan ish" (archish/kadoklash/avtokarton) yoziladi → haqiqiy unum. Kitob aniq beradi: "иш йуклиги сабабли арчишда ишлаган / паддон кадоклаган / автокартонда ишлади".
- **Manba:** kitob (Станоклар норма izohlari: qayta-biriktirilgan ish) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Haqiqiy unum, EP-MES-044 (bir necha mashina), HR davomat

### EP-MES-038 · Ofset va Flekso bo'limini alohida normalash (НО 12-1 / НО 12-2)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Ofset / Flekso alohida bo'lim (o'z norma + НО-mas'ul + hisobot). Kitob: "отдел ОФСЕТ" (Махмудов 12-1) va "отдел ФЛЕКСО" (Юсупов 12-2) alohida norma jadvallari.
- **Manba:** kitob (Станоклар норма: ОФСЕТ/ФЛЕКСО alohida + НО-mas'ul) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura (НО lavozimlari), EP-MES-081 (НО-mas'ul), hisobot

### EP-MES-039 · Aniq mashina ro'yxatini master-data qilib kiritish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kitobdagi to'liq mashina ro'yxati (~30 ta) master-data. Резка, Гф линия, SM-52/SM-72/KBA-105, Трафарет/UV лак, Ламинация, кашировка, Автовысечка, Тигель 1-10, ФСМ, Окошка, Степлер, Эмбоссинг.
- **Manba:** kitob (Станоклар норма: aniq mashina ro'yxati) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Norma/OEE/sarf bog'lanishi, EP-MES-040 (tigel), EP-MES-042 (mashina×bo'lim)

### EP-MES-040 · Tigel pressini 1-10 raqamlangan alohida birlik qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har tigel (1-10) alohida birlik + turi (oddiy/тиснение/конгрев). Kitob Тигель 1..10 ni alohida satr qiladi; rejalovchi konkret tigelga ish beradi.
- **Manba:** kitob (Станоклар норма: Тигель 1-10 alohida) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Aniq yuklash/bandlik, EP-MES-039, jonli monitoring

### EP-MES-041 · Stansiyaga "keyingi ish" (очередь) ko'rsatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashinada joriy + navbatdagi 2-3 ish. Forma "Станокдаги Ишлар" + "кейинги иши" ustuni beradi; uzluksizlik uchun.
- **Manba:** kitob (А смена План: кейинги иши ustuni) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Uzluksizlik, EP-MES-038/039 (marshrut), PP

### EP-MES-042 · Bir mashina ikki bo'limda (Флексо vs Упаковка) ishlashini ajratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mashina + bo'lim (Flekso/Upakovka) birikmasi alohida birlik. Forma: "ФСМ Флексо" va "ФСМ ФЛЕКСО Упаковка", "Степлер ... ФЛЕКСО/УПАКОВКА".
- **Manba:** kitob (А смена План: mashina+bo'lim birikmasi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot aralashmasligi, EP-MES-038, EP-MES-045

### EP-MES-043 · "Kim hozir qaysi mashinada" jonli bandlik jadvali
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — jonli "operator → mashina" jadvali (band/bo'sh). Forma har operator ismini mashina yonida beradi (Холматов → Трафарет Лак); usta SOS/ish-yo'q'da kimni ko'chirishni bilishi kerak.
- **Manba:** kitob (А смена План: operator↔mashina) + v2-A + EP-MES-016
- **action:** READ
- **⤳ Ta'sir:** Tez qaror (ko'chirish), EP-MES-016 (monitoring), EP-MES-044

### EP-MES-044 · Bir operator bir vaqtda bir necha mashina yuritishini qayd qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — operator bir necha mashinaga (foiz/vaqt ulushi bilan). Forma: bitta operator bir necha tigel/stansiyani yuritadi (Холматов ikki normada).
- **Manba:** kitob (А смена План: bir operator ko'p stansiya) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Haqiqatga mos natija, EP-MES-040 (tigellar), EP-MES-033

### EP-MES-045 · Yakuniy qadoqlash (упаковка 1 сотрудник) ni alohida bosqich/norma qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qadoqlash alohida bosqich + norma (1 ishchi / 12 soat). Forma "упаковка (1 сотрудник)" alohida norma beradi.
- **Manba:** kitob (Станоклар норма: упаковка 1 сотрудник) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Oxirgi bosqich unumi, EP-MES-038 (marshrut tugashi)

### EP-MES-046 · "переделка" (qayta ishlash) ni alohida yo'qotish qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "qayta ishlash" alohida tur + sababi (qolib/sozlash/material) + soat. Kitob: "Колиб нотугри килинган - переделка 3 соат", "иш икки марта кайта урилган".
- **Manba:** kitob (Станоклар норма izohlari: переделка soat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Aniq yo'qotish, OEE, EP-MES-011, EP-MES-001 (hop3 yakunlash)

### EP-MES-047 · Qolib (shtamp/forma) tayyor emasligini downtime sababi qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "qolib/forma tayyor emas" alohida sabab kodi → KB/konstruktor bo'limiga ulanadi. Kitob: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат".
- **Manba:** kitob (Станоклар норма izohi: qolib kechikishi 4 soat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** KB/konstruktor signal, downtime kodlar (EP-MES-011), takror-sabab

### EP-MES-048 · Murakkab sozlash (настройка/приладка) ni alohida vaqt qilish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sozlash/приладка alohida bosqich + vaqti → OEE Availability to'g'ri. Kitob: "Билма заказ настройкаси муракаб - вакт кетди"; "настройка"/"приладка"/"Настройка лак" satrlar.
- **Manba:** kitob (Станоклар норма: настройка/приладка satrlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** OEE (Availability), EP-MES-001 (hop3 tayyorgarlik), EP-MES-014

### EP-MES-049 · Normani SOF ISH VAQTIGA hisoblash (tanaffus/tushlik/namoz chegirib)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — smenadan tanaffus/tushlik/namoz avto-chegiriladi → "sof ish vaqti" normaga asos. Kun tartibi aniq: tanaffus 10:00-10:20, tushlik 12:00-13:30, poldnik 16:00-16:20, namoz vaqtlari.
- **Manba:** kitob (Кун тартиби: aniq tanaffus vaqtlari) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** HR davomat + OEE Availability, EP-MES-034 (12-soatlik)

### EP-MES-050 · 3-smenali tushlikni navbat bilan boshqarish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — MES tushlik navbatini ko'rsatadi (1/2/3-to'lqin) → mashina to'xtamaydi. Kun tartibi: "3 сменалик тушлик 12:00-13:30 (хар бир смена учун 30 минут)".
- **Manba:** kitob (Кун тартиби: 3-smenali tushlik) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Unum (mashina to'xtamasligi), EP-MES-049, EP-MES-041 (tanaffus marker)

### EP-MES-051 · Namoz tanaffusini sof-ish-vaqtdan ajratib hisobga olish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — namoz vaqti sof-ish-vaqtdan chegiriladi (bittadan navbat). Kun tartibi: peshin 12:45 +20 daq, asr 18:00 +10 daq, shom 20:00 +10 daq, "битта одам учун".
- **Manba:** kitob (Кун тартиби: namoz vaqtlari + bittadan) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Adolat + hurmat, EP-MES-049 (sof ish vaqti)

### EP-MES-052 · Mustaqil ishlash ruxsati = MES operatorlik huquqi (2021 ShVB siyosati)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat "mustaqil ruxsat" bayrog'i bor xodim sessiya ochadi (mashina turi bo'yicha). 2021 hujjat: 2 oy amaliy + nazariy/amaliy imtihon + РД-4 yozma xulosa.
- **Manba:** kitob (2021 ShVB mustaqil-ish siyosati: imtihon + РД-4) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** HR onboarding (устоз + imtixon) → MES operator huquqi, EP-MES-053/054

### EP-MES-053 · Ustoz-shogird (мураббий) bog'lanishini MES'da ko'rsatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — shogird sessiyasi "ustoz nazoratida" + natija ikkalasiga (o'qish davri). 2021 hujjat: yangi xodimga Мураббий biriktiriladi (buyruqda, 2 oy birga).
- **Manba:** kitob (2021 ShVB: Мураббий 2 oy) + BARCHA_JAVOBLAR Q145 (kasbiy usta mentor) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR mentorlik + razryad o'sishi (EP-MES-021), adolatli baho

### EP-MES-054 · Operator × mashina malaka matritsasi (qaysi mashinada ishlay oladi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — operator × mashina matritsasi (ishlay oladi / o'rganmoqda / yo'q). ShVB onboarding "mashina turi bo'yicha" amaliy imtihon → har mashinaga alohida huquq.
- **Manba:** kitob (2021 ShVB: mashina turi bo'yicha imtihon) + BARCHA_JAVOBLAR Q135 (SkillsMatrix) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** To'g'ri biriktirish (brak/xavf kamayadi), EP-MES-052, HR Skills

### EP-MES-055 · "Согласовано РД-4 / Утверждено Ген.Директор" tasdiq zanjirini normaga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma o'zgarishi РД-4 kelishuvi + direktor tasdig'idan o'tadi (versiya saqlanadi). Станоклар норма oxirida "Согласовано РД-4 (Юлчиев) + Утверждено Ген.Директор (Позилов)".
- **Manba:** kitob (Станоклар норма: ikki-bosqichli imzo) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Norma nazorati + tarix, EP-MES-056 (versiya), org-sxema tasdiq

### EP-MES-056 · Norma versiyasi va sanasini saqlash ("Дата: 13.01.2022")
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma versiyalanadi (amal sanasi bilan). Станоклар норма "НО 12-2, Дата 13.01.2022" sanasi bilan tasdiqlanadi; o'tgan smena o'sha paytdagi norma bilan baholanadi.
- **Manba:** kitob (Станоклар норма: sana + НО raqami) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Tarix to'g'riligi, EP-MES-055, o'tmish-baholash

### EP-MES-057 · Mahsulot kodlash formatini saqlash (2025-3499 / KT4438 / папка)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq struktura (yil-raqam / папка / KT-kod / o'lcham / marka) alohida maydonlar. Kitob: "2025-3499 Barbol ... 33.5x24.5x12.5/17815/KT4438/T-24 marka"; usta KT4438 deb qidiradi.
- **Manba:** kitob (А смена План: buyurtma identifikatori) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD buyurtma ↔ PP папка ↔ MES smena bog'lanishi, qidiruv

### EP-MES-058 · "Укишга" / "Академияга" — o'quv ishlarini real natijadan ajratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "o'quv/Akademiya" alohida ish turi (real natijaga qo'shilmaydi). Forma "Укишга"/"Академияга" satr/ustun beradi; o'quv braki/normasi haqiqiyga qo'shilmaydi.
- **Manba:** kitob (А смена План: Укишга/Академияга) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Toza unum/tannarx hisobi, LMS (o'quv), EP-MES-053 (shogird)

### EP-MES-059 · Gofra (2/5 qatlam) ishini м2 + qatlam bilan alohida hisoblash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — gofra liniyasi м2 + qatlam soni alohida (to'g'ri o'lchov + material). Forma "ЛИНИЯ 5 слой", "Формат гофро (2-слой)", "Гф линия (м2)". Kitob izohi: 5/3-qatlam aralashtirib yuborilishi (logistika xatosi) misol.
- **Manba:** kitob (А смена План + 5/3 qatlam logistika misoli) + v2-A + EP-MES-035 (м2)
- **action:** CREATE
- **⤳ Ta'sir:** To'g'ri o'lchov+material, EP-MES-029 (lot), WMS (qog'oz qatlam)

### EP-MES-060 · "умумий сон / Брак сони / Соф махсулот" uchligini saqlash + avto-tekshirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — umumiy + brak + sof (avto-tekshiriladi: sof = umumiy − brak). Forma uch sonni beradi; Quality OEE shu uchlikdan hisoblanadi.
- **Manba:** kitob (А смена План: умумий/брак/соф) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Quality OEE, EP-MES-022 (brak), EP-MES-020 (GSD = соф)

### EP-MES-061 · Smenani A/B/C harf-nomi bilan saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — smena = A/B/C harf + vaqt oralig'i (sozlanadigan). Kitobda smenalar "А смена", "Б", "С" harf bilan; brigada doimiy A/B/C ga biriktirilgan. Hozirgi morning/afternoon/night → A/B/C.
- **Manba:** kitob ("А смена" nomi) + v2-A + EP-MES-003
- **action:** UPDATE
- **⤳ Ta'sir:** Zavod tiliga moslik, EP-MES-062 (doimiy biriktirish)

### EP-MES-062 · Brigadani doimiy A/B/C smenaga biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — brigada → doimiy smena (A/B/C) + kunlik o'zgarish (kasallik/ta'til) qayd. Kitob "А смена" doimiy operatorlar bilan (Тураходжаев/Маматалиев/Неъматов/Ходжаев).
- **Manba:** kitob (А смена doimiy tarkib) + v2-A + EP-MES-005
- **action:** CREATE
- **⤳ Ta'sir:** Davomat + barqaror baho, EP-MES-005 (tarkib), HR

### EP-MES-063 · Smena reja-formasini smena BOSHIDA avto-tuzish (планировщик Исаков)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — MES smena boshida reja-formani avto-tuzadi (PP rejasidan) + bosib chiqariladi. Hozir Excel'da qo'lda (Режалаштириш ходими Исаков); avto-tuzish reja-faktni avto-bog'laydi. Davriy: avval B (qo'lda MES'da), keyin A (avto).
- **Manba:** kitob (А смена План qo'lda tuziladi) + v2 (A/B) + EP-MES-024 (PP avto)
- **action:** CREATE
- **⤳ Ta'sir:** PP (reja), planlovchi vaqti, reja-fakt avto-bog'lanish

### EP-MES-064 · "Режалаштириш ходими" + "Технолог" imzosini smenaga biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har smena rejasiga planlovchi + texnolog (mas'ul). Forma "Режалаштириш ходими: Исаков" + "Технолог: Ёкубжонов/Аслонов" imzolari; imzosiz reja egasiz.
- **Manba:** kitob (А смена План: planlovchi+texnolog imzo) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Javobgarlik aniq, org-sxema (lavozim kartasi), EP-MES-081

### EP-MES-065 · Qog'oz zayavkasini (Заявка бумаги) MES sarfiga bog'lash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — zayavka → MES haqiqiy sarf → farq (ortiqcha/kam). Заявка бумаги (Формат/Грам/Кг/Лист размер/Папка/заказ) = rejalashtirilgan material; MES = haqiqiy sarf.
- **Manba:** kitob (Заявка бумаги.xlsx) + v2-A + EP-MES-008
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (qog'oz zayavkasi) ↔ MES sarf ↔ tannarx, WMS

### EP-MES-066 · Qog'oz formati (лист размер А×В) + grammni sessiyaga yozish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sessiyada format (А×В) + gramm + kg yoziladi (aniq material sarfi). Заявка бумаги "Формат/Грам/Лист размер А/В" beradi.
- **Manba:** kitob (Заявка бумаги: format/gramm/kg) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Aniq material sarfi (kg), EP-MES-065, EP-MES-059 (gofra)

### EP-MES-067 · "Прошло (дней)" — buyurtma necha kun kutganini ko'rsatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har buyurtmada "necha kun kutdi" + muddat-oshgan ranglanadi. Заявка бумаги "Прошло (дней)" beradi; uzoq kutgan = mijoz norozi xavfi.
- **Manba:** kitob (Заявка бумаги: Прошло дней) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Kechikish ko'rinishi, EP-MES-068 (shoshilinch), SD/mijoz

### EP-MES-068 · "Зарур заказлар" (shoshilinch) ni navbatda oldinga chiqarish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — shoshilinch bayroq + navbatda yuqoriga + signal. Forma "ЗАРУР ЗАКАЗЛАР" alohida ro'yxat beradi.
- **Manba:** kitob (А смена План: ЗАРУР ЗАКАЗЛАР) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Muddat saqlanishi, EP-MES-041 (navbat), PP prioritet

### EP-MES-069 · Bitta buyurtmaning mashinalararo marshrutini kuzatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — buyurtma marshruti (qaysi mashina/bosqich/qancha tayyor) jonli. Forma ketma-ketlik beradi: Печать → Ламинация → Высечка → Тигель → ФСМ → Степлер → Упаковка. Kitob: "ярим тайёр маҳсулотни ... участкага етказиб берди".
- **Manba:** kitob (А смена План marshrut + ярим тайёр logistika) + v2-A
- **action:** READ
- **⤳ Ta'sir:** PP routing ↔ MES bosqich ↔ buyurtma holati, EP-MES-070

### EP-MES-070 · Bosqichlararo yarim tayyor qoldiqni (bottleneck) ko'rsatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har bosqich oraliq qoldig'i (kutayotgan yarim tayyor) ko'rsatiladi → bottleneck ko'rinadi. Kitob: ichki logistika yarim tayyorni o'z vaqtida yetkazsa dastgoh to'xtamaydi.
- **Manba:** v2-A + kitob (ярим тайёр/ички логистика) + EP-MES-069
- **action:** READ
- **⤳ Ta'sir:** Bottleneck ko'rinishi, WMS (yarim tayyor), ichki logistika

### EP-MES-071 · Tanaffus markerini (УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК) jadvalda avto-ko'rsatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tanaffus markerlari jadvalda avto-ko'rinadi + normadan chegiriladi (EP-MES-049/050 bilan). Forma vaqt jadvalida "УЖИН/ОБЕД/Тушлик/ПОЛДНИК" markerlarini beradi.
- **Manba:** kitob (А смена План tanaffus markerlari + Кун тартиби) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Norma + jonli kuzatuv tanaffusni hisobga oladi, EP-MES-049/050

### EP-MES-072 · Soatlik normaning aniq pog'onalarini saqlash (400/500/600/1000/1500...)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma mahsulot/murakkablik bo'yicha pog'onali (mashina × ish turi). Forma "1 соатлик норма" 400-3000 oralig'ida beradi; oddiy korobka 1500, murakkab 400. Sub-savol (murakkablikni kim belgilaydi): 🔵 A-default = texnolog texkartada (EP-MES-007 yagona manba bilan mos).
- **Manba:** kitob (А смена План: pog'onali norma) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Adolatli baho, EP-MES-007 (texkarta), EP-MES-034 (norma baza)

### EP-MES-073 · Brak%ni stansiya bo'yicha normalash ("брак %")
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashinaga maqbul brak% + oshganda signal. Станоклар норма har stansiyaga "брак %" beradi; kesimda 1%, lakda 5% bo'lishi mumkin.
- **Manba:** kitob (Станоклар норма: брак %) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Adolatli sifat nazorati, QC, EP-MES-022/060

### EP-MES-074 · "ко-во работ" (bir smenada nechta turli ish) ko'rsatkichi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — smenada ish soni + har biriga sozlash vaqti (sozlash yo'qotishini ko'rsatadi). Станоклар норма "ко-во работ" beradi; ko'p mayda ish = ko'p changeover.
- **Manba:** kitob (Станоклар норма: ко-во работ) + v2-A + EP-MES-048 (sozlash)
- **action:** READ
- **⤳ Ta'sir:** Sozlash yo'qotishi tahlili, EP-MES-048, OEE

### EP-MES-075 · "переделка" qayta ishlash sabab izohi (kitob izoh madaniyati)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — переделка alohida yo'qotish turi sifatida (EP-MES-046 bilan birga), sabab izohi bilan. Kitob izoh madaniyati: har yo'qotishga sabab yozilgan.
- **Manba:** kitob (Станоклар норма izohlari) + v2 (EP-MES-046 davomi)
- **action:** CREATE
- **⤳ Ta'sir:** EP-MES-046 (qayta ishlash), EP-MES-077 (majburiy sabab)

### EP-MES-076 · Qolib kechikishi sabab kodi (kitob izohi davomi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "qolib/forma tayyor emas" takrorlanuvchi sabab → KB bo'limiga signal (EP-MES-047 bilan birga). Kitob 4-soatlik takror yo'qotishni beradi.
- **Manba:** kitob (Станоклар норма: qolib kechikishi) + v2 (EP-MES-047 davomi)
- **action:** CREATE
- **⤳ Ta'sir:** KB/konstruktor signal, EP-MES-047, takror-sabab tahlili

### EP-MES-077 · Norma bajarilmasa MAJBURIY sabab so'rash (kitobdagi izoh madaniyati)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma < chegara bo'lsa sabab majburiy (tayyor ro'yxat + izoh). Kitob smena-xulosa oргполитikasi: har bajarilmaslik sabab bilan yozilishi shart, og'zaki rad etiladi. Sub-savol (kim tasdiqlaydi): 🔵 A-default = usta tasdiqlaydi (NO-mas'ul ko'radi — EP-MES-081).
- **Manba:** kitob (smena-reja-nazorat oргполитика: majburiy sabab) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Adolatli baho + takror muammo, EP-MES-010/011, EP-MES-079

### EP-MES-078 · Mashina remonti ("ремонтда") ni ishonchlilik hisobi bilan
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "remont" alohida tur (rejali/avariya) + mashina ishonchliligi hisobi → profilaktikaga asos. Kitob izohi "ремонтда"; qaysi mashina ko'p buziladi ko'rinishi kerak.
- **Manba:** kitob (Станоклар норма izohi: ремонтда) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Profilaktika rejasi, downtime kodlar (EP-MES-011), IoT/aktiv

### EP-MES-079 · AI kunlik smena xulosasi (kitobdagi sabab izohlaridan)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI kunlik xulosa (top yo'qotish + brigada reytingi + takror sabab + tavsiya). Kitob smena-xulosa oргполитikasi aynan shu maqsadda; 460 javob AI kunlik hisobotni talab qiladi; egasi har Excel'ni o'qiy olmaydi.
- **Manba:** kitob (smena-xulosa oргполитика + Совершенствование tahlil) + BARCHA_JAVOBLAR (AI kunlik) + v2-A
- **action:** AI
- **⤳ Ta'sir:** AI nazoratchi ↔ egaga kunlik hisobot ↔ org-baholash, EP-MES-028

### EP-MES-080 · IoT'siz, faqat operator kiritishi bilan ishga tushirish (Excel → MES)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq qo'lda kiritish (sensor shart emas) + keyin IoT qo'shilsa avtomatik. Zavodda hozir IoT sensor yo'q, hamma ma'lumot qo'lda Excel'ga; qo'lda ishlaydigan qilib qurilsa darhol foydalanish boshlanadi.
- **Manba:** BARCHA_JAVOBLAR (IoT yo'q, Excel) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Bugundan ishlash, EP-MES-002 (qo'lda bosqich), EP-MES-013/017

### EP-MES-081 · НО 12-1 / НО 12-2 mas'ulini (Юсупов/Махмудов) hisobotга biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har bo'lim hisobotiga НО-mas'ul (lavozim kartasi) biriktiriladi → javobgarlik + eskalatsiya. Станоклар норма mas'ullar beradi (НО 12-2: Юсупов, НО 12-1: Махмудов).
- **Manba:** kitob (Станоклар норма: НО-mas'ullar) + Q132/Q133 (smena roli orgsxemadan) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** Org-struktura (НО lavozimlari) ↔ MES hisobot egasi, EP-MES-038/064

### EP-MES-082 · Tasdiqlangan o'lchov birligini master-data qilish ("ед.изм" RD-4 + direktor)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — stansiya × tasdiqlangan birlik master-data (РД-4 + direktor). Birlik har joyda bir xil (norma/sarf/hisobot bir tilda); Станоклар норма "ед.изм" tasdiq bilan beradi.
- **Manba:** kitob (Станоклар норма: ед.изм + РД-4/direktor imzo) + v2-A + EP-MES-035/055
- **action:** CREATE
- **⤳ Ta'sir:** Yagona o'lchov tili, EP-MES-035 (stansiya birligi), EP-MES-055 (tasdiq)

---

DONE: MES — 82 (javoblangan 33, ochiq 49).
