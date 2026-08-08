# Ombor / WMS — YANGI (granular) vizyon savollari

Bu hujjat yuqori darajadagi vizyon savollaridan keyingi CHUQUR, DETALLI savollar to'plami. Maqsad: rulon kartochkasidagi aniq maydonlar, material klassifikatsiyasi, kirim/chiqim blankalari, inventarizatsiya, min/max/reorder, karantin, ombor-ichi ko'chirish va partiya/batch qoidalarini aniqlash. Har bir savolda birinchi variant — tavsiya etilgan.

---

## 1-BO'LIM. Rulon kartochkasi maydonlari (kenglik / zichlik / qoldiq)

### Q1. Rulon kartochkasida asosiy o'lchov maydonlari
**Nima:** Har bir qog'oz/karton rulon kartochkasida qaysi fizik o'lchovlar saqlanadi?
**Nega kerak:** Ishlab chiqarish rulonni kesishni va sarfni shu maydonlar bo'yicha hisoblaydi; noto'g'ri maydon = noto'g'ri sarf.
**Variantlar:**
- A) Kenglik (mm) + Diametr (mm) + Zichlik/gramaj (g/m²) + Og'irlik (kg) + Uzunlik (m) — to'liq, eng aniq
- B) Faqat Kenglik + Gramaj + Og'irlik — soddaroq, lekin uzunlik hisoblanmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (rulon kesish/sarf), Sotuv (narx kg yoki m²), Finance (zaxira qiymati)

### Q2. Gramaj (zichlik) o'lchov birligi va diapazoni
**Nima:** Qog'oz zichligi qaysi birlikda va qanday qiymatlar ro'yxatidan tanlanadi?
**Nega kerak:** Karton zavodida gramaj asosiy sifat ko'rsatkichi; standart ro'yxat xatoni kamaytiradi.
**Variantlar:**
- A) g/m² (masalan: 80, 90, 100, 115, 125, 140, 150, 170, 200, 230, 250, 280, 300) — tanlovli ro'yxat, xato kam
- B) Erkin kiritiladigan raqam — moslashuvchan, lekin xato ko'p
- C) Keyin — hozir kerak emas

### Q3. Rulon qoldig'ini o'lchash usuli
**Nima:** Rulonda qancha material qolganini tizim qanday hisoblaydi — og'irlik (kg) bo'yicha, uzunlik (m) bo'yicha yoki diametr bo'yicha?
**Nega kerak:** Yarim ishlatilgan rulonlar zavodda eng ko'p; qoldiq noto'g'ri bo'lsa ombor soni yolg'on chiqadi.
**Variantlar:**
- A) Og'irlik (kg) asosiy + uzunlik avtomatik hisob (gramaj×kenglik orqali) — tarozida o'lchash oson
- B) Uzunlik (m) asosiy — kesish mashinasidan o'qiladi, lekin qo'lda kiritish qiyin
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Tarozi natijasi qo'lda kiritiladimi yoki tarozi tizimga ulanadimi? (qo'lda / avto-ulanish / keyin)

### Q4. Yarim rulon (ochilgan rulon) statusi
**Nima:** Ochilib, qisman ishlatilgan rulonga alohida status beriladimi (masalan "ochilgan", "to'liq", "qoldiq")?
**Nega kerak:** Ochilgan rulon birinchi ishlatilishi kerak (FIFO buzilmasligi uchun); status bo'lmasa yangi rulon ochiladi, eski chiqindiga ketadi.
**Variantlar:**
- A) Ha — status: To'liq / Ochilgan / Qoldiq(minimal) — ochilganlar avval taklif qilinadi
- B) Yo'q — faqat qoldiq miqdor ko'rsatiladi, status yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (material berishda ochilgan rulon birinchi)

### Q5. Rulonning noyob raqami (rulon ID/yorliq)
**Nima:** Har bir jismoniy rulonga alohida noyob raqam (barcode/QR yorliq) beriladimi yoki faqat material turi bo'yicha umumiy hisob yuritiladimi?
**Nega kerak:** Noyob raqam bo'lsa har bir rulonni alohida kuzatish, partiya, joylashuv aniq bo'ladi; bo'lmasa faqat "X material — Y kg" deyiladi.
**Variantlar:**
- A) Har rulonga noyob ID + bosib chiqariladigan yorliq (QR/barcode) — to'liq kuzatuv
- B) Faqat material turi bo'yicha umumiy miqdor — soddaroq, lekin rulonma-rulon yo'q
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Yorliqni kim bosadi — kirimda ombor xodimi yoki etiketka avtomat? (ombor xodimi / avto / keyin)

### Q6. Rulon manbasi (yetkazib beruvchi + sertifikat)
**Nima:** Kartochkada yetkazib beruvchi, ishlab chiqaruvchi zavod va sifat sertifikati raqami saqlanadimi?
**Nega kerak:** Sifat muammosi chiqsa qaysi yetkazib beruvchidan kelganini va sertifikatini topish kerak.
**Variantlar:**
- A) Yetkazib beruvchi + ishlab chiqaruvchi + sertifikat raqami + kelgan sana — to'liq izlanuvchanlik
- B) Faqat yetkazib beruvchi nomi — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (reklamatsiya), Xaridlar (yetkazib beruvchi reytingi)

### Q7. Rulon rangi/turi va qoplama
**Nima:** Kartochkada qog'oz turi (kraft, beliy, makulatura, test-layner, flyuting) va qoplama (laklangan, plyonka) ko'rsatiladimi?
**Nega kerak:** Buyurtmaga to'g'ri tur tanlanishi kerak; aralashib ketsa brak chiqadi.
**Variantlar:**
- A) Tur (kraft/test-layner/flyuting/beliy/makulatura) + qoplama maydoni — aniq tanlov
- B) Faqat material nomi ichida matn sifatida — qidirish qiyin
- C) Keyin — hozir kerak emas

### Q8. Namlik va saqlash sharti maydoni
**Nima:** Rulon kartochkasida namlik darajasi (%) va talab qilinadigan saqlash sharti (harorat/namlik) ko'rsatiladimi?
**Nega kerak:** Qog'oz nam tortsa gramaji va mustahkamligi o'zgaradi, brak chiqadi; namlik nazorati zarur.
**Variantlar:**
- A) Namlik (%) + tavsiya etilgan saqlash zonasi maydoni — sifat himoyasi
- B) Faqat ogohlantiruvchi belgi (nam joyda saqlamang) — minimal
- C) Keyin — hozir kerak emas

---

## 2-BO'LIM. Material klassifikatsiyasi

### Q9. Material asosiy toifalari
**Nima:** Ombordagi materiallar qanday asosiy toifalarga bo'linadi?
**Nega kerak:** Toifalar bo'yicha hisobot, javon, mas'ul va min/max alohida bo'ladi.
**Variantlar:**
- A) Xom-ashyo (rulon qog'oz) / Yordamchi (kley, bo'yoq, skotch, sim) / Tayyor mahsulot / Yarim tayyor / Chiqindi — to'liq
- B) Faqat Xom-ashyo / Tayyor mahsulot — soddaroq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymati toifa bo'yicha), Hisobotlar

### Q10. Material kodlash tizimi (artikul)
**Nima:** Har materialga kod qanday beriladi — avtomatik raqam, qo'lda, yoki ma'noli kod (tur+gramaj+kenglik)?
**Nega kerak:** Kod bir xil mantiqda bo'lmasa, bir material ikki nomda kiritiladi (dublikat).
**Variantlar:**
- A) Ma'noli kod (masalan KR-125-1400 = kraft-125g-1400mm) + avto-tartib raqam — o'qish oson
- B) Faqat avtomatik raqam (000123) — sodda, lekin ma'nosiz
- C) Keyin — hozir kerak emas

### Q11. O'lchov birliklari va konvertatsiya
**Nima:** Bir material uchun bir nechta o'lchov birligi bo'ladimi (kg, m, m², dona, rulon) va ular o'zaro avtomatik o'tkaziladimi?
**Nega kerak:** Qog'oz kg da keladi, lekin chiqim m² da; konvertatsiya bo'lmasa hisob noto'g'ri.
**Variantlar:**
- A) Asosiy birlik (kg) + avtomatik konvertatsiya (kg↔m↔m²) gramaj/kenglik orqali — aniq
- B) Har materialga bitta birlik, konvertatsiya qo'lda — sodda, lekin xatoli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf), Sotuv (narxlash), Finance

### Q12. Bir xil materialning bir nechta yetkazib beruvchisi
**Nima:** Bitta material (masalan kraft-125) bir nechta yetkazib beruvchidan kelganda, ombor uni bitta karta sifatida ko'radimi yoki yetkazib beruvchi bo'yicha alohida?
**Nega kerak:** Sifat va narx yetkazib beruvchiga qarab farq qiladi; aralashtirib hisoblansa muammo yashirinadi.
**Variantlar:**
- A) Bitta material kartasi, lekin partiya/kirim darajasida yetkazib beruvchi saqlanadi — balansli
- B) Har yetkazib beruvchiga alohida material kartasi — aniq, lekin ko'p dublikat
- C) Keyin — hozir kerak emas

### Q13. ABC / muhimlik klassifikatsiyasi
**Nima:** Materiallar qiymati/aylanmasi bo'yicha ABC toifaga bo'linadimi (A = qimmat/muhim, C = arzon)?
**Nega kerak:** A-toifa materiallarni qattiq nazorat, C-ni yengil nazorat qilish vaqt va pulni tejaydi.
**Variantlar:**
- A) Ha — ABC avtomatik hisoblanadi (yillik sarf×narx bo'yicha) — aqlli nazorat
- B) Qo'lda belgilanadi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Hisobotlar (ABC tahlil), Inventarizatsiya chastotasi

### Q14. Xavfli/maxsus materiallar belgisi
**Nima:** Yonuvchi (kley, eritgich, bo'yoq) yoki maxsus saqlash talab qiladigan materiallarga alohida belgi qo'yiladimi?
**Nega kerak:** Yong'in xavfsizligi va alohida zona uchun; aralashsa xavf.
**Variantlar:**
- A) Ha — "Yonuvchi / Kimyoviy / Maxsus saqlash" bayroqlari + alohida zona — xavfsizlik
- B) Yo'q — oddiy material kabi — xavfli
- C) Keyin — hozir kerak emas

---

## 3-BO'LIM. Kirim blankasi (qabul qilish)

### Q15. Kirim blankasi majburiy maydonlari
**Nima:** Materialni omborga qabul qilishda blankada qaysi maydonlar majburiy?
**Nega kerak:** Maydonlar to'liq bo'lmasa keyin izlanuvchanlik va inventarizatsiya buziladi.
**Variantlar:**
- A) Sana + Yetkazib beruvchi + Hujjat/nakladnoy raqami + Material + Miqdor + Birlik + Partiya + Qabul qiluvchi + Javon — to'liq
- B) Sana + Material + Miqdor + Qabul qiluvchi — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (kirim → kreditorlik), Xaridlar (zakaz bilan solishtirish)

### Q16. Buyurtma (PO) bilan solishtirish
**Nima:** Kirim xaridlar buyurtmasi (PO) bilan avtomatik solishtiriladimi — kelgan miqdor zakazga to'g'ri keladimi?
**Nega kerak:** Ortiqcha yoki kam kelganini darhol ko'rish; tovush bo'lmasa to'lov xato bo'ladi.
**Variantlar:**
- A) Ha — PO bilan 3 tomonlama solishtirish (zakaz/kirim/hisob-faktura), farq belgilanadi — nazorat
- B) Erkin kirim, PO ixtiyoriy — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Farq qancha foizgacha ruxsat etiladi (tolerans)? (±2% / ±5% / 0% qat'iy)

### Q17. Kirimda sifat tekshiruvi (QC) bog'lanishi
**Nima:** Material kirimda darhol omborga kiradimi yoki avval sifat tekshiruvidan o'tib, "karantin" zonasida turadimi?
**Nega kerak:** Tekshirilmagan material ishlab chiqarishga ketsa brak partiya chiqadi.
**Variantlar:**
- A) Avval karantin → QC OK → erkin zonaga o'tadi — eng xavfsiz
- B) Darhol erkin zonaga, QC keyin — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (kirim inspeksiyasi), Ishlab chiqarish (faqat OK material)

### Q18. Qisman qabul (kam/buzuq kelgan tovar)
**Nima:** Kelgan tovarning bir qismi shikastlangan/kam bo'lsa, qisman qabul qilib, qolganini rad etish mumkinmi?
**Nega kerak:** Hammasini qabul qilib keyin tuzatish chalkash; qisman qabul aniqroq.
**Variantlar:**
- A) Ha — qabul qilingan / rad etilgan miqdor alohida yoziladi + rad sababi — aniq
- B) Yo'q — yo hammasi yo hech narsa — sodda, lekin moslashuvsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (yetkazib beruvchi reytingi), Finance (faqat qabul qilingani uchun to'lov)

### Q19. Kirim tarozi vazni va farq
**Nima:** Rulon kirimida hujjatdagi vazn va tarozidagi haqiqiy vazn solishtiriladimi va farq yoziladimi?
**Nega kerak:** Qog'oz vazni bo'yicha sotiladi; hujjat va haqiqat orasidagi farq pul yo'qotish.
**Variantlar:**
- A) Ha — hujjat vazni + tarozi vazni + farq (kg va %) avtomatik — pul nazorati
- B) Faqat tarozi vazni yoziladi — sodda
- C) Keyin — hozir kerak emas

### Q20. Kim kirim qila oladi (huquq)
**Nima:** Kirim blankasini faqat ombor mas'uli yarata oladimi yoki har kim?
**Nega kerak:** Mas'uliyatsiz kirim = soxta zaxira; mas'ul kishi aniq bo'lishi kerak.
**Variantlar:**
- A) Faqat ombor mas'uli/qabul qiluvchi roli — nazorat
- B) Har bir foydalanuvchi — erkin, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Rollar (huquqlar), Audit (kim kiritdi)

---

## 4-BO'LIM. Chiqim blankasi (berish/sarflash)

### Q21. Chiqim sababi (turlari)
**Nima:** Materialni chiqim qilishda sabab tanlanadimi — ishlab chiqarishga, sotuvga, brakka, sinovga, qaytarishga?
**Nega kerak:** Sababsiz chiqim sarfni tahlil qilishni imkonsiz qiladi.
**Variantlar:**
- A) Ha — Ishlab chiqarishga / Sotuvga / Brak/chiqindi / Sinov / Qaytarish / Ichki ko'chirish — to'liq tahlil
- B) Faqat "chiqim" — sodda, lekin sababsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf), Finance (xarajat hisobi), Hisobotlar

### Q22. Ishlab chiqarish buyurtmasiga bog'lash
**Nima:** Ishlab chiqarishga chiqim qaysi buyurtma/ish-naryadga tegishli ekani ko'rsatiladimi?
**Nega kerak:** Buyurtma tannarxini hisoblash uchun har bir buyurtmaga qancha material ketgani bilinishi kerak.
**Variantlar:**
- A) Ha — chiqim ishlab chiqarish buyurtmasi raqamiga majburiy bog'lanadi — tannarx aniq
- B) Yo'q — umumiy sarf — tannarx noaniq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (BOM/sarf normasi), Finance (buyurtma tannarxi)

### Q23. Norma bilan solishtirish (rejadagi sarf)
**Nima:** Chiqimda haqiqiy sarf BOM/texkartadagi normaga to'g'ri keladimi — ortiqcha sarf belgilanadimi?
**Nega kerak:** Ortiqcha sarf (chiqindi yoki o'g'irlik) faqat norma bilan solishtirilganda ko'rinadi.
**Variantlar:**
- A) Ha — norma vs haqiqiy farq foizda ko'rsatiladi, ortiqcha bo'lsa ogohlantirish — nazorat
- B) Yo'q — faqat haqiqiy chiqim — nazoratsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf normasi), Sifat (chiqindi sababi)

### Q24. Chiqimda FIFO/FEFO qoidasi
**Nima:** Material berishda tizim qaysi partiyani birinchi taklif qiladi — birinchi kelgan (FIFO) yoki muddati birinchi tugaydigan (FEFO)?
**Nega kerak:** Eski material qolib ketmasligi va muddati o'tmasligi uchun avtomatik tartib kerak.
**Variantlar:**
- A) FIFO (birinchi kelgan-birinchi chiqadi) standart, kley/bo'yoqqa FEFO — qog'ozga mos
- B) Xodim o'zi tanlaydi — moslashuvchan, lekin tartib buziladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat (muddati o'tgan material brak)

### Q25. Manfiy qoldiqdan himoya
**Nima:** Omborda mavjud miqdordan ko'p chiqim qilishga tizim ruxsat beradimi?
**Nega kerak:** Manfiy qoldiq = soxta hisob; ishlab chiqarishni to'xtatadigan kechikishlar yashirinadi.
**Variantlar:**
- A) Yo'q — mavjuddan ortiq chiqim bloklanadi (yoki ruxsat bilan) — aniq hisob
- B) Ha — manfiyga ruxsat, keyin to'g'rilanadi — chalkash
- C) Keyin — hozir kerak emas

### Q26. Chiqimni tasdiqlash (ikki imzo)
**Nima:** Katta yoki qimmat chiqim uchun tasdiqlash (oluvchi + beruvchi imzosi yoki rahbar tasdiqi) kerakmi?
**Nega kerak:** Qimmat materialni nazoratsiz berish yo'qotishga olib keladi.
**Variantlar:**
- A) Ha — belgilangan summadan yuqori chiqim rahbar tasdiqini talab qiladi — nazorat
- B) Yo'q — har qanday chiqim erkin — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Qaysi summa/miqdordan tasdiqlash boshlanadi? (belgilangan summa / A-toifa material / har doim)

---

## 5-BO'LIM. Inventarizatsiya va og'ish (farq)

### Q27. Inventarizatsiya turi va chastotasi
**Nima:** Inventarizatsiya qanchalik tez-tez va qaysi usulda o'tkaziladi?
**Nega kerak:** Sanoqsiz ombor ishonchsiz; lekin to'liq sanoq ishlab chiqarishni to'xtatadi.
**Variantlar:**
- A) Aylanma sanoq (har kuni bir qism, A-toifa tez-tez) + yiliga 1 to'liq — balansli
- B) Faqat yiliga 1-2 marta to'liq sanoq — sodda, lekin kech aniqlanadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymatini tasdiqlash)

### Q28. Sanoq usuli (ko'r sanoq)
**Nima:** Sanaganda xodimga tizimdagi miqdor ko'rsatiladimi yoki "ko'r sanoq" (raqamni ko'rmasdan sanash)?
**Nega kerak:** Tizimdagi raqamni ko'rib sanasa, xodim shunchaki ko'chirib yozadi, haqiqiy farq yashirinadi.
**Variantlar:**
- A) Ko'r sanoq — raqam yashirin, faqat sanab kiritadi — halol natija
- B) Ochiq sanoq — tizim raqami ko'rinadi — tez, lekin yolg'on
- C) Keyin — hozir kerak emas

### Q29. Og'ish (farq) chegarasi va tasdiqlash
**Nima:** Sanoq farqi qancha foizgacha avtomatik qabul qilinadi, qaysidan keyin rahbar tasdiqi kerak?
**Nega kerak:** Kichik farq normal (o'lchov xatosi), katta farq tergov talab qiladi.
**Variantlar:**
- A) ±1% gacha avto-tuzatish, undan yuqori rahbar tasdiqi + sabab — nazorat
- B) Har qanday farq avtomatik tuzatiladi — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (farqni zarar/foyda sifatida yozish)

### Q30. Og'ish sababi ro'yxati
**Nima:** Sanoq farqi topilganda sabab tanlanadimi (o'lchov xatosi, o'g'irlik, namlik yo'qolishi, chiqindi yozilmagan, hujjat xatosi)?
**Nega kerak:** Sababsiz farq takrorlanadi; sabab bo'lsa muammoni tuzatish mumkin.
**Variantlar:**
- A) Ha — sabab majburiy ro'yxatdan tanlanadi — tahlil mumkin
- B) Yo'q — faqat raqam tuzatiladi — sababsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat/Audit (takroriy sabablar tahlili)

### Q31. Inventarizatsiya vaqtida harakatni muzlatish
**Nima:** Sanoq paytida o'sha zona/material bo'yicha kirim-chiqim bloklanadimi (muzlatiladimi)?
**Nega kerak:** Sanab turganda chiqim bo'lsa, natija doim noto'g'ri chiqadi.
**Variantlar:**
- A) Ha — sanalayotgan zona muzlatiladi, sanoq tugagach ochiladi — aniq natija
- B) Yo'q — harakat davom etadi — chalkashlik
- C) Keyin — hozir kerak emas

### Q32. Tarozi bilan rulon sanog'i
**Nima:** Rulonlarni sanaganda har birini tarozida tortishadimi yoki kartochkadagi vazn ishonchli deb olinadimi?
**Nega kerak:** Yarim rulonlarning haqiqiy qoldig'i faqat tortilganda aniq bo'ladi.
**Variantlar:**
- A) Ochilgan rulonlar tortiladi, to'liq rulonlar kartochka vazni bo'yicha — balansli
- B) Hammasi kartochka vazni bo'yicha — tez, lekin noaniq
- C) Keyin — hozir kerak emas

---

## 6-BO'LIM. Min / Max / Reorder (har material uchun)

### Q33. Minimal qoldiq (signal nuqtasi)
**Nima:** Har material uchun minimal qoldiq belgilanadimi va undan tushganda ogohlantirish chiqadimi?
**Nega kerak:** Material tugab qolsa ishlab chiqarish to'xtaydi; oldindan signal kerak.
**Variantlar:**
- A) Ha — har materialga min qoldiq + tushganda avto-ogohlantirish — to'xtab qolish oldi olinadi
- B) Yo'q — qo'lda kuzatiladi — kech qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (avto-zayavka), Ishlab chiqarish (uzilish oldi)

### Q34. Reorder (qayta buyurtma) nuqtasi va miqdori
**Nima:** Minimal nuqtaga yetganda tizim qancha buyurtma qilishni taklif qiladimi (reorder miqdori)?
**Nega kerak:** Faqat signal bermay, "qancha buyurtma qilish" ham ko'rsatilsa, xaridlar tezlashadi.
**Variantlar:**
- A) Ha — reorder nuqtasi + tavsiya etilgan buyurtma miqdori (sarf tezligi×yetkazib berish muddati) — aqlli
- B) Faqat signal, miqdorni xodim o'zi hal qiladi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (avtomatik zayavka loyihasi)

### Q35. Maksimal qoldiq (ortiqcha zaxira)
**Nima:** Har materialga maksimal qoldiq belgilanadimi — undan oshsa ortiqcha zaxira deb belgilansinmi?
**Nega kerak:** Ortiqcha zaxira pulni muzlatadi va joyni egallaydi; qog'oz nam tortadi.
**Variantlar:**
- A) Ha — max qoldiq + oshganda ogohlantirish — pul va joy tejaladi
- B) Yo'q — faqat min nazorat qilinadi — bir tomonlama
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (muzlatilgan kapital)

### Q36. Mavsumiy / dinamik min-max
**Nima:** Min/max qiymatlar yil davomida o'zgaradimi (mavsumiy talab) yoki bir martalik qat'iy raqammi?
**Nega kerak:** Karton talabi mavsumga qarab o'zgaradi; qat'iy raqam yo kam yo ortiqcha zaxira beradi.
**Variantlar:**
- A) Dinamik — oxirgi 3-6 oy sarfiga qarab avto-qayta hisoblanadi — aqlli
- B) Qat'iy qo'lda kiritilgan raqam — sodda
- C) Keyin — hozir kerak emas

### Q37. Yetkazib berish muddati (lead time) hisobi
**Nima:** Reorder nuqtasini hisoblashda yetkazib beruvchining yetkazib berish muddati (kun) hisobga olinadimi?
**Nega kerak:** Material uzoqdan kelsa, ertaroq buyurtma qilish kerak; muddatsiz signal kech bo'ladi.
**Variantlar:**
- A) Ha — har yetkazib beruvchiga lead time + xavfsizlik zaxirasi hisobga olinadi — aniq
- B) Yo'q — faqat joriy qoldiq — kech qolish xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (yetkazib beruvchi muddati)

---

## 7-BO'LIM. Karantin (bloklash) va sabablari

### Q38. Karantin sabablari ro'yxati
**Nima:** Material qaysi sabablarga ko'ra karantinga (bloklangan zona) qo'yiladi?
**Nega kerak:** Karantin sababsiz bo'lsa, material noma'lum muddat yotadi yoki noto'g'ri ishlatiladi.
**Variantlar:**
- A) Ha — Sifat tekshiruvi kutilmoqda / Brak shubhasi / Namlik / Yetkazib beruvchi reklamatsiyasi / Muddat o'tgan / Hujjat yo'q — to'liq
- B) Faqat "bloklangan" belgisi, sababsiz — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (qaror), Ishlab chiqarish (karantin material berilmaydi)

### Q39. Karantindan chiqarish (kim va qanday)
**Nima:** Karantindagi materialni kim erkin zonaga o'tkaza oladi va qanday qaror bilan?
**Nega kerak:** Nazoratsiz chiqarsa brak material ishlab chiqarishga ketadi.
**Variantlar:**
- A) Faqat Sifat nazorati roli qaror bilan (OK / Brak / Qaytarish) chiqaradi — nazorat
- B) Ombor mas'uli o'zi chiqaradi — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (yakuniy qaror)

### Q40. Karantin natijasi (qaror variantlari)
**Nima:** Karantindan keyin material qanday natijaga olib boriladi?
**Nega kerak:** Aniq natija bo'lmasa material karantin zonasini to'ldiradi.
**Variantlar:**
- A) OK→erkin zona / Past sifat→arzon ishga / Brak→chiqindi / Qaytarish→yetkazib beruvchiga — to'liq yo'l
- B) Faqat OK yoki Brak — ikki yo'l
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (qaytarish→kreditni kamaytirish), Xaridlar (reklamatsiya)

### Q41. Karantinda turish muddati
**Nima:** Material karantinda maksimal qancha tura oladi, undan keyin avtomatik ogohlantirish chiqadimi?
**Nega kerak:** Unutilgan karantin materiali joyni egallaydi va pul muzlatadi.
**Variantlar:**
- A) Ha — belgilangan kundan oshsa rahbarga ogohlantirish — unutilmaydi
- B) Yo'q — muddat cheksiz — unutiladi
- C) Keyin — hozir kerak emas

---

## 8-BO'LIM. Ombor-ichi ko'chirish (joylashuv)

### Q42. Ombor topologiyasi (zona/qator/javon)
**Nima:** Ombor qanday joy birliklariga bo'linadi — zona, qator, javon, yacheyka?
**Nega kerak:** Aniq joy bo'lmasa rulonni topish vaqt oladi; joy kodi kerak.
**Variantlar:**
- A) Zona → Qator → Javon → Yacheyka (kod: A-12-3-2) — aniq topish
- B) Faqat zona nomi (xom-ashyo zonasi) — sodda, lekin noaniq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Chiqimda "qaysi javondan olish" ko'rsatmasi

### Q43. Ichki ko'chirish blankasi
**Nima:** Materialni bir joydan boshqasiga ko'chirganda harakat yoziladimi (qaysidan-qayerga-kim)?
**Nega kerak:** Ko'chirish yozilmasa, tizimda material A javonda ko'rinadi, aslida B da — topib bo'lmaydi.
**Variantlar:**
- A) Ha — ko'chirish harakati: manba joy + maqsad joy + miqdor + xodim + sana — aniq
- B) Yo'q — joy faqat qo'lda yangilanadi — adashish
- C) Keyin — hozir kerak emas

### Q44. Bir nechta ombor / filial
**Nima:** Zavodda bir nechta ombor (asosiy, sex yonidagi, tayyor mahsulot) bo'ladimi va ular orasida ko'chirish kuzatiladimi?
**Nega kerak:** Bir nechta ombor bo'lsa, har birida alohida qoldiq va ular orasidagi ko'chirish aniq bo'lishi kerak.
**Variantlar:**
- A) Ha — har ombor alohida, ombor-aro ko'chirish harakat sifatida — aniq
- B) Yo'q — bitta umumiy ombor — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Hisobotlar (ombor bo'yicha qoldiq)

### Q45. Yacheyka sig'imi va band/bo'sh holati
**Nima:** Har javon/yacheyka uchun maksimal sig'im va hozir band/bo'sh holati saqlanadimi?
**Nega kerak:** Kirimда yangi rulonni qayerga qo'yishni tizim taklif qila olishi uchun bo'sh joy kerak.
**Variantlar:**
- A) Ha — sig'im + band/bo'sh + avto-joy taklifi — tartibli ombor
- B) Yo'q — xodim o'zi joy tanlaydi — erkin, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q46. Tayyor mahsulot zonasi alohida
**Nima:** Tayyor mahsulot (kesilgan karton, qutilar) xom-ashyodan alohida zonada hisobga olinadimi?
**Nega kerak:** Tayyor mahsulot va xom-ashyo aralashsa, sotuv va ishlab chiqarish hisobi chalkashadi.
**Variantlar:**
- A) Ha — tayyor mahsulot ombori alohida, sotuvga shu yerdan chiqadi — aniq
- B) Bir zonada — sodda, lekin chalkash
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (tayyor mahsulot rezervi), Ishlab chiqarish (tayyor mahsulot topshirish)

---

## 9-BO'LIM. Partiya / Batch va muddat

### Q47. Partiya (batch) raqami
**Nima:** Har kirimga partiya raqami beriladimi va chiqimda qaysi partiyadan ketgani saqlanadimi?
**Nega kerak:** Sifat muammosi chiqsa, qaysi partiya qaysi buyurtmaga ketganini topish kerak (izlanuvchanlik).
**Variantlar:**
- A) Ha — har kirim = partiya, chiqim partiyaga bog'lanadi (oldinga/orqaga izlash) — to'liq izlanuvchanlik
- B) Yo'q — faqat umumiy material miqdori — izlanuvchanlik yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (reklamatsiya izlash), Ishlab chiqarish (qaysi partiya qaysi buyurtmada)

### Q48. Yaroqlilik muddati (kley/bo'yoq/kimyo)
**Nima:** Muddatga ega materiallar (kley, bo'yoq, lak) uchun yaroqlilik muddati saqlanadimi va o'tganda ogohlantirish chiqadimi?
**Nega kerak:** Muddati o'tgan kley/bo'yoq braka olib keladi; oldindan ogohlantirish kerak.
**Variantlar:**
- A) Ha — yaroqlilik sanasi + N kun oldin ogohlantirish + o'tganda bloklash — sifat himoyasi
- B) Yo'q — muddat kuzatilmaydi — brak xavfi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Necha kun oldin ogohlantirilsin? (30 kun / 15 kun / 7 kun)
  - ⤳ Ta'sir: Sifat nazorati, Chiqim (muddati o'tgan bloklanadi)

### Q49. Partiya bo'yicha sifat ko'rsatkichi
**Nima:** Har partiya uchun sifat ko'rsatkichlari (gramaj, namlik, mustahkamlik) saqlanadimi?
**Nega kerak:** Bir material turidagi turli partiyalar sifati farq qiladi; ishlab chiqarish to'g'ri partiyani tanlashi kerak.
**Variantlar:**
- A) Ha — partiyaga QC natijalari biriktiriladi — sifatli tanlov
- B) Yo'q — faqat material turi bo'yicha — umumiy
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (partiya pasporti)

### Q50. Partiyalarni aralashtirishga ruxsat
**Nima:** Bitta buyurtmaga turli partiyalardan material ishlatishga ruxsat beriladimi yoki bitta partiyadan bo'lishi shartmi?
**Nega kerak:** Rang/gramaj partiyalararo biroz farq qiladi; aralashtirsa tayyor mahsulotda rang/sifat tafovuti chiqadi.
**Variantlar:**
- A) Imkon qadar bitta partiyadan, kerak bo'lsa aralashtirishga ogohlantirish bilan ruxsat — sifat balansi
- B) Erkin aralashtirish — tez, lekin rang/sifat farqi xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati, Ishlab chiqarish (bir buyurtma = bir partiya tavsiyasi)

### Q51. Eski/harakatsiz zaxira (dead stock)
**Nima:** Uzoq vaqt harakatsiz turgan material (masalan 6 oydan beri chiqim bo'lmagan) avtomatik belgilanadimi?
**Nega kerak:** Harakatsiz zaxira pulni muzlatadi va qog'oz buzilib ketadi; sotib yuborish yoki ishlatish kerak.
**Variantlar:**
- A) Ha — N kundan beri harakatsiz material "o'lik zaxira" deb belgilanadi + hisobot — pul qaytarish
- B) Yo'q — kuzatilmaydi — muzlatilgan pul
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymatini kamaytirish), Sotuv (chegirma bilan sotish)

### Q52. Qoldiq/oraliq kesindi (obrezka) hisobi
**Nima:** Rulondan kesib qolgan kichik qoldiqlar (obrezka) omborga qayta kirimga olinadimi yoki chiqindiga yoziladimi?
**Nega kerak:** Kesindilarni qayta ishlatish mumkin; hisobsiz bo'lsa ko'p material chiqindiga ketadi.
**Variantlar:**
- A) Ha — foydalanish mumkin bo'lgan obrezka qoldiq sifatida qayta kirimga olinadi — material tejaladi
- B) Yo'q — barchasi chiqindi — sodda, lekin isrofgar
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (qoldiqdan kichik buyurtma), Finance (chiqindi kamayadi)

---

## 9-BO'LIM. KITOB-GROUNDED YANGI savollar (2020 lavozim yo'riqnomalari asosida)

> Manba: `docs/audit/kitob-extracted/` — **Ички логистика бўлими бошлиғи** (5-Департамент, 13-бўлим),
> **Таъминот бўлими бошлиғи** (импорт хом ашё), **Элтиб бериш бўлими бошлиғи** (логистика+транспорт).
> Hujjatdagi aniq atamalar: топлайнер ╳ местный (макулатура) қоғоз, грамаж, 3/5 қаватли гофра, техкарта мослиги,
> поддон, рохлерчи, чиқинди/қолдиқ чиқариш, бекор туриш. Yuqoridagi 52 savol bilan takrorlanMAYDI.

### Q53. Sexga chiqarishdan oldin techkarta-material mosligi tekshiruvi
**Nima:** Material sexga chiqarilishidan oldin tizim uni shu buyurtma texkartasidagi qog'oz turi bilan solishtirib, mos kelmasa bloklaydimi?
**Nega kerak:** Kitobda aniq misol — texkartada "топлайнер", omborchi esa "местный (макулатура)" qog'ozni tayyorlagan; to'xtatilmasa ishlab chiqarish to'xtaydi, mahsulot brakka chiqadi.
**Variantlar:**
- A) Tizim bloklaydi — texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim ruxsat etilmaydi — brakni oldindan to'xtatadi
- B) Faqat ogohlantirish, chiqarishga ruxsat — tezroq, lekin xato o'tib ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (texkarta) ↔ Ombor ↔ MES
  ↳ Agar A: kim "majburan chiqarish" override qila oladi? A1) faqat ishlab chiqarish boshlig'i+sabab; A2) hech kim, texkartani tuzatib; A3) ichki logistika boshlig'i

### Q54. Gofra qavatini aralashtirishdan himoya (3 ╳ 5 qavat)
**Nima:** Bir smenada bir nechta buyurtma bo'lsa (biri 5-qavat, biri 3-qavat), tizim qaysi qog'oz qaysi buyurtmaga ekanini ajratib, aralashtirishni oldini oladimi?
**Nega kerak:** Kitobda misol: 5-qavat va 3-qavat gofra bir vaqtda rejalashtirilgan, omborchi chiqishda aralashtirgan → reja buzilgan.
**Variantlar:**
- A) Har chiqim buyurtma+texkartaga bog'lanadi; boshqa buyurtmaga skanlasa ogohlantirish — aralashish yo'qoladi
- B) Faqat qog'oz turini ko'rsatadi, buyurtmaga bog'lamaydi — qisman
- C) Keyin
⤳ Ta'sir: PP, MES, ichki logistika

### Q55. Poddon (palet) birligini hisobga olish
**Nima:** Material ombordan "poddon" birligida ham chiqariladimi (kitob: поддонлар) va tizim poddon sonini alohida hisoblaydimi?
**Nega kerak:** Kitobda ichki logistika "поддонлар, ярим тайёр маҳсулотлар"ni participalarga vaqtida yetkazadi — poddon transport/hisob birligi.
**Variantlar:**
- A) Poddon=qadoq/transport birligi, har poddonda nechta dona/kg yozilib tizim ikkala birlikda ko'rsatadi — qulay
- B) Faqat dona/kg, poddon yo'q — ichki logistikaga noqulay
- C) Keyin
⤳ Ta'sir: ichki logistika, MES qadoqlash

### Q56. Ichki transport so'rovi (rohler chaqirish) va kechikish izi
**Nima:** Sex (participok) materialni ichki logistikadan tizim orqali "so'rov" bilan chaqiradimi — rohlerchiga vazifa yaratiladimi?
**Nega kerak:** Kitob: ichki logistika boshlig'i "рохлерчиларга аниқ вазифалар берди"; material yetishmasligidan dastgoh to'xtashi (бекор туриш) eng katta yo'qotish.
**Variantlar:**
- A) Sex "material kerak" so'rovi qoldiradi → rohlerchiga vazifa → bajarildi belgisi — kechikish ko'rinadi
- B) So'rov og'zaki, tizimda yo'q — hozirgi holat, ko'rinmas
- C) Keyin
⤳ Ta'sir: ichki logistika, MES (bekor turish), Coordination
  ↳ Agar A: kechikkanda kimga eskalatsiya? A1) ichki logistika boshlig'i; A2) smena boshlig'i; A3) Coordination

### Q57. "Bekor turish" sababini ombor-yetishmasligiga bog'lash (KPI)
**Nima:** Dastgoh material yo'qligidan to'xtaganda (бекор туриш), sabab tizimda "ombor/logistika kechikishi" deb qayd etiladimi?
**Nega kerak:** Kitobда ichki logistika statistikasi: "Ички логистика сабабли юзага келган кечикишлар сони" — bu KPI sifatida o'lchanishi kerak.
**Variantlar:**
- A) Downtime sabab kodida "material yetishmovchiligi (logistika)" alohida, oyiga hisoblanadi — KPI real
- B) Faqat umumiy "to'xtash" — sabab ajralmaydi
- C) Keyin
⤳ Ta'sir: MES, ichki logistika KPI, IoT

### Q58. Chiqindi va qoldiqni ajratib hisobga olish
**Nima:** Ishlab chiqarishdan chiqqan chiqindi va qoldiqlar (чиқиндилар ва қолдиқлар) qayta ishlatiladigan ╳ chiqindi deb ajratib hisoblanadimi?
**Nega kerak:** Kitob: ichki logistika boshlig'i "чиқиндилар ва қолдиқларни белгиланган тартибда чиқарилишини ташкил этади" — rasmiy vazifa; makulatura daromad bo'lishi mumkin.
**Variantlar:**
- A) Ikki turga: qayta ishlatiladigan qoldiq (omborga, makulatura) ╳ chiqindi (utilizatsiya) — makulatura daromad
- B) Faqat "chiqindi chiqdi", qiymatsiz — makulatura yo'qoladi
- C) Keyin
⤳ Ta'sir: ichki logistika, Finance (makulatura savdosi), MES brak

### Q59. Местный (makulatura) qog'ozni alohida zaxira sifatida boshqarish
**Nima:** Местный (makulatura) qog'oz alohida material turi sifatida o'z qoldig'i, narxi va "qaysi mahsulotlarga ruxsat" belgisi bilan boshqariladimi?
**Nega kerak:** Kitobда местный — toplaynerga arzon, past sifatli muqobil; faqat ruxsat etilgan buyurtmalarga ketishi kerak.
**Variantlar:**
- A) Alohida kartochka + ruxsat etilgan mahsulotlar ro'yxati — past sifat noto'g'ri buyurtmaga ketmaydi
- B) Bir umumiy "qog'oz" toifasi — chalkashlik
- C) Keyin
⤳ Ta'sir: PP texkarta, QC

### Q60. Grammaj bo'yicha kirim tekshiruvi
**Nima:** Qog'oz kelganda deklaratsiya qilingan grammaj (g/m²) namunada o'lchanib, og'ish bo'lsa qabul cheklanadimi?
**Nega kerak:** Kitobда grammaj texkarta uchun kalit ("унинг грамажи, сифати"); xato grammaj kelsa butun partiya noto'g'ri ishlatiladi.
**Variantlar:**
- A) Namuna grammaji o'lchanadi, ±tolerantlik chegarasi, oshsa karantin — sifat kafolati
- B) Faqat hujjatga ishonadi — xavfli
- C) Keyin
⤳ Ta'sir: Таъминот, QC

### Q61. Import xom-ashyo yo'lda (in-transit) holati
**Nima:** Chetdan kelayotgan xom-ashyo (импорт хом ашё) "jo'natildi/bojxona/keldi" bosqichlarida tizimda ko'rinadimi?
**Nega kerak:** Kitob: Таъминот бўлими boshlig'i "импорт хом ашёларни етказиб келиш"ga mas'ul; import uzoq, yo'ldagi tovar ko'rinmasa reja buziladi.
**Variantlar:**
- A) Import buyurtmasi bosqichli holat + taxminiy kelish sanasi — reja real
- B) Faqat "kelganda" kirim — yo'ldagi tovar ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Таъминот, PP/MRP (lead-time), Finance (avans)

### Q62. Import lead-time va valyuta narxi
**Nima:** Import materialda yetkazish muddati (kun) va valyuta kursi narxi saqlanib, reorder hisobida ishlatiladimi?
**Nega kerak:** Importni 2-3 oy oldin buyurtma qilish kerak; valyuta kursi narxni o'zgartiradi.
**Variantlar:**
- A) Har materialда "import/mahalliy" bayroq + lead-time + valyuta — reorder import uchun ertaroq
- B) Hammasi bir xil lead-time — import kech buyurtma bo'lib qoladi
- C) Keyin
⤳ Ta'sir: Таъминот, MRP, Finance

### Q63. Yetkazib beruvchi ishonchliligi reytingi
**Nima:** Har yetkazib beruvchi uchun "o'z vaqtida %", "brak %", "narx" reytingi tizimda saqlanadimi?
**Nega kerak:** Taъminot boshlig'i bir nechta beruvchi bilan ishlaydi (kitob: "Етказиб берувчилар"); kim ishonchli ekani bilinmasa doim kechikadiganga buyurtma beriladi.
**Variantlar:**
- A) Har kirim avtomatik reytingga ta'sir (kechikdi/brak) → reyting ko'rinadi — eng yaxshi beruvchi tanlanadi
- B) Reyting qo'lda — subyektiv
- C) Keyin
⤳ Ta'sir: Таъминот, MM, Finance

### Q64. Import partiyasiga bojxona/sertifikat hujjatlarini biriktirish
**Nima:** Import partiyasiga GTD, sifat sertifikati, invoys skanlari biriktiriladimi?
**Nega kerak:** Importда hujjat majburiy; tekshiruv/nizoда partiyaning kelib chiqishi hujjat bilan isbotlanishi kerak.
**Variantlar:**
- A) Har import partiyasiga fayl biriktiriladi va partiya bo'yicha qidiriladi — audit toza
- B) Hujjat alohida papkaда, tizimga bog'lanmagan — yo'qolish xavfi
- C) Keyin
⤳ Ta'sir: Таъминот, Finance, QC

### Q65. Avans to'lov va yetkazib berish bog'lanishi
**Nima:** Import buyurtmaga avans to'langanда "avans berildi, tovar kelmadi" holati ko'rinadimi?
**Nega kerak:** Import ko'pincha avans bilan; pul ketib tovar kelmagan holat moliyaviy xavf.
**Variantlar:**
- A) Buyurtma → avans (Finance) → kirim solishtiriladi, yopilmagan avanslar ro'yxati — xavf ko'rinadi
- B) Avans faqat Finance'да, ombor ko'rmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Таъминот, Finance

### Q66. Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati
**Nima:** Tayyor mahsulot mijozga chiqarilganда jo'natish hujjati (накладная/TTN) tizimда yaratiladimi?
**Nega kerak:** Kitобда Элтиб бериш boshlig'i "логистика ва транспорт таъминоти"ga mas'ul; hujjat nima va kimga ketganini isbotlaydi.
**Variantlar:**
- A) Jo'natish hujjati buyurtmaga bog'lanib avtomatik tuziladi (mijoz, mahsulot, miqdor, haydovchi, mashina) — izlanadi
- B) Qo'lда qog'ozда — tizimда yo'q
- C) Keyin
⤳ Ta'sir: SD, Элтиб бериш, Finance

### Q67. Haydovchi va mashinani jo'natishga biriktirish
**Nima:** Har jo'natishga haydovchi va transport vositasi biriktiriladimi (kitob: "хайдовчилар")?
**Nega kerak:** Kitob: Элтиб бериш boshlig'i mijoz/beruvchi/haydovchilar bilan ishlaydi; kim, qaysi mashinada, qachon — javobgarlik.
**Variantlar:**
- A) Haydovchi+mashina raqami+chiqish vaqti, yetkazildi belgisi — javobgarlik aniq
- B) Faqat "jo'natildi" — kim olib ketgani noma'lum
- C) Keyin
⤳ Ta'sir: Элтиб бериш, SD, CC

### Q68. Yetkazib berishni tasdiqlash (mijoz qabul qildi)
**Nima:** Mijoz tovarni qabul qilgani (imzo/qabul) tizimga qaytadimi?
**Nega kerak:** Jo'natish ≠ yetkazib berish; mijoz qabul qilmasa yoki kam qabul qilsa nizo bo'ladi.
**Variantlar:**
- A) Haydovchi qaytganда "yetkazildi/qaytdi/qisman"+sabab — to'liq sikl yopiladi
- B) Faqat jo'natish qayd etiladi — qaytish ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Элтиб бериш, SD, reklamatsiya (QC)

### Q69. Material rezervatsiyasi (buyurtmaga band qilish)
**Nima:** Rejalashtirilgan buyurtma uchun material oldindan "band" (rezerv) qilinib, boshqa buyurtmaga ketib qolmasligi ta'minlanadimi?
**Nega kerak:** Omборда material bor ko'rinadi, lekin boshqa buyurtmaga rejalashtirilgan — ikki buyurtma bir materialга da'vo qilsa biri to'xtaydi.
**Variantlar:**
- A) Reja material bandlaydi (mavjud−band=erkin), erkin qoldiq ko'rinadi — ortiqcha va'da yo'q
- B) Band yo'q, "bor/yo'q" xolos — to'qnashuv
- C) Keyin
⤳ Ta'sir: PP/MRP, SD, ichki logistika

### Q70. Material almashtirish (substitute) ruxsati
**Nima:** Material yo'q bo'lsa, ruxsat etilgan analog material tizimда taklif qilinadimi?
**Nega kerak:** Yetishmovchilikда omborchi o'zicha boshqa qog'ozni chiqaradi (toplayner o'rniga местный) — nazoratsiz brak. Analoglar oldindan belgilansa xavf kamayadi.
**Variantlar:**
- A) Har materialга "ruxsat etilgan analog" ro'yxati; faqat shulardan, tasdiq bilan — nazoratli
- B) Almashtirish umuman taqiq — qat'iy lekin to'xtash ko'p
- C) Keyin
⤳ Ta'sir: PP texkarta, QC, ichki logistika

### Q71. Omborchi razryadi → ruxsat etilgan amal darajasi
**Nima:** Omborchining razryadi qaysi amallarni qila olishini belgilaydimi (oddiy chiqim ╳ inventarizatsiya tasdiqlash ╳ spisaniye)?
**Nega kerak:** Org-karta razryadga asoslangan; past razryad faqat oddiy chiqim, yuqori razryad farq tasdiqlash huquqiga ega bo'lishi mantiqiy.
**Variantlar:**
- A) Razryad → vakolat matritsasi (kirim/chiqim/inventarizatsiya/spisaniye alohida) — javobgarlik darajaга bog'lanadi
- B) Hamma omborchi bir xil huquq — nazorat past
- C) Keyin
⤳ Ta'sir: HR/org-karta, ombor xavfsizlik

### Q72. Material hisobdan chiqarish (spisaniye) jarayoni
**Nima:** Buzilgan/yaroqsiz/yo'qolgan material rasmiy "spisaniye akti" bilan o'chiriladimi?
**Nega kerak:** Inventarizatsiya kamomadidan farqli — ataylab yaroqsizni hisobdan chiqarish alohida hujjatlangan; aks holda o'g'irlik yashiriladi.
**Variantlar:**
- A) Spisaniye akti: material+sabab+miqdor+tasdiqlovchi → Finance zarariga — auditga ochiq
- B) Faqat inventarizatsiya farqi orqali — sabab noma'lum
- C) Keyin
⤳ Ta'sir: Finance (zarar), QC, audit

### Q73. Sarfni norma bilan og'ish tahlili (pere-raskhod)
**Nima:** Buyurtma tugagach haqiqiy sarf vs texkarta normasi solishtirilib, ortiqcha sarf ko'rsatiladimi?
**Nega kerak:** Texkartada norma bor; haqiqiy sarf undan ko'p bo'lsa — brak, o'g'irlik yoki noto'g'ri sozlash belgisi.
**Variantlar:**
- A) Har buyurtma yopilganда norma/fakt og'ishi % hisoblanadi, chegaradan oshsa signal — yo'qotish manbai topiladi
- B) Faqat umumiy sarf — og'ish ko'rinmaydi
- C) Keyin
⤳ Ta'sir: PP norma, MES, Finance, QC

### Q74. Tovar qabulда foto-dalil
**Nima:** Shubhali/shikastlangan material kelganда qabulда foto biriktiriladimi?
**Nega kerak:** Yetkazib beruvchiga reklamatsiya uchun shikastni hujjatlash kerak — keyin isbotlash qiyin.
**Variantlar:**
- A) "Shikast bor" belgilansa foto majburiy → reklamatsiyaga biriktiriladi — isbot tayyor
- B) Foto yo'q — og'zaki da'vo
- C) Keyin
⤳ Ta'sir: Таъминот, QC, Finance

### Q75. Yetkazib beruvchiga qaytarish (vozvrat) jarayoni
**Nima:** Brak/noto'g'ri material beruvchiga qaytarilganда "qaytarish" hujjati bilan zaxiradan chiqariladimi?
**Nega kerak:** Karantindan chiqqan brak beruvchiga qaytishi mumkin; bu kirimning teskarisi, Finance bilan bog'lanish.
**Variantlar:**
- A) Qaytarish hujjati → zaxira kamayadi + Finance kreditor kamayadi — bog'langan
- B) Faqat omborда chiqim, Finance ko'rmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Таъминот, Finance, QC

### Q76. Kunlik qoldiq hisoboti rahbarga avtomatik
**Nima:** Har kun ertalab ombor qoldig'i va kechagi harakat hisoboti rahbariyatga avtomatik yuboriladimi?
**Nega kerak:** Kitobда kun yakuniда hisobot tartibi bor ("кун якунида хисобот"); rahbar qoldiqни ko'rmasa yetishmovchilikни kech biladi.
**Variantlar:**
- A) Avtomatik kunlik hisobot (qoldiq+harakat+signal materiallar) → CC orqali rahbarga — proaktiv
- B) Faqat so'ralganda — reaktiv
- C) Keyin
⤳ Ta'sir: CC, notifications, director dashboard

### Q77. Kritik material yetishmasligi haqida proaktiv signal
**Nima:** Reja bo'yicha ertaga kerak material yetmasligi oldindan aniqlanib signal beriladimi?
**Nega kerak:** Min-qoldiq statik; reja bilan solishtirilganда "ertangi buyurtmaга qog'oz yetmaydi" dinamik signal to'xtashni oldini oladi.
**Variantlar:**
- A) Reja sarfi vs joriy qoldiq → "X material Y kunда tugaydi" prognoz + signal — proaktiv
- B) Faqat min-qoldiqдан pastга tushganда — kech
- C) Keyin
⤳ Ta'sir: PP/MRP, Таъминот, CC
  ↳ Agar A: signal kimga? A1) Taъminot+ichki logistika boshlig'i; A2) faqat ombor; A3) Coordination

### Q78. Ombor harakatining buxgalteriyaга (GL) avtomatik o'tishi
**Nima:** Har kirim/chiqim avtomatik buxgalteriya provodkasini (GL) hosil qiladimi?
**Nega kerak:** Ombor harakati=pul harakati; alohida yuritilsa buxgalteriya zaxirasi ombor qoldig'iga mos kelmaydi.
**Variantlar:**
- A) Har harakat GL provodkasi (zaxira debet/kredit) — buxgalteriya ↔ ombor doim teng
- B) Oyiга bir marta qo'lда solishtiriladi — drift xavfi
- C) Keyin
⤳ Ta'sir: Finance/GL, audit

### Q79. Material narxini hisoblash usuli (FIFO/o'rtacha)
**Nima:** Chiqimда material qiymati FIFO bo'yichami yoki o'rtacha tortilgan narx bo'yichami hisoblanadi?
**Nega kerak:** Bir material turli narxда keladi (import, valyuta); chiqim narxi tannarxga ta'sir qiladi.
**Variantlar:**
- A) O'rtacha tortilgan narx — tannarx silliq, oddiy
- B) FIFO (aniq partiya narxi) — aniqroq, murakkab
- C) Keyin — egasi hisob siyosatini belgilaydi
⤳ Ta'sir: Finance, PP tannarx
  ↳ Agar A: import valyuta kursi o'zgarганда qayta baholanadimi? A1) kelgan kun kursiда muzlatiladi; A2) oy oxiriда qayta baholanadi

### Q80. Inventarizatsiya kamomadini mas'ul shaxsга bog'lash
**Nima:** Inventarizatsияда kamomad chiqsa, u mas'ul shaxsga (материально-ответственное лицо) bog'lanadimi?
**Nega kerak:** Kamomad "umumiy" bo'lsa hech kim javob bermaydi; mas'ul shaxs tushunchasi muhim.
**Variantlar:**
- A) Har zona/material mas'ul shaxsga biriktiriladi; kamomad o'shanga yoziladi — javobgarlik aniq
- B) Kamomad umumiy zararga — javobgar yo'q
- C) Keyin
⤳ Ta'sir: HR, Finance, ombor xavfsizlik

### Q81. Ombor ↔ POS Monitor (zavod ombori tableti) rol ajratimi
**Nima:** Zavod ombori tableti (POS Monitor) qaysi amallarni qiladi va to'liq WMS dan farqi nima — bir zaxiraga yozadimi?
**Nega kerak:** Loyiha eslatmasiда POS Monitor=zavod ombori tablet interfeysi (kassa emas); ikkalasi bir zaxiraни o'zgartirsa qaysi kanonik?
**Variantlar:**
- A) POS Monitor=tezkor sex-pol amallari (skan kirim/chiqim/sanoq) → bir DB ga; WMS=to'liq boshqaruv/hisobot — bitta haqiqat manbai
- B) Ikki alohida zaxira — drift (loyihaда muammo)
- C) Keyin
⤳ Ta'sir: POS, WMS, Finance
  ↳ Agar A: kanonik zaxira jadvali bittami? A1) warehouse_stock; A2) boshqa (egasi tanlovi)

### Q82. Material kartochkasidan "kim uchun kritik" teskari ko'rinish
**Nima:** Material kartochkasidan "bu material qaysi mahsulotlar texkartasida ishlatiladi" ro'yxatini ko'rsa bo'ladimi?
**Nega kerak:** Yetishmovchilikда "bu material tugasa qaysi buyurtmalar to'xtaydi" ni darhol bilish — ta'sirни baholash.
**Variantlar:**
- A) Material → "ishlatiladigan mahsulotlar/buyurtmalar" teskari ko'rinish — ta'sir darhol ko'rinadi
- B) Faqat texkartaдан materialга — teskari yo'q
- C) Keyin
⤳ Ta'sir: PP, ichki logistika, prioritet

### Q83. Yetkazib beruvchi minimal partiya / qadoqlash birligi
**Nima:** Material kartochkasiда beruvchining minimal buyurtma miqdori va qadoqlash birligi (necha rulon to'plam) saqlanadimi?
**Nega kerak:** Reorder hisoblaganда beruvchi 1 ta emas, 10 ta to'plamда sotsa, kerakli son to'plamga yaxlitlanishi kerak.
**Variantlar:**
- A) Min partiya+qadoqlash birligi → reorder yaxlitlanadi — real buyurtma
- B) Hisob donада, qadoqlash hisobsiz — buyurtma noto'g'ri
- C) Keyin
⤳ Ta'sir: Таъминот, MM, MRP

### Q84. Zaxira aylanma tezligi (turnover days) ko'rsatkichi
**Nima:** Har material uchun "necha kunда bir marta aylanadi" hisoblanib, sekin ╳ tez aylanuvchilar ajratiladimi?
**Nega kerak:** Pul zaxiраda qotadi; sekin aylanuvchi material ortiqcha sotib olinmasligi kerak. (Dead-stock 0-harakat; turnover esa tezlik darajasi — bu boshqa.)
**Variantlar:**
- A) Aylanma kunlari + signal (juda sekin/tez) — zaxira optimallashadi
- B) Faqat dead-stock (0 harakat) — oraliq sekin ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Finance, Таъминот, director KPI

### Q85. Ombor zonasi sig'imi to'lganlik foizi (import oldidan)
**Nima:** Har ombor zonasi bo'yicha to'lganlik foizi ko'rsatilib, katta import partiyasidan oldin joy yetishi tekshiriladimi?
**Nega kerak:** Import katta partiya kelishidan oldin joy bo'lmasa, tovar ochiq qoladi.
**Variantlar:**
- A) Zona sig'imi+band hajm → to'lganlik %; kirim oldиdan tekshiriladi — joy yetmasligi oldindан ko'rinadi
- B) Joy hisobi yo'q — kelганda muammo
- C) Keyin
⤳ Ta'sir: Таъминот, ichki logistika

### Q86. Brak/karantin materialни sexga chiqishini qattiq bloklash
**Nima:** Karantinга tushgan yoki brak material xato bilan sexга chiqarilmasligi qattiq bloklanadimi?
**Nega kerak:** Karantin status bor, lekin xato chiqim oldini olmasa brak material mahsulotga ketadi.
**Variantlar:**
- A) Brak/karantин statusли material chiqimда qat'iy bloklanadi (tizim ruxsat bermaydi) — brak o'tmaydi
- B) Faqat ogohlantirish, chiqarish mumkin — xavf qoladi
- C) Keyin
⤳ Ta'sir: QC, MES, ichki logistika

### Q87. Yetkazib beruvchiдан kam/ortiq kelganда tolerantlik
**Nima:** Kelgan miqdor buyurtmадан ozгина kam/ko'p bo'lса (rulon vazni aniq emas), ruxsat etilgan ±% tolerantlik bormi?
**Nega kerak:** Rulon vazni har doim buyurtma soniga teng emas; tolerantlik bo'lmasa har kirim "farqli" bo'lib qoladi.
**Variantlar:**
- A) ±% tolerantlik (masalan ±2%) ichида avtomatik qabul, tashqarisида tasdiqlash — real
- B) Aniq son talab — har safar qo'lда tuzatish
- C) Keyin
⤳ Ta'sir: Таъминот, kirim, Finance

### Q88. Ombor/ichki logistika ЦКП KPI (bekor turish + kechikishlar)
**Nima:** Ombor/ichki logistika bo'limining ЦКП si sifatида "0 bekor turish" va "logistika kechikishlari soni" KPI o'lchanadimi?
**Nega kerak:** Kitobда statistik ko'rsatkichlar aniq: "Ички логистика сабабли юзага келган кечикишлар сони", "режа бажарилиш даражаси (%)".
**Variantlar:**
- A) Ombor KPI paneli: logistika kechikishlari+reja bajarilishi %+bekor turish daqiqalари — kartani baholash uchun
- B) KPI yo'q — baholash subyektiv
- C) Keyin
⤳ Ta'sir: org-karta KPI, MES, director
  ↳ Agar A: bu KPI ichki logistika boshlig'i kartasiга bog'lanadimi (AI baho)? A1) ha, kartaga; A2) faqat bo'lim umumiy

### Q89. Reorderda bir nechta beruvchiга tender (taklif solishtirish)
**Nima:** Reorder kerak bo'lganда bir nechta beruvchiга so'rov yuborib, narx/muddat solishtiriladimi?
**Nega kerak:** Taъminot boshlig'i bir nechta beruvchi bilan ishlaydi; doim bittasiga buyurtma berса narx nazoratсиз.
**Variantlar:**
- A) Reorder → 2-3 beruvchиga so'rov → taklif solishtirish → tanlash — narx optimal
- B) Doimiy beruvchиga avtomatik — sodda, qimmat
- C) Keyin
⤳ Ta'sir: Таъминот, MM, Finance

### Q90. Ish vaqtiдan tashqari ombor amali nazorati
**Nima:** Kirim/chiqim ish vaqtiдан tashqари (kitob: smena/tanaffus jadvali) qilinса, alohida belgilanib tasdiq talab qilinadimi?
**Nega kerak:** Kitobда qat'iy kun tartibi (smena, tanaffus); ish vaqtiдан tashqари ombor harakati shubhali (o'g'irlik xavfi).
**Variantlar:**
- A) Ish vaqtiдан tashqari amal alohida belgilanadi (sabab+tasdiq) — shubhali harakat ko'rinadi
- B) Vaqt cheklovsiz — har qanday vaqtда ochiq
- C) Keyin
⤳ Ta'sir: HR (smena), audit, xavfsizlik

### Q91. Yangi material kartochkasi ochish huquqi + dublikat ogohlantirish
**Nima:** Yangi material turi faqat ma'lum rol tomonidan ochilib, o'xshash nom bo'lsa dublikat ogohlantirishi chiqadimi?
**Nega kerak:** Har kim material ochsa, bir xil qog'oz turli nom bilan ikki marta kiritilib qoldiq bo'linadi (loyihada master-data dublikat muammo).
**Variantlar:**
- A) Yangi kartochka — faqat MM roli+tasdiq+o'xshash nom ogohlantirishi — dublikat kamayadi
- B) Har omborchi ocha oladi — dublikat ko'payadi
- C) Keyin
⤳ Ta'sir: MM, master-data, barcha modullar

### Q92. Material kim uchun: bizniki ╳ mijoz moli (davalcheskiy)
**Nima:** Omборда turgan material bizniki yoki mijoz bergan (давальческий) ekani belgilanadimi?
**Nega kerak:** Kitobда "материалы заказчика" tushunchasi bor; mijoz materiali o'z materialимиз bilan aralashmasligi, boshqa mijozga ketmasligi kerak.
**Variantlar:**
- A) Har zaxiраga "egasi" (biz/mijoz X), mijoz materiali faqat o'sha mijoz buyurtmasiga — chalkashlik yo'q
- B) Hammasi bir xil — aralashish/yo'qolish xavfi
- C) Keyin
⤳ Ta'sir: SD, ichki logistika, Finance (mulk emas)

### Q93. Smenalararo qoldiq topshirish (peresmenka akti)
**Nima:** Smena oxirida kalit materiallar qoldig'i keyingi smenaga "topshiriladimi" (sanab, imzolab)?
**Nega kerak:** 3 smenali ishlab chiqarish (kitob: "3 сменалик"); smena almashганда kim qancha qoldirgani aniq bo'lmasa, kamomad kimga tegishliligi noma'lum.
**Variantlar:**
- A) Smena oxiriда kalit materiallar qoldig'i qayd etilib keyingi smenага topshiriladi (elektron akt) — javobgarlik smenаga
- B) Topshirish yo'q — kamomad umumiy
- C) Keyin
⤳ Ta'sir: HR (smena), MES, inventarizatsiya

### Q94. Material qaytib ishlatish (vtorichka) — chala rulon/kesindi qaytishi
**Nima:** Ishlab chiqarishдан qaytgan yaroqli qoldiq (chala rulon) omborга "ikkilamchi material" sifatида (sifati pas belgisi bilan) qaytarilib hisoblanadimi?
**Nega kerak:** Kitobда qoldiqlar chiqarish vazifаsi bor; yaroqlisi qaytsa yangi material kam sotib olinadi. (Obrezka/kesindiдан farqli — bu butun chala rulonning sifat-belgili qaytishi.)
**Variantlar:**
- A) Yaroqli qoldiq "ikkilamchi" sifatида qaytadi (sifati pas belgisi) — tejam, kuzatuv
- B) Qoldiq faqat chiqindiга — tejam yo'qoladi
- C) Keyin
⤳ Ta'sir: ichki logistika, Finance, QC

### Q95. Material yoshi (saqlanish vaqti) eskirish signali
**Nima:** Material omборда qancha turgani (yoshи) kuzatilib, ma'lum kunдан oshsa signal beriladimi (yaroqlilik muddati yo'qларга ham)?
**Nega kerak:** Qog'oz/karton uzoq turса namlik tortib sifati pasayadi — muddat yo'q, lekin yosh muhim.
**Variantlar:**
- A) Kirim sanasiдан yosh, ogohlantirish chegarasi (masalan 6 oy) — eski material avval ishlatiladi
- B) Faqat yaroqlilik muddati borларга — qog'oz chetда
- C) Keyin
⤳ Ta'sir: FIFO, dead-stock, QC

### Q96. Namlik/harorat sharoiti buzilганда signal (IoT)
**Nima:** Ombor namligi/harorati datchik bilan kuzatilib, qog'oz/kley uchun xavfli darajага chiqsa signal beriladimi?
**Nega kerak:** Qog'oz namlikка sezgir; ombor sharoiti buzilса butun zaxira sifatsizlanadi.
**Variantlar:**
- A) IoT datchik → chegараdan chiqса signal+log — zaxira himoyalanadi
- B) Qo'lда termometr — kuzatilmaydi
- C) Keyin — IoT keyin
⤳ Ta'sir: IoT, QC, MM
  ↳ Agar A: signal kimга va loglanadimi? A1) ombor+QC; A2) faqat ko'rinish

### Q97. Bo'yoq/kley/lak maxsus saqlash sharti va zona
**Nima:** Bo'yoq, kley, lak uchun maxsus saqlash sharti (harorat, yong'in xavfi, idish) belgilanib, alohida zona talab qilinadimi?
**Nega kerak:** Bosma/karton zavodida bo'yoq va kley alohida sharoit; noto'g'ri saqlanса yaroqsiz yoki yong'in xavfi.
**Variantlar:**
- A) Maxsus materialларga "saqlash sharti"+"xavf turi" maydoni, alohida zona — xavfsizlik
- B) Hamma bir zonada — xavf hisobsiz
- C) Keyin
⤳ Ta'sir: MM, QC, xavfsizlik

### Q98. Rulonдан kesilgan formatlar (list) zaxirasi
**Nima:** Bitta rulonдан kesilgan list/format zaxirasi alohida material (donада) sifatида hisoblanadimi?
**Nega kerak:** Rulon → list kesilганда qolgan listlar yangi zaxira birligi; rulon kg-da, list dona-da.
**Variantlar:**
- A) Kesish operatsiyasi rulon (kg) ni kamaytirib list (dona) zaxirasini yaratadi — ikki o'lchov bog'lanadi
- B) Faqat rulon hisoblanadi, listlar ko'rinmaydi — sex zaxirasi noma'lum
- C) Keyin
⤳ Ta'sir: MES (kesish), ichki logistika

### Q99. Material namuna/probnik chiqimини alohida hisoblash
**Nima:** Sifat sinovi yoki yangi buyurtma uchun materialдан namuna chiqarilса, alohida (probnik) chiqim sifatида hisoblanadimi?
**Nega kerak:** Namuna ham zaxирadan ketadi; hisobга olinmaса kamomad ko'rinadi.
**Variantlar:**
- A) "Namuna chiqimi" alohida sabab kodi, miqdori kichik — kamomad emas, izlanadi
- B) Hisobsiz — kamomadга aralashadi
- C) Keyin
⤳ Ta'sir: QC, dizayn, Finance

### Q100. Inventarizatsияни ABC bo'yicha chastotага ajratish (sikl sanoq)
**Nima:** Qimmat/kritik (A-toifa) materiallar tez-tez (haftalik), arzon (C-toifa) kamroq (yillik) sanaladimi?
**Nega kerak:** Hamma materialни bir xil sanash resurs isrofi; A-toifa pul ko'p, tez-tez tekshirilishi kerak.
**Variantlar:**
- A) ABC ga qarab sanoq chastotаsi (A-haftalik, B-oylik, C-yillik) — resurs optimal
- B) Hamma bir xil — yo isrof yo nazoratsiz
- C) Keyin
⤳ Ta'sir: inventarizatsiya, Finance, ABC

### Q101. Kirim/chiqim blankаsini chop etish va ikki imzo
**Nima:** Har kirim/chiqim uchun bosma blankа (накладная, QR bilan) chop etilib, qabul qiluvchi va topshiruvchi imzolaydimi?
**Nega kerak:** Kitob hujjat-papkа madaniyatiга asoslangan; nizoда qog'oz imzo asosiy dalil.
**Variantlar:**
- A) Tizim blankа chop etadi (QR), ikki imzo, skani biriktiriladi — elektron+qog'oz dalil
- B) Faqat elektron — qog'oz imzo yo'q (huquqiy zaiflik)
- C) Keyin
⤳ Ta'sir: audit, Finance, ombor

### Q102. Ombor ijarasi (mijoz molini saqlash) hisobi va to'lov
**Nima:** Tashqi mijoz molini saqlash xizmati alohида "biznikimas zaxira"+ijara to'lovi sifatида boshqариladimi?
**Nega kerak:** Mijoz moli bizning zaxiрамизга aralashmasligi + ijara daromad sifatида (v1 da ko'tarilgan).
**Variantlar:**
- A) Mijoz moli alohида belgi, qiymatsiz (bizniki emas)+ijara Finance'ga oylik — toza ajratish
- B) Aralash — tannarx va qoldiq buziladi
- C) Keyin
⤳ Ta'sir: Finance (daromad), SD, ombor
  ↳ Agar A: ijara qanday? A1) saqlangan hajm×kun; A2) oylik fiks; A3) poddon×kun

### Q103. Ombor ichида ko'chirish (peremeshcheniye) izi
**Nima:** Material bir zonадан boshqaсiga ko'chirilганда iz qoladimi — qaysi rulon qayerда, kim ko'chirgan?
**Nega kerak:** Katta omборда rulon noto'g'ri javonда bo'lса topib bo'lmaydi; ko'chirish izi locator aniqligini saqlaydi.
**Variantlar:**
- A) Har ko'chirish (eski→yangi joy+kim) qayd etiladi, joriy joy doim aniq — rulon yo'qolmaydi
- B) Faqat oxirgi joy, iz yo'q — qachon/kim noma'lum
- C) Keyin
⤳ Ta'sir: locator, audit, ichki logistika

---

DONE: Ombor / WMS — 51 (kitob-grounded, Q53–Q103; jami fayl 103).
