# CRM — CRM — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Lid-scoring agenti qancha vaqtda bir marta ishlaydi (real-time trigger vs soatlik cron), va yangi faollik (qo'ng'iroq, xat, tashrif) bo'lganda ball DARHOL qayta hisoblanadimi yoki navbatdagi cron sikliga kutadimi? [⤳ ta'sir: AI integratsiya, SD ustuvorlik]

2. Bitta lid bir vaqtda ikki sotuvchi tomonidan "ochiq" holatda bo'lib qolsa (round-robin taqsimotda race condition), tizim qanday qilib ikkilanishni aniqlaydi va qaysi sotuvchining biriktirilishini kanonik qabul qiladi? [⤳ ta'sir: Org-karta, HR yuklama]

3. Mijoz 60 kun faolliksiz "egasizlantirish" navbatiga tushsa, lekin shu paytda Finance modulida ochiq qarzi bo'lsa — Daromadlar bo'limi hali aloqa qilib turganida CRM uni boshqa sotuvchiga avtomatik topshirishi maqsadga muvofiqmi, va bu holatda blok qoidasi qanday ishlaydi? [⤳ ta'sir: Finance, Daromadlar bo'limi]

4. Menejer tashrifi (field/outbound sotuv — EP-CRM-007 tashrif manbai) CRMda qanday qilib kiritiladi: menejer o'zi mobil orqali "tashrif" faollik qo'shadimi, yoki GPS/geolokatsiya avtomatik qayd qiladimi, va tashrif dalili sifatida nima saqlanadi? [⤳ ta'sir: AI integratsiya, 360° karta, Inspeksiya]

5. Kommercheskiy taklif (KP) yuborilgandan keyin mijoz uni "ko'rdi" degan tasdiqlash mexanizmi qanday ishlaydi: email o'qish tasdig'i (pixel/webhook), Telegram "ko'rildi" belgisi, yoki faqat menejer qo'lda "ko'rildi" deb belgilaydimi? [⤳ ta'sir: SD kotirovka, Bildirishnoma]

6. Qog'oz narxi 5% oshganda "ta'sirlangan mijozlar ro'yxati + narxni qayta ko'r" vazifasi yaratiladi — bu vazifani QAYSI sotuvchiga biriktiradi (biriktirilgan sotuvchiga avtomatikmi, yoki savdo rahbariga yig'ilgan ro'yxat sifatidami), va yangi narx tasdiqlanguncha eski narx bilan yangi bitim ochishga ruxsat beriladimi? [⤳ ta'sir: Ta'minot narx-feed, Finance, SD]

7. Mijozning CRM kartasida ko'rsatiladigan "qarz holati" Finance modulidan real-time tortib olinadimi (har sahifa yuklaganda) yoki keshlanadimi (masalan, har 5 daqiqada), va kesh yangilanmagan holda menejer noto'g'ri ma'lumot asosida yangi bitim ochib qo'ysa tizim qanday tuzatadi? [⤳ ta'sir: Finance, SD bitim gate]

8. "Egasizlantirish" CRON ishi: mijoz kartasi 60 kun faolliksizdan keyin boshliq paneliga chiqadi — lekin shu davrda Finance yoki QC modulida shu mijoz bilan bog'liq ochiq reklamatsiya/da'vo bo'lsa, CRM buni hisobga olib egasizlantirish hisoblagichini to'xtatadimi? [⤳ ta'sir: Finance, QC]

9. Telefoniya integratsiyasida: operator qo'ng'iroqni qabul qilganda tizim mijozni avtomatik aniqlaydi (caller ID bo'yicha) va CRM kartasini ochib qo'yadimi — agar bir telefon raqamiga bir nechta mijoz ro'yxatdan o'tgan bo'lsa (korporativ liniya, sekretariyat) aniqlanish qoidasi qanday? [⤳ ta'sir: Inspeksiya bo'limi, 360° karta]

10. Yangi menejer sinov davri (RD-4, EP-CRM-065) tugagandan keyin u "sinov" bayrog'i avtomatik ochiladimi yoki HR moduli tasdiqlashi kerakmi, va sinov davridagi bitimlar (mentor tasdig'i o'tgan) statistikada to'liq hisobga olinadimi? [⤳ ta'sir: HR adaptatsiya, LMS, Org-karta]

11. Mijoz "VIP/asosiy" segmentiga avtomatik o'tish mezonlari (oborot/sodiqlik/buyurtmalar soni) qanday davrda qayta hisoblanadi — har buyurtmadan keyin trigger bilan yoki oylik CRON bilan — va segment pasayganda (VIP → Oddiy) mijozga yoki sotuvchiga bildirishnoma boriladimi? [⤳ ta'sir: SD, Marketing, AI churn]

12. Bitim "Yutdik" holati → `sales_orders` avtomatik yaratilganda, agar shu mijozning Finance modulida kredit limiti oshgan bo'lsa — bitim yaratish darhol bloklanadimi yoki ogohlantirish bilan davom ettirishga ruxsat beriladimi, va bu qarorni kim qabul qiladi (tizim avtomati yoki direktor tasdig'i)? [⤳ ta'sir: Finance kredit gate, SD, Daromadlar]

13. KP (kommercheskiy taklif) muddati 14 kun o'tganda narx avtomatik yangilanadi (FIFO) — bu narx yangilash menejerga bildirishnoma berilib tasdiqlatiladi yoki to'liq avtomatikmi, va mijozga yangi narx bilan qayta KP yuborilishini tizim taklif qiladimi? [⤳ ta'sir: SD kotirovka, Finance narx]

14. Menejer mijoz bazasidan eksport qilmoqchi bo'lganda tizim qanday qilib faqat "o'z mijozlari"ni eksport qilishini ta'minlaydi — SQL darajasida `WHERE assigned_to = current_user` filtr yetarlimi, yoki maydon-darajasida RBAC (kontakt, narx, qarz raqamlarini yashirish) ham eksportga qo'llanilishi kerakmi? [⤳ ta'sir: Xavfsizlik, RBAC eksport blok]

15. "Ochiq reklamatsiya bo'lsa yangi yuk bloki" (EP-CRM-073) mexanizmi: QC modulidagi reklamatsiya holati CRM'ga qanday uzatiladi — event (QcReclamationOpenedEvent) orqali CRM jadvaliga yoziladi yoki har SD bitim yaratishda QC'ga so'rov yuboriladi — va bu bir yo'nalishli ma'lumot oqimimi yoki ikki tomonlama? [⤳ ta'sir: QC, SD bitim gate]

16. Mijoz kartasidagi "360° ko'rinish" bir sahifada nechta moduldan ma'lumot yuklaydi (buyurtma/to'lov/qarz/shikoyat/yozishma/reklamatsiya) va bu parallel so'rovlar bo'lsa loading holati qanday ko'rinadi: barcha ma'lumot tayyor bo'lguncha kutadimi yoki har blok alohida skeleton bilan yuklanadimi? [⤳ ta'sir: Finance, QC, SD, WMS, FE loading]

17. Menejer ketganda (ishdan bo'shatilganda) uning korporativ Telegram/WhatsApp akkauntidagi yozishmalar yangi menejerga qanday o'tkaziladi: akkaunt login ma'lumotlari saqlanadimi, yoki faqat tarix arxivlanadimi, va yangi menejer eski yozishmalar kontekstini ko'ra oladimi? [⤳ ta'sir: HR ishdan bo'shatish, Xavfsizlik, НО-2]

18. AI "churn xavfi" bashoratini qilganda (EP-CRM-014) va sotuvchiga "qaytarish vazifasi" berilganda — bu vazifa Kanban moduliga ham tushiriladi yoki faqat CRM ichida turadimi, va sotuvchi Kanban'dan ushbu vazifani bajarsa CRM ham yangilanadimi (ikki tomonlama sync)? [⤳ ta'sir: Kanban, AI churn, Bildirishnoma]

19. Bir mijoz ko'p formatli mahsulot buyurtma qilib, ulardan biri uchun format o'zgarishi (qisqartirish) kelib qolsa (EP-CRM-050) — menejer roziligi so'raladigan dialog faqat ta'sirlangan mahsulot liniyasida chiqdimi yoki butun bitim bloklanadimi, va mijozga ham bildirishnoma boriladimi? [⤳ ta'sir: Dizayn, Ishlab chiqarish gate]

20. "O'lcham tasdiqlandi" majburiy bayroq (EP-CRM-052) Dizayn bosqichidan o'tgandan keyin belgilanadimi yoki menejer qo'lda belgilaydimi — va agar Ishlab chiqarish tasdiqlangan o'lchamdan farq qiladigan mahsulot chiqarsa (plandan farq), CRM bu hodisani avtomatik flaglaydi va mijoz tasdig'ini so'raydimi? [⤳ ta'sir: Ishlab chiqarish, QC, SD]

21. ГП topshirish blankasidagi 3 imzo (omborchi + haydovchi + savdo menejeri) elektron shaklda qanday amalga oshiriladi: PIN-kod, OTP, yoki biometrika — va uchala imzo bir vaqtda to'liq bo'lmasa "yuk chiqdi" holati hech qachon yaratilmaydi deya tizim blokladimi? [⤳ ta'sir: WMS chiqim, Logistika, SD]

22. Takroriy buyurtma ("qayta buyurtma" tugmasi — EP-CRM-043) eski ГП-kod spetsifikatsiyasini tortib oladi — lekin eski spetsifikatsiya o'zgargan bo'lsa (yangi STP, o'lcham farqi) tizim o'zgargan maydonlarni qanday ajratib ko'rsatadi va menejer tasdiqlamasdan eski spetsifikatsiya ishlatilmaydi degan kafolatni qanday beradi? [⤳ ta'sir: Dizayn STP versiya, Ishlab chiqarish]

23. Mijoz yillik shartnoma (bosh shartnoma + har buyurtmaga spetsifikatsiya, EP-SD-057) imzolagan, lekin qarz limiti oshib qolgan (EP-CRM-024) holat — spetsifikatsiya imzolangan (hujjat immutable, F5), lekin Finance bloki bor: bu ikki qoidaning to'qnashuvi qanday hal qilinadi (spetsifikatsiya ustuvormi yoki qarz bloki)? [⤳ ta'sir: Finance, SD, Daromadlar]

24. Menejer o'z mijozidan boshqa mijozning kartasini "qidiruv" orqali topib ko'rmoqchi bo'lsa — tizim faqat nomini ko'rsatib kontaktni yashiradimi (field-level RBAC), yoki qidiruv natijasida shu mijoz umuman chiqmaydimi, va audit jurnalida "ko'rishga urinish" qayd qilinadimi? [⤳ ta'sir: Xavfsizlik, RBAC, Inspeksiya audit]

25. Import-bog'liq mijoz (EP-CRM-081) uchun Ta'minot modulidagi xom-ashyo import muammosi (boj/kechikish/narx spike) avtomatik CRM'ga signal beradimi — va bu signal sotuvchiga "mijozni xabardor qil" vazifasiga aylanadimi yoki direktor paneliga to'g'ridan chiqadimi? [⤳ ta'sir: Ta'minot MM, Director dashboard]

26. Bitim voronkasida "Dizayn/STP kelishuvi" bosqichida kun limiti oshsa (EP-CRM-051) — Dizayn bo'limiga eslatma boriladimi yoki sotuvchiga boriladimi, va mas'ul Dizayn bo'limining karta-egasi (org-sxema bo'yicha) bu bildirishnomani qabul qiladi, to'g'rimi? [⤳ ta'sir: Dizayn bo'limi, Org-sxema marshrut, Bildirishnoma]

27. Mijoz "qog'oz zayavkasi" profili (Naименование/Format/Gramaj — EP-CRM-041) saqlanadi — bu profil yangi bitimga "avtomatik tortiladi" deyiladi: bu degani yangi bitim formasi ochilganda shu mijozning oxirgi zayavka maydonlari pre-fill bo'ladimi, va menejer ularni o'zgartirsa eski profil yozilmasdan yangi bitim uchun alohida saqlanadimi? [⤳ ta'sir: Ta'minot, Ishlab chiqarish]

28. Mijozning oylik kg trendi pasayishi (EP-CRM-055, churn signal) aniqlanganda AI sotuvchiga "vazifa" yaratadi — lekin bir vaqtda Marketing moduli ham shu mijozga "qaytarish kampaniyasi" triggerlagan bo'lsa (EP-MKT), ikkisi aralashib ketmasligi uchun qanday koordinatsiya mexanizmi bor? [⤳ ta'sir: Marketing kampaniya, AI, CRM-Marketing sync]

29. Kompensatsiya/chegirma tarixi (EP-CRM-074) mijoz kartasida ko'rinadi — va tizim "suiiste'mol" ko'rsatadi deyiladi: qanday mezon bo'yicha (nechta marta, qancha summa, qanday davr) "suiiste'mol" bayrog'i o'rnatiladi, va bu faqat ma'lumot uchunmi yoki direktor tasdig'isiz keyingi chegirma bloklanadimi? [⤳ ta'sir: Finance, Xavfsizlik, Director alert]

30. "Akademiyaga" namuna buyurtmasi (EP-CRM-084) daromad statistikasidan chiqarilib material xarajatiga yoziladi — lekin ishlab chiqarish rejasi (PP) bu buyurtmani qanday ko'radi: oddiy buyurtma sifatidami yoki alohida "namuna" ustuvorligidami, va MES'da stanok vaqti hisobida bu qanday aks etadi? [⤳ ta'sir: PP rejalashtirish, MES, Finance]

31. Menejer abonent doirasi cheklovi (EP-CRM-032) — tizim "tasdiqlangan abonentdan tashqari raqam CRMda flaglanadi" deydi: bu flag avtomatik (qo'ng'iroq yozuvi tahlili asosida) yoki menejer qo'lda kiritgandami, va Inspeksiya bo'limi bu flaglarni real-time ko'radimi yoki oylik hisobotdami? [⤳ ta'sir: Inspeksiya bo'limi, НО-2, Xavfsizlik]

32. Korporativ raqam (НО-2) menejer kartasiga biriktiriladi — va menejer ketganda raqam + baza yangi menejerga o'tadi. Texnik jihatdan: eski va yangi menejer o'rtasida raqam "o'tkazish" qanday amalga oshiriladi (HR modulida "ishdan ketdi" eventi → CRM'da avto-reassign), va o'tkazish davomida (ma'mur bajargunicha oraliq) raqamga kelgan xabarlar qayerga tushadi? [⤳ ta'sir: HR ishdan bo'shatish, CRM-HR event, Bildirishnoma]

33. Lid avtomatik sotuvchiga biriktirilganda (round-robin, EP-CRM-005) sotuvchi "band" bo'lsa (ta'tilda, kasallikda — HR moduli ma'lumoti) yoki sinov davrida (mentor kerak) — tizim bu holatlarni biladi va alternativ taqsimlaydi: HR moduli holati CRM taqsimot mantig'iga real-time ta'sir qiladimi? [⤳ ta'sir: HR ta'til/kasallik, Org-karta, LMS sinov]

34. Chiqimli/chiqimsiz narx varianti (EP-CRM-056) KP'ga qo'shilganda: tizim har ikkisini avtomatik hisoblaydimi (Ishlab chiqarish ma'lumotlariga asosan) yoki menejer qo'lda kiritadimi, va agar Ishlab chiqarish yangi format uchun chiqim normalarini hali belgilamagan bo'lsa KP qanday shakllanadi? [⤳ ta'sir: PP/MES format normasi, Finance]

35. ГП-kod tarixida (EP-CRM-043) mijozning eng so'nggi 5 buyurtmasi ko'rinadi — agar shu buyurtmalardan biri QC tomonidan "rad" yoki "brak" deb yopilgan bo'lsa, qayta buyurtma uchun ishlatilgan ГП-kod profiliga qizil "brak bo'lgan" belgisi qo'yiladimi va menejer bunga e'tibor qaratishi uchun UI qanday ogohlantiradi? [⤳ ta'sir: QC, SD, 360° karta]

36. "Papka №" va "Прошло (дней)" hisoblagichi (EP-CRM-040) CRON bilan ishlaydi — qanday holatda hisoblagich to'xtaydi: faqat "Yuk chiqdi" holatidami yoki "To'lov amalga oshdi" holatida ham, va to'liq to'lov qilinmay qisman to'lov bo'lsa (FIFO, EP-FIN-061) hisoblagich nechta kun sanaydigan qoida qanday? [⤳ ta'sir: Finance to'lov, SD status, Daromadlar]

37. Savdo menejeri KPI (EP-CRM-023) — yopilgan bitim/oborot avtomatik KPI paneliga ulanadi: lekin bitim "yutildi" deb belgilangan va `sales_orders` yaratilgan, ammo keyinchalik buyurtma bekor qilingan (PP'da yoki mijoz xohishiga ko'ra) — KPI hisobidan avto-ochiladimi yoki menejer "qaytarish" uchun alohida tasdig'i kerakmi? [⤳ ta'sir: SD buyurtma bekor, PP, HR bonus]

38. Yetkazish tasdig'idan keyin (ГП topshirish, EP-CRM-047) "keyingi buyurtma eslatmasi (proaktiv)" yaratiladi — bu eslatma qancha vaqtdan keyin boriladini kim belgilaydi: mijoz profili (odatda qancha vaqtda bir marta buyurtma beradi — avtomatik hisob), yoki standart sozlama (masalan, 30 kun), yoki sotuvchi qo'lda belgilaydi? [⤳ ta'sir: AI prognoz, SD takroriy sotuv, Bildirishnoma]

39. Mijoz "import-bog'liq" (USD/xom-ashyo) va valyuta kursi 5%+ sakraganda (EP-CRM-071) qayta ko'rish signali boriladimi — bu signal faqat menejerga boriladimi yoki mavjud barcha ochiq KP/bitimlarni avtomatik "kechiktirilgan/qayta hisob kerak" holatiga o'tkazadimi? [⤳ ta'sir: Finance kurs, SD kotirovka, Ta'minot]

40. Mijoz ombor kirish talablari (EP-CRM-082) saqlanadi (vaqt/hujjat/sanitariya) — bu ma'lumot Logistika modulidagi yetkazish reja tuzilganda (PP marshrutida) avtomatik tortib olinadimi, va kirishga mos kelmaydigan haydovchi/transport assigned bo'lsa ogohlantirish kim tomonidan qabul qilinadi (logistika yoki sotuvchi)? [⤳ ta'sir: SD yetkazish, PP logistika, WMS]

41. Bitim "Yutqazdik" deb belgilanadigan payt sabab ro'yxatidan (format/narx/muddat/raqobat — EP-CRM-020) tanlanadi — bu yutqazilgan bitimlar Director dashboard'da "root cause" analitikasiga (EP-DIR-037) real-time kiradimi va har haftada sotuv rahbariga avtomatik "yutqazilgan bitimlar hisoboti" (qaysi sabab eng ko'p) yuboriladimi? [⤳ ta'sir: Director dashboard, SD, Hisobot]

42. Mijoz kartasida "Menejer fikri / Menejer hohishi" yozuvi (kitob qisqartirish jadval, EP-CRM-050) saqlanadi — bu erkin matn maydoni yoki strukturali (kategoriya + izoh), va AI shu yozuvlarni o'qib mijoz bilan ishlash bo'yicha yangi menejerlarga tavsiya beradimi (menejer ketganda kontekst uzilmasligi uchun)? [⤳ ta'sir: AI NBA, HR onboarding, LMS]

43. Korporativ raqam abonent doirasi (НО-2) nazorati texnik jihatdan qanday amalga oshiriladi: tizim har qo'ng'iroqdan keyin "bu raqam ro'yxatdami" tekshiruvi qiladimi (real-time), yoki haftalik batch tahlil qiladimi, va ruxsatsiz raqam topilganda Inspeksiya bo'limiga avtomatik INCIDENT yaratiladi yoki faqat logga yoziladi? [⤳ ta'sir: Inspeksiya bo'limi, НО-2, Xavfsizlik audit]

44. Menejer mijoz bilan yozishmalar (Telegram/WhatsApp/SMS/Email) barcha kanaldan CRM'ga yig'iladi — agar menejer shaxsiy telefonidan korporativ akkaunt o'rniga o'z shaxsiy Telegram'idan mijozga yozsa, bu yozishma CRM'da ko'rinmaydi. Bu "korporativ kanal bypass"ni tizim qanday aniqlaydi yoki oldini oladi? [⤳ ta'sir: НО-2, Xavfsizlik, Inspeksiya]

45. Sotuvchi leaderboard (ShVB YO'NALISH 26, EP-CRM-027) haftalik yangilanadimi yoki real-time — va leaderboard ko'rsatkichlari (weeklySalesVolume/closedDeals/averageDealSize) faqat "Yutdik" bitimlar asosidami yoki KP yuborilgan (pipeline) bosqichdagi bitimlar ham forecasting uchun alohida ko'rsatiladimi? [⤳ ta'sir: Director dashboard, HR bonus, KPI]

46. Mijoz mahsulotiga biriktirilgan tajribali operator/usta (EP-CRM-085) PP rejalashtirish vaqtida "tavsiya" sifatida ko'rinadimi, yoki PP avto-rejalashtirish (AI) shu ma'lumotni majburiy mezon sifatida ishlatadimi — va agar shu operator band bo'lsa (boshqa buyurtmada) PP qanday alternativ taklif qiladi? [⤳ ta'sir: PP AI rejalashtirish, MES, Org-karta]

47. "Asosiy mijoz" bayrog'i (EP-CRM-054 — Indorama tipidagi, katta hajmli) bo'lgan mijozning buyurtmasi PP rejalashtirishda qanday "ustuvor" bo'ladi: faqat PP'dagi prioritet bayroq bilan yoki CRM'dagi "asosiy mijoz" holati PP'ga event orqali uzatiladimi, va material zaxirasi (WMS) ham shu mjozning buyurtmasi uchun avval bronlanadimi? [⤳ ta'sir: PP ustuvorlik, WMS bron, Ta'minot]

48. CRM audit jurnali (EP-CRM-068) "ko'rish/o'zgartirish/eksport" harakatlarini yozadi — bu jurnal `crm_audit_log` jadvalidami yoki tizim-wide `audit_log` jadvalidami (A6 — har klik/IP/vaqt, 7 yil), va Inspeksiya bo'limi uchun CRM-spetsifik filtr (faqat CRM harakatlari) bor ekan qanday so'rovda olinadi? [⤳ ta'sir: Xavfsizlik, Inspeksiya, audit 7 yil]

49. Bitim "Namuna→Klishe/STP tasdiq" voronka bosqichida (EP-CRM-002 — zavod jarayoni voronkasi) qolib ketsa va Dizayn bo'limi javob bermasa — bu holatda faqat Dizayn bo'limiga eskalatsiya boriladimi, yoki 7-Otdeleniye ierarxiyasi bo'yicha (E5 — org-sxema marshrut) bir daraja yuqori rahbarga ham avto-eskalatsiya triggerlanyapti, va qancha kundan keyin? [⤳ ta'sir: Dizayn, Org-sxema Vysotskiy-7, Bildirishnoma]

50. Butun CRM moduli oflayn rejimda (A5 — internet o'chsa ham ishlaydi) qanday ishlaydi: menejer tashqarida yangi lid qo'shishi, faollik yozishi, KP yuborishi mumkinmi — va oflayn davridagi ma'lumotlar internet qaytganda qanday sinxronlanadi, ayniqsa bir mijozga ham oflayn ham onlayn menejer bir vaqtda yozgan bo'lsa conflict resolution qoidasi qanday? [⤳ ta'sir: AI integratsiya, SD, Bildirishnoma, PWA sync]
