# Finance / GL — YANGI (kitob-grounded) savollar

> Manba: `docs/audit/kitob-extracted/` — 2020/2026 zavod hujjatlari (Должностная инструкция + Оргполитикалар + Excel formalar).
> Asosiy topilgan moliyaviy-tegishli hujjatlar:
> - **"РУЛОН ҚОҒОЗ БЕРИШ ВА ФАКТИК ИШЛАТИШНИ ҚАЙД ЭТИШ ТАРТИБ ҚОИДАЛАРИ"** (09.01.2026) — Режа қоғози: rejada 1200 kg, faktda 1300/1500 kg; ortgan rulon qaytariladi; to'ldirilgan Режа қоғози **Бухгалтерия бўлими**ga topshiriladi; Бухгалтерия berilgan/ishlatilgan/qaytarilgan farqini (Камомад) tahlil qiladi.
> - **Счёт-фактура №** — kelgan rulon qog'ozda (yetkazib beruvchi, transport, kelgan/qabul qilingan kg/gr, brak kg, makalatura, gilza).
> - **"Станоклар норма.xlsx"** — har stanok norma штук/час, норма за 12 часов; "Согласовано РД-4 / Утверждено Ген.Директор Позилов А" — taннарх/produktivlik asosi.
> - **"МАЪЛУМОТЛАРНИ САҚЛАШ ВА ФОЙДАЛАНИШ"** оргполитика — har ma'lumotni faqat bitta bo'lim shakllantiradi, boshqalar foydalanadi; og'zaki ma'lumot qaror uchun asos emas.
> Bu savollar mavjud 32 ta savolni (`vision-questions/03-finance.md`: ZVS/ZNO, 4-hisob, FP-tsikl, aging, byudjet, kassa, GL canonical, COA, approval-matrix) TAKRORLAMAYDI.

---

### Q1. Режа қоғози → Бухгалтерия avtomatik ulanishi
**Nima:** Rulon omboridan berilgan/qaytarilgan qog'oz "Режа қоғози" hujjati tizimda to'ldirilib, to'g'ridan-to'g'ri Бухгалтерия (moliya) ko'rish ekraniga tushsinmi.
**Nega kerak:** Hozir qog'oz Режа қоғози qo'lda to'ldirilib bухгалтерияga topshiriladi — bu yo'qolish va kechikishga sabab; tizimda bo'lsa farq darrov ko'rinadi.
**Variantlar:**
- A) Ombor chiqim/kirim qaydidan avtomatik Режа қоғози tuziladi va moliyaga oqadi — qo'lda topshirish yo'qoladi, real vaqtli nazorat
- B) Ombor alohida to'ldiradi, moliya keyin import qiladi — ikki marta ish, kechikish saqlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (chiqim/kirim), MES (sarf), Coordination

### Q2. Камомад (qog'oz kamomadi) moliyaviy aks-etishi
**Nima:** Berilgan minus (ishlatilgan + qaytarilgan) = Камомад farqi topilganda, bu summa pulга aylanib moliyada qayd etilsinmi (yo'qotish/zarar sifatida).
**Nega kerak:** Kitobda Бухгалтерия aynan shu farqni nazorat qiladi deyilgan, lekin farq pulда qancha ekani ko'rinmasa, javobgarlik va zarar bahosi yo'q.
**Variantlar:**
- A) Камомад kg × qog'oz narxi = zarar summasi avtomatik hisoblanadi va smenага bog'lanadi — aniq javobgarlik, zarar ko'rinadi
- B) Faqat kg ko'rsatiladi, pulга aylantirilmaydi — moliyaviy ta'sir noma'lum qoladi
- C) Keyin
  ↳ Agar A: zararni kimga yozish kerak — A) smena rahbariga B) ishlab chiqarish bo'limiga C) umumiy yo'qotishga (egasi belgilaydi)
⤳ Ta'sir: Ombor, MES, HR (javobgarlik/KPI)

### Q3. Rejada 1200 / faktda 1500 — qaysi qiymat taннархга kiradi
**Nima:** Rulon rejada 1200 kg ko'rsatilgan, lekin amalda 1500 kg berilgan bo'lsa, mahsulot taннархига qaysi miqdor kiritiladi.
**Nega kerak:** Kitobda aynan shu vaziyat yozilgan; taннарх noto'g'ri bo'lsa, sotiш narxi ham noto'g'ri bo'ladi.
**Variantlar:**
- A) Faqat haqiqatda ishlatilgan kg (berilgan − qaytarilgan) taннархга kiradi — eng to'g'ri, real sarf
- B) Berilgan to'liq miqdor kiradi — qaytgan qog'oz zarar bo'lib ko'rinadi
- C) Reja miqdori kiradi — fakt e'tiborga olinmaydi, noto'g'ri
⤳ Ta'sir: SD (narx), PP (norma), Ombor

### Q4. Qog'oz narxini kim/qayerdan oladi (taннарх uchun)
**Nima:** Камомад va taннарх hisoblanganda qog'oz 1 kg narxi qayerdan olinadi — oxirgi kelgan Счёт-фактура narximi yoki o'rtacha narxmi.
**Nega kerak:** Bir xil qog'oz turli partiyalarda turli narxda kelgan; qaysi narx ishlatilishi taннархни belgilaydi.
**Variantlar:**
- A) O'rtacha tortilgan narx (weighted average) — barqaror, sakrash yo'q (tavsiya)
- B) FIFO (eng eski partiya narxi) — real chiqim tartibi, lekin murakkab
- C) Oxirgi kelgan narx — sodda, lekin inflyatsiyada noto'g'ri
⤳ Ta'sir: Ombor (partiya), MM (xarid)

### Q5. Счёт-фактура (kelgan rulon) tizimda ro'yxatga olinishi
**Nima:** Kelgan qog'oz rulonidagi Счёт-фактура № (yetkazib beruvchi, kg, gr, transport) tizimga kiritilib, kreditor qarz (biz to'lashimiz kerak) sifatida ro'yxatga olinsinmi.
**Nega kerak:** Kitobda kelgan qog'oz jadvalida Счёт-фактура № maydoni bor; bu yetkazib beruvchiga to'lov majburiyatining boshlanishi.
**Variantlar:**
- A) Счёт-фактура kiritilganda avtomatik kreditor qarz (AP) yoziladi — to'lov nazorati, aging boshlanadi
- B) Faqat ombor kirim qiladi, qarz keyin qo'lda yoziladi — uzilish, kechikish
- C) Keyin
⤳ Ta'sir: Ombor (kirim), MM (yetkazib beruvchi), kreditor aging

### Q6. Счёт-фактура vazni farqi (kelgan gr ╳ qabul qilingan gr) → da'vo
**Nima:** Счёт-фактурада "Кelgan gramm" bilan "Qabul qilingan gramm" farq qilsa (kam kelgan), bu farq yetkazib beruvchiga moliyaviy da'vo bo'lib qayd etilsinmi.
**Nega kerak:** Kitob jadvalida ikkala maydon alohida bor — demak farq tizimli muammo; pul yo'qotish.
**Variantlar:**
- A) Farq avtomatik hisoblanib, yetkazib beruvchi to'loviдан chegirma (da'vo) sifatida belgilanadi — pul qaytadi
- B) Faqat qayd etiladi, to'lovga ta'sir qilmaydi — yo'qotish yopiladi
- C) Keyin
⤳ Ta'sir: MM, kreditor to'lov, Ombor QC

### Q7. Станоклар норма → ish haqi/taннарх asosimi
**Nima:** "Станоклар норма" (norma штук/час) hujjati moliyada operatsiya birlik-taннархини hisoblash uchun manba bo'lsinmi.
**Nega kerak:** Bu hujjat Ген.Директор tomonidan tasdiqlangan; agar norma to'lovga ulanmasa, taннарх faqat materialни hisobga oladi, mehnatни emas.
**Variantlar:**
- A) Har stanok normasi × ish haqi stavkasi = operatsiya taннархи — to'liq taннарх (material + mehnat)
- B) Norma faqat ishlab chiqarish KPI uchun, taннархга kirmaydi — taннарх chala
- C) Keyin
⤳ Ta'sir: PP (norma), MES, HR (ish haqi), SD (narx)

### Q8. "иш йук" (ish yo'q) vaqti — bo'sh turgan stanok xarajati
**Nima:** Norма Excelда "иш йук" (3 soat ish yo'q, archishda ishladi) qayd qilingan — bo'sh turgan vaqt moliyada yo'qotilgan quvvat xarajati sifatida hisoblansinmi.
**Nega kerak:** Stanok bo'sh tursa ham amortizatsiya + ish haqi ketadi; bu "yashirin zarar" hozir hech qayerda ko'rinmaydi.
**Variantlar:**
- A) "иш йук" soatlari × stanok soatlik xarajati = yo'qotilgan quvvat hisobi (oylik hisobot) — boshqaruv ko'radi
- B) Faqat ishlab chiqarish modulида qoladi, moliyaга chiqmaydi — egasi ko'rmaydi
- C) Keyin
⤳ Ta'sir: MES, PP, boshqaruv hisoboti

### Q9. Брак (brak) va Макулатура moliyaviy hisobi
**Nima:** Kitobда "Брак kg", "Макулатура kg", "Рулон брак kg" maydonlari bor — brak/makulatura pulда yo'qotish sifatida hisoblanib, kimga bog'lansin.
**Nega kerak:** Brak = to'g'ridan-to'g'ri zarar; makulatura qisman qaytariladi (sotiladi); ikkalasi moliyaда ajratilishi kerak.
**Variantlar:**
- A) Брак = to'liq zarar, Макулатура = qisman qaytariladigan qoldiq (sotuvga) — aniq ajratish (tavsiya)
- B) Ikkalasi bir xil "chiqindi" sifatida — makulatura qiymati yo'qoladi
- C) Keyin
  ↳ Agar A: makulatura sotuvi daromad sifatida qaysi hisobga tushadi — A) asosiy daromad B) boshqa daromad C) zararни kamaytirish
⤳ Ta'sir: Ombor, QC, SD (chiqindi sotuvi)

### Q10. Гильза (gilza) qaytarish — depozit/qaytariladigan tara hisobi
**Nima:** Kitobда "Гильза" maydoni bor — rulon gilzalari qaytariladigan tara bo'lsa, depozit (qaytariladigan summa) sifatida hisoblansinmi.
**Nega kerak:** Gilza qaytarilmasa pul yo'qoladi; qaytarilsa hisob-kitob kerak.
**Variantlar:**
- A) Gilza qaytariladigan tara depoziti sifatida alohida hisoblanadi — yo'qolish ko'rinadi
- B) E'tiborga olinmaydi — kichik, lekin yig'ilib zarar
- C) Keyin
⤳ Ta'sir: Ombor, MM

### Q11. Хайдовчи/Транспорт xarajati — yetkazib berish taннархи
**Nima:** Kelgan qog'oz jadvalida "Транспорт тури", "Автомобиль №", "Хайдовчи" bor — yetkazib berish xarajati materialning kirim taннархига qo'shilsinmi.
**Nega kerak:** Transport puli material narxining bir qismi; agar alohida xarajat bo'lsa, taннарх past ko'rinadi.
**Variantlar:**
- A) Transport summasi material kirim taннархига taqsimlanadi (landed cost) — to'g'ri taннарх (tavsiya)
- B) Transport alohida umumiy xarajat — sodda, lekin taннарх chala
- C) Keyin
⤳ Ta'sir: MM (xarid), Ombor, taннарх

### Q12. Клей tayyorlash xarajati (Krустик сода, Краxмал, Бура)
**Nima:** Kitobда "Клей тайёрлаш учун: Крустик сода kg, Краxмал kg, Бура kg" bor — yelim tayyorlash uchun ketgan kimyo moliyada alohida xarajat-markazi sifatida hisoblansinmi.
**Nega kerak:** Yelim retsepti aniq nisbatda; sarf nazorat qilinmasa, ortiqcha kimyo zarari ko'rinmaydi.
**Variantlar:**
- A) Yelim tarkibiy moddalari alohida sarf-norma bilan hisoblanadi, ortiqchasi zarar — nazorat
- B) Umumiy "yordamchi material" xarajatiga qo'shiladi — detallashmagan
- C) Keyin
⤳ Ta'sir: MM, MES, taннарх

### Q13. Haftalik "berilgan xom-ashyo hisoboti" → moliya
**Nima:** Kitobда "Флексо бўлимига берилган хом ашёлар бўйича ҳисобот ҳафталик" bor — bu haftalik material sarf hisoboti moliyага avtomatik o'tib, byudjet-fakt taqqoslansinmi.
**Nega kerak:** Haftalik material sarfi moliyага ulanmasa, byudjetdan og'ish kech bilinadi.
**Variantlar:**
- A) Haftalik sarf hisoboti avtomatik moliyага tushadi, byudjet bilan taqqoslanadi — erta ogohlantirish
- B) Faqat ishlab chiqarish ko'radi — moliya kech biladi
- C) Keyin
⤳ Ta'sir: PP, Ombor, byudjet

### Q14. Buyurtmalar tahlili (listlar bo'yicha) — daromad o'sish ko'rinishi
**Nima:** Kitobда "Buyurtmalar bo'yicha tahlili (listlar bo'yicha)" + "O'sish surati 2017/2018" bor — moliyа bu ko'rsatkichni (list soni × narx = daromad) o'sish dinamikasi bilan ko'rsatsinmi.
**Nega kerak:** Egasi yil-ma-yil, oy-ma-oy daromad o'sishini ko'rishni xohlaydi (kitobда mavjud format).
**Variantlar:**
- A) Daromad dashboard: list-soni + summa, oy/yil taqqos, o'sish % — egasi uchun (tavsiya)
- B) Faqat list soni, summasiz — moliyaviy ma'no chala
- C) Keyin
⤳ Ta'sir: SD, boshqaruv hisoboti

### Q15. "Faqat bitta bo'lim ma'lumotни shakllantiradi" — moliya raqamlarining egasi
**Nima:** Оргполитика: har ma'lumotни faqat bitta bo'lim shakllantiradi. Moliyaviy raqamlar (narx, taннарх, qarz) uchun yagona ega bo'lim kim.
**Nega kerak:** Hozir narx 2 joyda (SD ╳ moliyа), taннарх noaniq; oргполитика "bitta manba" talab qiladi.
**Variantlar:**
- A) Taннарх/qarz = Бухгалтерия egaligida, sotiш narxi = SD egaligida, boshqalar faqat o'qiydi — aniq chegara (tavsiya)
- B) Hamma o'zi yozadi — chalkashlik (hozirgi muammo)
- C) Keyin
⤳ Ta'sir: Barcha modullar, master-data

### Q16. "Og'zaki ma'lumot qaror uchun asos emas" — to'lov tasdig'i hujjatsiz bo'lmasin
**Nima:** Оргполитика: og'zaki ma'lumot qaror asosi emas. To'lov/xarajat tasdig'i albatta yozma hujjatga (Счёт-фактура, shartnoma, akt) bog'lansinmi.
**Nega kerak:** Hujjatsiz to'lov = nazoratsiz pul chiqishi; oргполитика to'g'ridan-to'g'ri buni taqiqlaydi.
**Variantlar:**
- A) Har to'lov so'roviga hujjat biriktirish majburiy, bo'lmasa tasdiqlash bloklanadi — qattiq nazorat (tavsiya)
- B) Hujjat ixtiyoriy — bo'shliq qoladi
- C) Keyin
⤳ Ta'sir: ZNO, approval, hujjat ombori

### Q17. Avans hisoboti (подотчёт) — naqd berilgan pul hisoboti
**Nima:** Xodimga oldindan berilgan naqd (avans) keyin chek/akt bilan hisob berilishi (подотчёт) tizimда yuritilsinmi.
**Nega kerak:** Avanslar hisob berilmasa, "yo'qolgan" pul to'planadi; bu mumtoz moliyа nazorati.
**Variantlar:**
- A) Avans berildi → xodim chek bilan hisob beradi → qoldiq qaytariladi/qo'shiladi — to'liq tsikl (tavsiya)
- B) Faqat berilgan summa qayd etiladi, hisob yo'q — nazoratsiz
- C) Keyin
  ↳ Agar A: hisob bermagan avans muddat o'tsa nima — A) ish haqidан ushlanadi B) ogohlantirish C) bloklash
⤳ Ta'sir: HR (ish haqi), kassa, approval

### Q18. Xarajat kategoriyalari (xarajat moddalari) ro'yxati
**Nima:** Xarajatlar qanday toifalarga bo'linadi (material, mehnat, energiya, transport, ta'mir, amortizatsiya, ma'muriy...) — master-ro'yxat.
**Nega kerak:** Toifasiz xarajat tahlil qilib bo'lmaydi; byudjet ham toifa bo'yicha tuziladi.
**Variantlar:**
- A) Standart xarajat moddalari ro'yxati (sozlanadigan) — har xarajat bittasiga bog'lanadi (tavsiya)
- B) Erkin matn — tahlil imkonsiz
- C) Keyin
⤳ Ta'sir: Byudjet, hisobotlar, GL

### Q19. Energiya (elektr/gaz/suv) xarajati — stanokка taqsimlash
**Nima:** Elektr/gaz xarajati har stanok ish soatiga taqsimlanib, operatsiya taннархига kirsinmi.
**Nega kerak:** Bosma stanoklari (SM-52/72, KBA-105, гофра линия) ko'p energiya yeydi; taqsimlanmasa taннарх noto'g'ri.
**Variantlar:**
- A) Stanok soatlik energiya quvvati × ish soati → taннархга taqsim — aniq taннарх
- B) Umumiy ma'muriy xarajat sifatida — taннарх chala
- C) Keyin
⤳ Ta'sir: MES (soat), taннарх, byudjet

### Q20. Stanok amortizatsiyasi — asosiy vositalar reestri
**Nima:** Stanoklar (KBA-105, гофра линия, тигель 1-10...) asosiy vositalar reestrida amortizatsiya bilan yuritilsinmi.
**Nega kerak:** Amortizatsiya taннархнинг bir qismi; reestr bo'lmasa, eskirish va almashtirish rejasi yo'q.
**Variantlar:**
- A) Har stanok asosiy vosita kartochkasi: qiymat, amortizatsiya muddati, oylik amortizatsiya — to'liq (tavsiya)
- B) Faqat ro'yxat, amortizatsiyasiz — moliyaviy ma'no chala
- C) Keyin
⤳ Ta'sir: MES (jihoz), taннарх, soliq

### Q21. Valyuta — import xom-ashyo (qog'oz/kimyo) valyutada
**Nima:** Qog'oz/kimyo importда valyutada (USD/EUR) kelsa, tizim valyuta kursini yuritib, so'mда hisoblasinmi.
**Nega kerak:** Import material narxi kursга bog'liq; kurs farqi taннархни o'zgartiradi.
**Variantlar:**
- A) Ko'p valyuta + kun kursi → so'mда avtomatik, kurs farqi alohida hisob — to'g'ri (tavsiya)
- B) Faqat so'm, kursni qo'lda kiritish — xatolik, eskirgan kurs
- C) Keyin
⤳ Ta'sir: MM (import), kreditor, taннарх

### Q22. Kreditor (yetkazib beruvchi) to'lov muddati — Счёт-фактура shartlari
**Nima:** Har yetkazib beruvchining to'lov muddati (masalan 30 kun, oldindan, yetkazgach) Счёт-фактурага bog'lanib, aging shu muddatdan boshlansinmi.
**Nega kerak:** Hozir aging faqat sana bo'yicha; lekin shartnoma muddati har xil — kechikkan to'lov pени keltiradi.
**Variantlar:**
- A) Har yetkazib beruvchi to'lov muddati profili → aging muddatga nisbatan hisoblanadi — aniq (tavsiya)
- B) Hammaga bir xil muddat — ba'zi to'lovlar noto'g'ri "kechikkan" ko'rinadi
- C) Keyin
⤳ Ta'sir: MM, aging, ZNO

### Q23. Soliqlar (QQS/НДС) — Счёт-фактурада ajratish
**Nima:** Kelgan/chiqgan Счёт-фактурада QQS (НДС) alohida ajratilib, hisobга olinadigan soliq (kirim QQS) sifatida yuritilsinmi.
**Nega kerak:** QQS to'g'ri ajratilmasa, soliq hisobi noto'g'ri; davlatga ortiqcha/kam to'lov.
**Variantlar:**
- A) Har fakturada QQS stavkasi + summasi ajratiladi, kirim/chiqim QQS reestri — soliq tayyor (tavsiya)
- B) QQS umumiy summага qo'shilgan — soliq hisobi qo'lda
- C) Keyin
⤳ Ta'sir: SD (chiqim faktura), MM (kirim faktura), soliq hisoboti

### Q24. Mehnat haqi soliqlari (ИНПС/ЖШДС) → moliya GL ulanishi
**Nima:** HR payroll hisoblagan ИНПС/ЖШДС/ish haqi summalar moliя GL ga (kreditor: davlat, xodim) avtomatik yozilsinmi.
**Nega kerak:** Ish haqi eng katta xarajatlardan; HR ╳ moliя uzilsa, GL chala.
**Variantlar:**
- A) Payroll yopilganda avtomatik GL: xarajat (ish haqi) + kreditor (soliq, xodim) — yagona daftar (tavsiya)
- B) Moliя qo'lda kiritadi — ikki marta ish, xato
- C) Keyin
⤳ Ta'sir: HR (payroll), GL, soliq

### Q25. To'lov usuli (naqd / plastik / o'tkazma / o'zaro hisob)
**Nima:** To'lov qaysi usulда amalga oshgani (naqd kassa, bank o'tkazma, plastik, o'zaro hisob/barter) tizimда ajratilsinmi.
**Nega kerak:** Har usul boshqacha hisob va nazorat talab qiladi; naqd ayniqsa qattiq nazoratда.
**Variantlar:**
- A) To'lov usuli majburiy maydon, har usul o'z hisobiga (kassa/bank) bog'lanadi — aniq (tavsiya)
- B) Faqat summa, usul yo'q — naqd nazorati zaif
- C) Keyin
⤳ Ta'sir: Kassa, bank, ZNO

### Q26. Bir nechta bank hisobi (so'm/valyuta) — qoldiq ko'rinishi
**Nima:** Kompaniyaning bir nechta bank hisobi (so'm, valyuta, har xil bank) bo'lsa, har birining real-time qoldig'i moliyа ekranida ko'rinsinmi.
**Nega kerak:** Egasi qaysi hisobда qancha pul borligini bir joydan ko'rishi kerak (to'lov rejasi uchun).
**Variantlar:**
- A) Har bank hisobi alohida, umumiy qoldiq dashboard — to'lov rejasi aniq (tavsiya)
- B) Bitta umumiy qoldiq — qaysi hisobда yetishmasligi ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Kassa, ZNO, byudjet

### Q27. To'lov kalendari (kun bo'yicha kirim/chiqim prognozi)
**Nima:** Yaqin kunlarда qaysi to'lovlar kelishi (debitor) va qaysilar to'lanishi (kreditor) kerakligi kalendarда ko'rinsinmi (cash-flow prognoz).
**Nega kerak:** Pul yetmasligi (kassa bo'shligi) oldindan ko'rinmasa, to'lovlar uziladi.
**Variantlar:**
- A) Kun bo'yicha kirim/chiqim kalendari + qoldiq prognozi — bo'shliq oldindan ko'rinadi (tavsiya)
- B) Faqat o'tgan to'lovlar — prognoz yo'q
- C) Keyin
⤳ Ta'sir: Aging, ZNO, byudjet

### Q28. Debitor (mijoz qarzi) limiti — SD ga bog'lash
**Nima:** Har mijozга qarz limiti (kredit chegarasi) belgilanib, limit oshganда yangi buyurtma SD da bloklansinmi.
**Nega kerak:** Limitsiz mijoz cheksiz qarzga oladi, keyin to'lamaydi — pul muzlaydi.
**Variantlar:**
- A) Mijoz kredit limiti → oshса SD buyurtmasi bloklanadi/tasdiqга chiqadi — risk nazorati (tavsiya)
- B) Limit yo'q, faqat aging ko'rsatadi — kech bilinadi
- C) Keyin
⤳ Ta'sir: SD, CRM, aging
  ↳ Agar A: limitни kim oshira oladi — A) faqat egasi B) moliя rahbari C) sotiш rahbari

### Q29. Qisman to'lov va to'lovni fakturalarga taqsimlash
**Nima:** Mijoz bir nechta fakturани qoplab bitta summа to'lasa, bu to'lov qaysi fakturаларга qanday taqsimlanishi tizimда boshqarilsinmi.
**Nega kerak:** Taqsimsiz qaysi faktura yopilgani noaniq; aging buziladi.
**Variantlar:**
- A) To'lov fakturаларга qo'lда/avtomatik (eng eski avval) taqsimlanadi — aniq aging (tavsiya)
- B) Umumiy balansга qo'shiladi, faktura darajasiz — aging chala
- C) Keyin
⤳ Ta'sir: SD, aging, debitor

### Q30. Пеня/jarima — kechikkan to'lovga
**Nima:** Mijoz to'lovni kechiktirса pени (jarima foizi), yoki biz yetkazib beruvchiga kechiksak — shartnoma bo'yicha pени hisoblansinmi.
**Nega kerak:** Pени hisoblanmasa, kechikish "bepul" bo'lib, intizom yo'qoladi.
**Variantlar:**
- A) Shartnomага ko'ra pени foizi avtomatik hisoblanadi (kechikkan kun × stavka) — intizom (tavsiya)
- B) Pени qo'lда, kerak bo'lganда — ko'pincha unutiladi
- C) Keyin
⤳ Ta'sir: SD, aging, kreditor

### Q31. Inventarizatsiya farqi (ombor sanоq) → moliya
**Nima:** Ombor inventarizatsiyasida (kitobда "инвентаризация" tilga olinган) topilgan ortiqcha/kamomad moliyага avtomatik tuzatma (zarar/daromad) sifatida o'tsinmi.
**Nega kerak:** Sanoq farqi pulда aks etmasa, ombor qiymati noto'g'ri, taннарх xato.
**Variantlar:**
- A) Sanoq farqi avtomatik GL tuzatmasi (kamomad=zarar, ortiqcha=daromad) — ombor qiymati to'g'ri (tavsiya)
- B) Faqat ombor tuzatadi, moliя bilmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Ombor, GL, taннарх

### Q32. Davr yopish (oy yopilishi) — qulflanган davrга yozuv taqiqi
**Nima:** Oy yopilгач (hisobot berilгач), o'sha davrга orqага qaytib yozuv kiritish bloklansinmi.
**Nega kerak:** Yopilган davr o'zgartirilса, hisobot bilan haqiqat farq qiladi; mumtoz buxgalteriя qoidasi.
**Variantlar:**
- A) Davr yopilganда qulflanadi, faqat egasi/moliя rahbari ocha oladi — ishonchli hisobot (tavsiya)
- B) Har doim ochiq — orqага o'zgartirish mumkin, ishonchsiz
- C) Keyin
⤳ Ta'sir: GL, hisobotlar, audit

### Q33. Совершенствование bo'limi → moliyaviy tahlil roli
**Nima:** Kitobда Совершенствование bo'limi har oy ma'lumotни tahlil qiladi — moliyaviy og'ishlar (byudjet-fakt, taннарх o'sishi) ham shu bo'lim tahliliga kirsinmi.
**Nega kerak:** Оргполитика tahlil rolini aynan shu bo'limga beradi; moliя alohida qolса, takror ish.
**Variantlar:**
- A) Moliyaviy og'ish hisobotlari Совершенствование oylik tahliliga avtomatik kiradi — yagona tahlil markazi (tavsiya)
- B) Moliя alohida tahlil qiladi — ikki markaz, takror
- C) Keyin
⤳ Ta'sir: Coordination, hisobotlar, boshqaruv

### Q34. Byudjet-fakt og'ishига talab (расмий талаб) jo'natish
**Nима:** Оргполитика: ma'lumot yetishmasа Совершенствование mas'ul bo'limга расмий талаб yuboradi. Byudjet og'ishi katta bo'lса, avtomatik tushuntirish talabi mas'ul bo'limга borsinmi.
**Nega kerak:** Og'ish sababsiz qolса, takrorlanadi; kitob расмий ёзма талаб mexanizmini belgilaydi.
**Variantlar:**
- A) Og'ish chegaradan oshса → mas'ul kartага avtomatik tushuntirish talabi (Coordination) — javobgarlik (tavsiya)
- B) Faqat hisobotда ko'rsatiladi, talab yo'q — sabab so'ralmaydi
- C) Keyin
⤳ Ta'sир: Coordination, byudjet, karta-model

### Q35. Buyurtma rentabelligi (har buyurtmadan foyda)
**Nima:** Har buyurtma yopilгач, uning real foydasi (sotiш − material − mehnat − energiya) hisoblanib ko'rinsinmi.
**Nega kerak:** Qaysi buyurtma/mijoz foydali, qaysi zararли — bu ko'rinmаса noto'g'ri ish olinadi.
**Variantlar:**
- A) Har buyurtma yopilганда rentabellik kartochkasi (daromad − to'liq taннарх) — qaror uchun (tavsiya)
- B) Faqat umumiy oylik foyda — buyurtma darajasiz, ko'r-ko'rona
- C) Keyin
⤳ Ta'sир: SD, PP, taннарх
  ↳ Agar A: zararли buyurtma topilса nima — A) mijoz narxi qayta ko'riladi B) ogohlantirish C) qabul qilinmaydi

### Q36. Минимал buyurtma narxi / narxдан past sotuv taqiqi
**Nima:** Taннархдан past narxда sotuv (zararга sotuv) SD da bloklansin yoki egasi tasdig'ига chiqsinmi.
**Nega kerak:** Sotuvchi mijozни ushlash uchun taннархдан past narx qo'yса, kompaniя zarar ko'radi.
**Variantlar:**
- A) Narx taннархдан past bo'lса → bloklash yoki egasi tasdig'и — zararга sotuv oldi olinadi (tavsiya)
- B) Erkin narx — sotuvchi ixtiyorида, zarar xavfi
- C) Keyin
⤳ Ta'sир: SD, taннарх, approval

### Q37. Chegirma (skidka) vakolat darajasi
**Nima:** Mijozга chegirma berishда qaysi lavozim qancha foizгача chegirma bera oladi — vakolat darajasi belgilansinmi.
**Nega kerak:** Cheklovsiz chegirma foydани yeydi; kim qancha bera olishi aniq bo'lishi kerak.
**Variантlar:**
- A) Chegirma vakolat darajasi (sotuvchi ≤5%, rahbar ≤15%, egasi >15%) — nazorat (tavsiya)
- B) Chegirma cheklovsiz — foyda nazoratsiz
- C) Keyin
⤳ Ta'sир: SD, approval, karta-model

### Q38. О'заро hisob (vzaimозачёт / barter) hisobi
**Nima:** Mijoz/yetkazib beruvchi bilan o'zaro hisob (biz unга qarzмиз, u bizга qarzдор → o'zaro yopish) tizimда rasmiylashtirilsinmi.
**Nega kerak:** Naqd aylanmасдан qarz yopilса, hujjatsiz qolса nazorat yo'qoladi.
**Variантlar:**
- A) O'zaro hisob akti tuziladi, ikki tomon qarzи bir vaqtда yopiladi — hujjatли (tavsiya)
- B) Qo'lда tuzatma — izlanmайди, xato
- C) Keyin
⤳ Ta'sир: SD, MM, debitor/kreditor

### Q39. Yetkazib beruvchini moliyaviy baholash (eng arzon/ishonchli)
**Nima:** Bir xil qog'озни turli yetkazib beruvchи turli narx/sifatда beradi — tizим narx + brak% + kechikiш bo'yicha yetkazib beruvchини baholasinmi.
**Nega kerak:** Eng arzon har doim eng foydали emas (brak ko'p, kechikadi); moliya buni ko'rishi kerak.
**Variантlar:**
- A) Yetkazib beruvchи reytinги: narx + brak% + kechikiш — eng foydали tanlov (tavsiya)
- B) Faqat narx — yashirin xarajat (brak) hisobга olinmайди
- C) Keyin
⤳ Ta'sир: MM, QC (brak), Ombor

### Q40. Naqd kassa limiti va kunlik inkassация
**Nima:** Kassada qolishi mumkin bo'lган maksimal naqd (limit) belgilanиб, oshса bankка inkассация (topshirish) eslatmаси chiqsinmi.
**Nega kerak:** Kassada ko'p naqd = xavf (o'g'irлик, nazoratsizлик); limit klassик qoida.
**Variантlar:**
- A) Kassa limiti + oshса inkассация eslatmаси — xavfsizlик (tavsiya)
- B) Limitsiz — naqd to'planadi, xavf
- C) Keyin
⤳ Ta'sир: Kassa, bank

### Q41. Ish haqi avansi (oyning yarmida) hisobi
**Nima:** Xodimларга oyning yarmида avans (ish haqi avansi) berilса, oxirида qolган summа (avans chegирилган holда) hisoblansinmi.
**Nega kerak:** Zavodларда avans odatий; HR ╳ moliя to'g'ри ulanmаса, ikki marta to'lov xavfи.
**Variантlar:**
- A) Avans HR payroll цикlида qayd → oxирги hisob avansни chegиради — to'g'ри (tavsiya)
- B) Avans qo'lда — xato, ikki marta to'lov
- C) Keyin
⤳ Ta'sир: HR, kassa/bank

### Q42. Jarima/ushlanma (xodим zararи) ish haqидан
**Nima:** Xodим zarar yetkazса (brak, Камомад, rohler buziш — kitobда javobgарлик bor), bu summа ish haqидан ushlanса, moliя/HR bog'lansinmi.
**Nega kerak:** Kitobда javobgарлик aniq belgиланган, lekin pulда qanday undirилишi noaniq.
**Variантlar:**
- A) Zarar summasi → tasdiqланса ish haqидан ushlanма sifatида (qonуний chegара ichида) — javobgарлик real (tavsiya)
- B) Faqat ogohlantирish, pul undirилmайди — javobgарlик qog'озда qoladi
- C) Keyin
⤳ Ta'sир: HR, MES (brak), karta-model
  ↳ Agar A: maksimal ushlanма foizi qancha (qonun bo'yicha) — egasi/yurист belgиlайди

### Q43. Loyiha/buyurtма avans to'lovи (mijozдан oldindан)
**Nима:** Mijoz buyurtмага oldindан avans (масалан 50%) to'lаса, bu avans olдиндан to'lов sifatида yuritилиб, yetkazилгач yopилsinmi.
**Nega kerak:** Avans daromад emas (hали yetkazилмаган); noto'g'ри hisobланса, soliq/foyda xato.
**Variантlar:**
- A) Mijoz avansи alohида (kreditor-mijoz) hisob → yetkazилгач daromадга o'tади — to'g'ри (tavsiya)
- B) Darrov daromад sifatида — soliq erta, xato
- C) Keyin
⤳ Ta'sир: SD, soliq, debitor

### Q44. Quvvat-narx: bo'sh quvват ortганда narx pasaytириш qarori
**Nima:** Станоклар нормада ko'rinган bo'sh quvват (иш йук) bo'lса, qo'shimча buyurtмани past narxда (lekin taннархдан yuqори) qabul qилиш qarori moliя tahlилидан o'tsinmi.
**Nega kerak:** Bo'sh stanok zarar; to'liq narx kutиб zarar ko'rishдан ko'ра, marjинал foyда bilan to'lдириш foydали bo'lishi mumkin — lekin tahlилсиз xato.
**Variантlar:**
- A) Bo'sh quvват + marjинал-narx tahlили → qaror egага chiqади — aqlли to'lдириш (tavsiya)
- B) Har doim to'liq narx — bo'sh quvват zararда qoladi
- C) Keyin
⤳ Ta'sир: PP (quvват), SD (narx), MES

### Q45. Tannarx versiyaси (norма o'zgarганда tarих)
**Нima:** Станоклар норма yoki material narxи o'zгарса, eski buyurtмалар taннархи eski norма bilan, yangiлари yangi bilan hisoblanиб, taрих saqlansinmi.
**Nega kerak:** Norма vaqт-vaqтда yangiланади (kitob норма hujjati sanaли); taрихsiz eski hisoblar buzilади.
**Variантlar:**
- A) Norма/narx versияли (amal qилиш sanaси bilan) → har buyurtма o'z davридаги qiymат bilan — aniq taрих (tavsiya)
- B) Faqat joriy qiymат — eski hisoblar o'zгариб ketади
- C) Keyin
⤳ Ta'sир: PP (norма), taннарх, hisobotлар

### Q46. Xarajат-markazи (бўлим/участка bo'yicha xarajат)
**Nима:** Xarajатлар bo'lim/участка (Флексо, Офсет, гофра, омбор...) bo'yicha ajratилиб, har bo'limнинг xarajати alohида ko'rinsinmi.
**Nega kerak:** Qaysi bo'lim ko'p xarajат qилаётганини ko'риш uchun; kitobда bo'limlар aniq (Флексо/Офсет).
**Variантlar:**
- A) Har xarajат xarajат-markазига (бўлимга) bog'lanади → bo'lim-bo'yicha hisobот — javobgарлик (tavsiya)
- B) Umumий xarajат — qaysi bo'lim ko'p sarflагани noma'lум
- C) Keyin
⤳ Ta'sир: barcha ishlаб chiqариш bo'limlари, byudjet, karta-model

### Q47. Daromад tan olиш vaqти (yetkazилганда / to'langanда)
**Нima:** Daromад qachон tan olинади — buyurtма yetkazилганда (akт imzolanganда)mи yoki pul kelгандаmи.
**Nega kerak:** Bu soliq va foyда hisobини tubдан o'zгартиради; standart bo'lishi shart.
**Variантlar:**
- A) Yetkazилганда (akт/накладной bilan) tan olинади — standart accrual (tavsiya)
- B) Pul kelганда — sodda (kassа usuли), lekin foyда noto'g'ри ko'rinади
- C) Keyin
⤳ Ta'sир: SD, soliq, hisobотлар

### Q48. To'lов so'rови (ЗНО) navbати/ustuvорлиги
**Нima:** Bir vaqtда ko'p to'lов so'rови bo'lса, pul yetмаганда qайси birини avval to'lаш (ustuvорлик: ish haqи > soliq > xom-ashyo > boshqа) tizим ko'rsatsinmi.
**Nega kerak:** Pul cheklанган paytда noto'g'ри ustuvорлик zavodни to'xtатиши mumkин (xom-ashyo to'lanmasа).
**Variантlar:**
- A) To'lов ustuvорлик darajaси (sozланадиган) → navbат avtomatик taklif — aqlли to'lов (tavsiya)
- B) Kim avval so'raса — sub'ektив, kritик to'lов kechикиши mumkин
- C) Keyin
⤳ Ta'sир: ZNO, kassа, byudjet

### Q49. Pul aylanма davrи (mijoz to'lаши − biz to'lаshımız)
**Нima:** Mijozдан pul kelгунча va biz yetkazib beruvchıга to'lаgunча o'tган kunlар (cash conversion) ko'rsatkичи hisoblansinmi.
**Nega kerak:** Agar biz tezroq to'lаб, sekinroq olсак — pul muzlайди; bu ko'rsатки muammони ko'rsатади.
**Variантлар:**
- A) Pul aylanма davrи dashboard (debitor kun − kreditor kun + ombor kun) — likвидлик nazorати (tavsiya)
- B) Faqat aging — umумий rasm yo'q
- C) Keyin
⤳ Ta'sир: aging, ombor, byudjet

### Q50. Moliyaviy dashboard egasi uchun (1 ekran)
**Нima:** Egага bitta ekranда: bugунги kassa/bank qoldиq, kutilаётган kirim/chiqim (7 kun), debitor/kreditor jami, oyлик foyда — ko'rsатilsinmi.
**Nega kerak:** Egа har modulга kirмасдан moliyaviy holatни 10 sekundда ko'риши kerak.
**Variантлар:**
- A) Egа moliя dashboardи (qoldиq + 7-kun prognoз + qarzlар + foyда) — tezkор qaror (tavsiya)
- B) Har raqам alohида modulда — egа yig'иб ko'риши qiyин
- C) Keyin
⤳ Ta'sир: barcha moliя ekranlари, boshqарув

### Q51. "Режа қоғози"да imzo/qabul-topshıрıш zanjırı
**Нima:** Kitob jadvалида "Qabul qildim: F.I.O____ Imzo____" bor — Режа қоғози topshıрıш-qabul qılış (ombor → таъминотчı → бухгалтерия) tizımда imzo/tasdиq zanjırı bilan yuritılsinmi.
**Nega kerak:** Imzosiz topshıрıш = javobgarlık uzilади; kim bergan, kim olган noaniq.
**Variантлар:**
- A) Har bosqıchда elektrон tasdиq (kim berди / kim oldı / qachон) — uzilмас zanjır (tavsiya)
- B) Faqat oxırги bухгалтерия qaydı — oraдаги javobgarlık yo'q
- C) Keyin
⤳ Ta'sır: Ombor, Coordination, karta-model

### Q52. Faktura-to'lov-yetkaziш uchlığı (3-way match)
**Нima:** Yetkazib beruvchıга to'lаshдан oldın: buyurtма (zakaz) ╳ kelган Счёт-фактура ╳ ombor kirim (qabul qılınган kg) uchаласи mos kelsinmi.
**Nega kerak:** Mos kelмаса (buyurtма 1000 kg, faktura 1000, kirim 950) — ortıqcha to'lов xavfi; mumtoz nazorат.
**Variантлар:**
- A) 3-way match: zakaz=faktura=kirim bo'lмаса to'lов bloklanади — ortıqcha to'lов oldı olinади (tavsiya)
- B) Faqat faktura bo'yicha to'lов — kirim tekshırılmайди, xato
- C) Keyin
⤳ Ta'sır: MM, Ombor, ZNO, kreditor

### Q53. Brak% chegараси oshса taннарх ogohlantíruvı
**Нima:** Станоклар нормада "брак %" bor — agar buyurtмада brak% normадан oshса, qo'shímча material/taннарх ogohlantírıshı moliyага chiqsinmi.
**Nega kerak:** Ortıqcha brak = ortıqcha material sarfi = taннарх oshıshı; norма bor ekan, taqqoslаш kerak.
**Variантлар:**
- A) Brak% > norма → taннарх og'ıshı + ogohlantírış — erta nazorат (tavsiya)
- B) Faqat QC ko'radı — moliyaviy ta'sir ko'rinмайди
- C) Keyin
⤳ Ta'sır: QC, MES, taннарх

### Q54. Yangi material/stanok narxını kim kiritади (master-data egaligı)
**Нima:** Material narxı, stanok normа-stavkası kabi moliyaviy master-ma'lumotни kiritиш/o'zгартıрıш vakolатı qaysi kartага berılади.
**Nega kerak:** Оргполитика "bitta egа" talab qiladı; narx noto'g'ри bo'lса butun taннарх buzilади.
**Variантлар:**
- A) Narx master-data faqat Бухгалтерия/moliя kartасı egaligıда, boshqалар o'qiyди — yagona haqiqат (tavsiya)
- B) Har bo'lim o'zı kiritадı — ziddiyat (hozırги muammо)
- C) Keyin
⤳ Ta'sır: master-data, barcha modullar, karta-model
DONE: Finance / GL — 54.
