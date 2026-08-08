# LMS / Talim — vizyon savollari

> Sana: 2026-06-07 · Audience: zavod egasi (texnik bo'lmagan)
> Maqsad: LMS / Talim modulini vizyonga (ShVB + karta-markazli model) qo'shish bo'yicha qarorlar.
> Har savol = aniq feature/talab tanlovi. Birinchi variant (A) = vizyonga eng mos tavsiya.
> Kontekst: hozir `position_required_courses` (majburiy kurs + MES bloklash) BOR; lekin ishga-olishda
> avto-tayinlash, reglament testlari (7-kun/qayta-test), micro-modullar, kaizen-PDCA rasmiy,
> sertifikat va "darslik kartaga" ulanishi YETISHMAYDI.

---

### Q1. Darslik kimga biriktiriladi — kartaga yoki xodimga
**Nima:** O'quv kursi (darslik) xodimning shaxsiga emas, lavozim-kartaga bog'lanadimi.
**Nega kerak:** Vizyon "darslik kartaga" deydi — xodim ketsa darslik karta bilan qoladi, yangi kelgan o'sha darslikni o'tadi. Bilim lavozimga tegishli bo'ladi.
**Variantlar:**
- A) Kartaga biriktiriladi — xodim almashsa darslik karta bilan qoladi, voris avtomatik shu darslikni oladi
- B) Xodimga biriktiriladi — har xodim alohida, karta almashsa darslik yo'qoladi
- C) Keyin — hozir kerak emas

### Q2. Darslik tugamaguncha oylik yo'q
**Nima:** Karta darsligini tugatmagan xodimga o'sha kartaning oyligi yozilmaydi degan qoida.
**Nega kerak:** Vizyon (bo'lim 9 va 7): "darslik tugamasa → o'sha karta oyligi yo'q" — bu o'qishni majburlaydigan asosiy tutqich.
**Variantlar:**
- A) Ha, bloklaydi — darslik 100% tugamasa o'sha karta oyligi to'xtaydi (ogohlantirish bilan)
- B) Yumshoq — oylik to'xtamaydi, faqat rahbar/HR'ga ogohlantirish boradi
- C) Keyin — hozir faqat o'qish, oylikka bog'lamaymiz

### Q3. Ishga olinganda kurs avto-tayinlash
**Nima:** Xodim kartaga biriktirilganda, o'sha kartaning majburiy kurslari avtomatik unga tayinlanadimi.
**Nega kerak:** Hozir kurslar qo'lda tayinlanadi (yo'n.27 da "ishga-olishda avto-tayinlash yetmaydi"). Avto-tayinlash hech kim o'qishsiz boshlamasligini kafolatlaydi.
**Variantlar:**
- A) Avtomatik — biriktirish bo'lishi bilan kartaning barcha majburiy kurslari xodimga tushadi + muddat boshlanadi
- B) HR qo'lda — HR har xodimga kerakli kurslarni o'zi belgilaydi
- C) Keyin — hozir kerak emas

### Q4. Kurs tugamaguncha MES (mashinaga) bloklash
**Nima:** Majburiy xavfsizlik/operatsiya kursini tugatmagan xodim mashinada ishlay olmasligi.
**Nega kerak:** `blocks_mes` ustuni allaqachon BOR — o'qimagan operatorni stanokka qo'ymaslik zavod xavfsizligi. Faqat ulash kerak.
**Variantlar:**
- A) Ha, qattiq blok — kurs tugamasa MES o'sha xodimga ishni boshlatmaydi
- B) Faqat ogohlantirish — ishlay oladi, lekin rahbarga signal boradi
- C) Keyin — hozir kerak emas

### Q5. Reglament testlari (yangi feature)
**Nima:** Har bir reglament (qoida/yo'riqnoma)ga bog'liq bilim testi — xodim reglamentni o'qib, test topshiradi.
**Nega kerak:** Hozir umuman YO'Q (yo'n.28). Reglamentni "o'qidim" tugmasi yetarli emas — test bilan haqiqatan tushunganini tekshirish kerak.
**Variantlar:**
- A) To'liq — har reglament uchun test banki + topshirish + ball + qayd
- B) Oddiy — faqat "tanishdim/qabul qildim" tasdiq tugmasi, test yo'q
- C) Keyin — hozir kerak emas

### Q6. Reglament testi uchun 7-kunlik muddat
**Nima:** Yangi/o'zgargan reglament chiqsa, xodim uni 7 kun ichida o'qib test topshirishi shart.
**Nega kerak:** Vizyon (yo'n.28) aniq 7-kun deadline beradi — muddatsiz reglament o'qilmay qoladi.
**Variantlar:**
- A) 7 kun — standart muddat, hammaga bir xil, sanagich avtomatik
- B) Lavozimga qarab — muddatni HR har reglament/lavozim uchun o'zi belgilaydi
- C) Keyin — hozir kerak emas

### Q7. 7-kun o'tib test topshirilmasa nima bo'ladi
**Nima:** Muddat o'tib reglament testi topshirilmagan xodimga tizim qanday choralar ko'radi.
**Nega kerak:** Deadline'ning oqibati bo'lmasa, deadline ishlamaydi. Vizyon oylik/blok orqali majburlaydi.
**Variantlar:**
- A) Bosqichma-bosqich — avval ogohlantirish, keyin rahbar/HR'ga raport, keyin o'sha kartaning oyligi/MES bloklanadi
- B) Faqat raport — HR'ga ro'yxat boradi, qolgani qo'lda hal qilinadi
- C) Keyin — hozir kerak emas

### Q8. Test yiqilganda qayta-test
**Nima:** Test/imtihondan o'tolmagan xodim qayta topshira oladimi va qancha marta.
**Nega kerak:** Vizyon (yo'n.28) "qayta-test" deydi. Bir martalik test adolatsiz — lekin cheksiz urinish ham bilim kafolatlamaydi.
**Variantlar:**
- A) Cheklangan qayta — masalan 2 marta qayta, keyin majburiy qayta-o'qish + rahbar/HR aralashuvi
- B) Cheksiz — istalgancha qayta topshiraveradi, o'tguncha
- C) Keyin — hozir kerak emas

### Q9. O'tish bali (necha foiz = o'tdi)
**Nima:** Testdan o'tgan hisoblanish uchun minimal ball foizi.
**Nega kerak:** Master-data qarori — "o'tdi/yiqildi" chegarasi aniq bo'lishi kerak, aks holda har bo'lim o'zicha qaror qiladi.
**Variantlar:**
- A) Yagona standart (masalan 80%) — barcha kurs/testga bir xil, oddiy va adolatli
- B) Kurs turiga qarab — xavfsizlik kursi 100%, oddiy kurs 60% (HR sozlaydi)
- C) Keyin — hozir kerak emas

### Q10. Micro-modullar (qisqa o'quv bo'laklari)
**Nima:** Katta kursni 5-10 daqiqalik kichik darslarga (micro-modul) bo'lish.
**Nega kerak:** Stub route `/micro-modules` bor, lekin real emas. Zavod ishchisiga uzun kurs o'rniga qisqa bo'laklar mosroq (smena oralig'ida o'tadi).
**Variantlar:**
- A) Ha — har kurs micro-modullarga bo'linadi, har biri alohida o'tiladi va belgilanadi
- B) Yo'q — kurs yaxlit bitta bo'lib qoladi, bo'lish yo'q
- C) Keyin — hozir kerak emas

### Q11. Micro-modul ketma-ketligi majburiymi
**Nima:** Micro-modullarni belgilangan tartibda o'tish shartmi yoki istalgan tartibda.
**Nega kerak:** Ba'zi bilim ketma-ket quriladi (avval asos, keyin murakkab). Lekin majburiy tartib moslashuvchanlikni kamaytiradi.
**Variantlar:**
- A) Ketma-ket — keyingisi oldingisi tugamaguncha ochilmaydi (xavfsizlik/operatsiya uchun)
- B) Erkin — istalgan tartibda, faqat hammasini tugatish kerak
- C) Keyin — hozir kerak emas

### Q12. Kursni kim tayyorlaydi
**Nima:** Darslik/kurs kontentini kim yaratadi va tasdiqlaydi.
**Nega kerak:** Vizyon (bo'lim 9): "O'quv bo'limi qo'lda tayyorlaydi → AI nazorat → HR qaror → rahbar tasdiq". Kim-nima-qiladi aniq bo'lishi kerak.
**Variantlar:**
- A) O'quv bo'limi yaratadi → HR qaror → rahbar tasdiq (vizyon oqimi)
- B) Har bo'lim rahbari o'z kurslarini o'zi yaratadi, tasdiqsiz
- C) Keyin — hozir kerak emas

### Q13. AI kurs/o'qish nazorati
**Nima:** Markaziy AI o'qish jarayonini kuzatib hisobot beradimi (kim o'qidi, kim qoldi, tushundimi).
**Nega kerak:** Vizyon (bo'lim 9, 10): "AI nazorat + hisobot". AI o'qimagan/tushunmaganlarni rahbarga ko'rsatadi.
**Variantlar:**
- A) Ha — AI o'qish holatini kuzatadi + PDF hisobot (xodim/rahbar/HR'ga)
- B) Faqat ro'yxat — AI'siz oddiy jadval (kim tugatdi, kim yo'q)
- C) Keyin — hozir kerak emas

### Q14. AI chatbot orqali o'qitish/savol berish
**Nima:** AI chatbot xodimga darslik bo'yicha tushuntirish berib, savol-javob qiladimi.
**Nega kerak:** Vizyon (bo'lim 10): "Chatbot o'qitish". Mashinasiz/savodi past ishchiga matn o'rniga suhbat orqali o'qitish qulayroq.
**Variantlar:**
- A) Ha — AI chatbot darslikni tushuntiradi va kichik savollar beradi (telegram/ilovada)
- B) Yo'q — faqat matnli/videoli darslik, chatbot yo'q
- C) Keyin — hozir kerak emas

### Q15. Razryad imtihoni LMS ichida
**Nima:** Xodim razryadini ko'tarish imtihoni LMS modulida o'tkaziladimi.
**Nega kerak:** Vizyon (bo'lim 6): "imtihon → o'tsa razryad o'zgaradi → HR hujjat + ichki sertifikat". Razryad-o'sish o'quv bilan bog'liq.
**Variantlar:**
- A) Ha — razryad imtihoni LMS test sifatida, o'tsa HR'ga signal + sertifikat
- B) Alohida — razryad imtihoni HR modulida, LMS'siz
- C) Keyin — hozir kerak emas

### Q16. Razryad imtihonining 3 oylik oralig'i
**Nima:** Razryad imtihonini xodim min. 3 oyda bir marta topshira olishi qoidasi.
**Nega kerak:** Vizyon (bo'lim 6): "min 3 oy oraliq". Tez-tez urinishni cheklaydi, jiddiy tayyorgarlik talab qiladi.
**Variantlar:**
- A) 3 oy — standart, tizim oxirgi imtihondan 3 oy o'tmaguncha yangisini ochmaydi
- B) HR belgilaydi — har lavozim uchun oraliqni HR o'zi sozlaydi
- C) Keyin — hozir kerak emas

### Q17. Razryad o'sishi avtomatikmi
**Nima:** Imtihondan o'tgan xodimning razryadi avtomatik ko'tariladimi yoki tasdiq kerakmi.
**Nega kerak:** Vizyon (bo'lim 6): "o'sish avtomatik EMAS — HR + yuqori rahbariyat tasdiqlaydi". Faqat test yetarli emas.
**Variantlar:**
- A) Tasdiq bilan — test o'tsa ham, razryad faqat HR + rahbar tasdig'idan keyin ko'tariladi
- B) Avtomatik — test o'tishi bilan razryad darrov ko'tariladi
- C) Keyin — hozir kerak emas

### Q18. Ichki sertifikat berish
**Nima:** Kurs/imtihonni tugatgan xodimga zavodning ichki sertifikati (PDF) beriladimi.
**Nega kerak:** Vizyon (bo'lim 6) "ichki sertifikat" deydi. Sertifikat motivatsiya + hujjat-isbot (kim nimani o'tgan).
**Variantlar:**
- A) Ha — avtomatik PDF sertifikat (kurs nomi, sana, razryad, raqam) + arxivga saqlanadi
- B) Yo'q — faqat tizimda "tugatdi" belgisi, qog'oz/PDF yo'q
- C) Keyin — hozir kerak emas

### Q19. Sertifikatning amal qilish muddati (qayta-sertifikatlash)
**Nima:** Sertifikat muddatsizmi yoki ma'lum vaqtdan keyin qayta o'qish/qayta-test kerakmi.
**Nega kerak:** Xavfsizlik/reglament bilimi eskiradi. Muddatli sertifikat davriy yangilanishni majburlaydi.
**Variantlar:**
- A) Muddatli — masalan 1 yil, muddat tugashidan oldin qayta-test eslatmasi keladi
- B) Muddatsiz — bir marta olingan sertifikat doimiy
- C) Keyin — hozir kerak emas

### Q20. Kaizen taklif kiritish (xodim takomillashtirish g'oyasi)
**Nima:** Xodim ish jarayonini yaxshilash taklifini (kaizen) kiritib, ko'rib chiqilishini kuzatadi.
**Nega kerak:** `kaizen_suggestions` jadval BOR (yo'n.34), lekin LMS bilan to'liq bog'lanmagan. Kaizen — uzluksiz o'rganish madaniyatining qismi.
**Variantlar:**
- A) Ha, to'liq — taklif kiritish + holat (yangi/ko'rilmoqda/qabul/rad) + javob xodimga
- B) Oddiy — taklif faqat qutiga tushadi, holat-kuzatuvsiz
- C) Keyin — hozir kerak emas

### Q21. Kaizen uchun rasmiy PDCA tsikli
**Nima:** Qabul qilingan kaizen taklifini Reja-Bajar-Tekshir-Harakat (PDCA) bosqichlari bo'yicha boshqarish.
**Nega kerak:** Audit (yo'n.34) "rasmiy PDCA yetmaydi" deydi. PDCA taklifni shunchaki qabul qilib unutmaslikni, balki amalga oshirishni kafolatlaydi.
**Variantlar:**
- A) To'liq PDCA — har taklif 4 bosqichdan o'tadi, mas'ul + muddat + natija qayd qilinadi
- B) Oddiy — faqat "qabul qilindi/amalga oshdi" 2 holat, bosqichsiz
- C) Keyin — hozir kerak emas

### Q22. Kaizen rag'bati (mukofot)
**Nima:** Foydali kaizen taklifi uchun xodimga rag'bat (bonus/ball) beriladimi.
**Nega kerak:** Rag'bat bo'lmasa xodimlar taklif kiritmaydi. Vizyon bonus tizimi sozlanadi (karta-model bo'lim 7).
**Variantlar:**
- A) Ha — qabul qilingan kaizen kartaning bonus tizimiga ulanadi (HR/rahbar belgilaydi)
- B) Faqat ma'naviy — minnatdorlik/reyting, pul yo'q
- C) Keyin — hozir kerak emas

### Q23. Kurs holati ro'yxati (master-data)
**Nima:** Xodimning bir kursdagi holatini ko'rsatadigan standart holatlar ro'yxati.
**Nega kerak:** Master-data qarori — har joyda bir xil holatlar bo'lishi kerak (rang/hisobot uchun).
**Variantlar:**
- A) Tayinlandi → Boshlandi → Tugatildi → Muddati o'tdi → Yiqildi (to'liq, real holat)
- B) Faqat: Tugatildi / Tugatilmadi (oddiy)
- C) Keyin — hozir kerak emas

### Q24. Video darslik va ko'rilganlik nazorati
**Nima:** Darslik videoli bo'lganda, xodim videoni haqiqatan ko'rganini (oxirigacha) tizim tekshiradimi.
**Nega kerak:** Stub `/video-progress` route bor. Video ochib qo'yib ketishni oldini olish — haqiqatan o'qiganni isbotlaydi.
**Variantlar:**
- A) Ha — video qancha ko'rilgani kuzatiladi, oxirigacha ko'rmasa "tugatildi" bo'lmaydi
- B) Yo'q — video ochilsa "ko'rdim" deb belgilanadi, nazoratsiz
- C) Keyin — hozir kerak emas

### Q25. Lavozim papkasi (position folder) bilan bog'lanish
**Nima:** Kartaning o'quv materiallari (darslik/video/test) lavozim papkasi orqali ko'rsatiladimi.
**Nega kerak:** `position_folders` jadval BOR (4 endpoint), lekin 0 qator + FE ulanmagan. Papka = kartaning "o'quv to'plami".
**Variantlar:**
- A) Ha — har karta papkasida darslik+video+test bir joyda, xodim shu yerdan o'qiydi
- B) Alohida — LMS kurslari papkadan ayri, ulanmaydi
- C) Keyin — hozir kerak emas

### Q26. O'qish kim majburiyligini belgilaydi (majburiy vs ixtiyoriy)
**Nima:** Kursning majburiy yoki ixtiyoriy ekanini kim va qanday belgilaydi.
**Nega kerak:** `is_mandatory` ustuni BOR. Majburiy kurs oylik/MES'ga ta'sir qiladi, ixtiyoriy faqat rivojlanish uchun.
**Variantlar:**
- A) Kartada belgilanadi — HR har karta uchun qaysi kurs majburiy/ixtiyoriy ekanini kartada sozlaydi
- B) Hamma kurs majburiy — ixtiyoriy tushunchasi yo'q
- C) Keyin — hozir kerak emas

### Q27. O'qish davomati 3-kun blokiga ta'sir qiladimi
**Nima:** O'qishni uzoq tashlab qo'ygan xodim profil blokiga (vizyon 3-kun yo'q → blok) bog'lanadimi.
**Nega kerak:** Vizyon (bo'lim 10) 3-kun yo'qlik blokini biladi — o'qishni e'tiborsiz qoldirish ham nazoratda bo'lishi mantiqiy.
**Variantlar:**
- A) Faqat eslatma — o'qish tashlansa AI eslatadi, blok yo'q (blok davomat bilan bog'liq, o'qish bilan emas)
- B) Ulanadi — majburiy kurs muddati o'tib ketsa profil bloki choralariga qo'shiladi
- C) Keyin — hozir kerak emas

### Q28. Yangi reglament chiqqanda kimni qamrab oladi
**Nima:** Yangi/o'zgargan reglament chiqsa, uning testi qaysi xodimlarga tushadi.
**Nega kerak:** Reglament odatda muayyan lavozim/bo'limga tegishli — hammaga tushirsa ortiqcha, noto'g'ri tanlasa qoladi.
**Variantlar:**
- A) Kartaga bog'lab — reglament qaysi kartalarga tegishli bo'lsa, faqat o'sha xodimlarga test tushadi
- B) Hammaga — barcha xodimga bir xil tushadi
- C) Keyin — hozir kerak emas

### Q29. O'quv hisoboti va dashboard
**Nima:** Rahbar/HR uchun o'qish holatini ko'rsatadigan umumiy panel (kim tugatdi, kim qoldi, qaysi bo'lim orqada).
**Nega kerak:** Boshqaruv uchun ko'rinish kerak — qaysi bo'lim o'qishda orqada qolganini bilmasa, choralar ko'rib bo'lmaydi.
**Variantlar:**
- A) Ha — bo'lim/karta kesimida tugatish foizi + orqadagilar ro'yxati + AI tahlil
- B) Oddiy ro'yxat — faqat xodim-kurs jadvali, tahlilsiz
- C) Keyin — hozir kerak emas

### Q30. Onboarding (90 kun) o'qish rejasi bilan bog'lanish
**Nima:** Yangi xodimning 90-kunlik adaptatsiyasi LMS o'quv rejasiga bog'lanadimi.
**Nega kerak:** Onboarding (yo'n.17) BOR (90-kun + mentor). Yangi xodim adaptatsiya davrida aynan kartaning kurslarini o'tishi mantiqiy.
**Variantlar:**
- A) Ha — onboarding bosqichlari LMS kurslari bilan bog'lanadi, mentor o'qishni kuzatadi
- B) Alohida — onboarding va LMS ayri yuradi
- C) Keyin — hozir kerak emas
