# POS Monitor — vizyon savollari

> POS Monitor = zavod omborining planshet (tablet) ilovasi: kirim/chiqim/inventar.
> Bu kassa EMAS (pul → Finance). Quyidagi savollar — egasi vizyonni qanday qo'shishni
> hal qilishi uchun. Har savol bitta aniq qaror. Birinchi variant = tavsiya.

---

### Q1. POS Monitor asosiy vazifasi
**Nima:** Planshet ilovasi nimaga xizmat qiladi — material kirim/chiqim/inventar yoki undan kengroq.
**Nega kerak:** Modulning chegarasini aniqlash boshqa hamma qarorni belgilaydi; chalkashlik (kassa bilan) bo'lmasligi kerak.
**Variantlar:**
- A) Faqat zavod ombori harakatlari (kirim/chiqim/inventar) — toza chegara, kassa Finance'da qoladi
- B) Ombor + ishlab chiqarishga material berish (sex talabi) — kengroq, MES bilan bog'lanadi
- C) Keyin — hozir kerak emas

### Q2. Ombor xodimi planshetda kim sifatida kiradi
**Nima:** Tablet'ga login — har omborchi o'z hisobi bilanmi yoki umumiy "ombor" hisobimi.
**Nega kerak:** Har harakat kim qilganini bilmasak, javobgarlik va inventar farqini tekshira olmaymiz.
**Variantlar:**
- A) Har omborchi shaxsiy login (PIN yoki barcode-bejet) — har harakat ismga bog'lanadi
- B) Umumiy "ombor" hisobi, smenada bitta — sodda, lekin javobgarlik yo'qoladi
- C) Keyin — hozir kerak emas

### Q3. Qaysi omborlar planshetda ko'rinadi
**Nima:** POS Monitor 9 ombor turini (RM-MAIN, FG-STORE, MRO-STORE va h.k.) ko'rsatadimi yoki faqat bittasini.
**Nega kerak:** Har planshet o'z omboriga biriktirilsa, omborchi noto'g'ri omborga harakat yozib yubormaydi.
**Variantlar:**
- A) Har planshet bitta omborga biriktiriladi (qurilma → ombor) — xato kamayadi
- B) Omborchi ekranda ombor tanlaydi (hammasi ko'rinadi) — moslashuvchan, lekin xato xavfi
- C) Keyin — hozir kerak emas

### Q4. Kirim (priyomka) jarayoni qanday boshlanadi
**Nima:** Yangi material kelganda omborchi nimadan kirim ochadi — yetkazib beruvchi schyoti/zakazidan yoki bo'sh formadan.
**Nega kerak:** Kirimni zakazga bog'lasak, narx/miqdor avtomatik to'ldiriladi va xato kamayadi.
**Variantlar:**
- A) Yetkazib beruvchi zakazidan (purchase order) tanlab kirim — miqdor/narx avto, farq darrov ko'rinadi
- B) Bo'sh formadan qo'lda kiritish — tez, lekin xato va nazoratsiz
- C) Ikkalasi ham (zakaz bor bo'lsa undan, yo'q bo'lsa qo'lda)
- D) Keyin — hozir kerak emas

### Q5. Chiqim (otpusk) sababi majburiymi
**Nima:** Materialni chiqarganda sababini ko'rsatish — sexga, sotuvga, ichki ko'chirish, brak.
**Nega kerak:** Sababsiz chiqim qayerga ketganini bilmaymiz; hisobot va GL-yozuv noto'g'ri bo'ladi.
**Variantlar:**
- A) Sabab majburiy, ro'yxatdan tanlanadi (sexga/sotuv/ko'chirish/brak/qaytarish) — har chiqim hisobga tushadi
- B) Sabab ixtiyoriy izoh — sodda, lekin tahlil qilib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q6. Barcode/QR skanerlash — material identifikatsiyasi
**Nima:** Omborchi materialni barcode/QR skanerlab tanlaydimi yoki ro'yxatdan qo'lda izlaydimi.
**Nega kerak:** Skaner xatoni keskin kamaytiradi va harakatni tezlashtiradi — planshet kamerasi yetarli.
**Variantlar:**
- A) Barcode/QR skaner asosiy, qo'lda izlash zaxira — tez va xatosiz
- B) Faqat qo'lda ro'yxatdan tanlash — qo'shimcha jihoz kerak emas, lekin sekin
- C) Keyin — hozir kerak emas

### Q7. Material barcode'i qayerdan keladi
**Nima:** Har materialga barcode/QR bo'lishi uchun u qayerda yaratiladi — kirimda chop etiladimi, yoki yetkazib beruvchiniki ishlatiladimi.
**Nega kerak:** Barcode tizimi bo'lmasa skaner ham ishlamaydi; etiketka kim chop etishini hal qilish kerak.
**Variantlar:**
- A) Kirim paytida ERP o'z barcode'ini chop etadi (planshetga ulangan printer) — yagona standart
- B) Yetkazib beruvchining barcode'i bazaga bog'lanadi — chop etish shart emas, lekin har xil format
- C) Ikkalasi ham qabul qilinadi
- D) Keyin — hozir kerak emas

### Q8. Harakat tasdiqlash (movement confirm) — bir yoki ikki bosqich
**Nima:** Kirim/chiqim yozilganda darrov balansga tushadimi yoki avval boshqa kishi tasdiqlaydimi.
**Nega kerak:** Katta/qimmat harakatlar uchun ikkinchi ko'z xatoni va o'g'irlikni kamaytiradi.
**Variantlar:**
- A) Oddiy harakat darrov, lekin chiqim/katta summa smena boshlig'i tasdig'i bilan — muvozanat
- B) Hamma harakat darrov tushadi (tasdiqsiz) — tez, lekin nazorat zaif
- C) Hamma harakat tasdiq talab qiladi — eng xavfsiz, lekin sekin
- D) Keyin — hozir kerak emas

### Q9. Tasdiqni kim beradi (karta-model bilan bog'liq)
**Nima:** Harakatni tasdiqlovchi shaxs lavozimi — smena boshlig'i, ombor boshlig'i, yoki org-kartadagi keyingi yuqori daraja.
**Nega kerak:** Karta-modeldagi vertikal (manager_id = keyingi yuqori daraja) tasdiq oqimini avtomatik belgilaydi.
**Variantlar:**
- A) Org-kartadagi keyingi yuqori daraja avtomatik tasdiqlaydi (vertikal) — vizyonga mos
- B) Doim ombor boshlig'i (qat'iy lavozim) — sodda, lekin org-modelga bog'lanmagan
- C) Keyin — hozir kerak emas

### Q10. Balans-guard — manfiy qoldiqni taqiqlash
**Nima:** Omborda yo'q materialni chiqarishga urinilsa tizim nima qiladi.
**Nega kerak:** Manfiy qoldiq inventar va GL'ni buzadi; balans-guard "yo'qni chiqarma" qoidasini majburlaydi.
**Variantlar:**
- A) Qat'iy taqiq — qoldiqdan ortiq chiqarib bo'lmaydi (xato ko'rsatiladi) — ma'lumot toza qoladi
- B) Ogohlantirish bilan ruxsat (boshliq tasdig'i kerak) — moslashuvchan, lekin manfiy bo'lishi mumkin
- C) Bemalol ruxsat — eng sodda, lekin xavfli
- D) Keyin — hozir kerak emas

### Q11. Balans-guard chegarasi — minimal qoldiq ogohlantirishi
**Nima:** Material minimal darajadan pasayganda planshetda/tizimda ogohlantirish chiqadimi.
**Nega kerak:** Kech qolingan zakaz ishlab chiqarishni to'xtatadi; minimal qoldiq signali ta'minotni oldindan ogohlantiradi.
**Variantlar:**
- A) Har materialga minimal qoldiq belgilanadi, pasayganda avto-ogohlantirish (ta'minotga) — uzilishsiz
- B) Faqat hisobotda ko'rinadi, avto-signal yo'q — sodda, lekin reaktiv
- C) Keyin — hozir kerak emas

### Q12. GL-koprik — harakat moliyaga qanday tushadi
**Nima:** Kirim/chiqim avtomatik bosh kitobga (entries) yoziladimi yoki faqat ombor balansini o'zgartiradimi.
**Nega kerak:** Material qiymati GL'ga tushmasa, moliya hisoboti omborni ko'rmaydi — ikki dunyo bo'lib qoladi.
**Variantlar:**
- A) Har tasdiqlangan harakat avto GL-yozuv yaratadi (entries jadvaliga) — ombor↔moliya bog'liq
- B) Faqat ombor balansi o'zgaradi, GL alohida qo'lda — sodda, lekin uzilgan
- C) Kunlik yig'ma yozuv (har harakat emas, kun oxirida) — yengilroq, lekin kechikadi
- D) Keyin — hozir kerak emas

### Q13. GL-yozuv qaysi hisoblarga tushadi
**Nima:** Kirim/chiqim qaysi GL hisoblariga yoziladi — material zaxirasi, ishlab chiqarish xarajati, brak hisobi.
**Nega kerak:** To'g'ri hisob xaritasisiz GL-yozuv ma'nosiz; har chiqim sababi o'z hisobiga ulanishi kerak.
**Variantlar:**
- A) Chiqim sababiga qarab avto hisob tanlanadi (sexga→ishlab chiqarish, brak→zarar) — to'g'ri taqsimot
- B) Hamma harakat bitta umumiy "zaxira" hisobiga — sodda, lekin tahlilsiz
- C) Keyin — hozir kerak emas

### Q14. Materialni baholash usuli (kirimda narx)
**Nima:** Chiqimda material qiymati qanday hisoblanadi — o'rtacha narx, FIFO, yoki oxirgi kirim narxi.
**Nega kerak:** Narx usuli GL-yozuv summasini va ombor qiymatini belgilaydi; bir marta tanlanib qat'iy bo'lishi kerak.
**Variantlar:**
- A) O'rtacha tortilgan narx (weighted average) — sodda va barqaror
- B) FIFO (birinchi kelgan birinchi chiqadi) — aniqroq, lekin murakkab
- C) Oxirgi kirim narxi — eng sodda, lekin og'ib ketadi
- D) Keyin — hozir kerak emas

### Q15. Inventar (sanab chiqish) jarayoni
**Nima:** Davriy inventarizatsiya planshetda qanday o'tkaziladi — to'liq sanash yoki tanlab.
**Nega kerak:** Real qoldiq tizim qoldig'idan farq qiladi; inventar bu farqni topib tuzatadi.
**Variantlar:**
- A) Planshetda skaner bilan sanash → tizim farqni avto ko'rsatadi (sahmonka/oshib qolish) — aniq
- B) Qog'ozda sanab keyin qo'lda kiritish — eski usul, sekin va xatoli
- C) Keyin — hozir kerak emas

### Q16. Inventar farqini kim tasdiqlaydi
**Nima:** Sanashda topilgan kam/ortiq farqni balansga yozish uchun tasdiq kerakmi.
**Nega kerak:** Tasdiqsiz farq yozish o'g'irlikni yashirishi mumkin; farq sababi yozilishi kerak.
**Variantlar:**
- A) Farq sabab bilan yoziladi + boshliq tasdig'i + GL'ga zarar/ortiqcha yozuv — to'liq nazorat
- B) Omborchi o'zi tuzatadi, tasdiqsiz — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q17. Inventar qancha tez-tez o'tkaziladi
**Nima:** Sanash davriyligi — har kuni, haftada, oyda, yoki faqat yiliga.
**Nega kerak:** Davriylik aniqlik darajasini belgilaydi; tez-tez sanash xatoni erta topadi.
**Variantlar:**
- A) Sikl-sanash: har kuni bir guruh material aylanma tarzda sanaladi — uzluksiz aniqlik
- B) Oylik to'liq inventar — barqaror, lekin kamroq aniq
- C) Faqat yillik — minimal, lekin farq katta to'planadi
- D) Keyin — hozir kerak emas

### Q18. Ichki ko'chirish (ombordan omborga)
**Nima:** Material bir ombordan boshqasiga o'tkazilganda bitta harakatmi yoki chiqim+kirim juftmi.
**Nega kerak:** Ko'chirish noto'g'ri yozilsa material "yo'qoladi" yoki ikki marta hisoblanadi.
**Variantlar:**
- A) Yagona "ko'chirish" harakati (manba ombordan kamayadi, qabul omborga qo'shiladi, GL'ga ta'sirsiz) — toza
- B) Alohida chiqim + alohida kirim — sodda, lekin uzilgan va xato xavfi
- C) Keyin — hozir kerak emas

### Q19. AI-taklif — nima tavsiya qiladi
**Nima:** Planshetdagi AI omborchiga qanday yordam beradi — zakaz vaqti, anomaliya, narx farqi.
**Nega kerak:** AI ombor xatolarini erta ko'rsatadi va omborchini boshqaradi; vizyondagi har karta o'z AI'siga ega.
**Variantlar:**
- A) Hammasi: minimal qoldiqda zakaz tavsiyasi + g'ayritabiiy harakat ogohlantirishi + narx og'ishi — to'liq aqlli yordamchi
- B) Faqat minimal qoldiq → zakaz tavsiyasi — sodda boshlang'ich
- C) Faqat kuzatish, taklif yo'q — passiv
- D) Keyin — hozir kerak emas

### Q20. AI anomaliya aniqlash
**Nima:** AI g'ayritabiiy harakatni (juda katta chiqim, tunda kirim, takroriy bekor qilish) belgilaydimi.
**Nega kerak:** Anomaliya o'g'irlik yoki xatoning erta belgisi; insondan ko'ra AI uni tezroq sezadi.
**Variantlar:**
- A) AI shubhali harakatni belgilab boshliqqa signal yuboradi — proaktiv nazorat
- B) Faqat hisobotda anomaliya ro'yxati ko'rinadi, avto-signal yo'q — passiv
- C) Keyin — hozir kerak emas

### Q21. Offline rejim — internet yo'qda
**Nima:** Planshet internet uzilganda harakat yozishni davom ettiradimi yoki to'xtaydimi.
**Nega kerak:** Zavod omborida internet uzilishi bo'ladi; ish to'xtamasligi kerak, lekin ma'lumot keyin sinxronlanishi shart.
**Variantlar:**
- A) Offline yozadi, internet kelganda avto-sinxron (balans/GL keyin yangilanadi) — uzluksiz ish
- B) Internet yo'qda bloklanadi (faqat onlayn) — ma'lumot doim aniq, lekin ish to'xtaydi
- C) Keyin — hozir kerak emas

### Q22. Harakatni bekor qilish/tuzatish
**Nima:** Noto'g'ri yozilgan harakatni omborchi o'chiradimi yoki faqat qarshi (storno) harakat bilan tuzatiladimi.
**Nega kerak:** Yozilgan harakatni o'chirish GL va inventar tarixini buzadi; auditda iz qolishi kerak.
**Variantlar:**
- A) O'chirish yo'q — faqat storno (qarshi yozuv) sabab bilan, tarix saqlanadi — auditga toza
- B) Boshliq ruxsati bilan o'chirish mumkin — moslashuvchan, lekin tarix yo'qoladi
- C) Keyin — hozir kerak emas

### Q23. Brak/yaroqsiz material harakati
**Nima:** Buzilgan, muddati o'tgan yoki sifatsiz material qanday hisobdan chiqariladi.
**Nega kerak:** Brak alohida sabab sifatida yozilmasa, u oddiy chiqimdan ajralmaydi va zarar ko'rinmaydi.
**Variantlar:**
- A) Alohida "brak/utilizatsiya" harakati + sabab + GL zarar hisobiga — aniq zarar tahlili
- B) Oddiy chiqim sifatida izoh bilan — sodda, lekin tahlilsiz
- C) Keyin — hozir kerak emas

### Q24. Tayyor mahsulot (FG) ishlab chiqarishdan ombarga qabuli
**Nima:** Sexdan chiqqan tayyor mahsulot omborga qanday kiradi — MES'dan avtomatik yoki planshetda qo'lda.
**Nega kerak:** Tayyor mahsulot avto kelmasa, ombor va MES qoldig'i bir-biriga to'g'ri kelmaydi.
**Variantlar:**
- A) MES ishlab chiqarish yopilganda avto FG-kirim yaratadi, omborchi planshetda tasdiqlaydi — bog'langan
- B) Omborchi qo'lda FG-kirim yozadi — sodda, lekin MES bilan uzilgan
- C) Keyin — hozir kerak emas

### Q25. Partiya/seriya (lot) kuzatuvi
**Nima:** Material partiya raqami va muddati bilan kuzatiladimi yoki faqat umumiy miqdor bilan.
**Nega kerak:** Sifat muammosi yoki muddat tugashida qaysi partiya ekanini bilish kerak (qog'oz/bo'yoq uchun muhim).
**Variantlar:**
- A) Partiya + muddat kuzatiladi (kirimda yoziladi, chiqimda FIFO) — to'liq kuzatuv
- B) Faqat umumiy miqdor, partiyasiz — sodda, lekin sifat izlanmaydi
- C) Faqat muhim materiallar uchun partiya (bo'yoq/elim), qolganlari oddiy
- D) Keyin — hozir kerak emas

### Q26. POS Monitor planshet ekrani ko'rinishi
**Nima:** Tablet ilovasi katta tugmali sodda interfeysmi yoki to'liq jadval/menyuli kompyuter ko'rinishi.
**Nega kerak:** Omborchi qo'lqopda, shoshilinch ishlaydi — interfeys yirik tugmali va xatosiz bo'lishi kerak.
**Variantlar:**
- A) Katta tugmali, kam matnli, skaner-markaz dizayn (sensorli ekranga moslashgan) — tez va xatosiz
- B) To'liq jadvalli desktop ko'rinishi planshetda — ko'p ma'lumot, lekin noqulay
- C) Keyin — hozir kerak emas

### Q27. Harakat hisoboti va smena yopilishi
**Nima:** Smena oxirida planshet kunlik harakat yig'masini (kirim/chiqim/qoldiq) ko'rsatadimi va yopiladimi.
**Nega kerak:** Smena yopilishi omborchi javobgarligini muhrlaydi va keyingi smenaga toza qoldiq beradi.
**Variantlar:**
- A) Smena oxirida yig'ma hisobot + omborchi tasdig'i (smena yopildi) — javobgarlik aniq
- B) Hisobot bor, lekin rasmiy yopilish yo'q — sodda, lekin javobgarlik yumshoq
- C) Keyin — hozir kerak emas

### Q28. Master-data — harakat turlari ro'yxati
**Nima:** Kirim/chiqim sabablari va harakat turlari qayerda boshqariladi — admin sozlamasida moslashuvchan yoki kodda qat'iy.
**Nega kerak:** Egasi yangi sabab (masalan "namuna", "qaytarish") qo'shmoqchi bo'lsa, dasturchisiz qo'sha olishi kerak.
**Variantlar:**
- A) Admin panelda sabab/tur ro'yxati tahrirlanadi (har biri GL hisobiga bog'lanadi) — moslashuvchan
- B) Kodda qat'iy belgilangan ro'yxat — barqaror, lekin o'zgartirish uchun dasturchi kerak
- C) Keyin — hozir kerak emas

### Q29. POS Monitor karta-model bilan integratsiya
**Nima:** Omborchi GSD/ЦКП (statistik ko'rsatkichi) POS Monitor harakatlaridan avto hisoblanadimi.
**Nega kerak:** Karta-modelда har lavozim o'z statistikasiga ega; omborchining statistikasi uning harakatlaridan (aniqlik%, tezlik) chiqishi kerak.
**Variantlar:**
- A) Omborchi GSD avto: inventar aniqligi% + harakat tezligi + xato soni → kartaga ulanadi — vizyonga mos
- B) Statistika alohida qo'lda kiritiladi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas

### Q30. POS Monitor va ikki-ombor dunyosi (kanonik jadval)
**Nima:** Harakat qaysi jadvalga yoziladi — kanonik warehouse_stock'ga yoki eski stocks'ga.
**Nega kerak:** Hozir ikki parallel ombor jadvali bor (warehouse_stock ╳ stocks); POS Monitor bittasini tanlashi kerak, aks holda qoldiq ikkiga bo'linadi.
**Variantlar:**
- A) Faqat kanonik warehouse_stock'ga yoziladi (boshqasi unga ko'chiriladi) — yagona haqiqat
- B) Hozircha ikkalasiga ham yoziladi (compat) — buzilmaydi, lekin chalkashlik qoladi
- C) Keyin — egasi kanonik jadvalni hal qilgach
