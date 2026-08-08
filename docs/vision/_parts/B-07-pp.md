## [B/TASDIQ] PP / Rejalashtirish (07) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Operatsiya 10-lik qadam (10,20,30) raqamlanadi | 2026-06-27 | TASDIQ-2146 §07 #1 | Yangi bosqich orasiga qo'shilsa raqam buzilmasin | Texkarta/routing | 10-lik konvensiya majburlansin | Qisman (pp_routing_operations.operation_number+sequence) | Ustun bor, 0 qator; konvensiya kodda majburlanmagan |
| 2 | Operatsiyaga stanok + muqobil stanok ro'yxati | 2026-06-27 | TASDIQ-2146 §07 #2 | Asosiy band bo'lsa muqobilga o'tish | Texkarta/routing | Muqobil-stanok ustuni+o'tish mexanizmi | Qisman (pp_routing_operations.work_center_id) | Muqobil/alternative ustuni YO'Q; o'tish qurilmagan |
| 3 | Har operatsiyaga norma (dona/soat) | 2026-06-27 | TASDIQ-2146 §07 #3 | Vaqt hisobi uchun | Texkarta/routing | Norma har operatsiyaga alohida | Ha (pp-crp.service.ts:132-137) | Struktura to'liq, data 0 |
| 4 | Setup vaqti normadan alohida | 2026-06-27 | TASDIQ-2146 §07 #4 | Setup bir martalik partiyaga | Texkarta/routing | setup + run alohida ikki vaqt | Ha (pp-crp.service.ts:183-185) | Setup-guruhlash logikasi yo'q |
| 5 | Chiqindi normasi (doimiy+foizli otxod) | 2026-06-27 | TASDIQ-2146 §07 #5 | To'g'ri material hisobi | Texkarta/norma | Ikki xil otxod: doimiy N list + % | Qisman (technology_cards.scrap_pct) | Faqat %; doimiy otxod ustuni YO'Q |
| 6 | Texkarta versiyali + tasdiqlash | 2026-06-27 | TASDIQ-2146 §07 #6 | Har o'zgarish yangi versiya, eski arxiv | Texkarta | version+status+lab_approved | Ha (technology.repository.ts:143) | Arxiv-snapshot qo'shimcha tekshiruv talab |
| 7 | Operatsiyaga min razryad + sertifikat (LMS) | 2026-06-27 | TASDIQ-2146 §07 #7 | Malaka talabi | Texkarta/routing | Operatsiya-darajada razryad+LMS | Qisman (work_centers.required_skill_name) | Stanok-darajada bor (NULL); operatsiya-darajada yo'q |
| 8 | Karton spetsifikatsiyasi maydonlari | 2026-06-27 | TASDIQ-2146 §07 #8 | Format/flute/gramaj/ranglar/laminatsiya | Texkarta | To'liq spetsifikatsiya maydonlari | Qisman (technology_cards.format_a/gofra_profile) | Struktura bor, real data NULL |
| 9 | Har operatsiya tabiiy birligida (tizim o'tkazadi) | 2026-06-27 | TASDIQ-2146 §07 #9 | list/dona/m²/kg konvertatsiya | Texkarta/conversion | Per-operatsiya birlik+avto-konvertatsiya | Qisman (gofra-conversion.service.ts) | Per-operatsiya birlik ustuni YO'Q |
| 10 | Norma manbai — texnolog + tizim o'rtacha yonma-yon | 2026-06-27 | TASDIQ-2146 §07 #10 | Og'ish ko'rinishi | Norma/reja-fakt | Reja vs haqiqiy yonma-yon | Qisman (technology_cards.average_actual_duration) | Data NULL; production_facts bo'sh |
| 11 | Norma asosiy birlik dona/soat (tizim daqiqaga) | 2026-06-27 | TASDIQ-2146 §07 #11 | Tezlik↔vaqt konvertatsiya | Norma/CRP | Yagona kanonik birlik | Qisman (pp-crp.service.ts) | Ikki shakl bor; capacity_per_hour NULL |
| 12 | Norma tiraj kattaligiga bog'liq (setup alohida) | 2026-06-27 | TASDIQ-2146 §07 #12 | Kichik tiraj sekinroq | CRP/norma | Setup+run → kichik tiraj avto-sekin | Ha (pp-crp.service.ts:183-185) | Pog'onali jadval yo'q lekin A tanlangan |
| 13 | Norma material/rang/laminatsiya kombinatsiyasiga bog'liq | 2026-06-27 | TASDIQ-2146 §07 #13 | Parametrga qarab norma | Norma | Parametr-variatsiya ustuni/jadval | Yo'q (pp_routing_operations) | Norma faqat operatsiyaga; variatsiya YO'Q |
| 14 | Norma % har smena → KPI | 2026-06-27 | TASDIQ-2146 §07 #14 | Bonus/jarima | Reja-fakt/KPI | Smena norma-% jonli hisob | Qisman (production_facts) | 0 qator; PP'da reader yo'q |
| 15 | Stanok kartasi to'liqmi | 2026-06-27 | TASDIQ-2146 §07 #15 | Stanok master-data | Stanok/work_center | Holat+yil+ishlab-chiqaruvchi+format | Qisman (work_centers 12 qator) | Holat/yil/format-chegara ustuni YO'Q |
| 16 | Quvvat = ish soati, tezlik normadan | 2026-06-27 | TASDIQ-2146 §07 #16 | Quvvat modeli | Stanok/CRP | availHours=machines×hours×days×eff | Ha (pp-crp.service.ts:173) | A modeli to'liq qurilgan |
| 17 | Stanok ish jadvali (smena/hafta/bayram) | 2026-06-27 | TASDIQ-2146 §07 #17 | Individual kalendar | Stanok/kalendar | Har-stanok kalendar+bayram | Qisman (erp_shift_calendars) | CRP 5-kun qat'iy; individual kalendar yo'q |
| 18 | Rejali to'xtash (PM) kalendarga | 2026-06-27 | TASDIQ-2146 §07 #18 | Reja PM ni quvvatdan ayirsin | Stanok/CRP | PM-vaqt availHours'dan chiqarilsin | Qisman (equipment_maintenance) | CRP faqat efficiency; PM o'qilmaydi |
| 19 | Stanok format/o'lcham cheklovi | 2026-06-27 | TASDIQ-2146 §07 #19 | Sig'masa boshqa stanok taklif | Stanok | max/min format saqlansin+ogohlantirish | Yo'q (work_centers) | width/length/format ustuni YO'Q |
| 20 | Stanok OEE/samaradorlik koeffitsienti | 2026-06-27 | TASDIQ-2146 §07 #20 | Pasport×koeff=real quvvat | Stanok/CRP | efficiency_rate reja qo'llaydi | Ha (pp-crp.service.ts:120,173) | Rasman kartada; MES-nightly data-siz |
| 21 | Parallel mashinalar — stanok guruhi | 2026-06-27 | TASDIQ-2146 §07 #21 | Eng bo'shga avto-berish | Stanok | machine_group + avto-taqsimlash | Yo'q (work_centers) | machine_group ustuni YO'Q |
| 22 | Reja-fakt drill-down 4 kesim | 2026-06-27 | TASDIQ-2146 §07 #22 | Buyurtma/stanok/smena/ishchi | Reja-fakt | 4-kesim drill-down | Yo'q (production_facts 0 qator) | Reader/handler topilmadi |
| 23 | Reja-fakt nimani solishtiradi (4 metrik) | 2026-06-27 | TASDIQ-2146 §07 #23 | Miqdor/vaqt/muddat/tannarx | Reja-fakt | 4-metrik og'ish alohida | Qisman (production_orders.planned/actual) | Xom maydon bor; og'ish-dvigatel yo'q |
| 24 | Og'ish sababi kodli ro'yxatdan | 2026-06-27 | TASDIQ-2146 §07 #24 | Majburiy kodli sabab | Reja-fakt | Sabab-katalog+majburiy bog'lash | Qisman (mes_downtime_reasons 7 qator) | MES-downtime uchun; PP-og'ishga bog'lanmagan |
| 25 | Og'ish chegarasi → avto-signal | 2026-06-27 | TASDIQ-2146 §07 #25 | >5%/>1kun bildirishnoma | Reja-fakt | Sozlanadigan chegara+avto-notif | Yo'q | Threshold jadvali YO'Q |
| 26 | Reja-fakt yopish — smena hisobot + MES | 2026-06-27 | TASDIQ-2146 §07 #26 | Majburiy usta + real vaqt | Reja-fakt/smena | Smena-oxiri majburiy + MES birlashsin | Qisman (machine_status_logs 9 qator) | shift_handovers 0 qator; birlashma yo'q |
| 27 | Ustuvorlik asosiy mezon — deadline | 2026-06-27 | TASDIQ-2146 §07 #27 | Teng bo'lsa mijoz darajasi | Ustuvorlik | deadline→mijoz saralash | Ha (production-priority.service.ts:95-107) | A modeli pure+testable qurilgan |
| 28 | Ustuvorlik 4 daraja | 2026-06-27 | TASDIQ-2146 §07 #28 | Shoshilinch/Yuqori/Oddiy/Past | Ustuvorlik | 4-daraja enum+rang | Ha (production-priority.service.ts:39-52) | 4-band model to'liq; rang FE'da |
| 29 | Ustuvorlikni kim o'zgartiradi (jurnal) | 2026-06-27 | TASDIQ-2146 §07 #29 | Faqat boshliq+direktor | Ustuvorlik/RBAC | Rol-cheklov+majburiy-sabab jurnal | Qisman (production_order_status_log 0 qator) | RBAC-gate kod-darajada tasdiqlanmadi |
| 30 | Preemption — joriy ish tugatiladi | 2026-06-27 | TASDIQ-2146 §07 #30 | Faqat direktor uzadi | Ustuvorlik/navbat | Frozen segment interleave qilinmasin | Ha (production-priority.service.ts:119-162) | "100% yakungacha" kodga yozilgan |
| 31 | Bottleneck avto-navbat + to'qnashuv ko'rsatish | 2026-06-27 | TASDIQ-2146 §07 #31 | Rahbarga to'qnashuv | CRP/navbat | Stanok-darajali navbat+signal | Qisman (pp-crp.service.ts:203-208) | Bottleneck aniqlaydi; stanok-to'qnashuv ulanmagan |
| 32 | Buyurtmani partiyalarga bo'lish (split) | 2026-06-27 | TASDIQ-2146 §07 #32 | Har partiya o'z muddati | Buyurtma | split/partiya metodi | Yo'q (production-order.aggregate) | split metodi YO'Q; EP-PP-063 kolliziya |
| 33 | Reorder point + avto ta'minot so'rovi | 2026-06-27 | TASDIQ-2146 §07 #33 | Zaxira pasaysa avto-so'rov | Material/ROP | ROP trigger→purchase requisition | Ha (rop-trigger.handler.ts:110-180) | To'liq event-driven, 24h dedup |
| 34 | Lead time saqlanib ROP=sarf×lead+zaxira | 2026-06-27 | TASDIQ-2146 §07 #34 | Dinamik reorder | Material/ROP | Formula-ulanish | Qisman (inventory_policy.lead_time_days) | material_cards'da lead_time YO'Q; formula qisman |
| 35 | Buyurtma qabulida ATP (xom+quvvat) → qizil | 2026-06-27 | TASDIQ-2146 §07 #35 | Yetmasa qizil+sana | ATP | ATP UI'ga ulanib ogohlantirish | Qisman (mps-atp.handler.ts:60-119) | ATP hisob REAL; oqim-ulanish noaniq |
| 36 | Tasdiqlangan buyurtmaga material rezerv | 2026-06-27 | TASDIQ-2146 §07 #36 | Erkin qoldiq ko'rsatilsin | Material/rezerv | Rezerv-yozish+erkin qoldiq hisobi | Qisman (production_material_allocs 0 qator) | Jadval bor, rezerv-yozish data-siz |
| 37 | Yarim tayyor (zagotovka) alohida zaxira | 2026-06-27 | TASDIQ-2146 §07 #37 | Reja avval shuni ishlatadi | Material/WIP | Zagotovka-zaxira+reja-avval logika | Yo'q | Oraliq zagotovka modeli qurilmagan |
| 38 | Xom-ashyo partiyali (lot) + FIFO avto-tavsiya | 2026-06-27 | TASDIQ-2146 §07 #38 | Muddat-blok | Material/lot | Lot hisob+FIFO+muddat-blok | Yo'q | PP-reja FIFO-tavsiya bermaydi (WMS'da) |
| 39 | ROP mavsumiy sarfdan davriy qayta hisoblanadi | 2026-06-27 | TASDIQ-2146 §07 #39 | O'zgaruvchan sarf | Material/ROP | 1-3 oy o'rtachadan qayta-hisob cron | Yo'q (rop-trigger.handler.ts:112-118) | reorder_point STATIK; cron YO'Q |
| 40 | Smena rejasi — smena×stanok×buyurtma×ishchi | 2026-06-27 | TASDIQ-2146 §07 #40 | Har smena tayyor jadval | Smena reja | 4-o'lchovli smena-reja | Qisman (shift_schedules 30 qator) | Faqat ishchi-smena; stanok×buyurtma yo'q |
| 41 | Smena turlari sozlanadigan (2/3 + tanaffus) | 2026-06-27 | TASDIQ-2146 §07 #41 | Har bo'limga moslash | Smena reja | Sozlanadigan shablon+tanaffus | Qisman (shift_schedules.shift_type) | 3-smena bor; sozlash+tanaffus tasdiqlanmadi |
| 42 | Smenaga ishchi malaka tekshiruvi | 2026-06-27 | TASDIQ-2146 §07 #42 | Mos kelmasa ogohlantirish | Smena reja | Malaka↔operatsiya solishtiruv | Yo'q (shift_schedules) | Tekshiruv kodi topilmadi |
| 43 | Ishchi yo'qligida zaxira taklif | 2026-06-27 | TASDIQ-2146 §07 #43 | Malakali bo'sh ishchi taklifi | Smena reja | Yo'qlik→avto-almashtiruvchi | Yo'q | Logika topilmadi (qo'lda) |
| 44 | Smena topshirig'i (peresmenka) elektron | 2026-06-27 | TASDIQ-2146 §07 #44 | Keyingi smena ko'radi | Smena reja | Elektron handover oqimi | Qisman (shift_handovers 0 qator) | Jadval bor, data-siz |
| 45 | Qo'shimcha smena/sverxurochniy → oylik | 2026-06-27 | TASDIQ-2146 §07 #45 | Koeffitsient bilan | Smena/payroll | Qo'shimcha-smena belgisi+payroll | Yo'q (shift_schedules) | Belgi+payroll-ulanish topilmadi |
| 46 | Smena oxiri avto-dashboard | 2026-06-27 | TASDIQ-2146 §07 #46 | norma%/brak%/prostoy/dona/eng-yomon | Smena/dashboard | Yagona avto-dashboard | Qisman (production_facts 0 qator) | Bo'laklar bor, dashboard yo'q |
| 47 | Norma manbai — qo'lda+o'rtacha yonma-yon (EP-PP-041) | 2026-06-27 | TASDIQ-2146 §07 #47 | Norma yaxshilash | Norma | Yonma-yon og'ish mexanizmi | Qisman (technology_cards) | 1 qator; material_norms 0 qator |
| 48 | Norma turi dona/soat↔daqiqa/dona (EP-PP-042) | 2026-06-27 | TASDIQ-2146 §07 #48 | Tizim o'tkazadi | Norma | Konversiya jonli | Qisman (routing_operations) | Ikkala birlik bor; 0 qator |
| 49 | Norma tiraj kattaligiga bog'liq (EP-PP-043) | 2026-06-27 | TASDIQ-2146 §07 #49 | Kichik tiraj sekinroq | Norma/CRP | Setup+run model | Qisman (setup_duration_minutes) | Schema bor; data 0, formula jonli isbotlanmadi |
| 50 | Norma material/dizaynga bog'liq (EP-PP-044) | 2026-06-27 | TASDIQ-2146 §07 #50 | Rang/flute/laminatsiya | Norma | Parametr↔norma bog'lash | Qisman (pp_flute_types 5 qator) | Parametr master bor; bog'lanish data 0 |
| 51 | Norma % → KPI/oylik (EP-PP-045) | 2026-06-27 | TASDIQ-2146 §07 #51 | Bonus/jarima | Norma/KPI | Operator norma-% data | Qisman (mes_shift_stats 6 qator) | production_facts 0 qator |
| 52 | Stanok kartasi to'liq maydonlari (EP-PP-046) | 2026-06-27 | TASDIQ-2146 §07 #52 | Yil/format-chegara | Stanok | Yil+ishlab-chiqaruvchi+format | Qisman (work_centers 12 qator) | Yil/format ustuni YO'Q |
| 53 | Quvvat birligi — ish soati (EP-PP-047) | 2026-06-27 | TASDIQ-2146 §07 #53 | Tezlik normadan | Stanok/CRP | Soat-asosli quvvat | Ha (pp-crp.service.ts:113-169) | Ikkala birlik bor |
| 54 | Stanok ish jadvali (har stanokka kalendar) (EP-PP-048) | 2026-06-27 | TASDIQ-2146 §07 #54 | Bayram hisobi | Stanok/kalendar | work_center_capacity data | Yo'q (0 qator) | Kalendar data yo'q; bayram modeli yozilmagan |
| 55 | Rejali to'xtash PM → quvvatdan (EP-PP-049) | 2026-06-27 | TASDIQ-2146 §07 #55 | Bo'sh quvvat aniq | Stanok/CRP | PM↔CRP bog'lash | Qisman (equipment_maintenance) | PM infra bor; CRP-ulanish yo'q |
| 56 | Stanok format cheklovi (EP-PP-050) | 2026-06-27 | TASDIQ-2146 §07 #56 | Sig'masa boshqa stanok | Stanok | max/min format+tekshiruv | Yo'q (work_centers) | Format ustuni YO'Q |
| 57 | OEE koeffitsienti reja qo'llaydi (EP-PP-051) | 2026-06-27 | TASDIQ-2146 §07 #57 | efficiency_rate kartaga | Stanok/CRP | efficiency_rate WIRED | Ha (pp-crp.service.ts:120,169) | 12 qator REAL to'ldirilgan; WIRED |
| 58 | Parallel mashinalar guruh (EP-PP-052) | 2026-06-27 | TASDIQ-2146 §07 #58 | Eng bo'shga avto | Stanok | Stanok-guruh balansi | Yo'q (work_centers) | Guruh-ustun/logika YO'Q |
| 59 | Reja-fakt 4 kesim drill-down (EP-PP-053) | 2026-06-27 | TASDIQ-2146 §07 #59 | Buyurtma/stanok/smena/ishchi | Reja-fakt | To'liq drill-down data | Qisman (production_fact 1 qator) | 4-kesim ustunlari bor; data yo'q |
| 60 | Reja-fakt 4-metrik solishtirish (EP-PP-054) | 2026-06-27 | TASDIQ-2146 §07 #60 | Miqdor/vaqt/muddat/tannarx | Reja-fakt | 4-metrik og'ish | Qisman (production_fact) | Muddat+tannarx og'ishi alohida ustun yo'q |
| 61 | Og'ish sababi kodli 5-guruh (EP-PP-055) | 2026-06-27 | TASDIQ-2146 §07 #61 | Majburiy kodli sabab | Reja-fakt | 5-sabab master seed | Qisman (downtime_reason_codes 0 qator) | Master SEED qilinmagan; erkin matn |
| 62 | Reja-fakt chegara+signal (EP-PP-056) | 2026-06-27 | TASDIQ-2146 §07 #62 | >5%/>1kun notif | Reja-fakt | Sozlanadigan chegara+notif | Yo'q | Chegara jadvali/notif ulanmagan |
| 63 | Reja-fakt yopish smena+MES (EP-PP-057) | 2026-06-27 | TASDIQ-2146 §07 #63 | Majburiy hisobot | Reja-fakt/smena | Smena-yopish jonli | Qisman (production-shift-reports.controller.ts) | production_facts 0 qator; jonli emas |
| 64 | Ustuvorlik deadline+mijoz (EP-PP-058) | 2026-06-27 | TASDIQ-2146 §07 #64 | Ochered+ZARUR | Ustuvorlik | Avto-tartiblash algoritmi | Qisman (production_orders.priority) | Maydonlar bor; algoritm jonli isbotlanmadi |
| 65 | Ustuvorlik 4 daraja+rang (EP-PP-059) | 2026-06-27 | TASDIQ-2146 §07 #65 | Standartlashtirish | Ustuvorlik | 4-daraja enum+rang-mapping | Qisman (production_orders.priority) | Enum+rang aniq belgilanmagan |
| 66 | Ustuvorlikni kim o'zgartiradi (EP-PP-060) | 2026-06-27 | TASDIQ-2146 §07 #66 | Boshliq+direktor jurnal | Ustuvorlik/RBAC | Audit jurnal+RBAC-gate | Yo'q (status_log 0 qator) | Jurnal+gate ulanmagan |
| 67 | Preemption — direktor uzadi (EP-PP-061) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #67 | Preemption taqiq (kitob) | Ustuvorlik | Ish-uzish bloki | egasi-data | Kitob-policy; majburlovchi mexanizm yo'q |
| 68 | Bottleneck avto-navbat+TOC (EP-PP-062) | 2026-06-27 | TASDIQ-2146 §07 #68 | To'qnashuv rahbarga | CRP/navbat | TOC-navbat+signal | Yo'q (pp-crp.service) | TOC logikasi topilmadi |
| 69 | Buyurtma split — kolliziya (EP-PP-063) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #69 | split-delivery ≠ parchalash | Buyurtma | Kolliziya hal | egasi-data | ⚠️KOLLIZIYA; egasi farqni hal qilishi kerak |
| 70 | Reorder point + avto so'rov (EP-PP-064) | 2026-06-27 | TASDIQ-2146 §07 #70 | Pasaysa avto-so'rov | Material/ROP | ROP mexanizm WIRED | Ha (rop-trigger.handler.ts) | inventory_policy 31 qator; WIRED |
| 71 | Lead time har materialga (EP-PP-065) | 2026-06-27 | TASDIQ-2146 §07 #71 | Uzoq/tez material | Material/ROP | Lead-time+2-sinf ajratish | Qisman (inventory_policy 31 qator) | Uzoq/tez toifa ajratilmagan; egasi-data |
| 72 | ATP xom+quvvat ko'rsatish (EP-PP-066) | 2026-06-27 | TASDIQ-2146 §07 #72 | Yetmasa qizil+sana | ATP | Sinxron tekshiruv | Qisman (pp_mrp_runs 0 qator) | Infra bor; sinxron tekshiruv jonli emas |
| 73 | Reja gorizonti sutkalik/haftalik/oylik (EP-PP-067) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #73 | Master gorizont | Reja | Master gorizont qiymati | egasi-data | ⚠️ master gorizont; EP-PP-001 bilan egasi tasdig'i |
| 74 | Material rezervlash (EP-PP-068) | 2026-06-27 | TASDIQ-2146 §07 #74 | Erkin qoldiq | Material/rezerv | Allokatsiya+erkin qoldiq | Qisman (production_material_allocs) | Rezerv-qoldiq WMS'da; PP-bog'lanish tasdiqlanmadi |
| 75 | Yarim tayyor WIP zaxira (EP-PP-069) | 2026-06-27 | TASDIQ-2146 §07 #75 | Reja avval WIP | Material/WIP | Reja-avval-WIP logika | Qisman (production_material_balance) | Schema bor; logika qurilmagan |
| 76 | Lot/FIFO + muddat-blok (EP-PP-070) | 2026-06-27 | TASDIQ-2146 §07 #76 | Lab namlik/granmaj blok | Material/lot | FIFO-tavsiya+muddat-blok | Qisman (batch_lots) | Lot infra keng; blok logikasi jonli isbotlanmadi |
| 77 | Mavsumiy ROP qayta hisob (EP-PP-071) | 2026-06-27 | TASDIQ-2146 §07 #77 | O'rtacha sarf | Material/ROP | Davriy qayta-hisob | Yo'q (inventory_policy statik) | Dinamik reorder qurilmagan |
| 78 | Smena reja 4-o'lchov (EP-PP-072) | 2026-06-27 | TASDIQ-2146 §07 #78 | Soatlik reja | Smena reja | Stanok×buyurtma biriktiruv | Qisman (shift_assignments 30 qator) | Kalit ustunlar NULL; 4-o'lcham ulanmagan |
| 79 | Smena reja operator+yordamchi 2 rol (EP-PP-073) | 2026-06-27 | TASDIQ-2146 §07 #79 | Fakt/norma ikkisiga | Smena reja | 2-rol biriktirish | Qisman (machine_crews 2 qator) | role/work_center_id NULL; master_id=0 |
| 80 | Smena turlari shablon (EP-PP-074) | 2026-06-27 | TASDIQ-2146 §07 #80 | den/noch + tanaffus | Smena reja | Sozlanadigan shablon | Ha (shift_types 3 qator) | Master to'ldirilgan (den/noch+tungi) |
| 81 | Smena reja malaka tekshiruv (EP-PP-075) | 2026-06-27 | TASDIQ-2146 §07 #81 | Mos kelmasa ogohlantirish | Smena reja | Malaka↔operatsiya solishtiruv | Qisman (work_centers.required_skill_name) | Solishtirish smena-servisida jonli emas |
| 82 | Smena reja yo'qlik/almashish (EP-PP-076) | 2026-06-27 | TASDIQ-2146 §07 #82 | Zaxira taklifi | Smena reja | Avto-taklif logika | Qisman (shift_swap_requests 0 qator) | Qo'lda swap schema bor; avto yo'q |
| 83 | Smena topshiriq elektron (EP-PP-077) | 2026-06-27 | TASDIQ-2146 §07 #83 | Keyingi smena ko'radi | Smena reja | Handover oqim | Qisman (shift_handovers 0 qator) | Schema to'liq; data yo'q |
| 84 | Ortiqcha ish koeffitsient→oylik (EP-PP-078) | 2026-06-27 | TASDIQ-2146 §07 #84 | Rahbar tasdig'i | Smena/payroll | Belgilash+payroll-ulanish | Qisman (shift_types.overtime_multiplier) | Koeff bor; belgilash+ulanish yo'q |
| 85 | Smena kunlik nazorat (EP-PP-079) | 2026-06-27 | TASDIQ-2146 §07 #85 | norma%/brak%/prostoy | Smena/dashboard | Yagona dashboard | Qisman (mes_shift_stats 6 qator) | brak%/oee bor; yagona ekran jonli emas |
| 86 | Qayta rejalash avto-kunlik+qo'lda (EP-PP-080) | 2026-06-27 | TASDIQ-2146 §07 #86 | Kechasi avto | Reja | Kunlik replan cron | Yo'q | pp.plan.dailyReplan cron topilmadi |
| 87 | Reja qotirish frozen window (EP-PP-081) | 2026-06-27 | TASDIQ-2146 §07 #87 | Og'zaki o'zgartirish taqiq | Reja | Frozen-window ustun/logika | Yo'q | Frozen-zona logikasi topilmadi |
| 88 | Buyurtma status sikli + jurnal (EP-PP-082) | 2026-06-27 | TASDIQ-2146 §07 #88 | Har o'tish kim/qachon | Buyurtma | Status-o'tish jurnal | Qisman (status_log 0 qator) | Schema bor; data bo'sh; 8-status yo'q |
| 89 | Bekor qilish — material yo'qotish+WIP+sabab (EP-PP-083) | 2026-06-27 | TASDIQ-2146 §07 #89 | Sabab majburiy | Buyurtma | Cancel-handler zanjiri | Yo'q | cancel-handler topilmadi |
| 90 | Buyurtma birlashtirish gang run (EP-PP-084) | 2026-06-27 | TASDIQ-2146 §07 #90 | Bitta bosma topshiriq | Buyurtma | Gang-run guruhlash | Yo'q | gang* jadval YO'Q |
| 91 | Ochered navbat raqami + drag-drop (EP-PP-085) | 2026-06-27 | TASDIQ-2146 §07 #91 | Har stanok navbat o'rni | Navbat | sequence ustun+drag-drop UI | Qisman (machine_tasks) | Saqlash imkoni bor; sequence+UI jonli emas |
| 92 | Algoritm turi 2-8 bo'lim avto (EP-PP-086) | 2026-06-27 | TASDIQ-2146 §07 #92 | Murakkablik sinfi | Texkarta/routing | Bo'lim-sonidan algoritm-tur | Yo'q (technology_cards.operations) | Tasnif qurilmagan |
| 93 | Yo'nalish master tanlov (EP-PP-087) | 2026-06-27 | TASDIQ-2146 §07 #93 | Marshrut/narx/material to'ladi | Texkarta | Yo'nalish→avto-to'ldirish | Qisman (technology_cards.direction) | 1 qator; avto-to'ldirish jonli emas |
| 94 | Kashirovka avto-bosqich (EP-PP-088) | 2026-06-27 | TASDIQ-2146 §07 #94 | Faqat ofset-gofra | Texkarta/routing | Yo'nalishga-qarab avto-qo'shish | Qisman (technology_cards.post_press) | Ustun bor; avto-qo'shish logikasi yo'q |
| 95 | Texkarta BOM strukturasi (EP-PP-089) | 2026-06-27 | TASDIQ-2146 §07 #95 | MRP/ATP shundan o'qiydi | Texkarta/BOM | tech_card_bom data | Qisman (tech_card_bom 0 qator) | Schema to'liq; data yo'q |
| 96 | Texkarta 6 element (EP-PP-090) | 2026-06-27 | TASDIQ-2146 §07 #96 | Kitob bayt-ma-bayt | Texkarta | 6-element schema | Ha (technology_cards) | Kitob RD5 6-element schema'da; data 1 qator |
| 97 | Texkarta lab tasdiq gate (EP-PP-091) | 2026-06-27 | TASDIQ-2146 §07 #97 | Tasdiqsiz reja ishlamaydi | Texkarta/gate | Lab-gate majburlash | Qisman (lab_approved) | Schema+servis bor; gate jonli majburlash yo'q |
| 98 | Smena 4 raqam (reja/fakt/qolgan/brak) (EP-PP-092) | 2026-06-27 | TASDIQ-2146 §07 #98 | MES avtomatik | Smena/reja-fakt | 4-raqam kiritish | Qisman (production_facts 0 qator) | "Qolgan" ustun yo'q; data bo'sh |
| 99 | Brak → yetishmovchilik → avto rework (EP-PP-093) | 2026-06-27 | TASDIQ-2146 §07 #99 | Butun partiya qayta ishlash | Reja-fakt/rework | Avto rework-order | Yo'q (grep rework=0) | Yetishmovchilik→rework yaratuvchi yo'q |
| 100 | Raskroy list-soni avto (EP-PP-094) | 2026-06-27 | TASDIQ-2146 §07 #100 | tiraj÷N+brak zaxira | Texkarta/norma | Avto list-soni hisob | Qisman (technology_cards.raskroy_per_list) | Ustun bor; hisob-mexanizm yo'q |
| 101 | AI razmer optimizatsiya tavsiya (EP-PP-095) | 2026-06-27 | TASDIQ-2146 §07 #101 | Real foyda usuli | AI/raskroy | optimize endpoint | Yo'q (technology.controller.ts:191-192) | notImplemented stub |
| 102 | Min tiraj → kichik+foyda ogohlantirish (EP-PP-096) | 2026-06-27 | TASDIQ-2146 §07 #102 | Savdoga ogohlantirish | ATP/Savdo | Min-tiraj chegara+ogohlantirish | Yo'q (grep=0) | Logika yo'q; chegara egasi-data |
| 103 | ZARUR ZAKAZLAR bayroq+blok+jurnal (EP-PP-097) | 2026-06-27 | TASDIQ-2146 §07 #103 | Navbat boshiga | Ustuvorlik/navbat | Zarur-blok+jurnal | Qisman (production_orders.is_urgent) | is_urgent saralanadi; dashboard-blok+jurnal yo'q |
| 104 | Buyurtma↔menejer avto-xabar (EP-PP-098) | 2026-06-27 | TASDIQ-2146 §07 #104 | Kechikishda xabar | Buyurtma/notif | Bog'lash+xabar zanjiri | Yo'q (responsible_manager_id 0/7 NULL) | Bog'lash ham, xabar ham yo'q |
| 105 | Tayyorlik % = bajarilgan÷jami bo'lim (EP-PP-099) | 2026-06-27 | TASDIQ-2146 §07 #105 | Sodda ko'rinarli | Buyurtma/dashboard | Bo'lim-bo'yicha % hisob | Qisman (production_orders.progress) | Ustun bor; hisob formula yo'q |
| 106 | 3 taymer (ketgan/qolgan/boshlanmagan) (EP-PP-100) | 2026-06-27 | TASDIQ-2146 §07 #106 | Kunlik asosiy raqamlar | Dashboard | 3-taymer hisob | Yo'q (grep=0) | Hozir Excelda; logika yo'q |
| 107 | Kutish zonasi sabab bilan (EP-PP-101) | 2026-06-27 | TASDIQ-2146 §07 #107 | Nimani kutayotgani | Dashboard | Sabab-kodli kutish zonasi | Yo'q (grep=0) | Kutish zonasi qurilmagan |
| 108 | Priladka rang-formula + pragon (EP-PP-102) | 2026-06-27 | TASDIQ-2146 §07 #108 | Umumiy/bo'lim pragon | Norma/setup | rang×daqiqa formula+pragon | Qisman (tech_card_routes.setup_minutes) | Statik setup; rang-formula yo'q |
| 109 | Avto papka № (2024-0499) (EP-PP-103) | 2026-06-27 | TASDIQ-2146 §07 #109 | Xodimlar qidiradi | Buyurtma | Yil-ketma-ket generator | Qisman (papka_orders.papka_no) | card_folders 0 qator; generator yo'q |
| 110 | Takror buyurtma katalogdan texkarta (EP-PP-104) | 2026-06-27 | TASDIQ-2146 §07 #110 | Tez, bir xil sifat | Texkarta | Eski karta chaqirish flow | Yo'q (grep=0) | Versiya saqlaydi; qayta-ishlatish flow yo'q |
| 111 | Bog'liq qismlar to'plam gate (EP-PP-105) | 2026-06-27 | TASDIQ-2146 §07 #111 | Biri qolsa ogohlantirish | Buyurtma | To'plam-gate model | Yo'q (grep=0) | Ko'p-qismli to'plam-gate yo'q |
| 112 | AI o'tgan fakt vaqti ATP tavsiya (EP-PP-106) | 2026-06-27 | TASDIQ-2146 §07 #112 | Tajriba-asosli ATP | AI/ATP | Tarix-asosli tavsiya | Yo'q (grep=0) | Ustunlar bor; tavsiya yo'q |
| 113 | Navbat kun+smena (den/noch) 2 slot (EP-PP-107) | 2026-06-27 | TASDIQ-2146 §07 #113 | Tungi quvvat ko'rinadi | Navbat/smena | Kun×smena 2-slot navbat | Qisman (erp_shift_calendars) | Master belgilangan; CRP 2-slot ajratmaydi |
| 114 | Sex tableti start/stop timestamp (EP-PP-108) | 2026-06-27 | TASDIQ-2146 §07 #114 | Norma faktdan | MES/tablet | started_at/completed_at yozish | Qisman (production_order_operations 0 qator) | Model tayyor; jonli ulanish ko'rinmadi |
| 115 | Kod lug'ati master (KT/PT/E/GL) (EP-PP-109) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #115 | Qidiriladi/filtrlanadi | Buyurtma | Kod-lug'at jadval | egasi-data | Jadval yo'q; egasi KT/PT/E/GL ma'nosi kerak |
| 116 | Reja-fakt 3 kesim, hafta asosiy (EP-PP-110) | 2026-06-27 | TASDIQ-2146 §07 #116 | Hafta boshqaruv kesimi | Reja-fakt | Kun/hafta/oy drill-down | Qisman (production.repository.ts:105) | Haftalik aggregat bor; "hafta qolgan" yo'q |
| 117 | Marshrutda is_core asosiy vs umumiy vaqt (EP-PP-111) | 2026-06-27 | TASDIQ-2146 §07 #117 | Qaerda qotgani | Reja-fakt/routing | is_core+alohida vaqt | Qisman (tech_card_routes.is_core) | Ustun bor; 0 qator; hisob yo'q |
| 118 | Oynakcha = PVX material+qo'l-mehnat (EP-PP-112) | 2026-06-27 | TASDIQ-2146 §07 #118 | Alohida bosqich | Texkarta/routing | PVX+norma bosqich | Yo'q (grep=0) | Strukturalangan model yo'q |
| 119 | Pardoz turi + alohida norma (EP-PP-113) | 2026-06-27 | TASDIQ-2146 §07 #119 | laminat/lak/vib-lak | Texkarta/norma | Pardoz-tur+norma jadval | Yo'q (grep=0) | 3-pardoz-tur jadvali yo'q |
| 120 | Qadoq turi 10+ + norma (EP-PP-114) | 2026-06-27 | TASDIQ-2146 §07 #120 | Har turga norma | Texkarta/norma | Qadoq-tur master+norma | Yo'q (grep=0) | 10+ qadoq-tur modeli yo'q |
| 121 | Qolip ID+holat gate (EP-PP-115) | 2026-06-27 | TASDIQ-2146 §07 #121 | Qolip-yo'q→gate | Texkarta/gate | Holat enum+gate | Qisman (technology_cards.qolip_id) | Faqat ID-FK; holat-enum+gate yo'q |
| 122 | Gofra profili master+bog'lash (EP-PP-116) | 2026-06-27 | TASDIQ-2146 §07 #122 | Aralashtirish oldini olish | Texkarta | Profil→material+stanok bog'lash | Qisman (pp_flute_types 5 qator) | Master bor; bog'lash+blok yo'q |
| 123 | Format kod↔stanok moslik (EP-PP-117) | 2026-06-27 | TASDIQ-2146 §07 #123 | Fizik xato oldini olish | Texkarta/stanok | Format>stanok tekshiruv | Qisman (format_code) | Ustunlar bor; moslik-tekshiruv yo'q |
| 124 | Buyurtma multi-line pozitsiya (EP-PP-118) | 2026-06-27 | TASDIQ-2146 §07 #124 | Har pozitsiya o'z marshruti | Buyurtma | Multi-line struktura | Yo'q (production_orders skalyar) | 1 mahsulot=1 buyurtma; multi-line yo'q |
| 125 | Marshrutga material-tayyorlash+yetkazish (EP-PP-119) | 2026-06-27 | TASDIQ-2146 §07 #125 | To'liq muddat | Routing | Tashqi bosqichlar+norma | Yo'q (grep=0) | Faqat sex operatsiyalari |
| 126 | Bandlik dashboard (band%/navbat/slot) (EP-PP-120) | 2026-06-27 | TASDIQ-2146 §07 #126 | Vizual yuklama | Dashboard/CRP | To'liq vizual dashboard | Qisman (pp-crp.service.ts:104,203) | Band% hisoblanadi; vizual dashboard yo'q |
| 127 | 22+ stanok master (EP-PP-121) | 2026-06-27 | TASDIQ-2146 §07 #127 | Egasi ro'yxati | Stanok | 22+ stanok kiritish | Qisman (pp_work_centers 12 qator) | 12<22+; Begovka/Tisnenie... kiritilmagan |
| 128 | Post-press checkbox→marshrut (EP-PP-122) | 2026-06-27 | TASDIQ-2146 §07 #128 | Reja shishmaydi | Texkarta/routing | Checkbox→avto-qo'shish | Qisman (technology_cards.post_press jsonb) | Ustun bor; checkbox UI+avto-qo'shish yo'q |
| 129 | Tekshirilmagan maket→kutish gate (EP-PP-123) | 2026-06-27 | TASDIQ-2146 §07 #129 | Sifat rejadan ustun | Texkarta/gate | Maket-gate+rahbar override audit | Qisman (maket_approved+setMaketApproved) | Gate bor; avto-kutish bloklash to'liq emas |
| 130 | Reja boshlash 3-gate (maket/lab/material) (EP-PP-124) | 2026-06-27 | TASDIQ-2146 §07 #130 | Uchchasi yashil | Texkarta/gate | 3-gate birgalikda bloklovchi | Qisman (lab_approved+maket_approved) | Vizual pill bor; server-side gate tasdiqlanmadi |
| 131 | Maket holat sikli+muddat surish (EP-PP-125) | 2026-06-27 | TASDIQ-2146 §07 #131 | Dorabotka sikli | Texkarta | Sikl-status+avto muddat | Yo'q (maket_approved faqat boolean) | Sikl-status yo'q; muddat surish yo'q |
| 132 | Konstruktor bosqichi marshrutda (EP-PP-126) | 2026-06-27 | TASDIQ-2146 §07 #132 | Chizma+qolip | Routing | Konstruktor-bosqich vaqt+holat | Yo'q (grep=0) | qolip_id FK bor; konstruktor-bosqich yo'q |
| 133 | Operator norma % → HR oylik (EP-PP-127) | 2026-06-27 | TASDIQ-2146 §07 #133 | Kunlik+oylik avto | Norma/KPI/payroll | fakt÷norma+HR-ulanish | Qisman (production_sessions target/actual) | Xom-ashyo bor; hisob+HR-ulanish yo'q |
| 134 | Bo'sh vs sekin ajratish (adolat) (EP-PP-128) | 2026-06-27 | TASDIQ-2146 §07 #134 | Bo'sh turish KPIga ta'sir qilmasin | KPI | idle-vs-slow adolat logika | Yo'q (grep=0) | Ajratuvchi logika yo'q |
| 135 | Reja Excelga eksport (EP-PP-129) | 2026-06-27 | TASDIQ-2146 §07 #135 | O'tish silliq | Reja/eksport | Excel-eksport endpoint | Yo'q (grep=0) | Eksport endpoint yo'q |
| 136 | AI smena optimal to'plam 1-klik (EP-PP-130) | 2026-06-27 | TASDIQ-2146 §07 #136 | rang-guruh+zarur+bottleneck | AI/reja | AI-fill+1-klik | Qisman (pp-ai-planning.service.ts:271,294) | Hook bor; AI-fill key-gated stub; egasi-data kalit |
| 137 | AI bottleneck TOC optimizatsiya (EP-PP-131) | 2026-06-27 | TASDIQ-2146 §07 #137 | Umumiy chiqim maks | AI/CRP | TOC-reja | Qisman (pp-crp.service.ts:203, Step4) | Aniqlash bor; TOC-reja Step7 stub |
| 138 | CRP ikki cheklov (stanok×xodim) (EP-PP-132) | 2026-06-27 | TASDIQ-2146 §07 #138 | Real parallel | CRP | Xodim-mavjudlik 2-cheklov | Yo'q (grep labor.constraint=0) | Faqat stanok; xodim-cheklovsiz (optimistik) |
| 139 | Buyurtma turi 3 xil qisqa marshrut (EP-PP-133) | 2026-06-27 | TASDIQ-2146 §07 #139 | Xizmatga qisqa marshrut | Buyurtma/routing | 3-tur enum+qisqa-marshrut | Qisman (production_orders.order_type) | Xom ustun; avto-marshrut tanlash tasdiqlanmadi |
| 140 | Egasi 1-ekranli dashboard (EP-PP-134) | 2026-06-27 | TASDIQ-2146 §07 #140 | Non-texnik egasi | Dashboard | Jamlangan PP-sog'lik ekran | Yo'q (grep=0) | Egasi-dashboard yo'q |
| 141 | Og'ish>X% → norma avto-kalibrlash (EP-PP-135) | 2026-06-27 | TASDIQ-2146 §07 #141 | O'z-o'zini kalibrlash | Norma | Kalibrlash tavsiya logika | Yo'q (grep calibrat=0) | Xom-ashyo bor; kalibrlash yo'q |
| 142 | AI oylik sabab-Pareto (EP-PP-136) | 2026-06-27 | TASDIQ-2146 §07 #142 | Tizimli yaxshilanish | AI/hisobot | reason_code+AI Pareto | Yo'q (grep pareto=0) | Jadval+Pareto hisoboti qurilmagan |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Norma material/rang/laminatsiya kombinatsiyasiga bog'liq | 2026-06-27 | TASDIQ-2146 §07 #13 | Norma faqat operatsiyaga; parametr-variatsiya ustuni YO'Q | PP |
| Stanok format/o'lcham cheklovi (max/min list) | 2026-06-27 | TASDIQ-2146 §07 #19 | width/length/format ustuni YO'Q; ogohlantirish yo'q | PP |
| Parallel mashinalar — stanok guruhi | 2026-06-27 | TASDIQ-2146 §07 #21 | machine_group ustuni+avto-taqsimlash YO'Q | PP |
| Reja-fakt 4 kesim drill-down | 2026-06-27 | TASDIQ-2146 §07 #22 | production_facts 0 qator; reader yo'q | PP |
| Og'ish chegarasi → avto-signal | 2026-06-27 | TASDIQ-2146 §07 #25 | Threshold jadvali+notif YO'Q | PP |
| Buyurtmani partiyalarga bo'lish (split) | 2026-06-27 | TASDIQ-2146 §07 #32 | split metodi YO'Q; EP-PP-063 kolliziya | PP |
| Yarim tayyor (zagotovka) alohida zaxira | 2026-06-27 | TASDIQ-2146 §07 #37 | Oraliq zagotovka-zaxira modeli qurilmagan | PP |
| Xom-ashyo lot + FIFO avto-tavsiya | 2026-06-27 | TASDIQ-2146 §07 #38 | PP-reja FIFO bermaydi (WMS'da) | PP |
| ROP mavsumiy sarfdan davriy qayta hisob | 2026-06-27 | TASDIQ-2146 §07 #39 | reorder_point STATIK; cron yo'q | PP |
| Smenaga ishchi malaka tekshiruvi | 2026-06-27 | TASDIQ-2146 §07 #42 | Malaka↔operatsiya solishtiruv kodi yo'q | PP |
| Ishchi yo'qligida zaxira taklif | 2026-06-27 | TASDIQ-2146 §07 #43 | Avto-almashtiruvchi logika yo'q | PP |
| Qo'shimcha smena/sverxurochniy → oylik | 2026-06-27 | TASDIQ-2146 §07 #45 | Belgi+payroll-ulanish yo'q | PP |
| Stanok ish jadvali (har stanokka kalendar) | 2026-06-27 | TASDIQ-2146 §07 #54 | work_center_capacity 0 qator; bayram yozilmagan | PP |
| Stanok format cheklovi (EP-PP-050) | 2026-06-27 | TASDIQ-2146 §07 #56 | Format ustuni YO'Q; tekshiruv yo'q | PP |
| Parallel mashinalar guruh (EP-PP-052) | 2026-06-27 | TASDIQ-2146 §07 #58 | Guruh-ustun/balans logika yo'q | PP |
| Reja-fakt chegara+signal (EP-PP-056) | 2026-06-27 | TASDIQ-2146 §07 #62 | Chegara jadval+notif ulanmagan | PP |
| Ustuvorlikni kim o'zgartiradi (EP-PP-060) | 2026-06-27 | TASDIQ-2146 §07 #66 | Audit jurnal+RBAC-gate ulanmagan | PP |
| Preemption — direktor uzadi (EP-PP-061) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #67 | Kitob-policy; majburlovchi mexanizm yo'q — egasi-data | PP |
| Bottleneck avto-navbat+TOC (EP-PP-062) | 2026-06-27 | TASDIQ-2146 §07 #68 | TOC-navbat+signal topilmadi | PP |
| Buyurtma split kolliziya (EP-PP-063) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #69 | split-delivery ╳ ish-parchalash — egasi farqni hal qilishi kerak | PP |
| ROP mavsumiy qayta hisob (EP-PP-071) | 2026-06-27 | TASDIQ-2146 §07 #77 | Dinamik reorder qurilmagan | PP |
| Reja gorizonti master (EP-PP-067) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #73 | Master gorizont qiymati egasi tasdig'ini kutadi | PP |
| Qayta rejalash avto-kunlik (EP-PP-080) | 2026-06-27 | TASDIQ-2146 §07 #86 | dailyReplan cron topilmadi | PP |
| Reja qotirish frozen window (EP-PP-081) | 2026-06-27 | TASDIQ-2146 §07 #87 | Frozen-zona logikasi yo'q (faqat policy) | PP |
| Bekor qilish zanjiri (EP-PP-083) | 2026-06-27 | TASDIQ-2146 §07 #89 | cancel-handler topilmadi | PP |
| Buyurtma birlashtirish gang run (EP-PP-084) | 2026-06-27 | TASDIQ-2146 §07 #90 | gang* jadval YO'Q | PP |
| Algoritm turi 2-8 bo'lim avto (EP-PP-086) | 2026-06-27 | TASDIQ-2146 §07 #92 | Bo'lim-sonidan tasnif qurilmagan | PP |
| Brak → avto rework (EP-PP-093) | 2026-06-27 | TASDIQ-2146 §07 #99 | rework-order yaratuvchi logika yo'q | PP |
| AI razmer optimizatsiya (EP-PP-095) | 2026-06-27 | TASDIQ-2146 §07 #101 | technology.controller.ts:191-192 notImplemented stub | PP |
| Min tiraj → kichik+foyda ogohlantirish (EP-PP-096) | 2026-06-27 | TASDIQ-2146 §07 #102 | Logika yo'q; chegara qiymati egasi-data | PP |
| Buyurtma↔menejer avto-xabar (EP-PP-098) | 2026-06-27 | TASDIQ-2146 §07 #104 | responsible_manager_id 0/7 NULL; xabar yo'q | PP |
| 3 taymer dashboard (EP-PP-100) | 2026-06-27 | TASDIQ-2146 §07 #106 | Hozir Excelda; 3-taymer logika yo'q | PP |
| Kutish zonasi sabab bilan (EP-PP-101) | 2026-06-27 | TASDIQ-2146 §07 #107 | Sabab-kodli kutish zonasi qurilmagan | PP |
| Takror buyurtma katalogdan texkarta (EP-PP-104) | 2026-06-27 | TASDIQ-2146 §07 #110 | Eski karta qayta-ishlatish flow yo'q | PP |
| Bog'liq qismlar to'plam gate (EP-PP-105) | 2026-06-27 | TASDIQ-2146 §07 #111 | Ko'p-qismli to'plam-gate modeli yo'q | PP |
| AI o'tgan fakt vaqti ATP (EP-PP-106) | 2026-06-27 | TASDIQ-2146 §07 #112 | Tarix-asosli tavsiya yo'q | PP |
| Kod lug'ati master KT/PT/E/GL (EP-PP-109) 🔑 | 2026-06-27 | TASDIQ-2146 §07 #115 | Jadval yo'q; egasi KT/PT/E/GL ma'nosini aniqlashi kerak | PP |
| Oynakcha PVX+norma bosqich (EP-PP-112) | 2026-06-27 | TASDIQ-2146 §07 #118 | Strukturalangan model yo'q | PP |
| Pardoz turi+norma (EP-PP-113) | 2026-06-27 | TASDIQ-2146 §07 #119 | 3-pardoz-tur jadvali yo'q | PP |
| Qadoq turi 10+ norma (EP-PP-114) | 2026-06-27 | TASDIQ-2146 §07 #120 | Qadoq-tur master+norma yo'q | PP |
| Buyurtma multi-line (EP-PP-118) | 2026-06-27 | TASDIQ-2146 §07 #124 | 1 mahsulot=1 buyurtma; multi-line yo'q | PP |
| Marshrutga material-tayyorlash+yetkazish (EP-PP-119) | 2026-06-27 | TASDIQ-2146 §07 #125 | Tashqi bosqichlar yo'q (faqat sex) | PP |
| Maket holat sikli+muddat surish (EP-PP-125) | 2026-06-27 | TASDIQ-2146 §07 #131 | maket_approved faqat boolean; sikl yo'q | PP |
| Konstruktor bosqichi marshrutda (EP-PP-126) | 2026-06-27 | TASDIQ-2146 §07 #132 | Konstruktor-bosqich vaqt/holat yo'q | PP |
| Bo'sh vs sekin ajratish adolat (EP-PP-128) | 2026-06-27 | TASDIQ-2146 §07 #134 | idle-vs-slow ajratuvchi logika yo'q | PP |
| Reja Excelga eksport (EP-PP-129) | 2026-06-27 | TASDIQ-2146 §07 #135 | Eksport endpoint yo'q | PP |
| CRP ikki cheklov stanok×xodim (EP-PP-132) | 2026-06-27 | TASDIQ-2146 §07 #138 | Xodim-cheklov yo'q (optimistik) | PP |
| Egasi 1-ekranli dashboard (EP-PP-134) | 2026-06-27 | TASDIQ-2146 §07 #140 | Jamlangan PP-dashboard yo'q | PP |
| Og'ish>X% → norma avto-kalibrlash (EP-PP-135) | 2026-06-27 | TASDIQ-2146 §07 #141 | Kalibrlash tavsiya logika yo'q | PP |
| AI oylik sabab-Pareto (EP-PP-136) | 2026-06-27 | TASDIQ-2146 §07 #142 | reason_code jadval+Pareto qurilmagan | PP |
