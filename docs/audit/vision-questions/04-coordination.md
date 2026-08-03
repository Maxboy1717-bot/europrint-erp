# Coordination — vizyon savollari

> EuroPrint Kokand — ShVB (Biznes Egasi Maktabi 2020) koordinatsiya tizimini ERP ga qo'shish bo'yicha egaga savollar.
> Maqsad: 5 kengash, Doklad, Rasporyajeniye, Majlis protokoli, Rek.Sovet sessiyasi va Prikazlar registrini qanday qilib qo'shishni hal qilish.
> Har savolda birinchi variant (A) — vizyonga eng mos tavsiya.

---

### Q1. 5 kengash ro'yxati (master-data)
**Nima:** Tizimda 5 ta kengash — Asoschilar kengashi, Ijroiya kengashi, Tavsiya kengashi (Rek.Sovet), Qomita (komitet), O'rinbosarlar kengashi — bitta rasmiy ro'yxat sifatida saqlanadi.
**Nega kerak:** Hozir kengashlar kodda qotirib qo'yilgan (hardcode). Ro'yxat alohida saqlansa, har kengashning a'zolari, vakolati va yig'ilish kuni boshqarib boriladi.
**Variantlar:**
- A) Beshtasi ham jadvalga yoziladi (har biri nomi, turi, tavsifi, faolligi bilan) — to'liq boshqariladi, yangi kengash qo'shsa bo'ladi
- B) Faqat 5 ta nom qotirib qoladi, qo'shimcha ma'lumotsiz — tez, lekin kengayib bo'lmaydi
- C) Keyin — hozir kerak emas

---

### Q2. Kengash a'zoligi va rollar
**Nima:** Har kengashga qaysi xodimlar a'zo ekani va ulardan kim raisi, kim kotibi ekanini belgilash.
**Nega kerak:** Doklad kimga boradi, protokolni kim imzolaydi, sessiyada kim qaror beradi — bularning hammasi a'zolik ro'yxatiga bog'liq.
**Variantlar:**
- A) Har kengashga a'zo + rol (rais/kotib/a'zo) biriktiriladi — aniq mas'uliyat, avtomatik yo'naltirish
- B) Faqat a'zolar ro'yxati, rolsiz — oddiy, lekin imzo/kotib qo'lda tanlanadi
- C) Keyin — hozir kerak emas

---

### Q3. Kengash a'zoligini karta-model bilan bog'lash
**Nima:** Kengash a'zoligi xodimga emas, uning lavozim kartasiga (org-karta) bog'lanadi.
**Nega kerak:** Sizning vizyoningizda karta asosiy, xodim ikkilamchi. Xodim ketsa, kartaga yangi odam kelsa — kengash a'zoligi avtomatik yangi odamga o'tadi, qo'lda o'zgartirish kerak bo'lmaydi.
**Variantlar:**
- A) A'zolik lavozim kartasiga bog'lanadi (kim shu kartada bo'lsa, o'sha a'zo) — karta-modelga to'liq mos
- B) A'zolik to'g'ridan-to'g'ri xodimga bog'lanadi — oddiy, lekin xodim almashganda qo'lda yangilash kerak
- C) Keyin — hozir kerak emas

---

### Q4. Doklad shakli (ShVB blank: Mavzu / Muammo / Natija / Taklif)
**Nima:** Doklad yozish shaklida ShVB standart maydonlari — Mavzu, Muammo, Natija (holat), Taklif — alohida bo'lib qoladimi yoki bitta erkin matn bo'ladimi.
**Nega kerak:** ShVB blankida bu 4 qism majburiy. Alohida maydonlar bo'lsa, dokladlar bir xil tuzilishda bo'ladi va tahlil qilish oson.
**Variantlar:**
- A) 4 maydon alohida (Mavzu/Muammo/Natija/Taklif) — ShVB blankiga aynan mos, tartibli
- B) Bitta erkin matn maydoni — yozish oson, lekin tuzilish yo'q
- C) Keyin — hozir kerak emas

---

### Q5. Doklad holatlari oqimi (status)
**Nima:** Doklad qaysi bosqichlardan o'tadi — yuborildi → o'qildi → hal qilindi → arxivlandi.
**Nega kerak:** Yuboruvchi dokladi o'qilganmi, hal qilinganmi — kuzata olishi kerak. Hozir bu oqim qisman bor.
**Variantlar:**
- A) To'liq oqim: Yuborildi → O'qildi → Hal qilindi → Arxiv — har bosqich vaqti bilan kuzatiladi
- B) Oddiy oqim: Ochiq → Yopiq — kam tafsilot, tez
- C) Keyin — hozir kerak emas

---

### Q6. Dokladni kengash darajasiga yo'naltirish
**Nima:** Doklad yuborilganda qaysi kengashga (5 tadan biriga) yoki to'g'ridan-to'g'ri rahbarga borishini tanlash.
**Nega kerak:** Masala kichik bo'lsa bo'lim boshlig'iga, katta bo'lsa Rek.Sovet yoki Ijroiya kengashiga ketishi kerak. To'g'ri manzil — tez yechim.
**Variantlar:**
- A) Yuboruvchi kengash darajasini tanlaydi, tizim a'zolarga yetkazadi — moslashuvchan
- B) Doklad har doim to'g'ridan-to'g'ri bitta rahbarga boradi — oddiy, lekin kengash mantiqi yo'q
- C) Keyin — hozir kerak emas

---

### Q7. Doklad yuborilganda bildirishnoma
**Nima:** Doklad yuborilganda qabul qiluvchiga (yoki kengash a'zolariga) xabar yetib borishi.
**Nega kerak:** Doklad tizimda yotib qolmasligi uchun qabul qiluvchi darrov bilishi kerak. ShVB da operativlik muhim.
**Variantlar:**
- A) Telegram + ilova ichida bildirishnoma — eng tez, ShVB Telegram kanaliga mos
- B) Faqat ilova ichida bildirishnoma — yetarli, lekin xodim ilovani ochmasa ko'rmaydi
- C) Keyin — hozir kerak emas

---

### Q8. Rasporyajeniye (buyruq) muddati va ustuvorligi
**Nima:** Rasporyajeniye berishda bajarish muddati (deadline) va ustuvorlik darajasi (yuqori/o'rta/past) ko'rsatiladi.
**Nega kerak:** Muddatsiz topshiriq nazoratdan chiqadi. Muddat va ustuvorlik bo'lsa, kechikkanlarni ajratib ko'rsatish mumkin.
**Variantlar:**
- A) Muddat majburiy + ustuvorlik tanlanadi — to'liq nazorat
- B) Faqat muddat, ustuvorliksiz — yetarli
- C) Keyin — hozir kerak emas

---

### Q9. Kechikkan Rasporyajeniye avtomatik belgilash
**Nima:** Muddati o'tgan rasporyajeniyeni tizim har kuni avtomatik "kechikkan" deb belgilaydi va rahbarni ogohlantiradi.
**Nega kerak:** Bajarilmagan topshiriqlar ko'zdan qochmasligi kerak. Avtomatik belgilash — rahbar har birini qo'lda tekshirmaydi.
**Variantlar:**
- A) Avtomatik (har kuni tekshiradi) + rahbarga ogohlantirish — nazorat o'zi ishlaydi
- B) Qo'lda — rahbar o'zi ko'rib belgilaydi — qo'shimcha mehnat
- C) Keyin — hozir kerak emas

---

### Q10. Rasporyajeniyeni qabul qilish va bajarish tasdig'i
**Nima:** Topshiriq oluvchi uni "qabul qildim" deb tasdiqlaydi, bajargach "bajardim" deb belgilaydi (izoh bilan).
**Nega kerak:** Topshiriq ko'rilganmi, bajarilganmi — yuboruvchi aniq bilishi kerak. Mas'uliyat zanjiri tiklanadi.
**Variantlar:**
- A) Qabul qildi → bajardi (izoh bilan) — ikki bosqichli, to'liq aniqlik
- B) Faqat bajardi — bir bosqichli, oddiy
- C) Keyin — hozir kerak emas

---

### Q11. Majlis protokoli — YANGI funksiya (qo'shilsinmi?)
**Nima:** Kengash majlislarining bayonnomasi (protokoli) — kun tartibi, ishtirokchilar, qabul qilingan qarorlar — tizimda saqlanadi.
**Nega kerak:** Hozir protokol umuman yo'q (faqat menyu yorlig'i bor). Qarorlar yozib qo'yilmasa, keyin "nima kelishilgani" yo'qoladi.
**Variantlar:**
- A) To'liq protokol moduli qo'shiladi (kun tartibi + ishtirokchilar + qarorlar + keyingi majlis sanasi) — rasmiy hujjat aylanmasi
- B) Faqat oddiy izoh maydoni (majlisda nima bo'lgani matn sifatida) — tez, lekin tuzilishsiz
- C) Keyin — hozir kerak emas

---

### Q12. Protokol PDF eksporti
**Nima:** Tayyor protokolni rasmiy ko'rinishda PDF qilib yuklab olish (zavod sarlavhasi, sana, imzo joyi bilan).
**Nega kerak:** Protokol qog'oz hujjat sifatida ham kerak bo'ladi (arxiv, imzo, tashqi tomonlar). PDF — rasmiy nusxa.
**Variantlar:**
- A) Ha, PDF eksport (zavod blanki ko'rinishida) — rasmiy hujjat tayyor
- B) Faqat ekranda ko'rish, eksport yo'q — yetarli emas, lekin tez
- C) Keyin — hozir kerak emas

---

### Q13. Protokol qarorlaridan topshiriq (action item) yaratish
**Nima:** Protokoldagi har qaror uchun mas'ul shaxs va muddat belgilab, undan to'g'ridan-to'g'ri Rasporyajeniye yaratish.
**Nega kerak:** Majlisda kelishilgan ish bajarilishini ta'minlash uchun qaror darrov topshiriqqa aylanishi kerak — "gapirdik va unutdik" bo'lmasin.
**Variantlar:**
- A) Har qarordan avtomatik Rasporyajeniye yaratiladi (mas'ul + muddat bilan) — qaror amalga oshadi
- B) Qarorlar faqat protokolda yoziladi, topshiriq qo'lda — bog'lanish yo'q
- C) Keyin — hozir kerak emas

---

### Q14. Protokol arxivida qidirish
**Nima:** Barcha o'tgan protokollarni kengash turi va sana bo'yicha qidirib topish.
**Nega kerak:** "O'tgan yili Ijroiya kengashida byudjet haqida nima kelishgandik?" degan savolga tez javob topish kerak.
**Variantlar:**
- A) Kengash turi + sana + matn bo'yicha qidiruv — har qarorni topish oson
- B) Faqat ro'yxat (qidiruv yo'q) — kam protokol bo'lsa yetarli
- C) Keyin — hozir kerak emas

---

### Q15. Rek.Sovet (Tavsiya kengashi) sessiyasi — ZVS ko'rib chiqish
**Nima:** Rek.Sovet haftalik sessiyasida bir nechta ZVS (byudjet arizasi) yig'ib ko'rib chiqiladi va har biri bo'yicha qaror beriladi.
**Nega kerak:** ShVB da Seshanba kuni Rek.Sovet ZVS larni ko'rib chiqadi. Hozir sessiyaning hayot-tsikli (qaror jurnali) yo'q.
**Variantlar:**
- A) To'liq sessiya: sessiya ochiladi → ZVS lar qo'shiladi → har biriga qaror → sessiya yopiladi + hisobot — ShVB ga aynan mos
- B) Har ZVS alohida tasdiqlanadi, sessiya tushunchasisiz — oddiy, lekin yig'ilish mantiqi yo'q
- C) Keyin — hozir kerak emas

---

### Q16. Rek.Sovet qarori: to'liq / qisman / rad
**Nima:** Sessiyada har ZVS bo'yicha qaror — to'liq tasdiqlash, qisman tasdiqlash (kamroq summa) yoki rad etish.
**Nega kerak:** Ko'pincha ariza summasi kamaytirilib tasdiqlanadi. Qisman tasdiq imkoni bo'lmasa, kengash haqiqiy ishlay olmaydi.
**Variantlar:**
- A) Uch xil qaror: to'liq / qisman (summa bilan) / rad — real qaror jarayoniga mos
- B) Faqat tasdiq / rad — oddiy, lekin qisman holat yo'qoladi
- C) Keyin — hozir kerak emas

---

### Q17. Rek.Sovet sessiyasidan oldin eslatma
**Nima:** Sessiya kunidan oldin (masalan Seshanba ertalab) kengash a'zolariga "bugun sessiya, X ta ZVS kutmoqda" deb avtomatik eslatma.
**Nega kerak:** A'zolar sessiyaga tayyor kelishi va arizalar kechikmasligi uchun. ShVB tsikliga mos operativlik.
**Variantlar:**
- A) Avtomatik eslatma (Telegram + ilova) sessiya kuni ertalab — a'zolar tayyor
- B) Eslatmasiz, a'zolar o'zlari biladi — kechikish xavfi
- C) Keyin — hozir kerak emas

---

### Q18. Rek.Sovet sessiya hisoboti
**Nima:** Sessiya yopilgach avtomatik hisobot — nechta ariza ko'rildi, qancha tasdiqlandi, qancha rad etildi, umumiy summa.
**Nega kerak:** Egaga va moliyaga haftalik qaysi xarajatlar tasdiqlangani aniq ko'rinishi kerak.
**Variantlar:**
- A) Avtomatik hisobot (tasdiqlangan/rad/jami summa) + protokolga bog'lanadi — to'liq shaffoflik
- B) Faqat ro'yxat, hisobotsiz — qo'lda hisoblash kerak
- C) Keyin — hozir kerak emas

---

### Q19. Prikazlar registri — kategoriyalar (master-data)
**Nima:** Rasmiy prikazlar (buyruqlar) qaysi turlarga bo'linadi — HR (kadrlar), Moliya, Operatsion, Strategik va h.k.
**Nega kerak:** Prikazlarni turkumlash arxivda topishni osonlashtiradi va kim qaysi turdagi prikazni ko'ra olishini boshqaradi.
**Variantlar:**
- A) Tayyor kategoriyalar ro'yxati (HR / Moliya / Operatsion / Strategik / Umumiy) — tartibli, kengaytirsa bo'ladi
- B) Kategoriyasiz, hammasi bitta ro'yxatda — oddiy, lekin tartibsiz
- C) Keyin — hozir kerak emas

---

### Q20. Prikaz raqamlash (registr nomeri)
**Nima:** Har prikazga avtomatik tartib raqami beriladi (masalan yil + ketma-ket nomer: 2026-001, 2026-002).
**Nega kerak:** Rasmiy hujjatda raqam majburiy. Avtomatik raqamlash — takror yoki bo'sh raqam bo'lmaydi.
**Variantlar:**
- A) Avtomatik (yil + ketma-ket nomer) — rasmiy va xatosiz
- B) Qo'lda kiritiladi — moslashuvchan, lekin takror/xato xavfi
- C) Keyin — hozir kerak emas

---

### Q21. Prikaz kuchga kirish sanasi (effective date)
**Nima:** Prikaz qaysi sanadan boshlab kuchga kirishini alohida ko'rsatish (chiqarilgan sanadan farqli bo'lishi mumkin).
**Nega kerak:** Ba'zi buyruqlar kelajakdagi sanadan kuchga kiradi (masalan keyingi oydan yangi narx). Hozir bu maydon yetishmaydi.
**Variantlar:**
- A) Ha, kuchga kirish sanasi alohida maydon — rejalashtirilgan buyruqlar to'g'ri ishlaydi
- B) Faqat chiqarilgan sana, kuchga kirish = o'sha kun — oddiy, lekin kechiktirib bo'lmaydi
- C) Keyin — hozir kerak emas

---

### Q22. Prikaz imzosi va imzolovchi
**Nima:** Prikaz kim tomonidan imzolanganini (egasi/direktor) yozib qo'yish va imzolanmaguncha "loyiha" holatida turishi.
**Nega kerak:** Imzosiz prikaz rasmiy emas. Imzo bosqichi bo'lsa, tayyorlanayotgan va kuchdagi prikazlar ajraladi.
**Variantlar:**
- A) Imzo bosqichi bor (Loyiha → Imzolandi → Kuchda) + imzolovchi yoziladi — rasmiy tartib
- B) Imzosiz, prikaz darrov kuchda — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

---

### Q23. Prikaz imzosi turi (elektron/qo'lda)
**Nima:** Imzo qanday bo'ladi — tizim ichida tugma bilan elektron tasdiqlanadimi yoki qog'ozga qo'lda imzolanib skani biriktiriladimi.
**Nega kerak:** Imzo usulini hal qilish kerak — bu prikazning yuridik kuchini va ish jarayonini belgilaydi.
**Variantlar:**
- A) Tizim ichida elektron tasdiq (kim, qachon bosgani yoziladi) — tez, raqamli arxiv
- B) Qog'ozga imzo + skanni biriktirish — an'anaviy, lekin qo'shimcha qadam
- C) Keyin — hozir kerak emas

---

### Q24. Prikaz PDF va arxiv
**Nima:** Har prikazni rasmiy PDF qilib yuklab olish va doimiy arxivda saqlash.
**Nega kerak:** Prikazlar yuridik hujjat — yillar davomida saqlanishi va istalgan vaqt chiqarib olinishi kerak. Hozir arxiv qismi yetishmaydi.
**Variantlar:**
- A) PDF eksport + doimiy arxiv (qidiruv bilan) — to'liq hujjat boshqaruvi
- B) Faqat ro'yxatda saqlanadi, PDF/arxivsiz — yetarli emas
- C) Keyin — hozir kerak emas

---

### Q25. Prikaz xodimga yetkazish (tanishtirish)
**Nima:** Prikaz tegishli xodimlarga yuboriladi va ular "tanishdim" deb tasdiqlaydi.
**Nega kerak:** Xodim prikazni o'qiganini tasdiqlamasa, "men bilmadim" deyishi mumkin. Tanishish tasdig'i — mas'uliyatni mahkamlaydi.
**Variantlar:**
- A) Prikaz xodimlarga yuboriladi + "tanishdim" tasdig'i yig'iladi — to'liq nazorat
- B) Faqat e'lon qilinadi, tasdiq yig'ilmaydi — oddiy, lekin isbot yo'q
- C) Keyin — hozir kerak emas

---

### Q26. Koordinatsiya boshqaruv paneli (umumiy ko'rinish)
**Nima:** Bitta sahifada — ochiq dokladlar, kutilayotgan rasporyajeniyelar, yaqin majlislar, kuchdagi prikazlar soni — yagona ko'rinishda.
**Nega kerak:** Rahbar bitta joydan butun koordinatsiya holatini ko'rishi kerak, har bo'limni alohida ochmasdan.
**Variantlar:**
- A) Yagona panel (5 ko'rsatkich + ochiqlari ro'yxati) — tezkor nazorat
- B) Har bo'lim alohida sahifada — soddaroq, lekin umumiy manzara yo'q
- C) Keyin — hozir kerak emas

---

### Q27. Eskalatsiya: bajarilmagan masalani yuqoriga ko'tarish
**Nima:** Doklad yoki rasporyajeniye belgilangan muddatda yopilmasa, avtomatik yuqori kengashga yoki rahbarga ko'tariladi.
**Nega kerak:** Masala bir joyda qotib qolmasligi kerak. ShVB da hal bo'lmagan masala yuqoriga chiqishi — boshqaruv printsipi.
**Variantlar:**
- A) Avtomatik eskalatsiya (org-tuzilma bo'yicha yuqoriga) — masala o'zi ko'tariladi
- B) Qo'lda eskalatsiya (rahbar o'zi ko'taradi) — nazorat ostida, lekin kechikadi
- C) Keyin — hozir kerak emas

---

### Q28. Org-tuzilma bilan yo'naltirish (vertikal zanjir)
**Nima:** Doklad/rasporyajeniye/eskalatsiya org-tuzilmadagi to'g'ri yuqori darajaga (Vysotskiy 7-otdeleniye zanjiri bo'yicha) yo'naladi.
**Nega kerak:** Sizning org-modelingizda har xodimning "keyingi yuqori darajasi" aniq. Koordinatsiya hujjatlari shu zanjir bo'yicha yursa, to'g'ri odamga boradi.
**Variantlar:**
- A) Org-tuzilma zanjiri bo'yicha avtomatik yo'naltirish — vizyonga to'liq mos
- B) Yuboruvchi har safar qo'lda manzilni tanlaydi — moslashuvchan, lekin xato xavfi
- C) Keyin — hozir kerak emas

---

### Q29. Telegram orqali koordinatsiya buyruqlari
**Nima:** Xodim Telegram botda "mening topshiriqlarim", "ochiq dokladlarim" kabi buyruqlar bilan koordinatsiya holatini ko'radi va tezkor javob beradi.
**Nega kerak:** Hamma kompyuter oldida o'tirmaydi. ShVB da Telegram asosiy kanal — operativlikni oshiradi.
**Variantlar:**
- A) Telegram buyruqlari (topshiriqlarim / dokladlarim / bajardim) — eng tezkor
- B) Faqat ilova ichida, Telegram orqali boshqaruv yo'q — kompyuter kerak
- C) Keyin — hozir kerak emas

---

### Q30. Karta-model: kengash hisoboti AI bilan
**Nima:** Har kengash/lavozim kartasiga biriktirilgan AI dokladlar va rasporyajeniyelar bo'yicha hisobot tayyorlaydi (kim ko'p kechiktiradi, qaysi masala takrorlanadi).
**Nega kerak:** Sizning vizyoningizda har kartaning o'z AI'si bor. Koordinatsiya ma'lumotlari ham shu AI tahliliga kirib, kartaga oid xulosa berishi mumkin.
**Variantlar:**
- A) Karta AI'si koordinatsiya hisobotini ham tahlil qiladi — vizyonga mos, chuqur tahlil
- B) Oddiy raqamli statistika (AI siz) — yetarli, lekin xulosasiz
- C) Keyin — hozir kerak emas
