## [B/TASDIQ] POS / Kassa-monitor (19) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | POS = ombor planshet ilovasi, kassa emas | 2026-06-27 | TASDIQ-2146 §19 #1 | Pul Finance'da, FG shu tizimda | POS asosiy chegara | 6 harakat turi + material-markaz FE | Ha | pos_movement_types 6 tur; README+44 FE sahifa |
| 2 | Planshetga ERP login (SSO/JWT), har harakat shaxsga | 2026-06-27 | TASDIQ-2146 §19 #2 | Audit uchun | Auth/audit | pos-auth + audit_log | Ha | pos-auth.controller/service; pos_audit_log 41 qator |
| 3 | Faqat o'z bo'lim ombori ko'rinadi (HR sozlaydi) | 2026-06-27 | TASDIQ-2146 §19 #3 | 30+ bo'lim ajratish | Ombor ko'rinish gate | department_warehouse_map mapping | egasi-data | department_warehouse_map=0 qator, data kutadi |
| 4 | Kirim 5-bosqichli karantin oqimi | 2026-06-27 | TASDIQ-2146 §19 #4 | DRAFT→KARANTIN→QC→MENEJER→AI_GL | Kirim workflow | quarantine STATUS_FLOW | Ha | quarantine-workflow.service.ts; QC-HOLD live |
| 5 | Chiqim sababi majburiy (harakat turi) | 2026-06-27 | TASDIQ-2146 §19 #5 | INTERNAL_RETURN sabab shart | Chiqim DTO | 6 tur + return_reason | Ha | pos_movement_types; movement.dto.ts |
| 6 | Barcode/QR skanerlash (skaner+AI kamera) | 2026-06-27 | TASDIQ-2146 §19 #6 | Material identifikatsiya | Skaner | PosBarcodeScanner + map | Ha | pos-barcode.service; pos_barcode_map=0 (data kutadi) |
| 7 | Kirimda avto label chop (EAN-13+Code-128) | 2026-06-27 | TASDIQ-2146 §19 #7 | EXTERNAL_IN tasdiqda label+reprint | Label chop | auto-barcode generate | Ha | auto-barcode.service.ts Code-128 + print_queue |
| 8 | Tasdiq bir/ikki bosqich (tur bo'yicha) | 2026-06-27 | TASDIQ-2146 §19 #8 | EXTERNAL_IN=5, OUT=menejer+moliya+AI | Tasdiq oqimi | confirmations jadval | Ha | pos_movement_confirmations 3 qator; status.service |
| 9 | Tasdiqni ombor menejer, OUT'da +moliya | 2026-06-27 | TASDIQ-2146 §19 #9 | Org-karta vertikali | Approve rollari | FINANCE approve yo'li | Ha | pos-movement-status.service.ts:199 |
| 10 | Balans-guard: aktiv blok / iste'mol ogoh | 2026-06-27 | TASDIQ-2146 §19 #10 | Manfiy qoldiq taqiqi | Guard | balance-guard ulash | Ha | pos-balance-guard.service; movement.service.ts:97 |
| 11 | Minimal qoldiq avto-signal | 2026-06-27 | TASDIQ-2146 §19 #11 | AI ta'minot ogohlantirishi | Low-stock | avto purchase-req | Qisman | pos-low-stock.job faqat ogoh, PR yaratmaydi |
| 12 | Har harakat avto GL-yozuv (real-time) | 2026-06-27 | TASDIQ-2146 §19 #12 | AI Debit/Credit | GL koprik | auto-gl-posting | Ha | auto-gl-posting.service; status.service:203-222; log=2 |
| 13 | Tur bo'yicha AI Debit/Credit, 1C yo'q | 2026-06-27 | TASDIQ-2146 §19 #13 | Ichki hisobot | GL mapping | GL_PAIRS BHMS kodlar | Ha | auto-gl-posting.service GL_PAIRS; accounts moslangan |
| 14 | Kirimda FIFO partiya narxi (valyuta) | 2026-06-27 | TASDIQ-2146 §19 #14 | Baholash | FIFO | fifo + currency ustunlar | Ha | pos-fifo.service; currency/exchange_rate/total_base |
| 15 | Inventar skaner, avto farq | 2026-06-27 | TASDIQ-2146 §19 #15 | Tunda/dam kuni sanash | Inventar | count servis+jadval | Ha | pos-inventory-count.service; counts=6 qator; FE |
| 16 | Inventar farq avto GL + moliya tasdiq | 2026-06-27 | TASDIQ-2146 §19 #16 | Zarar/ortiqcha | Inventar GL | onInventoryCompleted handler | Ha | secondary-events.handler → finance_head telegram |
| 17 | Inventar davriylik (sikl-sanash) | 2026-06-27 | TASDIQ-2146 §19 #17 | Har kun bir guruh | Inventar reja | davriylik qiymati | egasi-data | pos_inventory_plans bor; EP-POS-017 OCHIQ |
| 18 | Ichki ko'chirish INTERNAL_TRANSFER | 2026-06-27 | TASDIQ-2146 §19 #18 | Bir tip tezkor, boshqa menejer | Transfer | TRANSFER turi | Ha | INTERNAL_TRANSFER live; from/to_warehouse_id |
| 19 | AI-taklif (rejalashtirish, GL) | 2026-06-27 | TASDIQ-2146 §19 #19 | Aqlli yordamchi | AI engine | zakaz-tavsiya engine | Qisman | GL real (qoidaviy); AI-tavsiya jonli emas |
| 20 | AI anomaliya aniqlash → boshliqqa signal | 2026-06-27 | TASDIQ-2146 §19 #20 | Proaktiv shubha | Anomaliya | detektor servis | Yo'q | POS'da detektor yo'q; EP-POS-020 OCHIQ |
| 21 | Offline rejim (PWA) + avto-sinxron | 2026-06-27 | TASDIQ-2146 §19 #21 | Internet yo'qda ishlash | Offline | sync + queue | Ha | pos-sync.service; pos_offline_queue; FE banner |
| 22 | Bekor/tuzatish: DRAFT bekor, tasdiq=storno | 2026-06-27 | TASDIQ-2146 §19 #22 | O'chirish yo'q | Bekor | cancelled tranziya | Ha | quarantine cancelled; movements_archive |
| 23 | DAMAGE → QC + GL zarar | 2026-06-27 | TASDIQ-2146 §19 #23 | Brak/yaroqsiz | Damage | DAMAGE + qc link | Ha | DAMAGE turi; damage.qc_required event; qc_links |
| 24 | FG ishlab chiqarishdan qabul (MES) | 2026-06-27 | TASDIQ-2146 §19 #24 | FG shu POS'da, MES real-time | FG kirim | MES→FG listener | Qisman | FG-MAIN live; goods_receipts=0; listener jonli emas |
| 25 | Partiya/seriya (lot) Code-128, FIFO/FEFO | 2026-06-27 | TASDIQ-2146 §19 #25 | Muddatli FEFO, muddatsiz FIFO | Lot | fifo batch tanlash | Ha | pos-fifo FEFO/FIFO; batch_lot_movements; FE |
| 26 | Planshet ekran responsive, skaner-markaz | 2026-06-27 | TASDIQ-2146 §19 #26 | PC+planshet+telefon | FE UI | responsive layout | Ha | PosMonitorApp + PosLayout; 44 sahifa |
| 27 | Smena boshqaruvi kerak emas — audit+kunlik jurnal | 2026-06-27 | TASDIQ-2146 §19 #27 | Faqat audit log | Reports | reports + shift_audit | Ha | pos-reports.service; pos_shift_audit; audit 41 |
| 28 | Harakat turlari master-data (qat'iy+sozlanadi) | 2026-06-27 | TASDIQ-2146 §19 #28 | Kod qat'iy, sabab admin | Master-data | movement_types jadval | Ha | pos_movement_types 7 qator; is_issue/is_receipt |
| 29 | Karta-model integratsiya (omborchi GSD) | 2026-06-27 | TASDIQ-2146 §19 #29 | HR statistikasi harakatdan | KPI | 3-ko'rsatkich GSD formula | Qisman | warehouse-kpi bor; GSD formula noaniq; EP-POS-056 |
| 30 | Kanonik jadval = warehouse_stock | 2026-06-27 | TASDIQ-2146 §19 #30 | Yagona haqiqat, real-time | Stock canon | warehouse_stock kanonik | Ha | warehouse_stock=37 live; current_stock VIEW |
| 31 | Ichki logistika INTERNAL_TRANSFER orqali | 2026-06-27 | TASDIQ-2146 §19 #31 | Yarim tayyor sex orasida | Transfer | balans ko'rinish | Ha | INTERNAL_TRANSFER; PRODUCTION_OFFSET/FLEXO+WIP |
| 32 | Texkarta-material moslik chiqimdan oldin blok | 2026-06-27 | TASDIQ-2146 §19 #32 | Eng qimmat xato oldini olish | Chiqim guard | texkarta-moslik check | Yo'q | grep=0; balance-guard faqat miqdor; EP-POS-032 OCHIQ |
| 33 | Gofra qavat/grammaj alohida karta (barcode) | 2026-06-27 | TASDIQ-2146 §19 #33 | Har qavat alohida material | Master-data | gofra-qavat kartalar | egasi-data | material_cards qo'llab-quvvatlaydi; barcode_map=0 |
| 34 | Lab qabuli — kirim KARANTIN, QC OK→tayyor | 2026-06-27 | TASDIQ-2146 §19 #34 | Lab tekshiruvi | Karantin | moveToQuarantine QC-HOLD | Ha | quarantine-workflow moveToQuarantine; STATUS_FLOW |
| 35 | Lab rad etsa: qaytarish yoki DEFECTIVE | 2026-06-27 | TASDIQ-2146 §19 #35 | Material taqdiri | Rejected | rejected + SCRAP | Ha | STATUS_FLOW rejected; SCRAP-MAIN live; return_reason |
| 36 | Chiqindi/qoldiq (отходы) hisobga olish | 2026-06-27 | TASDIQ-2146 §19 #36 | Makulatura kirimi | Chiqindi | chiqindi-harakat turi | Yo'q | grep=0; alohida tur yo'q; EP-POS-036 OCHIQ |
| 37 | Makulatura ombori alohida tur | 2026-06-27 | TASDIQ-2146 §19 #37 | Ikkilamchi qog'oz | Ombor turi | makulatura tur+rang barcode | Yo'q | warehouses'da makulatura yo'q; EP-POS-037 OCHIQ |
| 38 | Rohler/poddon kuzatiladi (poddon birligi) | 2026-06-27 | TASDIQ-2146 §19 #38 | 1 poddon=N rulon/kg | Ko'chirish vositasi | poddon birligi/konversiya | Yo'q | movement_lines'da poddon yo'q; EP-POS-038 OCHIQ |
| 39 | Bo'sh poddon/rohler qaytishi (qaytariladigan tara) | 2026-06-27 | TASDIQ-2146 §19 #39 | Ketdi/qaytdi balansi | Tara-aylanma | tara jadval/servis | Yo'q | tara-aylanma topilmadi; EP-POS-039 OCHIQ |
| 40 | Kunlik IChiqarish rejasi planshetga (%) | 2026-06-27 | TASDIQ-2146 §19 #40 | 'Bugun chiqariladigan' PP'dan | Reja push | PP→POS reja listener | Qisman | daily_warehouse_plans=0; listener jonli emas |
| 41 | Bekor turish (простой) signali | 2026-06-27 | TASDIQ-2146 §19 #41 | Material yetishmasa vaqt sanog'i | Prostoy | 'material kutyapman' tugma+signal | Yo'q | signal servisi topilmadi; EP-POS-041 OCHIQ |
| 42 | Sex material talabi planshetdan (talab↔chiqim) | 2026-06-27 | TASDIQ-2146 §19 #42 | Menejer tasdiq→omborchi beradi | Requisition | requisition workflow | Ha | pos-requisition-workflow; material_requests; FE |
| 43 | Buyurtmaga sarf biriktirish (tannarx) | 2026-06-27 | TASDIQ-2146 §19 #43 | Har chiqim buyurtmaga | Kalkulyatsiya | buyurtma↔material bog'lash | Qisman | purchase_order_id bor; jonli 2 movement, to'liq emas |
| 44 | Norma-fakt farqi (ortiqcha sarf) ogoh | 2026-06-27 | TASDIQ-2146 §19 #44 | Norma oshsa qizil+sabab | Norma guard | norma-fakt taqqoslash | Yo'q | guard topilmadi; EP-POS-044 OCHIQ |
| 45 | Turniket/RFID login bog'lanishmi | 2026-06-27 | TASDIQ-2146 §19 #45 | POS login=ERP SSO; RFID alohida HR | Auth chegara | ikki tizim ajratish | Ha | pos-auth ERP login; EP-POS-045 javoblangan |
| 46 | A-System bilan bog'liqlik (almashtir/parallel) | 2026-06-27 | TASDIQ-2146 §19 #46 | ERP butunlay almashtiradi | Migratsiya | A-System taqdiri | egasi-data | ko'prik yo'q; EP-POS-046 OCHIQ (Q-25 master) |
| 47 | WIP bosqichlari kuzatiladi | 2026-06-27 | TASDIQ-2146 §19 #47 | Har bosqich alohida pozitsiya | WIP | WIP omborlar+transfer | Ha | WIP-MAIN+PRODUCTION_OFFSET/FLEXO; INTERNAL_TRANSFER |
| 48 | Texnik pasport/partiya FG kirimda | 2026-06-27 | TASDIQ-2146 §19 #48 | Jo'natishda tayyor | FG pasport | pasport bog'lash | Qisman | passport jadval+servis; material_passports=0 |
| 49 | Lab namuna olish alohida chiqim sababi | 2026-06-27 | TASDIQ-2146 §19 #49 | Kichik qayd | Chiqim sabab | 'lab namunasi' turi | Yo'q | chiqim sababi topilmadi; EP-POS-049 OCHIQ |
| 50 | Smenadan smenaga topshirish (2 imzo akti) | 2026-06-27 | TASDIQ-2146 §19 #50 | Topshiruvchi/qabul qiluvchi | Smena akti | 2-imzo akt | Yo'q | shift_audit bor, 2-imzo yo'q; EP-POS-050 OCHIQ (Q11 zid) |
| 51 | Yuk topshirish-qabul akti (kirimda) | 2026-06-27 | TASDIQ-2146 §19 #51 | Zakaz-fakt farqi→da'vo | Kirim akt | akt PDF + 3-way | Ha | act_pdf_path; pos-pdf.service; three_way_match |
| 52 | Kam/buzuq material qisman qabul | 2026-06-27 | TASDIQ-2146 §19 #52 | Ochiq qoldiq+buzuq alohida | Qisman qabul | received<ordered oqim | Yo'q | grep=0; qisman-qabul yo'q; EP-POS-052 OCHIQ |
| 53 | Tozalik/5S — POS tashqarisida (Coordination) | 2026-06-27 | TASDIQ-2146 §19 #53 | Toza chegara | Chegara | 5S POS'da yo'q | Ha | 5S kodi yo'q (to'g'ri); EP-POS-053 javoblangan |
| 54 | Ish joyni tashlab ketish (harakatsizlik signali) | 2026-06-27 | TASDIQ-2146 §19 #54 | Javobsiz talab→boshliq | Signal | harakatsizlik detektor | Qisman | audit_log qaydlaydi; detektor yo'q; EP-POS-054 |
| 55 | Energiya/resurs tejash — POS'da yo'q (IoT/Coord) | 2026-06-27 | TASDIQ-2146 §19 #55 | Chegara | Chegara | energiya POS'da yo'q | Ha | energiya kodi yo'q (to'g'ri); EP-POS-055 javoblangan |
| 56 | Omborchi GSD 3-ko'rsatkich avto | 2026-06-27 | TASDIQ-2146 §19 #56 | reja%+kechikish+og'ish→karta | KPI formula | 3-ko'rsatkich formula | egasi-data | warehouse-kpi bor; formula aniq emas; EP-POS-056 OCHIQ |
| 57 | Birlik konversiyasi (rulon↔kg↔m) avto | 2026-06-27 | TASDIQ-2146 §19 #57 | Har materialga jadval | Konversiya | o'lchov konversiya jadval | Qisman | valyuta konversiya bor; o'lchov jadval data kutadi |
| 58 | Buyurtma yopilgach ortgan material qaytadi | 2026-06-27 | TASDIQ-2146 §19 #58 | Tannarxdan chiqadi | Return | INTERNAL_RETURN | Ha | INTERNAL_RETURN is_receipt=true; return_reason majburiy |
| 59 | Ta'minotchiga qaytarish→Finance da'vo | 2026-06-27 | TASDIQ-2146 §19 #59 | Kredit-nota | Supplier return | supplier-return tur+event | Qisman | supplier_id+return_reason; kredit-nota event jonli emas |
| 60 | Material muddati FEFO + ogohlantirish | 2026-06-27 | TASDIQ-2146 §19 #60 | Muddatli→FEFO | Expiry | fifo hasExpiry + ogoh | Ha | pos-fifo hasExpiry FEFO; quarantine-check+low-stock job |
| 61 | Joylashuv (yacheyka) kuzatiladi | 2026-06-27 | TASDIQ-2146 §19 #61 | Kirimda belgila, chiqimda ko'rsat | Bin | bin_id ustun | Ha | movement_lines.bin_id; movement.service:199 |
| 62 | Mijoz materiali (давальческое) ajratiladi | 2026-06-27 | TASDIQ-2146 §19 #62 | Miqdor kuzat, qiymat GL'siz | Consignment | davальческое turi | Yo'q | grep=0; tur yo'q; EP-POS-062 OCHIQ |
| 63 | Inventar paytida ombor muzlatiladi (freeze) | 2026-06-27 | TASDIQ-2146 §19 #63 | Tunda/dam kuni sanash | Freeze | zona-freeze/plan | Ha | pos_inventory_plans; tunda qaror; zona-freeze talab emas |
| 64 | Inventar farq chegarasi (avto-tasdiq limit) | 2026-06-27 | TASDIQ-2146 §19 #64 | ±N% avto, ortig'i tasdiq | Limit | ±N% limit kodi | Yo'q | limit kodi topilmadi; har farq moliya; EP-POS-064 OCHIQ |
| 65 | Minimaldan tushsa avto purchase-request MM'ga | 2026-06-27 | TASDIQ-2146 §19 #65 | Proaktiv sotib olish | Low-stock→MM | erp_purchase_requisitions INSERT | Qisman | low-stock.job faqat notif; PR INSERT yo'q |
| 66 | Buyurtma uchun rezerv (band qilish) | 2026-06-27 | TASDIQ-2146 §19 #66 | Jami╳erkin qoldiq | Reservation | reservation servis | Ha | stock-reservation.service; reservations=0 (data kutadi) |
| 67 | Shoshilinch chiqim (rejasiz/ruxsatli) | 2026-06-27 | TASDIQ-2146 §19 #67 | Sabab+boshliq xabar | Emergency issue | rejadan-tashqari oqim | Qisman | sabab majburiy; maxsus oqim yo'q; EP-POS-067 OCHIQ |
| 68 | Bichish/qirqish qisman chiqim (rulon qoldiq) | 2026-06-27 | TASDIQ-2146 §19 #68 | Rulon qoldig'i kamayadi | Partial issue | 'ochiq rulon' oqim | Qisman | FIFO qisman allocation; oqim aniq emas; EP-POS-068 OCHIQ |
| 69 | Foto-dalil (kirim/brak/inventar) majburiy | 2026-06-27 | TASDIQ-2146 §19 #69 | Buzuq/katta farqda foto | Attachment | foto biriktirish | Yo'q | grep=0 (faqat cash-register); EP-POS-069 OCHIQ |
| 70 | Offline harakat to'qnashuvi (konflikt) | 2026-06-27 | TASDIQ-2146 §19 #70 | 'Tekshirilsin'→boshliq | Conflict | rezolyutsiya holati | Qisman | sync conflicts++ / ConflictException; holat to'liq emas |
| 71 | Telegram: hodisa→rol matritsasi | 2026-06-27 | TASDIQ-2146 §19 #71 | Kimga qaysi hodisa | Notif routing | pos_telegram_routes matritsa | Qisman | role-based telegram bor; telegram_routes=0 (sozlama kutadi) |
| 72 | FG jo'natish (отгрузка) POS'da (SD) | 2026-06-27 | TASDIQ-2146 §19 #72 | EXTERNAL_OUT+moliya+AI | Otgruzka | EXTERNAL_OUT FG | Ha | EXTERNAL_OUT live; FINANCE approve; invoice_id/3-way |
| 73 | Marshrut varaqasi (накладная) chop | 2026-06-27 | TASDIQ-2146 §19 #73 | Akt+invoice+накладная | Print | pdf servis+templates | Ha | pos-pdf.service; act/invoice_pdf_path; pdf_templates |
| 74 | Razряd/malaka — kim qaysi harakat | 2026-06-27 | TASDIQ-2146 §19 #74 | Oddiy╳muhim harakat | Huquq | razряd-darajali huquq | Qisman | department.guard+rol tasdiq; razряd ajratmasi yo'q |
| 75 | Kunlik hisobot vertikal (manager_id yuqoriga) | 2026-06-27 | TASDIQ-2146 §19 #75 | Har daraja kesim | Reports vertikal | manager_id avto-oqim | Qisman | reports+kpi kesimlar; vertikal oqim jonli emas |
| 76 | Buyurtma o'zgarishi (chiqarilgan materialga) | 2026-06-27 | TASDIQ-2146 §19 #76 | POS ogoh+qaytarish taklif | Order change | o'zgarish trigger/listener | Yo'q | listener topilmadi; avto-trigger yo'q; EP-POS-076 OCHIQ |
| 77 | Tungi smena/kechki anomaliya (vaqt+miqdor) | 2026-06-27 | TASDIQ-2146 §19 #77 | Smena tashqarisi+norma-oshiq | Anomaliya | vaqt+miqdor detektor | Yo'q | audit ts bor; detektor yo'q; EP-POS-077 OCHIQ |
| 78 | Material kartasini kim yaratadi (omborchi/MM) | 2026-06-27 | TASDIQ-2146 §19 #78 | Faqat MM tasdiq | Master-data | MM-tasdiq workflow | Qisman | skanerda yo'q→admin telegram; MM-tasdiq jonli emas |
| 79 | Eski tizimdan boshlang'ich qoldiq | 2026-06-27 | TASDIQ-2146 §19 #79 | Bir martalik to'liq inventar | Migratsiya | boshlang'ich-qoldiq import | egasi-data | count strukturasi bor; import strategiya yo'q; EP-POS-079 OCHIQ |
| 80 | Harakat tarixi o'zgarmas (audit) | 2026-06-27 | TASDIQ-2146 §19 #80 | Xodim o'ziniki, boshliq hammasi | Audit | insertLog audit | Ha | pos_audit_log 41 qator; FE PosMyInventory; audit.service |
| 81 | Yuk topshirishda nomuvofiqlik (topshir↔qabul) | 2026-06-27 | TASDIQ-2146 §19 #81 | Farq→nizo→boshliq | Nizo | farq-nizo rezolyutsiya | Yo'q | confirmations bor; nizo oqimi yo'q; EP-POS-081 OCHIQ |
| 82 | POS til/ko'rinish (lotin/kirill/rus) | 2026-06-27 | TASDIQ-2146 §19 #82 | Omborchi tanlaydi, ikonka-markaz | i18n | uchinchi til (kirill) | Qisman | name_ru bor; uz+ru tasdiq; kirill=egasi qarori; EP-POS-082 |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Qaysi omborlar planshetda (bo'lim-mapping) | 2026-06-27 | TASDIQ-2146 §19 #3 | department_warehouse_map=0 — mapping data egasidan | POS |
| Inventar davriylik (sikl-sanash) | 2026-06-27 | TASDIQ-2146 §19 #17 | Davriylik qiymati kutilmoqda; EP-POS-017 OCHIQ | POS |
| AI anomaliya aniqlash → boshliqqa signal | 2026-06-27 | TASDIQ-2146 §19 #20 | Detektor servis qurilmagan; EP-POS-020 OCHIQ | POS |
| Texkarta-material moslik chiqimdan oldin blok | 2026-06-27 | TASDIQ-2146 §19 #32 | Moslik-check yo'q (faqat miqdor); EP-POS-032 OCHIQ | POS |
| Gofra qavat/grammaj alohida karta | 2026-06-27 | TASDIQ-2146 §19 #33 | Gofra-qavat kartalar master-data egasidan (barcode_map=0) | POS |
| Chiqindi/qoldiq (отходы) hisobga olish | 2026-06-27 | TASDIQ-2146 §19 #36 | Chiqindi-harakat turi yo'q; EP-POS-036 OCHIQ | POS |
| Makulatura ombori alohida tur | 2026-06-27 | TASDIQ-2146 §19 #37 | warehouses'da makulatura turi yo'q; EP-POS-037 OCHIQ | POS |
| Rohler/poddon kuzatuvi (poddon birligi) | 2026-06-27 | TASDIQ-2146 §19 #38 | Poddon birligi/konversiya yo'q; EP-POS-038 OCHIQ | POS |
| Bo'sh poddon/rohler qaytishi (tara) | 2026-06-27 | TASDIQ-2146 §19 #39 | Tara-aylanma jadval/servis yo'q; EP-POS-039 OCHIQ | POS |
| Bekor turish (простой) signali | 2026-06-27 | TASDIQ-2146 §19 #41 | Prostoy signal/tugma yo'q; EP-POS-041 OCHIQ | POS |
| Norma-fakt farqi (ortiqcha sarf) ogoh | 2026-06-27 | TASDIQ-2146 §19 #44 | Norma-fakt guard yo'q; EP-POS-044 OCHIQ | POS |
| A-System bilan bog'liqlik | 2026-06-27 | TASDIQ-2146 §19 #46 | A-System taqdiri egasidan; EP-POS-046 OCHIQ (Q-25) | POS |
| Lab namuna olish alohida chiqim sababi | 2026-06-27 | TASDIQ-2146 §19 #49 | Lab-namuna sabab/turi yo'q; EP-POS-049 OCHIQ | POS |
| Smenadan smenaga topshirish (2 imzo) | 2026-06-27 | TASDIQ-2146 §19 #50 | 2-imzo akt yo'q; Q11 bilan zid, egasi hal qiladi | POS |
| Kam/buzuq material qisman qabul | 2026-06-27 | TASDIQ-2146 §19 #52 | Qisman-qabul oqimi yo'q; EP-POS-052 OCHIQ | POS |
| Omborchi GSD 3-ko'rsatkich formula | 2026-06-27 | TASDIQ-2146 §19 #56 | Aniq formula (reja%/kechikish/og'ish) egasidan; EP-POS-056 | POS |
| Mijoz materiali (давальческое) ajratish | 2026-06-27 | TASDIQ-2146 §19 #62 | Davальческое turi yo'q; EP-POS-062 OCHIQ | POS |
| Inventar farq avto-tasdiq limit (±N%) | 2026-06-27 | TASDIQ-2146 §19 #64 | Limit kodi yo'q; har farq moliya; EP-POS-064 OCHIQ | POS |
| Foto-dalil (kirim/brak/inventar) majburiy | 2026-06-27 | TASDIQ-2146 §19 #69 | Foto biriktirish yo'q; EP-POS-069 OCHIQ | POS |
| Buyurtma o'zgarishi trigger | 2026-06-27 | TASDIQ-2146 §19 #76 | O'zgarish listener yo'q; EP-POS-076 OCHIQ | POS |
| Tungi/kechki anomaliya (vaqt+miqdor) | 2026-06-27 | TASDIQ-2146 §19 #77 | Anomaliya detektor yo'q; EP-POS-077 OCHIQ | POS |
| Eski tizimdan boshlang'ich qoldiq | 2026-06-27 | TASDIQ-2146 §19 #79 | Import strategiya yo'q (A-System bog'liq); EP-POS-079 OCHIQ | POS |
| Yuk topshirishda nomuvofiqlik (nizo) | 2026-06-27 | TASDIQ-2146 §19 #81 | Farq-nizo rezolyutsiya yo'q; EP-POS-081 OCHIQ | POS |
