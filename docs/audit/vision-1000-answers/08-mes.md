# MES — 50 tavsiya-javob

1. Faqat shu operatorning mashina-matritsasiga (EP-MES-054) mos buyurtmalar ko'rinadi; noto'g'ri mashina tanlansa texkarta tekshiruvi blok qiladi va ogohlantirish chiqadi.
2. Tugallanmagan sessiya avtomatik "to'xtatilgan" statusiga tushadi; keyingi smena operatori uni davom ettira oladi, lekin handover (EP-MES-023) tasdiqlangan bo'lishi shart.
3. Har mashina o'z OEE sessiyasini alohida oladi — vaqt ulushi (foiz birikmasi) bilan; birinchi mashina "asosiy", qolganlar "yordamchi" emas, har biri mustaqil hisob birligiga ega.
4. Sessiya BOSHLANGAN vaqtdagi norma versiyasi qo'llaniladi (EP-MES-056 versiya-sana bilan saqlangan); joriy o'zgarish faqat KEYINGI sessiyadан kuchga kiradi.
5. "Ish yo'q" downtime kiritilganda tizim BullMQ event chiqaradi; org-sxema bo'yicha planlovchi + bo'lim boshlig'iga Telegram xabari ketadi; PP rejalashtirishga avto-signal beriladi.
6. "Qolib noto'g'ri" brak sababi — MES downtime kodi sifatida qayd etiladi (EP-MES-047) va QC ga event ketadi; QC oldingi bosqich mas'ulini aniqlaydi (mas'uliyat taqsimi QC tomonida).
7. AI EP-MES-079 asosida avtomatik xulosa tayyorlaydi; usta faqat tasdiqlaydi yoki o'zgartiradi; tasdiqsiz smena rasman yopilmaydi.
8. TB chek-listi to'liq to'ldirilmasa sessiya mutlaqo bloklanadi; ruxsat bo'lim boshlig'i yoki smena mas'ulidan olinadi (org-sxema bo'yicha).
9. Direktor "sabab tushunildi, kut" deb tasdiqlaganda tizim o'sha SOS eskalatsiyasini to'xtatadi; ammo agar mashina yana 30 daqiqa to'xtaganda yangi SOS hayoti boshlanadi.
10. Operator "bajarilmadi" uchun toifа tanlaydi (material / qolip / asbob / sozlash / boshqa); bu toifa QC ga ham event ichida uzatiladi va root-cause zanjiri saqlanadi.
11. Operator tasdiqdan oldin miqdorni o'zgartira oladi; sabab yozdirish majburiy; og'ish WMS ga real-time event bilan uzatiladi (smena yakunini kutilmaydi).
12. Har partiyaga alohida satr yoziladi (to'liq FIFO/FEFO traceability); har birining foiz hissasi ham saqlanadi (mas: A-partiya 60%, B-partiya 40%).
13. Sarf WMS dan real-time chegirma qilinadi va GL ga darhol yoziladi; real-time va batch o'rtasidagi farq audit-log da timestamp bilan ko'rinadi.
14. Ustoz nazoratidagi shogird braki USTOZ kartasiga ta'sir qilmaydi — salbiy ta'sir faqat inson tasdig'i bilan (E1); usta o'sha sessiyada boshqa mashinada bo'lsa, brak shogird sessiyasiga yoziladi.
15. Mustaqil ishlash ruxsati sessiya ochish paytida real-time RBAC bilan tekshiriladi; attestatsiya muddati o'tgan bo'lsa sessiya bloklanadi va HR ga ogohlantirish ketadi.
16. Yordamchi namoz tanaffusini qoplab turganda bu vaqt "ishchi-vaqt" sifatida sanaladi — mashina to'xtamadi, demak OEE uchun "rejali to'xtash" emas.
17. Allaqachon boshlangan sessiyaga reja retro-kiritilmaydi; yangi miqdor/vaqt faqat keyingi sessiyaga ta'sir qiladi; o'zgarish audit-log da versiyalanib saqlanadi.
18. Asosiy bosqichga o'tish OPERATOR tugmasi bilan bo'ladi (IoT yo'q, EP-MES-080); sozlash kutilgandan 2 barobar uzoq bo'lsa tizim real-time signal yuboradi (usta + bo'lim boshlig'i).
19. Har bosqich o'z bo'limiga GSD yoziladi (Flekso bosqichi → Flekso, Upakovka bosqichi → Upakovka); yakuniy bosqich to'liq GSD olmaydi — bu adolatli bo'lim darajasidagi hisob.
20. Bottleneck limitidan oshganda PP ga avto-signal + AI navbat tartibini qayta hisoblash taklifi ketadi; inson (planlovchi) tasdiqlaydi va keyin navbat qayta tartiblanadi (E1+E3).
21. Tizim joriy sessiyani to'xtatib shoshilinchga o'tishni TAVSIYA qiladi (majburlamaydi — E1); yarim bajarilgan ish "to'xtatilgan" statusda qoladi, handover yozuvi bilan (PP da split EP-PP-063).
22. Operator "sabab = material" tanlaganda o'sha partiya/qoldiq uchun WMS da "muammo bayrog'i" avto-qo'yiladi va MM ta'minot bo'limiga event-signal ketadi.
23. Brigadir smena o'rtasida yangi xodim qo'shishi yoki almashtirishi mumkin; o'zgarish davomat (HR) ga real-time qayd etiladi; GSD hissasi o'zgarish VAQTIDAN hisoblanadi (retro emas).
24. Format/gramm WMS dagi partiya parametrlari bilan taqqoslanadi; og'ish aniqlansa QC + MM yetkazuvchi bo'limiga signal ketadi.
25. Qayta ishlangan mahsulot "to'g'rilangan sof mahsulot" sifatida hisoblanadi (brak emas); GL da qayta ishlash narxi (qo'shimcha mehnat + material) alohida tannarx moddasiga yoziladi.
26. PP rejalovchi "Tigel-3" berganda Tigel-5 da bajarish bo'lim boshlig'i yoki НО-mas'ul ruxsati bilan mumkin; ruxsat texkarta (EP-MES-007) bilan taqqoslanadi va audit-log ga tushadi.
27. AI xulosa joriy smena ma'lumotlari + oxirgi 7 kun trendi asosida tuziladi; direktorga — qisqa xulosa, bo'lim boshlig'iga — o'rta, smenaboshchiga — to'liq (darajaga moslashtirilgan).
28. IoT sensor o'rnatilmagan mashinalar uchun energiya sarfi stanok turidagi texnik pasportdagi quvvat (kVt) × ish soati formulasi bilan hisoblanadi; sex umumiy schyotchikdan proportsional emas.
29. OEE/reja-fakt/brak/sarf vazni НО-mas'ul (RD-4 kelishuvi + direktor tasdig'i) tomonidan sozlanadi; o'zgarish faqat KEYINGI smenalardan kuchga kiradi, o'tganlar qayta hisoblanmaydi.
30. Bonus A toifaga = belgilangan X so'm (foiz emas — aniqroq va shaffof); brigada ichida har operator/yordamchi uchun alohida taklif chiqadi; HR tasdiqlaydi, keyin Payroll ga o'tadi.
31. Keyingi smena "qabul qilmaydi" desa — smena boshlig'i arbitr bo'ladi; ikkala tomon imzolagan handover bo'lmaguncha smena rasman yopilmaydi; eskalatsiya org-sxema bo'yicha.
32. Buyurtma kodi SD dagi sales_orders ga FK orqali avtomatik bog'lanadi (operator qo'lda termasdan tanlov-ro'yxatdan oladi); noto'g'ri kod darhol ogohlantirish beradi.
33. "O'quv/Akademiya" ishi LMS moduli bilan sinxronizatsiya qilinadi; LMS da "bajarildi" hisoblanadi; OEE real ishlab chiqarish normasidan alohida, "o'quv" sessiyasi toza unum hisobiga qo'shilmaydi.
34. Gofra qatlam noto'g'ri kelganda WMS dagi kirim parametri (Заявка бумаги qatlam soni) bilan avtomatik taqqos bo'ladi; operatoru qo'lda ham belgilashi mumkin; og'ish aniqlansa QC + MM ga signal.
35. НО-mas'ul faqat o'z bo'limi (Ofset yoki Flekso) ma'lumotlarini ko'radi; boshqa bo'limni ko'rish uchun alohida ruxsat kerak; mas'ul o'zgarsa hisobotlar egasi retro o'zgarmaydi (audit-log immutable).
36. OEE maqsadini faqat НО-mas'ul yoki direktor o'zgartira oladi; o'zgarish versiyalanib saqlanadi; avvalgi smenalar yangi maqsadga QARSHI qayta baholanmaydi (tarix to'g'riligi).
37. "Avariya remont" qayd qilinganda tizim avtomatik Kanban'da texnikaga biriktirilgan vazifa ochadi; texnik auoto-biriktiriladi (org-sxema bo'yicha); IoT PM jadvaliga ham bug report ketadi.
38. Oflayn kiritilgan ma'lumotlar internet qaytganda timestamp bo'yicha ketma-ket kiritiladi; parallel kiritilgan bir xil partiyaga tegishli operatsiyalar conflict-review navbatiga tushadi (audit-log 7 yil).
39. Smena reja-formasi PDF versiyalanib saqlanadi; smena o'rtasida reja o'zgarsa yangi PDF qayta chop qilinadi va eski versiya arxivlanadi (immutable hujjat — F5).
40. "Fakt < reja, sabab = material kechikishi" — PP ning "muzlatilgan zona" (EP-PP-025 ~3 kun) dan kelgan buyurtmaga tegishli bo'lsa, zona faqat egasi/direktor tomonidan ochilgan bo'lishi kerak; sabab audit-log ga tushadi.
41. MES sessiya yakunida MES event chiqaradi → QC final inspection gate (EP-QC-008) ga BullMQ orqali push qilinadi; trigger MES event (QC cron emas, real-time event-driven).
42. Bosqich tugaganda keyingi mashina operatori tabletida yangi ish push notification bilan o'zi paydo bo'ladi; PP rejalovchi qayta tasdiqlashi shart emas (navbat PP CRP'dan avto-tartiblanadi).
43. Eski mes_sessions jadvalidagi tarixiy ma'lumotlar production_sessions ga to'liq migratsiya qilinadi (VIEW emas); migratsiya paytida OEE hisobotlari buzilmasin uchun migratsiya tranzaktsion + test-run bilan (egasi ruxsati majburiy — Q-35).
44. Yangilangan razryad matritsasi (operator yangi mashinaga ruxsat oldi) darhol kuchga kiradi (real-time RBAC); joriy aktiv sessiyaga ta'sir qilmaydi (sessiya yakunidаn keyin ishga kiradi).
45. AI kamera 20 daqiqa to'xtashni aniqladi, lekin MES'da downtime kiritilmagan — AI bu nomoslikni anomaliya sifatida belgilaydi va usta/bo'lim boshlig'iga signal yuboradi; inson tasdig'i kelguncha o'sha 20 daqiqa OEE da "tekshirilmagan to'xtash" sifatida alohida saqlanadi (avtomatik jarima/ball emas — E1).
46. Handover keyingi smena tomonidan QABUL QILINMAGUNCHA smena rasman "yopiq" hisoblanmaydi; Payroll hisoblash smena "yopiq" statusiga bog'liq emas (davomat smena boshida qayd etilgan).
47. MES operatoriga bosqich ekranida traffic light indikatori ko'rsatiladi (yashil/sariq/qizil — to'plam tayyor/kutilmoqda/blok); bloklanmaydi, faqat ko'rsatiladi; to'plam gate PP tarafida boshqariladi.
48. Smena reja-xulosa sabab-statistikasi НО-mas'ul + PP + DIR uchun rolga qarab ko'rinadi (RBAC darajali proeksiya — F1); Payroll va boshqa aloqasiz rollar ko'rmaydi.
49. Akt 2 imzosiz (yoki faqat 1 imzo bo'lsa) material WMS dan chiqmaydi va MES sessiyasiga kirmaydi (blok); akt imzolanmagan holda smena boshlanmaydi — tannarx zanjiri to'liq bo'lishi shart.
50. Smena bali handover IKKI TARAF tomonidan tasdiqlanganda "yakuniy" bo'ladi; yakuniy bo'lgandan keyin balni o'zgartirish faqat НО-mas'ul + direktor birgalikda, yozma sabab va audit-log yozuvi bilan amalga oshirilishi mumkin (immutable — F5).
