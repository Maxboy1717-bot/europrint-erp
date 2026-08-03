# MKT — 50 tavsiya-javob

1. Lid-skoring vaznlari (buyurtma hajmi 40% tavsiya) har oyda AI avto-qayta kalibrovka qiladi (yangi buyurtma ma'lumotiga asosan); yangi vazn kuchga kirguncha eski ball saqlanadi — ikki versiya yonma-yon, rahbar "joriy qil" tasdiqlaydi.
2. Telefon normalizatsiyasi BE-da avto (+998XXXXXXXXX standart); dublikat aniqlanganda birinchi kiritilgan karta "kanonik", ikkinchisi unga biriktiriladi — birlashtirishni marketing boshlig'i tasdiqlaydi.
3. Lid eskirish croni HR status=ABSENT ni tekshiradi: ta'tildagi sotuvchiga topshirilmaydi, keyingi bo'sh sotuvchiga o'tkaziladi; agar hammasi band bo'lsa rahbarga eskalatsiya.
4. Byudjet tugaganda faqat ogohlantirish + yangi kampaniya "tasdiqlash kerak" statusiga tushadi (bloklanmaydi); marketing rahbari 24 soat ichida tasdiqlaydi, aks holda direktor eskalatsiyasi.
5. Inbox SLA faqat ish soatlarida hisoblanadi: soat 22:00 dagi xabar ertangi 09:00 dan boshlab SLA sayog'ini boshlaydi — astronomik vaqtdan emas.
6. Bir xil telefon bilan ikki kanaldan kelgan lid birlashtiriladi; atribusiya uchun oxirgi teginish asosiy kredit oladi, birinchi teginish ham qayd etiladi (har ikkalasi ko'rinadi).
7. Aktiv QC reklamatsiyasi mavjud bo'lsa NPS so'rovi "noto'g'ri vaqt" bayrog'i bilan keyinga suriladi (reklamatsiya yopilgach avtomatik yuboriladi), bloklanmaydi.
8. Dizayn bosqichiga o'tganda marketing→dizayn Kanban vazifasi avto-yaratiladi; dizayner rad etsa (sabab bilan) oqim matn bosqichiga qaytadi va marketing bildirishnoma oladi.
9. "Reklama xarajati" GL moddasi marketing boshliq + bosh hisobchi birga sozlaydi; yangi xarajat turi qo'shilganda GL Chart of Accounts'ga yangi sub-kod qo'shilishi kerak — bu owner ruxsatini talab qiladi.
10. Offline rejimda kiritilgan lidlar lokal saqlanadi, aloqa tiklanganda avto-sinxronlanadi; sinxronizatsiyada telefon bo'yicha dublikat aniqlanса birlashtiriladi, xatolik hisoboti ko'rsatiladi.
11. Yangi mijoz uchun "ritm" birinchi 3 buyurtmadan keyin hisoblanadi (N=3, sozlanadi); N soni marketing settings'da bosh foydalanuvchi o'zgartira oladi.
12. "Kichiklashgan buyurtmalar" signali faqat pul qiymati (summa) kamayishida triggered bo'ladi, razmer o'zgarishi lekin summa oshsa signal berilmaydi.
13. 90 kunlik oyna ichida bir lid ikki kampaniyaga tegsa ROI oxirgi (yaqinroq) kampaniyaga to'liq hisoblanadi; birinchi kampaniya "ishtirok" belgisi oladi, ammo kredit bo'linmaydi.
14. Namuna uchun material yetarli bo'lmasa namuna arizasi "material kutilmoqda" statusida qoladi va MM ga avto-signal yuboriladi; material kelgach qayta ko'rib chiqiladi.
15. Sodiqlik imtiyozi toifa tushishida faqat yangi buyurtmalarga ta'sir qiladi; avvalgi shartnomalaridagi kelishilgan buyurtmalar eski shartlar bo'yicha bajariladi.
16. Sifatli lid sotuvga berilgach 30 kun ichida sotuv bo'lmasa bu sotuvchi KPI'ga tushadi (savdo ko'nikmasi muammosi), marketing KPI'ga emas — "sifatli lid yetkazildi" nuqtasidan keyin marketing javobgarligi tugaydi.
17. Raqobatchi kartochkasi uchun har 3 oyda mas'ulga "yanglash vaqti" Kanban vazifasi avto-yaratiladi; oxirgi yangilanishdan 90+ kun o'tgan kartochkalar "eskirgan" filtri bilan ajratiladi.
18. Bitrix24 "Sdo'cha" va "Aktivlik" maydonlari alohida crm_activities jadvaliga tushadi (comment sifatida lid kartasiga emas) — faoliyat tarixi to'liq saqlanadi.
19. Marketing xodimi KPI har yangi "sifatli lid" event'ida real-time yangilanadi (cron yoki batch emas) — karta statistikasi ayni paytda to'g'ri ko'rsatishi uchun event-driven yondashuv.
20. Promo-kod 1 mijoz / 1 kampaniya bo'yicha cheklangan (default); cheklash qoidasini marketing boshliq kampaniya sozlamalarida belgilaydi — yangi kampaniyada boshqa limit qo'yish mumkin.
21. Mavsumiy talab kalendari PP/MPS ga "orientir" signal sifatida yuboriladi (majburiy band qilish emas); PP buni ko'rib dastgoh quvvatini rejalashtirishda hisobga oladi — final qaror PP/ishlab chiqarish rahbarida.
22. Lid mahsulot turi to'ldirilganda tizim avtomatik mos sotuvchi-menejer (mahsulot turi → menejer birikma) va tegishli preyskurantni tavsiya qiladi; yakuniy tayinlash rahbar tomonidan tasdiqlanadi.
23. "Oprosny list" qisman saqlanadi (draft holat) — to'ldirilmagan maydonlar belgilab ko'rsatiladi; to'liq to'ldirilguncha SD ga o'tkazish bloklanadi, lekin saqlash va davom ettirish mumkin.
24. Egaga "5 raqam" hisoboti (EP-MKT-116) joriy hafta + oyning birinchi kuni kesimida hisoblanadi; Director dashboard'ning alohida widget'i sifatida, katta marketing panelidan ajratilgan (ega vaqti tiqiz).
25. Noto'g'ri spam belgilangan xabar faqat qo'lda tiklanadi (mas'ul "spam emas" tugmasi bilan); AI "xato belgilangan" pattern uchun faqat ogohlantirish beradi, avto-qaytarish emas — noto'g'ri tiklanish xavfini kamaytirish uchun.
26. Tavsiya bonusi CRM mijoz kartasiga yoziladi (HR xodim sifatida ham ro'yxatda bo'lsa ham); to'lov Payroll orqali emas — alohida "tavsiya bonusi" chiqim modeli Moliya orqali.
27. QC bosqichida sifat muammosi bo'lsa mijozga avtomatik umumiy "kechikish mumkin" xabari yuboriladi (sabab ko'rsatilmaydi, maxfiy qoladi); menejer esa to'liq ma'lumotni ichki bildirishnomada oladi.
28. Marketing rahbari "bo'sh davr aksiyasi" taklif yaratadi, ega + savdo boshlig'i Kanban karta orqali tasdiqlaydi; qaror uchun 48 soat vaqt beriladi, aks holda avtomatik "kechiktirildi" statusiga tushadi.
29. Mijoz ABC toifalash har yangi buyurtma yopilganda real-time qayta hisoblanadi (cron emas); A→B tushish momentida avtomatik xizmat darajasi o'zgarishi va menejer almashtirish tavsiyasi chiqadi — yakuniy qarorni rahbar qabul qiladi.
30. Diler AR balansi faqat moliya xodimi va marketing boshliq ko'ra oladi (oddiy marketing menejer ko'ra olmaydi); RBAC maydon darajasida — marketing menejerga faqat "to'lov kechikmoqda" belgisi ko'rinadi.
31. Ko'rgazma follow-up 48 soati HR ish kunlari kalendariga ko'ra hisoblanadi (astronomik emas); bu parametr HR→Kanban integratsiyasida sozlanadi — bayram kunlari avtomatik o'tkazib yuboriladi.
32. Lid kartasidagi to'lov intizomi belgisi Moliya AR'dan kunlik cron orqali yangilanadi (real-time emas, chunki AR aging kunlik batch jarayon); belgi paydo bo'lgandan 48 soat o'tgach menejerga avto-eslatma yuboriladi.
33. ROI foyda formulasida tannarx Moliyadan (FIFO hisoblangan mahsulot tannarxi) keladi; bir necha aktiv tannarx versiyasi bo'lsa marketing uchun eng so'nggi (joriy) FIFO qiymati ishlatiladi.
34. Upsell AI tavsiyasi har yangi buyurtma yopilganda real-time yangilanadi; tavsiya mijoz kartasida 90 kun saqlanadi, undan keyin "eskirgan" belgilanadi — menejer so'ragan paytda ham yangilash mumkin.
35. Ijtimoiy tarmoq statistikasi (layk/qamrov/izoh) webhook orqali real-time sync bo'ladi; API limit xatosi bo'lganda 15 daqiqa kutib retry qilinadi, keyin "qo'lda yangilash kerak" belgisi qo'yiladi.
36. Mijoz yillik forecast PP/MPS ga faqat "orientir" sifatida kiradi (reservation triggerlamaydi); forecast ±30% o'zgarsa PP avtomatik ogohlantirish chiqaradi, lekin qayta hisoblash PP rahbari ruxsati bilan.
37. Round-robin algoritmida menejer ta'tilda (HR status=ABSENT) bo'lsa keyingiga o'tadi; ish yuklama limiti (max ochiq lid soni) sozlamada belgilanadi — limit oshganda ham keyingiga o'tadi, sozlama o'zgartirishga marketing boshliq ruxsatli.
38. LMS darslik tugalanmaganda HR'ga signal ketadi, HR oylik hisoblashda "to'siq" qo'yadi (Payroll gateb); bu LMS→HR event, Payroll esa HR qarorini o'qiydi — kechikish 1 ish kuni (async event zanjiri).
39. "Takror qil" so'rovida eski тех karta narxlari o'rniga yangi (joriy) narxlar avtomatik qo'llaniladi; yakuniy narxni sotuvchi tasdiqlaydi (draft holat) — narx tasdiqlangandan so'ng buyurtma yaratiladi.
40. Lid "iliq" holat topshirilgandan keyin SD menejer 15 daqiqa ichida "qabul" bermasa — rahbarga (savdo boshlig'iga) eskalatsiya bo'ladi, lid marketingga qaytmaydi; savdo boshlig'i qabul belgilaydi yoki boshqa sotuvchiga qayta tayinlaydi.
41. Yangi Pantone kodi yuklanganda dizayn bo'limiga avto-bildirishnoma ketadi; faol buyurtmalardagi maketlarda shu rang ishlatilgan bo'lsa QC va Dizayn xabardor qilinadi — ular tekshirib tasdiqlaydi.
42. Menejer ogohlantirish ko'rib ham lid ishi davom ettirganini audit-log'da saqlanadi (foydalanuvchi ID, vaqt, "ogohlantirish ko'rildi" belgisi) — A6 qoidasiga muvofiq 7 yil saqlanadi; keyinchalik zarar bo'lsa audit izi mavjud.
43. Diler faqat marketing xodimi nomidan kiritadi (diler portali yo'q); marketing xodimi diler nomini "manba: diler" maydoni bilan kiritadi — diler uchun alohida RBAC roli rejalashtirilmagan (B2B zavod modeli).
44. Mahsulot rentabelligi ko'rinishi RBAC maydon darajasida himoyalangan — CSV eksportda ham foyda/dona raqami ko'rsatilmaydi (boshliq/ega roli bo'lmasa eksport tugmasi yo'q yoki foyda ustunlari o'chirilgan holda eksport qilinadi).
45. Ko'rgazma xodimlarining komandировka xarajatlari HR modulidan avtomatik ulanadi — "vakil safari" alohida modda (EP-MKT-115) sifatida ko'rgazma ROI hisobotiga qo'shiladi; qo'lda kiritish shart emas.
46. 3 oy buyurtma bermagan mijozga win-back kampaniyasi avto-start bo'lganda SD da aktiv lid mavjudligi tekshiriladi; aktiv lid bo'lsa win-back kampaniyasi "kutish" holatida qoladi (parallel muloqot to'sqinlik qilmasin) — SD lid yopilgach avtomatik boshlanadi.
47. "Yangi mahsulot turi talabi" statistikasi oylik avtomatik hisobot sifatida 6-departamentga (Rivojlanish) yuboriladi; qo'shimcha trigger: so'rov soni 10 ta yoki undan oshsa darhol bildirishnoma ketadi.
48. Kontakt o'zgarish Kanban vazifasi joriy biriktirilgan menejer nomiga yaratiladi; agar yangi menejer tayinlangan bo'lsa — yangi menejer nomiga; muddat 48 soat ish vaqtida.
49. Lid SD ga o'tkazilganda marketing modulida lid statusi darhol "o'tkazildi" bo'ladi — SD da mijoz kartochkasi yaratilgach "bog'langan" event keladi va marketing lead yopiladi; ikki modul o'rtasida EventEmitter2 orqali handshake (transfer → accepted ikki event).
50. Telegram bot webhook ishlamay qolsa tizim polling rejimiga o'tadi (fallback); mas'ulga xato bildirishnomasi (email/ichki notif) darhol yuboriladi; SLA: polling rejimida ham xabarlar qabul qilinadi, faqat real-time kechikish bo'lishi mumkin — A5 uptime talabi saqlanadi.
