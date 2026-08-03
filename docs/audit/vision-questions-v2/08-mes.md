# MES / Ishlab chiqarish — YANGI (kitob-grounded) savollar

> 2026-06-08 · Egasi bilan intervyu. Manba = zavodning HAQIQIY 2020-2022 hujjatlari:
> "А смена План.xlsx" (smena reja-formasi), "Станоклар норма.xlsx" (dastgoh normalari),
> "Заявка бумаги.xlsx" (qog'oz zayavkasi), "Ишлаб чиқариш ходимларини мустақил иш фаолиятларини
> бошлаш тартиби" (2021 ShVB siyosati), "Кун тартибини назорат қилиш тартиби" (2020 kun tartibi).
> Bu savollar HAR BIRI kitobdagi aniq qator/maydonga bog'langan — umumiy "smena jurnali / brigada /
> OEE / norma / peresmenka" tushunchalarini TAKRORLAMAYDI (ular `vision-questions/08-mes.md` da bor).
> Bu yerda faqat zavod formasidan kelib chiqqan AYNAN tafsilotlar.

---

### Q1. "А смена План" formasini ekranga aynan ko'chirish
**Nima:** Zavoddagi "А смена План.xlsx" reja-formasini MES ekraniga aynan o'sha tartibda olib kirish (Буюртма раками ва номи → Бажариладиган сон → Режани бажаришга кетадиган вакт → Ишни бошлаш/тугатиш вакти → факт).
**Nega kerak:** Zavod 5 yildan beri aynan shu forma bo'yicha ishlaydi; ekran shu formaga o'xshasa usta o'rganishsiz ishlatadi, butunlay yangi forma kiritsangiz qarshilik bo'ladi.
**Variantlar:**
- A) Formani aynan ustun-ma-ustun ko'chirish (smena → mashina → buyurtma satri) — eng tanish, tez qabul
- B) Soddalashtirilgan yangi forma — chiroyli, lekin usta qaytadan o'rganadi
- C) Keyin — hozircha mavjud MES forma qoladi
⤳ Ta'sir: PP reja → MES forma → smena hisobot zanjiri

### Q2. Reja vaqti vs fakt vaqtni 4 ALOHIDA maydonda saqlash
**Nima:** Formada "Ишни бошлаш вакти (режа)" / "ишни бошлади (факт)" / "Ишни тугатиш вакти (режа)" / "Ишни тухтатди хакикатда (факт)" — 4 ta alohida vaqt.
**Nega kerak:** Zavod formasi reja va fakt vaqtni yonma-yon yozadi — kechikishni (rejadan necha daqiqa kech boshlandi/tugadi) shu yerdan o'lchaydi; bitta start/stop qoldirsangiz tahlil yo'qoladi.
**Variantlar:**
- A) 4 maydon to'liq (reja-boshlash/fakt-boshlash/reja-tugatish/fakt-tugatish) — kechikish aniq
- B) Faqat fakt boshlash/tugatish — yengil, reja bilan taqqoslab bo'lmaydi
- C) Keyin — bitta start/stop yetadi

### Q3. Operator + Ёрдамчи juftligini har stansiyaga biriktirish
**Nima:** Formada har mashina satrida "Оператор:___" va "Ёрдамчи:___" alohida (ko'pincha 1 operator + 1-3 yordamchi: masalan ФСМ да Хужамбердиева Н + Холмирзаева М). MES shu juftlikni saqlasinmi.
**Nega kerak:** Karton sexida yordamchi (kashirovka, sklейка) ishning yarmini bajaradi; faqat operatorni yozsangiz yordamchi mehnati ko'rinmaydi, oylik/reyting noto'g'ri.
**Variantlar:**
- A) Har stansiyaga 1 operator + N yordamchi roli — hissa har kimga to'g'ri yoziladi
- B) Faqat operator + "yordamchilar soni" (ismsiz) — yengil, yordamchi hissasi yo'q
- C) Keyin — faqat operator
  ↳ Agar A: yordamchi natijaning necha %ini oladi? (A) teng B) operator 60/yordamchi 40 C) razryadga qarab)

### Q4. Normani SOATLIK + 12-SOATLIK ikki bazada saqlash
**Nima:** "Станоклар норма" da ham "норма штук 1час", ham "норма штук за 12 часов" bor. MES normani ikkala bazada saqlasinmi.
**Nega kerak:** Smena = 12 soat (kun tartibi hujjati), lekin soatlik norma jonli kuzatuvga kerak; zavod ikkalasini ham yozadi.
**Variantlar:**
- A) Asosiy = soatlik, 12-soatlik avto-hisob (×12 − tanaffuslar) — bitta haqiqat
- B) Ikkalasi qo'lda — moslashuvchan, nomuvofiq xavfi
- C) Keyin — bitta umumiy norma

### Q5. Normaning o'lchov birligini stansiyaga qarab (м2/лист/штук/удар-лист)
**Nima:** Kitobda har stansiya o'z birligida: Гофра линия = **м2**, печать = **лист**, ФСМ/склейка = **штук/дона**, тиснение/тигель = **удар/лист** (zarba). MES birligi stansiyaga bog'liq bo'lsinmi.
**Nega kerak:** Tigel pressi "udar" (zarba), печать "лист" bilan o'lchanadi; hammaga "dona" qo'ysangiz norma/bajarilish noto'g'ri.
**Variantlar:**
- A) Har stansiya turining o'z birligi (м2/лист/дона/удар) — to'g'ri o'lchov
- B) Hammaga "dona" + koeffitsient — sodda, chalkash
- C) Keyin — birlik ahamiyatsiz

### Q6. "иш йук" (ish yo'qligi) holatini downtime'dan ALOHIDA hisoblash
**Nima:** Normalar jadvalida "**иш йук**" alohida ustun (operator bor, ish topshirilmagan). Buni mashina to'xtashidan ALOHIDA "ish yo'q" turi qilish.
**Nega kerak:** Izohda "ходимлар 3 соат иш йуклиги учун арчишда ишлади" — bu mashina nosozligi emas, REJALASHTIRISH kamchiligi; aralashtirsa kim aybdor (planlovchi vs mashina) ko'rinmaydi.
**Variantlar:**
- A) "Ish yo'q" alohida tur — sababi rejalashtirishga yoziladi (operator aybsiz) — adolatli
- B) Oddiy to'xtashga qo'shish — sodda, ayb chalkashadi
- C) Keyin — faqat to'xtash
⤳ Ta'sir: PP rejalashtirish sifatining GSD'si (necha soat ish-yo'q bo'ldi)

### Q7. Ish-yo'q paytida xodimni boshqa ishga o'tkazishni qayd qilish
**Nima:** Kitobda "иш йуклиги сабабли арчишда ишлаган", "паддон кадоклаган", "автокартонда ишлади" — ish bo'lmaganda xodim ko'chiriladi. MES shu ko'chishni yozsinmi.
**Nega kerak:** Xodim bekor turmagan, boshqa ish bajargan — bu unumini to'g'ri ko'rsatadi; yozmasangiz "bekor turdi" deb noto'g'ri.
**Variantlar:**
- A) Ish-yo'q vaqtiga "qaytarilgan ish" (archish/kadoklash/avtokarton) yoziladi — haqiqiy unum
- B) Faqat "ish yo'q" belgilanadi, qayerga ko'chgani yozilmaydi — yengil
- C) Keyin — kuzatilmaydi

### Q8. Ofset va Flekso bo'limini alohida normalash (НО 12-1 / НО 12-2)
**Nima:** Kitobda "отдел ОФСЕТ" va "отдел ФЛЕКСО" alohida norma jadvallari (har biri o'z НО-mas'uli bilan: Юсупов Ильдар = 12-2, Махмудов = 12-1). MES ikki bo'lim alohida bo'lsinmi.
**Nega kerak:** Ofset (SM-52/SM-72/KBA-105) va Flekso butunlay boshqa mashina/jarayon/norma; bitta umumiy hisobotга qo'ysangiz solishtirib bo'lmaydi.
**Variantlar:**
- A) Ofset / Flekso alohida bo'lim — har biri o'z norma + НО-mas'ul + hisobot — real tuzilma
- B) Bitta umumiy "bosma" bo'limi — sodda, aralash
- C) Keyin — bo'lim ajratilmaydi

### Q9. Aniq mashina ro'yxatini master-data qilib kiritish
**Nima:** Kitobdagi aniq mashinalar: Резка, Гф линия, SM-52, SM-72, KBA-105, Трафаретный Лак, UV лакировка, Ламинация, Авто/полуавтомат/ручная кашировка, Автовысечка картон/гофра, Тигель 1-10, ФСМ большой/полуавтомат, Окошка, Степлер, Эмбоссинг. Shu ro'yxat master-data bo'lsinmi.
**Nega kerak:** "Mashina" bo'sh ro'yxat bo'lsa har usta har xil nom yozadi; aniq ro'yxat normani, OEE'ni, sarfni bog'laydi.
**Variantlar:**
- A) Kitobdagi to'liq mashina ro'yxati (~30 ta) master-data — bitta haqiqat
- B) Faqat asosiy 8-10 mashina — yengil, kichik mashinalar yo'q
- C) Keyin — mashina erkin matn

### Q10. Tigel pressini 1-10 raqamlangan alohida birlik qilish
**Nima:** Kitobda Тигель 1 dan Тигель 10 gacha har biri ALOHIDA satr (ba'zilari "тиснение"/"конгрев"). Har tigel alohida mashinami yoki bitta "tigel guruhi"mi.
**Nega kerak:** Har tigel o'z operatori/normasi/yuklamasi bilan ishlaydi; bittaga yig'sangiz qaysi tigel bo'sh/band ko'rinmaydi (rejalovchi tigel 5 ga ish bera olmaydi).
**Variantlar:**
- A) Har tigel (1-10) alohida birlik + turi (oddiy/тиснение/конгрев) — aniq yuklash
- B) Bitta "Tigellar" guruhi + soni — sodda, individual ko'rinmaydi
- C) Keyin — tigel yagona

### Q11. Stansiyaga "keyingi ish" (очередь) ko'rsatish
**Nima:** Formada "Станокдаги Ишлар" va "кейинги иши" (navbatdagi ish) ustuni. MES har mashinada joriy + keyingi ishni ko'rsatsinmi.
**Nega kerak:** Operator joriy ishni tugatishi bilan keyingisini bilsa to'xtamasdan o'tadi; ko'rinmasa ustani kutadi, vaqt yo'qoladi.
**Variantlar:**
- A) Har mashinada joriy + navbatdagi 2-3 ish — uzluksizlik
- B) Faqat joriy ish — sodda
- C) Keyin — navbat ko'rsatilmaydi

### Q12. Soatlik normaning aniq pog'onalarini saqlash (400/500/600/1000/1500...)
**Nima:** Formada "1 соатлик норма": 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000 лист/дона — mahsulot murakkabligiga bog'liq.
**Nega kerak:** Bir mashinada norma ish turiga qarab o'zgaradi (oddiy korobka 1500, murakkab 400); bitta o'rtacha norma adolatsiz baho beradi.
**Variantlar:**
- A) Norma mahsulot/murakkablik bo'yicha pog'onali (mashina × ish turi) — adolatli
- B) Bitta o'rtacha norma — sodda, qo'pol
- C) Keyin — norma taxminiy
  ↳ Agar A: murakkablikni kim belgilaydi? (A) texnolog texkartada B) usta smenada C) AI o'tmishdan)

### Q13. Brak%ni stansiya bo'yicha normalash ("брак %")
**Nima:** Kitobda har stansiyaga "брак %" maqbul foizi bor. MES har mashinaga ruxsat etilgan brak% chegarasini saqlasinmi.
**Nega kerak:** Kesimda 1% normal, lakda 5% bo'lishi mumkin; bitta umumiy chegara ba'zi mashinani noto'g'ri "yomon" qiladi.
**Variantlar:**
- A) Har mashinaga maqbul brak% + oshganda signal — adolatli sifat nazorati
- B) Butun sexga bitta brak% chegarasi — sodda
- C) Keyin — chegarasiz

### Q14. "ко-во работ" (bir smenada nechta turli ish) ko'rsatkichi
**Nima:** Normalar jadvalida "ко-во работ" bor — bir smenada nechta turli buyurtma/sozlash bo'lgani.
**Nega kerak:** Ko'p mayda ish = ko'p sozlash (changeover) = unum past; bu ko'rsatkich nima uchun smena sekin ketganini tushuntiradi.
**Variantlar:**
- A) Smenada ish soni + har biriga sozlash vaqti — sozlash yo'qotishini ko'rsatadi
- B) Faqat ishlar soni — yengil
- C) Keyin — kuzatilmaydi

### Q15. "переделка" (qayta ishlash) ni alohida yo'qotish qilish
**Nima:** Kitob izohi: "Колиб нотугри килинган - переделка 3 соат", "иш икки марта кайта урилган". Qayta ishlash vaqtini alohida yozish.
**Nega kerak:** Qayta ishlash brak ham, normal ish ham emas — yo'qotilgan vaqt; ajratmasa unum noto'g'ri yuqori va aybdor (qolib/sozlash) ko'rinmaydi.
**Variantlar:**
- A) "Qayta ishlash" alohida tur + sababi (qolib/sozlash/material) + soat — aniq yo'qotish
- B) Oddiy ishga qo'shish — sodda, yashirinadi
- C) Keyin — kuzatilmaydi

### Q16. Qolib (shtamp/forma) tayyor emasligini downtime sababi qilish
**Nima:** Kitob izohi: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". Qolib/forma kech tayyor bo'lishini alohida to'xtash sababi qilish.
**Nega kerak:** Bu tez-tez 4 soatlik yo'qotish; alohida sabab kodi "qolib kechikishi" takrorlanayotganini ko'rsatib KB/konstruktor bo'limiga signal beradi.
**Variantlar:**
- A) "Qolib/forma tayyor emas" alohida sabab kodi — KB bo'limiga ulanadi
- B) Umumiy "material kutish" ichida — yengil, aniq emas
- C) Keyin — erkin izoh

### Q17. Murakkab sozlash (настройка/приладка) ni alohida vaqt qilish
**Nima:** Kitob izohi: "Билма заказ настройкаси муракаб - вакт кетди"; formada "настройка"/"приладка"/"Настройка лак" alohida satrlar. Sozlash vaqtini ish vaqtidan ajratish.
**Nega kerak:** Sozlash = ishlab chiqarmagan vaqt (OEE Availability); ish vaqtiga qo'shsangiz unum past ko'rinadi, uzun sozlash yashiriladi.
**Variantlar:**
- A) Sozlash/приладка alohida bosqich + vaqti — OEE to'g'ri
- B) Ishga qo'shish — sodda, yashirinadi
- C) Keyin — ajratilmaydi

### Q18. Mashina remonti ("ремонтда") ni ishonchlilik hisobi bilan
**Nima:** Kitob izohi: "ремонтда". Remont sababli to'xtashni alohida tur + qaysi mashina ko'p buziladi hisobi.
**Nega kerak:** Ajratmasa mashina ishonchliligi (qaysi mashina ko'p remontda) ko'rinmaydi, profilaktika rejasi tuzilmaydi.
**Variantlar:**
- A) "Remont" alohida tur (rejali/avariya) + mashina ishonchliligi hisobi — profilaktikaga asos
- B) Umumiy mexanik to'xtash — yengil
- C) Keyin — erkin izoh

### Q19. Normani SOF ISH VAQTIGA hisoblash (tanaffus/tushlik/namoz chegirib)
**Nima:** Kun tartibi: tanaffus 10:00-10:20, tushlik 12:00-13:30 (har smena 30 daq), poldnik 16:00-16:20, namoz vaqtlari. MES normani hisoblashda bularni chegirsinmi.
**Nega kerak:** 12 soat − ~1.5 soat tanaffus = ~10.5 soat real ish; normani 12 soatga hisoblasangiz operator hech qachon bajarmaydi (adolatsiz).
**Variantlar:**
- A) Smenadan tanaffus/tushlik/namoz avto-chegiriladi → "sof ish vaqti" normaga asos — adolatli
- B) Norma 12 soatga, tanaffus hisobga olinmaydi — sodda, nohaq
- C) Keyin — tanaffus e'tiborsiz
⤳ Ta'sir: HR davomat + OEE Availability

### Q20. 3-smenali tushlikni navbat bilan boshqarish
**Nima:** Kun tartibida "3 сменалик тушлик 12:00-13:30 (хар бир смена учун 30 минут)" — tushlik 3 to'lqinda. MES kim qachon tushlikka chiqishini navbatlasinmi.
**Nega kerak:** Hamma birvarakay chiqsa mashina to'xtaydi; navbat bilan chiqsa to'xtamaydi — unumga to'g'ridan-to'g'ri ta'sir.
**Variantlar:**
- A) MES tushlik navbatini ko'rsatadi (1/2/3-to'lqin) — mashina to'xtamaydi
- B) Faqat tushlik vaqti yoziladi, navbat usta qo'lida — yengil
- C) Keyin — boshqarilmaydi

### Q21. Namoz tanaffusini sof-ish-vaqtdan ajratib hisobga olish
**Nima:** Kun tartibida namoz: peshin 12:45 dan 20 daq, asr 18:00 dan 10 daq, shom 20:00 dan 10 daq, "битта одам учун". MES bu chiqishlarni hisobga olsinmi.
**Nega kerak:** Egasi rasman namoz uchun vaqt ajratgan; operator normani bajarmasa "namozga ketdi" bahona bo'lmasligi uchun bu vaqt rasman chegiriladi.
**Variantlar:**
- A) Namoz vaqti sof-ish-vaqtdan chegiriladi (bittadan navbat) — adolatli + hurmat
- B) Umumiy tanaffusga qo'shiladi — sodda
- C) Keyin — alohida emas

### Q22. Mustaqil ishlash ruxsati = MES operatorlik huquqi (2021 ShVB siyosati)
**Nima:** 2021 hujjat: operator mustaqil ishlashdan oldin 2 oy amaliy mashg'ulot + nazariy/amaliy imtihon + RD-4 yozma xulosa kerak. MES'da faqat "mustaqil ruxsat olgan" xodim sessiya ocha olsinmi.
**Nega kerak:** Egasining rasmiy talabi — tayyorlanmagan xodim mashinaga o'tirsa brak + jarohat; tizim huquqsiz odamni bloklasa siyosat avtomatik amalda.
**Variantlar:**
- A) Faqat "mustaqil ruxsat" bayrog'i bor xodim sessiya ochadi (mashina turi bo'yicha) — siyosat avto-amalda
- B) Hamma ocha oladi, ruxsatsiz faqat belgilanadi — yumshoq
- C) Keyin — ruxsat tekshirilmaydi
⤳ Ta'sir: HR onboarding (устоз + imtixon) → MES operator huquqi

### Q23. Ustoz-shogird (мураббий) bog'lanishini MES'da ko'rsatish
**Nima:** 2021 hujjatda yangi xodimga "Мураббий"/устoz biriktiriladi (buyruqда ko'rsatiladi, 2 oy birga). MES'da shogird sessiyasini "ustoz nazoratida" deb belgilash.
**Nega kerak:** Shogird mustaqil emas — uning braki/normasi ustoz bilan baholanadi; ajratmasa shogird braki ustozning ko'rsatkichini buzadi.
**Variantlar:**
- A) Shogird sessiyasi "ustoz nazoratida" + natija ikkalasiga (o'qish davri) — adolatli baho
- B) Shogird oddiy operator — sodda, baho aralashadi
- C) Keyin — kuzatilmaydi
⤳ Ta'sir: HR mentorlik + razryad o'sishi

### Q24. Operator × mashina malaka matritsasi (qaysi mashinada ishlay oladi)
**Nima:** ShVB onboarding "mashina turi bo'yicha" amaliy imtixon. MES har operatorga qaysi mashinalarda mustaqil ishlay olishini saqlasinmi.
**Nega kerak:** KBA-105 da ishlaydigan tigeldа ishlay olmasligi mumkin; usta xodimni faqat huquqi bor mashinaga qo'ysa brak/xavf kamayadi.
**Variantlar:**
- A) Operator × mashina matritsasi (ishlay oladi/o'rganmoqda/yo'q) — to'g'ri biriktirish
- B) Faqat umumiy "operator" darajasi — sodda, mashina farqi yo'q
- C) Keyin — kuzatilmaydi

### Q25. "Согласовано РД-4 / Утверждено Ген.Директор" tasdiq zanjirini normaga
**Nima:** Normalar jadvali oxirida "Согласовано РД-4 (Юлчиев М.)" + "Утверждено Ген.Директор (Позилов А.)" imzolari. MES'da norma o'zgarishi shu ikki bosqichli tasdiqdan o'tsinmi.
**Nega kerak:** Norma = oylik/baho asosi; har kim o'zboshimcha o'zgartirsa adolatsizlik; rasmiy zanjir (RD-4 kelishadi → direktor tasdiqlaydi) oldini oladi.
**Variantlar:**
- A) Norma o'zgarishi RD-4 kelishuvi + direktor tasdig'idan o'tadi (versiya saqlanadi) — nazorat + tarix
- B) Faqat usta o'zgartiradi — tez, nazoratsiz
- C) Keyin — erkin o'zgaradi

### Q26. Norma versiyasi va sanasini saqlash ("Дата: 13.01.2022")
**Nima:** Normalar "НО 12-2, Дата 13.01.2022" sanasi bilan tasdiqlanadi. MES norma o'zgarganda eski versiyani sana bilan saqlasinmi.
**Nega kerak:** O'tgan smenani o'sha paytdagi norma bilan baholash kerak; norma bugun o'zgarsa kechagi natija eski norma bilan qolishi shart.
**Variantlar:**
- A) Norma versiyalanadi (amal sanasi bilan) — tarix to'g'ri
- B) Faqat joriy norma — sodda, o'tmish buziladi
- C) Keyin — versiyasiz

### Q27. Mahsulot kodlash formatini saqlash (2025-3499 / KT4438 / папка)
**Nima:** Buyurtma nomi: "2025-3499 Barbol pechenni karobka 33.5x24.5x12.5/17815/KT4438/T-24 marka" — yil-raqam + nom + o'lcham + папка раками + KT-kod + marka.
**Nega kerak:** Bu zavodning haqiqiy buyurtma identifikatori; usta KT4438 deb qidiradi; struktura buzilsa qidiruv/bog'lanish ishlamaydi.
**Variantlar:**
- A) To'liq struktura (yil-raqam / папка / KT-kod / o'lcham / marka) alohida maydonlar — qidiruv + bog'lanish
- B) Faqat erkin matn nom — sodda, qidirib bo'lmaydi
- C) Keyin — hozirgi kod qoladi
⤳ Ta'sir: SD buyurtma ↔ PP папка ↔ MES smena bog'lanishi

### Q28. "Укишга" / "Академияга" — o'quv ishlarini real natijadan ajratish
**Nima:** Formada "Укишга" va "Академияга" satr/ustun — o'quv/mashq maqsadidagi ishlab chiqarish (real buyurtma emas). MES bularni alohida belgilasinmi.
**Nega kerak:** O'quv ishi real buyurtma emas — uning braki/normasi haqiqiyga qo'shilmasligi kerak; aralashsa unum va tannarx buziladi.
**Variantlar:**
- A) "O'quv/Akademiya" alohida ish turi — real natijaga qo'shilmaydi — toza hisob
- B) Oddiy ish deb yoziladi — sodda, aralashadi
- C) Keyin — ajratilmaydi

### Q29. Gofra (2/5 qatlam) ishini м2 + qatlam bilan alohida hisoblash
**Nima:** Formada "ЛИНИЯ 5 слой", "Формат гофро (2-слой)", "Гф линия (м2)" — gofra м2 bilan o'lchanadi va qatlam soni (2/5 слой) muhim. MES gofrani м2 + qatlam bilan saqlasinmi.
**Nega kerak:** Gofra dona emas, м2 bilan o'lchanadi; qatlam materialni belgilaydi; donaga aylantirsangiz sarf va norma noto'g'ri.
**Variantlar:**
- A) Gofra liniyasi м2 + qatlam soni alohida — to'g'ri o'lchov + material
- B) Donaга aylantirib umumiy hisobga — sodda, noaniq
- C) Keyin — alohida emas

### Q30. "умумий сон / Брак сони / Соф махсулот" uchligini saqlash + avto-tekshirish
**Nima:** Formada uch son: "умумий сон", "Брак сони", "Соф махсулот" (sof = umumiy − brak). MES uchalasini ham yozsinmi.
**Nega kerak:** Sof = mijozga ketadigan, umumiy = ishlab chiqilgan, farqi = brak; bittasini qoldirsangiz Quality OEE hisoblanmaydi.
**Variantlar:**
- A) Umumiy + brak + sof (avto-tekshiriladi: sof = umumiy − brak) — to'liq + nazorat
- B) Faqat sof son — sodda, brak ko'rinmaydi
- C) Keyin — bitta son

### Q31. Smenani A/B/C harf-nomi bilan saqlash (kitobda "А смена")
**Nima:** Kitobda smenalar "А смена", "Б", "С" harf bilan (vaqt emas). MES smenani harf-nom bilan saqlasinmi (morning/afternoon o'rniga).
**Nega kerak:** Zavod "A smena" deydi, "ertalabki" demaydi; brigada doimiy A/B/C ga biriktirilgan; nom mos kelmasa usta chalkashadi.
**Variantlar:**
- A) Smena = A/B/C harf + vaqt oralig'i (sozlanadigan) — zavod tiliga mos
- B) Hozirgi morning/afternoon/night qoladi — kod o'zgarmaydi, zavod tili emas
- C) Keyin — o'zgartirilmaydi

### Q32. Brigadani doimiy A/B/C smenaga biriktirish (kitobdagi A-smena tarkibi)
**Nima:** Kitobda "А смена" doimiy operatorlar bilan (Тураходжаев, Маматалиев, Неъматов, Ходжаев...). MES brigadani doimiy A/B/C smenaga biriktirsinmi.
**Nega kerak:** Zavodda brigada doimiy smenaga bog'langan (rotatsiya bilan); har smenada qaytadan tuzmaydi; doimiy tarkib davomat + baho uchun barqaror.
**Variantlar:**
- A) Brigada → doimiy smena (A/B/C) + kunlik o'zgarish (kasallik/ta'til) qayd — barqaror + moslashuvchan
- B) Har smenada qaytadan — moslashuvchan, og'ir
- C) Keyin — biriktirish yo'q

### Q33. Smena reja-formasini smena BOSHIDA avto-tuzish (планировщик Исаков)
**Nima:** "А смена План" hozir Excel'da qo'lda tuziladi (Режалаштириш ходими Исаков). MES smena boshida shu rejani PP'dan avto-tuzsinmi.
**Nega kerak:** Qo'lda tuzish planlovchi vaqtini oladi; MES avto-tuzsa vaqt tejaladi va reja-fakt avto-bog'lanadi.
**Variantlar:**
- A) MES smena boshida reja-formani avto-tuzadi (PP rejasidan) + bosib chiqariladi — avto + bog'liq
- B) Planlovchi MES'da qo'lda tuzadi — yarim-avto
- C) Keyin — Excel'da qo'lda qoladi

### Q34. "Режалаштириш ходими" + "Технолог" imzosini smenaga biriktirish
**Nima:** Formada "Режалаштириш ходими: Исаков А" va "Технолог: Ёкубжонов С / Аслонов И" imzolari. MES smena rejasiga planlovchi + texnolog yozsinmi.
**Nega kerak:** Reja noto'g'ri (norma past/material yetmaydi) bo'lsa kim mas'ulligini bilish kerak; imzosiz reja egasiz.
**Variantlar:**
- A) Har smena rejasiga planlovchi + texnolog (mas'ul) — javobgarlik aniq
- B) Faqat smena ustasi — sodda
- C) Keyin — mas'ul yozilmaydi

### Q35. Qog'oz zayavkasini (Заявка бумаги) MES sarfiga bog'lash
**Nima:** "Заявка бумаги.xlsx" — qog'oz buyurtmasi (Формат, Грам, Кг, Лист размер А×В, Папка №, заказ). MES haqiqiy sarfni shu zayavka bilan bog'lasinmi.
**Nega kerak:** Zayavka = rejalashtirilgan material; MES = haqiqiy sarf; bog'lasa "zayavka qildik, qancha ishlatdik, qancha qoldi" ko'rinadi.
**Variantlar:**
- A) Zayavka → MES haqiqiy sarf → farq (ortiqcha/kam) — to'liq material nazorati
- B) Faqat MES sarfi, zayavkadan ayri — yengil
- C) Keyin — bog'lanmaydi
⤳ Ta'sir: Ombor (qog'oz zayavkasi) ↔ MES sarf ↔ tannarx

### Q36. Qog'oz formati (лист размер А×В) + grammni sessiyaga yozish
**Nima:** Zayavkada "Формат, Грам, Лист размер А, Лист размер В". MES sessiyada ishlatilgan qog'oz formati + grammajini yozsinmi.
**Nega kerak:** Bir mahsulot turli format/grammda chiqishi mumkin; yozilmasa material sarfi (kg) noto'g'ri.
**Variantlar:**
- A) Sessiyada format (А×В) + gramm + kg yoziladi — aniq material sarfi
- B) Faqat material turi — yengil, kg noaniq
- C) Keyin — format yozilmaydi

### Q37. "Прошло (дней)" — buyurtma necha kun kutganini ko'rsatish
**Nima:** Zayavkada "Прошло (дней)" — buyurtma necha kundan beri kutmoqda. MES buyurtma rejaga tushganidan necha kun o'tganini ko'rsatsinmi.
**Nega kerak:** Uzoq kutgan buyurtma = mijoz norozi xavfi; ustaga ko'rinsa eski ishni avval qiladi.
**Variantlar:**
- A) Har buyurtmada "necha kun kutdi" + muddat-oshgan ranglanadi — kechikish ko'rinadi
- B) Faqat sana — usta o'zi hisoblaydi
- C) Keyin — kuzatilmaydi

### Q38. "Зарур заказлар" (shoshilinch) ni navbatda oldinga chiqarish
**Nima:** Formada "ЗАРУР ЗАКАЗЛАР" alohida ro'yxat — shoshilinch/prioritetli ishlar. MES shoshilinchni belgilab navbatda oldinga chiqarsinmi.
**Nega kerak:** Shoshilinch ish turib qolsa mijoz yo'qoladi; ajratilsa usta avval shularni qiladi.
**Variantlar:**
- A) Shoshilinch bayroq + navbatda yuqoriga + signal — muddat saqlanadi
- B) Faqat izohda "zarur" — usta o'zi e'tibor beradi
- C) Keyin — prioritet yo'q

### Q39. Bitta buyurtmaning mashinalararo marshrutini kuzatish
**Nima:** Formada bitta buyurtma ketma-ket: Печать → Ламинация → Высечка → Тигель → ФСМ/Склейка → Степлер → Упаковка. MES buyurtmaning mashinalararo o'tishini kuzatsinmi.
**Nega kerak:** Korobka 5-6 mashinadan o'tadi; qaysi bosqichda turib qolganini bilmasa "buyurtma qayerda?" javobsiz qoladi.
**Variantlar:**
- A) Buyurtma marshruti (qaysi mashina, qaysi bosqich, qancha tayyor) jonli — to'liq ko'rinish
- B) Faqat oxirgi bosqich — yengil, oraliq ko'rinmaydi
- C) Keyin — kuzatilmaydi
⤳ Ta'sir: PP routing ↔ MES bosqich ↔ buyurtma holati

### Q40. Bosqichlararo yarim tayyor qoldiqni (bottleneck) ko'rsatish
**Nima:** Печать tugab Ламинацияга o'tishida yarim tayyor (lист) o'tadi. MES bir bosqich chiqishi keyingi kirishi bo'lishini (oraliq qoldiq) yozsinmi.
**Nega kerak:** Bosqichlar orasida yarim tayyor to'planib qolsa (печать ko'p, ламинация sekin) "qoq joy" ko'rinadi; ko'rinmasa nima uchun sekin bilinmaydi.
**Variantlar:**
- A) Har bosqich oraliq qoldig'i (kutayotgan yarim tayyor) ko'rsatiladi — bottleneck ko'rinadi
- B) Faqat boshlanish va oxir — yengil
- C) Keyin — kuzatilmaydi

### Q41. Tanaffus markerini (УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК) jadvalda avto-ko'rsatish
**Nima:** Formada vaqt jadvalida "УЖИН", "ОБЕД", "Тушлик", "ПОЛДНИК" markerlari (ish oqimida tanaffus joyi). MES ish jadvalida tanaffusni avto-belgilab normaga moslasinmi.
**Nega kerak:** Forma tushlikni ish satriga belgilaydi (operator qachon chiqishini biladi); MES shu markerni saqlasa norma + jonli kuzatuv tanaffusni hisobga oladi.
**Variantlar:**
- A) Tanaffus markerlari jadvalda avto-ko'rinadi + normadan chegiriladi (Q19/Q20 bilan) — bog'langan
- B) Faqat umumiy tanaffus vaqti — sodda
- C) Keyin — marker yo'q

### Q42. Bir mashina ikki bo'limda (Флексо vs Упаковка) ishlashini ajratish
**Nima:** Formada "ФСМ Флексо" va "ФСМ ФЛЕКСО Упаковка", "Степлер ... ФЛЕКСО" va "...УПАКОВКА" — bitta mashina turi ikki bo'limда. MES buni ajratsinmi.
**Nega kerak:** ФСМ flekso bo'limida ham, qadoq bo'limida ham bor — natija qaysi bo'limga yozilishini ajratmasa hisobot aralashadi.
**Variantlar:**
- A) Mashina + bo'lim (Flekso/Upaковка) birikmasi alohida birlik — to'g'ri yozish
- B) Faqat mashina turi — sodda, aralash
- C) Keyin — ajratilmaydi

### Q43. "Kim hozir qaysi mashinada" jonli bandlik jadvali
**Nima:** Formada har operator ismi mashina yonida (Холматов М → Трафарет Лак, Шералиева М → Эмбоссинг). MES "kim hozir qaysi mashinada" jonli ko'rsatsinmi.
**Nega kerak:** Usta SOS/ish-yo'q bo'lganda kimni ko'chirishni bilishi kerak; jonli bandlik ko'rinmasa qo'lda so'rab yuradi.
**Variantlar:**
- A) Jonli "operator → mashina" jadvali (band/bo'sh) — tez qaror
- B) Faqat smena boshidagi biriktirilish — kun davomida o'zgarmaydi
- C) Keyin — kuzatilmaydi

### Q44. Bir operator bir vaqtda bir necha mashina yuritishini qayd qilish
**Nima:** Formada ba'zan bitta operator bir necha tigel/stansiyani yuritadi (Холматов М ikki normada). MES bir operatorni bir vaqtda bir necha mashinaga biriktirishni ruxsat bersinmi.
**Nega kerak:** Kichik mashinalarda (tigel) bitta operator 2-3 tasini yuritadi; bittaga cheklasangiz haqiqatga zid, lekin natija qaysi mashinaga ekani noaniq qoladi.
**Variantlar:**
- A) Operator bir necha mashinaga (foiz/vaqt ulushi bilan) — haqiqatga mos
- B) Bitta operator = bitta mashina (qattiq) — sodda, cheklangan
- C) Keyin — cheklov yo'q, natija aralashadi

### Q45. Yakuniy qadoqlash (упаковка 1 сотрудник) ni alohida bosqich/norma qilish
**Nima:** Formada "упаковка (1 сотрудник)" alohida norma (норма штук за 12 часов). MES qadoqlashni alohida bosqich + norma qilsinmi.
**Nega kerak:** Qadoqlash oxirgi bosqich, alohida ishchi (1 sotrudnik) qiladi; uning normasi/unumi alohida o'lchanmasa "tayyor mahsulot necha kunda qadoqlanadi" ko'rinmaydi.
**Variantlar:**
- A) Qadoqlash alohida bosqich + norma (1 ishchi/12 soat) — to'liq oxirgi bosqich
- B) Ishlab chiqarishga qo'shiladi — sodda
- C) Keyin — ajratilmaydi

### Q46. Smena yig'masini (выполнено за смену / норма% / брак%) avto-tuzish
**Nima:** Normalar jadvalida "выполнено за смену", "отработано часов", "иш %", "норма %" yig'ma satrlar (Махмудов/Юлчиев imzolaydi). MES smena oxirida avto-yig'sinmi.
**Nega kerak:** Hozir usta qo'lda yig'adi; MES avto-yig'sa xato kamayadi va darhol tayyor.
**Variantlar:**
- A) Smena oxirida avto-yig'ma (bajarildi / soat / norma% / brak%) — tayyor hisobot
- B) Usta qo'lda yig'adi, MES saqlaydi — yarim-avto
- C) Keyin — qog'ozda qo'lda

### Q47. НО 12-1 / НО 12-2 mas'ulini (Юсупов/Махмудов) hisobotга biriktirish
**Nima:** Normalar jadvalida mas'ullar: "НО 12-2: Юсупов Ильдар", "НО 12-1: Махмудов М.М". MES smena hisobotini shu mas'ullarga biriktirsinmi.
**Nega kerak:** Har bo'lim (flekso/ofset) o'z НО-mas'uli bor; hisobot egasiz bo'lsa kim javobgar noaniq; mas'ul biriktirilsa eskalatsiya aniq.
**Variantlar:**
- A) Har bo'lim hisobotiga НО-mas'ul (lavozim kartasi) biriktiriladi — javobgarlik + eskalatsiya
- B) Faqat smena ustasi — sodda
- C) Keyin — mas'ul yozilmaydi
⤳ Ta'sir: Org-struktura (НО lavozimlari) ↔ MES hisobot egasi

### Q48. Norma bajarilmasa MAJBURIY sabab so'rash (kitobdagi izoh madaniyati)
**Nima:** Kitobda har norma-buzilishiga sabab yozilgan ("иш йук", "ремонт", "переделка", "настройка"). MES norma <chegara bo'lganda operator/ustadan majburiy sabab so'rasinmi.
**Nega kerak:** Sababsiz "norma bajarilmadi" — operator aybdormi sharoit aybdormi noaniq; majburiy sabab adolatli baho + takror muammoni topish.
**Variantlar:**
- A) Norma <chegara bo'lsa sabab majburiy (tayyor ro'yxat + izoh) — adolatli + tahlil
- B) Sabab ixtiyoriy — yengil, ko'pincha bo'sh qoladi
- C) Keyin — so'ralmaydi
  ↳ Agar A: sababni kim tasdiqlaydi? (A) usta tasdiqlaydi B) avto-qabul C) НО-mas'ul ko'radi)

### Q49. AI kunlik smena xulosasi (kitobdagi sabab izohlaridan)
**Nima:** AI smena yig'masidan (norma%, brak%, ish-yo'q, переделка, sabab izohlari) kunlik tushunarli xulosa yozsin — qaysi mashina/brigada yaxshi, qayerda eng ko'p vaqt yo'qoldi, takror sabab.
**Nega kerak:** Egasi har Excel'ni o'qiy olmaydi; AI "bugun ofsetda 6 soat ish-yo'q, sababi rejalashtirish" deb xulosa qilsa qaror tez bo'ladi (kitobdagi izohlar aynan shu uchun yozilgan).
**Variantlar:**
- A) AI kunlik xulosa (top yo'qotish + brigada reytingi + takror sabab + tavsiya) — egaga tayyor qaror
- B) AI faqat raqamlarni jamlaydi — yengil
- C) Keyin — AI xulosa yo'q
⤳ Ta'sir: AI nazoratchi ↔ egaga kunlik hisobot ↔ org-baholash

### Q50. IoT'siz, faqat operator kiritishi bilan ishga tushirish (Excel → MES)
**Nima:** Zavodda hozir IoT sensor yo'q — hamma ma'lumot qo'lda Excel'ga yoziladi. MES dastlab to'liq qo'lda (operator boshlash/tugatish/brak/sabab kiritadi) ishlasinmi, IoT keyin.
**Nega kerak:** "Avto-sensor" da'vosi haqiqatga zid — zavod qog'ozda ishlaydi; qo'lda ishlaydigan qilib qursangiz darhol foydalanish boshlanadi, IoT keyin qo'shiladi.
**Variantlar:**
- A) To'liq qo'lda kiritish (sensor shart emas) + keyin IoT qo'shilsa avtomatik — bugundan ishlaydi
- B) IoT'ni kutib turish — to'g'ri, lekin uzoq, hozir foydasi yo'q
- C) Keyin — hozirgi holat qoladi

### Q51. Excel'dan o'tish davri (1-2 oy parallel) — qog'oz + MES birga
**Nima:** Zavod 5 yil Excel'da ishlagan; MES'ga o'tishda bir muddat ikkalasi parallel ishlasinmi (qog'oz forma + MES) yoki darhol faqat MES.
**Nega kerak:** Darhol qog'ozni tashlasa usta qarshilik qiladi/ma'lumot yo'qoladi; parallel davr ishonchni quradi, lekin ikki marta ish.
**Variantlar:**
- A) Parallel davr (1-2 oy qog'oz + MES) → ishonch qurilgach faqat MES — xavfsiz o'tish
- B) Darhol faqat MES — tez, lekin xavfli/qarshilik
- C) Keyin — o'tish rejasi keyin

### Q52. Tasdiqlangan o'lchov birligini master-data qilish ("ед.изм" RD-4 + direktor)
**Nima:** Normalar jadvalida "ед.изм" har stansiyaga aniq (м2/лист/штук/удар-лист) va RD-4 + direktor tasdig'i bilan. MES stansiya × birlikni tasdiqlangan master-data qilsinmi.
**Nega kerak:** Birlik har joyda bir xil bo'lishi shart (norma, sarf, hisobot bir tilda); tasdiqlangan birlik bo'lmasa har modul boshqa birlik ishlatadi.
**Variantlar:**
- A) Stansiya × tasdiqlangan birlik master-data (RD-4 + direktor) — yagona til
- B) Birlik erkin tanlanadi — moslashuvchan, nomuvofiq
- C) Keyin — standartlashtirilmaydi

DONE: MES / Ishlab chiqarish — 52.
