# Org-struktura / KARTALAR — YANGI (granular) vizyon savollari

> Bu hujjat yuqori darajadagi vizyon savollaridan KEYIN keladi. Bu yerda mayda-chuyda
> tafsilotlar so'raladi: razryad ustunlari, ЦКП formulasi, i.o. tayinlash, karta
> ko'chirish/birlashtirish, audit-tarix, vakansiya muddati, import/eksport va h.k.
> Har bir savolda birinchi variant (A) — tavsiya etilgan.

---

## 1-bo'lim. RAZRYAD master-ma'lumotlari (ustunlar)

### Q1. Razryad jadvalida qaysi ustunlar bo'lsin
**Nima:** Har bir razryad (1-razryad, 2-razryad, ...) uchun saqlanadigan asosiy maydonlar ro'yxati.
**Nega kerak:** Razryad — oylik, talab va o'sishning poydevori. Maydonlar aniq bo'lmasa, har bo'limda har xil yoziladi.
**Variantlar:**
- A) Nom + tartib raqami + minimal talab + oylik bandi + imtihon turi + sertifikat shart-mi + tavsif — to'liq, bir marta sozlanadi
- B) Faqat nom + oylik bandi — sodda, lekin keyin yana qo'shishga to'g'ri keladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance/Payroll (oylik bandi), HR (imtihon), Ishlab chiqarish (talab)

### Q2. Razryad nomlash tizimi
**Nima:** Razryadlar qanday nomlanadi — raqamli (1-6) yoki nomli (Boshlovchi/O'rta/Usta) yoki ikkalasi.
**Nega kerak:** Karton zavodida ish turlari xilma-xil (mashinist, operator, naladchik); yagona tizim bo'lmasa taqqoslab bo'lmaydi.
**Variantlar:**
- A) Raqam + nom birga (masalan "4-razryad — Katta mashinist") — tushunarli, taqqoslasa bo'ladi
- B) Faqat raqam (1..6) — qisqa, lekin ma'nosi yo'q
- C) Keyin

### Q3. Razryad oylik bandi turi
**Nima:** Razryadga bog'langan oylik aniq summa-mi, yoki "dan-gacha" oraliq-mi, yoki koeffitsient-mi.
**Nega kerak:** Bitta razryadda ham tajribaga qarab oylik farq qilishi mumkin; tizim shuni qo'llashi kerak.
**Variantlar:**
- A) "Dan-gacha" oraliq (min–max) — moslashuvchan, real hayotga mos
- B) Aniq bitta summa — qattiq, adolatsizlik chiqishi mumkin
- C) Koeffitsient (bazaviy oylik × razryad koeffitsienti) — markazdan boshqarish oson
  - ⤳ Ta'sir: Finance/Payroll — oylik hisoblash formulasi shunga bog'lanadi
  - ↳ Agar A: oraliqning qayeriga qo'yish kim hal qiladi — bo'lim boshlig'i-mi, HR-mi? (variant: bo'lim boshlig'i taklif → HR tasdiq / faqat HR / avtomatik o'rta nuqta)

### Q4. Razryad imtihon turi
**Nima:** Razryadga ko'tarilish uchun qanday imtihon — nazariy test, amaliy sinov, ikkalasi, yoki komissiya bahosi.
**Nega kerak:** Razryad "shunchaki" berilmasligi, haqiqiy malaka bilan bog'lanishi kerak.
**Variantlar:**
- A) Nazariy test + amaliy sinov birga (ikkalasi o'tishi shart) — ishonchli
- B) Faqat komissiya bahosi (subyektiv) — tez, lekin tanish-bilishga ochiq
- C) Keyin
  - ⤳ Ta'sir: HR (imtihon jarayoni), AI (savol-banki — Q11)

### Q5. Sertifikat/litsenziya talabi
**Nima:** Ayrim kartalar uchun tashqi sertifikat shart bo'ladimi (masalan kran operatori, qozonxona, elektrik xavfsizlik guruhi).
**Nega kerak:** Sertifikatsiz odamni xavfli ishga qo'yish — jarima va baxtsiz hodisa xavfi.
**Variantlar:**
- A) Kartada "talab qilinadigan sertifikatlar" ro'yxati + amal qilish muddati saqlansin — xavfsizlik nazorati
- B) Faqat matnli izoh sifatida yozilsin — eslatma yo'q, nazoratsiz
- C) Keyin
  - ↳ Agar A: sertifikat muddati tugashidan necha kun oldin ogohlantirilsin? (30 / 60 / 14 kun)
  - ⤳ Ta'sir: HR (eslatma), Xavfsizlik moduli

### Q6. Razryad master-ma'lumotini kim o'zgartiradi
**Nima:** Razryad ustunlari (oylik bandi, talab) o'zgarishini tahrirlash huquqi kimda.
**Nega kerak:** Oylik bandi — pul; ruxsat keng bo'lsa, har kim o'zgartirib yuboradi.
**Variantlar:**
- A) Faqat HR boshlig'i + egasi (owner) tasdig'i bilan — qattiq nazorat
- B) Har bo'lim boshlig'i o'z bo'limi razryadini o'zgartiradi — tez, lekin tarqoq
- C) Keyin
  - ⤳ Ta'sir: Audit-tarix (Q19), Finance

---

## 2-bo'lim. ЦКП (ish natijasi) formulasi

### Q7. ЦКП o'lchov turi
**Nima:** Har kartaning ЦКП (foydali natija) qanday o'lchanadi — son, foiz, yoki vaqt bo'yicha.
**Nega kerak:** Mashinist uchun "ishlangan tonna", OTKchi uchun "brak foizi", logist uchun "o'z vaqtida yetkazish" — har xil o'lchov kerak.
**Variantlar:**
- A) Uch tur ham bo'lsin: SON (dona/tonna), FOIZ (%), VAQT (kun/soat) — kartaga moslab tanlanadi — to'liq
- B) Faqat SON — sodda, lekin ko'p ish turini qamramaydi
- C) Keyin
  - ⤳ Ta'sir: AI (kartaga baho beradi), Ishlab chiqarish (KPI)

### Q8. ЦКП hisoblash manbasi
**Nima:** ЦКП raqami qayerdan keladi — tizimdan avtomatik (ishlab chiqarish/ombor), qo'lda kiritiladi, yoki aralash.
**Nega kerak:** Qo'lda kiritilsa — soxtalashtirish xavfi; avtomatik bo'lsa — adolatli.
**Variantlar:**
- A) Iloji bo'lsa tizimdan avtomatik, bo'lmasa qo'lda (manba belgilanadi) — adolatli + amaliy
- B) Hammasi qo'lda — oson sozlash, lekin ishonchsiz
- C) Keyin
  - ⤳ Ta'sir: MES/Ishlab chiqarish, Ombor (manba bog'lanishi)

### Q9. ЦКП maqsadi (norma) qayerda turadi
**Nima:** Har kartaning ЦКП maqsadli qiymati (masalan "kuniga 5 tonna") kartada-mi, razryadda-mi, yoki xodimga shaxsiy-mi.
**Nega kerak:** Norma bo'lmasa, natijani "yaxshi/yomon" deb baholab bo'lmaydi.
**Variantlar:**
- A) Kartada standart norma + xodimga shaxsiy tuzatish (kerak bo'lsa) — moslashuvchan
- B) Faqat kartada bitta norma, hamma uchun bir xil — sodda, lekin tajribani hisobga olmaydi
- C) Keyin

### Q10. ЦКП oylikka ta'siri
**Nima:** ЦКП bajarilishi oylik/bonusga bog'lanadimi, va qanday.
**Nega kerak:** Egasining vizyoni — karta = to'g'ri ish ta'rifi; natija pulga bog'lanmasa, karta "qog'ozda" qoladi.
**Variantlar:**
- A) ЦКП % bajarilishi oylik ustiga bonus/ushlash sifatida bog'lanadi — rag'bat bor
- B) ЦКП faqat ko'rsatiladi, oylikka ta'sir qilmaydi — xavfsiz, lekin kuchsiz
- C) Keyin
  - ⤳ Ta'sir: Finance/Payroll — bu eng katta bog'lanish; aniq formula kerak
  - ↳ Agar A: ushlash (penalti) bo'ladimi yoki faqat bonus? (faqat bonus / bonus+ushlash / chegara: 80% dan past bo'lsa ushlash)

---

## 3-bo'lim. Razryad imtihon savol-banki

### Q11. Savol-bank tuzilishi
**Nima:** Razryad imtihoni savollari qayerda saqlanadi va qanday tuziladi.
**Nega kerak:** Har imtihonda yangidan savol yozish — vaqt isrofi; bank bo'lsa, qayta ishlatiladi.
**Variantlar:**
- A) Karta turi + razryad bo'yicha savol-bank (har savol: matn, variantlar, to'g'ri javob, qiyinlik) — qayta ishlatiladi
- B) Har imtihonni qo'lda yozish — moslashuvchan, lekin og'ir
- C) Keyin
  - ⤳ Ta'sir: AI (savol generatsiya/tekshirish), HR

### Q12. Imtihon savol manbasi
**Nima:** Savollar kim tomonidan yoziladi — usta/bo'lim boshlig'i, HR, yoki AI yordamida.
**Nega kerak:** Karton ishlab chiqarish texnik; savolni faqat HR yoza olmaydi, soha mutaxassisi kerak.
**Variantlar:**
- A) Bo'lim boshlig'i/usta yozadi + AI yordam beradi + HR tasdiqlaydi — sifatli
- B) Faqat AI generatsiya qiladi — tez, lekin xato xavfi
- C) Keyin

### Q13. O'tish chegarasi (ball)
**Nima:** Imtihondan o'tish uchun minimal ball necha foiz.
**Nega kerak:** Chegara aniq bo'lmasa, razryad berish subyektiv bo'ladi.
**Variantlar:**
- A) Har razryad uchun alohida chegara (masalan 1-3 razryad 60%, 4-6 razryad 75%) — adolatli
- B) Hamma uchun bitta chegara (70%) — sodda
- C) Keyin
  - ↳ Agar A: amaliy sinov ball nazariy bilan qanday qo'shiladi? (50/50 / amaliy ustun 70/30 / ikkalasi alohida o'tishi shart)

### Q14. Qayta topshirish qoidasi
**Nima:** Imtihondan yiqilgan odam qachon qayta topshira oladi.
**Nega kerak:** Cheksiz qayta topshirish — imtihonni bema'ni qiladi.
**Variantlar:**
- A) 14 kundan keyin, yiliga maksimal 3 marta — tartibli
- B) Istalgan vaqtda cheksiz — bo'sh nazorat
- C) Keyin

---

## 4-bo'lim. Karta shabloni (lavozim turi → standart kartochka)

### Q15. Karta shabloni mavjudligi
**Nima:** Yangi karta ochishda "lavozim turi" tanlansa, standart maydonlar (talab, razryad, ЦКП, darslik) avtomatik to'lsinmi.
**Nega kerak:** Har bir kartani noldan to'ldirish — yuzlab karta uchun og'ir; shablon vaqtni tejaydi.
**Variantlar:**
- A) Ha, lavozim turi bo'yicha shablon → karta avtomatik to'ladi, keyin tahrirlanadi — tez va bir xil
- B) Har kartani qo'lda to'ldirish — moslashuvchan, lekin sekin
- C) Keyin
  - ⤳ Ta'sir: HR (karta yaratish), AI

### Q16. Shablon o'zgarsa eski kartalar
**Nima:** Shablon yangilanganda, undan oldin yaratilgan kartalar avtomatik yangilanadimi.
**Nega kerak:** Shablonni tuzatib, eski kartalar eski qolsa — chalkashlik.
**Variantlar:**
- A) Yo'q, eski kartalar o'zgarmaydi; faqat "shablonga moslashtirish" tugmasi bilan ixtiyoriy — xavfsiz
- B) Ha, hamma karta avtomatik yangilanadi — xavfli, qo'lda tuzatishlar yo'qoladi
- C) Keyin

### Q17. Shablonlar ro'yxati boshlang'ich to'plami
**Nima:** Tizimga qaysi lavozim turi shablonlari oldindan kiritilsin (mashinist, operator, naladchik, OTKchi, logist, ombor mudiri, ...).
**Nega kerak:** Bo'sh tizimda har kim noldan boshlamasin; karton zavodiga mos shablonlar tayyor turishi kerak.
**Variantlar:**
- A) Zavodga xos to'plam tayyor kiritilsin (10-15 asosiy lavozim) — tez start
- B) Bo'sh boshlansin, o'zimiz qo'shamiz — moslashuvchan, lekin sekin
- C) Keyin

---

## 5-bo'lim. Vaqtinchalik i.o. (ijro etuvchi) tayinlash

### Q18. I.o. tayinlash mexanizmi
**Nima:** Asosiy odam yo'q bo'lganda (otpuska, kasal) kartaga vaqtinchalik i.o. qanday tayinlanadi.
**Nega kerak:** Ish to'xtamasligi va vertikalda kim javobgar ekani aniq bo'lishi uchun.
**Variantlar:**
- A) Kartaga muddatli i.o. (boshlanish–tugash sanasi bilan) tayinlanadi, muddat tugagach avtomatik qaytadi — aniq
- B) Qo'lda almashtiriladi, muddatsiz — chalkashlik xavfi
- C) Keyin
  - ⤳ Ta'sir: Coordination (vertikal — kim kimga hisobot beradi), Finance (i.o. ustamasi)

### Q19. I.o. davridagi oylik
**Nima:** I.o. bo'lib turgan odam o'z oyligini oladimi yoki kartaning oyligini, yoki ustama.
**Nega kerak:** Bu pul masalasi; oldindan kelishilmasa, nizo chiqadi.
**Variantlar:**
- A) O'z oyligi + i.o. ustamasi (% yoki summa) — adolatli, rag'batli
- B) Vaqtincha kartaning to'liq oyligini oladi — sodda, lekin asosiy odam qaytsa muammo
- C) Keyin
  - ⤳ Ta'sir: Finance/Payroll — ikki karta oylik to'qnashuvi (Q24 bilan bog'liq)

### Q20. I.o. huquqlari ko'lami
**Nima:** I.o. asosiy odamning hamma huquqini oladimi (tasdiqlash, hisobot, AI baho) yoki cheklangan.
**Nega kerak:** I.o. ga to'liq huquq berish — xavf; lekin juda cheklasa — ish to'xtaydi.
**Variantlar:**
- A) Kunlik operatsiyalar — ha, pul/kadr qarorlari — yo'q (yuqoriga eskalatsiya) — muvozanatli
- B) To'liq huquq — qulay, lekin xavfli
- C) Keyin

---

## 6-bo'lim. Karta ko'chirish / birlashtirish / bo'lish

### Q21. Kartani boshqa bo'limga ko'chirish
**Nima:** Bir karta (xodimi bilan) boshqa otdeleniye/bo'limga ko'chirilganda nima saqlanadi, nima o'zgaradi.
**Nega kerak:** Struktura o'zgaradi; ko'chirishda tarix yo'qolmasligi va vertikal to'g'ri ulanishi kerak.
**Variantlar:**
- A) Karta ko'chadi, butun tarix saqlanadi, yangi manager_id (yuqori daraja) avtomatik bog'lanadi — to'liq
- B) Yangi karta ochilib eski yopiladi — tarix uziladi
- C) Keyin
  - ⤳ Ta'sir: Coordination (vertikal qayta ulanish), Audit-tarix

### Q22. Ikki kartani birlashtirish
**Nima:** Ikki bir xil/ortiqcha karta bittaga birlashtirilsa, qaysi ma'lumot ustun bo'ladi.
**Nega kerak:** Dublikat kartalar paydo bo'ladi (masalan "Mashinist" ikki marta); birlashtirish qoidasi kerak.
**Variantlar:**
- A) Asosiy karta tanlanadi, ikkinchisining tarixi unga ko'chadi, ikkinchisi arxivlanadi — xavfsiz
- B) Biri o'chiriladi — ma'lumot yo'qoladi
- C) Keyin
  - ⤳ Ta'sir: Audit-tarix, Payroll (oylik tarixini birlashtirish)

### Q23. Bitta kartani ikkiga bo'lish
**Nima:** Bir karta ikki alohida ishga bo'linganda (masalan "Mashinist" → "Katta mashinist" + "Yordamchi"), eski tarix qanday taqsimlanadi.
**Nega kerak:** Ish hajmi o'sib, lavozim bo'linadi; bu tez-tez sodir bo'ladi.
**Variantlar:**
- A) Yangi ikki karta ochiladi, eski karta arxivga o'tadi, havola bilan bog'lanadi — kuzatiladi
- B) Eski karta qoladi + bittasi yangi ochiladi — yarim chalkashlik
- C) Keyin

### Q24. Bir odam ko'p kartada — oylik to'qnashuvi
**Nima:** Bir xodim ikki kartaga bog'langanda (masalan 0.5 stavka × 2), oylik qanday hisoblanadi.
**Nega kerak:** Egasi modeli — xodim kartaga bog'lansa oylik oladi; ikki karta bo'lsa, qaysi biri, qancha?
**Variantlar:**
- A) Har karta uchun stavka ulushi (0.5+0.5=1.0), oyliklar yig'iladi, jami 1.0 dan oshmasin — nazorat ostida
- B) Asosiy karta oyligi, ikkinchisi faqat ustama — sodda
- C) Keyin
  - ⤳ Ta'sir: Finance/Payroll — ikki manbadan oylik, jami nazorati shart
  - ↳ Agar A: jami stavka 1.0 dan oshsa tizim bloklasinmi yoki ogohlantirsinmi? (bloklash / ogohlantirish / owner ruxsati bilan ruxsat)

---

## 7-bo'lim. Karta audit-tarix

### Q25. Audit-tarixda nima saqlanadi
**Nima:** Kartadagi har o'zgarish (oylik, razryad, egasi, ЦКП) tarixga yozilsinmi va qaysi maydonlar.
**Nega kerak:** "Kim, qachon, nimani o'zgartirgan" bilinmasa — javobgarlik yo'q, nizoda dalil yo'q.
**Variantlar:**
- A) Har o'zgarish: maydon, eski qiymat, yangi qiymat, kim, qachon, sabab — to'liq audit
- B) Faqat oxirgi o'zgartiruvchi va sana — yengil, lekin tarix yo'q
- C) Keyin
  - ⤳ Ta'sir: Xavfsizlik, Finance (oylik o'zgarish dalili)

### Q26. O'zgarishga sabab majburiy-mi
**Nima:** Oylik yoki razryad o'zgartirilganda sabab (izoh) kiritish majburiy bo'lsinmi.
**Nega kerak:** Sababsiz oylik oshirish/tushirish — suiiste'mol manbai.
**Variantlar:**
- A) Pul/razryad o'zgarishida sabab majburiy, oddiy maydonlarda ixtiyoriy — muvozanatli
- B) Hech qachon majburiy emas — tez, lekin nazoratsiz
- C) Keyin

### Q27. Tarixni ko'rish huquqi
**Nima:** Karta audit-tarixini kim ko'ra oladi.
**Nega kerak:** Oylik tarixi — maxfiy; har kim ko'rmasligi kerak.
**Variantlar:**
- A) Owner + HR + o'sha vertikaldagi yuqori boshliq — cheklangan
- B) Hamma boshliq ko'radi — ochiq, maxfiylik yo'q
- C) Keyin
  - ⤳ Ta'sir: Xavfsizlik (ruxsatlar), HR

### Q28. Audit yozuvini o'chirib bo'lmasligi
**Nima:** Audit-tarix yozuvlari o'chirib/tahrirlab bo'lmaydigan (faqat qo'shiladigan) bo'lsinmi.
**Nega kerak:** Tarixni keyin "tozalab" qo'yish mumkin bo'lsa, audit ma'nosini yo'qotadi.
**Variantlar:**
- A) Ha, faqat qo'shiladi, hech kim o'chira/tahrirlay olmaydi — ishonchli
- B) Owner o'chira oladi — qulay, lekin xavfli
- C) Keyin

---

## 8-bo'lim. Vakansiya muddati / aging (bo'sh karta yoshi)

### Q29. Bo'sh karta holati
**Nima:** Xodimsiz (bo'sh) kartaga "vakansiya" holati va ochilgan sanasi qo'yilsinmi.
**Nega kerak:** Qaysi ishlar bajarilmay turibdi — egasi buni ko'rishi kerak.
**Variantlar:**
- A) Ha, bo'sh karta "Vakansiya" holatida + ochilgan sana + necha kun bo'sh — ko'rinadi
- B) Faqat "xodim yo'q" deb belgilansin, muddat yo'q — yarim ma'lumot
- C) Keyin
  - ⤳ Ta'sir: HR (rekruting), Dashboard

### Q30. Vakansiya aging bosqichlari
**Nima:** Bo'sh karta qancha turganiga qarab rang/holat o'zgarsinmi (yashil → sariq → qizil).
**Nega kerak:** 90 kun bo'sh turgan muhim ish — qizil signal bo'lishi kerak.
**Variantlar:**
- A) 0-14 kun yashil, 15-45 sariq, 45+ qizil + ogohlantirish — vizual nazorat
- B) Faqat raqam ko'rsatilsin, rang yo'q — sodda
- C) Keyin
  - ↳ Agar A: chegaralarni har bo'lim o'zi belgilaydimi yoki yagona-mi? (yagona / bo'lim sozlaydi)

### Q31. Vakansiya muhimligi (prioritet)
**Nima:** Har bo'sh kartaga muhimlik darajasi (kritik/o'rta/past) qo'yilsinmi.
**Nega kerak:** Hamma vakansiya bir xil shoshilinch emas; usta yo'qligi farroshdan muhimroq.
**Variantlar:**
- A) Ha, 3 daraja — to'g'ri yopilish tartibi
- B) Yo'q, hammasi teng — sodda, lekin noto'g'ri ustuvorlik
- C) Keyin

### Q32. Vakansiya yopilish muddati maqsadi
**Nima:** Vakansiya yopilishi uchun maqsadli muddat (SLA) belgilansinmi (masalan kritik — 14 kun).
**Nega kerak:** Maqsad bo'lmasa, HR vakansiyani cheksiz uzaytiradi.
**Variantlar:**
- A) Muhimlikka qarab maqsadli muddat (kritik 14, o'rta 30, past 60 kun) — javobgarlik
- B) Muddat yo'q — bo'sh nazorat
- C) Keyin

---

## 9-bo'lim. Karta import / eksport

### Q33. Kartalarni ommaviy import
**Nima:** Mavjud lavozimlar/kartalarni Excel orqali ommaviy yuklash imkoni bo'lsinmi.
**Nega kerak:** Yuzlab karta bittalab kiritilsa — haftalab vaqt ketadi.
**Variantlar:**
- A) Ha, Excel shabloni bilan import + xato satrlar ajratib ko'rsatiladi — tez
- B) Faqat qo'lda kiritish — sekin, lekin sodda
- C) Keyin
  - ⤳ Ta'sir: HR (dastlabki to'ldirish)

### Q34. Import xatolarini boshqarish
**Nima:** Import paytida xato satr bo'lsa (bo'sh oylik, noto'g'ri razryad) nima bo'ladi.
**Nega kerak:** Bitta xato butun importni to'xtatsa — foydasiz; xato yashirin o'tib ketsa — ifloslanish.
**Variantlar:**
- A) To'g'ri satrlar yuklanadi, xato satrlar ro'yxat bilan qaytariladi (tuzatib qayta yuklash) — amaliy
- B) Bitta xato bo'lsa hammasi rad etiladi — qattiq
- C) Keyin

### Q35. Karta eksport (zaxira/hisobot)
**Nima:** Kartalar ro'yxati Excel/PDF ga eksport qilinsinmi va qaysi ustunlar bilan.
**Nega kerak:** Egasi/HR ga umumiy ko'rinish, zaxira va tashqi ko'rib chiqish uchun.
**Variantlar:**
- A) Ha, tanlangan ustunlar bilan Excel + PDF — moslashuvchan
- B) Faqat to'liq Excel — sodda
- C) Keyin

### Q36. Import audit izi
**Nima:** Kim, qachon, qancha karta import/o'zgartirgani audit-tarixga yozilsinmi.
**Nega kerak:** Ommaviy import bilan ko'p ma'lumot kiradi; xato bo'lsa, kim qilganini bilish kerak.
**Variantlar:**
- A) Ha, import partiyasi alohida yoziladi (kim, qachon, fayl, satrlar soni) — kuzatiladi
- B) Yo'q — yengil, lekin javobgarlik yo'q
- C) Keyin

---

## 10-bo'lim. Karta qidiruv / filtr

### Q37. Filtr maydonlari
**Nima:** Kartalarni qaysi belgilar bo'yicha filtrlash mumkin bo'lsin.
**Nega kerak:** Yuzlab karta orasidan kerakligini topish uchun.
**Variantlar:**
- A) Otdeleniye/bo'lim + razryad + holat (band/bo'sh/i.o.) + lavozim turi + oylik oralig'i — to'liq
- B) Faqat nom bo'yicha qidiruv — sodda, lekin cheklangan
- C) Keyin

### Q38. "Bo'sh kartalar" tezkor filtri
**Nima:** Bir tugma bilan hamma bo'sh/vakansiya kartalarni ko'rsatish.
**Nega kerak:** Egasi "qaysi ishlar bajarilmayapti" ni darhol ko'rishi kerak.
**Variantlar:**
- A) Ha, tayyor filtr + aging bo'yicha saralash — qulay
- B) Yo'q, oddiy filtrdan foydalanish — kamroq qulay
- C) Keyin

### Q39. Xodim ↔ karta mosligi bo'yicha qidiruv
**Nima:** "Bo'sh kartaga eng mos xodim" yoki "xodimga mos karta" ni AI yordamida qidirish.
**Nega kerak:** Egasi modeli — kartaga xodim qidiriladi; bu asosiy stsenariy.
**Variantlar:**
- A) Ha, AI moslik balli bilan ranjlangan ro'yxat (razryad, malaka, ЦКП tarixiga qarab) — egasi vizyoniga to'g'ri
- B) Faqat qo'lda razryad mosligi bo'yicha — sodda
- C) Keyin
  - ⤳ Ta'sir: AI integratsiya (har kartaning AI'si), HR

### Q40. Saqlangan filtr/ko'rinishlar
**Nima:** Tez-tez ishlatiladigan filtrlarni saqlab qo'yish mumkin bo'lsinmi.
**Nega kerak:** Har safar bir xil filtrni qaytadan terish — vaqt isrofi.
**Variantlar:**
- A) Ha, shaxsiy saqlangan ko'rinishlar (masalan "Mening bo'limim bo'sh kartalari") — qulay
- B) Yo'q — sodda
- C) Keyin

---

## 11-bo'lim. Karta holati va hayot sikli

### Q41. Karta holat qiymatlari
**Nima:** Kartaning mumkin bo'lgan holatlari ro'yxati (Faol band / Vakansiya / I.o. / Muzlatilgan / Arxiv).
**Nega kerak:** Holat aniq bo'lmasa, hisobot va filtr ishlamaydi.
**Variantlar:**
- A) 5 holat: Faol(band), Vakansiya, I.o., Muzlatilgan, Arxiv — to'liq qamrov
- B) 2 holat: Band / Bo'sh — sodda, lekin kam ma'lumot
- C) Keyin

### Q42. Kartani muzlatish (vaqtincha to'xtatish)
**Nima:** Kartani o'chirmasdan vaqtincha "muzlatish" (ish to'xtagan, lekin keyin tiklanadi) imkoni.
**Nega kerak:** Mavsumiy ish yoki uskuna remontida ish vaqtincha to'xtaydi, lekin karta o'chirilmasligi kerak.
**Variantlar:**
- A) Ha, "Muzlatilgan" holati + sabab + muddat — moslashuvchan
- B) Yo'q, faqat ochiq yoki arxiv — qattiq
- C) Keyin

### Q43. Karta o'chirish vs arxivlash
**Nima:** Keraksiz karta butunlay o'chiriladimi yoki arxivga o'tadimi.
**Nega kerak:** Butunlay o'chirilsa, o'sha kartada ishlagan xodimlar tarixi yo'qoladi.
**Variantlar:**
- A) Hech qachon to'liq o'chirilmaydi, faqat arxivlanadi (tarix saqlanadi) — xavfsiz
- B) Owner to'liq o'chira oladi — xavfli, tarix yo'qoladi
- C) Keyin
  - ⤳ Ta'sir: Audit-tarix, Payroll (tarixiy oylik)

### Q44. Arxiv kartani tiklash
**Nima:** Arxivlangan karta keyin qayta faollashtirilishi mumkinmi.
**Nega kerak:** Mavsumiy yoki yopilib qaytadan ochiladigan ishlar uchun.
**Variantlar:**
- A) Ha, arxivdan tiklash mumkin, eski tarix bilan — qulay
- B) Yo'q, yangi karta ochilsin — tarix uziladi
- C) Keyin

---

## 12-bo'lim. Karta tarkibiy maydonlari (talab, darslik, hujjat)

### Q45. Kartadagi "talablar" ro'yxati
**Nima:** Har kartada bajaruvchidan talab qilinadigan narsalar (malaka, tajriba, jismoniy talab, til, sertifikat) qanday saqlanadi.
**Nega kerak:** AI xodim–karta mosligini baholashi uchun talab strukturali bo'lishi kerak.
**Variantlar:**
- A) Strukturali ro'yxat (har talab: tur, daraja, majburiy/ixtiyoriy) — AI o'qiy oladi
- B) Bitta erkin matn maydoni — yozish oson, lekin AI uchun yaroqsiz
- C) Keyin
  - ⤳ Ta'sir: AI (moslik bahosi — Q39)

### Q46. Darslik kartaga bog'lanishi
**Nima:** O'quv darslik/material kartaga bog'lanadimi (egasi: darslik kartaga, xodimga emas).
**Nega kerak:** Yangi odam kartaga kelganda, o'sha ishni o'rganish materiali tayyor turishi kerak.
**Variantlar:**
- A) Ha, darslik kartaga bog'lanadi; xodim o'sha kartaga kelsa darslikni ko'radi — egasi vizyoniga mos
- B) Darslik xodimga bog'lanadi — egasi modeliga zid
- C) Keyin
  - ⤳ Ta'sir: HR/LMS (o'quv), AI

### Q47. Kartaga biriktiriladigan hujjatlar
**Nima:** Kartaga qanday hujjatlar biriktiriladi (lavozim yo'riqnomasi, xavfsizlik qoidasi, ЦКП ta'rifi).
**Nega kerak:** Ish ta'rifi to'liq bo'lishi va xodim hammasini bir joydan ko'rishi uchun.
**Variantlar:**
- A) Yo'riqnoma + xavfsizlik + ЦКП ta'rifi + ixtiyoriy fayllar — to'liq
- B) Faqat bitta yo'riqnoma fayli — minimal
- C) Keyin

### Q48. Kerakli jihozlar/uskuna modeli
**Nima:** Karta bajaruvchisiga kerak jihozlar (maxsus kiyim, asbob, kompyuter) kartada ro'yxatlanadimi.
**Nega kerak:** Yangi xodim kelganda nima berish kerakligi aniq bo'lishi va aktivlar bilan bog'lanishi uchun. (Hozir bu model YO'Q.)
**Variantlar:**
- A) Ha, "kerakli jihozlar" ro'yxati + aktivlar moduliga bog'lanadi — to'liq
- B) Faqat matnli izoh — yengil, lekin bog'lanmaydi
- C) Keyin
  - ⤳ Ta'sir: Aktivlar/Ombor moduli (jihoz berish)

---

## 13-bo'lim. Razryad o'sishi va boshqa bog'lanishlar

### Q49. Razryad o'sish yo'li (karyera)
**Nima:** Kartada "keyingi razryad" va unga o'tish sharti ko'rsatilsinmi (o'sish yo'li).
**Nega kerak:** Egasi modeli — razryad→talab→o'sish→oylik; xodim qanday o'sishini ko'rishi kerak.
**Variantlar:**
- A) Ha, har razryad uchun "keyingi razryad + shart (imtihon, tajriba muddati, ЦКП)" — aniq karyera yo'li
- B) Yo'q, o'sish qo'lda hal qilinadi — noaniq
- C) Keyin
  - ⤳ Ta'sir: HR (rivojlanish), Payroll (o'sish → oylik)

### Q50. Razryad muddatli qayta tasdiqlash
**Nima:** Razryad bir marta berilib qoladimi yoki vaqti-vaqti bilan qayta tasdiqlanadimi (attestatsiya).
**Nega kerak:** Malaka pasayishi mumkin; xavfli ishlarda davriy tekshiruv kerak.
**Variantlar:**
- A) Xavfli/texnik kartalarda davriy attestatsiya (masalan har 2 yil), boshqalarida bir marta — muvozanatli
- B) Hech qachon qayta tasdiqlanmaydi — yengil, lekin xavf
- C) Keyin
  - ↳ Agar A: attestatsiyadan o'tmasa razryad pasaysinmi yoki muzlatilsinmi? (pasaytirish / muzlatib qayta imtihon / faqat ogohlantirish)

### Q51. Karta egasi (xodim) tayinlanish tasdig'i
**Nima:** Xodimni kartaga bog'lashda AI moslik balli past bo'lsa, tizim ogohlantirsinmi yoki bloklasinmi.
**Nega kerak:** Egasi modeli — xodim kartaga mos kelishi shart; mos kelmasa pul behuda ketadi.
**Variantlar:**
- A) Past moslikda ogohlantiradi + sabab so'raydi, lekin bloklamaydi (owner qaror qiladi) — moslashuvchan
- B) Belgilangan minimal balldan past bo'lsa bloklaydi — qattiq, lekin haqqoniy
- C) Keyin
  - ⤳ Ta'sir: AI (moslik bahosi), HR, Payroll (oylik faqat bog'langanda)

### Q52. Bir kartada bir vaqtda nechta odam
**Nima:** Bitta kartaga bir vaqtda bittagina xodim-mi yoki bir nechta (smenali ish) bog'lanadimi.
**Nega kerak:** Karton zavod 2-3 smenada ishlaydi; bitta "Mashinist" kartasiga 3 smena odam kerak bo'lishi mumkin.
**Variantlar:**
- A) Kartada "stavka soni" bo'ladi (masalan 3 stavka), har stavkaga bitta xodim — smenani qamraydi
- B) Bitta kartaga faqat bitta odam — har smena uchun alohida karta — ko'p dublikat
- C) Keyin
  - ⤳ Ta'sir: HR (smena jadvali), Payroll (stavka × xodim)
  - ↳ Agar A: smenalar oyligi bir xilmi yoki tungi smena ustamasi bo'ladimi? (bir xil / tungi ustama % / smena bo'yicha alohida)

---

## 14-bo'lim. KITOB-GROUNDED — zavod hujjatlaridan (Должностная инструкция / Оргполитика / Контрольный лист)

> Quyidagi savollar EuroPrint Kokand zavodining REAL 2020-2022 hujjatlaridagi aniq
> tushunchalarga asoslangan: 12-bo'limli "Лавозим йўриқномаси" shabloni, "1-4 продукт"
> slotlari, "НО-1..14" / "РД-4/РД-5" kodlari, 7 departament tuzilmasi, "Контрольный лист",
> "Лавозим папкаси", "мураббий/устоз", 2-oy o'qish+imtihon, "кун тартиби", korporativ
> telefon abonent ro'yxati, qog'oz/gofra domen-bilimi, "СЕРИЯ", "унвон", "Глоссарий".
> Manba: docs/audit/kitob-extracted/ (RD5__*.md, root.md).

### Q53. Karta = 12 bo'limli zavod yo'riqnoma shabloni
**Nima:** Har karta zavodning "Лавозим йўриқномаси" shabloniga qat'iy mos kelsinmi — 12 majburiy bo'lim: (1) Лавозим мақсади, (2) Оргсхемадаги жойлашуви, (3) Малака талаблари, (4) Иш жойи ва воситалари, (5) Умумий вазифалар, (6) Лавозимга хос вазифалар, (7) ЦКП, (8) Кўп учрайдиган хатолар, (9) Муваффақиятли ҳаракатлар, (10) Ҳуқуқлар, (11) Жавобгарлик, (12) Статистик кўрсаткичлар.
**Nega kerak:** Zavodda har "Должностная инструкция" aynan shu 12 bo'limga ega. Karta shu shaklda bo'lsa, eski qog'oz yo'riqnoma to'g'ridan-to'g'ri ERP kartaga ko'chadi.
**Variantlar:**
- A) Ha — 12 bo'lim majburiy maydon, to'la to'ldirilmasa "tugallanmagan" deb belgilanadi — zavod hujjatiga 100% mos
- B) Faqat 5-6 asosiy bo'lim, qolgani ixtiyoriy — yengilroq, lekin hujjatdan uziladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (yo'riqnoma), LMS (darslik), AI-moslik (baholash uchun barcha bo'lim kerak)

### Q54. Har kartaga "1-4 продукт" slotlari (ЦКП'dan ajralgan)
**Nima:** Zavod yo'riqnomasida har lavozimda "1-продукт, 2-продукт, 3-продукт, 4-продукт" bor (смена режалаштирувчи: 1=tasdiqlangan reja, 2=сменалик ҳисобот, 3=кечикиш ahbороti, 4=узлуксизлик ma'lumotlari). Karta shu sub-mahsulotlarni alohida ro'yxat sifatida saqlasinmi.
**Nega kerak:** ЦКП — bitta yakuniy mahsulot, lekin amalda har kun bir nechta aniq "продукт" topshiriladi. Bularni ajratish kunlik hisobot va AI-baho uchun aniq o'lchov beradi.
**Variantlar:**
- A) Ha — karta ichida "ЦКП + 1..N продукт" ro'yxati, har продукт alohida kuzatiladi — zavodga mos
- B) Faqat ЦКП saqlanadi, sub-mahsulotlar matn ichida — sodda, lekin o'lchab bo'lmaydi
- C) Keyin — hozir kerak emas

### Q55. "Кўп учрайдиган хатолар" — kartada xato-katalog
**Nima:** Har zavod kartasida "Кўп учрайдиган хатолар" ro'yxati bor (смена режалаштирувчи: "режани кеч тарқатиш", "хом ашё текширмасдан иш бошлаш", "режани ўзбошимчалик ўзгартириш"). Bu xatolarni karta katalog sifatida saqlab, hodisa bo'lganda shu ro'yxatdan belgilansinmi.
**Nega kerak:** Bu zavodning real "nima noto'g'ri ketishi mumkin" bilimi. Hodisa ro'yxatdan belgilansa — qaysi xato qaysi xodimda takrorlanayotgani ko'rinadi, AI ogohlantiradi.
**Variantlar:**
- A) Ha — karta xato-katalogi + hodisa shu kataloqdan tanlanadi (statistika to'planadi) — kuchli nazorat
- B) Xatolar faqat o'qish uchun matn (darslik) — sodda
- C) Keyin — hozir kerak emas

### Q56. "Муваффақиятли ҳаракатлар" — AI-baho ijobiy mezoni
**Nima:** Har kartada "Муваффақиятли ҳаракатлар" bor ("режани олдиндан тайёрлаш", "барча бўлимлар билан доимий алоқа", "A-System орқали доимий назорат"). Bu kartaning "ideal xodim qanday ishlaydi" namunasi sifatida AI-baho mezoni bo'lsinmi.
**Nega kerak:** AI xodimni karta bilan solishtirganda "muvaffaqiyatli harakatlar"ni bajaryaptimi degan savolga javob beradi. Bu mezonsiz AI faqat xatoni ko'radi, yaxshi ishni emas.
**Variantlar:**
- A) Ha — "Муваффақиятли ҳаракатлар" AI-baho ijobiy mezoni — to'liq baho (xato + yaxshi)
- B) Faqat darslik matni, baholanmaydi — sodda
- C) Keyin — hozir kerak emas

### Q57. Оргсхема manzili — "Департамент№-Бўлим№-Секция" 3 daraja
**Nima:** Zavod hujjatida har karta aniq manzil bilan: "5-Департамент, 13-бўлим, Секция планирования". Karta shu 3-darajali manzilni (Департамент № → Бўлим № → Секция nomi) majburiy saqlasinmi.
**Nega kerak:** Bu zavodning haqiqiy joylashuv kodi. Karta shu kod bilan bo'lsa — daraxtdagi o'rni aniq, hisobotlar departament/bo'lim/sektsiya kesimida chiqadi.
**Variantlar:**
- A) Ha — har kartada Департамент№ + Бўлим№ + Секция nomi majburiy — zavod kodiga mos
- B) Faqat "qaysi bo'lim" yetarli, sektsiya ixtiyoriy — yengilroq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: 7-otdeleniye daraxti, Reports (departament kesimi), RBAC (sektsiya darajasi)

### Q58. 7 Departament nomlari master-ro'yxat (qotirilsin)
**Nima:** Zavod aniq 7 departamentni belgilagan: 1-Ходимлар, 2-Савдо, 3-Бухгалтерия, 4-Ишлаб чиқариш, 5-Ишлаб чиқариш (sifat/режа/дизайн/конструктор), 6-Ривожлантириш ва инновациялар, 7-Администрация. Bu 7 nom o'zgarmas master-ro'yxat bo'lib qotirilsinmi.
**Nega kerak:** Hozir 2 ta "bo'lim olami" bor (chalkash). Zavod allaqachon 7 departamentni nomlagan — shuni yagona haqiqat qilsak, ikki-olam muammosi tugaydi.
**Variantlar:**
- A) Ha — 7 departament qotirilgan master-ro'yxat, hamma karta shulardan biriga tegishli — yagona poydevor
- B) Departament soni o'zgaruvchan, erkin qo'shiladi — moslashuvchan, lekin chalkashlik xavfi
- C) Keyin — hozir kerak emas

### Q59. 4 va 5-Departament ikkalasi "Ишлаб чиқариш" — chegara
**Nima:** Zavod hujjatida 4-Departament = "Ишлаб чиқариш" VA 5-Departament ham = "Ишлаб чиқариш (sifat/режа/дизайн/конструктор)". Bu ikkisi qanday farqlanadi — 4=asosiy ishlab chiqarish (operator/dastgoh), 5=qo'llab-quvvatlash (sifat/реja/дизайн)?
**Nega kerak:** ERP'da bu ikki departamentni aniq ajratmasak, kartalar qaysi biriga tushishi noaniq qoladi. Owner bu chegarani belgilashi kerak.
**Variantlar:**
- A) 4 = bevosita ishlab chiqarish (dastgoh/operator), 5 = qo'llab-quvvatlash (sifat/режа/дизайн/конструктор) — aniq chegara
- B) Ikkisini bitta "Ишлаб чиқариш"ga birlashtirish, ichida sektsiyalar — soddaroq
- C) Keyin — hozir kerak emas

### Q60. "НО-1..НО-14" raqamli birlik kodlari
**Nima:** Zavod oргполитикasida НО-1, НО-2, НО-3, НО-13, НО-14 birlik kodlari ishlatiladi (НО-1=ходимлар бўлими, НО-13=ички логистика, НО-14=ўқув бўлими). Har bo'lim/karta shu "НО-raqam" kodini saqlasinmi.
**Nega kerak:** Eski hujjatlar НО-raqam bilan bog'langan ("НО-3 га ҳисобот", "НО-2 йўриқнома ўтади"). ERP shu kodlarni saqlasa — eski oргполитика hujjatlari kartalarga ulanadi.
**Variantlar:**
- A) Ha — har bo'lim/karta "НО-kodi" maydoniga ega, eski hujjatlar shu kod orqali bog'lanadi — meros saqlanadi
- B) НО-kodlar tashlanadi, faqat yangi ID — toza, lekin eski hujjat bog'lanmaydi
- C) Keyin — hozir kerak emas

### Q61. "РД-4 / РД-5" — qaror beruvchi rol kodlari
**Nima:** Zavodda РД-4, РД-5 "qaror beruvchi" rollarni bildiradi (РД-4 lavozim aniqlaydi, ўқиш/синов muddatini belgilaydi, mustaqil ishlashga ruxsat beradi). Karta tizimida "qaror beruvchi rol" tushunchasi alohida saqlansinmi.
**Nega kerak:** Yangi xodimni mustaqil ishga qo'yish qarorini aynan РД-4 beradi. Bu kartaning real "kim ruxsat beradi" zanjiri. Belgilamasak, tasdiqlash zanjiri bo'sh qoladi.
**Variantlar:**
- A) Ha — "qaror beruvchi rol" (РД-4/РД-5) karta atributi, tasdiq oqimlari shunga bog'lanadi — real zanjir
- B) Tasdiqni faqat to'g'ridan-to'g'ri rahbar (manager_id) beradi — soddaroq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (ishga qabul), Adaptatsiya (mustaqil ish ruxsati), Oylik (faollashtirish)

### Q62. Karta = "Лавозим папкаси" konteyneri
**Nima:** Zavodda har lavozim "Лавозим папкаси" (штат папкаси)ga ega — ichida йўриқнома, оргполитика, контрольный лист, машғулотлар yig'iladi. Karta shu papkani raqamli konteyner qilib ushlab tursinmi (barcha hujjat bitta kartada).
**Nega kerak:** Zavod allaqachon har lavozim uchun papka tartibida ishlaydi. Karta = raqamli papka bo'lsa, xodim o'z lavozimiga oid hammasini bir joyda ko'radi.
**Variantlar:**
- A) Ha — karta = "Лавозим папкаси" konteyneri (yo'riqnoma + оргполитика + darslik + контрольный лист) — to'liq
- B) Karta faqat asosiy maydonlar, hujjatlar alohida modulda — soddaroq, lekin tarqoq
- C) Keyin — hozir kerak emas

### Q63. "Контрольный лист" — har bo'lim o'qildi-tasdiqi
**Nima:** Zavodda "Контрольный лист" bor — xodim har bo'limni ("Лавозим мақсади", "ЦКП", "малака талаблари") o'qib chiqqanini imzo bilan tasdiqlaydi. Karta tizimida har bo'lim uchun "o'qildi-tasdiqladim" + sana saqlansinmi.
**Nega kerak:** Bu zavodning yuridik himoyasi — "xodim yo'riqnomani o'qigan"ligini isbotlaydi. Raqamli tasdiq bo'lsa, nizoda dalil bor, mustaqil ishga ruxsat shartli bo'ladi.
**Variantlar:**
- A) Ha — har karta bo'limi uchun "tasdiqladim" + sana + raqamli imzo; hammasi tasdiqlanmaguncha "tayyor emas" — yuridik himoya
- B) Bitta umumiy "yo'riqnomani o'qidim" tasdig'i yetarli — soddaroq
- C) Keyin — hozir kerak emas

### Q64. Малака талаблари — strukturali maydonlar
**Nima:** Karta "малака талаблари" aniq bandlardan iborat: ta'lim darajasi (ўрта махсус/олий), tajriba (2-3 yil), dasturiy ko'nikma (A-System), soha tushunchasi (қоғоз/гофра turlari). Bular strukturali maydonlar (ta'lim/tajriba-yil/dastur/ko'nikma) bo'lib saqlansinmi.
**Nega kerak:** Vakansiya va xodim-karta moslik baholanganda AI aniq solishtirishi kerak: "talab 2-3 yil tajriba, xodimda 1 yil". Strukturasiz solishtirib bo'lmaydi.
**Variantlar:**
- A) Ha — strukturali (ta'lim/tajriba-yil/dastur/ko'nikma-ro'yxat), recruitment + AI shunga solishtiriadi — aniq
- B) Erkin matn ro'yxati — sodda, lekin avtomatik solishtirilmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Recruitment (vakansiya filtri), AI-moslik, Razryad (talab→razryad)

### Q65. "Иш жойи ва воситалари" — karta resurs/jihoz ro'yxati
**Nima:** Karta "Иш жойи ва лавозим воситалари" bor (ички логистика: рохлерлар, поддонлар, ички транспорт; смена режалаштирувчи: компьютер, планшет). Karta "kerakli jihozlar/vositalar" ro'yxatini saqlasinmi (memory: "kerakli jihozlar modeli YO'Q").
**Nega kerak:** Har lavozim aniq jihoz/vosita talab qiladi. Bu ro'yxat — yangi xodim kelganda nima berilishi va inventarizatsiya bilan bog'lash uchun asos.
**Variantlar:**
- A) Ha — karta "kerakli voositalar" ro'yxatiga ega, inventar/ombor bilan bog'lanadi — to'liq
- B) Voositalar faqat matnda — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor/inventar (jihoz berish), HR onboarding, Aktiv hisobi

### Q66. "Бўйсуниш" — karta→karta vertikal bog'lanish
**Nima:** Karta aniq yozadi: "тўғридан-тўғри ички логистика бўлими бошлиғига бўйсунади". Karta "kimga bo'ysunadi"ni karta→karta bog'lanish sifatida saqlasinmi (manager_id = xodim emas).
**Nega kerak:** Memory: manager_id 0/30 NULL muammosi. Zavod hujjatida bo'ysunish kartadan kartaga aniq. Bog'lanish karta→karta bo'lsa, rahbar o'zgarsa ham zanjir buzilmaydi.
**Variantlar:**
- A) Ha — bo'ysunish karta→karta (vertikal zanjir kartalardan tuziladi) — barqaror, manager_id muammosini hal qiladi
- B) Bo'ysunish xodim→xodim (manager_id) — eski usul, NULL muammosi qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Coordination chain (eskalatsiya), 7-otdeleniye daraxti, MANAGER_OF_SENDER

### Q67. Karta javobgarligi — standart bandlar avtomatik
**Nima:** Karta "Жавобгарлик" qismida standart bandlar bor: energiya resurslari (сув/газ/свет) tejash, tijorat sirini oshkor qilmaslik (jinoyat kodeksi), moddiy va ma'naviy javobgarlik. Bu standart bandlar har kartaga avtomatik qo'shilsinmi.
**Nega kerak:** Bu bandlar deyarli har yo'riqnomada bir xil takrorlanadi. Avtomatik qo'shilsa — har karta yuridik to'liq bo'ladi, qo'lda yozish shart emas.
**Variantlar:**
- A) Ha — standart javobgarlik bandlari (energiya/sir/moddiy-ma'naviy) avtomatik + kartaga xos bandlar qo'lda — to'liq va tez
- B) Har karta javobgarligini qo'lda yoziladi — moslashuvchan, lekin takror ish
- C) Keyin — hozir kerak emas

### Q68. Karta "ҳуқуқлари" — ERP harakatiga bog'lanishi
**Nima:** Karta "Ҳуқуқлар" bor ("режа учун зарур шартларни талаб қилиш", "ахборот сўраш", "хавфсиз иш шароити воситаларини талаб қилиш"). Bu huquqlar ERP'da real harakatga aylantirilsinmi (masalan "ma'lumot so'rash" tugmasi)?
**Nega kerak:** Huquqlar faqat qog'ozda qolmasligi kerak. Karta "ma'lumot so'rash huquqi"ni bersa va ERP'da o'sha so'rovni yuborish tugmasi bo'lsa — huquq amalga oshadi.
**Variantlar:**
- A) Ha — kartadagi huquqlar ERP harakatlariga bog'lanadi (so'rov yuborish, talab qilish) — huquq amalda
- B) Huquqlar faqat hujjat matni — sodda
- C) Keyin — hozir kerak emas

### Q69. ЦКП turi — "mahsulot / holat / foiz"
**Nima:** Zavodda ЦКП har xil: aniq narsa ("Ўз вақтида етказилган хом-ашё", "тайёр ярим тайёр маҳсулотлар") yoki holat ("режалар максимал юкланишни таъминлаган"). Karta ЦКП'ni tur (mahsulot/holat/foiz-natija) bilan tasniflasinmi.
**Nega kerak:** AI "ЦКП bajarildimi?"ga javob berishi kerak — mahsulot bo'lsa "bor/yo'q", holat bo'lsa sifat, foiz bo'lsa raqam. Tur belgilanmasa AI o'lchay olmaydi.
**Variantlar:**
- A) Ha — ЦКП'ga tur tegi (mahsulot/holat/foiz) + o'lchov usuli biriktiriladi — AI o'lchay oladi
- B) ЦКП erkin matn, o'lchov yo'q — sodda, lekin baholab bo'lmaydi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: o'lchov usulini kim kiritadi? — A) karta yaratuvchi rahbar (RD-4/RD-5), B) bosh metodist/owner, C) AI taklif qiladi rahbar tasdiqlaydi

### Q70. ЦКП → yuqori daraja ЦКП kaskadi
**Nima:** Quyi kartaning ЦКП'si yuqori karta ЦКП'siga hissa qo'shadi (operator ЦКП → bo'lim ЦКП → otdeleniye ЦКП). Bu ЦКП ierarxiyasi kartalar orasida bog'lansinmi?
**Nega kerak:** ЦКП har kartada bor, lekin ular bir-biriga qanday bog'lanishi yo'q. Quyi ЦКП yuqoriga oqsa — "bo'lim ЦКП bajarilmadi, chunki 3 operator ЦКП qoldi" ko'rinadi.
**Variantlar:**
- A) Ha — ЦКП ierarxik bog'lanadi (quyi→yuqori), yuqori karta ЦКП'si quyilardan to'planadi — to'liq tasvir
- B) Har ЦКП mustaqil, bog'lanmaydi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: 7-otdeleniye daraxti, Reports (ЦКП kaskad), AI (uzilgan halqa)

### Q71. "Статистик кўрсаткичлар" → avtomatik KPI maydonlari
**Nima:** Har kartada "Статистик кўрсаткичлар" bor (режа бажарилиш %, ўз вақтида бажарилиш %, оғиш ҳолатлари сони). Bu ko'rsatkichlar kartaning rasmiy KPI maydonlari bo'lib, real DB'dan avtomatik to'lsinmi.
**Nega kerak:** Zavod allaqachon har lavozim uchun aynan qaysi raqam o'lchanishini yozib qo'ygan. Avtomatik hisoblasak — oylik/bonus/AI-baho asosli bo'ladi.
**Variantlar:**
- A) Ha — har karta o'z "Статистик кўрсаткичлар"iga ega, qiymatlar modullardan avtomatik to'ladi — kuchli, lekin har metrikani ulash kerak
- B) Ko'rsatkichlar matnda, qo'lda kiritiladi — tez, lekin avtomatik emas
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (режа %), Sifat (брак %), Reports (KPI dashboard)

### Q72. Rahbar kartasi KPI'si quyi kartalardan to'planadi
**Nima:** Bo'lim boshlig'i kartasining statistik ko'rsatkichi (ички логистика бошлиғи: "режа бажарилиш %", "кечикишлар сони") aslida butun bo'lim natijasidan kelib chiqadi. Rahbar kartasining KPI'si avtomatik quyi kartalardan to'plansinmi?
**Nega kerak:** Rahbar shaxsan emas, bo'limi orqali baholanadi. Quyi kartalardan to'plansa — "bo'liming yaxshi ishladi = sen yaxshi rahbarsan" tabiiy bo'ladi.
**Variantlar:**
- A) Ha — rahbar kartasi KPI'si quyi kartalar natijasidan avtomatik to'planadi — adolatli, vizyonga mos
- B) Rahbar KPI'si alohida (qo'lda) — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: ЦКП kaskad (Q70), 7-otdeleniye daraxti, Oylik (rahbar bonusi)

### Q73. Yangi xodim: 2-oy o'qish + imtihon → karta faollashuvi
**Nima:** Zavod оргполитикasi: yangi xodim 2 oy amaliy mashg'ulot → nazariy+amaliy imtihon → uchastka rahbari yozma xulosasi → mustaqil ishga ruxsat. Karta xodim biriktirilganda shu bosqichlardan o'tmaguncha "to'liq faol" bo'lmasinmi (oylik to'liq emas).
**Nega kerak:** Bu zavodning real onboarding zanjiri. Karta majburlasa — hech kim imtihonsiz mustaqil ishlay olmaydi, oylik bosqichma-bosqich ochiladi.
**Variantlar:**
- A) Ha — karta holati: biriktirildi → o'qish (2 oy) → imtihon → rahbar xulosasi → mustaqil-faol; har bosqich oylikka ta'sir qiladi — to'liq zanjir
- B) Karta biriktirilishi bilan darrov to'liq faol — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR onboarding, LMS (imtihon), Adaptatsiya, Oylik (bosqichli ochilish)
  - ↳ Agar A: o'qish davri oyligi — A) kamaytirilgan stavka, B) to'liq stavka, C) faqat o'qish stipendiyasi

### Q74. Мураббий/устоз (mentor) kartaga bog'lanishi
**Nima:** Zavod yangi xodimga "мураббий/устоз" tayinlaydi (buyruqda устоз ismi). Karta yangi xodimga biriktirilganda unga mentor-karta (kim o'rgatadi) bog'lansinmi?
**Nega kerak:** O'qitish sifati va javobgarligi mentorga bog'liq. Mentor-bog'lanish saqlansa — "kim o'rgatdi, qancha vaqtda mustaqil bo'ldi" ko'rinadi, mentorga rag'bat bo'ladi.
**Variantlar:**
- A) Ha — onboarding davrida kartaga "мураббий" (mentor-karta) biriktiriladi, natija ikkalasiga bog'lanadi — javobgarlik aniq
- B) Mentor faqat HR yozuvida, kartaga bog'lanmaydi — sodda
- C) Keyin — hozir kerak emas

### Q75. Karta "СЕРИЯ" (oргполитика toifasi) bog'lanishi
**Nima:** Zavod оргполитикalari "СЕРИЯ" bilan toifalanadi ("Ташкилот", "Компания"). Kartaga tegishli oргполитикalar shu seriya kesimida biriktirilsinmi (qaysi politikalar shu kartaga taalluqli).
**Nega kerak:** Har karta ma'lum oргполитикalarga bo'ysunadi (кун тартиби, телефон ишлатиш, таътил тартиби). Karta shularni ko'rsatsa — xodim o'ziga taalluqli barcha qoidalarni bir joyda ko'radi.
**Variantlar:**
- A) Ha — oргполитикalar seriya bo'yicha kartalarga biriktiriladi — to'liq
- B) Politikalar umumiy, hammaga bir xil — sodda
- C) Keyin — hozir kerak emas

### Q76. "Унвон" — lavozimdan alohida maydon
**Nima:** Zavod buyrug'ida "лавозим, унвон, фамилия" alohida ko'rsatiladi — lavozim (karta) bilan "унвон" (daraja/rutba) farqlanadi. Karta "унвон" maydonini lavozimdan alohida saqlasinmi.
**Nega kerak:** Bir lavozimda turli unvon bo'lishi mumkin (katta operator / oddiy operator). Unvon razryad bilan bog'liq, lekin buyruqda alohida yoziladi. Ajratilsa — rasmiy hujjatlar to'g'ri chiqadi.
**Variantlar:**
- A) Ha — karta "lavozim nomi" + "унвон" (razryad/rutba) alohida maydonlar — rasmiy hujjatga mos
- B) Унвон = razryad bilan bir xil — sodda
- C) Keyin — hozir kerak emas

### Q77. Karta smena-turi (3 smenali ishlab chiqarish)
**Nima:** Zavod 3 smenali ishlaydi (оргполитика: "3 сменалик тушлик"). Karta smena-turi (1/2/3-smena yoki smenasiz)ni saqlasinmi — operator kartasi smena bo'yicha ko'paytirilsinmi?
**Nega kerak:** Operator kartalari smena bo'yicha ko'payadi. Smena teg bo'lsa — kim qaysi smenada, smena rejalashtiruvchi qaysi kartalarni ko'radi, oylik smena ustamasi bilan — hammasi aniq.
**Variantlar:**
- A) Ha — karta "smena" tegiga ega; ishlab chiqarish kartalari smena bo'yicha ko'paytiriladi — aniq
- B) Smena xodim atributida, karta smenasiz — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (смена режа), Oylik (smena ustamasi), Davomat

### Q78. Karta → "кун тартиби" (ish-vaqt rejimi) bog'lanishi
**Nima:** Zavod кун тартиби aniq vaqtlarni belgilaydi (танаффус 10:00-10:20, тушлик 12:00-13:30, namoz vaqtlari пешин/аср/шом). Karta o'z "ish-vaqt rejimi"ni (qaysi kun tartibiga bo'ysunadi) saqlasinmi.
**Nega kerak:** Davomat va intizom kartaga bog'liq. Har karta qaysi vaqt-rejimga bo'ysunishini bilsa — davomat nazorati avtomatik (kim kech keldi, tanaffusdan kech qaytdi).
**Variantlar:**
- A) Ha — karta "ish-vaqt rejimi" qoidasiga bog'lanadi, davomat shunga solishtiriadi — intizom nazorati
- B) Vaqt rejimi umumiy, hammaga bir xil — sodda
- C) Keyin — hozir kerak emas

### Q79. Karta → kunlik/smenalik hisobot majburiyati tegi
**Nima:** Смена режалаштирувчи kartasi "сменалик ҳисобот" topshirishi majburiy. Har kartaga "kunlik/smenalik hisobot majburiyati" tegi biriktirilsinmi (beradi/bermaydi, qachon, kimga).
**Nega kerak:** Vizyonda "kunlik hisobot bermaslik jazosi" bor, lekin qaysi kartalar hisobot berishi shart degan ro'yxat yo'q. Teg bo'lsa — kim hisobot bermadi avtomatik ko'rinadi.
**Variantlar:**
- A) Ha — karta "hisobot majburiyati" tegiga ega (davriylik + qabul qiluvchi karta), bermаslik avtomatik aniqlanadi — nazoratli
- B) Hisobot majburiyati umumiy, kartada teg yo'q — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Coordination (hisobot oqimi), Oylik (jazo), AI (bermaslik signali)

### Q80. Karta → domen-bilim (qog'oz/gofra turlari) bog'lanishi
**Nima:** Ko'p ishlab chiqarish kartasi "Қоғоз турларини билиши керак, Гофра турларини билиши керак" talab qiladi. Bu domen-bilim (qog'oz: крафлайнер/местный/тестлайнер/топлайнер/мелованный; gofra; 3/5 qatlam) kartaga bog'langan o'qув talab sifatida saqlansinmi.
**Nega kerak:** Bu zavodning yadro texnik bilimi. Karta darslik bilan bog'lasa — yangi operator aynan kerakli materiallarni o'rganadi, imtihon shu bilimdan bo'ladi.
**Variantlar:**
- A) Ha — karta "talab qilinadigan domen-bilim" ro'yxatiga ega, LMS darsligi shunga bog'lanadi — to'liq o'qish zanjiri
- B) Domen-bilim umumiy darslikda, kartaga bog'lanmaydi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: LMS (darslik), Sifat (material bilimi → brak kamayadi), AI-imtihon

### Q81. Korporativ telefon/abonent doirasi kartaga biriktirish
**Nima:** Zavod оргполитикasi har lavozimga korporativ raqam + aniq "абонентлар ro'yxati"ni belgilaydi (Савдо бўлими рахбари: mijozlar, rahbariyat, yaqin qarindoshlar). Karta korporativ raqam + ruxsat etilgan aloqa doirasini saqlasinmi.
**Nega kerak:** Zavod aloqa xavfsizligini kartaga bog'lagan. ERP saqlasa — kim qaysi raqamga ega, kim bilan gaplashishi mumkin, aloqa nazorati (НО-3 qo'ng'iroq nazorati) bog'lanadi.
**Variantlar:**
- A) Ha — karta korporativ raqam + ruxsat etilgan abonent toifalarini saqlaydi — zavod xavfsizligiga mos
- B) Telefon faqat xodim profilida — sodda
- C) Keyin — hozir kerak emas

### Q82. Taътil tasdig'i — i.o. + vazifa-topshirish majburiy
**Nima:** Zavod оргполитикasi (20.07.2022): mansabdor shaxs taътilga chiqishda "вазифаларни ўзидан кейин ходимга ўтказиши" shart. Karta egasi taътил so'raganda i.o. tayinlash + vazifa-topshirish ro'yxati majburiy bosqich bo'lsinmi (to'ldirilmaguncha taътил tasdiqlanmaydi).
**Nega kerak:** Zavod aynan shu uzilishni ko'tarib chiqqan — rahbar yo'qligida bo'lim to'xtaydi. Karta majbur qilsa, uzluksizlik ta'minlanadi.
**Variantlar:**
- A) Ha — taътil tasdiqi i.o. tayinlash + vazifa-topshirish ro'yxati to'ldirilgandan keyin — uzluksizlik kafolati
- B) Taътил oddiy tasdiqlanadi, vazifa-topshirish ixtiyoriy — sodda, lekin uzilish xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (taътil), I.o. tizimi (mavjud Q18), Coordination (vaqtinchalik eskalatsiya)

### Q83. Karta versiyalash (yo'riqnoma sanasi o'zgarganda)
**Nima:** Yo'riqnomalar vaqt o'tib yangilanadi (zavod hujjatlarida 2020/2021/2022 sanalari). Karta yangilanганda eski versiya saqlanib, yangi versiya raqami (v1/v2) bilan ketsinmi — xodim qaysi versiyani tasdiqlagani aniq bo'lsin.
**Nega kerak:** Контрольный лист — xodim ma'lum versiyani o'qib tasdiqlaydi. Yo'riqnoma o'zgarsa, xodim yangi versiyani qayta tasdiqlashi kerak. Versiyalashsiz "qaysi versiyani tasdiqladi" noaniq.
**Variantlar:**
- A) Ha — karta versiyalanadi (eski saqlanadi), versiya o'zgarsa qayta tasdiq so'raladi — aniq, yuridik
- B) Faqat oxirgi versiya saqlanadi — sodda, lekin tarix yo'q
- C) Keyin — hozir kerak emas

### Q84. Karta tasdiqlovchi 2 imzo (tasdiqlovchi + tanishuvchi)
**Nima:** Zavod yo'riqnomasi 2 imzo bilan tugaydi: "Йўриқномани тасдиқловчи масъул шахс" (RD-4/RD-5) va "Йўриқнома билан танишдим" (xodim). Karta ham ikki taraflama raqamli imzoni (tasdiqlovchi + tanishgan xodim, sana) saqlasinmi.
**Nega kerak:** Bu zavodning rasmiy tartibi — karta faqat tasdiqlovchi imzolaganda kuchga kiradi, xodim tanishganda majburiy bo'ladi. Ikki imzosiz karta rasmiy emas.
**Variantlar:**
- A) Ha — karta 2 raqamli imzo bilan kuchga kiradi (tasdiqlovchi RD + tanishgan xodim, sana) — rasmiy, yuridik
- B) Faqat yaratilsa kuchga kiradi — sodda
- C) Keyin — hozir kerak emas

### Q85. Karta → "Иш йўриқномаси" (amaliy qadamlar) qatlami
**Nima:** Zavodda "Лавозим йўриқномаси" (nima qilish) bilan "Иш йўриқномаси" (qanday — boshlashdan oldin/jarayonda/yakunda qadamlar) alohida hujjat. Karta ikkalasini ham (vazifa + amaliy qadam-baqadam) saqlasinmi.
**Nega kerak:** Лавозим = vazifa ta'rifi, Иш йўриқномаси = amaliy bajarish yo'li. Ikkalasi kartada bo'lsa, yangi xodim nafaqat nima, balki qanday qilishni ham biladi.
**Variantlar:**
- A) Ha — karta 2 qatlam: vazifa ta'rifi + amaliy qadamlar (Иш йўриқномаси) — to'liq amaliy qo'llanma
- B) Faqat vazifa ta'rifi, amaliy qadamlar alohida LMS'da — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: LMS, Onboarding, AI (qadam bajarilishini tekshirish)

### Q86. Karta → "Сборник упражнений" (mashq/test) bog'lanishi
**Nima:** Zavod har lavozim uchun "Сборник упражнений" + vaziyat-savollari (A/B/V variantli) tayyorlagan. Karta o'z mashq/test to'plamiga ega bo'lib, imtihon shu kartadan avtomatik tuzilsinmi.
**Nega kerak:** Imtihon manbai kerak. Zavodda har lavozim uchun mashq+test bor (vaziyat: "qaysi xatoga yo'l qo'ydi? A/B/V"). Kartaga bog'lansa, imtihon avtomatik tuziladi.
**Variantlar:**
- A) Ha — karta mashq/test to'plamiga ega, imtihon shundan tuziladi, AI baholaydi — to'liq o'qish zanjiri
- B) Test umumiy bankda — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: LMS, AI-imtihon, Razryad (imtihon→ko'tarilish)

### Q87. "Глоссарий" — kartaga bog'langan atamalar lug'ati
**Nima:** Zavod har yo'riqnoma oxiriga "Глоссарий (Луғат)" qo'yadi — atamalarning oddiy izohi. Karta o'z atamalar lug'atiga ega bo'lib, yangi xodim notanish so'zni darrov ko'rsinmi.
**Nega kerak:** Yangi xodim "крафлайнер", "флютинг", "тех карта" atamalarni bilmaydi. Bog'langan lug'at — o'qishni tezlashtiradi, imtihon savoliga asos bo'ladi.
**Variantlar:**
- A) Ha — karta atamalar lug'atiga ega (yoki umumiy lug'atdan kerakli atamalar), darslikda tooltip — o'qish tez
- B) Lug'at umumiy — sodda
- C) Keyin — hozir kerak emas

### Q88. ЦКП formula turi (qanday o'lchanadi)
**Nima:** ЦКП bajarilishi qanday formula bilan o'lchansin — (a) miqdor (bajarilgan/reja %), (b) sifat (брак teskari), (c) muddat (o'z vaqtida %), (d) holat (bor/yo'q). Har karta ЦКП'siga formula turi biriktirilsinmi.
**Nega kerak:** Zavod ЦКП'lari har xil tabiatga ega: смена режалаштирувчи = "max yuklanish %", ички логистика = "tayyor ярим tayyor bor/yo'q". Bitta formula hammasiga to'g'ri kelmaydi.
**Variantlar:**
- A) Ha — 4 ЦКП formula turi (miqdor%/sifat/muddat%/holat), har kartaga mosi biriktiriladi — aniq baho
- B) Faqat miqdoriy % hammaga — sodda, lekin ba'zi kartaga noto'g'ri
- C) Keyin — hozir kerak emas

### Q89. Razryad → karta minimal talabi vs xodim razryadi (gap)
**Nima:** Karta MINIMAL razryad talab qilsin (karta = 4-razryad operator o'rni), xodim o'z razryadiga ega bo'lsin, AI mosligini avtomatik tekshirsin ("karta 4-razryad talab qiladi, xodim 3-razryad → mos emas").
**Nega kerak:** Zavod razryad→talab→o'sish→oylik mantig'ida ishlaydi. Karta talab qilsa va xodim razryadga ega bo'lsa — moslik avtomatik tekshiriladi.
**Variantlar:**
- A) Ikkalasi — karta MINIMAL razryad talab qiladi, xodim o'z razryadiga ega, AI tekshiradi — eng kuchli
- B) Faqat kartada (karta razryadi = xodim razryadi) — sodda
- C) Faqat xodimda — moslik tekshirilmaydi
- D) Keyin — hozir kerak emas
  - ⤳ Ta'sir: AI-moslik (gap-analiz), Oylik (razryad→min-oylik), Recruitment

### Q90. AI gap-analiz: karta talabi vs xodim haqiqati farqi
**Nima:** AI har karta uchun "talab" (malaka/razryad/ko'nikma) bilan "xodim haqiqati"ni solishtirib, farqlar (gap) ro'yxatini chiqarsinmi — "karta 2-3 yil tajriba talab qiladi, xodimda 1 yil; A-System ko'nikmasi yo'q".
**Nega kerak:** Kartaning amaliy qiymati — nafaqat baho-foiz, balki AYNAN nima yetishmasligini ko'rsatish. Shu gap-ro'yxatdan o'qish rejasi (darslik) avtomatik tuziladi.
**Variantlar:**
- A) Ha — AI gap-analiz (talab vs haqiqat farqlari ro'yxati) → undan o'qish/rivojlanish rejasi — amaliy
- B) Faqat umumiy moslik foizi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: LMS (gap→darslik), Razryad (gap yopilsa→ko'tarilish), Recruitment

### Q91. Karta "majburiy tizim-qaydlari" (A-System o'rnini bosish)
**Nima:** Смена режалаштирувчи kartasi "A-System орқали иш бошланиши, босқичдан босқичга ўтиш ва иш тугаши тўғри қайд этилишини назорат қилиш" talab qiladi. Karta "tizimga aniq qayd kiritish majburiyati"ni (qaysi hodisalar qayd qilinishi shart) saqlasinmi.
**Nega kerak:** ERP ma'lumotining sifati shu qaydlarga bog'liq. Karta "sen ish boshlanishini qayd qil" deb belgilasa va bajarilmasa AI signal bersa — ma'lumot to'liq bo'ladi.
**Variantlar:**
- A) Ha — karta "majburiy tizim-qaydlari" ro'yxatiga ega (ish boshlandi/bosqich/tugadi), bajarilmasa signal — ma'lumot to'liqligi
- B) Qayd majburiyati umumiy, kartada teg yo'q — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (ish qaydi), Ma'lumot sifati, AI (qayd uzilishi signali)

### Q92. Razryad pasayish triggerlari (kitob xato/ko'rsatkichlardan)
**Nima:** Razryad pasayishi qaysi triggerdan — (a) takroriy xato (kartadagi "кўп учрайдиган хатолар"dan), (b) statistik ko'rsatkich chegaradan past, (c) qayta imtihon yiqilishi, (d) intizom buzilishi (кун тартиби)? Trigger ro'yxati belgilansinmi.
**Nega kerak:** Razryad pasayishi og'riqli — aniq, isbotli trigger kerak. Zavod allaqachon "кўп учрайдиган хатолар" + "статистик кўрсаткичлар"ni belgilagan — pasayish shulardan kelib chiqsa adolatli.
**Variantlar:**
- A) Ha — pasayish faqat aniq triggerdan (statistik ko'rsatkich + takroriy xato + qayta imtihon), AI taklif qiladi, RD-4 tasdiqlaydi — adolatli, isbotli
- B) Pasayish faqat rahbar qaroriga ko'ra (qo'lda) — sodda, lekin sub'ektiv
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Razryad, Oylik (pasayish→kamayadi), AI, HR hujjati

### Q93. Bo'sh продукт slotlari → "tugallanmagan karta" topshirig'i
**Nima:** Ba'zi zavod kartalarida продукт slotlari bo'sh (ички логистика бошлиғи: 1-4 продукт bo'sh). Karta продукт slotlari to'lmagan bo'lsa "tugallanmagan" deb belgilanib, javobgar rahbarga to'ldirish topshirig'i berilsinmi.
**Nega kerak:** Bo'sh продукт = aniq o'lchanadigan natija yo'q = ЦКП mavhum. Tizim bo'sh slotlarni ko'rsatsa, kartalar asta-sekin to'liq bo'ladi.
**Variantlar:**
- A) Ha — bo'sh продукт slotlari "tugallanmagan" + javobgar rahbarga to'ldirish topshirig'i — kartalar to'liqlashadi
- B) Bo'sh slotlar ruxsat etiladi, ogohlantirilmaydi — sodda
- C) Keyin — hozir kerak emas

### Q94. Vakant karta ЦКП'sini kim vaqtincha bajaradi
**Nima:** Karta muzlatilganda (xodim ketdi) yoki vakant bo'lsa, o'sha kartaning ЦКП'sini kim vaqtincha bajaradi — yuqori karta avtomatik o'z zimmasiga oladimi yoki qo'shni karta?
**Nega kerak:** Bo'sh karta = bajarilmaydigan ЦКП = ishlab chiqarish uzilishi. Zavod mantig'ida hech bir ЦКП egasiz qolmasligi kerak. Kim qoplashi avtomatik aniqlansa, uzilish kamayadi.
**Variantlar:**
- A) Ha — vakant karta ЦКП'si vaqtincha yuqori kartaga (rahbar) yoki belgilangan qo'shni kartaga o'tadi — uzilish yo'q
- B) Vakant ЦКП hech kimga o'tmaydi, faqat ogohlantirish — sodda, lekin ish to'xtaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Coordination, I.o. tizimi (Q18), Ishlab chiqarish uzilishi

### Q95. Karta eskirgan belgisi (davriy ko'rib chiqish)
**Nima:** Karta uzoq vaqt (masalan 1 yil) yangilanmasa "ko'rib chiqilishi kerak" deb belgilanib, javobgar rahbarga eslatma yuborilsinmi — zavod jarayonlari o'zgaradi, yo'riqnoma eskiradi.
**Nega kerak:** Zavod hujjatlarida turli sanalar (2020-2022) — yo'riqnomalar davriy yangilanadi. Eskirgan karta = haqiqatga mos kelmaydigan ish ta'rifi. Davriy ko'rib chiqish majbur qilinsa, kartalar tirik qoladi.
**Variantlar:**
- A) Ha — karta "oxirgi ko'rib chiqilgan sana"ni saqlaydi, muddat oshsa "ko'rib chiqing" eslatmasi — kartalar tirik
- B) Karta o'zicha qoladi, eslatma yo'q — sodda
- C) Keyin — hozir kerak emas

### Q96. Kartadan rasmiy "Должностная инструкция" PDF eksport
**Nima:** Karta ma'lumotidan zavodning rasmiy "Лавозим йўриқномаси / Должностная инструкция" qog'oz formatini (12 bo'lim + 2 imzo joyi) avtomatik PDF qilib chiqarish mumkin bo'lsinmi.
**Nega kerak:** Zavod hali qog'oz hujjat va imzo bilan ishlaydi (контрольный лист, штат папкаси). Kartadan rasmiy hujjat avtomatik chiqsa — raqamli karta va qog'oz tartibi mos, qo'lda qayta yozish shart emas.
**Variantlar:**
- A) Ha — kartadan rasmiy yo'riqnoma PDF (zavod shabloni + imzo joylari) avtomatik chiqadi — raqamli↔qog'oz mosligi
- B) PDF eksport yo'q, faqat ekranda — sodda
- C) Keyin — hozir kerak emas

### Q97. Karta штат-reja birligiga bog'lanishi (штат папкаси raqami)
**Nima:** Zavodda har lavozim "штат папкаси"ga ega va штат-rejada raqamlangan. Karta штат-reja birligiga (штат raqami + tasdiqlangan o'rin soni) bog'lansinmi — "shtatda 5 operator o'rni, 3 tasi to'lgan".
**Nega kerak:** Штат-reja moliyaviy planlash bilan bog'liq — qancha o'rin tasdiqlangan, qancha to'lgan. Karta bog'lansa — bo'sh o'rinlar (vakansiya) va byudjet aniq ko'rinadi.
**Variantlar:**
- A) Ha — karta штат-reja birligiga bog'lanadi (tasdiqlangan o'rin vs to'lgan), byudjet/vakansiya ko'rinadi — to'liq planlash
- B) Karta штат-rejadan mustaqil — sodda, lekin byudjet bog'lanmagan
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (oylik byudjet), HR (штат-reja), Vakansiya

### Q98. Mutaxassis karta shabloni (бош технолог/конструктор/дизайн)
**Nima:** 5-Departamentda бош технолог, конструктор, дизайн kabi maxsus kartalar bor — ular tех karta/loyiha bilan ishlaydi, operator/rahbar shablonidan farqli. "Mutaxassis kartasi" shabloni alohida bo'lsinmi.
**Nega kerak:** Texnolog/konstruktor ЦКП'si "tех karta tayyorligi", statistik ko'rsatkichi boshqacha. Umumiy shablon ularga to'g'ri kelmaydi.
**Variantlar:**
- A) Ha — "mutaxassis karta" shabloni alohida (tех karta/loyiha bilan bog'langan ЦКП) — aniq
- B) Bitta umumiy shablon hamma uchun — sodda
- C) Keyin — hozir kerak emas

### Q99. Karta holatlari — to'liq ro'yxat (kitob hayot-sikli bilan)
**Nima:** Karta qanday holatlardan o'tadi — qoralama (yozilmoqda) → tasdiqlangan (RD imzolagan) → o'qish (2-oy onboarding) → faol (imtihon o'tgan + tanishgan) → vakant → muzlatilgan → arxiv? Bu status ro'yxati zavod onboarding bosqichlari bilan qotirilsinmi.
**Nega kerak:** Mavjud Q41 5 ta holat beradi, lekin zavodning "o'qish/imtihon" bosqichi (2-oy) yo'q. Onboarding bosqichi statusga kiritilsa — oylik bosqichma-bosqich ochiladi, "faol" faqat imtihondan keyin.
**Variantlar:**
- A) Ha — onboarding bosqichlari (o'qish→imtihon→faol) status ro'yxatiga qo'shiladi — zavod tartibiga mos
- B) Mavjud 5 holat yetarli, onboarding alohida kuzatiladi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR onboarding, Oylik (bosqichli), Q73

### Q100. Ko'p-karta oylik yig'ish qoidasi (suiiste'molni oldini olish)
**Nima:** Bitta xodim bir nechta kartada bo'lsa (mavjud Q24), oylik aniq qanday — (a) asosiy karta to'liq + qo'shimcha kartalar belgilangan foiz (30-50%), (b) har karta to'liq oyligi qo'shiladi (yig'indi), (c) ish-soat ulushiga qarab bo'linadi?
**Nega kerak:** "Oylik=yig'indi" amalda bir kishi ikki to'liq oylik olsa zavod uchun qimmat va adolatsiz bo'lishi mumkin. Yig'ish qoidasi aniq bo'lmasa, ko'p-karta tizimi suiiste'molga ochiq.
**Variantlar:**
- A) Asosiy karta to'liq + qo'shimcha kartalar belgilangan foiz (30-50%) — adolatli, nazoratli
- B) Har karta to'liq oyligi qo'shiladi (yig'indi) — sodda, lekin qimmat
- C) Ish-soat ulushiga qarab bo'linadi — aniq, lekin soat kuzatish kerak
- D) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Payroll (yig'ish formulasi), AI (ish yuki tahlili)

### Q101. Karta shabloni — lavozim-turi bo'yicha tayyor zagotovka
**Nima:** Yangi karta yaratishda lavozim turiga qarab tayyor shablon bo'lsinmi — "operator shabloni", "bo'lim boshlig'i shabloni", "mutaxassis shabloni" — umumiy bo'limlar (умумий вазифалар, standart javobgarlik bandlari) oldindan to'lgan holda.
**Nega kerak:** Zavod yo'riqnomalari bir xil tuzilishga ega (умумий вазифалар, standart bandlar deyarli bir xil). Shablon bo'lsa, yangi karta tez va izchil yaratiladi.
**Variantlar:**
- A) Ha — lavozim-turi shablonlari (operator/rahbar/mutaxassis), umumiy bo'limlar oldindan to'lgan, faqat xos qism qo'shiladi — tez, izchil
- B) Har karta noldan yoziladi — moslashuvchan, lekin sekin va nomuvofiq
- C) Keyin — hozir kerak emas

---

DONE: Org-struktura / KARTALAR — 101 savol (52 granular + 49 kitob-grounded).
