# LMS / Ta'lim — YANGI (kitob-grounded) savollar

> Sana: 2026-06-08 · Audience: zavod egasi (texnik bo'lmagan)
> Manba: `docs/audit/kitob-extracted/` — 2020/2022 zavod hujjatlari (РД-5 lavozim papkalari,
> "Назорат варақаси", "Сборник упражнений", ОРГПОЛИТИКА "Ходимни мустақил иш фаолиятига қўйиш тартиби").
> Bu savollar TAKRORLAMAYDI: (1) `vision-questions/12-lms.md` 30 ta savol; (2) shu fayldagi
> avvalgi 52 ta generic savol (kurs tuzilmasi/test turi/o'tish bali/attestatsiya/sertifikat/kaizen/onboarding).
> Asosiy g'oya: zavodda LMS allaqachon QOG'OZDA mavjud (kitob) — biz uni AYNAN raqamlashtiramiz.
> Har savol = aniq feature/talab tanlovi. Birinchi variant (A) = tavsiya.

---

### Q1. "Nazorat varaqasi" raqamli artefakt sifatida
**Nima:** Kitobdagi "НАЗОРАТ ВАРАҚАСИ" (har lavozim uchun: FIO, tashkilot, boshlanish/tugatish sanasi, mavzu-mavzu imzo) tizimda raqamli obyekt bo'ladimi.
**Nega kerak:** Kitobda har karta o'qishi aynan shu varaqa orqali yuritiladi — bu zavodning haqiqiy LMS yadrosi. Raqamlashtirilsa qog'oz imzo o'rniga tizimda iz qoladi.
**Variantlar:**
- A) Ha — har kartaga "Nazorat varaqasi" obyekti: FIO + sana + mavzular ro'yxati + har biriga raqamli tasdiq — kitob struktura aynan ko'chiriladi
- B) Soddalashtirilgan — faqat "kurs tugatildi" belgisi, mavzu-mavzu iz yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (onboarding hujjati), Org-karta (har karta o'z varaqasi)
  ↳ Agar A: imzo o'rniga nima bo'ladi? — A1) raqamli tasdiq tugmasi (vaqt+xodim qayd); A2) PIN/parol bilan tasdiq; A3) rahbar qo'sh-tasdiqi

### Q2. Ikki xil nazorat varaqasi — Lavozim (Должностная) + Ishga xos (Рабочая)
**Nima:** Kitobda har lavozim uchun IKKI varaqa bor: "ЛАВОЗИМ ЙЎРИҚНОМАСИ БЎЙИЧА" (umumiy 12 mavzu) va "ЛАВОЗИМГА ХОС" (ishning amaliy yo'riqnomasi). Tizim bu ikkalasini ajratadimi.
**Nega kerak:** Ikki varaqa ikki xil bilimni tekshiradi: biri lavozim mohiyatini (maqsad/ЦКП/javobgarlik), ikkinchisi amaliy ish bajarishni. Aralashtirsa o'qish chala bo'ladi.
**Variantlar:**
- A) Ha, ikkita — har kartada 2 varaqa: "Lavozim yo'riqnomasi" + "Ishga xos yo'riqnoma", ikkalasi alohida tugatiladi
- B) Bitta yaxlit — ikkalasi bir kursga birlashtiriladi
- C) Keyin — hozir kerak emas

### Q3. 12 universal mavzu shabloni
**Nima:** Kitobda har lavozim yo'riqnomasi aynan 12 mavzudan iborat: maqsad, orgsxema joylashuv, malaka talablari, ish joyi/vositalar, umumiy vazifalar, lavozimga xos vazifalar, ЦКП, ko'p uchraydigan xatolar, muvaffaqiyatli harakatlar, huquqlar, javobgarlik, statistik ko'rsatkichlar. Tizim bu 12 mavzuni har kursning standart "qolipi" sifatida ishlatadimi.
**Nega kerak:** Bu shablon zavodda allaqachon ishlaydi va barcha lavozimga bir xil — yangi karta yaratilganda 12 mavzu avtomatik chiqib, faqat to'ldirilsa, kurs tayyorlash tezlashadi va izchil bo'ladi.
**Variantlar:**
- A) Ha — yangi kurs ochilganda 12 mavzu bo'sh qolip bo'lib chiqadi, o'quv bo'limi faqat kontentni to'ldiradi
- B) Erkin — har kurs o'z mavzularini noldan yozadi, qolip yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ЦКП, malaka talablari kartadan keladi), HR (statistik ko'rsatkichlar = KPI)

### Q4. Mavzu-mavzu tasdiq ("ўқиб чиққанингизни тасдиқланг")
**Nima:** Kitobda xodim har mavzuni o'qib bo'lgach imzo qo'yadi ("___ ўқиб чиққанингизни тасдиқланг"). Tizim har mavzu uchun alohida "o'qib chiqdim" tasdiqini saqlaydimi.
**Nega kerak:** Yaxlit "kursni tugatdim" o'rniga mavzu-mavzu tasdiq — xodim qaysi joyda qolganini, qaysi mavzuni o'qiganini aniq ko'rsatadi. Kitob ayni shu darajada nazorat qiladi.
**Variantlar:**
- A) Ha — har mavzu yonida tasdiq, progress mavzular bo'yicha hisoblanadi (masalan 7/12)
- B) Yo'q — faqat kurs oxirida bitta tasdiq
- C) Keyin — hozir kerak emas

### Q5. Har mavzu oxiridagi vaziyat-savol (А/Б/В + izohlang)
**Nima:** Kitobda har mavzudan keyin amaliy vaziyat beriladi: "Бу ҳолатда қайси қарор тўғри? А)... Б)... В)..." + "Танловингизни изоҳланг". Tizim shu formatni qo'llab-quvvatlaydimi.
**Nega kerak:** Bu test turi tayyor — variant tanlash + ochiq izoh. Faqat variantni belgilash bilimni isbotlamaydi; izoh xodimning tushunganini ko'rsatadi. (Avvalgi generic "test turlari" Q6'dan farq qiladi: bu kitobning AYNAN ikki-qismli formati.)
**Variantlar:**
- A) Ha, ikki qismli — har savol: variant tanlash (avto-baholanadi) + ochiq izoh (rahbar/AI o'qiydi)
- B) Faqat variant — A/B/V tanlash, izoh yo'q (avto-baholash oson)
- C) Keyin — hozir kerak emas
  ↳ Agar A: izohni kim baholaydi? — A1) AI birlamchi baho + rahbar tasdiq; A2) faqat rahbar/murabbiy; A3) faqat saqlanadi, baholanmaydi

### Q6. "Сборник упражнений" (amaliy mashqlar to'plami) alohida bo'lim
**Nima:** Kitobda nazorat varaqasidan alohida "Сборник упражнений" bor — ochiq javobli amaliy mashqlar. Tizim test bankidan ayrim "amaliy mashq" bo'limini qo'llab-quvvatlaydimi.
**Nega kerak:** Nazorat varaqasi = "o'qidingmi", mashqlar to'plami = "qo'llay olasanmi". Ikkalasi ayri — biri bilim, biri ko'nikma.
**Variantlar:**
- A) Ha — har kursda ayrim "Amaliy mashqlar" bloki (ochiq javob, murabbiy baholaydi)
- B) Yo'q — hammasi bitta test bankida
- C) Keyin — hozir kerak emas

### Q7. Glossariy (lug'at) har kursga + matn ichida atama izohi
**Nima:** Kitobda har material oxirida glossariy bor (ЦКП, Bitrix24, podpisnoy list, texkarta va h.k. izohlari) va matnda atama birinchi uchraganda izoh beriladi. Tizimda har kursning lug'ati bo'ladimi.
**Nega kerak:** Savodxonligi past yoki yangi ishchi atamalarni tushunmasa o'qish befoyda. Kitob bu muammoni glossariy + matn-ichi izoh bilan hal qilgan.
**Variantlar:**
- A) Ha — har kursning lug'ati + matnda atama bosilganda izoh chiqadi (kitob uslubi)
- B) Markaziy lug'at — bitta umumiy korxona atamalar lug'ati, kursga bog'lanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI chatbot (lug'atdan tushuntirish beradi)

### Q8. Mustaqil ishga qo'yish tartibi — bosqichli buyruq zanjiri
**Nima:** Kitobda "Ходимни мустақил иш фаолиятига қўйиш тартиби" aniq bosqichlar: suhbat → РД-4 lavozim aniqlash + murabbiy + o'qish/sinov muddati → TX yo'riqnoma → buyruq → o'quv bo'limiga yo'naltirish → ish joyida birinchi instruktaj → 2 oy amaliy → imtihon → yozma xulosa → mustaqil ishga ruxsat. Tizim shu zanjirni boshqaradimi.
**Nega kerak:** Bu zavodning rasmiy yangi-xodim o'qitish jarayoni — kim, qachon, qancha vaqt aniq belgilangan. Raqamlashtirilsa hech bir bosqich tushib qolmaydi.
**Variantlar:**
- A) Ha, to'liq workflow — har bosqich (mas'ul + vaqt) tizimda kuzatiladi, oldingisi tugamasa keyingisi ochilmaydi
- B) Faqat checklist — bosqichlar ro'yxati, lekin majburiy tartib yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (onboarding), Org (РД-4 = 4-departament rahbari), MES (mustaqil ishga ruxsatsiz mashinaga qo'ymaslik)

### Q9. РД-4 lavozim aniqlash suhbati onboarding boshida
**Nima:** Kitobda НО-1 yangi nomzodni "РД-4 га лавазимини аниқлаш учун сухбатга" yuboradi — РД-4 (uchastka rahbari) qaysi lavozim/karta, murabbiy, o'qish va sinov muddatini belgilaydi. Tizim bu РД-4 qarorini onboarding boshida qayd qiladimi.
**Nega kerak:** Xodimni qaysi kartaga qo'yish va qancha o'qitish qarori bir joyda (РД-4 suhbati) qabul qilinadi. Bu butun o'quv yo'lini belgilaydi.
**Variantlar:**
- A) Ha — onboardingda "РД-4 suhbati" qadami: karta + murabbiy + o'qish muddati + sinov muddati shu yerda kiritiladi
- B) HR boshqaradi — bu qaror HR'da, РД-4 alohida emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (РД-4 roli), HR

### Q10. 2 oylik amaliy o'qish muddati taymeri
**Nima:** Kitobda yangi ishchi uchun amaliy mashg'ulotlar 2 oy davom etadi. Tizim bu muddatni kuzatib, tugaganda imtihonga signal beradimi.
**Nega kerak:** Muddatsiz "o'rganяpti" abadiy cho'zilishi mumkin. 2 oy — zavodning belgilangan standarti; taymer imtihonni o'z vaqtida boshlatadi.
**Variantlar:**
- A) Ha — o'qish boshlanish sanasidan 2 oy sanaladi, tugashga yaqin murabbiy+РД-4 ga imtihon eslatmasi
- B) Lavozimga qarab — muddat har karta uchun sozlanadi (oddiy ish 2 hafta, murakkab 3 oy)
- C) Keyin — hozir kerak emas

### Q11. Mustaqil ishga o'tishdan oldin ikki imtihon (nazariy + amaliy)
**Nima:** Kitob: "Мустақил ишлашга ўтишдан олдин амалий ва назарий имтихонлардан ўтиш" — ikki imtihon majburiy. Tizim ikkalasini alohida talab qiladimi.
**Nega kerak:** Nazariy = bilim, amaliy = ko'nikma — biri o'tib, ikkinchisi yiqilsa xodim hali tayyor emas. Kitob ikkalasini ham talab qiladi.
**Variantlar:**
- A) Ha — ikkalasi ham o'tilishi shart: nazariy (tizim testi) + amaliy (murabbiy/РД-4 baholaydi)
- B) Bitta — faqat yagona yakuniy imtihon
- C) Keyin — hozir kerak emas

### Q12. РД-4 ning yozma xulosasi ("ёзма хулоса")
**Nima:** Kitobda imtihondan keyin uchastka rahbari (РД-4) yangi xodimni mustaqil ishlashga yaroqliligi haqida yozma xulosa beradi. Tizimda bu yozma xulosa qadami bormi.
**Nega kerak:** Imtihon o'tgan bo'lsa ham, rahbar yakuniy mas'uliyatni o'z zimmasiga oladi — "ruxsat beraman" deb. Bu mas'uliyatli inson qaroridir, faqat avtomatik emas.
**Variantlar:**
- A) Ha — imtihondan keyin РД-4 (uchastka rahbari) yozma xulosa + tasdiq, shundan keyingina "mustaqil ishga ruxsat"
- B) Avtomatik — imtihon o'tsa mustaqil ish darrov ochiladi, xulosa yo'q
- C) Keyin — hozir kerak emas

### Q13. Mustaqil ishga ruxsat = buyruq bilan rasmiylashtirish
**Nima:** Kitobda mustaqil ishga o'tish buyruq orqali rasmiylashtiriladi (lavozim, unvon, F.I.Sh., murabbiy, o'qish davri). Tizim "mustaqil ishga ruxsat" buyrug'ini avtomatik shakllantiradimi.
**Nega kerak:** Buyruq — rasmiy hujjat (HR + razryad + oylik unga bog'liq). Tizim ma'lumotlardan buyruqni tayyorlasa, qog'oz ish kamayadi.
**Variantlar:**
- A) Ha — barcha bosqich tugagach tizim buyruq loyihasini chiqaradi (HR tasdiqlaydi) + razryad/oylik faollashadi
- B) Faqat belgisi — tizimda "ruxsat berildi" flag, buyruq qo'lda yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (buyruq arxivi), Oylik (ruxsatdan keyin to'liq oylik), Org-karta (xodim kartaga rasman bog'lanadi)

### Q14. Texnika xavfsizligi yo'riqnomasi (TX instruktaj) o'qishga kirish sharti
**Nima:** Kitobda o'qishdan oldin "Техника хавфсизлиги бўйича йўриқномадан ўтиш" (sex menejeri TX) majburiy. Tizim TX instruktajisiz o'qish/ishni boshlatmaydimi.
**Nega kerak:** Xavfsizlik birinchi — TX o'tmagan ishchi sexga kira olmasligi kerak. Bu LMS'ning birinchi majburiy moduli.
**Variantlar:**
- A) Ha — TX instruktaji birinchi majburiy modul, tasdiqlanmaguncha boshqa o'qish/MES ochilmaydi
- B) Tavsiya — TX bor, lekin bloklamaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (TX'siz mashina yo'q), HR (xavfsizlik jurnali)

### Q15. Ish joyida birinchi instruktaj (РД-4 + sex menejeri) qayd qilinishi
**Nima:** Kitobda buyruqdan keyin "иш жойида биринчи инструктаж" alohida bosqich. Tizim bu joyida-instruktajni qayd qiladimi (kim o'tkazdi, qachon).
**Nega kerak:** O'quv bo'limidagi nazariydan tashqari, real ish joyida ko'rsatish bosqichi bor — kim mas'ulligi va o'tilgani qayd bo'lishi kerak.
**Variantlar:**
- A) Ha — "ish joyida instruktaj" qadami (mas'ul: РД-4/sex menejeri, sana, tasdiq)
- B) Yo'q — nazariy o'qishga qo'shib yuboriladi
- C) Keyin — hozir kerak emas

### Q16. ЦКП (Qimmatli Yakuniy Mahsulot) har kursda, kartadan keladi
**Nima:** Kitobda har lavozim yo'riqnomasi ЦКП (Ценный Конечный Продукт)ni o'rgatadi — lavozimning aniq, baholanadigan yakuniy natijasi. Kurs xodimga aynan o'z ЦКП sini tushuntiradimi va u kartadan keladimi.
**Nega kerak:** ЦКП — Vysotskiy/karta-model yadrosi. Xodim o'z ЦКП sini bilmasa "to'g'ri ish" ni bilmaydi. Kitob har lavozimga aniq ЦКП beradi.
**Variantlar:**
- A) Ha — kursning ЦКП mavzusi kartaning ЦКП maydonidan avtomatik keladi (yagona manba)
- B) Qo'lda — har kursda ЦКП matni alohida yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ЦКП = karta atributi), AI (xodim-karta mosligini ЦКП bilan baholaydi)

### Q17. "Kўp uchraydigan xatolar" bloki har kursda + jonli yangilanish
**Nima:** Kitobda har yo'riqnoma "Кўп учрайдиган хатолар" mavzusiga ega. Kurslarda shu blok bo'ladimi va u jonli (real xato statistikasidan) yangilanadimi.
**Nega kerak:** Xodimga avvaldan "qaysi xatolar ko'p bo'ladi" deyilsa, ularni takrorlamaydi. Bu real sifat/brak statistikasidan boyib borishi mumkin.
**Variantlar:**
- A) Ha + jonli — kursda "ko'p uchraydigan xatolar" bloki, sifat/MES'dan kelgan real xatolar bilan boyitiladi
- B) Statik — faqat kitobdagi matn, yangilanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (brak/reklamatsiya sabablari → xatolar bloki), AI (eng ko'p xatoni aniqlaydi)

### Q18. "Muvaffaqiyatli harakatlar" bloki + blanka
**Nima:** Kitobda "Муваффақиятли ҳаракатлар" mavzusi va "бланка"si bor (rahbar muntazam to'ldiradi). Tizim bu blankani raqamli yuritadimi.
**Nega kerak:** Faqat xato emas, to'g'ri qilingan ishlar ham yozilsa, yangi xodim namuna oladi. Kitob bu blankani majburiy qiladi.
**Variantlar:**
- A) Ha — "muvaffaqiyatli harakatlar" blankasi: rahbar real misol qo'shadi, kursga ulanadi
- B) Faqat statik mavzu — qo'shilmaydi
- C) Keyin — hozir kerak emas

### Q19. "Лавозим бўйича малака талаблари" kursda va kartada
**Nima:** Kitobda har lavozim "малака талаблари" beradi (masalan: o'rta-maxsus/oliy ta'lim, qog'oz turlarini bilish, gofra turlarini bilish). Kurs shu talablardan kelib chiqib tuziladimi va kartadan olinadimi.
**Nega kerak:** Malaka talablari = nimani o'rgatish kerakligini belgilaydi. Agar talab kartada bo'lsa, kurs avtomatik shu talablarni qoplaydi.
**Variantlar:**
- A) Ha — karta malaka talablari → kurs mavzulari shu talablardan kelib chiqadi (talab = o'rganish maqsadi)
- B) Ajratilgan — malaka talablari HR'da, kurs ayri yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (malaka talablari atributi), Razryad (talab darajasi → razryad)

### Q20. Konkret domen-bilim modullari — "qog'oz turlari", "gofra turlari"
**Nima:** Kitobda ichki logistika boshlig'i uchun "Қоғоз турларини билиши керак", "Гофра турларини билиши керак" kabi konkret bilim bloklari bor. Tizim bunday domen-bilim modullarini (material/mahsulot katalogi bilan bog'liq) qo'llab-quvvatlaydimi.
**Nega kerak:** Bu zavodga xos texnik bilim (gofra, qog'oz markalari). Material katalogi bilan bog'lansa, kurs har doim joriy materiallarga mos bo'ladi.
**Variantlar:**
- A) Ha — domen-bilim modullari material/mahsulot katalogiga bog'lanadi (gofra turi o'zgarsa kurs ham yangilanadi)
- B) Statik — qog'oz/gofra turlari matn sifatida, katalogsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor/Material katalogi (gofra, qog'oz turlari = master data)

### Q21. "Statistik ko'rsatkichlar" mavzusi = karta KPI
**Nima:** Kitobda har lavozim "Статистик кўрсаткичлар" mavzusiga ega (lavozim qanday o'lchanadi). Kurs xodimga uning KPI larini o'rgatadimi va ular kartadan/HR'dan keladimi.
**Nega kerak:** Xodim o'zi qanday baholanishini bilmasa, to'g'ri natijaga intilmaydi. Kitob har lavozimga statistik ko'rsatkich beradi.
**Variantlar:**
- A) Ha — "statistik ko'rsatkichlar" mavzusi kartaning KPI/ЦКП o'lchovlaridan keladi (xodim qanday baholanishini biladi)
- B) Qo'lda — kursda matn sifatida yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (KPI), Org-karta (statistik ko'rsatkich atributi)

### Q22. "Лавозим ҳуқуқлари" va "Лавозим жавобгарлиги" o'qitilishi
**Nima:** Kitobda har yo'riqnoma "Лавозим ҳуқуқлари" va "Лавозим жавобгарлиги"ni alohida o'rgatadi. Kurs xodimga uning huquq va javobgarligini aniq o'rgatadimi.
**Nega kerak:** Xodim o'z huquqini (nima qila oladi) va javobgarligini (nimaga javob beradi) bilmasa, ortiqcha yoki kam ish qiladi. Kitob buni majburiy mavzu qilgan.
**Variantlar:**
- A) Ha — "huquqlar" va "javobgarlik" alohida mavzular, kartadan keladi, test bilan tekshiriladi
- B) Qo'shib — umumiy vazifalarga qo'shiladi, alohida emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (huquq/javobgarlik atributlari)

### Q23. "Иш жойи ва лавозим воситалари" — jihozlar katalogi bilan bog'lanish
**Nima:** Kitobda "Иш жойи ва лавозим воситалари" mavzusi bor (xodim qaysi asbob/jihoz/dastur bilan ishlaydi). Kurs bu vositalarni o'rgatadimi va aktivlar moduliga bog'lanadimi.
**Nega kerak:** Xodim qaysi mashina/asbob/dasturdan foydalanishini bilishi va to'g'ri foydalanishni o'rganishi kerak. Aktivlar moduli bilan bog'lansa, jihoz o'zgarsa kurs ham yangilanadi. (Memory: karta-model "kerakli jihozlar" hozir YO'Q — shu yerga ulanadi.)
**Variantlar:**
- A) Ha — "ish joyi vositalari" mavzusi aktivlar/jihozlar katalogiga bog'lanadi (kartaning "kerakli jihozlar"i)
- B) Statik matn — vositalar ro'yxati qo'lda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Aktivlar/Jihozlar moduli, Org-karta ("kerakli jihozlar")

### Q24. "Оргсхемадаги жойлашуви" mavzusi org-chartdan keladi
**Nima:** Kitobda 2-mavzu — "Оргсхемадаги жойлашуви" (xodim kimga bo'ysunadi, kim bilan hamkorlik qiladi, qaysi departamentda). Kurs bu mavzuni jonli org-chartdan ko'rsatadimi.
**Nega kerak:** Xodim o'z o'rnini (vertikal bo'ysunish + gorizontal hamkorlik) bilmasa, izolyatsiyada ishlaydi — kitob aytadiki bu axborot uzilishi va muammoga olib keladi. Org-chart jonli bo'lsa, kurs har doim haqiqiy tuzilmani ko'rsatadi.
**Variantlar:**
- A) Ha — mavzu jonli org-chartdan keladi (xodim o'z kartasini, rahbarini, hamkor bo'limlarni ko'radi)
- B) Statik rasm — org-sxema rasm sifatida qo'yiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (Vysotskiy-7 daraxti), Koordinatsiya (gorizontal hamkorlik)

### Q25. 7 departament tuzilmasi umumiy kursda
**Nima:** Kitobda korxonaning 7 departamenti sanaladi (Ходимлар, Савдо, Бухгалтерия, Ишлаб чиқариш, ИЧ+сифат/режа/дизайн, Ривожлантириш, Администрация). Har yangi xodim uchun umumiy "korxona tuzilmasi" kursi bo'ladimi.
**Nega kerak:** Lavozimga xos kursdan oldin, har kim korxonaning umumiy tuzilishini bilishi kerak (qaysi departament nima qiladi). Bu birlamchi, hammaga umumiy.
**Variantlar:**
- A) Ha — barcha yangi xodimga majburiy "Korxona tuzilmasi (7 departament)" kursi
- B) Yo'q — faqat o'z lavozimini biladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org

### Q26. O'quv bo'limi (НО-14) "o'quv dasturi hajmini aniqlash" roli
**Nima:** Kitobda НО-1 yangi xodimni "ўқув дастурининг хажмини аниқлаш учун ўқув бўлимига" (НО-14) yo'naltiradi — o'quv bo'limi o'quv dasturi hajmini belgilaydi. Tizimda o'quv bo'limi shu rolni o'ynaydimi.
**Nega kerak:** Har xodimga qancha o'qish kerakligini kim belgilaydi — kitobda bu o'quv bo'limi. Aniq mas'ul bo'lmasa o'quv hajmi tasodifiy bo'ladi.
**Variantlar:**
- A) Ha — o'quv bo'limi har yangi xodim/karta uchun o'quv dasturi hajmini belgilaydi (qaysi kurslar, qancha vaqt)
- B) Avtomatik — karta majburiy kurslari o'zi hajmni belgilaydi, o'quv bo'limi aralashmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (o'quv bo'limi = НО-14), HR (o'quv rejasi)

### Q27. Murabbiyning o'zi malakali ekanini tekshirish
**Nima:** Murabbiy bo'lish uchun xodim o'sha kartaning o'quvini tugatgan + ma'lum razryadga ega bo'lishi sharti qo'yiladimi.
**Nega kerak:** O'rgatmagan/malakasiz murabbiy noto'g'ri o'rgatadi. Murabbiy ham talabga javob berishi kerak.
**Variantlar:**
- A) Ha — murabbiy bo'lish uchun min. razryad + o'sha karta sertifikati + (ixtiyoriy) "murabbiylik" moduli shart
- B) Yo'q — har tajribali xodim murabbiy bo'la oladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, Razryad

### Q28. Murabbiy bo'lmaganda (kichik bo'lim) — zaxira tartib
**Nima:** Ba'zi kartada faqat bitta xodim bor — murabbiy yo'q. Bunday holatda o'qishni kim olib boradi (yuqori rahbar / qo'shni bo'lim / AI / tashqi).
**Nega kerak:** "Murabbiy majburiy" qoidasi kichik bo'limda ishlamaydi. Zaxira yo'l kerak, aks holda jarayon to'xtaydi.
**Variantlar:**
- A) Zaxira tartib — murabbiy yo'q bo'lsa yuqori rahbar yoki yondosh karta egasi murabbiy bo'ladi; AI nazariyni qoplaydi
- B) To'xtatish — murabbiy topilmaguncha onboarding boshlanmaydi
- C) Keyin — hozir kerak emas

### Q29. Murabbiy shogird progressini real vaqtda ko'rishi
**Nima:** Murabbiy o'z shogirdining qaysi mavzuni tugatgani, qaysi testdan o'tgani/yiqilganini real vaqtda ko'ra oladimi.
**Nega kerak:** Murabbiy "qayerda yordam kerak"ligini ko'rmasa, o'rgatishni rejalashtira olmaydi. Kitobda murabbiy mas'ul — unga ko'rinish kerak.
**Variantlar:**
- A) Ha — murabbiyda "mening shogirdlarim" paneli (har birining mavzu/test holati)
- B) Faqat yakunda — murabbiy faqat imtihon natijasini ko'radi
- C) Keyin — hozir kerak emas

### Q30. Yakuniy topshiriqlar ("ЯКУНИЙ ТОПШИРИҚЛАР") — bo'lim oxiridagi yig'ma test
**Nima:** Kitobda har bo'lim (Birinchi/Ikkinchi bo'lim) oxirida "ЯКУНИЙ ТОПШИРИҚЛАР" — yig'ma savol-topshiriqlar bor. Tizim har bo'lim oxirida yakuniy test talab qiladimi.
**Nega kerak:** Mavzu-mavzu o'qishdan tashqari, bo'lim oxirida yig'ma tekshiruv bilimni mustahkamlaydi. Kitob aynan shunday tuzilgan.
**Variantlar:**
- A) Ha — har bo'lim oxirida yakuniy topshiriqlar bloki (o'tilmasa keyingi bo'lim ochilmaydi)
- B) Faqat kurs oxirida — bitta yakuniy
- C) Keyin — hozir kerak emas

### Q31. Sinov muddati (синов муддати) natijasi LMS bilan bog'liqligi
**Nima:** Kitobda buyruqda "синов муддати" (probatsiya) ham belgilanadi. Sinov muddati natijasi (xodim qoladimi/ketadimi) LMS imtihon natijasiga bog'lanadimi.
**Nega kerak:** Sinov muddati = xodim mosmi degan qaror; imtihon natijasi shu qarorning asosiy dalilidir. Ikkalasi bog'lansa qaror asosli bo'ladi. (Avvalgi generic Q50 "probatsiya baholash" umumiy edi — bu kitobning AYNAN buyruq+sinov bog'lanishi.)
**Variantlar:**
- A) Ha — sinov muddati yakunida LMS natijasi (imtihon + murabbiy bahosi) qaror uchun yig'iladi
- B) Ajralgan — sinov muddati HR'da, LMS natijasi ayri
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (probatsiya qarori), AI (xodim-karta mosligi hisoboti)

### Q32. Amaliy imtihonni baholash varaqasi (murabbiy/РД-4)
**Nima:** Amaliy imtihonni murabbiy/РД-4 baholaydi (avtomatik emas). Tizimda amaliy imtihon uchun baholash varaqasi (mezonlar + ball) bormi.
**Nega kerak:** Amaliy ko'nikmani test avtomatik baholay olmaydi — odam baholaydi. Mezonli varaqa bahoni adolatli va izchil qiladi.
**Variantlar:**
- A) Ha — amaliy imtihon baholash varaqasi: mezonlar + ball + baholovchi izohi (murabbiy/РД-4)
- B) Oddiy — faqat "o'tdi/yiqildi" tugmasi
- C) Keyin — hozir kerak emas

### Q33. Lavozim o'zgarganda yangi nazorat varaqasi
**Nima:** Xodim boshqa kartaga (lavozimga) o'tsa, yangi kartaning nazorat varaqasini noldan o'tishi kerakmi.
**Nega kerak:** Kitobda har lavozimning o'z yo'riqnomasi va varaqasi bor. Lavozim o'zgardi = yangi bilim kerak. Eski varaqa yangisini qoplamaydi.
**Variantlar:**
- A) Ha — yangi kartaga o'tganda o'sha kartaning nazorat varaqasi avto-tayinlanadi (eski yopiladi, arxivda qoladi)
- B) Qisman — faqat farq qiladigan mavzular qayta o'tiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (lavozim ko'chishi), HR (transfer)

### Q34. Nazorat varaqasini kitob formatida PDF eksport
**Nima:** Tugatilgan nazorat varaqasini kitobdagi qog'oz shaklida (FIO, tashkilot, sanalar, mavzu-tasdiqlar, imtihon natijasi) PDF qilib chiqarish mumkinmi.
**Nega kerak:** Audit/tekshiruv yoki shaxsiy ish papkasi uchun qog'oz nusxa kerak bo'lishi mumkin. Kitob formatida PDF — tanish va rasmiy.
**Variantlar:**
- A) Ha — tugatilgan varaqa kitob formatida PDF (barcha rekvizit bilan)
- B) Faqat ekran — PDF yo'q
- C) Keyin — hozir kerak emas

### Q35. Lavozimga xos yo'riqnoma o'zgarsa — qayta-o'qish (kartadagi hammaga)
**Nima:** Kartaning "ishga xos yo'riqnoma"si (jarayon o'zgardi) yangilansa, o'sha kartadagi barcha xodimga avtomatik qayta-o'qish/qayta-test tushadimi.
**Nega kerak:** Jarayon o'zgardi, lekin xodim eski usulda ishlasa — brak/xato chiqadi. Yangilanish hammaga yetishi shart. (Generic Q18 "reglament yangilansa" umumiy edi — bu AYNAN ikki-varaqadan "ishga xos" varaqasiga tegishli.)
**Variantlar:**
- A) Ha — yo'riqnoma versiyasi o'zgarsa, o'sha kartadagi xodimlarga "yangilangan qism" qayta-o'qish + qisqa test tushadi
- B) Faqat eslatma — o'zgarish haqida xabar, qayta-test yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hujjat boshqaruvi (yo'riqnoma versiyasi), MES (eski usul bloklash)

### Q36. ERP/CRM tizimida ishlash ko'nikmasi alohida modul
**Nima:** Kitobda dizayn rahbari yo'riqnomasi katta blokni Bitrix24'da (kartochka, kanban, status, fayl) ishlashga bag'ishlaydi. Bizning ERP bilan ishlash ko'nikmasi alohida majburiy modul bo'ladimi.
**Nega kerak:** Endi Bitrix24 emas, bizning ERP. Lekin "tizimda kartochka yuritish, status o'zgartirish" ko'nikmasi har kartaga kerak — bizning tizim bo'yicha o'quv moduli bo'lishi shart.
**Variantlar:**
- A) Ha — "ERP tizimida ishlash" majburiy modul, kartaga qarab kerakli ekranlar (kanban, status, kartochka) o'rgatiladi
- B) Yo'q — tizim o'zi intuitiv deb hisoblanadi, alohida o'quv yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Kanban, barcha modul (tizimdan foydalanish savodxonligi)

### Q37. Onboarding hujjatlar to'plami (ariza, buyruq, TX, varaqa, xulosa)
**Nima:** Kitobdagi tartib bir nechta hujjat keltirib chiqaradi: ishga qabul arizasi, buyruq, TX instruktaj qaydi, nazorat varaqasi, yozma xulosa, mustaqil ish buyrug'i. Tizim bularni bitta onboarding hujjatlar to'plamiga yig'adimi.
**Nega kerak:** Hujjatlar tarqoq bo'lsa, biri tushib qoladi. Bitta to'plamda nima bor/yo'qligi ko'rinadi.
**Variantlar:**
- A) Ha — har yangi xodim onboardingida hujjatlar checklist + har biri tizimda fayl/qayd sifatida
- B) Faqat varaqa — boshqa hujjatlar tizimdan tashqarida
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (shaxsiy ish papkasi)

### Q38. "Ишдаги вазият" interaktiv simulyatsiya rejimi
**Nima:** Kitob mashqlari real vaziyatni tasvirlaydi ("Ишдаги вазият: ..."). Tizim shu vaziyatlarni interaktiv simulyatsiya (qaror tanla → oqibatni ko'r → izoh) qilib bera oladimi.
**Nega kerak:** Faqat o'qishdan ko'ra "qaror qil, natijani ko'r" ko'proq o'rgatadi. Operator xavfsiz muhitda xato qilib o'rganadi.
**Variantlar:**
- A) Ha — vaziyat-mashqlar interaktiv (qaror → oqibat ko'rsatiladi → izoh)
- B) Oddiy — vaziyat matn + bitta to'g'ri javob
- C) Keyin — hozir kerak emas

### Q39. Imtihon savollarini kim tuzadi va tasdiqlaydi
**Nima:** Nazorat varaqasidagi test/imtihon savollarini kim yozadi (o'quv bo'limi / karta AI / rahbar) va kim tasdiqlaydi.
**Nega kerak:** Sifatsiz savol bilimni noto'g'ri o'lchaydi. Savol manbai va tasdig'i aniq bo'lishi kerak. (Generic Q40 "kursni kim yaratadi" — bu AYNAN savol/test mualliflik+tasdiq oqimi.)
**Variantlar:**
- A) O'quv bo'limi tuzadi (AI yordamida) → rahbar/HR tasdiq
- B) AI to'liq avtomatik — yo'riqnomadan savol generatsiya qiladi, tasdiqsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (yo'riqnomadan test generatsiyasi)

### Q40. AI yo'riqnomadan avtomatik test + glossariy + micro-modul generatsiyasi
**Nima:** AI har lavozim yo'riqnomasini o'qib, undan avtomatik test savollari + glossariy + micro-modul taklif qiladimi (o'quv bo'limiga yordam).
**Nega kerak:** Har lavozimga qo'lda kontent yozish juda mehnattalab. AI yo'riqnoma matnidan boshlang'ich variant tayyorlasa, o'quv bo'limi faqat tekshiradi. (Kitobda yo'riqnoma matni TAYYOR — AI uni o'quv kontentiga aylantiradi.)
**Variantlar:**
- A) Ha — AI yo'riqnomadan test/glossariy/micro-modul loyihasini chiqaradi, odam tasdiqlaydi (drafting)
- B) Yo'q — hammasi qo'lda yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya moduli

### Q41. O'qish davomida savol berish (murabbiy/AI'ga)
**Nima:** O'qish davomida xodim tushunmagan joyni murabbiy yoki AI'ga so'rashi va javob olishi mumkinmi (tizim ichida).
**Nega kerak:** Yolg'iz o'qigan xodim savolini hech kimga bera olmasa, qotib qoladi. Kitob glossariy beradi, lekin jonli savol uchun kanal kerak.
**Variantlar:**
- A) Ha — har mavzuda "savol berish" tugmasi: AI birlamchi javob, murabbiy/rahbarga eskalatsiya
- B) Yo'q — savol ish joyida og'zaki hal qilinadi
- C) Keyin — hozir kerak emas

### Q42. Imtihon natijasi murabbiy reytingiga ta'siri
**Nima:** Murabbiyning shogirdi imtihondan o'tsa, bu murabbiyning KPI/rag'batiga ijobiy ta'sir qiladimi.
**Nega kerak:** Murabbiy mas'uliyatli bo'lishi uchun natija unga ham bog'liq bo'lishi kerak. Aks holda formal o'rgatadi.
**Variantlar:**
- A) Ijobiy bog'lash — shogird muvaffaqiyati murabbiy reytingi/bonusiga qo'shiladi (salbiy jazo yo'q, demotivatsiya bo'lmasin)
- B) Ikki tomonlama — muvaffaqiyat + (takror yiqilsa) ogohlantirish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (murabbiy KPI), Oylik

### Q43. Kursga namuna fayl/rasm ilova qilish (texkarta, maket, podpisnoy)
**Nima:** Kursga real namuna (texkarta misoli, to'g'ri maket, podpisnoy list namunasi) fayl/rasm ilova qilinadimi.
**Nega kerak:** "Qanday bo'lishi kerak"ni ko'rsatish matndan ko'ra namuna bilan tezroq. Kitobda atamalar bor (texkarta, podpisnoy list, maket), lekin namuna fayllar ko'rsatishni tezlashtiradi.
**Variantlar:**
- A) Ha — har mavzuga namuna fayl/rasm ilova (to'g'ri va noto'g'ri misol)
- B) Yo'q — faqat matn
- C) Keyin — hozir kerak emas

### Q44. Ko'p kartali (bir necha lavozim) xodim o'quvi navbati
**Nima:** Bir xodim bir necha kartaga biriktirilgan bo'lsa, u har kartaning o'quvini alohida o'tishi kerakmi va navbat qanday.
**Nega kerak:** Zavodda bir kishi bir necha vazifa bajaradi (kichik bo'lim). Har karta o'z bilimini talab qiladi — lekin hammasini birdan o'tish og'ir.
**Variantlar:**
- A) Har karta alohida — birlamchi karta o'quvi birinchi (oylik unga bog'liq), qolganlar navbat bilan
- B) Birlashgan — barcha kartalar kurslari bitta ro'yxatga yig'iladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ko'p karta-xodim bog'lanishi), Oylik

### Q45. Allaqachon ishlayotgan xodimni yangi kursdan ozod qilish (grandfather)
**Nima:** Allaqachon yillab ishlab kelgan, malakali xodimni yangi joriy etilgan majburiy kursdan ozod qilish mumkinmi.
**Nega kerak:** 10 yil ishlagan ustaga boshlang'ich kursni majburlash vaqt isrofi. Lekin ozodlik suiiste'mol qilinmasligi kerak (xavfsizlik kursi bundan mustasno).
**Variantlar:**
- A) Ha, tasdiq bilan — rahbar/HR ma'lum xodimni ma'lum BILIM kursidan ozod qila oladi (sabab qayd); TX/xavfsizlik kursidan ozodlik YO'Q
- B) Yo'q — hamma istisnosiz o'tadi
- C) Keyin — hozir kerak emas

### Q46. Murabbiy bilan birga o'qish vs mustaqil o'qish ajratish
**Nima:** Nazariy o'qishni xodim mustaqil (ilovada) o'qiydimi yoki murabbiy bilan birga ish joyida — kursda bu ajratiladimi.
**Nega kerak:** Savodi past yoki tajribasiz ishchiga mustaqil o'qish og'ir. Kitobda murabbiy bor — lekin nazariy qismni mustaqil ham o'qisa bo'ladi. Har mavzu uchun "kim bilan" belgilansa, jarayon aniq bo'ladi.
**Variantlar:**
- A) Aralash — har mavzuga "mustaqil" yoki "murabbiy bilan" belgisi; murabbiy nazariyni ham nazorat qiladi
- B) Faqat mustaqil — hamma narsa ilovada, murabbiy faqat imtihonda
- C) Keyin — hozir kerak emas

### Q47. O'qish qaysi qurilmada — sex tableti (POS Monitor) / telefon
**Nima:** Operator kompyuter oldida o'tirmaydi. O'qish telefon yoki sex tableti orqali bo'ladimi.
**Nega kerak:** Mashina yonidagi ishchiga kompyuter yo'q — telefon yoki POS/sex tableti yagona imkon. (Generic Q45 "mobil/telefon" umumiy edi — bu AYNAN POS Monitor sex tabletini o'quv ekraniga aylantirish.)
**Variantlar:**
- A) Ha — telefon + sex tableti (POS Monitor)da o'qish; smena oralig'ida qisqa modul
- B) Faqat ofis kompyuteri — markazlashgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: POS Monitor (sex tableti = o'quv ekrani ham)

### Q48. Departament/sex bo'yicha o'quv qatlamlash
**Nima:** Kitobda har departament (1-7) va sex/sektsiya bor. O'quv dasturlari qatlamlanadimi: umumiy korxona + departament/sex + lavozim-karta.
**Nega kerak:** Bir sexning hamma xodimiga umumiy bilim (sex qoidalari, xavfsizlik) + har kartaga xos bilim kerak. Qatlamlash takrorlanishni kamaytiradi.
**Variantlar:**
- A) Uch qatlam — "umumiy korxona" + "departament/sex" + "lavozim-karta" kurslari qatlamlanadi
- B) Faqat karta — hamma o'quv kartaga, guruh kursi yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (departament/sex ierarxiyasi)

### Q49. O'qish eslatmasi kanali — Telegram bot
**Nima:** "O'qishingiz bor", "muddat tugayapti", "qayta-test" eslatmalari Telegram bot orqali yetkaziladimi.
**Nega kerak:** Operator ilovani har kuni ochmaydi. Telegram yetib boradi. (Memory: telegram-bots cron mavjud.) Eslatma yetmasa muddat o'tib ketadi. (Generic Q24 "eslatmalar" kanalni aytmagan — bu AYNAN Telegram bot.)
**Variantlar:**
- A) Telegram bot + ilova ichi — asosiy Telegram bot orqali + ilovada belgi
- B) Faqat ilova ichida
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Telegram bot integratsiyasi, Bildirishnoma moduli

### Q50. "Materialni to'liq o'zlashtirish" o'lchovi (kitob maqsadi)
**Nima:** Kitob maqsadi "материални тўлиқ ўзлаштирилишини таъминлаш". Tizim "to'liq o'zlashtirildi"ni qanday aniqlaydi — faqat test bali yoki murabbiy bahosi + amaliy + mavzu-tasdiqlar ham.
**Nega kerak:** "O'zlashtirdi" o'lchovi noaniq bo'lsa, formal o'tib ketadi. O'lchov egasi tomonidan belgilanishi kerak (master-reja, Q-40).
**Variantlar:**
- A) Uch mezon — nazariy test (o'tish bali) + amaliy imtihon (murabbiy) + mavzu-tasdiqlar 100% — uchalasi
- B) Faqat test bali — bitta raqam
- C) Keyin — hozir kerak emas

### Q51. O'quv tarixi arxivi (xodim ketsa ham, karta varaqasi qoladi)
**Nima:** Xodim nimani o'qigan, qaysi imtihondan o'tgan/yiqilgan tarixi xodim ketsa ham arxivda saqlanadimi; karta nazorat varaqasi kartada qoladimi.
**Nega kerak:** Qayta ishga olinса yoki audit chog'ida tarix kerak. Vizyon "darslik kartaga" — karta varaqasi xodim ketsa ham karta bilan qolishi mantiqiy. (Generic Q48 "data saqlanishi" umumiy edi — bu AYNAN nazorat varaqasi karta bilan qolishi.)
**Variantlar:**
- A) Ha — o'quv tarixi xodim profilida doimiy arxiv + nazorat varaqasi karta tarkibida qoladi (voris o'sha varaqani oladi)
- B) Yo'q — xodim ketsa o'quv ma'lumoti o'chiriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta ("darslik kartaga" vizyoni)

### Q52. Davriy qayta-tasdiq (yo'riqnoma o'zgarmasa ham)
**Nima:** Yo'riqnoma o'zgarmagan bo'lsa ham, xodim o'z lavozim varaqasini davriy (masalan yiliga bir) qayta o'qib tasdiqlashi kerakmi.
**Nega kerak:** Bilim eskiradi va unutiladi. Davriy qayta-tasdiq lavozim talablarini yodda saqlaydi. (Generic Q13 "attestatsiya davriyligi" razryad uchun edi — bu AYNAN lavozim varaqasini qayta o'qish.)
**Variantlar:**
- A) Ha — yiliga bir marta lavozim varaqasini qayta tasdiqlash (qisqartirilgan test bilan)
- B) Faqat o'zgarganda — yo'riqnoma o'zgarmasa qayta o'qish yo'q
- C) Keyin — hozir kerak emas

### Q53. Tashkilij siyosat (ОРГПОЛИТИКА) hujjatlari ham testga bog'lanadimi
**Nima:** Kitobda lavozim yo'riqnomalaridan tashqari "ОРГПОЛИТИКА / ТАШКИЛИЙ СИЁСАТ" hujjatlari bor (masalan: telefon berish tartibi, aloqa xavfsizligi). Bu siyosat hujjatlari ham o'qish/test sifatida tarqatiladimi.
**Nega kerak:** Lavozim bilimidan tashqari, korxona umumiy siyosatlari (tijorat siri, aloqa, telefon) ham xodimga yetishi kerak — kitobda bular alohida hujjat.
**Variantlar:**
- A) Ha — tashkiliy siyosat hujjatlari "umumiy reglament" sifatida tegishli xodimlarga o'qish + tasdiq sifatida tushadi
- B) Faqat lavozim yo'riqnomasi — siyosat hujjatlari LMS'da emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hujjat boshqaruvi, HR

### Q54. Tijorat siri / maxfiylik moduli majburiy
**Nima:** Kitobda "Компания тижорат сирлари, дизайн файллари ва ички маълумотларни ҳимоя қилиш" vazifasi bor. Maxfiylik/tijorat siri bo'yicha alohida majburiy modul + tasdiq bo'ladimi.
**Nega kerak:** Xodim tijorat sirini himoya qilish majburiyatini bilib, yozma tasdiqlashi kerak (huquqiy himoya). Kitobda bu lavozim vazifasi sifatida bor.
**Variantlar:**
- A) Ha — "tijorat siri va maxfiylik" majburiy modul + yozma tasdiq (NDA o'rnida iz qoladi)
- B) Faqat vazifa matni — alohida modul/tasdiq yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (huquqiy himoya), Xavfsizlik

### Q55. Tashqi malaka/sertifikatni ichki kurs o'rniga hisoblash
**Nima:** Xodim tashqarida (texnikum, ishlab chiqaruvchi treningi) olgan sertifikatni tizimga kiritib, ichki kurs o'rniga hisoblash mumkinmi.
**Nega kerak:** Tashqi malaka bor bo'lsa, ichki kursni takrorlash shart emas. Kitobda malaka talablari "o'rta-maxsus/oliy ta'lim" deydi — tashqi diplom/sertifikat tasdiqlanib hisobga olinishi mantiqiy. (Generic Q47 "import sertifikat" umumiy edi — bu AYNAN malaka-talabini tashqi hujjat bilan qondirish.)
**Variantlar:**
- A) Ha — tashqi sertifikat/diplom yuklanadi + HR tasdiqlaydi → tegishli ichki kurs/malaka-talab "qondirilgan" hisoblanadi
- B) Yo'q — faqat ichki kurslar hisobga olinadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (xodim malaka tarixi), Razryad

DONE: LMS / Ta'lim — 55.
