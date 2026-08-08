# ORG — Org-struktura / KARTALAR — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Karta yaratilganda `cards` jadvalidagi trigger qaysi boshqa jadvallarga avtomatik yozuv qo'shishi kerak (RBAC rol ro'yxati, LMS darslik bog'lanish, onboarding vazifalar, savol-bank) va bu insertlar muvaffaqiyatsiz bo'lsa qanday rollback mexanizmi ishlaydi? [⤳ ta'sir: Auth/RBAC, LMS, HR onboarding, Kanban]

2. Xodim bir vaqtning o'zida ikkita kartaga biriktirilganda (har biri 0.5 stavka), ulardan biri vaqtincha muzlatilsa — muzlatilgan kartaning oylik hissasi to'xtatiladi, aktiv karta oyligi esa o'zgarishsiz qoladimi yoki qayta hisoblanadimi; bu o'zgarish Payroll jadvaliga qanday event orqali etkaziladi? [⤳ ta'sir: Finance/Payroll, HR]

3. Razryad ko'tarilish imtihoni boshlanishi uchun "min 3 oy kutish" shartini kod qanday tekshiradi — `razryad_history` jadvalidagi oxirgi o'zgarish sanasiga asoslanib, yoki alohida `exam_requests` jadvalidagi so'nggi muvaffaqiyatli/muvaffaqiyatsiz yozuvgami; agarda xodim razryadni oldin tushirgan bo'lsa bu hisobga olinadimi? [⤳ ta'sir: LMS, HR]

4. ЦКП kaskadi (EP-ORG-112): quyi karta natijasi yuqori kartaga qachon to'planadi — real-vaqtda (event-driven) yoki cron orqali; bir nechta quyi karta bir vaqtda yangilanishi (race condition) bo'lsa, yuqori karta yig'indisi noto'g'ri hisoblanganda nima qiladi tizim? [⤳ ta'sir: Director dashboard, Reports, AI]

5. Karta versiyalanish (EP-ORG-125): yo'riqnoma yangi versiyasiga "xodim qayta tasdiqlashi shart" deb belgilanadi; tasdiqlash muddati (necha kun) qanday sozlanadi, muddat o'tsa xodimning ERP kirishi bloklanadimi yoki faqat ogohlantirish keladimi, bu qarorni kim qabul qiladi? [⤳ ta'sir: Auth, HR, LMS]

6. Kartaning `to'liqlik %` ko'rsatkichi qanday formula bo'yicha hisoblanadi — 12 majburiy bo'lim teng vaznga egami yoki har bo'limning vazni alohida sozlanadimi; 100% dan past karta egalari oylik toʻlovga ta'sir qiladimi (hozir faqat darslik gate belgilangan)? [⤳ ta'sir: Finance/Payroll, HR]

7. I.o. tayinlash (EP-ORG-060): I.o. xodimning asosiy kartasi bilan parallel ishlash davomida ikki kartaning ЦКП hisobotlari bir xil vaqtda kelib to'qnashsa — qaysi karta ЦКП'si ustunlik qiladi va AI ikki kartaning baholari o'rtasida qanday ajratadi? [⤳ ta'sir: AI, Finance/Payroll]

8. Org-daraxt ko'chirishda (EP-ORG-063): karta boshqa bo'limga transfer qilinganda uning ostidagi quyi kartalar ham avtomatik ko'chirib ketilishi kerakmi yoki faqat o'sha kartami; rekursiv ko'chirish amalga oshirilsa RBAC yangilanishi va event-chain qancha vaqt ichida yakunlanishi shart? [⤳ ta'sir: Auth/RBAC, Coordination, HR]

9. Razryad pasayish (EP-ORG-134): AI "statistik ko'rsatkich pasaydi" deb topsa va rahbar tasdiqlasa, lekin xodim e'tiroz bildirsa — e'tiroz qabul qilish muddati qancha kun, jarayon davomida razryad muzlatilgancha qoladimi yoki pasayish kuchga kiradimi; e'tiroz ko'rib chiquvchi rol kim? [⤳ ta'sir: HR, Coordination, Finance/Payroll]

10. Karta eskirish eslatmasi (EP-ORG-137): cron har tunda ishlaydimi yoki "1 yil o'tishi" momentida event trig­gerlanadimi; "ko'rib chiqing" topshirig'i Kanban'ga tushadimi yoki faqat Telegram xabar keladimi; topshiriqni kim yopadi va bu tasdiqlash audit-logga tushishi shart? [⤳ ta'sir: Kanban, Coordination, HR]

11. Vakansiya aging (EP-ORG-072): rang o'zgarganda (sariq → qizil) HR va tegishli otdeleniye rahbariga avtomatik push xabar borishi kerak; agar bir xil vaqtda 5+ vakansiya qizilga o'tsa — barchasi alohida xabarlardami yoki birlashtirilgan digest ko'rinishida; xabar oluvchilar ro'yxati org-daraxtdan dinamik olinadimi? [⤳ ta'sir: HR, Notifications, Director dashboard]

12. Ko'p-karta stavka ulushi (EP-ORG-066): xodimning jami stavkasi 1.0 dan oshmoqchi bo'lganda — blok qachon ishga tushadi (insert/update paytidami yoki oylik hisob vaqtidami); owner ruxsatini berish uchun qaysi rol va qaysi endpoint ishlatiladi; bu ruxsat qancha muddat amal qiladi? [⤳ ta'sir: Finance/Payroll, Auth/RBAC]

13. Karta bloki (EP-ORG-034): 3 kun sababsiz bo'sh qolganda avto-blok ishga tushadi; blokni ochish uchun "HR dalolatnoma → direktor → super admin" zanjirida har bosqich qachon texnik bo'shatadiladi — barcha 3 tasdiq yig'ilgandan keyinmi yoki har bosqich qisman ruxsat beradimi? [⤳ ta'sir: Auth, HR, Coordination]

14. Karta PDF eksport (EP-ORG-138): "rasmiy yo'riqnoma PDF" generatsiyasi sinxron (HTTP kutish) yoki asinxron (queue) amalga oshiradimi; PDF shablon versiyasi karta versiyasi bilan bog'lanishi kerakmi; PDF da raqamli imzo (QR/barcode) qanday texnologiya bilan qo'shiladi? [⤳ ta'sir: Hujjat workflow, HR]

15. Savol-bank (EP-ORG-053): razryad yoki karta turi o'zgarganda, eski savollar avtomatik arxivlanadimi yoki yangi razryadga ham ko'chirib o'tiladimi; AI tomonidan generatsiya qilingan savollar HR tasdig'idan o'tmasdan ishlatilishi mumkinmi; savol banki umumiy yoki har karta uchun alohidami? [⤳ ta'sir: LMS, AI, HR]

16. Karta-xodim moslik bahosi (EP-ORG-030): AI qancha tezlikda (real-time yoki tungi batch) moslik hisobini yangilaydi; qaysi modul yangi ma'lumot yetkazilganda trigger yuboriladi (MES shift yakunlanganda, QC brak qayd qilinganda, LMS test o'tilganda); eng so'nggi baholash sanasi kartada ko'rinadimi? [⤳ ta'sir: AI, MES, QC, LMS, HR]

17. Karta → RBAC avtomatik sinxronizatsiya (EP-ORG-023): karta bo'limga ko'chirilsa yoki holati o'zgarse, xodimning joriy faol sessiyalari (JWT tokenlar) qachon bekor qilinadi — darhol (websocket invalidate) yoki keyingi kirish vaqtidami; qancha faol sessiya bo'lishi mumkin bir vaqtda? [⤳ ta'sir: Auth, Security]

18. ЦКП norma xodimga shaxsiy tuzatish (EP-ORG-051): shaxsiy tuzatishni kim kirита oladi (HR, rahbar, yoki faqat owner), bu tuzatish audit-logga sababli yoziladimi, va tuzatish faqat joriy oyga tegishlimi yoki doimiy yangi norma sifatida saqlanadimi? [⤳ ta'sir: Finance/Payroll, AI, HR]

19. Vakant karta ЦКП delegatsiyasi (EP-ORG-136): vakansiya bo'lganda ЦКП yuqori kartaga o'tganda — yuqori kartaning joriy ЦКП yukiga qo'shimcha ishmi yoki alohida "qo'shimcha ish" yuki sifatida ko'rinadimi; bu yuk Payroll formulasida ustama hisob qiladimi (EP-ORG-061 i.o. ustamasi kabi)? [⤳ ta'sir: Finance/Payroll, Coordination, Director]

20. Org-sxemadagi ma'lumot ikkita manba (EP-ORG-040): hozir `org_nodes` va `cards` ikki jadval — to'liq yagona DDLga o'tishda mavjud `manager_id` NULL bo'lgan 30+ xodim (MANAGER_OF_SENDER bug) qanday migratsiya strategiyasi bilan aniqlanib kartaga bog'lanadi; migratsiya paytida tizim to'xtaydi yoki online migration qilinadimi? [⤳ ta'sir: HAMMA modul, Coordination]

21. Onboarding bosqichlari (EP-ORG-141): "o'qish → imtihon → rahbar xulosasi → mustaqil-faol" holat o'tishida har bosqichda oylik koeffitsienti qancha (masalan 0.7, 0.85, 1.0); koeffitsient kartada yoki `razryad_levels`da saqlanadimi; HR bu koeffitsientni xodim asosida individual tuzata oladimi? [⤳ ta'sir: Finance/Payroll, HR, LMS]

22. Karta shabloni o'zgarganda "ixtiyoriy moslashtirish" tugmasi (EP-ORG-058): tugma bosilganda qaysi maydonlar yangi shablon qiymatiga almashadi, qaysilari saqlanib qoladi (xususiy/tahrirlangan maydonlar); bu amalning preview (oldindan ko'rish) funksiyasi bo'lishi kerakmi; agar xodim shablonga moslashtirsa oldingi versiya arxivda qoladimi? [⤳ ta'sir: HR, Audit-tarix]

23. Karta talablari ro'yxati (EP-ORG-087): rekruting moduli vakant karta talabrlarini o'qib nomzodlar bilan avtomatik solishtiradi — bu solishtirish qaysi endpoint/event orqali triggerlanadimi; nomzod talabni 80% qondirganda "taklif qiling" yoki 50% dan past bo'lganda "rad eting" maslahatini kim (AI yoki HR) ko'rsatadi? [⤳ ta'sir: HR recruitment, AI, CRM]

24. Xato-katalog (EP-ORG-097): bir karta uchun qancha xato turi saqlanishi mumkin (limit bormi); xato statistikasi oyma-oy to'plana boradimi yoki faqat joriy oy ko'rinadimi; AI razryad pasayishni taklif qilish uchun nechta takroriy xato va qanday vaqt oraliqida ro'yxatga olishi shart? [⤳ ta'sir: QC, MES, AI, Finance/Payroll]

25. Sertifikat/litsenziya 30 kun ogohlantirish (EP-ORG-047): ogohlantirish faqat HR'ga boradimi yoki kartaga tegishli xodim va uning to'g'ridan rahbariga ham boradimi; ogohlantirish Telegram bot orqalimi yoki ERP ichki notifikatsiya tizimimi; sertifikat amal muddati o'tib ketsa karta avtomatik muzlatila oladimi (inson tasdig'isiz)? [⤳ ta'sir: HR, Auth, Notifications]

26. Karta raqamlash (dublikat 01/02): avto-raqamlash bir bo'lim ichida sanab chiqadimi yoki butun org-daraxt bo'yichamidir; raqam bir marta belgilangandan keyin o'zgartirilishi mumkinmi (masalan 01 kartasi o'chsa 02 → 01 bo'ladimi yoki ketma-ketlik saqlanadimi); bu raqam boshqa modullarda (Payroll, HR hujjat) tashqi identifikator sifatida ishlatilsa o'zgarish qanday kaskad qiladi? [⤳ ta'sir: HR, Finance/Payroll, Hujjat]

27. Karta → 7-otdeleniye marshrutlash (E5 printsip): bir karta bir vaqtda ikki xil otdeleniyadagi bo'limlarga xizmat ko'rsatsa (masalan qo'shimcha karta boshqa departamentda), Coordination topshiriq marshrutlash qaysi otdeleniyadagi rahbardan tasdiq so'raydi — asosiy karta joylashgan otdeleniyadanmi? [⤳ ta'sir: Coordination, Auth/RBAC]

28. Razryad attestatsiya (EP-ORG-092): "xavfli/texnik kartalarga davriy attestatsiya" — qaysi karta turlari "xavfli/texnik" deb belgilanadi va bu belgilashni kim kiritadi (master-data sifatida); 2 yillik davr karta yaratilgan sanasidan hisoblaniladimi yoki birinchi razryad berilgan sanasidan; attestatsiya o'tmasa muzlatish avto bo'ladimi yoki inson tasdig'i shart? [⤳ ta'sir: LMS, HR, Auth]

29. AI gap-analiz (EP-ORG-132) real-vaqt yangilanishi: xodim yangi ko'nikma qo'shganda yoki LMS da kurs o'tganda gap-analiz darhol qayta hisoblaniladimi; gap to'liq yopilganda (0% gap) karta rahbariga avtomatik "razryad ko'tarishga tayyormi?" xabari boradimi; bu xabar qachon va kim tasdiqlashi shart? [⤳ ta'sir: LMS, AI, HR, Coordination]

30. Ko'p kartali xodim onboarding: xodim birinchi kartaga yangi biriktirilganda onboarding bosqichlari boshlanadi; xodim ikkinchi kartaga ko'shimcha biriktirilganda ham yangi onboarding yuklanadimi yoki ikkinchi karta uchun onboarding qisqartirilganmi; ikkinchi karta LMS darsligi birinchidan farqli bo'lsa ikkita parallel kurs davom etadimi? [⤳ ta'sir: LMS, HR, Finance/Payroll]

31. Karta import (EP-ORG-075) tranzaksiya xavfsizligi: Excel importda 500 satr yuborilsa va 450 ta muvaffaqiyatli, 50 ta xato bo'lsa — to'g'ri 450 ta yoziladi va xato 50 ta qaytariladimi (partial commit) yoki hammasi rollback bo'ladimi; import job background queue'da ishlaydi va foydalanuvchi progress ko'radimi? [⤳ ta'sir: HR, Queue/BullMQ]

32. Karta holati muzlatish → vakant → arxiv o'tish qoidalari: har holat o'tishida qanday shart tekshiriladi (masalan muzlatilgan → vakant o'tish uchun muzlatish sababi yopilganmi, oylik hisob to'xtatilganmi); ushbu holat mashinalari (state machine) kodni uchun qaysi modul javobgar va holat o'tishi voqeasi audit logga tushishi kerak? [⤳ ta'sir: HR, Finance/Payroll, Auth]

33. Karta to'liqlik % imtihonga ta'siri: xodim razryad imtihon so'raganda kartaning "to'liqlik %" qanday chegara belgisi bo'lishi kerak (masalan ≥70% to'liqlikda imtihonga qo'yiladi); agar karta to'liq emas bo'lsa imtihon bloklanadimi yoki faqat ogohlantirish beriladimi; bu holda rahbar overridе qila oladimi? [⤳ ta'sir: LMS, HR]

34. Mentor-karta (EP-ORG-116) bog'lanishida ruxsat kengaytirish: mentor-karta biriktirilganda mentor xodimning faol sessiyasiga mentee kartasiga o'qish ruxsati (ba'zi maxfiy maydonlarsiz) avtomatik qo'shiladimi; mentoring davri tugaganda bu ruxsatlar avtomatik olinadimi yoki qo'lda tozalanishi kerakmi? [⤳ ta'sir: Auth/RBAC, HR]

35. Karta-o'zaro bog'lanish (EP-ORG-108): karta daraxtida `parent_card_id` NULL bo'lgan (L0 — egasi) kartadan boshlab 7 qatlam chuqurlikka rekursiv so'rov bajariladi; bu so'rov N+1 muammo hosil qilmasligi uchun qanday optimizatsiya (CTE/materialized view) ishlatilishi kerak; o'rtacha 142 nodeli daraxt uchun qabul qilinadigan yuklash vaqti qancha (masalan <500ms)? [⤳ ta'sir: Org-UI, Director, Reports]

36. ЦКП hisobot bermaslik cron logikasi (EP-ORG-018, EP-ORG-052): "3 soat ichida hisobot yo'q → ishlamagan" cron qanday vaqt oralig'ida ishlaydi (har 30 daqiqa?); smena amalda tugagandan keyin va hisobot vaqti o'tgandan keyinmi, yoki kalendar soatiga asoslanib; bayram/ta'til kunlari bu cron o'chirib qo'yiladimi va kim o'chiradi? [⤳ ta'sir: Finance/Payroll, HR, Notifications]

37. Karta "unvon" maydoni (EP-ORG-118): unvon PDF eksportda lavozim nomidan qanday ajratiladi; unvon rasmiy buyruqda (Coordination приказ) ishlatish uchun standart format qanday (masalan "Katta mashinist, 4-razryad"); unvon o'zgarganda avvalgi hujjatlardagi eski unvon saqlanib qoladimi (immutable tarix)? [⤳ ta'sir: Coordination, HR, Hujjat]

38. Karta-karta Coordination marshruti (EP-ORG-108 + E5): tasdiq oqimi karta daraxtida "keyingi yuqori daraja" bo'yicha o'tadi; agar rahbar kartasi vakant bo'lsa (EP-ORG-022) — tasdiq avtomatik UNDAN keyingi yuqori rahbarga o'tadimi yoki to'xtab qoladi; bu "sakrash" logikasi nechinchi darajagacha ishlaydi va qanday cheklanadi? [⤳ ta'sir: Coordination, Finance/Payroll tasdiq-matritsasi]

39. Smenali karta alohida-karta printsipi (EP-ORG-094): uch smenali dastgoh uchun 3 ta karta (Operator-01/02/03) yaratiladi; ularning ЦКП manbai bir xil IoT sessiyasidan keladimi yoki har karta o'z smenasining IoT log'laridan o'z-o'zidan filtr qiladimi; smena jadval o'zgarganda (kun/tun almashuvi) karta-smena bog'lanishi avtomatik yangilanadimi? [⤳ ta'sir: MES, IoT, Finance/Payroll]

40.Штат-reja (EP-ORG-139) va vakansiya integratsiyasi: yangi karta yaratilganda tasdiqlangan shtat-reja birligiga avtomatik bog'lanish taklif qilinishi kerak; shtat-rejadagi ruxsat etilgan o'rin soni limitni oshiradigan yangi karta qo'shish blokladimi yoki faqat ogohlantirish beriladimi; bu tekshirish qaysi ro'yxatga o'tish nuqtasida amalga oshiriladi? [⤳ ta'sir: Finance (byudjet), HR, Director]

41. Karta "majburiy tizim-qaydlari" (EP-ORG-133 — IoT bosqichiga defer qilingan): hozir deferreda bo'lsa ham — "ish boshlandi/bosqich/tugadi" qaydlari qanday jadvalga tushishi rejalashtirilgan; MES sessiya jadvali (`production_sessions`) bilan karta-qayd jadvali bir xil jadvalni ishlatadimi yoki alohida bo'ladimi; bu integratsiya IoT fazasida qanday event orqali triggerlanadi? [⤳ ta'sir: MES, IoT, Finance/Payroll]

42. Karta AI bahosi ijobiy/salbiy ikki tomonlama (EP-ORG-098): AI "muvaffaqiyatli harakatlar" uchun qanday ma'lumot manbai ishlatadi (ЦКП oshib bajarilishi, muddatdan oldin tugash, brak 0%); salbiy va ijobiy ko'rsatkichlarning agreatsiya formulasi qanday (oddiy yig'indi, og'irlik, yoki rangga qarab logaritmikmi); yakuniy moslik bali (0-100) davriy arxivlanadimi? [⤳ ta'sir: AI, HR, Finance/Payroll bonus]

43. Karta → LMS darslik oylik gate (EP-ORG-027): "darslik tugamaguncha o'sha karta oyligi yo'q" — bu gate oylik hisob sanasida (oyning oxiri) tekshiriladi; agar xodim oyning 28-da kursni tugallasa shu oyning oyligi beriladi yoki keyingi oy to'lov boshlanadimi; qisman to'lov qoidasi bormi (masalan 70% kursni tugatsa 70% oylik)? [⤳ ta'sir: Finance/Payroll, LMS]

44. Karta eksport / import idempotentlik: bir xil karta ikki marta import qilinsa (bir xil `card_code` yoki `slug` bilan) — yangilash (UPSERT) bo'ladimi yoki xato qaytariladimi; import paytida `card_id` tashqi FK mavjud bo'lgan jadvallarda (RBAC, LMS, Payroll) referenslar saqlanib qoladimi yoki yitiladimi? [⤳ ta'sir: HR, Auth/RBAC, Finance/Payroll]

45. Karta-sahifa ruxsat maydoni darajasi (EP-ORG-042): "maxfiy maydonlar faqat ruxsatli kartalarga ko'rinadi" — bu maydon darajasidagi filtr BE (Drizzle select projection) yoki FE (komponent hide) da amalga oshiriladi; agar BE'da amalga oshirilmasa maxfiy ma'lumot API javobida chiqib ketishining oldini olish uchun qanday test yozilishi shart? [⤳ ta'sir: Auth/RBAC, Security, Finance]

46. Ko'p-karta oylik yig'indisi audit izlanishi: xodimning har oylik to'lov qatorida qaysi kartalardan qancha summa kelganligi ko'rsatilishi kerak (Payroll slip'da karta-bo'yicha tafsilot); agar bir karta oyligi o'rtada o'zgarsa (masalan razryad ko'tarildi) — o'sha oyning oldingi va keyingi kunlari uchun pro-rata hisob qilinishi kerakmi? [⤳ ta'sir: Finance/Payroll, HR, Audit]

47. Karta onboarding to'liqlik tekshiruvi (HR onboarding + EP-ORG-090): karta papkasining 12 bo'limidan biri bo'sh qolganda Kanban'ga topshiriq (EP-ORG-135) qaysi karta (rahbar kartasi)ga yuklanadi; rahbar o'z kartasini to'ldirishni boshqa xodimga qayta yuklay oladimi (delegatsiya); topshiriq yopilganda karta to'liqlik % real-vaqtda yangilanadimi? [⤳ ta'sir: Kanban, HR]

48. Karta silsilaviy o'chirishdan himoya (cascading delete guard): karta arxivlanganda unga bog'liq FK jadvallardagi (RBAC rollar, LMS yozuvlar, Payroll tarix, Coordination topshiriqlar) ma'lumotlar qanday muomala ko'radi — ON DELETE RESTRICT yoki SET NULL; karta arxivlangandan keyin uning FK referenslari bo'lgan jadvallarda eskirgan kartani ko'rsatuvchi indicator bo'ladimi? [⤳ ta'sir: HAMMA modul, Data integrity]

49. ЦКП formula turining IoT/MES ma'lumotiga avtomatik ulanishi (EP-ORG-050 + EP-ORG-130): "miqdor%" turi uchun IoT smena-sessiyasidagi `produced_count` avtomatik ЦКП manbai bo'ladimi; IoT sessiya yopilmasdan (crash/to'xtab qolish) holda joriy kuning ЦКП hisobi qanday hisoblanadi (qisman sessiya hisobga olinadimi); manbai noto'g'ri topilmasa AI botning muqobil so'rovi triggerlanadimi? [⤳ ta'sir: IoT, MES, AI, Finance/Payroll]

50. Karta-daraxt ma'lumot izchilligi real-vaqtda (E6 + EP-ORG-040): bir xodim kartagа biriktirib bo'lingandan keyin ikkinchi parallel so'rov (race condition) uni boshqa kartaga ham biriktirishga urinsa — PostgreSQL qanday lock mexanizmi (SELECT FOR UPDATE yoki advisory lock) ishlatiladi; karta-xodim birikmasi bir xil xodimni bir vaqtda ikki aktiv asosiy kartaga biriktirmasligini kafolatlaydigan constraint DB darajasida (unique index) yoki faqat kod darajasida tekshiriladi? [⤳ ta'sir: Finance/Payroll, Auth/RBAC, HR, Data integrity]
