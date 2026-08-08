# MKT — Marketing — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Lid skoring AI hisobida mezon vaznlari (buyurtma hajmi 40% tavsiya) qachon qayta hisoblanadi — faqat qo'lda yoki har oyda cron bilan avto-qayta kalibrovka bo'ladimi, va yangi vazn kuchga kirgunga qadar eski ball saqlanadimu? [⤳ ta'sir: SD (lid navbati), HR (menejer KPI)]

2. Bitrix24 dan ERP ga lid ko'chirishda telefon raqami formati (+998XXXXXXXXX vs 998XXXXXXXXX vs 0XXXXXXXXX) bir xil bo'lmasa duplikat aniqlash qanday ishlaydi — normalizatsiya avto-bo'ladimi va kimning kartochkasi "kanonikalga" aylanadimi? [⤳ ta'sir: CRM (yagona karta), SD]

3. Lid "eskirish" cronida sotuvchi ta'tilda yoki kasallik sababli bo'lmasa (HR status=ABSENT) — 24 soatda boshqa sotuvchiga o'tkazish mexanizmi shu holatni hisobga oladimi yoki avtomatik boshqa sotuvchiga berib yuboraveradi? [⤳ ta'sir: HR (ta'til/kasallik statusi), SD (lid egasi)]

4. Kanal byudjeti oy davomida tugab qolsa (marketingBudgetRemain=0) — yangi kampaniya yaratish to'sib qo'yiladimi yoki faqat ogohlantirish chiqadimi, va holatni kim (marketing rahbari yoki direktor) qaysi vaqt ichida tasdiqlashi kerak? [⤳ ta'sir: Moliya (byudjet), Director dashboard]

5. Inbox SLA 15 daqiqa chegarasi hisoblanganda soat 22:00 dagi Instagram xabari ertangi ish vaqti (09:00) boshidan 15 daq SLA sifatida hisoblanadimi, yoki har doim astronomik vaqtdan hisob boshlanadimu? [⤳ ta'sir: HR/KPI (javob tezligi), SocialInbox]

6. Bir lid ikkita kanaldan bir vaqtda kelsa (Instagram DM + Telegram bir xil telefon) — tizim qaysi kanal asosiy deb belgilaydi va atribusiya kreditini qanday bo'ladimu: oxirgi teginish, birinchi teginish yoki teng bo'linishmi? [⤳ ta'sir: Hisobot (kanal ROI), CRM (yagona karta)]

7. NPS so'rovnomasi buyurtma yetkazilgach avto-yuborilganda buyurtmada QC reklamatsiyasi ochiq bo'lsa — so'rov bloklanadimi yoki "noto'g'ri vaqt" bayroqi bilan keyinga surmadimu (EP-MKT-099 logikasi)? [⤳ ta'sir: QC (reklamatsiya holati), SD, CRM]

8. Kontent post tasdiqlash oqimida (g'oya → matn → dizayn → tasdiqlangan → joylandi) dizayn bosqichida marketingdan dizayn bo'limiga Kanban vazifasi avto-yaratiladimi, va dizayner rad etsa oqim qanday orqaga qaytadimi? [⤳ ta'sir: Dizayn (Kanban vazifa), Bildirishnoma]

9. Marketing byudjeti moliyadan haqiqiy to'lov ma'lumotini olganda "reklama xarajati" hisobning qaysi GL moddasi (account kodi) bilan bog'lanadi — bu mapping kim sozlaydi va yangi xarajat turi qo'shilganda GL tarafida nima o'zgarishi kerak? [⤳ ta'sir: Moliya/GL (entries), Hisobot (ROI aniqligi)]

10. Ko'rgazmada lid yig'ish formasida internet aloqasi yo'q bo'lganda (offline rejim) — kiritilgan lidlar lokal saqlanib, aloqa tiklanganda avto-sinxronlanadimi, va sinxronizatsiya vaqtida duplikat paydo bo'lsa qanday hal qilinadi? [⤳ ta'sir: CRM (lid bazasi), A5 offline talabi]

11. Churn signali "mijoz ritmiga nisbatan kechikkan" hisoblanganda yangi mijoz uchun "ritm" qanday aniqlanadi — birinchi N buyurtmadan so'ng ritm hisoblanadimi, yoki N soni qancha va bu parametr sozlanadimi? [⤳ ta'sir: CRM (churn EP-CRM-014), SD savdo tarixi]

12. "Kichiklashgan buyurtmalar" signali (EP-MKT-085) mijoz razmer o'zgartirsa (25x19x12 → 20x15x10) summa oshsa ham signal beradimi, yoki faqat pul qiymati kamayishi triggermi? [⤳ ta'sir: SD (buyurtma tarixi), Moliya (foyda/dona)]

13. Atribusiya 90 kunlik oynasi ichida bitta lid ikki marta qayta uyg'onilib (win-back) ikki xil kampaniyaga tegsa — ROI qaysi kampaniyaga hisoblanadimi va ikkalasiga bo'linish formulasi qandaymi? [⤳ ta'sir: Hisobot (kampaniya ROI), Moliya]

14. Namuna so'rovi (EP-MKT-075) ishlab chiqarishga yuborilganda omborda namuna uchun material yetarli bo'lmasa — namuna arizasi bloklanadimu yoki "material kerak" signali MM ga avto-yuboriladi, keyin qayta ko'rib chiqiladi? [⤳ ta'sir: WMS (warehouse_stock), MM (ta'minot PR), Ishlab chiqarish]

15. Sodiqlik imtiyozi qoidasi (EP-MKT-108) yillik hajm chegarasida: moliyaviy yil tugashida mijoz A-toifadan B-toifaga tushsa — avvalgi chegirma shartnomalaridagi kelishilgan buyurtmalarga ta'sir qiladimi yoki faqat yangi buyurtmalarga? [⤳ ta'sir: SD (narx/shartnoma), Moliya, CRM]

16. Savdo menejer KPI chegarasi "marketing faqat sifatli lidgacha javobgar" qoidasida sifatli lid sotuvga berilgach 30 kun ichida savdo bo'lmasa — bu marketing xatosi deb hisoblanadimi yoki sotuvchi KPIsiga tushadi, avtomatik qaror qanday? [⤳ ta'sir: HR (KPI kartasi), SD, Director dashboard]

17. Raqobatchi kartochkasi (EP-MKT-078) ma'lumoti yangilanishini qanday cron/reminder boshqaradi — har N oyda mas'ulga "yangilash vaqti" vazifasi avto-yaratiladimi va eskicha ma'lumot bo'lgan kartochkalarni filtrlaydigan ko'rinish bormi? [⤳ ta'sir: SD (narx siyosati), Kanban (vazifa)]

18. Bitrix24 CSV import paytida Bitrix24 dagi "Sdo'cha" (eslatma) va "Aktivlik" (call log) maydonlari ERP da qaysi jadvallarga tushadi — faqat lid kartasiga comment sifatida, yoki alohida crm_activities jadvali bormi? [⤳ ta'sir: CRM (faoliyat tarixi), SD]

19. Marketing xodimi lavozim kartasidagi GSD (marketingGsd) ko'rsatkich sifatida "sifatli lid" olganda uning KPI hisob-kitobi qaysi triggerда avto-yangilanadi — har kuni cron, har yangi sifatli lid event, yoki haftalik batch? [⤳ ta'sir: HR (KPI/oylik), ORG (karta statistikasi), Payroll]

20. Promoкod kampaniyasiga biriktirilganda (EP-MKT-042) bir mijoz bir kampaniyaning promo-kodini bir necha bor ishlatsa — tizim cheklash qo'yadimi (1 marta / mijoz), va cheklash qoidasini kim sozlaydi? [⤳ ta'sir: SD (chegirma qo'llash), Moliya (zarar nazorati)]

21. Mavsumiy talab kalendari AI tarixdan avtomatik tuzilganda shu kalendar PP/MPS ga signal berib dastgoh quvvatini avvaldanoq band qiladimi, yoki faqat marketing eslatma sifatida ishlatadimi? [⤳ ta'sir: PP (MPS/CRP), Ishlab chiqarish (dastgoh bandligi)]

22. Lid "mahsulot turi" majburiy maydoni (EP-MKT-089) to'ldirilganda tizim avtomatik qaysi sotuvchi-menejer (mahsulot turi → dastgoh → mas'ul texnolog) va qaysi narx tarixi (preyskurant) mos ekanini ko'rsatadimi? [⤳ ta'sir: SD (menejer taqsim), PP (dastgoh formati)]

23. "Opросный лист"ga lid ma'lumoti old-to'ldirilganda lid'da texnik jo'ntablik (razmer, bo'yoq, tiraж) hali to'liq ko'rsatilmagan bo'lsa — opросный лист qisman saqlanadimu yoki to'liq to'ldirilguncha blok qo'yadimu? [⤳ ta'sir: SD (gate: TT to'liqligi), Dizayn (опросный→тех карта)]

24. Egaga "5 raqam" hisoboti (EP-MKT-116: yangi/yo'qolgan/kichiklashayotgan/trendi/xavf) qancha davr kesimida (joriy hafta? oy? chorak?) hisoblanadi va ushbu 5 ko'rsatkich vizual formatida qaysi sahifada — alohida widget yoki Director dashboard integratsiyasimi? [⤳ ta'sir: Director dashboard, Bildirishnoma]

25. Inbox spam filtri (EP-MKT-067) noto'g'ri spam deb belgilangan haqiqiy lid xabarini qanday tiklash mexanizmi bor — faqat qo'lda, yoki AI "xato belgilangan" pattern bo'yicha avto-qaytaradimi? [⤳ ta'sir: CRM (lid yo'qolish xavfi), AI integratsiya]

26. Tavsiya bonusi (EP-MKT-117) tavsiyachi mijoz bo'lsa (kompaniya vakili) va u xodim sifatida ERP da ham ro'yxatda bo'lsa — bonus qaysi profilga (CRM mijoz kartasi yoki HR xodim kartasi) yoziladi va to'lov Payroll orqali ketadimi? [⤳ ta'sir: HR/Payroll (bonus), CRM (tavsiyachi karta), Moliya]

27. Mijoz buyurtma holati Telegram bot orqali kuzatayotganda (EP-MKT-107) buyurtmaning QC bosqichida sifat muammosi yuzaga kelsa — mijozga avtomatik "kechikish" xabari yuboriladi, yoki bu ma'lumot maxfiy saqlanib faqat menejer xabardor bo'ladi? [⤳ ta'sir: QC (reklamatsiya), SD (mijoz muloqoti), Bildirishnoma]

28. Ishlab chiqarish bo'sh quvvat signali (EP-MKT-110) marketingga kelganda "bo'sh davr aksiyasi" tasdiqlash jarayoni qanday — marketing rahbari taklif yaratiб, egasi va savdo boshlig'i Kanban orqali tasdiqlaydi, va qancha vaqt ichida qaror qabul qilinishi kerak? [⤳ ta'sir: PP (dastgoh bandligi), SD, Kanban (tasdiq oqimi)]

29. Mijoz ABC toifalash (EP-MKT-105) qayta hisoblanish chastotasi qanday — har buyurtmada real-time, kunlik cron, yoki oylik batch; va A→B tushish momentida avtomatik xizmat darajasi o'zgarishi (ustuvorlik, menejer almashtirish) qanday triggerlanadi? [⤳ ta'sir: SD (ABC ustunligi), CRM, Moliya]

30. Kanal "diler/vositachi" (8-kanal) uchun to'lov intizomi signali (EP-MKT-091) qanday ishlaydi — diler o'zi mijoz sifatida ham CRM da bo'lsa, uning AR balansini ko'rish ruxsati marketing menejeriga beriladi yoki faqat moliyaga? [⤳ ta'sir: Moliya (AR/debitor), CRM, RBAC (ruxsat kartasi)]

31. Ko'rgazma follow-up cronida (EP-MKT-060) 48 soat ichida bog'lanish vazifasi yaratilganda ko'rgazma bayram yoki dam olish kuniga to'g'ri kelsa — 48 soat astronomik hisoblanadimi yoki ish soatlari bo'yicha; va bu parametr sozlanadimi? [⤳ ta'sir: Kanban (vazifa muddati), HR (ish kunlari kalendari)]

32. Lid to'lov intizomi belgisi (EP-MKT-091) Finance AR dan keladi — bu ma'lumot real-time SSE/event orqali yangilanadimu yoki kunlik cron; va lid kartasida belgi ko'ringan menejer qancha muddat o'tgach avto-eslatma oladimi? [⤳ ta'sir: Moliya (AR aging), CRM, Bildirishnoma]

33. ROI foyda asosli formulasida tannarx ma'lumoti MES/PP dan keladimu yoki Moliyadan — agar bir mahsulot uchun bir necha aktiv tannarx versiyasi bo'lsa (FIFO tufayli) qaysi narx marketingga ko'rsatiladi? [⤳ ta'sir: Moliya (FIFO), MES (OEE/tannarx), PP (mahsulot tannarxi)]

34. Upsell AI tavsiyasi (EP-MKT-098 "wallet share") qachon yangilanadi — har yangi buyurtma kirgan zahotmi, haftada bir cron, yoki faqat menejer so'ragandami; va tavsiya mijoz kartasida qancha vaqt saqlanib keyin eskiradi? [⤳ ta'sir: SD (upsell buyurtma), AI servis, CRM]

35. Kontent post "joylandi" holatiga o'tganda ijtimoiy tarmoq statistikasi (layk/qamrov/izoh) qanday qisqa muddatli oraliqda sync bo'ladi — real API polling/webhook yoki qo'lda kiritish; va API limit xatosi bo'lganda fallback qanday? [⤳ ta'sir: AI integratsiya (Telegram/Instagram API), SocialInbox]

36. Mijoz yillik forecast (EP-MKT-095) PP/MPS ga "orientir" sifatida kiritilganda u haqiqiy band qilish (reservation) triggerlaydimi yoki faqat ko'rsatish uchunmi; va forecast keskin o'zgarsa (±30%) PP avtomatik qayta hisoblaydi yoki faqat ogohlantirish? [⤳ ta'sir: PP (MPS), WMS (material zaxira), Moliya]

37. Lid menejerga taqsimlashda "round-robin" algoritmi menejer ta'tilda bo'lsa yoki ish yuklama limiti (ochiq lidlar soni) chegaridan oshsa qanday ishlaydi — keyingiga o'tadimi va o'tish qoidasi kodda qattiq qo'yilganmi yoki sozlanadimi? [⤳ ta'sir: HR (ta'til statusi), SD (lid qabul), Kanban (yuklama)]

38. Marketing kontent darslik (LMS) kartaga biriktirilganda marketing xodimi darslikni tugatamagani uchun oyligi bloklanish holati paydo bo'lsa — bu blok qaysi modul triggerlaydi (LMS→HR→Payroll zanjiri) va qancha kechikish bilan? [⤳ ta'sir: LMS (darslik gate), HR, Payroll (oylik-gate)]

39. Papka raqami (PT/KT/E) bo'yicha "takror qil" (EP-MKT-097) so'rovida eski тех карта narxlar o'zgargan bo'lsa — yangi narx avtomatik qo'llaniladimi yoki sotuvchi tasdiqlagunga qadar qoralama holati bo'ladimi? [⤳ ta'sir: SD (narx tarixi/FIFO), Dizayn (макет versiyasi), PP (тех карта)]

40. Marketingdan SDga lid "iliq" holatida topshirilganda (EP-MKT-074) SD menejer 15 daqiqa ichida "qabul" bermasa — lid orqaga marketingga qaytadimi yoki rahbarga eskalatsiya bo'ladimi; va bu holat kim boshqaradimi? [⤳ ta'sir: SD (lid qabul), Kanban (eskalatsiya), HR (menejer KPI)]

41. Mijoz brend standarti (EP-MKT-086) kartochkasiga yangi Pantone kodi yuklanganda bu o'zgarish Dizayn bo'limiga avto-bildirishnoma yuboradimi va faol buyurtmalardagi maketlarda shu rang ishlatilgan bo'lsa QC/Dizayn xabardor bo'ladimi? [⤳ ta'sir: Dizayn (rang standart), QC (brak sababchisi), CRM]

42. To'lov intizomi blocki bo'lmay faqat "ogohlantirish" bo'lganda (egasi qaroridan) — bir menejer ogohlantirish ko'rib ham lid ishi davom ettirsa va keyinchalik zararli deal bo'lsa, bu qarorning audit-log izi qanday saqlanadi? [⤳ ta'sir: Moliya (AR risk), F1 RBAC, A6 audit-log (7 yil)]

43. Marketing "diler" kanali (8-kanal) uchun diler o'zi birlamchi lid muallifi sifatida tizimga kiradimi (diler RBAC roli bilan portal) yoki faqat marketing xodimi diler nomidan kiritadi — va diler portali bo'lsa uning ko'rish doirasi qanday? [⤳ ta'sir: CRM (diler kartasi), RBAC, SD (manbali lid)]

44. Mahsulot rentabelligi ko'rinishi (EP-MKT-111) faqat boshliq+ega uchun rol-asosli maxfiy bo'lganda — agar marketing menejer "umumiy ROI" hisobotini ko'rsa uning ichida yashirilgan foyda/dona raqami boshqa yo'l bilan oshkor bo'lib qolishi mumkinmi (masalan CSV eksportda)? [⤳ ta'sir: RBAC (maydon darajasi), F1 xavfsizlik, Hisobot eksporti]

45. Ko'rgazma ROI hisobotida ko'rgazma xarajatlari moddalariga qo'shimcha ishtirokchi xodimlarning komandировka xarajatlari (HR) avtomatik ulanadimi — ular alohida modda (EP-MKT-115 "vakil safari") sifatida biriktirilsa ham, yoki qo'lda kiritilishi kerakmi? [⤳ ta'sir: HR (komandировka/safar), Moliya (xarajat moddalari), ko'rgazma ROI]

46. Avtomatik "sodiqlik segmenti" hisobidan 3 oy buyurtma bermagan mijozga win-back kampaniyasi (EP-MKT-080) avto-start bo'lganda: agar bu mijoz ayni paytda SD da yangi aktiv lid yaratgan bo'lsa — ikki parallel muloqot qanday muvofiqlashtiriladimi? [⤳ ta'sir: SD (aktiv lid), CRM (mijoz holati), Kanban (parallel vazifalar)]

47. "Yangi mahsulot turi talabi" statistikasi (EP-MKT-106) 6-departamentga (Rivojlanish) hisobot tariqasida qachon va qanday formatda ketadi — avtomatik oylik hisobot, yoki faqat talablar soni qiymat chegarasini oshganda triggerlanadimi? [⤳ ta'sir: 6-departament (Rivojlanish/strategiya), PP (yangi liniya investitsiyasi), Director]

48. Mijoz kontakti o'zgarganda (EP-MKT-103) "darrov aloqa vazifasi" Kanban da kim nomiga yaratiladimi — eski menejer, yangi menejer (agar tayinlangan bo'lsa), yoki savdo boshlig'i; va bu vazifa qancha muddatli bo'ladi? [⤳ ta'sir: SD (menejer birikma), Kanban (vazifa mas'ul), CRM]

49. Marketing → SD oltin-ip zanjirida lid SD ga o'tgach marketing modulida lid statusi avtomatik "o'tkazildi" bo'ladimi, yoki SD'da mijoz kartochkasi yaratilib "bog'langan" event kelgunga qadar marketing da "aktiv" ko'rinadimu — ikki modul o'rtasida qanday event handshake bo'ladi? [⤳ ta'sir: SD (mijoz karta), CRM, EventEmitter2 (event oqimi)]

50. Inbox yagona kanal (EP-MKT-062) uchun Telegram bot webhook ishlamay qolsa (provider xatosi) — tizim fallback sifatida nima qiladi: polling rejimiga o'tadimi, mas'ulga xato bildirishnomasi yuboradimi, va xizmat davomiylik SLA (A5 offline talabi) qanday ta'minlanadimi? [⤳ ta'sir: AI integratsiya (Telegram), Bildirishnoma, A5 offline/uptime]
