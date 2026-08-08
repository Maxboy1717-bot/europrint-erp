# Bildirishnoma / Telegram — YANGI (kitob-grounded) savollar

Bu savollar EuroPrint ning haqiqiy 2020-2026 zavod hujjatlariga (RD-5 lavozim yo'riqnomalari + Oргполитика hujjatlari) asoslangan. Asosiy manbalar: "КОММУНИКАЦИЯ ТУРЛАРИНИ АНИҚ БЕЛГИЛАШ" oргполитика (yozma/og'zaki/vertikal/gorizontal/analitik kommunikatsiya), "Ишлаб чиқаришга берилган тех карталарда муаммо аниқланганда чора кўриш тартиби" (15 daqiqa va 1 soat qoidalari, tungi smena telefon eskalatsiyasi), "МАСЪУЛИЯТ ВА ЖАВОБГАРЛИКНИ АНИҚ ШАХСЛАРГА БОҒЛАШ", Bitrix24/CRM kartochka zanjiri va НО-3 kun yakuni hisoboti. Har savol — bitta aniq qaror. Birinchi variant (A) — tavsiya. Bular mavjud 30 savolni TAKRORLAMAYDI.

---

### Q1. "Yozma" xabar majburiy bo'lgan qarorlar avtomatik qayd etilsinmi
**Nima:** Oргполитика "Қарорлар, режа ўзгаришлари, вазифалар, техкарта ўзгаришлари, сифат хулосалари, расмий огоҳлантиришлар фақат ёзма" deydi — shu turdagi xabar Telegramdan yuborilganda tizim uni avtomatik ERP'ga rasmiy yozma yozuv qilib saqlasinmi.
**Nega kerak:** Hujjat "Ёзма қайдсиз қарор қабул қилинган деб ҳисобланмайди" deydi — Telegram og'zaki kanal sifatida qolsa, qaror rasmiy bo'lmaydi.
**Variantlar:**
- A) Bu 6 turdagi xabar Telegramdan kelsa, avtomatik rasmiy yozuvga aylanadi (raqam + sana + muallif) — oргполитikaga to'liq mos
- B) Telegram faqat ogohlantiradi, rasmiylashtirish ERP'da qo'lda qilinadi — ikki bosqich
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish, Sifat, Dizayn — barcha "yozma majburiy" qarorlar bu kanaldan o'tadi.

### Q2. Og'zaki topshiriq 24 soat ichida yozma qayd etilishini bot kuzatsinmi
**Nima:** Oргполитika "Оғзаки берилган муҳим топшириқ ёки келишув кейинчалик ёзма шаклда қайд этилиши шарт" deydi — og'zaki berilgan topshiriq belgilangan muddatda yozma qayd etilmasa, bot eslatsinmi.
**Nega kerak:** Og'zaki topshiriqlar tez-tez yozma qayd etilmay yo'qoladi — bu hujjat aniq taqiqlaydi.
**Variantlar:**
- A) Og'zaki topshiriq kiritilsa, 24 soat ichida yozma qayd talab qilinadi; bo'lmasa eslatma → keyin rahbarga signal — nazorat
- B) Faqat bir marta eslatma, eskalatsiya yo'q — yumshoq
- C) Keyin — hozir kerak emas

### Q3. Tex-kartada xato — 15 daqiqalik signal cron
**Nima:** "Ишлаб чиқаришда тех картада хато аниқланса, смена технологи 15 дақиқа ичида бош технологга хабар беради" — smena texnologi tex-karta xatosini belgilaganda, bot bosh texnologga 15 daqiqalik taymer bilan signal yuborsinmi.
**Nega kerak:** Bu hujjatdagi eng aniq vaqt qoidasi — 15 daqiqa o'tib javob bo'lmasa, jarayon to'xtab qoladi.
**Variantlar:**
- A) Xato belgilanishi bilan bosh texnologга darrov signal + 15 daqiqa taymer; javob bo'lmasa RD-4'ga eskalatsiya — qoidaga to'liq
- B) Faqat signal yuboriladi, taymer yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish + Sifat zanjiri (tex-karta → bosh texnolog → RD-5 → dizayn/konstruktor).
  ↳ Agar A: 15 daqiqada javob bo'lmasa kimga chiqsin? — A) bosh texnolog telefoniga qo'ng'iroq-eslatma B) RD-4'ga avtomatik C) ikkalasiga.

### Q4. Tex-karta tuzatish — 1 soatlik muddat hisoblagichi
**Nima:** "РД-5 хатони тегишли бўлим (дизайн, конструктор, корректор ёки режалаштириш)га юбориб, 1 соат ичида тўғирлашни талаб қилади" — tuzatish topshirig'i yuborilsa, bot 1 soatlik orqaga sanagich (countdown) ko'rsatib eslatsinmi.
**Nega kerak:** 1 soat — hujjatdagi qattiq muddat; o'tsa ishlab chiqarish to'xtaydi yoki davom etish qarori kerak bo'ladi.
**Variantlar:**
- A) Topshiriq yuborilganda 1 soatlik countdown; 45-daqiqada eslatma, 60-daqiqada RD-5'ga "muddat o'tdi" signal — nazorat
- B) Faqat 1 soat oxirida bir marta xabar — sodda
- C) Keyin — hozir kerak emas

### Q5. Tungi smena telefon-eskalatsiyasi (RD-4 va bosh texnolog javob berishi shart)
**Nima:** "Агар смена технологи муаммони хал қила олмаса бош технолог ёки РД-4 га телефон қилади. РД-4 ва бош технолог тунги вақтларда телефон қилинган тақдирда жавоб беришлари лозим" — tungi smenada muammo bo'lsa, bot telefon-qo'ng'iroq talabini qayd qilib, javob berilganini kuzatsinmi.
**Nega kerak:** Tunda rahbarlar yo'q — bu hujjatdagi maxsus tungi protokol; qo'ng'iroqqa javob berilmasa qayd qolishi kerak.
**Variantlar:**
- A) Tungi muammo signal qilinsa, "telefon qilindi → javob berdi/bermadi" qayd etiladi; javob bo'lmasa ertalab rahbarga ko'rinadi — masъuliyat qaydi
- B) Faqat Telegram signal, telefon qaydi yo'q — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/masъuliyat — javob bermagan rahbar oylik/KPI'ga ta'sir qilishi mumkin.

### Q6. Tungi smena texnologi "davom ettirish" qarori uchun maxsus belgi
**Nima:** "Кечки сменада рахбар ходимлар йўқ бўлса, смена технологи ўз тажрибасидан келиб чиққан холатда давом эттиришга рухсат беради. Бу холатда сифатга тўлиқ жавобгар хисобланади" — bunday yakka qaror qabul qilinganda, bot uni alohida masъuliyat belgisi bilan qayd qilib ertalab rahbarga ko'rsatsinmi.
**Nega kerak:** Tungi yakka qaror = to'liq shaxsiy masъuliyat; ertalab rahbar bilishi shart.
**Variantlar:**
- A) "Tungi yakka qaror" belgisi bilan qayd → ertalab bosh texnolog + RD-5'ga digestda ko'rinadi — masъuliyat shaffof
- B) Oddiy qayd, alohida belgisiz — sodda
- C) Keyin — hozir kerak emas

### Q7. Bevosita rahbarni chetlab o'tish (фавкулодда) signali
**Nima:** Oргполитika "Бевосита раҳбарни четлаб ўтиб мурожаат қилиш фавқулодда ҳолатлардан ташқари тақиқланади" deydi — agar xodim bot orqali rahbarini sakrab yuqoriga murojaat qilsa, bu "фавкулодда" deb belgilanib, asl rahbarga ham xabar borsinmi.
**Nega kerak:** Chetlab o'tish faqat favqulodda holatda ruxsat — lekin asl rahbar bexabar qolmasligi kerak.
**Variantlar:**
- A) Chetlab o'tilsa, favqulodda sabab so'raladi + bevosita rahbarga "sizni chetlab o'tishdi" nusxasi boradi — shaffof
- B) Chetlab o'tish umuman taqiqlanadi (faqat zanjir bo'yicha) — qattiq
- C) Keyin — hozir kerak emas

### Q8. Yuboruvchi vs qabul qiluvchi masъuliyatini bot ajratsinmi
**Nima:** Oргполитika "Маълумотни юборган шахс тўғрилиги учун, қабул қилган шахс ўз вақтида кўриб чиқиш учун жавобгар" deydi — bot har xabar uchun "kim yubordi (mazmun masъuli)" va "kim qabul qildi + qachon ko'rdi (javob masъuli)" ni alohida saqlasinmi.
**Nega kerak:** Hujjat masъuliyatni ikkiga bo'ladi — keyin "men yubormagandim / men ko'rmagandim" bahsini hal qiladi.
**Variantlar:**
- A) Har xabarda yuboruvchi + qabul qiluvchi + ko'rilgan vaqt qayd etiladi (ikki tomonli masъuliyat) — bahssiz
- B) Faqat yuboruvchi qayd etiladi — yarим
- C) Keyin — hozir kerak emas

### Q9. Mijoz bilan bog'liq muammo — savdo menejeriga avtomatik yo'naltirish
**Nima:** "Агар муаммо мижоз билан боғлиқ бўлса, савдо менежерига хабар берилади, у мижоз билан боғланиб талабини тушунтиради" — tex-karta/brak muammosi "mijoz bilan bog'liq" deb belgilansa, bot avtomatik o'sha buyurtmaning savdo menejeriga yuborsinmi.
**Nega kerak:** Hujjat aniq aytadi: texnik echimni texnolog, mijoz masalasini savdo menejeri hal qiladi — adresat aralashmasligi kerak.
**Variantlar:**
- A) "Mijoz masalasi" belgisi → buyurtmaning savdo menejeriga avtomatik; texnik echim emas, faqat mijoz talabini aniqlash — rolga mos
- B) Hammasi bosh texnologda qoladi, savdoga qo'lda yuboriladi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Savdo (CRM) ↔ Ishlab chiqarish ↔ Sifat zanjiri.

### Q10. RD-2/RD-4/RD-5 uchlik kelishuv yig'ilishi chaqirig'i (1 soat ichida)
**Nima:** "Муаммони ўзаро келишув асосида хал қилишга тўғри келса РД4, РД2 ва РД5 учрашиб кўриб чиқишади... 1 соат ичида хал қилиш талаб қилинади" — bot bu uchlik yig'ilishni chaqirib, 1 soatlik muddat bilan kuzatsinmi.
**Nega kerak:** Departamentlararo muammo 1 soatda hal bo'lishi kerak — kim chaqirildi, keldi-kelmadi, qaror nima bo'ldi qayd etilsin.
**Variantlar:**
- A) Uchlik chaqiriq → 3 rahbarga signal + 1 soat taymer + qaror qaydi (davom ettirish / vaqtincha to'xtatish) — protokolga mos
- B) Faqat 3 rahbarga oddiy xabar — sodda
- C) Keyin — hozir kerak emas

### Q11. "Vaqtincha to'xtatish" qarori butun zanjirga e'lon qilinsinmi
**Nima:** Uchlik kelishuvda "ишни вақтинча тўхтатиш" qarori qabul qilinsa, bu qaror buyurtma zanjiridagi barcha bo'limga (dizayn, konstruktor, ombor, savdo) avtomatik e'lon qilinsinmi.
**Nega kerak:** To'xtash qarori faqat 3 rahbarda qolsa, quyi bo'limlar bexabar ishlashda davom etadi.
**Variantlar:**
- A) To'xtash qarori → buyurtma kartasidagi barcha masъullarga "to'xtatildi: sabab" signali — yagona haqiqat
- B) Faqat ishlab chiqarish to'xtaydi, qolganlar keyin biladi — qisman
- C) Keyin — hozir kerak emas

### Q12. Yangi oргполитika e'loni (НО-3 → adaptatsiya menejeri)
**Nima:** "Янги оргполитика хақида НО-3 адаптация менежерига маълумот беради... ўқитиш оргполитика ёзилгандан сўнг 1 кундан кечиктирмай бошланиши керак" — yangi oргполитika tizimga kiritilganda, bot НО-3 va adaptatsiya menejeriga 1 kunlik o'qitish muddati bilan signal bersinmi.
**Nega kerak:** Hujjat aniq 1 kunlik muddat qo'yadi; bu odamlar bot orqali eslatilmasa, o'qitish kechikadi.
**Variantlar:**
- A) Yangi oргполитika → НО-3 + adaptatsiya menejeriga signal + 1 kunlik o'qitish boshlash muddati — qoidaga mos
- B) Faqat НО-3'ga xabar — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/adaptatsiya + Ta'lim (darslik) moduli.

### Q13. Takroriy xato → oргполитika yozish topshirig'i
**Nima:** "Тех картада аниқланган хато қайси бўлимга тегишли бўлса, ушбу бўлим бошлиғи такрорланмаслиги учун Оргполитика ёзади" — bir xil xato qayta takrorlansa, bot tegishli bo'lim boshlig'iga "oргполитika yozing" topshirig'ini yuborsinmi.
**Nega kerak:** Hujjat takroriy xatoga tizimli javob talab qiladi; bot takrorlanishni sanab, eslatishi kerak.
**Variantlar:**
- A) Bir xil xato 2-marta takrorlansa, bo'lim boshlig'iga "oргполитika yoz" topshirig'i + НО-3'ga nusxa — tizimli
- B) Faqat statistikada ko'rsatiladi, topshiriq yo'q — passiv
- C) Keyin — hozir kerak emas

### Q14. Kun yakuni НО-3 hisoboti avtomatik eslatmasi
**Nima:** Oргполитika "Аниқланган камчиликлар бўйича НО-3 га кун якунида ҳисобот тақдим этиш" deydi — bot har kun yakunida masъul shaxsga "НО-3 kun-yakuni hisoboti" eslatmasini yuborsinmi.
**Nega kerak:** Kunlik kamchilik hisoboti unutilsa, НО-3 nazorati uzilib qoladi.
**Variantlar:**
- A) Har kun smena oxirida masъulga eslatma; topshirilmasa НО-3'ga "hisobot kelmadi" signali — nazorat
- B) Faqat eslatma, kuzatuv yo'q — sodda
- C) Keyin — hozir kerak emas

### Q15. Kunlik/haftalik/oylik hisobot uchligi (RD-5 boshlig'i)
**Nima:** Hujjatda "Бўлим фаолияти бўйича кунлик, ҳафталик ва ойлик ҳисоботларни ўз вақтида раҳбариятга тақдим этади" — bot bu uch ritmni (kunlik/haftalik/oylik) alohida eslatma sifatida yuritsinmi.
**Nega kerak:** Uch xil ritmda hisobot bor; biri ikkinchisini almashtirmaydi — har biri o'z vaqtida.
**Variantlar:**
- A) Uch alohida eslatma (kunlik smena oxiri / haftalik / oy yakuni), har biri o'z adresati bilan — to'liq
- B) Faqat haftalik va oylik — qisqartirilgan
- C) Keyin — hozir kerak emas

### Q16. Smenalik hisobot (smena texnologi → bosh rejalashtiruvchi)
**Nima:** "Смена якунида режанинг бажарилиши, кечикишлар ва сабаблари бўйича сменалик ҳисобот тайёрлаш ва бош режалаштирувчига тақдим этиш" — har smena oxirida bot smena texnologiga hisobot eslatmasini yuborib, bosh rejalashtiruvchiga yo'naltirsinmi.
**Nega kerak:** Smenalik hisobot kechikishlar sababini saqlaydi — bu rejalashtirish sifatini yaxshilash uchun asos.
**Variantlar:**
- A) Har smena oxirida texnologga eslatma + tayyor bo'lsa bosh rejalashtiruvchiga avtomatik yo'naltirish — zanjirga mos
- B) Faqat eslatma, yo'naltirish qo'lda — sodda
- C) Keyin — hozir kerak emas

### Q17. Xom-ashyo yetishmasligi → bosh rejalashtiruvchiga darhol signal
**Nima:** "Агар заявкада кўрсатилган хом-ашё омборда етарли бўлмаса, ички таъминот ходими дарҳол бош режалаштириш ходимини хабардор қилади" — ombor zaxirasi заявкани qoplamasa, bot bosh rejalashtiruvchiga darhol signal yuborsinmi.
**Nega kerak:** Xom-ashyo yo'q bo'lsa reja qayta ko'riladi yoki qo'shimcha заявка beriladi — kechiksa ishlab chiqarish to'xtaydi.
**Variantlar:**
- A) Zaxira yetmasa darhol bosh rejalashtiruvchiga + ta'minot bo'limiga signal — zanjirga mos
- B) Faqat bosh rejalashtiruvchiga — bir adresat
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor ↔ Rejalashtirish ↔ Ta'minot.

### Q18. Roxler (jihoz) nosozligi — darhol xabar belgisi
**Nima:** "Рохлернинг ишга яроқли ҳолатини сақлаш ва носозлик аниқланса дарҳол хабар бериш" — jihoz nosozligi belgilanganda, bot uni "darhol xabar" ustuvor turiga qo'yib bo'lim boshlig'iga yuborsinmi.
**Nega kerak:** Jihoz nosozligi to'xtash xavfi — kechiktirilmasligi kerak.
**Variantlar:**
- A) Jihoz nosozligi → bo'lim boshlig'iga eng yuqori ustuvor signal (boshqa xabarlar ustida) — to'g'ri ustuvorlik
- B) Oddiy signal qatorida — sodda
- C) Keyin — hozir kerak emas

### Q19. Kechikish/uzilish xavfi — "darhol xabardor qilish" tugmasi
**Nima:** "Ишлаб чиқариш жараёнида кечикиш ёки узилиш хавфи пайдо бўлса бўлим бошлиғини дарҳол хабардор қилиш" — operatorda "kechikish xavfi bor" deb bir tugma bo'lib, bosib darhol bo'lim boshlig'iga xabar yuborsinmi.
**Nega kerak:** Hujjat "muammoni o'z vaqtida xabar bermaslik"ni jazolanadigan kamchilik deb belgilaydi — xabar berish oson bo'lishi kerak.
**Variantlar:**
- A) Bitta "kechikish xavfi" tugmasi → bo'lim boshlig'iga darhol + qayd (kim, qachon, qaysi buyurtma) — oddiy va tez
- B) Matn yozib yuborish (tugma yo'q) — erkinroq lekin sekin
- C) Keyin — hozir kerak emas

### Q20. "O'z vaqtida xabar bermaslik" kamchiligini bot qayd qilsinmi
**Nima:** Yo'riqnomada "Бўлим бошлиғига муаммолар ҳақида ўз вақтида хабар бермаслик" aniq kamchilik sifatida sanalgan — muammo kech xabar berilganini (vaqt farqi) bot avtomatik qayd qilib, oy yakunida ko'rsatsinmi.
**Nega kerak:** Bu hujjatda nomi aniq aytilgan jazolanadigan xatti-harakat — o'lchanmasa nazorat qilib bo'lmaydi.
**Variantlar:**
- A) Muammo yuzaga kelgan vaqt vs xabar berilgan vaqt farqi qayd etiladi; kechikkan xabarlar oylik KPI'da — o'lchanadi
- B) Faqat xabar berilgan vaqt saqlanadi, farq hisoblanmaydi — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/KPI.

### Q21. Bitrix24 kartochka status o'zgarishi → avtomatik bildirishnoma
**Nima:** Lug'atda "Статус — карточканинг жорий ҳолатини кўрсатувчи босқич (Техник топшириқ келди / Дизайн тайёрланяпти / Тасдиқда / Ишлаб чиқаришга топширилди)" — kartochka statusi o'zgarganda, navbatdagi masъulga avtomatik xabar borsinmi.
**Nega kerak:** Kartochka zanjiri statuslar bo'yicha o'tadi; har bosqich keyingi odamga signal bermasa, zanjir uziladi.
**Variantlar:**
- A) Har status o'zgarishida keyingi bosqich masъuliga avtomatik signal (status nomi bilan) — zanjir uzilmaydi
- B) Faqat asosiy statuslarda (Тасдиқда, Ишлаб чиқаришга топширилди) — kamroq shovqin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: CRM/Dizayn ↔ Ishlab chiqarish (oltin-ip zanjiri).

### Q22. Kartochka "Тасдиқда" statusida tasdiq kutilayotgan signal
**Nima:** Kartochka "Тасдиқда" (mijoz/rahbar tasdig'ini kutmoqda) statusiga o'tganda, tasdiqlovchi shaxsga "sizning tasdig'ingiz kutilmoqda" eslatmasi borsinmi, javob bo'lmasa qayta eslatsinmi.
**Nega kerak:** Tasdiq bosqichida ishlar tez-tez qotib qoladi (kim tasdiqlashini kutadi) — eslatma kerak.
**Variantlar:**
- A) Tasdiqlovchiga darhol + belgilangan vaqtdan keyin qayta eslatma → keyin yuqoriga — nazorat
- B) Faqat bir marta eslatma — yumshoq
- C) Keyin — hozir kerak emas

### Q23. Texnik topshiriq (ТТ) to'liqsiz kelganda dizaynerga signal
**Nima:** Lug'atda ТТ tarkibi aniq sanalgan (mahsulot turi, o'lchamlar, material, bosma usuli, ranglar, matn, logotip, miqdor, maxsus talablar) — bu maydonlardan biri bo'sh bo'lsa, bot "ТТ to'liqsiz" deb savdo/dizaynerga signal bersinmi.
**Nega kerak:** To'liqsiz ТТ keyin qayta ishlash va kechikishga olib keladi (kitobdagi korrektor misoli).
**Variantlar:**
- A) ТТ kiritilganda majburiy maydonlar tekshiriladi; bo'sh bo'lsa savdoga "to'ldiring" signali, dizaynerga ish berilmaydi — oldini olish
- B) Faqat ogohlantiradi, ish baribir o'tadi — yumshoq
- C) Keyin — hozir kerak emas

### Q24. Korrektor xato topganda dizaynerga darhol xabar (kitob misoli)
**Nima:** Kitobdagi vaziyat: "Корректор хатоларни аниқлади, аммо дизайнерни ўз вақтида хабардор қилмади. Макет тузатилмасдан кейинги босқичга ўтиб кетди" — korrektor xato belgilaganda, bot dizaynerga darhol xabar berib, tuzatilmaguncha keyingi bosqichga o'tkazmasinmi.
**Nega kerak:** Bu aniq kitobdagi muammo — xabar kechiksa maket tuzatilmay ishlab chiqarishga ketadi.
**Variantlar:**
- A) Korrektor xatosi → dizaynerga darhol + kartochka keyingi bosqichga o'tishi bloklanadi (tuzatilmaguncha) — qattiq
- B) Faqat xabar, blok yo'q — yumshoq
- C) Keyin — hozir kerak emas

### Q25. Dizayner rahbarni chetlab fayl yuborgani (kitob misoli) signali
**Nima:** Kitobdagi vaziyat: "Дизайнер бўлим раҳбарини хабардор қилмасдан қарор қабул қилди ва нотўғри тайёрланган файлни ишлаб чиқаришга юбориб қўйди" — fayl rahbar tasdig'isiz ishlab chiqarishga yuborilsa, bot rahbarga "tasdiqsiz yuborildi" signali bersinmi.
**Nega kerak:** Hujjat bo'yicha to'g'ri tartib — vazifa rahbardan, fayl rahbar orqali; chetlab o'tish qayta ishlashga olib keladi.
**Variantlar:**
- A) Fayl tasdiq belgisisiz yuborilsa → bo'lim rahbariga signal + qayd — nazorat
- B) Fayl yuborish umuman rahbar tasdig'isiz bloklanadi — qattiq
- C) Keyin — hozir kerak emas

### Q26. Og'zaki reja "rasmiy berilgan" deb hisoblanmasligi haqida ogohlantirish
**Nima:** "Оғзаки хабар бериш режани расмий берилган деб ҳисоблаш учун асос бўлмайди" — kimdir rejani faqat og'zaki bergan bo'lsa va yozma qayd yo'q bo'lsa, bot "bu reja hali rasmiy emas" deb ogohlantirsinmi.
**Nega kerak:** Hujjat aniq aytadi: og'zaki reja asos emas — yozma qayd bo'lmaguncha reja yo'q hisoblanadi.
**Variantlar:**
- A) Yozma qayd yo'q rejaga "rasmiy emas" belgisi + tegishliga ogohlantirish — hujjatga mos
- B) Faqat statistikada ko'rsatiladi — passiv
- C) Keyin — hozir kerak emas

### Q27. Reja o'zgarishi → barcha bog'liq bo'limga e'lon (gorizontal)
**Nima:** Oргполитika "Оргсхемадаги жойлашувига мувофиқ тегишли бўлимлар билан келишиб режалаштириш" deydi (mustaqil tuzib boshqalarni xabardor qilmaslik xato) — reja o'zgarganda, bot u bilan bog'liq barcha bo'limga avtomatik e'lon qilsinmi.
**Nega kerak:** Reja bir bo'limda o'zgarib boshqalar bilmasa, ishlab chiqarish noaniqlikka tushadi.
**Variantlar:**
- A) Reja o'zgarishi → bog'liq bo'limlarga avtomatik e'lon + ko'rgani qayd — gorizontal kommunikatsiyaga mos
- B) Faqat ishlab chiqarishga — bir adresat
- C) Keyin — hozir kerak emas

### Q28. Aналитик kommunikatsiya: Совершенствование bo'limi xulosalari kanali
**Nima:** Oргполитika "Таҳлил, хулоса, сифат маълумотлари Совершенствование бўлими орқали тузилиб тегишли бўлимларга ва департамент раҳбарига тақдим этилади" — tahliliy xulosalar alohida "analitik" kanaldan tarqalsinmi.
**Nega kerak:** Tahlil/xulosa oddiy operatsion xabardan farq qiladi — adresat va format boshqacha (faqat Совершенствование chiqaradi).
**Variantlar:**
- A) Analitik xabarlar alohida belgi/kanal bilan, faqat Совершенствование bo'limidan chiqadi — hujjatga mos
- B) Oddiy xabar qatorida, alohida belgisiz — sodda
- C) Keyin — hozir kerak emas

### Q29. Maxsulot brak holatida "shu joyda hal qilish" tartibi (kanal cheklash)
**Nima:** Oргполитika ideal manzarasi: "Ҳар бир брак ҳолати аниқланганда муаммо шу жойнинг ўзида ечилади. Савдо менежери муаммони эшитади, лекин техник ечим топмайди" — brak signali yuborilganda, bot uni faqat tegishli rolга (texnik echim texnologdan, mijoz masalasi savdodan) yo'naltirsinmi.
**Nega kerak:** Hujjat aniq: har bo'lim faqat o'z vakolatidagi javobni beradi — aralashish chalkashlik keltiradi.
**Variantlar:**
- A) Brak signali → tabiati bo'yicha to'g'ri rolга (texnik → texnolog, mijoz → savdo); har rol faqat o'z vakolati doirasida javob beradi — hujjatga mos
- B) Hammasiga bir xil yuboriladi, ular o'zi hal qiladi — sodda
- C) Keyin — hozir kerak emas

### Q30. Shikastlangan xom-ashyo aniqlanganda xabar tartibi
**Nima:** Kitobda savol bor: "Шикастланган хом-ашё аниқланганда қандай тартибда хабар берилиши керак" — ombor/qabul ходими shikastlangan xom-ashyoni belgilaganda, bot belgilangan tartib bo'yicha (kim → kimga) signal yuborsinmi.
**Nega kerak:** Shikastlangan material ishlab chiqarishga o'tib ketmasligi uchun darhol to'g'ri odamga xabar kerak.
**Variantlar:**
- A) Shikast belgilanganda → ta'minot/rahbarga darhol + material "karantin" belgisi (ishlatilmaydi) — to'liq
- B) Faqat xabar, karantin belgisi yo'q — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor ↔ Sifat (karantin) ↔ Ta'minot.

### Q31. Eslatma turlari ro'yxati (digest / signal / muddat / tasdiq / qaror)
**Nima:** Bot yuboradigan xabarlar bir necha turga bo'linadi: davriy digest, tezkor signal, muddat eslatmasi, tasdiq so'rovi, rasmiy qaror qaydi — har turning o'z ko'rinishi (rang/belgi) bo'lsinmi.
**Nega kerak:** Xodim qaysi xabar shoshilinch, qaysi biri oddiy ekanini bir qarashda ajratishi kerak.
**Variantlar:**
- A) Har tur o'z belgisi bilan (🔴 signal / ⏰ muddat / ✅ tasdiq / 📋 qaror / 📊 digest) — aniq farq
- B) Hammasi bir xil ko'rinishda, matn ichida farq — sodda
- C) Keyin — hozir kerak emas

### Q32. Alert ustuvorlik darajalari (jihoz nosozligi > kechikish > oddiy)
**Nima:** Kitobda "дарҳол" (jihoz nosozligi, kechikish xavfi) va oddiy hisobotlar bor — bot signallarni ustuvorlikka ko'ra tartiblab, eng muhimini tepada ko'rsatsinmi.
**Nega kerak:** "Darhol" turdagi xabarlar oddiy hisobot orasida ko'milib qolmasligi kerak.
**Variantlar:**
- A) 3 daraja: KRITIK (jihoz/to'xtash) → MUHIM (kechikish/muddat) → ODDIY (hisobot/digest) — tartibli
- B) 2 daraja: shoshilinch / oddiy — sodda
- C) Keyin — hozir kerak emas

### Q33. "Darhol" xabarlar tinchlik vaqti (тун) cheklovidan ozodmi
**Nima:** Hujjat tungi smenani aniq tan oladi (RD-4 tunda javob berishi shart) — "darhol" turdagi signal tungi tinchlik vaqtida ham yuborilsinmi.
**Nega kerak:** Jihoz nosozligi yoki to'xtash tunda ham kelishi kerak, oddiy digest esa kutib tursin.
**Variantlar:**
- A) Faqat KRITIK darajadagi signal tunda o'tadi, qolganlari ertalabga kechiktiriladi — muvozanat
- B) Tunda hech narsa, hammasi ertalab — tinch lekin xavfli
- C) Keyin — hozir kerak emas

### Q34. Muddat eslatmasining ikki bosqichi (oldindan + o'tганда)
**Nima:** Kitobdagi muddatlar (15 daqiqa, 1 soat, 1 kun, kun yakuni) — bot muddatdan oldin (ogohlantirish) va muddat o'tganda (signal) deb ikki marta xabar bersinmi.
**Nega kerak:** Faqat o'tганda xabar bersa, oldini olib bo'lmaydi; faqat oldin bersa, o'tib ketgani bilinmaydi.
**Variantlar:**
- A) Muddatga yaqin oldindan eslatma + o'tib ketsa rahbarga signal — ikki bosqich
- B) Faqat muddat o'tганда signal — sodda
- C) Keyin — hozir kerak emas

### Q35. Departament-darajasida umumlashtirilgan hisobot (vertikal)
**Nima:** Oргполитика "Раҳбарлар маълумотни 5-департамент даражасида умумлаштириб тақдим қилади" — quyi bo'limlardan kelgan xabarlar yuqoriga chiqishda bo'lim/departament bo'yicha umumlashsinmi (har bir kichik xabar emas, xulosa).
**Nega kerak:** Departament rahbariga 100 ta alohida xabar emas, umumlashgan xulosa kerak.
**Variantlar:**
- A) Yuqoriga chiqqanda darajaga ko'ra umumlashadi (operator detali → bo'lim xulosasi → departament xulosasi) — Vysotskiy modeli
- B) Hamma xabar barcha darajaga to'liq chiqadi — to'liq lekin shovqinli
- C) Keyin — hozir kerak emas

### Q36. Masъuliyat lavozimga bog'langan (xodimga emas) yo'naltirish
**Nima:** Oргполитика "Масъулият бўлимга эмас, лавозимга боғланади" — xabar muayyan odamga emas, lavozimga (kartaga) yuborilib, o'sha lavozimni egallagan kishiga borsinmi.
**Nega kerak:** Xodim almashsa ham, xabar to'g'ri lavozimga borishi kerak — karta-markazli modelga to'liq mos.
**Variantlar:**
- A) Xabar lavozimga (kartaga) yuboriladi → joriy egasiga yetkaziladi; xodim almashsa avtomatik yangi egaga — karta-modelga mos
- B) Xabar aniq xodimga yuboriladi — eski usul
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (karta-model) ↔ HR.

### Q37. Masъuliyatni og'zaki o'tkazish taqiqiga rioya
**Nima:** Oргполитика "Масъулиятни бошқа шахсга оғзаки ўтказишга йўл қўйилмайди" — kimdir o'z masъuliyatini boshqa odamга o'tkazmoqchi bo'lsa, bot buni rasmiy yozma topshiriq bilan talab qilsinmi.
**Nega kerak:** Og'zaki "sen qil" deb masъuliyat o'tkazilsa, keyin "men aytmagandim" bahsi chiqadi.
**Variantlar:**
- A) Masъuliyat o'tkazish faqat rasmiy yozma topshiriq orqali; og'zaki o'tkazma qayd etilmaydi — hujjatga mos
- B) Og'zaki o'tkazma ham qayd etilsin (lekin belgisi bilan) — yumshoq
- C) Keyin — hozir kerak emas

### Q38. Oylik masъuliyat tahlili digesti (Совершенствование)
**Nима:** Oргполитика "Ҳар ой якунида Совершенствование томонидан жорий этилган қарорлар ва муаммолар бўйича жавобгарлик ҳолати таҳлил қилинади" — oy yakunida bot masъuliyat tahlilini (kim qaror qabul qilgan, natijasi nima) digest qilib bersinmi.
**Nega kerak:** Oylik masъuliyat tahlili takroriy kamchiliklarni aniqlash uchun asos.
**Variantlar:**
- A) Oy yakunida masъuliyat digesti (qaror → masъul → natija) Совершенствование va departament rahbariga — hujjatga mos
- B) Faqat raqamli statistika, qaror-tahlilsiz — yarim
- C) Keyin — hozir kerak emas

### Q39. Rasmiy ma'lumot talabi (Совершенствование → bo'lim boshlig'i, muddat bilan)
**Nima:** Oргополитика "Совершенствование ушбу маълумотни шакллантириш учун жавобгар бўлим бошлиғига расмий талаб юборади... белгиланган муддатда тақдим этилиши шарт" — ma'lumot talabi yuborilganda, bot muddat bilan kuzatib, kechiksa eslatsinmi.
**Nega kerak:** Tahlil uchun kerakli ma'lumot kechiksa, butun oylik tahlil kechikadi.
**Variantlar:**
- A) Rasmiy ma'lumot talabi → bo'lim boshlig'iga signal + muddat taymeri + kechiksa eslatma — nazorat
- B) Faqat bir marta yuboriladi — sodda
- C) Keyin — hozir kerak emas

### Q40. Eski ma'lumot ustida ishlash ogohlantirishi
**Nима:** Oргополитика "Эски маълумот устида ишлашга йўл қўйилмайди... маълумотлар ҳар бир ўзгаришдан сўнг янгиланади" — agar kimdir eski versiyadagi tex-karta/reja ustida ishlayotgan bo'lsa, bot "bu eskirgan, yangisi bor" deb ogohlantirsinmi.
**Nega kerak:** Eski ma'lumotdan foydalanish qaror xatosiga olib keladi (hujjatdagi muammo).
**Variantlar:**
- A) Hujjat/reja yangilansa, eski versiyani ochganlarga "yangilangan, qarang" signali — oldini olish
- B) Faqat yangi versiya yuklanadi, ogohlantirishsiz — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ishlab chiqarish (tex-karta versiyalari) ↔ Dizayn.

### Q41. Yig'ilish topshiriqlari uchun eslatma (muddat bilan)
**Nima:** Hujjatda "Йиғилишларда фаол иштирок этиш, берилган топшириқлар бўйича ҳисоботларни белгиланган муддатларда тақдим этиш" — yig'ilishda berilgan topshiriqlar uchun bot muddat eslatmasini yuritsinmi.
**Nega kerak:** Yig'ilishda berilgan topshiriqlar tez-tez unutiladi — muddat eslatmasi bo'lmasa nazoratdan chiqadi.
**Variantlar:**
- A) Yig'ilish topshirig'i kiritilsa, masъulga muddat eslatmasi + bajarilmasa rahbarga signal — nazorat
- B) Faqat topshiriqlar ro'yxati, eslatmasiz — passiv
- C) Keyin — hozir kerak emas

### Q42. Telefon-qo'ng'iroq qaydini bot saqlasinmi (tungi protokol)
**Nима:** Tungi protokolda telefon qo'ng'irog'i ishlatiladi (RD-4 javob berishi shart) — bot Telegram tashqarisidagi qo'ng'iroqni "qo'ng'iroq qilindi / javob berildi" deb qo'lda qayd qilish imkonini bersinmi.
**Nega kerak:** Tunda telefon ishlatiladi, lekin keyin "qo'ng'iroq qilgandim / qilmagansan" bahsi chiqmasligi uchun qayd kerak.
**Variantlar:**
- A) Bot "qo'ng'iroq qildim" tugmasi → vaqt qayd; qarshi tomon "javob berdim" tasdig'i — ikki tomonli qayd
- B) Faqat qo'ng'iroq qilganini qayd, javob qaydsiz — yarim
- C) Keyin — hozir kerak emas

### Q43. Buyurtma to'liq tugamasdan reja o'zgartirilsa signal
**Нима:** "Режани ўзгартириш ва буюртмани тўлиқ тугатмасдан ўтиш натижасида дастгоҳларни қайта созлаш, вақт йўқотиш кузатилса, бу ҳолатлар таҳлил учун қайд этилади" — buyurtma tugamay reja o'zgartirilsa, bot buni qayd qilib oylik hisobotga qo'shsinmi.
**Nega kerak:** Yarim qoldirilgan buyurtma dastgoh qayta sozlash va vaqt yo'qotishga olib keladi — bu o'lchanishi kerak.
**Variantlar:**
- A) Buyurtma tugamay reja o'zgartirilsa → qayd + sabab so'raladi + oylik tahlilga kiradi — o'lchanadi
- B) Faqat ruxsat beriladi, qaydsiz — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Rejalashtirish ↔ Ishlab chiqarish samaradorligi (oylik tahlil).

### Q44. Kanban doskasidagi qotib qolgan kartochkaga signal
**Нима:** Lug'atda "Канбан доскаси — карточкаларни статуслар бўйича визуал кўрсатувчи панель" — bir kartochka bitta statusda belgilangan vaqtdan ko'p qolsa (qotib qolsa), bot masъulga signal bersinmi.
**Nega kerak:** Kanbanда qotib qolgan kartochka ko'rinadi lekin hech kim chuqurlashmaydi — signal kerak.
**Variantlar:**
- A) Kartochka statusда belgilangan vaqtdan ko'p qotsa → masъulga + bo'lim boshlig'iga signal — nazorat
- B) Faqat doskada rang bilan ko'rsatiladi, signalsiz — passiv
- C) Keyin — hozir kerak emas

### Q45. Buyurtma bajarilishi hisoboti (RD-5 → rahbariyat)
**Нима:** Hujjatda "Буюртмалар бажарилиши бўйича ҳисоботлар" sanalgan — buyurtma yakunlanganda, bot uning bajarilish hisobotini (reja vs fakt, kechikish) avtomatik rahbariyatga yuborsinmi.
**Nega kerak:** Buyurtma yakuni — natija o'lchanadigan nuqta; har biri hisobotsiz o'tib ketmasligi kerak.
**Variantlar:**
- A) Buyurtma yopilganda avtomatik bajarilish hisoboti (reja/fakt/kechikish/sabab) rahbariyatga — to'liq
- B) Faqat oylik yig'ma hisobotda — kechroq
- C) Keyin — hozir kerak emas

### Q46. Bir bo'lim ikkinchisining vazifasiga aralashganda signal (gorizontal chegara)
**Нима:** Oргополитика "Бир бўлим иккинчи бўлим вазифасига аралашмайди, барча келишувлар ёзма қайд этилади" — agar bir bo'lim boshqa bo'lim vakolatidagi qaror chiqarsa, bot tegishli bo'lim boshlig'iga "vakolatdan tashqari" signali bersinmi.
**Nega kerak:** Vakolat chegarasi buzilishi bahs va masъuliyat chalkashligiga olib keladi (hujjatdagi muammo).
**Variантlar:**
- A) Vakolatdan tashqari qaror → tegishli bo'lim boshlig'iga signal + qayd — chegara himoyasi
- B) Faqat yozma kelishuv talab qilinadi, signalsiz — yumshoq
- C) Keyin — hozir kerak emas

### Q47. Adaptatsiya (o'qitish) yakunlanganini bot tasdiqlasinmi
**Нима:** Yangi oргополитика bo'yicha o'qitish 1 kun ichida boshlanishi kerak (Q12) — o'qitish yakunlanganda, har xodim "o'qidim, tushundim" tasdig'ini bot orqali bersinmi (kitobda har vazifa oxirida "ўқиб чиққанингизни тасдиқланг" bor).
**Nega kerак:** Kitobdagi yo'riqnomalar har bo'lim oxirida tasdiq talab qiladi — o'qilganini qayd qilish kerak.
**Variантlar:**
- A) Har xodim yangi oргополитика/yo'riqnomani o'qib tasdiqlaydi; tasdiqlamaganlar НО-3'ga ko'rinadi — qayd
- B) Faqat o'qitish o'tkazilgani qayd etiladi, individual tasdiqsiz — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR/adaptatsiya ↔ Ta'lim moduli.

### Q48. Smenalararo topshirish (peshma-pesh) bildirishnomasi
**Нима:** Kitobda smenalar tizimi bor (3 smena, smena texnologi smena yakunida hisobot beradi) — bir smena tugab ikkinchisi boshlanganda, tugamagan ishlar va ochiq muammolar yangi smenaga avtomatik o'tkazilsinmi.
**Nega kerак:** Smena almashganda ochiq muammo yo'qolmasligi kerak — yangi smena nimani davom ettirishini bilishi shart.
**Variантlar:**
- A) Smena yakunida ochiq ishlar/muammolar ro'yxati avtomatik keyingi smenaga + texnologga yetkaziladi — uzilishsiz
- B) Faqat hisobot saqlanadi, avtomatik topshirish yo'q — qo'lda
- C) Keyin — hozir kerak emas

### Q49. "Kim-nima-oladi" matritsasini egasi ko'rib chiqsinmi (kanal xaritasi)
**Нима:** Oргополитика ideali: "Ким, қачон, қандай масалада ва қайси канал орқали мулоқот қилиши аниқ белгиланган бўлади" — bot uchun "qaysi hodisa → qaysi lavozim → qaysi kanal (shaxsiy/guruh/yozma)" matritsasini egasi bir joyda ko'rib tasdiqlasinmi.
**Nega kerак:** Kanal xaritasi tarqoq bo'lsa, xabarlar noto'g'ri odamga boradi — bitta tasdiqlangan matritsa kerak.
**Variантlar:**
- A) Egasi/rahbar ko'radigan yagona "hodisa → lavozim → kanal" jadvali, undan barcha yo'naltirish kelib chiqadi — yagona haqiqat
- B) Har modul o'z yo'naltirishini alohida belgilaydi — tarqoq
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Barcha modul (bu — bildirishnoma marshrutining markaziy jadvali).

### Q50. "Maълumot yo'qolmaydi" kafolati — har xabar arxivga tushsinmi
**Нима:** Oргополитика maqsadi: "Барча муҳим қарорлар ёзма қайд этилган, маълумот йўқолмайди" — bot orqali o'tgan har bir rasmiy xabar/qaror o'chirilmaydigan arxivga tushib, keyin qidirilsinmi (ОТК natijalari "ўчирилмайди" deydi hujjat).
**Nega kerак:** Hujjat ma'lumot yo'qolishini asosiy muammo deb belgilaydi; sifat natijalari va qarorlar o'chirilmasligi shart.
**Variантlar:**
- A) Rasmiy xabar/qaror/sifat natijasi o'chirilmaydigan arxivга tushadi, qidirish mumkin; oddiy chat o'chsa ham bu qoladi — hujjatga mos
- B) Hamma xabar bir xil saqlanadi (rasmiy ajratilmaydi) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat (ОТК natijalari arxivi) ↔ Совершенствование (tahlil uchun manba).

### Q51. Brak/xato statistikasi haftalik digestda bo'lim kesimida
**Нима:** Kitobda har xato qaysi bo'limga tegishli ekani aniqlanadi (dizayn/konstruktor/korrektor/rejalashtirish) — haftalik digestда qaysi bo'lim qancha xato chiqargani ko'rsatilsinmi.
**Nega kerак:** Takroriy xato manbasini ko'rsatmasa, oргополитika yozish (Q13) kimga kerakligi bilinmaydi.
**Variантlar:**
- A) Haftalik digestда bo'lim kesimida xato soni + takrorlanganlari belgilanган — manba ko'rinadi
- B) Faqat umumiy xato soni — yarim
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Sifat ↔ HR/KPI ↔ Совершенствование.

### Q52. Ko'rilmagan muhim xabar uchun qayta-yuborish jadvali
**Нима:** Muhim signal (jihoz nosozligi, muddat o'tishi) belgilangan vaqtda ko'rilmasa, bot uni qancha marta va qaysi oraliqda qayta yuborsinmi (eskalatsiyaga o'tishdan oldin).
**Nega kerак:** Bir marta yuborib ko'rilmasa muammo qoladi; cheksiz takrorlasa bezovta qiladi — o'rtacha kerak.
**Variантlar:**
- A) Muhim xabar ko'rilmasa 2 marta qayta (belgilangan oraliqda), keyin yuqoriga eskalatsiya — muvozanat
- B) Bir marta yuboriladi, qayta yo'q — sodda
- C) Keyin — hozir kerak emas

DONE: Bildirishnoma / Telegram — 52.
