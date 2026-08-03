# POS Monitor — YANGI (kitob-grounded) savollar

> Manba: 2020 zavod hujjatlari (kitob-extracted) — Ички логистика бўлими (RD5 Абдуллаев),
> Лаборант/Sifat (RD5 Nazirov). POS Monitor = zavod ombori planshet ilovasi (kirim/chiqim/
> inventar/ichki ko'chirish). Kassa EMAS (pul → Finance). Quyidagi savollar mavjud 30 ta
> savolni TAKRORLAMAYDI — ular kitobdagi aniq qoidalar (rohler/poddon, ярим тайёр ҳаракати,
> техкарта-материал mosligi, чиқинди/қолдиқ, A-System, турникет, партия, лаборатория qabuli)
> asosida yangi qarorlarni ochadi. Har savol bitta aniq qaror. Birinchi variant = tavsiya.

---

### Q31. Ichki logistika harakati POS Monitor'da alohida turmi
**Nima:** Kitobda asosiy ish "ярим тайёр маҳсулотларни участкалар o'rtasida ko'chirish" (rohlerda) — bu kirim/chiqimdan farqli "ichki yetkazib berish" harakati sifatida yoziladimi.
**Nega kerak:** Bu materialni ombordan butunlay chiqarish emas — uni sexga vaqtincha berib turish; oddiy "chiqim" deb yozilsa, omborda yo'q ko'rinadi-yu, aslida sexda turibdi.
**Variantlar:**
- A) Alohida "участкага berish (logistika)" harakati — material ombor→sex-pozitsiyaga ko'chadi, balans ko'rinadi — aniq joylashuv
- B) Oddiy chiqim sifatida (sexga) — sodda, lekin sexdagi qoldiq ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (sex qoldig'i), PP (kunlik reja), Ombor balansi

### Q32. Texkarta-material mosligi tekshiruvi (chiqimdan oldin)
**Nima:** Kitob: "har bir chiqarilayotgan material техкартага qat'iy mos bo'lishi kerak" (topliner o'rniga makulatura chiqsa — ishlab chiqarish to'xtaydi). Planshet chiqimda materialni buyurtma texkartasiga solishtiradimi.
**Nega kerak:** Noto'g'ri qog'oz/gofra chiqarilsa stanok to'xtaydi yoki mahsulot brakka ketadi — bu zavodda eng qimmat xato.
**Variantlar:**
- A) Chiqimda buyurtma tanlanadi → texkartadagi material bilan skan mos kelmasa qizil ogohlantirish + bloklash — xato chiqishi to'xtaydi
- B) Faqat ogohlantirish, omborchi o'tib ketishi mumkin — moslashuvchan, lekin xato xavfi
- C) Tekshiruvsiz, omborchi o'zi mas'ul — sodda, lekin riskli
- D) Keyin — hozir kerak emas
  ↳ Agar A: mos kelmaganda kim ruxsat beradi (boshliq tasdig'i / texnolog) — variantlar: A1) smena boshlig'i, A2) texnolog, A3) hech kim (qat'iy blok)
⤳ Ta'sir: PP (texkarta), MES (to'xtash), QC (brak)

### Q33. Gofra qavati / qog'oz grammaji chiqimda farqlanadimi
**Nima:** Kitob: bir smenada "5 qavatli gofra" va "3 qavatli gofra" aralashib chiqarilgan. Material kartasi qavat/grammaj darajasida ajratiladimi (5q ╳ 3q alohida pozitsiya).
**Nega kerak:** "Gofra" deb umumiy yozilsa, omborchi noto'g'ri qavatni chiqaradi; har qavat alohida bo'lsa skan o'zi farqlaydi.
**Variantlar:**
- A) Har grammaj/qavat alohida material kartasi (barcode darajasida farqli) — aralashtirib bo'lmaydi
- B) Bitta "gofra" kartasi, qavat — atribut/izoh — sodda, lekin aralashish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (material katalog), QC

### Q34. Laboratoriya qabuli — kirim laborantga bog'liqmi
**Nima:** Kitob (Лаборант): kelgan qog'oz rulonlarining "namlik va grammaji" o'lchanadi; standartdan past bo'lsa "xom ashyo ishlab chiqarishga kiritilmaydi". Kirim qilingan material darrov ishlatishga tayyormi yoki "lab tekshiruvi kutilmoqda" holatida turadimi.
**Nega kerak:** Lab tasdiqlamagan material chiqimga ketsa, butun partiya qayta ishlashga ketishi mumkin (kitobdagi real holat).
**Variantlar:**
- A) Kirim "karantin/lab kutilmoqda" holatida turadi → lab OK bersa "tayyor"ga o'tadi, chiqim shundan keyin — sifat kafolati
- B) Kirim darrov tayyor, lab parallel tekshiradi — tez, lekin sifatsiz ketishi mumkin
- C) Faqat muhim material (qog'oz/bo'yoq) karantin, qolgani darrov — muvozanat
- D) Keyin — hozir kerak emas
⤳ Ta'sir: QC (lab xulosasi), MM, PP
  ↳ Agar A: karantindan chiqishni kim tasdiqlaydi — A1) laborant, A2) QC boshlig'i, A3) avto (lab natijasi tizimga tushganda)

### Q35. Lab "rad etdi" bo'lsa material taqdiri
**Nima:** Lab namlik/grammaj past deb rad etgan partiya POS Monitor'da qanday holatga o'tadi — yetkazib beruvchiga qaytariladimi, brakka, yoki bloklangan zaxiraga.
**Nega kerak:** Rad etilgan material oddiy zaxirada qolsa, boshqa omborchi uni bilmay chiqarib yuboradi.
**Variantlar:**
- A) "Bloklangan (lab rad etdi)" holati — chiqarib bo'lmaydi, sabab bilan qaytarish/utilizatsiya tanlanadi — xato chiqish yo'q
- B) Oddiy izoh, chiqarib bo'ladi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, MM (yetkazib beruvchi reytingi), Finance (qaytarish)

### Q36. Chiqindi va qoldiq (отходы) hisobga olinadimi
**Nima:** Kitob: "ишлаб чиқаришдан чиққан чиқиндилар ва қолдиқларни белгиланган тартибда ўз вақтида чиқариш". Ishlab chiqarish chiqindisi (kesilgan gofra qoldig'i, makulatura) POS Monitor'da harakat sifatida yoziladimi.
**Nega kerak:** Chiqindi sotiladi yoki qayta ishlatiladi (makulatura) — hisobsiz bo'lsa, qiymat va o'g'irlik ko'rinmaydi.
**Variantlar:**
- A) Alohida "chiqindi/qoldiq kirimi" harakati (makulatura ombori) — keyin sotuv/qayta ishlatish hisobga tushadi — qiymat ko'rinadi
- B) Chiqindi hisobga olinmaydi — sodda, lekin yo'qotish ko'rinmas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (chiqindi sotuvi), MM (makulatura kartasi)
  ↳ Agar A: chiqindi miqdori qaydan keladi — A1) stanok normasidan avto (reja-fakt), A2) omborchi qo'lda tortib kiritadi

### Q37. Makulatura (ikkilamchi qog'oz) ombori alohida turmi
**Nima:** Kitob "местный (макулатура) қоғози" ni alohida tilga oladi (toza topliner emas). Qayta ishlangan/ikkilamchi material alohida ombor/pozitsiyada turadimi.
**Nega kerak:** Makulatura toza qog'oz bilan aralashsa, texkarta talab qilgan toza material o'rniga bexosdan chiqib ketadi.
**Variantlar:**
- A) Makulatura alohida ombor turi + barcode rangida farqli — aralashmaydi
- B) Bitta omborda atribut bilan — sodda, lekin xavf
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM, Q32 (texkarta mosligi)

### Q38. Rohler/poddon (ko'chirish vositasi) kuzatiladimi
**Nima:** Kitob: rohler va poddonlar "ишга яроқли ҳолатда" bo'lishi nazorat qilinadi — bular ichki transport aktivlari. POS Monitor poddon birligida (qancha poddon material) ishlaydimi yoki faqat o'lchov birligida (kg/m).
**Nega kerak:** Zavod amalda poddon bilan ishlaydi ("3 poddon topliner"); faqat kg bo'lsa, omborchi har safar hisoblashi kerak.
**Variantlar:**
- A) Poddon + o'lchov birligi ikkalasi (1 poddon = N rulon/kg avto) — amaliyotga mos
- B) Faqat asosiy o'lchov (kg/m/dona) — sodda, lekin poddon sanog'i yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (poddon konversiyasi), IoT (poddon harakati)

### Q39. Bo'sh poddon/rohler qaytishi hisobga olinadimi
**Nima:** Sexga material poddonda ketadi, bo'sh poddon qaytadi. POS Monitor bo'sh poddon/tara harakatini kuzatadimi (qaytarib olinadigan tara).
**Nega kerak:** Poddon — qimmat aktiv; qaytmasa yo'qoladi; kitobda "ишга яроқли ҳолатда" nazorat talab qilinadi.
**Variantlar:**
- A) Poddon — qaytariladigan aktiv, ketdi/qaytdi balansi yuritiladi — yo'qolish ko'rinadi
- B) Poddon hisobga olinmaydi (faqat material) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: IoT (aktiv kuzatuvi), Finance (aktiv)

### Q40. Kunlik ishlab chiqarish rejasi planshetga tushadimi
**Nima:** Kitob: "1 суткалик ишлаб чиқариш режаси" har kuni planshet ekranida ko'rinadimi — bugun qaysi buyurtmaga qaysi material kerakligi ro'yxati.
**Nega kerak:** Omborchi rejani oldindan ko'rsa, materialni vaqtida tayyorlaydi (kitob: "режани olдиндан qabul qilish — muvaffaqiyatli harakat").
**Variantlar:**
- A) Kunlik reja → "bugun chiqariladigan materiallar" ro'yxati planshetda avto ko'rinadi (PP'dan) — proaktiv tayyorgarlik
- B) Reja yo'q, omborchi sex so'raganda chiqaradi — reaktiv, kechikish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (kunlik reja), MES
  ↳ Agar A: reja bajarilishi (qancha chiqarildi/qoldi) avto kuzatiladimi — A1) ha, % ko'rsatkich, A2) faqat ro'yxat

### Q41. Bekor turish (простой) signali — material yetishmasa
**Nima:** Kitob statistikasi: "ички логистика sababli kechikishlar soni", "bekor turishlar". Sex materialsiz to'xtab qolsa, POS Monitor buni qayd qiladimi/signal beradimi.
**Nega kerak:** Kitobda bu — logistika boshlig'ining asosiy javobgarligi va statistik ko'rsatkichi; tizim qaydsiz bo'lsa, sabab kim ekani aniqlanmaydi.
**Variantlar:**
- A) Sex "material kutyapman" tugmasini bossa → vaqt sanog'i boshlanadi → omborchi/boshliqqa signal — sabab aniq qayd
- B) Bekor turish qo'lda jurnalga yoziladi — sodda, lekin sub'ektiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (to'xtash sababi), Coordination, HR (logist GSD)

### Q42. Sexning material talabi (so'rov) planshetdan keladimi
**Nima:** Sex materialni qanday so'raydi — og'zaki/telegram, yoki POS Monitor'da "talab" yaratib, omborchi shu talab asosida chiqaradimi.
**Nega kerak:** Rasmiy talab bo'lmasa, kim nima so'raganini izlab bo'lmaydi va chiqim sababsiz qoladi.
**Variantlar:**
- A) Sex planshet/tizimda "material talabi" yaratadi → omborchi talabni tanlab chiqaradi (talab↔chiqim bog'liq) — to'liq iz
- B) Og'zaki so'rov, omborchi bo'sh chiqim yozadi — tez, lekin izsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Coordination, Kanban
  ↳ Agar A: talabni kim tasdiqlaydi (sex boshlig'i / avto) — A1) sex smena boshlig'i, A2) reja bilan mos bo'lsa avto

### Q43. Buyurtmaga material sarfini biriktirish (kalkulyatsiya)
**Nima:** Chiqilgan material qaysi buyurtmaga ketganini POS Monitor biriktiradimi — buyurtma tannarxiga material qo'shilishi uchun.
**Nega kerak:** Buyurtma rentabelligi material sarfisiz noto'g'ri; texkarta-normadan farq (ortiqcha sarf) ko'rinmaydi.
**Variantlar:**
- A) Har chiqim buyurtmaga biriktiriladi → buyurtma material tannarxi avto yig'iladi — rentabellik aniq
- B) Faqat ombor balansi, buyurtma bog'lanmaydi — sodda, lekin tannarx noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (tannarx), SD (buyurtma rentabelligi), PP (norma-fakt)

### Q44. Norma-fakt farqi (ortiqcha sarf) ogohlantirishi
**Nima:** Texkarta buyurtmaga N kg belgilagan; fakt chiqim undan ko'p bo'lsa POS Monitor ogohlantiradimi.
**Nega kerak:** Ortiqcha material sarfi — yashirin yo'qotish/o'g'irlik belgisi; kitobda material aniqligi muhim.
**Variantlar:**
- A) Norma oshsa qizil ogohlantirish + sabab so'raydi (brak/qayta sozlash) — yo'qotish ko'rinadi
- B) Faqat hisobotda farq ko'rinadi — passiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (norma), Finance, AI (anomaliya)

### Q45. Turniket/kirish-chiqish bilan bog'lanishmi
**Nima:** Kitob: ishga kirish-chiqishda "турникет картаси" ishlatiladi. POS Monitor logini turniket kartasi (RFID-bejet) bilan birmi yoki alohida PIN.
**Nega kerak:** Bitta karta bo'lsa, omborchi qo'shimcha parol eslamaydi va kim ishda ekani turniketdan ma'lum.
**Variantlar:**
- A) Turniket kartasi (RFID) = planshet login — bitta identifikator, qulay
- B) Alohida PIN/barcode-bejet — soddaroq integratsiya, lekin ikki tizim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (davomat), IoT (RFID), Q2 (login)

### Q46. A-System bilan bog'liqlik (eski tizim)
**Nima:** Kitob: zavod hozir "A-System (А-Система)" da reja/hisob yuritadi. POS Monitor A-System bilan ma'lumot almashadimi yoki uni butunlay almashtiradimi.
**Nega kerak:** Agar A-System ishlatilsa, ikki tizim qoldig'i bo'linib ketadi (memorydagi "ikki dunyo" muammosiga o'xshash).
**Variantlar:**
- A) ERP A-System'ni butunlay almashtiradi (migratsiya) — yagona haqiqat
- B) Vaqtincha parallel + sinxron ko'prik — buzilmaydi, lekin murakkab
- C) Keyin — egasi A-System taqdirini hal qilgach
⤳ Ta'sir: butun ombor/PP zanjiri

### Q47. Ярим тайёр (yarim tayyor) bosqichlari kuzatiladimi
**Nima:** Kitob: yarim tayyor = "ishlab chiqarishning muayyan bosqichidan o'tgan mahsulot". Gofra→bichish→bosma→yopishtirish kabi bosqichlar oralig'ida yarim tayyor POS Monitor'da alohida turadimi.
**Nega kerak:** Yarim tayyor sexlar oralig'ida ko'p turadi (rohlerda); hisobsiz bo'lsa, "qancha yarim tayyor zavodda turibdi" noma'lum.
**Variantlar:**
- A) Har bosqichdan keyin yarim tayyor alohida pozitsiya (bosqich nomi bilan) qabul qilinadi — to'liq WIP ko'rinadi
- B) Faqat xom material va tayyor mahsulot, yarim tayyor kuzatilmaydi — sodda, lekin WIP ko'rinmas
- C) Faqat sexlar orasidagi ombor (bufer) uchun — muvozanat
- D) Keyin — hozir kerak emas
⤳ Ta'sir: MES (WIP), PP, Finance (WIP qiymati)

### Q48. Texnik pasport / partiya hujjati FG kirimda
**Nima:** Kitob (Лаборант): tayyor mahsulotga "техник паспорт" tayyorlanadi. FG ombarga kirganda partiya texnik pasporti/sertifikati biriktiriladimi.
**Nega kerak:** Mijozga jo'natishda partiya sertifikati kerak; FG'ga bog'lanmasa, keyin izlab topib bo'lmaydi.
**Variantlar:**
- A) FG-kirimda partiya + texnik pasport biriktiriladi (lab xulosasidan) — jo'natishda tayyor
- B) Pasport alohida hujjatda, FG'ga bog'lanmaydi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (texnik pasport), SD (jo'natish), Q25 (partiya)

### Q49. Lab namuna olish ombordan harakatmi
**Nima:** Kitob: laborant "tekshirilgan xom ashyo partiyalari sonini" o'lchaydi — har partiyadan namuna oladi. Lab uchun olingan namuna POS Monitor'da chiqim sifatida yoziladimi.
**Nega kerak:** Namuna ham material sarfi; hisobsiz bo'lsa, balans namuna miqdoricha og'adi.
**Variantlar:**
- A) "Lab namunasi" alohida chiqim sababi (kichik, lekin qayd) — balans aniq
- B) Namuna hisobga olinmaydi — sodda, lekin og'ish to'planadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (lab), Q5 (chiqim sababi)

### Q50. Smenadan smenaga material topshirish (kitob "Юкни топширувчи Омборчи")
**Nima:** root.md da "Юкни топширувчи (Омборчи)" topshirish hujjati bor. Smena oxirida qoldiq keyingi smenaga rasmiy topshiriladimi (ikki imzo: topshiruvchi/qabul qiluvchi).
**Nega kerak:** Topshirishsiz, smena oralig'ida farq chiqsa kim mas'ul ekani noaniq.
**Variantlar:**
- A) Smena topshirish akti: chiqayotgan omborchi qoldiqni muhrlaydi → kelayotgan qabul qiladi (2 imzo) — javobgarlik aniq
- B) Faqat avto smena yopilishi, qabul imzosi yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (javobgarlik), Q27 (smena yopilishi)

### Q51. Yuk topshirish-qabul akti (kirimda yetkazib beruvchi bilan)
**Nima:** root.md "Юкни топширувчи/қабул қилувчи" — kirimda yetkazib beruvchi/haydovchi va omborchi o'rtasida qabul akti rasmiylashtiriladimi.
**Nega kerak:** Kelgan miqdor zakazdan kam/buzuq bo'lsa, aktda qayd etilmasa da'vo qilib bo'lmaydi.
**Variantlar:**
- A) Kirim akti: zakaz-fakt farqi + holat (buzilgan/kam) qayd → da'vo asosi — himoyalangan
- B) Faqat miqdor kiritiladi, akt yo'q — sodda, lekin da'vosiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (da'vo), MM (yetkazib beruvchi), Q4 (kirim)

### Q52. Kam yetkazilgan/buzuq material qabul rejimi
**Nima:** Kelgan miqdor zakazdan kam yoki bir qismi buzuq bo'lsa POS Monitor qisman qabulga ruxsat beradimi (kelganini qabul, qolganini "kutilmoqda").
**Nega kerak:** Hammasi yoki hech narsa bo'lsa, kelgan yaroqli material ham ishlatilmay turadi.
**Variantlar:**
- A) Qisman qabul (kelgan miqdor) + ochiq qoldiq + buzuq qismi alohida sabab — moslashuvchan va aniq
- B) Faqat to'liq qabul yoki rad — sodda, lekin qattiq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM, Finance, Q51 (qabul akti)

### Q53. Tozalik / 5S holati planshetda
**Nima:** Kitob "Кўп учрайдиган хатолар": "Тозаликка эътибор бермаслик". Ombor tozaligi/tartibi (5S) POS Monitor'da kuzatiladimi yoki bu modul tashqarisida.
**Nega kerak:** Kitob buni mas'uliyat deb belgilaydi; lekin POS Monitor — material harakati moduli, tozalik boshqa joyga tegishli bo'lishi mumkin.
**Variantlar:**
- A) Tozalik POS Monitor'dan tashqarida (Coordination/checklist moduli) — toza chegara
- B) Smena yopilishida qisqa "tozalik/tartib OK" belgisi — yengil integratsiya
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination, HR (intizom)

### Q54. Iш jойни ruxsatsiz tashlab ketish (planshet bog'liqligi)
**Nima:** Kitob xatolar: "иш жойини рухсатсиз ташлаб кетиш". Planshet ma'lum vaqt harakatsiz tursa/omborchi yo'q bo'lsa tizim buni qayd qiladimi.
**Nega kerak:** Omborsiz qolgan smena = sex kutib qoladi; kitobda bu jiddiy intizom buzilishi.
**Variantlar:**
- A) Planshet harakatsizligi + javobsiz talab boshliqqa signal — nazorat
- B) Faqat turniket chiqishi bilan bog'liq — yengilroq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), Q41 (bekor turish)

### Q55. Energiya/resurs (suv/gaz/svet) tejash POS'da
**Nima:** Kitob javobgarligi: "Энергия ресурсларни тежалиши (сув, газ свет)". Bu POS Monitor (material) doirasidami yoki IoT/Coordination'da.
**Nega kerak:** Chegarani aniqlash — POS Monitor material harakatiga e'tibor qaratishi kerak, resurs hisoblagichi IoT'ga tegishli.
**Variantlar:**
- A) Energiya — IoT/Coordination moduli, POS Monitor'da yo'q — toza chegara
- B) Keyin — hozir kerak emas
⤳ Ta'sir: IoT (hisoblagich), Director (KPI)

### Q56. Omborchi GSD: "reja bajarilish %" kitobdan
**Nima:** Kitob statistik ko'rsatkichlari: "режа бажарилиш даражаси (%)", "кечикишлар сони", "режадан оғиш сони". Omborchi/logist GSD aynan shu uch ko'rsatkichdan POS Monitor'da avto hisoblanadimi.
**Nega kerak:** Karta-modelда har lavozim o'z statistikasiga ega; kitob aynan bu raqamlarni belgilagan — qo'lda kiritish noto'g'ri.
**Variantlar:**
- A) Uch ko'rsatkich (reja % + kechikish soni + og'ish soni) POS harakatlaridan avto → logist kartasiga — kitobga to'liq mos
- B) Faqat reja % avto, qolgani qo'lda — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (karta GSD), Director, Q29

### Q57. Material birligi konversiyasi (rulon↔kg↔m)
**Nima:** Qog'oz rulonda keladi, sexga metr/kg bilan beriladi. POS Monitor bir birlikni boshqasiga avto o'giradimi.
**Nega kerak:** Omborchi qo'lda hisoblasa xato bo'ladi; kirim rulon, chiqim metr bo'lishi tabiiy.
**Variantlar:**
- A) Har materialga konversiya jadvali (1 rulon = N kg = M metr) → avto o'tkazish — xatosiz
- B) Faqat bitta birlik, qo'lda hisob — sodda, lekin xatoli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (birlik), Q14 (baholash)

### Q58. Buyurtma yopilgach ortib qolgan material
**Nima:** Buyurtma uchun chiqarilgan material to'liq ishlatilmasa (ortdi), u POS Monitor'da omborga qaytariladimi.
**Nega kerak:** Qaytmasa, material sexda "yo'qoladi" va buyurtma tannarxi noto'g'ri oshadi.
**Variantlar:**
- A) "Sexdan qaytarish" harakati (ortgan material omborga qaytadi, tannarxdan chiqadi) — aniq
- B) Qaytarish yo'q, hammasi sarf hisoblanadi — sodda, lekin tannarx shishiradi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (tannarx), Q43, Q58

### Q59. Yetkazib beruvchiga qaytarish (vozvrat)
**Nima:** Sifatsiz/noto'g'ri kelgan material yetkazib beruvchiga qaytarilsa POS Monitor'da qaytarish harakati bormi.
**Nega kerak:** Qaytarish — kirimning teskarisi + Finance da'vosi; oddiy chiqim deb yozilsa, da'vo va balans buziladi.
**Variantlar:**
- A) Alohida "yetkazib beruvchiga qaytarish" harakati → Finance da'vo/kredit-nota — to'liq iz
- B) Oddiy chiqim izoh bilan — sodda, lekin da'vosiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (kredit-nota), MM (yetkazib beruvchi reytingi)

### Q60. Material muddati (срок годности) — bo'yoq/elim
**Nima:** Bo'yoq, elim, lak kabi materiallar muddati o'tadi. POS Monitor muddati yaqinlashganda ogohlantiradimi va FEFO (muddati birinchi tugaydi — birinchi chiqadi) qo'llaydimi.
**Nega kerak:** Muddati o'tgan elim brak beradi; ogohlantirishsiz qolib ketadi.
**Variantlar:**
- A) Muddatli materiallarga FEFO + yaqinlashganda ogohlantirish — yo'qotish kamayadi
- B) Faqat partiya, muddat ogohlantirishsiz — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, MM, Q25 (partiya)

### Q61. Joylashuv (ombordagi joy / yacheyka) kuzatiladimi
**Nima:** Material ombordagi aniq joyda (rad/yacheyka/zona) turadimi yoki faqat "RM-MAIN omborda" darajasida.
**Nega kerak:** Katta omborda joyni bilmasa, omborchi materialni izlab vaqt yo'qotadi; rohler yo'lini ham rejalashtirib bo'lmaydi.
**Variantlar:**
- A) Joy (zona/rad) kuzatiladi, kirimda belgilanadi, chiqimda ko'rsatiladi — tez topish
- B) Faqat ombor darajasida, joysiz — sodda, lekin izlash sekin
- C) Faqat FG (tayyor mahsulot) uchun joy, xom material — joysiz
- D) Keyin — hozir kerak emas
⤳ Ta'sir: IoT, MES, ichki logistika marshruti

### Q62. Mijoz materiali (давальческое) ajratiladimi
**Nima:** Ba'zan mijoz o'z qog'ozini/dizaynini beradi (давальческое сырьё). Bunday material POS Monitor'da zavod mulkidan ajratiladimi.
**Nega kerak:** Mijoz materiali zavod balansiga qiymat sifatida tushmasligi kerak (zavodniki emas), lekin miqdor kuzatilishi shart.
**Variantlar:**
- A) "Mijoz materiali" alohida turi — miqdor kuzatiladi, qiymat zavod GL'ga tushmaydi — to'g'ri huquqiy holat
- B) Oddiy material kabi — sodda, lekin balansni shishiradi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance (balans), SD (mijoz), Q12 (GL)

### Q63. Inventar paytida ombor "muzlatiladimi" (freeze)
**Nima:** Sanash davomida kirim/chiqim davom etadimi yoki sanalayotgan zona bloklanadimi.
**Nega kerak:** Sanash chog'ida harakat bo'lsa, sanog'i hech qachon to'g'ri chiqmaydi (harakatlanayotgan miqdorni sanash mumkin emas).
**Variantlar:**
- A) Sanalayotgan zona harakatga vaqtincha bloklanadi (freeze) → sanab bo'lgach ochiladi — aniq natija
- B) Harakat davom etadi, tizim oraliq farqni hisoblaydi — uzluksiz, lekin murakkab
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (sex kutadi), Q15 (inventar)

### Q64. Inventar farqi chegarasi (avto-tasdiq limiti)
**Nima:** Kichik farq (masalan ±1%) avto tasdiqlanadimi yoki har farq boshliq tasdig'ini talab qiladimi.
**Nega kerak:** Har mayda farqqa boshliq tasdig'i — sekin; lekin chegara bo'lmasa katta farq ham o'tib ketadi.
**Variantlar:**
- A) Belgilangan chegaragacha (masalan ±N% yoki summagacha) avto, undan ortig'i tasdiq talab — muvozanat
- B) Har farq tasdiq talab qiladi — xavfsiz, lekin sekin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Finance, Q16 (inventar tasdiqi)

### Q65. Tezkor minimal qoldiq — kim zakaz beradi
**Nima:** Material minimaldan tushganda POS Monitor avto sotib olish talabini (purchase request) MM'ga yuboradimi yoki faqat omborchini ogohlantiradimi.
**Nega kerak:** Ogohlantirish odamga qolsa unutiladi; avto talab uzilishni oldini oladi (kitob: ta'minot uzilmasligi).
**Variantlar:**
- A) Minimaldan tushsa avto "sotib olish talabi" → MM/snabjeniyega — proaktiv
- B) Faqat omborchiga ogohlantirish, u qo'lda so'raydi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (snabjeniye), Finance (byudjet), Q11

### Q66. Buyurtma uchun rezerv (band qilish)
**Nima:** Reja buyurtmaga material belgilaganda, u POS Monitor'da "band" (rezerv) qilinadimi — boshqa buyurtma uni ololmasin.
**Nega kerak:** Rezervsiz bo'lsa, bitta material ikki buyurtmaga "tegishli" ko'rinib, biri materialsiz qoladi.
**Variantlar:**
- A) Reja material rezervlaydi → erkin qoldiq alohida ko'rinadi (jami ╳ erkin) — ishonchli reja
- B) Rezerv yo'q, kim oldin chiqarsa o'shaники — sodda, lekin to'qnashuv xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (reja), MES, Q40

### Q67. Shoshilinch chiqim (rejasiz/ruxsatli)
**Nima:** Reja tashqarisida shoshilinch material kerak bo'lsa (avariya, qayta sozlash) omborchi rejasiz chiqim qila oladimi.
**Nega kerak:** Reja qattiq bloklasa, real ishlab chiqarish to'xtaydi; lekin rejasiz chiqim sababsiz bo'lmasligi kerak.
**Variantlar:**
- A) Rejasiz chiqim ruxsat etiladi, lekin majburiy sabab + boshliq darhol xabardor — moslashuvchan + nazorat
- B) Faqat rejadagi material chiqadi — qattiq, lekin amaliyotga zid
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP, Q42 (talab), Q67

### Q68. Bichish/qirqish chiqimi (ko'p materialdan bo'lak)
**Nima:** Bitta katta rulondan bir necha buyurtmaga bo'lib chiqariladi. POS Monitor rulondan qisman chiqim (qoldiq rulonda qoladi) ni qo'llaydimi.
**Nega kerak:** Rulon "butun yoki yo'q" bo'lsa, real bichish (yarmi ishlatildi) hisobga tushmaydi.
**Variantlar:**
- A) Qisman chiqim — rulon qoldig'i o'lchov birligida kamayadi (ochiq rulon) — aniq
- B) Faqat butun rulon chiqimi — sodda, lekin noaniq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MM (o'lchov), Q57 (konversiya), Q68

### Q69. Foto-dalil (kirim/brak/inventar farqi)
**Nima:** Buzuq kelgan material, brak yoki inventar farqida planshet kamerasidan foto biriktiriladimi.
**Nega kerak:** Foto — da'vo va auditda eng kuchli dalil; keyin "buzuq edi" deganda isbot bo'ladi.
**Variantlar:**
- A) Buzuq qabul/brak/katta farqda foto majburiy — dalil bilan himoya
- B) Foto ixtiyoriy — yengilroq, lekin dalilsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC, Finance (da'vo), Q51

### Q70. Offline yozilgan harakat to'qnashuvi (konflikt)
**Nima:** Q21 offline rejimni qabul qildi. Ikki planshet offline bir materialni chiqarib, ikkalasi sinxronlanganda qoldiq manfiy chiqsa tizim nima qiladi.
**Nega kerak:** Offline + manfiy guard birga ishlashi kerak; aks holda sinxronda buzilgan balans paydo bo'ladi.
**Variantlar:**
- A) Sinxronda to'qnashuv aniqlansa — harakat "tekshirilsin" holatiga, boshliq hal qiladi — ma'lumot toza
- B) Birinchi sinxron yutadi, ikkinchi rad — sodda, lekin ish yo'qoladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Q10 (balans-guard), Q21 (offline)

### Q71. Telegram/bildirishnoma — qaysi hodisa kimga
**Nima:** Minimal qoldiq, brak, bekor turish, lab rad — qaysi hodisada kimga (omborchi/boshliq/snabjeniye) bildirishnoma boradi.
**Nega kerak:** Hamma hodisa hammaga borsa — shovqin; kerakli odam o'tkazib yuboradi.
**Variantlar:**
- A) Hodisa→rol matritsasi sozlanadi (admin panelda) — moslashuvchan
- B) Kodda qat'iy belgilangan — sodda, lekin o'zgartirish uchun dasturchi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Notifications, Q28 (master-data)

### Q72. Tayyor mahsulot jo'natish (отгрузка) POS'dami
**Nima:** FG mijozga jo'natilganda chiqim POS Monitor'da bo'ladimi yoki bu SD/jo'natish modulida.
**Nega kerak:** Chegara aniq bo'lmasa, jo'natish ikki joyda yoki hech qayerda yozilmaydi.
**Variantlar:**
- A) FG jo'natish chiqimi POS Monitor'da, lekin SD jo'natish hujjatiga bog'liq (sotuv buyurtmasidan) — yagona manba + bog'liqlik
- B) Jo'natish butunlay SD modulida, POS Monitor faqat FG kirimi — toza ajratish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (jo'natish), Finance (sotuv), Q24 (FG kirim)

### Q73. Marshrut varaqasi (накладная) chop etish
**Nima:** Chiqim/ko'chirishda qog'oz накладная (yuk varaqasi) chop etiladimi (haydovchi/sex imzosi uchun).
**Nega kerak:** Zavodda hujjat qog'ozda yuriydi (kitob 2020); butun raqamli o'tish bir zumda bo'lmaydi.
**Variantlar:**
- A) Harakatda накладная chop etish opsiyasi (printerga) — o'tish davri uchun qulay
- B) Faqat raqamli, qog'oz yo'q — toza, lekin amaliyotga keskin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Q7 (printer), SD (jo'natish hujjati)

### Q74. Razряд/malaka — kim qaysi harakatni qila oladi
**Nima:** Karta-modelда razряd bor. Yangi omborchi (past razряd) faqat oddiy chiqim, brak/inventar/qaytarish kabi muhim harakatlar — yuqori razряd/tasdiq talab qiladimi.
**Nega kerak:** Vizyon razряdga oylik/talabni bog'laydi; harakat huquqi ham razряdga bog'lansa, xato kamayadi.
**Variantlar:**
- A) Harakat turi razряd/lavozimga bog'liq (oddiy ╳ muhim) — bosqichma-bosqich ishonch
- B) Hamma omborchi hamma harakatni qila oladi — sodda, lekin xavfli
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (razряd), Q9 (tasdiq), Q2

### Q75. Kunlik hisobotni kim ko'radi (vertikal)
**Nima:** Smena/kunlik ombor hisoboti org-kartadagi keyingi yuqori darajaga (manager_id) avto boradimi.
**Nega kerak:** Vizyon vertikali — har ko'rsatkich yuqoriga oqadi; ombor hisoboti logistika boshlig'i→ishlab chiqarish→CEO yo'nalishida ko'rinishi kerak.
**Variantlar:**
- A) Kunlik hisobot vertikal yuqoriga avto (har daraja o'z kesimini ko'radi) — vizyonga mos
- B) Faqat ombor boshlig'i ko'radi — sodda, lekin uzilgan
- C) Keyin — hozir kerak emas
⤳ Ta'sир: Director, Coordination, Q56

### Q76. Buyurtma o'zgarishi (kitob: "o'zgarishlarni hisobga olmaslik" xatosi)
**Nima:** Kitob xatosi: "ишлаб чиқаришдаги ўзгаришларни ҳисобга олмаслик". Reja/buyurtma o'zgarsa (bekor/miqdor o'zgardi), POS Monitor allaqachon chiqarilgan materialga qanday ishlov beradi.
**Nega kerak:** Buyurtma bekor bo'lsa-yu material chiqib ketgan bo'lsa, u sexda qolib ketadi (kitobdagi tipik xato).
**Variantlar:**
- A) Buyurtma o'zgarsa POS Monitor ogohlantiradi + chiqarilgan material qaytarish taklif qilinadi — uzilish kamayadi
- B) O'zgarish faqat rejada, ombor xabardor emas — sodda, lekin xato qaytadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: PP (reja o'zgarishi), SD, Q58 (qaytarish)

### Q77. Tunги smena / kechki harakat anomaliyasi
**Nima:** Q20 anomaliyani qabul qildi. Aniq misol: tunda (smena yo'q vaqtda) harakat yoki bir omborchining odatdan tashqari katta chiqimi — POS Monitor maxsus belgilaydimi.
**Nega kerak:** Kitobда material aniqligi va o'g'irlik xavfi muhim; vaqt+miqdor anomaliyasi eng aniq belgi.
**Variantlar:**
- A) Smena jadvalidan tashqari vaqt + norma-oshiq chiqim avto shubhali belgilanadi → boshliq — proaktiv
- B) Faqat hisobotda — passiv
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI (anomaliya), HR (smena jadvali), Q44, Q77

### Q78. Material kartasini kim yaratadi (omborchimi)
**Nima:** Yangi material birinchi marta kelganda, omborchi planshetda yangi material kartasi yarata oladimi yoki faqat MM master-data'da bo'lgani chiqim/kirim qilinadi.
**Nega kerak:** Omborchi karta yaratsa — dublikat/xato katalog paydo bo'ladi (memorydagi master-data ust-ustlik muammosi); lekin kuta olmasa ish to'xtaydi.
**Variantlar:**
- A) Faqat MM tasdiqlagan material kartasi ishlatiladi; yangisi MM'ga so'rov sifatida boradi — toza katalog
- B) Omborchi vaqtincha karta yaratadi, MM keyin tasdiqlaydi — tez, lekin dublikat xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sир: MM (master-data), Q33, Q37

### Q79. Eski tizimdan boshlang'ich qoldiq (начальный остаток)
**Nima:** POS Monitor ishga tushganda omborda allaqachon turgan material qoldig'i qanday kiritiladi — bir martalik inventar bilanmi yoki A-System'dan import.
**Nega kerak:** Boshlang'ich qoldiqsiz balans noldan boshlanadi va birinchi chiqimda manfiy chiqadi.
**Variantlar:**
- A) Ishga tushishda bir martalik to'liq inventar (real sanash) → boshlang'ich qoldiq — eng ishonchli
- B) A-System'dan import — tez, lekin eski xatolar ko'chadi
- C) Keyin — egasi A-System taqdirini hal qilgach (Q46)
⤳ Ta'sир: Q46 (A-System), Q15 (inventar)

### Q80. Harakat tarixini kim ko'ra oladi (audit)
**Nima:** Bitta material bo'yicha hamma harakat tarixini (kim, qachon, qancha) kim ko'ra oladi — har omborchimi yoki faqat boshliq/audit.
**Nega kerak:** Tarix — auditning asosi; ko'rinmasa nizo/farqni kuzatib bo'lmaydi, lekin har kim o'zgartira olmasligi kerak (faqat o'qish).
**Variantlar:**
- A) Tarix o'zgarmas (faqat o'qish) — omborchi o'ziniki + boshliq hammasi — toza audit
- B) Faqat boshliq ko'radi — yopiq, lekin omborchi o'zini tekshira olmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sир: Director (audit), Q22 (storno)

### Q81. Yuk topshirishda nomuvofiqlik (root.md akti)
**Nima:** root.md "Юкни топширувчи (Омборчи)" aktida topshirilgan va qabul qilingan miqdor farq qilsa (sexga 10 ketdi, sex 9 qabul qildi) POS Monitor bu farqni qanday yopadi.
**Nega kerak:** Farq yopilmasa, 1 birlik "havoda" qoladi — kim mas'ul noaniq.
**Variantlar:**
- A) Topshirish↔qabul ikki imzo bilan tasdiqlanadi; farq bo'lsa "nizo" holati + boshliq hal qiladi — javobgarlik aniq
- B) Topshiruvchi miqdori asos, qabul tekshirmaydi — sodda, lekin farq yashirin
- C) Keyin — hozir kerak emas
⤳ Ta'sир: MES (sex qabuli), Q50, Q31

### Q82. POS Monitor til/ko'rinish (omborchi uchun)
**Nima:** Planshet interfeysi qaysi tilda — o'zbek lotin, kirill yoki rus (kitob hujjatlari kirill o'zbek + rus aralash; omborchilar har xil savodxon).
**Nega kerak:** Omborchi tushunmagan tildagi tugma — xato bosadi; kitob kirill-o'zbek va rusda yozilgan.
**Variantlar:**
- A) Omborchi profilidan til tanlanadi (lotin/kirill/rus), ikonka-markaz dizayn — hamma uchun ochiq
- B) Faqat lotin o'zbek — sodda, lekin keksa xodimlarga qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sир: i18n, Q26 (ekran)

DONE: POS Monitor — 52.
