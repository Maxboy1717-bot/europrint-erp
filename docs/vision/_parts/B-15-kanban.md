## [B/TASDIQ] Kanban / Vazifa (15) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | 3 savat: Bajariladi→Jarayonda→Bajarildi, butun fabrika bir xil | 2026-06-27 | TASDIQ-2146 §15 #1 | Standart taxta tuzilishi | Kanban ustunlar | Kanonik 3-savat seed | Qisman | jadval+sort_order bor (schema-kanban.ts:21-30), jonli data test-axlat, seed yo'q |
| 2 | Faqat ijrochi suradi, Bajarildi'ni boshliq tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §15 #2 | Nazorat | Move/transition huquq | Umumiy move huquq-guardi | Qisman | accept/complete guard bor (drizzle-kanban-cards.repo.ts:238-246), move ochiq |
| 3 | Orqaga qaytarish: sabab majburiy, tarixga yoziladi | 2026-06-27 | TASDIQ-2146 §15 #3 | Audit izi | Transition + sabab | moveBack + sabab ustuni + history | Yo'q | moveBack/sabab ustuni yo'q |
| 4 | Bajarildi'dan qayta ochish faqat boshliq, sabab majburiy, belgi | 2026-06-27 | TASDIQ-2146 §15 #4 | Nazorat | Reopen oqim | reopen endpoint + reopened_at/count | Yo'q | reopen 0 natija, ustun yo'q (q.cjs) |
| 5 | Savat sakrash taqiqlanadi (albatta Jarayonda'dan) | 2026-06-27 | TASDIQ-2146 §15 #5 | Jarayon tartibi | moveToColumn guard | Ketma-ket savat gate | Yo'q | aggregate faqat DONE tekshiradi (kanban-task.aggregate.ts:79) |
| 6 | Jarayonda'ga: ijrochi+muddat to'ldirilgan bo'lsa | 2026-06-27 | TASDIQ-2146 §15 #6 | Sifat sharti | Move guard | ijrochi+muddat majburiy-guard | Yo'q | createCardFlat muddatsiz/ijrochisiz (drizzle-kanban-cards.repo.ts:172) |
| 7 | Bajarildi'ga: izoh majburiy; Sifat/ta'mir turida rasm | 2026-06-27 | TASDIQ-2146 §15 #7 | Dalil | completeCard guard | majburiy izoh/rasm tekshiruvi | Yo'q | completionReport ixtiyoriy (drizzle-kanban-cards.repo.ts:226-255) |
| 8 | WIP chegarasi: ko'pi bilan 3 ta Jarayonda | 2026-06-27 | TASDIQ-2146 §15 #8 | Diqqat jamlash | WIP guard | WIP-limit guard | Yo'q | wip 0 natija |
| 9 | Har o'tish vaqti avtomat yoziladi, qo'lda o'zgarmas | 2026-06-27 | TASDIQ-2146 §15 #9 | Ishonchli tarix | Transition-log | Har savat-o'tish transition-log | Qisman | time_tracks (48q)+accept/complete bor, savat-o'tish log yo'q |
| 10 | Eskalatsiya: muddat o'tib 24h, Bajarildi'ga o'tmagan | 2026-06-27 | TASDIQ-2146 §15 #10 | O'z vaqtida ijro | Eskalatsiya cron | Kanban eskalatsiya cron | Yo'q | kanban escalation cron yo'q (faqat MES/CC) |
| 11 | 24h faqat ish vaqti (smena jadvaliga ko'ra) | 2026-06-27 | TASDIQ-2146 §15 #11 | Adolat | Eskalatsiya vaqt hisobi | Ish-vaqti hisobi | Yo'q | eskalatsiya cron umuman yo'q |
| 12 | Eskalatsiya bevosita boshliqqa (manager_id zanjiri) | 2026-06-27 | TASDIQ-2146 §15 #12 | To'g'ri marshrut | Eskalatsiya marshruti | manager-zanjir marshrut | Yo'q | kanban_cards uchun marshrut yo'q |
| 13 | Tier-2: yana 24h keyingi darajaga, CEO'da to'xtaydi | 2026-06-27 | TASDIQ-2146 §15 #13 | Ko'p bosqichli nazorat | Tier-2 eskalatsiya | Tier-2 logika | Yo'q | kanban tier-2 yo'q |
| 14 | Eskalatsiya xabari ERP + Telegram guruh | 2026-06-27 | TASDIQ-2146 §15 #14 | Xabardorlik | Telegram xabar | Eskalatsiya-hodisa ulash | Qisman | Telegram infra bor (kanban.handler.ts), eskalatsiya-event yo'q |
| 15 | Oylik hisobotda 'eskalatsiya soni' ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §15 #15 | O'lchov | escalation_count | escalation_count ustuni | Yo'q | ustun yo'q (q.cjs) |
| 16 | Eskalatsiyani boshliq sabab yozib yopadi, tarixda | 2026-06-27 | TASDIQ-2146 §15 #16 | Audit | Eskalatsiya bekor | bekor-qilish + sabab | Yo'q | eskalatsiya mexanizmi yo'q |
| 17 | Muddatsiz vazifa yaratilmaydi (muddat majburiy) | 2026-06-27 | TASDIQ-2146 §15 #17 | Ijro nazorati | Create validatsiya | due_date majburiy | Yo'q | due_date INSERT'ga kirmaydi, schema optional (kanban-cards.controller.ts:43) |
| 18 | Shaxsiy kunlik dastur: Kanban + odat ishlar avtomat soatlarga | 2026-06-27 | TASDIQ-2146 §15 #18 | Kun rejasi | Personal program moduli | PersonalProgram FE+BE | Yo'q | FE sahifa yo'q, BE endpoint yo'q |
| 19 | Dastur qadami 1 soatlik bo'laklar 08:00-09:00 | 2026-06-27 | TASDIQ-2146 §15 #19 | Soddalik | Personal program grid | Soatlik grid | Yo'q | personal program yo'q |
| 20 | Kun oxirida reja/fakt/farq | 2026-06-27 | TASDIQ-2146 §15 #20 | O'lchov | Plan vs fakt | planVsFact hisob | Yo'q | faqat doc, kod yo'q |
| 21 | Dasturni ertalab boshliq tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §15 #21 | Nazorat | Dastur tasdiq oqim | Tasdiqlash oqim | Yo'q | personal program moduli yo'q |
| 22 | Kutilmagan ish: qo'shiladi, siljiganlar keyinga | 2026-06-27 | TASDIQ-2146 §15 #22 | Moslashuvchanlik | Reflow | Reflow logika | Yo'q | personal program yo'q |
| 23 | Bo'sh soatlar sariq belgilanadi, sabab so'raydi | 2026-06-27 | TASDIQ-2146 §15 #23 | Samaradorlik | Bo'sh-soat tahlil | Bo'sh-slot tahlil | Yo'q | personal program yo'q |
| 24 | Takrorlanuvchi kunlik ishlar bir marta sozlanib avtomat paydo | 2026-06-27 | TASDIQ-2146 §15 #24 | Avtomatlashtirish | Recurring cron | Odat-ish dasturga tushishi | Qisman | RecurringCron jonli (kanban-recurring.cron.ts:23), dasturga emas |
| 25 | Kun yopilgach dastur o'zgarmas | 2026-06-27 | TASDIQ-2146 §15 #25 | Ishonchli tarix | Kun-yopish lock | Lock logika | Yo'q | personal program yo'q |
| 26 | 7 kategoriya (IshlabChiq/Sifat/Ta'mir/Ombor/Sotuv/Ma'muriy/Boshqa) | 2026-06-27 | TASDIQ-2146 §15 #26 | Tasnif | category ustun | category + master jadval | Yo'q | category ustun yo'q, master jadval yo'q |
| 27 | 3 daraja ustuvorlik: Shoshilinch/Oddiy/Past | 2026-06-27 | TASDIQ-2146 §15 #27 | Soddalik | priority | Standart enum | Qisman | priority ustun bor (schema-kanban.ts:38), enum standart emas |
| 28 | Ustuvorlik: yaratuvchi taklif, boshliq tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §15 #28 | Nazorat | Priority oqim | Taklif→tasdiq qadami | Yo'q | createCardFlat to'g'ridan yozadi |
| 29 | Bir kunda ko'pi bilan 2 Shoshilinch | 2026-06-27 | TASDIQ-2146 §15 #29 | Qadr saqlash | Urgent limit | Urgent-limit guard | Yo'q | urgentLimit 0 natija |
| 30 | Avtomat tartib: shoshilinch yuqorida, muddati yaqin keyin | 2026-06-27 | TASDIQ-2146 §15 #30 | Qulaylik | Saralash | priority+due avtomat sort | Qisman | sort_order qo'lda (kanban-cards.controller.ts:126), avtomat yo'q |
| 31 | Kategoriya bo'yicha mas'ul avtomat taklif | 2026-06-27 | TASDIQ-2146 §15 #31 | Tezlik | Kategoriya→mas'ul | Taklif logika | Yo'q | kategoriya yo'q (#26) |
| 32 | Shoshilinch → shu kun oxiri muddat | 2026-06-27 | TASDIQ-2146 §15 #32 | Izchillik | Priority→deadline | Avtomat bog'lash | Yo'q | priority/due_date bog'lanmagan |
| 33 | Bajarilmagan vazifa avtomat ertangiga, 'ko'chirilgan' belgisi | 2026-06-27 | TASDIQ-2146 §15 #33 | Uzluksizlik | Rollover cron | Rollover cron + rolled_over | Yo'q | rollover 0 natija, ustun yo'q |
| 34 | '3 marta ko'chirilgan'; 3 dan oshsa signal | 2026-06-27 | TASDIQ-2146 §15 #34 | Nazorat | rolled_over_count | Sanash ustuni | Yo'q | rolled_over_count yo'q (q.cjs) |
| 35 | Ko'chirishda muddat suriladi, 'asl muddat o'tgan' belgisi | 2026-06-27 | TASDIQ-2146 §15 #35 | Tarix | Rollover muddat | Muddat-surish logika | Yo'q | rollover yo'q (#33) |
| 36 | Aniq sanaga bog'langanlar ko'chmaydi, eskalatsiyaga | 2026-06-27 | TASDIQ-2146 §15 #36 | To'g'ri xatti-harakat | Rollover istisno | Istisno logika | Yo'q | rollover+eskalatsiya yo'q |
| 37 | Ko'chirish bo'lim smena tugashiga moslab | 2026-06-27 | TASDIQ-2146 §15 #37 | Aniqlik | Rollover vaqt | Smena-asos vaqt | Yo'q | rollover yo'q |
| 38 | Ko'chgan vazifa ertangi rejada yuqorida (qarz birinchi) | 2026-06-27 | TASDIQ-2146 §15 #38 | Ustuvorlik | Reja joylashuv | Joylashuv-tartib | Yo'q | rollover+personal program yo'q |
| 39 | 10 kundan oshsa 'yopaylikmi?' so'rovi | 2026-06-27 | TASDIQ-2146 §15 #39 | Tozalik | Auto-close | Auto-close so'rovi | Yo'q | rollover-count yo'q (#34) |
| 40 | Kuzatuvchi ko'radi+izoh, holatni o'zgartira olmaydi | 2026-06-27 | TASDIQ-2146 §15 #40 | Rol chegarasi | Observer guard | Faqat-o'qish huquq | Qisman | observers jadval+endpoint bor (kanban-cards.controller.ts:294-314), rol-guard yo'q |
| 41 | Kuzatuvchini yaratuvchi/mas'ul boshliq qo'shadi | 2026-06-27 | TASDIQ-2146 §15 #41 | Nazorat | addObserver RBAC | Kim qo'sha oladi tekshiruv | Qisman | addObserver bor (kanban-cards.controller.ts:300), RBAC yo'q |
| 42 | Kuzatuvchiga faqat muhim: yopildi/kechikdi/eskalatsiya | 2026-06-27 | TASDIQ-2146 §15 #42 | Shovqin kamaytirish | Notifikatsiya filtri | Selektiv xabar oqim | Qisman | notifications jadval bor (drizzle-kanban-cards.repo.ts:212,259), filtr yo'q |
| 43 | Bevosita boshliq avtomat kuzatuvchi | 2026-06-27 | TASDIQ-2146 §15 #43 | Xabar boshqaruvi | Auto-observer | manager_id→observer | Yo'q | autoObserver 0 natija |
| 44 | Kuzatuvchi ko'pi bilan 5 | 2026-06-27 | TASDIQ-2146 §15 #44 | Tozalik | Observer limit | Son-chegara tekshiruv | Yo'q | limit yo'q |
| 45 | Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi | 2026-06-27 | TASDIQ-2146 §15 #45 | Maxfiylik | confidential ustun | Ko'rinish-cheklov | Yo'q | confidential ustun yo'q |
| 46 | Kuzatuvchi @mention → xabar | 2026-06-27 | TASDIQ-2146 §15 #46 | Kommunikatsiya | Mention parser | @mention parser+xabar | Yo'q | addComment saqlaydi (drizzle-kanban-cards.repo.ts:131), mention yo'q |
| 47 | Sarlavha+mas'ul+muddat+kategoriya majburiy | 2026-06-27 | TASDIQ-2146 §15 #47 | Ma'lumot to'liqligi | Create validatsiya | Majburiy maydonlar | Yo'q | schema barchasi optional (kanban-cards.controller.ts:36-44) |
| 48 | Bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi | 2026-06-27 | TASDIQ-2146 §15 #48 | Aniq mas'uliyat | owner+co-exec+observer | 3 rol ajratish | Ha | owner_user_id+co_executors+observers jadval+endpoint (kanban-cards.controller.ts:318-338) |
| 49 | O'tkazishda sabab, 'X→Y' tarixda | 2026-06-27 | TASDIQ-2146 §15 #49 | Audit | assignCard | Sabab+reassign-tarix | Qisman | assignCard owner o'zgartiradi (kanban-cards.controller.ts:169-180), sabab/tarix yo'q |
| 50 | Checklist: hammasi belgilanmaguncha yopilmaydi | 2026-06-27 | TASDIQ-2146 §15 #50 | To'liqlik | completeCard gate | Checklist-complete gate | Qisman | checklist jadval+controller bor, gate yo'q (drizzle-kanban-cards.repo.ts:226) |
| 51 | Ixtiyoriy buyurtma/stanok/mijozga bog'lash | 2026-06-27 | TASDIQ-2146 §15 #51 | Kontekst | related_type/id | Stanok/mijoz bog'lanish | Qisman | related_type/id bor (schema-kanban.ts:39-40), stanok/mijoz UI yo'q |
| 52 | Alohida 'Bekor qilindi' holat, sabab majburiy | 2026-06-27 | TASDIQ-2146 §15 #52 | Toza hisob | Status enum | cancel endpoint+sabab guard | Qisman | OrderCancelled ko'chiradi (kanban-cards.repo.ts:213-268), enum/guard yo'q |
| 53 | Rasm+fayl+ovozli izoh biriktirish | 2026-06-27 | TASDIQ-2146 §15 #53 | Dalil | Fayl biriktirish | Ovozli izoh qo'llab-quvvat | Qisman | files jadval+endpoint bor (kanban-cards.controller.ts:243-262), audio yo'q |
| 54 | Bosqichli ko'rinish: xodim/bo'lim/boshliq/yuqori daraja | 2026-06-27 | TASDIQ-2146 §15 #54 | Maxfiylik/tartib | getAllCards scope | Ko'rinish-filtri (scope) | Yo'q | LIMIT 500 hammasi (kanban-cards.controller.ts:119-128), scope yo'q |
| 55 | Telegramdan ochish/yopish/izoh, ERP sinxron | 2026-06-27 | TASDIQ-2146 §15 #55 | Qulaylik | Telegram ingest | Inbound bot command handler | Qisman | kanban.handler faqat xabar, ingest handler yo'q |
| 56 | Har ish kuni 17:30 НО-3 kun-yakuni vazifasi avtomat | 2026-06-27 | TASDIQ-2146 §15 #56 | Kunlik intizom | Recurring cron | НО-3 17:30 seed/cron | Qisman | RecurringCron bor, НО-3 maxsus yo'q; daily-report HR'da ulanmagan |
| 57 | Kamchilik → aybdor+boshliq 'tuzat' vazifasi, 24h | 2026-06-27 | TASDIQ-2146 §15 #57 | Yakun | Deficiency→task event | Auto-vazifa handler | Yo'q | fromDeficiency 0 natija |
| 58 | Tanaffus/tushlik/namoz qotirilgan band-slot | 2026-06-27 | TASDIQ-2146 §15 #58 | Reja himoyasi | Personal program slot | Fixed-slot himoya | Yo'q | personal program yo'q (#18) |
| 59 | Smena tushlik avtomat slot + smena-o'tkazish so'rov | 2026-06-27 | TASDIQ-2146 §15 #59 | Smena rejasi | Smena-slot | Smena-slot logika | Yo'q | personal program yo'q |
| 60 | Ta'til: o'rinbosar tanlanmaguncha tasdiqlanmaydi | 2026-06-27 | TASDIQ-2146 §15 #60 | Uzluksizlik | Vacation handover | Handover guard | Yo'q | vacation-handover yo'q (q.cjs) |
| 61 | O'rinbosarga o'tgan vazifa qaytganda asl egaga qaytadi | 2026-06-27 | TASDIQ-2146 §15 #61 | Vaqtinchalik o'tkazma | Delegation return | Return cron | Yo'q | handover.return 0 natija |
| 62 | Jarayon shabloni → НО-1/РД-4/ТХ avtomat biriktiruv | 2026-06-27 | TASDIQ-2146 §15 #62 | Avtomatlashtirish | Templates+flow | НО-rol→avtomat mapping | Qisman | templates+flow bor (kanban-core.controller.ts:55), НО-rol mapping yo'q |
| 63 | Vazifa-turiga norma-vaqt + norma/fakt solishtirish | 2026-06-27 | TASDIQ-2146 §15 #63 | O'lchov | estimated_time | norm_time master + solishtirish | Qisman | estimated_time+time_tracks bor (schema-kanban.ts:140-141), tur-norma yo'q |
| 64 | Zanjir vazifa: oldingi yopilmaguncha keyingi qulflangan | 2026-06-27 | TASDIQ-2146 §15 #64 | Jarayon tartibi | parent_card_id gate | Zanjir-gate logika | Yo'q | parent_card_id ierarxiya, gate yo'q |
| 65 | Mentorga 'shogird kuzatuvi' vazifasi, oxirida baho | 2026-06-27 | TASDIQ-2146 §15 #65 | Adaptatsiya | Mentor-watch | Mentor kuzatuv-vazifa | Yo'q | mentorWatch 0 natija |
| 66 | Sinov tugashiga 3 kun qolganda 'yakun qarori' vazifasi | 2026-06-27 | TASDIQ-2146 §15 #66 | Qaror | Probation timer | Sinov→qaror cron | Yo'q | probationDecision 0 natija |
| 67 | Har buyurtma = ishlab chiqarish taxtasida karta | 2026-06-27 | TASDIQ-2146 §15 #67 | Ko'rinuvchanlik | OrderCreated handler | Дата→due + holat-oqim | Qisman | handler jonli (order-created-kanban.handler.ts), due/oqim to'liq emas, jonli data yo'q |
| 68 | Taxta ustunlari = real texnologik bosqichlar | 2026-06-27 | TASDIQ-2146 §15 #68 | Ishlab chiqarish oqimi | kanban_columns seed | Texnologik-bosqich seed | Yo'q | jonli ustunlar test-axlat; MES marshrut ulanmagan |
| 69 | Kartada tiraj + progress-bar (7000/10000) | 2026-06-27 | TASDIQ-2146 §15 #69 | Aniq holat | tiraj/qty ustun | Progress ustunlar | Yo'q | tiraj/qty/progress ustun yo'q (q.cjs) |
| 70 | Kuzatuvchi ko'radi+izoh, status o'zgartira olmaydi | 2026-06-27 | TASDIQ-2146 §15 #70 | Rol chegarasi | Observer endpoint | Read+izoh (status yo'q) | Ha | observers jadval(4q)+GET/POST/DELETE, status-o'zg endpoint yo'q (kanban-cards.controller.ts:294-314) |
| 71 | Kuzatuvchini yaratuvchi/mas'ul boshliq qo'shadi | 2026-06-27 | TASDIQ-2146 §15 #71 | Nazorat | addObserver RBAC | RBAC tekshiruv | Qisman | addObserver jonli (kanban-cards.controller.ts:300), RBAC yo'q — har kim qo'shadi |
| 72 | Kuzatuvchiga faqat muhim hodisa xabari | 2026-06-27 | TASDIQ-2146 §15 #72 | Shovqin kamaytirish | Notifikatsiya filtr | Selektiv oqim | Yo'q | notifications bor, filtr/sozlama yo'q |
| 73 | Boshliq avtomat kuzatuvchi (manager_id zanjiri) | 2026-06-27 | TASDIQ-2146 §15 #73 | Xabar boshqaruvi | Auto-observer | manager_id→observer | Yo'q | addObserver faqat qo'lda |
| 74 | Kuzatuvchi ko'pi bilan 5 | 2026-06-27 | TASDIQ-2146 §15 #74 | Tozalik | Observer limit | max 5 validatsiya | Yo'q | limit yo'q, cheksiz qo'shsa bo'ladi |
| 75 | Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi | 2026-06-27 | TASDIQ-2146 §15 #75 | Maxfiylik | confidential/visibility | Ko'rinish-cheklov | Yo'q | confidential ustun yo'q (q.cjs) |
| 76 | @mention → xabar boradi | 2026-06-27 | TASDIQ-2146 §15 #76 | Kommunikatsiya | mention ustun | mention parser+xabar | Yo'q | comments faqat text, mention ustun yo'q |
| 77 | Sarlavha+mas'ul+muddat+kategoriya majburiy | 2026-06-27 | TASDIQ-2146 §15 #77 | Ma'lumot to'liqligi | Create schema | Majburiy maydonlar | Qisman | title talab, qolgan optional; kategoriya ustun yo'q (kanban.dto.ts) |
| 78 | Bitta asosiy mas'ul + yordamchi/kuzatuvchi | 2026-06-27 | TASDIQ-2146 §15 #78 | Aniq mas'uliyat | owner+co-exec+observer | 3 rol ajratish | Ha | owner+co_executors+observers ajratilgan (kanban-cards.controller.ts:318-338) |
| 79 | O'tkazishda sabab+'X→Y' tarix | 2026-06-27 | TASDIQ-2146 §15 #79 | Audit | assign endpoint | Sabab+tarix | Qisman | PATCH :id/assign owner almashtiradi (kanban-cards.controller.ts:165-180), sabab/tarix yo'q |
| 80 | Checklist: hammasi belgilanmaguncha yopilmaydi | 2026-06-27 | TASDIQ-2146 §15 #80 | To'liqlik | complete gate | Checklist-complete gate | Qisman | checklist jadval+CRUD+toggle (kanban-checklist.controller.ts:37-99), gate yo'q |
| 81 | Buyurtma/stanok/mijoz bog'lash | 2026-06-27 | TASDIQ-2146 §15 #81 | Kontekst | related_type/id | Faol bog'lanish | Qisman | related_type/id bor, jonli data null (ishlatilmayapti) |
| 82 | Alohida 'Bekor qilindi' holat, sabab majburiy | 2026-06-27 | TASDIQ-2146 §15 #82 | Toza hisob | Status enum | cancelled enum+sabab | Qisman | moveOrderCardToCancelled bor (kanban-cards.repo.ts:217), enum/sabab yo'q |
| 83 | Rasm+fayl+ovozli izoh | 2026-06-27 | TASDIQ-2146 §15 #83 | Dalil | Fayl endpoint | Ovozli izoh | Qisman | files+chat-message-files jonli, audio maxsus yo'q |
| 84 | Bosqichli ko'rinish (o'zi+bo'lim/boshliq/yuqori) | 2026-06-27 | TASDIQ-2146 §15 #84 | Maxfiylik/tartib | visibility/scope RBAC | Org-daraja scope | Yo'q | visibility ustun yo'q, getCards org-ga bog'lanmagan |
| 85 | Telegramdan yaratish/yopish, ERP sinxron | 2026-06-27 | TASDIQ-2146 §15 #85 | Qulaylik | Telegram ingest | Inbound handler | Yo'q | telegram_* ustunlar bo'sh, ingest handler yo'q |
| 86 | 17:30 НО-3 kun-yakuni avtomat vazifa | 2026-06-27 | TASDIQ-2146 §15 #86 | Kunlik intizom | Cron | НО-3 shablon+rejalashtirgich | Yo'q | kanban @Cron=0; recurrence_pattern bor, shablon yo'q |
| 87 | Kamchilik → avtomat 'tuzat' vazifa, 24h | 2026-06-27 | TASDIQ-2146 §15 #87 | Yakun | Deficiency listener | Event/listener | Yo'q | kamchilik→vazifa event yo'q |
| 88 | Tushlik/namoz shaxsiy dasturda 'band' | 2026-06-27 | TASDIQ-2146 §15 #88 | Reja himoyasi | Personal program | Fixed-slot + HR smena | Yo'q | personal program BE jadval/servis topilmadi |
| 89 | Smena tushlik avtomat slot | 2026-06-27 | TASDIQ-2146 §15 #89 | Smena rejasi | Smena-slot | Smena-bog'liq slot+handover | Yo'q | personal program qurilmagan |
| 90 | Ta'til handover majburiy bosqich | 2026-06-27 | TASDIQ-2146 §15 #90 | Uzluksizlik | HR↔Kanban | Ta'til-handover bog'lanish | Yo'q | HR ta'til API'ga Kanban ulanmagan |
| 91 | O'rinbosar vazifasi qaytganda asl egaga qaytadi | 2026-06-27 | TASDIQ-2146 §15 #91 | Vaqtinchalik o'tkazma | Delegation return | Delegation+auto-return | Yo'q | mexanizm yo'q, cron yo'q |
| 92 | Shablon → НО-1/РД-4/ТХ avtomat biriktiruv | 2026-06-27 | TASDIQ-2146 §15 #92 | Avtomatlashtirish | Rol-asosli assign | НО-rol master + qoida | Yo'q | robot-dvigatel assign bor, НО-rol master yo'q |
| 93 | Vazifa-turiga norma-vaqt (30/20 daq) | 2026-06-27 | TASDIQ-2146 §15 #93 | O'lchov | norma master-data | tur-norma jadval+solishtirish | Yo'q | estimated_time qo'lda, tur-norma master yo'q |
| 94 | Shablon = qulflangan zanjir (oldingi yopilmaguncha) | 2026-06-27 | TASDIQ-2146 §15 #94 | Jarayon tartibi | dependency-gate | Zanjir-bog'liqlik gate | Yo'q | templates/flows bor, dependency-gate yo'q |
| 95 | Mentor shogird kuzatuv-vazifasi + LMS muddati | 2026-06-27 | TASDIQ-2146 §15 #95 | Adaptatsiya | Mentor-task | Mentor→shogird + LMS | Yo'q | kanban modulida yo'q |
| 96 | Sinov tugashidan oldin 'qaror' vazifasi avtomat | 2026-06-27 | TASDIQ-2146 §15 #96 | Qaror | Probation timer | Sinov-sana→qaror cron | Yo'q | cron=0, HR sinov-sana ulanmagan |
| 97 | Har buyurtma = ishlab chiqarish kartasi, Дата=muddat | 2026-06-27 | TASDIQ-2146 §15 #97 | Ko'rinuvchanlik | OrderCreated handler | related_type + bosqich ustun | Qisman | handler jonli (order-created-kanban.handler.ts:29-35), related_type=null, ustunlar axlat |
| 98 | Taxta ustunlari = real bosqichlar (Флексо/Высечка...) | 2026-06-27 | TASDIQ-2146 §15 #98 | Ishlab chiqarish oqimi | columns seed | Texnologik-bosqich ustun-shablon | Yo'q | jonli nomlar test-axlat, seed yo'q |
| 99 | Тираж + progress-bar kartada | 2026-06-27 | TASDIQ-2146 §15 #99 | Aniq holat | tiraj/qty ustun | Progress datasi | Yo'q | tiraj/quantity/progress ustunlar yo'q |
| 100 | 'Сумма осталось' (qoldiq to'lov) kartada | 2026-06-27 | TASDIQ-2146 §15 #100 | Moliya nazorati | payment_balance ustun | To'lov holati + yetkazish-blok | Yo'q | payment_balance ustun yo'q |
| 101 | Operator-stansiya biriktiruvi kartadan avtomat | 2026-06-27 | TASDIQ-2146 §15 #101 | Aniqlik | stansiya-operator master | Bosqich→avtomat operator | Yo'q | master-data yo'q, owner_user_id qo'lda |
| 102 | Ijrochi+yordamchi hissa-ulush bilan (GSD) | 2026-06-27 | TASDIQ-2146 §15 #102 | Adolatli GSD | co_executors | Hissa-ulush % + GSD | Qisman | co_executors jadval+endpoint bor, % + GSD yo'q |
| 103 | Заявка (material so'rovi) → avtomat ta'minot vazifa | 2026-06-27 | TASDIQ-2146 §15 #103 | Ta'minot | Material→task event | Yetishmovchilik→vazifa | Yo'q | warehouse_stock bog'lanmagan |
| 104 | 'Отменен': alohida holat, sabab majburiy, arxiv | 2026-06-27 | TASDIQ-2146 §15 #104 | Toza hisob | OrderCancelled handler | Majburiy sabab maydoni | Qisman | moveOrderCardToCancelled+note (kanban-cards.repo.ts:217-269), sabab majburiy emas |
| 105 | Дата готовности kechiksa savdo+boshliqqa avtomat xabar | 2026-06-27 | TASDIQ-2146 §15 #105 | O'z vaqtida | Overdue escalation | Kechikish eskalatsiya cron | Yo'q | cron=0; overdue faqat read (drizzle-kanban-stats.repo.ts:37) |
| 106 | 'Примечание' karta yuzida badge | 2026-06-27 | TASDIQ-2146 §15 #106 | Diqqat | special_note/badge | Badge + bosqich tasdiq | Yo'q | primechanie/badge ustun yo'q |
| 107 | 'Korporativ raqam berish' (НО-2) jarayon-shablon | 2026-06-27 | TASDIQ-2146 §15 #107 | Standart jarayon | templates seed | НО-2/Инспекция shablon | Yo'q | seed'da yo'q, zanjir-shablon yo'q |
| 108 | Vazifa lavozim-kartaga, keyin xodimga | 2026-06-27 | TASDIQ-2146 §15 #108 | Karta-markazli model | card_id/position-link | position-link ustun | Yo'q | card_id ustun yo'q, faqat owner_user_id |
| 109 | Vazifa toifasi seriya bo'yicha (Компания/Ташкилот/Произв) | 2026-06-27 | TASDIQ-2146 §15 #109 | Tasnif | category/series ustun | Toifa master-data | Yo'q | toifa/series ustun yo'q, faqat tags |
| 110 | Оргполитика → vazifa-shablon manba | 2026-06-27 | TASDIQ-2146 §15 #110 | Siyosat→ijro | Policy→task listener | Konvertatsiya/listener | Yo'q | оргполитика→shablon listener yo'q |
| 111 | Vazifaga 'kutilgan natija' maydoni | 2026-06-27 | TASDIQ-2146 §15 #111 | Qabul mezoni | expected_outcome ustun | expected_outcome | Yo'q | ustun yo'q, faqat description+report |
| 112 | Tugamagan buyurtma keyingi smenaga estafeta | 2026-06-27 | TASDIQ-2146 §15 #112 | Uzluksizlik | Shift-relay | Estafeta cron/event | Yo'q | shift-relay cron=0; MES handover ulanmagan |
| 113 | Brak/qayta ishlash → vazifa (GSD/sifat) | 2026-06-27 | TASDIQ-2146 §15 #113 | Sifat | Brak→rework event | Brak→vazifa listener | Yo'q | QC bilan brak-bog'lanish yo'q |
| 114 | Stansiya navbati Дата+ustuvorlik bo'yicha avtomat sort | 2026-06-27 | TASDIQ-2146 §15 #114 | Tartib | Stansiya-navbat sort | Avtomat saralash | Yo'q | sort_order qo'lda, stansiya-ustun yo'q |
| 115 | Ichki/tashqi belgi, tashqi to'lovli ustuvor | 2026-06-27 | TASDIQ-2146 §15 #115 | Ustuvorlik | internal_flag | Ichki/tashqi belgi | Yo'q | internal_flag ustun yo'q |
| 116 | Kun boshi 'bugungi reja' boshliq ko'radi/tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §15 #116 | Nazorat | Personal program | Kun-boshi reja tasdiq | Yo'q | personal program BE yo'q |
| 117 | Deadline cho'zish boshliq tasdig'i bilan | 2026-06-27 | TASDIQ-2146 §15 #117 | Nazorat | updateCard gate | Cho'zish tasdiq + sabab | Yo'q | updateCard due o'zgartiradi, gate/sabab yo'q |
| 118 | Vazifani 'qaytarish' sabab bilan | 2026-06-27 | TASDIQ-2146 §15 #118 | Adolatlilik | return-to-sender | Reject-with-reason endpoint | Yo'q | accept bor, return yo'q |
| 119 | 'Срочно' belgisini faqat boshliq qo'yadi | 2026-06-27 | TASDIQ-2146 §15 #119 | Qadr saqlash | priority RBAC | 'faqat boshliq' RBAC + limit | Qisman | priority ustun bor (enum), RBAC/limit yo'q |
| 120 | Maxfiy vazifa faqat beruvchi+ijrochi+boshliq ko'radi | 2026-06-27 | TASDIQ-2146 §15 #120 | Maxfiylik | confidential ustun | RBAC ko'rinish-filtr | Yo'q | confidential ustun yo'q (q.cjs) |
| 121 | Shablon vazifaga forma/blank biriktirilgan keladi | 2026-06-27 | TASDIQ-2146 §15 #121 | Qulaylik | Template-level forma | Shablon-forma biriktirish | Qisman | kanban_files karta-darajasida bor, shablon-daraja yo'q |
| 122 | Bosqich bog'liqligi ('X tugamaguncha bloklangan') | 2026-06-27 | TASDIQ-2146 §15 #122 | Jarayon tartibi | blocked_by ustun | Dependency+avtomat-ochilish | Yo'q | blocked_by ustun yo'q, parent_card_id gate emas |
| 123 | Yopilishda sifat-baho (1-5) НО tasdig'i, GSD ga o'rtacha | 2026-06-27 | TASDIQ-2146 §15 #123 | Sifat | rating endpoint | GSD/KPI ga o'rtacha ulash | Qisman | rating ustun+PUT endpoint jonli (kanban-cards.controller.ts:135-146), GSD ulash yo'q |
| 124 | Bo'lim taxtasi kunlik 'летучка' bir ekran | 2026-06-27 | TASDIQ-2146 §15 #124 | Yig'ilish | Standup view | letuchka rejim view | Yo'q | reports/overdue bor, birlashgan ekran yo'q |
| 125 | @xabar (o'qish) vs @so'rov (vazifa tushadi) farqi | 2026-06-27 | TASDIQ-2146 §15 #125 | Kommunikatsiya | comments mention | Farq + so'rovdan vazifa | Yo'q | comments faqat text, mention ustun yo'q |
| 126 | Hayfa/ogohlantirish (взыскание) yozma iz, HR ga | 2026-06-27 | TASDIQ-2146 §15 #126 | Intizom | disciplinary-record | Hayfa yozish + HR ulash | Yo'q | kanban'da hayfa yozish yo'q, HR trigger yo'q |
| 127 | Buyurtma o'zgarsa (Тираж/muddat) karta avtomat yangilanadi | 2026-06-27 | TASDIQ-2146 §15 #127 | Sinxronlik | OrderChanged listener | OrderUpdated→karta-sync | Yo'q | faqat OrderCreated+Cancelled handler bor |
| 128 | Упаковка → avtomat ombor/yetkazish vazifa | 2026-06-27 | TASDIQ-2146 §15 #128 | Yakun zanjir | Stage-close event | Ombor/yetkazish avtomat vazifa | Yo'q | WMS/delivery bog'lanmagan |
| 129 | Karta rangi mahsulot turi bo'yicha (гофра/картон) | 2026-06-27 | TASDIQ-2146 §15 #129 | Filtr | Product-type→rang | Mahsulot-turi master + rang | Yo'q | mahsulot-turi master yo'q, tags erkin |
| 130 | Qadam norma-vaqtdan oshsa eskalatsiya | 2026-06-27 | TASDIQ-2146 §15 #130 | Nazorat | norma + escalation | norma master + cron | Yo'q | norma master yo'q, cron=0 |
| 131 | Arxivdan takror muammo AI bilan aniqlanadi | 2026-06-27 | TASDIQ-2146 §15 #131 | Tahlil | Pattern-detect AI | AI-analitika | Yo'q | arxiv soft-delete, AI-tahlil yo'q |
| 132 | Vazifa lavozimga (ism emas) beriladi | 2026-06-27 | TASDIQ-2146 §15 #132 | Karta-markazli model | position card link | position-link | Yo'q | faqat owner_user_id, karta-markaz yo'q |
| 133 | Stansiya kunlik norma — plan-fakt (6000/8000) | 2026-06-27 | TASDIQ-2146 §15 #133 | O'lchov | Stansiya norma master | plan-fakt taxta-ko'rinish | Yo'q | norma master yo'q, MES/OEE bog'lanmagan |
| 134 | Boshladim/tugatdim vaqt logi normaga taqqoslanadi | 2026-06-27 | TASDIQ-2146 §15 #134 | O'lchov | time-entries | norma-vaqtga taqqoslash | Qisman | start/stop jonli (kanban-card-files.controller.ts:214-236), norma yo'q |
| 135 | ТХ yo'riqnoma davriy takrorlanuvchi vazifa | 2026-06-27 | TASDIQ-2146 §15 #135 | Xavfsizlik | recurrence + cron | ТХ shablon+rejalashtirgich | Yo'q | recurrence_pattern bor, ТХ shablon/cron yo'q |
| 136 | Заявка miqdori ombor qoldig'iga taqqoslanadi | 2026-06-27 | TASDIQ-2146 §15 #136 | Ta'minot | WMS bog'lanish | Solishtirish + sotib-olish vazifa | Yo'q | warehouse_stock/MM bog'lanmagan |
| 137 | Stansiya-operator o'zgarsa ochiq kartalar yangi operatorga | 2026-06-27 | TASDIQ-2146 §15 #137 | Uzluksizlik | Reassign event | master-data + qayta-yo'naltirish | Yo'q | master-data yo'q, egasiz qolmaslik mexanizmi yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Orqaga qaytarish sabab+tarix | 2026-06-27 | TASDIQ-2146 §15 #3 | moveBack/sabab ustuni yo'q | Kanban / Vazifa |
| Bajarildi'dan qayta ochish (boshliq) | 2026-06-27 | TASDIQ-2146 §15 #4 | reopen endpoint/ustun yo'q | Kanban / Vazifa |
| Savat sakrash taqiqi | 2026-06-27 | TASDIQ-2146 §15 #5 | ketma-ket savat gate yo'q | Kanban / Vazifa |
| Jarayonda gate (ijrochi+muddat) | 2026-06-27 | TASDIQ-2146 §15 #6 | move guard yo'q | Kanban / Vazifa |
| Bajarildi gate (izoh/rasm majburiy) | 2026-06-27 | TASDIQ-2146 §15 #7 | completeCard guard yo'q | Kanban / Vazifa |
| WIP chegara (3 ta) | 2026-06-27 | TASDIQ-2146 §15 #8 | WIP-limit guard yo'q | Kanban / Vazifa |
| Eskalatsiya (24h overdue) | 2026-06-27 | TASDIQ-2146 §15 #10 | kanban escalation cron yo'q | Kanban / Vazifa |
| 24h ish-vaqti hisobi | 2026-06-27 | TASDIQ-2146 §15 #11 | eskalatsiya cron yo'q | Kanban / Vazifa |
| Eskalatsiya marshruti (manager) | 2026-06-27 | TASDIQ-2146 §15 #12 | kanban marshrut yo'q | Kanban / Vazifa |
| Tier-2 eskalatsiya | 2026-06-27 | TASDIQ-2146 §15 #13 | tier-2 logika yo'q | Kanban / Vazifa |
| Eskalatsiya soni ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §15 #15 | escalation_count ustuni yo'q | Kanban / Vazifa |
| Eskalatsiya bekor (sabab, tarix) | 2026-06-27 | TASDIQ-2146 §15 #16 | eskalatsiya mexanizmi yo'q | Kanban / Vazifa |
| Muddat majburiy (create) | 2026-06-27 | TASDIQ-2146 §15 #17 | validatsiya yo'q, schema optional | Kanban / Vazifa |
| Shaxsiy kunlik dastur moduli | 2026-06-27 | TASDIQ-2146 §15 #18 | FE+BE umuman yo'q | Kanban / Vazifa |
| Dastur soatlik grid | 2026-06-27 | TASDIQ-2146 §15 #19 | personal program yo'q | Kanban / Vazifa |
| Reja/fakt/farq | 2026-06-27 | TASDIQ-2146 §15 #20 | kod yo'q, faqat doc | Kanban / Vazifa |
| Dasturni boshliq tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §15 #21 | tasdiq oqim yo'q | Kanban / Vazifa |
| Kutilmagan ish reflow | 2026-06-27 | TASDIQ-2146 §15 #22 | reflow yo'q | Kanban / Vazifa |
| Bo'sh soatlar (sariq, sabab) | 2026-06-27 | TASDIQ-2146 §15 #23 | bo'sh-slot tahlil yo'q | Kanban / Vazifa |
| Kun-yopish lock | 2026-06-27 | TASDIQ-2146 §15 #25 | lock logika yo'q | Kanban / Vazifa |
| 7 kategoriya master-data | 2026-06-27 | TASDIQ-2146 §15 #26 | category ustun/jadval yo'q | Kanban / Vazifa |
| Ustuvorlik taklif→tasdiq | 2026-06-27 | TASDIQ-2146 §15 #28 | taklif→tasdiq qadami yo'q | Kanban / Vazifa |
| Urgent limit (2/kun) | 2026-06-27 | TASDIQ-2146 §15 #29 | urgent-limit guard yo'q | Kanban / Vazifa |
| Kategoriya→mas'ul taklif | 2026-06-27 | TASDIQ-2146 §15 #31 | kategoriya yo'q | Kanban / Vazifa |
| Priority→deadline avtomat | 2026-06-27 | TASDIQ-2146 §15 #32 | bog'lanmagan | Kanban / Vazifa |
| Rollover (ertangiga ko'chirish) | 2026-06-27 | TASDIQ-2146 §15 #33 | rollover cron/ustun yo'q | Kanban / Vazifa |
| Ko'chirish soni (3+) signal | 2026-06-27 | TASDIQ-2146 §15 #34 | rolled_over_count yo'q | Kanban / Vazifa |
| Ko'chirishda muddat surish | 2026-06-27 | TASDIQ-2146 §15 #35 | rollover yo'q | Kanban / Vazifa |
| Ko'chmaydigan vazifalar istisnosi | 2026-06-27 | TASDIQ-2146 §15 #36 | rollover+eskalatsiya yo'q | Kanban / Vazifa |
| Ko'chirish smena-asos vaqt | 2026-06-27 | TASDIQ-2146 §15 #37 | rollover yo'q | Kanban / Vazifa |
| Ko'chgan vazifa reja joylashuvi | 2026-06-27 | TASDIQ-2146 §15 #38 | rollover+program yo'q | Kanban / Vazifa |
| 10 kun auto-close so'rovi | 2026-06-27 | TASDIQ-2146 §15 #39 | rollover-count yo'q | Kanban / Vazifa |
| Auto-observer (boshliq) | 2026-06-27 | TASDIQ-2146 §15 #43 | autoObserver logika yo'q | Kanban / Vazifa |
| Observer limit (5) | 2026-06-27 | TASDIQ-2146 §15 #44 | limit yo'q | Kanban / Vazifa |
| Maxfiy vazifa ko'rinish | 2026-06-27 | TASDIQ-2146 §15 #45 | confidential ustun yo'q | Kanban / Vazifa |
| @mention xabar | 2026-06-27 | TASDIQ-2146 §15 #46 | mention parser yo'q | Kanban / Vazifa |
| Majburiy maydonlar (create) | 2026-06-27 | TASDIQ-2146 §15 #47 | schema optional | Kanban / Vazifa |
| Bosqichli ko'rinish scope | 2026-06-27 | TASDIQ-2146 §15 #54 | scope filtri yo'q, LIMIT 500 | Kanban / Vazifa |
| Kamchilik→tuzat vazifa | 2026-06-27 | TASDIQ-2146 §15 #57 | fromDeficiency yo'q | Kanban / Vazifa |
| Fixed-slot (tushlik/namoz) | 2026-06-27 | TASDIQ-2146 §15 #58 | personal program yo'q | Kanban / Vazifa |
| Smena tushlik slot | 2026-06-27 | TASDIQ-2146 §15 #59 | personal program yo'q | Kanban / Vazifa |
| Ta'til handover guard | 2026-06-27 | TASDIQ-2146 §15 #60 | vacation-handover yo'q | Kanban / Vazifa |
| Delegation auto-return | 2026-06-27 | TASDIQ-2146 §15 #61 | handover.return yo'q | Kanban / Vazifa |
| Zanjir vazifa gate | 2026-06-27 | TASDIQ-2146 §15 #64 | zanjir-gate yo'q | Kanban / Vazifa |
| Mentor kuzatuv-vazifa | 2026-06-27 | TASDIQ-2146 §15 #65 | mentorWatch yo'q | Kanban / Vazifa |
| Sinov→qaror cron | 2026-06-27 | TASDIQ-2146 §15 #66 | probationDecision yo'q | Kanban / Vazifa |
| Texnologik bosqich ustun seed | 2026-06-27 | TASDIQ-2146 §15 #68 | seed yo'q, axlat data | Kanban / Vazifa |
| Tiraj + progress-bar | 2026-06-27 | TASDIQ-2146 §15 #69 | tiraj/progress ustun yo'q | Kanban / Vazifa |
| Selektiv observer xabar | 2026-06-27 | TASDIQ-2146 §15 #72 | filtr yo'q | Kanban / Vazifa |
| Auto-observer (manager zanjir) | 2026-06-27 | TASDIQ-2146 §15 #73 | qo'lda faqat | Kanban / Vazifa |
| Observer limit (5) | 2026-06-27 | TASDIQ-2146 §15 #74 | limit yo'q | Kanban / Vazifa |
| Maxfiy vazifa ko'rinish | 2026-06-27 | TASDIQ-2146 §15 #75 | confidential ustun yo'q | Kanban / Vazifa |
| @mention xabar | 2026-06-27 | TASDIQ-2146 §15 #76 | mention ustun yo'q | Kanban / Vazifa |
| Bosqichli ko'rinish RBAC | 2026-06-27 | TASDIQ-2146 §15 #84 | visibility/scope yo'q | Kanban / Vazifa |
| Telegram ingest (yarat/yop) | 2026-06-27 | TASDIQ-2146 §15 #85 | ingest handler yo'q | Kanban / Vazifa |
| НО-3 17:30 avtomat vazifa | 2026-06-27 | TASDIQ-2146 §15 #86 | shablon/cron yo'q | Kanban / Vazifa |
| Kamchilik→tuzat vazifa | 2026-06-27 | TASDIQ-2146 §15 #87 | event/listener yo'q | Kanban / Vazifa |
| Fixed-slot band ko'rinish | 2026-06-27 | TASDIQ-2146 §15 #88 | personal program BE yo'q | Kanban / Vazifa |
| Smena tushlik slot+handover | 2026-06-27 | TASDIQ-2146 §15 #89 | personal program yo'q | Kanban / Vazifa |
| Ta'til handover bog'lanish | 2026-06-27 | TASDIQ-2146 §15 #90 | HR↔Kanban ulanmagan | Kanban / Vazifa |
| Delegation return | 2026-06-27 | TASDIQ-2146 §15 #91 | mexanizm/cron yo'q | Kanban / Vazifa |
| НО-rol avtomat biriktiruv | 2026-06-27 | TASDIQ-2146 §15 #92 | НО-rol master yo'q | Kanban / Vazifa |
| Vazifa-turi norma master | 2026-06-27 | TASDIQ-2146 §15 #93 | tur-norma master yo'q | Kanban / Vazifa |
| Zanjir dependency-gate | 2026-06-27 | TASDIQ-2146 §15 #94 | gate yo'q | Kanban / Vazifa |
| Mentor→shogird + LMS | 2026-06-27 | TASDIQ-2146 §15 #95 | modulda yo'q | Kanban / Vazifa |
| Sinov→qaror cron | 2026-06-27 | TASDIQ-2146 §15 #96 | cron=0, HR ulanmagan | Kanban / Vazifa |
| Texnologik bosqich ustun seed | 2026-06-27 | TASDIQ-2146 §15 #98 | seed yo'q | Kanban / Vazifa |
| Tiraj + progress datasi | 2026-06-27 | TASDIQ-2146 §15 #99 | ustun yo'q | Kanban / Vazifa |
| Qoldiq to'lov kartada | 2026-06-27 | TASDIQ-2146 §15 #100 | payment_balance yo'q | Kanban / Vazifa |
| Operator-stansiya avtomat | 2026-06-27 | TASDIQ-2146 §15 #101 | master-data yo'q | Kanban / Vazifa |
| Material→ta'minot vazifa | 2026-06-27 | TASDIQ-2146 §15 #103 | warehouse bog'lanmagan | Kanban / Vazifa |
| Overdue eskalatsiya xabar | 2026-06-27 | TASDIQ-2146 §15 #105 | cron=0, faqat read | Kanban / Vazifa |
| Примечание badge | 2026-06-27 | TASDIQ-2146 §15 #106 | badge ustun yo'q | Kanban / Vazifa |
| НО-2 jarayon-shablon | 2026-06-27 | TASDIQ-2146 §15 #107 | seed/zanjir yo'q | Kanban / Vazifa |
| Lavozim-karta link | 2026-06-27 | TASDIQ-2146 §15 #108 | card_id/position-link yo'q | Kanban / Vazifa |
| Vazifa toifasi (seriya) master | 2026-06-27 | TASDIQ-2146 §15 #109 | toifa master yo'q | Kanban / Vazifa |
| Оргполитика→shablon | 2026-06-27 | TASDIQ-2146 §15 #110 | listener yo'q | Kanban / Vazifa |
| Kutilgan natija maydoni | 2026-06-27 | TASDIQ-2146 §15 #111 | expected_outcome yo'q | Kanban / Vazifa |
| Smena estafeta | 2026-06-27 | TASDIQ-2146 §15 #112 | shift-relay yo'q | Kanban / Vazifa |
| Brak→rework vazifa | 2026-06-27 | TASDIQ-2146 §15 #113 | QC bog'lanmagan | Kanban / Vazifa |
| Stansiya-navbat avtomat sort | 2026-06-27 | TASDIQ-2146 §15 #114 | stansiya-ustun yo'q | Kanban / Vazifa |
| Ichki/tashqi belgi | 2026-06-27 | TASDIQ-2146 §15 #115 | internal_flag yo'q | Kanban / Vazifa |
| Kun-boshi reja tasdiq | 2026-06-27 | TASDIQ-2146 §15 #116 | personal program BE yo'q | Kanban / Vazifa |
| Deadline cho'zish gate | 2026-06-27 | TASDIQ-2146 §15 #117 | gate/sabab yo'q | Kanban / Vazifa |
| Vazifa qaytarish (reject) | 2026-06-27 | TASDIQ-2146 §15 #118 | return endpoint yo'q | Kanban / Vazifa |
| Maxfiy vazifa RBAC | 2026-06-27 | TASDIQ-2146 §15 #120 | confidential ustun yo'q | Kanban / Vazifa |
| Bosqich dependency (bloklangan) | 2026-06-27 | TASDIQ-2146 §15 #122 | blocked_by yo'q | Kanban / Vazifa |
| Летучка standup view | 2026-06-27 | TASDIQ-2146 §15 #124 | birlashgan ekran yo'q | Kanban / Vazifa |
| @xabar vs @so'rov | 2026-06-27 | TASDIQ-2146 §15 #125 | mention/so'rov yo'q | Kanban / Vazifa |
| Hayfa yozma iz + HR | 2026-06-27 | TASDIQ-2146 §15 #126 | hayfa yozish/trigger yo'q | Kanban / Vazifa |
| OrderUpdated→karta sync | 2026-06-27 | TASDIQ-2146 §15 #127 | listener yo'q | Kanban / Vazifa |
| Упаковка→ombor/yetkazish | 2026-06-27 | TASDIQ-2146 §15 #128 | WMS/delivery bog'lanmagan | Kanban / Vazifa |
| Karta rangi mahsulot turi | 2026-06-27 | TASDIQ-2146 §15 #129 | product-type master yo'q | Kanban / Vazifa |
| Qadam norma eskalatsiya | 2026-06-27 | TASDIQ-2146 §15 #130 | norma master/cron yo'q | Kanban / Vazifa |
| Arxiv naqsh AI-tahlil | 2026-06-27 | TASDIQ-2146 §15 #131 | AI-analitika yo'q | Kanban / Vazifa |
| Vazifa lavozimga berish | 2026-06-27 | TASDIQ-2146 §15 #132 | karta-markaz yo'q | Kanban / Vazifa |
| Stansiya kunlik norma plan-fakt | 2026-06-27 | TASDIQ-2146 §15 #133 | norma master/MES yo'q | Kanban / Vazifa |
| ТХ davriy yo'riqnoma | 2026-06-27 | TASDIQ-2146 §15 #135 | ТХ shablon/cron yo'q | Kanban / Vazifa |
| Заявка ombor-qoldiq solishtirish | 2026-06-27 | TASDIQ-2146 §15 #136 | WMS/MM bog'lanmagan | Kanban / Vazifa |
| Stansiya-operator reassign | 2026-06-27 | TASDIQ-2146 §15 #137 | master-data/event yo'q | Kanban / Vazifa |
