# KAN — Kanban / Vazifalar — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Kanban savati va CC `basket_state` bir-biri bilan qanday sinxronlashadi: `kanban_tasks.basket_type` va `cc_documents.basket_state` IKKI dunyo riski bor — qaysi jadval KANONIQ, qaysi VIEW bo'ladi, va FE ikkisini aralashtirib ko'rsatmaslik uchun qanday yagona API quriladi? [⤳ ta'sir: CC, H4 2-dunyo tekshiruvi]

2. Rasporyajenie (COR → KAN bridge) event zanjiri qanday ishlaydi: `RasporyajenieIssuedEvent` qabul qilinganda Kanban qaysi jadvalga INSERT qiladi, qaysi statusdan boshlanadi, va agar ijrochi o'sha payt boshqa vazifada (WIP limit=3) bo'lsa nima bo'ladi — blokmi, navbatmi yoki avtomatik keyinga surma? [⤳ ta'sir: COR, WIP limit EP-KAN-038]

3. Vazifa lavozim-kartaga berilganda (EP-KAN-108/132) va o'sha karta EGASIZ (bo'sh slot) bo'lsa — vazifa kimning savatiga tushadi, kim bildirishnoma oladi, va bu holat qancha davom etishi mumkin: cheklov bormi? [⤳ ta'sir: ORG (bo'sh karta), NTF]

4. Topshiruvchi-tasdiq qoidasi (EP-KAN-027/032 override): topshiruvchi inaktiv (ta'tilda, ishdan ketgan) bo'lsa bajarilib yopilishni kutayotgan vazifani KIM tasdiqlaydi — avtomatik o'rinbosar tayinlanadimi, eskalatsiya qilapadimi, yoki qotib qoladimi? [⤳ ta'sir: HR (ta'til handover EP-KAN-090), ORG]

5. Rollover cron (EP-KAN-063/067) 3-smenalik zavodda soat nechtada ishlaydi: birinchi smenaning rollover vaqti ikkinchi smenaga bog'liqmi, va rollover cron ishlab turgan paytda xodim vazifani manuel yopsa race condition bo'ladimi (ikki joyda bir vaqtda o'zgarish)? [⤳ ta'sir: HR (smena jadvali), MES (3 smena)]

6. WIP limit (EP-KAN-038, max 3 ta "Jarayonda") tekshiruvi qayerda amalga oshiriladi: DB constraint-mi, service layer-mi yoki FE-da; va boshliq tomonidan berilgan SHOSHILINCH vazifa WIP limitni chetlab o'ta oladimi — agar o'ta olsa limit nima uchun kerak? [⤳ ta'sir: HR intizom]

7. Shaxsiy dastur va Kanban taxta o'rtasida ikki tomonlama sinx: Kanbandagi vazifani "Jarayonda"ga surishda shaxsiy dasturda avtomatik soat-blok band qilinishi kerak — lekin shu soatga allaqachon boshqa vazifa yoki "qotirilgan slot" (tushlik/namoz EP-KAN-088) band bo'lsa to'qnashuv qanday hal qilinadi? [⤳ ta'sir: HR (smena/tushlik), shaxsiy dastur]

8. Vazifa kartaga/GSD bog'langanda (EP-KAN-014) va karta keyinchalik ARXIVLANIB yangi karta yaratilsa — o'sha eski vazifaning GSD hiyssasi qaerga o'tadi, eski kartami yoki yangi kartami, va bu ish haqi hisob-kitobiga qanday ta'sir qiladi? [⤳ ta'sir: ORG (karta arxiv EP-ORG-064), HR Payroll, KPI/GSD]

9. Buyurtma Kanban kartasida (EP-KAN-097) tiraj o'zgartirilganda (EP-KAN-127) va ishlab chiqarish allaqachon 60% bajarilgan bo'lsa — progress-bar qayta hisob-kitob qilinadi (yangimi?), bosqichlar qayta tarqatiladi, va stansiya norma-plani (EP-KAN-133) avtomatik yangilanadimi? [⤳ ta'sir: SD (buyurtma o'zgarishi), MES, PP (CRP)]

10. Karta-markazli topshiriq adresi (EP-KAN-132) va "bitta mas'ul" qoidasi (EP-KAN-078) ziddiyati: bir lavozim-kartaga bir vaqtda IKKITA xodim biriktirilgan bo'lsa (masalan, o'rinbosar davri) — vazifa ikkisiga ham ko'rinadimi yoki faqat bittasiga, va ikkalasi ham "qabul qildim" bosmasligi uchun qanday qulf mexanizmi kerak? [⤳ ta'sir: HR (i.o. EP-ORG-060), ORG]

11. Smena estafetasi (EP-KAN-112) paytida qabul qiluvchi operator IoT-tabletda tasdiqlashdan bosh tortsa yoki vaqtida kirmasa — estafeta "osilib" qoladi, keyingi smenaga tugamagan buyurtmalarning mas'ulligi qaysi operatorda hisoblanadi va OEE hisob-kitobiga ta'sir qiladimi? [⤳ ta'sir: MES (smena handover COR-099), IoT, OEE]

12. Maxfiy vazifa (EP-KAN-120) inspeksiya bo'limi uchun yaratilganda va org-sxema bo'yicha boshliq avtomatik kuzatuvchi (EP-KAN-073) bo'lishi kerak bo'lsa — lekin maxfiy vazifaning mavzusi aynan o'sha boshliq haqida bo'lsa (intizom-tergov) qanday qoida amal qiladi: avtomatik kuzatuvchi qo'shilmaydimi yoki maxfiy-izostirish? [⤳ ta'sir: HR (intizom EP-KAN-126), ORG, xavfsizlik]

13. Brak vazifasi (EP-KAN-113 `reworkFromDefect`) yaratilganda va sababchi xodim o'zini QC module-da ham KAN-da ham ko'rayotgan bo'lsa — ikki xil moduldan kelgan jarima-tavsiyasi (QC + KAN) birlashtirilmasligi uchun deduplication mexanizmi qanday ishlaydi, va AI tasdig'i (E1 printsip) QC-sidanmi yoki KAN-sidanmi so'raladi? [⤳ ta'sir: QC (brak EP-QC-090), HR, AI]

14. Zaявка material so'rovi (EP-KAN-103/136) ombor qoldig'ini tekshirganda `warehouse_stock` VIEW'ni o'qiydi — lekin shu paytda bir xil materialga PP (rejalashtirish) tomonidan rezerv (bronlash) qo'yilgan bo'lsa qoldig'i qancha: rezerv hisobga olinadimi, va agar yetmasa ta'minot vazifasi va PP reja bir vaqtda ikki xil miqdor so'rashini oldini olish uchun qanday koordinatsiya? [⤳ ta'sir: WMS (warehouse_stock H2), PP (rezerv EP-PP-068), MM]

15. Kunlik dasturni boshliq tasdiqlashi (EP-KAN-051) va SHOSHILINCH vazifa (EP-KAN-059) bir kunda maksimal 2 ta chegarasi — boshliq tasdiqlash vaqtida limit allaqachon to'lgan bo'lsa boshliq 3-chi SHOSHILINCH qo'shishga harakat qilsa qanday UX: blok+sabab+override logmi yoki faqat ogohlantirishmi, va bu log kim tomonidan ko'riladi? [⤳ ta'sir: HR intizom, Coordination]

16. Jarayon-shablon zanjiri (EP-KAN-094 `template.chain`) qadam-N yopilganda qadam-N+1 avtomatik ochiladi — lekin N-qadam "qayta ochildi" (EP-KAN-034) bo'lsa N+1 va undan keyingi qadam NIMA bo'ladi: freeze, cascade-rollback, yoki faqat ogohlantirish, va bu oqimni kim boshqaradi? [⤳ ta'sir: HR (onboarding), COR]

17. Vazifa "Bekor qilindi" holati (EP-KAN-082) va KPI/GSD hissa hisob-kitobi: bekor qilingan vazifaning bajarilmagan qismi xodim KPI foiziga salbiy ta'sir qiladimi, va bu ta'sir inson tasdig'i (E1 printsip) bilan amalga oshadimi yoki avtomatikmi — formula qanday? [⤳ ta'sir: HR Payroll, KPI/GSD, ORG]

18. Observer mention (@so'rov EP-KAN-125) dan tug'ilgan yangi sub-vazifa kimning savatiga tushadi — ijrochining savatigami, beruvchiningami yoki alohida oqimmi; va bu sub-vazifaning muddati, ustuvorligi, WIP limiti ana shu asosiy vazifaning parametrlarini meros oladimi? [⤳ ta'sir: CC, NTF]

19. Takrorlanuvchi vazifa (EP-KAN-022) cron bir kunda yaratilishi kerak bo'lgan paytda xodim ta'tilda bo'lsa (HR ta'til API) — vazifa o'rinbosarning savatiga avtomatik yo'naltiriladimi, to'xtatib qo'yiladimi yoki qotib qoladimi, va bu mantiq qanday flag bilan boshqariladi? [⤳ ta'sir: HR (ta'til), ORG (o'rinbosar)]

20. Kunlik dastur "kun yopilar" (EP-KAN-055) cron ish vaqti tugashida ishlaydi — lekin 3-smenali zavod uchun "kun tugashi" har smena uchun boshqacha; qaysi smenaga qaysi timestamp bo'yicha "kun yopilar" triggerlanadi, va keyingi kun boshida rollover cron bilan race condition bo'lmasin uchun tranzaksiya qanday tashkil qilinadi? [⤳ ta'sir: MES (smena), HR]

21. Eskalatsiya zanjiri (EP-KAN-042/043) CEO'da to'xtaydi — lekin CEO ham o'sha vazifani nazardan qochirsa: sistemada "eskalatsiya yuqori chegaraga yetdi" holati qanday qaydlanadi, egasiga (owner) bildirishnoma keladimi, va bu holat oylik hisobotda alohida ko'rsatgichga tushadimi? [⤳ ta'sir: ORG (Vysotskiy-7), DIR, NTF]

22. Vazifa muddatini cho'zish (EP-KAN-117) boshliq tasdig'i bilan amalga oshirilganda — agar o'sha vazifaning muddatiga bog'liq boshqa modul (masalan, mijozga va'da qilingan SD muddat yoki PP Gantt reja sanasi) o'zgarsa ular ham avtomatik yangilanadimi yoki faqat KAN-da o'zgarib qoladi va drift yuz beradimi? [⤳ ta'sir: SD (buyurtma muddat), PP (Gantt), CRM]

23. Telegram orqali vazifa yopish (EP-KAN-085 `task.viaTelegram`) paytida checklist (EP-KAN-080) to'ldirilmagan bo'lsa — Telegram bot "checklist tugallanmagan" deb bloklaydimi yoki ogohlantirish berib o'tkazib yuboradimi, va Telegram orqali kiritilgan yopish-dalili (rasm/izoh) ERP'ga qanday saqlashga xavsiz yo'l bilan tushiriladi? [⤳ ta'sir: AI Integratsiya (Telegram CC-bot), NTF]

24. Ta'til handover (EP-KAN-090) uchun "har ochiq vazifaga o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi" darvozasi — lekin xodimda 50+ ochiq vazifa bo'lsa va ularni bir-bir ko'rib chiqish amaliy emas bo'lsa: massiv topshirish (bulk-assign) mexanizmi bormi, va o'rinbosar WIP limitiga (max 3 "Jarayonda") tiqilib qolsa nima bo'ladi? [⤳ ta'sir: HR (ta'til), ORG]

25. Stansiya-operator biriktiruvi o'zgarsa (EP-KAN-137) va o'sha stansiyadagi ochiq "Jarayonda" kartalar yangi operatorga o'tadi — lekin yangi operator allaqachon WIP limit=3 da bo'lsa: kartalar navbatga (queue) turadimi yoki WIP limitni buzib o'tadimi, va eski operator bu kartalardan to'liq chiqib ketadimi? [⤳ ta'sir: HR (stansiya biriktiruv), MES, WIP limit]

26. Buyurtma bekor qilinganda (EP-KAN-104 `card.cancelled`) va "Печать" bosqichi allaqachon bajarilgan bo'lsa — sarflangan material (qog'oz, bo'yoq) GL'da qanday qaydlanadi, omborda xom-ashyo sifatida qaytariladimi yoki chiqit hisoblanadimi, va bu qarorni kim tasdiqlaydi? [⤳ ta'sir: FIN (GL), WMS (warehouse_stock), QC (brak sort)]

27. Dата готовности kechikishi eskalatsiyasi (EP-KAN-105) savdoga ham ketadi — lekin mijoz allaqachon SD orqali "buyurtma qani?" deb so'ragan bo'lsa (CRM-da faol murojaat bor) eskalatsiya CRM-dagi murojaatni avtomatik yangilaydimi va sotuvchi duplikat xabar olmaslik uchun dedup qanday ishlaydi? [⤳ ta'sir: SD, CRM (mijoz bog'lanish), NTF]

28. Норма-вақт eskalatsiyasi (EP-KAN-130 `normTimeEscalation`) va IoT-tablet vaqt logi (EP-KAN-134 `task.timeLog`) bir-biriga bog'liqmi: IoT-tabletdan "boshladim" bosshgilmagan bo'lsa cron norma vaqtini necha minutdan hisoblaydi — "Jarayonda"ga o'tgan vaqtdanmi yoki "boshladim" tugmasi bosilgan vaqtdanmi? [⤳ ta'sir: MES (IoT-tablet E4), KPI/GSD]

29. "Tayyor mahsulot Упаковка → ombor/yetkazish vazifasi" (EP-KAN-128) triggerlanganda to'lov qoldig'i (EP-KAN-100 `card.paymentBalance`) sifirdan katta bo'lsa Eltib berish vazifasi BLOKLANADIMI yoki faqat ogohlantirish beriladimi — va bu qarorni kim (FIN yoki SD) berishini qoida qanday belgilaydi? [⤳ ta'sir: FIN (debitor EP-FIN-015), SD (kredit limit EP-FIN-060), WMS]

30. AI tomonidan "takrorlanuvchi muammo naqshi" aniqlashda (EP-KAN-131 `archive.patternDetect`) qanday ma'lumotlar ishlatiladi: faqat KAN arxivi-mi yoki QC reklamatsiyalar (EP-QC-011/013), COR bog'liq dokladlar, va HR intizom yozuvlari (EP-KAN-126) ham kiradi; va natija necha oylik namunaviy hajmdan ishonchli hisoblanadi? [⤳ ta'sir: QC, COR, HR, AI]

31. Kun-tartibi "qotirilgan slot"lar (EP-KAN-088: tushlik/namoz) va smena jadvali API qanday integratsiyalashadi: 1-smena va 3-smena xodimlarining namoz vaqtlari boshqacha bo'ladi — bu slot vaqtlarini avtomatik smena bo'yicha hisoblash formulasi qanday, va HR smenani o'zgartirganda slot vaqtlari ham avtomatik yangilanadimi? [⤳ ta'sir: HR (smena jadvali), MES]

32. Shaxsiy dastur "reflow" (EP-KAN-052) paytida kutilmagan SHOSHILINCH vazifa kirsa va kun to'lib qolgan bo'lsa (8-soat band) — qaysi past-ustuvorlikdagi vazifa keyingi kunga siljiydi, bu siljishni KIM qaror qiladi (AI-mi, xodim-mi, boshliq-mi), va rollover sanagichiga (EP-KAN-064) bu "majburiy siljish" ham qo'shiladi-mi? [⤳ ta'sir: HR, Coordination]

33. Bosqich bog'liqligi (EP-KAN-122 `card.blockedBy`) va PP Gantt bir-biri bilan sinxronizatsiya: PP Gantt'da Ламинация bosqichi ertalab rejalashtirilgan — lekin Печать shu tongda kechikib "bloklangan" holat yuz bersa PP reja avtomatik qayta hisob-kitob qiladiimi va AI bu haqda menejerga necha daqiqada xabar beradi? [⤳ ta'sir: PP (Gantt, CRP), MES, AI]

34. "Летучка rejimi" (EP-KAN-124 `board.standupMode`) ekranda ko'rsatiladigan "bugungi vazifalar + kechikkanlar + bloklar" qanday SQL/query bilan yig'iladi: real-time-mi yoki keshlanganmi, va 30+ terminal bir vaqtda ushbu rejimni ochar (A5 offline printsip) bo'lsa DB yuk qanday optimallashtiriladi? [⤳ ta'sur: COR (летучка), DB performance]

35. Vazifa-shablon "Оргполитика harakat-detalizatsiyasi" (EP-KAN-110 `template.fromPolicy`) dan yaratilganda — Coordination'da yangi сийосат e'lon qilinganida shu siyosatga tegishli barcha xodimlarning savatiga avtomatik vazifalar tushishi uchun "target audience" qanday aniqlanadi: lavozim-karta bo'yicha-mi, org-sxema darajasi bo'yicha-mi yoki har xodimga individualmi? [⤳ ta'sir: COR, ORG (Vysotskiy-7)]

36. Mentor kuzatuv-vazifasi (EP-KAN-095 `task.mentorWatch`) oxirida "tayyormi/yo'q" baho so'ralganda — "yo'q" deb javob berilsa LMS'da darslik davomiyligi uzaytiriladimi, yangi test yaratiladi-mi va bu HR adaptatsiya hisobotiga qanday tushadi; baho berish AI tomonidan tahlil qilinadimi? [⤳ ta'sir: LMS (darslik→oylik EP-LMS-027), HR (adaptatsiya), AI]

37. Хayfa/intizom yozuvi (EP-KAN-126 `task.disciplinaryRecord`) HR kartasiga ulanadi — lekin "HR kartasiga ulanadi" deganda qaysi jadval/maydon nazarda tutiladi: `org_node_portret` JSONB-mi, alohida `discipline_records` jadvalmi, va bu yozuv xodim KAN taxtasiga kirsa ko'rinadimi yoki faqat HR/boshliqga ko'rinadimi? [⤳ ta'sir: HR (intizom EP-KAN-126), ORG (karta model)]

38. Zaявка qog'oz so'rovi (EP-KAN-136) natijasida "sotib olish" vazifasi ta'minot savatiga tushganda — MM (Ta'minot) modulida allaqachon o'sha materialga ochiq purchase order (PO) mavjud bo'lsa duplikat zaявка yaratilmasligi uchun qanday idempotentlik tekshiruvi amalga oshiriladi va kim (KAN yoki MM) yetakchi manbadir? [⤳ ta'sir: MM (PO EP-MM-049), WMS]

39. Bajarilish reytingi (COR-073) va Kanban eskalatsiya soni (EP-KAN-045) oylik hisobotda ko'rinadigan KPI koeffitsientlariga aylanadi — bu ikki ma'lumot manbasining birlashtirilgan formulasi qanday: og'irlik koeffitsientlari qanday, va bu formula "inson tasdig'i" E1 printsipi asosida HR tomonidan tasdiqlangan va `business.constants.ts`da saqlangan bo'lishi kerakmi? [⤳ ta'sir: HR (KPI), COR, FIN (Payroll)]

40. Sinov muddati "qaror taymeri" (EP-KAN-096 `task.probationDecision`) cron 3 kun qolganda ishga tushadi — lekin HR moduli ta'til yoki bayram kunlarini hisobga olmagan holda 3 ish-kuni deya hisoblashi kerak, shu ish-kunlar hisobi qaysi kalendardan (ish-kuni kalendari yoki smena jadvali) olinadi? [⤳ ta'sir: HR (sinov muddati), MES (smena)]

41. Operator stansiyaga biriktirilmagan holda (masalan, zavod ta'miri paytida stansiya ishlamaydi) shu stansiyadagi Kanban kartalariga nima bo'ladi: "bloklangan-ta'mirda" holat alohida ustun yoki teg sifatida ko'rsatiladi-mi, va PP (rejalashtirish) bu holatni CRP/Gantt hisobiga avtomatik oladimi? [⤳ ta'sir: MES (downtime COR-087), PP (CRP), WMS]

42. Kanban-board'da "Академияга" ichki buyurtmalar (EP-KAN-115 `order.internalFlag`) tashqi to'lovli buyurtmalarga nisbatan USTUVORLIK qoidasi avtomatlashtirilganmi: AI rejalashtirish (E3 printsip) bu flagni hisobga olib stansiya navbatini (EP-KAN-114) sozlaydimi, va ichki buyurtma Dата готовности o'tsa tashqi buyurtmalar kabi eskalatsiya uyg'otadimi? [⤳ ta'sir: PP (AI rejalashtirish), SD, MES]

43. Kanban kartasidagi "Примечание maxsus shart badge" (EP-KAN-106) bosqichdan o'tishda tasdiqlatadi — bu tasdiqlash muayyan stansiya operatorigami, sifat nazoratchisigami yoki umumiy boshliqqa yuboriladimi, va tasdiqlash keyinga qoldirilsa badge "bloklangan o'tish" trig'gi bajarilguncha keyingi bosqichga o'tish texnologiyasi nima? [⤳ ta'sir: QC (bosqich nazorat), MES (operator E4)]

44. Vazifaga biriktirish AI taklifi (EP-KAN-061 `task.suggestAssignee`) kategoriya asosida ishlaydi — bu AI qanday model/logika ishlatadi: tarixiy bajarilish sifati (archive pattern), xodim hozirgi yuklamasi (open tasks count), va razryad mos kelishini (ORG karta malaka-talabi) birlashtirgan ball formula qanday tuzilgan, va yanlish taklif bo'lsa feedback loop bormi? [⤳ ta'sir: ORG (razryad EP-ORG-034), HR, AI]

45. "Kun boshida ertalab boshliq ko'radi" (EP-KAN-116 `personalProgram.showToManager`) va "boshliq ertalab tasdiqlaydi" (EP-KAN-051) kombinatsiyasi: boshliq tasdiqlashdan bosh tortsa yoki kechiksa — xodim kun davomida tasdiqlashni kutib turadimi yoki "tasdiqlanmagan" holda ishlashni boshlashga ruxsat beriladi, SLA qanday? [⤳ ta'sir: Coordination, HR intizom]

46. Vazifa-vaqt log (EP-KAN-134 `task.timeLog`) "ixtiyoriy" deb belgilangan — lekin vaqtbay ish haqi hisob-kitobiga (HR) kiritilishi uchun MAJBURIY bo'lishi kerak bo'lsa: majburiylik shartini (lavozim turi, vazifa kategoriyasi) qaysi master-data belgilaydi va `business.constants.ts`da qanday saqlash kerak? [⤳ ta'sir: HR Payroll (vaqtbay), KPI/GSD, ORG (karta)]

47. Korporativ raqam berish jarayon-shabloni (EP-KAN-107 `template.corpNumber`) "НО-2 yo'riqnoma → Инспекция nazoratga qo'shildi" ketma-ketlikda: Inspeksiya modulida xodim reestrga qo'shilishi uchun qanday event chiqariladi, va Kanban bu event'ni Coordination/HR tomon yo'naltirganda ikki tomondan takror-trigger bo'lmasligi uchun outbox pattern qanday ishlatiladi? [⤳ ta'sir: HR (Inspeksiya), COR, outbox pattern]

48. Bajarilish dalili (EP-KAN-037 `task.closeGuard`) sifat/ta'mirlash uchun rasm/fayl majburiy — fayl WMS'dagi `card-files` jadvalida saqlanadi: faylning yuklanish hajmi chegarasi bormi, virus/xavfsizlik tekshiruvi qilinadi-mi, va ushbu rasmlar bilan QC 8D/CAPA jarayoni (EP-QC-013/127) bog'liq bo'lsa fayl havola link orqali ko'rsatiladimi? [⤳ ta'sir: QC (8D/CAPA), WMS (storage), xavfsizlik]

49. Recruitment Kanban 7-bosqich (HR/KAN ko'prik, `decisions/15-kanban.md` eslatmasi) va asosiy KAN modul o'rtasida RBAC: recruitment kanbani faqat HR bo'limiga ko'rinadiami, xodimlarga ham ko'rinadimi (o'z nomzodligi statusini ko'rishi uchun), va bu ko'rinish huquqi ORG lavozim-kartasidagi `ERP ruxsat` maydonidanmi yoki alohida qoidami? [⤳ ta'sir: HR (rekruting), ORG (RBAC kartadan E2), xavfsizlik]

50. Kanban'dagi barcha cron joblar (rollover / eskalatsiya / arxivlash / smena-estafeta / norma-eskalatsiya / takrorlanuvchi vazifalar) BullMQ queue orqali yoki EventEmitter2 orqali amalga oshadimi — agar internet uzilsa (A5 offline rejim) va queue ishlamay qolsa, bu cronlar qaysi offline-ish holatda bajariladi yoki "missed job" qayta ishga tushiriladi qanday mexanizm bilan? [⤳ ta'sir: AI Integratsiya (BullMQ A8), NTF, CC, offline A5]
