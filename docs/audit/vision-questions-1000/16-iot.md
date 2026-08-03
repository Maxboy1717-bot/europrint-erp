# IOT — IoT / Sensor + AI-kamera — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Operator IoT-tabletdan brak sababini tanlaganda, shu brak avtomatik tarzda MES'dagi joriy buyurtma (Папка №) va smena yozuviga bog'lanishi kerak — agar operator tabletda hali sessiya ochiq bo'lmasa yoki mashina holati "o'chiq" tursa, tizim qanday harakat qiladi: brak kiritish bloklanadimi yoki alohida "sababsiz brak" toifasiga yoziladimi? [⤳ ta'sir: MES, QC, HR]

2. AI kamera xona inspeksiyasi natijasida ball hisoblanganda (har 2 soatda, Q97/Q98), rasm sifati past bo'lgan holat (tuman, yoritish muammosi, kamera qopqoq bilan yopilgan) uchun tizim qanday harakat qiladi: "ma'lumot yo'q" sifatida o'tadimi yoki "tekshirilmagan" alohida toifasi ochiladi va kim xabardor bo'ladi? [⤳ ta'sir: HR inspeksiya, xavfsizlik]

3. Smena topshirish (A→B) paytida mashinada hali tugamagan buyurtma (НЗП) bo'lsa va yangi smena operatori tablet orqali "qabul qilmasa" (masalan, kechikkan kelsa), 15 daqiqadan ortiq muddatda topshirilmagan smena uchun qanday avtomatik eskalatsiya zanjiri ishga tushadi va kim mas'ul deb belgilanadi? [⤳ ta'sir: MES, HR, CC]

4. Sensor rollout reja bo'yicha HAMMA mashinaga bir vaqtda o'rnatilgandan so'ng, bitta mashina sensori birinchi haftada noto'g'ri o'qiydi (kalibratsiya xatosi) — bu mashina uchun OEE/GSD hisoblangan ko'rsatkichlarni qanday retrospektiv tarzda to'g'irlash mexanizmi bo'ladi, va to'g'irlash faqat egasi ruxsati bilanmi? [⤳ ta'sir: HR oylik, ShVB GSD, audit]

5. Mashina uptime sensori va MES'dagi operator tomonidan kiritilgan "ishlayapti" holati bir-biriga zid bo'lsa (sensor "to'xtagan" deydi, operator "ishlayapti" deydi) — bu ziddiyat qanday aniqlanadi, qaysi ma'lumot ustunligi oladi, va bu holat kim tomonidan qo'lda hal qilinadi? [⤳ ta'sir: MES, OEE, audit]

6. Tigel mashinasida udar soni chegaraga yetib qolip almashtirish eslatmasi kelganda, lekin joriy buyurtma (Папка №) yarim tugallangan holda bo'lsa, tizim joriy buyurtmani to'xtatib qolip almashtirish buyrug'ini berish yoki buyurtmani birinchi tugatib keyin almashtirish haqida qaror qabul qilish algoritmini qanday ishlaydi? [⤳ ta'sir: MES, PP, texnik xizmat]

7. Tungi smena (C) uchun anomaliya/idle chegarasi pasaytirilib masofadan Telegram orqali xabar ketadi — bu bildirishnomalarda qaysi karta-darajadagi xodimlar (smena boshlig'i, sex boshlig'i, direktor) qaysi holat turlariga qaysi muddat ichida xabardor bo'lishi kerakligining aniq eskalatsiya matritsa-sxemasi qanday ko'rinadi? [⤳ ta'sir: CC, NTF, HR]

8. Mashina boshlashdan oldin tayyorlik cheklisti (TPM: yog'/tozalik/qolip/material) operator tomonidan IoT tabletda to'ldirilmasa, tizim mashinani bloklashi kerak — bu blok faqat dasturiy (MES sessiyasi ochilmaydi) yoki texnik-jismoniy (mashina starteri bloklanadi) bo'ladimi, va bloklangan paytda kim ruxsat berishi mumkin? [⤳ ta'sir: MES, xavfsizlik, PP]

9. Gofra liniyasida ishlab chiqarilgan m² va sarflangan karton m² o'rtasidagi farq (yo'qotish yoki isrof) real vaqtda hisoblanganda, qaysi chegara (masalan, 3% dan ortiq) avtomatik ogohlantirish chiqaradi, va bu ogohlantirishga javoban ombordagi material hisobi avtomatik "tekshirish kutilmoqda" holatiga o'tadimi? [⤳ ta'sir: WMS, Moliya, QC]

10. Operator "иш йук" holatini tabletdan tanlaganda, tizim shu vaqt oralig'ida muqobil ish (арчиш/паддон) bajaryapti yoki haqiqatdan bo'sh turibdi degan farqni qanday aniqlaydi — operator tanloviga ishonib yozadimi yoki AI kamera bu davrda operatorniig harakatini ham kuzatib tasdiqlaydi? [⤳ ta'sir: HR oylik, ShVB, AI kamera]

11. AI kamera himoya vositasi (qo'lqop/ko'zoynak) yo'qligini aniqlasa, salbiy ta'sir faqat inson tasdig'i bilan bo'lishi kerak (global printsip) — lekin kamera aniqlagan "himoyasiz" hodisa real vaqtda xavfli bo'lsa (masalan, tigel/vissechka yonida), to'xtatish uchun avto signal tarqatishning aniq oqimi qanday: avval odam tasdig'i kutilsinmi yoki avval signal berlib keyin tasdiq? [⤳ ta'sir: xavfsizlik, HR, MES]

12. Sensor signal yo'q bo'lganda "aloqa yo'q" holati qayd etiladi va uptime/downtime ikkalasiga ham qo'shilmaydi — bu "aloqa yo'q" davr OEE hisoblashda maxraj (denominator)ga kiradimi yoki butunlay chiqarib tashlanadimi, va bu qoida audit maqsadida qaerga yozib qo'yiladi? [⤳ ta'sir: OEE, audit, ShVB]

13. Brak % chegaradan oshganda smena boshlig'iga darhol signal ketadi — agar smena boshlig'i o'sha paytda boshqa qurilmada yoki offline bo'lsa, necha daqiqadan keyin keyingi daraja (sex boshlig'i) avtomatik xabardor bo'ladi, va bu eskalatsiya logi qaerda saqlanadi? [⤳ ta'sir: QC, NTF, CC eskalatsiya]

14. Mashina kartasida norma (норма штук 1 час) РД4 + Direktor tasdig'idan o'tishi kerak — norma o'zgartirish so'rovi kiritilgandan tasdiqlangungacha bo'lgan oraliqda tizimda QAYSI norma qo'llaniladi (eski yoki yangi), va bu oraliq OEE/GSD hisoblashga qanday ta'sir qiladi? [⤳ ta'sir: HR oylik, OEE, audit]

15. Kaschировka mashinalari (avto/yarim-avto/qo'l) samaradorligini taqqoslaydigan hisobot tuzilganda, ish turlari bo'yicha solishtirishni buzadigan faktor — qo'l kashi jarayonida operator vaqtini qanday o'lchaymiz (tabletdan vaqt kirituvimi yoki sensor/AI kamera)? [⤳ ta'sir: PP/CRP, Moliya CAPEX, HR]

16. Ofset mashinasida rang/seksiya soni texnik kartadan (PP) keladi va IoT undan o'qiydi — PP texnik karta o'rtada o'zgartirilsa (masalan, mijoz rang qo'shdi), IoT dagi rang soni qachon yangilanadi (darhol sinkronmi yoki faqat keyingi sessiya boshida), va o'rtadagi tafovut brak holatiga olib keladigan ekan uning mas'uli kim? [⤳ ta'sir: PP, SD, QC]

17. Электр hisoblagich (счётчик) sex darajasida bo'lsa (mashina darajasida emas), energiya xarajatini mashina/buyurtma bo'yicha taqsimlash uchun qaysi koeffitsient ishlatiladi (mashina quvvati × ish soati) va bu koeffitsient qayerda sozlanadi, kim o'zgartirishi mumkin? [⤳ ta'sir: Moliya tannarx, Finance/GL]

18. Kompressor bosimi tushib bir necha mashina birdan sekinlashsa, IoT tizimi bu hodisani qanday aniqlaydi — har mashina alohida ogohlantirish beradimi yoki kompressor sensoridan bitta umumiy "kompressor muammosi" hodisasi yaratib, barcha bog'liq mashinalar avtomatik "tashqi sabab" downtime holatiga o'tadimi? [⤳ ta'sir: texnik xizmat, OEE, MES]

19. Qolip (штамп) udar resursini kuzatib almashtirish eslatmasi berilganda, lekin omborda zaxira qolip mavjud bo'lmasa, tizim avtomatik ombor harid so'rovini (PR) yaratadimi, qanday muddat ko'rsatkichi bilan, va harid so'rovi kimning nomidan kelib chiqadi (texnik xizmat kartasidan yoki mashina kartasidan)? [⤳ ta'sir: WMS, MM, texnik xizmat]

20. Mashina OEE ko'rsatkichi operator KPI/oyligiga bog'langanda, "иш йук" (material/reja kamchiligi) va sensor xatosi/aloqa yo'q davri chiqarib tashlanishi kerak — bu chiqarib tashlash avtomatik (sistem qoidasiga ko'ra) yoki har davr uchun HR/RD qo'lda tasdiqlash bilan bo'ladimi, va tasdiqlashsiz o'tib ketsa qanday jurnal yozuvi qoladi? [⤳ ta'sir: HR oylik, audit, ShVB]

21. Andon tablo (katta sex ekrani) real vaqtda barcha mashinalar holatini ko'rsatadi — agar backend yoki tarmoq uzilsa, ekran oxirgi ma'lumotni ko'rsatib turadimi (stale) yoki "ma'lumot yo'q" holatini ko'rsatadimi, va operatorlar bu farqni qanday bilishadi? [⤳ ta'sir: MES, infratuzilma ishonchlilik]

22. AI kamera har 2 soatda xona taqqoslov inspeksiyasini bajaradi — kamera yoqilmasdan oldin "ideal holat" rasmi qanday o'rnatiladi (kim yuklaydi, qanday formatlarda), va ideal rasm eskirganda (masalan, xona jihozi o'zgarganda) uni yangilash jarayoni qanday boshqariladi? [⤳ ta'sir: HR inspeksiya, karta-model]

23. Operator "переделка" (qayta urish) brak sababini tanlaganda, bu partiyaning material sarfini (qog'oz/bo'yoq) MES hisobiga qo'shish va ombor qoldiq hisobini kamaytirish avtomatik bo'ladimi, va "qayta urish" uchun sarflangan qo'shimcha material alohida buyurtma tannarxiga yoki umumiy isrof hisobiga yoziladimi? [⤳ ta'sir: WMS, Moliya/GL, MES]

24. Majlis xonasidagi AI kamera dokladni avto-tuzadi (COR-046) — bu AI kamera ham IoT moduli doirasida boshqariladimi yoki Coordination moduli doirasida, va kamera arxiv logi (ovoz/transkripsiya) qancha muddat saqlanadi, kim kirishi mumkin? [⤳ ta'sir: Coordination, CC, arxiv]

25. MES'dagi "3 bosqich" sessiyasida (sozlash→asosiy→yakunlash) har bosqichning vaqti IoT tabletdan kiritiladi — operator soshlash bosqichini "tugadi" deb belgilamay "asosiy"ga o'tib qo'ysa, bu holat qanday aniqlanadi va bosqich vaqti retrospektiv to'g'irlanishi mumkinmi? [⤳ ta'sir: MES OEE, audit, HR]

26. Mashina texnik xizmat tarixi qog'ozdan IoT'ga ko'chirilayotganda (EP-IOT-072), tarixiy ma'lumotni import qilish uchun qanday format (Excel shablon yoki maxsus forma) ishlatiladi, import paytida ko'rilgan xatoliklar (sana/mashina nomi to'g'ri kelmasa) qanday boshqariladi, va import kim tomonidan tasdiqlash talab qiladimi? [⤳ ta'sir: texnik xizmat, audit, WMS]

27. Energiya sarfi tannarxga avtomatik qo'shilganda (mashina quvvati × ish soati → GL), lekin mashina shu kuni bir nechta buyurtmaga ishlagan bo'lsa, energiya bir nechta buyurtmaga qanday taqsimlanadi — teng taqsimmi, ish soatiga proportsionelmi, yoki buyurtma turi va tirajiga qarab boshqa usulmi? [⤳ ta'sir: Moliya/GL tannarx, MES, PP]

28. Xavfli zonaga ruxsatsiz kirish aniqlanganda AI kamera darhol ogohlantiradi — agar bu hodisa tungi smenada sodir bo'lib, mas'ul smena boshlig'i Telegram'ga javob bermasa, eskalatsiya zanjirida keyingi inson (sex boshlig'i) necha daqiqada xabardor bo'ladi va hodisa o'z-o'zidan yopilishi mumkinmi yoki kim yopishi kerak? [⤳ ta'sir: xavfsizlik, NTF, HR]

29. Смена KPI hisoblanganda bir operatorda bir smenada bir nechta mashina bo'lsa (masalan, eski mashina to'xtab yangi mashinaga o'tkazilgan), uning umumiy OEE/GSD qanday hisoblandi: og'irlik soatga proportsionelmi yoki faqat asosiy tayinlangan mashinaga asoslanadimi? [⤳ ta'sir: HR oylik, ShVB, karta-model]

30. Sensor ma'lumotlari 3-6 oy saqlansa, keyin "kunlik o'rtacha"ga siqilsa — trend tahlili (masalan, OEE oldingi yilning shu davriga nisbatan) va audit maqsadida tarixiy ma'lumot kerak bo'lib qolsa, siqilgan ma'lumotdan qaysi ko'rsatkichlar tiklab bo'linmaydi va bu cheklov hujjatlarda ko'rsatilganmi? [⤳ ta'sir: Director, audit, Finance]

31. Operator IoT tabletda TB xavfsizlik cheklistini (HR-079) "tasdiqladi" deb belgilab qo'ysa, lekin AI kamera shu paytda operatorda himoya vositasi yo'qligini aniqlamasa — ikki tizim o'rtasidagi bu ziddiyat (cheklistda "ha", kamerada "yo'q") qanday qayd etiladi, va noto'g'ri tasdiqlash uchun mas'uliyat qanday boshlanadi? [⤳ ta'sir: xavfsizlik, HR, audit]

32. Mashina ON/OFF avtomatik qayd etilganda va smena boshlanish vaqti bilan qiyoslanayotganda, qonuniy kechikishlar (masalan, avvalgi smenada ta'mir tugamadi, menejer ruxsati bilan kech boshlandi) qanday hisobga olinadi va bu "qonuniy kechikish" belgisi kim tomonidan qo'yiladi? [⤳ ta'sir: HR intizom, MES, audit]

33. ФСМ tiqilish (зажор) soni kuzatilganda, tiqilish ogohlantirish chegarasi karton namligi yoki mashina sozlamasiga qarab dinamik o'zgarishi kerakmi (masalan, qishda namsiz karton uchun past chegara, yozda yuqori chegara), va bu chegarani kim sozlaydi — texnolog kartasinami yoki tizim sozlamalaridami? [⤳ ta'sir: QC, WMS karton, texnik xizmat]

34. Plastina (CTP/qolip) tayyorligi holati mashina navbatida (Andon) ko'rinadi — lekin plastina preprint bo'limida tayyor bo'lmasa, tizim avtomatik PP rejalashtirishga ta'sir qilib navbatni qayta tartiblaydimi, yoki faqat ogohlantirib qo'yib qaror inson qo'lida qoladimi? [⤳ ta'sir: PP, Dizayn, MES]

35. Makulatura (бракланган material qayta ishlatish) IoT yozuviga qo'shilganda, bu material ombor balansida qanday toifada qayd etiladi — "chiqim" sifatida darhol yoziladimi yoki "qayta ishlov kutilmoqda" holatida omborda qoladimi, va qaysi muddat ichida qayta ishlov bo'lmasa moliya zarar sifatida yoziladimi? [⤳ ta'sir: WMS, Moliya/GL, QC]

36. IoT tabletda operator "muqobil ish" (арчиш/паддон) bajarmoqda deb belgilaganda, bu vaqt HR tabel hisobida "normal ish vaqti" sifatida ko'rinadimi yoki alohida "muqobil ish" kodi bilan va oylik hisoblashda bu ikki tur vaqt uchun bir xil tarif ishlatiladi yoki turlicha? [⤳ ta'sir: HR oylik, ShVB, Finance]

37. Kamera-AI davomat kuzatuvida (Q88/Q108) xodim xududga kirdi lekin ish joyiga vaqtida kelmadi degan holat aniqlananda, tizim bu farqni (xudud-kirish ↔ ish-joyiga kelish vaqti) avtomatik hujjatlaydimi yoki faqat HR ga signal ketadimi, va bu hujjat xodim tomonidan ko'rilishi mumkinmi? [⤳ ta'sir: HR davomat, audit, karta-model]

38. Mashina samaradorligi GSD ShVB'ga avtomatik o'tkazilganda, SmVB ishlab chiqarish bo'limi uchun bir nechta mashinalar ЦКП'sini yig'ib ko'rsatishi kerak — bo'lim darajasida yig'ish og'irliklari (har mashina ЦКП'si bo'lim ЦКП'iga qancha hissa qo'shadi) qanday belgilanadi va kim o'zgartirishi mumkin? [⤳ ta'sir: ShVB, karta-model, Director]

39. UV/lak yoki plyonka sarfi norma vs haqiqiy taqqoslaganda, bir ish (Папка №) doirasida sarflangan haqiqiy miqdor qanday o'lchanadi — operator tabletdan kiritadimi (kg/m da), sensor o'lchaydimi, yoki hisoblash formulasi qo'llaniladi (varaq hajmi × normativ sarf)? [⤳ ta'sir: WMS, Moliya tannarx, MES]

40. Operator KPI'si adolatli hisoblash uchun "material/qolip kutish" vaqti chiqarib tashlanishi kerak — lekin operator o'zi material so'rovini kech bergan bo'lsa (o'z aybi), bu holat tizim tomonidan qanday aniqlanadi va "operatorga bog'liq kutish" bilan "operatorga bog'liq bo'lmagan kutish" farqini kim tasdiqlaydi? [⤳ ta'sir: HR oylik, PP, MES]

41. Bosma mashinalarda ranglar seksiya soni (4+0, 4+4) va bosma hajmiga qarab bo'yoq sarfi normativi belgilangan — bir buyurtma doirasida ranglar o'rtada o'zgariб (mijoz so'roviga ko'ra) bo'yoq sarfi ortsa, bu qo'shimcha sarfni kim tasdiqlaydi (texnolog/RD) va ombor avtomatik qo'shimcha bo'yoq zahirasini tekshiradimi? [⤳ ta'sir: WMS, SD, PP]

42. Okoshka (deraza yelimlash) alohida operatsiya sifatida kuzatilganda, operatsiyaning "tugadi" holati qanday aniqlanadi — operator tabletdan belgilaydimi, yoki keyingi operatsiya (masalan, Степлер) boshlanganda avtomatik oldingi yopiladi, va ular orasidagi kutish vaqti qanday saqlanadi? [⤳ ta'sir: MES zanjir, PP, OEE]

43. Bir mashina smenasida bir nechta buyurtma (Папка №) bajarilganda va brak bir buyurtma materialidan kelib, keyingi buyurtmaga o'tilgandan keyin aniqlanganida, brak qaysi buyurtmaga, qaysi smenaga va qaysi mashinaning hisob-kitobiga kiritiladi — vaqt va operator bog'lanishi hal qiluvchi mezonmi? [⤳ ta'sir: QC, MES, HR oylik]

44. Sensor kalibrovka muddati o'tib ogohlantirish kelganda va sensor kalibrlanmagan holda ishlashda davom etsa, shu davrda olingan barcha OEE va GSD ma'lumotlari qanday belgilanadi ("ishonchsiz"?), va bu belgilash ishlab chiqarilgan hisob-kitoblar (oylik, KPI) ga orqaga qarab qanday ta'sir qiladi? [⤳ ta'sir: audit, HR oylik, ShVB]

45. Rezka bosqichi zanjir boshi sifatida belgilanganda, rezka chiqishi (varaq soni) keyingi bosqich kirishiga avtomatik mos bo'lishi kerak — agar rezka hisoblagichi va keyingi bosqich hisoblagichi o'rtasida 5% dan ortiq farq bo'lsa, bu "yo'qolish" qaysi modul (QC, WMS, yoki IoT) orqali tekshiriladi va kim javob beradi? [⤳ ta'sir: QC, WMS, Moliya/GL]

46. Смена hisobot (avto PDF invoys, Q116/Q119) qurilayotganda, operatorning "muqobil ish" davri (арчиш va boshqa) bu PDF'da ko'rsatilishi kerakmi — agar ko'rsatilsa, tarif qanday hisoblanadi, agar ko'rsatilmasa, xodim "ishlamagan" deb hisoblanib ish haqi kamayishi haqida qanday qoida? [⤳ ta'sir: HR oylik, ShVB, Finance]

47. IoT tabletida "priladka" (sozlash) vaqti kiritilganda (COR-098), bu vaqt OEE'ning "setup" toifasiga yoziladimi yoki "ishlash" vaqtiga qo'shiladimi, va sozlash vaqtining standart normasi (rang/format/qolip turiga qarab) texnik kartadan avtomatik taqqoslab ogohlantiradimi? [⤳ ta'sir: MES OEE, PP norma, audit]

48. AI kamera bilan davomat kuzatuvida (turniket va ish-joyi vaqti, Q108) xodim ruxsat olmagan zonaga kirib ketsa, tizim: (a) darhol xavfsizlik xodimini ogohlantiradi, (b) karta bloklangan zonalar ro'yxatini tekshiradi, (c) hodisa log yozadi — bu uch amal qaysi tartibda va sinxronmi yoki asinxronmi bajariladi? [⤳ ta'sir: xavfsizlik, HR, karta-model RBAC]

49. Mashina ko'p to'xtaganida (masalan, hafta bo'yi OEE 40% dan past) tizim avtomatik "bottleneck" belgisini qo'yadimi va agar shunday bo'lsa, bu belgi Director modulidagi holat formulasiga (EP-DIR-001: 5 ko'rsatkich birga) qanday kiradi — ishlab chiqarish reja% ko'rsatkichi orqalab kamayadimi yoki alohida IoT signalmi? [⤳ ta'sir: Director, PP/CRP, ShVB]

50. IoT tizimida mashina yoki sensor uchun "rejalashtirilgan profilaktika" (PM) jadvali tuzilib texnik xizmat kartasiga biriktirilganda, lekin PM sanasida texnik omborda kerakli ehtiyot qismi bo'lmasa, tizim PM jadvalini avtomatik keyinga surishi mumkinmi — va bu qaror kim tomonidan tasdiqlanadi (faqat texnik xizmat boshlig'i yoki sex boshlig'i ham ishtirok etadi), bu surilgan jadval PP rejalashtirishiga qanday signal beradi? [⤳ ta'sir: WMS, MM, PP, texnik xizmat]
