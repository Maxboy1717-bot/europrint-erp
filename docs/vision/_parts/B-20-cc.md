## [B/TASDIQ] CC / Hujjat-shartnoma (20) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Barcha murojaat bitta 'Yangi hujjat' → shablon | 2026-06-27 | TASDIQ-2146 §20 #1 | Yagona kirish nuqtasi | CC workflow/FE | Bitta oqim, 14 shablon | Ha | cc-workflow.service.ts:48 createDraft; controller:160; NewDocumentModal.tsx |
| 2 | Shablonni faqat super-admin yaratadi | 2026-06-27 | TASDIQ-2146 §20 #2 | Yagona standart | Templates CRUD | Admin shablon CRUD UI | Qisman | seed 14 qator bor; admin CRUD endpoint yo'q, faqat GET templates:100 |
| 3 | AI intervyu → rasmiy matn tuzadi | 2026-06-27 | TASDIQ-2146 §20 #3 | Xodim yozishni bilmaydi | AI interview | savol-javob→matn | Ha | cc-ai-interview.service.ts finalize:213 ai.callClaude |
| 4 | AI tushsa qo'lda uzilishsiz | 2026-06-27 | TASDIQ-2146 §20 #4 | Murojaat bloklanmaydi | Draft oqimi | AI'siz draft | Ha | createDraft AI'dan mustaqil (:48); test_mode AI skip (:210) |
| 5 | Marshrut org-sxemadan avto (manager_id) | 2026-06-27 | TASDIQ-2146 §20 #5 | Sakramaydi | Org resolver | recursive org-walk | Ha | cc-org-resolver.service.ts:39 resolveApprover; 48 step seed |
| 6 | Manager NULL → DEPT_HEAD/direktor fallback | 2026-06-27 | TASDIQ-2146 §20 #6 | Hech yo'qolmaydi | Org resolver | 3-bosqich fallback | Ha | cc-org-resolver:142-168; resolveDirector:73-110 |
| 7 | Imzo = PIN-kod har imzoga | 2026-06-27 | TASDIQ-2146 §20 #7 | Qulay+isbotli | PIN service | bcrypt+sha256 imzo | Ha | cc-pin.service.ts verifyAndSign; workflow:84,162,222 |
| 8 | Imzo bosqichli, sakramaydi | 2026-06-27 | TASDIQ-2146 §20 #8 | Ketma-ket oqim | Approve helpers | stillPending→keyingi step | Ha | cc-workflow-approve.helpers.ts:36-95 sort |
| 9 | Rad → sabab majburiy → resubmit | 2026-06-27 | TASDIQ-2146 §20 #9 | Tuzatib qayta | Workflow | reject+reason+version+1 | Ha | cc-workflow.service.ts:173 reject; resubmit:192 |
| 10 | Kechikkanda avto-eskalatsiya→HR | 2026-06-27 | TASDIQ-2146 §20 #10 | 2x eslatma→HR | SLA cron | takror-eslatma+HR yo'nal | Qisman | cc-sla.cron.ts:161 escalate+48h auto-reject; 2x/HR yo'q |
| 11 | Eskalatsiya muddati har shablonga | 2026-06-27 | TASDIQ-2146 §20 #11 | Avans 4s/ta'til 24s | Templates SLA | tur-asosli soat | Qisman | inbox_sla_hours ustun bor; seed 24/48, avans 4s mos emas |
| 12 | 3-savat (Kir/Kut/Chiq) ulangan | 2026-06-27 | TASDIQ-2146 §20 #12 | Yagona ish ro'yxati | Baskets | basket_state | Ha | cc-baskets.service.ts; BasketColumn.tsx; basket_history |
| 13 | 24s→qizil+eslatma, 48s→boshliq | 2026-06-27 | TASDIQ-2146 §20 #13 | Overdue nazorat | SLA cron | markInboxOverdue | Ha | cc-sla.cron.ts:63; 48h auto-reject:115; GlobalInboxBadge.tsx |
| 14 | Kaskad — 1 hujjat→ko'p vazifa | 2026-06-27 | TASDIQ-2146 §20 #14 | To'liq avtomatlashuv | Event listener | domen-trigger kaskad | Qisman | cc-event.listener.ts:52 draft+Kanban; cc.spawn faqat webhook:99 |
| 15 | Avto-raqamlash, format har shablonga | 2026-06-27 | TASDIQ-2146 §20 #15 | ZVS-2026-0042 | Number service | atomic lock+token | Ha | cc-document-number.service.ts advisory_xact_lock; number_format |
| 16 | Immutable arxiv, lavozimga muddat | 2026-06-27 | TASDIQ-2146 §20 #16 | Rahbar 10y/ishchi 3y | Archive | archive_after_days seed | Qisman | archived_at+ustun bor; seed=NULL; 10/3 farq yo'q |
| 17 | Arxivdan ko'p mezonli full-text filtr | 2026-06-27 | TASDIQ-2146 §20 #17 | To'liq qidiruv | Read repo | tsvector/GIN | Qisman | ro'yxatlash bor; full-text yo'q; cc_documents=0 |
| 18 | Tasdiqlangan hujjat PDF (logo+imzo) | 2026-06-27 | TASDIQ-2146 §20 #18 | Rasmiy ko'rinish | PDF service | pdf-lib+QR | Ha | cc-pdf.service.ts; controller:88 GET pdf; print_log |
| 19 | To'liq ShVB hujjat turlari | 2026-06-27 | TASDIQ-2146 §20 #19 | ShVB qoplanadi | Templates | ZVS/ZNO/протокол... | Qisman | 14 shablon; распоряжение/протокол/приказ to'liq emas; ZNO alohida yo'q |
| 20 | To'liq status oqimi | 2026-06-27 | TASDIQ-2146 §20 #20 | qoralama→arxiv | Domain types | WorkflowState transition | Ha | domain/types.ts; cc-workflow.service transition() |
| 21 | Marshrut lavozim-kartasiga bog'liq | 2026-06-27 | TASDIQ-2146 §20 #21 | Xodim almashsa ishlaydi | Org resolver | card_id FK | Qisman | position_code orqali bilvosita (:192); to'g'ridan card_id yo'q |
| 22 | Tasdiqdan oldin AI tahlil (mos/risk) | 2026-06-27 | TASDIQ-2146 §20 #22 | Karta AI baholaydi (faza2) | Approve | AI-tahlil chaqiruvi | Yo'q | approve'da AI yo'q; AI faqat matn yaratadi; OCHIQ |
| 23 | Telegram tasdiq (tugma+PIN) | 2026-06-27 | TASDIQ-2146 §20 #23 | Qulay tasdiq | Bot service | inline tugma+PIN | Ha | cc-bot.service.ts approve/reject→awaiting_pin→verifyAndSign |
| 24 | In-app+Telegram+email kanallar | 2026-06-27 | TASDIQ-2146 §20 #24 | Asosiy kanal | Gateway/bot | email kanal | Qisman | WebSocket+Telegram+notifications bor; email yo'q |
| 25 | Ko'p fayl/rasm biriktirish | 2026-06-27 | TASDIQ-2146 §20 #25 | ZNO asos dalil | Attachments | upload endpoint | Qisman | cc_attachments jadval bor; upload endpoint yo'q |
| 26 | Faqat ishtirokchilar ko'radi (RBAC) | 2026-06-27 | TASDIQ-2146 §20 #26 | Maxfiylik | Baskets RBAC | maydon-daraja RBAC | Qisman | user_id filtr bor; hujjat-daraja RBAC projeksiya yo'q |
| 27 | ZVS tasdiq→Finance to'lov navbati | 2026-06-27 | TASDIQ-2146 §20 #27 | CC=kirish nuqtasi | Finance integr | outbox emit | Yo'q | ZRS_ZVS shablon bor; Finance event/outbox yo'q; cc_outbox bo'sh |
| 28 | Tasdiq matritsasi summa bo'yicha | 2026-06-27 | TASDIQ-2146 §20 #28 | ≤500k boshliq... | Workflow steps | summa-shartli marshrut | Yo'q | steps statik; summa-asosli marshrut yo'q; OCHIQ |
| 29 | Majlis protokoli Koordinatsiyada (engine reuse) | 2026-06-27 | TASDIQ-2146 §20 #29 | Bitta engine | Coordination | protokol slice ulanish | Qisman | CC protokol shablon yo'q; B-variant tanlangan; ulanish tasdiqlanmadi |
| 30 | To'liq audit izi, o'chmas | 2026-06-27 | TASDIQ-2146 §20 #30 | Kim/qachon/nima | Audit trail | append-only | Ha | cc_audit_trail write.repo:97,187,255 INSERT |
| 31 | Qoralama avto-saqlanadi | 2026-06-27 | TASDIQ-2146 §20 #31 | Ish yo'qolmaydi | AI interview | findExistingSession | Ha | cc-ai-interview.service.ts:67; persistAnswer:139 |
| 32 | Hujjat tili uz-lot/uz-kir/ru | 2026-06-27 | TASDIQ-2146 §20 #32 | Har kim o'z tilida | Language | 3-yozuv | Qisman | language uz/ru; PDF transliterate; uz-cyr alohida emas |
| 33 | Og'zaki qayd yo'q = qaror yo'q | 2026-06-27 | TASDIQ-2146 §20 #33 | Faqat yozma rasmiy | Arxitektura | modul-gate | Qisman | CC yozma-only ruh; boshqa modulga majburlash gate yo'q |
| 34 | Har shablonga kommunikatsiya-turi tegi (5) | 2026-06-27 | TASDIQ-2146 §20 #34 | Kanal tanlash | Templates schema | communication_type ustun | Yo'q | ustun YO'Q ('столбец не существует'); 5-tur yo'q |
| 35 | 'Yozma majburiy' 6 tur shablon | 2026-06-27 | TASDIQ-2146 §20 #35 | Chat bilan rasmiylashmaydi | Templates | 6 tur seed+gate | Yo'q | 6 tur seed yo'q; тех карта/reja/sifat shablon yo'q |
| 36 | Bevosita rahbar chetlab o'tish blok | 2026-06-27 | TASDIQ-2146 §20 #36 | Favqulodda+sabab istisno | Org resolver | chetlab-o'tish+sabab | Qisman | MANAGER_OF_SENDER majburiy (:57); favqulodda mexanizm yo'q |
| 37 | Gorizontal vakolat matritsasi | 2026-06-27 | TASDIQ-2146 §20 #37 | Kim kimga tur yo'llaydi | Resolver | ruxsat matritsasi | Yo'q | matritsa jadval/kod yo'q; OCHIQ |
| 38 | Analitik hujjat faqat Совершенствование(5) | 2026-06-27 | TASDIQ-2146 §20 #38 | Markazlashgan analitik | Templates | 5-dep yo'nal cheklash | Yo'q | tahlil shablon yo'q; 5-dep yo'nal yo'q; OCHIQ |
| 39 | Ikki tomonlama javobgarlik (ko'rildi belgisi) | 2026-06-27 | TASDIQ-2146 §20 #39 | 'ko'rmadim' bahsini yopadi | Audit | viewed_at timestamp | Qisman | audit performed_by+ts bor; viewed_at ustun yo'q |
| 40 | Har hujjatda 'javobgar lavozim' maydoni | 2026-06-27 | TASDIQ-2146 §20 #40 | Xodim almashsa o'tadi | Documents schema | responsible_position | Qisman | marshrut position_code bilvosita; alohida maydon yo'q |
| 41 | Javobgarlik o'tkazish faqat delegate | 2026-06-27 | TASDIQ-2146 §20 #41 | Iz qoldiradi | Delegations | delegate amali | Ha | cc_delegations; checkDelegation:216; expireDelegations:185 |
| 42 | Qaror oynasida 'asos hujjat raqami' majburiy | 2026-06-27 | TASDIQ-2146 §20 #42 | Qaror tayanchi | Workflow DTO | reference majburiy maydon | Yo'q | DTO'da reference yo'q; sender_comment ixtiyoriy; OCHIQ |
| 43 | Versiyalangan hujjat, eskisi bloklanadi | 2026-06-27 | TASDIQ-2146 §20 #43 | Eski ustida ishlash taqiq | Write repo | 'eskirgan' status qulf | Qisman | snapshotVersion+version+1 bor; eskirgan qulf yo'q |
| 44 | Maydon bo'lim-vakolatiga ko'ra tahrir (RBAC) | 2026-06-27 | TASDIQ-2146 §20 #44 | Bir bo'lim buzmaydi | Field RBAC | maydon×rol mapping | Yo'q | maydon-RBAC yo'q; ai_answers bitta blob; OCHIQ |
| 45 | 'Ma'lumot talabi' shabloni (muddat+javob) | 2026-06-27 | TASDIQ-2146 §20 #45 | Rasmiy talab | Templates | shablon+talab→javob | Yo'q | shablon seed yo'q; talab→javob oqim yo'q; OCHIQ |
| 46 | 'Reja o'zgartirish' shabloni (3 majburiy) | 2026-06-27 | TASDIQ-2146 §20 #46 | Og'zaki bosim yo'q | Templates | tashabbuskor/sabab/natija | Yo'q | shablon seed yo'q; egasi ta'kidlagan, qurilmagan |
| 47 | Reja o'zgartirish sabab 5 guruh dropdown | 2026-06-27 | TASDIQ-2146 §20 #47 | Oylik tahlil avto | Templates | 5-sabab tasnif | Yo'q | reja-shablon yo'q→dropdown yo'q |
| 48 | 100%dan oldin yopishga 'reja o'zg' shart | 2026-06-27 | TASDIQ-2146 §20 #48 | Qayta sozlash vaqti | MES↔CC | yopish-bloklash gate | Yo'q | reja-shablon yo'q; MES↔CC bog' yo'q; OCHIQ |
| 49 | Har smena majburiy 'smena yakuni xulosasi' | 2026-06-27 | TASDIQ-2146 §20 #49 | Kunlik hisobot | SLA cron | recurring doc cron | Yo'q | shablon yo'q; spawnRecurringDocuments:197 PLACEHOLDER |
| 50 | 'Tунги smena qarori' maxsus hujjat | 2026-06-27 | TASDIQ-2146 §20 #50 | Ertasi rahbar ko'radi | Templates | shablon+eskalatsiya | Yo'q | shablon seed yo'q; oqim yo'q; OCHIQ |
| 51 | Muammo-hujjatga qisqa SLA (15daq/1s) | 2026-06-27 | TASDIQ-2146 §20 #51 | Daqiqalar bilan | Templates SLA | daqiqa-birlik SLA | Qisman | ustun SOAT birligida; seed 24/48; 15daq yo'q |
| 52 | Muammo yopilsa 'orgpolitika' avto (НО-3) | 2026-06-27 | TASDIQ-2146 §20 #52 | Takror xato→sikl | Event listener | domen cc.spawn emit | Qisman | cc.spawn mexanizm bor; domen-emit yo'q; orgpolitika shablon yo'q |
| 53 | Yangi orgpolitika→o'qitish vazifa (1 kun) | 2026-06-27 | TASDIQ-2146 §20 #53 | Qog'ozda qolmaydi | Event listener | tasdiq→vazifa avto | Qisman | Kanban vazifa mexanizm bor; avto-oqim+1-kun yo'q; shablon yo'q |
| 54 | Orgpolitika 'tanishdim' PIN→ish-bloklash | 2026-06-27 | TASDIQ-2146 §20 #54 | 'bilmasdim' yo'q | Acknowledgments | ack jadval+gate | Yo'q | cc_policy_acknowledgments jadval/oqim yo'q; shablon yo'q |
| 55 | НАЗОРАТ ВАРАҚАСИ (mavzu×PIN+progress) | 2026-06-27 | TASDIQ-2146 §20 #55 | РД-5 adaptatsiya isboti | LMS↔CC | checklist-hujjat | Yo'q | checklist jadval/shablon yo'q; LMS ulanish yo'q |
| 56 | тех карта 'Лаборатория→Одобрена' imzo | 2026-06-27 | TASDIQ-2146 §20 #56 | Muhrsiz ishlab chiqarishga o'tmaydi | Workflow steps | lab-tasdiq bosqich | Yo'q | тех карта shablon yo'q; Одобрена step seed yo'q |
| 57 | тех карта 4-punkt moslik-checklist | 2026-06-27 | TASDIQ-2146 §20 #57 | Опросный лист solishtir | Templates | checklist mexanizm | Yo'q | тех карта shablon yo'q; checklist yo'q; OCHIQ |
| 58 | 'Таъминот заявкаси' shabloni | 2026-06-27 | TASDIQ-2146 §20 #58 | Rasmiy iz | MM/PO↔CC | shablon+navbat | Yo'q | shablon seed yo'q; MM/PO ulanish yo'q |
| 59 | 'Смена хом-ашё заявкаси' 2s SLA | 2026-06-27 | TASDIQ-2146 §20 #59 | Operator kutmaydi | Templates SLA | 2s SLA shablon | Yo'q | shablon yo'q; 2s SLA yo'q (faqat generik soat) |
| 60 | 'Режа қоғози' rulon-hujjat→buxgalteriya | 2026-06-27 | TASDIQ-2146 §20 #60 | Qog'oz harakati nazorat | Fin/Ombor↔CC | fakt-vazn+avto-uzatish | Yo'q | shablon seed yo'q; Finance/Ombor uzatish yo'q |
| 61 | Har hujjatga СЕРИЯ (Технология/Moliya/HR) tegi | 2026-06-27 | TASDIQ-2146 §20 #61 | Papka tashkili | Templates category | domen-СЕРИЯ | Qisman | category bor (ariza/buyruq); domen-seriya emas; orgpolitika-СЕРИЯ yo'q |
| 62 | Ko'p 'maqsad lavozim'→har biriga+tanishuv | 2026-06-27 | TASDIQ-2146 §20 #62 | Ko'p papkaga parallel | Documents | target positions | Yo'q | ko'p-maqsad maydon yo'q; bitta zanjir; parallel yo'q |
| 63 | Strategik marshrut oxiri = asoschi imzo | 2026-06-27 | TASDIQ-2146 §20 #63 | Egasi tasdig'i | Resolver | asoschi rol/PIN | Qisman | DIRECTOR oxiri (:64) bor; 'asoschi' alohida rol/PIN yo'q |
| 64 | Orgpolitika marshrut dep→bosh→НО-3 | 2026-06-27 | TASDIQ-2146 §20 #64 | Yuqori ruxsat bosqichi | Workflow steps | 3-bosqich seed | Yo'q | orgpolitika shablon+maxsus marshrut seed yo'q |
| 65 | Hujjat-modul yagona kanal (Bitrix o'rniga) | 2026-06-27 | TASDIQ-2146 §20 #65 | To'liq ERP | CC channel | Bitrix migratsiya | Qisman | CC qurilgan; A-System/Bitrix ko'chirish faol emas |
| 66 | Oy oxirida avto oylik tahlil-hujjat | 2026-06-27 | TASDIQ-2146 §20 #66 | Qo'lda unutiladi | Cron | avto-agregatsiya | Yo'q | oylik tahlil cron yo'q; reja-o'zg statistika yo'q |
| 67 | Tahlil-hujjat sabab-markazli+izoh maxfiy | 2026-06-27 | TASDIQ-2146 §20 #67 | Yolg'on izoh riski kam | Templates | format+maxfiylik | Yo'q | tahlil shablon/format yo'q; sabab-markazli yo'q |
| 68 | Reja bajarilmasa operator izohi majburiy | 2026-06-27 | TASDIQ-2146 §20 #68 | Sabab yo'qolmaydi | MES↔CC | reja-yopish gate | Yo'q | CC reja-shablonsiz; MES integratsiya yo'q |
| 69 | Og'zaki uchun 'keyin rasmiylashtir'+eslatma | 2026-06-27 | TASDIQ-2146 §20 #69 | Og'zaki kelishuv yo'qolmaydi | Workflow | tugma+eslatma oqim | Yo'q | tugma+eslatma oqim yo'q; majburlash yo'q |
| 70 | Har darajada rahbar xulosa qo'shib yuqoriga | 2026-06-27 | TASDIQ-2146 §20 #70 | Darajalararo umumlashtirish | Approval | xulosa maydon | Yo'q | strukturali xulosa maydon yo'q; comment ixtiyoriy; OCHIQ |
| 71 | Maydonlar rolga bog'liq (texnik=texnolog) | 2026-06-27 | TASDIQ-2146 §20 #71 | Savdo texnik yozmaydi | Field RBAC | maydon×rol | Yo'q | maydon-RBAC yo'q (#44 bilan bir); ai_answers rolsiz; OCHIQ |
| 72 | 'Sifat ogohlantirishi' ОТК→СОЗ qisqa SLA | 2026-06-27 | TASDIQ-2146 §20 #72 | Partiyaga tarqalmasin | QC↔CC | tez-shablon+zanjir | Yo'q | shablon seed yo'q; ОТК→СОЗ oqim yo'q; QC ulanish yo'q |
| 73 | 'Sifат ишчи журнали' append-only registr | 2026-06-27 | TASDIQ-2146 §20 #73 | Qayd o'chmasin | QC↔CC | sifat-журнал registr | Yo'q | sifat-журнал shablon/registr yo'q; QC ulanish yo'q |
| 74 | Tasdiqlangan hujjat immutable (faqat bekor) | 2026-06-27 | TASDIQ-2146 §20 #74 | 'o'chirdim' teshigini yopadi | Immutability | DB-trigger UPDATE-blok | Qisman | workflow-daraja immutable; DB-constraint yo'q, UPDATE mumkin |
| 75 | Hujjat 3 yozuv, default kirill | 2026-06-27 | TASDIQ-2146 §20 #75 | Rasmiy hujjat kirillda | Language | uz-cyr default yozuv | Qisman | language uz/ru (#32 bilan bir); uz-cyr default emas |
| 76 | Qog'oz skan+meta→arxiv qidiriladi | 2026-06-27 | TASDIQ-2146 §20 #76 | Eski papkalar yo'qolmaydi | Attachments | skan-yuklash+OCR | Yo'q | skan-arxiv oqim/endpoint yo'q; OCR yo'q |
| 77 | Har lavozimga РД/НО kod, marshrut kod bilan | 2026-06-27 | TASDIQ-2146 §20 #77 | РД-2/4/5/НО-3/13 | Resolver/positions | РД-kod seed | Qisman | POSITION:<CODE> mumkin; step-kodlar generik; РД-kodlar yo'q |
| 78 | 'Bo'limlararo qaror protokoli' ko'p-imzo | 2026-06-27 | TASDIQ-2146 §20 #78 | 'demagandim' yo'q | Coordination↔CC | protokol+kvorum | Yo'q | protokol shablon+ko'p-imzo yo'q; ulanish topilmadi |
| 79 | Deadline uzilsa 'tashkiliy xato' avto yozadi | 2026-06-27 | TASDIQ-2146 §20 #79 | Xato egasi aniq | SLA/Production | tashkiliy-xato qayd | Yo'q | overdue bayroq bor; 'javobgar bo'lim' xato yozuvi yo'q; OCHIQ |
| 80 | Ekranda 'rasmiy=faqat yozma' ko'rsatiladi | 2026-06-27 | TASDIQ-2146 §20 #80 | 'aytib qo'ygandim' yo'q | FE | qoida-ko'rsatkich | Yo'q | ekran ko'rsatkich+faqat-yozma belgilash yo'q; reja-shablon yo'q |
| 81 | 'Orgpolitika' 4-bo'lim shabloni | 2026-06-27 | TASDIQ-2146 §20 #81 | Egasi formati (мукаммал манзара) | Templates | 4-bo'lim struktura | Yo'q | orgpolitika shablon seed yo'q; format mos shablon yo'q |
| 82 | Hujjatlar zanjir bog'lanadi (ota-bola) | 2026-06-27 | TASDIQ-2146 §20 #82 | To'liq iz | Documents | parent_document_id yozish | Qisman | ustun+read bor (:81); write.repo HECH set qilmaydi — funksional emas |
| 83 | 'Smena biriktirish' hujjati (dastgoh+operator) | 2026-06-27 | TASDIQ-2146 §20 #83 | Javobgarlik aniq | MES/HR↔CC | shablon+KPI ulanish | Yo'q | shablon yo'q; dastgoh×operator+KPI yo'q; OCHIQ |
| 84 | 'Shoshilinch'→sabab+yuqori tasdiq majburiy | 2026-06-27 | TASDIQ-2146 §20 #84 | 'juda зарил' bosimni cheklash | Priority | urgent-gate | Qisman | priority+sort bor; urgent sabab+tasdiq gate yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Tasdiqdan oldin AI tahlil (mos/risk/tavsiya) | 2026-06-27 | TASDIQ-2146 §20 #22 | approve'da AI yo'q; faza 2 (karta AI) | CC/AI |
| ZVS tasdiq→Finance to'lov navbati | 2026-06-27 | TASDIQ-2146 §20 #27 | outbox emit yo'q; Finance ulanmagan | CC/Finance |
| Tasdiq matritsasi summa bo'yicha marshrut | 2026-06-27 | TASDIQ-2146 §20 #28 | summa-shartli marshrut yo'q; egasi-qaror | CC |
| Kommunikatsiya-turi tegi (5 tur) | 2026-06-27 | TASDIQ-2146 §20 #34 | communication_type ustun yo'q | CC/schema |
| 'Yozma majburiy' 6 tur shablon | 2026-06-27 | TASDIQ-2146 §20 #35 | 6 tur seed+chat-gate yo'q | CC |
| Gorizontal vakolat matritsasi | 2026-06-27 | TASDIQ-2146 §20 #37 | matritsa jadval/kod yo'q | CC/Org |
| Analitik hujjat faqat Совершенствование(5) | 2026-06-27 | TASDIQ-2146 §20 #38 | tahlil shablon+5-dep yo'nal yo'q | CC |
| Qaror oynasida 'asos hujjat raqami' majburiy | 2026-06-27 | TASDIQ-2146 §20 #42 | reference majburiy maydon yo'q | CC |
| Maydon bo'lim-vakolatiga tahrir (RBAC) | 2026-06-27 | TASDIQ-2146 §20 #44 | maydon×rol RBAC yo'q | CC |
| 'Ma'lumot talabi' shabloni | 2026-06-27 | TASDIQ-2146 §20 #45 | shablon+talab→javob yo'q; yangi shablon | CC/Совершенствование |
| 'Reja o'zgartirish' shabloni (3 majburiy) | 2026-06-27 | TASDIQ-2146 §20 #46 | shablon seed yo'q | CC/MES |
| Reja o'zgartirish sabab 5 guruh dropdown | 2026-06-27 | TASDIQ-2146 §20 #47 | reja-shablon yo'q | CC |
| 100%dan oldin yopishga 'reja o'zg' shart | 2026-06-27 | TASDIQ-2146 §20 #48 | MES↔CC bloklash yo'q; Production qarori | CC/MES |
| Har smena majburiy 'smena yakuni xulosasi' | 2026-06-27 | TASDIQ-2146 §20 #49 | recurring cron PLACEHOLDER; shablon yo'q | CC |
| 'Tунги smena qarori' maxsus hujjat | 2026-06-27 | TASDIQ-2146 §20 #50 | shablon+eskalatsiya yo'q | CC |
| Orgpolitika 'tanishdim' PIN→ish-bloklash | 2026-06-27 | TASDIQ-2146 §20 #54 | ack jadval/gate yo'q | CC/HR |
| НАЗОРАТ ВАРАҚАСИ (mavzu×PIN+progress) | 2026-06-27 | TASDIQ-2146 §20 #55 | checklist-hujjat+LMS ulanish yo'q | CC/LMS |
| тех карта 'Лаборатория→Одобрена' imzo | 2026-06-27 | TASDIQ-2146 §20 #56 | тех карта shablon+lab-step yo'q | CC/Production/QC |
| тех карта 4-punkt moslik-checklist | 2026-06-27 | TASDIQ-2146 §20 #57 | checklist mexanizm yo'q | CC/Production |
| 'Таъминот заявкаси' shabloni | 2026-06-27 | TASDIQ-2146 §20 #58 | shablon+MM/PO ulanish yo'q | CC/MM |
| 'Смена хом-ашё заявкаси' 2s SLA | 2026-06-27 | TASDIQ-2146 §20 #59 | maxsus shablon+2s SLA yo'q | CC |
| 'Режа қоғози' rulon-hujjat→buxgalteriya | 2026-06-27 | TASDIQ-2146 §20 #60 | shablon+fakt-vazn+avto-uzatish yo'q | CC/Finance/Ombor |
| Ko'p 'maqsad lavozim'→har biriga+tanishuv | 2026-06-27 | TASDIQ-2146 §20 #62 | target positions maydon/oqim yo'q | CC |
| Orgpolitika marshrut dep→bosh→НО-3 | 2026-06-27 | TASDIQ-2146 §20 #64 | shablon+maxsus marshrut seed yo'q | CC |
| Oy oxirida avto oylik tahlil-hujjat | 2026-06-27 | TASDIQ-2146 §20 #66 | avto-agregatsiya cron yo'q | CC |
| Tahlil-hujjat sabab-markazli+izoh maxfiy | 2026-06-27 | TASDIQ-2146 §20 #67 | format+maxfiylik yo'q | CC |
| Reja bajarilmasa operator izohi majburiy | 2026-06-27 | TASDIQ-2146 §20 #68 | CC reja-shablonsiz; MES integratsiya yo'q | CC/MES |
| Og'zaki 'keyin rasmiylashtir'+eslatma | 2026-06-27 | TASDIQ-2146 §20 #69 | tugma+eslatma oqim yo'q | CC |
| Har darajada rahbar xulosa qo'shib yuqoriga | 2026-06-27 | TASDIQ-2146 §20 #70 | strukturali xulosa maydon yo'q | CC |
| Maydonlar rolga bog'liq (texnik=texnolog) | 2026-06-27 | TASDIQ-2146 §20 #71 | maydon×rol RBAC yo'q (#44) | CC |
| 'Sifat ogohlantirishi' ОТК→СОЗ qisqa SLA | 2026-06-27 | TASDIQ-2146 §20 #72 | tez-shablon+zanjir+QC ulanish yo'q | CC/QC |
| 'Сифат ишчи журнали' append-only registr | 2026-06-27 | TASDIQ-2146 §20 #73 | sifat-журнал registr+QC ulanish yo'q | CC/QC |
| Qog'oz skan+meta→arxiv qidiriladi | 2026-06-27 | TASDIQ-2146 §20 #76 | skan-arxiv oqim+OCR yo'q; faza 2 | CC |
| 'Bo'limlararo qaror protokoli' ko'p-imzo | 2026-06-27 | TASDIQ-2146 §20 #78 | protokol+kvorum yo'q | CC/Coordination |
| Deadline uzilsa 'tashkiliy xato' avto yozadi | 2026-06-27 | TASDIQ-2146 §20 #79 | 'javobgar bo'lim' xato yozuvi yo'q | CC/Production |
| Ekranda 'rasmiy=faqat yozma' ko'rsatiladi | 2026-06-27 | TASDIQ-2146 §20 #80 | qoida-ko'rsatkich+belgilash yo'q | CC/FE |
| 'Orgpolitika' 4-bo'lim shabloni | 2026-06-27 | TASDIQ-2146 §20 #81 | orgpolitika shablon+format yo'q | CC |
| 'Smena biriktirish' hujjati (dastgoh+operator) | 2026-06-27 | TASDIQ-2146 §20 #83 | shablon+KPI ulanish yo'q | CC/MES/HR |
