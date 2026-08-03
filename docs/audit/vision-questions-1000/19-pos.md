# POS — POS Monitor — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

1. EXTERNAL_IN 5-bosqich oqimida (DRAFT→KARANTIN→QC→OMBOR_MENEJER→AI_GL) har bosqich o'tishida qaysi event chiqariladi, event payload'da nima bo'lishi kerak va agar bitta bosqich 24 soatdan ortiq ochiq qolsa eskalatsiya qanday trigger bo'ladi? [⤳ ta'sir: QC, NTF, Coordination]

2. AI_GL bosqichi pos_gl_postings'ga emas, kanonik `entries` jadvaliga yozishi uchun qaysi servis, qaysi Debit/Credit hisob kodi qaysi movement_type/reason kombinatsiyasiga mos kelishi lozim — barcha 6 harakat turi uchun to'liq mapping qanday ko'rinadi? [⤳ ta'sir: Finance/GL, WMS]

3. Texkarta-material guard (EP-POS-032, QAT'IY BLOK) kod darajasida qaysi jadvaldan texkarta normasi o'qiladi, skaner natijasi (EAN-13 yoki Code-128) bilan qanday solishtiradi va smena/reja boshlig'i "ruxsat berish" harakati qaysi ustunda, qaysi holatda qaydlanadi? [⤳ ta'sir: PP (texkarta), MES, QC]

4. Oflayn rejimda (PWA) EXTERNAL_IN DRAFT yoziladi, keyin internet qaytadi va server sinxron qiladi — lekin o'sha vaqt ichida boshqa qurilmadan bir xil material batch uchun QC tasdiqlangan bo'lsa, to'qnashuv qanday aniqlanadi va "tekshirilsin" holatiga o'tkazish mexanizmi (EP-POS-070) qaysi jadval/ustunda qaydlanadi? [⤳ ta'sir: WMS (warehouse_stock), QC]

5. FIFO partiya yechish vaqtida bir xil material uchun bir necha ochiq rulon (qisman ishlatilgan) bo'lsa — dastur qaysi tartibda rulon qoldiqlarini sarflaydi, qoldiq nol bo'lganda keyingi partiyaga o'tish qanday ishlaydi va GL sum qaysi partiya narxlari bilan hisob-kitob qilinadi? [⤳ ta'sir: Finance/GL, WMS]

6. FEFO vs FIFO tanlovini material kartasida muddatli/muddatsiz belgi qanday saqlanadi, chiqimda avtomatik tanlov qaysi funksiyada amalga oshadi va muddati o'tgan material chiqimda bloklanadimi yoki faqat ogohlantiriladimi — shart qayerda? [⤳ ta'sir: QC, MM, WMS]

7. Smena topshirish akti (EP-POS-050, 2 imzo) PDF qanday shakllantiriladi: qaysi shablondan, kimning elektron imzosi (PIN yoki JWT-based), akt raqami ketma-ketligi qaysi jadvaldan, va akt imzolanmasa keyingi smenaning materiallari chiqimi bloklanadimi? [⤳ ta'sir: HR (javobgarlik), MES]

8. Foto-dalil (EP-POS-069) planshet kamerasidan olingan rasm qaysi storage'ga (lokal blob yoki S3-compat) saqlanadi, pos_movements jadvalidagi qaysi ustun/JSONB maydonga bog'lanadi va QC'ga uzatiladigan da'vo hujjatida shu foto qanday chiqadi? [⤳ ta'sir: QC, Finance (da'vo), MM]

9. Bin location tuzilmali manzil (Zona→Qator→Javon→Yacheyka, WMS-073) POS planshetida kirimda qanday kiritiladi — dropdown/skanerlash/freetext, va yacheyka sig'imi to'lganda yangi kirimni bloklash yoki ogohlantirish qaysi jadvalda va qaysi trigger bilan amalga oshiriladi? [⤳ ta'sir: WMS, IoT]

10. Material kartasi skanerlanganda topilmasa, "yangi kartochka yaratish + admin Telegram xabar" (EP-POS-078) oqimi: yangi material kartasi MM moduliga so'rov sifatida qaysi jadvalga tushadi, MM tasdig'idan oldin POS'da vaqtinchalik ID bilan harakat yozish mumkinmi va agar MM rad etsa vaqtinchalik yozuvlar qanday tozalanadi? [⤳ ta'sir: MM (master-data), NTF]

11. Qisman rulon chiqimi (EP-POS-068, bichish): 500 m rulondan 120 m kesildi — warehouse_stock'da qoldiq 380 m bo'lishi kerak, lekin bir vaqtda boshqa qurilmadan ham o'sha rulon chiqarilayotgan bo'lsa, optimistic lock yoki SELECT FOR UPDATE qanday qo'llanadi va raqamli "overspend" bo'lmashi kafolatlanadi? [⤳ ta'sir: WMS (warehouse_stock), MES]

12. Poddon/tara (EP-POS-038/039) qaytariladigan aktiv sifatida: alohida material kartasimi yoki aktiv reestri, chiqimda "N poddon ketdi" va kirimda "M poddon qaytdi" balansi qaysi jadvalda, va yo'qolgan poddon (N-M > 0 N kun o'tsa) uchun Finance'ga avto-yozuv yoki signal qanday chiqadi? [⤳ ta'sir: Finance, IoT, MM]

13. Lab namunasi chiqimi (EP-POS-049, alohida sabab): namuna miqdori GL'ga qanday tushadi (iste'mol xarajatimi yoki QC xarajatimi), QC laborant tasdig'i bu harakatni "yopish" uchun kerakmi va QC xulosasi salbiy bo'lsa namuna chiqimi teskari harakat (storno) bilan qaytarilishi mumkinmi? [⤳ ta'sir: QC, Finance/GL]

14. Omborchi GSD uchun 3 ko'rsatkich (reja% + kechikish soni + og'ish soni, EP-POS-056) qanday formula bilan hisoblanadi: "reja" PP modulining kunlik reja jadvalidan keladimi, "kechikish" qaysi vaqt chegarasi bilan aniqlanadi va bu ko'rsatkichlar HR karta profiliga qachon (real-time yoki cron) yoziladi? [⤳ ta'sir: HR (karta GSD), PP, Director]

15. AI anomaliya detektori (EP-POS-020/077): smena jadvalidan tashqari vaqtdagi harakat va norma-oshiq chiqim qanday formulada "shubhali" deb belgilanadi, belgilash avtomatik (AI) sodir bo'ladi va salbiy ta'sir (blok/jarima) faqat boshliq tasdiqlashi bilan bo'ladi — bu ikki bosqich qanday alohida holatlarda saqlanadi? [⤳ ta'sir: AI, HR, NTF]

16. Buyurtma rezervi (EP-POS-066): PP "reja" materiallarni band qiladi — warehouse_stock'da "jami qoldiq" va "erkin qoldiq" alohida ustunlardami yoki view orqali hisoblanadimi, rezerv qo'yish/olish PP tomonidan event orqali keladimi yoki POS servisi to'g'ridan POS'da hisoblaydi? [⤳ ta'sir: PP, WMS]

17. Shoshilinch/rejasiz chiqim (EP-POS-067): majburiy sabab + boshliq darhol xabardor qoidasi qanday avtomatlashtiriladi — event published, boshliq Telegram'ga push keladimi, va shoshilinch chiqim PP kunlik reja balansiга qanday ta'sir qiladi (reja kamaytiriladi yoki og'ish hisobiga o'tadimi)? [⤳ ta'sir: PP, NTF, Coordination]

18. Buyurtma o'zgarishi reaktsiyasi (EP-POS-076): SD/PP tomonidan buyurtma o'zgarganda POS qanday event/webhook orqali xabardor bo'ladi, chiqarilgan materiallar ro'yxati PP yangi texkarta bilan solishtiriladi va "qaytarish taklifi" POS planshetida qanday UX ko'rinishida chiqadi? [⤳ ta'sir: SD, PP, MES]

19. Mijoz materiali — davallcheskoye (EP-POS-062): alohida material turi sifatida warehouse_stock'da qanday ajratiladi (tur ustunmi yoki alohida ombor kodi), chiqim GL'ga tushmaydi degan holat qaysi GL mapping qoidasi bilan amalga oshiriladi va mijozga qaytarilganда EXTERNAL_OUT emas qanday harakat turi ishlatiladi? [⤳ ta'sir: Finance/GL, SD, WMS]

20. Makulatura ombori (EP-POS-037, fayl-pending): ishlab chiqarish jarayonida hosil bo'lgan qog'oz qoldiqlari qaysi harakat turi (DAMAGE yoki alohida tur) bilan makulatura omboriga o'tadi, makulatura sotuvi EXTERNAL_OUT bilan amalga oshiriladimi va GL'da xom-ashyo tannarxidan qanday qoldiq qiymat saqlanadi? [⤳ ta'sir: Finance/GL, MM, QC]

21. Qisman/buzuq qabul (EP-POS-052): yetkazib beruvchi 1000 kg o'rniga 850 kg keltirdi va 50 kg buzuq — qabul akti 3 qatorga bo'linadimi (850 qabul + 50 DAMAGE_QUARANTINE + 100 ochiq-qoldiq), ochiq-qoldiq MM'da zakaz_lines'da "yetkazilmagan qoldiq" sifatida qoladimi va supplier debit-nota qaysi modulda chiqariladi? [⤳ ta'sir: MM, QC, Finance]

22. Inventar sikl-sanash (EP-POS-017): har kuni bir guruh material sanaladigan holda guruhlarni taqsimlash qaysi jadvalda saqlanadi (material_id + sana), sanoq natijalari kirish vaqtida warehouse_stock real harakatlar bilan bir vaqtda bo'lishi mumkin — concurrent write lock qanday hal qilinadi? [⤳ ta'sir: WMS, Finance/GL]

23. Inventar farqi avto-tasdiq limiti (EP-POS-064, ±1% WMS-060): POS da foiz limitni sozlash qaysi master-data jadvali/admin ekranida bo'ladi, limitdan oshgan farqlar Finance'ga "tekshirilsin" holatida tushadi va Finance tasdiqlaganda GL yozuv qanday tuziladi (kamomad/ortiqcha uchun har xil hisob)? [⤳ ta'sir: Finance/GL, WMS]

24. Boshlang'ich qoldiq (EP-POS-079) bir martalik to'liq inventar vaqtida boshqa modullar (MES ishlab chiqarish, SD jo'natish) davom etishi mumkinmi yoki tizimda vaqtinchalik "freeze" holati bo'ladimi, va boshlang'ich qoldiqdan keyin GL opening balance yozuvi qaysi hisoblarga, kim tomonidan tasdiqlangandan so'ng yoziladi? [⤳ ta'sir: Finance/GL, MES, WMS]

25. Bekor turish (prostoy) signali (EP-POS-041): sex xodimi "material kutyapman" tugmasini bosadi — vaqt sanog'i (stopwatch) qaysi jadvalda boshlanadi, omborchi va boshliqqa parallel Telegram chiqadimi va bu prostoy vaqti MES downtime hisobiga qanday ulanadi (MES sessiya ID bilan bog'liqmi)? [⤳ ta'sir: MES, Coordination, HR (logist GSD), NTF]

26. EXTERNAL_OUT tayyor mahsulot jo'natishida SD to'lov tekshiruvi: Finance'dan mijozning kredit-limit/qarz holati real-time keladimi, limit oshganda POS blok boshliq + Finance ham xabardor qiladimi, va qisman to'lov (avans bor lekin to'liq emas) holati uchun qanday ruxsat darajasi mavjud? [⤳ ta'sir: Finance (kredit-limit), SD, NTF]

27. Xodimning "Mening inventarim" sahifasi (POS-D4): moddiy javobgarlik balansi — xodimga biriktirilgan materiallar pos_movements'dan agregat hisoblanadimi yoki alohida employee_inventory jadvalida saqlanadimi, va xodim ishdan chiqganda "hamma narsa qaytarilsin" cheklisti qanday avtomatik yaratiladi? [⤳ ta'sir: HR, Finance]

28. Barcode label chop etish (EP-POS-007, ZPL/EPL/PDF): EXTERNAL_IN tasdiqlanganda label avto-chop etish trigger qaysi event/cron orqali ishlaydi, printer topilmasa (offline printer) label queue'ga tushadimi va label formati (EAN-13 vs Code-128) material kartasidagi qaysi belgiga qarab avtomatik tanlanadi? [⤳ ta'sir: MM (barcode), IoT (printer)]

29. Storno (teskari harakat) mexanizmi (EP-POS-022): tasdiqlangan harakat uchun teskari harakat yaratilganda GL'da ham teskari yozuv avto chiqadimi, storno'da original harakat ID saqlanadimi (FK), va kimdir bir harakatga ikki marta storno qo'yishini oldini oladigan guard qayerda? [⤳ ta'sir: Finance/GL, Audit]

30. Norma-fakt og'ish ogohlantirishi (EP-POS-044): qizil ogohlantirish + sabab so'rash trigger — "norma" PP texkartasidan keladimi yoki material kartasidagi standart sarfdan, sabab kiritilmasa harakat to'xlaydi (blok) yoki faqat qaydlanadimi, va ortiqcha sarf sabablari katalogi (brak/qayta-sozlash/boshqa) qaysi jadvalda master-data sifatida saqlanadi? [⤳ ta'sir: PP, Finance, AI]

31. FG (tayyor mahsulot) MES sessiyasidan POS omboriga kirim (EP-POS-024): MES `production_sessions` yopilganda qanday event published bo'ladi, POS uni qanday subscribe qiladi va FG kirmidan oldin QC final tekshiruvi (sifat gate) o'tishi shart bo'lsa, QC tasdiqlash POS harakat holatini qanday o'zgartiradi? [⤳ ta'sir: MES, QC, WMS]

32. Rulon og'irlik/sertifikat per-qator (POS-FIX3): kirim wizardida har rulon uchun alohida og'irlik va sertifikat raqami — bu ma'lumotlar qaysi jadval (pos_movement_items yoki alohida pos_movement_rolls)da saqlanadi, QC lab xulosasi raqami bilan qanday bog'lanadi va FIFO partiya narxi rulon og'irligiga qarab hisob-kitob qilinadimi? [⤳ ta'sir: QC, Finance/GL, MM]

33. STIR/INN (POS-FIX1) supplier_tin ustuni: EXTERNAL_IN aktida yetkazib beruvchi TIN majburiy maydondami, TIN MM vendor kartasidan avto to'ldirilsa ham operatorga ko'rsatiladimi va TIN tekshiruvi (format validatsiya) BE yoki FE da amalga oshiriladi? [⤳ ta'sir: MM (vendor), Finance (hujjat)]

34. Valyuta (POS-FIX2) kirim paytida: FE valyuta maydonini yuborishi uchun qaysi API field, pos_movements.currency ustuniga MB kursi ham saqlanadimi (kirim kuni), va FIFO qiymat hisoblashda valyuta konversiyasi qaysi kurs bilan (kirim kuni MB kursi) amalga oshiriladi? [⤳ ta'sir: Finance/GL, MM]

35. Xodimning POS'ga kirishida rol va ombor bog'ligi: HR'da xodimning bo'limi o'zgarganda POS ombor ko'rinishi real-time avtomatik yangilanadimi (event/webhook), yoki faqat keyingi login'da, va bir xodim bir vaqtda 3 bo'lim omboriga ega bo'lsa interfeysdagi ombor tanlash UX qanday ishlaydi? [⤳ ta'sir: HR, Org-karta, NTF]

36. AI rejaлаshtirish tomonidan minimal qoldiq pasayganda avto purchase request (EP-POS-065): AI taklif MM'ga qanday jadvalga yozadi, PR tasdiqlash MM modulida standart oqimimi yoki POS'dan alohida, va POS harakati bilan bir vaqtda PR yaratilsa (race condition) ikki PR yaratilmaslik uchun idempotency qanday ta'minlanadi? [⤳ ta'sir: MM (snabjeniye), Finance (byudjet)]

37. Cron-asosli muddatli material ogohlantirishi (EP-POS-060, FEFO): har kecha cron ishi qanday vaqtda ishga tushadi, "muddatga N kun qolganda ogohlantir" N qiymati material kartasida sozlanishi kerak, va bir xil material uchun bir kun ichida takroriy ogohlantirish yuborilmaslik uchun qanday "already_notified" belgi saqlanadi? [⤳ ta'sir: QC, MM, NTF]

38. POS harakatini kim ko'ra olishi (RBAC maydon darajasida): ombor menejeri barcha bo'lim harakatlarini ko'radimi yoki faqat o'zinikini, moliya faqat GL summasini ko'radimi, va foydalanuvchi o'ziga tegishli bo'lmagan harakat yozuvini URL'dan to'g'ridan fetch qilsa 403 qaytarish qaysi guard/interceptorда? [⤳ ta'sir: HR, Finance, Org-karta]

39. Dispatch-trigger (EXTERNAL_OUT, SD integratsiya): POS EXTERNAL_OUT tasdiqlanganda SD'dagi buyurtma holati ("Yetkazildi" yoki "Qisman yetkazildi") qanday avto-yangilanadi, GL revenue yozuvi (Debit AR / Credit Revenue) kimning tasdig'i bilan (faqat moliya yoki AI_GL avto) va yetkazilmagan qoldiq SD'da ochiq qoladimi? [⤳ ta'sir: SD, Finance/GL]

40. Telegram Mini App (EP-POS-071) orqali barcode skan va tasdiq: Mini App WebApp webhook POS backend'ga JWT bilan ulanadimi yoki bot token bilan, offline rejimda Mini App ishlaydi yoki faqat online, va Mini App'dan tasdiqlash tugmasi bosilganda POS harakat holati qanday sinxron o'zgaradi? [⤳ ta'sir: NTF (Telegram), IoT]

41. Audit log 7 yil saqlash (A6): pos_movements va pos_movement_items jadvallari uchun DB partitioning qanday rejada (yillik partition yoki arxiv jadval), 3 yildan eski yozuvlar arxivga ko'chirilganda POS'dagi "harakat tarixi" sahifasi arxivdagilarni ham fetch qila oladimi va arxiv DB'si bitta instance'dami? [⤳ ta'sir: WMS, Finance, HR]

42. GL yozuv narx/og'irlik tekshiruvsiz 0/manfiy o'tishi (POS-FIX4): Zod schema bilan BE'da narx > 0 va og'irlik > 0 validatsiyasi qaysi DTO klassida, FE'da ham client-side validatsiya kerakmi va agar 0 narxli kirim o'tib ketgan bo'lsa (mavjud ma'lumot) GL correction harakat qanday amalga oshiriladi? [⤳ ta'sir: Finance/GL, QC]

43. Ichki ko'chirish (INTERNAL_TRANSFER) bir xil ombor turi — "tezkor, tasdiqsiz" qoidasi: "bir xil tip" nimani anglatadi (bir xil ombor_type kodi yoki bir xil bo'lim), tezkor harakatda GL yozuv ham avto chiqadimi yoki faqat stock ko'chirish, va tezkor harakatni kimdir qaytarishni (storno) so'rasa oddiy tartibda menejer ruxsati kerakmi? [⤳ ta'sir: Finance/GL, WMS]

44. POS Monitor PWA service worker: offline yozilgan harakatlar IndexedDB'da saqlanadi va internet qaytganda background sync trigger bo'ladi — sync payload qanchalik katta bo'lishi mumkin (yuzlab harakat), server-side idempotency key qanday (UUID, timestamp, device_id kombinatsiyasi) va sync muvaffaqiyatsiz bo'lsa retry soni/intervalí qanday? [⤳ ta'sir: WMS (warehouse_stock), GL]

45. Xodim uchun "chiqishda hamma narsa qaytarilsin" cheklisti (POS-D4): HR "xodim ishdan chiqdi" eventi kelib tushganda POS avtomatik outstanding_items ro'yxatini generatsiya qiladimi, bu ro'yxat kimga (HR menejer, ombor menejer) Telegram'ga chiqadi va barcha inventar qaytarilmasa HR moduli xodim access blokladimi? [⤳ ta'sir: HR, NTF, Finance]

46. Yetkazib beruvchiga qaytarish kredit-nota (EP-POS-059): QC CHIQARISH qarori POS'da EXTERNAL_RETURN harakati yaratadimi yoki MM modulida alohida oqim, kredit-nota Finance'da debit vendor / credit inventory yozuvi kimning tasdiqi bilan avtomatlashtiriladi va MM vendor reytingiga "qaytarish foizi" qanday formula bilan ta'sir qiladi? [⤳ ta'sir: MM, QC, Finance]

47. IoT lak/bo'yoq ombori (IOT-061 OCHIQ-JAVOBLAR): bo'yoq ombordan chiqim vaqtida IoT stanok sensoridan "bo'yoq tugadi" signali va POS chiqim harakati bir-biriga qanday bog'lanadi (stanok job ID → POS buyurtma ID), ikki tomondan yozuv kelsa duplikat oldini olish qanday kafolatlanadi? [⤳ ta'sir: IoT, MES, PP]

48. Multi-currency FIFO: dollarlik ham, so'mlik ham kirim bir materialda bo'lsa, FIFO tartibida qaysi partiya avval ketsa GL yozuvi qaysi valyutada, konversiya kuni (kirim kuni MB kursi) partiya_id bilan birga saqlanadimi va ombor qiymati hisobotida bir valyutaga standartlashtirilgan qiymat qanday ko'rsatiladi? [⤳ ta'sir: Finance/GL, WMS, MM]

49. Operator IoT-tablet va POS planshet bir qurilmami: sex operatori MES brak kiritish + POS material chiqim harakatini bitta qurilmadan qila oladimi (ikkala modul bir responsive web'da), yoki alohida qurilmalar tavsiya etiladi va agar bitta qurilmadan ishlasa MES sessiya ID POS harakat metadata'siga avtomatik bog'lanadimi? [⤳ ta'sir: MES, IoT, PP]

50. Director dashboardida POS ko'rsatkichlari (EP-POS-075): Director real-time ko'rishi kerak bo'lgan POS aggregatlar (bugungi kirim/chiqim summa, karantin materiallar soni, norma-oshiq ogohlantirishlar) qaysi DB view yoki materialized view'dan keladimi, refresh davriylik qanday (real-time CDC yoki 5-daqiqalik cron) va Director uchun drill-down harakatga bog'liq GL summasigacha boradimi? [⤳ ta'sir: Director, Finance/GL, AI]
