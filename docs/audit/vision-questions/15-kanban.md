# Kanban / Vazifalar — vizyon savollari

> ShVB yo'nalish 19 (3-Savat — hozir BOR, cc-baskets + 24/48h cron) va 20 (Shaxsiy dastur — QISMAN: haftalik bor, kunlik soatlik + rollover YO'Q) shu modulga tegishli.
> Quyidagi savollar — egasi (zavod egasi) uchun, har biri bitta aniq qaror. Birinchi variant = vizyonga eng mos (tavsiya).
> Maqsad: 3-savat, shaxsiy dastur, taxta, vazifa, observer (kuzatuvchi), eslatma qismlarini qanday qo'shishni hal qilish.

---

### Q1. 3-savat qaysi modulda yashaydi
**Nima:** Kiruvchi/Kutilmoqda/Chiquvchi 3 ta savat hozir Communication Center (xat-hujjat oqimi) ichida bor; Kanban modulida esa alohida taxta-kartalar bor.
**Nega kerak:** Xodim ikki joyda ish izlamasligi, "menga kelgan hamma narsa bir joyda" bo'lishi uchun yagona kirish nuqtasi kerak.
**Variantlar:**
- A) 3-savat = har xodimning shaxsiy "ish stoli", Kanban taxtalari uning ichidan ochiladi — bitta yagona oyna, eng sodda foydalanuvchiga
- B) 3-savat hujjatlar uchun, Kanban vazifalar uchun — alohida qoladi, lekin bitta "umumiy son" badge ko'rsatiladi
- C) Keyin — hozir kerak emas

### Q2. Savatga nima tushadi
**Nima:** "Kiruvchi" savatga aynan qaysi narsalar avtomat tushishi (vazifa, doklad, rasporyajenie, ЗВС tasdiq, xabar, eslatma).
**Nega kerak:** Savat haqiqiy "kun boshlanadigan joy" bo'lishi uchun hamma kelgan ish shu yerda to'planishi shart, aks holda xodim baribir 5 joyni tekshiradi.
**Variantlar:**
- A) Hammasi: menga tegishli har qanday vazifa, doklad, rasporyajenie, tasdiq so'rovi, @belgilash, eslatma — bitta Kiruvchi savatga
- B) Faqat hujjatlar (doklad/rasporyajenie/buyruq), vazifalar Kanban taxtada alohida
- C) Keyin — hozir kerak emas

### Q3. 24 soat qoidasi qanday ishlaydi
**Nima:** Kiruvchi savatdagi narsa 24 soatdan oshsa nima bo'ladi (hozir 24h/48h cron bor).
**Nega kerak:** "Hech narsa javobsiz yotmasin" — ShVB ning asosiy intizom qoidasi; eskirgan ish ko'rinmasa, savat ma'noni yo'qotadi.
**Variantlar:**
- A) 24 soatda qizil belgi + egasiga eslatma, 48 soatda boshliqqa ham xabar (eskalatsiya) — bosqichli bosim
- B) Faqat 24 soatda qizil rang, eslatmasiz — yumshoq
- C) Soat o'rniga ish-kuni hisoblansin (dam olish kuni hisoblanmaydi)
- D) Keyin — hozir kerak emas

### Q4. 24 soat ish vaqtimi yoki astronomik vaqtmi
**Nima:** 24 soat oddiy soat bo'yicha sanaladimi yoki faqat ish soatlari (masalan 9:00–18:00, dam olishsiz).
**Nega kerak:** Juma kechqurun kelgan ish dushanba ertalab "kechikkan" ko'rinmasligi uchun — adolatli o'lchov.
**Variantlar:**
- A) Faqat ish soatlari + ish kunlari hisoblansin (kalendar + smena jadvalidan) — adolatli, lekin sozlash kerak
- B) Oddiy 24 astronomik soat — eng sodda
- C) Keyin — hozir kerak emas

### Q5. Kutilmoqda savatining ma'nosi
**Nima:** "Kutilmoqda" savat aniq nimani bildiradi — men boshqani kutyapmanmi yoki men ustida ishlayapmanmi.
**Nega kerak:** Bu savat tushunarsiz bo'lsa, hamma narsa shu yerga tiqilib qoladi va "to'siq qayerda" ko'rinmaydi.
**Variantlar:**
- A) "Men boshqadan javob/natija kutyapman" — kim kutilayotgani va muddati ko'rsatiladi (to'siqni ko'rsatadi)
- B) "Men hozir ishlayapman" — oddiy jarayon holati
- C) Ikkalasi ham: ichida "men ishlayapman" va "boshqani kutyapman" deb 2 belgi
- D) Keyin — hozir kerak emas

### Q6. Chiquvchidan keyin nima bo'ladi (arxiv)
**Nima:** Chiquvchi savatga o'tgan (bajarilgan/yuborilgan) narsa keyin qayerga ketadi.
**Nega kerak:** Tugagan ish savatda turaversa, savat to'lib boradi; lekin tarix kerak bo'lganda topish ham zarur.
**Variantlar:**
- A) 24 soatdan keyin avtomat arxivga, lekin "Tarix/Arxiv" bo'limidan har doim qidirib topiladi — toza savat + saqlangan tarix
- B) Qo'lda "Arxivga" tugmasi bosilganda ketadi
- C) Keyin — hozir kerak emas

### Q7. Shaxsiy dastur — kunlik soatlik ko'rinish
**Nima:** Hozir haftalik reja bor; ShVB "Персональная программа" kunlik, soat bo'yicha jadvalni talab qiladi (YO'Q).
**Nega kerak:** Xodim ertalab "bugun nima qilaman, qaysi soatda" deb aniq ko'rsa — kun rejali o'tadi, bu ShVB ning shaxsiy unumdorlik tizimi.
**Variantlar:**
- A) Kunlik soatlik grid (9:00, 10:00 ... 18:00) + har vazifaga vaqt belgilanadi — to'liq ShVB modeli
- B) Soatsiz oddiy kunlik ro'yxat (faqat ustuvorlik tartibida) — soddaroq
- C) Keyin — hozir kerak emas

### Q8. Rollover (bajarilmagan vazifa ertangi kunga)
**Nima:** Bugun bajarilmagan shaxsiy vazifa ertangi kunga avtomat ko'chsinmi (YO'Q hozir).
**Nega kerak:** Vazifa "yo'qolib qolmasligi" va kechikish ko'rinib turishi uchun — ShVB rollover mantig'i.
**Variantlar:**
- A) Avtomat ertangi kunga ko'chadi + "necha marta ko'chgan" sanagich ko'rsatiladi (surunkali kechikish ko'rinadi)
- B) Avtomat ko'chadi, sanagichsiz — sodda
- C) Ko'chmaydi, faqat "kechikkan" deb qizil turadi, xodim o'zi ko'chiradi
- D) Keyin — hozir kerak emas

### Q9. Rollover necha martagacha
**Nima:** Bir vazifa cheksiz ko'chaveradimi yoki ma'lum martadan keyin majburan ko'rib chiqiladimi.
**Nega kerak:** Cheksiz ko'chadigan vazifa hech qachon bajarilmaydi — uni "qayta rejalashtir yoki bekor qil" deb to'xtatish kerak.
**Variantlar:**
- A) 3 marta ko'chgach majburan boshliqqa ko'rinadi / "qayta rejalashtir" so'raydi — intizom
- B) Cheksiz ko'chadi, faqat rang to'qlashadi
- C) Keyin — hozir kerak emas

### Q10. Shaxsiy dastur ustuvorligi (rang kodi)
**Nima:** Vazifa ustuvorligi qanday belgilanadi (Yuqori/O'rta/Past — qizil/sariq/yashil).
**Nega kerak:** Xodim qaysi ishni avval qilishni darrov ko'rishi uchun yagona rang tili kerak.
**Variantlar:**
- A) 3 daraja: Yuqori=qizil, O'rta=sariq, Past=yashil — sodda va ShVB ga mos
- B) 4 daraja (shoshilinch alohida)
- C) Eyzenxauer matritsasi (muhim/shoshilinch 4 kvadrant)
- D) Keyin — hozir kerak emas

### Q11. Soat-blok (vaqt rejalashtirish) majburiymi
**Nima:** Har vazifaga taxminiy vaqt (masalan 30 daqiqa) yozilishi shartmi.
**Nega kerak:** Vaqt belgilansa, kun real to'lganini ko'rsatadi ("bugunga 10 soat reja qildim, kun 8 soat") — ortiqcha yuklamani oldini oladi.
**Variantlar:**
- A) Ixtiyoriy: yozsa kun-yuklamasi ko'rsatiladi, yozmasa oddiy ro'yxat — moslashuvchan
- B) Majburiy: har vazifaga vaqt yoziladi
- C) Keyin — hozir kerak emas

### Q12. Vazifa kim tomonidan beriladi
**Nima:** Vazifa faqat boshliqdan keladimi, yoki xodim o'ziga ham, hamkasbiga ham bera oladimi.
**Nega kerak:** Kim kimga ish bera olishi roziligi mas'uliyat va tartibni belgilaydi.
**Variantlar:**
- A) Hamma yo'l: boshliq→bo'ysunuvchi, o'ziga, va gorizontal (hamkasbga) — lekin gorizontal so'rov qabul/rad qilinadi
- B) Faqat boshliq→bo'ysunuvchi + o'ziga (gorizontal yo'q)
- C) Keyin — hozir kerak emas

### Q13. Vazifani qabul qilish/rad etish
**Nima:** Boshqadan kelgan vazifani xodim "qabul qildim / rad etdim (sabab bilan)" deb javob beradimi.
**Nega kerak:** "Berdim degani bajardi degani emas" — qabul qadami mas'uliyatni aniq biriktiradi.
**Variantlar:**
- A) Ha: qabul/rad (rad sababi majburiy) qadami bor — aniq mas'uliyat
- B) Avtomat qabul, rad qilish yo'q (boshliq buyrug'i)
- C) Keyin — hozir kerak emas

### Q14. Vazifa karta-modeliga bog'lanadimi
**Nima:** Vazifa qaysi lavozim-kartaga / qaysi GSD (statistik)ga hissa qo'shishi belgilanadimi.
**Nega kerak:** Karta-markazli vizyonda har ish "to'g'ri ishning ta'rifi"ga ulanishi kerak — shunda vazifa GSD natijasiga sanaladi.
**Variantlar:**
- A) Ha: vazifa ixtiyoriy ravishda kartaga/GSD ga bog'lanadi, bajarilsa GSD ga avtomat hissa — vizyonga to'liq mos
- B) Faqat lavozim-kartaga bog'lanadi, GSD aloqasiz
- C) Hech narsaga bog'lanmaydi (erkin vazifa)
- D) Keyin — hozir kerak emas

### Q15. Taxta (board) tuzilishi
**Nima:** Kanban taxta ustunlari (statuslar) qanday — sobit ustunlarmi yoki har bo'lim o'zi sozlaydimi.
**Nega kerak:** Ustun nomlari ish jarayonini aks ettirishi kerak; har bo'lim jarayoni har xil bo'lishi mumkin.
**Variantlar:**
- A) Standart 4 ustun (Reja / Jarayonda / Tekshiruvda / Bajarildi) hammaga, lekin bo'lim qo'sha oladi — tartib + moslashuv
- B) Har bo'lim o'z ustunlarini noldan tuzadi — erkin
- C) Faqat sobit standart ustunlar (sozlamasiz)
- D) Keyin — hozir kerak emas

### Q16. Taxta kimga tegishli (qamrov)
**Nima:** Taxtalar shaxsiymi, bo'limgami, loyihagami, yoki butun zavodgami.
**Nega kerak:** Kim qaysi taxtani ko'rishi va ish qaysi darajada tashkillanishini belgilaydi.
**Variantlar:**
- A) Uch tur: shaxsiy + bo'lim + loyiha taxta — keng qamrov
- B) Faqat bo'lim taxtalari
- C) Faqat shaxsiy (har kim o'zi)
- D) Keyin — hozir kerak emas

### Q17. Observer (kuzatuvchi) roli
**Nima:** Vazifaga bevosita ijrochi bo'lmagan, lekin natijani kuzatuvchi (observer) qo'shish mumkinmi.
**Nega kerak:** Boshliq yoki hamkasb ishni "qiluvchi bo'lmasdan" kuzatib, holatdan xabardor bo'lishi uchun — nazorat va shaffoflik.
**Variantlar:**
- A) Ha: vazifaga ko'p kuzatuvchi qo'shiladi, ular faqat o'qiydi + bildirishnoma oladi (o'zgartira olmaydi) — toza nazorat
- B) Kuzatuvchi ham izoh yoza oladi (faol kuzatuvchi)
- C) Keyin — hozir kerak emas

### Q18. Observer kim bo'la oladi va avtomat qo'shiladimi
**Nima:** Kuzatuvchi qo'lda qo'shiladimi yoki rol bo'yicha avtomat (masalan vazifa egasining boshlig'i avtomat kuzatuvchi).
**Nega kerak:** Muhim vazifalarni boshliq avtomat ko'rib tursin, qo'lda qo'shishni unutmasin.
**Variantlar:**
- A) Ikkalasi: qo'lda qo'shish + yuqori ustuvorlikdagi vazifaga boshliq avtomat kuzatuvchi
- B) Faqat qo'lda qo'shiladi
- C) Keyin — hozir kerak emas

### Q19. Eslatma (reminder) turlari
**Nima:** Vazifa/savat uchun eslatma qanday yuboriladi (ilova ichida, Telegram, ikkalasi).
**Nega kerak:** Xodim ekranda bo'lmasa ham muhim ishni o'tkazib yubormasligi uchun — ShVB da Telegram asosiy kanal.
**Variantlar:**
- A) Ilova ichida + Telegram (egasi tanlaydi qaysi kanalda) — keng qamrov
- B) Faqat ilova ichida qo'ng'iroq belgisi
- C) Faqat Telegram
- D) Keyin — hozir kerak emas

### Q20. Eslatma qachon yuboriladi
**Nima:** Eslatma qaysi hodisalarda chiqadi (muddat yaqinlashganda, kechikkanda, yangi vazifa kelganda).
**Nega kerak:** Juda ko'p eslatma "shovqin" bo'lib e'tibordan chiqadi; juda kam bo'lsa ish unutiladi — to'g'ri balans kerak.
**Variantlar:**
- A) 3 holat: yangi vazifa keldi + muddatga 1 kun qoldi + muddat o'tdi — yetarli va shovqinsiz
- B) Faqat muddat o'tganda
- C) Har bosqichda (ko'p eslatma)
- D) Keyin — hozir kerak emas

### Q21. Shaxsiy eslatma (savatsiz)
**Nima:** Xodim hech kimga bog'liq bo'lmagan shaxsiy eslatma qo'ya oladimi ("ertaga 14:00 da qo'ng'iroq qil").
**Nega kerak:** Shaxsiy dastur to'liq ish stoli bo'lishi uchun mayda eslatmalarni ham shu yerda saqlash qulay.
**Variantlar:**
- A) Ha: sana+vaqtli shaxsiy eslatma, faqat o'ziga ko'rinadi — to'liq ish stoli
- B) Yo'q, faqat vazifaga bog'liq eslatma
- C) Keyin — hozir kerak emas

### Q22. Takrorlanuvchi vazifa
**Nima:** Har kun/hafta takrorlanadigan vazifa (masalan "har dushanba haftalik reja topshir") avtomat yaratiladimi.
**Nega kerak:** Doimiy ritmik ishlarni qo'lda qayta kiritish vaqt yo'qotadi va unutiladi — avtomat tug'ilsa intizom mustahkamlanadi.
**Variantlar:**
- A) Ha: kunlik/haftalik/oylik takror shabloni, belgilangan kunda avtomat shaxsiy dasturga tushadi — ritm
- B) Yo'q, har gal qo'lda yaratiladi
- C) Keyin — hozir kerak emas

### Q23. Vazifa bo'limlararo (gorizontal) o'tkazish
**Nima:** Bir bo'limdan boshqa bo'limga vazifa/so'rov uzatish qanday bo'ladi (org-modeldagi gorizontal harakat).
**Nega kerak:** Ish ko'pincha bo'limlar orasida o'tadi (savdo→ishlab chiqarish); uzatish izsiz qolmasligi kerak.
**Variantlar:**
- A) Boshqa bo'limga uzatilgan vazifa o'sha bo'lim boshlig'ining Kiruvchi savatiga tushadi + iz qoladi (kim kimga uzatdi) — shaffof
- B) To'g'ridan-to'g'ri xodimga uzatiladi (boshliqsiz)
- C) Keyin — hozir kerak emas

### Q24. Doklad / Rasporyajenie bilan bog'lanish
**Nima:** Koordinatsiyadagi rasporyajenie (topshiriq) avtomat Kanban vazifaga aylanadimi.
**Nega kerak:** Yig'ilishda berilgan topshiriq xodimning savatida paydo bo'lsa — qaror bilan ijro o'rtasida uzilish bo'lmaydi.
**Variantlar:**
- A) Ha: rasporyajenie chiqarilsa, ijrochining Kiruvchi savatiga avtomat vazifa tug'iladi va bog'lanadi — qaror→ijro yopiq
- B) Qo'lda: xodim o'zi rasporyajeniedan vazifa yaratadi
- C) Keyin — hozir kerak emas

### Q25. Vazifa statuslari ro'yxati (master-data)
**Nima:** Vazifa qanday holatlardan o'tadi (yangi, qabul qilindi, jarayonda, kutilmoqda, tekshiruvda, bajarildi, bekor qilindi).
**Nega kerak:** Yagona status ro'yxati bo'lmasa, har bo'lim har xil ataydi va hisobotlar mos kelmaydi.
**Variantlar:**
- A) To'liq oqim: Yangi → Qabul qilindi → Jarayonda → Tekshiruvda → Bajarildi (+ Bekor/Rad) — aniq nazorat
- B) Sodda: Bajarilmagan → Bajarildi (faqat 2 holat)
- C) O'rtacha: Reja → Jarayonda → Bajarildi (3 holat)
- D) Keyin — hozir kerak emas

### Q26. Vazifa muddati o'tganda (kechikish) kim ko'radi
**Nima:** Muddati o'tgan vazifa kimga ko'rinadi va eskalatsiya bo'ladimi.
**Nega kerak:** Kechikkan ish boshliqqa ko'rinmasa, javobgarlik yo'qoladi — ShVB intizomi.
**Variantlar:**
- A) Xodimga qizil + boshlig'iga "bo'ysunuvchingizda kechikkan ish bor" xabari — vertikal nazorat
- B) Faqat xodimning o'ziga qizil
- C) Keyin — hozir kerak emas

### Q27. Bajarilgan ishni boshliq tasdiqlaydimi
**Nima:** "Bajarildi" deyilgan vazifani boshliq tekshirib tasdiqlaydimi yoki avtomat yopiladimi.
**Nega kerak:** "Bajardim" bilan "haqiqatan bajarildi" farq qiladi — tasdiq sifatni ushlab turadi.
**Variantlar:**
- A) Yuqori ustuvorlik/topshiriq vazifalari boshliq tasdig'i bilan yopiladi, oddiylari avtomat — balans
- B) Hamma vazifa boshliq tasdig'i bilan yopiladi
- C) Hammasi avtomat yopiladi (tasdiqsiz)
- D) Keyin — hozir kerak emas

### Q28. Kanban va shaxsiy dastur o'rtasida bog'liqlik
**Nima:** Bo'lim taxtasidagi menga tegishli vazifalar shaxsiy kunlik dasturda ham ko'rinadimi.
**Nega kerak:** Xodim taxta va shaxsiy reja o'rtasida ikkilanmasligi uchun — bir ishni ikki marta rejalashtirmasin.
**Variantlar:**
- A) Avtomat: taxtadan menga tegishli vazifa shaxsiy dasturga ham tushadi, xodim vaqt belgilaydi — yagona ko'rinish
- B) Alohida: taxta o'zi, shaxsiy dastur o'zi
- C) Keyin — hozir kerak emas

### Q29. Vazifaga fayl/izoh biriktirish
**Nima:** Vazifaga fayl (rasm, hujjat) va izoh-suhbat (comment) qo'shish bo'ladimi (hozir card-files bor).
**Nega kerak:** Ish konteksti (chizma, namuna, kelishuvlar) vazifa ichida saqlansa, alohida chat/pochtada izlash kerak bo'lmaydi.
**Variantlar:**
- A) Ha: fayl + izoh tasmasi (kim qachon yozdi) vazifa ichida — to'liq kontekst
- B) Faqat izoh (faylsiz)
- C) Keyin — hozir kerak emas

### Q30. Kunlik/haftalik shaxsiy hisobot
**Nima:** Kun/hafta oxirida xodimga "bugun nechta bajardin, nechta ko'chdi" degan qisqa yakun ko'rsatiladimi.
**Nega kerak:** O'z unumdorligini ko'rgan xodim o'zini boshqaradi; bu raqam GSD/reyting bilan ham bog'lanadi.
**Variantlar:**
- A) Ha: kunlik mini-yakun + haftalik "bajarildi/ko'chdi/kechikdi" hisoboti, GSD ga ulanadi — vizyonga mos
- B) Faqat son ko'rsatiladi, hisobotsiz
- C) Keyin — hozir kerak emas
