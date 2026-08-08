## [V/VERIFY] Communication-Center (20) — cross-ref hal qilindi

> Manba kod: `apps/api/src/modules/communication-center/` (CC moduli REAL), DDL `apps/api/drizzle/0006_communication_center.sql` (15 model). Grep-larda `ai_draft`, `number_assigned_at`, `communication_type`, `viewed_at`, `self_route`, `ambiguous_route`, `cc_policy_acknowledgments`, `tsvector` — CC modulida TOPILMADI (faqat docs).

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 1 | Ikki karta → shablon rol-kartasi bosqichi | Qisman | Qisman | Marshrut `cc_workflow_steps.approver_position_code` orqali (`POSITION:<CODE>`) hal etiladi — `cc-org-resolver.service.ts:192-213` resolveByPosition LIMIT 1 faol xodim; qaysi KARTA tasdiqlaydi tanlash (card_id) yo'q — position-kod bilvosita |
| 2 | I.o. imzo audit izda i.o.+asosiy karta (РД) | cross-ref | Qisman | Delegatsiya bor (`cc-org-resolver.service.ts:216` checkDelegation → o'rinbosar approver bo'ladi); lekin `cc_audit_trail` (0006:191-206) faqat `performed_by_user_id` — i.o.+asosiy ikkala manzil/РД kod ustuni YO'Q |
| 3 | Ikki uchastka → shablon bo'lim aniq, aks holda ambiguous_route log | cross-ref | Qisman | Har step bitta `approver_position_code` (dizayn bo'yicha noaniqlik yo'q); hal bo'lmasa generik `logger.warn "approver unresolvable — skipping"` (`cc-workflow.service.ts:138`); `ambiguous_route` maxsus log/tushunchasi YO'Q |
| 5 | AI asl varianti `ai_draft` immutable saqlanadi | cross-ref | Qisman | `ai_draft` ustun/kod YO'Q (grep bo'sh); `cc_document_versions` (0006:212, snapshotVersion `cc-documents-write.repo.ts:196`) ai_body versiyalarini saqlaydi — lekin AI-asl vs xodim-tahrir ajratuvchi maxsus immutable maydon yo'q |
| 6 | Smena xulosasi 3s kech → event eskalatsiya (rahbar+HR,+2s direktor) | Qisman | Qisman | Generik deadline-SLA eskalatsiya bor (`cc-sla.cron.ts:161` escalateApprovals, :115 48h auto-reject); event-driven smena-xulosa + rahbar/HR/+2s direktor darajalari YO'Q; recurring cron `cc-sla.cron.ts:197` PLACEHOLDER (bo'sh) |
| 7 | Tungi smena rad → "ziddiyatli ijro" yozuvi | cross-ref | Yo'q | "ziddiyatli ijro"/conflict-execution qaydi YO'Q; reject faqat `workflow_state='rejected'` (`cc-workflow.service.ts:211`); tungi-smena maxsus hujjat yo'q (grep bo'sh) |
| 8 | Тех карта immutable — o'zgarish=yangi versiya | Qisman | Qisman | CC umumiy versiyalash bor (`cc_document_versions` 0006:212); CC ichida тех-карта shabloni/immutable oqimi YO'Q (тех-карта = alohida `technology_cards` moduli, ADR-006) |
| 9 | Gorizontal vakolat matritsasi faqat super-admin | cross-ref | Yo'q | Gorizontal vakolat matritsa jadval/kod YO'Q (grep bo'sh); marshrut faqat statik `cc_workflow_steps` |
| 10 | Bog'liq hujjat rad → "eskirgan manba" belgi | cross-ref | Yo'q | `parent_document_id` ustun bor (0006:103, read-only `cc-documents-read.repo.ts:81`), lekin `cc-documents-write.repo.ts` HECH set qilmaydi; "eskirgan manba" belgi/kaskad YO'Q |
| 11 | Ota tasdiq/jarayonda bo'lsagina bola yaratiladi | cross-ref | Yo'q | createDraft'da `parentDocumentId` parametri YO'Q (`cc-documents-write.repo.ts:30`); ota-holat gate qilmaydi |
| 13 | Orgpolitika tasdiq → Kanban "Adaptatsiya" 1kun,24s eskalatsiya | cross-ref | Qisman | Generik CC→Kanban ko'prik bor (`cc-kanban-bridge.service.ts` createCardForDocument, `cc-event.listener.ts:101`); orgpolitika-maxsus "Adaptatsiya" 1-kun vazifa + 24s eskalatsiya + orgpolitika shabloni YO'Q |
| 14 | "Tanishdim" middleware + cc_policy_acknowledgments jadval | cross-ref | Yo'q | `cc_policy_acknowledgments` jadval YO'Q (grep faqat docs); middleware/gate yo'q |
| 15 | Fayllar UUID+hujjat-raqam, immutable | cross-ref | Qisman | `cc_attachments` jadval bor (0006:178, `file_name/file_url`); UUID+raqam nomlash majburlanmagan (file_name as-is); upload endpoint yo'q (B-20 #25) |
| 16 | PIN-imzo idempotent, unique(doc+card+step), 409 | Qisman | Qisman | PIN imzo real (`cc-pin.service.ts:55` verifyAndSign, sha256); `cc_approvals` (0006:155-171) da unique(document,approver,step) constraint YO'Q; sig-hash `Date.now()` (deterministik emas); ikki-imzo faqat state='pending' tekshiruvi bilan bloklanadi (409 idempotency yo'q) |
| 17 | Telegram bloklansa fallback in-app SSE 3×10daq, email keyingi faza | cross-ref | Qisman | In-app (`cc_notifications`) + Telegram (`cc-bot.service.ts`) + WebSocket (`cc.gateway`) bor; 3×10daq retry zanjiri YO'Q; email keyingi faza (B-20 #24) |
| 18 | Bekor org-sxema tasdiqidan, huquq direktor/super-admin | cross-ref | Qisman | `cancel()` majburiy sabab+PIN bilan bor (`cc-workflow.service.ts:254`), LEKIN faqat yuboruvchi (`:256` senderUserId), org-tasdiq bosqichi + direktor/super-admin cheklovi YO'Q |
| 20 | Full-text tsvector (kirill+lotin) GIN <200ms | cross-ref | Yo'q | `cc_documents` indekslari btree (0006:130-138); tsvector/GIN/full-text YO'Q (grep bo'sh); savat ro'yxati oddiy filtr `cc-baskets.repo.ts:41` |
| 21 | O'zi-o'ziga yubora olmaydi, self_route_blocked | cross-ref | Qisman | `self_route_blocked` bayroq YO'Q; ammo manager-walk `head_user_id <> ${senderUserId}` bilan yuboruvchini o'z-approver qilishni istisno qiladi (`cc-org-resolver.service.ts:156`); barcha step-turlarga umumiy self-route blok yo'q |
| 23 | Sifat ishchi jurnali append-only + correction | cross-ref | Yo'q | Sifat-журнал registri/shabloni YO'Q (grep bo'sh; QC ulanish yo'q, B-20 #73); `cc_audit_trail` append-only lekin bu hujjat-audit, sifat-jurnal emas |
| 24 | Raqamlash yil boshida noldan, oldingi yil o'z seriyasida | Qisman | **Ha** | `nextSequence` COUNT `WHERE EXTRACT(YEAR FROM created_at) = ${year}` + 1 (`cc-document-number.service.ts:53-58`); yil bo'yicha reset + advisory_xact_lock atomic |
| 25 | Tashkiliy xato avto-qayd (statistika, KPI=inson) | cross-ref | Yo'q | Tashkiliy-xato avto-qayd/statistika YO'Q (grep bo'sh; B-20 #79); faqat `is_inbox_overdue` bayroq |
| 26 | PDF BullMQ queue + "tayyorlanmoqda" + SSE | cross-ref | Qisman | PDF real (`cc-pdf.service.ts`, GET pdf) LEKIN sinxron pdf-lib; BullMQ queue + "tayyorlanmoqda" + SSE polling YO'Q |
| 27 | Ikki bo'lim tahrir → optimistik locking + maydon RBAC | cross-ref | Qisman | `version` ustun + `FOR UPDATE` pessimistik lock (transition/cancel) bor; `updateBody` (`cc-documents-write.repo.ts:211`) da optimistik `WHERE version=old` tekshiruvi YO'Q; maydon-daraja RBAC YO'Q (B-20 #44) |
| 28 | "Ma'lumot talabi" → asosiy "kutish"+bog'liq SLA | cross-ref | Yo'q | "Ma'lumot talabi" shabloni + kutish-holat kaskadi YO'Q (grep bo'sh; B-20 #45); `pending` savat generik |
| 29 | Xom-ashyo zayavka 2s SLA kech → qayd | cross-ref | Yo'q | Xom-ashyo zayavka shabloni + 2s SLA YO'Q (grep bo'sh; B-20 #59); SLA generik soat (seed 24/48) |
| 31 | Rahbar xulosasi asl hujjatda immutable maydon | cross-ref | Qisman | `cc_approvals.comment` (0006:162) har bosqichda imzolangan izoh saqlaydi (ixtiyoriy); hujjatga rollup qiluvchi strukturali immutable "rahbar xulosasi" maydoni YO'Q (B-20 #70) |
| 32 | Yagona cc_documents, document_type_id + JSONB metadata | cross-ref | **Ha** | Yagona `cc_documents` jadval (0006:80) `template_id` (=hujjat turi) + `ai_answers jsonb` metadata (0006:98); yangi shablon migratsiyasiz |
| 33 | Delegatsiya max 3 daraja chuqurlik | cross-ref | Qisman | `cc_delegations` (0006:224) + checkDelegation bitta-hop hal qiladi (`cc-org-resolver.service.ts:216`); zanjir chuqurligi (max 3) enforce YO'Q — faqat 1 daraja |
| 34 | Arxiv filtri seriya×lavozim AND | cross-ref | Yo'q | Arxiv seriya×lavozim AND filtri YO'Q; savat filtri faqat egasi bo'yicha (`cc-baskets.repo.ts:37`); domen-seriya yo'q (B-20 #61) |
| 35 | Asoschi imzosi o'tkazilmaydi, i.o. yo'q, timeout yo'q | cross-ref | Yo'q | Asoschi-maxsus himoya YO'Q — DIRECTOR zanjir oxiri bor (`cc-org-resolver.service.ts:73`) lekin delegatsiya (checkDelegation) va 48h auto-reject BARCHA userga tegishli; asoschiga no-delegate/no-timeout istisno amalga oshirilmagan |
| 36 | Yangi versiya → eski Kanban "eskirgan" belgi | cross-ref | Yo'q | Versiya oshganda Kanban "eskirgan/stale" belgilash YO'Q; version→kanban bog'lanish yo'q (grep bo'sh) |
| 37 | Moliyaviy bog'lanish uzilmaydi, GL haqiqiy qoladi | cross-ref | Yo'q | CC↔GL bog'lanish YO'Q (faqat kassir-bildirishnoma event); `parent_document` yozilmaydi; "eskirgan manba" GL-link saqlash mexanizmi yo'q |
| 40 | Og'zaki→yozma eslatma 4s, 24s "hujjatsiz" belgi | cross-ref | Yo'q | Og'zaki→yozma eslatma oqimi YO'Q (grep bo'sh; B-20 #69) |
| 42 | "Yozma majburiy" 6 tur — chat toast, blok yo'q | cross-ref | Yo'q | 6 majburiy-yozma tur + chat toast YO'Q (grep bo'sh; B-20 #35,#42) |
| 44 | Arxiv muddati yaratilgan-vaqt lavozimi bo'yicha qotadi | cross-ref | Qisman | `cc_document_templates.archive_after_days` ustun bor (0006:36), LEKIN seed=NULL (B-20 #16); yaratilish-vaqti lavozim bo'yicha muddat qotirish amalga oshirilmagan |
| 47 | "Ko'rildi" faqat ERP'da, ERP yuridik asos | cross-ref | Qisman | `cc_notifications.read_at`/`is_read` (0006:258) bildirishnoma-o'qildi bor; hujjat-daraja "ko'rildi" `viewed_at` timestamp + ERP-yuridik-asos ajratmasi YO'Q (grep bo'sh) |
| 48 | Favqulodda chetlab o'tish avto-qayd + rahbar+HR/direktor tekshiruvi | cross-ref | Yo'q | Favqulodda-chetlab-o'tish mexanizmi YO'Q; `MANAGER_OF_SENDER` majburiy (B-20 #36,#48); chetlab-o'tish+avto-qayd yo'q |
| 49 | GL yozuvi hujjat tasdiqda trigger, reference=ZVS raqami | Qisman | Qisman | Approve→`CcDocumentFullyApprovedEvent` faqat ADVANCE/FINANCIAL_AID uchun (`cc-workflow.service.ts:186-202`) → `cc-approved-kassir.listener.ts` — bu FAQAT kassir bildirishnoma (":10-11 To'lov AVTO yaratilmaydi"); GL yozuvi + `reference_document=ZVS` trigger YO'Q |

### Yakuniy hisob
- **Ha (2):** #24, #32
- **Qisman (19):** #1, #2, #3, #5, #6, #8, #13, #15, #16, #17, #18, #21, #26, #27, #31, #33, #44, #47, #49
- **Yo'q (17):** #7, #9, #10, #11, #14, #20, #23, #25, #28, #29, #34, #35, #36, #37, #40, #42, #48
- **data-check kerak (0)**
