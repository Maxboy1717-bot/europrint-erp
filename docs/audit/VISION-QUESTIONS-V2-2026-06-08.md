# Vision Questions V2 — MASTER (kitob-grounded yangi savollar)

> Bu hujjat 20 modul bo'yicha YANGI, kitob-grounded vizyon savollarini yagona reja
> qilib birlashtiradi (yuqori darajadagi vizyondan KEYIN keladigan granular savollar).
> Har savol: **Nima** · **Nega** · **Variantlar** (A=tavsiya) + ⤳ ta'sir (qaysi modulga ta'sir qiladi) + ↳ zanjir (ergashuvchi savol).

---

## Xulosa jadvali

| # | Modul | soni |
|---|-------|------|
| 1 | Org-struktura / KARTALAR | 101 |
| 2 | HR | 52 |
| 3 | Finance / GL | 54 |
| 4 | Coordination | 105 |
| 5 | Director / Strategiya | 55 |
| 6 | SD / Sotuv | 108 |
| 7 | PP / Rejalashtirish | 105 |
| 8 | MES / Ishlab chiqarish | 52 |
| 9 | QC / Sifat | 104 |
| 10 | Ombor / WMS | 103 |
| 11 | MM / Ta'minot | 104 |
| 12 | LMS / Ta'lim | 55 |
| 13 | CRM | 55 |
| 14 | Marketing | 88 |
| 15 | Kanban / Vazifalar | 55 |
| 16 | IoT | 53 |
| 17 | AI | 61 |
| 18 | Bildirishnoma / Telegram | 52 |
| 19 | POS Monitor | 52 |
| 20 | Communication Center / Hujjat | 52 |
| | **JAMI** | **1466** |

---

## 1. Org-struktura / KARTALAR

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

## 2. HR

### Q102. Lavozim yo'riqnomasi 13 ta standart bo'limi (shablon)
**Nima:** Har lavozim yo'riqnomasi qat'iy 13 bo'limdan iborat: maqsad · orgsxemadagi joylashuv · malaka talablari · ish joyi/vositalari · umumiy vazifalar · lavozimga xos vazifalar · ЦКП · ko'p uchraydigan xatolar · muvaffaqiyatli harakatlar · huquqlar · javobgarlik · statistik ko'rsatkichlar · glossariy. ERP shu 13 bo'limni alohida maydon sifatida saqlasinmi?
**Nega kerak:** Kitobdagi har yo'riqnoma (Ички логистика бўлими бошлиғи) aynan shu tartibda. Agar ERP buni erkin matn ("description") sifatida saqlasa — AI baholashi, qidiruv va versiyalash ishlamaydi.
**Variantlar:**
- A) 13 bo'lim = 13 strukturali maydon (har biri alohida) — AI har bo'limni alohida o'qiydi, taqqoslaydi; lekin forma uzun
- B) 3 blok (ta'rif / vazifalar / mas'uliyat) — soddaroq, lekin "ko'p xatolar"/"muvaffaqiyatli harakatlar" yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta moduli (lavozim kartasi), AI baholash, Adaptatsiya (nazorat varaqasi shu bo'limlardan tuziladi)

### Q103. "Tasdiqlayman — direktor / Pozilov A.A." imzo bloki
**Nima:** Har yo'riqnoma yuqorisida "ТАСДИҚЛАЙМАН EUROPRINT KOKAND МЧЖ директори Позилов А.А." imzo bloki, pastda "tasdiqlovchi mas'ul shaxs" + "yo'riqnoma bilan tanishdim" imzolari (FIO + sana). ERP elektron tasdiq/imzo oqimini saqlasinmi?
**Nega kerak:** Yo'riqnoma huquqiy kuchga ega bo'lishi uchun direktor tasdig'i + xodim tanishuv imzosi shart. Hozir bu qog'ozda — ERP elektron izlanishi kerak.
**Variantlar:**
- A) Elektron imzo oqimi: direktor tasdiqlaydi → xodim "tanishdim" tugma bosadi → sana+IP loglanadi — auditga tayyor
- B) Faqat "tanishdim" checkbox (direktor tasdig'i qog'ozda qoladi) — yarim yechim
- C) Keyin — hozir kerak emas
↳ Agar A: direktor o'rniga kim tasdiqlaydi (bo'lim boshlig'i ham mumkinmi)? Variantlar: faqat direktor / direktor+HR / bo'lim boshlig'i delegatsiya bilan

### Q104. Orgsxemadagi joylashuv kodi (5-Departament, 13-bo'lim, Sektsiya)
**Nima:** Yo'riqnomada lavozim "Оргсхемадаги жойлашуви: 5-Департамент, 13-бўлим, Секция внутренней логистики" deb aniq kodlanadi. ERP bu joylashuvni Vysotskiy-7 org-daraxtiga bog'lasinmi?
**Nega kerak:** Bu yagona joy lavozimni org-strukturaga ulaydi (departament→bo'lim→sektsiya). Manager_id va vertikal hisobot shu kodga bog'liq.
**Variantlar:**
- A) Yo'riqnomadagi joylashuv = org-daraxt tuguniga FK (avtomatik bog'lanadi) — bitta haqiqat
- B) Erkin matn ("5-Departament...") — bog'lanmaydi, qidirib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (Vysotskiy-7), manager_id, vertikal hisobot zanjiri

### Q105. Malaka talablari: tajriba yillari (2–3 yil) maydoni
**Nima:** Yo'riqnoma malaka talabida "камида 2–3 йил ишлаб чиқариш ёки режалаштириш соҳасида тажриба" deb yozilgan. ERP nomzod tajriba yilini lavozim talabiga AVTOMATIK solishtirsinmi?
**Nega kerak:** Recruitment-AI nomzodni baholaganda "kerakli tajriba bormi" ni shu maydondan o'qiydi. Hozir bu matn ichida — taqqoslab bo'lmaydi.
**Variantlar:**
- A) Talab = strukturali: min_ta'lim (o'rta-maxsus/oliy) + min_tajriba_yil — AI nomzod CV bilan avto-taqqoslaydi
- B) Erkin matn talab — odam o'qiydi, AI taqqoslay olmaydi
- C) Keyin — hozir kerak emas
↳ Agar A: tajriba "majburiy" yoki "maqsadga muvofiq" (yo'riqnomada ikkalasi ham bor)? Variantlar: qattiq filtr / yumshoq ball

### Q106. Ish joyi vositalari: A-System (dasturiy ta'minot) ro'yxati
**Nima:** Yo'riqnoma "Дастурий таъминот: A-System, иш режалари, ҳисобот шакллари" deb xodim qaysi dasturlardan foydalanishini sanaydi. ERP bu ro'yxatdan kerakli tizim-ruxsatlarini (access) avtomatik hosil qilsinmi?
**Nega kerak:** Yangi xodimga aynan shu lavozim uchun kerakli dasturlar/modullarga kirish berilishi kerak — yo'riqnoma buni allaqachon aniqlagan.
**Variantlar:**
- A) Yo'riqnomadagi "vositalari" → ERP ruxsat shabloni (lavozimga kirish → onboarding paytida avto-grant) — IT zahmatsiz
- B) Faqat ma'lumot uchun ro'yxat (ruxsat qo'lda beriladi) — sekin, unutiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya / IT access, Onboarding

### Q107. ЦКП (lavozim sof mahsuloti) + "1/2/3/4-produkt" slotlari
**Nima:** Yo'riqnomada "Лавозимнинг ЦКП си: Ишлаб чиқариш учун тайёр ҳолатга келтирилган ярим тайёр маҳсулотлар" + bo'sh "1-продукт ... 4-продукт" slotlari bor. ERP har lavozimga ЦКП + 4 ta o'lchanadigan produkt saqlasinmi?
**Nega kerak:** ЦКП — lavozimning asosiy natijasi; "produktlar" — o'lchanadigan chiqishlar. Reyting/KPI shularga bog'lanadi.
**Variantlar:**
- A) ЦКП matni + 4 strukturali produkt (nom + o'lchov birligi + maqsad) — KPI avto-bog'lanadi
- B) Faqat ЦКП matni (produktlar erkin) — o'lchab bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Reyting/KPI (mavjud Q12-14), statistik ko'rsatkichlar (Q7)

### Q108. "Statistik ko'rsatkichlar" → KPI ga avto-ulanish
**Nima:** Yo'riqnoma har lavozimga statistik ko'rsatkich beradi: masalan "режа бажарилиш даражаси (%)", "кечикишлар сони", "режадан оғиш ҳолатлари сони". ERP shularni xodimning real KPI dashboardiga avtomatik o'lchasinmi?
**Nega kerak:** Bu ko'rsatkichlar allaqachon yo'riqnomada yozilgan — ERP ularni real ma'lumotdan (MES, logistika) hisoblab dashboard chiqarishi kerak.
**Variantlar:**
- A) Har ko'rsatkich = formulali metrik (manba jadval + hisoblash) → xodim kartasida real raqam — to'liq avtomatik
- B) Ko'rsatkich nomi saqlanadi, raqam qo'lda kiritiladi — yarim avtomatik
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (real ma'lumot manbai), Reyting, Dashboard

### Q109. "Ko'p uchraydigan xatolar" ro'yxati (xulq-atvor signali)
**Nima:** Yo'riqnomada lavozim bo'yicha tipik xatolar sanaladi: "режани ўз вақтида қабул қилмаслик", "иш жойини рухсатсиз ташлаб кетиш", "тозаликка эътибор бермаслик" va h.k. ERP bu ro'yxatni inspektor/AI tekshiruvining "buzilish turlari" katalogiga bog'lasinmi?
**Nega kerak:** Inspektor-menejer (mavjud Q7-9) buzilishlarni belgilaydi — yo'riqnomadagi "ko'p uchraydigan xatolar" aynan o'sha katalogning lavozimga xos qismi.
**Variantlar:**
- A) "Ko'p uchraydigan xatolar" → inspektor buzilish-katalogiga lavozimga xos band sifatida ulanadi — bir manba
- B) Faqat ma'lumot uchun (inspektor alohida katalog) — ikki joyda dublikat
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Inspektor moduli, AI baholash

### Q110. "Muvaffaqiyatli harakatlar" → ijobiy reyting signali
**Nima:** Yo'riqnomada lavozim bo'yicha to'g'ri harakatlar sanaladi: "режани олдиндан қабул қилиш", "ходимлар билан узлуксиз алоқа", "ҳисоботларни ўз вақтида тайёрлаш", "турникет карталаридан фойдаланиш". ERP bularni xodim bahosida ijobiy ball sifatida hisobga olsinmi?
**Nega kerak:** Reyting faqat jazo emas — yo'riqnoma "to'g'ri ish" namunasini ham beradi. AI xodimni shu standartga solishtiradi.
**Variantlar:**
- A) "Muvaffaqiyatli harakatlar" = ijobiy bal-mezonlari (AI/menejer belgilaydi) — adolatli reyting
- B) Faqat matn (reytingda ishlatilmaydi) — namuna yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Reyting/KPI

### Q111. Javobgarlik darajalari: moddiy / ma'naviy / qonun
**Nima:** Yo'riqnomada javobgarlik aniq: "хам моддий хам маънавий ... Ўзб.Рес мехнат, фуқаролик, ва жиноят кодексларининг ... бандларига кўра". ERP javobgarlik turini (moddiy/ma'naviy/jinoiy) strukturali saqlasinmi?
**Nega kerak:** Intizom choralari yoki nizo bo'lganda — qaysi javobgarlik turi qo'llanishi yo'riqnomadan aniqlanishi kerak.
**Variantlar:**
- A) Javobgarlik = ko'p tanlovli (moddiy/ma'naviy/intizomiy/jinoiy) + tegishli kodeks bandi maydoni — huquqiy aniqlik
- B) Erkin matn — odam o'qiydi, tizim ishlatmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Intizom moduli (Q24-27), nizo/HR-ish

### Q112. Tijorat sirini oshkor qilish — alohida bayonnoma
**Nima:** Yo'riqnomada "Корхона тижорат сирларини ошкор этганлик учун Ўзб.Рес. жиноят кодексига кўра жавобгар". ERP yangi xodimdan tijorat siri (NDA) bo'yicha alohida elektron tanishuv-imzo olsinmi?
**Nega kerak:** Tijorat siri — jinoiy javobgarlik darajasidagi masala; oddiy "tanishdim" yetmaydi, alohida hujjat kerak.
**Variantlar:**
- A) Onboarding'da alohida NDA hujjati + majburiy imzo (qabul shartiga bog'lanadi) — himoyalangan
- B) Yo'riqnoma ichidagi band bilan qoldirish — kuchsizroq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Onboarding, hujjat-arxiv

### Q113. Energiya resurs tejash (suv/gaz/svet) javobgarligi
**Nima:** Yo'riqnomada javobgarlik bandi: "Энергия ресурсларни тежалиши учун (сув, газ свет)". ERP buni xodim/bo'lim mas'uliyatiga va keyinchalik bo'lim xarajatiga bog'lasinmi?
**Nega kerak:** Egasi resurs tejashni rasman lavozim javobgarligiga kiritgan — ERP buni o'lchov yoki eslatmaga aylantirishi mumkin.
**Variantlar:**
- A) Javobgarlik bandi sifatida saqlash (hozircha o'lchovsiz, faqat mas'uliyat) — sodda, to'g'ri
- B) Bo'lim resurs-iste'moli metrikasiga bog'lash — kuchli, lekin hisoblagich kerak
- C) Keyin — hozir kerak emas

### Q114. Nazorat varaqasi (Контрольный лист) = adaptatsiya o'zagi
**Nima:** Har lavozim uchun "Назорат варақаси" bor: xodim har vazifani o'qib "_______" imzo qo'yadi, BOSHLANISH/TUGATISH sanasi yoziladi. ERP adaptatsiyani aynan shu varaqa ko'rinishida (vazifa-ro'yxat + imzo + sana) qursinmi?
**Nega kerak:** Bu egasining REAL adaptatsiya mexanizmi — har band bo'yicha tasdiq. Mavjud "onboarding 90-kun" undan farqli (bu lavozim-yo'riqnoma o'qish jarayoni).
**Variantlar:**
- A) Nazorat varaqasi = elektron checklist (har band → "o'qidim" + sana+imzo) yo'riqnomadan avto-generatsiya — qog'ozni almashtiradi
- B) Bitta "yo'riqnomani o'qidim" checkbox — soddalashtirilgan, lekin band-band nazorat yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Onboarding (Q1-3), AI baholash
↳ Agar A: varaqa avtomatik yo'riqnomadagi har "lavozimga xos vazifa"dan tuzilsinmi? Variantlar: avto-generatsiya / qo'lda tuzish

### Q115. Nazorat varaqasi: BOSHLANISH va TUGATISH sanasi
**Nima:** Varaqada "БОШЛАНИШ САНАСИ ___ / ТУГАТИШ САНАСИ ___" maydonlari bor — o'qish jarayoni vaqt bilan o'lchanadi. ERP adaptatsiya muddatini shu ikki sanadan hisoblasinmi va kechiksa ogohlantirsinmi?
**Nega kerak:** Egasi adaptatsiyani boshi-oxiri bilan rasmiylashtirgan. ERP "muddatida tugamadi" ni aniqlashi kerak.
**Variantlar:**
- A) Boshlanish/tugatish sana + muddat o'tib ketsa rahbarga ogohlantirish — nazorat ishlaydi
- B) Faqat sana saqlash (ogohlantirishsiz) — passiv
- C) Keyin — hozir kerak emas

### Q116. Nazorat varaqasi 1-bo'lim: ta'rif bandlari imzosi
**Nima:** Varaqaning BIRINCHI BO'LIMIda xodim alohida tasdiqlaydi: "Лавозимнинг мақсадини ўқидим", "Оргсхемадаги жойлашувни ўқидим", "Малака талабларини ўқидим", "Иш воситаларини ўқидим", "ЦКП ни ўқидим". ERP shu majburiy 5+ tasdiq bandini saqlasinmi?
**Nega kerak:** Adaptatsiya faqat vazifani emas, lavozim TA'RIFINI ham o'qishni talab qiladi — varaqa buni band-band ajratgan.
**Variantlar:**
- A) 1-bo'lim (ta'rif) + 2-bo'lim (vazifalar) ajratilgan checklist — to'liq mos
- B) Hammasini bitta ro'yxatga qo'shish — soddaroq, tuzilma yo'qoladi
- C) Keyin — hozir kerak emas

### Q117. Nazorat varaqasi yakuniy topshiriq: A/B/D keys-savol
**Nima:** Varaqa oxirida har vazifa bo'yicha amaliy keys bor (masalan: "qog'oz tex-kartaga mos kelmadi — nima qilasiz? A) baribir chiqaraman B) to'xtataman C) uchastka ixtiyoriga qoldiraman") + "nima uchun shu tanlovni qildingiz, izohlang". ERP bu keys-testni saqlab, javobni baholasinmi?
**Nega kerak:** Bu egasining REAL bilim-tekshiruvi — xodim faqat o'qibgina qolmasdan, to'g'ri qaror qila olishini isbotlaydi. AI izohni baholashi mumkin.
**Variantlar:**
- A) Keys-savol (variant + ochiq izoh) → AI/rahbar baholaydi → adaptatsiya o'tish-o'tmasligiga ta'sir qiladi — kuchli filtr
- B) Faqat variant tanlash (izohsiz, AI bahosiz) — yuzaki
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI baholash, Sinov muddati natijasi (mavjud Q17)

### Q118. Glossariy (lug'at) har yo'riqnomaga majburiy
**Nima:** Har yo'riqnoma/varaqa oxirida GLOSSARIY bor (рохлер, ярим тайёр маҳсулот, турникет, A-System, бекор туриш ...) — "ходим тушунмаса луғатга мурожаат қилиши шарт". ERP har lavozim uchun glossariyni saqlab, xodimga ko'rsatsinmi?
**Nega kerak:** Egasi atamalarni tushunishni majburiy qilgan — glossariysiz yangi xodim yo'riqnomani noto'g'ri tushunadi.
**Variantlar:**
- A) Glossariy = lavozimga bog'langan atama-lug'at (umumiy + lavozimga xos), o'qishda tooltip — tushunish kafolatlanadi
- B) Umumiy korxona lug'ati (lavozimga xos atama yo'q) — yetarli emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Darslik/LMS, AI baholash

### Q119. Yo'riqnomadagi vazifa → darslik bog'lanishi ("Qog'oz turlarini bilishi kerak")
**Nima:** Yo'riqnomada "Қоғоз турларини билиши керак", "Гофра турларини билиши керак" kabi BILIM-vazifalar bor; varaqada ular uchun batafsil o'quv matni (toplayner, makulatura, 3/5 qavatli gofra) beriladi. ERP har bilim-vazifaga darslikni bog'lasinmi?
**Nega kerak:** Memory'dagi "darslik kartaga (xodimga emas)" tamoyili — yo'riqnomadagi har bilim-vazifa o'z darsligiga ega bo'lishi kerak.
**Variantlar:**
- A) Har bilim-vazifa → darslik moduli (matn+misol+keys) bog'lanadi — karta-markazli model bilan mos
- B) Darslik alohida (vazifaga bog'lanmaydi) — uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta model, LMS/darslik, Adaptatsiya

### Q120. Turniket karta (kirish-chiqish) → tabel integratsiyasi
**Nima:** Glossariyda "Турникет — кириш-чиқишни назорат қиладиган электрон тизим, ходим махсус карточка орқали фойдаланади"; muvaffaqiyatli harakatda "турникет карталаридан фойдаланиш" bor. ERP turniket o'qishlarini davomat (tabel) bilan bog'lasinmi?
**Nega kerak:** Tabel hozir Excel'da qo'lda yuritiladi (Iyun ishchilar.xlsx). Turniket karta ish vaqtini avtomatik yozishi mumkin.
**Variantlar:**
- A) Turniket kirish/chiqish → avtomatik tabel (kelgan/ketgan vaqt, kechikish) — qo'l mehnati yo'qoladi
- B) Turniket faqat xavfsizlik (tabel alohida qo'lda) — hozirgi holat
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Tabel/davomat, Oylik hisoblash, Finance

### Q121. Tabel: ish kuni / ish soni / norma / kunlik % modeli
**Nima:** Fabrika tabeli (Iyun ishchilar.xlsx) shu ustunlardan iborat: "Jami ish kuni", "Jami ish soni", "Norma", "Kunlik %", "Oylik %", "Bir kunlik o'rtacha ish", "Ishlagan kuniga %". ERP tabelni aynan shu modelda qursinmi?
**Nega kerak:** Bu egasining REAL ish-hisobi — ishchi normaga nisbatan necha % bajargani oylikni belgilaydi (Iyun jadvalida "43% kuniga", "36% o'rtacha" yozilgan).
**Variantlar:**
- A) Tabel = ish_kuni + ish_soni + norma + kunlik% + oylik% (Excel ustunlariga 1:1) — egasi formati saqlanadi
- B) Faqat kelgan/ketgan kun (norma-% yo'q) — soddaroq, lekin oylik hisoblanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Oylik hisoblash (Payroll), MES (ish soni manbai), Finance

### Q122. Norma → bajarish % → oylik bog'lanishi (ishbay)
**Nima:** Tabelda har bo'lim/operatsiya uchun NORMA bor (oddiy lak / vib lak / avtokley / GTO / oynakcha / rezka ...) va xodim normaga nisbatan necha % bajargani hisoblanadi. ERP oylikni shu bajarish %iga bog'lasinmi (ishbay tizim)?
**Nega kerak:** Fabrikada ishbay (sdelnaya) tizim — "Norma oddiy lak", "Norma Vib lak" ustunlari bor. Oylik faqat soat emas, bajarilgan ish-norma bilan o'lchanadi.
**Variantlar:**
- A) Operatsiya-norma katalogi + xodim faktik bajarish → oylik avto-hisob (ishbay) — egasi modeliga mos
- B) Faqat soatbay (norma hisobga olinmaydi) — fabrika realiyasiga zid
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Payroll, MES (operatsiya fakti), Production (norma)

### Q123. Operatsiya turlari katalogi (lak/kley/tigel/oynakcha/rezka...)
**Nima:** Tabel/bandlik fayllarida operatsiya turlari sanaladi: avtokley, GTO, kley, oynakcha, paypoq, rezka, samokley, skleyka, tigel, kichik tigel, laminatsiya, laklash, viborochniy lak, archish, sanash, qadoqlash va h.k. ERP bularni yagona "operatsiya turlari" master-katalogi qilsinmi?
**Nega kerak:** Har operatsiya o'z normasi, narxi va xodim biriktirilishiga ega. Bu katalog HR (xodim qaysi operatsiyani biladi) va Production (yo'nalish) o'rtasidagi ko'prik.
**Variantlar:**
- A) Operatsiya turlari = master-katalog (nom + norma + birlik), HR va Production undan foydalanadi — bitta manba
- B) HR va Production alohida ro'yxat — dublikat, drift
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production (yo'nalish/routing), Tabel, Payroll, xodim-malaka

### Q124. Xodim → operatsiya malakasi (kim qaysi ishni bajara oladi)
**Nima:** Bandlik.xlsx da har xodim ismi ostida u bajara oladigan operatsiyalar bor (Karobka kleylash, Oynakcha yopishtirish, Laminatsiya, Archish, Sanash, Tagini kleylash...). ERP har xodimga "bajara oladigan operatsiyalar" ro'yxatini saqlasinmi?
**Nega kerak:** Smena rejalashtirish va ish taqsimoti shu malakaga bog'liq — kim qaysi dastgohga/operatsiyaga qo'yilishi mumkinligini bilish kerak.
**Variantlar:**
- A) Xodim-operatsiya malaka matritsasi (kim nimani biladi + daraja) — rejalashtirish avtomatlashadi
- B) Faqat lavozim (operatsiya darajasida emas) — qo'pol, smena tuzib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Smena/rejalashtirish, Production, Org-karta (razryad)

### Q125. Intizom buzilishi turlari katalogi (master-data)
**Nima:** Yo'riqnomada intizom buzilishlari nazarda tutilgan: "иш жойини рухсатсиз ташлаб кетиш", "иш вақтида бошқа ишлар билан банд бўлиш", "тозаликка эътибор бермаслик", "меҳнат интизомига риоя қилмаслик". ERP intizomiy buzilish turlarini katalog qilsinmi?
**Nega kerak:** Intizom chorasi qo'llashdan oldin buzilish turini aniqlash kerak — yo'riqnoma allaqachon tipik buzilishlarni sanagan.
**Variantlar:**
- A) Buzilish turlari katalogi (har biri og'irlik darajasi bilan) — adolatli, izchil
- B) Erkin matnli "izoh" maydon — taqqoslab, statistika qilib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Inspektor moduli, Reyting, Q10 javobgarlik

### Q126. Intizom chora bosqichlari (og'zaki → yozma → jarima → bo'shatish)
**Nima:** O'zRes Mehnat kodeksi bo'yicha intizom choralari bosqichli (hayfsan → yozma ogohlantirish → ishdan bo'shatish). ERP intizom chorasini bosqichli oqim sifatida yuritsinmi?
**Nega kerak:** Qonun bo'yicha bo'shatishdan oldin bosqichlar bo'lishi kerak — ERP bu ketma-ketlikni nazorat qilib, noqonuniy bo'shatishdan saqlashi mumkin.
**Variantlar:**
- A) Bosqichli chora oqimi (har bosqich = hujjat + sana + imzo, takror buzilish → keyingi bosqich) — qonuniy himoya
- B) Faqat bitta "intizom yozuvi" (bosqichsiz) — qonuniy risk
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Intizom, HR-arxiv, bo'shatish (Q33)

### Q127. Jarima (depremiya) → oylikka ta'siri
**Nima:** Fabrikada intizom buzilishi yoki brak uchun oylikdan ushlanishi mumkin (depremirovaniye). ERP jarimani oylik hisobiga rasman bog'lasinmi va sababini yozsinmi?
**Nega kerak:** Hozir bu og'zaki/qo'lda bo'lishi mumkin — ERP jarimani hujjatlashtirib, oylik bilan bog'lasa, nizo kamayadi.
**Variantlar:**
- A) Jarima = hujjatlangan yozuv (sabab + summa/% + tasdiq) → oylik avto-kamayadi — shaffof
- B) Jarima oylik tashqarisida qo'lda — nizoga ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Payroll, Intizom, Finance

### Q128. Brak (nuqson) → mas'ul xodim → javobgarlik
**Nima:** Tabel/zakaz fayllarida "Брак сони" ustuni bor — har buyurtmada brak hisoblanadi. ERP brakni mas'ul operator/smenaga bog'lab, javobgarlik/jarimaga ulasinmi?
**Nega kerak:** Yo'riqnomada "маҳсулот бракка чиқиши" javobgarlik holati. Brakni kim qilgani aniqlanmasa, takrorlanadi.
**Variantlar:**
- A) Brak yozuvi → operator/smena FK → sabab → (ixtiyoriy) javobgarlik/jarima — manzilli mas'uliyat
- B) Brak faqat umumiy son (mas'ulsiz) — sababini topib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), MES, Intizom, Payroll

### Q129. Mehnat shartnomasi turlari (muddatli / muddatsiz / sinov)
**Nima:** Yo'riqnomada "Меҳнат шартномаси ва корхона қоидаларида белгиланган ҳуқуқлар" eslatiladi. ERP shartnoma turini (muddatsiz / muddatli / mavsumiy / sinov muddatli) saqlab, muddatini kuzatsinmi?
**Nega kerak:** Shartnoma turi huquqlar, ta'til, bo'shatish tartibini belgilaydi. Muddatli shartnoma tugashi oldindan ogohlantirilishi kerak.
**Variantlar:**
- A) Shartnoma turi + boshlanish/tugash sanasi + tugashdan oldin ogohlantirish — muddat nazorati
- B) Faqat "ishga olingan sana" (tur/muddat yo'q) — muddatli shartnoma kuzatilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR-arxiv, bo'shatish (Q33), Q4 malaka

### Q130. Xodim hujjatlari ro'yxati + amal qilish muddati
**Nima:** Yangi xodim hujjatlari: pasport, ta'lim diplomi, sog'liq ma'lumotnomasi (sanitar kitobcha), mehnat daftarchasi, NDA. ERP shu hujjatlarni saqlab, muddati o'tadiganlarini (masalan sanitar kitobcha) eslatsinmi?
**Nega kerak:** Oziq-ovqat qadoqlash fabrikasida (Benazir/Panda/tort qutilari) sanitar talab muhim — muddati o'tgan sog'liq hujjati xavf.
**Variantlar:**
- A) Hujjat ro'yxati + amal muddati + tugashdan oldin ogohlantirish — talabga muvofiq
- B) Faqat fayl-yuklash (muddat kuzatuvisiz) — muddat o'tib ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Onboarding, HR-arxiv, Sifat (sanitar talab)

### Q131. Ta'til turlari va balansi (yillik / ijtimoiy / haq to'lanmaydigan)
**Nima:** O'zRes bo'yicha xodimga yillik mehnat ta'tili (kamida 21 ish kuni), o'qish ta'tili, ijtimoiy ta'til, haq to'lanmaydigan ta'til tegishli. ERP ta'til turlarini va qolgan balansni yuritsinmi?
**Nega kerak:** Hozir ta'til og'zaki/qog'ozda. ERP ta'til balansini, ariza-tasdiq oqimini va tabelga ta'sirini ko'rsatishi kerak.
**Variantlar:**
- A) Ta'til turlari + balans + ariza→tasdiq oqimi → tabelga avto-aks etadi — to'liq
- B) Faqat ta'til arizasi (balanssiz) — qoldiq kuzatilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Tabel/davomat, Payroll, Q31 ariza oqimi

### Q132. Ta'til/ruxsat arizasi tasdiq zanjiri (kim tasdiqlaydi)
**Nima:** Ta'til yoki bir kunlik ruxsat (otgul) arizasi kim orqali tasdiqlanadi? ERP arizani vertikal zanjir bo'ylab (bevosita rahbar → bo'lim boshlig'i → HR) yuborsinmi?
**Nega kerak:** Org-strukturada manager_id bor (Vysotskiy-7). Ariza shu zanjir bo'ylab borishi kerak — hozir bog'lanmagan.
**Variantlar:**
- A) Ariza → bevosita rahbar (manager_id) → bo'lim boshlig'i → HR (zanjir org-strukturadan) — avtomatik marshrutlash
- B) To'g'ridan-to'g'ri HR ga (rahbar o'tkazib yuboriladi) — nazorat zaif
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id), Koordinatsiya/workflow

### Q133. Bir kunlik ruxsat / kech kelish (otgul, kechikish hisobi)
**Nima:** Tabelda kechikish va kam ishlangan kunlar % bilan hisoblanadi. ERP bir kunlik ruxsat (otgul) va kechikishni alohida kategoriya sifatida yuritib, oylikka ta'sirini ko'rsatsinmi?
**Nega kerak:** "Ishlagan kuniga %", "kunlik 39% ishlangan" kabi ko'rsatkichlar tabelda bor — ruxsat va kechikish bularni o'zgartiradi.
**Variantlar:**
- A) Davomat statuslari katalogi (ishladi/ta'til/otgul/kasallik/kechikdi/kelmadi) → har biri oylikka boshqacha ta'sir — aniq hisob
- B) Faqat kelди/kelmadi (sabab kategoriyasiz) — qo'pol, adolatsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Tabel, Payroll

### Q134. Ishdan bo'shatish jarayoni (oqim + obxod-list)
**Nima:** Xodim ishdan bo'shaganda: ariza/buyruq → mol-mulk topshirish → ombor/IT/kassa hisob-kitobi → oxirgi oylik → mehnat daftarchasi qaytarish. ERP bo'shatishni bosqichli "obxod varaqasi" (bypass sheet) sifatida yuritsinmi?
**Nega kerak:** Bo'shatishda xodim qarzdormi (mol-mulk, avans) — tekshirilmasa zarar. Egasi turniket/A-System/rohler kabi resurslarni topshirishni nazorat qiladi.
**Variantlar:**
- A) Bo'shatish oqimi + obxod-list (ombor/IT/kassa/turniket-karta qaytarish har biri tasdiq) → oxirgi oylik shulardan keyin — himoyalangan
- B) Faqat bo'shatish sanasi (topshirish nazoratsiz) — qarz/yo'qotish riski
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (mol-mulk), Payroll (oxirgi hisob), IT access, Finance

### Q135. Bo'shatish sababi statistikasi (turnover tahlili)
**Nima:** Xodim nima uchun ketdi (o'z xohishi / intizom / qisqartirish / shartnoma tugashi / boshqa joyga)? ERP bo'shatish sababini katalog qilib, fluktuatsiya (turnover) tahlili bersinmi?
**Nega kerak:** Qaysi bo'lim/lavozimda ko'p xodim ketishini bilish HR uchun muhim — sababsiz buni aniqlab bo'lmaydi.
**Variantlar:**
- A) Bo'shatish sababi katalogi → bo'lim/lavozim bo'yicha turnover dashboard — strategik ko'rinish
- B) Faqat "bo'shatildi" (sababsiz) — tahlil yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR dashboard, Recruitment (qayta yopish)

### Q136. Lavozim bo'sh o'rni (vakansiya) → recruitment ulanishi
**Nima:** Xodim ketganda yoki yangi lavozim ochilganda — bo'sh o'rin (vakansiya) paydo bo'ladi. ERP org-kartadagi bo'sh lavozimni avtomatik vakansiyaga aylantirib, recruitment'ga uzatsinmi?
**Nega kerak:** Org-karta-markazli modelda (memory) karta asosiy — kartada xodim yo'q bo'lsa = vakansiya. Bu recruitment'ni avto-ishga tushirishi kerak.
**Variantlar:**
- A) Bo'sh karta → avto-vakansiya → recruitment pipeline (yo'riqnoma talablari bilan e'lon) — uzluksiz
- B) Vakansiya qo'lda ochiladi (kartaga bog'lanmaydi) — uzilgan, kechikadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta, Recruitment (mavjud Q15-16)

### Q137. Yo'riqnoma versiyalash (lavozim o'zgarganda)
**Nima:** Lavozim vazifasi yoki ЦКП o'zgarsa, yo'riqnoma yangilanadi. ERP yo'riqnomaning versiyalarini (kim, qachon, nima o'zgartirdi) saqlab, eski xodimlardan qayta tanishuv olsinmi?
**Nega kerak:** Yo'riqnoma o'zgarsa, xodim eski versiyaga imzo qo'ygan — yangi versiyaga qayta tanishuv kerak, aks holda javobgarlik bahsli.
**Variantlar:**
- A) Versiyalash + o'zgarganda barcha egal xodimlarga qayta-tanishuv talabi — huquqiy toza
- B) Faqat oxirgi versiya (tarix yo'q) — eski imzo bahsli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta, Adaptatsiya, HR-arxiv

### Q138. Bir xodim — bir nechta lavozim/operatsiya (universal ishchi)
**Nima:** Iyun jadvallarida ko'rinadiki bir ishchi turli operatsiyalarda ishlaydi (lak + vib lak; yoki bir nechta qadoqlash turi). ERP bir xodimni bir nechta lavozim/operatsiyaga (asosiy + qo'shimcha) bog'lasinmi?
**Nega kerak:** Fabrikada universal ishchilar bor — bitta lavozimga qotirib qo'yilsa, real ish-taqsimoti aks etmaydi.
**Variantlar:**
- A) Asosiy lavozim + qo'shimcha operatsiyalar (har biri o'z normasi/oyligi bilan) — moslashuvchan
- B) Qat'iy bitta lavozim — real holatga zid
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Tabel, Payroll, Org-karta, Q23 malaka

### Q139. Smena tarkibi (kunduzgi/tungi) + smena boshlig'i
**Nima:** Zakaz va tabel fajllarida "смена", "ден/ноч" (kunduz/tun) bor — fabrika smenalarda ishlaydi. ERP smenalarni (kunduz/tun), smena tarkibini va smena boshlig'ini yuritsinmi?
**Nega kerak:** Vysotskiy-7 da vertikal "Operator → Smena → Bo'lim" bor. Smena — real boshqaruv bo'g'ini, lekin hozir qurilmagan.
**Variantlar:**
- A) Smena = guruh (kunduz/tun + boshliq + a'zolar) → tabel/ish smenaga bog'lanadi — vertikal to'liq
- B) Smena faqat tabel ustuni (boshqaruvsiz) — bo'g'in yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (Vysotskiy-7), MES, Tabel

### Q140. Tabel davri (oylik) yopilishi va oylikка topshirish
**Nima:** Tabel oylik yuritiladi ("Iyun ishchilar", "Oy norma", "Jami oylik %"). ERP tabel davrini (oy) yopib, natijani oylik hisobiga uzatsinmi (idempotent)?
**Nega kerak:** Oy oxirida tabel yopilib, oylik shundan hisoblanadi. Yopilgandan keyin o'zgarmasligi (qulf) kerak — aks holda oylik buziladi.
**Variantlar:**
- A) Tabel davri = yopiladi (qulf) → oylik hisobiga uzatiladi → keyin o'zgartirish faqat tuzatma bilan — moliyaviy ishonch
- B) Tabel doim ochiq (qulfsiz) — o'tgan oy o'zgarib, oylik buziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Payroll (oylik yopilishi), Finance, Audit

### Q141. AI: xodim ↔ yo'riqnoma muvofiqligini baholash (hisobot)
**Nima:** Memory'dagi vizyon: "har kartada o'z AI'si — xodim↔karta mosligini baholaydi, hisobot yozadi". ERP AI xodimning real natijasini (tabel %, brak, intizom, nazorat-varaqa keys-javoblari) yo'riqnoma talablari bilan solishtirib hisobot bersinmi?
**Nega kerak:** Bu — egasining markaziy vizyoni. AI faqat yo'riqnoma matni va real ma'lumot bo'lsa ishlaydi (Q1, Q7, Q16).
**Variantlar:**
- A) Lavozim-AI: yo'riqnoma (talab/ЦКП/statistika) + xodim fakti → muvofiqlik bahosi + matn hisobot — vizyonga to'liq mos
- B) AI faqat raqamli reyting (matn hisobotsiz) — sayoz, "nega" yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya, Reyting, Org-karta

### Q142. Lavozimlararo AI muloqoti (yo'riqnomadagi "bo'limlar bilan aloqa")
**Nima:** Yo'riqnomada vazifa: "Ишлаб чиқариш, режалаштириш, омбор ... билан доимий алоқа ва ҳамкорлик". Memory vizyoni: "AI'lar o'zaro ishlaydi". ERP lavozim-AI'lari yo'riqnomada belgilangan bog'liq bo'limlar bilan avtomatik muloqot qilsinmi?
**Nega kerak:** Yo'riqnoma har lavozimning kim bilan aloqada bo'lishini aniqlagan — bu gorizontal workflow uchun tayyor xarita.
**Variantlar:**
- A) Yo'riqnomadagi "aloqa qiladigan bo'limlar" → gorizontal workflow_rules ga avto-ulanadi (AI-AI signal) — vizyon mos
- B) Aloqa faqat matn (avtomatlashmagan) — qo'lda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (gorizontal workflow), AI Integratsiya

### Q143. Xodim shaxsiy kabineti (o'z yo'riqnomasi + KPI + tabel)
**Nima:** Xodim o'z yo'riqnomasini, nazorat-varaqa holatini, tabel %ini, reytingini, ta'til balansini bitta shaxsiy kabinetda ko'rsinmi?
**Nega kerak:** Xodim o'z talablari va natijasini ko'rmasa — o'sishni o'lchay olmaydi. Memory: "razryad→talab→o'sish→oylik" — xodim buni ko'rishi kerak.
**Variantlar:**
- A) Shaxsiy kabinet (yo'riqnoma + adaptatsiya + tabel + reyting + ta'til + oylik) — shaffof, motivatsiya
- B) Faqat HR ko'radi (xodim ko'rmaydi) — yopiq, motivatsiya past
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Reyting, Tabel, Payroll, Adaptatsiya

### Q144. Razryad (malaka darajasi) o'sish jarayoni + qayta attestatsiya
**Nima:** Memory: "razryad→talab→o'sish→oylik". Yo'riqnomada malaka talablari bor. ERP razryadni oshirish jarayonini (ariza/attestatsiya → keys-test → tasdiq → oylik o'zgarishi) yuritsinmi?
**Nega kerak:** Razryad o'sishi oylikni o'zgartiradi — bu hujjatlangan, baholangan jarayon bo'lishi kerak, og'zaki emas.
**Variantlar:**
- A) Razryad o'sish oqimi (attestatsiya + keys-test + rahbar tasdiq → oylik avto-o'zgaradi) — adolatli, hujjatlangan
- B) Razryad qo'lda o'zgartiriladi (jarayonsiz) — sub'ektiv, bahsli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Payroll, Org-karta (razryad), Reyting

### Q145. Mas'ul shaxs (yo'riqnoma tasdiqlovchi) roli
**Nima:** Yo'riqnomada "Йўриқномани тасдиқловчи масъул шахс" alohida imzo qo'yadi (direktordan tashqari). ERP bu rolni (yo'riqnoma muallifi/mas'uli) saqlab, undan so'rovsiz yo'riqnoma o'zgarishini bloklasinmi?
**Nega kerak:** Yo'riqnoma sifatiga kimdir mas'ul — har kim o'zgartira olmasligi kerak.
**Variantlar:**
- A) Yo'riqnomaga mas'ul-shaxs roli (faqat u + direktor o'zgartira oladi) — nazorat
- B) HR har qanday yo'riqnomani o'zgartiradi (mas'ulsiz) — nazorat zaif
- C) Keyin — hozir kerak emas

### Q146. Nazorat varaqasida rahbar ishtiroki (mentor-aloqa)
**Nima:** Varaqada: "Танишув жараёнида раҳбарингиз билан доимий алоқада бўлишингиз муҳим ... муаммога дуч келсангиз дарҳол хабар беринг". ERP adaptatsiya davrida xodim-rahbar aloqasini (savol/javob, bloklovchi muammo) yuritsinmi?
**Nega kerak:** Egasi adaptatsiyada rahbar ishtirokini majburiy qilgan — faqat o'qib imzo qo'yish emas, rahbar bilan muloqot.
**Variantlar:**
- A) Adaptatsiyada xodim→rahbar savol/muammo kanali (har band ostida) + rahbar javobi loglanadi — real mentorlik
- B) Faqat imzo (rahbar aloqasi kuzatilmaydi) — yuzaki
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Mentorlik (mavjud Q18-19), Adaptatsiya

### Q147. Lavozimlar reestri (yo'riqnoma bor/yo'q holati)
**Nima:** RD-5 jildida har lavozim uchun alohida jild (yo'riqnoma + nazorat varaqasi + yakuniy topshiriqlar). Lekin barcha 30+ lavozimda hammasi tayyor emas. ERP "qaysi lavozimda yo'riqnoma/varaqa/darslik tayyor, qaysisi yo'q" reestrini ko'rsatsinmi?
**Nega kerak:** Egasi 30+ lavozim uchun hujjat tayyorlayapti — qaysi biri bo'sh ekanini ko'rish ish rejasini beradi.
**Variantlar:**
- A) Lavozim reestri + tayyorlik foizi (yo'riqnoma ✓ / varaqa ✓ / darslik ✓ / keys ✓) — ish ko'rinadi
- B) Faqat lavozim ro'yxati (tayyorlik holatsiz) — nima yetishmasligi noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta, Adaptatsiya, LMS

### Q148. Yo'riqnoma → real natija "tafovut" hisoboti (xato vs amal)
**Nima:** Yo'riqnoma "ko'p uchraydigan xatolar" va "muvaffaqiyatli harakatlar" beradi; tabel/brak real natija beradi. ERP xodimning real harakatini yo'riqnoma standartiga solishtirib "qaysi xatoni qildi / qaysi to'g'ri harakatni qildi" tafovut hisobotini bersinmi?
**Nega kerak:** Q40 AI bahosining konkret ko'rinishi — xodim aynan yo'riqnomadagi qaysi bandga rioya qilmaganini ko'rsatish.
**Variantlar:**
- A) Tafovut hisoboti: yo'riqnoma bandi ↔ real harakat (mos/buzilgan) — aniq fidbek
- B) Faqat umumiy reyting (band-band emas) — "nima noto'g'ri" noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI baholash, Reyting, Inspektor

### Q149. Brigada/uchastka boshlig'i mas'uliyat zonasi
**Nima:** Yo'riqnomada bo'lim boshlig'i "логистика ходимлари ишини ташкил этиш, вазифаларни тақсимлаш" mas'uliyatiga ega — ya'ni u o'z xodimlari natijasiga javobgar. ERP rahbar dashboardida o'z bo'ysunuvchilari natijasini (jamlangan) ko'rsatsinmi?
**Nega kerak:** Vertikal mas'uliyat (Vysotskiy-7) — rahbar o'z bo'limining umumiy ko'rsatkichiga javobgar, bu uning kartasida aks etishi kerak.
**Variantlar:**
- A) Rahbar kartasi = shaxsiy + bo'ysunuvchilar jamlangan natija (bo'lim %) — vertikal javobgarlik
- B) Faqat shaxsiy natija (bo'lim aks etmaydi) — rahbar javobgarligi ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura, Reyting, Dashboard

### Q150. Ish xavfsizligi (texnika xavfsizligi) yo'riqnomasi + imzo
**Nima:** Yo'riqnomada "меҳнат хавфсизлиги талабларини бажариш", "рохлердан хавфсиз фойдаланиш" bandlari bor. ERP texnika xavfsizligi (TB) instruktajini alohida modul sifatida (instruktaj turi + sana + imzo + qayta-instruktaj muddati) yuritsinmi?
**Nega kerak:** Fabrikada dastgoh/rohler bilan ishlaydi — TB instruktaji qonuniy majburiy va davriy takrorlanadi.
**Variantlar:**
- A) TB instruktaj jurnali (kirish/birlamchi/takroriy + sana + imzo + keyingi muddat ogohlantirish) — qonuniy talab
- B) Yo'riqnoma ichidagi band bilan cheklash — yetarli emas, davriylik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Onboarding, Sifat/xavfsizlik, IoT (xavf hodisasi)

### Q151. Glossariy + atama tushunish testi (varaqa talabi)
**Nima:** Varaqa: "Агар ходим атаманинг маъносига ишонч ҳосил қилмаса луғатга мурожаат қилиши шарт". ERP adaptatsiya oxirida glossariy atamalaridan kichik tushunish-testi o'tkazsinmi (xodim atamalarni bildimi)?
**Nega kerak:** Egasi atama tushunishni majburiy qilgan — faqat "o'qidim" imzo emas, atama ma'nosini bilishini tekshirish kerak.
**Variantlar:**
- A) Glossariy → atama-test (kalit atamalar bo'yicha) adaptatsiya o'tish shartiga kiradi — bilim kafolati
- B) Glossariy faqat ko'rsatiladi (test yo'q) — o'qidi-yo'qmi noma'lum
- C) Keyin — hozir kerak emas
⤳ Ta'sir: LMS/darslik, Adaptatsiya, AI baholash

### Q152. "1 sutkalik ishlab chiqarish rejasi" → logistika/HR signal
**Nima:** Glossariyda "1 суткалик ишлаб чиқариш режаси — режалаштириш бўлими ҳар куни тузадиган 24 соатлик режа". Yo'riqnomada bo'lim boshlig'i bu rejaga tayanadi. ERP kunlik reja kelganda tegishli xodimlarga avtomatik vazifa/eslatma yuborsinmi?
**Nega kerak:** Yo'riqnomada xato: "режани ўз вақтида қабул қилмаслик". ERP rejani avto-yetkazsa, bu xato yo'qoladi.
**Variantlar:**
- A) Kunlik reja → tegishli lavozimlarga avto-signal (vazifa/eslatma) — "rejani olmadim" xatosi tugaydi
- B) Reja faqat planlash bo'limida (qo'lda tarqatiladi) — kechikish riski
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production (kunlik reja), Logistika, Koordinatsiya

### Q153. Bekor turish (prostoy) hodisasi → mas'ul lavozim → HR ta'sir
**Nima:** Glossariy: "Бекор туриш — иш вақти давом этса-да, логистика ёки бошқа сабаблар туфайли ишлаб чиқариш тўхтаб қолиши". Yo'riqnomada bo'lim boshlig'i statistik ko'rsatkichi = "кечикишлар сони". ERP bekor turishni qayd etib, sababini mas'ul lavozimga bog'lasinmi?
**Nega kerak:** Bekor turish — fabrika eng katta yo'qotishi; kim/nima sababli ekanini bilmasa, takrorlanadi va javobgarlik aniqlanmaydi.
**Variantlar:**
- A) Bekor turish hodisasi (vaqt + sabab + mas'ul lavozim) → mas'ul KPI siga ta'sir — manzilli mas'uliyat
- B) Faqat umumiy "to'xtash vaqti" (sababsiz) — tahlil va javobgarlik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Production, Reyting, Q7 statistik ko'rsatkich

DONE: HR — 52.

## 3. Finance / GL

### Q154. Режа қоғози → Бухгалтерия avtomatik ulanishi
**Nima:** Rulon omboridan berilgan/qaytarilgan qog'oz "Режа қоғози" hujjati tizimda to'ldirilib, to'g'ridan-to'g'ri Бухгалтерия (moliya) ko'rish ekraniga tushsinmi.
**Nega kerak:** Hozir qog'oz Режа қоғози qo'lda to'ldirilib bухгалтерияga topshiriladi — bu yo'qolish va kechikishga sabab; tizimda bo'lsa farq darrov ko'rinadi.
**Variantlar:**
- A) Ombor chiqim/kirim qaydidan avtomatik Режа қоғози tuziladi va moliyaga oqadi — qo'lda topshirish yo'qoladi, real vaqtli nazorat
- B) Ombor alohida to'ldiradi, moliya keyin import qiladi — ikki marta ish, kechikish saqlanadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (chiqim/kirim), MES (sarf), Coordination

### Q155. Камомад (qog'oz kamomadi) moliyaviy aks-etishi
**Nima:** Berilgan minus (ishlatilgan + qaytarilgan) = Камомад farqi topilganda, bu summa pulга aylanib moliyada qayd etilsinmi (yo'qotish/zarar sifatida).
**Nega kerak:** Kitobda Бухгалтерия aynan shu farqni nazorat qiladi deyilgan, lekin farq pulда qancha ekani ko'rinmasa, javobgarlik va zarar bahosi yo'q.
**Variantlar:**
- A) Камомад kg × qog'oz narxi = zarar summasi avtomatik hisoblanadi va smenага bog'lanadi — aniq javobgarlik, zarar ko'rinadi
- B) Faqat kg ko'rsatiladi, pulга aylantirilmaydi — moliyaviy ta'sir noma'lum qoladi
- C) Keyin
  ↳ Agar A: zararni kimga yozish kerak — A) smena rahbariga B) ishlab chiqarish bo'limiga C) umumiy yo'qotishga (egasi belgilaydi)
⤳ Ta'sir: Ombor, MES, HR (javobgarlik/KPI)

### Q156. Rejada 1200 / faktda 1500 — qaysi qiymat taннархга kiradi
**Nima:** Rulon rejada 1200 kg ko'rsatilgan, lekin amalda 1500 kg berilgan bo'lsa, mahsulot taннархига qaysi miqdor kiritiladi.
**Nega kerak:** Kitobda aynan shu vaziyat yozilgan; taннарх noto'g'ri bo'lsa, sotiш narxi ham noto'g'ri bo'ladi.
**Variantlar:**
- A) Faqat haqiqatda ishlatilgan kg (berilgan − qaytarilgan) taннархга kiradi — eng to'g'ri, real sarf
- B) Berilgan to'liq miqdor kiradi — qaytgan qog'oz zarar bo'lib ko'rinadi
- C) Reja miqdori kiradi — fakt e'tiborga olinmaydi, noto'g'ri
⤳ Ta'sir: SD (narx), PP (norma), Ombor

### Q157. Qog'oz narxini kim/qayerdan oladi (taннарх uchun)
**Nima:** Камомад va taннарх hisoblanganda qog'oz 1 kg narxi qayerdan olinadi — oxirgi kelgan Счёт-фактура narximi yoki o'rtacha narxmi.
**Nega kerak:** Bir xil qog'oz turli partiyalarda turli narxda kelgan; qaysi narx ishlatilishi taннархни belgilaydi.
**Variantlar:**
- A) O'rtacha tortilgan narx (weighted average) — barqaror, sakrash yo'q (tavsiya)
- B) FIFO (eng eski partiya narxi) — real chiqim tartibi, lekin murakkab
- C) Oxirgi kelgan narx — sodda, lekin inflyatsiyada noto'g'ri
⤳ Ta'sir: Ombor (partiya), MM (xarid)

### Q158. Счёт-фактура (kelgan rulon) tizimda ro'yxatga olinishi
**Nima:** Kelgan qog'oz rulonidagi Счёт-фактура № (yetkazib beruvchi, kg, gr, transport) tizimga kiritilib, kreditor qarz (biz to'lashimiz kerak) sifatida ro'yxatga olinsinmi.
**Nega kerak:** Kitobda kelgan qog'oz jadvalida Счёт-фактура № maydoni bor; bu yetkazib beruvchiga to'lov majburiyatining boshlanishi.
**Variantlar:**
- A) Счёт-фактура kiritilganda avtomatik kreditor qarz (AP) yoziladi — to'lov nazorati, aging boshlanadi
- B) Faqat ombor kirim qiladi, qarz keyin qo'lda yoziladi — uzilish, kechikish
- C) Keyin
⤳ Ta'sir: Ombor (kirim), MM (yetkazib beruvchi), kreditor aging

### Q159. Счёт-фактура vazni farqi (kelgan gr ╳ qabul qilingan gr) → da'vo
**Nima:** Счёт-фактурада "Кelgan gramm" bilan "Qabul qilingan gramm" farq qilsa (kam kelgan), bu farq yetkazib beruvchiga moliyaviy da'vo bo'lib qayd etilsinmi.
**Nega kerak:** Kitob jadvalida ikkala maydon alohida bor — demak farq tizimli muammo; pul yo'qotish.
**Variantlar:**
- A) Farq avtomatik hisoblanib, yetkazib beruvchi to'loviдан chegirma (da'vo) sifatida belgilanadi — pul qaytadi
- B) Faqat qayd etiladi, to'lovga ta'sir qilmaydi — yo'qotish yopiladi
- C) Keyin
⤳ Ta'sir: MM, kreditor to'lov, Ombor QC

### Q160. Станоклар норма → ish haqi/taннарх asosimi
**Nima:** "Станоклар норма" (norma штук/час) hujjati moliyada operatsiya birlik-taннархини hisoblash uchun manba bo'lsinmi.
**Nega kerak:** Bu hujjat Ген.Директор tomonidan tasdiqlangan; agar norma to'lovga ulanmasa, taннарх faqat materialни hisobga oladi, mehnatни emas.
**Variantlar:**
- A) Har stanok normasi × ish haqi stavkasi = operatsiya taннархи — to'liq taннарх (material + mehnat)
- B) Norma faqat ishlab chiqarish KPI uchun, taннархга kirmaydi — taннарх chala
- C) Keyin
⤳ Ta'sir: PP (norma), MES, HR (ish haqi), SD (narx)

### Q161. "иш йук" (ish yo'q) vaqti — bo'sh turgan stanok xarajati
**Nima:** Norма Excelда "иш йук" (3 soat ish yo'q, archishda ishladi) qayd qilingan — bo'sh turgan vaqt moliyada yo'qotilgan quvvat xarajati sifatida hisoblansinmi.
**Nega kerak:** Stanok bo'sh tursa ham amortizatsiya + ish haqi ketadi; bu "yashirin zarar" hozir hech qayerda ko'rinmaydi.
**Variantlar:**
- A) "иш йук" soatlari × stanok soatlik xarajati = yo'qotilgan quvvat hisobi (oylik hisobot) — boshqaruv ko'radi
- B) Faqat ishlab chiqarish modulида qoladi, moliyaга chiqmaydi — egasi ko'rmaydi
- C) Keyin
⤳ Ta'sir: MES, PP, boshqaruv hisoboti

### Q162. Брак (brak) va Макулатура moliyaviy hisobi
**Nima:** Kitobда "Брак kg", "Макулатура kg", "Рулон брак kg" maydonlari bor — brak/makulatura pulда yo'qotish sifatida hisoblanib, kimga bog'lansin.
**Nega kerak:** Brak = to'g'ridan-to'g'ri zarar; makulatura qisman qaytariladi (sotiladi); ikkalasi moliyaда ajratilishi kerak.
**Variantlar:**
- A) Брак = to'liq zarar, Макулатура = qisman qaytariladigan qoldiq (sotuvga) — aniq ajratish (tavsiya)
- B) Ikkalasi bir xil "chiqindi" sifatida — makulatura qiymati yo'qoladi
- C) Keyin
  ↳ Agar A: makulatura sotuvi daromad sifatida qaysi hisobga tushadi — A) asosiy daromad B) boshqa daromad C) zararни kamaytirish
⤳ Ta'sir: Ombor, QC, SD (chiqindi sotuvi)

### Q163. Гильза (gilza) qaytarish — depozit/qaytariladigan tara hisobi
**Nima:** Kitobда "Гильза" maydoni bor — rulon gilzalari qaytariladigan tara bo'lsa, depozit (qaytariladigan summa) sifatida hisoblansinmi.
**Nega kerak:** Gilza qaytarilmasa pul yo'qoladi; qaytarilsa hisob-kitob kerak.
**Variantlar:**
- A) Gilza qaytariladigan tara depoziti sifatida alohida hisoblanadi — yo'qolish ko'rinadi
- B) E'tiborga olinmaydi — kichik, lekin yig'ilib zarar
- C) Keyin
⤳ Ta'sir: Ombor, MM

### Q164. Хайдовчи/Транспорт xarajati — yetkazib berish taннархи
**Nima:** Kelgan qog'oz jadvalida "Транспорт тури", "Автомобиль №", "Хайдовчи" bor — yetkazib berish xarajati materialning kirim taннархига qo'shilsinmi.
**Nega kerak:** Transport puli material narxining bir qismi; agar alohida xarajat bo'lsa, taннарх past ko'rinadi.
**Variantlar:**
- A) Transport summasi material kirim taннархига taqsimlanadi (landed cost) — to'g'ri taннарх (tavsiya)
- B) Transport alohida umumiy xarajat — sodda, lekin taннарх chala
- C) Keyin
⤳ Ta'sir: MM (xarid), Ombor, taннарх

### Q165. Клей tayyorlash xarajati (Krустик сода, Краxмал, Бура)
**Nima:** Kitobда "Клей тайёрлаш учун: Крустик сода kg, Краxмал kg, Бура kg" bor — yelim tayyorlash uchun ketgan kimyo moliyada alohida xarajat-markazi sifatida hisoblansinmi.
**Nega kerak:** Yelim retsepti aniq nisbatda; sarf nazorat qilinmasa, ortiqcha kimyo zarari ko'rinmaydi.
**Variantlar:**
- A) Yelim tarkibiy moddalari alohida sarf-norma bilan hisoblanadi, ortiqchasi zarar — nazorat
- B) Umumiy "yordamchi material" xarajatiga qo'shiladi — detallashmagan
- C) Keyin
⤳ Ta'sir: MM, MES, taннарх

### Q166. Haftalik "berilgan xom-ashyo hisoboti" → moliya
**Nima:** Kitobда "Флексо бўлимига берилган хом ашёлар бўйича ҳисобот ҳафталик" bor — bu haftalik material sarf hisoboti moliyага avtomatik o'tib, byudjet-fakt taqqoslansinmi.
**Nega kerak:** Haftalik material sarfi moliyага ulanmasa, byudjetdan og'ish kech bilinadi.
**Variantlar:**
- A) Haftalik sarf hisoboti avtomatik moliyага tushadi, byudjet bilan taqqoslanadi — erta ogohlantirish
- B) Faqat ishlab chiqarish ko'radi — moliya kech biladi
- C) Keyin
⤳ Ta'sir: PP, Ombor, byudjet

### Q167. Buyurtmalar tahlili (listlar bo'yicha) — daromad o'sish ko'rinishi
**Nima:** Kitobда "Buyurtmalar bo'yicha tahlili (listlar bo'yicha)" + "O'sish surati 2017/2018" bor — moliyа bu ko'rsatkichni (list soni × narx = daromad) o'sish dinamikasi bilan ko'rsatsinmi.
**Nega kerak:** Egasi yil-ma-yil, oy-ma-oy daromad o'sishini ko'rishni xohlaydi (kitobда mavjud format).
**Variantlar:**
- A) Daromad dashboard: list-soni + summa, oy/yil taqqos, o'sish % — egasi uchun (tavsiya)
- B) Faqat list soni, summasiz — moliyaviy ma'no chala
- C) Keyin
⤳ Ta'sir: SD, boshqaruv hisoboti

### Q168. "Faqat bitta bo'lim ma'lumotни shakllantiradi" — moliya raqamlarining egasi
**Nima:** Оргполитика: har ma'lumotни faqat bitta bo'lim shakllantiradi. Moliyaviy raqamlar (narx, taннарх, qarz) uchun yagona ega bo'lim kim.
**Nega kerak:** Hozir narx 2 joyda (SD ╳ moliyа), taннарх noaniq; oргполитика "bitta manba" talab qiladi.
**Variantlar:**
- A) Taннарх/qarz = Бухгалтерия egaligida, sotiш narxi = SD egaligida, boshqalar faqat o'qiydi — aniq chegara (tavsiya)
- B) Hamma o'zi yozadi — chalkashlik (hozirgi muammo)
- C) Keyin
⤳ Ta'sir: Barcha modullar, master-data

### Q169. "Og'zaki ma'lumot qaror uchun asos emas" — to'lov tasdig'i hujjatsiz bo'lmasin
**Nima:** Оргполитика: og'zaki ma'lumot qaror asosi emas. To'lov/xarajat tasdig'i albatta yozma hujjatga (Счёт-фактура, shartnoma, akt) bog'lansinmi.
**Nega kerak:** Hujjatsiz to'lov = nazoratsiz pul chiqishi; oргполитика to'g'ridan-to'g'ri buni taqiqlaydi.
**Variantlar:**
- A) Har to'lov so'roviga hujjat biriktirish majburiy, bo'lmasa tasdiqlash bloklanadi — qattiq nazorat (tavsiya)
- B) Hujjat ixtiyoriy — bo'shliq qoladi
- C) Keyin
⤳ Ta'sir: ZNO, approval, hujjat ombori

### Q170. Avans hisoboti (подотчёт) — naqd berilgan pul hisoboti
**Nima:** Xodimga oldindan berilgan naqd (avans) keyin chek/akt bilan hisob berilishi (подотчёт) tizimда yuritilsinmi.
**Nega kerak:** Avanslar hisob berilmasa, "yo'qolgan" pul to'planadi; bu mumtoz moliyа nazorati.
**Variantlar:**
- A) Avans berildi → xodim chek bilan hisob beradi → qoldiq qaytariladi/qo'shiladi — to'liq tsikl (tavsiya)
- B) Faqat berilgan summa qayd etiladi, hisob yo'q — nazoratsiz
- C) Keyin
  ↳ Agar A: hisob bermagan avans muddat o'tsa nima — A) ish haqidан ushlanadi B) ogohlantirish C) bloklash
⤳ Ta'sir: HR (ish haqi), kassa, approval

### Q171. Xarajat kategoriyalari (xarajat moddalari) ro'yxati
**Nima:** Xarajatlar qanday toifalarga bo'linadi (material, mehnat, energiya, transport, ta'mir, amortizatsiya, ma'muriy...) — master-ro'yxat.
**Nega kerak:** Toifasiz xarajat tahlil qilib bo'lmaydi; byudjet ham toifa bo'yicha tuziladi.
**Variantlar:**
- A) Standart xarajat moddalari ro'yxati (sozlanadigan) — har xarajat bittasiga bog'lanadi (tavsiya)
- B) Erkin matn — tahlil imkonsiz
- C) Keyin
⤳ Ta'sir: Byudjet, hisobotlar, GL

### Q172. Energiya (elektr/gaz/suv) xarajati — stanokка taqsimlash
**Nima:** Elektr/gaz xarajati har stanok ish soatiga taqsimlanib, operatsiya taннархига kirsinmi.
**Nega kerak:** Bosma stanoklari (SM-52/72, KBA-105, гофра линия) ko'p energiya yeydi; taqsimlanmasa taннарх noto'g'ri.
**Variantlar:**
- A) Stanok soatlik energiya quvvati × ish soati → taннархга taqsim — aniq taннарх
- B) Umumiy ma'muriy xarajat sifatida — taннарх chala
- C) Keyin
⤳ Ta'sir: MES (soat), taннарх, byudjet

### Q173. Stanok amortizatsiyasi — asosiy vositalar reestri
**Nima:** Stanoklar (KBA-105, гофра линия, тигель 1-10...) asosiy vositalar reestrida amortizatsiya bilan yuritilsinmi.
**Nega kerak:** Amortizatsiya taннархнинг bir qismi; reestr bo'lmasa, eskirish va almashtirish rejasi yo'q.
**Variantlar:**
- A) Har stanok asosiy vosita kartochkasi: qiymat, amortizatsiya muddati, oylik amortizatsiya — to'liq (tavsiya)
- B) Faqat ro'yxat, amortizatsiyasiz — moliyaviy ma'no chala
- C) Keyin
⤳ Ta'sir: MES (jihoz), taннарх, soliq

### Q174. Valyuta — import xom-ashyo (qog'oz/kimyo) valyutada
**Nima:** Qog'oz/kimyo importда valyutada (USD/EUR) kelsa, tizim valyuta kursini yuritib, so'mда hisoblasinmi.
**Nega kerak:** Import material narxi kursга bog'liq; kurs farqi taннархни o'zgartiradi.
**Variantlar:**
- A) Ko'p valyuta + kun kursi → so'mда avtomatik, kurs farqi alohida hisob — to'g'ri (tavsiya)
- B) Faqat so'm, kursni qo'lda kiritish — xatolik, eskirgan kurs
- C) Keyin
⤳ Ta'sir: MM (import), kreditor, taннарх

### Q175. Kreditor (yetkazib beruvchi) to'lov muddati — Счёт-фактура shartlari
**Nima:** Har yetkazib beruvchining to'lov muddati (masalan 30 kun, oldindan, yetkazgach) Счёт-фактурага bog'lanib, aging shu muddatdan boshlansinmi.
**Nega kerak:** Hozir aging faqat sana bo'yicha; lekin shartnoma muddati har xil — kechikkan to'lov pени keltiradi.
**Variantlar:**
- A) Har yetkazib beruvchi to'lov muddati profili → aging muddatga nisbatan hisoblanadi — aniq (tavsiya)
- B) Hammaga bir xil muddat — ba'zi to'lovlar noto'g'ri "kechikkan" ko'rinadi
- C) Keyin
⤳ Ta'sir: MM, aging, ZNO

### Q176. Soliqlar (QQS/НДС) — Счёт-фактурада ajratish
**Nima:** Kelgan/chiqgan Счёт-фактурада QQS (НДС) alohida ajratilib, hisobга olinadigan soliq (kirim QQS) sifatida yuritilsinmi.
**Nega kerak:** QQS to'g'ri ajratilmasa, soliq hisobi noto'g'ri; davlatga ortiqcha/kam to'lov.
**Variantlar:**
- A) Har fakturada QQS stavkasi + summasi ajratiladi, kirim/chiqim QQS reestri — soliq tayyor (tavsiya)
- B) QQS umumiy summага qo'shilgan — soliq hisobi qo'lda
- C) Keyin
⤳ Ta'sir: SD (chiqim faktura), MM (kirim faktura), soliq hisoboti

### Q177. Mehnat haqi soliqlari (ИНПС/ЖШДС) → moliya GL ulanishi
**Nima:** HR payroll hisoblagan ИНПС/ЖШДС/ish haqi summalar moliя GL ga (kreditor: davlat, xodim) avtomatik yozilsinmi.
**Nega kerak:** Ish haqi eng katta xarajatlardan; HR ╳ moliя uzilsa, GL chala.
**Variantlar:**
- A) Payroll yopilganda avtomatik GL: xarajat (ish haqi) + kreditor (soliq, xodim) — yagona daftar (tavsiya)
- B) Moliя qo'lda kiritadi — ikki marta ish, xato
- C) Keyin
⤳ Ta'sir: HR (payroll), GL, soliq

### Q178. To'lov usuli (naqd / plastik / o'tkazma / o'zaro hisob)
**Nima:** To'lov qaysi usulда amalga oshgani (naqd kassa, bank o'tkazma, plastik, o'zaro hisob/barter) tizimда ajratilsinmi.
**Nega kerak:** Har usul boshqacha hisob va nazorat talab qiladi; naqd ayniqsa qattiq nazoratда.
**Variantlar:**
- A) To'lov usuli majburiy maydon, har usul o'z hisobiga (kassa/bank) bog'lanadi — aniq (tavsiya)
- B) Faqat summa, usul yo'q — naqd nazorati zaif
- C) Keyin
⤳ Ta'sir: Kassa, bank, ZNO

### Q179. Bir nechta bank hisobi (so'm/valyuta) — qoldiq ko'rinishi
**Nima:** Kompaniyaning bir nechta bank hisobi (so'm, valyuta, har xil bank) bo'lsa, har birining real-time qoldig'i moliyа ekranida ko'rinsinmi.
**Nega kerak:** Egasi qaysi hisobда qancha pul borligini bir joydan ko'rishi kerak (to'lov rejasi uchun).
**Variantlar:**
- A) Har bank hisobi alohida, umumiy qoldiq dashboard — to'lov rejasi aniq (tavsiya)
- B) Bitta umumiy qoldiq — qaysi hisobда yetishmasligi ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Kassa, ZNO, byudjet

### Q180. To'lov kalendari (kun bo'yicha kirim/chiqim prognozi)
**Nima:** Yaqin kunlarда qaysi to'lovlar kelishi (debitor) va qaysilar to'lanishi (kreditor) kerakligi kalendarда ko'rinsinmi (cash-flow prognoz).
**Nega kerak:** Pul yetmasligi (kassa bo'shligi) oldindan ko'rinmasa, to'lovlar uziladi.
**Variantlar:**
- A) Kun bo'yicha kirim/chiqim kalendari + qoldiq prognozi — bo'shliq oldindan ko'rinadi (tavsiya)
- B) Faqat o'tgan to'lovlar — prognoz yo'q
- C) Keyin
⤳ Ta'sir: Aging, ZNO, byudjet

### Q181. Debitor (mijoz qarzi) limiti — SD ga bog'lash
**Nima:** Har mijozга qarz limiti (kredit chegarasi) belgilanib, limit oshganда yangi buyurtma SD da bloklansinmi.
**Nega kerak:** Limitsiz mijoz cheksiz qarzga oladi, keyin to'lamaydi — pul muzlaydi.
**Variantlar:**
- A) Mijoz kredit limiti → oshса SD buyurtmasi bloklanadi/tasdiqга chiqadi — risk nazorati (tavsiya)
- B) Limit yo'q, faqat aging ko'rsatadi — kech bilinadi
- C) Keyin
⤳ Ta'sir: SD, CRM, aging
  ↳ Agar A: limitни kim oshira oladi — A) faqat egasi B) moliя rahbari C) sotiш rahbari

### Q182. Qisman to'lov va to'lovni fakturalarga taqsimlash
**Nima:** Mijoz bir nechta fakturани qoplab bitta summа to'lasa, bu to'lov qaysi fakturаларга qanday taqsimlanishi tizimда boshqarilsinmi.
**Nega kerak:** Taqsimsiz qaysi faktura yopilgani noaniq; aging buziladi.
**Variantlar:**
- A) To'lov fakturаларга qo'lда/avtomatik (eng eski avval) taqsimlanadi — aniq aging (tavsiya)
- B) Umumiy balansга qo'shiladi, faktura darajasiz — aging chala
- C) Keyin
⤳ Ta'sir: SD, aging, debitor

### Q183. Пеня/jarima — kechikkan to'lovga
**Nima:** Mijoz to'lovni kechiktirса pени (jarima foizi), yoki biz yetkazib beruvchiga kechiksak — shartnoma bo'yicha pени hisoblansinmi.
**Nega kerak:** Pени hisoblanmasa, kechikish "bepul" bo'lib, intizom yo'qoladi.
**Variantlar:**
- A) Shartnomага ko'ra pени foizi avtomatik hisoblanadi (kechikkan kun × stavka) — intizom (tavsiya)
- B) Pени qo'lда, kerak bo'lganда — ko'pincha unutiladi
- C) Keyin
⤳ Ta'sir: SD, aging, kreditor

### Q184. Inventarizatsiya farqi (ombor sanоq) → moliya
**Nima:** Ombor inventarizatsiyasida (kitobда "инвентаризация" tilga olinган) topilgan ortiqcha/kamomad moliyага avtomatik tuzatma (zarar/daromad) sifatida o'tsinmi.
**Nega kerak:** Sanoq farqi pulда aks etmasa, ombor qiymati noto'g'ri, taннарх xato.
**Variantlar:**
- A) Sanoq farqi avtomatik GL tuzatmasi (kamomad=zarar, ortiqcha=daromad) — ombor qiymati to'g'ri (tavsiya)
- B) Faqat ombor tuzatadi, moliя bilmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Ombor, GL, taннарх

### Q185. Davr yopish (oy yopilishi) — qulflanган davrга yozuv taqiqi
**Nima:** Oy yopilгач (hisobot berilгач), o'sha davrга orqага qaytib yozuv kiritish bloklansinmi.
**Nega kerak:** Yopilган davr o'zgartirilса, hisobot bilan haqiqat farq qiladi; mumtoz buxgalteriя qoidasi.
**Variantlar:**
- A) Davr yopilganда qulflanadi, faqat egasi/moliя rahbari ocha oladi — ishonchli hisobot (tavsiya)
- B) Har doim ochiq — orqага o'zgartirish mumkin, ishonchsiz
- C) Keyin
⤳ Ta'sir: GL, hisobotlar, audit

### Q186. Совершенствование bo'limi → moliyaviy tahlil roli
**Nima:** Kitobда Совершенствование bo'limi har oy ma'lumotни tahlil qiladi — moliyaviy og'ishlar (byudjet-fakt, taннарх o'sishi) ham shu bo'lim tahliliga kirsinmi.
**Nega kerak:** Оргполитика tahlil rolini aynan shu bo'limga beradi; moliя alohida qolса, takror ish.
**Variantlar:**
- A) Moliyaviy og'ish hisobotlari Совершенствование oylik tahliliga avtomatik kiradi — yagona tahlil markazi (tavsiya)
- B) Moliя alohida tahlil qiladi — ikki markaz, takror
- C) Keyin
⤳ Ta'sir: Coordination, hisobotlar, boshqaruv

### Q187. Byudjet-fakt og'ishига talab (расмий талаб) jo'natish
**Nима:** Оргполитика: ma'lumot yetishmasа Совершенствование mas'ul bo'limга расмий талаб yuboradi. Byudjet og'ishi katta bo'lса, avtomatik tushuntirish talabi mas'ul bo'limга borsinmi.
**Nega kerak:** Og'ish sababsiz qolса, takrorlanadi; kitob расмий ёзма талаб mexanizmini belgilaydi.
**Variantlar:**
- A) Og'ish chegaradan oshса → mas'ul kartага avtomatik tushuntirish talabi (Coordination) — javobgarlik (tavsiya)
- B) Faqat hisobotда ko'rsatiladi, talab yo'q — sabab so'ralmaydi
- C) Keyin
⤳ Ta'sир: Coordination, byudjet, karta-model

### Q188. Buyurtma rentabelligi (har buyurtmadan foyda)
**Nima:** Har buyurtma yopilгач, uning real foydasi (sotiш − material − mehnat − energiya) hisoblanib ko'rinsinmi.
**Nega kerak:** Qaysi buyurtma/mijoz foydali, qaysi zararли — bu ko'rinmаса noto'g'ri ish olinadi.
**Variantlar:**
- A) Har buyurtma yopilганда rentabellik kartochkasi (daromad − to'liq taннарх) — qaror uchun (tavsiya)
- B) Faqat umumiy oylik foyda — buyurtma darajasiz, ko'r-ko'rona
- C) Keyin
⤳ Ta'sир: SD, PP, taннарх
  ↳ Agar A: zararли buyurtma topilса nima — A) mijoz narxi qayta ko'riladi B) ogohlantirish C) qabul qilinmaydi

### Q189. Минимал buyurtma narxi / narxдан past sotuv taqiqi
**Nima:** Taннархдан past narxда sotuv (zararга sotuv) SD da bloklansin yoki egasi tasdig'ига chiqsinmi.
**Nega kerak:** Sotuvchi mijozни ushlash uchun taннархдан past narx qo'yса, kompaniя zarar ko'radi.
**Variantlar:**
- A) Narx taннархдан past bo'lса → bloklash yoki egasi tasdig'и — zararга sotuv oldi olinadi (tavsiya)
- B) Erkin narx — sotuvchi ixtiyorида, zarar xavfi
- C) Keyin
⤳ Ta'sир: SD, taннарх, approval

### Q190. Chegirma (skidka) vakolat darajasi
**Nima:** Mijozга chegirma berishда qaysi lavozim qancha foizгача chegirma bera oladi — vakolat darajasi belgilansinmi.
**Nega kerak:** Cheklovsiz chegirma foydани yeydi; kim qancha bera olishi aniq bo'lishi kerak.
**Variантlar:**
- A) Chegirma vakolat darajasi (sotuvchi ≤5%, rahbar ≤15%, egasi >15%) — nazorat (tavsiya)
- B) Chegirma cheklovsiz — foyda nazoratsiz
- C) Keyin
⤳ Ta'sир: SD, approval, karta-model

### Q191. О'заро hisob (vzaimозачёт / barter) hisobi
**Nima:** Mijoz/yetkazib beruvchi bilan o'zaro hisob (biz unга qarzмиз, u bizга qarzдор → o'zaro yopish) tizimда rasmiylashtirilsinmi.
**Nega kerak:** Naqd aylanmасдан qarz yopilса, hujjatsiz qolса nazorat yo'qoladi.
**Variантlar:**
- A) O'zaro hisob akti tuziladi, ikki tomon qarzи bir vaqtда yopiladi — hujjatли (tavsiya)
- B) Qo'lда tuzatma — izlanmайди, xato
- C) Keyin
⤳ Ta'sир: SD, MM, debitor/kreditor

### Q192. Yetkazib beruvchini moliyaviy baholash (eng arzon/ishonchli)
**Nima:** Bir xil qog'озни turli yetkazib beruvchи turli narx/sifatда beradi — tizим narx + brak% + kechikiш bo'yicha yetkazib beruvchини baholasinmi.
**Nega kerak:** Eng arzon har doim eng foydали emas (brak ko'p, kechikadi); moliya buni ko'rishi kerak.
**Variантlar:**
- A) Yetkazib beruvchи reytinги: narx + brak% + kechikiш — eng foydали tanlov (tavsiya)
- B) Faqat narx — yashirin xarajat (brak) hisobга olinmайди
- C) Keyin
⤳ Ta'sир: MM, QC (brak), Ombor

### Q193. Naqd kassa limiti va kunlik inkassация
**Nima:** Kassada qolishi mumkin bo'lган maksimal naqd (limit) belgilanиб, oshса bankка inkассация (topshirish) eslatmаси chiqsinmi.
**Nega kerak:** Kassada ko'p naqd = xavf (o'g'irлик, nazoratsizлик); limit klassик qoida.
**Variантlar:**
- A) Kassa limiti + oshса inkассация eslatmаси — xavfsizlик (tavsiya)
- B) Limitsiz — naqd to'planadi, xavf
- C) Keyin
⤳ Ta'sир: Kassa, bank

### Q194. Ish haqi avansi (oyning yarmida) hisobi
**Nima:** Xodimларга oyning yarmида avans (ish haqi avansi) berilса, oxirида qolган summа (avans chegирилган holда) hisoblansinmi.
**Nega kerak:** Zavodларда avans odatий; HR ╳ moliя to'g'ри ulanmаса, ikki marta to'lov xavfи.
**Variантlar:**
- A) Avans HR payroll цикlида qayd → oxирги hisob avansни chegиради — to'g'ри (tavsiya)
- B) Avans qo'lда — xato, ikki marta to'lov
- C) Keyin
⤳ Ta'sир: HR, kassa/bank

### Q195. Jarima/ushlanma (xodим zararи) ish haqидан
**Nima:** Xodим zarar yetkazса (brak, Камомад, rohler buziш — kitobда javobgарлик bor), bu summа ish haqидан ushlanса, moliя/HR bog'lansinmi.
**Nega kerak:** Kitobда javobgарлик aniq belgиланган, lekin pulда qanday undirилишi noaniq.
**Variантlar:**
- A) Zarar summasi → tasdiqланса ish haqидан ushlanма sifatида (qonуний chegара ichида) — javobgарлик real (tavsiya)
- B) Faqat ogohlantирish, pul undirилmайди — javobgарlик qog'озда qoladi
- C) Keyin
⤳ Ta'sир: HR, MES (brak), karta-model
  ↳ Agar A: maksimal ushlanма foizi qancha (qonun bo'yicha) — egasi/yurист belgиlайди

### Q196. Loyiha/buyurtма avans to'lovи (mijozдан oldindан)
**Nима:** Mijoz buyurtмага oldindан avans (масалан 50%) to'lаса, bu avans olдиндан to'lов sifatида yuritилиб, yetkazилгач yopилsinmi.
**Nega kerak:** Avans daromад emas (hали yetkazилмаган); noto'g'ри hisobланса, soliq/foyda xato.
**Variантlar:**
- A) Mijoz avansи alohида (kreditor-mijoz) hisob → yetkazилгач daromадга o'tади — to'g'ри (tavsiya)
- B) Darrov daromад sifatида — soliq erta, xato
- C) Keyin
⤳ Ta'sир: SD, soliq, debitor

### Q197. Quvvat-narx: bo'sh quvват ortганда narx pasaytириш qarori
**Nima:** Станоклар нормада ko'rinган bo'sh quvват (иш йук) bo'lса, qo'shimча buyurtмани past narxда (lekin taннархдан yuqори) qabul qилиш qarori moliя tahlилидан o'tsinmi.
**Nega kerak:** Bo'sh stanok zarar; to'liq narx kutиб zarar ko'rishдан ko'ра, marjинал foyда bilan to'lдириш foydали bo'lishi mumkin — lekin tahlилсиз xato.
**Variантlar:**
- A) Bo'sh quvват + marjинал-narx tahlили → qaror egага chiqади — aqlли to'lдириш (tavsiya)
- B) Har doim to'liq narx — bo'sh quvват zararда qoladi
- C) Keyin
⤳ Ta'sир: PP (quvват), SD (narx), MES

### Q198. Tannarx versiyaси (norма o'zgarганда tarих)
**Нima:** Станоклар норма yoki material narxи o'zгарса, eski buyurtмалар taннархи eski norма bilan, yangiлари yangi bilan hisoblanиб, taрих saqlansinmi.
**Nega kerak:** Norма vaqт-vaqтда yangiланади (kitob норма hujjati sanaли); taрихsiz eski hisoblar buzilади.
**Variантlar:**
- A) Norма/narx versияли (amal qилиш sanaси bilan) → har buyurtма o'z davридаги qiymат bilan — aniq taрих (tavsiya)
- B) Faqat joriy qiymат — eski hisoblar o'zгариб ketади
- C) Keyin
⤳ Ta'sир: PP (norма), taннарх, hisobotлар

### Q199. Xarajат-markazи (бўлим/участка bo'yicha xarajат)
**Nима:** Xarajатлар bo'lim/участка (Флексо, Офсет, гофра, омбор...) bo'yicha ajratилиб, har bo'limнинг xarajати alohида ko'rinsinmi.
**Nega kerak:** Qaysi bo'lim ko'p xarajат qилаётганини ko'риш uchun; kitobда bo'limlар aniq (Флексо/Офсет).
**Variантlar:**
- A) Har xarajат xarajат-markазига (бўлимга) bog'lanади → bo'lim-bo'yicha hisobот — javobgарлик (tavsiya)
- B) Umumий xarajат — qaysi bo'lim ko'p sarflагани noma'lум
- C) Keyin
⤳ Ta'sир: barcha ishlаб chiqариш bo'limlари, byudjet, karta-model

### Q200. Daromад tan olиш vaqти (yetkazилганда / to'langanда)
**Нima:** Daromад qachон tan olинади — buyurtма yetkazилганда (akт imzolanganда)mи yoki pul kelгандаmи.
**Nega kerak:** Bu soliq va foyда hisobини tubдан o'zгартиради; standart bo'lishi shart.
**Variантlar:**
- A) Yetkazилганда (akт/накладной bilan) tan olинади — standart accrual (tavsiya)
- B) Pul kelганда — sodda (kassа usuли), lekin foyда noto'g'ри ko'rinади
- C) Keyin
⤳ Ta'sир: SD, soliq, hisobотлар

### Q201. To'lов so'rови (ЗНО) navbати/ustuvорлиги
**Нima:** Bir vaqtда ko'p to'lов so'rови bo'lса, pul yetмаганда qайси birини avval to'lаш (ustuvорлик: ish haqи > soliq > xom-ashyo > boshqа) tizим ko'rsatsinmi.
**Nega kerak:** Pul cheklанган paytда noto'g'ри ustuvорлик zavodни to'xtатиши mumkин (xom-ashyo to'lanmasа).
**Variантlar:**
- A) To'lов ustuvорлик darajaси (sozланадиган) → navbат avtomatик taklif — aqlли to'lов (tavsiya)
- B) Kim avval so'raса — sub'ektив, kritик to'lов kechикиши mumkин
- C) Keyin
⤳ Ta'sир: ZNO, kassа, byudjet

### Q202. Pul aylanма davrи (mijoz to'lаши − biz to'lаshımız)
**Нima:** Mijozдан pul kelгунча va biz yetkazib beruvchıга to'lаgunча o'tган kunlар (cash conversion) ko'rsatkичи hisoblansinmi.
**Nega kerak:** Agar biz tezroq to'lаб, sekinroq olсак — pul muzlайди; bu ko'rsатки muammони ko'rsатади.
**Variантлар:**
- A) Pul aylanма davrи dashboard (debitor kun − kreditor kun + ombor kun) — likвидлик nazorати (tavsiya)
- B) Faqat aging — umумий rasm yo'q
- C) Keyin
⤳ Ta'sир: aging, ombor, byudjet

### Q203. Moliyaviy dashboard egasi uchun (1 ekran)
**Нima:** Egага bitta ekranда: bugунги kassa/bank qoldиq, kutilаётган kirim/chiqim (7 kun), debitor/kreditor jami, oyлик foyда — ko'rsатilsinmi.
**Nega kerak:** Egа har modulга kirмасдан moliyaviy holatни 10 sekundда ko'риши kerak.
**Variантлар:**
- A) Egа moliя dashboardи (qoldиq + 7-kun prognoз + qarzlар + foyда) — tezkор qaror (tavsiya)
- B) Har raqам alohида modulда — egа yig'иб ko'риши qiyин
- C) Keyin
⤳ Ta'sир: barcha moliя ekranlари, boshqарув

### Q204. "Режа қоғози"да imzo/qabul-topshıрıш zanjırı
**Нima:** Kitob jadvалида "Qabul qildim: F.I.O____ Imzo____" bor — Режа қоғози topshıрıш-qabul qılış (ombor → таъминотчı → бухгалтерия) tizımда imzo/tasdиq zanjırı bilan yuritılsinmi.
**Nega kerak:** Imzosiz topshıрıш = javobgarlık uzilади; kim bergan, kim olган noaniq.
**Variантлар:**
- A) Har bosqıchда elektrон tasdиq (kim berди / kim oldı / qachон) — uzilмас zanjır (tavsiya)
- B) Faqat oxırги bухгалтерия qaydı — oraдаги javobgarlık yo'q
- C) Keyin
⤳ Ta'sır: Ombor, Coordination, karta-model

### Q205. Faktura-to'lov-yetkaziш uchlığı (3-way match)
**Нima:** Yetkazib beruvchıга to'lаshдан oldın: buyurtма (zakaz) ╳ kelган Счёт-фактура ╳ ombor kirim (qabul qılınган kg) uchаласи mos kelsinmi.
**Nega kerak:** Mos kelмаса (buyurtма 1000 kg, faktura 1000, kirim 950) — ortıqcha to'lов xavfi; mumtoz nazorат.
**Variантлар:**
- A) 3-way match: zakaz=faktura=kirim bo'lмаса to'lов bloklanади — ortıqcha to'lов oldı olinади (tavsiya)
- B) Faqat faktura bo'yicha to'lов — kirim tekshırılmайди, xato
- C) Keyin
⤳ Ta'sır: MM, Ombor, ZNO, kreditor

### Q206. Brak% chegараси oshса taннарх ogohlantíruvı
**Нima:** Станоклар нормада "брак %" bor — agar buyurtмада brak% normадан oshса, qo'shímча material/taннарх ogohlantírıshı moliyага chiqsinmi.
**Nega kerak:** Ortıqcha brak = ortıqcha material sarfi = taннарх oshıshı; norма bor ekan, taqqoslаш kerak.
**Variантлар:**
- A) Brak% > norма → taннарх og'ıshı + ogohlantírış — erta nazorат (tavsiya)
- B) Faqat QC ko'radı — moliyaviy ta'sir ko'rinмайди
- C) Keyin
⤳ Ta'sır: QC, MES, taннарх

### Q207. Yangi material/stanok narxını kim kiritади (master-data egaligı)
**Нima:** Material narxı, stanok normа-stavkası kabi moliyaviy master-ma'lumotни kiritиш/o'zгартıрıш vakolатı qaysi kartага berılади.
**Nega kerak:** Оргполитика "bitta egа" talab qiladı; narx noto'g'ри bo'lса butun taннарх buzilади.
**Variантлар:**
- A) Narx master-data faqat Бухгалтерия/moliя kartасı egaligıда, boshqалар o'qiyди — yagona haqiqат (tavsiya)
- B) Har bo'lim o'zı kiritадı — ziddiyat (hozırги muammо)
- C) Keyin
⤳ Ta'sır: master-data, barcha modullar, karta-model
DONE: Finance / GL — 54.

## 4. Coordination

### Q208. Kengash a'zolari ro'yxati qayerdan olinadi
**Nima:** Kengash (sovet) a'zolari kim ekani tizimda qayerda saqlanadi — qo'lda kiritamizmi yoki org-strukturadan avtomatmi.
**Nega kerak:** A'zo noto'g'ri bo'lsa kvorum ham, ovoz ham, protokol imzosi ham noto'g'ri chiqadi. Bu butun modulning poydevori.
**Variantlar:**
- A) Org-strukturadan avtomat (CEO + 7 otdeleniye boshlig'i = doimiy a'zo) — eng kam qo'l ishi, lekin moslashuvchanlik kam
- B) Qo'lda tuziladigan ro'yxat (har bir a'zoni alohida qo'shamiz) — moslashuvchan, lekin eskirib qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR / Org-struktura (lavozim o'zgarsa a'zolik ham o'zgaradi)

### Q209. Kengash a'zosi turlari (rol)
**Nima:** Har bir a'zoning roli — Rais (sarkotib), Kotib (protokol yozuvchi), Doimiy a'zo, Taklif etilgan (ovozsiz mehmon).
**Nega kerak:** Ovoz berish, imzo va kvorum hisobida kim sanaladi, kim sanalmasligini aniqlash kerak.
**Variantlar:**
- A) 4 rol: Rais / Kotib / A'zo / Mehmon (faqat A'zo+Rais ovoz beradi) — aniq va yetarli
- B) Faqat 2 rol: A'zo / Mehmon — sodda, lekin imzo oqimi noaniq
- C) Keyin — hozir kerak emas

### Q210. Kvorum foizi
**Nima:** Majlis qonuniy bo'lishi uchun a'zolarning necha foizi hozir bo'lishi shart.
**Nega kerak:** Kvorum yetmasa qabul qilingan qarorlar keyin "qonuniy emas" deb e'tiroz qilinishi mumkin.
**Variantlar:**
- A) 2/3 (66%) hozir bo'lishi shart — qaror og'irligi ta'minlanadi
- B) Oddiy ko'pchilik (50% + 1) — yig'ish oson
- C) Keyin — hozir kerak emas
  ↳ Agar A: Kvorum yetmasa majlis avtomat "Kvorum yo'q" holatiga o'tib bekor bo'lsinmi yoki "maslahat majlisi" (qaror kuchsiz) sifatida davom etsinmi?

### Q211. Ovoz berish usuli va g'olib chegarasi
**Nima:** Qaror qabul qilishda ovoz qanday sanaladi — oddiy ko'pchilikmi, malakali ko'pchilikmi (2/3), Rais ovozi ikki barobarmi.
**Nega kerak:** Teng ovoz (masalan 3-3) bo'lganda nima bo'lishini oldindan aniqlamasak majlis qotib qoladi.
**Variantlar:**
- A) Oddiy ko'pchilik; teng bo'lsa Rais ovozi hal qiladi — tez va aniq
- B) Hamma qarorga 2/3 malakali ko'pchilik — kuchli, lekin ko'p qaror o'tmay qoladi
- C) Keyin — hozir kerak emas

### Q212. A'zo o'rniga vakil (delegatsiya)
**Nima:** A'zo kelolmasa o'rniga boshqa odam (o'rinbosar) ovoz bera oladimi va kvoromga sanaladimi.
**Nega kerak:** Boshliqlar tez-tez bandlik bo'ladi; vakil bo'lmasa majlis tez-tez kvorumsiz qoladi.
**Variantlar:**
- A) Faqat oldindan yozma ishonchnoma bilan vakil ovoz beradi (kvorumga sanaladi) — nazoratli
- B) Vakil faqat eshitadi, ovoz bermaydi (kvorumga sanalmaydi) — qattiq, lekin majlis to'xtaydi
- C) Keyin — hozir kerak emas

### Q213. A'zolik manfaat to'qnashuvi (conflict of interest)
**Nima:** A'zo o'ziga aloqador masala muhokama qilinsa (masalan o'z otdeleniyesi byudjeti) ovoz berishdan chetlatiladimi.
**Nega kerak:** O'z manfaatiga ovoz berish keyin nizo va adolatsizlik keltiradi; oldindan qoida bo'lsa toza bo'ladi.
**Variantlar:**
- A) Aloqador a'zo o'sha bandda "chetlashtirildi" deb belgilanadi, ovozi sanalmaydi — adolatli
- B) Hamma har doim ovoz beradi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas

---

## BO'LIM 2 — Majlis chastotasi va jadval

### Q214. Majlis turlari
**Nima:** Qanday majlis turlari bo'ladi — Haftalik operativ (planyorka), Oylik kengash, Choraklik strategik, Favqulodda (vneocherednoy).
**Nega kerak:** Har tur uchun chastota, kvorum va doklad talablari turlicha; aralashtirsak hisobot chalkashadi.
**Variantlar:**
- A) 4 tur: Operativ / Oylik / Choraklik / Favqulodda — to'liq qamrov
- B) 2 tur: Oddiy / Favqulodda — sodda
- C) Keyin — hozir kerak emas

### Q215. Doimiy jadval (raspisaniye)
**Nima:** Majlislar belgilangan kun/soatga avtomat rejalashtiriladimi (masalan har dushanba 9:00 operativ).
**Nega kerak:** Doimiy jadval bo'lsa hamma oldindan tayyorlanadi, doklad o'z vaqtida keladi.
**Variantlar:**
- A) Avtomat takrorlanuvchi jadval (haftalik/oylik shablon) — intizom kuchli
- B) Har gal qo'lda chaqiriladi — moslashuvchan, lekin unutiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya (eslatma/notification yuborish), HR (ish vaqti)

### Q216. Chaqiriqni oldindan ogohlantirish muddati
**Nima:** Majlis haqida a'zolarga necha kun/soat oldin xabar berilishi shart.
**Nega kerak:** Kech xabar bersak a'zo tayyorlanmaydi, doklad yetmaydi; juda erta bo'lsa unutiladi.
**Variantlar:**
- A) Oddiy: 2 ish kuni oldin; Favqulodda: kamida 3 soat oldin — amaliy muvozanat
- B) Hamma majlisga 1 kun oldin — sodda
- C) Keyin — hozir kerak emas

### Q217. Kun tartibi (povestka) muddati
**Nima:** Majlis kun tartibi (muhokama bandlari ro'yxati) qachongacha tasdiqlanishi va a'zolarga yuborilishi kerak.
**Nega kerak:** Kun tartibisiz majlis "shu yerda nimani gaplashamiz" bo'lib vaqt yo'qoladi.
**Variantlar:**
- A) Majlisdan 1 ish kuni oldin yopiq (qulflanadi), keyin faqat Rais ruxsati bilan band qo'shiladi — tartibli
- B) Majlis boshida kun tartibi tuziladi — erkin, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q218. Davomat (yo'qlama) va kechikish
**Nima:** Har majlisda davomat belgilanadimi — keldi / kechikdi / sababli yo'q / sababsiz yo'q.
**Nega kerak:** Sababsiz qatnashmaslik intizom masalasi; davomat yozilmasa kvorum ham, javobgarlik ham isbotsiz qoladi.
**Variantlar:**
- A) 4 holatli davomat avtomat yoziladi, sababsiz yo'q 3 marta = HR ogohlantirish — intizomli
- B) Faqat keldi/kelmadi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom, KPI)

### Q219. Majlis davomiyligi cheklovi
**Nima:** Majlis necha daqiqa davom etishi maqsad qilinadi va vaqt tugasa nima bo'ladi.
**Nega kerak:** Cho'zilgan majlis ishlab chiqarishdan odamlarni uzoq uzadi; vaqt limiti samaradorlikni oshiradi.
**Variantlar:**
- A) Operativ 30 daq, Oylik 90 daq maqsad; oshsa "qoldirilgan bandlar" keyingiga ko'chadi — intizomli
- B) Vaqt cheklanmaydi — erkin
- C) Keyin — hozir kerak emas

---

## BO'LIM 3 — Doklad (hisobot) va javob muddati

### Q220. Doklad turlari va kim topshiradi
**Nima:** Doklad turlari — rejali (har otdeleniye boshlig'i), so'rovga javob (Rais so'ragan), muammo-doklad (favqulodda).
**Nega kerak:** Kim qachon qanday doklad berishini aniqlamasak majlisda "tayyorlanmaganman" deyiladi.
**Variantlar:**
- A) 3 tur, har otdeleniye boshlig'i oylik kengashga rejali doklad majbur — to'liq
- B) Faqat so'rovga javob (ad-hoc) — kam yuk, lekin tizimsiz
- C) Keyin — hozir kerak emas

### Q221. Doklad javob muddati (deadline) qoidasi
**Nima:** Doklad so'ralganda necha kun ichida topshirilishi kerak va muddat qanday hisoblanadi (ish kunimi, kalendarmi).
**Nega kerak:** "Tez" degan so'z har kim uchun har xil; aniq muddat bo'lmasa hisobot abadiy kechikadi.
**Variantlar:**
- A) Standart 3 ish kuni; shoshilinch 1 ish kuni; ish kunlari bo'yicha hisoblanadi — aniq
- B) Har gal Rais qo'lda muddat qo'yadi — moslashuvchan, lekin nazorat qiyin
- C) Keyin — hozir kerak emas

### Q222. Doklad kechiksa nima bo'ladi (eskalatsiya)
**Nima:** Muddat o'tib doklad kelmasa tizim nima qiladi — eslatadimi, boshliqqa xabar beradimi, KPI tushadimi.
**Nega kerak:** Javobgarliksiz muddat — muddat emas; kechikishning aniq oqibati bo'lishi shart.
**Variantlar:**
- A) Muddat tugashidan 1 kun oldin eslatma → tugagach yuqori rahbarga eskalatsiya → 2 kun o'tsa KPI'ga "kechikish" yoziladi — kuchli
- B) Faqat eslatma, jazo yo'q — yumshoq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/KPI (intizom ko'rsatkichi), AI (eslatma)

### Q223. Doklad formati va majburiy maydonlar
**Nima:** Doklad qanday tuziladi — sarlavha, davr, asosiy ko'rsatkichlar (raqamlar), muammolar, takliflar, ilova (fayl).
**Nega kerak:** Bir xil formatda bo'lmasa dokladlarni solishtirib bo'lmaydi, AI ham tahlil qilolmaydi.
**Variantlar:**
- A) 6 majburiy maydon: Davr / Bajarilgan / Reja-fakt farqi / Muammolar / Takliflar / Ilova — to'liq va solishtiriladigan
- B) Erkin matn — oson, lekin tartibsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (doklad avtomat xulosa), Production/Finance (raqamlar manbasi)

### Q224. Doklad raqamlari qayerdan keladi
**Nima:** Dokladdagi raqamlar (ishlab chiqarish, sotuv, brak) qo'lda kiritiladimi yoki ERP modullaridan avtomat tortiladimi.
**Nega kerak:** Qo'lda kiritilsa odam o'zini bezab ko'rsatadi; avtomat bo'lsa haqiqat chiqadi.
**Variantlar:**
- A) Asosiy raqamlar ERP'dan avtomat (Production/Finance/Warehouse), izoh qo'lda — ishonchli
- B) Hamma raqam qo'lda — egiluvchan, lekin ishonchsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production, Finance, Warehouse (raqam manbasi)

### Q225. Doklad holatlari (status)
**Nima:** Dokladning hayot yo'li — Qoralama / Topshirildi / Ko'rib chiqilmoqda / Qabul qilindi / Qayta ishlash kerak.
**Nega kerak:** Holatsiz tizimda "doklad keldi-yu, lekin yaroqsiz" holati ko'rinmaydi.
**Variantlar:**
- A) 5 holat: Qoralama→Topshirildi→Ko'rib chiqilmoqda→Qabul/Qaytarildi — aniq oqim
- B) 2 holat: Yo'q / Bor — sodda
- C) Keyin — hozir kerak emas

---

## BO'LIM 4 — Rasporyajeniye (farmoyish) ustuvorlik va eskalatsiya

### Q226. Rasporyajeniye va Prikaz farqi
**Nima:** Rasporyajeniye (joriy operativ farmoyish) va Prikaz (rasmiy buyruq) tizimda farqlanadimi, qaysisini kim chiqaradi.
**Nega kerak:** Aralashtirsak kichik operativ topshiriq ham rasmiy buyruq darajasiga ko'tarilib byurokratiya ko'payadi.
**Variantlar:**
- A) Ikkisi alohida: Rasporyajeniye = otdeleniye/bo'lim boshlig'i operativ; Prikaz = faqat CEO/Owner rasmiy — aniq ierarxiya
- B) Faqat bitta "topshiriq" turi — sodda, lekin rasmiyat yo'qoladi
- C) Keyin — hozir kerak emas

### Q227. Rasporyajeniye ustuvorlik darajalari
**Nima:** Har farmoyishga ustuvorlik beriladi — Past / O'rta / Yuqori / Shoshilinch (kritik).
**Nega kerak:** Ustuvorliksiz hamma topshiriq teng ko'rinadi, eng muhimi navbatda yo'qoladi.
**Variantlar:**
- A) 4 daraja, har darajaga standart muddat bog'lanadi (Shoshilinch=shu kun, Yuqori=2 kun, O'rta=5 kun, Past=10 kun) — aniq
- B) Faqat "shoshilinch/oddiy" — sodda
- C) Keyin — hozir kerak emas

### Q228. Rasporyajeniye majburiy maydonlari
**Nima:** Bir farmoyish nimalardan iborat — kim chiqardi, kimga, nima qilinsin, muddat, ustuvorlik, asos (qaysi majlis/qaror).
**Nega kerak:** "Kimga" va "muddat" bo'sh bo'lsa farmoyish bajarilmaydi va kim aybdor degani noaniq qoladi.
**Variantlar:**
- A) 6 majburiy maydon: Beruvchi / Bajaruvchi / Vazifa / Muddat / Ustuvorlik / Asos — to'liq
- B) Faqat matn + bajaruvchi — sodda
- C) Keyin — hozir kerak emas

### Q229. Bajaruvchi bitta yoki ko'pmi (mas'ul va hammuallif)
**Nima:** Bir farmoyishga bitta asosiy mas'ul + bir nechta yordamchi (soispolnitel) bo'la oladimi.
**Nega kerak:** "Hamma mas'ul" = hech kim mas'ul emas; asosiy mas'ul bitta bo'lishi shart.
**Variantlar:**
- A) Bitta asosiy mas'ul (javobgar) + ixtiyoriy yordamchilar — javobgarlik aniq
- B) Bir nechta teng mas'ul — moslashuvchan, lekin javobgarlik tarqaladi
- C) Keyin — hozir kerak emas

### Q230. Rasporyajeniye eskalatsiya zinapoyasi
**Nima:** Muddat o'tib bajarilmasa farmoyish kimga ko'tariladi va necha bosqichda.
**Nega kerak:** Eskalatsiyasiz kechikkan topshiriq "yo'qolib" ketadi; aniq zina bo'lsa mas'ul majbur bajaradi.
**Variantlar:**
- A) 3 bosqich: muddat-1kun eslatma → muddat o'tdi: bevosita boshliqqa → +2 kun: otdeleniye boshlig'iga → +3 kun: CEO ro'yxatiga — kuchli
- B) Faqat bajaruvchiga eslatma — yumshoq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id zanjiri), AI (eskalatsiya xabari)
  ↳ Agar A: Eskalatsiya zanjiri manager_id'dan olinadimi (vertikal) yoki qo'lda belgilangan "nazoratchi"danmi?

### Q231. Farmoyishni rad etish yoki muddat so'rash
**Nima:** Bajaruvchi farmoyishni "bajarib bo'lmaydi" deb rad eta oladimi yoki muddat uzaytirish so'raydimi.
**Nega kerak:** Real hayotda ba'zi topshiriq imkonsiz (material yo'q); rasmiy rad/uzaytirish kanali bo'lmasa odam jim qoldiradi.
**Variantlar:**
- A) Bajaruvchi "Rad etish/Uzaytirish so'rovi" yozadi (sabab majburiy) → beruvchi tasdiqlaydi/rad etadi — shaffof
- B) Rad etib bo'lmaydi, faqat bajarish — qattiq, lekin haqiqatdan uzoq
- C) Keyin — hozir kerak emas

### Q232. Rasporyajeniye holatlari
**Nima:** Farmoyish hayot yo'li — Yangi / Qabul qilindi / Jarayonda / Bajarildi / Tekshiruvda / Yopildi / Bekor qilindi / Kechikkan.
**Nega kerak:** Holatsiz nazoratchi "bu qaysi bosqichda" deb bilmaydi.
**Variantlar:**
- A) 8 holatli to'liq oqim (yuqoridagi) — aniq nazorat
- B) 3 holat: Yangi/Jarayonda/Yopildi — sodda
- C) Keyin — hozir kerak emas

---

## BO'LIM 5 — Prikaz (buyruq) raqamlash formati va kategoriya

### Q233. Prikaz raqamlash formati
**Nima:** Buyruq raqami qanday ko'rinishda bo'ladi — masalan "P-2026-001" yoki "01/К-2026".
**Nega kerak:** Bir xil format bo'lmasa arxivda qidirish va rasmiy hujjat aylanishi chalkashadi.
**Variantlar:**
- A) "PR-YYYY-NNN" (yillik, har yil 001 dan boshlanadi, otomat o'sadi) — sodda va xalqaro
- B) Eski uslub "NN/К" qo'lda — tanish, lekin xato ehtimoli yuqori
- C) Keyin — hozir kerak emas

### Q234. Prikaz kategoriyalari va raqam prefiksi
**Nima:** Buyruq turi bo'yicha alohida raqam qatorlari — Kadrlar (К), Asosiy faoliyat (ОД), Moliya (Ф), Xo'jalik (АХ).
**Nega kerak:** Kadrlar buyrug'i va ishlab chiqarish buyrug'i aralashsa, arxivlash va qonuniy talab buziladi.
**Variantlar:**
- A) 4 kategoriya, har biriga alohida prefiks va alohida raqam qatori — tartibli
- B) Hamma buyruq bitta qatorda — sodda, lekin aralash
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (kadrlar buyruqlari), Finance (moliyaviy buyruqlar)

### Q235. Raqam ketma-ketligi va bekor qilingan buyruq teshigi
**Nima:** Raqam o'rtada bekor qilinsa (masalan PR-2026-007 bekor) keyingi raqam o'rnini to'ldiradimi yoki teshik qoladimi.
**Nega kerak:** Buyruq raqamlari uzluksiz bo'lishi qonuniy talab; teshik "yashirilgan buyruq" shubhasi tug'diradi.
**Variantlar:**
- A) Raqam teshigi qoldiriladi, bekor qilingan buyruq "Bekor qilindi" holatida raqami bilan saqlanadi — qonuniy va shaffof
- B) Keyingi buyruq teshikni to'ldiradi (raqam qayta ishlatiladi) — chiroyli, lekin qonuniy emas
- C) Keyin — hozir kerak emas

### Q236. Prikaz ilovasi va asos hujjati
**Nima:** Har buyruqqa asos (osnovaniye) — qaysi majlis qarori, ariza yoki doklad sabab bo'lganligi bog'lanadimi.
**Nega kerak:** "Asossiz buyruq" keyin nizoda himoyasiz; asos bog'langan bo'lsa zanjir to'liq.
**Variantlar:**
- A) Asos majburiy: kamida bitta hujjatga havola (majlis qarori / ariza / doklad) — to'liq zanjir
- B) Asos ixtiyoriy — oson, lekin bo'shliq qoladi
- C) Keyin — hozir kerak emas

### Q237. Prikazning amal qilish muddati va kuchga kirishi
**Nima:** Buyruq qachondan kuchga kiradi (imzo kuni / ko'rsatilgan sana) va amal muddati bormi (vaqtinchalik buyruq).
**Nega kerak:** "Qachondan boshlab" noaniq bo'lsa, masalan ish vaqti yoki to'lov o'zgarishi qachon qo'llanishi nizoga sabab bo'ladi.
**Variantlar:**
- A) Standart: imzolangan kundan; ixtiyoriy "kuchga kirish sanasi" va "tugash sanasi" maydoni — moslashuvchan va aniq
- B) Har doim imzo kunidan — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/Finance (oylik/ish vaqti o'zgarishi qachondan)

### Q238. Prikazni o'zgartirish va bekor qilish
**Nima:** Imzolangan buyruqni tahrirlash mumkinmi yoki faqat yangi buyruq bilan o'zgartirish/bekor qilinadimi.
**Nega kerak:** Imzolangan rasmiy hujjatni jim tahrirlash — soxtalashtirish; faqat yangi buyruq bilan o'zgartirish to'g'ri.
**Variantlar:**
- A) Imzolangan buyruq qulflanadi; o'zgartirish faqat yangi "o'zgartirish kiritish to'g'risida" buyruq bilan — qonuniy
- B) To'g'ridan-to'g'ri tahrir mumkin — qulay, lekin xavfli
- C) Keyin — hozir kerak emas

---

## BO'LIM 6 — Protokol imzo oqimi

### Q239. Protokol kim tomonidan yoziladi va shabloni
**Nima:** Majlis bayonnomasi (protokol) kim tomonidan, qanday shablonda tuziladi — kun tartibi, muhokama, qarorlar, ovozlar, mas'ullar.
**Nega kerak:** Shablon bo'lmasa har protokol har xil chiqadi, qaror va mas'ul yo'qoladi.
**Variantlar:**
- A) Kotib avtomat shablonda tuzadi (kun tartibi + qarorlar + ovoz natijasi + mas'ul + muddat avtomat to'ldiriladi) — tez va bir xil
- B) Erkin matn — egiluvchan, lekin tartibsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (majlis yozuvidan protokol qoralash)

### Q240. Protokol imzo zanjiri (tartibi)
**Nima:** Protokolni kim, qaysi tartibda imzolaydi — Kotib (tuzdi) → Rais (tasdiqladi), yoki yana boshqalarmi.
**Nega kerak:** Imzo tartibi bo'lmasa protokol "tasdiqlanmagan" qoladi va qarorlar kuchga kirmaydi.
**Variantlar:**
- A) 2 bosqich: Kotib imzolaydi → Rais imzolaydi → protokol "Tasdiqlangan" bo'ladi — sodda va yetarli
- B) Har bir kengash a'zosi imzolaydi — to'liq, lekin sekin
- C) Keyin — hozir kerak emas

### Q241. Imzo turi (raqamli)
**Nima:** Imzo qanday qo'yiladi — tizim ichida "Tasdiqlash" tugmasi (audit yozuvi bilan), elektron imzo (ЭЦП), yoki qog'oz skani.
**Nega kerak:** Imzo turi protokolning yuridik kuchini belgilaydi; tugma bilan tasdiqlash ham, agar audit yozilsa, ishonchli bo'ladi.
**Variantlar:**
- A) Tizim ichidagi "Tasdiqlash" (kim/qachon/IP audit yoziladi) — ichki foydalanish uchun yetarli
- B) Rasmiy ЭЦП integratsiyasi — kuchli, lekin murakkab/qimmat
- C) Keyin — hozir kerak emas

### Q242. Imzo muddati va kechikishi
**Nima:** Protokol majlisdan keyin necha kun ichida imzolanishi shart.
**Nega kerak:** Imzolanmagan protokoldagi qarorlar "rasmiy emas" qolib bajarish kechikadi.
**Variantlar:**
- A) Majlisdan keyin 2 ish kuni ichida Rais imzolashi shart; o'tsa eslatma + CEO ro'yxatiga — intizomli
- B) Muddatsiz — yumshoq
- C) Keyin — hozir kerak emas

### Q243. Imzolangan protokolni o'zgartirish (versiya)
**Nima:** Tasdiqlangan protokolda xato topilsa nima bo'ladi — qulflanadimi, faqat "tuzatish bayonnomasi" bilanmi.
**Nega kerak:** Tasdiqlangan rasmiy hujjatni jim o'zgartirish ishonchni buzadi; versiyalash kerak.
**Variantlar:**
- A) Tasdiqlangach qulflanadi; tuzatish faqat ilova "tuzatish protokoli" bilan, asl saqlanadi — shaffof
- B) Tahrir mumkin, oxirgi versiya saqlanadi — qulay, lekin tarix yo'qoladi
- C) Keyin — hozir kerak emas

### Q244. E'tiroz (osoboye mneniye) yozish
**Nima:** Qarorga qo'shilmagan a'zo o'z e'tirozini protokolga rasmiy yozdira oladimi.
**Nega kerak:** Kelishmovchilik yashirilsa keyin "men qarshi edim" deb nizo chiqadi; rasmiy e'tiroz yozuvi adolatli.
**Variantlar:**
- A) Ha, a'zo "alohida fikr" yozadi va protokolga ilova bo'ladi — shaffof
- B) Yo'q, faqat ovoz natijasi yoziladi — sodda
- C) Keyin — hozir kerak emas

---

## BO'LIM 7 — Qaror bajarilishini nazorat qilish

### Q245. Qaror = topshiriqqa avtomat aylanishi
**Nima:** Majlisda qabul qilingan har qaror avtomat ravishda mas'ul+muddatli topshiriq (rasporyajeniye)ga aylanadimi.
**Nega kerak:** "Gaplashdik, lekin hech kim qilmadi" — eng katta dard; qaror darhol mas'ulga biriktirilsa bajariladi.
**Variantlar:**
- A) Har qarorga majlisda darhol mas'ul + muddat belgilanadi, avtomat topshiriq ochiladi — to'g'ridan-to'g'ri bajarilish
- B) Qaror alohida yoziladi, topshiriq keyin qo'lda — sekin, yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: butun Coordination zanjiri (qaror→topshiriq→nazorat→arxiv)

### Q246. Bajarilish foizi va holat ko'rsatkichi
**Nima:** Har qaror bo'yicha bajarilish darajasi (0–100%) yoki holat (Boshlanmadi/Jarayonda/Bajarildi/Kechikdi) qanday kuzatiladi.
**Nega kerak:** Rais "qaysi qaror qilindi, qaysi qolib ketdi" deb bir qarashda ko'rishi kerak.
**Variantlar:**
- A) Holat + foiz; har majlis boshida "o'tgan qarorlar holati" avtomat ko'rsatiladi — uzluksiz nazorat
- B) Faqat bajarildi/bajarilmadi — sodda
- C) Keyin — hozir kerak emas

### Q247. Bajarilmagan qarorni keyingi majlisga ko'chirish
**Nima:** Muddat o'tib bajarilmagan qaror avtomat keyingi majlis kun tartibiga "qoldiq" sifatida tushadimi.
**Nega kerak:** Bajarilmagan qaror unutilmasligi kerak; avtomat ko'tarilsa mas'ul javob beradi.
**Variantlar:**
- A) Avtomat keyingi kun tartibiga "bajarilmagan qaror" bo'limida chiqadi, mas'ul sabab tushuntiradi — kuchli
- B) Qo'lda Rais qo'shadi — unutiladi
- C) Keyin — hozir kerak emas

### Q248. Bajarish dalili (pruf) talab qilinadimi
**Nima:** Qaror "bajarildi" deb belgilanganda dalil (fayl, hujjat, raqam, foto) ilova qilinishi shartmi.
**Nega kerak:** Dalilsiz "bajarildi" — bo'sh so'z; ko'pincha qog'ozda bajarilgan, amalda yo'q.
**Variantlar:**
- A) Yuqori/Shoshilinch qarorlarga dalil majburiy, oddiyga ixtiyoriy — muvozanat
- B) Hech qachon dalil so'ralmaydi — ishonchga asoslangan, zaif
- C) Keyin — hozir kerak emas

### Q249. Bajarilishni kim tasdiqlaydi (yopish huquqi)
**Nima:** Topshiriqni "bajarildi" deb yakuniy kim yopadi — bajaruvchi o'zimi, beruvchimi, yoki nazoratchimi.
**Nega kerak:** Bajaruvchining o'zi yopsa "men qildim" deb soxtalashtirishi mumkin; beruvchi tasdig'i to'g'ri.
**Variantlar:**
- A) Bajaruvchi "Bajardim" belgilaydi → beruvchi/Rais "Qabul qildim" deb yopadi — ikki bosqichli nazorat
- B) Bajaruvchi o'zi yopadi — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q250. Qaror bajarilish reytingi (mas'ullar bo'yicha)
**Nima:** Har bo'lim/boshliq bo'yicha "qancha qaror o'z vaqtida bajarildi" reytingi chiqariladimi.
**Nega kerak:** Reyting bo'lsa intizom o'z-o'zidan ko'tariladi; kim doim kechiktirishi ko'rinadi.
**Variantlar:**
- A) Oylik bajarilish reytingi (o'z vaqtida % / kechikkan %) KPI'ga ulanadi — rag'bat va nazorat
- B) Reyting yo'q, faqat ro'yxat — neytral
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/KPI (boshliq samaradorligi)

---

## BO'LIM 8 — Kengash arxivi

### Q251. Arxivda nima saqlanadi
**Nima:** Arxiv tarkibi — protokol, kun tartibi, dokladlar, ovoz natijalari, qarorlar, prikazlar, davomat, ilova fayllar.
**Nega kerak:** Yarim arxiv = isbotsiz arxiv; keyin nizoda yoki tekshiruvda to'liq hujjat kerak bo'ladi.
**Variantlar:**
- A) To'liq paket har majlisga biriktiriladi (protokol+kun tartibi+doklad+ovoz+qaror+davomat+ilova) — to'liq tarix
- B) Faqat protokol — yengil, lekin chala
- C) Keyin — hozir kerak emas

### Q252. Arxivda qidiruv mezonlari
**Nima:** Arxivni qaysi bo'yicha qidirish mumkin — sana, mavzu, mas'ul, prikaz raqami, otdeleniye, holat (bajarildi/yo'q).
**Nega kerak:** "Bultur shu masalada nima qaror qilgandik?" — qidiruvsiz topib bo'lmaydi.
**Variantlar:**
- A) Ko'p mezonli qidiruv: sana oralig'i + mavzu/kalit so'z + mas'ul + raqam + holat — kuchli
- B) Faqat sana bo'yicha ro'yxat — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (tabiiy tilda "shu mavzudagi qarorlarni top")

### Q253. Arxivga kirish huquqi (kim ko'radi)
**Nima:** Arxivdagi maxfiy majlis/qarorlarni kim ko'ra oladi — hamma a'zomi, faqat Rais+CEO mi, otdeleniye bo'yicha cheklovmi.
**Nega kerak:** Ba'zi qarorlar (oylik, kadrlar, jazo) maxfiy; ochiq qoldirilsa ma'lumot sizadi.
**Variantlar:**
- A) Majlisga "Ochiq/Maxfiy" belgisi; Maxfiyni faqat a'zolar+CEO ko'radi, qolganga yopiq — nazoratli
- B) Hamma kengash arxivi a'zolarga ochiq — sodda, lekin maxfiyat yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (jazo/oylik maxfiyligi), Finance

### Q254. Arxiv saqlash muddati va o'chirish taqiqlash
**Nima:** Protokol/prikaz qancha saqlanadi va o'chirib bo'ladimi.
**Nega kerak:** Rasmiy hujjatlar (ayniqsa kadrlar prikazi) yillab saqlanishi shart; tasodifan o'chsa qonun buziladi.
**Variantlar:**
- A) Rasmiy hujjat o'chirilmaydi (faqat "arxivga ko'chirildi" holati), kadrlar prikazi muddatsiz, qolgani min. 5 yil — qonuniy
- B) Eski hujjatlarni o'chirish mumkin — joy tejaydi, lekin xavfli
- C) Keyin — hozir kerak emas

### Q255. Arxiv o'zgarmasligi (audit izi)
**Nima:** Arxivga tushgan hujjat keyin o'zgartirilsa, kim/qachon o'zgartirgani yozilib qoladimi (audit log).
**Nega kerak:** Audit izi bo'lmasa "kim hujjatni almashtirdi" deb topib bo'lmaydi; ishonch yo'qoladi.
**Variantlar:**
- A) Har ko'rish/o'zgartirish/yuklab olish audit izga yoziladi (kim/qachon) — to'liq ishonch
- B) Audit iz yo'q — yengil, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q256. Arxivdan eksport va hisobot
**Nima:** Arxivdan davr bo'yicha hisobot (masalan "Q2-2026 dagi barcha qarorlar va bajarilishi") PDF/Excel'ga chiqariladimi.
**Nega kerak:** Owner/tekshiruvchiga tayyor hisobot kerak; qo'lda yig'ish vaqt yeydi.
**Variantlar:**
- A) Bir tugma bilan davr hisoboti (qarorlar+bajarilish%+kechikkanlar) PDF/Excel — qulay
- B) Faqat ekranda ko'rish — sodda
- C) Keyin — hozir kerak emas

---

## BO'LIM 9 — Bog'lanish va chetki holatlar (qo'shimcha granular)

### Q257. Otsut-eslatma kanali (qaerga xabar boradi)
**Nima:** Majlis chaqiriq, doklad muddati, qaror kechikishi haqida xabar qayerga boradi — ERP ichi, Telegram, SMS, e-pochta.
**Nega kerak:** Faqat ERP ichida bo'lsa odam ko'rmaydi; Telegram orqali kelsa darhol o'qiydi.
**Variantlar:**
- A) ERP ichi + Telegram (otdeleniye guruhi/shaxsiy) — amaliy va tez
- B) Faqat ERP ichidagi bildirishnoma — sodda, lekin sekin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya (Telegram bot), Org-struktura (kimga yuborilishi manager_id/telegram_group dan)

### Q258. Majlisni o'tkazmaslik / qoldirish qoidasi
**Nima:** Majlis kvorum yo'qligi yoki favqulodda sabab bilan o'tmasa nima bo'ladi — qachonga ko'chadi, qaror bo'sh qoladimi.
**Nega kerak:** O'tmagan majlisning qarorlari va dokladlari yo'qolmasligi, keyingisiga to'g'ri ko'chishi kerak.
**Variantlar:**
- A) Avtomat keyingi sanaga ko'chiriladi; tayyor dokladlar+kun tartibi saqlanib o'tadi — ma'lumot yo'qolmaydi
- B) Bekor qilinadi, hammasi qaytadan — sodda, lekin ish takrorlanadi
- C) Keyin — hozir kerak emas

### Q259. Favqulodda majlis va shoshilinch qaror
**Nima:** Jiddiy muammoda (yirik brak, avariya, yirik buyurtma) favqulodda majlis tezda chaqirilib yengil kvorum bilan qaror qabul qilinadimi.
**Nega kerak:** Shoshilinch holatda 2 kun kutib bo'lmaydi; tezkor qaror mexanizmi kerak, lekin nazoratsiz emas.
**Variantlar:**
- A) Favqulodda majlis 3 soatda chaqiriladi, yengil kvorum (50%), lekin keyingi oddiy majlisda tasdiqlanadi — tez va nazoratli
- B) Hamma majlisga bir xil qoida — sodda, lekin sekin
- C) Keyin — hozir kerak emas

### Q260. Coordination ↔ boshqa modul bog'lanishi (qaror manbasi)
**Nima:** Qaror/farmoyish boshqa modulga ta'sir qilsa (masalan Production reja o'zgarishi, Finance byudjet) o'sha modulga avtomat signal boradimi.
**Nega kerak:** Qaror qog'ozda qolib, ishlab chiqarish bilarmaydi — bu eng katta uzilish; avtomat signal zanjirni bog'laydi.
**Variantlar:**
- A) Qaror turi bo'yicha tegishli modulga avtomat vazifa/signal yuboriladi (Production/Finance/HR/Warehouse) — to'liq integratsiya
- B) Faqat Coordination ichida qoladi, qo'lda uzatiladi — sodda, lekin uzuq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production, Finance, HR, Warehouse (qaror→amal zanjiri)

### Q261. Kengash a'zosi o'zgarishi (lavozim almashinuvi)
**Nima:** A'zo lavozimdan ketsa yoki yangi boshliq tayinlansa, kengash a'zoligi va davom etayotgan topshiriqlari nima bo'ladi.
**Nega kerak:** Eski a'zoga biriktirilgan ochiq topshiriqlar "egasiz" qolmasligi kerak.
**Variantlar:**
- A) Lavozim o'zgarsa a'zolik avtomat yangi egasiga o'tadi, ochiq topshiriqlar yangi mas'ulga ko'chadi (eslatma bilan) — uzilishsiz
- B) Qo'lda qayta biriktiriladi — nazoratli, lekin unutiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/Org-struktura (lavozim almashinuvi voqeasi)

### Q262. Majlis tili va ko'p tillilik
**Nima:** Protokol, doklad, farmoyish qaysi tilda yoziladi va saqlanadi — o'zbek lotin, o'zbek kirill, rus.
**Nega kerak:** Zavodda hujjatlar ko'pincha rus/kirill yuritiladi; tizim noto'g'ri tilni majburlasa ishlatilmaydi.
**Variantlar:**
- A) Asosiy til o'zbek lotin, lekin har hujjatga til tanlash (lotin/kirill/rus) imkoni — moslashuvchan
- B) Faqat o'zbek lotin — sodda, lekin amaliyotdan uzoq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: i18n (uz/uz-cyr/ru)

---

## BO'LIM 10 — KITOB-GROUNDED savollar (2020 fabrika hujjatlaridan)

> Quyidagi savollar RD-5 lavozim yo'riqnomalari, nazorat varaqalari va Bandlik/ketgan-kun/25-04 Excel fayllaridan olingan ANIQ qoidalar asosida. Manba ildizlari: Ички логистика бўлими бошлиғи (5-Dept, 13-bo'lim, Секция внутренней логистики), Дизайн бўлими раҳбари (5-Dept, СОЗ, Сексия Дизайна), 7 departament org-sxema, Bitrix24 karta-zanjir + status, techkarta↔material mosligi, podpisnoy list, qolip (СТП/кесувчи), rohler/poddon, 1-sutkalik (24h) reja, bekor turish, "Muvaffaqiyatli harakatlar va odatiy xatolar" blanki, statistik KPI, turniket, uch-karzina, ЦКП, Algoritm turi (2–8 bo'lim), papka №, priladka, smena (den/noch), Operator/Помошник, "Зарур заказлар".

### Q263. 1-sutkalik (24 soatlik) ishlab chiqarish rejasi — koordinatsiya asosi
**Nima:** Kitobda "1 суткалик ишлаб чиқариш режаси — режалаштириш бўлими томонидан ҳар куни тузиладиган 24 соатлик режа". Bu kunlik reja tizimda alohida hujjat sifatida tuzilib, ichki logistika/uchastka/omborga bir vaqtda tarqatiladimi?
**Nega kerak:** Ichki logistika boshlig'ining eng katta xatosi — "ишлаб чиқариш режасини ўз вақтида қабул қилмаслик". Reja bitta markazdan tarqalsa, hamma bir xil 24h rejani ko'radi.
**Variantlar:**
- A) Har kuni 1-sutkalik reja generatsiya qilinadi → logistika+uchastka+ombor kartasiga avtomatik tushadi — hamma sinxron
- B) Reja faqat rejalashtirish bo'limida qoladi, boshqalar so'rab oladi — qo'lda, kechikish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production (MPS/MES), Warehouse, Internal Logistics
  ↳ Agar A: reja kun davomida o'zgarsa, o'zgartirilgan reja kimga, qancha tez yetkaziladi? — variantlar: (1) darrov push + log, (2) faqat keyingi smena boshida.

### Q264. "Bekor turish" (idle/downtime) hodisasini koordinatsiya yozuvi qilish
**Nima:** Kitob "Бекор туриш" ni alohida atama qilib belgilagan (logistika sababli dastgoh vaqtincha to'xtashi). Dastgoh bekor tursa — sabab (material yo'q / qog'oz noto'g'ri / rohler band) bilan koordinatsiya hodisasi ochilsinmi?
**Nega kerak:** Ichki logistika boshlig'ining statistik ko'rsatkichi aynan "логистика сабабли юзага келган кечикишлар сони". Yozilmasa, bu raqam o'lchanmaydi.
**Variantlar:**
- A) Bekor turish hodisasi: sabab + boshlanish/tugash vaqti + mas'ul bo'lim → avtomatik statistika
- B) Faqat erkin izoh ("to'xtadi") — yoziladi lekin tahlil bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production OEE, Internal Logistics KPI, Reports

### Q265. Techkarta↔material mosligi: logistika to'xtatish huquqi (STOP)
**Nima:** Kitobdagi 1-vazifa misoli: techkartada "топлайнер", logistika "местный (макулатура)" chiqarmoqda → to'g'ri javob "чиқаришни тўхтатиб, техкартага мос қоғозни таъминлаш". Logistika xodimi nomuvofiqlik topsa, materialni "STOP — techkartaga mos emas" deb belgilab chiqishni bloklay oladimi?
**Nega kerak:** Bu fabrikaning real qaroridagi to'g'ri xulq. STOP bo'lmasa, noto'g'ri material uchastkaga ketib brak chiqaradi.
**Variantlar:**
- A) Logistika "techkartaga mos emas" STOP qo'ya oladi → chiqish bloklanadi + rejalashtirish/dizaynerga xabar — brak oldi olinadi
- B) Faqat ogohlantirish, chiqishni bloklamaydi — xodim e'tibor bermasligi mumkin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Quality, Warehouse, Production
  ↳ Agar A: STOP ni kim yechadi (override)? — (1) faqat rejalashtirish/dizayn rahbari, (2) ombor menejeri, (3) faqat 5-Dept rahbari.

### Q266. 5-Departament / 13-bo'lim org-sxema yo'naltirish manbai
**Nima:** Kitob aniq: 5-Departament, 13-bo'lim ichida "Секция внутренней логистики" va "Сексия Дизайна". Koordinatsiya hujjatlari aynan shu departament→bo'lim→sektsiya zanjiri bo'yicha yo'naladimi?
**Nega kerak:** Ichki logistika va dizayn ikkalasi ham 5-Dept/13-bo'limda — ko'p aloqada. Org-sxema noto'g'ri bo'lsa, doklad noto'g'ri odamga boradi.
**Variantlar:**
- A) Yo'naltirish 7-departament + bo'lim + sektsiya ierarxiyasiga aniq bog'lanadi — kitobdagi sxemaga mos
- B) Faqat "bo'lim" darajasi, sektsiyasiz — qo'polroq, sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-structure (Vysotskiy 7), barcha koordinatsiya yo'nalishi

### Q267. Dizayn↔Savdo↔Ishlab chiqarish zanjirida "ahborot узлуксизлиги" nazorati
**Nima:** Dizayn rahbari ЦКП si — "дизайн–савдо–ишлаб чиқариш занжирида ахборот узлуксизлиги". Buyurtma shu uchta bo'lim orasida uzilishsiz o'tdimi yo'qmi — koordinatsiya ko'rsatkichi sifatida o'lchanadimi?
**Nega kerak:** Eng ko'p kechikish "savdo→dizayn→ishlab chiqarish" handoffida. Uzilish qayerda bo'lganini ko'rsatmasa, aybni topib bo'lmaydi.
**Variantlar:**
- A) Har buyurtma uchun handoff nuqtalari vaqt bilan yoziladi (savdo→dizayn, dizayn→IChQ) — uzilish ko'rinadi
- B) Faqat oxirgi holat, oraliq handoffsiz — kim kechiktirgani noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM/Sales, Design, Production

### Q268. Bitrix24 karta-status zanjirini ERP koordinatsiyasiga ko'chirish
**Nima:** Kitob dizayn statuslarini aniq sanaydi: "Техник топшириқ келди" → "Дизайн тайёрланяпти" → "Тасдиқда" → "Ишлаб чиқаришга топширилди". ERP da dizayn kartasi aynan shu statuslar bilan yuritiladimi?
**Nega kerak:** Fabrika hozir Bitrix24 da ishlaydi; ERP shu zanjirni takrorlamasa, dizayn rahbari ikki tizimda ishlaydi.
**Variantlar:**
- A) Aynan shu 4 status standart bo'ladi — Bitrix24 ni almashtiradi
- B) Umumiy "ochiq/yopiq" status — sodda, lekin dizayn jarayoni ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Design module, CRM, Production handoff
  ↳ Agar A: "Тасдиқда" statusida kim tasdiqlaydi — buyurtmachimi yoki ichki rahbarmi? (podpisnoy list bilan bog'liq)

### Q269. Podpisnoy list (tasdiqlangan dizayn) — ishlab chiqarishga ruxsat darvozasi
**Nima:** Kitob: "Подписной лист — буюртмачи тасдиқлаган дизайн варианти, ишлаб чиқаришга топшириш учун асосий тасдиқловчи ҳужжат". Podpisnoy list yo'q bo'lsa, tizim buyurtmani ishlab chiqarishga o'tkazmaydimi (blok)?
**Nega kerak:** Dizayn rahbarining odatiy xatosi — "файлларни нотўғри форматда бериш". Tasdiqsiz dizayn ketsa, butun tirage brak bo'lishi mumkin.
**Variantlar:**
- A) Podpisnoy list bo'lmasa — IChQ ga o'tkazish bloklanadi — qattiq darvoza
- B) Ogohlantirish beradi, lekin o'tkazaveradi — moslashuvchan, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Design→Production gate, Quality, Sales

### Q270. Qolip (СТП пластина / кесувчи қолип) tayyorligi koordinatsiyasi
**Nima:** Dizayn rahbari "қолиплар (СТП пластиналари, кесувчи қолиплар) тайёрланишида дизайн қисми бўйича мувофиқликни таъминлайди". Buyurtma IChQ ga tushishidan oldin qolip holati koordinatsiyada ko'rinadimi?
**Nega kerak:** Qolip yetib kelmasa, IChQ to'xtaydi (bekor turish). Holat oldindan ko'rinmasa, kechikish faqat dastgoh oldida bilinadi.
**Variantlar:**
- A) Har buyurtmada qolip holati (tayyor / buyurtma berilgan / kerak emas) — IChQ rejasiga bog'lanadi
- B) Qolipni faqat dizayn bo'limi biladi, koordinatsiyada yo'q — ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production scheduling, Design, Procurement

### Q271. Rohler/poddon (ichki transport) tayyorligi va band-bo'shligi
**Nima:** Kitob: ichki logistika "рохлерлар, поддонлар"ning soz holatini ta'minlaydi. Rohler/poddon resurslari tizimda hisobga olinib, "qaysi rohler band, qaysi soz emas" ko'rinadimi?
**Nega kerak:** Bekor turishning bir sababi — rohler band yoki buzuq. Resurs ko'rinmasa, logistika boshlig'i og'zaki so'rab yuradi.
**Variantlar:**
- A) Ichki transport reestri — holat (soz / ta'mirda / band) + band jadval — resurs ko'rinadi
- B) Faqat oddiy ro'yxat, holat-jadvalsiz — kam foyda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Internal Logistics, Maintenance, Production

### Q272. Chiqindi/qoldiq chiqarish koordinatsiyasi (logistika vazifasi)
**Nima:** Ichki logistika "чиқиндилар ва қолдиқларни белгиланган тартибда ўз вақтида чиқарилишини" tashkil etadi. Chiqindi to'planib, "chiqarish kerak" signal koordinatsiyaga tushadimi?
**Nega kerak:** Chiqindi vaqtida chiqarilmasa, ish joyi to'ladi (tozalik xatosi kitobda alohida) va xavfsizlik buziladi.
**Variantlar:**
- A) Uchastka "chiqindi to'ldi" signal → logistikaga topshiriq → bajarish tasdig'i — yopiq tsikl
- B) Faqat kunlik jadval bo'yicha, signalsiz — to'lganini ko'rmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Internal Logistics, Warehouse (qoldiq karton rulon), Safety

### Q273. Algoritm turi (2–8 bo'lim) bo'yicha bo'lim-marshruti koordinatsiyasi
**Nima:** Excel (ketgan kun) buyurtmalarni "Algoritm turi: 2 ta бўлим … 8 ta бўлим" deb tasniflaydi — buyurtma nechta bo'limdan o'tadi. Koordinatsiyada buyurtmaning bo'lim-zanjiri (rezka→laminatsiya→tigel→kley→qadoqlash) ko'rinadimi?
**Nega kerak:** Logistika "barcha участкалар ўртасидаги ҳаракатни мувофиқлаштиради". Zanjir ko'rinmasa, keyingi bo'limga qachon o'tishini bilmaydi.
**Variantlar:**
- A) Har buyurtmaga bo'lim-zanjiri (algoritm turi) biriktiriladi → keyingi bo'lim avtomatik ko'rinadi — handoff aniq
- B) Faqat bo'limlar soni (raqam), ketma-ketliksiz — kam ma'lumot
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production routing, Internal Logistics, MES

### Q274. Buyurtma № / Papka № — koordinatsiyaning yagona identifikatori
**Nima:** Excel hamma joyda "Буюртма №" / "Папка №" bilan ishlaydi (2024-0499, papka raqami). ERP koordinatsiyasida hujjatlar (doklad/topshiriq/handoff) shu buyurtma/papka raqamiga bog'lanadimi?
**Nega kerak:** Fabrika "papka" tili bilan gaplashadi. Koordinatsiya boshqa ID ishlatsa, xodim ulay olmaydi.
**Variantlar:**
- A) Buyurtma/papka № yagona kalit — har koordinatsiya hujjati shunga bog'lanadi — fabrika tili
- B) Ichki ID ishlatiladi, papka № faqat ko'rsatma maydon — texnik, lekin tanish emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: barcha modullar (Sales, Production, Warehouse)

### Q275. Priladka (sozlash) vaqti koordinatsiyasi
**Nima:** Excel "Приладка учун кетган вақт (соат)" ni o'lchaydi. Bir buyurtmadan ikkinchisiga o'tishda priladka kerakligi smena rejasida oldindan ko'rinadimi?
**Nega kerak:** Priladka uzoq bo'lsa, keyingi buyurtma kechikadi. Logistika materialni priladka tugashiga moslab yetkazishi kerak.
**Variantlar:**
- A) Smena rejasida priladka oralig'i ko'rsatiladi → logistika va keyingi buyurtma shunga moslanadi
- B) Priladka faqat fakt sifatida yoziladi — rejaga ta'sir qilmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production scheduling, Internal Logistics

### Q276. Smena (den/noch) topshirig'i — koordinatsiya o'tkazmasi (handover)
**Nima:** Excel "смена: ден/ноч" bilan ishlaydi. Kunduzgi smena tugaganda tugallanmagan ishlar, ochiq topshiriqlar va to'xtashlar tungi smenaga rasmiy "smena topshirig'i" sifatida o'tadimi?
**Nega kerak:** Smena almashganda ma'lumot yo'qoladi ("og'zaki aytdim"). Yozma handover bo'lsa, tungi smena nimadan davom etishini biladi.
**Variantlar:**
- A) Smena handover yozuvi: tugamagan buyurtmalar + ochiq STOP/bekor turish + eslatmalar — keyingi smenaga o'tadi
- B) Faqat oxirgi holat avtomatik ko'rinadi, alohida handover yo'q — kontekst yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production (smena), Internal Logistics, HR

### Q277. "Muvaffaqiyatli harakatlar va odatiy xatolar" blanki — koordinatsiya yozuvi
**Nima:** Har yo'riqnomada "Кўп учрайдиган хатолар" va "Муваффақиятли ҳаракатлар" bo'limi bor; dizayn rahbari ularning "мунтазам ва холис тўлдирилишини таъминлайди". Bu blank tizimda davriy to'ldiriladigan koordinatsiya hujjati bo'ladimi?
**Nega kerak:** Bu fabrikaning bilim-yig'ish mexanizmi. Yozilmasa, xatolar takrorlanaveradi va o'rganish yo'qoladi.
**Variantlar:**
- A) Har bo'lim/karta uchun "muvaffaqiyatli harakat / odatiy xato" blanki — davriy to'ldiriladi + AI tahlilga kiradi
- B) Faqat HR qog'oz blanki, ERP da yo'q — eski usul davom etadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (LMS/karta AI), Quality, Coordination

### Q278. Kunlik / haftalik / oylik hisobot ritmi — koordinatsiya kalendari
**Nima:** Dizayn rahbari "кунлик, ҳафталик ва ойлик ҳисоботларни ўз вақтида раҳбариятга тақдим этади". Bu ritmlar tizimda eslatma + topshiriq sifatida avtomatlashtiriladimi (kunlik bugun, haftalik dushanba, oylik 1-sana)?
**Nega kerak:** Hisobot kechiksa, rahbar holatdan bexabar qoladi. Avtomatik ritm bo'lsa, har bo'lim o'z vaqtida topshiradi.
**Variantlar:**
- A) Har bo'limga kunlik/haftalik/oylik hisobot topshirig'i avtomatik ochiladi + kechiksa eskalatsiya — ritm o'rnatiladi
- B) Faqat eslatma, hisobot fayli tizimda yig'ilmaydi — yarim avtomat
- C) Keyin — hozir kerak emas
⤳ Ta'sir: barcha bo'lim rahbarlari, Reports

### Q279. Statistik ko'rsatkichlar (KPI) — koordinatsiyada avtomatik o'lchov
**Nima:** Har lavozimda aniq KPI: logistika — "режа бажарилиш даражаси (%)", "кечикишлар сони"; dizayn — "ўз вақтида макетлар улуши (%)", "қайта ишлашлар сони". Bu ko'rsatkichlar koordinatsiya hodisalaridan avtomatik hisoblanadimi?
**Nega kerak:** KPI qo'lda hisoblansa, soxta yoki kech bo'ladi. Bekor turish/handoff/STOP hodisalaridan avtomatik chiqsa — haqiqiy.
**Variantlar:**
- A) Har lavozimning yo'riqnomadagi KPI lari koordinatsiya hodisalaridan avtomatik hisoblanadi — real, manipulyatsiyasiz
- B) KPI ni rahbar qo'lda kiritadi — tez, lekin ishonchsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta KPI), Reports, Org-structure

### Q280. Buyurtma "tayyorlik %" — bo'limlararo umumiy ko'rsatkich
**Nima:** Bandlik Excelida "Буюртма тайёрлиги %" bor — buyurtma nechta foiz bo'limlardan o'tgani. Koordinatsiya panelida har buyurtmaning tayyorlik foizi bo'limlar zanjiri bo'yicha ko'rinadimi?
**Nega kerak:** "Buyurtma qayerda?" eng ko'p so'raladigan savol. Tayyorlik % ko'rinsa, savdo/menejer mijozga aniq javob beradi.
**Variantlar:**
- A) Har buyurtmaga tayyorlik % (o'tilgan bo'lim / jami bo'lim) — real vaqtda ko'rinadi
- B) Faqat "ochiq/yopiq" — foizsiz, taxminiy
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM (menejer), Production, Coordination dashboard

### Q281. Menejer (masalan "Azizov Avazxon - Menedjer 54") buyurtma egasi sifatida
**Nima:** Excelida buyurtmaga menejer biriktirilgan ("Azizov Avazxon - Menedjer (54)"). Koordinatsiyada har buyurtma bo'yicha mas'ul savdo menejeri ko'rinib, kechikish/STOP unga ham xabar boradimi?
**Nega kerak:** Menejer mijoz bilan gaplashadi. Buyurtma to'xtasa, menejer birinchi bilishi kerak — aks holda mijozga noto'g'ri muddat aytadi.
**Variantlar:**
- A) Buyurtma menejerga bog'lanadi → kechikish/STOP/handoff menejerga ham bildiriladi — mijozga to'g'ri xabar
- B) Menejer faqat boshida ko'rinadi, keyingi hodisalardan bexabar — uzilish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM/Sales, Notifications

### Q282. Turniket (kirish-chiqish) — "ish joyida bormi" signali
**Nima:** Kitob turniketni alohida atama qilgan ("кириш-чиқишни назорат қилади, карточка орқали"). Topshiriq beriladigan xodim hozir ish joyida (turniketdan kirgan)mi — koordinatsiyada hisobga olinadimi?
**Nega kerak:** Topshiriq ishda bo'lmagan odamga ketsa, bajarilmaydi. Logistika boshlig'i "иш жойини рухсатсиз ташлаб кетиш"ni xato deb belgilagan.
**Variantlar:**
- A) Topshiriq berishda turniket holati ko'rinadi (ishda / ishda emas) — yo'q odamga bermaslik/qayta yo'naltirish
- B) Turniket faqat HR davomatga ketadi, koordinatsiyaga ulanmaydi — alohida
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (davomat/turniket), Notifications

### Q283. "Uch karzina" (3-tray) hujjat tizimini ERP koordinatsiyasiga ko'chirish
**Nima:** Dizayn rahbari ish joyi vositalarida "ҳужжатлар учун 'уч карзина' тизими" bor. Koordinatsiyada har xodimning topshiriqlari shu uch holat (yangi / jarayonda / tugagan) bo'yicha guruhlanadimi?
**Nega kerak:** Bu fabrika ishlatadigan tanish ish-oqim modeli. ERP shu metaforani ishlatsa, xodim o'rganishsiz tushunadi.
**Variantlar:**
- A) Har xodim paneli 3 ustun: Yangi / Jarayonda / Tugagan (uch karzina) — tanish, sodda
- B) Bitta ro'yxat status filtri bilan — texnik, lekin metafora yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination UI, HR (karta)

### Q284. "Ишни ташлаб кетиш" / ish vaqtida boshqa ish — intizom signali
**Nima:** Kitob ikki xatoni alohida belgilagan: "иш вақтида бошқа ишлар билан банд бўлиш" va "иш жойини рухсатсиз ташлаб кетиш". Koordinatsiyada uzoq vaqt harakatsiz topshiriq rahbarga signal sifatida chiqadimi?
**Nega kerak:** Bu fabrikaning real intizom muammosi. Tizim passiv xodimni ko'rsatmasa, rahbar qo'lda kuzatadi.
**Variantlar:**
- A) Topshiriq X soat harakatsiz qolsa → rahbarga "harakatsiz" signal (e'tibor uchun) — yumshoq nazorat
- B) Hech qanday signal yo'q, faqat muddat o'tgach kechikkan — kech bilinadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), Org-structure

### Q285. "Раҳбар камчилиги" prinsipi — xato bo'lim rahbariga yoziladi
**Nima:** Kitob aniq: dizayn IChQ da muammo chiqarsa, bu "'дизайнер хатоси' деб эмас, балки раҳбар бошқарувидаги камчилик сифатида баҳоланади". Koordinatsiyada brak/qayta-ishlash hodisasi avtomatik bo'lim rahbariga (xodimga emas) yozilib, KPI siga ta'sir qiladimi?
**Nega kerak:** Bu fabrikaning boshqaruv falsafasi (mas'uliyat rahbarda). Tizim aybni faqat ijrochiga yozsa — falsafaga zid.
**Variantlar:**
- A) Bo'lim ichidagi xato/qayta-ishlash bo'lim rahbarining ko'rsatkichiga ham yoziladi — kitob prinsipiga mos
- B) Faqat ayni xodimga yoziladi — texnik, lekin falsafaga zid
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta KPI), Quality, Org-structure

### Q286. Ish yuklamasini muvozanatlash (bir dizayner band, biri bo'sh)
**Nima:** Kitobning amaliy topshirig'i: "Бир дизайнер ортиқча юклама остида, иккинчиси деярли бўш". Koordinatsiyada bo'lim rahbari xodimlar yuklamasini (ochiq topshiriq soni/vaqti) ko'rib, qayta taqsimlay oladimi?
**Nega kerak:** Adolatsiz taqsimot "жамоада норозилик ва бефарқлик" keltiradi (kitobda yozilgan). Yuklama ko'rinmasa, rahbar ko'z bilan chamalaydi.
**Variantlar:**
- A) Bo'lim ichida yuklama ko'rinishi (har xodimda ochiq ish soni/og'irligi) + bir tugmada qayta biriktirish — muvozanat
- B) Faqat ro'yxat, yuklama o'lchovisiz — qo'lda chamalash
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta), Design

### Q287. Ustuvorlik (1/2/keyingi navbat) — buyurtma navbatini belgilash huquqi
**Nima:** Dizayn/logistika ikkalasida "иш биринчи, иккинчи, кейинги навбатларга ажратилади"; Excel "очеред / очеред2" ham buni ko'rsatadi. Koordinatsiyada bo'lim rahbari buyurtma navbatini (1/2/3) belgilab, butun zanjirga ta'sir qila oladimi?
**Nega kerak:** "Қайси иш ишлаб чиқаришни тўхтатиб қўйиши мумкин"ligini rahbar biladi. Navbat tizimda bo'lmasa, FIFO bo'lib muhim ish ortda qoladi.
**Variantlar:**
- A) Buyurtmaga ustuvorlik (1/2/keyingi) belgilanadi → reja/navbat shunga qarab tartiblanadi — real boshqaruv
- B) Navbat faqat kelgan vaqt bo'yicha (FIFO), o'zgartirib bo'lmaydi — sodda, lekin qattiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production scheduling, Design, Sales

### Q288. Material yetishmovchiligi (dastgoh material kutmoqda) — koordinatsiya signali
**Nima:** Kitob misoli: "айрим дастгоҳлар материал етишмаслиги сабабли тўхтаб қолди". Uchastka "material yetishmadi" deb signal berib, logistika+ombor+rejalashtirishga bir vaqtda topshiriq tushadimi?
**Nega kerak:** Bu eng tez-tez bo'ladigan bekor turish sababi. Signal bo'lmasa, logistika boshlig'i tasodifan bilib qoladi.
**Variantlar:**
- A) Uchastka "material yetishmadi" signal → logistika (chiqarish) + ombor (zaxira) + rejalashtirish bir vaqtda xabardor — tez yechim
- B) Faqat logistikaga boradi — ombor/reja bexabar, sabab chuqurroq bo'lsa kechikadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Warehouse, Internal Logistics, Production, Planning

### Q289. Gofra qavati (3-qavat / 5-qavat) aralashtirish xatosi oldini olish
**Nima:** Kitob 2-vazifa misoli: bir smenada 5-qavatli va 3-qavatli gofra, omborda chiqarishda aralashtirib yuborilgan. Koordinatsiyada chiqariladigan material gofra-turi techkartaga mosligi tekshiriladimi (barcode/skanerda)?
**Nega kerak:** Aralashtirish butun buyurtmani brak qiladi. Tizim skanerda tekshirsa, inson xatosi oldi olinadi.
**Variantlar:**
- A) Material chiqarishda skaner techkarta gofra-turini solishtiradi → mos kelmasa ogohlantirish — xato oldi olinadi
- B) Faqat ko'z bilan, tizim tekshirmaydi — inson xatosiga ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Warehouse, Quality, POS Monitor

### Q290. Konstruktor bo'limi bilan dizayn koordinatsiyasi (5-Dept ichida)
**Nima:** 5-Departament tarkibida "дизайн, конструктор" alohida sanaladi. Qadoqlash konstruktsiyasi (o'lcham, begovka, vysechka) bo'yicha konstruktor↔dizayn koordinatsiyasi alohida handoff sifatida bo'ladimi?
**Nega kerak:** Dizayn chiroyli bo'lsa-yu konstruktsiya noto'g'ri bo'lsa, quti yig'ilmaydi. Bu ikki rol orasidagi uzilish ham brak chiqaradi.
**Variantlar:**
- A) Dizayn↔konstruktor handoff alohida bosqich (o'lcham/begovka/vysechka tasdig'i bilan) — to'liq zanjir
- B) Konstruktor ishi dizayn ichida, alohida handoffsiz — sodda, ko'rinmas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Design, Production (vysechka/begovka), Quality

### Q291. Buyurtma o'zgarishi — o'zgarish bildirishnomasi (logistika xatosi)
**Nima:** Logistika boshlig'ining odatiy xatosi — "ишлаб чиқаришдаги ўзгаришларни ҳисобга олмаслик". Buyurtmaga (o'lcham, material, miqdor, muddat) o'zgarish kiritilsa, ta'sirlangan barcha bo'limga avtomatik o'zgarish-bildirishnomasi ketadimi?
**Nega kerak:** Reja o'zgarganini logistika bilmasa, eski reja bo'yicha noto'g'ri material chiqaradi.
**Variantlar:**
- A) Buyurtma o'zgarishi → ta'sirlangan bo'limlarga (logistika/ombor/IChQ/dizayn) bildirishnoma + tasdiq talab — hech kim bexabar qolmaydi
- B) O'zgarish faqat yozuvda, push yo'q — bo'limlar o'zlari ko'rishi kerak
- C) Keyin — hozir kerak emas
⤳ Ta'sir: barcha modullar, Notifications

### Q292. Yig'ilish ishtiroki + undan chiqqan topshiriq bajarilishi bog'lanishi
**Nima:** Har yo'riqnomada "йиғилишларда фаол иштирок этиш, берилган топшириқлар бўйича ҳисоботларни белгиланган муддатларда тақдим этиш" umumiy vazifa. Yig'ilish ishtiroki va undan chiqqan topshiriq bir-biriga bog'lanib kuzatiladimi?
**Nega kerak:** Yig'ilishda kelishilgan ish bajarilmasa, yig'ilish behuda. Mavjud savollarda protokol bor, lekin "ishtirok + topshiriq bajarish" bog'lanishi yo'q.
**Variantlar:**
- A) Yig'ilish ishtiroki yoziladi + undan chiqqan topshiriqlar bajarilishi shu yig'ilishga ulanadi — yopiq tsikl
- B) Ishtirok va topshiriq alohida (bog'lanmagan) — qism-qism ko'rinish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (protokol), HR, Reports

### Q293. Energiya/resurs tejash (suv/gaz/svet) — javobgarlik signali
**Nima:** Logistika boshlig'i javobgarligida "Энергия ресурсларни тежалиши (сув, газ, свет)" alohida yozilgan. Bu koordinatsiya/karta KPI sifatida o'lchanadimi yoki faqat hujjatda qoladimi?
**Nega kerak:** Yo'riqnomada yozilgan javobgarlik o'lchanmasa, qog'ozda qoladi. Tejash signal/cheklov bo'lsa, real ta'sir qiladi.
**Variantlar:**
- A) Energiya tejash karta javobgarligiga KPI sifatida ulanadi (signal/oylik ko'rsatkich) — yo'riqnoma amalga oshadi
- B) Faqat hujjatda yozilgan, o'lchovsiz — qog'ozda qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta KPI), Operations, Reports

### Q294. "Назорат варақаси" (training nazorat ro'yxati) — koordinatsiya bilan bog'lash
**Nima:** Har lavozim "Назорат варақаси" (yo'riqnomani bosqichma-bosqich imzolab o'rganish) bilan keladi. Yangi/ko'chgan xodim nazorat varaqasini tugatmaguncha — unga shu lavozimning koordinatsiya topshiriqlari berilmaydimi (gate)?
**Nega kerak:** O'rganmagan xodimga mas'uliyatli topshiriq berilsa, xato qiladi. Bu fabrikaning real onboarding nazorati.
**Variantlar:**
- A) Nazorat varaqasi tugamasa — kartaning to'liq topshiriqlari ochilmaydi (yumshoq gate) — xavfsiz onboarding
- B) Ogohlantirish bor, lekin to'sib qo'ymaydi — moslashuvchan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (LMS/karta), Org-structure

### Q295. Rejalashtirishdan ma'lumot "talab qilish" huquqi (formal so'rov)
**Nima:** Logistika boshlig'ining huquqi — "режалаштириш ва ишлаб чиқариш бўлимларидан иш режалари ва логистикага таъсир қилувчи маълумотларни талаб қилиш". Koordinatsiyada bir bo'lim boshqasidan rasmiy "ma'lumot so'rovi" yubora oladimi (kuzatiladigan)?
**Nega kerak:** Og'zaki so'rov javobsiz qoladi. Rasmiy so'rov bo'lsa, kim javob bermaganligi ko'rinadi.
**Variantlar:**
- A) Bo'limlararo rasmiy "ma'lumot so'rovi" hujjati (muddat + javob holati bilan) — kuzatiladi
- B) Faqat og'zaki/chat, rasmiy so'rovsiz — javob kafolati yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (gorizontal), Planning, Production

### Q296. Gorizontal (bo'limlararo) workflow qoidalari — kim kimga nima yuboradi
**Nima:** Org-modelda "GORIZONTAL (bo'limlararo, workflow_rules jadval)" bor; kitobda har lavozim aniq bo'limlar bilan ishlaydi (logistika→reja/IChQ/ombor; dizayn→savdo/IChQ/texnolog). Koordinatsiyada bu gorizontal yo'nalishlar oldindan qoidalashtiriladimi?
**Nega kerak:** Kim kimga murojaat qilishi har safar qo'lda tanlansa, xato bo'ladi. Qoida bo'lsa, hujjat to'g'ri yo'lga tushadi.
**Variantlar:**
- A) Bo'limlararo workflow qoidalari jadvali (manba bo'lim → maqsad bo'lim → hujjat turi) — avtomatik yo'naltirish
- B) Har safar yuboruvchi qo'lda tanlaydi — moslashuvchan, lekin xatoga ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-structure (gorizontal), barcha bo'limlar

### Q297. ЦКП (Qimmatli Yakuniy Mahsulot) — bo'lim natijasini o'lchash
**Nima:** Har lavozimda aniq ЦКП bor (logistika — "тайёр ҳолатга келтирилган ярим тайёр маҳсулотлар"; dizayn — "буюртмачи тасдиқлаган дизайн"). Koordinatsiya/karta paneli har bo'limning ЦКП chiqishini (necha dona, qancha vaqtda) o'lchaydimi?
**Nega kerak:** ЦКП fabrikaning markaziy o'lchov birligi. Bo'limni ЦКП bilan o'lchamasa, faollik o'rniga natija ko'rinmaydi.
**Variantlar:**
- A) Har bo'lim/karta ЦКП chiqishi o'lchanadi (son + vaqt) — natijaga yo'naltirilgan boshqaruv
- B) Faqat faollik (qancha ish qildi), ЦКП hisobsiz — natija ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta AI), Reports, Org-structure

### Q298. Buyurtma muddati (plan vs fakt) bo'yicha kechikish koordinatsiyasi
**Nima:** Excel "Плановая продолж. / Факт. выраб. / Начат / Завершит" ni solishtiradi. Koordinatsiyada buyurtma plan-fakt og'ishi (kechikmoqda) avtomatik aniqlanib, mas'ul bo'lim/menejerga signal beradimi?
**Nega kerak:** Kechikish dastgoh oldida emas, ertaroq aniqlansa, chora ko'rsa bo'ladi. Logistika KPI si "режадан оғиш сони" aynan shu.
**Variantlar:**
- A) Plan-fakt og'ishi real vaqtda hisoblanadi → og'ish chegaradan oshsa signal — erta ogohlantirish
- B) Faqat tugagach hisoblanadi (post-fakt) — kech, faqat hisobot uchun
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production, CRM (menejer), Reports

### Q299. Brak soni ("Брак сони") — bo'lim koordinatsiyasi va sabab biriktirish
**Nima:** Excel har buyurtmada "Брак сони" yuritadi. Brak qayd etilganda — qaysi bo'limda, qaysi sabab (material/dizayn/dastgoh/inson) bilan koordinatsiya hodisasi ochilib, mas'ul bo'limga boradimi?
**Nega kerak:** Brak sabab-belgisiz qolsa, takrorlanadi. Dizayn rahbari KPI si "қайта ишлашлар сони" — bu bilan bog'liq.
**Variantlar:**
- A) Brak hodisasi: bo'lim + sabab + buyurtma № → mas'ul rahbar KPI siga ulanadi — ildiz ko'rinadi
- B) Faqat brak soni yoziladi, sababsiz — raqam bor, tahlil yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Quality, Production, Design

### Q300. Norma vs fakt (ishchi ish-normasi) — uchastka koordinatsiyasi
**Nima:** Iyun-ishchilar Excelida "Норма / Жами ишлаган / кунлик %" har xodim bo'yicha yuritiladi ("Кунига 54% дан ишлаган"). Koordinatsiyada smena/uchastka rahbari xodimlarning norma-bajarilishini real ko'rib, past bo'lsa aralasha oladimi?
**Nega kerak:** Norma past bo'lsa, butun buyurtma kechikadi. Excel qo'lda yuritiladi; ERP da real bo'lsa, rahbar darrov ko'radi.
**Variantlar:**
- A) Real norma-bajarilish % (xodim/uchastka) koordinatsiyada → past bo'lsa rahbarga signal — operativ aralashuv
- B) Faqat oy oxirida hisoblanadi (hozirgi Excel kabi) — kech bilinadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (norma/oylik), Production

### Q301. Operator + yordamchi (Помощник) juftligi — koordinatsiya biriktirish
**Nima:** Excel buyurtmada "Оператор / Помошник" juftligini ko'rsatadi. Koordinatsiyada buyurtma/dastgohga operator + yordamchi juftligi biriktirilib, topshiriq/signal ikkalasiga ham boradimi?
**Nega kerak:** Operatorga signal ketib, yordamchi bexabar bo'lsa, ish to'liq tashkillanmaydi. Juftlik fabrikaning real ish birligi.
**Variantlar:**
- A) Dastgoh/buyurtmaga operator+yordamchi juftligi biriktiriladi → ikkisi ham koordinatsiya signalini oladi
- B) Faqat operator biriktiriladi — yordamchi qo'lda xabar oladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (smena), Production

### Q302. Kichiklashgan buyurtma (razmer optimizatsiyasi) — qaror koordinatsiyasi
**Nima:** "Kichik buyurtmalar.xlsx" da M. Nosirov razmer kichiklashtirib foyda hisoblaydi (eski/yangi razmer, foyda kg). Bunday optimizatsiya taklifi koordinatsiyada dizayn/konstruktor/savdo/rahbar tasdig'idan o'tadigan qaror sifatida yuritiladimi?
**Nega kerak:** Razmer o'zgartirish mijoz/sifatga ta'sir qiladi — bir bo'lim o'zboshimcha qila olmaydi. Qaror zanjiri bo'lmasa, kelishuvsiz o'zgaradi.
**Variantlar:**
- A) Razmer/optimizatsiya taklifi koordinatsiya qarori sifatida (dizayn→savdo→rahbar tasdiq) — kelishilgan o'zgarish
- B) Faqat tahlil fayli, qaror zanjiri yo'q — Excelda qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Design, Sales, Finance (foyda)

### Q303. Yo'nalish turi (ofs-kar / ofs-gof / flx-gof) bo'yicha bo'lim-marshruti
**Nima:** "ketgan kun" Excelida "Йўналишлар: ofs кар / ofs гоф / flx гоф" buyurtma marshrutini belgilaydi. Koordinatsiya har buyurtmaga yo'nalish turini biriktirib, shu turga mos bo'lim-zanjirini avtomatik chizadimi?
**Nega kerak:** Yo'nalish turi keyingi bo'limlar zanjirini belgilaydi. Noto'g'ri yo'nalish = noto'g'ri dastgoh = qayta ishlash.
**Variantlar:**
- A) Yo'nalish turi (ofs-kar/ofs-gof/flx-gof) → mos bo'lim-marshruti avtomatik ochiladi — to'g'ri zanjir
- B) Yo'nalishni har bosqichda qo'lda tanlash — moslashuvchan, lekin xatoga ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production routing, Internal Logistics, MES

### Q304. "Ишлаб чиқаришда бошланмасдан қолган кунлар" — kechikkan-start signali
**Nima:** "ketgan kun" Excelida "Ишлаб чиқаришда бошланмасдан қолган кунлар" ustuni bor — buyurtma ochilgan, lekin IChQ boshlanmagan kunlar. Koordinatsiyada bu "boshlanmagan" buyurtmalar avtomatik aniqlanib, rejalashtirish/logistikaga signal beradimi?
**Nega kerak:** Boshlanmagan buyurtma ko'zdan qochadi (logistika xatosi: "режани ўз вақтида қабул қилмаслик"). Signal bo'lsa, ko'tariladi.
**Variantlar:**
- A) Ochilgan lekin N kun boshlanmagan buyurtmalar avtomatik signal → rejalashtirish/logistikaga — qotib qolish oldi olinadi
- B) Faqat hisobotda ko'rinadi (qo'lda tekshiriladi) — kech
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning, Internal Logistics, Coordination dashboard

### Q305. "Зарур заказлар" (shoshilinch buyurtmalar) — koordinatsiya bayrog'i
**Nima:** "25-04" Excelida "ЗАРУР ЗАКАЗЛАР" alohida belgilangan. Koordinatsiyada buyurtmaga "shoshilinch" bayrog'i qo'yilsa, u butun zanjirda ajralib (rang/yuqori navbat) ko'rinadimi?
**Nega kerak:** Shoshilinch buyurtma oddiy navbatda qolsa, kechikadi. Bayroq bo'lsa, hamma bo'lim ustuvor ko'radi.
**Variantlar:**
- A) "Shoshilinch" bayrog'i → barcha bo'lim panelida ajralib + navbat tepasida — birgalikda tezlashtirish
- B) Faqat reja ichida belgilanadi, vizual ajralmaydi — e'tibordan chetda qolishi mumkin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production, Sales, Internal Logistics

### Q306. Kesilgan qog'oz / qoldiq rulon — ichki xizmat so'rovi
**Nima:** Excelda "Кесилган қоғоз хизмати", "Қолдиқ картон рулон / кесиш учун" kabi ichki xizmatlar bor. Koordinatsiyada bir bo'lim boshqasidan ichki xizmat (kesish, rulon tayyorlash) so'rov yuborib, bajarish kuzatiladimi?
**Nega kerak:** Ichki xizmat og'zaki so'ralsa, navbat va mas'uliyat yo'qoladi. Rasmiy so'rov bo'lsa, kim qachon bajargani ko'rinadi.
**Variantlar:**
- A) Ichki xizmat so'rovi (kesish/rulon) — so'rovchi → bajaruvchi bo'lim, muddat + bajarish tasdig'i bilan
- B) Og'zaki/chat, rasmiy so'rovsiz — kuzatib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Internal Logistics, Production

### Q307. Smena tayyorligi cheklisti (10 daqiqa oldin + tayyorlik)
**Nima:** Dizayn yo'riqnomasi: "Иш куни бошланишидан 10 дақиқа аввал иш жойида бўлиши". Smena boshlanishidan oldin dastgoh/material/qolip tayyorligi koordinatsiyada "smena tayyor" cheklisti bilan tasdiqlanadimi?
**Nega kerak:** Smena boshida tayyorlik bo'lmasa, birinchi soatlar bekor turish bilan ketadi. Cheklist bo'lsa, smena tayyor boshlanadi.
**Variantlar:**
- A) Smena boshida "tayyorlik" cheklisti (material/qolip/dastgoh/xodim) → tasdiqlanmaguncha bekor turish hisoblanmaydi
- B) Cheklistsiz, og'zaki tayyorlik — tayyorlik o'lchanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Production (smena), Internal Logistics, HR

### Q308. Tijorat siri / dizayn fayllari maxfiyligi — koordinatsiyada ko'rish huquqi
**Nima:** Ikkala yo'riqnomada "тижорат сирлари / дизайн файллари / ички маълумотларни ҳимоя қилиш" javobgarligi bor. Koordinatsiya hujjatlari (doklad/topshiriq/protokol) bo'lim/daraja bo'yicha ko'rish-ruxsati bilan cheklanadimi?
**Nega kerak:** Maxfiy ma'lumot (narx, mijoz, dizayn fayli) barcha xodimga ochiq bo'lsa, javobgarlik buziladi. Ruxsat darajasi bo'lishi shart.
**Variantlar:**
- A) Koordinatsiya hujjatlari ko'rish-ruxsati bo'lim/daraja/karta bo'yicha cheklanadi — maxfiylik saqlanadi
- B) Hamma o'z bo'limidagini ko'radi, daraja-cheklovsiz — sodda, lekin sirlar oqishi mumkin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Security/permissions, Design, Sales

### Q309. Direktor (Pozilov A.A.) tasdig'i — eng yuqori koordinatsiya darvozasi
**Nima:** Har yo'riqnoma "ТАСДИҚЛАЙМАН директор / Позилов А.А." imzosi bilan boshlanadi. Koordinatsiyada ma'lum tur qarorlar (yangi lavozim, katta xarajat, prikaz) direktor tasdig'i darvozasidan o'tishi kerakmi va u tizimda formal qadam bo'ladimi?
**Nega kerak:** Fabrikada eng yuqori tasdiq direktorda. Tizim bu darvozani qo'ymasa, muhim qaror nazoratsiz o'tadi.
**Variantlar:**
- A) Belgilangan turdagi qarorlar direktor tasdiq darvozasidan o'tadi (elektron imzo qadami) — yuqori nazorat
- B) Direktor faqat hisobotda ko'radi, formal darvoza yo'q — tez, lekin nazorat zaif
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (prikaz/sessiya), Org-structure, Finance

### Q310. ТТ (Texnik topshiriq) to'liqligi tekshiruvi — dizaynni boshlash darvozasi
**Nima:** Kitob: ТТ da "маҳсулот тури, ўлчамлари, материал, босма усули, ранглар, матн, логотип, миқдор, махсус талаблар" bo'lishi shart; dizayn rahbari xatosi — "маълумотларни тўлиқ текширмасдан иш бошлаш". Koordinatsiyada ТТ to'liq to'ldirilmasa, dizayn ishi boshlanmaydimi (gate)?
**Nega kerak:** To'liq bo'lmagan ТТ bilan boshlangan dizayn qayta ishlanadi. Majburiy maydonlar bo'lsa, savdo to'liq topshiradi.
**Variantlar:**
- A) ТТ majburiy maydonlari to'ldirilmasa — dizaynga o'tkazib bo'lmaydi (gate) — qayta-ishlash kamayadi
- B) Ogohlantirish bor, lekin o'tkazaveradi — savdoga qulay, lekin xatoga ochiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sales→Design handoff, CRM, Quality

### Q311. Bo'lim rahbari javob muddati (SLA) — "зудлик билан чора кўриш"
**Nima:** Kitob: kechikish/nomutanosiblik aniqlansa, rahbar "зудлик билан чора кўради". Koordinatsiyada rahbarga kelgan muammo signaliga javob/chora muddati (SLA) belgilanib, kechiksa yuqoriga eskalatsiya bo'ladimi?
**Nega kerak:** "Zudlik" o'lchovsiz so'z. SLA bo'lsa, qaysi rahbar javobni kechiktirgani ko'rinadi.
**Variantlar:**
- A) Har muammo signaliga rahbar javob SLA si (masalan 2 soat) → o'tsa avtomatik yuqoriga — "zudlik" o'lchanadi
- B) Muddatsiz, rahbar o'zi qaraydi — kechikish ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (eskalatsiya), Org-structure, KPI

### Q312. Koordinatsiya hodisalari karta-AI ga oziq (lavozim mosligi bahosi)
**Nima:** Vizyonda har kartaning AI'si xodim↔karta mosligini baholaydi. Koordinatsiya hodisalari (kechikish, STOP, brak, norma %, javob SLA) shu karta-AI ga kirib, "bu xodim shu kartaga mos kelmoqdami" bahosiga ta'sir qiladimi?
**Nega kerak:** Karta-AI faqat statik ma'lumotdan emas, real koordinatsiya xulqidan baho bersa, haqiqiy bo'ladi. Bu xodim-mosligi bahosi (statistik hisobot emas).
**Variantlar:**
- A) Koordinatsiya hodisalari karta-AI ga real signal bo'ladi → xodim-karta mosligi dinamik baholanadi — vizyonga to'liq mos
- B) Karta-AI faqat statik (lavozim/razryad) ma'lumotdan baho beradi, koordinatsiyadan ajralgan — kam aniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta-markazli model, AI), Org-structure

DONE: Coordination — 105 (50 yangi kitob-grounded, Q56–Q105).

## 5. Director / Strategiya

### Q313. Har lavozim "Лавозим мақсади" maydonini ERP saqlaydimi
**Nima:** Fabrika yo'riqnomasidagi "Лавозимнинг мақсади" (masalan ички логистика: "ишлаб чиқариш жараёнларини узлуксиз таъминлаш...") har kartaga matn maydon sifatida kiritilsinmi.
**Nega kerak:** Holat va ЦКП shu maqsaddan kelib chiqadi; maqsadsiz karta "to'g'ri ish ta'rifi" bo'lolmaydi.
**Variantlar:**
- A) Ha, har kartada majburiy `position_purpose` matn maydoni — yo'riqnomadan ko'chiriladi (vizyonga to'liq mos)
- B) Faqat bo'lim darajasida maqsad, lavozimda yo'q — soddaroq, lekin karta-markaz buziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR karta-model, AI baholash (xodim↔karta mosligi maqsaddan o'lchanadi)

### Q314. ЦКП (Лавозимнинг ЦКП си) har kartaning asosiy chiqishimi
**Nima:** Yo'riqnomadagi "Лавозимнинг ЦКП си" (ички логистика: "Ишлаб чиқариш учун тайёр ҳолатга келтирилган ярим тайёр маҳсулотлар") ERP da har kartaga bog'lansinmi.
**Nega kerak:** ЦКП — bu lavozimning yakuniy mahsuloti; statistika va holat shuni o'lchashi kerak.
**Variantlar:**
- A) Ha, har kartada `ckp` maydoni + holat formulasi ЦКП bajarilishiga bog'lanadi (ShVB modeli)
- B) ЦКП faqat hujjatda qoladi, ERP o'lchamaydi — sodda, lekin "produkt o'lchovi" yo'qoladi
- C) Keyin — hozir kerak emas

### Q315. Yo'riqnomadagi "1-4 продукт" bo'sh maydonlari nima
**Nima:** Har yo'riqnomada "X бўлими бошлиғининг 1-/2-/3-/4-продукти:" bo'sh qoldirilgan — bular ERP da to'ldirilishi kerakmi.
**Nega kerak:** Owner hujjatda 4 ta produkt slot qoldirgan — demak har lavozim 4 ta o'lchanadigan mahsulot berishi rejalashtirilgan.
**Variantlar:**
- A) Ha, har kartada 1-4 produkt + har biriga statistika ko'rsatkichi (ЦКП ni 4 o'lchovga bo'lish)
- B) Faqat 1 ta asosiy produkt (ЦКП) — qolgan 3 bo'sh qoladi
- C) Keyin — hozir kerak emas
  ↳ Agar A: produktlar soni lavozimga qarab har xilmi (2-4) yoki qat'iy 4 tami? — A) moslashuvchan B) qat'iy 4

### Q316. Оргсхема joylashuvi "5-Департамент, 13-бўлим, Секция" formatida saqlansinmi
**Nima:** Yo'riqnoma "Оргсхемадаги жойлашуви: 5-Департамент, 13-бўлим, Секция внутренней логистики" deb yozadi — ERP shu 3 darajali kodni saqlasinmi.
**Nega kerak:** Bu Vysotskiy-7 daraxti bilan ulanadi; raqamli kod (5/13/секция) navigatsiya va hisobot uchun ishlatiladi.
**Variantlar:**
- A) Ha, `department_no` + `unit_no` + `section_name` 3 maydon — hujjat formatiga aynan mos
- B) Faqat erkin matn "joylashuv" — sodda, lekin filtr/agregatsiya qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (Vysotskiy-7), vertikal manager_id zanjiri

### Q317. Director hujjatda "5-Департамент" ichida 5 ta bo'lim borligini ko'rsatadi
**Nima:** Hujjatdagi javob varianti "5-Департамент (сифат назорати, режалаштириш, дизайн, конструктор ва бошқа бўлимлар)" — director dashboard shu 5 bo'limni alohida ko'rsatsinmi.
**Nega kerak:** Owner 5-departamentni eng murakkab (5 bo'lim) deb belgilagan — director uchun bu eng ko'p e'tibor talab qiladigan zona.
**Variantlar:**
- A) Ha, 5-departament alohida drill-down: 5 bo'lim har biri o'z holati bilan (real struktura)
- B) Departament yagona ko'rsatkich sifatida — sodda
- C) Keyin — hozir kerak emas

### Q318. Statistik ko'rsatkich "режа бажарилиш даражаси (%)" — director uchun bosh KPI
**Nima:** Har yo'riqnomada birinchi stat-ko'rsatkich "...режа бажарилиш даражаси (%)" — bu director dashboardning markaziy raqami bo'lsinmi.
**Nega kerak:** Bu butun fabrika bo'ylab takrorlanadigan yagona umumiy o'lchov — director uni agregat ko'rishi kerak.
**Variantlar:**
- A) Ha, "Reja bajarilish %" fabrika bo'ylab agregat + har bo'lim breakdown (yo'riqnoma metrikasiga mos)
- B) Faqat ishlab chiqarish reja %, boshqa bo'limlar alohida — qisman
- C) Keyin — hozir kerak emas

### Q319. "Кечикишлар сони" va "режадан оғиш ҳолатлари сони" — alohida hisoblansinmi
**Nima:** Yo'riqnoma 2 ta nozik ko'rsatkichni ajratadi: "...сабабли юзага келган кечикишлар сони" va "Режадан оғиш ҳолатлари сони".
**Nega kerak:** Kechikish (oqibat) va rejadan og'ish (sabab) — har xil narsa; ikkalasini ajratish ildiz-sababni ko'rsatadi.
**Variantlar:**
- A) Ha, 2 alohida counter: `delay_count` + `plan_deviation_count` har bo'lim uchun (sabab/oqibat ajratiladi)
- B) Yagona "muammo soni" — sodda, lekin tahlil qashshoq
- C) Keyin — hozir kerak emas
  ↳ Agar A: rejadan og'ish qayd qilinganda sabab kategoriyasi (material/transport/operator/...) tanlansinmi? — A) majburiy sabab B) ixtiyoriy

### Q320. "Бекор туриш" (downtime) fabrika lug'atidagi rasmiy atama — director kuzatsinmi
**Nima:** Glossariy "Бекор туриш — иш вақти давом этаётган бўлса-да, ...ишлаб чиқариш жараёнининг вақтинча тўхтаб қолиши" deb ta'riflaydi. Director bu bekor turishlarni umumiy soat/miqdorda ko'rsinmi.
**Nega kerak:** Owner bekor turishni alohida atama qilib belgilagan — bu fabrikaning eng katta yo'qotish manbai.
**Variantlar:**
- A) Ha, "Bekor turish (downtime)" director dashboardda soat + sabab bo'yicha (yo'riqnoma atamasiga mos)
- B) Faqat MES da, director ko'rmaydi — qisman
- C) Keyin — hozir kerak emas

### Q321. A-System (eski tizim) bilan EuroPrint ERP qanday bog'lanadi
**Nima:** Glossariy "A-System — ишлаб чиқариш, режа, ҳисоб-китоб ва факт маълумотларини юритиш учун" deydi. EuroPrint A-System o'rnini bosadimi yoki u bilan ishlaydimi.
**Nega kerak:** Xodimlar A-System ga o'rgangan; ko'chish strategiyasi director qarori.
**Variantlar:**
- A) EuroPrint A-System ni TO'LIQ o'rnini bosadi — eski tizim arxivga (yagona haqiqat manbai)
- B) Vaqtincha parallel — A-System dan import, asta ko'chish (xavfsiz, lekin 2 tizim)
- C) Keyin — hozir kerak emas

### Q322. "1 суткалик ишлаб чиқариш режаси" — kunlik 24-soatlik reja ob'ekti bo'lsinmi
**Nima:** Glossariy "1 суткалик ишлаб чиқариш режаси — ...кейинги 24 соатлик режасини белгилаб берувчи ҳужжат" deb belgilaydi. ERP da bu kunlik reja rasmiy ob'ektmi.
**Nega kerak:** Butun logistika va statistika shu kunlik rejaga bog'langan — director uning bajarilishini kuzatadi.
**Variantlar:**
- A) Ha, "Sutkalik reja" alohida ob'ekt (har kuni tuziladi) + bajarilish % director da (yo'riqnomaga mos)
- B) Faqat haftalik/oylik reja, kunlik yo'q — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (PP), MES, ichki logistika

### Q323. "Кўп учрайдиган хатолар" ro'yxati AI risk-reyestriga aylansinmi
**Nima:** Har yo'riqnomada 7-8 ta "Кўп учрайдиган хатолар" sanab o'tilgan (masalan "Ишлаб чиқариш режасини ўз вақтида қабул қилмаслик", "Бўлимлар билан етарли алоқа қилмаслik"). Bu ro'yxat ERP da risk-reyestr bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun tipik xatolarni allaqachon yozgan — AI shularni avtomatik kuzatib ogohlantirishi mumkin.
**Variantlar:**
- A) Ha, har kartada "tipik xatolar" ro'yxati + AI har birini real-time tekshiradi (xato yuz bersa alert)
- B) Faqat ko'rsatma sifatida ko'rsatiladi, AI tekshirmaydi — sodda
- C) Keyin — hozir kerak emas

### Q324. "Муваффақиятли ҳаракатлар" ro'yxati ideal-kartina manbai bo'lsinmi
**Nima:** Yo'riqnoma "Муваффақиятли ҳаракатлар" ni sanaydi (masalan "Ишлаб чиқариш режасини олдиндан қабул қилиш", "Ҳисоботларни ўз вақтида тайёрлаш"). Bu ideal xulq-namuna ERP da ko'rinsinmi.
**Nega kerak:** Owner har lavozim uchun "to'g'ri ishlash modeli"ni yozib qo'ygan — bu kartaning ideal kartinasidir.
**Variantlar:**
- A) Ha, har kartada "muvaffaqiyatli harakatlar" = ideal model + AI xodimni shu modelga qarab baholaydi
- B) Faqat o'quv materialida ko'rsatiladi — qisman
- C) Keyin — hozir kerak emas

### Q325. "Жавобгарликлари" — moddiy/maънавий javobgarlik darajalari saqlansinmi
**Nima:** Yo'riqnoma javobgarlikni sanaydi va "...ҳам моддий ҳам маънавий томонидан жавобгар... меҳнат, фуқаролик ва жиноят кодексларига кўра" deb yozadi. ERP javobgarlik turini saqlasinmi.
**Nega kerak:** Har lavozim qaysi sohada javobgar ekani aniq belgilangan — bu nizo/jazo holatlarida asos.
**Variantlar:**
- A) Ha, har kartada "javobgarlik bandlari" + sodir bo'lganda HR voqeasiga bog'lanadi (hujjatga mos)
- B) Faqat matn sifatida saqlanadi — sodda
- C) Keyin — hozir kerak emas

### Q326. "Тижорат сирларини ошкор этиш" javobgarligini tizim kuzatsinmi
**Nima:** Yo'riqnoma "Корхона тижорат сирларини ошкор этганлик учун Ўзб.Рес жиноят кодексига кўра жавобгар" deydi. Maxfiy ma'lumotga kirishni director ko'rsinmi.
**Nega kerak:** Owner tijorat siri masalasini har lavozim hujjatiga qo'shgan — maxfiylik audit izi muhim.
**Variantlar:**
- A) Ha, maxfiy ma'lumot (narx, mijoz, formula) kirishi audit-log + director ko'radi (sir himoyasi)
- B) Faqat ruxsat darajasi cheklaydi, alohida log yo'q — qisman
- C) Keyin — hozir kerak emas

### Q327. "Энергия ресурслари тежалиши (сув, газ, свет)" — director ko'rsatkichimi
**Nima:** Yo'riqnoma javobgarlik sifatida "Энергия ресурсларни тежалиши учун. (сув, газ свет)" deb yozadi. ERP energiya sarfini kuzatsinmi.
**Nega kerak:** Owner energiya tejamkorligini rasmiy javobgarlik qilgan — bu xarajat va ekologik ko'rsatkich.
**Variantlar:**
- A) Ha, suv/gaz/elektr oylik sarfi director dashboardda (manual kiritish yoki schyotchik) + trend
- B) Faqat moliya xarajatida ko'rinadi, alohida emas — qisman
- C) Keyin — hozir kerak emas

### Q328. "Турникет" (kirish-chiqish) ma'lumoti davomat statistikasiga ulansinmi
**Nima:** Glossariy "Турникет — кириш-чиқишни назорат қиладиган электрон тизим... махсус карточка орқали" deydi. ERP turniketdan davomat olsinmi.
**Nega kerak:** Owner turniket kartasini har yo'riqnomaga qo'shgan (muvaffaqiyatli harakat) — davomat real vaqtda kelishi mumkin.
**Variantlar:**
- A) Ha, turniket → davomat integratsiyasi (kirish/chiqish vaqti avtomatik) + director kech kelish statistikasi
- B) Davomat qo'lda kiritiladi — sodda, lekin xato ko'p
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR davomat, ish haqi (kun normasi)

### Q329. "Назорат варақаси" (control sheet) — har karta uchun o'quv jarayoni ob'ektimi
**Nima:** Har lavozimda alohida "НАЗОРАТ ВАРАҚАСИ" hujjati bor — "ходим томонидан ўқилиши, тушунилиши ва амалда қўлланилиши шарт бўлган... мавзулар рўйхати". ERP da bu o'quv-nazorat varaqasi bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun mavzular ketma-ketligini va "o'qib chiqdim" tasdig'ini hujjatlashtirgan — bu darslik-kartaga bog'lanish.
**Variantlar:**
- A) Ha, har kartada "Nazorat varaqasi" = mavzular + xodim "tasdiqladim" qadamlari (vizyon: darslik kartaga)
- B) Faqat umumiy LMS kurs — karta bilan bog'lanmaydi (qisman)
- C) Keyin — hozir kerak emas

### Q330. Nazorat varaqasidagi "тасдиқлайман" qadamlari (тема-тема) kuzatilsinmi
**Nima:** Nazorat varaqasi har mavzu uchun "...вазифасини ўқиб чиққанингизни тасдиқланг" qadamini talab qiladi. ERP bu tasdiqlarni qayd qilsinmi.
**Nega kerak:** Owner xodim har mavzuni o'qiganini bittalab tasdiqlashini xohlaydi — bu mas'uliyat izi.
**Variantlar:**
- A) Ha, har mavzu "o'qildi/tushundim" checkbox + sana + xodim imzosi (raqamli) — hujjatga aynan mos
- B) Faqat butun kurs oxirida bitta tasdiq — sodda
- C) Keyin — hozir kerak emas

### Q331. Nazorat varaqasidagi senariy-savollar (A/B/D) AI imtihon bo'lsinmi
**Nima:** Hujjatda amaliy senariy savollar bor (masalan "...қоғоз тури режага мос келмаётганини аниқладингиз. Нима қиласиз? A)... B)... D)..."). Bu ERP da AI imtihon savollari bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun to'g'ri-noto'g'ri qaror senariylarini yozib qo'ygan — AI shu bilan xodimni sinaydi.
**Variantlar:**
- A) Ha, senariy savollar = karta AI imtihoni (B/to'g'ri javob ball beradi) — vizyonga mos (karta o'z AI'si)
- B) Faqat statik test (avtomatik baholanmaydi) — qisman
- C) Keyin — hozir kerak emas

### Q332. Yo'riqnomani "ТАСДИҚЛАЙМАН директор Позилов А.А." imzosi — versiya nazorati
**Nima:** Har hujjat "ТАСДИҚЛАЙМАН EUROPRINT KOKAND директори Позилов А.А." bilan boshlanadi va sana qoldirilgan. ERP da yo'riqnoma versiyasi/tasdiqlash sanasini saqlasinmi.
**Nega kerak:** Yo'riqnoma rasmiy hujjat — kim, qachon tasdiqlaganini bilish kerak (audit, mehnat nizosi).
**Variantlar:**
- A) Ha, har karta yo'riqnomasi versiyalanadi: tasdiqlovchi + sana + "tanishdim" imzo (rasmiy hujjat oqimi)
- B) Faqat oxirgi versiya, tarix yo'q — sodda
- C) Keyin — hozir kerak emas

### Q333. "Малака талаблари" (2-3 yil tajriba, o'rta-maxsus) — kartaga talab maydonimi
**Nima:** Yo'riqnoma "...камида 2–3 йил ишлаб чиқариш... тажрибага эга бўлиши" kabi malaka talablarini sanaydi. ERP xodim-karta mosligini shu talabga qarab tekshirsinmi.
**Nega kerak:** Vizyon: kartaga xodim qidiriladi; AI moslikni malaka talabidan o'lchaydi.
**Variantlar:**
- A) Ha, har kartada malaka talablari (ta'lim, tajriba yili, ko'nikma) + AI nomzodni shu bo'yicha baholaydi
- B) Faqat lavozim e'loni uchun matn — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR recruitment, AI xodim-karta moslik bahosi

### Q334. "Лавозим воситалари" (A-System, hisobot shakllari, tex karta) kartaga biriktirilsinmi
**Nima:** Yo'riqnoma "Иш жойи ва лавозим воситалари" ni sanaydi: A-System, iш режалари, ҳисобот шакллари, tex karta. ERP har kartaga kerakli vositalarni bog'lasinmi.
**Nega kerak:** Vizyon "kerakli jihozlar/vositalar modeli hali YO'Q" deb belgilangan — bu hujjatda allaqachon ro'yxat bor.
**Variantlar:**
- A) Ha, har kartada "kerakli vositalar/dasturlar/hujjatlar" ro'yxati (hujjatga mos) + yetishmasa flag
- B) Faqat umumiy "jihozlar" matni — sodda
- C) Keyin — hozir kerak emas

### Q335. Excel "режа бажарилиш %" har bo'lim uchun (25-04.xlsx ustunlari) director da
**Nima:** `25-04.xlsx` da har operatsiya uchun "План выработ / Факт выработ / Остал" ustunlari bor. Director shu reja/fakt taqqoslashni jonli ko'rsinmi.
**Nega kerak:** Owner allaqachon reja/fakt/qoldiq jadvalini Excelда yuritgan — ERP shuni jonli qilishi kerak.
**Variantlar:**
- A) Ha, har operatsiya/bo'lim "Reja / Fakt / Qoldiq" director real-time (Excel ustunlariga mos)
- B) Faqat kunlik umumiy reja/fakt — qisman
- C) Keyin — hozir kerak emas

### Q336. "Зарур заказлар" (ustuvor buyurtmalar) navbati director da ko'rinsinmi
**Nima:** `25-04.xlsx` da "ЗАРУР ЗАКАЗЛАР" (ustuvor buyurtmalar) va "Очред / Очред2" (navbat) ustunlari bor. ERP ustuvor navbatni director ga ko'rsatsinmi.
**Nega kerak:** Owner qaysi buyurtma "zarur" ekanini qo'lda belgilagan — bu director'ning ustuvorlik qaroriga ta'sir qiladi.
**Variantlar:**
- A) Ha, buyurtmaga "zarur/ustuvor" flag + navbat tartibi director ko'radi va o'zgartira oladi (Excel mantig'iga mos)
- B) Navbat faqat avtomatik (sana bo'yicha), qo'lda ustuvorlik yo'q — qisman
- C) Keyin — hozir kerak emas

### Q337. "Брак сони" (brak miqdori) — director sifat-yo'qotish ko'rsatkichimi
**Nima:** `25-04.xlsx` har operatsiyada "Брак сони" ustuniga ega. Director brak (sifatsiz) miqdorini fabrika bo'ylab ko'rsinmi.
**Nega kerak:** Brak = bevosita pul yo'qotish; owner uni har operatsiyada qayd qilgan.
**Variantlar:**
- A) Ha, "Brak soni/%" director dashboardda (operatsiya/bo'lim/material bo'yicha) + trend (Excel ustuniga mos)
- B) Faqat QC modulida, director umumiy ko'radi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (sifat nazorati), Moliya (yo'qotish)

### Q338. "Длительность / Начат / Завершит" — operatsiya davomiyligi director da
**Nima:** `25-04.xlsx` "Длительность, Начат, Завершит, Бошлаш вакти, тугатиш вакти" ustunlari operatsiya vaqtini yozadi. ERP real vs reja davomiylikni director ga ko'rsatsinmi.
**Nega kerak:** Owner har operatsiya boshlanish/tugash vaqtini kuzatgan — vaqt og'ishi samaradorlik ko'rsatkichi.
**Variantlar:**
- A) Ha, "Rejalashtirilgan davomiylik vs Fakt davomiylik" director da (Excel ustunlariga mos) + og'ish %
- B) Faqat tugash sanasi (vaqt yo'q) — sodda
- C) Keyin — hozir kerak emas

### Q339. "Ден / Ноч" (kunduzgi/tungi smena) bo'yicha statistika ajratilsinmi
**Nima:** `25-04.xlsx` da "ден / ноч" (kunduz/tun) va "смена" ustunlari bor. Director smena bo'yicha samaradorlikni taqqoslasinmi.
**Nega kerak:** Owner 2 smenani ajratib yozgan — qaysi smena yaxshi ishlashi muhim qaror.
**Variantlar:**
- A) Ha, kunduzgi/tungi smena holati + reja% alohida director da (Excel ustuniga mos)
- B) Smena ajratilmaydi, kunlik umumiy — sodda
- C) Keyin — hozir kerak emas

### Q340. Ishchi normasi "%" (Iyun ishchilar.xlsx) — director mehnat-samaradorlik paneli
**Nima:** `Iyun ishchilar.xlsx` da "Норма, Оylik %, Ishlagan kuniga %, Jami kunlik %" har ishchi uchun hisoblangan. Director mehnat normasi bajarilishini ko'rsinmi.
**Nega kerak:** Owner har ishchining normaga nisbatan % ini Excelда yuritadi — bu ish haqi va samaradorlik asosi.
**Variantlar:**
- A) Ha, har ishchi "Norma %, Oylik %, Ishlagan kuniga %" director/HR da (Excel formulalariga mos)
- B) Faqat bo'lim o'rtacha % — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, ish haqi (razryad→talab→o'sish→oylik)

### Q341. Operatsiya turlari bo'yicha norma (avtokley, GTO, kley, oynakcha, rezka...) saqlansinmi
**Nima:** `Iyun ishchilar.xlsx` operatsiya turlarini sanaydi: avtokley, GTO, kley, oynakcha, paypoq, rezka, samokley, skleyka, tigel, yoni, laminatsiya, oddiy lak, vib.lak. Har tur uchun norma director da bo'lsinmi.
**Nega kerak:** Owner har operatsiya turi uchun alohida norma yuritadi — bu narx va samaradorlik asosi.
**Variantlar:**
- A) Ha, har operatsiya turi uchun norma + fakt + % director da (Excel ro'yxatiga aynan mos)
- B) Faqat umumiy ishlab chiqarish normasi — qisman
- C) Keyin — hozir kerak emas

### Q342. "Oddiy lak" va "Vib lak" alohida norma — director taqqoslasinmi
**Nima:** `Iyun ishchilar.xlsx` "Oddiy lak" va "Vib lak" ni alohida norma/% bilan yuritadi. Director bu ikki lakni ajratib ko'rsinmi.
**Nega kerak:** Owner ikki xil lak operatsiyasini ajratgan — har biri har xil hosildorlik beradi.
**Variantlar:**
- A) Ha, oddiy lak / vib lak alohida norma+% (Excel ustunlariga mos)
- B) Yagona "laklash" operatsiyasi — sodda
- C) Keyin — hozir kerak emas

### Q343. Bandlik.xlsx — operatsiyaga ketadigan minut/soat/kun (pragon) director da
**Nima:** `Bandlik.xlsx` har operatsiya uchun "Min, Buyurtma uchun ketadigan min, Ketadigan Soat, Ketadigan Kun, Умумий прагон, Бўлимлар прагони" hisoblaydi. Director bu yuklamani (loading) ko'rsinmi.
**Nega kerak:** Owner har bo'lim "pragon" (umumiy yuk) ni hisoblaydi — bu sig'im rejalashtirish (CRP) asosi.
**Variantlar:**
- A) Ha, "Bo'limlar yuklamasi (pragon) — min/soat/kun" director da (Excel formulasiga mos)
- B) Faqat umumiy fabrika yuklamasi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (CRP), MES sig'im

### Q344. "Buyurtma tayyorligi %" har buyurtma uchun director progress paneli
**Nima:** `Bandlik.xlsx` va `ketgan kun.xlsx` "Буюртма тайёрлиги %", "Бўлим сони", "Бўлимлар сони" bilan har buyurtmaning bajarilish darajasini ko'rsatadi. Director buyurtma-progress ko'rsinmi.
**Nega kerak:** Owner har buyurtma necha % tayyor va necha bo'limdan o'tganini kuzatadi.
**Variantlar:**
- A) Ha, har buyurtma "tayyorligi % + qaysi bo'limda" director da (Excel ustuniga mos)
- B) Faqat tugadi/tugamadi (foiz yo'q) — sodda
- C) Keyin — hozir kerak emas

### Q345. "Ishlab chiqarishga ketgan kun / qolgan kun" — buyurtma yetkazish trendmi
**Nima:** `ketgan kun.xlsx` "Ишлаб чиқаришга кетган вақт (кун)", "...қолган вақт (кун)", "Бошланган сана", "Тайёр бўлган сана" yuritadi. Director har buyurtma sikl-vaqtini ko'rsinmi.
**Nega kerak:** Owner buyurtma boshlanishidan tugashigacha necha kun ketganini hisoblaydi — yetkazish va'da nazorati.
**Variantlar:**
- A) Ha, buyurtma "sikl vaqti (kun) — reja vs fakt" director da + kechikkanlar (Excel ustuniga mos)
- B) Faqat tayyor bo'lgan sana — qisman
- C) Keyin — hozir kerak emas

### Q346. "Прокатка / приладка вақти (соат)" — sozlash vaqti yo'qotishi director da
**Nima:** `ketgan kun.xlsx` "Приладка учун кетган вақт (соат)" ustuniga ega. Director mashina sozlash (setup) vaqtini ko'rsinmi.
**Nega kerak:** Owner priladka (sozlash) vaqtini alohida hisoblaydi — bu yashirin yo'qotish va kichik buyurtma muammosi bilan bog'liq.
**Variantlar:**
- A) Ha, "Priladka/setup vaqti (soat)" director da operatsiya/buyurtma bo'yicha (Excel ustuniga mos)
- B) Davomiylik ichida yashirin qoladi — qisman
- C) Keyin — hozir kerak emas
  ↳ Agar A: kichik buyurtmalarda setup nisbati yuqori — director ularni alohida belgilasinmi?

### Q347. Kichik buyurtmalar tahlili (Kichik buyurtmalar.xlsx) — strategik foyda paneli
**Nima:** `Kichik buyurtmalar.xlsx` "Кичиклашган %, Фойда дона, Фойда кг, Размер эски/янги, Ишлаган кг" bilan kichraygan buyurtmalar foydasini tahlil qiladi. Director bu tahlilni ko'rsinmi.
**Nega kerak:** Owner (M.Nosirov tayyorlagan) kichik buyurtmalar zarar keltirayotganini hisoblagan — bu strategik narx qaror.
**Variantlar:**
- A) Ha, "Kichik buyurtmalar — kichiklashish %, dona/kg foyda" strategik panel director da (Excel hisobiga mos)
- B) Faqat umumiy buyurtma foydasi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (savdo narx), Moliya (foyda marjasi)

### Q348. "Razmer eski → yangi" optimizatsiyasi director tavsiyasiga aylansinmi
**Nima:** `Kichik buyurtmalar.xlsx` "Размер эски (42x58) → янги (40x58)" qog'oz formati optimizatsiyasini ko'rsatadi. AI/director bunday format-tejash imkonini avtomatik topsinmi.
**Nega kerak:** Owner qog'oz formatini kichraytirib kg-foydani oshirgan — AI shunday tavsiyalarni o'zi berishi mumkin.
**Variantlar:**
- A) Ha, AI strategik tahlilchi "format optimizatsiyasi" tavsiyasini avtomatik beradi (Excel mantig'iga mos)
- B) Faqat qo'lda tahlil — sodda
- C) Keyin — hozir kerak emas

### Q349. Buyurtma kodi formati (2024-0499, KT/PT/E + raqam) director qidiruvida
**Nima:** Excel buyurtmalar "2024-0499 ... /16370/KT4195/" kabi kodlanadi (papka raqami + KT/PT/E klishe kodi). ERP qidiruv shu real formatni qo'llab-quvvatlasinmi.
**Nega kerak:** Owner buyurtma/klishe kodlash tizimini yillar yuritgan — ERP shu kodlar bilan ishlashi shart.
**Variantlar:**
- A) Ha, buyurtma=`yil-raqam`, klishe=`KT/PT/E+raqam` rasmiy format + qidiruv (real kodlashga mos)
- B) Faqat ichki ID, eski kodlar alias — qisman
- C) Keyin — hozir kerak emas

### Q350. Director "departament bo'yicha" ham "operatsiya bo'yicha" ham ko'ra olsinmi (2 o'q)
**Nima:** Excel ma'lumotlari ham bo'lim/departament (vertikal), ham operatsiya turi (gorizontal) bo'yicha kesilgan. Director dashboard 2 o'qda filtrlanasinmi.
**Nega kerak:** Owner ham bo'limni, ham operatsiya turini alohida tahlil qiladi — ikki nuqtai-nazar kerak.
**Variantlar:**
- A) Ha, director 2 o'q: Departament (5/13/секция) ╳ Operatsiya turi — har ikkisi bo'yicha drill (real tahlilga mos)
- B) Faqat bo'lim bo'yicha — sodda
- C) Keyin — hozir kerak emas

### Q351. Statistik ko'rsatkich grafigi (Vysotskiy "статистика") — yuqoriga/pastga trend
**Nima:** Vizyon ShVB/Vysotskiy modeliga ko'ra har stat-ko'rsatkich vaqt grafigida (trend liniya) ko'rsatiladi. Director har ko'rsatkichni trend chiziq bilan ko'rsinmi.
**Nega kerak:** Vysotskiy statistikasida muhimi — son emas, balki yo'nalish (o'syaptimi/tushyaptimi).
**Variantlar:**
- A) Ha, har ko'rsatkich vaqt-trend grafigi (haftalik nuqta) + yo'nalish (o'sish/tushish) — Vysotskiy modeliga mos
- B) Faqat oxirgi qiymat (raqam) — sodda
- C) Keyin — hozir kerak emas

### Q352. Trend "yiqilish/o'sish holati" (condition) avtomatik aniqlansinmi
**Nima:** Vysotskiy modelida statistika trendiga qarab holat belgilanadi (Normal/Emergency/Danger/Power). Director har ko'rsatkich holatini avtomatik ko'rsinmi.
**Nega kerak:** Owner ShVB modeliga moyil — trenddan holat chiqarish boshqaruv tilining o'zagi.
**Variantlar:**
- A) Ha, trend qiyaligi → holat (masalan keskin tushish=Danger) avtomatik + chora-tadbir taklif
- B) Faqat trend ko'rsatiladi, holat qo'lda — qisman
- C) Keyin — hozir kerak emas

### Q353. Har ko'rsatkich uchun "mas'ul lavozim" (egasi) hujjatdan biriktirilsinmi
**Nima:** Yo'riqnoma har stat-ko'rsatkichni aniq lavozimga bog'laydi (masalan "режа бажарилиш %" → ички логистика бошлиғи). Director ko'rsatkich pasayganda mas'ulni ko'rsinmi.
**Nega kerak:** Owner har ko'rsatkichni egasiga bog'lagan — javobgarlik aniq bo'lishi kerak.
**Variantlar:**
- A) Ha, har ko'rsatkichda "mas'ul karta/lavozim" + pasayganda o'sha kartaga alert (hujjatga mos)
- B) Ko'rsatkich umumiy, mas'ul yo'q — sodda
- C) Keyin — hozir kerak emas

### Q354. "Ҳисоботларни ўз вақтида тайёрлаш" — hisobot-reglament director da kuzatilsinmi
**Nima:** Yo'riqnoma "Ҳисоботларни ўз вақтида тайёрлаш" ni muvaffaqiyatli harakat deb belgilaydi va "...белгиланган тартибда раҳбариятга тақдим этиш" majburiyatini qo'yadi. Director hisobot topshirildi/topshirilmadini kuzatsinmi.
**Nega kerak:** Owner har bo'lim director ga o'z vaqtida hisobot berishini talab qiladi — bu reglament.
**Variantlar:**
- A) Ha, har bo'lim "hisobot topshirildi/kechikdi" director da + eslatma (hujjatga mos)
- B) Hisobot qo'lda, kuzatuv yo'q — sodda
- C) Keyin — hozir kerak emas

### Q355. Director "real-time" yoki "kunlik kesim" ko'rsinmi
**Nima:** Excel ma'lumotlari kunlik/smenalik yuritiladi. Director dashboard real-time (jonli) bo'lsinmi yoki kunlik snapshot (соат N da muzlatilgan).
**Nega kerak:** Real-time ma'lumot to'liq bo'lmasligi mumkin (smena tugamagan); kunlik kesim aniqroq.
**Variantlar:**
- A) Real-time + kunlik snapshot ikkalasi (jonli kuzatuv + tugagan kun raqami) — to'liq
- B) Faqat kunlik snapshot (har kuni soat X da) — barqaror
- C) Keyin — hozir kerak emas

### Q356. Director og'ish yuz berganda "tomir-kesish" (root-cause) ko'rsinmi
**Nima:** Yo'riqnoma "...муаммоларни олдиндан аниқлаш ва бартараф этиш" ni talab qiladi. Director ko'rsatkich og'ganda sababga (logistika/material/operator) drill qila olsinmi.
**Nega kerak:** Owner sababni topishni qadrlaydi (verify-don't-trust, tomir-kesish madaniyati) — director shunga moslashishi kerak.
**Variantlar:**
- A) Ha, og'ishdan → sabab kategoriyasi → aniq buyurtma/operatsiya drill (root-cause zanjiri)
- B) Faqat og'ish ko'rsatiladi, sabab qo'lda topiladi — sodda
- C) Keyin — hozir kerak emas

### Q357. "Smena rejasi 2 xil buyurtma aralashib ketishi" — director konflikt alerti
**Nima:** Hujjat senariy beradi: "...икки хил буюртма... 5 қаватли гофра ва 3 қаватли гофра... қоғозларни аралаштириб юборилган". Director bunday material/buyurtma aralashish riskini ko'rsinmi.
**Nega kerak:** Owner bu xatoni real misol qilib yozgan — bu tipik va qimmat xato.
**Variantlar:**
- A) Ha, bir vaqtda o'xshash material talab qiladigan 2 buyurtma → "aralashish riski" alert (senariyga mos)
- B) Faqat tex-karta ko'rsatadi, alert yo'q — qisman
- C) Keyin — hozir kerak emas

### Q358. Director "Лавозим мақсади tushunilmadi" holatini ko'rsinmi (xato-tasnif)
**Nima:** Eng ko'p xato "Ишлаб чиқариш режасини ...тўлиқ тушунмаслик". Director qaror sifatini (lavozim maqsadiga mos/zid) tasniflasinmi.
**Nega kerak:** Owner xatolarning ko'pi "tushunmaslik"dan kelib chiqishini belgilagan — bu o'quv/AI sohasi.
**Variantlar:**
- A) Ha, AI xato sodir bo'lganda uni "tushunmaslik/e'tiborsizlik/qoidabuzarlik" deb tasniflaydi + o'quv tavsiya (hujjatga mos)
- B) Faqat xato qayd qilinadi, tasnif yo'q — sodda
- C) Keyin — hozir kerak emas

### Q359. "Чиқиндилар ва қолдиқлар" (chiqindi) chiqarilishi director ekologik ko'rsatkichmi
**Nima:** Yo'riqnoma "Ишлаб чиқаришдан чиққан чиқиндилар ва қолдиқларни ...ўз вақтида чиқарилишини ташкил этиш" ni talab qiladi. Director chiqindi/qoldiq miqdorini kuzatsinmi.
**Nega kerak:** Owner chiqindi boshqaruvini rasmiy vazifa qilgan; qoldiq (qog'oz) — qayta ishlash va xarajat manbai.
**Variantlar:**
- A) Ha, "Chiqindi/qoldiq miqdori (kg)" director da + qayta ishlash% (hujjatga mos)
- B) Faqat ombor qoldig'ida ko'rinadi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (qoldiq karton rulon), Moliya (qayta sotish)

### Q360. Director "huquqlari" — ma'lumot so'rash huquqi ERP da aks etsinmi
**Nima:** Yo'riqnoma bo'lim boshlig'iga "...режалаштириш ва ишлаб чиқариш бўлимларидан иш режалари... талаб қилиш" huquqini beradi. ERP bo'limlararo ma'lumot so'rash oqimini qo'llab-quvvatlasinmi.
**Nega kerak:** Owner bo'limlararo ma'lumot talabini rasmiy huquq qilgan — bu gorizontal workflow.
**Variantlar:**
- A) Ha, "ma'lumot/reja so'rovi" bo'limlararo workflow (so'rov→javob izi) — huquqqa mos
- B) Faqat ko'rish ruxsati (so'rov oqimi yo'q) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (gorizontal workflow_rules)

### Q361. Strategik tahlilchi AI "Лавозим мақсади amalga oshyaptimi" deb baholasinmi
**Nima:** Vizyon: har karta o'z AI'siga ega, xodim↔karta mosligini baholaydi va hisobot yozadi. Director uchun bu AI hisobotlari agregatlanadimi.
**Nega kerak:** Owner karta-AI larining o'zaro ishlashini xohlaydi — director eng yuqori agregat.
**Variantlar:**
- A) Ha, har karta-AI hisoboti → director uchun "qaysi lavozimlar maqsadga erishmayapti" agregat (vizyonga to'liq mos)
- B) Faqat alohida karta-AI hisobotlari, agregat yo'q — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI integratsiya, HR karta-model

### Q362. Director ko'rsatkichlarning "ideal qiymati" hujjatdan olinsinmi yoki o'rnatilsinmi
**Nima:** Yo'riqnoma stat-ko'rsatkichni beradi (masalan "режа бажарилиш %") lekin ideal qiymatni (100%? 95%?) belgilamaydi. Bu ostona qiymatlarni kim o'rnatadi.
**Nega kerak:** Holat formulasi ostona qiymatga muhtoj; owner har ko'rsatkich uchun "ideal"ni belgilashi kerak.
**Variantlar:**
- A) Owner har ko'rsatkichga ideal/ostona belgilaydi (masalan reja% > 95 = yashil) — sozlanadigan master-data
- B) Avtomatik tarixiy o'rtachadan ostona — sodda, lekin "ideal" emas
- C) Keyin — hozir kerak emas
  ↳ Agar A: ostona lavozimga qarab har xilmi yoki bitta umumiy standartmi? — A) har karta o'z ostonasi B) umumiy

### Q363. "Поддон" (paddon) — qayta ishlatiladigan resurs sifatida hisoblansinmi
**Nima:** Yo'riqnoma "поддонлар... ўз вақтида етказиб берилишини ташкил қилиш" deydi. Paddon — har joyda ishlatiladigan ichki resurs; director uning aylanishini ko'rsinmi.
**Nega kerak:** Owner paddon yetkazishni vazifa qilgan; paddon yetishmasligi bekor turishga olib keladi.
**Variantlar:**
- A) Ha, paddon zaxirasi/aylanishi director da (yetishmovchilik bekor turish bilan bog'lanadi)
- B) Paddon kuzatilmaydi — sodda
- C) Keyin — hozir kerak emas

### Q364. Director "haftalik ishlab chiqargan vs qolgan" (ketgan kun.xlsx) ko'rsinmi
**Nima:** `ketgan kun.xlsx` "Ҳафта қолган / Ҳафта ишлаб чиқарган" ustunlariga ega. Director haftalik bajarilish/qoldiqni ko'rsinmi.
**Nega kerak:** Owner haftalik kesimni alohida yuritadi — bu taktik (oylik→haftalik) darajaga mos.
**Variantlar:**
- A) Ha, "Hafta ishlab chiqarildi vs qoldi" director da + haftalik trend (Excel ustuniga mos)
- B) Faqat oylik/kunlik — qisman
- C) Keyin — hozir kerak emas

### Q365. Yo'nalish (ofs kar / ofs gof / flx gof) bo'yicha statistika ajratilsinmi
**Nima:** `ketgan kun.xlsx` "Йўналишлар: ofs кар, ofs гоф, flx гоф" (ofset-karton, ofset-gofra, flekso-gofra) bo'yicha ajratadi. Director ishlab chiqarish yo'nalishi bo'yicha taqqoslasinmi.
**Nega kerak:** Owner mahsulot yo'nalishini (texnologiya turi) ajratadi — har yo'nalish har xil samaradorlik.
**Variantlar:**
- A) Ha, "Ofset-karton / Ofset-gofra / Flekso-gofra" yo'nalishlari bo'yicha holat+hajm director da (Excel ro'yxatiga mos)
- B) Yagona ishlab chiqarish raqami — sodda
- C) Keyin — hozir kerak emas

### Q366. "Algoritm turi" (2-8 ta bo'lim oqimi) — buyurtma murakkabligi ko'rsatkichimi
**Nima:** `ketgan kun.xlsx` "Алгоритм тури: 2 та бўлим, 3 та бўлим ... 8 та бўлим" bilan buyurtma necha bo'limdan o'tishini belgilaydi. Director buyurtma murakkabligini ko'rsinmi.
**Nega kerak:** Owner buyurtmani o'tadigan bo'limlar soni bilan tasniflaydi — bu murakkablik va vaqt prognozi.
**Variantlar:**
- A) Ha, buyurtmaga "algoritm turi (2-8 bo'lim)" + murakkablikka qarab vaqt prognozi (Excel mantig'iga mos)
- B) Murakkablik kuzatilmaydi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (yo'nalish/routing), buyurtma vaqt prognozi

### Q367. Director paneliga "tozalik/intizom" (5S) ko'rsatkichi qo'shilsinmi
**Nima:** Yo'riqnoma "Тозаликка эътибор бермаслик" ni ko'p uchraydigan xato, "иш жойини рухсатсиз ташлаб кетиш" ni esa qoidabuzarlik deb belgilaydi. Director intizom/tozalik holatini ko'rsinmi.
**Nega kerak:** Owner tozalik va ish-joy intizomini har lavozim hujjatiga qo'shgan — bu madaniyat ko'rsatkichi.
**Variantlar:**
- A) Ha, "Tozalik/intizom" holati director da (tekshiruv/voqea asosida) — hujjat qoidalariga mos
- B) Faqat HR intizom voqealari, alohida panel yo'q — qisman
- C) Keyin — hozir kerak emas

DONE: Director / Strategiya — 55.

## 6. SD / Sotuv

### Q368. Buyurtma kartasidagi asosiy maydonlar
**Nima:** Yangi sotuv buyurtmasini ochganda qanday maydonlar majburiy bo'lishi kerak (mahsulot turi, o'lcham, tiraj, muddat, narx).
**Nega kerak:** Yarim to'ldirilgan buyurtma ishlab chiqarishga noto'g'ri ketadi, brak va nizo chiqadi.
**Variantlar:**
- A) Majburiy: mahsulot turi + o'lcham + tiraj + muddat + mijoz + narx — to'liq, lekin operator sekinroq kiritadi
- B) Faqat mahsulot + tiraj + mijoz majburiy, qolgani keyin — tez, lekin yarim ma'lumotli buyurtma o'tib ketadi
- C) Keyin — hozir kerak emas

### Q369. Mahsulot turlari ro'yxati (qog'oz quti zavodi)
**Nima:** Sotuvda tanlanadigan mahsulot turlari aniq ro'yxati: yelimlangan quti, mikrogofra, gofroyashik, lototok, plastika, etiketka, va h.k.
**Nega kerak:** Har bir tur boshqacha narxlanadi va boshqa stanokda ishlanadi; aralash bo'lsa kalkulyatsiya xato chiqadi.
**Variantlar:**
- A) Qattiq ro'yxat (10-15 tur) — tartibli, hisobot toza, lekin yangi tur qo'shish admin orqali
- B) Operator erkin matn yozadi — moslashuvchan, lekin hisobot va narxlash buziladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (PP marshrut), Narxlash, Ombor (xomashyo turi)

### Q370. O'lcham (gabarit) kiritish formati
**Nima:** Quti o'lchami qanday kiritiladi: uzunlik × kenglik × balandlik (mm), yoki tayyor lekalo kodi.
**Nega kerak:** Quti yuzasi (kvadrat metr) shu o'lchamdan hisoblanadi — narxning asosi.
**Variantlar:**
- A) U×K×B (mm) + tizim avtomatik yuzani (m²) va zagotovka o'lchamini hisoblaydi — aniq, qayta ishlatiladi
- B) Faqat tayyor lekalo/shtamp kodi tanlanadi — tez, lekin yangi o'lcham har safar yangi shtamp talab qiladi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: zagotovka hisobida qirqim qoldig'i (priklad) foizini qancha qo'shamiz — 3% / 5% / mahsulot turiga qarab?

### Q371. Tiraj (miqdor) o'lchov birligi
**Nima:** Buyurtma miqdori nimada o'lchanadi: dona, ming dona, m², tonna, yoki list.
**Nega kerak:** Narx va ombor qoldig'i bir xil birlikda bo'lmasa, hisob chalkashadi.
**Variantlar:**
- A) Asosiy birlik = dona, lekin tizim m² va listga avtomatik aylantiradi — universal
- B) Mahsulot turiga qarab birlik (quti=dona, qog'oz=tonna) — to'g'ri, lekin murakkabroq
- C) Keyin — hozir kerak emas

### Q372. Muddat (tayyorlik sanasi) maydoni
**Nima:** Buyurtma muddati qanday belgilanadi: mijoz so'ragan sana, zavod va'da qilgan sana, yoki ikkalasi alohida.
**Nega kerak:** Mijoz so'ragan sana bilan real imkoniyat ko'p farq qiladi; ikkalasini saqlamasa, kechikish kimning aybi noma'lum.
**Variantlar:**
- A) Ikki sana alohida: "mijoz so'ragan" + "zavod va'dasi" (PP yuklamasidan hisoblanadi) — adolatli, kechikish tahlili aniq
- B) Bitta "kelishilgan muddat" maydoni — sodda, lekin mas'uliyat noaniq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish reja (CRP yuklama), KPI (muddatda bajarish foizi)

### Q373. Minimal partiya (MOQ) qoidasi
**Nima:** Har bir mahsulot turi uchun eng kichik buyurtma miqdori (masalan, 1000 donadan kam quti qabul qilinmaydi yoki qimmat narxda).
**Nega kerak:** Kichik tiraj sozlash (prikladka) xarajatini qoplamaydi — zavod zarar ko'radi.
**Variantlar:**
- A) Har tur uchun MOQ belgilanadi; undan kam bo'lsa "kichik partiya ustamasi" avtomatik qo'shiladi — zarar yo'q
- B) MOQ faqat ogohlantirish, narx o'zgarmaydi — sotuvchi qaror qiladi
- C) Keyin — hozir kerak emas

### Q374. Narx formulasi tarkibi
**Nima:** Bitta mahsulot narxi qaysi qismlardan yig'iladi: qog'oz (xomashyo) + bo'yoq/kraska + ish (operatsiyalar) + qo'shimcha (shtamp, yelim, laminatsiya) + ustama foyda.
**Nega kerak:** Formula ochiq bo'lsa, narx adolatli va tushuntirib beriladigan bo'ladi; "ko'zdan" narxlash xato va zararli.
**Variantlar:**
- A) To'liq kalkulyatsiya: xomashyo + bo'yoq + ish + qo'shimcha + foyda% — har bir qatori ko'rinadi
- B) Faqat "1 m² narxi × yuza" oddiy formula — tez, lekin bo'yoq/ish farqini yutib yuboradi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (tannarx, marja), Ishlab chiqarish (operatsiya tariflari), Ombor (xomashyo narxi)

### Q375. Qog'oz/karton narxi qaerdan olinadi
**Nima:** Kalkulyatsiyadagi xomashyo narxi — ombordagi oxirgi kirim narximi, o'rtacha narxmi, yoki qo'lda kiritilgan kunlik narx.
**Nega kerak:** Karton narxi tez o'zgaradi; eski narx bilan hisoblasa, zarar ko'rinmay qoladi.
**Variantlar:**
- A) Ombor o'rtacha tannarxi (avtomatik) — real, qo'l aralashuvisiz
- B) Kunlik "narxlash narxi" (sotuv bo'limi qo'lda yangilaydi) — moslashuvchan, lekin esdan chiqadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (tannarx metodi), Moliya

### Q376. Bo'yoq (kraska) xarajatini hisoblash
**Nima:** Bosma narxi qanday hisoblanadi: rang soni (1/2/4/6 rang) × yuza, yoki qoplama foizi (zalivka %), yoki tayyor "klik" tarif.
**Nega kerak:** To'liq bo'yalgan quti bilan yengil chizgili quti narxi keskin farq qiladi.
**Variantlar:**
- A) Rang soni + qoplama% + yuza formulasi — aniq, lekin operator qoplamani baholashi kerak
- B) Faqat rang soniga qarab sobit tarif — sodda, lekin zalivkali ish zarar keltiradi
- C) Keyin — hozir kerak emas

### Q377. Ish haqi (operatsiya) xarajatini hisoblash
**Nima:** Ishlab chiqarish ishi narxi: stanok soati × tarif, yoki dona × operatsiya tarifi, yoki normativ vaqt asosida.
**Nega kerak:** Mehnat ulushi narxning katta qismi; noto'g'ri bo'lsa, mehnatli buyurtma yutqaziladi.
**Variantlar:**
- A) Operatsiya marshruti bo'yicha (har bosqich tarifi yig'iladi) — eng aniq, PP bilan ulanadi
- B) Mahsulot turiga sobit "ish ulushi %" — tez, lekin qo'pol
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (marshrut/normalar), HR/Payroll (sdelka)

### Q378. Qo'shimcha operatsiyalar ro'yxati va narxi
**Nima:** Laminatsiya, UF-lak, tabaqalash (tisnenie), yelimlash, big/bigovka, vyrubka, kashirovka kabi qo'shimchalarning alohida narx qatorlari.
**Nega kerak:** Mijoz "yana laminatsiya qo'shing" desa, narx avtomatik o'zgarishi kerak; qo'lda unutilsa zarar.
**Variantlar:**
- A) Har qo'shimcha alohida qator + o'z tarifi, buyurtmaga belgilanadi — shaffof, hisobot aniq
- B) "Qo'shimcha ishlar" bitta umumiy qator (qo'lda summa) — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q379. Klishe/shtamp (matritsa) xarajati — kim to'laydi
**Nima:** Yangi dizayn uchun klishe (bosma plastinasi) yoki vyrubka shtampi narxi mijozga alohida hisoblanadimi yoki narxga yashiriladimi.
**Nega kerak:** Shtamp bir martalik katta xarajat; takroriy buyurtmada qayta olinmasligi kerak.
**Variantlar:**
- A) Alohida bir martalik qator "shtamp/klishe", mijoz to'laydi; takrorda olinmaydi — adolatli
- B) Narxga yoyib yuboriladi (donaga qo'shiladi) — mijozga sodda, lekin kichik tirajda qimmat
- C) Keyin — hozir kerak emas
  - ↳ Agar A: shtamp zavod arxivida saqlanadimi, mijozga tegishlimi (egalik) va saqlash muddati?

### Q380. Narx pog'onasi (tiraj oshgani sayin arzonlashuvi)
**Nima:** Bitta mahsulot uchun tiraj oshganda dona narxi pasayishi (masalan 1000=X, 5000=0.9X, 10000=0.8X) jadvali.
**Nega kerak:** Katta buyurtma arzonroq bo'lishi tabiiy; jadval bo'lmasa har safar qo'lda hisoblanadi va xato chiqadi.
**Variantlar:**
- A) Tiraj-narx pog'onasi jadvali har mahsulotga (tizim avtomatik tanlaydi) — tezkor, izchil
- B) Sotuvchi qo'lda chegirma beradi — moslashuvchan, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q381. Chegirma turlari ro'yxati
**Nima:** Qaysi chegirma turlari bo'ladi: tiraj chegirmasi, doimiy mijoz chegirmasi, oldindan to'lov chegirmasi, mavsumiy aksiya, naqd to'lov chegirmasi.
**Nega kerak:** Har xil chegirmalar bir-biriga qo'shilib ketsa, narx zararga tushadi; tartib kerak.
**Variantlar:**
- A) Sanab o'tilgan turlar alohida, har biri foiz limiti bilan — shaffof, ustma-ust nazorat ostida
- B) Bitta "umumiy chegirma %" maydoni — sodda, lekin sababi noma'lum
- C) Keyin — hozir kerak emas

### Q382. Chegirmalar jamlanishi (ustma-ust) qoidasi
**Nima:** Bir nechta chegirma birga qo'llanishi mumkinmi (tiraj + doimiy mijoz + oldindan to'lov) yoki faqat eng kattasi olinadimi.
**Nega kerak:** Jamlansa umumiy chegirma 30-40% ga chiqib, foyda yo'qoladi.
**Variantlar:**
- A) Maksimal umumiy chegirma "shifti" belgilanadi (masalan 15%), undan oshmaydi — xavfsiz
- B) Hamma chegirma jamlanadi, cheklov yo'q — mijozga yoqadi, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (marja nazorati)

### Q383. Chegirmaga ruxsat darajalari (limit)
**Nima:** Sotuvchi o'zi qancha chegirma bera oladi, qaysi foizdan oshsa boshliq/direktor tasdig'i kerak.
**Nega kerak:** Cheklovsiz sotuvchi marjani yeb yuboradi; tasdiq zanjiri kerak.
**Variantlar:**
- A) Pog'onali: sotuvchi 0-5%, boshliq 5-10%, direktor 10%+ — nazorat va tezlik muvozanati
- B) Hamma chegirma direktor tasdig'i — qattiq nazorat, lekin sekin
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (org-struktura tasdiq zanjiri), Coordination (tasdiq oqimi)

### Q384. Eng past narx (pol/floor) himoyasi
**Nima:** Tannarxdan past yoki belgilangan minimal marjadan past narxda sotishni tizim bloklaydimi.
**Nega kerak:** Chegirma berib, sotuvchi bilmasdan zararga sotib qo'yishi mumkin.
**Variantlar:**
- A) Tizim tannarx+minimal marjadan past narxni bloklaydi (faqat direktor ochadi) — zarardan himoya
- B) Faqat qizil rangda ogohlantiradi, bloklamaydi — moslashuvchan
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (marja siyosati)

### Q385. Mijoz toifasi A/B/C tasnifi
**Nima:** Mijozlarni A/B/C (yoki VIP/oddiy/yangi) toifaga ajratish — qaysi mezon bo'yicha (yillik aylanma, to'lov intizomi, daromad ulushi).
**Nega kerak:** Toifa chegirma, kredit limiti va xizmat ustuvorligini belgilaydi.
**Variantlar:**
- A) ABC = yillik xarid hajmi bo'yicha avtomatik (80/15/5 qoidasi), to'lov intizomi tuzatma kiritadi — ob'ektiv
- B) Toifa qo'lda belgilanadi (sotuvchi fikri) — moslashuvchan, lekin sub'ektiv
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM, Moliya (kredit limiti), Hisobotlar (ABC tahlil)

### Q386. Toifaga bog'liq imtiyozlar jadvali
**Nima:** Har toifa (A/B/C) uchun standart chegirma %, kredit limiti va to'lov muddati avtomatik qo'llanadimi.
**Nega kerak:** Har mijozga qo'lda sozlash o'rniga toifa qoidasi izchillikni ta'minlaydi.
**Variantlar:**
- A) Toifa = standart paket (chegirma + limit + kun), buyurtmaga avtomatik tushadi — izchil
- B) Toifa faqat ko'rsatma, qiymatlar qo'lda kiritiladi — erkin, lekin chalkash
- C) Keyin — hozir kerak emas

### Q387. Kotirovka (taklif/KP) hujjati
**Nima:** Buyurtmadan oldin rasmiy narx taklifi (kommercheskiy predlojeniye) tizimda yaratiladimi va saqlanadimi.
**Nega kerak:** Mijoz taklif so'raydi; uni hujjat sifatida saqlamasa, keyin "siz bunday demaganmisiz" nizosi chiqadi.
**Variantlar:**
- A) KP alohida hujjat sifatida yaratiladi, raqamlanadi, PDF chiqadi, keyin buyurtmaga aylantiriladi — tartibli
- B) KP yo'q, to'g'ridan-to'g'ri buyurtma — tez, lekin tarix yo'q
- C) Keyin — hozir kerak emas

### Q388. Kotirovka amal qilish muddati
**Nima:** Berilgan narx taklifi necha kun amal qiladi (masalan 7/14/30 kun), so'ng narx qayta ko'rib chiqiladi.
**Nega kerak:** Karton narxi o'zgaradi; eski taklif bo'yicha sotsa, zarar bo'ladi.
**Variantlar:**
- A) Har KP da "amal muddati" sanasi bor (standart 14 kun), o'tsa "muddati o'tgan" statusi — himoya
- B) Muddat yo'q, taklif doim amal qiladi — mijozga qulay, lekin xavfli
- C) Keyin — hozir kerak emas
  - ↳ Agar A: muddati o'tgan KP ni qayta tiklashda narx avtomatik yangilanadimi (joriy xomashyo narxiga)?

### Q389. Kotirovka statuslari
**Nima:** KP qanday holatlardan o'tadi: qoralama → yuborilgan → ko'rilmoqda → qabul → rad → muddati o'tgan.
**Nega kerak:** Sotuvchi qaysi taklif qaysi bosqichda ekanini ko'rmasa, yo'qotadi.
**Variantlar:**
- A) Aniq status zanjiri (yuqoridagi) + har o'tishda sana — kuzatuv va konversiya tahlili
- B) Faqat ochiq/yopiq — sodda, lekin tahlil yo'q
- C) Keyin — hozir kerak emas

### Q390. Kotirovka → Buyurtma aylantirish
**Nima:** Mijoz rozi bo'lganda KP bir tugma bilan buyurtmaga aylanadimi (ma'lumotlar ko'chiriladi) yoki qaytadan kiritiladimi.
**Nega kerak:** Qayta kiritish vaqt va xato; ko'chirsa, taklifdagi narx kafolatlanadi.
**Variantlar:**
- A) "Buyurtmaga aylantirish" tugmasi — barcha qator/narx/chegirma ko'chadi — tez, xatosiz
- B) Qo'lda yangi buyurtma ochiladi — erkin, lekin mehnatli
- C) Keyin — hozir kerak emas

### Q391. Buyurtma statuslari (sotuv tomoni)
**Nima:** Sotuv buyurtmasi holatlari: yangi → tasdiqlangan → ishlab chiqarishda → tayyor → yetkazilgan → yopilgan (+ bekor qilingan).
**Nega kerak:** Mijozga "qachon tayyor" deyish va ichki nazorat uchun status kerak.
**Variantlar:**
- A) To'liq zanjir, ishlab chiqarish statusi avtomatik ko'chadi (PP bilan ulangan) — real holat
- B) Statusni sotuvchi qo'lda o'zgartiradi — sodda, lekin haqiqatdan uzilib qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (PP holati), CRM (mijozga xabar)

### Q392. Buyurtmani tasdiqlash (ishlab chiqarishga o'tkazish) sharti
**Nima:** Buyurtma ishlab chiqarishga tushishidan oldin nima bo'lishi shart: oldindan to'lov, shartnoma, maket tasdig'i, kredit limit tekshiruvi.
**Nega kerak:** To'lovsiz/maketsiz ishga tushsa, brak yoki to'lanmagan tovar qoladi.
**Variantlar:**
- A) Shart-ro'yxat (to'lov% + maket tasdiq + limit OK) hammasi yashil bo'lsa o'tadi — xavfsiz
- B) Faqat sotuvchi "ishga ber" bossa o'tadi — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (to'lov), Ishlab chiqarish (ishga ruxsat), Dizayn (maket)

### Q393. Maket/dizayn tasdig'i bosqichi
**Nima:** Bosmadan oldin mijoz maketni (dizayn namunasini) imzolab/tasdiqlab beradimi, bu tizimda qayd etiladimi.
**Nega kerak:** Mijoz tasdiqlamagan maket bo'yicha bosib brak chiqsa, javobgar noma'lum.
**Variantlar:**
- A) "Maket tasdig'i" majburiy bosqich, mijoz tasdig'i (imzo/elektron) saqlanadi — javobgarlik aniq
- B) Tasdiq og'zaki, tizimda yo'q — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Dizayn moduli, Sifat (brak javobgarligi)

### Q394. Shartnoma turlari
**Nima:** Qanday shartnoma turlari bo'ladi: bir martalik (razovaya), doimiy (ramochnyy/yillik), spetsifikatsiya bo'yicha.
**Nega kerak:** Doimiy mijoz har buyurtmaga shartnoma tuzmasligi, faqat spetsifikatsiya ilova qilishi kerak.
**Variantlar:**
- A) Ikki daraja: bosh shartnoma (yillik) + har buyurtmaga spetsifikatsiya/ilova — tartibli, kam qog'oz
- B) Har buyurtmaga alohida shartnoma — to'liq, lekin og'ir
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya, Yuridik/Hujjat aylanmasi

### Q395. Shartnomadagi asosiy shartlar maydonlari
**Nima:** Shartnomada qayd etiladigan shartlar: to'lov shakli (oldindan/keyin/bo'lib), to'lov muddati (kun), valyuta, yetkazib berish sharti, jarima/penya, sifat e'tirozi muddati.
**Nega kerak:** Bu shartlar buyurtma va to'lovga avtomatik ta'sir qiladi; qo'lda saqlasa unutiladi.
**Variantlar:**
- A) Strukturalangan maydonlar (har shart alohida), buyurtmaga avtomatik tushadi — bog'langan, nazoratli
- B) Shartnoma faqat PDF fayl, maydonlar yo'q — sodda, lekin tizim foydalanolmaydi
- C) Keyin — hozir kerak emas

### Q396. To'lov sharti turlari
**Nima:** To'lov varianti ro'yxati: 100% oldindan, 50/50, yetkazgandan keyin N kun (otsrochka), konsignatsiya.
**Nega kerak:** Har variant kredit riski va pul oqimiga turlicha ta'sir qiladi.
**Variantlar:**
- A) Qattiq ro'yxat, har biriga standart "otsrochka kun" — izchil, moliya rejalashtiradi
- B) Erkin matn ("kelishilganidek") — moslashuvchan, lekin hisob chalkash
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (pul oqimi rejasi, debitorlik)

### Q397. Debitor (qarz) limiti — mijozga
**Nima:** Har mijozga to'lanmagan qarzning yuqori chegarasi (kredit limit) belgilanadimi.
**Nega kerak:** Limitsiz mijoz katta qarzga botib, to'lamay qolishi mumkin.
**Variantlar:**
- A) Har mijozga summa limiti (toifaga bog'liq), oshsa yangi buyurtma bloklanadi — risk nazorati
- B) Limit faqat ogohlantirish, bloklamaydi — moslashuvchan, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (debitorlik), CRM (mijoz holati)

### Q398. Debitor limiti oshganda harakat
**Nima:** Mijoz limitdan oshganda yangi buyurtma nima bo'ladi: bloklanadi, tasdiqqa boradi, yoki faqat oldindan to'lovga ruxsat beriladi.
**Nega kerak:** Oddiy blok mijozni yo'qotishi mumkin; muqobil yo'l kerak.
**Variantlar:**
- A) Bloklanadi, lekin direktor/moliya tasdig'i bilan ochiladi (sabab yoziladi) — nazorat + moslashuv
- B) To'liq blok, istisno yo'q — qattiq, lekin mijoz ketadi
- C) Keyin — hozir kerak emas

### Q399. Muddati o'tgan qarz (prosrochka) bo'yicha avtomatik to'siq
**Nima:** Mijozda muddati o'tgan to'lov bo'lsa, yangi buyurtma avtomatik to'xtatiladimi.
**Nega kerak:** Bir tomondan tovar berib, ikkinchidan eski qarz to'lanmasa, zarar oshadi.
**Variantlar:**
- A) Muddati o'tgan qarz bo'lsa yangi buyurtma tasdiqqa boradi (avtomatik bayroq) — himoya
- B) Hech narsa o'zgarmaydi, sotuvchi o'zi qaror qiladi — erkin, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (yoshlanish/aging hisoboti)

### Q400. Takroriy buyurtma (qayta buyurtma) tezkor usuli
**Nima:** Mijoz avval buyurtma qilgan mahsulotni qayta so'raganda, eski buyurtmadan "nusxa olish" tugmasi bo'ladimi.
**Nega kerak:** Doimiy mijoz har oy bir xil quti oladi; qaytadan kiritish vaqt va xato.
**Variantlar:**
- A) "Qayta buyurtma" tugmasi: eski o'lcham/dizayn/shtamp ko'chadi, faqat tiraj/narx yangilanadi — tez, xatosiz
- B) Har safar qo'lda yangi — sodda, lekin sekin
- C) Keyin — hozir kerak emas

### Q401. Takroriy buyurtmada narx yangilanishi
**Nima:** Qayta buyurtmada eski narx saqlanadimi yoki joriy xomashyo narxiga qayta hisoblanadimi.
**Nega kerak:** Karton qimmatlashgan bo'lsa, eski narx zarar; lekin mijoz "avvalgi narx" deb kutadi.
**Variantlar:**
- A) Avtomatik qayta hisoblanadi, lekin eski narx yonida ko'rsatiladi (farqni ko'rish uchun) — shaffof
- B) Eski narx saqlanadi — mijozga yoqadi, lekin zarar xavfi
- C) Keyin — hozir kerak emas

### Q402. Mahsulot/dizayn arxivi (mijoz kartasida tarix)
**Nima:** Har mijozning ilgari ishlangan mahsulotlari (o'lcham, dizayn fayli, shtamp kodi, oxirgi narx) kartada saqlanadimi.
**Nega kerak:** Qayta buyurtma va takliflar uchun tayyor tarix kerak; har safar so'rab o'tirmaslik uchun.
**Variantlar:**
- A) Mijoz kartasida "mahsulotlar arxivi" jadvali (sana/tiraj/narx/dizayn link) — qulay, tahlilli
- B) Arxiv yo'q, har safar yangidan — sodda, lekin xotira yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM, Dizayn (fayl arxivi)

### Q403. Bir buyurtmada bir necha mahsulot (qatorlar)
**Nima:** Bitta buyurtmada bir nechta har xil mahsulot (pozitsiya) bo'la oladimi yoki har mahsulot alohida buyurtmami.
**Nega kerak:** Mijoz bitta zayavkada 3 xil quti so'raydi; alohida ochish mehnatli.
**Variantlar:**
- A) Ko'p qatorli buyurtma (har qator o'z narxi/muddati), umumiy hujjat — qulay, yaxlit hisob
- B) Bir buyurtma = bir mahsulot — sodda, lekin ko'p hujjat
- C) Keyin — hozir kerak emas

### Q404. Qisman yetkazib berish va qisman to'lov
**Nima:** Buyurtma bir necha partiyada yetkazilishi va qisman to'lanishi tizimda qo'llab-quvvatlanadimi.
**Nega kerak:** 50000 quti bir vagonga sig'maydi; bo'lib jo'natiladi, har partiya alohida hisob.
**Variantlar:**
- A) Buyurtma → bir necha yetkazma + har biriga hisob-faktura/qabul — real, aniq qoldiq
- B) Faqat to'liq yetkazma — sodda, lekin amalda ishlamaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (chiqim partiyalari), Moliya (qisman to'lov)

### Q405. Ortiqcha/kam ishlab chiqarish (tirajdan og'ish) qoidasi
**Nima:** Bosmada +/- 5-10% farq normal (texnologik). Hisob-faktura buyurtma tirajidan emas, real ishlab chiqarilgan miqdordan chiqadimi.
**Nega kerak:** 10000 buyurtmada 9600 yoki 10400 chiqishi mumkin; qaysi raqamdan to'lov olinishi shartnomada aniq bo'lishi kerak.
**Variantlar:**
- A) Shartnomada "+/- N% og'ish" qoidasi, hisob real chiqqan miqdordan — sanoat standarti
- B) Doim buyurtma tirajidan — sodda, lekin nizo chiqadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (faktura miqdori), Sifat/Ishlab chiqarish (real chiqim)

### Q406. Buyurtmani bekor qilish / o'zgartirish qoidasi
**Nima:** Mijoz ishlab chiqarish boshlangach bekor qilsa yoki o'zgartirsa, qancha to'laydi (sarflangan xomashyo + ish).
**Nega kerak:** Yarim ishlangan buyurtma bekor bo'lsa, zavod xarajatni qoplashi kerak.
**Variantlar:**
- A) Bosqichga qarab bekor jarimasi (maket o'tdi=X%, bosildi=Y%, tayyor=100%) — adolatli
- B) Bekor bepul — mijozga yoqadi, lekin zarar
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarflangan resurs), Moliya

### Q407. Yetkazib berish sharti (Incoterms soddalashtirilgan)
**Nima:** Tovar zavoddan olib ketiladimi (samovyvoz) yoki zavod yetkazadimi, transport narxi kimga.
**Nega kerak:** Transport sezilarli xarajat; narxga kiritilgani yoki alohida ekani aniq bo'lishi kerak.
**Variantlar:**
- A) Variant tanlanadi (samovyvoz / zavod yetkazadi), yetkazsa transport alohida qator — shaffof
- B) Doim narxga kiritilgan — sodda, lekin uzoq mijozga adolatsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Logistika/Ombor (jo'natma), Moliya

### Q408. Valyuta va kurs
**Nima:** Narxlar so'mda mi, dollarda mi (kursga bog'lab) belgilanadi; import xomashyo dollarga bog'liq bo'lsa.
**Nega kerak:** Karton importda dollarga bog'liq; so'm narx kurs ko'tarilsa zararga aylanadi.
**Variantlar:**
- A) Shartnomada "dollarda, to'lov kuni kursi bo'yicha so'mda" varianti mavjud — kurs riskidan himoya
- B) Faqat so'm, sobit — sodda, lekin kurs riski zavodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (kurs farqi)

### Q409. QQS (NDS) va soliq ko'rsatkichi
**Nima:** Narx QQS bilan mi yoki QQSsiz ko'rsatiladi; mijoz QQS to'lovchimi (yuridik) yoki yo'q (jismoniy/sodda).
**Nega kerak:** QQSli va QQSsiz mijozga narx farqi bor; hisob-faktura to'g'ri chiqishi shart.
**Variantlar:**
- A) Mijoz turi (QQS to'lovchi/yo'q) kartada, narx avtomatik QQS bilan/siz ko'rsatiladi — to'g'ri faktura
- B) Doim bir xil — sodda, lekin xato faktura xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (soliq, faktura)

### Q410. Hisob-faktura va shartnomaga raqamlash tartibi
**Nima:** Buyurtma, KP, shartnoma, faktura raqamlari avtomatik beriladimi (yil/oy/tartib formatida).
**Nega kerak:** Qo'lda raqamlash takrorlanadi va chalkashadi; soliq/audit uchun tartib kerak.
**Variantlar:**
- A) Avtomatik raqam (masalan SO-2026-00123) har hujjat turiga alohida ketma-ketlik — tartibli
- B) Qo'lda raqam — erkin, lekin takror/xato xavfi
- C) Keyin — hozir kerak emas

### Q411. Mijoz kartasidagi rekvizit maydonlari
**Nima:** Mijoz haqida saqlanadigan ma'lumotlar: nomi, INN/STIR, h/r, bank, manzil, mas'ul shaxs, telefon, toifa, kredit limit, to'lov sharti.
**Nega kerak:** Shartnoma va faktura uchun rekvizit kerak; har safar so'rab o'tirmaslik uchun.
**Variantlar:**
- A) To'liq strukturalangan karta (yuqoridagi maydonlar) — faktura avtomatik to'ladi
- B) Faqat nomi va telefon — tez, lekin hujjat qo'lda to'ldiriladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM, Moliya

### Q412. Mijoz unikalligini tekshirish (dublikat oldini olish)
**Nima:** Yangi mijoz qo'shilganda INN/telefon bo'yicha allaqachon bor-yo'qligi tekshiriladimi.
**Nega kerak:** Bir mijoz ikki marta kiritilsa, qarz va tarix ikkiga bo'linadi, ABC tahlil buziladi.
**Variantlar:**
- A) INN/telefon bo'yicha avtomatik tekshiruv, dublikat bo'lsa ogohlantiradi — toza baza
- B) Tekshiruv yo'q — tez, lekin dublikat ko'payadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (mijoz bazasi tozaligi)

### Q413. Buyurtma manbai (kanal) belgisi
**Nima:** Buyurtma qaerdan kelganini qayd etish: telefon, Telegram, sayt, sotuvchi tashrifi, takroriy mijoz.
**Nega kerak:** Qaysi kanal ko'p buyurtma keltirishini bilish marketing va sotuvchi samarasini o'lchaydi.
**Variantlar:**
- A) Har buyurtmada "manba" maydoni (ro'yxatdan) — tahlilli, KPI uchun
- B) Manba qayd etilmaydi — sodda, lekin tahlil yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Marketing, HR (sotuvchi KPI)

### Q414. Sotuvchi (menejer) buyurtmaga biriktirilishi va bonusi
**Nima:** Har buyurtmaga mas'ul sotuvchi biriktiriladimi va uning bonusi sotuv summasi yoki marjadan hisoblanadimi.
**Nega kerak:** Sotuvchi motivatsiyasi va javobgarligi buyurtmaga bog'lanmasa, hisob yuritib bo'lmaydi.
**Variantlar:**
- A) Mas'ul sotuvchi majburiy + bonus marjadan (chegirma berса bonus kamayadi) — adolatli motivatsiya
- B) Bonus aylanmadan (chegirmaga qaramaydi) — sodda, lekin sotuvchi chegirma berib aylanma quvadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Payroll (bonus), Moliya (marja)

### Q415. Narx-ro'yxat (preyskurant) standart mahsulotlar uchun
**Nima:** Tez-tez sotiladigan standart o'lchamlar uchun tayyor narx-ro'yxat bo'ladimi (har safar kalkulyatsiya qilmasdan).
**Nega kerak:** Oddiy standart quti uchun har safar to'liq hisob ortiqcha; tayyor narx tezlashtiradi.
**Variantlar:**
- A) Standart pozitsiyalar preyskuranti (davriy yangilanadi) + nostandartga to'liq kalkulyatsiya — tez va aniq
- B) Doim to'liq kalkulyatsiya — aniq, lekin sekin
- C) Keyin — hozir kerak emas

### Q416. Buyurtma tarixini o'zgartirish jurnali (audit)
**Nima:** Buyurtma narxi/tiraji/muddati kim tomonidan, qachon o'zgartirilgani saqlanadimi.
**Nega kerak:** Narx yoki muddat "o'zgarib qolgan" deganda kimligi aniq bo'lishi kerak; nizo va nazorat uchun.
**Variantlar:**
- A) Har o'zgarish jurnalga (kim/qachon/eski→yangi) — to'liq shaffoflik
- B) Jurnal yo'q, faqat oxirgi holat — sodda, lekin javobgarlik noaniq
- C) Keyin — hozir kerak emas

### Q417. Mijozga avtomatik xabar (status yangilanishi)
**Nima:** Buyurtma tasdiqlandi / ishga tushdi / tayyor / jo'natildi bo'lganda mijozga avtomatik xabar (SMS/Telegram) yuboriladimi.
**Nega kerak:** Mijoz qo'ng'iroq qilib so'ramasligi va ishonchi ortishi uchun.
**Variantlar:**
- A) Asosiy 3 holatda avtomatik xabar (tasdiq/tayyor/jo'natildi) — kam, lekin foydali
- B) Xabar yo'q, mijoz o'zi so'raydi — sodda, lekin xizmat past
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM, AI/Bildirishnoma

### Q418. Reklamatsiya (sifat e'tirozi) sotuvga ulanishi
**Nima:** Mijoz tovardan norozi bo'lsa (brak), reklamatsiya to'g'ridan-to'g'ri buyurtmadan ochiladimi va qayta ishlab berish/qaytarish bilan bog'lanadimi.
**Nega kerak:** E'tiroz buyurtmaga ulanmasa, qaysi partiyada muammo borligi yo'qoladi.
**Variantlar:**
- A) Buyurtmadan "reklamatsiya ochish" tugmasi, sifat moduliga ulanadi, hal yo'li (qayta/chegirma/qaytarish) qayd etiladi — yopiq sikl
- B) Reklamatsiya alohida, bog'liqlik yo'q — sodda, lekin tahlil yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati, Ishlab chiqarish (qayta ishlash), Moliya (qaytarish)

### Q419. Mavsumiylik va narx indeksatsiyasi
**Nima:** Karton narxi mavsumda yoki kurs/inflyatsiya bilan ko'tarilganda preyskurant va amaldagi shartnomalar avtomatik yangilanadimi.
**Nega kerak:** Eski narxda qotib qolgan shartnoma zavodga zarar keltiradi.
**Variantlar:**
- A) Preyskurant davriy yangilanadi + yillik shartnomada "narx indeksatsiyasi" bandi (kurs/xomashyoga bog'liq) — himoya
- B) Narx muzlatilgan, qo'lda yangilanadi — sodda, lekin kechikadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (marja), Shartnoma shartlari

---

## II QISM — KITOB-GROUNDED qo'shimcha savollar (real hujjatlardan)

> Manba (D:/kitob): **ТЗ в КБ ДБ (3).xlsx** (Техническое задание — buyurtma kartasi maydonlari), **КП Пепси.docx** (real tijorat taklifi: narx jadvali, to'lov shartlari, imzo), **Производство 2026 04.xlsx** (buyurtma kuzatuv jadvali — Папка/1С/статус/йо'налиш), root.md **orgpolitika** (Савдо рахбари / Савдо менежерлари / Даромадлар бўлими / Коммуникация НО-2 rollari). Quyidagilar I qismdagi 52 ni TAKRORLAMAYDI — ular kitobdagi aniq atama/maydon/qoidaga bog'langan.

### Q420. Конгрев va тиснение alohida operatsiya sifatida
**Nima:** Kitobdagi ТЗ да "тиснение" va "конгрев" ALOHIDA qatorlar. Buyurtmada ikkalasi bir-biridan ajratilib, har biri o'z narxi va o'z formasi (klishe vs shtamp) bilan belgilansinmi.
**Nega kerak:** Тиснение (folga bosish) va конгрев (relyef bo'rtma) — har xil jihoz, har xil forma, har xil narx. Ko'pchilik ikkalasini "tisnenie" deb aralashtiradi, natijada narx va marshrut xato.
**Variantlar:**
- A) Тиснение va конгрев alohida belgi + alohida forma kodi + alohida narx — to'g'ri marshrut
- B) Bitta "bo'rtma/folga" qatori — sodda, lekin jihoz/forma chalkashadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Konstruktor byurosi (forma turi), Ishlab chiqarish marshruti.

### Q421. Тиснение rangi: золото / серебро tanlovi
**Nima:** Kitobda тиснение → "золота / серебро". Buyurtmada folga rangi (oltin/kumush) tanlanib, ombordan mos folga band qilinsinmi.
**Nega kerak:** Oltin va kumush folga — har xil material, har xil zaxira. Buyurtmada belgilanmasa, ishlab chiqarish to'xtab folga so'raydi yoki noto'g'ri folga ishlatadi.
**Variantlar:**
- A) Folga rangi (oltin/kumush) majburiy → ombor zaxirasiga bog'lanadi — material aniq
- B) Rangni usta o'zi tanlaydi — chalkashlik, brak xavfi
- C) Keyin
⤳ Ta'sir: Ombor (folga zaxirasi), Ta'minot.

### Q422. Ламинация turi: глянцевая / матовая / метал buyurtmada
**Nima:** Kitobda ламинация → "глянцевая / матовая / метал-золота / метал-серебро". Buyurtmada laminat plyonka turi shu ro'yxatdan tanlansinmi.
**Nega kerak:** Yaltiroq, mat va metallik plyonka — uch xil rulon, uch xil narx. Tanlanmasa narx kalkulyatsiyasi va ombor sarfi xato.
**Variantlar:**
- A) Plyonka turi ro'yxatdan (glянец/mat/metal-oltin/metal-kumush) → narx+ombor avto — aniq
- B) "Laminatsiya bor" bitta belgi — turi noaniq
- C) Keyin
⤳ Ta'sir: Ombor (plyonka turi), narx.

### Q423. Лак turi: сплошной / трафаретный / ВД лак / выборочный
**Nima:** Kitobda "лакировка", "сплошной лак", "трафаретный лак", "ВД лак" alohida turlari bor. Buyurtmada lak turi (to'liq/trafaret/suv asosli/tanlama) belgilansinmi.
**Nega kerak:** Сплошной (butun yuza) va трафаретный (faqat naqsh) lak — har xil sarf va narx; ВД лак (suv asosli) — boshqa jihoz. Aralashsa narx xato.
**Variantlar:**
- A) Lak turi ro'yxatdan + qoplama foizi → narx avto — aniq
- B) Faqat "lak bor" — sarf taxminiy
- C) Keyin

### Q424. Кашировка (gofraga yopishtirish) alohida operatsiya
**Nima:** Kitobda "кашировка / каширование" alohida operatsiya. Buyurtmada bosma listni gofraga kashировка qilish belgisi va narxi bo'lsinmi.
**Nega kerak:** Кашировка — offset bosma + gofra birlashtirish (premium quti). Alohida jihoz va vaqt; belgilanmasa marshrut va narx noto'g'ri.
**Variantlar:**
- A) "Кашировка" belgisi → gofra+offset marshruti birlashadi, narx qo'shiladi — to'g'ri
- B) Belgi yo'q — premium quti oddiy quti narxida ketadi (zarar)
- C) Keyin
⤳ Ta'sir: Ishlab chiqarish (offset+gofra marshrut birlashishi).

### Q425. Высечка turi: автотигель / ротационная / плоттер
**Nima:** Производство jadvalida "Ротационная высечка", "Автотигель", "Плоттер", "Авто/Ручной" variantlari bor. Buyurtmada вырубка usuli (avtotigel/rotatsion/plotter/qo'lda) belgilansinmi.
**Nega kerak:** Rotatsion vyrubka — katta tираж, plotter — namuna/kichik, avtotigel — o'rtacha. Usul tираж va narxni belgilaydi.
**Variantlar:**
- A) Вырубка usuli buyurtmada (тираж/o'lchamга qarab AI tavsiya) — to'g'ri jihoz
- B) Usulни usta keyin tanlaydi — sotuv narxni taxmin qiladi
- C) Keyin
⤳ Ta'sir: Ishlab chiqarish (vyrubka uchastkasi).

### Q426. Склейка turi: автомат / ручная / ФСМ / окошковклейка
**Nima:** Kitobда "склейка", "Ручная склейка", "ФСМ", "окошковклейка" bor. Buyurtmада yelimlash usuli (avtomat/qo'lda/ФСМ/oyna-yelimlash) belgilansinmi.
**Nega kerak:** Qo'lda склейка — qimmat ish vaqti; avtomat — arzon. Окошковклейка (oyna yelimlash) alohida. Usul ish narxini keskin o'zgartiradi.
**Variantlar:**
- A) Склейка usuli ro'yxatdan → ish vaqti+narx avto (sdelka tarifiga ulanadi) — aniq
- B) "Yelimlash bor" — ish vaqti taxminiy
- C) Keyin
⤳ Ta'sир: HR/Payroll (qo'l mehnati sdelka), Ishlab chiqarish.

### Q427. "Без оборота / с оборотом" — bir tomon yoki ikki tomon bosma
**Nima:** Kitobда "без оборота / с оборотом" varianti. Buyurtmада bosma faqat oldi (bez oborota) yoki oldi+orqa (s oborotom) ekani belgilansinmi.
**Nega kerak:** Ikki tomon bosma — ikki barobar plastina o'tishi, ko'proq bo'yoq, ikki barobar mashina vaqti. Belgilanmasa narx jiddiy xato.
**Variantlar:**
- A) "Oldi / Oldi+orqa" radio → bo'yoq va mashina o'tishi ikki barobar hisoblanadi — aniq narx
- B) Izohда yoziladi — kalkulyatsiya yutib yuboradi
- C) Keyin

### Q428. "3-макро / 3-микро" — gofra/big turi belgisi
**Nima:** Kitobда "3 - макро / 3 - микро" varianti bor (gofra yoki big naqshi). Buyurtmада makro/mikro gofra turi belgilansinmi.
**Nega kerak:** Makro va mikro gofra — har xil flute, har xil his va narx. Mijoz "yengil mikrogofra quti" desa, makro bersak brak.
**Variantlar:**
- A) Gofra turi makro/mikro buyurtmада (lug'atdan) — to'g'ri material
- B) Umumiy "gofra" — tur noaniq
- C) Keyin

### Q429. Гофроящик qatlami: 2-слой / 3-слой / 5-слой
**Nima:** Производство jadvalida "2х слой / 5х слой" + KP'да "3 слой" bor. Buyurtmада gofra qatlam soni (2/3/5 qatlam) tanlansinmi.
**Nega kerak:** Qatlam soni mustahkamlik va narxni belgilaydi (3 qatlam yengil mahsulot, 5 qatlam og'ir yuk). Yuk ko'tarishга bog'liq.
**Variantlar:**
- A) Qatlam soni (2/3/5) + AI yuk ko'tarishга qarab tavsiya — mustahkamlik aniq
- B) Doim 3 qatlam — og'ir yuk uchun yetmaydi
- C) Keyin
⤳ Ta'sir: Konstruktsiya hisobi (Q7 yuk ko'tarish).

### Q430. Бандероль (o'rov lentasi) buyurtma elementi sifatida
**Nима:** Kitobда "бандероль" bor. Mahsulotга banderol (qog'oz lenta o'rov) qo'shimchasi alohida pozitsiya sifatida belgilansinmi.
**Nega kerak:** Banderol — alohida bosma + qirqim + o'rov ishi. Asosiy mahsulot bilan aralashsa narx va sarf yo'qoladi.
**Variantlar:**
- A) Banderol alohida pozitsiya (o'z o'lchami/bosmasi/narxi) — aniq
- B) Asosiy quti narxiga yashiriladi — sarf bilinmaydi
- C) Keyin

### Q431. Латок standart SKU katalogi (Латок 449, Латок 250)
**Нима:** KP Pepsi'да "Латок 449 = 390×259×60 мм", "Латок 250 = 330×219×60 мм" nomli standartlar. ERP shu takror sotiladigan lotoklarni nomli SKU sifatida katalogласинми (o'lcham+gofra spetsifikatsiya+narx bog'langan).
**Nega kerak:** Bir xil lotok takror-takror sotiladi. SKU tanlansa o'lcham/spetsifikatsiya/narx avtomatik kelади — qayta kiritish va xato yo'qoladi.
**Variантlar:**
- A) Nomli SKU katalogi (Латок-449, Латок-250…) to'liq spetsifikatsiya bilan — takror buyurtma 1 klik
- B) Har safar o'lcham+spetsifikatsiya qo'lда — sekin, xato
- C) Keyin
⤳ Ta'sир: Ombor (SKU), narx jadvali, takror buyurtma (Q33).

### Q432. "Тех описание по бумагам" matnini ERP avtomatik tuzishi
**Нима:** KP Pepsi'да har mahsulot yonida "Гофра 3 слой, Марка Т22, профил С" kabi texnik tavsif yoziladi. ERP buni buyurtmадаги qatlam/marka/profil maydonlardan avtomatik matn qilib chiqarsinми.
**Nega kerak:** Qo'lда yozilsa har menejер har xil yozadi va xato qiladi. Maydonlardan avto-matn izchil taklif beради.
**Variантlar:**
- A) ERP maydonlardan "тех описание" matnini avto shakllantiради — izchil, xatosiz
- B) Menejер qo'lда yozади — har xil, xato
- C) Keyin
⤳ Ta'sир: Material lug'ati (marka/profil reestri).

### Q433. Марка Т22 / профил С — material lug'ati standartlanган
**Нима:** KP'да "Марка Т22, профил С" — gofra standart belgilari. ERP да gofra markasi (Т21/Т22/Т23…) va profil (B/C/E…) markaziy lug'atдан tanlansинми.
**Nega kerak:** Marka va profil — sanoat standarti. Erkin matn bo'lsa "T22"/"Т-22"/"t22" har xil yozilади, ombor va hisobot tarqайди.
**Variантlar:**
- A) Marka + profil markaziy lug'atдан (qattiq ro'yxat) — izchil, ombor mos
- B) Erkin matn — tarqалади
- C) Keyin
⤳ Ta'sир: Ombor (gofra reestri), Ta'minot.

### Q434. Plyonka qalinligi: 30 мкр / 100 мкр lug'ati
**Нима:** Kitobда "100 мкр / 30 мкр" plyonka qalinliklari bor. Laminatsiya buyurtmасида plyonka qalinligi (mikron) standart ro'yxatдан tanlансинми.
**Nega kerak:** 30 мкр va 100 мкр — har xil narx va himoya. Qalinlik belgilanmаса narx va ombor sarfi xato.
**Variантlar:**
- A) Mikron qalinlik ro'yxатдан (30/100/…) → narx+sarf avto — aniq
- B) Qalinlik usta tanlайди — narx taxminiy
- C) Keyin

### Q435. "Папка №" — buyurtmага jismoniy papka raqami bog'lash
**Нима:** Производство jadvalida "Папка №2 / Папка №" bor — zavodда hujjatlar jismoniy papkада yuради. ERP buyurtmага papka raqамини bog'lab saqласинми.
**Nega kerak:** "Qaysi papkада" savoli har kuni so'ralади. Raqам ERP да bo'lса, jismoniy hujjat tez topилади.
**Variантlar:**
- A) Buyurtmада "Папка №" maydoni — jismoniy ↔ raqamli bog'lανади
- B) Papka faqat qog'озда — ERP bilmайди
- C) Keyin

### Q436. "Заказ 1С" — eski 1С raqamini saqlash (migratsiya ko'prigi)
**Нима:** Производство jadvalида "заказ 1С" ustuni bor. ERP buyurtmага eski 1С raqамини (ixtiyoriy) bog'ласинми — eski hisobот bilan solishtириш uchun.
**Nega kerak:** Kompaniya 1С dan kelяpti. O'tиш davrида eski raqам saqlanса, eski va yangi hisobни solishtириш va mijоз tarixини ulаш oson.
**Variантlar:**
- A) "1С raqами" ixtiyoriy maydon — o'tиш ko'prigi
- B) Saqlanмайди — eski hujjат bilan uzилади
- C) Keyin

### Q437. Buyurtma statuslari aynan zavod jadvalидаги: Ожд.Сырьё / Ожд.Производство
**Нима:** Производство jadvalида "Готов / Ожд.Сырьё (xom-ashё kutilmoqда) / Ожд.Производство (ishlab chiqариш navbati) / В процессе / Завершен / Отменен" statuslari bor. SD buyurtmа holати aynan shu real ro'yxатга moslassinми.
**Nega kerak:** Zavод allaqачон shu statuslar bilan ishlайди. "Ожд.Сырьё" — material yo'q, "Ожд.Производство" — navбат kutyapti. ERP boshqа statuslar qo'yса, xodimlar tushунmайди.
**Variантlar:**
- A) Aynan real statuslar (В процессе/Ожд.Сырьё/Ожд.Производство/Готов/Завершен/Отменен) — tanish, mos
- B) Yangi soddalaштирилган statuslar — qayta o'rgatиш
- C) Keyin
⤳ Ta'sир: Ишлаб chiqариш (status manbasi), Ombor (Ожд.Сырьё = material kutilmoqда signali).

### Q438. "Ожд.Сырьё" statusi avtomatik Ta'minotга signal beradimi
**Нима:** Buyurtmа "Ожд.Сырьё" (xom-ашё kutilmoqда) bo'lса, ERP avtomatик Ta'minот bo'limига material so'rови yuborсинми.
**Nega kerak:** Buyurtmа xom-ашё yetishмаслигиdan to'xtаб turса, kimдир material buyurtмаси kerakлигини bilиши shart. Avtomатik signal kechикишни kаmайтиради.
**Variантlar:**
- A) "Ожд.Сырьё" → Ta'minотга avto so'ров + sotuvга ko'ринади — uzилиш yopилади
- B) Qo'лда aytилади — unutилиши mumkin
- C) Keyin
⤳ Ta'sир: Ta'minот (импорт xom-ашё), Ombor.

### Q439. "Направление производства" — Офсет / Флексо yo'nalishi
**Нима:** Производство jadvalида "Направление производства" + "Офсет / Флексо" bor. Sotuv buyurtма kiritганда bosma yo'nalиши (offset/flexo) belgilансинми.
**Nega kerak:** Offset — sifatli/katta tираж, flexo — gofra/etiketка. Yo'nalиш qaйси sex va mashинага ketишини, narx va muddатни belgилайди.
**Variантlar:**
- A) Buyurtмада yo'nalиш (Офсет/Флексо) + AI tavsия (mahsулот turiдан) — rejага ulanади
- B) Yo'nalишни ишлаб chiqариш keyин belgилайди — sotuv bilmайди
- C) Keyin
⤳ Ta'sир: Ишлаб chiqариш rejаси (MPS), narx.

### Q440. Mashина formati narxга ta'sир: 72СМ / 52СМ / КВА 105
**Нima:** Производство jadvalида "72 SM / 52 SM / КВА 105" mashиналари bor. Buyurtма o'lchамига qarab ERP mos format/mashинани va undан kelиб chiqадиган narxни tavsия qилсинми.
**Nega kerak:** Katta list 72см да arzon, kichик 52см да qиммат. КВА 105 — boshqа quvват. To'g'rи mashина = to'g'rи narx va tezlик.
**Variантlar:**
- A) O'lchамдан ERP format/mashина tavsия + narx farqи — optималлашади
- B) Mashинаni usта keyин tanlайди — narx taxминiy
- C) Keyin
⤳ Ta'sир: Ишлаб chiqариш (mashина yuklаmаси/CRP).

### Q441. Birlik tanlovи: лист / шт / м2 (mahsулот turiга qarab)
**Нима:** Производство jadvalида "Единица измерения: лист / шт / м2". Buyurtмада miqдор birligи mahsулот turiга qarab avtomатик (quti→шт, list→м2, gofra→лист) belgилансинми.
**Nega kerak:** Quti — dona, gofra list — m2 yoki лист. Birlик aralашса narx va ombor xato. Mahsулот turiдан avto-birlик xatоni kаmайtиради.
**Variантlar:**
- A) Mahsулот turiдан birlик avto (quti→шт, gofra→м2/лист) + qo'лда o'zgартириш — to'g'rи
- B) Doim "шт" — gofra listда muаммо
- C) Keyin
⤳ Ta'sир: Ombor, Ишлаб chiqариш (chiqим hisobи).

### Q442. Material kimники: давальческое (mijoz materiали) belgisi
**Нима:** Kitobда ТЗ "материалы заказчика (файлы, ссылки)" + "Материал для изготовление макета" maydonлари bor. Buyurtмада material kim beради — kompания yoki mijoz (давальческое) — belgилансинми.
**Nega kerak:** Mijоз qog'oz/plyonка bersа, narxдан material chiqариlади va ombor "begona material" deб yuрatади. Belgиланmаса narx va ombor xato.
**Variантlar:**
- A) "Material: kompания / mijoz (давальческое)" belgisi → narx va ombor moslашади — to'g'rи hisоб
- B) Doim kompания — давальческое holати buzилади
- C) Keyin
⤳ Ta'sир: Ombor (begona material hisobи), narx, Ta'minот.

### Q443. Mijoz fayllари (макет/трафарет) buyurtмага biriktирилиши
**Нима:** Kitobда "материалы заказчика (файлы, ссылки)", "трафарет" maydonлари bor. Mijоz yubорган dizайn fayli/havola/trafaret buyurtмага biriktирилиб saqлансинми.
**Nega kerak:** Dizайn byurosи mijоз faylисиз ишни boshlай olmайди. Fayl buyurtмага bog'lанса, Telegram/pochtада izlаш yo'qолади.
**Variантlar:**
- A) Buyurtмага fayl yuklаш + havola + trafaret holати — DB га bog'lанади
- B) Fayllар Telegram/pochtада qoлади — ERP bilmайди
- C) Keyin
⤳ Ta'sир: Dizайn byurosи, Konstruktор byurosи (KB/DB oltин-ip).

### Q444. Buyurtма tasdiqлангач ТЗ avtomातик KB/DB га yuborилиши
**Нима:** Hujjат nomи aynan "ТЗ в КБ ДБ" — ya'nи Konstruktор va Dizайn byurosига topshıриq. Buyurtма tasdiqлангач ERP ТЗ ни avtomатik shu ikки byuroга yuborсинми.
**Nega kerak:** Qo'л-bera-qo'л topshıриш yo'qотиш va kechикиш beради. Avtomатик oqим — oltин-ip uzилмайди.
**Variантlar:**
- A) Tasdiqлангач ТЗ avto KB+DB navbатига (bildirишnoma) — oqим uzилмайди
- B) Menejер qo'лда yuborади — unutилиши mumkin
- C) Keyin
⤳ Ta'sир: Konstruktор byurosи, Dizайn byurosи (oltин-ip hop).

### Q445. Грузоподъёмность (kg) → gofra qatlам/marka avto-tavsия
**Нима:** Kitobда ТЗ "Грузоподъёмность, кг" maydoni bor. Mijоz quti necha kg ko'tариши kerakлигини kiritса, ERP mos gofra qatlам va markани tavsия qилсинми.
**Nega kerak:** Yuk talabi konstruksияni belgилайди. Mijоz "10 kg" desа, ERP "5 qatlам Т23" tavsия qилса, brak va shikоyат kаmaяди.
**Variантlar:**
- A) kg maydoni → AI gofra qatlам/marka tavsия — konstruksияга ulanади
- B) Faqat kg yozилади, qatlамни usta tanlайди — sub'ektиv
- C) Keyin
⤳ Ta'sир: Konstruktор byurosи, Sifат (yuk testи).

### Q446. КП ni ERP avtomатик PDF chiqариши (logo+jadval+shartlar+imzо)
**Нima:** KP Pepsi — Word'да qo'лда tuzилган. ERP kotirovка/buyurtмадан shu KP ni avtomатik PDF qилсинми — logo, narx jadvali (№/Nomi/Tex.tavsif/1 dona narx НДС'сiz), to'lов shartлари, kontaкt/imzо bilan.
**Nega kerak:** Har KP ni Word'да qo'лда tuzиш — vaqt va xato. ERP dan avto chiqса format izchил, tez, brending saqланади.
**Variантlar:**
- A) ERP avto KP PDF (kitobдаги formатда: logo/jadval/to'lов/5% qoidasi/imzо) — tez, izchил
- B) KP qo'лда Word'да — sekin, har xil
- C) Keyin
⤳ Ta'sир: Marketинг (brending).

### Q447. Kotirovка imzosи: Коммерческий директор avtomатик tushishi
**Нима:** KP Pepsi tagида "Коммерческий директор Назирова Моҳидилхон + 3 telefon". ERP kotirovкасига mas'ul (komdir yoki menejер) ism+telefonи karta-modelдан avtomатik tushсинми.
**Nega kerak:** Rasmиy taklифда kontaкt shart. Avtomатik bo'lса, har taklиф to'g'rи imzоlanади, eskирgan telefон chiqмайди.
**Variантlar:**
- A) Kotirovкага mas'ul ism+telefон avto (karta-modelдан) — rasmиy, dolzарб
- B) Qo'лда yozилади — eskирган kontaкt xavfи
- C) Keyin
⤳ Ta'sир: Karta-modeл (lavozım kontaкти).

### Q448. KP imzоlаш huquqи: kim KP yubоrа olади (governance)
**Нима:** Kitobда KP ni Коммерческий директор imzоlайди (menejер emas). ERP да KP ni rasmиy yuborиш huquqи faqat komdир/rahbарга berилsинми yoki menejер ham yubоrа olsinми.
**Nega kerak:** Narx — kompания obro'sи va foydаси. Menejер o'zboshımchа narx yuborса, nazorат yo'qоладi. Imzоlаш huquqи rolга bog'lansа, governance bo'lади.
**Variантlar:**
- A) Menejер qoralама tuzади → komdир/rahbар tasdiqлаб yuborади — nazorат
- B) Har menejер o'zи yuborади — tez, lekin nazorатsiz
- C) Keyin
⤳ Ta'sир: Karta-modeл RBAC, chegirма tasdiqлаш (I-qism Q16).

### Q449. Debitor — "Даромадлар бўлими" alohida rolга biriktирилиши
**Нима:** Orgpolитikада "Даромадлар бўлими бошлиғи — Дебитор қарздорлик билан боғлиқ масалалар" alohida rol. ERP да debitor undирish sotuvчидан AJRATILIB shu lavozым kartасига biriktırılсинми.
**Nega kerak:** Kitobда qarz undирish — alohida mas'ul, sotuvчи emas. Aralashса, sotuvчи o'z mijозидан qarz so'rашни istamайди (munosabатни buzмаслик uchun).
**Variантlar:**
- A) Debitor → Даромадlar bo'limи kartасига; sotuvчи faqat sotади — rol ajrайди
- B) Debitor ham sotuvчида — qiziqишlar to'qnашади
- C) Keyin
⤳ Ta'sир: Karta-modeл, RBAC, Moliya.

### Q450. Mijoz bilan aloqа korporатив raqамдан (НО-2 yo'риqnoma)
**Нима:** Orgpolитикада "корпоратив номерларни ишлатиш бўйича НО-2 йўриқнома" + "қўнғироқлар назорати". Sotuv mijоz bilan korporатив raqамдан gaplашиб, qo'ng'iroqлар ERP/CRM га tushсинми.
**Nega kerak:** Menejер shaxsиy raqамдан gaplашса, ketса mijозни olиб ketади. Korporатив raqам + jurnal — mijоz kompанияда qoлади va aloqа tarixi saqланади.
**Variантlar:**
- A) Mijоz bilan aloqа korporатив raqамдан + qo'ng'iroq jurnali buyurtмага — mijоz kompанияники
- B) Shaxsиy raqам — mijоz menejерники
- C) Keyin
⤳ Ta'sир: Коммуникация bo'limi, CRM aloqа tarixi.

### Q451. Menejер ketса mijоz bazаси avtomातик qayta biriktırılиши
**Нима:** "24000 mijоz, 20 yil" — baza qiммат. Sotuv menejери ишдан ketса, uning mijозlari avtomातик rahbар/yangи menejерга o'tsинми.
**Nega kerak:** Mijоz menejерда emas, kompанияда bo'lиши kerak. Ketганда mijоz "egasиz" qolса, e'tibоrsız qolиб ketади va raqobаtchи olиб ketади.
**Variантlar:**
- A) Menejер nofaол → mijозlari rahbарга/yangига avto o'tади — baza kompанияники
- B) Mijозlar egasиz qoлади — yo'qоладi
- C) Keyin
⤳ Ta'sир: Karta-modeл, HR (ишдан bo'shаш).

### Q452. Lead (potensиал mijоz) buyurtмадан oldинги bosqич
**Нима:** "24000 mijоz" oqимi — yangи mijоz topиш muhим. Buyurtмадан oldинги bosqич (lead/потенциальный) alohida kuzаtilсинми (gaplашилди → kotirovка → buyurtма vorоnasi).
**Nega kerak:** Har gaplашилган potensиал buyurtмага aylanмайди. Lead bosqичи bo'lса, konversия % (necha lead → buyurtма) va yutqазилган leadлар ko'ринади.
**Variантlar:**
- A) Lead → kotirovка → buyurtма vorоnasi; konversия % — sotuv samarасi ko'ринади
- B) Faqat buyurtма kuzаtilади — yutqазилган leadлар bilинмайди
- C) Keyin
⤳ Ta'sир: Marketинг, CRM.

### Q453. Mavsumиy mahsулот (календари / подарочные) — mavsum-oldи signal
**Нима:** KP katalogида "календари, подарочные" — mavsumиy (yangи yil). ERP mavsumдан oldин sotuvга "kalendар mavsumi boshlanди, o'tgan yil mijозlарига taklиf yubоring" signal berсинми.
**Nega kerak:** Kalendар dekabрда kech. ERP oktyabрда signal berса, mavsum yutilмайди va o'tgan yil mijозlари qaytарilади.
**Variантlar:**
- A) Mavsumиy mahsулотга mavsum-oldи ogohlantırış + o'tgan yil mijоз ro'yxати — mavsum yutilади
- B) Mavsumсiz — kech qoлади
- C) Keyin
⤳ Ta'sир: Marketинг, Ишлаб chiqариш rejаси.

### Q454. Mahsулот katalogи kitobдаги ~15 toifага moslаш
**Нима:** KP'да xizматlar: упаковки, календари, подарочные, крафт пакеты, гофролотки, гофрокоробки, дисплеи, для игрушек, буклеты, упаковки для пиццы, бумажные стаканы, воблеры/шелфтокеры, рулонные самоклейки, плакаты/постеры, гофроящики. ERP mahsулот katalogi shu real toifалардан tuzилсинми.
**Nega kerak:** Sotuv aynan shu assortımentни sotади. Katalоg mos bo'lса, buyurtма kiritиш va toifали hisobот (qaйси toifа ko'p) ишлайди.
**Variантlar:**
- A) Katalоg kitobдаги ~15 toifага bo'linади — real assortıment
- B) Umumиy "mahsулot" ro'yxати — toifасiz hisobот
- C) Keyin
⤳ Ta'sир: Hisobотlар, narx jadvali.

### Q455. Bумажные стаканы / пицца упаковки — maxsus o'lchам shablonлari
**Нима:** Katalоgда "бумажные стаканы", "упаковки для пиццы" — standart o'lchамли maxsus mahsулотlar. Bularга alohida o'lchам shablonlари (stakан hajmi ml; pizza diametri sm) bo'lсинми.
**Nega kerak:** Stakан "250 ml / 350 ml", pizza qutиси "30 sm / 35 sm" standartlари bor. Umumиy a/b/c o'lchам bularга to'g'rи kelмайди.
**Variантlar:**
- A) Mahsулот turiга maxsus shablon (stakан→ml, pizza→diametr) — to'g'rи o'lchам
- B) Hamма a/b/c bilan — stakан/pizza chalkашади
- C) Keyin

### Q456. Рулонные самоклейки (etiketка) — rulоn parametrlари
**Нима:** Katalоgда "рулонные самоклейки" bor. Etiketка buyurtмасида rulоn parametrlари (gilza diametri, rulоnда dona soni, namuna/qator) bo'lсинми.
**Nega kerak:** Etiketка rulоnда yetkazılади (avtomат yopishtırış mashинаси uchun). Gilza va rulоn-dona soni belgиланмаса, mijоz mashинаси ishlаmайди.
**Variантlar:**
- A) Etiketкага rulоn parametrlари (gilza/rulоn-dona/yo'nalиш) — mijоz mashинасига mos
- B) Faqat dona soni — rulоn parametri noaniq
- C) Keyin

### Q457. Сумма / Осталось — buyurtма qoldиq qarzи real ko'ринишi
**Нима:** Производство jadvalида "Сумма" va "осталос" (qolгan to'lов) bor. Buyurtма kartасида Jami / To'ланган / Qoldиq avtomатik (to'lовlardan) ko'ринсинми.
**Nega kerak:** Menejер/komdир bir qarашда kim qancha qarzdorлигини ko'риши kerak. Qoldиq avto = debitor real vaqt (Q82 Даромадлар bo'limи uchun).
**Variантlar:**
- A) Buyurtмада Jami/To'ланган/Qoldиq avto (to'lовlardan) — debitor real
- B) Qoldиqни qo'лда hisоблайди — eskиради
- C) Keyin
⤳ Ta'sир: Даромадлар bo'limi, Moliya.

### Q458. Va'da sanası (Дата готовности) ишлаб chiqariш quvватidan tasdiqланиши
**Нима:** Производство jadvalида "Дата готовности" bor. Menejер mijозга sana va'da qилишдан oldин ERP ишлаб chiqариш band/bo'shлигиni tekshıриб, real eng erta sanani taklиf qилсинми.
**Nega kerak:** Menejер band sexга "ertaga tayyor" desа, kechикиш kafolatланган. Quvватдан kelгan sana — bajarıladıgан va'da.
**Variантlar:**
- A) ERP quvватдан real eng erta sana taklиf qилади; menejер shuni va'da qилади — bajarıladıgан va'da
- B) Menejер o'zи sana aytади — ko'p kechикиш
- C) Keyin
⤳ Ta'sир: Ишлаб chiqариш rejаси (CRP/MPS).

### Q459. Va'da sana ↔ real tayyor sana solishtırılиб kechикиш o'lchaниши
**Нима:** Sotuv va'da qилган sana (Q5 I-qism "zavод va'dasi") bilan real "Дата готовности" solishtırılиб, har buyurtма bo'yicha kechикиш kunlari o'lchaнsинми.
**Nega kerak:** "Muddатда bajариш %" — sotuv va ишlab chiqариш KPI'sи. Kechикиш o'lchaнmаса, mijоz ishonchи pasайди va sabab topилмайди.
**Variантlar:**
- A) Va'da ↔ real solishtırılади; kechикиш kuni + sababи (Ожд.Сырьё/navбат…) qайд — KPI aniq
- B) Faqat real sana saqланади — kechикиш bilинмайди
- C) Keyin
⤳ Ta'sир: KPI (muddатда bajариш), Ишлаб chiqариш.

### Q460. Упаковка turi: степлер / паллет / мягкая / верёвка
**Нима:** Kitobда упаковка: Степлер, гофрокоробка, мягкая упаковка, верёвка, паллет (паддон). Buyurtмада tayyor mahsулот qanday o'rаlиши belgилансинми.
**Nega kerak:** O'raш turi — ish vaqti va material (kitobда "паддон кадоклаган" alohida ish-soat). Belgиланмаса narx va vaqt xato.
**Variантlar:**
- A) Упаковка turi tanlanади (степлер/коробка/паллет/мягкая) → vaqt+material avto — to'g'rи hisоб
- B) O'raш standart deб olинади — sarf xato
- C) Keyin
⤳ Ta'sир: Ишлаб chiqариш (упаковка uchastkasi), Ombor, HR (qo'л ish-soat).

### Q461. Paллетда dona soni va paллет o'lchами buyurtмада
**Нима:** Mahsулот paллетда yetkazılса, paллетда necha dona / necha qator / paллет o'lchами (1200×800…) belgилансинми.
**Nega kerak:** Paллет parametri — logistика (necha paллет, necha mashина) va mijоz omborи uchun shart. Belgиланmаса yetkazиш rejаси chiqмайди.
**Variантlar:**
- A) Paллет parametri (dona/qator/o'lchам) buyurtмада → logistика hisоблайди — aniq jo'natма
- B) Paллет keyин hisоблaнади — yetkazиш taxminiy
- C) Keyin
⤳ Ta'sир: Eltiб beriш bo'limi (logistика), Ombor.

### Q462. Klishe/forma egalиги va arxиv muddати (mijоzники yoki zavодники)
**Нима:** I-qism Q12 klishe to'lovини so'rади, lekin EGALИK va SAQLAШ muddатини emas. Mijоz to'lаган klishe/shtamp kimники (mijоz yoki zavод) va zavод uni necha yil saqлайди — belgиланsinми.
**Nega kerak:** Mijоz "klishe menики, qaytаринг" desа yoki "yo'qоtibsiz" desа nizо chiqади. Egalик va saqlаш muddати yozма bo'lса, nizо oldи olинади.
**Variантlar:**
- A) Klishe egalиги (mijоz/zavод) + saqlаш muddати (masalan 3 yil, keyин ogohlantırış) buyurtмада — nizо himояsи
- B) Egalик noaniq — nizо chiqади
- C) Keyin
⤳ Ta'sир: Konstruktор byurosi (forma arxиvi).

### Q463. Buyurtма rentabelлиgi (margin) menejерга real vaqtда ko'ринишi
**Нима:** Buyurtма kiritиб chegirма berганда, taxminиy tannarx va margin% menejерга (yoki rahbарга) real vaqtда ko'rsatılсинми.
**Nega kerak:** Menejер 5% chegirма berганда margin manfиy bo'lмаслигини ko'риши kerak. Margin ko'ринмаса, "ишladi lekin zararга sotди".
**Variантlar:**
- A) Buyurtмада Tannarx/Sotuv/Margin% (rolга qarab) + margin<X qizиl ogohlantırış — himоya
- B) Faqat sotuv narxи ko'ринади — zarar riski
- C) Keyin
⤳ Ta'sир: Moliya (tannarx, I-qism Q17 floor bilan bog'liq), narx.

### Q464. Tannarx/margin ko'ринишi RBAC — kim sirни ko'rади
**Нима:** Buyurtмадаги tannarx/margin — sir. Faqat rahbар/komdир ko'rsин, oddиy menejер faqat sotuv narxини ko'rsинми (karta-modeл RBAC).
**Nega kerak:** Tannarx sizиб chiqса raqobаtchи foydаlanади. Hamма ko'rса xavf. Rolга qarab ko'ринish — sir himояsи.
**Variантlar:**
- A) Tannarx/margin → faqat rahbар+; menejер sotuv narxини ko'rади — sir himоya
- B) Hamма ko'rади — sizиш riski
- C) Keyin
⤳ Ta'sир: Karta-modeл RBAC, Moliya.

### Q465. To'lов sharti shabloni: 50% avans + 5 kun qoldиq (KP standarti)
**Нима:** KP Pepsi'да "предоплата 50%, постоплата после отгрузки через 5 дней". Buyurtмада to'lов sharti shu tayyor shablonlardan (50/50+5kun; 100% avans; ko'rsatilгan kun) tanlansинми.
**Nega kerak:** Bu kompания real standartи. Har buyurtмада qo'лда yozиш o'rnига shablon tanlansа, debitor sanog'и avtomатлashади (Q44/Q90 bilan).
**Variантlar:**
- A) Tayyor shablonlar ("50% avans + 5 kun qoldиq", "100% avans", "N kun") — tanlаб qo'yилади
- B) Erkин matn — har xil, hisоб qiyин
- C) Keyin
⤳ Ta'sир: Даромадлар bo'limi (debitor), Moliya.

### Q466. Отгрузка sanasi + 5 kun → qoldиq to'lов muddати avtomатik sanog'i
**Нима:** KP'да postoplata "после отгрузки через 5 дней". Yetkazиш (отгрузка) belgилaнган kundan 5 kun avto sanab, qoldиq to'lов muddати va o'tса ogohlantırış chiqsинми.
**Nega kerak:** Postoplata sanog'и отгрузкадан boshlanади. Avto bo'lса debitor muddати aniq va ogohlantırış o'z vaqtида — Даромадлар bo'limi uchun.
**Variантlar:**
- A) Отгрузка sanasi + N kun = to'lов muddати avto; o'tса ogohlantırış — debitor aniq
- B) Muddатni qo'лда hisоблайди — kechикади
- C) Keyin
⤳ Ta'sир: Eltiб beriш bo'limi (отгрузка), Даромадлар bo'limi.

### Q467. 100% avans → 5% chegirма avtomатik qoidasi (KP siyosати)
**Нима:** KP Pepsi'да "По предоплате 100% скидка 5%". To'lов sharti "100% avans" tanlanса, ERP 5% chegirмани avtomатik qatorга qo'shsинми.
**Nega kerak:** Bu yozма siyosат. Menejер esидan chiqarса — mijозga adolатsiz yoki kompанияга zarar. Avtomатlashса siyosат har doim bajarılади.
**Variантlar:**
- A) "100% avans" → 5% chegirма avto (qatorда ko'ринади) — siyosат qotади
- B) Menejер qo'лда qo'llайди — unutilади
- C) Keyin
⤳ Ta'sир: narx kalkulyatsiyasi, Moliya.

### Q468. Narx НДС'сiz saqlanиб, QQS alohida qatorда chiqиши
**Нима:** KP'да "Цена за 1 ед. без НДС". ERP narxни НДС'сiz saqлаб, QQS'ni jami summада alohida qatorда chiqarсinми.
**Nega kerak:** Kitobдаги rasmиy taklиf НДС'сiz narx + alohida soliq mantig'ида. ERP shu mantиqни saqласа, taklиf va hisоb-faktура mos kelади (I-qism Q42 bilan).
**Variантlar:**
- A) Narx НДС'сiz saqланади, QQS alohida qator — taklиfга mos
- B) Narx QQS bilan — taklиfдан farq
- C) Keyin
⤳ Ta'sир: Moliya (faktура, QQS).

### Q469. Buyurtма o'zgartırış jurnali — тираж/muddат kim o'zgартирди
**Нима:** Mijоz tasdiqлангандан keyин тираж yoki muddатни o'zgартирса, ERP o'zgartırış tarixini (kim/qachon/eski→yangi) saqласинми (I-qism Q49 audit umumiy edi; bu тираж/muddат-specifик nizо uchun).
**Nega kerak:** "Men 5000 aytgandım, siz 3000 qildiнgiz" yoki "muddат o'zgарди" nizоларini hal qилиш uchun jurnal kerak.
**Variантlar:**
- A) Тираж/muddат/narx o'zgartırış jurnali (kim/qachon/eski→yangi) — nizо himояsи
- B) Faqat oxирgi holат — nizо isbotланмайди
- C) Keyin

### Q470. Maket tasdiqлангандan keyингina bosma — majburиy darvozа
**Нима:** Dizайn tayyor bo'lгач, mijоz maketни rasmиy tasdiqламagunchа bosmага o'tмаslik majburиy bosqич bo'lsинми (sana+kim tasdiqлади qайд).
**Nega kerak:** Tasdiqланмаган maketни bosиб qo'yib, mijоz "bu men aytganım emas" desа — butun тираж brak. Rasmиy tasdiq — brak himояsи (I-qism Q26 og'zaki tasdiqни so'rади, bu uni MAJBURИY DARVOZА qilади).
**Variантlar:**
- A) "Maket tasdiqланди" (sana+kim) bo'lмаса bosmа bloklanади — brak himоya
- B) Og'zаki rozилик bilan bosилади — brak riski
- C) Keyin
⤳ Ta'sир: Dizайn byurosи, Ишлаб chiqариш.

### Q471. Reklamация buyurtма+sex+sabab bilan bog'lanиши
**Нима:** I-qism Q51 reklamацияni sifат moduliга ulади. Bu — reklamацияni AYNAN qaйси buyurtма+sex/uchastka+sabab (rang/склейка/o'lchам) bilan bog'lаб, qaйси sex brak berayotganини ko'rsatadi.
**Nega kerak:** Kitobда "Сифат бўлими — мижозлар билан масалалар". Shikоyат buyurtма+sexга bog'lansа, brak ildiz-sababи (qaйси mashина/usta/material) ko'ринади.
**Variантlar:**
- A) Reklamация → buyurtма + sex/uchastka + sabab kodi bilan bog'lanади — ildiz-sabab tahlил
- B) Shikоyат umumiy, sexсiz — tahlил yo'q
- C) Keyin
⤳ Ta'sир: Sifат nazorати (QC), Ишлаб chiqариш (uchastka).

### Q472. Yangi mijоz vs takror mijоz uchun har xil buyurtма oqимi
**Нима:** Yangi mijоz (ТЗ + dizайn + forma) va takror mijоz (faqat тираж) — buyurtма jarayoni har xil bo'lсинми (I-qism Q33 takror-tugmani so'rади; bu butun OQИMni ajrатади).
**Nega kerak:** Takror mijоzдан ТЗ/dizайn/forma qayta so'rаш vaqt yo'qоtади. Yangi mijоz to'lиq oqимдан o'tади, takror — qisqа oqимдан.
**Variантlar:**
- A) Ikки oqим: Yangi (to'lиq ТЗ→KB/DB→forma) ╳ Takror (eski ТЗдан, faqat тираж/sana) — tezlик + to'g'rиlik
- B) Hamма to'lиq oqимдан — sekin
- C) Keyin
⤳ Ta'sир: Konstruktор/Dizайn byurosи (takrorда chetlаб o'tилади).

### Q473. Mijоz toifаси: Yirik / Doimиy / Bir martalik / Nofaол avto-segmentация
**Нима:** I-qism Q18 ABC (xarid hajми) ni so'rади. Bu — faollик asosида (Yirik/Doimиy/Bir martalik/Nofaол) avto-toifа: oxирgi N oyда buyurtма yo'q bo'lса "Nofaол", muntazam bo'lса "Doimиy".
**Nega kerak:** ABC = pul hajми; faollик = munosabат holати. "Nofaол" mijоzга qaytariш kampaniyasi, "Doimиy"га sodiqлик imtiyozи — har xil ish.
**Variантlar:**
- A) Faollик segmentи avto (oxирgi buyurtма sanasiдан) + ABC bilan birga ikки o'lchам — boy segmentация
- B) Faqat ABC — faollик ko'ринмайди
- C) Keyin
⤳ Ta'sир: CRM, Marketинг (qaytариш kampaniyasi).

### Q474. Sotuv "oltин-ip" boshlanишi — buyurtма butun zanjırни trigger qilиши
**Нима:** Buyurtма tasdiqлangач, u avtomातик: ТЗ→KB/DB, material yetишмаса→Ta'minот (Ожд.Сырьё), reja→MPS, tayyor→Eltiб beriш, to'lов→Moliya — butun zanjırни ishга solсинми (yagona buyurtма ID bo'yicha kuzаtилади).
**Nega kerak:** Hozир bo'limlar uzилган. Buyurtма ID butun zanjırni bog'lаса, "mening buyurtмам qaйерда" savoliга yagona javob bo'lади (oltин-ip vizyoni).
**Variантlar:**
- A) Buyurtма ID = oltин-ip; har bosqич (ТЗ/material/reja/yetkazиш/to'лов) shu ID га yozилади — yagona ko'ринish
- B) Har bo'lim alohida hujjат — uzилган, izlаш qiyин
- C) Keyin
⤳ Ta'sир: BARCHA modulлar (KB/DB/Ta'minот/MPS/Eltiб beriш/Moliya).

### Q475. Yetkazиш faktи: haydovchi + mashина + vaqt buyurtмага qайд
**Нима:** Orgpolитikада "Элтиб бериш бўлими — хайдовчилар". Tayyor buyurtма yetkazılганда qaйси haydovchi/mashина olиб ketди va qachon yetib bordи — buyurtмага yozılsинми.
**Nega kerak:** "Mahsулот yetib bordiми, kim olди" savoliга javob kerak. Haydovchi+vaqt qайд bo'lса, yetkazиш isbotланади va Q99 postoplata sanog'и aniq boshlanади.
**Variантlar:**
- A) Yetkazишда haydovchi+mashина+yetkazилди vaqti qайд — isbот + postoplata sanog'и
- B) Faqat "jo'natилди" — isbоtсiz
- C) Keyin
⤳ Ta'sир: Eltiб beriш bo'limi (logistика), Q99 debitor sanog'и.

DONE: SD / Sotuv — 56.

## 7. PP / Rejalashtirish

### Q476. Texnologik karta — operatsiya ketma-ketligi
**Nima:** Har bir mahsulot uchun ishlab chiqarish bosqichlari (operatsiyalar) tartibi: masalan 10-Bichish, 20-Rilovka, 30-Bosma, 40-Tig'lash (visechka), 50-Yopishtirish, 60-Qadoqlash.
**Nega kerak:** Bo'lmasa, har buyurtmada usta o'z bilganicha ishlaydi, vaqt va xom-ashyo norma noaniq qoladi, reja tuzib bo'lmaydi.
**Variantlar:**
- A) Har operatsiya 10-lik qadam bilan raqamlanadi (10,20,30...) — orasiga yangi bosqich qo'shsa raqam buzilmaydi
- B) Oddiy 1,2,3 ketma-ketlik — sodda, lekin orasiga qo'shish qiyin
- C) Keyin — hozir kerak emas

### Q477. Texnologik karta — har operatsiyaga stanok bog'lash
**Nima:** Har operatsiya qaysi stanokda (yoki stanok guruhida) bajariladi: masalan "Bosma → Flekso-2", "Tig'lash → Bobst avtomat".
**Nega kerak:** Reja stanok bandligini hisoblashi uchun har operatsiyaning qaysi mashinaga tushishini bilishi shart.
**Variantlar:**
- A) Operatsiya bitta aniq stanokka bog'lanadi, lekin "muqobil stanok" ro'yxati ham bo'ladi (asosiy band bo'lsa muqobilga o'tadi)
- B) Faqat bitta stanok — muqobil yo'q (sodda, lekin band bo'lsa kutadi)
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (sex monitori), stanok bandligi/yuklama hisobi
  -   ↳ Agar A: Muqobil stanokda norma boshqacha bo'lsa (sekinroq) — vaqtni qaysi stanok bo'yicha hisoblaymiz? A) Aniq tanlangan stanok normasi · B) Eng tez stanok · C) O'rtacha

### Q478. Texnologik karta — operatsiya normasi (dona/soat)
**Nima:** Har operatsiya uchun ishlab chiqarish tezligi: masalan "Bosma — 4000 dona/soat", "Yopishtirish — 1500 dona/soat".
**Nega kerak:** Buyurtma necha soatda tayyor bo'lishini va stanok qachon bo'shashini shu normadan hisoblanadi.
**Variantlar:**
- A) Norma dona/soat (yoki dona/smena) sifatida saqlanadi, har operatsiyaga alohida
- B) Norma faqat butun mahsulotga (umumiy soat) — operatsiyalarga bo'linmaydi
- C) Keyin — hozir kerak emas

### Q479. Texnologik karta — tayyorlov vaqti (pereladka/setup)
**Nima:** Stanokni yangi buyurtmaga sozlash vaqti (klishe almashtirish, bo'yoq, format) — masalan "Bosma setup — 40 daqiqa", alohida ishlash normasidan tashqari.
**Nega kerak:** Mayda partiyalarda setup vaqti ishlash vaqtidan ko'p bo'lishi mumkin; rejada hisobga olinmasa muddat doim noto'g'ri chiqadi.
**Variantlar:**
- A) Har operatsiyaga ikki vaqt: setup vaqti (bir martalik, partiyaga) + ishlash normasi (dona/soat)
- B) Faqat ishlash normasi, setup normaga "qo'shib yuborilgan" deb hisoblanadi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Setup vaqti rang/klishe almashganda har xil bo'ladi — bir xil mijozning ketma-ket buyurtmalarida setup'ni qisqartiramizmi (guruhlash)? A) Ha, o'xshash ishlar ketma-ket qo'yiladi · B) Yo'q, har biriga to'liq setup

### Q480. Texnologik karta — chiqindi/brak normasi (otxod %)
**Nima:** Har operatsiyada me'yoriy yo'qotish foizi: masalan "Bosma sozlashda 150 list otxod", "Tig'lashda 3% brak".
**Nega kerak:** 10000 dona kerak bo'lsa, otxodni hisobga olib 10400 dona xom-ashyo solinishi kerak — aks holda mahsulot kam chiqadi.
**Variantlar:**
- A) Ikki xil: doimiy otxod (har sozlashda N list) + foizli otxod (% tirajdan) — ikkalasi qo'shiladi
- B) Faqat yagona umumiy foiz (masalan 5%) butun buyurtmaga
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (xom-ashyo yozib chiqarish), Moliya (tannarx)

### Q481. Texnologik karta — versiya va tasdiqlash
**Nima:** Texnologik karta o'zgarganda (norma yangilandi, bosqich qo'shildi) eski versiya saqlanadimi, kim tasdiqlaydi.
**Nega kerak:** Norma o'zgartirilsa, ilgari shu karta bo'yicha hisoblangan buyurtmalar tannarxi noto'g'ri bo'lmasligi va "kim o'zgartirdi" ko'rinishi kerak.
**Variantlar:**
- A) Versiyali: har o'zgarish yangi versiya, eski "arxiv" bo'ladi, texnolog tasdiqlaydi (status: qoralama/tasdiqlangan/arxiv)
- B) Versiyasiz: har doim oxirgi holat, eski saqlanmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat (QC), Moliya (tannarx tarixi)

### Q482. Texnologik karta — operatsiya razryadi (ishchi malakasi)
**Nima:** Har operatsiya qaysi razryadli/malakali ishchi talab qilishi: masalan "Flekso bosma — 5-razryad operator".
**Nega kerak:** Smena rejasi tuzilganda operatsiyaga mos malakali odam qo'yilishi, oylik to'g'ri hisoblanishi uchun kerak.
**Variantlar:**
- A) Har operatsiyaga minimal razryad + sertifikat (LMS kursi) talabi qo'yiladi
- B) Faqat "mas'ul kasb" nomi (operator/usta), razryad yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (razryad/malaka), Payroll (razryadli stavka), LMS (sertifikat)

### Q483. Texnologik karta — mahsulot parametrlari (karton spetsifikatsiyasi)
**Nima:** Karton mahsulotning texnik o'lchovlari kartada: format (mm×mm), karton turi/marka (masalan T-23, T-24, mikrogofra E/B/C flute), zichlik (g/m²), ranglar soni, qatlam soni.
**Nega kerak:** Aynan shu parametrlardan xom-ashyo sarfi, bosma normasi va narx kelib chiqadi; bo'lmasa har safar qaytadan so'raladi.
**Variantlar:**
- A) To'liq spetsifikatsiya maydonlari: format, flute turi, gramaj, qatlam, ranglar soni, laminatsiya bor/yo'q
- B) Faqat erkin matnli izoh (texnolog yozadi)
- C) Keyin — hozir kerak emas

### Q484. Texnologik karta — o'lchov birligi (dona/m²/kg/list)
**Nima:** Reja va norma qaysi birlikda yuritiladi: dona, kvadrat metr, kilogramm yoki bosma list.
**Nega kerak:** Karton zavodida bosma list, kesilgan zagotovka va tayyor quti — har biri boshqa birlik; aralashtirilsa hisob buziladi.
**Variantlar:**
- A) Har operatsiya o'z tabiiy birligida (bosma=list, tig'lash=dona, sotuv=dona), tizim o'tkazadi
- B) Hammasi "dona"ga keltiriladi — sodda, lekin bosma listi noto'g'ri chiqadi
- C) Keyin — hozir kerak emas

---

## B QISM — Ishlab chiqarish normalari

### Q485. Norma manbai — kim belgilaydi
**Nima:** Norma (dona/soat) qayerdan keladi: texnolog qo'lda kiritadimi, yoki tizim oxirgi smenalardagi haqiqiy natijadan hisoblaydimi.
**Nega kerak:** Qo'lda kiritilgan norma eskirib qoladi; faqat avtomatik bo'lsa, yangi mahsulotda norma yo'q. Ikkalasi kerak.
**Variantlar:**
- A) Texnolog "reja normasi" kiritadi, tizim haqiqiy o'rtachani ham ko'rsatadi (ikkisini yonma-yon — og'ish ko'rinadi)
- B) Faqat texnolog qo'lda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (haqiqiy natija), KPI

### Q486. Norma turi — vaqt yoki tezlik
**Nima:** Norma "1 dona uchun necha daqiqa" (vaqt normasi) shaklidami yoki "soatiga necha dona" (tezlik normasi) shaklidami saqlanadi.
**Nega kerak:** Ikkalasi bir narsa, lekin ustalar va hisob-kitob bittasiga ko'nikkan bo'ladi; tizimda yagona aniq tanlov bo'lishi kerak.
**Variantlar:**
- A) Asosiy — dona/soat (tezlik), tizim kerak bo'lsa daqiqa/donaga o'tkazadi
- B) Asosiy — daqiqa/dona (vaqt normasi)
- C) Keyin — hozir kerak emas

### Q487. Norma — tiraj kattaligiga bog'liqligi
**Nima:** Norma katta tirajda (50000 dona) va kichik tirajda (500 dona) bir xilmi yoki har xil pog'onali jadval bilan beriladi.
**Nega kerak:** Kichik tirajda setup ulushi katta, dona/soat samaradorligi pasayadi; bir xil norma qo'yilsa kichik buyurtma muddati noto'g'ri chiqadi.
**Variantlar:**
- A) Setup alohida + barqaror ishlash normasi — kichik tiraj avtomatik sekinroq chiqadi (eng to'g'ri)
- B) Tiraj oralig'iga qarab pog'onali norma jadvali (0-1000 / 1000-10000 / 10000+)
- C) Keyin — hozir kerak emas

### Q488. Norma — material/dizaynga bog'liqligi
**Nima:** Norma material turiga (qalin gofrokarton sekinroq), ranglar soniga (4+0 vs 4+4 bosma), laminatsiya bor-yo'qligiga qarab o'zgaradimi.
**Nega kerak:** Aks holda murakkab mahsulotga oddiy mahsulot normasi qo'yiladi va muddat doim kechikadi.
**Variantlar:**
- A) Norma operatsiya + asosiy parametr (rang soni / flute / laminatsiya) kombinatsiyasiga bog'lanadi
- B) Faqat operatsiyaga — parametrlar hisobga olinmaydi
- C) Keyin — hozir kerak emas

### Q489. Norma bajarilishi — foiz va rag'bat
**Nima:** Smena oxirida "norma bajarildimi" foizi (haqiqiy / reja × 100) hisoblanib, ishchi oyligiga ta'sir qiladimi.
**Nega kerak:** Reja-fakt og'ishni ishchi darajasida ko'rsatadi va rag'batlantirish/jarima asosini beradi.
**Variantlar:**
- A) Har smena norma % hisoblanadi, KPIga kiradi; bonus/jarima qoidasi alohida belgilanadi
- B) Faqat ko'rsatkich sifatida ko'rinadi, oylikka ta'sir qilmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Payroll (bonus), KPI

---

## C QISM — Stanoklar ro'yxati va quvvati

### Q490. Stanok kartasi — asosiy maydonlar
**Nima:** Har stanok uchun saqlanadigan ma'lumot: kod, nom, turi (bosma/tig'lash/yopishtirish/gofroagregat), bo'lim, soatlik quvvat, soatlik xarajat, holati (ishlaydi/ta'mirda/bo'sh).
**Nega kerak:** Reja stanok bandligini va tannarxni shu kartadan oladi; tizimda allaqachon kod/nom/tur/quvvat/soatlik-xarajat/bo'lim bor — ro'yxatni to'liq qilish kerak.
**Variantlar:**
- A) Yuqoridagi to'liq karta + ishga tushgan yili, ishlab chiqaruvchi, format chegarasi (max kenglik/uzunlik)
- B) Faqat kod, nom, tur, quvvat — qolganini keyin
- C) Keyin — hozir kerak emas

### Q491. Stanok quvvati — birlik va o'lchov
**Nima:** Stanok quvvati qanday o'lchanadi: soatiga necha dona, yoki soatiga necha list, yoki "kuniga 8 soat × N dona".
**Nega kerak:** Quvvat birligi norma birligi bilan bir xil bo'lishi shart, aks holda yuklama foizi noto'g'ri chiqadi.
**Variantlar:**
- A) Quvvat = mavjud ish soati (smena × soat), aniq dona-tezlik esa har mahsulot normasidan keladi
- B) Quvvat to'g'ridan-to'g'ri dona/soat sifatida (faqat bir xil mahsulot uchun to'g'ri)
- C) Keyin — hozir kerak emas

### Q492. Stanok — ishlash jadvali (smena/soat)
**Nima:** Har stanok kuniga necha smena, smenada necha soat ishlaydi (masalan gofroagregat 3 smena 24 soat, tig'lash 2 smena 16 soat).
**Nega kerak:** Mavjud quvvatni (kunlik soat) shu jadvaldan hisoblanadi; bo'lmasa rejada "24 soat ishlaydi" deb noto'g'ri taxmin qilinadi.
**Variantlar:**
- A) Har stanokka ish kalendari: hafta kunlari + smenalar + soat; bayram/dam olish hisobga olinadi
- B) Hamma stanok uchun yagona zavod jadvali
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Smena rejasi, HR (tabel)

### Q493. Stanok — rejali to'xtash (PM/ta'mir)
**Nima:** Stanokning rejali profilaktika/ta'mir vaqtlari kalendarga kiritiladimi (masalan har oy 4 soat profilaktika).
**Nega kerak:** Reja shu vaqtni "band" deb belgilashi kerak, aks holda buyurtma ta'mir kuniga rejalashtiriladi va kechikadi.
**Variantlar:**
- A) Rejali to'xtashlar kalendarda; reja ularni bo'sh quvvatdan chiqarib tashlaydi
- B) Faqat haqiqiy buzilganda qo'lda belgilanadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: IoT/MES (texnik holat), Ombor (zapchast)

### Q494. Stanok — format/o'lcham cheklovi
**Nima:** Har stanokning maksimal/minimal ish formati (masalan max list 1400×1000 mm, min 200×150 mm).
**Nega kerak:** Reja buyurtma formatini stanokka sig'masa, uni o'sha stanokka qo'ymasligi kerak (avtomatik ogohlantirish).
**Variantlar:**
- A) Max va min format saqlanadi; reja mos kelmasa boshqa stanok taklif qiladi yoki ogohlantiradi
- B) Format cheklovi yo'q — usta o'zi qaraydi
- C) Keyin — hozir kerak emas

### Q495. Stanok — OEE / samaradorlik koeffitsienti
**Nima:** Har stanokning real samaradorligi (OEE yoki oddiy koeffitsient): pasport quvvati × koeffitsient = real quvvat (masalan eski stanok 0.75).
**Nega kerak:** Yangi va eski stanok bir xil quvvatda emas; reja real koeffitsient bilan hisoblamasa muddatlar optimistik chiqadi.
**Variantlar:**
- A) Har stanokka samaradorlik koeffitsienti (haqiqiy natijadan yangilanadi); reja shuni qo'llaydi
- B) Hamma stanok pasport quvvati bo'yicha 100% deb olinadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (haqiqiy), KPI/Reports (OEE)
  - 📌 Eslatma: tizimda CRP `efficiency_rate` ustuni bilan bog'liq muammo bor edi — bu maydon kartaga rasman kiritilishi kerak

### Q496. Stanok — parallel mashinalar (bir turdan bir nechta)
**Nima:** Bir xil ishni bajaradigan bir nechta stanok bo'lsa (2 ta flekso, 3 ta tig'lash) — reja ularni guruh sifatida ko'radimi yoki har birini alohida.
**Nega kerak:** Yuklama bir stanokka emas, guruhga taqsimlansa muddat qisqaradi va balanslanadi.
**Variantlar:**
- A) Stanok guruhi tushunchasi: reja guruh ichida eng bo'sh mashinaga avtomatik beradi
- B) Har stanok alohida, taqsimlashni usta qo'lda qiladi
- C) Keyin — hozir kerak emas

---

## D QISM — Reja-fakt og'ishi

### Q497. Reja-fakt — qaysi darajada o'lchanadi
**Nima:** Reja va haqiqat farqi qaysi kesimda ko'riladi: buyurtma bo'yicha, stanok bo'yicha, smena bo'yicha, ishchi bo'yicha.
**Nega kerak:** Faqat umumiy raqam "zavod 92% bajardi" deganda muammo qayerdaligi ko'rinmaydi; kesim kerak.
**Variantlar:**
- A) To'rt kesim ham: buyurtma / stanok / smena / ishchi — drill-down bilan
- B) Faqat buyurtma darajasida
- C) Keyin — hozir kerak emas

### Q498. Reja-fakt — nimani solishtiramiz
**Nima:** Og'ish nima bo'yicha: miqdor (reja 10000 / fakt 9600), vaqt (reja 6 soat / fakt 8 soat), muddat (reja 5-iyun / fakt 7-iyun), tannarx.
**Nega kerak:** Har biri boshqa muammoni ko'rsatadi (miqdor=brak, vaqt=norma, muddat=rejalashtirish, tannarx=pul); birini o'lchab boshqasi yashirin qoladi.
**Variantlar:**
- A) To'rttasi ham: miqdor, vaqt, muddat, tannarx og'ishi alohida ko'rsatkich
- B) Faqat miqdor og'ishi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (tannarx og'ishi), KPI

### Q499. Reja-fakt — og'ish sababi (kodli)
**Nima:** Reja bajarilmaganda sababi kodli ro'yxatdan tanlanadimi: stanok buzildi, xom-ashyo yetmadi, brak chiqdi, ishchi yo'q, klishe kech keldi, elektr o'chdi.
**Nega kerak:** Sababsiz og'ish faqat "yomon" deydi; kodli sabab eng ko'p takrorlanadigan muammoni ko'rsatadi va tuzatishga yo'naltiradi.
**Variantlar:**
- A) Majburiy kodli sabab ro'yxati (yuqoridagilar + "boshqa+izoh") — og'ish bo'lsa to'ldiriladi
- B) Erkin matnli izoh
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (sex jurnali), Texnik xizmat, Sifat

### Q500. Reja-fakt — chegara va signal
**Nima:** Og'ish necha foizdan oshsa avtomatik signal (rahbarga xabar) chiqadi: masalan miqdor og'ishi >5%, muddat kechikishi >1 kun.
**Nega kerak:** Kichik og'ishlar normal; faqat chegaradan oshganida e'tibor talab qilinadi — aks holda ogohlantirish ko'pligidan e'tibordan chiqadi.
**Variantlar:**
- A) Har ko'rsatkichga sozlanadigan chegara (foiz/kun) + chegaradan oshsa avtomatik bildirishnoma
- B) Chegarasiz — faqat hisobotda ko'rinadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Bildirishnoma/Telegram, Koordinatsiya

### Q501. Reja-fakt — yopish vaqti (kunlik/smenali yangilanish)
**Nima:** Haqiqiy natija qachon kiritiladi: real vaqtda (MES skaner), smena oxirida usta hisobotida, yoki kun oxirida.
**Nega kerak:** Reja-fakt qancha kech yangilansa, shuncha kech tuzatiladi; smena oxiri minimal, real vaqt ideal.
**Variantlar:**
- A) Smena oxirida majburiy hisobot (usta) + iloji bo'lsa MES real vaqt — ikkisi birlashadi
- B) Faqat kun oxirida bitta hisobot
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES, Smena hisoboti

---

## E QISM — Parallel buyurtmalar ustuvorligi

### Q502. Ustuvorlik — asosiy mezon
**Nima:** Bir vaqtda ko'p buyurtma navbatda turganda qaysi avval bajariladi: muddat (deadline) bo'yichami, mijoz darajasi bo'yichami, summa bo'yichami.
**Nega kerak:** Aniq qoidasiz har kuni usta yoki rahbar qo'lda hal qiladi, bu nizo va kechikishlarga olib keladi.
**Variantlar:**
- A) Asosiy mezon — eng yaqin muddat (kim oldin yetkazib berilishi kerak); teng bo'lsa mijoz darajasi
- B) Asosiy mezon — mijoz darajasi (VIP avval)
- C) Keyin — hozir kerak emas

### Q503. Ustuvorlik — daraja qiymatlari
**Nima:** Buyurtmaga ustuvorlik qanday belgilanadi: 1-5 raqam, yoki "shoshilinch/yuqori/oddiy/past" so'zlari, yoki "A/B/C".
**Nega kerak:** Tizimda yagona aniq qiymatlar bo'lishi kerak, har bo'lim har xil atamasa.
**Variantlar:**
- A) To'rt daraja: Shoshilinch / Yuqori / Oddiy / Past — har biriga rang
- B) 1-10 raqamli ball
- C) Keyin — hozir kerak emas

### Q504. Ustuvorlik — kim o'zgartira oladi
**Nima:** Buyurtma ustuvorligini (navbatdan oldinga olib chiqish) kim o'zgartirishga haqli: faqat ishlab chiqarish boshlig'i, sotuv menejeri, yoki direktor.
**Nega kerak:** Har kim navbatni buzsa reja ma'nosini yo'qotadi; o'zgarish jurnalga yozilishi kerak.
**Variantlar:**
- A) Faqat ishlab chiqarish boshlig'i + direktor; har o'zgarish sabab bilan jurnalga yoziladi
- B) Sotuv menejeri ham o'z mijozini ko'tarib qo'ya oladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Audit jurnali, Sotuv (SD)

### Q505. Ustuvorlik — boshlangan ishni uzib qo'yish (preemption)
**Nima:** Shoshilinch buyurtma kelganda stanokda ketayotgan ish to'xtatilib, shoshilinchi qo'yiladimi yoki joriy ish tugatiladimi.
**Nega kerak:** Uzib qo'yish setup vaqtini ikki marta sarflaydi va brak xavfini oshiradi; lekin ba'zan VIP uchun zarur. Qoida kerak.
**Variantlar:**
- A) Joriy ish tugatiladi, shoshilinchi keyingi bo'sh joyga qo'yiladi (faqat direktor "uz" desa uziladi)
- B) Shoshilinch doim joriy ishni uzadi
- C) Keyin — hozir kerak emas

### Q506. Ustuvorlik — umumiy stanok uchun kelishuv
**Nima:** Ikki buyurtma bir xil stanokni (masalan yagona laminator) talab qilsa, kim avval kirishini tizim avtomatik hal qiladimi yoki signal beradimi.
**Nega kerak:** "Tor joy" (bottleneck) stanok — eng ko'p nizo shu yerda; aniq qoida bo'lsa avtomatik taqsimlanadi.
**Variantlar:**
- A) Tizim ustuvorlik+muddat bo'yicha avtomatik navbat qo'yadi, to'qnashuvni rahbarga ko'rsatadi
- B) Har safar usta qo'lda hal qiladi
- C) Keyin — hozir kerak emas

### Q507. Ustuvorlik — qisman bajarish (split)
**Nima:** Katta buyurtmani bo'lib, bir qismini avval (mijozga shoshilinch yetkazish uchun), qolganini keyin ishlab chiqarish mumkinmi.
**Nega kerak:** Mijoz 50000 dan 10000 ni tezroq olishni so'rasa, butun buyurtma tugashini kutmasdan qisman jo'natish mumkin bo'ladi.
**Variantlar:**
- A) Buyurtmani partiyalarga bo'lish mumkin; har partiya o'z muddati va statusiga ega
- B) Buyurtma yaxlit — bo'linmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: SD (qisman yetkazish), Ombor (qisman chiqim)

---

## F QISM — Xom-ashyo zaxira nuqtasi (MRP / qayta buyurtma)

### Q508. Zaxira nuqtasi — qayta buyurtma chegarasi (reorder point)
**Nima:** Har asosiy xom-ashyo (gofrokarton rulon, bo'yoq, yelim, klishe) uchun "shu miqdordan pasaysa — buyurtma ber" chegarasi.
**Nega kerak:** Chegarasiz xom-ashyo to'satdan tugaydi va liniya to'xtaydi; chegara bilan oldindan buyurtma beriladi.
**Variantlar:**
- A) Har materialga reorder point + minimal zaxira; pasaysa avtomatik ta'minot so'rovi yaratiladi
- B) Faqat qo'lda kuzatuv (omborchi qaraydi)
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor, Ta'minot/Xarid (purchase request)

### Q509. Zaxira nuqtasi — yetkazib berish muddati (lead time)
**Nima:** Har material uchun ta'minotchidan kelishi necha kun (gofrokarton 3 kun, import bo'yoq 20 kun) — chegarani hisoblashda ishlatiladi.
**Nega kerak:** Lead time uzoq bo'lsa zaxira nuqtasi baland bo'lishi kerak; aks holda buyurtma berilganda ham kech qoladi.
**Variantlar:**
- A) Har materialga lead time (kun) saqlanadi; reorder point = kunlik sarf × lead time + zaxira
- B) Hamma uchun yagona o'rtacha muddat
- C) Keyin — hozir kerak emas

### Q510. Zaxira nuqtasi — buyurtma kelganda yetishmaslikni ko'rsatish (ATP)
**Nima:** Yangi buyurtma qabul qilinayotganda tizim "bu buyurtmaga xom-ashyo yetadimi" deb tekshirib, yetmasa ogohlantiradimi.
**Nega kerak:** Sotuvchi muddat va'da bermasdan oldin xom-ashyo borligini bilishi kerak; bo'lmasa va'da berib bajarilmaydi.
**Variantlar:**
- A) Buyurtma kiritishda avtomatik xom-ashyo va quvvat tekshiruvi (ATP) — yetmasa qizil ogohlantirish + taxminiy sana
- B) Tekshiruv yo'q, keyin omborchi aniqlaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: SD (sotuv va'dasi), Ombor

### Q511. Zaxira nuqtasi — material rezervlash (allokatsiya)
**Nima:** Buyurtma tasdiqlangach, unga kerakli xom-ashyo omborda "band" deb belgilanadimi (boshqa buyurtma ololmaydi).
**Nega kerak:** Rezerv bo'lmasa, ikki buyurtma bir partiya kartonni hisoblaydi, biri ishga tushganda material yetmay qoladi.
**Variantlar:**
- A) Tasdiqlangan buyurtmaga material rezervlanadi; "erkin qoldiq" = umumiy − rezerv ko'rsatiladi
- B) Rezerv yo'q — faqat ishga tushganda yozib chiqariladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (erkin qoldiq), MRP

### Q512. Zaxira nuqtasi — yarim tayyor mahsulot (zagotovka)
**Nima:** Bichilgan/bosilgan, lekin hali yopishtirilmagan oraliq mahsulot (zagotovka) ham zaxira sifatida hisoblanadimi va kerak bo'lganda ishlatiladimi.
**Nega kerak:** Karton zavodida tayyor zagotovka bor bo'lsa, butun siklni qaytadan boshlamasdan tezroq buyurtma bajariladi.
**Variantlar:**
- A) Yarim tayyor mahsulot alohida zaxira; reja avval shuni ishlatadi, keyin xom-ashyoga o'tadi
- B) Faqat xom-ashyo va tayyor mahsulot hisoblanadi, oraliq yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (yarim tayyor ombori), WMS

### Q513. Zaxira nuqtasi — partiyalik (lot) hisobi
**Nima:** Xom-ashyo partiyali (rulon nomeri, ishlab chiqarilgan sana) hisoblanadimi va eski partiya avval ishlatiladimi (FIFO).
**Nega kerak:** Bo'yoq/yelim eskirsa sifat tushadi; partiya tartibsiz ishlatilsa eski qolib ketadi va isrof bo'ladi.
**Variantlar:**
- A) Partiyali (lot) hisob + FIFO/muddat bo'yicha avtomatik tavsiya; muddati o'tganni bloklaydi
- B) Partiyasiz — umumiy miqdor
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat (partiya iz), Ombor (FIFO)

### Q514. Zaxira nuqtasi — mavsumiy/o'zgaruvchan sarf
**Nima:** Reorder point doimiymi yoki sarf o'sganda (mavsum, yirik shartnoma) avtomatik ko'tariladimi.
**Nega kerak:** Doimiy chegara yuqori talab davrida kech qoladi; sarf o'rtachasidan hisoblansa moslashadi.
**Variantlar:**
- A) Reorder point oxirgi 1-3 oy o'rtacha sarfidan davriy qayta hisoblanadi
- B) Qo'lda belgilangan doimiy chegara
- C) Keyin — hozir kerak emas

---

## G QISM — Smena rejasi

### Q515. Smena rejasi — tuzilishi va birligi
**Nima:** Smena rejasi nima darajada: har smenaga (1-smena/2-smena/3-smena) qaysi stanokda qaysi buyurtma, qaysi ishchi.
**Nega kerak:** Bo'lmasa har kuni og'zaki taqsimlanadi, mas'uliyat noaniq, reja-fakt o'lchanmaydi.
**Variantlar:**
- A) Smena × stanok × buyurtma × ishchi jadvali (kim, qayerda, nimani) — har smena boshida tayyor
- B) Faqat smena × buyurtma (ishchini usta o'zi taqsimlaydi)
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (tabel), MES (smena topshirig'i)

### Q516. Smena rejasi — smena turlari va vaqti
**Nima:** Smenalar qanday: 2 smena (08-20 / 20-08) yoki 3 smena (08-16 / 16-24 / 24-08), tushlik tanaffusi soatlari.
**Nega kerak:** Quvvat hisobi va ishchi tabeli aniq smena vaqtidan kelib chiqadi; har stanokda smena soni har xil bo'lishi mumkin.
**Variantlar:**
- A) Sozlanadigan smena shablonlari (2-smenali / 3-smenali) + tanaffus; har bo'limga moslanadi
- B) Yagona qat'iy smena jadvali butun zavodga
- C) Keyin — hozir kerak emas

### Q517. Smena rejasi — ishchini bog'lash va malaka tekshiruvi
**Nima:** Smenaga ishchi qo'yilganda uning shu stanok/operatsiyaga malakasi (razryad, sertifikat) tekshiriladimi.
**Nega kerak:** Malakasiz ishchi murakkab stanokka qo'yilsa brak va xavfsizlik muammosi; tizim ogohlantirishi kerak.
**Variantlar:**
- A) Ishchi malakasi operatsiya talabiga solishtiriladi; mos kelmasa ogohlantirish (lekin usta bloklamasligi mumkin)
- B) Tekshiruvsiz — usta o'zi mas'ul
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (malaka), LMS (sertifikat), Q7

### Q518. Smena rejasi — yo'qlik va o'rin almashish
**Nima:** Rejalashtirilgan ishchi kelmasa (kasal, ta'til), tizim zaxira/almashtiruvchi taklif qiladimi yoki bo'sh qoladimi.
**Nega kerak:** Bir kishi kelmasa butun smena to'xtamasligi uchun avtomatik almashish kerak; aks holda buyurtma kechikadi.
**Variantlar:**
- A) Yo'qlik belgilansa, tizim shu malakali bo'sh ishchini taklif qiladi (usta tasdiqlaydi)
- B) Qo'lda — usta o'zi topadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (ta'til/kasallik), Tabel

### Q519. Smena rejasi — smena topshirig'i (peresmenka)
**Nima:** Smena tugaganda keyingi smenaga "qaysi buyurtmada qaergacha yetildi, stanok holati, qolgan ish" topshiriladimi (smenadan-smenaga uzatish).
**Nega kerak:** Bo'lmasa keyingi smena qaytadan boshlaydi yoki sozlamani buzadi; uzluksizlik yo'qoladi.
**Variantlar:**
- A) Har smena oxirida elektron topshiriq (qoldiq miqdor, stanok holati, izoh) — keyingi smena ko'radi
- B) Og'zaki — tizimda yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: MES (smena jurnali)

### Q520. Smena rejasi — ortiqcha ish (avariya/qo'shimcha smena)
**Nima:** Reja sig'masa qo'shimcha smena yoki ish vaqtini uzaytirish (sverxurochniy) rejaga kiritiladimi va oylikka ta'sir qiladimi.
**Nega kerak:** Yuklama quvvatdan oshganda yagona yo'l — qo'shimcha vaqt; lekin u qimmat va tabel/oylikka ta'sir qiladi.
**Variantlar:**
- A) Qo'shimcha smena alohida belgilanadi, koeffitsient bilan oylikka o'tadi (rahbar tasdig'i bilan)
- B) Faqat asosiy smena — qo'shimcha ish hisobga olinmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Payroll (sverxurochniy stavka), Tabel

### Q521. Smena rejasi — kunlik nazorat ko'rsatkichi
**Nima:** Smena oxirida avtomatik chiqadigan ko'rsatkichlar: norma %, brak %, stanok bo'sh turish vaqti, ishlab chiqarilgan dona.
**Nega kerak:** Rahbar ertalab bir qarashda kechagi smena qanday ketganini ko'rishi va muammoga ta'sir qilishi kerak.
**Variantlar:**
- A) Avtomatik smena dashboardi (norma%, brak%, prostoy, dona, eng yomon stanok)
- B) Faqat dona soni
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: KPI/Reports, MES

---

## H QISM — Reja gorizonti, qayta rejalash va chetki holatlar

### Q522. Reja gorizonti — qancha oldinga
**Nima:** Ishlab chiqarish rejasi necha kun/hafta oldinga tuziladi: kunlik, haftalik yoki oylik gorizont.
**Nega kerak:** Juda qisqa gorizont xom-ashyoni oldindan tayyorlashga imkon bermaydi; juda uzun — doim o'zgarib turadi va ishonchsiz.
**Variantlar:**
- A) Ikki daraja: aniq haftalik reja (qatib qolgan) + taxminiy oylik (xom-ashyo uchun)
- B) Faqat kunlik reja
- C) Keyin — hozir kerak emas

### Q523. Qayta rejalash — qachon va qanchalik tez-tez
**Nima:** Reja qachon qayta hisoblanadi: har yangi buyurtmada darrov, har kun ertalab, yoki faqat qo'lda.
**Nega kerak:** Har o'zgarishda darrov qayta hisoblansa reja beqaror (har soat o'zgaradi); juda kam bo'lsa eskirgan; muvozanat kerak.
**Variantlar:**
- A) Avtomatik kunlik qayta rejalash (kechasi) + shoshilinch o'zgarishda qo'lda qayta hisoblash tugmasi
- B) Faqat qo'lda, rahbar bosganda
- C) Keyin — hozir kerak emas

### Q524. Reja qotirish (frozen window)
**Nima:** Bugun/ertaga ishga tushgan buyurtmalar "qotirilgan" deb belgilanib, qayta rejalash ularni surib qo'ymaydimi.
**Nega kerak:** Stanokda sozlanib turgan ishni tizim avtomatik boshqa kunga surса, sex ishi izdan chiqadi; yaqin kunlar barqaror bo'lishi kerak.
**Variantlar:**
- A) Yaqin N kun (masalan 1-2 kun) "qotirilgan" — faqat qo'lda o'zgartiriladi, avtomatik tegmaydi
- B) Qotirish yo'q — hammasi avtomatik qayta tuziladi
- C) Keyin — hozir kerak emas

### Q525. Buyurtma statuslari (ishlab chiqarish hayotiy sikli)
**Nima:** Ishlab chiqarish buyurtmasi qanday statuslardan o'tadi: Reja → Tasdiqlangan → Ishga tushgan → Jarayonda → Sifatda → Tugadi → Yopildi (+ Bekor/To'xtatilgan).
**Nega kerak:** Aniq statuslarsiz "buyurtma qayerda" degan savolga javob yo'q; har bo'lim boshqacha aytadi; hisobot tuzib bo'lmaydi.
**Variantlar:**
- A) Yuqoridagi to'liq status ro'yxati + har o'tish kim/qachon (jurnal) bilan
- B) Sodda 3 status: Yangi / Jarayonda / Tugadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: SD, MES, Sifat, Ombor (har biri statusga reaksiya qiladi)

### Q526. Buyurtmani bekor qilish/to'xtatish
**Nima:** Ishga tushgan buyurtma bekor qilinsa yoki to'xtatilsa (mijoz voz kechdi), allaqachon sarflangan xom-ashyo va yarim tayyor mahsulot nima bo'ladi.
**Nega kerak:** Bekor qilish ko'pincha pul (sarflangan material) bilan bog'liq; kim to'laydi va material qayerga qaytadi — qoida kerak.
**Variantlar:**
- A) Bekor qilishda sarflangan material/ish "yo'qotish" sifatida yoziladi, yarim tayyor ombor zaxirasiga o'tadi; sabab majburiy
- B) Shunchaki o'chiriladi, hisob yuritilmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (yo'qotish), Ombor, SD

### Q527. Buyurtma birlashtirish/guruhlash (gang run)
**Nima:** Bir xil karton/formatdagi mayda buyurtmalar bitta bosma listga birlashtirilib (gang run) birga bosiladimi.
**Nega kerak:** Karton zavodida bir listga bir nechta mayda ish joylashtirish xom-ashyo va setupни tejaydi; lekin reja buni qo'llab-quvvatlashi kerak.
**Variantlar:**
- A) Mos buyurtmalarni bitta bosma topshiriqqa birlashtirish mumkin; har biri keyin alohida ajraladi
- B) Har buyurtma alohida bosiladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Dizayn (montaj), Ombor (sarf taqsimoti)

---

## I QISM — Kitob-grounded YANGI savollar (real fabrika Excel + RD5 yo'riqnoma)

> Manba: D:/kitob real hujjatlar — `Bandlik.xlsx` (bo'lim+norma+pragon), `ketgan kun.xlsx` (algoritm turi 2-8 bo'lim, yo'nalish ofs/flx, priladka soat, papka №), `25-04.xlsx` (zakaz varaqasi: План/Факт выработка, Брак, смена ден/ноч, Оператор/Помошник, Очеред=navbat, Формат листа/гофро, Кашировка, Используемые материалы, Менеджер, ЗАРУР ЗАКАЗЛАР), `Iyun ishchilar.xlsx` (operator norma %), `Kichik buyurtmalar.xlsx` (kichiklashgan %, foyda dona/kg, razmer eski/yangi); RD5 (техкарта 6 element, lab→техкарта tasdiqlash, "сифат режадан устун", brak→butun partiya qayta ishlash). Quyidagilar A-H qismdan FARQLI — real hujjat maydonlariga asoslangan.

### Q528. "Очеред" (navbat raqami) — stanok ichidagi rasmiy navbat o'rni
**Nima:** `25-04.xlsx` da har stanok ustunida "Очеред" / "Очеред2" bor — buyurtma o'sha stanokda nechanchi navbatda turishini ko'rsatadi (kalendar sana emas, navbat raqami).
**Nega kerak:** Bu zavodning haqiqiy tili — operatorlar "navbat" bilan ishlaydi. A-H qismdagi ustuvorlik (Q27-Q32) "kim avval" qoidasini beradi, lekin har stanokdagi aniq navbat O'RNI (raqam) ni emas.
**Variantlar:**
- A) Har stanok uchun ko'rinadigan navbat raqami (1,2,3...), drag-drop bilan qayta tartiblanadi — operator ko'radigani shu
- B) Faqat ichki ustuvorlik balli, ko'rinadigan navbat raqami yo'q — "shu stanokda 3-chi" yo'qoladi
- C) Keyin
⤳ Ta'sir: MES sex tableti, CRP yuklama tartibi.

### Q529. "Algoritm turi" (2 ta bo'lim ... 8 ta bo'lim) — marshrut murakkablik sinfi
**Nima:** `ketgan kun.xlsx` buyurtmalarni "Algoritm turi": 2 ta bo'lim / 3 ta bo'lim ... 8 ta bo'lim deb tasniflaydi — qancha bo'limdan o'tishi.
**Nega kerak:** Bu bor sinflashni tizim saqlasa, narx/muddat avtomatik bog'lanadi va statistika ("8-bo'limli ishlar ko'p kechikadi") chiqadi. Texkarta marshruti (Q1) bor, lekin bu marshrutni SINFGA (2-8) jamlash yo'q.
**Variantlar:**
- A) Tizim marshrutdan bo'lim sonini avtomatik chiqaradi va "algoritm turi" sifatida belgilaydi (filtr/statistika/narx) — eski tasnifga mos
- B) Faqat marshrut bor, bo'lim soni tasnifi yo'q — statistika qiyin
- C) Keyin

### Q530. "Yo'nalish" (ofs кар / ofs gof / flx gof) — texnologiya yo'li tanlash
**Nima:** `ketgan kun.xlsx` "Yo'nalishlar": ofs kar (ofset karton), ofs gof (ofset gofra), flx gof (flekso gofra) — mahsulotning asosiy ishlab chiqarish yo'li.
**Nega kerak:** Bir karobka 2 yo'l bilan chiqishi mumkin (ofset/flekso) — narx/muddat/sifat farqi. Bu eng birinchi tanlov; texkarta (Q1) buni o'zida nazarda tutadi-yu, alohida MASTER tanlov sifatida ajratilmagan.
**Variantlar:**
- A) Yo'nalish buyurtma ochilishida tanlanadi (ofs-kar/ofs-gof/flx-gof); marshrut, narx, material shunga qarab to'ladi — bitta master tanlov
- B) AI yo'nalishni tiraj+o'lcham bo'yicha tavsiya qiladi, planlovchi tasdiqlaydi
- C) Keyin
⤳ Ta'sir: Savdo (narx), MRP (material), stanok tanlash.

### Q531. "Кашировка" (2-qatlam yopishtirish) — ofset-gofra oraliq bosqich
**Nima:** `25-04.xlsx`/`Bandlik.xlsx`: "Кашировка / Koshirofka" — bosilgan ofset listni gofra qatlamiga yopishtirish; faqat "ofs gof" yo'nalishida bor.
**Nega kerak:** Bu maxsus oraliq bosqich faqat ofset-gofra mahsulotda. Marshrut buni yo'nalishga qarab avtomatik qo'shishi kerak, aks holda mahsulot chiqmaydi yoki ortiqcha bosqich rejani shishiradi.
**Variantlar:**
- A) Koshirofka marshrutda alohida bosqich, faqat ofset-gofra yo'nalishida avtomatik qo'shiladi — to'g'ri
- B) Planlovchi qo'lda qo'shadi — unutilishi mumkin
- C) Keyin

### Q532. "Используемые материалы" — texkarta material spetsifikatsiyasi (BOM) struktura
**Nima:** `25-04.xlsx`: har zakazda "Используемые материалы" + "2х слой / Профиль ГК / размер" — qaysi karton/gofra ishlatilishi (hozir matn).
**Nega kerak:** F qism MRP/reorder/ATP (Q33-Q39) MATERIAL borligini tekshiradi, lekin har buyurtmaning aniq material RO'YXATI (BOM) qayerdan kelishini belgilamaydi. BOM strukturalanmasa MRP ishlamaydi.
**Variantlar:**
- A) Texkartada BOM jadvali: material kodi + miqdor (kg/list) + qatlam (2-sloy/profil/mikro turi) — MRP/ATP shundan o'qiydi
- B) Material erkin matn — o'qib bo'lmaydi
- C) Keyin
⤳ Ta'sir: MRP (F qism), Ombor zaxira, narx (Savdo).

### Q533. Texkarta 6 element — kitobdagi aniq tarkib
**Nima:** RD5 техкарта ta'rifi: «материал тури, босма параметрлари, кесим, қолип, қўшимча ишловлар ва иш тартиби».
**Nega kerak:** A qism texkartani (operatsiya, stanok, norma, setup, spec) qamraydi, lekin egasining kitobdagi 6-blokli STRUKTURASIni (ayniqsa "босма параметрлари" — rang profili/registr, va "қолип") aniq nomlamaydi.
**Variantlar:**
- A) Texkarta sarlavhalari kitob bilan bayt-ma-bayt: material turi / bosma parametrlari (rang soni+profil+registr+plotnost) / kesim / qolip / qo'shimcha ishlovlar / ish tartibi — egasi tilida
- B) Faqat A qismdagi texnik maydonlar, kitob strukturasiga moslanmaydi
- C) Keyin

### Q534. Texkartani lab tasdiqlasinmi (kompozitsiya bo'yicha) — reja gate
**Nima:** RD5: «ҳар бир тех картани композицияси бўйича тасдиқлаб бериш» + «Лаборант граммаж ўлчовини... техкарта параметрлари тасдиқланди»; namlik meyordan baland → rulon liniyaga qo'yilmaydi.
**Nega kerak:** Q6 texkarta versiyasini TEXNOLOG tasdiqlaydi; lekin egasi modelida LAB ham har texkartani kompozitsiya bo'yicha tasdiqlaydi (granmaj/namlik). Bu alohida gate.
**Variantlar:**
- A) Texkartada "lab tasdig'i" majburiy gate — tasdiqsiz reja ishga tushmaydi; material partiyasi namlik/granmaj meyordan tashqari → o'sha partiyaga reja bloklanadi
- B) Lab faqat ogohlantiradi, gate emas — egasi modeliga zid
- C) Keyin
⤳ Ta'sir: Sifat (QC), Ombor (partiya o'lchovi), brak oldini olish.

### Q535. "План.выработка / Факт.выработка / Остал.сд-ть" — smena darajasida reja-fakt kiritish
**Nima:** `25-04.xlsx`: "Плановая выработка" (smena reja chiqim) ╳ "Факт. выработка" ╳ "Остал. сд-ть" (qolgan bajariladigan) ╳ "Брак сони".
**Nega kerak:** Q22-Q26 reja-fakt KESIMI va sababini beradi, lekin operator har smenada AYNAN nima kiritishini (reja/fakt/qolgan/brak 4 raqam) hujjat maydoni sifatida aniqlamaydi.
**Variantlar:**
- A) Har smena yopilishida 4 raqam kiritiladi: reja / fakt / qolgan / brak — yoki MES avtomatik; kunlik reja-fakt shundan
- B) Faqat fakt dona — qolgan/brak alohida emas, og'ish to'liqsiz
- C) Keyin
⤳ Ta'sir: Reja-fakt (D qism), operator KPI, qayta-chiqarish (Q63).

### Q536. "Оператор + Помошник" — stanokda 2 kishi biriktirish
**Nima:** `25-04.xlsx` har ishda "Оператор:" va "Помошник:" maydoni — stanokda operator + yordamchi ishlaydi.
**Nega kerak:** Q40/Q42 smenaga ISHCHI biriktiradi, lekin bir slotga IKKI rol (operator+yordamchi) biriktirishni va fakt chiqimni ikkisiga hisoblashni qamramaydi.
**Variantlar:**
- A) Har slotga operator + yordamchi (ikki alohida rol); fakt/norma ikkisiga ham hisoblanadi — KPI to'g'ri
- B) Faqat operator yoziladi, yordamchi yo'q — KPI to'liqsiz
- C) Keyin
⤳ Ta'sir: HR norma % (Iyun ishchilar.xlsx), oylik.

### Q537. "Брак сони" → kerakli tirajni qayta hisoblab, qayta-chiqarish vazifasi
**Nima:** `25-04.xlsx` "Брак сони" + RD5: brak → «бутун партияни қайта ишлашга ва ишлаб чиқариш режасининг бузилишига».
**Nega kerak:** Q5 brak NORMASINI (oldindan reja zaxirasi) beradi, lekin brak HAQIQATDA chiqqanda yetishmovchilikni qoplash uchun qayta-chiqarish vazifasini avtomatik yaratish boshqa narsa.
**Variantlar:**
- A) Brak kiritilganda "yetishmovchilik = buyurtma − (fakt − brak)" hisoblanadi; >0 bo'lsa qayta-chiqarish vazifasi rejaga avtomatik qo'shiladi (asl buyurtmaga bog'liq) — avtomatik
- B) Faqat brakni yozadi, qayta hisoblash qo'lda — unutish xavfi
- C) Keyin
⤳ Ta'sir: Tiraj, material qo'shimcha (MRP), muddat surilishi, Moliya (rework xarajati).

### Q538. "Формат листа / Формат гофро" + list↔dona konversiya (raskroy)
**Nima:** `25-04.xlsx`: "Формат листа", "Формат гофро (2-слой)", aniq o'lchamlar (857х695...) + hamma faylda "List soni"; bosma=list, qadoq=dona.
**Nega kerak:** Q9 o'lchov birligini (har operatsiya o'z birligida) belgilaydi, lekin "1 listdan necha dona chiqadi" (raskroy konversiyasi) qayerdan kelishini va list sonini avtomatik hisoblashni aniqlamaydi.
**Variantlar:**
- A) Texkartada list formati + "1 listdan N dona"; tizim list sonini avtomatik (tiraj÷N + brak zaxira) hisoblaydi — material/vaqt aniq
- B) List sonini planlovchi qo'lda kiritadi — xato manbai
- C) Keyin
⤳ Ta'sir: MRP (material), bosma vaqti, brak (list darajasida).

### Q539. Razmer optimizatsiyasi (eski→yangi o'lcham) — listdan ko'proq dona AI tavsiyasi
**Nima:** `Kichik buyurtmalar.xlsx`: razmerni kichraytirib (46,5x66 → 45x66) listdan ko'proq dona olib "Foyda kg / Foyda dona" oshirgan; "kichiklashgan %".
**Nega kerak:** Bu zavodning REAL foyda usuli — raskroy optimizatsiyasi. Hech bir qismda yo'q. AI "o'lchamni 1.5 sm kichraytirsa +1 dona/list, +X% foyda" desa katta qiymat.
**Variantlar:**
- A) AI raskroy optimizatsiyasini tavsiya qiladi (o'lcham × list formati × dona × foyda), texnolog tasdiqlaydi — real foyda
- B) Faqat joriy raskroy ko'rsatiladi, optimizatsiya yo'q
- C) Keyin
⤳ Ta'sir: Texkarta o'lcham, material sarfi, foyda (Moliya).

### Q540. Kichik buyurtma chegarasi — foyda dona/kg bilan ogohlantirish
**Nima:** `Kichik buyurtmalar.xlsx` (tuzgan M. Nosirov) butun tahlil: kichiklashgan buyurtmalarda "Foyda dona / Foyda kg" tushib ketishi.
**Nega kerak:** Egasi kichik buyurtmalarda zarar ko'rmaslik uchun alohida kuzatadi. Hech bir qism min-tiraj/foyda chegarasini va ogohlantirishni qamramaydi.
**Variantlar:**
- A) Tizim min tiraj/o'lcham chegarasini biladi; undan past buyurtma "kichik" deb belgilanadi + foyda dona/kg ko'rsatiladi (Savdoga ogohlantirish) — egasi modeli
- B) Faqat tiraj ko'rsatiladi, foyda tahlili yo'q
- C) Keyin
⤳ Ta'sir: Savdo (narx/min tiraj), foyda (Moliya).

### Q541. "ЗАРУР ЗАКАЗЛАР" (zarur buyurtmalar) — alohida prioritet zonasi
**Nima:** `25-04.xlsx` da "ЗАРУР ЗАКАЗЛАР" — alohida ajratilgan shoshilinch buyurtmalar bloki.
**Nega kerak:** Q28 ustuvorlik DARAJALARINI (shoshilinch/yuqori/oddiy/past) beradi, lekin egasi/savdo belgilagan "zarur" ALOHIDA RO'YXAT-bloki (kim belgilagani, alohida dashboard) farqli amaliy konstruksiya.
**Variantlar:**
- A) "Zarur" bayrog'i + alohida dashboard bloki; zarur buyurtmalar har stanok navbati boshiga, kim/qachon belgilagani jurnalda — egasi tilida
- B) Faqat Q28 darajasi, alohida "zarur" zonasi yo'q
- C) Keyin
⤳ Ta'sir: Navbat (Q53), CRP qayta hisob.

### Q542. "Менеджер" buyurtmaga bog'lanadi — kechikishda avtomatik xabar
**Nima:** `25-04.xlsx`: "Azizov Avazxon - Menedjer (54)" — har buyurtma menejerga biriktirilgan.
**Nega kerak:** Q25 og'ish chegarasida RAHBARGA signal beradi, lekin buyurtmani uni OLIB KELGAN MENEJERGA bog'lab, kechikishda menejer→mijoz zanjirini ishga tushirishni qamramaydi.
**Variantlar:**
- A) Har buyurtma menejerga bog'lanadi; tayyorlik/kechikish o'zgarishida menejerga avtomatik xabar (u mijozga aytadi) — zanjir to'liq
- B) Menejer faqat Savdoda yoziladi, rejada ko'rinmaydi — uzilish
- C) Keyin
⤳ Ta'sir: CRM/Savdo, Telegram bot, mijoz aloqasi.

### Q543. "Buyurtma tayyorligi %" — bajarilish foizi qanday hisoblanadi
**Nima:** `Bandlik.xlsx`: "Buyurtma tayyorligi %" + "Bo'limlar soni / Bo'lim soni" — buyurtma necha % tayyor.
**Nega kerak:** Q50 buyurtma STATUSlARINI beradi (yangi/jarayonda/tugadi), lekin uzluksiz "tayyorlik %" qanday hisoblanishini (bo'limlar bo'yichami yoki dona bo'yichami) belgilamaydi. Bu mijoz/planlovchi ko'radigan asosiy raqam.
**Variantlar:**
- A) Tayyorlik % = bajarilgan bo'limlar ÷ jami bo'limlar (5 dan 3 = 60%) — sodda, ko'rinarli
- B) Tayyorlik % = bajarilgan dona ÷ jami dona, har bosqich vazni bilan — aniqroq, murakkab
- C) Keyin
⤳ Ta'sir: Mijoz portali, reja dashboard.

### Q544. "I/CH ketgan kun / qolgan kun / boshlanmagan kun" — 3 ta avtomatik taymer
**Nima:** `Bandlik.xlsx`/`ketgan kun.xlsx`: "I/CH uchun ketgan kun", "Ishlab chiqarishga qolgan vaqt (kun)", "Ishlab chiqarishda boshlanmasdan qolgan kunlar".
**Nega kerak:** Q23 muddat OG'ISHINI o'lchaydi, lekin bu 3 konkret kunlik taymer (ketgan/qolgan/boshlanmagan) planlovchining har kungi asosiy raqamlari — avtomatik hisoblanishi kerak (hozir qo'lda).
**Variantlar:**
- A) Tizim 3 taymerni avtomatik hisoblaydi: ketgan kun (boshlangandan), qolgan kun (rejaga ko'ra), boshlanmagan kun (ochilgandan ishga tushmagan) — dashboard
- B) Faqat ketgan kun — yarim ko'rinish
- C) Keyin
⤳ Ta'sir: Kechikish ogohlantirish, "kutish" zonasi (Q70).

### Q545. "Boshlanmasdan qolgan" buyurtmalar — kutish zonasi sababi bilan
**Nima:** `ketgan kun.xlsx`: "Ishlab chiqarishda boshlanmasdan qolgan kunlar" — ochilgan, lekin boshlanmagan buyurtmalar.
**Nega kerak:** Q48/Q49 qayta rejalash/qotirishni beradi, lekin BOSHLANMAGAN buyurtmalarni "kutish" zonasida (nimani kutyapti — material/maket/qolip/tasdiq) ko'rsatishni qamramaydi.
**Variantlar:**
- A) "Kutish" zonasi: boshlanmagan buyurtmalar + sabab (material/maket/qolip/tasdiq kutilmoqda) — planlovchi nimani kutayotganini ko'radi
- B) Hammasi bitta ro'yxatda — boshlanmaganlar yo'qoladi
- C) Keyin
⤳ Ta'sir: MRP, Dizayn (maket), Konstruktor (qolip).

### Q546. "Priladka / Pragon" (setup) vaqti rang soniga bog'liqmi
**Nima:** `ketgan kun.xlsx` "Priladka uchun ketgan vaqt (soat)" + `Bandlik.xlsx` "Umumiy pragon / Bo'limlar pragoni".
**Nega kerak:** Q4 setup vaqtini operatsiyaga ALOHIDA beradi, lekin priladka KARTON BOSMADA rang soniga bog'liqligini (4 rang = uzunroq sozlash) va "pragon"ni (umumiy vs bo'lim) hisobga olmaydi.
**Variantlar:**
- A) Priladka vaqti rang soniga bog'liq formula (har rang +X daqiqa); "umumiy pragon" va "bo'lim pragoni" alohida ko'rsatiladi — real
- B) Stanok bo'yicha qat'iy o'rtacha setup — sodda, kam aniq
- C) Keyin

### Q547. Papka № (yil-ketma-ket) — buyurtma raqamlash va arxiv
**Nima:** Hamma faylda "Papka №" / "Buyurtma №" yil bilan: "2024-0499", "2023-1372" — yil-ketma-ket raqamlash.
**Nega kerak:** Q50 status hayotiy siklini beradi, lekin zavodning yillik papka raqamlash tizimini (xodimlar shu bilan qidiradi) va arxivlashni saqlashni qamramaydi.
**Variantlar:**
- A) Tizim avtomatik papka № beradi (2024-0499 formati: yil-ketma-ket); eski qidiruv tartibiga mos — qidiriladi/arxivlanadi
- B) Faqat ichki ID — yangi, lekin xodimlar eski raqamni qidira olmaydi
- C) Keyin

### Q548. Takror buyurtma (повтор) — eski texkartani chaqirib qayta ishlatish
**Nima:** Bir nom turli papkalarda takrorlanadi ("Multi cake/PT18205", "PANDA Prince" turli sanalarda) — doimiy mijoz qayta buyurtma beradi.
**Nega kerak:** Q6 texkarta VERSIYASINI beradi, lekin takror buyurtmada eski texkartani KATALOGDAN chaqirib (yangidan tuzmasdan) faqat tiraj/sanani o'zgartirishni qamramaydi.
**Variantlar:**
- A) Takror buyurtma mahsulot katalogidan eski texkartani chaqiradi; faqat tiraj/muddat yangilanadi — tez, bir xil sifat
- B) Har buyurtma yangi texkarta — sekin, nomuvofiqlik xavfi
- C) Keyin
⤳ Ta'sir: Mahsulot katalogi (master-data), o'tgan-fakt tarix (Q75).

### Q549. A/B tomon + usti/tagi/ichi/paddon — ko'p qismli mahsulot to'plamliligi
**Nima:** Buyurtmalarda doimiy "A tomon"+"B tomon" (Amirxon Hone A/B, Haley gaz plita A/B) va "usti/tagi/ichi/krishka/Paddon" (Benazir usti+tagi, PANDA-PIE Paddon+krishka) — bitta mahsulot ko'p qismdan.
**Nega kerak:** Q32 buyurtmani SPLIT (qisman yetkazish) qiladi, lekin TESKARISI — bir necha bog'liq qism (A+B, usti+tagi) HAMMASI tayyor bo'lmasa yetkazib bo'lmasligini va to'plam gate'ini qamramaydi.
**Variantlar:**
- A) Bog'liq qismlar "to'plam" sifatida bog'lanadi (A/B tomon, usti/tagi/paddon); "to'liq to'plam" gate qadoqdan oldin; biri qolsa ogohlantiradi — to'liq yetkazish
- B) Har qism mustaqil buyurtma — biri unutilishi mumkin
- C) Keyin
⤳ Ta'sir: Qadoq (to'plam to'liqligi), SD (yetkazish).

### Q550. O'tgan yil fakti — takror mahsulot muddatini tarixdan o'rganish
**Nima:** Excel'lar yil-yil saqlanadi (2023, 2024) — tarixiy "ketgan kun / fakt vaqt" mavjud.
**Nega kerak:** Q10 normani haqiqiy O'RTACHADAN beradi, lekin TAKROR MAHSULOTNING o'tgan-yilgi fakt muddatini (4 kun ketgan) yangi buyurtma ATP-muddatiga tavsiya qilishni qamramaydi.
**Variantlar:**
- A) Takror mahsulotda AI o'tgan fakt vaqtini ko'rsatadi (o'rtacha + diapazon) va yangi rejaga tavsiya qiladi — tajriba-asosli ATP
- B) Har safar noldan norma — tarix ishlatilmaydi
- C) Keyin
⤳ Ta'sir: ATP (Q35), norma kalibrlash, katalog (Q73).

### Q551. "смена: ден / ноч" — navbat smenasini ko'rsatish
**Nima:** `25-04.xlsx`: "смена: ден / ноч" + "ден/ноч" ustunlari — har operatsiya kunduzgi yoki tungi smenada.
**Nega kerak:** Q41 smena TURLARINI (2/3 smenali shablon) belgilaydi, lekin har buyurtma/navbat AYNAN qaysi smenaga (ден/ноч) tushishini va kunlik 2-slot yuklamasini ajratishni qamramaydi.
**Variantlar:**
- A) Navbat kun + smena (ден/ноч) darajasida; har stanok kuniga 2 slot — aniq yuklama, tungi quvvat ko'rinadi
- B) Faqat kun darajasi, smena operator ixtiyorida — tungi quvvat ko'rinmaydi
- C) Keyin
⤳ Ta'sir: CRP (kunlik 2-slot), HR tabel.

### Q552. Operatsiya "Начат/Завершит" timestamp — sex tableti tugmasi bilan
**Nima:** `25-04.xlsx`: "Начат", "Завершит", "Дата/время начала операции" — har operatsiyaning boshlangan/tugagan aniq vaqti.
**Nega kerak:** Q26 reja-fakt YOPISH vaqtini (smena/kun oxiri) beradi, lekin har operatsiyaga START/STOP TUGMASI (timestamp avtomatik) — bu normani real o'lchash va audit izi uchun farqli mexanizm.
**Variantlar:**
- A) Sex tableti operatsiya boshlash/tugatish tugmasi (timestamp avtomatik); norma faktdan o'lchanadi — aniq
- B) Operator vaqtni qo'lda kiritadi — keyin yozish/xato xavfi
- C) Keyin
⤳ Ta'sir: MES tableti, norma kalibrlash (Q10).

### Q553. Kod lug'ati (KT / PT / E / GL prefikslari) — strukturalangan ma'no
**Nima:** Buyurtma nomlarida doimiy kodlar: "KT4195", "PT2279", "E9358", "GL" (gofra list) — material/tur kodlari.
**Nega kerak:** Bu zavodning ichki lug'ati. Hech bir qism bu kodlarni master-data sifatida tushunish va qidirishni qamramaydi.
**Variantlar:**
- A) Kod lug'ati master-data (KT/PT/E/GL prefiks → ma'no); buyurtmada strukturalangan — qidiriladi/filtrlanadi
- B) Kod faqat nom ichida matn — qidirib bo'lmaydi
- C) Keyin
  ↳ Agar A: bu kodlar mijoz mahsulot kodimi yoki ichki material kodimi? — egasi lug'atni tushuntiradi (KT=? PT=? E=etiketka? GL=gofra list?)

### Q554. "Hafta qolgan / Hafta ishlab chiqargan" — haftalik reja kesimi
**Nima:** `ketgan kun.xlsx`: "Hafta qolgan", "Hafta ishlab chiqargan" — haftalik kesimda reja-fakt.
**Nega kerak:** Q47 reja gorizontini (haftalik+oylik) beradi, lekin HAFTALIK reja-fakt kesimini (hafta qolgan/ishlab chiqargan) asosiy boshqaruv ko'rsatkichi sifatida ajratmaydi.
**Variantlar:**
- A) Reja-fakt 3 kesim: kun (smena) / hafta / oy; hafta = asosiy boshqaruv kesimi (hafta qolgan/bajargan) — Bandlik mantig'iga mos
- B) Faqat kunlik, hafta qo'lda jamlanadi
- C) Keyin

### Q555. "Asosiy ishlab chiqarish" vs umumiy vaqt — bottleneck bosqichni ajratish
**Nima:** `ketgan kun.xlsx`: "Asosiy ishlab chiqarishga ketgan/qolgan vaqt" ╳ oddiy "ketgan vaqt" — asosiy (bosma) bosqich alohida sanaladi.
**Nega kerak:** Q31 umumiy stanok (bottleneck) navbatini beradi, lekin buyurtma "asosiy bosqichdan o'tib qadoq/oynakchada turib qolgani" ni (asosiy vs umumiy vaqt) ko'rsatishni qamramaydi.
**Variantlar:**
- A) Marshrutda "asosiy bosqich" (bosma) belgilanadi; tizim asosiy vs umumiy ketgan/qolgan vaqtni alohida ko'rsatadi — qaerda qotgani ko'rinadi
- B) Hammasi bir xil, ajratilmaydi
- C) Keyin

### Q556. "Oynakcha" (PVX deraza) — material + qo'l-mehnat bosqichi
**Nima:** `Bandlik.xlsx`/`25-04.xlsx`: "Окошка / Oynakcha" + "Oynakcha yopishtirish" qadoq turi — karobkaga shaffof PVX oyna yopishtirish.
**Nega kerak:** Q8 mahsulot spetsifikatsiyasida laminatsiya bor/yo'qni qamraydi, lekin OYNAKCHA qo'shimcha PVX MATERIAL + qo'l-mehnatini alohida bosqich sifatida (material drift oldini olib) qamramaydi.
**Variantlar:**
- A) Oynakcha bosqichi = PVX material (o'lcham) + qo'l-mehnat normasi; texkartada belgilanadi — to'liq
- B) Faqat bosqich vaqti, PVX material alohida hisoblanmaydi — material drift
- C) Keyin
⤳ Ta'sir: Ombor (PVX plyonka), narx.

### Q557. Pardoz turlari (laminat / oddiy lak / vib-lak) — alohida norma+material
**Nima:** `Iyun ishchilar.xlsx`: "Laminat", "oddiy lak", "vib.lak (виборочный)" + alohida normalar ("Norma oddiy lak / Norma Vib lak").
**Nega kerak:** Q8 "laminatsiya bor/yo'q"ni beradi, lekin 3 PARDOZ TURI (laminat/oddiy-lak/viborochniy-lak) har biri alohida stanok/material/NORMA ekanini qamramaydi.
**Variantlar:**
- A) Pardoz turi texkartada tanlanadi (laminat/oddiy-lak/vib-lak/yo'q), har biriga alohida norma + material — aniq
- B) Bitta "pardoz" maydoni, tur farqlanmaydi — norma noto'g'ri
- C) Keyin
⤳ Ta'sir: Material (lak/plyonka), KPI (oddiy/vib lak %).

### Q558. Qadoq turlari (10+ tur) — har turga alohida norma
**Nima:** `Iyun ishchilar.xlsx`: Karobka qadoqlash, Oynakchalik qadoqlash, Paddon qadoqlash, Avtokley qadoqlash, Kichik tigel qadoqlash, Etiketka qadoqlash (samokley), Skleykada ishlash — 10+ qadoq turi.
**Nega kerak:** Q3 operatsiya normasini umumiy beradi, lekin QADOQ aslida 10+ alohida tur ekanini (har biri boshqa vaqt/xodim) va texkartada tanlanishini qamramaydi.
**Variantlar:**
- A) Qadoq turi texkartada tanlanadi (10+ turdan), har biriga norma — aniq xodim/vaqt
- B) Bitta umumiy qadoq normasi — noaniq
- C) Keyin
⤳ Ta'sir: HR (qadoq xodimlari normasi), smena yuklamasi.

### Q559. "Qolip" (shtans bichak) mavjudligi — yangi mahsulot reja gate
**Nima:** Texkartada «қолип» bor; nomlarda "qolipida" tez-tez ("panda pie qolipida", "samo qolipida") — shtans qolipi.
**Nega kerak:** Q19 format CHEKLOVINI beradi, lekin yangi mahsulotda QOLIP (shtans) tayyor bo'lishini va qolip tayyorlash vaqtini reja gate'iga ulashni qamramaydi.
**Variantlar:**
- A) Texkartada qolip ID + holati (bor/buyurtma-berilgan/yo'q); qolip yo'q → reja "qolip kutilmoqda" gate; qolip tayyorlash vaqti muddatga qo'shiladi — to'liq
- B) Qolip alohida, reja bilan bog'lanmaydi — yangi mahsulot muddati ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Konstruktor bo'limi, yangi mahsulot muddati (Savdo).

### Q560. Material profili (E/B/C mikro, 2-sloy, 5-sloy) — master ro'yxat
**Nima:** Nomlarda doimiy "E mikro", "B makro", "C makro", "2х слой", "5 sloy", "Профиль ГК" — gofra profili turlari.
**Nega kerak:** Q8 "flute turi E/B/C"ni nazarda tutadi, lekin zavodning real terminologiyasi (mikro/makro + sloy soni + ГК profil) bo'yicha aniq MASTER RO'YXAT va material/stanok bog'lanishini qamramaydi.
**Variantlar:**
- A) Texkartada gofra profili master ro'yxatdan (mikro/makro turi + sloy soni + ГК profil); material va stanok shunga bog'lanadi — aniq
- B) Erkin matn — o'qib bo'lmaydi
- C) Keyin

### Q561. Bosma format birligi (105 / 105ф / 72) — stanok formati bilan moslik
**Nima:** `25-04.xlsx`: "105 печат / 105ф печат / 72 печат" + `Bandlik.xlsx` "Bosma SM 72 / SM 52" — bosma format raqamlari va stanok formatlari.
**Nega kerak:** Q19 max/min formatni beradi, lekin zavodning AYNAN format kodlari (105/72) va stanok (SM 72/52) bilan mosligini (katta list faqat SM 72ga sig'adi) konkret qamramaydi.
**Variantlar:**
- A) Format kodlari (105/105ф/72) stanok formatiga (SM 72/52) bog'lanadi; reja format>stanok bo'lsa o'sha stanokni taklif qilmaydi — fizik xato oldini oladi
- B) Planlovchi o'zi biladi — xato xavfi
- C) Keyin
⤳ Ta'sir: Stanok tanlash (Q2), raskroy (Q63).

### Q562. Bir buyurtmada ko'p mahsulot (multi-line) — pozitsiya darajasi
**Nima:** Bir mijoz bitta buyurtmada ko'p mahsulot (Swissagro A+B konteyner, Haley A+B+daftar) — bog'liq pozitsiyalar.
**Nega kerak:** Q74 BOG'LIQ QISMLARNI (to'plam) bog'lasa-da, "buyurtma = ko'p line-item (har biri o'z marshruti)" tuzilmasini va "buyurtma to'liq = hamma pozitsiya tayyor"ni alohida qamrash kerak.
**Variantlar:**
- A) Buyurtma = ko'p pozitsiya (line-items); har pozitsiya o'z marshruti/tiraji; "buyurtma to'liq" = hamma pozitsiya tayyor — to'g'ri yetkazish
- B) Har pozitsiya alohida buyurtma — yaxlitlik yo'qoladi
- C) Keyin
⤳ Ta'sir: Savdo (buyurtma tuzilmasi), mijoz portali.

### Q563. "Material tayyorlash" + "Yetkazib berish" — sex tashqi bosqichlar
**Nima:** `Bandlik.xlsx` bo'limlar qatorida "Rejalashtirish", "Material tayyorlash", "Yetkazib berish" — sex bo'limlari qatorida.
**Nega kerak:** A-H qism sex operatsiyalari va material ZAXIRASINI (F) qamraydi, lekin "material tayyorlash" (ombordan olish/kesish) va "yetkazib berish" (logistika) ni marshrut bosqichlari sifatida (vaqt normasi bilan, muddatga ta'sir) qamramaydi.
**Variantlar:**
- A) Marshrut boshiga "material tayyorlash", oxiriga "yetkazib berish" bosqichlari (vaqt normasi bilan) qo'shiladi — to'liq muddat
- B) Faqat sex bosqichlari — muddat optimistik
- C) Keyin
⤳ Ta'sir: Ombor (material chiqim), Logistika.

### Q564. "Bandlik" dashboardi — bo'lim yuklanganligi vizual
**Nima:** `Bandlik.xlsx` nomi = "bandlik" (yuklanganlik) — har bo'lim/stanok qancha band, qancha bo'sh.
**Nega kerak:** Q16 quvvat o'lchovini beradi, lekin planlovchi uchun har bo'lim/stanok band %/navbat/bo'sh slotni BITTA VIZUAL EKRANDA (CRP amaliy ko'rinishi) ko'rsatishni qamramaydi.
**Variantlar:**
- A) "Bandlik" dashboard: har bo'lim/stanok band % + navbat soni + bo'sh slot (rangli) — vizual yuklama
- B) Faqat jadval ro'yxati — o'qish qiyin
- C) Keyin
⤳ Ta'sir: CRP, navbat (Q53), zarur buyurtma joylashtirish.

### Q565. Aniq stanok ro'yxati (Bandlik 22+ stanok) — master-data to'liqligi
**Nima:** `Bandlik.xlsx` aniq stanoklar: Flexo gofra/pechat/tigel/Stepler, minimikro, Gofra mikro, flotto, Bosma SM 72/52, Laminatsiya, Laklash, Viborochniy lak, Koshirofka, Tigel gofra, GTO, Begovka, Tisnenie, Kongrev, Avto Kley, Kleylash, Qadoqlash, Oynakcha.
**Nega kerak:** Q15 stanok KARTASI MAYDONLARINI beradi, lekin zavodning AYNAN 22+ stanok ro'yxatini (egasining real nomlari bilan) master-dataga kiritishni belgilamaydi.
**Variantlar:**
- A) Stanok master-data shu 22+ stanokni aniq nom + tur (flekso/ofset/post-press) + format + quvvat bilan kiritadi — egasi ro'yxati bilan
- B) Faqat asosiy bosma stanoklar, post-press umumiy — qisqartirilgan
- C) Keyin

### Q566. Post-press checkbox (begovka/tisnenie/kongrev/oynakcha) — marshrutda ixtiyoriy
**Nima:** `Bandlik.xlsx`: Begovka, Tisnenie, Kongrev, Oynakcha, Avto Kley, Kleylash, Tigel — bosmadan keyingi ixtiyoriy pardozlash.
**Nega kerak:** Q1 marshrut ketma-ketligini beradi, lekin bu post-press bosqichlar IXTIYORIY (har mahsulotda yo'q) va texkartada CHECKBOX bilan tanlanib marshrutga qo'shilishini qamramaydi.
**Variantlar:**
- A) Texkartada post-press checkbox (begovka/tisnenie/kongrev/oynakcha/laminat/lak/vib-lak) — kerakligi belgilanadi, marshrutga qo'shiladi — reja shishmaydi
- B) Hamma marshrutda hamma bosqich (ishlatilmagani "0") — reja shishadi
- C) Keyin

### Q567. To'liqsiz maketni reja qabul qilsinmi — "sifat rejadan ustun" qoidasi
**Nima:** RD5 aniq dilemma: ishlab chiqarish maketni shoshib so'raydi (смена режаси тиғиз), lekin o'lcham/kesim chizig'i/rang profili tekshirilmagan; boshqa ЦКП: «Сифат қарорларини режа ва муддатдан устун қўйиш».
**Nega kerak:** Q63 (ish boshlanish gate) yo'q bizning faylda; bu egasining KITOBDAGI aniq qoidasi — to'liqsiz maketni reja zo'rlab o'tkaza olmasligi. Hech bir qism buni qamramaydi.
**Variantlar:**
- A) Tizim sifat qoidasini yoqlaydi: tekshirilmagan maket → reja "kutish" holatiga tushadi, faqat dizayn-rahbar tasdig'i (audit yozuvi) bilan ochiladi — kitob modeli
- B) Planlovchi "shoshilinch" deb o'tkazadi, lekin sabab yoziladi — moslashuvchan
- C) Keyin
⤳ Ta'sir: Dizayn (maket tayyorligi), QC, brak oldini olish.

### Q568. Reja boshlash gate — maket + texkarta + material uchchasi tayyor
**Nima:** RD5: to'liqsiz maket → brak; lab→texkarta tasdig'i; material lab o'lchovi.
**Nega kerak:** F qism material ATP-sini beradi, lekin reja "ishga tushdi" deyish uchun UCH shartning (tasdiqlangan maket ╳ tasdiqlangan texkarta ╳ material bor) BIRGALIKDA gate bo'lishini qamramaydi.
**Variantlar:**
- A) Reja "boshlash" gate: maket-tasdiq ╳ texkarta+lab-tasdiq ╳ material-bor — uchchasi yashil bo'lsagina ishga tushadi
- B) Planlovchi qo'lda boshlaydi, gate yo'q — to'liqsiz maket brak beradi
- C) Keyin
⤳ Ta'sir: Dizayn, Ombor, QC (Q59/Q92).

### Q569. Maket qaytarish sikli (доработка) — muddatga ta'siri
**Nima:** RD5: to'liqsiz maket dizaynga qaytariladi → vaqt ketadi (1-2 marta bo'lishi mumkin).
**Nega kerak:** Q48 qayta rejalashni beradi, lekin MAKET qaytarish siklini (qoralama→tekshiruvda→qaytarildi→tasdiqlandi) kuzatib, qaytarishda muddatni avtomatik surishni qamramaydi.
**Variantlar:**
- A) Reja maket holatini kuzatadi (qoralama/tekshiruvda/qaytarildi/tasdiqlandi); qaytarish bo'lsa muddat avtomatik suriladi — real muddat
- B) Faqat "tayyor/tayyor emas" — qaytarish sikli ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Dizayn, ATP, kechikish sababi (Q24).

### Q570. Konstruktor bosqichi — yangi mahsulot chizma+qolip marshrutda
**Nima:** RD5: 5-Departament ichida «конструктор» bor; yangi mahsulot chizma/qolip talab qiladi.
**Nega kerak:** Q84 qolip MAVJUDLIGINI gate qiladi, lekin yangi mahsulotda KONSTRUKTOR (chizma + qolip ishlab chiqish) bosqichini marshrutga vaqt+holat bilan qo'shishni alohida qamramaydi.
**Variantlar:**
- A) Yangi mahsulot marshrutiga "konstruktor (chizma+qolip)" bosqichi (vaqt+holat) qo'shiladi; reja shundan keyin ishlab chiqarishga o'tadi — to'liq muddat
- B) Konstruktor alohida, reja bilan bog'lanmaydi
- C) Keyin
⤳ Ta'sir: Konstruktor bo'limi, qolip (Q84), Savdo (muddat).

### Q571. Norma bajarish % (43%/62% kuniga) — operator KPI avtomatik hisob
**Nima:** `Iyun ishchilar.xlsx`: "43% Kuniga", "36% o'rtacha kuniga ishlangan", "Kuniga 62% dan ishlagan" — operator normasi necha % bajargani.
**Nega kerak:** Q14 norma % KPIga kirishini PRINTSIP sifatida beradi, lekin Iyun ishchilar.xlsx ning aynan hisobini (fakt ÷ norma, kunlik/oylik %) avtomatlashtirib HR oyligiga ulashning konkret modelini qamramaydi.
**Variantlar:**
- A) Tizim har operator norma % ni avtomatik (fakt÷norma, kunlik+oylik) hisoblaydi; HR oyligiga ulanadi — Iyun ishchilar.xlsx avtomatlashtiriladi
- B) Faqat fakt chiqim, norma % qo'lda — Excel davom etadi
- C) Keyin
⤳ Ta'sir: HR oylik, motivatsiya.

### Q572. Operator bo'sh turishi (ish yo'qligi) vs sekin ishlash — KPI adolati
**Nima:** `Iyun ishchilar.xlsx` past %lar (23%, 36%) — operator to'liq band emas (ish berilmagan yoki sekin).
**Nega kerak:** Q46 prostoyni STANOK darajasida ko'rsatadi, lekin OPERATOR past %i uning aybi (sekin) yoki ish berilmagani (reja bo'sh) ekanini ajratib, KPI adolatini ta'minlashni qamramaydi.
**Variantlar:**
- A) Tizim "ish yo'q (reja bo'sh)" vs "ishladi-yu sekin"ni ajratadi; bo'sh turish operator KPIga ta'sir qilmaydi — adolatli
- B) Faqat umumiy % — bo'sh turish ham past ko'rsatadi (noadolat)
- C) Keyin
⤳ Ta'sir: HR KPI adolati, reja to'ldirish.

### Q573. Reja Excelga eksport — o'tish davri mosligi
**Nima:** Hozir hamma narsa Excelda (Bandlik/ketgan kun) — xodimlar Excelga o'rgangan.
**Nega kerak:** Hech bir qism o'tish davrini qamramaydi. Tizim Excelga (mavjud format ustunlari bilan) eksport bersa, xodimlar qarshilik qilmaydi va solishtirib tekshira oladi.
**Variantlar:**
- A) Reja Excelga eksport (Bandlik/ketgan kun ustunlari bilan) — o'tish silliq, ishonch ortadi
- B) Faqat ekranda — toza, lekin moslashish qiyin
- C) Keyin

### Q574. AI keyingi smenani to'ldirish (rang-guruh + zarur + material) taklifi
**Nima:** Smena tugaganda keyingi smena nima ishlashi qo'lda (Excel navbatdan) belgilanadi; rang almashtirish (priladka) qimmat.
**Nega kerak:** Q31 umumiy stanok navbatini AVTOMATIK qo'yadi, lekin AI keyingi smenaga OPTIMAL ish to'plamini (zarur + rang-guruhlab priladka tejash + material-bor + bottleneck-to'la) taklif qilishini qamramaydi.
**Variantlar:**
- A) AI har smenaga optimal to'plam taklif qiladi (zarur + rang-guruh + material-bor + bottleneck-to'la), planlovchi 1 klik tasdiqlaydi — vaqt+priladka tejaydi
- B) Faqat navbat ko'rsatiladi, taklif yo'q
- C) Keyin
⤳ Ta'sir: Navbat (Q53), priladka (Q71), zarur (Q66).

### Q575. Bottleneck (узкое место) — AI rejani tor-joy atrofida qurish
**Nima:** Zavodda 1-2 stanok bottleneck (SM 72 ofset yoki flekso gofra liniya — egasi "90 metrli flekso gofra liniya"da to'xtagan); hamma reja shuning quvvatiga bog'liq.
**Nega kerak:** Q21 parallel stanoklarni guruhlaydi va Q31 to'qnashuvni ko'rsatadi, lekin AI bottleneckni AVTOMATIK aniqlab, butun rejani uning atrofida (TOC — theory of constraints) optimizatsiya qilishni qamramaydi.
**Variantlar:**
- A) AI bottleneck stanokni avtomatik aniqlaydi (eng band) va rejani shunga moslab optimizatsiya qiladi (umumiy chiqim maks) — TOC
- B) Faqat band % ko'rsatadi, optimizatsiya planlovchida
- C) Keyin
⤳ Ta'sir: CRP, navbat, sarmoya qarori (qaysi stanok kerak).

### Q576. Bir operator bir necha post-press stanok — xodim-cheklovli CRP
**Nima:** Ba'zi post-press (tigel, oynakcha, kley) bir operator bir nechtasini boqishi mumkin; bosma esa 1 operator 1 stanok.
**Nega kerak:** Q16/Q21 STANOK quvvatini beradi, lekin CRP yuklamasini XODIM mavjudligi bilan ham cheklashni (5 stanok lekin 3 operator = 3 parallel) qamramaydi.
**Variantlar:**
- A) CRP ikki cheklov: stanok quvvati ╳ xodim mavjudligi (smena bo'yicha) — real parallel
- B) Faqat stanok quvvati, xodim cheksiz deb olinadi — optimistik, kechikish
- C) Keyin
⤳ Ta'sir: HR (smena xodimlari), smena rejasi.

### Q577. Yarim-mahsulot / xizmat buyurtma (kesish, gofra list) — qisqa marshrut
**Nima:** `Bandlik.xlsx`: "Kesilgan qog'oz xizmati/84x45", "Qoldiq karton rulon/kesish uchun", "Gofra list/GL" — to'liq mahsulot emas, kesish/list xizmati ham buyurtma.
**Nega kerak:** Q50 status siklini beradi, lekin BUYURTMA TURINI (to'liq mahsulot / yarim-tayyor / xizmat) ajratib, xizmat buyurtmaga qisqa marshrut berishni qamramaydi.
**Variantlar:**
- A) Buyurtma turi: to'liq mahsulot / yarim-tayyor / xizmat (kesish/list); har biriga mos qisqa marshrut — to'liq marshrut majburlanmaydi
- B) Hamma narsa "mahsulot", to'liq marshrut majburlanadi — ortiqcha
- C) Keyin

### Q578. Egasi "reja sog'lig'i" dashboardi — bitta sodda ekran
**Nima:** Egasi non-texnik — unga butun zavod reja holati bitta sodda ekranda kerak (nechta vaqtida, nechtasi kechikyapti, qaysi stanok band, bugungi chiqim).
**Nega kerak:** Q46 SMENA dashboardini (rahbar uchun) beradi, lekin EGASI uchun butun-zavod, sodda til, bitta ekranli umumiy ko'rinishni qamramaydi.
**Variantlar:**
- A) Egasi dashboardi: vaqtida % / kechikyapti soni / bottleneck stanok / bugungi chiqim vs reja / zarur buyurtmalar — 1 ekran, sodda til
- B) Faqat batafsil jadvallar — egasi uchun og'ir
- C) Keyin
⤳ Ta'sir: Org-model (egasi ko'rinishi), barcha PP metrika jamlanishi.

### Q579. "Длительность / Плановая продолж." → norma avtomatik kalibrlash
**Nima:** `25-04.xlsx`: "Длительность" + "Плановая продолж." — rejaviy davomiylik ╳ haqiqiy.
**Nega kerak:** Q10 normani "haqiqiy o'rtachani YONMA-YON ko'rsatadi" deydi, lekin og'ish chegaradan oshganda normani AVTOMATIK qayta ko'rishga (o'z-o'zini kalibrlash) chaqirishni qamramaydi.
**Variantlar:**
- A) Reja davomiylik = norma×tiraj + setup; fakt avtomatik; og'ish > X% bo'lsa tizim normani qayta ko'rishni tavsiya qiladi — o'z-o'zini kalibrlash
- B) Faqat yonma-yon ko'rsatadi, kalibrlash tavsiyasi yo'q
- C) Keyin
⤳ Ta'sir: Norma aniqligi (Q10), ATP.

### Q580. Kechikish sabablari AI tahlili (oylik) — eng ko'p takror sabab
**Nima:** RD5: brak→reja buziladi; Excel'larda kechikish (qolgan kun) ko'rinadi-yu, sabab guruhlanmagan.
**Nega kerak:** Q24 og'ishga KODLI SABAB qo'yadi (bir hodisa uchun), lekin AI sabablarni OYLIK guruhlab "eng ko'p takror sabab = material yo'q" deb tizimli yaxshilanish hisobotini berishini qamramaydi.
**Variantlar:**
- A) AI kodli sabablarni oylik guruhlab hisobot beradi (Pareto: eng ko'p kechikish sababi) — tizimli yaxshilanish yo'nalishi
- B) Sabablar faqat har buyurtmada ko'rinadi, jamlanmaydi — tendentsiya ko'rinmaydi
- C) Keyin
⤳ Ta'sir: AI tahlil, stanok downtime (Q18), MRP (Q33).

---

DONE: PP / Rejalashtirish — 53.

## 8. MES / Ishlab chiqarish

### Q581. "А смена План" formasini ekranga aynan ko'chirish
**Nima:** Zavoddagi "А смена План.xlsx" reja-formasini MES ekraniga aynan o'sha tartibda olib kirish (Буюртма раками ва номи → Бажариладиган сон → Режани бажаришга кетадиган вакт → Ишни бошлаш/тугатиш вакти → факт).
**Nega kerak:** Zavod 5 yildan beri aynan shu forma bo'yicha ishlaydi; ekran shu formaga o'xshasa usta o'rganishsiz ishlatadi, butunlay yangi forma kiritsangiz qarshilik bo'ladi.
**Variantlar:**
- A) Formani aynan ustun-ma-ustun ko'chirish (smena → mashina → buyurtma satri) — eng tanish, tez qabul
- B) Soddalashtirilgan yangi forma — chiroyli, lekin usta qaytadan o'rganadi
- C) Keyin — hozircha mavjud MES forma qoladi
⤳ Ta'sir: PP reja → MES forma → smena hisobot zanjiri

### Q582. Reja vaqti vs fakt vaqtni 4 ALOHIDA maydonda saqlash
**Nima:** Formada "Ишни бошлаш вакти (режа)" / "ишни бошлади (факт)" / "Ишни тугатиш вакти (режа)" / "Ишни тухтатди хакикатда (факт)" — 4 ta alohida vaqt.
**Nega kerak:** Zavod formasi reja va fakt vaqtni yonma-yon yozadi — kechikishni (rejadan necha daqiqa kech boshlandi/tugadi) shu yerdan o'lchaydi; bitta start/stop qoldirsangiz tahlil yo'qoladi.
**Variantlar:**
- A) 4 maydon to'liq (reja-boshlash/fakt-boshlash/reja-tugatish/fakt-tugatish) — kechikish aniq
- B) Faqat fakt boshlash/tugatish — yengil, reja bilan taqqoslab bo'lmaydi
- C) Keyin — bitta start/stop yetadi

### Q583. Operator + Ёрдамчи juftligini har stansiyaga biriktirish
**Nima:** Formada har mashina satrida "Оператор:___" va "Ёрдамчи:___" alohida (ko'pincha 1 operator + 1-3 yordamchi: masalan ФСМ да Хужамбердиева Н + Холмирзаева М). MES shu juftlikni saqlasinmi.
**Nega kerak:** Karton sexida yordamchi (kashirovka, sklейка) ishning yarmini bajaradi; faqat operatorni yozsangiz yordamchi mehnati ko'rinmaydi, oylik/reyting noto'g'ri.
**Variantlar:**
- A) Har stansiyaga 1 operator + N yordamchi roli — hissa har kimga to'g'ri yoziladi
- B) Faqat operator + "yordamchilar soni" (ismsiz) — yengil, yordamchi hissasi yo'q
- C) Keyin — faqat operator
  ↳ Agar A: yordamchi natijaning necha %ini oladi? (A) teng B) operator 60/yordamchi 40 C) razryadga qarab)

### Q584. Normani SOATLIK + 12-SOATLIK ikki bazada saqlash
**Nima:** "Станоклар норма" da ham "норма штук 1час", ham "норма штук за 12 часов" bor. MES normani ikkala bazada saqlasinmi.
**Nega kerak:** Smena = 12 soat (kun tartibi hujjati), lekin soatlik norma jonli kuzatuvga kerak; zavod ikkalasini ham yozadi.
**Variantlar:**
- A) Asosiy = soatlik, 12-soatlik avto-hisob (×12 − tanaffuslar) — bitta haqiqat
- B) Ikkalasi qo'lda — moslashuvchan, nomuvofiq xavfi
- C) Keyin — bitta umumiy norma

### Q585. Normaning o'lchov birligini stansiyaga qarab (м2/лист/штук/удар-лист)
**Nima:** Kitobda har stansiya o'z birligida: Гофра линия = **м2**, печать = **лист**, ФСМ/склейка = **штук/дона**, тиснение/тигель = **удар/лист** (zarba). MES birligi stansiyaga bog'liq bo'lsinmi.
**Nega kerak:** Tigel pressi "udar" (zarba), печать "лист" bilan o'lchanadi; hammaga "dona" qo'ysangiz norma/bajarilish noto'g'ri.
**Variantlar:**
- A) Har stansiya turining o'z birligi (м2/лист/дона/удар) — to'g'ri o'lchov
- B) Hammaga "dona" + koeffitsient — sodda, chalkash
- C) Keyin — birlik ahamiyatsiz

### Q586. "иш йук" (ish yo'qligi) holatini downtime'dan ALOHIDA hisoblash
**Nima:** Normalar jadvalida "**иш йук**" alohida ustun (operator bor, ish topshirilmagan). Buni mashina to'xtashidan ALOHIDA "ish yo'q" turi qilish.
**Nega kerak:** Izohda "ходимлар 3 соат иш йуклиги учун арчишда ишлади" — bu mashina nosozligi emas, REJALASHTIRISH kamchiligi; aralashtirsa kim aybdor (planlovchi vs mashina) ko'rinmaydi.
**Variantlar:**
- A) "Ish yo'q" alohida tur — sababi rejalashtirishga yoziladi (operator aybsiz) — adolatli
- B) Oddiy to'xtashga qo'shish — sodda, ayb chalkashadi
- C) Keyin — faqat to'xtash
⤳ Ta'sir: PP rejalashtirish sifatining GSD'si (necha soat ish-yo'q bo'ldi)

### Q587. Ish-yo'q paytida xodimni boshqa ishga o'tkazishni qayd qilish
**Nima:** Kitobda "иш йуклиги сабабли арчишда ишлаган", "паддон кадоклаган", "автокартонда ишлади" — ish bo'lmaganda xodim ko'chiriladi. MES shu ko'chishni yozsinmi.
**Nega kerak:** Xodim bekor turmagan, boshqa ish bajargan — bu unumini to'g'ri ko'rsatadi; yozmasangiz "bekor turdi" deb noto'g'ri.
**Variantlar:**
- A) Ish-yo'q vaqtiga "qaytarilgan ish" (archish/kadoklash/avtokarton) yoziladi — haqiqiy unum
- B) Faqat "ish yo'q" belgilanadi, qayerga ko'chgani yozilmaydi — yengil
- C) Keyin — kuzatilmaydi

### Q588. Ofset va Flekso bo'limini alohida normalash (НО 12-1 / НО 12-2)
**Nima:** Kitobda "отдел ОФСЕТ" va "отдел ФЛЕКСО" alohida norma jadvallari (har biri o'z НО-mas'uli bilan: Юсупов Ильдар = 12-2, Махмудов = 12-1). MES ikki bo'lim alohida bo'lsinmi.
**Nega kerak:** Ofset (SM-52/SM-72/KBA-105) va Flekso butunlay boshqa mashina/jarayon/norma; bitta umumiy hisobotга qo'ysangiz solishtirib bo'lmaydi.
**Variantlar:**
- A) Ofset / Flekso alohida bo'lim — har biri o'z norma + НО-mas'ul + hisobot — real tuzilma
- B) Bitta umumiy "bosma" bo'limi — sodda, aralash
- C) Keyin — bo'lim ajratilmaydi

### Q589. Aniq mashina ro'yxatini master-data qilib kiritish
**Nima:** Kitobdagi aniq mashinalar: Резка, Гф линия, SM-52, SM-72, KBA-105, Трафаретный Лак, UV лакировка, Ламинация, Авто/полуавтомат/ручная кашировка, Автовысечка картон/гофра, Тигель 1-10, ФСМ большой/полуавтомат, Окошка, Степлер, Эмбоссинг. Shu ro'yxat master-data bo'lsinmi.
**Nega kerak:** "Mashina" bo'sh ro'yxat bo'lsa har usta har xil nom yozadi; aniq ro'yxat normani, OEE'ni, sarfni bog'laydi.
**Variantlar:**
- A) Kitobdagi to'liq mashina ro'yxati (~30 ta) master-data — bitta haqiqat
- B) Faqat asosiy 8-10 mashina — yengil, kichik mashinalar yo'q
- C) Keyin — mashina erkin matn

### Q590. Tigel pressini 1-10 raqamlangan alohida birlik qilish
**Nima:** Kitobda Тигель 1 dan Тигель 10 gacha har biri ALOHIDA satr (ba'zilari "тиснение"/"конгрев"). Har tigel alohida mashinami yoki bitta "tigel guruhi"mi.
**Nega kerak:** Har tigel o'z operatori/normasi/yuklamasi bilan ishlaydi; bittaga yig'sangiz qaysi tigel bo'sh/band ko'rinmaydi (rejalovchi tigel 5 ga ish bera olmaydi).
**Variantlar:**
- A) Har tigel (1-10) alohida birlik + turi (oddiy/тиснение/конгрев) — aniq yuklash
- B) Bitta "Tigellar" guruhi + soni — sodda, individual ko'rinmaydi
- C) Keyin — tigel yagona

### Q591. Stansiyaga "keyingi ish" (очередь) ko'rsatish
**Nima:** Formada "Станокдаги Ишлар" va "кейинги иши" (navbatdagi ish) ustuni. MES har mashinada joriy + keyingi ishni ko'rsatsinmi.
**Nega kerak:** Operator joriy ishni tugatishi bilan keyingisini bilsa to'xtamasdan o'tadi; ko'rinmasa ustani kutadi, vaqt yo'qoladi.
**Variantlar:**
- A) Har mashinada joriy + navbatdagi 2-3 ish — uzluksizlik
- B) Faqat joriy ish — sodda
- C) Keyin — navbat ko'rsatilmaydi

### Q592. Soatlik normaning aniq pog'onalarini saqlash (400/500/600/1000/1500...)
**Nima:** Formada "1 соатлик норма": 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000 лист/дона — mahsulot murakkabligiga bog'liq.
**Nega kerak:** Bir mashinada norma ish turiga qarab o'zgaradi (oddiy korobka 1500, murakkab 400); bitta o'rtacha norma adolatsiz baho beradi.
**Variantlar:**
- A) Norma mahsulot/murakkablik bo'yicha pog'onali (mashina × ish turi) — adolatli
- B) Bitta o'rtacha norma — sodda, qo'pol
- C) Keyin — norma taxminiy
  ↳ Agar A: murakkablikni kim belgilaydi? (A) texnolog texkartada B) usta smenada C) AI o'tmishdan)

### Q593. Brak%ni stansiya bo'yicha normalash ("брак %")
**Nima:** Kitobda har stansiyaga "брак %" maqbul foizi bor. MES har mashinaga ruxsat etilgan brak% chegarasini saqlasinmi.
**Nega kerak:** Kesimda 1% normal, lakda 5% bo'lishi mumkin; bitta umumiy chegara ba'zi mashinani noto'g'ri "yomon" qiladi.
**Variantlar:**
- A) Har mashinaga maqbul brak% + oshganda signal — adolatli sifat nazorati
- B) Butun sexga bitta brak% chegarasi — sodda
- C) Keyin — chegarasiz

### Q594. "ко-во работ" (bir smenada nechta turli ish) ko'rsatkichi
**Nima:** Normalar jadvalida "ко-во работ" bor — bir smenada nechta turli buyurtma/sozlash bo'lgani.
**Nega kerak:** Ko'p mayda ish = ko'p sozlash (changeover) = unum past; bu ko'rsatkich nima uchun smena sekin ketganini tushuntiradi.
**Variantlar:**
- A) Smenada ish soni + har biriga sozlash vaqti — sozlash yo'qotishini ko'rsatadi
- B) Faqat ishlar soni — yengil
- C) Keyin — kuzatilmaydi

### Q595. "переделка" (qayta ishlash) ni alohida yo'qotish qilish
**Nima:** Kitob izohi: "Колиб нотугри килинган - переделка 3 соат", "иш икки марта кайта урилган". Qayta ishlash vaqtini alohida yozish.
**Nega kerak:** Qayta ishlash brak ham, normal ish ham emas — yo'qotilgan vaqt; ajratmasa unum noto'g'ri yuqori va aybdor (qolib/sozlash) ko'rinmaydi.
**Variantlar:**
- A) "Qayta ishlash" alohida tur + sababi (qolib/sozlash/material) + soat — aniq yo'qotish
- B) Oddiy ishga qo'shish — sodda, yashirinadi
- C) Keyin — kuzatilmaydi

### Q596. Qolib (shtamp/forma) tayyor emasligini downtime sababi qilish
**Nima:** Kitob izohi: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". Qolib/forma kech tayyor bo'lishini alohida to'xtash sababi qilish.
**Nega kerak:** Bu tez-tez 4 soatlik yo'qotish; alohida sabab kodi "qolib kechikishi" takrorlanayotganini ko'rsatib KB/konstruktor bo'limiga signal beradi.
**Variantlar:**
- A) "Qolib/forma tayyor emas" alohida sabab kodi — KB bo'limiga ulanadi
- B) Umumiy "material kutish" ichida — yengil, aniq emas
- C) Keyin — erkin izoh

### Q597. Murakkab sozlash (настройка/приладка) ni alohida vaqt qilish
**Nima:** Kitob izohi: "Билма заказ настройкаси муракаб - вакт кетди"; formada "настройка"/"приладка"/"Настройка лак" alohida satrlar. Sozlash vaqtini ish vaqtidan ajratish.
**Nega kerak:** Sozlash = ishlab chiqarmagan vaqt (OEE Availability); ish vaqtiga qo'shsangiz unum past ko'rinadi, uzun sozlash yashiriladi.
**Variantlar:**
- A) Sozlash/приладка alohida bosqich + vaqti — OEE to'g'ri
- B) Ishga qo'shish — sodda, yashirinadi
- C) Keyin — ajratilmaydi

### Q598. Mashina remonti ("ремонтда") ni ishonchlilik hisobi bilan
**Nima:** Kitob izohi: "ремонтда". Remont sababli to'xtashni alohida tur + qaysi mashina ko'p buziladi hisobi.
**Nega kerak:** Ajratmasa mashina ishonchliligi (qaysi mashina ko'p remontda) ko'rinmaydi, profilaktika rejasi tuzilmaydi.
**Variantlar:**
- A) "Remont" alohida tur (rejali/avariya) + mashina ishonchliligi hisobi — profilaktikaga asos
- B) Umumiy mexanik to'xtash — yengil
- C) Keyin — erkin izoh

### Q599. Normani SOF ISH VAQTIGA hisoblash (tanaffus/tushlik/namoz chegirib)
**Nima:** Kun tartibi: tanaffus 10:00-10:20, tushlik 12:00-13:30 (har smena 30 daq), poldnik 16:00-16:20, namoz vaqtlari. MES normani hisoblashda bularni chegirsinmi.
**Nega kerak:** 12 soat − ~1.5 soat tanaffus = ~10.5 soat real ish; normani 12 soatga hisoblasangiz operator hech qachon bajarmaydi (adolatsiz).
**Variantlar:**
- A) Smenadan tanaffus/tushlik/namoz avto-chegiriladi → "sof ish vaqti" normaga asos — adolatli
- B) Norma 12 soatga, tanaffus hisobga olinmaydi — sodda, nohaq
- C) Keyin — tanaffus e'tiborsiz
⤳ Ta'sir: HR davomat + OEE Availability

### Q600. 3-smenali tushlikni navbat bilan boshqarish
**Nima:** Kun tartibida "3 сменалик тушлик 12:00-13:30 (хар бир смена учун 30 минут)" — tushlik 3 to'lqinda. MES kim qachon tushlikka chiqishini navbatlasinmi.
**Nega kerak:** Hamma birvarakay chiqsa mashina to'xtaydi; navbat bilan chiqsa to'xtamaydi — unumga to'g'ridan-to'g'ri ta'sir.
**Variantlar:**
- A) MES tushlik navbatini ko'rsatadi (1/2/3-to'lqin) — mashina to'xtamaydi
- B) Faqat tushlik vaqti yoziladi, navbat usta qo'lida — yengil
- C) Keyin — boshqarilmaydi

### Q601. Namoz tanaffusini sof-ish-vaqtdan ajratib hisobga olish
**Nima:** Kun tartibida namoz: peshin 12:45 dan 20 daq, asr 18:00 dan 10 daq, shom 20:00 dan 10 daq, "битта одам учун". MES bu chiqishlarni hisobga olsinmi.
**Nega kerak:** Egasi rasman namoz uchun vaqt ajratgan; operator normani bajarmasa "namozga ketdi" bahona bo'lmasligi uchun bu vaqt rasman chegiriladi.
**Variantlar:**
- A) Namoz vaqti sof-ish-vaqtdan chegiriladi (bittadan navbat) — adolatli + hurmat
- B) Umumiy tanaffusga qo'shiladi — sodda
- C) Keyin — alohida emas

### Q602. Mustaqil ishlash ruxsati = MES operatorlik huquqi (2021 ShVB siyosati)
**Nima:** 2021 hujjat: operator mustaqil ishlashdan oldin 2 oy amaliy mashg'ulot + nazariy/amaliy imtihon + RD-4 yozma xulosa kerak. MES'da faqat "mustaqil ruxsat olgan" xodim sessiya ocha olsinmi.
**Nega kerak:** Egasining rasmiy talabi — tayyorlanmagan xodim mashinaga o'tirsa brak + jarohat; tizim huquqsiz odamni bloklasa siyosat avtomatik amalda.
**Variantlar:**
- A) Faqat "mustaqil ruxsat" bayrog'i bor xodim sessiya ochadi (mashina turi bo'yicha) — siyosat avto-amalda
- B) Hamma ocha oladi, ruxsatsiz faqat belgilanadi — yumshoq
- C) Keyin — ruxsat tekshirilmaydi
⤳ Ta'sir: HR onboarding (устоз + imtixon) → MES operator huquqi

### Q603. Ustoz-shogird (мураббий) bog'lanishini MES'da ko'rsatish
**Nima:** 2021 hujjatda yangi xodimga "Мураббий"/устoz biriktiriladi (buyruqда ko'rsatiladi, 2 oy birga). MES'da shogird sessiyasini "ustoz nazoratida" deb belgilash.
**Nega kerak:** Shogird mustaqil emas — uning braki/normasi ustoz bilan baholanadi; ajratmasa shogird braki ustozning ko'rsatkichini buzadi.
**Variantlar:**
- A) Shogird sessiyasi "ustoz nazoratida" + natija ikkalasiga (o'qish davri) — adolatli baho
- B) Shogird oddiy operator — sodda, baho aralashadi
- C) Keyin — kuzatilmaydi
⤳ Ta'sir: HR mentorlik + razryad o'sishi

### Q604. Operator × mashina malaka matritsasi (qaysi mashinada ishlay oladi)
**Nima:** ShVB onboarding "mashina turi bo'yicha" amaliy imtixon. MES har operatorga qaysi mashinalarda mustaqil ishlay olishini saqlasinmi.
**Nega kerak:** KBA-105 da ishlaydigan tigeldа ishlay olmasligi mumkin; usta xodimni faqat huquqi bor mashinaga qo'ysa brak/xavf kamayadi.
**Variantlar:**
- A) Operator × mashina matritsasi (ishlay oladi/o'rganmoqda/yo'q) — to'g'ri biriktirish
- B) Faqat umumiy "operator" darajasi — sodda, mashina farqi yo'q
- C) Keyin — kuzatilmaydi

### Q605. "Согласовано РД-4 / Утверждено Ген.Директор" tasdiq zanjirini normaga
**Nima:** Normalar jadvali oxirida "Согласовано РД-4 (Юлчиев М.)" + "Утверждено Ген.Директор (Позилов А.)" imzolari. MES'da norma o'zgarishi shu ikki bosqichli tasdiqdan o'tsinmi.
**Nega kerak:** Norma = oylik/baho asosi; har kim o'zboshimcha o'zgartirsa adolatsizlik; rasmiy zanjir (RD-4 kelishadi → direktor tasdiqlaydi) oldini oladi.
**Variantlar:**
- A) Norma o'zgarishi RD-4 kelishuvi + direktor tasdig'idan o'tadi (versiya saqlanadi) — nazorat + tarix
- B) Faqat usta o'zgartiradi — tez, nazoratsiz
- C) Keyin — erkin o'zgaradi

### Q606. Norma versiyasi va sanasini saqlash ("Дата: 13.01.2022")
**Nima:** Normalar "НО 12-2, Дата 13.01.2022" sanasi bilan tasdiqlanadi. MES norma o'zgarganda eski versiyani sana bilan saqlasinmi.
**Nega kerak:** O'tgan smenani o'sha paytdagi norma bilan baholash kerak; norma bugun o'zgarsa kechagi natija eski norma bilan qolishi shart.
**Variantlar:**
- A) Norma versiyalanadi (amal sanasi bilan) — tarix to'g'ri
- B) Faqat joriy norma — sodda, o'tmish buziladi
- C) Keyin — versiyasiz

### Q607. Mahsulot kodlash formatini saqlash (2025-3499 / KT4438 / папка)
**Nima:** Buyurtma nomi: "2025-3499 Barbol pechenni karobka 33.5x24.5x12.5/17815/KT4438/T-24 marka" — yil-raqam + nom + o'lcham + папка раками + KT-kod + marka.
**Nega kerak:** Bu zavodning haqiqiy buyurtma identifikatori; usta KT4438 deb qidiradi; struktura buzilsa qidiruv/bog'lanish ishlamaydi.
**Variantlar:**
- A) To'liq struktura (yil-raqam / папка / KT-kod / o'lcham / marka) alohida maydonlar — qidiruv + bog'lanish
- B) Faqat erkin matn nom — sodda, qidirib bo'lmaydi
- C) Keyin — hozirgi kod qoladi
⤳ Ta'sir: SD buyurtma ↔ PP папка ↔ MES smena bog'lanishi

### Q608. "Укишга" / "Академияга" — o'quv ishlarini real natijadan ajratish
**Nima:** Formada "Укишга" va "Академияга" satr/ustun — o'quv/mashq maqsadidagi ishlab chiqarish (real buyurtma emas). MES bularni alohida belgilasinmi.
**Nega kerak:** O'quv ishi real buyurtma emas — uning braki/normasi haqiqiyga qo'shilmasligi kerak; aralashsa unum va tannarx buziladi.
**Variantlar:**
- A) "O'quv/Akademiya" alohida ish turi — real natijaga qo'shilmaydi — toza hisob
- B) Oddiy ish deb yoziladi — sodda, aralashadi
- C) Keyin — ajratilmaydi

### Q609. Gofra (2/5 qatlam) ishini м2 + qatlam bilan alohida hisoblash
**Nima:** Formada "ЛИНИЯ 5 слой", "Формат гофро (2-слой)", "Гф линия (м2)" — gofra м2 bilan o'lchanadi va qatlam soni (2/5 слой) muhim. MES gofrani м2 + qatlam bilan saqlasinmi.
**Nega kerak:** Gofra dona emas, м2 bilan o'lchanadi; qatlam materialni belgilaydi; donaga aylantirsangiz sarf va norma noto'g'ri.
**Variantlar:**
- A) Gofra liniyasi м2 + qatlam soni alohida — to'g'ri o'lchov + material
- B) Donaга aylantirib umumiy hisobga — sodda, noaniq
- C) Keyin — alohida emas

### Q610. "умумий сон / Брак сони / Соф махсулот" uchligini saqlash + avto-tekshirish
**Nima:** Formada uch son: "умумий сон", "Брак сони", "Соф махсулот" (sof = umumiy − brak). MES uchalasini ham yozsinmi.
**Nega kerak:** Sof = mijozga ketadigan, umumiy = ishlab chiqilgan, farqi = brak; bittasini qoldirsangiz Quality OEE hisoblanmaydi.
**Variantlar:**
- A) Umumiy + brak + sof (avto-tekshiriladi: sof = umumiy − brak) — to'liq + nazorat
- B) Faqat sof son — sodda, brak ko'rinmaydi
- C) Keyin — bitta son

### Q611. Smenani A/B/C harf-nomi bilan saqlash (kitobda "А смена")
**Nima:** Kitobda smenalar "А смена", "Б", "С" harf bilan (vaqt emas). MES smenani harf-nom bilan saqlasinmi (morning/afternoon o'rniga).
**Nega kerak:** Zavod "A smena" deydi, "ertalabki" demaydi; brigada doimiy A/B/C ga biriktirilgan; nom mos kelmasa usta chalkashadi.
**Variantlar:**
- A) Smena = A/B/C harf + vaqt oralig'i (sozlanadigan) — zavod tiliga mos
- B) Hozirgi morning/afternoon/night qoladi — kod o'zgarmaydi, zavod tili emas
- C) Keyin — o'zgartirilmaydi

### Q612. Brigadani doimiy A/B/C smenaga biriktirish (kitobdagi A-smena tarkibi)
**Nima:** Kitobda "А смена" doimiy operatorlar bilan (Тураходжаев, Маматалиев, Неъматов, Ходжаев...). MES brigadani doimiy A/B/C smenaga biriktirsinmi.
**Nega kerak:** Zavodda brigada doimiy smenaga bog'langan (rotatsiya bilan); har smenada qaytadan tuzmaydi; doimiy tarkib davomat + baho uchun barqaror.
**Variantlar:**
- A) Brigada → doimiy smena (A/B/C) + kunlik o'zgarish (kasallik/ta'til) qayd — barqaror + moslashuvchan
- B) Har smenada qaytadan — moslashuvchan, og'ir
- C) Keyin — biriktirish yo'q

### Q613. Smena reja-formasini smena BOSHIDA avto-tuzish (планировщик Исаков)
**Nima:** "А смена План" hozir Excel'da qo'lda tuziladi (Режалаштириш ходими Исаков). MES smena boshida shu rejani PP'dan avto-tuzsinmi.
**Nega kerak:** Qo'lda tuzish planlovchi vaqtini oladi; MES avto-tuzsa vaqt tejaladi va reja-fakt avto-bog'lanadi.
**Variantlar:**
- A) MES smena boshida reja-formani avto-tuzadi (PP rejasidan) + bosib chiqariladi — avto + bog'liq
- B) Planlovchi MES'da qo'lda tuzadi — yarim-avto
- C) Keyin — Excel'da qo'lda qoladi

### Q614. "Режалаштириш ходими" + "Технолог" imzosini smenaga biriktirish
**Nima:** Formada "Режалаштириш ходими: Исаков А" va "Технолог: Ёкубжонов С / Аслонов И" imzolari. MES smena rejasiga planlovchi + texnolog yozsinmi.
**Nega kerak:** Reja noto'g'ri (norma past/material yetmaydi) bo'lsa kim mas'ulligini bilish kerak; imzosiz reja egasiz.
**Variantlar:**
- A) Har smena rejasiga planlovchi + texnolog (mas'ul) — javobgarlik aniq
- B) Faqat smena ustasi — sodda
- C) Keyin — mas'ul yozilmaydi

### Q615. Qog'oz zayavkasini (Заявка бумаги) MES sarfiga bog'lash
**Nima:** "Заявка бумаги.xlsx" — qog'oz buyurtmasi (Формат, Грам, Кг, Лист размер А×В, Папка №, заказ). MES haqiqiy sarfni shu zayavka bilan bog'lasinmi.
**Nega kerak:** Zayavka = rejalashtirilgan material; MES = haqiqiy sarf; bog'lasa "zayavka qildik, qancha ishlatdik, qancha qoldi" ko'rinadi.
**Variantlar:**
- A) Zayavka → MES haqiqiy sarf → farq (ortiqcha/kam) — to'liq material nazorati
- B) Faqat MES sarfi, zayavkadan ayri — yengil
- C) Keyin — bog'lanmaydi
⤳ Ta'sir: Ombor (qog'oz zayavkasi) ↔ MES sarf ↔ tannarx

### Q616. Qog'oz formati (лист размер А×В) + grammni sessiyaga yozish
**Nima:** Zayavkada "Формат, Грам, Лист размер А, Лист размер В". MES sessiyada ishlatilgan qog'oz formati + grammajini yozsinmi.
**Nega kerak:** Bir mahsulot turli format/grammda chiqishi mumkin; yozilmasa material sarfi (kg) noto'g'ri.
**Variantlar:**
- A) Sessiyada format (А×В) + gramm + kg yoziladi — aniq material sarfi
- B) Faqat material turi — yengil, kg noaniq
- C) Keyin — format yozilmaydi

### Q617. "Прошло (дней)" — buyurtma necha kun kutganini ko'rsatish
**Nima:** Zayavkada "Прошло (дней)" — buyurtma necha kundan beri kutmoqda. MES buyurtma rejaga tushganidan necha kun o'tganini ko'rsatsinmi.
**Nega kerak:** Uzoq kutgan buyurtma = mijoz norozi xavfi; ustaga ko'rinsa eski ishni avval qiladi.
**Variantlar:**
- A) Har buyurtmada "necha kun kutdi" + muddat-oshgan ranglanadi — kechikish ko'rinadi
- B) Faqat sana — usta o'zi hisoblaydi
- C) Keyin — kuzatilmaydi

### Q618. "Зарур заказлар" (shoshilinch) ni navbatda oldinga chiqarish
**Nima:** Formada "ЗАРУР ЗАКАЗЛАР" alohida ro'yxat — shoshilinch/prioritetli ishlar. MES shoshilinchni belgilab navbatda oldinga chiqarsinmi.
**Nega kerak:** Shoshilinch ish turib qolsa mijoz yo'qoladi; ajratilsa usta avval shularni qiladi.
**Variantlar:**
- A) Shoshilinch bayroq + navbatda yuqoriga + signal — muddat saqlanadi
- B) Faqat izohda "zarur" — usta o'zi e'tibor beradi
- C) Keyin — prioritet yo'q

### Q619. Bitta buyurtmaning mashinalararo marshrutini kuzatish
**Nima:** Formada bitta buyurtma ketma-ket: Печать → Ламинация → Высечка → Тигель → ФСМ/Склейка → Степлер → Упаковка. MES buyurtmaning mashinalararo o'tishini kuzatsinmi.
**Nega kerak:** Korobka 5-6 mashinadan o'tadi; qaysi bosqichda turib qolganini bilmasa "buyurtma qayerda?" javobsiz qoladi.
**Variantlar:**
- A) Buyurtma marshruti (qaysi mashina, qaysi bosqich, qancha tayyor) jonli — to'liq ko'rinish
- B) Faqat oxirgi bosqich — yengil, oraliq ko'rinmaydi
- C) Keyin — kuzatilmaydi
⤳ Ta'sir: PP routing ↔ MES bosqich ↔ buyurtma holati

### Q620. Bosqichlararo yarim tayyor qoldiqni (bottleneck) ko'rsatish
**Nima:** Печать tugab Ламинацияга o'tishida yarim tayyor (lист) o'tadi. MES bir bosqich chiqishi keyingi kirishi bo'lishini (oraliq qoldiq) yozsinmi.
**Nega kerak:** Bosqichlar orasida yarim tayyor to'planib qolsa (печать ko'p, ламинация sekin) "qoq joy" ko'rinadi; ko'rinmasa nima uchun sekin bilinmaydi.
**Variantlar:**
- A) Har bosqich oraliq qoldig'i (kutayotgan yarim tayyor) ko'rsatiladi — bottleneck ko'rinadi
- B) Faqat boshlanish va oxir — yengil
- C) Keyin — kuzatilmaydi

### Q621. Tanaffus markerini (УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК) jadvalda avto-ko'rsatish
**Nima:** Formada vaqt jadvalida "УЖИН", "ОБЕД", "Тушлик", "ПОЛДНИК" markerlari (ish oqimida tanaffus joyi). MES ish jadvalida tanaffusni avto-belgilab normaga moslasinmi.
**Nega kerak:** Forma tushlikni ish satriga belgilaydi (operator qachon chiqishini biladi); MES shu markerni saqlasa norma + jonli kuzatuv tanaffusni hisobga oladi.
**Variantlar:**
- A) Tanaffus markerlari jadvalda avto-ko'rinadi + normadan chegiriladi (Q19/Q20 bilan) — bog'langan
- B) Faqat umumiy tanaffus vaqti — sodda
- C) Keyin — marker yo'q

### Q622. Bir mashina ikki bo'limda (Флексо vs Упаковка) ishlashini ajratish
**Nima:** Formada "ФСМ Флексо" va "ФСМ ФЛЕКСО Упаковка", "Степлер ... ФЛЕКСО" va "...УПАКОВКА" — bitta mashina turi ikki bo'limда. MES buni ajratsinmi.
**Nega kerak:** ФСМ flekso bo'limida ham, qadoq bo'limida ham bor — natija qaysi bo'limga yozilishini ajratmasa hisobot aralashadi.
**Variantlar:**
- A) Mashina + bo'lim (Flekso/Upaковка) birikmasi alohida birlik — to'g'ri yozish
- B) Faqat mashina turi — sodda, aralash
- C) Keyin — ajratilmaydi

### Q623. "Kim hozir qaysi mashinada" jonli bandlik jadvali
**Nima:** Formada har operator ismi mashina yonida (Холматов М → Трафарет Лак, Шералиева М → Эмбоссинг). MES "kim hozir qaysi mashinada" jonli ko'rsatsinmi.
**Nega kerak:** Usta SOS/ish-yo'q bo'lganda kimni ko'chirishni bilishi kerak; jonli bandlik ko'rinmasa qo'lda so'rab yuradi.
**Variantlar:**
- A) Jonli "operator → mashina" jadvali (band/bo'sh) — tez qaror
- B) Faqat smena boshidagi biriktirilish — kun davomida o'zgarmaydi
- C) Keyin — kuzatilmaydi

### Q624. Bir operator bir vaqtda bir necha mashina yuritishini qayd qilish
**Nima:** Formada ba'zan bitta operator bir necha tigel/stansiyani yuritadi (Холматов М ikki normada). MES bir operatorni bir vaqtda bir necha mashinaga biriktirishni ruxsat bersinmi.
**Nega kerak:** Kichik mashinalarda (tigel) bitta operator 2-3 tasini yuritadi; bittaga cheklasangiz haqiqatga zid, lekin natija qaysi mashinaga ekani noaniq qoladi.
**Variantlar:**
- A) Operator bir necha mashinaga (foiz/vaqt ulushi bilan) — haqiqatga mos
- B) Bitta operator = bitta mashina (qattiq) — sodda, cheklangan
- C) Keyin — cheklov yo'q, natija aralashadi

### Q625. Yakuniy qadoqlash (упаковка 1 сотрудник) ni alohida bosqich/norma qilish
**Nima:** Formada "упаковка (1 сотрудник)" alohida norma (норма штук за 12 часов). MES qadoqlashni alohida bosqich + norma qilsinmi.
**Nega kerak:** Qadoqlash oxirgi bosqich, alohida ishchi (1 sotrudnik) qiladi; uning normasi/unumi alohida o'lchanmasa "tayyor mahsulot necha kunda qadoqlanadi" ko'rinmaydi.
**Variantlar:**
- A) Qadoqlash alohida bosqich + norma (1 ishchi/12 soat) — to'liq oxirgi bosqich
- B) Ishlab chiqarishga qo'shiladi — sodda
- C) Keyin — ajratilmaydi

### Q626. Smena yig'masini (выполнено за смену / норма% / брак%) avto-tuzish
**Nima:** Normalar jadvalida "выполнено за смену", "отработано часов", "иш %", "норма %" yig'ma satrlar (Махмудов/Юлчиев imzolaydi). MES smena oxirida avto-yig'sinmi.
**Nega kerak:** Hozir usta qo'lda yig'adi; MES avto-yig'sa xato kamayadi va darhol tayyor.
**Variantlar:**
- A) Smena oxirida avto-yig'ma (bajarildi / soat / norma% / brak%) — tayyor hisobot
- B) Usta qo'lda yig'adi, MES saqlaydi — yarim-avto
- C) Keyin — qog'ozda qo'lda

### Q627. НО 12-1 / НО 12-2 mas'ulini (Юсупов/Махмудов) hisobotга biriktirish
**Nima:** Normalar jadvalida mas'ullar: "НО 12-2: Юсупов Ильдар", "НО 12-1: Махмудов М.М". MES smena hisobotini shu mas'ullarga biriktirsinmi.
**Nega kerak:** Har bo'lim (flekso/ofset) o'z НО-mas'uli bor; hisobot egasiz bo'lsa kim javobgar noaniq; mas'ul biriktirilsa eskalatsiya aniq.
**Variantlar:**
- A) Har bo'lim hisobotiga НО-mas'ul (lavozim kartasi) biriktiriladi — javobgarlik + eskalatsiya
- B) Faqat smena ustasi — sodda
- C) Keyin — mas'ul yozilmaydi
⤳ Ta'sir: Org-struktura (НО lavozimlari) ↔ MES hisobot egasi

### Q628. Norma bajarilmasa MAJBURIY sabab so'rash (kitobdagi izoh madaniyati)
**Nima:** Kitobda har norma-buzilishiga sabab yozilgan ("иш йук", "ремонт", "переделка", "настройка"). MES norma <chegara bo'lganda operator/ustadan majburiy sabab so'rasinmi.
**Nega kerak:** Sababsiz "norma bajarilmadi" — operator aybdormi sharoit aybdormi noaniq; majburiy sabab adolatli baho + takror muammoni topish.
**Variantlar:**
- A) Norma <chegara bo'lsa sabab majburiy (tayyor ro'yxat + izoh) — adolatli + tahlil
- B) Sabab ixtiyoriy — yengil, ko'pincha bo'sh qoladi
- C) Keyin — so'ralmaydi
  ↳ Agar A: sababni kim tasdiqlaydi? (A) usta tasdiqlaydi B) avto-qabul C) НО-mas'ul ko'radi)

### Q629. AI kunlik smena xulosasi (kitobdagi sabab izohlaridan)
**Nima:** AI smena yig'masidan (norma%, brak%, ish-yo'q, переделка, sabab izohlari) kunlik tushunarli xulosa yozsin — qaysi mashina/brigada yaxshi, qayerda eng ko'p vaqt yo'qoldi, takror sabab.
**Nega kerak:** Egasi har Excel'ni o'qiy olmaydi; AI "bugun ofsetda 6 soat ish-yo'q, sababi rejalashtirish" deb xulosa qilsa qaror tez bo'ladi (kitobdagi izohlar aynan shu uchun yozilgan).
**Variantlar:**
- A) AI kunlik xulosa (top yo'qotish + brigada reytingi + takror sabab + tavsiya) — egaga tayyor qaror
- B) AI faqat raqamlarni jamlaydi — yengil
- C) Keyin — AI xulosa yo'q
⤳ Ta'sir: AI nazoratchi ↔ egaga kunlik hisobot ↔ org-baholash

### Q630. IoT'siz, faqat operator kiritishi bilan ishga tushirish (Excel → MES)
**Nima:** Zavodda hozir IoT sensor yo'q — hamma ma'lumot qo'lda Excel'ga yoziladi. MES dastlab to'liq qo'lda (operator boshlash/tugatish/brak/sabab kiritadi) ishlasinmi, IoT keyin.
**Nega kerak:** "Avto-sensor" da'vosi haqiqatga zid — zavod qog'ozda ishlaydi; qo'lda ishlaydigan qilib qursangiz darhol foydalanish boshlanadi, IoT keyin qo'shiladi.
**Variantlar:**
- A) To'liq qo'lda kiritish (sensor shart emas) + keyin IoT qo'shilsa avtomatik — bugundan ishlaydi
- B) IoT'ni kutib turish — to'g'ri, lekin uzoq, hozir foydasi yo'q
- C) Keyin — hozirgi holat qoladi

### Q631. Excel'dan o'tish davri (1-2 oy parallel) — qog'oz + MES birga
**Nima:** Zavod 5 yil Excel'da ishlagan; MES'ga o'tishda bir muddat ikkalasi parallel ishlasinmi (qog'oz forma + MES) yoki darhol faqat MES.
**Nega kerak:** Darhol qog'ozni tashlasa usta qarshilik qiladi/ma'lumot yo'qoladi; parallel davr ishonchni quradi, lekin ikki marta ish.
**Variantlar:**
- A) Parallel davr (1-2 oy qog'oz + MES) → ishonch qurilgach faqat MES — xavfsiz o'tish
- B) Darhol faqat MES — tez, lekin xavfli/qarshilik
- C) Keyin — o'tish rejasi keyin

### Q632. Tasdiqlangan o'lchov birligini master-data qilish ("ед.изм" RD-4 + direktor)
**Nima:** Normalar jadvalida "ед.изм" har stansiyaga aniq (м2/лист/штук/удар-лист) va RD-4 + direktor tasdig'i bilan. MES stansiya × birlikni tasdiqlangan master-data qilsinmi.
**Nega kerak:** Birlik har joyda bir xil bo'lishi shart (norma, sarf, hisobot bir tilda); tasdiqlangan birlik bo'lmasa har modul boshqa birlik ishlatadi.
**Variantlar:**
- A) Stansiya × tasdiqlangan birlik master-data (RD-4 + direktor) — yagona til
- B) Birlik erkin tanlanadi — moslashuvchan, nomuvofiq
- C) Keyin — standartlashtirilmaydi

DONE: MES / Ishlab chiqarish — 52.

## 9. QC / Sifat

### Q633. Sifat ko'rsatkichlari ro'yxati
**Nima:** Karton uchun qaysi fizik ko'rsatkichlarni o'lchaymiz va tizimga kiritamiz (zichlik g/m², namlik %, mustahkamlik va h.k.).
**Nega kerak:** Agar ko'rsatkichlar ro'yxati aniq bo'lmasa, har laborant turlicha o'lchaydi va solishtirib bo'lmaydi.
**Variantlar:**
- A) To'liq ro'yxat: zichlik (gramaj g/m²), namlik (%), RCT (qirra mustahkamligi), BCT (quti mustahkamligi), SCT, Bursting (yorilish, kPa), qalinlik (mkm), qatlam soni — har biri alohida maydon — to'liq nazorat, lekin laborant ko'p kiritadi
- B) Faqat asosiy 3 ta: gramaj, namlik, yorilish mustahkamligi — tez, lekin BCT/RCT yo'qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (har stanok chiqishida o'lchash), Ombor (kirim sifati), Reklamatsiya (dalil)

### Q634. GOST / standart bog'lash
**Nima:** Har mahsulot turiga qaysi standart (GOST, TU yoki ichki norma) biriktirilishi va chegaralar shu standartdan olinishi.
**Nega kerak:** Mijoz "qaysi GOST bo'yicha?" deb so'raydi; standartsiz sertifikat yozib bo'lmaydi.
**Variantlar:**
- A) Har mahsulot kartasiga standart maydoni (GOST 7376, GOST 7933, TU yoki "ichki norma") + shu standart bo'yicha min/max chegaralar avtomatik tortiladi — aniq va hujjatli
- B) Faqat umumiy "ichki norma" jadvali, GOST raqamisiz — soddaroq, lekin mijozga isbot zaif
- C) Keyin — hozir kerak emas

### Q635. Chegara qiymatlari (min/max) va o'lchov birligi
**Nima:** Har ko'rsatkich uchun ruxsat etilgan eng past/eng yuqori qiymat va birlik (masalan gramaj 125 g/m² ±5%).
**Nega kerak:** Tizim avtomatik "o'tdi / o'tmadi" deyishi uchun aniq raqam kerak.
**Variantlar:**
- A) Har ko'rsatkichga: nominal qiymat + min + max + dopusk (% yoki absolyut) + birlik — avtomatik baho beradi
- B) Faqat min/max, dopusksiz — soddaroq, lekin "nominaldan og'ish" ko'rinmaydi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: dopusk foizda (±5%) yoki aniq raqamda (±6 g/m²) saqlansinmi? — Variantlar: A) ikkalasi ham qo'llab-quvvatlanadi B) faqat foiz C) faqat absolyut

### Q636. Namlik mavsumiy chegarasi
**Nima:** Karton namligi yoz/qish, havo namligiga qarab boshqacha bo'ladi — tizim mavsumiy normani hisobga olsinmi.
**Nega kerak:** Yozda 8% namlik normal, qishda 6% ham ko'p bo'lishi mumkin; bitta qattiq chegara noto'g'ri brak beradi.
**Variantlar:**
- A) Namlik normasi diapazon sifatida (masalan 6-9%) + ogohlantirish zonasi (5-6% va 9-10%) — moslashuvchan
- B) Bitta qattiq raqam (masalan max 8%) — sodda, lekin noto'g'ri rad etish bo'ladi
- C) Keyin — hozir kerak emas

### Q637. O'lcham va geometriya nazorati
**Nima:** Quti/varaq o'lchamlari (uzunlik, eni, balandlik, klapan), to'g'riburchaklik, bigovka (buklanish chizig'i) joyi nazorat qilinishi.
**Nega kerak:** O'lcham 2-3 mm chetga chiqsa, quti yopilmaydi yoki mashinada yig'ilmaydi — mijoz qaytaradi.
**Variantlar:**
- A) Har buyurtmaga geometrik dopusk (±1 mm yoki ±2 mm) + diagonal/to'g'riburchaklik tekshiruvi — aniq
- B) Faqat "ko'z bilan ko'rib" tasdiq, raqamsiz — tez, lekin nizoda dalil yo'q
- C) Keyin — hozir kerak emas

### Q638. Bosma/rang sifati ko'rsatkichi
**Nima:** Bosma rangi, registratsiya (rang to'g'ri tushishi), Pantone mosligi, surilish/iz nazorati alohida ko'rsatkich bo'lsinmi.
**Nega kerak:** Karton mustahkam, lekin logotip rangi noto'g'ri bo'lsa ham mijoz qaytaradi — bu alohida brak turi.
**Variantlar:**
- A) Bosma sifati alohida blok: rang mosligi (etalon namuna bilan), registratsiya og'ishi (mm), iz/dog' bor-yo'qligi — to'liq
- B) Faqat "bosma OK/brak" bayrog'i — sodda, lekin sabab ko'rinmaydi
- C) Keyin — hozir kerak emas

---

## 2-bo'lim. Brak turlari ro'yxati

### Q639. Brak sabablari klassifikatori
**Nima:** Brakning sabablari uchun tayyor ro'yxat (klassifikator) — laborant ro'yxatdan tanlaydi, qo'lda yozmaydi.
**Nega kerak:** "Brak" deb yozish foydasiz; sababni sanab bo'lmasa, qaysi muammo ko'p ekanini bilmaymiz.
**Variantlar:**
- A) Tayyor ro'yxat: delaminatsiya (qatlam ajralishi), namlik, gramaj og'ishi, qiyshiq bigovka, rang nomutanosibligi, qirqim noto'g'ri, yelimlanmagan, ezilgan/g'ijim, dog'/iflos, qatlam teshigi, hidi — kengaytiriladigan ro'yxat — tahlil oson
- B) Erkin matn yozish — tez, lekin statistika yig'ib bo'lmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (qaysi stanok ko'p brak beradi), HR (qaysi smena), Finance (brak qiymati)

### Q640. Brak darajasi (jiddiylik)
**Nima:** Har brakning og'irligini belgilash: kritik (mijozga ketmaydi), katta, kichik (kosmetik).
**Nega kerak:** Bitta dog' bilan butun partiyani rad etish noto'g'ri; jiddiylik darajasi qaror beradi.
**Variantlar:**
- A) 3 daraja: kritik / katta / kichik — har birining AQL (qabul chegarasi) alohida — adolatli qaror
- B) Faqat "brak / yaroqli" — sodda, lekin kichik nuqson ham butun partiyani yo'qotadi
- C) Keyin — hozir kerak emas

### Q641. Brak topilgan bosqich
**Nima:** Brak qaysi bosqichda topilganini yozish: xom-ashyo kirimi, ishlab chiqarish jarayoni, tayyor mahsulot, mijozdan qaytgan.
**Nega kerak:** Brak qayerda paydo bo'lganini bilmasak, kimni javobgar qilishni va qayerni tuzatishni bilmaymiz.
**Variantlar:**
- A) Bosqich maydoni majburiy: kirim / jarayon / tayyor mahsulot / mijoz reklamatsiyasi + topgan xodim — javobgarlik aniq
- B) Faqat "tayyor mahsulotda" deb belgilash — kam ma'lumot
- C) Keyin — hozir kerak emas

### Q642. Brak miqdori va birligi
**Nima:** Brak nechta dona / necha m² / necha kg ekanini va umumiy partiyaga nisbatan foizini yozish.
**Nega kerak:** "Brak bor" yetarli emas; 5 dona va 5000 dona — butunlay boshqa qaror.
**Variantlar:**
- A) Brak miqdori (dona/m²/kg) + partiya hajmi + brak foizi avtomatik hisoblanadi — aniq tahlil
- B) Faqat dona soni — sodda, lekin foiz ko'rinmaydi
- C) Keyin — hozir kerak emas

### Q643. Brak bilan nima qilish (qaror)
**Nima:** Brak topilgach uning taqdiri: utilizatsiya (chiqindi), qayta ishlash (makulatura), tuzatib sotish, chegirma bilan sotish.
**Nega kerak:** Brak puli yo'qolmasin — bir qismi makulaturaga, bir qismi 2-sortga ketishi mumkin.
**Variantlar:**
- A) Har brakka qaror maydoni: utilizatsiya / qayta ishlash / 2-sort / tuzatish / chegirma — har biri Ombor va Finance'ga bog'lanadi — pul yo'qolmaydi
- B) Faqat "chiqindiga" — sodda, lekin makulatura/2-sort daromadi yo'qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (makulatura kirimi), Finance (yo'qotish qiymati), Ishlab chiqarish (qayta ishlash zakaz)

### Q644. Brak sababini stanok/smena/operatorga bog'lash
**Nima:** Har brak yozuvini qaysi stanok, qaysi smena, qaysi operator chiqargani bilan bog'lash.
**Nega kerak:** Oyiga kim ko'p brak bermoqda — bonus/jarima va o'qitish shu asosida bo'ladi.
**Variantlar:**
- A) Brakka stanok + smena + operator avtomatik bog'lanadi (ish topshirig'idan) — adolatli baho
- B) Qo'lda kiritiladi yoki bo'sh qoldiriladi — tez, lekin tahlil zaif
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Payroll (brak jarimasi/bonus), Ishlab chiqarish (stanok tahlili)

---

## 3-bo'lim. Reklamatsiya jarayoni va muddat

### Q645. Reklamatsiya ochish maydonlari
**Nima:** Mijoz shikoyati (reklamatsiya) ochilganda yoziladigan maydonlar: mijoz, buyurtma/partiya raqami, sana, muammo tavsifi, dalil (foto), miqdor, talab.
**Nega kerak:** Yarim ma'lumot bilan shikoyatni tekshirib bo'lmaydi; partiya raqamisiz qaysi mahsulot ekanini topib bo'lmaydi.
**Variantlar:**
- A) To'liq forma: mijoz + buyurtma № + partiya № + sana + brak turi (klassifikatordan) + miqdor + foto + mijoz talabi (qaytarish/almashtirish/chegirma) — to'liq dalil
- B) Faqat matnli izoh + mijoz — tez, lekin tekshirish qiyin
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv/SD (mijoz tarixi), Finance (kompensatsiya), Ishlab chiqarish (sabab tahlili)

### Q646. Reklamatsiya holatlari (status)
**Nima:** Reklamatsiya qaysi bosqichlardan o'tishi: yangi → ko'rib chiqilmoqda → tasdiqlandi → rad etildi → hal qilindi → yopildi.
**Nega kerak:** Status bo'lmasa, qaysi shikoyat osilib qolganini bilmaymiz; mijoz "javob yo'q" deydi.
**Variantlar:**
- A) Aniq status zanjiri: Yangi / Tergovda / Tasdiqlandi / Rad etildi / Hal qilinmoqda / Yopildi — har o'tishda sana+mas'ul — kuzatuv aniq
- B) Faqat "ochiq / yopiq" — sodda, lekin oraliq ko'rinmaydi
- C) Keyin — hozir kerak emas

### Q647. Javob berish muddati (SLA)
**Nima:** Reklamatsiyaga necha kunda javob berish va hal qilish kerakligi (muddat normasi).
**Nega kerak:** Muddatsiz shikoyat haftalab osilib qoladi, mijoz ketadi.
**Variantlar:**
- A) Bosqichli muddat: birinchi javob 1 ish kuni, tergov 3 kun, yakuniy hal 10 kun — muddat o'tsa avtomatik ogohlantirish — intizom
- B) Bitta umumiy muddat (masalan 7 kun) — sodda, lekin bosqichlar nazoratsiz
- C) Keyin — hozir kerak emas
  - ↳ Agar A: muddat o'tib ketsa kimga eskalatsiya ketadi? — Variantlar: A) sifat boshlig'i + direktor B) faqat sifat boshlig'i C) eskalatsiya yo'q

### Q648. Reklamatsiya qabul muddati (kafolat oynasi)
**Nima:** Mijoz tovarni olganidan keyin necha kun ichida shikoyat qila olishi (masalan 10 kun, 30 kun).
**Nega kerak:** Cheksiz kafolat bo'lsa, mijoz oylardan keyin "namlik o'tib ketdi" deb qaytaradi — bu zavod aybi emas.
**Variantlar:**
- A) Mahsulot turiga qarab muddat: standart 14 kun, namlik shikoyati 7 kun — muddatdan keyin avtomatik rad — adolatli
- B) Hamma uchun bitta muddat (masalan 30 kun) — sodda
- C) Keyin — hozir kerak emas

### Q649. Reklamatsiya natijasi va kompensatsiya
**Nima:** Shikoyat tasdiqlangach: bepul almashtirish, qaytarib pul berish, chegirma, kreditga olib qo'yish — qaysi yo'l.
**Nega kerak:** Natija aniq yozilmasa, Finance bilan nizo chiqadi; takrorlanadigan kompensatsiyalar ko'rinmaydi.
**Variantlar:**
- A) Natija maydoni: almashtirish (yangi zakaz ochadi) / pul qaytarish / chegirma % / keyingi buyurtmaga kredit — har biri Finance'ga avtomatik bog'lanadi — shaffof
- B) Faqat izohda yoziladi — sodda, lekin moliya bog'lanmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (kompensatsiya xarajati), Sotuv (yangi almashtirish zakaz), Ombor (qaytgan tovar)

### Q650. Tub sabab tahlili (8D / 5 nega)
**Nima:** Tasdiqlangan jiddiy reklamatsiyada tub sababni topish va oldini olish chorasini yozib qo'yish majburiyligi.
**Nega kerak:** Sabab topilmasa, xuddi shu brak yana takrorlanadi — mijoz ikkinchi marta ketadi.
**Variantlar:**
- A) Kritik/katta reklamatsiyaga majburiy: tub sabab + tuzatuvchi chora + mas'ul + bajarish sanasi — takror oldini oladi
- B) Tub sabab ixtiyoriy — tez, lekin muammo qaytadi
- C) Keyin — hozir kerak emas

---

## 4-bo'lim. Bosqichli tasdiq (dizayn / texnik / QC)

### Q651. Tasdiq bosqichlari ketma-ketligi
**Nima:** Buyurtma ishlab chiqarishga ketishidan oldin qaysi bo'limlar tasdiqlashi: dizayn → texnolog → sifat → ishlab chiqarish.
**Nega kerak:** Tasdiqsiz boshlansa, noto'g'ri o'lcham/rang bilan butun partiya brak bo'ladi.
**Variantlar:**
- A) Majburiy zanjir: Dizayn maketi → Texnolog (material/karton mosligi) → QC (namuna) → ishlab chiqarish ochiladi — har biri imzo+sana — xato oldini oladi
- B) Faqat dizayn tasdiqi, qolgani og'zaki — tez, lekin texnik xato o'tib ketadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (zakaz faqat tasdiqdan keyin ochiladi), Dizayn, Sotuv

### Q652. Mijoz maketni tasdiqlashi
**Nima:** Bosmadan oldin mijoz maket/namunani imzolab tasdiqlashi (kelishuv namunasi) va u tizimda saqlanishi.
**Nega kerak:** Mijoz keyin "rangni boshqacha kutgandim" desa, imzolangan maket dalil bo'ladi.
**Variantlar:**
- A) Mijoz tasdiqi majburiy: tasdiqlangan maket fayli + sana + mijoz imzosi/roziligi saqlanadi — nizoda himoya
- B) Ichki tasdiq yetarli, mijozsiz — tez, lekin mijoz bilan nizo xavfi
- C) Keyin — hozir kerak emas

### Q653. Tasdiqlamaslik (rad etish) sababi
**Nima:** Bosqich tasdiqlanmasa (masalan QC namunani rad etsa), sabab va qaytarish manzili (kimga) yozilishi.
**Nega kerak:** Rad etish sababsiz bo'lsa, dizayner nimani tuzatishni bilmaydi — vaqt yo'qoladi.
**Variantlar:**
- A) Rad etishda majburiy: sabab (klassifikatordan) + izoh + kimga qaytadi + qayta yuborish muddati — aniq aylanish
- B) Faqat "rad etildi" tugmasi — sodda, lekin sabab yo'q
- C) Keyin — hozir kerak emas

### Q654. Birinchi namuna tasdiqi (first article)
**Nima:** Yangi buyurtmada birinchi tayyor namuna (birinchi dona) QC tomonidan tasdiqlangach to'liq tirajga ruxsat berilishi.
**Nega kerak:** Birinchi donani tekshirmasdan 10000 dona bossak, xato bo'lsa hammasi brak.
**Variantlar:**
- A) Majburiy: birinchi namuna o'lcham+rang+mustahkamlik bo'yicha tasdiqlanmaguncha tiraj to'xtaydi — katta brakdan saqlaydi
- B) Faqat takroriy buyurtmalarda o'tkazib yuboriladi — moslashuvchan
- C) Keyin — hozir kerak emas

### Q655. Tasdiqlash huquqi (kim tasdiqlaydi)
**Nima:** Har bosqichni kim tasdiqlay olishi (rol/lavozim) va o'rinbosari kimligi.
**Nega kerak:** Tasdiqlovchi yo'q bo'lsa (ta'tilda), buyurtma to'xtab qoladi.
**Variantlar:**
- A) Har bosqichga asosiy tasdiqlovchi + o'rinbosar (lavozim bo'yicha) — to'xtab qolmaydi
- B) Faqat bitta shaxs — sodda, lekin u yo'q bo'lsa blok
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Org-struktura (lavozim bo'yicha huquq)

---

## 5-bo'lim. Namuna olish qoidasi (sampling)

### Q656. Namuna olish usuli
**Nima:** Partiyadan necha dona namuna olinishi — AQL standart (GOST/ISO 2859), foiz, yoki belgilangan son.
**Nega kerak:** Har laborant turlicha namuna olsa, natija solishtirib bo'lmaydi va adolatsiz brak chiqadi.
**Variantlar:**
- A) AQL jadval bo'yicha (partiya hajmiga qarab namuna soni avtomatik) — xalqaro standart, adolatli
- B) Doimiy foiz (har partiyadan masalan 2%) — sodda, lekin kichik partiyada kam namuna
- C) Keyin — hozir kerak emas

### Q657. Namuna olish nuqtalari
**Nima:** Namuna qayerdan olinadi: partiya boshi/o'rta/oxiri, har rulondan, har palettadan.
**Nega kerak:** Faqat partiya boshidan olsak, oxiridagi brak ko'rinmay qoladi.
**Variantlar:**
- A) Bosh + o'rta + oxir (yoki har N-rulon) qoidasi — ishonchli qamrov
- B) Faqat tasodifiy nuqta — tez, lekin sistemali brak yo'qoladi
- C) Keyin — hozir kerak emas

### Q658. Qabul/rad chegarasi (AQL Ac/Re)
**Nima:** Namunada nechta nuqson topilsa partiya qabul qilinadi (Ac) yoki rad etiladi (Re).
**Nega kerak:** Aniq raqam bo'lmasa, "2 ta brak ko'pmi?" degan savolda har kim turlicha qaror qiladi.
**Variantlar:**
- A) AQL bo'yicha har jiddiylik darajasiga alohida Ac/Re (kritik 0, katta 1, kichik 3) — adolatli avtomatik qaror
- B) Bitta umumiy "5% dan ko'p bo'lsa rad" qoidasi — sodda
- C) Keyin — hozir kerak emas

### Q659. Kuchaytirilgan/yengillashtirilgan nazorat
**Nima:** Avvalgi partiyalar yaxshi bo'lsa namunani kamaytirish, brak chiqsa kuchaytirish (ISO 2859 logikasi).
**Nega kerak:** Ishonchli mijoz/material uchun ortiqcha tekshiruv vaqt yo'qotadi; muammoli uchun esa qattiqroq kerak.
**Variantlar:**
- A) 3 rejim: oddiy / kuchaytirilgan (ketma-ket brakdan keyin) / yengil (ketma-ket yaxshidan keyin) avtomatik o'tadi — aqlli nazorat
- B) Doimo bitta rejim — sodda, lekin moslashmaydi
- C) Keyin — hozir kerak emas

### Q660. Namuna saqlash (arxiv namuna)
**Nima:** Har partiyadan bir namuna (etalon) belgilangan muddat saqlanishi (masalan 6 oy) — reklamatsiyada solishtirish uchun.
**Nega kerak:** Mijoz "siz boshqa karton berdingiz" desa, saqlangan namuna haqiqatni ko'rsatadi.
**Variantlar:**
- A) Har partiyaga arxiv namuna majburiy + saqlash muddati + joylashuv (javon/yacheyka) tizimda — nizoda dalil
- B) Faqat muammoli partiyalardan — tejamkor, lekin ba'zida dalil yo'q
- C) Keyin — hozir kerak emas

### Q661. Xom-ashyo kirimida namuna
**Nima:** Yetkazib beruvchidan kelgan karton/qog'oz/yelim/bo'yoq kirimida namuna olish va tekshirish qoidasi.
**Nega kerak:** Yomon xom-ashyodan yaxshi mahsulot chiqmaydi — kirimda ushlamasak, brak ishlab chiqarishda chiqadi.
**Variantlar:**
- A) Har kirim partiyasidan namuna: gramaj+namlik+mustahkamlik tekshiriladi, o'tmasa qabul to'xtaydi — manbadan himoya
- B) Faqat hujjat (sertifikat) bo'yicha qabul, o'lchovsiz — tez, lekin ishonch yetkazuvchiga
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (kirim bloki), Ta'minot/Vendor (yetkazuvchi reytingi)

---

## 6-bo'lim. Sertifikat maydonlari

### Q662. Sifat sertifikati (pasport) maydonlari
**Nima:** Mahsulot bilan beriladigan sifat sertifikati/pasportida qaysi ma'lumotlar bo'lishi.
**Nega kerak:** Mijoz (ayniqsa oziq-ovqat/eksport) sertifikatsiz tovarni qabul qilmaydi.
**Variantlar:**
- A) To'liq: sertifikat №, sana, mijoz, mahsulot nomi, partiya №, miqdor, GOST/TU, o'lchangan ko'rsatkichlar (gramaj/namlik/mustahkamlik), natija, laborant, QR/imzo — to'liq hujjat
- B) Faqat partiya № + "sifat tasdiqlandi" yozuvi — sodda, lekin yetarli emas
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv/SD (yetkazishga qo'shiladi), Ombor (chiqimda biriktiriladi)

### Q663. Sertifikat raqami va avtomatik generatsiya
**Nima:** Sertifikat raqami avtomatik (masalan SF-2026-00123) yoki qo'lda berilishi.
**Nega kerak:** Qo'lda raqamlash takror/xato beradi; avtomatik raqam tartibni saqlaydi.
**Variantlar:**
- A) Avtomatik ketma-ket raqam (yil+tartib) + takrorlanmaslik kafolati — tartibli
- B) Qo'lda kiritiladi — moslashuvchan, lekin xato xavfi
- C) Keyin — hozir kerak emas

### Q664. Sertifikatda real o'lchov natijalari
**Nima:** Sertifikatga shu partiyaning haqiqiy o'lchangan natijalari chiqsinmi yoki faqat "norma ichida" deyilsinmi.
**Nega kerak:** Eksport va jiddiy mijozlar aniq raqamlarni talab qiladi; "norma ichida" yetarli emas.
**Variantlar:**
- A) Har ko'rsatkich: norma + haqiqiy o'lchov + natija (o'tdi/o'tmadi) ko'rsatiladi — ishonchli
- B) Faqat "barcha ko'rsatkichlar normada" yozuvi — sodda, lekin shaffof emas
- C) Keyin — hozir kerak emas

### Q665. Sertifikat tili va shabloni
**Nima:** Sertifikat qaysi tilda (o'zbek/rus/ingliz) va qaysi shablon bilan chiqishi (eksport uchun alohida).
**Nega kerak:** Eksport mijozi ingliz/rus tilini so'raydi; ichki mijoz o'zbekni.
**Variantlar:**
- A) Ko'p tilli shablon (uz/ru/en) — mijozga qarab tanlanadi + zavod logotipi/blank — universal
- B) Faqat o'zbek/rus — sodda, eksportda muammo
- C) Keyin — hozir kerak emas

### Q666. Sertifikat imzo va muhr
**Nima:** Sertifikatni kim imzolaydi (laborant/sifat boshlig'i) va elektron imzo/QR-kod bo'lishi.
**Nega kerak:** Imzosiz sertifikat rasmiy emas; QR orqali mijoz haqiqiyligini tekshiradi.
**Variantlar:**
- A) Laborant + sifat boshlig'i imzosi + QR-kod (tizimdagi yozuvga olib boradi) — ishonchli va soxtalashtirib bo'lmaydi
- B) Faqat bitta imzo, QR-siz — sodda
- C) Keyin — hozir kerak emas

### Q667. Sertifikatsiz chiqimni bloklash
**Nima:** Tayyor mahsulot QC tasdiqi/sertifikatisiz omborodan chiqmasligi.
**Nega kerak:** Tekshirilmagan tovar mijozga ketsa, reklamatsiya va obro' yo'qotish bo'ladi.
**Variantlar:**
- A) QC tasdiqi bo'lmasa chiqim bloklanadi (faqat sifat boshlig'i istisno qila oladi, sababi yozilib) — qattiq nazorat
- B) Ogohlantirish chiqadi, lekin chiqim mumkin — yumshoq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (chiqim bloki), Sotuv (yetkazish kechikishi)

---

## 7-bo'lim. Qaytarilgan mahsulot

### Q668. Qaytgan mahsulot qabul maydonlari
**Nima:** Mijozdan qaytgan tovar qabul qilinganda yoziladigan ma'lumot: mijoz, partiya, miqdor, qaytish sababi, holati, qaytarish hujjati.
**Nega kerak:** Qaytgan tovar hisobsiz kirsa, ombor va moliya soni buziladi.
**Variantlar:**
- A) To'liq qabul forma: mijoz + asl buyurtma/partiya № + miqdor + sabab + holat (yangi/buzilgan) + reklamatsiya bog'lanishi — to'liq hisob
- B) Faqat miqdor + mijoz — sodda, lekin sabab yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (qaytgan tovar kirimi), Finance (qaytarish), QC (qayta tekshiruv)

### Q669. Qaytgan tovarni qayta tekshirish
**Nima:** Qaytgan tovar QC tomonidan qayta tekshirilib, taqdiri belgilanishi (qayta sotish/2-sort/utilizatsiya).
**Nega kerak:** Qaytgan tovarning hammasi brak emas; bir qismi yana sotilishi mumkin.
**Variantlar:**
- A) Majburiy qayta tekshiruv → qaror: qayta sotishga yaroqli / 2-sort / qayta ishlash / utilizatsiya — pul tejaydi
- B) Hammasi avtomatik brakka — sodda, lekin daromad yo'qoladi
- C) Keyin — hozir kerak emas

### Q670. Qaytgan tovar alohida zonaga
**Nima:** Qaytgan/karantin tovar omborda alohida (karantin) zonada saqlanib, oddiy tovar bilan aralashmasligi.
**Nega kerak:** Qaytgan tovar yaxshi tovar bilan aralashsa, brak yana mijozga ketishi mumkin.
**Variantlar:**
- A) Alohida karantin zonasi/status — QC qaror bermaguncha sotishga chiqmaydi — xavfsiz
- B) Oddiy omborga qaytadi — sodda, lekin aralashish xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (karantin lokatsiya/status)

### Q671. Qaytarish sabablari klassifikatori
**Nima:** Qaytarish sababi uchun ro'yxat: sifat brak, noto'g'ri o'lcham, ortiqcha yetkazildi, mijoz bekor qildi, kechikdi, noto'g'ri mahsulot.
**Nega kerak:** "Mijoz qaytardi" yetarli emas — sifat aybimi yoki logistika/sotuv aybimi farqlash kerak.
**Variantlar:**
- A) Sabab klassifikatori + ayb tomoni (zavod/mijoz/logistika) — adolatli tahlil va xarajat taqsimi
- B) Erkin matn — tez, lekin tahlil yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (kim to'laydi), Sotuv (mijoz xulqi)

### Q672. Qaytarish va moliya bog'lanishi
**Nima:** Qaytgan tovar miqdoriga qarab mijozga pul qaytarish/kredit-nota avtomatik shakllanishi.
**Nega kerak:** Tovar qaytdi-yu, pul qaytarilmasa yoki ikki marta qaytarilsa — moliyaviy nizo.
**Variantlar:**
- A) Qaytarish qabul qilingach kredit-nota/qaytarish avtomatik Finance'da ochiladi (summa = qaytgan miqdor × narx) — aniq
- B) Finance qo'lda kiritadi — sodda, lekin xato/kechikish xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (kredit-nota), Sotuv (mijoz balansi)

---

## 8-bo'lim. Qo'shimcha granular qoidalar

### Q673. Karantin / blok status
**Nima:** Tekshiruvda turgan tovar "karantin" (sotishga yopiq) statusida bo'lib, tasdiqdan keyin "yaroqli"ga o'tishi.
**Nega kerak:** Tekshirilmagan tovar tasodifan sotilib ketmasligi uchun.
**Variantlar:**
- A) Har tayyor partiya boshida "karantin" → QC tasdiqi → "yaroqli" / "brak" / "2-sort" — xavfsiz oqim
- B) Avtomatik "yaroqli", QC keyin tekshiradi — tez, lekin xavf
- C) Keyin — hozir kerak emas

### Q674. Sort darajalari (1-sort / 2-sort)
**Nima:** Mahsulotni sifat darajasiga ajratish: 1-sort (to'liq), 2-sort (kichik nuqson, arzon), brak.
**Nega kerak:** Kichik kosmetik nuqsonli tovarni tashlash o'rniga arzonroq sotib daromad olish.
**Variantlar:**
- A) 1-sort / 2-sort / 3-sort / brak darajalari + har biriga narx koeffitsienti — daromad oshadi
- B) Faqat yaroqli/brak — sodda, lekin 2-sort daromadi yo'qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance/Narx (sort narxi), Ombor (sort bo'yicha qoldiq), Sotuv

### Q675. O'lchov asboblari kalibrovkasi
**Nima:** Tarozi, namlik o'lchagich, mustahkamlik asbobi kalibrovka muddati va keyingi tekshiruv sanasi tizimda kuzatilishi.
**Nega kerak:** Buzuq asbob noto'g'ri o'lchaydi — barcha natijalar shubhali bo'ladi.
**Variantlar:**
- A) Har asbobga: kalibrovka sanasi + keyingi muddat + ogohlantirish (muddat o'tsa "ishlatmang") — ishonchli o'lchov
- B) Qog'ozda yuritiladi, tizimsiz — sodda, lekin unutiladi
- C) Keyin — hozir kerak emas

### Q676. Laborant nazorat jurnali (kim/qachon)
**Nima:** Har o'lchovda kim o'lchagani, qachon, qaysi asbobda — avtomatik yozilishi.
**Nega kerak:** Natija shubhali bo'lsa, kim qilganini va qayta o'lchashni bilish kerak.
**Variantlar:**
- A) Har o'lchovga avtomatik: laborant + sana/vaqt + asbob + smena — to'liq iz
- B) Faqat natija saqlanadi, kimligisiz — sodda, lekin javobgarlik yo'q
- C) Keyin — hozir kerak emas

### Q677. Qayta tekshirish (retest) qoidasi
**Nima:** Birinchi o'lchov chegarada/shubhali chiqsa, necha marta va qanday qayta o'lchash mumkinligi.
**Nega kerak:** Bitta noto'g'ri o'lchov bilan partiya brakka chiqmasin; lekin cheksiz qayta o'lchash ham aldash imkonini beradi.
**Variantlar:**
- A) Aniq qoida: chegara zonasida 2 ta qo'shimcha namuna olinadi, o'rtachasi hal qiladi — qayta o'lchash izga yoziladi — adolatli
- B) Cheklov yo'q, qaytaraverish mumkin — moslashuvchan, lekin suiiste'mol
- C) Keyin — hozir kerak emas

### Q678. Texnologik xaritaga (karta) bog'lash
**Nima:** Har mahsulot uchun sifat normalari texnologik xarita (resept/karta)dan olinishi — har buyurtmada qo'lda kiritilmasligi.
**Nega kerak:** Normalar har joyda turlicha bo'lsa, bir mahsulot ikki xil tekshiriladi.
**Variantlar:**
- A) Normalar mahsulot kartasi/texkartaga bir marta yoziladi, har buyurtma shundan tortadi — bir xil va tez
- B) Har buyurtmada qo'lda kiritiladi — moslashuvchan, lekin xato va nomutanosiblik
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (texkarta), Mahsulot kartasi

### Q679. Sifat KPI va statistikasi
**Nima:** Sifat bo'yicha asosiy ko'rsatkichlar: brak foizi, reklamatsiya soni, birinchi marta to'g'ri (FTQ), o'rtacha hal qilish vaqti — dashboardda.
**Nega kerak:** Raqamsiz sifat boshqarilmaydi; qaysi tomon yomonlashayotganini ko'rish kerak.
**Variantlar:**
- A) Sifat paneli: oylik brak %, reklamatsiya soni/turi, stanok/smena bo'yicha brak, FTQ, qaytarish % — qarorlar uchun
- B) Faqat oylik brak foizi — sodda, lekin sabab ko'rinmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (smena baholash), Ishlab chiqarish, Direktor paneli

### Q680. Yetkazib beruvchi sifat reytingi
**Nima:** Xom-ashyo kirim natijalari asosida har yetkazuvchiga sifat reytingi (qancha % brak berdi) yig'ilishi.
**Nega kerak:** Doimo yomon karton beradigan yetkazuvchidan voz kechish yoki narx ushlash uchun dalil.
**Variantlar:**
- A) Har yetkazuvchiga: kirim brak %, kechikish, sertifikat mosligi → reyting — xarid qarori uchun
- B) Reytingsiz, har kirim alohida — sodda, lekin tendentsiya ko'rinmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ta'minot/Xarid (vendor tanlash), Finance (jarima/ushlash)

### Q681. Foto/dalil biriktirish
**Nima:** Brak, reklamatsiya, qaytarishda majburiy foto/skan biriktirish va saqlash.
**Nega kerak:** Fotosiz "brak bor" deyish nizoda ishlamaydi; vizual dalil kuchli.
**Variantlar:**
- A) Brak/reklamatsiya/qaytarishda kamida 1 foto majburiy + cheksiz qo'shimcha — to'liq dalil bazasi
- B) Foto ixtiyoriy — tez, lekin dalil zaif
- C) Keyin — hozir kerak emas

### Q682. Sifat hidi/oziq-ovqat xavfsizligi
**Nima:** Oziq-ovqat kontaktidagi karton uchun qo'shimcha tekshiruv: hid, toksiklik, bo'yoq xavfsizligi, sertifikat talabi.
**Nega kerak:** Oziq-ovqat qadog'i uchun oddiy karton normasi yetarli emas — qonun va mijoz qo'shimcha talab qiladi.
**Variantlar:**
- A) Oziq-ovqat turidagi mahsulotga alohida xavfsizlik tekshiruvi + maxsus sertifikat majburiy — qonuniy himoya
- B) Oddiy karton kabi tekshiriladi — sodda, lekin huquqiy/sog'liq xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sertifikat (maxsus tur), Sotuv (oziq-ovqat mijozlari)

### Q683. Partiya kuzatuvchanligi (traceability)
**Nima:** Tayyor mahsulot partiyasidan orqaga qaytib qaysi xom-ashyo, qaysi stanok, qaysi smenada ishlanganini topish imkoni.
**Nega kerak:** Reklamatsiya kelsa, xuddi shu xom-ashyodan boshqa qaysi buyurtmalar chiqqanini topib, oldindan ogohlantirish mumkin.
**Variantlar:**
- A) Har partiyaga to'liq zanjir: xom-ashyo partiyasi → stanok → smena → tayyor partiya → mijoz — to'liq kuzatuv
- B) Faqat tayyor partiya → mijoz — sodda, lekin manbagacha bormaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ombor (xom-ashyo partiyasi), Ishlab chiqarish, Reklamatsiya

### Q684. Sifat tekshiruvini o'tkazib yuborish huquqi (override)
**Nima:** Shoshilinch holatda QC tasdiqisiz chiqimga ruxsat berish (override) — faqat yuqori lavozim, sababi yozilib, jurnalda qolib.
**Nega kerak:** Ba'zan mijoz juda shoshiltiradi; lekin bu nazoratsiz bo'lsa, qoida buziladi.
**Variantlar:**
- A) Faqat sifat boshlig'i/direktor override qila oladi + majburiy sabab + jurnal + mijoz ogohlantiriladi — nazorat ostida moslashuv
- B) Override yo'q, hech qachon istisno yo'q — qattiq, lekin biznes egiluvchanligi yo'q
- C) Keyin — hozir kerak emas

---

# QC / Sifat — YANGI (kitob-grounded) savollar

> Bu bo'lim 2020 fabrika hujjatlari (Abdullaev — ichki logistika, Nazirov — dizayn bo'limi) va jonli ishlab chiqarish Excel'lari (25-04.xlsx, Bandlik.xlsx, ketgan kun.xlsx, Kichik buyurtmalar.xlsx, Iyun ishchilar.xlsx) asosida tuzilgan. Real fabrika atamalari ishlatilgan: **Брак сони**, **Резка/Ламинация/Окошка/ФСМ/Степлер/Высечка/Тигель/Беговка/Тиснение/Конгрев/Автокляй/Кашировка**, **Топлайнер/Тестлайнер/Меловка/крафт-крем-белый оборот**, **E/B/C makro**, **2-слой/5-слой**, **смена (ден/ноч)**, **оператор/помошник**, **A-System**, **подписной лист**, **техкарта**, qolip (**СТП пластина, кесувчи қолип**), **5-Departament** (sifat nazorati + reja + dizayn + konstruktor), **бекор туриш**, **приладка**, **KT/PT/E** kod prefikslari.
> Ushbu savollar yuqoridagi 52 ta (Q1–Q52) hamda eski `vision-questions/09-qc.md` (Q1–Q30) bilan TAKRORLANMAYDI. (A) — vizyonga eng mos tavsiya. Til: oddiy, texnik atamasiz.

---

## 5-bo'lim. Jonli Excel'dagi brak-hisobini ERP'ga ko'chirish

### Q685. "Брак сони" maydonini operatsiya yozuviga rasman bog'lash
**Nima:** Jonli Excel'da (25-04.xlsx) har buyurtma uchun "Брак сони" (brak dona soni) va "Факт. выраб." (haqiqiy ishlab chiqarilgan) yoziladi. Buni ERP'ning har operatsiya yopilish yozuviga majburiy maydon qilish.
**Nega kerak:** Hozir bu Excel'da qo'lda yuritiladi — operator yozsa yozadi, yozmasa yo'q. ERP'da har "tamom" tugmasi brak sonini so'rasa, ma'lumot to'liq bo'ladi va tahlil qilinadi.
**Variantlar:**
- A) Har operatsiya yopilishida "Брак сони" + sabab majburiy kiritiladi — to'liq, tahlilga tayyor
- B) Faqat smena oxirida umumiy brak soni — sodda, lekin operatsiya kesimi yo'qoladi
- C) Excel'dagidek ixtiyoriy — o'zgarishsiz, lekin teshikli
- D) Keyin — hozir kerak emas
⤳ Ta'sir: MES (operatsiya yopilishi), Karta-model GSD (operator reytingi)

### Q686. Plan vs Fakt brak chegarasi (выработка bilan solishtirish)
**Nima:** Excel'da "Плановая выработка" va "Факт. выраб." bor. Brak shu rejaning necha foizi ekanini avtomatik hisoblab, chegaradan oshsa belgilash.
**Nega kerak:** 1000 donadan 5 brak — normal; 1000 donadan 200 brak — falokat. Tizim foizni o'zi hisoblasa, anomaliya darrov ko'rinadi.
**Variantlar:**
- A) Brak% = brak ÷ plan, har operatsiyaga normа-chegara (mas. ≤2%) — avtomatik anomaliya
- B) Faqat brak sonini ko'rsatish (foizsiz) — sodda
- C) Hisoblanmaydi — oson, lekin me'yor yo'q
- D) Keyin
  ↳ Agar A: normа-chegarani kim belgilaydi? — A) operatsiya turi bo'yicha (Резка boshqa, Тигель boshqa) B) hamma operatsiyaga bitta % C) mahsulot turiga qarab

### Q687. Brakni operatsiya turiga ko'ra ajratish (Резка/Печать/Высечка/Кляй...)
**Nima:** Bandlik.xlsx'dagi real operatsiyalar — Резка, Печать (SM72/SM52/Флексо), Ламинация, Лак, Высечка, Тигель, Беговка, Автокляй, Кляйлаш, Оынакча, Кашировка — har biriga alohida brak hisobi.
**Nega kerak:** "Brak qayerda ko'p chiqyapti — bosmadami, kesishdami, yelimlashdami?" Operatsiya kesimi bo'lmasa, qaysi mashinani sozlash kerakligini bilib bo'lmaydi.
**Variantlar:**
- A) Har operatsiya turiga brak hisobi (Bandlik.xlsx operatsiyalar ro'yxatidan) — aniq manba
- B) Faqat 3 katta guruh (bosma / biriktirish / pardozlash) — soddaroq
- C) Operatsiyasiz, umumiy brak — oson, lekin ko'r
- D) Keyin

### Q688. Brakni smena (ден/ноч) va оператор/помошник kesimida
**Nima:** Excel'da har buyurtma "Смена (ден/ноч)", "Оператор", "Помошник" bilan yoziladi. Brakni shu kesimda tahlil qilish.
**Nega kerak:** Tunги smenada brak ko'proq chiqadimi? Falon operator qo'lида brak ko'pmi? Bu — adolatli baho va o'qitish ehtiyojini ko'rsatadi.
**Variantlar:**
- A) Смена + оператор + помошник kesimida brak (reytingga ulanadi) — aniq mas'uliyat
- B) Faqat smena kesimi (operator nomsiz) — yumshoqroq, kamroq nizo
- C) Kesimsiz — oson, lekin sabab topilmaydi
- D) Keyin
⤳ Ta'sir: HR (smena jadvali), Karta-model (operator GSD)

### Q689. Приладка (sozlash) brakini alohida hisoblash
**Nima:** ketgan kun.xlsx: "Приладка учун кетган вақт". Mashina sozlash davrida chiqadigan brak (приладка брак) — har buyurtma boshida normal, lekin cheklangan bo'lishi kerak.
**Nega kerak:** Sozlash braki muqarrar, lekin agar mashinani sozlashga 200 list ketsa — bu yo'qotish. Uni alohida hisoblamasak, "qancha sozlashga ketadi" noma'lum.
**Variantlar:**
- A) Приладка brakini alohida turkum (operatsiya/mashina kesimida, normа-chegara bilan) — sozlash isrofini nazorat
- B) Umumiy brakka qo'shib yuborish — sodda, lekin ajralmaydi
- C) Hisoblanmaydi — oson, lekin isrof ko'rinmas
- D) Keyin

### Q690. Бекор туриш (downtime) va brak o'rtasidagi bog'liqlik
**Nima:** Abdullaev: "Бекор туриш — иш вақти давом этаётган бўлса-да... ишлаб чиқариш жараёнининг вақтинча тўхтаб қолиши". To'xtab-qayta boshlangan mashinada brak ko'payadi (qayta priladka).
**Nega kerak:** Har bekor turishdan keyin mashina qayta sozlanadi → priladka braki. Downtime'ni brakка bog'lasak, "to'xtashlar bizga qancha brakka tushyapti" ko'rinadi.
**Variantlar:**
- A) Downtime hodisasi keyingi priladka brakiga bog'lanadi (sabab-zanjir) — to'xtash narxi ko'rinadi
- B) Downtime alohida, brak alohida (bog'lanmaydi) — sodda
- C) Hisoblanmaydi — oson, lekin yashirin yo'qotish
- D) Keyin
⤳ Ta'sir: MES (downtime), Logistika (бекор туриш sababi)

### Q691. Buyurtma kartasidagi brak limitidan oshganda ishni to'xtatish
**Nima:** Bitta buyurtmada brak belgilangan limitdan oshsa (mas. plan 1000, brak 150), ishni avtomatik to'xtatib, QC/smena boshlig'i qarorini kutish.
**Nega kerak:** Bir nuqtadan keyin "davom etish" pulni isrof qilish. Limit oshsa to'xtatib, sabab topilmaguncha davom etmaslik — isrofni to'xtatadi.
**Variantlar:**
- A) Brak limitidan oshsa avtomatik to'xtatish + QC qarori (davom/to'xtat/qayta sozlash) — isrof to'xtaydi
- B) Faqat ogohlantirish (ish davom etadi) — yumshoq
- C) To'xtatish yo'q — oson, lekin isrof
- D) Keyin
⤳ Ta'sir: MES (to'xtatish)

### Q692. Брак ствойни (operatsiyalararo) ajratish — kim sababchi
**Nima:** Ko'p operatsiyali mahsulotda (Bandlik: 2–8 bo'lim) brak qaysi operatsiyada chiqdi — Резка mi, Кляй mi? Operatsiyaga "kirib kelgan brak" va "shu yerда chiqqan brak"ni ajratish.
**Nega kerak:** Agar Кляй operatori brak chiqarsa, lekin sababi oldingi Высечка bo'lsa — Кляй operatori aybdor emas. Operatsiyaga kirgan brakni alohida belgilash kerak.
**Variantlar:**
- A) Har operatsiya "kirim braki" (oldingi bosqichdan) va "shu bosqich braki"ni ajratadi — adolatli sabab
- B) Faqat shu operatsiyaning umumiy braki — sodda
- C) Ajratilmaydi — oson, lekin noto'g'ri ayblanadi
- D) Keyin

---

## 6-bo'lim. Qog'oz turi va material xususiyatiga bog'liq normalar

### Q693. Топлайнер vs Тестлайнер sifatini farqlash (целлюлоза/макулатура)
**Nima:** Kitobda aniq: Топлайнер = yuqori sifat, целлюлоза, ravshan bosma; Тестлайнер = макулатура (ikkilamchi xom-ashyo), sifatga qarab tanlanadi. QC bu farqni hisobga olishi.
**Nega kerak:** Тестлайнер brakka moyilroq, bosma sifati pastroq. Sifat normasi qog'oz turidan kelib chiqmasa, "yaxshi" degan baho noto'g'ri bo'ladi.
**Variantlar:**
- A) QC normasi qog'oz turiga bog'lanadi (Топлайнер/Тестлайнер/Меловка alohida tolerans) — adolatli baho
- B) Hamma qog'ozga bitta norma — sodda, lekin noaniq
- C) Qog'oz turini hisobga olmaymiz — oson, lekin xato baho
- D) Keyin
  ↳ Agar A: norma materiallar lug'atidan (raw_materials) keladimi? — A) ha, avtomatik B) qo'lda kiritiladi

### Q694. Oziq-ovqat yaroqliligini QC'da bloklash (макулатура → озиқ-овқатга ЭМАС)
**Nima:** Kitobda: "крафт оборот... таркиби макулатура бўлган навлари озиқ-овқат маҳсулотларига тавсия этилмайди"; крем/белый оборот = целлюлоза, oziq-ovqatga mos. QC bu qoidani majburlasin.
**Nega kerak:** Agar oziq-ovqat buyurtmasiga xato makulatura qog'oz ishlatilsa — bu xavfsizlik va qonun buzilishi. Tizim materialni mahsulot turiga solishtirib to'sib qolsa, falokat oldi olinadi.
**Variantlar:**
- A) Oziq-ovqat buyurtmasiga makulatura-asosli qog'oz tanlansa — QC blok + ogohlantirish — xavfsizlik kafolati
- B) Faqat ogohlantirish (boshlash mumkin) — yumshoq
- C) Tekshirilmaydi — oson, lekin xavfli
- D) Keyin
⤳ Ta'sir: Dizayn/Texkarta (material tanlash), Savdo (mijoz mahsulot turi), Q16 (kimyoviy norma)

### Q695. Грамаж (g/m²) normasini kirimda tekshirish
**Nima:** Kitob: белый оборот 170–350 г/м², Меловка 70–90 г/м². Texkartada belgilangan грамаж kelgan material grammajiga mosligini QC tekshirsin.
**Nega kerak:** Yengilroq qog'oz arzon, lekin quti yumshoq chiqadi (mijoz shikoyati). Grammaj normadan past bo'lsa, kirimда to'xtatish kerak.
**Variantlar:**
- A) Texkarta грамаж'i ± tolerans bilan kirim QC'da tekshiriladi (o'lchov bilan) — aniq nazorat
- B) Faqat yetkazib beruvchi sertifikatiga ishonish (o'lchamaymiz) — tez, lekin ishonchsiz
- C) Tekshirilmaydi — oson, lekin sifat beqaror
- D) Keyin

### Q696. Микро turini (E/B/C makro, 2-слой/5-слой) QC mustahkamlik normasiga bog'lash
**Nima:** Excel'larda mahsulotlar "E mikro", "B makro", "C makro", "2 слой", "5 слой" bilan belgilanadi. Har xil gofra turi har xil mustahkamlikка ega.
**Nega kerak:** 5-qatlamli gofra og'ir mahsulotga, E-mikro yengilга. Agar buyurtma 5-слой talab qilsa-yu E-mikro chiqarilsa — quti sinadi. QC bu moslikni tekshirishi kerak.
**Variantlar:**
- A) QC mustahkamlik testi gofra turiga bog'lanadi (E/B/C, qatlam soni → ECT/BCT normasi) — to'g'ri baho
- B) Faqat gofra turi to'g'ri tanlanganini ko'z bilan tekshirish — sodda
- C) Tekshirilmaydi — oson, lekin sinish xavfi
- D) Keyin

### Q697. Местный/импорт qog'oz almashish xatosini QC'da ushlash
**Nima:** Abdullaev kitobida aniq misol: техкартада Топлайнер belgilangan, lekin местный (макулатура) qog'oz участкага chiqarilmoqda — "ўз вақтида тўхтатилмаса, ишлаб чиқариш тўхтаб қолиши мумкин". QC bu mosликни tekshirsin.
**Nega kerak:** Bu real fabrika xatosi — texkarta bir narsani, ombor boshqa qog'ozni beradi. QC operatsiya boshida material kodini (KT/PT/E + tur) techkarta bilan solishtirsa, brak boshlanmasdan to'xtaydi.
**Variantlar:**
- A) Operatsiya boshida QC техкарта materiali ↔ chiqarilgan material kodини solishtiradi, mos kelmasa blok — manba xatoni to'sadi
- B) Faqat logistika tekshiradi (QC aralashmaydi) — kitobdagidek, lekin teshikli
- C) Tekshirilmaydi — oson, lekin to'xtab qolish xavfi
- D) Keyin
⤳ Ta'sir: Ombor (material chiqarish), MES (operatsiya boshlanishi), Logistika

### Q698. Sifat normasini mahsulot oilasiga (KT/PT/E kod prefiksi) bog'lash
**Nima:** Excel'larda mahsulot kodlari KT (karton quti), PT (poddon/lotok), E (etiketka) prefiksli. Har mahsulot oilasiga mos QC normasi.
**Nega kerak:** Etiketka (E) bilan karton quti (KT) bir xil tekshirilmaydi — etiketkada rang/yopishish, qutida o'lcham/mustahkamlik muhim. Kod prefiksi normani avtomatik tanlasa, ish tezlashadi.
**Variantlar:**
- A) QC normasi mahsulot oilasiga (KT/PT/E) avtomatik bog'lanadi — to'g'ri norma o'zi keladi
- B) Inspektor qo'lда mos normani tanlaydi — sodda
- C) Bitta umumiy norma — oson, lekin noaniq
- D) Keyin
⤳ Ta'sir: Mahsulot katalogi (material_cards)

---

## 7-bo'lim. Operatsiyaga xos nuqson nazorati

### Q699. Ламинация va лак (oddiy/виборочный) sifat nuqsonlari
**Nima:** Excel'larda Ламинация, Лак, Виборочный лак, матовый/глянцевый laminat operatsiyalari bor. Bu pardozlash bosqichida nuqsonlar (pufakcha, ko'chish, notekis lak) chiqadi.
**Nega kerak:** Laminat ko'chsa yoki lak notekis bo'lsa — mahsulot ko'rinishi buziladi, qimmat mahsulotda (дори, qimmat shirinlik) mijoz darrov rad qiladi. Bu operatsiyalarga maxsus checklist kerak.
**Variantlar:**
- A) Ламинация/лак operatsiyasiga alohida nuqson checklisti (yopishish, pufak, tekislik) — pardoz brakini ushlaydi
- B) Umumiy ko'z bilan tekshirish — sodda
- C) Maxsus tekshiruv yo'q — oson, lekin pardoz braki o'tadi
- D) Keyin

### Q700. Окошка / оынакча (deraza-pleyonka) yopishish nazorati
**Nima:** Excel'da "Окошка", "Оынакча", "Оынакчалик қадоқлаш" operatsiyasi bor (qutidagi shaffof oyna-plyonka). Bu yopishtirish nuqsoni keng tarqalgan.
**Nega kerak:** Oyna qiyshiq yoki ko'chgan bo'lsa — quti brak. Оынакча alohida operatsiya, alohida brak manbai bo'lgani uchun alohida nazorat kerak.
**Variantlar:**
- A) Оынакча operatsiyasiga alohida nuqson nazorati (joylashuv, yopishish, tozalik) — alohida brak ushlanadi
- B) Umumiy biriktirish nazoratiga qo'shib yuborish — sodda
- C) Alohida emas — oson, lekin nuqson aralashadi
- D) Keyin

### Q701. Кашировка (gofra+bosma yopishtirish) ko'chish/qiyshiqlik nazorati
**Nima:** Excel: "Кашировка", "Каширофка" — bosilgan ofset listni gofraга yopishtirish. Bu yerda qiyshiq yopishish, havo pufagi, ko'chish bo'ladi.
**Nega kerak:** Кашировка qiyshiq bo'lsa, keyingi высечка noto'g'ri kesadi — ikki brak ketma-ket. Bu operatsiyada nazorat zarur.
**Variantlar:**
- A) Кашировка'ga registratsiya/qiyshiqlik tolerantsiyasi + yopishish nazorati — keyingi brakни oldini oladi
- B) Faqat ko'z bilan — sodda
- C) Tekshirilmaydi — oson, lekin zanjir braki
- D) Keyin

### Q702. Тиснение / Конгрев / фольга sifat nazorati
**Nima:** Bandlik.xlsx: Тиснение (bosib chuqurlash), Конгрев (relyef), folga. Bu bezak operatsiyalari qimmat mahsulotda (qadoq, sovg'a) ishlatiladi.
**Nega kerak:** Folga to'liq yopishmasa yoki kongrev notekis bo'lsa — premium mahsulot arzon ko'rinadi. Qimmat operatsiya bo'lgani uchun brak ham qimmatga tushadi.
**Variantlar:**
- A) Тиснение/конгрев/фольга operatsiyalariga alohida sifat checklisti (chuqurlik, qoplash, registratsiya) — premium brakni to'sadi
- B) Umumiy pardoz nazorati — sodda
- C) Alohida emas — oson
- D) Keyin

### Q703. Высечка/Тигель/Беговка o'lchov va biguv nuqsoni nazorati
**Nima:** Bandlik: Высечка (флексо/офсет), Тигель, Степлер, Беговка. Bu kesish-shtamplash bosqichida o'lcham, biguv (begovka) chizig'i, qiyshiq kesish nuqsonlari chiqadi.
**Nega kerak:** Высечка noto'g'ri kessa — quti yig'ilmaydi yoki o'lchami xato. Begovka noto'g'ri bo'lsa — quti notekis buklanadi. Bu operatsiyaga o'lchov nazorati zarur.
**Variantlar:**
- A) Высечка/тигель/беговка'ga o'lcham + begovka pozitsiyasi nazorati (tolerans bilan) — yig'ilmaydigan quti to'siladi
- B) Faqat birinchi nusxa o'lchanadi — o'rtacha
- C) Ko'z bilan — oson, lekin o'lcham xatosi o'tadi
- D) Keyin

### Q704. Litso/oборот (old/orqa, A/B tomon) bosma mosligini tekshirish
**Nima:** Excel'larda ko'p mahsulot "литсо оборот", "А томон/Б томон" (old/orqa) bilan. Ikki tomonli bosmada tomonlar bir-biriga to'g'ri kelishi (registratsiya).
**Nega kerak:** Old va orqa bosma siljisa (mas. A-tomon/B-tomon mos kelmasa) — quti yig'ilganda naqsh buziladi. Ikki tomonli ishda registratsiya QC zarur.
**Variantlar:**
- A) Ikki tomonli (литсо/оборот, A/B) bosmada registratsiya/moslik QC normasi — siljish ushlanadi
- B) Faqat har tomonni alohida tekshirish (moslik emas) — sodda
- C) Tekshirilmaydi — oson, lekin siljish o'tadi
- D) Keyin

### Q705. Etiketka/самоклей (E kodli) yopishish va kesish nuqsoni
**Nima:** Excel'da ko'p "этикетка", "самоклей", "E9xxx" kodli mahsulot. Etiketka yopishish kuchi, kesish aniqligi, ko'chish nuqsonlari boshqacha.
**Nega kerak:** Etiketka karton qutidan farqli — yopishmasa yoki noto'g'ri kesilsa mijoz mahsulotiga yopishmaydi. E-kodli mahsulotga alohida QC normasi kerak.
**Variantlar:**
- A) Etiketka/самоклейга alohida QC normasi (yopishish kuchi, kesish, ko'chish) — to'g'ri baho
- B) Umumiy bosma normasiga qo'shib — sodda
- C) Alohida emas — oson
- D) Keyin

---

## 8-bo'lim. Tasdiq zanjiri, dizayn, qolip va 5-Departament

### Q706. Подписной лист (mijoz tasdiqlagan namuna) ni QC etaloniga aylantirish
**Nima:** Nazirov: dizayn "намуна ва подписной листлар асосида" ishlaydi; ЦКП = "буюртмачи томонидан тасдиқланган маҳсулот дизайни". QC final-inspeksiyada aynan shu подписной лист bilan solishtirsin.
**Nega kerak:** "To'g'ri chiqdimi?" degan savolning yagona javobi — mijoz imzolagan namuna. Etalonsiz QC sub'yektiv bo'ladi.
**Variantlar:**
- A) Har buyurtmaga tasdiqlangan намуна (подписной лист surati/fayli) QC etaloni sifatida biriktiriladi — obyektiv solishtirish
- B) Faqat texkartaga ishonish (namuna biriktirilmaydi) — sodda
- C) Etalon yo'q, inspektor xotirasiga tayanadi — oson, lekin nizoli
- D) Keyin
⤳ Ta'sir: Dizayn (namuna fayli), Savdo (mijoz tasdig'i)

### Q707. Ишлаб чиқаришдан олдин tekshiruv (pre-production QC checklist)
**Nima:** Nazirov muvaffaqiyat omili: "Ҳар бир дизайн ишини ишлаб чиқаришдан олдин текшириш". Ishlab chiqarish boshlanishidan oldin QC checklisti (material, qolip, fayl, namuna, грамаж mos).
**Nega kerak:** Kitobda misol: "маҳсулот қайта ишлашсиз ишлаб чиқарилди" — ya'ni oldindan tekshirilsa qayta ishlash bo'lmaydi. Bu eng arzon QC nuqtasi — boshlashdan oldin.
**Variantlar:**
- A) Majburiy pre-production checklist (material+qolip+fayl+namuna+грамаж) — to'ldirilmaguncha ishlab chiqarish ochilmaydi — eng arzon nazorat
- B) Tavsiya etilgan checklist (majbur emas) — yumshoq
- C) Yo'q, to'g'ridan-to'g'ri boshlanadi — eng tez, eng xavfli
- D) Keyin
⤳ Ta'sir: MES (ishlab chiqarish ochilishi)

### Q708. Qolip (СТП пластина, кесувчи қолип) sifatini QC'ga kiritish
**Nima:** Nazirov: "Қолиплар (СТП пластиналари, кесувчи қолиплар) тайёрланишида... камчиликлар учун жавоб беради". Qolip nuqsoni (eskirgan, noaniq kesish) brak manbai. QC qolip holatini tekshirsin.
**Nega kerak:** Eskirgan кесувчи қолип qutini noaniq kesadi, eski СТП пластина bosmani buzadi. Qolip nazoratsiz bo'lsa, brakning ildiz sababi yashirin qoladi.
**Variantlar:**
- A) Qolip reestri + holat/eskirish nazorati + "qaysi qolip qaysi brakka sabab" bog'lanishi — ildiz sabab topiladi
- B) Faqat qolip ro'yxati (holat nazoratsiz) — sodda
- C) Qolip nazorat qilinmaydi — oson, lekin ildiz brak qaytaveradi
- D) Keyin
⤳ Ta'sir: Dizayn (qolip tayyorlash), MES (высечка/тигель operatsiyalari)

### Q709. Дизайн камчилиги sababli brakni alohida belgilash
**Nima:** Nazirov: "Дизайн сабабли ишлаб чиқаришда юзага келган камчиликлар ва моддий йўқотишлар учун" javobgar. Brak sababini "ишлаб чиқариш xatosi" va "дизайн xatosi"ga ajratish.
**Nega kerak:** Agar brak dizayn faylidagi xatodan bo'lsa (noto'g'ri o'lcham, format), uni ishlab chiqaruvchiga yozish adolatsiz. Sabab manbaga to'g'ri yozilishi kerak.
**Variantlar:**
- A) Brak sabab-toifasi: дизайн / ишлаб чиқариш / материал / қолип / оператор / режа — har biri o'z bo'limiga ulanadi — adolatli
- B) Faqat "ichki / tashqi" sabab — sodda
- C) Sabab manba ajratilmaydi — oson, lekin javobgarsiz
- D) Keyin
⤳ Ta'sir: Dizayn bo'limi GSD, Reja (PP), Karta-model

### Q710. Конструктор (struktura dizayni) tasdig'ini QC zanjiriga qo'shish
**Nima:** Kitob 5-Dept ichida "конструктор" bor (qutining struktura/yig'ilish dizayni). Yangi struktura ishlab chiqarishga ketishdan oldin конструктор tasdig'i QC zanjiriga kirsin.
**Nega kerak:** Quti chiroyli bosilgan bo'lsa-yu noto'g'ri yig'ilsa (struktura xato) — baribir brak. Конструктор tasdig'i strukturaviy brakni oldini oladi.
**Variantlar:**
- A) Yangi struktura/qolipga конструктор tasdig'i QC zanjirida (namuna yig'ib ko'rsatadi) — strukturaviy brak to'siladi
- B) Faqat dizayn tasdig'i (struktura alohida emas) — sodda
- C) Tasdiq yo'q — oson, lekin yig'ilmaydigan quti riski
- D) Keyin
⤳ Ta'sir: Dizayn/Konstruktor (5-Dept), Q76 (qolip)

### Q711. 5-Departament ichida QC rolini mustaqil ajratish
**Nima:** Kitob: "5-Департамент (Ишлаб чиқариш бўлими (**сифат назорати**, режалаштириш, дизайн, конструктор...))". QC shu departamentда reja/dizayn/konstruktor bilan birga. ERP'da QC rolini aniq ajratish.
**Nega kerak:** Agar QC reja yoki dizayn bilan aralashsa, sifat qarori xolis bo'lmaydi (o'zini o'zi tekshiradi). QC mustaqil rol bo'lishi kerak.
**Variantlar:**
- A) QC alohida rol/ruxsat (5-Dept ichida, lekin dizayn/rejaдан mustaqil tasdiq huquqi) — xolis nazorat
- B) QC reja/dizayn bilan birga (bitta rol) — sodda, lekin xolislik shubhali
- C) QC roli yo'q, har kim tekshiradi — oson, lekin javobgarsiz
- D) Keyin
⤳ Ta'sir: Org-struktura (Vysotskiy 5-Dept)

### Q712. Кўп учрайдиган хатолар ro'yxatini QC defekt-master'iga ulash
**Nima:** Nazirov hujjatida "Кўп учрайдиган хатолар" bo'limi bor (mas. "маълумотларни тўлиқ текширмасдан иш бошлаш"). Har bo'lim/operatsiya uchun shu "tez-tez uchraydigan xato" lug'atini QC defekt-ro'yxatiga ulash.
**Nega kerak:** Fabrika 2020'da bu xatolarni hujjatlashtirgan — bu tayyor bilim. QC defekt ro'yxatini noldan emas, shu real xatolardan boshlasa, amaliy bo'ladi.
**Variantlar:**
- A) Har bo'lim "кўп учрайдиган хатолар"i QC defekt-master'iga import qilinadi (kitob asosida) — real, amaliy
- B) Defekt ro'yxatini noldan to'ldirish — toza, lekin bilim yo'qoladi
- C) Bog'lanmaydi — oson
- D) Keyin

### Q713. Sifat hujjati raqamli imzosi (kim tekshirdi, kim tasdiqladi)
**Nima:** Kitob модели: har vazifa "имзо қўйиб бориш" bilan tasdiqlanadi ("масъулиятингизни акс эттиради"). QC natijasiga ham kim tekshirdi/tasdiqladi raqamli imzosi biriktirilsin.
**Nega kerak:** Imzosiz QC — javobgarsiz. Kitob fabrikasi imzo madaniyatiga ega. Raqamli imzo (kim, qachon) — keyin nizoda aniq javobgar.
**Variantlar:**
- A) Har QC qaroriga raqamli imzo (kim tekshirdi + tasdiqladi + sana/vaqt) — javobgarlik yozma
- B) Faqat tekshiruvchi ko'rsatiladi (tasdiqlovchisiz) — sodda
- C) Imzosiz — oson, lekin javobgarsiz
- D) Keyin

---

## 9-bo'lim. Material balansi, tashqi ish, traceability

### Q714. Brak materialini omborga qaytarish/utilizatsiya hisobi (qog'oz qoldiq)
**Nima:** Excel'da "Қолдиқ картон рулон/кесиш учун", "Гофра лист қолдиқ" bor. Brak va qoldiq qog'ozni omборга "ikkilamchi xom-ashyo" yoki utilizatsiya sifatida hisobga olish.
**Nega kerak:** Brak qog'oz — yo'qotish, lekin ba'zisi qayta ishlatiladi (kesish uchun, kichik buyurtmaga). Buni hisobga olmasak, material balansi noto'g'ri.
**Variantlar:**
- A) Brak/qoldiq qog'oz omborда alohida turkum (qayta ishlatiladigan / utilizatsiya) — material balansi to'g'ri
- B) Faqat utilizatsiya (qayta ishlatish hisobsiz) — sodda
- C) Hisobga olinmaydi — oson, lekin material yo'qoladi hisobда
- D) Keyin
⤳ Ta'sir: Ombor (WMS), Moliya (sifat narxi)

### Q715. Тошдан келган (tashqi bajarilgan) mahsulotni kirim QC'da tekshirish
**Nima:** Excel: "тош", "Тошдан келган нарсаларди қадоқлаш" — tashqi ustaxonadan (тош) kelgan ish. Bu tashqi mahsulot fabrikaga kirimда tekshirilishi kerak.
**Nega kerak:** Tashqarida bajarilgan ish sizning nazoratingizdan tashqarida bo'lgan — sifat noma'lum. Kirimда tekshirmasak, tashqi brak sizning nomingizdan mijozga ketadi.
**Variantlar:**
- A) Тош/tashqi ish kirimда majburiy QC (xuddi yetkazib beruvchi materiali kabi, reyting bilan) — tashqi brak to'siladi
- B) Faqat sanab qabul qilish (sifatsiz) — sodda
- C) Tekshirilmaydi (ishonamiz) — oson, lekin xavfli
- D) Keyin
⤳ Ta'sir: Ombor (kirim), Q48 (supplier sifati)

### Q716. Material lot/rulon ↔ buyurtma kuzatuvini brakka ulash
**Nima:** Qaysi qog'oz ruloni (yetkazib beruvchi partiyasi) qaysi buyurtmaga ishlatilganini saqlab, reklamatsiyada "qaysi materialdan" tezda topish. (v2 Q51 traceability'ni QC-brak nuqtai nazaridan kuchaytiradi.)
**Nega kerak:** Mijoz "quti yumshoq" desa, qaysi qog'oz partiyasidan ekanини bilsak — o'sha rulondan boshqa buyurtmalarni ham tekshirib, ommaviy reklamatsiyani oldini olamiz.
**Variantlar:**
- A) Material lot ↔ buyurtma ↔ brak/reklamatsiya to'liq bog'lanadi — ildizgacha kuzatish
- B) Faqat buyurtma ↔ material turi (lot kuzatuvsiz) — qisman
- C) Bog'lanmaydi — oson, lekin reklamatsiyada topilmaydi
- D) Keyin
⤳ Ta'sir: Ombor (material lot), Q48 (supplier sifati)

### Q717. Кичиклашган буюртма (razmer revision) da QC normasi/qolipni yangilash
**Nima:** Kichik buyurtmalar.xlsx — mahsulotni kichiklashtirib (razmer eski → yangi) material tejash tahlili. Razmer o'zgarganda QC normasi va qolip ham yangilanishi kerak.
**Nega kerak:** Razmer kichiklashsa, eski texkarta/qolip mos kelmaydi. QC eski normaga qarasa — noto'g'ri baho. Razmer o'zgarishi QC normasini ham yangilashi kerak.
**Variantlar:**
- A) Razmer o'zgarishi (revision) QC normasi + qolipни avtomatik yangi versiyaga bog'laydi — moslik saqlanadi
- B) Qo'lda yangilanadi (eslab qolish kerak) — xato xavfi
- C) Bog'lanmaydi — oson, lekin eski norma bilan brak
- D) Keyin
⤳ Ta'sir: Dizayn (revision), Q76 (qolip)

---

## 10-bo'lim. Tartiblangan mahsulot, status sinxroni, oqim

### Q718. Ретсеп-бланка / dori qadog'i kabi tartiblangan mahsulotda 0% tolerans
**Nima:** Excel'larda "ретсеп бланка", "Immune STR", "Vitason", "Euromed" — tibbiy/dori mahsulotlari bor. Bunga maxsus, qattiqroq QC normasi kerak.
**Nega kerak:** Dori qadog'i va retsept blankasida xato — qonuniy javobgarlik. Oddiy shirinlik qutisiga 2% brak normal bo'lsa, dori qadog'iga 0% bo'lishi mumkin.
**Variantlar:**
- A) Mahsulot toifasiga ko'ra tolerans (dori/tibbiy = 0%, oziq-ovqat = past, sovg'a = o'rta) — risk-asosli
- B) Hamma mahsulotga bitta tolerans — sodda, lekin xavfli
- C) Tartibsiz — oson, lekin tibbiy riskда xavfli
- D) Keyin
⤳ Ta'sir: Savdo (mahsulot toifasi), Q16 (kimyoviy norma)

### Q719. Tugatish foizi (% буюртма тайёрлиги) bilan final-QC holatini sinxronlash
**Nima:** Bandlik.xlsx: "Буюртма тайёрлиги %". Buyurtma 100% tayyor deб ko'rsatilsa-yu QC o'tmagan bo'lsa — bu yolg'on tayyorlik.
**Nega kerak:** "Tayyor" degani QC'dan o'tgan degani bo'lishi kerak. Aks holda savdo mijozga "tayyor" deydi, lekin aslida final QC qilinmagan.
**Variantlar:**
- A) Buyurtma "100% tayyor" statusi faqat final QC "o'tdi" bilan — yolg'on tayyorlik yo'q
- B) % tayyorlik QC'siz hisoblanadi, QC alohida belgi — sodda, lekin chalkash
- C) Bog'lanmaydi — oson, lekin "tayyor" noaniq
- D) Keyin
⤳ Ta'sir: Savdo (mijozga muddat), MES (tayyorlik %)

### Q720. QC "qayta ishlab chiqarish kerak" qarorini Reja/Ombor bilan ulash
**Nima:** QC partiyani rad qilsa va "qayta ishlab chiqarish kerak" desa — bu avtomatik rejaga yangi ish (qayta buyurtma) va omborga material so'rovi sifatida tushishi.
**Nega kerak:** Hozir rad bo'lgan partiya og'zaki "qaytadan qilamiz"ga aylanadi va unutiladi. Avtomatik reja-ulanish — qaytarish ishini yo'qotmaydi.
**Variantlar:**
- A) QC "qayta ishlab chiqarish" qarori → avtomatik reja ishi + material so'rovi — yo'qolmaydi
- B) Faqat QC belgilaydi, reja qo'lда qo'shadi — sodda
- C) Ulanmaydi — oson, lekin unutiladi
- D) Keyin
⤳ Ta'sir: Reja (PP), Ombor (material)

### Q721. QC skip (tekshiruv o'tkazib yuborilganini aniqlash)
**Nima:** Agar biror operatsiya/buyurtma QC nuqtasini o'tmasdan oldinga ketsa (skip), buni tizim aniqlab belgilashi. (v2 Q52 override'дан farqli — bu ruxsatsiz/avtomatik o'tib ketishni aniqlaydi.)
**Nega kerak:** Shoshilinch buyurtmada "tezroq" deб QC tashlab ketiladi. Bu eng xavfli teshik. Tizim skip'ni avtomatik ko'rsatsa, javobgarlik aniq bo'ladi.
**Variantlar:**
- A) QC skip avtomatik aniqlanadi + belgilanadi + kim sababchi yoziladi — teshik ko'rinadi
- B) Skip mumkin, faqat log — yumshoq
- C) Aniqlanmaydi — oson, lekin xavfli teshik
- D) Keyin
⤳ Ta'sir: MES (oqim), Q75 (pre-production)

---

## 11-bo'lim. Smena topshirish, KPI, hisobot, AI

### Q722. Smena topshirish (shift handover) sifat yozuvi
**Nima:** Excel'da ден/ноч смена bor. Smena almashganda yarim tugagan ish, ochiq brak, mashina holati keyingi smenaga yozib topshirilishi.
**Nega kerak:** Tunги smena kunги brakni bilmasa, xato takrorlanadi. Smena topshirish yozuvi — uzluksiz sifat.
**Variantlar:**
- A) Majburiy smena-topshirish yozuvi (yarim ish + ochiq brak + mashina holati) — uzilish yo'q
- B) Og'zaki topshirish (yozuvsiz) — sodda, lekin yo'qoladi
- C) Topshirish yo'q — oson, lekin xato qaytadi
- D) Keyin
⤳ Ta'sir: MES (smena), HR (smena jadvali)

### Q723. Sifat (брак %) ni operator oyligiga ulash
**Nima:** Iyun ishchilar.xlsx'da operatorlar bo'yicha "Оылик %", "норма", "выработка" hisoblanadi. Sifat (брак %) ham shu oylik hisobiga ulanishi.
**Nega kerak:** Egasi vizyoni — razряд/норма → oylik. Agar faqat miqdor (выработка) hisoblansa-yu sifat hisoblanmasa, operator tez ishlaб brak chiqaradi. Sifat oylikка ulanishi kerak.
**Variantlar:**
- A) Oylik = miqdor (норма %) + sifat (брак %) birga (yuqori brak bonusni kamaytiradi) — sifat rag'batlanadi
- B) Faqat miqdor hisoblanadi, sifat alohida ko'rinadi (oylikка ta'sirsiz) — sodda
- C) Sifat oylikка ulanmaydi — oson, lekin sifat rag'batsiz
- D) Keyin
⤳ Ta'sir: HR/Payroll (oylik), Karta-model (GSD)

### Q724. Internal vs external brak ajratish (QC samaradorligi)
**Nima:** Brakni "ichkarida topilgan" (internal — sex ichida ushlangan) va "mijozda topilgan" (external — reklamatsiya) deб ajratish.
**Nega kerak:** Ichkarida topilgan brak — yaxshi (QC ishlayapti). Mijozда topilgan brak — yomon (teshik bor). Bu nisbat QC samaradorligini ko'rsatadi.
**Variantlar:**
- A) Internal/external brak ajratiladi (nisbat = QC samaradorligi ko'rsatkichi) — QC qanchalik ushlayotgani ko'rinadi
- B) Faqat umumiy brak (ajratilmaydi) — sodda
- C) Ajratilmaydi — oson, lekin QC samaradorligi noma'lum
- D) Keyin

### Q725. Sifat sababli chegirma/kompensatsiyani sifat narxiga qo'shish
**Nima:** Mijoz brak topib, lekin qabul qilsa (kichik nuqson uchun chegirma bilan) — bu chegirma sifat narxiga (COQ) qo'shilishi.
**Nega kerak:** "Mayli, oz nuqson, chegirma beraylik" — bu ham yo'qotish. Chegirmani hisoblamasak, sifat braki narxi kam ko'rinadi.
**Variantlar:**
- A) Sifat sababli chegirma/kompensatsiya COQ'ga qo'shiladi (mijoz+buyurtma kesimida) — to'liq yo'qotish ko'rinadi
- B) Faqat to'liq rad bo'lgan partiya hisoblanadi (chegirma emas) — qisman
- C) Hisoblanmaydi — oson, lekin yashirin yo'qotish
- D) Keyin
⤳ Ta'sir: Moliya (chegirma), Savdo

### Q726. Buyurtma yopilishida yakuniy sifat xulosasi
**Nima:** Har buyurtma yopilganda ichki yakuniy xulosa: jami plan/fakt, брак %, qaysi operatsiyada qancha brak, final QC natijasi — bir sahifada.
**Nega kerak:** Buyurtma tugagach "qancha yo'qotdik, qayerda?" degan savolga bir qarashda javob. Bu — keyingi shu mahsulotni yaxshiroq rejalashtirishga asos.
**Variantlar:**
- A) Buyurtma yopilishida avtomatik sifat xulosasi (plan/fakt/брак/operatsiya kesimi/final QC) — yakuniy tahlil
- B) Faqat umumiy brak soni — sodda
- C) Xulosa yo'q — oson, lekin tahlil yo'q
- D) Keyin
⤳ Ta'sir: Reja (PP), Q55 (operatsiya braki)

### Q727. Sifat kunlik/haftalik xulosasini egaga avtomatik yuborish
**Nima:** Egaga kunlik/haftalik sifat xulosasini (брак %, top defektlar, ochiq reklamatsiya, sifat narxi) avtomatik Telegram/email orqali yuborish.
**Nega kerak:** Ega har kuni tizimga kirib qaramaydi. Avtomatik xulosa — u dashboardни kutmasdan holatni biladi.
**Variantlar:**
- A) Avtomatik kunlik + haftalik sifat xulosasi egaga (Telegram) — passiv xabardorlik
- B) Faqat anomaliya bo'lganда — minimal
- C) Avtomatik yo'q, ega o'zi qaraydi — oson, lekin unutiladi
- D) Keyin
⤳ Ta'sir: AI/Telegram integratsiya, Q47 (KPI)

### Q728. AI bilan brak-riskini oldindan bashorat (material+operator+mashina+smena)
**Nima:** To'plangan brak tarixidan AI qaysi kombinatsiya (material turi + operator + mashina + смена) ko'p brak chiqarishini oldindan ko'rsatishi.
**Nega kerak:** Egasi vizyonida har modulда AI bor. Brak naqshini AI topib, "bu buyurtmada brak riski yuqori" deб oldindan ogohlantirsa — profilaktik nazorat.
**Variantlar:**
- A) AI brak-riskini oldindan baholaydi (material+operator+mashina+смена naqshidan) + buyurtmaga risk-belgi — profilaktik
- B) AI faqat o'tgan tahlil (Pareto) ko'rsatadi, bashoratsiz — sodda
- C) AI yo'q, faqat qo'lда tahlil — oson, lekin reaktiv
- D) Keyin
⤳ Ta'sir: AI integratsiya, Q56 (смена/operator)

### Q729. Takrorlanuvchi defekt chegaradan oshsa avtomatik tuzatuvchi-ish (CAPA)
**Nima:** Bir defekt belgilangan necha martadan ko'p takrorlansa (mas. oyiga 5+), tizim avtomatik tuzatuvchi-chora ishini (CAPA) ochib mas'ul tayinlasin.
**Nega kerak:** Takrorlanuvchi brakni qo'lда kuzatib yurish unutiladi. Avtomatik CAPA — takror muammoni majburан yopishga olib keladi.
**Variantlar:**
- A) Takrorlanish chegarasidan oshsa avtomatik CAPA ishi + mas'ul + muddat — takror majburan yopiladi
- B) Faqat Pareto'da ko'rsatish (qo'lда CAPA) — sodda
- C) Avtomatik emas — oson, lekin unutiladi
- D) Keyin
⤳ Ta'sir: Q18 (8D/5 nega)

### Q730. Yillik/davriy ichki sifat auditi (QC o'zini tekshirish)
**Nima:** QC jarayonining o'zini davriy tekshirish — normalar amaldami, inspektorlar to'g'ri ishlayaptimi, hujjatlar yangilanganmi.
**Nega kerak:** QC ham vaqt o'tib bo'shashadi (normaga qaramay "o'tdi" qo'yadi). Davriy ichki audit QC'ning o'zini nazoratда ushlaydi.
**Variantlar:**
- A) Davriy ichki sifat auditi (jadval + checklist + topilma + tuzatuv) — QC o'zi nazoratда
- B) Faqat muammo chiqqanда tekshirish — reaktiv
- C) Audit yo'q — oson, lekin QC bo'shashadi
- D) Keyin

### Q731. A-System / Excel brak tarixini ERP'ga ko'chirish
**Nima:** Kitob: "A-System (А-Система) — ишлаб чиқариш, режа, ҳисоб-китоб ва факт маълумотларини юритиш учун ишлатиладиган электрон тизим". Hozir brak/fakt o'sha eski tizim/Excelда. Yangi ERP'ga ko'chirish strategiyasi.
**Nega kerak:** Egasi yangi ERP quradi, lekin A-System/Excelда yillik tarix bor. Brak tarixini ko'chirmasak, trend noldan boshlanadi.
**Variantlar:**
- A) A-System/Excel brak tarixini ERP'ga import qilish (bir martalik) + yangi ma'lumot ERP'da — trend uzilmaydi
- B) Faqat yangidan boshlash (tarix qoldiriladi) — sodda, lekin trend yo'q
- C) Ikkala tizim parallel ishlaydi — chalkash, taqiqlansin
- D) Keyin
⤳ Ta'sir: Reja, MES (eski fakt ma'lumotlari)

### Q732. Sifat normasini ko'p-tilli (UZ lotin/kirill/RU) qilish
**Nima:** Fabrika hujjatlari kirill o'zbek va rus aralash (Резка, Брак, Высечка). Brak/defekt lug'ati ishchilar tushunadigan tilda (ko'pchilik kirill/rus atama ishlatadi) bo'lishi.
**Nega kerak:** Operator "Высечка брак" deб tushunadi, "kesish nuqsoni" demaydi. Lug'at ishchi tilida bo'lmasa, ular noto'g'ri kategoriyaga belgilaydi.
**Variantlar:**
- A) Defekt lug'ati ko'p-tilli (UZ lotin + kirill + RU, fabrika atamasi bilan) — ishchi tushunadi
- B) Faqat UZ lotin — toza, lekin ishchi chalkashadi
- C) Erkin matn — oson, lekin tahlilsiz
- D) Keyin
⤳ Ta'sir: i18n (3-til), Q7 (defekt klassifikatori)

### Q733. Rang nomuvofiqligi (цвет) — bosmada eng ko'p reklamatsiya
**Nima:** Karton bosmada eng ko'p shikoyat — rang etalondan farq qilishi. Har bosma operatsiyada rang mosligini (mijoz namunasi) tekshirish va belgilash.
**Nega kerak:** Bir partiya och, boshqasi to'q chiqsa — mijoz polkada farqни ko'radi va rad qiladi. Rang nazorati eng ko'p reklamatsiyani to'sadi.
**Variantlar:**
- A) Rang etaloni + tolerans (vizual + asbob) har bosma operatsiyada — kam reklamatsiya
- B) Faqat birinchi nusxa (priladka) tasdiqlanadi, qolgani o'tadi — o'rtacha
- C) Ko'z bilan, etalonsiz — eng oson, eng nizoli
- D) Keyin
⤳ Ta'sir: Q6 (bosma/rang ko'rsatkichi)

### Q734. Mijoz qabul/rad tarixini mahsulot+mijoz kesimida saqlash
**Nima:** Jo'natilgan partiyani mijoz qabul qildimi, rad etdimi, qancha qaytardi — shu tarixni mahsulot va mijoz kesimida saqlash. (v2 Q36–Q40 qaytarishlarni operatsion yuritadi; bu — tahliliy kesim.)
**Nega kerak:** Falon mijoz tez-tez qaytaradimi? Falon mahsulot ko'p rad bo'ladimi? Bu — kelajakdagi riskni oldindan ko'rsatadi.
**Variantlar:**
- A) Har jo'natma uchun qabul/rad/qaytarish tarixi (mijoz+mahsulot kesimida) — risk oldindan ko'rinadi
- B) Faqat alohida reklamatsiyalar (kesimsiz) — sodda
- C) Saqlanmaydi — oson, lekin takror risk
- D) Keyin
⤳ Ta'sir: Savdo (mijoz reytingi), CRM

### Q735. Brak sababini режа/техкарта xatosiga ajratish (reja braki)
**Nima:** Kichik buyurtmalar/reja tahlilida noto'g'ri razmer/material rejalashtirilgan bo'lsa, brak ishlab chiqaruvchidan emas, rejadan. Sabab-toifaga "режа/техкарта xatosi" qo'shilsin.
**Nega kerak:** 5-Dept'da reja ham bor. Agar texkartada xato o'lcham bo'lsa — operator to'g'ri ishlasa ham brak chiqadi. Sabab rejaga yozilishi kerak.
**Variantlar:**
- A) Brak sabab-toifasiga "режа/техкарта xatosi" qo'shiladi (rejalashtiruvchiga ulanadi) — adolatli
- B) Faqat дизайн/ишлаб чиқариш sababi (reja alohida emas) — sodda
- C) Reja braki ajratilmaydi — oson, lekin noto'g'ri ayblanadi
- D) Keyin
⤳ Ta'sir: Reja (PP), Q77 (dizayn braki), Karta-model

### Q736. Tashqi/qonuniy sertifikat amal muddatini kuzatish
**Nima:** Ba'zi mahsulot (oziq-ovqat, dori qadog'i) qonuniy sertifikat talab qiladi va sertifikatning amal muddati bor. Muddat tugashidan oldin ogohlantirish.
**Nega kerak:** Sertifikat muddati o'tib ketsa, o'sha mahsulotni qonuniy sotib bo'lmaydi. Muddatni kuzatmasak — to'satdan sota olmay qolamiz.
**Variantlar:**
- A) Sertifikat/normativ amal muddati kuzatiladi + tugashdan oldin ogohlantirish — to'satdan to'xtash yo'q
- B) Qo'lда eslab turish — xato xavfi
- C) Kuzatilmaydi — oson, lekin risk
- D) Keyin
⤳ Ta'sir: Q30 (sertifikat), Q86 (tartiblangan mahsulot)

---

DONE: QC / Sifat — 52 (Q1–Q52) + 52 yangi kitob-grounded (Q53–Q104).

## 10. Ombor / WMS

### Q737. Rulon kartochkasida asosiy o'lchov maydonlari
**Nima:** Har bir qog'oz/karton rulon kartochkasida qaysi fizik o'lchovlar saqlanadi?
**Nega kerak:** Ishlab chiqarish rulonni kesishni va sarfni shu maydonlar bo'yicha hisoblaydi; noto'g'ri maydon = noto'g'ri sarf.
**Variantlar:**
- A) Kenglik (mm) + Diametr (mm) + Zichlik/gramaj (g/m²) + Og'irlik (kg) + Uzunlik (m) — to'liq, eng aniq
- B) Faqat Kenglik + Gramaj + Og'irlik — soddaroq, lekin uzunlik hisoblanmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (rulon kesish/sarf), Sotuv (narx kg yoki m²), Finance (zaxira qiymati)

### Q738. Gramaj (zichlik) o'lchov birligi va diapazoni
**Nima:** Qog'oz zichligi qaysi birlikda va qanday qiymatlar ro'yxatidan tanlanadi?
**Nega kerak:** Karton zavodida gramaj asosiy sifat ko'rsatkichi; standart ro'yxat xatoni kamaytiradi.
**Variantlar:**
- A) g/m² (masalan: 80, 90, 100, 115, 125, 140, 150, 170, 200, 230, 250, 280, 300) — tanlovli ro'yxat, xato kam
- B) Erkin kiritiladigan raqam — moslashuvchan, lekin xato ko'p
- C) Keyin — hozir kerak emas

### Q739. Rulon qoldig'ini o'lchash usuli
**Nima:** Rulonda qancha material qolganini tizim qanday hisoblaydi — og'irlik (kg) bo'yicha, uzunlik (m) bo'yicha yoki diametr bo'yicha?
**Nega kerak:** Yarim ishlatilgan rulonlar zavodda eng ko'p; qoldiq noto'g'ri bo'lsa ombor soni yolg'on chiqadi.
**Variantlar:**
- A) Og'irlik (kg) asosiy + uzunlik avtomatik hisob (gramaj×kenglik orqali) — tarozida o'lchash oson
- B) Uzunlik (m) asosiy — kesish mashinasidan o'qiladi, lekin qo'lda kiritish qiyin
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Tarozi natijasi qo'lda kiritiladimi yoki tarozi tizimga ulanadimi? (qo'lda / avto-ulanish / keyin)

### Q740. Yarim rulon (ochilgan rulon) statusi
**Nima:** Ochilib, qisman ishlatilgan rulonga alohida status beriladimi (masalan "ochilgan", "to'liq", "qoldiq")?
**Nega kerak:** Ochilgan rulon birinchi ishlatilishi kerak (FIFO buzilmasligi uchun); status bo'lmasa yangi rulon ochiladi, eski chiqindiga ketadi.
**Variantlar:**
- A) Ha — status: To'liq / Ochilgan / Qoldiq(minimal) — ochilganlar avval taklif qilinadi
- B) Yo'q — faqat qoldiq miqdor ko'rsatiladi, status yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (material berishda ochilgan rulon birinchi)

### Q741. Rulonning noyob raqami (rulon ID/yorliq)
**Nima:** Har bir jismoniy rulonga alohida noyob raqam (barcode/QR yorliq) beriladimi yoki faqat material turi bo'yicha umumiy hisob yuritiladimi?
**Nega kerak:** Noyob raqam bo'lsa har bir rulonni alohida kuzatish, partiya, joylashuv aniq bo'ladi; bo'lmasa faqat "X material — Y kg" deyiladi.
**Variantlar:**
- A) Har rulonga noyob ID + bosib chiqariladigan yorliq (QR/barcode) — to'liq kuzatuv
- B) Faqat material turi bo'yicha umumiy miqdor — soddaroq, lekin rulonma-rulon yo'q
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Yorliqni kim bosadi — kirimda ombor xodimi yoki etiketka avtomat? (ombor xodimi / avto / keyin)

### Q742. Rulon manbasi (yetkazib beruvchi + sertifikat)
**Nima:** Kartochkada yetkazib beruvchi, ishlab chiqaruvchi zavod va sifat sertifikati raqami saqlanadimi?
**Nega kerak:** Sifat muammosi chiqsa qaysi yetkazib beruvchidan kelganini va sertifikatini topish kerak.
**Variantlar:**
- A) Yetkazib beruvchi + ishlab chiqaruvchi + sertifikat raqami + kelgan sana — to'liq izlanuvchanlik
- B) Faqat yetkazib beruvchi nomi — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (reklamatsiya), Xaridlar (yetkazib beruvchi reytingi)

### Q743. Rulon rangi/turi va qoplama
**Nima:** Kartochkada qog'oz turi (kraft, beliy, makulatura, test-layner, flyuting) va qoplama (laklangan, plyonka) ko'rsatiladimi?
**Nega kerak:** Buyurtmaga to'g'ri tur tanlanishi kerak; aralashib ketsa brak chiqadi.
**Variantlar:**
- A) Tur (kraft/test-layner/flyuting/beliy/makulatura) + qoplama maydoni — aniq tanlov
- B) Faqat material nomi ichida matn sifatida — qidirish qiyin
- C) Keyin — hozir kerak emas

### Q744. Namlik va saqlash sharti maydoni
**Nima:** Rulon kartochkasida namlik darajasi (%) va talab qilinadigan saqlash sharti (harorat/namlik) ko'rsatiladimi?
**Nega kerak:** Qog'oz nam tortsa gramaji va mustahkamligi o'zgaradi, brak chiqadi; namlik nazorati zarur.
**Variantlar:**
- A) Namlik (%) + tavsiya etilgan saqlash zonasi maydoni — sifat himoyasi
- B) Faqat ogohlantiruvchi belgi (nam joyda saqlamang) — minimal
- C) Keyin — hozir kerak emas

---

## 2-BO'LIM. Material klassifikatsiyasi

### Q745. Material asosiy toifalari
**Nima:** Ombordagi materiallar qanday asosiy toifalarga bo'linadi?
**Nega kerak:** Toifalar bo'yicha hisobot, javon, mas'ul va min/max alohida bo'ladi.
**Variantlar:**
- A) Xom-ashyo (rulon qog'oz) / Yordamchi (kley, bo'yoq, skotch, sim) / Tayyor mahsulot / Yarim tayyor / Chiqindi — to'liq
- B) Faqat Xom-ashyo / Tayyor mahsulot — soddaroq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymati toifa bo'yicha), Hisobotlar

### Q746. Material kodlash tizimi (artikul)
**Nima:** Har materialga kod qanday beriladi — avtomatik raqam, qo'lda, yoki ma'noli kod (tur+gramaj+kenglik)?
**Nega kerak:** Kod bir xil mantiqda bo'lmasa, bir material ikki nomda kiritiladi (dublikat).
**Variantlar:**
- A) Ma'noli kod (masalan KR-125-1400 = kraft-125g-1400mm) + avto-tartib raqam — o'qish oson
- B) Faqat avtomatik raqam (000123) — sodda, lekin ma'nosiz
- C) Keyin — hozir kerak emas

### Q747. O'lchov birliklari va konvertatsiya
**Nima:** Bir material uchun bir nechta o'lchov birligi bo'ladimi (kg, m, m², dona, rulon) va ular o'zaro avtomatik o'tkaziladimi?
**Nega kerak:** Qog'oz kg da keladi, lekin chiqim m² da; konvertatsiya bo'lmasa hisob noto'g'ri.
**Variantlar:**
- A) Asosiy birlik (kg) + avtomatik konvertatsiya (kg↔m↔m²) gramaj/kenglik orqali — aniq
- B) Har materialga bitta birlik, konvertatsiya qo'lda — sodda, lekin xatoli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf), Sotuv (narxlash), Finance

### Q748. Bir xil materialning bir nechta yetkazib beruvchisi
**Nima:** Bitta material (masalan kraft-125) bir nechta yetkazib beruvchidan kelganda, ombor uni bitta karta sifatida ko'radimi yoki yetkazib beruvchi bo'yicha alohida?
**Nega kerak:** Sifat va narx yetkazib beruvchiga qarab farq qiladi; aralashtirib hisoblansa muammo yashirinadi.
**Variantlar:**
- A) Bitta material kartasi, lekin partiya/kirim darajasida yetkazib beruvchi saqlanadi — balansli
- B) Har yetkazib beruvchiga alohida material kartasi — aniq, lekin ko'p dublikat
- C) Keyin — hozir kerak emas

### Q749. ABC / muhimlik klassifikatsiyasi
**Nima:** Materiallar qiymati/aylanmasi bo'yicha ABC toifaga bo'linadimi (A = qimmat/muhim, C = arzon)?
**Nega kerak:** A-toifa materiallarni qattiq nazorat, C-ni yengil nazorat qilish vaqt va pulni tejaydi.
**Variantlar:**
- A) Ha — ABC avtomatik hisoblanadi (yillik sarf×narx bo'yicha) — aqlli nazorat
- B) Qo'lda belgilanadi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Hisobotlar (ABC tahlil), Inventarizatsiya chastotasi

### Q750. Xavfli/maxsus materiallar belgisi
**Nima:** Yonuvchi (kley, eritgich, bo'yoq) yoki maxsus saqlash talab qiladigan materiallarga alohida belgi qo'yiladimi?
**Nega kerak:** Yong'in xavfsizligi va alohida zona uchun; aralashsa xavf.
**Variantlar:**
- A) Ha — "Yonuvchi / Kimyoviy / Maxsus saqlash" bayroqlari + alohida zona — xavfsizlik
- B) Yo'q — oddiy material kabi — xavfli
- C) Keyin — hozir kerak emas

---

## 3-BO'LIM. Kirim blankasi (qabul qilish)

### Q751. Kirim blankasi majburiy maydonlari
**Nima:** Materialni omborga qabul qilishda blankada qaysi maydonlar majburiy?
**Nega kerak:** Maydonlar to'liq bo'lmasa keyin izlanuvchanlik va inventarizatsiya buziladi.
**Variantlar:**
- A) Sana + Yetkazib beruvchi + Hujjat/nakladnoy raqami + Material + Miqdor + Birlik + Partiya + Qabul qiluvchi + Javon — to'liq
- B) Sana + Material + Miqdor + Qabul qiluvchi — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (kirim → kreditorlik), Xaridlar (zakaz bilan solishtirish)

### Q752. Buyurtma (PO) bilan solishtirish
**Nima:** Kirim xaridlar buyurtmasi (PO) bilan avtomatik solishtiriladimi — kelgan miqdor zakazga to'g'ri keladimi?
**Nega kerak:** Ortiqcha yoki kam kelganini darhol ko'rish; tovush bo'lmasa to'lov xato bo'ladi.
**Variantlar:**
- A) Ha — PO bilan 3 tomonlama solishtirish (zakaz/kirim/hisob-faktura), farq belgilanadi — nazorat
- B) Erkin kirim, PO ixtiyoriy — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Farq qancha foizgacha ruxsat etiladi (tolerans)? (±2% / ±5% / 0% qat'iy)

### Q753. Kirimda sifat tekshiruvi (QC) bog'lanishi
**Nima:** Material kirimda darhol omborga kiradimi yoki avval sifat tekshiruvidan o'tib, "karantin" zonasida turadimi?
**Nega kerak:** Tekshirilmagan material ishlab chiqarishga ketsa brak partiya chiqadi.
**Variantlar:**
- A) Avval karantin → QC OK → erkin zonaga o'tadi — eng xavfsiz
- B) Darhol erkin zonaga, QC keyin — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (kirim inspeksiyasi), Ishlab chiqarish (faqat OK material)

### Q754. Qisman qabul (kam/buzuq kelgan tovar)
**Nima:** Kelgan tovarning bir qismi shikastlangan/kam bo'lsa, qisman qabul qilib, qolganini rad etish mumkinmi?
**Nega kerak:** Hammasini qabul qilib keyin tuzatish chalkash; qisman qabul aniqroq.
**Variantlar:**
- A) Ha — qabul qilingan / rad etilgan miqdor alohida yoziladi + rad sababi — aniq
- B) Yo'q — yo hammasi yo hech narsa — sodda, lekin moslashuvsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (yetkazib beruvchi reytingi), Finance (faqat qabul qilingani uchun to'lov)

### Q755. Kirim tarozi vazni va farq
**Nima:** Rulon kirimida hujjatdagi vazn va tarozidagi haqiqiy vazn solishtiriladimi va farq yoziladimi?
**Nega kerak:** Qog'oz vazni bo'yicha sotiladi; hujjat va haqiqat orasidagi farq pul yo'qotish.
**Variantlar:**
- A) Ha — hujjat vazni + tarozi vazni + farq (kg va %) avtomatik — pul nazorati
- B) Faqat tarozi vazni yoziladi — sodda
- C) Keyin — hozir kerak emas

### Q756. Kim kirim qila oladi (huquq)
**Nima:** Kirim blankasini faqat ombor mas'uli yarata oladimi yoki har kim?
**Nega kerak:** Mas'uliyatsiz kirim = soxta zaxira; mas'ul kishi aniq bo'lishi kerak.
**Variantlar:**
- A) Faqat ombor mas'uli/qabul qiluvchi roli — nazorat
- B) Har bir foydalanuvchi — erkin, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Rollar (huquqlar), Audit (kim kiritdi)

---

## 4-BO'LIM. Chiqim blankasi (berish/sarflash)

### Q757. Chiqim sababi (turlari)
**Nima:** Materialni chiqim qilishda sabab tanlanadimi — ishlab chiqarishga, sotuvga, brakka, sinovga, qaytarishga?
**Nega kerak:** Sababsiz chiqim sarfni tahlil qilishni imkonsiz qiladi.
**Variantlar:**
- A) Ha — Ishlab chiqarishga / Sotuvga / Brak/chiqindi / Sinov / Qaytarish / Ichki ko'chirish — to'liq tahlil
- B) Faqat "chiqim" — sodda, lekin sababsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf), Finance (xarajat hisobi), Hisobotlar

### Q758. Ishlab chiqarish buyurtmasiga bog'lash
**Nima:** Ishlab chiqarishga chiqim qaysi buyurtma/ish-naryadga tegishli ekani ko'rsatiladimi?
**Nega kerak:** Buyurtma tannarxini hisoblash uchun har bir buyurtmaga qancha material ketgani bilinishi kerak.
**Variantlar:**
- A) Ha — chiqim ishlab chiqarish buyurtmasi raqamiga majburiy bog'lanadi — tannarx aniq
- B) Yo'q — umumiy sarf — tannarx noaniq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (BOM/sarf normasi), Finance (buyurtma tannarxi)

### Q759. Norma bilan solishtirish (rejadagi sarf)
**Nima:** Chiqimda haqiqiy sarf BOM/texkartadagi normaga to'g'ri keladimi — ortiqcha sarf belgilanadimi?
**Nega kerak:** Ortiqcha sarf (chiqindi yoki o'g'irlik) faqat norma bilan solishtirilganda ko'rinadi.
**Variantlar:**
- A) Ha — norma vs haqiqiy farq foizda ko'rsatiladi, ortiqcha bo'lsa ogohlantirish — nazorat
- B) Yo'q — faqat haqiqiy chiqim — nazoratsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (sarf normasi), Sifat (chiqindi sababi)

### Q760. Chiqimda FIFO/FEFO qoidasi
**Nima:** Material berishda tizim qaysi partiyani birinchi taklif qiladi — birinchi kelgan (FIFO) yoki muddati birinchi tugaydigan (FEFO)?
**Nega kerak:** Eski material qolib ketmasligi va muddati o'tmasligi uchun avtomatik tartib kerak.
**Variantlar:**
- A) FIFO (birinchi kelgan-birinchi chiqadi) standart, kley/bo'yoqqa FEFO — qog'ozga mos
- B) Xodim o'zi tanlaydi — moslashuvchan, lekin tartib buziladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat (muddati o'tgan material brak)

### Q761. Manfiy qoldiqdan himoya
**Nima:** Omborda mavjud miqdordan ko'p chiqim qilishga tizim ruxsat beradimi?
**Nega kerak:** Manfiy qoldiq = soxta hisob; ishlab chiqarishni to'xtatadigan kechikishlar yashirinadi.
**Variantlar:**
- A) Yo'q — mavjuddan ortiq chiqim bloklanadi (yoki ruxsat bilan) — aniq hisob
- B) Ha — manfiyga ruxsat, keyin to'g'rilanadi — chalkash
- C) Keyin — hozir kerak emas

### Q762. Chiqimni tasdiqlash (ikki imzo)
**Nima:** Katta yoki qimmat chiqim uchun tasdiqlash (oluvchi + beruvchi imzosi yoki rahbar tasdiqi) kerakmi?
**Nega kerak:** Qimmat materialni nazoratsiz berish yo'qotishga olib keladi.
**Variantlar:**
- A) Ha — belgilangan summadan yuqori chiqim rahbar tasdiqini talab qiladi — nazorat
- B) Yo'q — har qanday chiqim erkin — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Qaysi summa/miqdordan tasdiqlash boshlanadi? (belgilangan summa / A-toifa material / har doim)

---

## 5-BO'LIM. Inventarizatsiya va og'ish (farq)

### Q763. Inventarizatsiya turi va chastotasi
**Nima:** Inventarizatsiya qanchalik tez-tez va qaysi usulda o'tkaziladi?
**Nega kerak:** Sanoqsiz ombor ishonchsiz; lekin to'liq sanoq ishlab chiqarishni to'xtatadi.
**Variantlar:**
- A) Aylanma sanoq (har kuni bir qism, A-toifa tez-tez) + yiliga 1 to'liq — balansli
- B) Faqat yiliga 1-2 marta to'liq sanoq — sodda, lekin kech aniqlanadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymatini tasdiqlash)

### Q764. Sanoq usuli (ko'r sanoq)
**Nima:** Sanaganda xodimga tizimdagi miqdor ko'rsatiladimi yoki "ko'r sanoq" (raqamni ko'rmasdan sanash)?
**Nega kerak:** Tizimdagi raqamni ko'rib sanasa, xodim shunchaki ko'chirib yozadi, haqiqiy farq yashirinadi.
**Variantlar:**
- A) Ko'r sanoq — raqam yashirin, faqat sanab kiritadi — halol natija
- B) Ochiq sanoq — tizim raqami ko'rinadi — tez, lekin yolg'on
- C) Keyin — hozir kerak emas

### Q765. Og'ish (farq) chegarasi va tasdiqlash
**Nima:** Sanoq farqi qancha foizgacha avtomatik qabul qilinadi, qaysidan keyin rahbar tasdiqi kerak?
**Nega kerak:** Kichik farq normal (o'lchov xatosi), katta farq tergov talab qiladi.
**Variantlar:**
- A) ±1% gacha avto-tuzatish, undan yuqori rahbar tasdiqi + sabab — nazorat
- B) Har qanday farq avtomatik tuzatiladi — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (farqni zarar/foyda sifatida yozish)

### Q766. Og'ish sababi ro'yxati
**Nima:** Sanoq farqi topilganda sabab tanlanadimi (o'lchov xatosi, o'g'irlik, namlik yo'qolishi, chiqindi yozilmagan, hujjat xatosi)?
**Nega kerak:** Sababsiz farq takrorlanadi; sabab bo'lsa muammoni tuzatish mumkin.
**Variantlar:**
- A) Ha — sabab majburiy ro'yxatdan tanlanadi — tahlil mumkin
- B) Yo'q — faqat raqam tuzatiladi — sababsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat/Audit (takroriy sabablar tahlili)

### Q767. Inventarizatsiya vaqtida harakatni muzlatish
**Nima:** Sanoq paytida o'sha zona/material bo'yicha kirim-chiqim bloklanadimi (muzlatiladimi)?
**Nega kerak:** Sanab turganda chiqim bo'lsa, natija doim noto'g'ri chiqadi.
**Variantlar:**
- A) Ha — sanalayotgan zona muzlatiladi, sanoq tugagach ochiladi — aniq natija
- B) Yo'q — harakat davom etadi — chalkashlik
- C) Keyin — hozir kerak emas

### Q768. Tarozi bilan rulon sanog'i
**Nima:** Rulonlarni sanaganda har birini tarozida tortishadimi yoki kartochkadagi vazn ishonchli deb olinadimi?
**Nega kerak:** Yarim rulonlarning haqiqiy qoldig'i faqat tortilganda aniq bo'ladi.
**Variantlar:**
- A) Ochilgan rulonlar tortiladi, to'liq rulonlar kartochka vazni bo'yicha — balansli
- B) Hammasi kartochka vazni bo'yicha — tez, lekin noaniq
- C) Keyin — hozir kerak emas

---

## 6-BO'LIM. Min / Max / Reorder (har material uchun)

### Q769. Minimal qoldiq (signal nuqtasi)
**Nima:** Har material uchun minimal qoldiq belgilanadimi va undan tushganda ogohlantirish chiqadimi?
**Nega kerak:** Material tugab qolsa ishlab chiqarish to'xtaydi; oldindan signal kerak.
**Variantlar:**
- A) Ha — har materialga min qoldiq + tushganda avto-ogohlantirish — to'xtab qolish oldi olinadi
- B) Yo'q — qo'lda kuzatiladi — kech qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (avto-zayavka), Ishlab chiqarish (uzilish oldi)

### Q770. Reorder (qayta buyurtma) nuqtasi va miqdori
**Nima:** Minimal nuqtaga yetganda tizim qancha buyurtma qilishni taklif qiladimi (reorder miqdori)?
**Nega kerak:** Faqat signal bermay, "qancha buyurtma qilish" ham ko'rsatilsa, xaridlar tezlashadi.
**Variantlar:**
- A) Ha — reorder nuqtasi + tavsiya etilgan buyurtma miqdori (sarf tezligi×yetkazib berish muddati) — aqlli
- B) Faqat signal, miqdorni xodim o'zi hal qiladi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (avtomatik zayavka loyihasi)

### Q771. Maksimal qoldiq (ortiqcha zaxira)
**Nima:** Har materialga maksimal qoldiq belgilanadimi — undan oshsa ortiqcha zaxira deb belgilansinmi?
**Nega kerak:** Ortiqcha zaxira pulni muzlatadi va joyni egallaydi; qog'oz nam tortadi.
**Variantlar:**
- A) Ha — max qoldiq + oshganda ogohlantirish — pul va joy tejaladi
- B) Yo'q — faqat min nazorat qilinadi — bir tomonlama
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (muzlatilgan kapital)

### Q772. Mavsumiy / dinamik min-max
**Nima:** Min/max qiymatlar yil davomida o'zgaradimi (mavsumiy talab) yoki bir martalik qat'iy raqammi?
**Nega kerak:** Karton talabi mavsumga qarab o'zgaradi; qat'iy raqam yo kam yo ortiqcha zaxira beradi.
**Variantlar:**
- A) Dinamik — oxirgi 3-6 oy sarfiga qarab avto-qayta hisoblanadi — aqlli
- B) Qat'iy qo'lda kiritilgan raqam — sodda
- C) Keyin — hozir kerak emas

### Q773. Yetkazib berish muddati (lead time) hisobi
**Nima:** Reorder nuqtasini hisoblashda yetkazib beruvchining yetkazib berish muddati (kun) hisobga olinadimi?
**Nega kerak:** Material uzoqdan kelsa, ertaroq buyurtma qilish kerak; muddatsiz signal kech bo'ladi.
**Variantlar:**
- A) Ha — har yetkazib beruvchiga lead time + xavfsizlik zaxirasi hisobga olinadi — aniq
- B) Yo'q — faqat joriy qoldiq — kech qolish xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Xaridlar (yetkazib beruvchi muddati)

---

## 7-BO'LIM. Karantin (bloklash) va sabablari

### Q774. Karantin sabablari ro'yxati
**Nima:** Material qaysi sabablarga ko'ra karantinga (bloklangan zona) qo'yiladi?
**Nega kerak:** Karantin sababsiz bo'lsa, material noma'lum muddat yotadi yoki noto'g'ri ishlatiladi.
**Variantlar:**
- A) Ha — Sifat tekshiruvi kutilmoqda / Brak shubhasi / Namlik / Yetkazib beruvchi reklamatsiyasi / Muddat o'tgan / Hujjat yo'q — to'liq
- B) Faqat "bloklangan" belgisi, sababsiz — minimal
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (qaror), Ishlab chiqarish (karantin material berilmaydi)

### Q775. Karantindan chiqarish (kim va qanday)
**Nima:** Karantindagi materialni kim erkin zonaga o'tkaza oladi va qanday qaror bilan?
**Nega kerak:** Nazoratsiz chiqarsa brak material ishlab chiqarishga ketadi.
**Variantlar:**
- A) Faqat Sifat nazorati roli qaror bilan (OK / Brak / Qaytarish) chiqaradi — nazorat
- B) Ombor mas'uli o'zi chiqaradi — tez, lekin xavfli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (yakuniy qaror)

### Q776. Karantin natijasi (qaror variantlari)
**Nima:** Karantindan keyin material qanday natijaga olib boriladi?
**Nega kerak:** Aniq natija bo'lmasa material karantin zonasini to'ldiradi.
**Variantlar:**
- A) OK→erkin zona / Past sifat→arzon ishga / Brak→chiqindi / Qaytarish→yetkazib beruvchiga — to'liq yo'l
- B) Faqat OK yoki Brak — ikki yo'l
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (qaytarish→kreditni kamaytirish), Xaridlar (reklamatsiya)

### Q777. Karantinda turish muddati
**Nima:** Material karantinda maksimal qancha tura oladi, undan keyin avtomatik ogohlantirish chiqadimi?
**Nega kerak:** Unutilgan karantin materiali joyni egallaydi va pul muzlatadi.
**Variantlar:**
- A) Ha — belgilangan kundan oshsa rahbarga ogohlantirish — unutilmaydi
- B) Yo'q — muddat cheksiz — unutiladi
- C) Keyin — hozir kerak emas

---

## 8-BO'LIM. Ombor-ichi ko'chirish (joylashuv)

### Q778. Ombor topologiyasi (zona/qator/javon)
**Nima:** Ombor qanday joy birliklariga bo'linadi — zona, qator, javon, yacheyka?
**Nega kerak:** Aniq joy bo'lmasa rulonni topish vaqt oladi; joy kodi kerak.
**Variantlar:**
- A) Zona → Qator → Javon → Yacheyka (kod: A-12-3-2) — aniq topish
- B) Faqat zona nomi (xom-ashyo zonasi) — sodda, lekin noaniq
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Chiqimda "qaysi javondan olish" ko'rsatmasi

### Q779. Ichki ko'chirish blankasi
**Nima:** Materialni bir joydan boshqasiga ko'chirganda harakat yoziladimi (qaysidan-qayerga-kim)?
**Nega kerak:** Ko'chirish yozilmasa, tizimda material A javonda ko'rinadi, aslida B da — topib bo'lmaydi.
**Variantlar:**
- A) Ha — ko'chirish harakati: manba joy + maqsad joy + miqdor + xodim + sana — aniq
- B) Yo'q — joy faqat qo'lda yangilanadi — adashish
- C) Keyin — hozir kerak emas

### Q780. Bir nechta ombor / filial
**Nima:** Zavodda bir nechta ombor (asosiy, sex yonidagi, tayyor mahsulot) bo'ladimi va ular orasida ko'chirish kuzatiladimi?
**Nega kerak:** Bir nechta ombor bo'lsa, har birida alohida qoldiq va ular orasidagi ko'chirish aniq bo'lishi kerak.
**Variantlar:**
- A) Ha — har ombor alohida, ombor-aro ko'chirish harakat sifatida — aniq
- B) Yo'q — bitta umumiy ombor — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Hisobotlar (ombor bo'yicha qoldiq)

### Q781. Yacheyka sig'imi va band/bo'sh holati
**Nima:** Har javon/yacheyka uchun maksimal sig'im va hozir band/bo'sh holati saqlanadimi?
**Nega kerak:** Kirimда yangi rulonni qayerga qo'yishni tizim taklif qila olishi uchun bo'sh joy kerak.
**Variantlar:**
- A) Ha — sig'im + band/bo'sh + avto-joy taklifi — tartibli ombor
- B) Yo'q — xodim o'zi joy tanlaydi — erkin, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q782. Tayyor mahsulot zonasi alohida
**Nima:** Tayyor mahsulot (kesilgan karton, qutilar) xom-ashyodan alohida zonada hisobga olinadimi?
**Nega kerak:** Tayyor mahsulot va xom-ashyo aralashsa, sotuv va ishlab chiqarish hisobi chalkashadi.
**Variantlar:**
- A) Ha — tayyor mahsulot ombori alohida, sotuvga shu yerdan chiqadi — aniq
- B) Bir zonada — sodda, lekin chalkash
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (tayyor mahsulot rezervi), Ishlab chiqarish (tayyor mahsulot topshirish)

---

## 9-BO'LIM. Partiya / Batch va muddat

### Q783. Partiya (batch) raqami
**Nima:** Har kirimga partiya raqami beriladimi va chiqimda qaysi partiyadan ketgani saqlanadimi?
**Nega kerak:** Sifat muammosi chiqsa, qaysi partiya qaysi buyurtmaga ketganini topish kerak (izlanuvchanlik).
**Variantlar:**
- A) Ha — har kirim = partiya, chiqim partiyaga bog'lanadi (oldinga/orqaga izlash) — to'liq izlanuvchanlik
- B) Yo'q — faqat umumiy material miqdori — izlanuvchanlik yo'q
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (reklamatsiya izlash), Ishlab chiqarish (qaysi partiya qaysi buyurtmada)

### Q784. Yaroqlilik muddati (kley/bo'yoq/kimyo)
**Nima:** Muddatga ega materiallar (kley, bo'yoq, lak) uchun yaroqlilik muddati saqlanadimi va o'tganda ogohlantirish chiqadimi?
**Nega kerak:** Muddati o'tgan kley/bo'yoq braka olib keladi; oldindan ogohlantirish kerak.
**Variantlar:**
- A) Ha — yaroqlilik sanasi + N kun oldin ogohlantirish + o'tganda bloklash — sifat himoyasi
- B) Yo'q — muddat kuzatilmaydi — brak xavfi
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Necha kun oldin ogohlantirilsin? (30 kun / 15 kun / 7 kun)
  - ⤳ Ta'sir: Sifat nazorati, Chiqim (muddati o'tgan bloklanadi)

### Q785. Partiya bo'yicha sifat ko'rsatkichi
**Nima:** Har partiya uchun sifat ko'rsatkichlari (gramaj, namlik, mustahkamlik) saqlanadimi?
**Nega kerak:** Bir material turidagi turli partiyalar sifati farq qiladi; ishlab chiqarish to'g'ri partiyani tanlashi kerak.
**Variantlar:**
- A) Ha — partiyaga QC natijalari biriktiriladi — sifatli tanlov
- B) Yo'q — faqat material turi bo'yicha — umumiy
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati (partiya pasporti)

### Q786. Partiyalarni aralashtirishga ruxsat
**Nima:** Bitta buyurtmaga turli partiyalardan material ishlatishga ruxsat beriladimi yoki bitta partiyadan bo'lishi shartmi?
**Nega kerak:** Rang/gramaj partiyalararo biroz farq qiladi; aralashtirsa tayyor mahsulotda rang/sifat tafovuti chiqadi.
**Variantlar:**
- A) Imkon qadar bitta partiyadan, kerak bo'lsa aralashtirishga ogohlantirish bilan ruxsat — sifat balansi
- B) Erkin aralashtirish — tez, lekin rang/sifat farqi xavfi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sifat nazorati, Ishlab chiqarish (bir buyurtma = bir partiya tavsiyasi)

### Q787. Eski/harakatsiz zaxira (dead stock)
**Nima:** Uzoq vaqt harakatsiz turgan material (masalan 6 oydan beri chiqim bo'lmagan) avtomatik belgilanadimi?
**Nega kerak:** Harakatsiz zaxira pulni muzlatadi va qog'oz buzilib ketadi; sotib yuborish yoki ishlatish kerak.
**Variantlar:**
- A) Ha — N kundan beri harakatsiz material "o'lik zaxira" deb belgilanadi + hisobot — pul qaytarish
- B) Yo'q — kuzatilmaydi — muzlatilgan pul
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Finance (zaxira qiymatini kamaytirish), Sotuv (chegirma bilan sotish)

### Q788. Qoldiq/oraliq kesindi (obrezka) hisobi
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

### Q789. Sexga chiqarishdan oldin techkarta-material mosligi tekshiruvi
**Nima:** Material sexga chiqarilishidan oldin tizim uni shu buyurtma texkartasidagi qog'oz turi bilan solishtirib, mos kelmasa bloklaydimi?
**Nega kerak:** Kitobda aniq misol — texkartada "топлайнер", omborchi esa "местный (макулатура)" qog'ozni tayyorlagan; to'xtatilmasa ishlab chiqarish to'xtaydi, mahsulot brakka chiqadi.
**Variantlar:**
- A) Tizim bloklaydi — texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim ruxsat etilmaydi — brakni oldindan to'xtatadi
- B) Faqat ogohlantirish, chiqarishga ruxsat — tezroq, lekin xato o'tib ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (texkarta) ↔ Ombor ↔ MES
  ↳ Agar A: kim "majburan chiqarish" override qila oladi? A1) faqat ishlab chiqarish boshlig'i+sabab; A2) hech kim, texkartani tuzatib; A3) ichki logistika boshlig'i

### Q790. Gofra qavatini aralashtirishdan himoya (3 ╳ 5 qavat)
**Nima:** Bir smenada bir nechta buyurtma bo'lsa (biri 5-qavat, biri 3-qavat), tizim qaysi qog'oz qaysi buyurtmaga ekanini ajratib, aralashtirishni oldini oladimi?
**Nega kerak:** Kitobda misol: 5-qavat va 3-qavat gofra bir vaqtda rejalashtirilgan, omborchi chiqishda aralashtirgan → reja buzilgan.
**Variantlar:**
- A) Har chiqim buyurtma+texkartaga bog'lanadi; boshqa buyurtmaga skanlasa ogohlantirish — aralashish yo'qoladi
- B) Faqat qog'oz turini ko'rsatadi, buyurtmaga bog'lamaydi — qisman
- C) Keyin
⤳ Ta'sir: PP, MES, ichki logistika

### Q791. Poddon (palet) birligini hisobga olish
**Nima:** Material ombordan "poddon" birligida ham chiqariladimi (kitob: поддонлар) va tizim poddon sonini alohida hisoblaydimi?
**Nega kerak:** Kitobda ichki logistika "поддонлар, ярим тайёр маҳсулотлар"ni participalarga vaqtida yetkazadi — poddon transport/hisob birligi.
**Variantlar:**
- A) Poddon=qadoq/transport birligi, har poddonda nechta dona/kg yozilib tizim ikkala birlikda ko'rsatadi — qulay
- B) Faqat dona/kg, poddon yo'q — ichki logistikaga noqulay
- C) Keyin
⤳ Ta'sir: ichki logistika, MES qadoqlash

### Q792. Ichki transport so'rovi (rohler chaqirish) va kechikish izi
**Nima:** Sex (participok) materialni ichki logistikadan tizim orqali "so'rov" bilan chaqiradimi — rohlerchiga vazifa yaratiladimi?
**Nega kerak:** Kitob: ichki logistika boshlig'i "рохлерчиларга аниқ вазифалар берди"; material yetishmasligidan dastgoh to'xtashi (бекор туриш) eng katta yo'qotish.
**Variantlar:**
- A) Sex "material kerak" so'rovi qoldiradi → rohlerchiga vazifa → bajarildi belgisi — kechikish ko'rinadi
- B) So'rov og'zaki, tizimda yo'q — hozirgi holat, ko'rinmas
- C) Keyin
⤳ Ta'sir: ichki logistika, MES (bekor turish), Coordination
  ↳ Agar A: kechikkanda kimga eskalatsiya? A1) ichki logistika boshlig'i; A2) smena boshlig'i; A3) Coordination

### Q793. "Bekor turish" sababini ombor-yetishmasligiga bog'lash (KPI)
**Nima:** Dastgoh material yo'qligidan to'xtaganda (бекор туриш), sabab tizimda "ombor/logistika kechikishi" deb qayd etiladimi?
**Nega kerak:** Kitobда ichki logistika statistikasi: "Ички логистика сабабли юзага келган кечикишлар сони" — bu KPI sifatida o'lchanishi kerak.
**Variantlar:**
- A) Downtime sabab kodida "material yetishmovchiligi (logistika)" alohida, oyiga hisoblanadi — KPI real
- B) Faqat umumiy "to'xtash" — sabab ajralmaydi
- C) Keyin
⤳ Ta'sir: MES, ichki logistika KPI, IoT

### Q794. Chiqindi va qoldiqni ajratib hisobga olish
**Nima:** Ishlab chiqarishdan chiqqan chiqindi va qoldiqlar (чиқиндилар ва қолдиқлар) qayta ishlatiladigan ╳ chiqindi deb ajratib hisoblanadimi?
**Nega kerak:** Kitob: ichki logistika boshlig'i "чиқиндилар ва қолдиқларни белгиланган тартибда чиқарилишини ташкил этади" — rasmiy vazifa; makulatura daromad bo'lishi mumkin.
**Variantlar:**
- A) Ikki turga: qayta ishlatiladigan qoldiq (omborga, makulatura) ╳ chiqindi (utilizatsiya) — makulatura daromad
- B) Faqat "chiqindi chiqdi", qiymatsiz — makulatura yo'qoladi
- C) Keyin
⤳ Ta'sir: ichki logistika, Finance (makulatura savdosi), MES brak

### Q795. Местный (makulatura) qog'ozni alohida zaxira sifatida boshqarish
**Nima:** Местный (makulatura) qog'oz alohida material turi sifatida o'z qoldig'i, narxi va "qaysi mahsulotlarga ruxsat" belgisi bilan boshqariladimi?
**Nega kerak:** Kitobда местный — toplaynerga arzon, past sifatli muqobil; faqat ruxsat etilgan buyurtmalarga ketishi kerak.
**Variantlar:**
- A) Alohida kartochka + ruxsat etilgan mahsulotlar ro'yxati — past sifat noto'g'ri buyurtmaga ketmaydi
- B) Bir umumiy "qog'oz" toifasi — chalkashlik
- C) Keyin
⤳ Ta'sir: PP texkarta, QC

### Q796. Grammaj bo'yicha kirim tekshiruvi
**Nima:** Qog'oz kelganda deklaratsiya qilingan grammaj (g/m²) namunada o'lchanib, og'ish bo'lsa qabul cheklanadimi?
**Nega kerak:** Kitobда grammaj texkarta uchun kalit ("унинг грамажи, сифати"); xato grammaj kelsa butun partiya noto'g'ri ishlatiladi.
**Variantlar:**
- A) Namuna grammaji o'lchanadi, ±tolerantlik chegarasi, oshsa karantin — sifat kafolati
- B) Faqat hujjatga ishonadi — xavfli
- C) Keyin
⤳ Ta'sir: Таъминот, QC

### Q797. Import xom-ashyo yo'lda (in-transit) holati
**Nima:** Chetdan kelayotgan xom-ashyo (импорт хом ашё) "jo'natildi/bojxona/keldi" bosqichlarida tizimda ko'rinadimi?
**Nega kerak:** Kitob: Таъминот бўлими boshlig'i "импорт хом ашёларни етказиб келиш"ga mas'ul; import uzoq, yo'ldagi tovar ko'rinmasa reja buziladi.
**Variantlar:**
- A) Import buyurtmasi bosqichli holat + taxminiy kelish sanasi — reja real
- B) Faqat "kelganda" kirim — yo'ldagi tovar ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Таъминот, PP/MRP (lead-time), Finance (avans)

### Q798. Import lead-time va valyuta narxi
**Nima:** Import materialda yetkazish muddati (kun) va valyuta kursi narxi saqlanib, reorder hisobida ishlatiladimi?
**Nega kerak:** Importni 2-3 oy oldin buyurtma qilish kerak; valyuta kursi narxni o'zgartiradi.
**Variantlar:**
- A) Har materialда "import/mahalliy" bayroq + lead-time + valyuta — reorder import uchun ertaroq
- B) Hammasi bir xil lead-time — import kech buyurtma bo'lib qoladi
- C) Keyin
⤳ Ta'sir: Таъминот, MRP, Finance

### Q799. Yetkazib beruvchi ishonchliligi reytingi
**Nima:** Har yetkazib beruvchi uchun "o'z vaqtida %", "brak %", "narx" reytingi tizimda saqlanadimi?
**Nega kerak:** Taъminot boshlig'i bir nechta beruvchi bilan ishlaydi (kitob: "Етказиб берувчилар"); kim ishonchli ekani bilinmasa doim kechikadiganga buyurtma beriladi.
**Variantlar:**
- A) Har kirim avtomatik reytingga ta'sir (kechikdi/brak) → reyting ko'rinadi — eng yaxshi beruvchi tanlanadi
- B) Reyting qo'lda — subyektiv
- C) Keyin
⤳ Ta'sir: Таъминот, MM, Finance

### Q800. Import partiyasiga bojxona/sertifikat hujjatlarini biriktirish
**Nima:** Import partiyasiga GTD, sifat sertifikati, invoys skanlari biriktiriladimi?
**Nega kerak:** Importда hujjat majburiy; tekshiruv/nizoда partiyaning kelib chiqishi hujjat bilan isbotlanishi kerak.
**Variantlar:**
- A) Har import partiyasiga fayl biriktiriladi va partiya bo'yicha qidiriladi — audit toza
- B) Hujjat alohida papkaда, tizimga bog'lanmagan — yo'qolish xavfi
- C) Keyin
⤳ Ta'sir: Таъминот, Finance, QC

### Q801. Avans to'lov va yetkazib berish bog'lanishi
**Nima:** Import buyurtmaga avans to'langanда "avans berildi, tovar kelmadi" holati ko'rinadimi?
**Nega kerak:** Import ko'pincha avans bilan; pul ketib tovar kelmagan holat moliyaviy xavf.
**Variantlar:**
- A) Buyurtma → avans (Finance) → kirim solishtiriladi, yopilmagan avanslar ro'yxati — xavf ko'rinadi
- B) Avans faqat Finance'да, ombor ko'rmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Таъминот, Finance

### Q802. Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati
**Nima:** Tayyor mahsulot mijozga chiqarilganда jo'natish hujjati (накладная/TTN) tizimда yaratiladimi?
**Nega kerak:** Kitобда Элтиб бериш boshlig'i "логистика ва транспорт таъминоти"ga mas'ul; hujjat nima va kimga ketganini isbotlaydi.
**Variantlar:**
- A) Jo'natish hujjati buyurtmaga bog'lanib avtomatik tuziladi (mijoz, mahsulot, miqdor, haydovchi, mashina) — izlanadi
- B) Qo'lда qog'ozда — tizimда yo'q
- C) Keyin
⤳ Ta'sir: SD, Элтиб бериш, Finance

### Q803. Haydovchi va mashinani jo'natishga biriktirish
**Nima:** Har jo'natishga haydovchi va transport vositasi biriktiriladimi (kitob: "хайдовчилар")?
**Nega kerak:** Kitob: Элтиб бериш boshlig'i mijoz/beruvchi/haydovchilar bilan ishlaydi; kim, qaysi mashinada, qachon — javobgarlik.
**Variantlar:**
- A) Haydovchi+mashina raqami+chiqish vaqti, yetkazildi belgisi — javobgarlik aniq
- B) Faqat "jo'natildi" — kim olib ketgani noma'lum
- C) Keyin
⤳ Ta'sir: Элтиб бериш, SD, CC

### Q804. Yetkazib berishni tasdiqlash (mijoz qabul qildi)
**Nima:** Mijoz tovarni qabul qilgani (imzo/qabul) tizimga qaytadimi?
**Nega kerak:** Jo'natish ≠ yetkazib berish; mijoz qabul qilmasa yoki kam qabul qilsa nizo bo'ladi.
**Variantlar:**
- A) Haydovchi qaytganда "yetkazildi/qaytdi/qisman"+sabab — to'liq sikl yopiladi
- B) Faqat jo'natish qayd etiladi — qaytish ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Элтиб бериш, SD, reklamatsiya (QC)

### Q805. Material rezervatsiyasi (buyurtmaga band qilish)
**Nima:** Rejalashtirilgan buyurtma uchun material oldindan "band" (rezerv) qilinib, boshqa buyurtmaga ketib qolmasligi ta'minlanadimi?
**Nega kerak:** Omборда material bor ko'rinadi, lekin boshqa buyurtmaga rejalashtirilgan — ikki buyurtma bir materialга da'vo qilsa biri to'xtaydi.
**Variantlar:**
- A) Reja material bandlaydi (mavjud−band=erkin), erkin qoldiq ko'rinadi — ortiqcha va'da yo'q
- B) Band yo'q, "bor/yo'q" xolos — to'qnashuv
- C) Keyin
⤳ Ta'sir: PP/MRP, SD, ichki logistika

### Q806. Material almashtirish (substitute) ruxsati
**Nima:** Material yo'q bo'lsa, ruxsat etilgan analog material tizimда taklif qilinadimi?
**Nega kerak:** Yetishmovchilikда omborchi o'zicha boshqa qog'ozni chiqaradi (toplayner o'rniga местный) — nazoratsiz brak. Analoglar oldindan belgilansa xavf kamayadi.
**Variantlar:**
- A) Har materialга "ruxsat etilgan analog" ro'yxati; faqat shulardan, tasdiq bilan — nazoratli
- B) Almashtirish umuman taqiq — qat'iy lekin to'xtash ko'p
- C) Keyin
⤳ Ta'sir: PP texkarta, QC, ichki logistika

### Q807. Omborchi razryadi → ruxsat etilgan amal darajasi
**Nima:** Omborchining razryadi qaysi amallarni qila olishini belgilaydimi (oddiy chiqim ╳ inventarizatsiya tasdiqlash ╳ spisaniye)?
**Nega kerak:** Org-karta razryadga asoslangan; past razryad faqat oddiy chiqim, yuqori razryad farq tasdiqlash huquqiga ega bo'lishi mantiqiy.
**Variantlar:**
- A) Razryad → vakolat matritsasi (kirim/chiqim/inventarizatsiya/spisaniye alohida) — javobgarlik darajaга bog'lanadi
- B) Hamma omborchi bir xil huquq — nazorat past
- C) Keyin
⤳ Ta'sir: HR/org-karta, ombor xavfsizlik

### Q808. Material hisobdan chiqarish (spisaniye) jarayoni
**Nima:** Buzilgan/yaroqsiz/yo'qolgan material rasmiy "spisaniye akti" bilan o'chiriladimi?
**Nega kerak:** Inventarizatsiya kamomadidan farqli — ataylab yaroqsizni hisobdan chiqarish alohida hujjatlangan; aks holda o'g'irlik yashiriladi.
**Variantlar:**
- A) Spisaniye akti: material+sabab+miqdor+tasdiqlovchi → Finance zarariga — auditga ochiq
- B) Faqat inventarizatsiya farqi orqali — sabab noma'lum
- C) Keyin
⤳ Ta'sir: Finance (zarar), QC, audit

### Q809. Sarfni norma bilan og'ish tahlili (pere-raskhod)
**Nima:** Buyurtma tugagach haqiqiy sarf vs texkarta normasi solishtirilib, ortiqcha sarf ko'rsatiladimi?
**Nega kerak:** Texkartada norma bor; haqiqiy sarf undan ko'p bo'lsa — brak, o'g'irlik yoki noto'g'ri sozlash belgisi.
**Variantlar:**
- A) Har buyurtma yopilganда norma/fakt og'ishi % hisoblanadi, chegaradan oshsa signal — yo'qotish manbai topiladi
- B) Faqat umumiy sarf — og'ish ko'rinmaydi
- C) Keyin
⤳ Ta'sir: PP norma, MES, Finance, QC

### Q810. Tovar qabulда foto-dalil
**Nima:** Shubhali/shikastlangan material kelganда qabulда foto biriktiriladimi?
**Nega kerak:** Yetkazib beruvchiga reklamatsiya uchun shikastni hujjatlash kerak — keyin isbotlash qiyin.
**Variantlar:**
- A) "Shikast bor" belgilansa foto majburiy → reklamatsiyaga biriktiriladi — isbot tayyor
- B) Foto yo'q — og'zaki da'vo
- C) Keyin
⤳ Ta'sir: Таъминот, QC, Finance

### Q811. Yetkazib beruvchiga qaytarish (vozvrat) jarayoni
**Nima:** Brak/noto'g'ri material beruvchiga qaytarilganда "qaytarish" hujjati bilan zaxiradan chiqariladimi?
**Nega kerak:** Karantindan chiqqan brak beruvchiga qaytishi mumkin; bu kirimning teskarisi, Finance bilan bog'lanish.
**Variantlar:**
- A) Qaytarish hujjati → zaxira kamayadi + Finance kreditor kamayadi — bog'langan
- B) Faqat omborда chiqim, Finance ko'rmaydi — uzilish
- C) Keyin
⤳ Ta'sir: Таъминот, Finance, QC

### Q812. Kunlik qoldiq hisoboti rahbarga avtomatik
**Nima:** Har kun ertalab ombor qoldig'i va kechagi harakat hisoboti rahbariyatga avtomatik yuboriladimi?
**Nega kerak:** Kitobда kun yakuniда hisobot tartibi bor ("кун якунида хисобот"); rahbar qoldiqни ko'rmasa yetishmovchilikни kech biladi.
**Variantlar:**
- A) Avtomatik kunlik hisobot (qoldiq+harakat+signal materiallar) → CC orqali rahbarga — proaktiv
- B) Faqat so'ralganda — reaktiv
- C) Keyin
⤳ Ta'sir: CC, notifications, director dashboard

### Q813. Kritik material yetishmasligi haqida proaktiv signal
**Nima:** Reja bo'yicha ertaga kerak material yetmasligi oldindan aniqlanib signal beriladimi?
**Nega kerak:** Min-qoldiq statik; reja bilan solishtirilganда "ertangi buyurtmaга qog'oz yetmaydi" dinamik signal to'xtashni oldini oladi.
**Variantlar:**
- A) Reja sarfi vs joriy qoldiq → "X material Y kunда tugaydi" prognoz + signal — proaktiv
- B) Faqat min-qoldiqдан pastга tushganда — kech
- C) Keyin
⤳ Ta'sir: PP/MRP, Таъминот, CC
  ↳ Agar A: signal kimga? A1) Taъminot+ichki logistika boshlig'i; A2) faqat ombor; A3) Coordination

### Q814. Ombor harakatining buxgalteriyaга (GL) avtomatik o'tishi
**Nima:** Har kirim/chiqim avtomatik buxgalteriya provodkasini (GL) hosil qiladimi?
**Nega kerak:** Ombor harakati=pul harakati; alohida yuritilsa buxgalteriya zaxirasi ombor qoldig'iga mos kelmaydi.
**Variantlar:**
- A) Har harakat GL provodkasi (zaxira debet/kredit) — buxgalteriya ↔ ombor doim teng
- B) Oyiга bir marta qo'lда solishtiriladi — drift xavfi
- C) Keyin
⤳ Ta'sir: Finance/GL, audit

### Q815. Material narxini hisoblash usuli (FIFO/o'rtacha)
**Nima:** Chiqimда material qiymati FIFO bo'yichami yoki o'rtacha tortilgan narx bo'yichami hisoblanadi?
**Nega kerak:** Bir material turli narxда keladi (import, valyuta); chiqim narxi tannarxga ta'sir qiladi.
**Variantlar:**
- A) O'rtacha tortilgan narx — tannarx silliq, oddiy
- B) FIFO (aniq partiya narxi) — aniqroq, murakkab
- C) Keyin — egasi hisob siyosatini belgilaydi
⤳ Ta'sir: Finance, PP tannarx
  ↳ Agar A: import valyuta kursi o'zgarганда qayta baholanadimi? A1) kelgan kun kursiда muzlatiladi; A2) oy oxiriда qayta baholanadi

### Q816. Inventarizatsiya kamomadini mas'ul shaxsга bog'lash
**Nima:** Inventarizatsияда kamomad chiqsa, u mas'ul shaxsga (материально-ответственное лицо) bog'lanadimi?
**Nega kerak:** Kamomad "umumiy" bo'lsa hech kim javob bermaydi; mas'ul shaxs tushunchasi muhim.
**Variantlar:**
- A) Har zona/material mas'ul shaxsga biriktiriladi; kamomad o'shanga yoziladi — javobgarlik aniq
- B) Kamomad umumiy zararga — javobgar yo'q
- C) Keyin
⤳ Ta'sir: HR, Finance, ombor xavfsizlik

### Q817. Ombor ↔ POS Monitor (zavod ombori tableti) rol ajratimi
**Nima:** Zavod ombori tableti (POS Monitor) qaysi amallarni qiladi va to'liq WMS dan farqi nima — bir zaxiraga yozadimi?
**Nega kerak:** Loyiha eslatmasiда POS Monitor=zavod ombori tablet interfeysi (kassa emas); ikkalasi bir zaxiraни o'zgartirsa qaysi kanonik?
**Variantlar:**
- A) POS Monitor=tezkor sex-pol amallari (skan kirim/chiqim/sanoq) → bir DB ga; WMS=to'liq boshqaruv/hisobot — bitta haqiqat manbai
- B) Ikki alohida zaxira — drift (loyihaда muammo)
- C) Keyin
⤳ Ta'sir: POS, WMS, Finance
  ↳ Agar A: kanonik zaxira jadvali bittami? A1) warehouse_stock; A2) boshqa (egasi tanlovi)

### Q818. Material kartochkasidan "kim uchun kritik" teskari ko'rinish
**Nima:** Material kartochkasidan "bu material qaysi mahsulotlar texkartasida ishlatiladi" ro'yxatini ko'rsa bo'ladimi?
**Nega kerak:** Yetishmovchilikда "bu material tugasa qaysi buyurtmalar to'xtaydi" ni darhol bilish — ta'sirни baholash.
**Variantlar:**
- A) Material → "ishlatiladigan mahsulotlar/buyurtmalar" teskari ko'rinish — ta'sir darhol ko'rinadi
- B) Faqat texkartaдан materialга — teskari yo'q
- C) Keyin
⤳ Ta'sir: PP, ichki logistika, prioritet

### Q819. Yetkazib beruvchi minimal partiya / qadoqlash birligi
**Nima:** Material kartochkasiда beruvchining minimal buyurtma miqdori va qadoqlash birligi (necha rulon to'plam) saqlanadimi?
**Nega kerak:** Reorder hisoblaganда beruvchi 1 ta emas, 10 ta to'plamда sotsa, kerakli son to'plamga yaxlitlanishi kerak.
**Variantlar:**
- A) Min partiya+qadoqlash birligi → reorder yaxlitlanadi — real buyurtma
- B) Hisob donада, qadoqlash hisobsiz — buyurtma noto'g'ri
- C) Keyin
⤳ Ta'sir: Таъминот, MM, MRP

### Q820. Zaxira aylanma tezligi (turnover days) ko'rsatkichi
**Nima:** Har material uchun "necha kunда bir marta aylanadi" hisoblanib, sekin ╳ tez aylanuvchilar ajratiladimi?
**Nega kerak:** Pul zaxiраda qotadi; sekin aylanuvchi material ortiqcha sotib olinmasligi kerak. (Dead-stock 0-harakat; turnover esa tezlik darajasi — bu boshqa.)
**Variantlar:**
- A) Aylanma kunlari + signal (juda sekin/tez) — zaxira optimallashadi
- B) Faqat dead-stock (0 harakat) — oraliq sekin ko'rinmaydi
- C) Keyin
⤳ Ta'sir: Finance, Таъминот, director KPI

### Q821. Ombor zonasi sig'imi to'lganlik foizi (import oldidan)
**Nima:** Har ombor zonasi bo'yicha to'lganlik foizi ko'rsatilib, katta import partiyasidan oldin joy yetishi tekshiriladimi?
**Nega kerak:** Import katta partiya kelishidan oldin joy bo'lmasa, tovar ochiq qoladi.
**Variantlar:**
- A) Zona sig'imi+band hajm → to'lganlik %; kirim oldиdan tekshiriladi — joy yetmasligi oldindан ko'rinadi
- B) Joy hisobi yo'q — kelганda muammo
- C) Keyin
⤳ Ta'sir: Таъминот, ichki logistika

### Q822. Brak/karantin materialни sexga chiqishini qattiq bloklash
**Nima:** Karantinга tushgan yoki brak material xato bilan sexга chiqarilmasligi qattiq bloklanadimi?
**Nega kerak:** Karantin status bor, lekin xato chiqim oldini olmasa brak material mahsulotga ketadi.
**Variantlar:**
- A) Brak/karantин statusли material chiqimда qat'iy bloklanadi (tizim ruxsat bermaydi) — brak o'tmaydi
- B) Faqat ogohlantirish, chiqarish mumkin — xavf qoladi
- C) Keyin
⤳ Ta'sir: QC, MES, ichki logistika

### Q823. Yetkazib beruvchiдан kam/ortiq kelganда tolerantlik
**Nima:** Kelgan miqdor buyurtmадан ozгина kam/ko'p bo'lса (rulon vazni aniq emas), ruxsat etilgan ±% tolerantlik bormi?
**Nega kerak:** Rulon vazni har doim buyurtma soniga teng emas; tolerantlik bo'lmasa har kirim "farqli" bo'lib qoladi.
**Variantlar:**
- A) ±% tolerantlik (masalan ±2%) ichида avtomatik qabul, tashqarisида tasdiqlash — real
- B) Aniq son talab — har safar qo'lда tuzatish
- C) Keyin
⤳ Ta'sir: Таъминот, kirim, Finance

### Q824. Ombor/ichki logistika ЦКП KPI (bekor turish + kechikishlar)
**Nima:** Ombor/ichki logistika bo'limining ЦКП si sifatида "0 bekor turish" va "logistika kechikishlari soni" KPI o'lchanadimi?
**Nega kerak:** Kitobда statistik ko'rsatkichlar aniq: "Ички логистика сабабли юзага келган кечикишлар сони", "режа бажарилиш даражаси (%)".
**Variantlar:**
- A) Ombor KPI paneli: logistika kechikishlari+reja bajarilishi %+bekor turish daqiqalари — kartani baholash uchun
- B) KPI yo'q — baholash subyektiv
- C) Keyin
⤳ Ta'sir: org-karta KPI, MES, director
  ↳ Agar A: bu KPI ichki logistika boshlig'i kartasiга bog'lanadimi (AI baho)? A1) ha, kartaga; A2) faqat bo'lim umumiy

### Q825. Reorderda bir nechta beruvchiга tender (taklif solishtirish)
**Nima:** Reorder kerak bo'lganда bir nechta beruvchiга so'rov yuborib, narx/muddat solishtiriladimi?
**Nega kerak:** Taъminot boshlig'i bir nechta beruvchi bilan ishlaydi; doim bittasiga buyurtma berса narx nazoratсиз.
**Variantlar:**
- A) Reorder → 2-3 beruvchиga so'rov → taklif solishtirish → tanlash — narx optimal
- B) Doimiy beruvchиga avtomatik — sodda, qimmat
- C) Keyin
⤳ Ta'sir: Таъминот, MM, Finance

### Q826. Ish vaqtiдan tashqari ombor amali nazorati
**Nima:** Kirim/chiqim ish vaqtiдан tashqари (kitob: smena/tanaffus jadvali) qilinса, alohida belgilanib tasdiq talab qilinadimi?
**Nega kerak:** Kitobда qat'iy kun tartibi (smena, tanaffus); ish vaqtiдан tashqари ombor harakati shubhali (o'g'irlik xavfi).
**Variantlar:**
- A) Ish vaqtiдан tashqari amal alohida belgilanadi (sabab+tasdiq) — shubhali harakat ko'rinadi
- B) Vaqt cheklovsiz — har qanday vaqtда ochiq
- C) Keyin
⤳ Ta'sir: HR (smena), audit, xavfsizlik

### Q827. Yangi material kartochkasi ochish huquqi + dublikat ogohlantirish
**Nima:** Yangi material turi faqat ma'lum rol tomonidan ochilib, o'xshash nom bo'lsa dublikat ogohlantirishi chiqadimi?
**Nega kerak:** Har kim material ochsa, bir xil qog'oz turli nom bilan ikki marta kiritilib qoldiq bo'linadi (loyihada master-data dublikat muammo).
**Variantlar:**
- A) Yangi kartochka — faqat MM roli+tasdiq+o'xshash nom ogohlantirishi — dublikat kamayadi
- B) Har omborchi ocha oladi — dublikat ko'payadi
- C) Keyin
⤳ Ta'sir: MM, master-data, barcha modullar

### Q828. Material kim uchun: bizniki ╳ mijoz moli (davalcheskiy)
**Nima:** Omборда turgan material bizniki yoki mijoz bergan (давальческий) ekani belgilanadimi?
**Nega kerak:** Kitobда "материалы заказчика" tushunchasi bor; mijoz materiali o'z materialимиз bilan aralashmasligi, boshqa mijozga ketmasligi kerak.
**Variantlar:**
- A) Har zaxiраga "egasi" (biz/mijoz X), mijoz materiali faqat o'sha mijoz buyurtmasiga — chalkashlik yo'q
- B) Hammasi bir xil — aralashish/yo'qolish xavfi
- C) Keyin
⤳ Ta'sir: SD, ichki logistika, Finance (mulk emas)

### Q829. Smenalararo qoldiq topshirish (peresmenka akti)
**Nima:** Smena oxirida kalit materiallar qoldig'i keyingi smenaga "topshiriladimi" (sanab, imzolab)?
**Nega kerak:** 3 smenali ishlab chiqarish (kitob: "3 сменалик"); smena almashганда kim qancha qoldirgani aniq bo'lmasa, kamomad kimga tegishliligi noma'lum.
**Variantlar:**
- A) Smena oxiriда kalit materiallar qoldig'i qayd etilib keyingi smenага topshiriladi (elektron akt) — javobgarlik smenаga
- B) Topshirish yo'q — kamomad umumiy
- C) Keyin
⤳ Ta'sir: HR (smena), MES, inventarizatsiya

### Q830. Material qaytib ishlatish (vtorichka) — chala rulon/kesindi qaytishi
**Nima:** Ishlab chiqarishдан qaytgan yaroqli qoldiq (chala rulon) omborга "ikkilamchi material" sifatида (sifati pas belgisi bilan) qaytarilib hisoblanadimi?
**Nega kerak:** Kitobда qoldiqlar chiqarish vazifаsi bor; yaroqlisi qaytsa yangi material kam sotib olinadi. (Obrezka/kesindiдан farqli — bu butun chala rulonning sifat-belgili qaytishi.)
**Variantlar:**
- A) Yaroqli qoldiq "ikkilamchi" sifatида qaytadi (sifati pas belgisi) — tejam, kuzatuv
- B) Qoldiq faqat chiqindiга — tejam yo'qoladi
- C) Keyin
⤳ Ta'sir: ichki logistika, Finance, QC

### Q831. Material yoshi (saqlanish vaqti) eskirish signali
**Nima:** Material omборда qancha turgani (yoshи) kuzatilib, ma'lum kunдан oshsa signal beriladimi (yaroqlilik muddati yo'qларга ham)?
**Nega kerak:** Qog'oz/karton uzoq turса namlik tortib sifati pasayadi — muddat yo'q, lekin yosh muhim.
**Variantlar:**
- A) Kirim sanasiдан yosh, ogohlantirish chegarasi (masalan 6 oy) — eski material avval ishlatiladi
- B) Faqat yaroqlilik muddati borларга — qog'oz chetда
- C) Keyin
⤳ Ta'sir: FIFO, dead-stock, QC

### Q832. Namlik/harorat sharoiti buzilганда signal (IoT)
**Nima:** Ombor namligi/harorati datchik bilan kuzatilib, qog'oz/kley uchun xavfli darajага chiqsa signal beriladimi?
**Nega kerak:** Qog'oz namlikка sezgir; ombor sharoiti buzilса butun zaxira sifatsizlanadi.
**Variantlar:**
- A) IoT datchik → chegараdan chiqса signal+log — zaxira himoyalanadi
- B) Qo'lда termometr — kuzatilmaydi
- C) Keyin — IoT keyin
⤳ Ta'sir: IoT, QC, MM
  ↳ Agar A: signal kimга va loglanadimi? A1) ombor+QC; A2) faqat ko'rinish

### Q833. Bo'yoq/kley/lak maxsus saqlash sharti va zona
**Nima:** Bo'yoq, kley, lak uchun maxsus saqlash sharti (harorat, yong'in xavfi, idish) belgilanib, alohida zona talab qilinadimi?
**Nega kerak:** Bosma/karton zavodida bo'yoq va kley alohida sharoit; noto'g'ri saqlanса yaroqsiz yoki yong'in xavfi.
**Variantlar:**
- A) Maxsus materialларga "saqlash sharti"+"xavf turi" maydoni, alohida zona — xavfsizlik
- B) Hamma bir zonada — xavf hisobsiz
- C) Keyin
⤳ Ta'sir: MM, QC, xavfsizlik

### Q834. Rulonдан kesilgan formatlar (list) zaxirasi
**Nima:** Bitta rulonдан kesilgan list/format zaxirasi alohida material (donада) sifatида hisoblanadimi?
**Nega kerak:** Rulon → list kesilганда qolgan listlar yangi zaxira birligi; rulon kg-da, list dona-da.
**Variantlar:**
- A) Kesish operatsiyasi rulon (kg) ni kamaytirib list (dona) zaxirasini yaratadi — ikki o'lchov bog'lanadi
- B) Faqat rulon hisoblanadi, listlar ko'rinmaydi — sex zaxirasi noma'lum
- C) Keyin
⤳ Ta'sir: MES (kesish), ichki logistika

### Q835. Material namuna/probnik chiqimини alohida hisoblash
**Nima:** Sifat sinovi yoki yangi buyurtma uchun materialдан namuna chiqarilса, alohida (probnik) chiqim sifatида hisoblanadimi?
**Nega kerak:** Namuna ham zaxирadan ketadi; hisobга olinmaса kamomad ko'rinadi.
**Variantlar:**
- A) "Namuna chiqimi" alohida sabab kodi, miqdori kichik — kamomad emas, izlanadi
- B) Hisobsiz — kamomadга aralashadi
- C) Keyin
⤳ Ta'sir: QC, dizayn, Finance

### Q836. Inventarizatsияни ABC bo'yicha chastotага ajratish (sikl sanoq)
**Nima:** Qimmat/kritik (A-toifa) materiallar tez-tez (haftalik), arzon (C-toifa) kamroq (yillik) sanaladimi?
**Nega kerak:** Hamma materialни bir xil sanash resurs isrofi; A-toifa pul ko'p, tez-tez tekshirilishi kerak.
**Variantlar:**
- A) ABC ga qarab sanoq chastotаsi (A-haftalik, B-oylik, C-yillik) — resurs optimal
- B) Hamma bir xil — yo isrof yo nazoratsiz
- C) Keyin
⤳ Ta'sir: inventarizatsiya, Finance, ABC

### Q837. Kirim/chiqim blankаsini chop etish va ikki imzo
**Nima:** Har kirim/chiqim uchun bosma blankа (накладная, QR bilan) chop etilib, qabul qiluvchi va topshiruvchi imzolaydimi?
**Nega kerak:** Kitob hujjat-papkа madaniyatiга asoslangan; nizoда qog'oz imzo asosiy dalil.
**Variantlar:**
- A) Tizim blankа chop etadi (QR), ikki imzo, skani biriktiriladi — elektron+qog'oz dalil
- B) Faqat elektron — qog'oz imzo yo'q (huquqiy zaiflik)
- C) Keyin
⤳ Ta'sir: audit, Finance, ombor

### Q838. Ombor ijarasi (mijoz molini saqlash) hisobi va to'lov
**Nima:** Tashqi mijoz molini saqlash xizmati alohида "biznikimas zaxira"+ijara to'lovi sifatида boshqариladimi?
**Nega kerak:** Mijoz moli bizning zaxiрамизга aralashmasligi + ijara daromad sifatида (v1 da ko'tarilgan).
**Variantlar:**
- A) Mijoz moli alohида belgi, qiymatsiz (bizniki emas)+ijara Finance'ga oylik — toza ajratish
- B) Aralash — tannarx va qoldiq buziladi
- C) Keyin
⤳ Ta'sir: Finance (daromad), SD, ombor
  ↳ Agar A: ijara qanday? A1) saqlangan hajm×kun; A2) oylik fiks; A3) poddon×kun

### Q839. Ombor ichида ko'chirish (peremeshcheniye) izi
**Nima:** Material bir zonадан boshqaсiga ko'chirilганда iz qoladimi — qaysi rulon qayerда, kim ko'chirgan?
**Nega kerak:** Katta omборда rulon noto'g'ri javonда bo'lса topib bo'lmaydi; ko'chirish izi locator aniqligini saqlaydi.
**Variantlar:**
- A) Har ko'chirish (eski→yangi joy+kim) qayd etiladi, joriy joy doim aniq — rulon yo'qolmaydi
- B) Faqat oxirgi joy, iz yo'q — qachon/kim noma'lum
- C) Keyin
⤳ Ta'sir: locator, audit, ichki logistika

---

DONE: Ombor / WMS — 51 (kitob-grounded, Q53–Q103; jami fayl 103).

## 11. MM / Ta'minot

### Q840. Yetkazuvchi kartochkasi — majburiy rekvizitlar ro'yxati
**Nima:** Yangi yetkazuvchini tizimga kiritishda qaysi maydonlar majburiy, qaysilari ixtiyoriy bo'lishini belgilash.
**Nega kerak:** Rekvizit to'liq bo'lmasa shartnoma, to'lov va soliq hisoboti buziladi; keyin tuzatish qiyin.
**Variantlar:**
- A) Majburiy: nomi, STIR/INN, bank hisob raqami, MFO, yuridik manzil, telefon, mas'ul shaxs — qolgani ixtiyoriy. Majburiysiz saqlash bloklanadi.
- B) Faqat nomi va telefon majburiy, qolgani keyin to'ldiriladi — tez kiritiladi, lekin chala kartochka ko'payadi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (to'lov), soliq hisoboti, shartnoma moduli.

### Q841. Yetkazuvchi turi (klassifikatsiya)
**Nima:** Yetkazuvchini turkumlarga ajratish: xom ashyo (selluloza/kraft qog'oz), kimyo (kraxmal, bo'yoq, yelim), ehtiyot qism, xizmat (transport, ta'mir), yoqilg'i.
**Nega kerak:** Tur bo'yicha hisobot, taqqoslash va mas'ul menejerni belgilash osonlashadi.
**Variantlar:**
- A) Oldindan belgilangan 6 turdan tanlanadi, kartochkada majburiy — hisobot toza bo'ladi.
- B) Erkin matn (har kim o'zicha yozadi) — moslashuvchan lekin hisobot chalkash.
- C) Keyin — hozir kerak emas.

### Q842. Yetkazuvchi holati (status) qiymatlari
**Nima:** Kartochka holatlari: Faol, Yangi (tekshiruvda), To'xtatilgan, Qora ro'yxat, Arxiv.
**Nega kerak:** Faqat "Faol" yetkazuvchiga buyurtma berilsin; ishonchsizga avtomatik to'siq qo'yiladi.
**Variantlar:**
- A) 5 ta status, "Qora ro'yxat"dagiga buyurtma berish butunlay bloklanadi — xato to'lovning oldi olinadi.
- B) Faqat Faol/Nofaol (2 status) — sodda, lekin nozik holatlar yo'qoladi.
- C) Keyin — hozir kerak emas.
  - ↳ Agar A: Qora ro'yxatga kim qo'sha oladi? A) faqat direktor B) ta'minot boshlig'i C) sifat bo'limi ham.

### Q843. Yetkazuvchi reytingi — qaysi ko'rsatkichlardan tuziladi
**Nima:** Reyting balli qaysi mezonlardan iborat: sifat (brak %), muddatga rioya (kechikish kun), narx, hujjat to'g'riligi, javob tezligi.
**Nega kerak:** Obyektiv reyting bo'lsa, eng yaxshi yetkazuvchiga ko'proq buyurtma yo'naltiriladi.
**Variantlar:**
- A) 5 mezon, har biri 0-100 ball, og'irlik: sifat 40%, muddat 30%, narx 20%, hujjat 10% — muvozanatli.
- B) Faqat sifat va muddat (2 mezon) — sodda, lekin narx hisobga olinmaydi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Sifat nazorati (brak %), Ombor (qabul muddati).

### Q844. Reyting avtomatik yoki qo'lda
**Nima:** Reyting balli tizim tomonidan avtomatik hisoblansinmi yoki menejer qo'lda qo'yadimi.
**Nega kerak:** Avtomatik bo'lsa subyektivlik kamayadi; qo'lda bo'lsa moslashuvchan lekin xolislik yo'qoladi.
**Variantlar:**
- A) Avtomatik — har qabul/braktan keyin tizim qayta hisoblaydi; menejer faqat izoh qo'shadi.
- B) Qo'lda — menejer chorakda bir marta baholaydi.
- C) Keyin — hozir kerak emas.

### Q845. Yetkazuvchi shartnomasi — saqlash va muddat nazorati
**Nima:** Har yetkazuvchi uchun shartnoma raqami, sanasi, amal qilish muddati, skan-nusxa va to'lov sharti saqlanadi.
**Nega kerak:** Shartnoma tugashidan oldin ogohlantirish bo'lmasa, muddati o'tgan shartnoma bilan ishlanib qoladi.
**Variantlar:**
- A) Shartnoma kartochkaga biriktiriladi, tugashga 30 kun qolganda mas'ulga ogohlantirish — risk kamayadi.
- B) Faqat shartnoma raqami yoziladi, skan yo'q — yengil lekin nazorat zaif.
- C) Keyin — hozir kerak emas.

### Q846. Shartnomada to'lov sharti (predoplata / postpaid)
**Nima:** Har shartnomada to'lov turi: oldindan to'lov (%), yetkazib bergach to'lov, kechiktirilgan to'lov (necha kun).
**Nega kerak:** Bu shart kreditor qarz muddatini va pul oqimi rejasini avtomatik belgilaydi.
**Variantlar:**
- A) Shartnomada to'lov turi + kechikish kunlari majburiy yoziladi (masalan "yetkazib bergach 30 kun") — Finance avtomatik qarz muddatini hisoblaydi.
- B) Har buyurtmada alohida kelishiladi, shartnomada yozilmaydi — moslashuvchan lekin tartibsiz.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (kreditor qarz, pul oqimi rejasi).

### Q847. Bir yetkazuvchidan bir nechta material
**Nima:** Bitta yetkazuvchi bir necha xil material yetkazsa (masalan ham kraft qog'oz, ham kraxmal), bu kartochkada qanday ko'rsatiladi.
**Nega kerak:** Narx-tarix va taqqoslash material darajasida bo'lishi kerak, yetkazuvchi darajasida emas.
**Variantlar:**
- A) Kartochkada "yetkazadigan materiallar" ro'yxati + har biriga alohida narx-tarix — to'g'ri taqqoslash imkoni.
- B) Bir yetkazuvchi = bir asosiy material, qolgani izohda — sodda lekin chala.
- C) Keyin — hozir kerak emas.

### Q848. Xarid arizasi — kim yarata oladi
**Nima:** Material kerakligi haqidagi arizani (zayavka) kim ochishi mumkin: ombor, ishlab chiqarish, ta'minot bo'limining o'zi.
**Nega kerak:** Ariza manbasini cheklash betartib xaridning oldini oladi.
**Variantlar:**
- A) Ombor (minimal zaxiradan past), ishlab chiqarish (reja bo'yicha), ta'minot — har biri yarata oladi, manba belgilanadi.
- B) Faqat ta'minot bo'limi — markazlashgan, lekin sekin.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (min zaxira), Ishlab chiqarish (MRP/reja).

### Q849. Xarid arizasi maydonlari
**Nima:** Arizada bo'lishi kerak: material nomi, miqdor, o'lchov birligi, kerak bo'lgan sana, sabab, qaysi buyurtma uchun, taxminiy narx.
**Nega kerak:** Maydonlar to'liq bo'lsa tasdiqlovchi tez qaror qabul qiladi.
**Variantlar:**
- A) Yuqoridagi 7 maydon, "kerak bo'lgan sana" va "miqdor" majburiy — aniq ariza.
- B) Faqat material + miqdor — tez, lekin tasdiqlovchi savol berib qoladi.
- C) Keyin — hozir kerak emas.

### Q850. Xarid arizasini tasdiqlash bosqichlari (summaga bog'liq)
**Nima:** Ariza summasiga qarab necha bosqich tasdiq kerakligi: kichik summa — bir bosqich, katta summa — direktorgacha.
**Nega kerak:** Har bir mayda xaridni direktor tasdiqlasa ish sekinlashadi; chegara qo'yilsa balanslanadi.
**Variantlar:**
- A) 3 chegara: <5 mln so'm — ta'minot boshlig'i; 5-50 mln — moliya; >50 mln — direktor. Summa avtomatik yo'naltiradi.
- B) Hamma ariza direktorga boradi — qattiq nazorat, lekin sekin.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (byudjet), tasdiqlash zanjiri (workflow).
  - ↳ Agar A: Chegaralar so'm-mi yoki dollar-mi (import uchun)? A) so'm B) dollar C) ikkalasi (kurs bo'yicha).

### Q851. Ariza rad etilsa nima bo'ladi
**Nima:** Tasdiqlovchi arizani rad etsa: sabab yozish majburiymi, qayta yuborish mumkinmi.
**Nega kerak:** Sababsiz rad etish nizoga sabab bo'ladi; tahrirlash yo'li ochiq bo'lishi kerak.
**Variantlar:**
- A) Rad etishda sabab majburiy, ariza muallifi tahrirlab qayta yuboradi (status: Qaytarilgan) — shaffof.
- B) Sababsiz rad, qayta ochib bo'lmaydi — qattiq lekin betoqat.
- C) Keyin — hozir kerak emas.

### Q852. Tasdiqlangan arizadan avtomatik buyurtma
**Nima:** Ariza tasdiqlangach, undan xarid buyurtmasi (PO) avtomatik yaratiladimi yoki qo'lda.
**Nega kerak:** Avtomatik bo'lsa ma'lumot ikki marta kiritilmaydi, xato kamayadi.
**Variantlar:**
- A) Tasdiqdan keyin "Buyurtma yaratish" tugmasi — maydonlar arizadan ko'chiriladi, ta'minotchi faqat yetkazuvchi va narxni qo'shadi.
- B) Buyurtma noldan qo'lda yoziladi — moslashuvchan lekin takror ish.
- C) Keyin — hozir kerak emas.

### Q853. Xarid buyurtmasi (PO) holatlari
**Nima:** Buyurtma holatlari: Qoralama, Yuborildi, Tasdiqlandi (yetkazuvchi), Qisman keldi, To'liq keldi, Yopildi, Bekor.
**Nega kerak:** Holatlar aniq bo'lsa, qaysi buyurtma yo'lda, qaysi kelgani bir qarashda ko'rinadi.
**Variantlar:**
- A) Yuqoridagi 7 holat, "Qisman keldi" alohida — chala yetkazib berish kuzatiladi.
- B) Faqat Ochiq/Yopiq — sodda, lekin qisman yetkazib berish ko'rinmaydi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (qabul), Finance (kreditor qarz yopilishi).

### Q854. Buyurtma va ombor qabuli bog'lanishi
**Nima:** Material kelganda ombor qabuli (kirim) qaysi buyurtmaga tegishli ekani bog'lanadimi.
**Nega kerak:** Bog'lanmasa "buyurtma berdik, keldimi?" savoliga javob yo'q; qarz va miqdor solishtirilmaydi.
**Variantlar:**
- A) Har kirim buyurtmaga bog'lanadi, kelgan miqdor buyurtma miqdori bilan solishtiriladi (kam/ortiq belgilanadi) — to'liq nazorat.
- B) Kirim mustaqil, buyurtmaga bog'lanmaydi — yengil lekin uzilish.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (kirim hujjati), Finance (qarz).

### Q855. Buyurtma narxi vs hisob-faktura narxi farqi
**Nima:** Yetkazuvchi hisob-fakturasidagi narx buyurtma narxidan farq qilsa nima qilinadi.
**Nega kerak:** Narx jimgina ko'tarilsa zarar ko'rinmay qoladi; nazorat kerak.
**Variantlar:**
- A) Farq belgilangan % (masalan 3%) dan oshsa — to'lov bloklanadi, tasdiq so'raladi; kichik farq avtomatik o'tadi.
- B) Har qanday farq qo'lda tekshiriladi — qattiq lekin sekin.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (to'lov tasdig'i).

### Q856. Narx-tarix saqlanishi (material bo'yicha)
**Nima:** Har material uchun har xaridda narx, sana, yetkazuvchi, miqdor saqlanib, tarix ko'rinadi.
**Nega kerak:** "Bu material avval qancha edi?" degan savolga javob bo'lsa, narx oshishini sezish va tortishuv osonlashadi.
**Variantlar:**
- A) Har material kartochkasida narx-tarix jadvali (sana/narx/yetkazuvchi/miqdor) + grafik — narx dinamikasi ko'rinadi.
- B) Faqat oxirgi narx saqlanadi — sodda lekin tarix yo'q.
- C) Keyin — hozir kerak emas.

### Q857. Narx valyutasi va kurs
**Nima:** Import materiallar dollar/yevroda. Narx-tarix valyutada saqlanadimi, kurs qaysi sanaga olinadi.
**Nega kerak:** Kraft qog'oz va kimyo ko'pincha importdan; valyuta nazorati bo'lmasa narx solishtirilmaydi.
**Variantlar:**
- A) Narx asl valyutada + kirim sanasidagi MB kursi bilan so'mga aylantiriladi, ikkalasi saqlanadi — to'g'ri taqqoslash.
- B) Hammasi qo'lda so'mga aylantirilib kiritiladi — sodda lekin kurs tarixi yo'qoladi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (valyuta farqi), tannarx hisobi.

### Q858. Narx oshishi haqida ogohlantirish
**Nima:** Yangi narx oxirgi narxdan belgilangan % dan ko'p oshsa, ta'minotchiga ogohlantirish chiqsinmi.
**Nega kerak:** Narx sezdirmay oshib ketsa tannarx buziladi; vaqtida sezish kerak.
**Variantlar:**
- A) Oshish 10% dan oshsa — sariq ogohlantirish, 25% dan oshsa — qizil + boshliqqa xabar.
- B) Ogohlantirish yo'q, faqat tarixda ko'rinadi — yengil lekin reaktiv.
- C) Keyin — hozir kerak emas.

### Q859. Yetkazuvchilarni narx bo'yicha taqqoslash (tender)
**Nima:** Bir material uchun bir necha yetkazuvchidan narx so'rab (so'rovnoma), tizimda yonma-yon taqqoslash.
**Nega kerak:** Eng arzon va ishonchli yetkazuvchini ob'ektiv tanlash, "tanish-bilish"siz qaror.
**Variantlar:**
- A) So'rovnoma 3+ yetkazuvchiga yuboriladi, javoblar bitta jadvalda (narx/muddat/to'lov sharti/reyting) ko'rsatiladi, biri tanlanadi — shaffof.
- B) Narxlar telefon orqali olinadi, qo'lda Excelda solishtiriladi — odatdagidek lekin izsiz.
- C) Keyin — hozir kerak emas.

### Q860. Taqqoslashda faqat narx emas
**Nima:** Yetkazuvchini tanlashda narxdan tashqari muddat, to'lov sharti, reyting, transport masofasi ham hisobga olinsinmi.
**Nega kerak:** Eng arzon doim eng foydali emas — kechikish ishlab chiqarishni to'xtatadi.
**Variantlar:**
- A) Taqqoslash jadvali 5 ustun (narx/muddat/to'lov/reyting/masofa), tizim "umumiy ball" beradi, lekin yakuniy qarorni odam qo'yadi.
- B) Faqat narx ko'rsatiladi — sodda lekin bir tomonlama.
- C) Keyin — hozir kerak emas.

### Q861. Tanlangan narxni eslab qolish (oxirgi tanlov sababi)
**Nima:** Eng arzon emas, qimmatroq yetkazuvchi tanlansa, sababini yozish majburiymi.
**Nega kerak:** Keyin tekshiruvda "nega qimmatdan oldik?" degan savolga javob bo'ladi, suiiste'molning oldi olinadi.
**Variantlar:**
- A) Eng arzondan tashqari tanlansa — sabab majburiy (masalan "muddat tez", "sifat yaxshi") — shaffoflik.
- B) Sabab ixtiyoriy — yengil lekin nazorat zaif.
- C) Keyin — hozir kerak emas.

### Q862. Transport / yo'l varaqasi (putyovka) — saqlanadimi
**Nima:** Material tashilganda yo'l varaqasi (mashina raqami, haydovchi, marshrut, masofa, sana) tizimda yuritiladimi.
**Nega kerak:** Transport xarajati va yoqilg'i nazorati yo'l varaqasiga bog'liq.
**Variantlar:**
- A) Har tashish uchun yo'l varaqasi: mashina, haydovchi, dan-gacha, masofa (km), yuk, yoqilg'i — to'liq nazorat.
- B) Faqat transport xarajati summasi yoziladi, varaqa yo'q — sodda lekin yoqilg'i nazorat qilinmaydi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (transport xarajati), tannarx.

### Q863. Transport o'z mashinasimi yoki yollangan
**Nima:** Tashish o'z mashinamizda yoki yetkazuvchining/yollangan transportdami — bu ajratiladimi.
**Nega kerak:** O'z transportda yoqilg'i+haydovchi xarajati bizniki; yollanganida bir summa. Hisob har xil.
**Variantlar:**
- A) Yo'l varaqasida "transport turi" maydoni: O'z / Yetkazuvchi / Yollangan — har biriga mos xarajat ulanadi.
- B) Farq qilinmaydi, hammasi "transport xarajati" — sodda lekin chalkash tannarx.
- C) Keyin — hozir kerak emas.

### Q864. Yo'l varaqasi va yetkazib berish shartlari (kim to'laydi)
**Nima:** Transport haqini kim to'lashi (yetkazuvchi narxga qo'shganmi yoki biz alohida to'laymizmi) belgilanadimi.
**Nega kerak:** Buni bilmasa transport xarajati ikki marta hisoblanishi yoki yo'qolishi mumkin.
**Variantlar:**
- A) Buyurtmada "yetkazib berish sharti": Bizning ombor / Yetkazuvchi yetkazadi (narxga kiritilgan) / Biz olib kelamiz — har biriga mos hisob.
- B) Har safar qo'lda izohda yoziladi — moslashuvchan lekin tartibsiz.
- C) Keyin — hozir kerak emas.

### Q865. Yoqilg'i sarfi — normativ bo'yicha hisob
**Nima:** Har mashina uchun 100 km ga yoqilg'i normasi (litr) belgilanib, yo'l varaqasidagi masofaga ko'paytirilib normativ sarf hisoblanadimi.
**Nega kerak:** Normativ bo'lmasa haydovchi qancha yoqilg'i "yegani" bilinmaydi.
**Variantlar:**
- A) Har mashinaga norma (l/100km), tizim normativ sarfni hisoblaydi, real quyilgan bilan solishtiradi — o'g'irlik ko'rinadi.
- B) Faqat real quyilgan litr yoziladi, norma yo'q — sodda lekin nazorat yo'q.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (yoqilg'i xarajati), avtopark nazorati.

### Q866. Yoqilg'i: normativ vs fakt og'ishi
**Nima:** Real quyilgan yoqilg'i normadan oshsa (masalan +10%), ogohlantirish chiqib, haydovchidan tushuntirish so'ralsinmi.
**Nega kerak:** Yoqilg'i — eng ko'p o'g'irlanadigan xarajat; og'ish nazorati pulni tejaydi.
**Variantlar:**
- A) Og'ish +10% dan oshsa qizil belgi + tushuntirish maydoni; oylik bo'yicha haydovchi reytingi — intizom.
- B) Faqat raqam ko'rsatiladi, ogohlantirish yo'q — yengil lekin passiv.
- C) Keyin — hozir kerak emas.

### Q867. Yoqilg'i — talon yoki naqd
**Nima:** Yoqilg'i talon (karta) bilan olinadimi yoki naqd; har quyish qaysi mashinaga yozilishi nazorat qilinadimi.
**Nega kerak:** Naqd yoqilg'i nazoratsiz ketadi; talon bo'lsa har litr mashina bilan bog'lanadi.
**Variantlar:**
- A) Yoqilg'i talon/karta bilan, har quyish mashina+sana+litr bilan yoziladi, oy oxirida talon balansi solishtiriladi — to'liq nazorat.
- B) Naqd, haydovchi chek keltiradi — odatiy lekin nazorat zaif.
- C) Keyin — hozir kerak emas.

### Q868. Kreditor qarz muddati — har yetkazuvchi bo'yicha
**Nima:** Har yetkazuvchiga qancha qarzimiz borligi va to'lov muddati (necha kun qoldi) ko'rinadimi.
**Nega kerak:** Muddati o'tgan qarz penya va munosabat buzilishiga olib keladi; vaqtida to'lov kerak.
**Variantlar:**
- A) Yetkazuvchi kartochkasida joriy qarz + muddat bo'yicha taqsimot (0-30 / 31-60 / 60+ kun) — pul oqimi rejasi aniq.
- B) Faqat umumiy qarz summasi, muddat taqsimotisiz — sodda lekin xavfli.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (kreditor qarz hisoboti, pul oqimi).

### Q869. To'lov muddati ogohlantirishi
**Nima:** Qarz to'lov muddati yaqinlashganda (masalan 3 kun qolganda) moliyaga avtomatik ogohlantirish chiqsinmi.
**Nega kerak:** Esdan chiqqan to'lov penya yoki yetkazib berishni to'xtatishga olib keladi.
**Variantlar:**
- A) 3 kun qolganda ogohlantirish, muddat o'tsa qizil + direktorga xabar — kechikish kamayadi.
- B) Ogohlantirish yo'q, qo'lda kuzatiladi — yengil lekin xavfli.
- C) Keyin — hozir kerak emas.

### Q870. To'lov muddatini hisoblash boshlanish nuqtasi
**Nima:** Kechiktirilgan to'lov (masalan 30 kun) qaysi sanadan boshlab sanaladi: hisob-faktura sanasidanmi yoki material kelgan sanadanmi.
**Nega kerak:** Bir kunlik xato penya yoki nizoga sabab bo'ladi; aniq qoida kerak.
**Variantlar:**
- A) Material ombоrga kelgan (kirim) sanasidan — adolatli, biz olganimizdan boshlanadi.
- B) Hisob-faktura sanasidan — yetkazuvchiga qulay lekin biz uchun erta.
- C) Keyin — hozir kerak emas.

### Q871. Oldindan to'lov (avans) nazorati
**Nima:** Avans to'langan yetkazuvchidan material kelmasa, ochiq avans qancha turibdi degan nazorat bo'ladimi.
**Nega kerak:** Avans berib material olmaslik — pul muzlab qolishi; eslab turish kerak.
**Variantlar:**
- A) Har avans buyurtmaga bog'lanadi, material kelganda avans yopiladi, ochiq avanslar ro'yxati ko'rinadi — pul muzlamaydi.
- B) Avans alohida yozilmaydi, umumiy qarzda — sodda lekin yo'qoladi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (debitor avans, pul oqimi).

### Q872. Minimal zaxira va avtomatik ariza
**Nima:** Material ombordagi miqdori minimal chegaradan tushganda, tizim avtomatik xarid arizasi taklif qilsinmi.
**Nega kerak:** Kraft qog'oz tugab qolsa ishlab chiqarish to'xtaydi; oldindan ogohlantirish kerak.
**Variantlar:**
- A) Min zaxiradan tushsa avtomatik ariza qoralamasi yaratiladi (miqdor = max zaxira − joriy), ta'minotchi tasdiqlaydi — uzilish bo'lmaydi.
- B) Faqat ogohlantirish chiqadi, ariza qo'lda — yengil lekin esdan chiqishi mumkin.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (min/max zaxira), Ishlab chiqarish (uzluksizlik).

### Q873. Yetkazib berish muddati (lead time) saqlanishi
**Nima:** Har material/yetkazuvchi uchun "buyurtmadan kelishigacha necha kun" o'rtacha muddati saqlanib, arizani qachon ochish kerakligini hisoblaydimi.
**Nega kerak:** Import kraft qog'oz 30-45 kun keladi; kech buyurtma qilsa to'xtab qolinadi.
**Variantlar:**
- A) Har yetkazuvchiga lead time saqlanadi, tizim "shu sanada kerak bo'lsa, falon kunda buyurtma ber" deb ogohlantiradi — rejali ta'minot.
- B) Lead time saqlanmaydi, tajriba bo'yicha — odatiy lekin risk.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ishlab chiqarish (reja), Ombor (zaxira rejasi).

### Q874. Qabulda brak / kam chiqsa
**Nima:** Material kelib, qabulda brak yoki kam chiqsa — buyurtma, qarz va yetkazuvchi reytingiga qanday ta'sir qiladi.
**Nega kerak:** Brak uchun to'liq to'lov qilinsa zarar; reytingga ham yozilishi kerak.
**Variantlar:**
- A) Brak/kam miqdor qabul hujjatida belgilanadi, qarz faqat qabul qilingan miqdorga, brak yetkazuvchi reytingini tushiradi + reklamatsiya yoziladi.
- B) Hammasi qabul qilinadi, brak keyin alohida hal qilinadi — sodda lekin chalkash.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Sifat (reklamatsiya), Finance (qarz), reyting.

### Q875. Materialni qabul qilish — sifat tekshiruvi (kirim nazorati)
**Nima:** Material ombоrga kirishidan oldin sifat bo'limi tasdiqlashi kerakmi (namlik, zichlik, o'lcham).
**Nega kerak:** Sifatsiz kraft qog'oz butun partiyani buzadi; kirimda ushlash kerak.
**Variantlar:**
- A) Kritik materiallar (kraft qog'oz, kimyo) kirimda sifat tekshiruvidan o'tadi, "Sifat tasdiqlagan" bo'lmasa ishlab chiqarishga berilmaydi.
- B) Hamma material to'g'ri omborga, sifat keyin — tez lekin riskli.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Sifat nazorati, Ombor (karantin zonasi).
  - ↳ Agar A: Tekshirilmagan material qayerda turadi? A) alohida "karantin" zona B) oddiy omborda belgi bilan.

### Q876. Bir material uchun afzal (asosiy) yetkazuvchi
**Nima:** Har materialga "asosiy yetkazuvchi" va "zaxira yetkazuvchi" belgilanadimi.
**Nega kerak:** Asosiy yetkazuvchi to'xtab qolsa, zaxiradan tez buyurtma berish uchun.
**Variantlar:**
- A) Har material kartochkasida 1 asosiy + 1-2 zaxira yetkazuvchi, asosiy javob bermasa tizim zaxirani taklif qiladi.
- B) Belgilanmaydi, har safar qidiriladi — moslashuvchan lekin sekin.
- C) Keyin — hozir kerak emas.

### Q877. Yetkazuvchi bilan kelishilgan narx (prays-list)
**Nima:** Yetkazuvchi bilan oldindan kelishilgan narx ro'yxati (amal qilish muddati bilan) saqlanib, buyurtmada avtomatik qo'yiladimi.
**Nega kerak:** Har safar narx so'rashga hojat qolmaydi, narx o'zboshimcha o'zgarmaydi.
**Variantlar:**
- A) Kelishilgan narx-list (material/narx/muddat) saqlanadi, buyurtmada avtomatik tortiladi, muddat tugaganda ogohlantiradi.
- B) Narx har safar qo'lda — moslashuvchan lekin xato va o'zboshimchalik riski.
- C) Keyin — hozir kerak emas.

### Q878. Import xaridda qo'shimcha xarajatlar (bojxona, logistika)
**Nima:** Import materialda bojxona, broker, logistika xarajatlari material tannarxiga qo'shiladimi (tushum tannarxi).
**Nega kerak:** Faqat material narxi olinsa, asl tannarx past ko'rinib, foyda noto'g'ri hisoblanadi.
**Variantlar:**
- A) Import xarajatlar (boj, NDS, broker, transport) yig'ilib, material miqdoriga taqsimlanadi — to'g'ri tannarx.
- B) Faqat material narxi, qo'shimchalar alohida xarajat — sodda lekin tannarx past.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (tannarx), Ishlab chiqarish (kalkulyatsiya).

### Q879. Yetkazuvchiga qaytarish (vozvrat)
**Nima:** Brak yoki ortiqcha material yetkazuvchiga qaytarilsa, qaytarish hujjati va qarz korreksiyasi qanday yuritiladi.
**Nega kerak:** Qaytarilgan material uchun pul qaytishi yoki qarz kamayishi izlanishi kerak.
**Variantlar:**
- A) Qaytarish hujjati (sabab/miqdor/summa), ombor chiqim qiladi, yetkazuvchi qarzi kamayadi yoki kredit-nota yoziladi — to'liq izlanadi.
- B) Telefon orqali kelishiladi, tizimda yozilmaydi — odatiy lekin izsiz.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (chiqim), Finance (qarz/kredit-nota).

### Q880. Bir buyurtmada bir necha material (qator)
**Nima:** Bitta buyurtmada bir necha xil material (har biri o'z miqdori/narxi bilan) bo'la oladimi.
**Nega kerak:** Bitta yetkazuvchidan bir vaqtda 5 xil kimyo olsa, 5 ta alohida buyurtma noqulay.
**Variantlar:**
- A) Buyurtma qatorlar (satrlar)dan iborat, har qator: material/miqdor/narx/summa; jami avtomatik — qulay.
- B) Bir buyurtma = bir material — sodda lekin ko'p hujjat.
- C) Keyin — hozir kerak emas.

### Q881. Qisman yetkazib berishni kuzatish
**Nima:** Buyurtmadan material qismlarda kelsa (masalan 100 t buyurtma, 60 t keldi), qolgan 40 t ochiq qolib kuzatiladimi.
**Nega kerak:** Qolgan miqdor unutilsa, ishlab chiqarish material yetishmay qoladi.
**Variantlar:**
- A) Har qator bo'yicha "buyurtma / kelgan / qolgan" ko'rinadi, qolgan 0 bo'lmaguncha buyurtma "Qisman" holatda — aniq nazorat.
- B) Kelgani belgilanadi, qolgani qo'lda kuzatiladi — yengil lekin riskli.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (kirim), Ishlab chiqarish (material balansi).

### Q882. Yetkazuvchi to'g'risida hujjatlar to'plami
**Nima:** Kartochkaga biriktiriladigan hujjatlar: guvohnoma (litsenziya), sifat sertifikati, NDS guvohnomasi, bank ma'lumotnomasi.
**Nega kerak:** Hujjatsiz yetkazuvchi bilan ishlash soliq va sifat muammosi keltiradi.
**Variantlar:**
- A) Hujjatlar skani biriktiriladi, muddati borlari (sertifikat) tugashidan oldin ogohlantiriladi — risk kamayadi.
- B) Faqat shartnoma, qolgani kerak bo'lganda — yengil lekin chala.
- C) Keyin — hozir kerak emas.

### Q883. NDS (QQS) li va NDSsiz yetkazuvchi
**Nima:** Yetkazuvchi NDS to'lovchimi yoki yo'qmi belgilanadimi, bu narx taqqoslashda hisobga olinadimi.
**Nega kerak:** NDSsiz yetkazuvchidan olganda NDSni qaytarib ololmaymiz — haqiqiy tannarx baland.
**Variantlar:**
- A) Kartochkada "NDS to'lovchi" belgisi, taqqoslashda NDS hisobga olib taqqoslanadi (haqiqiy xarajat) — to'g'ri qaror.
- B) Faqat narx solishtiriladi, NDS hisobga olinmaydi — sodda lekin yanglish.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (NDS hisobi, soliq).

### Q884. Ta'minot byudjeti (oylik limit)
**Nima:** Oylik xarid byudjeti belgilanadimi, undan oshsa buyurtma bloklanadimi yoki direktor tasdig'i so'raladimi.
**Nega kerak:** Byudjetsiz xarid pul oqimini buzadi; chegara intizom beradi.
**Variantlar:**
- A) Oylik byudjet (umumiy yoki kategoriya bo'yicha), 90% ga yetganda ogohlantirish, 100% dan oshsa direktor tasdig'i.
- B) Byudjet yo'q, har buyurtma alohida — moslashuvchan lekin nazoratsiz.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (byudjet, pul oqimi).

### Q885. Yetkazuvchi bo'yicha xarid tarixi va statistika
**Nima:** Har yetkazuvchidan yil/chorak davomida qancha (summa/miqdor) olinganini, o'rtacha narx, brak %, kechikishni ko'rsatuvchi sahifa.
**Nega kerak:** Yil oxirida bonus/chegirma kelishuvi va keyingi yil rejasi uchun kerak.
**Variantlar:**
- A) Yetkazuvchi kartochkasida "statistika" tab: davr bo'yicha summa/miqdor/o'rtacha narx/brak%/kechikish — kelishuvga asos.
- B) Bunday hisobot yo'q, kerak bo'lsa Excelda — odatiy lekin sekin.
- C) Keyin — hozir kerak emas.

### Q886. Yetkazuvchi bilan o'zaro hisob-kitob aktini solishtirish (sverka)
**Nima:** Yetkazuvchi bilan ma'lum davrga qarz/to'lov akti (sverka) tizimdan chiqariladimi.
**Nega kerak:** Bizning va yetkazuvchining hisobi farq qilsa, nizo va xato to'lovning oldi olinadi.
**Variantlar:**
- A) Istalgan davrga sverka akti avtomatik (boshlang'ich qoldiq + kirim + to'lov = oxirgi qoldiq) chiqadi, PDF yuboriladi.
- B) Qo'lda Excelda tuziladi — odatiy lekin xato va sekin.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (o'zaro hisob-kitob).

### Q887. Marshrut/transport hisoboti (km va xarajat)
**Nima:** Davr bo'yicha qaysi mashina qancha km yurgan, qancha yoqilg'i, transport xarajati hisoboti chiqadimi.
**Nega kerak:** Avtopark samaradorligini ko'rish, ortiqcha reys/sarfning oldini olish.
**Variantlar:**
- A) Mashina/haydovchi bo'yicha davriy hisobot: km, yoqilg'i (norma/fakt), reys soni, xarajat — nazorat.
- B) Hisobot yo'q, har varaqa alohida ko'riladi — yengil lekin umumiy ko'rinish yo'q.
- C) Keyin — hozir kerak emas.

### Q888. Yetkazuvchi bilan bog'lanish tarixi (CRM-ga o'xshash)
**Nima:** Yetkazuvchi bilan qo'ng'iroq, kelishuv, nizo, va'da tarixi kartochkada yozib boriladimi.
**Nega kerak:** Mas'ul almashganda yetkazuvchi bilan munosabat tarixi yo'qolmaydi.
**Variantlar:**
- A) Kartochkada "muloqot" jurnali (sana/kim/mavzu/natija) — institutsional xotira.
- B) Hech yozilmaydi, og'zaki — odatiy lekin yo'qoladi.
- C) Keyin — hozir kerak emas.

### Q889. Material o'lchov birligi va konvertatsiya
**Nima:** Yetkazuvchi tonna/rulonda sotadi, biz kg/dona hisoblaymiz — birlik konvertatsiyasi tizimda bormi.
**Nega kerak:** Birlik chalkashsa miqdor va narx 1000 marta xato bo'lishi mumkin.
**Variantlar:**
- A) Har material asosiy birlik + konvertatsiya koeffitsienti (1 rulon = N kg), buyurtma/kirim avtomatik aylantiradi — xato yo'q.
- B) Bir birlik, qo'lda aylantiriladi — sodda lekin xavfli.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ombor (zaxira birligi), Ishlab chiqarish (kalkulyatsiya).

### Q890. Buyurtmani kim imzolaydi (mas'uliyat)
**Nima:** Yetkazuvchiga ketadigan buyurtmada kimning imzosi/tasdig'i bo'lishi (ta'minotchi yaratdi, kim tasdiqladi) yozib boriladimi.
**Nega kerak:** Xato buyurtma uchun kim javobgar ekani aniq bo'ladi, mas'uliyat tarqalmaydi.
**Variantlar:**
- A) Buyurtmada "yaratdi / tasdiqladi / yubordi" izlari (kim, qachon) avtomatik saqlanadi — mas'uliyat aniq.
- B) Faqat yaratuvchi yoziladi — sodda lekin tasdiq izi yo'q.
- C) Keyin — hozir kerak emas.

### Q891. Shoshilinch (urgent) xarid tartibi
**Nima:** Ishlab chiqarish to'xtab qolmasligi uchun shoshilinch xarid uchun qisqartirilgan tasdiq yo'li bo'ladimi.
**Nega kerak:** Oddiy tasdiq zanjiri uzun bo'lsa, avariyaviy holatda kech qoladi.
**Variantlar:**
- A) "Shoshilinch" belgisi qo'yilsa — bir bosqichli tezkor tasdiq (direktor SMS/ilova), lekin keyin sabab hujjatlashtiriladi.
- B) Shoshilinch ham oddiy yo'ldan — qattiq lekin ishlab chiqarish to'xtaydi.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Ishlab chiqarish (uzluksizlik), tasdiqlash zanjiri.

### Q892. Yetkazuvchi to'lov rekvizitini o'zgartirsa
**Nima:** Yetkazuvchi bank hisob raqamini o'zgartirsa, eski rekvizit tarixda saqlanib, yangisi tasdiqdan o'tadimi.
**Nega kerak:** Firibgarlik ko'p marta "rekvizit o'zgardi" bahonasida bo'ladi; tasdiqsiz to'lov xavfli.
**Variantlar:**
- A) Rekvizit o'zgarishi alohida tasdiqdan o'tadi (direktor/moliya), eski rekvizit tarixda qoladi, o'zgarish izi yoziladi — firibgarlik himoyasi.
- B) Erkin tahrirlanadi — qulay lekin xavfli.
- C) Keyin — hozir kerak emas.
  - ⤳ Ta'sir: Finance (to'lov xavfsizligi).

---

## YANGI (kitob-grounded) savollar — laboratoriya kirim-nazorati, zavod materiallari, ichki logistika

> Manba: docs/audit/kitob-extracted (Лаборант йўриқномаси — namlik/граммаж/ECT/РД-5; Ички логистика бўлими бошлиғи — рохлер/поддон/топлайнер; Таъминот бўлими — импорт хом ашё + конфликт интереслар; ТЗ/макет форма — лак/тиснение/ламинация/трафарет). Quyidagilar yuqoridagi Q1–Q54 va vision-questions/11-mm.md (Q1–Q36) bilan takrorlanmaydi — zavodning aniq atamalariga asoslangan.

### Q893. Kirim qog'ozni laboratoriya (РД-5) tasdig'isiz ishlab chiqarishga chiqarmaslik
**Nima:** Kitobda laborant har kirim rulonni namlik, qalinlik, граммаж va qog'oz turini tekshirib, yozma xulosani РД-5 ga beradi. Tizim shu laboratoriya tasdig'ini rasman darvoza-bosqich qilib qo'yishi.
**Nega kerak:** Hozir qabul faqat miqdor/buyurtmaga qaraydi (Q14). Asosiy xom-ashyo — qog'oz rulon; sifat tekshiruvisiz ishlab chiqarishga ketsa butun partiya brakka ketadi.
**Variantlar:**
- A) Ha — har qabul partiyaga "laboratoriya holati" (kutilmoqda/o'tdi/o'tmadi); o'tmaguncha ishlab chiqarishga chiqarib bo'lmaydi — sifat darvozasi
- B) Belgi qo'yiladi, lekin chiqarishni bloklamaydi — yumshoq, braksiz emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), Ombor kirim, Ishlab chiqarish boshlanishi
  ↳ Agar A: xulosa qaysi maydonlarni saqlasin? A) namlik %, граммаж g/m², qalinlik mkr, qog'oz turi/marka, ECT B) faqat "o'tdi/o'tmadi"

### Q894. Rulon namligi (vlazhnost) chegaradan oshsa avtomatik karantin
**Nima:** Kitob misoli: rulon tashqaridan normal, lekin namlik me'yordan yuqori — laborant liniyaga qo'yishga ruxsat bermadi. Har rulonga namlik % yozilib, chegaradan oshsa karantinga tushsin.
**Nega kerak:** Nam qog'oz gofrada va bosmada brak beradi — zavoddagi eng aniq rad sababi.
**Variantlar:**
- A) Ha — namlik chegarasi sozlanadi; oshsa rulon avtomatik karantin + yetkazuvchiga claim — to'liq
- B) Namlik faqat qayd qilinadi, qaror odamda — sodda
- C) Keyin
  ↳ Agar A: chegara qog'oz turiga qarab har xilmi (топлайнер ≠ местный)? A) har marka alohida B) bitta umumiy

### Q895. Граммаж (g/m²) mosligini texkartaga avtomatik solishtirish
**Nima:** Laborant kelgan qog'oz граммажини o'lchaydi. Tizim buni texkartada talab qilingan граммаж bilan solishtirib, dopuskdan oshsa ogohlantirsin.
**Nega kerak:** Texkartada 140 g/m² toplayner kerak bo'lib omborga 125 g/m² kelsa — mahsulot zaif chiqadi; bu farqni odam ko'zi har safar ushlamaydi.
**Variantlar:**
- A) Ha — kelgan partiya граммажи texkarta talabiga ±dopusk ichida tekshiriladi — aniq nazorat
- B) Faqat o'lchov yoziladi, solishtirish yo'q
- C) Keyin
⤳ Ta'sir: Texkarta (PP), Sifat, Ombor partiya kartasi

### Q896. Топлайнер ╳ местный (макулатура) qog'ozni adashtirmaslik nazorati
**Nima:** Kitob misoli: texkartada топлайнер ko'rsatilgan, ichki logistika местный (макулатура) chiqaryapti — to'xtatish kerak. Har rulonni qaysi sinf qog'oz ekani saqlanib, texkarta talabidan farq qilsa ogohlantirilsin.
**Nega kerak:** Bu zavoddagi eng tez uchraydigan adashtirish; arzon qog'oz qimmat mahsulot o'rniga ketsa mijoz qaytaradi.
**Variantlar:**
- A) Ha — qog'oz sinfi material kartasida majburiy atribut; ombordan chiqarishda texkarta bilan kross-tekshiruv — to'liq
- B) Faqat material nomida farqlanadi, avtomatik tekshiruv yo'q
- C) Keyin
⤳ Ta'sir: Ombor chiqim, Ichki logistika, Ishlab chiqarish

### Q897. Gofra ECT ko'rsatkichi va qavat (3 yoki 5 qavatli) mosligi
**Nima:** Kitobda laborant gofra ECT ko'rsatkichini tekshirib markaga mosligini aniqlaydi; alohida misol — 3-qavatli va 5-qavatli gofrani omborda aralashtirish. Gofra partiyasiga ECT + qavat soni yozilsin.
**Nega kerak:** Noto'g'ri qavat/ECT bilan quti talab qilingan og'irlikni ko'tarmaydi (формада "Грузоподъемность, кг" bor) — to'g'ridan-to'g'ri yaroqsizlik.
**Variantlar:**
- A) Ha — gofra material kartasi: qavat (3/5), ECT marka, граммаж; texkartaga moslik tekshiriladi — to'liq
- B) Faqat marka matni yoziladi
- C) Keyin
⤳ Ta'sir: Texkarta, Sifat, Ombor

### Q898. Shartli ruxsat berilgan xom-ashyo holati (o'tdi / shartli / rad)
**Nima:** Kitobda xom-ashyo "faqat belgilangan shart bilan ishlatildi" deyilgan — ya'ni uchinchi holat: shartli ruxsat. Kirim partiyaga 3 holat bo'lsin.
**Nega kerak:** Amalda ko'p xom-ashyo "biroz chegirma bilan ishlatsa bo'ladi" deb qaror qilinadi; bu hujjatlashishi va braksabab tahlilida ko'rinishi kerak.
**Variantlar:**
- A) Ha — o'tdi / shartli (izoh + cheklov) / rad; shartli bo'lsa kim ruxsat bergani yoziladi — to'liq
- B) Faqat o'tdi/rad — sodda, lekin amaliyotni aks ettirmaydi
- C) Keyin

### Q899. Partiya (партия) izlanuvchanligi — qaysi rulon qaysi buyurtmaga ketdi
**Nima:** Kitobda statistik ko'rsatkich "текширилган хом-ашё партиялари сони". Har kirim partiyaga raqam berilib, qaysi ishlab chiqarish buyurtmasida ishlatilgani kuzatilsin.
**Nega kerak:** Brak chiqsa "qaysi partiya qog'ozdan?" degan savolga javob va yetkazuvchiga claim asoslanadi.
**Variantlar:**
- A) Ha — to'liq izlanuvchanlik (kirim partiya → ombor → chiqim → ishlab chiqarish buyurtmasi) — izlanish zanjiri
- B) Faqat kirim partiya raqami, chiqimga ulanmaydi
- C) Keyin
⤳ Ta'sir: Ombor, Ishlab chiqarish, Sifat, brak tahlili

### Q900. Brak xom-ashyo sabab tahlili — мукаммаллаштириш дафтари
**Nima:** Kitobda laborant yaroqsiz qaytgan mahsulotni tekshirib sabab tahlil qiladi va "мукаммаллаштириш дафтари" yuritadi. Kirim braki ham shu jurnalda sabab + qaror bilan yozilsin.
**Nega kerak:** Q34 (qabulda brak) holatni qayd qiladi, lekin sabab tahlili va yetkazuvchi bilan kelishuv jurnali yo'q; takror brakni oldini oladi.
**Variantlar:**
- A) Ha — har brakka sabab + qaror + yetkazuvchi javobi jurnali; reytingga ulanadi — to'liq
- B) Faqat rad belgisi
- C) Keyin
⤳ Ta'sir: Reyting (Q4), Sifat

### Q901. Yetkazuvchi reytingiga laboratoriya o'tish foizini ulash
**Nima:** Q5 reyting avtomatmi/qo'ldami so'raydi. Bu — laboratoriya (РД-5) natijalarini (necha partiya o'tdi/o'tmadi) avtomatik reytingga ulash.
**Nega kerak:** Yetkazuvchi haqiqiy sifati — moli necha marta laboratoriya o'tmaganida ko'rinadi; eng obyektiv reyting manbai.
**Variantlar:**
- A) Ha — reytingda "laboratoriya o'tish %" alohida ko'rsatkich (brak partiya/jami partiya) — obyektiv
- B) Reyting faqat muddat/narxdan, sifat alohida emas
- C) Keyin
⤳ Ta'sir: Reyting tarkibi (Q4), Sifat moduli

### Q902. Texkarta kompozitsiyasi laborant tasdig'isiz ishlab chiqarishga o'tmasligi
**Nima:** Kitobda laborant "ҳар бир тех картани композицияси бўйича тасдиқлаб бериш" vazifasiga ega. Texkarta laboratoriya kompozitsiya tasdig'isiz ishlab chiqarishga o'tmasin.
**Nega kerak:** Texkartadagi material kombinatsiyasi (qog'oz+gofra+lak) laborant tasdiqlamasa, noto'g'ri kompozitsiya brak beradi.
**Variantlar:**
- A) Ha — texkartaga "laboratoriya kompozitsiya tasdig'i" bosqichi; tasdiqsiz o'tmaydi — sifat darvozasi
- B) Tavsiya, lekin bloklamaydi
- C) Keyin
⤳ Ta'sir: Texkarta (PP), Sifat, Ishlab chiqarish boshlanishi

### Q903. Tasdiqlangan etalon namuna (одобренный образец) saqlash
**Nima:** Kitobda laborant savdo bo'limi bergan qog'oz namunalarining marka/turini tasdiqlaydi. Har material/mijoz uchun etalon namuna (foto/spetsifikatsiya) saqlansin.
**Nega kerak:** Kelajak partiyani etalonga solishtirish kerak; "avval bunday emas edi" nizosini hal qiladi.
**Variantlar:**
- A) Ha — material/mijoz uchun etalon (foto, o'lcham, marka) saqlanadi va kirim solishtiriladi — nizo yechimi
- B) Faqat birinchi marta tasdiqlanadi, etalon saqlanmaydi
- C) Keyin
⤳ Ta'sir: Sifat, Sotuv (mijoz namunasi)

### Q904. Yangi yetkazuvchi sinov partiyasi laboratoriyadan o'tishi (onboarding)
**Nima:** Yangi yetkazuvchidan katta xaridga o'tishdan oldin sinov partiyasi laboratoriyadan o'tsin; yetkazuvchi "sinovda → tasdiqlangan" holatida o'tsin.
**Nega kerak:** Tasodifiy yangi yetkazuvchidan to'g'ridan-to'g'ri katta xarid xavfli; avval sinov partiyasi РД-5 dan o'tishi kerak.
**Variantlar:**
- A) Ha — yangi yetkazuvchi "sinovda" boshlaydi; sinov partiyasi laboratoriya o'tsa "tasdiqlangan" — bosqichli ishonch
- B) Hamma yetkazuvchi darrov to'liq, tekshiruvsiz
- C) Keyin
⤳ Ta'sir: Yetkazuvchi holati (Q3), Laboratoriya (Q55)

### Q905. Manfaatlar to'qnashuvi — yetkazuvchi xodim/yaqin qarindosh bo'lsa belgilash
**Nima:** Kitobda Ta'minot bo'limi uchun ochiq "конфликт интереслар" toifalari: kompaniya rahbariyati/xodimlar, yaqin qarindoshlar. Yetkazuvchi kartasida bunday bog'liqlik belgilanib xaridda ogohlantirilsin.
**Nega kerak:** Bu kitobda yozma siyosat — xodimning yaqin qarindoshi yetkazuvchi bo'lsa korruptsiya/qimmat xarid xavfi; tizim ko'rsatishi kerak.
**Variantlar:**
- A) Ha — "aloqador shaxs" bayrog'i (xodim/qarindosh + kim); bunday yetkazuvchiga buyurtma yuqori tasdiq talab qiladi — siyosat amalda
- B) Faqat izoh maydoni, avtomatik darvoza yo'q
- C) Keyin
⤳ Ta'sir: Tasdiq zanjiri (Q11), Audit, HR (xodim-qarindosh bog'lash)

### Q906. Лак / лакировка / ВД лак materiallari katalogi va sarfi
**Nima:** ТЗ formasida lakirovka turlari (ВД лак, лакировка, sploshnoy) bor. Lak alohida material sifatida turlari, birligi (kg/litr) va zaxira nazorati bilan saqlansin.
**Nega kerak:** Lak — sarflanadigan kimyoviy material; texkarta unga ishora qiladi, lekin ombor zaxirasi kuzatilmasa "lak tugadi" deb to'xtaysiz.
**Variantlar:**
- A) Ha — lak material kartasi (ВД лак/glyans/matt) + birlik + minimal qoldiq — to'liq
- B) Lak umumiy "yordamchi material", turi ajratilmaydi
- C) Keyin
⤳ Ta'sir: Texkarta, Ombor sarfi, MRP

### Q907. Тиснение folga (золото / серебро) — folga material zaxirasi
**Nima:** Formada тиснение turlari: золота, серебро, метал-золота, метал-серебро. Folga rang/tur bo'yicha ombor zaxirasi va sarfida kuzatilsin.
**Nega kerak:** Folga metr/rulon bilan sarflanadi, qimmat va ko'p qoladi; hisobsiz bo'lsa yo'qoladi yoki o'rtada tugaydi.
**Variantlar:**
- A) Ha — folga kartasi (rang: oltin/kumush, eni, rulon uzunligi) + sarf hisobi — to'liq
- B) Faqat umumiy "folga" zaxirasi
- C) Keyin

### Q908. Ламинация plyonkasi (глянцевая/матовая, 30/100 мкр) zaxirasi
**Nima:** Formada lamination: глянцевая/матовая, 30 мкр va 100 мкр. Plyonka qalinligi va turi bo'yicha alohida material sifatida zaxirada bo'lsin.
**Nega kerak:** Texkarta "100 мкр matt lamination" desa, ombor shu turdagi plyonka borligini bilishi kerak; aralashtirsa ko'rinish buziladi.
**Variantlar:**
- A) Ha — lamination kartasi (glyans/matt, qalinlik mkr, eni) + zaxira — to'liq
- B) Umumiy "plyonka" zaxirasi
- C) Keyin
⤳ Ta'sir: Texkarta, Ombor

### Q909. Bo'yoq / краска (печать) — rang/Pantone bo'yicha zaxira va sarf
**Nima:** Formada печать bor; bosma bo'yog'i rang bo'yicha (CMYK + Pantone) ombor zaxirasida bo'lib, har buyurtmaga sarfi yozilsin.
**Nega kerak:** Bo'yoq eng ko'p sarflanadigan resurslardan; Pantone maxsus rang tugasa buyurtma to'xtaydi.
**Variantlar:**
- A) Ha — bo'yoq kartasi (rang/Pantone kodi, kg) + minimal qoldiq + sarf — to'liq
- B) Bo'yoq umumiy "kimyo" zaxirasida, rang ajratilmaydi
- C) Keyin

### Q910. Клей / склейка va qadoq materiallari (резина, стропа, верёвка) katalogi
**Nima:** Formada склейка, резина, стропа, верёвка, мягкая упаковка bor. Bularning hammasi katalogda bo'lib sarfi kuzatilsin.
**Nega kerak:** Bu "kichik" materiallar e'tibordan chetda qoladi, lekin biri tugasa yig'ish/qadoqlash to'xtaydi.
**Variantlar:**
- A) Ha — har biri material kartasi + minimal qoldiq + qayta buyurtma — to'liq
- B) Faqat asosiy materiallar (qog'oz/gofra) kuzatiladi
- C) Keyin

### Q911. Mijoz beradigan material/fayl (материалы заказчика — давальческое сырьё)
**Nima:** Formada "материалы заказчика (файлы, ссылки), трафарет" bor — mijoz o'z materialini/trafaretni beradi. Bunday "davalcheskiy" xom-ashyo ombor va xaridda alohida belgilansin.
**Nega kerak:** Mijoz bergan materialni zavod sotib olmaydi (tannarxga kirmaydi) lekin ombor unga javob beradi; oddiy xaridga aralashtirsa hisob buziladi.
**Variantlar:**
- A) Ha — material kartasida "egasi: zavod/mijoz"; mijoznikiga xarid PO yaratilmaydi, faqat qabul/saqlash — to'liq
- B) Faqat izoh sifatida
- C) Keyin
⤳ Ta'sir: Sotuv (SD), Ombor, Tannarx (mijoz materiali tannarxga kirmaydi)

### Q912. Trafaret / klishe asboblari va egasi (mijoz/zavod)
**Nima:** Formada trafaret, klishe (тиснение uchun) bor. Bular ko'p marta ishlatiladigan asbob; ombor/ta'minotda ro'yxatga olinib egasi belgilansin.
**Nega kerak:** Trafaret/klishe yo'qoladi yoki "kimniki?" chalkashligi bo'ladi; takror buyurtmada qaytadan yasatishga to'g'ri keladi (qo'shimcha xarajat).
**Variantlar:**
- A) Ha — trafaret/klishe ro'yxati (mijoz, dizayn, tokcha joyi, egasi) — to'liq
- B) Faqat dizayn fayli saqlanadi, fizik trafaret kuzatilmaydi
- C) Keyin
⤳ Ta'sir: Sotuv takror buyurtma, Ombor (asbob tokchasi)

### Q913. Rulon spetsifikatsiyasi — eni / diametr / o'rama uzunligi
**Nima:** Qog'oz rulonning eni (mm), diametri va o'rama uzunligi muhim — mashinaga sig'adimi, nechta list chiqadi. Material kartasida bu o'lchamlar saqlansin.
**Nega kerak:** Texkarta 857×695 yoki 679×620 format so'rasa (formada bor o'lchamlar), rulon eni mos kelmasa qog'oz behuda ketadi (chiqindi ko'payadi).
**Variantlar:**
- A) Ha — rulon spetsifikatsiyasi (eni mm, diametr, o'rama uzunligi) saqlanadi va format rejasiga ulanadi — chiqindi kamayadi
- B) Faqat marka/граммаж, o'lcham yo'q
- C) Keyin
⤳ Ta'sir: Texkarta format rejasi, Chiqindi hisobi

### Q914. Qog'oz chiqindi normasi (отход) — norma vs haqiqiy solishtirish
**Nima:** Har buyurtmada nazariy chiqindi normasi bor (necha % qog'oz qirqimga ketadi). Tizim normani saqlab haqiqiy chiqindi bilan solishtirsin.
**Nega kerak:** Haqiqiy chiqindi normadan ko'p chiqsa — qog'oz o'g'irlanyapti yoki noto'g'ri qirqilyapti; bu pul yo'qotish.
**Variantlar:**
- A) Ha — buyurtma uchun norma % vs haqiqiy; farq katta bo'lsa ogohlantirish — yo'qotish nazorati
- B) Faqat haqiqiy chiqindi yoziladi, norma bilan solishtirilmaydi
- C) Keyin
⤳ Ta'sir: Tannarx, Ishlab chiqarish samaradorligi

### Q915. Qoldiq rulon/list FIFO bo'yicha avval ishlatish
**Nima:** Omborda ochilgan, qisman ishlatilgan rulonlar qoladi. Tizim qoldiqlarni ko'rsatib, mos buyurtmaga avval ularni ishlatishni tavsiya qilsin (eng eski avval).
**Nega kerak:** Qoldiqlar unutilib eskiradi (namlik buziladi), yangi rulon ochiladi — pul yo'qoladi; FIFO qog'ozda ayniqsa muhim.
**Variantlar:**
- A) Ha — qoldiq rulon/list ro'yxati; mos buyurtmaga avtomatik tavsiya (FIFO) — to'liq
- B) Qoldiqlar faqat zaxirada ko'rinadi, tavsiya yo'q
- C) Keyin
⤳ Ta'sir: Ombor, Ishlab chiqarish material chiqimi

### Q916. Ombor tokcha/joylashuvi (qaysi material qayerda)
**Nima:** Omborda har rulon/material ma'lum tokcha/joyda. Material partiyasiga joylashuv (zona-qator-tokcha kodi) yozilsin.
**Nega kerak:** Katta omborda "toplayner 140 qayerda?" deb izlash vaqt yo'qotadi; ichki logistika tez topishi kerak.
**Variantlar:**
- A) Ha — joylashuv kodlari + har partiyaga biriktirish — tez topish
- B) Faqat ombor turi (RM-MAIN), aniq tokcha yo'q
- C) Keyin
⤳ Ta'sir: Ombor turlari (Qoida 22), Ichki logistika

### Q917. Ombor harorat / namlik sharoiti monitoringi (qog'oz saqlash)
**Nima:** Qog'oz nam joyda buziladi (laborant namlikni shu sababli tekshiradi). Ombor harorat/namligi kuzatilib, me'yordan chiqsa ogohlantirilsin.
**Nega kerak:** Yaxshi qog'oz nam omborda saqlansa buziladi; bu kirimda emas, saqlashda yo'qotish — oldindan sezish kerak.
**Variantlar:**
- A) Ha — ombor harorat/namlik o'lchovi (qo'lda yoki IoT sensor) + me'yordan chiqsa ogohlantirish — saqlash sifati
- B) Faqat qo'lda davriy yozuv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: IoT moduli, Sifat, Ombor

### Q918. Material yaroqlilik muddati (срок годности) — lak, kley, bo'yoq (FEFO)
**Nima:** Lak, kley, bo'yoq kabi kimyoviy materiallar muddatli. Partiyaga yaroqlilik muddati yozilib, yaqinlashganda ogohlantirilsin va FEFO (avval muddati tugaydigan) chiqim qilinsin.
**Nega kerak:** Muddati o'tgan kley yopishmaydi, lak buziladi — brak; muddatdan oldin ishlatish yoki chiqarish kerak.
**Variantlar:**
- A) Ha — muddatli materiallarga срок годности + ogohlantirish + FEFO chiqim — to'liq
- B) Faqat muddat yoziladi, ogohlantirish yo'q
- C) Keyin
⤳ Ta'sir: Ombor chiqim (FEFO), Sifat

### Q919. Xavfli kimyo (MSDS) saqlash sharti — lak, eritmа, bo'yoq
**Nima:** Lak, eritma, bo'yoq — yonuvchi/xavfli kimyo. Material kartasida xavf sinfi va saqlash sharti (harorat, alohida ombor) ko'rsatilsin.
**Nega kerak:** Xavfli kimyoni noto'g'ri saqlash yong'in/sog'liq xavfi; inspeksiya buni so'raydi.
**Variantlar:**
- A) Ha — xavf sinfi + saqlash sharti + MSDS fayli; xavfli ombor alohida — to'liq
- B) Faqat izoh sifatida
- C) Keyin
⤳ Ta'sir: Ombor turlari, Mehnat xavfsizligi

### Q920. Inventarizatsiya (davr oxiri sanog'i) va kamomad/ortiqcha akti
**Nima:** Davriy ombor inventarizatsiyasi: haqiqiy qoldiq vs tizim qoldig'ini solishtirib, farqni akt bilan rasmiylashtirish.
**Nega kerak:** Qog'oz/material vaqt o'tib "yo'qoladi" yoki noto'g'ri yozilgan bo'ladi; inventarizatsiyasiz tizim qoldig'i haqiqatdan uzoqlashadi.
**Variantlar:**
- A) Ha — inventarizatsiya hujjati (sanaladigan ro'yxat → haqiqiy → farq akti → tuzatish) — to'liq
- B) Qo'lda tuzatish, akt yo'q
- C) Keyin
⤳ Ta'sir: Ombor, Moliya (kamomad zarari)

### Q921. Rohler / поддон (ichki transport) inventari va holati
**Nima:** Kitobda ichki logistika рохлер, поддон kabi vositalarni ishga yaroqli holatda saqlaydi. Bu vositalar tizimda aktiv/jihoz sifatida ro'yxatga olinib holati kuzatilsin.
**Nega kerak:** Rohler buzilsa yarim tayyor mahsulot harakati to'xtaydi; ularning soni va holati hech qayerda yozilmagan.
**Variantlar:**
- A) Ha — rohler/poddon ro'yxati (raqam, holat: ishlayapti/ta'mirda/yaroqsiz, oxirgi tekshiruv) — to'liq
- B) Faqat umumiy soni yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Aktivlar/jihozlar moduli, Texnik xizmat

### Q922. Uchastkalararo ichki ko'chirish hujjati (yarim tayyor harakati)
**Nima:** Kitobda ichki logistika yarim tayyor va tayyor mahsulotlar harakati uzluksizligini ta'minlaydi. Uchastkalararo ko'chirish topshiriqlari (qayerdan-qayerga, kim, miqdor) yaratilsin.
**Nega kerak:** Hozir mol faqat tashqi kirim/chiqim sifatida ko'riladi; ichki ko'chirish kuzatilmasa "qaysi yarim tayyor qayerda" noma'lum bo'ladi.
**Variantlar:**
- A) Ha — ichki ko'chirish hujjati (manba → maqsad uchastka, miqdor, vaqt, mas'ul) — ichki harakat ko'rinadi
- B) Faqat ombordan chiqim, ichki ko'chirish kuzatilmaydi
- C) Keyin
⤳ Ta'sir: Ombor, MES (ishlab chiqarish sessiyalari), Ichki logistika

### Q923. Logistika uzilishi jurnali (поддон/resurs o'z vaqtida yetmasa)
**Nima:** Kitobda ichki logistika resurslarni o'z vaqtida yetkazishi shart, uzilishlarni rahbariyatga xabar qiladi. Tizim uzilishlarni jurnal qilsin.
**Nega kerak:** Ishlab chiqarishdagi "bekor turish/to'xtash" sabablarining ko'pi logistika uzilishi; qayd qilmasak yaxshilab bo'lmaydi.
**Variantlar:**
- A) Ha — uzilish jurnali (nima yetmadi, qancha to'xtab turdi, sabab) → ishlab chiqarish to'xtashiga ulanadi — sabab tahlili
- B) Faqat og'zaki xabar, yozilmaydi
- C) Keyin
⤳ Ta'sir: MES to'xtash sabablari, OEE hisobi

### Q924. Chiqindi va qoldiqni o'z vaqtida chiqarishni qayd qilish
**Nima:** Kitobda ichki logistika "чиқиндилар ва қолдиқларни ўз вақтида чиқарилишини" tashkil qiladi. Chiqindi (qog'oz qirqimi, brak gofra) chiqarish qayd qilinsin.
**Nega kerak:** Qog'oz/gofra chiqindisi qayta ishlashga (макулатура) sotilishi mumkin — bu daromad va ekologiya; hozir umuman hisobga olinmaydi.
**Variantlar:**
- A) Ha — chiqindi turi (qog'oz qirqim/brak/plastik) + miqdor + sana; qayta sotishga ulanadi — to'liq
- B) Faqat chiqarildi belgisi
- C) Keyin
⤳ Ta'sir: Ombor (chiqindi ombori), Moliya (chiqindi sotuvi)

### Q925. Brak/qoldiqni ikkilamchi xom-ashyo (вторсырьё) sifatida sotish yoki qayta ishlatish
**Nima:** Rad etilgan yoki qoldiq qog'oz/gofra — makulatura sifatida sotilishi yoki ichki qayta ishlatilishi mumkin. Tizim "vtorsyryo"ni alohida hisoblasin.
**Nega kerak:** Bu daromad manbai (makulatura sotuvi) va chiqindi kamayadi; hozir hisobga olinmaydi.
**Variantlar:**
- A) Ha — brak/qoldiq → "vtorsyryo" omboriga → sotuv yoki ichki qayta ishlatish hujjati — daromad + ekologiya
- B) Brak shunchaki chiqindi, hisobsiz
- C) Keyin
⤳ Ta'sir: Chiqindi (Q86), Moliya (makulatura sotuvi)

### Q926. Элтиб бериш (yetkazib bering) bo'limi — tayyor mahsulot chiqish logistikasi
**Nima:** Kitobda Элтиб бериш бўлими logistika/transport ta'minoti bilan, mijoz/haydovchilar bilan ishlaydi. Bu — tayyor mahsulotni mijozga yetkazish (kirim transportidan farqli). Chiqish marshrutlari alohida ko'rilsin.
**Nega kerak:** Q22–Q27 kirim molni keltirish haqida; tayyor mahsulotni mijozga yetkazish (chiqish logistikasi) butunlay boshqa jarayon va kitobda alohida bo'lim.
**Variantlar:**
- A) Ha — chiqish yetkazish hujjati (buyurtma, mijoz, haydovchi, mashina, marshrut, yetkazildi vaqti) — to'liq
- B) Tayyor mahsulot chiqishi faqat sotuvda (SD) qoladi, alohida logistika yo'q
- C) Keyin
⤳ Ta'sir: Sotuv (SD), Mijoz yetkazish, Transport

### Q927. Yetkazuvchi minimal partiya / minimal buyurtma miqdori
**Nima:** Ko'p yetkazuvchi "minimal 1 tonna" yoki "minimal 5 rulon"dan sotadi. Yetkazuvchi-material kartasida minimal buyurtma miqdori va yaxlitlash qadami saqlansin.
**Nega kerak:** MRP "200 kg kerak" desa, lekin minimal 1 tonna sotilsa — buyurtma shu minimalga yaxlitlanishi kerak, aks holda rad bo'ladi.
**Variantlar:**
- A) Ha — minimal partiya + yaxlitlash qadami; xarid taklifi shunga moslanadi — realistik buyurtma
- B) Faqat ma'lumot uchun, avtomatik emas
- C) Keyin
⤳ Ta'sir: Avtomatik ariza (Q32), Ombor (ortiqcha zaxira)

### Q928. Ortiqcha kelgan mol (buyurtmadan ko'p) dopuski va qoidasi
**Nima:** Yetkazuvchi buyurtmadan ko'proq mol keltirsa (masalan +5% rulon) — qabul qilinadimi? Ruxsat etilgan ortiqcha dopuski belgilansin.
**Nega kerak:** Qog'ozda rulon to'liq keladi, aniq miqdorga tushmaydi; "ortiqcha"ga qoida bo'lmasa qabulchi o'zicha qaror qiladi.
**Variantlar:**
- A) Ha — ruxsat etilgan ortiqcha dopuski (masalan ±5%); undan ortig'i tasdiq talab qiladi — aniq qoida
- B) Buyurtma miqdoricha qabul, ortig'i rad
- C) Keyin
⤳ Ta'sir: Qabul (Q14), Kreditor qarz (ortiqchaga to'lovmi?)

### Q929. Kam kelgan / kamomad (недостача) va to'lovdan chegirish
**Nima:** Yetkazuvchi kam mol keltirsa yoki yo'lda zarar yetsa (kamomad), tizim farqni qayd qilib to'lovdan chegirsin yoki yetishtirish so'rasin.
**Nega kerak:** Kam molni to'liq deb to'lasak — pul yo'qotamiz; farq hujjatlashishi va to'lovdan chegirilishi kerak.
**Variantlar:**
- A) Ha — kamomad qayd qilinadi → to'lovdan chegiriladi yoki yetishtirish → reytingga ta'sir — to'liq
- B) Faqat haqiqiy kelgan miqdor yoziladi, claim qo'lda
- C) Keyin
⤳ Ta'sir: Hisob-faktura farqi (Q15), Reyting (Q4), Qisman yetkazish (Q41)

### Q930. Nakladnoy / kirim hujjati raqami va skanini biriktirish
**Nima:** Mol bilan keladigan накладной (yo'l hujjati) raqami va skani har kirimga biriktirilsin.
**Nega kerak:** To'lov va moliya hisoboti uchun yetkazuvchi hujjati shart; audit "qaysi hujjat asosida qabul qilindi?" deb so'raydi.
**Variantlar:**
- A) Ha — kirim hujjatiga nakladnoy raqami + sana + skan fayl — to'liq hujjatlashtirish
- B) Faqat raqam matn sifatida
- C) Keyin
⤳ Ta'sir: Moliya, Sverka (Q46), Audit

### Q931. Yetkazuvchi material kodini bizning kodga moslash (kross-katalog)
**Nima:** Yetkazuvchi o'z artikul/kodi bilan ataydi, biz o'z kodimiz bilan. Yetkazuvchi kodi ↔ bizning material kodi moslik jadvali bo'lsin.
**Nega kerak:** Yetkazuvchi nakladnoyida o'z kodi yoziladi; qabulda "bu bizning qaysi material?" deb adashmaslik uchun moslik kerak.
**Variantlar:**
- A) Ha — yetkazuvchi artikul ↔ bizning material kodi xaritasi; qabulda avtomatik moslash — tez qabul
- B) Qo'lda moslashtirish har safar
- C) Keyin
⤳ Ta'sir: Mol qabuli (Q14), Ombor

### Q932. Texkartadan (BOM) avtomatik material talabini hisoblash
**Nima:** Texkarta har mahsulot uchun qaysi material, qancha kerakligini biladi. Buyurtma kelganda MRP texkartadan kerakli material miqdorini avtomatik hisoblasin.
**Nega kerak:** "1000 quti uchun necha m² toplayner, necha kg lak kerak?" ni texkartadan avtomatik hisoblamasa, xarid taxminiy bo'ladi.
**Variantlar:**
- A) Ha — texkarta sarf normalari (m²/dona, kg/dona) × buyurtma soni = material talabi → avtomatik ariza — aniq hisob
- B) Talab qo'lda kiritiladi
- C) Keyin
⤳ Ta'sir: Texkarta (PP/BOM), Avtomatik ariza (Q32), Tannarx

### Q933. Material o'rnini bosuvchi (замена / аналог) — laborant tasdig'i bilan
**Nima:** Asosiy material tugasa yoki kelmasa, o'rnini bosuvchi (analog) qog'oz/gofra bo'lishi mumkin. Material kartasida tasdiqlangan analoglar ro'yxati bo'lsin.
**Nega kerak:** Toplayner 140 tugasa "qaysisini o'rniga ishlatsa bo'ladi?" degan savolga tayyor javob — ishlab chiqarish to'xtamaydi. Lekin analog faqat laborant tasdig'i bilan.
**Variantlar:**
- A) Ha — tasdiqlangan analoglar ro'yxati (laborant tasdig'i bilan); tanqislikda taklif qilinadi — uzluksizlik
- B) Analog yo'q, faqat asosiy material
- C) Keyin
⤳ Ta'sir: Texkarta, Kompozitsiya tasdig'i (Q64), Avtomatik ariza

### Q934. Material guruhlari (qog'oz / gofra / kimyo / folga / qadoq / asbob)
**Nima:** Materiallarni guruhlarga ajratish; hisobot, byudjet, minimal qoldiq guruh bo'yicha sozlansin.
**Nega kerak:** Yuzlab material orasidan kerakli topish va "qog'ozga jami qancha ketdi?" tahlili uchun guruhlash shart.
**Variantlar:**
- A) Ha — material guruh ierarxiyasi; hisobot/byudjet/analitika guruh bo'yicha — tartibli
- B) Tekis ro'yxat, guruhsiz
- C) Keyin
⤳ Ta'sir: Xarid statistikasi (Q45), Byudjet (Q44)

### Q935. Yetkazuvchining "asosiy / zaxira" roli har material uchun
**Nima:** Har material uchun asosiy yetkazuvchi va zaxira yetkazuvchi(lar) belgilanib, asosiysi qila olmasa zaxiraga avtomatik o'tish taklif qilinsin.
**Nega kerak:** Bitta yetkazuvchiga bog'lanib qolish xavf; asosiysi kechiksa zaxira bilan ish to'xtamaydi. (Q36 afzal yetkazuvchini eslatadi — bu zaxira rolini qo'shadi.)
**Variantlar:**
- A) Ha — material-yetkazuvchi bog'lanishida "asosiy/zaxira" + ustuvorlik; tanqislikda zaxira taklif qilinadi — barqarorlik
- B) Faqat afzal yetkazuvchi (Q36), zaxira yo'q
- C) Keyin
⤳ Ta'sir: Afzal yetkazuvchi (Q36), Avtomatik ariza (Q32)

### Q936. Yetkazuvchining va'da/haqiqiy sana farqi — kechikishni o'lchash
**Nima:** Yetkazuvchi va'da qilgan yetkazish sanasi vs haqiqiy kelgan sana farqi (kechikish kunlari) avtomatik o'lchanib reytingga ulansin.
**Nega kerak:** Q4 reyting "kim kechiktiradi"ni so'raydi — buning aniq o'lchovi: va'da sana − haqiqiy sana. Hozir bu raqam hisoblanmaydi.
**Variantlar:**
- A) Ha — har buyurtma uchun va'da/haqiqiy sana; o'rtacha kechikish reyting ko'rsatkichiga aylanadi — obyektiv
- B) Faqat kelgan sana yoziladi, kechikish hisoblanmaydi
- C) Keyin
⤳ Ta'sir: Reyting (Q4), Lead time (Q33)

### Q937. Ramkali (doimiy) shartnoma va yetkazish grafigi (график поставки)
**Nima:** Yirik yetkazuvchi bilan yillik ramkali shartnoma — narx kelishilgan, mol jadval bo'yicha bo'lib keladi. Tizim shartnoma ostidagi yetkazish grafigini (qaysi oyda qancha) kuzatsin.
**Nega kerak:** Ramkali shartnomada har yetkazishga qayta narx kelishilmaydi; "shartnomadan necha qoldi, keyingi yetkazish qachon" ko'rinishi kerak.
**Variantlar:**
- A) Ha — ramkali shartnoma + yetkazish grafigi; har yetkazish shartnoma qoldig'idan ayriladi — to'liq nazorat
- B) Har yetkazish alohida PO (shartnoma faqat hujjat — Q6)
- C) Keyin
⤳ Ta'sir: Shartnoma (Q6), Prays-list (Q37)

### Q938. Narx muzokara izi — kim, qachon, qancha chegirma oldi
**Nima:** Narx muzokarasi natijasi (kim kelishdi, dastlabki/yakuniy narx, chegirma %, sana) saqlansin.
**Nega kerak:** "O'tgan safar 5% chegirma olgandik" ma'lumoti keyingi muzokarada kuch beradi; odam almashsa bu bilim yo'qolmasligi kerak.
**Variantlar:**
- A) Ha — narx kelishuv yozuvi (sana, kim, dastlabki/yakuniy narx, chegirma %, izoh) — institutsional xotira
- B) Faqat yakuniy narx (Q16)
- C) Keyin

### Q939. Qimmat/import partiyada komissiya qabuli (bir necha imzo)
**Nima:** Yirik/qimmat partiya qabulida bir necha mas'ul (ombor + laborant + ta'minot) ishtirok etib qabul aktini imzolasin.
**Nega kerak:** Bitta odam qabul qilsa xato/firibgarlik xavfi; qimmat import partiyada komissiya qabuli ishonchni oshiradi.
**Variantlar:**
- A) Ha — qimmat partiyaga komissiya qabuli (ombor, laborant, ta'minot imzosi) — nazorat
- B) Bitta qabulchi yetarli har holatda
- C) Keyin
⤳ Ta'sir: Qabul (Q14), Laboratoriya darvozasi (Q55)

### Q940. Ta'minotchi KPI paneli (kitob statistik ko'rsatkichlari asosida)
**Nima:** Kitobda har lavozimga "статистик кўрсаткичлар" bor. Ta'minotchi uchun: vaqtida bajarilgan xaridlar %, o'rtacha narx tejovi, brak partiya %, qarz aylanishi, faol PO soni.
**Nega kerak:** Ta'minotchini "yaxshi ishladimi?" deb baholash uchun aniq raqamlar kerak; kitob har lavozimga statistik ko'rsatkich talab qiladi.
**Variantlar:**
- A) Ha — ta'minotchi paneli: vaqtida % / narx tejovi / brak % / qarz aylanishi / faol PO soni — to'liq KPI
- B) Faqat umumiy xarid summasi
- C) Keyin
⤳ Ta'sir: Org karta ЦКП, HR baholash, Statistika (Q45)

### Q941. Xarid buyurtmasi yopilishi mezoni (mol + hujjat + to'lov)
**Nima:** Xarid buyurtmasi qachon rasman "yopiq" — mol to'liq keldi + hujjat biriktirildi + to'lov tugadimi? Q13 holatlarni eslatadi; bu — yopilish mezoni.
**Nega kerak:** "Yopilmagan" buyurtmalar yig'ilib qoladi, "qaysi biri haqiqatan tugagan?" noaniq; yopilish mezoni aniq bo'lishi kerak.
**Variantlar:**
- A) Ha — buyurtma faqat (mol to'liq qabul + hujjat + to'lov) bo'lganda avtomatik yopiladi — toza ro'yxat
- B) Qo'lda yopiladi, mezonsiz
- C) Keyin
⤳ Ta'sir: Buyurtma holatlari (Q13), To'lov (Q28)

### Q942. Material talab prognozi — o'tgan sarf va mavsumiylik asosida
**Nima:** O'tgan oylar material sarfiga qarab kelajak talabni prognoz qilish (masalan bayramlar oldidan qadoq materiali oshadi). Avtomatik ariza buyurtma asosida ishlaydi (Q32); bu — tarixiy prognoz qatlami.
**Nega kerak:** Faqat joriy buyurtmaga qarab xarid qilsa, mavsumiy o'sishga tayyor bo'lmaysiz; tarixiy prognoz oldindan zaxira qilishga yordam beradi.
**Variantlar:**
- A) Ha — o'tgan 12 oy sarf → mavsumiy prognoz → tavsiya zaxira — proaktiv
- B) Faqat joriy buyurtma talabi (Q32) yetarli
- C) Keyin
⤳ Ta'sir: Avtomatik ariza (Q32), Minimal zaxira (Q32), AI tahlil

### Q943. Yetkazuvchiga avans → mol kelganda zachet (avans aylanishi)
**Nima:** Ko'p yetkazuvchi (ayniqsa import) avans talab qiladi. Avans to'lovi qayd qilinib, mol kelganda hisobdan chiqarilsin (zachet). Q31 avans nazoratini eslatadi; bu — avansning mol qabuliga ulanishi.
**Nega kerak:** Avans berdik-u mol kelmasa — bu qarz/xavf; "avans berildi, mol kutilmoqda → mol keldi, zachet qilindi" aylanishi ko'rinmasa pul izsiz qoladi.
**Variantlar:**
- A) Ha — avans to'lovi → mol qabuli → avansni zachet → qoldiq qarz; to'liq aylanish — to'liq
- B) Avans alohida (Q31), mol bilan zachet qo'lda
- C) Keyin
⤳ Ta'sir: Avans nazorati (Q31), Kreditor qarz (Q28), Import (Q38)

DONE: MM / Ta'minot — 51.

## 12. LMS / Ta'lim

### Q944. "Nazorat varaqasi" raqamli artefakt sifatida
**Nima:** Kitobdagi "НАЗОРАТ ВАРАҚАСИ" (har lavozim uchun: FIO, tashkilot, boshlanish/tugatish sanasi, mavzu-mavzu imzo) tizimda raqamli obyekt bo'ladimi.
**Nega kerak:** Kitobda har karta o'qishi aynan shu varaqa orqali yuritiladi — bu zavodning haqiqiy LMS yadrosi. Raqamlashtirilsa qog'oz imzo o'rniga tizimda iz qoladi.
**Variantlar:**
- A) Ha — har kartaga "Nazorat varaqasi" obyekti: FIO + sana + mavzular ro'yxati + har biriga raqamli tasdiq — kitob struktura aynan ko'chiriladi
- B) Soddalashtirilgan — faqat "kurs tugatildi" belgisi, mavzu-mavzu iz yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (onboarding hujjati), Org-karta (har karta o'z varaqasi)
  ↳ Agar A: imzo o'rniga nima bo'ladi? — A1) raqamli tasdiq tugmasi (vaqt+xodim qayd); A2) PIN/parol bilan tasdiq; A3) rahbar qo'sh-tasdiqi

### Q945. Ikki xil nazorat varaqasi — Lavozim (Должностная) + Ishga xos (Рабочая)
**Nima:** Kitobda har lavozim uchun IKKI varaqa bor: "ЛАВОЗИМ ЙЎРИҚНОМАСИ БЎЙИЧА" (umumiy 12 mavzu) va "ЛАВОЗИМГА ХОС" (ishning amaliy yo'riqnomasi). Tizim bu ikkalasini ajratadimi.
**Nega kerak:** Ikki varaqa ikki xil bilimni tekshiradi: biri lavozim mohiyatini (maqsad/ЦКП/javobgarlik), ikkinchisi amaliy ish bajarishni. Aralashtirsa o'qish chala bo'ladi.
**Variantlar:**
- A) Ha, ikkita — har kartada 2 varaqa: "Lavozim yo'riqnomasi" + "Ishga xos yo'riqnoma", ikkalasi alohida tugatiladi
- B) Bitta yaxlit — ikkalasi bir kursga birlashtiriladi
- C) Keyin — hozir kerak emas

### Q946. 12 universal mavzu shabloni
**Nima:** Kitobda har lavozim yo'riqnomasi aynan 12 mavzudan iborat: maqsad, orgsxema joylashuv, malaka talablari, ish joyi/vositalar, umumiy vazifalar, lavozimga xos vazifalar, ЦКП, ko'p uchraydigan xatolar, muvaffaqiyatli harakatlar, huquqlar, javobgarlik, statistik ko'rsatkichlar. Tizim bu 12 mavzuni har kursning standart "qolipi" sifatida ishlatadimi.
**Nega kerak:** Bu shablon zavodda allaqachon ishlaydi va barcha lavozimga bir xil — yangi karta yaratilganda 12 mavzu avtomatik chiqib, faqat to'ldirilsa, kurs tayyorlash tezlashadi va izchil bo'ladi.
**Variantlar:**
- A) Ha — yangi kurs ochilganda 12 mavzu bo'sh qolip bo'lib chiqadi, o'quv bo'limi faqat kontentni to'ldiradi
- B) Erkin — har kurs o'z mavzularini noldan yozadi, qolip yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ЦКП, malaka talablari kartadan keladi), HR (statistik ko'rsatkichlar = KPI)

### Q947. Mavzu-mavzu tasdiq ("ўқиб чиққанингизни тасдиқланг")
**Nima:** Kitobda xodim har mavzuni o'qib bo'lgach imzo qo'yadi ("___ ўқиб чиққанингизни тасдиқланг"). Tizim har mavzu uchun alohida "o'qib chiqdim" tasdiqini saqlaydimi.
**Nega kerak:** Yaxlit "kursni tugatdim" o'rniga mavzu-mavzu tasdiq — xodim qaysi joyda qolganini, qaysi mavzuni o'qiganini aniq ko'rsatadi. Kitob ayni shu darajada nazorat qiladi.
**Variantlar:**
- A) Ha — har mavzu yonida tasdiq, progress mavzular bo'yicha hisoblanadi (masalan 7/12)
- B) Yo'q — faqat kurs oxirida bitta tasdiq
- C) Keyin — hozir kerak emas

### Q948. Har mavzu oxiridagi vaziyat-savol (А/Б/В + izohlang)
**Nima:** Kitobda har mavzudan keyin amaliy vaziyat beriladi: "Бу ҳолатда қайси қарор тўғри? А)... Б)... В)..." + "Танловингизни изоҳланг". Tizim shu formatni qo'llab-quvvatlaydimi.
**Nega kerak:** Bu test turi tayyor — variant tanlash + ochiq izoh. Faqat variantni belgilash bilimni isbotlamaydi; izoh xodimning tushunganini ko'rsatadi. (Avvalgi generic "test turlari" Q6'dan farq qiladi: bu kitobning AYNAN ikki-qismli formati.)
**Variantlar:**
- A) Ha, ikki qismli — har savol: variant tanlash (avto-baholanadi) + ochiq izoh (rahbar/AI o'qiydi)
- B) Faqat variant — A/B/V tanlash, izoh yo'q (avto-baholash oson)
- C) Keyin — hozir kerak emas
  ↳ Agar A: izohni kim baholaydi? — A1) AI birlamchi baho + rahbar tasdiq; A2) faqat rahbar/murabbiy; A3) faqat saqlanadi, baholanmaydi

### Q949. "Сборник упражнений" (amaliy mashqlar to'plami) alohida bo'lim
**Nima:** Kitobda nazorat varaqasidan alohida "Сборник упражнений" bor — ochiq javobli amaliy mashqlar. Tizim test bankidan ayrim "amaliy mashq" bo'limini qo'llab-quvvatlaydimi.
**Nega kerak:** Nazorat varaqasi = "o'qidingmi", mashqlar to'plami = "qo'llay olasanmi". Ikkalasi ayri — biri bilim, biri ko'nikma.
**Variantlar:**
- A) Ha — har kursda ayrim "Amaliy mashqlar" bloki (ochiq javob, murabbiy baholaydi)
- B) Yo'q — hammasi bitta test bankida
- C) Keyin — hozir kerak emas

### Q950. Glossariy (lug'at) har kursga + matn ichida atama izohi
**Nima:** Kitobda har material oxirida glossariy bor (ЦКП, Bitrix24, podpisnoy list, texkarta va h.k. izohlari) va matnda atama birinchi uchraganda izoh beriladi. Tizimda har kursning lug'ati bo'ladimi.
**Nega kerak:** Savodxonligi past yoki yangi ishchi atamalarni tushunmasa o'qish befoyda. Kitob bu muammoni glossariy + matn-ichi izoh bilan hal qilgan.
**Variantlar:**
- A) Ha — har kursning lug'ati + matnda atama bosilganda izoh chiqadi (kitob uslubi)
- B) Markaziy lug'at — bitta umumiy korxona atamalar lug'ati, kursga bog'lanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI chatbot (lug'atdan tushuntirish beradi)

### Q951. Mustaqil ishga qo'yish tartibi — bosqichli buyruq zanjiri
**Nima:** Kitobda "Ходимни мустақил иш фаолиятига қўйиш тартиби" aniq bosqichlar: suhbat → РД-4 lavozim aniqlash + murabbiy + o'qish/sinov muddati → TX yo'riqnoma → buyruq → o'quv bo'limiga yo'naltirish → ish joyida birinchi instruktaj → 2 oy amaliy → imtihon → yozma xulosa → mustaqil ishga ruxsat. Tizim shu zanjirni boshqaradimi.
**Nega kerak:** Bu zavodning rasmiy yangi-xodim o'qitish jarayoni — kim, qachon, qancha vaqt aniq belgilangan. Raqamlashtirilsa hech bir bosqich tushib qolmaydi.
**Variantlar:**
- A) Ha, to'liq workflow — har bosqich (mas'ul + vaqt) tizimda kuzatiladi, oldingisi tugamasa keyingisi ochilmaydi
- B) Faqat checklist — bosqichlar ro'yxati, lekin majburiy tartib yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (onboarding), Org (РД-4 = 4-departament rahbari), MES (mustaqil ishga ruxsatsiz mashinaga qo'ymaslik)

### Q952. РД-4 lavozim aniqlash suhbati onboarding boshida
**Nima:** Kitobda НО-1 yangi nomzodni "РД-4 га лавазимини аниқлаш учун сухбатга" yuboradi — РД-4 (uchastka rahbari) qaysi lavozim/karta, murabbiy, o'qish va sinov muddatini belgilaydi. Tizim bu РД-4 qarorini onboarding boshida qayd qiladimi.
**Nega kerak:** Xodimni qaysi kartaga qo'yish va qancha o'qitish qarori bir joyda (РД-4 suhbati) qabul qilinadi. Bu butun o'quv yo'lini belgilaydi.
**Variantlar:**
- A) Ha — onboardingda "РД-4 suhbati" qadami: karta + murabbiy + o'qish muddati + sinov muddati shu yerda kiritiladi
- B) HR boshqaradi — bu qaror HR'da, РД-4 alohida emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (РД-4 roli), HR

### Q953. 2 oylik amaliy o'qish muddati taymeri
**Nima:** Kitobda yangi ishchi uchun amaliy mashg'ulotlar 2 oy davom etadi. Tizim bu muddatni kuzatib, tugaganda imtihonga signal beradimi.
**Nega kerak:** Muddatsiz "o'rganяpti" abadiy cho'zilishi mumkin. 2 oy — zavodning belgilangan standarti; taymer imtihonni o'z vaqtida boshlatadi.
**Variantlar:**
- A) Ha — o'qish boshlanish sanasidan 2 oy sanaladi, tugashga yaqin murabbiy+РД-4 ga imtihon eslatmasi
- B) Lavozimga qarab — muddat har karta uchun sozlanadi (oddiy ish 2 hafta, murakkab 3 oy)
- C) Keyin — hozir kerak emas

### Q954. Mustaqil ishga o'tishdan oldin ikki imtihon (nazariy + amaliy)
**Nima:** Kitob: "Мустақил ишлашга ўтишдан олдин амалий ва назарий имтихонлардан ўтиш" — ikki imtihon majburiy. Tizim ikkalasini alohida talab qiladimi.
**Nega kerak:** Nazariy = bilim, amaliy = ko'nikma — biri o'tib, ikkinchisi yiqilsa xodim hali tayyor emas. Kitob ikkalasini ham talab qiladi.
**Variantlar:**
- A) Ha — ikkalasi ham o'tilishi shart: nazariy (tizim testi) + amaliy (murabbiy/РД-4 baholaydi)
- B) Bitta — faqat yagona yakuniy imtihon
- C) Keyin — hozir kerak emas

### Q955. РД-4 ning yozma xulosasi ("ёзма хулоса")
**Nima:** Kitobda imtihondan keyin uchastka rahbari (РД-4) yangi xodimni mustaqil ishlashga yaroqliligi haqida yozma xulosa beradi. Tizimda bu yozma xulosa qadami bormi.
**Nega kerak:** Imtihon o'tgan bo'lsa ham, rahbar yakuniy mas'uliyatni o'z zimmasiga oladi — "ruxsat beraman" deb. Bu mas'uliyatli inson qaroridir, faqat avtomatik emas.
**Variantlar:**
- A) Ha — imtihondan keyin РД-4 (uchastka rahbari) yozma xulosa + tasdiq, shundan keyingina "mustaqil ishga ruxsat"
- B) Avtomatik — imtihon o'tsa mustaqil ish darrov ochiladi, xulosa yo'q
- C) Keyin — hozir kerak emas

### Q956. Mustaqil ishga ruxsat = buyruq bilan rasmiylashtirish
**Nima:** Kitobda mustaqil ishga o'tish buyruq orqali rasmiylashtiriladi (lavozim, unvon, F.I.Sh., murabbiy, o'qish davri). Tizim "mustaqil ishga ruxsat" buyrug'ini avtomatik shakllantiradimi.
**Nega kerak:** Buyruq — rasmiy hujjat (HR + razryad + oylik unga bog'liq). Tizim ma'lumotlardan buyruqni tayyorlasa, qog'oz ish kamayadi.
**Variantlar:**
- A) Ha — barcha bosqich tugagach tizim buyruq loyihasini chiqaradi (HR tasdiqlaydi) + razryad/oylik faollashadi
- B) Faqat belgisi — tizimda "ruxsat berildi" flag, buyruq qo'lda yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (buyruq arxivi), Oylik (ruxsatdan keyin to'liq oylik), Org-karta (xodim kartaga rasman bog'lanadi)

### Q957. Texnika xavfsizligi yo'riqnomasi (TX instruktaj) o'qishga kirish sharti
**Nima:** Kitobda o'qishdan oldin "Техника хавфсизлиги бўйича йўриқномадан ўтиш" (sex menejeri TX) majburiy. Tizim TX instruktajisiz o'qish/ishni boshlatmaydimi.
**Nega kerak:** Xavfsizlik birinchi — TX o'tmagan ishchi sexga kira olmasligi kerak. Bu LMS'ning birinchi majburiy moduli.
**Variantlar:**
- A) Ha — TX instruktaji birinchi majburiy modul, tasdiqlanmaguncha boshqa o'qish/MES ochilmaydi
- B) Tavsiya — TX bor, lekin bloklamaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (TX'siz mashina yo'q), HR (xavfsizlik jurnali)

### Q958. Ish joyida birinchi instruktaj (РД-4 + sex menejeri) qayd qilinishi
**Nima:** Kitobda buyruqdan keyin "иш жойида биринчи инструктаж" alohida bosqich. Tizim bu joyida-instruktajni qayd qiladimi (kim o'tkazdi, qachon).
**Nega kerak:** O'quv bo'limidagi nazariydan tashqari, real ish joyida ko'rsatish bosqichi bor — kim mas'ulligi va o'tilgani qayd bo'lishi kerak.
**Variantlar:**
- A) Ha — "ish joyida instruktaj" qadami (mas'ul: РД-4/sex menejeri, sana, tasdiq)
- B) Yo'q — nazariy o'qishga qo'shib yuboriladi
- C) Keyin — hozir kerak emas

### Q959. ЦКП (Qimmatli Yakuniy Mahsulot) har kursda, kartadan keladi
**Nima:** Kitobda har lavozim yo'riqnomasi ЦКП (Ценный Конечный Продукт)ni o'rgatadi — lavozimning aniq, baholanadigan yakuniy natijasi. Kurs xodimga aynan o'z ЦКП sini tushuntiradimi va u kartadan keladimi.
**Nega kerak:** ЦКП — Vysotskiy/karta-model yadrosi. Xodim o'z ЦКП sini bilmasa "to'g'ri ish" ni bilmaydi. Kitob har lavozimga aniq ЦКП beradi.
**Variantlar:**
- A) Ha — kursning ЦКП mavzusi kartaning ЦКП maydonidan avtomatik keladi (yagona manba)
- B) Qo'lda — har kursda ЦКП matni alohida yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ЦКП = karta atributi), AI (xodim-karta mosligini ЦКП bilan baholaydi)

### Q960. "Kўp uchraydigan xatolar" bloki har kursda + jonli yangilanish
**Nima:** Kitobda har yo'riqnoma "Кўп учрайдиган хатолар" mavzusiga ega. Kurslarda shu blok bo'ladimi va u jonli (real xato statistikasidan) yangilanadimi.
**Nega kerak:** Xodimga avvaldan "qaysi xatolar ko'p bo'ladi" deyilsa, ularni takrorlamaydi. Bu real sifat/brak statistikasidan boyib borishi mumkin.
**Variantlar:**
- A) Ha + jonli — kursda "ko'p uchraydigan xatolar" bloki, sifat/MES'dan kelgan real xatolar bilan boyitiladi
- B) Statik — faqat kitobdagi matn, yangilanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (brak/reklamatsiya sabablari → xatolar bloki), AI (eng ko'p xatoni aniqlaydi)

### Q961. "Muvaffaqiyatli harakatlar" bloki + blanka
**Nima:** Kitobda "Муваффақиятли ҳаракатлар" mavzusi va "бланка"si bor (rahbar muntazam to'ldiradi). Tizim bu blankani raqamli yuritadimi.
**Nega kerak:** Faqat xato emas, to'g'ri qilingan ishlar ham yozilsa, yangi xodim namuna oladi. Kitob bu blankani majburiy qiladi.
**Variantlar:**
- A) Ha — "muvaffaqiyatli harakatlar" blankasi: rahbar real misol qo'shadi, kursga ulanadi
- B) Faqat statik mavzu — qo'shilmaydi
- C) Keyin — hozir kerak emas

### Q962. "Лавозим бўйича малака талаблари" kursda va kartada
**Nima:** Kitobda har lavozim "малака талаблари" beradi (masalan: o'rta-maxsus/oliy ta'lim, qog'oz turlarini bilish, gofra turlarini bilish). Kurs shu talablardan kelib chiqib tuziladimi va kartadan olinadimi.
**Nega kerak:** Malaka talablari = nimani o'rgatish kerakligini belgilaydi. Agar talab kartada bo'lsa, kurs avtomatik shu talablarni qoplaydi.
**Variantlar:**
- A) Ha — karta malaka talablari → kurs mavzulari shu talablardan kelib chiqadi (talab = o'rganish maqsadi)
- B) Ajratilgan — malaka talablari HR'da, kurs ayri yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (malaka talablari atributi), Razryad (talab darajasi → razryad)

### Q963. Konkret domen-bilim modullari — "qog'oz turlari", "gofra turlari"
**Nima:** Kitobda ichki logistika boshlig'i uchun "Қоғоз турларини билиши керак", "Гофра турларини билиши керак" kabi konkret bilim bloklari bor. Tizim bunday domen-bilim modullarini (material/mahsulot katalogi bilan bog'liq) qo'llab-quvvatlaydimi.
**Nega kerak:** Bu zavodga xos texnik bilim (gofra, qog'oz markalari). Material katalogi bilan bog'lansa, kurs har doim joriy materiallarga mos bo'ladi.
**Variantlar:**
- A) Ha — domen-bilim modullari material/mahsulot katalogiga bog'lanadi (gofra turi o'zgarsa kurs ham yangilanadi)
- B) Statik — qog'oz/gofra turlari matn sifatida, katalogsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor/Material katalogi (gofra, qog'oz turlari = master data)

### Q964. "Statistik ko'rsatkichlar" mavzusi = karta KPI
**Nima:** Kitobda har lavozim "Статистик кўрсаткичлар" mavzusiga ega (lavozim qanday o'lchanadi). Kurs xodimga uning KPI larini o'rgatadimi va ular kartadan/HR'dan keladimi.
**Nega kerak:** Xodim o'zi qanday baholanishini bilmasa, to'g'ri natijaga intilmaydi. Kitob har lavozimga statistik ko'rsatkich beradi.
**Variantlar:**
- A) Ha — "statistik ko'rsatkichlar" mavzusi kartaning KPI/ЦКП o'lchovlaridan keladi (xodim qanday baholanishini biladi)
- B) Qo'lda — kursda matn sifatida yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (KPI), Org-karta (statistik ko'rsatkich atributi)

### Q965. "Лавозим ҳуқуқлари" va "Лавозим жавобгарлиги" o'qitilishi
**Nima:** Kitobda har yo'riqnoma "Лавозим ҳуқуқлари" va "Лавозим жавобгарлиги"ni alohida o'rgatadi. Kurs xodimga uning huquq va javobgarligini aniq o'rgatadimi.
**Nega kerak:** Xodim o'z huquqini (nima qila oladi) va javobgarligini (nimaga javob beradi) bilmasa, ortiqcha yoki kam ish qiladi. Kitob buni majburiy mavzu qilgan.
**Variantlar:**
- A) Ha — "huquqlar" va "javobgarlik" alohida mavzular, kartadan keladi, test bilan tekshiriladi
- B) Qo'shib — umumiy vazifalarga qo'shiladi, alohida emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (huquq/javobgarlik atributlari)

### Q966. "Иш жойи ва лавозим воситалари" — jihozlar katalogi bilan bog'lanish
**Nima:** Kitobda "Иш жойи ва лавозим воситалари" mavzusi bor (xodim qaysi asbob/jihoz/dastur bilan ishlaydi). Kurs bu vositalarni o'rgatadimi va aktivlar moduliga bog'lanadimi.
**Nega kerak:** Xodim qaysi mashina/asbob/dasturdan foydalanishini bilishi va to'g'ri foydalanishni o'rganishi kerak. Aktivlar moduli bilan bog'lansa, jihoz o'zgarsa kurs ham yangilanadi. (Memory: karta-model "kerakli jihozlar" hozir YO'Q — shu yerga ulanadi.)
**Variantlar:**
- A) Ha — "ish joyi vositalari" mavzusi aktivlar/jihozlar katalogiga bog'lanadi (kartaning "kerakli jihozlar"i)
- B) Statik matn — vositalar ro'yxati qo'lda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Aktivlar/Jihozlar moduli, Org-karta ("kerakli jihozlar")

### Q967. "Оргсхемадаги жойлашуви" mavzusi org-chartdan keladi
**Nima:** Kitobda 2-mavzu — "Оргсхемадаги жойлашуви" (xodim kimga bo'ysunadi, kim bilan hamkorlik qiladi, qaysi departamentda). Kurs bu mavzuni jonli org-chartdan ko'rsatadimi.
**Nega kerak:** Xodim o'z o'rnini (vertikal bo'ysunish + gorizontal hamkorlik) bilmasa, izolyatsiyada ishlaydi — kitob aytadiki bu axborot uzilishi va muammoga olib keladi. Org-chart jonli bo'lsa, kurs har doim haqiqiy tuzilmani ko'rsatadi.
**Variantlar:**
- A) Ha — mavzu jonli org-chartdan keladi (xodim o'z kartasini, rahbarini, hamkor bo'limlarni ko'radi)
- B) Statik rasm — org-sxema rasm sifatida qo'yiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (Vysotskiy-7 daraxti), Koordinatsiya (gorizontal hamkorlik)

### Q968. 7 departament tuzilmasi umumiy kursda
**Nima:** Kitobda korxonaning 7 departamenti sanaladi (Ходимлар, Савдо, Бухгалтерия, Ишлаб чиқариш, ИЧ+сифат/режа/дизайн, Ривожлантириш, Администрация). Har yangi xodim uchun umumiy "korxona tuzilmasi" kursi bo'ladimi.
**Nega kerak:** Lavozimga xos kursdan oldin, har kim korxonaning umumiy tuzilishini bilishi kerak (qaysi departament nima qiladi). Bu birlamchi, hammaga umumiy.
**Variantlar:**
- A) Ha — barcha yangi xodimga majburiy "Korxona tuzilmasi (7 departament)" kursi
- B) Yo'q — faqat o'z lavozimini biladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org

### Q969. O'quv bo'limi (НО-14) "o'quv dasturi hajmini aniqlash" roli
**Nima:** Kitobda НО-1 yangi xodimni "ўқув дастурининг хажмини аниқлаш учун ўқув бўлимига" (НО-14) yo'naltiradi — o'quv bo'limi o'quv dasturi hajmini belgilaydi. Tizimda o'quv bo'limi shu rolni o'ynaydimi.
**Nega kerak:** Har xodimga qancha o'qish kerakligini kim belgilaydi — kitobda bu o'quv bo'limi. Aniq mas'ul bo'lmasa o'quv hajmi tasodifiy bo'ladi.
**Variantlar:**
- A) Ha — o'quv bo'limi har yangi xodim/karta uchun o'quv dasturi hajmini belgilaydi (qaysi kurslar, qancha vaqt)
- B) Avtomatik — karta majburiy kurslari o'zi hajmni belgilaydi, o'quv bo'limi aralashmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (o'quv bo'limi = НО-14), HR (o'quv rejasi)

### Q970. Murabbiyning o'zi malakali ekanini tekshirish
**Nima:** Murabbiy bo'lish uchun xodim o'sha kartaning o'quvini tugatgan + ma'lum razryadga ega bo'lishi sharti qo'yiladimi.
**Nega kerak:** O'rgatmagan/malakasiz murabbiy noto'g'ri o'rgatadi. Murabbiy ham talabga javob berishi kerak.
**Variantlar:**
- A) Ha — murabbiy bo'lish uchun min. razryad + o'sha karta sertifikati + (ixtiyoriy) "murabbiylik" moduli shart
- B) Yo'q — har tajribali xodim murabbiy bo'la oladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, Razryad

### Q971. Murabbiy bo'lmaganda (kichik bo'lim) — zaxira tartib
**Nima:** Ba'zi kartada faqat bitta xodim bor — murabbiy yo'q. Bunday holatda o'qishni kim olib boradi (yuqori rahbar / qo'shni bo'lim / AI / tashqi).
**Nega kerak:** "Murabbiy majburiy" qoidasi kichik bo'limda ishlamaydi. Zaxira yo'l kerak, aks holda jarayon to'xtaydi.
**Variantlar:**
- A) Zaxira tartib — murabbiy yo'q bo'lsa yuqori rahbar yoki yondosh karta egasi murabbiy bo'ladi; AI nazariyni qoplaydi
- B) To'xtatish — murabbiy topilmaguncha onboarding boshlanmaydi
- C) Keyin — hozir kerak emas

### Q972. Murabbiy shogird progressini real vaqtda ko'rishi
**Nima:** Murabbiy o'z shogirdining qaysi mavzuni tugatgani, qaysi testdan o'tgani/yiqilganini real vaqtda ko'ra oladimi.
**Nega kerak:** Murabbiy "qayerda yordam kerak"ligini ko'rmasa, o'rgatishni rejalashtira olmaydi. Kitobda murabbiy mas'ul — unga ko'rinish kerak.
**Variantlar:**
- A) Ha — murabbiyda "mening shogirdlarim" paneli (har birining mavzu/test holati)
- B) Faqat yakunda — murabbiy faqat imtihon natijasini ko'radi
- C) Keyin — hozir kerak emas

### Q973. Yakuniy topshiriqlar ("ЯКУНИЙ ТОПШИРИҚЛАР") — bo'lim oxiridagi yig'ma test
**Nima:** Kitobda har bo'lim (Birinchi/Ikkinchi bo'lim) oxirida "ЯКУНИЙ ТОПШИРИҚЛАР" — yig'ma savol-topshiriqlar bor. Tizim har bo'lim oxirida yakuniy test talab qiladimi.
**Nega kerak:** Mavzu-mavzu o'qishdan tashqari, bo'lim oxirida yig'ma tekshiruv bilimni mustahkamlaydi. Kitob aynan shunday tuzilgan.
**Variantlar:**
- A) Ha — har bo'lim oxirida yakuniy topshiriqlar bloki (o'tilmasa keyingi bo'lim ochilmaydi)
- B) Faqat kurs oxirida — bitta yakuniy
- C) Keyin — hozir kerak emas

### Q974. Sinov muddati (синов муддати) natijasi LMS bilan bog'liqligi
**Nima:** Kitobda buyruqda "синов муддати" (probatsiya) ham belgilanadi. Sinov muddati natijasi (xodim qoladimi/ketadimi) LMS imtihon natijasiga bog'lanadimi.
**Nega kerak:** Sinov muddati = xodim mosmi degan qaror; imtihon natijasi shu qarorning asosiy dalilidir. Ikkalasi bog'lansa qaror asosli bo'ladi. (Avvalgi generic Q50 "probatsiya baholash" umumiy edi — bu kitobning AYNAN buyruq+sinov bog'lanishi.)
**Variantlar:**
- A) Ha — sinov muddati yakunida LMS natijasi (imtihon + murabbiy bahosi) qaror uchun yig'iladi
- B) Ajralgan — sinov muddati HR'da, LMS natijasi ayri
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (probatsiya qarori), AI (xodim-karta mosligi hisoboti)

### Q975. Amaliy imtihonni baholash varaqasi (murabbiy/РД-4)
**Nima:** Amaliy imtihonni murabbiy/РД-4 baholaydi (avtomatik emas). Tizimda amaliy imtihon uchun baholash varaqasi (mezonlar + ball) bormi.
**Nega kerak:** Amaliy ko'nikmani test avtomatik baholay olmaydi — odam baholaydi. Mezonli varaqa bahoni adolatli va izchil qiladi.
**Variantlar:**
- A) Ha — amaliy imtihon baholash varaqasi: mezonlar + ball + baholovchi izohi (murabbiy/РД-4)
- B) Oddiy — faqat "o'tdi/yiqildi" tugmasi
- C) Keyin — hozir kerak emas

### Q976. Lavozim o'zgarganda yangi nazorat varaqasi
**Nima:** Xodim boshqa kartaga (lavozimga) o'tsa, yangi kartaning nazorat varaqasini noldan o'tishi kerakmi.
**Nega kerak:** Kitobda har lavozimning o'z yo'riqnomasi va varaqasi bor. Lavozim o'zgardi = yangi bilim kerak. Eski varaqa yangisini qoplamaydi.
**Variantlar:**
- A) Ha — yangi kartaga o'tganda o'sha kartaning nazorat varaqasi avto-tayinlanadi (eski yopiladi, arxivda qoladi)
- B) Qisman — faqat farq qiladigan mavzular qayta o'tiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (lavozim ko'chishi), HR (transfer)

### Q977. Nazorat varaqasini kitob formatida PDF eksport
**Nima:** Tugatilgan nazorat varaqasini kitobdagi qog'oz shaklida (FIO, tashkilot, sanalar, mavzu-tasdiqlar, imtihon natijasi) PDF qilib chiqarish mumkinmi.
**Nega kerak:** Audit/tekshiruv yoki shaxsiy ish papkasi uchun qog'oz nusxa kerak bo'lishi mumkin. Kitob formatida PDF — tanish va rasmiy.
**Variantlar:**
- A) Ha — tugatilgan varaqa kitob formatida PDF (barcha rekvizit bilan)
- B) Faqat ekran — PDF yo'q
- C) Keyin — hozir kerak emas

### Q978. Lavozimga xos yo'riqnoma o'zgarsa — qayta-o'qish (kartadagi hammaga)
**Nima:** Kartaning "ishga xos yo'riqnoma"si (jarayon o'zgardi) yangilansa, o'sha kartadagi barcha xodimga avtomatik qayta-o'qish/qayta-test tushadimi.
**Nega kerak:** Jarayon o'zgardi, lekin xodim eski usulda ishlasa — brak/xato chiqadi. Yangilanish hammaga yetishi shart. (Generic Q18 "reglament yangilansa" umumiy edi — bu AYNAN ikki-varaqadan "ishga xos" varaqasiga tegishli.)
**Variantlar:**
- A) Ha — yo'riqnoma versiyasi o'zgarsa, o'sha kartadagi xodimlarga "yangilangan qism" qayta-o'qish + qisqa test tushadi
- B) Faqat eslatma — o'zgarish haqida xabar, qayta-test yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hujjat boshqaruvi (yo'riqnoma versiyasi), MES (eski usul bloklash)

### Q979. ERP/CRM tizimida ishlash ko'nikmasi alohida modul
**Nima:** Kitobda dizayn rahbari yo'riqnomasi katta blokni Bitrix24'da (kartochka, kanban, status, fayl) ishlashga bag'ishlaydi. Bizning ERP bilan ishlash ko'nikmasi alohida majburiy modul bo'ladimi.
**Nega kerak:** Endi Bitrix24 emas, bizning ERP. Lekin "tizimda kartochka yuritish, status o'zgartirish" ko'nikmasi har kartaga kerak — bizning tizim bo'yicha o'quv moduli bo'lishi shart.
**Variantlar:**
- A) Ha — "ERP tizimida ishlash" majburiy modul, kartaga qarab kerakli ekranlar (kanban, status, kartochka) o'rgatiladi
- B) Yo'q — tizim o'zi intuitiv deb hisoblanadi, alohida o'quv yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Kanban, barcha modul (tizimdan foydalanish savodxonligi)

### Q980. Onboarding hujjatlar to'plami (ariza, buyruq, TX, varaqa, xulosa)
**Nima:** Kitobdagi tartib bir nechta hujjat keltirib chiqaradi: ishga qabul arizasi, buyruq, TX instruktaj qaydi, nazorat varaqasi, yozma xulosa, mustaqil ish buyrug'i. Tizim bularni bitta onboarding hujjatlar to'plamiga yig'adimi.
**Nega kerak:** Hujjatlar tarqoq bo'lsa, biri tushib qoladi. Bitta to'plamda nima bor/yo'qligi ko'rinadi.
**Variantlar:**
- A) Ha — har yangi xodim onboardingida hujjatlar checklist + har biri tizimda fayl/qayd sifatida
- B) Faqat varaqa — boshqa hujjatlar tizimdan tashqarida
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (shaxsiy ish papkasi)

### Q981. "Ишдаги вазият" interaktiv simulyatsiya rejimi
**Nima:** Kitob mashqlari real vaziyatni tasvirlaydi ("Ишдаги вазият: ..."). Tizim shu vaziyatlarni interaktiv simulyatsiya (qaror tanla → oqibatni ko'r → izoh) qilib bera oladimi.
**Nega kerak:** Faqat o'qishdan ko'ra "qaror qil, natijani ko'r" ko'proq o'rgatadi. Operator xavfsiz muhitda xato qilib o'rganadi.
**Variantlar:**
- A) Ha — vaziyat-mashqlar interaktiv (qaror → oqibat ko'rsatiladi → izoh)
- B) Oddiy — vaziyat matn + bitta to'g'ri javob
- C) Keyin — hozir kerak emas

### Q982. Imtihon savollarini kim tuzadi va tasdiqlaydi
**Nima:** Nazorat varaqasidagi test/imtihon savollarini kim yozadi (o'quv bo'limi / karta AI / rahbar) va kim tasdiqlaydi.
**Nega kerak:** Sifatsiz savol bilimni noto'g'ri o'lchaydi. Savol manbai va tasdig'i aniq bo'lishi kerak. (Generic Q40 "kursni kim yaratadi" — bu AYNAN savol/test mualliflik+tasdiq oqimi.)
**Variantlar:**
- A) O'quv bo'limi tuzadi (AI yordamida) → rahbar/HR tasdiq
- B) AI to'liq avtomatik — yo'riqnomadan savol generatsiya qiladi, tasdiqsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (yo'riqnomadan test generatsiyasi)

### Q983. AI yo'riqnomadan avtomatik test + glossariy + micro-modul generatsiyasi
**Nima:** AI har lavozim yo'riqnomasini o'qib, undan avtomatik test savollari + glossariy + micro-modul taklif qiladimi (o'quv bo'limiga yordam).
**Nega kerak:** Har lavozimga qo'lda kontent yozish juda mehnattalab. AI yo'riqnoma matnidan boshlang'ich variant tayyorlasa, o'quv bo'limi faqat tekshiradi. (Kitobda yo'riqnoma matni TAYYOR — AI uni o'quv kontentiga aylantiradi.)
**Variantlar:**
- A) Ha — AI yo'riqnomadan test/glossariy/micro-modul loyihasini chiqaradi, odam tasdiqlaydi (drafting)
- B) Yo'q — hammasi qo'lda yoziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya moduli

### Q984. O'qish davomida savol berish (murabbiy/AI'ga)
**Nima:** O'qish davomida xodim tushunmagan joyni murabbiy yoki AI'ga so'rashi va javob olishi mumkinmi (tizim ichida).
**Nega kerak:** Yolg'iz o'qigan xodim savolini hech kimga bera olmasa, qotib qoladi. Kitob glossariy beradi, lekin jonli savol uchun kanal kerak.
**Variantlar:**
- A) Ha — har mavzuda "savol berish" tugmasi: AI birlamchi javob, murabbiy/rahbarga eskalatsiya
- B) Yo'q — savol ish joyida og'zaki hal qilinadi
- C) Keyin — hozir kerak emas

### Q985. Imtihon natijasi murabbiy reytingiga ta'siri
**Nima:** Murabbiyning shogirdi imtihondan o'tsa, bu murabbiyning KPI/rag'batiga ijobiy ta'sir qiladimi.
**Nega kerak:** Murabbiy mas'uliyatli bo'lishi uchun natija unga ham bog'liq bo'lishi kerak. Aks holda formal o'rgatadi.
**Variantlar:**
- A) Ijobiy bog'lash — shogird muvaffaqiyati murabbiy reytingi/bonusiga qo'shiladi (salbiy jazo yo'q, demotivatsiya bo'lmasin)
- B) Ikki tomonlama — muvaffaqiyat + (takror yiqilsa) ogohlantirish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (murabbiy KPI), Oylik

### Q986. Kursga namuna fayl/rasm ilova qilish (texkarta, maket, podpisnoy)
**Nima:** Kursga real namuna (texkarta misoli, to'g'ri maket, podpisnoy list namunasi) fayl/rasm ilova qilinadimi.
**Nega kerak:** "Qanday bo'lishi kerak"ni ko'rsatish matndan ko'ra namuna bilan tezroq. Kitobda atamalar bor (texkarta, podpisnoy list, maket), lekin namuna fayllar ko'rsatishni tezlashtiradi.
**Variantlar:**
- A) Ha — har mavzuga namuna fayl/rasm ilova (to'g'ri va noto'g'ri misol)
- B) Yo'q — faqat matn
- C) Keyin — hozir kerak emas

### Q987. Ko'p kartali (bir necha lavozim) xodim o'quvi navbati
**Nima:** Bir xodim bir necha kartaga biriktirilgan bo'lsa, u har kartaning o'quvini alohida o'tishi kerakmi va navbat qanday.
**Nega kerak:** Zavodda bir kishi bir necha vazifa bajaradi (kichik bo'lim). Har karta o'z bilimini talab qiladi — lekin hammasini birdan o'tish og'ir.
**Variantlar:**
- A) Har karta alohida — birlamchi karta o'quvi birinchi (oylik unga bog'liq), qolganlar navbat bilan
- B) Birlashgan — barcha kartalar kurslari bitta ro'yxatga yig'iladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta (ko'p karta-xodim bog'lanishi), Oylik

### Q988. Allaqachon ishlayotgan xodimni yangi kursdan ozod qilish (grandfather)
**Nima:** Allaqachon yillab ishlab kelgan, malakali xodimni yangi joriy etilgan majburiy kursdan ozod qilish mumkinmi.
**Nega kerak:** 10 yil ishlagan ustaga boshlang'ich kursni majburlash vaqt isrofi. Lekin ozodlik suiiste'mol qilinmasligi kerak (xavfsizlik kursi bundan mustasno).
**Variantlar:**
- A) Ha, tasdiq bilan — rahbar/HR ma'lum xodimni ma'lum BILIM kursidan ozod qila oladi (sabab qayd); TX/xavfsizlik kursidan ozodlik YO'Q
- B) Yo'q — hamma istisnosiz o'tadi
- C) Keyin — hozir kerak emas

### Q989. Murabbiy bilan birga o'qish vs mustaqil o'qish ajratish
**Nima:** Nazariy o'qishni xodim mustaqil (ilovada) o'qiydimi yoki murabbiy bilan birga ish joyida — kursda bu ajratiladimi.
**Nega kerak:** Savodi past yoki tajribasiz ishchiga mustaqil o'qish og'ir. Kitobda murabbiy bor — lekin nazariy qismni mustaqil ham o'qisa bo'ladi. Har mavzu uchun "kim bilan" belgilansa, jarayon aniq bo'ladi.
**Variantlar:**
- A) Aralash — har mavzuga "mustaqil" yoki "murabbiy bilan" belgisi; murabbiy nazariyni ham nazorat qiladi
- B) Faqat mustaqil — hamma narsa ilovada, murabbiy faqat imtihonda
- C) Keyin — hozir kerak emas

### Q990. O'qish qaysi qurilmada — sex tableti (POS Monitor) / telefon
**Nima:** Operator kompyuter oldida o'tirmaydi. O'qish telefon yoki sex tableti orqali bo'ladimi.
**Nega kerak:** Mashina yonidagi ishchiga kompyuter yo'q — telefon yoki POS/sex tableti yagona imkon. (Generic Q45 "mobil/telefon" umumiy edi — bu AYNAN POS Monitor sex tabletini o'quv ekraniga aylantirish.)
**Variantlar:**
- A) Ha — telefon + sex tableti (POS Monitor)da o'qish; smena oralig'ida qisqa modul
- B) Faqat ofis kompyuteri — markazlashgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: POS Monitor (sex tableti = o'quv ekrani ham)

### Q991. Departament/sex bo'yicha o'quv qatlamlash
**Nima:** Kitobda har departament (1-7) va sex/sektsiya bor. O'quv dasturlari qatlamlanadimi: umumiy korxona + departament/sex + lavozim-karta.
**Nega kerak:** Bir sexning hamma xodimiga umumiy bilim (sex qoidalari, xavfsizlik) + har kartaga xos bilim kerak. Qatlamlash takrorlanishni kamaytiradi.
**Variantlar:**
- A) Uch qatlam — "umumiy korxona" + "departament/sex" + "lavozim-karta" kurslari qatlamlanadi
- B) Faqat karta — hamma o'quv kartaga, guruh kursi yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org (departament/sex ierarxiyasi)

### Q992. O'qish eslatmasi kanali — Telegram bot
**Nima:** "O'qishingiz bor", "muddat tugayapti", "qayta-test" eslatmalari Telegram bot orqali yetkaziladimi.
**Nega kerak:** Operator ilovani har kuni ochmaydi. Telegram yetib boradi. (Memory: telegram-bots cron mavjud.) Eslatma yetmasa muddat o'tib ketadi. (Generic Q24 "eslatmalar" kanalni aytmagan — bu AYNAN Telegram bot.)
**Variantlar:**
- A) Telegram bot + ilova ichi — asosiy Telegram bot orqali + ilovada belgi
- B) Faqat ilova ichida
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Telegram bot integratsiyasi, Bildirishnoma moduli

### Q993. "Materialni to'liq o'zlashtirish" o'lchovi (kitob maqsadi)
**Nima:** Kitob maqsadi "материални тўлиқ ўзлаштирилишини таъминлаш". Tizim "to'liq o'zlashtirildi"ni qanday aniqlaydi — faqat test bali yoki murabbiy bahosi + amaliy + mavzu-tasdiqlar ham.
**Nega kerak:** "O'zlashtirdi" o'lchovi noaniq bo'lsa, formal o'tib ketadi. O'lchov egasi tomonidan belgilanishi kerak (master-reja, Q-40).
**Variantlar:**
- A) Uch mezon — nazariy test (o'tish bali) + amaliy imtihon (murabbiy) + mavzu-tasdiqlar 100% — uchalasi
- B) Faqat test bali — bitta raqam
- C) Keyin — hozir kerak emas

### Q994. O'quv tarixi arxivi (xodim ketsa ham, karta varaqasi qoladi)
**Nima:** Xodim nimani o'qigan, qaysi imtihondan o'tgan/yiqilgan tarixi xodim ketsa ham arxivda saqlanadimi; karta nazorat varaqasi kartada qoladimi.
**Nega kerak:** Qayta ishga olinса yoki audit chog'ida tarix kerak. Vizyon "darslik kartaga" — karta varaqasi xodim ketsa ham karta bilan qolishi mantiqiy. (Generic Q48 "data saqlanishi" umumiy edi — bu AYNAN nazorat varaqasi karta bilan qolishi.)
**Variantlar:**
- A) Ha — o'quv tarixi xodim profilida doimiy arxiv + nazorat varaqasi karta tarkibida qoladi (voris o'sha varaqani oladi)
- B) Yo'q — xodim ketsa o'quv ma'lumoti o'chiriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-karta ("darslik kartaga" vizyoni)

### Q995. Davriy qayta-tasdiq (yo'riqnoma o'zgarmasa ham)
**Nima:** Yo'riqnoma o'zgarmagan bo'lsa ham, xodim o'z lavozim varaqasini davriy (masalan yiliga bir) qayta o'qib tasdiqlashi kerakmi.
**Nega kerak:** Bilim eskiradi va unutiladi. Davriy qayta-tasdiq lavozim talablarini yodda saqlaydi. (Generic Q13 "attestatsiya davriyligi" razryad uchun edi — bu AYNAN lavozim varaqasini qayta o'qish.)
**Variantlar:**
- A) Ha — yiliga bir marta lavozim varaqasini qayta tasdiqlash (qisqartirilgan test bilan)
- B) Faqat o'zgarganda — yo'riqnoma o'zgarmasa qayta o'qish yo'q
- C) Keyin — hozir kerak emas

### Q996. Tashkilij siyosat (ОРГПОЛИТИКА) hujjatlari ham testga bog'lanadimi
**Nima:** Kitobda lavozim yo'riqnomalaridan tashqari "ОРГПОЛИТИКА / ТАШКИЛИЙ СИЁСАТ" hujjatlari bor (masalan: telefon berish tartibi, aloqa xavfsizligi). Bu siyosat hujjatlari ham o'qish/test sifatida tarqatiladimi.
**Nega kerak:** Lavozim bilimidan tashqari, korxona umumiy siyosatlari (tijorat siri, aloqa, telefon) ham xodimga yetishi kerak — kitobda bular alohida hujjat.
**Variantlar:**
- A) Ha — tashkiliy siyosat hujjatlari "umumiy reglament" sifatida tegishli xodimlarga o'qish + tasdiq sifatida tushadi
- B) Faqat lavozim yo'riqnomasi — siyosat hujjatlari LMS'da emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hujjat boshqaruvi, HR

### Q997. Tijorat siri / maxfiylik moduli majburiy
**Nima:** Kitobda "Компания тижорат сирлари, дизайн файллари ва ички маълумотларни ҳимоя қилиш" vazifasi bor. Maxfiylik/tijorat siri bo'yicha alohida majburiy modul + tasdiq bo'ladimi.
**Nega kerak:** Xodim tijorat sirini himoya qilish majburiyatini bilib, yozma tasdiqlashi kerak (huquqiy himoya). Kitobda bu lavozim vazifasi sifatida bor.
**Variantlar:**
- A) Ha — "tijorat siri va maxfiylik" majburiy modul + yozma tasdiq (NDA o'rnida iz qoladi)
- B) Faqat vazifa matni — alohida modul/tasdiq yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (huquqiy himoya), Xavfsizlik

### Q998. Tashqi malaka/sertifikatni ichki kurs o'rniga hisoblash
**Nima:** Xodim tashqarida (texnikum, ishlab chiqaruvchi treningi) olgan sertifikatni tizimga kiritib, ichki kurs o'rniga hisoblash mumkinmi.
**Nega kerak:** Tashqi malaka bor bo'lsa, ichki kursni takrorlash shart emas. Kitobda malaka talablari "o'rta-maxsus/oliy ta'lim" deydi — tashqi diplom/sertifikat tasdiqlanib hisobga olinishi mantiqiy. (Generic Q47 "import sertifikat" umumiy edi — bu AYNAN malaka-talabini tashqi hujjat bilan qondirish.)
**Variantlar:**
- A) Ha — tashqi sertifikat/diplom yuklanadi + HR tasdiqlaydi → tegishli ichki kurs/malaka-talab "qondirilgan" hisoblanadi
- B) Yo'q — faqat ichki kurslar hisobga olinadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (xodim malaka tarixi), Razryad

DONE: LMS / Ta'lim — 55.

## 13. CRM

### Q999. Savdo menejeriga korporativ raqam biriktirish
**Nima:** Hujjatga ko'ra ("Янги ходим компанияга келганида ... корпоратив мобил рақамни тақдим этиш") har yangi savdo menejeriga zavod korporativ SIM/raqam beradi. CRM shu raqamni menejer kartasiga biriktirib, mijozga ko'rinadigan raqam shu bo'lsinmi?
**Nega kerak:** Menejer ketganda mijoz shaxsiy raqamga "yopishib" qolmaydi — raqam zavodniki, yangi menejerga o'tadi, mijoz uzilmaydi. Hozir ko'p mijoz menejerning shaxsiy telefonida.
**Variantlar:**
- A) Korporativ raqam = menejer kartasiga biriktirilgan, ketsa raqam yangi menejerga o'tadi (mijoz seziyam) — baza zavodniki
- B) Menejer o'z raqamidan ishlaydi, CRMda faqat yoziladi — ketsa mijoz birga ketadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR (ishga qabul), Org-struktura (karta), Aloqa kanallari

### Q1000. Aloqa abonentlari ro'yxati cheklovi
**Nima:** Hujjatda har lavozimga ruxsat etilgan "Алоқа абонентлари" aniq belgilangan. Savdo menejeriga faqat: (1) "Компания фаолиятини хал қилувчи шахслар" va (2) "Яқин қариндошлар" ruxsat. CRM korporativ raqamdan faqat shu doiraga aloqa qilinishini nazorat qilsinmi?
**Nega kerak:** Hujjat maqsadi — "хизмат маълумотларининг ташқарига чиқиш хавфи"ni kamaytirish. Cheksiz aloqa = ma'lumot sizishi.
**Variantlar:**
- A) Faqat tasdiqlangan abonent doirasi (mijozlar bazasi + qarindosh ro'yxati); tashqari raqamga aloqa CRMda flaglanadi — siyosatga mos
- B) Cheklovsiz, lekin hammasi loglanadi — yumshoq nazorat
- C) Keyin
  - ⤳ Ta'sir: Xavfsizlik, AI (anomaliya)

### Q1001. Qo'ng'iroqlar nazorati (Инспекция ва хисоотлар бўлими)
**Nima:** Hujjat: "Инспекция ва хисоотлар бўлими бошлиғи томонидан қўнғироқлар назорати амалга оширилади". CRM korporativ raqam qo'ng'iroqlarini (kim, qachon, davomiyligi, mijoz) shu bo'limga avtomatik hisobot qilsinmi?
**Nega kerak:** Nazorat qo'lda emas, tizim orqali bo'lsa — Inspeksiya bo'limi har menejer faolligini real ko'radi, "musobaqalarni nazoratga olish" maqsadi bajariladi.
**Variantlar:**
- A) Qo'ng'iroq jurnali avtomatik Inspeksiya bo'limi paneliga (kim/qachon/davomiylik/mijoz) — siyosat amalda
- B) Faqat menejer kartasida ko'rinadi, Inspeksiya so'rasa beradi — yarim
- C) Keyin
  - ⤳ Ta'sir: Org-struktura (Inspeksiya bo'limi), AI tahlil

### Q1002. Sifat bo'limi boshlig'i ham mijoz bilan gaplashadi
**Nima:** Hujjatda "Сифат бўлими бошлиғи" abonentlari orasida ham "мижозлар" bor ("Етказиб берувчилар ва мижозлар билан боғлиқ масалаларни хал қилиш"). Ya'ni mijoz bilan faqat savdo emas, sifat boshlig'i ham gaplashadi (reklamatsiya bo'yicha). CRM bu aloqalarni ham mijoz kartasiga yozsinmi?
**Nega kerak:** Mijoz sifat masalasida Sifat boshlig'i bilan gaplashsa, savdo menejeri bilmay qoladi — kartada ko'rinmasa, ikki bo'lim bir-biridan bexabar ishlaydi.
**Variantlar:**
- A) Sifat boshlig'i ↔ mijoz aloqasi ham shu mijoz kartasida ko'rinadi (turi: "sifat/reklamatsiya") — yagona tarix
- B) Faqat savdo aloqasi yoziladi, sifat alohida — bo'linish
- C) Keyin
  - ⤳ Ta'sir: Sifat nazorati, 360° karta

### Q1003. Korporativ raqamda Telegram/biznes-akkaunt
**Nima:** Korporativ raqam Telegram/WhatsApp biznes akkauntga ulanadimi — ya'ni mijoz yozsa, yozishma korporativ akkauntda (menejer shaxsiysida emas) saqlansin.
**Nega kerak:** Q1 ning amaliy davomi: menejer ketganda Telegram tarixi ham zavodda qolishi kerak, shaxsiy telefonda emas.
**Variantlar:**
- A) Korporativ Telegram/WhatsApp akkaunt → yozishma CRMda; menejer ketsa akkaunt qoladi — uzilmas
- B) Menejer shaxsiy Telegramidan, qo'lda nusxalaydi — yo'qoladi
- C) Keyin
  - ⤳ Ta'sir: AI integratsiya (Telegram bot)

---

## BO'LIM 2 — Qarzdorlik mas'uliyati bo'linishi (Daromadlar bo'limi)

### Q1004. Debitor qarz savdoda emas, Daromadlar bo'limida
**Nima:** Hujjatda "Дебитор қарздорлик билан боғлиқ масалалар" — alohida "Даромадлар бўлими бошлиғи" zimmasida (savdo menejerida emas). CRMda qarz undirish vazifasi avtomatik Daromadlar bo'limiga yo'naltirilsinmi, savdoga emas?
**Nega kerak:** Zavod modeli savdo va qarz undirishni ataylab ajratgan — savdo sotadi, Daromadlar puli undiradi. CRM bu taqsimotni buzmasligi kerak.
**Variantlar:**
- A) Qarz undirish vazifasi avtomatik Daromadlar bo'limiga; savdo menejeri faqat xabardor — zavod modeliga mos
- B) Hamma qarz vazifasi savdo menejeriga — bitta odam ham sotadi ham undiradi (zavod modeliga zid)
- C) Keyin
  - ⤳ Ta'sir: Finance (debitorlik), Org-struktura (Daromadlar bo'limi)
  - ↳ Agar A: Savdo menejeri qarzli mijozga yangi bitim ochmoqchi bo'lsa — Daromadlar bo'limidan "ruxsat" so'rasinmi? (A: avtomatik blok + Daromadlar tasdig'i kerak / B: faqat ogohlantirish / C: erkin)

### Q1005. Mijoz "qarz holati" kim tomonidan yangilanadi
**Nima:** Mijoz kartasidagi qarz raqami kim manbasidan keladi — Daromadlar bo'limi/Finance moduli avtomatik to'ldiradimi yoki savdo menejeri qo'lda?
**Nega kerak:** Savdo menejeri qarz raqamini o'zi yozsa, "mijozni xafa qilmaslik" uchun kamaytirib ko'rsatishi mumkin. Avtomatik manba — xolis.
**Variantlar:**
- A) Faqat Finance/Daromadlar modulidan avtomatik (savdo o'zgartira olmaydi) — ishonchli
- B) Savdo menejeri qo'lda yangilaydi — xato/manipulyatsiya xavfi
- C) Keyin
  - ⤳ Ta'sir: Finance

### Q1006. Qarz bo'yicha mijozga aloqa qilish bayoni
**Nima:** Daromadlar bo'limi qarz bo'yicha mijozga qo'ng'iroq qilganda, bu aloqa savdo menejeriga ko'rinsinmi (chunki mijoz bilan ikki bo'lim parallel gaplashadi)?
**Nega kerak:** Menejer mijozga qo'ng'iroq qilganda "sizdan qarz so'rashdi" degan gapdan bexabar bo'lsa — noqulay holat. Tarix umumiy bo'lsin.
**Variantlar:**
- A) Qarz aloqalari mijoz kartasida ko'rinadi (savdo + Daromadlar bir tarixda) — muvofiqlashtirilgan
- B) Daromadlar aloqasi alohida, savdo ko'rmaydi — bo'linish
- C) Keyin

---

## BO'LIM 3 — Papka / Заявка tizimi (zavodning haqiqiy buyurtma yuritishi)

### Q1007. "Papka №" — mijozning buyurtma papkasi
**Nima:** Zavodda har buyurtma "Папка №" (papka raqami) + "Название заказа" bilan yuritiladi (Заявка бумаги jadvali). CRM mijoz kartasini shu papka tizimiga bog'lasinmi — har mijoz ostida uning papkalari ro'yxati?
**Nega kerak:** Zavod allaqachon papka bilan ishlaydi (qog'oz zayavkasi, format, gramm shu papkaga). CRM bitimi papkaga ulansa — savdo va ishlab chiqarish bir tilda gaplashadi.
**Variantlar:**
- A) Har CRM bitimi → Papka № bilan bog'lanadi; mijoz kartasida uning barcha papkalari — zavod tizimiga mos
- B) CRM o'z ID si bilan ishlaydi, papka alohida — ikki raqamlash, chalkashlik
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (papka), Savdo buyurtmasi

### Q1008. "Прошло (дней)" — buyurtma necha kun turibdi
**Nima:** Заявка bumagi jadvalida "Прошло (дней)" ustuni bor — buyurtma ochilganidan necha kun o'tgani. CRM bitim kartasida shu hisoblagich ko'rinib, uzoq turgan buyurtma menejerga signal bersinmi?
**Nega kerak:** Zavod allaqachon "necha kun o'tdi"ni kuzatadi — demak bu muhim ko'rsatkich. CRM uni avtomatlashtirsa, "osilib qolgan" buyurtma yo'qolmaydi.
**Variantlar:**
- A) "O'tgan kun" avtomatik hisoblanadi + limitdan oshsa menejer va Daromadlar/IShCH boshlig'iga signal — zavod amaliyotiga mos
- B) Faqat sana ko'rsatiladi, hisoblagichsiz — qo'lda
- C) Keyin

### Q1009. Mijozning qog'oz zayavkasi (Заявка бумаги) CRMda
**Nima:** Har buyurtma uchun aniq qog'oz so'raladi (Наименование/Формат/Грам/Кг/Лист размер). Bu spetsifikatsiya CRM mijoz kartasidagi "doimiy talab"ga (Q13 v2) bog'lansinmi, ya'ni mijoz qaysi qog'ozni odatda buyuradi?
**Nega kerak:** Doimiy mijoz har gal bir xil qog'oz/format/gramm buyuradi. Saqlangan bo'lsa — yangi buyurtmada qayta yozish shart emas, xato kamayadi.
**Variantlar:**
- A) Mijozning odatiy qog'oz profili (naimenovanie/format/gramm) saqlanadi va yangi bitimga avtomatik tortiladi — qayta buyurtma tez
- B) Har gal qo'lda yoziladi — xato/sekin
- C) Keyin
  - ⤳ Ta'sir: Ta'minot (qog'oz zayavkasi), Ishlab chiqarish

### Q1010. "Примечание" (izoh) papkadan kartaga
**Nima:** Заявка jadvalida har satrda "Примечание" izohi bor. Bu papka izohlari mijoz kartasida ko'rinsinmi (masalan "mijoz oq karton talab qildi", "shoshilinch")?
**Nega kerak:** Izohlar ko'pincha eng muhim ma'lumot (kelishuv nuanslari). Papkada qolib ketsa, savdo menejeri ko'rmaydi.
**Variantlar:**
- A) Papka izohlari mijoz tarixida ko'rinadi — to'liq kontekst
- B) Izoh faqat papkada — bo'linish
- C) Keyin

---

## BO'LIM 4 — Takroriy buyurtma va mahsulot kodi (ГП-...)

### Q1011. ГП kodi bo'yicha takroriy buyurtma
**Nima:** Zavodda tayyor mahsulot aniq kod bilan yuritiladi — masalan "ГП-2026-0187 Compact cotton konteyner", "ГП-2025-4779 Indorama konteyner". CRM mijoz kartasida shu kodlar tarixi bo'lib, mijoz "o'tgan galgidek" desa, eski kod bo'yicha bir tugmada qayta buyurtma ochilsinmi?
**Nega kerak:** Doimiy mijozlar (Indorama, Compact cotton) bir xil mahsulotni qayta-qayta oladi. ГП kodi bilan saqlansa — "yana o'shandan" 1 daqiqada bo'ladi.
**Variantlar:**
- A) Mijoz kartasida ГП-kod tarixi + "qayta buyurtma" tugmasi (eski spetsifikatsiya bilan) — tez va xatosiz
- B) Har gal yangidan kiritiladi — sekin
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (tex-karta), Savdo buyurtmasi

### Q1012. Mahsulot konstruksiya parametrlari kartada
**Nima:** ГП kodlarida "5 sloylik", o'lcham "68.1x45.6x34.8", "new model" kabi aniq parametrlar bor. CRM mijozning har mahsuloti uchun bu parametrlarni (sloy soni, o'lcham, model) saqlasinmi?
**Nega kerak:** Mijoz "o'sha 5 qatlamli konteyner"ni so'rasa, parametrlar saqlangan bo'lsa — tex-karta avtomatik to'ladi, dizayner qaytadan o'lchamaydi.
**Variantlar:**
- A) Har mahsulotga to'liq konstruksiya profili (sloy/o'lcham/model/yozuvi bor-yo'qligi) — qayta buyurtma aniq
- B) Faqat nomi saqlanadi — parametrni har gal so'raladi
- C) Keyin

### Q1013. Brend/yozuv (Indorama) maketni eslab qolish
**Nima:** ГП yozuvlarida "Indorama yozuvi yo'q" / "Indorama" kabi brend belgilari bor — mijoz qutiga qaysi brend/logotipni bosishini bildiradi. CRM har mijoz uchun saqlangan maket/logotipni ko'rsatsinmi?
**Nega kerak:** Mijoz har gal o'z logotipi/yozuvi bilan quti oladi. Saqlangan maket — dizayn vaqtini tejaydi, xato bosma bo'lmaydi.
**Variantlar:**
- A) Mijoz maket/logotip/yozuv kutubxonasi kartada (versiyalar bilan) — to'g'ri bosma kafolati
- B) Maket har gal qaytadan so'raladi — xato xavfi
- C) Keyin
  - ⤳ Ta'sir: Dizayn, Ishlab chiqarish (bosma)

---

## BO'LIM 5 — ГП topshirish blankasi (yetkazib berish hujjati)

### Q1014. ГП topshirish blankasi savdo menejeri imzosi
**Nima:** Yetkazish blankasida 3 imzo bor: "Юкни топширувчи (Омборчи)", "Юкни қабул қилувчи (Хайдовчи)", "Савдо менеджери: Azizov A". CRM yetkazib berishni shu blanka tartibida (savdo menejeri tasdig'i bilan) yopsinmi?
**Nega kerak:** Zavodda yuk savdo menejeri imzosisiz chiqmaydi — bu real qoida. CRM/Logistika shu uch imzoni elektron talab qilsa, hujjat to'liq bo'ladi.
**Variantlar:**
- A) Elektron blanka: omborchi + haydovchi + savdo menejeri tasdig'i; uchchovsiz yuk "chiqdi" bo'lmaydi — qog'oz blankaga mos
- B) Faqat ombor chiqaradi, savdo keyin ko'radi — imzo tartibi buziladi
- C) Keyin
  - ⤳ Ta'sir: Ombor (chiqim), Logistika, Savdo

### Q1015. Yetkazilgandan keyin mijoz kartasini yangilash
**Nima:** ГП topshirilganda (haydovchi qabul qilganda) mijoz kartasida "oxirgi yetkazib berish sanasi" va buyurtma "yopildi" avtomatik bo'lsinmi?
**Nega kerak:** Menejer yetkazilgani bilmasa, mijozga "yana qachon kerak"ni so'ramaydi. Avtomatik yangilanish takroriy sotuvga turtki beradi.
**Variantlar:**
- A) Yetkazish tasdig'i → karta "yetkazildi" + keyingi buyurtma eslatmasi — proaktiv
- B) Menejer o'zi tekshiradi — passiv
- C) Keyin

### Q1016. Haydovchi/transport mijoz kartasida
**Nima:** Blankada haydovchi yozildi. CRM mijozga oxirgi marta qaysi haydovchi/transport borganini saqlasinmi (mijoz "o'sha mashina kelsin" desa)?
**Nega kerak:** Ba'zi yirik mijozlar muayyan transport/haydovchini biladi (ombor kirishi cheklangan). Tarix bo'lsa — logistika oson.
**Variantlar:**
- A) Yetkazib berish tarixida transport/haydovchi saqlanadi — logistika qulayligi
- B) Saqlanmaydi — har gal noaniq
- C) Keyin

---

## BO'LIM 6 — Format/o'lcham va dizayn kelishuvi (qisqartirish jadvali)

### Q1017. "Razmer planda va aslida" farqi kartada
**Nima:** Qisqartirish jadvalida "Razmer planda / aslida" (rejadagi o'lcham va haqiqiy o'lcham) farqi yuritiladi. CRM mijoz bilan kelishilgan o'lcham bilan ishlab chiqarilgan o'lcham farqini ko'rsatsinmi?
**Nega kerak:** Mijoz "men 63x43,5 dedim, siz 63,5x44 qildingiz" desa — nizo. Kelishilgan va faktik o'lcham saqlansa, bahslashuvda dalil bor.
**Variantlar:**
- A) Bitimda "kelishilgan o'lcham" qulflanadi; ishlab chiqarish farq qilsa flaglanadi va mijoz tasdig'i so'raladi — nizosiz
- B) Faqat yakuniy o'lcham saqlanadi — farq ko'rinmaydi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish, Sifat

### Q1018. Format kichraytirish (qisqartirish) menejer roziligi
**Nima:** Jadvalda "Кичиклаштириш учун маслаҳат қилиш", "Менежер фикри", "Менежер хохиши" bor — narx/sarf uchun format kichraytirishda menejer fikri so'raladi. CRM format o'zgarishiga mijoz/menejer roziligini majburiy qilsinmi?
**Nega kerak:** Format kichraytirilsa quti hajmi o'zgaradi — mijoz roziligisiz bo'lmaydi. Hozir bu og'zaki; CRMda yozilsa, "men rozi emasdim" nizosi tugaydi.
**Variantlar:**
- A) Format o'zgarishi → mijoz + menejer elektron roziligi (kim, qachon) saqlanadi — nizosiz
- B) Og'zaki kelishuv, CRMda yozilmaydi — xavfli
- C) Keyin
  - ⤳ Ta'sir: Dizayn, Ishlab chiqarish (chiqim/chiqimsiz)

### Q1019. Dizayner bilan kelishuv bosqichi voronkada
**Nima:** Jadvalda "Дизайн қилиш", "Дизайнер билан маслаҳат", "Аниқ ўлчовларни олиш", "Шошилмаслик" bosqichlari bor — bu mijoz↔dizayner muloqotidir. CRM voronkasida "dizayn kelishuvi" alohida bosqich bo'lsinmi?
**Nega kerak:** Karton zavodda dizayn/o'lcham kelishuvi ko'p vaqt oladi va ko'p buyurtma shu yerda osilib qoladi. Alohida bosqich — qayerda qotganini ko'rsatadi.
**Variantlar:**
- A) "Dizayn/o'lcham kelishuvi" alohida voronka bosqichi + dizayner mas'ul + kun limiti — qotish ko'rinadi
- B) Umumiy "ish jarayonida" ichida — yashirin
- C) Keyin
  - ⤳ Ta'sir: Dizayn bo'limi, Voronka

### Q1020. "Shoshilmaslik" — o'lchov tasdig'isiz ishga tushmaslik
**Nima:** Jadvalda "Аниқ ўлчовларни олиш" + "Шошилмаслик" tamoyili bor — o'lcham aniq tasdiqlanmaguncha ishlab chiqarishga tushmaslik. CRM bitimni "o'lcham tasdiqlangan" bayrog'isiz ishlab chiqarishga o'tkazmasinmi?
**Nega kerak:** Aniq o'lchovsiz ishlab chiqarish = brak = material/pul yo'qolishi. Zavod bu xatoni ko'rgan (shuning uchun "shoshilmaslik" yozgan).
**Variantlar:**
- A) "O'lcham tasdiqlandi" majburiy bayroq; usiz ishlab chiqarishga o'tmaydi — brak oldi olinadi
- B) Menejer o'zi qaror qiladi — shoshilish xavfi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish, Sifat

---

## BO'LIM 7 — Mijoz turi: korxona (B2B) xususiyatlari

### Q1021. Mijoz = ishlab chiqaruvchi korxona (oxirgi mahsulot)
**Nima:** Zavod mijozlari ko'pincha o'z mahsulotini qadoqlovchi korxonalar (Indorama — yarn/cotton, Compact cotton). CRM mijozning OXIRGI mahsulotini (ular nima qadoqlaydi) saqlasinmi?
**Nega kerak:** "Pamuq konteyner" buyuradigan mijozga "elektr plita qutisi" taklif qilinmaydi. Mijoz biznesini bilsak — to'g'ri mahsulot va kross-sotuv.
**Variantlar:**
- A) Mijozning mahsuloti/biznesi profili saqlanadi (nima qadoqlaydi) — aniq taklif
- B) Faqat nomi — taklif ko'r-ko'rona
- C) Keyin

### Q1022. Mavsumiy/hajmli mijoz (Indorama tipidagi)
**Nima:** Yirik takroriy mijoz (Indorama) doimiy katta hajm beradi. CRM bunday "asosiy mijoz"ni alohida belgilab, ularga maxsus rejim (zaxira material, ustuvor ishlab chiqarish) ulasinmi?
**Nega kerak:** 1-2 yirik mijoz zavod yukining katta qismini beradi. Ular kechiksa — katta zarar. Ularga alohida e'tibor kerak.
**Variantlar:**
- A) "Asosiy mijoz" bayrog'i + ustuvor ishlab chiqarish + material zaxirasi ogohlantirishi — strategik
- B) Hamma teng — yirik mijoz e'tibordan chetda qolishi mumkin
- C) Keyin
  - ⤳ Ta'sir: Ta'minot (zaxira), Ishlab chiqarish (ustuvorlik)

### Q1023. Mijoz odatiy buyurtma hajmi (kg)
**Nima:** Zavod hammasini kg da o'lchaydi ("Olingan buyurtma kg", "Tayyor bo'lgan kg" — Oylik diog). CRM mijozning odatiy oylik kg hajmini saqlab, kamayish/ko'payishni ko'rsatsinmi?
**Nega kerak:** Har oy 5 tonna oladigan mijoz bu oy 1 tonna olsa — nimadir bo'lgan (raqobatchiga ketdi?). Kg-trend signal beradi.
**Variantlar:**
- A) Mijoz oylik kg-trendi + pasayishda signal — yo'qotishdan oldin ushlaymiz
- B) Faqat summa (so'm) kuzatiladi — zavod kg da o'ylaydi, mos emas
- C) Keyin
  - ⤳ Ta'sir: Hisobotlar, AI churn

---

## BO'LIM 8 — Narx, qisqartirish va chiqim mantiqi

### Q1024. "Chiqimli / Chiqimsiz" narx mantiqi
**Nima:** Jadvalda "Чиқимли / Чиқимсиз" (qog'oz isrofi bor/yo'q variant) farqlanadi — format tanlovi materialni tejaydi yoki isrof qiladi. CRM mijozga narx aytishda chiqimli/chiqimsiz variantni ko'rsatsinmi?
**Nega kerak:** Chiqimsiz format = arzonroq narx (kam isrof). Menejer mijozga "agar o'lchamni biroz o'zgartirsangiz, arzonroq bo'ladi" deya olsa — sotuv kuchayadi.
**Variantlar:**
- A) Narx taklifida chiqimli/chiqimsiz variant + tejamkor taklif ko'rsatiladi — savdo dalili
- B) Faqat bitta narx — tejash imkoniyati ko'rinmaydi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (format optimizatsiya), Finance (narx)

### Q1025. Qog'oz narxi o'zgarishida mijoz narxini qayta hisoblash
**Nima:** Jadvalda "Қоғоз нархи" + "Умумий қоғоз сўммаси" bor — quti narxining asosi qog'oz narxi. Qog'oz narxi oshganda CRM ta'sirlangan mijozlarning narxini qayta hisoblab ogohlantirsinmi?
**Nega kerak:** Qog'oz qimmatlashsa, eski narxda sotish = zarar. Qaysi mijozga narx oshirish kerakligini tizim ko'rsatsa — daromad himoyalanadi.
**Variantlar:**
- A) Qog'oz narxi o'zgarsa → ta'sirlangan mijozlar ro'yxati + narxni qayta ko'rish vazifasi — daromad himoyasi
- B) Qo'lda hisoblanadi — kechikadi, zarar
- C) Keyin
  - ⤳ Ta'sir: Ta'minot (qog'oz narxi), Finance

### Q1026. Bir mijozga ko'p formatli narx jadvali
**Nima:** Bir mijoz turli format/o'lchamda quti oladi (133 format, 105 format va h.k.). CRM mijoz kartasida har format uchun alohida kelishilgan narx saqlasinmi?
**Nega kerak:** Yirik format va kichik format narxi har xil. Bitta "mijoz narxi" yetarli emas — har mahsulotga narx kerak.
**Variantlar:**
- A) Mijoz × mahsulot/format kesimida narx jadvali — aniq narx
- B) Bitta umumiy chegirma % — qo'pol
- C) Keyin

---

## BO'LIM 9 — Mijoz↔ishlab chiqarish reja zanjiri

### Q1027. Bitim → ishlab chiqarish rejasiga tushishi
**Nima:** Hujjat: "Ишлаб чиқариш бўлимидаги буюртмаларни режалаштириш ва станокларни иш билан таъминлаш". CRM yutilgan bitim avtomatik ishlab chiqarish rejasiga (qaysi stanok, qachon) tushsinmi?
**Nega kerak:** Bitim yopildi-yu reja bilmasa, stanok bo'sh qoladi yoki mijoz kutadi. Zavod maqsadi — "станокларни иш билан таъминлаш", CRM shuni oziqlantirishi kerak.
**Variantlar:**
- A) Yutilgan bitim → ishlab chiqarish reja navbatiga avtomatik (muddat bilan) — stanok bo'sh qolmaydi
- B) Qo'lda kiritiladi — uzilish, bo'sh stanok
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (rejalashtirish), MES

### Q1028. Mijozga real muddat (stanok yukiga qarab)
**Nima:** Menejer mijozga muddat aytganda, CRM ishlab chiqarish stanok yukiga qarab "real qachon tayyor bo'ladi"ni ko'rsatsinmi?
**Nega kerak:** Menejer "ertaga tayyor" deydi, lekin stanoklar band — mijoz aldanadi. Real muddat ko'rinsa, va'da to'g'ri bo'ladi.
**Variantlar:**
- A) Muddat taklifi stanok yukidan avtomatik hisoblanadi — real va'da
- B) Menejer o'zi taxmin qiladi — noaniq va'da, mijoz xafa
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (CRP/quvvat), MES

### Q1029. Stanok turlari bo'yicha mahsulot mosligi
**Nima:** Hujjatda aniq stanoklar bor (Flexo tigel, Flexo gofra liniya, Flexo pechat, SM 72, SM 52, Laminatsiya, Kashirovka). CRM mijoz mahsuloti qaysi stanokda ishlanishini bilib, shu stanok bandligiga qarab muddat bersinmi?
**Nega kerak:** Har mahsulot o'z stanogida ishlanadi. Mahsulot-stanok mosligi bo'lmasa — muddat va narx noto'g'ri.
**Variantlar:**
- A) Mahsulot → stanok marshrutiga bog'lanadi; muddat shu stanok navbatidan — aniq
- B) Stanok hisobga olinmaydi — taxminiy
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (marshrut), MES

---

## BO'LIM 10 — Menejer mas'uliyati va kuzatuvi

### Q1030. Savdo bo'limi rahbari vs menejer ko'rinishi
**Nima:** Hujjatda "Савдо бўлими рахбари" (boshliq) va "Савдо бўлими менежерлари" (menejerlar) alohida lavozim. CRMda boshliq barcha menejer mijozlarini, menejer faqat o'zinikini ko'rsinmi (org-strukturaga mos)?
**Nega kerak:** Zavod ierarxiyasi aniq — boshliq ustun. CRM ruxsatlari shu ierarxiyaga mos bo'lishi kerak.
**Variantlar:**
- A) Savdo rahbari = hamma; menejer = o'ziniki; karta-modelga bog'liq — ierarxiyaga mos
- B) Hamma hammasini ko'radi — ierarxiya yo'q
- C) Keyin
  - ⤳ Ta'sir: Org-struktura, Xavfsizlik

### Q1031. Menejer mijozni "egasizlantirmaslik" qoidasi
**Nima:** Menejer uzoq vaqt (masalan 30 kun) mijoz bilan ishlamasa, mijoz avtomatik "egasiz" bo'lib boshliqqa qaytsinmi (boshqaga berish uchun)?
**Nega kerak:** Menejer mijozni "ushlab" o'tirib, hech narsa qilmasa — mijoz sovuydi va boshqa menejerga ham o'tmaydi. Avtomatik qaytarish adolat.
**Variantlar:**
- A) N kun faolliksiz mijoz boshliq paneliga "qayta taqsimlash" uchun chiqadi — adolatli
- B) Mijoz menejerda abadiy qoladi — turg'unlik
- C) Keyin
  - ⤳ Ta'sir: Org-struktura, HR

### Q1032. Menejer kunlik hisoboti (necha kg sotdi)
**Nima:** Zavod kunlik "Olingan buyurtma kg" yuritadi (Oylik diog). CRM har menejer kuniga necha kg/qancha summaga buyurtma olganini avtomatik hisoblab, kunlik hisobot bersinmi?
**Nega kerak:** Boshliq har kuni "kim qancha keltirdi"ni ko'rishi kerak — bu zavodda allaqachon kuzatiladigan ko'rsatkich (kg).
**Variantlar:**
- A) Menejer kunlik kg + summa hisoboti avtomatik boshliqqa — shaffof natija
- B) Oyda bir marta qo'lda yig'iladi — kech
- C) Keyin
  - ⤳ Ta'sir: HR (KPI), Hisobotlar

### Q1033. Yangi menejer mentor davri (RD-4 tizimi)
**Nima:** Hujjatda yangi xodim mentor (мураббий) bilan o'qish + sinov davridan o'tadi (RD-4, 2 oy amaliy). CRM yangi savdo menejeri "sinov davrida"ligini belgilab, uning bitimlarini mentor/boshliq tasdig'idan o'tkazsinmi?
**Nega kerak:** Yangi menejer xato narx/va'da berishi mumkin. Sinov davrida nazorat — mijozni va daromadni himoya qiladi.
**Variantlar:**
- A) "Sinov davri" bayrog'i + bitim mentor tasdig'idan o'tadi (2 oy) — xato kamayadi
- B) Yangi menejer darrov mustaqil — xato xavfi
- C) Keyin
  - ⤳ Ta'sir: HR (adaptatsiya), LMS

---

## BO'LIM 11 — Maxfiylik va xizmat ma'lumoti himoyasi

### Q1034. "Xizmat ma'lumoti tashqariga chiqishi" oldini olish
**Nima:** Hujjat asosiy maqsadi: "хизмат маълумотларининг ташқарига чиқиш хавфи"ni kamaytirish. CRM mijoz bazasini (kontakt, narx, hajm) eksport/nusxa ko'chirishni cheklasinmi (menejer butun bazani yuklab ololmasin)?
**Nega kerak:** Menejer ketayotganda butun mijoz bazasini Excelga yuklab raqobatchiga olib ketishi mumkin. Eksport cheklovi — zavod ma'lumotini himoya qiladi.
**Variantlar:**
- A) Ommaviy eksport bloklangan; faqat boshliq ruxsati bilan; har eksport loglanadi — ma'lumot himoyasi
- B) Erkin eksport — sizish xavfi
- C) Keyin
  - ⤳ Ta'sir: Xavfsizlik

### Q1035. Mijoz kontaktini ko'rish chegarasi
**Nima:** Menejer o'z mijozining to'liq telefon/kontaktini ko'radi, lekin BOSHQA menejer mijozining kontaktini ko'ra olmasinmi (faqat nomi)?
**Nega kerak:** Maxfiylik (Q2 davomi): bir menejer boshqasining mijoz kontaktini olib aloqa qilmasin (ichki "o'g'irlik").
**Variantlar:**
- A) O'z mijozi — to'liq; o'zganiki — faqat nomi (kontakt yashirin) — himoya
- B) Hamma hamma kontaktni ko'radi — sizish
- C) Keyin

### Q1036. CRM harakatlari audit jurnali
**Nima:** Hujjatdagi "назорат" ruhi: CRMda kim qaysi mijozni ko'rdi/o'zgartirdi/eksport qildi — to'liq audit jurnali bo'lsinmi?
**Nega kerak:** Sizish bo'lsa, "kim qachon nima qildi"ni topish kerak. Inspeksiya bo'limi shu jurnaldan nazorat qiladi.
**Variantlar:**
- A) To'liq audit jurnali (ko'rish/o'zgartirish/eksport) + Inspeksiya bo'limiga ko'rinadi — javobgarlik
- B) Faqat o'zgartirish loglanadi — qisman
- C) Keyin
  - ⤳ Ta'sir: Xavfsizlik, Inspeksiya bo'limi

---

## BO'LIM 12 — Mijoz bilan moliyaviy munosabat (oldindan to'lov, valyuta)

### Q1037. Oldindan to'lov (avans) holati kartada
**Nima:** Karton zavodda ko'p buyurtma oldindan to'lov bilan boshlanadi. CRM mijoz bitimida "avans to'landimi, qancha"ni ko'rsatib, avanssiz ishlab chiqarishga o'tkazmasinmi?
**Nega kerak:** Avanssiz ishlab chiqarib, mijoz yuvib ketsa — material zarari. Avans nazorati — moliyaviy himoya.
**Variantlar:**
- A) Avans bayrog'i + foizi; belgilangan avanssiz ishlab chiqarishga o'tmaydi — himoya
- B) Avans qo'lda kuzatiladi — nazoratsiz
- C) Keyin
  - ⤳ Ta'sir: Finance, Ishlab chiqarish

### Q1038. Naqd / o'tkazma to'lov turi mijozda
**Nima:** Mijoz odatda naqd, bank o'tkazma yoki bartar (almashish) bilan to'laydimi — kartada saqlansinmi?
**Nega kerak:** To'lov turi narx va hujjatga ta'sir qiladi (naqd chegirma, o'tkazmaga QQS hisob-faktura). Oldindan bilinsa — chalkashlik yo'q.
**Variantlar:**
- A) Mijozning odatiy to'lov turi saqlanadi (naqd/o'tkazma/bartar) — to'g'ri hujjat
- B) Har gal so'raladi — vaqt
- C) Keyin
  - ⤳ Ta'sir: Finance (hisob-faktura)

### Q1039. Valyuta (USD bog'liq narx)
**Nima:** Qog'oz importga bog'liq (narx dollar bilan tebranadi). CRM mijoz narxini USD/so'm bog'lanishida saqlab, kurs o'zgarsa ogohlantirsinmi?
**Nega kerak:** Qog'oz dollarga bog'liq; so'm tushsa eski narxda sotish zarar. Kurs nazorati — daromad himoyasi.
**Variantlar:**
- A) Narx USD-bog'liq saqlanadi + kurs o'zgarsa qayta ko'rish signali — zarar oldi olinadi
- B) Faqat so'mda — kurs riski ko'rinmaydi
- C) Keyin
  - ⤳ Ta'sir: Finance, Ta'minot

---

## BO'LIM 13 — Reklamatsiya, brak va sifat aloqasi

### Q1040. Brak/qaytarish mijoz kartasida
**Nima:** Mijoz brak quti qaytarsa (o'lcham/bosma xato), bu CRM mijoz kartasida ko'rinsinmi va sababga (Q19/Q20 o'lcham nizosi) bog'lansinmi?
**Nega kerak:** Bir mijozda takror brak bo'lsa — tizimli muammo (o'lchov yoki bosma). Tarix bo'lmasa, sabab topilmaydi.
**Variantlar:**
- A) Brak/qaytarish kartada + sabab kodi (o'lcham/bosma/material) — ildiz sabab ko'rinadi
- B) Brak faqat Sifat modulida — savdo bilmaydi
- C) Keyin
  - ⤳ Ta'sir: Sifat nazorati

### Q1041. Reklamatsiya hal bo'lmaguncha yangi yuk
**Nima:** Mijozda hal qilinmagan reklamatsiya (kompensatsiya kelishilmagan) bo'lsa, CRM yangi buyurtmani ogohlantirish bilan ushlasinmi?
**Nega kerak:** Eski muammoni hal qilmay yangi yuk bersak — mijoz ham, biz ham chalkashamiz. Avval eski masalani yopish kerak.
**Variantlar:**
- A) Ochiq reklamatsiya bayrog'i + yangi bitimda boshliq ogohlantirishi — tartibli
- B) Yangi buyurtma erkin ochiladi — eski masala unutiladi
- C) Keyin
  - ⤳ Ta'sir: Sifat nazorati

### Q1042. Kompensatsiya/chegirma tarixi
**Nima:** Brak uchun mijozga berilgan kompensatsiya yoki chegirma kartada saqlanib, "bu mijozga qancha berib qo'yganmiz"ni ko'rsatsinmi?
**Nega kerak:** Ba'zi mijoz har gal "brak bo'ldi" deb chegirma so'raydi. Tarix bo'lsa — suiiste'mol ko'rinadi.
**Variantlar:**
- A) Kompensatsiya/chegirma tarixi + jami summa kartada — suiiste'mol ko'rinadi
- B) Saqlanmaydi — takroriy chegirma sezilmaydi
- C) Keyin

---

## BO'LIM 14 — Hisobot va boshqaruv (zavod amaliyotidan)

### Q1043. "Oylik diog" mijoz kesimida
**Nima:** Zavod "Oylik diog" jadvali yuritadi (Olingan/Tayyor/Chiqarilgan kg). CRM shu oylik diagrammani mijoz kesimida ham bersinmi (qaysi mijoz qancha kg oldi)?
**Nega kerak:** Zavod allaqachon oylik kg yuritadi; mijoz kesimi qo'shilsa — "kim asosiy, kim pasaygan" ko'rinadi.
**Variantlar:**
- A) Oylik kg mijoz kesimida + o'tgan oyga nisbatan o'zgarish — boshqaruv ko'rinishi
- B) Faqat umumiy kg — mijoz tahlili yo'q
- C) Keyin
  - ⤳ Ta'sir: Hisobotlar

### Q1044. "Yil boshidan chiqarilgan mahsulot soni" mijozga taqsim
**Nima:** Hujjatda "Йил бошидан бери чиқарилган маҳсулот сони 115000" ko'rsatkichi bor. CRM bu yillik hajmni mijozlar bo'yicha taqsimlab, "yillik top mijozlar"ni ko'rsatsinmi?
**Nega kerak:** 115000 mahsulot kimga ketgani — bu strategik ma'lumot. Top mijozlarni bilsak, ularga e'tibor beramiz.
**Variantlar:**
- A) Yillik hajm mijozlar kesimida (top ro'yxat) — strategik ko'rinish
- B) Faqat umumiy son — taqsimsiz
- C) Keyin

### Q1045. Buyurtma↔tayyor↔chiqarilgan zanjiri mijozda
**Nima:** Zavod 3 holatni kuzatadi: Olingan / Tayyor bo'lgan / Ombordan chiqarilgan (kg). CRM mijoz buyurtmasi shu 3 bosqichning qaysida ekanini real ko'rsatsinmi?
**Nega kerak:** Mijoz "buyurtmam qayerda" deb so'raydi. Menejer "olingan/tayyor/chiqarilgan" dan birini bir qarashda ko'rsa — aniq javob.
**Variantlar:**
- A) Buyurtma holati (olingan→tayyor→chiqarildi) real-vaqt kartada — aniq javob
- B) Menejer ishlab chiqarishdan qo'ng'iroq bilan so'raydi — sekin
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish, Ombor

---

## BO'LIM 15 — Chekka holatlar va kichik granular nuqtalar

### Q1046. Bir korxona — bir nechta brend/quti turi
**Nima:** Bitta mijoz (masalan Indorama) bir nechta turli mahsulot/brend qutisini buyuradi (gofra list, konteyner, 5-sloylik). CRM bularni bir mijoz ostida alohida "mahsulot liniyalari" qilib saqlasinmi?
**Nega kerak:** Bir mijoz = ko'p mahsulot. Hammasi aralash bo'lsa — qaysi mahsulot foydali, qaysi muammoli ko'rinmaydi.
**Variantlar:**
- A) Mijoz ostida alohida mahsulot liniyalari (har biriga narx/hajm/brak) — aniq tahlil
- B) Hammasi bitta ro'yxat — aralash
- C) Keyin

### Q1047. Mijoz almashtirilgan o'lcham/STP tarixi
**Nima:** Jadvalda "Қолиб янги STP", "Тигел қолиб" — buyurtma jarayonida o'lcham/jarayon o'zgarishi qayd qilinadi. CRM mijoz uchun "qaysi STP/format ishlatilgan"ni versiyalab saqlasinmi?
**Nega kerak:** Mijoz "o'tgan galgidek qil" desa, qaysi STP/format ishlatilganini aniq bilish kerak — aks holda boshqacha quti chiqadi.
**Variantlar:**
- A) Mijoz mahsuloti uchun STP/format versiya tarixi — qayta buyurtma aniq
- B) Faqat oxirgisi saqlanadi — eski versiya yo'qoladi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish, Dizayn

### Q1048. Mijoz "yaqin qarindosh" aloqasi (НО-2 dagi nuance)
**Nima:** Hujjatda korporativ raqam abonentlari orasida "Яқин қариндошлар" ham bor — ya'ni shaxsiy va xizmat aloqasi bir raqamda aralashishi mumkin. CRM korporativ raqamda shaxsiy va mijoz aloqasini ajratib, faqat mijoz aloqalarini tahlilga olsinmi?
**Nega kerak:** Inspeksiya bo'limi qo'ng'iroqlarni nazorat qilganda, shaxsiy qarindosh qo'ng'irog'ini ish qo'ng'irog'i bilan aralashtirmasligi kerak (maxfiylik + to'g'ri statistika).
**Variantlar:**
- A) Aloqa "mijoz" yoki "shaxsiy" deb teglanadi; statistikaga faqat mijoz aloqasi kiradi — to'g'ri va maxfiy
- B) Hammasi aralash hisoblanadi — statistika buziladi
- C) Keyin
  - ⤳ Ta'sir: Inspeksiya bo'limi, Maxfiylik

### Q1049. Mijoz toifasi: import-bog'liq vs mahalliy
**Nima:** Ba'zi mijozlar import xom-ashyoga (Indorama — import paxta/yarn) bog'liq, ba'zilari mahalliy. CRM mijozni import-bog'liqligiga qarab toifalab, import to'xtasa ta'sirlanadigan mijozlarni ko'rsatsinmi?
**Nega kerak:** Import xom-ashyo (qog'oz) kechiksa, qaysi mijoz buyurtmasi to'xtaydi — oldindan bilish kerak.
**Variantlar:**
- A) Mijoz import-bog'liqlik toifasi + import muammosida ta'sirlangan mijoz ro'yxati — proaktiv
- B) Toifalanmaydi — import muammosi kutilmaganda uradi
- C) Keyin
  - ⤳ Ta'sir: Ta'minot, Ishlab chiqarish

### Q1050. Mijoz ombor kirish cheklovi (yetkazish nuancesi)
**Nima:** Ba'zi yirik mijozlar (oziq-ovqat/farma korxona) ombor kirish vaqti, sanitariya talabi, propusk qo'yadi. CRM mijoz yetkazish nuqtasiga shu talablarni (kirish vaqti, hujjat, sanitariya) saqlasinmi?
**Nega kerak:** Haydovchi mijoz omboriga borib, "vaqt o'tdi" yoki "hujjat yo'q" deb qaytsa — qayta qatnov, kechikish. Talab oldindan bilinsa — bir martada yetkaziladi.
**Variantlar:**
- A) Yetkazish nuqtasiga kirish talablari (vaqt/hujjat/sanitariya) saqlanadi — bir martada yetkazish
- B) Saqlanmaydi — qaytib kelish xavfi
- C) Keyin
  - ⤳ Ta'sir: Logistika

### Q1051. Mijoz bilan kelishilgan o'rash/qadoqlash usuli
**Nima:** Hujjatda "Упаковка Степлер", "Склейка ручная", "Окошка" kabi yig'ish/o'rash usullari bor. Mijoz o'z qutisini qanday yig'ilgan/o'rangan holda olishini (stepler/yelim/oyna) kartada saqlasinmi?
**Nega kerak:** Mijoz "stepler bilan" yoki "yelimlangan" deb talab qiladi. Saqlanmasa — noto'g'ri yig'ilib, qaytariladi.
**Variantlar:**
- A) Mijoz mahsulotiga yig'ish/o'rash usuli biriktiriladi (stepler/yelim/qo'lda/oyna) — to'g'ri tayyorlash
- B) Har gal so'raladi — xato xavfi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (yig'ish), Ombor

### Q1052. "Akademiyaga" / namuna ishlab chiqarish belgisi
**Nima:** Hujjatda "Академияга" (ichki o'quv/namuna) belgisi bor — ba'zi mahsulot sotuv emas, namuna/sinov uchun ishlanadi. CRM namuna buyurtmani sotuvdan ajratib, alohida belgilasinmi (daromadga kiritmasin)?
**Nega kerak:** Namuna/sinov buyurtmasi pul keltirmaydi, lekin material sarflaydi. Sotuv bilan aralashsa — daromad va xarajat statistikasi buziladi.
**Variantlar:**
- A) "Namuna/sinov" turi sotuvdan ajratiladi (daromadga kirmaydi, lekin material hisobiga kiradi) — toza statistika
- B) Hammasi sotuv deb hisoblanadi — raqam buziladi
- C) Keyin
  - ⤳ Ta'sir: Finance, Ishlab chiqarish (namuna xarajati)

### Q1053. Mijoz uchun mas'ul operator/usta tarixi
**Nima:** Hujjatda har stanokda aniq operator bor (Yuldasheva Z, Xolmatov M, Shomansurov A). Yirik mijoz mahsuloti ko'pincha bir usta tomonidan sifatli ishlanadi. CRM "bu mijoz mahsulotini falon usta yaxshi qiladi"ni saqlasinmi?
**Nega kerak:** Murakkab/nozik mijoz mahsulotini tajribali usta qilsa — brak kam. Tarix bo'lsa, rejada shu ustaga yo'naltiriladi.
**Variantlar:**
- A) Mijoz mahsuloti ↔ tajribali operator bog'lanadi (rejada ustuvor) — sifat barqaror
- B) Bog'lanmaydi — har gal boshqa usta, sifat tebranadi
- C) Keyin
  - ⤳ Ta'sir: Ishlab chiqarish (rejalashtirish), Sifat

---

DONE: CRM — 55.

## 14. Marketing

### Q1054. Marketing kanallari ro'yxati (qaysi kanallarni kuzatamiz)
**Nima:** ERP da qaysi marketing kanallarini alohida hisobga olishni belgilash (masalan, Instagram, Telegram, ko'rgazma, sovuq qo'ng'iroq, tavsiya, veb-sayt).
**Nega kerak:** Karton zavod mijozlari turli yo'l bilan keladi — har birining narxi va samarasi har xil. Kanalni ajratmasak, qaysi pul ishlayotganini bilmaymiz.
**Variantlar:**
- A) Tayyor 8 ta kanal ro'yxati (Instagram, Telegram, Facebook, veb-sayt, ko'rgazma, sovuq qo'ng'iroq, tavsiya/og'izdan-og'iz, vositachi-diler) + "boshqa" — to'liq qamrov, lekin boshida ko'p ko'rinadi
- B) Faqat 4 ta asosiy (ijtimoiy tarmoq, ko'rgazma, qo'ng'iroq, tavsiya) — sodda, lekin keyin bo'lib tashlash kerak
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (lid manbasi), Hisobotlar (kanal bo'yicha ROI), Sotuv (mijoz qayerdan keldi)

### Q1055. Kanal ierarxiyasi (kanal va uning ichidagi manba)
**Nima:** Bir kanal ichida kichik manbalarni ajratish kerakmi (masalan, Instagram -> reklama posti / story / direct / bio-link).
**Nega kerak:** "Instagram ishladi" yetarli emas — qaysi post yoki qaysi reklama ishlaganini bilish byudjetni to'g'ri taqsimlaydi.
**Variantlar:**
- A) Ikki bosqich: kanal + sub-manba (UTM/kampaniya tegi) — aniq, lekin kiritishda intizom talab qiladi
- B) Faqat bitta daraja (kanal) — oson, lekin yuzaki
- C) Keyin — hozir kerak emas

### Q1056. Kanal byudjeti (oylik/choraklik reja)
**Nima:** Har bir kanalga oldindan pul ajratish va shu byudjetni ERP da saqlash (masalan, Instagram reklamasiga oyiga 5 mln so'm).
**Nega kerak:** Byudjet bo'lmasa marketing xarajati nazoratsiz oqadi; reja bilan haqiqatni solishtirib bo'lmaydi.
**Variantlar:**
- A) Kanal x oy bo'yicha byudjet jadvali (reja summa, sarflangan, qoldiq) — to'liq nazorat
- B) Faqat umumiy oylik marketing byudjeti, kanalga bo'linmaydi — sodda, lekin tahlil zaif
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya/Byudjet (marketing xarajat moddasi), Hisobot (reja vs fakt)
  - ↳ Agar A: Byudjetdan oshib ketganda kim tasdiqlaydi — variantlar: (a) marketing rahbari avtomatik ogohlantirish, (b) direktor tasdig'isiz to'xtatish, (c) faqat oy oxirida hisobotda ko'rsatish

### Q1057. Byudjet valyutasi va reklama xarajati turlari
**Nima:** Marketing xarajatining qaysi turlarini kuzatamiz (reklama puli, blogger to'lovi, bosma materiallar, ko'rgazma stendi, sovg'a/namuna).
**Nega kerak:** Karton zavodda namuna qutilar va ko'rgazma stendi katta xarajat — ularni "reklama" ichida yashirsak ROI noto'g'ri chiqadi.
**Variantlar:**
- A) 6 xarajat turi (onlayn reklama, blogger/influencer, bosma material, ko'rgazma, namuna mahsulot, transport/yetkazib berish) — aniq taqsim
- B) 2 tur (onlayn / oflayn) — sodda
- C) Keyin — hozir kerak emas

### Q1058. Kanal egasi (mas'ul xodim)
**Nima:** Har bir kanalga mas'ul marketing xodimini biriktirish.
**Nega kerak:** Kanal natijasi yomon bo'lsa, kim javobgar ekanini bilish kerak; KPI ham shunga bog'lanadi.
**Variantlar:**
- A) Har kanalga bitta mas'ul + zaxira xodim — javobgarlik aniq
- B) Butun marketing bitta odamda, kanal egasi yo'q — kichik jamoa uchun yetarli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/KPI (marketing xodim baholash), Org-struktura

### Q1059. Kampaniya asosiy maydonlari
**Nima:** Bitta marketing kampaniyasini ochishda qaysi maydonlar to'ldiriladi (nomi, kanal, boshlanish/tugash sanasi, byudjet, maqsad, mas'ul).
**Nega kerak:** Standart maydonlar bo'lmasa har kim har xil yozadi, keyin solishtirib bo'lmaydi.
**Variantlar:**
- A) To'liq to'plam: nomi, maqsad turi, kanal(lar), byudjet, boshlanish-tugash sana, mas'ul, maqsadli mijoz turi, kutilgan lid soni — to'liq, lekin oyna uzun
- B) Minimal: nomi, kanal, byudjet, sana — tez, lekin tahlil cheklangan
- C) Keyin — hozir kerak emas

### Q1060. Kampaniya maqsad turi
**Nima:** Kampaniyaning maqsadini turkumlash (yangi lid yig'ish, brend tanitish, mavjud mijozni qaytarish, yangi mahsulot e'loni, ko'rgazmaga taklif).
**Nega kerak:** Maqsadga qarab muvaffaqiyat o'lchovi farq qiladi — lid yig'ishda lid soni, brendda qamrov muhim.
**Variantlar:**
- A) 5 maqsad turi tanlovi + har biriga o'z asosiy ko'rsatkichi — aniq baholash
- B) Bitta umumiy maqsad maydoni (matn) — erkin, lekin tahlil qilib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q1061. Kampaniya holati (status) qiymatlari
**Nima:** Kampaniya qaysi bosqichlardan o'tishini belgilash (reja, tasdiqlangan, faol, to'xtatilgan, tugadi, bekor qilindi).
**Nega kerak:** Holat bo'lmasa qaysi kampaniya hozir ishlayotganini va qancha pul faol oqayotganini bilib bo'lmaydi.
**Variantlar:**
- A) 6 holat: Reja -> Tasdiqlangan -> Faol -> To'xtatilgan -> Tugadi -> Bekor — to'liq hayot tsikli
- B) 3 holat: Reja / Faol / Tugadi — sodda
- C) Keyin — hozir kerak emas

### Q1062. Kampaniya maqsadli auditoriya (karton zavodga xos)
**Nima:** Kampaniya kimga qaratilganini belgilash (oziq-ovqat ishlab chiqaruvchi, meva-sabzavot eksportchi, qandolat, farmatsevtika, elektronika, savdo do'koni).
**Nega kerak:** Karton qutining turi mijoz tarmog'iga bog'liq — meva qutisi va qandolat qutisi butunlay boshqa. Kampaniya to'g'ri tarmoqqa borishi kerak.
**Variantlar:**
- A) Tayyor tarmoq ro'yxatidan tanlash (8-10 tarmoq) + ko'p tanlov — segmentlash aniq
- B) Erkin matn — tez, lekin filtrlash mumkin emas
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (mijoz segmenti), Sotuv (mahsulot mosligini taklif)

### Q1063. Kampaniya geografiyasi
**Nima:** Kampaniya qaysi hududga qaratilganini saqlash (Qo'qon, Farg'ona vodiysi, Toshkent, butun O'zbekiston, eksport).
**Nega kerak:** Yetkazib berish narxi hududga bog'liq; uzoq mijoz arzon qutiga foyda bermasligi mumkin — kampaniyani tushunarli hududga qaratish kerak.
**Variantlar:**
- A) Hudud tanlovi (viloyat/shahar darajasida) + eksport bayrog'i — yetkazish hisobi bilan bog'lanadi
- B) Hudud kuzatilmaydi — sodda, lekin logistika ko'r
- C) Keyin — hozir kerak emas

### Q1064. Kampaniya natija o'lchovlari (kutilgan vs haqiqiy)
**Nima:** Kampaniyaga reja ko'rsatkichlarini kiritish (kutilgan lid, kutilgan sotuv summasi) va keyin haqiqiy natijani yozish.
**Nega kerak:** Reja-fakt solishtiruvi bo'lmasa kampaniya muvaffaqiyatli ekanini hech qachon ayta olmaymiz.
**Variantlar:**
- A) Reja va fakt yonma-yon (lid, sotuv, ROI) avtomatik to'ldiriladigan — kuchli tahlil
- B) Faqat fakt yoziladi, reja yo'q — yarim tahlil
- C) Keyin — hozir kerak emas

### Q1065. Kampaniya promo-kod / chegirma bog'lanishi
**Nima:** Kampaniyaga maxsus promo-kod yoki chegirma biriktirish (masalan "EXPO2026" kodi bilan kelganga 5% chegirma).
**Nega kerak:** Karton zavodda yangi mijozni jalb qilish uchun chegirma muhim, lekin kim qaysi kod bilan kelganini bilmasak chegirma samarasini o'lchay olmaymiz.
**Variantlar:**
- A) Kampaniyaga promo-kod biriktiriladi, sotuvda shu kod kuzatiladi — aniq bog'lanish
- B) Chegirma alohida boshqariladi, kampaniyaga bog'lanmaydi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (chegirma qo'llash), Moliya (chegirma xarajati)

### Q1066. Lid sifati darajalari (issiq/iliq/sovuq)
**Nima:** Har bir lidni sifat darajasiga ajratish (issiq = darhol sotib oladi, iliq = qiziqyapti, sovuq = kelajakda).
**Nega kerak:** Marketing 100 ta lid keltirsa-yu, 95 tasi befoyda bo'lsa — son emas, sifat muhim. Sotuvchilar issiqlarga vaqt ajratishi kerak.
**Variantlar:**
- A) 3 daraja (issiq/iliq/sovuq) + avtomatik ball asosida belgilash — sotuvga aniq yo'nalish
- B) Faqat qo'lda belgi (sotuvchi o'zi qo'yadi) — moslashuvchan, lekin sub'ektiv
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM/Sotuv (lid navbati), Hisobot (sifatli lid ulushi)

### Q1067. Lid sifat ballari (qanday hisoblanadi)
**Nima:** Lid sifatini avtomatik ball bilan baholash mezonlari (byudjeti bormi, qancha qutisi kerak, qachongacha kerak, qayta mijozmi).
**Nega kerak:** "Issiq" so'zi sub'ektiv — aniq mezonlar bilan ball qo'yilsa, hamma bir xil tushunadi va adolatli bo'ladi.
**Variantlar:**
- A) 5 mezon bo'yicha ball (buyurtma hajmi, shoshilinchlik, byudjet aniqligi, mahsulot mosligi, qayta mijoz) -> umumiy ball -> daraja — ob'ektiv
- B) Faqat buyurtma hajmiga qarab ball — sodda, lekin yuzaki
- C) Keyin — hozir kerak emas
  - ↳ Agar A: Har mezonning vazni (foizi) qanday — variantlar: (a) buyurtma hajmi eng og'ir 40%, (b) hamma teng 20%, (c) keyin sozlaymiz

### Q1068. Lid minimal majburiy maydonlari
**Nima:** Lid kiritishda nima majburiy bo'lishi (ism/firma nomi, telefon, kerakli mahsulot turi, manba kanali).
**Nega kerak:** Telefonsiz yoki manbasi noma'lum lid — chala lid; keyin bog'lanib ham, hisoblab ham bo'lmaydi.
**Variantlar:**
- A) Majburiy: telefon + manba kanali + mahsulot qiziqishi; ixtiyoriy qolgani — sifatli ma'lumot
- B) Faqat telefon majburiy — tez kiritiladi, lekin to'liq emas
- C) Keyin — hozir kerak emas

### Q1069. Takroriy (dublikat) lid nazorati
**Nima:** Bir xil telefon/firma ikki marta lid bo'lib kelganda tizim ogohlantirsinmi yoki birlashtirsinmi.
**Nega kerak:** Bir mijoz uch kanaldan murojaat qilsa, uch sotuvchi unga qo'ng'iroq qiladi — bu mijozni bezdiradi va statistikani buzadi.
**Variantlar:**
- A) Telefon bo'yicha avtomatik dublikat aniqlash + ogohlantirish, birlashtirish taklifi — toza baza
- B) Dublikatga ruxsat, faqat hisobotda ko'rsatiladi — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (mijoz kartasi yagonaligi)

### Q1070. Lidni sotuvchiga taqsimlash qoidasi
**Nima:** Yangi lid kelganda u qaysi sotuvchiga avtomatik biriktiriladi (navbat bilan, hudud bo'yicha, mahsulot bo'yicha, eng kam yuklangan).
**Nega kerak:** Lid ochiq qolib ketmasligi va adolatli taqsimlanishi uchun aniq qoida kerak; aks holda yaxshi lidlarni hamma o'ziga oladi.
**Variantlar:**
- A) Mahsulot turi + hudud bo'yicha avtomatik, bo'lmasa navbat bilan — adolatli va mantiqiy
- B) Marketing rahbari qo'lda taqsimlaydi — nazorat bor, lekin sekin
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM/Sotuv (lid egasi), HR/KPI (sotuvchi yuklamasi)

### Q1071. Lid eskirishi (qancha vaqt javobsiz qolsa)
**Nima:** Lidga belgilangan vaqt ichida javob berilmasa nima bo'ladi (avtomatik boshqaga o'tadi, rahbarga signal, "yo'qolgan lid" deb belgilanadi).
**Nega kerak:** Karton zavodda issiq lid 1-2 kun ichida raqobatchiga ketishi mumkin — sustlik pul yo'qotishdir.
**Variantlar:**
- A) Belgilangan soat ichida (masalan 4 soat) javobsiz lid rahbarga signal + 24 soatdan keyin boshqa sotuvchiga — tezlikni majbur qiladi
- B) Faqat hisobotda "kech javob" ko'rsatiladi — yumshoq
- C) Keyin — hozir kerak emas

### Q1072. Lid bosqichlari (lid -> mijoz yo'li)
**Nima:** Lid qanday bosqichlardan o'tib mijozga aylanishini belgilash (yangi -> bog'landik -> namuna so'radi -> taklif yubordik -> kelishuv -> mijoz / yo'qotildi).
**Nega kerak:** Voronka bosqichlari bo'lmasa, lidlar qayerda "tiqilib" qolayotganini bilmaymiz (masalan ko'pi taklif bosqichida yo'qolsa, narx muammosi bor).
**Variantlar:**
- A) 6-7 bosqichli voronka (karton zavodga moslangan: namuna qutisi bosqichi bilan) — aniq tahlil
- B) 3 bosqich (yangi / muloqotda / yopildi) — sodda
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (deal pipeline), Ishlab chiqarish (namuna qutisi buyurtmasi)

### Q1073. Lid yo'qotish sabablari
**Nima:** Lid mijozga aylanmasa, sababini ro'yxatdan tanlash (narx baland, raqobatchiga ketdi, miqdor kam, sifat talabiga mos emas, javob bermadi).
**Nega kerak:** Yo'qotish sababini bilsak, marketing va sotuvni tuzatamiz — masalan "narx baland" ko'p bo'lsa, narx siyosatini ko'rib chiqamiz.
**Variantlar:**
- A) Tayyor sabablar ro'yxati (7-8 sabab) + izoh — tizimli tahlil
- B) Erkin matn izoh — moslashuvchan, lekin guruhlab bo'lmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (narx siyosati), Hisobot (yo'qotish tahlili)

### Q1074. ROI hisoblash formulasi
**Nima:** Kampaniya ROI sini qanday hisoblash (toza foyda / marketing xarajat, yoki sotuv summasi / xarajat).
**Nega kerak:** Hamma "ROI" deydi, lekin formulani aniqlamasa har kim har xil hisoblaydi — natijada raqamlar yolg'on chiqadi.
**Variantlar:**
- A) ROI = (kampaniyadan kelgan sotuv foydasi - marketing xarajat) / marketing xarajat — to'g'ri foyda asosli
- B) Soddalashtirilgan: kampaniyadan kelgan jami sotuv / xarajat — oson, lekin foydani ko'rmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Moliya (foyda marjasi), Hisobot (kampaniya samarasi)
  - ↳ Agar A: Foyda marjasini qayerdan olamiz — variantlar: (a) mahsulot tannarxidan avtomatik, (b) qo'lda o'rtacha marja kiritamiz, (c) keyin

### Q1075. Lid narxi (CPL — bitta lid qancha turadi)
**Nima:** Har bir kanal/kampaniya uchun bitta lid qancha pulga tushganini hisoblash (xarajat / lidlar soni).
**Nega kerak:** Bir kanal lidga 10 ming so'm, boshqasi 200 ming so'm sarflasa — qayerga pul quyishni shu raqam aytadi.
**Variantlar:**
- A) Kanal va kampaniya kesimida avtomatik CPL hisobi — byudjet qaroriga aniq asos
- B) Faqat umumiy CPL (butun marketing) — yuzaki
- C) Keyin — hozir kerak emas

### Q1076. Mijoz jalb narxi (CAC — bitta mijoz qancha turadi)
**Nima:** Bitta yangi mijozni olib kelish qancha marketing puliga tushganini hisoblash.
**Nega kerak:** Lid arzon bo'lishi mumkin, lekin ulardan kam qismi mijoz bo'lsa — mijoz qimmatga tushadi. Haqiqiy samara shu yerda ko'rinadi.
**Variantlar:**
- A) CAC = davr marketing xarajati / yangi mijozlar soni, kanal kesimida — to'g'ri samara o'lchovi
- B) Faqat umumiy CAC — sodda
- C) Keyin — hozir kerak emas

### Q1077. Mijoz umrbod qiymati (LTV) va ROI ufqi
**Nima:** Bir mijoz birinchi buyurtmadagina emas, yillar davomida qancha sotuv keltirishini hisobga olib ROI ni baholash.
**Nega kerak:** Karton zavodda mijoz ko'pincha takroriy buyurtma beradi — birinchi sotuvda zarar ko'rinsa ham, yil davomida foydali bo'lishi mumkin. Faqat birinchi buyurtmaga qarasak xato qaror chiqaramiz.
**Variantlar:**
- A) Mijoz 12 oylik takroriy sotuvini hisobga olgan ROI (LTV/CAC nisbati) — strategik to'g'ri
- B) Faqat birinchi buyurtma bo'yicha ROI — sodda, lekin qisqa ko'rinishli
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (takroriy sotuv tarixi), Moliya

### Q1078. ROI bog'lanish davri (atribusiya oynasi)
**Nima:** Lid kelganidan keyin necha kun ichidagi sotuv shu kampaniyaga "tegishli" deb hisoblanadi (30 kun, 90 kun, cheksiz).
**Nega kerak:** Karton qutining sotuv tsikli uzun — lid 2 oydan keyin sotib olishi mumkin. Oyna juda qisqa bo'lsa kampaniya samarasi past ko'rinadi.
**Variantlar:**
- A) 90 kunlik atribusiya oynasi (B2B sekin tsiklga mos) — adolatli hisob
- B) 30 kun — qat'iy, lekin sekin mijozni o'tkazib yuboradi
- C) Keyin — hozir kerak emas

### Q1079. Ko'p kanal atribusiyasi (kim hisobga olinadi)
**Nima:** Mijoz uch kanaldan kelib oxiri ko'rgazmada sotib olsa, sotuv qaysi kanalga yoziladi (birinchi teginish, oxirgi teginish, bo'lib beriladi).
**Nega kerak:** Bitta sotuvni faqat oxirgi kanalga yozsak, dastlabki kanallar (qiziqish uyg'otgan reklama) noto'g'ri "befoyda" ko'rinadi.
**Variantlar:**
- A) Oxirgi teginish asosiy + birinchi teginish ham qayd etiladi (ikkalasi ko'rinadi) — muvozanatli
- B) Faqat oxirgi teginishga yoziladi — sodda, lekin bir tomonlama
- C) Keyin — hozir kerak emas

### Q1080. Ko'rgazma (vystavka) ro'yxatga olish
**Nima:** Zavod qatnashadigan ko'rgazmalarni ERP da ro'yxatga olish (nomi, sana, joy, qatnashish xarajati, mas'ul).
**Nega kerak:** Ko'rgazma — karton zavod uchun eng kuchli lid manbasi, lekin qimmat. Xarajat va natijani yozmasak, kelgusi yil qatnashish-qatnashmaslikni bilmaymiz.
**Variantlar:**
- A) Ko'rgazma kartochkasi (xarajat, sana, joy, stend o'lchami, mas'ul, kutilgan lid) — to'liq hisob
- B) Ko'rgazma oddiy kampaniya sifatida — sodda, lekin maxsus maydonlarsiz
- C) Keyin — hozir kerak emas

### Q1081. Ko'rgazmada lid yig'ish usuli
**Nima:** Ko'rgazmada tashrif buyurganlarning ma'lumotini qanday olamiz (vizitka skani, telefonga forma, qog'oz ro'yxat, QR-kod).
**Nega kerak:** Ko'rgazmada 200 ta odam keladi, lekin qog'ozdagi yozuvlar yo'qoladi — tezkor va ishonchli yig'ish usuli kerak.
**Variantlar:**
- A) Telefondagi tezkor forma (ism, telefon, qiziqish) bir necha soniyada — joyida lid bazaga tushadi
- B) Qog'oz ro'yxat, keyin qo'lda kiritish — oddiy, lekin sekin va xatoga moyil
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (lid bazaga avtomatik), Mobil ilova

### Q1082. Ko'rgazma lidini sotuvga ulash va kuzatish
**Nima:** Ko'rgazmadan kelgan har bir lid keyinchalik sotuvga aylandimi — buni alohida belgilab kuzatish.
**Nega kerak:** Ko'rgazma 5 mln so'm tursin, lekin 3 ta yirik mijoz bersa — foydali. Bu bog'lanishni kuzatmasak qaror asossiz bo'ladi.
**Variantlar:**
- A) Har lid ko'rgazma teg'iga bog'lanadi, sotuvgacha kuzatiladi (ko'rgazma ROI avtomatik) — aniq qaytim
- B) Faqat lidlar soni sanaladi, sotuvga bog'lanmaydi — yuzaki
- C) Keyin — hozir kerak emas

### Q1083. Ko'rgazma keyingi ish (follow-up) jadvali
**Nima:** Ko'rgazmadan keyin lidlarga necha kun ichida bog'lanish kerakligini majburlash (masalan 48 soat ichida).
**Nega kerak:** Ko'rgazmadan keyin lid "issiq" bo'ladi, lekin bir hafta o'tib qo'ng'iroq qilsak — qiziqish so'nadi, raqobatchi ulgurib qoladi.
**Variantlar:**
- A) Ko'rgazma tugagach avtomatik vazifalar yaratiladi (48 soat ichida bog'lanish) + bajarilishini kuzatish — tezlikni kafolatlaydi
- B) Sotuvchilar o'zi eslab bog'lanadi — moslashuvchan, lekin ishonchsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (vazifalar), HR/KPI

### Q1084. Ko'rgazma natija hisobotini taqqoslash
**Nima:** Har ko'rgazmadan keyin "xarajat / lid / sotuv / ROI" hisobotini saqlash va o'tgan ko'rgazmalar bilan solishtirish.
**Nega kerak:** Qaysi ko'rgazma har yili foyda beradi, qaysi biri pulni yeydi — buni faqat tarixiy solishtiruv ko'rsatadi.
**Variantlar:**
- A) Ko'rgazmalar bo'yicha tarixiy taqqoslash jadvali (yillar kesimida) — strategik qaror
- B) Har ko'rgazma alohida, taqqoslash yo'q — yuzaki
- C) Keyin — hozir kerak emas

### Q1085. Ijtimoiy inbox (yagona xabarlar oynasi)
**Nima:** Instagram, Telegram, Facebook va veb-saytdan kelgan barcha xabarlarni bitta oynada yig'ish.
**Nega kerak:** Marketingchi 4 ta ilovani aylanib yurmasligi va biror xabar e'tibordan chetda qolmasligi kerak — yo'qolgan xabar yo'qolgan mijozdir.
**Variantlar:**
- A) Barcha kanal xabarlari bitta inboxda (kim javob berdi, holati ko'rinadi) — hech narsa yo'qolmaydi
- B) Faqat Telegram bot integratsiyasi (eng asosiy kanal) — kichik boshlanish
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (suhbatdan lid yaratish), AI integratsiya (avto-javob)

### Q1086. Inbox xabariga javob vaqti (SLA)
**Nima:** Kelgan xabarga necha daqiqa/soat ichida javob berish standartini belgilash.
**Nega kerak:** Mijoz Instagram da yozsa 10 daqiqada javob kutadi; bir kunda javob bersak boshqasini topadi. Standart bo'lmasa nazorat yo'q.
**Variantlar:**
- A) Ish vaqtida 15 daqiqa, tashqarisida ertasi ertalab SLA + kechikkanlar signal beradi — tezkor xizmat
- B) SLA yo'q, imkon boricha javob — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q1087. Inbox xabaridan lid yaratish
**Nima:** Inboxdagi suhbatni bir tugma bilan rasmiy lidga aylantirish (telefon, qiziqish avtomatik ko'chadi).
**Nega kerak:** Qiziqqan odam yozgan bo'lsa-yu, lid yaratilmasa — u suhbat ichida unutiladi va hech qachon sotuvga aylanmaydi.
**Variantlar:**
- A) Suhbatdan "Lid yarat" tugmasi (manba avtomatik shu kanal) — uzilishsiz o'tish
- B) Qo'lda alohida lid kiritiladi — ishlaydi, lekin qo'shimcha mehnat
- C) Keyin — hozir kerak emas

### Q1088. Inbox javob shablonlari va tezkor javoblar
**Nima:** Tez-tez beriladigan savollarga (narx, eng kam buyurtma, yetkazib berish muddati) tayyor javob shablonlari.
**Nega kerak:** Marketingchi har safar bir xil javobni yozmasligi va hamma bir xil, to'g'ri ma'lumot berishi kerak.
**Variantlar:**
- A) Shablonlar kutubxonasi (narx so'rovi, namuna, muddat, minimal partiya) — tez va bir xil
- B) Shablonsiz, har safar qo'lda yoziladi — moslashuvchan, lekin sekin
- C) Keyin — hozir kerak emas

### Q1089. Inbox mas'ul va kanal egasi tayinlash
**Nima:** Inboxda har kanal/suhbatga mas'ul xodimni biriktirish, "men javob beraman" belgisi.
**Nega kerak:** Ikki xodim bitta mijozga javob bermasligi yoki hech kim javob bermasligini oldini olish kerak.
**Variantlar:**
- A) Suhbat ochilganda biriktiriladi yoki avtomatik navbat bilan + "javob berilmoqda" belgisi — chalkashliksiz
- B) Ochiq inbox, kim ulgursa shu javob beradi — tez, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q1090. Inbox spam/ahamiyatsiz xabar filtri
**Nima:** Reklama, spam, ish bilan bog'liq bo'lmagan xabarlarni ajratib qo'yish.
**Nega kerak:** Spam orasida haqiqiy lid yo'qolmasligi va statistikani buzmasligi kerak.
**Variantlar:**
- A) Spam belgisi + alohida papka, statistikadan chiqariladi — toza ko'rinish
- B) Hammasi bitta oqimda — sodda, lekin shovqinli
- C) Keyin — hozir kerak emas

### Q1091. Kontent kalendar asoslari
**Nima:** Ijtimoiy tarmoq postlarini oldindan rejalashtirish taqvimi (sana, kanal, mavzu, holat).
**Nega kerak:** Karton zavod brendi muntazam ko'rinib turishi kerak; reja bo'lmasa postlar tartibsiz va oxirgi daqiqada shoshib chiqadi.
**Variantlar:**
- A) Taqvim ko'rinishi (oy/hafta) + post kartochkalari — tartibli reja
- B) Oddiy ro'yxat (jadval) — sodda, lekin ko'rgazmali emas
- C) Keyin — hozir kerak emas

### Q1092. Kontent posti maydonlari
**Nima:** Bitta post rejasida nima saqlanadi (sana, kanal, mavzu/sarlavha, matn, rasm/video, mas'ul, holat).
**Nega kerak:** Standart maydonlar bo'lsa har bir post tayyor-tayyormasligini bir qarashda bilamiz.
**Variantlar:**
- A) To'liq: sana, kanal(lar), sarlavha, matn, media, mas'ul, holat, bog'liq kampaniya — to'liq nazorat
- B) Minimal: sana, mavzu, holat — tez
- C) Keyin — hozir kerak emas

### Q1093. Kontent holati va tasdiqlash oqimi
**Nima:** Post qaysi bosqichlardan o'tishi (g'oya -> matn tayyor -> dizayn tayyor -> tasdiqlangan -> joylandi).
**Nega kerak:** Tasdiqsiz post chiqib ketib brendga zarar bermasligi va dizayner/matn yozuvchi vazifasi aniq bo'lishi uchun.
**Variantlar:**
- A) 5 bosqichli oqim + rahbar tasdig'idan keyin joylash — sifat nazorati
- B) 2 holat (tayyor/joylandi) — sodda, lekin tasdiqsiz
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Dizayn moduli (post dizayni vazifasi)

### Q1094. Kontent rukni (kontent turlari rejasi)
**Nima:** Post turlarini turkumlash (mahsulot ko'rsatish, mijoz tavsiyasi, ishlab chiqarish jarayoni "zakulis", aksiya, foydali maslahat).
**Nega kerak:** Faqat reklama posti odamni zeriktiradi; turlarni aralashtirib reja qilsak auditoriya jonli qoladi.
**Variantlar:**
- A) 5-6 kontent turi + har haftaga muvozanat (masalan kamida 1 ta foydali maslahat) — sog'lom aralash
- B) Tur ajratilmaydi, erkin — moslashuvchan, lekin bir xil bo'lib qolishi mumkin
- C) Keyin — hozir kerak emas

### Q1095. Kontent posti natija ko'rsatkichlari
**Nima:** Joylangan postning natijasini saqlash (qamrov, layk, izoh, saqlash, undan kelgan lid).
**Nega kerak:** Qaysi kontent turi lid keltiradi, qaysi biri faqat layk yig'adi — buni bilsak rejani shunga moslaymiz.
**Variantlar:**
- A) Asosiy ko'rsatkichlar + "shu postdan kelgan lid" bog'lanishi — kontent samarasi ko'rinadi
- B) Faqat layk/qamrov qo'lda yoziladi — yuzaki
- C) Keyin — hozir kerak emas

### Q1096. Kontent joylash eslatmalari
**Nima:** Reja qilingan post vaqti kelganda mas'ulга eslatma yuborish.
**Nega kerak:** Rejalashtirilgan post unutilib qolmasligi va belgilangan vaqtda chiqishi kerak.
**Variantlar:**
- A) Post vaqtidan oldin avtomatik eslatma (mas'ulga) — o'tkazib yuborilmaydi
- B) Eslatmasiz, mas'ul o'zi kuzatadi — sodda, lekin ishonchsiz
- C) Keyin — hozir kerak emas

### Q1097. Marketing -> Sotuv lidni topshirish nuqtasi
**Nima:** Lid qaysi bosqichda marketingdan sotuvga rasmiy o'tadi (issiq bo'lganda, telefon bog'langanda, namuna so'raganda).
**Nega kerak:** Topshirish chizig'i aniq bo'lmasa, marketing "men berdim", sotuv "menga kelmadi" deb bir-birini ayblaydi.
**Variantlar:**
- A) Lid "iliq" yoki undan yuqori bo'lganda avtomatik sotuvga o'tadi + qabul belgisi — aniq mas'uliyat chizig'i
- B) Marketing qo'lda topshiradi — nazorat bor, lekin sekin
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (lid qabul qilish), HR/KPI (marketing vs sotuv javobgarligi)

### Q1098. Namuna qutisi (sample) so'rovi marketingda
**Nima:** Lid namuna karton quti so'raganda buni marketingda qayd qilib, ishlab chiqarishga so'rov yuborish.
**Nega kerak:** Karton zavodda mijoz ko'pincha avval namuna so'raydi; bu jarayon marketing va ishlab chiqarish o'rtasida uzilib qolmasligi kerak.
**Variantlar:**
- A) Namuna so'rovi lid kartochkasidan ishlab chiqarishga yuboriladi + holati kuzatiladi — uzilishsiz
- B) Namuna alohida og'zaki kelishiladi — sodda, lekin yo'qolib ketadi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Ishlab chiqarish (namuna buyurtma), Ombor (namuna materiali)

### Q1099. Marketing umumiy boshqaruv paneli (dashboard)
**Nima:** Marketing rahbari uchun bitta ekranda asosiy raqamlar (oylik lid, sifatli lid ulushi, byudjet sarfi, eng yaxshi kanal, kampaniya ROI).
**Nega kerak:** Rahbar har kuni 5 ta hisobot ochmasligi va bir qarashda ahvolni ko'rishi kerak.
**Variantlar:**
- A) To'liq panel (6-8 asosiy ko'rsatkich + ogohlantirishlar) — tezkor boshqaruv
- B) Faqat lid soni va byudjet — minimal
- C) Keyin — hozir kerak emas

### Q1100. Marketing xodimi KPI ko'rsatkichlari
**Nima:** Marketing xodimini nima bilan baholash (keltirgan sifatli lid soni, lidning sotuvga aylanish foizi, kanal ROI, javob tezligi).
**Nega kerak:** "Faol ishladi" emas, aniq raqam bilan baholash adolatli va rag'batlantiruvchi bo'ladi.
**Variantlar:**
- A) 3-4 KPI (sifatli lid, konversiya %, kanal ROI, SLA) — natijaga yo'naltirilgan
- B) Faqat lid soni — sodda, lekin sifatni rag'batlantirmaydi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: HR/Payroll (bonus hisobi), Org-struktura
  - ↳ Agar A: Konversiya KPI sotuvchiga ham bog'liq, marketing aybi qayerda tugaydi — variantlar: (a) faqat sifatli lidgacha javobgar, (b) yakuniy sotuvga ham qisman, (c) keyin

### Q1101. Raqobatchi kuzatuvi (karton bozori)
**Nima:** Asosiy raqobatchi karton zavodlarining narxi, mahsuloti, aksiyalarini qayd qilib borish.
**Nega kerak:** Mijoz ko'pincha "falon zavod arzonroq" deydi — raqobatchi narxini bilsak, taklif va kampaniyani to'g'ri tuzamiz.
**Variantlar:**
- A) Raqobatchi kartochkasi (nomi, mahsulot turi, taxminiy narx, kuchli/zaif tomon) muntazam yangilanadi — bozorni bilish
- B) Kuzatilmaydi — sodda, lekin ko'r
- C) Keyin — hozir kerak emas

### Q1102. UTM / havola kuzatuvi (veb va ijtimoiy)
**Nima:** Reklama havolalariga maxsus belgi qo'yib, kim qaysi reklamadan veb-saytga kelganini kuzatish.
**Nega kerak:** Onlayn reklamaga pul sarflasak-yu, kim shu havoladan kelganini bilmasak — qaysi reklama ishlaganini hech qachon ayta olmaymiz.
**Variantlar:**
- A) Har reklama/postga maxsus kuzatuv havolasi + lidga avtomatik manba yoziladi — aniq bog'lanish
- B) Havola kuzatuvi yo'q, mijozdan "qayerdan keldingiz" deb so'raymiz — oddiy, lekin noaniq
- C) Keyin — hozir kerak emas

### Q1103. Sodiqlik / takroriy mijoz kampaniyasi
**Nima:** Mavjud mijozlarga yo'naltirilgan kampaniyalar (uzoq buyurtma bermaganga eslatma, katta mijozga maxsus shart).
**Nega kerak:** Yangi mijoz topish takroriydan 5 barobar qimmat; eski mijozni qaytarish marketing uchun eng arzon foyda.
**Variantlar:**
- A) Mijoz tarixiga qarab avtomatik segment (3 oy buyurtma bermaganlar) + maxsus kampaniya — arzon takroriy sotuv
- B) Faqat yangi mijozga e'tibor, takroriy kampaniya yo'q — sodda, lekin imkoniyat yo'qoladi
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: CRM (mijoz segmenti), Sotuv (takroriy buyurtma)

### Q1104. Marketing material va brending arxivi
**Nima:** Logotip, katalog, narx ro'yxati, namuna fotosuratlari, prezentatsiyalarni bir joyda saqlash.
**Nega kerak:** Sotuvchi mijozga yuboradigan katalog yangi va to'g'ri bo'lishi, har kim eski versiyani tarqatmasligi kerak.
**Variantlar:**
- A) Markaziy material kutubxonasi (versiya bilan) — hamma bir xil to'g'ri material ishlatadi
- B) Materiallar xodimlar kompyuterida tarqoq — oddiy, lekin chalkash
- C) Keyin — hozir kerak emas

### Q1105. Mijoz so'rovnoma / mamnuniyat (NPS)
**Nima:** Mijozdan xizmat va sifat haqida fikr so'rash (tavsiya qiladimi, mamnunmi) va natijani qayd qilish.
**Nega kerak:** Mamnun mijoz takroriy buyurtma va tavsiya beradi; norozini vaqtida bilsak, raqobatchiga ketishidan oldin ushlaymiz.
**Variantlar:**
- A) Buyurtma yetkazilgach avtomatik qisqa so'rovnoma (0-10 ball + izoh) — fikr tizimli yig'iladi
- B) So'rovnoma yo'q, faqat shikoyat kelsa reaksiya — passiv
- C) Keyin — hozir kerak emas
  - ⤳ Ta'sir: Sotuv (mijoz mamnuniyati), Sifat nazorati (shikoyat tahlili)

---

## QO'SHIMCHA — kitob-grounded (zavod hujjatlariga asoslangan, takrorlanmaydigan)

> Manba: zavodning REAL 2025 hujjatlari (RD-5 lavozim yo'riqnomalari + Oргполитикалар + Excel formalar). Asoschi: Ayubxon Pozilov — "EURO PRINT KOKAND".
> ⚠️ HAQIQAT: EuroPrint — B2B BUYURTMA QADOQLASH zavodi. "Marketing" = iste'molchi brendi reklama EMAS, balki: (1) yangi B2B mijoz, (2) takroriy buyurtmachini ushlab turish, (3) mavjud zanjir (Bitrix24 + savdo menejer + dizayn bo'limi + опросный лист) bilan ulanish. Quyidagi savollar yuqoridagi 52 va eski 628 dan FARQLI — har biri zavodning aniq hujjat/jarayoniga bog'langan.

---

### Q1106. Bitrix24 bilan kelishuv (mavjud CRM ustiga emas, yonida)
**Nima:** Zavodda allaqachon Bitrix24 ishlatilyapti (карточкалар занжири, kanban, статус — dizayn yo'riqnomada yozilgan). Yangi Marketing moduli Bitrix24 o'rnini bosadimi yoki u bilan yonma-yon ishlaydimi.
**Nega kerak:** Dizayn bo'limi rahbari yo'riqnomada "Bitrix24 da kartochkalar zanjirini doimiy yuritadi" deb yozilgan. Agar ERP marketing alohida tizim bo'lsa — ikki joyda ikki xil mijoz ro'yxati bo'lib qoladi (bizning eski "ikki dunyo" muammosi qaytadi).
**Variantlar:**
- A) ERP yagona manba bo'lsin, Bitrix24 dan lid/mijoz ko'chiriladi va keyin Bitrix24 dan voz kechiladi — bitta haqiqat, lekin o'tish davri kerak
- B) Bitrix24 lid uchun qoladi, ERP faqat savdo+ishlab chiqarish — ikki tizim, sinxronlash kerak
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM, SD (savdo), Dizayn bo'limi.
  ↳ Agar A: Bitrix24 dan eksport rejasini kim qiladi — A) marketing boshlig'i bir martalik CSV; B) avtomatik API ko'prik.

---

### Q1107. Takroriy buyurtmachining yo'qolishini erta sezish (churn signali)
**Nima:** Daromadning katta qismi — har oy qaytib keladigan mijozlar (Benazir, Panda, Krember). Marketing moduli "qaytib kelmay qolgan takroriy mijoz"ni avtomatik aniqlab signal beradimi.
**Nega kerak:** Yangi mijoz topishdan ko'ra eski mijozni yo'qotmaslik 5x arzon. Excel'da Benazir 6-7 xil quti buyurtma qiladi — bittasi to'xtasa, biz 2 oydan keyin sezamiz, kech bo'ladi.
**Variantlar:**
- A) Mijozning o'z ritmiga nisbatan kechikkani aniqlanadi (Benazir har hafta, Fortech har 3 oy) → savdo menejerga signal — erta ushlash
- B) Hammaga bitta qat'iy 60 kun chegarasi — qo'pol, ko'p signal noto'g'ri
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD savdo tarixi, CRM. (Eslatma: v2 Q50 — umumiy sodiqlik kampaniyasi; bu — har mijoz ritmi bo'yicha aniq churn-aniqlash, farqli.)

---

### Q1108. "Kichiklashgan buyurtmalar" signali (M. Nosirov tahlili ERPga)
**Nima:** Zavodda M. Nosirov "Kichiklashgan buyurtmalar tahlili" Excel yuritadi — mijoz buyurtma hajmi/razmeri kichrayganini kuzatadi (razmer eski→yangi, foyda/dona, foyda/kg). Bu tahlilni ERP avtomatik chiqarsinmi.
**Nega kerak:** Buyurtma kichrayishi — mijoz ketishining birinchi belgisi (raqib topdi yoki biznesi qisqardi). Hozir bu qo'lda Excel'da, bir kishida. ERPda bo'lsa — har savdo menejer o'z mijozining tushish trendini ko'radi.
**Variantlar:**
- A) Avtomatik: mijozning oylik buyurtma summasi/soni/razmeri tushsa "kamayish" belgisi + sabab so'raladi — erta ogohlantirish
- B) Faqat yillik umumiy hisobot — kech, trend ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Moliya (daromad trendi, foyda/kg).
  ↳ Agar A: kamayish sababi ro'yxati — A) raqib narxi / sifat shikoyati / mijoz biznesi qisqardi / razmer o'zgardi; B) erkin matn.

---

### Q1109. Mijoz brend standartlari kutubxonasi (bizning emas, MIJOZNING brendi)
**Nima:** Dizayn yo'riqnomada "бренд стандартлари" bor — lekin bu MIJOZ brendi (Benazir logosi, Tefal ranglari). Har mijozning brend qoidalari (logo, rang kodi, shrift, taqiqlar) bir joyda saqlanadimi.
**Nega kerak:** Tefal qutisi noto'g'ri qizil rangda chiqsa — mijoz rad etadi, qayta ishlash zarari. Hozir bu dizaynerning xotirasida. Bir joyda bo'lsa — yangi dizayner ham mijoz brendiga aniq amal qiladi.
**Variantlar:**
- A) Har mijoz kartochkasida "brend pasporti": logo fayl + rang kodlari (Pantone/CMYK) + shrift + taqiqlar — dizayn xatosi kamayadi
- B) Faqat fayllar papkasi, struktura yo'q — topish qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn bo'limi (ЦКП = tasdiqlangan dizayn), SD mijoz kartasi, Sifat. (v2 Q51 — bizning umumiy material/brending arxivi; bu — har MIJOZNING brend pasporti, farqli.)
  ↳ Agar A: brend pasportini kim yuritadi — A) dizayn bo'limi rahbari; B) savdo menejer.

---

### Q1110. Mahsulot namunalari portfolio (bizning ish ko'rgazmasi)
**Nima:** Yangi mijozga "biz nima qila olamiz"ni ko'rsatish uchun ilgari qilingan ishlar (Panda quti, Tefal A-19, Ganga Pizza) rasmlari/namunalari katalogi bo'ladimi.
**Nega kerak:** B2B savdoda mijoz "siz mening qutimni qila olasizmi" deydi. Avval qilingan o'xshash ishni ko'rsatsangiz — ishonch tez ortadi. Hozir bu menejer telefonidagi rasmlarda tarqoq.
**Variantlar:**
- A) Mahsulot turi bo'yicha portfolio (shirinlik qutisi / pizza / filtr / etiketka / gofra) — namuna rasmlar + texnik imkoniyat — savdoga kuchli vosita
- B) Faqat umumiy rasmlar papkasi — tartibsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD savdo, Dizayn arxivi.
  ↳ Agar A: portfolio mijozga ko'rsatish uchun brendlangan PDF bo'ladimi — A) ha; B) faqat ichki ko'rinish.

---

### Q1111. "Опросный лист" (mijoz brifi) — marketing/savdo kirish nuqtasi
**Nima:** Kitobda: savdo menejer mijoz talabidan опросный лист to'ldiradi → bu тех карта asosi. Marketing/CRM lid'i "опросный лист" ga qanday ulanadi.
**Nega kerak:** Lid mijoz bo'lganda, savdo menejer baribir опросный лист to'ldiradi (quti turi, o'lchov, material, bo'yoq, soni). Lid ma'lumoti (mijoz nima so'ragan) опросный лист ga avtomatik o'tsa — qayta yozish yo'q, zanjir uzilmaydi.
**Variantlar:**
- A) Lid'dagi talab ("Benazir uchun 25x19x12 quti") опросный лист ga old-to'ldirilgan holda o'tadi — savdo faqat to'ldiradi
- B) Опросный лист noldan to'ldiriladi — lid ma'lumoti tashlab yuboriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Dizayn (опросный лист→тех карта→лаборатория zanjiri), Ishlab chiqarish.
  ↳ Agar A: опросный лист maydonlari ro'yxatini kim kiritadi — A) bosh texnolog + savdo birga; B) faqat IT.

---

### Q1112. Lid mahsulot turi bo'yicha tasniflash (zavod realiga mos)
**Nima:** Lid kelganda "qanaqa mahsulot kerak"ni zavod turlariga ko'ra belgilash: ofset karton quti / gofra (mikro/makro) / etiketka (samokley) / flekso gofra / pechat blanka.
**Nega kerak:** Har mahsulot turi boshqa dastgoh, boshqa narx, boshqa menejer. Lid'ni boshidan turini bilsangiz — to'g'ri menejerga yo'naltirasiz, narxni tez berasiz. Hozir hammasi aralash.
**Variantlar:**
- A) Lid'da mahsulot turi majburiy maydon (zavod turlari ro'yxatidan) — to'g'ri yo'naltirish + segment statistikasi
- B) Faqat erkin matn "quti kerak" — segmentlab bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Ishlab chiqarish (mahsulot turi → dastgoh).
  ↳ Agar A: tur ro'yxati qayerdan keladi — A) ishlab chiqarish mahsulot turlari katalogidan (yagona master); B) marketing alohida ro'yxat.

---

### Q1113. Savdo menejerga lid biriktirish (kitobda "Menedjer" ustuni bor)
**Nima:** Buyurtma Excel'da "Azizov Avazxon - Menedjer (54)" ustuni bor — har mijoz/buyurtma menejerga biriktirilgan. Lid ham kelishi bilan menejerga biriktiriladimi.
**Nega kerak:** "Egasi yo'q lid — o'lik lid". Agar har lid aniq menejerga tegishli bo'lsa — javobgar bor, lid qovurilib qolmaydi, menejer reytingi chiqadi.
**Variantlar:**
- A) Lid keladi → menejerga biriktiriladi (mahsulot turi/hudud bo'yicha avtomatik), biriktirilmagan lid "egasiz" ro'yxatida qizil — hech narsa yo'qolmaydi
- B) Lid umumiy hovuzda, kim olsa o'sha ishlaydi — chalkashlik, ba'zi lid hech kim olmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD menejer, HR (menejer KPI). (v2 Q17 — taqsimlash qoidasi; bu — kitobdagi aniq "Menedjer" ustuniga bog'lash + egasiz lid qizil belgisi, farqli.)

---

### Q1114. Mijozning to'lov intizomi marketingga signal
**Nima:** Yangi yirik lid ustida ishlashdan oldin, agar bu mijoz ilgari to'lamay yurgan bo'lsa — marketing/savdo buni ko'radimi.
**Nega kerak:** Ko'p reklama qilib, ko'p vaqt sarflab, oxirida to'lamaydigan mijoz topish — zarar. Moliyadan to'lov tarixi ko'rinsa, savdo "bu mijoz ishonchli emas" deb biladi.
**Variantlar:**
- A) Mijoz/lid kartasida to'lov intizomi belgisi (Moliyadan: kechikkan to'lov, qarz) ko'rinadi — xavfli mijozga vaqt sarflamaymiz
- B) To'lov ma'lumoti faqat Moliyada, marketing ko'rmaydi — bilmasdan ishlaymiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (AR/qarz), SD, CRM.
  ↳ Agar A: bu ogohlantirishmi yoki bloklaydimi — A) ogohlantirish (qaror menejerda); B) yirik qarzdor lid avtomatik bloklanadi.

---

### Q1115. Mavsumiy talab kalendari (zavod mavsumlariga mos)
**Nima:** Mijozlar mavsumiy: shirinlik qutilari Yangi yil/Hayit oldidan portlaydi, choy/oziq-ovqat boshqa vaqtda. Marketing kalendari shu mavsumlarni oldindan ko'rsatadimi.
**Nega kerak:** Yangi yil oldidan Benazir/Panda buyurtmasi 3x oshadi. Oldindan bilsangiz — mijozga oldindan qo'ng'iroq qilib buyurtma olasiz, dastgoh band bo'lib qolishidan oldin.
**Variantlar:**
- A) Mavsumiy talab kalendari (o'tgan yillar buyurtma tarixidan, avtomatik aniqlanadi) + "shu mijozga shu oyda qo'ng'iroq qil" eslatmasi — oldindan band qilamiz
- B) Faqat umumiy kalendar, mavsum bog'lanmagan — reaktiv ishlaymiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Ishlab chiqarish rejasi (dastgoh bandligi — Bandlik.xlsx). (v2 Q38 — kontent kalendari; bu — talab/buyurtma mavsumi kalendari, butunlay farqli.)

---

### Q1116. Dizayn namuna (макет) tasdiqlash marketing voronkasida ko'rinadimi
**Nima:** Kitobda "подписной лист" = mijoz tasdiqlagan dizayn = dizayn bo'limining ЦКП si. Lid→mijoz konversiyasida "namuna tasdiqlandimi" bosqichi marketing voronkasida bo'ladimi.
**Nega kerak:** B2B qadoqlashda mijoz ko'pincha "avval namuna ko'rsataylik" deydi. Sotuvning haqiqiy "ha" nuqtasi — намуна tasdiqlanishi (подписной лист). Marketing buni bosqich sifatida kuzatsa — qaysi lid namunada qotib qolganini ko'radi.
**Variantlar:**
- A) Voronkaga "Namuna tayyorlandi → Namuna tasdiqida → Tasdiqlandi (подписной лист)" bosqichlari qo'shiladi — qotgan lid ko'rinadi
- B) Faqat "qiziqdi/yutdik" — namuna jarayoni ko'rinmaydi, ko'p lid shu yerda yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn bo'limi (подписной лист), CRM voronka, SD. (v2 Q19 — umumiy lid bosqichlari; bu — kitobdagi подписной лист tasdiq bosqichini voronkaga kiritish, farqli.)

---

### Q1117. Mahsulot namunasi (fizik sample) XARAJATI va ROI
**Nima:** Mijoz fizik namuna (test quti) so'raganda bizga material+vaqt xarajat bo'ladi. Bu xarajat hisoblanib, "qancha namuna mijozga aylandi" o'lchanadimi.
**Nega kerak:** Bepul namuna berib mijoz topmaslik — sof zarar. Qancha namuna berilgani va konversiyasini bilsangiz — "namuna bering" siyosatini boshqarasiz.
**Variantlar:**
- A) Namuna so'rovi kartochkasi: material+vaqt xarajati + natija (mijoz bo'ldimi) → namuna ROI va konversiya — boshqariladi
- B) Namuna shunchaki beriladi, xarajat/natija hisobga olinmaydi — yashirin zarar
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (material chiqimi), Moliya (xarajat), CRM. (v2 Q45 — namuna so'rovini qayd qilish; bu — namuna XARAJATI+ROI o'lchami, farqli chuqurlik.)
  ↳ Agar A: namuna xarajati lid CPL ga qo'shiladimi — A) ha; B) alohida hisoblanadi.

---

### Q1118. Mijozning kelajak ehtiyoji — yillik forecast olish
**Nima:** Yirik mijozdan "kelasi yilda taxminan qancha quti kerak bo'ladi" deb oldindan so'rab, prognoz qilinadimi.
**Nega kerak:** Benazir "yilda 500 ming quti olaman" desa — material+dastgoh+rejani oldindan tuzamiz, narxni yaxshilaymiz, mijoz xotirjam. B2B sodiqlikning kuchli vositasi.
**Variantlar:**
- A) Yirik mijozdan yillik ehtiyoj prognozi olinadi → ishlab chiqarish/material rejasiga ulanadi (orientir, majburiyat emas) — barqarorlik
- B) Prognoz yo'q, har buyurtma kutilmaganda keladi — reja qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish rejasi (MPS), Ombor (material), Moliya.

---

### Q1119. Lid texnik amalga oshirilishi (biz qila olamizmi) tekshiruvi
**Nima:** Lid noodatiy narsa so'rasa (g'ayrioddiy o'lcham, material, format), biz uni texnik jihatdan qila olamizmi — savdoga oldindan signal bo'ladimi.
**Nega kerak:** Mijozga "ha, qilamiz" deb va'da berib, keyin ishlab chiqarish "qila olmaymiz" desa — sharmandalik, mijoz ketadi. Texnik chegaralar (dastgoh formati, material) oldindan tekshirilsa — yolg'on va'da bo'lmaydi.
**Variantlar:**
- A) Lid talabini texnik imkoniyatga (dastgoh formati/material — Excel'da "Формат листа", "Формат гофро") avtomatik solishtirish → "qila olamiz/qiyin/yo'q" — yolg'on va'da yo'q
- B) Savdo o'zi taxmin qiladi — ba'zan noto'g'ri va'da
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (dastgoh formati), Dizayn.
  ↳ Agar A: qila olmasak alternativa taklif qilinadimi — A) ha, eng yaqin imkoniyat; B) faqat "yo'q".

---

### Q1120. Papka raqami (PT/KT/E) bo'yicha "takror qil" tezligi
**Nima:** Kitobda har mahsulot kod bilan: PT1153, KT3919, E9358. Mijozning eski papka raqamlari bo'yicha "qaytadan shuni qil" tez topiladimi.
**Nega kerak:** Mijoz "o'tgan yilgi Tefal A-19 qutini qaytadan qil" desa — papka raqami (KT3919) bo'yicha eski тех карта+dizayn topiladi, noldan ishlash kerak emas. Bu savdo tezligi.
**Variantlar:**
- A) Mijoz kartasida uning barcha papka raqamlari (PT/KT/E) + oxirgi buyurtma → "takror qil" bir tugma (eski тех карта + yangi narx) — juda tez
- B) Papka qidirish alohida, mijozga bog'lanmagan — har safar qidirish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Dizayn arxivi (макет), Ishlab chiqarish (тех карта).

---

### Q1121. Mijoz "wallet share" — u bizdan yana nimani olishi mumkin
**Nima:** Bir mijoz bir nechta quti turini buyurtma qiladi (Benazir 7 xil). U bizdan hammasini oladimi yoki etiketkasini boshqadan — buni ko'rsatib upsell qilamizmi.
**Nega kerak:** Benazir bizdan 7 xil quti oladi, lekin etiketkasini boshqadan olsa — biz uni ham olishimiz mumkin. "Mijozga yana nimani taklif qilish" ko'rinsa — savdo o'sadi.
**Variantlar:**
- A) Mijoz kartasida "biz qilayotgan / qila oladigan lekin olmayotgan" mahsulotlar + AI tavsiyasi — o'stirish imkoniyati
- B) Faqat hozir olayotgani ko'rinadi — imkoniyat ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, mahsulot katalogi.

---

### Q1122. Mijoz qoniqishini sifat shikoyati bilan bog'lash
**Nima:** Sifat bo'limida brak/reklamatsiya yozuvlari bor (qc_reclamations). NPS so'rovidan oldin, mijozning oxirgi buyurtmalarida brak bo'lganini marketing ko'radimi.
**Nega kerak:** Mijozga "bizni tavsiya qilasizmi" deyishdan oldin, uning oxirgi 3 buyurtmasida brak bo'lganini bilish kerak. Aks holda noto'g'ri vaqtda so'rov yuborib, mijozni asabiylashtiramiz.
**Variantlar:**
- A) Mijoz kartasida shikoyat/brak tarixi NPS bilan birga + brak bo'lsa avtomatik "uzr+chegirma" qaytarish harakati — to'g'ri vaqtda to'g'ri so'z
- B) Shikoyat faqat Sifatda, marketing ko'rmaydi — ko'r-ko'rona so'rov
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (reklamatsiya), CRM, SD. (v2 Q52 — NPS yig'ish; bu — NPSni brak tarixi bilan bog'lash, farqli.)

---

### Q1123. Yutilgan/yo'qotilgan lid sababi + raqobat surati (win/loss reason)
**Nima:** Lid yutilganda yoki yo'qolganda "raqib kim edi, narx farqi qancha, qaysi sabab" tizimli yoziladimi.
**Nega kerak:** Qo'qon/vodiyda boshqa karton zavodlari bor. "X zavod arzonroq qildi" sababi to'planib turса — narx/xizmatni dalil bilan moslaymiz. Hozir bu menejer boshida qoladi.
**Variantlar:**
- A) Har yutilgan/yo'qolgan lid'da raqib nomi + sabab (narx/sifat/muddat) majburiy → raqobat va sabab hisoboti — dalilli qaror
- B) Faqat "yutdik/yo'qotdik" belgisi, sabab yo'q — o'rganib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, narx siyosati (Moliya). (v2 Q48 — raqobatchini umumiy kuzatish; bu — har lid bo'yicha aniq win/loss sabab+raqib, farqli.)

---

### Q1124. Sotuvchi tavsiya skripti (karta-darslik modeliga mos)
**Nima:** Yangi savdo menejer kelganda "qanday gaplashish, qaysi mahsulotni qanday taklif qilish" bo'yicha tayyor skript/qo'llanma ERPda bo'ladimi.
**Nega kerak:** Kitobda har lavozimda "darslik+nazorat varaqasi" bor (karta-markazli model). Savdo menejer ham mahsulotni bilishi kerak (qaysi quti qaysi mijozga). Skript bo'lsa — yangi menejer tez ishga tushadi.
**Variantlar:**
- A) Mahsulot bo'yicha savdo skripti + tez-tez so'raladigan savol-javob (lavozim kartasi darsligiga bog'liq) — yangi menejer tez o'rganadi
- B) Menejer o'zi o'rganadi, skript yo'q — sekin, nomutanosib
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (lavozim kartasi+darslik), karta-markazli model.

---

### Q1125. Hudud/eksport segmenti (Qo'qon + vodiy + Tojikiston)
**Nima:** Mijozlar turli hududda (kitobda "Apricot usti qizil (Tojikiston)"). Mijoz/lid hudud va eksport/ichki bo'yicha tasniflanadimi.
**Nega kerak:** Qaysi hudud ko'proq buyurtma berayotganini bilsangiz — o'sha hududga e'tibor, yangi hududga kirish rejasini ko'rasiz. Eksport (Tojikiston) boshqacha hujjat+narx talab qiladi.
**Variantlar:**
- A) Har mijoz/lid hudud (viloyat/davlat) + eksport/ichki belgisi + hudud bo'yicha savdo xaritasi — bozor ko'rinadi
- B) Hudud belgilanmaydi — qayerda kuchli/zaifligimiz noma'lum
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Logistika (yetkazib berish), Moliya. (v2 Q10 — kampaniya geografiyasi; bu — mijoz/bozor segmenti+eksport, farqli.)

---

### Q1126. Mijoz aloqa shaxsi (kontakt) o'zgarishini kuzatish
**Nima:** Mijoz tomonida bizning kontakt odam (xaridor) almashsa, biz buni bilamizmi va yangi odam bilan aloqa o'rnatamizmi.
**Nega kerak:** Mijoz kompaniyasida xaridor almashganda, ko'pincha yangi odam o'z eski yetkazuvchisini olib keladi — biz yo'qolamiz. Kontakt o'zgarishini sezsak — darrov yangi odam bilan munosabat quramiz.
**Variantlar:**
- A) Mijozda bir nechta kontakt + "asosiy kontakt o'zgardi" belgisi → darrov aloqa vazifasi — mijozni ushlab qolamiz
- B) Faqat bitta telefon raqam — odam ketsa, mijoz ham ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, CRM.

---

### Q1127. "Sovuq" eski mijozni qayta uyg'otish (win-back, dormant)
**Nima:** Bir paytlar buyurtma bergan, lekin uzoq sukut saqlagan mijozlar (Excel'da 2023 yilgi ko'p papka) ro'yxati chiqarilib, qayta aloqa qilinadimi.
**Nega kerak:** Eski mijoz — yangi mijozdan tanish, ishonchli. "Salom, sog'indik, yangi imkoniyatlar bor" deb qo'ng'iroq qilsangiz — bir qismi qaytadi. Deyarli bepul savdo.
**Variantlar:**
- A) "Uzoq sukut saqlagan eski mijoz" ro'yxati (mijoz ritmiga nisbatan) + qayta aloqa vazifasi menejerga — arzon savdo
- B) Eski mijozlar unutiladi — har safar noldan yangi qidiramiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD savdo tarixi, CRM. (v2 Q50 — takroriy mijoz sodiqligi (aktiv mijoz); bu — UZOQ KETGAN dormant mijozni qaytarish, farqli holat.)

---

### Q1128. Mijoz toifalash (ABC) → xizmat darajasi
**Nima:** Mijozlarni A (yirik/doimiy: Benazir, Panda) / B (o'rta) / C (kichik) ga ajratib, har toifaga boshqacha e'tibor+narx+muddat beramizmi.
**Nega kerak:** A mijoz ketsa — katta zarar, doimiy e'tibor kerak. C mijozga ko'p vaqt zarar. Hozir hamma mijoz bir xil ko'riladi.
**Variantlar:**
- A) Avtomatik ABC (yillik summa+takror+foyda) + har toifaga xizmat darajasi (A-mijoz ustuvor reja+narx) — resurs to'g'ri
- B) Qo'lda "muhim mijoz" belgisi — sub'ektiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (sd_customers ABC bor), Moliya.

---

### Q1129. Yangi mahsulot turi talabini o'lchash (flekso liniya qarori)
**Nima:** Zavod yangi imkoniyat qo'shsa (flekso gofra 90 metrli liniya — ega rejalashtirgan), bu imkoniyatga mijozlar qiziqishini marketing o'lchaydimi.
**Nega kerak:** Yangi liniyaga katta pul ketadi. Mijozlar shuni so'rayaptimi (so'rovlarda "flekso"/"gofra" qancha) — bilsangiz, investitsiya to'g'rimi deb dalil bilan qaror qilasiz.
**Variantlar:**
- A) So'rov/lid'larda mahsulot turi statistikasi → "qaysi turga talab o'syapti" → egasi+Ривожлантириш bo'limiga (6-departament) hisobot — investitsiya dalilli
- B) Talab o'lchanmaydi — investitsiya tuyg'u bilan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Ishlab chiqarish (yangi liniya), 6-departament (Ривожлантириш).

---

### Q1130. Mijozga buyurtma holati shaffofligi (B2B kuzatuv)
**Nima:** Mijoz o'z buyurtmasi qaysi bosqichda (dizayn/chop/kesish/tayyor) ekanini ko'ra oladimi — link yoki Telegram bot orqali.
**Nega kerak:** B2B mijoz tez-tez "qutim tayyor bo'ldimi" deb qo'ng'iroq qiladi, menejer vaqtini oladi. Mijoz o'zi ko'rsa — qo'ng'iroq kamayadi, ishonch ortadi (zamonaviy zavod taassuroti).
**Variantlar:**
- A) Mijozga buyurtma holati ko'rinadigan link/bot (faqat o'z buyurtmasi, umumiy bosqich+%) — qo'ng'iroq kamayadi, ishonch ortadi
- B) Holatni faqat menejer aytadi — menejer band, mijoz bezovta
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Ishlab chiqarish (буюртма тайёрлиги %), POS Monitor.

---

### Q1131. Sodiqlik imtiyozi qoidasi (B2B bonus, suiiste'molsiz)
**Nima:** Doimiy yirik mijozga (yiliga X dan ko'p) chegirma/imtiyoz qoida asosida beriladimi va kuzatiladimi.
**Nega kerak:** Sodiq mijozni rag'batlantirsangiz — qoladi va tavsiya qiladi. Lekin reja asosida bo'lishi kerak. Hozir chegirma menejer kayfiyatiga bog'liq — suiiste'mol xavfi.
**Variantlar:**
- A) Sodiqlik darajasi (yillik hajmga ko'ra) + avtomatik imtiyoz qoidasi (ега+savdo boshlig'i belgilaydi) — adolatli, shaffof
- B) Chegirma har safar qo'lda, qoidasiz — nomutanosib, suiiste'mol
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (narx), Moliya. (v2 Q50 — sodiqlik kampaniyasi (aloqa); bu — imtiyoz/chegirma QOIDASI, farqli.)

---

### Q1132. Marketing va Dizayn bo'limi ish yuki muvozanati
**Nima:** Marketing ko'p lid keltirsa, dizayn bo'limi macet ulgurmaydi (kitobda: bir nechta buyurtma birga kelganda rahbar ustuvorlik belgilaydi). Marketing dizayn bandligini ko'rib lid oqimini moslaydimi.
**Nega kerak:** Lid keltirib, dizayn 2 hafta kechiksa — mijoz ketadi. Marketing dizayn bandligini ko'rsa — real ulgura oladigan ish oladi, va'da buzilmaydi.
**Variantlar:**
- A) Marketing dizayn bo'limi bandligini (kanban yuki) ko'radi → realdan ko'p va'da bermaydi — muddat buzilmaydi
- B) Marketing alohida ishlaydi, dizayn bandligini ko'rmaydi — tor bo'g'in, kechikish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn bo'limi (ish taqsimoti), Ishlab chiqarish rejasi, CRM.

---

### Q1133. Ishlab chiqarish bo'sh quvvatini to'ldirish signali
**Nima:** Dastgohlar bo'sh turgan davrda (Bandlik.xlsx) marketing aktiv buyurtma izlash/aksiya kampaniyasini ishga tushiradimi.
**Nega kerak:** Dastgoh bo'sh tursa — sof zarar (ijara, oylik to'lanadi, daromad yo'q). Marketing "hozir kam ish" signalini olsa — chegirma/aksiya bilan bo'shliqni to'ldiradi.
**Variantlar:**
- A) Ishlab chiqarish bo'sh quvvati marketingga signal → "bo'sh davr aksiyasi" (ега+savdo boshlig'i tasdiqlaydi) — zarar kamayadi
- B) Marketing quvvatdan bexabar — bo'sh dastgoh + ortiqcha lid alohida ishlaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (dastgoh bandligi), SD, Moliya.

---

### Q1134. Mahsulot rentabelligi marketing fokusini yo'naltirsinmi
**Nima:** Ba'zi quti turi/mijoz kam foyda keltiradi (Nosirov "Kichiklashgan buyurtmalar" — foyda/dona, foyda/kg). Marketing past foydaliga kam, yuqori foydaliga ko'p e'tibor beradimi.
**Nega kerak:** Ko'p buyurtma ≠ ko'p foyda. Mijoz ko'p ovora qilib kam foyda bersa — ko'p marketing zarar. Foyda ko'rsatilsa — marketing to'g'ri mijozga yo'naladi.
**Variantlar:**
- A) Mijoz/mahsulot foyda darajasi marketingga ko'rinadi (faqat boshliq+ега — maxfiy) → yuqori foydaliga e'tibor — foyda o'sadi
- B) Faqat aylanma (summa) ko'riladi, foyda yashirin — noto'g'ri mijozga kuch
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (foyda/dona, foyda/kg), SD.

---

### Q1135. Savdo menejer faolligi (karta statistik ko'rsatkichi)
**Nima:** Savdo menejer kuniga nechta mijoz bilan gaplashdi, nechta uchrashuv — faollik kuzatiladimi (kitobda har lavozimda "статистик кўрсаткичлар" bor).
**Nega kerak:** Karta-markazli modelda har kartaning statistik ko'rsatkichi bor. Savdo menejer kartasida: faollik (aloqa) → natija (buyurtma). Faollik past bo'lsa — sabab aniqlanadi, adolatli baholash.
**Variantlar:**
- A) Menejer kartasida faollik (aloqa soni, qisman CRM dan avtomatik) + natija (buyurtma/summa) — adolatli
- B) Faqat oxirgi natija (summa) — sababsiz, faollik ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (lavozim kartasi, KPI), SD. (v2 Q47 — marketing xodimi KPI; bu — savdo menejer faolligi+karta statistikasi, farqli rol.)

---

### Q1136. Dizayn yangilash taklifi mijozga (upsell dizayn)
**Nima:** Dizayn bo'limi yangi quti dizayni/yangilash taklif qila oladi (kitobda "yangi dizayn", "yangi lagatip" ko'p). Bu takliflar marketing orqali mijozga yetkaziladimi.
**Nega kerak:** Mijozning eski qutisini yangilab taklif qilsangiz — yangi buyurtma + mijoz "bizni o'ylar ekan" deb sodiq bo'ladi. Hozir bu tasodifiy.
**Variantlar:**
- A) Dizayn yangilash takliflari ro'yxati → savdo menejer mijozga taqdim → qabul qilinsa опросный лист old-to'ldiriladi — yangi savdo manbai
- B) Yangilanish faqat mijoz so'raganda — imkoniyat boy beriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn bo'limi, SD, CRM.

---

### Q1137. Mijozning ishlab chiqarish/aksiya kalendariga moslashish
**Nima:** Mijoz o'z mahsulotini chiqarish kalendariga ega (Benazir Yangi yil shirinligini noyabrda chiqaradi). Biz uning kalendarini bilib, oldindan quti taklif qilamizmi.
**Nega kerak:** Mijozning aksiyasi/yangi mahsuloti oldidan quti kerak. Rejasini bilsangiz — o'zi so'rashidan oldin taklif qilasiz (proaktiv savdo), sodiqlik mustahkamlanadi.
**Variantlar:**
- A) Mijoz kartasida uning mahsulot/aksiya kalendari + "shu sanadan oldin quti kerak" eslatmasi — proaktiv savdo
- B) Reaktiv: mijoz so'raganda ishlaymiz — band davrda kechikamiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Ishlab chiqarish rejasi.
  ↳ Agar A: kalendarni kim kiritadi — A) savdo menejer mijozdan; B) AI buyurtma tarixidan taxmin qiladi.

---

### Q1138. Marketing xarajati zavod realiga mos moddalar
**Nima:** Bizda marketing xarajati ko'proq — ko'rgazma, savdo vakili yo'l xarajati, namuna, katalog — Instagram reklama emas. Byudjet shu real moddalarga bo'linadimi.
**Nega kerak:** B2B zavodda "reklama byudjeti" tushunchasi noto'g'ri. Asl xarajat: ko'rgazma stendi, vakil safari, namuna materiali, katalog. Real moddalarga bo'linsa — pul qayerga ketgani aniq.
**Variantlar:**
- A) Byudjet zavod moddalari bo'yicha: ko'rgazma / vakil safari / namuna / matbaa (katalog) / raqamli — real surat (vakil safari HR komandировка bilan ulanadi)
- B) Faqat umumiy "marketing xarajati" bitta raqam — qayerga ketgani noma'lum
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (xarajat moddalari), HR (vakil safari). (v2 Q4 — byudjet valyutasi/reklama turlari; bu — zavod realiga mos modda tuzilmasi+HR safar ulanishi, farqli.)

---

### Q1139. Egaga (Ayubxon Pozilov) marketing hisoboti — aniq 5 raqam
**Nima:** Egaga har hafta/oy marketing bo'yicha aynan qaysi 5 raqam ko'rsatiladi (kitobda har lavozim "kunlik/haftalik/oylik hisobot rahbariyatga" beradi).
**Nega kerak:** Ega vaqti tor, 50 ta grafik kerak emas. Aynan eng muhim 5 raqam (yangi mijoz, yo'qolgan mijoz, kichiklashayotgan mijoz, savdo trendi, eng katta xavf) + 1 "diqqat talab" bo'lsa — bir qarashda holatni biladi.
**Variantlar:**
- A) Egaga aniq 5 raqam + 1 "diqqat talab" bo'limi (eng katta xavf) — tez qaror
- B) To'liq dashboard, ega o'zi qidiradi — vaqt ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: butun marketing, 7-departament (Администрация). (v2 Q46 — umumiy dashboard; bu — egaга aynan 5 raqam+diqqat, farqli auditoriya/format.)
  ↳ Agar A: 5 raqamni kim belgilaydi — A) ега o'zi tanlaydi; B) tavsiya qilinadi.

---

### Q1140. Tavsiya zanjiri (kim kimni keltirdi) + rahmat/bonus
**Nima:** B2B da eng kuchli kanal — mavjud mijoz tavsiyasi. "Mijoz X → mijoz Y ni keltirdi" zanjiri saqlanib, tavsiya qiluvchiga rahmat/bonus beriladimi.
**Nega kerak:** Tavsiya — bizning eng arzon va ishonchli mijoz manbai. Kim kimni keltirganini bilsangiz — eng faol tavsiyachiga e'tibor berib, tavsiyani rag'batlantirasiz.
**Variantlar:**
- A) Lid'da "kim tavsiya qildi" maydoni + tavsiya zanjiri + tavsiyachiga rahmat/bonus qoidasi — arzon kanal o'sadi
- B) Faqat "tavsiya" belgisi, kim qilgani yo'q — rag'batlantirib bo'lmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM, SD, Moliya (bonus). (v2 Q1 — kanallar ro'yxati; bu — tavsiya zanjiri+bonus, aniq mexanizm, farqli.)

---

### Q1141. Mijoz hujjat/shartnoma to'liqligi marketingdan savdoga o'tishda
**Nima:** Lid mijoz bo'lganda, savdoga o'tishdan oldin uning rasmiy ma'lumotlari (INN/STIR, shartnoma, rekvizit) to'liqligi tekshiriladimi.
**Nega kerak:** Kitobdagi siyosat ruhi: "xom-ashyosi to'liq bo'lmagan zakazni ishlab chiqarishga kiritmaslik". Xuddi shunday — rekviziti to'liq bo'lmagan mijozni savdoga o'tkazmaslik (keyin invoys/to'lov muammosi chiqadi).
**Variantlar:**
- A) Mijoz savdoga o'tishidan oldin majburiy rekvizit (STIR, shartnoma, manzil) tekshiruvi — to'liq bo'lmasa o'tmaydi — keyingi muammo yo'q
- B) Rekvizitsiz o'tadi, keyin to'ldiriladi — invoys/to'lovda tiqilib qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD, Moliya (invoys/rekvizit), CRM.

---

DONE: Marketing — 36.

## 15. Kanban / Vazifalar

### Q1142. Savatlar (ustunlar) ro'yxati va tartibi
**Nima:** Kanban taxtasida qaysi savatlar bo'ladi va ular qanday tartibda turadi.
**Nega kerak:** Savatlar nomi va tartibi butun fabrika uchun bir xil bo'lsa, har bo'lim bir tilda gaplashadi.
**Variantlar:**
- A) 3 savat: "Bajariladi" → "Jarayonda" → "Bajarildi" — sodda, hamma tushunadi
- B) 4 savat: "Yangi" → "Bajariladi" → "Jarayonda" → "Bajarildi" — yangi vazifa alohida ko'rinadi
- C) Keyin — hozir kerak emas

### Q1143. Oldinga o'tish (savatdan savatga) kim huquqli
**Nima:** Vazifani bir savatdan keyingisiga kim surishi mumkin.
**Nega kerak:** Aks holda vazifa "Bajarildi"ga o'zboshimcha surilib, ish bo'lmagani holda yopiq ko'rinadi.
**Variantlar:**
- A) Faqat mas'ul xodim (ijrochi) suradi, "Bajarildi"ni esa boshliq tasdiqlaydi — nazorat saqlanadi
- B) Mas'ul xodimning o'zi hamma o'tishni qiladi — tez, lekin nazorat kam
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom/ko'rsatkich), Hisobotlar (bajarilgan vazifa soni)

### Q1144. Orqaga qaytarish qoidasi (Jarayonda → Bajariladi)
**Nima:** Boshlangan vazifani yana orqaga (boshlanmagan holatga) qaytarish mumkinmi.
**Nega kerak:** Ba'zan ish noto'g'ri boshlanadi yoki to'xtaydi; orqaga qaytarish izsiz bo'lmasligi kerak.
**Variantlar:**
- A) Mumkin, lekin sabab yozish majburiy va tarixga yoziladi — shaffof
- B) Umuman mumkin emas (faqat oldinga) — qat'iy, lekin haqiqatga mos kelmasligi mumkin
- C) Keyin — hozir kerak emas

### Q1145. "Bajarildi"dan qaytarib ochish (qayta ochish)
**Nima:** Yopilgan vazifani qayta ochish (masalan, ish sifatsiz bajarilgan bo'lsa).
**Nega kerak:** Boshliq tekshirganda ish yaroqsiz chiqsa, yangi vazifa ochmasdan eskisini qaytarish kerak.
**Variantlar:**
- A) Faqat boshliq qayta ochadi, sabab majburiy, "qayta ochildi" belgisi qoladi — javobgarlik aniq
- B) Hamma qayta ochishi mumkin — tez, lekin chalkashlik
- C) Keyin — hozir kerak emas

### Q1146. Bir savatdan ikkitasini o'tkazib yuborish (sakrash)
**Nima:** "Bajariladi"dan to'g'ridan-to'g'ri "Bajarildi"ga sakrab o'tish mumkinmi.
**Nega kerak:** Jarayon savatini o'tkazib yuborsa, ishning qancha vaqt bajarilgani yo'qoladi.
**Variantlar:**
- A) Sakrash taqiqlanadi — vazifa albatta "Jarayonda"dan o'tadi (vaqt o'lchanadi)
- B) Sakrashga ruxsat — sodda, lekin tahlil uchun ma'lumot kam
- C) Keyin — hozir kerak emas

### Q1147. "Jarayonda" savatiga o'tish sharti
**Nima:** Vazifani "Jarayonda"ga surishdan oldin nima talab qilinadi.
**Nega kerak:** Ijrochi belgilanmagan yoki muddat yo'q vazifa "boshlandi" deyilsa, keyin kim javobgarligi noaniq.
**Variantlar:**
- A) Ijrochi va muddat to'ldirilgan bo'lsa gina "Jarayonda"ga o'tadi — tartib
- B) Hech qanday shartsiz o'tadi — erkin, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q1148. "Bajarildi"ga o'tish sharti (yopish dalili)
**Nima:** Vazifani yopishdan oldin natija/izoh/rasm talab qilinadimi.
**Nega kerak:** Quruq "bajarildi" yozuvi yolg'on bo'lishi mumkin; dalil talab qilinsa ishonch ortadi.
**Variantlar:**
- A) Kamida bitta izoh majburiy; ba'zi turlarda rasm yoki fayl majburiy — dalilli
- B) Hech narsa talab qilinmaydi — tez, lekin ishonchsiz
- C) Keyin — hozir kerak emas
  ↳ Agar A: qaysi vazifa turlarida rasm/fayl majburiy? Variantlar: 1) Sifat/ta'mirlash 2) Hammasi 3) Hech qaysi

### Q1149. Bir vaqtning o'zida nechta vazifa "Jarayonda" bo'lishi mumkin (WIP chegarasi)
**Nima:** Bitta xodimda bir paytda nechta vazifa "Jarayonda" bo'lishi mumkinligi.
**Nega kerak:** Hammasini boshlab, hech birini tugatmaslik fabrikada keng tarqalgan muammo.
**Variantlar:**
- A) Bir paytda ko'pi bilan 3 ta "Jarayonda" — diqqat jamlanadi
- B) Cheklov yo'q — erkin, lekin chalg'ish
- C) Keyin — hozir kerak emas

### Q1150. O'tish vaqtini avtomatik yozib borish
**Nima:** Har bir savatga o'tish vaqti (kun-soat-daqiqa) avtomatik saqlanadimi.
**Nega kerak:** "Qancha kutdi, qancha bajarildi" degan tahlil shu vaqtlarga tayanadi.
**Variantlar:**
- A) Har o'tish vaqti avtomatik yoziladi, qo'lda o'zgartirib bo'lmaydi — ishonchli tahlil
- B) Faqat yopilgan sana yoziladi — sodda, lekin tahlil zaif
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (bajarilish tezligi), HR (xodim faolligi)

---

## Bo'lim 2 — 24 soat eskalatsiya

### Q1151. Eskalatsiya sababi (nima bo'lsa ko'tariladi)
**Nima:** Vazifa qaysi holatda "yuqoriga ko'tariladi" (eskalatsiya).
**Nega kerak:** Aniq sabab bo'lmasa, eskalatsiya har kuni ishlamay qoladi.
**Variantlar:**
- A) Vazifa muddati o'tib 24 soat bo'lsa-yu hali "Bajarildi"ga o'tmagan bo'lsa — aniq va sodda
- B) "Jarayonda"da 24 soat qotib qolsa (qo'l tegmasa) ham ko'tariladi — qattiqroq nazorat
- C) Keyin — hozir kerak emas

### Q1152. 24 soat qanday sanaladi (ish vaqti yoki astronomik)
**Nima:** 24 soat to'xtovsiz sanaladimi yoki faqat ish soatlari hisoblanadimi.
**Nega kerak:** Dam olish kuni yoki tungi smenani hisobga olmaslik noto'g'ri eskalatsiya beradi.
**Variantlar:**
- A) Faqat ish vaqti sanaladi (smena jadvaliga ko'ra) — adolatli
- B) Astronomik 24 soat (dam olishni ham hisoblaydi) — sodda, lekin qattiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (smena jadvali), Ishlab chiqarish (3 smena)

### Q1153. Eskalatsiya kimga boradi (ko'tarilish manzili)
**Nima:** 24 soat o'tgach vazifa kimga ko'rinadi/xabar boradi.
**Nega kerak:** Noto'g'ri manzil bo'lsa, xabar yo'qoladi yoki noto'g'ri odam bezovta bo'ladi.
**Variantlar:**
- A) Ijrochining bevosita boshlig'iga (org-strukturadagi keyingi yuqori daraja) — tabiiy zanjir
- B) To'g'ridan-to'g'ri bo'lim boshlig'iga — tez, lekin oraliq bo'g'in chetlab o'tiladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id zanjiri), Bildirishnomalar

### Q1154. Ikkinchi bosqich eskalatsiya (yana 24 soat)
**Nima:** Boshliq ham 24 soat ichida hech narsa qilmasa, keyingi daraja ko'tariladimi.
**Nega kerak:** Eskalatsiya bitta odamda qotib qolsa, ma'no qolmaydi.
**Variantlar:**
- A) Ha, yana 24 soatdan keyin keyingi yuqori darajaga ko'tariladi (zanjir bo'ylab) — uzilmas nazorat
- B) Yo'q, faqat bir marta ko'tariladi — sodda
- C) Keyin — hozir kerak emas
  ↳ Agar A: zanjir eng yuqorida (Owner/CEO) to'xtaydimi yoki aylanadimi? Variantlar: 1) CEO'da to'xtaydi 2) Owner'gacha boradi

### Q1155. Eskalatsiya xabari qaysi kanaldan keladi
**Nima:** Ko'tarilish xabari qayerda ko'rinadi.
**Nega kerak:** ERP ichida turib qolgan xabarni hech kim ko'rmasligi mumkin.
**Variantlar:**
- A) ERP ichida + Telegram guruhga xabar — ikki joyda, e'tibordan chetda qolmaydi
- B) Faqat ERP ichida qizil belgi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI Integratsiya (Telegram), Bildirishnomalar

### Q1156. Eskalatsiya hisobi (kim necha marta ko'tarilgan)
**Nima:** Har xodim bo'yicha "necha marta vazifasi eskalatsiyaga ketgan" hisobi yuritiladimi.
**Nega kerak:** Doimo kechiktiruvchi xodimni aniqlash uchun shu raqam kerak.
**Variantlar:**
- A) Ha, oylik hisobotda "eskalatsiya soni" ko'rsatkichi bo'ladi — intizom o'lchanadi
- B) Yo'q, faqat joriy holat — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom ko'rsatkichi), Oylik (KPI)

### Q1157. Eskalatsiyani bekor qilish (noto'g'ri ko'tarilsa)
**Nima:** Boshliq "bu eskalatsiya o'rinsiz" deb yopib qo'yishi mumkinmi.
**Nega kerak:** Ba'zan vazifa haqiqatan kechikkan emas (mijoz kutmoqda); shunda yolg'on signal o'chirilishi kerak.
**Variantlar:**
- A) Boshliq sabab yozib yopadi, lekin tarixda qoladi — moslashuvchan, shaffof
- B) Bekor qilib bo'lmaydi — qat'iy
- C) Keyin — hozir kerak emas

### Q1158. Muddati yo'q vazifa eskalatsiyaga tushadimi
**Nima:** Muddat (deadline) belgilanmagan vazifa nima bo'ladi.
**Nega kerak:** Muddatsiz vazifa "abadiy" ochiq qolishi mumkin.
**Variantlar:**
- A) Muddatsiz vazifa yaratilishiga yo'l qo'yilmaydi (muddat majburiy) — muammo ildizdan yo'qoladi
- B) Muddatsiz bo'lsa, yaratilgandan 7 kun o'tib avtomatik eskalatsiya — kafolat
- C) Keyin — hozir kerak emas

---

## Bo'lim 3 — Shaxsiy dastur (soatlik reja)

### Q1159. Shaxsiy kunlik dastur nima asosida tuziladi
**Nima:** Har xodimning kunlik soatlik dasturi nimadan yig'iladi.
**Nega kerak:** Dastur Kanban vazifalari bilan bog'lanmasa, ikkita alohida ro'yxat bo'lib qoladi.
**Variantlar:**
- A) Kanban vazifalari + takrorlanuvchi odat ishlar avtomatik soatlarga taqsimlanadi — yagona manba
- B) Xodim qo'lda yozadi (Kanbandan ayro) — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (kunlik reja), Hisobotlar (reja vs fakt)

### Q1160. Dastur qadami (vaqt oralig'i)
**Nima:** Soatlik dastur necha daqiqalik bo'laklarga bo'linadi.
**Nega kerak:** Juda mayda bo'lsa to'ldirish og'ir, juda yirik bo'lsa nazorat zaif.
**Variantlar:**
- A) 1 soatlik bo'laklar (08:00–09:00 ...) — sodda va yetarli
- B) 30 daqiqalik bo'laklar — aniqroq, lekin to'ldirish ko'p
- C) Keyin — hozir kerak emas

### Q1161. Reja vs Fakt taqqoslash
**Nima:** Rejalashtirilgan soat va aslida bajarilgan soat solishtiriladimi.
**Nega kerak:** "Reja bor edi-yu bajarilmadi" degan tahlil shu yerdan chiqadi.
**Variantlar:**
- A) Ha, kun oxirida har bo'lakda "reja/fakt/farq" ko'rinadi — o'zini-o'zi nazorat
- B) Yo'q, faqat reja yoziladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), Oylik (KPI), Hisobotlar

### Q1162. Dasturni kim tasdiqlaydi
**Nima:** Xodim tuzgan kunlik dasturni boshliq tasdiqlashi kerakmi.
**Nega kerak:** Tasdiqsiz dastur "o'ynab yozilgan" bo'lishi mumkin.
**Variantlar:**
- A) Ertalab boshliq bir qarab tasdiqlaydi (yoki o'zgartiradi) — yo'naltirish
- B) Tasdiqsiz, faqat xodimning o'zi yuritadi — erkin
- C) Keyin — hozir kerak emas

### Q1163. Kutilmagan ish kirib qolsa (rejaga sig'masa)
**Nima:** Smena o'rtasida shoshilinch vazifa tushsa, dastur qanday o'zgaradi.
**Nega kerak:** Fabrikada doim "to'satdan" ish chiqadi; reja bunga moslashishi kerak.
**Variantlar:**
- A) Yangi vazifa rejaga qo'shiladi, siljigan ishlar avtomatik keyinga suriladi va belgilanadi — haqiqatga mos
- B) Reja qotib qoladi, qo'shimcha ish hisobga olinmaydi — sodda, lekin yolg'on
- C) Keyin — hozir kerak emas

### Q1164. Bo'sh soatlar (rejada teshik)
**Nima:** Dasturda bo'sh qolgan soatlar ajralib ko'rinadimi.
**Nega kerak:** "Kun bo'yi nima qildi" savoliga bo'sh soatlar javob beradi.
**Variantlar:**
- A) Bo'sh soatlar sariq belgilanadi va sababini so'raydi — bo'shliq ko'rinadi
- B) Bo'sh soat oddiy ko'rinadi, hisob yuritilmaydi — sodda
- C) Keyin — hozir kerak emas

### Q1165. Takrorlanuvchi kunlik ishlar (odat vazifalar)
**Nima:** Har kuni takrorlanadigan ishlar (masalan stanok tozalash) avtomatik dasturga tushadimi.
**Nega kerak:** Har kuni qo'lda yozish vaqt yo'qotadi va unutiladi.
**Variantlar:**
- A) Bir marta sozlanadi, har kuni avtomatik paydo bo'ladi — qulay
- B) Har kuni qo'lda qo'shiladi — sodda, lekin unutiladi
- C) Keyin — hozir kerak emas

### Q1166. Dastur kun oxirida yopiladimi (kunlik yakun)
**Nima:** Kun tugaganda dastur "yopiladi" va o'zgarmas bo'lib qoladimi.
**Nega kerak:** Keyin tahrirlasa, reja/fakt tahlili ishonchsiz bo'ladi.
**Variantlar:**
- A) Kun yopilgach o'zgartirib bo'lmaydi (faqat ko'rish) — ishonchli tarix
- B) Keyin ham tahrirlash mumkin — erkin, lekin tahlil zaif
- C) Keyin — hozir kerak emas

---

## Bo'lim 4 — Vazifa kategoriyasi + ustuvorlik

### Q1167. Vazifa kategoriyalari ro'yxati
**Nima:** Vazifa qaysi turlarga bo'linadi.
**Nega kerak:** Kategoriya bo'lmasa, hammasi bir uyumda va tahlil qilib bo'lmaydi.
**Variantlar:**
- A) Ishlab chiqarish / Sifat / Ta'mirlash / Ombor / Sotuv / Ma'muriy / Boshqa — fabrika tiliga mos
- B) Faqat "Ish" va "Shaxsiy" — juda sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (kategoriya kesimi), barcha modullar

### Q1168. Ustuvorlik darajalari
**Nima:** Vazifa muhimligi qanday darajalarga bo'linadi.
**Nega kerak:** Hammasi "shoshilinch" bo'lsa, hech narsa shoshilinch bo'lmaydi.
**Variantlar:**
- A) 3 daraja: Shoshilinch / Oddiy / Past — sodda va yetarli
- B) 4 daraja (rang bilan: qizil/sariq/yashil/kulrang) — ko'rinarli
- C) Keyin — hozir kerak emas

### Q1169. Ustuvorlikni kim belgilaydi
**Nima:** Vazifa muhimligini yaratuvchi belgilaydimi yoki boshliq.
**Nega kerak:** Har kim o'zini "shoshilinch" deb belgilasa, tartib buziladi.
**Variantlar:**
- A) Yaratuvchi taklif qiladi, boshliq tasdiqlaydi/o'zgartiradi — muvozanat
- B) Faqat yaratuvchi belgilaydi — tez, lekin suiiste'mol
- C) Keyin — hozir kerak emas

### Q1170. "Shoshilinch" vazifa kunlik chegarasi
**Nima:** Bir kunda bitta odamga nechta "Shoshilinch" berish mumkin.
**Nega kerak:** Cheklovsiz bo'lsa, hamma vazifa "Shoshilinch" bo'lib ketadi.
**Variantlar:**
- A) Bir kunda ko'pi bilan 2 ta "Shoshilinch" — qadri saqlanadi
- B) Cheklov yo'q — erkin, lekin qadrsizlanadi
- C) Keyin — hozir kerak emas

### Q1171. Ustuvorlik tartibi (Kanbanda joylashuv)
**Nima:** Savat ichida vazifalar qaysi tartibda tizilib turadi.
**Nega kerak:** Eng muhimi yuqorida turmasa, e'tibordan chetda qoladi.
**Variantlar:**
- A) Avtomatik: shoshilinch yuqorida, keyin muddati yaqinlari — o'zi tartiblanadi
- B) Qo'lda sudrab tartiblash — erkin, lekin chalkash
- C) Keyin — hozir kerak emas

### Q1172. Kategoriyaga qarab mas'ulni avtomatik taklif qilish
**Nima:** Kategoriya tanlangach, tizim odatda kim bajarishini taklif qiladimi.
**Nega kerak:** "Ta'mirlash" doim usta Akmalga ketadigan bo'lsa, har safar qidirish shart emas.
**Variantlar:**
- A) Ha, kategoriya bo'yicha odatiy mas'ulni taklif qiladi (o'zgartirsa bo'ladi) — tez
- B) Yo'q, har safar qo'lda tanlanadi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura, AI Integratsiya

### Q1173. Ustuvorlik muddatga ta'sir qiladimi
**Nima:** "Shoshilinch" belgilangan vazifaga avtomatik qisqa muddat qo'yiladimi.
**Nega kerak:** Shoshilinch deyilib, muddati bir hafta qo'yilsa, ma'no qolmaydi.
**Variantlar:**
- A) Shoshilinch → odatda shu kun oxiri muddat (o'zgartirsa bo'ladi) — izchil
- B) Muddat va ustuvorlik bir-biriga bog'liq emas — erkin
- C) Keyin — hozir kerak emas

---

## Bo'lim 5 — Bajarilmagan → ertaga (avtomatik ko'chirish)

### Q1174. Kun oxirida bajarilmagan vazifa nima bo'ladi
**Nima:** Kun tugaganda yopilmagan vazifalar bilan tizim nima qiladi.
**Nega kerak:** Bajarilmagan ish yo'qolib ketmasligi va ertangi kunda ko'rinishi kerak.
**Variantlar:**
- A) Avtomatik ertangi kunga ko'chiriladi va "ko'chirilgan" belgisi qoladi — hech narsa yo'qolmaydi
- B) Joyida qoladi, "muddati o'tgan" bo'lib qizaradi — eslatadi, lekin ro'yxat to'lib ketadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Shaxsiy dastur (ertangi reja), Hisobotlar

### Q1175. Necha marta ko'chirilganini sanash
**Nima:** Bitta vazifa necha kun ketma-ket ko'chgani hisoblanadimi.
**Nega kerak:** 5 kun surilib yurgan vazifa — yo muammoli, yo keraksiz; buni ko'rish kerak.
**Variantlar:**
- A) Ha, "3 marta ko'chirilgan" yozuvi ko'rinadi; 3 dan oshsa boshliqqa signal — ildizni topadi
- B) Sanalmaydi, shunchaki ko'chiriladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: 24-soat eskalatsiya, HR

### Q1176. Ko'chirishda muddat o'zgaradimi
**Nima:** Ertaga ko'chgan vazifaning muddati avtomatik ertangiga suriladimi.
**Nega kerak:** Muddat eski qolib qizarib tursa, ro'yxat doim "qizil" bo'lib ko'zni o'rganadi.
**Variantlar:**
- A) Muddat ertangi kunga suriladi, lekin "asl muddat o'tgan" belgisi saqlanadi — haqiqat ham, yangilik ham
- B) Asl muddat o'zgarmaydi, qizil qoladi — qattiq nazorat
- C) Keyin — hozir kerak emas

### Q1177. Qaysi vazifalar ko'chmaydi (istisno)
**Nima:** Ayrim vazifalar (masalan aniq sanaga bog'liq, mijoz topshirig'i) ko'chirilmasligi kerakmi.
**Nega kerak:** Mijozga 15-iyun deyilgan ishni 16-iyunga ko'chirish yolg'on bo'ladi.
**Variantlar:**
- A) Aniq sanaga bog'langan vazifalar ko'chmaydi, faqat eskalatsiyaga tushadi — to'g'ri signal
- B) Hammasi bir xil ko'chadi — sodda, lekin xato
- C) Keyin — hozir kerak emas

### Q1178. Ko'chirish vaqti (qachon amalga oshadi)
**Nima:** Ko'chirish kun oxirida (smena tugagach) yoki ertasi ertalab bo'ladimi.
**Nega kerak:** Tungi smena bo'lsa "kun oxiri" tushunchasi har bo'limda farq qiladi.
**Variantlar:**
- A) Har bo'limning smena tugashiga moslab ko'chiriladi — adolatli
- B) Hamma uchun yarim tunda — sodda, lekin tungi smenaga noqulay
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (3 smena), HR (smena jadvali)

### Q1179. Ko'chgan vazifa ertangi rejada qayerda turadi
**Nima:** Ertaga ko'chgan ish ertangi dasturda yuqoridami yoki yangi ishlar bilan teng.
**Nega kerak:** Kechikkan ish yangilardan oldin bajarilishi mantiqan to'g'ri.
**Variantlar:**
- A) Ko'chgan ish ertangi ro'yxatda yuqorida turadi — qarz birinchi yopiladi
- B) Hammasi teng tartibda — sodda
- C) Keyin — hozir kerak emas

### Q1180. Ko'p marta ko'chgan vazifani avtomatik yopish/arxivlash
**Nima:** Masalan 10 kun ko'chib hech kim qo'l urmagan vazifa nima bo'ladi.
**Nega kerak:** Hech kimga kerak bo'lmagan vazifa ro'yxatni axlatga to'ldiradi.
**Variantlar:**
- A) 10 kundan oshsa boshliqqa "yopaylikmi?" so'rovi chiqadi — tozalik, lekin nazorat bilan
- B) Avtomatik o'zi yopiladi — toza, lekin xavfli
- C) Keyin — hozir kerak emas

---

## Bo'lim 6 — Kuzatuvchi (observer)

### Q1181. Kuzatuvchi roli nima
**Nima:** Vazifaga "kuzatuvchi" sifatida qo'shilgan odam nima qila oladi.
**Nega kerak:** Ba'zan ishni bajarmaydigan, lekin xabardor bo'lishi kerak bo'lgan odam bor (masalan boshliq, qo'shni bo'lim).
**Variantlar:**
- A) Ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydi — aralashmasdan kuzatadi
- B) Hech narsa yoza olmaydi, faqat ko'radi — sof tomoshabin
- C) Keyin — hozir kerak emas

### Q1182. Kuzatuvchini kim qo'shadi
**Nima:** Vazifaga kuzatuvchi qo'shish huquqi kimda.
**Nega kerak:** Har kim o'zini istalgan vazifaga qo'shsa, maxfiylik buziladi.
**Variantlar:**
- A) Yaratuvchi yoki mas'ul boshliq qo'shadi — nazorat
- B) Istalgan xodim o'zini qo'sha oladi — ochiq, lekin chalkash
- C) Keyin — hozir kerak emas

### Q1183. Kuzatuvchiga qaysi o'zgarishlar haqida xabar boradi
**Nima:** Kuzatuvchi har bir mayda o'zgarishdami yoki faqat muhimlaridami xabardor bo'ladi.
**Nega kerak:** Har izohga xabar kelsa, kuzatuvchi xabarlarni o'chirib qo'yadi.
**Variantlar:**
- A) Faqat muhim hodisalar: yopildi, kechikdi, eskalatsiya — kerakli xabar
- B) Har bir o'zgarishda — to'liq, lekin shovqinli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Bildirishnomalar, AI Integratsiya (Telegram)

### Q1184. Avtomatik kuzatuvchi (boshliq o'z-o'zidan kuzatuvchi bo'ladimi)
**Nima:** Xodimning boshlig'i uning vazifalariga avtomatik kuzatuvchi bo'lib qo'shiladimi.
**Nega kerak:** Boshliq qo'l ostidagilarning ishini ko'rib turishi tabiiy.
**Variantlar:**
- A) Ha, bevosita boshliq avtomatik kuzatuvchi (lekin xabar oqimini boshqaradi) — tabiiy nazorat
- B) Yo'q, faqat qo'lda qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (manager_id zanjiri)

### Q1185. Kuzatuvchi sonining chegarasi
**Nima:** Bitta vazifaga nechta kuzatuvchi qo'shilishi mumkin.
**Nega kerak:** 20 kishi kuzatuvchi bo'lsa, vazifa "yig'ilish"ga aylanadi va javobgar yo'qoladi.
**Variantlar:**
- A) Ko'pi bilan 5 kuzatuvchi — yetarli va toza
- B) Cheksiz — erkin, lekin chalkash
- C) Keyin — hozir kerak emas

### Q1186. Kuzatuvchi maxfiy vazifani ko'ra oladimi
**Nima:** Maxfiy belgilangan vazifaga kuzatuvchi qo'shilsa, mazmunni ko'radimi.
**Nega kerak:** Oylik, intizom yoki shaxsiy masalalar hammaga ochiq bo'lmasligi kerak.
**Variantlar:**
- A) Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi qo'shiladi, qolganlarga ko'rinmaydi — himoya
- B) Kuzatuvchi qo'shilsa hammasini ko'radi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (maxfiy masalalar), Xavfsizlik

### Q1187. Kuzatuvchining @eslatma (mention) qilishi
**Nima:** Izohda kuzatuvchini yoki boshqa odamni @ belgi bilan chaqirib, xabar yuborish mumkinmi.
**Nega kerak:** "Bu yerga e'tibor ber" demoqchi bo'lganda aniq odamni chaqirish kerak.
**Variantlar:**
- A) Ha, @ bilan chaqirilgan odamga xabar boradi — aniq murojaat
- B) Yo'q, faqat umumiy izoh — sodda
- C) Keyin — hozir kerak emas

---

## Bo'lim 7 — Qo'shimcha aniqlik (maydonlar, holatlar, chekka holatlar)

### Q1188. Vazifaning majburiy maydonlari
**Nima:** Vazifa yaratishda qaysi maydonlar to'ldirilishi shart.
**Nega kerak:** Bo'sh sarlavhali, mas'ulsiz vazifa keyin hech kimga foyda bermaydi.
**Variantlar:**
- A) Sarlavha + mas'ul + muddat + kategoriya majburiy; izoh ixtiyoriy — to'liq va yengil
- B) Faqat sarlavha majburiy — tez, lekin sifatsiz
- C) Keyin — hozir kerak emas

### Q1189. Bitta vazifaga ko'p mas'ulmi yoki bitta
**Nima:** Vazifa bir kishiga biriktiriladimi yoki bir nechtasiga.
**Nega kerak:** "Hamma mas'ul" = "hech kim mas'ul emas" degani.
**Variantlar:**
- A) Bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi — javobgarlik aniq
- B) Bir nechta teng mas'ul — moslashuvchan, lekin javobgarlik tarqoq
- C) Keyin — hozir kerak emas

### Q1190. Vazifani boshqa odamga o'tkazish (qayta biriktirish)
**Nima:** Mas'ul o'zgartirilsa, eski mas'ul va tarix qanday saqlanadi.
**Nega kerak:** "Men qilmadim, u qilishi kerak edi" degan chalkashlikni oldini olish kerak.
**Variantlar:**
- A) O'tkazishda sabab yoziladi, "X dan Y ga o'tdi" tarixda qoladi — shaffof
- B) Shunchaki mas'ul almashadi, tarix yo'q — sodda, lekin chalkash
- C) Keyin — hozir kerak emas

### Q1191. Kichik vazifalar (kontrol ro'yxat / checklist)
**Nima:** Bitta vazifa ichida bajariladigan mayda qadamlar ro'yxati bo'ladimi.
**Nega kerak:** "Buyurtmani tayyorlash" ichida 5 ta qadam bo'lishi mumkin; har birini belgilab borish qulay.
**Variantlar:**
- A) Ha, vazifa ichida belgilanadigan checklist bo'ladi; hammasi belgilanmaguncha yopilmaydi — to'liq nazorat
- B) Yo'q, vazifa yaxlit — sodda
- C) Keyin — hozir kerak emas

### Q1192. Vazifa bilan ishlab chiqarish buyurtmasini bog'lash
**Nima:** Kanban vazifasini aniq buyurtma yoki stanok bilan bog'lash mumkinmi.
**Nega kerak:** "Falon buyurtma uchun" deb bog'lansa, kechikish qaysi mijozga ta'sir qilishini ko'rsa bo'ladi.
**Variantlar:**
- A) Ixtiyoriy ravishda buyurtma/stanok/mijozga bog'lanadi — kuchli aloqa
- B) Bog'lash yo'q, vazifa mustaqil — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (buyurtma), Sotuv (mijoz), Hisobotlar

### Q1193. Bekor qilingan vazifa holati (yopilgandan farqi)
**Nima:** "Bajarildi" bilan "Bekor qilindi" alohida holat bo'ladimi.
**Nega kerak:** Bajarilgan va keraksiz bo'lib bekor qilingan ishni bir xil sanash hisobotni buzadi.
**Variantlar:**
- A) Alohida "Bekor qilindi" holati, sabab majburiy — toza hisob
- B) Bekor ham "Bajarildi"ga kiradi — sodda, lekin chalg'itadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Hisobotlar (haqiqiy bajarilish foizi)

### Q1194. Vazifa izohlari va fayl biriktirish
**Nima:** Vazifaga rasm, fayl, ovozli xabar biriktirib bo'ladimi.
**Nega kerak:** Sifat nuqsoni yoki stanok buzilishini rasm bilan ko'rsatish so'zdan aniqroq.
**Variantlar:**
- A) Rasm + fayl + ovozli izoh biriktirsa bo'ladi — to'liq dalil
- B) Faqat matn izoh — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat nazorati (nuqson rasmi), Ombor (saqlash)

### Q1195. Vazifa ko'rinishi (kim qaysi vazifani ko'radi)
**Nima:** Xodim faqat o'z vazifasinimi yoki butun bo'lim vazifalarini ko'radimi.
**Nega kerak:** Maxfiylik va e'tibor masalasi: hammaning hamma narsani ko'rishi shart emas.
**Variantlar:**
- A) Xodim o'zini + bo'lim ishlarini, boshliq butun bo'limni, yuqori daraja yuqoridan ko'radi — bosqichli
- B) Hamma hamma narsani ko'radi — ochiq, lekin maxfiylik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura, Xavfsizlik

### Q1196. Telegramdan vazifa yaratish/yopish
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

## 16. IoT

### Q1197. Mashina master-reestri "Станоклар норма" jadvaliga aniq mos kelsinmi
**Nima:** IoT mashina reestri kitobdagi "Станоклар норма.xlsx" ro'yxatidagi aynan o'sha nomlar (SM-52, KBA-105, Тигель 1–10, Гофра линия, ФСМ, ...) bilan to'ldirilsinmi.
**Nega kerak:** Zavod allaqachon shu nomlar bilan ishlaydi va norma yuritadi — yangi nom o'ylab topilsa, smena tabeli bilan IoT raqamlari mos kelmaydi.
**Variantlar:**
- A) Reestr xuddi "Станоклар норма" jadvalidagi nomlar bilan seed qilinadi (1:1 moslik) — eski qog'oz hisobot bilan to'la mos
- B) Yangi soddalashtirilgan nomlar bilan, eski nomlar faqat izoh sifatida — toza, lekin operator chalkashadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Ishlab chiqarish (norma), Smena tabeli

### Q1198. Har mashinaga "norma штук 1 час" qiymati biriktirilsinmi
**Nima:** Kitobdagi "норма штук 1 час" va "норма штук за 12 часов" qiymatlari har mashina kartasiga IoT'da saqlansinmi (target tezlik).
**Nega kerak:** IoT mashinaning haqiqiy chiqishini normaga solishtirib "norma bajarildimi" deyishi uchun har mashinada target raqam bo'lishi shart.
**Variantlar:**
- A) Har mashina kartasida norма/soat + norма/12 soat saqlanadi, IoT haqiqiy bilan solishtiradi — performance % avtomatik
- B) Norma faqat Ishlab chiqarish modulida, IoT undan o'qiydi — markazlashgan, lekin bog'lanish kerak
- C) Keyin — hozir kerak emas
  ↳ Agar A: norma kim tasdiqlaydi? — A) "Согласовано РД4 + Утверждено Ген.Директор" (kitobdagidek imzo-zanjir) · B) faqat ishlab chiqarish boshlig'i · C) admin

### Q1199. O'lchov birligi mashinaga qarab farq qilsinmi (м2 / лист / штук / удар)
**Nima:** Kitobda Гофра линия = **м2**, ofset = **лист**, Тигель = **удар/лист**, qolganlari = **штук**. IoT hisoblagichi har mashina uchun o'z birligida ishlasinmi.
**Nega kerak:** Hamma mashinani "dona"da hisoblasak gofra (m2) va tigel (udar/list) noto'g'ri chiqadi — birlik mashinaga bog'liq.
**Variantlar:**
- A) Har mashinada o'z birligi (м2/лист/штук/удар) — kitobga aniq mos, to'g'ri hisob
- B) Hamma "dona"ga keltiriladi (konvertatsiya bilan) — sodda hisobot, lekin gofra/tigelda xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Ishlab chiqarish hisoboti, Norma

### Q1200. Tigel uchun "удар/лист" (zarba) hisoblagichi alohida kuzatilsinmi
**Nima:** Тигель (висечка/тиснение/конгрев) mashinalarida natija lист emas, **удар** (har bosish) bilan o'lchanadi — IoT zarba hisoblagichi qo'yilsinmi.
**Nega kerak:** Tigel resursi va eskirishi zarba soniga bog'liq; bir varaqqa bir necha udar bo'lishi mumkin — faqat varaq sanasak texnik xizmat noto'g'ri rejalashadi.
**Variantlar:**
- A) Тигель mashinalarida udar va lист ikkalasi alohida hisoblanadi — resurs + ishlab chiqarish ikkisi to'g'ri
- B) Faqat lист hisoblanadi — sodda, lekin udar-resurs ko'rinmaydi
- C) Keyin — hozir kerak emas
  ↳ Agar A: udar sonidan texnik xizmat eslatmasi chiqsinmi (masalan har 1 mln udarda)?

### Q1201. SM-52 / SM-72 / KBA-105 bosma ranglar soni (seksiya) kuzatilsinmi
**Nima:** Ofset bosma mashinalarida bosilgan ranglar/seksiyalar soni (4+0, 4+4 va h.k.) IoT'da yozilsinmi.
**Nega kerak:** Bo'yoq sarfi, plastina (колиб) soni va tezlik rang soniga bog'liq — buni bilmasak material va norma noto'g'ri.
**Variantlar:**
- A) Har bosma ishi uchun rang/seksiya soni yoziladi (texnik topshiriqdan keladi) — material va norma aniq
- B) Faqat varaq soni, rang yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (bo'yoq), Dizayn (rang), Norma

### Q1202. "иш йук" (idle / ish yo'qligi) alohida holat sifatida kuzatilsinmi
**Nima:** Kitobda takror uchraydi: "ходимлар иш йуклиги сабабли...", "иш йуклиги сабабли паддон кадоклаган". IoT'da "иш йук" mashina to'xtashining alohida sababi bo'lsinmi.
**Nega kerak:** Ish yo'qligi mashina nosozligi emas — bu rejalashtirish muammosi; aralashtirsak nosozlik statistikasi buziladi va ShVB noto'g'ri xulosa chiqaradi.
**Variantlar:**
- A) "Иш йук" alohida toifa (rejalashtirish kamchiligi) — nosozlikdan ajraladi, ShVB to'g'ri ko'radi
- B) Umumiy "to'xtagan"ga qo'shiladi — sodda, lekin sababi ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish rejalashtirish (MPS/MRP), ShVB samaradorlik

### Q1203. "Колиб (qolip) tayyorlanmagani" to'xtash sababi sifatida tanlansinmi
**Nima:** Kitobda real izoh: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". To'xtash sabablari ro'yxatida "qolip o'z vaqtida tayyorlanmadi" bo'lsinmi.
**Nega kerak:** Zavodning haqiqiy yo'qotishi shu — qolip kechikkani; standart sabab bo'lsa kim/qaysi bo'lim aybdor ekani aniqlanadi.
**Variantlar:**
- A) "Колиб тайёр эмас" alohida sabab + mas'ul bo'lim (qolip tsexi) biriktiriladi — javobgarlik aniq
- B) Umumiy "sozlash kutilmoqda"ga qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Qolip/штамп tsexi, Ishlab chiqarish reja

### Q1204. "Иш икки марта кайта урилган" (qayta urish) brak sabab kodi sifatida
**Nima:** Kitobda: "иш икки марта кайта урилган колиб яримтали + подрезка". Mahsulot qayta urilishi (peredelka) IoT/MES brak sabab kodi bo'lsinmi.
**Nega kerak:** Qayta urish = vaqt va material yo'qotish; sababi (qolip yarim, podrezka) yozilsa takror oldini olinadi.
**Variantlar:**
- A) "Кайта урилди (переделка)" sabab kodi + qisqa izoh — yo'qotish manbasi aniq
- B) Faqat brak % oshadi, sabab yo'q — sodda, lekin tahlil yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), Norma (brak %)

### Q1205. "Билма заказ настройкаси муракаб" — sozlash vaqti (setup) alohida o'lchansinmi
**Nima:** Kitob: "Билма заказ настройкаси муракаб - вакт кетди". Yangi/murakkab buyurtma sozlash (setup/наладка) vaqti ishlash vaqtidan ajratib o'lchansinmi.
**Nega kerak:** Sozlash vaqti ishlamayotgan vaqt — uni ishlab chiqarish vaqtiga qo'shsak norma soxta past chiqadi; ajratilsa OEE to'g'ri.
**Variantlar:**
- A) Setup vaqti alohida holat (sozlanmoqda) sifatida sanaladi va OEE'da hisobga olinadi — to'g'ri samaradorlik
- B) Sozlash ham "ishlayapti"ga kiradi — sodda, lekin norma buziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Norma, Smena hisoboti

### Q1206. Smena bo'yicha (А / Б / С) holat va norma ajratilsinmi
**Nima:** Kitobda smenalar А/Б/С belgilangan. IoT ko'rsatkichlari (uptime, brak, norma) har smena bo'yicha alohida hisoblansinmi.
**Nega kerak:** Qaysi smena yaxshi/yomon ishlashini bilmasak, ShVB smena boshliqlarini taqqoslay olmaydi.
**Variantlar:**
- A) Har smena (А/Б/С) bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktiriladi — adolatli taqqoslash
- B) Faqat kunlik umumiy — sodda, lekin smena farqi ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (smena boshlig'i KPI), ShVB

### Q1207. "Станокдаги ишлар · кейинги иши" navbat IoT ekranida ko'rinsinmi
**Nima:** Kitob tabelida har mashinada "Станокдаги Ишлар" (hozirgi) va "кейинги иши" (keyingi) bor. IoT/Andon ekranida shu ikki ish ko'rinsinmi.
**Nega kerak:** Operator keyingi ishni ko'rsa, qolip/material oldindan tayyorlanadi — to'xtash kamayadi; bu zavodda allaqachon qog'ozda yuritiladigan model.
**Variantlar:**
- A) Har mashina kartasida "hozirgi ish + keyingi ish" MES'dan kelib ko'rsatiladi — uzluksizlik
- B) Faqat hozirgi ish ko'rinadi — sodda, lekin tayyorgarlik kech
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (ish navbati), Ishlab chiqarish reja

### Q1208. Har mashinaga operator va yordamchi biriktirilsinmi (kim ishlatdi)
**Nima:** Kitob tabelida har stanok yonida "Оператор: ___ / Ёрдамчи: ___". IoT smena yozuvida mashinada kim ishlaganini yozsinmi.
**Nega kerak:** Brak yoki rekord kimning smenasida bo'lganini bilmasak, KPI va o'qitish (darslik) manzilsiz qoladi.
**Variantlar:**
- A) Smena yozuvida operator + yordamchi(lar) biriktiriladi (HR kartasidan) — KPI manzili aniq
- B) Faqat mashina yoziladi, odam yo'q — sodda, lekin javobgarlik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (KPI, darslik), karta-model

### Q1209. Гофра линия uchun м2 hisoblagich Ombor (karton) bilan bog'lansinmi
**Nima:** Гофра линия chiqishi м2 da; IoT'dagi м2 hisoblagich sarflangan karton/lайнер bilan solishtirilsinmi.
**Nega kerak:** Ishlab chiqarilgan m2 va olingan material m2 farqi = yo'qotish/brak; avtomatik solishtirilsa o'g'irlik/isrof ko'rinadi.
**Variantlar:**
- A) Ishlab chiqarilgan м2 ↔ sarflangan material м2 avtomatik solishtiriladi, farq ogohlantiriladi — isrof nazorati
- B) Faqat ishlab chiqarish m2 yoziladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Sifat (brak), Moliya

### Q1210. UV лак / Трафаретный лак uchun lак sarfi kuzatilsinmi
**Nima:** UV lakировка va Трафаретный лак mashinalarida lak/химикат sarfi varaq soniga bog'lab kuzatilsinmi.
**Nega kerak:** Lak qimmat material; nechta varaqqa qancha lak ketishini bilmasak, sarf normasi va xarajat noaniq.
**Variantlar:**
- A) Lак mashinalarida varaq/m2 → lak sarf normasi (haqiqiy ↔ kutilgan) kuzatiladi — material nazorati
- B) Lak sarfi faqat Ombor chiqimida, IoT'da yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (lak/химикат), Moliya

### Q1211. Ламинация uchun plyonka (рулон) sarfi va isrofi
**Nima:** Ламинация (катта/кичик/полуавтомат) mashinalarida plyonka rulon sarfi va chetlama (обрезка) isrofi IoT'da hisoblansinmi.
**Nega kerak:** Plyonka rulonlab keladi; isrof foizi yuqori bo'lsa mashina sozlamasi yoki operator muammosi bor demak.
**Variantlar:**
- A) Plyonka sarfi + isrof % har ишда yoziladi, chegaradan oshsa ogohlantiriladi — isrof nazorati
- B) Faqat metr/m2 sarf, isrof yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (plyonka), Sifat

### Q1212. Степлер 1/2/3 va Склейка — qo'l mehnati mashinalari IoT'ga kiradimi
**Nima:** Степлер ручной-1/2/3, Склейка ручная, Окошка kabi qo'l/yarim-avtomat ish joylari IoT-sensor bilan kuzatiladimi yoki faqat qo'lda hisoblanadimi.
**Nega kerak:** Qo'l ish joylariga sensor qo'yish qiyin/qimmat; lekin norma (kitobda бор) hisoblanishi kerak — qaysi yo'l tanlanadi.
**Variantlar:**
- A) Qo'l ish joylari tabletdan qo'lda kiritiladi (norма штук bilan solishtiriladi), sensor yo'q — arzon, real
- B) Hammasiga sensor/hisoblagich — to'liq, lekin qimmat va murakkab
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Operator tableti, Norma

### Q1213. Резка (kesish) mashinasi material kirim nuqtasi sifatida kuzatilsinmi
**Nima:** Резка ko'pincha birinchi operatsiya (rulon/listga). IoT'da Резка kesilgan varaq sonini hisoblab keyingi mashinalarga "kirish" raqamini bersinmi.
**Nega kerak:** Keyingi mashinalar braki ulardan oldingi varaq sonidan o'lchanadi; Резка raqami bo'lmasa zanjir bo'ylab yo'qotishni kuzatib bo'lmaydi.
**Variantlar:**
- A) Резка chiqishi keyingi bosqich uchun "kirish miqdori" bo'lib zanjir bo'ylab kuzatiladi — yo'qotish har bosqichda ko'rinadi
- B) Har mashina mustaqil hisoblanadi, zanjir yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (operatsiya zanjiri), Sifat

### Q1214. "отработано часов" (ishlangan soat) vs 12 soatlik smena solishtirilsinmi
**Nima:** Kitobda "отработано часов" va "норма штук за 12 часов" bor. IoT haqiqiy ishlangan soatni 12 soatlik smenaga solishtirib bo'sh vaqtni ko'rsatsinmi.
**Nega kerak:** 12 soatdan necha soat haqiqatan ishladi — qolgani idle/setup/remont; bu ShVB ning asosiy yo'qotish ko'rsatkichi.
**Variantlar:**
- A) Smena = 12 soat baza; ishlangan/bo'sh/sozlash/remont soatlarga bo'linadi — to'liq vaqt tahlili
- B) Faqat ishlangan soat yoziladi — sodda, bo'sh vaqt ko'rinmaydi
- C) Keyin — hozir kerak emas
  ↳ Agar A: smena uzunligi (8/10/12 soat) mashinaga/sexga qarab sozlanadimi?

### Q1215. "ко-во работ" (ish/buyurtma soni) smenada bajarilgan ish soni o'lchansinmi
**Nima:** Kitobda "ко-во работ" (nechta alohida buyurtma bajarilgan) bor. IoT smena yozuvida bir smenada nechta turli ish (qolip almashtirish) bo'lganini sanaydimi.
**Nega kerak:** Ko'p kichik ish = ko'p sozlash = past norma; buni bilmasak operatorni "sekin" deb noto'g'ri ayblaymiz.
**Variantlar:**
- A) Smenada bajarilgan ish soni + har biriga sozlash vaqti sanaladi — norma adolatli baholanadi
- B) Faqat umumiy chiqish, ish soni yo'q — sodda
- C) Keyin — hozir kerak emas

### Q1216. Брак % chegarasidan oshganda avtomatik ogohlantirish
**Nima:** Kitobda "брак %" ustuni bor. IoT/MES smena brak foizi belgilangan chegaradan oshsa real vaqtda ogohlantirsinmi.
**Nega kerak:** Brak kech bilinsa butun partiya yaroqsiz bo'ladi; chegara oshganda darhol to'xtatib sabab izlash kerak.
**Variantlar:**
- A) Brak % chegaradan oshsa → smena boshlig'i + sifatga darhol signal (ekran + Telegram) — erta to'xtatish
- B) Faqat smena oxirida hisobotda ko'rinadi — kech, lekin sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), ShVB, Telegram bot

### Q1217. Brak chegarasi mashina turiga qarab farq qilsinmi
**Nima:** Gofra, ofset, tigel, kashировка uchun "normal brak %" turlicha. Chegara har mashina turi uchun alohida sozlansinmi yoki bitta umumiy.
**Nega kerak:** Bitta umumiy chegara qo'ysak — ba'zi mashina doim "yomon", ba'zisi hech qachon signal bermaydi.
**Variantlar:**
- A) Har mashina turiga o'z brak chegarasi (ishlab chiqarish boshlig'i belgilaydi) — adolatli
- B) Bitta umumiy chegara — sodda, lekin noaniq
- C) Keyin — hozir kerak emas

### Q1218. Авто vs ручная кашировка — avtomat/qo'l mashina samaradorligi taqqoslansinmi
**Nima:** Kitobda кашировка 3 turda: авто, полуавтомат, ручная. IoT ularning norma/samaradorligini taqqoslab qaysisi tejamliroq ekanini ko'rsatsinmi.
**Nega kerak:** Egasi avto-mashinaga investitsiya qaytishini ko'rishi uchun avto ↔ qo'l samaradorligini raqamda taqqoslash kerak.
**Variantlar:**
- A) Avto/yarim-avto/qo'l kashировка solishtirma hisoboti (m2/soat, brak, mehnat) — investitsiya qarori uchun
- B) Hammasi bir guruh sifatida — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (CAPEX qaror), ShVB

### Q1219. Мashina ish-davriyligi: "иш %" (yuklanish foizi) ko'rsatkichi
**Nima:** Kitobda "иш %" (mashina nechа foiz band) bor. IoT har mashinaning yuklanish foizini (band/bo'sh) ko'rsatsinmi.
**Nega kerak:** Doim band mashina — bo'g'iz (bottleneck); doim bo'sh mashina — ortiqcha quvvat. Bu rejalashtirish va investitsiya uchun muhim.
**Variantlar:**
- A) Har mashina yuklanish % (kun/hafta) + bo'g'iz belgilanadi — quvvat rejasi aniq
- B) Faqat uptime, yuklanish yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish quvvat rejasi (CRP), ShVB

### Q1220. "Согласовано РД4 / Утверждено Ген.Директор" — norma tasdiq zanjiri IoT'da saqlansinmi
**Nima:** Kitob hisobotida norma "Согласовано РД4" (Yulchiev M.) + "Утверждено Ген.Директор" (Pozilov A.) imzosi bilan tasdiqlanadi. IoT'dagi norma o'zgarishi shu tasdiq zanjirini talab qilsinmi.
**Nega kerak:** Norma o'zgarsa oylik o'zgaradi — har kim o'zgartira olmasligi, faqat tasdiqlangani amal qilishi kerak.
**Variantlar:**
- A) Norma o'zgarishi RD (ishlab chiqarish boshlig'i) → Direktor tasdig'idan o'tadi (audit jurnali bilan) — kitobdagidek nazorat
- B) Ishlab chiqarish boshlig'i o'zi o'zgartiradi — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (oylik), ShVB, Audit

### Q1221. ФСМ (большой/маленький/полуавтомат) — yelimlash mashinasi tezligi va uzilishi
**Nima:** ФСМ (folder-gluer) mashinalarida tezlik (dona/soat) va qog'oz uzilishi/tiqilib qolishi (зажор) IoT'da kuzatilsinmi.
**Nega kerak:** ФСМ tez mashina; uzilish/tiqilish ko'p bo'lsa karton namligi yoki sozlama muammosi — buni bilmasak sababsiz to'xtaydi.
**Variantlar:**
- A) ФСМ tezlik + tiqilish soni kuzatiladi, ko'paysa ogohlantiriladi — sabab erta topiladi
- B) Faqat chiqish soni — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (karton namligi), Ombor

### Q1222. Tigrel/висечка qolip (штамп) resursini udar soniga bog'lash
**Nima:** Har die-cut qolip (штамп) cheklangan udar soniga chidaydi. IoT qolip udar hisoblagichini yuritib eskirganda almashtirishni eslatsinmi.
**Nega kerak:** Eskirgan qolip brak beradi; oldindan eslatsa partiya buzilmaydi va qolip o'z vaqtida tayyorlanadi (Q7 muammosi).
**Variantlar:**
- A) Har qolip kartasi + udar hisoblagichi + resurs chegarasi → almashtirish eslatmasi — brak oldini olish
- B) Qolip resursi kuzatilmaydi, sinmaguncha ishlatiladi — arzon, lekin brak xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Qolip tsexi, Sifat, Texnik xizmat

### Q1223. Мashina yonidagi defekt sababini operator tabletdan tanlasinmi
**Nima:** Brak topilganda operator tabletdan tayyor sabab ro'yxatidan (qolip yarim, podrezka, rang ketdi, karton ho'l) tanlaydimi.
**Nega kerak:** Erkin matn tahlil qilib bo'lmaydi; kitobdagi real sabablar tayyor ro'yxat bo'lsa Pareto (eng ko'p brak sababi) chiqadi.
**Variantlar:**
- A) Tayyor sabab ro'yxati (kitobdagi real holatlardan) + ixtiyoriy izoh — tahlilga qulay
- B) Faqat erkin matn — moslashuvchan, tahlilsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (Pareto), Operator tableti

### Q1224. Smena topshirish (А→Б) paytida mashina holati IoT'da qayd etilsinmi
**Nima:** Smena almashganda (А→Б→С) tugatilmagan ish, mashina holati, qolgan material tabletda topshiriladimi.
**Nega kerak:** Topshirilmasa keyingi smena nimadan boshlashini bilmaydi — yana sozlash, yana yo'qotish; smena topshirish jurnali bu muammoni yopadi.
**Variantlar:**
- A) Smena topshirish ekrani: tugatilmagan ish + mashina holati + qolip/material + izoh — uzluksizlik
- B) Topshirish yo'q, har smena mustaqil — sodda, lekin uzilish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, MES, HR

### Q1225. "иш йук" soatlarida xodimlar boshqa ishga (паддон/арчиш) o'tkazilgani yozilsinmi
**Nima:** Kitob: "ходимлар иш йуклиги учун арчишда ишлади", "паддон кадоклаган". Ish yo'q paytda boshqa ishga o'tkazish IoT/HR'da qayd etilsinmi.
**Nega kerak:** Bo'sh turmagan, lekin asosiy ishidan boshqa ish qilgan xodim mehnati hisobga olinmasa, samaradorlik soxta past chiqadi va xodim noroziligi.
**Variantlar:**
- A) "Иш йук → muqobil ish (арчиш/паддон/тозалаш)" qayd etiladi, vaqt alohida sanaladi — adolatli mehnat hisobi
- B) Bo'sh vaqt sifatida yoziladi, muqobil ish yo'q — sodda, lekin adolatsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (mehnat hisobi, oylik), ShVB

### Q1226. Гофра линия namlik/klей (yelim) parametri kuzatilsinmi
**Nima:** Gofrirovка sifatida yelim harorati/miqdori va karton namligi muhim. IoT bu parametrlarni sensor bilan o'qisinmi.
**Nega kerak:** Yelim yoki namlik noto'g'ri bo'lsa qatlam ko'chadi (расслоение) — butun rulon brak; sensor bilan oldindan ushlanadi.
**Variantlar:**
- A) Gofra linia yelim harorati + namlik sensor bilan, chegaradan chiqsa ogohlantirish — qatlam ko'chishi oldini olish
- B) Faqat chiqish m2, parametr yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (qatlam ko'chishi), Ombor (karton/yelim)

### Q1227. Ofset bo'yoq (краска) qutisi darajasi kuzatilsinmi
**Nima:** SM/KBA mashinalarida bo'yoq tugashidan oldin sensor/operator ogohlantirishi bo'lsinmi.
**Nega kerak:** Bo'yoq o'rtada tugasa rang o'zgaradi (brak) yoki to'xtash; oldindan bilinsa to'xtovsiz ishlaydi.
**Variantlar:**
- A) Bo'yoq darajasi past bo'lsa ogohlantirish + Ombordan avtomatik talab — uzluksizlik
- B) Operator o'zi kuzatadi, tizim yo'q — arzon
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (bo'yoq talab), Sifat (rang)

### Q1228. Avtohisечка картон vs гофра — material turi bo'yicha ajratilsinmi
**Nima:** Автовысечка alohida картон va гофра uchun (kitobda 2 qator). IoT bu ikki mashina/rejimni alohida sanaydimi.
**Nega kerak:** Karton va gofra normasi, braki, tezligi har xil; aralashtirsak hisobot noto'g'ri.
**Variantlar:**
- A) Картон va гофра висечка alohida o'lchanadi (o'z normasi bilan) — to'g'ri hisob
- B) Bitta "висечка" mashinasi — sodda
- C) Keyin — hozir kerak emas

### Q1229. Mashina ishga tushish (ON) / o'chish (OFF) vaqti avtomatik yozilsinmi
**Nima:** Mashina elektr ON/OFF vaqtini IoT avtomatik yozib, ish kunining haqiqiy boshlanish/tugash vaqtini aniqlasinmi.
**Nega kerak:** Smena 8:00 da boshlanishi kerak, lekin mashina 8:40 da yonsa — yo'qotish bor; tabel emas, real yonish vaqti kerak.
**Variantlar:**
- A) Mashina ON/OFF avtomatik yoziladi + tabel rejasi bilan solishtiriladi — kechikish ko'rinadi
- B) Faqat operator login vaqti — sodda, lekin mashina emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), ShVB, Energiya

### Q1230. Энергия hisobi mashina ON bo'lib lekin ishlamayotgan (бекор ёниб турган) vaqtni topsinmi
**Nima:** Mashina yoqilgan, lekin ishlamayapti (idle holatda tok yeydi). IoT bu "bo'sh tok sarfi"ni alohida hisoblasinmi.
**Nega kerak:** Bo'sh yonib turgan mashina pulni yeydi, mahsulot yo'q; bu eng oson tejaladigan xarajat.
**Variantlar:**
- A) Ishlash tok ↔ bo'sh (idle) tok ajratiladi, bo'sh tok ogohlantiriladi — tejash imkoni
- B) Umumiy tok sarfi — sodda, idle ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (energiya xarajat), ShVB

### Q1231. Kompressor / havo tizimi (пневматика) bosimi kuzatilsinmi
**Nima:** Ko'p mashina (tigel, ФСМ, висечка) siqilgan havoda ishlaydi. Markaziy kompressor bosimi/uzilishi IoT'da kuzatilsinmi.
**Nega kerak:** Bosim tushsa bir necha mashina birdan sekinlashadi/to'xtaydi; bitta kompressor nazorati ko'p mashinani himoya qiladi.
**Variantlar:**
- A) Kompressor bosimi + havo uzilishi sensor bilan, tushsa ogohlantirish — ko'p mashinani saqlaydi
- B) Kompressor kuzatilmaydi — arzon, lekin yashirin to'xtash sababi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat, ShVB

### Q1232. Andon ekranida normaga nisbatan real bajarish (target ↔ haqiqiy)
**Nima:** Sex katta ekranida har mashina yonida "norма штук" target va hozirgi haqiqiy son yonma-yon ko'rinsinmi (ortda qolsa qizil).
**Nega kerak:** Operator o'z natijasini target bilan real vaqtda ko'rsa, o'zini tezlashtiradi; kitobdagi norma qog'ozda emas, ekranda jonli bo'ladi.
**Variantlar:**
- A) Andon: target vs haqiqiy + ortda qolish % (qizil/yashil) — o'z-o'zini boshqaruv
- B) Faqat haqiqiy son, target yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, Operator motivatsiyasi

### Q1233. Окошка (deraza yelimlash) maxsus operatsiyasi alohida bosqich sifatida
**Nima:** Окошка (oynaли qutiga plyonka yopishtirish) alohida mashina/operatsiya. IoT'da bu bosqich va uning braki alohida kuzatilsinmi.
**Nega kerak:** Okoshka qo'shimcha material (oyna plyonka) va vaqt; alohida bosqich bo'lmasa narx va norma noto'g'ri.
**Variantlar:**
- A) Окошка alohida operatsiya + plyonka sarfi + brak — to'liq hisob
- B) Склейкага qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (oyna plyonka), Narx (Costing)

### Q1234. Тиснение / Конгрев (folga bosish) folga sarfi va udar soni
**Nima:** Тигель тиснение/конгрев (folga bosish/bo'rttirma) operatsiyalarida folga (folga rulon) sarfi va udar IoT'da kuzatilsinmi.
**Nega kerak:** Folga qimmat; har bosishga qancha folga ketishini bilmasak xarajat va isrof noaniq.
**Variantlar:**
- A) Folga sarfi (м/ish) + udar soni kuzatiladi, isrof ko'rsatiladi — qimmat material nazorati
- B) Folga faqat Ombor chiqimida — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (folga), Moliya

### Q1235. Mashina-mashina o'rtasidagi yarim tayyor (НЗП) buyurtma kuzatilsinmi
**Nima:** Ish bir necha mashinadan o'tadi (Резка→Печать→Лак→Висечка→ФСМ→Степлер→Упаковка). IoT/MES buyurtma qaysi bosqichda turganini ko'rsatsinmi.
**Nega kerak:** Buyurtma qayerda qotib qolganini (bottleneck oldida) bilmasak, savdo mijozga muddatni ayta olmaydi.
**Variantlar:**
- A) Har buyurtma operatsiya zanjiri bo'ylab kuzatiladi (qaysi mashinada, qancha kutdi) — muddat aniq
- B) Faqat boshlandi/tugadi — sodda, oraliq ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Savdo (muddat), Ishlab chiqarish reja

### Q1236. "Папка №" (buyurtma papkasi) IoT yozuvlariga biriktirilsinmi
**Nima:** Kitobda har ish "Папка №" (masalan 18660, 19868) bilan yuritiladi. IoT mashina yozuvi shu papka raqamiga bog'lansinmi.
**Nega kerak:** Zavod papka raqami bilan ishlaydi; IoT raqami papkaga ulanmasa, qaysi buyurtmaga oid ekanini topib bo'lmaydi.
**Variantlar:**
- A) Har mashina ishi "Папка №" + buyurtma kodiga bog'lanadi — to'liq kuzatuv
- B) Faqat mashina + sana — sodda, buyurtma bog'lanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Savdo, Costing

### Q1237. Sensor signal yo'qolsa "noma'lum" vaqt brak hisoblansinmi yoki ajratilsinmi
**Nima:** Sensor uzilsa o'sha vaqt holatini IoT bilmaydi. Bu "noma'lum" vaqt uptime'ga qo'shiladimi yoki alohida belgilanadimi.
**Nega kerak:** Noma'lum vaqtni "ishladi" desak soxta yaxshi, "to'xtadi" desak soxta yomon; alohida belgilash to'g'ri.
**Variantlar:**
- A) Sensor uzilgan vaqt "ma'lumot yo'q" sifatida ajratiladi (uptime'ga ham, downtime'ga ham qo'shilmaydi) — halol hisob
- B) Oxirgi ma'lum holat davom etgan deb hisoblanadi — sodda, lekin xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Data sifati

### Q1238. Mashina texnik xizmat tarixi qog'oz jurnaldan IoT'ga ko'chirilsinmi
**Nima:** Zavodda allaqachon "ремонтда" yozuvlari bor. Mashina ta'mir tarixi (sana, nima, kim, qancha turdi) IoT kartasiga yozilsinmi.
**Nega kerak:** Qaysi mashina tez-tez sinadi ko'rinsa — almashtirish/kapital ta'mir qarori chiqadi; tarqoq qog'ozda bu ko'rinmaydi.
**Variantlar:**
- A) Mashina kartasida ta'mir tarixi (sana/ish/qism/xarajat) — eskirish va MTBF ko'rinadi
- B) Faqat "ремонтда" holati, tarix yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat, Moliya (CAPEX)

### Q1239. Texnik xizmat ehtiyot qismi Ombor bilan bog'lansinmi
**Nima:** Mashina ta'mirida ishlatilgan ehtiyot qism (подшипник, ремень, нож) Ombor zaxirasidan avtomatik chiqim qilinsinmi.
**Nega kerak:** Ehtiyot qism hisobsiz ishlatilsa kerakli payt yo'q bo'ladi; IoT-Ombor bog'lanishi minimal zaxira ushlab turadi.
**Variantlar:**
- A) Ta'mirda ishlatilgan qism Ombordan chiqim + min. zaxira ogohlantirish — uzluksiz ta'mir
- B) Ehtiyot qism alohida hisoblanadi (Omborsiz) — sodda, lekin uzilish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (ehtiyot qism), Texnik xizmat

### Q1240. Mashina "norma bajarilmadi" sababi avtomatik tahlil qilinsinmi
**Nima:** Smena oxirida norma bajarilmasa, IoT yozilgan to'xtash/setup/idle sabablaridan "nega bajarilmadi"ni avtomatik tushuntirsinmi.
**Nega kerak:** Operator "ulgurmadim" desa yetarli emas; tizim "3 soat иш йук + 1 soat сozlash" deb ko'rsatsa, sabab obyektiv bo'ladi.
**Variantlar:**
- A) Norma bajarilmaganda avtomatik sabab tahlili (downtime breakdown) ko'rsatiladi — obyektiv baholash
- B) Faqat "bajarildi/yo'q" bayrog'i — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, HR (KPI), Norma

### Q1241. Brak material qayta ishlatish (макулатура) kuzatilsinmi
**Nima:** Brak karton/qog'oz makulaturaga ketadi yoki qayta ishlanadi. IoT/Ombor brak material miqdorini va taqdirini yozsinmi.
**Nega kerak:** Brak material ham pul; qancha makulaturaga ketdi va qancha qaytdi bilinmasa, yo'qotish to'liq ko'rinmaydi.
**Variantlar:**
- A) Brak miqdori → makulatura/qayta ishlash sifatida yoziladi — to'liq material balansi
- B) Brak faqat % sifatida, taqdiri yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Moliya, Ekologiya hisoboti

### Q1242. Mashina sertifikat/kalibrovka muddati eslatmasi
**Nima:** Tarozi, harorat sensori, bosim o'lchagich vaqti-vaqti bilan kalibrlanishi kerak. IoT kalibrovka muddatini kuzatib eslatsinmi.
**Nega kerak:** Kalibrlanmagan sensor noto'g'ri o'qiydi — barcha IoT raqami yolg'on bo'lib qoladi; muddat eslatmasi data ishonchini saqlaydi.
**Variantlar:**
- A) Har sensor/o'lchagich kalibrovka muddati + eslatma — data ishonchli qoladi
- B) Kalibrovka kuzatilmaydi — arzon, lekin data shubhali
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (data ishonchi), Texnik xizmat

### Q1243. Kamera-AI bilan operator himoya vositasi (qo'lqop/ko'zoynak) tekshirilsinmi
**Nima:** Bosma/висечка mashinalarida xavfsizlik uchun qo'lqop/ko'zoynak/quloqchin shart. Kamera-AI ularni kiyganini tekshirsinmi.
**Nega kerak:** Mashina yonidagi jarohat xavfi yuqori; AI himoya vositasiz operatorni aniqlasa baxtsiz hodisa oldini oladi.
**Variantlar:**
- A) Kamera-AI himoya vositasini tekshiradi, yo'q bo'lsa ogohlantiradi/qayd etadi — xavfsizlik
- B) Faqat inspektor qo'lda tekshiradi — odam, doimiy emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Xavfsizlik (Техника хавфсизлиги), HR

### Q1244. Kamera-AI mashina ishlayotganda yonida odam yo'qligini (xavfli zona) tekshirsinmi
**Nima:** Висечка/тигель ishlaganda xavfli zonaga qo'l kirsa to'xtatish/ogohlantirish kerak. Kamera-AI buni real vaqtda kuzatsinmi.
**Nega kerak:** Tigel/висечка barmoq kesishi mumkin; AI xavfli zonani kuzatsa eng og'ir baxtsiz hodisa oldi olinadi.
**Variantlar:**
- A) Kamera-AI xavfli zonani kuzatadi, odam kirsa darhol ogohlantiradi — jiddiy xavfsizlik
- B) Faqat fizik to'siq/tugma — ishonchli, lekin AI nazorati yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Xavfsizlik, Texnik xizmat (mashina to'xtatish)

### Q1245. Tungi smena (С) uchun avtomatik nazorat kuchaytirilsinmi
**Nima:** Tunda nazoratchi kam; IoT/kamera tungi smenada (С) anomaliya va bo'sh turishni qattiqroq kuzatib avtomatik xabar bersinmi.
**Nega kerak:** Tunda mashina bo'sh tursa yoki sinса hech kim ko'rmaydi; avtomatik xabar tungi yo'qotishni kamaytiradi.
**Variantlar:**
- A) Tungi smenada anomaliya/idle chegarasi pasaytiriladi + masofadan xabar (Telegram) — tunги nazorat
- B) Kunduzgidek bir xil nazorat — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, Telegram bot, HR (tungi smena)

### Q1246. Mashina ish boshlanishidan oldin "tayyorlik tekshiruvi" (checklist) IoT'da bo'lsinmi
**Nima:** Operator mashinani yoqishdan oldin (yog'lash, tozalik, qolip, material) checklist tabletda to'ldirsinmi.
**Nega kerak:** Tayyorgarliksiz boshlangani uchun to'xtash (Q7, Q9 muammosi) ko'p; majburiy checklist xatoni boshida ushlaydi.
**Variantlar:**
- A) Mashina boshlashdan oldin majburiy checklist (yog'/tozalik/qolip/material), to'ldirilmasa ish ochilmaydi — to'xtash kamayadi
- B) Checklist ixtiyoriy/qog'ozda — sodda, lekin o'tkazib yuboriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat (TPM), Sifat, ShVB

### Q1247. Mashina samaradorligi GSD/ЦКП statistikasi sifatida ShVB'ga uzatilsinmi
**Nima:** Har mashina/sexning IoT samaradorligi (uptime, norma %, brak) ShVB statistik bo'lim ko'rsatkichi (GSD) sifatida avtomatik uzatilsinmi.
**Nega kerak:** Vizyon — har bo'lim o'z ЦКП/statistikasi bilan o'lchanadi; IoT raqamlari qo'lda emas, avtomatik GSD'ga tushsa ShVB jonli ishlaydi.
**Variantlar:**
- A) IoT ko'rsatkichlari avtomatik ShVB GSD'ga (ishlab chiqarish bo'limi statistikasi) uzatiladi — vizyonga to'liq mos
- B) Qo'lda ShVB'ga kiritiladi — sodda, lekin kechikadi/xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB (Vysotskiy 7), karta-model, Statistik bo'lim

### Q1248. Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash darajasi
**Nima:** IoT chiqargan norma %/brak operatorning oyligi yoki bonusiga qanchalik ta'sir qilsinmi.
**Nega kerak:** Bog'lansa motivatsiya kuchli, lekin sensor xatosi yoki "иш йук" (operator aybi emas) oylikka noto'g'ri ta'sir qilmasligi kerak.
**Variantlar:**
- A) Bonusga ta'sir qiladi, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi) — adolatli
- B) To'g'ridan-to'g'ri butun norma % oylikka — kuchli, lekin adolatsiz
- C) Bog'lanmaydi, faqat ko'rsatkich — xavfsiz, lekin motivatsiya zaif
- D) Keyin — hozir kerak emas
⤳ Ta'sir: HR (oylik/bonus), ShVB, karta-model

### Q1249. Ofset plastina (колиб/пластина) tayyorlik holati IoT navbati bilan bog'lansinmi
**Nima:** Ofset ishi uchun plastina (CTP) tayyor bo'lishi kerak. IoT mashina navbatida "plastina tayyor/yo'q" holati ko'rinsinmi.
**Nega kerak:** Plastina tayyor bo'lmasa mashina kutadi (Q7 turkumi); navbatda holat ko'rinsa preprint bo'lim oldindan tayyorlaydi.
**Variantlar:**
- A) Mashina navbatidagi har ish yonida "plastina/qolip tayyor" indikatori (preprint'dan) — uzluksizlik
- B) Mashina navbati bor, plastina holati yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn/Preprint, MES, Ishlab chiqarish reja

DONE: IoT — 53.

## 17. AI

### Q1250. Lavozim "Статистик кўрсаткичлар"ini AI avtomatik o'lchaydimi
**Nima:** Har kartada hujjatda yozilgan aniq statistik ko'rsatkichlar bor (masalan logistika boshlig'i: "режа бажарилиш даражаси (%)", "кечикишлар сони", "режадан оғиш ҳолатлари сони"; dizayn rahbari: "ўз вақтида қабул қилинган макетлар улуши %", "қайта ишлашлар сони"). AI shularni real ma'lumotdan avtomatik hisoblab boradimi.
**Nega kerak:** Bu ko'rsatkichlar allaqachon hujjatda lavozim o'lchovi sifatida belgilangan — AI ularni qo'lda emas, ma'lumotdan hisoblasa, baho xolis va izchil bo'ladi.
**Variantlar:**
- A) Ha — har karta o'z "статистик кўрсаткичлар" ro'yxatiga ega bo'ladi, AI ularni real ma'lumotdan avtomatik hisoblaydi va kartaga yozadi.
- B) Faqat umumiy GSD hisoblaydi, lavozimga xos ko'rsatkichlar qo'lda kiritiladi — sodda, lekin har lavozim o'ziga xosligi yo'qoladi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (karta razryad/oylik), Direktor-AI, Hisobot moduli.
  ↳ Agar A: ko'rsatkich ta'rifi (formula) qayerda saqlanadi? Variantlar: A) har kartaga biriktirilgan "ko'rsatkich-formula" maydoni; B) markaziy ko'rsatkich-katalog, kartaga tanlanadi.

### Q1251. "Кўп учрайдиган хатолар" bankini AI buzilish belgilash uchun ishlatadimi
**Nima:** Har lavozim hujjatida aniq "Кўп учрайдиган хатолар" ro'yxati bor (masalan: "Ишлаб чиқариш режасини ўз вақтида қабул қилмаслик", "Иш жойини рухсатсиз ташлаб кетиш", "Файлларни ўз вақтида топширмаслik"). AI shu ro'yxatni bilib, xodim shu xatolardan birini qilganda avtomatik belgilaydimi.
**Nega kerak:** Bu xatolar zavod tajribasidan yig'ilgan — AI ularni "qoida-buzilish" namunasi sifatida ishlatsa, baho real lavozim talabiga bog'lanadi, mavhum emas.
**Variantlar:**
- A) Ha — har kartaga "tipik xatolar" ro'yxati biriktiriladi, AI ma'lumotdan shu xatoni topsa belgilaydi va sababini izohlaydi.
- B) AI faqat umumiy anomaliya qidiradi, lavozimga xos xatolar ro'yxatidan foydalanmaydi.
- C) Keyin — hozir kerak emas.

### Q1252. "Муваффақиятли ҳаракатлар" bankidan AI ijobiy baho beradimi
**Nima:** Hujjatda har lavozim uchun "Муваффақиятли ҳаракатлar" ro'yxati ham bor (masalan: "Режани олдиндан қабул қилиш", "Бўлимлар билан доимий алоқа", "Ҳисоботларни ўз вақтида тайёрлаш"). AI xodim shu ijobiy harakatlarni qilganini ko'rib, baholashda plus beradimi.
**Nega kerak:** Baho faqat jazo/xatoga emas, ijobiy modelga ham asoslanishi kerak; aks holda AI faqat "kamchilik qidiruvchi"ga aylanadi.
**Variantlar:**
- A) Ha — AI ijobiy ("muvaffaqiyatli harakat") va salbiy ("tipik xato") banklarning ikkalasini ham hisobga olib, muvozanatli baho beradi.
- B) Faqat xatoni belgilaydi, ijobiy harakat hisobga olinmaydi — bir tomonlama.
- C) Keyin — hozir kerak emas.

### Q1253. "Муваффақиятли ҳаракатлар ва одатий хатолар бланкалари"ni AI to'ldiradimi
**Nima:** Hujjatda rahbar majburiyati: "'Муваффақиятли ҳаракатлар ва одатий хатолар' бланкаларининг мунтазам ва ХОЛИС тўлдирилишини таъминлаш". AI bu bланkani har xodim uchun avtomatik (real ma'lumotdan) to'ldirib bersa, rahbar faqat tasdiqlaydimi.
**Nega kerak:** Hujjat "холис" (xolis) to'ldirishni talab qiladi — AI ma'lumotdan to'ldirsa sub'ektivlik kamayadi, rahbar yukini ham yengillashtiradi.
**Variantlar:**
- A) Ha — AI har xodim uchun blankani real hodisalardan avtomatik tayyorlaydi, rahbar ko'rib tasdiqlaydi/tahrirlaydi.
- B) Rahbar qo'lda to'ldiradi, AI faqat eslatma yuboradi — sub'ektiv, lekin sodda.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR baholash, karta↔xodim moslik bahosi.

### Q1254. ЦКП "баҳоланадиган" bo'lishini AI tekshiradimi
**Nima:** Hujjatda ЦКП ta'rifi: "аниқ ва БАҲОЛАНАДИГАН якуний натижа" (masalan dizayn: "буюртмачи тасдиқлаган, қайта ишлашсиз ишлаб чиқаришга қабул қилинган дизайн"). Karta yaratilganda AI ЦКП matni o'lchovli/baholanadigan formada yozilganini tekshiradimi.
**Nega kerak:** Agar ЦКП o'lchovsiz yozilsa ("yaxshi ishlash"), AI uni hisoblay olmaydi — yaratishdayoq baholanadigan formaga keltirish kerak.
**Variantlar:**
- A) Ha — AI ЦКП matnini tekshiradi, o'lchovli emas bo'lsa ("qanday o'lchaysiz?") savol berib aniqlashtiradi.
- B) ЦКП erkin matnda qoladi, AI tekshirmaydi — moslashuvchan, lekin o'lchovsiz ЦКП ko'p bo'ladi.
- C) Keyin — hozir kerak emas.

### Q1255. "Бекор туриш" (downtime)ni AI sabab bilan tahlil qiladimi
**Nima:** Hujjatda "бекор туриш" ta'rifi: "иш вақти давом этаётган бўлса-да, логистика ёки бошқа сабаблар туфайли ишлаб чиқариш вақтинча тўхтаб қолиши". AI bekor turish hodisasini aniqlab, sababini (logistika / material / mashina / hujjat) ajratib beradimi.
**Nega kerak:** Logistika boshlig'i javobgarligi aynan "бекор туришлар"ga; AI sababni ajratsa, kim aybdorligi va qayerni tuzatish kerakligi aniq bo'ladi.
**Variantlar:**
- A) Ha — AI har bekor turishni vaqt + sabab kategoriyasi + mas'ul karta bilan yozadi, haftalik jamlaydi.
- B) Faqat "to'xtash bo'ldi" deb belgilaydi, sababsiz — sodda, lekin foydasi kam.
- C) Keyin — hozir kerak emas.

### Q1256. "Режадан оғиш" (plan deviation)ni AI darajalaydimi
**Nima:** Hujjatda ko'rsatkich: "Режадан оғиш ҳолатлари сони". AI rejadan og'ishni faqat sanab qolmay, og'ish kattaligi/jiddiyligiga qarab daraja (kichik/o'rta/jiddiy) beradimi.
**Nega kerak:** 5 daqiqalik og'ish va 5 soatlik og'ish bir xil "1 hodisa" sanalsa, ko'rsatkich noto'g'ri tasvir beradi.
**Variantlar:**
- A) Ha — AI og'ishni kattaligi va ta'siriga qarab darajalaydi, jiddiylariga alohida e'tibor tortadi.
- B) Faqat sonini sanaydi — sodda, lekin chuqurligi yo'q.
- C) Keyin — hozir kerak emas.

### Q1257. A-System / eski tizim ma'lumotini AI o'qiy oladimi
**Nima:** Hujjatlarda hozirgi zavod tizimlari nomlangan: "A-System (ишлаб чиқариш, режа, ҳисоб-китоб ва факт маълумотлари)" va "Bitrix24/CRM (буюртмалар, карточкалар, статуслар, ҳисоботлар)". AI yangi ERP'da shu eski tizimlardan kelgan tarixiy ma'lumotni ham tahlilga kirita oladimi.
**Nega kerak:** Trend/prognoz uchun tarixiy ma'lumot kerak; faqat yangi ERP'dan boshlasa, AI'da bir necha oy "ko'r" davr bo'ladi.
**Variantlar:**
- A) Ha — A-System/Bitrix24 tarixiy ma'lumoti bir marta import qilinib, AI bazasiga qo'shiladi (ko'chirish kerak).
- B) AI faqat yangi ERP ma'lumotidan boshlaydi — toza, lekin tarix yo'q.
- C) Keyin — hozir kerak emas.

### Q1258. "Назорат варақаси" (control sheet) o'qishini AI tekshiradimi
**Nima:** Hujjatda har vazifa uchun "...вазифасини ўқиб чиққанингизни тасдиқланг" (control sheet — o'qib tasdiqlash) bandlari bor. AI yangi xodim har bandni haqiqatan o'qib-tushunganini (savol berib) tekshiradimi yoki faqat "tasdiqlash" tugmasi bilan qoladimi.
**Nega kerak:** Faqat tugma bossa — formal; AI 1-2 savol bersa, xodim mazmunini tushunganini isbotlaydi.
**Variantlar:**
- A) Ha — AI har назорат варақаси bandidan qisqa savol berib, tushunishni tekshiradi (faqat tugma emas).
- B) Faqat tasdiqlash tugmasi — tez, lekin tushunish isbotlanmaydi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (adaptatsiya), Darslik moduli.

### Q1259. Kunlik/haftalik/oylik hisobotni AI uchchasini birga tayyorlaydimi
**Nima:** Hujjatda majburiyat: "кунлик, ҳафталик ва ойлик ҳисоботларни ўз вақтида раҳбариятга тақдим этади". AI bu uch davriylikni avtomatik tayyorlab, har biri o'z chuqurligida (kunlik=fakt, haftalik=trend, oylik=tahlil+tavsiya) bo'ladimi.
**Nega kerak:** Hozirgi hujjat aynan 3 darajali hisobotni talab qiladi; AI ularni avtomatlashtirsa, rahbar yukini yengillashtiradi.
**Variantlar:**
- A) Ha — uch xil hisobot avtomatik: kunlik (fakt+og'ish), haftalik (trend), oylik (tahlil+tavsiya).
- B) Faqat bitta (haftalik) hisobot — sodda, lekin hujjat talabiga to'liq mos emas.
- C) Keyin — hozir kerak emas.

### Q1260. Hisobotni AI rahbarga "тақдим этади" — kim oladi, kim ko'radi
**Nima:** Hujjatda har hisobot "раҳбариятга тақдим этади" deyilgan (keyingi yuqori daraja). AI hisobotni avtomatik to'g'ri rahbarga (org-strukturadagi manager_id) yo'naltiradimi, har lavozim uchun.
**Nega kerak:** Hisobot noto'g'ri kishiga borsa foydasiz; vertikal org-strukturada har xodim hisoboti aynan o'z bevosita rahbariga borishi kerak.
**Variantlar:**
- A) Ha — AI hisobotni org-strukturadagi bevosita rahbarga (keyingi yuqori daraja) avtomatik yo'naltiradi.
- B) Hamma hisobot bitta umumiy joyga tushadi, rahbar o'zi qidiradi — sodda, lekin tarqoq.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Org-struktura (manager_id), Coordination/CC.

### Q1261. Javobgarlik bandlariga AI bog'lab baho beradimi
**Nima:** Har lavozim hujjatida aniq "Жавобгарликлари" ro'yxati bor (masalan: "бекор туришлар учун", "режа бажарилишини назорат қилмаслик учун", "ички тартиб-қоидаларни бузганлik учун"). AI baho/hisobotni shu javobgarlik bandlariga moslab beradimi.
**Nega kerak:** Baho lavozim javobgarligiga bog'lansa, "nima uchun javobgarsan, shu bo'yicha baholanasan" tamoyili amalda bo'ladi — adolatli va tushunarli.
**Variantlar:**
- A) Ha — har baho/hisobot kartaning javobgarlik bandlariga to'g'ridan-to'g'ri bog'lanadi (qaysi band bo'yicha qanday).
- B) Umumiy baho beradi, javobgarlik bandlariga bog'lamaydi — sodda, lekin mavhum.
- C) Keyin — hozir kerak emas.

### Q1262. Energiya tejash (сув/газ/свет) — AI nazorat qiladimi
**Nima:** Logistika hujjatida javobgarlik: "Энергия ресурсларни тежалиши учун (сув, газ, свет)". AI energiya/resurs sarfini kuzatib, isrofni belgilab beradimi.
**Nega kerak:** Bu real javobgarlik bandi — agar AI nazorat qilmasa, hech kim o'lchamaydi va tejamkorlik faqat qog'ozda qoladi.
**Variantlar:**
- A) Ha — sanab bo'ladigan resurs (счётчик) bo'lsa AI sarfni kuzatadi va isrofga signal beradi (o'lchov uchun IoT/счётчик kerak).
- B) Faqat eslatma beradi, o'lchamaydi — yumshoq.
- C) Keyin — hozir kerak emas (o'lchov asbobi yo'q).

### Q1263. "Бўлим ходимларини доимий баҳолаб боради" — AI rahbarga yordamchi
**Nima:** Dizayn rahbari hujjatida: "Қўл остидаги ходимларнинг иш фаолиятини ДОИМИЙ баҳолаб боради". AI rahbarga har qo'l ostidagi xodim bo'yicha tayyor baho-loyiha (draft) berib, rahbar faqat ko'rib tasdiqlaydigan/tahrirlaydigan rejimda ishlaydimi.
**Nega kerak:** "Doimiy baholash" hujjat majburiyati — rahbar har kuni qo'lda baholay olmaydi; AI draft tayyorlasa, doimiylik real bo'ladi.
**Variantlar:**
- A) Ha — AI har qo'l ostidagi xodim uchun davriy baho-draft tayyorlaydi, rahbar tasdiqlaydi (qaror rahbarda).
- B) Faqat ma'lumot ko'rsatadi, baho-draft yo'q — rahbar to'liq qo'lda.
- C) Keyin — hozir kerak emas.

### Q1264. "Хатоларни тизимли таҳлил қилиш ва олдини олиш" — AI takror-xato aniqlaydimi
**Nima:** Hujjatda muvaffaqiyatli harakat: "Хатоларни тизимли таҳлил қилиш ва олдини олиш" + "сабабларини аниқлаб такрорланмаслиги учун тизимли чоралар". AI bir xil xato takror sodir bo'layotganini aniqlab, ildiz-sababini ko'rsatadimi.
**Nega kerak:** Yakka xato — tasodif; takror xato — tizimli muammo. AI takrorni topsa, rahbar ildizni tuzatadi, har safar alohida emas.
**Variantlar:**
- A) Ha — AI xatolarni guruhlab, takrorlanuvchilarini ajratadi va ehtimoliy ildiz-sababni ko'rsatadi.
- B) Har xatoni alohida belgilaydi, takror bog'lanmaydi — sodda, lekin tizimli ko'rinmaydi.
- C) Keyin — hozir kerak emas.

### Q1265. "Эҳтиёжларни олдиндан ҳис қилиш" — AI talabni oldindan ogohlantiradimi
**Nima:** Logistika hujjatida muvaffaqiyatli harakat: "Ишлаб чиқариш участкалари эҳтиёжларини ОЛДИНДАН ҲИС қилиш". AI keyingi 24 soat rejasidan kelib chiqib, qaysi uchastkaga qachon nima (yarim tayyor, poddon, material) kerakligini oldindan ogohlantiradimi.
**Nega kerak:** Bu hujjatda ko'zlangan ideal ish uslubi — AI rejani o'qib oldindan signal bersa, "бекор туриш" kamayadi.
**Variantlar:**
- A) Ha — AI 1-sutkalik ishlab chiqarish rejasidan ehtiyojni oldindan hisoblab, logistikaga signal beradi.
- B) Faqat hozirgi yetishmovchilikni ko'rsatadi (reaktiv) — kech.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Ishlab chiqarish (MPS/MRP), Ombor.

### Q1266. AI tahlilida qaysi tilni manba sifatida o'qiydi (kirill hujjatlar)
**Nima:** Real hujjatlar kirill o'zbek/rus aralash ("ЦКП", "бекор туриш", "Должностная инструкция"). AI eski hujjat/ma'lumotni kirill-o'zbek va rus tilida ham to'g'ri tushunadimi.
**Nega kerak:** Zavod hujjatlari va eski yozuvlar kirill/rus; AI faqat lotin tushunsa, real ma'lumotning katta qismini o'qiy olmaydi.
**Variantlar:**
- A) Ha — AI kirill o'zbek + rus + lotin o'zbekni birdek o'qiydi va tahlil qiladi.
- B) Faqat lotin o'zbek — eski hujjatlar tushib qoladi.
- C) Keyin — hozir kerak emas.

### Q1267. AI xulosasini odam qo'lda bekor qila oladimi (override + sabab)
**Nima:** AI bergan baho/belgilashni rahbar/HR "noto'g'ri" deb bekor qila olsa, sabab yozib o'zgartira oladimi va bu AI'ga o'rganish uchun qaytadimi.
**Nega kerak:** Hujjat tamoyili — qaror odamda; AI adashishi mumkin. Override + sabab bo'lmasa, noto'g'ri baho saqlanib qoladi va AI yaxshilanmaydi.
**Variantlar:**
- A) Ha — har AI xulosasini odam sabab bilan bekor qila/tahrirlay oladi; tuzatish AI'ga teskari bog'lanish bo'lib qaytadi.
- B) AI xulosasi o'zgarmas, odam faqat e'tiroz yozadi (alohida) — kuzatiladi, lekin tuzatilmaydi.
- C) Keyin — hozir kerak emas.

### Q1268. AI baho/xulosasi uchun "isbot havolasi" (audit izi) bo'ladimi
**Nima:** AI "bu xodim 3 ta kechikish qildi" desa, har raqam ortida aniq hodisa havolasi (qaysi kun, qaysi buyurtma, qaysi log) ko'rinadimi.
**Nega kerak:** Hujjatda baho "холис" bo'lishi shart; isbot havolasi bo'lmasa, AI raqamiga ishonib bo'lmaydi va nizoda himoyalab bo'lmaydi.
**Variantlar:**
- A) Ha — har ko'rsatkich/xulosa ortida tagidagi hodisalar ro'yxati (drill-down) ko'rinadi.
- B) Faqat yakuniy raqam, isbot yo'q — ixcham, lekin ishonchsiz.
- C) Keyin — hozir kerak emas.

### Q1269. AI noaniq/ma'lumot yetmaganda nima qiladi
**Nima:** Ma'lumot yetishmasa (masalan IoT yo'q, hisobot kelmagan) AI taxmin qilib raqam beradimi yoki "ma'lumot yetarli emas" deb ochiq aytadimi.
**Nega kerak:** "Yashil lekin noto'g'ri" (taxminni fakt ko'rsatish) — eng xavfli xato; AI rostgo'y bo'lishi kerak.
**Variantlar:**
- A) AI ma'lumot yetmasa ochiq aytadi ("ishonch past / ma'lumot yetarli emas"), taxminni fakt qilib bermaydi.
- B) Bo'shliqni o'rtacha bilan to'ldirib, ishonch ko'rsatmaydi — silliq, lekin chalg'ituvchi.
- C) Keyin — hozir kerak emas.

### Q1270. AI ogohlantirishlari uchun ostona (threshold) kim belgilaydi
**Nima:** AI qachon signal beradi — har kichik og'ishdami yoki ma'lum ostonadan oshgandami? Ostonani kim sozlaydi (rahbar/HR/direktor).
**Nega kerak:** Juda past ostona = shovqin (hamma e'tiborsiz qoldiradi); juda yuqori = kech anglash. Sozlanadigan bo'lishi kerak.
**Variantlar:**
- A) Sozlanadigan ostona — har ko'rsatkich uchun rahbar/HR chegarani o'rnatadi, AI shunga qarab signal beradi.
- B) AI o'zi qat'iy standart ostona ishlatadi — sodda, lekin moslashuvchan emas.
- C) Keyin — hozir kerak emas.

### Q1271. Bir hodisa ikki kartaga tegishli bo'lsa AI kimga yozadi
**Nima:** Bir kechikish ham logistikaga, ham ishlab chiqarishga tegishli bo'lishi mumkin. AI aybni/ko'rsatkichni kimga yozadi — ikkalasiga, asosiy sababkorga, yoki rahbar hal qiladimi.
**Nega kerak:** Noto'g'ri kartaga yozilsa, baho adolatsiz bo'ladi; org-zanjirda "kim javobgar" aniqligi kerak.
**Variantlar:**
- A) AI asosiy sababkorni taxmin qilib belgilaydi, lekin "bog'liq kartalar"ni ham ko'rsatadi; nizoda rahbar hal qiladi.
- B) Avtomatik ikkalasiga ham yozadi — ikki marta jazo xavfi.
- C) Keyin — hozir kerak emas.

### Q1272. AI prognozi noto'g'ri chiqsa, o'zini tuzatadimi (aniqlikni kuzatish)
**Nima:** AI "keyingi hafta xavf" deb prognoz qilsa-yu, xavf bo'lmasa — AI prognoz aniqligini kuzatib, kelajakda yaxshilaydimi.
**Nega kerak:** Aniqligi tekshirilmagan prognozga ishonib bo'lmaydi; o'z-o'zini tuzatmaydigan prognoz vaqt o'tib "bo'ri keldi" effektiga aylanadi.
**Variantlar:**
- A) Ha — AI har prognozni keyin haqiqat bilan solishtiradi, aniqlik foizini ko'rsatadi va modelni moslaydi.
- B) Prognoz beradi, aniqligini kuzatmaydi — sodda, lekin ishonch o'lchanmaydi.
- C) Keyin — hozir kerak emas.

### Q1273. Yangi xodim uchun AI bahosi "moslashish davri" bilan yumshatiladimi
**Nima:** Yangi kelgan xodim hali o'rganmoqda — AI uni tajribali xodim bilan bir xil qattiq baholaydimi yoki dastlabki davrda yumshoqroq (o'sish trendiga qarab) baholaydimi.
**Nega kerak:** Hujjatda o'qish/назорат варақаси davri bor — yangi xodimni darrov qattiq baholash adolatsiz va ko'nglini qoldiradi.
**Variantlar:**
- A) Ha — AI moslashish davrini biladi, yangi xodimni absolyut emas, o'sish trendiga qarab baholaydi.
- B) Hamma bir xil qattiq baholanadi — oddiy, lekin yangilarga adolatsiz.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (adaptatsiya), Darslik.

### Q1274. AI bahosi xodimga qanday yetkaziladi (ohang)
**Nima:** AI bergan kamchilik/baho xodimga qanday ko'rinishda yetadi — quruq ayblov sifatidami yoki "yaxshilash uchun maslahat" ohangidami.
**Nega kerak:** Hujjat "ривожланиш учун шароит яратиш"ni talab qiladi; ayovsiz ohang motivatsiyani o'ldiradi, qurilish ohangi o'stiradi.
**Variantlar:**
- A) Quriluvchi ohang — kamchilik + aniq yaxshilash qadami birga (jazo emas, o'sish yo'nalishi).
- B) Quruq raqam/ayblov — aniq, lekin demotivatsiya.
- C) Keyin — hozir kerak emas.

### Q1275. AI tavsiyasini "rad etish" ham yoziladimi (qaror jurnali)
**Nima:** Rahbar AI tavsiyasini rad etsa (masalan "bonus berma"ni e'tiborsiz qoldirsa), bu qaror sabab bilan jurnaliga yoziladimi.
**Nega kerak:** Keyin natija yomon chiqsa, "nega AI tavsiyasi e'tiborsiz qoldi" deb ko'rib bo'ladi; shaffoflik va mas'uliyat uchun.
**Variantlar:**
- A) Ha — AI tavsiyasi + qabul/rad + sabab qaror jurnaliga yoziladi (audit uchun).
- B) Faqat bajarilgan qaror yoziladi, rad etilgani izsiz — sodda, lekin shaffoflik yo'q.
- C) Keyin — hozir kerak emas.

### Q1276. AI tahlili qaysi davrni qamraydi (oyna)
**Nima:** AI baho/trendni qancha davr ma'lumotidan hisoblaydi — oxirgi hafta, oy, chorak? Davr sozlanadimi.
**Nega kerak:** Qisqa oyna — vaqtinchalik tebranishga sezgir; uzun oyna — sekin sezadi. Ko'rsatkichga qarab to'g'ri oyna kerak.
**Variantlar:**
- A) Har ko'rsatkich uchun mos standart oyna (kunlik fakt / haftalik trend / oylik baho) + sozlash imkoni.
- B) Hamma uchun bitta qat'iy oyna — sodda, lekin universal emas.
- C) Keyin — hozir kerak emas.

### Q1277. AI xodimlarni bir-biri bilan solishtiradimi (reyting) — qanday adolatli
**Nima:** Vizyon "boshqa xodimlar bilan solishtirish"ni eslatadi. AI bir kartadagi (bir xil lavozim) xodimlarni o'zaro solishtirib reyting beradimi, va turli lavozimlarni aralashtirmaslikni ta'minlaydimi.
**Nega kerak:** Mashinachini dizaynerga solishtirish adolatsiz; faqat bir xil karta/lavozim ichida solishtirish ma'noli.
**Variantlar:**
- A) Ha — solishtirish faqat bir xil karta/lavozim ichida; turli lavozimlar aralashmaydi.
- B) Umumiy ball bo'yicha hammani aralash reyting — sodda, lekin adolatsiz.
- C) Faqat individual baho, solishtirish yo'q.
- D) Keyin — hozir kerak emas.

### Q1278. AI ma'lumotni qancha vaqt saqlaydi (xodim tarixi)
**Nima:** AI bahosi va xodim ko'rsatkich tarixi qancha vaqt saqlanadi — ishdan ketsa o'chiriladimi yoki arxivda qoladimi.
**Nega kerak:** Tarix juda uzoq saqlansa maxfiylik/huquqiy masala; juda qisqa bo'lsa trend va vorislik tahlili yo'qoladi.
**Variantlar:**
- A) Aktiv davr + belgilangan arxiv muddati (masalan ishdan ketgach N yil), keyin anonimlashtirish.
- B) Cheksiz saqlaydi — to'liq tarix, lekin maxfiylik xavfi.
- C) Keyin — hozir kerak emas.

### Q1279. AI maxfiy hisobotni (PIP/eNPS kabi) ko'ra oladimi
**Nima:** Ba'zi ma'lumot maxfiy (shaxsiy yaxshilash rejasi, anonim so'rov). AI tahlil qilganda maxfiy maydonlarni hisobga olmaydimi yoki faqat ruxsat doirasida ko'radimi.
**Nega kerak:** AI butun ma'lumotni ko'rsa, maxfiy ma'lumot xulosa orqali sizib chiqishi mumkin (MEMORY: PIP/eNPS fail-open muammosi bo'lgan).
**Variantlar:**
- A) AI maxfiy maydonlarni faqat tegishli ruxsat (HR/direktor) doirasida ishlatadi, oddiy xulosaga chiqarmaydi.
- B) AI hamma narsani ko'radi — kuchli, lekin maxfiylik sizishi xavfi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Xavfsizlik (RBAC), HR maxfiylik.

### Q1280. AI ishlamay qolsa ERP ishlashda davom etadimi
**Nima:** AI xizmati (provayder) vaqtincha ishlamasa, baho/hisobot kechiksa — ERP'ning qolgan qismi (oylik, hisobot kiritish) ishlayveradimi yoki to'xtaydimi.
**Nega kerak:** AI = yordamchi qatlam; u qulasa butun zavod to'xtamasligi kerak. Oylik gate AI'ga bog'liq bo'lsa, AI qulasa oylik to'xtaydi — xavfli.
**Variantlar:**
- A) AI qulasa ERP ishlaydi; AI'ga bog'liq qarorlar (gate/bonus) kechiktiriladi yoki qo'lda davom etadi.
- B) AI butun jarayonga qattiq bog'lab qo'yiladi — AI qulasa ko'p narsa to'xtaydi.
- C) Keyin — hozir kerak emas.

### Q1281. AI "холислик"ni qanday ta'minlaydi (tanaffus/dam olishni hisobga olish)
**Nima:** AI baholaganda ruxsat etilgan tanaffus, ta'til, kasallik, planli to'xtashni "yomon ko'rsatkich" deb hisoblamasligi kerak. Bu istisnolarni biladimi.
**Nega kerak:** Hujjat "холис" baho talab qiladi; ruxsat etilgan yo'qlikni jazo deb hisoblash adolatsiz va noto'g'ri.
**Variantlar:**
- A) Ha — AI tasdiqlangan ta'til/kasallik/planli to'xtashni istisno qilib, faqat real ish davrini baholaydi.
- B) Hamma yo'qlikni bir xil hisoblaydi — sodda, lekin adolatsiz.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (davomat, ta'til), Oylik.

### Q1282. AI bir lavozim uchun "ideal profil"ni ham chiqaradimi
**Nima:** Eng yaxshi ishlovchilar ma'lumotidan AI shu karta uchun "ideal ko'rsatkich profili" (etalon)ni chiqarib, qolganlarni shunga solishtiradimi.
**Nega kerak:** Mutlaq raqam emas, real eng yaxshi natijaga nisbatan baho ko'proq ma'noli va erishsa bo'ladigan maqsad beradi.
**Variantlar:**
- A) Ha — AI har karta uchun real eng yaxshilardan etalon profil tuzadi, baho shunga nisbatan beriladi.
- B) Faqat oldindan belgilangan qat'iy norma — sodda, lekin haqiqatdan uzilgan bo'lishi mumkin.
- C) Keyin — hozir kerak emas.

### Q1283. AI darslik/o'qish tavsiyasini ko'rsatkich tushganda beradimi
**Nima:** Hujjatda "ўқиш жараёни" maqsadi — bilim va malaka shakllantirish. Xodim ko'rsatkichi tushsa, AI aynan qaysi darslik/mavzuni qayta o'rganishni tavsiya qiladimi.
**Nega kerak:** Tushishni faqat belgilash kifoya emas; sababga mos darslik bilan bog'lasa, o'sish amaliy bo'ladi (vizyon: darslik kartaga biriktirilgan).
**Variantlar:**
- A) Ha — AI tushgan ko'rsatkichga mos darslik/mavzuni tavsiya qiladi va o'qishni tayinlaydi.
- B) Faqat tushishni belgilaydi, darslik bog'lanmaydi — uzilgan.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Darslik moduli, HR.

### Q1284. AI hisobotida "geometriya" — matn, jadval yoki grafik
**Nima:** AI xulosasi qanday ko'rinishda — faqat matn, jadval, yoki grafik (trend chizig'i)? Rahbar uchun qaysi shakl standart bo'ladi.
**Nega kerak:** Trend grafik bilan, taqqoslash jadval bilan, sabab matn bilan yaxshi tushuniladi; aralash to'g'ri ishlatilishi kerak.
**Variantlar:**
- A) Aralash standart — qisqa matn (xulosa+sabab) + asosiy raqamlar jadval + trend grafik; har biri o'rnida.
- B) Faqat matn — sodda, lekin taqqoslash/trend ko'rinmaydi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Dizayn-tizim (UI shablon, Qoida 21/41).

### Q1285. AI "1-сутка режа"sini real bajarilish bilan har kun solishtiradimi
**Nima:** Hujjatda "1 суткалик ишлаб чиқариш режаси" har kuni tuziladi. AI har kun yopilganda reja↔fakt farqini avtomatik solishtirib, ertangi rejaga ta'sirini ko'rsatadimi.
**Nega kerak:** Bugungi og'ish ertangi rejaga ko'chadi; AI bog'lasa, "bekor turish"ning ketma-ket ta'siri ko'rinadi.
**Variantlar:**
- A) Ha — AI har kun reja↔fakt farqini hisoblab, og'ishning ertangi rejaga ta'sirini ko'rsatadi.
- B) Faqat kunlik fakt, ertangi rejaga bog'lamaydi — sodda, lekin uzilgan.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Ishlab chiqarish (MPS/rejalashtirish).

### Q1286. AI yangi karta yaratilganda ko'rsatkich va darslikni taklif qiladimi
**Nima:** Yangi lavozim-karta yaratilayotganda AI o'xshash kartalardan namuna olib, "статистик кўрсаткичлар", "типик хатолар", "ЦКП" va darslik to'plamini avtomatik taklif qiladimi.
**Nega kerak:** Har kartani noldan yozish sekin; AI namuna bersa, HR tezroq to'liq karta tuzadi va izchillik bo'ladi.
**Variantlar:**
- A) Ha — AI o'xshash kartalardan ko'rsatkich/xato/ЦКП/darslik to'plamini taklif qiladi, HR tahrirlab tasdiqlaydi.
- B) HR noldan qo'lda yozadi — aniq, lekin sekin va nomuvofiq.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (karta yaratish), Darslik.

### Q1287. AI rahbar va xodim baholarini solishtiradimi (kelishmovchilik signali)
**Nima:** Hujjatda rahbar qo'l ostidagini baholaydi; AI ham baholaydi. Ikkalasi keskin farq qilsa (rahbar "yaxshi" deydi, AI "yomon" ko'rsatadi) AI bu kelishmovchilikni belgilab beradimi.
**Nega kerak:** Farq — yo rahbar xolis emas, yo AI adashgan; ikkalasini ham tekshirishga sabab bo'ladi.
**Variantlar:**
- A) Ha — AI rahbar bahosi bilan o'z bahosini solishtiradi, katta farqni HR/direktorga signal qiladi.
- B) Ikki baho alohida saqlanadi, solishtirilmaydi — sodda, lekin ziddiyat yashirin qoladi.
- C) Keyin — hozir kerak emas.

### Q1288. AI bashorati pessimistik/optimistik diapazon beradimi
**Nima:** AI prognozni bitta raqam bilan beradimi yoki diapazon (eng yomon — kutilgan — eng yaxshi) bilan beradimi.
**Nega kerak:** Bitta raqam soxta aniqlik beradi; diapazon noaniqlikni rost ko'rsatadi va rahbar xavfga tayyorlanadi (MEMORY: strategic-agent 0.7/1.3 pessimistic/optimistic mavjud).
**Variantlar:**
- A) Ha — prognoz diapazon bilan (pessimistik/kutilgan/optimistik) + ishonch darajasi.
- B) Bitta raqam — sodda, lekin soxta aniqlik.
- C) Keyin — hozir kerak emas.

### Q1289. AI "tijorat siri" ma'lumotini tashqariga chiqarmasligi kafolati
**Nima:** Hujjat "тижорат сирлари"ni himoya qilishni qat'iy talab qiladi (jiноят kodeksi). AI tashqi provayderga yuborilganda maxfiy ma'lumot (mijoz, narx, dizayn fayl) chiqib ketmasligi qanday kafolatlanadi.
**Nega kerak:** AI tashqi xizmatga ma'lumot yuborsa, tijorat siri sizishi mumkin — bu huquqiy javobgarlik (kitobda aniq yozilgan).
**Variantlar:**
- A) Maxfiy ma'lumot tashqi AI'ga yuborilmaydi (anonimlash/maskalash yoki ichki model), faqat zarur minimal kontekst.
- B) To'liq ma'lumot tashqi provayderga yuboriladi — kuchli, lekin sir sizishi xavfi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Xavfsizlik, Q-30 (secret).

### Q1290. Bir nechta xodim bir kartaga bog'langanda AI qanday baholaydi
**Nima:** Bitta kartaga (lavozim) bir necha xodim biriktirilgan bo'lishi mumkin (smenalar). AI har birini alohida baholaydimi yoki karta bo'yicha jamlaydimi.
**Nega kerak:** Karta-markazli modelda karta asosiy, xodim ikkilamchi; baho ikkalasini ham (individual + karta) ko'rsatishi kerak (MEMORY: org_card_centric).
**Variantlar:**
- A) Ikkala daraja — har xodim individual + karta bo'yicha jamlanган ko'rsatkich.
- B) Faqat karta bo'yicha jamlangan — sodda, lekin individual mas'uliyat yo'qoladi.
- C) Keyin — hozir kerak emas.

### Q1291. AI tushuntirishi qanchalik chuqur (oddiy xodim vs rahbar)
**Nima:** AI bir xil tushuntirishni hammaga beradimi yoki kimga ko'rsatilayotganiga qarab (oddiy xodimga sodda, rahbarga batafsil tahlil) moslaydimi.
**Nega kerak:** Oddiy xodimga texnik tahlil tushunarsiz; rahbarga yuzaki xulosa yetarli emas. Auditoriyaga moslash kerak.
**Variantlar:**
- A) Ha — AI auditoriyaga qarab chuqurlikni moslaydi (xodim=sodda+amaliy qadam, rahbar=tahlil+sabab).
- B) Hammaga bir xil — sodda, lekin yo tushunarsiz yo yuzaki.
- C) Keyin — hozir kerak emas.

### Q1292. AI o'zgarish (yangilik) joriy etilganda ta'sirini kuzatadimi
**Nima:** Rahbar bir o'zgarish kiritsa (yangi qoida, jarayon), AI o'sha o'zgarishdan keyin ko'rsatkich yaxshilandi/yomonlashganini avtomatik kuzatib hisobot beradimi.
**Nega kerak:** Hujjat "тизимли чоралар"ni talab qiladi; chora ishladimi yoki yo'q — AI o'lchamasa, bilib bo'lmaydi.
**Variantlar:**
- A) Ha — kiritilgan o'zgarish sanasidan oldin/keyin ko'rsatkichni solishtirib, ta'sirni baholaydi.
- B) O'zgarish kuzatilmaydi, AI faqat joriy holatni ko'rsatadi — uzilgan.
- C) Keyin — hozir kerak emas.

### Q1293. AI smenalararo/bo'limlararo "estafeta" uzilishini topadimi
**Nima:** Logistika hujjatida "участкалар ўртасидаги ҳаракатларни мувофиқлаштириш" — ish bir bo'limdan ikkinchisiga o'tadi. AI topshiriq bir bo'limdan ikkinchisiga o'tishda qayerda qotib qolayotganini (estafeta uzilishi) aniqlaydimi.
**Nega kerak:** Tor joy ko'pincha bo'lim ichida emas, "uzatish" nuqtasida; AI shuni topsa, asl sabab ko'rinadi.
**Variantlar:**
- A) Ha — AI ish-o'tish (bo'lim→bo'lim) nuqtalaridagi kutish vaqtini o'lchaydi va eng sekin uzatmani ko'rsatadi.
- B) Faqat bo'lim ichidagi vaqtni o'lchaydi — uzatma nuqtasi yashirin.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Coordination/workflow, Ishlab chiqarish.

### Q1294. AI ko'rsatkichni xodim o'ziga real vaqtda ko'rsatadimi (o'z-o'zini nazorat)
**Nima:** Xodim o'z joriy ko'rsatkichini (bugun necha %, qancha og'ish) real vaqtda ko'rib turadimi — kun oxirida emas, davomida.
**Nega kerak:** Hujjat "ўз вақтида хато ёки оғишларни аниқлаш"ni o'rgatadi; xodim o'zi real vaqtda ko'rsa, kun oxirini kutmay tuzatadi.
**Variantlar:**
- A) Ha — xodim o'z joriy ko'rsatkichini real vaqtda ko'radi (o'zini nazorat qiladi), kun oxirini kutmaydi.
- B) Faqat kun/hafta oxirida ko'radi — kech, tuzatish imkoni o'tib ketadi.
- C) Keyin — hozir kerak emas.

### Q1295. AI direktor uchun "kunlik 3 ta eng muhim narsa"ni ajratadimi
**Nima:** Direktorga butun zavod ma'lumoti ko'p; AI har kuni faqat eng muhim 3-5 narsa (eng katta xavf/imkoniyat)ni tepaga chiqarib beradimi.
**Nega kerak:** Hamma narsani ko'rsatish = hech narsa ko'rsatmaslik; rahbar diqqatini eng muhimga qaratish kerak.
**Variantlar:**
- A) Ha — AI har kuni direktorga eng muhim 3-5 narsani saralab beradi (qolgani drill-down).
- B) Hamma ko'rsatkichni teng ko'rsatadi — to'liq, lekin diqqat tarqaydi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: Direktor-AI, Dashboard.

### Q1296. AI ma'lumotni qanchalik tez yangilaydi (real-time vs batch)
**Nima:** AI ko'rsatkich/baho ma'lumotni har hodisada darhol yangilaydimi yoki kuniga bir marta (tunda) hisoblaydimi.
**Nega kerak:** Real-time qimmat va shovqinli; batch arzon lekin kechikadi. Qaror turi (operatsion vs strategik) bo'yicha to'g'ri tanlash kerak.
**Variantlar:**
- A) Aralash — kunlik gate/operatsion narsa real vaqtga yaqin, trend/baho tunda batch.
- B) Hamma narsa tunda bir marta — arzon, lekin kun davomida eskirgan.
- C) Hamma narsa real-time — yangi, lekin qimmat va shovqin.
- D) Keyin — hozir kerak emas.

### Q1297. AI bir xodimda "charchash/tushish boshlanishi"ni erta sezadimi
**Nima:** AI bir xodimning ko'rsatkichi sekin-asta pasaya boshlaganini (hali yomon emas, lekin trend pastga) erta sezib ogohlantiradimi.
**Nega kerak:** Yiqilgandan keyin emas, yiqilish boshida aralashish arzon va samarali; HR oldindan gaplashadi.
**Variantlar:**
- A) Ha — AI sekin pasayish trendini (hali ostonadan oshmasdan) sezadi va erta ogohlantiradi.
- B) Faqat ostonadan o'tganda signal beradi — kech.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (eNPS, PIP).

### Q1298. AI "Назорат варақаси" o'qilmagan bandlarni belgilab boradimi
**Nima:** Yangi xodim назорат варақаси bandlarining bir qismini o'qib-tasdiqlamasa, AI qaysi bandlar qoldi/qaysi muddatda deb kuzatib, eslatadimi.
**Nega kerak:** Hujjatda har band alohida tasdiqlanishi shart; ba'zilari o'tkazib yuborilsa, xodim to'liq tayyor emas.
**Variantlar:**
- A) Ha — AI o'qilmagan bandlarni kuzatadi, muddatda eslatadi, to'liq bo'lmaguncha xodimni "tayyor" deb belgilamaydi.
- B) Faqat umumiy "tugatdi/tugatmadi" — band darajasi yo'q.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (adaptatsiya), Darslik.

### Q1299. AI bir bo'lim "сабабчи zanjir"ini chizadimi (ildiz→oqibat)
**Nima:** AI muammoni faqat ko'rsatmay, sabab-oqibat zanjirini chizadimi (masalan: "reja kech keldi → logistika kechikdi → mashina bekor turdi → buyurtma kechikdi").
**Nega kerak:** Rahbar zanjirning ildizini ko'rsa, oxirgi belgini emas, asl sababni tuzatadi.
**Variantlar:**
- A) Ha — AI sabab-oqibat zanjirini ko'rsatadi va ildiz nuqtani belgilaydi.
- B) Faqat oxirgi oqibatni (kechikdi) ko'rsatadi — sabab yashirin.
- C) Keyin — hozir kerak emas.

### Q1300. AI baholash mezonini o'zgartirishni kim tasdiqlaydi (governance)
**Nima:** AI qaysi mezon bilan baholashini (formula, og'irlik, osona) kim o'zgartira oladi — har rahbarmi yoki faqat HR/direktor tasdig'i bilanmi.
**Nega kerak:** Har kim o'z bo'limi mezonini o'zgartira olsa, AI butun zavodda izchil bo'lmaydi va "qulay" baho yasash mumkin.
**Variantlar:**
- A) Mezon o'zgarishi markaziy (HR/direktor) tasdig'i bilan, o'zgarish jurnaliga yoziladi — izchil va shaffof.
- B) Har rahbar o'z bo'limini sozlaydi — moslashuvchan, lekin izchillik buziladi.
- C) Keyin — hozir kerak emas.

### Q1301. AI o'lik (ma'lumot kelmayotgan) kartani aniqlaydimi
**Nima:** Bir karta bo'yicha uzoq vaqt hech qanday ma'lumot (hisobot, hodisa) kelmasa — AI "bu karta o'lik/ishlamayapti yoki ma'lumot ulanmagan" deb belgilaydimi.
**Nega kerak:** Ma'lumotsiz karta = AI uchun ko'r nuqta; bilmasdan "hammasi yaxshi" deb o'ylash xavfli (MEMORY: ko'p event 0-listener).
**Variantlar:**
- A) Ha — AI ma'lumot kelmayotgan kartalarni alohida ro'yxatga oladi va sababini (ulanmagan / ishlamayapti) so'raydi.
- B) Ma'lumot yo'q kartani e'tiborsiz qoldiradi — jim ko'r nuqta.
- C) Keyin — hozir kerak emas.

### Q1302. AI mavsumiy/davriy naqshni hisobga oladimi
**Nima:** Ba'zi ko'rsatkichlar tabiiy davriy (oy oxiri band, dushanba sekin, mavsumiy buyurtma). AI bu naqshni "muammo" deb noto'g'ri belgilamasligi uchun biladimi.
**Nega kerak:** Davriy tushishni anomaliya deb belgilash — soxta signal va shovqin.
**Variantlar:**
- A) Ha — AI takroriy davriy naqshni o'rganadi, normal davriylikni anomaliyadan ajratadi.
- B) Davriylikni bilmaydi, har tushishni signal qiladi — ko'p soxta signal.
- C) Keyin — hozir kerak emas.

### Q1303. AI hisobotini eksport/imzolash — rasmiy hujjat bo'ladimi
**Nima:** Statistik ko'rsatkich hisobotini AI rasmiy formatda (sana, mas'ul, imzo joyi) chiqarib, arxivlanadigan hujjat sifatida saqlaydimi — eski "Йўриқномани тасдиқловчи" formatga o'xshash.
**Nega kerak:** Hujjatlarda imzo+sana formatlari bor; AI hisoboti rasmiy bo'lsa, nizoda dalil va arxivda izchil bo'ladi.
**Variantlar:**
- A) Ha — AI hisobotini rasmiy shaklda (sana+mas'ul+imzo joyi) eksport qiladi, arxivga tushadi.
- B) Faqat ekran ko'rinishi — tez, lekin rasmiy emas.
- C) Keyin — hozir kerak emas.

### Q1304. AI bir vaqtning o'zida ko'p hodisani tartiblay oladimi (ustuvorlik)
**Nima:** Bir vaqtda ko'p signal/muammo chiqsa (5 ta bekor turish, 3 ta kechikish), AI ularni jiddiylik/ta'sir bo'yicha tartiblab, eng muhimini birinchi qo'yadimi.
**Nega kerak:** Rahbar hammasiga birdek qaray olmaydi; AI tartiblamasa, eng katta muammo kichigi ostida ko'milib qoladi.
**Variantlar:**
- A) Ha — AI signallarni ta'sir+jiddiylik+xarajat bo'yicha tartiblaydi, eng muhimni tepaga qo'yadi.
- B) Vaqt tartibida (kelgan tartibda) ko'rsatadi — sodda, lekin ustuvorlik yo'q.
- C) Keyin — hozir kerak emas.

### Q1305. AI xodim e'tirozini (shikoyat) qabul qilib, qarорга qaytaradimi
**Nima:** Xodim AI bahosiga "noto'g'ri, men ta'tilda edim" deb e'tiroz bildirsa, bu e'tiroz qayerga boradi va AI/rahbar qayta ko'rib chiqadimi.
**Nega kerak:** Hujjatda xodim huquqlari bor; e'tirozsiz baho — bir tomonlama va adolatsiz. E'tiroz kanali bo'lishi kerak.
**Variantlar:**
- A) Ha — xodim har AI bahosiga e'tiroz bildira oladi, e'tiroz rahbarga boradi va qayta ko'rib chiqiladi.
- B) E'tiroz kanali yo'q, baho yakuniy — sodda, lekin adolatsiz.
- C) Keyin — hozir kerak emas.

### Q1306. AI o'zining ishonch darajasini har xulosada ko'rsatadimi
**Nima:** Har AI xulosasi yonida "ishonch darajasi" (yuqori/o'rta/past) ko'rinadimi — ma'lumot sifati/miqdoriga qarab.
**Nega kerak:** Past ishonchli xulosani yuqori ishonchli kabi qabul qilish xato qarорга olib keladi; rahbar ishonch darajasini bilib turishi kerak.
**Variantlar:**
- A) Ha — har xulosa yonida ishonch darajasi + nega (ma'lumot yetarli/yetarsiz) ko'rsatiladi.
- B) Ishonch ko'rsatilmaydi — ixcham, lekin chalg'ituvchi.
- C) Keyin — hozir kerak emas.

### Q1307. AI til/atama izchilligini ta'minlaydimi (ЦКП, бекор туриш...)
**Nima:** Hujjatlarda aniq atamalar bor (ЦКП, бекор туриш, режадан оғиш, назорат варақаси). AI hisobot/javoblarida shu zavod atamalaridan izchil foydalanadimi yoki o'z so'zlarini ishlatadimi.
**Nega kerak:** AI har safar boshqa so'z ishlatsa, xodimlar chalg'iydi; zavod atamasiga sodiq bo'lsa, hamma bir tilda gaplashadi.
**Variantlar:**
- A) Ha — AI zavodning rasmiy atamalar lug'atidan (ЦКП, бекор туриш...) izchil foydalanadi.
- B) AI erkin so'z ishlatadi — moslashuvchan, lekin chalkash.
- C) Keyin — hozir kerak emas.

### Q1308. AI bir karta bo'yicha "kim eng yaxshi o'rgatadi" (murabbiy) topadimi
**Nima:** Yangi xodim qiynalsa, AI shu kartada eng yaxshi ishlovchi xodimni "murabbiy" sifatida tavsiya qiladimi (ichki bilim uzatish).
**Nega kerak:** Hujjat "малакасини ошириш ва ривожланиш"ni talab qiladi; eng yaxshidan o'rganish darslikdan ko'ra ham amaliy.
**Variantlar:**
- A) Ha — AI ko'rsatkich asosida eng yaxshi xodimni murabbiy sifatida taklif qiladi (rahbar tasdiqlaydi).
- B) Murabbiylikni faqat rahbar qo'lda belgilaydi, AI aralashmaydi.
- C) Keyin — hozir kerak emas.
⤳ Ta'sir: HR (vorislik), Darslik.

### Q1309. AI "soxta hisobot"ni statistik tarzda ham sezadimi
**Nima:** Xodim har kuni bir xil "100% bajardim" deb yozsa (haqiqatga o'xshamasligi statistik ravshan), AI bu naqshni shubhali deb belgilaydimi — faqat kamera emas, raqam naqshidan ham.
**Nega kerak:** Doim mukammal hisobot — odatda yolg'on belgisi; AI statistik anomaliyani sezsa, kamera bo'lmagan joyda ham yolg'onni ushlaydi.
**Variantlar:**
- A) Ha — AI g'ayritabiiy bir tekis/mukammal hisobot naqshini shubhali deb belgilaydi (kameradan mustaqil).
- B) Faqat kamera kross-tekshiruviga tayanadi — kamera yo'q joyda ko'r.
- C) Keyin — hozir kerak emas.

### Q1310. AI o'z xatosini tan oladimi (kalibrlash hisoboti)
**Nima:** AI vaqti-vaqti bilan "men o'tgan oy nechta narsani to'g'ri/noto'g'ri bashorat qildim" degan o'z-aniqlik hisobotini berib turadimi.
**Nega kerak:** AI'ga ishonch uning aniqligi tarixiga asoslanishi kerak; o'zini hisobga bermaydigan AI ko'r ishonchga olib keladi.
**Variantlar:**
- A) Ha — AI davriy o'z-aniqlik (kalibrlash) hisobotini beradi, qayerda yaxshi/yomon ekanini ochiq ko'rsatadi.
- B) AI hech qachon o'zini hisobga bermaydi — sodda, lekin ishonch o'lchanmaydi.
- C) Keyin — hozir kerak emas.

DONE: AI — 61.

## 18. Bildirishnoma / Telegram

### Q1311. "Yozma" xabar majburiy bo'lgan qarorlar avtomatik qayd etilsinmi
**Nima:** Oргполитика "Қарорлар, режа ўзгаришлари, вазифалар, техкарта ўзгаришлари, сифат хулосалари, расмий огоҳлантиришлар фақат ёзма" deydi — shu turdagi xabar Telegramdan yuborilganda tizim uni avtomatik ERP'ga rasmiy yozma yozuv qilib saqlasinmi.
**Nega kerak:** Hujjat "Ёзма қайдсиз қарор қабул қилинган деб ҳисобланмайди" deydi — Telegram og'zaki kanal sifatida qolsa, qaror rasmiy bo'lmaydi.
**Variantlar:**
- A) Bu 6 turdagi xabar Telegramdan kelsa, avtomatik rasmiy yozuvga aylanadi (raqam + sana + muallif) — oргполитikaga to'liq mos
- B) Telegram faqat ogohlantiradi, rasmiylashtirish ERP'da qo'lda qilinadi — ikki bosqich
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish, Sifat, Dizayn — barcha "yozma majburiy" qarorlar bu kanaldan o'tadi.

### Q1312. Og'zaki topshiriq 24 soat ichida yozma qayd etilishini bot kuzatsinmi
**Nima:** Oргполитika "Оғзаки берилган муҳим топшириқ ёки келишув кейинчалик ёзма шаклда қайд этилиши шарт" deydi — og'zaki berilgan topshiriq belgilangan muddatda yozma qayd etilmasa, bot eslatsinmi.
**Nega kerak:** Og'zaki topshiriqlar tez-tez yozma qayd etilmay yo'qoladi — bu hujjat aniq taqiqlaydi.
**Variantlar:**
- A) Og'zaki topshiriq kiritilsa, 24 soat ichida yozma qayd talab qilinadi; bo'lmasa eslatma → keyin rahbarga signal — nazorat
- B) Faqat bir marta eslatma, eskalatsiya yo'q — yumshoq
- C) Keyin — hozir kerak emas

### Q1313. Tex-kartada xato — 15 daqiqalik signal cron
**Nima:** "Ишлаб чиқаришда тех картада хато аниқланса, смена технологи 15 дақиқа ичида бош технологга хабар беради" — smena texnologi tex-karta xatosini belgilaganda, bot bosh texnologga 15 daqiqalik taymer bilan signal yuborsinmi.
**Nega kerak:** Bu hujjatdagi eng aniq vaqt qoidasi — 15 daqiqa o'tib javob bo'lmasa, jarayon to'xtab qoladi.
**Variantlar:**
- A) Xato belgilanishi bilan bosh texnologга darrov signal + 15 daqiqa taymer; javob bo'lmasa RD-4'ga eskalatsiya — qoidaga to'liq
- B) Faqat signal yuboriladi, taymer yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish + Sifat zanjiri (tex-karta → bosh texnolog → RD-5 → dizayn/konstruktor).
  ↳ Agar A: 15 daqiqada javob bo'lmasa kimga chiqsin? — A) bosh texnolog telefoniga qo'ng'iroq-eslatma B) RD-4'ga avtomatik C) ikkalasiga.

### Q1314. Tex-karta tuzatish — 1 soatlik muddat hisoblagichi
**Nima:** "РД-5 хатони тегишли бўлим (дизайн, конструктор, корректор ёки режалаштириш)га юбориб, 1 соат ичида тўғирлашни талаб қилади" — tuzatish topshirig'i yuborilsa, bot 1 soatlik orqaga sanagich (countdown) ko'rsatib eslatsinmi.
**Nega kerak:** 1 soat — hujjatdagi qattiq muddat; o'tsa ishlab chiqarish to'xtaydi yoki davom etish qarori kerak bo'ladi.
**Variantlar:**
- A) Topshiriq yuborilganda 1 soatlik countdown; 45-daqiqada eslatma, 60-daqiqada RD-5'ga "muddat o'tdi" signal — nazorat
- B) Faqat 1 soat oxirida bir marta xabar — sodda
- C) Keyin — hozir kerak emas

### Q1315. Tungi smena telefon-eskalatsiyasi (RD-4 va bosh texnolog javob berishi shart)
**Nima:** "Агар смена технологи муаммони хал қила олмаса бош технолог ёки РД-4 га телефон қилади. РД-4 ва бош технолог тунги вақтларда телефон қилинган тақдирда жавоб беришлари лозим" — tungi smenada muammo bo'lsa, bot telefon-qo'ng'iroq talabini qayd qilib, javob berilganini kuzatsinmi.
**Nega kerak:** Tunda rahbarlar yo'q — bu hujjatdagi maxsus tungi protokol; qo'ng'iroqqa javob berilmasa qayd qolishi kerak.
**Variantlar:**
- A) Tungi muammo signal qilinsa, "telefon qilindi → javob berdi/bermadi" qayd etiladi; javob bo'lmasa ertalab rahbarga ko'rinadi — masъuliyat qaydi
- B) Faqat Telegram signal, telefon qaydi yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/masъuliyat — javob bermagan rahbar oylik/KPI'ga ta'sir qilishi mumkin.

### Q1316. Tungi smena texnologi "davom ettirish" qarori uchun maxsus belgi
**Nima:** "Кечки сменада рахбар ходимлар йўқ бўлса, смена технологи ўз тажрибасидан келиб чиққан холатда давом эттиришга рухсат беради. Бу холатда сифатга тўлиқ жавобгар хисобланади" — bunday yakka qaror qabul qilinganda, bot uni alohida masъuliyat belgisi bilan qayd qilib ertalab rahbarga ko'rsatsinmi.
**Nega kerak:** Tungi yakka qaror = to'liq shaxsiy masъuliyat; ertalab rahbar bilishi shart.
**Variantlar:**
- A) "Tungi yakka qaror" belgisi bilan qayd → ertalab bosh texnolog + RD-5'ga digestda ko'rinadi — masъuliyat shaffof
- B) Oddiy qayd, alohida belgisiz — sodda
- C) Keyin — hozir kerak emas

### Q1317. Bevosita rahbarni chetlab o'tish (фавкулодда) signali
**Nima:** Oргполитika "Бевосита раҳбарни четлаб ўтиб мурожаат қилиш фавқулодда ҳолатлардан ташқари тақиқланади" deydi — agar xodim bot orqali rahbarini sakrab yuqoriga murojaat qilsa, bu "фавкулодда" deb belgilanib, asl rahbarga ham xabar borsinmi.
**Nega kerak:** Chetlab o'tish faqat favqulodda holatda ruxsat — lekin asl rahbar bexabar qolmasligi kerak.
**Variantlar:**
- A) Chetlab o'tilsa, favqulodda sabab so'raladi + bevosita rahbarga "sizni chetlab o'tishdi" nusxasi boradi — shaffof
- B) Chetlab o'tish umuman taqiqlanadi (faqat zanjir bo'yicha) — qattiq
- C) Keyin — hozir kerak emas

### Q1318. Yuboruvchi vs qabul qiluvchi masъuliyatini bot ajratsinmi
**Nima:** Oргполитika "Маълумотни юборган шахс тўғрилиги учун, қабул қилган шахс ўз вақтида кўриб чиқиш учун жавобгар" deydi — bot har xabar uchun "kim yubordi (mazmun masъuli)" va "kim qabul qildi + qachon ko'rdi (javob masъuli)" ni alohida saqlasinmi.
**Nega kerak:** Hujjat masъuliyatni ikkiga bo'ladi — keyin "men yubormagandim / men ko'rmagandim" bahsini hal qiladi.
**Variantlar:**
- A) Har xabarda yuboruvchi + qabul qiluvchi + ko'rilgan vaqt qayd etiladi (ikki tomonli masъuliyat) — bahssiz
- B) Faqat yuboruvchi qayd etiladi — yarим
- C) Keyin — hozir kerak emas

### Q1319. Mijoz bilan bog'liq muammo — savdo menejeriga avtomatik yo'naltirish
**Nima:** "Агар муаммо мижоз билан боғлиқ бўлса, савдо менежерига хабар берилади, у мижоз билан боғланиб талабини тушунтиради" — tex-karta/brak muammosi "mijoz bilan bog'liq" deb belgilansa, bot avtomatik o'sha buyurtmaning savdo menejeriga yuborsinmi.
**Nega kerak:** Hujjat aniq aytadi: texnik echimni texnolog, mijoz masalasini savdo menejeri hal qiladi — adresat aralashmasligi kerak.
**Variantlar:**
- A) "Mijoz masalasi" belgisi → buyurtmaning savdo menejeriga avtomatik; texnik echim emas, faqat mijoz talabini aniqlash — rolga mos
- B) Hammasi bosh texnologda qoladi, savdoga qo'lda yuboriladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Savdo (CRM) ↔ Ishlab chiqarish ↔ Sifat zanjiri.

### Q1320. RD-2/RD-4/RD-5 uchlik kelishuv yig'ilishi chaqirig'i (1 soat ichida)
**Nima:** "Муаммони ўзаро келишув асосида хал қилишга тўғри келса РД4, РД2 ва РД5 учрашиб кўриб чиқишади... 1 соат ичида хал қилиш талаб қилинади" — bot bu uchlik yig'ilishni chaqirib, 1 soatlik muddat bilan kuzatsinmi.
**Nega kerak:** Departamentlararo muammo 1 soatda hal bo'lishi kerak — kim chaqirildi, keldi-kelmadi, qaror nima bo'ldi qayd etilsin.
**Variantlar:**
- A) Uchlik chaqiriq → 3 rahbarga signal + 1 soat taymer + qaror qaydi (davom ettirish / vaqtincha to'xtatish) — protokolga mos
- B) Faqat 3 rahbarga oddiy xabar — sodda
- C) Keyin — hozir kerak emas

### Q1321. "Vaqtincha to'xtatish" qarori butun zanjirga e'lon qilinsinmi
**Nima:** Uchlik kelishuvda "ишни вақтинча тўхтатиш" qarori qabul qilinsa, bu qaror buyurtma zanjiridagi barcha bo'limga (dizayn, konstruktor, ombor, savdo) avtomatik e'lon qilinsinmi.
**Nega kerak:** To'xtash qarori faqat 3 rahbarda qolsa, quyi bo'limlar bexabar ishlashda davom etadi.
**Variantlar:**
- A) To'xtash qarori → buyurtma kartasidagi barcha masъullarga "to'xtatildi: sabab" signali — yagona haqiqat
- B) Faqat ishlab chiqarish to'xtaydi, qolganlar keyin biladi — qisman
- C) Keyin — hozir kerak emas

### Q1322. Yangi oргполитika e'loni (НО-3 → adaptatsiya menejeri)
**Nima:** "Янги оргполитика хақида НО-3 адаптация менежерига маълумот беради... ўқитиш оргполитика ёзилгандан сўнг 1 кундан кечиктирмай бошланиши керак" — yangi oргполитika tizimga kiritilganda, bot НО-3 va adaptatsiya menejeriga 1 kunlik o'qitish muddati bilan signal bersinmi.
**Nega kerak:** Hujjat aniq 1 kunlik muddat qo'yadi; bu odamlar bot orqali eslatilmasa, o'qitish kechikadi.
**Variantlar:**
- A) Yangi oргполитika → НО-3 + adaptatsiya menejeriga signal + 1 kunlik o'qitish boshlash muddati — qoidaga mos
- B) Faqat НО-3'ga xabar — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/adaptatsiya + Ta'lim (darslik) moduli.

### Q1323. Takroriy xato → oргполитika yozish topshirig'i
**Nima:** "Тех картада аниқланган хато қайси бўлимга тегишли бўлса, ушбу бўлим бошлиғи такрорланмаслиги учун Оргполитика ёзади" — bir xil xato qayta takrorlansa, bot tegishli bo'lim boshlig'iga "oргполитika yozing" topshirig'ini yuborsinmi.
**Nega kerak:** Hujjat takroriy xatoga tizimli javob talab qiladi; bot takrorlanishni sanab, eslatishi kerak.
**Variantlar:**
- A) Bir xil xato 2-marta takrorlansa, bo'lim boshlig'iga "oргполитika yoz" topshirig'i + НО-3'ga nusxa — tizimli
- B) Faqat statistikada ko'rsatiladi, topshiriq yo'q — passiv
- C) Keyin — hozir kerak emas

### Q1324. Kun yakuni НО-3 hisoboti avtomatik eslatmasi
**Nima:** Oргполитika "Аниқланган камчиликлар бўйича НО-3 га кун якунида ҳисобот тақдим этиш" deydi — bot har kun yakunida masъul shaxsga "НО-3 kun-yakuni hisoboti" eslatmasini yuborsinmi.
**Nega kerak:** Kunlik kamchilik hisoboti unutilsa, НО-3 nazorati uzilib qoladi.
**Variantlar:**
- A) Har kun smena oxirida masъulga eslatma; topshirilmasa НО-3'ga "hisobot kelmadi" signali — nazorat
- B) Faqat eslatma, kuzatuv yo'q — sodda
- C) Keyin — hozir kerak emas

### Q1325. Kunlik/haftalik/oylik hisobot uchligi (RD-5 boshlig'i)
**Nima:** Hujjatda "Бўлим фаолияти бўйича кунлик, ҳафталик ва ойлик ҳисоботларни ўз вақтида раҳбариятга тақдим этади" — bot bu uch ritmni (kunlik/haftalik/oylik) alohida eslatma sifatida yuritsinmi.
**Nega kerak:** Uch xil ritmda hisobot bor; biri ikkinchisini almashtirmaydi — har biri o'z vaqtida.
**Variantlar:**
- A) Uch alohida eslatma (kunlik smena oxiri / haftalik / oy yakuni), har biri o'z adresati bilan — to'liq
- B) Faqat haftalik va oylik — qisqartirilgan
- C) Keyin — hozir kerak emas

### Q1326. Smenalik hisobot (smena texnologi → bosh rejalashtiruvchi)
**Nima:** "Смена якунида режанинг бажарилиши, кечикишлар ва сабаблари бўйича сменалик ҳисобот тайёрлаш ва бош режалаштирувчига тақдим этиш" — har smena oxirida bot smena texnologiga hisobot eslatmasini yuborib, bosh rejalashtiruvchiga yo'naltirsinmi.
**Nega kerak:** Smenalik hisobot kechikishlar sababini saqlaydi — bu rejalashtirish sifatini yaxshilash uchun asos.
**Variantlar:**
- A) Har smena oxirida texnologga eslatma + tayyor bo'lsa bosh rejalashtiruvchiga avtomatik yo'naltirish — zanjirga mos
- B) Faqat eslatma, yo'naltirish qo'lda — sodda
- C) Keyin — hozir kerak emas

### Q1327. Xom-ashyo yetishmasligi → bosh rejalashtiruvchiga darhol signal
**Nima:** "Агар заявкада кўрсатилган хом-ашё омборда етарли бўлмаса, ички таъминот ходими дарҳол бош режалаштириш ходимини хабардор қилади" — ombor zaxirasi заявкани qoplamasa, bot bosh rejalashtiruvchiga darhol signal yuborsinmi.
**Nega kerak:** Xom-ashyo yo'q bo'lsa reja qayta ko'riladi yoki qo'shimcha заявка beriladi — kechiksa ishlab chiqarish to'xtaydi.
**Variantlar:**
- A) Zaxira yetmasa darhol bosh rejalashtiruvchiga + ta'minot bo'limiga signal — zanjirga mos
- B) Faqat bosh rejalashtiruvchiga — bir adresat
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor ↔ Rejalashtirish ↔ Ta'minot.

### Q1328. Roxler (jihoz) nosozligi — darhol xabar belgisi
**Nima:** "Рохлернинг ишга яроқли ҳолатини сақлаш ва носозлик аниқланса дарҳол хабар бериш" — jihoz nosozligi belgilanganda, bot uni "darhol xabar" ustuvor turiga qo'yib bo'lim boshlig'iga yuborsinmi.
**Nega kerak:** Jihoz nosozligi to'xtash xavfi — kechiktirilmasligi kerak.
**Variantlar:**
- A) Jihoz nosozligi → bo'lim boshlig'iga eng yuqori ustuvor signal (boshqa xabarlar ustida) — to'g'ri ustuvorlik
- B) Oddiy signal qatorida — sodda
- C) Keyin — hozir kerak emas

### Q1329. Kechikish/uzilish xavfi — "darhol xabardor qilish" tugmasi
**Nima:** "Ишлаб чиқариш жараёнида кечикиш ёки узилиш хавфи пайдо бўлса бўлим бошлиғини дарҳол хабардор қилиш" — operatorda "kechikish xavfi bor" deb bir tugma bo'lib, bosib darhol bo'lim boshlig'iga xabar yuborsinmi.
**Nega kerak:** Hujjat "muammoni o'z vaqtida xabar bermaslik"ni jazolanadigan kamchilik deb belgilaydi — xabar berish oson bo'lishi kerak.
**Variantlar:**
- A) Bitta "kechikish xavfi" tugmasi → bo'lim boshlig'iga darhol + qayd (kim, qachon, qaysi buyurtma) — oddiy va tez
- B) Matn yozib yuborish (tugma yo'q) — erkinroq lekin sekin
- C) Keyin — hozir kerak emas

### Q1330. "O'z vaqtida xabar bermaslik" kamchiligini bot qayd qilsinmi
**Nima:** Yo'riqnomada "Бўлим бошлиғига муаммолар ҳақида ўз вақтида хабар бермаслик" aniq kamchilik sifatida sanalgan — muammo kech xabar berilganini (vaqt farqi) bot avtomatik qayd qilib, oy yakunida ko'rsatsinmi.
**Nega kerak:** Bu hujjatda nomi aniq aytilgan jazolanadigan xatti-harakat — o'lchanmasa nazorat qilib bo'lmaydi.
**Variantlar:**
- A) Muammo yuzaga kelgan vaqt vs xabar berilgan vaqt farqi qayd etiladi; kechikkan xabarlar oylik KPI'da — o'lchanadi
- B) Faqat xabar berilgan vaqt saqlanadi, farq hisoblanmaydi — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/KPI.

### Q1331. Bitrix24 kartochka status o'zgarishi → avtomatik bildirishnoma
**Nima:** Lug'atda "Статус — карточканинг жорий ҳолатини кўрсатувчи босқич (Техник топшириқ келди / Дизайн тайёрланяпти / Тасдиқда / Ишлаб чиқаришга топширилди)" — kartochka statusi o'zgarganda, navbatdagi masъulga avtomatik xabar borsinmi.
**Nega kerak:** Kartochka zanjiri statuslar bo'yicha o'tadi; har bosqich keyingi odamga signal bermasa, zanjir uziladi.
**Variantlar:**
- A) Har status o'zgarishida keyingi bosqich masъuliga avtomatik signal (status nomi bilan) — zanjir uzilmaydi
- B) Faqat asosiy statuslarda (Тасдиқда, Ишлаб чиқаришга топширилди) — kamroq shovqin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM/Dizayn ↔ Ishlab chiqarish (oltin-ip zanjiri).

### Q1332. Kartochka "Тасдиқда" statusida tasdiq kutilayotgan signal
**Nima:** Kartochka "Тасдиқда" (mijoz/rahbar tasdig'ini kutmoqda) statusiga o'tganda, tasdiqlovchi shaxsga "sizning tasdig'ingiz kutilmoqda" eslatmasi borsinmi, javob bo'lmasa qayta eslatsinmi.
**Nega kerak:** Tasdiq bosqichida ishlar tez-tez qotib qoladi (kim tasdiqlashini kutadi) — eslatma kerak.
**Variantlar:**
- A) Tasdiqlovchiga darhol + belgilangan vaqtdan keyin qayta eslatma → keyin yuqoriga — nazorat
- B) Faqat bir marta eslatma — yumshoq
- C) Keyin — hozir kerak emas

### Q1333. Texnik topshiriq (ТТ) to'liqsiz kelganda dizaynerga signal
**Nima:** Lug'atda ТТ tarkibi aniq sanalgan (mahsulot turi, o'lchamlar, material, bosma usuli, ranglar, matn, logotip, miqdor, maxsus talablar) — bu maydonlardan biri bo'sh bo'lsa, bot "ТТ to'liqsiz" deb savdo/dizaynerga signal bersinmi.
**Nega kerak:** To'liqsiz ТТ keyin qayta ishlash va kechikishga olib keladi (kitobdagi korrektor misoli).
**Variantlar:**
- A) ТТ kiritilganda majburiy maydonlar tekshiriladi; bo'sh bo'lsa savdoga "to'ldiring" signali, dizaynerga ish berilmaydi — oldini olish
- B) Faqat ogohlantiradi, ish baribir o'tadi — yumshoq
- C) Keyin — hozir kerak emas

### Q1334. Korrektor xato topganda dizaynerga darhol xabar (kitob misoli)
**Nima:** Kitobdagi vaziyat: "Корректор хатоларни аниқлади, аммо дизайнерни ўз вақтида хабардор қилмади. Макет тузатилмасдан кейинги босқичга ўтиб кетди" — korrektor xato belgilaganda, bot dizaynerga darhol xabar berib, tuzatilmaguncha keyingi bosqichga o'tkazmasinmi.
**Nega kerak:** Bu aniq kitobdagi muammo — xabar kechiksa maket tuzatilmay ishlab chiqarishga ketadi.
**Variantlar:**
- A) Korrektor xatosi → dizaynerga darhol + kartochka keyingi bosqichga o'tishi bloklanadi (tuzatilmaguncha) — qattiq
- B) Faqat xabar, blok yo'q — yumshoq
- C) Keyin — hozir kerak emas

### Q1335. Dizayner rahbarni chetlab fayl yuborgani (kitob misoli) signali
**Nima:** Kitobdagi vaziyat: "Дизайнер бўлим раҳбарини хабардор қилмасдан қарор қабул қилди ва нотўғри тайёрланган файлни ишлаб чиқаришга юбориб қўйди" — fayl rahbar tasdig'isiz ishlab chiqarishga yuborilsa, bot rahbarga "tasdiqsiz yuborildi" signali bersinmi.
**Nega kerak:** Hujjat bo'yicha to'g'ri tartib — vazifa rahbardan, fayl rahbar orqali; chetlab o'tish qayta ishlashga olib keladi.
**Variantlar:**
- A) Fayl tasdiq belgisisiz yuborilsa → bo'lim rahbariga signal + qayd — nazorat
- B) Fayl yuborish umuman rahbar tasdig'isiz bloklanadi — qattiq
- C) Keyin — hozir kerak emas

### Q1336. Og'zaki reja "rasmiy berilgan" deb hisoblanmasligi haqida ogohlantirish
**Nima:** "Оғзаки хабар бериш режани расмий берилган деб ҳисоблаш учун асос бўлмайди" — kimdir rejani faqat og'zaki bergan bo'lsa va yozma qayd yo'q bo'lsa, bot "bu reja hali rasmiy emas" deb ogohlantirsinmi.
**Nega kerak:** Hujjat aniq aytadi: og'zaki reja asos emas — yozma qayd bo'lmaguncha reja yo'q hisoblanadi.
**Variantlar:**
- A) Yozma qayd yo'q rejaga "rasmiy emas" belgisi + tegishliga ogohlantirish — hujjatga mos
- B) Faqat statistikada ko'rsatiladi — passiv
- C) Keyin — hozir kerak emas

### Q1337. Reja o'zgarishi → barcha bog'liq bo'limga e'lon (gorizontal)
**Nima:** Oргполитika "Оргсхемадаги жойлашувига мувофиқ тегишли бўлимлар билан келишиб режалаштириш" deydi (mustaqil tuzib boshqalarni xabardor qilmaslik xato) — reja o'zgarganda, bot u bilan bog'liq barcha bo'limga avtomatik e'lon qilsinmi.
**Nega kerak:** Reja bir bo'limda o'zgarib boshqalar bilmasa, ishlab chiqarish noaniqlikka tushadi.
**Variantlar:**
- A) Reja o'zgarishi → bog'liq bo'limlarga avtomatik e'lon + ko'rgani qayd — gorizontal kommunikatsiyaga mos
- B) Faqat ishlab chiqarishga — bir adresat
- C) Keyin — hozir kerak emas

### Q1338. Aналитик kommunikatsiya: Совершенствование bo'limi xulosalari kanali
**Nima:** Oргполитika "Таҳлил, хулоса, сифат маълумотлари Совершенствование бўлими орқали тузилиб тегишли бўлимларга ва департамент раҳбарига тақдим этилади" — tahliliy xulosalar alohida "analitik" kanaldan tarqalsinmi.
**Nega kerak:** Tahlil/xulosa oddiy operatsion xabardan farq qiladi — adresat va format boshqacha (faqat Совершенствование chiqaradi).
**Variantlar:**
- A) Analitik xabarlar alohida belgi/kanal bilan, faqat Совершенствование bo'limidan chiqadi — hujjatga mos
- B) Oddiy xabar qatorida, alohida belgisiz — sodda
- C) Keyin — hozir kerak emas

### Q1339. Maxsulot brak holatida "shu joyda hal qilish" tartibi (kanal cheklash)
**Nima:** Oргполитika ideal manzarasi: "Ҳар бир брак ҳолати аниқланганда муаммо шу жойнинг ўзида ечилади. Савдо менежери муаммони эшитади, лекин техник ечим топмайди" — brak signali yuborilganda, bot uni faqat tegishli rolга (texnik echim texnologdan, mijoz masalasi savdodan) yo'naltirsinmi.
**Nega kerak:** Hujjat aniq: har bo'lim faqat o'z vakolatidagi javobni beradi — aralashish chalkashlik keltiradi.
**Variantlar:**
- A) Brak signali → tabiati bo'yicha to'g'ri rolга (texnik → texnolog, mijoz → savdo); har rol faqat o'z vakolati doirasida javob beradi — hujjatga mos
- B) Hammasiga bir xil yuboriladi, ular o'zi hal qiladi — sodda
- C) Keyin — hozir kerak emas

### Q1340. Shikastlangan xom-ashyo aniqlanganda xabar tartibi
**Nima:** Kitobda savol bor: "Шикастланган хом-ашё аниқланганда қандай тартибда хабар берилиши керак" — ombor/qabul ходими shikastlangan xom-ashyoni belgilaganda, bot belgilangan tartib bo'yicha (kim → kimga) signal yuborsinmi.
**Nega kerak:** Shikastlangan material ishlab chiqarishga o'tib ketmasligi uchun darhol to'g'ri odamga xabar kerak.
**Variantlar:**
- A) Shikast belgilanganda → ta'minot/rahbarga darhol + material "karantin" belgisi (ishlatilmaydi) — to'liq
- B) Faqat xabar, karantin belgisi yo'q — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor ↔ Sifat (karantin) ↔ Ta'minot.

### Q1341. Eslatma turlari ro'yxati (digest / signal / muddat / tasdiq / qaror)
**Nima:** Bot yuboradigan xabarlar bir necha turga bo'linadi: davriy digest, tezkor signal, muddat eslatmasi, tasdiq so'rovi, rasmiy qaror qaydi — har turning o'z ko'rinishi (rang/belgi) bo'lsinmi.
**Nega kerak:** Xodim qaysi xabar shoshilinch, qaysi biri oddiy ekanini bir qarashda ajratishi kerak.
**Variantlar:**
- A) Har tur o'z belgisi bilan (🔴 signal / ⏰ muddat / ✅ tasdiq / 📋 qaror / 📊 digest) — aniq farq
- B) Hammasi bir xil ko'rinishda, matn ichida farq — sodda
- C) Keyin — hozir kerak emas

### Q1342. Alert ustuvorlik darajalari (jihoz nosozligi > kechikish > oddiy)
**Nima:** Kitobda "дарҳол" (jihoz nosozligi, kechikish xavfi) va oddiy hisobotlar bor — bot signallarni ustuvorlikka ko'ra tartiblab, eng muhimini tepada ko'rsatsinmi.
**Nega kerak:** "Darhol" turdagi xabarlar oddiy hisobot orasida ko'milib qolmasligi kerak.
**Variantlar:**
- A) 3 daraja: KRITIK (jihoz/to'xtash) → MUHIM (kechikish/muddat) → ODDIY (hisobot/digest) — tartibli
- B) 2 daraja: shoshilinch / oddiy — sodda
- C) Keyin — hozir kerak emas

### Q1343. "Darhol" xabarlar tinchlik vaqti (тун) cheklovidan ozodmi
**Nima:** Hujjat tungi smenani aniq tan oladi (RD-4 tunda javob berishi shart) — "darhol" turdagi signal tungi tinchlik vaqtida ham yuborilsinmi.
**Nega kerak:** Jihoz nosozligi yoki to'xtash tunda ham kelishi kerak, oddiy digest esa kutib tursin.
**Variantlar:**
- A) Faqat KRITIK darajadagi signal tunda o'tadi, qolganlari ertalabga kechiktiriladi — muvozanat
- B) Tunda hech narsa, hammasi ertalab — tinch lekin xavfli
- C) Keyin — hozir kerak emas

### Q1344. Muddat eslatmasining ikki bosqichi (oldindan + o'tганда)
**Nima:** Kitobdagi muddatlar (15 daqiqa, 1 soat, 1 kun, kun yakuni) — bot muddatdan oldin (ogohlantirish) va muddat o'tganda (signal) deb ikki marta xabar bersinmi.
**Nega kerak:** Faqat o'tганda xabar bersa, oldini olib bo'lmaydi; faqat oldin bersa, o'tib ketgani bilinmaydi.
**Variantlar:**
- A) Muddatga yaqin oldindan eslatma + o'tib ketsa rahbarga signal — ikki bosqich
- B) Faqat muddat o'tганда signal — sodda
- C) Keyin — hozir kerak emas

### Q1345. Departament-darajasida umumlashtirilgan hisobot (vertikal)
**Nima:** Oргполитика "Раҳбарлар маълумотни 5-департамент даражасида умумлаштириб тақдим қилади" — quyi bo'limlardan kelgan xabarlar yuqoriga chiqishda bo'lim/departament bo'yicha umumlashsinmi (har bir kichik xabar emas, xulosa).
**Nega kerak:** Departament rahbariga 100 ta alohida xabar emas, umumlashgan xulosa kerak.
**Variantlar:**
- A) Yuqoriga chiqqanda darajaga ko'ra umumlashadi (operator detali → bo'lim xulosasi → departament xulosasi) — Vysotskiy modeli
- B) Hamma xabar barcha darajaga to'liq chiqadi — to'liq lekin shovqinli
- C) Keyin — hozir kerak emas

### Q1346. Masъuliyat lavozimga bog'langan (xodimga emas) yo'naltirish
**Nima:** Oргполитика "Масъулият бўлимга эмас, лавозимга боғланади" — xabar muayyan odamga emas, lavozimga (kartaga) yuborilib, o'sha lavozimni egallagan kishiga borsinmi.
**Nega kerak:** Xodim almashsa ham, xabar to'g'ri lavozimga borishi kerak — karta-markazli modelga to'liq mos.
**Variantlar:**
- A) Xabar lavozimga (kartaga) yuboriladi → joriy egasiga yetkaziladi; xodim almashsa avtomatik yangi egaga — karta-modelga mos
- B) Xabar aniq xodimga yuboriladi — eski usul
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (karta-model) ↔ HR.

### Q1347. Masъuliyatni og'zaki o'tkazish taqiqiga rioya
**Nima:** Oргполитика "Масъулиятни бошқа шахсга оғзаки ўтказишга йўл қўйилмайди" — kimdir o'z masъuliyatini boshqa odamга o'tkazmoqchi bo'lsa, bot buni rasmiy yozma topshiriq bilan talab qilsinmi.
**Nega kerak:** Og'zaki "sen qil" deb masъuliyat o'tkazilsa, keyin "men aytmagandim" bahsi chiqadi.
**Variantlar:**
- A) Masъuliyat o'tkazish faqat rasmiy yozma topshiriq orqali; og'zaki o'tkazma qayd etilmaydi — hujjatga mos
- B) Og'zaki o'tkazma ham qayd etilsin (lekin belgisi bilan) — yumshoq
- C) Keyin — hozir kerak emas

### Q1348. Oylik masъuliyat tahlili digesti (Совершенствование)
**Nима:** Oргполитика "Ҳар ой якунида Совершенствование томонидан жорий этилган қарорлар ва муаммолар бўйича жавобгарлик ҳолати таҳлил қилинади" — oy yakunida bot masъuliyat tahlilini (kim qaror qabul qilgan, natijasi nima) digest qilib bersinmi.
**Nega kerak:** Oylik masъuliyat tahlili takroriy kamchiliklarni aniqlash uchun asos.
**Variantlar:**
- A) Oy yakunida masъuliyat digesti (qaror → masъul → natija) Совершенствование va departament rahbariga — hujjatga mos
- B) Faqat raqamli statistika, qaror-tahlilsiz — yarim
- C) Keyin — hozir kerak emas

### Q1349. Rasmiy ma'lumot talabi (Совершенствование → bo'lim boshlig'i, muddat bilan)
**Nima:** Oргополитика "Совершенствование ушбу маълумотни шакллантириш учун жавобгар бўлим бошлиғига расмий талаб юборади... белгиланган муддатда тақдим этилиши шарт" — ma'lumot talabi yuborilganda, bot muddat bilan kuzatib, kechiksa eslatsinmi.
**Nega kerak:** Tahlil uchun kerakli ma'lumot kechiksa, butun oylik tahlil kechikadi.
**Variantlar:**
- A) Rasmiy ma'lumot talabi → bo'lim boshlig'iga signal + muddat taymeri + kechiksa eslatma — nazorat
- B) Faqat bir marta yuboriladi — sodda
- C) Keyin — hozir kerak emas

### Q1350. Eski ma'lumot ustida ishlash ogohlantirishi
**Nима:** Oргополитика "Эски маълумот устида ишлашга йўл қўйилмайди... маълумотлар ҳар бир ўзгаришдан сўнг янгиланади" — agar kimdir eski versiyadagi tex-karta/reja ustida ishlayotgan bo'lsa, bot "bu eskirgan, yangisi bor" deb ogohlantirsinmi.
**Nega kerak:** Eski ma'lumotdan foydalanish qaror xatosiga olib keladi (hujjatdagi muammo).
**Variantlar:**
- A) Hujjat/reja yangilansa, eski versiyani ochganlarga "yangilangan, qarang" signali — oldini olish
- B) Faqat yangi versiya yuklanadi, ogohlantirishsiz — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (tex-karta versiyalari) ↔ Dizayn.

### Q1351. Yig'ilish topshiriqlari uchun eslatma (muddat bilan)
**Nima:** Hujjatda "Йиғилишларда фаол иштирок этиш, берилган топшириқлар бўйича ҳисоботларни белгиланган муддатларда тақдим этиш" — yig'ilishda berilgan topshiriqlar uchun bot muddat eslatmasini yuritsinmi.
**Nega kerak:** Yig'ilishda berilgan topshiriqlar tez-tez unutiladi — muddat eslatmasi bo'lmasa nazoratdan chiqadi.
**Variantlar:**
- A) Yig'ilish topshirig'i kiritilsa, masъulga muddat eslatmasi + bajarilmasa rahbarga signal — nazorat
- B) Faqat topshiriqlar ro'yxati, eslatmasiz — passiv
- C) Keyin — hozir kerak emas

### Q1352. Telefon-qo'ng'iroq qaydini bot saqlasinmi (tungi protokol)
**Nима:** Tungi protokolda telefon qo'ng'irog'i ishlatiladi (RD-4 javob berishi shart) — bot Telegram tashqarisidagi qo'ng'iroqni "qo'ng'iroq qilindi / javob berildi" deb qo'lda qayd qilish imkonini bersinmi.
**Nega kerak:** Tunda telefon ishlatiladi, lekin keyin "qo'ng'iroq qilgandim / qilmagansan" bahsi chiqmasligi uchun qayd kerak.
**Variantlar:**
- A) Bot "qo'ng'iroq qildim" tugmasi → vaqt qayd; qarshi tomon "javob berdim" tasdig'i — ikki tomonli qayd
- B) Faqat qo'ng'iroq qilganini qayd, javob qaydsiz — yarim
- C) Keyin — hozir kerak emas

### Q1353. Buyurtma to'liq tugamasdan reja o'zgartirilsa signal
**Нима:** "Режани ўзгартириш ва буюртмани тўлиқ тугатмасдан ўтиш натижасида дастгоҳларни қайта созлаш, вақт йўқотиш кузатилса, бу ҳолатлар таҳлил учун қайд этилади" — buyurtma tugamay reja o'zgartirilsa, bot buni qayd qilib oylik hisobotga qo'shsinmi.
**Nega kerak:** Yarim qoldirilgan buyurtma dastgoh qayta sozlash va vaqt yo'qotishga olib keladi — bu o'lchanishi kerak.
**Variantlar:**
- A) Buyurtma tugamay reja o'zgartirilsa → qayd + sabab so'raladi + oylik tahlilga kiradi — o'lchanadi
- B) Faqat ruxsat beriladi, qaydsiz — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Rejalashtirish ↔ Ishlab chiqarish samaradorligi (oylik tahlil).

### Q1354. Kanban doskasidagi qotib qolgan kartochkaga signal
**Нима:** Lug'atda "Канбан доскаси — карточкаларни статуслар бўйича визуал кўрсатувчи панель" — bir kartochka bitta statusda belgilangan vaqtdan ko'p qolsa (qotib qolsa), bot masъulga signal bersinmi.
**Nega kerak:** Kanbanда qotib qolgan kartochka ko'rinadi lekin hech kim chuqurlashmaydi — signal kerak.
**Variantlar:**
- A) Kartochka statusда belgilangan vaqtdan ko'p qotsa → masъulga + bo'lim boshlig'iga signal — nazorat
- B) Faqat doskada rang bilan ko'rsatiladi, signalsiz — passiv
- C) Keyin — hozir kerak emas

### Q1355. Buyurtma bajarilishi hisoboti (RD-5 → rahbariyat)
**Нима:** Hujjatda "Буюртмалар бажарилиши бўйича ҳисоботлар" sanalgan — buyurtma yakunlanganda, bot uning bajarilish hisobotini (reja vs fakt, kechikish) avtomatik rahbariyatga yuborsinmi.
**Nega kerak:** Buyurtma yakuni — natija o'lchanadigan nuqta; har biri hisobotsiz o'tib ketmasligi kerak.
**Variantlar:**
- A) Buyurtma yopilganda avtomatik bajarilish hisoboti (reja/fakt/kechikish/sabab) rahbariyatga — to'liq
- B) Faqat oylik yig'ma hisobotda — kechroq
- C) Keyin — hozir kerak emas

### Q1356. Bir bo'lim ikkinchisining vazifasiga aralashganda signal (gorizontal chegara)
**Нима:** Oргополитика "Бир бўлим иккинчи бўлим вазифасига аралашмайди, барча келишувлар ёзма қайд этилади" — agar bir bo'lim boshqa bo'lim vakolatidagi qaror chiqarsa, bot tegishli bo'lim boshlig'iga "vakolatdan tashqari" signali bersinmi.
**Nega kerak:** Vakolat chegarasi buzilishi bahs va masъuliyat chalkashligiga olib keladi (hujjatdagi muammo).
**Variантlar:**
- A) Vakolatdan tashqari qaror → tegishli bo'lim boshlig'iga signal + qayd — chegara himoyasi
- B) Faqat yozma kelishuv talab qilinadi, signalsiz — yumshoq
- C) Keyin — hozir kerak emas

### Q1357. Adaptatsiya (o'qitish) yakunlanganini bot tasdiqlasinmi
**Нима:** Yangi oргополитика bo'yicha o'qitish 1 kun ichida boshlanishi kerak (Q12) — o'qitish yakunlanganda, har xodim "o'qidim, tushundim" tasdig'ini bot orqali bersinmi (kitobda har vazifa oxirida "ўқиб чиққанингизни тасдиқланг" bor).
**Nega kerак:** Kitobdagi yo'riqnomalar har bo'lim oxirida tasdiq talab qiladi — o'qilganini qayd qilish kerak.
**Variантlar:**
- A) Har xodim yangi oргополитика/yo'riqnomani o'qib tasdiqlaydi; tasdiqlamaganlar НО-3'ga ko'rinadi — qayd
- B) Faqat o'qitish o'tkazilgani qayd etiladi, individual tasdiqsiz — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/adaptatsiya ↔ Ta'lim moduli.

### Q1358. Smenalararo topshirish (peshma-pesh) bildirishnomasi
**Нима:** Kitobda smenalar tizimi bor (3 smena, smena texnologi smena yakunida hisobot beradi) — bir smena tugab ikkinchisi boshlanganda, tugamagan ishlar va ochiq muammolar yangi smenaga avtomatik o'tkazilsinmi.
**Nega kerак:** Smena almashganda ochiq muammo yo'qolmasligi kerak — yangi smena nimani davom ettirishini bilishi shart.
**Variантlar:**
- A) Smena yakunida ochiq ishlar/muammolar ro'yxati avtomatik keyingi smenaga + texnologga yetkaziladi — uzilishsiz
- B) Faqat hisobot saqlanadi, avtomatik topshirish yo'q — qo'lda
- C) Keyin — hozir kerak emas

### Q1359. "Kim-nima-oladi" matritsasini egasi ko'rib chiqsinmi (kanal xaritasi)
**Нима:** Oргополитика ideali: "Ким, қачон, қандай масалада ва қайси канал орқали мулоқот қилиши аниқ белгиланган бўлади" — bot uchun "qaysi hodisa → qaysi lavozim → qaysi kanal (shaxsiy/guruh/yozma)" matritsasini egasi bir joyda ko'rib tasdiqlasinmi.
**Nega kerак:** Kanal xaritasi tarqoq bo'lsa, xabarlar noto'g'ri odamga boradi — bitta tasdiqlangan matritsa kerak.
**Variантlar:**
- A) Egasi/rahbar ko'radigan yagona "hodisa → lavozim → kanal" jadvali, undan barcha yo'naltirish kelib chiqadi — yagona haqiqat
- B) Har modul o'z yo'naltirishini alohida belgilaydi — tarqoq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Barcha modul (bu — bildirishnoma marshrutining markaziy jadvali).

### Q1360. "Maълumot yo'qolmaydi" kafolati — har xabar arxivga tushsinmi
**Нима:** Oргополитика maqsadi: "Барча муҳим қарорлар ёзма қайд этилган, маълумот йўқолмайди" — bot orqali o'tgan har bir rasmiy xabar/qaror o'chirilmaydigan arxivga tushib, keyin qidirilsinmi (ОТК natijalari "ўчирилмайди" deydi hujjat).
**Nega kerак:** Hujjat ma'lumot yo'qolishini asosiy muammo deb belgilaydi; sifat natijalari va qarorlar o'chirilmasligi shart.
**Variантlar:**
- A) Rasmiy xabar/qaror/sifat natijasi o'chirilmaydigan arxivга tushadi, qidirish mumkin; oddiy chat o'chsa ham bu qoladi — hujjatga mos
- B) Hamma xabar bir xil saqlanadi (rasmiy ajratilmaydi) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (ОТК natijalari arxivi) ↔ Совершенствование (tahlil uchun manba).

### Q1361. Brak/xato statistikasi haftalik digestda bo'lim kesimida
**Нима:** Kitobda har xato qaysi bo'limga tegishli ekani aniqlanadi (dizayn/konstruktor/korrektor/rejalashtirish) — haftalik digestда qaysi bo'lim qancha xato chiqargani ko'rsatilsinmi.
**Nega kerак:** Takroriy xato manbasini ko'rsatmasa, oргополитika yozish (Q13) kimga kerakligi bilinmaydi.
**Variантlar:**
- A) Haftalik digestда bo'lim kesimida xato soni + takrorlanganlari belgilanган — manba ko'rinadi
- B) Faqat umumiy xato soni — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat ↔ HR/KPI ↔ Совершенствование.

### Q1362. Ko'rilmagan muhim xabar uchun qayta-yuborish jadvali
**Нима:** Muhim signal (jihoz nosozligi, muddat o'tishi) belgilangan vaqtda ko'rilmasa, bot uni qancha marta va qaysi oraliqda qayta yuborsinmi (eskalatsiyaga o'tishdan oldin).
**Nega kerак:** Bir marta yuborib ko'rilmasa muammo qoladi; cheksiz takrorlasa bezovta qiladi — o'rtacha kerak.
**Variантlar:**
- A) Muhim xabar ko'rilmasa 2 marta qayta (belgilangan oraliqda), keyin yuqoriga eskalatsiya — muvozanat
- B) Bir marta yuboriladi, qayta yo'q — sodda
- C) Keyin — hozir kerak emas

DONE: Bildirishnoma / Telegram — 52.

## 19. POS Monitor

### Q1363. Ichki logistika harakati POS Monitor'da alohida turmi
**Nima:** Kitobda asosiy ish "ярим тайёр маҳсулотларни участкалар o'rtasida ko'chirish" (rohlerda) — bu kirim/chiqimdan farqli "ichki yetkazib berish" harakati sifatida yoziladimi.
**Nega kerak:** Bu materialni ombordan butunlay chiqarish emas — uni sexga vaqtincha berib turish; oddiy "chiqim" deb yozilsa, omborda yo'q ko'rinadi-yu, aslida sexda turibdi.
**Variantlar:**
- A) Alohida "участкага berish (logistika)" harakati — material ombor→sex-pozitsiyaga ko'chadi, balans ko'rinadi — aniq joylashuv
- B) Oddiy chiqim sifatida (sexga) — sodda, lekin sexdagi qoldiq ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (sex qoldig'i), PP (kunlik reja), Ombor balansi

### Q1364. Texkarta-material mosligi tekshiruvi (chiqimdan oldin)
**Nima:** Kitob: "har bir chiqarilayotgan material техкартага qat'iy mos bo'lishi kerak" (topliner o'rniga makulatura chiqsa — ishlab chiqarish to'xtaydi). Planshet chiqimda materialni buyurtma texkartasiga solishtiradimi.
**Nega kerak:** Noto'g'ri qog'oz/gofra chiqarilsa stanok to'xtaydi yoki mahsulot brakka ketadi — bu zavodda eng qimmat xato.
**Variantlar:**
- A) Chiqimda buyurtma tanlanadi → texkartadagi material bilan skan mos kelmasa qizil ogohlantirish + bloklash — xato chiqishi to'xtaydi
- B) Faqat ogohlantirish, omborchi o'tib ketishi mumkin — moslashuvchan, lekin xato xavfi
- C) Tekshiruvsiz, omborchi o'zi mas'ul — sodda, lekin riskli
- D) Keyin — hozir kerak emas
  ↳ Agar A: mos kelmaganda kim ruxsat beradi (boshliq tasdig'i / texnolog) — variantlar: A1) smena boshlig'i, A2) texnolog, A3) hech kim (qat'iy blok)
⤳ Ta'sir: PP (texkarta), MES (to'xtash), QC (brak)

### Q1365. Gofra qavati / qog'oz grammaji chiqimda farqlanadimi
**Nima:** Kitob: bir smenada "5 qavatli gofra" va "3 qavatli gofra" aralashib chiqarilgan. Material kartasi qavat/grammaj darajasida ajratiladimi (5q ╳ 3q alohida pozitsiya).
**Nega kerak:** "Gofra" deb umumiy yozilsa, omborchi noto'g'ri qavatni chiqaradi; har qavat alohida bo'lsa skan o'zi farqlaydi.
**Variantlar:**
- A) Har grammaj/qavat alohida material kartasi (barcode darajasida farqli) — aralashtirib bo'lmaydi
- B) Bitta "gofra" kartasi, qavat — atribut/izoh — sodda, lekin aralashish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (material katalog), QC

### Q1366. Laboratoriya qabuli — kirim laborantga bog'liqmi
**Nima:** Kitob (Лаборант): kelgan qog'oz rulonlarining "namlik va grammaji" o'lchanadi; standartdan past bo'lsa "xom ashyo ishlab chiqarishga kiritilmaydi". Kirim qilingan material darrov ishlatishga tayyormi yoki "lab tekshiruvi kutilmoqda" holatida turadimi.
**Nega kerak:** Lab tasdiqlamagan material chiqimga ketsa, butun partiya qayta ishlashga ketishi mumkin (kitobdagi real holat).
**Variantlar:**
- A) Kirim "karantin/lab kutilmoqda" holatida turadi → lab OK bersa "tayyor"ga o'tadi, chiqim shundan keyin — sifat kafolati
- B) Kirim darrov tayyor, lab parallel tekshiradi — tez, lekin sifatsiz ketishi mumkin
- C) Faqat muhim material (qog'oz/bo'yoq) karantin, qolgani darrov — muvozanat
- D) Keyin — hozir kerak emas
⤳ Ta'sir: QC (lab xulosasi), MM, PP
  ↳ Agar A: karantindan chiqishni kim tasdiqlaydi — A1) laborant, A2) QC boshlig'i, A3) avto (lab natijasi tizimga tushganda)

### Q1367. Lab "rad etdi" bo'lsa material taqdiri
**Nima:** Lab namlik/grammaj past deb rad etgan partiya POS Monitor'da qanday holatga o'tadi — yetkazib beruvchiga qaytariladimi, brakka, yoki bloklangan zaxiraga.
**Nega kerak:** Rad etilgan material oddiy zaxirada qolsa, boshqa omborchi uni bilmay chiqarib yuboradi.
**Variantlar:**
- A) "Bloklangan (lab rad etdi)" holati — chiqarib bo'lmaydi, sabab bilan qaytarish/utilizatsiya tanlanadi — xato chiqish yo'q
- B) Oddiy izoh, chiqarib bo'ladi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, MM (yetkazib beruvchi reytingi), Finance (qaytarish)

### Q1368. Chiqindi va qoldiq (отходы) hisobga olinadimi
**Nima:** Kitob: "ишлаб чиқаришдан чиққан чиқиндилар ва қолдиқларни белгиланган тартибда ўз вақтида чиқариш". Ishlab chiqarish chiqindisi (kesilgan gofra qoldig'i, makulatura) POS Monitor'da harakat sifatida yoziladimi.
**Nega kerak:** Chiqindi sotiladi yoki qayta ishlatiladi (makulatura) — hisobsiz bo'lsa, qiymat va o'g'irlik ko'rinmaydi.
**Variantlar:**
- A) Alohida "chiqindi/qoldiq kirimi" harakati (makulatura ombori) — keyin sotuv/qayta ishlatish hisobga tushadi — qiymat ko'rinadi
- B) Chiqindi hisobga olinmaydi — sodda, lekin yo'qotish ko'rinmas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (chiqindi sotuvi), MM (makulatura kartasi)
  ↳ Agar A: chiqindi miqdori qaydan keladi — A1) stanok normasidan avto (reja-fakt), A2) omborchi qo'lda tortib kiritadi

### Q1369. Makulatura (ikkilamchi qog'oz) ombori alohida turmi
**Nima:** Kitob "местный (макулатура) қоғози" ni alohida tilga oladi (toza topliner emas). Qayta ishlangan/ikkilamchi material alohida ombor/pozitsiyada turadimi.
**Nega kerak:** Makulatura toza qog'oz bilan aralashsa, texkarta talab qilgan toza material o'rniga bexosdan chiqib ketadi.
**Variantlar:**
- A) Makulatura alohida ombor turi + barcode rangida farqli — aralashmaydi
- B) Bitta omborda atribut bilan — sodda, lekin xavf
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM, Q32 (texkarta mosligi)

### Q1370. Rohler/poddon (ko'chirish vositasi) kuzatiladimi
**Nima:** Kitob: rohler va poddonlar "ишга яроқли ҳолатда" bo'lishi nazorat qilinadi — bular ichki transport aktivlari. POS Monitor poddon birligida (qancha poddon material) ishlaydimi yoki faqat o'lchov birligida (kg/m).
**Nega kerak:** Zavod amalda poddon bilan ishlaydi ("3 poddon topliner"); faqat kg bo'lsa, omborchi har safar hisoblashi kerak.
**Variantlar:**
- A) Poddon + o'lchov birligi ikkalasi (1 poddon = N rulon/kg avto) — amaliyotga mos
- B) Faqat asosiy o'lchov (kg/m/dona) — sodda, lekin poddon sanog'i yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (poddon konversiyasi), IoT (poddon harakati)

### Q1371. Bo'sh poddon/rohler qaytishi hisobga olinadimi
**Nima:** Sexga material poddonda ketadi, bo'sh poddon qaytadi. POS Monitor bo'sh poddon/tara harakatini kuzatadimi (qaytarib olinadigan tara).
**Nega kerak:** Poddon — qimmat aktiv; qaytmasa yo'qoladi; kitobda "ишга яроқли ҳолатда" nazorat talab qilinadi.
**Variantlar:**
- A) Poddon — qaytariladigan aktiv, ketdi/qaytdi balansi yuritiladi — yo'qolish ko'rinadi
- B) Poddon hisobga olinmaydi (faqat material) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: IoT (aktiv kuzatuvi), Finance (aktiv)

### Q1372. Kunlik ishlab chiqarish rejasi planshetga tushadimi
**Nima:** Kitob: "1 суткалик ишлаб чиқариш режаси" har kuni planshet ekranida ko'rinadimi — bugun qaysi buyurtmaga qaysi material kerakligi ro'yxati.
**Nega kerak:** Omborchi rejani oldindan ko'rsa, materialni vaqtida tayyorlaydi (kitob: "режани olдиндан qabul qilish — muvaffaqiyatli harakat").
**Variantlar:**
- A) Kunlik reja → "bugun chiqariladigan materiallar" ro'yxati planshetda avto ko'rinadi (PP'dan) — proaktiv tayyorgarlik
- B) Reja yo'q, omborchi sex so'raganda chiqaradi — reaktiv, kechikish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (kunlik reja), MES
  ↳ Agar A: reja bajarilishi (qancha chiqarildi/qoldi) avto kuzatiladimi — A1) ha, % ko'rsatkich, A2) faqat ro'yxat

### Q1373. Bekor turish (простой) signali — material yetishmasa
**Nima:** Kitob statistikasi: "ички логистика sababli kechikishlar soni", "bekor turishlar". Sex materialsiz to'xtab qolsa, POS Monitor buni qayd qiladimi/signal beradimi.
**Nega kerak:** Kitobda bu — logistika boshlig'ining asosiy javobgarligi va statistik ko'rsatkichi; tizim qaydsiz bo'lsa, sabab kim ekani aniqlanmaydi.
**Variantlar:**
- A) Sex "material kutyapman" tugmasini bossa → vaqt sanog'i boshlanadi → omborchi/boshliqqa signal — sabab aniq qayd
- B) Bekor turish qo'lda jurnalga yoziladi — sodda, lekin sub'ektiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (to'xtash sababi), Coordination, HR (logist GSD)

### Q1374. Sexning material talabi (so'rov) planshetdan keladimi
**Nima:** Sex materialni qanday so'raydi — og'zaki/telegram, yoki POS Monitor'da "talab" yaratib, omborchi shu talab asosida chiqaradimi.
**Nega kerak:** Rasmiy talab bo'lmasa, kim nima so'raganini izlab bo'lmaydi va chiqim sababsiz qoladi.
**Variantlar:**
- A) Sex planshet/tizimda "material talabi" yaratadi → omborchi talabni tanlab chiqaradi (talab↔chiqim bog'liq) — to'liq iz
- B) Og'zaki so'rov, omborchi bo'sh chiqim yozadi — tez, lekin izsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Coordination, Kanban
  ↳ Agar A: talabni kim tasdiqlaydi (sex boshlig'i / avto) — A1) sex smena boshlig'i, A2) reja bilan mos bo'lsa avto

### Q1375. Buyurtmaga material sarfini biriktirish (kalkulyatsiya)
**Nima:** Chiqilgan material qaysi buyurtmaga ketganini POS Monitor biriktiradimi — buyurtma tannarxiga material qo'shilishi uchun.
**Nega kerak:** Buyurtma rentabelligi material sarfisiz noto'g'ri; texkarta-normadan farq (ortiqcha sarf) ko'rinmaydi.
**Variantlar:**
- A) Har chiqim buyurtmaga biriktiriladi → buyurtma material tannarxi avto yig'iladi — rentabellik aniq
- B) Faqat ombor balansi, buyurtma bog'lanmaydi — sodda, lekin tannarx noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (tannarx), SD (buyurtma rentabelligi), PP (norma-fakt)

### Q1376. Norma-fakt farqi (ortiqcha sarf) ogohlantirishi
**Nima:** Texkarta buyurtmaga N kg belgilagan; fakt chiqim undan ko'p bo'lsa POS Monitor ogohlantiradimi.
**Nega kerak:** Ortiqcha material sarfi — yashirin yo'qotish/o'g'irlik belgisi; kitobda material aniqligi muhim.
**Variantlar:**
- A) Norma oshsa qizil ogohlantirish + sabab so'raydi (brak/qayta sozlash) — yo'qotish ko'rinadi
- B) Faqat hisobotda farq ko'rinadi — passiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (norma), Finance, AI (anomaliya)

### Q1377. Turniket/kirish-chiqish bilan bog'lanishmi
**Nima:** Kitob: ishga kirish-chiqishda "турникет картаси" ishlatiladi. POS Monitor logini turniket kartasi (RFID-bejet) bilan birmi yoki alohida PIN.
**Nega kerak:** Bitta karta bo'lsa, omborchi qo'shimcha parol eslamaydi va kim ishda ekani turniketdan ma'lum.
**Variantlar:**
- A) Turniket kartasi (RFID) = planshet login — bitta identifikator, qulay
- B) Alohida PIN/barcode-bejet — soddaroq integratsiya, lekin ikki tizim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (davomat), IoT (RFID), Q2 (login)

### Q1378. A-System bilan bog'liqlik (eski tizim)
**Nima:** Kitob: zavod hozir "A-System (А-Система)" da reja/hisob yuritadi. POS Monitor A-System bilan ma'lumot almashadimi yoki uni butunlay almashtiradimi.
**Nega kerak:** Agar A-System ishlatilsa, ikki tizim qoldig'i bo'linib ketadi (memorydagi "ikki dunyo" muammosiga o'xshash).
**Variantlar:**
- A) ERP A-System'ni butunlay almashtiradi (migratsiya) — yagona haqiqat
- B) Vaqtincha parallel + sinxron ko'prik — buzilmaydi, lekin murakkab
- C) Keyin — egasi A-System taqdirini hal qilgach
⤳ Ta'sir: butun ombor/PP zanjiri

### Q1379. Ярим тайёр (yarim tayyor) bosqichlari kuzatiladimi
**Nima:** Kitob: yarim tayyor = "ishlab chiqarishning muayyan bosqichidan o'tgan mahsulot". Gofra→bichish→bosma→yopishtirish kabi bosqichlar oralig'ida yarim tayyor POS Monitor'da alohida turadimi.
**Nega kerak:** Yarim tayyor sexlar oralig'ida ko'p turadi (rohlerda); hisobsiz bo'lsa, "qancha yarim tayyor zavodda turibdi" noma'lum.
**Variantlar:**
- A) Har bosqichdan keyin yarim tayyor alohida pozitsiya (bosqich nomi bilan) qabul qilinadi — to'liq WIP ko'rinadi
- B) Faqat xom material va tayyor mahsulot, yarim tayyor kuzatilmaydi — sodda, lekin WIP ko'rinmas
- C) Faqat sexlar orasidagi ombor (bufer) uchun — muvozanat
- D) Keyin — hozir kerak emas
⤳ Ta'sir: MES (WIP), PP, Finance (WIP qiymati)

### Q1380. Texnik pasport / partiya hujjati FG kirimda
**Nima:** Kitob (Лаборант): tayyor mahsulotga "техник паспорт" tayyorlanadi. FG ombarga kirganda partiya texnik pasporti/sertifikati biriktiriladimi.
**Nega kerak:** Mijozga jo'natishda partiya sertifikati kerak; FG'ga bog'lanmasa, keyin izlab topib bo'lmaydi.
**Variantlar:**
- A) FG-kirimda partiya + texnik pasport biriktiriladi (lab xulosasidan) — jo'natishda tayyor
- B) Pasport alohida hujjatda, FG'ga bog'lanmaydi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (texnik pasport), SD (jo'natish), Q25 (partiya)

### Q1381. Lab namuna olish ombordan harakatmi
**Nima:** Kitob: laborant "tekshirilgan xom ashyo partiyalari sonini" o'lchaydi — har partiyadan namuna oladi. Lab uchun olingan namuna POS Monitor'da chiqim sifatida yoziladimi.
**Nega kerak:** Namuna ham material sarfi; hisobsiz bo'lsa, balans namuna miqdoricha og'adi.
**Variantlar:**
- A) "Lab namunasi" alohida chiqim sababi (kichik, lekin qayd) — balans aniq
- B) Namuna hisobga olinmaydi — sodda, lekin og'ish to'planadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (lab), Q5 (chiqim sababi)

### Q1382. Smenadan smenaga material topshirish (kitob "Юкни топширувчи Омборчи")
**Nima:** root.md da "Юкни топширувчи (Омборчи)" topshirish hujjati bor. Smena oxirida qoldiq keyingi smenaga rasmiy topshiriladimi (ikki imzo: topshiruvchi/qabul qiluvchi).
**Nega kerak:** Topshirishsiz, smena oralig'ida farq chiqsa kim mas'ul ekani noaniq.
**Variantlar:**
- A) Smena topshirish akti: chiqayotgan omborchi qoldiqni muhrlaydi → kelayotgan qabul qiladi (2 imzo) — javobgarlik aniq
- B) Faqat avto smena yopilishi, qabul imzosi yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (javobgarlik), Q27 (smena yopilishi)

### Q1383. Yuk topshirish-qabul akti (kirimda yetkazib beruvchi bilan)
**Nima:** root.md "Юкни топширувчи/қабул қилувчи" — kirimda yetkazib beruvchi/haydovchi va omborchi o'rtasida qabul akti rasmiylashtiriladimi.
**Nega kerak:** Kelgan miqdor zakazdan kam/buzuq bo'lsa, aktda qayd etilmasa da'vo qilib bo'lmaydi.
**Variantlar:**
- A) Kirim akti: zakaz-fakt farqi + holat (buzilgan/kam) qayd → da'vo asosi — himoyalangan
- B) Faqat miqdor kiritiladi, akt yo'q — sodda, lekin da'vosiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (da'vo), MM (yetkazib beruvchi), Q4 (kirim)

### Q1384. Kam yetkazilgan/buzuq material qabul rejimi
**Nima:** Kelgan miqdor zakazdan kam yoki bir qismi buzuq bo'lsa POS Monitor qisman qabulga ruxsat beradimi (kelganini qabul, qolganini "kutilmoqda").
**Nega kerak:** Hammasi yoki hech narsa bo'lsa, kelgan yaroqli material ham ishlatilmay turadi.
**Variantlar:**
- A) Qisman qabul (kelgan miqdor) + ochiq qoldiq + buzuq qismi alohida sabab — moslashuvchan va aniq
- B) Faqat to'liq qabul yoki rad — sodda, lekin qattiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM, Finance, Q51 (qabul akti)

### Q1385. Tozalik / 5S holati planshetda
**Nima:** Kitob "Кўп учрайдиган хатолар": "Тозаликка эътибор бермаслик". Ombor tozaligi/tartibi (5S) POS Monitor'da kuzatiladimi yoki bu modul tashqarisida.
**Nega kerak:** Kitob buni mas'uliyat deb belgilaydi; lekin POS Monitor — material harakati moduli, tozalik boshqa joyga tegishli bo'lishi mumkin.
**Variantlar:**
- A) Tozalik POS Monitor'dan tashqarida (Coordination/checklist moduli) — toza chegara
- B) Smena yopilishida qisqa "tozalik/tartib OK" belgisi — yengil integratsiya
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination, HR (intizom)

### Q1386. Iш jойни ruxsatsiz tashlab ketish (planshet bog'liqligi)
**Nima:** Kitob xatolar: "иш жойини рухсатсиз ташлаб кетиш". Planshet ma'lum vaqt harakatsiz tursa/omborchi yo'q bo'lsa tizim buni qayd qiladimi.
**Nega kerak:** Omborsiz qolgan smena = sex kutib qoladi; kitobda bu jiddiy intizom buzilishi.
**Variantlar:**
- A) Planshet harakatsizligi + javobsiz talab boshliqqa signal — nazorat
- B) Faqat turniket chiqishi bilan bog'liq — yengilroq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), Q41 (bekor turish)

### Q1387. Energiya/resurs (suv/gaz/svet) tejash POS'da
**Nima:** Kitob javobgarligi: "Энергия ресурсларни тежалиши (сув, газ свет)". Bu POS Monitor (material) doirasidami yoki IoT/Coordination'da.
**Nega kerak:** Chegarani aniqlash — POS Monitor material harakatiga e'tibor qaratishi kerak, resurs hisoblagichi IoT'ga tegishli.
**Variantlar:**
- A) Energiya — IoT/Coordination moduli, POS Monitor'da yo'q — toza chegara
- B) Keyin — hozir kerak emas
⤳ Ta'sir: IoT (hisoblagich), Director (KPI)

### Q1388. Omborchi GSD: "reja bajarilish %" kitobdan
**Nima:** Kitob statistik ko'rsatkichlari: "режа бажарилиш даражаси (%)", "кечикишлар сони", "режадан оғиш сони". Omborchi/logist GSD aynan shu uch ko'rsatkichdan POS Monitor'da avto hisoblanadimi.
**Nega kerak:** Karta-modelда har lavozim o'z statistikasiga ega; kitob aynan bu raqamlarni belgilagan — qo'lda kiritish noto'g'ri.
**Variantlar:**
- A) Uch ko'rsatkich (reja % + kechikish soni + og'ish soni) POS harakatlaridan avto → logist kartasiga — kitobga to'liq mos
- B) Faqat reja % avto, qolgani qo'lda — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta GSD), Director, Q29

### Q1389. Material birligi konversiyasi (rulon↔kg↔m)
**Nima:** Qog'oz rulonda keladi, sexga metr/kg bilan beriladi. POS Monitor bir birlikni boshqasiga avto o'giradimi.
**Nega kerak:** Omborchi qo'lda hisoblasa xato bo'ladi; kirim rulon, chiqim metr bo'lishi tabiiy.
**Variantlar:**
- A) Har materialga konversiya jadvali (1 rulon = N kg = M metr) → avto o'tkazish — xatosiz
- B) Faqat bitta birlik, qo'lda hisob — sodda, lekin xatoli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (birlik), Q14 (baholash)

### Q1390. Buyurtma yopilgach ortib qolgan material
**Nima:** Buyurtma uchun chiqarilgan material to'liq ishlatilmasa (ortdi), u POS Monitor'da omborga qaytariladimi.
**Nega kerak:** Qaytmasa, material sexda "yo'qoladi" va buyurtma tannarxi noto'g'ri oshadi.
**Variantlar:**
- A) "Sexdan qaytarish" harakati (ortgan material omborga qaytadi, tannarxdan chiqadi) — aniq
- B) Qaytarish yo'q, hammasi sarf hisoblanadi — sodda, lekin tannarx shishiradi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (tannarx), Q43, Q58

### Q1391. Yetkazib beruvchiga qaytarish (vozvrat)
**Nima:** Sifatsiz/noto'g'ri kelgan material yetkazib beruvchiga qaytarilsa POS Monitor'da qaytarish harakati bormi.
**Nega kerak:** Qaytarish — kirimning teskarisi + Finance da'vosi; oddiy chiqim deb yozilsa, da'vo va balans buziladi.
**Variantlar:**
- A) Alohida "yetkazib beruvchiga qaytarish" harakati → Finance da'vo/kredit-nota — to'liq iz
- B) Oddiy chiqim izoh bilan — sodda, lekin da'vosiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (kredit-nota), MM (yetkazib beruvchi reytingi)

### Q1392. Material muddati (срок годности) — bo'yoq/elim
**Nima:** Bo'yoq, elim, lak kabi materiallar muddati o'tadi. POS Monitor muddati yaqinlashganda ogohlantiradimi va FEFO (muddati birinchi tugaydi — birinchi chiqadi) qo'llaydimi.
**Nega kerak:** Muddati o'tgan elim brak beradi; ogohlantirishsiz qolib ketadi.
**Variantlar:**
- A) Muddatli materiallarga FEFO + yaqinlashganda ogohlantirish — yo'qotish kamayadi
- B) Faqat partiya, muddat ogohlantirishsiz — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, MM, Q25 (partiya)

### Q1393. Joylashuv (ombordagi joy / yacheyka) kuzatiladimi
**Nima:** Material ombordagi aniq joyda (rad/yacheyka/zona) turadimi yoki faqat "RM-MAIN omborda" darajasida.
**Nega kerak:** Katta omborda joyni bilmasa, omborchi materialni izlab vaqt yo'qotadi; rohler yo'lini ham rejalashtirib bo'lmaydi.
**Variantlar:**
- A) Joy (zona/rad) kuzatiladi, kirimda belgilanadi, chiqimda ko'rsatiladi — tez topish
- B) Faqat ombor darajasida, joysiz — sodda, lekin izlash sekin
- C) Faqat FG (tayyor mahsulot) uchun joy, xom material — joysiz
- D) Keyin — hozir kerak emas
⤳ Ta'sir: IoT, MES, ichki logistika marshruti

### Q1394. Mijoz materiali (давальческое) ajratiladimi
**Nima:** Ba'zan mijoz o'z qog'ozini/dizaynini beradi (давальческое сырьё). Bunday material POS Monitor'da zavod mulkidan ajratiladimi.
**Nega kerak:** Mijoz materiali zavod balansiga qiymat sifatida tushmasligi kerak (zavodniki emas), lekin miqdor kuzatilishi shart.
**Variantlar:**
- A) "Mijoz materiali" alohida turi — miqdor kuzatiladi, qiymat zavod GL'ga tushmaydi — to'g'ri huquqiy holat
- B) Oddiy material kabi — sodda, lekin balansni shishiradi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (balans), SD (mijoz), Q12 (GL)

### Q1395. Inventar paytida ombor "muzlatiladimi" (freeze)
**Nima:** Sanash davomida kirim/chiqim davom etadimi yoki sanalayotgan zona bloklanadimi.
**Nega kerak:** Sanash chog'ida harakat bo'lsa, sanog'i hech qachon to'g'ri chiqmaydi (harakatlanayotgan miqdorni sanash mumkin emas).
**Variantlar:**
- A) Sanalayotgan zona harakatga vaqtincha bloklanadi (freeze) → sanab bo'lgach ochiladi — aniq natija
- B) Harakat davom etadi, tizim oraliq farqni hisoblaydi — uzluksiz, lekin murakkab
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (sex kutadi), Q15 (inventar)

### Q1396. Inventar farqi chegarasi (avto-tasdiq limiti)
**Nima:** Kichik farq (masalan ±1%) avto tasdiqlanadimi yoki har farq boshliq tasdig'ini talab qiladimi.
**Nega kerak:** Har mayda farqqa boshliq tasdig'i — sekin; lekin chegara bo'lmasa katta farq ham o'tib ketadi.
**Variantlar:**
- A) Belgilangan chegaragacha (masalan ±N% yoki summagacha) avto, undan ortig'i tasdiq talab — muvozanat
- B) Har farq tasdiq talab qiladi — xavfsiz, lekin sekin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance, Q16 (inventar tasdiqi)

### Q1397. Tezkor minimal qoldiq — kim zakaz beradi
**Nima:** Material minimaldan tushganda POS Monitor avto sotib olish talabini (purchase request) MM'ga yuboradimi yoki faqat omborchini ogohlantiradimi.
**Nega kerak:** Ogohlantirish odamga qolsa unutiladi; avto talab uzilishni oldini oladi (kitob: ta'minot uzilmasligi).
**Variantlar:**
- A) Minimaldan tushsa avto "sotib olish talabi" → MM/snabjeniyega — proaktiv
- B) Faqat omborchiga ogohlantirish, u qo'lda so'raydi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (snabjeniye), Finance (byudjet), Q11

### Q1398. Buyurtma uchun rezerv (band qilish)
**Nima:** Reja buyurtmaga material belgilaganda, u POS Monitor'da "band" (rezerv) qilinadimi — boshqa buyurtma uni ololmasin.
**Nega kerak:** Rezervsiz bo'lsa, bitta material ikki buyurtmaga "tegishli" ko'rinib, biri materialsiz qoladi.
**Variantlar:**
- A) Reja material rezervlaydi → erkin qoldiq alohida ko'rinadi (jami ╳ erkin) — ishonchli reja
- B) Rezerv yo'q, kim oldin chiqarsa o'shaники — sodda, lekin to'qnashuv xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (reja), MES, Q40

### Q1399. Shoshilinch chiqim (rejasiz/ruxsatli)
**Nima:** Reja tashqarisida shoshilinch material kerak bo'lsa (avariya, qayta sozlash) omborchi rejasiz chiqim qila oladimi.
**Nega kerak:** Reja qattiq bloklasa, real ishlab chiqarish to'xtaydi; lekin rejasiz chiqim sababsiz bo'lmasligi kerak.
**Variantlar:**
- A) Rejasiz chiqim ruxsat etiladi, lekin majburiy sabab + boshliq darhol xabardor — moslashuvchan + nazorat
- B) Faqat rejadagi material chiqadi — qattiq, lekin amaliyotga zid
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP, Q42 (talab), Q67

### Q1400. Bichish/qirqish chiqimi (ko'p materialdan bo'lak)
**Nima:** Bitta katta rulondan bir necha buyurtmaga bo'lib chiqariladi. POS Monitor rulondan qisman chiqim (qoldiq rulonda qoladi) ni qo'llaydimi.
**Nega kerak:** Rulon "butun yoki yo'q" bo'lsa, real bichish (yarmi ishlatildi) hisobga tushmaydi.
**Variantlar:**
- A) Qisman chiqim — rulon qoldig'i o'lchov birligida kamayadi (ochiq rulon) — aniq
- B) Faqat butun rulon chiqimi — sodda, lekin noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (o'lchov), Q57 (konversiya), Q68

### Q1401. Foto-dalil (kirim/brak/inventar farqi)
**Nima:** Buzuq kelgan material, brak yoki inventar farqida planshet kamerasidan foto biriktiriladimi.
**Nega kerak:** Foto — da'vo va auditda eng kuchli dalil; keyin "buzuq edi" deganda isbot bo'ladi.
**Variantlar:**
- A) Buzuq qabul/brak/katta farqda foto majburiy — dalil bilan himoya
- B) Foto ixtiyoriy — yengilroq, lekin dalilsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, Finance (da'vo), Q51

### Q1402. Offline yozilgan harakat to'qnashuvi (konflikt)
**Nima:** Q21 offline rejimni qabul qildi. Ikki planshet offline bir materialni chiqarib, ikkalasi sinxronlanganda qoldiq manfiy chiqsa tizim nima qiladi.
**Nega kerak:** Offline + manfiy guard birga ishlashi kerak; aks holda sinxronda buzilgan balans paydo bo'ladi.
**Variantlar:**
- A) Sinxronda to'qnashuv aniqlansa — harakat "tekshirilsin" holatiga, boshliq hal qiladi — ma'lumot toza
- B) Birinchi sinxron yutadi, ikkinchi rad — sodda, lekin ish yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Q10 (balans-guard), Q21 (offline)

### Q1403. Telegram/bildirishnoma — qaysi hodisa kimga
**Nima:** Minimal qoldiq, brak, bekor turish, lab rad — qaysi hodisada kimga (omborchi/boshliq/snabjeniye) bildirishnoma boradi.
**Nega kerak:** Hamma hodisa hammaga borsa — shovqin; kerakli odam o'tkazib yuboradi.
**Variantlar:**
- A) Hodisa→rol matritsasi sozlanadi (admin panelda) — moslashuvchan
- B) Kodda qat'iy belgilangan — sodda, lekin o'zgartirish uchun dasturchi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Notifications, Q28 (master-data)

### Q1404. Tayyor mahsulot jo'natish (отгрузка) POS'dami
**Nima:** FG mijozga jo'natilganda chiqim POS Monitor'da bo'ladimi yoki bu SD/jo'natish modulida.
**Nega kerak:** Chegara aniq bo'lmasa, jo'natish ikki joyda yoki hech qayerda yozilmaydi.
**Variantlar:**
- A) FG jo'natish chiqimi POS Monitor'da, lekin SD jo'natish hujjatiga bog'liq (sotuv buyurtmasidan) — yagona manba + bog'liqlik
- B) Jo'natish butunlay SD modulida, POS Monitor faqat FG kirimi — toza ajratish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (jo'natish), Finance (sotuv), Q24 (FG kirim)

### Q1405. Marshrut varaqasi (накладная) chop etish
**Nima:** Chiqim/ko'chirishda qog'oz накладная (yuk varaqasi) chop etiladimi (haydovchi/sex imzosi uchun).
**Nega kerak:** Zavodda hujjat qog'ozda yuriydi (kitob 2020); butun raqamli o'tish bir zumda bo'lmaydi.
**Variantlar:**
- A) Harakatda накладная chop etish opsiyasi (printerga) — o'tish davri uchun qulay
- B) Faqat raqamli, qog'oz yo'q — toza, lekin amaliyotga keskin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Q7 (printer), SD (jo'natish hujjati)

### Q1406. Razряд/malaka — kim qaysi harakatni qila oladi
**Nima:** Karta-modelда razряd bor. Yangi omborchi (past razряd) faqat oddiy chiqim, brak/inventar/qaytarish kabi muhim harakatlar — yuqori razряd/tasdiq talab qiladimi.
**Nega kerak:** Vizyon razряdga oylik/talabni bog'laydi; harakat huquqi ham razряdga bog'lansa, xato kamayadi.
**Variantlar:**
- A) Harakat turi razряd/lavozimga bog'liq (oddiy ╳ muhim) — bosqichma-bosqich ishonch
- B) Hamma omborchi hamma harakatni qila oladi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (razряd), Q9 (tasdiq), Q2

### Q1407. Kunlik hisobotni kim ko'radi (vertikal)
**Nima:** Smena/kunlik ombor hisoboti org-kartadagi keyingi yuqori darajaga (manager_id) avto boradimi.
**Nega kerak:** Vizyon vertikali — har ko'rsatkich yuqoriga oqadi; ombor hisoboti logistika boshlig'i→ishlab chiqarish→CEO yo'nalishida ko'rinishi kerak.
**Variantlar:**
- A) Kunlik hisobot vertikal yuqoriga avto (har daraja o'z kesimini ko'radi) — vizyonga mos
- B) Faqat ombor boshlig'i ko'radi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sир: Director, Coordination, Q56

### Q1408. Buyurtma o'zgarishi (kitob: "o'zgarishlarni hisobga olmaslik" xatosi)
**Nima:** Kitob xatosi: "ишлаб чиқаришдаги ўзгаришларни ҳисобга олмаслик". Reja/buyurtma o'zgarsa (bekor/miqdor o'zgardi), POS Monitor allaqachon chiqarilgan materialga qanday ishlov beradi.
**Nega kerak:** Buyurtma bekor bo'lsa-yu material chiqib ketgan bo'lsa, u sexda qolib ketadi (kitobdagi tipik xato).
**Variantlar:**
- A) Buyurtma o'zgarsa POS Monitor ogohlantiradi + chiqarilgan material qaytarish taklif qilinadi — uzilish kamayadi
- B) O'zgarish faqat rejada, ombor xabardor emas — sodda, lekin xato qaytadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (reja o'zgarishi), SD, Q58 (qaytarish)

### Q1409. Tunги smena / kechki harakat anomaliyasi
**Nima:** Q20 anomaliyani qabul qildi. Aniq misol: tunda (smena yo'q vaqtda) harakat yoki bir omborchining odatdan tashqari katta chiqimi — POS Monitor maxsus belgilaydimi.
**Nega kerak:** Kitobда material aniqligi va o'g'irlik xavfi muhim; vaqt+miqdor anomaliyasi eng aniq belgi.
**Variantlar:**
- A) Smena jadvalidan tashqari vaqt + norma-oshiq chiqim avto shubhali belgilanadi → boshliq — proaktiv
- B) Faqat hisobotda — passiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (anomaliya), HR (smena jadvali), Q44, Q77

### Q1410. Material kartasini kim yaratadi (omborchimi)
**Nima:** Yangi material birinchi marta kelganda, omborchi planshetda yangi material kartasi yarata oladimi yoki faqat MM master-data'da bo'lgani chiqim/kirim qilinadi.
**Nega kerak:** Omborchi karta yaratsa — dublikat/xato katalog paydo bo'ladi (memorydagi master-data ust-ustlik muammosi); lekin kuta olmasa ish to'xtaydi.
**Variantlar:**
- A) Faqat MM tasdiqlagan material kartasi ishlatiladi; yangisi MM'ga so'rov sifatida boradi — toza katalog
- B) Omborchi vaqtincha karta yaratadi, MM keyin tasdiqlaydi — tez, lekin dublikat xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sир: MM (master-data), Q33, Q37

### Q1411. Eski tizimdan boshlang'ich qoldiq (начальный остаток)
**Nima:** POS Monitor ishga tushganda omborda allaqachon turgan material qoldig'i qanday kiritiladi — bir martalik inventar bilanmi yoki A-System'dan import.
**Nega kerak:** Boshlang'ich qoldiqsiz balans noldan boshlanadi va birinchi chiqimda manfiy chiqadi.
**Variantlar:**
- A) Ishga tushishda bir martalik to'liq inventar (real sanash) → boshlang'ich qoldiq — eng ishonchli
- B) A-System'dan import — tez, lekin eski xatolar ko'chadi
- C) Keyin — egasi A-System taqdirini hal qilgach (Q46)
⤳ Ta'sир: Q46 (A-System), Q15 (inventar)

### Q1412. Harakat tarixini kim ko'ra oladi (audit)
**Nima:** Bitta material bo'yicha hamma harakat tarixini (kim, qachon, qancha) kim ko'ra oladi — har omborchimi yoki faqat boshliq/audit.
**Nega kerak:** Tarix — auditning asosi; ko'rinmasa nizo/farqni kuzatib bo'lmaydi, lekin har kim o'zgartira olmasligi kerak (faqat o'qish).
**Variantlar:**
- A) Tarix o'zgarmas (faqat o'qish) — omborchi o'ziniki + boshliq hammasi — toza audit
- B) Faqat boshliq ko'radi — yopiq, lekin omborchi o'zini tekshira olmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sир: Director (audit), Q22 (storno)

### Q1413. Yuk topshirishda nomuvofiqlik (root.md akti)
**Nima:** root.md "Юкни топширувчи (Омборчи)" aktida topshirilgan va qabul qilingan miqdor farq qilsa (sexga 10 ketdi, sex 9 qabul qildi) POS Monitor bu farqni qanday yopadi.
**Nega kerak:** Farq yopilmasa, 1 birlik "havoda" qoladi — kim mas'ul noaniq.
**Variantlar:**
- A) Topshirish↔qabul ikki imzo bilan tasdiqlanadi; farq bo'lsa "nizo" holati + boshliq hal qiladi — javobgarlik aniq
- B) Topshiruvchi miqdori asos, qabul tekshirmaydi — sodda, lekin farq yashirin
- C) Keyin — hozir kerak emas
⤳ Ta'sир: MES (sex qabuli), Q50, Q31

### Q1414. POS Monitor til/ko'rinish (omborchi uchun)
**Nima:** Planshet interfeysi qaysi tilda — o'zbek lotin, kirill yoki rus (kitob hujjatlari kirill o'zbek + rus aralash; omborchilar har xil savodxon).
**Nega kerak:** Omborchi tushunmagan tildagi tugma — xato bosadi; kitob kirill-o'zbek va rusda yozilgan.
**Variantlar:**
- A) Omborchi profilidan til tanlanadi (lotin/kirill/rus), ikonka-markaz dizayn — hamma uchun ochiq
- B) Faqat lotin o'zbek — sodda, lekin keksa xodimlarga qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sир: i18n, Q26 (ekran)

DONE: POS Monitor — 52.

## 20. Communication Center / Hujjat

### Q1415. "Og'zaki qayd etilmagan = qaror yo'q" qoidasi tizimga kiritiladimi
**Nima:** Kommunikatsiya siyosatidagi "Ёзма қайдсиз қарор қабул қилинган деб ҳисобланмайди" qoidasi ERP da amalda — ya'ni rasman qayd etilmagan og'zaki kelishuv tizimda "qaror" maqomi olmaydimi.
**Nega kerak:** Zavodda asosiy muammo — "juda zaril, og'zaki ayttim" bosimi. Tizim faqat yozma qaydni tan olsa, og'zaki bosim kuchini yo'qotadi.
**Variantlar:**
- A) Faqat hujjat-modulda qayd etilgan qaror "rasmiy" maqom oladi; og'zaki kelishuv qayd etilmaguncha ijroga asos bo'lmaydi — siyosatga to'liq mos.
- B) Og'zaki qaror ham tan olinadi, keyin yozib qo'yiladi — yumshoq, lekin bosim qaytadi.
- C) Keyin — hozir bu darajada qattiq emas.
⤳ Ta'sir: Production (reja o'zgartirish), Koordinatsiya, KPI (jawobgarlik).

### Q1416. Kommunikatsiya turi har shablonga oldindan belgilanadimi
**Nima:** Siyosatda 5 tur bor (yozma majburiy / og'zaki cheklangan / vertikal / gorizontal / analitik). Har hujjat shabloni qaysi turga tegishli ekani oldindan belgilanadimi.
**Nega kerak:** "Qaysi masala yozma, qaysi og'zaki" — siyosatning asosiy maqsadi. Shablon turini biladigan bo'lsa, tizim to'g'ri kanalni majbur qiladi.
**Variantlar:**
- A) Har shablonga "kommunikatsiya turi" tegi (yozma-majburiy/analitik/...) — tizim shunga qarab kanalni tanlaydi — siyosatga mos.
- B) Hamma hujjat bir xil yozma oqim — sodda, lekin tur farqi yo'qoladi.
- C) Keyin.

### Q1417. "Yozma majburiy" hujjatlar ro'yxati qattiq belgilanadimi
**Nima:** Siyosat aniq sanaydi: qarorlar, reja o'zgarishlari, vazifalar, tех карта o'zgarishlari, sifat xulosalari, rasmiy ogohlantirishlar — FAQAT yozma. Bu turlar tizimda og'zaki/chat orqali o'tishi taqiqlanadimi.
**Nega kerak:** Bu 6 tur eng muhim — ular chatda yo'qolib ketsa, jarayon nazoratsiz qoladi.
**Variantlar:**
- A) Bu 6 tur uchun majburiy hujjat-shablon; chat/og'zaki bilan rasmiylashtirib bo'lmaydi — siyosatga aniq mos.
- B) Tavsiya qilinadi, lekin majbur qilinmaydi — moslashuvchan, lekin teshik qoladi.
- C) Keyin.

### Q1418. "Bevosita rahbarni chetlab o'tish" bloklanadimi (vertikal kommunikatsiya)
**Nima:** Siyosat: "Бевосита раҳбарни четлаб ўтиб мурожаат қилиш фавқулодда ҳолатлардан ташқари тақиқланади". Marshrut shuni majbur qiladimi — xodim to'g'ridan direktorga yoza olmaydimi.
**Nega kerak:** Vertikal tartib buzilsa, rahbarlar o'z bo'limidan bexabar qoladi va javobgarlik tarqaladi.
**Variantlar:**
- A) Marshrut har doim bevosita rahbardan boshlanadi; faqat "favqulodda" turi rahbarni chetlab o'tishga ruxsat beradi (sabab majburiy) — siyosatga mos.
- B) Xodim istalgan odamni tanlay oladi — erkin, lekin tartib buziladi.
- C) Keyin.
  ↳ Agar A: "Favqulodda" turini kim tasdiqlaydi — A) yuboruvchi o'zi belgilaydi (keyin tekshiriladi) / B) faqat HR/super-admin yoqadi / C) keyin.

### Q1419. Gorizontal kommunikatsiya — vakolat doirasi tekshiriladimi
**Nima:** Siyosat: bo'limlar (СОЗ, ОТК, Совершенствование) bir-biriga "fақат ўз ваколатлари доирасида" yozadi; "бир бўлим иккинчи бўлим вазифасига аралашмайди". Tizim bo'limlararo hujjat turlarini cheklab qo'yadimi.
**Nega kerak:** Bo'lim chegarasi buzilsa ("sizning ishingizga aralashmang") nizo chiqadi; tizim qaysi bo'lim qaysi bo'limga qaysi turdagi hujjat yo'llay olishini bilishi kerak.
**Variantlar:**
- A) Bo'limlararo ruxsat matritsasi: kim kimga qaysi tur hujjat yo'llay oladi — belgilanadi — siyosatga mos.
- B) Hamma bo'lim hammasiga yoza oladi — erkin, lekin chegara yo'q.
- C) Keyin.

### Q1420. Analitik hujjatlar faqat Совершенствование orqali o'tadimi
**Nima:** Siyosat: tahlil/xulosa/sifat ma'lumotlari "Совершенствование бўлими орқали тузилиб" tegishli bo'limlarga va 5-departament rahbariga taqdim etiladi. Tahlil-turdagi hujjatlar shu bo'limdan majburiy o'tadimi.
**Nega kerak:** Tahlil tarqoq qilinsa, har kim o'z xulosasini chiqaradi; yagona analitik markaz bo'lishi kerak.
**Variantlar:**
- A) "Tahlil/xulosa" shabloni faqat Совершенствование yarata oladi yoki undan o'tadi — markazlashgan.
- B) Har bo'lim o'z tahlilini mustaqil chiqaradi — tez, lekin tarqoq.
- C) Keyin.

### Q1421. Yuboruvchi va qabul qiluvchining ikki tomonlama javobgarligi
**Nima:** Siyosat: yuboruvchi "ma'lumot to'g'riligi va to'liqligi" uchun, qabul qiluvchi "o'z vaqtida ko'rib chiqish va javob berish" uchun javobgar. Tizim ikkalasini ham qaydlaydimi.
**Nega kerak:** "Men yubordim" / "men ko'rmadim" bahslarini hal qiladi — kim qachon ko'rgani va javob bergani aniq bo'ladi.
**Variantlar:**
- A) Ha: yuborildi/ko'rildi/javob berildi vaqt-belgilari + javobgar lavozim har ikki tomonda saqlanadi — bahsni yopadi.
- B) Faqat yuborilgani qayd etiladi — yarim isbot.
- C) Keyin.

### Q1422. Hujjat mas'uliyati lavozimga bog'lanadi (xodimga emas)
**Nima:** "Масъулият бўлимга эмас, лавозимга боғланади" siyosati hujjat-javobgarligiga ham qo'llaniladimi — ya'ni hujjat "СОЗ бошлиғи лавозими" ga bog'lanadi, ism emas.
**Nega kerak:** Xodim almashsa hujjat-javobgarligi uzilmasligi kerak; bu egasining karta-markazli modeliga ham mos.
**Variantlar:**
- A) Har hujjatda "javobgar lavozim" maydoni (org-karta) — xodim almashsa avtomat yangi egaga o'tadi — siyosat + karta-modelga mos.
- B) Javobgar xodim ismiga bog'lanadi — sodda, lekin xodim ketsa uziladi.
- C) Keyin.

### Q1423. Javobgarlikni og'zaki boshqaga o'tkazish taqiqlanadimi
**Nima:** "Масъулиятни бошқа шахсга оғзаки ўтказишга йўл қўйилмайди". Hujjatni boshqaga o'tkazish (delegate) faqat tizim orqali yozma bo'ladimi.
**Nega kerak:** "Men aytib qo'ygandim unga" degan teshikni yopadi; delegatsiya iz qoldirishi kerak.
**Variantlar:**
- A) Hujjatni o'tkazish faqat "delegate/o'tkazish" amali bilan (sabab + qabul qiluvchi) qayd etiladi — og'zaki o'tkazish yo'q.
- B) Boshliq og'zaki topshirsa ham bo'ladi — moslashuvchan, lekin izsiz.
- C) Keyin.

### Q1424. "Qaror qaysi ma'lumotga tayanganini" hujjat ko'rsatadimi
**Nima:** Ma'lumotlar siyosati: "Барча қарорлар қабул қилинганда қайси маълумот асос бўлгани аниқ кўрсатилиши шарт". Hujjat-qarorda "asos ma'lumot/manba" maydoni bo'ladimi.
**Nega kerak:** Eski yoki noto'g'ri ma'lumotga tayangan qarorlarni keyin tekshirish mumkin bo'ladi.
**Variantlar:**
- A) Tasdiq/qaror oynasida "asos: qaysi hujjat/ma'lumot raqami" majburiy maydon — manba kuzatiladi.
- B) Asos maydoni ixtiyoriy — yengil, lekin auditda teshik.
- C) Keyin.

### Q1425. "Eski ma'lumot ustida ishlash taqiqlanadi" — versiya qulfi
**Nima:** Ma'lumotlar siyosati: "эски маълумот устида ишлашга йўл қўйилмайди". Hujjat eskirgan (yangi versiya chiqqan) bo'lsa, tizim eski nusxa ustida amal qilishni bloklaydimi.
**Nega kerak:** Eski tех карта/reja ustida ishlash zavodda real xato manbai (oргполитика shuni aytadi).
**Variantlar:**
- A) Versiyalangan hujjat: yangi versiya chiqsa eskisi "eskirgan" deb belgilanib, ustida yangi amal bloklanadi — siyosatga mos.
- B) Faqat oxirgi versiya ko'rsatiladi, eskisi shunchaki yashiriladi — yengil, lekin qattiq emas.
- C) Keyin.

### Q1426. Har bo'lim faqat o'z vakolatidagi ma'lumotni yangilaydi
**Nima:** "Ҳар бир бўлим фақат ўз ваколатига тегишли маълумотни янгилашга ҳақли; бошқа бўлим маълумотларига ўзбошимчалик ўзгартириш тақиқланади". Hujjat-maydonlari bo'lim-vakolatiga qarab qulflanadimi.
**Nega kerak:** Bir bo'lim boshqasining ma'lumotini buzmasligi kerak; tahrir huquqi vakolatga bog'lanadi.
**Variantlar:**
- A) Hujjat maydonlari bo'lim-vakolatiga ko'ra tahrir-huquqi oladi (СОЗ rejani, ОТК sifatni) — siyosatga mos.
- B) Tasdiqlovchi hamma maydonni tahrirlay oladi — sodda, lekin chegara yo'q.
- C) Keyin.

### Q1427. Ma'lumot yetishmasa — rasmiy "talab" hujjati
**Nima:** Siyosat: tahlilda ma'lumot yetishmasa, Совершенствование "ушбу маълумотни шакллантириш учун жавобгар бўлган бўлим бошлиғига расмий талаб" yo'llaydi — yozma, muddat bilan. Bu maxsus shablon bo'ladimi.
**Nega kerak:** "Ma'lumot bering" so'rovi rasmiylashsa, muddat va javobgarlik aniq bo'ladi.
**Variantlar:**
- A) "Ma'lumot talabi" shabloni: kimga + qaysi ma'lumot + muddat → tasdiq → javob hujjat sifatida qaytadi — siyosatga mos.
- B) Oddiy xabar bilan so'raladi — yengil, lekin muddat/iz yo'q.
- C) Keyin.

### Q1428. Reja o'zgarishi hujjati — tashabbuskor + sabab + natija
**Nima:** Reja-o'zgartirish siyosati: o'zgarish "фақат ёзма, A-System ёки Bitrix орқали; ўзгариш ташаббускори, сабаби ва натижаси аниқ қайд этилади". Shu uch maydon hujjat shablonida majburiy bo'ladimi.
**Nega kerak:** "Juda zaril" og'zaki bosimni yo'q qilish — egasining alohida ta'kidlagan muammosi.
**Variantlar:**
- A) "Reja o'zgartirish" shabloni: tashabbuskor + sabab (ro'yxatdan) + kutilgan natija — uchchalasi majburiy → tasdiq → ijro.
- B) Erkin matn bilan so'raladi — yengil, lekin maydonlar yo'q.
- C) Keyin.
⤳ Ta'sir: Production reja, MES, KPI (operator vaqti hisobi).

### Q1429. Reja o'zgartirish sabab-ro'yxati (qattiq tasnif)
**Nima:** Siyosat aniq sabab guruhlari beradi: material yo'qligi / dastgoh buzilishi / mijoz talabi o'zgarishi / rejalashtirish xatosi / rahbar qarori. Hujjatda sabab shu yopiq ro'yxatdan tanlanadimi.
**Nega kerak:** Erkin matn o'rniga qattiq tasnif — oylik tahlil (qaysi sabab ko'p) avtomat chiqadi.
**Variantlar:**
- A) Sabab faqat shu 5 guruhdan tanlanadi (dropdown) + izoh — tahlil avtomatlashadi.
- B) Erkin matn — yengil, lekin guruhlanmaydi.
- C) Keyin.

### Q1430. "Buyurtma 100% tugamaguncha o'tish taqiq" qoidasini hujjat majbur qiladimi
**Nima:** Siyosat: tugatilmagan buyurtmani qoldirib o'tish FAQAT "расмий тасдиқланган режа ўзгариши" bo'lsa mumkin; jawobgar + sabab alohida qayd. Tizim shu rasmiy hujjatsiz o'tishni bloklaydimi.
**Nega kerak:** Yarim qolgan buyurtma + qayta sozlash vaqti yo'qotilishi — egasining muammosi.
**Variantlar:**
- A) Buyurtmani 100% dan oldin yopib o'tish uchun "reja o'zgartirish" hujjati tasdiqlangan bo'lishi shart — bog'liqlik majburiy.
- B) Operatorga ogohlantirish, lekin bloklanmaydi — yumshoq.
- C) Keyin.
⤳ Ta'sir: Production / MES (buyurtma yopish), Q-40 (ishlaydi≠to'g'ri).

### Q1431. Smena yakuni xulosasi — har kun majburiy hujjat
**Nima:** Smena-tahlil siyosati: har ish kuni yakunida smena rejalashtiruvchisi xulosani rasmiylashtiradi (bajarilgan/bajarilmagan/o'zgarish+sabab), "ўша куннинг ўзида" bosh rejalashtirishga topshiradi — keyingi kunga qoldirib bo'lmaydi. Tizim shuni kuniga bir marta majburiy qiladimi.
**Nega kerak:** Kunlik xulosa bo'lmasa muammolar takrorlanaveradi; SLA "shu kun ichida" qattiq.
**Variantlar:**
- A) Har smena uchun "smena yakuni xulosasi" majburiy hujjat, deadline = shu kun oxiri; topshirilmasa qizil/eskalatsiya — siyosatga mos.
- B) Tavsiya qilinadi, majbur qilinmaydi — yumshoq.
- C) Keyin.

### Q1432. Tунги smena texnologi qaroriga maxsus hujjat oqimi
**Nima:** "Tех картада муаммо" siyosati: kechki smenada rahbar yo'q bo'lsa, smena texnologi o'z tajribasidan qaror beradi va sifatga to'liq javobgar bo'ladi. Bu qaror tizimda alohida "tунги qaror" hujjati bilan qayd etiladimi.
**Nega kerak:** Tунги qaror javobgarligi aniq bo'lishi va ertasi rahbarlar ko'rishi kerak.
**Variantlar:**
- A) "Tунги smena qarori" maxsus hujjat: muammo + qaror + javobgar texnolog → ertasi rahbar/RD-4 ko'rib tasdiqlaydi yoki qaytaradi.
- B) Oddiy izoh bilan yoziladi — yengil, lekin ko'rib chiqilmaydi.
- C) Keyin.
  ↳ Agar A: Tунги chaqiruv ("РД-4 ва бош технолог telefoniga javob berishi shart") tizimda eskalatsiya-zanjiri sifatida ham bo'ladimi? A) ha, telefon+Telegram majburiy eskalatsiya / B) faqat hujjat, telefon tashqarida / C) keyin.

### Q1433. Muammo-eskalatsiya muddatlari (15 daqiqa / 1 soat) hujjatga kiritiladimi
**Nima:** "Tех картада муаммо" siyosati aniq vaqtlar beradi: smena texnologi 15 daqiqa ichida bosh texnologga; RD-5 → tegishli bo'lim 1 soat ichida tuzatish; RD-2/RD-4/RD-5 uchrashuvi 1 soat ichida. Bu vaqtlar hujjat-SLA sifatida sozlanadimi.
**Nega kerak:** Generik 24 soat emas — ishlab chiqarish muammosi daqiqalar bilan o'lchanadi.
**Variantlar:**
- A) Muammo-hujjatlarga qisqa SLA (15 daq / 1 soat) sozlanadi; o'tib ketsa eskalatsiya — siyosatga aniq mos.
- B) Hamma hujjatga yagona 24 soat — sodda, lekin ishlab chiqarishga sekin.
- C) Keyin.

### Q1434. Hujjatdan oргполитика avtomatik tug'iladimi (НО-3 oqimi)
**Nima:** Siyosat: tех картада xato qaysi bo'limga tegishli bo'lsa, o'sha bo'lim rahbari "qayta takrorlanmasligi uchun Оргполитика yozadi" → НО-3 ga topshiriladi → НО-3 tasdiqlatib papkaga joylaydi. Bu kaskad tizimda hujjat sifatida bo'ladimi.
**Nega kerak:** Egasining "har takrorlanuvchi xato → oргполитika" sikli — bu hujjat-modulning kaskad imkoniyatiga aniq mos.
**Variantlar:**
- A) Ha: muammo-hujjat yopilganda "oргполитика yozish" vazifasi avtomat tug'iladi (bo'lim rahbari → НО-3 → tasdiq → papka) — to'liq kaskad.
- B) Qo'lda: bo'lim rahbari o'zi eslab yozadi — sodda, lekin tushib qolishi mumkin.
- C) Keyin.
⤳ Ta'sir: HR/Adaptatsiya (o'qitish), Org-karta papkalari.

### Q1435. Yangi oргполитика → adaptatsiya menejeriga o'qitish vazifasi (1 kun)
**Nima:** Siyosat: yangi oргполитика kelganda НО-3 adaptatsiya menejeriga xabar beradi, u "1 кундан кечиктирмай" bo'lim xodimlarini o'qitadi. Tizim oргполитика tasdiqlangach avtomat "o'qitish" vazifasini 1-kunlik deadline bilan ochadimi.
**Nega kerak:** Yangi qoida qog'ozda qolmasligi — egasining vizyoni: qoida ish jarayonining tabiiy qismi bo'lishi kerak.
**Variantlar:**
- A) Ha: tasdiqlangan oргполитика → adaptatsiya menejeriga o'qitish vazifasi (deadline 1 kun) avtomat — kaskadga mos.
- B) Qo'lda eslatma — yengil.
- C) Keyin.

### Q1436. Xodim "tanishdim" qaydi — yozma/elektron tasdiq
**Nima:** Oргполитika siyosati: "Ходимлар оргполитика билан танишгани ёзма ёки электрон тарзда қайд этилади"; tanishmaган/tushunmagan xodim ishni boshlay olmaydi. Tizim har xodimning "tanishdim" tasdig'ini saqlaydimi.
**Nega kerak:** "Bilmasdim" bahonasini yo'q qiladi — siyosatning bevosita maqsadi.
**Variantlar:**
- A) Ha: har xodim oргполитikaни ochib "tanishdim" (PIN/imzo) bosadi → qayd; tanishmaган xodim bog'liq ishni boshlay olmaydi — siyosatga mos.
- B) Faqat ochilgani qayd etiladi (tugmasiz) — yarim isbot.
- C) Keyin.
⤳ Ta'sir: HR, NAZORAT VARAQASI (quyida), KPI.

### Q1437. НАЗОРАТ ВАРАҚАСИ raqamli imzo-qatorlari bilan
**Nima:** РД-5 НАЗОРАТ ВАРАҚАСИ da har mavzu (lavozim maqsadi, оргсхема, malaka, vazifalar, ЦКП, huquqlar, javobgarlik...) yonida "_______ имзо" qatori bor. Bu qog'oz nazorat varaqasi tizimda raqamli imzo-checklist bo'ladimi.
**Nega kerak:** Bu zavodning real adaptatsiya/o'qitish hujjati — raqamlanса har mavzu o'qilgani isbotlanadi.
**Variantlar:**
- A) Ha: lavozim kartasiga bog'liq raqamli НАЗОРАТ ВАРАҚАСИ — har mavzu yonida xodim PIN-imzo qo'yadi, progress kuzatiladi — hujjatga to'liq mos.
- B) Bitta umumiy "o'qib chiqdim" tugmasi — sodda, lekin mavzu-mavzu izlanmaydi.
- C) Keyin.
⤳ Ta'sir: HR/Adaptatsiya, Org-karta darsliklari.

### Q1438. "Одобрена" muhri — laboratoriya tasdig'i hujjat-imzo sifatida
**Nima:** Tех карта siyosati: faqat laboratoriya "Одобрена" muhri qo'yilgan tех карта ишлаб чиқаришga o'tadi. Tizimda "Одобрена" laboratoriya-tasdig'i maxsus imzo-bosqichi sifatida bo'ladimi.
**Nega kerak:** Tasdiqlanmagan tех карта ishlab chiqarishga kirib ketishi — egasi alohida yozган muammo.
**Variantlar:**
- A) Ha: tех карта oqimida "Лаборатория → Одобрена" majburiy bosqich; muhrsiz hujjat ишлаб чиқаришга o'tolmaydi — siyosatga mos.
- B) Laboratoriya tasdig'i ixtiyoriy belgi — yumshoq, lekin teshik.
- C) Keyin.
⤳ Ta'sir: Production, Sifat (laboratoriya), MES (ишга qo'yish darvozasi).

### Q1439. Opросный лист → тех карта maydon-mosligi tekshiruvi
**Nima:** Siyosat: rejalashtiruvchi тех картани ишлаб чиқаришga o'tkazishdan oldin opросный лист bilan majburiy solishtiradi (miqdor, qog'oz turi, jarayon bosqichlari, pichoq o'lchami). Tizim bu solishtirishni hujjat-checklist sifatida majbur qiladimi.
**Nega kerak:** Solishtirilmagan tех карта = xatolik bilan ish boshlanishi.
**Variantlar:**
- A) Ha: tех карта tasdiqlash oynasida 4 punktli majburiy moslik-checklist (miqdor/qog'oz/jarayon/pichoq) — har biri belgilanmasa o'tmaydi.
- B) Erkin tekshiruv, checklist yo'q — yengil.
- C) Keyin.

### Q1440. Taъминотga rasmiy заявка hujjati (qog'oz yetmaganda)
**Nima:** Siyosat: qog'oz A-System bo'yicha omborda yetmasa, buyurtma rejaga kirmaydi va "таъминот бўлимига расмий заявка берилади". Bu заявка hujjat-modulda shablon bo'ladimi.
**Nega kerak:** Og'zaki "qog'oz oling" emas, rasmiy iz qolishi kerak.
**Variantlar:**
- A) "Taъminot заявкаси" shabloni: material + miqdor + buyurtma raqami → tasdiq → taъminot navbatiga — yagona oqim.
- B) Taъminot alohida tizimda — ajratilgan.
- C) Keyin.
⤳ Ta'sir: Ombor (rulon ombori qoldig'i), Taъminot/PO.

### Q1441. Smena оldidan хом-ашё заявка — 2 soat oldin SLA
**Nima:** Хом-ашё siyosati: rejalashtiruvchi хом-ашё ro'yxatini ichki taъminotchiga "камида 2 соат олдин" topshiradi (buyurtma raqami + material + miqdor + участка). Bu заявка hujjatining 2-soatlik SLA si bo'ladimi.
**Nega kerak:** Smena boshida хом-ашё yetishmasligi — operator kutib qolishi.
**Variantlar:**
- A) "Smena хом-ашё заявкаси" shabloni 2-soatlik majburiy SLA bilan; kech topshirilsa qizil — siyosatga mos.
- B) SLA siz oddiy ro'yxat — yengil.
- C) Keyin.
⤳ Ta'sir: Ombor, Ichki logistika, Production smena.

### Q1442. Режа қоғози — fakt vazn qayd hujjati (rulon)
**Nima:** Rulon siyosati: rulon berilganda ombor xodimi "реал вазнни режа қоғозига факт сифатида қайд этади" (reja 1200kg, fakt 1300/1500kg bo'lishi mumkin), ortib qolgani ham qaydlanadi, to'ldirilgan режа қоғози buxgalteriyaga. Tizimda bu reja-vs-fakt rulon hujjati bo'ladimi.
**Nega kerak:** "Режа қоғози ишлаб чиқаришда қоғоз ҳаракатини назорат қилиш учун асосий ҳужжат".
**Variantlar:**
- A) Ha: rulon-hujjati reja-miqdor + fakt-vazn + qaytarilgan miqdor maydonlari bilan → buxgalteriyaga avtomat — siyosatga mos.
- B) Erkin izoh — yengil, lekin fakt kuzatilmaydi.
- C) Keyin.
⤳ Ta'sir: Ombor (rulon), Finance/Buxgalteriya (qog'oz sarfi), POS Monitor.

### Q1443. Hujjat СЕРИЯ (kategoriya) tegi
**Nima:** Har oргполитика "СЕРИЯ «Технология»" tegi bilan keladi. Hujjatlar СЕРИЯ/kategoriya (Технология, Moliya, HR...) bo'yicha tasniflanadimi.
**Nega kerak:** Qidiruv va papka tashkili СЕРИЯ bo'yicha — egasi shu strukturani ishlatadi.
**Variantlar:**
- A) Har hujjat/oргполитика СЕРИЯ tegi oladi → kategoriya bo'yicha filtr/papka — mavjud strukturaga mos.
- B) Tegsiz, faqat tur bo'yicha — sodda.
- C) Keyin.

### Q1444. Hujjatning maqsad-lavozimlari (papkalarga yo'naltirish)
**Nima:** Har oргполитика sarlavhasida "...лавозим папкаларига" deb maqsad lavozimlar sanaladi (masalan "РД-5, НО-13, Режалаштириш бўлими"). Hujjat bir nechta lavozim-papkaga yo'naltiriladimi.
**Nega kerak:** Bir hujjat bir nechta lavozimga tegishli — har biriga yetkazilishi kerak.
**Variantlar:**
- A) Hujjatga bir nechta "maqsad lavozim" biriktiriladi → har biriga avtomat tushadi va tanishuv talab qilinadi — siyosatga mos.
- B) Faqat bitta egasiga ketadi — sodda, lekin chala.
- C) Keyin.

### Q1445. Asoschi (Ayubxon Pozilov) imzosi — yakuniy tasdiq darajasi
**Nima:** Har oргполитика oxirida "EURO PRINT компанияси асосчиси — Аюбхон Позилов" imzosi turadi. Oргополитика/strategik hujjatlar oxirgi bosqichda egaga (asoschi) imzoga boradimi.
**Nega kerak:** Strategik hujjat egasi tasdig'isiz rasmiy bo'lmaydi.
**Variantlar:**
- A) Ha: "oргполитика" turi marshrutining oxirgi bosqichi = asoschi imzosi (PIN) — rasmiy kuch shundan.
- B) Departament rahbari tasdig'i yetarli — tezroq, lekin egasi tashqarida.
- C) Keyin.
  ↳ Agar A: oddiy ariza ham egaga boradimi yoki faqat oргполитика/strategik? A) faqat oргполитика+yirik summa / B) hammasi / C) keyin.

### Q1446. "Bosh rahbar ko'rib chiqishi" — oргполитika oldin-tasdiqi
**Nima:** Oргополитika siyosati: departament rahbari tasdiqlagan oргполитika "аввал бош раҳбар томонидан кўриб чиқилади ва жорий этишга рухсат берилгандан сўнг" ходимлар бўлимига boradi. Bu oraliq "bosh rahbar ruxsati" bosqichi marshrutga kiritiladimi.
**Nega kerak:** Joriy etishdan oldin yuqori ruxsat — tartibni saqlaydi.
**Variantlar:**
- A) Ha: oргполитika marshruti = departament rahbari → bosh rahbar (joriy etish ruxsati) → НО-3/ходимlar bo'limi — siyosatga mos.
- B) To'g'ridan ходимlar bo'limiga — tezroq, lekin ruxsatsiz.
- C) Keyin.

### Q1447. A-System / Bitrix bilan integratsiya — qayerda rasmiylashtiriladi
**Nima:** Siyosatlar yozma rasmiylashtirishni "A-System ёки Bitrix орқали" deb belgilaydi. Hujjat-modul shu ikkisining o'rnini bosadimi yoki ular bilan bog'lanadimi.
**Nega kerak:** Zavod hozir A-System (ишлаб чиқариш/реja) va Bitrix (rasmiy yozishma) ishlatadi; yangi modul ularga moslashishi yoki almashtirishi kerak.
**Variantlar:**
- A) Hujjat-modul yagona rasmiy kanal bo'ladi (A-System/Bitrix o'rniga ichki rasmiylashtirish) — birlashtirilgan.
- B) Modul A-System/Bitrix ga link/sync qiladi, ular asosiy qoladi — bosqichma-bosqich ko'chish.
- C) Keyin — hozir A-System/Bitrix qoladi.
⤳ Ta'sir: butun zanjir (reja, taъminot, kommunikatsiya).

### Q1448. Oylik tahlil hisoboti — avtomat agregatsiya
**Nima:** Bir nechta siyosat "ҳар ой якунида ... таҳлил қилинади va раҳбариятга тақдим этилади" deydi (reja o'zgarishlari, javobgarlik holati, sifat, qog'oz sarfi). Tizim oylik tahlil hisobotini hujjatlardan avtomat yig'adimi.
**Nega kerak:** Qo'lda yig'ish unutiladi; hujjatlar struktura bo'lsa, oylik hisobot avtomat chiqadi.
**Variantlar:**
- A) Ha: oy oxirida tizim qaydlardan oylik tahlil-hujjat (reja o'zgarish soni/sabablari/tashabbuskorlari) avtomat tuzadi → rahbariyatga — siyosatga mos.
- B) Qo'lda tayyorlanadi, modul faqat ma'lumot beradi — yarim avtomat.
- C) Keyin.

### Q1449. Tahlil "jazo uchun emas" — hujjat ohangini belgilash
**Nima:** Siyosat takror ta'kidlaydi: "Режа бажарилишини таҳлил қилиш жазо мақсадида эмас, сабабларни аниқлаш учун". Tizimda tahlil-hujjatlar javobgarni ayblovchi emas, sabab-yo'naltirilgan formatda bo'ladimi.
**Nega kerak:** Operator "izoh"ni qo'rqmasdan to'g'ri yozishi uchun ohang muhim — yolg'on izoh sabab tahlilini buzadi.
**Variantlar:**
- A) Tahlil-hujjat formati sabab-markazli (kim aybdor emas, nima sabab) + izoh maxfiyligi — to'g'ri ma'lumot keladi.
- B) Standart ayblov-formati — sodda, lekin yolg'on izoh riski.
- C) Keyin.

### Q1450. Operator "izoh"i majburiy — reja yopilganda
**Nima:** Dastgoh-tahlil siyosati: operator reja bajarilmasa "izoҳ" qismida sababini YOZMA ko'rsatishi shart; "Изоҳсиз ёпилган режа бажарилмаган ҳисобланади". Ortiqcha bajarishga ham izoh. Tizim izohsiz yopishni bloklaydimi.
**Nega kerak:** Izohsiz yopish = sabab yo'qoladi = takror muammo.
**Variantlar:**
- A) Reja bajarilmagan/ortiqcha bo'lsa izoh majburiy (sabab guruhi + matn); izohsiz "bajarilmagan" deb yopiladi — siyosatga mos.
- B) Izoh ixtiyoriy — yengil.
- C) Keyin.
⤳ Ta'sir: MES (reja yopish), Production, KPI.

### Q1451. Yozma topshiriq → keyin og'zaki bajarilsa, qayd majburiyligi
**Nima:** Kommunikatsiya siyosati: "Оғзаки берилган муҳим топшириқ ёки келишув кейинчалик ёзма шаклда қайд этилиши шарт". Tizim og'zaki topshiriqni keyin yozma qaydga majbur qiladimi (eslatma bilan).
**Nega kerak:** Tezkor og'zaki kelishuv yo'qolmasligi kerak.
**Variantlar:**
- A) Og'zaki topshiriq uchun "keyin rasmiylashtir" tugmasi + eslatma; rasmiylashtirilmagan og'zaki ijroga asos bo'lmaydi — siyosatga mos.
- B) Faqat tavsiya — yengil.
- C) Keyin.

### Q1452. Hujjat-asoslik darajalari (ким kimga bo'ysunadi) org-sxemadan
**Nima:** Vertikal kommunikatsiya: "Бўлим ходимлари ўз раҳбарлари орқали мурожаат қилади; раҳбарлар маълумотни 5-департамент даражасида умумлаштириб тақдим қилади". Hujjat yuqoriga ko'tarilganda har darajada "umumlashtirish" bosqichi bo'ladimi.
**Nega kerak:** Rahbar o'z bo'limidan ma'lumotni umumlashtirib yuqoriga beradi — to'g'ridan o'tib ketmaydi.
**Variantlar:**
- A) Hujjat har darajada rahbar "umumlashtirish/xulosa" qo'shadi, keyin yuqoriga — darajalararo umumlashtirish.
- B) Hujjat o'zgarmasdan yuqoriga o'tadi — sodda, lekin umumlashtirish yo'q.
- C) Keyin.

### Q1453. "Eshitadi lekin texnik yechim bermaydi" — rol-asosli hujjat huquqlari
**Nima:** Muammo siyosati: "Савдо менежери муаммони эшитади, лекин техник ечим топмайди. Техник ечимлар технологлар томонидан берилади". Hujjatda kim qaysi turdagi qaror/yechim yoza olishi rolga bog'lanadimi.
**Nega kerak:** Savdo texnik qaror yozsa — xato; har rol o'z vakolatidagi maydonni to'ldirishi kerak.
**Variantlar:**
- A) Hujjat maydonlari rolga bog'lanadi: "texnik yechim" faqat texnolog roli, "mijoz talabi" faqat savdo — vakolatga mos.
- B) Hamma hamma maydonni yoza oladi — erkin, lekin xato riski.
- C) Keyin.

### Q1454. Sifat buzilishi → СОЗga darhol xabar hujjati
**Nima:** Sifat siyosati: ОТК sifat buzilishini aniqlasa "дарҳол СОЗга маълумот берилади" → texnolog+участка boshlig'i ishtirokida baholanadi. Bu darhol-xabar tizimda tez hujjat/signal sifatida bo'ladimi.
**Nega kerak:** Sifat buzilishi partiyaga tarqalmasligi uchun daqiqalar muhim.
**Variantlar:**
- A) "Sifat ogohlantirishi" tez-hujjati ОТК → СОЗ; qisqa SLA + ishtirokchi-zanjir (texnolog/участка) avtomat chaqiriladi — siyosatga mos.
- B) Oddiy hujjat oqimi — sekinroq.
- C) Keyin.
⤳ Ta'sir: Sifat (QC), Production, MES.

### Q1455. Ишчи журнал — sifat tekshiruvlari qaydi
**Nima:** Bosqichma-bosqich sifat siyosati: "Сифат текширувлари бўйича маълумотлар ишчи журнал орқали қайд этиш учун асос". Tizimda bu журнал hujjat/registr sifatida bo'ladimi (har smena kamida 1 marta tekshiruv).
**Nega kerak:** Sifat qaydi keyin Совершенствование tahliliga asos; o'chirilmasligi kerak.
**Variantlar:**
- A) "Sifat ишчи журнали" registr-hujjat: har smena yozuvi + o'chirilmas (faqat qo'shiladi) → oylik tahlilga — siyosatga mos.
- B) Erkin izoh — yengil, lekin tahlil qiyin.
- C) Keyin.

### Q1456. Hujjat-qaydlari hech qachon o'chirilmaydi (immutable)
**Nima:** Ma'lumotlar siyosati: ОТК sifat natijalari "ўчирилмайди"; mas'uliyat siyosati: qaror kim qabul qilgani aniq qoladi. Hujjat-tizimida tasdiqlangan qaydlar texnik jihatdan o'chirib bo'lmaydimi.
**Nega kerak:** "Men o'chirib tashladim" teshigini yopadi — audit izi himoyalanadi.
**Variantlar:**
- A) Tasdiqlangan hujjat/qayd immutable — faqat "bekor/qarama-qarshi" yozuv qo'shiladi, asl o'chmaydi — siyosatga mos.
- B) Super-admin o'chira oladi — moslashuvchan, lekin xavf.
- C) Keyin.
⤳ Ta'sir: Audit, Xavfsizlik, Q-45.

### Q1457. Hujjat tilida nusxa — kirill ustuvor (haqiqiy hujjatlar kirill)
**Nima:** Barcha oргополитika va РД-5 hujjatlari kirill o'zbek/rus aralash. AI-intervyu va shablonlar shu nusxaga (kirill + ru) moslanadimi, faqat lotin emasmi.
**Nega kerak:** Mavjud rasmiy hujjatlar kirillda; xodimlar shunga o'rgangan — lotin majburlash chalkashtiradi.
**Variantlar:**
- A) Hujjat 3 yozuvda (lotin/kirill/ru), default = hujjat-asl tili (kirill ko'p); xodim o'z yozuvida ko'radi — mavjud bazaga mos.
- B) Faqat lotin — bir xil, lekin eski hujjatlardan uzilish.
- C) Keyin.

### Q1458. Skaner/qog'oz hujjatni tizimga kiritish (РД-5 papka raqamlari)
**Nima:** Mavjud РД-5 papkalari, опросный лист, режа қоғози — qog'ozda. Tizim eski qog'oz hujjatni skaner qilib (raqam+СЕРИЯ bilan) arxivga biriktira oladimi.
**Nega kerak:** O'tish davrida qog'oz va raqamli hujjat birga yashaydi; eski papkalar yo'qolmasligi kerak.
**Variantlar:**
- A) Ha: qog'oz hujjat skani + meta (raqam/СЕРИЯ/sana/lavozim) → arxivda qidiriladigan — o'tish davriga mos.
- B) Faqat raqamli yangi hujjatlar — toza, lekin eski papkalar tashqarida.
- C) Keyin.

### Q1459. РД-kod / lavozim-kod bo'yicha yo'naltirish (РД-2/РД-4/РД-5/НО-3/НО-13)
**Nima:** Hujjatlar РД-2, РД-4, РД-5, НО-3, НО-13 kabi lavozim-kodlar bilan yo'naltiriladi. Tizim shu kod-tizimini org-marshrutda ishlatadimi.
**Nega kerak:** Egasi va xodimlar bu kodlar bilan ishlaydi; marshrut shu kodlarga tushunarli bo'lishi kerak.
**Variantlar:**
- A) Org-karta har lavozimga РД/НО kod biriktiradi; hujjat marshruti kod bilan ko'rsatiladi — mavjud tizimga mos.
- B) Faqat ism/lavozim nomi — sodda, lekin kodlar yo'qoladi.
- C) Keyin.
⤳ Ta'sir: Org-struktura, Karta-model.

### Q1460. Bo'limlararo uchrashuv (РД-2+РД-4+РД-5) — qaror-protokol hujjati
**Nima:** Muammo siyosati: kelishilган hal kerak bo'lsa "РД4, РД2 ва РД5 учрашиб ... ўзаро бир қарорга келиб" davom/to'xtatish qaror qiladi (1 soat ichida). Bu uchrashuv qarori protokol-hujjat sifatida qaydlanadimi.
**Nega kerak:** Bir nechta rahbar qarori aniq yozilmasa, keyin "men unday demagandim" bahsi chiqadi.
**Variantlar:**
- A) "Bo'limlararo qaror protokoli" mini-hujjat: ishtirokchilar (РД-2/4/5) + qaror + javobgar → har biri PIN-imzo — siyosatga mos.
- B) Bittasi yozadi, qolgani og'zaki tasdiqlaydi — yengil, lekin to'liq isbot yo'q.
- C) Keyin.
⤳ Ta'sir: Koordinatsiya, Production.

### Q1461. "Tashkiliy xato" sifatida qayd (reja kech berilsa)
**Nima:** Reja-taqdim siyosati: reja ichki logistikaga o'z vaqtida berilmay ishlab chiqarish to'xtasa, "режалаштириш бўлими томонидан юзага келган ташкилий хато сифатида қайд этилади". Tizim bunday holatni avtomat "tashkiliy xato" yozuvi bilan belgilaydimi.
**Nega kerak:** Xatoning egasi (qaysi bo'lim) aniq belgilanishi — javobgarlik siyosatiga mos.
**Variantlar:**
- A) Ha: deadline o'tib uzilish chiqsa, tizim "tashkiliy xato — javobgar bo'lim" yozuvini avtomat ochadi (oylik tahlilga) — siyosatga mos.
- B) Qo'lda belgilanadi — yengil, lekin tushib qoladi.
- C) Keyin.

### Q1462. Og'zaki xabar "rasmiy berilgan" deb hisoblanmaydi — qoidani ko'rsatish
**Nima:** Reja-taqdim siyosati: "Оғзаки хабар бериш режани расмий берилган деб ҳисоблаш учун асос бўлмайди". Tizim qaysi hujjat-turlarida "og'zaki = rasmiy emas" qoidasini ekranda ko'rsatib, faqat yozma qabulni tan oladimi.
**Nega kerak:** Xodim "men aytib qo'ygandim" deganida tizim qabul qilmasligi — siyosatning ruhi.
**Variantlar:**
- A) Reja/topshiriq turlarida "rasmiy = faqat yozma qayd" qoidasi ko'rsatiladi va tizim faqat yozma qabulni "berildi" deb belgilaydi.
- B) Faqat siyosat hujjatida yozilgan, tizim majbur qilmaydi — yumshoq.
- C) Keyin.

### Q1463. Hujjatga "kutilgan natija/mukammal manzara" maydoni
**Nima:** Har oргополитика "Тасаввурдаги мукаммал манзара" bilan tugaydi. Oргополитика/strategik hujjat shablonida "joriy holat → maqsad → kutilgan natija" struktura majburiy bo'ladimi.
**Nega kerak:** Egasining oргополитика formati shu — joriy holat, maqsad, harakatlar, mukammal manzara; shablon shunga mos bo'lishi kerak.
**Variantlar:**
- A) "Oргополитика" shabloni 4 bo'lim: Hozirgi holat / Maqsad / Harakatlar detalizatsiyasi / Mukammal manzara — egasi formatiga aniq mos.
- B) Erkin matn — moslashuvchan, lekin struktura yo'q.
- C) Keyin.

### Q1464. Hujjat ijro-natijasi orqaga bog'lanadi (zanjir yopilishi)
**Nima:** Siyosatlar zanjir-asosli: opросный лист → тех карта → лаборатория → ишлаб чиқариш. Tasdiqlangan hujjat keyingi bosqichga o'tganda oldingi hujjatga "ijro etildi/natija" qaytib bog'lanadimi.
**Nega kerak:** Zanjir uzilmasligi — hujjat tasdiqlangach nima bo'lganini orqadan ko'rish kerak (egasining "ballonsiz mashina = ulanmagan qismlar" muammosi).
**Variantlar:**
- A) Ha: hujjatlar zanjir bo'lib bog'lanadi (ota-bola); har bosqich oldingisiga natija qaytaradi → to'liq iz — vizyonga mos.
- B) Har hujjat mustaqil, bog'lanmaydi — sodda, lekin uzuq zanjir.
- C) Keyin.
⤳ Ta'sir: Production, Sifat, Ombor, butun zanjir-vizyon.

### Q1465. Ishchi-bandlik (загрузка) hujjati — dastgoh-operator biriktirish
**Nima:** Bandlik.xlsx da bo'lim/dastgoh (Flexo gofra, SM 72, Laminatsiya...) × operator yuklamasi bor. Dastgohga operator/ish biriktirish rasmiy hujjat/buyruq sifatida o'tadimi.
**Nega kerak:** Kim qaysi dastgohda ishlashi rasmiy bo'lsa, javobgarlik (sifat/KPI) aniq bog'lanadi.
**Variantlar:**
- A) "Smena biriktirish" hujjati: dastgoh + operator + smena → rasmiy qayd, KPI ga bog'lanadi.
- B) Og'zaki/Excel da qoladi — yengil, lekin izsiz.
- C) Keyin.
⤳ Ta'sir: HR, MES, KPI, Production.

### Q1466. Hujjat ustuvorligi — "juda zaril" ni rasmiy tasniflash
**Nima:** Reja siyosati "жуда зарил / мижоз кутиб турибди / бугун чиқариб беринг" og'zaki bosimga qarshi. Tizim "shoshilinch" bayrog'ini rasmiy darajaga (sabab + tasdiqlovchi) aylantiradimi.
**Nega kerak:** Hamma "shoshilinch" desa, ustuvorlik ma'nosini yo'qotadi; shoshilinchlik asoslangan bo'lishi kerak.
**Variantlar:**
- A) "Shoshilinch" tanlasa, sabab + yuqori tasdiqlovchi majburiy; asossiz shoshilinch oddiy navbatga tushadi — bosimni cheklaydi.
- B) Har kim "shoshilinch" qo'ya oladi — tez, lekin ma'nosiz.
- C) Keyin.
⤳ Ta'sir: Koordinatsiya, Production navbat, 3-savat SLA.

DONE: Communication Center / Hujjat — 52.

JAMI: 1466
