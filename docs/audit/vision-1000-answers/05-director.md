# DIR — 50 tavsiya-javob

1. `state_weights` JSONB bitta jadvalda (sozlanadigan master-data); director ekrandan o'zgartirsa `EP-DIR-001 dir.stateWeight.update` event audit-logga tushadi — barcha 5 ko'rsatkich (pul/ishlab chiqarish/buyurtma/xodim/sifat) vaznlari birga saqlanadi.
2. Timeout bo'lgan modul o'tgan kundagi qiymati bilan "qisman holat" hisoblanadi (null emas); director dashboardda "MES ma'lumoti kechikgan" sariq badge ko'rinadi — holat hisoblashni to'xtatilmaydi.
3. "Og'ish tezligi" (rate-of-change) alohida hisoblansin: 2 ketma-ket kunlik tushish trend sifatida belgilanadi; 3-kun ketma-ket tushishda `EP-DIR-005` alert — gradual yomonlashish erta aniqlanadi.
4. Ziddiyatli signallar holat formulasida VAZNLI o'rtacha bilan hal qilinadi (hech biri bekor qilinmaydi); director dashboardda "Ziddiyatli signal" sariq bannerda har ikkala ko'rsatkich alohida ko'rsatiladi.
5. Har kunlik holat IMMUTABLE arxivga tushadi (overwrite yo'q); o'zgartirilgan bo'lsa audit-log `changedBy/changedAt/prevValue/newValue` to'rtta maydon bilan qayd etadi — tarix o'zgarmas.
6. To'liqsiz kundalik SAQLANADI (majburiy emas), lekin "to'liqsiz" tegi bilan; director hisobotida to'liqsiz kundaliklar alohida filtrilanadi — qat'iy majburlov yo'q, statistika ko'rsatadi.
7. 3 kun ketma-ket "hal qilinmadi" — "surunkali muammo" kategoriyasiga tushadi va direktor + sababchi bo'lim rahbariga eskalatsiya boradi; chegara `dir_chronic_days` master-data'da sozlanadi (default=3).
8. Bo'lim rahbari O'Z kundaligini yozadi; director kundaligining FAQAT yig'ma holati (muammo/yechim EMAS) ko'rinadi (RBAC maydon darajasi); director barcha bo'lim kundaligini yig'ib ko'radi.
9. Null qaytgan ko'rsatkich uchun o'tgan kundagi qiymat ko'rsatiladi + "yangilanmagan" sariq teg; director dashboardda "HR xodim soni hisoblanmadi" toast bildirishnomasi chiqadi — bo'shliq ko'rinadi.
10. OKR kaskad uzilganda (karta arxivlansa) tizim "uzilgan bog'lanish" alert beradi + director o'zi qayta ulaydi (avtomatik qayta ulanish YO'Q — E1 printsipi: inson qaror qiladi).
11. Haftalik dekompozitsiya ishchi kunlar soniga mutanosib (teng emas); hafta oxirida bajarilish % — o'sha haftaning karta egasi (kartaga biriktirilgan xodim) kiritadi.
12. Vakant kartaga biriktirilgan vazifa yuqoridagi kartaga (bevosita rahbarga) eskalatsiya qilinadi; karta band bo'lganda vazifa kutish qatorida (pending) qoladi — avtomatik tayinlanmaydi.
13. Tarixiy ma'lumotlar ESKИ formula versiyasi bilan saqlanadi (immutable); hisobotda qaysi versiya ishlatilganligini ko'rsatish uchun `formula_version` ustuni kanonik — audit uchun eski versiya ustun.
14. Ko'rsatkich egasi o'zgarsa ONIY o'tish (overlap yo'q); yangi egaga eski kechikish tarixi to'liq KO'RINADI (mas'uliyat izchilligi uchun) — handoff hujjati email/NTF bilan yuboriladi.
15. Karta AI hisoboti 300ms timeout bo'lsa o'tgan kundagi qiymat ishlatiladi ("stale" teg bilan); holat formulasi bu kartani "qolib ketdi" deb hisoblamaydi — ma'lumot eskirgan, nol emas.
16. Real-time vs kunlik snapshot farqi sozlanadigan chegaradan (masalan >5%) oshsa eslatma beriladi; MES va FIN modullaridan keladigan farq eng kritik hisoblanadi — chegara master-data'da o'zgartiriladi.
17. Director "ko'rdim+bajaramiz" yoki "inkor etaman" belgilashi MUMKIN; bajarilmagan tavsiyalar keyingi kungi tahlilga "hali ochiq" sifatida ta'sir qiladi (qayta tavsiya og'irlashadi) — tavsiya tarixi saqlanadi.
18. Telegram /holat buyrug'i kelganda 07:00 cron'dan OXIRGI saqlanganini qaytaradi (real-time trigger emas); bu `company_state_log` jadvalidan olinadi — eskirgan ma'lumot sanasi ko'rsatiladi.
19. Kunlik digest (07:00) va holat alerti ALOHIDA xabar sifatida yuboriladi (birlashmaydi); Telegram'da avval digest, keyin alert — tartib aniq, ikkalasi o'z maqsadiga ega.
20. Tarixdagi kunlar ESKI daraja bilan arxivda qoladi (yangi chegara bo'yicha qayta baholanmaydi); bu immutable tarix printsipiga mos — yangi konfiguratsiya faqat keyingi kundan kuchga kiradi.
21. Director "zarur zakazlar" navbatini o'zgartirsa bu o'zgarish PP rejalashtirishga REAL VAQTDA event orqali ta'sir qiladi (`EP-DIR-054 dir.order.priority` event PP ga uzatiladi) — keyingi qo'lda qayta rejalashtirishni kutmaydi.
22. Operator/rahbar sabab tanlashdan bosh tortsa 2 soat kutiladi → eslatma, 4 soatdan keyin director + HR eskalatsiya oladi; "sabab ko'rsatilmagan" kechikishlar statistikada ALOHIDA kategoriya sifatida ko'rsatiladi.
23. Bir vaqtda bir nechta bo'limdagi downtime AGGREGATE + alohida breakdown ikkalasi ko'rsatiladi; director har downtime uchun "taniqladim, chora ko'rilmoqda" bayrog'ini bosa oladi (E1: inson tasdiqlaydi).
24. PP oy boshidan kesimi kanonik (reja birimi = oylik); MES kunlik fakt raqami oylik rejalashtirilgan kvotaga nisbatan hisoblanganda tenglashtiriladi — bu EP-DIR-036 uchun kanonik kesim.
25. Brak 3 kategoriya ALOHIDA ko'rsatiladi (QC qaytargan / MES qayd etgan / yetkazib berishda aniqlangan); director jami summani ham ko'radi — kategoriyalar aralashtirilmaydi (sabab tahlili uchun).
26. Bayram/smena o'zgarishi bo'lgan kunlar statistik outlier sifatida AJRATILADI va grafik'da alohida belgili (masalan, kulrang nuqta) ko'rsatiladi; bunday kunlar trend hisob-kitobida ixtiyoriy chiqarib tashlanadi.
27. Setup/ishlab chiqarish nisbati >30% bo'lsa AI "format optimizatsiyasi" tavsiyasi trigger bo'ladi; bir xil tavsiya 3 marta takrorlansa director dashboardda "eskalatsiya" tegi bilan alohida ko'rinadi.
28. "Zarar keltirayotgan buyurtma" faqat "eslatma" sifatida ko'rsatiladi — director bloklamaydi (E1: AI kuzatadi, inson qaror qiladi); blok uchun director + SD rahbari birgalikda qaror qilishi shart.
29. Eski yil buyurtmalari arxiv qatlamdan ochiladi; qidiruv natijasida "arxiv" belgisi bilan alohida ko'rsatiladi — yil formati (masalan 2025-0499) qidiruv filtri sifatida ishlaydi.
30. Ko'p-karta xodim holatida har karta o'z bo'limi/operatsiyasiga hissa qo'shadi (ulushga mutanosib, standart 0.5/0.5 yoki karta stavkasiga qarab); "qo'sh hissa" muammosi stavka-ulush cap bilan hal qilinadi (EP-ORG-066 bilan mos).
31. Director "bu anormallik, trend sifatida hisoblama" deb belgilash MUMKIN; belgilangandan keyin tizim o'sha kunni outlier sifatida trend hisob-kitobidan chiqaradi va AI model uchun "labeled exception" sifatida qayd etadi.
32. Vakant karta + ko'rsatkich pasayishi → alert yuqoridagi kartaga (bevosita rahbarga) va HR ga birga boradi; "vakant + past KPI" kombinatsiyasi "kritik vakansiya" prioriteti bilan eskalatsiya zanjiri hosil qiladi.
33. 2 marta eslatmadan keyin (sozlanadigan) bo'lim rahbarining o'z rahbariga avtomatik eskalatsiya ketadi; 3-marta ham topshirilmasa HR intizom tizimiga uzatiladi (E1: AI eslatadi, HR qaror qiladi — avtomatik jazo yo'q).
34. Director o'z bo'limi uchun "maxfiy kirish" logini real-time ko'rish huquqiga EGA; Super Admin barcha bo'lim loglarini ko'radi — RBAC: director=o'z scope, Super Admin=to'liq (Q144 tasdiq).
35. Energiya resurslari IoT schyotchik mavjud bo'lsa avtomatik, bo'lmasa qo'lda kiritiladi; qo'lda kiritilsa moliya bo'limi tasdiqlaydi; "o'tgan oy" bilan taqqoslash = (joriy − o'tgan) / o'tgan × 100% formula.
36. Smena aralashish riski alertini director + PP rejalashtiruvchi + smena ustasi bir vaqtda oladi; 30 daqiqa ichida "ko'rdim" belgilanmasa bevosita yuqori rahbarga eskalatsiya bo'ladi.
37. Director karta AI agregatidagi ro'yxatdagi kartaga to'g'ridan Kanban vazifasi yuborishimumkin (harakat qadami mavjud); hisobot faqat o'qish emas — "vazifa yubor" tugmasi ro'yxatdan ishlaydi.
38. 5S hodisasini QC tekshiruvi yoki IoT kamera aniqlaydi → AI belgilaydi → sifat bo'limi rahbari tasdiqlaydi (E1) → director dashboardga tushadi; avtomatik jarima YO'Q, tasdiqlangandan keyin HR intizom bog'lanadi.
39. Paddon zaxirasi kritik chegaraga tushganda alert WMS ga ham yetib boradi; "paddon sotib olish" PR avtomatik YARATILMAYDI (E1: AI kuzatadi, inson tasdiqlaydi) — director yoki WMS rahbari PR ni tasdiqlaydi.
40. Bir buyurtma bir nechta yo'nalishga tegishli bo'lsa ASOSIY yo'nalishga (ishlov hajmi ko'p bo'lgan) to'liq hisoblanadi; "aralash" buyurtmalar uchun alohida kategoriya KERAK EMAS — asosiy yo'nalish etarli.
41. Murakkab buyurtmalar uchun vaqt prognozi MES real vaqtda kuzatadi; prognozdan >15% ortiq vaqt ketayotgan bo'lsa director alert oladi (chegara sozlanadigan) — avtomatik kuzatuv, inson xabardor qilinadi.
42. "Bajarildi" milestone'ni FAQAT director yoki u vakolat bergan karta egasi belgilashi mumkin (RBAC); noto'g'ri belgilash uchun director o'zi qaytaradi (undo mavjud); har belgilash audit-logga tushadi.
43. Yangi versiya chiqarilganda faqat O'ZGARTIRILGAN bo'limlarga xodimlardan "tanishdim" imzosi so'raladi (to'liq qayta imzo emas); o'zgartirilmagan bo'limlarga oldingi imzo kuchda qoladi — versiya diff ko'rsatiladi.
44. Director darajasida yig'ma ko'rsatkich (nechta xodim nechtadan yutqazdi) ko'rinadi; natija LMS ga "qayta o'qish tavsiyasi" sifatida, HR razryad tizimiga "razryad ushlab turish" bayrog'i sifatida avtomatik uzatiladi.
45. "Lavozim vositasi yo'q" bayrog'i avtomatik IT bo'lim karrasiga (Coordination vazifasiga) yetib boradi; xodim shu vosita bo'lmay ishlagan kunlar log asosida hisoblab chiqariladi va director dashboardda ko'rsatiladi.
46. Director info-request yuborsa javob muddati sozlanadigan (default 24 soat); muddatda javob bermasa rahbarning rahbariga eskalatsiya boradi; javob bermaslik sanasi `EP-DIR-072` hisobot-reglament statistikasiga TUSHADI.
47. Chiqindi qayta ishlash foizi Moliya modulidagi "makulatura qayta sotish" kirimi bilan avtomatik bog'lanadi; (chiqindi kg − qayta sotilgan kg) farqi oylik GL'ga "yo'qotish" sifatida `entries` jadvaliga tushadi.
48. Faqat to'liq tugagan ishlar "fakt"ka kiradi (in-progress qo'shilmaydi); bu kanonik hisoblash usuli — director dashboardda "fakt" = yakunlangan, "in-progress" alohida ustun sifatida ko'rsatiladi.
49. Haftalik hisobot "yangilangan reja" ga nisbatan ko'rsatiladi (ustuvor yangi buyurtma qo'shilganda reja o'zgaradi); og'ish = yangilangan reja − fakt; "asl reja" arxivda saqlanadi va alohida toggle bilan ko'rinadi.
50. Xodim yoki bo'lim rahbari AI tomonidan noto'g'ri belgilangan xato tasnifiga e'tiroz bildirishimumkin; e'tiroz HR + director tasdig'idan o'tadi; tasdiq bo'lsa AI model uchun "corrected label" sifatida qayd etiladi va model o'rganish uchun ishlatiladi (E1: inson to'g'rilaydi).
