## [B/TASDIQ] QC / Sifat (09) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 09.1 | Jiddiylik daraja (kritik/katta/kichik) har biriga AQL Ac/Re | 2026-06-27 | TASDIQ-2146 §09 #1 | Darajaga qarab qabul/rad | QC brak-baholash | severity↔Ac/Re bog'lash | Qisman | defect_catalog.severity+auto_reject(23q)+qc-aql.constants.ts bor; severity↔Ac/Re kod yo'q; qc-extended.controller.ts:117 >5% qattiq |
| 09.2 | Brak topilgan bosqich (kirim/jarayon/tayyor/reklamatsiya) majburiy | 2026-06-27 | TASDIQ-2146 §09 #2 | Javobgarlik aniq | QC checkpoint | stage majburiy maydon | Qisman | qc_checkpoints stage enum qc-new.controller.ts:29; 0 qator |
| 09.3 | Brak miqdori+partiya+brak% avtomatik | 2026-06-27 | TASDIQ-2146 §09 #3 | Faktdan avto-hisob | QC hisob | defectRate avto | Ha | qc-extended.controller.ts:113-115; qc_braks+cost_impact |
| 09.4 | Brak qarori Ombor+Finance'ga ulanadi | 2026-06-27 | TASDIQ-2146 §09 #4 | Qaror oqim-oxirigacha | QC→WMS/PP | 3-qaror event | Ha | submit-inspection.handler.ts:58-66→QcPassed/Rework/Failed; listener→WMS/PP |
| 09.5 | Brak→stanok/smena/operator avtomatik | 2026-06-27 | TASDIQ-2146 §09 #5 | Manba aniq | QC↔MES | avto tortish | Qisman | qc_braks+inspector_id bor; avto stanok/smena/operator kodi yo'q; 0 qator |
| 09.6 | Reklamatsiya ochish maydonlari to'liq | 2026-06-27 | TASDIQ-2146 §09 #6 | To'liq forma | QC reklamatsiya | majburiy maydon to'plami | Qisman | qc-reclamations.controller.ts+aggregate REAL; maydon 🔵 OCHIQ; 0 qator |
| 09.7 | Reklamatsiya status zanjiri | 2026-06-27 | TASDIQ-2146 §09 #7 | Har o'tishda sana+mas'ul | QC reklamatsiya | status enum | Qisman | qc-defects-extended.controller.ts:182 PATCH; nomlar 🔵 OCHIQ; 0 qator |
| 09.8 | Reklamatsiya SLA (1/3/10 kun)+eskalatsiya | 2026-06-27 | TASDIQ-2146 §09 #8 | Muddat o'tsa eskalatsiya | QC SLA | CRON timer | Yo'q | SLA/eskalatsiya kodi yo'q (grep=0); 🔵 OCHIQ, CRON qurilmagan |
| 09.9 | Kafolat oynasi (14/7 kun) muddatdan keyin avto-rad | 2026-06-27 | TASDIQ-2146 §09 #9 | Muddatli kafolat | QC reklamatsiya | konfig+tekshiruv | Yo'q | Kafolat-oyna jadval/kod yo'q; egasi muddat tasdiqlasin |
| 09.10 | Reklamatsiya natijasi Finance'ga avtomatik | 2026-06-27 | TASDIQ-2146 §09 #10 | Kredit-nota avto | QC→Finance | event ulanish | Qisman | reclamation.aggregate bor; QC→Finance avto ulanish 0 qator; jonli bo'sh |
| 09.11 | Tub sabab (8D/5-nega) kritik reklamatsiyaga majburiy | 2026-06-27 | TASDIQ-2146 §09 #11 | Sabab+chora+mas'ul | QC root-cause | majburiy gate | Qisman | qc_root_causes+CRUD qc-extended.controller.ts:162-189; majburiy gate yo'q; 0 qator |
| 09.12 | Tasdiq zanjiri (Dizayn→Texnolog→QC→IChiq) imzo+sana | 2026-06-27 | TASDIQ-2146 §09 #12 | Ketma-ket gate | QC approval | ketma-ket oqim | Qisman | qc_approvals+endpoint qc-defects-extended.controller.ts:143-167; to'liq oqim 0 qator |
| 09.13 | Mijoz maket tasdiqi (подписной лист) fayl+sana saqlanadi | 2026-06-27 | TASDIQ-2146 §09 #13 | Majburiy rozilik | QC/Dizayn | fayl-saqlash | Yo'q | QC'da maket-tasdiq jadval/kod yo'q (Dizaynda bo'lishi mumkin) |
| 09.14 | Rad etish sababi (klassifikator+izoh+kimga+muddat) | 2026-06-27 | TASDIQ-2146 §09 #14 | Strukturali rad | QC rad | sabab klassifikator | Qisman | qc-defects.controller.ts:248-260 reject; klassifikator 🔵 OCHIQ |
| 09.15 | Birinchi namuna (first article) tirajni to'xtatadi | 2026-06-27 | TASDIQ-2146 §09 #15 | Tasdiqsiz tiraj yo'q | QC↔MES | first-article gate | Yo'q | first_article/приладка gate kodi yo'q (grep=0) |
| 09.16 | Tasdiqlash huquqi (asosiy+o'rinbosar, lavozim) | 2026-06-27 | TASDIQ-2146 §09 #16 | Zaxira tasdiqlovchi | QC RBAC | asosiy+o'rinbosar model | Qisman | RolesGuard+@Roles QC_WRITE_ROLES qc-extended.controller.ts:30; o'rinbosar model yo'q |
| 09.17 | Namuna olish AQL jadval partiyadan avtomatik | 2026-06-27 | TASDIQ-2146 §09 #17 | GOST/ISO 2859 | QC namuna | avto lot→namuna | Ha | qc-aql.constants.ts+QcAqlService.plan(); GET aql-plan qc-new.controller.ts:249,279 |
| 09.18 | Namuna nuqtalari (bosh+o'rta+oxir/har N-rulon) | 2026-06-27 | TASDIQ-2146 §09 #18 | Nuqta qoidasi | QC namuna | konfig | Yo'q | Namuna-nuqta konfig yo'q; egasi N tasdiqlasin |
| 09.19 | Qabul/rad AQL Ac/Re (kritik 0/katta 1/kichik 3) | 2026-06-27 | TASDIQ-2146 §09 #19 | Darajaga Ac/Re | QC AQL | severity↔AQL | Qisman | qc-aql.constants.ts AcRe REAL; severity-daraja ulanish yo'q; 🔵 OCHIQ |
| 09.20 | Kuchaytirilgan/yengil nazorat (ISO 2859 rejim) | 2026-06-27 | TASDIQ-2146 §09 #20 | 3 rejim avto | QC AQL | rejim-o'tish mantiq | Yo'q | tightened/reduced cron/holat yo'q; 🔵 OCHIQ CRON |
| 09.21 | Arxiv namuna (etalon) 6 oy+joylashuv | 2026-06-27 | TASDIQ-2146 §09 #21 | Etalon saqlash | QC arxiv | jadval | Yo'q | Arxiv-namuna jadval/kod yo'q |
| 09.22 | Xom-ashyo kirim namunasi, o'tmasa qabul to'xtaydi | 2026-06-27 | TASDIQ-2146 §09 #22 | Kirim-blok | QC↔WMS | karantin gate | Qisman | qc_material_tests+supplier POST qc-defects-extended.controller.ts:107; kirim-blok 0 qator |
| 09.23 | Sertifikat maydonlari (№+GOST+o'lchov+QR…) | 2026-06-27 | TASDIQ-2146 §09 #23 | To'liq shablon | QC sertifikat | shablon maydon | Qisman | certificates+qc_certificate_templates(JSONB); GOST/QR 🔵 OCHIQ |
| 09.24 | Sertifikat raqami avto ketma-ket (SF-YYYY-NNNNN) | 2026-06-27 | TASDIQ-2146 §09 #24 | Takrorlanmaslik | QC sertifikat | sequence | Ha | qc-certificate-pdf.service.ts:62 nextval(qc_certificate_seq); sekvens jonli |
| 09.25 | Sertifikatda real o'lchov (norma+haqiqiy+o'tdi) | 2026-06-27 | TASDIQ-2146 §09 #25 | Har ko'rsatkich | QC sertifikat | shablon↔natija | Qisman | qc_lab_tests(min/max/value)+qc_parameters; PDF chiqarish 0 qator; 🔵 OCHIQ |
| 09.26 | Sertifikat ko'p-tilli (uz/ru/en)+logotip | 2026-06-27 | TASDIQ-2146 §09 #26 | Eksport | QC sertifikat | EN shablon | Qisman | name_uz+name_ru bor, EN ustun YO'Q; 🔵 OCHIQ |
| 09.27 | Sertifikat imzo (laborant+boshliq)+QR | 2026-06-27 | TASDIQ-2146 §09 #27 | Ikki imzo+QR | QC sertifikat | imzo+QR gen | Qisman | certificates.issued_by bor; ikki-imzo+QR isbotlanmadi; 🔵 OCHIQ |
| 09.28 | Sertifikat/QC tasdiqisiz chiqim blok (boshliq istisno) | 2026-06-27 | TASDIQ-2146 §09 #28 | Passsiz jo'natma yo'q | QC→WMS/SD | dispatch gate+override | Qisman | qc-passed.listener.ts pass'da FG receipt; dispatch-blok+override jurnal yo'q |
| 09.29 | Qaytgan mahsulot qabul maydonlari | 2026-06-27 | TASDIQ-2146 §09 #29 | To'liq forma | QC qaytish | forma/jadval | Yo'q | QC'da qaytgan-tovar forma/jadval yo'q (POS/WMS tomon); 🔵 OCHIQ |
| 09.30 | Qaytgan qayta tekshirish→sort qaror | 2026-06-27 | TASDIQ-2146 §09 #30 | Majburiy qayta tekshir | QC qaytish | maxsus oqim | Qisman | submit-inspection 3-qaror+sort_grade+rework loop; qaytgan uchun maxsus oqim yo'q |
| 09.31 | Qaytgan/karantin alohida zona QC gacha | 2026-06-27 | TASDIQ-2146 §09 #31 | Sotishga chiqmaydi | QC↔WMS | karantin status oqim | Qisman | WMS QUARANTINE/DEFECTIVE; listener-darajada, alohida jadval yo'q; 0 qator |
| 09.32 | Qaytarish sabab klassifikator+ayb tomoni | 2026-06-27 | TASDIQ-2146 §09 #32 | Adolatli xarajat | QC qaytish | klassifikator+ayb | Yo'q | Sabab klassifikator+ayb-tomoni jadval/kod yo'q |
| 09.33 | Qaytarish→Finance kredit-nota avto (miqdor×narx) | 2026-06-27 | TASDIQ-2146 §09 #33 | Avto kredit-nota | QC→Finance | event ulanish | Qisman | Finance kredit-nota+grade-pricing bor; QC→Finance avto ulanish 0 qator |
| 09.34 | Karantin/blok status (tayyor→karantin→QC→yaroqli/brak/2-sort) | 2026-06-27 | TASDIQ-2146 §09 #34 | Har partiya karantin | QC→WMS | listener oqim | Ha | submit-inspection.handler 3-qaror+sort_grade; qc-passed.listener warehouse_stock UPSERT REAL |
| 09.35 | Sort darajalari (1/2/3/brak)+narx koeffitsienti | 2026-06-27 | TASDIQ-2146 §09 #35 | Daromad oshadi | QC sort/narx | koeffitsient qiymat | egasi-data | grade-pricing.service.ts+qc_grade_price_coefficients(4q jonli); struktura TAYYOR, qiymat egasi-data |
| 09.36 | O'lchov asboblari kalibrovka (sana+muddat+ogoh) | 2026-06-27 | TASDIQ-2146 §09 #36 | Muddat o'tdi→ishlatma | QC asbob | jadval+CRON | Yo'q | qc_instrument/calibration jadval YO'Q (grep=0); 🔵 OCHIQ CRON |
| 09.37 | Laborant nazorat jurnali (kim+sana+asbob+smena) avto | 2026-06-27 | TASDIQ-2146 §09 #37 | Avto audit | QC audit | asbob+smena biriktir | Qisman | AuditInterceptor+qc_lab_tests.tested_by; asbob+smena avto yo'q (asbob jadvali yo'q) |
| 09.38 | Retest (chegara zonasi 2 namuna, o'rtacha hal) | 2026-06-27 | TASDIQ-2146 §09 #38 | Chegara hal | QC namuna | retest mantiq | Yo'q | retest kodi yo'q (grep=0); 🔵 OCHIQ |
| 09.39 | Normalar texkartaga bir marta, har buyurtma tortadi | 2026-06-27 | TASDIQ-2146 §09 #39 | Bir marta yozish | QC norma | texkarta↔norma FK | Qisman | qc_standards+qc_parameters+CRUD qc-extended.controller.ts:46-87; texkarta FK isbotlanmadi; 0 qator |
| 09.40 | Sifat KPI paneli (brak%/reklamatsiya/FTQ/qaytarish%) | 2026-06-27 | TASDIQ-2146 §09 #40 | Oylik sifat ko'rsatkich | QC dashboard | dashboard endpoint | Ha | qc-new.controller.ts:91 dashboard; qc-defects-extended dashboard/stats/flow; qc-dpmo DPMO |
| 09.41 | Yetkazuvchi sifat reytingi (40/30/20/10, 6-oy) | 2026-06-27 | TASDIQ-2146 §09 #41 | Har yetkazuvchi reyting | QC supplier | sliding-window formula | Qisman | qc-new.repository.ts:478 getSupplierRatings REAL; 40/30/20/10+6-oy formula EMAS (status-avg) |
| 09.42 | Foto/dalil (brak/reklamatsiya) kamida 1 majburiy | 2026-06-27 | TASDIQ-2146 §09 #42 | Dalil majburiy | QC dalil | majburiy gate | Qisman | POS Checklist+Foto+Storage bor; QC majburiy gate 0 qator |
| 09.43 | Oziq-ovqat xavfsizlik tekshiruvi+maxsus sertifikat | 2026-06-27 | TASDIQ-2146 §09 #43 | Alohida tekshiruv | QC oziq-ovqat | gate | Qisman | defect_catalog/material tur bor; oziq-ovqat maxsus gate isbotlanmadi |
| 09.44 | Partiya traceability (xom-ashyo→stanok→smena→tayyor→mijoz) | 2026-06-27 | TASDIQ-2146 §09 #44 | Ildizgacha kuzatish | QC traceability | to'liq JOIN-zanjir | Qisman | qc-passed.listener batchNumber=QC-{id}; wms_supplier_traceability(0q); to'liq JOIN yo'q |
| 09.45 | QC override (boshliq/director+sabab+jurnal+mijoz ogoh) | 2026-06-27 | TASDIQ-2146 §09 #45 | Nazoratli istisno | QC override | qc:override+sabab | Qisman | RolesGuard+AuditInterceptor; qc:override permission+sabab+ogoh kodi yo'q |
| 09.46 | 'Брак сони' har operatsiya yopilishida majburiy | 2026-06-27 | TASDIQ-2146 §09 #46 | Excel→ERP | QC↔MES | 'tamom' gate | Qisman | qc_braks+POST qc-defects-extended.controller.ts:77; MES 'tamom' gate 0 qator |
| 09.47 | Plan vs Fakt brak% chegara (≤2%) avto-anomaliya | 2026-06-27 | TASDIQ-2146 §09 #47 | Oshsa anomaliya | QC anomaliya | norma-chegara+cron | Qisman | qc-extended.controller.ts:115 defectRate >5% fail; operatsiya norma-chegara yo'q; 🔵 OCHIQ |
| 09.48 | Brakni operatsiya turiga ajratish (Резка/Печать…) | 2026-06-27 | TASDIQ-2146 §09 #48 | Har op alohida hisob | QC brak-kesim | op-spetsifik kesim | Qisman | qc_braks+defect-detector+check_point; defect_catalog 23 universal, op-spetsifik 0 qator |
| 09.49 | Brakni smena+operator/помошник kesimida (reytingga) | 2026-06-27 | TASDIQ-2146 §09 #49 | GSD reytingga | QC↔HR | avto ulanish | Qisman | qc_inspections.inspector_id+shift_handovers; operator→GSD ulanish yo'q; 0 qator |
| 09.50 | Приладка (sozlash) brakini alohida hisoblash | 2026-06-27 | TASDIQ-2146 §09 #50 | Alohida turkum | QC brak | приладка turkum | Yo'q | приладка/setup-waste turkum yo'q (grep=0); spoilage.service spetsifik emas |
| 09.51 | Downtime→keyingi приладка brakiga bog'lanadi | 2026-06-27 | TASDIQ-2146 §09 #51 | Sabab-zanjir | QC↔MES | downtime↔brak | Yo'q | Downtime↔brak sabab-zanjir kodi yo'q; bog'lanish 0 |
| 09.52 | Brak limitidan oshsa avto-to'xtatish+QC qarori | 2026-06-27 | TASDIQ-2146 §09 #52 | Avto to'xtatish | QC↔MES | WebSocket signal | Yo'q | Brak-limit→MES to'xtatish kodi yo'q; jonli mexanizm yo'q |
| 09.53 | Operatsiyalararo brak ajratish (kirim vs shu-bosqich) | 2026-06-27 | TASDIQ-2146 §09 #53 | Ayb aniq | QC brak | ajratish maydon | Yo'q | Kirim-braki vs shu-bosqich maydon/kod yo'q; 🔵 OCHIQ |
| 09.54 | Топлайнер vs Тестлайнер normasi qog'oz turiga | 2026-06-27 | TASDIQ-2146 §09 #54 | Turga tolerans | QC norma | raw_materials avto | Yo'q | Qog'oz-turi→QC-norma avto bog'lanish kodi yo'q; qc_parameters tolerans-differ 0 |
| 09.55 | Oziq-ovqatga makulatura→QC blok+ogoh | 2026-06-27 | TASDIQ-2146 §09 #55 | Xavfsizlik kafolati | QC↔texkarta | material-gate | Yo'q | Makulatura↔oziq-ovqat blok gate kodi yo'q; jonli mexanizm yo'q |
| 09.56 | Грамаж (g/m²) normani kirimda o'lchov bilan (170-350/70-90) | 2026-06-27 | TASDIQ-2146 §09 #56 | Kirim QC o'lchov | QC kirim | seed+kirim-blok | Qisman | qc_parameters+qc_material_tests infra; грамаж diapazon seed yo'q(0q); raqamlar egasi-data |
| 09.57 | Микро turi (E/B/C, слой)→ECT/BCT normaga | 2026-06-27 | TASDIQ-2146 §09 #57 | Gofra mustahkamlik | QC norma | seed+bog'lanish | Yo'q | Gofra→ECT/BCT bog'lanish kodi/seed yo'q; qc_parameters bo'sh; egasi-data |
| 09.58 | Местный/импорт qog'oz almashish xatosini QC ushlaydi | 2026-06-27 | TASDIQ-2146 §09 #58 | Op boshida blok | QC↔texkarta | material-kod solishtir | Yo'q | Texkarta-material↔chiqarilgan kod solishtir gate kodi yo'q |
| 09.59 | QC normasi mahsulot oilasiga (KT/PT/E) avto | 2026-06-27 | TASDIQ-2146 §09 #59 | Oilaga avto | QC norma | prefiks→norma | Yo'q | KT/PT/E→QC-norma avto tanlash kodi yo'q; doc CREATE |
| 09.60 | Ламинация/лак alohida nuqson checklist | 2026-06-27 | TASDIQ-2146 §09 #60 | Op-spetsifik checklist | QC checklist | seed | Qisman | qc_checkpoints+check_point+defect-detector struktura; лак seed yo'q(0q) |
| 09.61 | Окошка/оынакча yopishish nazorati | 2026-06-27 | TASDIQ-2146 §09 #61 | Op-spetsifik nazorat | QC checklist | seed | Qisman | qc_checkpoints/check_point struktura; окошка seed 0 qator |
| 09.62 | Кашировка ko'chish/qiyshiqlik+registratsiya tolerans | 2026-06-27 | TASDIQ-2146 §09 #62 | Registratsiya tolerans | QC checklist | seed | Qisman | qc_checkpoints+qc_parameters struktura; кашировка seed yo'q(0q) |
| 09.63 | Тиснение/Конгрев/фольга checklist | 2026-06-27 | TASDIQ-2146 §09 #63 | Premium pardoz | QC checklist | seed | Qisman | qc_checkpoints struktura; premium-pardoz seed yo'q(0q) |
| 09.64 | Высечка/Тигель/Беговка o'lcham+begovka tolerans | 2026-06-27 | TASDIQ-2146 §09 #64 | Kesish tolerans | QC norma | op-spetsifik seed | Qisman | qc_parameters geometrik+defect_catalog 'Noto'g'ri o'lcham'(±2mm); высечка seed yo'q |
| 09.65 | Литсо/оборот (A/B) registratsiya/moslik norma | 2026-06-27 | TASDIQ-2146 §09 #65 | Ikki tomon moslik | QC bosma | A/B norma seed | Qisman | delta-e.service+vision-qc bor; A/B-tomon spetsifik norma seed yo'q |
| 09.66 | Etiketka/самоклей (E) alohida QC norma | 2026-06-27 | TASDIQ-2146 §09 #66 | Alohida norma | QC norma | seed | Yo'q | Etiketka-spetsifik norma kodi/seed yo'q; qc_parameters bo'sh; egasi-data |
| 09.67 | Подписной лист QC etaloniga aylanadi (final solishtir) | 2026-06-27 | TASDIQ-2146 §09 #67 | Obyektiv solishtir | QC etalon | fayl→etalon | Qisman | vision-qc etalon-rasm deltaE; подписной лист fayl→QC etalon jadval yo'q (Dizaynda?) |
| 09.68 | Pre-production checklist to'lmasa IChiq ochilmaydi | 2026-06-27 | TASDIQ-2146 §09 #68 | Eng arzon nazorat | QC↔MES | checklist gate | Yo'q | qc_checkpoints incoming struktura bor; MES-ochilish gate 0; doc APPROVE, qurilmagan |
| 09.69 | Qolip reestri+holat+'qaysi qolip qaysi brak' | 2026-06-27 | TASDIQ-2146 §09 #69 | Ildiz sabab | QC↔Dizayn | qolip↔brak jadval | Yo'q | Qolip-reestr/holat jadval QC'da yo'q; qolip↔brak 0 |
| 09.70 | Brak sabab-toifasi 6 manba o'z bo'limiga ulanadi | 2026-06-27 | TASDIQ-2146 §09 #70 | Har toifa→bo'lim | QC root-cause | seed+ulanish | Qisman | qc_root_causes+CRUD(category) qc-extended.controller.ts:162-189 REAL; 6 toifa seed+ulanish 0 |
| 09.71 | Конструктор tasdig'i QC zanjiriga | 2026-06-27 | TASDIQ-2146 §09 #71 | Struktura tasdiq | QC approval | конструктор rol | Qisman | qc_approvals+endpoint struktura; конструктор-spetsifik oqim 0 |
| 09.72 | 5-Dept ichida QC roli mustaqil ajratilgan | 2026-06-27 | TASDIQ-2146 §09 #72 | Mustaqil tasdiq | QC RBAC/org | org-struktura chegara | Qisman | QC_MANAGER/qc_inspector+WRITE/FLOOR ajratilgan; org 5-Dept mustaqillik isbotlanmadi (org bo'sh) |
| 09.73 | 'Кўп учрайдиган хатолар' defekt-master'iga import | 2026-06-27 | TASDIQ-2146 §09 #73 | Real amaliy | QC defekt-master | bo'lim-spetsifik import | Qisman | defect_catalog 23 qator seed REAL; bo'lim-spetsifik to'liq import emas (faqat universal 23) |
| 09.74 | Har QC qaroriga raqamli imzo (tekshirdi+tasdiqladi+sana) | 2026-06-27 | TASDIQ-2146 §09 #74 | Javobgarlik yozma | QC audit | ikki-bosqich imzo | Qisman | AuditInterceptor+inspector_id; ikki-bosqich (tekshir+tasdiq) alohida struktura yo'q |
| 09.75 | Brak/qoldiq qog'oz omborda alohida turkum | 2026-06-27 | TASDIQ-2146 §09 #75 | Material balansi | QC↔WMS | avto kirim oqim | Qisman | qc_braks.cost_impact+WMS DEFECTIVE+makulatura event; avto alohida-turkum kirim isbotlanmadi |
| 09.76 | Тошдан (tashqi ish) kelgan mahsulot kirim QC | 2026-06-27 | TASDIQ-2146 §09 #76 | Supplier kabi tekshir | QC kirim | тош-spetsifik oqim | Qisman | qc_supplier_quality+POST kirim-QC; тош-spetsifik alohida emas (umumiy supplier); 0 qator |
| 09.77 | Material lot/rulon↔buyurtma↔brak/reklamatsiya to'liq | 2026-06-27 | TASDIQ-2146 §09 #77 | Ommaviy reklamatsiya oldini | QC traceability | to'liq JOIN | Yo'q | batchNumber iz bor; wms_supplier_traceability(0q); to'liq JOIN-bog'lanish kodi yo'q |
| 09.78 | Razmer revision→QC norma+qolip yangi versiyaga avto | 2026-06-27 | TASDIQ-2146 §09 #78 | Versiya avto | QC norma | revision-trigger | Yo'q | qc_standards versiya struktura bor; revision-trigger yo'q |
| 09.79 | Mahsulot toifasiga tolerans (dori 0%/oziq past…) | 2026-06-27 | TASDIQ-2146 §09 #79 | Risk-asosli | QC tolerans | tolerans qiymat | egasi-data | qc_parameters/qc_standards+auto_reject struktura; toifa tolerans QIYMAT seed yo'q — egasi-data |
| 09.80 | '100% tayyor' faqat final QC 'o'tdi' bilan | 2026-06-27 | TASDIQ-2146 §09 #80 | Yolg'on tayyorlik yo'q | QC↔MES | sinxron gate | Qisman | qc-passed.listener passed→FG+rework; tayyorlik%↔final-QC sinxron gate isbotlanmadi |
| 09.81 | QC rework→avto reja ishi+material so'rovi | 2026-06-27 | TASDIQ-2146 §09 #81 | Yo'qolmaydi | QC→PP | rework event | Ha | qc-rework.listener.ts QcRework→production_orders status='rework'(idempotent) REAL wired |
| 09.82 | QC skip avto aniqlanadi+kim sababchi | 2026-06-27 | TASDIQ-2146 §09 #82 | Xavfli teshik ko'rinadi | QC↔MES | skip-detect+sababchi | Qisman | mes-completed.listener QC holat tekshiradi qc.module.ts:77; skip belgilash+sababchi isbotlanmadi |
| 09.83 | Smena topshirish sifat yozuvi (ochiq brak+mashina) | 2026-06-27 | TASDIQ-2146 §09 #83 | Uzilish yo'q | QC↔MES | ochiq-brak agregatsiya | Qisman | shift_handovers+quality_issues+mes_shift_handovers VIEW; ochiq-brak agregatsiya 0 qator |
| 09.84 | Sifat (брак%) operator oyligiga ulanadi | 2026-06-27 | TASDIQ-2146 §09 #84 | Sifat rag'batlanadi | QC↔HR/Payroll | брак%→oylik event | Qisman | karta-GSD vizyon+razryad-koeff; брак%→oylik avto event isbotlanmadi(0q) |
| 09.85 | Internal vs external brak ajratish (QC samaradorligi) | 2026-06-27 | TASDIQ-2146 §09 #85 | Nisbat=QC samara | QC metrika | ajratish+nisbat | Yo'q | Internal/external ajratish maydon/kod yo'q; qc_braks/qc_reclamations alohida, nisbat yo'q |
| 09.86 | Sifat chegirma/kompensatsiya COQ'ga | 2026-06-27 | TASDIQ-2146 §09 #86 | To'liq yo'qotish | QC COQ | chegirma→COQ | Qisman | qc_braks.cost_impact+getBrakCostImpact SUM (repository.ts:39,94); chegirma alohida emas |
| 09.87 | Buyurtma yopilishida avto sifat xulosasi | 2026-06-27 | TASDIQ-2146 §09 #87 | Yakuniy tahlil | QC dashboard | yopilish event | Qisman | dashboard/flow+braks/stats(controller:61,136) agregat; yopilish-event avto-xulosa isbotlanmadi |
| 09.88 | Sifat kunlik/haftalik xulosa egaga Telegram | 2026-06-27 | TASDIQ-2146 §09 #88 | Avto digest | QC notif | CRON-digest | Qisman | qc.bot.ts+qc-failed-notification.listener; kunlik/haftalik CRON-digest isbotlanmadi |
| 09.89 | AI brak-risk oldindan bashorat (material+operator+mashina+смена) | 2026-06-27 | TASDIQ-2146 §09 #89 | Risk-belgi | QC AI | proaktiv bashorat | Qisman | vision-qc+quality-agent AI infra REAL; naqsh-asosli proaktiv risk bashorat isbotlanmadi |
| 09.90 | Takroriy defekt chegaradan oshsa avto-CAPA | 2026-06-27 | TASDIQ-2146 §09 #90 | Совершенствование Kanban | QC CAPA | cron-trigger→Kanban | Qisman | qc_root_causes+CRUD REAL; takrorlanish-chegara→CAPA cron-trigger isbotlanmadi |
| 09.91 | Davriy ichki sifat auditi (QC o'zini tekshir) | 2026-06-27 | TASDIQ-2146 §09 #91 | Jadval+checklist+topilma | QC audit | qc_internal_audits+cron | Qisman | vision-qc har-2-soat AI-audit+DPMO/SPC; formal qc_internal_audits jadval/cron yo'q |
| 09.92 | A-System/Excel brak tarixini ERP'ga import | 2026-06-27 | TASDIQ-2146 §09 #92 | Trend uzilmaydi | QC import | import skript | Yo'q | A-System/Excel import skript/migration yo'q; egasi-data+import ishi |
| 09.93 | Defekt lug'ati ko'p-tilli (UZ lotin+kirill+RU) | 2026-06-27 | TASDIQ-2146 §09 #93 | Ishchi tushunadi | QC defekt-master | kirill ustun | Qisman | defect_catalog name_uz+name_ru(23q jonli); kirill(UZ-cyr) alohida ustun yo'q; doc 3-til |
| 09.94 | Rang nomuvofiqligi etalon+tolerans har bosma op | 2026-06-27 | TASDIQ-2146 §09 #94 | Eng ko'p reklamatsiya | QC rang | ΔE etalon qiyos | Ha | delta-e.service.ts(CIELab ΔE)+vision-qc verdictFromDeltaE(PASS/REWORK/SCRAP) REAL |
| 09.95 | Mijoz qabul/rad tarixi mahsulot+mijoz kesimida | 2026-06-27 | TASDIQ-2146 §09 #95 | Risk oldindan | QC analitika | tahliliy kesim | Yo'q | Mijoz+mahsulot kesim qabul/rad tahliliy-tarix jadval/kod yo'q; doc CREATE |
| 09.96 | Brak sababiga 'режа/техкарта xatosi' qo'shiladi | 2026-06-27 | TASDIQ-2146 §09 #96 | Adolatli, rejaga ulanadi | QC root-cause | seed+ulanish | Qisman | qc_root_causes.category struktura; 'режа/техкарта' toifa seed+rejaga ulanish 0 qator |
| 09.97 | Tashqi/qonuniy sertifikat amal muddati kuzatiladi | 2026-06-27 | TASDIQ-2146 §09 #97 | Tugashdan oldin ogoh | QC sertifikat | muddat→blok CRON | Qisman | certificates.expiry_date+validity_days+lms certificate-expired; QC muddat→blok+ogoh CRON isbotlanmadi |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Reklamatsiya SLA (1/3/10 kun)+eskalatsiya | 2026-06-27 | TASDIQ-2146 §09 #8 | SLA timer/eskalatsiya CRON qurilmagan (grep=0) | QC |
| Kafolat oynasi (14/7 kun) muddatdan keyin avto-rad | 2026-06-27 | TASDIQ-2146 §09 #9 | Kafolat-oyna jadval/kod yo'q; egasi muddat tasdiqlasin | QC |
| Mijoz maket tasdiqi (подписной лист) fayl saqlash | 2026-06-27 | TASDIQ-2146 §09 #13 | QC'da maket-tasdiq jadval/kod yo'q (Dizaynda?) | QC/Dizayn |
| Birinchi namuna (first article) tirajni to'xtatadi | 2026-06-27 | TASDIQ-2146 §09 #15 | first-article gate kodi yo'q (grep=0) | QC/MES |
| Namuna nuqtalari (bosh+o'rta+oxir/har N-rulon) | 2026-06-27 | TASDIQ-2146 §09 #18 | Konfig yo'q; egasi N tasdiqlasin | QC |
| Kuchaytirilgan/yengil nazorat (ISO 2859 rejim) | 2026-06-27 | TASDIQ-2146 §09 #20 | Rejim-o'tish cron/holat yo'q | QC |
| Arxiv namuna (etalon) 6 oy+joylashuv | 2026-06-27 | TASDIQ-2146 §09 #21 | Arxiv-namuna jadval/kod yo'q | QC |
| Qaytgan mahsulot qabul maydonlari | 2026-06-27 | TASDIQ-2146 §09 #29 | QC'da qaytish forma/jadval yo'q (POS/WMS tomon) | QC |
| Qaytarish sabab klassifikator+ayb tomoni | 2026-06-27 | TASDIQ-2146 §09 #32 | Klassifikator+ayb-tomoni jadval/kod yo'q | QC |
| O'lchov asboblari kalibrovka (sana+muddat+ogoh) | 2026-06-27 | TASDIQ-2146 §09 #36 | qc_instrument/calibration jadval yo'q (grep=0), CRON | QC |
| Retest (chegara zonasi 2 namuna, o'rtacha) | 2026-06-27 | TASDIQ-2146 §09 #38 | retest kodi yo'q (grep=0) | QC |
| Приладка (sozlash) brakini alohida hisoblash | 2026-06-27 | TASDIQ-2146 §09 #50 | приладка/setup-waste turkum yo'q (grep=0) | QC |
| Downtime→keyingi приладка brakiga bog'lanadi | 2026-06-27 | TASDIQ-2146 §09 #51 | Downtime↔brak sabab-zanjir kodi yo'q | QC/MES |
| Brak limitidan oshsa avto-to'xtatish+QC qarori | 2026-06-27 | TASDIQ-2146 §09 #52 | Brak-limit→MES to'xtatish (WebSocket) kodi yo'q | QC/MES |
| Operatsiyalararo brak ajratish (kirim vs shu-bosqich) | 2026-06-27 | TASDIQ-2146 §09 #53 | Ajratish maydon/kod yo'q | QC |
| Топлайнер vs Тестлайнер normasi qog'oz turiga | 2026-06-27 | TASDIQ-2146 §09 #54 | Qog'oz-turi→norma avto bog'lanish kodi yo'q | QC |
| Oziq-ovqatga makulatura→QC blok+ogoh | 2026-06-27 | TASDIQ-2146 §09 #55 | Makulatura↔oziq-ovqat blok gate kodi yo'q | QC |
| Микро turi (E/B/C)→ECT/BCT normaga | 2026-06-27 | TASDIQ-2146 §09 #57 | Gofra→ECT/BCT bog'lanish/seed yo'q; egasi-data | QC |
| Местный/импорт qog'oz almashish xatosini QC ushlaydi | 2026-06-27 | TASDIQ-2146 §09 #58 | Material-kod solishtir gate kodi yo'q | QC |
| QC normasi mahsulot oilasiga (KT/PT/E) avto | 2026-06-27 | TASDIQ-2146 §09 #59 | Prefiks→norma avto tanlash kodi yo'q | QC |
| Etiketka/самоклей (E) alohida QC norma | 2026-06-27 | TASDIQ-2146 §09 #66 | Spetsifik norma kodi/seed yo'q; egasi-data | QC |
| Pre-production checklist to'lmasa IChiq ochilmaydi | 2026-06-27 | TASDIQ-2146 §09 #68 | MES-ochilish gate 0; struktura bor, ulanish yo'q | QC/MES |
| Qolip reestri+holat+'qaysi qolip qaysi brak' | 2026-06-27 | TASDIQ-2146 §09 #69 | Qolip-reestr/holat jadval QC'da yo'q | QC/Dizayn |
| Material lot↔buyurtma↔brak/reklamatsiya to'liq | 2026-06-27 | TASDIQ-2146 §09 #77 | To'liq JOIN-bog'lanish kodi yo'q; traceability 0 qator | QC |
| Razmer revision→QC norma+qolip yangi versiyaga | 2026-06-27 | TASDIQ-2146 §09 #78 | revision-trigger yo'q | QC |
| Internal vs external brak ajratish (QC samaradorligi) | 2026-06-27 | TASDIQ-2146 §09 #85 | Ajratish maydon/kod + nisbat yo'q | QC |
| A-System/Excel brak tarixini ERP'ga import | 2026-06-27 | TASDIQ-2146 §09 #92 | Import skript/migration yo'q; egasi-data+import ishi | QC |
| Mijoz qabul/rad tarixi mahsulot+mijoz kesimida | 2026-06-27 | TASDIQ-2146 §09 #95 | Tahliliy kesim jadval/kod yo'q; doc CREATE | QC |
| Sort darajalari narx koeffitsienti QIYMATI | 2026-06-27 | TASDIQ-2146 §09 #35 | Struktura TAYYOR (4q); koeffitsient qiymati egasi-data | QC |
| Mahsulot toifasiga tolerans QIYMATI (dori 0%…) | 2026-06-27 | TASDIQ-2146 §09 #79 | Struktura bor; toifa tolerans qiymat seed yo'q — egasi-data | QC |
