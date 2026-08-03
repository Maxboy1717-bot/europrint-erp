# DIR — Director / Strategiya — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. Holat formulasidagi 5 ko'rsatkich (pul/ishlab chiqarish/buyurtma/xodim/sifat) har birining VAZNI qanday saqlanadi — `state_weights` jadvali JSONB mi, alohida ustunlar mi, va director ekrandan o'zgartirsa qaysi event yoziladi? [⤳ ta'sir: FIN, PP, MES, HR, QC — barcha modul agregat]

2. 07:00 holat cron ishlaganda bir yoki bir nechta modul KPI hisoblashda TIMEOUT bo'lsa (masalan MES real-time ma'lumot 3 soniyada kelmasa) — holat hisoblanmaymi, yoki qisman holat (mavjud ko'rsatkichlar bilan) saqlansinmi, va director qaysi alert oladi? [⤳ ta'sir: MES, PP, FIN — KPI manbalar]

3. Director holat darajasi OSISH dan INQIROZ ga bir kunda emas, balki 2-3 kunga yashirin yomonlashganda (gradual) tizim qachon alert beradi — "og'ish tezligi" (rate of change) alohida hisoblansinmi? [⤳ ta'sir: EP-DIR-001, EP-DIR-070 trend holat]

4. Agar bir xil vaqtda ikkita moduldagi KPI bir-biriga zid signal bersa (masalan FIN pul oqimi yaxshi lekin MES downtime ko'p) — holat formulasi qanday yechadi, va director ekranida bu ziddiyat qanday vizual ko'rsatiladi? [⤳ ta'sir: FIN, MES, EP-DIR-001]

5. Har kunda 07:00 holat cron qayta hisoblanganda oldingi kun holati IMMUTABLE arxivga tushishi kerakmi yoki overwrite qilinadimi — va bir kunning holati o'zgartirilgan bo'lsa audit-log qanday ko'rinadi? [⤳ ta'sir: EP-DIR-004 tarix, audit-log]

6. Director kundaligi (Diary) avtomatik to'ldirilganda (state + mainKpiValue tizimdan) xodim qo'lda "muammo/yechim" maydonini to'ldirmay sahifani yopsa — tizim MAJBURANMI so'raydi, yoki to'liqsiz saqlansinmi, va to'liqsiz kundaliklar hisobotda alohida ko'rsatilsinmi? [⤳ ta'sir: EP-DIR-007, EP-DIR-009]

7. Bir kundalik muammo "hal qilinmadi" deb keyingi kunga o'tganda (carry-over) necha kunga ketma-ket o'tsa "surunkali muammo" deb alohida eskalatsiya kategoriyasiga tushadi — bu chegara qanday sozlanadi va kim oladi? [⤳ ta'sir: EP-DIR-010, EP-DIR-006 alert routing, NTF]

8. Bo'lim rahbari o'z kundaligini yozishda director kundaligidan qaysi ma'lumotni ko'rishi mumkin va qaysinisini ko'rmasligi kerak (RBAC maydon darajasi) — ularning kundaliklari director tomonidan yig'ib ko'riladimi? [⤳ ta'sir: EP-DIR-008, RBAC, ORG/KARTALAR]

9. Ideal kartina (100M foyda, 800M daromad) raqamlari CRON bilan modullardan avtomatik yangilanganda birortasi null/bo'sh qaytsa (masalan HR xodim soni hisoblanmasa) — tizim qaysi qiymatni ko'rsatadi va bu bo'shliqni director qanday biladi? [⤳ ta'sir: EP-DIR-013, HR, FIN, SD]

10. OKR kaskadida kompaniya maqsadi → bo'lim maqsadi → karta maqsadi zanjiri uzilsa (masalan karta arxivlansa) — OKR kaskad avtomatik qayta ulansinmi, yoki director o'zi tiklashini so'rashni kutsinmi, va bu holat qanday aniqlanadi? [⤳ ta'sir: EP-DIR-016, ORG/KARTALAR karta arxiv, EP-DIR-030]

11. Oylik taktik rejadan haftalik dekompozitsiya avtomatik bo'linsa (4 hafta → 4 qism) — har hafta teng miqdordami yoki birinchi/oxirgi hafta qisqaroq bo'lishi (ishchi kuni soni) hisobga olinadimi, va hafta oxirida bajarilish % kim kiritadi? [⤳ ta'sir: EP-DIR-018, HR ish kuni kalendarlar]

12. Taktik vazifa kartaga biriktirilganda o'sha karta bo'sh (vakant) bo'lsa — vazifa kimga yuklanadi, kutilayotgan karta egasiga (kelajakdagi xodimga) yoki yuqoridagi kartaga eskalatsiya qilinadimi? [⤳ ta'sir: EP-DIR-019, ORG vakansiya, Kanban]

13. Stat-reglamentdagi ko'rsatkich formulasi o'zgartirilganda (versiya yangilananda) — tarixiy ma'lumotlar ESKImi yoki YANGImi formula bilan hisoblangan ko'rinadimi, va qaysi versiya audit uchun kanonik? [⤳ ta'sir: EP-DIR-022, tarix izchilligi, audit]

14. Stat-reglamentda ko'rsatkich egasi (mas'ul karta) o'zgartirilganda — eskidan yangi egaga handoff qanday bo'ladi, eskilarning kechikish tarixi yangi egaga ko'rinadimi, va ONIY o'tish bo'ladimi yoki muddatli (overlap)? [⤳ ta'sir: EP-DIR-023, ORG/KARTALAR]

15. Holat kartalardan yig'ilganda (E2: karta-markaz printsipi) karta AI hisoboti vaqtida kelmasa (300ms timeout) — holat formulasi o'sha kartani "qolib ketdi" deb hisoblaydi yoki o'tgan kundagi qiymatni oladimi? [⤳ ta'sir: EP-DIR-024, AI integratsiya, ORG]

16. Director dashboard "real-time" va "kunlik snapshot" ikkalasini bir vaqtda ko'rsatganda ular TAFOVUT (farq) qanchalik katta bo'lsa eslatma beriladi — bu farq chegarasi sozlanadimi va qaysi modullardan keladigan farq eng kritik hisoblanadi? [⤳ ta'sir: EP-DIR-073, MES, FIN]

17. AI strategik tahlilchi (director-ai.service) har kuni tahlil + 1-2 tavsiya berganda director "bu tavsiyani ko'rdim, bajaramiz / inkor etaman" deb belgilashi mumkinmi — va bajarilmagan tavsiyalar keyingi kungi tahlilga ta'sir qiladimi? [⤳ ta'sir: EP-DIR-026, AI integratsiya, EP-DIR-009 diary]

18. Telegram botda /holat buyrug'i kelganda token muddati o'tgan yoki bot restart bo'lgan bo'lsa — holat hisoblash cron dan OXIRGI saqlanganini qaytaradimi yoki real-time trigger ishlaydimi, va bu qaysi tizimdan olinadi? [⤳ ta'sir: EP-DIR-027, CC Telegram bot, EP-DIR-004]

19. Kunlik ertalabki digest (07:00 cron bilan) va holat alerti (holat yomonlashganda darhol) bir vaqtda chiqib ketsa — director ikkita alohida xabar oladimi yoki biri ichiga birlashadimi, va Telegram'da tartib qanday? [⤳ ta'sir: EP-DIR-028, EP-DIR-005, NTF, CC]

20. Holat darajalari (5 daraja: OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) konfiguratsiyasi o'zgartirilganda (masalan chegara qiymatlari) — tarixdagi kunlar yangi daraja bo'yicha qayta baholanadimi yoki eski daraja bilan arxivda qoladimi? [⤳ ta'sir: EP-DIR-029, EP-DIR-004 tarix]

21. "Zarur zakazlar" (ustuvor buyurtmalar) navbatini director o'zgartirganda — bu o'zgarish PP rejalashtirishga REAL VAQTDA ta'sir qiladimi yoki faqat keyingi qo'lda qayta rejalashtirishda hisobga olinadimi? [⤳ ta'sir: EP-DIR-054, SD, PP rejalashtirish]

22. Kechikishlar sababi majburiy kategoriyasi (material/transport/operator/qolip/boshqa) kiritilganda operator yoki bo'lim rahbari sabab tanlashdan BOSH TORTSA — tizim qancha kutadi, kim eskalatsiya oladi, va "sabab ko'rsatilmagan" kechikish statistikada alohida chiqadimi? [⤳ ta'sir: EP-DIR-037, MES, PP, HR, NTF]

23. Director "downtime" ko'rganida bir xil vaqtda bir nechta bo'limda bekor turish bo'lsa — aggregate yoki alohida ko'rsatilsinmi, va director bir downtime uchun "taniqladim, chora ko'rilmoqda" bayrog'i bosishi mumkinmi? [⤳ ta'sir: EP-DIR-038, MES downtime, EP-DIR-001]

24. "Reja bajarilish %" agregati (EP-DIR-036) real vaqtda hisoblanganda MES dan keladigan fakt raqami va PP dan keladigan reja raqami turli kesim davrlarda bo'lsa (masalan PP oy boshidan, MES kun boshidan) — qaysi kesim kanonik va ular qanday uyg'unlashtiriladi? [⤳ ta'sir: PP, MES, EP-DIR-036]

25. "Brak soni" director dashboardda ko'rsatilganda QC tomonidan qaytarilgan, MES tomonidan qayd etilgan va yetkazib berish paytida aniqlangan brak — uchalasi qo'shiladimi yoki alohida kategoriyalar sifatida ko'rsatilsinmi? [⤳ ta'sir: EP-DIR-055, QC, MES, WMS, SD]

26. Kunduzgi/tungi smena taqqoslaganda (EP-DIR-057) bayram yoki smena o'zgarishi bo'lgan kunlar statistical outlier sifatida ajratilsinmi — va director grafigida bunday "anormal" kunlar qanday belgilanadi? [⤳ ta'sir: EP-DIR-057, HR smena, PP]

27. "Priladka/setup vaqti (soat)" director da ko'rsatilganda kichik buyurtma uchun setup vaqti juda katta nisbat tashkil etsa — AI tavsiya (razmer optimizatsiyasi — EP-DIR-066) uchun qaysi chegara (setup/ishlab chiqarish nisbati) trigger bo'ladi va bu tavsiya nechanchi marta takrorlansa director "eskalatsiya" ko'radi? [⤳ ta'sir: EP-DIR-064, EP-DIR-066, SD, PP]

28. Kichik buyurtmalar tahlili (EP-DIR-065) da "zarar keltirayotgan buyurtma" aniqlanganda — director ma'lumot oladi, lekin bu buyurtmani bloklaydimi yoki faqat "eslatma" ko'rsatadimi, va blok uchun kimning tasdig'i kerak (E1 printsipi — AI kuzatadi, inson tasdiqlaydi)? [⤳ ta'sir: EP-DIR-065, SD, FIN, E1]

29. Buyurtma kodi (2024-0499, KT/PT/E format) director qidiruvida yilni o'tgach (masalan 2025 yil buyurtmani 2026 da qidirganda) — arxiv qatlamdan ochiladimi, va eski yil buyurtmalari "arxiv" ko'rinishida alohida ko'rsatilsinmi? [⤳ ta'sir: EP-DIR-067, SD arxiv]

30. Director 2 o'q bo'yicha drill-down (Departament ╳ Operatsiya turi) amalga oshirganda bitta o'rindiq bir vaqtda ikki bo'lim/operatsiyaga tegishli bo'lsa (ko'p-karta xodim holati) — qaysi bo'lim/operatsiya hisobga olinadi va bu "qo'sh hissa" muammosi qanday hal qilinadi? [⤳ ta'sir: EP-DIR-068, ORG ko'p-karta, MES]

31. Trend "yiqilish/o'sish holati" AI tomonidan avtomatik aniqlanishida (EP-DIR-070) false positive bo'lsa (masalan bir kunlik texnik tushish trendni yomonlashdi deb ko'rsatsa) — director "bu anormallik, trend sifatida hisoblama" deb belgilashimumkinmi va bundan keyin tizim nima qiladi? [⤳ ta'sir: EP-DIR-070, EP-DIR-001]

32. Har ko'rsatkich uchun mas'ul karta (EP-DIR-071) belgilanganda o'sha karta bo'sh (vakant, xodim yo'q) bo'lsa — alert kimga boradi, va "vakant karta" + "ko'rsatkich pasaydi" ikkisi birgalikda qanday eskalatsiya zanjiri hosil qiladi? [⤳ ta'sir: EP-DIR-071, ORG vakansiya, NTF, EP-DIR-006]

33. Bo'lim rahbari hisobot topshirishni kechiktirganda (EP-DIR-072) eslatma ketadi, lekin ular sababsiz hali ham topshirmasa — necha marta eslatmadan keyin bu voqea HR intizom tizimiga (EP-HR intizom) avtomatik uzatiladimi, va bu E1 printsipi bilan qanday kelishadi? [⤳ ta'sir: EP-DIR-072, HR intizom, NTF, E1]

34. Director audit-log ko'rganda (maxfiy ma'lumot kirishini — EP-DIR-044) faqat Super Admin ham ko'radimi yoki director o'z bo'limi uchun alohida "maxfiy kirish" logini real-time ko'rish huquqiga egami — bu RBAC qatlamda qanday farqlanadi? [⤳ ta'sir: EP-DIR-044, RBAC, xavfsizlik]

35. Energiya resurslari (suv/gaz/elektr — EP-DIR-045) oylik sarfi director dashboardga qo'lda kiritiladimi yoki IoT schyotchikdan avtomatik keladimi — qo'lda kiritilsa kim tasdiqlaydi, va "o'tgan oy" bilan taqqoslash formulasi qanday? [⤳ ta'sir: EP-DIR-045, IoT, FIN, HR-042]

36. Smena aralashish riski alerti (EP-DIR-075) ikkita buyurtma uchun trigger bo'lganda — bu alertni faqat director oladimi yoki PP rejalashtiruvchi va smena ustasi ham bir vaqtda oladimi, va alert qancha vaqt ichida "ko'rdim" belgilanmasa eskalatsiya bo'ladi? [⤳ ta'sir: EP-DIR-075, PP, MES, NTF]

37. Karta AI agregati (EP-DIR-079) "qaysi lavozimlar maqsadga erishmayapti" director uchun chiqarganda — bu hisobot FAQAT o'qiladimi yoki director bu ro'yxatdagi kartaga to'g'ridan Kanban vazifasi yuborishimumkinmi (harakat qadami)? [⤳ ta'sir: EP-DIR-079, Kanban, ORG/KARTALAR, AI]

38. 5S tozalik/intizom ko'rsatkichi (EP-DIR-085) hodisa asosida saqlanadi — bu hodisani kim kiritadi (masalan sifat bo'limi tekshiruvi yoki IoT kamera), va "intizom buzildi" bayrog'i director dashboardga kelguncha qaysi zanjirdan o'tadi (E1: AI kuzatadi, inson tasdiqlaydi)? [⤳ ta'sir: EP-DIR-085, HR intizom, IoT kamera, QC, E1]

39. Paddon (qayta ishlatiladigan resurs — EP-DIR-081) zaxirasi kritik chegaraga tushganda director alert oladi, lekin bu alert WMS ga ham yetib boradimi va "paddon sotib olish" PR (xarid so'rovi) avtomatik yaratilsinmi yoki faqat director ko'rsinmi? [⤳ ta'sir: EP-DIR-081, WMS, MM, EP-DIR-038 downtime]

40. Yo'nalish bo'yicha statistika (Ofset-karton/Ofset-gofra/Flekso-gofra — EP-DIR-083) hisoblanganda bir buyurtma bir nechta yo'nalishga tegishli bo'lsa — qaysi yo'nalishga to'liq hisoblanadi va "aralash" buyurtmalar uchun alohida kategoriya kerakmi? [⤳ ta'sir: EP-DIR-083, PP yo'nalish/routing, MES]

41. Buyurtma murakkabligi (algoritm turi — 2-8 bo'lim, EP-DIR-084) director dashboardda ko'rsatilganda murakkab buyurtmalar uchun vaqt prognozi AVTOMATIK kuzatiladimi — va agar prognozdan ortiq vaqt ketayotgan bo'lsa director qachon, qanday alert oladi? [⤳ ta'sir: EP-DIR-084, PP, MES]

42. Strategik yutuqlar "bajarildi" belgilanganda (EP-DIR-030) — bu milestone ni kim belgilashi mumkin (faqat director yoki u vakolat bergan karta egasimi), va noto'g'ri belgilash uchun qaytarish (undo) mexanizmi bormi, va belgilash audit logga tushadi? [⤳ ta'sir: EP-DIR-030, EP-DIR-015 OKR, RBAC]

43. Yo'riqnoma "TASDIQLAYMAN direktor Pozilov A.A." versiya nazoratida (EP-DIR-050) — yangi versiya chiqarilganda o'sha kartadagi barcha xodimlar "tanishdim" imzosini QAYTA bosishi shartmi, yoki faqat yangi o'zgartirilgan bo'limlarga imzo kerakmi? [⤳ ta'sir: EP-DIR-050, ORG/KARTALAR, LMS, HR]

44. Karta nazorat varaqasidagi senariy-savollar (AI imtihon — EP-DIR-049) da xodim muvaffaqiyatsiz bo'lganda — director darajasida yig'ma ko'rsatkich (nechta xodim nechtadan yutqazdi) ko'rinadimi, va bu ma'lumot LMS va HR razryad tizimiga qanday uzatiladi? [⤳ ta'sir: EP-DIR-049, LMS, HR razryad, ORG]

45. "Lavozim vositalari" ro'yxatida (EP-DIR-052) biror vosita (masalan A-System kirish huquqi) yo'q deb bayroqlanganda — bu signal avtomatik IT bo'limiga yetib boradimi va xodim shu vosita bo'lmay ishlayotgan kunlar hisoblab chiqariladimi? [⤳ ta'sir: EP-DIR-052, ORG/KARTALAR, Coordination, IoT]

46. Director "ma'lumot so'rovi" (info-request-workflow — EP-DIR-078) yuborsa va bo'lim rahbari belgilangan muddatda javob bermasa — eskalatsiya zanjiri qanday ishlaydi: kimga, necha soatda, va javob bermay ketsa bu kechikish direktorn hisobot-reglament statistikasiga (EP-DIR-072) tushadi? [⤳ ta'sir: EP-DIR-078, EP-DIR-072, Coordination, NTF]

47. "Chiqindi/qoldiq" (EP-DIR-077) qayta ishlash foizi director dashboardda ko'rsatilganda — bu ko'rsatkich Moliya modulidagi "makulatura qayta sotish" kirimiga avtomatik ulanadimi va qachon ular orasidagi farq (chiqindi - qayta sotilgan) "yo'qotish" sifatida GL ga tushadi? [⤳ ta'sir: EP-DIR-077, WMS qoldiq, FIN GL, MM]

48. "Reja/Fakt/Qoldiq" ko'rinishi (EP-DIR-053) director uchun real vaqtda hisoblanganda hali tugallanmagan ish jarayoni (in-progress) — "fakt"ka qo'shiladimi (partial fakt), yoki faqat to'liq tugagan ishlar faktga kiradimi, va bu ikki hisoblash usulidan qaysi biri kanonik? [⤳ ta'sir: EP-DIR-053, PP, MES, EP-DIR-036]

49. Haftalik ishlab chiqarish vs qolgan tahlil (EP-DIR-082) oxirgi haftada reja kutilmagan buyurtma bilan o'zgartirilsa (masalan ustuvor yangi buyurtma qo'shilsa) — haftalik hisobot "asl reja" ga nisbatan ko'rsatadimi yoki "yangilangan reja" ga nisbatan, va og'ish mantig'i qanday? [⤳ ta'sir: EP-DIR-082, PP, SD, EP-DIR-018]

50. Director "xato-tasnif" AI (tushunmaslik/e'tiborsizlik/qoidabuzarlik — EP-DIR-076) bir xato uchun toifani NOTO'G'RI belgilaganda — xodim yoki bo'lim rahbari e'tiroz bildirishi mumkinmi, e'tiroz qaysi zanjirdan o'tadi, va e'tiroz tasdiqlansa AI model uchun "to'g'ri label" sifatida qaydga olinadimi? [⤳ ta'sir: EP-DIR-076, HR, LMS, AI integratsiya, E1]
