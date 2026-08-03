# Org-struktura / KARTALAR — vizyon savollari

> Quyidagi savollar EuroPrint org-struktura modulini "KARTA-markazli" vizyonga olib o'tish uchun.
> Har savol — bitta aniq qaror. Birinchi variant (A) odatda vizyonga eng mos tavsiya.
> Sohada hozir: 142 org-node, 30 xodim, RBAC bor; lekin karta-qatlam (razryad, GSD/ЦКП, AI-moslik, per-karta oylik) hali yo'q.

---

### Q1. Karta = master-data
**Nima:** Har lavozim-o'rindiq alohida "KARTA" bo'lib, butun ERP shu kartalardan oziqlanadigan asosiy ma'lumot (master-data) bo'lsinmi.
**Nega kerak:** Vizyoningiz: "karta asosiy, xodim ikkilamchi". Karta to'g'ri bo'lsa — ish to'g'ri bo'ladi; oylik, ruxsat, hisobot hammasi kartadan keladi.
**Variantlar:**
- A) Ha — karta yagona markaz, boshqa modullar shunga ulanadi — eng kuchli, lekin hammasini bog'lash kerak
- B) Karta faqat HR ichida qoladi, boshqa modullar eski tartibda — tez, lekin vizyon to'liq emas
- C) Keyin — hozir kerak emas

### Q2. Bitta o'rindiq = bitta xodim
**Nima:** Har karta faqat bitta o'rindiqni bildirsin, unga faqat bitta xodim biriktirilsin (bir xil lavozim ko'p bo'lsa — 01, 02, 03 dublikat kartalar).
**Nega kerak:** "Bizda 5 ta operator bor" deganda 5 ta alohida karta bo'ladi — har birining razryadi, oyligi, xodimi alohida ko'rinadi.
**Variantlar:**
- A) Bitta karta = bitta o'rindiq, dublikatlar 01/02 raqami bilan — aniq, lekin karta soni ko'payadi
- B) Bitta karta = lavozim turi, ichida bir nechta xodim — sodda, lekin har xodimni alohida kuzatib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q3. Kartasiz — oylik va ERP yo'q
**Nima:** Xodim hech bir kartaga biriktirilmagan bo'lsa — unga oylik hisoblanmasin va ERP'ga kira olmasin.
**Nega kerak:** Bu "havoda" turgan xodimlarni yo'q qiladi: har kim aniq bir karta (rol) egasi bo'lishi shart.
**Variantlar:**
- A) Ha — kartasiz xodim oylik ham, kirish ham yo'q — qattiq tartib, lekin avval barchani kartaga ulash kerak
- B) Kartasiz xodim ERP'ga kiradi, faqat oylik yo'q — yumshoqroq
- C) Keyin — hozir kerak emas

### Q4. Bitta xodim — bir nechta karta
**Nima:** Bitta xodim bir vaqtda bir nechta karta egallashi mumkin bo'lsin; oyligi shu kartalar yig'indisi bo'lsin.
**Nega kerak:** Amalda bir kishi ham brigadir, ham operator bo'lishi mumkin — har ish uchun alohida oylik to'planadi, daraxtda har joyida ko'rinadi.
**Variantlar:**
- A) Ha — ko'p karta, oylik = yig'indi, daraxtda har joyda ko'rinadi — moslashuvchan
- B) Bitta xodim = bitta karta (qat'iy) — sodda, lekin haqiqatni cheklaydi
- C) Keyin — hozir kerak emas

### Q5. Karta hech qachon o'chmaydi
**Nima:** Karta yaratilgach o'chirilmasin — faqat tahrirlansin va to'liq tarixi saqlansin (xodim ketsa ham karta qoladi).
**Nega kerak:** Lavozim — kompaniyaning doimiy strukturasi; xodim almashadi, lekin "ish o'rni" qoladi va kim qachon ishlagani tarix bo'lib turadi.
**Variantlar:**
- A) Ha — o'chmaydi, faqat "arxiv/vakant" holatga o'tadi, tarix qoladi — toza tarix
- B) Kerak bo'lmasa o'chiriladi — sodda, lekin tarix yo'qoladi
- C) Keyin — hozir kerak emas

### Q6. Xodim ketganda profil muzlaydi
**Nima:** Xodim ishdan ketsa — profili "muzlaydi" (o'chmaydi), karta vakant bo'ladi, qaytib kelsa profil tiklanadi.
**Nega kerak:** "Nima qilgan, qayerda to'xtagan" tarixi saqlanadi; qaytsa noldan boshlamaydi.
**Variantlar:**
- A) Muzlaydi + tiklanadi, tarix to'liq — eng yaxshi
- B) Profil arxivga o'tadi, tiklash yo'q — soddaroq
- C) Keyin — hozir kerak emas

### Q7. Karta papkasi — 6 bo'lim
**Nima:** Har karta ichida 6 standart bo'lim bo'lsin: vazifa, javobgarlik, GSD/ЦКП, reglament, jarayon, ta'lim (darslik).
**Nega kerak:** "Lavozim papkasi" — to'g'ri ishning to'liq ta'rifi; yangi xodim shu papkadan hamma narsani ko'radi.
**Variantlar:**
- A) 6 bo'lim hammasi majburiy, to'liqlik foizi ko'rinadi — to'liq standart
- B) Bo'limlar bor, lekin to'ldirish ixtiyoriy — yengilroq, lekin papkalar yarim qoladi
- C) Keyin — hozir kerak emas

### Q8. Razryad har kartada
**Nima:** Har kartada "razryad" (daraja) maydoni bo'lsin — xodim o'ssa shu kartaning razryadi ko'tariladi.
**Nega kerak:** Razryad → talab → oylik zanjiri; xodim qancha mohir bo'lsa, kartaning razryadi va oyligi shuncha yuqori.
**Variantlar:**
- A) Razryad hamma kartada majburiy maydon — to'liq tizim
- B) Razryad faqat ishchi (operator) kartalarda — qisman
- C) Keyin — hozir kerak emas

### Q9. Razryad pog'onalari (master-ro'yxat)
**Nima:** Razryad qanday darajalarga bo'linsin — masalan 1-2-3-4-5, yoki "boshlang'ich / o'rta / yuqori / usta".
**Nega kerak:** Bir xil til kerak: har bo'lim bir xil razryad shkalasini ishlatsa, taqqoslash va oylik adolatli bo'ladi.
**Variantlar:**
- A) Raqamli 1-5 shkala, hamma uchun bir xil — sodda va aniq
- B) Har otdeleniye o'z razryad shkalasini belgilaydi — moslashuvchan, lekin chalkash
- C) Keyin — hozir kerak emas (siz keyin shkala yuborasiz)

### Q10. Razryad ko'tarilishi qanday tasdiqlanadi
**Nima:** Razryad o'sishi qanday qaror qilinsin — avtomatik (imtihon o'tilsa) yoki qo'lda (HR + yuqori rahbar tasdiqlasa).
**Nega kerak:** Adolat: imtihon natijasi bo'lsin, lekin yakuniy "ha"ni odam aytsin.
**Variantlar:**
- A) Imtihon o'tadi → HR + yuqori rahbar tasdiqlaydi → o'zgaradi — nazoratli (vizyon shu)
- B) Imtihon o'tsa avtomatik ko'tariladi — tez, lekin nazorat yo'q
- C) Keyin — hozir kerak emas

### Q11. Imtihon oralig'i (min muddat)
**Nima:** Razryad imtihonini xodim o'zi belgilaydi, lekin ikki imtihon orasida eng kam 3 oy bo'lishi sharti bo'lsinmi.
**Nega kerak:** Tez-tez imtihon berib razryadni sun'iy ko'tarishning oldini oladi.
**Variantlar:**
- A) Ha — min 3 oy, xodim o'zi murojaat qiladi — barqaror
- B) Muddat cheklovi yo'q — erkin, lekin suiiste'mol xavfi
- C) Keyin — hozir kerak emas

### Q12. Razryad pasayishi
**Nima:** Razryad nafaqat ko'tarilsin, kerak bo'lganda pasaytirilsin ham (qoladi / ko'tariladi / tushadi).
**Nega kerak:** Mahorat tushsa yoki qoida buzilsa — oylik ham haqiqatga mos pasayadi.
**Variantlar:**
- A) Ha — pasayish ham bo'ladi, HR + rahbar tasdig'i bilan — adolatli
- B) Faqat ko'tarilish bo'ladi, pasayish yo'q — sodda, lekin haqiqatdan uzoq
- C) Keyin — hozir kerak emas

### Q13. Razryad o'zgarsa HR hujjati
**Nima:** Razryad o'zgarganda tizim HR hujjati va ichki sertifikat biriktirishni talab qilsinmi.
**Nega kerak:** Har o'zgarishning rasmiy izi bo'ladi — keyin "kim ko'tardi, qachon, nega" aniq.
**Variantlar:**
- A) Ha — hujjat + ichki sertifikat majburiy — rasmiy va aniq
- B) Faqat tizimda yozilsin, qog'oz hujjat shart emas — yengilroq
- C) Keyin — hozir kerak emas

### Q14. Karta uchun GSD/ЦКП ta'rifi
**Nima:** Har kartaga "qanaqa natija beradi" (ЦКП) — statistik ko'rsatkich (GSD): maqsad + birlik (dona/kg/foiz) + chastota (kunlik/haftalik) yozilsinmi.
**Nega kerak:** Har rolning aniq o'lchanadigan mahsuli bo'ladi; "yaxshi ishladi" o'rniga raqam bilan baholanadi.
**Variantlar:**
- A) Ha — har kartada GSD: maqsad + birlik + chastota majburiy — o'lchanadigan
- B) Faqat asosiy lavozimlarda GSD bo'lsin — qisman
- C) Keyin — hozir kerak emas

### Q15. ЦКП kim belgilaydi va qanday yoziladi
**Nima:** ЦКП ta'rifini kim yozadi va formati qanaqa — matnli tavsif + formula.
**Nega kerak:** Bitta egasi (HR) bo'lsa — ЦКП'lar bir xil sifatda, AI ham ulardan savol tuza oladi.
**Variantlar:**
- A) HR yozadi, format = matn tavsif + formula — markaziy va aniq (vizyon shu)
- B) Har bo'lim rahbari o'z kartalariga ЦКП yozadi — tez, lekin har xil sifat
- C) Keyin — hozir kerak emas

### Q16. Mashinasiz xodimning ЦКП hisoboti
**Nima:** Stanok/mashinaga bog'liq bo'lmagan xodim uchun AI ЦКП'dan savollar tuzib, har kuni chat/bot orqali so'rab, kunlik hisobotni shakllantirsinmi.
**Nega kerak:** Operator bo'lmagan (farrosh, ofis) xodimlarning ham kunlik natijasi raqamga aylanadi.
**Variantlar:**
- A) Ha — AI chatbot kunlik so'raydi, javob = kunlik hisobot — avtomatik
- B) Xodim o'zi qo'lda forma to'ldiradi — sodda, lekin sustroq
- C) Keyin — hozir kerak emas

### Q17. Mashinachi xodimning ЦКП manbai
**Nima:** Stanokda ishlaydigan xodimning ЦКП'si avtomatik IoT/MES'dan (mashina ma'lumotidan) olinsinmi.
**Nega kerak:** Operator hisobot yozmaydi — mashina o'zi qancha ishlaganini aytadi, soxta raqam bo'lmaydi.
**Variantlar:**
- A) Ha — IoT/MES'dan avtomatik, ulanish qurib chiqiladi — eng ishonchli
- B) Hozir qo'lda kiritilsin, IoT keyin ulansin — bosqichma-bosqich
- C) Keyin — hozir kerak emas

### Q18. Kunlik hisobot bermaslik jazosi
**Nima:** Xodim 16 soat ichida ЦКП hisobotini bermasa — o'sha kun oylik yozilmasin (o'tkazib yuborsa: HR raporti → direktor tasdig'i → qaytariladi).
**Nega kerak:** Kunlik hisobot intizomini mustahkamlaydi; lekin uzrli holatda tiklash yo'li bor.
**Variantlar:**
- A) Ha — 16 soat, oylik yozilmaydi, HR+direktor orqali tiklanadi — qat'iy lekin adolatli
- B) Faqat ogohlantirish, oylik tegmaydi — yumshoq
- C) Keyin — hozir kerak emas

### Q19. 7-Otdeleniye raqami
**Nima:** Har kartaga u qaysi 7 ta otdeleniyadan biriga tegishli ekanini ko'rsatadigan raqam (1-7) qo'shilsinmi.
**Nega kerak:** Butun zavodni Vysotskiy 7-otdeleniye modeli bo'yicha guruhlash; har otdeleniyaning umumiy GSD'sini ko'rish.
**Variantlar:**
- A) Ha — har kartada otdeleniye raqami (1-7) majburiy — to'liq tuzilma
- B) Faqat bo'lim darajasiga raqam, kartaga emas — qisman
- C) Keyin — hozir kerak emas

### Q20. Otdeleniye GSD-metrikasi
**Nima:** Har otdeleniyaning o'z bosh ko'rsatkichi (gsd_metric) bo'lsin — masalan 1-otdeleniye "sotuv hajmi", 4-otdeleniye "ishlab chiqarish dona".
**Nega kerak:** Egasi bir qarashda qaysi otdeleniye yaxshi/yomon ishlayotganini ko'radi.
**Variantlar:**
- A) Ha — har otdeleniyaga bitta bosh metrika — boshqaruv uchun aniq
- B) Otdeleniye metrikasi yo'q, faqat karta darajasida — qisman
- C) Keyin — hozir kerak emas

### Q21. Darxt — har node bir karta
**Nima:** Butun org-daraxt shunday tuzilsinki, har "tugun" (node) bitta karta bo'lsin (karta = ham bo'lim, ham lavozim), egasi — ildiz.
**Nega kerak:** Bitta yaxlit daraxt; rahbarsiz xodim qolmaydi (egasidan tashqari), har kartaning ota-kartasi = rahbari.
**Variantlar:**
- A) Bitta daraxt, har node = karta, 7 qatlam saqlanadi — yaxlit (vizyon shu)
- B) Bo'limlar va lavozimlar alohida ro'yxatlar — sodda, lekin bog'lanish zaif
- C) Keyin — hozir kerak emas

### Q22. Vakant rahbar holati
**Nima:** Rahbar kartasi bo'sh (vakant) bo'lsa — quyidagi xodimlar rahbarsiz ishlayversinmi (eskalatsiya/yuqoriga sakrash yo'q), rahbar tayinlanguncha.
**Nega kerak:** Vizyoningiz: pog'ona sakrash yo'q; vakant joy ish to'xtatmaydi, lekin sun'iy "vaqtinchalik boshliq" ham yaratmaydi.
**Variantlar:**
- A) Rahbarsiz ishlayveradi, sakrash yo'q — vizyonga mos
- B) Avtomatik bir pog'ona yuqoriga biriktiriladi — uzluksiz, lekin pog'ona buziladi
- C) Keyin — hozir kerak emas

### Q23. Karta = ruxsat (RBAC)
**Nima:** Xodim ERP'da nimani ko'rishi/qilishi/tasdiqlashi — biriktirilgan kartadan kelib chiqsinmi (karta o'zgarsa ruxsat o'zgaradi).
**Nega kerak:** "Kim ko'radi, kim tasdiqlaydi" savoliga javob har doim kartadan; xodim boshqa kartaga o'tsa ruxsat avtomatik moslashadi.
**Variantlar:**
- A) Ha — ruxsat to'liq kartadan keladi — toza va izchil (vizyon shu)
- B) Ruxsat hozircha xodimga alohida beriladi — eski tartib, lekin chalkash
- C) Keyin — hozir kerak emas

### Q24. Karta uchun oylik turi
**Nima:** Har kartada oylik turi belgilansin: soatbay / kunbay / ishbay + bonus.
**Nega kerak:** Operatorga ishbay, ofisga oybay — har rol o'z to'lov tartibida; oylik kartadan keladi, xodimdan emas.
**Variantlar:**
- A) Ha — har kartada oylik turi + bonus maydoni — moslashuvchan (vizyon shu)
- B) Hamma uchun bitta oybay tartib — sodda, lekin haqiqatga mos emas
- C) Keyin — hozir kerak emas

### Q25. Bonus tizimi (KPI'siz)
**Nima:** Bonus — KPI formulasiga emas, balki HR/Moliya/rahbar sozlaydigan tizimga bog'lansinmi.
**Nega kerak:** Siz aytdingiz: bonus KPI'ga bog'liq bo'lmasin; rahbar nazoratida moslashuvchan bo'lsin.
**Variantlar:**
- A) Ha — bonus sozlanadigan, HR/Moliya/rahbar belgilaydi, KPI yo'q — vizyonga mos
- B) Bonus avtomatik KPI'dan hisoblanadi — avtomatik, lekin vizyonga zid
- C) Keyin — hozir kerak emas

### Q26. Oylik tasdiqlash zanjiri
**Nima:** Oylik avtomatik hisoblansin, lekin to'lashdan oldin HR + Moliya tasdig'i, so'ng rahbarga borsinmi.
**Nega kerak:** Avtomatik hisob xatosini odam ko'zi tekshiradi — noto'g'ri to'lov bo'lmaydi.
**Variantlar:**
- A) Ha — avto-hisob → HR + Moliya tasdiq → rahbar — nazoratli (vizyon shu)
- B) Avto-hisob to'g'ridan-to'g'ri to'lovga ketadi — tez, lekin xavfli
- C) Keyin — hozir kerak emas

### Q27. Darslik tugamasa oylik yo'q
**Nima:** Kartaga biriktirilgan darslik (LMS) tugamasa — o'sha karta oyligi to'xtatilsinmi.
**Nega kerak:** Ta'lim majburiyligini ta'minlaydi: o'qimasa, ishlay olmaydi degani.
**Variantlar:**
- A) Ha — darslik tugamaguncha o'sha karta oyligi yo'q — qattiq motivatsiya
- B) Faqat ogohlantirish, oylik tegmaydi — yumshoq
- C) Keyin — hozir kerak emas

### Q28. Darslik kartaga biriktiriladi (xodimga emas)
**Nima:** O'quv materiali (darslik) xodimga emas, kartaga biriktirilsin — kartaga kim kelsa, o'sha darslikni o'qiydi.
**Nega kerak:** Lavozim o'zgarmaydi, o'qish talabi ham o'zgarmaydi; yangi xodim kelganda noldan tayyorlamaysiz.
**Variantlar:**
- A) Ha — darslik kartada, xodim almashsa ham qoladi — barqaror (vizyon shu)
- B) Darslik har xodimga alohida beriladi — moslashuvchan, lekin takror ish
- C) Keyin — hozir kerak emas

### Q29. Darslik kim tayyorlaydi va tasdiqlaydi
**Nima:** Darslikni o'quv bo'limi qo'lda tayyorlasin → AI nazorat+hisobot → HR qaror → rahbar tasdiqlasinmi.
**Nega kerak:** Sifatli o'quv materiali bo'ladi va u nazoratdan o'tib kartaga qo'shiladi.
**Variantlar:**
- A) Ha — o'quv bo'limi yozadi, AI tekshiradi, HR+rahbar tasdiqlaydi — sifatli
- B) Rahbar darrov darslik biriktiradi, tasdiq yo'q — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q30. Markaziy AI — karta↔xodim moslik bahosi
**Nima:** Bitta markaziy AI har kartaga biriktirilgan xodimning mosligini baholasinmi (ЦКП, test, davomat, sifat, rahbar bahosi + boshqalar bilan solishtirish).
**Nega kerak:** "Bu xodim bu kartaga to'g'ri keladimi" savoliga raqam va sabab bilan javob; egasi obyektiv ko'radi.
**Variantlar:**
- A) Ha — bitta markaziy AI hamma kartani baholaydi — yaxlit (vizyon shu)
- B) Har modul o'z bahosini beradi, markaziy AI yo'q — tarqoq
- C) Keyin — hozir kerak emas

### Q31. AI hisobotini kim oladi
**Nima:** AI moslik bahosi PDF hisobot bo'lib kimga borsin — xodim, rahbar, HR.
**Nega kerak:** Hisobotni to'g'ri odamlar ko'rsa — adolatli qaror chiqadi.
**Variantlar:**
- A) Uchchalasiga ham (xodim + rahbar + HR), har biriga mos darajada — to'liq shaffof
- B) Faqat HR va rahbar ko'radi, xodim ko'rmaydi — yopiqroq
- C) Keyin — hozir kerak emas

### Q32. Ko'nikma-matritsa va vorislik
**Nima:** Kartalarga ko'nikma-matritsa qurilib, AI har karta uchun mumkin bo'lgan vorislar ro'yxatini (sabab bilan) chiqarsinmi.
**Nega kerak:** Rahbar ketsa kim o'rniga turishi oldindan tayyor; ichki o'sish: mohir farroshni vakansiyaga ko'tarish kabi.
**Variantlar:**
- A) Ha — ko'nikma-matritsa + AI vorislar ro'yxati (sabab bilan) — strategik
- B) Vorislikni qo'lda HR belgilaydi, matritsa yo'q — sodda, lekin sust
- C) Keyin — hozir kerak emas

### Q33. Ko'nikmani qanday qo'shiladi
**Nima:** Xodim "menda bu ko'nikma bor" desa → test → raport → ko'nikma-matritsaga qo'shilsinmi.
**Nega kerak:** Faqat tasdiqlangan (test o'tgan) ko'nikma matritsaga tushadi — soxta da'volar kirmaydi.
**Variantlar:**
- A) Ha — xodim da'vo qiladi → test → raport → matritsa — ishonchli
- B) Xodim o'zi belgilaydi, testsiz — tez, lekin ishonchsiz
- C) Keyin — hozir kerak emas

### Q34. 3 kun yo'qlik — profil bloki
**Nima:** Xodim 3 kun (ЦКП hisoboti bermay/yo'qolib) ketsa — profili avtomatik bloklansinmi (ochish: HR raporti → direktor tasdig'i → super admin ochadi).
**Nega kerak:** "G'oyib" xodim avtomatik aniqlanadi; tizim bo'sh ishlamaydi.
**Variantlar:**
- A) Ha — 3 kun → avto-blok, ochish HR→direktor→super admin orqali — qat'iy nazorat
- B) Faqat HR'ga ogohlantirish, blok yo'q — yumshoq
- C) Keyin — hozir kerak emas

### Q35. Ish-vaqti / smena — qayerda saqlanadi
**Nima:** Xodimning ish-vaqti/smenasi kartaning o'zida bo'lsinmi yoki alohida jadval bo'lib kartaga ulansinmi.
**Nega kerak:** Davomat (3-kun blok) va kunlik hisobot shu vaqtga bog'liq; manzili aniq bo'lishi kerak.
**Variantlar:**
- A) Alohida smena jadvali, kartaga ulanadi — moslashuvchan (smena tez o'zgaradi)
- B) Ish-vaqti to'g'ridan-to'g'ri kartada — sodda, lekin smena o'zgarsa qiyin
- C) Keyin — hozir kerak emas

### Q36. Karta ko'rinishi standarti (rang + kattalik)
**Nima:** Daraxtda kartalar standart rang va kattalikda chizilsinmi (masalan: otdeleniye/daraja bo'yicha rang, vakant — kulrang, holatga qarab belgi).
**Nega kerak:** Egasi bir qarashda bo'sh joylar, otdeleniyalar va muammoli kartalarni ko'radi.
**Variantlar:**
- A) Ha — rang otdeleniye/holat bo'yicha, kattalik standart — tushunarli ko'rinish
- B) Hamma karta bir xil rangda, oddiy ro'yxat — sodda, lekin ko'rinish zaif
- C) Keyin — hozir kerak emas

### Q37. Karta raqamlash (dublikatda 01/02)
**Nima:** Bir xil lavozimning bir nechta o'rindig'i bo'lsa — kartalarga raqam berilsinmi (Operator-01, Operator-02).
**Nega kerak:** Har o'rindiqni alohida ajratish; oylik, razryad, xodim aralashmaydi.
**Variantlar:**
- A) Ha — dublikat kartalar 01/02/03 raqami bilan — aniq farqlash
- B) Raqam yo'q, faqat xodim ismi bilan ajratiladi — sodda, lekin chalkash
- C) Keyin — hozir kerak emas

### Q38. Vakansiya → recruitment → kartaga biriktirish
**Nima:** Karta bo'shasa avtomatik "vakant" bo'lib, HR talabnoma → recruitment jarayoni → yangi xodim to'g'ridan-to'g'ri o'sha kartaga biriktirilsinmi.
**Nega kerak:** Hozir recruitment bor, lekin kartaga ulanish yo'q — bu zanjirni yopadi: tanlangan xodim aniq o'rindiqqa keladi.
**Variantlar:**
- A) Ha — vakant → talabnoma → recruitment → karta binding (avtomatik) — to'liq zanjir
- B) Recruitment alohida, kartaga qo'lda biriktiriladi — yarim avtomatik
- C) Keyin — hozir kerak emas

### Q39. Migratsiya — mavjudni yaxshilash (noldan emas)
**Nima:** Hozirgi 142 org-node + 30 xodimni saqlab, ustiga karta-qatlamni (razryad, GSD, oylik turi) qo'shib boramizmi yoki strukturani noldan quramizmi.
**Nega kerak:** Mavjud ish yo'qolmasligi va 7-qatlam tartibi saqlanishi uchun.
**Variantlar:**
- A) Mavjudni yaxshilab, vizyonga olib boramiz (7-qatlam saqlanadi) — xavfsiz (vizyon shu)
- B) Noldan toza struktura quramiz — toza, lekin riskli va sekin
- C) Keyin — hozir kerak emas

### Q40. Bitta DDL / ikki-olam yo'q
**Nima:** Org-data faqat bitta jadval-strukturada saqlansin, ikki xil "bo'lim olami" qolmasin (hozir 2 ta dept olami bor) — AI-kamera va barcha modul shunga ulansin.
**Nega kerak:** Ma'lumot ikki joyda turib chalkashmasligi; har modul bitta haqiqatni ko'rishi.
**Variantlar:**
- A) Ha — bitta yagona struktura, hamma shunga ulanadi — toza poydevor (vizyon shu)
- B) Hozir ikki olam qoladi, keyin birlashtiriladi — vaqtinchalik, lekin xavf davom etadi
- C) Keyin — hozir kerak emas

### Q41. Org-o'zgarish kaskadlari
**Nima:** Yangi bo'lim/karta yaratilganda yoki xodim ko'chirilganda tizim avtomatik bog'liq ishlarni bajarsinmi (yangi bo'limga POS ombor avto-yaratilishi, transferda RBAC va adaptatsiya qayta ishga tushishi).
**Nega kerak:** Bitta o'zgarish hamma joyga to'g'ri tarqaladi — qo'lda unutib qo'yilmaydi.
**Variantlar:**
- A) Ha — avtomatik kaskad (ombor, RBAC, adaptatsiya, shartnoma) — to'liq bog'langan
- B) O'zgarishlar qo'lda kiritiladi — sodda, lekin xato xavfi
- C) Keyin — hozir kerak emas

### Q42. Karta ma'lumotlarining ko'rinish darajasi (maxfiylik)
**Nima:** Kartadagi maxfiy maydonlar (oylik, AI moslik bahosi, razryad tarixi)ni kim ko'rishi — kartaning RBAC darajasidan kelib chiqsinmi.
**Nega kerak:** Oylik kabi maxfiy ma'lumot faqat haqdorlarga (HR, rahbar, egasi) ko'rinadi; oddiy xodim ko'rmaydi.
**Variantlar:**
- A) Ha — maxfiy maydonlar faqat ruxsatli kartalarga ko'rinadi — xavfsiz
- B) Hamma o'z kartasini to'liq ko'radi, boshqalarnikini ko'rmaydi — sodda
- C) Keyin — hozir kerak emas

DONE: Org-struktura / KARTALAR — 42 savol yozildi.
