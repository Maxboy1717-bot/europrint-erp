# IoT — YANGI (kitob-grounded) savollar

> EuroPrint Qo'qon karton/qadoqlash zavodi ERP — IoT moduli uchun YANGI vizyon savollari (v2).
> Manba grounding: `docs/audit/kitob-extracted/root.md` — "Станоклар норма.xlsx", "Отчет о производительности работы оборудований", smena tablitsasi (А/Б/С smena, Станок · Станокдаги Ишлар · кейинги иши), va "иш йук"/брак sabablari.
> Real mashinalar (kitobdan): **Печать SM-52, SM-72, KBA-105** (ofset bosma), **Гофра линия (м2)**, **Флексо печать**, **Трафаретный Лак**, **UV лакировка**, **Ламинация (катта/кичик/полуавтомат)**, **Авто/полуавтомат/ручная кашировка**, **Автовысечка картон/гофра**, **Тигель 1–10** (висечка/тиснение/конгрев), **ФСМ (большой/маленький/полуавтомат)**, **Окошка**, **Склейка ручная**, **Степлер 1/2/3**, **Упаковка**, **Резка**.
> Real o'lchov birliklari: **м2 · лист · штук · удар/лист**. Real norma: **норма штук 1 час · норма штук за 12 часов · 1 смена**. Real muammolar: **брак %**, **иш йук (idle)**, "колибни таергарлик курмаганимиз сабабли -4 соат", "ремонтда", "иш икки марта кайта урилган", "Билма заказ настройкаси муракаб".
> Har savol — bitta aniq qaror. Birinchi variant = vizyonga eng mos (tavsiya). 628 mavjud savol (v1 + boshqa) takrorlanmaydi.

---

### Q1. Mashina master-reestri "Станоклар норма" jadvaliga aniq mos kelsinmi
**Nima:** IoT mashina reestri kitobdagi "Станоклар норма.xlsx" ro'yxatidagi aynan o'sha nomlar (SM-52, KBA-105, Тигель 1–10, Гофра линия, ФСМ, ...) bilan to'ldirilsinmi.
**Nega kerak:** Zavod allaqachon shu nomlar bilan ishlaydi va norma yuritadi — yangi nom o'ylab topilsa, smena tabeli bilan IoT raqamlari mos kelmaydi.
**Variantlar:**
- A) Reestr xuddi "Станоклар норма" jadvalidagi nomlar bilan seed qilinadi (1:1 moslik) — eski qog'oz hisobot bilan to'la mos
- B) Yangi soddalashtirilgan nomlar bilan, eski nomlar faqat izoh sifatida — toza, lekin operator chalkashadi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Ishlab chiqarish (norma), Smena tabeli

### Q2. Har mashinaga "norma штук 1 час" qiymati biriktirilsinmi
**Nima:** Kitobdagi "норма штук 1 час" va "норма штук за 12 часов" qiymatlari har mashina kartasiga IoT'da saqlansinmi (target tezlik).
**Nega kerak:** IoT mashinaning haqiqiy chiqishini normaga solishtirib "norma bajarildimi" deyishi uchun har mashinada target raqam bo'lishi shart.
**Variantlar:**
- A) Har mashina kartasida norма/soat + norма/12 soat saqlanadi, IoT haqiqiy bilan solishtiradi — performance % avtomatik
- B) Norma faqat Ishlab chiqarish modulida, IoT undan o'qiydi — markazlashgan, lekin bog'lanish kerak
- C) Keyin — hozir kerak emas
  ↳ Agar A: norma kim tasdiqlaydi? — A) "Согласовано РД4 + Утверждено Ген.Директор" (kitobdagidek imzo-zanjir) · B) faqat ishlab chiqarish boshlig'i · C) admin

### Q3. O'lchov birligi mashinaga qarab farq qilsinmi (м2 / лист / штук / удар)
**Nima:** Kitobda Гофра линия = **м2**, ofset = **лист**, Тигель = **удар/лист**, qolganlari = **штук**. IoT hisoblagichi har mashina uchun o'z birligida ishlasinmi.
**Nega kerak:** Hamma mashinani "dona"da hisoblasak gofra (m2) va tigel (udar/list) noto'g'ri chiqadi — birlik mashinaga bog'liq.
**Variantlar:**
- A) Har mashinada o'z birligi (м2/лист/штук/удар) — kitobga aniq mos, to'g'ri hisob
- B) Hamma "dona"ga keltiriladi (konvertatsiya bilan) — sodda hisobot, lekin gofra/tigelda xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Ishlab chiqarish hisoboti, Norma

### Q4. Tigel uchun "удар/лист" (zarba) hisoblagichi alohida kuzatilsinmi
**Nima:** Тигель (висечка/тиснение/конгрев) mashinalarida natija lист emas, **удар** (har bosish) bilan o'lchanadi — IoT zarba hisoblagichi qo'yilsinmi.
**Nega kerak:** Tigel resursi va eskirishi zarba soniga bog'liq; bir varaqqa bir necha udar bo'lishi mumkin — faqat varaq sanasak texnik xizmat noto'g'ri rejalashadi.
**Variantlar:**
- A) Тигель mashinalarida udar va lист ikkalasi alohida hisoblanadi — resurs + ishlab chiqarish ikkisi to'g'ri
- B) Faqat lист hisoblanadi — sodda, lekin udar-resurs ko'rinmaydi
- C) Keyin — hozir kerak emas
  ↳ Agar A: udar sonidan texnik xizmat eslatmasi chiqsinmi (masalan har 1 mln udarda)?

### Q5. SM-52 / SM-72 / KBA-105 bosma ranglar soni (seksiya) kuzatilsinmi
**Nima:** Ofset bosma mashinalarida bosilgan ranglar/seksiyalar soni (4+0, 4+4 va h.k.) IoT'da yozilsinmi.
**Nega kerak:** Bo'yoq sarfi, plastina (колиб) soni va tezlik rang soniga bog'liq — buni bilmasak material va norma noto'g'ri.
**Variantlar:**
- A) Har bosma ishi uchun rang/seksiya soni yoziladi (texnik topshiriqdan keladi) — material va norma aniq
- B) Faqat varaq soni, rang yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (bo'yoq), Dizayn (rang), Norma

### Q6. "иш йук" (idle / ish yo'qligi) alohida holat sifatida kuzatilsinmi
**Nima:** Kitobda takror uchraydi: "ходимлар иш йуклиги сабабли...", "иш йуклиги сабабли паддон кадоклаган". IoT'da "иш йук" mashina to'xtashining alohida sababi bo'lsinmi.
**Nega kerak:** Ish yo'qligi mashina nosozligi emas — bu rejalashtirish muammosi; aralashtirsak nosozlik statistikasi buziladi va ShVB noto'g'ri xulosa chiqaradi.
**Variantlar:**
- A) "Иш йук" alohida toifa (rejalashtirish kamchiligi) — nosozlikdan ajraladi, ShVB to'g'ri ko'radi
- B) Umumiy "to'xtagan"ga qo'shiladi — sodda, lekin sababi ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish rejalashtirish (MPS/MRP), ShVB samaradorlik

### Q7. "Колиб (qolip) tayyorlanmagani" to'xtash sababi sifatida tanlansinmi
**Nima:** Kitobda real izoh: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". To'xtash sabablari ro'yxatida "qolip o'z vaqtida tayyorlanmadi" bo'lsinmi.
**Nega kerak:** Zavodning haqiqiy yo'qotishi shu — qolip kechikkani; standart sabab bo'lsa kim/qaysi bo'lim aybdor ekani aniqlanadi.
**Variantlar:**
- A) "Колиб тайёр эмас" alohida sabab + mas'ul bo'lim (qolip tsexi) biriktiriladi — javobgarlik aniq
- B) Umumiy "sozlash kutilmoqda"ga qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Qolip/штамп tsexi, Ishlab chiqarish reja

### Q8. "Иш икки марта кайта урилган" (qayta urish) brak sabab kodi sifatida
**Nima:** Kitobda: "иш икки марта кайта урилган колиб яримтали + подрезка". Mahsulot qayta urilishi (peredelka) IoT/MES brak sabab kodi bo'lsinmi.
**Nega kerak:** Qayta urish = vaqt va material yo'qotish; sababi (qolip yarim, podrezka) yozilsa takror oldini olinadi.
**Variantlar:**
- A) "Кайта урилди (переделка)" sabab kodi + qisqa izoh — yo'qotish manbasi aniq
- B) Faqat brak % oshadi, sabab yo'q — sodda, lekin tahlil yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), Norma (brak %)

### Q9. "Билма заказ настройкаси муракаб" — sozlash vaqti (setup) alohida o'lchansinmi
**Nima:** Kitob: "Билма заказ настройкаси муракаб - вакт кетди". Yangi/murakkab buyurtma sozlash (setup/наладка) vaqti ishlash vaqtidan ajratib o'lchansinmi.
**Nega kerak:** Sozlash vaqti ishlamayotgan vaqt — uni ishlab chiqarish vaqtiga qo'shsak norma soxta past chiqadi; ajratilsa OEE to'g'ri.
**Variantlar:**
- A) Setup vaqti alohida holat (sozlanmoqda) sifatida sanaladi va OEE'da hisobga olinadi — to'g'ri samaradorlik
- B) Sozlash ham "ishlayapti"ga kiradi — sodda, lekin norma buziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Norma, Smena hisoboti

### Q10. Smena bo'yicha (А / Б / С) holat va norma ajratilsinmi
**Nima:** Kitobda smenalar А/Б/С belgilangan. IoT ko'rsatkichlari (uptime, brak, norma) har smena bo'yicha alohida hisoblansinmi.
**Nega kerak:** Qaysi smena yaxshi/yomon ishlashini bilmasak, ShVB smena boshliqlarini taqqoslay olmaydi.
**Variantlar:**
- A) Har smena (А/Б/С) bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktiriladi — adolatli taqqoslash
- B) Faqat kunlik umumiy — sodda, lekin smena farqi ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (smena boshlig'i KPI), ShVB

### Q11. "Станокдаги ишлар · кейинги иши" navbat IoT ekranida ko'rinsinmi
**Nima:** Kitob tabelida har mashinada "Станокдаги Ишлар" (hozirgi) va "кейинги иши" (keyingi) bor. IoT/Andon ekranida shu ikki ish ko'rinsinmi.
**Nega kerak:** Operator keyingi ishni ko'rsa, qolip/material oldindan tayyorlanadi — to'xtash kamayadi; bu zavodda allaqachon qog'ozda yuritiladigan model.
**Variantlar:**
- A) Har mashina kartasida "hozirgi ish + keyingi ish" MES'dan kelib ko'rsatiladi — uzluksizlik
- B) Faqat hozirgi ish ko'rinadi — sodda, lekin tayyorgarlik kech
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (ish navbati), Ishlab chiqarish reja

### Q12. Har mashinaga operator va yordamchi biriktirilsinmi (kim ishlatdi)
**Nima:** Kitob tabelida har stanok yonida "Оператор: ___ / Ёрдамчи: ___". IoT smena yozuvida mashinada kim ishlaganini yozsinmi.
**Nega kerak:** Brak yoki rekord kimning smenasida bo'lganini bilmasak, KPI va o'qitish (darslik) manzilsiz qoladi.
**Variantlar:**
- A) Smena yozuvida operator + yordamchi(lar) biriktiriladi (HR kartasidan) — KPI manzili aniq
- B) Faqat mashina yoziladi, odam yo'q — sodda, lekin javobgarlik yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (KPI, darslik), karta-model

### Q13. Гофра линия uchun м2 hisoblagich Ombor (karton) bilan bog'lansinmi
**Nima:** Гофра линия chiqishi м2 da; IoT'dagi м2 hisoblagich sarflangan karton/lайнер bilan solishtirilsinmi.
**Nega kerak:** Ishlab chiqarilgan m2 va olingan material m2 farqi = yo'qotish/brak; avtomatik solishtirilsa o'g'irlik/isrof ko'rinadi.
**Variantlar:**
- A) Ishlab chiqarilgan м2 ↔ sarflangan material м2 avtomatik solishtiriladi, farq ogohlantiriladi — isrof nazorati
- B) Faqat ishlab chiqarish m2 yoziladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Sifat (brak), Moliya

### Q14. UV лак / Трафаретный лак uchun lак sarfi kuzatilsinmi
**Nima:** UV lakировка va Трафаретный лак mashinalarida lak/химикат sarfi varaq soniga bog'lab kuzatilsinmi.
**Nega kerak:** Lak qimmat material; nechta varaqqa qancha lak ketishini bilmasak, sarf normasi va xarajat noaniq.
**Variantlar:**
- A) Lак mashinalarida varaq/m2 → lak sarf normasi (haqiqiy ↔ kutilgan) kuzatiladi — material nazorati
- B) Lak sarfi faqat Ombor chiqimida, IoT'da yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (lak/химикат), Moliya

### Q15. Ламинация uchun plyonka (рулон) sarfi va isrofi
**Nima:** Ламинация (катта/кичик/полуавтомат) mashinalarida plyonka rulon sarfi va chetlama (обрезка) isrofi IoT'da hisoblansinmi.
**Nega kerak:** Plyonka rulonlab keladi; isrof foizi yuqori bo'lsa mashina sozlamasi yoki operator muammosi bor demak.
**Variantlar:**
- A) Plyonka sarfi + isrof % har ишда yoziladi, chegaradan oshsa ogohlantiriladi — isrof nazorati
- B) Faqat metr/m2 sarf, isrof yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (plyonka), Sifat

### Q16. Степлер 1/2/3 va Склейка — qo'l mehnati mashinalari IoT'ga kiradimi
**Nima:** Степлер ручной-1/2/3, Склейка ручная, Окошка kabi qo'l/yarim-avtomat ish joylari IoT-sensor bilan kuzatiladimi yoki faqat qo'lda hisoblanadimi.
**Nega kerak:** Qo'l ish joylariga sensor qo'yish qiyin/qimmat; lekin norma (kitobda бор) hisoblanishi kerak — qaysi yo'l tanlanadi.
**Variantlar:**
- A) Qo'l ish joylari tabletdan qo'lda kiritiladi (norма штук bilan solishtiriladi), sensor yo'q — arzon, real
- B) Hammasiga sensor/hisoblagich — to'liq, lekin qimmat va murakkab
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Operator tableti, Norma

### Q17. Резка (kesish) mashinasi material kirim nuqtasi sifatida kuzatilsinmi
**Nima:** Резка ko'pincha birinchi operatsiya (rulon/listga). IoT'da Резка kesilgan varaq sonini hisoblab keyingi mashinalarga "kirish" raqamini bersinmi.
**Nega kerak:** Keyingi mashinalar braki ulardan oldingi varaq sonidan o'lchanadi; Резка raqami bo'lmasa zanjir bo'ylab yo'qotishni kuzatib bo'lmaydi.
**Variantlar:**
- A) Резка chiqishi keyingi bosqich uchun "kirish miqdori" bo'lib zanjir bo'ylab kuzatiladi — yo'qotish har bosqichda ko'rinadi
- B) Har mashina mustaqil hisoblanadi, zanjir yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES (operatsiya zanjiri), Sifat

### Q18. "отработано часов" (ishlangan soat) vs 12 soatlik smena solishtirilsinmi
**Nima:** Kitobda "отработано часов" va "норма штук за 12 часов" bor. IoT haqiqiy ishlangan soatni 12 soatlik smenaga solishtirib bo'sh vaqtni ko'rsatsinmi.
**Nega kerak:** 12 soatdan necha soat haqiqatan ishladi — qolgani idle/setup/remont; bu ShVB ning asosiy yo'qotish ko'rsatkichi.
**Variantlar:**
- A) Smena = 12 soat baza; ishlangan/bo'sh/sozlash/remont soatlarga bo'linadi — to'liq vaqt tahlili
- B) Faqat ishlangan soat yoziladi — sodda, bo'sh vaqt ko'rinmaydi
- C) Keyin — hozir kerak emas
  ↳ Agar A: smena uzunligi (8/10/12 soat) mashinaga/sexga qarab sozlanadimi?

### Q19. "ко-во работ" (ish/buyurtma soni) smenada bajarilgan ish soni o'lchansinmi
**Nima:** Kitobda "ко-во работ" (nechta alohida buyurtma bajarilgan) bor. IoT smena yozuvida bir smenada nechta turli ish (qolip almashtirish) bo'lganini sanaydimi.
**Nega kerak:** Ko'p kichik ish = ko'p sozlash = past norma; buni bilmasak operatorni "sekin" deb noto'g'ri ayblaymiz.
**Variantlar:**
- A) Smenada bajarilgan ish soni + har biriga sozlash vaqti sanaladi — norma adolatli baholanadi
- B) Faqat umumiy chiqish, ish soni yo'q — sodda
- C) Keyin — hozir kerak emas

### Q20. Брак % chegarasidan oshganda avtomatik ogohlantirish
**Nima:** Kitobda "брак %" ustuni bor. IoT/MES smena brak foizi belgilangan chegaradan oshsa real vaqtda ogohlantirsinmi.
**Nega kerak:** Brak kech bilinsa butun partiya yaroqsiz bo'ladi; chegara oshganda darhol to'xtatib sabab izlash kerak.
**Variantlar:**
- A) Brak % chegaradan oshsa → smena boshlig'i + sifatga darhol signal (ekran + Telegram) — erta to'xtatish
- B) Faqat smena oxirida hisobotda ko'rinadi — kech, lekin sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (QC), ShVB, Telegram bot

### Q21. Brak chegarasi mashina turiga qarab farq qilsinmi
**Nima:** Gofra, ofset, tigel, kashировка uchun "normal brak %" turlicha. Chegara har mashina turi uchun alohida sozlansinmi yoki bitta umumiy.
**Nega kerak:** Bitta umumiy chegara qo'ysak — ba'zi mashina doim "yomon", ba'zisi hech qachon signal bermaydi.
**Variantlar:**
- A) Har mashina turiga o'z brak chegarasi (ishlab chiqarish boshlig'i belgilaydi) — adolatli
- B) Bitta umumiy chegara — sodda, lekin noaniq
- C) Keyin — hozir kerak emas

### Q22. Авто vs ручная кашировка — avtomat/qo'l mashina samaradorligi taqqoslansinmi
**Nima:** Kitobda кашировка 3 turda: авто, полуавтомат, ручная. IoT ularning norma/samaradorligini taqqoslab qaysisi tejamliroq ekanini ko'rsatsinmi.
**Nega kerak:** Egasi avto-mashinaga investitsiya qaytishini ko'rishi uchun avto ↔ qo'l samaradorligini raqamda taqqoslash kerak.
**Variantlar:**
- A) Avto/yarim-avto/qo'l kashировка solishtirma hisoboti (m2/soat, brak, mehnat) — investitsiya qarori uchun
- B) Hammasi bir guruh sifatida — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (CAPEX qaror), ShVB

### Q23. Мashina ish-davriyligi: "иш %" (yuklanish foizi) ko'rsatkichi
**Nima:** Kitobda "иш %" (mashina nechа foiz band) bor. IoT har mashinaning yuklanish foizini (band/bo'sh) ko'rsatsinmi.
**Nega kerak:** Doim band mashina — bo'g'iz (bottleneck); doim bo'sh mashina — ortiqcha quvvat. Bu rejalashtirish va investitsiya uchun muhim.
**Variantlar:**
- A) Har mashina yuklanish % (kun/hafta) + bo'g'iz belgilanadi — quvvat rejasi aniq
- B) Faqat uptime, yuklanish yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish quvvat rejasi (CRP), ShVB

### Q24. "Согласовано РД4 / Утверждено Ген.Директор" — norma tasdiq zanjiri IoT'da saqlansinmi
**Nima:** Kitob hisobotida norma "Согласовано РД4" (Yulchiev M.) + "Утверждено Ген.Директор" (Pozilov A.) imzosi bilan tasdiqlanadi. IoT'dagi norma o'zgarishi shu tasdiq zanjirini talab qilsinmi.
**Nega kerak:** Norma o'zgarsa oylik o'zgaradi — har kim o'zgartira olmasligi, faqat tasdiqlangani amal qilishi kerak.
**Variantlar:**
- A) Norma o'zgarishi RD (ishlab chiqarish boshlig'i) → Direktor tasdig'idan o'tadi (audit jurnali bilan) — kitobdagidek nazorat
- B) Ishlab chiqarish boshlig'i o'zi o'zgartiradi — tez, lekin nazoratsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (oylik), ShVB, Audit

### Q25. ФСМ (большой/маленький/полуавтомат) — yelimlash mashinasi tezligi va uzilishi
**Nima:** ФСМ (folder-gluer) mashinalarida tezlik (dona/soat) va qog'oz uzilishi/tiqilib qolishi (зажор) IoT'da kuzatilsinmi.
**Nega kerak:** ФСМ tez mashina; uzilish/tiqilish ko'p bo'lsa karton namligi yoki sozlama muammosi — buni bilmasak sababsiz to'xtaydi.
**Variantlar:**
- A) ФСМ tezlik + tiqilish soni kuzatiladi, ko'paysa ogohlantiriladi — sabab erta topiladi
- B) Faqat chiqish soni — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (karton namligi), Ombor

### Q26. Tigrel/висечка qolip (штамп) resursini udar soniga bog'lash
**Nima:** Har die-cut qolip (штамп) cheklangan udar soniga chidaydi. IoT qolip udar hisoblagichini yuritib eskirganda almashtirishni eslatsinmi.
**Nega kerak:** Eskirgan qolip brak beradi; oldindan eslatsa partiya buzilmaydi va qolip o'z vaqtida tayyorlanadi (Q7 muammosi).
**Variantlar:**
- A) Har qolip kartasi + udar hisoblagichi + resurs chegarasi → almashtirish eslatmasi — brak oldini olish
- B) Qolip resursi kuzatilmaydi, sinmaguncha ishlatiladi — arzon, lekin brak xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Qolip tsexi, Sifat, Texnik xizmat

### Q27. Мashina yonidagi defekt sababini operator tabletdan tanlasinmi
**Nima:** Brak topilganda operator tabletdan tayyor sabab ro'yxatidan (qolip yarim, podrezka, rang ketdi, karton ho'l) tanlaydimi.
**Nega kerak:** Erkin matn tahlil qilib bo'lmaydi; kitobdagi real sabablar tayyor ro'yxat bo'lsa Pareto (eng ko'p brak sababi) chiqadi.
**Variantlar:**
- A) Tayyor sabab ro'yxati (kitobdagi real holatlardan) + ixtiyoriy izoh — tahlilga qulay
- B) Faqat erkin matn — moslashuvchan, tahlilsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (Pareto), Operator tableti

### Q28. Smena topshirish (А→Б) paytida mashina holati IoT'da qayd etilsinmi
**Nima:** Smena almashganda (А→Б→С) tugatilmagan ish, mashina holati, qolgan material tabletda topshiriladimi.
**Nega kerak:** Topshirilmasa keyingi smena nimadan boshlashini bilmaydi — yana sozlash, yana yo'qotish; smena topshirish jurnali bu muammoni yopadi.
**Variantlar:**
- A) Smena topshirish ekrani: tugatilmagan ish + mashina holati + qolip/material + izoh — uzluksizlik
- B) Topshirish yo'q, har smena mustaqil — sodda, lekin uzilish
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, MES, HR

### Q29. "иш йук" soatlarida xodimlar boshqa ishga (паддон/арчиш) o'tkazilgani yozilsinmi
**Nima:** Kitob: "ходимлар иш йуклиги учун арчишда ишлади", "паддон кадоклаган". Ish yo'q paytda boshqa ishga o'tkazish IoT/HR'da qayd etilsinmi.
**Nega kerak:** Bo'sh turmagan, lekin asosiy ishidan boshqa ish qilgan xodim mehnati hisobga olinmasa, samaradorlik soxta past chiqadi va xodim noroziligi.
**Variantlar:**
- A) "Иш йук → muqobil ish (арчиш/паддон/тозалаш)" qayd etiladi, vaqt alohida sanaladi — adolatli mehnat hisobi
- B) Bo'sh vaqt sifatida yoziladi, muqobil ish yo'q — sodda, lekin adolatsiz
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (mehnat hisobi, oylik), ShVB

### Q30. Гофра линия namlik/klей (yelim) parametri kuzatilsinmi
**Nima:** Gofrirovка sifatida yelim harorati/miqdori va karton namligi muhim. IoT bu parametrlarni sensor bilan o'qisinmi.
**Nega kerak:** Yelim yoki namlik noto'g'ri bo'lsa qatlam ko'chadi (расслоение) — butun rulon brak; sensor bilan oldindan ushlanadi.
**Variantlar:**
- A) Gofra linia yelim harorati + namlik sensor bilan, chegaradan chiqsa ogohlantirish — qatlam ko'chishi oldini olish
- B) Faqat chiqish m2, parametr yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (qatlam ko'chishi), Ombor (karton/yelim)

### Q31. Ofset bo'yoq (краска) qutisi darajasi kuzatilsinmi
**Nima:** SM/KBA mashinalarida bo'yoq tugashidan oldin sensor/operator ogohlantirishi bo'lsinmi.
**Nega kerak:** Bo'yoq o'rtada tugasa rang o'zgaradi (brak) yoki to'xtash; oldindan bilinsa to'xtovsiz ishlaydi.
**Variantlar:**
- A) Bo'yoq darajasi past bo'lsa ogohlantirish + Ombordan avtomatik talab — uzluksizlik
- B) Operator o'zi kuzatadi, tizim yo'q — arzon
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (bo'yoq talab), Sifat (rang)

### Q32. Avtohisечка картон vs гофра — material turi bo'yicha ajratilsinmi
**Nima:** Автовысечка alohida картон va гофра uchun (kitobda 2 qator). IoT bu ikki mashina/rejimni alohida sanaydimi.
**Nega kerak:** Karton va gofra normasi, braki, tezligi har xil; aralashtirsak hisobot noto'g'ri.
**Variantlar:**
- A) Картон va гофра висечка alohida o'lchanadi (o'z normasi bilan) — to'g'ri hisob
- B) Bitta "висечка" mashinasi — sodda
- C) Keyin — hozir kerak emas

### Q33. Mashina ishga tushish (ON) / o'chish (OFF) vaqti avtomatik yozilsinmi
**Nima:** Mashina elektr ON/OFF vaqtini IoT avtomatik yozib, ish kunining haqiqiy boshlanish/tugash vaqtini aniqlasinmi.
**Nega kerak:** Smena 8:00 da boshlanishi kerak, lekin mashina 8:40 da yonsa — yo'qotish bor; tabel emas, real yonish vaqti kerak.
**Variantlar:**
- A) Mashina ON/OFF avtomatik yoziladi + tabel rejasi bilan solishtiriladi — kechikish ko'rinadi
- B) Faqat operator login vaqti — sodda, lekin mashina emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR (intizom), ShVB, Energiya

### Q34. Энергия hisobi mashina ON bo'lib lekin ishlamayotgan (бекор ёниб турган) vaqtni topsinmi
**Nima:** Mashina yoqilgan, lekin ishlamayapti (idle holatda tok yeydi). IoT bu "bo'sh tok sarfi"ni alohida hisoblasinmi.
**Nega kerak:** Bo'sh yonib turgan mashina pulni yeydi, mahsulot yo'q; bu eng oson tejaladigan xarajat.
**Variantlar:**
- A) Ishlash tok ↔ bo'sh (idle) tok ajratiladi, bo'sh tok ogohlantiriladi — tejash imkoni
- B) Umumiy tok sarfi — sodda, idle ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Moliya (energiya xarajat), ShVB

### Q35. Kompressor / havo tizimi (пневматика) bosimi kuzatilsinmi
**Nima:** Ko'p mashina (tigel, ФСМ, висечка) siqilgan havoda ishlaydi. Markaziy kompressor bosimi/uzilishi IoT'da kuzatilsinmi.
**Nega kerak:** Bosim tushsa bir necha mashina birdan sekinlashadi/to'xtaydi; bitta kompressor nazorati ko'p mashinani himoya qiladi.
**Variantlar:**
- A) Kompressor bosimi + havo uzilishi sensor bilan, tushsa ogohlantirish — ko'p mashinani saqlaydi
- B) Kompressor kuzatilmaydi — arzon, lekin yashirin to'xtash sababi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat, ShVB

### Q36. Andon ekranida normaga nisbatan real bajarish (target ↔ haqiqiy)
**Nima:** Sex katta ekranida har mashina yonida "norма штук" target va hozirgi haqiqiy son yonma-yon ko'rinsinmi (ortda qolsa qizil).
**Nega kerak:** Operator o'z natijasini target bilan real vaqtda ko'rsa, o'zini tezlashtiradi; kitobdagi norma qog'ozda emas, ekranda jonli bo'ladi.
**Variantlar:**
- A) Andon: target vs haqiqiy + ortda qolish % (qizil/yashil) — o'z-o'zini boshqaruv
- B) Faqat haqiqiy son, target yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, Operator motivatsiyasi

### Q37. Окошка (deraza yelimlash) maxsus operatsiyasi alohida bosqich sifatida
**Nima:** Окошка (oynaли qutiga plyonka yopishtirish) alohida mashina/operatsiya. IoT'da bu bosqich va uning braki alohida kuzatilsinmi.
**Nega kerak:** Okoshka qo'shimcha material (oyna plyonka) va vaqt; alohida bosqich bo'lmasa narx va norma noto'g'ri.
**Variantlar:**
- A) Окошка alohida operatsiya + plyonka sarfi + brak — to'liq hisob
- B) Склейкага qo'shiladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (oyna plyonka), Narx (Costing)

### Q38. Тиснение / Конгрев (folga bosish) folga sarfi va udar soni
**Nima:** Тигель тиснение/конгрев (folga bosish/bo'rttirma) operatsiyalarida folga (folga rulon) sarfi va udar IoT'da kuzatilsinmi.
**Nega kerak:** Folga qimmat; har bosishga qancha folga ketishini bilmasak xarajat va isrof noaniq.
**Variantlar:**
- A) Folga sarfi (м/ish) + udar soni kuzatiladi, isrof ko'rsatiladi — qimmat material nazorati
- B) Folga faqat Ombor chiqimida — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (folga), Moliya

### Q39. Mashina-mashina o'rtasidagi yarim tayyor (НЗП) buyurtma kuzatilsinmi
**Nima:** Ish bir necha mashinadan o'tadi (Резка→Печать→Лак→Висечка→ФСМ→Степлер→Упаковка). IoT/MES buyurtma qaysi bosqichda turganini ko'rsatsinmi.
**Nega kerak:** Buyurtma qayerda qotib qolganini (bottleneck oldida) bilmasak, savdo mijozga muddatni ayta olmaydi.
**Variantlar:**
- A) Har buyurtma operatsiya zanjiri bo'ylab kuzatiladi (qaysi mashinada, qancha kutdi) — muddat aniq
- B) Faqat boshlandi/tugadi — sodda, oraliq ko'rinmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Savdo (muddat), Ishlab chiqarish reja

### Q40. "Папка №" (buyurtma papkasi) IoT yozuvlariga biriktirilsinmi
**Nima:** Kitobda har ish "Папка №" (masalan 18660, 19868) bilan yuritiladi. IoT mashina yozuvi shu papka raqamiga bog'lansinmi.
**Nega kerak:** Zavod papka raqami bilan ishlaydi; IoT raqami papkaga ulanmasa, qaysi buyurtmaga oid ekanini topib bo'lmaydi.
**Variantlar:**
- A) Har mashina ishi "Папка №" + buyurtma kodiga bog'lanadi — to'liq kuzatuv
- B) Faqat mashina + sana — sodda, buyurtma bog'lanmaydi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: MES, Savdo, Costing

### Q41. Sensor signal yo'qolsa "noma'lum" vaqt brak hisoblansinmi yoki ajratilsinmi
**Nima:** Sensor uzilsa o'sha vaqt holatini IoT bilmaydi. Bu "noma'lum" vaqt uptime'ga qo'shiladimi yoki alohida belgilanadimi.
**Nega kerak:** Noma'lum vaqtni "ishladi" desak soxta yaxshi, "to'xtadi" desak soxta yomon; alohida belgilash to'g'ri.
**Variantlar:**
- A) Sensor uzilgan vaqt "ma'lumot yo'q" sifatida ajratiladi (uptime'ga ham, downtime'ga ham qo'shilmaydi) — halol hisob
- B) Oxirgi ma'lum holat davom etgan deb hisoblanadi — sodda, lekin xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: OEE, Data sifati

### Q42. Mashina texnik xizmat tarixi qog'oz jurnaldan IoT'ga ko'chirilsinmi
**Nima:** Zavodda allaqachon "ремонтда" yozuvlari bor. Mashina ta'mir tarixi (sana, nima, kim, qancha turdi) IoT kartasiga yozilsinmi.
**Nega kerak:** Qaysi mashina tez-tez sinadi ko'rinsa — almashtirish/kapital ta'mir qarori chiqadi; tarqoq qog'ozda bu ko'rinmaydi.
**Variantlar:**
- A) Mashina kartasida ta'mir tarixi (sana/ish/qism/xarajat) — eskirish va MTBF ko'rinadi
- B) Faqat "ремонтда" holati, tarix yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat, Moliya (CAPEX)

### Q43. Texnik xizmat ehtiyot qismi Ombor bilan bog'lansinmi
**Nima:** Mashina ta'mirida ishlatilgan ehtiyot qism (подшипник, ремень, нож) Ombor zaxirasidan avtomatik chiqim qilinsinmi.
**Nega kerak:** Ehtiyot qism hisobsiz ishlatilsa kerakli payt yo'q bo'ladi; IoT-Ombor bog'lanishi minimal zaxira ushlab turadi.
**Variantlar:**
- A) Ta'mirda ishlatilgan qism Ombordan chiqim + min. zaxira ogohlantirish — uzluksiz ta'mir
- B) Ehtiyot qism alohida hisoblanadi (Omborsiz) — sodda, lekin uzilish xavfi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (ehtiyot qism), Texnik xizmat

### Q44. Mashina "norma bajarilmadi" sababi avtomatik tahlil qilinsinmi
**Nima:** Smena oxirida norma bajarilmasa, IoT yozilgan to'xtash/setup/idle sabablaridan "nega bajarilmadi"ni avtomatik tushuntirsinmi.
**Nega kerak:** Operator "ulgurmadim" desa yetarli emas; tizim "3 soat иш йук + 1 soat сozlash" deb ko'rsatsa, sabab obyektiv bo'ladi.
**Variantlar:**
- A) Norma bajarilmaganda avtomatik sabab tahlili (downtime breakdown) ko'rsatiladi — obyektiv baholash
- B) Faqat "bajarildi/yo'q" bayrog'i — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, HR (KPI), Norma

### Q45. Brak material qayta ishlatish (макулатура) kuzatilsinmi
**Nima:** Brak karton/qog'oz makulaturaga ketadi yoki qayta ishlanadi. IoT/Ombor brak material miqdorini va taqdirini yozsinmi.
**Nega kerak:** Brak material ham pul; qancha makulaturaga ketdi va qancha qaytdi bilinmasa, yo'qotish to'liq ko'rinmaydi.
**Variantlar:**
- A) Brak miqdori → makulatura/qayta ishlash sifatida yoziladi — to'liq material balansi
- B) Brak faqat % sifatida, taqdiri yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor, Moliya, Ekologiya hisoboti

### Q46. Mashina sertifikat/kalibrovka muddati eslatmasi
**Nima:** Tarozi, harorat sensori, bosim o'lchagich vaqti-vaqti bilan kalibrlanishi kerak. IoT kalibrovka muddatini kuzatib eslatsinmi.
**Nega kerak:** Kalibrlanmagan sensor noto'g'ri o'qiydi — barcha IoT raqami yolg'on bo'lib qoladi; muddat eslatmasi data ishonchini saqlaydi.
**Variantlar:**
- A) Har sensor/o'lchagich kalibrovka muddati + eslatma — data ishonchli qoladi
- B) Kalibrovka kuzatilmaydi — arzon, lekin data shubhali
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (data ishonchi), Texnik xizmat

### Q47. Kamera-AI bilan operator himoya vositasi (qo'lqop/ko'zoynak) tekshirilsinmi
**Nima:** Bosma/висечка mashinalarida xavfsizlik uchun qo'lqop/ko'zoynak/quloqchin shart. Kamera-AI ularni kiyganini tekshirsinmi.
**Nega kerak:** Mashina yonidagi jarohat xavfi yuqori; AI himoya vositasiz operatorni aniqlasa baxtsiz hodisa oldini oladi.
**Variantlar:**
- A) Kamera-AI himoya vositasini tekshiradi, yo'q bo'lsa ogohlantiradi/qayd etadi — xavfsizlik
- B) Faqat inspektor qo'lda tekshiradi — odam, doimiy emas
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Xavfsizlik (Техника хавфсизлиги), HR

### Q48. Kamera-AI mashina ishlayotganda yonida odam yo'qligini (xavfli zona) tekshirsinmi
**Nima:** Висечка/тигель ishlaganda xavfli zonaga qo'l kirsa to'xtatish/ogohlantirish kerak. Kamera-AI buni real vaqtda kuzatsinmi.
**Nega kerak:** Tigel/висечка barmoq kesishi mumkin; AI xavfli zonani kuzatsa eng og'ir baxtsiz hodisa oldi olinadi.
**Variantlar:**
- A) Kamera-AI xavfli zonani kuzatadi, odam kirsa darhol ogohlantiradi — jiddiy xavfsizlik
- B) Faqat fizik to'siq/tugma — ishonchli, lekin AI nazorati yo'q
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Xavfsizlik, Texnik xizmat (mashina to'xtatish)

### Q49. Tungi smena (С) uchun avtomatik nazorat kuchaytirilsinmi
**Nima:** Tunda nazoratchi kam; IoT/kamera tungi smenada (С) anomaliya va bo'sh turishni qattiqroq kuzatib avtomatik xabar bersinmi.
**Nega kerak:** Tunda mashina bo'sh tursa yoki sinса hech kim ko'rmaydi; avtomatik xabar tungi yo'qotishni kamaytiradi.
**Variantlar:**
- A) Tungi smenada anomaliya/idle chegarasi pasaytiriladi + masofadan xabar (Telegram) — tunги nazorat
- B) Kunduzgidek bir xil nazorat — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB, Telegram bot, HR (tungi smena)

### Q50. Mashina ish boshlanishidan oldin "tayyorlik tekshiruvi" (checklist) IoT'da bo'lsinmi
**Nima:** Operator mashinani yoqishdan oldin (yog'lash, tozalik, qolip, material) checklist tabletda to'ldirsinmi.
**Nega kerak:** Tayyorgarliksiz boshlangani uchun to'xtash (Q7, Q9 muammosi) ko'p; majburiy checklist xatoni boshida ushlaydi.
**Variantlar:**
- A) Mashina boshlashdan oldin majburiy checklist (yog'/tozalik/qolip/material), to'ldirilmasa ish ochilmaydi — to'xtash kamayadi
- B) Checklist ixtiyoriy/qog'ozda — sodda, lekin o'tkazib yuboriladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Texnik xizmat (TPM), Sifat, ShVB

### Q51. Mashina samaradorligi GSD/ЦКП statistikasi sifatida ShVB'ga uzatilsinmi
**Nima:** Har mashina/sexning IoT samaradorligi (uptime, norma %, brak) ShVB statistik bo'lim ko'rsatkichi (GSD) sifatida avtomatik uzatilsinmi.
**Nega kerak:** Vizyon — har bo'lim o'z ЦКП/statistikasi bilan o'lchanadi; IoT raqamlari qo'lda emas, avtomatik GSD'ga tushsa ShVB jonli ishlaydi.
**Variantlar:**
- A) IoT ko'rsatkichlari avtomatik ShVB GSD'ga (ishlab chiqarish bo'limi statistikasi) uzatiladi — vizyonga to'liq mos
- B) Qo'lda ShVB'ga kiritiladi — sodda, lekin kechikadi/xato
- C) Keyin — hozir kerak emas
⤳ Ta'sir: ShVB (Vysotskiy 7), karta-model, Statistik bo'lim

### Q52. Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash darajasi
**Nima:** IoT chiqargan norma %/brak operatorning oyligi yoki bonusiga qanchalik ta'sir qilsinmi.
**Nega kerak:** Bog'lansa motivatsiya kuchli, lekin sensor xatosi yoki "иш йук" (operator aybi emas) oylikka noto'g'ri ta'sir qilmasligi kerak.
**Variantlar:**
- A) Bonusga ta'sir qiladi, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi) — adolatli
- B) To'g'ridan-to'g'ri butun norma % oylikka — kuchli, lekin adolatsiz
- C) Bog'lanmaydi, faqat ko'rsatkich — xavfsiz, lekin motivatsiya zaif
- D) Keyin — hozir kerak emas
⤳ Ta'sir: HR (oylik/bonus), ShVB, karta-model

### Q53. Ofset plastina (колиб/пластина) tayyorlik holati IoT navbati bilan bog'lansinmi
**Nima:** Ofset ishi uchun plastina (CTP) tayyor bo'lishi kerak. IoT mashina navbatida "plastina tayyor/yo'q" holati ko'rinsinmi.
**Nega kerak:** Plastina tayyor bo'lmasa mashina kutadi (Q7 turkumi); navbatda holat ko'rinsa preprint bo'lim oldindan tayyorlaydi.
**Variantlar:**
- A) Mashina navbatidagi har ish yonida "plastina/qolip tayyor" indikatori (preprint'dan) — uzluksizlik
- B) Mashina navbati bor, plastina holati yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Dizayn/Preprint, MES, Ishlab chiqarish reja

DONE: IoT — 53.
