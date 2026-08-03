# WMS — WMS / Ombor — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

> Manba: `decisions/10-warehouse.md` (134 savol, 75 javoblangan, 59 ochiq) + `OCHIQ-JAVOBLAR-2026-06-08.md` WMS bo'limi + `LOYIHA-QOIDALARI-2026-06-08.md`.
> Bu 50 savol YANGI — allaqachon javoblangan 134 savol bilan takrorlanmaydi. Chuqurroq edge-case, avtolashtirish mexanizmi, chegara holatlari, integratsiya handoff va formulalar.
> Tamoyillar: E1 (AI→inson tasdiq) · E2 (karta-markaz) · E3 (AI reja) · E4 (IoT tablet) · E5 (org-sxema marshrut) · E6 (bitta haqiqat).

---

1. `warehouse_stock` jadvaliga bir vaqtda ikki xil harakat (MES chiqim + POS skan) kelib qolsa, qaysi mexanizm qulflanishni boshqaradi — PostgreSQL SELECT FOR UPDATE, advisory lock, yoki outbox+event serialization? Bu poyga holati (race condition) real ishlab chiqarishda qancha tez-tez kutiladi? [⤳ ta'sir: MES, POS Monitor, Finance/GL]

2. Karantin holatidagi material MES tomonidan "ishlab chiqarish buyurtmasi"ga avtomatik rezerv qilinishiga urinsa nima bo'ladi — tizim qat'iy blok qo'yadimi, ogohlantirish bilan o'tkazadimi, yoki PP rejalashtiruvchi rezervni oluvchan "shartli rezerv" sifatida saqlaydi? [⤳ ta'sir: PP/MRP, MES, QC]

3. FIFO ketma-ketligida partiya A oldin kelgan, lekin QC tomonidan hali tekshirilmagan; partiya B keyinroq kelgan va allaqachon "erkin" holatda. Chiqimda FIFO qoidasi buzilmay amalga oshishini ta'minlash uchun "erkin" partiyalar ichida FIFO qanday hisoblanadi — sana, partiya raqami, yoki kirim actiga asoslanib? [⤳ ta'sir: QC, MES, Finance/FIFO narx]

4. Dinamik AI min/max hisob (EP-WMS-067, oxirgi 3-6 oy) yangilanganda, agar shu paytda aynan o'sha material uchun xarid arizasi (PR) ochiq bo'lsa — PR miqdori avtomatik qayta hisoblanadimi, yoki faqat keyingi reorder tsiklda yangi hisob qilinadi? Ochiq PR bilan yangi AI tavsiya to'qnashganda qanday hal qilinadi? [⤳ ta'sir: MM/Ta'minot, PP/MRP, Finance]

5. Ombor topologiyasi (Zona→Qator→Javon→Yacheyka) kirim aktida manzil ko'rsatilmay tasdiqlangan bo'lsa — tizim harakatni qabul qiladimi? Manzilsiz qabul qilingan zaxira "manzilsiz zona"ga tushadimi, yoki kirish bloklanadimi? [⤳ ta'sir: kirim akti, locator, QC]

6. IoT namlik/harorat datchigi (EP-WMS-127) chegaradan chiqishni aniqlasa va ogohlantirish yuborsa — bu signal natijasida qaysi partiyalar "xavf ostida" deb belgilanadi: faqat o'sha anda omborga kelgan yangi kirimlar, yoki butun shu zonadagi mavjud zaxira? Belgilash avtomatikmi yoki QC qo'lda qaror qiladimi? (E1 tamoyili) [⤳ ta'sir: IoT, QC, MES]

7. Smenalararo qoldiq topshirish akti (EP-WMS-124) tuzilayotganda, agar oldingi smena hisobi va WMS kanonik zaxirasi (`warehouse_stock`) o'rtasida farq ko'rinsa — bu farq darhol inventarizatsiya farqi sifatida qaydlanadimi, yoki faqat hisobot uchun saqlanib keyingi to'liq inventarizatsiyagacha kutadimi? [⤳ ta'sir: HR/smena, Finance/GL, inventarizatsiya]

8. Avto-xarid arizasi (PR) loyihasi kichik miqdor va katta miqdor uchun bir xil tasdiqlash yo'lidan o'tadimi, yoki tasdiqlash matritsasi summaga qarab darajalanib org-sxema bo'yicha chiqadimi — masalan 500 kg gacha ombor boshlig'i, undan yuqori direktor? (E5 tamoyili) [⤳ ta'sir: MM, Finance, Org-sxema]

9. Mijoz moli (davallcheskiy, EP-WMS-123) uchun ombor-saqlash haqi "javobgar menejerga" yoziladigan bo'lsa — bu hisoblash qaysi trigger bilan (oylik cron, har harakat, yoki qo'lda) amalga oshadi va GL da qaysi hisob raqamlari debetlanadi/kreditlanadi? [⤳ ta'sir: Finance/GL, SD, COR menejer]

10. Import partiyasi bojxona hujjati (GTD) biriktirilmay kirim tasdiqlansa — tizim tasdiqlashni bloklaydimi, ogohlantirish bilan o'tkazadimi, yoki tasdiqlaydi va keyinchalik hujjat biriktirilishi uchun "hujjat kutilmoqda" bayroq qo'yadimi? Blok bo'lsa qancha muddatga ruxsat beriladi? [⤳ ta'mir: MM/Ta'minot, Finance, QC]

11. Rulondan kesilgan formatlar (list) zaxirasi (EP-WMS-129) yaratilganda — `warehouse_stock`da rulon (kg) kamaytirilib list (dona) qo'shiladi. Agar kesish operatsiyasi MES tomonidan bajarilsa va WMS buni mustaqil qayta hisoblasa — ikki tomondan bir vaqtda yozish holati qanday oldini olinadi? [⤳ ta'sir: MES, warehouse_stock, GL]

12. Ombor aniqlik foizi (GSD, EP-WMS-008) omborchi kartasiga KPI sifatida tushadigan bo'lsa — bu foiz qanday formulada hisoblanadi: (farqsiz pozitsiyalar/jami pozitsiyalar)×100, yoki (farqli miqdor/umumiy miqdor)×100? Kichik miqdor lekin ko'p pozitsiya farqi bilan katta miqdor lekin bitta pozitsiya farqi qaysi biri yomonroq deb hisoblanadi? [⤳ ta'sir: Org-karta KPI, HR bonus, GSD]

13. Material yoshi eskirish signali (EP-WMS-126) FIFO bilan ziddiyatga kirishi mumkin — FIFO deydi "eski birinchi", eskirish signali ham "eski material xavfda" deydi. Agar eski material allaqachon eskirish chegarasiga yaqin, lekin FIFO bo'yicha buyurtmaga briktirilganda — tizim bu to'qnashuvni qanday hal qiladi va kimga ogohlantiradi? [⤳ ta'sir: QC, MES, Finance]

14. Texkarta-material mosligi bloki (EP-WMS-084: toplaner kerak, makulatura chiqarilsa blok) — bu blokni faqat "IChLog/ishlab chiqarish boshlig'i + sabab" bilan ochish mumkin. Bu override hodisasi audit-logga tushadimi, va override bergan shaxsning org-sxemadagi razryadi/lavozimi avtomatik tekshiriladimi? (E2 karta-vakolat) [⤳ ta'sir: PP texkarta, MES, HR/Org]

15. "Kritik material X kun da tugaydi" prognoz signali (EP-WMS-108) hisoblash formulasi qanday — (joriy_qoldiq − rezerv) / kunlik_o'rtacha_sarf = tugash_kuni? Bunday hisobda sarf normasi MES texkartasidanmi, yoki oxirgi N kunning haqiqiy sarfidan o'rtacha olinadimi? Va bu prognoz cron qancha vaqtda bir yangilanadi? [⤳ ta'sir: PP/MRP, MM/Ta'minot, MES]

16. Inventarizatsiya paytida zona muzlatilganda (EP-WMS-062) — muzlatilgan zonadan MES tomonidan material so'rov (INTERNAL_ISSUE) kelib qolsa nima bo'ladi? Muzlatish MES so'rovini avtomatik bloklaydi va MES operatoriga signal yuboradimi, yoki MES so'rovi "kutish navbati"ga tushadimi? [⤳ ta'sir: MES, inventarizatsiya, CC]

17. Partiya aralashtirishdan himoya (EP-WMS-081): bir buyurtma uchun bir paletga ikki xil partiyadan material terilganda — bu faqat ogohlantirish bilan o'tadimi? Ogohlantirish kimga yuboriladi (omborchi/ishlab chiqarish boshlig'i/QC)? Va QC final inspeksiyasida partiya raqami bo'yicha sertifikat berishda qaysi partiya ko'rsatiladi? [⤳ ta'sir: QC, MES, sertifikat]

18. Material almashtirish (substitute, EP-WMS-101) "ruxsat etilgan analog" ro'yxatidan olinishi kerak. Agar analog materialni chiqarish paytida texkarta avtomatik yangilanmasa — PP texkartasida hali eski material ko'rsatilgan, MES esa analog bilan ishlayapti — bu nomuvofiqlik qanday tizimda ko'rinadi va kim tuzatadi? [⤳ ta'sir: PP, MES, QC, master-data]

19. Ko'r sanoq (EP-WMS-059): sanoqchi ekranda miqdorni ko'rmay sanoq kiritadi. Agar sanoq oxirida tizim hisobidagi raqam bilan farq ±1% chegarasidan oshsa — ikkinchi sanoqchi majburiy tayinlanadimi, yoki bitta sanoqchi natijalari rahbar tasdig'iga to'g'ridan yuboriladi? Ikkinchi sanoq ham farq qilsa uchinchi sanoqchi bormi? [⤳ ta'sir: inventarizatsiya, Finance/GL, HR]

20. Ombor ijara haqi (EP-WMS-019/020) — faqat "tayyor mahsulot" saqlanishi hal qilingan. Agar mijoz tayyor mahsuloti ombordan chiqarib olib ketilmay muddati oshsa — penya avtomatik hisoblanadimi? Penyana qo'llash uchun kimning tasdig'i kerak va u GL da qaysi hisobga tushadimi? (E1 tamoyili, FIN-062 penya bilan mos) [⤳ ta'sir: Finance/GL, SD, COR menejer]

21. Material rezervatsiyasi (EP-WMS-100): PP reja material bandlaganda `warehouse_stock` da "rezerv" ustuni yangilanadimi, yoki bu alohida `material_reservations` jadvalda saqlanadimi? Agar rezerv alohida jadvalda bo'lsa — zaxira va rezerv har vaqt izchil bo'lishi uchun qanday mexanizm ishlatiladi (trigger, event, yoki cron tekshiruvi)? [⤳ ta'sir: PP/MRP, warehouse_stock, Finance]

22. Yetkazib beruvchi reyting (EP-WMS-094) har kirimda avtomatik yangilanadi. Agar bitta yetkazuvchidan bir oyda 10 ta kirim bo'lsa va 9 tasi a'lo, 1 tasi brak bo'lsa — reyting formulasi qanday (o'rtacha, og'irlikli, yoki eng so'nggi N ta kirimg a qarab)? Va reyting past bo'lgan yetkazuvchidan yangi PO ochilsa — tizim bloklaydimi yoki ogohlantirish beradimi? [⤳ ta'sir: MM/Ta'minot, Finance, QC]

23. Import valyuta kursi: material kelgan kun MB kursi muzlatiladi (EP-MM-054 bilan mos). Agar kelish kuni bank ish kuni emas bo'lsa (bayram/dam olish) — qaysi kurs olinadi: oxirgi ish kuni, keyingi ish kuni, yoki MB APIdan eng so'nggi mavjud kurs? Bu avtomatik olinadimi yoki omborchi/buxgalter qo'lda kiritadimi? [⤳ ta'sir: Finance/GL, MM, valyuta]

24. Rulon qoldig'i avto-taklif (EP-WMS-015): ostatok rulonlar yangi buyurtmaga taklif qilinganda — bu taklif PP rejalashtiruvchisiga chiqadimi, yoki bevosita MES operatoriga? Agar ostatok rulon bir nechta buyurtma uchun yaroqli bo'lsa, qaysi buyurtmaga birinchi taklif qilinishini kim yoki nima belgilaydi (AI, FIFO, ustuvorlik)? (E3 tamoyili) [⤳ ta'sir: PP, MES, SD ustuvorlik]

25. Xavfli material zonasi (EP-WMS-045/128): bo'yoq/kley/lak "alohida zona" da saqlanishi kerak. Agar kirim paytida xavfli material "asosiy ombor" zonasiga yo'naltirilishga urinilsa — tizim darhol bloklaydi va to'g'ri zonani ko'rsatadimi? Bu manzil tekshiruvi kirim akti saqlashdan oldin sodir bo'ladimi? [⤳ ta'sir: kirim, xavfsizlik, locator]

26. Ombor harakatlari GL ga avtomatik o'tishi (EP-WMS-109): GL provodkasi muvaffaqiyatsiz bo'lsa (Finance moduli xato qaytarsa) — warehouse harakat allaqachon `warehouse_stock`ga yozilgan bo'ladi. Bu holda qanday kompensatsiya mexanizmi ishlaydi — harakatni rollback qilib GL ni kutadimi, yoki GL "yozilmagan provodkalar" navbatiga tushib keyinroq qayta urinadimi? [⤳ ta'sir: Finance/GL, warehouse_stock, outbox]

27. Gofra qavatini aralashtirishdan himoya (EP-WMS-085, 3╳5 qavat): bu tekshiruv faqat chiqim paytida skanlashda sodir bo'ladimi, yoki PP/MES texkarta tayyorlash bosqichida ham proaktiv tekshiruv bor? Agar MES operatori gofra tur mos kelmasligini skanerlashda aniqlasa — u faqat ogohlantiradi va operator davom etishi mumkinmi, yoki chiqim bloklanadimi? [⤳ ta'sir: PP texkarta, MES, QC]

28. Ombor aniqlik foizi trend grafiği (EP-WMS-008, ShVB GSD haftalik statistika): bu trend Director dashboardida ko'rinadimi? Aniqlik foizi belgilangan chegaradan (masalan 95%) past ketganda — Director'ga signal yuborilish trigger qanday: darhol signal, yoki faqat haftalik digest da ko'rinadimi? [⤳ ta'sir: Director dashboard, CC/NTF, HR KPI]

29. Material namuna/probnik chiqimi (EP-WMS-130) "alohida sabab kodi" bilan qaydlanadi — bu sabab kodi kimga ko'rinadigan hisobotda? Agar bir oyda namuna chiqimi 10 kg dan oshsa ogohlantirish chiqadimi? Bu bog'liqlik Finance'ga yo'qotma sifatida ko'rinadimi yoki alohida "marketing/QC xarajati" kategoriyasiga tushadimi? [⤳ ta'sir: Finance/GL, QC, Marketing]

30. Ish vaqtidan tashqari ombor amali (EP-WMS-121): kechki smena yoki dam olish kunida kirim/chiqim qilinganda "ish vaqtidan tashqari" bayroq avtomatik solinadimi (vaqt asosida), yoki xodim o'zi "favqulodda amal" deb belgilaydimi? Bu bayroqli amallar maxsus hisobotda yig'iladi va kimga (ombor boshlig'i/HR/direktor) yuboriladi? [⤳ ta'sir: HR, audit, Director]

31. Poddon (palet) birligi (EP-WMS-086) qanday ombor hodisasida yangilanadi — faqat tayyor mahsulot jo'natmada, yoki kirim/ichki ko'chirish da ham poddon hisobga olinadimi? Agar bitta poddon ikkiga bo'linsa (yarim poddon ko'chirilsa) — poddon birligi fraksional (0.5) bo'la oladimi yoki doim butun son bo'ladimi? [⤳ ta'sir: ichki logistika, jo'natma, SD]

32. Rohler (ichki transport) chaqirish so'rovi (EP-WMS-087) bajarilmay N daqiqa o'tsa — eskalatsiya mexanizmi qanday ishlaydi? Birinchi eskalatsiya kimga (IChLog boshlig'i?), ikkinchi eskalatsiya kimga (smena boshlig'i/direktor?)? Va "bekor turish" daqiqalari rohler kechikishi sababidan MES KPI'ga qanday bog'lanadi? [⤳ ta'sir: MES/downtime, Coordination, HR KPI]

33. Materialni-mas'ul shaxs (EP-WMS-111, материально-ответственное лицо) biriktirilishi: bitta zona uchun mas'ul shaxs ketsa yoki ta'tilda bo'lsa — uni o'rinbosar avtomatik tayinlanadimi, yoki zona "mas'ulsiz" holatda qolishi mumkin? Mas'ulsiz zonada inventarizatsiya kamomadi aniqlansa kim javob beradi? (E5 org-sxema marshruti) [⤳ ta'sir: HR/Org-sxema, Finance, inventarizatsiya]

34. Zaxira aylanma tezligi (EP-WMS-115, turnover days) — formula qanday: (o'rtacha_zaxira / kunlik_sarf) × 1 kun? Bu hisobda o'rtacha zaxira necha kunlik o'rtacha (30, 90, 365)? Va "juda tez aylanish" signali nima ko'rsatadi — xom-ashyo tugash xavfimi yoki me'yor talabi qondirilmayaptimi? [⤳ ta'sir: Finance, MM/Ta'minot, Director KPI]

35. Ombor zonasi sig'imi to'lganlik foizi (EP-WMS-116): import oldidan zona to'lganlik tekshirilishi kerak. Bu tekshiruv faqat ombor boshlig'iga ko'rsatuvchi hisobotmi, yoki import PO tasdiqlash jarayonida qattiq darvoza (gate) — ya'ni sig'im yetmasa PO tasdiqlash bloklanadimi? [⤳ ta'sir: MM/Ta'minot, Finance/PO, locator]

36. Grammaj bo'yicha kirim tekshiruvi (EP-WMS-091): namuna o'lchanadi, ±tolerans — agar namuna grammaji chegaradan chiqsa, butun partiya karantinga tushadimi yoki faqat bir qismi (namuna olingan rulon)? Partiya bir nechta rulondan iborat bo'lsa har rulondan namuna olinadimi? [⤳ ta'sir: QC, karantin, MM/Ta'minot]

37. Partiya bo'yicha sifat pasporti (EP-WMS-080): QC o'lchov natijalari (gramaj/namlik/RCT/BCT) partiyaga biriktirilsa — bu pasport PDF sifatida chop etiladimi va SD jo'natma hujjatiga avtomatik ilinib chiqadimi? Mijoz talabiga ko'ra sertifikat ingliz tilida ham bo'lishi kerak bo'lsa (eksport) — i18n qanday ishlaydi? [⤳ ta'sir: QC sertifikat, SD jo'natma, i18n]

38. Dead-stock (EP-WMS-028/082) N kun chegarasi dinamikmi yoki material toifasiga qarab o'zgaradimi — masalan, rulon uchun 30 kun, kley/bo'yoq uchun 60 kun? Agar dead-stock signali chiqsa, AI avtomatik "chegirma bilan sotish" yoki "qaytarib yuborish" tavsiyasi beradimi, va bu tavsiya kimga (moliya/sotuv boshlig'i) yuboriladi? (E3 AI tavsiya, E1 inson tasdiq) [⤳ ta'sir: Finance, SD, AI]

39. Reorder nuqtasi sarf tezligi × lead time formulasi (EP-WMS-065): lead time kunlik o'rtacha sarf bilan ko'paytirilganda — agar yetkazuvchidan lead time o'zgarsa (masalan import kechikdi) — reorder nuqtasi darhol qayta hisoblanadimi avtomatik? Agar qayta hisob natijasida material allaqachon reorder nuqtasidan pastda bo'lsa — PR avtomatik yaratiladi, yoki faqat ogohlantirish? [⤳ ta'sir: MM/Ta'minot, Finance, AI]

40. Ko'chirish blankasida (EP-WMS-074, ichki ko'chirish) "manba" va "maqsad" yacheykasi kiritilishi shart bo'lsa — agar maqsad yacheykada sig'im yetmasa nima bo'ladi? Tizim boshqa bo'sh yacheykani avtomatik taklif qiladimi, yoki ko'chirish bloklanadimi va omborchi o'zi joy izlaydimi? [⤳ ta'sir: locator, yacheyka sig'im, ichki logistika]

41. Peresmenka akti (EP-WMS-124) elektron imzolangandan keyin — agar keyingi smena boshlanganda tizim kanonik `warehouse_stock` bilan akt qoldig'ini solishtirsa va farq topsа — bu avtomatik "smena kirim farqi" hodisasi sifatida qaydlanadimi va kimga signal yuboriladi? Signal olgandan so'ng kim, qancha muddatda izoh berishi kerak? [⤳ ta'sir: HR smena, Finance/GL, inventarizatsiya]

42. Mijoz moli tayyor mahsulot (EP-WMS-019): mijozning tayyor mahsuloti omborga tushganda — u `warehouse_stock`da qayd etiladimi (qiymatsiz bayroq bilan), yoki alohida "custodian stock" jadvalida saqlanadimi? Agar `warehouse_stock`da bo'lsa — moliya hisobotidagi "zaxira qiymati" bu mahsulotni o'z ichiga olmasligi qanday ta'minlanadi? [⤳ ta'sir: Finance/GL balans, SD, H2 kanonik jadval]

43. Kirim ±2% tolerans (EP-WMS-047): tolerans hisobi kg asosidami yoki qiymat asosidami? Agar yetkazuvchi 100 kg dan 98 kg keltirsa (2 kg = 2%) — avtomatik qabul qilinadi; lekin 98 kg dan 95 kg (3.06%) — tasdiqlash kerak. Bu tasdiqlash kimdan: ombor boshlig'i, moliya, yoki MM'dan? Va qisman qabul qilinganda (95 kg) qolgan 5 kg uchun yetkazuvchiga da'vo avtomatik yuboriladi yoki qo'lda? [⤳ ta'sir: MM/Ta'minot, Finance, QC]

44. Mahsulot jo'natilganda (EXTERNAL_OUT) — tizim `warehouse_stock`ni kamaytiradi va GL debet/kredit yozadi. Agar haydovchi yuk bilan yo'lda bo'lsa va jo'natma "yetkazilmagan" holatda bo'lsa — bu material kimning balansida turadi: zavodning zaxirasidami, yoki "yo'ldagi mol" alohida GL hisobida? Yetkazilish tasdiqlanmay 72 soat o'tsa avtomatik eskalatsiya kimga? [⤳ ta'sir: Finance/GL, SD, Coordination]

45. Ombor ↔ PP rezerv sinxronizatsiyasi: PP AI reja yangi buyurtma uchun material banklaydi, lekin shu material bir vaqtda ombor inventarizatsiyasi paytida "muzlatilgan" zonada ham bo'lsa — PP banki va inventarizatsiya muzlatish bir-biriga zid kelmaydi? Qaysi holatni ikkinchasidan ustun qo'yish kerak? [⤳ ta'sir: PP/MRP, inventarizatsiya, MES]

46. Brak/karantin materialni sexga chiqishini blok (EP-WMS-117) — bu blok qaysi qatlamda amalga oshadi: DB trigger (INSERT bilan bir vaqtda), BE service validatsiyasi, yoki faqat FE/POS Monitor klientida? Agar IT texnik `warehouse_stock` jadvaliga to'g'ridan SQL yozsa — blok bu holda ham ishlaydi yoki faqat UI/API darajasida? [⤳ ta'sir: xavfsizlik, MES, DB constraint]

47. Ombor bo'yicha kunlik hisobot (EP-WMS-013/107, CRON ertalab) — hisobotda nechta ombor (MAIN/QC/PRODUCTION_*/FG va boshqalar) alohida ko'rsatiladi? Agar biror ombor tur "bo'sh" bo'lsa — u hisobotdan chiqarib tashlanadimi yoki "0" bilan ko'rsatiladimi? Hisobot formati (PDF/Telegram xabar/email) kim tomonidan tanlanadi — konfiguratsiyadan yoki har recipient uchun alohida? [⤳ ta'sir: CC/NTF, Director, Finance]

48. Reorderda bir nechta beruvchiga tender (EP-WMS-120): reorder signal chiqganda avtomatik 2-3 beruvchiga so'rov yuborilsa — bu so'rov qaysi kanaldan yuboriladi (ERP ichida so'rovnoma, email, Telegram)? Yetkazuvchi N kun ichida javob bermasa — tender keyingi beruvchiga o'tadimi yoki faqat reminder yuboriladi? Javob berishni o'tkazib yuborgan beruvchi reytingiga ta'sir qiladimi? [⤳ ta'sir: MM/Ta'minot, Finance, CRM/vendor]

49. Material kartochkasi dublikat ogohlantirish (EP-WMS-122): yangi kartochka ochishda tizim o'xshash nom qidirganda qanday algoritm ishlatiladi — qat'iy matn mos kelishi, Levenshtein masofasi, yoki AI semantik o'xshashlik (masalan "kraft topliner 125g/m²" va "topliner kraft 125" ni bir deb topadi)? Ogohlantirish chiqsa ham MM roli majburan davom eta oladimi? [⤳ ta'sir: master-data, MM, AI]

50. Ombor razryadi → vakolat matritsasi (EP-WMS-024/102) karta-model (E2) bilan bog'liq: agar omborchi razryadi ko'tarilsa (HR attestatsiyadan o'tsa) — yangi vakolatlari darhol aktivlanadimi, yoki ombor boshlig'i qo'shimcha "tasdiqlash" bosadimi? Va razryad pasayganda (EP-ORG-134 razryad pasayish, E1 tasdiq bilan) — cheklangan vakolatlar darhol kuchadimi yoki joriy ochiq operatsiyalar (ochiq kirim/chiqim aktlari) yakunlaguncha kutiladi? [⤳ ta'sir: HR/Org-karta, RBAC, ombor xavfsizlik]
