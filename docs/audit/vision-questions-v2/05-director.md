# Director / Strategiya — YANGI (kitob-grounded) savollar

> Manba: `docs/audit/kitob-extracted/RD5__*.md` (real 2020 fabrika hujjatlari — "Лавозим йўриқномаси",
> "Назорат варақаси", глоссарий) + Excel statistika fayllari (`25-04.xlsx`, `Bandlik.xlsx`,
> `Iyun ishchilar.xlsx`, `ketgan kun.xlsx`, `Kichik buyurtmalar.xlsx`).
> Bu savollar `vision-questions/05-director.md` dagi 628 ta savolni TAKRORLAMAYDI — ular holat-formula,
> dnevnik, ideal-kartina, OKR, stat-reglament asoslarini qamragan. Quyidagilar fabrika hujjatining
> AYNAN tuzilmasiga (ЦКП, продукт 1-4, оргсхема 5-департамент, Назорат варақаси, A-System) bog'langan.

---

### Q1. Har lavozim "Лавозим мақсади" maydonini ERP saqlaydimi
**Nima:** Fabrika yo'riqnomasidagi "Лавозимнинг мақсади" (masalan ички логистика: "ишлаб чиқариш жараёнларини узлуксиз таъминлаш...") har kartaga matn maydon sifatida kiritilsinmi.
**Nega kerak:** Holat va ЦКП shu maqsaddan kelib chiqadi; maqsadsiz karta "to'g'ri ish ta'rifi" bo'lolmaydi.
**Variantlar:**
- A) Ha, har kartada majburiy `position_purpose` matn maydoni — yo'riqnomadan ko'chiriladi (vizyonga to'liq mos)
- B) Faqat bo'lim darajasida maqsad, lavozimda yo'q — soddaroq, lekin karta-markaz buziladi
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR karta-model, AI baholash (xodim↔karta mosligi maqsaddan o'lchanadi)

### Q2. ЦКП (Лавозимнинг ЦКП си) har kartaning asosiy chiqishimi
**Nima:** Yo'riqnomadagi "Лавозимнинг ЦКП си" (ички логистика: "Ишлаб чиқариш учун тайёр ҳолатга келтирилган ярим тайёр маҳсулотлар") ERP da har kartaga bog'lansinmi.
**Nega kerak:** ЦКП — bu lavozimning yakuniy mahsuloti; statistika va holat shuni o'lchashi kerak.
**Variantlar:**
- A) Ha, har kartada `ckp` maydoni + holat formulasi ЦКП bajarilishiga bog'lanadi (ShVB modeli)
- B) ЦКП faqat hujjatda qoladi, ERP o'lchamaydi — sodda, lekin "produkt o'lchovi" yo'qoladi
- C) Keyin — hozir kerak emas

### Q3. Yo'riqnomadagi "1-4 продукт" bo'sh maydonlari nima
**Nima:** Har yo'riqnomada "X бўлими бошлиғининг 1-/2-/3-/4-продукти:" bo'sh qoldirilgan — bular ERP da to'ldirilishi kerakmi.
**Nega kerak:** Owner hujjatda 4 ta produkt slot qoldirgan — demak har lavozim 4 ta o'lchanadigan mahsulot berishi rejalashtirilgan.
**Variantlar:**
- A) Ha, har kartada 1-4 produkt + har biriga statistika ko'rsatkichi (ЦКП ni 4 o'lchovga bo'lish)
- B) Faqat 1 ta asosiy produkt (ЦКП) — qolgan 3 bo'sh qoladi
- C) Keyin — hozir kerak emas
  ↳ Agar A: produktlar soni lavozimga qarab har xilmi (2-4) yoki qat'iy 4 tami? — A) moslashuvchan B) qat'iy 4

### Q4. Оргсхема joylashuvi "5-Департамент, 13-бўлим, Секция" formatida saqlansinmi
**Nima:** Yo'riqnoma "Оргсхемадаги жойлашуви: 5-Департамент, 13-бўлим, Секция внутренней логистики" deb yozadi — ERP shu 3 darajali kodni saqlasinmi.
**Nega kerak:** Bu Vysotskiy-7 daraxti bilan ulanadi; raqamli kod (5/13/секция) navigatsiya va hisobot uchun ishlatiladi.
**Variantlar:**
- A) Ha, `department_no` + `unit_no` + `section_name` 3 maydon — hujjat formatiga aynan mos
- B) Faqat erkin matn "joylashuv" — sodda, lekin filtr/agregatsiya qiyin
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Org-struktura (Vysotskiy-7), vertikal manager_id zanjiri

### Q5. Director hujjatda "5-Департамент" ichida 5 ta bo'lim borligini ko'rsatadi
**Nima:** Hujjatdagi javob varianti "5-Департамент (сифат назорати, режалаштириш, дизайн, конструктор ва бошқа бўлимлар)" — director dashboard shu 5 bo'limni alohida ko'rsatsinmi.
**Nega kerak:** Owner 5-departamentni eng murakkab (5 bo'lim) deb belgilagan — director uchun bu eng ko'p e'tibor talab qiladigan zona.
**Variantlar:**
- A) Ha, 5-departament alohida drill-down: 5 bo'lim har biri o'z holati bilan (real struktura)
- B) Departament yagona ko'rsatkich sifatida — sodda
- C) Keyin — hozir kerak emas

### Q6. Statistik ko'rsatkich "режа бажарилиш даражаси (%)" — director uchun bosh KPI
**Nima:** Har yo'riqnomada birinchi stat-ko'rsatkich "...режа бажарилиш даражаси (%)" — bu director dashboardning markaziy raqami bo'lsinmi.
**Nega kerak:** Bu butun fabrika bo'ylab takrorlanadigan yagona umumiy o'lchov — director uni agregat ko'rishi kerak.
**Variantlar:**
- A) Ha, "Reja bajarilish %" fabrika bo'ylab agregat + har bo'lim breakdown (yo'riqnoma metrikasiga mos)
- B) Faqat ishlab chiqarish reja %, boshqa bo'limlar alohida — qisman
- C) Keyin — hozir kerak emas

### Q7. "Кечикишлар сони" va "режадан оғиш ҳолатлари сони" — alohida hisoblansinmi
**Nima:** Yo'riqnoma 2 ta nozik ko'rsatkichni ajratadi: "...сабабли юзага келган кечикишлар сони" va "Режадан оғиш ҳолатлари сони".
**Nega kerak:** Kechikish (oqibat) va rejadan og'ish (sabab) — har xil narsa; ikkalasini ajratish ildiz-sababni ko'rsatadi.
**Variantlar:**
- A) Ha, 2 alohida counter: `delay_count` + `plan_deviation_count` har bo'lim uchun (sabab/oqibat ajratiladi)
- B) Yagona "muammo soni" — sodda, lekin tahlil qashshoq
- C) Keyin — hozir kerak emas
  ↳ Agar A: rejadan og'ish qayd qilinganda sabab kategoriyasi (material/transport/operator/...) tanlansinmi? — A) majburiy sabab B) ixtiyoriy

### Q8. "Бекор туриш" (downtime) fabrika lug'atidagi rasmiy atama — director kuzatsinmi
**Nima:** Glossariy "Бекор туриш — иш вақти давом этаётган бўлса-да, ...ишлаб чиқариш жараёнининг вақтинча тўхтаб қолиши" deb ta'riflaydi. Director bu bekor turishlarni umumiy soat/miqdorda ko'rsinmi.
**Nega kerak:** Owner bekor turishni alohida atama qilib belgilagan — bu fabrikaning eng katta yo'qotish manbai.
**Variantlar:**
- A) Ha, "Bekor turish (downtime)" director dashboardda soat + sabab bo'yicha (yo'riqnoma atamasiga mos)
- B) Faqat MES da, director ko'rmaydi — qisman
- C) Keyin — hozir kerak emas

### Q9. A-System (eski tizim) bilan EuroPrint ERP qanday bog'lanadi
**Nima:** Glossariy "A-System — ишлаб чиқариш, режа, ҳисоб-китоб ва факт маълумотларини юритиш учун" deydi. EuroPrint A-System o'rnini bosadimi yoki u bilan ishlaydimi.
**Nega kerak:** Xodimlar A-System ga o'rgangan; ko'chish strategiyasi director qarori.
**Variantlar:**
- A) EuroPrint A-System ni TO'LIQ o'rnini bosadi — eski tizim arxivga (yagona haqiqat manbai)
- B) Vaqtincha parallel — A-System dan import, asta ko'chish (xavfsiz, lekin 2 tizim)
- C) Keyin — hozir kerak emas

### Q10. "1 суткалик ишлаб чиқариш режаси" — kunlik 24-soatlik reja ob'ekti bo'lsinmi
**Nima:** Glossariy "1 суткалик ишлаб чиқариш режаси — ...кейинги 24 соатлик режасини белгилаб берувчи ҳужжат" deb belgilaydi. ERP da bu kunlik reja rasmiy ob'ektmi.
**Nega kerak:** Butun logistika va statistika shu kunlik rejaga bog'langan — director uning bajarilishini kuzatadi.
**Variantlar:**
- A) Ha, "Sutkalik reja" alohida ob'ekt (har kuni tuziladi) + bajarilish % director da (yo'riqnomaga mos)
- B) Faqat haftalik/oylik reja, kunlik yo'q — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (PP), MES, ichki logistika

### Q11. "Кўп учрайдиган хатолар" ro'yxati AI risk-reyestriga aylansinmi
**Nima:** Har yo'riqnomada 7-8 ta "Кўп учрайдиган хатолар" sanab o'tilgan (masalan "Ишлаб чиқариш режасини ўз вақтида қабул қилмаслик", "Бўлимлар билан етарли алоқа қилмаслik"). Bu ro'yxat ERP da risk-reyestr bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun tipik xatolarni allaqachon yozgan — AI shularni avtomatik kuzatib ogohlantirishi mumkin.
**Variantlar:**
- A) Ha, har kartada "tipik xatolar" ro'yxati + AI har birini real-time tekshiradi (xato yuz bersa alert)
- B) Faqat ko'rsatma sifatida ko'rsatiladi, AI tekshirmaydi — sodda
- C) Keyin — hozir kerak emas

### Q12. "Муваффақиятли ҳаракатлар" ro'yxati ideal-kartina manbai bo'lsinmi
**Nima:** Yo'riqnoma "Муваффақиятли ҳаракатлар" ni sanaydi (masalan "Ишлаб чиқариш режасини олдиндан қабул қилиш", "Ҳисоботларни ўз вақтида тайёрлаш"). Bu ideal xulq-namuna ERP da ko'rinsinmi.
**Nega kerak:** Owner har lavozim uchun "to'g'ri ishlash modeli"ni yozib qo'ygan — bu kartaning ideal kartinasidir.
**Variantlar:**
- A) Ha, har kartada "muvaffaqiyatli harakatlar" = ideal model + AI xodimni shu modelga qarab baholaydi
- B) Faqat o'quv materialida ko'rsatiladi — qisman
- C) Keyin — hozir kerak emas

### Q13. "Жавобгарликлари" — moddiy/maънавий javobgarlik darajalari saqlansinmi
**Nima:** Yo'riqnoma javobgarlikni sanaydi va "...ҳам моддий ҳам маънавий томонидан жавобгар... меҳнат, фуқаролик ва жиноят кодексларига кўра" deb yozadi. ERP javobgarlik turini saqlasinmi.
**Nega kerak:** Har lavozim qaysi sohada javobgar ekani aniq belgilangan — bu nizo/jazo holatlarida asos.
**Variantlar:**
- A) Ha, har kartada "javobgarlik bandlari" + sodir bo'lganda HR voqeasiga bog'lanadi (hujjatga mos)
- B) Faqat matn sifatida saqlanadi — sodda
- C) Keyin — hozir kerak emas

### Q14. "Тижорат сирларини ошкор этиш" javobgarligini tizim kuzatsinmi
**Nima:** Yo'riqnoma "Корхона тижорат сирларини ошкор этганлик учун Ўзб.Рес жиноят кодексига кўра жавобгар" deydi. Maxfiy ma'lumotga kirishni director ko'rsinmi.
**Nega kerak:** Owner tijorat siri masalasini har lavozim hujjatiga qo'shgan — maxfiylik audit izi muhim.
**Variantlar:**
- A) Ha, maxfiy ma'lumot (narx, mijoz, formula) kirishi audit-log + director ko'radi (sir himoyasi)
- B) Faqat ruxsat darajasi cheklaydi, alohida log yo'q — qisman
- C) Keyin — hozir kerak emas

### Q15. "Энергия ресурслари тежалиши (сув, газ, свет)" — director ko'rsatkichimi
**Nima:** Yo'riqnoma javobgarlik sifatida "Энергия ресурсларни тежалиши учун. (сув, газ свет)" deb yozadi. ERP energiya sarfini kuzatsinmi.
**Nega kerak:** Owner energiya tejamkorligini rasmiy javobgarlik qilgan — bu xarajat va ekologik ko'rsatkich.
**Variantlar:**
- A) Ha, suv/gaz/elektr oylik sarfi director dashboardda (manual kiritish yoki schyotchik) + trend
- B) Faqat moliya xarajatida ko'rinadi, alohida emas — qisman
- C) Keyin — hozir kerak emas

### Q16. "Турникет" (kirish-chiqish) ma'lumoti davomat statistikasiga ulansinmi
**Nima:** Glossariy "Турникет — кириш-чиқишни назорат қиладиган электрон тизим... махсус карточка орқали" deydi. ERP turniketdan davomat olsinmi.
**Nega kerak:** Owner turniket kartasini har yo'riqnomaga qo'shgan (muvaffaqiyatli harakat) — davomat real vaqtda kelishi mumkin.
**Variantlar:**
- A) Ha, turniket → davomat integratsiyasi (kirish/chiqish vaqti avtomatik) + director kech kelish statistikasi
- B) Davomat qo'lda kiritiladi — sodda, lekin xato ko'p
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR davomat, ish haqi (kun normasi)

### Q17. "Назорат варақаси" (control sheet) — har karta uchun o'quv jarayoni ob'ektimi
**Nima:** Har lavozimda alohida "НАЗОРАТ ВАРАҚАСИ" hujjati bor — "ходим томонидан ўқилиши, тушунилиши ва амалда қўлланилиши шарт бўлган... мавзулар рўйхати". ERP da bu o'quv-nazorat varaqasi bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun mavzular ketma-ketligini va "o'qib chiqdim" tasdig'ini hujjatlashtirgan — bu darslik-kartaga bog'lanish.
**Variantlar:**
- A) Ha, har kartada "Nazorat varaqasi" = mavzular + xodim "tasdiqladim" qadamlari (vizyon: darslik kartaga)
- B) Faqat umumiy LMS kurs — karta bilan bog'lanmaydi (qisman)
- C) Keyin — hozir kerak emas

### Q18. Nazorat varaqasidagi "тасдиқлайман" qadamlari (тема-тема) kuzatilsinmi
**Nima:** Nazorat varaqasi har mavzu uchun "...вазифасини ўқиб чиққанингизни тасдиқланг" qadamini talab qiladi. ERP bu tasdiqlarni qayd qilsinmi.
**Nega kerak:** Owner xodim har mavzuni o'qiganini bittalab tasdiqlashini xohlaydi — bu mas'uliyat izi.
**Variantlar:**
- A) Ha, har mavzu "o'qildi/tushundim" checkbox + sana + xodim imzosi (raqamli) — hujjatga aynan mos
- B) Faqat butun kurs oxirida bitta tasdiq — sodda
- C) Keyin — hozir kerak emas

### Q19. Nazorat varaqasidagi senariy-savollar (A/B/D) AI imtihon bo'lsinmi
**Nima:** Hujjatda amaliy senariy savollar bor (masalan "...қоғоз тури режага мос келмаётганини аниқладингиз. Нима қиласиз? A)... B)... D)..."). Bu ERP da AI imtihon savollari bo'lsinmi.
**Nega kerak:** Owner har lavozim uchun to'g'ri-noto'g'ri qaror senariylarini yozib qo'ygan — AI shu bilan xodimni sinaydi.
**Variantlar:**
- A) Ha, senariy savollar = karta AI imtihoni (B/to'g'ri javob ball beradi) — vizyonga mos (karta o'z AI'si)
- B) Faqat statik test (avtomatik baholanmaydi) — qisman
- C) Keyin — hozir kerak emas

### Q20. Yo'riqnomani "ТАСДИҚЛАЙМАН директор Позилов А.А." imzosi — versiya nazorati
**Nima:** Har hujjat "ТАСДИҚЛАЙМАН EUROPRINT KOKAND директори Позилов А.А." bilan boshlanadi va sana qoldirilgan. ERP da yo'riqnoma versiyasi/tasdiqlash sanasini saqlasinmi.
**Nega kerak:** Yo'riqnoma rasmiy hujjat — kim, qachon tasdiqlaganini bilish kerak (audit, mehnat nizosi).
**Variantlar:**
- A) Ha, har karta yo'riqnomasi versiyalanadi: tasdiqlovchi + sana + "tanishdim" imzo (rasmiy hujjat oqimi)
- B) Faqat oxirgi versiya, tarix yo'q — sodda
- C) Keyin — hozir kerak emas

### Q21. "Малака талаблари" (2-3 yil tajriba, o'rta-maxsus) — kartaga talab maydonimi
**Nima:** Yo'riqnoma "...камида 2–3 йил ишлаб чиқариш... тажрибага эга бўлиши" kabi malaka talablarini sanaydi. ERP xodim-karta mosligini shu talabga qarab tekshirsinmi.
**Nega kerak:** Vizyon: kartaga xodim qidiriladi; AI moslikni malaka talabidan o'lchaydi.
**Variantlar:**
- A) Ha, har kartada malaka talablari (ta'lim, tajriba yili, ko'nikma) + AI nomzodni shu bo'yicha baholaydi
- B) Faqat lavozim e'loni uchun matn — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR recruitment, AI xodim-karta moslik bahosi

### Q22. "Лавозим воситалари" (A-System, hisobot shakllari, tex karta) kartaga biriktirilsinmi
**Nima:** Yo'riqnoma "Иш жойи ва лавозим воситалари" ni sanaydi: A-System, iш режалари, ҳисобот шакллари, tex karta. ERP har kartaga kerakli vositalarni bog'lasinmi.
**Nega kerak:** Vizyon "kerakli jihozlar/vositalar modeli hali YO'Q" deb belgilangan — bu hujjatda allaqachon ro'yxat bor.
**Variantlar:**
- A) Ha, har kartada "kerakli vositalar/dasturlar/hujjatlar" ro'yxati (hujjatga mos) + yetishmasa flag
- B) Faqat umumiy "jihozlar" matni — sodda
- C) Keyin — hozir kerak emas

### Q23. Excel "режа бажарилиш %" har bo'lim uchun (25-04.xlsx ustunlari) director da
**Nima:** `25-04.xlsx` da har operatsiya uchun "План выработ / Факт выработ / Остал" ustunlari bor. Director shu reja/fakt taqqoslashni jonli ko'rsinmi.
**Nega kerak:** Owner allaqachon reja/fakt/qoldiq jadvalini Excelда yuritgan — ERP shuni jonli qilishi kerak.
**Variantlar:**
- A) Ha, har operatsiya/bo'lim "Reja / Fakt / Qoldiq" director real-time (Excel ustunlariga mos)
- B) Faqat kunlik umumiy reja/fakt — qisman
- C) Keyin — hozir kerak emas

### Q24. "Зарур заказлар" (ustuvor buyurtmalar) navbati director da ko'rinsinmi
**Nima:** `25-04.xlsx` da "ЗАРУР ЗАКАЗЛАР" (ustuvor buyurtmalar) va "Очред / Очред2" (navbat) ustunlari bor. ERP ustuvor navbatni director ga ko'rsatsinmi.
**Nega kerak:** Owner qaysi buyurtma "zarur" ekanini qo'lda belgilagan — bu director'ning ustuvorlik qaroriga ta'sir qiladi.
**Variantlar:**
- A) Ha, buyurtmaga "zarur/ustuvor" flag + navbat tartibi director ko'radi va o'zgartira oladi (Excel mantig'iga mos)
- B) Navbat faqat avtomatik (sana bo'yicha), qo'lda ustuvorlik yo'q — qisman
- C) Keyin — hozir kerak emas

### Q25. "Брак сони" (brak miqdori) — director sifat-yo'qotish ko'rsatkichimi
**Nima:** `25-04.xlsx` har operatsiyada "Брак сони" ustuniga ega. Director brak (sifatsiz) miqdorini fabrika bo'ylab ko'rsinmi.
**Nega kerak:** Brak = bevosita pul yo'qotish; owner uni har operatsiyada qayd qilgan.
**Variantlar:**
- A) Ha, "Brak soni/%" director dashboardda (operatsiya/bo'lim/material bo'yicha) + trend (Excel ustuniga mos)
- B) Faqat QC modulida, director umumiy ko'radi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: QC (sifat nazorati), Moliya (yo'qotish)

### Q26. "Длительность / Начат / Завершит" — operatsiya davomiyligi director da
**Nima:** `25-04.xlsx` "Длительность, Начат, Завершит, Бошлаш вакти, тугатиш вакти" ustunlari operatsiya vaqtini yozadi. ERP real vs reja davomiylikni director ga ko'rsatsinmi.
**Nega kerak:** Owner har operatsiya boshlanish/tugash vaqtini kuzatgan — vaqt og'ishi samaradorlik ko'rsatkichi.
**Variantlar:**
- A) Ha, "Rejalashtirilgan davomiylik vs Fakt davomiylik" director da (Excel ustunlariga mos) + og'ish %
- B) Faqat tugash sanasi (vaqt yo'q) — sodda
- C) Keyin — hozir kerak emas

### Q27. "Ден / Ноч" (kunduzgi/tungi smena) bo'yicha statistika ajratilsinmi
**Nima:** `25-04.xlsx` da "ден / ноч" (kunduz/tun) va "смена" ustunlari bor. Director smena bo'yicha samaradorlikni taqqoslasinmi.
**Nega kerak:** Owner 2 smenani ajratib yozgan — qaysi smena yaxshi ishlashi muhim qaror.
**Variantlar:**
- A) Ha, kunduzgi/tungi smena holati + reja% alohida director da (Excel ustuniga mos)
- B) Smena ajratilmaydi, kunlik umumiy — sodda
- C) Keyin — hozir kerak emas

### Q28. Ishchi normasi "%" (Iyun ishchilar.xlsx) — director mehnat-samaradorlik paneli
**Nima:** `Iyun ishchilar.xlsx` da "Норма, Оylik %, Ishlagan kuniga %, Jami kunlik %" har ishchi uchun hisoblangan. Director mehnat normasi bajarilishini ko'rsinmi.
**Nega kerak:** Owner har ishchining normaga nisbatan % ini Excelда yuritadi — bu ish haqi va samaradorlik asosi.
**Variantlar:**
- A) Ha, har ishchi "Norma %, Oylik %, Ishlagan kuniga %" director/HR da (Excel formulalariga mos)
- B) Faqat bo'lim o'rtacha % — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: HR, ish haqi (razryad→talab→o'sish→oylik)

### Q29. Operatsiya turlari bo'yicha norma (avtokley, GTO, kley, oynakcha, rezka...) saqlansinmi
**Nima:** `Iyun ishchilar.xlsx` operatsiya turlarini sanaydi: avtokley, GTO, kley, oynakcha, paypoq, rezka, samokley, skleyka, tigel, yoni, laminatsiya, oddiy lak, vib.lak. Har tur uchun norma director da bo'lsinmi.
**Nega kerak:** Owner har operatsiya turi uchun alohida norma yuritadi — bu narx va samaradorlik asosi.
**Variantlar:**
- A) Ha, har operatsiya turi uchun norma + fakt + % director da (Excel ro'yxatiga aynan mos)
- B) Faqat umumiy ishlab chiqarish normasi — qisman
- C) Keyin — hozir kerak emas

### Q30. "Oddiy lak" va "Vib lak" alohida norma — director taqqoslasinmi
**Nima:** `Iyun ishchilar.xlsx` "Oddiy lak" va "Vib lak" ni alohida norma/% bilan yuritadi. Director bu ikki lakni ajratib ko'rsinmi.
**Nega kerak:** Owner ikki xil lak operatsiyasini ajratgan — har biri har xil hosildorlik beradi.
**Variantlar:**
- A) Ha, oddiy lak / vib lak alohida norma+% (Excel ustunlariga mos)
- B) Yagona "laklash" operatsiyasi — sodda
- C) Keyin — hozir kerak emas

### Q31. Bandlik.xlsx — operatsiyaga ketadigan minut/soat/kun (pragon) director da
**Nima:** `Bandlik.xlsx` har operatsiya uchun "Min, Buyurtma uchun ketadigan min, Ketadigan Soat, Ketadigan Kun, Умумий прагон, Бўлимлар прагони" hisoblaydi. Director bu yuklamani (loading) ko'rsinmi.
**Nega kerak:** Owner har bo'lim "pragon" (umumiy yuk) ni hisoblaydi — bu sig'im rejalashtirish (CRP) asosi.
**Variantlar:**
- A) Ha, "Bo'limlar yuklamasi (pragon) — min/soat/kun" director da (Excel formulasiga mos)
- B) Faqat umumiy fabrika yuklamasi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (CRP), MES sig'im

### Q32. "Buyurtma tayyorligi %" har buyurtma uchun director progress paneli
**Nima:** `Bandlik.xlsx` va `ketgan kun.xlsx` "Буюртма тайёрлиги %", "Бўлим сони", "Бўлимлар сони" bilan har buyurtmaning bajarilish darajasini ko'rsatadi. Director buyurtma-progress ko'rsinmi.
**Nega kerak:** Owner har buyurtma necha % tayyor va necha bo'limdan o'tganini kuzatadi.
**Variantlar:**
- A) Ha, har buyurtma "tayyorligi % + qaysi bo'limda" director da (Excel ustuniga mos)
- B) Faqat tugadi/tugamadi (foiz yo'q) — sodda
- C) Keyin — hozir kerak emas

### Q33. "Ishlab chiqarishga ketgan kun / qolgan kun" — buyurtma yetkazish trendmi
**Nima:** `ketgan kun.xlsx` "Ишлаб чиқаришга кетган вақт (кун)", "...қолган вақт (кун)", "Бошланган сана", "Тайёр бўлган сана" yuritadi. Director har buyurtma sikl-vaqtini ko'rsinmi.
**Nega kerak:** Owner buyurtma boshlanishidan tugashigacha necha kun ketganini hisoblaydi — yetkazish va'da nazorati.
**Variantlar:**
- A) Ha, buyurtma "sikl vaqti (kun) — reja vs fakt" director da + kechikkanlar (Excel ustuniga mos)
- B) Faqat tayyor bo'lgan sana — qisman
- C) Keyin — hozir kerak emas

### Q34. "Прокатка / приладка вақти (соат)" — sozlash vaqti yo'qotishi director da
**Nima:** `ketgan kun.xlsx` "Приладка учун кетган вақт (соат)" ustuniga ega. Director mashina sozlash (setup) vaqtini ko'rsinmi.
**Nega kerak:** Owner priladka (sozlash) vaqtini alohida hisoblaydi — bu yashirin yo'qotish va kichik buyurtma muammosi bilan bog'liq.
**Variantlar:**
- A) Ha, "Priladka/setup vaqti (soat)" director da operatsiya/buyurtma bo'yicha (Excel ustuniga mos)
- B) Davomiylik ichida yashirin qoladi — qisman
- C) Keyin — hozir kerak emas
  ↳ Agar A: kichik buyurtmalarda setup nisbati yuqori — director ularni alohida belgilasinmi?

### Q35. Kichik buyurtmalar tahlili (Kichik buyurtmalar.xlsx) — strategik foyda paneli
**Nima:** `Kichik buyurtmalar.xlsx` "Кичиклашган %, Фойда дона, Фойда кг, Размер эски/янги, Ишлаган кг" bilan kichraygan buyurtmalar foydasini tahlil qiladi. Director bu tahlilni ko'rsinmi.
**Nega kerak:** Owner (M.Nosirov tayyorlagan) kichik buyurtmalar zarar keltirayotganini hisoblagan — bu strategik narx qaror.
**Variantlar:**
- A) Ha, "Kichik buyurtmalar — kichiklashish %, dona/kg foyda" strategik panel director da (Excel hisobiga mos)
- B) Faqat umumiy buyurtma foydasi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: SD (savdo narx), Moliya (foyda marjasi)

### Q36. "Razmer eski → yangi" optimizatsiyasi director tavsiyasiga aylansinmi
**Nima:** `Kichik buyurtmalar.xlsx` "Размер эски (42x58) → янги (40x58)" qog'oz formati optimizatsiyasini ko'rsatadi. AI/director bunday format-tejash imkonini avtomatik topsinmi.
**Nega kerak:** Owner qog'oz formatini kichraytirib kg-foydani oshirgan — AI shunday tavsiyalarni o'zi berishi mumkin.
**Variantlar:**
- A) Ha, AI strategik tahlilchi "format optimizatsiyasi" tavsiyasini avtomatik beradi (Excel mantig'iga mos)
- B) Faqat qo'lda tahlil — sodda
- C) Keyin — hozir kerak emas

### Q37. Buyurtma kodi formati (2024-0499, KT/PT/E + raqam) director qidiruvida
**Nima:** Excel buyurtmalar "2024-0499 ... /16370/KT4195/" kabi kodlanadi (papka raqami + KT/PT/E klishe kodi). ERP qidiruv shu real formatni qo'llab-quvvatlasinmi.
**Nega kerak:** Owner buyurtma/klishe kodlash tizimini yillar yuritgan — ERP shu kodlar bilan ishlashi shart.
**Variantlar:**
- A) Ha, buyurtma=`yil-raqam`, klishe=`KT/PT/E+raqam` rasmiy format + qidiruv (real kodlashga mos)
- B) Faqat ichki ID, eski kodlar alias — qisman
- C) Keyin — hozir kerak emas

### Q38. Director "departament bo'yicha" ham "operatsiya bo'yicha" ham ko'ra olsinmi (2 o'q)
**Nima:** Excel ma'lumotlari ham bo'lim/departament (vertikal), ham operatsiya turi (gorizontal) bo'yicha kesilgan. Director dashboard 2 o'qda filtrlanasinmi.
**Nega kerak:** Owner ham bo'limni, ham operatsiya turini alohida tahlil qiladi — ikki nuqtai-nazar kerak.
**Variantlar:**
- A) Ha, director 2 o'q: Departament (5/13/секция) ╳ Operatsiya turi — har ikkisi bo'yicha drill (real tahlilga mos)
- B) Faqat bo'lim bo'yicha — sodda
- C) Keyin — hozir kerak emas

### Q39. Statistik ko'rsatkich grafigi (Vysotskiy "статистика") — yuqoriga/pastga trend
**Nima:** Vizyon ShVB/Vysotskiy modeliga ko'ra har stat-ko'rsatkich vaqt grafigida (trend liniya) ko'rsatiladi. Director har ko'rsatkichni trend chiziq bilan ko'rsinmi.
**Nega kerak:** Vysotskiy statistikasida muhimi — son emas, balki yo'nalish (o'syaptimi/tushyaptimi).
**Variantlar:**
- A) Ha, har ko'rsatkich vaqt-trend grafigi (haftalik nuqta) + yo'nalish (o'sish/tushish) — Vysotskiy modeliga mos
- B) Faqat oxirgi qiymat (raqam) — sodda
- C) Keyin — hozir kerak emas

### Q40. Trend "yiqilish/o'sish holati" (condition) avtomatik aniqlansinmi
**Nima:** Vysotskiy modelida statistika trendiga qarab holat belgilanadi (Normal/Emergency/Danger/Power). Director har ko'rsatkich holatini avtomatik ko'rsinmi.
**Nega kerak:** Owner ShVB modeliga moyil — trenddan holat chiqarish boshqaruv tilining o'zagi.
**Variantlar:**
- A) Ha, trend qiyaligi → holat (masalan keskin tushish=Danger) avtomatik + chora-tadbir taklif
- B) Faqat trend ko'rsatiladi, holat qo'lda — qisman
- C) Keyin — hozir kerak emas

### Q41. Har ko'rsatkich uchun "mas'ul lavozim" (egasi) hujjatdan biriktirilsinmi
**Nima:** Yo'riqnoma har stat-ko'rsatkichni aniq lavozimga bog'laydi (masalan "режа бажарилиш %" → ички логистика бошлиғи). Director ko'rsatkich pasayganda mas'ulni ko'rsinmi.
**Nega kerak:** Owner har ko'rsatkichni egasiga bog'lagan — javobgarlik aniq bo'lishi kerak.
**Variantlar:**
- A) Ha, har ko'rsatkichda "mas'ul karta/lavozim" + pasayganda o'sha kartaga alert (hujjatga mos)
- B) Ko'rsatkich umumiy, mas'ul yo'q — sodda
- C) Keyin — hozir kerak emas

### Q42. "Ҳисоботларни ўз вақтида тайёрлаш" — hisobot-reglament director da kuzatilsinmi
**Nima:** Yo'riqnoma "Ҳисоботларни ўз вақтида тайёрлаш" ni muvaffaqiyatli harakat deb belgilaydi va "...белгиланган тартибда раҳбариятга тақдим этиш" majburiyatini qo'yadi. Director hisobot topshirildi/topshirilmadini kuzatsinmi.
**Nega kerak:** Owner har bo'lim director ga o'z vaqtida hisobot berishini talab qiladi — bu reglament.
**Variantlar:**
- A) Ha, har bo'lim "hisobot topshirildi/kechikdi" director da + eslatma (hujjatga mos)
- B) Hisobot qo'lda, kuzatuv yo'q — sodda
- C) Keyin — hozir kerak emas

### Q43. Director "real-time" yoki "kunlik kesim" ko'rsinmi
**Nima:** Excel ma'lumotlari kunlik/smenalik yuritiladi. Director dashboard real-time (jonli) bo'lsinmi yoki kunlik snapshot (соат N da muzlatilgan).
**Nega kerak:** Real-time ma'lumot to'liq bo'lmasligi mumkin (smena tugamagan); kunlik kesim aniqroq.
**Variantlar:**
- A) Real-time + kunlik snapshot ikkalasi (jonli kuzatuv + tugagan kun raqami) — to'liq
- B) Faqat kunlik snapshot (har kuni soat X da) — barqaror
- C) Keyin — hozir kerak emas

### Q44. Director og'ish yuz berganda "tomir-kesish" (root-cause) ko'rsinmi
**Nima:** Yo'riqnoma "...муаммоларни олдиндан аниқлаш ва бартараф этиш" ni talab qiladi. Director ko'rsatkich og'ganda sababga (logistika/material/operator) drill qila olsinmi.
**Nega kerak:** Owner sababni topishni qadrlaydi (verify-don't-trust, tomir-kesish madaniyati) — director shunga moslashishi kerak.
**Variantlar:**
- A) Ha, og'ishdan → sabab kategoriyasi → aniq buyurtma/operatsiya drill (root-cause zanjiri)
- B) Faqat og'ish ko'rsatiladi, sabab qo'lda topiladi — sodda
- C) Keyin — hozir kerak emas

### Q45. "Smena rejasi 2 xil buyurtma aralashib ketishi" — director konflikt alerti
**Nima:** Hujjat senariy beradi: "...икки хил буюртма... 5 қаватли гофра ва 3 қаватли гофра... қоғозларни аралаштириб юборилган". Director bunday material/buyurtma aralashish riskini ko'rsinmi.
**Nega kerak:** Owner bu xatoni real misol qilib yozgan — bu tipik va qimmat xato.
**Variantlar:**
- A) Ha, bir vaqtda o'xshash material talab qiladigan 2 buyurtma → "aralashish riski" alert (senariyga mos)
- B) Faqat tex-karta ko'rsatadi, alert yo'q — qisman
- C) Keyin — hozir kerak emas

### Q46. Director "Лавозим мақсади tushunilmadi" holatini ko'rsinmi (xato-tasnif)
**Nima:** Eng ko'p xato "Ишлаб чиқариш режасини ...тўлиқ тушунмаслик". Director qaror sifatini (lavozim maqsadiga mos/zid) tasniflasinmi.
**Nega kerak:** Owner xatolarning ko'pi "tushunmaslik"dan kelib chiqishini belgilagan — bu o'quv/AI sohasi.
**Variantlar:**
- A) Ha, AI xato sodir bo'lganda uni "tushunmaslik/e'tiborsizlik/qoidabuzarlik" deb tasniflaydi + o'quv tavsiya (hujjatga mos)
- B) Faqat xato qayd qilinadi, tasnif yo'q — sodda
- C) Keyin — hozir kerak emas

### Q47. "Чиқиндилар ва қолдиқлар" (chiqindi) chiqarilishi director ekologik ko'rsatkichmi
**Nima:** Yo'riqnoma "Ишлаб чиқаришдан чиққан чиқиндилар ва қолдиқларни ...ўз вақтида чиқарилишини ташкил этиш" ni talab qiladi. Director chiqindi/qoldiq miqdorini kuzatsinmi.
**Nega kerak:** Owner chiqindi boshqaruvini rasmiy vazifa qilgan; qoldiq (qog'oz) — qayta ishlash va xarajat manbai.
**Variantlar:**
- A) Ha, "Chiqindi/qoldiq miqdori (kg)" director da + qayta ishlash% (hujjatga mos)
- B) Faqat ombor qoldig'ida ko'rinadi — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Ombor (qoldiq karton rulon), Moliya (qayta sotish)

### Q48. Director "huquqlari" — ma'lumot so'rash huquqi ERP da aks etsinmi
**Nima:** Yo'riqnoma bo'lim boshlig'iga "...режалаштириш ва ишлаб чиқариш бўлимларидан иш режалари... талаб қилиш" huquqini beradi. ERP bo'limlararo ma'lumot so'rash oqimini qo'llab-quvvatlasinmi.
**Nega kerak:** Owner bo'limlararo ma'lumot talabini rasmiy huquq qilgan — bu gorizontal workflow.
**Variantlar:**
- A) Ha, "ma'lumot/reja so'rovi" bo'limlararo workflow (so'rov→javob izi) — huquqqa mos
- B) Faqat ko'rish ruxsati (so'rov oqimi yo'q) — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Coordination (gorizontal workflow_rules)

### Q49. Strategik tahlilchi AI "Лавозим мақсади amalga oshyaptimi" deb baholasinmi
**Nima:** Vizyon: har karta o'z AI'siga ega, xodim↔karta mosligini baholaydi va hisobot yozadi. Director uchun bu AI hisobotlari agregatlanadimi.
**Nega kerak:** Owner karta-AI larining o'zaro ishlashini xohlaydi — director eng yuqori agregat.
**Variantlar:**
- A) Ha, har karta-AI hisoboti → director uchun "qaysi lavozimlar maqsadga erishmayapti" agregat (vizyonga to'liq mos)
- B) Faqat alohida karta-AI hisobotlari, agregat yo'q — qisman
- C) Keyin — hozir kerak emas
⤳ Ta'sir: AI integratsiya, HR karta-model

### Q50. Director ko'rsatkichlarning "ideal qiymati" hujjatdan olinsinmi yoki o'rnatilsinmi
**Nima:** Yo'riqnoma stat-ko'rsatkichni beradi (masalan "режа бажарилиш %") lekin ideal qiymatni (100%? 95%?) belgilamaydi. Bu ostona qiymatlarni kim o'rnatadi.
**Nega kerak:** Holat formulasi ostona qiymatga muhtoj; owner har ko'rsatkich uchun "ideal"ni belgilashi kerak.
**Variantlar:**
- A) Owner har ko'rsatkichga ideal/ostona belgilaydi (masalan reja% > 95 = yashil) — sozlanadigan master-data
- B) Avtomatik tarixiy o'rtachadan ostona — sodda, lekin "ideal" emas
- C) Keyin — hozir kerak emas
  ↳ Agar A: ostona lavozimga qarab har xilmi yoki bitta umumiy standartmi? — A) har karta o'z ostonasi B) umumiy

### Q51. "Поддон" (paddon) — qayta ishlatiladigan resurs sifatida hisoblansinmi
**Nima:** Yo'riqnoma "поддонлар... ўз вақтида етказиб берилишини ташкил қилиш" deydi. Paddon — har joyda ishlatiladigan ichki resurs; director uning aylanishini ko'rsinmi.
**Nega kerak:** Owner paddon yetkazishni vazifa qilgan; paddon yetishmasligi bekor turishga olib keladi.
**Variantlar:**
- A) Ha, paddon zaxirasi/aylanishi director da (yetishmovchilik bekor turish bilan bog'lanadi)
- B) Paddon kuzatilmaydi — sodda
- C) Keyin — hozir kerak emas

### Q52. Director "haftalik ishlab chiqargan vs qolgan" (ketgan kun.xlsx) ko'rsinmi
**Nima:** `ketgan kun.xlsx` "Ҳафта қолган / Ҳафта ишлаб чиқарган" ustunlariga ega. Director haftalik bajarilish/qoldiqni ko'rsinmi.
**Nega kerak:** Owner haftalik kesimni alohida yuritadi — bu taktik (oylik→haftalik) darajaga mos.
**Variantlar:**
- A) Ha, "Hafta ishlab chiqarildi vs qoldi" director da + haftalik trend (Excel ustuniga mos)
- B) Faqat oylik/kunlik — qisman
- C) Keyin — hozir kerak emas

### Q53. Yo'nalish (ofs kar / ofs gof / flx gof) bo'yicha statistika ajratilsinmi
**Nima:** `ketgan kun.xlsx` "Йўналишлар: ofs кар, ofs гоф, flx гоф" (ofset-karton, ofset-gofra, flekso-gofra) bo'yicha ajratadi. Director ishlab chiqarish yo'nalishi bo'yicha taqqoslasinmi.
**Nega kerak:** Owner mahsulot yo'nalishini (texnologiya turi) ajratadi — har yo'nalish har xil samaradorlik.
**Variantlar:**
- A) Ha, "Ofset-karton / Ofset-gofra / Flekso-gofra" yo'nalishlari bo'yicha holat+hajm director da (Excel ro'yxatiga mos)
- B) Yagona ishlab chiqarish raqami — sodda
- C) Keyin — hozir kerak emas

### Q54. "Algoritm turi" (2-8 ta bo'lim oqimi) — buyurtma murakkabligi ko'rsatkichimi
**Nima:** `ketgan kun.xlsx` "Алгоритм тури: 2 та бўлим, 3 та бўлим ... 8 та бўлим" bilan buyurtma necha bo'limdan o'tishini belgilaydi. Director buyurtma murakkabligini ko'rsinmi.
**Nega kerak:** Owner buyurtmani o'tadigan bo'limlar soni bilan tasniflaydi — bu murakkablik va vaqt prognozi.
**Variantlar:**
- A) Ha, buyurtmaga "algoritm turi (2-8 bo'lim)" + murakkablikka qarab vaqt prognozi (Excel mantig'iga mos)
- B) Murakkablik kuzatilmaydi — sodda
- C) Keyin — hozir kerak emas
⤳ Ta'sir: Planning (yo'nalish/routing), buyurtma vaqt prognozi

### Q55. Director paneliga "tozalik/intizom" (5S) ko'rsatkichi qo'shilsinmi
**Nima:** Yo'riqnoma "Тозаликка эътибор бермаслик" ni ko'p uchraydigan xato, "иш жойини рухсатсиз ташлаб кетиш" ni esa qoidabuzarlik deb belgilaydi. Director intizom/tozalik holatini ko'rsinmi.
**Nega kerak:** Owner tozalik va ish-joy intizomini har lavozim hujjatiga qo'shgan — bu madaniyat ko'rsatkichi.
**Variantlar:**
- A) Ha, "Tozalik/intizom" holati director da (tekshiruv/voqea asosida) — hujjat qoidalariga mos
- B) Faqat HR intizom voqealari, alohida panel yo'q — qisman
- C) Keyin — hozir kerak emas

DONE: Director / Strategiya — 55.
