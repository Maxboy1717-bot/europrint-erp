## [B/TASDIQ] MES / Ishlab chiqarish (08) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 08.1 | Sessiya 3 bosqich (SETUP/MAIN/TEARDOWN) | 2026-06-27 | TASDIQ-2146 §08 #1 | OEE Availability to'g'ri bo'lishi | Sessiya aggregate | 3 bosqichli GsdStage | Ha | production-session.aggregate.ts:85-91 GsdStage + setup/main/teardown_seconds |
| 08.2 | Bosqichlar operator tugmasi bilan qo'lda | 2026-06-27 | TASDIQ-2146 §08 #2 | IoT sensor yo'q | IoT-tablet FE | Qo'lda bosqich boshqaruv | Ha | IoTProductionDashboard.tsx qo'lda; sensor avto keyin |
| 08.3 | 3 smena 12h, A/B/C, sozlanadigan | 2026-06-27 | TASDIQ-2146 §08 #3 | Smena modeli mos | shift_types / mes.dto.ts | 12h + A/B/C harf-nom | Qisman | shift_types MORNING/EVENING/NIGHT 9h, A/B/C yo'q (mes.dto.ts:19) |
| 08.4 | Brigada tushunchasi (a'zolar+brigadir+smena) | 2026-06-27 | TASDIQ-2146 §08 #4 | Jamoa nazorati | machine_crews | brigadir/smena-biriktirish ustuni | Qisman | machine_crews role-fixed, brigadir yo'q, 2 test qator |
| 08.5 | Brigada tarkibini kim belgilaydi | 2026-06-27 | TASDIQ-2146 §08 #5 | Brigadir+HR mas'uliyat | machine_crews / shift_assignments | brigadir-tasdiq + doimiy A/B/C | Yo'q | tasdiq/doimiy-biriktirish mexanizmi yo'q |
| 08.6 | Material avto-norma yechish (tasdiq bilan) | 2026-06-27 | TASDIQ-2146 §08 #6 | Avto-hisob+GL | mes_material_consumption | avto-norma-yechim + GL | Qisman | 1 qator; avto-norma+GL tasdiqlanmadi (norma jadval yo'q) |
| 08.7 | Norma manbai texkarta/BOM yagona | 2026-06-27 | TASDIQ-2146 §08 #7 | Dublikat taqiq | technology_cards / material_norms | MES per-station norma o'qish | Qisman | MES per-station ishlab-chiqarish norma ulanishi yo'q |
| 08.8 | Norma chetlashuvini kuzatish (farq%) | 2026-06-27 | TASDIQ-2146 §08 #8 | Ogohlantirish | ishlab-chiqarish norma | per-station norma jadvali | Yo'q | norma jadvali yo'q → farq% hisoblab bo'lmaydi |
| 08.9 | SOS bosqichli eskalatsiya | 2026-06-27 | TASDIQ-2146 §08 #9 | Vertikal marshrut | sos_alerts / mes_sos_events | bosqichli avto-ko'tarish | Qisman | SOS tugma bor, 15/30 daq avto-eskalatsiya tasdiqlanmadi |
| 08.10 | SOS sabab toifalari master-data | 2026-06-27 | TASDIQ-2146 §08 #10 | Standart toifa | mes_downtime_reasons | 5-6 toifa + izoh | Qisman | 7 generik kod; reja-xato/kadr toifasi yo'q |
| 08.11 | Downtime sabab kodlari boyitish | 2026-06-27 | TASDIQ-2146 §08 #11 | Karton/qadoq xos kodlar | mes_downtime_reasons / downtime_reason_codes | 15-25 maxsus kod | Qisman | 7 generik; downtime_reason_codes BO'SH; maxsus kod yo'q |
| 08.12 | Rejali vs rejasiz to'xtash ajratish | 2026-06-27 | TASDIQ-2146 §08 #12 | OEE turi avto | mes_downtime_reasons.is_planned | is_planned biriktirish | Ha | is_planned + category; downtime_events.is_planned bor |
| 08.13 | Downtime operator darhol kiritadi | 2026-06-27 | TASDIQ-2146 §08 #13 | Jonli qayd | downtime_events | operator darhol qayd | Ha | /api/iot/downtime-events; reported_by/started_at/reason_code |
| 08.14 | OEE mashina+smena+brigada+sex darajasida | 2026-06-27 | TASDIQ-2146 §08 #14 | Har birlik GSD | get-oee.handler.ts | rollup barcha daraja | Qisman | mashina darajasi real; smena/brigada/sex rollup yo'q |
| 08.15 | OEE target + ogohlantirish chegarasi | 2026-06-27 | TASDIQ-2146 §08 #15 | Mashina/sexga alohida | OEE target sozlash | per-mashina target/threshold | Yo'q | target jadval yo'q; MESExtended.tsx:146 worldClass=85 hardcoded |
| 08.16 | Jonli monitoring ekrani (rangli tablo) | 2026-06-27 | TASDIQ-2146 §08 #16 | Sex holati ko'rinishi | MESExtended.tsx / mes.gateway.ts | rangli jonli sex-tablo | Qisman | OEE jadval bor; rangli kim-qaysi-mashinada tablo emas |
| 08.17 | Jonli yangilanish 1-5 daq | 2026-06-27 | TASDIQ-2146 §08 #17 | IoTsiz yetarli | mes.gateway.ts WS | 1-5 daq interval + SOS push | Qisman | WS OEE push bor; aniq interval+SOS ajratish tasdiqlanmadi |
| 08.18 | To'xtagan mashina avto-ogohlantirish (15/30 daq) | 2026-06-27 | TASDIQ-2146 §08 #18 | Bosqichli eskalatsiya | MES cron | vaqt-asosli avto-signal | Yo'q | production-agent cron faqat kechikkan buyurtma, mashina-to'xtash emas |
| 08.19 | Operator kartasiga ulash (natija→karta→GSD) | 2026-06-27 | TASDIQ-2146 §08 #19 | Oylik/reyting/o'sish | production_sessions.operator_card_id | to'liq natija→karta→oylik | Qisman | operator_card_id + MES_TO_HR_360 event; operator_daily_stats=0, zanjir ishlamaydi |
| 08.20 | Operator GSD (ЦКП) vaznli ball | 2026-06-27 | TASDIQ-2146 §08 #20 | Asosiy=sof mahsulot | production_sessions | vaznli GSD formula | Qisman | actual/defect bor; vaznli formula tasdiqlanmadi |
| 08.21 | Razryad va natija bog'lanishi | 2026-06-27 | TASDIQ-2146 §08 #21 | Norma+baho+o'sish | razryad_levels | MES→razryad-o'sish | Qisman | razryad_levels bor; bog'lanish tasdiqlanmadi (egasi-data kutadi) |
| 08.22 | Brak sababini toifalash (mas'ul bosqich) | 2026-06-27 | TASDIQ-2146 §08 #22 | OTK rasmiy qayd | inline_qc_checks | brak-sabab master + mas'ul bosqich | Qisman | brak qayd bor; toifa master-data+mas'ul-bosqich tasdiqlanmadi |
| 08.23 | Smenadan smenaga handover (tasdiq) | 2026-06-27 | TASDIQ-2146 §08 #23 | Rasmiy topshirish | shift_handovers | ikki-taraf qabul-tasdiq | Qisman | shift_handovers + raqamli imzo bor; qabul-tasdiq ustuni to'liq emas, 0 qator |
| 08.24 | Work order PP'dan avto (operator tanlaydi) | 2026-06-27 | TASDIQ-2146 §08 #24 | Reja-fakt bog'liq | production_sessions.production_order_id | PP→MES avto reja | Qisman | FK+tanlash bor; mes_papka_orders 0 qator, avto-tushish tasdiqlanmadi |
| 08.25 | Reja vs fakt (farq%+sabab) | 2026-06-27 | TASDIQ-2146 §08 #25 | Kam bo'lsa sabab | production_sessions | farq% + majburiy sabab | Qisman | target vs actual bor; farq%+majburiy sabab yo'q |
| 08.26 | Smenani baholash (vaznli ball) | 2026-06-27 | TASDIQ-2146 §08 #26 | Sozlanadigan vazn | mes_shift_evaluations | vaznli ball formula | Qisman | jadvallar bor (0 qator); formula+sozlanadigan vazn tasdiqlanmadi |
| 08.27 | Bonus/reytingga ulanish (ball→A/B/C→bonus) | 2026-06-27 | TASDIQ-2146 §08 #27 | Payroll avto | MES→payroll | ball→bonus avto-zanjir | Yo'q | zanjir yo'q; smena-baholash 0 qator |
| 08.28 | AI ishlab chiqarish nazoratchisi | 2026-06-27 | TASDIQ-2146 §08 #28 | Jonli+hisobot+anomaliya | mes-monitor.service.ts | LLM kunlik narrativ hisobot | Qisman | anomaliya z-score+HITL REAL (212-213); LLM narrativ hisobot emas |
| 08.29 | Materiallar partiyasini kuzatish (traceability) | 2026-06-27 | TASDIQ-2146 §08 #29 | FIFO/FEFO | mes_material_consumption.batch_number | to'liq lot traceability | Qisman | batch_number bor (1 qator); FIFO/FEFO+rulon tasdiqlanmadi |
| 08.30 | Texkarta amal qilinishi (checklist) | 2026-06-27 | TASDIQ-2146 §08 #30 | Chetlashuv qaydi | setup_checklists | per-bosqich belgilash+chetlashuv | Qisman | passChecklist() gate bor; adherence+chetlashuv qayd tasdiqlanmadi |
| 08.31 | 'А смена План' formasini ekranga ko'chirish | 2026-06-27 | TASDIQ-2146 §08 #31 | Zavod 5-yil Excel | MESExtended.tsx | smena reja-forma sahifasi | Yo'q | FE = OEE dashboard; reja-forma sahifasi yo'q |
| 08.32 | Reja vaqt vs fakt vaqt 4 maydon | 2026-06-27 | TASDIQ-2146 §08 #32 | Kechikish o'lchov | production_sessions | reja-boshlash/tugatish alohida | Qisman | fakt started/ended bor; reja-vaqtlar alohida 4 maydon to'liq emas |
| 08.33 | Operator+Yordamchi juftligi (1 op+N yordamchi) | 2026-06-27 | TASDIQ-2146 §08 #33 | Hissa to'g'ri yozilishi | machine_crews | 1 op+N nomli yordamchi+hissa% | Yo'q | fixed 4 rol; N nomli yordamchi+hissa% ustuni yo'q |
| 08.34 | Norma soatlik + 12-soatlik ikki bazada | 2026-06-27 | TASDIQ-2146 §08 #34 | Asosiy=soatlik | ishlab-chiqarish norma | soatlik+12h baza ustunlar | Yo'q | per-station norma jadvali yo'q |
| 08.35 | Norma o'lchov birligi stansiyaga qarab | 2026-06-27 | TASDIQ-2146 §08 #35 | м2/лист/штук/удар | equipment / norma | stansiya×birlik master-data | Yo'q | stansiya×birlik jadvali yo'q; equipment'da birlik ustuni yo'q |
| 08.36 | 'ish yo'q'ni downtime'dan alohida hisoblash | 2026-06-27 | TASDIQ-2146 §08 #36 | Operator aybsiz | mes_downtime_reasons | alohida ish-yo'q tur | Yo'q | 7 kod ichida ish-yo'q toifa yo'q; downtime_reason_codes BO'SH |
| 08.37 | Ish-yo'q paytida boshqa ishga o'tkazish qayd | 2026-06-27 | TASDIQ-2146 §08 #37 | Haqiqiy unum | qayta-biriktirish | qaytarilgan ish qayd | Yo'q | mexanizm yo'q; ish-yo'q turi o'zi yo'q (08.36) |
| 08.38 | Ofset/Flekso alohida normalash (НО 12-1/12-2) | 2026-06-27 | TASDIQ-2146 §08 #38 | O'z norma+НО-mas'ul | bo'lim ajratish | bo'lim+НО-mas'ul jadval | Yo'q | Ofset/Flekso ajratish+НО-mas'ul jadvali yo'q |
| 08.39 | Aniq ~30 mashina master-data | 2026-06-27 | TASDIQ-2146 §08 #39 | Kitob to'liq ro'yxati | equipment / work_centers | ~30 aniq mashina | Yo'q | equipment 7 generik demo; aniq ~30 mashina yo'q |
| 08.40 | Tigel 1-10 alohida birlik | 2026-06-27 | TASDIQ-2146 §08 #40 | Turi (oddiy/тиснение) | equipment | tigel 1-10 alohida birlik | Yo'q | equipment'da Тигель 1-10 yo'q |
| 08.41 | Stansiyaga 'keyingi ish' (очередь) ko'rsatish | 2026-06-27 | TASDIQ-2146 §08 #41 | Uzluksizlik | machine_tasks | joriy+navbat 2-3 ko'rsatish | Qisman | machine_tasks bor (0 qator); FE navbat ko'rsatish tasdiqlanmadi |
| 08.42 | Bir mashina ikki bo'limda ajratish | 2026-06-27 | TASDIQ-2146 §08 #42 | Флексо vs Упаковка | mashina×bo'lim | mashina×bo'lim birlik | Yo'q | mashina×bo'lim birikma jadvali yo'q; master-data generik |
| 08.43 | 'Kim hozir qaysi mashinada' jonli jadval | 2026-06-27 | TASDIQ-2146 §08 #43 | Usta ko'chirishni biladi | operator→mashina | jonli bandlik jadvali | Yo'q | machine_status_logs mashina holati (9 qator), operator-bandlik emas |
| 08.44 | Bir operator bir necha mashina (foiz/vaqt) | 2026-06-27 | TASDIQ-2146 §08 #44 | Холматов ikki norma | machine_crews | operator→ko'p-mashina ulush | Yo'q | 1 sessiya=1 mashina; ko'p-mashina foiz/vaqt modeli yo'q |
| 08.45 | Yakuniy qadoqlash alohida bosqich/norma | 2026-06-27 | TASDIQ-2146 §08 #45 | 1 ishchi/12 soat | per-bosqich norma | qadoqlash bosqich+norma | Yo'q | qadoqlash bosqich/norma jadvali yo'q; per-bosqich norma yo'q |
| 08.46 | 'переделка' alohida yo'qotish (sabab+soat) | 2026-06-27 | TASDIQ-2146 §08 #46 | Qolib/sozlash/material | mes_downtime_reasons | qayta-ishlash tur | Yo'q | 7 kodda переделка turi yo'q |
| 08.47 | Qolib tayyor emasligi downtime sababi (KB) | 2026-06-27 | TASDIQ-2146 §08 #47 | KB/konstruktor signal | mes_downtime_reasons | qolib sabab kodi+KB ulanish | Yo'q | qolib kechikishi kodi yo'q; KB signal yo'q |
| 08.48 | Murakkab sozlash (настройка) alohida vaqt | 2026-06-27 | TASDIQ-2146 §08 #48 | OEE Availability | production-session.aggregate.ts | SETUP alohida vaqt | Ha | SETUP bosqichi setup_seconds MAIN'dan ajratadi |
| 08.49 | Norma sof ish vaqtiga (tanaffus chegirib) | 2026-06-27 | TASDIQ-2146 §08 #49 | 10:00/12:00/namoz | sof-ish-vaqt hisob | avto-chegirish mexanizmi | Yo'q | avto-chegirish mexanizmi yo'q; norma jadvali yo'q |
| 08.50 | 3-smenali tushlik navbat (1/2/3-to'lqin) | 2026-06-27 | TASDIQ-2146 §08 #50 | Mashina to'xtamaydi | tushlik navbat | to'lqinli navbat boshqaruv | Yo'q | tushlik navbat boshqaruvi yo'q |
| 08.51 | Namoz tanaffusini sof-ish-vaqtdan ajratish | 2026-06-27 | TASDIQ-2146 §08 #51 | Bittadan navbat | namoz chegirish | namoz-vaqt chegirish/navbat | Yo'q | mexanizm yo'q (08.49 bilan birga) |
| 08.52 | Mustaqil ruxsat = MES operatorlik huquqi | 2026-06-27 | TASDIQ-2146 §08 #52 | Faqat ruxsatli sessiya | start-session.handler.ts:40-60 | mashina-turi matritsa | Qisman | LMS sertifikat HARD-BLOCK real; kurs-asosli, mashina-turi matritsa emas (08.54) |
| 08.53 | Ustoz-shogird bog'lanishi (ustoz nazorati) | 2026-06-27 | TASDIQ-2146 §08 #53 | Natija ikkalasiga | machine_crews.shogird_id | 'ustoz nazoratida' bayroq+brak-ajratish | Qisman | shogird_id bor; bayroq+brak-ajratish tasdiqlanmadi |
| 08.54 | Operator×mashina malaka matritsasi | 2026-06-27 | TASDIQ-2146 §08 #54 | To'g'ri biriktirish | operator_certifications | mashina×operator matritsa | Yo'q | kurs-asosli; mashina-turi×operator matritsa yo'q (0 qator) |
| 08.55 | РД-4/Direktor tasdiq zanjiri normaga (versiya) | 2026-06-27 | TASDIQ-2146 §08 #55 | Kelishuv+tasdiq | material_norms | ikki-bosqichli approval+versiya | Yo'q | norma jadvali yo'q; approval ustuni yo'q |
| 08.56 | Norma versiyasi va sanasi saqlash | 2026-06-27 | TASDIQ-2146 §08 #56 | O'tgan smena o'z normasi | material_norms | effective-date/version | Yo'q | versiyalash jadvali yo'q; effective-date/version yo'q |
| 08.57 | Mahsulot kodlash formati (KT4438/папка) | 2026-06-27 | TASDIQ-2146 §08 #57 | Usta qidiradi | sales_orders/pp | KT-kod/папка alohida maydon+qidiruv | Qisman | SD/PP papka kodlari bor; MES sessiyada to'liq struktura+qidiruv tasdiqlanmadi |
| 08.58 | 'Укишга'/'Академияга' o'quv ishlarini ajratish | 2026-06-27 | TASDIQ-2146 §08 #58 | Tannarxga qo'shilmaydi | production_sessions | o'quv-tur bayroq | Yo'q | sessiyada o'quv/Akademiya bayrog'i yo'q |
| 08.59 | Gofra (2/5 qatlam) м2+qatlam alohida | 2026-06-27 | TASDIQ-2146 §08 #59 | To'g'ri o'lchov+material | gofra hisob | м2+qatlam ustunlari | Yo'q | м2+qatlam ustunlari yo'q; Гф линия master-data'da yo'q |
| 08.60 | 'umumiy/Брак/Соф' uchligi + avto-tekshirish | 2026-06-27 | TASDIQ-2146 §08 #60 | sof=umumiy−brak | production_sessions | sof ustun+constraint | Qisman | actual+defect bor, sof hisoblanadi; avto-tekshirish constraint tasdiqlanmadi |
| 08.61 | Smenani A/B/C harf-nomi bilan saqlash | 2026-06-27 | TASDIQ-2146 §08 #61 | morning/afternoon o'rniga | shift_types / mes.dto.ts:19 | A/B/C harf-nom | Yo'q | MORNING/EVENING/NIGHT; A/B/C YO'Q |
| 08.62 | Brigada doimiy A/B/C smenaga biriktirish | 2026-06-27 | TASDIQ-2146 §08 #62 | Kunlik o'zgarish qayd | brigada-smena | doimiy biriktirish+o'zgarish | Yo'q | A/B/C doimiy brigada jadvali yo'q (08.61) |
| 08.63 | Smena reja-formasini smena boshida avto-tuzish | 2026-06-27 | TASDIQ-2146 §08 #63 | PP rejasidan (Исаков) | mes_papka_orders | avto-tuzish+bosib chiqarish | Yo'q | mexanizm yo'q; mes_papka_orders 0 qator, sahifa yo'q |
| 08.64 | Rejalashtirish xodimi+Texnolog imzo smenaga | 2026-06-27 | TASDIQ-2146 §08 #64 | Javobgarlik aniq | smena reja | planlovchi+texnolog imzo | Yo'q | imzo/mas'ul maydoni yo'q (reja-forma yo'q) |
| 08.65 | Qog'oz zayavkasini MES sarfiga bog'lash | 2026-06-27 | TASDIQ-2146 §08 #65 | Material nazorati | Заявка бумаги | zayavka↔MES-sarf farq | Yo'q | Заявка бумаги jadvali yo'q; farq hisoblash yo'q |
| 08.66 | Qog'oz formati (А×В)+gramm sessiyaga | 2026-06-27 | TASDIQ-2146 §08 #66 | Aniq material sarfi | production_sessions | format/gramm/kg ustunlar | Yo'q | format(А×В)/gramm/kg ustunlari yo'q (faqat quantity) |
| 08.67 | 'Прошло (дней)' — kutgan kun ko'rsatish | 2026-06-27 | TASDIQ-2146 §08 #67 | Muddat-oshgan ranglash | machine_tasks | kutgan-kun+ranglash | Yo'q | machine_tasks 0 qator, kutish-kun ustuni yo'q |
| 08.68 | 'Зарур заказлар' navbatda oldinga | 2026-06-27 | TASDIQ-2146 §08 #68 | Muddat saqlanadi | machine_tasks.priority | shoshilinch bayroq+signal | Qisman | priority bor; bayroq+navbat-yuqoriga+signal to'liq oqim yo'q (0 qator) |
| 08.69 | Buyurtma mashinalararo marshrutini kuzatish | 2026-06-27 | TASDIQ-2146 §08 #69 | Jonli marshrut | pp_routing / mes_papka_orders | jonli marshrut kuzatuv | Qisman | PP routing bor; MES jonli kuzatuv (stage ustuni yo'q, 0 qator) yo'q |
| 08.70 | Bosqichlararo yarim tayyor qoldiq (bottleneck) | 2026-06-27 | TASDIQ-2146 §08 #70 | Bottleneck ko'rinadi | production-agent.service.ts:125 | per-bosqich WIP ko'rsatish | Qisman | detectBottleneck() 1 mashina; per-bosqich WIP tasdiqlanmadi |
| 08.71 | Tanaffus markerini jadvalda avto-ko'rsatish | 2026-06-27 | TASDIQ-2146 §08 #71 | Normadan chegiriladi | ish-jadval | tanaffus markerlari | Yo'q | markerlar avto-ko'rsatish yo'q (08.49 bilan) |
| 08.72 | Soatlik norma pog'onalari (400/500/…/3000) | 2026-06-27 | TASDIQ-2146 §08 #72 | Mashina×ish turi | ishlab-chiqarish norma | pog'onali norma jadval | Yo'q | pog'onali norma jadvali yo'q |
| 08.73 | Brak%ni stansiya bo'yicha normalash | 2026-06-27 | TASDIQ-2146 §08 #73 | Oshganda signal | per-stansiya brak% | brak% chegara+signal | Yo'q | per-stansiya brak% chegara yo'q; signal yo'q |
| 08.74 | 'ко-во работ' (turli ish soni)+changeover | 2026-06-27 | TASDIQ-2146 §08 #74 | Sozlash yo'qotish | smena ko'rsatkich | ish soni+changeover-vaqt | Yo'q | ko-во работ+changeover ko'rsatkichi yo'q |
| 08.75 | 'переделка' sabab izohi (izoh madaniyati) | 2026-06-27 | TASDIQ-2146 §08 #75 | Kitob izoh madaniyati | mes_downtime_reasons | переделка kodi+majburiy izoh | Yo'q | переделка kodi+izoh yo'q (08.46 bilan) |
| 08.76 | Qolib kechikishi sabab kodi (takror→KB) | 2026-06-27 | TASDIQ-2146 §08 #76 | KB bo'limiga signal | mes_downtime_reasons | qolib kodi+takror-tahlil+KB | Yo'q | kod+takror+KB signal yo'q (08.47 bilan) |
| 08.77 | Norma bajarilmasa majburiy sabab so'rash | 2026-06-27 | TASDIQ-2146 §08 #77 | Usta tasdiqlaydi | norma<chegara gate | majburiy sabab so'rash | Yo'q | norma jadvali yo'q → chegara yo'q; alohida sabab yo'q |
| 08.78 | Mashina remonti ishonchlilik (rejali/avariya) | 2026-06-27 | TASDIQ-2146 §08 #78 | Profilaktika+Kanban | mes_downtime_reasons DT-MAINT / mes_maintenance_requests | avariya/rejali ajratish+MTBF | Qisman | DT-MAINT + maintenance jadvallari bor; ajratish+MTBF tasdiqlanmadi |
| 08.79 | AI kunlik smena xulosasi (narrativ) | 2026-06-27 | TASDIQ-2146 §08 #79 | Egasi Excel o'qiy olmaydi | production-agent.service.ts:134 | LLM narrativ xulosa | Qisman | generateShiftReport() faqat aggregate; LLM narrativ EMAS |
| 08.80 | IoT'siz operator kiritishi bilan ishga tushirish | 2026-06-27 | TASDIQ-2146 §08 #80 | Bugundan ishlaydi | IoT-tablet oqim | to'liq qo'lda oqim | Ha | login→sessiya→checklist→crew→brak→downtime→handover DB-backed REAL |
| 08.81 | НО 12-1/12-2 mas'ulini hisobotga biriktirish | 2026-06-27 | TASDIQ-2146 §08 #81 | Javobgarlik+eskalatsiya | bo'lim hisobot | НО-mas'ul biriktirish jadval | Yo'q | НО-mas'ul jadvali yo'q; bo'lim ajratish yo'q (08.38) |
| 08.82 | Tasdiqlangan o'lchov birligini master-data | 2026-06-27 | TASDIQ-2146 §08 #82 | Yagona o'lchov tili | unit_of_measures / stansiya | stansiya×birlik tasdiqlangan | Yo'q | stansiya×birlik master-data yo'q (08.35+08.55 bilan) |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Brigada tarkibini kim belgilaydi (brigadir+HR) | 2026-06-27 | TASDIQ-2146 §08 #5 | brigadir-tasdiq/doimiy A/B/C biriktirish mexanizmi yo'q | MES |
| Norma chetlashuvini kuzatish (farq%) | 2026-06-27 | TASDIQ-2146 §08 #8 | per-station ishlab-chiqarish norma jadvali yo'q | MES |
| OEE target + ogohlantirish chegarasi | 2026-06-27 | TASDIQ-2146 §08 #15 | per-mashina target/threshold sozlash jadvali yo'q; hardcoded 85 | MES |
| To'xtagan mashina avto-ogohlantirish (15/30 daq) | 2026-06-27 | TASDIQ-2146 §08 #18 | vaqt-asosli avto-eskalatsiya cron yo'q | MES |
| Bonus/reytingga ulanish (ball→A/B/C→bonus) | 2026-06-27 | TASDIQ-2146 §08 #27 | MES ball→bonus→payroll zanjiri yo'q; 0 qator | MES |
| 'А смена План' formasini ekranga ko'chirish | 2026-06-27 | TASDIQ-2146 §08 #31 | smena reja-forma sahifasi yo'q (FE=OEE dashboard) | MES |
| Operator+Yordamchi juftligi (1 op+N yordamchi) | 2026-06-27 | TASDIQ-2146 §08 #33 | machine_crews fixed 4 rol; hissa% ustuni yo'q | MES |
| Norma soatlik + 12-soatlik ikki bazada | 2026-06-27 | TASDIQ-2146 §08 #34 | per-station norma jadvali umuman yo'q | MES |
| Norma o'lchov birligi stansiyaga qarab | 2026-06-27 | TASDIQ-2146 §08 #35 | stansiya×birlik master-data jadvali yo'q | MES |
| 'ish yo'q'ni downtime'dan alohida hisoblash | 2026-06-27 | TASDIQ-2146 §08 #36 | ish-yo'q toifasi yo'q; downtime_reason_codes bo'sh | MES |
| Ish-yo'q paytida boshqa ishga o'tkazish qayd | 2026-06-27 | TASDIQ-2146 §08 #37 | qayta-biriktirish mexanizmi yo'q; ish-yo'q turi yo'q | MES |
| Ofset/Flekso alohida normalash (НО 12-1/12-2) | 2026-06-27 | TASDIQ-2146 §08 #38 | bo'lim ajratish + НО-mas'ul jadvali yo'q | MES |
| Aniq ~30 mashina master-data | 2026-06-27 | TASDIQ-2146 §08 #39 | equipment 7 generik demo; aniq mashina ro'yxati yo'q | MES |
| Tigel 1-10 alohida birlik | 2026-06-27 | TASDIQ-2146 §08 #40 | equipment'da tigel 1-10 alohida birlik yo'q | MES |
| Bir mashina ikki bo'limda ajratish | 2026-06-27 | TASDIQ-2146 §08 #42 | mashina×bo'lim birikma jadvali yo'q | MES |
| 'Kim hozir qaysi mashinada' jonli jadval | 2026-06-27 | TASDIQ-2146 §08 #43 | jonli operator→mashina bandlik jadvali yo'q | MES |
| Bir operator bir necha mashina (foiz/vaqt) | 2026-06-27 | TASDIQ-2146 §08 #44 | 1 sessiya=1 mashina; ko'p-mashina ulush modeli yo'q | MES |
| Yakuniy qadoqlash alohida bosqich/norma | 2026-06-27 | TASDIQ-2146 §08 #45 | qadoqlash bosqich/norma jadvali yo'q | MES |
| 'переделка' alohida yo'qotish (sabab+soat) | 2026-06-27 | TASDIQ-2146 §08 #46 | 7 kodda переделка turi yo'q | MES |
| Qolib tayyor emasligi downtime sababi (KB) | 2026-06-27 | TASDIQ-2146 §08 #47 | qolib kechikishi kodi+KB signal yo'q | MES |
| Norma sof ish vaqtiga (tanaffus chegirib) | 2026-06-27 | TASDIQ-2146 §08 #49 | tanaffus/tushlik/namoz avto-chegirish mexanizmi yo'q | MES |
| 3-smenali tushlik navbat (1/2/3-to'lqin) | 2026-06-27 | TASDIQ-2146 §08 #50 | tushlik navbat boshqaruvi yo'q | MES |
| Namoz tanaffusini sof-ish-vaqtdan ajratish | 2026-06-27 | TASDIQ-2146 §08 #51 | namoz-vaqt chegirish/navbat mexanizmi yo'q | MES |
| Operator×mashina malaka matritsasi | 2026-06-27 | TASDIQ-2146 §08 #54 | kurs-asosli; mashina-turi×operator matritsa yo'q | MES |
| РД-4/Direktor tasdiq zanjiri normaga (versiya) | 2026-06-27 | TASDIQ-2146 §08 #55 | norma jadvali yo'q → approval zanjiri yo'q | MES |
| Norma versiyasi va sanasi saqlash | 2026-06-27 | TASDIQ-2146 §08 #56 | norma versiyalash jadvali yo'q | MES |
| 'Укишга'/'Академияга' o'quv ishlarini ajratish | 2026-06-27 | TASDIQ-2146 §08 #58 | sessiyada o'quv/Akademiya bayrog'i yo'q | MES |
| Gofra (2/5 qatlam) м2+qatlam alohida | 2026-06-27 | TASDIQ-2146 §08 #59 | м2+qatlam ustunlari yo'q; Гф линия master-data'da yo'q | MES |
| Smenani A/B/C harf-nomi bilan saqlash | 2026-06-27 | TASDIQ-2146 §08 #61 | shift_types MORNING/EVENING/NIGHT; A/B/C yo'q | MES |
| Brigada doimiy A/B/C smenaga biriktirish | 2026-06-27 | TASDIQ-2146 §08 #62 | A/B/C doimiy brigada jadvali yo'q | MES |
| Smena reja-formasini smena boshida avto-tuzish | 2026-06-27 | TASDIQ-2146 §08 #63 | PP→MES avto-tuzish yo'q; mes_papka_orders 0 qator | MES |
| Rejalashtirish xodimi+Texnolog imzo smenaga | 2026-06-27 | TASDIQ-2146 §08 #64 | imzo/mas'ul maydoni yo'q (reja-forma yo'q) | MES |
| Qog'oz zayavkasini MES sarfiga bog'lash | 2026-06-27 | TASDIQ-2146 §08 #65 | Заявка бумаги jadvali yo'q; farq hisoblash yo'q | MES |
| Qog'oz formati (А×В)+gramm sessiyaga | 2026-06-27 | TASDIQ-2146 §08 #66 | format/gramm/kg ustunlari yo'q | MES |
| 'Прошло (дней)' — kutgan kun ko'rsatish | 2026-06-27 | TASDIQ-2146 §08 #67 | kutish-kun ustuni+ranglash yo'q; machine_tasks 0 qator | MES |
| Tanaffus markerini jadvalda avto-ko'rsatish | 2026-06-27 | TASDIQ-2146 §08 #71 | markerlar avto-ko'rsatish yo'q | MES |
| Soatlik norma pog'onalari (400/…/3000) | 2026-06-27 | TASDIQ-2146 §08 #72 | pog'onali norma jadvali yo'q | MES |
| Brak%ni stansiya bo'yicha normalash | 2026-06-27 | TASDIQ-2146 §08 #73 | per-stansiya brak% chegara+signal yo'q | MES |
| 'ко-во работ'+changeover ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §08 #74 | ish soni+changeover-vaqt ko'rsatkichi yo'q | MES |
| 'переделка' sabab izohi (izoh madaniyati) | 2026-06-27 | TASDIQ-2146 §08 #75 | переделка kodi+majburiy izoh yo'q | MES |
| Qolib kechikishi sabab kodi (takror→KB) | 2026-06-27 | TASDIQ-2146 §08 #76 | kod+takror-tahlil+KB signal yo'q | MES |
| Norma bajarilmasa majburiy sabab so'rash | 2026-06-27 | TASDIQ-2146 §08 #77 | norma chegarasi yo'q → majburiy sabab gate yo'q | MES |
| НО 12-1/12-2 mas'ulini hisobotga biriktirish | 2026-06-27 | TASDIQ-2146 §08 #81 | НО-mas'ul jadvali yo'q; bo'lim ajratish yo'q | MES |
| Tasdiqlangan o'lchov birligini master-data | 2026-06-27 | TASDIQ-2146 §08 #82 | stansiya×birlik tasdiqlangan master-data yo'q | MES |
