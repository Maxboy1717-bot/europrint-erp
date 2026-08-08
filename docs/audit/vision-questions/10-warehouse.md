# Ombor / WMS — vizyon savollari

> Maqsad: EuroPrint Qo'qon karton/qadoqlash zavodi ombor (WMS) modulini egasining ShVB
> (Biznes Egasi Maktabi, 2020) tizimi + karta-markazli org modeli atrofida qurish.
> Quyidagi har bir savol — bitta aniq funksiya yoki qaror. Egasi variant tanlaydi, agent shunga qarab quradi.
> Til: oddiy o'zbekcha. Birinchi variant (A) — odatda vizyonga eng mos tavsiya.

---

### Q1. Qoldiq nima asosda hisoblanadi (hop-5 omborlar)
**Nima:** Har bir material qancha qolgani qaysi jadval/manbadan olinishi — bizda hozir ikkita parallel stok manbasi bor (`warehouse_stock` va `current_stock`/`stocks`).
**Nega kerak:** Ikki manba bo'lsa, bir joyda 100 dona, boshqa joyda 80 dona ko'rinadi — hech kim qaysisiga ishonishni bilmaydi, hisobot xato chiqadi.
**Variantlar:**
- A) Bitta kanonik jadval — barcha qoldiq faqat `warehouse_stock`dan, qolgani unga ko'zgu (view) — yagona haqiqat, chalkashlik yo'q.
- B) Har ombor turi alohida jadval (xom-ashyo, tayyor mahsulot, MRO alohida) — moslashuvchan, lekin sinxronlash murakkab.
- C) Keyin — hozir kerak emas.

### Q2. Ombor turlari ro'yxati (master-data)
**Nima:** Zavodda qaysi ombor turlari rasman mavjud (xom-ashyo, tayyor mahsulot, yarim-tayyor, MRO/ehtiyot qism, brak/karantin, ijaraga olingan).
**Nega kerak:** Ro'yxat aniq bo'lmasa, har bo'lim o'zicha "ombor" yaratadi va hisobot tarqoq bo'ladi. Bu ombor Dashboard filtrining asosi.
**Variantlar:**
- A) 6 standart tur: Xom-ashyo (RM-MAIN), Tayyor mahsulot (FG), Yarim-tayyor, MRO/ehtiyot, Brak/Karantin, Ijara — to'liq qamrov, ShVB 7-otdelenie (Administratsiya) ostida.
- B) 3 asosiy tur: Xom-ashyo, Tayyor mahsulot, Boshqa — sodda, tez ishga tushadi.
- C) Keyin — hozir kerak emas.

### Q3. Mol qabul qilish (kirim) jarayoni
**Nima:** Yetkazib beruvchidan kelgan mahsulotni omborga kiritish: hujjat, miqdor, sifat tekshiruvi.
**Nega kerak:** Hozir kirim qaysidir joyda yozilsa-da, rasmiy "qabul akti" + sifat darvozasi yo'q — kelgan brak material to'g'ri omborga kirib ketadi.
**Variantlar:**
- A) To'liq qabul oqimi: yetkazib beruvchi → miqdor tekshirish → sifat (QC) darvozasi → omborga kirim yoki karantinga — nazorat to'liq, brak ushlanadi.
- B) Oddiy kirim: faqat miqdor va material kiritiladi, sifat alohida emas — tez, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q4. Mol qabul → buyurtma bilan bog'lash
**Nima:** Kelgan molni qaysi xarid buyurtmasiga (PO) tegishli ekanini avtomatik biriktirish.
**Nega kerak:** Bog'lanmasa, "buyurtma berdik, keldi-kelmadi" noaniq qoladi va ortiqcha/kam yetkazish ko'rinmaydi (3-way match yo'q).
**Variantlar:**
- A) Avtomatik 3-tomonlama moslik: PO ↔ qabul akti ↔ schyot — farq bo'lsa ogohlantiradi — to'liq nazorat.
- B) Qo'lda: omborchi qabulda PO raqamini tanlaydi — sodda, lekin xato ehtimoli bor.
- C) Keyin — hozir kerak emas.

### Q5. Ichki ko'chirish (omborlar orasi)
**Nima:** Bir ombordan ikkinchisiga material o'tkazish (masalan xom-ashyodan sexga, yoki filiallar orasi).
**Nega kerak:** Hozir ko'chirish rasman yozilmasa, material "yo'qoladi" — bir ombor minusга tushadi, boshqasi ortiqcha ko'rsatadi.
**Variantlar:**
- A) Ikki bosqichli ko'chirish: jo'natish (chiqim) + qabul (kirim) tasdig'i bilan, yo'lda holati ko'rinadi — yo'qotish bo'lmaydi.
- B) Bir bosqichli: bitta tugma bilan bir ombordan ikkinchisiga ko'chadi — tez, lekin yo'lda yo'qolishni ushlamaydi.
- C) Keyin — hozir kerak emas.

### Q6. Ko'chirishga ruxsat (kim tasdiqlaydi)
**Nima:** Material ko'chirilishidan oldin kim tasdiqlaydi — omborchi o'zi yoki ombor boshlig'i.
**Nega kerak:** Tasdiqsiz ko'chirish bo'lsa, qimmat materialni hech kim nazorat qilmaydi; ShVB tasdiqlash matritsasi mantiqiga mos kelishi kerak.
**Variantlar:**
- A) Summaga qarab: kichik summa — omborchi o'zi, katta summa — ombor boshlig'i tasdig'i (ShVB matritsasi kabi) — nazorat darajali.
- B) Hamma ko'chirish boshliq tasdig'i bilan — qattiq nazorat, lekin sekin.
- C) Keyin — hozir kerak emas.

### Q7. Inventarizatsiya (sanash) jarayoni
**Nima:** Davriy ravishda omborni qo'lda sanab, tizimdagi qoldiq bilan solishtirish.
**Nega kerak:** Sanashsiz tizimdagi raqam vaqt o'tib haqiqatdan uzoqlashadi; ShVB "inventarizatsiya aniqligi" GSD ko'rsatkichi shu yerdan keladi.
**Variantlar:**
- A) Rejali to'liq sanash: sanash varaqasi → sanaladi → tizim bilan solishtiriladi → farq akti → tuzatish — to'liq va izlanadigan.
- B) Tsiklik sanash: har kuni ombor bir qismi sanaladi (ABC bo'yicha A-guruh tez-tez) — yuk taqsimlangan.
- C) Keyin — hozir kerak emas.

### Q8. Inventarizatsiya aniqlik foizi (GSD ko'rsatkich)
**Nima:** Sanashdan keyin "tizim qancha to'g'ri bo'lgan" foizini hisoblash va saqlash (audit: bu hozir YO'Q).
**Nega kerak:** Bu ShVB bo'yicha ombor bo'limining asosiy haftalik statistikasi (GSD) — aniqlik pasaysa, muammo bor demak.
**Variantlar:**
- A) Avtomatik hisob: aniqlik% = (to'g'ri pozitsiyalar / jami) ×100, har sanashdan keyin saqlanadi va trend ko'rsatiladi — GSD-ga tayyor.
- B) Faqat farq summasi ko'rsatiladi (foizsiz) — sodda, lekin GSD trendi chiqmaydi.
- C) Keyin — hozir kerak emas.

### Q9. Inventarizatsiya farqini kim tasdiqlaydi
**Nima:** Sanashda farq chiqsa (kam yoki ortiq), uni tuzatishdan oldin kim ruxsat beradi.
**Nega kerak:** Tasdiqsiz tuzatish bo'lsa, o'g'irlik yoki xato shunchaki "tuzatib" yashiriladi — moliyaviy nazorat yo'qoladi.
**Variantlar:**
- A) Farq akti → ombor boshlig'i + moliya tasdig'i, keyin tuzatish (GLга yoziladi) — to'liq nazorat va audit izi.
- B) Omborchi o'zi tuzatadi, faqat log qoladi — tez, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q10. Kam-qoldiq darajalari (min/max/reorder)
**Nima:** Har material uchun minimal qoldiq, maksimal qoldiq va qayta buyurtma nuqtasini belgilash (qisman bor: `low_stock_alerts`, `reorder`).
**Nega kerak:** Bu chegaralarsiz material to'satdan tugaydi (ishlab chiqarish to'xtaydi) yoki ortiqcha sotib olinadi (pul muzlaydi).
**Variantlar:**
- A) Har material uchun 3 daraja (min/max/reorder) qo'lda yoki sarfga qarab avto-hisob — to'liq nazorat.
- B) Faqat minimal daraja (min) — sodda, faqat "tugayapti" ogohlantiradi.
- C) Keyin — hozir kerak emas.

### Q11. Kam-qoldiq ogohlantirish kimga boradi
**Nima:** Material reorder nuqtasiga tushganda kim xabar oladi va qanday kanal orqali.
**Nega kerak:** Ogohlantirish noto'g'ri odamga borsa yoki ko'rinmasa, foydasi yo'q — material baribir tugaydi.
**Variantlar:**
- A) Omborchi + xarid bo'limi + ombor boshlig'iga, ilovada + Telegram orqali — hech kim o'tkazib yubormaydi.
- B) Faqat ilovada ro'yxat (alert sahifasi), Telegram yo'q — sodda, lekin ko'rilmasligi mumkin.
- C) Keyin — hozir kerak emas.

### Q12. Kam-qoldiq → avtomatik xarid arizasi
**Nima:** Material reorder nuqtasiga tushganda tizim o'zi xarid arizasi (PR) loyihasini yaratsinmi.
**Nega kerak:** Avtomatik bo'lsa, "esdan chiqdi" muammosi yo'qoladi; ShVB ZVS/xarid oqimiga ulanadi.
**Variantlar:**
- A) Avtomatik PR loyihasi yaratiladi, xarid bo'limi faqat tasdiqlaydi — tez va xatosiz.
- B) Faqat ogohlantiradi, PR ni odam qo'lda yaratadi — nazorat odamda qoladi.
- C) Keyin — hozir kerak emas.

### Q13. Kunlik stok hisoboti (audit: bu YO'Q)
**Nima:** Har kuni ombor harakati xulosasi: kirim, chiqim, ko'chirish, kun oxiridagi qoldiq.
**Nega kerak:** ShVB bo'yicha bu ombor bo'limining kunlik statistikasi; rahbar har ertalab "kecha nima bo'ldi" ni bir qarashda ko'rishi kerak.
**Variantlar:**
- A) Avtomatik kunlik hisobot: har kechasi tuziladi, ertalab rahbarga Telegram/ilovada xulosa — qo'l mehnatisiz.
- B) Qo'lda tugma: omborchi kun oxirida "hisobotni tuzish" bosadi — sodda, lekin esdan chiqishi mumkin.
- C) Keyin — hozir kerak emas.

### Q14. Rulon qoldig'i (qog'oz/karton rulonlari)
**Nima:** Karton/qog'oz rulonlarining qoldig'ini alohida boshqarish — har rulon o'z og'irligi/metraji bilan, qisman sarflanganda qoldig'i qoladi.
**Nega kerak:** Karton zavodida rulon to'liq sarflanmaydi — yarmi qoladi; oddiy "dona" hisobi rulon qoldig'ini ko'rsatmaydi, material yo'qoladi.
**Variantlar:**
- A) Har rulon alohida birlik (ID, boshlang'ich og'irlik/metr, joriy qoldiq), kesilganda qoldiq yangilanadi — aniq nazorat, qoldiqlar ko'rinadi.
- B) Rulonlar umumiy kg/metr sifatida (alohida ID yo'q) — sodda, lekin qaysi rulonda qancha qolgani noaniq.
- C) Keyin — hozir kerak emas.

### Q15. Rulon qoldig'i (ostatok) qayta ishlatish
**Nima:** Kesimdan qolgan kichik rulon qoldiqlarini (ostatkalarni) ro'yxatga olib, keyingi mos buyurtmaga taklif qilish.
**Nega kerak:** Ostatkalar ro'yxatga olinmasa, ular axlatga ketadi — to'g'ridan-to'g'ri pul yo'qotish; ShVB kaizen/tejamkorlik mantiqiga mos.
**Variantlar:**
- A) Ostatok reestri: har qoldiq o'lcham/sifat bilan saqlanadi, yangi buyurtmaga mos ostatok avtomatik taklif qilinadi — material tejaladi.
- B) Faqat ro'yxat ko'rinadi (avto-taklif yo'q), omborchi o'zi qaraydi — sodda.
- C) Keyin — hozir kerak emas.

### Q16. Karantin (brak/tekshiruvdagi material)
**Nima:** Sifati shubhali yoki tekshiruvdagi materialni alohida "karantin" holatida ushlash — sotuvga/ishlab chiqarishga chiqmaydi.
**Nega kerak:** Karantin bo'lmasa, brak material ishlab chiqarishga kirib ketadi va tayyor mahsulot ham brak chiqadi.
**Variantlar:**
- A) Alohida karantin holati: qabulda yoki sifat tekshiruvda material karantinga tushadi, QC qaror chiqarmaguncha bloklangan — to'liq himoya.
- B) Faqat belgi (flag) qo'yiladi, ammo jismonan bloklanmaydi — sodda, lekin xato ishlatish mumkin.
- C) Keyin — hozir kerak emas.

### Q17. Karantindan chiqish qarori
**Nima:** Karantindagi material taqdiri kim tomonidan hal qilinadi — ishlatishga ruxsat, qaytarish yoki yo'q qilish.
**Nega kerak:** Qaror egasiz qolsa, material karantinda "muzlab" qoladi yoki nazoratsiz chiqib ketadi.
**Variantlar:**
- A) QC/sifat bo'limi qaror chiqaradi (ruxsat / yetkazib beruvchiga qaytar / brakka chiqar), har qaror loglanadi — aniq mas'uliyat.
- B) Ombor boshlig'i o'zi hal qiladi — tez, lekin sifat ekspertizasiz.
- C) Keyin — hozir kerak emas.

### Q18. Yaroqlilik muddati / partiya (срок годности, FEFO)
**Nima:** Bo'yoq, kley, plyonka kabi muddatli materiallar uchun partiya va yaroqlilik sanasini kuzatish.
**Nega kerak:** Muddat kuzatilmasa, eskirgan material ishlatiladi yoki to'satdan "yaroqsiz" deb chiqib pul yo'qoladi.
**Variantlar:**
- A) Partiya + yaroqlilik sanasi, FEFO (avval muddati tugaydigan birinchi chiqadi) + muddat yaqinlashganda ogohlantirish — minimal yo'qotish.
- B) Faqat partiya raqami (muddatsiz) — qisman izlanadi.
- C) Keyin — hozir kerak emas.

### Q19. Ombor-ijara (kirim — biz tashqi mijoz molini saqlaymiz)
**Nima:** Bizning ombor maydonimizni boshqa kompaniyaga ijaraga berib, ularning molini saqlash va haq olish (kod: `wms-rental`/`warehouse-rental` bor).
**Nega kerak:** Bo'sh ombor maydoni — yo'qotilgan daromad; ijara — qo'shimcha pul oqimi, lekin hisob-kitob va shartnoma kerak.
**Variantlar:**
- A) To'liq ijara moduli: ijarachi, maydon/joy, shartnoma muddati, oylik haq, saqlanayotgan mol — moliyaga ulanadi (daromad) — to'liq biznes.
- B) Faqat oddiy reestr: kim, qancha joy, qancha to'lov — hisob qo'lda — sodda boshlanish.
- C) Keyin — hozir kerak emas.

### Q20. Ombor-ijara to'lovi va moliya bilan bog'lanishi
**Nima:** Ijara haqi qanday hisoblanadi va qachon daromad sifatida moliyaga (GL) tushadi.
**Nega kerak:** Bog'lanmasa, ijaradan kelgan pul moliyaviy hisobotda ko'rinmaydi va debitorlik nazorati yo'qoladi.
**Variantlar:**
- A) Oylik avtomatik schyot: maydon × tarif, schyot chiqariladi, to'lov debitorlik/GL ga ulanadi — ShVB to'lanmagan schyotlar oqimiga mos.
- B) Qo'lda kiritiladi: omborchi to'lovni qo'lda belgilaydi — sodda, lekin nazoratsiz.
- C) Keyin — hozir kerak emas.

### Q21. Ombor xaritasi / joylashuv (locator)
**Nima:** Material qaysi qatorda, javonda, yacheykada turishini belgilash (bin/location).
**Nega kerak:** Joylashuvsiz katta omborda materialni topish vaqt yeydi; tsiklik sanash va FEFO ham joyga tayanadi.
**Variantlar:**
- A) To'liq locator: zona → qator → javon → yacheyka, har material o'rni bilan — tez topiladi.
- B) Faqat zona darajasi (umumiy bo'lim) — sodda, taxminiy.
- C) Keyin — hozir kerak emas.

### Q22. Barkod / QR bilan ishlash
**Nima:** Kirim, chiqim, ko'chirish va sanashda barkod/QR skanerlash (kod: `wms-barcode` bor).
**Nega kerak:** Qo'lda kiritish sekin va xato; skaner bilan omborchi tez va xatosiz ishlaydi (POS Monitor tabletga mos).
**Variantlar:**
- A) Barcha amallar barkod orqali (kirim/chiqim/ko'chirish/sanash) tablet ilovasida — tez va aniq.
- B) Faqat sanashda barkod, qolgani qo'lda — qisman.
- C) Keyin — hozir kerak emas.

### Q23. Ombor bo'limi GSD/ЦКП (karta-model integratsiyasi)
**Nima:** Ombor bo'limi va omborchi lavozimi uchun asosiy statistik ko'rsatkich (GSD/ЦКП) ni belgilash — masalan "inventarizatsiya aniqligi %" va "kun ichida bajarilgan kirim/chiqim soni".
**Nega kerak:** Sizning karta-modelingiz bo'yicha har lavozimning o'z GSD si bor; omborchi kartasi shu ko'rsatkichlar bilan baholanadi va oyligi shunga bog'lanadi.
**Variantlar:**
- A) Omborchi kartasiga 2-3 GSD: aniqlik%, kirim/chiqim tezligi, kam-qoldiq holatlari soni — karta-modelga to'liq ulanadi.
- B) Faqat 1 umumiy GSD (aniqlik%) — sodda boshlanish.
- C) Keyin — hozir kerak emas.

### Q24. Omborchi razryadi → vakolat darajasi
**Nima:** Omborchi razryadiga (malaka darajasiga) qarab qaysi amallarni mustaqil bajara olishini belgilash.
**Nega kerak:** Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; yangi omborchi katta summali ko'chirishni o'zi qila olmasligi kerak.
**Variantlar:**
- A) Razryadga bog'liq vakolat: past razryad — faqat oddiy kirim/chiqim, yuqori razryad — inventarizatsiya/farq tuzatish — karta-modelga mos.
- B) Hamma omborchi bir xil vakolat — sodda, lekin nazorat zaif.
- C) Keyin — hozir kerak emas.

### Q25. Ombor bilan ishlab chiqarish (MES) bog'lanishi
**Nima:** Sexga material berilganda (chiqim) avtomatik ombordan yechilishi va ishlab chiqarish buyurtmasiga bog'lanishi.
**Nega kerak:** Bog'lanmasa, material "sexga ketdi" lekin omborda hali turibdi ko'rinadi — qoldiq doim xato.
**Variantlar:**
- A) Avtomatik: ishlab chiqarish buyurtmasi material talab qilganda ombordan rezerv + chiqim — qoldiq real vaqtda to'g'ri.
- B) Qo'lda: omborchi sexga berganda chiqim kiritadi — sodda, lekin kechikadi.
- C) Keyin — hozir kerak emas.

### Q26. Ombor bilan tayyor mahsulot (FG) qabuli
**Nima:** Ishlab chiqarishdan chiqqan tayyor mahsulotni tayyor-mahsulot omboriga kiritish.
**Nega kerak:** Hozir tayyor mahsulot kirimi ikki joyda yozilishi mumkin (audit: `stocks` ╳ `warehouse_stock`) — qaysisi to'g'ri noaniq.
**Variantlar:**
- A) MES tayyor mahsulot chiqarganda avtomatik kanonik FG omboriga kirim — yagona haqiqat.
- B) Omborchi qo'lda qabul qiladi — sodda, lekin ikkilanish bo'lishi mumkin.
- C) Keyin — hozir kerak emas.

### Q27. ABC tahlil (qaysi material muhim)
**Nima:** Materiallarni qiymat/aylanma bo'yicha A/B/C guruhlarga ajratish (kod: `wms-catalog`da ABC bor).
**Nega kerak:** A-guruh (eng qimmat) materiallar tez-tez sanalishi va qattiq nazorat qilinishi kerak; bu tsiklik sanashning asosi.
**Variantlar:**
- A) Avtomatik ABC: tizim aylanma/qiymatga qarab guruhlaydi, tsiklik sanash chastotasini shunga bog'laydi — aqlli nazorat.
- B) Faqat ko'rsatadi (sanashga bog'lamaydi) — ma'lumot, lekin amalga ulanmagan.
- C) Keyin — hozir kerak emas.

### Q28. Sekin aylanuvchi / o'lik zaxira (dead stock)
**Nima:** Uzoq vaqt harakatlanmagan materialni aniqlash va ogohlantirish.
**Nega kerak:** O'lik zaxira — muzlagan pul va joy; ko'rsatilmasa, ombor keraksiz mol bilan to'lib qoladi.
**Variantlar:**
- A) Avtomatik: N kun harakatlanmagan material ro'yxati + ogohlantirish (sotish/qaytarish taklifi bilan) — pul ozod bo'ladi.
- B) Faqat hisobotda ko'rinadi, ogohlantirish yo'q — passiv.
- C) Keyin — hozir kerak emas.

### Q29. Ombor inspeksiyasi (ShVB inspektor-menejer)
**Nima:** Ombor tartibi/holatini davriy tekshirish va ball berish (ShVB inspektor-menejer roli bilan).
**Nega kerak:** ShVB bo'yicha inspeksiya — ombor intizomini ushlab turadi (tartib, yorliqlash, xavfsizlik); tekshiruvsiz ombor tartibsizlanadi.
**Variantlar:**
- A) Rejali inspeksiya: mezonlar bo'yicha ball + buzilish + tuzatish rejasi, GSD-ga ulanadi — intizom nazorati.
- B) Faqat erkin izoh (mezonsiz) — sodda, lekin solishtirib bo'lmaydi.
- C) Keyin — hozir kerak emas.

### Q30. Ombor harakatlari to'liq tarixi (audit izi)
**Nima:** Har bir kirim/chiqim/ko'chirish/tuzatishni kim, qachon, qancha qilganini o'zgartirib bo'lmaydigan tarzda saqlash.
**Nega kerak:** Audit izisiz nizoda (kim material yo'qotdi?) hech narsa isbotlanmaydi; moliyaviy nazorat va ishonch shunga tayanadi.
**Variantlar:**
- A) Har amal o'zgarmas log: foydalanuvchi + vaqt + miqdor + sabab, faqat qo'shiladi (o'chirib bo'lmaydi) — to'liq audit izi.
- B) Faqat oxirgi holat saqlanadi (tarix yo'q) — sodda, lekin nizoda foydasiz.
- C) Keyin — hozir kerak emas.

### Q31. Telegram orqali ombor so'rovlari (ShVB bot)
**Nima:** Telegram bot orqali tez so'rov: "/qoldiq <material>", "/kam_qoldiq", "/kunlik_stok".
**Nega kerak:** ShVB da operativlik muhim — rahbar ilovaga kirmasdan Telegramdan tez javob olishni xohlaydi.
**Variantlar:**
- A) ShVB ombor komandalar to'plami: qoldiq so'rash, kam-qoldiq ro'yxati, kunlik xulosa — operativ boshqaruv.
- B) Faqat avtomatik push (kam-qoldiq, kunlik hisobot), interaktiv so'rov yo'q — sodda.
- C) Keyin — hozir kerak emas.
