# Kanban / Vazifalar — YANGI (granular) vizyon savollari

Quyidagi savollar oldingi yuqori darajadagi savollardan KEYIN keladi. Maqsad — Kanban/Vazifalar moduli ichidagi aniq qoidalar, maydonlar, chegaralar, holatlar va chekka holatlarni (edge-case) belgilash. Har bir savolda birinchi variant — tavsiya etilgan.

---

## Bo'lim 1 — 3 savat (ustun) o'tish qoidalari

### Q1. Savatlar (ustunlar) ro'yxati va tartibi
**Nima:** Kanban taxtasida qaysi savatlar bo'ladi va ular qanday tartibda turadi.
**Nega kerak:** Savatlar nomi va tartibi butun fabrika uchun bir xil bo'lsa, har bo'lim bir tilda gaplashadi.
**Variantlar:**
- A) 3 savat: "Bajariladi" → "Jarayonda" → "Bajarildi" — sodda, hamma tushunadi
- B) 4 savat: "Yangi" → "Bajariladi" → "Jarayonda" → "Bajarildi" — yangi vazifa alohida ko'rinadi
- C) Keyin — hozir kerak emas

### Q2. Oldinga o'tish (savatdan savatga) kim huquqli
**Nima:** Vazifani bir savatdan keyingisiga kim surishi mumkin.
**Nega kerak:** Aks holda vazifa "Bajarildi"ga o'zboshimcha surilib, ish bo'lmagani holda yopiq ko'rinadi.
**Variantlar:**
- A) Faqat mas'ul xodim (ijrochi) suradi, "Bajarildi"ni esa boshliq tasdiqlaydi — nazorat saqlanadi
- B) Mas'ul xodimning o'zi hamma o'tishni qiladi — tez, lekin nazorat kam
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom/ko'rsatkich), Hisobotlar (bajarilgan vazifa soni)

### Q3. Orqaga qaytarish qoidasi (Jarayonda → Bajariladi)
**Nima:** Boshlangan vazifani yana orqaga (boshlanmagan holatga) qaytarish mumkinmi.
**Nega kerak:** Ba'zan ish noto'g'ri boshlanadi yoki to'xtaydi; orqaga qaytarish izsiz bo'lmasligi kerak.
**Variantlar:**
- A) Mumkin, lekin sabab yozish majburiy va tarixga yoziladi — shaffof
- B) Umuman mumkin emas (faqat oldinga) — qat'iy, lekin haqiqatga mos kelmasligi mumkin
- C) Keyin — hozir kerak emas

### Q4. "Bajarildi"dan qaytarib ochish (qayta ochish)
**Nima:** Yopilgan vazifani qayta ochish (masalan, ish sifatsiz bajarilgan bo'lsa).
**Nega kerak:** Boshliq tekshirganda ish yaroqsiz chiqsa, yangi vazifa ochmasdan eskisini qaytarish kerak.
**Variantlar:**
- A) Faqat boshliq qayta ochadi, sabab majburiy, "qayta ochildi" belgisi qoladi — javobgarlik aniq
- B) Hamma qayta ochishi mumkin — tez, lekin chalkashlik
- C) Keyin — hozir kerak emas

### Q5. Bir savatdan ikkitasini o'tkazib yuborish (sakrash)
**Nima:** "Bajariladi"dan to'g'ridan-to'g'ri "Bajarildi"ga sakrab o'tish mumkinmi.
**Nega kerak:** Jarayon savatini o'tkazib yuborsa, ishning qancha vaqt bajarilgani yo'qoladi.
**Variantlar:**
- A) Sakrash taqiqlanadi — vazifa albatta "Jarayonda"dan o'tadi (vaqt o'lchanadi)
- B) Sakrashga ruxsat — sodda, lekin tahlil uchun ma'lumot kam
- C) Keyin — hozir kerak emas

### Q6. "Jarayonda" savatiga o'tish sharti
**Nima:** Vazifani "Jarayonda"ga surishdan oldin nima talab qilinadi.
**Nega kerak:** Ijrochi belgilanmagan yoki muddat yo'q vazifa "boshlandi" deyilsa, keyin kim javobgarligi noaniq.
**Variantlar:**
- A) Ijrochi va muddat to'ldirilgan bo'lsa gina "Jarayonda"ga o'tadi — tartib
- B) Hech qanday shartsiz o'tadi — erkin, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q7. "Bajarildi"ga o'tish sharti (yopish dalili)
**Nima:** Vazifani yopishdan oldin natija/izoh/rasm talab qilinadimi.
**Nega kerak:** Quruq "bajarildi" yozuvi yolg'on bo'lishi mumkin; dalil talab qilinsa ishonch ortadi.
**Variantlar:**
- A) Kamida bitta izoh majburiy; ba'zi turlarda rasm yoki fayl majburiy — dalilli
- B) Hech narsa talab qilinmaydi — tez, lekin ishonchsiz
- C) Keyin — hozir kerak emas
  ↳ Agar A: qaysi vazifa turlarida rasm/fayl majburiy? Variantlar: 1) Sifat/ta'mirlash 2) Hammasi 3) Hech qaysi

### Q8. Bir vaqtning o'zida nechta vazifa "Jarayonda" bo'lishi mumkin (WIP chegarasi)
**Nima:** Bitta xodimda bir paytda nechta vazifa "Jarayonda" bo'lishi mumkinligi.
**Nega kerak:** Hammasini boshlab, hech birini tugatmaslik fabrikada keng tarqalgan muammo.
**Variantlar:**
- A) Bir paytda ko'pi bilan 3 ta "Jarayonda" — diqqat jamlanadi
- B) Cheklov yo'q — erkin, lekin chalg'ish
- C) Keyin — hozir kerak emas

### Q9. O'tish vaqtini avtomatik yozib borish
**Nima:** Har bir savatga o'tish vaqti (kun-soat-daqiqa) avtomatik saqlanadimi.
**Nega kerak:** "Qancha kutdi, qancha bajarildi" degan tahlil shu vaqtlarga tayanadi.
**Variantlar:**
- A) Har o'tish vaqti avtomatik yoziladi, qo'lda o'zgartirib bo'lmaydi — ishonchli tahlil
- B) Faqat yopilgan sana yoziladi — sodda, lekin tahlil zaif
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (bajarilish tezligi), HR (xodim faolligi)

---

## Bo'lim 2 — 24 soat eskalatsiya

### Q10. Eskalatsiya sababi (nima bo'lsa ko'tariladi)
**Nima:** Vazifa qaysi holatda "yuqoriga ko'tariladi" (eskalatsiya).
**Nega kerak:** Aniq sabab bo'lmasa, eskalatsiya har kuni ishlamay qoladi.
**Variantlar:**
- A) Vazifa muddati o'tib 24 soat bo'lsa-yu hali "Bajarildi"ga o'tmagan bo'lsa — aniq va sodda
- B) "Jarayonda"da 24 soat qotib qolsa (qo'l tegmasa) ham ko'tariladi — qattiqroq nazorat
- C) Keyin — hozir kerak emas

### Q11. 24 soat qanday sanaladi (ish vaqti yoki astronomik)
**Nima:** 24 soat to'xtovsiz sanaladimi yoki faqat ish soatlari hisoblanadimi.
**Nega kerak:** Dam olish kuni yoki tungi smenani hisobga olmaslik noto'g'ri eskalatsiya beradi.
**Variantlar:**
- A) Faqat ish vaqti sanaladi (smena jadvaliga ko'ra) — adolatli
- B) Astronomik 24 soat (dam olishni ham hisoblaydi) — sodda, lekin qattiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (smena jadvali), Ishlab chiqarish (3 smena)

### Q12. Eskalatsiya kimga boradi (ko'tarilish manzili)
**Nima:** 24 soat o'tgach vazifa kimga ko'rinadi/xabar boradi.
**Nega kerak:** Noto'g'ri manzil bo'lsa, xabar yo'qoladi yoki noto'g'ri odam bezovta bo'ladi.
**Variantlar:**
- A) Ijrochining bevosita boshlig'iga (org-strukturadagi keyingi yuqori daraja) — tabiiy zanjir
- B) To'g'ridan-to'g'ri bo'lim boshlig'iga — tez, lekin oraliq bo'g'in chetlab o'tiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id zanjiri), Bildirishnomalar

### Q13. Ikkinchi bosqich eskalatsiya (yana 24 soat)
**Nima:** Boshliq ham 24 soat ichida hech narsa qilmasa, keyingi daraja ko'tariladimi.
**Nega kerak:** Eskalatsiya bitta odamda qotib qolsa, ma'no qolmaydi.
**Variantlar:**
- A) Ha, yana 24 soatdan keyin keyingi yuqori darajaga ko'tariladi (zanjir bo'ylab) — uzilmas nazorat
- B) Yo'q, faqat bir marta ko'tariladi — sodda
- C) Keyin — hozir kerak emas
  ↳ Agar A: zanjir eng yuqorida (Owner/CEO) to'xtaydimi yoki aylanadimi? Variantlar: 1) CEO'da to'xtaydi 2) Owner'gacha boradi

### Q14. Eskalatsiya xabari qaysi kanaldan keladi
**Nima:** Ko'tarilish xabari qayerda ko'rinadi.
**Nega kerak:** ERP ichida turib qolgan xabarni hech kim ko'rmasligi mumkin.
**Variantlar:**
- A) ERP ichida + Telegram guruhga xabar — ikki joyda, e'tibordan chetda qolmaydi
- B) Faqat ERP ichida qizil belgi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya (Telegram), Bildirishnomalar

### Q15. Eskalatsiya hisobi (kim necha marta ko'tarilgan)
**Nima:** Har xodim bo'yicha "necha marta vazifasi eskalatsiyaga ketgan" hisobi yuritiladimi.
**Nega kerak:** Doimo kechiktiruvchi xodimni aniqlash uchun shu raqam kerak.
**Variantlar:**
- A) Ha, oylik hisobotda "eskalatsiya soni" ko'rsatkichi bo'ladi — intizom o'lchanadi
- B) Yo'q, faqat joriy holat — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom ko'rsatkichi), Oylik (KPI)

### Q16. Eskalatsiyani bekor qilish (noto'g'ri ko'tarilsa)
**Nima:** Boshliq "bu eskalatsiya o'rinsiz" deb yopib qo'yishi mumkinmi.
**Nega kerak:** Ba'zan vazifa haqiqatan kechikkan emas (mijoz kutmoqda); shunda yolg'on signal o'chirilishi kerak.
**Variantlar:**
- A) Boshliq sabab yozib yopadi, lekin tarixda qoladi — moslashuvchan, shaffof
- B) Bekor qilib bo'lmaydi — qat'iy
- C) Keyin — hozir kerak emas

### Q17. Muddati yo'q vazifa eskalatsiyaga tushadimi
**Nima:** Muddat (deadline) belgilanmagan vazifa nima bo'ladi.
**Nega kerak:** Muddatsiz vazifa "abadiy" ochiq qolishi mumkin.
**Variantlar:**
- A) Muddatsiz vazifa yaratilishiga yo'l qo'yilmaydi (muddat majburiy) — muammo ildizdan yo'qoladi
- B) Muddatsiz bo'lsa, yaratilgandan 7 kun o'tib avtomatik eskalatsiya — kafolat
- C) Keyin — hozir kerak emas

---

## Bo'lim 3 — Shaxsiy dastur (soatlik reja)

### Q18. Shaxsiy kunlik dastur nima asosida tuziladi
**Nima:** Har xodimning kunlik soatlik dasturi nimadan yig'iladi.
**Nega kerak:** Dastur Kanban vazifalari bilan bog'lanmasa, ikkita alohida ro'yxat bo'lib qoladi.
**Variantlar:**
- A) Kanban vazifalari + takrorlanuvchi odat ishlar avtomatik soatlarga taqsimlanadi — yagona manba
- B) Xodim qo'lda yozadi (Kanbandan ayro) — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (kunlik reja), Hisobotlar (reja vs fakt)

### Q19. Dastur qadami (vaqt oralig'i)
**Nima:** Soatlik dastur necha daqiqalik bo'laklarga bo'linadi.
**Nega kerak:** Juda mayda bo'lsa to'ldirish og'ir, juda yirik bo'lsa nazorat zaif.
**Variantlar:**
- A) 1 soatlik bo'laklar (08:00–09:00 ...) — sodda va yetarli
- B) 30 daqiqalik bo'laklar — aniqroq, lekin to'ldirish ko'p
- C) Keyin — hozir kerak emas

### Q20. Reja vs Fakt taqqoslash
**Nima:** Rejalashtirilgan soat va aslida bajarilgan soat solishtiriladimi.
**Nega kerak:** "Reja bor edi-yu bajarilmadi" degan tahlil shu yerdan chiqadi.
**Variantlar:**
- A) Ha, kun oxirida har bo'lakda "reja/fakt/farq" ko'rinadi — o'zini-o'zi nazorat
- B) Yo'q, faqat reja yoziladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), Oylik (KPI), Hisobotlar

### Q21. Dasturni kim tasdiqlaydi
**Nima:** Xodim tuzgan kunlik dasturni boshliq tasdiqlashi kerakmi.
**Nega kerak:** Tasdiqsiz dastur "o'ynab yozilgan" bo'lishi mumkin.
**Variantlar:**
- A) Ertalab boshliq bir qarab tasdiqlaydi (yoki o'zgartiradi) — yo'naltirish
- B) Tasdiqsiz, faqat xodimning o'zi yuritadi — erkin
- C) Keyin — hozir kerak emas

### Q22. Kutilmagan ish kirib qolsa (rejaga sig'masa)
**Nima:** Smena o'rtasida shoshilinch vazifa tushsa, dastur qanday o'zgaradi.
**Nega kerak:** Fabrikada doim "to'satdan" ish chiqadi; reja bunga moslashishi kerak.
**Variantlar:**
- A) Yangi vazifa rejaga qo'shiladi, siljigan ishlar avtomatik keyinga suriladi va belgilanadi — haqiqatga mos
- B) Reja qotib qoladi, qo'shimcha ish hisobga olinmaydi — sodda, lekin yolg'on
- C) Keyin — hozir kerak emas

### Q23. Bo'sh soatlar (rejada teshik)
**Nima:** Dasturda bo'sh qolgan soatlar ajralib ko'rinadimi.
**Nega kerak:** "Kun bo'yi nima qildi" savoliga bo'sh soatlar javob beradi.
**Variantlar:**
- A) Bo'sh soatlar sariq belgilanadi va sababini so'raydi — bo'shliq ko'rinadi
- B) Bo'sh soat oddiy ko'rinadi, hisob yuritilmaydi — sodda
- C) Keyin — hozir kerak emas

### Q24. Takrorlanuvchi kunlik ishlar (odat vazifalar)
**Nima:** Har kuni takrorlanadigan ishlar (masalan stanok tozalash) avtomatik dasturga tushadimi.
**Nega kerak:** Har kuni qo'lda yozish vaqt yo'qotadi va unutiladi.
**Variantlar:**
- A) Bir marta sozlanadi, har kuni avtomatik paydo bo'ladi — qulay
- B) Har kuni qo'lda qo'shiladi — sodda, lekin unutiladi
- C) Keyin — hozir kerak emas

### Q25. Dastur kun oxirida yopiladimi (kunlik yakun)
**Nima:** Kun tugaganda dastur "yopiladi" va o'zgarmas bo'lib qoladimi.
**Nega kerak:** Keyin tahrirlasa, reja/fakt tahlili ishonchsiz bo'ladi.
**Variantlar:**
- A) Kun yopilgach o'zgartirib bo'lmaydi (faqat ko'rish) — ishonchli tarix
- B) Keyin ham tahrirlash mumkin — erkin, lekin tahlil zaif
- C) Keyin — hozir kerak emas

---

## Bo'lim 4 — Vazifa kategoriyasi + ustuvorlik

### Q26. Vazifa kategoriyalari ro'yxati
**Nima:** Vazifa qaysi turlarga bo'linadi.
**Nega kerak:** Kategoriya bo'lmasa, hammasi bir uyumda va tahlil qilib bo'lmaydi.
**Variantlar:**
- A) Ishlab chiqarish / Sifat / Ta'mirlash / Ombor / Sotuv / Ma'muriy / Boshqa — fabrika tiliga mos
- B) Faqat "Ish" va "Shaxsiy" — juda sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (kategoriya kesimi), barcha modullar

### Q27. Ustuvorlik darajalari
**Nima:** Vazifa muhimligi qanday darajalarga bo'linadi.
**Nega kerak:** Hammasi "shoshilinch" bo'lsa, hech narsa shoshilinch bo'lmaydi.
**Variantlar:**
- A) 3 daraja: Shoshilinch / Oddiy / Past — sodda va yetarli
- B) 4 daraja (rang bilan: qizil/sariq/yashil/kulrang) — ko'rinarli
- C) Keyin — hozir kerak emas

### Q28. Ustuvorlikni kim belgilaydi
**Nima:** Vazifa muhimligini yaratuvchi belgilaydimi yoki boshliq.
**Nega kerak:** Har kim o'zini "shoshilinch" deb belgilasa, tartib buziladi.
**Variantlar:**
- A) Yaratuvchi taklif qiladi, boshliq tasdiqlaydi/o'zgartiradi — muvozanat
- B) Faqat yaratuvchi belgilaydi — tez, lekin suiiste'mol
- C) Keyin — hozir kerak emas

### Q29. "Shoshilinch" vazifa kunlik chegarasi
**Nima:** Bir kunda bitta odamga nechta "Shoshilinch" berish mumkin.
**Nega kerak:** Cheklovsiz bo'lsa, hamma vazifa "Shoshilinch" bo'lib ketadi.
**Variantlar:**
- A) Bir kunda ko'pi bilan 2 ta "Shoshilinch" — qadri saqlanadi
- B) Cheklov yo'q — erkin, lekin qadrsizlanadi
- C) Keyin — hozir kerak emas

### Q30. Ustuvorlik tartibi (Kanbanda joylashuv)
**Nima:** Savat ichida vazifalar qaysi tartibda tizilib turadi.
**Nega kerak:** Eng muhimi yuqorida turmasa, e'tibordan chetda qoladi.
**Variantlar:**
- A) Avtomatik: shoshilinch yuqorida, keyin muddati yaqinlari — o'zi tartiblanadi
- B) Qo'lda sudrab tartiblash — erkin, lekin chalkash
- C) Keyin — hozir kerak emas

### Q31. Kategoriyaga qarab mas'ulni avtomatik taklif qilish
**Nima:** Kategoriya tanlangach, tizim odatda kim bajarishini taklif qiladimi.
**Nega kerak:** "Ta'mirlash" doim usta Akmalga ketadigan bo'lsa, har safar qidirish shart emas.
**Variantlar:**
- A) Ha, kategoriya bo'yicha odatiy mas'ulni taklif qiladi (o'zgartirsa bo'ladi) — tez
- B) Yo'q, har safar qo'lda tanlanadi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura, AI Integratsiya

### Q32. Ustuvorlik muddatga ta'sir qiladimi
**Nima:** "Shoshilinch" belgilangan vazifaga avtomatik qisqa muddat qo'yiladimi.
**Nega kerak:** Shoshilinch deyilib, muddati bir hafta qo'yilsa, ma'no qolmaydi.
**Variantlar:**
- A) Shoshilinch → odatda shu kun oxiri muddat (o'zgartirsa bo'ladi) — izchil
- B) Muddat va ustuvorlik bir-biriga bog'liq emas — erkin
- C) Keyin — hozir kerak emas

---

## Bo'lim 5 — Bajarilmagan → ertaga (avtomatik ko'chirish)

### Q33. Kun oxirida bajarilmagan vazifa nima bo'ladi
**Nima:** Kun tugaganda yopilmagan vazifalar bilan tizim nima qiladi.
**Nega kerak:** Bajarilmagan ish yo'qolib ketmasligi va ertangi kunda ko'rinishi kerak.
**Variantlar:**
- A) Avtomatik ertangi kunga ko'chiriladi va "ko'chirilgan" belgisi qoladi — hech narsa yo'qolmaydi
- B) Joyida qoladi, "muddati o'tgan" bo'lib qizaradi — eslatadi, lekin ro'yxat to'lib ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Shaxsiy dastur (ertangi reja), Hisobotlar

### Q34. Necha marta ko'chirilganini sanash
**Nima:** Bitta vazifa necha kun ketma-ket ko'chgani hisoblanadimi.
**Nega kerak:** 5 kun surilib yurgan vazifa — yo muammoli, yo keraksiz; buni ko'rish kerak.
**Variantlar:**
- A) Ha, "3 marta ko'chirilgan" yozuvi ko'rinadi; 3 dan oshsa boshliqqa signal — ildizni topadi
- B) Sanalmaydi, shunchaki ko'chiriladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: 24-soat eskalatsiya, HR

### Q35. Ko'chirishda muddat o'zgaradimi
**Nima:** Ertaga ko'chgan vazifaning muddati avtomatik ertangiga suriladimi.
**Nega kerak:** Muddat eski qolib qizarib tursa, ro'yxat doim "qizil" bo'lib ko'zni o'rganadi.
**Variantlar:**
- A) Muddat ertangi kunga suriladi, lekin "asl muddat o'tgan" belgisi saqlanadi — haqiqat ham, yangilik ham
- B) Asl muddat o'zgarmaydi, qizil qoladi — qattiq nazorat
- C) Keyin — hozir kerak emas

### Q36. Qaysi vazifalar ko'chmaydi (istisno)
**Nima:** Ayrim vazifalar (masalan aniq sanaga bog'liq, mijoz topshirig'i) ko'chirilmasligi kerakmi.
**Nega kerak:** Mijozga 15-iyun deyilgan ishni 16-iyunga ko'chirish yolg'on bo'ladi.
**Variantlar:**
- A) Aniq sanaga bog'langan vazifalar ko'chmaydi, faqat eskalatsiyaga tushadi — to'g'ri signal
- B) Hammasi bir xil ko'chadi — sodda, lekin xato
- C) Keyin — hozir kerak emas

### Q37. Ko'chirish vaqti (qachon amalga oshadi)
**Nima:** Ko'chirish kun oxirida (smena tugagach) yoki ertasi ertalab bo'ladimi.
**Nega kerak:** Tungi smena bo'lsa "kun oxiri" tushunchasi har bo'limda farq qiladi.
**Variantlar:**
- A) Har bo'limning smena tugashiga moslab ko'chiriladi — adolatli
- B) Hamma uchun yarim tunda — sodda, lekin tungi smenaga noqulay
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (3 smena), HR (smena jadvali)

### Q38. Ko'chgan vazifa ertangi rejada qayerda turadi
**Nima:** Ertaga ko'chgan ish ertangi dasturda yuqoridami yoki yangi ishlar bilan teng.
**Nega kerak:** Kechikkan ish yangilardan oldin bajarilishi mantiqan to'g'ri.
**Variantlar:**
- A) Ko'chgan ish ertangi ro'yxatda yuqorida turadi — qarz birinchi yopiladi
- B) Hammasi teng tartibda — sodda
- C) Keyin — hozir kerak emas

### Q39. Ko'p marta ko'chgan vazifani avtomatik yopish/arxivlash
**Nima:** Masalan 10 kun ko'chib hech kim qo'l urmagan vazifa nima bo'ladi.
**Nega kerak:** Hech kimga kerak bo'lmagan vazifa ro'yxatni axlatga to'ldiradi.
**Variantlar:**
- A) 10 kundan oshsa boshliqqa "yopaylikmi?" so'rovi chiqadi — tozalik, lekin nazorat bilan
- B) Avtomatik o'zi yopiladi — toza, lekin xavfli
- C) Keyin — hozir kerak emas

---

## Bo'lim 6 — Kuzatuvchi (observer)

### Q40. Kuzatuvchi roli nima
**Nima:** Vazifaga "kuzatuvchi" sifatida qo'shilgan odam nima qila oladi.
**Nega kerak:** Ba'zan ishni bajarmaydigan, lekin xabardor bo'lishi kerak bo'lgan odam bor (masalan boshliq, qo'shni bo'lim).
**Variantlar:**
- A) Ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydi — aralashmasdan kuzatadi
- B) Hech narsa yoza olmaydi, faqat ko'radi — sof tomoshabin
- C) Keyin — hozir kerak emas

### Q41. Kuzatuvchini kim qo'shadi
**Nima:** Vazifaga kuzatuvchi qo'shish huquqi kimda.
**Nega kerak:** Har kim o'zini istalgan vazifaga qo'shsa, maxfiylik buziladi.
**Variantlar:**
- A) Yaratuvchi yoki mas'ul boshliq qo'shadi — nazorat
- B) Istalgan xodim o'zini qo'sha oladi — ochiq, lekin chalkash
- C) Keyin — hozir kerak emas

### Q42. Kuzatuvchiga qaysi o'zgarishlar haqida xabar boradi
**Nima:** Kuzatuvchi har bir mayda o'zgarishdami yoki faqat muhimlaridami xabardor bo'ladi.
**Nega kerak:** Har izohga xabar kelsa, kuzatuvchi xabarlarni o'chirib qo'yadi.
**Variantlar:**
- A) Faqat muhim hodisalar: yopildi, kechikdi, eskalatsiya — kerakli xabar
- B) Har bir o'zgarishda — to'liq, lekin shovqinli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Bildirishnomalar, AI Integratsiya (Telegram)

### Q43. Avtomatik kuzatuvchi (boshliq o'z-o'zidan kuzatuvchi bo'ladimi)
**Nima:** Xodimning boshlig'i uning vazifalariga avtomatik kuzatuvchi bo'lib qo'shiladimi.
**Nega kerak:** Boshliq qo'l ostidagilarning ishini ko'rib turishi tabiiy.
**Variantlar:**
- A) Ha, bevosita boshliq avtomatik kuzatuvchi (lekin xabar oqimini boshqaradi) — tabiiy nazorat
- B) Yo'q, faqat qo'lda qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id zanjiri)

### Q44. Kuzatuvchi sonining chegarasi
**Nima:** Bitta vazifaga nechta kuzatuvchi qo'shilishi mumkin.
**Nega kerak:** 20 kishi kuzatuvchi bo'lsa, vazifa "yig'ilish"ga aylanadi va javobgar yo'qoladi.
**Variantlar:**
- A) Ko'pi bilan 5 kuzatuvchi — yetarli va toza
- B) Cheksiz — erkin, lekin chalkash
- C) Keyin — hozir kerak emas

### Q45. Kuzatuvchi maxfiy vazifani ko'ra oladimi
**Nima:** Maxfiy belgilangan vazifaga kuzatuvchi qo'shilsa, mazmunni ko'radimi.
**Nega kerak:** Oylik, intizom yoki shaxsiy masalalar hammaga ochiq bo'lmasligi kerak.
**Variantlar:**
- A) Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi qo'shiladi, qolganlarga ko'rinmaydi — himoya
- B) Kuzatuvchi qo'shilsa hammasini ko'radi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (maxfiy masalalar), Xavfsizlik

### Q46. Kuzatuvchining @eslatma (mention) qilishi
**Nima:** Izohda kuzatuvchini yoki boshqa odamni @ belgi bilan chaqirib, xabar yuborish mumkinmi.
**Nega kerak:** "Bu yerga e'tibor ber" demoqchi bo'lganda aniq odamni chaqirish kerak.
**Variantlar:**
- A) Ha, @ bilan chaqirilgan odamga xabar boradi — aniq murojaat
- B) Yo'q, faqat umumiy izoh — sodda
- C) Keyin — hozir kerak emas

---

## Bo'lim 7 — Qo'shimcha aniqlik (maydonlar, holatlar, chekka holatlar)

### Q47. Vazifaning majburiy maydonlari
**Nima:** Vazifa yaratishda qaysi maydonlar to'ldirilishi shart.
**Nega kerak:** Bo'sh sarlavhali, mas'ulsiz vazifa keyin hech kimga foyda bermaydi.
**Variantlar:**
- A) Sarlavha + mas'ul + muddat + kategoriya majburiy; izoh ixtiyoriy — to'liq va yengil
- B) Faqat sarlavha majburiy — tez, lekin sifatsiz
- C) Keyin — hozir kerak emas

### Q48. Bitta vazifaga ko'p mas'ulmi yoki bitta
**Nima:** Vazifa bir kishiga biriktiriladimi yoki bir nechtasiga.
**Nega kerak:** "Hamma mas'ul" = "hech kim mas'ul emas" degani.
**Variantlar:**
- A) Bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi — javobgarlik aniq
- B) Bir nechta teng mas'ul — moslashuvchan, lekin javobgarlik tarqoq
- C) Keyin — hozir kerak emas

### Q49. Vazifani boshqa odamga o'tkazish (qayta biriktirish)
**Nima:** Mas'ul o'zgartirilsa, eski mas'ul va tarix qanday saqlanadi.
**Nega kerak:** "Men qilmadim, u qilishi kerak edi" degan chalkashlikni oldini olish kerak.
**Variantlar:**
- A) O'tkazishda sabab yoziladi, "X dan Y ga o'tdi" tarixda qoladi — shaffof
- B) Shunchaki mas'ul almashadi, tarix yo'q — sodda, lekin chalkash
- C) Keyin — hozir kerak emas

### Q50. Kichik vazifalar (kontrol ro'yxat / checklist)
**Nima:** Bitta vazifa ichida bajariladigan mayda qadamlar ro'yxati bo'ladimi.
**Nega kerak:** "Buyurtmani tayyorlash" ichida 5 ta qadam bo'lishi mumkin; har birini belgilab borish qulay.
**Variantlar:**
- A) Ha, vazifa ichida belgilanadigan checklist bo'ladi; hammasi belgilanmaguncha yopilmaydi — to'liq nazorat
- B) Yo'q, vazifa yaxlit — sodda
- C) Keyin — hozir kerak emas

### Q51. Vazifa bilan ishlab chiqarish buyurtmasini bog'lash
**Nima:** Kanban vazifasini aniq buyurtma yoki stanok bilan bog'lash mumkinmi.
**Nega kerak:** "Falon buyurtma uchun" deb bog'lansa, kechikish qaysi mijozga ta'sir qilishini ko'rsa bo'ladi.
**Variantlar:**
- A) Ixtiyoriy ravishda buyurtma/stanok/mijozga bog'lanadi — kuchli aloqa
- B) Bog'lash yo'q, vazifa mustaqil — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (buyurtma), Sotuv (mijoz), Hisobotlar

### Q52. Bekor qilingan vazifa holati (yopilgandan farqi)
**Nima:** "Bajarildi" bilan "Bekor qilindi" alohida holat bo'ladimi.
**Nega kerak:** Bajarilgan va keraksiz bo'lib bekor qilingan ishni bir xil sanash hisobotni buzadi.
**Variantlar:**
- A) Alohida "Bekor qilindi" holati, sabab majburiy — toza hisob
- B) Bekor ham "Bajarildi"ga kiradi — sodda, lekin chalg'itadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (haqiqiy bajarilish foizi)

### Q53. Vazifa izohlari va fayl biriktirish
**Nima:** Vazifaga rasm, fayl, ovozli xabar biriktirib bo'ladimi.
**Nega kerak:** Sifat nuqsoni yoki stanok buzilishini rasm bilan ko'rsatish so'zdan aniqroq.
**Variantlar:**
- A) Rasm + fayl + ovozli izoh biriktirsa bo'ladi — to'liq dalil
- B) Faqat matn izoh — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat nazorati (nuqson rasmi), Ombor (saqlash)

### Q54. Vazifa ko'rinishi (kim qaysi vazifani ko'radi)
**Nima:** Xodim faqat o'z vazifasinimi yoki butun bo'lim vazifalarini ko'radimi.
**Nega kerak:** Maxfiylik va e'tibor masalasi: hammaning hamma narsani ko'rishi shart emas.
**Variantlar:**
- A) Xodim o'zini + bo'lim ishlarini, boshliq butun bo'limni, yuqori daraja yuqoridan ko'radi — bosqichli
- B) Hamma hamma narsani ko'radi — ochiq, lekin maxfiylik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura, Xavfsizlik

### Q55. Telegramdan vazifa yaratish/yopish
**Nima:** Vazifani Telegram orqali ochish yoki yopish mumkinmi.
**Nega kerak:** Sex ichida yurgan usta ERP ochmasdan, Telegramdan tez harakat qilishi mumkin.
**Variantlar:**
- A) Telegramdan ochish/yopish/izoh qoldirish mumkin, ERP bilan sinxron — qulay
- B) Faqat ERP ichida — sodda, lekin sexga noqulay
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya (Telegram bot), Bildirishnomalar

---

## Bo'lim 8 — KITOB-GROUNDED savollar (2020-2022 zavod hujjatlari asosida)

> Manba: Оргполитика / Должностная инструкция / Производство 2026.xlsx / Заявка бумаги.xlsx.
> Ildizlar: НО-1/НО-2/НО-3 mas'ul shaxslar + vaqt-norma, kun-tartibi nazorati (tanaffus/tushlik/namoz aniq vaqtlari),
> ta'tilda vazifa topshirish, ishlab chiqarish buyurtma jadvali (Тираж/Дата готовности/Направление/Статус),
> operator-stansiya biriktiruvi, Заявка formalari. Bu savollar yuqoridagi 55 generic savolga TAKRORLANMAYDI.

### K1. НО-3 kun-yakuni hisoboti vazifaga aylanadimi
**Nima:** Kitobda "Аниқланган камчиликлар бўйича НО-3 га кун якунида хисобот тақдим этиш" — kun oxiri majburiy hisobot. Bu Kanbanda avtomat takrorlanuvchi kunlik vazifa bo'ladimi.
**Nega kerak:** Hisobot odat emas, tizim ichida iz qoldirsa — kim topshirdi, kim topshirmadi ko'rinadi.
**Variantlar:**
- A) Har ish kuni 17:30 da mas'ul savatiga "НО-3 kun-yakuni hisoboti" vazifasi avtomat tug'iladi, topshirilmasa ertasi qizil — intizom
- B) Faqat eslatma chiqadi, vazifa yaratilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya (doklad oqimi), HR intizom reytingi

### K2. Aniqlangan kamchilik → tuzatish vazifasi
**Nima:** НО-3 kun-tartibi nazoratida kamchilik aniqlanadi (kech tushlik, uzoq namoz, chekish). Har kamchilik avtomat "tuzatish vazifasi"ga aylanadimi.
**Nega kerak:** Kamchilik faqat hisobotda qolsa unutiladi; vazifaga aylansa kim, qachon tuzatishi ko'rinadi.
**Variantlar:**
- A) Aniqlangan kamchilik → aybdor xodim va boshlig'i savatiga "izoh ber / tuzat" vazifasi, 24h muddat — yopiq tsikl
- B) Faqat ro'yxat ko'rinadi, vazifa tug'ilmaydi
- C) Keyin — hozir kerak emas

### K3. Kun-tartibi vaqt-bloklarini shaxsiy dasturdan himoyalash
**Nima:** Kitobda aniq: tanaffus 10:00–10:20, 3-smenalik tushlik 12:00–13:30, poldnik 16:00–16:20, namoz vaqtlari (peshin 12:45, asr 18:00, shom 20:00). Bu bloklar shaxsiy dasturda "band" deb ko'rinib, ustiga vazifa qo'yib bo'lmaydimi.
**Nega kerak:** Vazifa rejalashtirilganda tushlik/namoz vaqtiga to'g'ri kelmasin — kun real to'lishini ko'rsatadi.
**Variantlar:**
- A) Bu vaqt-bloklar "qotirilgan band slot" sifatida ko'rinadi, ustiga vazifa qo'yilsa ogohlantiradi — real kun
- B) Faqat ko'rinadi, vazifa qo'yishni bloklamaydi
- C) Keyin — hozir kerak emas

### K4. 3-smenalik tushlik — smena bo'yicha avtomat slot
**Nima:** Tushlik 3 smenaga bo'lingan (har smenaga 30 daqiqa). Smenaning tushlik vaqti dasturga xodim smenasidan kelib chiqib avtomat qo'yiladimi.
**Nega kerak:** Har xodim o'z smena-tushligini bilishi, navbatdosh smenaga ish o'tkazishini rejalashtirishi uchun.
**Variantlar:**
- A) Smena bo'yicha tushlik avtomat dasturga tushadi, smena oxirida "keyingi smenaga o'tkaziladigan ish" so'raladi — uzluksizlik
- B) Tushlik faqat statik ko'rsatkich, ish o'tkazish so'ralmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (smena almashinuvi), HR

### K5. Ta'tilda vazifa topshirish (handover) majburiy bosqichmi
**Nima:** Kitob: "Ўз вақтида ўз вазифаларини ўзидан кейин вазифаларни бажарувчи ходимга ўтказилиши". Kanban ta'tilga chiqayotgan xodimning ochiq vazifalarini majburan o'rinbosarga o'tkazishni so'raydimi.
**Nega kerak:** "Бўлимни узлуксизлигини йўқолмаслиги" — kitobning aniq maqsadi.
**Variantlar:**
- A) Ta'til boshidan oldin ochiq vazifalar ro'yxati chiqadi, har biriga o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi — uzluksizlik
- B) Vazifalar o'tkazilmasa ham ta'til tasdiqlanadi, faqat eslatma
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (ta'til so'rovi), Koordinatsiya

### K6. O'rinbosarga o'tgan vazifa qaytadimi
**Nima:** Ta'til tugagach o'rinbosarga o'tgan vazifa asl egasiga qaytadimi yoki o'rinbosarda qoladi.
**Nega kerak:** "Bu mening ishim emas endi" deb tashlab ketilmasligi yoki ikki marta bajarilmasligi uchun.
**Variantlar:**
- A) Vaqtinchalik o'tkazma: ta'til davrida o'rinbosar mas'ul, qaytganda avtomat asl egaga qaytadi, oraliq harakat tarixda ko'rinadi — toza
- B) Butunlay o'tadi, qaytmaydi
- C) Keyin — hozir kerak emas

### K7. НО mas'ul-shaxs roli bo'yicha avtomat biriktiruv
**Nima:** Kitobda har harakatga mas'ul (НО-1, НО-2, НО-3, Менеджер секции ТХ, РД-4) yozilgan. Vazifa yaratilganda mas'ul roli bo'yicha avtomat biriktiriladimi.
**Nega kerak:** "Kimga beray" deb o'ylamasdan, jarayon qoidasi mas'ulni belgilashi uchun.
**Variantlar:**
- A) Jarayon shabloni tanlansa, har qadam НО-1/РД-4/ТХ ga avtomat biriktiriladi — qoida-asosli
- B) Har vazifaga qo'lda mas'ul tanlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (onboarding), Koordinatsiya (НО bo'lim)

### K8. Vazifaga standart norma-vaqt (НО jadvalidagi 30/20 daqiqa)
**Nima:** Kitobda har harakatga vaqt-norma bor (Sухбат 30 min, ТХ yo'riqnoma 20 min, buyruq chiqarish 30 min). Vazifa turiga standart norma-vaqt biriktiriladimi.
**Nega kerak:** Real ketgan vaqtni norma bilan solishtirib, qaysi xodim/bosqich sekin ekanini ko'rsatadi.
**Variantlar:**
- A) Har vazifa-turiga norma-vaqt master-data'da, bajarilgach norma/fakt solishtiriladi — o'lchanadigan
- B) Norma yo'q, faqat muddat bor
- C) Keyin — hozir kerak emas
⤳ Ta'sir: KPI/GSD, Ishlab chiqarish OEE

### K9. Jarayon-shablon (НО-1...РД-4 ketma-ketligi) = zanjir vazifa
**Nima:** Yangi xodim qabuli kitobda ketma-ket (suhbat → РД-4 → ТХ yo'riqnoma → buyruq). Bir vazifa yopilgach keyingisi avtomat ochiladigan "zanjir-vazifa" bo'ladimi.
**Nega kerak:** Bosqichlar tartibsiz bajarilmasligi, oldingisi tugamasdan keyingisi boshlanmasligi uchun.
**Variantlar:**
- A) Shablon = bog'langan qadamlar; oldingi yopilmaguncha keyingisi "qulflangan", yopilsa avtomat ochiladi — tartib
- B) Hamma qadam birvarakay ochiladi
- C) Keyin — hozir kerak emas

### K10. Mentor (Мураббий/устоз) kuzatuv-vazifasi
**Nima:** Kitobda yangi xodimga mentor (Мураббийинг фамилия исми, ўқиш муддати) biriktiriladi. Mentorga shogird ustidan kuzatuv-vazifasi tug'iladimi.
**Nega kerak:** Mentor mas'uliyati rasmiy bo'lishi, o'qish davri oxirida baho topshirishi uchun.
**Variantlar:**
- A) Mentorga "shogird kuzatuvi" vazifasi o'qish-muddati bilan ochiladi, oxirida "tayyormi/yo'q" baho so'raladi — rasmiy mentorlik
- B) Mentor faqat ko'rsatkich, vazifa yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (adaptatsiya), LMS (darslik)

### K11. Sinov muddati (синов муддати) → qaror taymeri
**Nima:** Kitobda sinov muddati davri belgilanadi. Tugashidan oldin "qaror qabul qilish" vazifasi avtomat tug'iladimi.
**Nega kerak:** Sinov muddati indamay o'tib ketmasligi, o'z vaqtida "qoldiramizmi/yo'q" qarori chiqishi uchun.
**Variantlar:**
- A) Sinov tugashiga 3 kun qolganda НО-1/boshliqqa "sinov yakuni qarori" vazifasi tug'iladi — o'tkazib yuborilmaydi
- B) Faqat HR kartasida sana ko'rinadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR

### K12. Ishlab chiqarish buyurtmasi Kanban kartaga aylanadimi
**Nima:** Производство 2026.xlsx da har buyurtma: Наименование заказа, Тираж, Дата готовности, Цена, Сумма, Статус. Bu Kanban taxtasida karta bo'lib ko'rinadimi.
**Nega kerak:** Excel qo'lda yuritiladi; taxtada bo'lsa har buyurtma holati real ko'rinadi, "Дата готовности" muddatini Kanban kuzatadi.
**Variantlar:**
- A) Har buyurtma = ishlab chiqarish taxtasida karta, "Дата готовности" = muddat, holat ustun bo'ylab siljiydi — Excel o'rniga jonli taxta
- B) Buyurtma alohida modulda qoladi, Kanban faqat vazifalar uchun
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (MES), Savdo, Ombor

### K13. Texnologik bosqichlar (Направление производства) taxta ustuni sifatida
**Nima:** Excelda bosqichlar: Флексо печать, Ротационная высечка, Резка, Ламинация, Сплошной/Трафаретный лак, Каширование, Автотигель, Тиснение, Конгрев, ФСМ, Ручная склейка, Окошка, Упаковка. Taxta ustunlari shu bosqichlar bo'lsinmi.
**Nega kerak:** Buyurtma qaysi bosqichda turganini ko'rsatadi — zavodning real oqimiga mos taxta.
**Variantlar:**
- A) Taxta ustunlari = real texnologik bosqichlar, karta bosqichma-bosqich o'tadi — zavod oqimi
- B) Faqat umumiy 4 status (Reja/Jarayonda/Tekshiruv/Tayyor)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (marshrut), Sifat (har bosqichda QC)

### K14. Тираж + bajarilgan/qolgan progress kartada
**Nima:** Excelda "Тираж" (nusxa soni) bor. Karta ustida tiraj va bajarilgan/qolgan miqdor ko'rinadimi.
**Nega kerak:** 10000 dan 7000 bajarildi — qancha qolgani ko'rinmasa, "jarayonda" so'zi yetarli ma'lumot bermaydi.
**Variantlar:**
- A) Kartada tiraj + progress-bar (7000/10000) — aniq holat
- B) Faqat tiraj raqami, progress yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish, Ombor (tayyor mahsulot)

### K15. "Сумма осталось" (qoldiq to'lov) buyurtma kartasida
**Nima:** Excelda Сумма / Сумма осталось (to'lov qoldig'i). Karta moliyaviy qoldiqni ko'rsatadimi.
**Nega kerak:** "Yetkazishdan oldin to'lov to'liqmi" savoli bir joyda ko'rinadi — savdo va ishlab chiqarish bog'lanadi.
**Variantlar:**
- A) Kartada to'lov holati ko'rinadi, qoldiq bo'lsa "Упаковка/Yetkazish" bosqichida ogohlantiradi — moliyaviy nazorat
- B) Moliya alohida modulda, kartada ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (debitor), Savdo, Eltib berish

### K16. Operator-stansiya biriktiruvi kartadan ko'rinadimi
**Nima:** Excelda har stansiyaga operator biriktirilgan (Тигель — Юлдашева, Упаковка Степлер — Холматов, Каширование — Шомансуров). Karta shu bosqichda kim ishlayotganini ko'rsatadimi.
**Nega kerak:** Buyurtma "Высечка"da tursa, qaysi operator mas'ulligini ko'rsatish — javobgarlik.
**Variantlar:**
- A) Karta joriy bosqichi bo'yicha biriktirilgan operatorni avtomat ko'rsatadi (stansiya-operator master-data'dan) — javobgarlik aniq
- B) Operator qo'lda tanlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (stansiya biriktiruvi), Ishlab chiqarish

### K17. Yordamchi (Ёрдамчи) roli kartada
**Nima:** Excelda Оператор bilan birga Ёрдамчи (Назирова, Усмонова, Холмирзаева) biriktiriladi. Karta-vazifada asosiy ijrochi + yordamchi roli ajratiladimi.
**Nega kerak:** Yordamchi ishladi, lekin GSD/baho kimga yoziladi degan savol aniq bo'lishi uchun.
**Variantlar:**
- A) Kartada "ijrochi" + "yordamchi" alohida rollar, har biriga hissa ulushi yoziladi — adolatli GSD
- B) Faqat bitta ijrochi, yordamchi yozilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: KPI/GSD, HR

### K18. Заявка (qog'oz/material so'rovi) → ta'minot vazifasi
**Nima:** Заявка бумаги.xlsx (qog'oz so'rovi: Наименование, Формат, Грам, Кг, Лист размер). Ishlab chiqarish boshlanishidan oldin material so'rovi avtomat ta'minotga vazifa bo'lib ketadimi.
**Nega kerak:** Material yetishmay ish to'xtamasligi uchun — so'rov vaqtida kelishi kerak.
**Variantlar:**
- A) Karta "Печать" bosqichiga yaqinlashganda kerakli qog'oz yo'q bo'lsa avtomat ta'minot savatiga "Заявка" vazifasi tug'iladi — uzluksiz ta'minot
- B) Заявка qo'lda yaratiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Ta'minot, Ishlab chiqarish

### K19. Buyurtma bekor qilinganda (Отменен) kartaga nima bo'ladi
**Nima:** Excelda Статус: Завершен / В процессе / Отменен. Bekor qilingan buyurtma kartasi taxtadan qanday chiqadi.
**Nega kerak:** Bekor qilingan ish "jarayonda" bo'lib taxtani to'ldirmasligi, lekin sababi tarixda qolishi uchun.
**Variantlar:**
- A) "Отменен" alohida holat, sabab majburiy, arxivga ketadi lekin hisobotda ko'rinadi — sababli iz
- B) Karta shunchaki o'chiriladi
- C) Keyin — hozir kerak emas

### K20. Дата готовности kechikishi eskalatsiyasi (savdoga ham)
**Nima:** Excelda har buyurtmaga "Дата готовности". Bu muddat o'tib ketsa kim ogohlantiriladi.
**Nega kerak:** Mijozga va'da qilingan muddat kechiksa — savdo va boshliq darrov bilishi kerak, mijoz qo'ng'irog'idan oldin.
**Variantlar:**
- A) Дата готовности o'tsa: ishlab chiqarish boshlig'i + savdo menejeriga avtomat xabar (mijozga aytishdan oldin biz bilamiz) — proaktiv
- B) Faqat karta qizil bo'ladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Savdo, CRM (mijoz)

### K21. "Примечание" (maxsus shart) karta yuzida
**Nima:** Excelda "Примечание" ustuni (Окошка bilan, Сплошной лак, Тиснение va h.k.). Karta ustida maxsus shart ko'rinib turadimi.
**Nega kerak:** Operatorlar maxsus shartni o'tkazib yubormasligi uchun karta yuzida turishi kerak.
**Variantlar:**
- A) Maxsus shart karta yuzida badge bo'lib turadi, bosqichdan o'tishda tasdiqlatadi — xatosizlik
- B) Izoh faqat karta ichida (ochib o'qiladi)
- C) Keyin — hozir kerak emas

### K22. Korporativ raqam berish (НО-2) jarayon-shabloni
**Nima:** Kitobda korporativ raqam berilganda НО-2 yo'riqnomadan o'tkaziladi va Инспекция bo'limi qo'ng'iroqlarni nazorat qiladi. Bu jarayon Kanban shabloni bo'lsinmi.
**Nega kerak:** Raqam berish, yo'riqnoma, nazorat bosqichlari izsiz qolmasligi uchun.
**Variantlar:**
- A) "Korporativ raqam berish" shabloni: raqam ber → НО-2 yo'riqnoma → Инспекция nazoratga qo'shildi — har qadam vazifa
- B) Qo'lda yuritiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, Inspeksiya/Hisobotlar bo'limi

### K23. Vazifa "лавозим папкаси" (lavozim-karta)ga bog'lanadimi
**Nima:** Kitobda оргполитика hujjatlari aniq lavozim papkalariga biriktirilgan. Vazifa qaysi lavozim-papkaga tegishliligi belgilanadimi.
**Nega kerak:** Karta-markazli vizyonda vazifa lavozimga bog'lansa, xodim o'zgarsa ham vazifa kartada qoladi.
**Variantlar:**
- A) Vazifa avval lavozim-kartaga, keyin xodimga ko'rinadi; xodim ketsa vazifa kartada qoladi — karta-markazli
- B) Vazifa to'g'ridan xodimga (lavozimsiz)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (karta model), HR

### K24. Vazifa toifasi seriya bo'yicha (Компания/Ташкилот/Производство)
**Nima:** Kitobda siyosatlar seriyalarga bo'lingan (Компания / Ташкилот / Производство). Vazifalar shu toifalarga ajratilsinmi.
**Nega kerak:** Hisobotda tashkiliy / ishlab chiqarish / kompaniya vazifalari ajralib turishi uchun.
**Variantlar:**
- A) Vazifa toifasi master-data, filtr va hisobot shu bo'yicha — tartibli
- B) Toifa yo'q, faqat bo'lim bo'yicha
- C) Keyin — hozir kerak emas

### K25. Оргполитика "Харакатлар детализацияси" → vazifa-shablon manbai
**Nima:** Har оргполитика "Харакатлар детализацияси" ro'yxati beradi. Bu to'g'ridan Kanban vazifa-shablonga aylantirilsinmi.
**Nega kerak:** Siyosat qog'ozda qolmasligi, har "harakat" real vazifaga aylanishi uchun.
**Variantlar:**
- A) Har оргполитика → vazifa-shablon (qadamlar + mas'ul + vaqt), siyosat e'lon qilinganda faollashadi — siyosat→ijro yopiq
- B) Siyosat faqat hujjat sifatida saqlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya, HR, butun zavod

### K26. Vazifaga "Тасаввурдаги мукаммал манзара" (kutilgan natija) maydoni
**Nima:** Har оргполитика oxirida "Тасаввурдаги мукаммал манзара" (ideal natija). Vazifaga "bajarilgach qanday natija bo'lishi kerak" maydoni qo'shilsinmi.
**Nega kerak:** "Bajardim" deyilganda natija kutilganga mosligini tekshirish uchun — sifat o'lchovi.
**Variantlar:**
- A) Har vazifaga "kutilgan natija" maydoni; tasdiqlovchi shunga qarab qabul qiladi — sifat darvozasi
- B) Faqat tavsif (natija maydonisiz)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat nazorati, KPI

### K27. Smena oxirida tugamagan buyurtmani keyingi smenaga estafeta
**Nima:** Zavod 3 smenada ishlaydi. Smena tugaganda boshlangan, lekin tugamagan buyurtma keyingi smenaga estafeta qilib o'tkaziladimi.
**Nega kerak:** Tungi smena kunduzgisi qoldirgan ishni topa olishi, "qayerda to'xtadi" ko'rinishi uchun.
**Variantlar:**
- A) Smena oxirida tugamagan kartalar keyingi smenaga "o'tkazma" ro'yxati bo'lib taqdim, qabul qiluvchi operator tasdiqlaydi — estafeta yopiq
- B) Karta o'sha joyda qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (smena), HR

### K28. Brak/qayta ishlash (Резка/Высечка xatosi) vazifaga aylanadimi
**Nima:** Bosqichlarda (Высечка, Резка, Каширование) brak chiqishi mumkin. Brak aniqlansa "qayta ishlash" vazifasi va sababi yoziladimi.
**Nega kerak:** Brak miqdori va sababi yo'qolmasligi, qayta ishlash kimga yuklanishi ko'rinishi uchun.
**Variantlar:**
- A) Bosqichda brak belgilansa: miqdor + sabab + "qayta ishlash" vazifasi, GSD/sifatga ulanadi — yo'qotish ko'rinadi
- B) Brak faqat sifat modulida, Kanbanga aloqasiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat nazorati, Ombor (chiqit), Ishlab chiqarish

### K29. Stansiya navbati (ochered) — kartalar tartibi
**Nima:** Bir stansiyada (ФСМ большой) bir nechta buyurtma navbatda turishi mumkin. Stansiya kartalarining navbat-tartibi ko'rinadimi.
**Nega kerak:** Qaysi buyurtmani avval qilishni operator o'zi emas, muddat/ustuvorlik belgilashi uchun.
**Variantlar:**
- A) Har stansiya ustunida kartalar Дата готовности + ustuvorlik bo'yicha avtomat saralanadi — adolatli navbat
- B) Operator qo'lda tartiblaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish rejasi (APS/CRP)

### K30. "Академияга" (ichki) buyurtmalar alohida oqimmi
**Nima:** Excelda "Академияга" alohida yo'nalish (ichki/o'quv buyurtmalari). Ichki buyurtmalar tashqi mijoz buyurtmalaridan ajratilsinmi.
**Nega kerak:** Ichki ish tashqi to'lovli buyurtma muddatini surib yubormasligi uchun.
**Variantlar:**
- A) Ichki ("Академия") va tashqi buyurtmalar belgi bilan ajraladi, tashqi to'lovli ustuvor — to'g'ri tartib
- B) Hammasi bir xil oqimda
- C) Keyin — hozir kerak emas

### K31. Kun boshida "bugungi reja"ni boshliqqa ko'rsatish
**Nima:** Kun-tartibi nazoratiga mos — xodim ish kuni boshida shaxsiy dasturini (bugungi rejani) boshlig'iga ko'rsatadimi/tasdiqlatadimi.
**Nega kerak:** Boshliq bo'ysunuvchining kuni real ishga to'lganini ko'rishi, bo'sh kun bo'lmasligi uchun.
**Variantlar:**
- A) Ertalab xodim "bugungi reja"ni tasdiqlaydi, boshliq ko'radi (faqat ko'rish) — shaffof
- B) Boshliq tasdiqlashi shart (reja roziligi bilan boshlanadi)
- C) Reja shaxsiy, boshliq ko'rmaydi
- D) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya, HR intizom

### K32. Deadline cho'zish (muddat surish) tasdiqlanadimi
**Nima:** Xodim vazifa muddatini o'zi surib qo'ya oladimi yoki boshliq tasdig'i kerakmi.
**Nega kerak:** Muddatni cheksiz surish intizomni buzadi; obyektiv sabab bo'lsa surish kerak — kim ruxsat berishi aniq bo'lsin.
**Variantlar:**
- A) Boshliq bergan vazifa muddatini surish boshliq tasdig'i bilan (sabab yoziladi); o'z vazifasini o'zi suradi — balans
- B) Hech kim mustaqil sura olmaydi
- C) Har kim o'zi suradi (tasdiqsiz)
- D) Keyin — hozir kerak emas

### K33. Vazifani "qaytarish" (men bajarmayman) — sabab bilan
**Nima:** Xodim qabul qilgan vazifani keyinchalik "men bu ishni qila olmayman" deb qaytara oladimi.
**Nega kerak:** Noto'g'ri yuborilgan yoki imkonsiz vazifa muzlab qolmasligi uchun.
**Variantlar:**
- A) Qaytarish mumkin (sabab majburiy), bergan odamga qaytadi va u qayta yo'naltiradi — tirik oqim
- B) Qaytarib bo'lmaydi
- C) Keyin — hozir kerak emas

### K34. Shoshilinch belgisini kim qo'ya oladi (НО tartibiga mos)
**Nima:** "Срочно" belgisini kim qo'ya oladi — har kimmi yoki faqat boshliqmi.
**Nega kerak:** Hamma o'z ishini "shoshilinch" qilsa, belgi ma'noni yo'qotadi.
**Variantlar:**
- A) Shoshilinch belgisini faqat boshliq/topshiriq beruvchi qo'yadi — belgi qadrli qoladi
- B) Har kim o'ziga qo'ya oladi
- C) Keyin — hozir kerak emas

### K35. Maxfiy vazifa (inspeksiya/qoidabuzarlik) — kim ko'radi
**Nima:** Inspeksiya tekshiruvi yoki qoidabuzarlik vazifalari faqat beruvchi va ijrochiga ko'rinsinmi.
**Nega kerak:** Maxfiy tekshiruv yoki shaxsiy masala ochiq taxtada turmasligi uchun.
**Variantlar:**
- A) "Maxfiy" belgisi: faqat beruvchi+ijrochi+boshliq ko'radi, taxtada ko'rinmaydi — maxfiylik
- B) Hamma vazifa ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Inspeksiya bo'limi, HR

### K36. Vazifa-shablonga forma/blank biriktirish (ariza/буйруқ/Заявка)
**Nima:** Kitobda har harakatga blank/forma (ariza, buyruq, Заявка) biriktirilgan. Shablonga kerakli forma-namuna avtomat biriktiriladimi.
**Nega kerak:** Xodim har gal "qaysi formani to'ldiraman" deb izlamasligi uchun.
**Variantlar:**
- A) Shablon vazifaga kerakli forma biriktirilgan keladi (Заявка, ariza, buyruq), to'ldirilib ilova qilinadi — tayyor namuna
- B) Forma alohida izlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hujjat aylanmasi, HR

### K37. Bosqich bog'liqligi (Ламинация Печать tugamasdan boshlanmaydi)
**Nima:** Ишлаб chiqarishda Ламинация Печать tugamaguncha boshlanmaydi. Vazifalar orasida "to'siq" (blocked by) ko'rsatiladimi.
**Nega kerak:** Operator oldingi bosqich tugamasdan keyingisini boshlab brak qilmasligi uchun.
**Variantlar:**
- A) Karta "X tugamaguncha bloklangan" deb ko'rsatiladi, X yopilsa avtomat ochiladi — to'g'ri ketma-ketlik
- B) Bog'liqlik ko'rsatilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish marshruti

### K38. Bajarilgach sifat-baho (НО tasdig'i bilan)
**Nima:** Bajarilgan vazifaga boshliq/tasdiqlovchi sifat bahosi (1-5) qo'yadimi.
**Nega kerak:** "Bajarildi" yetarli emas — qanchalik yaxshi bajarilgani GSD/reytingga ta'sir qilishi uchun.
**Variantlar:**
- A) Yopilishda ixtiyoriy sifat-baho (1-5) + izoh, GSD ga o'rtacha bo'lib ulanadi — sifat o'lchovi
- B) Baho yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: KPI/GSD, HR reyting

### K39. Bo'lim taxtasining kunlik "летучка" ko'rinishi
**Nima:** Koordinatsiyada kunlik yig'ilish (летучка). Bo'lim taxtasining "bugun nima qilamiz / kim qayerda turibdi" ko'rinishi yig'ilishda ekranga chiqadimi.
**Nega kerak:** Yig'ilishda har kim og'zaki aytmasdan, taxtaga qarab kunni rejalashtirishi uchun.
**Variantlar:**
- A) Taxtada "летучка rejimi": bugungi vazifalar + kechikkanlar + bloklarni bir ekranda — yig'ilish vositasi
- B) Maxsus rejim yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya (yig'ilish)

### K40. @xabar vs @so'rov farqi
**Nima:** Izohda kimnidir @belgilash unga shunchaki xabar beradimi yoki undan javob/harakat talab qiladimi.
**Nega kerak:** @belgilash "ko'rib qo'y" ham, "javob ber" ham bo'lishi mumkin — farqlanmasa savatga aralashma tushadi.
**Variantlar:**
- A) Ikki xil: "@xabar" (faqat o'qish) va "@so'rov" (savatga vazifa tushadi, javob talab) — toza farq
- B) Har @belgilash bir xil
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya, savatlar

### K41. Hayfa/ogohlantirish (взыскание) yozma iz
**Nima:** Kun-tartibi qoidabuzarligida hayfa beriladi. Hayfa/ogohlantirish vazifa-iz sifatida qoladimi (kim, qachon, nima uchun).
**Nega kerak:** Hayfa og'zaki qolmasligi, takrorlansa ko'rinishi (uch marta = boshqa qaror) uchun.
**Variantlar:**
- A) Hayfa = yozma iz (sabab+sana), takrorlanishi sanaladi, HR kartasiga ulanadi — adolatli va kuzatiladigan
- B) Hayfa faqat og'zaki
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), KPI

### K42. Mijoz buyurtmasi o'zgargach (Тираж/muddat) kartaga ta'sir
**Nima:** Mijoz tirajni yoki muddatni o'zgartirsa, ishlab chiqarish kartasi avtomat yangilanadimi va ogohlantiradimi.
**Nega kerak:** Eski tiraj bo'yicha ishlab brak chiqmasligi; o'zgarish operatorga yetib borishi uchun.
**Variantlar:**
- A) Savdoda buyurtma o'zgarsa karta avtomat yangilanadi + joriy operator ogohlantiriladi (boshlangan bo'lsa tasdiq so'raladi) — drift yo'q
- B) Karta qo'lda yangilanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Savdo, Ishlab chiqarish

### K43. Tayyor mahsulot (Упаковка) → ombor/yetkazish vazifasi
**Nima:** Buyurtma "Упаковка" bosqichini tugatgach, avtomat ombor qabul + yetkazish vazifasi tug'iladimi.
**Nega kerak:** Tayyor mahsulot taxtada "tayyor" bo'lib qotib qolmasligi, darrov ombor/logistika oqimiga o'tishi uchun.
**Variantlar:**
- A) "Упаковка" yopilsa: ombor qabul vazifasi + (to'lov to'liq bo'lsa) Eltib berish vazifasi avtomat tug'iladi — yopiq oqim
- B) Qo'lda omborga topshiriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Eltib berish, Moliya (to'lov sharti)

### K44. Karta rangi mahsulot turi bo'yicha (5х слой/2х слой/гофра/картон)
**Nima:** Excelda mahsulot turlari (5х слой, 2х слой, гофра, картон). Karta rangi/teg mahsulot turini ko'rsatadimi.
**Nega kerak:** Operator taxtaga qarabla qaysi turdagi ish ko'pligini, o'z stansiyasiga tegishlisini ajratishi uchun.
**Variantlar:**
- A) Karta mahsulot-turi bo'yicha rang/teg oladi, taxtada tur bo'yicha filtr — tez ajratish
- B) Rang faqat ustuvorlik uchun
- C) Keyin — hozir kerak emas

### K45. Qadam norma-vaqtdan oshsa eskalatsiya (НО 30/20 daqiqa)
**Nima:** Kitobda har qadamga vaqt-norma (30 min, 20 min). Qadam belgilangan vaqtdan oshsa keyingi mas'ul yoki boshliqqa o'tadimi.
**Nega kerak:** Bir qadamda ish qotib qolmasligi (ТХ yo'riqnoma 20 daqiqa o'rniga 2 kun) uchun.
**Variantlar:**
- A) Qadam norma-vaqtdan oshsa avtomat boshliqqa ko'rinadi/eslatma — qotib qolish ko'rinadi
- B) Faqat umumiy muddat hisoblanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Koordinatsiya, jarayon-shablonlar

### K46. Arxivdan takror muammo aniqlash (naqsh)
**Nima:** Tugagan/bekor qilingan vazifalar arxivida takrorlanuvchi muammolar (har hafta bir xil brak, bir xil kechikish) aniqlanadimi.
**Nega kerak:** Yakka holatlar emas, naqsh ko'rinsa ildizini tuzatish mumkin — "muammo takrorlanmasin" tamoyili.
**Variantlar:**
- A) Arxivdan takrorlanuvchi sabab/brak naqshlari oylik hisobotda ko'rsatiladi (AI yordamida) — ildizga ishlash
- B) Arxiv faqat qidiruv uchun
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat nazorati, AI-tahlil, KPI

### K47. Vazifa lavozimga beriladimi (ism emas)
**Nima:** Vazifa berishda "Холматов Муродиллога" emas, "Упаковка Степлер operatoriga" deb lavozimga beriladimi.
**Nega kerak:** Karta-markazli vizyon: ish lavozimga tegishli; xodim almashsa vazifa adresi buzilmaydi.
**Variantlar:**
- A) Vazifa lavozim-kartaga beriladi, joriy egasi avtomat oladi; bo'sh karta bo'lsa boshliqqa tushadi — barqaror adres
- B) Vazifa to'g'ridan ismga (xodimga)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (karta model), HR

### K48. Stansiya kunlik norma — smenaviy plan-fakt
**Nima:** Stansiyaga kunlik norma (ФСМ kuniga N nusxa) belgilanib, smena oxirida plan-fakt ko'rsatiladimi.
**Nega kerak:** Operator kunlik maqsadni bilishi, smena yakunida bajardimi-yo'qmi ko'rinishi uchun — GSD asosi.
**Variantlar:**
- A) Har stansiyaga kunlik norma; taxtada "bugun: 6000/8000" plan-fakt; smena yakunida hisobot — o'lchanadigan
- B) Norma yo'q (faqat buyurtma muddati)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (OEE), KPI/GSD, ish haqi

### K49. Vazifa-vaqt logi (boshladim/tugatdim) — normaga taqqos
**Nima:** Xodim vazifa ustida qancha vaqt ishlaganini (start/stop) qayd qiladimi.
**Nega kerak:** Norma-vaqt (K8) bilan solishtirish va real bandlikni o'lchash uchun.
**Variantlar:**
- A) Ixtiyoriy "boshladim/tugatdim" tugmasi vaqtni yozadi, normaga taqqoslanadi — o'lchanadigan, majburlamasdan
- B) Majburiy vaqt-tracking
- C) Vaqt yozilmaydi
- D) Keyin — hozir kerak emas
⤳ Ta'sir: KPI/GSD, ish haqi (vaqtbay)

### K50. Texnika xavfsizligi (ТХ) yo'riqnoma — takrorlanuvchi vazifa
**Nima:** Kitobda "Техника хавфсизлиги бўйича йўриқномадан ўтиш — Менеджер секции ТХ, 20 минут". Davriy (qayta) ТХ yo'riqnoma takrorlanuvchi vazifa bo'lsinmi.
**Nega kerak:** ТХ yo'riqnoma bir marta emas, davriy o'tishi kerak — o'tmaganlar ko'rinishi uchun.
**Variantlar:**
- A) Har stansiya operatoriga davriy "ТХ yo'riqnoma" vazifasi (Менеджер секции ТХ mas'ul), o'tmaganlar qizil ro'yxatda — xavfsizlik intizomi
- B) Faqat ishga kirishda bir marta
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (xavfsizlik), Ishlab chiqarish

### K51. Заявка bumagi miqdori (Кг/Лист размер) ombor qoldig'iga taqqos
**Nima:** Заявка бумаги.xlsx da Грам/Кг/Лист размер bor. Заявка vazifasi yaratilganda so'ralgan miqdor ombor qoldig'i bilan avtomat solishtiriladimi.
**Nega kerak:** Ombor bor materialni qayta so'ramasligi, yetmasa darrov sotib olish vazifasi tug'ilishi uchun.
**Variantlar:**
- A) Заявка miqdori ombor qoldig'i bilan solishtiriladi: bor bo'lsa rezerv, yetmasa "sotib olish" vazifasi ta'minotga — uzluksiz
- B) Заявка faqat ro'yxat (ombor bilan bog'lanmaydi)
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Ta'minot

### K52. Operatorni stansiyaga biriktirish o'zgarsa vazifa adresi
**Nima:** Excelda operator-stansiya biriktiruvi qo'lda yoziladi (masalan Упаковка Степлер operatori almashishi mumkin). Biriktiruv o'zgarsa, o'sha stansiyadagi ochiq vazifalar yangi operatorga o'tadimi.
**Nega kerak:** Operator almashganda ish "egasiz" qolmasligi uchun.
**Variantlar:**
- A) Stansiya-operator biriktiruvi master-data; o'zgarsa o'sha stansiyadagi ochiq kartalar yangi operatorga avtomat ko'rinadi — egasiz qolmaydi
- B) Vazifalar qo'lda qayta biriktiriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, Ishlab chiqarish

DONE: Kanban / Vazifalar — 55 (generic) + 52 (kitob-grounded K1–K52).
