## [B/TASDIQ] Bildirishnoma / Botlar (18) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 18.1 | ShVB 4 komanda to'liq (/zvs_status,/my_gsd,/company_state,/weekly_digest) | 2026-06-27 | TASDIQ-2146 §18 #1 | Egasi YO'NALISH 38 tasdig'i | Fin-bot komandalar | 4 komanda ham REAL SQL | Qisman | bot.helpers.ts:151,178,224 3 tasi bor; /my_gsd yo'q |
| 18.2 | 'Mening holatim': karta+vazifa+haftalik%+razryad | 2026-06-27 | TASDIQ-2146 §18 #2 | Karta-markazli shaxsiy holat | director.bot komandalar | /my_gsd + karta-status komandasi | Yo'q | director.bot.ts faqat /kpi /ai /summary |
| 18.3 | Haftalik digest egasi-sozlanadigan vaqtda | 2026-06-27 | TASDIQ-2146 §18 #3 | Egasi har modul vaqtini belgilaydi (Q140) | Cron/schedule | notification_schedules dan sozlash | Qisman | fp-cycle.cron.ts hardcoded; jadval count=0 |
| 18.4 | Digest org-marshrut bo'yicha (har kim darajasini) | 2026-06-27 | TASDIQ-2146 §18 #4 | Vysotskiy vertikal | fp-cycle marshrut | Daraja-bo'yicha umumlashtirish | Qisman | ZVS faqat manager'larga; daraja-marshrut yo'q |
| 18.5 | FP-tsikl (reja→bajar→bahola→hisobot) eslatmalari | 2026-06-27 | TASDIQ-2146 §18 #5 | To'liq tsikl har bosqichda | fp-cycle cron | 4-bosqichli tsikl eslatma | Qisman | fp-cycle.cron.ts 2 cron (ZVS+GSD), 4-bosqich emas |
| 18.6 | Holat chegaradan o'tsa darrov signal | 2026-06-27 | TASDIQ-2146 §18 #6 | Past natijaga darrov alert | alerts.service | threshold-trigger+debounce | Yo'q | alerts.service bor; trigger/debounce/BullMQ yo'q |
| 18.7 | Alert chegaralarini egasi har modulga belgilaydi | 2026-06-27 | TASDIQ-2146 §18 #7 | Egasi konfiguratsiyasi (Q140) | Chegara jadval | Chegara-config jadval+UI | Yo'q | kanban_column_sla h.k. count=0 |
| 18.8 | Shaxsiy natija shaxsiy chatga, bo'lim guruhga | 2026-06-27 | TASDIQ-2146 §18 #8 | Maxfiy/jamoaviy ajratish | Kanal marshrut | Avto shaxsiy/guruh ajratish | Qisman | telegram_chat_id + telegram_group_id ustunlar bor; marshrut yo'q |
| 18.9 | Telegram guruhini org-tugunga avto bog'lash | 2026-06-27 | TASDIQ-2146 §18 #9 | Har tugun o'z guruhi | org_nodes | Guruh-org marshrut | Qisman | org_nodes.telegram_group_id jonli; marshrut to'liq emas |
| 18.10 | Vertikal yo'naltirish (manager_id zanjiri) | 2026-06-27 | TASDIQ-2146 §18 #10 | Vysotskiy keyingi daraja | NTF↔CC | manager_id zanjiriga NTF ulanishi | Qisman | cc-org-resolver:127-164 REAL; NTF jadvali ulanmagan |
| 18.11 | /company_state = 7 otdeleniye ko'rsatkichlari | 2026-06-27 | TASDIQ-2146 §18 #11 | 7 otdeleniye panoramasi | Fin-bot | 7-otdeleniye to'liq panorama | Qisman | bot.helpers.ts:178-198 moliya-fokus; 7-otdeleniye emas |
| 18.12 | Leaderboard (top-3/past-3) digestda | 2026-06-27 | TASDIQ-2146 §18 #12 | Bo'lim+shaxs reyting | Digest | Digestga leaderboard | Yo'q | gamification alohida, NTF digestga ulanmagan |
| 18.13 | Karta-AI bahosi (mos/qisman/emas) digestda | 2026-06-27 | TASDIQ-2146 §18 #13 | Haftalik AI xulosasi | Digest | AI-fit hisoboti digestga | Yo'q | karta-AI baho NTF orqali bormaydi |
| 18.14 | Razryad o'zgarishi xabari (xodim+rahbar+HR) | 2026-06-27 | TASDIQ-2146 §18 #14 | 3 adresatga oylik bilan | razryad→NTF | razryad.changed event/listener | Yo'q | razryad→NTF zanjiri ulanmagan |
| 18.15 | Bildirishnoma profil tilida (lotin/kirill/rus) | 2026-06-27 | TASDIQ-2146 §18 #15 | i18n 3-til per-user | notifications | per-user til + snapshot-at-enqueue | Qisman | title/message _uz/_ru bor; snapshot-at-enqueue yo'q |
| 18.16 | O'qilgan ACK tugma (muhim xabarlarda) | 2026-06-27 | TASDIQ-2146 §18 #16 | 'ko'rmadim' bahonasini yo'qotish | Telegram inline | inline-keyboard ACK + ack_at | Yo'q | web read_at bor; Telegram ACK tugma/ack_at yo'q |
| 18.17 | Javob bermasa avto eskalatsiya (manager_id) | 2026-06-27 | TASDIQ-2146 §18 #17 | Vaqt o'tsa yuqoriga | NTF eskalatsiya | Umumiy NTF eskalatsiya-taymer | Qisman | cc-sla.cron REAL lekin faqat cc_documents; BullMQ yo'q |
| 18.18 | Tinchlik vaqti (tunda faqat shoshilinch) | 2026-06-27 | TASDIQ-2146 §18 #18 | Ish/tun rejimi, egasi sozlaydi | quiet-hours | quiet-hours + CRITICAL istisno | Yo'q | quiet-hours logikasi/jadval yo'q |
| 18.19 | Per-modul bot ERP'ga ulangan | 2026-06-27 | TASDIQ-2146 §18 #19 | Har modul o'z boti (Q50/Q101/Q102) | bot-gateway | 9 modul-bot ERP DB'ga | Ha | bot-gateway.controller /bot/:bot/webhook 9 bot jonli SQL |
| 18.20 | Digestga PDF/grafik biriktirish | 2026-06-27 | TASDIQ-2146 §18 #20 | Matn+bosib ko'riladigan PDF | telegram.service | Digest PDF biriktirish | Yo'q | sendMessage faqat matn (HTML); Reports-503 fallback yo'q |
| 18.21 | Telegram orqali javob/buyruq (tugma bilan) | 2026-06-27 | TASDIQ-2146 §18 #21 | Interaktiv tasdiq/rad | bot-gateway | inline-keyboard tasdiq-flow | Qisman | callback_query qabul (ctrl:38-42); tugma-flow qurilmagan |
| 18.22 | Bot komandalariga RBAC (org-daraja) | 2026-06-27 | TASDIQ-2146 §18 #22 | Har kim o'z huquqidagini | director.bot | hasBotPermission + guard | Ha | director.bot.ts:21 + TelegramAuthGuard REAL |
| 18.23 | Yangi xodim ulanishi (HR Telegram havola/OTP) | 2026-06-27 | TASDIQ-2146 §18 #23 | HR deep-link/kod, 24h | users.telegram_id | 24h OTP + HR qayta-yuborish tugma | Qisman | telegram_id UNIQUE + deep-link bor; 24h OTP/tugma to'liq emas |
| 18.24 | Oltin-ip (buyurtma) holati bo'yicha xabar | 2026-06-27 | TASDIQ-2146 §18 #24 | Har bosqichda mas'ul+savdo+rahbar | order listener | Har-bosqich status marshrut | Qisman | order-created-notification.listener:42-50 REAL; faqat 'created' |
| 18.25 | Kechikish/muddat signali (ikki bosqich) | 2026-06-27 | TASDIQ-2146 §18 #25 | Oldindan+o'tsa signal | Muddat-taymer | ikki-bosqichli delayed-job | Yo'q | BullMQ delayed-job yo'q |
| 18.26 | ЦКП bajarilishi haftalik xabar | 2026-06-27 | TASDIQ-2146 §18 #26 | ЦКП foizi xodim+rahbar | ЦКП→NTF | ckp.weekly event/cron | Yo'q | ckp.weekly topilmadi |
| 18.27 | Bildirishnoma jurnali (kim/qachon/o'qildi) | 2026-06-27 | TASDIQ-2146 §18 #27 | To'liq jurnal ERP ichida | notifications | notification_logs audit-jurnal | Qisman | notifications 3735 qator+read_at bor; notification_logs count=0 |
| 18.28 | Shablonni egasi/admin ERP ichidan tahrirlaydi | 2026-06-27 | TASDIQ-2146 §18 #28 | Kodga tegmasdan (TelegramBotAdmin) | Shablon CRUD | Shablon-tahrir CRUD+UI | Qisman | notification-schema faqat ensurePreferencesTables; i18n json statik |
| 18.29 | Avariya/to'xtash signali (usta+texnik+boshliq) | 2026-06-27 | TASDIQ-2146 §18 #29 | To'xtasa 3 adresatga | mro listener | 3-adresat parallel fan-out | Qisman | mro-machine-stopped listener:41-48 faqat direktorga |
| 18.30 | Maqtov/tanbeh (top ochiq, past shaxsiy) | 2026-06-27 | TASDIQ-2146 §18 #30 | Top guruhda, past shaxsiy | Feedback→NTF | maqtov NTF zanjiri | Yo'q | gamification alohida, NTF'ga ulanmagan |
| 18.31 | 6 turdagi 'yozma majburiy' rasmiy yozuvga | 2026-06-27 | TASDIQ-2146 §18 #31 | Telegramdan rasmiy yozuv (raqam+sana+muallif) | Formalize handler | ntf.written.formalize handler | Yo'q | Telegram→rasmiy ERP-yozuv handler yo'q |
| 18.32 | Og'zaki topshiriq 24h ichida yozma qayd | 2026-06-27 | TASDIQ-2146 §18 #32 | Og'zaki→24h yozma yoki eskalatsiya | kanban_tasks | source=verbal + 24h taymer | Yo'q | verbal_confirmed_at+24h taymer/BullMQ yo'q |
| 18.33 | Tex-kartada xato — 15 daq signal cron | 2026-06-27 | TASDIQ-2146 §18 #33 | Bosh texnolog+15daq→RD-4 | TechCardError | listener+15daq taymer | Yo'q | grep techcard.*15 topmadi; BullMQ taymer yo'q |
| 18.34 | Tex-karta tuzatish — 1 soat countdown (45/60) | 2026-06-27 | TASDIQ-2146 §18 #34 | 45daq eslatma, 60daq RD-5 | Fix-taymer | ntf.techcard.fix1hour | Yo'q | ketma-ket taymer mexanizmi yo'q |
| 18.35 | Tungi smena telefon-eskalatsiya (qildi/javob) | 2026-06-27 | TASDIQ-2146 §18 #35 | Tungi 'telefon→javob' qayd | call.log | Telefon-protokol qayd jadval | Yo'q | call.log qayd jadvali yo'q |
| 18.36 | Tungi yakka qaror belgi + ertalab digest | 2026-06-27 | TASDIQ-2146 §18 #36 | Bosh texnolog+RD-5 ertalab | night flag | night.soloDecision belgi+digest | Yo'q | tungi-yakka-qaror qayd/digest yo'q |
| 18.37 | Bevosita rahbarni chetlab o'tish signali | 2026-06-27 | TASDIQ-2146 §18 #37 | Sabab+asl rahbarga nusxa | bypass flow | bypass.emergency flow | Yo'q | favqulodda-chetlash+nusxa yo'q |
| 18.38 | Yuboruvchi vs qabul qiluvchi masъuliyat | 2026-06-27 | TASDIQ-2146 §18 #38 | Ikki tomonli (yubor+qabul+ko'rildi) | notifications | sender_id + ikki-tomon ajratish | Qisman | user_id+read_at bor; sender_id yo'q |
| 18.39 | Mijoz muammosi savdo menejeriga avto | 2026-06-27 | TASDIQ-2146 §18 #39 | 'Mijoz masalasi'→savdo (RD-5) | problem route | problem.routeSales | Yo'q | brak-tabiat→savdo marshruti yo'q |
| 18.40 | RD-2/RD-4/RD-5 uchlik yig'ilish (1 soat) | 2026-06-27 | TASDIQ-2146 §18 #40 | 3 rahbar+taymer+qaror qaydi | trio meeting | trio.meeting1hour | Yo'q | uchlik-yig'ilish mexanizmi yo'q |
| 18.41 | 'Vaqtincha to'xtatish' zanjirga e'lon | 2026-06-27 | TASDIQ-2146 §18 #41 | Barcha masъulga signal | halt broadcast | halt.broadcast fan-out | Yo'q | to'xtash-qaror fan-out yo'q |
| 18.42 | Yangi оргополитика e'loni (НО-3, 1 kun) | 2026-06-27 | TASDIQ-2146 §18 #42 | НО-3+adaptatsiya+1kun (Q55) | orgpolicy | orgpolicy.announce | Yo'q | НО-3/adaptatsiya NTF zanjiri yo'q |
| 18.43 | Takroriy xato → оргополитика yozish topshirig'i | 2026-06-27 | TASDIQ-2146 §18 #43 | 2-marta xato→boshliq+НО-3 | repeatError | repeatError.policy (Kanban vazifa) | Yo'q | defect_type_code takror sanash yo'q |
| 18.44 | Kun yakuni НО-3 hisoboti avto eslatma | 2026-06-27 | TASDIQ-2146 §18 #44 | Bermasa НО-3'ga signal | no3 cron | no3.dailyReport cron | Yo'q | kun-yakuni НО-3 cron yo'q |
| 18.45 | Kunlik/haftalik/oylik uchligi (3 ritm) | 2026-06-27 | TASDIQ-2146 §18 #45 | Har biri o'z adresati | fp-cycle | report.triRhythm 3-ritm | Qisman | fp-cycle haftalik bor; kunlik+oylik yo'q |
| 18.46 | Smenalik hisobot (texnolog→bosh rejalashtiruvchi) | 2026-06-27 | TASDIQ-2146 §18 #46 | Smena oxirida avto yo'naltirish | shift report | shift.report + cron | Yo'q | mes_shift_schedules cron yo'q |
| 18.47 | Xom-ashyo yetishmasligi → rejalashtiruvchiga | 2026-06-27 | TASDIQ-2146 §18 #47 | Zaxira yetmasa darhol+ta'minot | material shortage | material.shortage trigger | Yo'q | warehouse_stock min_threshold trigger yo'q |
| 18.48 | Roxler (jihoz) nosozligi — eng yuqori ustuvor | 2026-06-27 | TASDIQ-2146 §18 #48 | Boshqalar ustida ustuvor | equipment | EquipmentFaultEvent+KRITIK marshrut | Yo'q | grep equipment.fault NTF'da topmadi |
| 18.49 | Kechikish xavfi 'darhol xabardor' tugmasi | 2026-06-27 | TASDIQ-2146 §18 #49 | Bitta tugma→boshliq+qayd | delayRisk | delayRisk.button | Yo'q | operator delay-risk tugma yo'q |
| 18.50 | 'Vaqtida xabar bermaslik' kamchilik qaydi | 2026-06-27 | TASDIQ-2146 §18 #50 | Muammo-vaqt vs xabar-vaqt→KPI | lateReport | lateReport.measure→KPI | Yo'q | vaqt-farq hisoblash yo'q |
| 18.51 | Kartochka status→keyingi masъulga avto | 2026-06-27 | TASDIQ-2146 §18 #51 | Har status keyingi bosqichga | orphan listener | card.statusChange real yuborish | Yo'q | orphan-events.listener:92 'TODO: notify' log-stub |
| 18.52 | Kartochka 'Тасдиқда' tasdiq-kutish signali | 2026-06-27 | TASDIQ-2146 §18 #52 | Tasdiqlovchiga+eskalatsiya | card approval | card.approvalWait+eskalatsiya | Yo'q | Тасдиқда-status NTF yo'q |
| 18.53 | ТТ to'liqsiz kelganda dizayner/savdoga signal | 2026-06-27 | TASDIQ-2146 §18 #53 | Bo'sh maydon→savdoga, dizayner blok | tt validation | tt.incomplete trigger | Yo'q | ТТ-to'liqlik NTF zanjiri yo'q |
| 18.54 | Korrektor xato→dizaynerga darhol+blok | 2026-06-27 | TASDIQ-2146 §18 #54 | Keyingi bosqich bloklanadi | corrector | corrector.block (KanbanBlock) | Yo'q | korrektor→blok zanjiri yo'q |
| 18.55 | Dizayner tasdiqsiz fayl yuborgani signali | 2026-06-27 | TASDIQ-2146 §18 #55 | Tasdiqsiz→rahbarga+qayd | file check | file.unapproved (approved_by NULL) | Yo'q | design_files.approved_by tekshiruv yo'q |
| 18.56 | Og'zaki reja 'rasmiy emas' ogohlantirishi | 2026-06-27 | TASDIQ-2146 §18 #56 | Yozma yo'q rejaga belgi | plan flag | plan.notFormal | Yo'q | belgi/ogohlantirish yo'q |
| 18.57 | Reja o'zgarishi→bog'liq bo'limga e'lon (gorizontal) | 2026-06-27 | TASDIQ-2146 §18 #57 | Avto e'lon+ko'rgani qayd | plan broadcast | plan.broadcast (workflow_rules) | Yo'q | NTF gorizontal-marshrut yo'q |
| 18.58 | Аналитik kanal (Совершенствование xulosalari) | 2026-06-27 | TASDIQ-2146 §18 #58 | Alohida kanal faqat Совершенствование | analytic channel | analytic.channel belgi | Yo'q | alohida kanal qurilmagan |
| 18.59 | Brak rol-cheklab yo'naltirish (texnik/mijoz) | 2026-06-27 | TASDIQ-2146 §18 #59 | Brak-tabiat→to'g'ri rol | defect route | defect.routeByRole | Yo'q | QC defect→NTF rol-marshrut yo'q |
| 18.60 | Shikast xom-ashyo xabar+karantin belgisi | 2026-06-27 | TASDIQ-2146 §18 #60 | Ta'minot/rahbar+karantin | material damaged | material.damaged+karantin | Yo'q | signal+karantin qurilmagan |
| 18.61 | Eslatma turlari belgilari (🔴⏰✅📋📊) | 2026-06-27 | TASDIQ-2146 §18 #61 | Bir qarashda ajratish | notifications type | 5-tur tizimli belgi-tasnif | Qisman | botlar emoji + priority/type ustun bor; tizimli tasnif yo'q |
| 18.62 | Alert ustuvorlik 3 daraja (KRITIK/MUHIM/ODDIY) | 2026-06-27 | TASDIQ-2146 §18 #62 | 3 daraja tartiblash | notifications priority | 3-darajali tartiblash logikasi | Qisman | priority ustuni bor; tartiblash/ko'rsatish yo'q |
| 18.63 | 'Darhol' xabarlar tunda o'tadimi (KRITIK istisno) | 2026-06-27 | TASDIQ-2146 §18 #63 | Faqat KRITIK tunda | quiet exception | quiet.criticalException | Yo'q | CRITICAL bypass ishlatilmaydi |
| 18.64 | Muddat eslatmasi ikki bosqich (oldindan+o'tganda) | 2026-06-27 | TASDIQ-2146 §18 #64 | Oldindan+o'tsa rahbarga | deadline | deadline.twoStage (15daq/1soat/1kun) | Yo'q | muddat-taymer mexanizmi yo'q |
| 18.65 | Departament-darajasida umumlashgan hisobot | 2026-06-27 | TASDIQ-2146 §18 #65 | operator→bo'lim→departament | report aggregate | report.aggregateVertical | Yo'q | daraja-umumlashtirish yo'q |
| 18.66 | Masъuliyat lavozimga (kartaga) yo'naltirish | 2026-06-27 | TASDIQ-2146 §18 #66 | Xodim almashsa avto (karta-model) | notifications | recipient_card_id marshrut | Yo'q | user_id (xodimga) ishlatadi; recipient_card_id yo'q |
| 18.67 | Masъuliyat og'zaki o'tkazish taqiqi (faqat yozma) | 2026-06-27 | TASDIQ-2146 §18 #67 | Faqat rasmiy yozma topshiriq | responsibility | responsibility.writtenOnly forma | Yo'q | rasmiy o'tkazma forma yo'q |
| 18.68 | Oylik masъuliyat tahlili digesti (Совершенствование) | 2026-06-27 | TASDIQ-2146 §18 #68 | qaror→masъul→natija | monthly digest | monthly.responsibilityDigest | Yo'q | oylik masъuliyat-tahlil yo'q |
| 18.69 | Rasmiy ma'lumot talabi (muddat bilan) | 2026-06-27 | TASDIQ-2146 §18 #69 | boshliqga signal+muddat+eslatma | dataRequest | dataRequest.deadline | Yo'q | qurilmagan |
| 18.70 | Eski ma'lumot ustida ishlash ogohlantirishi | 2026-06-27 | TASDIQ-2146 §18 #70 | Yangilansa eski ochganlarga signal | staleData | staleData.warn (ntf_doc_views) | Yo'q | ntf_doc_views count=0; doc_version kuzatuvi yo'q |
| 18.71 | Yig'ilish topshiriqlari uchun eslatma (muddat) | 2026-06-27 | TASDIQ-2146 §18 #71 | Bajarilmasa rahbarga | meeting | meeting.taskReminder | Yo'q | qurilmagan |
| 18.72 | Telefon-qo'ng'iroq qaydi (tungi, ikki tomonli) | 2026-06-27 | TASDIQ-2146 §18 #72 | 'Qildim'/'javob berdim' qayd | call.log | call.log ikki-tomon qayd | Yo'q | qurilmagan |
| 18.73 | Buyurtma tugamasdan reja o'zgarsa signal+sabab | 2026-06-27 | TASDIQ-2146 §18 #73 | qayd+sabab+oylik tahlil | plan mid-order | plan.midOrderChange | Yo'q | PlanChangedMidOrderEvent yo'q |
| 18.74 | Kanban qotgan kartochkaga signal | 2026-06-27 | TASDIQ-2146 §18 #74 | Ko'p qotsa→masъul+boshliq | kanban SLA | kanban.stuck (kanban_column_sla cron) | Yo'q | kanban_column_sla count=0; CC-da bor (cc_documents) |
| 18.75 | Buyurtma bajarilishi hisoboti (RD-5→rahbariyat) | 2026-06-27 | TASDIQ-2146 §18 #75 | reja/fakt/kechikish avto | order report | order.completionReport | Yo'q | qurilmagan |
| 18.76 | Bo'lim boshqaning vazifasiga aralashsa signal | 2026-06-27 | TASDIQ-2146 §18 #76 | Vakolatdan tashqari→boshliq+qayd | scope | scope.violation (workflow_rules) | Yo'q | chegara-qoidasi qurilmagan |
| 18.77 | Adaptatsiya (o'qitish) yakunini bot tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §18 #77 | Tasdiqlamaganlar НО-3'ga (Q55) | adaptation | adaptation.confirm (LmsModuleCompleted) | Yo'q | o'qib-tasdiqlash NTF zanjiri yo'q |
| 18.78 | Smenalararo topshirish (peshma-pesh) xabari | 2026-06-27 | TASDIQ-2146 §18 #78 | Ochiq ishlar keyingi smena+texnolog | shift handover | shift.handover (15daq-oldin scheduled) | Qisman | shift_handovers jadval bor; NTF avto topshirish yo'q |
| 18.79 | 'Kim-nima-oladi' matritsasini egasi ko'radi | 2026-06-27 | TASDIQ-2146 §18 #79 | hodisa→lavozim→kanal (egasi-qaror) | Marshrut-matritsa | Markaziy matritsa jadval+UI | egasi-data | notification_schedules count=0; egasi tasdig'i kutadi |
| 18.80 | 'Ma'lumot yo'qolmaydi' — o'chirilmaydigan arxiv | 2026-06-27 | TASDIQ-2146 §18 #80 | Rasmiy xabar immutable, qidiriladi | notifications | DELETE-trigger/immutable flag | Qisman | 3735 qator saqlanadi; immutable kafolat yo'q |
| 18.81 | Brak statistikasi haftalik digest (bo'lim kesim) | 2026-06-27 | TASDIQ-2146 §18 #81 | Xato soni+takror bo'lim kesimida | defect stats | defect.weeklyStats | Yo'q | bo'lim-kesim digest qurilmagan |
| 18.82 | Ko'rilmagan muhim xabar qayta-yuborish jadvali | 2026-06-27 | TASDIQ-2146 §18 #82 | 2 marta qayta+eskalatsiya | resend | resend.schedule (BullMQ retry) | Yo'q | qayta-yuborish mexanizmi yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| 18.2 'Mening holatim' karta-status komandasi | 2026-06-27 | TASDIQ-2146 §18 #2 | director.bot faqat /kpi /ai /summary; /my_gsd yo'q | Bildirishnoma |
| 18.6 Chegaradan o'tsa darrov signal | 2026-06-27 | TASDIQ-2146 §18 #6 | threshold-trigger+debounce+BullMQ yo'q | Bildirishnoma |
| 18.7 Alert chegaralarini egasi belgilaydi | 2026-06-27 | TASDIQ-2146 §18 #7 | chegara-config jadval count=0, UI yo'q | Bildirishnoma |
| 18.12 Leaderboard digestda | 2026-06-27 | TASDIQ-2146 §18 #12 | gamification NTF digestga ulanmagan | Bildirishnoma |
| 18.13 Karta-AI bahosi digestda | 2026-06-27 | TASDIQ-2146 §18 #13 | AI-fit hisoboti NTF orqali bormaydi | Bildirishnoma |
| 18.14 Razryad o'zgarishi xabari (3 adresat) | 2026-06-27 | TASDIQ-2146 §18 #14 | razryad→NTF zanjiri ulanmagan | Bildirishnoma |
| 18.16 Telegram ACK tugma | 2026-06-27 | TASDIQ-2146 §18 #16 | inline-keyboard ACK + ack_at yo'q | Bildirishnoma |
| 18.18 Tinchlik vaqti (quiet-hours) | 2026-06-27 | TASDIQ-2146 §18 #18 | quiet-hours logikasi/jadval yo'q | Bildirishnoma |
| 18.20 Digestga PDF biriktirish | 2026-06-27 | TASDIQ-2146 §18 #20 | sendMessage faqat matn; PDF fallback yo'q | Bildirishnoma |
| 18.25 Muddat ikki-bosqich signal | 2026-06-27 | TASDIQ-2146 §18 #25 | BullMQ delayed-job yo'q | Bildirishnoma |
| 18.26 ЦКП haftalik xabar | 2026-06-27 | TASDIQ-2146 §18 #26 | ckp.weekly event/cron yo'q | Bildirishnoma |
| 18.30 Maqtov/tanbeh NTF | 2026-06-27 | TASDIQ-2146 §18 #30 | gamification NTF'ga ulanmagan | Bildirishnoma |
| 18.31 6-tur yozma→rasmiy yozuv | 2026-06-27 | TASDIQ-2146 §18 #31 | Telegram→rasmiy ERP-yozuv handler yo'q | Bildirishnoma |
| 18.32 Og'zaki topshiriq 24h qayd | 2026-06-27 | TASDIQ-2146 §18 #32 | verbal_confirmed_at+24h taymer yo'q | Bildirishnoma |
| 18.33 Tex-karta xato 15daq cron | 2026-06-27 | TASDIQ-2146 §18 #33 | TechCardError listener+taymer yo'q | Bildirishnoma |
| 18.34 Tex-karta 1 soat countdown | 2026-06-27 | TASDIQ-2146 §18 #34 | ketma-ket taymer yo'q | Bildirishnoma |
| 18.35 Tungi telefon-eskalatsiya | 2026-06-27 | TASDIQ-2146 §18 #35 | call.log qayd jadvali yo'q | Bildirishnoma |
| 18.36 Tungi yakka qaror digest | 2026-06-27 | TASDIQ-2146 §18 #36 | night.soloDecision qayd yo'q | Bildirishnoma |
| 18.37 Rahbarni chetlab o'tish signali | 2026-06-27 | TASDIQ-2146 §18 #37 | bypass.emergency flow yo'q | Bildirishnoma |
| 18.39 Mijoz muammosi savdoga avto | 2026-06-27 | TASDIQ-2146 §18 #39 | problem.routeSales yo'q | Bildirishnoma |
| 18.40 RD-2/4/5 uchlik yig'ilish | 2026-06-27 | TASDIQ-2146 §18 #40 | trio.meeting1hour yo'q | Bildirishnoma |
| 18.41 'Vaqtincha to'xtatish' e'lon | 2026-06-27 | TASDIQ-2146 §18 #41 | halt.broadcast fan-out yo'q | Bildirishnoma |
| 18.42 Yangi оргополитика e'loni | 2026-06-27 | TASDIQ-2146 §18 #42 | orgpolicy.announce zanjiri yo'q | Bildirishnoma |
| 18.43 Takroriy xato→policy topshiriq | 2026-06-27 | TASDIQ-2146 §18 #43 | defect_type_code takror sanash yo'q | Bildirishnoma |
| 18.44 Kun yakuni НО-3 cron | 2026-06-27 | TASDIQ-2146 §18 #44 | no3.dailyReport cron yo'q | Bildirishnoma |
| 18.46 Smenalik hisobot yo'naltirish | 2026-06-27 | TASDIQ-2146 §18 #46 | mes_shift_schedules cron yo'q | Bildirishnoma |
| 18.47 Xom-ashyo yetishmasligi signali | 2026-06-27 | TASDIQ-2146 §18 #47 | warehouse_stock min_threshold trigger yo'q | Bildirishnoma |
| 18.48 Roxler jihoz nosozligi ustuvor | 2026-06-27 | TASDIQ-2146 §18 #48 | EquipmentFaultEvent listener yo'q | Bildirishnoma |
| 18.49 Kechikish xavfi tugmasi | 2026-06-27 | TASDIQ-2146 §18 #49 | delayRisk.button yo'q | Bildirishnoma |
| 18.50 'Vaqtida xabar bermaslik' KPI | 2026-06-27 | TASDIQ-2146 §18 #50 | lateReport.measure yo'q | Bildirishnoma |
| 18.51 Kartochka status→keyingi masъul | 2026-06-27 | TASDIQ-2146 §18 #51 | orphan-events.listener:92 'TODO: notify' stub | Bildirishnoma |
| 18.52 'Тасдиқда' tasdiq-kutish signal | 2026-06-27 | TASDIQ-2146 §18 #52 | card.approvalWait+eskalatsiya yo'q | Bildirishnoma |
| 18.53 ТТ to'liqsiz→dizayner/savdo signal | 2026-06-27 | TASDIQ-2146 §18 #53 | tt.incomplete trigger yo'q | Bildirishnoma |
| 18.54 Korrektor xato→blok | 2026-06-27 | TASDIQ-2146 §18 #54 | corrector.block zanjiri yo'q | Bildirishnoma |
| 18.55 Tasdiqsiz fayl signali | 2026-06-27 | TASDIQ-2146 §18 #55 | file.unapproved tekshiruv yo'q | Bildirishnoma |
| 18.56 Og'zaki reja 'rasmiy emas' | 2026-06-27 | TASDIQ-2146 §18 #56 | plan.notFormal belgi yo'q | Bildirishnoma |
| 18.57 Reja o'zgarishi gorizontal e'lon | 2026-06-27 | TASDIQ-2146 §18 #57 | plan.broadcast (workflow_rules) yo'q | Bildirishnoma |
| 18.58 Аналитik kanal | 2026-06-27 | TASDIQ-2146 §18 #58 | analytic.channel yo'q | Bildirishnoma |
| 18.59 Brak rol-cheklab yo'naltirish | 2026-06-27 | TASDIQ-2146 §18 #59 | defect.routeByRole yo'q | Bildirishnoma |
| 18.60 Shikast xom-ashyo+karantin | 2026-06-27 | TASDIQ-2146 §18 #60 | material.damaged+karantin yo'q | Bildirishnoma |
| 18.63 KRITIK tunda istisno | 2026-06-27 | TASDIQ-2146 §18 #63 | quiet.criticalException / CRITICAL bypass yo'q | Bildirishnoma |
| 18.64 Muddat ikki-bosqich (yagona qoida) | 2026-06-27 | TASDIQ-2146 §18 #64 | deadline.twoStage taymer yo'q | Bildirishnoma |
| 18.65 Departament umumlashgan hisobot | 2026-06-27 | TASDIQ-2146 §18 #65 | report.aggregateVertical yo'q | Bildirishnoma |
| 18.66 Masъuliyat kartaga yo'naltirish | 2026-06-27 | TASDIQ-2146 §18 #66 | recipient_card_id ustuni yo'q | Bildirishnoma |
| 18.67 Masъuliyat faqat yozma o'tkazish | 2026-06-27 | TASDIQ-2146 §18 #67 | responsibility.writtenOnly forma yo'q | Bildirishnoma |
| 18.68 Oylik masъuliyat digesti | 2026-06-27 | TASDIQ-2146 §18 #68 | monthly.responsibilityDigest yo'q | Bildirishnoma |
| 18.69 Rasmiy ma'lumot talabi muddat | 2026-06-27 | TASDIQ-2146 §18 #69 | dataRequest.deadline yo'q | Bildirishnoma |
| 18.70 Eski ma'lumot ogohlantirishi | 2026-06-27 | TASDIQ-2146 §18 #70 | ntf_doc_views count=0; doc_version yo'q | Bildirishnoma |
| 18.71 Yig'ilish topshiriq eslatma | 2026-06-27 | TASDIQ-2146 §18 #71 | meeting.taskReminder yo'q | Bildirishnoma |
| 18.72 Telefon-qo'ng'iroq ikki-tomon qayd | 2026-06-27 | TASDIQ-2146 §18 #72 | call.log yo'q | Bildirishnoma |
| 18.73 Reja o'zgarishi signal+sabab | 2026-06-27 | TASDIQ-2146 §18 #73 | plan.midOrderChange yo'q | Bildirishnoma |
| 18.74 Kanban qotgan kartochka signal | 2026-06-27 | TASDIQ-2146 §18 #74 | kanban_column_sla count=0; SLA cron yo'q | Bildirishnoma |
| 18.75 Buyurtma bajarilishi hisoboti | 2026-06-27 | TASDIQ-2146 §18 #75 | order.completionReport yo'q | Bildirishnoma |
| 18.76 Gorizontal chegara aralashuv signali | 2026-06-27 | TASDIQ-2146 §18 #76 | scope.violation (workflow_rules) yo'q | Bildirishnoma |
| 18.77 Adaptatsiya yakuni bot tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §18 #77 | adaptation.confirm zanjiri yo'q | Bildirishnoma |
| 18.81 Brak statistika haftalik digest | 2026-06-27 | TASDIQ-2146 §18 #81 | defect.weeklyStats yo'q | Bildirishnoma |
| 18.82 Ko'rilmagan xabar qayta-yuborish | 2026-06-27 | TASDIQ-2146 §18 #82 | resend.schedule (BullMQ retry) yo'q | Bildirishnoma |
| 18.79 'Kim-nima-oladi' matritsa (egasi-data) | 2026-06-27 | TASDIQ-2146 §18 #79 | notification_schedules count=0; egasi tasdig'i kutadi | Bildirishnoma |
