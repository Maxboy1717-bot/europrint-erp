# EuroPrint ERP — Vizyon Savollari (Master Bank) — 2026-06-07

> Manba: ShVB 40-yo'nalish + D:/kitob (Biznes Egasi Maktabi 2020) + tizim-bo'shliq tahlili.
> Maqsad: egasi (zavod boshlig'i) Q&A orqali vizyonni 20 ta ERP moduliga bosqichma-bosqich qo'shadi.
> Har savol = bitta aniq qaror; birinchi variant (A) odatda vizyonga eng mos tavsiya. Egasi belgilagandan keyin bajaruvchi ishlaydi.

---

## Xulosa jadvali

| # | Modul | Savollar soni |
|---|-------|---------------|
| 1 | Org-struktura / KARTALAR | 42 |
| 2 | HR | 30 |
| 3 | Finance / GL | 32 |
| 4 | Coordination | 30 |
| 5 | Director / Strategiya | 30 |
| 6 | SD / Sotuv | 30 |
| 7 | PP / Rejalashtirish | 31 |
| 8 | MES / Ishlab chiqarish | 30 |
| 9 | QC / Sifat | 30 |
| 10 | Ombor / WMS | 31 |
| 11 | MM / Ta'minot | 36 |
| 12 | LMS / Ta'lim | 30 |
| 13 | CRM | 30 |
| 14 | Marketing | 30 |
| 15 | Kanban / Vazifalar | 30 |
| 16 | IoT | 30 |
| 17 | AI | 34 |
| 18 | Bildirishnoma / Telegram | 30 |
| 19 | POS Monitor | 30 |
| 20 | Communication Center / Hujjat | 32 |
| **JAMI** | | **628** |

---

## 1. Org-struktura / KARTALAR

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

---

## 2. HR

### Q43. Onboarding 90-kun bosqichlari
**Nima:** Yangi xodim 90 kunlik moslashuv jadvalini qanday bosqichlarga bo'lamiz.
**Nega kerak:** Aniq bosqich bo'lsa, yangi xodim nima qilishini biladi va mentor nazorat qiladi; o'z holiga tashlab qo'yilmaydi.
**Variantlar:**
- A) 3 bosqich (1-oy tanishuv → 2-oy o'rganish → 3-oy mustaqil) + har bosqich oxirida tekshiruv nuqtasi — aniq, ko'rsatadi qaysi bosqichda
- B) Kunlik vazifa ro'yxati (90 ta kun, har biriga topshiriq) — juda batafsil, lekin to'ldirish og'ir
- C) Faqat boshlanish va tugash sanasi, oraliq yo'q — eng oddiy, lekin nazorat yo'q

### Q44. Onboarding rejasi qayerdan keladi
**Nima:** Yangi xodimning 90-kun rejasi qayerga bog'lanadi — odamga emas, lavozim kartasiga.
**Nega kerak:** Karta-modelda reja lavozimga tegishli; bir lavozimga kelgan har kim bir xil onboarding oladi, qayta yozish kerak emas.
**Variantlar:**
- A) Reja lavozim kartasiga biriktiriladi (har lavozimning o'z 90-kun shabloni) — karta-modelga to'liq mos
- B) Reja har xodimga alohida qo'lda tuziladi — moslashtirsa bo'ladi, lekin har safar mehnat
- C) Keyin — hozir umumiy bitta reja yetarli

### Q45. Onboarding tugashi nimani ochadi
**Nima:** 90-kun muvaffaqiyatli tugaganda tizimda nima o'zgaradi.
**Nega kerak:** Onboarding faqat belgi bo'lib qolmasligi, balki ish huquqi/oylik/tizim kirishni ochishi kerak.
**Variantlar:**
- A) Tugagach: lavozim kartasiga to'liq biriktiriladi + to'liq oylik + ERP modullarga ruxsat ochiladi — natijaga bog'langan
- B) Faqat "tugadi" belgisi qo'yiladi, qolgan narsa qo'lda — yengil, lekin uzilgan
- C) Keyin — hozir avto-ochilish kerak emas

### Q46. Haftalik reja tarkibi (5 vazifa + omillar)
**Nima:** Xodim har hafta to'ldiradigan rejada nima bo'ladi.
**Nega kerak:** ShVB da haftalik reja = 5 asosiy vazifa + ularga ta'sir qiluvchi omillar; bu boshqaruvning asosiy ritmi.
**Variantlar:**
- A) 5 vazifa + har biriga muhimlik/omil + lavozim GSD maqsadiga bog'lanish — ShVB ga to'liq mos
- B) Faqat 5 vazifa ro'yxati, omilsiz — oddiy, lekin "nega" yo'qoladi
- C) Erkin matn (nima yozsa shu) — eng yengil, lekin tahlil qilib bo'lmaydi

### Q47. Haftalik reja tasdiqi (approve oqimi)
**Nima:** Xodim rejani topshirgach kim tasdiqlaydi.
**Nega kerak:** Reja rahbar ko'zidan o'tmasa, maqsadga mos kelmasligi mumkin; tasdiq orqali rahbar yo'naltiradi.
**Variantlar:**
- A) Bevosita rahbar (org-tarmoqdagi keyingi yuqori daraja) tasdiqlaydi/qaytaradi izoh bilan — vertikal boshqaruvga mos
- B) Avtomatik qabul, faqat rahbar xohlasa ko'radi — tez, lekin nazorat zaif
- C) Keyin — hozir tasdiqsiz topshirish yetarli

### Q48. Haftalik rejada real natija nazorati
**Nima:** Hafta oxirida rejalashtirilgan vazifa bajarildimi-yo'qmi qanday belgilanadi.
**Nega kerak:** Faqat rejani yozish kifoya emas; bajarilganini o'lchamasak, reyting va bonus haqiqatga asoslanmaydi.
**Variantlar:**
- A) Har vazifaga "bajarildi / qisman / bajarilmadi" + qisqa sabab, keyingi haftaga ko'chirish — to'liq sikl
- B) Faqat umumiy "hafta bajarildi %" — oddiy ko'rsatkich
- C) Keyin — hozir faqat reja qo'yish, natija keyin

### Q49. Inspektor-menejer buzilish turlari ro'yxati (master-data)
**Nima:** Inspektor tekshiruvda qayd etadigan buzilish turlarining tayyor ro'yxati.
**Nega kerak:** Standart ro'yxat bo'lsa, buzilishlar bir xil nomlanadi va statistika to'planadi; har inspektor o'zicha yozmaydi.
**Variantlar:**
- A) Tayyor kategoriyalar (tozalik, xavfsizlik, intizom, sifat, jihoz) + og'irlik darajasi — tahlilga qulay
- B) Erkin matnli buzilish tavsifi — moslashuvchan, lekin statistikasiz
- C) Keyin — hozir umumiy izoh yetarli

### Q50. Inspektor: buzilish → tuzatish sikli
**Nima:** Buzilish topilgach, uni tuzatish va yopish qanday kuzatiladi.
**Nega kerak:** Buzilishni qayd etish kifoya emas — kim, qachongacha tuzatishi va bajarilgani yopilishi kerak.
**Variantlar:**
- A) Har buzilishga: mas'ul + muddat + holat (ochiq/tuzatildi/yopildi) + foto-dalil — to'liq yopiq sikl
- B) Faqat buzilish ro'yxati, tuzatish qo'lda kuzatiladi — yengil
- C) Keyin — hozir faqat qayd etish

### Q51. Inspektor tekshiruv chastotasi va AI bahosi
**Nima:** Inspeksiya qachon o'tkaziladi va AI baho beradimi.
**Nega kerak:** Muntazam tekshiruv intizomni ushlab turadi; AI ball esa inson xolisligini kamaytiradi.
**Variantlar:**
- A) Belgilangan jadval (har kun/hafta xona bo'yicha) + AI dastlabki ball, inspektor tasdiqlaydi — muvozanatli
- B) Faqat qo'lda, inspektor xohlaganda — moslashuvchan, lekin tartibsiz
- C) Keyin — hozir AI yo'q, faqat qo'lda tekshiruv

### Q52. Yillik anketa savollari (master-data)
**Nima:** Xodimlar yiliga bir marta to'ldiradigan anketadagi savollar to'plami.
**Nega kerak:** ShVB da standart 17-savollik anketa bor; bir xil savollar yildan-yilga taqqoslash imkonini beradi.
**Variantlar:**
- A) ShVB ning 17 savoli asos qilib olinadi + bo'lim bo'yicha qo'shimcha savol — tayyor va tajribaga asoslangan
- B) Yangi qisqa anketa (5-7 savol) nolda yoziladi — yengil, lekin tarix yo'q
- C) Keyin — hozir eNPS yetarli

### Q53. Yillik anketa "yillik qulfi"
**Nima:** Anketani faqat yilda bir marta ochish va o'tgan yillar bilan solishtirish.
**Nega kerak:** "Yillik" bo'lishi uchun u takror ochilmasligi va har yil natijasi saqlanishi kerak; aks holda oddiy so'rovnoma bo'lib qoladi.
**Variantlar:**
- A) Yiliga bir tsikl ochiladi + o'tgan yil bilan yonma-yon solishtirish — haqiqiy yillik o'lchov
- B) Istalgan vaqtda to'ldirsa bo'ladi, lekin yil bo'yicha guruhlanadi — moslashuvchan
- C) Keyin — hozir qulf kerak emas

### Q54. Reyting toifalari A/B/C chegaralari (master-data)
**Nima:** Xodim qaysi ballда A, qaysi ballда B yoki C toifaga tushadi.
**Nega kerak:** Bonus toifaga bog'liq bo'lgani uchun chegaralar aniq va adolatli bo'lishi shart; aks holda nizo chiqadi.
**Variantlar:**
- A) Aniq ball oralig'i (masalan A=85+, B=70-84, C=70-) markaziy sozlanadi — shaffof, o'zgartirsa bo'ladi
- B) Har bo'limда o'z chegarasi bo'ladi — moslashuvchan, lekin taqqoslab bo'lmaydi
- C) Keyin — hozir faqat reyting balli, toifasiz

### Q55. Reyting ballini nima belgilaydi
**Nima:** A/B/C reyting qaysi ko'rsatkichlardan hisoblanadi.
**Nega kerak:** Reyting GSD/natijaga asoslansa, u haqiqiy ishni o'lchaydi; sub'ektiv bo'lsa adolatsiz bo'ladi.
**Variantlar:**
- A) Lavozim GSD bajarilishi + sifat + haftalik reja bajarilishi (vaznli formula) — ShVB+karta-modelga mos
- B) Faqat rahbar qo'lda qo'ygan baho — tez, lekin sub'ektiv
- C) Keyin — hozir aralash, formula keyin

### Q56. Reyting → bonus → oylik bog'lanishi
**Nima:** A/B/C toifa xodim oyligiga qanday ta'sir qiladi.
**Nega kerak:** Reyting oylikka ulansa, u haqiqiy rag'bat bo'ladi; ulanmasa shunchaki raqam bo'lib qoladi.
**Variantlar:**
- A) Toifa avtomatik bonus foizini belgilaydi va payroll'ga qo'shiladi (A=+%, C=0) — to'liq avtomatik
- B) Toifa tavsiya beradi, summani rahbar qo'lda kiritadi — nazorat ko'p, mehnat ko'p
- C) Keyin — hozir reyting ko'rinadi, oylikka ulanmaydi

### Q57. Recruitment-AI roli (nomzod baholash)
**Nima:** Vakansiyaga kelgan nomzodlarni AI qanchalik baholaydi.
**Nega kerak:** Ko'p ariza kelsa, AI birlamchi saralash vaqtni tejaydi; lekin yakuniy qaror odamniki bo'lishi kerak.
**Variantlar:**
- A) AI lavozim kartasi talabiga ko'ra nomzodni ballaydi va saralaydi, qabul qarorini odam qiladi — karta-modelga mos
- B) AI faqat rezyume qisqartmasini chiqaradi, ball yo'q — yordamchi, lekin saralamaydi
- C) Keyin — hozir AI'siz qo'lda saralash

### Q58. Recruitment bosqichlari (pipeline master-data)
**Nima:** Nomzod ariza berdandan ishga olingungacha qanday bosqichlardan o'tadi.
**Nega kerak:** Standart pipeline bo'lsa, hech bir nomzod unutilmaydi va har bosqichda kim mas'ulligi aniq.
**Variantlar:**
- A) Tayyor bosqichlar (Ariza → Suhbat → Sinov → Taklif → Onboarding) ustun ko'rinishida — aniq va kuzatiladigan
- B) Faqat "ko'rib chiqilmoqda / qabul / rad" 3 holat — oddiy
- C) Keyin — hozir ro'yxat yetarli, bosqichsiz

### Q59. Sinov muddati (probation) natijasi
**Nima:** Sinov muddati tugagach qaror qanday qabul qilinadi.
**Nega kerak:** Sinov natijasi rasman qayd etilmasa, yaroqsiz xodim qolib ketishi yoki yaxshi xodim yo'qotilishi mumkin.
**Variantlar:**
- A) Sinov oxirida rahbar bahosi + qaror (qabul/uzaytirish/rad) yozib qoldiriladi — aniq qaror nuqtasi
- B) Sinov avtomatik tugaydi, alohida qaror yo'q — yengil, lekin nazorat yo'q
- C) Keyin — hozir sinov muddati kuzatilmaydi

### Q60. Mentorlik biriktirish
**Nima:** Yangi xodimga mentor qanday tayinlanadi.
**Nega kerak:** Mentor bo'lsa, yangi xodim tezroq moslashadi va yo'l-yo'riq oladi.
**Variantlar:**
- A) Lavozim/bo'lim bo'yicha avtomatik taklif (masalan bevosita rahbar yoki tajribali xodim) + tasdiqlash — tez va mantiqiy
- B) HR har safar qo'lda tanlaydi — moslashuvchan, lekin sekin
- C) Keyin — hozir mentorsiz onboarding

### Q61. Mentor faolligi va bahosi
**Nima:** Mentor o'z ishini tizimda qanday bajaradi va u baholanadimi.
**Nega kerak:** Mentor faqat nomda bo'lib qolmasligi; uning izohi va yangi xodim natijasi mentor ishini ko'rsatadi.
**Variantlar:**
- A) Mentor har bosqichda izoh/baho qoldiradi + onboarding muvaffaqiyati mentor reytingiga ta'sir qiladi — javobgarlikni oshiradi
- B) Mentor faqat biriktiriladi, faolligi kuzatilmaydi — oddiy
- C) Keyin — hozir mentor faqat ism sifatida

### Q62. Referral-bonus (xodim tavsiyasi bilan ishga olish)
**Nima:** Xodim tanishini ishga taklif qilib, u qabul bo'lsa bonus oladigan tizim.
**Nega kerak:** Xodimlar tavsiya qilgan nomzodlar ko'pincha ishonchli bo'ladi va ishga olish arzonga tushadi.
**Variantlar:**
- A) Xodim nomzodni tizimga kiritadi → kuzatiladi → ishga olinib sinovdan o'tgach bonus avtomatik hisoblanadi — to'liq sikl
- B) Tavsiyalar ro'yxati yuritiladi, bonus qo'lda to'lanadi — yengil
- C) Keyin — hozir referral kerak emas

### Q63. Referral-bonus shartlari (master-data)
**Nima:** Tavsiya bonusi qancha va qachon to'lanadi.
**Nega kerak:** Shartlar oldindan aniq bo'lmasa, xodimlar ishonmaydi va tizim ishlamaydi.
**Variantlar:**
- A) Lavozimga qarab belgilangan summa, sinovdan o'tgach to'lanadi (markaziy sozlanadi) — adolatli va shaffof
- B) Har holatда rahbar qarori bilan — moslashuvchan, lekin noaniq
- C) Keyin — hozir summa keyin belgilanadi

### Q64. Xodim profili tarkibi
**Nima:** Bir xodim kartasida qanday ma'lumotlar ko'rinadi.
**Nega kerak:** To'liq profil bo'lsa, xodim haqida hamma narsa bir joyda — qayta-qayta qidirilmaydi.
**Variantlar:**
- A) Shaxsiy + lavozim kartasi + GSD/reyting + onboarding + hujjat + xizmat safari bir sahifada (tablar) — to'liq ko'rinish
- B) Faqat shaxsiy va aloqa ma'lumotlari — oddiy
- C) Keyin — hozir mavjud profil yetarli

### Q65. Profil va lavozim kartasi bog'lanishi
**Nima:** Xodim profili lavozim kartasi bilan qanday bog'lanadi.
**Nega kerak:** Karta-modelda xodim faqat kartaga biriklanganda oylik va ERP huquqini oladi; bu bog' aniq bo'lishi shart.
**Variantlar:**
- A) Profilda "biriktirilgan karta(lar)" ko'rinadi; karta talab/razryad/oylik shu yerdан keladi — karta-modelga to'liq mos
- B) Lavozim faqat matn maydoni sifatida yoziladi — oddiy, lekin kartaga ulanmaydi
- C) Keyin — hozir lavozim oddiy yozuv

### Q66. Xizmat safari (komandirovka) arizasi
**Nima:** Xodim xizmat safariga qanday ariza beradi va kim tasdiqlaydi.
**Nega kerak:** Safar arizasi tizimda bo'lsa, ruxsat, xarajat va hisobot tartibli yuritiladi.
**Variantlar:**
- A) Ariza (sana, joy, maqsad, taxminiy xarajat) → rahbar tasdiqi → safar qaydlanadi — to'liq oqim
- B) Faqat safar ro'yxati qo'lda yuritiladi — yengil
- C) Keyin — hozir xizmat safari kerak emas

### Q67. Xizmat safari xarajati va moliyaga ulanishi
**Nima:** Safar xarajatlari hisobot qilinadi va moliya moduliga o'tadimi.
**Nega kerak:** Xarajat moliyaga ulansa, byudjet va to'lov nazorati to'liq bo'ladi; uzilsa qo'sh hisob chiqadi.
**Variantlar:**
- A) Tasdiqlangan safar xarajati moliya (to'lov/avans) bilan bog'lanadi va hisobot beriladi — to'liq integratsiya
- B) Xarajat faqat HR ichida qayd etiladi, moliyaga qo'lda kiritiladi — sodda, lekin uzilgan
- C) Keyin — hozir faqat safar fakti, xarajatsiz

### Q68. GSD/ЦКП lavozimga ta'rifi (master-data)
**Nima:** Har lavozim uchun asosiy natija ko'rsatkichi (GSD/ЦКП) qanday belgilanadi.
**Nega kerak:** Karta-modelning yuragi — har karta o'z to'g'ri natija ta'rifiga ega bo'lishi; haftalik reja va reyting shunga tayanadi.
**Variantlar:**
- A) Har lavozim kartasiga GSD (formula + maqsad + o'lchov birligi) yoziladi — karta-model poydevori
- B) Faqat umumiy KPI raqami, lavozimga ta'rifsiz — bor, lekin tarqoq
- C) Keyin — hozir KPI yetarli

### Q69. Razryad → talab → oylik o'sishi
**Nima:** Lavozim ichidagi razryad (daraja) oshganda talab va oylik qanday o'zgaradi.
**Nega kerak:** Razryad tizimi xodimga o'sish yo'lini ko'rsatadi va oylik adolatli ko'tariladi.
**Variantlar:**
- A) Har razryadga talab + darslik + oylik bog'lanadi; razryad oshsa avtomatik oylik o'zgaradi — karta-modelga mos
- B) Razryad faqat unvon sifatida, oylik qo'lda — oddiy
- C) Keyin — hozir razryad kerak emas

### Q70. Lavozim kartasi AI'si (xodim↔karta mosligi)
**Nima:** Har karta o'z AI'siga ega bo'lib, xodim shu kartaga mos kelishini baholaydimi.
**Nega kerak:** Vizyonda har karta AI'si xodim-karta mosligini baholaydi, hisobot yozadi, AI'lar o'zaro ishlaydi; bu HR qarorini ob'ektivlashtiradi.
**Variantlar:**
- A) Har karta AI'si reyting/GSD/onboarding'ga qarab moslik hisoboti chiqaradi (mos/qisman/mos emas) — vizyonga to'liq mos
- B) Bitta umumiy HR-AI hamma xodimni baholaydi, kartaga xos emas — soddaroq
- C) Keyin — hozir AI bahosi qo'lda

### Q71. Haftalik HR digesti (dushanba xulosasi)
**Nima:** Har hafta boshida rahbarlarga avtomatik HR xulosasi (kim reja topshirdi, reyting, buzilishlar) yuboriladimi.
**Nega kerak:** Digest bo'lsa, rahbar har birini qo'lda tekshirmay, bir ko'rinishда holatni biladi.
**Variantlar:**
- A) Dushanba avtomatik digest (Telegram/ERP) — reja topshirish %, top/past reyting, ochiq buzilishlar — boshqaruvga tayyor
- B) Faqat ERP ichida ko'rinadi, avto-yuborishsiz — oddiy
- C) Keyin — hozir digest kerak emas

### Q72. Lavozim papkasi (Должностная папка) to'liqligi
**Nima:** Har lavozim kartasiga biriktirilgan hujjatlar papkasi (yo'riqnoma, talab, darslik, GSD, ЦКП) qanchalik to'liq bo'lishi nazorat qilinadi.
**Nega kerak:** Papka to'liq bo'lsa, lavozim "to'g'ri ish ta'rifi" sifatida tugallangan bo'ladi; bo'sh bo'lsa onboarding va baho ishlamaydi.
**Variantlar:**
- A) 6 nomli bo'lim (yo'riqnoma/talab/darslik/GSD/ЦКП/razryad) + to'liqlik % ko'rsatkichi — qaysi karta tayyor emasligini ko'rsatadi
- B) Faqat hujjat ro'yxati, to'liqlik foizisiz — oddiy
- C) Keyin — hozir mavjud papka yetarli

---

## 3. Finance / GL

### Q73. ZVS arizasi (haftalik byudjet so'rovi) ekrani
**Nima:** Har bo'lim haftalik xarajat so'rovini (ZVS) tizimda to'ldirib yuboradigan to'liq forma va ro'yxat.
**Nega kerak:** Hozir orqa tomonda mantiq bor, lekin xodim kiritadigan oyna yo'q — pul so'rovlari hali ham qog'oz/Telegramda yuribdi.
**Variantlar:**
- A) To'liq ekran — kiritish + ro'yxat + holat ko'rsatkichi, ShVB blankiga mos — bo'limlar tizimda so'raydi
- B) Faqat oddiy ro'yxat — so'rovlarni ko'rsatadi, kiritish boshqa joyda — yarim yechim
- C) Keyin — hozir kerak emas

### Q74. ZNO arizasi (majburiyat/to'lov so'rovi) ekrani
**Nima:** Tashqi to'lov majburiyatini (ZNO — yetkazib beruvchiga to'lash) tizimga kiritish formasi va kuzatuvi.
**Nega kerak:** ZVS byudjetni ajratadi, ZNO esa real to'lovni boshlaydi — ikkisi ham bo'lmasa pul oqimi tizimda ko'rinmaydi.
**Variantlar:**
- A) To'liq ZNO ekrani — yetkazib beruvchi, summa, hujjat, ZVS ga bog'lab — to'lov zanjiri yopiladi
- B) ZNO ni ZVS ichida belgi sifatida — alohida ekransiz — soddaroq, lekin chalkash
- C) Keyin — avval ZVS ishga tushsin

### Q75. ZVS/ZNO ni 3-savatli koordinatsiyaga ulash
**Nima:** ZVS/ZNO arizasi avtomatik koordinatsiya "savat"iga (tasdiqlash navbati) tushishi.
**Nega kerak:** Ariza yuborilgach kim ko'rishi va qachongacha javob berishi aniq bo'ladi — so'rov yo'qolmaydi.
**Variantlar:**
- A) Avtomatik savatga + 24/48 soat muddat — tasdiqlovchi vaqtida ko'radi
- B) Faqat ro'yxatda turadi, muddatsiz — sekin, unutilishi mumkin
- C) Keyin

### Q76. 4-hisob ajratish (MAIN / TAX / HEAD / WORKING)
**Nima:** Pulni 4 alohida hisobga bo'lib yuritish: asosiy (MAIN), soliq (TAX), egasi/bosh (HEAD), ish-aylanma (WORKING).
**Nega kerak:** ShVB ning poydevori — har tushgan pul darrov 4 ga bo'linadi, shunda soliq va egasi ulushi xavf ostida qolmaydi.
**Variantlar:**
- A) To'rttala hisob alohida + har biri balans/harakat ko'rsatadi — ShVB modeliga to'liq mos
- B) Faqat 2 hisob (asosiy + soliq) — yarim model, egasi ulushi yo'q
- C) Keyin — avval umumiy kassa yetarli

### Q77. Tushumni 4-hisobga avtomatik taqsimlash
**Nima:** Har pul tushganda belgilangan foizlar bo'yicha 4 hisobga o'zi bo'linsinmi yoki qo'lda kiritilsinmi.
**Nega kerak:** Avtomatik taqsim "intizom"ni majbur qiladi — odam unutib soliq pulini sarflab qo'ymaydi.
**Variantlar:**
- A) Avtomatik foiz bilan taqsim (foizni egasi belgilaydi) — intizom kafolati
- B) Qo'lda — kassir har safar o'zi bo'ladi — moslashuvchan, lekin xato xavfi
- C) Keyin

### Q78. Taqsim foizlarini kim belgilaydi
**Nima:** MAIN/TAX/HEAD/WORKING ulush foizlarini sozlash huquqi kimda bo'lishi.
**Nega kerak:** Bu pul taqsimoti — noto'g'ri qo'lda bo'lsa, butun moliya buziladi.
**Variantlar:**
- A) Faqat egasi (direktor) o'zgartiradi, qolganlar ko'radi — xavfsiz
- B) Moliya boshlig'i ham o'zgartira oladi — tezroq, lekin xavfliroq
- C) Keyin

### Q79. Tasdiqlash matritsasi: summalik bosqichlar
**Nima:** So'rov summasiga qarab kim tasdiqlashi: 500 ming so'mgacha — bo'lim, 5 mln gacha — kengash, 5 mln dan yuqori — direktor.
**Nega kerak:** Katta xarajat yolg'iz qaror bilan o'tib ketmaydi; kichik xarajat esa direktorni ovora qilmaydi.
**Variantlar:**
- A) 3 bosqich (bo'lim / kengash / direktor) avtomatik tanlanadi — ShVB matritsasiga aniq mos
- B) 2 bosqich (bo'lim / direktor), kengashsiz — soddaroq
- C) Keyin — hozir hamma so'rov direktorга

### Q80. Tasdiqlash chegaralari sozlanadigan bo'lsinmi
**Nima:** 500k / 5M chegaralari kodga qotirilganmi yoki egasi ekranda o'zgartira oladimi.
**Nega kerak:** Inflyatsiya yoki o'sish bilan chegaralar o'zgaradi — har safar dasturchini chaqirmaslik kerak.
**Variantlar:**
- A) Sozlamada ekrandan o'zgartiriladigan chegara — moslashuvchan
- B) Qotirilgan chegara, o'zgartirish uchun dasturchi kerak — qattiq, lekin oddiy
- C) Keyin

### Q81. Tasdiqlovchini lavozimga emas, kartaga bog'lash
**Nima:** "Kengash" yoki "direktor" tasdiqlovchisi aniq odamga emas, org-kartadagi rolga bog'lansin.
**Nega kerak:** Karta-model bo'yicha — odam almashsa ham karta qoladi, tasdiqlash uzilmaydi.
**Variantlar:**
- A) Tasdiqlovchi = karta (lavozim), egasi kim ekani avtomatik topiladi — karta-modelga mos
- B) Tasdiqlovchi = aniq xodim ismi — odam ketsa qayta sozlash kerak
- C) Keyin

### Q82. Tasdiqlash muddati o'tib ketsa nima bo'ladi
**Nima:** Tasdiqlovchi belgilangan vaqtda javob bermasa tizim nima qilsin.
**Nega kerak:** So'rov "osilib" qolmasligi, ish to'xtamasligi uchun.
**Variantlar:**
- A) Yuqori bosqichga avtomatik ko'tariladi (eskalatsiya) + ogohlantirish — ish to'xtamaydi
- B) Faqat eslatma yuboradi, o'zi turaveradi — yumshoq
- C) Keyin

### Q83. Haftalik FP-tsikl jadvali (Se/Ch/Pa/Du)
**Nima:** Moliyaviy rejalash siklining hafta kunlari: Seshanba/Chorshanba/Payshanba/Dushanba bosqichlari (ariza→tasdiq→to'lov→hisobot).
**Nega kerak:** ShVB ning haftalik ritmi — har kun aniq vazifaga bog'lansa, pul boshqaruvi tartibli yuradi.
**Variantlar:**
- A) 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram eslatma — ShVB reglamentiga mos (cron bor)
- B) Faqat haftada 1 marta umumiy eslatma — tartib yo'qroq
- C) Keyin

### Q84. FP-tsikl kunlarini egasi o'zgartira oladimi
**Nima:** Sikl kunlari (qaysi kuni ariza, qaysi kuni to'lov) sozlanadigan bo'lsinmi.
**Nega kerak:** Bank/bayram kunlari yoki ish tartibi o'zgarsa, jadval moslashishi kerak.
**Variantlar:**
- A) Ekrandan kunlarni o'zgartirish mumkin — moslashuvchan
- B) Qotirilgan 4 kun (Se/Ch/Pa/Du) — barqaror, lekin qattiq
- C) Keyin

### Q85. FP-tsikl eslatmalari qayerga boradi
**Nima:** Sikl bosqichi kelganda eslatma Telegramга, ERP ichidagi bildirishnomага yoki ikkalasigaga.
**Nega kerak:** Mas'ul odam eslatmani ko'radigan joyga olishi kerak, aks holcha bosqich kechikadi.
**Variantlar:**
- A) Telegram + ERP bildirishnoma birga — ko'rmay qolmaydi
- B) Faqat ERP ichida — Telegramsiz, ba'zilar kech ko'radi
- C) Keyin

### Q86. To'lanmagan schyotlar yoshi (aging) ko'rinishi
**Nima:** Qarzlarni qancha kun o'tganiga qarab guruhlash: 0-30 / 31-60 / 61-90 / 90+ kun.
**Nega kerak:** Qaysi pul "qarib ketgani"ni ko'rsatadi — eng eski qarzni birinchi undirish/to'lash kerak.
**Variantlar:**
- A) To'liq aging — 4 guruh + jami summa + eng eski yuqorida — qarama-qarshilik aniq ko'rinadi
- B) Faqat "to'lanmagan ro'yxat", yoshsiz — kim eng xavfli ekani noma'lum
- C) Keyin

### Q87. Aging — debitor (bizga qarz) va kreditor (biz qarzdor) alohidami
**Nima:** Bizga qarz bo'lganlar va biz qarzdor bo'lganlar ikkita alohida ro'yxatda ko'rinsinmi.
**Nega kerak:** Ikkisi — turli harakat: birini undirish, ikkinchisini to'lash kerak; aralashsa chalkashadi.
**Variantlar:**
- A) Ikki alohida ekran (debitor / kreditor), har birida aging — aniq
- B) Bitta umumiy ro'yxat, belgi bilan ajratilgan — soddaroq, lekin chalkash
- C) Keyin

### Q88. Eski qarz haqida avtomatik ogohlantirish
**Nima:** Schyot belgilangan kundan oshganda mas'ulga avtomatik signal borishi.
**Nega kerak:** Qarz "esdan chiqib" katta zararga aylanmasligi uchun.
**Variantlar:**
- A) Kunlik avtomatik alert (90+ kun = direktorga ham) — hech narsa qochmaydi
- B) Faqat ekranda qizil rang, signal yo'q — odam o'zi qarashi kerak
- C) Keyin

### Q89. Byudjet rejalash darajasi
**Nima:** Byudjet butun zavodga umumiymi yoki har bo'lim/karta bo'yicha alohidami.
**Nega kerak:** Bo'lim bo'yicha byudjet — har kim o'z chegarasini biladi, ortig'ini so'ramaydi.
**Variantlar:**
- A) Bo'lim (va karta) bo'yicha byudjet, ZVS shunga taqqoslanadi — nazorat aniq
- B) Faqat umumiy zavod byudjeti — sodda, lekin bo'limlar nazorati yo'q
- C) Keyin

### Q90. ZVS so'rovini byudjetga taqqoslash
**Nima:** Ariza yuborilganda tizim qolgan byudjet bilan taqqoslab "yetadi/yetmaydi" deb ko'rsatsinmi.
**Nega kerak:** Tasdiqlovchi byudjet oshib ketayotganini darhol ko'radi, ko'r-ko'rona tasdiqlamaydi.
**Variantlar:**
- A) Avtomatik taqqoslash + qolgan summa + oshsa ogohlantirish — ortiqcha xarajat to'xtaydi
- B) Faqat ariza summasini ko'rsatadi, byudjetsiz — tasdiqlovchi o'zi tekshiradi
- C) Keyin

### Q91. Byudjet davri
**Nima:** Byudjet haftalik, oylik yoki yillik asosda yuritilsinmi.
**Nega kerak:** ShVB haftalik ishlaydi, lekin soliq/rejalash oylik-yillik bo'lishi mumkin — qaysi asosiy ekani aniq bo'lishi kerak.
**Variantlar:**
- A) Haftalik asosiy + oylik/yillik jamlanma — ShVB ritmiga mos
- B) Faqat oylik byudjet — an'anaviy, lekin haftalik nazoratsiz
- C) Keyin

### Q92. Kassa (naqd) hisobi tizimda
**Nima:** Naqd kirim-chiqim (kassa) ERP ichida yuritilsinmi yoki tashqarida qoldirilsinmi.
**Nega kerak:** Kassa tizimda bo'lsa, 4-hisob va aging bilan bog'lanadi — pulning haqiqiy holati ko'rinadi.
**Variantlar:**
- A) Kassa to'liq ERP ichida — har kirim/chiqim yozuvi + kunlik qoldiq — to'liq nazorat
- B) Faqat kunlik qoldiqni qo'lda kiritish — yengilroq, lekin tafsilotsiz
- C) Keyin

### Q93. Kassa va POS/ombor bilan bog'lanish
**Nima:** Ishlab chiqarish/ombor (POS-monitor) harakatlari kassaga avtomatik yozilsinmi.
**Nega kerak:** Sotuv yoki xarid bo'lganda pul harakati o'zi tushsa, ikki marta yozish va xato kamayadi.
**Variantlar:**
- A) Avtomatik bog'lanish — POS/ombor harakati kassa+GL ga o'zi yoziladi
- B) Qo'lda — moliyachi alohida kiritadi — ishonchli nazorat, lekin sekin
- C) Keyin

### Q94. GL-buxgalteriya: yagona daftar (canonical)
**Nima:** Barcha pul yozuvlari bitta asosiy buxgalteriya daftarida (GL) to'plansinmi.
**Nega kerak:** Hozir bir nechta parallel GL bor — bittaga jamlash balansni ishonchli qiladi.
**Variantlar:**
- A) Yagona kanonik GL — hamma modul (kassa, ZNO, payroll) shunga yozadi — bitta haqiqat
- B) Modullar o'z daftarini yuritadi, vaqti-vaqti jamlanadi — tarqoq, mos kelmaslik xavfi
- C) Keyin

### Q95. Buxgalteriya yozuvi har doim ikki tomonlama bo'lsinmi
**Nima:** Har pul harakati ikki tomon (debet/kredit) bilan yozilib, doim balanslashishi.
**Nega kerak:** Bu buxgalteriyaning asosiy qonuni — balanslashmasa hisobotga ishonib bo'lmaydi.
**Variantlar:**
- A) Doim ikki tomonlama, balanslashmasa yozuv qabul qilinmaydi — to'g'ri buxgalteriya
- B) Oddiy bir tomonlama yozuv ham bo'laveradi — yengil, lekin xato topilmaydi
- C) Keyin

### Q96. Hisoblar rejasi (schyotlar plani) standarti
**Nima:** GL hisoblar ro'yxati O'zbekiston BHMS (milliy hisob standarti) bo'yicha tuzilsinmi yoki ShVB ning soddalashtirilgan ro'yxati bo'yichami.
**Nega kerak:** Standart hisoblar rejasi soliq/audit bilan mos kelishini ta'minlaydi.
**Variantlar:**
- A) Milliy BHMS hisoblar rejasi + ShVB 4-hisob ustiga qo'yiladi — rasmiy + boshqaruv birga
- B) Faqat ShVB sodda ro'yxati — boshqaruvga yetarli, lekin soliqqa mos emas
- C) Keyin

### Q97. Tasdiqlangan ZNO avtomatik GL yozuviga aylansinmi
**Nima:** To'lov so'rovi tasdiqlanib amalga oshgach, buxgalteriya yozuvi o'zi yaratilsinmi.
**Nega kerak:** Qo'lda qayta kiritish — vaqt va xato; avtomatik bo'lsa pul harakati darrov daftarga tushadi.
**Variantlar:**
- A) Avtomatik GL yozuvi (tasdiq→to'lov→daftar) — uzluksiz zanjir
- B) Buxgalter qo'lda yozadi — nazoratli, lekin kechikadi
- C) Keyin

### Q98. To'lov so'roviga hujjat (chek/shartnoma) biriktirish
**Nima:** ZVS/ZNO ga skan/foto hujjat (chek, hisob-faktura, shartnoma) biriktirish imkoni.
**Nega kerak:** Tasdiqlovchi nima uchun to'lanayotganini ko'radi; keyin audit uchun dalil qoladi.
**Variantlar:**
- A) Hujjat biriktirish majburiy (ma'lum summadan yuqorida) — shaffof + auditga tayyor
- B) Ixtiyoriy biriktirish — yengil, lekin ba'zida dalilsiz
- C) Keyin

### Q99. Kompaniya holati ko'rsatkichiga moliyani ulash
**Nima:** "Kompaniya holati" (O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) hisobida moliya ko'rsatkichlari (kassa qoldiq, aging, byudjet) ishtirok etsinmi.
**Nega kerak:** Egasi bir qarashda zavod moliyaviy holatini ko'radi — qaror tezlashadi.
**Variantlar:**
- A) Moliya ko'rsatkichlari holat formulasiga kiradi (kam kassa/katta qarz = XAVF) — boshqaruv paneliga ulanadi
- B) Moliya alohida turadi, holatga ta'sir qilmaydi — soddaroq
- C) Keyin

### Q100. Telegram ShVB komandasi: /zvs_status
**Nima:** Mas'ul Telegramda buyruq yuborib (masalan /zvs_status) joriy ariza/to'lov holatini olishi.
**Nega kerak:** Egasi/boshliq ERP ochmasdan, telefondan tez holatni ko'radi.
**Variantlar:**
- A) Asosiy buyruqlar (/zvs_status, /company_state, /weekly_digest) — qulay tezkor kirish
- B) Faqat ERP ichida, Telegramsiz — bir joyda, lekin sekinroq
- C) Keyin

### Q101. ZVS/ZNO statuslari ro'yxati (master-data)
**Nima:** Ariza qaysi holatlardan o'tishi: Yangi → Bo'lim tasdig'i → Kengash → Direktor → To'langan → Rad etilgan (yoki boshqacha).
**Nega kerak:** Aniq holat zinapoyasi bo'lsa, har kim arizaning qayerdaligini biladi.
**Variantlar:**
- A) To'liq 6 holatli oqim (rad etish + qaytarish bilan) — har bosqich ko'rinadi
- B) Sodda 3 holat (Yangi / Tasdiqlangan / To'langan) — yengil, lekin kam ma'lumot
- C) Keyin

### Q102. Moliya rollarini kim-nima-qiladi (master-data)
**Nima:** Kassir, moliya boshlig'i, kengash a'zosi, direktor — har biri nima ko'radi va nima tasdiqlay oladi.
**Nega kerak:** Pul moduli — huquqlar aniq bo'lmasa, noto'g'ri odam to'lov tasdiqlab qo'yadi.
**Variantlar:**
- A) Har rolga aniq huquq (kassir kiritadi, boshliq tekshiradi, direktor tasdiqlaydi) — vazifa bo'linadi (SoD)
- B) Bitta "moliyachi" hammasini qiladi — sodda, lekin xavfli (nazoratsiz)
- C) Keyin

### Q103. Hisobotlar to'plami
**Nima:** Modul qaysi hisobotlarni bersin: kunlik kassa, haftalik FP-yopilish, oylik foyda-zarar, aging.
**Nega kerak:** Egasi qaror uchun raqamni tayyor holда ko'rishi kerak, qo'lda hisoblamasligi uchun.
**Variantlar:**
- A) To'liq to'plam (kunlik kassa + haftalik FP + oylik P&L + aging) + PDF eksport — boshqaruvga to'liq
- B) Faqat kassa qoldig'i va aging — minimal
- C) Keyin

### Q104. Karta-model bilan integratsiya: moliyaviy mas'uliyat kartaga
**Nima:** Byudjet, ZVS limiti va to'lov mas'uliyati org-kartaga (lavozimga) biriktirilsinmi.
**Nega kerak:** Karta-model bo'yicha — har karta o'z byudjet/limitini biladi, odam almashsa ham qoladi.
**Variantlar:**
- A) Har kartaga byudjet limiti + tasdiqlash huquqi biriktiriladi — karta-modelga to'liq mos
- B) Limit faqat bo'limga, kartaga emas — qo'polroq, lekin oddiy
- C) Keyin

---

## 4. Coordination

### Q105. 5 kengash ro'yxati (master-data)
**Nima:** Tizimda 5 ta kengash — Asoschilar kengashi, Ijroiya kengashi, Tavsiya kengashi (Rek.Sovet), Qomita (komitet), O'rinbosarlar kengashi — bitta rasmiy ro'yxat sifatida saqlanadi.
**Nega kerak:** Hozir kengashlar kodda qotirib qo'yilgan (hardcode). Ro'yxat alohida saqlansa, har kengashning a'zolari, vakolati va yig'ilish kuni boshqarib boriladi.
**Variantlar:**
- A) Beshtasi ham jadvalga yoziladi (har biri nomi, turi, tavsifi, faolligi bilan) — to'liq boshqariladi, yangi kengash qo'shsa bo'ladi
- B) Faqat 5 ta nom qotirib qoladi, qo'shimcha ma'lumotsiz — tez, lekin kengayib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q106. Kengash a'zoligi va rollar
**Nima:** Har kengashga qaysi xodimlar a'zo ekani va ulardan kim raisi, kim kotibi ekanini belgilash.
**Nega kerak:** Doklad kimga boradi, protokolni kim imzolaydi, sessiyada kim qaror beradi — bularning hammasi a'zolik ro'yxatiga bog'liq.
**Variantlar:**
- A) Har kengashga a'zo + rol (rais/kotib/a'zo) biriktiriladi — aniq mas'uliyat, avtomatik yo'naltirish
- B) Faqat a'zolar ro'yxati, rolsiz — oddiy, lekin imzo/kotib qo'lda tanlanadi
- C) Keyin — hozir kerak emas

### Q107. Kengash a'zoligini karta-model bilan bog'lash
**Nima:** Kengash a'zoligi xodimga emas, uning lavozim kartasiga (org-karta) bog'lanadi.
**Nega kerak:** Sizning vizyoningizda karta asosiy, xodim ikkilamchi. Xodim ketsa, kartaga yangi odam kelsa — kengash a'zoligi avtomatik yangi odamga o'tadi, qo'lda o'zgartirish kerak bo'lmaydi.
**Variantlar:**
- A) A'zolik lavozim kartasiga bog'lanadi (kim shu kartada bo'lsa, o'sha a'zo) — karta-modelga to'liq mos
- B) A'zolik to'g'ridan-to'g'ri xodimga bog'lanadi — oddiy, lekin xodim almashganda qo'lda yangilash kerak
- C) Keyin — hozir kerak emas

### Q108. Doklad shakli (ShVB blank: Mavzu / Muammo / Natija / Taklif)
**Nima:** Doklad yozish shaklida ShVB standart maydonlari — Mavzu, Muammo, Natija (holat), Taklif — alohida bo'lib qoladimi yoki bitta erkin matn bo'ladimi.
**Nega kerak:** ShVB blankida bu 4 qism majburiy. Alohida maydonlar bo'lsa, dokladlar bir xil tuzilishda bo'ladi va tahlil qilish oson.
**Variantlar:**
- A) 4 maydon alohida (Mavzu/Muammo/Natija/Taklif) — ShVB blankiga aynan mos, tartibli
- B) Bitta erkin matn maydoni — yozish oson, lekin tuzilish yo'q
- C) Keyin — hozir kerak emas

### Q109. Doklad holatlari oqimi (status)
**Nima:** Doklad qaysi bosqichlardan o'tadi — yuborildi → o'qildi → hal qilindi → arxivlandi.
**Nega kerak:** Yuboruvchi dokladi o'qilganmi, hal qilinganmi — kuzata olishi kerak. Hozir bu oqim qisman bor.
**Variantlar:**
- A) To'liq oqim: Yuborildi → O'qildi → Hal qilindi → Arxiv — har bosqich vaqti bilan kuzatiladi
- B) Oddiy oqim: Ochiq → Yopiq — kam tafsilot, tez
- C) Keyin — hozir kerak emas

### Q110. Dokladni kengash darajasiga yo'naltirish
**Nima:** Doklad yuborilganda qaysi kengashga (5 tadan biriga) yoki to'g'ridan-to'g'ri rahbarga borishini tanlash.
**Nega kerak:** Masala kichik bo'lsa bo'lim boshlig'iga, katta bo'lsa Rek.Sovet yoki Ijroiya kengashiga ketishi kerak. To'g'ri manzil — tez yechim.
**Variantlar:**
- A) Yuboruvchi kengash darajasini tanlaydi, tizim a'zolarga yetkazadi — moslashuvchan
- B) Doklad har doim to'g'ridan-to'g'ri bitta rahbarga boradi — oddiy, lekin kengash mantiqi yo'q
- C) Keyin — hozir kerak emas

### Q111. Doklad yuborilganda bildirishnoma
**Nima:** Doklad yuborilganda qabul qiluvchiga (yoki kengash a'zolariga) xabar yetib borishi.
**Nega kerak:** Doklad tizimda yotib qolmasligi uchun qabul qiluvchi darrov bilishi kerak. ShVB da operativlik muhim.
**Variantlar:**
- A) Telegram + ilova ichida bildirishnoma — eng tez, ShVB Telegram kanaliga mos
- B) Faqat ilova ichida bildirishnoma — yetarli, lekin xodim ilovani ochmasa ko'rmaydi
- C) Keyin — hozir kerak emas

### Q112. Rasporyajeniye (buyruq) muddati va ustuvorligi
**Nima:** Rasporyajeniye berishda bajarish muddati (deadline) va ustuvorlik darajasi (yuqori/o'rta/past) ko'rsatiladi.
**Nega kerak:** Muddatsiz topshiriq nazoratdan chiqadi. Muddat va ustuvorlik bo'lsa, kechikkanlarni ajratib ko'rsatish mumkin.
**Variantlar:**
- A) Muddat majburiy + ustuvorlik tanlanadi — to'liq nazorat
- B) Faqat muddat, ustuvorliksiz — yetarli
- C) Keyin — hozir kerak emas

### Q113. Kechikkan Rasporyajeniye avtomatik belgilash
**Nima:** Muddati o'tgan rasporyajeniyeni tizim har kuni avtomatik "kechikkan" deb belgilaydi va rahbarni ogohlantiradi.
**Nega kerak:** Bajarilmagan topshiriqlar ko'zdan qochmasligi kerak. Avtomatik belgilash — rahbar har birini qo'lda tekshirmaydi.
**Variantlar:**
- A) Avtomatik (har kuni tekshiradi) + rahbarga ogohlantirish — nazorat o'zi ishlaydi
- B) Qo'lda — rahbar o'zi ko'rib belgilaydi — qo'shimcha mehnat
- C) Keyin — hozir kerak emas

### Q114. Rasporyajeniyeni qabul qilish va bajarish tasdig'i
**Nima:** Topshiriq oluvchi uni "qabul qildim" deb tasdiqlaydi, bajargach "bajardim" deb belgilaydi (izoh bilan).
**Nega kerak:** Topshiriq ko'rilganmi, bajarilganmi — yuboruvchi aniq bilishi kerak. Mas'uliyat zanjiri tiklanadi.
**Variantlar:**
- A) Qabul qildi → bajardi (izoh bilan) — ikki bosqichli, to'liq aniqlik
- B) Faqat bajardi — bir bosqichli, oddiy
- C) Keyin — hozir kerak emas

### Q115. Majlis protokoli — YANGI funksiya (qo'shilsinmi?)
**Nima:** Kengash majlislarining bayonnomasi (protokoli) — kun tartibi, ishtirokchilar, qabul qilingan qarorlar — tizimda saqlanadi.
**Nega kerak:** Hozir protokol umuman yo'q (faqat menyu yorlig'i bor). Qarorlar yozib qo'yilmasa, keyin "nima kelishilgani" yo'qoladi.
**Variantlar:**
- A) To'liq protokol moduli qo'shiladi (kun tartibi + ishtirokchilar + qarorlar + keyingi majlis sanasi) — rasmiy hujjat aylanmasi
- B) Faqat oddiy izoh maydoni (majlisda nima bo'lgani matn sifatida) — tez, lekin tuzilishsiz
- C) Keyin — hozir kerak emas

### Q116. Protokol PDF eksporti
**Nima:** Tayyor protokolni rasmiy ko'rinishda PDF qilib yuklab olish (zavod sarlavhasi, sana, imzo joyi bilan).
**Nega kerak:** Protokol qog'oz hujjat sifatida ham kerak bo'ladi (arxiv, imzo, tashqi tomonlar). PDF — rasmiy nusxa.
**Variantlar:**
- A) Ha, PDF eksport (zavod blanki ko'rinishida) — rasmiy hujjat tayyor
- B) Faqat ekranda ko'rish, eksport yo'q — yetarli emas, lekin tez
- C) Keyin — hozir kerak emas

### Q117. Protokol qarorlaridan topshiriq (action item) yaratish
**Nima:** Protokoldagi har qaror uchun mas'ul shaxs va muddat belgilab, undan to'g'ridan-to'g'ri Rasporyajeniye yaratish.
**Nega kerak:** Majlisda kelishilgan ish bajarilishini ta'minlash uchun qaror darrov topshiriqqa aylanishi kerak — "gapirdik va unutdik" bo'lmasin.
**Variantlar:**
- A) Har qarordan avtomatik Rasporyajeniye yaratiladi (mas'ul + muddat bilan) — qaror amalga oshadi
- B) Qarorlar faqat protokolda yoziladi, topshiriq qo'lda — bog'lanish yo'q
- C) Keyin — hozir kerak emas

### Q118. Protokol arxivida qidirish
**Nima:** Barcha o'tgan protokollarni kengash turi va sana bo'yicha qidirib topish.
**Nega kerak:** "O'tgan yili Ijroiya kengashida byudjet haqida nima kelishgandik?" degan savolga tez javob topish kerak.
**Variantlar:**
- A) Kengash turi + sana + matn bo'yicha qidiruv — har qarorni topish oson
- B) Faqat ro'yxat (qidiruv yo'q) — kam protokol bo'lsa yetarli
- C) Keyin — hozir kerak emas

### Q119. Rek.Sovet (Tavsiya kengashi) sessiyasi — ZVS ko'rib chiqish
**Nima:** Rek.Sovet haftalik sessiyasida bir nechta ZVS (byudjet arizasi) yig'ib ko'rib chiqiladi va har biri bo'yicha qaror beriladi.
**Nega kerak:** ShVB da Seshanba kuni Rek.Sovet ZVS larni ko'rib chiqadi. Hozir sessiyaning hayot-tsikli (qaror jurnali) yo'q.
**Variantlar:**
- A) To'liq sessiya: sessiya ochiladi → ZVS lar qo'shiladi → har biriga qaror → sessiya yopiladi + hisobot — ShVB ga aynan mos
- B) Har ZVS alohida tasdiqlanadi, sessiya tushunchasisiz — oddiy, lekin yig'ilish mantiqi yo'q
- C) Keyin — hozir kerak emas

### Q120. Rek.Sovet qarori: to'liq / qisman / rad
**Nima:** Sessiyada har ZVS bo'yicha qaror — to'liq tasdiqlash, qisman tasdiqlash (kamroq summa) yoki rad etish.
**Nega kerak:** Ko'pincha ariza summasi kamaytirilib tasdiqlanadi. Qisman tasdiq imkoni bo'lmasa, kengash haqiqiy ishlay olmaydi.
**Variantlar:**
- A) Uch xil qaror: to'liq / qisman (summa bilan) / rad — real qaror jarayoniga mos
- B) Faqat tasdiq / rad — oddiy, lekin qisman holat yo'qoladi
- C) Keyin — hozir kerak emas

### Q121. Rek.Sovet sessiyasidan oldin eslatma
**Nima:** Sessiya kunidan oldin (masalan Seshanba ertalab) kengash a'zolariga "bugun sessiya, X ta ZVS kutmoqda" deb avtomatik eslatma.
**Nega kerak:** A'zolar sessiyaga tayyor kelishi va arizalar kechikmasligi uchun. ShVB tsikliga mos operativlik.
**Variantlar:**
- A) Avtomatik eslatma (Telegram + ilova) sessiya kuni ertalab — a'zolar tayyor
- B) Eslatmasiz, a'zolar o'zlari biladi — kechikish xavfi
- C) Keyin — hozir kerak emas

### Q122. Rek.Sovet sessiya hisoboti
**Nima:** Sessiya yopilgach avtomatik hisobot — nechta ariza ko'rildi, qancha tasdiqlandi, qancha rad etildi, umumiy summa.
**Nega kerak:** Egaga va moliyaga haftalik qaysi xarajatlar tasdiqlangani aniq ko'rinishi kerak.
**Variantlar:**
- A) Avtomatik hisobot (tasdiqlangan/rad/jami summa) + protokolga bog'lanadi — to'liq shaffoflik
- B) Faqat ro'yxat, hisobotsiz — qo'lda hisoblash kerak
- C) Keyin — hozir kerak emas

### Q123. Prikazlar registri — kategoriyalar (master-data)
**Nima:** Rasmiy prikazlar (buyruqlar) qaysi turlarga bo'linadi — HR (kadrlar), Moliya, Operatsion, Strategik va h.k.
**Nega kerak:** Prikazlarni turkumlash arxivda topishni osonlashtiradi va kim qaysi turdagi prikazni ko'ra olishini boshqaradi.
**Variantlar:**
- A) Tayyor kategoriyalar ro'yxati (HR / Moliya / Operatsion / Strategik / Umumiy) — tartibli, kengaytirsa bo'ladi
- B) Kategoriyasiz, hammasi bitta ro'yxatda — oddiy, lekin tartibsiz
- C) Keyin — hozir kerak emas

### Q124. Prikaz raqamlash (registr nomeri)
**Nima:** Har prikazga avtomatik tartib raqami beriladi (masalan yil + ketma-ket nomer: 2026-001, 2026-002).
**Nega kerak:** Rasmiy hujjatda raqam majburiy. Avtomatik raqamlash — takror yoki bo'sh raqam bo'lmaydi.
**Variantlar:**
- A) Avtomatik (yil + ketma-ket nomer) — rasmiy va xatosiz
- B) Qo'lda kiritiladi — moslashuvchan, lekin takror/xato xavfi
- C) Keyin — hozir kerak emas

### Q125. Prikaz kuchga kirish sanasi (effective date)
**Nima:** Prikaz qaysi sanadan boshlab kuchga kirishini alohida ko'rsatish (chiqarilgan sanadan farqli bo'lishi mumkin).
**Nega kerak:** Ba'zi buyruqlar kelajakdagi sanadan kuchga kiradi (masalan keyingi oydan yangi narx). Hozir bu maydon yetishmaydi.
**Variantlar:**
- A) Ha, kuchga kirish sanasi alohida maydon — rejalashtirilgan buyruqlar to'g'ri ishlaydi
- B) Faqat chiqarilgan sana, kuchga kirish = o'sha kun — oddiy, lekin kechiktirib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q126. Prikaz imzosi va imzolovchi
**Nima:** Prikaz kim tomonidan imzolanganini (egasi/direktor) yozib qo'yish va imzolanmaguncha "loyiha" holatida turishi.
**Nega kerak:** Imzosiz prikaz rasmiy emas. Imzo bosqichi bo'lsa, tayyorlanayotgan va kuchdagi prikazlar ajraladi.
**Variantlar:**
- A) Imzo bosqichi bor (Loyiha → Imzolandi → Kuchda) + imzolovchi yoziladi — rasmiy tartib
- B) Imzosiz, prikaz darrov kuchda — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q127. Prikaz imzosi turi (elektron/qo'lda)
**Nima:** Imzo qanday bo'ladi — tizim ichida tugma bilan elektron tasdiqlanadimi yoki qog'ozga qo'lda imzolanib skani biriktiriladimi.
**Nega kerak:** Imzo usulini hal qilish kerak — bu prikazning yuridik kuchini va ish jarayonini belgilaydi.
**Variantlar:**
- A) Tizim ichida elektron tasdiq (kim, qachon bosgani yoziladi) — tez, raqamli arxiv
- B) Qog'ozga imzo + skanni biriktirish — an'anaviy, lekin qo'shimcha qadam
- C) Keyin — hozir kerak emas

### Q128. Prikaz PDF va arxiv
**Nima:** Har prikazni rasmiy PDF qilib yuklab olish va doimiy arxivda saqlash.
**Nega kerak:** Prikazlar yuridik hujjat — yillar davomida saqlanishi va istalgan vaqt chiqarib olinishi kerak. Hozir arxiv qismi yetishmaydi.
**Variantlar:**
- A) PDF eksport + doimiy arxiv (qidiruv bilan) — to'liq hujjat boshqaruvi
- B) Faqat ro'yxatda saqlanadi, PDF/arxivsiz — yetarli emas
- C) Keyin — hozir kerak emas

### Q129. Prikaz xodimga yetkazish (tanishtirish)
**Nima:** Prikaz tegishli xodimlarga yuboriladi va ular "tanishdim" deb tasdiqlaydi.
**Nega kerak:** Xodim prikazni o'qiganini tasdiqlamasa, "men bilmadim" deyishi mumkin. Tanishish tasdig'i — mas'uliyatni mahkamlaydi.
**Variantlar:**
- A) Prikaz xodimlarga yuboriladi + "tanishdim" tasdig'i yig'iladi — to'liq nazorat
- B) Faqat e'lon qilinadi, tasdiq yig'ilmaydi — oddiy, lekin isbot yo'q
- C) Keyin — hozir kerak emas

### Q130. Koordinatsiya boshqaruv paneli (umumiy ko'rinish)
**Nima:** Bitta sahifada — ochiq dokladlar, kutilayotgan rasporyajeniyelar, yaqin majlislar, kuchdagi prikazlar soni — yagona ko'rinishda.
**Nega kerak:** Rahbar bitta joydan butun koordinatsiya holatini ko'rishi kerak, har bo'limni alohida ochmasdan.
**Variantlar:**
- A) Yagona panel (5 ko'rsatkich + ochiqlari ro'yxati) — tezkor nazorat
- B) Har bo'lim alohida sahifada — soddaroq, lekin umumiy manzara yo'q
- C) Keyin — hozir kerak emas

### Q131. Eskalatsiya: bajarilmagan masalani yuqoriga ko'tarish
**Nima:** Doklad yoki rasporyajeniye belgilangan muddatda yopilmasa, avtomatik yuqori kengashga yoki rahbarga ko'tariladi.
**Nega kerak:** Masala bir joyda qotib qolmasligi kerak. ShVB da hal bo'lmagan masala yuqoriga chiqishi — boshqaruv printsipi.
**Variantlar:**
- A) Avtomatik eskalatsiya (org-tuzilma bo'yicha yuqoriga) — masala o'zi ko'tariladi
- B) Qo'lda eskalatsiya (rahbar o'zi ko'taradi) — nazorat ostida, lekin kechikadi
- C) Keyin — hozir kerak emas

### Q132. Org-tuzilma bilan yo'naltirish (vertikal zanjir)
**Nima:** Doklad/rasporyajeniye/eskalatsiya org-tuzilmadagi to'g'ri yuqori darajaga (Vysotskiy 7-otdeleniye zanjiri bo'yicha) yo'naladi.
**Nega kerak:** Sizning org-modelingizda har xodimning "keyingi yuqori darajasi" aniq. Koordinatsiya hujjatlari shu zanjir bo'yicha yursa, to'g'ri odamga boradi.
**Variantlar:**
- A) Org-tuzilma zanjiri bo'yicha avtomatik yo'naltirish — vizyonga to'liq mos
- B) Yuboruvchi har safar qo'lda manzilni tanlaydi — moslashuvchan, lekin xato xavfi
- C) Keyin — hozir kerak emas

### Q133. Telegram orqali koordinatsiya buyruqlari
**Nima:** Xodim Telegram botda "mening topshiriqlarim", "ochiq dokladlarim" kabi buyruqlar bilan koordinatsiya holatini ko'radi va tezkor javob beradi.
**Nega kerak:** Hamma kompyuter oldida o'tirmaydi. ShVB da Telegram asosiy kanal — operativlikni oshiradi.
**Variantlar:**
- A) Telegram buyruqlari (topshiriqlarim / dokladlarim / bajardim) — eng tezkor
- B) Faqat ilova ichida, Telegram orqali boshqaruv yo'q — kompyuter kerak
- C) Keyin — hozir kerak emas

### Q134. Karta-model: kengash hisoboti AI bilan
**Nima:** Har kengash/lavozim kartasiga biriktirilgan AI dokladlar va rasporyajeniyelar bo'yicha hisobot tayyorlaydi (kim ko'p kechiktiradi, qaysi masala takrorlanadi).
**Nega kerak:** Sizning vizyoningizda har kartaning o'z AI'si bor. Koordinatsiya ma'lumotlari ham shu AI tahliliga kirib, kartaga oid xulosa berishi mumkin.
**Variantlar:**
- A) Karta AI'si koordinatsiya hisobotini ham tahlil qiladi — vizyonga mos, chuqur tahlil
- B) Oddiy raqamli statistika (AI siz) — yetarli, lekin xulosasiz
- C) Keyin — hozir kerak emas

---

## 5. Director / Strategiya

### Q135. Kompaniya holat formulasi — qanday hisoblansin
**Nima:** Kompaniyaning umumiy holatini bitta so'z bilan ko'rsatuvchi formula (OSISH / NORMAL / EHTIYOT / XAVF / INQIROZ).
**Nega kerak:** Boshliq ertalab bitta belgiga qarab kompaniya sog'lig'ini bilib oladi — pul, ishlab chiqarish, xodim, mijoz ko'rsatkichlari bir joyga yig'iladi.
**Variantlar:**
- A) To'liq formula — pul oqimi + ishlab chiqarish + buyurtma + xodim + sifat 5 ko'rsatkich birga hisoblanadi (haqiqiy holatni ko'rsatadi)
- B) Faqat moliya — pul qoldig'i va to'lovlar asosida (sodda, lekin yarim manzara)
- C) Keyin — hozir kerak emas

### Q136. Holat chegaralari (ostona qiymatlar)
**Nima:** Qaysi raqamda holat "NORMAL"dan "EHTIYOT"ga yoki "XAVF"ga o'tishini belgilovchi chegaralar.
**Nega kerak:** Formula ishlashi uchun "qachon signal beradi" aniq bo'lishi kerak — masalan pul oqimi necha kunlik bo'lsa XAVF.
**Variantlar:**
- A) Boshliq o'zi belgilaydi — har ko'rsatkich uchun chegaralarni siz kiritasiz (sizning biznesingizga moslashadi)
- B) Tizim standart chegara qo'yadi — keyin tuzatasiz (tez boshlanadi)
- C) Keyin — hozir kerak emas

### Q137. Holatni kunlik avtomatik hisoblash (cron)
**Nima:** Har kuni belgilangan vaqtda tizim holatni o'zi qayta hisoblab, yangilab qo'yishi.
**Nega kerak:** Boshliq tugma bosmasdan, har ertalab yangi holatni tayyor ko'radi.
**Variantlar:**
- A) Har kuni ertalab avtomatik (masalan 07:00) — siz kelganda tayyor turadi
- B) Faqat siz ochganda hisoblansin — server kamroq ishlaydi, lekin biroz kechikadi
- C) Keyin — hozir kerak emas

### Q138. Holat tarixini saqlash
**Nima:** Har kungi holatni saqlab borib, vaqt o'tishi bilan grafikda ko'rsatish.
**Nega kerak:** "Oxirgi oyda kompaniya yaxshilanyaptimi yoki yomonlashyaptimi" degan savolga grafik bilan javob beradi.
**Variantlar:**
- A) Har kuni saqlanadi + grafik (trend ko'rinadi — eng foydali)
- B) Faqat hozirgi holat saqlanadi, tarix yo'q (sodda, lekin trend ko'rinmaydi)
- C) Keyin — hozir kerak emas

### Q139. Holat yomonlashganda ogohlantirish (alert)
**Nima:** Holat XAVF yoki INQIROZ darajasiga tushganda boshliqqa darhol xabar yuborilishi.
**Nega kerak:** Yomon belgini o'tkazib yubormaslik — muammo katta bo'lishidan oldin boshliq biladi.
**Variantlar:**
- A) Telegram + tizim ichida darhol xabar (boshliq qayerda bo'lsa ham ko'radi)
- B) Faqat tizim ichida belgilanadi (ochganda ko'radi)
- C) Keyin — hozir kerak emas

### Q140. Holat alertini kim oladi
**Nima:** XAVF signalini faqat boshliqmi yoki tegishli bo'lim rahbarlari hammasimi olishi.
**Nega kerak:** Signal noto'g'ri odamga borsa — yo e'tibordan chetda qoladi, yo hammaga panika.
**Variantlar:**
- A) Boshliq + sababchi bo'lim rahbari (masalan pul muammosi → moliyachi ham oladi)
- B) Faqat boshliq (boshqalarni o'zi xabardor qiladi)
- C) Keyin — hozir kerak emas

### Q141. Bajarish kundaligi (Dnevnik) — bo'lishi kerakmi
**Nima:** Boshliqning har kuni qisqa yozadigan kundaligi: bugungi holat, KPI, muammo, yechim, ertangi reja.
**Nega kerak:** ShVB metodi — boshliq fikrini tartibga soladi, har kuni nima qilinganini eslab qoladi, vaqt o'tib tahlil qilinadi.
**Variantlar:**
- A) Ha, to'liq kundalik — 5 bo'lim (holat / KPI / muammo / yechim / ertangi reja) har kuni to'ldiriladi
- B) Soddalashtirilgan — faqat "bugun nima bo'ldi + ertangi reja" 2 bo'lim
- C) Keyin — hozir kerak emas

### Q142. Kundalik kim uchun — faqat boshliqmi yoki bo'lim rahbarlari ham
**Nima:** Bajarish kundaligini faqat boshliq yuritadimi yoki har bo'lim rahbari o'ziniki yuritadimi.
**Nega kerak:** Agar har rahbar yozsa — boshliq pastdan to'liq manzara oladi; faqat boshliq yozsa — sodda lekin tor.
**Variantlar:**
- A) Boshliq + har bo'lim rahbari o'z kundaligini yozadi (boshliq hammasini ko'radi)
- B) Faqat boshliq yuritadi (sodda)
- C) Keyin — hozir kerak emas

### Q143. Kundalikni avtomatik to'ldirish
**Nima:** Kundalikning holat va KPI qismini tizim avtomatik to'ldirib qo'yishi, boshliq faqat muammo/yechim/reja yozishi.
**Nega kerak:** Boshliq raqamlarni qo'lda yozmaydi — tizim biladigan narsani o'zi qo'yadi, vaqt tejaladi.
**Variantlar:**
- A) Holat + KPI avtomatik to'ladi, boshliq faqat fikr/reja yozadi (eng qulay)
- B) Hammasini boshliq qo'lda yozadi (sodda, lekin ko'p vaqt)
- C) Keyin — hozir kerak emas

### Q144. Kundalikda hal qilinmagan muammolarni kuzatish
**Nima:** Kechagi yozilgan muammo hali yechilmagan bo'lsa, uni ertaga ham ko'rsatib turish.
**Nega kerak:** Muammo unutilib ketmasin — yechilmaguncha har kun ko'rinib turadi.
**Variantlar:**
- A) Ha, yechilmagan muammo "ochiq" deb keyingi kunga o'tadi (hech narsa yo'qolmaydi)
- B) Yo'q, har kun yangidan boshlanadi (sodda)
- C) Keyin — hozir kerak emas

### Q145. Ideal kartina (Ideal Rasm) — maqsad ko'rsatkichlari
**Nima:** Kompaniyaning maqsad raqamlari: kerakli foyda, daromad, filiallar soni, xodimlar soni — "qayerga borishimiz kerak".
**Nega kerak:** Maqsadsiz harakat yo'q — ideal kartina bo'lsa, har kun unga qancha yetganini o'lchash mumkin.
**Variantlar:**
- A) To'liq ideal kartina — foyda + daromad + filial + xodim + boshqa maqsadlar (keng manzara)
- B) Faqat moliya maqsadlari — foyda va daromad (sodda boshlash)
- C) Keyin — hozir kerak emas

### Q146. Ideal vs haqiqat farqini (gap) ko'rsatish
**Nima:** Har maqsad bo'yicha "maqsad qancha — hozir qancha — farqi qancha" ni yonma-yon ko'rsatish.
**Nega kerak:** Boshliq darrov ko'radi qaysi maqsaddan ortda qolyapti va qancha qolgan.
**Variantlar:**
- A) Ha, har maqsad uchun maqsad/haqiqat/farq + bajarilish foizi (aniq ko'rinish)
- B) Faqat bajarilish foizi (sodda)
- C) Keyin — hozir kerak emas

### Q147. Ideal kartinaning haqiqiy raqamlari qayerdan olinsin
**Nima:** "Hozir qancha" degan haqiqiy raqam qo'lda kiritiladimi yoki tizimdan (moliya, HR) avtomatik olinadimi.
**Nega kerak:** Avtomatik bo'lsa — har doim yangi va ishonchli; qo'lda bo'lsa — eski/xato bo'lishi mumkin.
**Variantlar:**
- A) Avtomatik — foyda moliyadan, xodimlar soni HR dan o'zi tortiladi (har doim to'g'ri)
- B) Qo'lda kiritiladi (sodda, lekin yangilab turish kerak)
- C) Keyin — hozir kerak emas

### Q148. Ideal kartina versiyalari (yil bo'yicha)
**Nima:** Har yil yangi ideal kartina belgilab, eskisini saqlab qo'yish (2025 maqsad, 2026 maqsad alohida).
**Nega kerak:** Maqsadlar yildan-yilga o'sadi — eskisi saqlansa, "o'tgan yil rejani bajardikmi" deb solishtirish mumkin.
**Variantlar:**
- A) Ha, har yil/davr uchun alohida versiya saqlanadi (tarix qoladi)
- B) Faqat bitta joriy kartina (sodda, lekin eskisi yo'qoladi)
- C) Keyin — hozir kerak emas

### Q149. Strategik reja (OKR) — maqsad va natija strukturasi
**Nima:** Kompaniyaning katta strategik maqsadlari (Objective) va ularning o'lchanadigan natijalari (Key Results).
**Nega kerak:** Yillik katta maqsadni aniq o'lchanadigan natijalarga bo'lish — har kim qayerga harakat qilishini biladi.
**Variantlar:**
- A) Maqsad → o'lchanadigan natijalar (klassik OKR) — har natija foiz bilan kuzatiladi
- B) Faqat maqsadlar ro'yxati (sodda, lekin o'lchov yo'q)
- C) Keyin — hozir kerak emas (OKR allaqachon qisman bor)

### Q150. OKR qaysi darajalarda bo'lsin
**Nima:** OKR faqat kompaniya darajasidami yoki bo'lim va karta (lavozim) darajasiga ham tushadimi.
**Nega kerak:** Agar pastga tushsa — har lavozim katta maqsadga qanday hissa qo'shishini ko'radi (karta-model bilan bog'lanadi).
**Variantlar:**
- A) Kompaniya → bo'lim → karta (lavozim) — har daraja yuqorisiga ulanadi (oltin ip)
- B) Faqat kompaniya darajasi (sodda boshlash)
- C) Keyin — hozir kerak emas

### Q151. Taktik reja — strategiyadan oylik rejaga o'tish
**Nima:** Yillik strategik rejani oylik aniq vazifalarga ajratish (strategiya → bu oy nima qilinadi).
**Nega kerak:** Katta reja faqat qog'ozda qolmasin — har oy uchun aniq qadamlar bo'lsa, harakat boshlanadi.
**Variantlar:**
- A) Ha, strategiya → oylik taktik vazifalar (har oy nima qilinishi aniq)
- B) Faqat yillik strategiya qoladi, oylik bo'lim yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q152. Oylikdan haftalikga dekompozitsiya
**Nima:** Oylik taktik vazifalarni hafta-hafta bo'lib, har hafta nima qilinishini ko'rsatish.
**Nega kerak:** ShVB metodi — katta vazifa haftalik bo'lakka bo'linsa, har hafta natija ko'rinadi va orqada qolish darrov sezilad.
**Variantlar:**
- A) Ha, oylik → haftalik bo'lib beriladi (har hafta aniq topshiriq)
- B) Faqat oylik daraja qoladi (sodda)
- C) Keyin — hozir kerak emas

### Q153. Taktik vazifa kim bilan bog'lansin
**Nima:** Har taktik vazifa qaysi karta (lavozim) yoki bo'limga biriktirilishi.
**Nega kerak:** Vazifa "egasiz" qolmasin — kim mas'ul ekani aniq bo'lsa, bajariladi va kuzatiladi.
**Variantlar:**
- A) Har vazifa kartaga (lavozimga) biriktiriladi — bajaruvchi va kuzatuv aniq
- B) Faqat bo'limga biriktiriladi (kengroq, lekin shaxsiy mas'uliyat yumshoq)
- C) Keyin — hozir kerak emas

### Q154. Statistika reglamenti (Stat-reglament) — bo'lishi kerakmi
**Nima:** Har bir ko'rsatkichning rasmiy ta'rifini bitta joyda saqlovchi ro'yxat: tarif (ta'rif), formula, o'lchov birligi, qanchalik tez o'lchanadi, kim mas'ul.
**Nega kerak:** Hozir tizimda bu YO'Q. Busiz har kim raqamni har xil tushunadi — "bajarilish" deganda kim nimani nazarda tutadi noma'lum. Reglament bo'lsa — bitta haqiqat.
**Variantlar:**
- A) Ha, to'liq stat-reglament — har ko'rsatkich uchun ta'rif/formula/birlik/chastota/egasi (chalkashlik yo'qoladi)
- B) Soddalashtirilgan — faqat ta'rif va formula (asosiy, lekin chala)
- C) Keyin — hozir kerak emas

### Q155. Stat-reglamentda chastota (qanchalik tez o'lchanadi)
**Nima:** Har ko'rsatkich kunlik, haftalik yoki oylik o'lchanishini belgilash.
**Nega kerak:** Ba'zi raqamlar har kun (pul), ba'zilari oyda bir (foyda) o'lchanadi — bu aniq bo'lsa, tizim qachon yangilashni biladi.
**Variantlar:**
- A) Har ko'rsatkichga alohida chastota belgilanadi (kunlik/haftalik/oylik) — moslashuvchan
- B) Hammasi haftalik o'lchanadi (sodda, lekin qo'pol)
- C) Keyin — hozir kerak emas

### Q156. Stat-reglament versiyalari
**Nima:** Ko'rsatkich formulasi o'zgarsa, eski versiyani saqlab, "qachondan boshlab yangi formula" ekanini belgilash.
**Nega kerak:** Formula o'zgarganda eski hisobotlar buzilmasin — qaysi davrda qaysi formula ishlaganini bilish kerak.
**Variantlar:**
- A) Ha, har o'zgarish yangi versiya bo'ladi + amal qilish sanasi (eski hisobot to'g'ri qoladi)
- B) Faqat oxirgi formula saqlanadi (sodda, lekin tarix yo'qoladi)
- C) Keyin — hozir kerak emas

### Q157. Stat-reglament ko'rsatkichlarining egasi (mas'uli)
**Nima:** Har ko'rsatkich uchun "bu raqamning to'g'riligiga kim javob beradi" ni belgilash — odam yoki karta (lavozim).
**Nega kerak:** Raqam noto'g'ri bo'lsa, kim tuzatishini biladi — egasiz raqam ishonchsiz.
**Variantlar:**
- A) Har ko'rsatkich kartaga (lavozimga) biriktiriladi — odam ketsa ham egasi qoladi (karta-model)
- B) Aniq xodimga biriktiriladi (sodda, lekin xodim ketsa egasi yo'qoladi)
- C) Keyin — hozir kerak emas

### Q158. Holat formulasi karta-model bilan bog'lansinmi
**Nima:** Kompaniya holatini hisoblashda har bo'lim/kartaning o'z holati (KPI bajarilishi) hissa qo'shishi.
**Nega kerak:** Karta-model — sizning asosiy vizyoningiz. Holat pastdan (kartalardan) yig'ilsa, qaysi lavozim kompaniyani pasaytirayotgani ko'rinadi.
**Variantlar:**
- A) Ha, holat kartalardan yig'iladi — "qaysi lavozim sabab" darrov ochiladi (oltin ip)
- B) Yo'q, holat faqat umumiy raqamlardan (sodda, lekin sababi ko'rinmaydi)
- C) Keyin — hozir kerak emas

### Q159. Director dashboard — boshliq ekranida nima ko'rinadi
**Nima:** Boshliq tizimga kirganda birinchi ko'radigan ekranda qaysi ma'lumotlar bo'lishi.
**Nega kerak:** Boshliqning vaqti qimmat — eng muhim 4-5 narsa bir ekranda bo'lsa, qolganini qidirmasdan qaror qabul qiladi.
**Variantlar:**
- A) Holat + ideal kartina farqi + bugungi muammolar + alertlar bir ekranda (to'liq qo'mondonlik markazi)
- B) Faqat holat va asosiy moliya raqamlari (sodda)
- C) Keyin — hozir kerak emas

### Q160. Strategik AI tahlilchi
**Nima:** Tizim ma'lumotlarni o'qib, boshliqqa o'zbek tilida tahlil va tavsiya beruvchi AI ("pul oqimi 3 hafta ichida XAVFga tushishi mumkin, sababi...").
**Nega kerak:** Raqamlarni o'qish vaqt oladi — AI darrov "nimaga e'tibor bering" deb aytsa, boshliq tez harakat qiladi.
**Variantlar:**
- A) Ha, AI har kuni qisqa tahlil + 1-2 tavsiya beradi (boshliqning maslahatchisi)
- B) AI faqat so'ralganda javob beradi (sodda)
- C) Keyin — hozir kerak emas

### Q161. Holat va kundalik Telegram bot orqali
**Nima:** Boshliq Telegramda buyruq yozib (masalan /holat, /kundalik) kompaniya holatini va kundalikni ko'rishi/to'ldirishi.
**Nega kerak:** Boshliq har doim kompyuter oldida bo'lmaydi — telefondan Telegram orqali tez qaraydi.
**Variantlar:**
- A) Ha, /holat /kundalik /ideal_rasm buyruqlari + kunlik digest (telefondan hammasi)
- B) Faqat eslatma/digest yuboriladi, buyruq yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q162. Kunlik boshliq digesti (ertalabki xulosa)
**Nima:** Har ertalab boshliqqa bitta qisqa xabar: bugungi holat, kechagi yopilmagan muammolar, bugungi top vazifalar.
**Nega kerak:** Boshliq kunni tayyor manzara bilan boshlaydi — hech narsa qidirib o'tirmaydi.
**Variantlar:**
- A) Ha, har ertalab avtomatik digest (Telegram + tizim) — kun tayyor boshlanadi
- B) Faqat tizim ichida ko'rinadi, alohida xabar yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q163. Holat darajalari ro'yxatini sozlash (master-data)
**Nima:** Holat nomlari va ranglarini (OSISH=yashil, NORMAL=ko'k, EHTIYOT=sariq, XAVF=to'q sariq, INQIROZ=qizil) belgilash.
**Nega kerak:** Boshliq tushunadigan til va ranglar bo'lsa — bir qarashda holat aniq.
**Variantlar:**
- A) 5 daraja + rang (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) — ShVB modeliga mos
- B) 3 daraja (Yaxshi/O'rta/Yomon) — soddaroq
- C) Keyin — hozir kerak emas

### Q164. Strategiya yutuqlarini umumiy ko'rsatish
**Nima:** Strategik maqsad bajarilganda yoki muhim natijaga yetilganda buni alohida belgilab, hammaga ko'rsatish.
**Nega kerak:** Yutuqni nishonlash jamoani rag'batlantiradi va "biz qayerga yetdik" tarixini saqlaydi.
**Variantlar:**
- A) Ha, yetilgan maqsadlar "bajarildi" deb belgilanadi + tarix saqlanadi (motivatsiya + tarix)
- B) Faqat foiz ko'rsatiladi, alohida nishonlash yo'q (sodda)
- C) Keyin — hozir kerak emas

---

## 6. SD / Sotuv

### Q165. Sotuv "oltin-ip" boshlanish nuqtasi (hop 1/7)
**Nima:** Mijozdan kelgan so'rov → buyurtma → kotirovka → yetkazish → to'lov zanjiri qayerdan rasman boshlanadi.
**Nega kerak:** Oltin-ip butun zavod bo'ylab bitta buyurtmani kuzatadi; boshi noaniq bo'lsa, statistika ham, javobgarlik ham yo'qoladi.
**Variantlar:**
- A) Har sotuv mijoz so'rovidan (lead) boshlanadi va shu lead butun zanjirga bog'lanadi — to'liq kuzatuv, har bosqich kim qildi ko'rinadi.
- B) Faqat tasdiqlangan buyurtmadan boshlanadi, so'rov bosqichi alohida emas — soddaroq, lekin yo'qotilgan mijozlar ko'rinmaydi.
- C) Keyin — hozir kerak emas.

### Q166. Buyurtma holatlari (statuslar) ro'yxati
**Nima:** Buyurtma qaysi bosqichlardan o'tishi (masalan: yangi → kotirovka → tasdiqlangan → ishlab chiqarishda → yetkazilgan → to'langan → yopilgan).
**Nega kerak:** Statuslar bir xil bo'lmasa, har menejer o'zicha yuritadi va hisobot taqqoslanmaydi.
**Variantlar:**
- A) To'liq 7 bosqichli oltin-ip holatlari (yangi/kotirovka/tasdiq/ishlab chiqarish/yetkazish/to'lov/yopildi) — zavod oqimiga mos.
- B) Qisqa 4 holat (yangi/tasdiq/yetkazildi/to'landi) — sodda, lekin ishlab chiqarish ko'rinmaydi.
- C) Keyin — hozir kerak emas.

### Q167. Kotirovka (narx taklifi) rasmiy hujjat sifatida
**Nima:** Mijozga yuboriladigan narx taklifi tizimda alohida hujjat bo'ladimi yoki shunchaki buyurtma ichidagi raqammi.
**Nega kerak:** Karton narxi material/tirajga qarab o'zgaradi; rasmiy kotirovka bo'lmasa, "kim qancha va'da qilgan" tortishuvlari chiqadi.
**Variantlar:**
- A) Alohida kotirovka hujjati — versiyalanadi, PDF chiqadi, mijoz tasdig'i belgilanadi va buyurtmaga avtomatik aylanadi.
- B) Buyurtma ichidagi oddiy narx maydoni — versiya/tarix yo'q.
- C) Keyin — hozir kerak emas.

### Q168. Kotirovka tasdiqlash kim orqali o'tadi
**Nima:** Kotirovkani mijozga yuborishdan oldin ichki tasdiq kerakmi (masalan chegirma yoki narx pastligi sababli).
**Nega kerak:** Menejer zarar bilan sotib qo'ymasligi uchun; ShVB tasdiqlash matritsasi mantig'iga mos.
**Variantlar:**
- A) Narx/chegirma chegaradan oshsa — rahbar kartasi tasdig'i shart, aks holda menejer o'zi yuboradi — nazorat + tezlik.
- B) Har bir kotirovka rahbar tasdig'idan o'tadi — to'liq nazorat, lekin sekin.
- C) Hech qanday tasdiq yo'q, menejer mustaqil — tez, lekin nazoratsiz.
- D) Keyin — hozir kerak emas.

### Q169. Narx kelib chiqishi (narxlash manbasi)
**Nima:** Buyurtma narxi qaydan olinadi — qo'lda kiritiladimi yoki material+ishlab chiqarish tannarxidan hisoblanadimi.
**Nega kerak:** Karton/qadoqlashda narx tirajga, qog'oz turiga, bo'yoqqa bog'liq; qo'lda kiritish xato va zararni yashiradi.
**Variantlar:**
- A) Tizim tannarxni (material+operatsiya) hisoblab, ustiga ustama qo'shadi va tavsiya narx beradi; menejer to'g'rilashi mumkin — aniq + moslashuvchan.
- B) Narxlar jadvali (mahsulot turi bo'yicha standart narx) — sodda, lekin tirajga moslashmaydi.
- C) Har safar menejer qo'lda kiritadi — eng moslashuvchan, lekin nazoratsiz.
- D) Keyin — hozir kerak emas.

### Q170. Chegirma chegaralari va ruxsati
**Nima:** Menejer mijozga qancha chegirma bera olishi va undan oshsa kim ruxsat berishi.
**Nega kerak:** Chegirma cheksiz bo'lsa, foyda yo'qoladi; karta-model RBAC bilan "kim qancha chegirma bera oladi" bog'lanadi.
**Variantlar:**
- A) Chegirma chegarasi menejer kartasiga (razryad/lavozim) bog'lanadi; chegaradan oshsa rahbar tasdig'i — adolatli + nazoratli.
- B) Hamma uchun bitta umumiy chegirma chegarasi — sodda, lekin tajribali menejer ham, yangi ham teng.
- C) Chegirma erkin, faqat hisobotda ko'rinadi — tez, lekin nazoratsiz.
- D) Keyin — hozir kerak emas.

### Q171. Mijoz reytingi (toifalash) tizimi
**Nima:** Mijozlarni A/B/C kabi toifalarga ajratish (xarid hajmi, to'lov intizomi, takroriy buyurtma bo'yicha).
**Nega kerak:** Eng yaxshi mijozlarga e'tibor, qarzdorga ehtiyot; menejer kimga ko'proq vaqt sarflashni biladi.
**Variantlar:**
- A) Avtomatik A/B/C toifa — hajm + to'lov intizomi + takroriylik bo'yicha tizim hisoblaydi va belgini ko'rsatadi — xolis.
- B) Toifani menejer/rahbar qo'lda belgilaydi — moslashuvchan, lekin sub'ektiv.
- C) Toifalash yo'q, hamma mijoz teng — sodda.
- D) Keyin — hozir kerak emas.

### Q172. Mijoz reytingi qaysi mezonlardan hisoblanadi
**Nima:** Avtomatik reyting qaysi raqamlardan tuziladi.
**Nega kerak:** Mezonlar aniq bo'lmasa, reyting ishonchsiz; egasi qaysi xulq-atvorni mukofotlashni hal qilishi kerak.
**Variantlar:**
- A) Uchta mezon: yillik xarid hajmi + o'rtacha to'lov kechikishi + takroriy buyurtma soni — to'liq rasm.
- B) Faqat xarid hajmi — sodda, lekin to'lamaydigan yirik mijoz ham "yaxshi" ko'rinadi.
- C) Faqat to'lov intizomi — ehtiyotkor, lekin hajm e'tiborsiz.
- D) Keyin — hozir kerak emas.

### Q173. Sotuv KPI — haftalik hajm (GSD)
**Nima:** Har menejerning haftalik sotuv hajmi (so'mda yoki tonna/m² da) ShVB GSD ko'rsatkichi sifatida yuritiladimi.
**Nega kerak:** ShVB statistik boshqaruvining yuragi — haftalik o'sish/pasayish grafigi; bonus va reyting shunga bog'lanadi.
**Variantlar:**
- A) Ha, haftalik sotuv hajmi sotuv menejeri kartasining asosiy GSD'si bo'ladi va har dushanba avtomatik yangilanadi — ShVB'ga to'liq mos.
- B) Faqat oylik jami yuritiladi — sodda, lekin haftalik tendensiya ko'rinmaydi.
- C) Keyin — hozir kerak emas.

### Q174. Sotuv KPI — yopilgan bitimlar soni
**Nima:** Haftada nechta buyurtma yopildi (tasdiqdan to'lovgacha) ko'rsatkichi yuritiladimi.
**Nega kerak:** Hajmdan tashqari, menejer nechta bitimni oxirigacha olib borganini ko'rsatadi; faollik o'lchovi.
**Variantlar:**
- A) Ha, yopilgan bitimlar soni alohida GSD — har menejer va bo'lim bo'yicha haftalik.
- B) Yo'q, faqat pul hajmi muhim — bitta yirik bitim ko'p kichikdan afzal.
- C) Keyin — hozir kerak emas.

### Q175. Sotuv KPI — o'rtacha bitim qiymati
**Nima:** Menejerning o'rtacha bitta buyurtma qiymati ko'rsatkichi.
**Nega kerak:** Menejer ko'p mayda buyurtma bilan band yoki yirik bitim ustida ishlayotganini ko'rsatadi.
**Variantlar:**
- A) Ha, o'rtacha bitim qiymati avtomatik hisoblanadi va leaderboardda ko'rinadi — sifat o'lchovi.
- B) Yo'q, faqat jami hajm yetarli.
- C) Keyin — hozir kerak emas.

### Q176. Sotuv KPI — debitor (qarz) nazorati
**Nima:** Menejer sotgan, lekin hali to'lanmagan summa (debitorlik qarzi) uning ko'rsatkichiga kiradimi.
**Nega kerak:** "Sotdim" deb hisob yozib, pulni undirmaslik zavodga zarar; menejer pul kelguncha javobgar bo'lishi kerak.
**Variantlar:**
- A) Ha, har menejerning ochiq debitor summasi va kechikkan qarzlari uning kartasida ko'rinadi va bonusga ta'sir qiladi — pul undirishga rag'bat.
- B) Debitor faqat moliyaning ishi, sotuvchiga ta'sir qilmaydi — sodda, lekin undirish kuchsiz.
- C) Keyin — hozir kerak emas.

### Q177. Debitor kechikish darajalari (aging)
**Nima:** To'lanmagan qarzlarni kechikish muddatiga qarab guruhlash (masalan 0–30 / 31–60 / 60+ kun).
**Nega kerak:** Eski qarz tezroq "yo'qolib ketadi"; menejer va moliya qaysisini birinchi undirishni biladi.
**Variantlar:**
- A) Uch guruh (0–30 / 31–60 / 60+ kun) + 60+ uchun avtomatik ogohlantirish menejer va rahbarga — ShVB to'lanmagan schyotlar mantig'iga mos.
- B) Faqat "to'langan / to'lanmagan" — sodda, lekin kechikish ko'rinmaydi.
- C) Keyin — hozir kerak emas.

### Q178. Sotuv maqsadi (target/plan) belgilash
**Nima:** Har menejerga yoki bo'limga haftalik/oylik sotuv rejasi (maqsad raqami) qo'yiladimi.
**Nega kerak:** Maqsadsiz GSD'da "yaxshi/yomon" o'lchanmaydi; ShVB ideal-rasm va reja mantig'iga mos.
**Variantlar:**
- A) Ha, har kartaga haftalik va oylik sotuv maqsadi qo'yiladi, bajarilish foizi avtomatik ko'rinadi — reja vs fakt.
- B) Faqat umumiy zavod maqsadi, menejerga taqsimlanmaydi — sodda, lekin shaxsiy javobgarlik yo'q.
- C) Keyin — hozir kerak emas.

### Q179. Maqsadni kim belgilaydi
**Nima:** Sotuv maqsadi raqamini kim qo'yadi.
**Nega kerak:** Maqsad manbasi noaniq bo'lsa, menejer "men rozi emasman" deydi; ShVB'da rahbar tasdiqlaydi.
**Variantlar:**
- A) Sotuv rahbari taklif qiladi → yuqori rahbariyat tasdiqlaydi — birgalikda, lekin rasmiy.
- B) Faqat egasi/direktor yuqoridan belgilaydi — qat'iy.
- C) Menejer o'zi belgilaydi → rahbar tasdiqlaydi — motivatsiyali.
- D) Keyin — hozir kerak emas.

### Q180. Menejer leaderboard (reyting taxtasi)
**Nima:** Sotuv menejerlarini ko'rsatkich bo'yicha tartiblab ko'rsatadigan jadval.
**Nega kerak:** Sog'lom raqobat va shaffoflik; ShVB reyting+bonus yo'nalishiga mos.
**Variantlar:**
- A) Ha, haftalik leaderboard — hajm/yopilgan bitim/maqsad bajarilishi bo'yicha tartib + o'tgan haftaga nisbatan o'zgarish — rag'batlantiruvchi.
- B) Faqat rahbar ko'radigan maxfiy reyting — nazorat, lekin raqobat kuchsiz.
- C) Leaderboard yo'q.
- D) Keyin — hozir kerak emas.

### Q181. Leaderboard qaysi ko'rsatkichdan tartiblanadi
**Nima:** Reyting taxtasida birinchi o'rin nimaga qarab beriladi.
**Nega kerak:** Bitta raqamga qarab tartiblansa, menejerlar shuni "o'ynaydi" (masalan faqat hajm uchun chegirma beradi).
**Variantlar:**
- A) Maqsad bajarilish foizi (reja vs fakt) — adolatli, hamma uchun teng o'lchov.
- B) Sof sotuv hajmi (so'm) — sodda, lekin yangi menejerga noqulay.
- C) Aralash ball (hajm + yopilgan bitim + debitor intizomi) — to'liq, lekin tushunish murakkabroq.
- D) Keyin — hozir kerak emas.

### Q182. Menejer ↔ mijoz biriktirilishi
**Nima:** Har mijoz bitta menejerga biriktirilami yoki har kim har mijoz bilan ishlay oladimi.
**Nega kerak:** Biriktirilmasa, ikki menejer bir mijozni "tortqilaydi" yoki hech kim javobgar bo'lmaydi.
**Variantlar:**
- A) Har mijoz bitta egasi-menejerga biriktiriladi; boshqasi faqat ruxsat bilan ishlaydi — aniq javobgarlik.
- B) Mijozlar umumiy, kim birinchi ishlasa o'sha — moslashuvchan, lekin tortishuvli.
- C) Keyin — hozir kerak emas.

### Q183. Karta-model bilan ulanish (RBAC kim nimani ko'radi)
**Nima:** Sotuvda kim qaysi ma'lumotni ko'rishi (o'z mijozlari/butun bo'lim/butun zavod) menejer kartasidan kelishimi.
**Nega kerak:** Vizyon: "karta = ruxsat". Menejer faqat o'zinikini, rahbar butun bo'limni ko'rishi kerak.
**Variantlar:**
- A) Ko'rish doirasi kartaga bog'lanadi: menejer = o'z mijozlari, sotuv rahbari = butun bo'lim, direktor = hammasi — karta-modelga to'liq mos.
- B) Hamma sotuvchi hamma narsani ko'radi — ochiq, lekin maxfiy narx/mijoz sirlanmaydi.
- C) Keyin — hozir kerak emas.

### Q184. Sotuv → Ishlab chiqarish ulanishi (oltin-ip hop)
**Nima:** Buyurtma tasdiqlangach, ishlab chiqarishga avtomatik buyurtma (papka/ish) tushadimi.
**Nega kerak:** Qo'lda uzatish kechikadi va yo'qoladi; oltin-ip uzilmasligi uchun sotuv→ishlab chiqarish avtomatik bo'lishi kerak.
**Variantlar:**
- A) Ha, tasdiqlangan buyurtma avtomatik ishlab chiqarish buyurtmasiga aylanadi va bir xil oltin-ip raqamini saqlaydi — uzluksiz kuzatuv.
- B) Ishlab chiqarish bo'limi qo'lda yangi buyurtma ochadi — moslashuvchan, lekin bog'lanish uziladi.
- C) Keyin — hozir kerak emas.

### Q185. Yetkazish (dostavka) bosqichini kuzatish
**Nima:** Mahsulot mijozga yetkazilishi tizimda alohida bosqich sifatida belgilanadimi (sana, kim oldi, hujjat).
**Nega kerak:** Oltin-ip hop: "yetkazildi" deb belgilanmasa, to'lov muddati ham boshlanmaydi.
**Variantlar:**
- A) Ha, yetkazish alohida bosqich — sana + qabul qildi + yuk xati; shu sana to'lov muddatini ishga tushiradi — aniq.
- B) Faqat "yetkazildi" belgisi, tafsilotsiz — sodda.
- C) Keyin — hozir kerak emas.

### Q186. To'lov qabul qilish va buyurtmaga bog'lash (oltin-ip yopilishi)
**Nima:** Mijoz to'lovi qaysi buyurtmaga tegishli ekani tizimda bog'lanadimi.
**Nega kerak:** To'lov buyurtmaga bog'lanmasa, "qaysi hisob to'landi" noaniq qoladi va debitor noto'g'ri hisoblanadi.
**Variantlar:**
- A) Ha, har to'lov aniq buyurtma/hisobga bog'lanadi va to'liq to'langanda buyurtma avtomatik "yopildi"ga o'tadi — oltin-ip yopiladi.
- B) To'lovlar umumiy mijoz balansiga tushadi, buyurtmaga bog'lanmaydi — sodda, lekin chalkash.
- C) Keyin — hozir kerak emas.

### Q187. Qisman to'lov va oldindan to'lov (avans)
**Nima:** Mijoz buyurtma uchun bir necha bo'lib yoki oldindan to'lasa, tizim qanday yuritadi.
**Nega kerak:** Karton buyurtmalarida ko'pincha avans olinadi; tizim qoldiqni to'g'ri ko'rsatishi shart.
**Variantlar:**
- A) Ha, avans + qisman to'lovlar qo'llab-quvvatlanadi, qoldiq qarz avtomatik hisoblanadi — real amaliyotga mos.
- B) Faqat to'liq to'lov — sodda, lekin amaliyotga to'g'ri kelmaydi.
- C) Keyin — hozir kerak emas.

### Q188. Bekor qilingan / yo'qotilgan buyurtmalarni kuzatish
**Nima:** Mijoz rad etgan yoki bekor qilingan so'rovlar saqlanib, sababi yoziladimi.
**Nega kerak:** Nima uchun mijozlar yo'qotilayotganini bilmasa, sotuv yaxshilanmaydi; ShVB tahlil mantig'i.
**Variantlar:**
- A) Ha, yo'qotilgan buyurtma sababi (narx/muddat/raqobatchi/sifat) bilan saqlanadi va haftalik tahlil qilinadi — o'rganish.
- B) Bekor qilingan buyurtma o'chiriladi — sodda, lekin sabab yo'qoladi.
- C) Keyin — hozir kerak emas.

### Q189. Takroriy buyurtma (mijozni qaytarish)
**Nima:** Tez-tez bir xil mahsulotni oladigan mijozga avvalgi buyurtmadan tez nusxa olish imkoni.
**Nega kerak:** Karton qadoqlashda takroriy buyurtmalar ko'p; har safar qaytadan kiritish vaqt yo'qotadi.
**Variantlar:**
- A) Ha, avvalgi buyurtmadan bir tugma bilan nusxa olib, narxni yangilash mumkin — tez xizmat.
- B) Har buyurtma noldan kiritiladi — sodda, lekin sekin.
- C) Keyin — hozir kerak emas.

### Q190. Mijoz aloqa tarixi (so'rov/qo'ng'iroq/uchrashuv)
**Nima:** Mijoz bilan har bir aloqa (qo'ng'iroq, uchrashuv, so'rov) tizimda yoziladimi.
**Nega kerak:** Menejer ketsa, mijoz tarixi qolishi kerak (karta-model: "tarix saqlanadi"); aks holda yangisi noldan boshlaydi.
**Variantlar:**
- A) Ha, har aloqa qisqa eslatma bilan mijoz kartasiga yoziladi — uzluksiz xotira.
- B) Faqat buyurtma yoziladi, aloqalar yozilmaydi — sodda, lekin tarix yo'q.
- C) Keyin — hozir kerak emas.

### Q191. Sotuv menejeri bonusi (mukofot mantig'i)
**Nima:** Sotuv natijasi uchun bonus qanday belgilanadi — sotuvdan foizmi yoki sozlanadigan tizimmi.
**Nega kerak:** Karta-model: "bonus = sozlanadigan tizim, HR/Moliya/rahbar belgilaydi"; sotuvchini to'g'ri rag'batlantirish.
**Variantlar:**
- A) Sozlanadigan bonus: maqsad bajarilishi + undirilgan pul (debitorsiz) asosida, HR/Moliya/rahbar sozlaydi — vizyonga mos.
- B) Sotuv summasidan qat'iy foiz — sodda, lekin to'lanmagan sotuvni ham mukofotlaydi.
- C) Bonus yo'q, faqat maosh — sodda, lekin rag'bat kuchsiz.
- D) Keyin — hozir kerak emas.

### Q192. Haftalik sotuv hisoboti (dushanba digest)
**Nima:** Har dushanba sotuv bo'limining haftalik xulosasi (hajm, yopilgan bitim, maqsad, debitor, leaderboard) avtomatik tayyorlanadimi.
**Nega kerak:** ShVB haftalik tsikl: rahbar bir qarashda bo'lim holatini ko'rishi kerak; qo'lda yig'ish vaqt oladi.
**Variantlar:**
- A) Ha, dushanba avtomatik digest (bo'lim + har menejer + maqsad foizi + leaderboard) rahbar va egasiga — ShVB tsikliga to'liq mos.
- B) Hisobotni rahbar so'rovga qarab qo'lda chiqaradi — moslashuvchan, lekin bir xil emas.
- C) Keyin — hozir kerak emas.

### Q193. Sotuv narx tarixi va o'zgarish jurnali
**Nima:** Bir mijoz/mahsulot uchun narx vaqt o'tishi bilan o'zgarsa, tarix saqlanadimi.
**Nega kerak:** "O'tgan safar arzonroq edi" tortishuvlarini hal qiladi; narx siyosatini tahlil qilish imkoni.
**Variantlar:**
- A) Ha, har narx o'zgarishi sana + kim o'zgartirgani bilan saqlanadi — shaffoflik.
- B) Faqat joriy narx ko'rinadi, tarix yo'q — sodda.
- C) Keyin — hozir kerak emas.

### Q194. Sotuv → Moliya ulanishi (to'lov GL'ga tushishi)
**Nima:** Qabul qilingan to'lov avtomatik moliyaviy hisobga (kassa/bank) o'tadimi.
**Nega kerak:** Oltin-ipning oxirgi halqasi — pul moliyada ko'rinmasa, debitor va daromad noto'g'ri bo'ladi.
**Variantlar:**
- A) Ha, to'lov tasdiqlangach avtomatik moliyaviy yozuvga (kirim) aylanadi va debitorni kamaytiradi — uzluksiz.
- B) Moliya bo'limi to'lovni qo'lda qaytadan kiritadi — moslashuvchan, lekin ikki marta ish va xato.
- C) Keyin — hozir kerak emas.

---

## 7. PP / Rejalashtirish

### Q195. Reja qancha oldin tuziladi (rejalashtirish ufqi)
**Nima:** Ishlab chiqarish rejasi necha kun/haftaga oldindan tuzilishini belgilash.
**Nega kerak:** Material xaridi, smena va stanok yuklamasi shu ufqqa qarab hisoblanadi; ufq qisqa bo'lsa zavod doim "yong'in o'chiradi".
**Variantlar:**
- A) 4 hafta (oylik) reja — material va smena oldindan tayyor, eng barqaror
- B) 1 hafta (haftalik) reja — zavodning ШВБ haftalik tsikliga mos, lekin material kech keladi
- C) Faqat kunlik — har kuni ertangi kun rejalashtiriladi, eng tezkor lekin betartib
- D) Keyin — hozir kerak emas

### Q196. Rejani kim tasdiqlaydi
**Nima:** AI yoki tizim tuzgan rejani ishga tushirishdan oldin kim "ha" tugmasini bosadi.
**Nega kerak:** Reja avtomatik ishga tushsa xato yuklama bo'ladi; juda ko'p tasdiq bo'lsa sekinlashadi.
**Variantlar:**
- A) Rejalashtirish bo'limi boshlig'i tasdiqlaydi — bitta mas'ul, tez va aniq
- B) Ishlab chiqarish direktori tasdiqlaydi — yuqori nazorat, lekin sekinroq
- C) AI o'zi tasdiqlaydi, faqat anomaliyani odamga chiqaradi — eng tezkor, ishonchga bog'liq
- D) Keyin — hozir qo'lda

### Q197. AI-rejalashtirish darajasi
**Nima:** Sun'iy intellekt rejani qanchalik o'zi tuzishi — maslahatchi yoki to'liq avtomat.
**Nega kerak:** AI yuklamani optimallashtiradi, lekin ishonchsiz bo'lsa noto'g'ri qaror chiqaradi.
**Variantlar:**
- A) AI taklif qiladi, odam tahrirlaydi va tasdiqlaydi — xavfsiz, vizyonga mos boshlanish
- B) AI to'liq tuzadi, odam faqat ko'radi — tezkor, lekin nazorat kam
- C) AI umuman yo'q, hamma narsa qo'lda — eng sodda, sekin
- D) Keyin — avval qo'lda, AI keyin qo'shiladi

### Q198. Stanok tanlashni kim hal qiladi
**Nima:** Buyurtmani qaysi stanokda (mashinada) bajarish qarorini odam yoki tizim qabul qiladi.
**Nega kerak:** To'g'ri stanok tanlovi tezlik va sifatga ta'sir qiladi; noto'g'ri tanlov vaqt yo'qotadi.
**Variantlar:**
- A) Tizim eng bo'sh va mos stanokni o'zi taklif qiladi, master tasdiqlaydi — tavsiya
- B) Faqat smena ustasi qo'lda tanlaydi — tajribaga bog'liq, tizimsiz
- C) Buyurtma turiga qarab qat'iy biriktirilgan stanok (qoida jadvali) — barqaror, moslashuvchan emas
- D) Keyin

### Q199. Stanok yuklanishini ko'rsatish (yuklama jadvali)
**Nima:** Har stanokning qaysi kun/soatda band/bo'sh ekanini ko'rsatadigan vizual jadval.
**Nega kerak:** Egasi va master bir qarashda qaysi stanok to'lib ketgan, qaysi biri bo'sh turibdi — ko'radi.
**Variantlar:**
- A) Rangli Gantt taxta (yashil=bo'sh, qizil=to'la) har stanok bo'yicha — eng tushunarli
- B) Oddiy foiz ro'yxati (stanok = 80% band) — sodda, kam vizual
- C) Faqat umumiy zavod yuklamasi foizi — eng yuzaki
- D) Keyin

### Q200. Material yetishmasligini reja avval ogohlantirsinmi (MRP)
**Nima:** Reja tuzilganda kerakli karton/bo'yoq/qadoq omborda yetarli emasligini oldindan aniqlash.
**Nega kerak:** Material kelmasdan reja ishga tushsa stanok to'xtaydi; oldindan bilsa xarid qilinadi.
**Variantlar:**
- A) Reja tuzilganda avtomatik "X material yetmaydi, Y kun kerak" ogohlantirishi — tavsiya
- B) Faqat ishga tushirishdan oldin tekshirish — kechroq, lekin baribir ushlaydi
- C) Tekshiruv yo'q, omborchi o'zi kuzatadi — xavfli
- D) Keyin

### Q201. Material yetmasa reja nima qiladi
**Nima:** MRP material yetishmasligini topganda tizim qanday harakat qilsin.
**Nega kerak:** Yetishmovchilik aniqlangach avtomatik harakat bo'lmasa, ogohlantirish e'tiborsiz qoladi.
**Variantlar:**
- A) Avtomatik xarid arizasi (ЗНО) yaratadi va xaridга yuboradi — oltin-ip bilan to'liq bog'lanish
- B) Faqat rejalashtiruvchiga bildirishnoma yuboradi — qo'lda davom
- C) Buyurtmani avtomatik kechiktiradi va mijozga sana o'zgarishini belgilaydi — ehtiyotkor
- D) Keyin

### Q202. Stanok quvvati yetmasligini ko'rsatish (CRP)
**Nima:** Rejadagi ish stanoklar sig'imidan oshib ketganini ("oltin-ip hop2") oldindan ko'rsatish.
**Nega kerak:** Quvvatdan ortiq reja tuzilsa muddatlar buziladi; oldindan ko'rsa smena qo'shiladi yoki buyurtma suriladi.
**Variantlar:**
- A) Reja tuzilganda "bu hafta 120% yuklama, 20% ortiqcha" deb qizil ko'rsatadi — tavsiya
- B) Faqat keyingi haftaga oshib ketganda ogohlantiradi — kechroq
- C) Quvvat tekshiruvi yo'q — master o'zi sezadi
- D) Keyin

### Q203. Quvvat oshganda yechim
**Nima:** CRP quvvatdan ortiqcha yuklamani topganda tizim qanday yechim taklif qiladi.
**Nega kerak:** "Oshib ketti" deyish kifoya emas — qaysi buyurtma surilsin yoki qo'shimcha smena kerakmi degan qaror kerak.
**Variantlar:**
- A) AI variant taklif qiladi: smena qo'shish / buyurtma surish / boshqa stanokka o'tkazish — tavsiya
- B) Faqat ro'yxat ko'rsatadi, master o'zi hal qiladi — sodda
- C) Avtomatik eng kam muhim buyurtmani suradi — tezkor, lekin xavfli
- D) Keyin

### Q204. Parallel buyurtmalar tartibi (prioritet)
**Nima:** Bir vaqtda ko'p buyurtma kelganda qaysi biri oldin bajarilishini belgilash qoidasi.
**Nega kerak:** Tartibsiz bo'lsa katta mijoz kutadi, kichik buyurtma o'tib ketadi.
**Variantlar:**
- A) Muhimlik darajasi + muddat + mijoz toifasi bo'yicha avtomatik tartiblash — tavsiya
- B) Faqat muddat (deadline) bo'yicha — sodda, adolatli
- C) Master qo'lda tortib joylashtiradi — moslashuvchan, sub'ektiv
- D) Keyin

### Q205. Parallel buyurtmalarni bir stanokda birlashtirish
**Nima:** O'xshash buyurtmalarni (bir xil karton/format) bitta yuklamada birlashtirib bajarish.
**Nega kerak:** Sozlash (наладка) vaqtini tejaydi — bir xil ishlarni birga qilsa stanok kam to'xtaydi.
**Variantlar:**
- A) Tizim o'xshash buyurtmalarni avtomatik guruhlab taklif qiladi — eng tejamkor
- B) Master qo'lda birlashtiradi — nazorat bor, sekin
- C) Birlashtirish yo'q, har buyurtma alohida — sodda, ko'p sozlash
- D) Keyin

### Q206. Texnologik karta nima saqlaydi
**Nima:** Har mahsulot uchun "qanday qilinadi" hujjati — bosqichlar, stanoklar, materiallar, vaqt normalari.
**Nega kerak:** Texkarta bo'lmasa har safar qaytadan o'ylab topiladi; bo'lsa reja avtomatik tuziladi.
**Variantlar:**
- A) To'liq: bosqichlar + stanok + material (BOM) + vaqt normasi + sifat talabi — tavsiya
- B) O'rtacha: faqat bosqichlar + stanoklar — yengilroq boshlanish
- C) Sodda: faqat material ro'yxati (BOM) — minimal
- D) Keyin

### Q207. Texnologik kartani kim tuzadi
**Nima:** Yangi mahsulot texkartasini kim yaratadi va tasdiqlaydi.
**Nega kerak:** Mas'ulsiz texkarta noto'g'ri normalardan iborat bo'ladi; bu rejani buzadi.
**Variantlar:**
- A) Texnolog tuzadi, ishlab chiqarish boshlig'i tasdiqlaydi — tavsiya
- B) Master o'zi tuzadi va ishlatadi — tez, nazoratsiz
- C) AI o'xshash mahsulotdan andoza taklif qiladi, texnolog tahrirlaydi — tezkor
- D) Keyin

### Q208. Texnologik karta versiyalari
**Nima:** Texkarta o'zgarganda eski versiyani saqlash va yangi versiyaga o'tish tartibi.
**Nega kerak:** Norma o'zgarsa eski buyurtmalar qaysi versiya bilan bajarilganini bilish kerak (sifat/xarajat tahlili uchun).
**Variantlar:**
- A) Har o'zgarishda yangi versiya, eski tarix saqlanadi — tavsiya
- B) Faqat oxirgi versiya saqlanadi, tarix yo'q — sodda, tarix yo'qoladi
- C) Keyin

### Q209. Reja → ishlab chiqarish jadvali ulanishi (oltin-ip)
**Nima:** Tasdiqlangan reja avtomatik ravishda smena/stanok jadvaliga aylanib, MES'ga (sex)ga tushishi.
**Nega kerak:** Reja qog'ozda qolib MES'ga tushmasa, sexda nima qilishni bilmaydi — oltin-ip uziladi.
**Variantlar:**
- A) Reja tasdiqlanishi bilan avtomatik sex jadvaliga va operatorlarga tushadi — tavsiya
- B) Master qo'lda nusxalab sexga beradi — qo'lda, xato xavfi
- C) Keyin

### Q210. Smena tuzilmasi (master-data)
**Nima:** Zavodda nechta smena bor va ularning vaqtlari (1-smena 8:00-16:00 va h.k.).
**Nega kerak:** Stanok yuklanishi va quvvat hisobi aniq smena vaqtlariga bog'liq; noto'g'ri smena = noto'g'ri reja.
**Variantlar:**
- A) 2 smena (kunduzgi/tungi) — odatiy karton zavod rejimi
- B) 3 smena (uzluksiz 24/7) — maksimal quvvat, ko'p xodim
- C) 1 smena — sodda, kam quvvat
- D) Keyin — egasi smena jadvalini keyin kiritadi

### Q211. Smena yuklamasini kim taqsimlaydi
**Nima:** Qaysi operator qaysi smenada qaysi stanokda ishlashini belgilash.
**Nega kerak:** Operator-stanok mosligi sifatga ta'sir qiladi; tajribali operator murakkab buyurtmaga.
**Variantlar:**
- A) Tizim operator malakasi (razryad) + bo'shligiga qarab taklif qiladi — karta-modelga mos
- B) Smena ustasi qo'lda taqsimlaydi — tajribaga bog'liq
- C) Keyin

### Q212. Operator razryadi rejaga ta'sir qilsinmi (karta-model)
**Nima:** Murakkab buyurtmani faqat yetarli razryadli (malakali) operatorga rejalashtirish.
**Nega kerak:** Vizyonда har karta razryad/talab saqlaydi — past razryadli operator murakkab ishni buzadi.
**Variantlar:**
- A) Ha — tizim razryad mosligini tekshiradi, mos kelmasa ogohlantiradi — karta-modelga to'liq mos
- B) Faqat tavsiya sifatida ko'rsatadi, bloklamaydi — yumshoq
- C) Yo'q — razryad rejaga ta'sir qilmaydi — sodda
- D) Keyin

### Q213. Stanok ish vaqti normalarining manbasi
**Nima:** "Bu stanok 1000 dona qutini necha soatda chiqaradi" raqami qayerdan olinadi.
**Nega kerak:** Vaqt normasi noto'g'ri bo'lsa butun reja va muddat noto'g'ri chiqadi.
**Variantlar:**
- A) Texkartadagi norma + IoT'dan haqiqiy o'rtacha tezlik bilan avtomatik to'g'rilash — eng aniq
- B) Faqat qo'lda kiritilgan texkarta normasi — sodda, eskirishi mumkin
- C) Master taxminiy baholaydi — tezkor, noaniq
- D) Keyin

### Q214. Stanok to'xtashi (downtime) rejaga ta'sir qilsinmi
**Nima:** Stanok buzilsa yoki to'xtasa, reja avtomatik qayta hisoblanib boshqa stanokka o'tkazsinmi.
**Nega kerak:** To'xtash hisobga olinmasa reja "qog'ozda bajarilgan, amalda yo'q" bo'ladi. (IoT downtime allaqachon bor.)
**Variantlar:**
- A) Ha — to'xtash signali kelishi bilan reja qayta hisoblanadi va ogohlantiradi — tavsiya
- B) Faqat ogohlantiradi, reja qo'lda tuzatiladi — yarim avtomatik
- C) Yo'q — to'xtash alohida kuzatiladi, rejaga bog'lanmaydi
- D) Keyin

### Q215. Rejalashtirish birligi (nima rejalanadi)
**Nima:** Reja butun buyurtma bo'yicha tuziladimi yoki har bosqich (kesish/bosish/yelimlash) bo'yicha alohida.
**Nega kerak:** Karton ishida buyurtma bir necha stanokdan o'tadi; faqat "buyurtma" darajasi sex ichini ko'rsatmaydi.
**Variantlar:**
- A) Bosqich (operatsiya) darajasida — har stanok o'z ishini ko'radi, aniq
- B) Buyurtma darajasida — sodda, sex ichi ko'rinmaydi
- C) Keyin

### Q216. Reja buzilganda qayta rejalashtirish (re-plan)
**Nima:** Buyurtma kechiksa yoki yangi shoshilinch buyurtma kelsa, qolgan rejani qaytadan tuzish.
**Nega kerak:** Hayot rejaga mos kelmaydi; qayta rejalashtirilmasa qog'oz reja eskiradi.
**Variantlar:**
- A) Tizim avtomatik qayta hisoblab yangi variant taklif qiladi — tavsiya
- B) Faqat tugma bosilganda qayta hisoblaydi — boshqariladigan
- C) Qo'lda qaytadan tuziladi — sodda, mehnat talab
- D) Keyin

### Q217. Reja-fakt taqqoslash (haqiqiy natija)
**Nima:** "Rejada 1000 dona edi, amalda 850 chiqdi" — reja va haqiqiy natijani solishtirish.
**Nega kerak:** Solishtirilmasa normalar yaxshilanmaydi va kim ortda qolayotgani ko'rinmaydi (ШВБ GSD g'oyasi).
**Variantlar:**
- A) Har smena oxirida reja-fakt avtomatik taqqoslanadi va og'ish ko'rsatiladi — tavsiya
- B) Faqat haftalik hisobotda taqqoslash — kechroq
- C) Keyin

### Q218. Buyurtma muddatini tizim hisoblab bersinmi (ATP/va'da sanasi)
**Nima:** Mijoz buyurtma berganda "bu necha kunда tayyor bo'ladi" sanasini stanok yuklamasiga qarab hisoblash.
**Nega kerak:** Aniq sana bermasa mijozga noto'g'ri va'da beriladi yoki ortiqcha ehtiyot kun qo'shiladi.
**Variantlar:**
- A) Tizim joriy yuklama + material asosida real sana hisoblaydi — tavsiya (oltin-ip savdo bilan)
- B) Savdo qo'lda standart muddat beradi — sodda, noaniq
- C) Keyin

### Q219. Reja ufqida narsa "qotib qoladimi" (muzlatilgan zona)
**Nima:** Eng yaqin 1-2 kunlik rejani o'zgartirishni taqiqlash — chunki material kesilgan, sozlash qilingan.
**Nega kerak:** Oxirgi daqiqada o'zgartirish sexni chalkashtiradi va isrof keltiradi.
**Variantlar:**
- A) Ha — yaqin N kun "muzlatilgan", faqat egasi/direktor ruxsati bilan o'zgaradi — tavsiya
- B) Yo'q — har doim o'zgartirish mumkin — moslashuvchan, betartib
- C) Keyin

### Q220. Reja holatlari ro'yxati (master-data)
**Nima:** Reja yoki ish buyurtmasi qanday bosqichlardan o'tishi (masalan: Qoralama → Tasdiqlangan → Ishda → Tugagan → Bekor).
**Nega kerak:** Aniq statuslar bo'lmasa kim qaysi ishda turganini bilib bo'lmaydi; hisobotlar chalkashadi.
**Variantlar:**
- A) 5 holat: Qoralama / Tasdiqlangan / Ishda / Tugagan / Bekor — tavsiya, sodda va yetarli
- B) Kengaytirilgan: + Kutilmoqda (material) / To'xtatilgan / Qayta ishlash — batafsil
- C) Faqat 3 holat: Yangi / Ishda / Tugagan — minimal
- D) Keyin

### Q221. Rejalashtirish bo'limining 7-otdelenie joyi (org-model)
**Nima:** Rejalashtirish funksiyasi ШВБ 7-otdelenie tuzilmasida qaysi otdeleniega tegishli.
**Nega kerak:** Vizyonда har funksiya org-daraxtga bog'lanadi; bog'lanmasa GSD/hisobot va mas'ullik aniqlanmaydi.
**Variantlar:**
- A) Ishlab chiqarish otdeleniyega bo'ysunadi (sex bilan birga) — tavsiya
- B) Alohida rejalashtirish-logistika otdeleniyesi — mustaqil, og'irroq tuzilma
- C) Keyin — egasi org-daraxtni keyin biriktiradi

### Q222. Rejalashtiruvchining GSD (asosiy ko'rsatkichi)
**Nima:** Rejalashtirish bo'limining "to'g'ri ishi" qaysi raqam bilan o'lchanadi (karta-modeldagi ЦКП).
**Nega kerak:** GSD bo'lmasa bo'lim qanchalik yaxshi ishlayotgani noma'lum; vizyon har kartaga GSD talab qiladi.
**Variantlar:**
- A) Reja bajarilish foizi (muddatida tayyor buyurtmalar %) — tavsiya, eng tushunarli
- B) Stanok yuklanish darajasi (bo'sh turish kam) — samaradorlikka urg'u
- C) Ikkalasi birga (vaznli ball) — to'liq, murakkabroq
- D) Keyin

### Q223. Smena boshlanishida operatorga vazifa ko'rsatish (sex tableti)
**Nima:** Operator smenaga kelganda o'z stanogida bugun nima qilishini ro'yxat ko'rinishida ko'rishi.
**Nega kerak:** Reja faqat ofisда qolmasdan operator qo'liga yetib borsa, oltin-ip sexgacha to'liq ulanadi.
**Variantlar:**
- A) Ha — har stanok tabletida bugungi buyurtmalar tartibi va normasi ko'rinadi — tavsiya
- B) Faqat smena ustasi qog'ozда tarqatadi — qo'lda
- C) Keyin

### Q224. Shoshilinch buyurtma (срочный) ni reja ichiga kiritish
**Nima:** Katta mijozdan keladigan shoshilinch buyurtmani mavjud rejaning ichiga "tiqib" joylashtirish tartibi.
**Nega kerak:** Shoshilinch ish boshqarilmasa bütün reja buziladi yoki shoshilinch ish e'tibordan chetda qoladi.
**Variantlar:**
- A) Tizim shoshilinch belgi qo'yilganda eng kam ta'sir bilan joylashtirib, surilgan buyurtmalarni ko'rsatadi — tavsiya
- B) Master qo'lda joylashtiradi va o'zgarganlarni ogohlantiradi — nazorat bor
- C) Shoshilinch buyurtma har doim navbat boshiga — sodda, boshqalarni buzadi
- D) Keyin

### Q225. Reja AI maslahatchisining tushuntirishi
**Nima:** AI "bu buyurtmani 2-stanokka qo'ydim" deganda nega shunday qilganini odam tilida tushuntirishi.
**Nega kerak:** Tushuntirishsiz AI qaroriga ishonilmaydi; egasi "qora quti" rejaga ishonmaydi.
**Variantlar:**
- A) Ha — har taklif yonida "sababi: 2-stanok bo'sh va format mos" izohi — tavsiya
- B) Faqat so'ralganda tushuntiradi — yengilroq
- C) Yo'q — faqat natija ko'rsatiladi — sodda, ishonchsiz
- D) Keyin

---

## 8. MES / Ishlab chiqarish

### Q226. Ishlab chiqarish sessiyasi 3-bosqich ("hop3")
**Nima:** Har bir sessiyani 3 aniq bosqichga bo'lish — tayyorgarlik (sozlash/changeover), asosiy ishlab chiqarish, yakunlash (tozalash/topshirish).
**Nega kerak:** Hozir sessiya bitta "start–stop" oralig'i; bosqichga bo'lsangiz qaysi bosqichda vaqt yo'qolayotganini (masalan sozlash uzayganini) ko'rasiz va OEE'ni to'g'riroq hisoblaysiz.
**Variantlar:**
- A) To'liq 3 bosqich (tayyorgarlik / asosiy / yakunlash) — har bosqich vaqti alohida, eng aniq tahlil
- B) 2 bosqich (sozlash / ishlash) — soddaroq, lekin yakunlash ko'rinmaydi
- C) Keyin — hozir bitta sessiya yetadi

### Q227. Bosqichlar avtomatmi yoki operator bosadimi
**Nima:** "Hop3" bosqichlari operator tugma bosishi bilan o'tadimi yoki sensordan (mashina ishga tushdi) avtomatik aniqlanadimi.
**Nega kerak:** Avto-aniqlash aniqroq va operatorga ortiqcha ish bermaydi, lekin sensorga bog'liq; qo'lda bosish oson, lekin operator unutsa ma'lumot buziladi.
**Variantlar:**
- A) Avtomatik (sensor/IoT) — operator aralashmasdan bosqichlar o'tadi, eng aniq
- B) Operator tugmasi bilan qo'lda — sensorsiz ishlaydi, lekin intizomga bog'liq
- C) Aralash — sensor bor mashinada avto, qolganlarida qo'lda

### Q228. Smena modelini aniqlash (3 smena standart)
**Nima:** Smenalar ro'yxati va vaqtlarini belgilash — ertalabki/kunduzgi/tungi (hozir kodda morning/afternoon/night bor).
**Nega kerak:** Smena = barcha hisobotning (OEE, sarf, brigada bali) asosiy bo'linishi; vaqtlari aniq bo'lmasa sessiyalar noto'g'ri smenaga tushadi.
**Variantlar:**
- A) 3 smena, soatlari sozlanadigan (masalan 08–16 / 16–24 / 00–08) — zavod jadvaliga moslashtiriladi
- B) 2 smena (kunduzgi/tungi) — kichik hajm uchun yetarli
- C) Keyin — hozirgi 3 nom (morning/afternoon/night) qoladi

### Q229. Brigada (jamoa) tushunchasini qo'shish
**Nima:** Sessiyaga bitta operator emas, brigada (bir necha xodim + brigadir) biriktirish.
**Nega kerak:** Karton/qadoq sexida ko'pincha mashinada jamoa ishlaydi; natija jamoaga yoziladi, bonus/reyting jamoa bo'yicha hisoblanadi.
**Variantlar:**
- A) To'liq brigada (a'zolar ro'yxati + brigadir + smena) — jamoa natijasi va bali
- B) Brigadir + operatorlar soni (ismsiz) — yengilroq, lekin shaxsiy hissa ko'rinmaydi
- C) Keyin — hozircha bitta operator/sessiya

### Q230. Brigada tarkibini kim belgilaydi
**Nima:** Smena boshida brigada tarkibini kim shakllantiradi — usta/brigadir tizimda tanlaydimi yoki HR oldindan jadvalga biriktiradimi.
**Nega kerak:** Tarkib aniq bo'lmasa natija kimga tegishli ekani noaniq qoladi; intizom va davomat shu yerdan ulanadi.
**Variantlar:**
- A) Brigadir smena boshida tizimda tarkibni tasdiqlaydi — jonli, real holatga mos
- B) HR haftalik jadval tuzadi, MES o'qiydi — barqaror, lekin almashinuvni aks ettirmaydi
- C) Keyin — tarkib hozircha qo'lda izoh

### Q231. Material sarfini avtomatik norma bo'yicha yechish
**Nima:** Sessiya yopilganda ishlab chiqarilgan miqdorga ko'ra material (karton, qog'oz, bo'yoq, yelim) normadan avtomatik hisoblanib ombordan yechilsin.
**Nega kerak:** Hozir sarf qo'lda kiritiladi yoki umuman yozilmaydi; avto-norma haqiqiy tannarx va ombor qoldig'ini real qiladi.
**Variantlar:**
- A) To'liq avto: norma × miqdor → ombordan avto-yechim + GL (haqiqiy tannarx) — eng kuchli
- B) Avto-hisob, lekin operator/usta tasdiqlaganda yechiladi — nazorat saqlanadi
- C) Keyin — sarf qo'lda kiritiladi

### Q232. Norma manbai (texkarta) qayerdan keladi
**Nima:** Har mahsulot uchun "1 dona = qancha material" normasi qayerda saqlanadi — texnologik kartada (BOM) yoki MES ichida alohida.
**Nega kerak:** Avto-sarf ishlashi uchun ishonchli norma kerak; manba bitta bo'lmasa raqamlar bo'linadi.
**Variantlar:**
- A) Texkarta/BOM yagona manba (PP modulidan) — MES faqat o'qiydi, bitta haqiqat
- B) MES da alohida norma jadvali — mustaqil, lekin BOM bilan dublikat xavfi
- C) Keyin — norma hozircha taxminiy

### Q233. Norma chetlashuvini (haqiqiy vs norma) kuzatish
**Nima:** Haqiqiy sarf normadan oshsa (masalan brak ko'p) farqni ko'rsatuvchi ortiqcha-sarf hisoboti.
**Nega kerak:** Ortiqcha sarf = yashirin yo'qotish/o'g'rilik signali; karton sexida material eng katta xarajat.
**Variantlar:**
- A) Har sessiyada farq% + smena/brigada bo'yicha jamlanma — darhol ogohlantirish
- B) Faqat oylik umumiy chetlashuv hisoboti — yengilroq, kechroq ko'rinadi
- C) Keyin — hozircha faqat sarf yoziladi

### Q234. SOS (favqulodda chaqiruv) oqimini aniqlash
**Nima:** Operator "SOS" bosganda kim xabardor bo'ladi va qanday eskalatsiya (usta → muhandis → direktor) ishlaydi (hozir SOS yozuvi bor, oqim yo'q).
**Nega kerak:** SOS aniq adresat va vaqt-cheklovsiz bo'lsa "do'st-do'stga aytib qo'yish" bo'lib qoladi; tez javob ishlab chiqarishni saqlaydi.
**Variantlar:**
- A) Bosqichli eskalatsiya: usta → bo'lim boshlig'i → direktor (vaqt o'tsa avto-ko'tariladi) — kafolatli javob
- B) Bitta guruhga (Telegram/ekran) bir martalik xabar — sodda, lekin kechiksa kim javobgar noaniq
- C) Keyin — SOS hozircha faqat yoziladi

### Q235. SOS sabab toifalari (master-data)
**Nima:** SOS sabablarining tayyor ro'yxati — mashina buzildi, material tugadi, xavfsizlik, sifat, boshqa.
**Nega kerak:** Tayyor toifa bo'lsa SOS'larni guruhlash, takror sabablarni topish va tezkor reaksiya qilish oson.
**Variantlar:**
- A) 5–6 standart toifa + "boshqa" (izoh majburiy) — tahlilga qulay
- B) Faqat erkin matn — tez, lekin guruhlab bo'lmaydi
- C) Keyin — hozirgi erkin sabab qoladi

### Q236. Downtime (to'xtash) sabab kodlarini boyitish
**Nima:** Mavjud `downtime_reason_codes` ro'yxatini zavodga moslab to'ldirish (changeover, qog'oz uzilishi, bo'yoq almashtirish, elektr, material kutish, tushlik...).
**Nega kerak:** To'g'ri sabab kodlari OEE'ning "qaerda vaqt yo'qoladi" tahlilini real qiladi; umumiy kodlar bilan sabab ko'rinmaydi.
**Variantlar:**
- A) Karton/qadoq sexiga xos to'liq kodlar ro'yxati (15–25 ta) — aniq tahlil
- B) Mavjud umumiy kodlar (mexanik/elektr/material/operator/boshqa) — yetarli minimal
- C) Keyin — hozirgi kodlar qoladi

### Q237. Rejali vs rejasiz to'xtash ajratish
**Nima:** Har to'xtashni rejali (changeover, tushlik, texxizmat) yoki rejasiz (buzilish, material yo'q) deb belgilash.
**Nega kerak:** OEE'da rejali to'xtash Availability'ga, rejasiz boshqacha ta'sir qiladi; ajratmasa OEE noto'g'ri pasayadi.
**Variantlar:**
- A) Har sababkodga rejali/rejasiz/sifat turi biriktiriladi (avtomatik) — to'g'ri OEE
- B) Operator har safar qo'lda tanlaydi — moslashuvchan, lekin xatoga moyil
- C) Keyin — hozircha hammasi bir xil hisoblanadi

### Q238. Downtime'ni kim va qachon kiritadi
**Nima:** To'xtash yuz berganda operator darhol kiritadimi yoki usta smena oxirida to'ldiradimi.
**Nega kerak:** Real vaqtda kiritilsa jonli monitoring va tez reaksiya bo'ladi; keyin to'ldirilsa ma'lumot to'liq, lekin kech va noaniq.
**Variantlar:**
- A) Operator darhol (boshlanishi avto, sabab keyin) — jonli va aniq
- B) Usta smena oxirida jamlab kiritadi — yengil, lekin kechikkan
- C) Aralash — uzun to'xtash darhol, qisqasi keyin

### Q239. OEE'ni qaysi darajada ko'rsatish
**Nima:** OEE (Availability × Performance × Quality) qaysi kesimda hisoblanadi — mashina, smena, brigada, butun sex.
**Nega kerak:** Karta-modelda har birlik o'z GSD'siga ega; OEE darajasi bonus va reyting bilan bog'lanadi.
**Variantlar:**
- A) Hamma darajada (mashina + smena + brigada + sex) — to'liq ko'rinish
- B) Faqat mashina + sex — soddaroq, brigada bali yo'q
- C) Keyin — hozirgi mashina-bo'yicha OEE qoladi

### Q240. OEE maqsad (target) va ogohlantirish chegarasi
**Nima:** Har mashina/sexga OEE maqsadi (masalan 65%) va kritik chegara (masalan 40%) belgilash.
**Nega kerak:** Maqsadsiz OEE shunchaki raqam; chegara bo'lsa tushib ketganda avto-signal va GSD bajarilishi o'lchanadi.
**Variantlar:**
- A) Har mashina/sexga alohida maqsad + kritik chegara — moslashuvchan, real
- B) Butun zavodga bitta umumiy maqsad — sodda, lekin qo'pol
- C) Keyin — hozircha maqsadsiz, faqat raqam

### Q241. Jonli monitoring ekrani (sex tablosi)
**Nima:** Sexda katta ekran/dashboard — har mashina holati (ishlayapti/to'xtagan/SOS), joriy miqdor, OEE jonli.
**Nega kerak:** Bir qarashda butun sex ko'rinadi; to'xtagan mashina darhol e'tiborga tushadi, "ko'rinmas yo'qotish" kamayadi.
**Variantlar:**
- A) To'liq jonli tablo (har mashina rangli holat + jonli OEE/miqdor) — eng ta'sirli
- B) Soddalashtirilgan ro'yxat (ishlayapti/to'xtagan soni) — yengil
- C) Keyin — hozircha faqat hisobot sahifasi

### Q242. Jonli yangilanish tezligi
**Nima:** Monitoring ekrani qanchalik tez yangilanadi — soniyada (real-time push) yoki har necha daqiqada.
**Nega kerak:** Tez yangilanish jonli his beradi, lekin tizimga yuk; sekin yangilanish yengil, lekin SOS/to'xtash kech ko'rinadi.
**Variantlar:**
- A) Real-time (mashina holati o'zgarishi bilan darhol) — SOS/to'xtash zudlik bilan
- B) Har 1–5 daqiqada yangilanish — yengil, kechikishga toqat qilinadi
- C) Keyin — qo'lda yangilash (sahifa refresh)

### Q243. To'xtagan mashina avto-ogohlantirish
**Nima:** Mashina belgilangan vaqtdan ko'p to'xtab tursa (masalan 15 daqiqa) avtomatik usta/direktorga signal.
**Nega kerak:** Uzoq to'xtash = katta yo'qotish; avto-signal bo'lmasa hech kim sezmay qolishi mumkin.
**Variantlar:**
- A) Avto-signal bosqichli (15 daq → usta, 30 daq → direktor) — kafolatli reaksiya
- B) Faqat ekranda rang o'zgaradi (signal yo'q) — passiv
- C) Keyin — hozircha ogohlantirish yo'q

### Q244. Operator kartasiga ulash (karta-model)
**Nima:** Har operator/brigadir karta-modeldagi lavozim kartasiga bog'lanadi (razryad + GSD + talab).
**Nega kerak:** Karta-model = sizning asosiy vizyoningiz; operator natijasi kartaga yozilmasa oylik/reyting/o'sish ishlamaydi.
**Variantlar:**
- A) Har sessiya/brigada natijasi operator kartasiga yoziladi (GSD bajarilishi) — vizyonga to'liq mos
- B) Natija faqat sex umumiy hisobotiga, kartaga keyin — qisman
- C) Keyin — karta-model ulanmaydi

### Q245. Operator GSD (ЦКП) ko'rsatkichi
**Nima:** Operator/brigada kartasining haftalik GSD'si nima bo'ladi — masalan "yaroqli dona soni", "OEE", "norma ichida sarf".
**Nega kerak:** GSD aniq bo'lmasa operatorni nimaga baholashni bilib bo'lmaydi; ShVB modelida har lavozimda statistik ko'rsatkich bo'lishi shart.
**Variantlar:**
- A) Bir nechta GSD (yaroqli miqdor + OEE + sarf normasi) vaznli ball — to'liq
- B) Bitta asosiy GSD (yaroqli dona soni) — sodda, tushunarli
- C) Keyin — GSD'ni egasi alohida belgilaydi

### Q246. Razryad (malaka darajasi) va natija bog'lanishi
**Nima:** Operatorning razryadi (1–6) natija normasi va oyligiga ta'sir qiladimi — yuqori razryad = yuqori norma/stavka.
**Nega kerak:** Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; MES natijasi razryadni tasdiqlashi yoki ko'tarishi mumkin.
**Variantlar:**
- A) Razryad normani va bahoni belgilaydi, MES natijasi razryad-o'sishga ta'sir qiladi — vizyonga mos
- B) Razryad faqat ko'rsatiladi, hisobga olinmaydi — ma'lumot, lekin ta'sirsiz
- C) Keyin — razryad MES'da ishlatilmaydi

### Q247. Brak (defekt) sababini toifalash
**Nima:** Brak yozilganda sababi tayyor ro'yxatdan tanlanadi (kesim xatosi, bo'yoq, yopishqoqlik, material nuqsoni...).
**Nega kerak:** Sifat (Quality) OEE va kim/nima brak chiqarayotganini bilish uchun sabab kerak; faqat "brak soni" muammoni ko'rsatmaydi.
**Variantlar:**
- A) Tayyor brak-sabab toifalari + masъul bosqich — sifat tahlili real
- B) Faqat brak soni (sababsiz) — yengil, lekin sababsiz
- C) Keyin — hozircha faqat son

### Q248. Smenadan smenaga topshirish (handover)
**Nima:** Smena oxirida keyingi smenaga holat topshirish yozuvi — tugamagan order, nosozlik, material qoldig'i.
**Nega kerak:** Topshiruvsiz keyingi smena nimadan boshlashni bilmaydi; muammolar takrorlanadi va javobgarlik yo'qoladi.
**Variantlar:**
- A) Rasmiy handover yozuvi (tugamagan ish + nosozlik + izoh, keyingi smena tasdiqlaydi) — javobgarlik aniq
- B) Erkin izoh maydoni — tez, lekin tuzilmasiz
- C) Keyin — handover yo'q

### Q249. Ish topshirig'i (work order) MES'ga qanday tushadi
**Nima:** Operator nima ishlab chiqarishini rejadan (PP) avtomatik oladimi yoki usta qo'lda biriktiradimi.
**Nega kerak:** Reja bilan bog'lanish MES'ning ma'nosi; avto bo'lsa reja-fakt taqqoslash ishlaydi, qo'lda bo'lsa uzilish bo'ladi.
**Variantlar:**
- A) Rejadan (PP) avtomatik — operator ro'yxatdan tanlaydi, reja-fakt bog'liq
- B) Usta qo'lda biriktiradi — moslashuvchan, lekin rejaga bog'lanmaydi
- C) Keyin — hozirgi work-order oqimi qoladi

### Q250. Reja vs fakt (ishlab chiqarish bajarilishi)
**Nima:** Smena/order yakunida rejalashtirilgan miqdor bilan haqiqiy miqdorni taqqoslovchi bajarilish% hisoboti.
**Nega kerak:** Reja qancha bajarilganini ko'rsatadi; bu GSD va smena bali asosini beradi.
**Variantlar:**
- A) Har order va smenada reja/fakt/farq% + sabab (kam bajarilsa) — to'liq nazorat
- B) Faqat kunlik umumiy fakt — yengil, lekin reja bilan bog'lanmagan
- C) Keyin — hozircha faqat fakt miqdor

### Q251. Smenani baholash (ball)
**Nima:** Har smena/brigada uchun umumiy ball (0–100) — OEE + bajarilish + brak + intizomdan jamlanadi (kodda MES_SCORE_MAX bor).
**Nega kerak:** Bitta tushunarli ball reyting/bonus uchun asos; alohida raqamlar boshliqqa tushunarsiz.
**Variantlar:**
- A) Vaznli ball (OEE + reja-fakt + brak + sarf) — bitta ko'rsatkich, sozlanadigan vazn
- B) Faqat OEE ball sifatida — sodda, lekin tor
- C) Keyin — ball hozircha yo'q

### Q252. Bonus/reytingga ulanish
**Nima:** Smena/brigada bali oylik bonus yoki reytingga avtomatik ta'sir qiladimi.
**Nega kerak:** ShVB modelida natija → reyting → bonus zanjiri bor; ulanmasa ko'rsatkich shunchaki ma'lumot bo'lib qoladi.
**Variantlar:**
- A) Ball → A/B/C toifa → bonus avto-hisob (payroll bilan) — to'liq motivatsiya
- B) Ball faqat reytingda ko'rinadi, bonus qo'lda — qisman
- C) Keyin — bonus bilan bog'lanmaydi

### Q253. AI ishlab chiqarish nazoratchisi
**Nima:** AI agent jonli ma'lumotni kuzatib anomaliya (g'ayritabiiy to'xtash, sarf oshishi, OEE pasayishi) topib xulosa yozadi (kodda mes-monitor/production-agent bor).
**Nega kerak:** Inson hammasini kuzata olmaydi; AI signal berib "ko'rinmas yo'qotish"ni ochadi va kunlik hisobot yozadi.
**Variantlar:**
- A) AI jonli kuzatadi + kunlik hisobot + anomaliya signali — vizyonga mos
- B) AI faqat so'ralganda tahlil qiladi — yengil, passiv
- C) Keyin — AI nazorat yo'q

### Q254. Materiallar partiyasini (lot) kuzatish
**Nima:** Sessiyada ishlatilgan material qaysi partiyadan (lot/rulon) kelganini yozish.
**Nega kerak:** Brak chiqsa qaysi material partiyasidan ekanini topish va yetkazib beruvchini baholash uchun kerak; sifat dolzarbligi.
**Variantlar:**
- A) Har sessiyada ishlatilgan partiya/rulon yoziladi — to'liq kuzatuv (traceability)
- B) Faqat material turi, partiyasiz — yengil, lekin sababgacha bormaydi
- C) Keyin — partiya kuzatuvi yo'q

### Q255. Texkarta amal qilinishi (adherence)
**Nima:** Operator routing/texkartadagi bosqichlarga amal qildimi — qadamlarni belgilab borish va chetlashuvni qayd qilish.
**Nega kerak:** Standartdan chetlash brak va xavfsizlik muammosini keltiradi; amal-qilinishni o'lchamasa sifat barqaror bo'lmaydi.
**Variantlar:**
- A) Har bosqich belgilanadi (checklist) + chetlashuv qaydi — sifat standartlashadi
- B) Faqat yakuniy "texkarta bo'yicha bajarildi" belgisi — yengil
- C) Keyin — texkarta amal qilinishi kuzatilmaydi

---

## 9. QC / Sifat

### Q256. Inspeksiya nuqtalari (qancha bosqichda tekshiramiz)
**Nima:** Mahsulot tayyor bo'lgunicha qaysi bosqichlarda sifat tekshiruvi o'tkazilishini belgilash.
**Nega kerak:** Brak qancha erta topilsa, shuncha kam pul yo'qoladi. Faqat oxirida tekshirsak, butun partiya brak chiqishi mumkin.
**Variantlar:**
- A) To'rt nuqta (HOP-4: xom-ashyo kirimi, bosib-chiqarish, biriktirish/yelimlash, final) — har bosqichda ushlab qolinadi, eng kam yo'qotish
- B) Ikki nuqta (kirim + final) — soddaroq, lekin o'rtada brak yashirin qoladi
- C) Faqat final-inspeksiya — eng oson, lekin xavfli (butun partiya yo'qolishi mumkin)
- D) Keyin — hozir kerak emas

### Q257. Inspeksiya rejasini kartaga bog'lash
**Nima:** Har bir mahsulot turi (yoki buyurtma kartasi) uchun "nimani, qanday, qancha tekshirish kerak" degan plan saqlash.
**Nega kerak:** Har xil mahsulotni har xil tekshirish kerak — pitstsa qutisi va dori qadog'i bir xil emas. Plan bo'lmasa, inspektor "boshidan o'ylab" tekshiradi.
**Variantlar:**
- A) Har mahsulot/karta turiga inspeksiya-plani (parametrlar + tolerans + namuna soni) — standart, takrorlanmas xato
- B) Umumiy bitta plan hamma mahsulotga — sodda, lekin noaniq
- C) Plan yo'q, inspektor o'zi qaror qiladi — eng tez, sifat beqaror
- D) Keyin

### Q258. Namuna olish qoidasi (AQL / nechta dona tekshiriladi)
**Nima:** Partiyadan necha dona namuna olib tekshirishni belgilovchi qoida (masalan 1000 donadan 50 ta).
**Nega kerak:** Hamma donani tekshirish qimmat va sekin. Statistik namuna qoidasi sifatni kafolatlab, vaqtni tejaydi.
**Variantlar:**
- A) Standart AQL jadvali (partiya hajmiga qarab namuna + qabul/rad chegarasi) — xalqaro qoidaga mos, mijozga ishonchli
- B) Foiz bo'yicha (masalan har partiyadan 5%) — sodda tushuniladi
- C) Inspektor ko'zi bilan ("yetarli ko'rinadi") — qoidasiz, nizoga sabab
- D) Keyin

### Q259. Brak/defekt turlari ro'yxati (master-data)
**Nima:** Qanday defektlar bo'lishi mumkinligining yagona ro'yxati (rang nomos, qiyshiq bosma, yelim ochilgan, o'lcham xato, dog', burma va h.k.).
**Nega kerak:** Yagona ro'yxat bo'lmasa, har inspektor brakni har xil yozadi va keyin tahlil qilib bo'lmaydi ("qaysi defekt ko'p?").
**Variantlar:**
- A) Tasniflangan ro'yxat (bosma/biriktirish/material/o'lcham guruhlari + har biri kod) — tahlilga tayyor
- B) Oddiy yassi ro'yxat (guruhsiz) — sodda
- C) Erkin matn (inspektor o'zi yozadi) — moslashuvchan, lekin tahlil qilib bo'lmaydi
- D) Keyin

### Q260. Defektning og'irlik darajasi (kritik / jiddiy / kichik)
**Nima:** Har bir defektni og'irligiga qarab toifalash — masalan "kritik" (mijozga ketmaydi), "jiddiy", "kichik".
**Nega kerak:** Bir dona dog' bilan butun partiyani rad qilish noto'g'ri; lekin kritik defektni o'tkazib yuborish mijozni yo'qotadi. Darajasi qaror qabul qilishni avtomatlashtiradi.
**Variantlar:**
- A) Uch daraja (kritik / jiddiy / kichik) + har biriga chegara — aniq qaror qoidasi
- B) Ikki daraja (qabul bo'ladi / bo'lmaydi) — sodda
- C) Darajasiz, hamma defekt teng — oson, lekin adolatsiz
- D) Keyin

### Q261. Bosqichli tasdiq zanjiri (dizayn → texnik → QC)
**Nima:** Buyurtma ishlab chiqarishga ketishdan oldin uch bo'g'in (dizayn, texnolog, sifat) ketma-ket tasdiq berishi.
**Nega kerak:** Bir bo'g'in xato qilsa, keyingisi ushlab qoladi. Tasdiqsiz ishga tushgan buyurtma — eng katta brak manbai.
**Variantlar:**
- A) Majburiy 3-bosqich zanjir (har biri imzolaydi, biri rad qilsa to'xtaydi) — eng ishonchli
- B) Faqat QC tasdig'i (dizayn/texnik norasmiy) — tezroq, lekin xavf yuqori
- C) Tasdiqsiz, ishchi o'zi boshlaydi — eng tez, eng xavfli
- D) Keyin

### Q262. Tasdiq blokirovkasi (tasdiqsiz ishlab chiqarish boshlanmasin)
**Nima:** Tasdiq zanjiri to'liq bo'lmaguncha tizim ishlab chiqarish buyrug'ini ochishga ruxsat bermasligi.
**Nega kerak:** "Keyin tasdiqlatamiz" deb boshlangan ish ko'pincha brak bo'ladi. Tizim qattiq to'sib qo'ysa, qoida buzilmaydi.
**Variantlar:**
- A) Qattiq blok — tasdiqsiz MES/ishlab chiqarish ochilmaydi — qoida temir
- B) Yumshoq ogohlantirish (boshlash mumkin, lekin qizil belgi qoladi) — moslashuvchan
- C) Blok yo'q, faqat log — erkin, lekin nazoratsiz
- D) Keyin

### Q263. Final-inspeksiya va jo'natishni bog'lash
**Nima:** Tovar omborga/mijozga jo'natilishdan oldin final-inspeksiya "o'tdi" deган belgi qo'yilishi shart bo'lishi.
**Nega kerak:** Tekshirilmagan tovar mijozga ketsa — reklamatsiya, qaytarish, obro' zarari. Final-blok buni to'sadi.
**Variantlar:**
- A) Final "o'tdi" belgisisiz jo'natish bloklanadi — sifat kafolati
- B) Ogohlantirish bilan jo'natishga ruxsat — tezkor, lekin teshikli
- C) Bog'liqlik yo'q — ombor mustaqil jo'natadi — xavfli
- D) Keyin

### Q264. Karantin/ushlab qolish (brak partiyani ajratish)
**Nima:** Brak yoki shubhali partiyani omborda "karantin" holatiga o'tkazib, sotuvga/jo'natishga chiqmasligini ta'minlash.
**Nega kerak:** Brak tovar yaxshi tovar bilan aralashib ketsa, mijozga noto'g'ri ketadi. Karantin uni jismonan va tizimda ajratadi.
**Variantlar:**
- A) Avtomatik karantin holati (rad bo'lgan partiya bloklanadi, faqat QC chiqaradi) — xavfsiz
- B) Qo'lda belgi (inspektor karantinga qo'yadi) — moslashuvchan
- C) Karantin yo'q, faqat hisobot — oson, lekin aralashish xavfi
- D) Keyin

### Q265. Brak bilan nima qilish qarori (qayta ishlash / utilizatsiya / chegirma)
**Nima:** Brak topilganda uning taqdirini hal qilish: qayta ishlash, ikkinchi nav sifatida sotish, yoki butunlay yo'q qilish.
**Nega kerak:** Har bir brak — pul. To'g'ri qaror (qayta ishlash yoki chegirma) yo'qotishni kamaytiradi.
**Variantlar:**
- A) Har brakka qaror yozuvi (qayta ishlash / 2-nav / utilizatsiya + sababi + ruxsat bergan) — to'liq nazorat
- B) Faqat ikki holat (qayta ishlash / chiqarib tashlash) — sodda
- C) Qaror yozilmaydi, og'zaki hal qilinadi — tez, lekin izsiz
- D) Keyin

### Q266. Reklamatsiya (mijoz shikoyati) ro'yxati
**Nima:** Mijozdan kelgan sifat shikoyatlarini ro'yxatga olish, sababini topish va yopish jarayoni.
**Nega kerak:** Shikoyat yozilmasa — takror xato bo'ladi. Ro'yxat "qaysi defekt mijozni eng ko'p bezovta qiladi"ni ko'rsatadi.
**Variantlar:**
- A) To'liq reklamatsiya kartasi (mijoz + buyurtma + defekt + sabab tahlili + tuzatuv + yopilish) — takror xatoni kamaytiradi
- B) Oddiy shikoyat jurnali (kim, qachon, nima) — sodda
- C) Telefon/og'zaki, tizimsiz — hech narsa kerakmas, lekin yo'qoladi
- D) Keyin

### Q267. Reklamatsiyani buyurtma va partiyaga ulash
**Nima:** Har bir shikoyatni aynan qaysi buyurtma/partiya/smenadan chiqqaniga bog'lash.
**Nega kerak:** "Qaysi partiyadan, qaysi smena, qaysi material" — buni bilsak, ildizini topib, takrorlanmasligini ta'minlaymiz.
**Variantlar:**
- A) Majburiy ulash (buyurtma + partiya + smena + material lot) — ildiz sababni topadi
- B) Faqat buyurtmaga ulash — qisman izlanadi
- C) Ulanmaydi, alohida ro'yxat — oson, lekin foydasiz
- D) Keyin

### Q268. Tuzatuvchi chora (8D / ildiz-sabab tahlili)
**Nima:** Jiddiy brak yoki reklamatsiyada nafaqat "tuzatdik", balki "nega bo'ldi va qayta bo'lmasligi uchun nima qildik"ni yozish.
**Nega kerak:** Faqat "tuzatdik" desak, xato qaytadi. Ildiz-sabab tahlili muammoni butunlay yopadi.
**Variantlar:**
- A) Ildiz-sabab + tuzatuvchi chora + tekshiruv sanasi (mas'ul bilan) — muammo qaytmaydi
- B) Faqat tuzatuvchi chora yoziladi (ildizsiz) — qisman
- C) Tahlil yo'q, faqat brakni qaytarish — tez, lekin takrorlanadi
- D) Keyin

### Q269. Sifat sertifikati (mahsulot pasporti)
**Nima:** Jo'natilgan partiyaga sifat sertifikati/pasporti chiqarish (qaysi normalarga mos, qaysi testlardan o'tgan).
**Nega kerak:** Yirik mijozlar (oziq-ovqat, dori qadog'i) sertifikatsiz qabul qilmaydi. Avtomatik sertifikat — sotuvga eshik ochadi.
**Variantlar:**
- A) Avtomatik sertifikat (test natijalaridan PDF, raqamli kod bilan) — mijozga professional
- B) Qo'lda shablon to'ldiriladi — sodda, lekin sekin
- C) Sertifikat yo'q — kerak emas, lekin yirik mijoz qochadi
- D) Keyin

### Q270. Fizik normalar (o'lcham, zichlik, qalinlik, mustahkamlik)
**Nima:** Karton uchun fizik o'lchov normalarini saqlash: gramaj, qalinlik, siqilishga chidamlilik (ECT/BCT), namlik.
**Nega kerak:** Karton sifati raqam bilan o'lchanadi. Norma bo'lmasa, "yaxshi/yomon" — faqat his bilan, isbotsiz.
**Variantlar:**
- A) To'liq fizik normalar jadvali (har parametr + min/max + o'lchov asbobi) — aniq, isbotli
- B) Asosiy 3-4 parametr (gramaj, qalinlik, namlik) — yetarli boshlanish
- C) Normasiz, ko'z bilan baho — oson, lekin nizoli
- D) Keyin

### Q271. Kimyoviy/xavfsizlik normalari (oziq-ovqat qadog'i uchun)
**Nima:** Oziq-ovqatga tegadigan qadoq uchun kimyoviy xavfsizlik (migratsiya, og'ir metallar, bo'yoq xavfsizligi) normalarini yuritish.
**Nega kerak:** Oziq-ovqat qadog'ida xavfsizlik majburiy. Bu bo'lmasa, yirik oziq-ovqat mijozlari bilan ishlay olmaysiz.
**Variantlar:**
- A) Kimyoviy normalar + lab natijalari + muddat nazorati — oziq-ovqat bozoriga kirish
- B) Faqat "oziq-ovqatga yaroqli" belgisi (test bog'lanmagan) — sodda
- C) Kerak emas — hozir oziq-ovqat mijozi yo'q
- D) Keyin

### Q272. Lab/test natijalarini kiritish
**Nima:** O'lchov va test natijalarini (raqamlar) tizimga kiritish va normaga avtomatik solishtirib "o'tdi/o'tmadi" chiqarish.
**Nega kerak:** Inspektor o'zi hisoblasa, xato qiladi. Tizim avtomatik solishtirsa — tez va xatosiz qaror.
**Variantlar:**
- A) Raqam kiritiladi → tizim normaga solishtirib o'tdi/o'tmadini chiqaradi — avtomatik, xatosiz
- B) Inspektor o'zi "o'tdi/o'tmadi"ni belgilaydi — sodda, lekin sub'yektiv
- C) Qog'ozda yoziladi, tizimsiz — eng oson, lekin tahlilsiz
- D) Keyin

### Q273. Sifat trendi — DPMO / sigma daraja
**Nima:** Vaqt o'tishi bilan brak darajasini ko'rsatuvchi raqam: million donadan nechtasi brak (DPMO) va sigma daraja.
**Nega kerak:** "Sifatimiz yaxshilanyaptimi yoki yomonlashyaptimi?" — buni faqat trend raqami aytadi. His bilan bilib bo'lmaydi.
**Variantlar:**
- A) DPMO + sigma daraja avtomatik (har modul/smena/mahsulot kesimida) — boshqaruvga aniq ko'rsatkich
- B) Oddiy brak foizi (% brak) — tushunarli, lekin yuzaki
- C) Trend yo'q, faqat joriy holat — oson, lekin yo'nalish ko'rinmaydi
- D) Keyin

### Q274. Sifat dashboardi (kim ko'radi)
**Nima:** Sifat ko'rsatkichlarini (brak %, top defektlar, ochiq reklamatsiyalar, trend) bitta ekranda ko'rsatish.
**Nega kerak:** Egaga va bo'lim boshlig'iga real holatni bir qarashda ko'rsatadi. Hisobotni kutib o'tirmaydi.
**Variantlar:**
- A) Rolga qarab dashboard (ega — umumiy trend, sifat boshlig'i — detal, inspektor — o'z vazifasi) — har kimga keragi
- B) Bitta umumiy dashboard hammaga — sodda
- C) Dashboard yo'q, faqat hisobot so'rovga ko'ra — minimal
- D) Keyin

### Q275. Pareto tahlil (eng ko'p brak qaysi sababdan)
**Nima:** Defektlarni chastotasiga qarab tartiblab, "eng ko'p muammo qaysidan" degan ko'rinishni chiqarish.
**Nega kerak:** Muammolarning 80% odatda 20% sababdan. Pareto eng og'riqli sababni ko'rsatadi — kuchni o'sha yerga yo'naltiriladi.
**Variantlar:**
- A) Avtomatik Pareto (defekt/sabab/smena/material kesimida) — diqqatni to'g'ri qaratadi
- B) Oddiy "top 5 defekt" ro'yxati — sodda
- C) Yo'q, hamma defektni teng ko'rish — oson, lekin yo'nalishsiz
- D) Keyin

### Q276. Inspektsiyani kim qiladi (rol va razryad)
**Nima:** Inspeksiya va tasdiqni kim qila olishini belgilash — har bo'g'inning roli va malaka razryadi.
**Nega kerak:** Tasdiqni har kim qila olsa, mas'uliyat yo'qoladi. Aniq rol — sifat uchun aniq javobgar.
**Variantlar:**
- A) Razryadga bog'liq ruxsat (final-tasdiqni faqat malakali QC, oraliqni operator) — mas'uliyat aniq
- B) Faqat sifat bo'limi tekshiradi — sodda, lekin sekin (operator ishtirok etmaydi)
- C) Har kim tekshira oladi — tez, lekin javobgarsiz
- D) Keyin

### Q277. Operator o'z-o'zini nazorati (kartaga bog'liq)
**Nima:** Har operator o'z bosqichida kichik nazorat ro'yxatini (checklist) o'zi bajarib, kartasidagi ЦКП-ga bog'lanishi.
**Nega kerak:** Sifat faqat QC ishi emas — har operator o'z mahsulotini tekshirsa, brak manbada ushlab qolinadi va karta-modeldagi natijaga ulanadi.
**Variantlar:**
- A) Har operatorga o'z-o'zini nazorat checklisti (karta ЦКП'siga bog'liq, natija reytingda) — karta-modelga to'liq mos
- B) Faqat tavsiya (checklist bor, lekin majburiy emas) — yumshoq
- C) Yo'q, faqat QC tekshiradi — sodda, lekin manba nazorati yo'q
- D) Keyin

### Q278. Sifat GSD/ЦКП ni karta-modelga ulash
**Nima:** Sifat natijalarini (brak %, reklamatsiya soni) operator va inspektor kartasidagi statistik ko'rsatkichga (GSD) bog'lash.
**Nega kerak:** Egaling vizyoni — har karta o'z natijasi bilan o'lchanadi. Sifat ko'rsatkichi kartaga ulansa, bonus/reyting adolatli bo'ladi.
**Variantlar:**
- A) Sifat ko'rsatkichi avtomatik kartaga oqadi (haftalik GSD + reyting + bonus) — vizyonga to'liq mos
- B) Qo'lda kirgaziladi (sifat boshlig'i baholaydi) — moslashuvchan
- C) Ulanmaydi, sifat alohida turadi — sodda, lekin karta-modeldan uzilgan
- D) Keyin

### Q279. Sifat anomaliyasida ogohlantirish (Telegram/bildirishnoma)
**Nima:** Brak darajasi chegaradan oshsa yoki kritik defekt topilsa, mas'ullarga avtomatik xabar yuborish.
**Nega kerak:** Muammoni darhol bilsa, zudlik bilan to'xtatadi. Kechikkan xabar — ko'p brak degani.
**Variantlar:**
- A) Avtomatik ogohlantirish (chegara oshsa → smena boshlig'i + QC + ega, Telegram) — tezkor reaksiya
- B) Faqat kunlik xulosa (anomaliya bo'lsa kun oxirida) — sodda
- C) Ogohlantirish yo'q, hisobotda ko'rinadi — minimal
- D) Keyin

### Q280. Sifat narxi (brak qancha pulga tushyapti)
**Nima:** Brak, qayta ishlash va reklamatsiya tufayli yo'qotilgan pulni hisoblab ko'rsatish (sifat narxi — COQ).
**Nega kerak:** "Brak bizga oyiga qancha?" — bu raqam egaga sifatga investitsiya qilish kerakligini aniq ko'rsatadi.
**Variantlar:**
- A) To'liq sifat narxi (brak material + ish vaqti + qayta ishlash + reklamatsiya) — moliyaga bog'lanadi
- B) Faqat brak materialining narxi — sodda baho
- C) Hisoblanmaydi — oson, lekin yo'qotish ko'rinmas
- D) Keyin

### Q281. Yetkazib beruvchi materialini baholash (kirim sifati)
**Nima:** Xom-ashyo (karton, bo'yoq, yelim) yetkazib beruvchilarning sifatini partiyama-partiya baholab, reytinglash.
**Nega kerak:** Brakning ko'p qismi yomon xom-ashyodan. Yetkazib beruvchi reytingi yomon partiyani kirimda to'sib qoladi.
**Variantlar:**
- A) Kirim inspeksiyasi + yetkazib beruvchi reytingi (brak % bo'yicha) — manba sifatini nazorat qiladi
- B) Faqat kirim "o'tdi/o'tmadi" (reytingsiz) — sodda
- C) Materialni tekshirmaymiz — oson, lekin ildiz brak kiradi
- D) Keyin

### Q282. Sifat hujjati/normativlarini boshqarish (versiya nazorati)
**Nima:** Normalar, standartlar va inspeksiya yo'riqnomalarining eng so'nggi versiyasini markazda saqlash va eskisini almashtirish.
**Nega kerak:** Inspektor eski normaga qarab ishlasa — xato qaror. Versiya nazorati hamma bitta to'g'ri qoidada ishlashini ta'minlaydi.
**Variantlar:**
- A) Markaziy normativ + versiya + "amaldagisi" belgisi — hamma bir qoidada
- B) Oddiy fayllar jildi (versiyasiz) — sodda
- C) Har bo'limda o'z nusxasi — tarqoq, mos kelmaydi
- D) Keyin

### Q283. Mobil/planshetda inspeksiya (sex ichida)
**Nima:** Inspektor sex ichida planshet/telefonda to'g'ridan-to'g'ri natija kiritishi, surat ilova qilishi.
**Nega kerak:** Qog'ozga yozib keyin kompyuterga ko'chirish — vaqt va xato. Joyida kiritish tez va aniq, surat dalil bo'ladi.
**Variantlar:**
- A) Mobil inspeksiya + brak surati ilovasi (joyida, oflayn ham) — tez va dalilli
- B) Kompyuterda kiritish (sexdan keyin) — sodda, lekin kechikadi
- C) Qog'ozda, keyin ko'chiriladi — eng arzon, lekin xatoli
- D) Keyin

### Q284. Sifat darvozasi va ishlab chiqarish/ombor bilan integratsiya
**Nima:** Sifat "o'tdi/o'tmadi" natijasi ishlab chiqarish (MES) va ombor (WMS) bilan avtomatik bog'lanib, oqimni boshqarishi.
**Nega kerak:** Sifat alohida tursa, brak tovar oldinga o'tib ketadi. Bog'langan darvoza brakni avtomatik to'xtatadi va yaxshini o'tkazadi.
**Variantlar:**
- A) To'liq integratsiya (QC o'tdi → keyingi bosqich/ombor ochiladi; o'tmadi → karantin) — oqim avtomatik nazoratda
- B) Qisman (faqat final QC omborga bog'lanadi) — yetarli boshlanish
- C) Mustaqil sifat moduli (bog'lanmagan) — sodda, lekin teshikli
- D) Keyin

### Q285. Qayta-inspeksiya va qayta ishlangan tovar nazorati
**Nima:** Qayta ishlangan (rework) tovarni qaytadan tekshirib, "o'tdi" bo'lsagina oldinga o'tkazish.
**Nega kerak:** Qayta ishlangan tovar baribir brak chiqishi mumkin. Qayta-inspeksiyasiz mijozga ikki marta yomon ketadi.
**Variantlar:**
- A) Majburiy qayta-inspeksiya (rework → qayta test → faqat o'tsa chiqadi) — ikkilamchi brakni to'sadi
- B) Faqat ko'z bilan qayta ko'rish — sodda
- C) Qayta tekshirmaydi (bir marta ishlandi, o'tdi deb hisoblanadi) — tez, xavfli
- D) Keyin

---

## 10. Ombor / WMS

### Q286. Qoldiq nima asosda hisoblanadi (hop-5 omborlar)
**Nima:** Har bir material qancha qolgani qaysi jadval/manbadan olinishi — bizda hozir ikkita parallel stok manbasi bor (`warehouse_stock` va `current_stock`/`stocks`).
**Nega kerak:** Ikki manba bo'lsa, bir joyda 100 dona, boshqa joyda 80 dona ko'rinadi — hech kim qaysisiga ishonishni bilmaydi, hisobot xato chiqadi.
**Variantlar:**
- A) Bitta kanonik jadval — barcha qoldiq faqat `warehouse_stock`dan, qolgani unga ko'zgu (view) — yagona haqiqat, chalkashlik yo'q.
- B) Har ombor turi alohida jadval (xom-ashyo, tayyor mahsulot, MRO alohida) — moslashuvchan, lekin sinxronlash murakkab.
- C) Keyin — hozir kerak emas.

### Q287. Ombor turlari ro'yxati (master-data)
**Nima:** Zavodda qaysi ombor turlari rasman mavjud (xom-ashyo, tayyor mahsulot, yarim-tayyor, MRO/ehtiyot qism, brak/karantin, ijaraga olingan).
**Nega kerak:** Ro'yxat aniq bo'lmasa, har bo'lim o'zicha "ombor" yaratadi va hisobot tarqoq bo'ladi. Bu ombor Dashboard filtrining asosi.
**Variantlar:**
- A) 6 standart tur: Xom-ashyo (RM-MAIN), Tayyor mahsulot (FG), Yarim-tayyor, MRO/ehtiyot, Brak/Karantin, Ijara — to'liq qamrov, ShVB 7-otdelenie (Administratsiya) ostida.
- B) 3 asosiy tur: Xom-ashyo, Tayyor mahsulot, Boshqa — sodda, tez ishga tushadi.
- C) Keyin — hozir kerak emas.

### Q288. Mol qabul qilish (kirim) jarayoni
**Nima:** Yetkazib beruvchidan kelgan mahsulotni omborga kiritish: hujjat, miqdor, sifat tekshiruvi.
**Nega kerak:** Hozir kirim qaysidir joyda yozilsa-da, rasmiy "qabul akti" + sifat darvozasi yo'q — kelgan brak material to'g'ri omborga kirib ketadi.
**Variantlar:**
- A) To'liq qabul oqimi: yetkazib beruvchi → miqdor tekshirish → sifat (QC) darvozasi → omborga kirim yoki karantinga — nazorat to'liq, brak ushlanadi.
- B) Oddiy kirim: faqat miqdor va material kiritiladi, sifat alohida emas — tez, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q289. Mol qabul → buyurtma bilan bog'lash
**Nima:** Kelgan molni qaysi xarid buyurtmasiga (PO) tegishli ekanini avtomatik biriktirish.
**Nega kerak:** Bog'lanmasa, "buyurtma berdik, keldi-kelmadi" noaniq qoladi va ortiqcha/kam yetkazish ko'rinmaydi (3-way match yo'q).
**Variantlar:**
- A) Avtomatik 3-tomonlama moslik: PO ↔ qabul akti ↔ schyot — farq bo'lsa ogohlantiradi — to'liq nazorat.
- B) Qo'lda: omborchi qabulda PO raqamini tanlaydi — sodda, lekin xato ehtimoli bor.
- C) Keyin — hozir kerak emas.

### Q290. Ichki ko'chirish (omborlar orasi)
**Nima:** Bir ombordan ikkinchisiga material o'tkazish (masalan xom-ashyodan sexga, yoki filiallar orasi).
**Nega kerak:** Hozir ko'chirish rasman yozilmasa, material "yo'qoladi" — bir ombor minusга tushadi, boshqasi ortiqcha ko'rsatadi.
**Variantlar:**
- A) Ikki bosqichli ko'chirish: jo'natish (chiqim) + qabul (kirim) tasdig'i bilan, yo'lda holati ko'rinadi — yo'qotish bo'lmaydi.
- B) Bir bosqichli: bitta tugma bilan bir ombordan ikkinchisiga ko'chadi — tez, lekin yo'lda yo'qolishni ushlamaydi.
- C) Keyin — hozir kerak emas.

### Q291. Ko'chirishga ruxsat (kim tasdiqlaydi)
**Nima:** Material ko'chirilishidan oldin kim tasdiqlaydi — omborchi o'zi yoki ombor boshlig'i.
**Nega kerak:** Tasdiqsiz ko'chirish bo'lsa, qimmat materialni hech kim nazorat qilmaydi; ShVB tasdiqlash matritsasi mantiqiga mos kelishi kerak.
**Variantlar:**
- A) Summaga qarab: kichik summa — omborchi o'zi, katta summa — ombor boshlig'i tasdig'i (ShVB matritsasi kabi) — nazorat darajali.
- B) Hamma ko'chirish boshliq tasdig'i bilan — qattiq nazorat, lekin sekin.
- C) Keyin — hozir kerak emas.

### Q292. Inventarizatsiya (sanash) jarayoni
**Nima:** Davriy ravishda omborni qo'lda sanab, tizimdagi qoldiq bilan solishtirish.
**Nega kerak:** Sanashsiz tizimdagi raqam vaqt o'tib haqiqatdan uzoqlashadi; ShVB "inventarizatsiya aniqligi" GSD ko'rsatkichi shu yerdan keladi.
**Variantlar:**
- A) Rejali to'liq sanash: sanash varaqasi → sanaladi → tizim bilan solishtiriladi → farq akti → tuzatish — to'liq va izlanadigan.
- B) Tsiklik sanash: har kuni ombor bir qismi sanaladi (ABC bo'yicha A-guruh tez-tez) — yuk taqsimlangan.
- C) Keyin — hozir kerak emas.

### Q293. Inventarizatsiya aniqlik foizi (GSD ko'rsatkich)
**Nima:** Sanashdan keyin "tizim qancha to'g'ri bo'lgan" foizini hisoblash va saqlash (audit: bu hozir YO'Q).
**Nega kerak:** Bu ShVB bo'yicha ombor bo'limining asosiy haftalik statistikasi (GSD) — aniqlik pasaysa, muammo bor demak.
**Variantlar:**
- A) Avtomatik hisob: aniqlik% = (to'g'ri pozitsiyalar / jami) ×100, har sanashdan keyin saqlanadi va trend ko'rsatiladi — GSD-ga tayyor.
- B) Faqat farq summasi ko'rsatiladi (foizsiz) — sodda, lekin GSD trendi chiqmaydi.
- C) Keyin — hozir kerak emas.

### Q294. Inventarizatsiya farqini kim tasdiqlaydi
**Nima:** Sanashda farq chiqsa (kam yoki ortiq), uni tuzatishdan oldin kim ruxsat beradi.
**Nega kerak:** Tasdiqsiz tuzatish bo'lsa, o'g'irlik yoki xato shunchaki "tuzatib" yashiriladi — moliyaviy nazorat yo'qoladi.
**Variantlar:**
- A) Farq akti → ombor boshlig'i + moliya tasdig'i, keyin tuzatish (GLга yoziladi) — to'liq nazorat va audit izi.
- B) Omborchi o'zi tuzatadi, faqat log qoladi — tez, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q295. Kam-qoldiq darajalari (min/max/reorder)
**Nima:** Har material uchun minimal qoldiq, maksimal qoldiq va qayta buyurtma nuqtasini belgilash (qisman bor: `low_stock_alerts`, `reorder`).
**Nega kerak:** Bu chegaralarsiz material to'satdan tugaydi (ishlab chiqarish to'xtaydi) yoki ortiqcha sotib olinadi (pul muzlaydi).
**Variantlar:**
- A) Har material uchun 3 daraja (min/max/reorder) qo'lda yoki sarfga qarab avto-hisob — to'liq nazorat.
- B) Faqat minimal daraja (min) — sodda, faqat "tugayapti" ogohlantiradi.
- C) Keyin — hozir kerak emas.

### Q296. Kam-qoldiq ogohlantirish kimga boradi
**Nima:** Material reorder nuqtasiga tushganda kim xabar oladi va qanday kanal orqali.
**Nega kerak:** Ogohlantirish noto'g'ri odamga borsa yoki ko'rinmasa, foydasi yo'q — material baribir tugaydi.
**Variantlar:**
- A) Omborchi + xarid bo'limi + ombor boshlig'iga, ilovada + Telegram orqali — hech kim o'tkazib yubormaydi.
- B) Faqat ilovada ro'yxat (alert sahifasi), Telegram yo'q — sodda, lekin ko'rilmasligi mumkin.
- C) Keyin — hozir kerak emas.

### Q297. Kam-qoldiq → avtomatik xarid arizasi
**Nima:** Material reorder nuqtasiga tushganda tizim o'zi xarid arizasi (PR) loyihasini yaratsinmi.
**Nega kerak:** Avtomatik bo'lsa, "esdan chiqdi" muammosi yo'qoladi; ShVB ZVS/xarid oqimiga ulanadi.
**Variantlar:**
- A) Avtomatik PR loyihasi yaratiladi, xarid bo'limi faqat tasdiqlaydi — tez va xatosiz.
- B) Faqat ogohlantiradi, PR ni odam qo'lda yaratadi — nazorat odamda qoladi.
- C) Keyin — hozir kerak emas.

### Q298. Kunlik stok hisoboti (audit: bu YO'Q)
**Nima:** Har kuni ombor harakati xulosasi: kirim, chiqim, ko'chirish, kun oxiridagi qoldiq.
**Nega kerak:** ShVB bo'yicha bu ombor bo'limining kunlik statistikasi; rahbar har ertalab "kecha nima bo'ldi" ni bir qarashda ko'rishi kerak.
**Variantlar:**
- A) Avtomatik kunlik hisobot: har kechasi tuziladi, ertalab rahbarga Telegram/ilovada xulosa — qo'l mehnatisiz.
- B) Qo'lda tugma: omborchi kun oxirida "hisobotni tuzish" bosadi — sodda, lekin esdan chiqishi mumkin.
- C) Keyin — hozir kerak emas.

### Q299. Rulon qoldig'i (qog'oz/karton rulonlari)
**Nima:** Karton/qog'oz rulonlarining qoldig'ini alohida boshqarish — har rulon o'z og'irligi/metraji bilan, qisman sarflanganda qoldig'i qoladi.
**Nega kerak:** Karton zavodida rulon to'liq sarflanmaydi — yarmi qoladi; oddiy "dona" hisobi rulon qoldig'ini ko'rsatmaydi, material yo'qoladi.
**Variantlar:**
- A) Har rulon alohida birlik (ID, boshlang'ich og'irlik/metr, joriy qoldiq), kesilganda qoldiq yangilanadi — aniq nazorat, qoldiqlar ko'rinadi.
- B) Rulonlar umumiy kg/metr sifatida (alohida ID yo'q) — sodda, lekin qaysi rulonda qancha qolgani noaniq.
- C) Keyin — hozir kerak emas.

### Q300. Rulon qoldig'i (ostatok) qayta ishlatish
**Nima:** Kesimdan qolgan kichik rulon qoldiqlarini (ostatkalarni) ro'yxatga olib, keyingi mos buyurtmaga taklif qilish.
**Nega kerak:** Ostatkalar ro'yxatga olinmasa, ular axlatga ketadi — to'g'ridan-to'g'ri pul yo'qotish; ShVB kaizen/tejamkorlik mantiqiga mos.
**Variantlar:**
- A) Ostatok reestri: har qoldiq o'lcham/sifat bilan saqlanadi, yangi buyurtmaga mos ostatok avtomatik taklif qilinadi — material tejaladi.
- B) Faqat ro'yxat ko'rinadi (avto-taklif yo'q), omborchi o'zi qaraydi — sodda.
- C) Keyin — hozir kerak emas.

### Q301. Karantin (brak/tekshiruvdagi material)
**Nima:** Sifati shubhali yoki tekshiruvdagi materialni alohida "karantin" holatida ushlash — sotuvga/ishlab chiqarishga chiqmaydi.
**Nega kerak:** Karantin bo'lmasa, brak material ishlab chiqarishga kirib ketadi va tayyor mahsulot ham brak chiqadi.
**Variantlar:**
- A) Alohida karantin holati: qabulda yoki sifat tekshiruvda material karantinga tushadi, QC qaror chiqarmaguncha bloklangan — to'liq himoya.
- B) Faqat belgi (flag) qo'yiladi, ammo jismonan bloklanmaydi — sodda, lekin xato ishlatish mumkin.
- C) Keyin — hozir kerak emas.

### Q302. Karantindan chiqish qarori
**Nima:** Karantindagi material taqdiri kim tomonidan hal qilinadi — ishlatishga ruxsat, qaytarish yoki yo'q qilish.
**Nega kerak:** Qaror egasiz qolsa, material karantinda "muzlab" qoladi yoki nazoratsiz chiqib ketadi.
**Variantlar:**
- A) QC/sifat bo'limi qaror chiqaradi (ruxsat / yetkazib beruvchiga qaytar / brakka chiqar), har qaror loglanadi — aniq mas'uliyat.
- B) Ombor boshlig'i o'zi hal qiladi — tez, lekin sifat ekspertizasiz.
- C) Keyin — hozir kerak emas.

### Q303. Yaroqlilik muddati / partiya (срок годности, FEFO)
**Nima:** Bo'yoq, kley, plyonka kabi muddatli materiallar uchun partiya va yaroqlilik sanasini kuzatish.
**Nega kerak:** Muddat kuzatilmasa, eskirgan material ishlatiladi yoki to'satdan "yaroqsiz" deb chiqib pul yo'qoladi.
**Variantlar:**
- A) Partiya + yaroqlilik sanasi, FEFO (avval muddati tugaydigan birinchi chiqadi) + muddat yaqinlashganda ogohlantirish — minimal yo'qotish.
- B) Faqat partiya raqami (muddatsiz) — qisman izlanadi.
- C) Keyin — hozir kerak emas.

### Q304. Ombor-ijara (kirim — biz tashqi mijoz molini saqlaymiz)
**Nima:** Bizning ombor maydonimizni boshqa kompaniyaga ijaraga berib, ularning molini saqlash va haq olish (kod: `wms-rental`/`warehouse-rental` bor).
**Nega kerak:** Bo'sh ombor maydoni — yo'qotilgan daromad; ijara — qo'shimcha pul oqimi, lekin hisob-kitob va shartnoma kerak.
**Variantlar:**
- A) To'liq ijara moduli: ijarachi, maydon/joy, shartnoma muddati, oylik haq, saqlanayotgan mol — moliyaga ulanadi (daromad) — to'liq biznes.
- B) Faqat oddiy reestr: kim, qancha joy, qancha to'lov — hisob qo'lda — sodda boshlanish.
- C) Keyin — hozir kerak emas.

### Q305. Ombor-ijara to'lovi va moliya bilan bog'lanishi
**Nima:** Ijara haqi qanday hisoblanadi va qachon daromad sifatida moliyaga (GL) tushadi.
**Nega kerak:** Bog'lanmasa, ijaradan kelgan pul moliyaviy hisobotda ko'rinmaydi va debitorlik nazorati yo'qoladi.
**Variantlar:**
- A) Oylik avtomatik schyot: maydon × tarif, schyot chiqariladi, to'lov debitorlik/GL ga ulanadi — ShVB to'lanmagan schyotlar oqimiga mos.
- B) Qo'lda kiritiladi: omborchi to'lovni qo'lda belgilaydi — sodda, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q306. Ombor xaritasi / joylashuv (locator)
**Nima:** Material qaysi qatorda, javonda, yacheykada turishini belgilash (bin/location).
**Nega kerak:** Joylashuvsiz katta omborda materialni topish vaqt yeydi; tsiklik sanash va FEFO ham joyga tayanadi.
**Variantlar:**
- A) To'liq locator: zona → qator → javon → yacheyka, har material o'rni bilan — tez topiladi.
- B) Faqat zona darajasi (umumiy bo'lim) — sodda, taxminiy.
- C) Keyin — hozir kerak emas.

### Q307. Barkod / QR bilan ishlash
**Nima:** Kirim, chiqim, ko'chirish va sanashda barkod/QR skanerlash (kod: `wms-barcode` bor).
**Nega kerak:** Qo'lda kiritish sekin va xato; skaner bilan omborchi tez va xatosiz ishlaydi (POS Monitor tabletga mos).
**Variantlar:**
- A) Barcha amallar barkod orqali (kirim/chiqim/ko'chirish/sanash) tablet ilovasida — tez va aniq.
- B) Faqat sanashda barkod, qolgani qo'lda — qisman.
- C) Keyin — hozir kerak emas.

### Q308. Ombor bo'limi GSD/ЦКП (karta-model integratsiyasi)
**Nima:** Ombor bo'limi va omborchi lavozimi uchun asosiy statistik ko'rsatkich (GSD/ЦКП) ni belgilash — masalan "inventarizatsiya aniqligi %" va "kun ichida bajarilgan kirim/chiqim soni".
**Nega kerak:** Sizning karta-modelingiz bo'yicha har lavozimning o'z GSD si bor; omborchi kartasi shu ko'rsatkichlar bilan baholanadi va oyligi shunga bog'lanadi.
**Variantlar:**
- A) Omborchi kartasiga 2-3 GSD: aniqlik%, kirim/chiqim tezligi, kam-qoldiq holatlari soni — karta-modelga to'liq ulanadi.
- B) Faqat 1 umumiy GSD (aniqlik%) — sodda boshlanish.
- C) Keyin — hozir kerak emas.

### Q309. Omborchi razryadi → vakolat darajasi
**Nima:** Omborchi razryadiga (malaka darajasiga) qarab qaysi amallarni mustaqil bajara olishini belgilash.
**Nega kerak:** Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; yangi omborchi katta summali ko'chirishni o'zi qila olmasligi kerak.
**Variantlar:**
- A) Razryadga bog'liq vakolat: past razryad — faqat oddiy kirim/chiqim, yuqori razryad — inventarizatsiya/farq tuzatish — karta-modelga mos.
- B) Hamma omborchi bir xil vakolat — sodda, lekin nazorat zaif.
- C) Keyin — hozir kerak emas.

### Q310. Ombor bilan ishlab chiqarish (MES) bog'lanishi
**Nima:** Sexga material berilganda (chiqim) avtomatik ombordan yechilishi va ishlab chiqarish buyurtmasiga bog'lanishi.
**Nega kerak:** Bog'lanmasa, material "sexga ketdi" lekin omborda hali turibdi ko'rinadi — qoldiq doim xato.
**Variantlar:**
- A) Avtomatik: ishlab chiqarish buyurtmasi material talab qilganda ombordan rezerv + chiqim — qoldiq real vaqtda to'g'ri.
- B) Qo'lda: omborchi sexga berganda chiqim kiritadi — sodda, lekin kechikadi.
- C) Keyin — hozir kerak emas.

### Q311. Ombor bilan tayyor mahsulot (FG) qabuli
**Nima:** Ishlab chiqarishdan chiqqan tayyor mahsulotni tayyor-mahsulot omboriga kiritish.
**Nega kerak:** Hozir tayyor mahsulot kirimi ikki joyda yozilishi mumkin (audit: `stocks` ╳ `warehouse_stock`) — qaysisi to'g'ri noaniq.
**Variantlar:**
- A) MES tayyor mahsulot chiqarganda avtomatik kanonik FG omboriga kirim — yagona haqiqat.
- B) Omborchi qo'lda qabul qiladi — sodda, lekin ikkilanish bo'lishi mumkin.
- C) Keyin — hozir kerak emas.

### Q312. ABC tahlil (qaysi material muhim)
**Nima:** Materiallarni qiymat/aylanma bo'yicha A/B/C guruhlarga ajratish (kod: `wms-catalog`da ABC bor).
**Nega kerak:** A-guruh (eng qimmat) materiallar tez-tez sanalishi va qattiq nazorat qilinishi kerak; bu tsiklik sanashning asosi.
**Variantlar:**
- A) Avtomatik ABC: tizim aylanma/qiymatga qarab guruhlaydi, tsiklik sanash chastotasini shunga bog'laydi — aqlli nazorat.
- B) Faqat ko'rsatadi (sanashga bog'lamaydi) — ma'lumot, lekin amalga ulanmagan.
- C) Keyin — hozir kerak emas.

### Q313. Sekin aylanuvchi / o'lik zaxira (dead stock)
**Nima:** Uzoq vaqt harakatlanmagan materialni aniqlash va ogohlantirish.
**Nega kerak:** O'lik zaxira — muzlagan pul va joy; ko'rsatilmasa, ombor keraksiz mol bilan to'lib qoladi.
**Variantlar:**
- A) Avtomatik: N kun harakatlanmagan material ro'yxati + ogohlantirish (sotish/qaytarish taklifi bilan) — pul ozod bo'ladi.
- B) Faqat hisobotda ko'rinadi, ogohlantirish yo'q — passiv.
- C) Keyin — hozir kerak emas.

### Q314. Ombor inspeksiyasi (ShVB inspektor-menejer)
**Nima:** Ombor tartibi/holatini davriy tekshirish va ball berish (ShVB inspektor-menejer roli bilan).
**Nega kerak:** ShVB bo'yicha inspeksiya — ombor intizomini ushlab turadi (tartib, yorliqlash, xavfsizlik); tekshiruvsiz ombor tartibsizlanadi.
**Variantlar:**
- A) Rejali inspeksiya: mezonlar bo'yicha ball + buzilish + tuzatish rejasi, GSD-ga ulanadi — intizom nazorati.
- B) Faqat erkin izoh (mezonsiz) — sodda, lekin solishtirib bo'lmaydi.
- C) Keyin — hozir kerak emas.

### Q315. Ombor harakatlari to'liq tarixi (audit izi)
**Nima:** Har bir kirim/chiqim/ko'chirish/tuzatishni kim, qachon, qancha qilganini o'zgartirib bo'lmaydigan tarzda saqlash.
**Nega kerak:** Audit izisiz nizoda (kim material yo'qotdi?) hech narsa isbotlanmaydi; moliyaviy nazorat va ishonch shunga tayanadi.
**Variantlar:**
- A) Har amal o'zgarmas log: foydalanuvchi + vaqt + miqdor + sabab, faqat qo'shiladi (o'chirib bo'lmaydi) — to'liq audit izi.
- B) Faqat oxirgi holat saqlanadi (tarix yo'q) — sodda, lekin nizoda foydasiz.
- C) Keyin — hozir kerak emas.

### Q316. Telegram orqali ombor so'rovlari (ShVB bot)
**Nima:** Telegram bot orqali tez so'rov: "/qoldiq <material>", "/kam_qoldiq", "/kunlik_stok".
**Nega kerak:** ShVB da operativlik muhim — rahbar ilovaga kirmasdan Telegramdan tez javob olishni xohlaydi.
**Variantlar:**
- A) ShVB ombor komandalar to'plami: qoldiq so'rash, kam-qoldiq ro'yxati, kunlik xulosa — operativ boshqaruv.
- B) Faqat avtomatik push (kam-qoldiq, kunlik hisobot), interaktiv so'rov yo'q — sodda.
- C) Keyin — hozir kerak emas.

---

## 11. MM / Ta'minot

### Q317. Yetkazib beruvchi reytingi — avtomatmi yoki qo'lda
**Nima:** Har yetkazib beruvchiga (postavshik) sifat va ishonchlilik bahosi (masalan 1-5 yulduz yoki 0-100 ball) qo'yiladigan tizim.
**Nega kerak:** Hozir tizimda yetkazib beruvchilar ro'yxati bor, lekin reyting bo'sh (faqat namuna). Reyting bo'lsa, kim sifatli mol beradi, kim kechiktiradi — bir qarashda ko'rinadi va to'g'ri tanlov qilinadi.
**Variantlar:**
- A) Avtomatik — tizim o'zi hisoblaydi (o'z vaqtida yetkazish %, sifat brak %, narx) — odam baholamaydi, halol chiqadi
- B) Qo'lda — ta'minot bo'limi har chorakda yulduz qo'yadi — sodda, lekin sub'ektiv
- C) Aralash — tizim hisoblaydi, menejer tuzatishi mumkin — moslashuvchan, lekin nazorat kerak
- D) Keyin — hozir kerak emas

### Q318. Reyting nimadan hisoblansin (o'lchov tarkibi)
**Nima:** Avto-reyting qaysi omillardan va qanday ulushda yig'ilishi (formulasi).
**Nega kerak:** "Halol reyting" deganda — nimaga qarab? Ulushlarni siz belgilamasangiz, tizim tasodifiy raqam beradi.
**Variantlar:**
- A) O'z vaqtida yetkazish 50% + sifat (brak yo'qligi) 30% + narx 20% — yetkazish eng muhim deb hisoblanadi
- B) Sifat 50% + o'z vaqtida 30% + narx 20% — sifat birinchi o'ringa qo'yiladi
- C) Teng ulush (har biri ~33%) — sodda, lekin ustuvorlik yo'qoladi
- D) Keyin — hozir kerak emas

### Q319. Past reytingli yetkazib beruvchini bloklash
**Nima:** Reytingi ma'lum chegaradan past tushgan yetkazib beruvchiga yangi buyurtma berishni tizim cheklashi.
**Nega kerak:** Yomon postavshikni avtomatik chetlatish — sifatsiz mol va kechikishlardan himoya qiladi.
**Variantlar:**
- A) Avtomatik ogohlantirish + buyurtmaga direktor tasdig'i shart bo'ladi — to'sadi, lekin zarurat bo'lsa yo'l ochiq
- B) Faqat ogohlantirish (ko'rsatadi, to'smaydi) — yengil, lekin e'tiborsiz qolishi mumkin
- C) To'liq bloklash — qattiq, lekin shoshilinch holatda muammo
- D) Keyin — hozir kerak emas

### Q320. "Qora ro'yxat" va yetkazib beruvchi holatlari
**Nima:** Yetkazib beruvchining holat ro'yxati (masalan: faol / sinov / to'xtatilgan / qora ro'yxat).
**Nega kerak:** Har postavshik holatini bir so'z bilan belgilash — ishlash yoki ishlamaslikni aniq qiladi.
**Variantlar:**
- A) 4 holat: Faol · Sinovda · To'xtatilgan · Qora ro'yxat — to'liq va aniq
- B) 2 holat: Faol · Faol emas — sodda, lekin sabab ko'rinmaydi
- C) Siz aytadigan boshqa ro'yxat
- D) Keyin — hozir kerak emas

### Q321. Xarid buyurtmasi raqami (PO raqami)
**Nima:** Har xarid buyurtmasiga beriladigan raqam formati.
**Nega kerak:** Hozir tizim avtomatik "PO-000123" beradi. Sizning korxonangizda boshqa tartib bo'lishi mumkin (yil, bo'lim qisqartmasi va h.k.).
**Variantlar:**
- A) Avtomatik tartib + yil: PO-2026-000123 — tartibli, yil bo'yicha ajraladi
- B) Hozirgi sodda format (PO-000123) qoladi — o'zgartirish shart emas
- C) Bo'lim/ombor kodi bilan (RM-PO-2026-...) — guruhlash oson, lekin murakkab
- D) Keyin — hozir kerak emas

### Q322. Buyurtma qatorlarida haqiqiy material va narx
**Nima:** Xarid buyurtmasi ichida har mahsulot qatorida haqiqiy material nomi va narxi ko'rinishi.
**Nega kerak:** Hozir buyurtma ro'yxatida "Vendor #5", "qabul qilingan: 0" kabi namuna yozuvlar chiqadi — haqiqiy nom va summa emas. Bu real ishlatish uchun tuzatilishi kerak.
**Variantlar:**
- A) Ha — har qatorda real material nomi, miqdor, narx, jami summa ko'rinsin — to'liq va to'g'ri
- B) Faqat umumiy summa ko'rinsin, qatorlar keyin — tezroq, lekin chala
- C) Keyin — hozir kerak emas

### Q323. Narx tarixi (qaysi material qachon qanchaga olingan)
**Nima:** Har material uchun avval qaysi yetkazib beruvchidan, qaysi sanada, qancha narxda olinganini saqlovchi tarix.
**Nega kerak:** Yangi xaridda "oldin qanchaga olgandik?" degan savolga darrov javob beradi — narx oshib ketsa darrov ko'rinadi, savdolashishga asos bo'ladi.
**Variantlar:**
- A) Ha, to'liq — har xariddan keyin narx avtomatik tarixga yoziladi, grafik bilan ko'rinadi — kuchli nazorat
- B) Faqat oxirgi narx saqlansin (tarix emas) — sodda, lekin o'sish ko'rinmaydi
- C) Keyin — hozir kerak emas

### Q324. Narx oshganini avtomatik ogohlantirish
**Nima:** Yangi narx oldingidan ma'lum foizdan ko'p oshsa, tizim ogohlantirishi.
**Nega kerak:** Narx sezdirmay oshib ketishidan himoya — pulni tejaydi.
**Variantlar:**
- A) Ha — 10% dan ortiq oshsa qizil ogohlantirish + tasdiq so'raydi — pul nazorati kuchli
- B) Faqat ko'rsatadi, to'smaydi — yengil
- C) Keyin — hozir kerak emas

### Q325. MRP natijasidan avtomatik xarid taklifi
**Nima:** Ishlab chiqarish rejasi (MRP) "bu materiallar yetishmaydi" deganda, tizim avtomatik xarid arizasini taklif qilishi.
**Nega kerak:** Material yetishmovchiligini qo'lda kuzatish o'rniga, tizim o'zi "buni, bunchasini ol" deb taklif qiladi — to'xtab qolishning oldini oladi.
**Variantlar:**
- A) Avtomatik ariza yaratiladi (qoralama), ta'minotchi tasdiqlaydi — tez va xavfsiz
- B) Faqat ro'yxat ko'rsatadi, ta'minotchi qo'lda kiritadi — nazorat ko'p, mehnat ko'p
- C) Avtomatik to'liq buyurtmagacha (tasdiqsiz) — eng tez, lekin xato xavfi
- D) Keyin — hozir kerak emas

### Q326. Xavfsizlik zaxirasi (minimal qoldiq) va qayta buyurtma chegarasi
**Nima:** Har material uchun "shu miqdordan past tushsa — buyurtma ber" degan minimal chegara.
**Nega kerak:** MRP to'g'ri ishlashi uchun har materialga minimal qoldiq kerak; bo'lmasa, "yetishmaydi"ni tizim bilmaydi.
**Variantlar:**
- A) Har materialga qo'lda chegara (min qoldiq + qayta buyurtma miqdori) belgilanadi — aniq nazorat
- B) Tizim o'tgan sarfdan avtomatik hisoblaydi — kam mehnat, lekin yangi materialga noaniq
- C) Faqat asosiy materiallarga (xom ashyo) chegara, qolganlari keyin — bosqichma-bosqich
- D) Keyin — hozir kerak emas

### Q327. Mol qabul qilish — buyurtmaga taqqoslash
**Nima:** Mol kelganda, qabul qiluvchi buyurtmaga qarab "shuncha buyurtma qilgandik, shuncha keldi" deb solishtirishi.
**Nega kerak:** Kam kelgan yoki ortiqcha kelgan molni darrov ushlaydi — kam to'lash yoki ortiqcha to'lashning oldini oladi.
**Variantlar:**
- A) Ha — qabulda buyurtma ochiladi, har qator bo'yicha "buyurtma / qabul / farq" ko'rinadi — to'liq nazorat
- B) Faqat umumiy miqdor solishtiriladi — sodda, lekin qatordagi xato o'tib ketadi
- C) Keyin — hozir kerak emas

### Q328. Qisman yetkazish (mol bir necha bo'lib kelishi)
**Nima:** Bitta buyurtma bo'yicha mol bir necha marta (qisman) kelishi va har safar qabul qilinishi.
**Nega kerak:** Amalda mol ko'pincha bir yo'la kelmaydi. Tizim qisman qabulni qo'llab-quvvatlamasa, qoldiqni kuzata olmaydi.
**Variantlar:**
- A) Ha — qisman qabul, buyurtma "qisman bajarildi" holatida qoladi, qoldiq ko'rinadi — real hayotga mos
- B) Faqat to'liq qabul (hammasi bir martada) — sodda, lekin amalga to'g'ri kelmaydi
- C) Keyin — hozir kerak emas

### Q329. Sifatsiz molni qaytarish / rad etish
**Nima:** Qabulda brak yoki nostandart mol topilsa, uni rad etish va yetkazib beruvchiga qaytarish qaydi.
**Nega kerak:** Brak molni hujjatlashtirish — postavshik reytingiga ta'sir qiladi va qaytarish/almashtirish tarixini saqlaydi.
**Variantlar:**
- A) Ha — qabulda "qabul qilindi / rad etildi" ajratiladi, rad sababi yoziladi, reytingga ketadi — to'liq
- B) Faqat qabul, brak alohida sifat moduliga (QC) yuboriladi — bo'linadi, lekin ulanish kerak
- C) Keyin — hozir kerak emas

### Q330. Mol qabuli sifat nazoratiga (QC) bog'lansinmi
**Nima:** Qabul qilingan xom ashyo avtomatik sifat tekshiruviga (karantin) tushishi.
**Nega kerak:** Karton/qog'oz ishlab chiqarishda xom ashyo sifati muhim; tekshiruvsiz qabul brak mahsulotga olib keladi.
**Variantlar:**
- A) Ha — asosiy xom ashyo qabulda "karantin"ga, QC tasdiqlagach omborga o'tadi — sifat kafolati
- B) Faqat tanlangan materiallar tekshiriladi, qolgani to'g'ridan ombor — muvozanat
- C) Tekshiruvsiz, to'g'ridan omborga — tez, lekin xavfli
- D) Keyin — hozir kerak emas

### Q331. Kreditor qarz (yetkazib beruvchiga qarzdorlik) hisobi
**Nima:** Har yetkazib beruvchiga "qancha qarzdormiz, qachongacha to'lash kerak" degan qarz hisobi.
**Nega kerak:** Kimga qancha qarzdor ekanini bilmaslik — to'lov kechikishi, jarima va ishonchni yo'qotishga olib keladi.
**Variantlar:**
- A) Ha — har postavshik bo'yicha qarz qoldig'i + to'lov muddati avtomatik yuritiladi — to'liq nazorat
- B) Faqat umumiy qarz summasi (postavshik bo'yicha emas) — sodda, lekin chala
- C) Keyin — hozir kerak emas

### Q332. Qarzni muddat bo'yicha guruhlash (aging)
**Nima:** Qarzlarni muddati bo'yicha guruhlash (masalan: 0-30 kun, 30-60, 60-90, 90+ kun).
**Nega kerak:** Qaysi to'lov kechikkanini, qaysisi shoshilinch ekanini bir jadvalda ko'rsatadi — to'lovni boshqarishni osonlashtiradi.
**Variantlar:**
- A) Ha — 4 guruh (0-30/30-60/60-90/90+), kechikkanlar qizil rangda — aniq ustuvorlik
- B) Faqat "muddati o'tgan / o'tmagan" ikki guruh — sodda
- C) Keyin — hozir kerak emas

### Q333. To'lov muddati ogohlantirishi
**Nima:** To'lov muddati yaqinlashganda yoki o'tib ketganda tizim ogohlantirishi (Telegram yoki ekranda).
**Nega kerak:** To'lovni unutmaslik — jarima va munosabat buzilishidan saqlaydi.
**Variantlar:**
- A) Ha — muddatdan 3 kun oldin + o'tgan kuni avtomatik xabar — eslatib turadi
- B) Faqat ekranda ro'yxat (xabar yo'q) — yengil
- C) Keyin — hozir kerak emas

### Q334. To'lovni xarid bilan ulash (3 tomonlama taqqoslash)
**Nima:** Buyurtma + qabul + hisob-faktura (schyot) uchchovini taqqoslab, faqat to'g'ri kelganda to'lash.
**Nega kerak:** Buyurtma qilingan, qabul qilingan va schyotdagi summa bir xil bo'lmasa — ortiqcha to'lov yoki firibgarlik xavfi. Bu nazorat pulni qo'riqlaydi. (Tizimda bunga asos bor, ulanishi kerak.)
**Variantlar:**
- A) Ha — uchovi mos kelmasa to'lov bloklanadi, farqni menejer hal qiladi — kuchli nazorat
- B) Faqat ogohlantirish, to'lovga ruxsat — yengil, lekin xavf qoladi
- C) Keyin — hozir kerak emas

### Q335. Marshrut / transport — molni kim, qaysi yo'l bilan olib keladi
**Nima:** Mol yetkazish marshruti: qaysi haydovchi, qaysi mashina, qaysi yo'l bilan keladi.
**Nega kerak:** Yirik xom ashyo (karton, qog'oz) transportini kuzatish — qachon keladi, qayerda, kechikdimi — buni bilish ish rejasini to'g'rilaydi.
**Variantlar:**
- A) Ha — har yetkazishga marshrut + haydovchi + mashina biriktiriladi, holati kuzatiladi — to'liq logistika
- B) Faqat "yo'lda / yetib keldi" oddiy belgi — sodda, lekin tafsilotsiz
- C) Keyin — hozir kerak emas

### Q336. Haydovchi va mashina ma'lumotnomasi
**Nima:** Haydovchilar va transport vositalari ro'yxati (ism, telefon, mashina raqami, sig'imi).
**Nega kerak:** Marshrut tayinlash uchun haydovchi/mashina ro'yxati kerak; bo'lmasa har safar qo'lda yoziladi.
**Variantlar:**
- A) Ha — alohida haydovchi + transport ro'yxati (master-data) yuritiladi — qayta ishlatiladi
- B) Faqat marshrutda matn sifatida yoziladi (alohida ro'yxat yo'q) — sodda, lekin takror
- C) Keyin — hozir kerak emas

### Q337. Yoqilg'i va transport xarajati hisobi
**Nima:** Har yetkazish/marshrut uchun yoqilg'i va transport xarajatini qayd qilish.
**Nega kerak:** Mol tannarxiga transport xarajati ham kiradi; uni hisoblamaslik — foydani noto'g'ri ko'rsatadi.
**Variantlar:**
- A) Ha — har marshrutga yoqilg'i + xarajat yoziladi, mol tannarxiga qo'shiladi — to'g'ri tannarx
- B) Faqat umumiy oylik transport xarajati (marshrutga bog'lamay) — sodda
- C) Keyin — hozir kerak emas

### Q338. O'zimizning transport vs tashqi (yollangan)
**Nima:** Yetkazishni o'z transportimiz qiladimi yoki tashqi tashuvchi (logist firma)ni ajratish.
**Nega kerak:** Xarajat hisobi va mas'uliyat ikkala holatda boshqacha; ajratilmasa, hisob aralashadi.
**Variantlar:**
- A) Ha — har yetkazishda "o'z / tashqi" belgilanadi, tashqiga shartnoma/narx ulanadi — aniq hisob
- B) Faqat bitta tur (hozircha hammasi bir xil) — sodda
- C) Keyin — hozir kerak emas

### Q339. P2P xarid jarayoni — to'liq zanjir (ariza → buyurtma → qabul → to'lov)
**Nima:** "Procure-to-Pay" — material so'rovidan to'lovgacha bo'lgan to'liq bog'langan zanjir.
**Nega kerak:** Har bosqich alohida bo'lsa, ma'lumot uzilib qoladi. To'liq zanjir bo'lsa — so'rovdan to'lovgacha hammasi bir joyda kuzatiladi.
**Variantlar:**
- A) Ha — to'liq zanjir bog'lanadi (ariza→tasdiq→buyurtma→qabul→schyot→to'lov), har bosqich oldingisidan keladi — shaffof
- B) Faqat asosiy bosqichlar (ariza→buyurtma→qabul), to'lov alohida moliyada — qisman
- C) Keyin — hozir kerak emas

### Q340. Xarid arizasi tasdiq zanjiri (summaga qarab)
**Nima:** Xarid arizasini summasiga qarab kim tasdiqlashi (kichik summa — bo'lim boshlig'i, katta — direktor).
**Nega kerak:** Har xaridni direktor ko'rsa — sekin; hech kim ko'rmasa — nazoratsiz. Summaga qarab pog'ona kerak.
**Variantlar:**
- A) Ha — summa pog'onasi: kichik→bo'lim boshlig'i, o'rta→ta'minot menejeri, katta→direktor — muvozanat
- B) Hamma xaridni bitta odam (ta'minot menejeri) tasdiqlaydi — sodda, lekin yuk bitta odamda
- C) Tasdiqsiz (ishonchli xodimlar) — tez, lekin nazoratsiz
- D) Keyin — hozir kerak emas

### Q341. Tasdiq summasi chegaralarini kim belgilaydi
**Nima:** "Qaysi summagacha kim tasdiqlaydi" chegaralari qayerda saqlanishi va o'zgartirilishi.
**Nega kerak:** Bu chegaralar kodda qattiq yozilsa — o'zgartirish uchun har safar dasturchi kerak. Sozlamada bo'lsa — siz o'zingiz o'zgartirasiz.
**Variantlar:**
- A) Sozlamalar oynasida (siz xohlagancha o'zgartirasiz, dasturchisiz) — moslashuvchan
- B) Bir marta belgilanadi, o'zgartirish kamdan-kam — sodda
- C) Keyin — hozir kerak emas

### Q342. ShVB ariza tizimi (ЗНО/ЗВС) bilan bog'lash
**Nima:** Sizning ShVB tizimingizdagi to'lov/majburiyat arizasi (ЗНО) va haftalik budjet arizasi (ЗВС) — xarid to'loviga bog'lanishi.
**Nega kerak:** Xarid to'lovi sizning budjet-ariza tartibingizdan o'tishi kerak; aks holda MM va moliya ikki alohida dunyo bo'lib qoladi.
**Variantlar:**
- A) Ha — xarid to'lovi avtomatik ЗНО arizasi yaratadi, ShVB tasdig'idan o'tadi — yagona tizim
- B) Qo'lda bog'lash (havola raqami yoziladi) — sodda, lekin uzilish xavfi
- C) Keyin — hozir kerak emas

### Q343. Ta'minot bo'limining karta-modeli (lavozim ЦКП)
**Nima:** Ta'minotchining ish kartasida uning ЦКП (asosiy natijasi) va haftalik GSD ko'rsatkichi belgilanishi.
**Nega kerak:** Sizning karta-markazli modelingizda har lavozimning aniq natijasi bo'lishi kerak. Ta'minotchining natijasi nima — o'lchanmasa, samaradorlik ko'rinmaydi.
**Variantlar:**
- A) Ha — ta'minotchi kartasida ЦКП ("o'z vaqtida, sifatli, arzon ta'minlangan material") + haftalik o'lchov — vizyonga mos
- B) Umumiy KPI yetarli (alohida ЦКП emas) — sodda, lekin vizyondan uzoq
- C) Keyin — hozir kerak emas

### Q344. Ta'minotchi GSD o'lchovlari (qaysi raqamlar bilan baholanadi)
**Nima:** Ta'minotchining haftalik samaradorligi qaysi raqamlar bilan o'lchanishi.
**Nega kerak:** Karta-modelda o'lchovni siz belgilaysiz; tizim o'zi to'qib chiqarmaydi.
**Variantlar:**
- A) Material yetishmovchiligi soni (kam=yaxshi) + o'z vaqtida yetkazish % + narx tejash — natijaga yo'naltirilgan
- B) Faqat qilingan buyurtmalar soni — sodda, lekin sifatni ko'rsatmaydi
- C) Siz aytadigan boshqa o'lchovlar
- D) Keyin — hozir kerak emas

### Q345. Bitta material — bir necha yetkazib beruvchi (taqqoslash)
**Nima:** Bir materialni bir necha postavshikdan olish mumkinligini va ularning narx/sifatini yonma-yon taqqoslash.
**Nega kerak:** Bitta materialga 2-3 manba bo'lsa — eng arzon yoki eng tezini tanlash mumkin, bitta postavshikka bog'lanib qolinmaydi.
**Variantlar:**
- A) Ha — har materialga bir necha postavshik + narx/sifat taqqoslash jadvali — eng yaxshi tanlov
- B) Har materialga bitta asosiy postavshik — sodda, lekin tanlov yo'q
- C) Keyin — hozir kerak emas

### Q346. Yetkazib beruvchi shartnomalari va hujjatlar
**Nima:** Har postavshik bilan shartnoma, litsenziya, sertifikat hujjatlarini tizimda saqlash.
**Nega kerak:** Shartnoma muddati o'tib ketsa yoki sertifikat yo'q bo'lsa — yuridik va sifat muammosi. Hujjatlar bir joyda bo'lsa, nazorat oson.
**Variantlar:**
- A) Ha — postavshik kartasiga shartnoma/sertifikat fayllari + amal qilish muddati biriktiriladi — to'liq
- B) Faqat shartnoma raqami va sanasi (fayl yo'q) — sodda
- C) Keyin — hozir kerak emas

### Q347. Buyurtma holatlari (status oqimi)
**Nima:** Xarid buyurtmasining holat ro'yxati va ularning ketma-ketligi (qoralama → tasdiqda → tasdiqlangan → qisman qabul → yakunlangan → bekor).
**Nega kerak:** Har buyurtma qaysi bosqichda ekanini aniq bilish — kuzatuv va hisobot uchun asos.
**Variantlar:**
- A) To'liq oqim (6 holat: qoralama/tasdiqda/tasdiqlangan/qisman/yakunlangan/bekor) — aniq kuzatuv
- B) Sodda (3 holat: ochiq/qabul qilinmoqda/yopiq) — yengil, lekin tafsilotsiz
- C) Keyin — hozir kerak emas

### Q348. Shoshilinch xarid (favqulodda holat)
**Nima:** Ishlab chiqarish to'xtab qolmasligi uchun tezkor (tasdiq zanjirisiz yoki qisqartirilgan) xarid imkoni.
**Nega kerak:** Ba'zan material zudlik bilan kerak bo'ladi; oddiy tasdiq jarayoni sekin bo'lsa, ishlab chiqarish to'xtaydi.
**Variantlar:**
- A) Ha — "shoshilinch" belgisi bilan qisqa tasdiq (direktor keyin tasdiqlaydi), sababi yoziladi — tezkor, lekin izlanadigan
- B) Yo'q — hamma xarid bir xil tartibda — qattiq, lekin xavfsiz
- C) Keyin — hozir kerak emas

### Q349. Mol tannarxiga qo'shimcha xarajatlarni kiritish
**Nima:** Bojxona, transport, yuklash kabi qo'shimcha xarajatlarni mol tannarxiga taqsimlash.
**Nega kerak:** Materialning haqiqiy tannarxi faqat sotib olish narxi emas; qo'shimcha xarajatlar kirmasa, foyda noto'g'ri hisoblanadi.
**Variantlar:**
- A) Ha — qabulda qo'shimcha xarajatlar materiallarga taqsimlanib tannarxga qo'shiladi — to'g'ri tannarx
- B) Faqat sotib olish narxi (qo'shimcha xarajatlar alohida) — sodda, lekin noaniq
- C) Keyin — hozir kerak emas

### Q350. Valyuta (UZS / USD / boshqa) va kurs
**Nima:** Xaridlar bir necha valyutada bo'lishi va ularni hisoblashda kurs qo'llanishi.
**Nega kerak:** Import xom ashyo dollarda bo'lishi mumkin; valyuta va kursni hisobga olmaslik — summalarni noto'g'ri qiladi.
**Variantlar:**
- A) Ha — buyurtmada valyuta tanlanadi, qabul/to'lovda kurs bo'yicha so'mga aylantiriladi — import uchun zarur
- B) Faqat so'm (UZS) — sodda, lekin importga to'g'ri kelmaydi
- C) Keyin — hozir kerak emas

### Q351. Xarid analitikasi va hisobotlar
**Nima:** "Eng ko'p xarajat qaysi materialga", "qaysi postavshikdan eng ko'p olamiz", "oylik xarid hajmi" kabi hisobotlar.
**Nega kerak:** Xarid pulini qayerga ketayotganini ko'rsatadi — tejash imkoniyatlarini topishga yordam beradi.
**Variantlar:**
- A) Ha — ABC tahlil (eng katta xarajatlar) + postavshik bo'yicha + oylik trend — boshqaruvga kuchli
- B) Faqat oddiy umumiy summa hisoboti — sodda
- C) Keyin — hozir kerak emas

### Q352. Telegram orqali xarid bildirishnomalari
**Nima:** Xarid jarayonidagi muhim hodisalar (yangi ariza, tasdiq kerak, mol keldi, to'lov muddati) Telegram orqali tegishli xodimga borishi.
**Nega kerak:** Xodimlar tizimni doim ochib o'tirmaydi; muhim narsa Telegramga kelsa — javob tez bo'ladi.
**Variantlar:**
- A) Ha — tasdiq so'rovi, qabul, to'lov muddati avtomatik Telegramga boradi — tezkor
- B) Faqat tizim ichida bildirishnoma (Telegram yo'q) — yengil
- C) Keyin — hozir kerak emas

---

## 12. LMS / Ta'lim

### Q353. Darslik kimga biriktiriladi — kartaga yoki xodimga
**Nima:** O'quv kursi (darslik) xodimning shaxsiga emas, lavozim-kartaga bog'lanadimi.
**Nega kerak:** Vizyon "darslik kartaga" deydi — xodim ketsa darslik karta bilan qoladi, yangi kelgan o'sha darslikni o'tadi. Bilim lavozimga tegishli bo'ladi.
**Variantlar:**
- A) Kartaga biriktiriladi — xodim almashsa darslik karta bilan qoladi, voris avtomatik shu darslikni oladi
- B) Xodimga biriktiriladi — har xodim alohida, karta almashsa darslik yo'qoladi
- C) Keyin — hozir kerak emas

### Q354. Darslik tugamaguncha oylik yo'q
**Nima:** Karta darsligini tugatmagan xodimga o'sha kartaning oyligi yozilmaydi degan qoida.
**Nega kerak:** Vizyon (bo'lim 9 va 7): "darslik tugamasa → o'sha karta oyligi yo'q" — bu o'qishni majburlaydigan asosiy tutqich.
**Variantlar:**
- A) Ha, bloklaydi — darslik 100% tugamasa o'sha karta oyligi to'xtaydi (ogohlantirish bilan)
- B) Yumshoq — oylik to'xtamaydi, faqat rahbar/HR'ga ogohlantirish boradi
- C) Keyin — hozir faqat o'qish, oylikka bog'lamaymiz

### Q355. Ishga olinganda kurs avto-tayinlash
**Nima:** Xodim kartaga biriktirilganda, o'sha kartaning majburiy kurslari avtomatik unga tayinlanadimi.
**Nega kerak:** Hozir kurslar qo'lda tayinlanadi (yo'n.27 da "ishga-olishda avto-tayinlash yetmaydi"). Avto-tayinlash hech kim o'qishsiz boshlamasligini kafolatlaydi.
**Variantlar:**
- A) Avtomatik — biriktirish bo'lishi bilan kartaning barcha majburiy kurslari xodimga tushadi + muddat boshlanadi
- B) HR qo'lda — HR har xodimga kerakli kurslarni o'zi belgilaydi
- C) Keyin — hozir kerak emas

### Q356. Kurs tugamaguncha MES (mashinaga) bloklash
**Nima:** Majburiy xavfsizlik/operatsiya kursini tugatmagan xodim mashinada ishlay olmasligi.
**Nega kerak:** `blocks_mes` ustuni allaqachon BOR — o'qimagan operatorni stanokka qo'ymaslik zavod xavfsizligi. Faqat ulash kerak.
**Variantlar:**
- A) Ha, qattiq blok — kurs tugamasa MES o'sha xodimga ishni boshlatmaydi
- B) Faqat ogohlantirish — ishlay oladi, lekin rahbarga signal boradi
- C) Keyin — hozir kerak emas

### Q357. Reglament testlari (yangi feature)
**Nima:** Har bir reglament (qoida/yo'riqnoma)ga bog'liq bilim testi — xodim reglamentni o'qib, test topshiradi.
**Nega kerak:** Hozir umuman YO'Q (yo'n.28). Reglamentni "o'qidim" tugmasi yetarli emas — test bilan haqiqatan tushunganini tekshirish kerak.
**Variantlar:**
- A) To'liq — har reglament uchun test banki + topshirish + ball + qayd
- B) Oddiy — faqat "tanishdim/qabul qildim" tasdiq tugmasi, test yo'q
- C) Keyin — hozir kerak emas

### Q358. Reglament testi uchun 7-kunlik muddat
**Nima:** Yangi/o'zgargan reglament chiqsa, xodim uni 7 kun ichida o'qib test topshirishi shart.
**Nega kerak:** Vizyon (yo'n.28) aniq 7-kun deadline beradi — muddatsiz reglament o'qilmay qoladi.
**Variantlar:**
- A) 7 kun — standart muddat, hammaga bir xil, sanagich avtomatik
- B) Lavozimga qarab — muddatni HR har reglament/lavozim uchun o'zi belgilaydi
- C) Keyin — hozir kerak emas

### Q359. 7-kun o'tib test topshirilmasa nima bo'ladi
**Nima:** Muddat o'tib reglament testi topshirilmagan xodimga tizim qanday choralar ko'radi.
**Nega kerak:** Deadline'ning oqibati bo'lmasa, deadline ishlamaydi. Vizyon oylik/blok orqali majburlaydi.
**Variantlar:**
- A) Bosqichma-bosqich — avval ogohlantirish, keyin rahbar/HR'ga raport, keyin o'sha kartaning oyligi/MES bloklanadi
- B) Faqat raport — HR'ga ro'yxat boradi, qolgani qo'lda hal qilinadi
- C) Keyin — hozir kerak emas

### Q360. Test yiqilganda qayta-test
**Nima:** Test/imtihondan o'tolmagan xodim qayta topshira oladimi va qancha marta.
**Nega kerak:** Vizyon (yo'n.28) "qayta-test" deydi. Bir martalik test adolatsiz — lekin cheksiz urinish ham bilim kafolatlamaydi.
**Variantlar:**
- A) Cheklangan qayta — masalan 2 marta qayta, keyin majburiy qayta-o'qish + rahbar/HR aralashuvi
- B) Cheksiz — istalgancha qayta topshiraveradi, o'tguncha
- C) Keyin — hozir kerak emas

### Q361. O'tish bali (necha foiz = o'tdi)
**Nima:** Testdan o'tgan hisoblanish uchun minimal ball foizi.
**Nega kerak:** Master-data qarori — "o'tdi/yiqildi" chegarasi aniq bo'lishi kerak, aks holda har bo'lim o'zicha qaror qiladi.
**Variantlar:**
- A) Yagona standart (masalan 80%) — barcha kurs/testga bir xil, oddiy va adolatli
- B) Kurs turiga qarab — xavfsizlik kursi 100%, oddiy kurs 60% (HR sozlaydi)
- C) Keyin — hozir kerak emas

### Q362. Micro-modullar (qisqa o'quv bo'laklari)
**Nima:** Katta kursni 5-10 daqiqalik kichik darslarga (micro-modul) bo'lish.
**Nega kerak:** Stub route `/micro-modules` bor, lekin real emas. Zavod ishchisiga uzun kurs o'rniga qisqa bo'laklar mosroq (smena oralig'ida o'tadi).
**Variantlar:**
- A) Ha — har kurs micro-modullarga bo'linadi, har biri alohida o'tiladi va belgilanadi
- B) Yo'q — kurs yaxlit bitta bo'lib qoladi, bo'lish yo'q
- C) Keyin — hozir kerak emas

### Q363. Micro-modul ketma-ketligi majburiymi
**Nima:** Micro-modullarni belgilangan tartibda o'tish shartmi yoki istalgan tartibda.
**Nega kerak:** Ba'zi bilim ketma-ket quriladi (avval asos, keyin murakkab). Lekin majburiy tartib moslashuvchanlikni kamaytiradi.
**Variantlar:**
- A) Ketma-ket — keyingisi oldingisi tugamaguncha ochilmaydi (xavfsizlik/operatsiya uchun)
- B) Erkin — istalgan tartibda, faqat hammasini tugatish kerak
- C) Keyin — hozir kerak emas

### Q364. Kursni kim tayyorlaydi
**Nima:** Darslik/kurs kontentini kim yaratadi va tasdiqlaydi.
**Nega kerak:** Vizyon (bo'lim 9): "O'quv bo'limi qo'lda tayyorlaydi → AI nazorat → HR qaror → rahbar tasdiq". Kim-nima-qiladi aniq bo'lishi kerak.
**Variantlar:**
- A) O'quv bo'limi yaratadi → HR qaror → rahbar tasdiq (vizyon oqimi)
- B) Har bo'lim rahbari o'z kurslarini o'zi yaratadi, tasdiqsiz
- C) Keyin — hozir kerak emas

### Q365. AI kurs/o'qish nazorati
**Nima:** Markaziy AI o'qish jarayonini kuzatib hisobot beradimi (kim o'qidi, kim qoldi, tushundimi).
**Nega kerak:** Vizyon (bo'lim 9, 10): "AI nazorat + hisobot". AI o'qimagan/tushunmaganlarni rahbarga ko'rsatadi.
**Variantlar:**
- A) Ha — AI o'qish holatini kuzatadi + PDF hisobot (xodim/rahbar/HR'ga)
- B) Faqat ro'yxat — AI'siz oddiy jadval (kim tugatdi, kim yo'q)
- C) Keyin — hozir kerak emas

### Q366. AI chatbot orqali o'qitish/savol berish
**Nima:** AI chatbot xodimga darslik bo'yicha tushuntirish berib, savol-javob qiladimi.
**Nega kerak:** Vizyon (bo'lim 10): "Chatbot o'qitish". Mashinasiz/savodi past ishchiga matn o'rniga suhbat orqali o'qitish qulayroq.
**Variantlar:**
- A) Ha — AI chatbot darslikni tushuntiradi va kichik savollar beradi (telegram/ilovada)
- B) Yo'q — faqat matnli/videoli darslik, chatbot yo'q
- C) Keyin — hozir kerak emas

### Q367. Razryad imtihoni LMS ichida
**Nima:** Xodim razryadini ko'tarish imtihoni LMS modulida o'tkaziladimi.
**Nega kerak:** Vizyon (bo'lim 6): "imtihon → o'tsa razryad o'zgaradi → HR hujjat + ichki sertifikat". Razryad-o'sish o'quv bilan bog'liq.
**Variantlar:**
- A) Ha — razryad imtihoni LMS test sifatida, o'tsa HR'ga signal + sertifikat
- B) Alohida — razryad imtihoni HR modulida, LMS'siz
- C) Keyin — hozir kerak emas

### Q368. Razryad imtihonining 3 oylik oralig'i
**Nima:** Razryad imtihonini xodim min. 3 oyda bir marta topshira olishi qoidasi.
**Nega kerak:** Vizyon (bo'lim 6): "min 3 oy oraliq". Tez-tez urinishni cheklaydi, jiddiy tayyorgarlik talab qiladi.
**Variantlar:**
- A) 3 oy — standart, tizim oxirgi imtihondan 3 oy o'tmaguncha yangisini ochmaydi
- B) HR belgilaydi — har lavozim uchun oraliqni HR o'zi sozlaydi
- C) Keyin — hozir kerak emas

### Q369. Razryad o'sishi avtomatikmi
**Nima:** Imtihondan o'tgan xodimning razryadi avtomatik ko'tariladimi yoki tasdiq kerakmi.
**Nega kerak:** Vizyon (bo'lim 6): "o'sish avtomatik EMAS — HR + yuqori rahbariyat tasdiqlaydi". Faqat test yetarli emas.
**Variantlar:**
- A) Tasdiq bilan — test o'tsa ham, razryad faqat HR + rahbar tasdig'idan keyin ko'tariladi
- B) Avtomatik — test o'tishi bilan razryad darrov ko'tariladi
- C) Keyin — hozir kerak emas

### Q370. Ichki sertifikat berish
**Nima:** Kurs/imtihonni tugatgan xodimga zavodning ichki sertifikati (PDF) beriladimi.
**Nega kerak:** Vizyon (bo'lim 6) "ichki sertifikat" deydi. Sertifikat motivatsiya + hujjat-isbot (kim nimani o'tgan).
**Variantlar:**
- A) Ha — avtomatik PDF sertifikat (kurs nomi, sana, razryad, raqam) + arxivga saqlanadi
- B) Yo'q — faqat tizimda "tugatdi" belgisi, qog'oz/PDF yo'q
- C) Keyin — hozir kerak emas

### Q371. Sertifikatning amal qilish muddati (qayta-sertifikatlash)
**Nima:** Sertifikat muddatsizmi yoki ma'lum vaqtdan keyin qayta o'qish/qayta-test kerakmi.
**Nega kerak:** Xavfsizlik/reglament bilimi eskiradi. Muddatli sertifikat davriy yangilanishni majburlaydi.
**Variantlar:**
- A) Muddatli — masalan 1 yil, muddat tugashidan oldin qayta-test eslatmasi keladi
- B) Muddatsiz — bir marta olingan sertifikat doimiy
- C) Keyin — hozir kerak emas

### Q372. Kaizen taklif kiritish (xodim takomillashtirish g'oyasi)
**Nima:** Xodim ish jarayonini yaxshilash taklifini (kaizen) kiritib, ko'rib chiqilishini kuzatadi.
**Nega kerak:** `kaizen_suggestions` jadval BOR (yo'n.34), lekin LMS bilan to'liq bog'lanmagan. Kaizen — uzluksiz o'rganish madaniyatining qismi.
**Variantlar:**
- A) Ha, to'liq — taklif kiritish + holat (yangi/ko'rilmoqda/qabul/rad) + javob xodimga
- B) Oddiy — taklif faqat qutiga tushadi, holat-kuzatuvsiz
- C) Keyin — hozir kerak emas

### Q373. Kaizen uchun rasmiy PDCA tsikli
**Nima:** Qabul qilingan kaizen taklifini Reja-Bajar-Tekshir-Harakat (PDCA) bosqichlari bo'yicha boshqarish.
**Nega kerak:** Audit (yo'n.34) "rasmiy PDCA yetmaydi" deydi. PDCA taklifni shunchaki qabul qilib unutmaslikni, balki amalga oshirishni kafolatlaydi.
**Variantlar:**
- A) To'liq PDCA — har taklif 4 bosqichdan o'tadi, mas'ul + muddat + natija qayd qilinadi
- B) Oddiy — faqat "qabul qilindi/amalga oshdi" 2 holat, bosqichsiz
- C) Keyin — hozir kerak emas

### Q374. Kaizen rag'bati (mukofot)
**Nima:** Foydali kaizen taklifi uchun xodimga rag'bat (bonus/ball) beriladimi.
**Nega kerak:** Rag'bat bo'lmasa xodimlar taklif kiritmaydi. Vizyon bonus tizimi sozlanadi (karta-model bo'lim 7).
**Variantlar:**
- A) Ha — qabul qilingan kaizen kartaning bonus tizimiga ulanadi (HR/rahbar belgilaydi)
- B) Faqat ma'naviy — minnatdorlik/reyting, pul yo'q
- C) Keyin — hozir kerak emas

### Q375. Kurs holati ro'yxati (master-data)
**Nima:** Xodimning bir kursdagi holatini ko'rsatadigan standart holatlar ro'yxati.
**Nega kerak:** Master-data qarori — har joyda bir xil holatlar bo'lishi kerak (rang/hisobot uchun).
**Variantlar:**
- A) Tayinlandi → Boshlandi → Tugatildi → Muddati o'tdi → Yiqildi (to'liq, real holat)
- B) Faqat: Tugatildi / Tugatilmadi (oddiy)
- C) Keyin — hozir kerak emas

### Q376. Video darslik va ko'rilganlik nazorati
**Nima:** Darslik videoli bo'lganda, xodim videoni haqiqatan ko'rganini (oxirigacha) tizim tekshiradimi.
**Nega kerak:** Stub `/video-progress` route bor. Video ochib qo'yib ketishni oldini olish — haqiqatan o'qiganni isbotlaydi.
**Variantlar:**
- A) Ha — video qancha ko'rilgani kuzatiladi, oxirigacha ko'rmasa "tugatildi" bo'lmaydi
- B) Yo'q — video ochilsa "ko'rdim" deb belgilanadi, nazoratsiz
- C) Keyin — hozir kerak emas

### Q377. Lavozim papkasi (position folder) bilan bog'lanish
**Nima:** Kartaning o'quv materiallari (darslik/video/test) lavozim papkasi orqali ko'rsatiladimi.
**Nega kerak:** `position_folders` jadval BOR (4 endpoint), lekin 0 qator + FE ulanmagan. Papka = kartaning "o'quv to'plami".
**Variantlar:**
- A) Ha — har karta papkasida darslik+video+test bir joyda, xodim shu yerdan o'qiydi
- B) Alohida — LMS kurslari papkadan ayri, ulanmaydi
- C) Keyin — hozir kerak emas

### Q378. O'qish kim majburiyligini belgilaydi (majburiy vs ixtiyoriy)
**Nima:** Kursning majburiy yoki ixtiyoriy ekanini kim va qanday belgilaydi.
**Nega kerak:** `is_mandatory` ustuni BOR. Majburiy kurs oylik/MES'ga ta'sir qiladi, ixtiyoriy faqat rivojlanish uchun.
**Variantlar:**
- A) Kartada belgilanadi — HR har karta uchun qaysi kurs majburiy/ixtiyoriy ekanini kartada sozlaydi
- B) Hamma kurs majburiy — ixtiyoriy tushunchasi yo'q
- C) Keyin — hozir kerak emas

### Q379. O'qish davomati 3-kun blokiga ta'sir qiladimi
**Nima:** O'qishni uzoq tashlab qo'ygan xodim profil blokiga (vizyon 3-kun yo'q → blok) bog'lanadimi.
**Nega kerak:** Vizyon (bo'lim 10) 3-kun yo'qlik blokini biladi — o'qishni e'tiborsiz qoldirish ham nazoratda bo'lishi mantiqiy.
**Variantlar:**
- A) Faqat eslatma — o'qish tashlansa AI eslatadi, blok yo'q (blok davomat bilan bog'liq, o'qish bilan emas)
- B) Ulanadi — majburiy kurs muddati o'tib ketsa profil bloki choralariga qo'shiladi
- C) Keyin — hozir kerak emas

### Q380. Yangi reglament chiqqanda kimni qamrab oladi
**Nima:** Yangi/o'zgargan reglament chiqsa, uning testi qaysi xodimlarga tushadi.
**Nega kerak:** Reglament odatda muayyan lavozim/bo'limga tegishli — hammaga tushirsa ortiqcha, noto'g'ri tanlasa qoladi.
**Variantlar:**
- A) Kartaga bog'lab — reglament qaysi kartalarga tegishli bo'lsa, faqat o'sha xodimlarga test tushadi
- B) Hammaga — barcha xodimga bir xil tushadi
- C) Keyin — hozir kerak emas

### Q381. O'quv hisoboti va dashboard
**Nima:** Rahbar/HR uchun o'qish holatini ko'rsatadigan umumiy panel (kim tugatdi, kim qoldi, qaysi bo'lim orqada).
**Nega kerak:** Boshqaruv uchun ko'rinish kerak — qaysi bo'lim o'qishda orqada qolganini bilmasa, choralar ko'rib bo'lmaydi.
**Variantlar:**
- A) Ha — bo'lim/karta kesimida tugatish foizi + orqadagilar ro'yxati + AI tahlil
- B) Oddiy ro'yxat — faqat xodim-kurs jadvali, tahlilsiz
- C) Keyin — hozir kerak emas

### Q382. Onboarding (90 kun) o'qish rejasi bilan bog'lanish
**Nima:** Yangi xodimning 90-kunlik adaptatsiyasi LMS o'quv rejasiga bog'lanadimi.
**Nega kerak:** Onboarding (yo'n.17) BOR (90-kun + mentor). Yangi xodim adaptatsiya davrida aynan kartaning kurslarini o'tishi mantiqiy.
**Variantlar:**
- A) Ha — onboarding bosqichlari LMS kurslari bilan bog'lanadi, mentor o'qishni kuzatadi
- B) Alohida — onboarding va LMS ayri yuradi
- C) Keyin — hozir kerak emas

---

## 13. CRM

### Q383. Lid → bitim → voronka bosqichlari
**Nima:** Har bir potensial mijoz "lid" (yangi qiziqqan) bo'lib kiradi, keyin "bitim"ga (deal) aylanadi va voronka (quvur) bosqichlari bo'ylab harakatlanadi.
**Nega kerak:** Sotuvchi qaysi mijoz qaysi bosqichda turganini ko'radi, hech bir mijoz unutilib qolmaydi, boshliq esa pul qayerda qotib qolganini bilib turadi.
**Variantlar:**
- A) To'liq voronka: Yangi → Aloqa qilindi → Kommercheskiy taklif → Muzokara → Yutdik/Yutqazdik — har bosqich bo'yicha hisobot va konversiya foizi
- B) Soddalashtirilgan: faqat Yangi → Ishlanmoqda → Yopildi — kam ish, lekin tahlil zaif
- C) Keyin — hozir kerak emas

### Q384. Voronka bosqichlarini kim belgilaydi
**Nima:** Voronkadagi bosqichlar ro'yxati (statuslar) qayerdan kelishi — tayyor standart yoki sizning zavod jarayoningizga moslashtirilgan.
**Nega kerak:** Karton/upakovka sotuvida "namuna (obrazets) berildi", "kalka/klişe tasdiqlandi" kabi o'ziga xos bosqichlar bor. To'g'ri bosqichlar — to'g'ri nazorat.
**Variantlar:**
- A) Sizning jarayoningizga moslab yozamiz (namuna → klişe tasdiq → narx kelishildi → shartnoma) va keyin o'zgartirsa bo'ladi
- B) Umumiy standart bosqichlar — tez, lekin zavodga to'liq mos kelmaydi
- C) Keyin — hozir kerak emas

### Q385. Lidlar qayerdan keladi (manbalar)
**Nima:** Yangi lid tizimga qaysi yo'llar orqali tushadi: vebsayt formasi, Telegram, qo'ng'iroq, ko'rgazma, tavsiya va h.k.
**Nega kerak:** Qaysi manba ko'proq mijoz keltirayotganini bilsangiz, reklama pulini to'g'ri joyga sarflaysiz.
**Variantlar:**
- A) Ko'p manba avtomatik: vebsayt + Telegram + qo'ng'iroq + qo'lda kiritish, har lidda "manba" majburiy yoziladi
- B) Faqat qo'lda kiritish — sotuvchi o'zi yozadi, lekin manbalar aniq emas
- C) Keyin — hozir kerak emas

### Q386. Vebsayt va Telegramdan avtomatik lid yaratish
**Nima:** Saytdan ariza yoki Telegramdan xabar kelganda tizim o'zi yangi lid ochadi (kod allaqachon shu yo'nalishda).
**Nega kerak:** Mijoz yozgan zahoti ish boshlanadi, qo'lda kiritish kerak emas, hech kim e'tibordan chetda qolmaydi.
**Variantlar:**
- A) Avtomatik lid + darhol sotuvchiga bildirishnoma (Telegram/ovoz) — eng tez reaksiya
- B) Avtomatik lid ochiladi, lekin bildirishnoma yo'q — sotuvchi o'zi ko'rishi kerak
- C) Keyin — hozir kerak emas

### Q387. Lidni avtomatik sotuvchiga biriktirish (taqsimot)
**Nima:** Yangi lid kelganda u qaysi sotuvchiga tushadi — avtomatik navbat bilan, hudud bo'yicha yoki boshliq qo'lda taqsimlaydi.
**Nega kerak:** Adolatli va tez taqsimot bo'lsa, lidlar "egasiz" qolmaydi va sotuvchilar o'rtasida nizo bo'lmaydi.
**Variantlar:**
- A) Avtomatik navbat (round-robin) yoki hudud/mahsulot bo'yicha qoida — adolatli va tez
- B) Boshliq har lidni qo'lda taqsimlaydi — nazorat ko'p, lekin sekin
- C) Keyin — hozir kerak emas

### Q388. Faollik (activity) jurnali
**Nima:** Har bir mijoz kartasida nima qilinganini ketma-ket yozib boruvchi jurnal: qo'ng'iroq, uchrashuv, taklif yuborildi, javob keldi.
**Nega kerak:** Sotuvchi almashsa ham mijoz tarixi qoladi, boshliq "kim qancha ishlagan"ini ko'radi.
**Variantlar:**
- A) To'liq faollik jurnali: qo'ng'iroq/xat/uchrashuv/eslatma — har biri sana, kim qilgani bilan
- B) Faqat oddiy izoh (eslatma) qo'shish — kam ma'lumot
- C) Keyin — hozir kerak emas

### Q389. Aloqa kanallari (SMS / Email / Telegram / WhatsApp)
**Nima:** Mijozga to'g'ridan-to'g'ri ERP ichidan xabar yuborish: qaysi kanallar ulanadi.
**Nega kerak:** Sotuvchi alohida ilovalarni ochmasdan, bir joydan yozadi va barcha yozishmalar mijoz kartasida saqlanadi.
**Variantlar:**
- A) To'rttasi ham: Telegram + WhatsApp + SMS + Email, hammasi mijoz kartasida ko'rinadi
- B) Faqat Telegram + SMS (zavodda eng ko'p ishlatiladigan) — qolganlari keyin
- C) Faqat qo'lda: sotuvchi o'z telefonidan yozadi, ERPda faqat belgilab qo'yadi
- D) Keyin — hozir kerak emas

### Q390. Yozishmalar tarixini saqlash
**Nima:** Mijoz bilan barcha xat-xabar (kim, qachon, nima yozdi) ERPda saqlanadimi.
**Nega kerak:** Nizo chiqsa yoki sotuvchi ketsa, gaplashilgan hamma narsa hujjat sifatida qoladi.
**Variantlar:**
- A) Hamma yozishma avtomatik saqlanadi va mijoz kartasida ko'rinadi
- B) Faqat muhim xabarlarni sotuvchi qo'lda saqlaydi
- C) Keyin — hozir kerak emas

### Q391. Vazifalar (task) va eslatmalar
**Nima:** Sotuvchiga "ertaga 10:00da Falonchiga qo'ng'iroq qil" kabi vazifa qo'yish va vaqti kelganda eslatish.
**Nega kerak:** Va'da berilgan qo'ng'iroq/uchrashuv unutilmaydi, mijoz "hech kim aloqaga chiqmadi" demaydi.
**Variantlar:**
- A) Vazifa + avtomatik eslatma (Telegram/ovoz) + bajarilmasa boshliqqa signal
- B) Faqat vazifa ro'yxati, eslatmasiz — sotuvchi o'zi ko'radi
- C) Keyin — hozir kerak emas

### Q392. Kechiktirilgan vazifa ustidan nazorat
**Nima:** Muddati o'tib ketgan (mijozga qaytib aloqa qilinmagan) vazifalar boshliqqa qizil ro'yxat bo'lib chiqsinmi.
**Nega kerak:** "Mijoz sovub qoldi, chunki 3 kun javob bermadik" holatini oldindan ko'rish va tuzatish.
**Variantlar:**
- A) Ha — kechikkan vazifalar avtomatik boshliq paneliga + sotuvchiga ogohlantirish
- B) Faqat boshliq xohlagan paytda hisobot ochib ko'radi
- C) Keyin — hozir kerak emas

### Q393. Hot-lead (qaynoq mijoz) belgisi
**Nima:** Sotib olishga eng yaqin, qiziqishi yuqori mijozlarni alohida "qaynoq" deb ajratish.
**Nega kerak:** Sotuvchi vaqtini eng pul keltiradigan mijozlarga sarflaydi, sovuq lidlarga emas.
**Variantlar:**
- A) Avtomatik: tizim faollik va summaga qarab qaynoq lidni o'zi ajratadi va tepaga chiqaradi
- B) Qo'lda: sotuvchi o'zi "qaynoq" deb belgilaydi
- C) Aralash: tizim taklif qiladi, sotuvchi tasdiqlaydi
- D) Keyin — hozir kerak emas

### Q394. Lid baholash (lead scoring) — ball berish
**Nima:** Har lidga avtomatik ball qo'yish (qancha qiziqdi, qancha summa, qancha tez javob berdi) — yuqori ball = ustuvor.
**Nega kerak:** Ko'p lid bo'lganda qaysi biriga avval yopishishni tizim aytib beradi.
**Variantlar:**
- A) Avtomatik ballash — qoidalarni biz sizning mezonlaringizga moslab yozamiz
- B) Faqat hot/yo'q belgisi yetarli, ball kerak emas
- C) Keyin — hozir kerak emas

### Q395. AI — Keyingi eng yaxshi harakat (NBA)
**Nima:** AI har mijoz uchun "endi nima qilish kerak"ni taklif qiladi: qo'ng'iroq qil, chegirma taklif et, namuna yubor (kod allaqachon shu yo'nalishda).
**Nega kerak:** Tajribasiz sotuvchi ham to'g'ri keyingi qadamni biladi, sotuv ko'payadi.
**Variantlar:**
- A) AI taklif beradi, sotuvchi tasdiqlab bajaradi — aqlli, lekin nazorat sotuvchida
- B) AI faqat ko'rsatadi, hech narsa taklif qilmaydi (oddiy ro'yxat)
- C) Keyin — hozir kerak emas

### Q396. AI — Churn (mijoz ketib qolishi) bashorati
**Nima:** AI qaysi doimiy mijoz sovib, raqobatchiga ketib qolishi mumkinligini oldindan ogohlantiradi (churn.service kod bor).
**Nega kerak:** Mijozni butunlay yo'qotishdan oldin qaytarish arzonroq va oson.
**Variantlar:**
- A) AI "ketib qolish xavfi yuqori" mijozlarni ro'yxatga chiqaradi + sotuvchiga qaytarish vazifasi
- B) Faqat hisobot — boshliq o'zi ko'radi, avtomatik harakat yo'q
- C) Keyin — hozir kerak emas

### Q397. Mijoz tarixi (360° ko'rinish)
**Nima:** Bitta mijoz kartasida hamma narsa: barcha buyurtmalar, to'lovlar, qarzlar, yozishmalar, shikoyatlar bir joyda.
**Nega kerak:** Sotuvchi mijoz haqida hamma narsani bir ekranda ko'radi — qancha olgan, qancha qarzi bor, oxirgi marta qachon yozgan.
**Variantlar:**
- A) To'liq 360°: buyurtma + to'lov + qarz + yozishma + shikoyat hammasi bir kartada (ERP modullari bilan bog'langan)
- B) Faqat CRM ma'lumotlari (buyurtma/to'lov boshqa modulda alohida)
- C) Keyin — hozir kerak emas

### Q398. CRM mijozi ↔ zavod buyurtmasi bog'lanishi (oltin ip)
**Nima:** CRMda "bitim yutdik" deyilganda, u avtomatik zavod sotuv buyurtmasiga (sales order) aylanadimi.
**Nega kerak:** Ikki marta yozish yo'qoladi: kelishilgan bitim to'g'ridan-to'g'ri ishlab chiqarish/ombor jarayoniga ulanadi. (Hozirda ikki "buyurtma dunyosi" muammosi bor.)
**Variantlar:**
- A) Avtomatik: bitim yutilsa → sotuv buyurtmasi yaratiladi (bir tugma) — to'liq oltin ip
- B) Yarim avtomatik: tizim tayyorlaydi, sotuv bo'limi tekshirib tasdiqlaydi
- C) Qo'lda: bitim yopiladi, buyurtmani alohida kiritadilar
- D) Keyin — hozir kerak emas

### Q399. Mijoz bazasi qayerda — yagona manba
**Nima:** Mijoz ma'lumotlari (telefon, nom, manzil) bitta yagona joyda saqlanadimi yoki har modul o'ziniki bormi.
**Nega kerak:** Hozir tizimda bir nechta mijoz jadvali bor (sd_customers va boshqalar) — bu chalkashlikni keltiradi. Yagona baza = ishonchli ma'lumot.
**Variantlar:**
- A) Yagona kanonik mijoz bazasi — hamma modul shundan oladi (tavsiya, lekin texnik birlashtirish kerak)
- B) Hozirgi holatda qoldiramiz, keyin birlashtiramiz
- C) Keyin — hozir kerak emas

### Q400. Mijoz turlari va segmentlari
**Nima:** Mijozlarni guruhlarga ajratish: doimiy / yangi / yirik / kichik / VIP / tarmoq do'koni va h.k.
**Nega kerak:** Har guruhga boshqacha munosabat, chegirma va e'tibor berish mumkin; hisobotlar aniqroq.
**Variantlar:**
- A) Biz sizning mezonlaringizga moslab segmentlar ro'yxatini tuzamiz (oborot/sodiqlik bo'yicha)
- B) Oddiy: faqat "doimiy" va "yangi" — yetarli
- C) Keyin — hozir kerak emas

### Q401. RFM / CLV tahlili (mijoz qadr-qiymati)
**Nima:** AI mijozlarni "qachon, qancha tez-tez, qancha pulga oldi" bo'yicha baholaydi va eng qimmatli mijozlarni ajratadi (rfm/clv kod bor).
**Nega kerak:** Eng ko'p pul keltiradigan 20% mijozni bilib, ularga ko'proq e'tibor berasiz.
**Variantlar:**
- A) Ha — RFM + mijoz umrlik qiymati (CLV) hisobi panelga chiqsin
- B) Faqat oddiy "oborot bo'yicha top mijozlar" ro'yxati yetarli
- C) Keyin — hozir kerak emas

### Q402. Yutqazilgan bitim sababini yozish
**Nima:** Bitim "yutqazildi" bo'lganda sababi majburiy tanlanadi: narx baland, muddat uzoq, sifat, raqobatchi va h.k.
**Nega kerak:** Nega mijoz ketayotganini bilsangiz, kelajakda shu kamchilikni tuzatasiz.
**Variantlar:**
- A) Majburiy sabab tanlash (tayyor ro'yxatdan) + ixtiyoriy izoh — keyin hisobot chiqadi
- B) Sababni yozish ixtiyoriy
- C) Keyin — hozir kerak emas

### Q403. Kommercheskiy taklif / narx-taklif yuborish
**Nima:** Mijozga narx taklifini (KP/oferta) CRM ichidan tayyorlab yuborish va u "ochildimi, qabul qilindimi"ni kuzatish.
**Nega kerak:** Taklif yuborilgandan keyin javobni kutib o'tirilmaydi — tizim eslatadi va kuzatadi.
**Variantlar:**
- A) Tizim ichida KP tayyorlash + yuborish + holatini kuzatish (ko'rildi/qabul/rad)
- B) Faqat "taklif yuborildi" deb belgilab qo'yish, faylni o'zi tashqarida tayyorlaydi
- C) Keyin — hozir kerak emas

### Q404. Karta-model bilan integratsiya (kim CRMda ishlaydi)
**Nima:** CRMda ishlash huquqi org-strukturadagi qaysi kartaga (lavozimga) biriktiriladi: sotuv menejeri, sotuv boshlig'i.
**Nega kerak:** Sizning karta-markazli modelda har ish kartaga bog'lanadi — kim qaysi mijozni ko'radi/o'zgartiradi shu yerda hal bo'ladi.
**Variantlar:**
- A) CRM huquqlari karta bo'yicha: sotuvchi faqat o'z mijozini, boshliq hammasini — karta-model bilan to'liq bog'lash
- B) Oddiy: hamma sotuvchi hammasini ko'radi (ishonch asosida)
- C) Keyin — hozir kerak emas

### Q405. Sotuvchi ЦКП va KPI bog'lanishi
**Nima:** Sotuvchi kartasining ЦКП (yakuniy mahsuloti) — masalan "yopilgan bitimlar summasi" — CRM raqamlaridan avtomatik to'lsinmi.
**Nega kerak:** ShVB modelida har kartaning natijasi o'lchanadi; CRM sotuvchining haqiqiy natijasini ko'rsatadi (oylik/razryadga ulanadi).
**Variantlar:**
- A) Ha — CRMdagi yopilgan bitim/oborot avtomatik sotuvchi KPI/ЦКП paneliga ulanadi
- B) Faqat CRM hisobotini ko'rsatamiz, KPIga qo'lda kiritiladi
- C) Keyin — hozir kerak emas

### Q406. Mijoz qarzdorligi bo'yicha ogohlantirish
**Nima:** Mijozning to'lanmagan qarzi bo'lsa, sotuvchiga yangi buyurtma olishdan oldin ogohlantirish/blok chiqadimi.
**Nega kerak:** Qarzi bor mijozga yana yuk bermaslik — pul yo'qotishning oldini oladi (Moliya moduli bilan bog'lanadi).
**Variantlar:**
- A) Ha — qarz limitidan oshsa avtomatik ogohlantirish, boshliq ruxsatisiz yangi bitim ochilmaydi
- B) Faqat qarz summasi ko'rsatiladi, blok yo'q — sotuvchi o'zi qaror qiladi
- C) Keyin — hozir kerak emas

### Q407. Mijoz shikoyatlari / reklamatsiyalar bog'lanishi
**Nima:** Mijozning sifat shikoyati (reklamatsiya) CRM kartasida ko'rinadimi (Sifat moduli bilan bog'lanish).
**Nega kerak:** Sotuvchi mijozga qo'ng'iroq qilishdan oldin "bu mijozda hal qilinmagan shikoyat bor"ligini biladi.
**Variantlar:**
- A) Ha — shikoyatlar mijoz kartasida ko'rinadi va hal bo'lguncha qizil belgi turadi
- B) Shikoyat faqat Sifat modulida, CRMda ko'rinmaydi
- C) Keyin — hozir kerak emas

### Q408. Avtomatik eslatma kampaniyalari (follow-up)
**Nima:** Uzoq aloqaga chiqmagan mijozlarga tizim o'zi belgilangan vaqtda eslatma/xabar yuboradimi (masalan, 30 kun jim turgan doimiy mijozga).
**Nega kerak:** Mijozlar "esdan chiqarilmaydi", takroriy sotuv ko'payadi.
**Variantlar:**
- A) Ha — qoidaga ko'ra avtomatik eslatma (30/60/90 kun jimlikdan keyin) + sotuvchiga vazifa
- B) Faqat sotuvchi o'zi xohlaganda yuboradi
- C) Keyin — hozir kerak emas

### Q409. CRM boshqaruv paneli (boshliq uchun)
**Nima:** Sotuv boshlig'i uchun yagona ekran: voronka holati, har sotuvchi natijasi, qaynoq lidlar, kechikkan vazifalar, churn xavfi.
**Nega kerak:** Boshliq bir qarashda butun sotuv holatini ko'radi, kunlik yig'ilishlarsiz nazorat qiladi.
**Variantlar:**
- A) To'liq panel: voronka + sotuvchi reytingi + AI signal (churn/hot) + kechikkan vazifa — bitta ekran
- B) Oddiy panel: faqat voronka va bitimlar summasi
- C) Keyin — hozir kerak emas

### Q410. Telefon qo'ng'irog'ini yozib olish va biriktirish
**Nima:** Mijozga qilingan qo'ng'iroq (kim, qachon, qancha vaqt, yozuvi) avtomatik mijoz kartasiga tushadimi (telefoniya integratsiyasi).
**Nega kerak:** Boshliq "haqiqatan qo'ng'iroq qilindimi"ni tekshiradi, nizoda qo'ng'iroq yozuvi dalil bo'ladi.
**Variantlar:**
- A) Ha — telefoniya ulanadi, qo'ng'iroqlar avtomatik kartaga tushadi (qo'shimcha sozlash kerak)
- B) Qo'lda: sotuvchi "qo'ng'iroq qildim" deb o'zi belgilaydi
- C) Keyin — hozir kerak emas

### Q411. Mobil ilovada CRM (sotuvchi tashqarida)
**Nima:** Sotuvchi mijoz oldida, yo'lda telefondan CRMga kira oladimi: yangi lid kiritish, vazifa ko'rish, yozishma.
**Nega kerak:** Sotuvchilar ko'pincha tashqarida — uchrashuvdan keyin darhol natijani kiritsa, hech narsa unutilmaydi.
**Variantlar:**
- A) Ha — mobil/telefonda asosiy CRM amallari (lid, vazifa, yozishma) ishlaydi
- B) Faqat kompyuterdan — sotuvchi ofisga qaytib kiritadi
- C) Keyin — hozir kerak emas

### Q412. Mijoz ma'lumotlariga kirish chegarasi (maxfiylik)
**Nima:** Bir sotuvchi boshqa sotuvchining mijozini va uning kontakt/summalarini ko'ra oladimi.
**Nega kerak:** Sotuvchi ketganda mijoz bazasini "olib ketmasligi" va ichki raqobatda mijoz "o'g'irlanmasligi" uchun.
**Variantlar:**
- A) Yo'q — har sotuvchi faqat o'z mijozini ko'radi, boshliq hammasini (karta-model bilan bog'liq)
- B) Hamma hammasini ko'radi — ochiq, ishonch asosida
- C) Keyin — hozir kerak emas

---

## 14. Marketing

### Q413. Lid (mijoz nomzodi) yagona roʻyxati
**Nima:** Hamma yangi mijoz nomzodlari (lid) bitta umumiy roʻyxatga tushadigan joy boʻladimi.
**Nega kerak:** Hozir lidlar telefon, Telegram, koʻrgazma qogʻozlarida tarqoq. Bitta roʻyxat boʻlsa, birortasi ham yoʻqolib qolmaydi va kim qaysi lid ustida ishlayotgani koʻrinadi.
**Variantlar:**
- A) Ha, barcha kanaldan kelgan lid avtomatik bitta roʻyxatga tushsin — hech narsa yoʻqolmaydi, hisobot toʻliq
- B) Faqat qoʻlda kiritiladigan oddiy roʻyxat — sodda, lekin avtomatik yigʻilmaydi
- C) Keyin — hozir kerak emas

### Q414. 4 ta lid kanali (SMM / reklama / tavsiya / koʻrgazma)
**Nima:** Har bir lid qaysi kanaldan kelganini belgilaymizmi — SMM (ijtimoiy tarmoq), pullik reklama, tavsiya (tanish orqali), koʻrgazma.
**Nega kerak:** Qaysi kanal koʻproq mijoz keltirayotganini bilsangiz, pulni shu kanalga koʻproq tikasiz, behuda kanaldan voz kechasiz.
**Variantlar:**
- A) Hamma 4 kanal alohida belgilanadi va har biriga statistika chiqadi — qaysi kanal foydali ekani aniq koʻrinadi
- B) Faqat "qayerdan eshitdingiz" degan oddiy izoh maydoni — sodda, lekin taqqoslab boʻlmaydi
- C) Keyin — hozir kerak emas

### Q415. Kanallar roʻyxatini kim belgilaydi (master-data)
**Nima:** Lid kanallari roʻyxati (SMM, reklama, tavsiya, koʻrgazma va boshqa) qanday boshqariladi.
**Nega kerak:** Ertaga yangi kanal (masalan, "marketplace" yoki "saytdan") qoʻshilsa, dasturchini chaqirmasdan oʻzingiz qoʻsha olishingiz kerak.
**Variantlar:**
- A) Sozlamalarda kanal roʻyxati boʻlsin, marketing boshligʻi oʻzi qoʻshib/oʻchirsin — moslashuvchan
- B) Kanallar dasturda qattiq belgilangan boʻlsin — oʻzgartirish uchun dasturchi kerak
- C) Keyin — hozir kerak emas

### Q416. Lid bosqichlari (status oqimi)
**Nima:** Lid qaysi bosqichlardan oʻtishini belgilaymiz — masalan: Yangi → Aloqaga chiqildi → Qiziqdi → Taklif berildi → Mijoz boʻldi / Rad etdi.
**Nega kerak:** Har bir lid qaysi bosqichda ekani koʻrinsa, sotuvchi qaysi mijozga qoʻngʻiroq qilishini biladi, "voronka" (yoʻnalish) toʻliq boʻladi.
**Variantlar:**
- A) Toʻliq bosqichli oqim (5-6 bosqich) + har bosqichda qancha lid borligi koʻrinadi — boshqaruv aniq
- B) Faqat 3 oddiy holat: Yangi / Ishlanmoqda / Yopildi — sodda
- C) Keyin — hozir kerak emas

### Q417. Lid → Savdo (SD) bilan ulanish
**Nima:** Lid "mijoz boʻldi" deb belgilanganda u avtomatik Savdo moduliga (mijoz/buyurtma) oʻtsinmi.
**Nega kerak:** Qoʻlda qayta kiritish vaqt yoʻqotadi va xato keltiradi. Avtomatik oʻtsa, marketingdan savdogacha bitta uzluksiz zanjir boʻladi.
**Variantlar:**
- A) Avtomatik: lid yutilganda Savdoda mijoz kartochkasi yaratiladi — bir marta kiritildi, ikkala joyda bor
- B) Qoʻlda: sotuvchi koʻchirib kiritadi — nazorat koʻp, lekin sekin
- C) Keyin — hozir kerak emas

### Q418. Kampaniya kartochkasi
**Nima:** Har bir marketing kampaniyasi (masalan "Yangi yil aksiyasi", "Koʻrgazma 2026") alohida kartochka boʻlib, byudjeti, muddati va natijasi yoziladimi.
**Nega kerak:** Kampaniyaga qancha pul ketdi va qancha mijoz/savdo keltirdi — buni faqat alohida kartochka koʻrsata oladi.
**Variantlar:**
- A) Toʻliq kartochka: byudjet + muddat + maqsad + bogʻlangan lidlar + natija — har kampaniya foydasi koʻrinadi
- B) Faqat nom va sana yoziladigan oddiy roʻyxat — kam maʼlumot
- C) Keyin — hozir kerak emas

### Q419. Kampaniya ROI (foyda qaytishi) hisobi
**Nima:** Tizim har bir kampaniya boʻyicha "qancha pul tikildi / qancha savdo keltirdi" ni avtomatik hisoblasinmi.
**Nega kerak:** ROI boʻlsa, foyda keltirgan kampaniyani takrorlaysiz, zararlisidan voz kechasiz — pul behuda ketmaydi.
**Variantlar:**
- A) Avtomatik ROI: kampaniya xarajati Moliyadan, savdo Savdo modulidan olinadi — aniq raqam
- B) Qoʻlda: marketolog xarajat va natijani oʻzi kiritadi — taxminiy
- C) Keyin — hozir kerak emas

### Q420. Cost-per-lead (bitta lid narxi)
**Nima:** Har bir kanal va kampaniya boʻyicha "bitta lid bizga necha pulga tushdi" koʻrsatkichi hisoblanadimi.
**Nega kerak:** Reklamaga 5 mln soʻm sarflab 2 ta lid kelsa — bu qimmat. Lid narxini bilsangiz, qaysi kanal arzon mijoz keltirishini koʻrasiz.
**Variantlar:**
- A) Avtomatik: kanal xarajati / kelgan lid soni — har kanal uchun lid narxi koʻrinadi
- B) Faqat umumiy oylik xarajat koʻrsatiladi, lid narxi hisoblanmaydi — yuzaki
- C) Keyin — hozir kerak emas

### Q421. Marketing KPI panosi
**Nima:** Marketing uchun asosiy koʻrsatkichlar bitta ekranda turadimi — yangi lidlar soni, konversiya foizi, lid narxi, ROI, NPS.
**Nega kerak:** Har oy raqamlarni qoʻlda yigʻish oʻrniga, bir qarashda marketing qanday ishlayotganini koʻrasiz.
**Variantlar:**
- A) Toʻliq KPI paneli, raqamlar avtomatik yangilanadi — boshqaruv tez
- B) Faqat oddiy lidlar soni koʻrsatkichi — chala manzara
- C) Keyin — hozir kerak emas

### Q422. Koʻrgazmadan lid yigʻish
**Nima:** Koʻrgazmada tanishgan odamlarni telefonda/planshetda tezda lid sifatida kiritish imkoni boʻladimi.
**Nega kerak:** Koʻrgazmada qogʻozga yozilgan vizitkalar koʻpincha yoʻqoladi. Tezkor kiritish boʻlsa, hamma kontakt saqlanadi va keyin qoʻngʻiroq qilinadi.
**Variantlar:**
- A) Tez kiritish formasi (telefon raqam + ism + qiziqishi) koʻrgazma tugmasi bilan — hech kim yoʻqolmaydi
- B) Koʻrgazmadan keyin qogʻozdan koʻchirib kiritiladi — koʻp narsa unutiladi
- C) Keyin — hozir kerak emas

### Q423. Koʻrgazma natijasini oʻlchash
**Nima:** Har bir koʻrgazma (masalan "UzPack 2026") boʻyicha qancha lid yigʻildi, qanchasi mijoz boʻldi degan natija saqlanadimi.
**Nega kerak:** Koʻrgazmada qatnashish qimmat. Natijasini bilsangiz, kelasi yili qaysi koʻrgazmaga borishni toʻgʻri tanlaysiz.
**Variantlar:**
- A) Koʻrgazma kampaniya sifatida ochiladi, xarajat va lid/savdo natijasi ulanadi — foydasi aniq
- B) Faqat "qatnashdik" deb belgilanadi, natija oʻlchanmaydi — bilib boʻlmaydi
- C) Keyin — hozir kerak emas

### Q424. Ijtimoiy inbox (bitta joyda barcha xabar)
**Nima:** Instagram/Telegram/Facebook dan kelgan xabarlar bitta umumiy "inbox" da koʻrinadimi.
**Nega kerak:** Hozir har bir tarmoqni alohida ochib koʻrish kerak, baʼzi xabarlar javobsiz qoladi. Bitta inbox boʻlsa, hech bir mijoz savoli unutilmaydi.
**Variantlar:**
- A) Hamma tarmoq xabari bitta inboxga yigʻiladi, javob shu yerdan beriladi — tez va toʻliq
- B) Faqat eslatma: "bu tarmoqdan xabar bor" — oʻzi tarmoqda javob beriladi
- C) Keyin — hozir kerak emas

### Q425. Inboxdagi xabarni lidga aylantirish
**Nima:** Ijtimoiy inboxda mijoz "narxi qancha?" deb yozsa, uni bir tugma bilan lidga aylantirib boʻladimi.
**Nega kerak:** Qiziqqan odam darrov lid roʻyxatiga tushsa, sotuvchi ortidan boradi va savdoga aylantiradi.
**Variantlar:**
- A) Inboxdagi suhbatdan "lid yarat" tugmasi — xabar yoʻqolmaydi, savdoga oʻtadi
- B) Marketolog qoʻlda yangi lid kiritadi — qoʻshimcha ish
- C) Keyin — hozir kerak emas

### Q426. Inboxga javob berish vaqti nazorati
**Nima:** Mijoz xabariga necha vaqtda javob berilgani oʻlchanadimi (masalan, 1 soatdan keyin javob = kech).
**Nega kerak:** Qadoqlash bozorida tez javob bergan kompaniya buyurtmani oladi. Kechikishlar koʻrinsa, xizmatni yaxshilaysiz.
**Variantlar:**
- A) Har xabarga javob vaqti oʻlchanadi, kechikkanlari belgilanadi — xizmat sifati koʻrinadi
- B) Vaqt oʻlchanmaydi, faqat javob berildi/berilmadi koʻrinadi — yuzaki
- C) Keyin — hozir kerak emas

### Q427. NPS (mijoz sadoqati) soʻrovi
**Nima:** Mijozlarga "bizni tanishingizga 0-10 ball bilan tavsiya qilarmidingiz?" degan soʻrov yuboriladimi.
**Nega kerak:** NPS — mijoz qoniqishining sodda oʻlchovi. Past ball bergan mijozni yoʻqotmasdan oldin muammoni hal qilasiz.
**Variantlar:**
- A) Buyurtma yopilgach NPS soʻrovi avtomatik yuboriladi va ball saqlanadi — qoniqish kuzatiladi
- B) Marketolog vaqti-vaqti bilan qoʻlda soʻraydi — tartibsiz
- C) Keyin — hozir kerak emas

### Q428. NPS dan keyingi harakat
**Nima:** Mijoz past ball (masalan 0-6) berganda nima boʻladi.
**Nega kerak:** Norozi mijoz aniqlanib, darhol ishlansa, u raqobatchiga ketmaydi. Bu eng arzon mijoz saqlash usuli.
**Variantlar:**
- A) Past ball avtomatik ogohlantirish + masʼulga vazifa yaratadi — muammo darrov hal qilinadi
- B) Faqat ball saqlanadi, hech narsa boʻlmaydi — koʻrinadi-yu, harakat yoʻq
- C) Keyin — hozir kerak emas

### Q429. Blog / kontent boshqaruvi
**Nima:** Sayt/ijtimoiy tarmoq uchun maqola va postlar ERP ichida boshqarilsinmi (yozildi → tekshirildi → eʼlon qilindi).
**Nega kerak:** Muntazam kontent — bepul lid manbai. Tizimda boʻlsa, qaysi mavzu koʻp oʻqilganini koʻrasiz.
**Variantlar:**
- A) Toʻliq: kontent roʻyxati + holati + qaysi kanalga ketdi + natija — tartibli
- B) Faqat gʻoyalar roʻyxati (oddiy eslatma) — kam
- C) Keyin — hozir kerak emas

### Q430. Marketing kontent kalendari
**Nima:** Qaysi kuni qaysi post/reklama chiqishi kalendarda rejalashtiriladimi.
**Nega kerak:** Reja boʻlmasa, marketing tartibsiz boʻladi — baʼzi hafta hech narsa, baʼzi kun toʻrtta post. Kalendar muvozanat beradi.
**Variantlar:**
- A) Kalendar koʻrinishida reja, masʼul va kanal belgilanadi — tartibli va koʻrinarli
- B) Faqat oddiy vazifa roʻyxati (sanasiz) — boshqarish qiyin
- C) Keyin — hozir kerak emas

### Q431. Kim marketingni yuritadi (rollar)
**Nima:** Marketingda kim nima qiladi — lid kiritish, inboxga javob, kampaniya ochish, hisobot koʻrish kim ruxsatida boʻladi.
**Nega kerak:** Har kim hammasini qila olsa, chalkashlik va xato boʻladi. Rollar aniq boʻlsa, masʼuliyat aniq boʻladi.
**Variantlar:**
- A) Rollar boʻyicha boʻlinadi: marketolog (lid/inbox), boshliq (kampaniya/byudjet), direktor (hisobot) — tartibli
- B) Marketing boʻlimidagi hamma hamma narsani koʻradi/oʻzgartiradi — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q432. Karta-model bilan integratsiya (kartochka markazli model)
**Nima:** Marketing vazifalari (lid kiritish, inbox javobi, kampaniya yuritish) sizning org "kartochka" modelingizdagi aniq lavozim kartalariga bogʻlanadimi.
**Nega kerak:** Sizning vizyoningizda ish — kartochkaga biriktirilgan. Marketing vazifalari kartaga bogʻlansa, kim qaysi ishni qilishi va razryadi aniq boʻladi.
**Variantlar:**
- A) Har marketing vazifasi tegishli lavozim kartochkasiga bogʻlanadi (talab/razryad/ЦКП bilan) — vizyonga toʻliq mos
- B) Marketing alohida boʻlim sifatida ishlaydi, kartaga bogʻlanmaydi — vizyondan ajralib qoladi
- C) Keyin — hozir kerak emas

### Q433. Marketing AI yordamchisi
**Nima:** Marketing uchun AI yordamchisi boʻlsinmi — qaysi kanal foydali, qaysi lid issiq, qanday kontent yozish kabi maslahat beradigan.
**Nega kerak:** AI raqamlarni tahlil qilib, "bu hafta tavsiya kanalidan koʻp mijoz keldi, koʻproq eʼtibor bering" deb yoʻnaltira oladi.
**Variantlar:**
- A) AI lid/kanal/kampaniya maʼlumotini tahlil qilib tavsiya beradi — aqlli yordam
- B) AI yordamchisiz, faqat raqamlar koʻrsatiladi — odam oʻzi tahlil qiladi
- C) Keyin — hozir kerak emas

### Q434. Issiq lid belgilash (lid skoring)
**Nima:** Lidlar "issiq" (tez sotib oladi) va "sovuq" (uzoq oʻylaydi) ga ajratiladimi.
**Nega kerak:** Sotuvchi vaqti cheklangan. Issiq lidlarga avval qoʻngʻiroq qilsa, savdo tez yopiladi.
**Variantlar:**
- A) Belgilar boʻyicha avtomatik baholanadi (qaytib yozgan, narx soʻragan = issiq) — sotuvchi toʻgʻri tartibda ishlaydi
- B) Marketolog/sotuvchi oʻzi qoʻlda issiq/sovuq deb belgilaydi — taxminiy
- C) Keyin — hozir kerak emas

### Q435. Tavsiya kanalini kuzatish (kim tavsiya qildi)
**Nima:** Tavsiya orqali kelgan mijoz uchun "kim tavsiya qildi" saqlanadimi.
**Nega kerak:** Karton bozorida tavsiya — eng ishonchli kanal. Kim koʻp mijoz olib kelayotganini bilsangiz, ularni ragʻbatlantirasiz (bonus/chegirma).
**Variantlar:**
- A) Har tavsiya lidida "tavsiya qilgan mijoz/odam" yoziladi va kim koʻp olib kelgani koʻrinadi — ragʻbat aniq
- B) Faqat "tavsiya orqali keldi" deb belgilanadi, kimligi yozilmaydi — kam foyda
- C) Keyin — hozir kerak emas

### Q436. Reklama xarajatini Moliya bilan ulash
**Nima:** Reklama va SMM xarajatlari Moliya modulidagi haqiqiy toʻlovlardan olinadimi.
**Nega kerak:** ROI va lid narxi toʻgʻri boʻlishi uchun xarajat raqami haqiqiy boʻlishi kerak, qoʻlda kiritilgan taxmin emas.
**Variantlar:**
- A) Marketing xarajati Moliyadagi toʻlovlardan avtomatik olinadi — raqam ishonchli
- B) Marketolog xarajatni qoʻlda kiritadi — tez, lekin xato boʻlishi mumkin
- C) Keyin — hozir kerak emas

### Q437. Lid manbasi → mijoz umrbod qiymati
**Nima:** Lid mijoz boʻlgach, u vaqt oʻtib qancha umumiy buyurtma berdi degan koʻrsatkich kanalga bogʻlanadimi.
**Nega kerak:** Baʼzi kanal koʻp lekin kichik mijoz, baʼzisi kam lekin yirik mijoz keltiradi. Buni bilsangiz, yirik mijoz keltiruvchi kanalga koʻproq sarmoya tikasiz.
**Variantlar:**
- A) Har kanal boʻyicha kelgan mijozlarning umumiy savdosi koʻrsatiladi — chuqur tahlil
- B) Faqat lid soni koʻrsatiladi, keyingi savdo bogʻlanmaydi — yuzaki
- C) Keyin — hozir kerak emas

### Q438. Inboxda tayyor javob shablonlari
**Nima:** Tez-tez soʻraladigan savollarga (narx, muddat, minimal partiya) tayyor javob shablonlari boʻlsinmi.
**Nega kerak:** Bir xil savolga qayta-qayta yozish vaqt oladi. Shablon boʻlsa, javob bir tugma bilan tez beriladi.
**Variantlar:**
- A) Tayyor javob shablonlari boʻladi, marketolog bir tugma bilan yuboradi — tez xizmat
- B) Har safar qoʻlda yoziladi — sekin
- C) Keyin — hozir kerak emas

### Q439. Marketing hisobotlari (kim koʻradi va qachon)
**Nima:** Marketing hisoboti (lidlar, ROI, NPS) qancha tez-tez va kimga koʻrsatiladi.
**Nega kerak:** Direktorga muntazam, aniq hisobot kelsa, marketing pulining qayerga ketayotgani shaffof boʻladi.
**Variantlar:**
- A) Avtomatik oylik/haftalik hisobot direktor va boshliqqa chiqadi — shaffof boshqaruv
- B) Faqat soʻralganda qoʻlda tayyorlanadi — kechikadi
- C) Keyin — hozir kerak emas

### Q440. Kampaniya koʻp kanaldan birga yuritish
**Nima:** Bitta kampaniya bir vaqtda bir nechta kanalda (SMM + reklama + koʻrgazma) yuritilsa, har kanalning ulushi alohida koʻrinadimi.
**Nega kerak:** "Yangi yil aksiyasi" hamma kanalda ketsa ham, qaysi kanal koʻp mijoz keltirdi degan savol qoladi. Ulush alohida koʻrinsa, kuchli kanal aniqlanadi.
**Variantlar:**
- A) Bitta kampaniya ostida har kanal alohida lid/xarajat bilan yuritiladi — eng aniq tahlil
- B) Kampaniya bitta umumiy raqam sifatida koʻriladi, kanal ulushi ajratilmaydi — soddalashgan
- C) Keyin — hozir kerak emas

### Q441. Yoʻqotilgan lid sababini saqlash
**Nima:** Lid "rad etdi" boʻlganda sababi yoziladimi (narx qimmat, muddat uzoq, raqobatchiga ketdi va h.k.).
**Nega kerak:** Sabablarni bilsangiz, koʻp takrorlanadigan muammoni (masalan narx) tuzatib, keyingi lidlarni yoʻqotmaysiz.
**Variantlar:**
- A) Rad sababi roʻyxatdan tanlanadi va statistikasi chiqadi — zaif tomon koʻrinadi
- B) Faqat "yopildi" deb belgilanadi, sabab yozilmaydi — saboq olib boʻlmaydi
- C) Keyin — hozir kerak emas

### Q442. Koʻrgazma/kampaniya material va byudjet rejasi
**Nima:** Koʻrgazma yoki yirik kampaniya oldidan kerakli material (banner, broshyura, sovgʻa) va byudjet roʻyxati tuziladimi.
**Nega kerak:** Oldindan reja boʻlsa, oxirgi kunda shoshilib qolmaydi va byudjetdan oshib ketmaydi.
**Variantlar:**
- A) Kampaniyaga tayyorgarlik roʻyxati + byudjet rejasi biriktiriladi — tartibli tashkillashtirish
- B) Tayyorgarlik kampaniyadan tashqarida, qoʻlda boshqariladi — chalkashlik xavfi
- C) Keyin — hozir kerak emas

---

## 15. Kanban / Vazifalar

### Q443. 3-savat qaysi modulda yashaydi
**Nima:** Kiruvchi/Kutilmoqda/Chiquvchi 3 ta savat hozir Communication Center (xat-hujjat oqimi) ichida bor; Kanban modulida esa alohida taxta-kartalar bor.
**Nega kerak:** Xodim ikki joyda ish izlamasligi, "menga kelgan hamma narsa bir joyda" bo'lishi uchun yagona kirish nuqtasi kerak.
**Variantlar:**
- A) 3-savat = har xodimning shaxsiy "ish stoli", Kanban taxtalari uning ichidan ochiladi — bitta yagona oyna, eng sodda foydalanuvchiga
- B) 3-savat hujjatlar uchun, Kanban vazifalar uchun — alohida qoladi, lekin bitta "umumiy son" badge ko'rsatiladi
- C) Keyin — hozir kerak emas

### Q444. Savatga nima tushadi
**Nima:** "Kiruvchi" savatga aynan qaysi narsalar avtomat tushishi (vazifa, doklad, rasporyajenie, ЗВС tasdiq, xabar, eslatma).
**Nega kerak:** Savat haqiqiy "kun boshlanadigan joy" bo'lishi uchun hamma kelgan ish shu yerda to'planishi shart, aks holda xodim baribir 5 joyni tekshiradi.
**Variantlar:**
- A) Hammasi: menga tegishli har qanday vazifa, doklad, rasporyajenie, tasdiq so'rovi, @belgilash, eslatma — bitta Kiruvchi savatga
- B) Faqat hujjatlar (doklad/rasporyajenie/buyruq), vazifalar Kanban taxtada alohida
- C) Keyin — hozir kerak emas

### Q445. 24 soat qoidasi qanday ishlaydi
**Nima:** Kiruvchi savatdagi narsa 24 soatdan oshsa nima bo'ladi (hozir 24h/48h cron bor).
**Nega kerak:** "Hech narsa javobsiz yotmasin" — ShVB ning asosiy intizom qoidasi; eskirgan ish ko'rinmasa, savat ma'noni yo'qotadi.
**Variantlar:**
- A) 24 soatda qizil belgi + egasiga eslatma, 48 soatda boshliqqa ham xabar (eskalatsiya) — bosqichli bosim
- B) Faqat 24 soatda qizil rang, eslatmasiz — yumshoq
- C) Soat o'rniga ish-kuni hisoblansin (dam olish kuni hisoblanmaydi)
- D) Keyin — hozir kerak emas

### Q446. 24 soat ish vaqtimi yoki astronomik vaqtmi
**Nima:** 24 soat oddiy soat bo'yicha sanaladimi yoki faqat ish soatlari (masalan 9:00–18:00, dam olishsiz).
**Nega kerak:** Juma kechqurun kelgan ish dushanba ertalab "kechikkan" ko'rinmasligi uchun — adolatli o'lchov.
**Variantlar:**
- A) Faqat ish soatlari + ish kunlari hisoblansin (kalendar + smena jadvalidan) — adolatli, lekin sozlash kerak
- B) Oddiy 24 astronomik soat — eng sodda
- C) Keyin — hozir kerak emas

### Q447. Kutilmoqda savatining ma'nosi
**Nima:** "Kutilmoqda" savat aniq nimani bildiradi — men boshqani kutyapmanmi yoki men ustida ishlayapmanmi.
**Nega kerak:** Bu savat tushunarsiz bo'lsa, hamma narsa shu yerga tiqilib qoladi va "to'siq qayerda" ko'rinmaydi.
**Variantlar:**
- A) "Men boshqadan javob/natija kutyapman" — kim kutilayotgani va muddati ko'rsatiladi (to'siqni ko'rsatadi)
- B) "Men hozir ishlayapman" — oddiy jarayon holati
- C) Ikkalasi ham: ichida "men ishlayapman" va "boshqani kutyapman" deb 2 belgi
- D) Keyin — hozir kerak emas

### Q448. Chiquvchidan keyin nima bo'ladi (arxiv)
**Nima:** Chiquvchi savatga o'tgan (bajarilgan/yuborilgan) narsa keyin qayerga ketadi.
**Nega kerak:** Tugagan ish savatda turaversa, savat to'lib boradi; lekin tarix kerak bo'lganda topish ham zarur.
**Variantlar:**
- A) 24 soatdan keyin avtomat arxivga, lekin "Tarix/Arxiv" bo'limidan har doim qidirib topiladi — toza savat + saqlangan tarix
- B) Qo'lda "Arxivga" tugmasi bosilganda ketadi
- C) Keyin — hozir kerak emas

### Q449. Shaxsiy dastur — kunlik soatlik ko'rinish
**Nima:** Hozir haftalik reja bor; ShVB "Персональная программа" kunlik, soat bo'yicha jadvalni talab qiladi (YO'Q).
**Nega kerak:** Xodim ertalab "bugun nima qilaman, qaysi soatda" deb aniq ko'rsa — kun rejali o'tadi, bu ShVB ning shaxsiy unumdorlik tizimi.
**Variantlar:**
- A) Kunlik soatlik grid (9:00, 10:00 ... 18:00) + har vazifaga vaqt belgilanadi — to'liq ShVB modeli
- B) Soatsiz oddiy kunlik ro'yxat (faqat ustuvorlik tartibida) — soddaroq
- C) Keyin — hozir kerak emas

### Q450. Rollover (bajarilmagan vazifa ertangi kunga)
**Nima:** Bugun bajarilmagan shaxsiy vazifa ertangi kunga avtomat ko'chsinmi (YO'Q hozir).
**Nega kerak:** Vazifa "yo'qolib qolmasligi" va kechikish ko'rinib turishi uchun — ShVB rollover mantig'i.
**Variantlar:**
- A) Avtomat ertangi kunga ko'chadi + "necha marta ko'chgan" sanagich ko'rsatiladi (surunkali kechikish ko'rinadi)
- B) Avtomat ko'chadi, sanagichsiz — sodda
- C) Ko'chmaydi, faqat "kechikkan" deb qizil turadi, xodim o'zi ko'chiradi
- D) Keyin — hozir kerak emas

### Q451. Rollover necha martagacha
**Nima:** Bir vazifa cheksiz ko'chaveradimi yoki ma'lum martadan keyin majburan ko'rib chiqiladimi.
**Nega kerak:** Cheksiz ko'chadigan vazifa hech qachon bajarilmaydi — uni "qayta rejalashtir yoki bekor qil" deb to'xtatish kerak.
**Variantlar:**
- A) 3 marta ko'chgach majburan boshliqqa ko'rinadi / "qayta rejalashtir" so'raydi — intizom
- B) Cheksiz ko'chadi, faqat rang to'qlashadi
- C) Keyin — hozir kerak emas

### Q452. Shaxsiy dastur ustuvorligi (rang kodi)
**Nima:** Vazifa ustuvorligi qanday belgilanadi (Yuqori/O'rta/Past — qizil/sariq/yashil).
**Nega kerak:** Xodim qaysi ishni avval qilishni darrov ko'rishi uchun yagona rang tili kerak.
**Variantlar:**
- A) 3 daraja: Yuqori=qizil, O'rta=sariq, Past=yashil — sodda va ShVB ga mos
- B) 4 daraja (shoshilinch alohida)
- C) Eyzenxauer matritsasi (muhim/shoshilinch 4 kvadrant)
- D) Keyin — hozir kerak emas

### Q453. Soat-blok (vaqt rejalashtirish) majburiymi
**Nima:** Har vazifaga taxminiy vaqt (masalan 30 daqiqa) yozilishi shartmi.
**Nega kerak:** Vaqt belgilansa, kun real to'lganini ko'rsatadi ("bugunga 10 soat reja qildim, kun 8 soat") — ortiqcha yuklamani oldini oladi.
**Variantlar:**
- A) Ixtiyoriy: yozsa kun-yuklamasi ko'rsatiladi, yozmasa oddiy ro'yxat — moslashuvchan
- B) Majburiy: har vazifaga vaqt yoziladi
- C) Keyin — hozir kerak emas

### Q454. Vazifa kim tomonidan beriladi
**Nima:** Vazifa faqat boshliqdan keladimi, yoki xodim o'ziga ham, hamkasbiga ham bera oladimi.
**Nega kerak:** Kim kimga ish bera olishi roziligi mas'uliyat va tartibni belgilaydi.
**Variantlar:**
- A) Hamma yo'l: boshliq→bo'ysunuvchi, o'ziga, va gorizontal (hamkasbga) — lekin gorizontal so'rov qabul/rad qilinadi
- B) Faqat boshliq→bo'ysunuvchi + o'ziga (gorizontal yo'q)
- C) Keyin — hozir kerak emas

### Q455. Vazifani qabul qilish/rad etish
**Nima:** Boshqadan kelgan vazifani xodim "qabul qildim / rad etdim (sabab bilan)" deb javob beradimi.
**Nega kerak:** "Berdim degani bajardi degani emas" — qabul qadami mas'uliyatni aniq biriktiradi.
**Variantlar:**
- A) Ha: qabul/rad (rad sababi majburiy) qadami bor — aniq mas'uliyat
- B) Avtomat qabul, rad qilish yo'q (boshliq buyrug'i)
- C) Keyin — hozir kerak emas

### Q456. Vazifa karta-modeliga bog'lanadimi
**Nima:** Vazifa qaysi lavozim-kartaga / qaysi GSD (statistik)ga hissa qo'shishi belgilanadimi.
**Nega kerak:** Karta-markazli vizyonda har ish "to'g'ri ishning ta'rifi"ga ulanishi kerak — shunda vazifa GSD natijasiga sanaladi.
**Variantlar:**
- A) Ha: vazifa ixtiyoriy ravishda kartaga/GSD ga bog'lanadi, bajarilsa GSD ga avtomat hissa — vizyonga to'liq mos
- B) Faqat lavozim-kartaga bog'lanadi, GSD aloqasiz
- C) Hech narsaga bog'lanmaydi (erkin vazifa)
- D) Keyin — hozir kerak emas

### Q457. Taxta (board) tuzilishi
**Nima:** Kanban taxta ustunlari (statuslar) qanday — sobit ustunlarmi yoki har bo'lim o'zi sozlaydimi.
**Nega kerak:** Ustun nomlari ish jarayonini aks ettirishi kerak; har bo'lim jarayoni har xil bo'lishi mumkin.
**Variantlar:**
- A) Standart 4 ustun (Reja / Jarayonda / Tekshiruvda / Bajarildi) hammaga, lekin bo'lim qo'sha oladi — tartib + moslashuv
- B) Har bo'lim o'z ustunlarini noldan tuzadi — erkin
- C) Faqat sobit standart ustunlar (sozlamasiz)
- D) Keyin — hozir kerak emas

### Q458. Taxta kimga tegishli (qamrov)
**Nima:** Taxtalar shaxsiymi, bo'limgami, loyihagami, yoki butun zavodgami.
**Nega kerak:** Kim qaysi taxtani ko'rishi va ish qaysi darajada tashkillanishini belgilaydi.
**Variantlar:**
- A) Uch tur: shaxsiy + bo'lim + loyiha taxta — keng qamrov
- B) Faqat bo'lim taxtalari
- C) Faqat shaxsiy (har kim o'zi)
- D) Keyin — hozir kerak emas

### Q459. Observer (kuzatuvchi) roli
**Nima:** Vazifaga bevosita ijrochi bo'lmagan, lekin natijani kuzatuvchi (observer) qo'shish mumkinmi.
**Nega kerak:** Boshliq yoki hamkasb ishni "qiluvchi bo'lmasdan" kuzatib, holatdan xabardor bo'lishi uchun — nazorat va shaffoflik.
**Variantlar:**
- A) Ha: vazifaga ko'p kuzatuvchi qo'shiladi, ular faqat o'qiydi + bildirishnoma oladi (o'zgartira olmaydi) — toza nazorat
- B) Kuzatuvchi ham izoh yoza oladi (faol kuzatuvchi)
- C) Keyin — hozir kerak emas

### Q460. Observer kim bo'la oladi va avtomat qo'shiladimi
**Nima:** Kuzatuvchi qo'lda qo'shiladimi yoki rol bo'yicha avtomat (masalan vazifa egasining boshlig'i avtomat kuzatuvchi).
**Nega kerak:** Muhim vazifalarni boshliq avtomat ko'rib tursin, qo'lda qo'shishni unutmasin.
**Variantlar:**
- A) Ikkalasi: qo'lda qo'shish + yuqori ustuvorlikdagi vazifaga boshliq avtomat kuzatuvchi
- B) Faqat qo'lda qo'shiladi
- C) Keyin — hozir kerak emas

### Q461. Eslatma (reminder) turlari
**Nima:** Vazifa/savat uchun eslatma qanday yuboriladi (ilova ichida, Telegram, ikkalasi).
**Nega kerak:** Xodim ekranda bo'lmasa ham muhim ishni o'tkazib yubormasligi uchun — ShVB da Telegram asosiy kanal.
**Variantlar:**
- A) Ilova ichida + Telegram (egasi tanlaydi qaysi kanalda) — keng qamrov
- B) Faqat ilova ichida qo'ng'iroq belgisi
- C) Faqat Telegram
- D) Keyin — hozir kerak emas

### Q462. Eslatma qachon yuboriladi
**Nima:** Eslatma qaysi hodisalarda chiqadi (muddat yaqinlashganda, kechikkanda, yangi vazifa kelganda).
**Nega kerak:** Juda ko'p eslatma "shovqin" bo'lib e'tibordan chiqadi; juda kam bo'lsa ish unutiladi — to'g'ri balans kerak.
**Variantlar:**
- A) 3 holat: yangi vazifa keldi + muddatga 1 kun qoldi + muddat o'tdi — yetarli va shovqinsiz
- B) Faqat muddat o'tganda
- C) Har bosqichda (ko'p eslatma)
- D) Keyin — hozir kerak emas

### Q463. Shaxsiy eslatma (savatsiz)
**Nima:** Xodim hech kimga bog'liq bo'lmagan shaxsiy eslatma qo'ya oladimi ("ertaga 14:00 da qo'ng'iroq qil").
**Nega kerak:** Shaxsiy dastur to'liq ish stoli bo'lishi uchun mayda eslatmalarni ham shu yerda saqlash qulay.
**Variantlar:**
- A) Ha: sana+vaqtli shaxsiy eslatma, faqat o'ziga ko'rinadi — to'liq ish stoli
- B) Yo'q, faqat vazifaga bog'liq eslatma
- C) Keyin — hozir kerak emas

### Q464. Takrorlanuvchi vazifa
**Nima:** Har kun/hafta takrorlanadigan vazifa (masalan "har dushanba haftalik reja topshir") avtomat yaratiladimi.
**Nega kerak:** Doimiy ritmik ishlarni qo'lda qayta kiritish vaqt yo'qotadi va unutiladi — avtomat tug'ilsa intizom mustahkamlanadi.
**Variantlar:**
- A) Ha: kunlik/haftalik/oylik takror shabloni, belgilangan kunda avtomat shaxsiy dasturga tushadi — ritm
- B) Yo'q, har gal qo'lda yaratiladi
- C) Keyin — hozir kerak emas

### Q465. Vazifa bo'limlararo (gorizontal) o'tkazish
**Nima:** Bir bo'limdan boshqa bo'limga vazifa/so'rov uzatish qanday bo'ladi (org-modeldagi gorizontal harakat).
**Nega kerak:** Ish ko'pincha bo'limlar orasida o'tadi (savdo→ishlab chiqarish); uzatish izsiz qolmasligi kerak.
**Variantlar:**
- A) Boshqa bo'limga uzatilgan vazifa o'sha bo'lim boshlig'ining Kiruvchi savatiga tushadi + iz qoladi (kim kimga uzatdi) — shaffof
- B) To'g'ridan-to'g'ri xodimga uzatiladi (boshliqsiz)
- C) Keyin — hozir kerak emas

### Q466. Doklad / Rasporyajenie bilan bog'lanish
**Nima:** Koordinatsiyadagi rasporyajenie (topshiriq) avtomat Kanban vazifaga aylanadimi.
**Nega kerak:** Yig'ilishda berilgan topshiriq xodimning savatida paydo bo'lsa — qaror bilan ijro o'rtasida uzilish bo'lmaydi.
**Variantlar:**
- A) Ha: rasporyajenie chiqarilsa, ijrochining Kiruvchi savatiga avtomat vazifa tug'iladi va bog'lanadi — qaror→ijro yopiq
- B) Qo'lda: xodim o'zi rasporyajeniedan vazifa yaratadi
- C) Keyin — hozir kerak emas

### Q467. Vazifa statuslari ro'yxati (master-data)
**Nima:** Vazifa qanday holatlardan o'tadi (yangi, qabul qilindi, jarayonda, kutilmoqda, tekshiruvda, bajarildi, bekor qilindi).
**Nega kerak:** Yagona status ro'yxati bo'lmasa, har bo'lim har xil ataydi va hisobotlar mos kelmaydi.
**Variantlar:**
- A) To'liq oqim: Yangi → Qabul qilindi → Jarayonda → Tekshiruvda → Bajarildi (+ Bekor/Rad) — aniq nazorat
- B) Sodda: Bajarilmagan → Bajarildi (faqat 2 holat)
- C) O'rtacha: Reja → Jarayonda → Bajarildi (3 holat)
- D) Keyin — hozir kerak emas

### Q468. Vazifa muddati o'tganda (kechikish) kim ko'radi
**Nima:** Muddati o'tgan vazifa kimga ko'rinadi va eskalatsiya bo'ladimi.
**Nega kerak:** Kechikkan ish boshliqqa ko'rinmasa, javobgarlik yo'qoladi — ShVB intizomi.
**Variantlar:**
- A) Xodimga qizil + boshlig'iga "bo'ysunuvchingizda kechikkan ish bor" xabari — vertikal nazorat
- B) Faqat xodimning o'ziga qizil
- C) Keyin — hozir kerak emas

### Q469. Bajarilgan ishni boshliq tasdiqlaydimi
**Nima:** "Bajarildi" deyilgan vazifani boshliq tekshirib tasdiqlaydimi yoki avtomat yopiladimi.
**Nega kerak:** "Bajardim" bilan "haqiqatan bajarildi" farq qiladi — tasdiq sifatni ushlab turadi.
**Variantlar:**
- A) Yuqori ustuvorlik/topshiriq vazifalari boshliq tasdig'i bilan yopiladi, oddiylari avtomat — balans
- B) Hamma vazifa boshliq tasdig'i bilan yopiladi
- C) Hammasi avtomat yopiladi (tasdiqsiz)
- D) Keyin — hozir kerak emas

### Q470. Kanban va shaxsiy dastur o'rtasida bog'liqlik
**Nima:** Bo'lim taxtasidagi menga tegishli vazifalar shaxsiy kunlik dasturda ham ko'rinadimi.
**Nega kerak:** Xodim taxta va shaxsiy reja o'rtasida ikkilanmasligi uchun — bir ishni ikki marta rejalashtirmasin.
**Variantlar:**
- A) Avtomat: taxtadan menga tegishli vazifa shaxsiy dasturga ham tushadi, xodim vaqt belgilaydi — yagona ko'rinish
- B) Alohida: taxta o'zi, shaxsiy dastur o'zi
- C) Keyin — hozir kerak emas

### Q471. Vazifaga fayl/izoh biriktirish
**Nima:** Vazifaga fayl (rasm, hujjat) va izoh-suhbat (comment) qo'shish bo'ladimi (hozir card-files bor).
**Nega kerak:** Ish konteksti (chizma, namuna, kelishuvlar) vazifa ichida saqlansa, alohida chat/pochtada izlash kerak bo'lmaydi.
**Variantlar:**
- A) Ha: fayl + izoh tasmasi (kim qachon yozdi) vazifa ichida — to'liq kontekst
- B) Faqat izoh (faylsiz)
- C) Keyin — hozir kerak emas

### Q472. Kunlik/haftalik shaxsiy hisobot
**Nima:** Kun/hafta oxirida xodimga "bugun nechta bajardin, nechta ko'chdi" degan qisqa yakun ko'rsatiladimi.
**Nega kerak:** O'z unumdorligini ko'rgan xodim o'zini boshqaradi; bu raqam GSD/reyting bilan ham bog'lanadi.
**Variantlar:**
- A) Ha: kunlik mini-yakun + haftalik "bajarildi/ko'chdi/kechikdi" hisoboti, GSD ga ulanadi — vizyonga mos
- B) Faqat son ko'rsatiladi, hisobotsiz
- C) Keyin — hozir kerak emas

---

## 16. IoT

### Q473. Sensor qaysi mashinalarga qo'yiladi
**Nima:** Zavodda qaysi mashinalar (gofra-stanok, flekso-bosma, kesish, yelimlash, kompressor) IoT sensor bilan kuzatiladi.
**Nega kerak:** Sensor pul va o'rnatish talab qiladi — hamma mashinaga emas, eng muhimlariga qo'yilsa, foyda tez ko'rinadi.
**Variantlar:**
- A) Avval 3-5 ta asosiy mashina (eng ko'p to'xtaydigan/eng qimmati) — tez natija, kam xarajat
- B) Barcha ishlab chiqarish mashinalari birdan — to'liq qamrov, lekin qimmat va sekin
- C) Keyin — hozir kerak emas

### Q474. Mashina holati ranglari (master-ro'yxat)
**Nima:** Mashinaning real vaqtdagi holati qaysi nomlar bilan ko'rsatiladi (ishlayapti / to'xtagan / sozlanmoqda / nosoz / o'chiq).
**Nega kerak:** Bitta standart ro'yxat bo'lsa, hamma sex ekranida bir xil tushuniladi va hisobotlar mos keladi.
**Variantlar:**
- A) 5 holat: Ishlayapti (yashil) / To'xtagan (qizil) / Sozlanmoqda (sariq) / Nosoz (qora) / O'chiq (kulrang) — aniq va yetarli
- B) Faqat 3 holat: Ishlayapti / To'xtagan / O'chiq — soddaroq, lekin sababini ajratmaydi
- C) Keyin — hozir kerak emas

### Q475. Mashina uptime (ish vaqti) ko'rsatkichi
**Nima:** Har mashina kunlik/haftalik necha foiz vaqt haqiqatan ishlaganini avtomatik hisoblash.
**Nega kerak:** ShVB statistikasi (GSD) uchun "mashina qancha ishladi" — bo'lim natijasini o'lchaydigan asosiy raqam.
**Variantlar:**
- A) Avtomatik (sensor signalidan, smenaga/kunga/haftaga) + GSD'ga ulash — vizyonga mos, qo'l ishi yo'q
- B) Operator qo'lda kiritadi (smena oxirida) — arzon, lekin xatoga moyil
- C) Keyin — hozir kerak emas

### Q476. To'xtash (downtime) sababini yozish
**Nima:** Mashina to'xtaganda sababini (ta'mirlash, material yo'q, sozlash, smena tugadi, tok yo'q) belgilash.
**Nega kerak:** Sababsiz raqam foydasiz — "nega to'xtadi" bilingandagina yo'qotishni kamaytirish bo'ladi.
**Variantlar:**
- A) Tayyor sabab ro'yxatidan operator tanlaydi (planlangan/planlanmagan ajratiladi) — tahlilga qulay
- B) Operator erkin matn yozadi — moslashuvchan, lekin tahlil qilib bo'lmaydi
- C) Keyin — faqat to'xtash vaqtini yozamiz, sabab yo'q

### Q477. To'xtash sabablari ro'yxati (master-data)
**Nima:** Q4 dagi tayyor sabablar ro'yxatining aniq mazmuni (qaysi sabablar bo'ladi).
**Nega kerak:** Bir xil ro'yxat — barcha mashinalar va smenalar bo'yicha taqqoslash imkonini beradi.
**Variantlar:**
- A) 8-10 standart sabab: ta'mirlash, material yo'q, qolip almashtirish, sozlash, tozalash, tok yo'q, operator yo'q, sifat muammosi — to'liq qamrov
- B) Qisqa 4-5 sabab (planlangan/planlanmagan/material/boshqa) — soddaroq
- C) Keyin — hozir kerak emas

### Q478. Anomaliya (g'ayrioddiy holat) ogohlantirishi
**Nima:** Sensor odatdagidan chetga chiqsa (harorat oshib ketdi, tebranish kuchaydi, tezlik tushdi) avtomatik ogohlantirish.
**Nega kerak:** Mashina butunlay sinishidan oldin signal kelsa, katta ta'mir va to'xtashning oldi olinadi.
**Variantlar:**
- A) Avtomatik aniqlash + darhol ogohlantirish (sex ekrani + Telegram) — vizyonga mos, oldini olish
- B) Faqat ekranda ko'rsatish, alohida ogohlantirish yo'q — arzon, lekin e'tibordan chetda qoladi
- C) Keyin — hozir kerak emas

### Q479. Anomaliya chegaralarini kim belgilaydi
**Nima:** "Qaysi harorat/tebranish g'ayrioddiy" degan chegarani kim va qanday o'rnatadi.
**Nega kerak:** Chegara noto'g'ri bo'lsa — yo har doim shovqin, yo hech qachon signal; ishlab chiqarish boshlig'i nazorat qilsa to'g'ri bo'ladi.
**Variantlar:**
- A) Har mashina turi uchun chegara admin/ishlab chiqarish boshlig'i tomonidan sozlanadi — moslashuvchan, mas'uliyatli
- B) Tizim o'zi tarixiy ma'lumotdan o'rganadi (avto-chegara) — aqlli, lekin boshda ishonchsiz
- C) Keyin — hozir kerak emas

### Q480. Anomaliya kelganda nima bo'ladi (workflow)
**Nima:** Anomaliya signal kelgach tizim avtomatik qanday harakat qiladi (ish buyrug'i ochish, mas'ulga xabar, jurnalga yozish).
**Nega kerak:** Signal hech kimga bormasa — befoyda; avtomatik harakat bo'lsa, muammo tez hal bo'ladi.
**Variantlar:**
- A) Avto: texnik xizmat vazifasi ochiladi + mas'ul mexanikga xabar + jurnal — to'liq oqim
- B) Faqat jurnalga yoziladi, harakatni odam qiladi — sodda, lekin sekin
- C) Keyin — hozir kerak emas

### Q481. Telemetriya tarixini saqlash muddati
**Nima:** Sensor o'qishlari (harorat, tezlik, hisoblagich) qancha muddat saqlanadi va qanchalik tez-tez yoziladi.
**Nega kerak:** Juda ko'p saqlasa — baza shishadi; juda kam saqlasa — tahlil va trend yo'qoladi. Muvozanat kerak.
**Variantlar:**
- A) Batafsil 3-6 oy, keyin kunlik o'rtachaga siqib uzoq saqlash — tahlilga ham, joyga ham mos
- B) Hammasini batafsil cheksiz saqlash — to'liq, lekin baza tez shishadi
- C) Keyin — faqat oxirgi holat saqlanadi, tarix yo'q

### Q482. Kamera-AI bilan xona inspeksiyasi
**Nima:** Sex/ombor kamerasidan AI orqali tartib, xavfsizlik va ish holatini avtomatik baholash (ShVB inspektor-menejer yo'nalishi).
**Nega kerak:** Inspektor har xonani qo'lda aylanmasdan, AI ball qo'yadi — nazorat tez va xolis bo'ladi.
**Variantlar:**
- A) AI rasm baholaydi + ball + anomaliya (allaqachon qisman bor) — to'liq qilamiz, ShVB'ga mos
- B) Faqat kamera ko'rsatadi, AI baho yo'q — odam ko'radi, ball qo'ymaydi
- C) Keyin — hozir kerak emas

### Q483. Kamera-AI nimani tekshiradi (master-ro'yxat)
**Nima:** Kamera-AI aynan qaysi mezonlarni baholaydi (tozalik, himoya kiyim, yo'lak band emasligi, mashina yonida tartib, telefon ishlatish).
**Nega kerak:** Aniq mezon ro'yxati bo'lsa — ball izchil va adolatli, har inspektor bir narsaga qaraydi.
**Variantlar:**
- A) 5-7 mezon ro'yxati (tozalik / himoya vositasi / yo'lak / tartib / xavfsizlik) — aniq va o'lchanadigan
- B) Faqat umumiy "toza/iflos" bahosi — sodda, lekin yuzaki
- C) Keyin — hozir kerak emas

### Q484. Inspeksiya buzilishini tuzatish jurnali
**Nima:** Kamera-AI yoki inspektor buzilish topganda, uni rasmiy buzilish → tuzatish → tekshiruv ko'rinishida yozish (audit hozir "rasmiy buzilish/tuzatish jadvali yetmaydi" deyapti).
**Nega kerak:** "Topdim va unutdim" emas, balki tuzatilgani tasdiqlanishi kerak — javobgarlik bo'ladi.
**Variantlar:**
- A) Har buzilish → mas'ul → muddat → tuzatildi tasdig'i (yopiq sikl) — to'liq nazorat
- B) Faqat ro'yxat ko'rinishida yoziladi, yopilishi kuzatilmaydi — sodda, lekin chala
- C) Keyin — hozir kerak emas

### Q485. MES bilan ulanish (ish buyrug'i ↔ mashina)
**Nima:** IoT mashina ma'lumoti ishlab chiqarish buyrug'i (MES) bilan bog'lanishi — qaysi buyruqda mashina necha dona chiqarganini hisoblash.
**Nega kerak:** Sensor hisoblagichi avtomatik "bajarildi" qilsa, operator qo'lda kiritmaydi va raqam aniq bo'ladi.
**Variantlar:**
- A) Sensor hisoblagich → MES buyrug'iga avtomatik bog'lanadi (chiqarilgan dona avto-yoziladi) — vizyonga mos
- B) Faqat ko'rsatadi, MES bilan bog'lanmaydi — ikki tizim alohida qoladi
- C) Keyin — hozir kerak emas

### Q486. OEE (umumiy samaradorlik) ko'rsatkichi
**Nima:** Har mashina uchun OEE — ish vaqti × tezlik × sifat birlashgan yagona samaradorlik foizi (audit'da bor deyilgan).
**Nega kerak:** Bitta raqam mashina qanchalik samarali ishlayotganini ko'rsatadi — bo'lim/mashina taqqoslash uchun.
**Variantlar:**
- A) To'liq OEE (3 omil: vaqt + tezlik + sifat) avtomatik + trend — to'liq ko'rsatkich
- B) Faqat soddalashtirilgan ish vaqti foizi — tez, lekin sifatni hisobga olmaydi
- C) Keyin — hozir kerak emas

### Q487. RUL — qolgan resurs (predictive maintenance)
**Nima:** Mashina/uzelning "yana qancha ishlaydi" prognozi — ishlash vaqti va holatdan kelib chiqib texnik xizmat oldindan rejalashtiriladi.
**Nega kerak:** Sinishdan oldin ta'mirlash — to'satdan to'xtash va shoshilinch ta'mir xarajatini kamaytiradi.
**Variantlar:**
- A) Oddiy qoidaga asoslangan prognoz (ish soati/sikl bo'yicha) — ishonchli, tez joriy etiladi
- B) AI prognoz (sensor trendidan o'rganadi) — kuchli, lekin ko'p ma'lumot va vaqt talab qiladi
- C) Keyin — hozir kerak emas

### Q488. Texnik xizmat jadvali (reja-profilaktika)
**Nima:** Har mashina uchun rejali texnik xizmat (har N soat/sikl yoki sanada) eslatmasi va bajarilishini yozish.
**Nega kerak:** Reja bo'yicha xizmat — buzilishlarni kamaytiradi va mashina umrini uzaytiradi.
**Variantlar:**
- A) Avtomatik jadval (ish soatiga bog'liq) + eslatma + bajarildi belgisi — to'liq oldini olish
- B) Qo'lda kalendar (sanaga ko'ra) — sodda, lekin haqiqiy yuklamani hisobga olmaydi
- C) Keyin — hozir kerak emas

### Q489. Texnik xizmat ishlari ro'yxati (master-data)
**Nima:** Texnik xizmatda bajariladigan standart ishlar ro'yxati (yog'lash, filtr almashtirish, kamar tekshirish, kalibrlash) va davriyligi.
**Nega kerak:** Tayyor ro'yxat bo'lsa — mexanik hech narsani unutmaydi, ish izchil bajariladi.
**Variantlar:**
- A) Mashina turi bo'yicha standart ishlar + davriylik jadvali — to'liq va izchil
- B) Faqat umumiy "ta'mirlandi" yozuvi — sodda, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q490. Energiya (tok) iste'molini kuzatish
**Nima:** Mashina/sexning elektr energiya iste'molini sensor orqali o'lchash va kuzatish.
**Nega kerak:** Tok — katta xarajat; qaysi mashina ko'p yeyishi va behuda sarf bilinsa, tejaш bo'ladi.
**Variantlar:**
- A) Mashina darajasida o'lchash (har mashina necha kVt) — aniq, sababni topadi
- B) Faqat umumiy sex/zavod hisoblagichi — arzon, lekin mashinani ajratmaydi
- C) Keyin — hozir kerak emas

### Q491. Energiya bo'yicha hisobot va ogohlantirish
**Nima:** Energiya iste'moli normadan oshsa yoki bo'sh turganda tok yeyilsa ogohlantirish va kunlik/haftalik hisobot.
**Nega kerak:** Behuda sarf (mashina bo'sh turib tok yeyishi) ko'rinmasa — pul shundoq ketadi.
**Variantlar:**
- A) Norma + oshganda ogohlantirish + haftalik energiya hisoboti — faol tejash
- B) Faqat raqam ko'rsatiladi, ogohlantirish yo'q — passiv, e'tibordan chetda
- C) Keyin — hozir kerak emas

### Q492. Birlik mahsulotga energiya sarfi (ShVB statistikasi)
**Nima:** Bir dona/bir m² mahsulotga qancha energiya ketishini hisoblash (energiya ÷ ishlab chiqarilgan dona).
**Nega kerak:** Bu — ShVB GSD ko'rsatkichi: samaradorlik o'sayaptimi yoki yomonlashyaptimi shu raqamdan ko'rinadi.
**Variantlar:**
- A) Avtomatik (energiya / MES dona) + GSD'ga ulash — vizyonga to'liq mos
- B) Faqat umumiy energiya, donaga bo'linmaydi — chala ko'rsatkich
- C) Keyin — hozir kerak emas

### Q493. Sex katta ekrani (Andon tablosi)
**Nima:** Sexda barcha mashinalar holati real vaqtda ko'rinadigan katta umumiy ekran/tablo.
**Nega kerak:** Hamma bir qarashda qaysi mashina to'xtaganini ko'rsa — javob tezlashadi, boshliq tepada turmaydi.
**Variantlar:**
- A) Katta tablo: barcha mashina holati + to'xtaganlari qizil + jonli yangilanadi — tez ko'rinish
- B) Faqat shaxsiy kompyuterda dashboard — har kim alohida qaraydi
- C) Keyin — hozir kerak emas

### Q494. Operator tableti (mashina yonida)
**Nima:** Mashina yonidagi tablet orqali operator to'xtash sababini, defekt, smena ma'lumotini kiritadi (audit'da iot-tablet controller bor).
**Nega kerak:** Sabab joyida, real vaqtda kiritilsa — ma'lumot aniq va to'liq bo'ladi.
**Variantlar:**
- A) Har mashinada tablet: holat + to'xtash sababi + defekt + smena hisoboti — to'liq joriy
- B) Smena oxirida bitta umumiy kompyuterdan kiritish — arzon, lekin kechikadi
- C) Keyin — hozir kerak emas

### Q495. Sensor uzilganda / signal kelmasa
**Nima:** Sensor o'chsa, internet uzilsa yoki ma'lumot kelmay qolsa tizim qanday harakat qiladi.
**Nega kerak:** "Signal yo'q"ni "mashina to'xtagan" deb o'qib qolsa — soxta tashvish; aksincha jim qolsa — buzilishni o'tkazib yuboradi.
**Variantlar:**
- A) "Aloqa yo'q" alohida holat sifatida ko'rsatiladi + texnikga xabar — aniq va xavfsiz
- B) Oxirgi ma'lum holat saqlanib turadi — sodda, lekin chalg'itishi mumkin
- C) Keyin — hozir kerak emas

### Q496. Holat va xabarlar kimga boradi (karta-model)
**Nima:** Mashina to'xtashi, anomaliya, texnik xizmat eslatmasi — qaysi lavozim kartasiga (operator / mexanik / sex boshlig'i) boradi.
**Nega kerak:** Karta-modelda har xabar to'g'ri kartaga borishi kerak — javobgarlik aniq bo'ladi (notog'ri odamga borsa e'tiborsiz qoladi).
**Variantlar:**
- A) Xabar turi bo'yicha kartaga marshrutlanadi (anomaliya→mexanik, uzun to'xtash→sex boshlig'i) — vizyonga mos
- B) Hammasi bitta umumiy guruhga boradi — sodda, lekin javobgarlik tarqoq
- C) Keyin — hozir kerak emas

### Q497. Mashina samaradorligini kartaga bog'lash (GSD)
**Nima:** Mashina uptime/OEE ko'rsatkichi shu mashinaga mas'ul operator/mexanik kartasining GSD natijasiga kirishi.
**Nega kerak:** Karta-modelda natija lavozimga bog'lanadi — operator o'z mashinasi samaradorligi uchun javob beradi.
**Variantlar:**
- A) Mashina OEE/uptime → operator/mexanik kartasi GSD'ga avtomatik kiradi — vizyonga to'liq mos
- B) Faqat mashina darajasida qoladi, kartaga bog'lanmaydi — ko'rsatkich bor, javobgarlik yo'q
- C) Keyin — hozir kerak emas

### Q498. Defekt/sifat muammosini mashinaga bog'lash
**Nima:** Sifat nazorati topgan defektni qaysi mashina/smena chiqarganini IoT ma'lumoti orqali bog'lash.
**Nega kerak:** Qaysi mashina ko'p brak chiqarayotganini bilish — sozlash yoki ta'mir kerakligini ko'rsatadi.
**Variantlar:**
- A) Defekt → mashina + smena + vaqt avtomatik bog'lanadi (MES orqali) — sabab topiladi
- B) Defekt umumiy yoziladi, mashina ko'rsatilmaydi — sodda, lekin sababsiz
- C) Keyin — hozir kerak emas

### Q499. IoT smena hisoboti (avtomatik)
**Nima:** Har smena oxirida mashina bo'yicha avtomatik hisobot: ishlagan vaqt, to'xtashlar, chiqarilgan dona, defekt, energiya.
**Nega kerak:** Qo'lda hisobot yozish kerak emas — tizim o'zi tayyorlaydi, ShVB haftalik statistikasiga ulanadi.
**Variantlar:**
- A) Avtomatik smena hisoboti + sex boshlig'iga / Telegram'ga yuboriladi — qo'l ishi yo'q
- B) Faqat so'ralganda ekranda ko'rsatiladi — kerak bo'lsa qaraladi, faol emas
- C) Keyin — hozir kerak emas

### Q500. Telegram orqali IoT xabarlari (ShVB bot)
**Nima:** Mashina to'xtashi, anomaliya, texnik xizmat eslatmasi ShVB Telegram bot orqali mas'ul lavozimga yuborilishi.
**Nega kerak:** Hamma ERP'da o'tirmaydi — muhim signal Telegram'ga kelsa, javob tez bo'ladi.
**Variantlar:**
- A) Faqat muhim hodisalar (uzun to'xtash, anomaliya, ta'mir kerak) Telegram'ga — foydali, shovqinsiz
- B) Barcha hodisa Telegram'ga — to'liq, lekin ko'p xabar charchatadi
- C) Keyin — hozir kerak emas

### Q501. Mashinalar reestri (master-data)
**Nima:** Barcha mashinalar yagona ro'yxati: nomi, turi, inventar raqami, sexi, o'rnatish sanasi, mas'ul lavozim kartasi.
**Nega kerak:** IoT, texnik xizmat, defekt, energiya — hammasi shu yagona reestrga bog'lanadi; bo'lmasa har modul o'z ro'yxatini yasaydi.
**Variantlar:**
- A) Yagona mashinalar reestri — barcha IoT/ta'mir/sifat shunga bog'lanadi — yagona haqiqat manbai
- B) Har modul o'z ro'yxatini yuritadi — tez, lekin nomuvofiqlik chiqadi
- C) Keyin — hozir kerak emas

### Q502. Energiya iste'molini Finance bilan bog'lash
**Nima:** Energiya sarfi ma'lumoti moliya moduliga (xarajat/tannarx) o'tib, mahsulot tannarxiga qo'shilishi.
**Nega kerak:** Energiya — real pul; tannarxga kirsa, narx va foyda aniq hisoblanadi.
**Variantlar:**
- A) Energiya sarfi → tannarxga avtomatik qo'shiladi (Finance bilan ulanadi) — to'liq biznes ko'rinish
- B) Energiya alohida ko'rsatiladi, tannarxga kirmaydi — sodda, lekin chala
- C) Keyin — hozir kerak emas

---

## 17. AI

### Q503. Bitta markaziy AI yoki har modulга alohida AI
**Nima:** Butun ERP uchun bitta "miya" (Markaziy AI) bo'ladimi, yoki har bo'lim (moliya/HR/direktor) o'z alohida AI'siga ega bo'ladimi.
**Nega kerak:** Bitta markaziy AI hamma ma'lumotni (karta, ЦКП, davomat, sifat) bir joyda ko'radi va izchil qaror beradi; tarqoq AI'lar bir-birini takrorlaydi va ziddiyatli javob beradi.
**Variantlar:**
- A) Bitta Markaziy AI — barcha modul shunga ulanadi, ichida director/finance/hr "ko'rinishlari" bo'ladi (vizyon: §10 "bitta markaziy AI").
- B) Har modulga alohida AI — moslashuvchan, lekin ma'lumot tarqoq, izchillik yo'qoladi.
- C) Keyin — hozir kerak emas.

### Q504. Markaziy AI xodimni qanday taniydi
**Nima:** AI suhbat/hisobotni boshlaganda xodimni qaysi yo'l bilan taniydi — login orqali avtomatik, yoki har safar so'rab.
**Nega kerak:** AI xodimning kartasini, ЦКП'sini va tarixini bilmasa, unга tegishli to'g'ri javob/savol bera olmaydi.
**Variantlar:**
- A) Login orqali avtomatik tanib, kartasi ma'lumotidan ishlaydi (vizyon: §10).
- B) Suhbat boshida xodim o'zini tanlab kiritadi — ortiqcha qadam, xato xavfi.
- C) Keyin — hozir kerak emas.

### Q505. Karta↔xodim moslik bahosi — kirish ma'lumotlari
**Nima:** AI xodim kartaga qanchalik mos kelishini baholaganda qaysi manbalarni hisobga oladi.
**Nega kerak:** Moslik bahosi ishonchli bo'lishi uchun ko'p tomonlama ma'lumot kerak; faqat bitta ko'rsatkich (masalan davomat) noto'g'ri xulosa beradi.
**Variantlar:**
- A) ЦКП bajarish + test natijasi + davomat + sifat + rahbar bahosi + boshqa xodimlar bilan solishtirish — hammasi (vizyon: §10).
- B) Faqat ЦКП + davomat — oddiy, lekin sayoz baho.
- C) Faqat rahbar qo'lda baholaydi, AI hisoblamaydi.
- D) Keyin — hozir kerak emas.

### Q506. Moslik bahosi natijasi qanday ko'rinadi
**Nima:** AT bergan karta↔xodim moslik natijasi qanday shaklda chiqadi — foiz/ball, yoki yorug'lik (yashil/sariq/qizil), yoki matnli xulosa.
**Nega kerak:** Rahbar bir qarashda kim mos, kim mos emasligini ko'rishi uchun tushunarli, izchil format kerak.
**Variantlar:**
- A) Foiz (%) + yorug'lik rangi + qisqa matnli izoh (sabab bilan) — birga.
- B) Faqat foiz/ball — tez, lekin "nega" tushunarsiz.
- C) Faqat matnli xulosa — boy, lekin taqqoslab bo'lmaydi.
- D) Keyin — hozir kerak emas.

### Q507. AI hisoboti kimga boradi
**Nima:** AI tayyorlagan moslik/holat hisoboti kimlarga ko'rsatiladi — xodimning o'ziga, rahbariga, HR'ga.
**Nega kerak:** Maxfiylik va foyda muvozanati: ba'zi hisobot rahbar uchun, ba'zisi xodimning o'sishi uchun; noto'g'ri kishiga borsa ziyon.
**Variantlar:**
- A) Uchchalasiga ham — har biriga mos qism (xodim o'z o'sishini, rahbar jamoasini, HR umumiy) (vizyon: §10).
- B) Faqat rahbar va HR — xodim ko'rmaydi.
- C) Faqat xodimning o'ziga — rahbar ko'rmaydi.
- D) Keyin — hozir kerak emas.

### Q508. Hisobot formati — PDF
**Nima:** AI hisoboti chop etsa bo'ladigan rasmiy PDF shaklida bo'ladimi.
**Nega kerak:** Rasmiy PDF hisobot saqlanadi, imzolanadi, arxivga tushadi va rahbar qarorida dalil bo'ladi.
**Variantlar:**
- A) Ha — rasmiy PDF hisobot (xodim/rahbar/HR uchun) (vizyon: §10).
- B) Faqat ekranda ko'rinish, PDF yo'q — tez, lekin saqlanmaydi/imzolanmaydi.
- C) Keyin — hozir kerak emas.

### Q509. AI hisoboti qanchalik tez-tez tayyorlanadi
**Nima:** AI moslik/holat hisobotini qanday davriylikda chiqaradi — kunlik, haftalik, yoki faqat so'ralganda.
**Nega kerak:** ShVB ish ritmi haftalik (GSD/ФП-tsikl); juda tez-tez = shovqin, juda kam = kech anglash.
**Variantlar:**
- A) Haftalik avtomatik (dushanba digest) + istalgan vaqtda so'rab olish mumkin.
- B) Faqat so'ralganda (qo'lda) — yuk kam, lekin unutiladi.
- C) Kunlik avtomatik — batafsil, lekin ko'p shovqin.
- D) Keyin — hozir kerak emas.

### Q510. ЦКП chatbot — mashinasiz xodimdan kunlik so'rash
**Nima:** Mashinada ishlamaydigan (IoT yo'q) xodimdan AI har kuni ЦКП bo'yicha savol berib, kunlik hisobotini chat/bot orqali yig'adimi.
**Nega kerak:** Bu xodimlar uchun avtomatik ЦКП o'lchovi yo'q — AI savol-javob orqali kunlik natijani yagona yo'l bilan oladi (vizyon: §8).
**Variantlar:**
- A) Ha — AI ЦКП tavsif/formuladan savol tuzadi va kartaga biriktirilgan xodimdan kunlik so'raydi (vizyon: §8, §10).
- B) Xodim o'zi forma to'ldiradi, AI savol bermaydi — oddiy, lekin sifat past.
- C) Keyin — hozir kerak emas.

### Q511. ЦКП savollarini kim/qanday tuzadi
**Nima:** Mashinasiz xodimga beriladigan kunlik ЦКП savollarini kim yaratadi — AI avtomatik ЦКП-formuladan, yoki HR qo'lda yozadi.
**Nega kerak:** Savollar ЦКП'ga aniq mos bo'lsa, kunlik hisobot haqiqiy natijani o'lchaydi; mos bo'lmasa — bo'sh formal.
**Variantlar:**
- A) AI ЦКП matnli tavsif + formuladan avtomatik tuzadi, HR tasdiqlaydi (vizyon: §8).
- B) HR har karta uchun savol bankini qo'lda yozadi — aniq, lekin sekin.
- C) Keyin — hozir kerak emas.

### Q512. Kunlik hisobot bermaslik = oylik gate
**Nima:** Xodim belgilangan vaqtda (masalan 16 soat) ЦКП hisobotini bermasa, AI o'sha kun oyligini yozmaydigan qoidani qo'llaydimi.
**Nega kerak:** Vizyon bo'yicha hisobotsiz kun = ish isboti yo'q = oylik yo'q; bu intizomning asosiy dastagi (§8).
**Variantlar:**
- A) Ha — 16 soat ichida bermasa o'sha kun oylik yozilmaydi; o'tkazib yuborsa HR raport → direktor tasdiq → qo'shiladi (vizyon: §8).
- B) Faqat ogohlantiradi, oylikka ta'sir qilmaydi — yumshoq, lekin intizom past.
- C) Keyin — hozir kerak emas.

### Q513. Mashinachi ЦКП — IoT/MES'dan avtomatik
**Nima:** Mashinada ishlaydigan xodimning ЦКП'si IoT/MES (mashina sensorlari) ma'lumotidan avtomatik o'lchanadimi.
**Nega kerak:** Mashinachidan savol so'rash o'rniga haqiqiy ishlab chiqarish ma'lumotini olish aniqroq va xolisroq (vizyon: §8).
**Variantlar:**
- A) Ha — ЦКП mashinachi uchun IoT/MES'dan avtomatik (ulash kerak) (vizyon: §8).
- B) Mashinachi ham qo'lda hisobot beradi — IoT yo'q bo'lsa vaqtinchalik.
- C) Keyin — hozir kerak emas.

### Q514. Director-AI — kompaniya holati sababini tushuntirish
**Nima:** Director-AI kompaniya holat ko'rsatkichini (O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) faqat ko'rsatibgina qolmay, "nega bunday" sababini ham tushuntiradimi.
**Nega kerak:** Holat darajasini bilish kifoya emas — rahbar nimadan kelib chiqqanini bilsa, to'g'ri qaror qabul qiladi (yo'n.13 holat formulasi mavjud, sabab-tahlil yetmaydi).
**Variantlar:**
- A) Ha — holat + asosiy sabablar (qaysi ko'rsatkich tushdi/ko'tarildi) + tavsiya (yo'n.39 explainKpi'ni kengaytirish).
- B) Faqat holat darajasi ko'rsatiladi, sabab yo'q — sodda, lekin foydasi kam.
- C) Keyin — hozir kerak emas.

### Q515. Director-AI prognoz (forecast)
**Nima:** Director-AI hozirgi tendensiyaga qarab kelajak holatini (keyingi hafta/oy) bashorat qiladimi.
**Nega kerak:** Muammo yuzaga kelishidan oldin ko'rinsa, oldini olish mumkin; faqat o'tmishni ko'rsatish kech bo'ladi.
**Variantlar:**
- A) Ha — keyingi hafta/oy holati prognozi + ishonch darajasi (yo'n.39 forecast).
- B) Faqat hozirgi holat, prognoz yo'q — xavfsiz, lekin reaktiv.
- C) Keyin — hozir kerak emas.

### Q516. Holat tarixini saqlash
**Nima:** Kunlik hisoblangan kompaniya holati tarix sifatida saqlanadimi (grafik/trend uchun).
**Nega kerak:** Holat o'zgarishini vaqt bo'ylab ko'rish (yaxshilanyaptimi/yomonlashyaptimi) prognoz va qaror uchun zarur (yo'n.13 — kunlik cron + tarix yetmaydi).
**Variantlar:**
- A) Ha — har kunlik holat saqlanadi, trend grafigi ko'rinadi.
- B) Faqat oxirgi holat saqlanadi, tarix yo'q — joy kam, lekin trend yo'qoladi.
- C) Keyin — hozir kerak emas.

### Q517. Finance-AI — ЗВС (haftalik budjet) tahlili
**Nima:** Finance-AI haftalik budjet arizalarini (ЗВС) tahlil qilib, qaysi xarajat oqlangani/oqlanmaganini baholaydimi.
**Nega kerak:** Pul oqimini boshqarishda AI shubhali yoki ortiqcha so'rovlarni belgilab bersa, rahbar tezroq va to'g'riroq tasdiqlaydi (yo'n.1 ЗВС backend bor).
**Variantlar:**
- A) Ha — har ЗВС uchun AI baho (oqlangan/shubhali/rad tavsiya) + sabab.
- B) Faqat ЗВС ro'yxatini ko'rsatadi, baho yo'q — rahbar o'zi qaraydi.
- C) Keyin — hozir kerak emas.

### Q518. Finance-AI — cashflow (pul oqimi) prognozi
**Nima:** Finance-AI kelgusi hafta/oy pul kirim-chiqimini bashorat qiladimi.
**Nega kerak:** Pul yetishmovchiligini oldindan ko'rsa, to'lovlar va xaridni rejalashtirish mumkin (yo'n.39 forecastCashflow mavjud, kengaytirish kerak).
**Variantlar:**
- A) Ha — haftalik/oylik cashflow prognozi + tanqidiy kunlar ogohlantirishi.
- B) Faqat hozirgi qoldiq ko'rsatiladi — sodda, lekin oldindan ko'rib bo'lmaydi.
- C) Keyin — hozir kerak emas.

### Q519. Finance-AI — to'lanmagan schyotlar (aging) ogohlantirish
**Nima:** Finance-AI muddati o'tgan debitor/kreditor qarzlarni aniqlab, AI bilan kim bilan birinchi ishlash kerakligini tavsiya qiladimi.
**Nega kerak:** Mavjud aging hisoboti bor (yo'n.5), lekin AI eng xavfli/eng katta qarzni ustun qo'yib bersa, undirish samaraliroq bo'ladi.
**Variantlar:**
- A) Ha — AI qarzlarni xavf/summasiga qarab tartiblab, harakat tavsiyasi beradi.
- B) Faqat ro'yxat (mavjud aging) — AI tavsiyasiz.
- C) Keyin — hozir kerak emas.

### Q520. HR-AI — GSD trend tahlili
**Nima:** HR-AI har lavozim/xodimning GSD (statistik ko'rsatkich) haftalik o'zgarishini kuzatib, o'syaptimi yoki tushyaptimi tahlil qiladimi.
**Nega kerak:** GSD trendi xodim/karta sog'lig'ining asosiy o'lchovi; tushish boshlanishini erta ko'rsa, HR aralashadi (yo'n.11/12 GSD bor, trend/digest yetmaydi).
**Variantlar:**
- A) Ha — haftalik GSD trend + tushayotgan xodimlar ro'yxati + sabab tahlili.
- B) Faqat joriy GSD ko'rsatiladi — trend yo'q.
- C) Keyin — hozir kerak emas.

### Q521. HR-AI — bonus tavsiyasi
**Nima:** HR-AI ko'rsatkichlarga qarab kimga bonus berish/bermaslikni hisoblab tavsiya qiladimi.
**Nega kerak:** Bonus adolatli va shaffof bo'lishi uchun AI yagona mezon bo'yicha hisoblab bersa, sub'ektivlik kamayadi (yo'n.36 reyting+bonus bor, ulanish to'liq emas).
**Variantlar:**
- A) Ha — AI bonus tavsiyasi hisoblaydi, HR+Moliya tasdiqlaydi (qaror odamda qoladi) (vizyon: §7 bonus sozlanadigan).
- B) Faqat ko'rsatkichni ko'rsatadi, bonus odam qo'lda belgilaydi.
- C) Keyin — hozir kerak emas.

### Q522. Bonus mezoni — KPI yoki sozlanadigan tizim
**Nima:** AI bonusni qaysi asosda hisoblaydi — qattiq KPI formula bo'yicha, yoki HR/Moliya/rahbar sozlaydigan moslashuvchan tizim bilan.
**Nega kerak:** Vizyon bo'yicha bonus = sozlanadigan tizim, qattiq KPI EMAS; AI shunga mos ishlashi kerak (vizyon: §7 "KPI YO'Q").
**Variantlar:**
- A) Sozlanadigan tizim — HR/Moliya/rahbar mezonni o'rnatadi, AI shunga qarab hisoblaydi (vizyon: §7).
- B) Qattiq KPI formula — avtomatik, lekin vizyonga zid.
- C) Keyin — hozir kerak emas.

### Q523. Bottleneck (tor joy) aniqlash
**Nima:** AI ishlab chiqarish/jarayonda eng tor joy (qaysi mashina/bo'lim/xodim ishni to'xtatyapti)ni avtomatik aniqlaydimi.
**Nega kerak:** Bitta tor joy butun zavod tezligini cheklaydi; uni topib bersa, rahbar eng katta foydani beradigan joyni tuzatadi.
**Variantlar:**
- A) Ha — AI har kuni/hafta tor joyni IoT/MES + GSD ma'lumotidan aniqlaydi va tavsiya beradi.
- B) Faqat IoT downtime hodisalarini ko'rsatadi, "tor joy" xulosasi yo'q.
- C) Keyin — hozir kerak emas.

### Q524. Bottleneck qamrovi — qayerlarni qaraydi
**Nima:** Bottleneck tahlili faqat mashinalarni qaraydimi yoki butun zanjirni (ta'minot → ishlab chiqarish → ombor → yetkazib berish).
**Nega kerak:** Tor joy ko'pincha mashinada emas, balki kutish/hujjat/ombor bosqichida; faqat mashina qaralsa, asl sabab yashirin qoladi.
**Variantlar:**
- A) Butun zanjir — ta'minot, ishlab chiqarish, ombor, yetkazib berish, hujjat oqimi.
- B) Faqat ishlab chiqarish mashinalari — tor qamrov, oddiy.
- C) Keyin — hozir kerak emas.

### Q525. Markaziy forecast — nimalarni bashorat qiladi
**Nima:** AI prognoz qaysi sohalar uchun ishlaydi — sotuv, pul oqimi, material zaxirasi, ishchi kuchi (GSD).
**Nega kerak:** Bir nechta prognoz birga ishlasa, rahbar yaxlit ko'radi; alohida-alohida prognozlar bog'lanmaydi.
**Variantlar:**
- A) Hammasi — sotuv + cashflow + material/zaxira + GSD/ishchi kuchi (yagona prognoz markazi).
- B) Faqat moliya (cashflow) — eng muhim, lekin tor.
- C) Faqat sotuv prognozi.
- D) Keyin — hozir kerak emas.

### Q526. AI-suhbat (chat) — kim foydalanadi
**Nima:** AI bilan suhbat oynasi (savol berib javob olish) kimlarga ochiq — barcha xodimlarga, faqat rahbarlarga, yoki bosqichma-bosqich.
**Nega kerak:** Suhbat har kimga ochiq bo'lsa, har xodim o'z kartasi/ЦКП'si haqida so'raydi; faqat rahbarga bo'lsa boshqaruv vositasi bo'ladi.
**Variantlar:**
- A) Hamma xodimga — har biri faqat o'z kartasi ruxsati doirasida ma'lumot ko'radi (RBAC kartadan, vizyon §5).
- B) Faqat rahbarlar va HR — nazorat oson.
- C) Keyin — hozir kerak emas.

### Q527. AI-suhbat — nimalarga javob beradi
**Nima:** AI-suhbat qanday savollarga javob beradi — faqat ЦКП/darslik kabi o'qitish, yoki ERP ma'lumotlari (hisobot, holat, ko'rsatkich) bo'yicha ham.
**Nega kerak:** Qamrovni belgilash kerak: o'qituvchi-AI (faqat karta bilimi) vs to'liq yordamchi (ERP'dan ma'lumot so'rab oladigan).
**Variantlar:**
- A) Ikkalasi ham — ЦКП/darslik o'qitish + ERP ma'lumotidan (xodim ruxsati doirasida) javob.
- B) Faqat ЦКП/darslik o'qitish (chatbot) — vizyon §10 "chatbot o'qitish".
- C) Keyin — hozir kerak emas.

### Q528. AI-suhbat tili
**Nima:** AI-suhbat qaysi tilda ishlaydi — o'zbek (lotin), rus, kirill — va xodim tilini tanlay oladimi.
**Nega kerak:** Zavod xodimlari turli tilda; AI tushunarli tilda gaplashmasa, hisobot/savol-javob ishlamaydi.
**Variantlar:**
- A) Uch til — o'zbek (lotin) + kirill + rus; xodim profilidan til olinadi.
- B) Faqat o'zbek (lotin) — sodda, lekin rusiyzabon xodimga qiyin.
- C) Keyin — hozir kerak emas.

### Q529. Qoida-buzilishni AI aniqlashi
**Nima:** AI qoida buzilishini (kech kelish, ЦКП bajarmaslik, sifat brak, kamera anomaliyasi) aniqlab belgilaydimi.
**Nega kerak:** Buzilishlarni avtomatik to'plab bersa, rahbar/HR vaqtida choralash imkoniga ega bo'ladi (vizyon: §10 qoida-buzilish; yo'n.29 inspektor bor).
**Variantlar:**
- A) Ha — AI-kamera + AI tahlil + rahbar + HR manbalaridan buzilishni aniqlaydi va ro'yxatlaydi (vizyon: §10).
- B) Faqat rahbar/HR qo'lda belgilaydi, AI aralashmaydi.
- C) Keyin — hozir kerak emas.

### Q530. AI-kamera hisoboti haqiqat bilan kross-tekshiruv
**Nima:** AI xodim bergan kunlik ЦКП hisobotini AI-kamera ko'rgan haqiqat bilan solishtirib, mos-nomosligini tekshiradimi.
**Nega kerak:** Xodim "bajardim" deb yozsa-yu, kamera boshqa narsa ko'rsa — yolg'on hisobotni AI ushlaydi (PART B/B5 kross-tekshiruv).
**Variantlar:**
- A) Ha — hisobot ↔ kamera kross-tekshiruv; nomoslik bo'lsa rahbar/HR'ga signal.
- B) Faqat kamera ma'lumotini saqlaydi, solishtirmaydi — sodda.
- C) Keyin — hozir kerak emas.

### Q531. Ko'nikma-matritsa → vorislar ro'yxati
**Nima:** AI xodimlar ko'nikmasidan kim qaysi kartaga voris bo'la olishini (ichki o'sish) avtomatik hisoblab beradimi.
**Nega kerak:** Karta bo'shasa, tashqaridan qidirishdan oldin AI mavjud ko'nikmali xodimni tavsiya qilsa, ichki o'sish tezlashadi (vizyon: §10 vorislar — masalan ko'nikmali farrosh → vakansiyaga).
**Variantlar:**
- A) Ha — ko'nikma-matritsadan vorislar ro'yxati (sabab bilan) + ichki o'sish tavsiyasi (vizyon: §10).
- B) Faqat ko'nikma-matritsani ko'rsatadi, vorisni odam o'zi tanlaydi.
- C) Keyin — hozir kerak emas.

### Q532. 3 kun yo'qlik → profil bloklash (AI chiqaradi)
**Nima:** Xodim 3 kun hisobot bermasa/yo'q bo'lsa AI profilni avtomatik bloklab, ochilish jarayonini boshlaydimi.
**Nega kerak:** Vizyon bo'yicha 3 kun yo'qlik = profil bloklanadi; ochish faqat HR raport → direktor tasdiq → super admin orqali (§10) — bu intizom va xavfsizlik nazorati.
**Variantlar:**
- A) Ha — AI 3 kunda bloklaydi; ochish HR raport → direktor tasdiq → super admin zanjiri bilan (vizyon: §10).
- B) Faqat ogohlantiradi, bloklamaydi — yumshoq.
- C) Keyin — hozir kerak emas.

### Q533. AI'lar o'zaro ishlashi (AI ↔ AI)
**Nima:** Har kartaning AI'si boshqa kartalarning AI'lari bilan ma'lumot almashib, birgalikda xulosa chiqaradimi (masalan rahbar AI'si jamoa AI'laridan yig'adi).
**Nega kerak:** Vizyon bo'yicha "AI'lar o'zaro ishlaydi"; bu butun bo'lim/zanjir holatini pastdan yuqoriga yaxlit ko'rishni beradi (MEMORY: org_card_centric_model).
**Variantlar:**
- A) Ha — quyi kartalar AI'lari → yuqori (rahbar) AI'siga yig'iladi; yaxlit bo'lim xulosasi chiqadi.
- B) Har AI mustaqil ishlaydi, o'zaro bog'lanmaydi — sodda, lekin yaxlit ko'rinish yo'q.
- C) Keyin — hozir kerak emas.

### Q534. AI provayderi / xarajat nazorati
**Nima:** AI qaysi xizmatdan foydalanadi va so'rovlar xarajati qanday nazorat qilinadi (kunlik limit, qaysi vazifa AI ishlatadi).
**Nega kerak:** AI har bir savol/hisobot uchun pul turadi; limitsiz ishlatsa xarajat oshib ketadi (operatsion qaror).
**Variantlar:**
- A) Markazda sozlanadigan limit + qaysi vazifalarga AI yoqilgani belgilanadi (xarajat nazorati).
- B) Limitsiz — to'liq imkoniyat, lekin xarajat oldindan bilinmaydi.
- C) Keyin — hozir kerak emas.

### Q535. AI tavsiyasi avtomatik bajariladimi yoki tasdiq kutadimi
**Nima:** AI bergan tavsiya (bonus, blok, harakat) avtomatik amalga oshadimi, yoki har doim odam tasdig'ini kutadimi.
**Nega kerak:** Vizyon bo'yicha muhim qarorlar (oylik, o'sish, blok ochish) doim odam tasdig'i bilan; AI faqat tavsiya beradi, qaror odamda qoladi.
**Variantlar:**
- A) AI faqat tavsiya beradi, har muhim qaror odam (HR/rahbar/direktor) tasdig'i bilan bajariladi (vizyon: §6, §7, §10).
- B) Past xavfli ishlar avtomatik, muhimlar tasdiq bilan — moslashuvchan, lekin chegarani aniqlash kerak.
- C) Hammasi avtomatik — tez, lekin xavfli va vizyonga zid.
- D) Keyin — hozir kerak emas.

### Q536. Markaziy AI'ga ulanish nuqtasi (karta-model bilan integratsiya)
**Nima:** AI ma'lumotni qaysi yagona manbadan oladi — karta-model master data'sidan (bitta DDL, sinxron), yoki har moduldan alohida.
**Nega kerak:** Vizyon bo'yicha hamma data bitta jadval strukturasi, sinxron (ikki-olam YO'Q); AI shu yagona manbaga ulansa, izchil va ishonchli ishlaydi (vizyon: §14 data prinsipi).
**Variantlar:**
- A) Yagona master data (karta-model, bitta DDL, sinxron) — AI + AI-kamera + barcha modul shunga ulanadi (vizyon: §14).
- B) Har moduldan alohida yig'adi — tezroq boshlanadi, lekin nomuvofiqlik xavfi.
- C) Keyin — hozir kerak emas.

---

## 18. Bildirishnoma / Telegram

### Q537. ShVB Telegram bot komandalari (/zvs_status, /my_gsd va h.k.)
**Nima:** Telegramda yozib so'rab oladigan tayyor komandalar: holatim, mening haftalik natijam, kompaniya holati, haftalik digest.
**Nega kerak:** Xodim yoki rahbar ERP'ga kirmasdan, Telegramdan bitta so'z yozib o'z holatini darrov ko'radi — ShVB usulining asosi shu.
**Variantlar:**
- A) To'rttala komanda ham bo'lsin (holatim / mening GSD'm / kompaniya holati / haftalik digest) — to'liq ShVB to'plami
- B) Faqat ikkitasi (mening natijam + kompaniya holati) — soddaroq boshlanish
- C) Keyin — hozir kerak emas

### Q538. "Mening holatim" komandasi nimani ko'rsatadi
**Nima:** Xodim "holatim" deb yozsa, qaytadigan ma'lumot mazmuni.
**Nega kerak:** Har bir kishi o'zining bugungi vazifasi va natijasini bir ko'rinishda bilishi kerak.
**Variantlar:**
- A) Karta nomi + bugungi vazifa + haftalik natija foizi + razryad — karta-modelga to'liq bog'liq
- B) Faqat bugungi vazifa va bajarildi/bajarilmadi — sodda
- C) Keyin — hozir kerak emas

### Q539. Haftalik digest qachon yuborilsin
**Nima:** Hafta yakuni xulosasi (kim qancha qildi) Telegramga avtomatik tushadigan kun va vaqt.
**Nega kerak:** Hammasi bir vaqtda kelса, rahbar dushanba yig'ilishiga tayyor keladi.
**Variantlar:**
- A) Dushanba ertalab soat 8:00 — hafta boshida o'tgan haftani ko'rib chiqish
- B) Shanba kechqurun — hafta yopilishi bilanoq
- C) Egasi har modul uchun o'zi vaqt belgilaydi — moslashuvchan
- D) Keyin — hozir kerak emas

### Q540. Haftalik digest kimga boradi
**Nima:** Digestni qaysi darajadagi odamlar oladi.
**Nega kerak:** Operatorga butun zavod xulosasi kerak emas, egasiga esa hamma kerak.
**Variantlar:**
- A) Org-marshrut bo'yicha: har kim o'z darajasidagini oladi (operator o'zinikini, bo'lim boshlig'i bo'limini, ega — hammasini) — Vysotskiy 7-pog'ona modeliga mos
- B) Faqat rahbarlar (bo'lim boshlig'idan yuqori) oladi — tor doira
- C) Hamma bir xil umumiy digestni oladi — sodda
- D) Keyin — hozir kerak emas

### Q541. FP-tsikl (Fun Point / haftalik tsikl) eslatmalari
**Nima:** ShVB haftalik tsiklining bosqichlari bo'yicha (rejalashtirish, baholash, hisobot) avtomatik eslatmalar.
**Nega kerak:** Tizim hozir 4 ta cron bilan eslatma yuboradi (Se/Ch/Pa/Du) — buni vizyonga moslab to'liq sozlash kerak.
**Variantlar:**
- A) To'liq FP-tsikl: har bosqichda (rejalashtir → bajar → bahola → hisobot ber) alohida eslatma — ShVB ritmi to'liq
- B) Faqat hafta boshi va hafta oxiri eslatmasi — ikki nuqta
- C) Keyin — hozir kerak emas

### Q542. Holat-alert (signal) qachon yuborilsin
**Nima:** Biror ko'rsatkich yomonlashganda yoki vazifa bajarilmaganda darrov keladigan ogohlantirish.
**Nega kerak:** Muammo hafta oxirigacha kutmasin — rahbar darrov bilib choralar ko'rsin.
**Variantlar:**
- A) Belgilangan chegaradan o'tganda darrov (masalan natija 70% dan past) — tezkor nazorat
- B) Faqat kunlik yig'ma signalda (kuniga bir marta) — kamroq bezovta
- C) Keyin — hozir kerak emas

### Q543. Alert chegaralarini kim belgilaydi
**Nima:** "Qachon signal bering" degan chegarani kim sozlaydi.
**Nega kerak:** Har modulning o'z me'yori bor — universal raqam to'g'ri kelmaydi.
**Variantlar:**
- A) Egasi/rahbar har karta yoki modul uchun chegarani o'zi qo'yadi — moslashuvchan
- B) Tizim umumiy standart chegara qo'yadi (hamma uchun bir xil) — sodda
- C) Keyin — hozir kerak emas

### Q544. Kanal sozlamasi: shaxsiy chat yoki guruh
**Nima:** Bildirishnomalar shaxsiy Telegram chatga keladimi yoki bo'lim guruhiga.
**Nega kerak:** Maxfiy natija shaxsiy bo'lishi, jamoaviy xulosa guruhda bo'lishi kerak.
**Variantlar:**
- A) Aralash: shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga — to'g'ri taqsimot
- B) Hammasi shaxsiy chatga — maxfiyroq
- C) Hammasi bo'lim guruhiga — ochiq
- D) Keyin — hozir kerak emas

### Q545. Telegram guruhlarini org-strukturaga bog'lash
**Nima:** Har bir bo'lim/sektsiya uchun alohida Telegram guruh va u org-shoxga ulanishi.
**Nega kerak:** Bildirishnoma to'g'ri odamlarga borishi uchun guruh org-marshrut bilan bog'lanishi kerak.
**Variantlar:**
- A) Har org-tugun (bo'lim/sektsiya) uchun o'z guruhi, avtomatik aniqlanadi — to'liq marshrut
- B) Faqat yirik bo'limlar uchun guruh, qolganlari yuqoriga qo'shiladi — qisman
- C) Keyin — hozir kerak emas

### Q546. Kim-nima-oladi: org-marshrut bo'yicha yo'naltirish
**Nima:** Bildirishnoma yuqoriga (rahbarga) yoki yon tomonga (boshqa bo'limga) qaysi qoida bo'yicha boradi.
**Nega kerak:** Operatorning muammosi to'g'ri keyingi rahbarga chiqishi shart — adresat noto'g'ri bo'lsa, signal yo'qoladi.
**Variantlar:**
- A) Vertikal: keyingi yuqori daraja (manager_id zanjiri) avtomatik oladi — Vysotskiy modeli
- B) Faqat bevosita bo'lim boshlig'i oladi — bir pog'ona
- C) Keyin — hozir kerak emas

### Q547. "Kompaniya holati" komandasi tarkibi
**Nima:** Ega "kompaniya holati" deb yozsa qaytadigan umumiy ko'rsatkichlar.
**Nega kerak:** Egasi har kuni butun zavodning bir nechta asosiy raqamini bir joyda ko'rishi kerak.
**Variantlar:**
- A) 7 otdeleniye bo'yicha asosiy ko'rsatkich (ishlab chiqarish, sotuv, sifat, pul) — ShVB panorama
- B) Faqat 3 ta asosiy raqam (sotuv, ishlab chiqarish, pul) — qisqa
- C) Keyin — hozir kerak emas

### Q548. Leaderboard (eng yaxshi/eng past) digestda
**Nima:** Haftalik digestda kim oldinda, kim orqada degan reyting.
**Nega kerak:** Reyting raqobat va motivatsiya beradi — ShVB usulida muhim. Hozir bu qism YO'Q.
**Variantlar:**
- A) Bo'lim va shaxs bo'yicha top-3 va past-3 ko'rsatilsin — to'liq reyting
- B) Faqat eng yaxshi 3 ta ko'rsatilsin (past tomoni shaxsiy yuboriladi) — yumshoqroq
- C) Reyting yo'q, faqat raqamlar — neytral
- D) Keyin — hozir kerak emas

### Q549. Karta-AI bahosi bildirishnomada
**Nima:** Har bir kartaning AI'si xodim-karta mosligini baholaydi — bu bahoni Telegramга chiqarish.
**Nega kerak:** Karta-modelda har AI o'z hisobotini yozadi; bu xulosa egaga/rahbarga yetib borishi kerak.
**Variantlar:**
- A) Har hafta AI xulosasi (mos/qisman/mos emas + sabab) digestga qo'shilsin — karta-modelga to'liq
- B) Faqat "mos emas" bo'lganda signal yuborilsin — faqat muammoda
- C) Keyin — hozir kerak emas

### Q550. Razryad o'zgarishi haqida xabar
**Nima:** Xodimning razryadi ko'tarilganda yoki tushganda avtomatik bildirishnoma.
**Nega kerak:** Razryad → talab → o'sish → oylik zanjirini hamma bilishi, motivatsiya bo'lishi uchun.
**Variantlar:**
- A) Xodimga + uning rahbariga + HR'ga xabar (oylik o'zgarishi bilan) — to'liq
- B) Faqat xodimning o'ziga xabar — shaxsiy
- C) Keyin — hozir kerak emas

### Q551. Bildirishnoma tili
**Nima:** Xabarlar qaysi tilda keladi (lotin/kirill/rus).
**Nega kerak:** Har xodim o'z qulay tilida o'qishi kerak — tizim 3 tilni qo'llab-quvvatlaydi.
**Variantlar:**
- A) Har xodim profilidagi tanlangan tilda (lotin/kirill/rus) — shaxsiy
- B) Hamma uchun bitta umumiy til (o'zbek lotin) — sodda
- C) Keyin — hozir kerak emas

### Q552. O'qilganini tasdiqlash (muhim xabarlar uchun)
**Nima:** Muhim signal o'qilganini xodim tugma bosib tasdiqlashi.
**Nega kerak:** "Bilmadim, ko'rmadim" degan bahonani yo'qotadi — rahbar kim ko'rganini biladi.
**Variantlar:**
- A) Faqat muhim/shoshilinch xabarlarda tasdiq tugmasi bo'lsin — maqsadli
- B) Hamma xabarda tasdiq talab qilinsin — qattiq nazorat (lekin bezovta qiladi)
- C) Tasdiq umuman kerak emas — sodda
- D) Keyin — hozir kerak emas

### Q553. Javob bermasa eskalatsiya (yuqoriga ko'tarish)
**Nima:** Xodim signalga belgilangan vaqtda javob bermasa, xabar avtomatik rahbariga chiqishi.
**Nega kerak:** Muammo bir joyda qotib qolmasin — org-marshrut bo'yicha yuqoriga chiqib hal bo'lsin.
**Variantlar:**
- A) Vaqt o'tsa avtomatik keyingi yuqori darajaga chiqsin (manager_id zanjiri) — Vysotskiy eskalatsiya
- B) Faqat eslatma takrorlansin, yuqoriga chiqmasin — yumshoq
- C) Keyin — hozir kerak emas

### Q554. Bildirishnoma chastotasi (tinchlik vaqti)
**Nima:** Tunda yoki dam olish kunlari xabar yuborilmasligi.
**Nega kerak:** Xodimni yarim tunda bezovta qilmaslik — faqat shoshilinch holatda istisno.
**Variantlar:**
- A) Ish vaqtida normal, tунда faqat shoshilinch signal — muvozanat
- B) Doim yuborilsin (cheklov yo'q) — to'liq oqim
- C) Keyin — hozir kerak emas

### Q555. Modullararo signallarni bitta bot ostida birlashtirish
**Nima:** Ombor, ishlab chiqarish, moliya, HR — hammasidan xabar bitta Telegram botdan kelishi.
**Nega kerak:** Xodim 5 ta botni emas, bitta joyni kuzatadi — tartibli bo'ladi.
**Variantlar:**
- A) Bitta umumiy ShVB bot, ichida modul belgisi bilan (masalan "Ombor:", "Moliya:") — yagona oqim
- B) Har modul o'z botida qolsin — alohida
- C) Keyin — hozir kerak emas

### Q556. Digestga PDF/rasm hisobot biriktirish
**Nima:** Haftalik digest matn ostida grafik yoki PDF hisobot ham yuborilishi.
**Nega kerak:** Rahbar batafsil ko'rishni xohlasa, ERP'ga kirmasdan ko'rsin.
**Variantlar:**
- A) Matn + bosib ko'riladigan PDF/grafik birga — to'liq
- B) Faqat matn xulosa (havola bilan) — yengil
- C) Keyin — hozir kerak emas

### Q557. Telegram orqali javob/buyruq berish
**Nima:** Rahbar Telegramdan tugma bosib vazifa tasdiqlashi yoki topshiriq berishi (faqat o'qish emas).
**Nega kerak:** Rahbar yo'lda bo'lsa ham ishni boshqarsin — ERP'ga kirmasdan tezkor qaror.
**Variantlar:**
- A) Asosiy amallar (tasdiqla / rad et / topshiriq ber) tugma bilan bo'lsin — interaktiv
- B) Faqat o'qish, amal ERP'da bajarilsin — sodda va xavfsiz
- C) Keyin — hozir kerak emas

### Q558. Bot komandalariga ruxsat (kim nimani so'ray oladi)
**Nima:** "Kompaniya holati" kabi maxfiy komandani kim ishlata olishi.
**Nega kerak:** Oddiy operator butun zavod moliyasini ko'rmasligi kerak — daraja bo'yicha cheklov.
**Variantlar:**
- A) Org-daraja bo'yicha: har kim faqat o'z huquqidagisini so'ray oladi — xavfsiz
- B) Hamma komandani hamma ishlata oladi — ochiq (xavfli)
- C) Keyin — hozir kerak emas

### Q559. Yangi xodim ulanishi (botni ro'yxatdan o'tkazish)
**Nima:** Yangi xodim Telegram bilan tizimga qanday bog'lanadi.
**Nega kerak:** Xodim bog'lanmasa, bildirishnoma bormaydi — bu jarayon oddiy bo'lishi kerak.
**Variantlar:**
- A) HR xodimni qo'shganda Telegram havola/kod avtomatik beriladi — uzluksiz
- B) Xodim o'zi botga telefon raqamini yuborib bog'lanadi — qo'lda
- C) Keyin — hozir kerak emas

### Q560. Oltin-ip (buyurtma) holati bo'yicha bildirishnoma
**Nima:** Buyurtma bosqichdan bosqichga o'tganda (qabul → ishlab chiqarish → tayyor → jo'natildi) tegishli kishilarga xabar.
**Nega kerak:** "Oltin-ip" — buyurtmaning boshidan oxirigacha kuzatuvi; har bosqichda mas'ul xabar olishi kerak.
**Variantlar:**
- A) Har bosqichda mas'ul bo'lim + sotuv menejeri + (kechiksa) rahbar xabar oladi — to'liq kuzatuv
- B) Faqat buyurtma tayyor bo'lganda va kechikkanda xabar — asosiy nuqtalar
- C) Keyin — hozir kerak emas

### Q561. Kechikish/muddat signali
**Nima:** Vazifa yoki buyurtma muddatiga yetib kelganda yoki o'tib ketganda ogohlantirish.
**Nega kerak:** Muddatlar nazoratsiz qolmasin — kechikish oldindan ko'rinsin.
**Variantlar:**
- A) Ikki bosqichli: muddatdan oldin eslatma + o'tib ketsa signal (rahbarga ham) — oldini olish
- B) Faqat muddat o'tgandan keyin signal — kechroq
- C) Keyin — hozir kerak emas

### Q562. ЦКП (yakuniy mahsulot) bajarilishi haqida xabar
**Nima:** Har kartaning ЦКП'si (kutilgan natija) bajarilgan/bajarilmaganligi bo'yicha bildirishnoma.
**Nega kerak:** Karta-modelda har karta o'z natijasi (ЦКП) bilan o'lchanadi — bu hafta yakunida ko'rinishi kerak.
**Variantlar:**
- A) Har hafta ЦКП bajarilish foizi xodim va rahbariga yuborilsin — karta-modelga to'liq
- B) Faqat ЦКП bajarilmaganda signal — muammoda
- C) Keyin — hozir kerak emas

### Q563. Bildirishnoma jurnali (kim qachon nimani oldi)
**Nima:** Yuborilgan barcha xabarlarning yozuvi (kimga, qachon, o'qildimi).
**Nega kerak:** "Xabar bormadi" nizolarini hal qilish va eskalatsiyani nazorat qilish uchun.
**Variantlar:**
- A) To'liq jurnal: kimga/qachon/o'qildimi, ERP ichida ko'rinadi — to'liq nazorat
- B) Faqat shoshilinch xabarlar jurnal qilinsin — qisman
- C) Keyin — hozir kerak emas

### Q564. Shablonlarni (xabar matnlari) kim tahrirlaydi
**Nima:** Bildirishnoma matnlari (salomlashish, signal, digest) tayyor shablonda — ularni kim o'zgartiradi.
**Nega kerak:** Egasi o'z uslubidagi matnni xohlashi mumkin; texnik xodimga bog'lanib qolmaslik kerak.
**Variantlar:**
- A) Egasi/admin ERP ichidan o'zi tahrirlaydi (kodga tegmasdan) — mustaqil
- B) Matnlar qotib turadi, faqat dasturchi o'zgartiradi — barqaror
- C) Keyin — hozir kerak emas

### Q565. Avariya/to'xtash signali (ishlab chiqarish to'xtasa)
**Nima:** Stanok to'xtasa yoki jiddiy nosozlik bo'lsa darrov tegishli kishilarga Telegram signal.
**Nega kerak:** Ishlab chiqarish to'xtashi pul yo'qotish — daqiqa hisobida xabar berilishi kerak.
**Variantlar:**
- A) Darrov: smena ustasi + texnik xizmat + bo'lim boshlig'i bir vaqtda xabar oladi — tezkor
- B) Faqat smena ustasiga, u qolganini xabar qiladi — bir nuqta
- C) Keyin — hozir kerak emas

### Q566. Maqtov/tanbeh (ijobiy va salbiy fidbek)
**Nima:** Xodim yaxshi natija ko'rsatganda maqtov, yomon bo'lganda eslatma xabari.
**Nega kerak:** ShVB usulida tan olish (maqtov) motivatsiyaning kuchli vositasi — avtomatik bo'lsin.
**Variantlar:**
- A) Ikkalasi: top natija — ochiq maqtov (guruhda), past natija — shaxsiy eslatma — muvozanatli
- B) Faqat maqtov bo'lsin (tanbeh rahbar qo'lida) — ijobiy
- C) Keyin — hozir kerak emas

---

## 19. POS Monitor

### Q567. POS Monitor asosiy vazifasi
**Nima:** Planshet ilovasi nimaga xizmat qiladi — material kirim/chiqim/inventar yoki undan kengroq.
**Nega kerak:** Modulning chegarasini aniqlash boshqa hamma qarorni belgilaydi; chalkashlik (kassa bilan) bo'lmasligi kerak.
**Variantlar:**
- A) Faqat zavod ombori harakatlari (kirim/chiqim/inventar) — toza chegara, kassa Finance'da qoladi
- B) Ombor + ishlab chiqarishga material berish (sex talabi) — kengroq, MES bilan bog'lanadi
- C) Keyin — hozir kerak emas

### Q568. Ombor xodimi planshetda kim sifatida kiradi
**Nima:** Tablet'ga login — har omborchi o'z hisobi bilanmi yoki umumiy "ombor" hisobimi.
**Nega kerak:** Har harakat kim qilganini bilmasak, javobgarlik va inventar farqini tekshira olmaymiz.
**Variantlar:**
- A) Har omborchi shaxsiy login (PIN yoki barcode-bejet) — har harakat ismga bog'lanadi
- B) Umumiy "ombor" hisobi, smenada bitta — sodda, lekin javobgarlik yo'qoladi
- C) Keyin — hozir kerak emas

### Q569. Qaysi omborlar planshetda ko'rinadi
**Nima:** POS Monitor 9 ombor turini (RM-MAIN, FG-STORE, MRO-STORE va h.k.) ko'rsatadimi yoki faqat bittasini.
**Nega kerak:** Har planshet o'z omboriga biriktirilsa, omborchi noto'g'ri omborga harakat yozib yubormaydi.
**Variantlar:**
- A) Har planshet bitta omborga biriktiriladi (qurilma → ombor) — xato kamayadi
- B) Omborchi ekranda ombor tanlaydi (hammasi ko'rinadi) — moslashuvchan, lekin xato xavfi
- C) Keyin — hozir kerak emas

### Q570. Kirim (priyomka) jarayoni qanday boshlanadi
**Nima:** Yangi material kelganda omborchi nimadan kirim ochadi — yetkazib beruvchi schyoti/zakazidan yoki bo'sh formadan.
**Nega kerak:** Kirimni zakazga bog'lasak, narx/miqdor avtomatik to'ldiriladi va xato kamayadi.
**Variantlar:**
- A) Yetkazib beruvchi zakazidan (purchase order) tanlab kirim — miqdor/narx avto, farq darrov ko'rinadi
- B) Bo'sh formadan qo'lda kiritish — tez, lekin xato va nazoratsiz
- C) Ikkalasi ham (zakaz bor bo'lsa undan, yo'q bo'lsa qo'lda)
- D) Keyin — hozir kerak emas

### Q571. Chiqim (otpusk) sababi majburiymi
**Nima:** Materialni chiqarganda sababini ko'rsatish — sexga, sotuvga, ichki ko'chirish, brak.
**Nega kerak:** Sababsiz chiqim qayerga ketganini bilmaymiz; hisobot va GL-yozuv noto'g'ri bo'ladi.
**Variantlar:**
- A) Sabab majburiy, ro'yxatdan tanlanadi (sexga/sotuv/ko'chirish/brak/qaytarish) — har chiqim hisobga tushadi
- B) Sabab ixtiyoriy izoh — sodda, lekin tahlil qilib bo'lmaydi
- C) Keyin — hozir kerak emas

### Q572. Barcode/QR skanerlash — material identifikatsiyasi
**Nima:** Omborchi materialni barcode/QR skanerlab tanlaydimi yoki ro'yxatdan qo'lda izlaydimi.
**Nega kerak:** Skaner xatoni keskin kamaytiradi va harakatni tezlashtiradi — planshet kamerasi yetarli.
**Variantlar:**
- A) Barcode/QR skaner asosiy, qo'lda izlash zaxira — tez va xatosiz
- B) Faqat qo'lda ro'yxatdan tanlash — qo'shimcha jihoz kerak emas, lekin sekin
- C) Keyin — hozir kerak emas

### Q573. Material barcode'i qayerdan keladi
**Nima:** Har materialga barcode/QR bo'lishi uchun u qayerda yaratiladi — kirimda chop etiladimi, yoki yetkazib beruvchiniki ishlatiladimi.
**Nega kerak:** Barcode tizimi bo'lmasa skaner ham ishlamaydi; etiketka kim chop etishini hal qilish kerak.
**Variantlar:**
- A) Kirim paytida ERP o'z barcode'ini chop etadi (planshetga ulangan printer) — yagona standart
- B) Yetkazib beruvchining barcode'i bazaga bog'lanadi — chop etish shart emas, lekin har xil format
- C) Ikkalasi ham qabul qilinadi
- D) Keyin — hozir kerak emas

### Q574. Harakat tasdiqlash (movement confirm) — bir yoki ikki bosqich
**Nima:** Kirim/chiqim yozilganda darrov balansga tushadimi yoki avval boshqa kishi tasdiqlaydimi.
**Nega kerak:** Katta/qimmat harakatlar uchun ikkinchi ko'z xatoni va o'g'irlikni kamaytiradi.
**Variantlar:**
- A) Oddiy harakat darrov, lekin chiqim/katta summa smena boshlig'i tasdig'i bilan — muvozanat
- B) Hamma harakat darrov tushadi (tasdiqsiz) — tez, lekin nazorat zaif
- C) Hamma harakat tasdiq talab qiladi — eng xavfsiz, lekin sekin
- D) Keyin — hozir kerak emas

### Q575. Tasdiqni kim beradi (karta-model bilan bog'liq)
**Nima:** Harakatni tasdiqlovchi shaxs lavozimi — smena boshlig'i, ombor boshlig'i, yoki org-kartadagi keyingi yuqori daraja.
**Nega kerak:** Karta-modeldagi vertikal (manager_id = keyingi yuqori daraja) tasdiq oqimini avtomatik belgilaydi.
**Variantlar:**
- A) Org-kartadagi keyingi yuqori daraja avtomatik tasdiqlaydi (vertikal) — vizyonga mos
- B) Doim ombor boshlig'i (qat'iy lavozim) — sodda, lekin org-modelga bog'lanmagan
- C) Keyin — hozir kerak emas

### Q576. Balans-guard — manfiy qoldiqni taqiqlash
**Nima:** Omborda yo'q materialni chiqarishga urinilsa tizim nima qiladi.
**Nega kerak:** Manfiy qoldiq inventar va GL'ni buzadi; balans-guard "yo'qni chiqarma" qoidasini majburlaydi.
**Variantlar:**
- A) Qat'iy taqiq — qoldiqdan ortiq chiqarib bo'lmaydi (xato ko'rsatiladi) — ma'lumot toza qoladi
- B) Ogohlantirish bilan ruxsat (boshliq tasdig'i kerak) — moslashuvchan, lekin manfiy bo'lishi mumkin
- C) Bemalol ruxsat — eng sodda, lekin xavfli
- D) Keyin — hozir kerak emas

### Q577. Balans-guard chegarasi — minimal qoldiq ogohlantirishi
**Nima:** Material minimal darajadan pasayganda planshetda/tizimda ogohlantirish chiqadimi.
**Nega kerak:** Kech qolingan zakaz ishlab chiqarishni to'xtatadi; minimal qoldiq signali ta'minotni oldindan ogohlantiradi.
**Variantlar:**
- A) Har materialga minimal qoldiq belgilanadi, pasayganda avto-ogohlantirish (ta'minotga) — uzilishsiz
- B) Faqat hisobotda ko'rinadi, avto-signal yo'q — sodda, lekin reaktiv
- C) Keyin — hozir kerak emas

### Q578. GL-koprik — harakat moliyaga qanday tushadi
**Nima:** Kirim/chiqim avtomatik bosh kitobga (entries) yoziladimi yoki faqat ombor balansini o'zgartiradimi.
**Nega kerak:** Material qiymati GL'ga tushmasa, moliya hisoboti omborni ko'rmaydi — ikki dunyo bo'lib qoladi.
**Variantlar:**
- A) Har tasdiqlangan harakat avto GL-yozuv yaratadi (entries jadvaliga) — ombor↔moliya bog'liq
- B) Faqat ombor balansi o'zgaradi, GL alohida qo'lda — sodda, lekin uzilgan
- C) Kunlik yig'ma yozuv (har harakat emas, kun oxirida) — yengilroq, lekin kechikadi
- D) Keyin — hozir kerak emas

### Q579. GL-yozuv qaysi hisoblarga tushadi
**Nima:** Kirim/chiqim qaysi GL hisoblariga yoziladi — material zaxirasi, ishlab chiqarish xarajati, brak hisobi.
**Nega kerak:** To'g'ri hisob xaritasisiz GL-yozuv ma'nosiz; har chiqim sababi o'z hisobiga ulanishi kerak.
**Variantlar:**
- A) Chiqim sababiga qarab avto hisob tanlanadi (sexga→ishlab chiqarish, brak→zarar) — to'g'ri taqsimot
- B) Hamma harakat bitta umumiy "zaxira" hisobiga — sodda, lekin tahlilsiz
- C) Keyin — hozir kerak emas

### Q580. Materialni baholash usuli (kirimda narx)
**Nima:** Chiqimda material qiymati qanday hisoblanadi — o'rtacha narx, FIFO, yoki oxirgi kirim narxi.
**Nega kerak:** Narx usuli GL-yozuv summasini va ombor qiymatini belgilaydi; bir marta tanlanib qat'iy bo'lishi kerak.
**Variantlar:**
- A) O'rtacha tortilgan narx (weighted average) — sodda va barqaror
- B) FIFO (birinchi kelgan birinchi chiqadi) — aniqroq, lekin murakkab
- C) Oxirgi kirim narxi — eng sodda, lekin og'ib ketadi
- D) Keyin — hozir kerak emas

### Q581. Inventar (sanab chiqish) jarayoni
**Nima:** Davriy inventarizatsiya planshetda qanday o'tkaziladi — to'liq sanash yoki tanlab.
**Nega kerak:** Real qoldiq tizim qoldig'idan farq qiladi; inventar bu farqni topib tuzatadi.
**Variantlar:**
- A) Planshetda skaner bilan sanash → tizim farqni avto ko'rsatadi (sahmonka/oshib qolish) — aniq
- B) Qog'ozda sanab keyin qo'lda kiritish — eski usul, sekin va xatoli
- C) Keyin — hozir kerak emas

### Q582. Inventar farqini kim tasdiqlaydi
**Nima:** Sanashda topilgan kam/ortiq farqni balansga yozish uchun tasdiq kerakmi.
**Nega kerak:** Tasdiqsiz farq yozish o'g'irlikni yashirishi mumkin; farq sababi yozilishi kerak.
**Variantlar:**
- A) Farq sabab bilan yoziladi + boshliq tasdig'i + GL'ga zarar/ortiqcha yozuv — to'liq nazorat
- B) Omborchi o'zi tuzatadi, tasdiqsiz — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas

### Q583. Inventar qancha tez-tez o'tkaziladi
**Nima:** Sanash davriyligi — har kuni, haftada, oyda, yoki faqat yiliga.
**Nega kerak:** Davriylik aniqlik darajasini belgilaydi; tez-tez sanash xatoni erta topadi.
**Variantlar:**
- A) Sikl-sanash: har kuni bir guruh material aylanma tarzda sanaladi — uzluksiz aniqlik
- B) Oylik to'liq inventar — barqaror, lekin kamroq aniq
- C) Faqat yillik — minimal, lekin farq katta to'planadi
- D) Keyin — hozir kerak emas

### Q584. Ichki ko'chirish (ombordan omborga)
**Nima:** Material bir ombordan boshqasiga o'tkazilganda bitta harakatmi yoki chiqim+kirim juftmi.
**Nega kerak:** Ko'chirish noto'g'ri yozilsa material "yo'qoladi" yoki ikki marta hisoblanadi.
**Variantlar:**
- A) Yagona "ko'chirish" harakati (manba ombordan kamayadi, qabul omborga qo'shiladi, GL'ga ta'sirsiz) — toza
- B) Alohida chiqim + alohida kirim — sodda, lekin uzilgan va xato xavfi
- C) Keyin — hozir kerak emas

### Q585. AI-taklif — nima tavsiya qiladi
**Nima:** Planshetdagi AI omborchiga qanday yordam beradi — zakaz vaqti, anomaliya, narx farqi.
**Nega kerak:** AI ombor xatolarini erta ko'rsatadi va omborchini boshqaradi; vizyondagi har karta o'z AI'siga ega.
**Variantlar:**
- A) Hammasi: minimal qoldiqda zakaz tavsiyasi + g'ayritabiiy harakat ogohlantirishi + narx og'ishi — to'liq aqlli yordamchi
- B) Faqat minimal qoldiq → zakaz tavsiyasi — sodda boshlang'ich
- C) Faqat kuzatish, taklif yo'q — passiv
- D) Keyin — hozir kerak emas

### Q586. AI anomaliya aniqlash
**Nima:** AI g'ayritabiiy harakatni (juda katta chiqim, tunda kirim, takroriy bekor qilish) belgilaydimi.
**Nega kerak:** Anomaliya o'g'irlik yoki xatoning erta belgisi; insondan ko'ra AI uni tezroq sezadi.
**Variantlar:**
- A) AI shubhali harakatni belgilab boshliqqa signal yuboradi — proaktiv nazorat
- B) Faqat hisobotda anomaliya ro'yxati ko'rinadi, avto-signal yo'q — passiv
- C) Keyin — hozir kerak emas

### Q587. Offline rejim — internet yo'qda
**Nima:** Planshet internet uzilganda harakat yozishni davom ettiradimi yoki to'xtaydimi.
**Nega kerak:** Zavod omborida internet uzilishi bo'ladi; ish to'xtamasligi kerak, lekin ma'lumot keyin sinxronlanishi shart.
**Variantlar:**
- A) Offline yozadi, internet kelganda avto-sinxron (balans/GL keyin yangilanadi) — uzluksiz ish
- B) Internet yo'qda bloklanadi (faqat onlayn) — ma'lumot doim aniq, lekin ish to'xtaydi
- C) Keyin — hozir kerak emas

### Q588. Harakatni bekor qilish/tuzatish
**Nima:** Noto'g'ri yozilgan harakatni omborchi o'chiradimi yoki faqat qarshi (storno) harakat bilan tuzatiladimi.
**Nega kerak:** Yozilgan harakatni o'chirish GL va inventar tarixini buzadi; auditda iz qolishi kerak.
**Variantlar:**
- A) O'chirish yo'q — faqat storno (qarshi yozuv) sabab bilan, tarix saqlanadi — auditga toza
- B) Boshliq ruxsati bilan o'chirish mumkin — moslashuvchan, lekin tarix yo'qoladi
- C) Keyin — hozir kerak emas

### Q589. Brak/yaroqsiz material harakati
**Nima:** Buzilgan, muddati o'tgan yoki sifatsiz material qanday hisobdan chiqariladi.
**Nega kerak:** Brak alohida sabab sifatida yozilmasa, u oddiy chiqimdan ajralmaydi va zarar ko'rinmaydi.
**Variantlar:**
- A) Alohida "brak/utilizatsiya" harakati + sabab + GL zarar hisobiga — aniq zarar tahlili
- B) Oddiy chiqim sifatida izoh bilan — sodda, lekin tahlilsiz
- C) Keyin — hozir kerak emas

### Q590. Tayyor mahsulot (FG) ishlab chiqarishdan ombarga qabuli
**Nima:** Sexdan chiqqan tayyor mahsulot omborga qanday kiradi — MES'dan avtomatik yoki planshetda qo'lda.
**Nega kerak:** Tayyor mahsulot avto kelmasa, ombor va MES qoldig'i bir-biriga to'g'ri kelmaydi.
**Variantlar:**
- A) MES ishlab chiqarish yopilganda avto FG-kirim yaratadi, omborchi planshetda tasdiqlaydi — bog'langan
- B) Omborchi qo'lda FG-kirim yozadi — sodda, lekin MES bilan uzilgan
- C) Keyin — hozir kerak emas

### Q591. Partiya/seriya (lot) kuzatuvi
**Nima:** Material partiya raqami va muddati bilan kuzatiladimi yoki faqat umumiy miqdor bilan.
**Nega kerak:** Sifat muammosi yoki muddat tugashida qaysi partiya ekanini bilish kerak (qog'oz/bo'yoq uchun muhim).
**Variantlar:**
- A) Partiya + muddat kuzatiladi (kirimda yoziladi, chiqimda FIFO) — to'liq kuzatuv
- B) Faqat umumiy miqdor, partiyasiz — sodda, lekin sifat izlanmaydi
- C) Faqat muhim materiallar uchun partiya (bo'yoq/elim), qolganlari oddiy
- D) Keyin — hozir kerak emas

### Q592. POS Monitor planshet ekrani ko'rinishi
**Nima:** Tablet ilovasi katta tugmali sodda interfeysmi yoki to'liq jadval/menyuli kompyuter ko'rinishi.
**Nega kerak:** Omborchi qo'lqopda, shoshilinch ishlaydi — interfeys yirik tugmali va xatosiz bo'lishi kerak.
**Variantlar:**
- A) Katta tugmali, kam matnli, skaner-markaz dizayn (sensorli ekranga moslashgan) — tez va xatosiz
- B) To'liq jadvalli desktop ko'rinishi planshetda — ko'p ma'lumot, lekin noqulay
- C) Keyin — hozir kerak emas

### Q593. Harakat hisoboti va smena yopilishi
**Nima:** Smena oxirida planshet kunlik harakat yig'masini (kirim/chiqim/qoldiq) ko'rsatadimi va yopiladimi.
**Nega kerak:** Smena yopilishi omborchi javobgarligini muhrlaydi va keyingi smenaga toza qoldiq beradi.
**Variantlar:**
- A) Smena oxirida yig'ma hisobot + omborchi tasdig'i (smena yopildi) — javobgarlik aniq
- B) Hisobot bor, lekin rasmiy yopilish yo'q — sodda, lekin javobgarlik yumshoq
- C) Keyin — hozir kerak emas

### Q594. Master-data — harakat turlari ro'yxati
**Nima:** Kirim/chiqim sabablari va harakat turlari qayerda boshqariladi — admin sozlamasida moslashuvchan yoki kodda qat'iy.
**Nega kerak:** Egasi yangi sabab (masalan "namuna", "qaytarish") qo'shmoqchi bo'lsa, dasturchisiz qo'sha olishi kerak.
**Variantlar:**
- A) Admin panelda sabab/tur ro'yxati tahrirlanadi (har biri GL hisobiga bog'lanadi) — moslashuvchan
- B) Kodda qat'iy belgilangan ro'yxat — barqaror, lekin o'zgartirish uchun dasturchi kerak
- C) Keyin — hozir kerak emas

### Q595. POS Monitor karta-model bilan integratsiya
**Nima:** Omborchi GSD/ЦКП (statistik ko'rsatkichi) POS Monitor harakatlaridan avto hisoblanadimi.
**Nega kerak:** Karta-modelда har lavozim o'z statistikasiga ega; omborchining statistikasi uning harakatlaridan (aniqlik%, tezlik) chiqishi kerak.
**Variantlar:**
- A) Omborchi GSD avto: inventar aniqligi% + harakat tezligi + xato soni → kartaga ulanadi — vizyonga mos
- B) Statistika alohida qo'lda kiritiladi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas

### Q596. POS Monitor va ikki-ombor dunyosi (kanonik jadval)
**Nima:** Harakat qaysi jadvalga yoziladi — kanonik warehouse_stock'ga yoki eski stocks'ga.
**Nega kerak:** Hozir ikki parallel ombor jadvali bor (warehouse_stock ╳ stocks); POS Monitor bittasini tanlashi kerak, aks holda qoldiq ikkiga bo'linadi.
**Variantlar:**
- A) Faqat kanonik warehouse_stock'ga yoziladi (boshqasi unga ko'chiriladi) — yagona haqiqat
- B) Hozircha ikkalasiga ham yoziladi (compat) — buzilmaydi, lekin chalkashlik qoladi
- C) Keyin — egasi kanonik jadvalni hal qilgach

---

## 20. Communication Center / Hujjat

### Q597. UMUMIY ARIZA — yagona kirish nuqtasi
**Nima:** Barcha rasmiy murojaat (ZNO/ZVS/доклад/распоряжение/ariza/buyruq) bitta "Yangi hujjat yarat" tugmasidan, shablon tanlash orqali boshlanadimi.
**Nega kerak:** Xodim qayerga, kimga yozishni o'ylamaydi — shablonni tanlaydi, qolganini tizim qiladi. ShVB ning "yagona aloqa tartibi" shu.
**Variantlar:**
- A) Yagona "Yangi hujjat" oynasi — barcha tur shu yerdan, shablon ro'yxati bilan — eng sodda, bitta o'rganish.
- B) Har tur alohida sahifada (ZNO alohida, доклад alohida) — modullar tarqoq, xodim adashadi.
- C) Keyin — hozir kerak emas.

### Q598. Shablonni kim yaratadi
**Nima:** Yangi hujjat turi (shablon) yaratish huquqi kimda — faqat super-admin, yoki bo'lim boshliqlari ham.
**Nega kerak:** Shablon = tizimning skeleti; tartibsiz shablon ko'paysa nazorat yo'qoladi.
**Variantlar:**
- A) Faqat super-admin yaratadi/o'zgartiradi, qolganlar ishlatadi — yagona standart, toza.
- B) Super-admin + tasdiqlangan bo'lim boshliqlari ham — tezroq, lekin tartib buzilishi mumkin.
- C) Keyin — hozir mavjud shablonlar yetarli.

### Q599. AI-yordam darajasi
**Nima:** Hujjat to'ldirishda AI (Claude) qancha yordam beradi — savol-javob bilan to'liq matn yozadimi, yoki faqat tahrir taklif qiladimi.
**Nega kerak:** Xodim "qanday yozishni" bilmaydi; AI intervyu bilan rasmiy hujjatni o'zi shakllantiradi.
**Variantlar:**
- A) To'liq intervyu: AI savollar beradi → javoblardan rasmiy matn tuzadi (hozirgi cc-ai-interview) — xodimga eng oson.
- B) Faqat yordamchi: xodim o'zi yozadi, AI grammatika/ohangni tuzatadi — arzonroq, lekin sifat past.
- C) AI yo'q — faqat bo'sh shablon maydonlari.

### Q600. AI ishlamasa nima bo'ladi (fallback)
**Nima:** AI xizmati javob bermasa yoki sekin bo'lsa, xodim hujjatni baribir yubora oladimi.
**Nega kerak:** Ishlab chiqarish to'xtamasligi kerak — AI nosozligi murojaatni bloklamasligi shart.
**Variantlar:**
- A) AI tushsa — qo'lda to'ldirish rejimiga o'tadi, xodim baribir yuboradi — uzilishsiz.
- B) AI majburiy — javob kelmasa, xodim kutadi — sifatli, lekin riskli.
- C) Keyin — hozir AI barqaror deb hisoblaymiz.

### Q601. Marshrut org-sxemadan avto-aniqlanadimi
**Nima:** Hujjat kimga ketishi (tasdiqlovchilar) org-sxemadan (manager_id zanjiri) avtomatik aniqlanadimi, yoki xodim qo'lda tanlaydimi.
**Nega kerak:** "Kimga yuborishni" xodim bilmaydi; tizim lavozim ierarxiyasidan o'zi topadi (cc-org-resolver).
**Variantlar:**
- A) Avto: shablon "1-bosqich = yuboruvchining boshlig'i, 2-bosqich = moliya direktori" deb belgilangan → org-sxemadan topiladi — vizyonga mos.
- B) Qo'lda: xodim har safar tasdiqlovchini ro'yxatdan tanlaydi — moslashuvchan, lekin xato qiladi.
- C) Aralash: avto taklif qiladi, xodim o'zgartira oladi.

### Q602. Manager topilmasa (manager_id NULL muammosi)
**Nima:** Org-sxemada keyingi tasdiqlovchi topilmasa (hozir manager_id ko'p joyda bo'sh), hujjat nima qiladi.
**Nega kerak:** Marshrut uzilsa hujjat osilib qoladi — buni oldindan hal qilish kerak.
**Variantlar:**
- A) Bo'lim boshlig'iga (DEPT_HEAD) yo'naltiradi, u ham yo'q bo'lsa — direktorga zaxira marshrut — hech qachon yo'qolmaydi.
- B) Yuboruvchiga xato qaytaradi "tasdiqlovchi topilmadi" — to'g'ri marshrut majbur qilinadi, lekin ish to'xtaydi.
- C) Keyin — avval manager_id ni to'ldirib chiqamiz.

### Q603. Imzo turi — PIN, parol yoki oddiy bosish
**Nima:** Tasdiqlash/imzolashda xodim qanday o'zini tasdiqlaydi — PIN-kod, parol, yoki shunchaki tugma.
**Nega kerak:** Rasmiy hujjat (ariza, buyruq) huquqiy kuchga ega bo'lishi uchun imzo isboti kerak.
**Variantlar:**
- A) PIN-kod (hozirgi cc-pin) — har imzoga qisqa kod, qulay va isbotli — tavsiya.
- B) To'liq parol — xavfsizroq, lekin har imzoda noqulay.
- C) Oddiy bosish (imzosiz) — eng tez, lekin huquqiy isbot yo'q.

### Q604. Imzo oqimi — ketma-ket yoki parallel
**Nima:** Bir bosqichda bir nechta tasdiqlovchi bo'lsa, ular navbat bilan imzolaydimi yoki bir vaqtda.
**Nega kerak:** ZVS kabi hujjatlarda 2-3 daraja bor; tezlik va tartib shu qarorga bog'liq.
**Variantlar:**
- A) Bosqichli: 1-bosqich tugagach 2-bosqichga o'tadi; bosqich ichida hamma imzolasa keyingiga (hozirgi model) — tartibli.
- B) To'liq parallel: hamma bir vaqtda ko'radi, hammasi imzolasa tasdiq — tez, lekin tartib yo'q.
- C) Keyin — hozirgi bosqichli model yetarli.

### Q605. Rad etish va qayta yuborish
**Nima:** Tasdiqlovchi rad etsa, hujjat butunlay yopiladimi yoki tuzatib qayta yuborish mumkinmi.
**Nega kerak:** Ko'p hujjat birinchi urinishda to'liq bo'lmaydi; qayta yuborish ishni tezlashtiradi.
**Variantlar:**
- A) Rad → yuboruvchiga sabab bilan qaytadi → tuzatib qayta yuboradi (resubmit) — joriy oqim, eng amaliy.
- B) Rad → hujjat o'ladi, yangidan boshlanadi — qat'iy, lekin tarix yo'qoladi.
- C) Keyin.

### Q606. Eskalatsiya — kechikkanda nima bo'ladi
**Nima:** Tasdiqlovchi belgilangan muddatda javob bermasa, hujjat avtomatik yuqoriga (boshqa odamga/boshliqqa) o'tadimi.
**Nega kerak:** Hujjat bir kishi ustida turib qolmasligi, ishlab chiqarish kechikmasligi kerak — ShVB ning eskalatsiya printsipi.
**Variantlar:**
- A) Avto-eskalatsiya: X soat o'tsa boshliqqa o'tadi + ogohlantirish — javobgarlik ta'minlanadi.
- B) Faqat eslatma: kechikkanga Telegram/in-app eslatma, lekin o'zi o'tmaydi — yumshoqroq.
- C) Keyin — hozir SLA faqat 3-savatda bor.

### Q607. Eskalatsiya muddati kim belgilaydi
**Nima:** "Necha soatdan keyin eskalatsiya" — har shablonga alohida belgilanadimi yoki butun tizimga yagona.
**Nega kerak:** Shoshilinch to'lov bilan oddiy ariza bir xil muddatda kutmasligi kerak.
**Variantlar:**
- A) Har shablonga + ustuvorlikka (shoshilinch/oddiy) qarab alohida muddat — moslashuvchan, to'g'ri.
- B) Butun tizimga bitta muddat (masalan 24 soat) — sodda, lekin qo'pol.
- C) Keyin.

### Q608. 3-savat bilan ulanish
**Nima:** Xodimga kelgan tasdiqlash kutayotgan hujjat avtomatik uning "Kiruvchi" savatiga tushadimi.
**Nega kerak:** Xodim bitta joyda (3-savat) hamma kutayotgan ishini ko'radi — ShVB ning shaxsiy dastur g'oyasi.
**Variantlar:**
- A) Ha: tasdiq kutayotgan hujjat → Kiruvchi savat; imzolagach → chiqadi — yagona ish ro'yxati.
- B) Alohida "Tasdiqlash navbati" sahifasi, 3-savatga bog'lanmaydi — ajratilgan, lekin ikki joyga qarash kerak.
- C) Keyin.

### Q609. 24 soat qoidasi (savat SLA)
**Nima:** Kiruvchi savatdagi hujjat 24 soatdan ortiq qolsa — qizil belgi + eslatma + eskalatsiya bo'ladimi.
**Nega kerak:** ShVB ning "24 soat" qoidasi — hech bir murojaat unutilmaydi.
**Variantlar:**
- A) Ha: 24 soat → qizil + egasiga eslatma, 48 soat → boshliqqa (hozirgi cc-sla.cron) — vizyonga mos.
- B) Faqat vizual qizil belgi, eslatma yo'q — sust ta'sir.
- C) Keyin.

### Q610. Kaskad — bir hujjat bir nechta vazifa tug'diradimi
**Nima:** Bitta tasdiqlangan hujjat (masalan buyruq) avtomatik bir nechta odamga vazifa/распоряжение yaratadimi.
**Nega kerak:** Buyruq tasdiqlangach uni bajarish ham boshlanishi kerak — qo'lda emas, avtomatik kaskad.
**Variantlar:**
- A) Ha: shablonda "tasdiqlangach kimga qanday vazifa" belgilanadi → avto-yaratiladi — to'liq avtomatlashuv.
- B) Qo'lda: tasdiqlangach kim nima qilishni o'zi ochadi — sodda, lekin tushib qolishi mumkin.
- C) Keyin.

### Q611. Hujjat raqamlash formati
**Nima:** Har hujjat avtomatik raqam oladimi (masalan ZVS-2026-0042) va format kim belgilaydi.
**Nega kerak:** Rasmiy hujjat raqamsiz bo'lmaydi — arxiv va qidiruv shunga tayanadi.
**Variantlar:**
- A) Avto-raqam, format har shablonga sozlanadi (hozirgi cc-document-number) — tartibli, qidiriladigan.
- B) Qo'lda raqam — xodim o'zi yozadi — xato va takror riski.
- C) Keyin.

### Q612. Arxiv-saqlash muddati
**Nima:** Tasdiqlangan/yopilgan hujjatlar qancha saqlanadi va o'chiriladimi.
**Nega kerak:** Rasmiy hujjatlar (buyruq, moliya arizasi) yillab kerak bo'ladi; qonuniy saqlash talab.
**Variantlar:**
- A) Hech qachon o'chmaydi, faqat arxivga ko'chadi (faol ro'yxatdan chiqadi) — xavfsiz, audit uchun.
- B) Belgilangan muddatdan keyin o'chadi (masalan 3 yil) — joy tejaydi, lekin xavfli.
- C) Keyin.

### Q613. Arxivdan qidiruv
**Nima:** Arxivdagi hujjatni qanday topish mumkin — raqam, sana, tur, yuboruvchi, mazmun bo'yicha.
**Nega kerak:** "O'tgan oygi falon buyruqni top" — qidiruvsiz arxiv foydasiz.
**Variantlar:**
- A) Ko'p mezonli filtr: tur + sana + yuboruvchi + holat + matn ichidan qidiruv — to'liq, qulay.
- B) Faqat raqam/sana bo'yicha sodda qidiruv — yengil, lekin cheklangan.
- C) Keyin.

### Q614. PDF chiqarish va rasmiy ko'rinish
**Nima:** Hujjatni rasmiy PDF (logotip, raqam, imzolovchilar, sana) sifatida yuklab olish kerakmi.
**Nega kerak:** Tashqi tomonga (bank, mijoz) yoki qog'oz arxivga rasmiy nusxa kerak bo'ladi.
**Variantlar:**
- A) Ha: har tasdiqlangan hujjat PDF — logotip + raqam + imzo zanjiri bilan — rasmiy ko'rinish.
- B) Faqat ekranda ko'rish, PDF yo'q — yengil, lekin tashqi ehtiyojga yaramaydi.
- C) Keyin.

### Q615. Hujjat turlari ro'yxati (master-data)
**Nima:** Boshida qaysi hujjat turlari (shablonlar) bo'lishi kerak — to'liq ro'yxatni hozir aniqlaymizmi.
**Nega kerak:** ShVB da ZVS, ZNO, доклад, распоряжение, buyruq (приказ), majlis protokoli bor — qaysilari shu modulda.
**Variantlar:**
- A) To'liq ShVB to'plami: ZVS, ZNO, доклад, распоряжение, приказ, protokol, umumiy ariza — bir martada sozlanadi.
- B) Avval 3-4 ta eng kerakli (ZVS, ZNO, ariza), qolgani bosqichma-bosqich — tez ishga tushadi.
- C) Keyin.

### Q616. Hujjat holatlari (status) ro'yxati
**Nima:** Hujjat qanday holatlardan o'tadi — qoralama / yuborilgan / tasdiqlanmoqda / tasdiqlangan / rad / bekor / arxiv.
**Nega kerak:** Xodim hujjati qayerda turganini aniq ko'rishi kerak; status ro'yxati tizimning til.i.
**Variantlar:**
- A) To'liq oqim: qoralama → yuborilgan → jarayonda → tasdiqlangan/rad → arxiv (hozirgi model) — aniq.
- B) Soddaroq: kutilmoqda / tugadi — kam ma'lumot, lekin sodda.
- C) Keyin.

### Q617. Karta-model bilan integratsiya — kim tasdiqlaydi
**Nima:** Tasdiqlovchi "lavozim kartasi" bo'yicha aniqlanadimi (xodim emas, lavozim) — xodim almashsa marshrut buzilmaydimi.
**Nega kerak:** Egasining karta-markazli modeli: ish kartaga bog'lanadi, xodim ikkilamchi; bu marshrutga ham tegishli.
**Variantlar:**
- A) Marshrut lavozim kartasiga bog'lanadi (xodim shu kartaga biriktirilgan kim bo'lsa) — xodim almashsa ham ishlaydi — vizyonga mos.
- B) Marshrut to'g'ridan xodimga (ism) bog'lanadi — sodda, lekin xodim ketsa uziladi.
- C) Keyin.

### Q618. Hujjat AI-tahlili (karta-AI bilan)
**Nima:** Har lavozim kartasining AI'si o'ziga kelgan hujjatlarni tahlil qilib, tasdiqlovchiga xulosa/tavsiya beradimi.
**Nega kerak:** Egasining vizyonida har karta o'z AI'siga ega; AI tasdiqlovchiga "bu ariza mantiqli/risk bor" deb yordam beradi.
**Variantlar:**
- A) Ha: tasdiqlashdan oldin AI qisqa tahlil beradi (mos/risk/tavsiya) — qaror tezlashadi.
- B) AI yo'q tahlilda — tasdiqlovchi o'zi o'qiydi — sodda.
- C) Keyin — avval asosiy oqim ishlasin.

### Q619. Telegram orqali tasdiqlash
**Nima:** Tasdiqlovchi hujjatni Telegram botda ko'rib, o'sha yerdan tasdiq/rad qila oladimi.
**Nega kerak:** Boshliqlar har doim ERP da emas; Telegram operativlikni ta'minlaydi (ShVB asosiy kanal).
**Variantlar:**
- A) Ha: Telegramga xabar + tasdiq/rad tugmasi (PIN bilan) — eng tez javob.
- B) Faqat Telegram eslatma, tasdiq ERP da — yarim qulaylik.
- C) Keyin.

### Q620. Communikatsiya: in-app + Telegram + email
**Nima:** Yangi hujjat/tasdiq so'rovi qaysi kanallar orqali yetkaziladi.
**Nega kerak:** Xabar yetib bormasa, hujjat osilib qoladi — bir nechta kanal ishonchlilikni oshiradi.
**Variantlar:**
- A) In-app bildirishnoma + Telegram (asosiy) — ShVB ga mos, ishonchli.
- B) Faqat in-app — sodda, lekin offline xodim ko'rmaydi.
- C) Keyin.

### Q621. Hujjatga fayl/rasm biriktirish
**Nima:** Murojaatga fayl (skan, hisob-faktura, rasm) biriktirib yuborish mumkinmi.
**Nega kerak:** ZNO/ZVS ga ko'pincha hujjat-asos (schyot, shartnoma) kerak bo'ladi.
**Variantlar:**
- A) Ha: bir nechta fayl biriktirish (PDF/rasm) — to'liq murojaat.
- B) Faqat matn, fayl yo'q — yengil, lekin chala.
- C) Keyin.

### Q622. Kim ko'ra oladi (maxfiylik)
**Nima:** Hujjatni faqat yuboruvchi va tasdiqlovchilar ko'radimi, yoki bo'lim/butun tizim.
**Nega kerak:** Moliya arizasi yoki shaxsiy ariza maxfiy bo'lishi kerak; ortiqcha ko'rinish maxfiylikni buzadi.
**Variantlar:**
- A) Faqat ishtirokchilar (yuboruvchi + marshrutdagi tasdiqlovchilar) + super-admin — maxfiy, to'g'ri.
- B) Bo'lim ichida hamma ko'radi — shaffof, lekin maxfiylik yo'q.
- C) Keyin.

### Q623. ZVS/ZNO moliya integratsiyasi
**Nima:** ZVS/ZNO (moliya arizasi) shu modulda yaratilib, tasdiqlangach moliya (GL/to'lov) bilan bog'lanadimi.
**Nega kerak:** Backend ZVS/ZNO bor lekin jadval+FE yo'q (audit); shu modul ularning yagona kirish nuqtasi bo'lishi mumkin.
**Variantlar:**
- A) Ha: ZVS/ZNO shu modulda shablon sifatida → tasdiq → moliya to'lov navbatiga o'tadi — yagona oqim.
- B) ZVS/ZNO alohida moliya modulida qoladi, bu modul faqat umumiy ariza — ajratilgan.
- C) Keyin — avval umumiy ariza ishlasin.

### Q624. Tasdiqlash matritsasi (summa bo'yicha marshrut)
**Nima:** Moliyaviy hujjatlarda summa bo'yicha tasdiqlovchi o'zgaradimi (kichik summa = boshliq, katta = direktor).
**Nega kerak:** ShVB tartibi: ≤500k boshliq, ≤5M Rek.Sovet, >5M direktor — summa marshrutni belgilaydi.
**Variantlar:**
- A) Ha: summa chegaralari shablonga sozlanadi → marshrut avtomatik tanlanadi (approval_matrix ulanadi) — vizyonga mos.
- B) Summadan qat'i nazar bitta marshrut — sodda, lekin ShVB tartibiga zid.
- C) Keyin.

### Q625. Majlis protokoli shu modulgami
**Nima:** Kengash majlis bayonnomasi (protokol) shu hujjat-modulda shablon sifatida yaratiladimi yoki Koordinatsiya modulida.
**Nega kerak:** Protokol hozir YO'Q (audit); u ham rasmiy hujjat — shu modul engineiga tushishi mumkin.
**Variantlar:**
- A) Ha: protokol ham hujjat shabloni (kun tartibi + qarorlar + ishtirokchilar + imzo) — yagona engine.
- B) Protokol Koordinatsiya modulida alohida — domeniga yaqin, lekin ikki tizim.
- C) Keyin.

### Q626. Hujjat tarixi va audit izi
**Nima:** Har hujjatda kim qachon nima qilgani (yuborildi, ko'rildi, imzolandi, rad etildi) to'liq yozib boriladimi.
**Nega kerak:** Rasmiy hujjatda "kim tasdiqladi, qachon" isboti shart — nizo va audit uchun.
**Variantlar:**
- A) To'liq audit izi: har amal vaqt + foydalanuvchi + IP bilan yoziladi, o'chirib bo'lmaydi — ishonchli isbot.
- B) Faqat oxirgi holat saqlanadi, tarix yo'q — yengil, lekin isbotsiz.
- C) Keyin.

### Q627. Qoralama avto-saqlash
**Nima:** Xodim hujjatni to'ldirayotganda (ayniqsa AI-intervyu) yarim yo'lda to'xtasa, qoralama saqlanib qoladimi.
**Nega kerak:** Uzun ariza to'ldirilayotganda uzilish bo'lsa, ish yo'qolmasligi kerak.
**Variantlar:**
- A) Ha: qoralama avto-saqlanadi, keyin davom ettiriladi (hozirgi createDraft) — qulay, ish yo'qolmaydi.
- B) Yo'q: yubormaguncha saqlanmaydi — sodda, lekin riskli.
- C) Keyin.

### Q628. Communikatsiya tili (uz / ru)
**Nima:** Hujjat va AI-intervyu xodim tilida (lotin/kirill/rus) bo'ladimi, yoki yagona tilda.
**Nega kerak:** Zavodda turli tilli xodimlar bor; hujjat tushunarli tilda bo'lishi natijaga ta'sir qiladi.
**Variantlar:**
- A) Xodim tilida (uz-lotin / uz-kirill / ru) — har kim o'z tilida yozadi/o'qiydi — qamrovli.
- B) Faqat bitta rasmiy til — bir xil, lekin hammaga qulay emas.
- C) Keyin.

---

JAMI: 628 savol
