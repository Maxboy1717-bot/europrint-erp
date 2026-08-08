# MES — MES / Ishlab chiqarish — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Operator tabletda sessiya ochganda PP dan kelgan work-order ro'yxati qanday filtrlanadi: faqat shu operatorning mashina-matritsasiga (EP-MES-054) mos buyurtmalar ko'rinadimi, yoki hammasi ko'rinib, noto'g'ri tanlov faqat ogohlantiradimi? [⤳ ta'sir: PP (work-order), ORG/KARTALAR (mashina-matritsasi), operator UI]

2. Smena A/B/C almashganda tugallanmagan sessiya qanday holat oladi: avtomatik "to'xtatilgan" statusiga tushadimi, keyingi smena operator uni davom ettira oladimi, yoki har smena yangi sessiya ochishga majburmi? [⤳ ta'sir: smena handover (EP-MES-023), OEE hisob, PP (reja-fakt)]

3. Bir operator bir vaqtda bir necha mashinada ishlayotganda (EP-MES-044) OEE qanday taqsimlanadi: har mashinaga to'liq vaqt yoziladimi, vaqt ulushi (50/50) beriladi mi, yoki birinchi mashina "asosiy", qolganlar "yordamchi" sifatida qayd qilinadi mi? [⤳ ta'sir: OEE aniqlik, karta GSD, tannarx]

4. Norma versiyasi o'zgarsa (EP-MES-056) o'sha kunda boshlab ketgan aktiv sessiyalar qaysi norma bo'yicha baholanadi: sessiya BOSHLANGAN vaqtdagi norma, yoki o'zgarish TASDIQLANGAN vaqtdagi norma? [⤳ ta'sir: OEE adolatliligi, norma versiya tarixi, PP]

5. Operator "ish yo'q" (иш йук) downtime kiritganda tizim avtomatik PP rejalashtirishga signal yuboradimi va qanday: event emi, Telegram xabari mi, yoki faqat log ga tushadi? Kimga ketadi (planlovchi, bo'lim boshlig'i)? [⤳ ta'sir: PP (reja tuzatish), NTF, org-sxema marshrut]

6. Brak kiritish (EP-HR-057) bilan downtime kiritish orasidagi chegara qanday: agar brak sababi "qolip noto'g'ri" bo'lsa, bu QC brakning sababchisi oldingi bosqichmi (COR-088 STOP trigger bo'ladimi) yoki MES downtime sifatida qayd qilinib QC ga event ketadimi? [⤳ ta'sir: QC (brak sababchi), COR (STOP gate), mas'uliyat taqsimi]

7. Smena yakuni yozma xulosa (kitob orgpolitikasi) ERP da qanday tuziladi: usta qo'lda matн yozadimi, yoki tizim AI EP-MES-079 asosida avtomatik xulosa tayyorlab, usta faqat "tasdiqlaydi/o'zgartiradi"? Tasdiqsiz smena yopiladimi? [⤳ ta'sir: AI (smena xulosa), PP, DIR (kunlik hisobot)]

8. TB (xavfsizlik texnikasi) chek-listi (EP-HR-079/COR-130) sessiya ochishdan OLDIN to'liq to'ldirilmasa nima bo'ladi: sessiya mutlaqo bloklanadimi, yoki ogohlantirish bilan o'tilib ketadimi? Blok bo'lsa kimdan ruxsat olinadi? [⤳ ta'sir: HR (TB), COR (smena chek-list), operator UI]

9. Matsina sostoniya 30 daqiqa to'xtaganda (EP-MES-018) eskalatsiya directorgacha yetgach, direktor "sabab tushunildi, ishlashini kut" deb bildirishnoma yuborsa — tizim eskalatsiyani to'xtatib qo'yadimi, yoki har 15 daqiqada yana signal ketaveradimi? [⤳ ta'sir: NTF, org-sxema, SOS lifecycle]

10. Texkarta adherence chek-listida (EP-MES-030) operator biror bosqichni "bajarilmadi" deb belgilasa, texnologga signal ketadi — lekin operator "bajarilmadi" sababi uchun QANDAY kategoriya tanlaydi (material/qolip/asbob/boshqa)? Bu categoriya QC ga ham uzatiladimi? [⤳ ta'sir: QC, PP (texkarta), org-sxema (texnolog eskalatsiya)]

11. Material sarf norma bo'yicha avto-hisoblangach (EP-MES-006) operator TASDIQLASHDAN OLDIN sarf miqdorini o'zgartirib qo'ya oladimi? O'zgartirilsa sabab yozdiriladimi? Bu og'ish WMS ga real-time uzatiladimi yokI faqat smena yakunida? [⤳ ta'sir: WMS (zaxira), FIN/GL (tannarx), nazorat]

12. Lot/partiya kuzatuvi (EP-MES-029) da bir sessiyada bir necha xil partiya ishlatilsa (misol: qog'oz A-partiya 60%, B-partiya 40%) — tizim bu aralashni qanday saqlaydi: har partiyaga alohida satr, yoki asosiy partiya belgilanib qolganlar "boshqa" sifatida yoziladimi? [⤳ ta'sir: WMS (FIFO/FEFO), QC (traceability), tannarx]

13. Yelim (kraxmal/soda) sarf-normasidan ortiqcha sarf chiqsa (EP-FIN-044) tizim darhol WMS dan avto-chegirma qilib GL ga yozadimi, yoki smena yakunida jamlab bir marta yoziladimi? Real-time va batch orasidagi farq GL audit-log da ko'rinadimi? [⤳ ta'sir: FIN/GL, WMS (yelim qoldiq), tannarx aniqlik]

14. Ustoz-shogird rejimida (EP-MES-053) shogirdning sessiyasi "ustoz nazoratida" bo'lsa — shogird braki ustoz kartasiga ta'sir qiladimi? Agar ustoz o'sha sessiyada boshqa mashinada ham ishlayotgan bo'lsa (EP-MES-044), brak qaysi kartaga yoziladi? [⤳ ta'sir: ORG/KARTALAR (GSD), HR (mentorlik reyting), razryad]

15. Mustaqil ishlash ruxsati (EP-MES-052) sessiya ochish paytida tekshiriladimi (real-time RBAC), yoki faqat onboarding da bir marta kiritilgan flag saqlanib qoladi? Ruxsat eskirgan bo'lsa (attestatsiya muddati o'tgan) tizim sessiyani bloklaydimi? [⤳ ta'sir: HR (attestatsiya), RBAC, operator UI]

16. OEE hisoblashda sof ish vaqti (EP-MES-049) kunlik SMENA TAQVIMIDAN (namoz/tushlik/tanaffus) avtomatik chegirilsa — lekin operatorning namoz tanaffusini boshqasi (yordamchi) qoplab tursa, qo'shimcha vaqt "rejali to'xtash" sifatida emas, ishchi-vaqt sifatida sanaladimi? [⤳ ta'sir: OEE aniqlik, HR davomat, smena-jadval]

17. Smena reja-formasi avto-tuzilgach (EP-MES-063) planlovchi uni o'zgartirib qayta tasdiqlaydi — lekin ushbu o'zgartirish allaqachon boshlanib ketgan sessiyaga ta'sir qiladimi? Ya'ni, yangi miqdor/vaqt joriy sessiyaga retro-kiritilishi mumkinmi? [⤳ ta'sir: PP (reja), reja-fakt to'g'riligi, audit-log]

18. Sessiya "3 bosqich" (EP-MES-001) da sozlash bosqichi tugaganda asosiy bosqichga o'tish operatordanmi yoki OEE/vaqt algoritmidanmi? Agar sozlash kutilgandan 2 barobar uzoq davom etsa, sistem real-time signal yuboradimi? [⤳ ta'sir: OEE Availability, NTF, changeover tahlil]

19. Bir mashina ikki bo'limda ishlayotganda (EP-MES-042, Flekso/Upakovka) va bitta buyurtma ikkala bo'lim bosqichidan o'tsa — GSD hissi qaysi bo'limga yoziladi: har bosqich o'z bo'limiga, yoki yakuniy bosqich to'liq GSD oladi? [⤳ ta'sir: ORG/KARTALAR (bo'lim GSD), OEE bo'lim darajasi]

20. Bottleneck ko'rsatganda (EP-MES-070) yarim tayyor qoldiq soni bir bosqichda limitdan oshib ketsa — PP ga avto-signal va AI navbat tartibini qayta hisoblash taklifi keladimi, yoki faqat vizual ko'rsatiladi? [⤳ ta'sir: PP (AI-rejalashtirish), COR (ichki logistika), WMS]

21. Shoshilinch buyurtma (EP-MES-068) navbatda oldinga chiqarilganda, oldingi buyurtmaning yarmi bajarilib tursa — tizim joriy sessiyani to'xtatib shoshilinchga o'tishni tavsiya qiladimi yoki majburlaydimi? Yarim bajarilgan ish qaysi statusda qoladi? [⤳ ta'sir: PP (split EP-PP-063), SD (mijoz muddati), OEE]

22. Norma bajarilmasa majburiy sabab so'ralganda (EP-MES-077) operator "sabab = material" deb tanlasa — bu WMS da o'sha partiya/qoldiq uchun avtomatik "muammo bayrog'i" qo'yiladimi va MM ta'minot bo'limiga signal ketadimi? [⤳ ta'sir: WMS, MM, root-cause zanjiri]

23. Brigada smena boshida (EP-MES-005) tarkib tasdiqlangach — smena o'rtasida xodim kasallansa, brigadir yangi xodim qo'shishi yoki almashtirishi mumkinmi? Bu o'zgarish davomat (HR) va GSD hissasiga retro ta'sir qiladimi? [⤳ ta'sir: HR (davomat), ORG/KARTALAR (GSD taqsim), smena handover]

24. Qog'oz formati va gramm sessiyaga yozilganda (EP-MES-066) — bu ma'lumot WMS dagi partiya parametrlari bilan taqqoslanadimi (masalan, WMS da 90g deb yozilgan, lekin haqiqatda 85g kelsa)? Og'ish aniqlansa kimga signal ketadi? [⤳ ta'sir: WMS (rulon parametr), QC, MM (yetkazuvchi sifat)]

25. "Переделка" (qayta ishlash, EP-MES-046) qayd qilinganda — qayta ishlangan mahsulot soni "brak" sifatida emas, "to'g'rilangan sof mahsulot" sifatida hisoblanadimi? GL da qayta ishlash narxi (qo'shimcha mehnat + material) alohida tannarx moddasiga yoziladimi? [⤳ ta'sir: FIN/GL (tannarx), QC, OEE Quality]

26. Tigel presslar (EP-MES-040) 1-10 har biri alohida birlik bo'lsa — PP rejalovchi "Tigel-3" deb konkret bergan buyurtmani Tigel-5 da bajarish mumkinmi? Almashtirishga kim ruxsat beradi, va bu ruxsat texkarta (EP-MES-007) bilan tekshiriladimi? [⤳ ta'sir: PP (CRP/mashina-yuklash), texkarta, ORG (lavozim vakolat)]

27. AI kunlik smena xulosasi (EP-MES-079) tuzilganda — xulosa faqat o'sha smenaning joriy ma'lumotlaridan tuziladi, yoki oxirgi 7 kun trendi ham kiritiladi? Xulosa direktorga, bo'lim boshlig'iga va smenaboshchiga AYNI bir xil tilda/hajmda ketadimi yoki darajaga qarab moslashtirilganmi? [⤳ ta'sir: DIR, AI, NTF (org-marshrut)]

28. Energiya sarfini stanok quvvati × ish soati formulasi bilan tannarxga taqsimlashda (EP-FIN-051) — IoT sensor o'rnatilmagan mashinalar uchun bu hisob qanday yuklanadi: sex umumiy schyotchikdan proportsional taqsimlash, yoki stanok turidagi texnik pasportdagi quvvatdan? [⤳ ta'sir: FIN/GL (tannarx), IoT, OEE]

29. Smena baholash bali (EP-MES-026) "vaznli" hisoblanganda — OEE/reja-fakt/brak/sarf vazni kim tomonidan sozlanadi va qachon kuchga kiradi? Yaqinda o'tgan smenalar qayta hisoblanadimi agar vazn o'zgartiriladimi? [⤳ ta'sur: ORG/KARTALAR (GSD), bonus/payroll, HR]

30. MES bonus taklifi A/B/C ga ajralganda (EP-MES-027) HR tasdiqlash ekranida bonus miqdori qanday hisoblanadi: % lik stavka kartadagi bazaga qo'shiladi, yoki A toifaga = X so'm belgilangan summami? Bir brigada ichida A va C toifali operatorlar bo'lsa, har biriga alohida taklif chiqadimi? [⤳ ta'sir: FIN/Payroll, HR, ORG/KARTALAR]

31. Handover (EP-MES-023) da keyingi smena tasdiqlashni "qabul qilmagan" deb rad etsa (masalan, tugallanmagan ish holati noto'g'ri yozilgan) — tizim qanday jarayon boshlatadi: arbitr (smena boshlig'i), avto-eskalatsiya, yoki ikkala smena raqam ruxsat berilmaguncha smenani rasman yopib bo'lmaydi? [⤳ ta'sir: PP (javobgarlik), COR, HR (smena boshlig'i roli)]

32. Buyurtma kodi formati (EP-MES-057: 2025-3499/KT4438/papka) sessiyada yozilganda — bu SD dagi buyurtma ID bilan avtomatik FK orqali bog'lanadi mi, yoki opertor qo'lda raqam terayapti va noto'g'ri terish mumkinmi? Xato kod kiritilsa darhol ogohlantirish beradimi? [⤳ ta'sir: SD (buyurtma), PP (papka №), traceability]

33. "O'quv/Akademiya" ishi (EP-MES-058) qayd qilinganda — bu operator kartasining LMS moduli bilan sinxronizatsiya qilinadimi? Ya'ni LMS da "o'quv bajarildi" deb hisoblanadimi, va real ishlab chiqarish normasidan alohida OEE hisobga olinadimi? [⤳ ta'sir: LMS (darslik-karta), ORG (GSD), tannarx tozaligi]

34. Gofra liniyasi м2 + qatlam soni (EP-MES-059) alohida saqlananda — 5-qatlam o'rniga 3-qatlam kelib qolgan holat (kitob misoli: logistika xatosi) MES da qanday aniqlanadi: operator qo'lda belgilaydimi, yoki WMS dagi kirim parametri (Заявка бумаги) bilan avtomatik taqqos bo'ladimi? [⤳ ta'sir: WMS (partiya/qatlam), QC (sifat nazorat), MM (yetkazuvchi)]

35. НО 12-1/12-2 mas'uli (EP-MES-081) smena hisobotini ko'rganda — u faqat o'z bo'limi (Ofset/Flekso) ma'lumotlarini ko'radimi, yoki ikkala bo'limni ko'rish imkoni bo'ladimi? Mas'ulni o'zgartirish (kadrlar rotatsiyasi) hisobotlarning egasini retro o'zgartiradi mi? [⤳ ta'sir: ORG/KARTALAR (НО lavozim), RBAC, hisobot egasi]

36. OEE maqsad (EP-MES-015) har mashinaga sozlanganda — maqsad qiymatini kim o'zgartirishi mumkin (faqat direktor, НО-mas'ul, yoki har qanday usta)? O'zgarish versiyalanib saqlanadimi? Avvalgi smenalar yangi maqsadga qarshi qayta baholanadimi? [⤳ ta'sir: DIR (nazorat), ORG (RBAC), tarix to'g'riligi]

37. Mashina remont holati (EP-MES-078) "avariya remont" sifatida qayd qilinganda — tizim avtomatik texnik xizmat (PM jadval, IoT EP-IOT-016) ga bug report yoki vazifa (Kanban) ochadi mi? Bu Kanban vazifasi texnikga avtomatik biriktiriladi mi yoki faqat eslatma? [⤳ ta'sir: IoT (PM jadval), Kanban (vazifa), aktiv boshqaruv]

38. Operator IoT-tabletda oflayn rejimda (A5: to'liq offline) ishlayotgan paytda kiritilgan brak/downtime/sarf — internet qaytganda server bilan sinxronizatsiya bo'lganda qanday konflikt hal qilinadi: timestamp bo'yicha ketma-ket kiritiladi, yoki parallel kiritilgan ikki operatsiya (masalan, ikki smena bitta partiyaga tekkanda) for review navbatiga tushadi? [⤳ ta'sir: WMS (sarf), QC, audit-log (7 yil)]

39. Smena reja-formasi PDF bosib chiqarilganda (EP-MES-063 + kitob "smena boshida bosib chiqariladi") — bu PDF ERP da versiyalanib saqlanadimi? Agar smena o'rtasida reja o'zgarsa, yangi PDF qayta chop qilinishi va eski versiya arxivlanadimi? [⤳ ta'sir: PP, audit-log, hujjat immutability (F5)]

40. Reja-fakt taqqosida (EP-MES-025) "fakt < reja, sabab = material kechikishi" deb kiritilsa — bu sabab PP ning "muzlatilgan zona" (EP-PP-025, ~3 kun) dan kelgan buyurtmaga tegishlimi yoki boshqa? Agar muzlatilgan zonadan kelsa, kim ochgan: faqat egasi/direktor? [⤳ ta'sir: PP (muzlatilgan zona, EP-PP-025), DIR, COR (sabab audit)]

41. Sessiya tugagandan keyin "umumiy son / brak soni / sof mahsulot" uchligida (EP-MES-060) sof mahsulot QC moduiga avto o'tkaziladi mi (final inspection gate, EP-QC-008) yoki QC o'zi sessiya yakunini polling qilib oladi? Trigger kim — MES event emi QC cron emi? [⤳ ta'sir: QC (final gate), event architecture, BullMQ]

42. Buyurtma marshruti (EP-MES-069) da bir bosqich tugab keyingiga o'tilganda — keyingi mashina operatori tabletida yangi ish o'zi paydo bo'ladimi (push notification), yoki operator navbat ro'yxatini qo'lda yangilashi kerakmi? PP rejalovchi qayta tasdiqlashi shart emasmi? [⤳ ta'sir: PP (CRP navbat), NTF, operator UI (operator-rol guard)]

43. Kanonik sessiya jadvali (IOT-MES-CURRENT-STATE GAP: `production_sessions` vs `mes_sessions`) muammosi hal qilinganda — eski `mes_sessions` jadvalidagi tarixiy ma'lumotlar `production_sessions` ga migratsiya qilinadimi yoki VIEW orqali qoplanaydimi? Migratsiya paytida OEE hisobotlari buzilmasin uchun qanday kafolat? [⤳ ta'sir: DB yagona haqiqat (E6/H2), hisobot to'g'riligi, migration]

44. Razryad matritsasi (EP-MES-054) yangilanib operator yangi mashinaga ruxsat olsa — bu ruxsat darhol kuchga kiradimi, yoki navbatdagi HR attestatsiya sikli (EP-ORG-092) dan keyin? Joriy aktiv sessiyaga ta'sir qiladimi? [⤳ ta'sir: HR (attestatsiya), RBAC real-time, ORG (razryad)]

45. AI kamera downtime tasdig'i (EP-HR-082/global printsip E1) da: kamera mashina 20 daqiqa to'xtaganini aniqladi, lekin operator downtime kiritishni unutdi — AI bu nomoslikni (kamera ko'rgani vs MES kiritilgan) qanday aniqlaydi va kimga signal yuboradi? Inson tasdig'i kelguncha OEE hisoblashda o'sha 20 daqiqa qanday sanaladi? [⤳ ta'sir: AI (kamera kross-check), HR (EP-HR-082), OEE real-time]

46. Smenaboshchi "smena yopiq" deb tasdiqlashi kerak bo'lganda — agar handover keyingi smena tomonidan hali QABUL qilinmagan bo'lsa, smena rasman "yopiq" hisoblanadimi? Payroll hisoblash smena "yopiq" statusga bog'liq emasmi? [⤳ ta'sir: HR (davomat/payroll), PP (reja-fakt yakuniy), audit-log]

47. PP ga kirib kelgan buyurtmada "to'plam gate" (EP-PP-105) sharti bor: barcha qismlar tugamaguncha qadoq yo'q — lekin MES smena bajarilishi hisobotida faqat o'z bosqich sof mahsuloti ko'rinadi. To'plam tayyor emasligini MES operatoriga qanday ko'rsatadi: traffic light indikatori, bloklash, yoki faqat PP tarafida? [⤳ ta'sir: PP (gate), QC, WMS (tayyor mahsulot)]

48. Smena yozma xulosa (kitob orgpolitikasi) da "bajarilmagan reja sababi 6 toifadan biri" tanlash majburiy — lekin elektron tizimda usta bir smenada bir necha buyurtma uchun bir necha sabab tanlaydi. Bu sabab-statistika haftalik/oylik tahlilda kimga ko'rinadi (faqat НО-mas'ulga, yoki PP, DIR ham ko'ra oladimi)? [⤳ ta'sir: DIR (root-cause), PP (reja tahlil), ORG (RBAC darajali ko'rinish)]

49. Material topshirish akti (EP-POS-050, 2 imzo) MES sessiyasiga qo'shimcha bog'liq bo'lishi kerak bo'lsa: usta ombor materialini smena boshida oladi — akt imzosiz (yoki imzolashni vaqti kelganida faqat 1 imzo qolsa) material WMS dan chiqib MES sessiyasiga kiradi mi yoki bloklanadimi? [⤳ ta'sir: WMS, POS Monitor (akt), tannarx zanjiri]

50. MES natijasi karta GSD ga yozilganda (EP-MES-019) — smena bali (EP-MES-026) qachon "yakuniy" bo'lib qoladi: smena yopilgandami, handover tasdiqlangandami, yoki НО-mas'ul smena hisobotini ko'rganidanmi? Yakuniy bo'lgandan keyin ushbu balni o'zgartirish faqat kim tomonidan va qanday tartibda amalga oshirilishi mumkin? [⤳ ta'sir: ORG/KARTALAR (GSD yakuniy), HR (bonus/payroll), audit-log immutable]
