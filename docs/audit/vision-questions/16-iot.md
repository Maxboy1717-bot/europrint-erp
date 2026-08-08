# IoT — vizyon savollari

> EuroPrint Qo'qon karton/qadoqlash zavodi ERP. Bu hujjat IoT (sensor, mashina holati, anomaliya, telemetriya, kamera-AI, MES-ulanish, texnik xizmat, energiya) modulini egasi vizyoniga (ShVB + karta-model) qanday qo'shishni hal qilish uchun. Har savol — bitta aniq qaror. Birinchi variant = vizyonga eng mos (tavsiya).

---

### Q1. Sensor qaysi mashinalarga qo'yiladi
**Nima:** Zavodda qaysi mashinalar (gofra-stanok, flekso-bosma, kesish, yelimlash, kompressor) IoT sensor bilan kuzatiladi.
**Nega kerak:** Sensor pul va o'rnatish talab qiladi — hamma mashinaga emas, eng muhimlariga qo'yilsa, foyda tez ko'rinadi.
**Variantlar:**
- A) Avval 3-5 ta asosiy mashina (eng ko'p to'xtaydigan/eng qimmati) — tez natija, kam xarajat
- B) Barcha ishlab chiqarish mashinalari birdan — to'liq qamrov, lekin qimmat va sekin
- C) Keyin — hozir kerak emas

### Q2. Mashina holati ranglari (master-ro'yxat)
**Nima:** Mashinaning real vaqtdagi holati qaysi nomlar bilan ko'rsatiladi (ishlayapti / to'xtagan / sozlanmoqda / nosoz / o'chiq).
**Nega kerak:** Bitta standart ro'yxat bo'lsa, hamma sex ekranida bir xil tushuniladi va hisobotlar mos keladi.
**Variantlar:**
- A) 5 holat: Ishlayapti (yashil) / To'xtagan (qizil) / Sozlanmoqda (sariq) / Nosoz (qora) / O'chiq (kulrang) — aniq va yetarli
- B) Faqat 3 holat: Ishlayapti / To'xtagan / O'chiq — soddaroq, lekin sababini ajratmaydi
- C) Keyin — hozir kerak emas

### Q3. Mashina uptime (ish vaqti) ko'rsatkichi
**Nima:** Har mashina kunlik/haftalik necha foiz vaqt haqiqatan ishlaganini avtomatik hisoblash.
**Nega kerak:** ShVB statistikasi (GSD) uchun "mashina qancha ishladi" — bo'lim natijasini o'lchaydigan asosiy raqam.
**Variantlar:**
- A) Avtomatik (sensor signalidan, smenaga/kunga/haftaga) + GSD'ga ulash — vizyonga mos, qo'l ishi yo'q
- B) Operator qo'lda kiritadi (smena oxirida) — arzon, lekin xatoga moyil
- C) Keyin — hozir kerak emas

### Q4. To'xtash (downtime) sababini yozish
**Nima:** Mashina to'xtaganda sababini (ta'mirlash, material yo'q, sozlash, smena tugadi, tok yo'q) belgilash.
**Nega kerak:** Sababsiz raqam foydasiz — "nega to'xtadi" bilingandagina yo'qotishni kamaytirish bo'ladi.
**Variantlar:**
- A) Tayyor sabab ro'yxatidan operator tanlaydi (planlangan/planlanmagan ajratiladi) — tahlilga qulay
- B) Operator erkin matn yozadi — moslashuvchan, lekin tahlil qilib bo'lmaydi
- C) Keyin — faqat to'xtash vaqtini yozamiz, sabab yo'q

### Q5. To'xtash sabablari ro'yxati (master-data)
**Nima:** Q4 dagi tayyor sabablar ro'yxatining aniq mazmuni (qaysi sabablar bo'ladi).
**Nega kerak:** Bir xil ro'yxat — barcha mashinalar va smenalar bo'yicha taqqoslash imkonini beradi.
**Variantlar:**
- A) 8-10 standart sabab: ta'mirlash, material yo'q, qolip almashtirish, sozlash, tozalash, tok yo'q, operator yo'q, sifat muammosi — to'liq qamrov
- B) Qisqa 4-5 sabab (planlangan/planlanmagan/material/boshqa) — soddaroq
- C) Keyin — hozir kerak emas

### Q6. Anomaliya (g'ayrioddiy holat) ogohlantirishi
**Nima:** Sensor odatdagidan chetga chiqsa (harorat oshib ketdi, tebranish kuchaydi, tezlik tushdi) avtomatik ogohlantirish.
**Nega kerak:** Mashina butunlay sinishidan oldin signal kelsa, katta ta'mir va to'xtashning oldi olinadi.
**Variantlar:**
- A) Avtomatik aniqlash + darhol ogohlantirish (sex ekrani + Telegram) — vizyonga mos, oldini olish
- B) Faqat ekranda ko'rsatish, alohida ogohlantirish yo'q — arzon, lekin e'tibordan chetda qoladi
- C) Keyin — hozir kerak emas

### Q7. Anomaliya chegaralarini kim belgilaydi
**Nima:** "Qaysi harorat/tebranish g'ayrioddiy" degan chegarani kim va qanday o'rnatadi.
**Nega kerak:** Chegara noto'g'ri bo'lsa — yo har doim shovqin, yo hech qachon signal; ishlab chiqarish boshlig'i nazorat qilsa to'g'ri bo'ladi.
**Variantlar:**
- A) Har mashina turi uchun chegara admin/ishlab chiqarish boshlig'i tomonidan sozlanadi — moslashuvchan, mas'uliyatli
- B) Tizim o'zi tarixiy ma'lumotdan o'rganadi (avto-chegara) — aqlli, lekin boshda ishonchsiz
- C) Keyin — hozir kerak emas

### Q8. Anomaliya kelganda nima bo'ladi (workflow)
**Nima:** Anomaliya signal kelgach tizim avtomatik qanday harakat qiladi (ish buyrug'i ochish, mas'ulga xabar, jurnalga yozish).
**Nega kerak:** Signal hech kimga bormasa — befoyda; avtomatik harakat bo'lsa, muammo tez hal bo'ladi.
**Variantlar:**
- A) Avto: texnik xizmat vazifasi ochiladi + mas'ul mexanikga xabar + jurnal — to'liq oqim
- B) Faqat jurnalga yoziladi, harakatni odam qiladi — sodda, lekin sekin
- C) Keyin — hozir kerak emas

### Q9. Telemetriya tarixini saqlash muddati
**Nima:** Sensor o'qishlari (harorat, tezlik, hisoblagich) qancha muddat saqlanadi va qanchalik tez-tez yoziladi.
**Nega kerak:** Juda ko'p saqlasa — baza shishadi; juda kam saqlasa — tahlil va trend yo'qoladi. Muvozanat kerak.
**Variantlar:**
- A) Batafsil 3-6 oy, keyin kunlik o'rtachaga siqib uzoq saqlash — tahlilga ham, joyga ham mos
- B) Hammasini batafsil cheksiz saqlash — to'liq, lekin baza tez shishadi
- C) Keyin — faqat oxirgi holat saqlanadi, tarix yo'q

### Q10. Kamera-AI bilan xona inspeksiyasi
**Nima:** Sex/ombor kamerasidan AI orqali tartib, xavfsizlik va ish holatini avtomatik baholash (ShVB inspektor-menejer yo'nalishi).
**Nega kerak:** Inspektor har xonani qo'lda aylanmasdan, AI ball qo'yadi — nazorat tez va xolis bo'ladi.
**Variantlar:**
- A) AI rasm baholaydi + ball + anomaliya (allaqachon qisman bor) — to'liq qilamiz, ShVB'ga mos
- B) Faqat kamera ko'rsatadi, AI baho yo'q — odam ko'radi, ball qo'ymaydi
- C) Keyin — hozir kerak emas

### Q11. Kamera-AI nimani tekshiradi (master-ro'yxat)
**Nima:** Kamera-AI aynan qaysi mezonlarni baholaydi (tozalik, himoya kiyim, yo'lak band emasligi, mashina yonida tartib, telefon ishlatish).
**Nega kerak:** Aniq mezon ro'yxati bo'lsa — ball izchil va adolatli, har inspektor bir narsaga qaraydi.
**Variantlar:**
- A) 5-7 mezon ro'yxati (tozalik / himoya vositasi / yo'lak / tartib / xavfsizlik) — aniq va o'lchanadigan
- B) Faqat umumiy "toza/iflos" bahosi — sodda, lekin yuzaki
- C) Keyin — hozir kerak emas

### Q12. Inspeksiya buzilishini tuzatish jurnali
**Nima:** Kamera-AI yoki inspektor buzilish topganda, uni rasmiy buzilish → tuzatish → tekshiruv ko'rinishida yozish (audit hozir "rasmiy buzilish/tuzatish jadvali yetmaydi" deyapti).
**Nega kerak:** "Topdim va unutdim" emas, balki tuzatilgani tasdiqlanishi kerak — javobgarlik bo'ladi.
**Variantlar:**
- A) Har buzilish → mas'ul → muddat → tuzatildi tasdig'i (yopiq sikl) — to'liq nazorat
- B) Faqat ro'yxat ko'rinishida yoziladi, yopilishi kuzatilmaydi — sodda, lekin chala
- C) Keyin — hozir kerak emas

### Q13. MES bilan ulanish (ish buyrug'i ↔ mashina)
**Nima:** IoT mashina ma'lumoti ishlab chiqarish buyrug'i (MES) bilan bog'lanishi — qaysi buyruqda mashina necha dona chiqarganini hisoblash.
**Nega kerak:** Sensor hisoblagichi avtomatik "bajarildi" qilsa, operator qo'lda kiritmaydi va raqam aniq bo'ladi.
**Variantlar:**
- A) Sensor hisoblagich → MES buyrug'iga avtomatik bog'lanadi (chiqarilgan dona avto-yoziladi) — vizyonga mos
- B) Faqat ko'rsatadi, MES bilan bog'lanmaydi — ikki tizim alohida qoladi
- C) Keyin — hozir kerak emas

### Q14. OEE (umumiy samaradorlik) ko'rsatkichi
**Nima:** Har mashina uchun OEE — ish vaqti × tezlik × sifat birlashgan yagona samaradorlik foizi (audit'da bor deyilgan).
**Nega kerak:** Bitta raqam mashina qanchalik samarali ishlayotganini ko'rsatadi — bo'lim/mashina taqqoslash uchun.
**Variantlar:**
- A) To'liq OEE (3 omil: vaqt + tezlik + sifat) avtomatik + trend — to'liq ko'rsatkich
- B) Faqat soddalashtirilgan ish vaqti foizi — tez, lekin sifatni hisobga olmaydi
- C) Keyin — hozir kerak emas

### Q15. RUL — qolgan resurs (predictive maintenance)
**Nima:** Mashina/uzelning "yana qancha ishlaydi" prognozi — ishlash vaqti va holatdan kelib chiqib texnik xizmat oldindan rejalashtiriladi.
**Nega kerak:** Sinishdan oldin ta'mirlash — to'satdan to'xtash va shoshilinch ta'mir xarajatini kamaytiradi.
**Variantlar:**
- A) Oddiy qoidaga asoslangan prognoz (ish soati/sikl bo'yicha) — ishonchli, tez joriy etiladi
- B) AI prognoz (sensor trendidan o'rganadi) — kuchli, lekin ko'p ma'lumot va vaqt talab qiladi
- C) Keyin — hozir kerak emas

### Q16. Texnik xizmat jadvali (reja-profilaktika)
**Nima:** Har mashina uchun rejali texnik xizmat (har N soat/sikl yoki sanada) eslatmasi va bajarilishini yozish.
**Nega kerak:** Reja bo'yicha xizmat — buzilishlarni kamaytiradi va mashina umrini uzaytiradi.
**Variantlar:**
- A) Avtomatik jadval (ish soatiga bog'liq) + eslatma + bajarildi belgisi — to'liq oldini olish
- B) Qo'lda kalendar (sanaga ko'ra) — sodda, lekin haqiqiy yuklamani hisobga olmaydi
- C) Keyin — hozir kerak emas

### Q17. Texnik xizmat ishlari ro'yxati (master-data)
**Nima:** Texnik xizmatda bajariladigan standart ishlar ro'yxati (yog'lash, filtr almashtirish, kamar tekshirish, kalibrlash) va davriyligi.
**Nega kerak:** Tayyor ro'yxat bo'lsa — mexanik hech narsani unutmaydi, ish izchil bajariladi.
**Variantlar:**
- A) Mashina turi bo'yicha standart ishlar + davriylik jadvali — to'liq va izchil
- B) Faqat umumiy "ta'mirlandi" yozuvi — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q18. Energiya (tok) iste'molini kuzatish
**Nima:** Mashina/sexning elektr energiya iste'molini sensor orqali o'lchash va kuzatish.
**Nega kerak:** Tok — katta xarajat; qaysi mashina ko'p yeyishi va behuda sarf bilinsa, tejaш bo'ladi.
**Variantlar:**
- A) Mashina darajasida o'lchash (har mashina necha kVt) — aniq, sababni topadi
- B) Faqat umumiy sex/zavod hisoblagichi — arzon, lekin mashinani ajratmaydi
- C) Keyin — hozir kerak emas

### Q19. Energiya bo'yicha hisobot va ogohlantirish
**Nima:** Energiya iste'moli normadan oshsa yoki bo'sh turganda tok yeyilsa ogohlantirish va kunlik/haftalik hisobot.
**Nega kerak:** Behuda sarf (mashina bo'sh turib tok yeyishi) ko'rinmasa — pul shundoq ketadi.
**Variantlar:**
- A) Norma + oshganda ogohlantirish + haftalik energiya hisoboti — faol tejash
- B) Faqat raqam ko'rsatiladi, ogohlantirish yo'q — passiv, e'tibordan chetda
- C) Keyin — hozir kerak emas

### Q20. Birlik mahsulotga energiya sarfi (ShVB statistikasi)
**Nima:** Bir dona/bir m² mahsulotga qancha energiya ketishini hisoblash (energiya ÷ ishlab chiqarilgan dona).
**Nega kerak:** Bu — ShVB GSD ko'rsatkichi: samaradorlik o'sayaptimi yoki yomonlashyaptimi shu raqamdan ko'rinadi.
**Variantlar:**
- A) Avtomatik (energiya / MES dona) + GSD'ga ulash — vizyonga to'liq mos
- B) Faqat umumiy energiya, donaga bo'linmaydi — chala ko'rsatkich
- C) Keyin — hozir kerak emas

### Q21. Sex katta ekrani (Andon tablosi)
**Nima:** Sexda barcha mashinalar holati real vaqtda ko'rinadigan katta umumiy ekran/tablo.
**Nega kerak:** Hamma bir qarashda qaysi mashina to'xtaganini ko'rsa — javob tezlashadi, boshliq tepada turmaydi.
**Variantlar:**
- A) Katta tablo: barcha mashina holati + to'xtaganlari qizil + jonli yangilanadi — tez ko'rinish
- B) Faqat shaxsiy kompyuterda dashboard — har kim alohida qaraydi
- C) Keyin — hozir kerak emas

### Q22. Operator tableti (mashina yonida)
**Nima:** Mashina yonidagi tablet orqali operator to'xtash sababini, defekt, smena ma'lumotini kiritadi (audit'da iot-tablet controller bor).
**Nega kerak:** Sabab joyida, real vaqtda kiritilsa — ma'lumot aniq va to'liq bo'ladi.
**Variantlar:**
- A) Har mashinada tablet: holat + to'xtash sababi + defekt + smena hisoboti — to'liq joriy
- B) Smena oxirida bitta umumiy kompyuterdan kiritish — arzon, lekin kechikadi
- C) Keyin — hozir kerak emas

### Q23. Sensor uzilganda / signal kelmasa
**Nima:** Sensor o'chsa, internet uzilsa yoki ma'lumot kelmay qolsa tizim qanday harakat qiladi.
**Nega kerak:** "Signal yo'q"ni "mashina to'xtagan" deb o'qib qolsa — soxta tashvish; aksincha jim qolsa — buzilishni o'tkazib yuboradi.
**Variantlar:**
- A) "Aloqa yo'q" alohida holat sifatida ko'rsatiladi + texnikga xabar — aniq va xavfsiz
- B) Oxirgi ma'lum holat saqlanib turadi — sodda, lekin chalg'itishi mumkin
- C) Keyin — hozir kerak emas

### Q24. Holat va xabarlar kimga boradi (karta-model)
**Nima:** Mashina to'xtashi, anomaliya, texnik xizmat eslatmasi — qaysi lavozim kartasiga (operator / mexanik / sex boshlig'i) boradi.
**Nega kerak:** Karta-modelda har xabar to'g'ri kartaga borishi kerak — javobgarlik aniq bo'ladi (notog'ri odamga borsa e'tiborsiz qoladi).
**Variantlar:**
- A) Xabar turi bo'yicha kartaga marshrutlanadi (anomaliya→mexanik, uzun to'xtash→sex boshlig'i) — vizyonga mos
- B) Hammasi bitta umumiy guruhga boradi — sodda, lekin javobgarlik tarqoq
- C) Keyin — hozir kerak emas

### Q25. Mashina samaradorligini kartaga bog'lash (GSD)
**Nima:** Mashina uptime/OEE ko'rsatkichi shu mashinaga mas'ul operator/mexanik kartasining GSD natijasiga kirishi.
**Nega kerak:** Karta-modelda natija lavozimga bog'lanadi — operator o'z mashinasi samaradorligi uchun javob beradi.
**Variantlar:**
- A) Mashina OEE/uptime → operator/mexanik kartasi GSD'ga avtomatik kiradi — vizyonga to'liq mos
- B) Faqat mashina darajasida qoladi, kartaga bog'lanmaydi — ko'rsatkich bor, javobgarlik yo'q
- C) Keyin — hozir kerak emas

### Q26. Defekt/sifat muammosini mashinaga bog'lash
**Nima:** Sifat nazorati topgan defektni qaysi mashina/smena chiqarganini IoT ma'lumoti orqali bog'lash.
**Nega kerak:** Qaysi mashina ko'p brak chiqarayotganini bilish — sozlash yoki ta'mir kerakligini ko'rsatadi.
**Variantlar:**
- A) Defekt → mashina + smena + vaqt avtomatik bog'lanadi (MES orqali) — sabab topiladi
- B) Defekt umumiy yoziladi, mashina ko'rsatilmaydi — sodda, lekin sababsiz
- C) Keyin — hozir kerak emas

### Q27. IoT smena hisoboti (avtomatik)
**Nima:** Har smena oxirida mashina bo'yicha avtomatik hisobot: ishlagan vaqt, to'xtashlar, chiqarilgan dona, defekt, energiya.
**Nega kerak:** Qo'lda hisobot yozish kerak emas — tizim o'zi tayyorlaydi, ShVB haftalik statistikasiga ulanadi.
**Variantlar:**
- A) Avtomatik smena hisoboti + sex boshlig'iga / Telegram'ga yuboriladi — qo'l ishi yo'q
- B) Faqat so'ralganda ekranda ko'rsatiladi — kerak bo'lsa qaraladi, faol emas
- C) Keyin — hozir kerak emas

### Q28. Telegram orqali IoT xabarlari (ShVB bot)
**Nima:** Mashina to'xtashi, anomaliya, texnik xizmat eslatmasi ShVB Telegram bot orqali mas'ul lavozimga yuborilishi.
**Nega kerak:** Hamma ERP'da o'tirmaydi — muhim signal Telegram'ga kelsa, javob tez bo'ladi.
**Variantlar:**
- A) Faqat muhim hodisalar (uzun to'xtash, anomaliya, ta'mir kerak) Telegram'ga — foydali, shovqinsiz
- B) Barcha hodisa Telegram'ga — to'liq, lekin ko'p xabar charchatadi
- C) Keyin — hozir kerak emas

### Q29. Mashinalar reestri (master-data)
**Nima:** Barcha mashinalar yagona ro'yxati: nomi, turi, inventar raqami, sexi, o'rnatish sanasi, mas'ul lavozim kartasi.
**Nega kerak:** IoT, texnik xizmat, defekt, energiya — hammasi shu yagona reestrga bog'lanadi; bo'lmasa har modul o'z ro'yxatini yasaydi.
**Variantlar:**
- A) Yagona mashinalar reestri — barcha IoT/ta'mir/sifat shunga bog'lanadi — yagona haqiqat manbai
- B) Har modul o'z ro'yxatini yuritadi — tez, lekin nomuvofiqlik chiqadi
- C) Keyin — hozir kerak emas

### Q30. Energiya iste'molini Finance bilan bog'lash
**Nima:** Energiya sarfi ma'lumoti moliya moduliga (xarajat/tannarx) o'tib, mahsulot tannarxiga qo'shilishi.
**Nega kerak:** Energiya — real pul; tannarxga kirsa, narx va foyda aniq hisoblanadi.
**Variantlar:**
- A) Energiya sarfi → tannarxga avtomatik qo'shiladi (Finance bilan ulanadi) — to'liq biznes ko'rinish
- B) Energiya alohida ko'rsatiladi, tannarxga kirmaydi — sodda, lekin chala
- C) Keyin — hozir kerak emas
