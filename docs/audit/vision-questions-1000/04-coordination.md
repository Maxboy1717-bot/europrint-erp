# COR — Coordination / Kengash — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

> Manbalar: decisions/04-coordination.md (135 savol, 73 javoblangan, 62 ochiq — BARCHASI hal),
> OCHIQ-JAVOBLAR-2026-06-08.md (COR bo'limi + 6 kesishuvchi prinsip), LOYIHA-QOIDALARI-2026-06-08.md.
> Bu 50 savol HAL QILINGAN 135 ta savoldan CHUQURROQ/KENGROQ — edge-case, chegara, avtomatlashtirish, race condition, integratsiya tafsilotlari.

---

1. Kengash a'zosi karta-modelda ko'rsatiladi: lavozim kartasi o'zgarsa (yangi xodim tayinlansa) ko'p bosqichda — masalan kengash sessiyasi AYNI O'SHA PAYTDA ochiq bo'lsa — ochiq sessiya a'zoligi qanday yangilanadi va kimning ovozi qaysi holat bo'yicha sanaladil (eski xodim yoki yangi xodim)? [⤳ ta'sir: ORG/KARTALAR, HR]

2. Kvorum 2/3 qoidasida chetlashtirish (manfaat to'qnashuvi, EP-COR-036) real vaqtda hisoblansa — chetlashtirilgan a'zo qo'shilganda ovoz davom etayotgan bo'lsa tizim qanday harakatni bajaradi: chetlashtirishni qo'llash uchun qanday DB-tranzaksiya yopilishi kerak va mavjud kvorum hisob avto qayta hisoblanadimi? [⤳ ta'sir: Qaror qonuniyligi, Audit-log]

3. AI kamera dokladni/protokolni avto-tuzadi (EP-COR-046 hal): ovoz transkripsiyasida bir nechta kishi bir vaqtda gapirganda (shovqin, ustma-ust nutq) qaysi so'zlar qaysi a'zoga tegishli ekanligi qanday aniqlanadi — diarizatsiya algoritmini tizim qanday konfiguratsiyalaydi va xato atribusiyada inson tuzatish qanday kanaldan amalga oshadi? [⤳ ta'sir: AI/IoT kamera, NTF]

4. Распоряжение (farmoyish) hayot tsikli KANBAN'ga ko'chirildi (EP-COR-051): Coordination'da protokol qaroridan avto ochilgan Распоряжение Kanban'da "Bekor/Muddat so'rash" holatiga tushganda bu holat Coordination protokol ekranida qanday aks etadi — protokol "qaror bajarildi" foiziga bu o'zgarish real vaqtda kirishi uchun qaysi event yoki webhook ishga tushadi? [⤳ ta'sir: Kanban, Reports]

5. Приказ raqamlash formati "PR-YYYY-NNN" va har kategoriyaga alohida prefiks (Kadrlar/Asosiy/Moliya/Xo'jalik — EP-COR-057) mavjud: agar bir vaqtda ikkita foydalanuvchi ikki xil brauzerda bir kategoriyada приказ yaratsa (race condition), tizim qanday mexanizm bilan raqam takrorlanishini oldini oladi — DB-darajadagi sequence + SERIALIZABLE tranzaksiya talab qiladimi yoki application-level lock yetarlimi? [⤳ ta'sir: Arxiv, Qonuniylik]

6. Imzolangan protokol immutable (EP-COR-066): agar imzolashdan keyin PDF fayl manba sifatida saqlanadigan bo'lsa va saqlash xizmati (disk/S3) ulanishi uzilsa — immutability kafolati faqat DB bayroq bilan ta'minlanadimi yoki PDF hash ham alohida saqlanadimi va hash muvofiqligini kim va qachon tekshiradi? [⤳ ta'sir: Arxiv, Security]

7. Majlis davomati (EP-COR-041) 4 holatli avto: turniket ma'lumoti (EP-COR-105) va AI kamera davomati (OCHIQ-JAVOBLAR) manba sifatida kelganda — ikkisi kelishmagan holda (turniket "keldi" deydi, AI kamera "yo'q" deydi) qaysi ma'lumot ustun va ziddiyat qanday logga tushadi hamda kimga bildirishnoma yuboriladi? [⤳ ta'sir: HR davomat, IoT, AI kamera]

8. Favqulodda majlis (EP-COR-082) 3 soatda chaqiriladi, yengil kvorum 50%: agar 3 soat ichida 50% a'zo tasdiqlamasa majlis boshlanishi kerakmi yoki avtomatik bekor qilinadimi — va bu qarorni kim qabul qiladi (Rais avtomi yoki tizim blokladimi)? [⤳ ta'sir: NTF, Org-struktura]

9. Protokoldan avto ochilgan Распоряжение Kanban'da "Bekor qilindi" bo'lsa — protokol ekranida "qaror bajarilmadi" sifatida belgilanishi kerak va keyingi majlis kun tartibiga "bajarilmagan qaror" (EP-COR-070) sifatida avto qo'shilishi lozim: bu zanjirni ishga tushiradigan event qaysi modul tomonidan qanday vaqt oralig'ida yuboriladi? [⤳ ta'sir: Kanban, Protokol, NTF]

10. 24h ishlab chiqarish rejasi (EP-COR-086) har kuni avto generatsiya qilinadi va o'zgarsa push+log yuboriladil: agar PP moduli rejani o'zgartirsa va bir vaqtda COR koordinatsiya dashboardi ham o'zgartirishga urinsa — optimistik qulfmi yoki pessimistik qulfmi qo'llanadi va foydalanuvchiga qanday xabar ko'rsatiladi? [⤳ ta'sir: PP/Rejalashtirish, Production, Warehouse]

11. Logistika STOP (EP-COR-088) faqat reja/dizayn rahbari yechadi: agar rahbar tizimda faol bo'lmasa (ta'tilda, kasalda) va org-sxema bo'yicha i.o. tayinlangan bo'lsa — STOP yechish huquqi avto i.o.ga o'tadimi va bu ORG moduli i.o. mexanizmi (EP-ORG-060) bilan qanday sinxronlashadi? [⤳ ta'sir: ORG/HR, Production, Warehouse, Quality]

12. Podpisnoy gate (EP-COR-092) buyurtmachi imzosi bo'lmasa IChQ'ga o'tkazish bloklanadi: agar buyurtmachi tashqi tomon bo'lsa (ERP'da akkaunt yo'q) — imzo qanday format bilan qayd etiladi (skaner qilingan PDF, elektron tasdiq, menejer o'rniga tasdiqladim bayrog'i) va bu formatni kod qanday validate qiladi? [⤳ ta'sir: CRM/Sales, Design, Quality]

13. Kengash a'zosi "alohida fikr" (osoboye mneniye, EP-COR-067) yozishi mumkin: bu fikr protokolga ilova bo'ladi — agar protokol allaqachon Kotib tomonidan imzolangan lekin Rais hali imzolamagan bo'lsa "alohida fikr" qo'shish mumkinmi va qo'shilsa Kotib imzosi invalide bo'ladimi (versiyalash)? [⤳ ta'sir: Protokol imzo oqimi, Arxiv]

14. Rек.Совет sessiyasi (EP-COR-015) ЗВС larni ko'rib chiqadi: agar bir ЗВС hujjati sessiya davomida "qisman tasdiqlangan" bo'lsa va qisman miqdor (approvedAmount) aniqlanishi uchun Finance moduli real vaqtda byudjet qoldiqini tekshirishi kerak bo'lsa — bu so'rov sinxronmi (request-response) yoki asinxron (event), va Finance javobini kutish muddati cheklangan bo'lsa nima bo'ladi? [⤳ ta'sir: Finance/GL, Sessiya hisoboti]

15. Doklad yuborganda (EP-COR-007) Telegram + ilova ichi bildirishnoma ketadi: agar Telegram bot ulanishi uzilgan bo'lsa (EP-COR-080 — Telegram kanal/guruh) — doklad baribir yuborilganmi va NTF moduli Telegram xatoligini qanday qayta urinish (retry) mexanizmi bilan boshqaradi va qancha vaqtdan keyin "yetkazilmadi" statusiga tushadi? [⤳ ta'sir: NTF, AI Integratsiya/Telegram bot]

16. Bajarish dalili (proof, EP-COR-071) Yuqori/Shoshilinch darajadagi qarorlarga majburiy: dalil sifatida fayl (rasm/hujjat) yuklansa — fayl hajmi cheklovi, formatlar ro'yxati, saqlash joyi (lokal/S3) qanday aniqlanadi va dalil fayl o'chirilgan yoki buzilgan bo'lsa ("pruf yo'q" holati) tizim qanday munosabatda bo'ladi? [⤳ ta'sir: Kanban, Arxiv, Audit-log]

17. Смена handover yozuvi (EP-COR-099) tugamagan buyurtma + ochiq STOP + eslatmalarni keyingi smenaga o'tkazadi: agar tun smenasidan kunduz smenasiga o'tishda operator IoT-tabletda smena yopishni unutsa (autologout yo'q bo'lsa) — handover yozuvi qachon avto trigger bo'ladi va ochiq STOP'lar orqali qo'chib o'tishining kafolati qanday ta'minlanadi? [⤳ ta'sir: MES, IoT, Production, HR]

18. Smena tayyorligi checklisti (EP-COR-130) IoT tabletda: "tasdiqlanmaguncha bekor turish hisoblanmaydi" (approved-downtime prinsipi) — agar IoT tablet tarmoq ulanishiz offline bo'lsa va operator offline cheklistni to'ldirsa — offline to'ldirish ma'lumotlari qachon va qanday sinxronlashadi va offline davrdagi "bekor turish" retroaktiv to'g'ri hisoblana oladimi? [⤳ ta'sir: MES, IoT, HR, Reports]

19. Koordinatsiya hodisalari karta-AI ga oziq beradi (EP-COR-135): agar bir xodim bir vaqtda bir nechta kartaga tayinlangan bo'lsa (ko'p-karta model, EP-ORG-066) — kechikish/STOP/brak signali qaysi kartaga yoziladi (buyurtmaga bog'liq kartami yoki xodimning barcha kartalarigami) va karta-AI larning parallel bahosi bir-biri bilan ziddiyatli bo'lsa kim hal qiladi? [⤳ ta'sir: ORG/KARTALAR, HR, AI]

20. Buyurtma o'zgarishi (EP-COR-114) ta'sirlangan bo'limlarga bildirishnoma va tasdiq talab: agar o'zgarish kechqurun ish vaqtidan tashqarida bo'lsa — tasdiq so'rovlari qaysi kanalda yuboriladim (Telegram avto), tasdiq muddati (masalan 2 soat) ish vaqtiga nisbatanmi yoki mutlaq vaqtgami va tasdiq kelmasа blok avtomatikmi? [⤳ ta'sir: barcha modullar, NTF, AI Integratsiya]

21. Kun tartibi 1 ish kuni oldin quflanadi (EP-COR-040) va keyin faqat Rais ruxsati bilan band qo'shiladi: agar Rais tizimdan ruxsat bersa va band qo'shilsa — bu o'zgarish a'zolarga qanday bildiriladi (qayta xabar ketadimi), yangi band uchun doklad talab qilinadimi va qo'shilgan band protokolda alohida belgilanadimi? [⤳ ta'sir: NTF, Protokol]

22. Приказ amal qilish sanasi (effective date, EP-COR-021) imzolash sanasidan kech bo'lishi mumkin: agar приказ HR moduli buyrug'i bo'lsa (xodim lavozim o'zgarishi/oylik o'zgarishi) — HR moduli amal qilish sanasi kelganda avto qaysi hodisani yoki triggerini eshitadi va agar sana bayram kuniga to'g'ri kelsa keyingi ish kuniga suriladimi? [⤳ ta'sir: HR, Finance/Payroll, ORG]

23. Gofra qavati skanerla tasdiqlash (EP-COR-112) material chiqarishda: agar skaner kodi noto'g'ri o'qilsa (barcode zarar ko'rgan, skanersiz) — operator qo'lda raqam kiritishi mumkinmi, qo'lda kiritishga ruxsat qaysi darajadagi kartadan keladi va qo'lda kiritishlar audit-logda alohida belgilanadimi? [⤳ ta'sir: Warehouse, Quality, IoT/POS Monitor]

24. "Uch karzina" (3-tray) interfeysi Kanban moduli bilan bir xil UI'da ko'rinadimi yoki alohida sahifami: agar xodim ham Coordination 3-karzina, ham Kanban taxta foydalanuvchisi bo'lsa — Coordination trafini koordinatsiyasi KANBAN'ga o'tgandan keyin (EP-COR-051) "uch karzina" da qaysi vazifalar ko'rinadi va Kanban vazifalarini COR 3-karzina'dan yopish mumkinmi? [⤳ ta'sir: Kanban, UX/UI]

25. Menejer buyurtma egasi sifatida (EP-COR-104) STOP/kechikish/handoff bildirishnomasini oladi: agar bitta buyurtmada menejer o'zgarsa (CRM tomonidan qayta tayinlansa) — avto bildirishnomalar eski menejerga to'xtab yangi menejerga o'tadimi, o'tish vaqtida yuborilgan bildirishnomalar qayerga tushadi va eski menejer tarixi ko'ra oladimi? [⤳ ta'sir: CRM/Sales, NTF, Audit-log]

26. Davomat 3 marta sababsiz yo'q = HR ogohlantirish (EP-COR-041): "sababsiz" va "sababli" ajratish uchun qanday maydon/holat ishlatiladi, sabab kiritish turniket ma'lumotidan keyin qancha vaqt oralig'ida qabul qilinadi va sababni kim (HR/rahbar/xodim) kiritishi mumkin — ruxsat darajasi qanday? [⤳ ta'sir: HR, ORG, IoT turniket]

27. Координatsiya hodisalari KPI hisoblash (EP-COR-102, 30/70 prinsip) karta AI ga avto signal beradi: agar koordinatsiya moduli event yubora olmasa (event queue to'lib qolsa yoki service restart bo'lsa) — KPI hisob qancha vaqt uchun noto'g'ri qolishi mumkin, outbox pattern ishlatiladi yoki yo'q va recompute mexanizmi bormi? [⤳ ta'sir: HR/KPI, AI, Reports]

28. Koordinatsiya panelida "bajarilish foizi" (EP-COR-069) Kanban'dan real-time o'qiladi: agar Kanban ma'lumotlar bazasi yoki servisi vaqtincha mavjud bo'lmasa — COR panel nima ko'rsatadi (oxirgi ma'lum qiymat, "ma'lumot yo'q" holat, yoki xato), va bu holat foydalanuvchiga qanday ko'rinishda etkaziladi? [⤳ ta'sir: Kanban, UX/UI]

29. Доклад raqamlari ERP'dan avto (EP-COR-047, 30/70 prinsip): Production, Finance, Warehouse ma'lumotlari dokladga tortilganda agar bir moduldagi raqam hali tasdiqlanmagan (masalan, smena yopilmagan, GL tranzaksiya draft holatda) — dokladga draft qiymat kirishi kerakmi yoki faqat confirmed ma'lumot kirishi lozim va qaysi ma'lumot "real" hisoblanadiganini qaysi manba belgilaydi? [⤳ ta'sir: Production/MES, Finance/GL, Warehouse/WMS]

30. Buyurtma "tayyorlik %" (EP-COR-103) o'tilgan bo'lim/jami bo'lim formula: agar bir bo'lim "STOP" holatida bo'lsa — bu bo'lim "o'tilgan" deb hisoblenadimi yoki "to'xtatilgan" alohida kategoriya sifatida ko'rsatiladi va STOP bo'limi tayyorlik foiziga salbiy ta'sir qiladimi (CRM, menejer dashboardiga ko'rinish)? [⤳ ta'sir: CRM, Production, Coordination dashboard]

31. Приказ "Bekor qilindi" holatida immutable + raqami saqlanadi (EP-COR-058): agar bekor приказ HR moduli effekti (lavozim o'zgarishi) bilan bog'liq bo'lsa — HR moduli bekor приказni qabul qilish bilan birga ilgari bajarilgan HR operatsiyani (lavozim o'zgarishi) retroaktiv qaytaradimi yoki alohida teskari приказ kerak bo'ladimi? [⤳ ta'sir: HR, ORG, Finance/Payroll]

32. Bo'limlararo gorizontal workflow_rules jadvali (EP-COR-119) admin paneldan konfiguratsiya qilinadi: agar ikkita bo'lim orasidagi qoida o'chirilsa yoki o'zgartirilsa — o'sha paytda jarayondagi hujjatlar eski qoidami yoki yangi qoidaga bo'ysun unadimi va "jarayondagi hujjat eski qoidada qoladi" isbotini tizim qanday amalga oshiradi? [⤳ ta'sir: ORG, barcha bo'limlar, Audit-log]

33. Koordinatsiya eskalatsiya zinapoyasi (EP-COR-053) 3 bosqich: "muddat-1kun eslatma → bevosita boshliq → +2 kun otdeleniye boshlig'i → +3 kun CEO": agar otdeleniye boshlig'ining o'zi ham tepaga eskalatsiya qilmasа (masalan kasalda, i.o. tayinlanmagan) — tizim eskalatsiyani avtomatik CEO'ga o'tkazadimi va bu skip qanday logda yoziladi? [⤳ ta'sir: ORG (manager_id), NTF, HR]

34. Koordinatsiya RBAC maydon darajasida (EP-COR-076 "Maxfiy" majlis): maxfiy majlis faqat a'zolar+CEO ko'radi — agar yangi a'zo tayinlansa (karta o'zgarishi bilan) — yangi a'zo ilgari bo'lgan maxfiy majlislarni avtomatik ko'ra oladimi yoki faqat tayinlanganidan keyingilarnomi va bu qoidani kod qanday enforce qiladi (row-level security yoki application-level filter)? [⤳ ta'sir: Security/RBAC, ORG/KARTALAR]

35. Smena cheklisti (EP-COR-130) va TB xavfsizlik chek-list (HR-079) ikkalasi IoT tabletda: agar operator ikkisini ham to'ldirishi kerak bo'lsa — qaysi biri birinchi, ketma-ketlik majburiyatimi yoki parallel to'ldirish mumkinmi va biri to'ldirilmasa (masalan TB chek-list o'tkazib yuborilsa) tizim ishni boshlashni bloklaydimi? [⤳ ta'sir: HR, IoT/MES, Production, Security]

36. Rек.Совет sessiyasi seshanba 08:45 cron (EP-COR-017): agar seshanba bayram kuni bo'lsa — cron keyingi ish kuniga avtomatik suriladimi yoki ma'mur qo'lda sozlaydi va sessiya sanasini o'zgartirganda allaqachon yuborilgan eslatmalar bekor qilinadimi (recall notification)? [⤳ ta'sir: NTF, Finance, AI Integratsiya]

37. Кечикkan Распоряжение "overdue" (EP-COR-009) cron har kuni bajaradi: agar tizim cron o'tkazib yuborganidan keyin (server restart, cron failure) bir necha kun o'tgan bo'lsa — retroaktiv overdue belgilash amalga oshiriladi yoki faqat keyingi ishlagan paytda joriy holat tekshiriladi va "o'tkazib yuborilgan overdue" qancha vaqt uchun KPI hisob xato bo'lib qolishi mumkin? [⤳ ta'sir: HR/KPI, NTF, Audit-log]

38. Koordinatsiya ↔ Finance integratsiyasi: Рек.Совет qarori (qisman/to'liq tasdiqlash, EP-COR-016) Finance byudjet moduli uchun majburiy kirish hisoblanadimi — agar Finance moduli ЗВС ni faqat tasdiqlangan sessiyadan qabul qilsa — sessiya hisoboti imzosiz (kotib/rais imzosidan oldin) Finance'ga yuboriladimi yoki imzo zanjiri to'liq tugashini kutadimi? [⤳ ta'sir: Finance/GL, Protokol imzo oqimi]

39. "Bilim blanki" (EP-COR-100) har bo'lim/karta uchun davriy to'ldiriladi va AI tahlilga kiradi: agar xodim bir nechta kartada ishlasa — u qaysi karta uchun blanki to'ldiradi, blanki konsolidatsiya qilinadimi va AI tahlil har karta uchun alohida yoki xodim bo'yicha umumlashtirilgan bo'ladimi? [⤳ ta'sir: ORG/KARTALAR, HR/LMS, AI]

40. Koordinatsiya hujjatlari arxivida qidiruv (EP-COR-075) ko'p mezonli: agar matn bo'yicha qidiruv (full-text search) qo'llansa — PostgreSQL `tsvector` yoki tashqi qidiruv tizimi (Elasticsearch) ishlatiladi, O'zbek lotin/kirill/rus matnlari uchun tokenizatsiya qanday sozlanadi va qidiruv natijasida maxfiy hujjatlar filtri server-sidedan amalga oshirilishini qanday tekshirish mumkin? [⤳ ta'sir: Arxiv, Security/RBAC, AI]

41. Приказ "tanishuv imzosi" yig'iladi (EP-COR-025) — tegishli xodimlar "tanishdim" tasdig'ini beradi: agar xodim karta orqali tayinlangan bo'lsa lekin ERP'ga hali birinchi marta kirmagan bo'lsa (yangi ishchi) — tanishuv so'rovi qanday yuboriladim (Telegram orqali), va tanishuv berilmasа belgilangan vaqtdan keyin kim hisobga olinadimi (rahbar ma'sulmi)? [⤳ ta'sir: HR, NTF, AI Integratsiya, ORG]

42. Koordinatsiya dashboardida "yaqin majlis" widget (EP-COR-026): agar bir vaqtda bir nechta majlis rejalashtirish oralig'i kesishsa (operativ + favqulodda bir kunda) — widget ikkalasini ko'rsatadimi, qaysi biri birinchi ko'rsatiladi va yaqin majlis tugagandan keyin widget avtomatik yangilanadimi yoki sahifani yangilash kerakmi? [⤳ ta'sir: UX/UI, NTF]

43. Gorizontal koordinatsiya: uchastka "material yetishmadi" signal (EP-COR-111) logistika + ombor + rejalashtirish bir vaqtda xabardor: agar bu uchala modul uchun bildirishnoma parallel yuborilsa va Warehouse moduli signalni "qabul qildi, harakatdaman" deb belgilasa — boshqa modullar bu harakatdan xabardor bo'ladimi va bir modulning harakati boshqalarning parallel harakatini bekor qilishi mumkinmi? [⤳ ta'sir: Warehouse, PP/Rejalashtirish, Internal Logistics, NTF]

44. Direktor tasdig'i eng yuqori darvoza (EP-COR-132) belgilangan turdagi qarorlar uchun: direktor uzoq muddatli safarda (Telegram'ga kirish imkoni yo'q, ERP offline) bo'lsa — deputat/i.o. qanday avtomatik tayinlanadi va i.o. direkto ruxsatiga teng huquqlarda belgilanadimi yoki faqat ma'lum turdagi приказ uchun ruxsat berish imkoni bormi? [⤳ ta'sir: ORG/HR, Finance, Security/RBAC]

45. Koordinatsiya KPI oylik bajarish reytingi (EP-COR-073): "o'z vaqtida % / kechikkan %" hisob — cron qachon ishlaydi (oyning oxiridami yoki kunlik to'plash), agar oyning o'rtasida xodim lavozim o'zgartirsa (karta almashinsa) — o'sha oyning KPI qaysi kartaga yoziladi va nomuvofiqlik qanday hal qilinadi? [⤳ ta'sir: HR/KPI, ORG/KARTALAR, Finance/Payroll]

46. Koordinatsiya chat (ERP ichida, BARCHA_JAVOBLAR Q79) boshqa modul chatidan alohidami: Coordination ichidagi chat xabarlari arxivi (protokol bilan bog'liqmi, hisobotga kiritiladimi), agar chat xabari majlis tashkil qilish bilan bog'liq bo'lsa va kengash a'zosi kanal (Telegram) bilan solishtirilsa — qaysi kanal "rasmiy" (auditga tushadi) va qaysi "norasmiy" hisoblanadi? [⤳ ta'sir: NTF, AI Integratsiya, Arxiv]

47. Koordinatsiya moduli T2 tier (boshqaruv/nazorat qatlami): PP/MES T1 tier bo'lsa va PP 24h rejani o'zgartirganda (EP-COR-086 avto push) — bu push COR bilan konflikt holda (coordinatsiya sessiyasi PP rejasini muhokama qilayotganda) PP o'zgarishini bloklamaydi: bu conflict resolution qoidasi qanday aniqlanadi va "blok yo'q, lekin bildirishnoma bor" isboti uchun qaysi kod qatori tekshiriladi? [⤳ ta'sir: PP/Rejalashtirish, Production, NTF]

48. Доклад status oqimi: "Qaytarildi" (rejected) holatida doklad yuboruvchiga qaytariladi — qaytarish sabablari kodlangan ro'yxatdanmi yoki erkin matnmi va qaytarilgan doklad qayta yuborilganda (v2) arxivda asl va qayta yuborilgan versiya ikkalasi ko'rinadimi, versiya raqami avtomatikmi? [⤳ ta'sir: Arxiv, AI tahlil, NTF]

49. Koordinatsiya — AI rejalashtirish printsipi (OCHIQ-JAVOBLAR "AI rejalashtiradi buyurtmalarni xolos"): agar AI buyurtma navbatini o'zgartirsa (EP-COR-110 ustuvorlik) va bu o'zgarish koordinatsiya sessiyasida muhokama qilinayotgan reja bilan zid kelsa — AI avto o'zgartirishni majlis tugaguncha "hold" qiladimi yoki majlis bildirishnomasi berib darhol qo'llaydimi va bu qarorni qaysi kod yoki event boshqaradi? [⤳ ta'sir: PP/Rejalashtirish, AI, Production]

50. Koordinatsiya moduli "tayyor" (DoD, LOYIHA-QOIDALARI D5, 7 shart): (1) real CRUD + (2) FE shablon + (3) hujjat + (4) test + (5) tarjima UZ/RU + (6) edge-case + (7) avtomatlashtirish — COR uchun (7) avtomatlashtirish shart sifatida: qaysi cronlar, eventlar va AI qadamlar "barcha" deb hisoblanadi va har birining "ishlayapti" isboti qanday tekshiriladi (integration test, DB-proof yoki E2E)? [⤳ ta'sir: barcha modullar, Testing, Reports]
