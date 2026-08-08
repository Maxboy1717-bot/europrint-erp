# LMS — LMS / Ta'lim — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Xodim bir vaqtda ikkita kartaga biriktirilgan bo'lsa va ikkala kartaning ham majburiy kurslari tayinlansa — qaysi karta darsligini birinchi tugatish shart, tartib qanday aniqlanadi va Payroll ikkala oylik-gate ni qanday alohida kuzatadi? [⤳ ta'sir: Org-karta (ko'p-karta model), Payroll]

2. Karta arxivlanganda (eski lavozim bekor, yangi karta yaratilganda) — arxiv kartaning yarim tugatilgan darslik progresi nima bo'ladi: yangi kartaga ko'chiriladi, muzlatiladi yoki yo'qotiladimi? Qaysi hodisa trigger bo'ladi? [⤳ ta'sir: Org-karta (karta arxivlash), HR (transfer)]

3. Xodim nazariy testdan 2 marta yiqildi va qayta-o'qish majbur bo'ldi — qayta-o'qish muddati boshlanish triggeri nima: rahbar tasdiqlashimi, AI avtomatikmi yoki xodim o'zi boshlaydimi? Qayta-o'qish muddati birinchi o'qish muddatidan farq qiladimi? [⤳ ta'sir: HR, Notifications]

4. Amaliy imtihonni baholash uchun РД-4 (uchastka rahbari) mavjud emas (kasallik, ta'til) — zaxira baholovchi tayinlash jarayoni qanday avtomatlashtiriladi: kim trigger oladi, qancha vaqt ichida, kim tayinlanadi? [⤳ ta'sir: Org-karta (vertikal zanjir), HR, Coordination]

5. "Lavozimga xos yo'riqnoma" versiyasi yangilanganda — tizim faqat yangilangan qismni qayta-o'qitadimi yoki butun yo'riqnomani? Qaysi algoritm "o'zgargan qism" ni ajratib oladi va xodimga aniq qaysi mavzular o'zgardi deb ko'rsatadi? [⤳ ta'sir: Hujjat boshqaruvi (versiya diff), Notifications]

6. TX (texnika xavfsizligi) instruktaj sertifikati muddati tugashiga 7 kun qolganida cron qanday ishlaydi: xodim, murabbiy va rahbarga ketma-ket eslatmalar bormi, eskalatsiya intervalilari qanday? Tugasa MES darhol bloklanadimi yoki 1 kunlik "grace period" bormi? [⤳ ta'sir: MES (blok), Notifications, HR]

7. Razryad imtihoni topshirishga ariza bergan xodim — tizim 3 oylik minimal intervalga amal qilganini qanday tekshiradi: ariza qabul qilinish vaqtidami yoki imtihon sanasiga qarab? Erta ariza kelib qolsa qanday qaytariladi? [⤳ ta'sir: HR, Org-karta]

8. AI yo'riqnomadan avto-generatsiya qilgan test savollarida noto'g'ri yoki xavfli savol topilsa (masalan, xavfsizlikka zid javob to'g'ri deb ko'rsatilgan) — o'quv bo'limi tasdiqlashdan oldin AI o'zi qanday "xavfli-savol" bayroq qo'yadi va qaysi mezon ishlatiladi? [⤳ ta'sir: AI Integratsiya, Sifat/QC (xavfsizlik)]

9. Onboarding (90 kun) davomida xodim 2-oy amaliy muddat o'rtasida iste'foga ketsa — yarim tugatilgan nazorat varaqasi va amaliy imtihon natijalari qanday arxivlanadi, kelajakda shu xodim qayta kelsa avvalgi progress tiklanadimi? [⤳ ta'sir: HR (offboarding/rehire), Org-karta]

10. Kaizen taklifning PDCA tsiklida "Check" bosqichida o'lchov natijalari salbiy (ta'sir yo'q) bo'lib chiqsa — tizim avtomatik "qayta Reja" bosqichiga qaytaradimi yoki "Rad etildi" tugatadimi? Kim qaror qiladi va qaysi event yonadi? [⤳ ta'sir: AI (ta'sir o'lchovi), Coordination, Payroll (bonus)]

11. Kurs tugamaguncha oylik-gate bloklangan xodim "men kasalman" (sick leave) deb HR'ga murojaat qilsa — kasallik davomida o'qish muddati to'xtatiladi (pause)mi, davom etadimi yoki oylik-gate ham kutib turadi? [⤳ ta'sir: HR (leave management), Payroll]

12. Bir kartaning majburiy kursi boshqa kartada ham majburiy bo'lsa (masalan, TX instruktaj universal) — xodim bir marta o'qib, ikkinchi karta uchun ham "bajarildi" hisoblanadimi yoki har karta uchun alohida topshiradimi? Cross-karta kredit mexanizmi bormi? [⤳ ta'sir: Org-karta (ko'p-karta), HR]

13. "Ko'p uchraydigan xatolar" bloki QC/MES'dan jonli yangilanganda — darslikni allaqachon tugatgan xodimga yangi xato qo'shilganda avtomatik "yangi mavzu" tushadi yoki faqat keyingi o'quvchilar ko'radilarmi? Avvalgi tugatganlar uchun trigger qanday? [⤳ ta'sir: QC/Sifat (brak sabablari), MES, Notifications]

14. Video darslining "oxirigacha ko'rish" nazorati: xodim videoni tezlatib (1.5x yoki 2x) ko'rsa "to'liq ko'rildi" hisoblanadimi? Minimal real-vaqt chegarasi bormi (masalan, video 10 daq, 2x tezda 5 daq ko'rsa — hisoblanadimi)? [⤳ ta'sir: Storage (video tracker), POS Monitor]

15. Murabbiy shogirdning "amaliy mashqlar" javoblarini 3 kun ichida baholamasa — tizim qanday eskalatsiya ketma-ketligini boshlaydi, va shogirdning o'qish muddati to'xtab turadimi (murabbiy kechikishi sababli)? [⤳ ta'sir: Coordination, HR, Notifications]

16. Tashqi sertifikat (masalan, davlat ta'lim muassasasi diplomi) HR tomonidan tasdiqlanib ichki kurs o'rniga hisoblanganidan keyin — keyingi qayta-sertifikatlash (yiliga bir marta) ham tashqi sertifikat bilan o'tilishi mumkinmi yoki faqat ichki test? [⤳ ta'sir: HR (malaka tarixi), Razryad]

17. Liderlik testi (Origin) natijasiga ko'ra xodim "zaxira rahbar" sifatida belgilansa — bu LMS'da alohida leadership kurs tayinlanadimi va qaysi org-sxema darajasidan ruxsat kerak? [⤳ ta'sir: HR (vorislik), Org-karta (rahbar kartalari)]

18. "Ishdagi vaziyat" interaktiv simulyatsiyada xodim qarorini AI "xavfli" deb baholasa — faqat izoh ko'rsatadimi yoki murabbiy/rahbarga ham signal ketadimi? Bu signal MES ga ta'sir qiladimi (masalan, xavfli qaror ko'p marta qaytarilsa)? [⤳ ta'sir: AI, MES, HR]

19. Kurs kontent versiyasi yangilanib xodim o'sha kursni qayta o'qish kerak bo'lganda — uning avvalgi sertifikati qaysi holatga o'tadi: "muddati o'tdi"mi, "yangi versiya bor"mi yoki "bekor qilindi"mi? Bu holat Payroll oylik-gate'ga darhol ta'sir qiladimi? [⤳ ta'sir: Payroll (oylik-gate), Hujjat boshqaruvi]

20. Yangi reglament chiqib faqat ba'zi kartalarga tegishli deb belgilansa — reglament "tegishlilik" matritsa qanday quriladi: karta turi, departament, razryad, yoki qo'lda tanlash bo'yicha? Bu matritsa o'zgarsa avval tayinlangan testlar ham o'zgara oladimi? [⤳ ta'sir: Director (reglament), Org-karta, Notifications]

21. Murabbiy sifatida biriktirilgan xodim o'zi ham o'qish jarayonida bo'lsa (masalan, yangi lavozimga o'tganida) — shogirdga murabbiy sifatida ko'rinishi saqlanadimi yoki zaxira murabbiyga o'tib ketadimi? Ikki rol bir vaqtda bo'lishi mumkinmi? [⤳ ta'sir: HR, Org-karta]

22. Kaizen taklif Payroll bonus tizimiga ulanganida — bonus qachon to'lanadi: taklif qabul qilinganida, PDCA "Check" ijobiy natijasinidami yoki "Act" yakunlanganida? Agar taklif ko'p karta egasidan bo'lsa (ko'p-karta xodim) bonus qaysi kartaga yoziladi? [⤳ ta'sink: Payroll, Org-karta (ko'p-karta)]

23. Tijorat siri / maxfiylik moduli majburiy o'qilib tasdiqlanganidan keyin xodim keyinchalik "o'qimagan" deb da'vo qilsa — immutable audit-log qanday ma'lumot saqlaydi (vaqt+IP+qurilma+tasdiq harakati) va bu yuridik hujjat sifatida export qilinadimi? [⤳ ta'sir: Hujjat/CC (yuridik arxiv), HR, Xavfsizlik]

24. "Muvaffaqiyatli harakatlar" blankasini rahbar to'ldirganda — bu kursga qo'shilish jarayoni qanday: darhol ko'rinadimi, o'quv bo'limi tasdiqlashini kutadimi, yoki rahbar to'g'ridan kursga yozaverish huquqiga egami? [⤳ ta'sir: Coordination, O'quv bo'limi (НО-14)]

25. Razryad imtihonida xodim nazariy testdan o'tib amaliy imtihondan yiqilsa — nazariy test natijasi saqlanadimi (keyingi amaliy uchun qayta topshirilmaydi) yoki ikkalasini boshidan topshirish kerakmi? 3-oylik minimal interval nazariy yiqilishda ham qaytadan sanalanadimi? [⤳ ta'sir: HR, Org-karta]

26. LMS Telegram bot orqali o'qish eslatmasi yuborilganda va xodim botda javob bersa (masalan, "o'qidim" yoki "keyinroq") — bu javob LMS'da holat o'zgartiradimi va audit-logga tushadimi? [⤳ ta'sir: Telegram bot, Notifications, AI]

27. Kurs uchun tayinlangan muddat (masalan, onboarding 2 oy) davomida tizim har hafta qanday avtomatik progress hisobotini chiqaradi: kim oladi (xodim, murabbiy, HR, rahbar — hammami yoki sozlanadigan), qaysi formatda (Telegram, email, LMS dashboard)? [⤳ ta'sir: Notifications, HR, AI (hisobot)]

28. Micro-modullar "ketma-ket" qoidasiga ko'ra keyingi ochilmaydi — ammo xodim birinchi micro-modulni yarim qoldirib (o'qishni to'xtatib) qolsa: timer davom etadi yoki to'xtaydimi? Qayta kirganda o'sha joydan boshlanadimi? [⤳ ta'sir: LMS progress (resume state)]

29. ERP tizimida ishlash ko'nikmasi kursi (EP-LMS-066) — bu kurs tizim yangilanishi (yangi modul qo'shilishi) bilan avtomatik yangilanadimi? Tizimdan foydalangan xodimlar yangi funksiya qo'shilsa "yangilanish kursi" olishlari shart bo'ladimi? [⤳ ta'sir: barcha modul (tizim savodxonligi), AI (avto-yangilash)]

30. Nazorat varaqasini kitob formatida PDF eksport qilishda imzo o'rnida raqamli tasdiqni vakillovchi element (vaqt+IP+to'liq ism) keltiriladi — bu PDF sudda yoki mehnat inspeksiyasida yuridik hujjat sifatida tan olinishi uchun qanday minimal ma'lumot bo'lishi kerak va bu talablar LOYIHA-QOIDALARI (F5) bilan qanday mos keladi? [⤳ ta'sir: Hujjat/CC, HR (huquqiy himoya)]

31. Razryad pasayishi (ORG-134: AI taklif → RD-4 tasdiq) bo'lganda — pastlagan razryadga mos darslik karta avtomatik qayta tayinlanadimi yoki xodim eski razryadning darsligi bilan qoladi? Bu holat Payroll'ga qachon va qanday event bilan yetib boradi? [⤳ ta'sir: Org-karta (razryad), Payroll, Notifications]

32. Departament bo'yicha o'quv qatlamlashda (EP-LMS-068: umumiy + departament + lavozim) — "departament" qatlami kursi yangi xodimga qaysi trigger bilan tayinlanadi: kartaga biriktirish eventimi yoki departamentga tashrifmi? Departament o'zgarganda eski departament kurslari nima bo'ladi? [⤳ ta'sir: Org-karta (departament transfer), HR]

33. AI kursni nazorat qilib PDF hisobot yaratganda — hisobot tarkibiga nimalар kiradi (kim o'qidi/kim qoldi/tushundimi), bu hisobot qanchalik tez-tez yaratiladi (real-time, kunlik, haftalik) va kim undan foydalanadi? [⤳ ta'sir: AI (markaziy), Director, HR, Reports]

34. Smena tableti (POS Monitor) orqali micro-modul o'qilayotganda to'satdan internet uzilib qolsa — offline rejimda o'qish davom etadimi, progress qanday saqlanadi va internet tiklanganda sinxronizatsiya qanday ishlaydi? [⤳ ta'sir: POS Monitor (offline), Storage]

35. "Mustaqil ishga qo'yish tartibi"dagi har bosqich uchun mas'ul va vaqt belgilangan — bir bosqich muddati o'tib bajarilmasa qanday avtomatik eskalatsiya mexanizmi ishlaydi: kim ogohlantirish oladi, necha soat/kun o'tgandan keyin? [⤳ ta'sir: HR (onboarding), Org (РД-4), Coordination, Notifications]

36. LMS test banki savollarini kim o'zgartira oladi (RBAC): faqat o'quv bo'limi (НО-14), rahbarlar ham o'z lavozim savollarini tahrir qilishi mumkinmi? Savol o'zgartirilganda shu testni avval o'tgan xodimlar natijasi saqlanadimi yoki qayta topshirish kerakmi? [⤳ ta'sir: AI (test generatsiya), HR, Org-karta]

37. Bir kursni ikki xodim bir vaqtda o'qiyapti va bir xil savolga bir xil vaqtda javob berayotgan bo'lsa — race condition bormi (masalan, ikkalasi ham eng so'nggi "muvaffaqiyatli harakat" ro'yxatini yangilayapti)? Backend event queue yoki optimistic locking ishlatiladimi? [⤳ ta'sir: BullMQ/EventEmitter (queue), DB locking]

38. Xodim kursni tugatib sertifikat oldi, lekin keyinchalik u kursning ba'zi savollariga noto'g'ri javob bergani aniqlanib qolsa (masalan, test bank xatosi tuzatilganda) — allaqachon berilgan sertifikat qaytarib olinadimi? Bu holat uchun qanday "revoke" jarayoni bor? [⤳ ta'sir: HR (sertifikat arxivi), AI, Hujjat/CC]

39. LMS dashboard'da bo'lim/karta kesimida tugatish foizi ko'rsatilganda — bu foizga faqat majburiy kurslarmi yoki ixtiyoriy kurslar ham kiradimi? Hisobot filtrlash imkoni bormi? [⤳ ta'sir: Director, HR dashboard, Reports]

40. "7 departament tuzilmasi" majburiy kursi barcha yangi xodimga tushadi — bu kurs Vysotskiy-7 org-sxemasi o'zgarganida (yangi bo'lim qo'shilsa) avtomatik yangilanadiami? Allaqachon shu kursni tugatganlar yangilangan versiyani qayta o'qishi shart bo'ladimi? [⤳ ta'sir: Org (Vysotskiy-7 daraxti), Notifications]

41. Xodim RD-4 xulosasini olgandan so'ng "mustaqil ishga ruxsat" buyruqi chiqishi uchun tizim avtomatik buyruq loyihasini qachon yaratadi: barcha bosqichlar yopilishi bilanoqmi yoki HR tomonidan qo'lda trigger bosilisinidami? Bu loyiha CC moduliga (hujjat oqimi) qanday boradi? [⤳ ta'sir: HR (buyruq arxivi), Hujjat/CC, Org-karta (karta faollashishi), Payroll]

42. Xodim kasallik yoki favqulodda sababga ko'ra reglament testini belgilangan 7 kun ichida topshira olmasa — uzr sababini tizimga kiritish jarayoni qanday, kim tasdiqlaydi va muddatni uzaytirish qancha kunlarga bo'ladi? [⤳ ta'sir: HR, Notifications, Coordination]

43. AI chatbot (EP-LMS-014) darslik mavzularidan tashqari umumiy ERP bo'yicha savolga javob berganda — RBAC doirasida qaysi ma'lumotlarni ko'rsatish ruxsat etiladi (masalan, chatbot o'z oyligini aytadimi)? Chatbot log'lari kim ko'ra oladi? [⤳ ta'sir: AI Integratsiya, Xavfsizlik (RBAC)]

44. Davriy qayta-tasdiq (yiliga bir marta qisqartirilgan test) uchun — "qisqartirilgan" degani nechta savol (original testning nechi foizi) va bu foiz HR tomonidan sozlanadimi, yoki tizim o'zi algoritmik tanlaydi? [⤳ ta'sir: HR (sozlash), AI (savol tanlash)]

45. Kurs glossariyidagi atama izohini AI chatbot izohlayotganda va izoh noto'g'ri (eskirgan yoki xato) bo'lsa — xodim "noto'g'ri izoh" deb nishon qo'ya oladimi va bu signal o'quv bo'limiga qanday tushadi? Tuzatish jarayoni qanday avtomatlashtiriladi? [⤳ ta'sir: AI Integratsiya, O'quv bo'limi (НО-14)]

46. Konkret domen-bilim modullari (masalan, "gofra turlari") material katalogi bilan bog'langanida — material katalogiga yangi gofra turi qo'shilsa, bu kurs mavzusiga avtomatik "yangi element" qo'shiladi va allaqachon tugatgan xodimlar "yangilangan" eslatmasini olishlari lozimligi qanday trigger bilan aniqlanadi? [⤳ ta'sir: Ombor/Material katalogi (WMS), Notifications]

47. "Ish joyi va lavozim vositalari" mavzusi aktivlar/jihozlar katalogi bilan bog'liq — jihozlar inventarizatsiyasi natijasida karta uchun ko'rsatilgan jihoz yo'qolgan yoki eskirgan deb belgilansa LMS'dagi shu mavzu avtomatik "yangilash kerak" bayrog'i oladimi? [⤳ ta'sir: Aktivlar/Jihozlar moduli, Org-karta]

48. Xodimga onboarding jarayonida ham majburiy kurslar (90 kun rejasi), ham yangi reglament testi bir vaqtda tushibdi — tizim ularni qanday ustuvorlik tartibida ko'rsatadi (onboarding birinchimi, reglament birinchimi) va bitta qoldirilsa ikkinchisiga ta'sir qiladimi? [⤳ ta'sir: HR (onboarding), Director (reglament), Notifications]

49. LMS da "o'qish tarixi arxivi" xodim 7 yil saqlangan — lekin shu xodimning kartasi endi mavjud emas (karta tugatilgan, lavozim yo'q qilingan) bo'lsa o'qish tarixi qaysi obyektga biriktirilgan holda arxivlanadi va kelajakda kim ko'ra oladi? [⤳ ta'sir: Org-karta (arxivlash), HR, Hujjat/CC (7 yil saqlash)]

50. Razryad imtihoni natijasida HR va yuqori rahbar tasdiqlashidan keyin razryad ko'tariladi (EP-LMS-017) — lekin ular ikkalasidan biri uzoqda yoki javob bermasa (masalan, hafta dam olish kuni) tasdiqlash jarayoni qanchalik vaqt kutadi, eskalatsiya mexanizmi qanday ishlaydi va bu davr mobaynida xodimning MES/Payroll huquqlari o'sha eski razryadda qoladimi? [⤳ ta'sir: HR (tasdiq), Coordination (eskalatsiya), Payroll, MES]
