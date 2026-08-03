# Finance / GL — vizyon savollari

> Maqsad: egasi (ShVB 2020 + karta-model vizyoni) Moliya/GL modulini ERP ga qanday qo'shishni qaror qilsin.
> Har savol = bitta aniq qaror. Birinchi variant = vizyonga eng mos (tavsiya).
> Kontekst: ZVS/ZNO backend bor, lekin jadval va ekran yo'q; FP-tsikl cron ishlaydi; 4-hisob va tasdiqlash-matritsasi qisman.

---

### Q1. ZVS arizasi (haftalik byudjet so'rovi) ekrani
**Nima:** Har bo'lim haftalik xarajat so'rovini (ZVS) tizimda to'ldirib yuboradigan to'liq forma va ro'yxat.
**Nega kerak:** Hozir orqa tomonda mantiq bor, lekin xodim kiritadigan oyna yo'q — pul so'rovlari hali ham qog'oz/Telegramda yuribdi.
**Variantlar:**
- A) To'liq ekran — kiritish + ro'yxat + holat ko'rsatkichi, ShVB blankiga mos — bo'limlar tizimda so'raydi
- B) Faqat oddiy ro'yxat — so'rovlarni ko'rsatadi, kiritish boshqa joyda — yarim yechim
- C) Keyin — hozir kerak emas

### Q2. ZNO arizasi (majburiyat/to'lov so'rovi) ekrani
**Nima:** Tashqi to'lov majburiyatini (ZNO — yetkazib beruvchiga to'lash) tizimga kiritish formasi va kuzatuvi.
**Nega kerak:** ZVS byudjetni ajratadi, ZNO esa real to'lovni boshlaydi — ikkisi ham bo'lmasa pul oqimi tizimda ko'rinmaydi.
**Variantlar:**
- A) To'liq ZNO ekrani — yetkazib beruvchi, summa, hujjat, ZVS ga bog'lab — to'lov zanjiri yopiladi
- B) ZNO ni ZVS ichida belgi sifatida — alohida ekransiz — soddaroq, lekin chalkash
- C) Keyin — avval ZVS ishga tushsin

### Q3. ZVS/ZNO ni 3-savatli koordinatsiyaga ulash
**Nima:** ZVS/ZNO arizasi avtomatik koordinatsiya "savat"iga (tasdiqlash navbati) tushishi.
**Nega kerak:** Ariza yuborilgach kim ko'rishi va qachongacha javob berishi aniq bo'ladi — so'rov yo'qolmaydi.
**Variantlar:**
- A) Avtomatik savatga + 24/48 soat muddat — tasdiqlovchi vaqtida ko'radi
- B) Faqat ro'yxatda turadi, muddatsiz — sekin, unutilishi mumkin
- C) Keyin

### Q4. 4-hisob ajratish (MAIN / TAX / HEAD / WORKING)
**Nima:** Pulni 4 alohida hisobga bo'lib yuritish: asosiy (MAIN), soliq (TAX), egasi/bosh (HEAD), ish-aylanma (WORKING).
**Nega kerak:** ShVB ning poydevori — har tushgan pul darrov 4 ga bo'linadi, shunda soliq va egasi ulushi xavf ostida qolmaydi.
**Variantlar:**
- A) To'rttala hisob alohida + har biri balans/harakat ko'rsatadi — ShVB modeliga to'liq mos
- B) Faqat 2 hisob (asosiy + soliq) — yarim model, egasi ulushi yo'q
- C) Keyin — avval umumiy kassa yetarli

### Q5. Tushumni 4-hisobga avtomatik taqsimlash
**Nima:** Har pul tushganda belgilangan foizlar bo'yicha 4 hisobga o'zi bo'linsinmi yoki qo'lda kiritilsinmi.
**Nega kerak:** Avtomatik taqsim "intizom"ni majbur qiladi — odam unutib soliq pulini sarflab qo'ymaydi.
**Variantlar:**
- A) Avtomatik foiz bilan taqsim (foizni egasi belgilaydi) — intizom kafolati
- B) Qo'lda — kassir har safar o'zi bo'ladi — moslashuvchan, lekin xato xavfi
- C) Keyin

### Q6. Taqsim foizlarini kim belgilaydi
**Nima:** MAIN/TAX/HEAD/WORKING ulush foizlarini sozlash huquqi kimda bo'lishi.
**Nega kerak:** Bu pul taqsimoti — noto'g'ri qo'lda bo'lsa, butun moliya buziladi.
**Variantlar:**
- A) Faqat egasi (direktor) o'zgartiradi, qolganlar ko'radi — xavfsiz
- B) Moliya boshlig'i ham o'zgartira oladi — tezroq, lekin xavfliroq
- C) Keyin

### Q7. Tasdiqlash matritsasi: summalik bosqichlar
**Nima:** So'rov summasiga qarab kim tasdiqlashi: 500 ming so'mgacha — bo'lim, 5 mln gacha — kengash, 5 mln dan yuqori — direktor.
**Nega kerak:** Katta xarajat yolg'iz qaror bilan o'tib ketmaydi; kichik xarajat esa direktorni ovora qilmaydi.
**Variantlar:**
- A) 3 bosqich (bo'lim / kengash / direktor) avtomatik tanlanadi — ShVB matritsasiga aniq mos
- B) 2 bosqich (bo'lim / direktor), kengashsiz — soddaroq
- C) Keyin — hozir hamma so'rov direktorга

### Q8. Tasdiqlash chegaralari sozlanadigan bo'lsinmi
**Nima:** 500k / 5M chegaralari kodga qotirilganmi yoki egasi ekranda o'zgartira oladimi.
**Nega kerak:** Inflyatsiya yoki o'sish bilan chegaralar o'zgaradi — har safar dasturchini chaqirmaslik kerak.
**Variantlar:**
- A) Sozlamada ekrandan o'zgartiriladigan chegara — moslashuvchan
- B) Qotirilgan chegara, o'zgartirish uchun dasturchi kerak — qattiq, lekin oddiy
- C) Keyin

### Q9. Tasdiqlovchini lavozimga emas, kartaga bog'lash
**Nima:** "Kengash" yoki "direktor" tasdiqlovchisi aniq odamga emas, org-kartadagi rolga bog'lansin.
**Nega kerak:** Karta-model bo'yicha — odam almashsa ham karta qoladi, tasdiqlash uzilmaydi.
**Variantlar:**
- A) Tasdiqlovchi = karta (lavozim), egasi kim ekani avtomatik topiladi — karta-modelga mos
- B) Tasdiqlovchi = aniq xodim ismi — odam ketsa qayta sozlash kerak
- C) Keyin

### Q10. Tasdiqlash muddati o'tib ketsa nima bo'ladi
**Nima:** Tasdiqlovchi belgilangan vaqtda javob bermasa tizim nima qilsin.
**Nega kerak:** So'rov "osilib" qolmasligi, ish to'xtamasligi uchun.
**Variantlar:**
- A) Yuqori bosqichga avtomatik ko'tariladi (eskalatsiya) + ogohlantirish — ish to'xtamaydi
- B) Faqat eslatma yuboradi, o'zi turaveradi — yumshoq
- C) Keyin

### Q11. Haftalik FP-tsikl jadvali (Se/Ch/Pa/Du)
**Nima:** Moliyaviy rejalash siklining hafta kunlari: Seshanba/Chorshanba/Payshanba/Dushanba bosqichlari (ariza→tasdiq→to'lov→hisobot).
**Nega kerak:** ShVB ning haftalik ritmi — har kun aniq vazifaga bog'lansa, pul boshqaruvi tartibli yuradi.
**Variantlar:**
- A) 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram eslatma — ShVB reglamentiga mos (cron bor)
- B) Faqat haftada 1 marta umumiy eslatma — tartib yo'qroq
- C) Keyin

### Q12. FP-tsikl kunlarini egasi o'zgartira oladimi
**Nima:** Sikl kunlari (qaysi kuni ariza, qaysi kuni to'lov) sozlanadigan bo'lsinmi.
**Nega kerak:** Bank/bayram kunlari yoki ish tartibi o'zgarsa, jadval moslashishi kerak.
**Variantlar:**
- A) Ekrandan kunlarni o'zgartirish mumkin — moslashuvchan
- B) Qotirilgan 4 kun (Se/Ch/Pa/Du) — barqaror, lekin qattiq
- C) Keyin

### Q13. FP-tsikl eslatmalari qayerga boradi
**Nima:** Sikl bosqichi kelganda eslatma Telegramга, ERP ichidagi bildirishnomага yoki ikkalasigaga.
**Nega kerak:** Mas'ul odam eslatmani ko'radigan joyga olishi kerak, aks holcha bosqich kechikadi.
**Variantlar:**
- A) Telegram + ERP bildirishnoma birga — ko'rmay qolmaydi
- B) Faqat ERP ichida — Telegramsiz, ba'zilar kech ko'radi
- C) Keyin

### Q14. To'lanmagan schyotlar yoshi (aging) ko'rinishi
**Nima:** Qarzlarni qancha kun o'tganiga qarab guruhlash: 0-30 / 31-60 / 61-90 / 90+ kun.
**Nega kerak:** Qaysi pul "qarib ketgani"ni ko'rsatadi — eng eski qarzni birinchi undirish/to'lash kerak.
**Variantlar:**
- A) To'liq aging — 4 guruh + jami summa + eng eski yuqorida — qarama-qarshilik aniq ko'rinadi
- B) Faqat "to'lanmagan ro'yxat", yoshsiz — kim eng xavfli ekani noma'lum
- C) Keyin

### Q15. Aging — debitor (bizga qarz) va kreditor (biz qarzdor) alohidami
**Nima:** Bizga qarz bo'lganlar va biz qarzdor bo'lganlar ikkita alohida ro'yxatda ko'rinsinmi.
**Nega kerak:** Ikkisi — turli harakat: birini undirish, ikkinchisini to'lash kerak; aralashsa chalkashadi.
**Variantlar:**
- A) Ikki alohida ekran (debitor / kreditor), har birida aging — aniq
- B) Bitta umumiy ro'yxat, belgi bilan ajratilgan — soddaroq, lekin chalkash
- C) Keyin

### Q16. Eski qarz haqida avtomatik ogohlantirish
**Nima:** Schyot belgilangan kundan oshganda mas'ulga avtomatik signal borishi.
**Nega kerak:** Qarz "esdan chiqib" katta zararga aylanmasligi uchun.
**Variantlar:**
- A) Kunlik avtomatik alert (90+ kun = direktorga ham) — hech narsa qochmaydi
- B) Faqat ekranda qizil rang, signal yo'q — odam o'zi qarashi kerak
- C) Keyin

### Q17. Byudjet rejalash darajasi
**Nima:** Byudjet butun zavodga umumiymi yoki har bo'lim/karta bo'yicha alohidami.
**Nega kerak:** Bo'lim bo'yicha byudjet — har kim o'z chegarasini biladi, ortig'ini so'ramaydi.
**Variantlar:**
- A) Bo'lim (va karta) bo'yicha byudjet, ZVS shunga taqqoslanadi — nazorat aniq
- B) Faqat umumiy zavod byudjeti — sodda, lekin bo'limlar nazorati yo'q
- C) Keyin

### Q18. ZVS so'rovini byudjetga taqqoslash
**Nima:** Ariza yuborilganda tizim qolgan byudjet bilan taqqoslab "yetadi/yetmaydi" deb ko'rsatsinmi.
**Nega kerak:** Tasdiqlovchi byudjet oshib ketayotganini darhol ko'radi, ko'r-ko'rona tasdiqlamaydi.
**Variantlar:**
- A) Avtomatik taqqoslash + qolgan summa + oshsa ogohlantirish — ortiqcha xarajat to'xtaydi
- B) Faqat ariza summasini ko'rsatadi, byudjetsiz — tasdiqlovchi o'zi tekshiradi
- C) Keyin

### Q19. Byudjet davri
**Nima:** Byudjet haftalik, oylik yoki yillik asosda yuritilsinmi.
**Nega kerak:** ShVB haftalik ishlaydi, lekin soliq/rejalash oylik-yillik bo'lishi mumkin — qaysi asosiy ekani aniq bo'lishi kerak.
**Variantlar:**
- A) Haftalik asosiy + oylik/yillik jamlanma — ShVB ritmiga mos
- B) Faqat oylik byudjet — an'anaviy, lekin haftalik nazoratsiz
- C) Keyin

### Q20. Kassa (naqd) hisobi tizimda
**Nima:** Naqd kirim-chiqim (kassa) ERP ichida yuritilsinmi yoki tashqarida qoldirilsinmi.
**Nega kerak:** Kassa tizimda bo'lsa, 4-hisob va aging bilan bog'lanadi — pulning haqiqiy holati ko'rinadi.
**Variantlar:**
- A) Kassa to'liq ERP ichida — har kirim/chiqim yozuvi + kunlik qoldiq — to'liq nazorat
- B) Faqat kunlik qoldiqni qo'lda kiritish — yengilroq, lekin tafsilotsiz
- C) Keyin

### Q21. Kassa va POS/ombor bilan bog'lanish
**Nima:** Ishlab chiqarish/ombor (POS-monitor) harakatlari kassaga avtomatik yozilsinmi.
**Nega kerak:** Sotuv yoki xarid bo'lganda pul harakati o'zi tushsa, ikki marta yozish va xato kamayadi.
**Variantlar:**
- A) Avtomatik bog'lanish — POS/ombor harakati kassa+GL ga o'zi yoziladi
- B) Qo'lda — moliyachi alohida kiritadi — ishonchli nazorat, lekin sekin
- C) Keyin

### Q22. GL-buxgalteriya: yagona daftar (canonical)
**Nima:** Barcha pul yozuvlari bitta asosiy buxgalteriya daftarida (GL) to'plansinmi.
**Nega kerak:** Hozir bir nechta parallel GL bor — bittaga jamlash balansni ishonchli qiladi.
**Variantlar:**
- A) Yagona kanonik GL — hamma modul (kassa, ZNO, payroll) shunga yozadi — bitta haqiqat
- B) Modullar o'z daftarini yuritadi, vaqti-vaqti jamlanadi — tarqoq, mos kelmaslik xavfi
- C) Keyin

### Q23. Buxgalteriya yozuvi har doim ikki tomonlama bo'lsinmi
**Nima:** Har pul harakati ikki tomon (debet/kredit) bilan yozilib, doim balanslashishi.
**Nega kerak:** Bu buxgalteriyaning asosiy qonuni — balanslashmasa hisobotga ishonib bo'lmaydi.
**Variantlar:**
- A) Doim ikki tomonlama, balanslashmasa yozuv qabul qilinmaydi — to'g'ri buxgalteriya
- B) Oddiy bir tomonlama yozuv ham bo'laveradi — yengil, lekin xato topilmaydi
- C) Keyin

### Q24. Hisoblar rejasi (schyotlar plani) standarti
**Nima:** GL hisoblar ro'yxati O'zbekiston BHMS (milliy hisob standarti) bo'yicha tuzilsinmi yoki ShVB ning soddalashtirilgan ro'yxati bo'yichami.
**Nega kerak:** Standart hisoblar rejasi soliq/audit bilan mos kelishini ta'minlaydi.
**Variantlar:**
- A) Milliy BHMS hisoblar rejasi + ShVB 4-hisob ustiga qo'yiladi — rasmiy + boshqaruv birga
- B) Faqat ShVB sodda ro'yxati — boshqaruvga yetarli, lekin soliqqa mos emas
- C) Keyin

### Q25. Tasdiqlangan ZNO avtomatik GL yozuviga aylansinmi
**Nima:** To'lov so'rovi tasdiqlanib amalga oshgach, buxgalteriya yozuvi o'zi yaratilsinmi.
**Nega kerak:** Qo'lda qayta kiritish — vaqt va xato; avtomatik bo'lsa pul harakati darrov daftarga tushadi.
**Variantlar:**
- A) Avtomatik GL yozuvi (tasdiq→to'lov→daftar) — uzluksiz zanjir
- B) Buxgalter qo'lda yozadi — nazoratli, lekin kechikadi
- C) Keyin

### Q26. To'lov so'roviga hujjat (chek/shartnoma) biriktirish
**Nima:** ZVS/ZNO ga skan/foto hujjat (chek, hisob-faktura, shartnoma) biriktirish imkoni.
**Nega kerak:** Tasdiqlovchi nima uchun to'lanayotganini ko'radi; keyin audit uchun dalil qoladi.
**Variantlar:**
- A) Hujjat biriktirish majburiy (ma'lum summadan yuqorida) — shaffof + auditga tayyor
- B) Ixtiyoriy biriktirish — yengil, lekin ba'zida dalilsiz
- C) Keyin

### Q27. Kompaniya holati ko'rsatkichiga moliyani ulash
**Nima:** "Kompaniya holati" (O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) hisobida moliya ko'rsatkichlari (kassa qoldiq, aging, byudjet) ishtirok etsinmi.
**Nega kerak:** Egasi bir qarashda zavod moliyaviy holatini ko'radi — qaror tezlashadi.
**Variantlar:**
- A) Moliya ko'rsatkichlari holat formulasiga kiradi (kam kassa/katta qarz = XAVF) — boshqaruv paneliga ulanadi
- B) Moliya alohida turadi, holatga ta'sir qilmaydi — soddaroq
- C) Keyin

### Q28. Telegram ShVB komandasi: /zvs_status
**Nima:** Mas'ul Telegramda buyruq yuborib (masalan /zvs_status) joriy ariza/to'lov holatini olishi.
**Nega kerak:** Egasi/boshliq ERP ochmasdan, telefondan tez holatni ko'radi.
**Variantlar:**
- A) Asosiy buyruqlar (/zvs_status, /company_state, /weekly_digest) — qulay tezkor kirish
- B) Faqat ERP ichida, Telegramsiz — bir joyda, lekin sekinroq
- C) Keyin

### Q29. ZVS/ZNO statuslari ro'yxati (master-data)
**Nima:** Ariza qaysi holatlardan o'tishi: Yangi → Bo'lim tasdig'i → Kengash → Direktor → To'langan → Rad etilgan (yoki boshqacha).
**Nega kerak:** Aniq holat zinapoyasi bo'lsa, har kim arizaning qayerdaligini biladi.
**Variantlar:**
- A) To'liq 6 holatli oqim (rad etish + qaytarish bilan) — har bosqich ko'rinadi
- B) Sodda 3 holat (Yangi / Tasdiqlangan / To'langan) — yengil, lekin kam ma'lumot
- C) Keyin

### Q30. Moliya rollarini kim-nima-qiladi (master-data)
**Nima:** Kassir, moliya boshlig'i, kengash a'zosi, direktor — har biri nima ko'radi va nima tasdiqlay oladi.
**Nega kerak:** Pul moduli — huquqlar aniq bo'lmasa, noto'g'ri odam to'lov tasdiqlab qo'yadi.
**Variantlar:**
- A) Har rolga aniq huquq (kassir kiritadi, boshliq tekshiradi, direktor tasdiqlaydi) — vazifa bo'linadi (SoD)
- B) Bitta "moliyachi" hammasini qiladi — sodda, lekin xavfli (nazoratsiz)
- C) Keyin

### Q31. Hisobotlar to'plami
**Nima:** Modul qaysi hisobotlarni bersin: kunlik kassa, haftalik FP-yopilish, oylik foyda-zarar, aging.
**Nega kerak:** Egasi qaror uchun raqamni tayyor holда ko'rishi kerak, qo'lda hisoblamasligi uchun.
**Variantlar:**
- A) To'liq to'plam (kunlik kassa + haftalik FP + oylik P&L + aging) + PDF eksport — boshqaruvga to'liq
- B) Faqat kassa qoldig'i va aging — minimal
- C) Keyin

### Q32. Karta-model bilan integratsiya: moliyaviy mas'uliyat kartaga
**Nima:** Byudjet, ZVS limiti va to'lov mas'uliyati org-kartaga (lavozimga) biriktirilsinmi.
**Nega kerak:** Karta-model bo'yicha — har karta o'z byudjet/limitini biladi, odam almashsa ham qoladi.
**Variantlar:**
- A) Har kartaga byudjet limiti + tasdiqlash huquqi biriktiriladi — karta-modelga to'liq mos
- B) Limit faqat bo'limga, kartaga emas — qo'polroq, lekin oddiy
- C) Keyin
