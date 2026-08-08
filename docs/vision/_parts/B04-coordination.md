## Coordination (Modul 04) — B-avlod (VIZYON-TASDIQ-2146, 2026-06-27)

### Step 2 — Qarorlar jadvali (B)
| # | Savol (Q/EP-ID) | Egasi javobi | Qaysi qismiga ta'sir | Amalga oshirilganmi (isbot) | Izoh |
|---|---|---|---|---|---|
| 04.1 | Kengash a'zolari org-strukturadan avtomat? (EP-COR-031) | Vysotskiy 7, karta orqali avto | Kengash a'zolik | Yo'q — councils(5 qator) bor, council_members jadval YO'Q; chairperson_id NULL | A'zolik mexanizmi qurilmagan |
| 04.2 | 4 rol (Rais/Kotib/A'zo/Mehmon) bormi? (EP-COR-032) | 4 rol, A'zo+Rais ovoz | Kengash a'zolik | Yo'q — councils ustunlarida rol/a'zolik ustuni yo'q | — |
| 04.3 | Kvorum foizi tekshiriladimi? (EP-COR-033) | 2/3 default, yetmasa maslahat | Ovoz/kvorum | Yo'q — grep quorum/kvorum apps/api/src=0 (faqat chat polls) | Owner OCHIQ |
| 04.4 | Ovoz berish + g'olib chegarasi? (EP-COR-034) | Oddiy ko'pchilik, teng→Rais | Ovoz/kvorum | Yo'q — grep vote/ovoz=faqat chat poll | Owner OCHIQ |
| 04.5 | Vakil (delegatsiya) ovoz bera oladimi? (EP-COR-035) | Yozma ishonchnoma bilan | Ovoz/delegatsiya | Yo'q — delegation/proxy kod yo'q | Owner OCHIQ |
| 04.6 | Manfaat to'qnashuvi chetlashtirish? (EP-COR-036) | Aloqador a'zo chetlashtiriladi | Ovoz/a'zolik | Yo'q — conflict_of_interest/council_session_members jadval yo'q | Owner OCHIQ |
| 04.7 | Majlis turlari farqlanadimi? (EP-COR-037) | 4 tur | Majlis | Yo'q — councils.council_type=domen turi, majlis turi emas; session jadval yo'q | Owner OCHIQ |
| 04.8 | Doimiy jadval avto cron? (EP-COR-038) | Avto jadval, Seshanba ЗВС cron | Majlis jadval | Qisman — councils.meeting_schedule bor (5/5 NULL); ЗВС cron yo'q; bot.helpers.ts faqat /zvs_status | Owner ✅ lekin ishlamaydi |
| 04.9 | Majlis chaqirig'i ogohlantirish muddati? (EP-COR-039) | 2 kun / favqulodda 3 soat | Majlis | Yo'q — meeting jadval yo'q | Owner OCHIQ |
| 04.10 | Kun tartibi (povestka) muddati/qulf? (EP-COR-040) | 1 ish kuni oldin qulf | Majlis | Yo'q — agenda jadval/ustun yo'q | Owner OCHIQ |
| 04.11 | Davomat 4 holat + 3x yo'q→HR? (EP-COR-041) | 4 holatli, turniket bilan | Majlis davomat | Yo'q — attendance jadval koordinatsiyada yo'q | Owner OCHIQ |
| 04.12 | Majlis davomiyligi cheklovi? (EP-COR-042) | Vaqt limiti, oshsa ko'chadi | Majlis | Yo'q — meeting entiteti yo'q | Owner OCHIQ |
| 04.13 | Доклад turlari belgilanadimi? (EP-COR-043) | 3 tur, otdeleniye majbur | Doklad | Qisman — dokla jadval jonli(2 qator) bor; TUR ustuni yo'q | Owner OCHIQ |
| 04.14 | Доклад javob muddati? (EP-COR-044) | Hujjat turiga qarab muddat | Doklad | Yo'q — dokla jadvalda deadline ustuni yo'q | Owner ✅ lekin qurilmagan |
| 04.15 | Доклад kechiksa eskalatsiya? (EP-COR-045) | Eslatma→eskalatsiya→KPI | Doklad eskalatsiya | Yo'q — grep @Cron director=0; muddat yo'q | Owner ✅ lekin qurilmagan |
| 04.16 | Доклад 6 majburiy maydon? (EP-COR-046) | 6 maydon | Doklad | Qisman — dokla 4 maydon (subject/problem/result/proposal); ilova/reja-fakt yo'q | Owner OCHIQ |
| 04.17 | Доклад raqamlari ERP'dan avto? (EP-COR-047) | Asosiy avto, izoh qo'lda 30/70 | Doklad/integratsiya | Yo'q — dokla faqat erkin matn; auto-pull yo'q | Owner ✅ lekin qurilmagan |
| 04.18 | Доклад holat oqimi (5)? (EP-COR-048) | 5 holat (sent/read/resolved/archived) | Doklad | Qisman — dokla.status sent/read/resolved wired (controller dokla/:id/read,resolved); Qoralama/Arxiv yo'q | Owner ✅, 3/5 |
| 04.19 | Распоряжение vs Приказ farqi? (EP-COR-049) | Alohida ikki tur | Rasp/Prikaz | Qisman — rasporyazhenie jadval(0 qator) bor; Приказ jadval/controller YO'Q | Faqat yarmi |
| 04.20 | Расп ustuvorlik 4 daraja + muddat? (EP-COR-050) | 4 daraja, har biriga muddat | Rasporyajeniye | Qisman — rasporyazhenie.priority+deadline bor; avto standart muddat logikasi yo'q | Owner ✅ |
| 04.21 | Расп 6 majburiy maydon? (EP-COR-051) | 6 maydon | Rasporyajeniye | Qisman — 5 maydon bor; 'Asos'(havola) ustuni yo'q | Owner OCHIQ |
| 04.22 | Bitta mas'ul + yordamchilar? (EP-COR-052) | Bitta + yordamchilar | Rasporyajeniye | Qisman — to'user yagona bor; soispolnitel maydon yo'q | Owner OCHIQ |
| 04.23 | Расп eskalatsiya 3 bosqich? (EP-COR-053) | 3 bosqich manager_id | Rasp eskalatsiya | Yo'q — @Cron/escalation yo'q; overdue faqat SELECT CASE (repo:111) | Owner ✅ lekin qurilmagan |
| 04.24 | Rad/muddat so'rash kanali? (EP-COR-054) | Rad/Uzaytirish so'rovi | Rasporyajeniye | Yo'q — rad/uzaytirish entiteti yo'q; faqat markRaspDone | Owner OCHIQ |
| 04.25 | Расп 8 holatli oqim? (EP-COR-055) | 8 holat | Rasporyajeniye | Qisman — status assigned/in_progress/done+overdue (~4 holat) | Owner OCHIQ |
| 04.26 | Приказ raqamlash formati? (EP-COR-056) | PR-YYYY-NNN avto | Prikaz | Yo'q — Приказ jadval/controller YO'Q (information_schema=0) | Owner ✅ lekin qurilmagan |
| 04.27 | Приказ kategoriya+prefiks? (EP-COR-057) | 4 kategoriya | Prikaz | Yo'q — Приказ entiteti yo'q | Owner OCHIQ |
| 04.28 | Raqam ketma-ketligi+teshik? (EP-COR-058) | Teshik qoldiriladi | Prikaz | Yo'q — raqamlash umuman yo'q | Owner OCHIQ |
| 04.29 | Приказ asos hujjati majburiy? (EP-COR-059) | Asos majburiy, to'liq zanjir | Prikaz/golden-thread | Yo'q — Приказ yo'q; dokla/rasp'da 'asos' ustuni yo'q | Owner ✅ lekin qurilmagan |
| 04.30 | Приказ effective+tugash sanasi? (EP-COR-060) | Kuchga kirish+tugash | Prikaz | Yo'q — Приказ jadval yo'q | Owner ✅ lekin qurilmagan |
| 04.31 | Imzolangan приказ immutable? (EP-COR-061) | Immutable, faqat yangi bilan | Prikaz | Yo'q — Приказ+document_hashes jadval yo'q | Owner ✅ lekin qurilmagan |
| 04.32 | Протокол kotib avto-shablon? (EP-COR-062) | Kotib avto-shablon, AI qoralash | Protokol | Yo'q — protocol jadval/controller YO'Q (grep=0) | Owner ✅ lekin qurilmagan |
| 04.33 | Протокол imzo zanjiri 2 imzo? (EP-COR-063) | 2 bosqich imzo | Protokol | Yo'q — protokol entiteti yo'q; rais/kotib roli yo'q | Owner ✅ lekin qurilmagan |
| 04.34 | Imzo turi + audit? (EP-COR-064) | Tizim tasdiqlash + audit-log | Protokol/imzo | Yo'q — protokol/imzo entiteti yo'q | Owner ✅ lekin qurilmagan |
| 04.35 | Imzo muddati 2 kun + eslatma? (EP-COR-065) | 2 kun, kechiksa eslatma | Protokol/imzo | Yo'q — imzo entiteti+cron yo'q | Owner ✅ lekin qurilmagan |
| 04.36 | Протокол versiyalash? (EP-COR-066) | Immutable + tuzatish protokoli | Protokol | Yo'q — cc_document_versions bor lekin cc_documents=0, ulanmagan | Owner ✅ lekin qurilmagan |
| 04.37 | E'tiroz (osoboye mneniye)? (EP-COR-067) | A'zo alohida fikr, ilova | Protokol | Yo'q — protokol/e'tiroz entiteti yo'q | Owner OCHIQ |
| 04.38 | Qaror→avto Распоряжение (action item)? (EP-COR-068) | Har qaror avto topshiriq | Golden-thread | Yo'q — qaror entiteti+auto-convert kod yo'q; rasp faqat qo'lda | Owner ✅ lekin qurilmagan |
| 04.39 | Bajarilish % ko'rsatkichi? (EP-COR-069) | Holat+foiz avto | Qaror izchilligi | Yo'q — qaror entiteti yo'q; rasp stats count bor lekin qaror-% emas | Owner OCHIQ |
| 04.40 | Bajarilmagan qaror avto ko'chadimi? (EP-COR-070) | Avto 'bajarilmagan' bo'lim | Majlis/qaror | Yo'q — kun tartibi entiteti+cron yo'q | Owner OCHIQ |
| 04.41 | Bajarish dalili majburiy? (EP-COR-071) | Dalil majburiy | Rasporyajeniye | Yo'q — done_note bor lekin fayl/dalil ilova ustuni yo'q | Owner OCHIQ |
| 04.42 | 2 bosqichda yopish? (EP-COR-072) | Ikki bosqichli yopish | Rasporyajeniye | Qisman — markRaspDone (service:96-100 auth) bor lekin bitta bosqichda done | Owner ✅ |
| 04.43 | Qaror bajarilish reytingi KPI'ga? (EP-COR-073) | Oylik reyting KPI'ga | KPI | Yo'q — reyting/KPI hisob koordinatsiyada yo'q | Owner OCHIQ |
| 04.44 | Arxivga to'liq paket? (EP-COR-074) | To'liq paket har majlis | Arxiv | Yo'q — majlis/protokol/ovoz/davomat entiteti yo'q | Owner ✅ lekin qurilmagan |
| 04.45 | Arxiv ko'p mezonli qidiruv? (EP-COR-075) | Ko'p mezonli + tsvector | Arxiv | Yo'q — dokla/rasp list filtrsiz; tsvector yo'q | Owner OCHIQ |
| 04.46 | Arxiv kirish huquqi (RBAC)? (EP-COR-076) | Ochiq/Maxfiy, RBAC kartadan | Arxiv/RBAC | Yo'q — maxfiylik ustuni yo'q; PRIVILEGED_ROLES bor lekin maxfiy-filtr yo'q | Owner ✅ lekin qurilmagan |
| 04.47 | Arxiv saqlash muddati+o'chirish taqiqi? (EP-COR-077) | O'chirilmaydi, min 5 yil | Arxiv | Yo'q — dokla/rasp HARD DELETE (repo db.delete); soft-delete yo'q | Owner ✅ lekin qurilmagan |
| 04.48 | Arxiv audit izi? (EP-COR-078) | Har amal audit-log | Arxiv/audit | Yo'q — koordinatsiya audit-log kod yo'q; document_hashes jadval yo'q | Owner ✅ lekin qurilmagan |
| 04.49 | Davr hisoboti PDF/Excel eksport? (EP-COR-079) | Bir tugma davr hisoboti | Arxiv/eksport | Yo'q — export endpoint yo'q | Owner OCHIQ |
| 04.50 | Eslatma kanali ERP+Telegram? (EP-COR-080) | ERP ichi + Telegram | Notif | Qisman — TelegramModule import (director.module:115), /zvs_status; dokla/rasp NTF yuborish yo'q | Owner ✅, event ulanmagan |
| 04.51 | Majlis qoldirish avto ko'chirish? (EP-COR-081) | Avto ko'chiriladi | Majlis | Yo'q — majlis entiteti yo'q | Owner OCHIQ |
| 04.52 | Favqulodda majlis (3 soat, 50%)? (EP-COR-082) | Favqulodda 3 soat, 50% | Majlis/kvorum | Yo'q — majlis/kvorum entiteti yo'q | Owner OCHIQ |
| 04.53 | Coord→boshqa modul avto signal? (EP-COR-083) | Qaror turi bo'yicha avto signal (oltin ip) | Golden-thread | Yo'q — @OnEvent/emit koordinatsiya uchun yo'q (grep=faqat import) | Owner ✅ lekin qurilmagan |
| 04.54 | A'zo lavozim almashsa avto o'tadimi? (EP-COR-084) | Karta-model, avto o'tadi | Kengash/karta | Yo'q — council_members/card_snapshot yo'q; chairperson_id NULL | Owner ✅ lekin qurilmagan |
| 04.55 | Majlis tili + ko'p tillilik? (EP-COR-085) | Har hujjatga til tanlash | i18n | Qisman — coordination.json uz/uz-cyr/ru (UI tili); har hujjatga til ustuni yo'q | Owner ✅ |
| 04.56 | Рек.Совет (ЗВС) sessiya to'liq? (EP-COR-015) | To'liq sessiya + hisobot | ЗВС | Qisman — zvs jadval+controller (zvs.controller:35-71, 0 qator); sessiya wrapper YO'Q | Owner ✅ |
| 04.57 | Рек.Совет qarori 3 xil? (EP-COR-016) | To'liq/qisman/rad | ЗВС | Qisman — approve/reject (controller:58,71) bor; 'qisman'(partial amount) yo'q, 2 xil | Owner ✅ |
| 04.58 | Рек.Совет eslatma Seshanba 08:45 cron? (EP-COR-017) | Seshanba 08:45 cron | ЗВС/cron | Yo'q — @Cron Seshanba director'da yo'q (grep=0); /zvs_status faqat so'rovga javob | Owner ✅ lekin qurilmagan |
| 04.59 | Рек.Совет sessiya hisoboti avto? (EP-COR-018) | Avto-hisobot | ЗВС | Yo'q — sessiya entiteti+generateSessionReport yo'q | Owner ✅ lekin qurilmagan |
| 04.60 | Koordinatsiya boshqaruv paneli? (EP-COR-026) | Yagona panel umumiy ko'rinish | Panel | Qisman — CoordinationPage Overview + GET /coordination/stats jonli; 'yaqin majlis'/'приказ soni' yo'q | Owner ✅ |
| 04.61 | Eskalatsiya org-tuzilma yuqoriga? (EP-COR-027) | Avto eskalatsiya manager_id | Eskalatsiya | Yo'q — @Cron yo'q; overdue faqat SELECT CASE (repo:111); HR'ga ko'tarish yo'q | Owner ✅ lekin qurilmagan |
| 04.62 | Org avto-yo'naltirish (vertikal)? (EP-COR-028) | Org-sxema avto, Vysotskiy 7 | Routing | Yo'q — dokla.council_level qo'lda; manager_id auto-rout yo'q (grep=0) | Owner ✅ lekin qurilmagan |
| 04.63 | Telegram koord buyruqlari? (EP-COR-029) | Telegram komandalar | Telegram | Qisman — /zvs_status (bot.helpers:151-164); topshiriqlarim/dokladlarim/bajardim yo'q | Owner ✅ |
| 04.64 | Kengash hisobotini AI tahlil? (EP-COR-030) | Karta AI koordinatsiya tahlil | Karta-AI | Yo'q — AI listener director'da yo'q | Owner ✅ lekin qurilmagan |
| 04.65 | Gorizontal workflow_rules? (EP-COR-089/v2-Q59) | workflow_rules, sektsiya darajasi | Routing | Qisman — workflow_rules struktura+CRUD (workflow-rules.controller) bor; 0 qator, resolve chaqiruvchi yo'q | Owner ✅, ulanmagan+bo'sh |
| 04.66 | Uch-karzina (3-tray) tizimi? (v2-Q76) | 3-karzina COR hujjatlari | Baskets | Qisman — Baskets tab + GET /coordination/baskets (cc_documents.basket_state repo:178-202); cc_documents=0 | Mexanizm bor, ma'lumotsiz |
| 04.67 | Buyurtma/Papka № yagona kalit? (EP-COR-097/v2-Q67) | Papka № yagona kalit | Golden-thread | Yo'q — dokla/rasp'da order_id/papka_no ustuni yo'q | Owner ✅ lekin qurilmagan |
| 04.68 | Har kuni 24h reja→3 bo'lim push? (EP-COR-086/Q56) | 24h reja avto→3 bo'lim push + log | MPS/push | Yo'q — mps_periods/erp_production_plans bor; cron faqat markAbsentEmployees (daily-report.cron.ts:20); 24h generator+push yo'q | Owner A-default |
| 04.69 | Bekor turish (downtime) hodisa+stat? (EP-COR-087/Q57) | Sabab+vaqt+mas'ul → avto stat | Downtime | Qisman — downtime_events+drizzle-downtime.repo (save/endDowntime) REAL, 2 qator; 'mas'ul bo'lim'+coord-event ulanish yo'q | Owner A-default |
| 04.70 | Logistika STOP techkarta↔material? (EP-COR-088/Q58) | STOP → chiqish bloklanadi | WMS gate | Qisman — outbound-enforcement.service:73 checkIssueAllowed BLOCK (EP-WMS-084:128); STOP override+dizayner xabar+coord-event yo'q | Owner A-default |
| 04.71 | Koord hujjat 7-dept→bo'lim→sektsiya? (EP-COR-089/Q59) | Sektsiya darajasigacha | Org routing | Qisman — workflow_rules source/approver dept+function bor; sektsiya-daraja+data yo'q (0 qator) | Owner javoblangan |
| 04.72 | Handoff nuqtalar vaqt bilan (uzluksizlik)? (EP-COR-090/Q60) | Handoff vaqt bilan, uzilish ko'rinadi | Handoff | Qisman — sd_order_timeline(order_id,status,note) bor; handoff-segment+uzilish o'lchovi yo'q; 0 qator | Owner A-default |
| 04.73 | Bitrix24 dizayn status-zanjiri? (EP-COR-091/Q61) | 4 status, Tasdiqda=buyurtmachi | Dizayn status | Qisman — DesignStatus enum REAL (design-status.enum.ts:6) state-machine; Bitrix 1:1 emas, podpisnoy gate yo'q; 0 qator | Owner A-default |
| 04.74 | Podpisnoy list bo'lmasa IChQ bloklanadimi? (EP-COR-092/Q62) | Podpisnoy yo'q→IChQ blok | Dizayn gate | Yo'q — approve()→APPROVED bor (aggregate:68); podpisnoy_lists jadval YO'Q; qattiq gate yo'q | Owner A-default |
| 04.75 | Qolip (СТП) holati IChQ rejasiga? (EP-COR-093/Q63) | Qolip holati→IChQ reja | Tooling | Qisman — design_tooling REAL (status,wear) + /tooling/:id/wear-forecast (design.controller:179,189); qolip↔buyurtma↔reja yo'q; 0 qator | Owner A-default |
| 04.76 | Rohler/poddon reestri holat+band? (EP-COR-094/Q64) | Ichki transport reestri | Transport | Yo'q — roller/pallet-transport reestr jadvali yo'q; ow_pallet_recoveries(boshqa maqsad, 0) | Owner A-default |
| 04.77 | Chiqindi to'ldi yopiq tsikl? (EP-COR-095/Q65) | Signal→topshiriq→tasdiq | Waste tsikl | Yo'q — waste_records(0) faqat yozuv; to'ldi-signal→logistika-topshiriq→tasdiq yo'q | Owner A-default |
| 04.78 | Algoritm-turi bo'lim-zanjiri avto handoff? (EP-COR-096/Q66) | Bo'lim-zanjiri→avto handoff | Routing | Qisman — mes_operations+document_routing_rules bor; 'algoritm 2-8 bo'lim' tasnif+per-order marshrut yo'q; 0 qator | Owner A-default |
| 04.79 | Papka № har koord hujjatga bog'lanadimi? (EP-COR-097/Q67) | Papka № yagona kalit | Golden-thread | Qisman — design_orders.papka_order_id FK, qc_braks.papka_order_id bor; cc_documents/coordination bog'lanmagan; mes_papka_orders=0 | Owner javoblangan |
| 04.80 | Priladka oralig'i smena rejasida? (EP-COR-098/Q68) | Priladka→logistika+navbat moslash | Smena reja | Yo'q — priladka/changeover-coordination modeli yo'q (grep=yo'q) | Owner A-default |
| 04.81 | Smena handover keyingi smenaga? (EP-COR-099/Q69) | Handover yozuvi o'tadi | Smena handover | Qisman — POST /mes/shifts/handover→mes_shift_handovers INSERT (repo:63); tugamagan-buyurtma/STOP maydonlari yo'q; 0 qator | Owner A-default |
| 04.82 | Muvaffaqiyat/xato blanki AI tahlil? (EP-COR-100/Q70) | Blank davriy→AI tahlil | Bilim-yig'ish | Yo'q — success/mistake-blank jadval yo'q; lessons(13) = LMS dars, blank emas | Owner A-default |
| 04.83 | Kunlik/haftalik/oylik hisobot ritm+eskalatsiya? (EP-COR-101/Q71) | Avto ritm + eskalatsiya | ЦКП/hisobot | Qisman — AiDailyReportService.runDailyQuestionPush (ai-daily-report.service:229)+ckp-daily-aggregate.cron; haftalik/oylik+eskalatsiya+fayl-yig'ish yo'q | Owner javoblangan |
| 04.84 | Lavozim KPI koord-hodisadan avto (30/70)? (EP-COR-102/Q72) | KPI koord-hodisadan avto | KPI | Qisman — ckp_fact_values(source=AI_CHAT)+ckp-cascade.listener tayyor; koord-hodisa(STOP/handoff) ulanmagan; ckp_fact_values=0 | Owner javoblangan |
| 04.85 | Buyurtma tayyorlik % real-vaqt? (EP-COR-103/Q73) | Tayyorlik % real-vaqt | Progress | Yo'q — 'tayyorlik %'(o'tilgan/jami bo'lim) hisob yo'q; sd_order_timeline faqat status | Owner A-default |
| 04.86 | Buyurtma menejerga bog'lanib xabar? (EP-COR-104/Q74) | Menejerga kechikish/STOP bildiriladi | Notif | Qisman — design_orders.manager_id+sales_order bog'lanish bor; STOP/handoff→menejer avto-bildirishnoma yo'q | Owner A-default |
| 04.87 | Turniket holati topshiriq berishda? (EP-COR-105/Q75) | Yo'q odamga bermaslik/qayta yo'naltirish | HR/koord | Yo'q — attendance_logs/hr_ai_attendance bor lekin topshiriq-berishga ulanmagan; 0 qator | Owner A-default |
| 04.88 | Har xodim 3 ustun (uch karzina)? (EP-COR-106/Q76) | 3-savat (Kanban) | Baskets | Qisman — GET /coordination/baskets listBaskets (repo:178)+kanban moduli; cc_documents=0 | Owner javoblangan |
| 04.89 | Harakatsiz topshiriq→rahbarga signal? (EP-COR-107/Q77) | Harakatsiz→rahbarga signal | Nazorat | Yo'q — overdue-marker bor; 'X soat harakatsiz→proaktiv signal' yo'q | Owner A-default |
| 04.90 | Xato/rework bo'lim RAHBARI KPI siga? (EP-COR-108/Q78) | Rework→rahbar KPI (kitob falsafasi) | KPI atributsiya | Yo'q — qc_braks/qc_defects bor lekin department/responsible_manager ustuni YO'Q | Owner javoblangan |
| 04.91 | Bo'lim yuklama + qayta biriktirish? (EP-COR-109/Q79) | Yuklama+qayta biriktirish | Yuklama | Yo'q — kanban assignee bor; xodim-yuklama o'lchov+bir-tugma qayta-taqsim yo'q | Owner A-default |
| 04.92 | Buyurtma ustuvorlik navbat tartibi? (EP-COR-110/Q80) | 1/2/keyingi→navbat tartib | Ustuvorlik | Qisman — design_orders.priority+listBaskets priority-CASE; sales_orders'da priority/queue yo'q | Owner A-default |
| 04.93 | Material yetishmadi→3 bo'lim xabar? (EP-COR-111/Q81) | 3 bo'lim bir vaqtda | Signal | Qisman — downtime reason MATERIAL (aggregate:27)+stock-alert.cron; 3-yo'nalishli broadcast coord-event yo'q | Owner A-default |
| 04.94 | Skaner gofra-turi techkartaga mos? (EP-COR-112/Q82) | Mos emas→ogohlantirish | WMS gate | **Bor** — outbound-enforcement.service:114 issuedLayer vs tech_card_bom.layer→BLOCK_GOFRA_LAYER_MISMATCH (EP-WMS-085:115) | Kitob 2-vazifa aniq qurilgan |
| 04.95 | Dizayn↔konstruktor handoff bosqichi? (EP-COR-113/Q83) | Alohida bosqich (begovka/vysechka) | Handoff | Yo'q — konstruktor-roli+dizayn↔konstruktor handoff yo'q (grep=yo'q) | Owner A-default |
| 04.96 | Buyurtma o'zgarishi→bo'lim bildirish+tasdiq? (EP-COR-114/Q84) | Bildirishnoma+tasdiq | Notif/tasdiq | Qisman — design_order_revisions+sd_order_timeline bor; avto-broadcast+acknowledge yo'q | Owner javoblangan |
| 04.97 | Yig'ilish ishtirok↔topshiriq yopiq tsikl? (EP-COR-115/Q85) | Ishtirok+topshiriq ulanadi | Yopiq tsikl | Qisman — Protokol→action-item→rasp zanjiri qism A da; ishtirok↔topshiriq bog'lanishi yo'q | Owner A-default |
| 04.98 | Energiya tejash karta KPI? (EP-COR-116/Q86) | Energiya→karta KPI | KPI | Yo'q — energiya(suv/gaz/svet) KPI/signal koord/karta-KPI ga ulanmagan (grep=yo'q) | Owner A-default |
| 04.99 | Nazorat varaqasi tugamasa karta gate? (EP-COR-117/Q87) | Tugamasa topshiriq ochilmaydi | Onboarding gate | Qisman — HR onboarding(onboarding-defaults.ts)+LMS lessons(13) bor; 'varaqa→koord-topshiriq gate' ulanmagan | Owner javoblangan |
| 04.100 | Bo'limlararo ma'lumot so'rovi hujjati? (EP-COR-118/Q88) | Muddat+javob holati | Internal req | Qisman — internal_requests(request_no,urgency,approved_by)+workflow_rules bor; faqat material/wms-count; 0 qator | Owner A-default |
| 04.101 | Workflow qoidalari admin paneldan avto? (EP-COR-119/Q89) | workflow_rules admin konfig | Routing | Qisman — workflow_rules+WorkflowRulesService CRUD+resolve (service:26)+controller REAL; 0 qator, isbotsiz | Owner javoblangan |
| 04.102 | Har karta ЦКП chiqishi (son+vaqt)? (EP-COR-120/Q90) | ЦКП chiqishi o'lchanadi | ЦКП | Qisman — ckp_card_products+ckp_fact_values+ckp-daily-aggregate.cron+ckp-cascade.listener REAL; 0 qator (norma+fakt to'ldirilmagan) | Owner javoblangan |
| 04.103 | Buyurtma plan-fakt og'ish signal? (EP-COR-121/Q91) | Real-vaqt→chegara→signal | Erta ogohlantirish | Yo'q — MES updateSessionQuantity bor; buyurtma plan-muddat vs fakt→signal yo'q | Owner A-default |
| 04.104 | Brak→mas'ul rahbar KPI? (EP-COR-122/Q92) | Brak→rahbar KPI | KPI atributsiya | Qisman — qc_braks(papka,stage,reason,cost)+qc_defects REAL; 'bo'lim+mas'ul rahbar' atributsiya yo'q; 0 qator | Owner A-default (Q78 bo'shliq) |
| 04.105 | Norma-bajarilish % past→signal? (EP-COR-123/Q93) | Past→rahbar signal | Norma | Yo'q — HR norma bor; real-vaqt uchastka-koord past→signal yo'q (oy-oxiri Excel) | Owner A-default |
| 04.106 | Operator+yordamchi juftlik signal? (EP-COR-124/Q94) | Juftlik→ikkisi signal | MES/signal | Yo'q — MES sessiya operator_id bitta; juftlik+ikkisiga signal yo'q | Owner A-default |
| 04.107 | Razmer optimizatsiya koord qarori? (EP-COR-125/Q95) | Dizayn→savdo→rahbar tasdiq | Koord qaror | Yo'q — approval_workflows umumiy bor; razmer-optimizatsiya maxsus qaror-turi yo'q | Owner A-default |
| 04.108 | Yo'nalish turi→bo'lim-marshrut avto? (EP-COR-126/Q96) | Yo'nalish turi→marshrut avto | Routing | Yo'q — mes_operations/routing bor; ofs-kar/ofs-gof/flx-gof→zanjir avto-marshrut yo'q | Owner A-default |
| 04.109 | Boshlanmagan buyurtma avto-signal? (EP-COR-127/Q97) | N kun boshlanmadi→signal | Kechikkan-start | Yo'q — created-vs-started og'ish kuzatuv cron yo'q | Owner A-default |
| 04.110 | Shoshilinch bayroq barcha panelda? (EP-COR-128/Q98) | Ajralib+navbat tepasida | Ustuvorlik | Qisman — priority=urgent baskets CASE 0 (listBaskets)+design_orders.priority; global vizual flag to'liq emas; cc_documents=0 | Owner A-default |
| 04.111 | Ichki xizmat so'rovi (kesish/rulon)? (EP-COR-129/Q99) | So'rovchi→bajaruvchi, muddat+tasdiq | Internal req | Qisman — internal_requests struktura mos; 'kesish/rulon' turi ulanmagan; faqat wms-count; 0 qator | Owner A-default |
| 04.112 | Smena tayyorlik cheklisti→bekor turish? (EP-COR-130/Q100) | Tasdiqlanmasa bekor turish hisoblanmaydi | Smena gate | Yo'q — smena-boshi tayyorlik-cheklisti(material/qolip/dastgoh/xodim)+bekor-turish ta'siri yo'q (kanban_checklists boshqa maqsad) | Owner A-default |
| 04.113 | Koord hujjat ko'rish-ruxsati RBAC? (EP-COR-131/Q101) | RBAC bo'lim/daraja/karta, maydon | RBAC | Qisman — RolesGuard+@Roles (coordination.controller:33)+maxfiy EP-COR-076; karta/maydon-darajali+shifrlash yo'q | Owner javoblangan |
| 04.114 | Direktor tasdiq darvozasi (elektron imzo)? (EP-COR-132/Q102) | Direktor gate (Pozilov A.A.) | Direktor gate | Qisman — director approvals(approve/reject cmd+handler)+zvs/zno+HITL+approval_workflows REAL; qaysi-tur avto-marshrut konfig-datasiz | Owner javoblangan |
| 04.115 | ТТ majburiy maydon→dizayn gate? (EP-COR-133/Q103) | ТТ to'ldirilmasa dizayn gate | Dizayn gate | Qisman — design_orders(product_type/requirements/quantity)+request-design Zod bor; to'liq ТТ to'plam+qattiq gate isbotsiz | Owner A-default |
| 04.116 | Rahbar javob SLA (2h)→avto eskalatsiya? (EP-COR-134/Q104) | SLA→avto yuqoriga | SLA | Qisman — cc-sla.cron+rasp markOverdue+eskalatsiya mexanizm; per-document-type SLA-muddat konfig-datasiz; cc_documents=0 | Owner javoblangan |
| 04.117 | Koord hodisalar→karta-AI dinamik mos? (EP-COR-135/Q105) | Karta-AI→xodim↔karta dinamik (vizyon yadrosi) | Karta-AI | Qisman — ai_ckp_scores/config+AiDailyReportService+ckp-cascade.listener infra bor; koord-hodisa(STOP/brak/SLA)→AI real-signal ulanmagan; ai_ckp_scores=0 | Owner javoblangan |

### Step 3 — ❌/🔑 ochiq
| Savol/Muammo | Manba (NN.M) | Nega ochiq | Modul |
|---|---|---|---|
| Kengash a'zolik (council_members) jadval yo'q | 04.1 | A'zolik mexanizmi qurilmagan; chairperson_id NULL | Coordination |
| 4 rol (Rais/Kotib/A'zo/Mehmon) yo'q | 04.2 | Rol/a'zolik ustuni yo'q | Coordination |
| Kvorum tekshiruvi yo'q | 04.3 | grep quorum=0 | Coordination |
| Ovoz berish mexanizmi yo'q | 04.4 | grep vote=faqat chat poll | Coordination |
| Delegatsiya/proxy ovoz yo'q | 04.5 | A'zolik/ovoz yo'q | Coordination |
| Manfaat to'qnashuvi chetlashtirish yo'q | 04.6 | conflict_of_interest jadval yo'q | Coordination |
| Majlis turlari farqlanmaydi | 04.7 | session jadval yo'q | Coordination |
| Majlis chaqiriq ogohlantirish muddati yo'q | 04.9 | meeting jadval yo'q | Coordination |
| Kun tartibi (povestka) muddati/qulf yo'q | 04.10 | agenda jadval yo'q | Coordination |
| Majlis davomat (4 holat) yo'q | 04.11 | attendance jadval yo'q | Coordination |
| Majlis davomiylik cheklovi yo'q | 04.12 | meeting entiteti yo'q | Coordination |
| Доклад javob muddati (deadline) yo'q | 04.14 | dokla'da deadline ustuni yo'q | Coordination |
| Доклад eskalatsiya yo'q | 04.15 | @Cron director=0 | Coordination |
| Доклад ERP-raqam auto-pull yo'q | 04.17 | dokla faqat erkin matn | Coordination |
| Расп eskalatsiya 3 bosqich yo'q | 04.23 | @Cron/escalation yo'q; overdue faqat CASE (repo:111) | Coordination |
| Расп rad/muddat so'rash kanali yo'q | 04.24 | faqat markRaspDone | Coordination |
| Приказ raqamlash (PR-YYYY-NNN) yo'q | 04.26 | Приказ jadval/controller YO'Q | Coordination |
| Приказ kategoriya+prefiks yo'q | 04.27 | Приказ entiteti yo'q | Coordination |
| Приказ raqam ketma-ketligi/teshik yo'q | 04.28 | raqamlash yo'q | Coordination |
| Приказ asos hujjati (golden-thread) yo'q | 04.29 | 'asos' ustuni yo'q | Coordination |
| Приказ effective/tugash sanasi yo'q | 04.30 | Приказ jadval yo'q | Coordination |
| Приказ immutable/qulf yo'q | 04.31 | document_hashes yo'q | Coordination |
| Протокол avto-shablon yo'q | 04.32 | protocol jadval/controller YO'Q | Coordination |
| Протокол imzo zanjiri yo'q | 04.33 | protokol entiteti yo'q | Coordination |
| Imzo turi+audit yo'q | 04.34 | imzo entiteti yo'q | Coordination |
| Imzo muddati+eslatma yo'q | 04.35 | imzo cron yo'q | Coordination |
| Протокол versiyalash yo'q | 04.36 | cc_documents=0, ulanmagan | Coordination |
| E'tiroz (osoboye mneniye) yo'q | 04.37 | protokol entiteti yo'q | Coordination |
| Qaror→avto Расп (action item) yo'q | 04.38 | auto-convert kod yo'q | Coordination |
| Bajarilish % ko'rsatkichi yo'q | 04.39 | qaror entiteti yo'q | Coordination |
| Bajarilmagan qaror avto ko'chirish yo'q | 04.40 | kun tartibi entiteti yo'q | Coordination |
| Bajarish dalili (fayl) majburiy emas | 04.41 | ilova ustuni yo'q | Coordination |
| Qaror reyting KPI yo'q | 04.43 | reyting hisob yo'q | Coordination |
| Arxiv to'liq paket yo'q | 04.44 | majlis/protokol entiteti yo'q | Coordination |
| Arxiv ko'p mezonli qidiruv yo'q | 04.45 | tsvector yo'q | Coordination |
| Arxiv RBAC (Ochiq/Maxfiy) yo'q | 04.46 | maxfiylik ustuni yo'q | Coordination |
| Arxiv saqlash muddati/o'chirish taqiqi yo'q | 04.47 | HARD DELETE (repo db.delete) | Coordination |
| Arxiv audit izi yo'q | 04.48 | audit-log kod yo'q | Coordination |
| Davr hisoboti PDF/Excel eksport yo'q | 04.49 | export endpoint yo'q | Coordination |
| Majlis qoldirish avto ko'chirish yo'q | 04.51 | majlis entiteti yo'q | Coordination |
| Favqulodda majlis (3h/50%) yo'q | 04.52 | majlis/kvorum entiteti yo'q | Coordination |
| Coord→modul avto signal (oltin ip) yo'q | 04.53 | @OnEvent/emit yo'q | Coordination |
| A'zo lavozim almashsa avto-o'tish yo'q | 04.54 | council_members yo'q | Coordination |
| Рек.Совет Seshanba 08:45 cron yo'q | 04.58 | @Cron director=0 | Coordination |
| Рек.Совет sessiya hisoboti yo'q | 04.59 | sessiya entiteti yo'q | Coordination |
| Eskalatsiya org yuqoriga→HR yo'q | 04.61 | @Cron yo'q; HR ko'tarish yo'q | Coordination |
| Org avto-yo'naltirish (vertikal) yo'q | 04.62 | manager_id auto-rout yo'q | Coordination |
| Kengash AI tahlil yo'q | 04.64 | AI listener yo'q | Coordination |
| Papka № koord hujjatga bog'lanmagan | 04.67 | order_id/papka_no ustuni yo'q | Coordination |
| 24h reja→3 bo'lim push yo'q | 04.68 | 24h generator+push yo'q (daily-report.cron.ts:20 faqat absent) | Coordination/MPS |
| Podpisnoy list→IChQ gate yo'q | 04.74 | podpisnoy_lists jadval YO'Q | Coordination/Design |
| Rohler/poddon reestri yo'q | 04.76 | transport-reestr jadval yo'q | Coordination/WMS |
| Chiqindi to'ldi yopiq tsikl yo'q | 04.77 | to'ldi-signal→topshiriq→tasdiq yo'q | Coordination/WMS |
| Priladka smena rejasida yo'q | 04.80 | changeover-coordination yo'q | Coordination/MES |
| Muvaffaqiyat/xato blank AI yo'q | 04.82 | success/mistake-blank jadval yo'q | Coordination/AI |
| Buyurtma tayyorlik % real-vaqt yo'q | 04.85 | %-progress hisob yo'q | Coordination |
| Turniket holati topshiriqqa ulanmagan | 04.87 | attendance→topshiriq yo'q | Coordination/HR |
| Harakatsiz topshiriq→signal yo'q | 04.89 | inactivity signal yo'q | Coordination |
| Xato/rework→rahbar KPI atributsiya yo'q | 04.90 | qc_braks'da department/manager ustuni yo'q | Coordination/QC |
| Bo'lim yuklama+qayta biriktirish yo'q | 04.91 | yuklama o'lchov yo'q | Coordination |
| Energiya tejash karta KPI yo'q | 04.98 | grep energy KPI=yo'q | Coordination |
| Plan-fakt og'ish erta signal yo'q | 04.103 | buyurtma plan vs fakt signal yo'q | Coordination/MES |
| Norma-bajarilish % past→signal yo'q | 04.105 | real-vaqt uchastka signal yo'q | Coordination/HR |
| Operator+yordamchi juftlik signal yo'q | 04.106 | juftlik biriktirish yo'q | Coordination/MES |
| Razmer optimizatsiya koord qaror yo'q | 04.107 | maxsus qaror-turi yo'q | Coordination |
| Yo'nalish turi→bo'lim-marshrut avto yo'q | 04.108 | ofs/flx→zanjir avto yo'q | Coordination/MES |
| Boshlanmagan buyurtma avto-signal yo'q | 04.109 | created-vs-started cron yo'q | Coordination |
| Smena tayyorlik cheklisti→bekor turish gate yo'q | 04.112 | readiness-gate modeli yo'q | Coordination/MES |
