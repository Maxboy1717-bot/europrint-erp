# Bildirishnoma / Telegram — vizyon savollari

Quyidagi savollar EuroPrint ERP ning Bildirishnoma / Telegram modulini egasining ShVB (2020 Biznes Egasi Maktabi) tizimi va karta-markazli org-model vizyoni asosida qurish uchun. Har bir savol — bitta aniq qaror. Birinchi variant (A) — vizyonga eng mos tavsiya.

---

### Q1. ShVB Telegram bot komandalari (/zvs_status, /my_gsd va h.k.)
**Nima:** Telegramda yozib so'rab oladigan tayyor komandalar: holatim, mening haftalik natijam, kompaniya holati, haftalik digest.
**Nega kerak:** Xodim yoki rahbar ERP'ga kirmasdan, Telegramdan bitta so'z yozib o'z holatini darrov ko'radi — ShVB usulining asosi shu.
**Variantlar:**
- A) To'rttala komanda ham bo'lsin (holatim / mening GSD'm / kompaniya holati / haftalik digest) — to'liq ShVB to'plami
- B) Faqat ikkitasi (mening natijam + kompaniya holati) — soddaroq boshlanish
- C) Keyin — hozir kerak emas

### Q2. "Mening holatim" komandasi nimani ko'rsatadi
**Nima:** Xodim "holatim" deb yozsa, qaytadigan ma'lumot mazmuni.
**Nega kerak:** Har bir kishi o'zining bugungi vazifasi va natijasini bir ko'rinishda bilishi kerak.
**Variantlar:**
- A) Karta nomi + bugungi vazifa + haftalik natija foizi + razryad — karta-modelga to'liq bog'liq
- B) Faqat bugungi vazifa va bajarildi/bajarilmadi — sodda
- C) Keyin — hozir kerak emas

### Q3. Haftalik digest qachon yuborilsin
**Nima:** Hafta yakuni xulosasi (kim qancha qildi) Telegramga avtomatik tushadigan kun va vaqt.
**Nega kerak:** Hammasi bir vaqtda kelса, rahbar dushanba yig'ilishiga tayyor keladi.
**Variantlar:**
- A) Dushanba ertalab soat 8:00 — hafta boshida o'tgan haftani ko'rib chiqish
- B) Shanba kechqurun — hafta yopilishi bilanoq
- C) Egasi har modul uchun o'zi vaqt belgilaydi — moslashuvchan
- D) Keyin — hozir kerak emas

### Q4. Haftalik digest kimga boradi
**Nima:** Digestni qaysi darajadagi odamlar oladi.
**Nega kerak:** Operatorga butun zavod xulosasi kerak emas, egasiga esa hamma kerak.
**Variantlar:**
- A) Org-marshrut bo'yicha: har kim o'z darajasidagini oladi (operator o'zinikini, bo'lim boshlig'i bo'limini, ega — hammasini) — Vysotskiy 7-pog'ona modeliga mos
- B) Faqat rahbarlar (bo'lim boshlig'idan yuqori) oladi — tor doira
- C) Hamma bir xil umumiy digestni oladi — sodda
- D) Keyin — hozir kerak emas

### Q5. FP-tsikl (Fun Point / haftalik tsikl) eslatmalari
**Nima:** ShVB haftalik tsiklining bosqichlari bo'yicha (rejalashtirish, baholash, hisobot) avtomatik eslatmalar.
**Nega kerak:** Tizim hozir 4 ta cron bilan eslatma yuboradi (Se/Ch/Pa/Du) — buni vizyonga moslab to'liq sozlash kerak.
**Variantlar:**
- A) To'liq FP-tsikl: har bosqichda (rejalashtir → bajar → bahola → hisobot ber) alohida eslatma — ShVB ritmi to'liq
- B) Faqat hafta boshi va hafta oxiri eslatmasi — ikki nuqta
- C) Keyin — hozir kerak emas

### Q6. Holat-alert (signal) qachon yuborilsin
**Nima:** Biror ko'rsatkich yomonlashganda yoki vazifa bajarilmaganda darrov keladigan ogohlantirish.
**Nega kerak:** Muammo hafta oxirigacha kutmasin — rahbar darrov bilib choralar ko'rsin.
**Variantlar:**
- A) Belgilangan chegaradan o'tganda darrov (masalan natija 70% dan past) — tezkor nazorat
- B) Faqat kunlik yig'ma signalda (kuniga bir marta) — kamroq bezovta
- C) Keyin — hozir kerak emas

### Q7. Alert chegaralarini kim belgilaydi
**Nima:** "Qachon signal bering" degan chegarani kim sozlaydi.
**Nega kerak:** Har modulning o'z me'yori bor — universal raqam to'g'ri kelmaydi.
**Variantlar:**
- A) Egasi/rahbar har karta yoki modul uchun chegarani o'zi qo'yadi — moslashuvchan
- B) Tizim umumiy standart chegara qo'yadi (hamma uchun bir xil) — sodda
- C) Keyin — hozir kerak emas

### Q8. Kanal sozlamasi: shaxsiy chat yoki guruh
**Nima:** Bildirishnomalar shaxsiy Telegram chatga keladimi yoki bo'lim guruhiga.
**Nega kerak:** Maxfiy natija shaxsiy bo'lishi, jamoaviy xulosa guruhda bo'lishi kerak.
**Variantlar:**
- A) Aralash: shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga — to'g'ri taqsimot
- B) Hammasi shaxsiy chatga — maxfiyroq
- C) Hammasi bo'lim guruhiga — ochiq
- D) Keyin — hozir kerak emas

### Q9. Telegram guruhlarini org-strukturaga bog'lash
**Nima:** Har bir bo'lim/sektsiya uchun alohida Telegram guruh va u org-shoxga ulanishi.
**Nega kerak:** Bildirishnoma to'g'ri odamlarga borishi uchun guruh org-marshrut bilan bog'lanishi kerak.
**Variantlar:**
- A) Har org-tugun (bo'lim/sektsiya) uchun o'z guruhi, avtomatik aniqlanadi — to'liq marshrut
- B) Faqat yirik bo'limlar uchun guruh, qolganlari yuqoriga qo'shiladi — qisman
- C) Keyin — hozir kerak emas

### Q10. Kim-nima-oladi: org-marshrut bo'yicha yo'naltirish
**Nima:** Bildirishnoma yuqoriga (rahbarga) yoki yon tomonga (boshqa bo'limga) qaysi qoida bo'yicha boradi.
**Nega kerak:** Operatorning muammosi to'g'ri keyingi rahbarga chiqishi shart — adresat noto'g'ri bo'lsa, signal yo'qoladi.
**Variantlar:**
- A) Vertikal: keyingi yuqori daraja (manager_id zanjiri) avtomatik oladi — Vysotskiy modeli
- B) Faqat bevosita bo'lim boshlig'i oladi — bir pog'ona
- C) Keyin — hozir kerak emas

### Q11. "Kompaniya holati" komandasi tarkibi
**Nima:** Ega "kompaniya holati" deb yozsa qaytadigan umumiy ko'rsatkichlar.
**Nega kerak:** Egasi har kuni butun zavodning bir nechta asosiy raqamini bir joyda ko'rishi kerak.
**Variantlar:**
- A) 7 otdeleniye bo'yicha asosiy ko'rsatkich (ishlab chiqarish, sotuv, sifat, pul) — ShVB panorama
- B) Faqat 3 ta asosiy raqam (sotuv, ishlab chiqarish, pul) — qisqa
- C) Keyin — hozir kerak emas

### Q12. Leaderboard (eng yaxshi/eng past) digestda
**Nima:** Haftalik digestda kim oldinda, kim orqada degan reyting.
**Nega kerak:** Reyting raqobat va motivatsiya beradi — ShVB usulida muhim. Hozir bu qism YO'Q.
**Variantlar:**
- A) Bo'lim va shaxs bo'yicha top-3 va past-3 ko'rsatilsin — to'liq reyting
- B) Faqat eng yaxshi 3 ta ko'rsatilsin (past tomoni shaxsiy yuboriladi) — yumshoqroq
- C) Reyting yo'q, faqat raqamlar — neytral
- D) Keyin — hozir kerak emas

### Q13. Karta-AI bahosi bildirishnomada
**Nima:** Har bir kartaning AI'si xodim-karta mosligini baholaydi — bu bahoni Telegramга chiqarish.
**Nega kerak:** Karta-modelda har AI o'z hisobotini yozadi; bu xulosa egaga/rahbarga yetib borishi kerak.
**Variantlar:**
- A) Har hafta AI xulosasi (mos/qisman/mos emas + sabab) digestga qo'shilsin — karta-modelga to'liq
- B) Faqat "mos emas" bo'lganda signal yuborilsin — faqat muammoda
- C) Keyin — hozir kerak emas

### Q14. Razryad o'zgarishi haqida xabar
**Nima:** Xodimning razryadi ko'tarilganda yoki tushganda avtomatik bildirishnoma.
**Nega kerak:** Razryad → talab → o'sish → oylik zanjirini hamma bilishi, motivatsiya bo'lishi uchun.
**Variantlar:**
- A) Xodimga + uning rahbariga + HR'ga xabar (oylik o'zgarishi bilan) — to'liq
- B) Faqat xodimning o'ziga xabar — shaxsiy
- C) Keyin — hozir kerak emas

### Q15. Bildirishnoma tili
**Nima:** Xabarlar qaysi tilda keladi (lotin/kirill/rus).
**Nega kerak:** Har xodim o'z qulay tilida o'qishi kerak — tizim 3 tilni qo'llab-quvvatlaydi.
**Variantlar:**
- A) Har xodim profilidagi tanlangan tilda (lotin/kirill/rus) — shaxsiy
- B) Hamma uchun bitta umumiy til (o'zbek lotin) — sodda
- C) Keyin — hozir kerak emas

### Q16. O'qilganini tasdiqlash (muhim xabarlar uchun)
**Nima:** Muhim signal o'qilganini xodim tugma bosib tasdiqlashi.
**Nega kerak:** "Bilmadim, ko'rmadim" degan bahonani yo'qotadi — rahbar kim ko'rganini biladi.
**Variantlar:**
- A) Faqat muhim/shoshilinch xabarlarda tasdiq tugmasi bo'lsin — maqsadli
- B) Hamma xabarda tasdiq talab qilinsin — qattiq nazorat (lekin bezovta qiladi)
- C) Tasdiq umuman kerak emas — sodda
- D) Keyin — hozir kerak emas

### Q17. Javob bermasa eskalatsiya (yuqoriga ko'tarish)
**Nima:** Xodim signalga belgilangan vaqtda javob bermasa, xabar avtomatik rahbariga chiqishi.
**Nega kerak:** Muammo bir joyda qotib qolmasin — org-marshrut bo'yicha yuqoriga chiqib hal bo'lsin.
**Variantlar:**
- A) Vaqt o'tsa avtomatik keyingi yuqori darajaga chiqsin (manager_id zanjiri) — Vysotskiy eskalatsiya
- B) Faqat eslatma takrorlansin, yuqoriga chiqmasin — yumshoq
- C) Keyin — hozir kerak emas

### Q18. Bildirishnoma chastotasi (tinchlik vaqti)
**Nima:** Tunda yoki dam olish kunlari xabar yuborilmasligi.
**Nega kerak:** Xodimni yarim tunda bezovta qilmaslik — faqat shoshilinch holatda istisno.
**Variantlar:**
- A) Ish vaqtida normal, tунда faqat shoshilinch signal — muvozanat
- B) Doim yuborilsin (cheklov yo'q) — to'liq oqim
- C) Keyin — hozir kerak emas

### Q19. Modullararo signallarni bitta bot ostida birlashtirish
**Nima:** Ombor, ishlab chiqarish, moliya, HR — hammasidan xabar bitta Telegram botdan kelishi.
**Nega kerak:** Xodim 5 ta botni emas, bitta joyni kuzatadi — tartibli bo'ladi.
**Variantlar:**
- A) Bitta umumiy ShVB bot, ichida modul belgisi bilan (masalan "Ombor:", "Moliya:") — yagona oqim
- B) Har modul o'z botida qolsin — alohida
- C) Keyin — hozir kerak emas

### Q20. Digestga PDF/rasm hisobot biriktirish
**Nima:** Haftalik digest matn ostida grafik yoki PDF hisobot ham yuborilishi.
**Nega kerak:** Rahbar batafsil ko'rishni xohlasa, ERP'ga kirmasdan ko'rsin.
**Variantlar:**
- A) Matn + bosib ko'riladigan PDF/grafik birga — to'liq
- B) Faqat matn xulosa (havola bilan) — yengil
- C) Keyin — hozir kerak emas

### Q21. Telegram orqali javob/buyruq berish
**Nima:** Rahbar Telegramdan tugma bosib vazifa tasdiqlashi yoki topshiriq berishi (faqat o'qish emas).
**Nega kerak:** Rahbar yo'lda bo'lsa ham ishni boshqarsin — ERP'ga kirmasdan tezkor qaror.
**Variantlar:**
- A) Asosiy amallar (tasdiqla / rad et / topshiriq ber) tugma bilan bo'lsin — interaktiv
- B) Faqat o'qish, amal ERP'da bajarilsin — sodda va xavfsiz
- C) Keyin — hozir kerak emas

### Q22. Bot komandalariga ruxsat (kim nimani so'ray oladi)
**Nima:** "Kompaniya holati" kabi maxfiy komandani kim ishlata olishi.
**Nega kerak:** Oddiy operator butun zavod moliyasini ko'rmasligi kerak — daraja bo'yicha cheklov.
**Variantlar:**
- A) Org-daraja bo'yicha: har kim faqat o'z huquqidagisini so'ray oladi — xavfsiz
- B) Hamma komandani hamma ishlata oladi — ochiq (xavfli)
- C) Keyin — hozir kerak emas

### Q23. Yangi xodim ulanishi (botni ro'yxatdan o'tkazish)
**Nima:** Yangi xodim Telegram bilan tizimga qanday bog'lanadi.
**Nega kerak:** Xodim bog'lanmasa, bildirishnoma bormaydi — bu jarayon oddiy bo'lishi kerak.
**Variantlar:**
- A) HR xodimni qo'shganda Telegram havola/kod avtomatik beriladi — uzluksiz
- B) Xodim o'zi botga telefon raqamini yuborib bog'lanadi — qo'lda
- C) Keyin — hozir kerak emas

### Q24. Oltin-ip (buyurtma) holati bo'yicha bildirishnoma
**Nima:** Buyurtma bosqichdan bosqichga o'tganda (qabul → ishlab chiqarish → tayyor → jo'natildi) tegishli kishilarga xabar.
**Nega kerak:** "Oltin-ip" — buyurtmaning boshidan oxirigacha kuzatuvi; har bosqichda mas'ul xabar olishi kerak.
**Variantlar:**
- A) Har bosqichda mas'ul bo'lim + sotuv menejeri + (kechiksa) rahbar xabar oladi — to'liq kuzatuv
- B) Faqat buyurtma tayyor bo'lganda va kechikkanda xabar — asosiy nuqtalar
- C) Keyin — hozir kerak emas

### Q25. Kechikish/muddat signali
**Nima:** Vazifa yoki buyurtma muddatiga yetib kelganda yoki o'tib ketganda ogohlantirish.
**Nega kerak:** Muddatlar nazoratsiz qolmasin — kechikish oldindan ko'rinsin.
**Variantlar:**
- A) Ikki bosqichli: muddatdan oldin eslatma + o'tib ketsa signal (rahbarga ham) — oldini olish
- B) Faqat muddat o'tgandan keyin signal — kechroq
- C) Keyin — hozir kerak emas

### Q26. ЦКП (yakuniy mahsulot) bajarilishi haqida xabar
**Nima:** Har kartaning ЦКП'si (kutilgan natija) bajarilgan/bajarilmaganligi bo'yicha bildirishnoma.
**Nega kerak:** Karta-modelda har karta o'z natijasi (ЦКП) bilan o'lchanadi — bu hafta yakunida ko'rinishi kerak.
**Variantlar:**
- A) Har hafta ЦКП bajarilish foizi xodim va rahbariga yuborilsin — karta-modelga to'liq
- B) Faqat ЦКП bajarilmaganda signal — muammoda
- C) Keyin — hozir kerak emas

### Q27. Bildirishnoma jurnali (kim qachon nimani oldi)
**Nima:** Yuborilgan barcha xabarlarning yozuvi (kimga, qachon, o'qildimi).
**Nega kerak:** "Xabar bormadi" nizolarini hal qilish va eskalatsiyani nazorat qilish uchun.
**Variantlar:**
- A) To'liq jurnal: kimga/qachon/o'qildimi, ERP ichida ko'rinadi — to'liq nazorat
- B) Faqat shoshilinch xabarlar jurnal qilinsin — qisman
- C) Keyin — hozir kerak emas

### Q28. Shablonlarni (xabar matnlari) kim tahrirlaydi
**Nima:** Bildirishnoma matnlari (salomlashish, signal, digest) tayyor shablonda — ularni kim o'zgartiradi.
**Nega kerak:** Egasi o'z uslubidagi matnni xohlashi mumkin; texnik xodimga bog'lanib qolmaslik kerak.
**Variantlar:**
- A) Egasi/admin ERP ichidan o'zi tahrirlaydi (kodga tegmasdan) — mustaqil
- B) Matnlar qotib turadi, faqat dasturchi o'zgartiradi — barqaror
- C) Keyin — hozir kerak emas

### Q29. Avariya/to'xtash signali (ishlab chiqarish to'xtasa)
**Nima:** Stanok to'xtasa yoki jiddiy nosozlik bo'lsa darrov tegishli kishilarga Telegram signal.
**Nega kerak:** Ishlab chiqarish to'xtashi pul yo'qotish — daqiqa hisobida xabar berilishi kerak.
**Variantlar:**
- A) Darrov: smena ustasi + texnik xizmat + bo'lim boshlig'i bir vaqtda xabar oladi — tezkor
- B) Faqat smena ustasiga, u qolganini xabar qiladi — bir nuqta
- C) Keyin — hozir kerak emas

### Q30. Maqtov/tanbeh (ijobiy va salbiy fidbek)
**Nima:** Xodim yaxshi natija ko'rsatganda maqtov, yomon bo'lganda eslatma xabari.
**Nega kerak:** ShVB usulida tan olish (maqtov) motivatsiyaning kuchli vositasi — avtomatik bo'lsin.
**Variantlar:**
- A) Ikkalasi: top natija — ochiq maqtov (guruhda), past natija — shaxsiy eslatma — muvozanatli
- B) Faqat maqtov bo'lsin (tanbeh rahbar qo'lida) — ijobiy
- C) Keyin — hozir kerak emas
