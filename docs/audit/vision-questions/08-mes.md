# MES / Ishlab chiqarish — vizyon savollari

> 2026-06-07 · Egasi bilan intervyu uchun. Maqsad: ShVB (2020) + karta-markazli modelni MES moduliga qanday qo'shishni hal qilish.
> Auditdagi holat: MES da ishlab chiqarish sessiyasi, `downtime_events` + `downtime_reason_codes`, SOS, OEE snapshot, smena (morning/afternoon/night), work-order holat-mashinasi BOR. Brigada, avto-norma material sarfi, "hop3" 3-bosqichli sessiya, jonli monitoring kengaytmalari va karta-modelga ulanish HALI yo'q yoki qisman.

---

### Q1. Ishlab chiqarish sessiyasi 3-bosqich ("hop3")
**Nima:** Har bir sessiyani 3 aniq bosqichga bo'lish — tayyorgarlik (sozlash/changeover), asosiy ishlab chiqarish, yakunlash (tozalash/topshirish).
**Nega kerak:** Hozir sessiya bitta "start–stop" oralig'i; bosqichga bo'lsangiz qaysi bosqichda vaqt yo'qolayotganini (masalan sozlash uzayganini) ko'rasiz va OEE'ni to'g'riroq hisoblaysiz.
**Variantlar:**
- A) To'liq 3 bosqich (tayyorgarlik / asosiy / yakunlash) — har bosqich vaqti alohida, eng aniq tahlil
- B) 2 bosqich (sozlash / ishlash) — soddaroq, lekin yakunlash ko'rinmaydi
- C) Keyin — hozir bitta sessiya yetadi

### Q2. Bosqichlar avtomatmi yoki operator bosadimi
**Nima:** "Hop3" bosqichlari operator tugma bosishi bilan o'tadimi yoki sensordan (mashina ishga tushdi) avtomatik aniqlanadimi.
**Nega kerak:** Avto-aniqlash aniqroq va operatorga ortiqcha ish bermaydi, lekin sensorga bog'liq; qo'lda bosish oson, lekin operator unutsa ma'lumot buziladi.
**Variantlar:**
- A) Avtomatik (sensor/IoT) — operator aralashmasdan bosqichlar o'tadi, eng aniq
- B) Operator tugmasi bilan qo'lda — sensorsiz ishlaydi, lekin intizomga bog'liq
- C) Aralash — sensor bor mashinada avto, qolganlarida qo'lda

### Q3. Smena modelini aniqlash (3 smena standart)
**Nima:** Smenalar ro'yxati va vaqtlarini belgilash — ertalabki/kunduzgi/tungi (hozir kodda morning/afternoon/night bor).
**Nega kerak:** Smena = barcha hisobotning (OEE, sarf, brigada bali) asosiy bo'linishi; vaqtlari aniq bo'lmasa sessiyalar noto'g'ri smenaga tushadi.
**Variantlar:**
- A) 3 smena, soatlari sozlanadigan (masalan 08–16 / 16–24 / 00–08) — zavod jadvaliga moslashtiriladi
- B) 2 smena (kunduzgi/tungi) — kichik hajm uchun yetarli
- C) Keyin — hozirgi 3 nom (morning/afternoon/night) qoladi

### Q4. Brigada (jamoa) tushunchasini qo'shish
**Nima:** Sessiyaga bitta operator emas, brigada (bir necha xodim + brigadir) biriktirish.
**Nega kerak:** Karton/qadoq sexida ko'pincha mashinada jamoa ishlaydi; natija jamoaga yoziladi, bonus/reyting jamoa bo'yicha hisoblanadi.
**Variantlar:**
- A) To'liq brigada (a'zolar ro'yxati + brigadir + smena) — jamoa natijasi va bali
- B) Brigadir + operatorlar soni (ismsiz) — yengilroq, lekin shaxsiy hissa ko'rinmaydi
- C) Keyin — hozircha bitta operator/sessiya

### Q5. Brigada tarkibini kim belgilaydi
**Nima:** Smena boshida brigada tarkibini kim shakllantiradi — usta/brigadir tizimda tanlaydimi yoki HR oldindan jadvalga biriktiradimi.
**Nega kerak:** Tarkib aniq bo'lmasa natija kimga tegishli ekani noaniq qoladi; intizom va davomat shu yerdan ulanadi.
**Variantlar:**
- A) Brigadir smena boshida tizimda tarkibni tasdiqlaydi — jonli, real holatga mos
- B) HR haftalik jadval tuzadi, MES o'qiydi — barqaror, lekin almashinuvni aks ettirmaydi
- C) Keyin — tarkib hozircha qo'lda izoh

### Q6. Material sarfini avtomatik norma bo'yicha yechish
**Nima:** Sessiya yopilganda ishlab chiqarilgan miqdorga ko'ra material (karton, qog'oz, bo'yoq, yelim) normadan avtomatik hisoblanib ombordan yechilsin.
**Nega kerak:** Hozir sarf qo'lda kiritiladi yoki umuman yozilmaydi; avto-norma haqiqiy tannarx va ombor qoldig'ini real qiladi.
**Variantlar:**
- A) To'liq avto: norma × miqdor → ombordan avto-yechim + GL (haqiqiy tannarx) — eng kuchli
- B) Avto-hisob, lekin operator/usta tasdiqlaganda yechiladi — nazorat saqlanadi
- C) Keyin — sarf qo'lda kiritiladi

### Q7. Norma manbai (texkarta) qayerdan keladi
**Nima:** Har mahsulot uchun "1 dona = qancha material" normasi qayerda saqlanadi — texnologik kartada (BOM) yoki MES ichida alohida.
**Nega kerak:** Avto-sarf ishlashi uchun ishonchli norma kerak; manba bitta bo'lmasa raqamlar bo'linadi.
**Variantlar:**
- A) Texkarta/BOM yagona manba (PP modulidan) — MES faqat o'qiydi, bitta haqiqat
- B) MES da alohida norma jadvali — mustaqil, lekin BOM bilan dublikat xavfi
- C) Keyin — norma hozircha taxminiy

### Q8. Norma chetlashuvini (haqiqiy vs norma) kuzatish
**Nima:** Haqiqiy sarf normadan oshsa (masalan brak ko'p) farqni ko'rsatuvchi ortiqcha-sarf hisoboti.
**Nega kerak:** Ortiqcha sarf = yashirin yo'qotish/o'g'rilik signali; karton sexida material eng katta xarajat.
**Variantlar:**
- A) Har sessiyada farq% + smena/brigada bo'yicha jamlanma — darhol ogohlantirish
- B) Faqat oylik umumiy chetlashuv hisoboti — yengilroq, kechroq ko'rinadi
- C) Keyin — hozircha faqat sarf yoziladi

### Q9. SOS (favqulodda chaqiruv) oqimini aniqlash
**Nima:** Operator "SOS" bosganda kim xabardor bo'ladi va qanday eskalatsiya (usta → muhandis → direktor) ishlaydi (hozir SOS yozuvi bor, oqim yo'q).
**Nega kerak:** SOS aniq adresat va vaqt-cheklovsiz bo'lsa "do'st-do'stga aytib qo'yish" bo'lib qoladi; tez javob ishlab chiqarishni saqlaydi.
**Variantlar:**
- A) Bosqichli eskalatsiya: usta → bo'lim boshlig'i → direktor (vaqt o'tsa avto-ko'tariladi) — kafolatli javob
- B) Bitta guruhga (Telegram/ekran) bir martalik xabar — sodda, lekin kechiksa kim javobgar noaniq
- C) Keyin — SOS hozircha faqat yoziladi

### Q10. SOS sabab toifalari (master-data)
**Nima:** SOS sabablarining tayyor ro'yxati — mashina buzildi, material tugadi, xavfsizlik, sifat, boshqa.
**Nega kerak:** Tayyor toifa bo'lsa SOS'larni guruhlash, takror sabablarni topish va tezkor reaksiya qilish oson.
**Variantlar:**
- A) 5–6 standart toifa + "boshqa" (izoh majburiy) — tahlilga qulay
- B) Faqat erkin matn — tez, lekin guruhlab bo'lmaydi
- C) Keyin — hozirgi erkin sabab qoladi

### Q11. Downtime (to'xtash) sabab kodlarini boyitish
**Nima:** Mavjud `downtime_reason_codes` ro'yxatini zavodga moslab to'ldirish (changeover, qog'oz uzilishi, bo'yoq almashtirish, elektr, material kutish, tushlik...).
**Nega kerak:** To'g'ri sabab kodlari OEE'ning "qaerda vaqt yo'qoladi" tahlilini real qiladi; umumiy kodlar bilan sabab ko'rinmaydi.
**Variantlar:**
- A) Karton/qadoq sexiga xos to'liq kodlar ro'yxati (15–25 ta) — aniq tahlil
- B) Mavjud umumiy kodlar (mexanik/elektr/material/operator/boshqa) — yetarli minimal
- C) Keyin — hozirgi kodlar qoladi

### Q12. Rejali vs rejasiz to'xtash ajratish
**Nima:** Har to'xtashni rejali (changeover, tushlik, texxizmat) yoki rejasiz (buzilish, material yo'q) deb belgilash.
**Nega kerak:** OEE'da rejali to'xtash Availability'ga, rejasiz boshqacha ta'sir qiladi; ajratmasa OEE noto'g'ri pasayadi.
**Variantlar:**
- A) Har sababkodga rejali/rejasiz/sifat turi biriktiriladi (avtomatik) — to'g'ri OEE
- B) Operator har safar qo'lda tanlaydi — moslashuvchan, lekin xatoga moyil
- C) Keyin — hozircha hammasi bir xil hisoblanadi

### Q13. Downtime'ni kim va qachon kiritadi
**Nima:** To'xtash yuz berganda operator darhol kiritadimi yoki usta smena oxirida to'ldiradimi.
**Nega kerak:** Real vaqtda kiritilsa jonli monitoring va tez reaksiya bo'ladi; keyin to'ldirilsa ma'lumot to'liq, lekin kech va noaniq.
**Variantlar:**
- A) Operator darhol (boshlanishi avto, sabab keyin) — jonli va aniq
- B) Usta smena oxirida jamlab kiritadi — yengil, lekin kechikkan
- C) Aralash — uzun to'xtash darhol, qisqasi keyin

### Q14. OEE'ni qaysi darajada ko'rsatish
**Nima:** OEE (Availability × Performance × Quality) qaysi kesimda hisoblanadi — mashina, smena, brigada, butun sex.
**Nega kerak:** Karta-modelda har birlik o'z GSD'siga ega; OEE darajasi bonus va reyting bilan bog'lanadi.
**Variantlar:**
- A) Hamma darajada (mashina + smena + brigada + sex) — to'liq ko'rinish
- B) Faqat mashina + sex — soddaroq, brigada bali yo'q
- C) Keyin — hozirgi mashina-bo'yicha OEE qoladi

### Q15. OEE maqsad (target) va ogohlantirish chegarasi
**Nima:** Har mashina/sexga OEE maqsadi (masalan 65%) va kritik chegara (masalan 40%) belgilash.
**Nega kerak:** Maqsadsiz OEE shunchaki raqam; chegara bo'lsa tushib ketganda avto-signal va GSD bajarilishi o'lchanadi.
**Variantlar:**
- A) Har mashina/sexga alohida maqsad + kritik chegara — moslashuvchan, real
- B) Butun zavodga bitta umumiy maqsad — sodda, lekin qo'pol
- C) Keyin — hozircha maqsadsiz, faqat raqam

### Q16. Jonli monitoring ekrani (sex tablosi)
**Nima:** Sexda katta ekran/dashboard — har mashina holati (ishlayapti/to'xtagan/SOS), joriy miqdor, OEE jonli.
**Nega kerak:** Bir qarashda butun sex ko'rinadi; to'xtagan mashina darhol e'tiborga tushadi, "ko'rinmas yo'qotish" kamayadi.
**Variantlar:**
- A) To'liq jonli tablo (har mashina rangli holat + jonli OEE/miqdor) — eng ta'sirli
- B) Soddalashtirilgan ro'yxat (ishlayapti/to'xtagan soni) — yengil
- C) Keyin — hozircha faqat hisobot sahifasi

### Q17. Jonli yangilanish tezligi
**Nima:** Monitoring ekrani qanchalik tez yangilanadi — soniyada (real-time push) yoki har necha daqiqada.
**Nega kerak:** Tez yangilanish jonli his beradi, lekin tizimga yuk; sekin yangilanish yengil, lekin SOS/to'xtash kech ko'rinadi.
**Variantlar:**
- A) Real-time (mashina holati o'zgarishi bilan darhol) — SOS/to'xtash zudlik bilan
- B) Har 1–5 daqiqada yangilanish — yengil, kechikishga toqat qilinadi
- C) Keyin — qo'lda yangilash (sahifa refresh)

### Q18. To'xtagan mashina avto-ogohlantirish
**Nima:** Mashina belgilangan vaqtdan ko'p to'xtab tursa (masalan 15 daqiqa) avtomatik usta/direktorga signal.
**Nega kerak:** Uzoq to'xtash = katta yo'qotish; avto-signal bo'lmasa hech kim sezmay qolishi mumkin.
**Variantlar:**
- A) Avto-signal bosqichli (15 daq → usta, 30 daq → direktor) — kafolatli reaksiya
- B) Faqat ekranda rang o'zgaradi (signal yo'q) — passiv
- C) Keyin — hozircha ogohlantirish yo'q

### Q19. Operator kartasiga ulash (karta-model)
**Nima:** Har operator/brigadir karta-modeldagi lavozim kartasiga bog'lanadi (razryad + GSD + talab).
**Nega kerak:** Karta-model = sizning asosiy vizyoningiz; operator natijasi kartaga yozilmasa oylik/reyting/o'sish ishlamaydi.
**Variantlar:**
- A) Har sessiya/brigada natijasi operator kartasiga yoziladi (GSD bajarilishi) — vizyonga to'liq mos
- B) Natija faqat sex umumiy hisobotiga, kartaga keyin — qisman
- C) Keyin — karta-model ulanmaydi

### Q20. Operator GSD (ЦКП) ko'rsatkichi
**Nima:** Operator/brigada kartasining haftalik GSD'si nima bo'ladi — masalan "yaroqli dona soni", "OEE", "norma ichida sarf".
**Nega kerak:** GSD aniq bo'lmasa operatorni nimaga baholashni bilib bo'lmaydi; ShVB modelida har lavozimda statistik ko'rsatkich bo'lishi shart.
**Variantlar:**
- A) Bir nechta GSD (yaroqli miqdor + OEE + sarf normasi) vaznli ball — to'liq
- B) Bitta asosiy GSD (yaroqli dona soni) — sodda, tushunarli
- C) Keyin — GSD'ni egasi alohida belgilaydi

### Q21. Razryad (malaka darajasi) va natija bog'lanishi
**Nima:** Operatorning razryadi (1–6) natija normasi va oyligiga ta'sir qiladimi — yuqori razryad = yuqori norma/stavka.
**Nega kerak:** Karta-modelda razryad → talab → o'sish → oylik zanjiri bor; MES natijasi razryadni tasdiqlashi yoki ko'tarishi mumkin.
**Variantlar:**
- A) Razryad normani va bahoni belgilaydi, MES natijasi razryad-o'sishga ta'sir qiladi — vizyonga mos
- B) Razryad faqat ko'rsatiladi, hisobga olinmaydi — ma'lumot, lekin ta'sirsiz
- C) Keyin — razryad MES'da ishlatilmaydi

### Q22. Brak (defekt) sababini toifalash
**Nima:** Brak yozilganda sababi tayyor ro'yxatdan tanlanadi (kesim xatosi, bo'yoq, yopishqoqlik, material nuqsoni...).
**Nega kerak:** Sifat (Quality) OEE va kim/nima brak chiqarayotganini bilish uchun sabab kerak; faqat "brak soni" muammoni ko'rsatmaydi.
**Variantlar:**
- A) Tayyor brak-sabab toifalari + masъul bosqich — sifat tahlili real
- B) Faqat brak soni (sababsiz) — yengil, lekin sababsiz
- C) Keyin — hozircha faqat son

### Q23. Smenadan smenaga topshirish (handover)
**Nima:** Smena oxirida keyingi smenaga holat topshirish yozuvi — tugamagan order, nosozlik, material qoldig'i.
**Nega kerak:** Topshiruvsiz keyingi smena nimadan boshlashni bilmaydi; muammolar takrorlanadi va javobgarlik yo'qoladi.
**Variantlar:**
- A) Rasmiy handover yozuvi (tugamagan ish + nosozlik + izoh, keyingi smena tasdiqlaydi) — javobgarlik aniq
- B) Erkin izoh maydoni — tez, lekin tuzilmasiz
- C) Keyin — handover yo'q

### Q24. Ish topshirig'i (work order) MES'ga qanday tushadi
**Nima:** Operator nima ishlab chiqarishini rejadan (PP) avtomatik oladimi yoki usta qo'lda biriktiradimi.
**Nega kerak:** Reja bilan bog'lanish MES'ning ma'nosi; avto bo'lsa reja-fakt taqqoslash ishlaydi, qo'lda bo'lsa uzilish bo'ladi.
**Variantlar:**
- A) Rejadan (PP) avtomatik — operator ro'yxatdan tanlaydi, reja-fakt bog'liq
- B) Usta qo'lda biriktiradi — moslashuvchan, lekin rejaga bog'lanmaydi
- C) Keyin — hozirgi work-order oqimi qoladi

### Q25. Reja vs fakt (ishlab chiqarish bajarilishi)
**Nima:** Smena/order yakunida rejalashtirilgan miqdor bilan haqiqiy miqdorni taqqoslovchi bajarilish% hisoboti.
**Nega kerak:** Reja qancha bajarilganini ko'rsatadi; bu GSD va smena bali asosini beradi.
**Variantlar:**
- A) Har order va smenada reja/fakt/farq% + sabab (kam bajarilsa) — to'liq nazorat
- B) Faqat kunlik umumiy fakt — yengil, lekin reja bilan bog'lanmagan
- C) Keyin — hozircha faqat fakt miqdor

### Q26. Smenani baholash (ball)
**Nima:** Har smena/brigada uchun umumiy ball (0–100) — OEE + bajarilish + brak + intizomdan jamlanadi (kodda MES_SCORE_MAX bor).
**Nega kerak:** Bitta tushunarli ball reyting/bonus uchun asos; alohida raqamlar boshliqqa tushunarsiz.
**Variantlar:**
- A) Vaznli ball (OEE + reja-fakt + brak + sarf) — bitta ko'rsatkich, sozlanadigan vazn
- B) Faqat OEE ball sifatida — sodda, lekin tor
- C) Keyin — ball hozircha yo'q

### Q27. Bonus/reytingga ulanish
**Nima:** Smena/brigada bali oylik bonus yoki reytingga avtomatik ta'sir qiladimi.
**Nega kerak:** ShVB modelida natija → reyting → bonus zanjiri bor; ulanmasa ko'rsatkich shunchaki ma'lumot bo'lib qoladi.
**Variantlar:**
- A) Ball → A/B/C toifa → bonus avto-hisob (payroll bilan) — to'liq motivatsiya
- B) Ball faqat reytingda ko'rinadi, bonus qo'lda — qisman
- C) Keyin — bonus bilan bog'lanmaydi

### Q28. AI ishlab chiqarish nazoratchisi
**Nima:** AI agent jonli ma'lumotni kuzatib anomaliya (g'ayritabiiy to'xtash, sarf oshishi, OEE pasayishi) topib xulosa yozadi (kodda mes-monitor/production-agent bor).
**Nega kerak:** Inson hammasini kuzata olmaydi; AI signal berib "ko'rinmas yo'qotish"ni ochadi va kunlik hisobot yozadi.
**Variantlar:**
- A) AI jonli kuzatadi + kunlik hisobot + anomaliya signali — vizyonga mos
- B) AI faqat so'ralganda tahlil qiladi — yengil, passiv
- C) Keyin — AI nazorat yo'q

### Q29. Materiallar partiyasini (lot) kuzatish
**Nima:** Sessiyada ishlatilgan material qaysi partiyadan (lot/rulon) kelganini yozish.
**Nega kerak:** Brak chiqsa qaysi material partiyasidan ekanini topish va yetkazib beruvchini baholash uchun kerak; sifat dolzarbligi.
**Variantlar:**
- A) Har sessiyada ishlatilgan partiya/rulon yoziladi — to'liq kuzatuv (traceability)
- B) Faqat material turi, partiyasiz — yengil, lekin sababgacha bormaydi
- C) Keyin — partiya kuzatuvi yo'q

### Q30. Texkarta amal qilinishi (adherence)
**Nima:** Operator routing/texkartadagi bosqichlarga amal qildimi — qadamlarni belgilab borish va chetlashuvni qayd qilish.
**Nega kerak:** Standartdan chetlash brak va xavfsizlik muammosini keltiradi; amal-qilinishni o'lchamasa sifat barqaror bo'lmaydi.
**Variantlar:**
- A) Har bosqich belgilanadi (checklist) + chetlashuv qaydi — sifat standartlashadi
- B) Faqat yakuniy "texkarta bo'yicha bajarildi" belgisi — yengil
- C) Keyin — texkarta amal qilinishi kuzatilmaydi
