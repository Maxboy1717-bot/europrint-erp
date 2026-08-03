# NTF — Bildirishnoma / Telegram — 50 vizyon savoli (avtomatlashtirish + edge-case + modullararo)

> Manba: `decisions/18-notifications.md` (EP-NTF-001..082 allaqachon hal) + OCHIQ-JAVOBLAR + LOYIHA-QOIDALARI.
> Bu savollar 82 ta mavjud savol CHUQURLIGIDAN PASTDA: amalga oshirishda zarur edge-case, chegara, poydevor va modullararo integratsiya savollari.

1. Per-modul bot arxitekturasi: har modul (20 ta) uchun alohida Telegraf.js bot instansiyasi yaratilsa, ularning token boshqaruvi qanday — `ConfigService`da har modul uchun alohida env o'zgaruvchi (`TELEGRAM_BOT_HR_TOKEN`, `TELEGRAM_BOT_WMS_TOKEN`...) yoki bitta dispatcher-bot va webhook routing? [⤳ ta'sir: A8 stack, F6 secret, barcha 20 modul]

2. `ntf_notifications` yoki `notification_log` jadvalining kanonik DDL: qaysi ustunlar majburiy (recipient_card_id / recipient_user_id / channel / priority / status / sent_at / ack_at / escalated_at / module_code / op_code / payload_json / immutable)? Bitta jadval barcha modulga yetadimi yoki module_code bo'yicha partitioning kerakmi? [⤳ ta'sir: Audit-log (A6), EP-NTF-027/080, H4 2-dunyo tekshiruvi]

3. `ntf.route.byCard` (EP-NTF-066): xodim kartadan tushirilgan (bo'sh karta) paytda o'sha kartaga yo'naltirilgan bildirishnoma kimga boradi — vaqtinchalik i.o. (ORG-060) kartaga bog'langan bo'lsa i.o.ga, yo'q bo'lsa rahbarga eskalatsiya, yoki xabar navbatda kutib tursinmi? [⤳ ta'sir: Org-karta (i.o. mexanizmi), eskalatsiya EP-NTF-017]

4. `ntf.quiet.criticalException` (EP-NTF-063): KRITIK darajani kod qanday aniqlaydi — `priority = 'CRITICAL'` maydon yetarlimi yoki alohida `bypass_quiet_hours: boolean` bayroq kerakmi? KRITIK xabar tun soati 02:00 da kelsa, Telegram delivery guarantee qanday ta'minlanadi (Telegram API rate-limit 1/saniya)? [⤳ ta'sir: IoT (EP-NTF-048/029), cron, MES]

5. `ntf.resend.schedule` (EP-NTF-082): muhim xabar ko'rilmasa qayta yuborish — "ko'rilmadi" qanday aniqlanadi? Telegram `message.read` callback yo'q (faqat delivery); ack faqat inline keyboard tugmasi bosilganda hisoblanadimi? Agar xodim Telegram'dan chiqib ketgan bo'lsa (offline) qayta yuborish besamar — bu holat qanday ko'rib chiqiladi? [⤳ ta'sir: EP-NTF-016 ack, EP-NTF-017 eskalatsiya]

6. `ntf.bot.rbac` (EP-NTF-022): `/company_state` komandasi faqat direktor va egasiga — operatordan so'rov kelsa bot nima qaytaradi (xabar matni)? Yangi `/my_gsd` komandasi jo'natilsa, lekin xodimning `telegram_id` ERP'dagi `user.telegram_id` bilan bog'liq bo'lmasa (EP-NTF-023 onboarding tugalamagan) — qanday xato xabari, qanday ulanish havolasi? [⤳ ta'sir: Auth/RBAC, HR onboarding]

7. `ntf.user.onboard` (EP-NTF-023): yangi xodim Telegram'ga ulanish uchun bir martalik kod (OTP yoki deep-link `t.me/bot?start=TOKEN`) qancha vaqt amal qiladi? Muddati o'tsa HR qanday qayta yuboradi — ERP'dan tugma bosish yetarlimi? Bir xodim ikki telefonda bir botga ulanishga harakat qilsa (`telegram_id` takror) qanday bloklanadi? [⤳ ta'sir: HR (xodim qo'shish), Auth]

8. Bir xodim bir vaqtda KO'P kartaga ega (ORG karta-model: profil yig'indi) — har karta uchun alohida bildirishnoma oqimi bo'ladimi yoki xodim profiliga birlashtirilgan bir xabar? Masalan, xodim ombor kartasi + sifat kartasiga ega — ikkala modul bot bir vaqtda signal yuborsa Telegram spam bo'lmaydimi? [⤳ ta'sir: Org-karta (ko'p-karta), EP-NTF-019 per-modul bot]

9. `ntf.digest.schedule` (EP-NTF-003): egasi har modul uchun cron vaqtini ERP ichidan o'zgartirsa (`notification_schedules` jadval yoki boshqa master-data) — bu o'zgarish BullMQ/cron job'ga QANDAY real-time ta'sir qiladi? `CronService.updateJob()` yoki restart kerakmi? Xato bo'lsa (noto'g'ri cron expression) foydalanuvchiga qanday xabar? [⤳ ta'sir: Cron (BullMQ), admin UI, EP-NTF-007]

10. `ntf.archive.immutable` (EP-NTF-080): xabarni o'chirmaslik — DB darajasida qanday ta'minlanadi? `DELETE` taqiq (RLS policy yoki trigger), yoki `deleted_at` maydon bilan softdelete? Egasi arxivni "o'chirdi" deb o'ylaydi lekin aslida faqat ko'rinishdan olib tashlanadi — bu UX qanday tushuntirilishi kerak? [⤳ ta'sir: Audit-log, QC (ОТК arxivi), F5 immutable]

11. `ntf.techcard.error15min` (EP-NTF-033): 15 daqiqa taymer NTF ichida boshlanadimi yoki PP/QC moduli event chiqarib NTF faqat yetkazuvchi? Agar bosh texnolog 15 daqiqada javob berib "tushundim" desa, lekin tuzatmasdan 1 soat o'tsa (EP-NTF-034 alohida taymer) — ikki taymer bir-biridan mustaqilmi yoki birinchisi yopilsa ikkinchisi boshlanadimi? [⤳ ta'sir: QC/PP (tex-karta), eskalatsiya]

12. `ntf.escalate.vertical` (EP-NTF-017): manager_id zanjiri bo'yicha eskalatsiya — `employees.manager_id` NULL bo'lgan (0/30 ta NULL — memory: transmission_map) xodim uchun eskalatsiya qayerga ketadi? Birinchi non-NULL manager_id topilmaguncha qancha darajaga ko'tariladi (maksimal chuqurlik cheklovi bormi)? [⤳ ta'sir: Org-struktura (manager_id backfill), Coordination]

13. `ntf.responsibility.split` (EP-NTF-038): xabar yuborildi + qabul qilindi + ko'rildi — "ko'rildi" vaqtini Telegram API'dan olish mumkin emas (faqat delivery); shuning uchun "ko'rildi" = inline keyboard `buttonCallbackQuery` bosilganda yoki ERP'da "o'qidim" tugmasi boricha yetarlimi? Bu "masъuliyat tasdiq" sifatida yuridik kuchga egami (F5 immutable)? [⤳ ta'sir: Audit-log, F5]

14. `ntf.verbal.trackWritten` (EP-NTF-032): og'zaki topshiriq 24 soat ichida yozma qayd talab — "og'zaki topshiriq" ERP'ga qanday kiritilinadi? Kanban'da "og'zaki" belgili vazifa yaratiladimi, yoki faqat Telegram xabaridan NTF aniqlaydi? Yozma qayd topilmasa eslatma qaysi moduldagi qaysi jadvalni tekshiradi? [⤳ ta'sir: Kanban (vazifa yaratish), Coordination]

15. `ntf.staleData.warn` (EP-NTF-070): tex-karta yangilansa eski versiyani ochganlarga signal — "kim ochgan" qanday aniqlanadi? Browser/session darajasida kuzatish kerakmi yoki oxirgi ochilgan versiyani `user_last_seen_version` saqlanadimi? Hujjat versiyasi `doc_version` avtomatik oshishi PP/QC qaysi event'dan kelib chiqadi? [⤳ ta'sir: PP (tex-karta), Dizayn, F5 versiya tarixi]

16. `ntf.plan.broadcast` (EP-NTF-057): reja o'zgarishi barcha bog'liq bo'limlarga e'lon — "bog'liq bo'limlar" `workflow_rules` jadvalidan olinadimi (Coordination gorizontal marshrut) yoki har buyurtma kartasida bog'liqlar ro'yxati bormi? Agar 10+ bo'lim bog'liq bo'lsa Telegram API rate-limit (30 xabar/saniya) qanday boshqariladi (BullMQ queue throttle)? [⤳ ta'sir: PP, Coordination (workflow_rules), BullMQ]

17. `ntf.call.log` (EP-NTF-072): "qo'ng'iroq qildim" tugmasi — bu bot inline keyboard tugmasimi yoki ERP web-interfeys tugmasimi? Tungi vaqtda xodim faqat telefonida (Telegram mobil), kompyuterda emas — bot uchun qulay, ERP emas; qaysi kanal PRIMARY hisoblanadi? [⤳ ta'sir: EP-NTF-035 tungi protokol, UX]

18. `ntf.written.formalize` (EP-NTF-031): Telegramdan kelgan 6 turdagi xabar (qaror/reja/vazifa/texkarta/sifat/ogohlantirish) "rasmiy yozuv"ga aylanishi — bu avtomatik NLP/regex bilan aniqlanadimi yoki yuboruvchi xabar turini qo'lda tanlaydi (inline keyboard: "Bu xabar turi: ...")?  Noto'g'ri toifalanish xavfi bormi va kim tuzatadi? [⤳ ta'sir: Audit-log, Coordination, QC]

19. `ntf.kanban.stuck` (EP-NTF-074): kartochka statusda "qotib qoldi" — "belgilangan vaqt" har status uchun alohida sozlanishi kerak (masalan "Tekshiruvda" 2 soat, "Reja" 1 kun) yoki bitta global chegara? Bu sozlama qayerda saqlanadi (`kanban_column_sla` jadval yoki `notification_thresholds`)? [⤳ ta'sir: Kanban, Coordination, master-data]

20. `ntf.defect.routeByRole` (EP-NTF-059): brak signali rol bo'yicha yo'naltiriladi — "brak tabiati" (texnik / mijoz / logistika) kim belgilaydi? Brak kiritilganda (IoT tablet operator — EP-HR-057) operator rol tanlay oladimi yoki bu QC/texnologning vazifasimi? Noto'g'ri toifalanishdan keyin yo'naltirishni kimga qayta yo'llash mumkin? [⤳ ta'sir: QC, IoT tablet, CRM/Savdo]

21. `ntf.order.stage` (EP-NTF-024): oltin-ip buyurtma holati har bosqichda bildirishnoma — `sales_orders.status` o'zgarishi NTF'ga qanday yetib keladi? `EventEmitter2` event `OrderStatusChangedEvent` chiqaradimi yoki polling? Agar MES ishlab chiqarish bosqichini yangilasa lekin PP rejasi hali tasdiqlanmagan bo'lsa — ziddiyatli holat qanday hal qilinadi? [⤳ ta'sir: SD, PP, MES, EventEmitter2]

22. `ntf.material.shortage` (EP-NTF-047): xom-ashyo yetishmasligi signali — WMS `warehouse_stock` jadvalida min/max chegaradan oshsa darhol event chiqadimi yoki cron tekshiruvi (har N daqiqada)? Bir vaqtda 5 ta material yetishmasligi aniqlansa 5 ta alohida xabar yuborilsa Telegram spam — ularni bitta xabarga yig'ish (batching) qanday amalga oshiriladi? [⤳ ta'sir: WMS (warehouse_stock), MM (Ta'minot), PP]

23. `ntf.equipment.fault` (EP-NTF-048): jihoz nosozligi IoT'dan kelsa — IoT event `EquipmentFaultEvent` NTF'ga qanday keladi? `@OnEvent('iot.equipment.fault')` NestJS listener? Agar IoT server offline (internet uzildi — A5 offline rejim) va nosozlik yuz bersa bildirishnoma qachon yetkaziladi (outbox pattern — offline > online kelganda)? [⤳ ta'sir: IoT, MES, BullMQ outbox, A5 offline]

24. `ntf.shift.handover` (EP-NTF-078): smenalararo topshirish — `shift_handovers` (VIEW yoki real jadval — memory: poydevor_reaudit mes_shift_handovers=VIEW over shift_handovers) dan ochiq ishlar qanday olinadi? VIEW bo'lsa yozish qaysi asosiy jadvalga? Handover xabari keyingi smena texnologiga Telegram'da _qachon_ yuboriladi — smena boshlanish vaqtidan 15 daqiqa oldinmi? [⤳ ta'sir: MES (smena), PP, mes_shift_handovers]

25. `ntf.group.bindOrg` (EP-NTF-009): har org-tugun uchun Telegram guruhi — guruh `chat_id` qayerda saqlanadi (`org_nodes.telegram_chat_id` ustun)? Guruh o'chirilsa yoki bot chiqarilsa (`403 Forbidden`) xabar yetkazilmaydi — bu xato qanday ushlangadi va NTF fallback sifatida nima qiladi (shaxsiy chat yoki ERP ichki xabar)? [⤳ ta'sir: Org-struktura, Coordination]

26. `ntf.monthly.responsibilityDigest` (EP-NTF-068): oylik masъuliyat tahlili — `ntf_notifications` dan "qaror → masъul → natija" olindi, lekin natija boshqa modulda (Kanban/PP/QC) — cross-module agregat kim yig'adi? NTF moduli boshqa modullarning service'larini inject qiladimi yoki har modul o'z "oylik xulosasi" event'ini chiqaradimi? [⤳ ta'sir: Coordination, Kanban, QC, Совершенствование]

27. `ntf.type.badges` (EP-NTF-061): xabar turi belgilari (🔴 signal / ⏰ muddat / ✅ tasdiq / 📋 qaror / 📊 digest) — Telegram xabari matnida emoji ishlatish loyiha qoidasiga zidmi (CLAUDE.md: "emoji yo'q")? Yoki bu faqat ERP UI uchun tegishli va Telegram kanal emoji ishlata oladimi? [⤳ ta'sir: Dizayn (G1), i18n, A4]

28. `ntf.template.edit` (EP-NTF-028): egasi xabar shablonini ERP'dan tahrirlaydi — shablon i18n aware bo'lishi kerak (UZ/RU/UZ-CYR — 3 til, EP-NTF-015). Shablon o'zgartirilsa mavjud queued xabarlar (BullMQ'da kutayotgan) yangi shablon bilan yuboriladi yoki eski? `{firstName}`, `{orderNumber}` placeholder'lar qanday validate qilinadi (noto'g'ri kalit kiritilsa)? [⤳ ta'sir: i18n, BullMQ, admin UI]

29. `ntf.digest.attachPdf` (EP-NTF-020): digest PDF biriktirish — PDF Reports moduli tomonidan generatsiya qilinadi; agar Reports servisi javob bermasa (503) digest kutib turadimi yoki PDF'siz yuboriladi (fallback)? Telegram fayl hajmi 50 MB cheklovi — katta PDF bo'lsa nima bo'ladi (compression yoki link)? [⤳ ta'sir: Reports, Telegram API (50MB limit)]

30. `ntf.digest.leaderboard` (EP-NTF-012): haftalik digest top-3 va past-3 — "past-3" xodim ismi Telegram guruhida ko'rinsa bu ommaviy uyat (шейминг) hisoblanadi va E1 prinsipiga zid (salbiy ta'sir faqat inson tasdig'i bilan). Leaderboard faqat "top-3 ijobiy" ko'rsatilib, "past-3" faqat rahbarga shaxsiy yuborish kerakmi? [⤳ ta'sir: E1 (AI→inson tasdiq), HR/KPI, gamifikatsiya]

31. `ntf.plan.midOrderChange` (EP-NTF-073): buyurtma tugamay reja o'zgartirish signal — bu PP modul eventimi? Agar PP MES buyurtmani `Jarayonda` statusida qaytargan bo'lsa reja o'zgartirishni bloklanadimi yoki faqat signal yuborib davom ettiradimi? "Sabab" majburiy — PP UI da modal dialog kerakmi? [⤳ ta'sir: PP, MES, Coordination]

32. `ntf.scope.violation` (EP-NTF-076): bo'lim chegarasini buzish signali — "vakolatdan tashqari qaror" qanday avtomatik aniqlanadi? Masalan dizayner ombor buyurtma bersa — bu `workflow_rules` da "dizayn → ombor harakati taqiq" qoidasimi? Yoki faqat rahbar qo'lda "chegara buzildi" belgilaydimi? [⤳ ta'sir: Coordination (workflow_rules), Org-struktura]

33. `ntf.dataRequest.deadline` (EP-NTF-069): rasmiy ma'lumot talabi muddati — Совершенствование bo'limi ma'lumot so'raganda muddat taymer NTF tomonidan boshqariladi; agar ma'lumot berishga mas'ul bo'lim shu vaqtda ta'tilda yoki kasalda bo'lsa — i.o. (ORG-060) avtomatik bildirishnoma oladimi? [⤳ ta'sir: Совершенствование, Org-struktura (i.o.), HR]

34. `ntf.report.aggregateVertical` (EP-NTF-065): vertikal agregat — operator detali → bo'lim xulosasi → departament xulosasi — bu agregat NTF digestda REAL VAQTDA hisoblananadimi yoki kechasi cron? Operator soni 30+ bo'lsa agregat hisoblash DB'ni qanchalik yuklaydi (N+1 query xavfi)? [⤳ ta'sir: Org-struktura, Reports, DB performance]

35. `ntf.ack.button` (EP-NTF-016): muhim xabarda tasdiq tugmasi — inline keyboard `callback_data` da xabar ID va harakat turi ('ACK', 'READ', 'CONFIRM') saqlanadi. Agar xodim 10 ta muhim xabar to'plangan bo'lsa va hammasini swiped qilsa — hammasiga individual ack bosilishi kerakmi yoki "hammasini o'qidim" bulk tugma bormi? [⤳ ta'sir: EP-NTF-016, UX, BullMQ]

36. `ntf.no3.dailyReport` (EP-NTF-044): smena oxirida hisobot eslatmasi — "smena oxiri" vaqti uch smena uchun har xil (masalan 08:00, 16:00, 00:00); shu vaqtlar PP/MES'dagi smena jadvalidan dinamik olinadimi yoki NTF master-datada qattiq yozilganmi? Agar smena erta yakunlansa eslatma ham siljiydimi? [⤳ ta'sir: MES (smena jadval), PP, Cron]

37. `ntf.adaptation.confirm` (EP-NTF-077): xodim yangi оргополитика o'qib tasdiqlaganini bot qayd qiladi — agar xodim "o'qidim" tugmasini bosmasdan LMS kursni to'liq ko'rgan bo'lsa (LMS progress 100%) bu tasdiq hisoblanadimi? LMS va NTF o'rtasida event bormi (`LmsModuleCompletedEvent → NTF confirm auto`)? [⤳ ta'sir: LMS (darslik), HR/adaptatsiya]

38. `ntf.alert.threshold` (EP-NTF-006): KPI chegara signali — bir modul uchun bir vaqtda 5 ta ko'rsatkich meyor ostiga tushsa 5 ta alohida signal yuborilsa Telegram spam. NTF "alert debounce" mexanizmi bormi — N daqiqa ichida bir moduldan ko'p signal kelsa ularni bitta xulosa xabariga yig'ish? [⤳ ta'sir: AI (KPI kuzatuvi), barcha modul, BullMQ]

39. `ntf.bypass.emergency` (EP-NTF-037): rahbarni chetlab o'tish "favqulodda sabab" — bu faqat Telegramdan yuborilgan xabarda bayroqmi yoki ERP'dan maxsus endpoint chaqiradimi? Agar favqulodda xabar yuborilganda bevosita rahbarga "sizni chetlab o'tishdi + sabab" nusxasi boradi — bu rahbar nomini qanday aniqlaydi (employees.manager_id)? [⤳ ta'sir: Org-struktura, Coordination]

40. `ntf.file.unapproved` (EP-NTF-055): tasdiqsiz fayl yuborilsa dizayner rahbariga signal — "tasdiq belgisi" fayl metadatasida (`design_files.approved_by IS NULL`) tekshiriladimi yoki faylni jo'natish harakati (workflow event) kuzatiladimi? Telegram'da fayl ulashish ERP bilmaydi — faqat ERP ichki fayl tizimi nazorat qilinadimi? [⤳ ta'sir: Dizayn, QC, Coordination]

41. `ntf.corrector.block` (EP-NTF-054): korrektor xato topsa kartochka keyingi bosqichga o'tishi bloklanadi — bu blok qaysi modulda? Kanban kartochkasida `blocked_by_ntf: boolean` maydon kerakmi yoki Kanban o'z `status_constraint` jadvali bilan o'zi boshqaradimi? NTF faqat signal chiqaradi, blok mexanizmi Kanban/PP'da — bu ikki modul o'rtasida event shartnomasi qanday? [⤳ ta'sir: QC, Kanban, Dizayn, EventEmitter2]

42. `ntf.tt.incomplete` (EP-NTF-053): texnik topshiriq to'liqsiz kelsa savdoga "to'ldiring" signali + dizaynaga ish berilmaydi — "majburiy maydonlar tekshiruvi" SD modul savdo-bosqichidami yoki NTF trigger qiladimi? Agar savdo menejer to'ldirmay 24 soat o'tsa keyingi eskalatsiya (rahbar) avtomatikmi? [⤳ ta'sir: CRM/SD (ТТ), Dizayn, eskalatsiya]

43. `ntf.card.approvalWait` (EP-NTF-052): "Tasdiqdagi" kartochkada tasdiqlovchiga eslatma — tasdiqlovchi ta'tilda (HR'da ta'til belgilangan) bo'lsa eslatma kimga boradi? i.o. (ORG-060) avtomatik eslatma oladimi yoki HR ta'til holati NTF eskalatsiya mantiqiga integrate bo'lganmi? [⤳ ta'sir: CRM/Kanban, HR (ta'til), Org-struktura]

44. `ntf.repeatError.policy` (EP-NTF-043): bir xil xato 2-marta takrorlansa оргополитика yozish topshirig'i — "bir xil xato" qanday aniqlanadi (QC defect_type kodi bir xil bo'lsa)? Ikkita xato orasida qancha vaqt — bir smena ichimi yoki har qanday vaqt oralig'i? "Оргополитика yoz" topshirig'i Kanban'da avtomatik vazifa yaratadimi? [⤳ ta'sir: QC (xato-katalog), HR/KPI, Kanban]

45. `ntf.night.soloDecision` (EP-NTF-036): tungi yakka qaror "to'liq masъuliyat" belgisi bilan qayd — bu qaydni kimdir o'zgartira oladimi keyinchalik? F5 immutable prinsip bo'yicha to'g'ridan-to'g'ri o'zgartirib bo'lmaydi — lekin "bekor qilish" (cancellation record) yaratiladimi? Ertalab bosh texnolog "bilmadim" desa ham qayd qoladi — bu qonuniy kuchga egami (audit trail)? [⤳ ta'sir: Sifat, Audit-log, F5]

46. `ntf.responsibility.writtenOnly` (EP-NTF-067): masъuliyat faqat yozma o'tkazma — Telegram'da "shu ishni senga o'tkazaman" yozilsa bu yozma hisoblanadimi? Bot uchun bu "rasmiy o'tkazma" sifatida qaydlanadimi yoki ERP'dan alohida "masъuliyat o'tkazma" forma kerakmi? [⤳ ta'sir: Coordination, Audit-log]

47. `ntf.duo.meeting1hour` va `ntf.halt.broadcast` (EP-NTF-040/041) bir vaqtda: uchlik yig'ilish 1 soat taymeri yugurganda buyurtma to'xtatildi signali ham ketadi — ikkita parallel taymer bir xabar oqimida race condition yoki duplicate signal bo'ladimi? Bu ikki event (uchlik yig'ilish vs halt broadcast) bir-biri bilan qanday koordinatsiya qilinadi? [⤳ ta'sir: Coordination, SD, PP/MES]

48. NTF moduli o'zi versiyalangan xabar shablonlarini saqlaydi (EP-NTF-028) — lekin pp/mes/qc eventlari NTF'ga `payload` ob'yekti yuborsa, payload strukturasi o'zgarganda (modul yangilanib ustun o'zgarsa) eski shablon sinadi. NTF va har modul o'rtasida event payload shartnomasi (contract) qanday versiyalanadi va buzilish (breaking change) qanday oldini olinadi? [⤳ ta'sir: BARCHA modul, EventEmitter2, B1 TypeScript]

49. `ntf.bot.action` (EP-NTF-021): Telegram'dan inline tugma bilan "tasdiqla / rad et" harakati — bot `callbackQuery` kelganda `bot.telegram.answerCallbackQuery()` darhol javob bermasa Telegram 5 saniya kutib xato ko'rsatadi. NestJS async handler (DB write) sekin bo'lsa timeout xavfi bor — `answerCallbackQuery` darhol "qabul qilindi" yuborib, real harakatni background job'ga (BullMQ) o'tkazish kerakmi? [⤳ ta'sir: Telegram API (5s timeout), BullMQ, Kanban/Coordination]

50. NTF monitoring va health: 20 ta per-modul bot bir vaqtda ishlayotganda bot'lardan biri crash qilsa (token revoked, network error) qolgan 19 tasi ishlaydi — bu xato qanday aniqlanadi va avtomatik restart (BullMQ dead-letter queue yoki pm2 restart) qanday sozlanadi? Har bot'ning `isHealthy()` holatini `/api/ntf/health` endpoint ko'rsatinadimi? [⤳ ta'sir: DevOps (A5 offline), Telegraf.js, BARCHA modul]
