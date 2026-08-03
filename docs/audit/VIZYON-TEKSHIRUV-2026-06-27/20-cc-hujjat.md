# Modul 20 — CC / Hujjat-shartnoma — MUSTAQIL TEKSHIRUV

**Tekshiruvchi:** adversarial verifier (jonli kod + DB)
**Sana:** 2026-06-27
**Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (satr 7640..7976)

## Umumiy natija

- Savol soni (qTotal): **84**
- Doc self-claim: **vizyon 62%**
- Mening qayta-hisobim (bor=1, qisman=0.5, yoq=0; egasi-data=0): **realPct ≈ 37%**
  - bor: 17 · qisman: 28 · yoq: 39 · egasi-data: 0
- Tekshirilgan Isbot claims: 84 → **confirmed 82 / refuted (overstated) 2** (+ modul-sarlavha "62%" ham overstated)

### Asosiy xulosa
CC moduli QURILGAN va kod sifati YUQORI — workflow engine (send/approve/reject/resubmit/cancel), PIN-imzo (bcrypt+sha256), org-resolver (manager_id NULL→org-tree walk + DIRECTOR fallback), AI-intervyu (Claude), PDF (pdf-lib+QR-URL), 3-savat, SLA-cron (24h overdue + 48h auto-reject + escalation), Telegram bot, WebSocket gateway, audit-trail — barchasi HAQIQIY va Isbot'da ko'rsatilgan fayl/satr/jadval/ustun JONLI tasdiqlandi.

LEKIN: jadval DATA bilan bog'liq ko'p vizyon-talab **yo'q** (38+ savol). 14 shablon FAQAT HR-ariza turlari (avans/tatil/oylik/doklad/buyruq/ZRS-ZVS). Egasi alohida ta'kidlagan ishlab-chiqarish/sifat/taъминот/orgpolitika/тех-карта/режа-қоғози/smena-xulosa shablonlari va maxsus oqimlari SEED QILINMAGAN. cc_documents=0 (jonli data yo'q).

**Eng katta nomuvofiqlik:** modul sarlavhasi "62%" — lekin har-savol qat'iy hisobida real ijro ≈ 37%. Sarlavha optimistik.

## REFUTED / OVERSTATED CLAIMS
- **Sarlavha "62%"** → qat'iy per-savol qayta-hisob ≈37% (17 bor + 28 qisman + 39 yoq / 84). 62% optimistik.
- **20.82** flag 🟡 qisman, lekin amalda **yoq**: `parent_document_id` ustun bor + read.repo:81 o'qiydi, AMMO write.repo'da HECH QACHON yozilmaydi (createDraft INSERT'da yo'q, hech qaysi UPDATE set qilmaydi). Zanjir-bog'lanish funksional emas (doc Isbot buni o'zi ham tan oladi, lekin flag qisman generous).
- **20.9** flag ✅ bor + egasi "sabab majburiy", lekin RejectSchema'da `rejectionReasonId` VA `comment` ikkalasi `.optional()` — web'da sabab majburiy EMAS. Reject+reason+resubmit mexanizmi haqiqiy, majburiylik gate'i yo'q.

---

## Har-savol tekshiruvi

## 20.1 — EP-CC-001 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Yagona "Yangi hujjat" kirish nuqtasi?
- Doc Isbot: cc-workflow.service.ts:48 createDraft(templateId); controller POST documents/draft; 14 shablon; FE NewDocumentModal
- Tekshiruv: createDraft(senderUserId, dto) cc-workflow.service.ts:48 ✓; @Post('documents/draft') cc-documents.controller.ts:160 ✓; DB cc_document_templates=14 ✓; FE components/cc/NewDocumentModal.tsx mavjud ✓

## 20.2 — EP-CC-002 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Shablonni faqat super-admin yaratadimi?
- Doc Isbot: seed-orqali 14 qator; admin CRUD endpoint yo'q (faqat GET templates:100)
- Tekshiruv: GET templates cc-documents.controller.ts:100 ✓; controllerда POST/PUT/DELETE templates yo'q ✓ (faqat GET). Seed-only — to'g'ri qisman.

## 20.3 — EP-CC-003 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: AI intervyu savol→rasmiy matn?
- Doc Isbot: cc-ai-interview.service start/answer/finalize; finalize callClaude cc.generate_document (213); cc_ai_sessions; ai_questions
- Tekshiruv: start():57, answer():111, finalize():158 ✓; this.ai.callClaude({taskType:'cc.generate_document'}) line 213 ✓; cc_ai_sessions jadval mavjud (4 qator); ai_questions JSONB cc_document_templates'da ✓

## 20.4 — EP-CC-004 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: AI ishlamasa qo'lda — uzilishsizmi?
- Doc Isbot: createDraft AI'dan mustaqil; test_mode AI chaqirmaydi (210)
- Tekshiruv: createDraft to'g'ridan aiBody qabul qiladi (workflow.service:48-71) ✓; ai-interview.service:210 numberFormat.includes('TEST')||testMode → AI chaqirmaydi ✓

## 20.5 — EP-CC-005 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Marshrut org-sxemadan avto?
- Doc Isbot: cc-org-resolver:39 resolveApprover; recursive org-tree walk (130-169); 48 step seed
- Tekshiruv: resolveApprover() line 39 ✓; resolveManagerOfSender() 126-169 WITH RECURSIVE org_departments chain ✓; DB cc_workflow_steps=48 ✓

## 20.6 — EP-CC-006 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Manager NULL → fallback direktorga?
- Doc Isbot: 142-168 org-tree bo'lim rahbari; resolveDirector 3-bosqich (73-110); throw emas Result
- Tekshiruv: resolveManagerOfSender fallback walk 140-168 ✓; resolveDirector 3 bosqich (pos→role→ceo) 73-110 ✓; Result<number> qaytaradi, throw yo'q (BUG FIX izoh) ✓

## 20.7 — EP-CC-007 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Imzo PIN-kodmi?
- Doc Isbot: cc-pin.service verifyAndSign bcrypt.compare + sha256; cc_user_pins
- Tekshiruv: verifyAndSign() cc-pin.service:55 bcrypt.compare:63 + crypto sha256 signature:69-73 ✓; verifyAndSign chaqiriladi send:84/approve:162/reject(helpers:37)/cancel:222 ✓; cc_user_pins jadval mavjud ✓

## 20.8 — EP-CC-008 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Imzo bosqichli, sakramaydimi?
- Doc Isbot: approve.helpers:36-95 stillPending → keyingi stepOrder; sort
- Tekshiruv: cc-workflow-approve.helpers.ts stillPending filter:37, stepOrders.sort:44, nextOrder:46 ✓; DB tasdiq: ADVANCE 1..5 ketma-ket, CONTRACT_END step 1'da 3 parallel approver (kvorum step ichida) ✓

## 20.9 — EP-CC-009 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: refuted)
- Savol: Rad→sabab majburiy→resubmit?
- Doc Isbot: reject:173 + cc_rejection_reasons; resubmit:192 version+1; signRejection sabab yozadi
- Tekshiruv: reject() workflow.service:173 ✓; signRejection reject-resubmit.helpers:29 ✓; resubmit version+1:201 + snapshotVersion ✓; cc_rejection_reasons=84 qator ✓. AMMO: RejectSchema (controller:50) `rejectionReasonId` VA `comment` ikkalasi `.optional()` — egasi "sabab majburiy" deган, lekin web-DTO majburiy QILMAYDI. Mexanizm bor, majburiylik gate'i yo'q → "majburiy" da'vosi overstated.

## 20.10 — EP-CC-010 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kechikishda avto-eskalatsiya?
- Doc Isbot: cc-sla.cron:161 escalateApprovals; 48h auto-reject(115); LEKIN 2x eslatma sikli + HR yo'q
- Tekshiruv: escalateApprovals() cc-sla.cron:161 state='escalated'+audit ✓; autoRejectOverdue48h():115 ✓; takror-eslatma sikli yo'q, HR'ga maxsus yo'naltirish yo'q ✓ — to'g'ri qisman

## 20.11 — EP-CC-011 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Eskalatsiya muddati shablonga qarabmi?
- Doc Isbot: inbox_sla_hours/reminder_hours/escalation_hours ustunlar; ADVANCE=24, CONTRACT_END/DOKLAD=48; avans 4 soat emas; 15daq/1soat yo'q
- Tekshiruv: 3 ustun mavjud (DB \d) ✓; ADVANCE inbox_sla=24/esc=48, CONTRACT_END inbox=48, DOKLAD inbox=48 ✓; soat birligida (daqiqa emas) ✓ — to'g'ri qisman

## 20.12 — EP-CC-012 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: 3-savat ulanganmi?
- Doc Isbot: cc-baskets.service listBasket/summary/move; basket_state (inbox/pending/outbox/archived); FE BasketColumn; cc_basket_history
- Tekshiruv: cc-baskets.service listBasket:16/summary:21/move:26/getOne:31 ✓; cc_documents.basket_state ustun default 'inbox' + BasketState type 'inbox|pending|outbox|archived' ✓; FE components/cc/BasketColumn.tsx ✓; cc_basket_history jadval ✓

## 20.13 — EP-CC-013 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: 24h qizil+eslatma, 48h boshliqqa?
- Doc Isbot: cc-sla.cron:63 markInboxOverdue; 48h auto-reject(115); GlobalInboxBadge
- Tekshiruv: markInboxOverdue() :63 (basket_entered_at + inbox_sla_hours < NOW → is_inbox_overdue=true + notification) ✓; autoRejectOverdue48h:115 ✓; FE components/cc/GlobalInboxBadge.tsx ✓

## 20.14 — EP-CC-014 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kaskad — bir hujjat ko'p vazifa?
- Doc Isbot: cc-event.listener:52 CcSpawnRequestedEvent → draft + Kanban karta(98-137); LEKIN cc.spawn FAQAT webhook'dan
- Tekshiruv: cc-event.listener handle():52, draft:75, kanban karta INSERT:117-131 ✓; grep cc.spawn emit: FAQAT cc-webhook.controller:99 (domen-trigger yo'q) ✓ — to'g'ri qisman

## 20.15 — EP-CC-015 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Avto-raqam, format sozlanadigan?
- Doc Isbot: cc-document-number atomic pg_advisory_xact_lock + {YYYY}/{SEQ4}; number_format; yil COUNT+1
- Tekshiruv: nextSequence() pg_advisory_xact_lock:51 + COUNT+1 by year:53-58 ✓; applyFormat {YYYY}{YY}{MM}{DD}{SEQ4}:63-76 ✓; tmpl.numberFormat ishlatiladi ✓

## 20.16 — EP-CC-016 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Arxiv o'chmaydi, lavozimga qarab muddat?
- Doc Isbot: cc_documents.archived_at + archive_after_days ustun BOR lekin seed=NULL; 10/3 yil farq yo'q
- Tekshiruv: cc_documents.archived_at ustun ✓; cc_document_templates.archive_after_days ustun ✓; DB count: archive_after_days NOT NULL = 0 (hammasi NULL) ✓; rahbar/ishchi 10/3 yil mantig'i yo'q ✓

## 20.17 — EP-CC-017 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ko'p-mezonli + full-text filtr?
- Doc Isbot: baskets ro'yxatlash bor; to'liq full-text (tsvector/GIN) yo'q; cc_documents=0
- Tekshiruv: cc-baskets.repo listBasket bor; grep tsvector/to_tsvector communication-center'da 0 natija ✓; cc_documents=0 qator ✓ — to'g'ri qisman

## 20.18 — EP-CC-018 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: PDF logo+raqam+imzo zanjiri+sana?
- Doc Isbot: cc-pdf.service pdf-lib EUROPRINT blank + №raqam + IMZOLAR ZANJIRI + QR-URL(177); controller:88 GET pdf; cc_print_log
- Tekshiruv: drawHeader EUROPRINT+№document_number+Sana:107-113 ✓; drawApprovals 'IMZOLAR ZANJIRI':155 ✓; drawFooter QR verify URL:177 ✓; @Get('documents/:id/pdf') controller:88 ✓; cc_print_log jadval + print_requires_reason ustun ✓ (QR=URL matn, rasm emas — doc honest)

## 20.19 — EP-CC-019 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: To'liq ShVB to'plami?
- Doc Isbot: 14 shablon ariza+buyruq+hisobot bor; распоряжение/протокол/приказ to'liq emas; ZNO alohida yo'q
- Tekshiruv: 14 kod: ADVANCE/CONTRACT_END/DOKLAD/FINANCIAL_AID/FIX_ERRORS/IMPROVEMENT/ORDER/REPORT/SALARY_RAISE/SCHEDULE_CHANGE/TRAINING/TRANSFER/VACATION/ZRS_ZVS. Kategoriya: ariza/hisobot/buyruq/xabar. Protokol/распоряжение yo'q ✓ — to'g'ri qisman

## 20.20 — EP-CC-020 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: To'liq status oqimi?
- Doc Isbot: domain/types WorkflowState draft|sent|in_progress|approved|rejected|cancelled|archived; transition()
- Tekshiruv: domain/types.ts:6-8 WorkflowState aniq shu 7 qiymat ✓; transition() write.repo:59 har o'tishda ✓; cc_documents.workflow_state ustun ✓ (eslatma: send→in_progress to'g'ridan; 'sent'/'archived' enum'da bor lekin oqimda kam ishlatiladi)

## 20.21 — EP-CC-021 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Marshrut lavozim-kartasiga bog'lanadimi?
- Doc Isbot: resolver position_code→positions.code/employees orqali; card_id FK ishlatilmaydi
- Tekshiruv: resolveByPosition positions.code orqali:192-204 ✓; to'g'ridan card_id FK yo'q (employees/positions bilvosita) ✓ — to'g'ri qisman

## 20.22 — EP-CC-022 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tasdiqdan oldin AI tahlil (mos/risk/tavsiya)?
- Doc Isbot: approve oqimida AI-tahlil yo'q; AI faqat matn yaratadi
- Tekshiruv: cc-workflow-approve.helpers.ts'da AI chaqiruvi yo'q (faqat signApproval+transition) ✓; AI faqat ai-interview'da ✓ — to'g'ri yoq

## 20.23 — EP-CC-023 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Telegram orqali tasdiqlash + PIN?
- Doc Isbot: cc-bot.service bot.action approve:/reject: → awaiting_pin → verifyAndSign; inline tugmalar; reject_reason oqimi(176-197)
- Tekshiruv: bot.action approve::169 → awaiting_pin_approve, reject::176, reject_reason::177; handleApprovePin→wf.approve:228, handleRejectPin→wf.reject:244 ✓; inline keyboard kiruvchi/kutish/chiquvchi:104-108 ✓

## 20.24 — EP-CC-024 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: In-app + Telegram + email?
- Doc Isbot: cc.gateway WebSocket emitToUser + cc-bot Telegram + cc_notifications jadval; email yo'q
- Tekshiruv: cc.gateway.ts emitToUser:79 (namespace /cc) ✓; cc-bot Telegram ✓; cc_notifications = VIEW (information_schema) ✓; email kanal grep 0 ✓ — to'g'ri qisman

## 20.25 — EP-CC-025 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ko'p fayl/rasm biriktirish?
- Doc Isbot: cc_attachments jadval bor (max_file_size_mb/allowed_file_types ustunlar); upload endpoint yo'q
- Tekshiruv: cc_attachments BASE TABLE mavjud ✓; cc_document_templates.max_file_size_mb + allowed_file_types ustunlar ✓; grep attachment/upload communication-center'da FAQAT PDF Content-Disposition (haqiqiy upload endpoint yo'q) ✓ — to'g'ri qisman

## 20.26 — EP-CC-026 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kim ko'radi — rol-asosli maxfiylik?
- Doc Isbot: baskets user_id filtr (har kim o'z savatini); maydon-darajali RBAC yo'q
- Tekshiruv: cc-baskets user_id bo'yicha; controller @Roles keng (admin..employee:74); maydon×rol projeksiya yo'q ✓ — to'g'ri qisman

## 20.27 — EP-CC-027 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ZVS tasdiq → Finance to'lov navbatiga?
- Doc Isbot: ZRS_ZVS shablon bor; approve oxirida Finance event/outbox yo'q; cc_outbox bo'sh
- Tekshiruv: ZRS_ZVS shablon DB'da ✓; approve.helpers'da outbox/Finance emit yo'q ✓; cc_outbox jadval UMUMAN MAVJUD EMAS (information_schema'da yo'q) — doc "bo'sh/ishlatilmaydi" degan, aslida jadval ham yo'q; xulosa (Finance integratsiya yo'q) to'g'ri yoq

## 20.28 — EP-CC-028 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Summa bo'yicha marshrut matritsasi?
- Doc Isbot: cc_workflow_steps statik (summa-shartsiz); summa-asosli shartli marshrut yo'q
- Tekshiruv: cc_workflow_steps approver_position_code statik (summa ustuni yo'q); resolver hujjat summasini ko'rmaydi ✓ — to'g'ri yoq

## 20.29 — EP-CC-029 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Protokol Coordination'da CC engine reuse?
- Doc Isbot: CC'da protokol shabloni yo'q; engine reuse (event listener) bor lekin Coordination slice ulanish tasdiqlanmadi
- Tekshiruv: 14 shablon ichida protokol yo'q ✓; CcSpawnRequestedEvent listener reuse-mexanizmi bor (event.listener) ✓; Coordination-CC ulanish bu modulda yo'q — to'g'ri qisman

## 20.30 — EP-CC-030 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: To'liq audit izi, o'chmas?
- Doc Isbot: cc_audit_trail har transition (write.repo:97,187,255); cron ham yozadi; append-only INSERT
- Tekshiruv: cc_audit_trail INSERT transition:96-104, cancel:186-189, logPrint:254-257 ✓; cc-sla.cron audit INSERT:84,143,178 ✓; faqat INSERT (UPDATE/DELETE yo'q) ✓; cc_audit_trail BASE TABLE ✓

## 20.31 — EP-CC-031 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Qoralama avto-saqlanadi, davom?
- Doc Isbot: ai-interview:67 findExistingSession (is_completed=false+expires_at>NOW); persistAnswer(139); createDraft
- Tekshiruv: findExistingSession() :77 (start :67'da chaqiriladi) WHERE is_completed=false AND expires_at>NOW ✓; persistAnswer() :139 har javobni saqlaydi ✓

## 20.32 — EP-CC-032 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Hujjat tili uz-lotin/uz-kirill/ru?
- Doc Isbot: language ustun (uz/ru); PDF transliterate(205); 3-yozuv to'liq emas
- Tekshiruv: cc_documents.language varchar(5) default 'uz' ✓; Language type 'uz'|'ru' (domain/types:10) ✓; cc-pdf transliterate():205 ✓; uz-cyr alohida yozuv yo'q ✓ — to'g'ri qisman

## 20.33 — EP-CC-033 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Og'zaki qayd yo'q = qaror yo'q?
- Doc Isbot: CC yozma-only (hamma amal hujjat+PIN+audit); boshqa modullarga majburlovchi gate yo'q
- Tekshiruv: CC ichida har amal PIN+audit talab qiladi (ruh mavjud) ✓; boshqa modullarni og'zaki-bloklash gate yo'q (CC ichida implitsit) ✓ — to'g'ri qisman

## 20.34 — EP-CC-034 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Har shablonga kommunikatsiya-turi tegi (5 tur)?
- Doc Isbot: cc_document_templates'da communication_type ustun YO'Q
- Tekshiruv: \d cc_document_templates — communication_type ustun YO'Q (tasdiqlandi) ✓ — to'g'ri yoq

## 20.35 — EP-CC-035 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 6 tur "yozma majburiy" shablon?
- Doc Isbot: hech biri seed qilinmagan; тех карта/reja/sifat shablonlari yo'q
- Tekshiruv: 14 shablon hammasi HR-ariza turi; тех-карта/reja/sifat shablonlari yo'q ✓ — to'g'ri yoq

## 20.36 — EP-CC-036 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Bevosita rahbarni chetlab o'tish bloklanadimi?
- Doc Isbot: resolver MANAGER_OF_SENDER'dan boshlanadi(57); favqulodda chetlab o'tish + sabab yo'q
- Tekshiruv: resolveBase MANAGER_OF_SENDER:57; DB step seed: aksar shablonlar step 1 = MANAGER_OF_SENDER ✓; "favqulodda istisno" mexanizmi yo'q ✓ — to'g'ri qisman

## 20.37 — EP-CC-037 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Gorizontal vakolat matritsasi?
- Doc Isbot: bo'limlararo ruxsat matritsasi jadvali/kodi yo'q
- Tekshiruv: yuboruvchi×qabul-bo'lim×tur cheklash kodi yo'q; resolver faqat tasdiqlash-marshrut ✓ — to'g'ri yoq

## 20.38 — EP-CC-038 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Analitik hujjat faqat Совершенствование orqali?
- Doc Isbot: tahlil/xulosa shabloni yo'q; 5-dep yo'naltirish yo'q
- Tekshiruv: tahlil shabloni 14 ichida yo'q; maxsus dep-routing yo'q ✓ — to'g'ri yoq

## 20.39 — EP-CC-039 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ikki-tomonlama javobgarlik (yuborildi/ko'rildi vaqt)?
- Doc Isbot: cc_audit_trail performed_by+timestamp; basket_entered_at; LEKIN viewed_at yo'q
- Tekshiruv: cc_audit_trail performed_by_user_id + (created_at) ✓; cc_documents.basket_entered_at ✓; grep viewed_at = 0 (ustun yo'q) ✓ — to'g'ri qisman

## 20.40 — EP-CC-040 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "Javobgar lavozim" maydoni avto-o'tadimi?
- Doc Isbot: marshrut position_code bog'liq; cc_documents'da responsible_position maydoni yo'q
- Tekshiruv: resolver position_code dinamik; grep responsible_position = 0; \d cc_documents'da bunday ustun yo'q ✓ — to'g'ri qisman

## 20.41 — EP-CC-041 [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Delegatsiya faqat delegate amali bilan?
- Doc Isbot: cc_delegations (from/to/starts/ends/is_active); checkDelegation(216); expireDelegations(185)
- Tekshiruv: cc_delegations jadval: from_user_id/to_user_id/starts_at/ends_at/is_active/set_by_user_id/reason ✓; checkDelegation() resolver:216 ✓; expireDelegations() cron:185 ✓ (data=0 qator, mexanizm tayyor)

## 20.42 — EP-CC-042 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Asos: qaysi hujjat" majburiy maydon?
- Doc Isbot: approve/createDraft DTO'da reference majburiy maydon yo'q; sender_comment ixtiyoriy
- Tekshiruv: CreateDraftSchema/ApproveSchema'da strukturali reference maydoni yo'q (faqat senderComment/comment optional) ✓ — to'g'ri yoq

## 20.43 — EP-CC-043 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Versiyalangan, eskisi bloklanadimi?
- Doc Isbot: snapshotVersion + version+1; cc_document_versions; "eskirgan" qulf yo'q
- Tekshiruv: snapshotVersion() write.repo:196 + cc_document_versions ON CONFLICT:203 ✓; updateBody version+1:211 ✓; "eskirgan" status bayroq + qulf yo'q ✓ — to'g'ri qisman

## 20.44 — EP-CC-044 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Maydon-darajali RBAC (СОЗ/ОТК)?
- Doc Isbot: maydon×rol RBAC yo'q; ai_answers bitta JSONB blob
- Tekshiruv: cc_documents.ai_answers JSONB (bitta blob); maydon×rol mapping yo'q ✓ — to'g'ri yoq

## 20.45 — EP-CC-045 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Ma'lumot talabi" shabloni?
- Doc Isbot: shablon seed qilinmagan; talab→javob bog'lash yo'q
- Tekshiruv: 14 shablon ichida ma'lumot-talab yo'q ✓ — to'g'ri yoq

## 20.46 — EP-CC-046 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Reja o'zgartirish" shabloni (tashabbuskor+sabab+natija)?
- Doc Isbot: shablon seed qilinmagan; 3 majburiy maydon yo'q
- Tekshiruv: SCHEDULE_CHANGE shabloni bor LEKIN = "Ish vaqtini o'zgartirish" (HR ish-vaqti, ishlab-chiqarish reja EMAS); egasi nazarda tutgan ishlab-chiqarish reja-o'zgartirish (tashabbuskor/sabab/kutilgan natija) shabloni yo'q ✓ — to'g'ri yoq

## 20.47 — EP-CC-047 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Reja-o'zgartirish sabab 5-guruh dropdown?
- Doc Isbot: reja shabloni yo'q → dropdown ham yo'q
- Tekshiruv: reja-o'zgartirish (ishlab-chiqarish) shabloni yo'q → 5-sabab tasnifi yo'q ✓ — to'g'ri yoq

## 20.48 — EP-CC-048 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 100%dan oldin yopish uchun reja-o'zgartirish shartmi?
- Doc Isbot: reja shabloni yo'q; MES↔CC bloklash yo'q
- Tekshiruv: shablon yo'q; MES-CC bog'liqlik kodi yo'q ✓ — to'g'ri yoq

## 20.49 — EP-CC-049 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Har smena majburiy "smena yakuni" hujjati?
- Doc Isbot: shablon yo'q; spawnRecurringDocuments(197) PLACEHOLDER
- Tekshiruv: smena-yakuni shabloni yo'q; spawnRecurringDocuments() cc-sla.cron:197 "Hozir hech narsa qilmaydi; placeholder" ✓; DB: is_recurring=0, cron_expression=0 ✓ — to'g'ri yoq

## 20.50 — EP-CC-050 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Тунги smena qarori" maxsus hujjat?
- Doc Isbot: shablon seed qilinmagan; eskalatsiya oqimi yo'q
- Tekshiruv: shablon yo'q ✓ — to'g'ri yoq

## 20.51 — EP-CC-051 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Muammo-hujjatga qisqa SLA (15daq/1soat)?
- Doc Isbot: SLA ustunlar SOAT birligida; seed 24/48; 15daq/1soat yo'q
- Tekshiruv: inbox_sla_hours/escalation_hours SOAT birligi (DB integer hours) ✓; daqiqa-darajali SLA yo'q, muammo-shablon yo'q ✓; per-template SLA-mexanizmi mavjud (soat) — to'g'ri qisman

## 20.52 — EP-CC-052 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Muammo yopilganda orgpolitika vazifasi avto?
- Doc Isbot: cc.spawn→draft+Kanban MEXANIZMI bor; lekin domen-emit yo'q; orgpolitika shabloni yo'q
- Tekshiruv: cc-event.listener kaskad mexanizmi bor ✓; cc.spawn faqat webhook'dan emit:99 ✓; orgpolitika shabloni yo'q ✓ — to'g'ri qisman

## 20.53 — EP-CC-053 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Orgpolitika → adaptatsiya o'qitish vazifasi avto?
- Doc Isbot: cc.spawn Kanban kartaga vazifa mexanizmi; orgpolitika-tasdiq→vazifa avto-oqimi yo'q
- Tekshiruv: kanban karta yaratish mexanizmi event.listener:117 ✓; orgpolitika shabloni + 1-kun deadline mantig'i yo'q ✓ — to'g'ri qisman

## 20.54 — EP-CC-054 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Orgpolitika "tanishdim" PIN + ish-bloklash?
- Doc Isbot: cc_policy_acknowledgments jadval/oqim yo'q
- Tekshiruv: cc_policy_acknowledgments jadval MAVJUD EMAS (information_schema tasdiq) ✓ — to'g'ri yoq

## 20.55 — EP-CC-055 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: НАЗОРАТ ВАРАҚАСИ checklist har-mavzu imzo?
- Doc Isbot: checklist-hujjat jadval/shablon yo'q; LMS bog'lanish yo'q
- Tekshiruv: bunday shablon/jadval CC'da yo'q ✓ — to'g'ri yoq

## 20.56 — EP-CC-056 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: тех карта "Лаборатория→Одобрена" imzo bosqichi?
- Doc Isbot: тех карта shabloni yo'q; Одобрена step yo'q; QC-gate yo'q
- Tekshiruv: тех-карта shabloni yo'q; step seed faqat 6 generik kod ✓ — to'g'ri yoq

## 20.57 — EP-CC-057 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: тех карта 4-punkt moslik-checklist?
- Doc Isbot: тех карта shabloni yo'q; checklist yo'q
- Tekshiruv: shablon yo'q ✓ — to'g'ri yoq

## 20.58 — EP-CC-058 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Таъминот заявкаси" shabloni?
- Doc Isbot: shablon yo'q; MM/PO bog'lanish yo'q
- Tekshiruv: taъminot-zayavka shabloni yo'q ✓ — to'g'ri yoq

## 20.59 — EP-CC-059 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Smena хом-ашё заявкаси" 2-soat SLA?
- Doc Isbot: shablon yo'q; 2-soat maxsus SLA yo'q
- Tekshiruv: shablon yo'q ✓ — to'g'ri yoq

## 20.60 — EP-CC-060 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Режа қоғози" rulon-hujjati?
- Doc Isbot: shablon yo'q; fakt-vazn maydon + Finance/Ombor uzatish yo'q
- Tekshiruv: режа-қоғози shabloni yo'q ✓ — to'g'ri yoq

## 20.61 — EP-CC-061 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: СЕРИЯ (kategoriya) tegi?
- Doc Isbot: cc_document_templates.category bor (ariza/buyruq/hisobot/xabar); СЕРИЯ «Технология» domen-seriya emas
- Tekshiruv: category ustun mavjud, qiymatlar: ariza/hisobot/buyruq/xabar ✓; domen-СЕРИЯ (Технология/Moliya) emas ✓ — to'g'ri qisman

## 20.62 — EP-CC-062 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ko'p "maqsad lavozim" → har biriga avto?
- Doc Isbot: target positions maydoni/oqimi yo'q; marshrut bitta zanjir
- Tekshiruv: cc_documents'da multi-target ustun yo'q; marshrut yagona zanjir ✓ — to'g'ri yoq

## 20.63 — EP-CC-063 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Strategik marshrut oxiri = asoschi imzosi?
- Doc Isbot: resolver DIRECTOR "HAMMASI OXIRI DIREKTORGA"(64); asoschi alohida rol/PIN yo'q; orgpolitika shabloni yo'q
- Tekshiruv: resolveDirector "HAMMASI OXIRI DIREKTORGA" comment:7,64 ✓; DB step seed: aksar shablonlar oxirgi step=DIRECTOR ✓; "asoschi" (Ayubxon Pozilov) alohida rol/PIN yo'q ✓ — to'g'ri qisman

## 20.64 — EP-CC-064 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Orgpolitika 3-bosqich marshrut (dep→bosh→НО-3)?
- Doc Isbot: orgpolitika shabloni + maxsus marshrut seed qilinmagan
- Tekshiruv: orgpolitika shabloni yo'q; maxsus 3-bosqichli orgpolitika marshruti yo'q ✓ — to'g'ri yoq

## 20.65 — EP-CC-065 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yagona rasmiy kanal (Bitrix o'rniga)?
- Doc Isbot: CC ichki kanal sifatida qurilgan (workflow+PIN+PDF); webhook tashqi qabul; Bitrix migratsiya faol emas
- Tekshiruv: CC to'liq kanal (workflow/PIN/PDF/webhook) ✓; A-System/Bitrix ko'chirish jarayoni yo'q ✓ — to'g'ri qisman

## 20.66 — EP-CC-066 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Oy oxirida oylik tahlil-hujjat avto?
- Doc Isbot: oylik agregatsiya cron yo'q (cron faqat SLA/escalation); reja-statistika yo'q
- Tekshiruv: cc-sla.cron faqat SLA/escalation/delegation/recurring-placeholder ✓; oylik tahlil-cron yo'q ✓ — to'g'ri yoq

## 20.67 — EP-CC-067 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tahlil-hujjat sabab-markazli + izoh maxfiy?
- Doc Isbot: tahlil-hujjat shabloni/formati yo'q
- Tekshiruv: shablon yo'q ✓ — to'g'ri yoq

## 20.68 — EP-CC-068 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Reja yopishda operator izohi majburiy?
- Doc Isbot: bu MES gate; CC'da reja-yopish izoh-majburiyligi yo'q
- Tekshiruv: CC reja-shablonsiz; MES integratsiya yo'q ✓ — to'g'ri yoq

## 20.69 — EP-CC-069 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Keyin rasmiylashtir" tugma + eslatma?
- Doc Isbot: tugma + og'zaki→yozma majburlash yo'q
- Tekshiruv: bunday oqim CC'da yo'q ✓ — to'g'ri yoq

## 20.70 — EP-CC-070 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Har darajada rahbar xulosa qo'shib yuqoriga?
- Doc Isbot: "rahbar xulosasi" maydoni yo'q; approve comment ixtiyoriy
- Tekshiruv: ApproveSchema comment optional (strukturali umumlashtirish emas) ✓ — to'g'ri yoq

## 20.71 — EP-CC-071 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Maydonlar rolga bog'liq (texnik/savdo)?
- Doc Isbot: maydon×rol RBAC yo'q (EP-CC-044 bilan bir xil); ai_answers rolsiz
- Tekshiruv: ai_answers JSONB rolsiz; maydon×rol mapping yo'q ✓ — to'g'ri yoq

## 20.72 — EP-CC-072 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Sifat ogohlantirishi" ОТК→СОЗ tez-oqim?
- Doc Isbot: shablon yo'q; ishtirokchi avto-chaqirish yo'q; QC bog'lanish yo'q
- Tekshiruv: sifat-ogohlantirish shabloni yo'q ✓ — to'g'ri yoq

## 20.73 — EP-CC-073 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Sifat ишчи журнали" append-only registr?
- Doc Isbot: sifat-журнал shabloni yo'q (umumiy audit bor, sifat alohida emas)
- Tekshiruv: sifat-журнал registri yo'q ✓ — to'g'ri yoq

## 20.74 — EP-CC-074 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Tasdiqlangan hujjat immutable (faqat qarama-qarshi yozuv)?
- Doc Isbot: immutability WORKFLOW darajasida; DB-trigger/constraint UPDATE-bloklash yo'q
- Tekshiruv: workflow draft-only tahrir; audit append-only; DB-darajada UPDATE-bloklash trigger/constraint yo'q (texnik UPDATE mumkin) ✓ — to'g'ri qisman

## 20.75 — EP-CC-075 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 3 yozuv (lotin/kirill/ru), default=asl til?
- Doc Isbot: language 'uz'/'ru' (EP-CC-032); PDF transliterate; uz-cyr alohida emas
- Tekshiruv: language varchar(5) 'uz'/'ru'; uz-cyr alohida yozuv yo'q ✓ — to'g'ri qisman

## 20.76 — EP-CC-076 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qog'oz skan + meta → arxivda qidiriladigani?
- Doc Isbot: skan-yuklash + meta-arxiv oqimi yo'q (cc_attachments bor lekin ulanmagan); OCR yo'q
- Tekshiruv: cc_attachments jadval bor, skan-arxiv upload oqimi yo'q ✓ — to'g'ri yoq

## 20.77 — EP-CC-077 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Har lavozimga РД/НО kod, marshrut kod bilan?
- Doc Isbot: resolver POSITION:<CODE>(192) — РД texnik mumkin; lekin seed kodlar generik (DIRECTOR/MANAGER_OF_SENDER/CFO/HR_HEAD/KASSIR); РД-2/4/5/НО kodlari yo'q
- Tekshiruv: resolveByPosition POSITION:<CODE> :192 ✓; DB distinct step kodlar: CEO/DIRECTOR/MANAGER_OF_SENDER/POSITION:CFO/POSITION:HR_HEAD/POSITION:KASSIR — РД/НО kodlari YO'Q ✓ — to'g'ri qisman (mexanizm bor, data yo'q)

## 20.78 — EP-CC-078 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Bo'limlararo qaror protokoli" ko'p-imzo (kvorum)?
- Doc Isbot: protokol shabloni + kvorum mexanizmi yo'q
- Tekshiruv: protokol shabloni yo'q; kvorum mexanizmi (step-ichida parallel approver bor, lekin protokol-shablon yo'q) ✓ — to'g'ri yoq

## 20.79 — EP-CC-079 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Deadline uzilish → "tashkiliy xato — javobgar bo'lim" avto?
- Doc Isbot: tashkiliy-xato avto-qayd yo'q (SLA overdue bayroq bor, javobgar-bo'lim yozuvi emas)
- Tekshiruv: is_inbox_overdue + escalated bayroq bor; "javobgar bo'lim tashkiliy xato" yozuvi yo'q ✓ — to'g'ri yoq

## 20.80 — EP-CC-080 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ekranda "rasmiy=faqat yozma" qoida ko'rsatkichi?
- Doc Isbot: ekran qoida-ko'rsatkichi + faqat-yozma belgilash yo'q; reja-shablon yo'q
- Tekshiruv: bunday UI-gate yo'q ✓ — to'g'ri yoq

## 20.81 — EP-CC-081 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Orgpolitika" 4-bo'lim shabloni?
- Doc Isbot: orgpolitika shabloni seed qilinmagan; 4-bo'limli struktura yo'q
- Tekshiruv: orgpolitika shabloni yo'q (14 ichida yo'q) ✓ — to'g'ri yoq

## 20.82 — EP-CC-082 [DOC: 🟡 qisman] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Hujjatlar zanjir (ota-bola), natija qaytaradimi?
- Doc Isbot: parent_document_id ustun BOR + read.repo:81 o'qiydi; LEKIN HECH QACHON YOZILMAYDI — funksional emas
- Tekshiruv: cc_documents.parent_document_id ustun + cc_doc_parent_idx + FK cc_doc_parent_fk ✓; read.repo:81 "parentDocumentId" o'qiydi ✓; AMMO grep tasdiq: parent_document_id FAQAT types.ts:27 (declaration) + read.repo:81 (read) — createDraft INSERT'da YO'Q, hech qaysi UPDATE set qilmaydi. **Funksional jihatdan YO'Q** (yozilmaydigan ustun = ishlamaydigan feature). Doc flag 🟡 generous; real holat yoq. Doc Isbot matni o'zi honest, lekin flag-darajasi overstated.

## 20.83 — EP-CC-083 [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Smena biriktirish" hujjati (dastgoh+operator+KPI)?
- Doc Isbot: shablon yo'q; dastgoh×operator загрузка + KPI yo'q
- Tekshiruv: smena-biriktirish shabloni yo'q ✓ — to'g'ri yoq

## 20.84 — EP-CC-084 [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "Shoshilinch" → sabab+yuqori tasdiqlovchi majburiy?
- Doc Isbot: cc_documents.priority (low/normal/high/urgent) + savat sort; urgent tanlanganda sabab+tasdiqlovchi MAJBURIY gate yo'q
- Tekshiruv: cc_documents.priority ustun + Priority type 'low|normal|high|urgent' ✓; CreateDraftSchema.priority enum, hech qanday "urgent→sabab majburiy" gate yo'q (har kim urgent qo'ya oladi) ✓ — to'g'ri qisman
