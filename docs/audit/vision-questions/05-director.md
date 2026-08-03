# Director / Strategiya — vizyon savollari

> Bu hujjat — egasi (zavod boshlig'i) uchun intervyu savollari. Maqsad: ShVB (Biznes Egasi Maktabi) vizyonini va karta-modelni ERP ning Director/Strategiya moduliga qanday qo'shishni hal qilish. Har bir savol — bitta aniq qaror. Texnik til yo'q. Birinchi variant (A) odatda vizyonga eng mos tavsiya.

---

### Q1. Kompaniya holat formulasi — qanday hisoblansin
**Nima:** Kompaniyaning umumiy holatini bitta so'z bilan ko'rsatuvchi formula (OSISH / NORMAL / EHTIYOT / XAVF / INQIROZ).
**Nega kerak:** Boshliq ertalab bitta belgiga qarab kompaniya sog'lig'ini bilib oladi — pul, ishlab chiqarish, xodim, mijoz ko'rsatkichlari bir joyga yig'iladi.
**Variantlar:**
- A) To'liq formula — pul oqimi + ishlab chiqarish + buyurtma + xodim + sifat 5 ko'rsatkich birga hisoblanadi (haqiqiy holatni ko'rsatadi)
- B) Faqat moliya — pul qoldig'i va to'lovlar asosida (sodda, lekin yarim manzara)
- C) Keyin — hozir kerak emas

### Q2. Holat chegaralari (ostona qiymatlar)
**Nima:** Qaysi raqamda holat "NORMAL"dan "EHTIYOT"ga yoki "XAVF"ga o'tishini belgilovchi chegaralar.
**Nega kerak:** Formula ishlashi uchun "qachon signal beradi" aniq bo'lishi kerak — masalan pul oqimi necha kunlik bo'lsa XAVF.
**Variantlar:**
- A) Boshliq o'zi belgilaydi — har ko'rsatkich uchun chegaralarni siz kiritasiz (sizning biznesingizga moslashadi)
- B) Tizim standart chegara qo'yadi — keyin tuzatasiz (tez boshlanadi)
- C) Keyin — hozir kerak emas

### Q3. Holatni kunlik avtomatik hisoblash (cron)
**Nima:** Har kuni belgilangan vaqtda tizim holatni o'zi qayta hisoblab, yangilab qo'yishi.
**Nega kerak:** Boshliq tugma bosmasdan, har ertalab yangi holatni tayyor ko'radi.
**Variantlar:**
- A) Har kuni ertalab avtomatik (masalan 07:00) — siz kelganda tayyor turadi
- B) Faqat siz ochganda hisoblansin — server kamroq ishlaydi, lekin biroz kechikadi
- C) Keyin — hozir kerak emas

### Q4. Holat tarixini saqlash
**Nima:** Har kungi holatni saqlab borib, vaqt o'tishi bilan grafikda ko'rsatish.
**Nega kerak:** "Oxirgi oyda kompaniya yaxshilanyaptimi yoki yomonlashyaptimi" degan savolga grafik bilan javob beradi.
**Variantlar:**
- A) Har kuni saqlanadi + grafik (trend ko'rinadi — eng foydali)
- B) Faqat hozirgi holat saqlanadi, tarix yo'q (sodda, lekin trend ko'rinmaydi)
- C) Keyin — hozir kerak emas

### Q5. Holat yomonlashganda ogohlantirish (alert)
**Nima:** Holat XAVF yoki INQIROZ darajasiga tushganda boshliqqa darhol xabar yuborilishi.
**Nega kerak:** Yomon belgini o'tkazib yubormaslik — muammo katta bo'lishidan oldin boshliq biladi.
**Variantlar:**
- A) Telegram + tizim ichida darhol xabar (boshliq qayerda bo'lsa ham ko'radi)
- B) Faqat tizim ichida belgilanadi (ochganda ko'radi)
- C) Keyin — hozir kerak emas

### Q6. Holat alertini kim oladi
**Nima:** XAVF signalini faqat boshliqmi yoki tegishli bo'lim rahbarlari hammasimi olishi.
**Nega kerak:** Signal noto'g'ri odamga borsa — yo e'tibordan chetda qoladi, yo hammaga panika.
**Variantlar:**
- A) Boshliq + sababchi bo'lim rahbari (masalan pul muammosi → moliyachi ham oladi)
- B) Faqat boshliq (boshqalarni o'zi xabardor qiladi)
- C) Keyin — hozir kerak emas

### Q7. Bajarish kundaligi (Dnevnik) — bo'lishi kerakmi
**Nima:** Boshliqning har kuni qisqa yozadigan kundaligi: bugungi holat, KPI, muammo, yechim, ertangi reja.
**Nega kerak:** ShVB metodi — boshliq fikrini tartibga soladi, har kuni nima qilinganini eslab qoladi, vaqt o'tib tahlil qilinadi.
**Variantlar:**
- A) Ha, to'liq kundalik — 5 bo'lim (holat / KPI / muammo / yechim / ertangi reja) har kuni to'ldiriladi
- B) Soddalashtirilgan — faqat "bugun nima bo'ldi + ertangi reja" 2 bo'lim
- C) Keyin — hozir kerak emas

### Q8. Kundalik kim uchun — faqat boshliqmi yoki bo'lim rahbarlari ham
**Nima:** Bajarish kundaligini faqat boshliq yuritadimi yoki har bo'lim rahbari o'ziniki yuritadimi.
**Nega kerak:** Agar har rahbar yozsa — boshliq pastdan to'liq manzara oladi; faqat boshliq yozsa — sodda lekin tor.
**Variantlar:**
- A) Boshliq + har bo'lim rahbari o'z kundaligini yozadi (boshliq hammasini ko'radi)
- B) Faqat boshliq yuritadi (sodda)
- C) Keyin — hozir kerak emas

### Q9. Kundalikni avtomatik to'ldirish
**Nima:** Kundalikning holat va KPI qismini tizim avtomatik to'ldirib qo'yishi, boshliq faqat muammo/yechim/reja yozishi.
**Nega kerak:** Boshliq raqamlarni qo'lda yozmaydi — tizim biladigan narsani o'zi qo'yadi, vaqt tejaladi.
**Variantlar:**
- A) Holat + KPI avtomatik to'ladi, boshliq faqat fikr/reja yozadi (eng qulay)
- B) Hammasini boshliq qo'lda yozadi (sodda, lekin ko'p vaqt)
- C) Keyin — hozir kerak emas

### Q10. Kundalikda hal qilinmagan muammolarni kuzatish
**Nima:** Kechagi yozilgan muammo hali yechilmagan bo'lsa, uni ertaga ham ko'rsatib turish.
**Nega kerak:** Muammo unutilib ketmasin — yechilmaguncha har kun ko'rinib turadi.
**Variantlar:**
- A) Ha, yechilmagan muammo "ochiq" deb keyingi kunga o'tadi (hech narsa yo'qolmaydi)
- B) Yo'q, har kun yangidan boshlanadi (sodda)
- C) Keyin — hozir kerak emas

### Q11. Ideal kartina (Ideal Rasm) — maqsad ko'rsatkichlari
**Nima:** Kompaniyaning maqsad raqamlari: kerakli foyda, daromad, filiallar soni, xodimlar soni — "qayerga borishimiz kerak".
**Nega kerak:** Maqsadsiz harakat yo'q — ideal kartina bo'lsa, har kun unga qancha yetganini o'lchash mumkin.
**Variantlar:**
- A) To'liq ideal kartina — foyda + daromad + filial + xodim + boshqa maqsadlar (keng manzara)
- B) Faqat moliya maqsadlari — foyda va daromad (sodda boshlash)
- C) Keyin — hozir kerak emas

### Q12. Ideal vs haqiqat farqini (gap) ko'rsatish
**Nima:** Har maqsad bo'yicha "maqsad qancha — hozir qancha — farqi qancha" ni yonma-yon ko'rsatish.
**Nega kerak:** Boshliq darrov ko'radi qaysi maqsaddan ortda qolyapti va qancha qolgan.
**Variantlar:**
- A) Ha, har maqsad uchun maqsad/haqiqat/farq + bajarilish foizi (aniq ko'rinish)
- B) Faqat bajarilish foizi (sodda)
- C) Keyin — hozir kerak emas

### Q13. Ideal kartinaning haqiqiy raqamlari qayerdan olinsin
**Nima:** "Hozir qancha" degan haqiqiy raqam qo'lda kiritiladimi yoki tizimdan (moliya, HR) avtomatik olinadimi.
**Nega kerak:** Avtomatik bo'lsa — har doim yangi va ishonchli; qo'lda bo'lsa — eski/xato bo'lishi mumkin.
**Variantlar:**
- A) Avtomatik — foyda moliyadan, xodimlar soni HR dan o'zi tortiladi (har doim to'g'ri)
- B) Qo'lda kiritiladi (sodda, lekin yangilab turish kerak)
- C) Keyin — hozir kerak emas

### Q14. Ideal kartina versiyalari (yil bo'yicha)
**Nima:** Har yil yangi ideal kartina belgilab, eskisini saqlab qo'yish (2025 maqsad, 2026 maqsad alohida).
**Nega kerak:** Maqsadlar yildan-yilga o'sadi — eskisi saqlansa, "o'tgan yil rejani bajardikmi" deb solishtirish mumkin.
**Variantlar:**
- A) Ha, har yil/davr uchun alohida versiya saqlanadi (tarix qoladi)
- B) Faqat bitta joriy kartina (sodda, lekin eskisi yo'qoladi)
- C) Keyin — hozir kerak emas

### Q15. Strategik reja (OKR) — maqsad va natija strukturasi
**Nima:** Kompaniyaning katta strategik maqsadlari (Objective) va ularning o'lchanadigan natijalari (Key Results).
**Nega kerak:** Yillik katta maqsadni aniq o'lchanadigan natijalarga bo'lish — har kim qayerga harakat qilishini biladi.
**Variantlar:**
- A) Maqsad → o'lchanadigan natijalar (klassik OKR) — har natija foiz bilan kuzatiladi
- B) Faqat maqsadlar ro'yxati (sodda, lekin o'lchov yo'q)
- C) Keyin — hozir kerak emas (OKR allaqachon qisman bor)

### Q16. OKR qaysi darajalarda bo'lsin
**Nima:** OKR faqat kompaniya darajasidami yoki bo'lim va karta (lavozim) darajasiga ham tushadimi.
**Nega kerak:** Agar pastga tushsa — har lavozim katta maqsadga qanday hissa qo'shishini ko'radi (karta-model bilan bog'lanadi).
**Variantlar:**
- A) Kompaniya → bo'lim → karta (lavozim) — har daraja yuqorisiga ulanadi (oltin ip)
- B) Faqat kompaniya darajasi (sodda boshlash)
- C) Keyin — hozir kerak emas

### Q17. Taktik reja — strategiyadan oylik rejaga o'tish
**Nima:** Yillik strategik rejani oylik aniq vazifalarga ajratish (strategiya → bu oy nima qilinadi).
**Nega kerak:** Katta reja faqat qog'ozda qolmasin — har oy uchun aniq qadamlar bo'lsa, harakat boshlanadi.
**Variantlar:**
- A) Ha, strategiya → oylik taktik vazifalar (har oy nima qilinishi aniq)
- B) Faqat yillik strategiya qoladi, oylik bo'lim yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q18. Oylikdan haftalikga dekompozitsiya
**Nima:** Oylik taktik vazifalarni hafta-hafta bo'lib, har hafta nima qilinishini ko'rsatish.
**Nega kerak:** ShVB metodi — katta vazifa haftalik bo'lakka bo'linsa, har hafta natija ko'rinadi va orqada qolish darrov sezilad.
**Variantlar:**
- A) Ha, oylik → haftalik bo'lib beriladi (har hafta aniq topshiriq)
- B) Faqat oylik daraja qoladi (sodda)
- C) Keyin — hozir kerak emas

### Q19. Taktik vazifa kim bilan bog'lansin
**Nima:** Har taktik vazifa qaysi karta (lavozim) yoki bo'limga biriktirilishi.
**Nega kerak:** Vazifa "egasiz" qolmasin — kim mas'ul ekani aniq bo'lsa, bajariladi va kuzatiladi.
**Variantlar:**
- A) Har vazifa kartaga (lavozimga) biriktiriladi — bajaruvchi va kuzatuv aniq
- B) Faqat bo'limga biriktiriladi (kengroq, lekin shaxsiy mas'uliyat yumshoq)
- C) Keyin — hozir kerak emas

### Q20. Statistika reglamenti (Stat-reglament) — bo'lishi kerakmi
**Nima:** Har bir ko'rsatkichning rasmiy ta'rifini bitta joyda saqlovchi ro'yxat: tarif (ta'rif), formula, o'lchov birligi, qanchalik tez o'lchanadi, kim mas'ul.
**Nega kerak:** Hozir tizimda bu YO'Q. Busiz har kim raqamni har xil tushunadi — "bajarilish" deganda kim nimani nazarda tutadi noma'lum. Reglament bo'lsa — bitta haqiqat.
**Variantlar:**
- A) Ha, to'liq stat-reglament — har ko'rsatkich uchun ta'rif/formula/birlik/chastota/egasi (chalkashlik yo'qoladi)
- B) Soddalashtirilgan — faqat ta'rif va formula (asosiy, lekin chala)
- C) Keyin — hozir kerak emas

### Q21. Stat-reglamentda chastota (qanchalik tez o'lchanadi)
**Nima:** Har ko'rsatkich kunlik, haftalik yoki oylik o'lchanishini belgilash.
**Nega kerak:** Ba'zi raqamlar har kun (pul), ba'zilari oyda bir (foyda) o'lchanadi — bu aniq bo'lsa, tizim qachon yangilashni biladi.
**Variantlar:**
- A) Har ko'rsatkichga alohida chastota belgilanadi (kunlik/haftalik/oylik) — moslashuvchan
- B) Hammasi haftalik o'lchanadi (sodda, lekin qo'pol)
- C) Keyin — hozir kerak emas

### Q22. Stat-reglament versiyalari
**Nima:** Ko'rsatkich formulasi o'zgarsa, eski versiyani saqlab, "qachondan boshlab yangi formula" ekanini belgilash.
**Nega kerak:** Formula o'zgarganda eski hisobotlar buzilmasin — qaysi davrda qaysi formula ishlaganini bilish kerak.
**Variantlar:**
- A) Ha, har o'zgarish yangi versiya bo'ladi + amal qilish sanasi (eski hisobot to'g'ri qoladi)
- B) Faqat oxirgi formula saqlanadi (sodda, lekin tarix yo'qoladi)
- C) Keyin — hozir kerak emas

### Q23. Stat-reglament ko'rsatkichlarining egasi (mas'uli)
**Nima:** Har ko'rsatkich uchun "bu raqamning to'g'riligiga kim javob beradi" ni belgilash — odam yoki karta (lavozim).
**Nega kerak:** Raqam noto'g'ri bo'lsa, kim tuzatishini biladi — egasiz raqam ishonchsiz.
**Variantlar:**
- A) Har ko'rsatkich kartaga (lavozimga) biriktiriladi — odam ketsa ham egasi qoladi (karta-model)
- B) Aniq xodimga biriktiriladi (sodda, lekin xodim ketsa egasi yo'qoladi)
- C) Keyin — hozir kerak emas

### Q24. Holat formulasi karta-model bilan bog'lansinmi
**Nima:** Kompaniya holatini hisoblashda har bo'lim/kartaning o'z holati (KPI bajarilishi) hissa qo'shishi.
**Nega kerak:** Karta-model — sizning asosiy vizyoningiz. Holat pastdan (kartalardan) yig'ilsa, qaysi lavozim kompaniyani pasaytirayotgani ko'rinadi.
**Variantlar:**
- A) Ha, holat kartalardan yig'iladi — "qaysi lavozim sabab" darrov ochiladi (oltin ip)
- B) Yo'q, holat faqat umumiy raqamlardan (sodda, lekin sababi ko'rinmaydi)
- C) Keyin — hozir kerak emas

### Q25. Director dashboard — boshliq ekranida nima ko'rinadi
**Nima:** Boshliq tizimga kirganda birinchi ko'radigan ekranda qaysi ma'lumotlar bo'lishi.
**Nega kerak:** Boshliqning vaqti qimmat — eng muhim 4-5 narsa bir ekranda bo'lsa, qolganini qidirmasdan qaror qabul qiladi.
**Variantlar:**
- A) Holat + ideal kartina farqi + bugungi muammolar + alertlar bir ekranda (to'liq qo'mondonlik markazi)
- B) Faqat holat va asosiy moliya raqamlari (sodda)
- C) Keyin — hozir kerak emas

### Q26. Strategik AI tahlilchi
**Nima:** Tizim ma'lumotlarni o'qib, boshliqqa o'zbek tilida tahlil va tavsiya beruvchi AI ("pul oqimi 3 hafta ichida XAVFga tushishi mumkin, sababi...").
**Nega kerak:** Raqamlarni o'qish vaqt oladi — AI darrov "nimaga e'tibor bering" deb aytsa, boshliq tez harakat qiladi.
**Variantlar:**
- A) Ha, AI har kuni qisqa tahlil + 1-2 tavsiya beradi (boshliqning maslahatchisi)
- B) AI faqat so'ralganda javob beradi (sodda)
- C) Keyin — hozir kerak emas

### Q27. Holat va kundalik Telegram bot orqali
**Nima:** Boshliq Telegramda buyruq yozib (masalan /holat, /kundalik) kompaniya holatini va kundalikni ko'rishi/to'ldirishi.
**Nega kerak:** Boshliq har doim kompyuter oldida bo'lmaydi — telefondan Telegram orqali tez qaraydi.
**Variantlar:**
- A) Ha, /holat /kundalik /ideal_rasm buyruqlari + kunlik digest (telefondan hammasi)
- B) Faqat eslatma/digest yuboriladi, buyruq yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q28. Kunlik boshliq digesti (ertalabki xulosa)
**Nima:** Har ertalab boshliqqa bitta qisqa xabar: bugungi holat, kechagi yopilmagan muammolar, bugungi top vazifalar.
**Nega kerak:** Boshliq kunni tayyor manzara bilan boshlaydi — hech narsa qidirib o'tirmaydi.
**Variantlar:**
- A) Ha, har ertalab avtomatik digest (Telegram + tizim) — kun tayyor boshlanadi
- B) Faqat tizim ichida ko'rinadi, alohida xabar yo'q (sodda)
- C) Keyin — hozir kerak emas

### Q29. Holat darajalari ro'yxatini sozlash (master-data)
**Nima:** Holat nomlari va ranglarini (OSISH=yashil, NORMAL=ko'k, EHTIYOT=sariq, XAVF=to'q sariq, INQIROZ=qizil) belgilash.
**Nega kerak:** Boshliq tushunadigan til va ranglar bo'lsa — bir qarashda holat aniq.
**Variantlar:**
- A) 5 daraja + rang (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) — ShVB modeliga mos
- B) 3 daraja (Yaxshi/O'rta/Yomon) — soddaroq
- C) Keyin — hozir kerak emas

### Q30. Strategiya yutuqlarini umumiy ko'rsatish
**Nima:** Strategik maqsad bajarilganda yoki muhim natijaga yetilganda buni alohida belgilab, hammaga ko'rsatish.
**Nega kerak:** Yutuqni nishonlash jamoani rag'batlantiradi va "biz qayerga yetdik" tarixini saqlaydi.
**Variantlar:**
- A) Ha, yetilgan maqsadlar "bajarildi" deb belgilanadi + tarix saqlanadi (motivatsiya + tarix)
- B) Faqat foiz ko'rsatiladi, alohida nishonlash yo'q (sodda)
- C) Keyin — hozir kerak emas
