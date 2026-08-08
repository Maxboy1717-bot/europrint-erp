# SECTION 1 — MODUL STATUS (s1e)

Modullar: Koordinatsiya/CC, Chat, Org-struktura, POS
Sana: 2026-06-06 · Usul: jonli kod (fayl:satr) + DB SELECT (`_audit/q.cjs`, read-only).
Eslatma: Jonli DB qurilish bosqichida — deyarli barcha jadval mavjud lekin **0 qator**
(ko'chiriladigan data yo'q). "0 qator" = infratuzilma tayyor, lekin hali ishlatilmagan;
bu YASHIL-YOLG'ON EMAS (kod real INSERT/SELECT qiladi, faqat hali yozuv kiritilmagan).

---

### Koordinatsiya / Communication Center (CC)

CC = `communication-center` moduli (6 controller, `/api/cc/*`) + `coordination` (director moduli ichida, `/api/coordination/*`).

**CC controllerlar (`apps/api/src/modules/communication-center/presentation/`):**
- Jami route: 30 · REAL: 29 · 501-stub: 0 · yashil-yolg'on: 1 (qisman) · dublikat: 0
  - ai 4 · baskets 7 · documents 14 · notification-prefs 3 · public 1 · webhook 1

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| POST /cc/documents/draft + send/approve/reject/resubmit/cancel/complaint/print | REAL | cc-documents.controller.ts:160-258 → CcWorkflowService → CcDocumentsRepository (db.transaction cc-workflow.service.ts:200) |
| GET /cc/templates, /cc/documents/:id/rejection-reasons | REAL | cc-documents.controller.ts:100-134 (real runQuery SELECT cc_document_templates / cc_rejection_reasons) |
| POST /cc/pin, GET /cc/pin/status | REAL | cc-documents.controller.ts:140-154 → CcPinService |
| GET /cc/documents/:id/pdf | REAL | cc-documents.controller.ts:88-95 → CcPdfService.generate (Buffer) |
| GET /cc/baskets/inbox\|pending\|outbox\|summary\|:id, stats/kpi, POST :id/move | REAL | cc-baskets.controller.ts:54-117 → CcBasketsService/CcStatsService |
| POST/GET/PUT /cc/notification-prefs | REAL | cc-notification-prefs.controller.ts:37-63 → repo.upsert/getOrDefault (izoh:43 — oldin {success:true} yashil-yolg'on edi, tuzatilgan) |
| POST /cc/ai/start, sessions/:id/answer\|finalize, GET sessions/:id | REAL | cc-ai.controller.ts:49-95 → CcAiInterviewService |
| GET /cc/verify/:id (Public, JWTsiz) | REAL | cc-public.controller.ts:54-91 (real SELECT cc_documents+cc_approvals, QR tekshiruv) |
| POST /cc/webhooks/:source | REAL (qisman) | cc-webhook.controller.ts:56-102 — HMAC+idempotency+event emit REAL; LEKIN audit yozuvi `SELECT 1 placeholder` (:94-96) — webhook log jadvali YO'Q, voqea jadvalga yozilmaydi |

**Coordination controller (`apps/api/src/modules/director/presentation/coordination.controller.ts`):**
- Jami route: 14 · REAL: 13 · 501-stub: 0 · yashil-yolg'on: 1 · dublikat: 0

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET /coordination/councils | YASHIL-YOLG'ON | coordination.controller.ts:38-47 — hardcoded 5 ta kengash massivi; DB jadval `coordination_councils` YO'Q (DB count=0) |
| GET baskets, dokla, rasporyazhenie, stats | REAL | :51-184 → CoordinationService → coordination.repository.ts (Drizzle `dokla`/`rasporyazhenie`) |
| POST dokla, rasporyazhenie | REAL | :59-110 → createDoklaWithValidation/createRaspWithValidation (real INSERT) |
| PATCH dokla/:id (+ /read, /resolved), rasporyazhenie/:id (+ /done) | REAL | :78-166 → updateDoklaWithAuth/updateRaspWithAuth/markRaspDoneWithAuth (auth-gated UPDATE) |
| DELETE dokla/:id, rasporyazhenie/:id | REAL | :92-176 → deleteDoklaWithAuth/deleteRaspWithAuth |

**DB:** cc_documents=0 · cc_document_templates=0 · cc_approvals=0 · cc_rejection_reasons=0 · cc_notification_prefs=0 · cc_ai_sessions=0 · cc_audit_trail=0 · dokla=0 · rasporyazhenie=0 (bor, 0 qator). Webhook log jadvali = YO'Q. coordination_councils = YO'Q (hardcoded).

Holat: CC hujjat-aylanish (draft→send→approve→PIN→PDF→QR-verify) to'liq REAL repo+transaction bilan; faqat webhook audit-log va `councils` ro'yxati real emas. Koordinatsiya (dokla/rasporyazhenie) real CRUD, faqat `getCouncils` hardcoded.

---

### Chat

`apps/api/src/modules/chat/` — 6 controller. Ikki prefiks: `/chat` (4 ta) va `/hr-v2/chat` (2 ta — parallel/legacy prefiks).

- Jami route: 56 · REAL: 56 · 501-stub: 0 · yashil-yolg'on: 0 · dublikat: ~4 (prefiks bo'yicha takror)
  - chat 16 · chat-ext 19 · chat-advanced 5 · chat-advanced-uploads 5 · chat-reactions 6 · chat-uploads 5

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET/POST /chat rooms (direct, group, messages, members, read, mute), employees, birthdays, unread, updateRoom | REAL | chat.controller.ts:55-244 → ChatService; updateRoom UPDATE chat_rooms (:217-225) |
| Notifications (get, read-all, :id/read), search, message-tasks, context-room, admin/* (rooms/members/archive/role/audit-logs), pin/star | REAL | chat-ext.controller.ts:45-264 → ChatNotifications/ChatAdmin/Chat/ChatMessage servislari |
| edit/delete message, toggle/remove reaction, create/vote poll | REAL | chat-reactions.controller.ts:48-134 → ChatService |
| push subscribe/unsubscribe, upload request-url/complete, video token | REAL | chat-uploads.controller.ts:80-176 → Push/Upload/VideoToken servislari |
| (`/hr-v2/chat`) pinned, reactions, pin, polls, vote | REAL | chat-advanced.controller.ts:49-173 → ChatService + gateway emit |
| (`/hr-v2/chat`) thread get/send, forward, upload request-url/complete | REAL | chat-advanced-uploads.controller.ts:48-173 → getThreadMessages/forwardMessage/uploadFileAndSendMessage |

**Dublikat:** `/hr-v2/chat/upload/request-url`+`/complete` (advanced-uploads) `/chat/upload/request-url`+`/complete` (uploads) bilan ust-ust; butun `/hr-v2/chat` prefiks `/chat` ga parallel (reactions/pin/poll ikkala tomonda). Bir ChatService'ga boradi, lekin ikki URL oilasi = client chalkashligi.

**DB:** chat_rooms=0 · chat_messages=0 · **chat_members=0** (jadval nomi `chat_members`, `chat_room_members` EMAS) · chat_reactions=0 · chat_polls=0 + chat_poll_votes=0 · chat_message_tasks=0 · chat_push_subscriptions=0 · chat_starred_messages=0 · chat_video_calls=0 + ~4 boshqa chat_*. Hammasi bor, 0 qator.

Holat: Chat to'liq REAL va boy (thread/forward/poll/reaction/pin/push/video/admin) — stub yoki echo yo'q. Yagona muammo: `/chat`╳`/hr-v2/chat` ikki parallel prefiks (legacy migratsiya tugamagan).

---

### Org-struktura

`apps/api/src/modules/org-structure/org-structure.controller.ts` — 1 controller, `/api/org-structure/*`.

- Jami route: 23 · REAL: 23 · 501-stub: 0 · yashil-yolg'on: 0 · dublikat: 0

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET hierarchy, stats, nodes/flat, nodes/:id | REAL | org-structure.controller.ts:101-126 → OrgStructureService |
| POST/PATCH/DELETE nodes, nodes/:id/move, users/:userId/node | REAL | :131-175 → create/update/remove/move/assignUserToNode (.strict() Zod, head_user_id mapping) |
| GET export/excel, export/pdf | REAL | :181-203 → OrgExportService (real xlsx/pdf Buffer) |
| GET/POST/DELETE nodes/:id/folder, employees/:userId/folder | REAL | :210-242 → PositionFolderService |
| GET nodes/:nodeId/history | REAL | :248-258 — real SELECT node_hr_requests (oldin 501-stub edi; @ApiResponse 501 izoh qoldiq, kod real query) |
| GET/POST nodes/:nodeId/hr-requests | REAL | :263-287 → portretService.getHrRequests/createHrRequest |
| GET/POST nodes/:nodeId/portret | REAL | :292-310 → NodePortretService.getPortret/savePortret (org_node_portret upsert) |
| GET nodes/:nodeId/approval-chain, direct-manager, telegram-group | REAL | :315-334 → service (CC org-resolver bilan bog'liq) |

**DB:** org_departments=0 (asosiy daraxt) · org_node_portret=0 · node_hr_requests=0. Bor, 0 qator.

Holat: Org-struktura to'liq REAL: daraxt CRUD + move + export + papka + portret + HR-so'rov + boshqaruvchi-zanjir. Stub/echo yo'q. `getNodeHistory` da @ApiResponse 501 izohi eski (kod real). DB bo'sh = hali tugun kiritilmagan.

---

### POS

`apps/api/src/modules/pos/presentation/` — 24 controller, asosan `/api/pos/*` (+`/legacy/pos`, `/v2/pos`).

- Jami route: 168 · REAL: 167 · 501-stub: 0 · yashil-yolg'on: 1 · dublikat: bir nechta prefiks ust-ust

| Controller (route) | Holat | Dalil (fayl:satr) |
|---|---|---|
| cash-register (8) `/pos` | REAL | cash-register.controller.ts:32-87 → CashRegisterService (products/scan/transactions CRUD/refund/receipt/dashboard) |
| pos (19) `/legacy/pos` | REAL | pos.controller.ts:49-215 → PosService/PosInventoryService (movement-types/warehouse-access/movements/passports/barcodes/pdf-templates) |
| warehouse-features (21) `/pos/wh-features` | REAL | warehouse-features.controller.ts:55-291 → 8 servis (employees/auto-barcode/material360/autoGl/kpi/GRN/quarantine/3-way-match) |
| gl (6) `/pos/gl` | REAL | gl.controller.ts:35-86 → GlPostingLogService (5-bosqich GL log, approve/reject/journal) |
| mini-app (6) `/pos/mini-app` (Public, Telegram) | REAL | mini-app.controller.ts:67-122 → PosTelegram/Barcode/Request/MiniApp (initData auth, scan, requests approve/reject) |
| sync (3) `/pos/sync` | REAL | sync.controller.ts:49-72 → PosSyncService (offline push/pull/status, idempotency) |
| movements(9), reports(9), employee(12), stock(6), inventory-count(7), barcode(7), procurement(6), requests(6), inventory-passport(5), mini-app-history(3), pos-wms(5), pos-operations(7), pos-notifications(3), printer-config(5), pos-printer-config-v2(1), warehouse-config(5), pos-auth(3) | REAL | har biri dedicated servisga delegatsiya (grep: real servis chaqiruvlari; pos-notifications → getForUser/markRead/markAllRead) |
| **pos-stub** (6) `/pos` | REAL×5 + YASHIL×1 | pos-stub.controller.ts: createSale/getSalesDaily/low-stock/movements/monthly-report REAL (CashRegister/StockLedger, :101-141); **adjustInventory (:146-151) YASHIL-YOLG'ON** — `{ productId, adjusted: true, ...dto }` echo, DB ga yozmaydi (LEGACY_NOOP izoh:143) |

**Dublikat/ziddiyat:**
- Bir nechta controller `@Controller('pos')` (cash-register, pos-stub) bir prefiksni bo'lishadi; tranzaksiya yozish ikki yo'l: `/pos/transactions` (cash-register) va legacy `/pos/sales` (pos-stub→bir xil servisga ko'prik, pos-stub:96-110).
- inventory adjust ikki dunyo: legacy `/pos/inventory/:id/adjust` (echo) ╳ real `pos-v2` WmsInventoryService (izoh:143-145).

**DB (bor / 0 qator):** pos_transactions=0 (NB: `retail_pos_transactions` YO'Q) · pos_movements=0 + pos_movement_lines/types=0 · pos_warehouse_access=0 · pos_inventory_passport=0 · pos_pdf_templates=0 · pos_gl_posting_log=0 + pos_gl_postings=0 · warehouse_employees=0 · stock_ledger=0 · retail_pos_products=0 + ~40 boshqa pos_*.

Holat: POS = eng katta va eng to'liq modul (168 route, 24 controller, ~50 jadval, ~30 servis) — hammasi real DB persistence. Yagona soxta: legacy `adjustInventory` echo. DB bo'sh (qurilish bosqichi). Asosiy zaiflik: bir nechta legacy/v2 prefiks ust-ust (pos/legacy-pos/v2-pos; pos/sales╳pos/transactions).

---

## Yig'indi (raqamlar)

| Modul | Controller | Jami route | REAL | 501-stub | Yashil-yolg'on | Dublikat |
|---|---|---|---|---|---|---|
| CC (cc-*) | 6 | 30 | 29 | 0 | 1 (webhook audit placeholder) | 0 |
| Koordinatsiya | 1 | 14 | 13 | 0 | 1 (getCouncils hardcoded) | 0 |
| Chat | 6 | 56 | 56 | 0 | 0 | ~4 (`/hr-v2/chat`╳`/chat`) |
| Org-struktura | 1 | 23 | 23 | 0 | 0 | 0 |
| POS | 24 | 168 | 167 | 0 | 1 (adjustInventory echo) | bir nechta prefiks |
| **JAMI** | **38** | **291** | **288** | **0** | **3** | ~5 (prefiks) |

Umumiy baho: 4 modul ham yetuk va asosan REAL (288/291 route real DB I/O). 501-stub umuman yo'q. 3 ta kichik yashil-yolg'on (CC webhook audit-log placeholder, coordination hardcoded councils, POS legacy adjustInventory echo). Asosiy struktura muammosi dublikat EMAS — **legacy/v2 prefiks parallelizmi** (chat `/hr-v2/chat`, POS `/legacy/pos`+`/v2/pos`+`/pos/sales`). Jonli DB hamma jadvalda 0 qator (qurilish bosqichi — bu kod sifati emas, data yo'qligi).
