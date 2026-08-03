# FIN — Finance / GL + Kassir — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Tushumni 4-hisobga (MAIN/TAX/HEAD/WORKING) taqsimlash triggeri qaysi event'ga bog'lanadi — `PosMovementCompletedEvent`, `SdOrderPaidEvent` yoki alohida `CashReceivedEvent`; agar trigger kechikmasa (real-time) lekin tranzaksiya rollback bo'lsa taqsimlash qanday bekor qilinadi? [⤳ ta'sir: GL, POS, SD]

2. 4-hisob taqsimlash foizlari egasi tomonidan o'zgartirilganda — o'sha kungi allaqachon bajarilgan taqsimlar qayta hisoblansinmi yoki faqat yangilariga qo'llanilsinmi; o'zgarishdan oldingi davr hisoboti eski foizlarda ko'rinadimi? [⤳ ta'sir: GL, Audit-log, Settings]

3. ZVS arizasi yaratilganda byudjet qoldig'i real vaqtda bloklanadimi (pessimistik rezerv) yoki faqat tasdiqdan keyinmi; agar bir vaqtda ikki menejer bir byudjetdan so'rov bersa race condition qanday hal qilinadi (optimistik lock yoki DB-level serialize)? [⤳ ta'sir: ZVS, Byudjet, Coordination]

4. Tasdiqlash matritsasida `getRequiredLevel()` summa chegarasini kartadagi vakolat bilan solishtiradi; agar ZVS yaratuvchining kartasi topilmasa (xodim endi aktiv emas, karta bo'sh) — ariza bloklanadimi, egasiga eskalatsiya qilinadimi yoki boshqacha fallback bor? [⤳ ta'sir: Org-karta, ZVS, RBAC]

5. FP-tsikl cron har Se/Ch/Pa/Du ishga tushadi; bank yoki bayram kuni to'g'ri kelib qolsa keyingi ish kuniga avtomatik suriladimi; surilish logikasi DB'da saqlanadimi yoki runtime'da hisoblanadimi; Telegram xabari surilish haqida xabardor qiladimi? [⤳ ta'sir: NTF, Telegram-bot, Cron]

6. Aging hisoblashda (0-30/31-60/61-90/90+) "muddati" debitor uchun yetkazilgan sana (акт/накладной), kreditor uchun Счёт-фактура shartlari muddati ekani tasdiqlangan — lekin agar Счёт-фактura muddati kiritilmagan bo'lsa aging qaysi sanadan boshlanadi: qabul sanasimi, kirish sanasimi, egasidan default belgilansinmi? [⤳ ta'sir: MM, Aging, ZNO]

7. Mijoz kredit limitini oshirish vakolati egasi/moliya rahbariga berilgan; agar SD'da buyurtma yaratish vaqtida limit oshib ketsa — buyurtma qattiq bloklanadimi yoki "tasdiqda" holatida davom etadimi; tasdiq kutilayotgan vaqtda shu mijozga yana bir buyurtma kelsa nima bo'ladi? [⤳ ta'sir: SD, CRM, Approval]

8. Qisman to'lov FIFO tartibida (eng eski faktura avval) yopiladi; agar mijoz "aniq fakturaga" to'lov qilganini bildirsa (o'tkazmada izoh bilan) — tizim FIFO'ni bekor qilib qo'lda taqsimlashga o'tadimi; bu o'zgarishni kim amalga oshira oladi (kassir/moliya rahbar/egasi)? [⤳ ta'sir: SD, Aging, Debitor]

9. Inventarizatsiya farqi moliyaviy qaydni yaratishdan oldin moliya tasdiqlaydi (POS Q52-53 tasdiq); agar moliya tasdiqlamay 24 soat o'tib ketsa — GL yozuvi avtomatik yozilsinmi, eskalatsiya bo'lsinmi yoki hisobot "tasdiqlanmagan farq" sifatida ochiq tursinmi? [⤳ ta'sir: Ombor, GL, Audit]

10. Davr yopilganda (oy qulflash) GL yozuvlari immutable bo'ladi; agar yopilgan davrda xato topilsa — egasi/moliya rahbari davr ochishi va tuzatish qilishining texnik jarayoni qanday (kim, qaysi endpoint, qaysi audit event, necha marta ruxsat)? [⤳ ta'sir: GL, Hisobotlar, RBAC]

11. Valyuta kursi (import qog'oz/kimyo uchun) kirim kunidagi MB kursi bilan saqlanadi; agar kirim kuni MB kursi API'dan olinmasa (internet yo'q, offline rejim) — qo'lda kirish majburiyatimi, so'nggi mavjud kurs ishlatilsinmi yoki to'xtatilsinmi; bu holat audit-logga tushsinmi? [⤳ ta'sir: MM, Ombor, Offline-A5]

12. Kamomad (qog'oz kamomadi) smenaga bog'lanadi va kg × narx = zarar avtomatik hisoblanadi; agar smena ikki kalendar kun orasida bo'lsa (kechqurun boshlangan, ertalab tugagan) — qaysi smena/davr uchun GL yozuvi yoziladi; qaysi kunning narxi (FIFO) ishlatiladi? [⤳ ta'sir: MES, Ombor, GL]

13. Brak% > norma bo'lganda tannarx og'ishi + ogohlantirish chiqadi; lekin global printsipga ko'ra salbiy ta'sir (ushlanma) faqat inson tasdig'i bilan; unda ogohlantirish kimga boradi (sex yetakchisi? QC rahbari? HR?) va tasdiq holati qaysi kanban/coordination savatida yashaydi? [⤳ ta'sir: QC, MES, HR, Coordination]

14. Xodim profilidagi "qarz" (kassirdan olgan pul omborga kirmaguncha) GL'da qanday yoziladi — debitor sifatida (xodim-debitor hisobi) yoki balans ichki hisobda; agar xodim iste'foga chiqsa qarz mehnat haqidan undirish jarayoni avtomatikmi? [⤳ ta'sir: HR, Kassa, GL, Org-karta]

15. Avans hisoboti: xodim chekni bar/ERP orqali yuklaydi → AI o'qiydi → kassir/moliya yakuniy tasdiqlaydi; AI chekni noto'g'ri o'qisa (summa xato, sana xato) va kassir ham e'tibor bermasa → GL'ga xato summa tushsa — tuzatish qanday ishlaydi (davr ochiq/yopiq bo'lganda farq qiladimi)? [⤳ ta'sir: Kassa, GL, Audit]

16. Naqd kassa limiti oshganda inkassatsiya eslatmasi yuboriladi; agar eslatmadan keyin 4 soat o'tsau inkassatsiya bajarilmasa — kim kimga eskalatsiya qilinadi (kassir → moliya rahbar → egasi); bu holat qancha marta takrorlansa "muammo" sifatida Coordination'ga tushadi? [⤳ ta'sir: Kassa, NTF, Org-karta, Coordination]

17. To'lov navbatini (ustuvorlik: oylik/soliq/xom-ashyo/boshqa) egasi sozlaydi; agar kassa qoldig'i faqat oylik va soliqlarga yetsa — tizim xom-ashyo ZNO'larini avtomatik "kuting" holatiga o'tkazadimi yoki faqat ogohlantiradi; bu qaror kimning ekranda chiqadimi? [⤳ ta'mir: ZNO, Kassa, Byudjet, Director]

18. Penya (pеня) avtomatik hisoblanadi lekin qo'llash egasi/rahbar tasdig'iga bog'liq; penya summasi GL'da qanday aks etadi — darhol "da'vo receivable" sifatida yoki faqat tasdiqdan keyin; tasdiqlanmagan penya hisobot/dashboard'da ko'rinadimi? [⤳ ta'sir: SD, Aging, GL]

19. Transport xarajati (landed cost) material kirim tannarxiga taqsimlanadi; agar bir transport mashina bir nechta yetkazib beruvchidan material olib kelsa — tashish narxi material turiga, og'irligiga yoki bo'lagiga qanday proporsional taqsimlanadi; formulaning kanonik tavsifi qayerda? [⤳ ta'sir: MM, Ombor, Tannarx]

20. 3-way match: zakaz = faktura = kirim bo'lmasa to'lov bloklanadi; agar qisman yetkazilgan bo'lsa (masalan 80% keldi, 20% kechikib keladi) — to'lovning 80% qismi o'ta oladimi; blok qaysi komponent (WMS qabul?) tarafidan chiqariladi va GL'da qanday qayd qilinadi? [⤳ ta'sir: MM, Ombor, ZNO, GL]

21. Yetkazib beruvchi moliyaviy reytingi (narx 20% + brak% 40% + kechikish 30% + hujjat 10%) avtomatik hisoblanadi; reyting qancha davrda qayta hisoblanadi (real-time, kunlik cron, har xarid)? Past reyting oshsa blok avto ko'tariladimi yoki faqat inson ochirganda? [⤳ ta'sir: MM, QC, Ombor]

22. O'zaro hisob (vzaimozачёт) akti yopilganda ikki tomon qarzi bir vaqtda GL'da yopiladi; agar bir tomon qarz to'liq yopilmay qolsa (asimmetrik) qolgan qism qanday hisoblanadi; aktni kim tasdiqlaydi va ikki taraflama imzo (elektron) qanday amalga oshiriladi? [⤳ ta'sir: SD, MM, Debitor/Kreditor]

23. Stanok amortizatsiyasi cron oylik hisoblanadi va GL'ga yoziladi; agar stanok o'rtadagi oyda sotib olingan bo'lsa (15-iyun) — o'sha oy uchun yarim amortizatsiyami yoki keyingi oydan to'liq; stanok balansdan chiqarilsa (sotish/hisob o'chirish) qolgan kitob qiymati GL'da qanday hal qilinadi? [⤳ ta'sir: MES (jihoz), GL, Soliq]

24. Energiya xarajati (elektr/gaz/suv) stanokka soat × quvvat formulasi bo'yicha taqsimlanadi; agar bir oyda energiya schyotor uchun bir dona faktura kelsa va u bir necha bo'lim/stanokka taqsimlanishi kerak bo'lsa — taqsimlash jarayoni avtomatikmi yoki moliya qo'lda kiritadimi; keyingi oy faktura kelmasa (kechiksa) qanday hal qilinadi? [⤳ ta'sir: MES, Tannarx, Byudjet]

25. Gilza (qaytariladigan tara) depoziti sifatida hisoblanadi; agar yetkazib beruvchi gilzani qabul qilmasa yoki yo'qolsa — depozit summasi GL'da qachon zararга o'tkaziladi; yo'qolish faktini kim qaydlaydi (ombor menejeri? QC?) va tasdiq kerakmi? [⤳ ta'sir: Ombor, MM, GL]

26. Yelim retsepti (kraxmal/soda/bura) sarf-normasi bo'yicha hisoblanadi; agar bir partiya yelim tayyorlashda ortiqcha ishlatilsa — ortiqcha sarf avtomatik zarar sifatida GL'ga tushsinmi yoki smena hisoboti tasdiqlangandan keyinmi; normadan og'ish qancha bo'lsa ogohlantirish chiqadi (% chegara egasidan)? [⤳ ta'sir: MM, MES, Tannarx]

27. Makulatura sotilganda (chiqindi mahsulot) daromad qaysi GL hisobiga borishini egasi hal qilishi kerak ("boshqa daromad" vs "zararni kamaytirish") — tizimda bu sozlama qayerda (xarajat toifalari master-data?) va u o'zgarganda o'tgan davrlar retroaktiv o'zgarisinmi? [⤳ ta'sir: Ombor, QC, SD, GL]

28. Buyurtma rentabelligi kartochkasi: daromad − to'liq tannarx (material + mehnat + amortizatsiya + energiya + transport); mehnat tannarxi MES sessiyasidan keladimi, PP texkartasidanmi yoki ikkalasidanmi; zararli buyurtma aniqlanganda moliya rahbar qancha muddatda xabardor qilinadi? [⤳ ta'sir: SD, PP, MES, GL]

29. Narx tannarxdan past bo'lsa (zararga sotuv) blok yoki egasi tasdig'i ishga tushadi; lekin sort (1/2/3-sort, QC-072) uchun narx koeffitsienti standartdan past bo'lishi normal — ular uchun blok mexanizmi qanday ishlashi kerak (sort turiga qarab minimal narx chegarasi alohidami)? [⤳ ta'sir: SD, QC, Approval]

30. Mijoz avansi (oldindan to'lov) alohida "kreditor-mijoz" hisobida saqlanadi va yetkazilganda daromadga o'tadi; agar buyurtma qisman yetkazilsa avans qisman o'tkazilsinmi; buyurtma bekor bo'lganda avans qaytarish GL yozuvi va kassa harakati bir vaqtda (atomik) bo'linadimi? [⤳ ta'sir: SD, Kassa, GL]

31. Haftalik "berilgan xom-ashyo hisoboti" moliyaga avtomatik tushadi va byudjet bilan taqqoslanadi; agar hisobot yaratilishida MES sessiya ma'lumotlari hali yopilmagan (smena tugamagan) bo'lsa — qisman hisobot yuborilsinmi yoki smena yopilishi kutilsinmi; chalkashlik bo'lmaydi? [⤳ ta'sir: PP, MES, Ombor, Byudjet]

32. Pul aylanma davri dashboard'i (debitor kun − kreditor kun + ombor kun) real vaqtda yangilanadimi yoki kunlik snapshot'mi; agar debitor kun 60'dan oshib ketsa direktor/moliya rahbarga avtomatik signal chiqadimi va signal frekventsiyasi nechta (bir marta, har kuni, to'g'rilanguncha)? [⤳ ta'sir: Aging, Ombor, Dashboard, Director]

33. To'lov kalendari (kun bo'yicha kirim/chiqim prognozi) ZNO'lardagi to'lov muddati + aging debitor kutilayotgan to'lovlaridan tuziladi; agar ZNO tasdiqlangan lekin to'lov sanasi kiritilmagan bo'lsa — u kalendarga kiradimi (masalan haftaning oxiri default)? AI forecasting uchun qo'shimcha faktor hisobga olinadimi (mavsumiylik, o'tgan yil trendi)? [⤳ ta'sir: ZNO, SD, Aging, AI]

34. Byudjet-fakt og'ishi chegaradan oshsa mas'ul kartaga tushuntirish talabi (Coordination) yuboriladi; agar kartada hozir xodim yo'q (bo'sh slot) bo'lsa — tushuntirish talabi qaysi darajaga eskalatsiya qilinadi va qancha muddatda; bo'sh karta uchun byudjet mas'uliyati qaysi kartaga o'tadi? [⤳ ta'sir: Coordination, Byudjet, Org-karta]

35. ZVS/ZNO 6-holatli oqimi: Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad; agar "Direktor" holati uchun direktor tizimda emas (sayohatda, i.o. tayinlangan) bo'lsa — i.o. moliyaviy tasdiq huquqiga ega bo'ladimi; global printsip i.o. "pul/kadr qaror yo'q" deydi — bu ZNO tasdig'iga qarama-qarshi emasmi? [⤳ ta'sir: Approval, Org-karta, ZVS, Director]

36. GL kanonik jadval `entries`/`gl_entries`; `PosMovementCompletedEvent` trigger bo'lganda GL posting avto-yoziladi; agar posting vaqtida COA'da tegishli hisob raqami topilmasa (yangi xarajat kategoriyasi uchun hisob qo'shilmagan) — posting to'xtasin, xatoga tushsin yoki "uncategorized" hisobiga yozilsinmi; kim xabardor qilinadi? [⤳ ta'sir: POS, GL, COA, NTF]

37. Davr yopish cron yoki qo'lda ishga tushiradimi; agar davr yopilayotgan vaqtda bir nechta parallel tranzaksiya (payroll, ZNO to'lov, POS kirim) kechayotgan bo'lsa — ular davr ichiga kiradimi yoki keyingi davrga o'tadimi; "yopish" atomik operatsiyami (DB-level lock)? [⤳ ta'sir: GL, Payroll, ZNO, POS]

38. Mehnat haqi soliqlari (INPS 8% / JSHD 12%) payroll yopilganda GL'ga yoziladi; agar bir xodim bir nechta karta egallagan bo'lsa (ko'p-karta oylik, ORG-066/142) — soliq hisobi umumiy yig'indi oyliqdan hisoblanadimi yoki har karta uchun alohida GL yozuvi yoziladimi; BHMS hisoblar rejasida soliq xarajati qaysi hisobda? [⤳ ta'sir: HR, GL, Soliq, Org-karta]

39. Chegirma vakolat darajasi (sotuvchi ≤5%, rahbar ≤15%, egasi >15%) kartadan keladi; agar mijozga murakkab narx tuzilmasi bo'lsa (asosiy mahsulotga chegirma yo'q, qo'shimcha xizmatlarga 20%) — tizim har qator uchun alohida vakolat tekshiruvi o'tkazadimi yoki umumiy summa bo'yicha; chegirma GL'da alohida hisob qatorimi yoki daromaddan ayirma? [⤳ ta'sir: SD, GL, Approval, CRM]

40. Ijara (tayyor mahsulot 30 kundan keyin har kuni m²ga pul) menejerga PDF yuboriladi; lekin GL'da ijara daromadi qachon tan olinadi — har kuni avtomatik kichik yozuv (accrual) yoki mijoz to'laganida (cash basis); agar ijara qarzi eski bo'lib qolsa (90+ kun) aging'ga tushsinmi? [⤳ ta'sir: WMS, SD, GL, Aging]

41. Tayyor mahsulot omboridagi "lahtak" (qoldiq) aybdor menejer profiliga o'tadi; bu moliyaviy ma'noda nima — inventar aktivni menejer "balansiga" o'tkazishmi yoki faqat mas'uliyat belgisi; GL'da bu o'tkazmani qanday qayd qilish kerak va lahtak sotilganda daromad kimning hisobiga tushadi? [⤳ ta'sir: WMS, SD, GL, HR]

42. Tannarx versiyasi (norma/narx sanali, versiyali); agar bir buyurtma uzoq muddat davom etsa va uning davomida qog'oz narxi o'zgarsa — buyurtma boshidagi narx bilan tugallansinmi yoki real sarflangan partiyaning FIFO narxi bilan; ikkisi o'rtasidagi farq GL'da og'ish (variance) sifatida ko'rinadimi? [⤳ ta'sir: PP, Ombor, GL, SD]

43. "Bo'sh stanok" (иш йук) soatlari hisobi: moliyaviy zararga ekvivalent hisoblanadi lekin GL'ga tushiriladimi yoki faqat boshqaruv hisobotida ko'rinadimi; agar GL'ga tushirilsa qaysi hisob (opportunity cost account); bu zarar direktiga kunlik holat formulasiga qanday ta'sir qiladi (DIR-001 5 ko'rsatkichdan biri)? [⤳ ta'sir: MES, PP, GL, Director]

44. Kassir oylik/avans navbatini xodim reytingiga qarab tarqatadi; lekin reyting formulasi hali belgilanmagan (OMBOR-KASSIR 12-savol — keyinga qoldirildi); to'lov tartibi reyting aniqlanmaguncha qanday ishlaydi (vaqtincha FIFO/FCFS); reyting tayyor bo'lganda tarixiy tarqatish qayta hisoblanadimi? [⤳ ta'sir: HR, Kassa, Coordination]

45. Har xodim kunlik ishlagan pulini PDF qabul qiladi; bu PDF qanday hisoblanadi — PP/MES'dagi bajarilgan ish normasi × stavkasi; agar MES sessiyasi hali yopilmagan bo'lsa (kech PDF yuborish) xodim ogohlantiriladimi; PDF generatsiya cron soat nechada ishlaydi va xatolik bo'lsa qayta yuborilsinmi? [⤳ ta'sir: MES, HR, NTF, Kassa]

46. Компания holati formulasida (DIR-001: pul oqimi + reja% + buyurtma + xodim + sifat, sozlanadigan vazn) moliya ulushi — "pul oqimi" indikatori qaysi GL ma'lumotidan real vaqtda hisoblanadi; agar kassa salbiy bo'lsa va 4-hisob bor bo'lsa (WORKING hisobi musbat) — holat formulasi qaysi hisobni "pul oqimi" sifatida qabul qiladi? [⤳ ta'sir: GL, Kassa, Director, Dashboard]

47. Soliq hisoboti: QQS faqat ichki (rasmiy fiskal yo'q, EP-FIN-055 hal); lekin BHMS COA'da QQS hisobi bor (42 ta hisob); ichki QQS reestri qanday ma'lumotlar bilan to'ldiriladi (har faktura avtomatikmi) va soliq tekshiruvida tashqi organ so'rasa nima taqdim qilinadi — bu holat hujjatlashtirilganmi? [⤳ ta'sir: SD, MM, GL, Soliq]

48. Yetkazib beruvchiga to'lov qilinadi va Счёт-фактуrada vazn farqi (kelgan gr ≠ qabul gr) da'vo sifatida aniqlanadi; da'vo summasi GL'da kredit-nota sifatida yoki "da'vo receivable" sifatida qaysi hisob raqamiga tushadi; agar yetkazib beruvchi da'voni qabul qilmasa (bahsli holat) — GL'da qancha muddat "bahsli" sifatida turadi? [⤳ ta'sir: MM, Ombor, QC, GL]

49. Oylik hisobot to'plami (kunlik kassa, haftalik FP, oylik P&L, aging) PDF eksport qilinadi; P&L (foyda va zarar) hisoboti davr yopilmasdan ham real vaqtda ko'rinadimi (opening balance + joriy period); agar davr yopilmagan bo'lsa P&L "hisoblangan" yoki "tasdiqlangan" sifatida belgilanadimi; eksport paytida "hozirgi holat" snapshot yoki qulflangan davr ma'lumotimi? [⤳ ta'sir: GL, Hisobotlar, Director, Dashboard]

50. Kassir + Kommunikatsiya Markazi 3-Savat + Kanban birlashtirilgan tizim: har so'm hisobli — xodim pul olganda Kanban vazifasi yaratiladi, ombor kirim bo'lganda vazifa yopiladi; agar Kanban vazifasi yopilmay 30 kun o'tsau xodim profilida qarz turib qolsa — cron bu holatni kuzatadimi va kimga eskalatsiya qilinadi; bu qarzni GL'da qanday aks ettirish kerak (overdue advance receivable)? [⤳ ta'sir: Kanban, Kassa, HR, GL, Coordination]
