# HUJJATLAR TIZIMI — GROUND TRUTH AUDIT (2026-07-14)

> **Read-only investigation.** Zero code/schema/data changes were made. This document reports
> what is **actually true in the live code + live DB + live API right now**, not what any prior
> chat report (including this session's own) claimed. Every rating carries inline evidence.
> Method: 5 parallel read-only investigators, each reading current source, querying the live DB
> (`node _audit/q.cjs`), hitting the live API (`127.0.0.1:3030`), and tracing FE click-paths.
>
> Rating scale: ✅ VERIFIED WORKING · ⚠️ PARTIALLY WORKING · ❌ NOT WORKING (claimed done, isn't)
> · 🚫 NOT BUILT · ❓ UNVERIFIED.
>
> Live baseline (DB, `count(*)`): `document_access_log` ≈ 34→41 (grew during view tests),
> `erp_documents` = 6 physical (5 soft-deleted, **1 live**), `erp_spreadsheets` = 6, `cc_documents` = 3,
> `cc_document_templates` = 4, `chat_messages` = 15, `chat_rooms` = 5, `refresh_tokens` = 85.
> Git HEAD (`a3acdb34`) clean + linear, no merge/rebase in progress. FE tsc **0**, BE tsc **0**.

---

## EXECUTIVE SUMMARY

| # | Feature | Rating | One-line ground truth |
|---|---------|--------|-----------------------|
| **§1 Document-control (write side)** | | | |
| 3.1 | `document_access_log` table + `sensitivity_tier` spread | ✅ | 13-col append-only log; `sensitivity_tier` on 10 tables |
| 3.2 | Download-block hook | ✅ | Global Fastify `onSend` rewrites `attachment`→`inline` (live-proven) |
| 3.3 | View / print logging | ✅ | Fresh DB rows on real GET/print; `view`=33, `print`=1 |
| 3.3 | **Copy logging** | ⚠️ | Endpoint exists; **FE never calls it** → copy events unlogged |
| 3.4 | Watermark mounted in both editors | ✅ | Tiled SVG overlay in RichTextEditor + SpreadsheetEditor, print-safe |
| 3.5 | Chat-delivery service | ✅ | "Tizim" (id 3) → real `chat_messages` rows with deep-link |
| 3.6 | CC-surfacing | ✅ | Real `cc_documents` row lands in target inbox (basket_owner) |
| 3.7 | Client-export exception | ⚠️ | Roles real; **watermark NOT on exports**; **`client_export` logging unwired** |
| 3.8 | Auto-logout | 🚫 | Dormant `refresh_tokens.last_activity` column, no code |
| 3.9 | **Director audit panel** | 🚫 | **No reader of `document_access_log` anywhere** (write-only table) |
| 3.10 | Roll-out breadth | ⚠️ | 3 of 9 mapped doc-types wired (cc, erp_document, erp_spreadsheet) |
| **§2 Erkin-hujjatlar (Word)** | | | |
| — | Schema `erp_documents` + soft-delete | ✅ | 10 cols; `deleted_at` real (written + filtered on every read) |
| — | Create/save + autosave + naming modal + format-choice | ✅ | Full CRUD live-proven (201/GET/PATCH v2/DELETE→404) |
| — | Rich-text (bold/italic/underline/strike/head/list/quote/code/link/color/align/font) | ✅ | 22 toolbar commands wired; test 4/4 |
| — | Table insert | ✅ | `insertTable 3×3` |
| — | **Table row/col/merge editing** | ❌ | TableKit supports it; **no toolbar buttons** — insert-only |
| — | Image (URL) | ✅ | `window.prompt`→`setImage` |
| — | **Image (device upload)** | ❌ | No file input; base64 blocked by design |
| — | **.docx import** (twice-reported broken) | ✅ | **Test-proven renders** (3/3); client-side mammoth→generateJSON; images stripped |
| — | Print (role-gated, saved-only) | ✅ | Hidden on unsaved; reason≥3 enforced FE+BE |
| — | Find&replace / word-count / page-setup / comments | 🚫 | Not built |
| — | PDF generation (A2-PDF) | 🚫 | No server PDF; `window.print()` only |
| **§3 Erkin-hujjatlar (Excel)** | | | |
| — | Schema `erp_spreadsheets` (cells jsonb) | ✅ | 6 rows |
| — | **Single-click-then-type** (double-click bug) | ✅ | Fixed + test-locked (5/5 keyboard tests) |
| — | Formulas SUM/AVG/COUNT/IF/MIN/MAX/ROUND/CONCAT/VLOOKUP/TODAY/NOW | ✅ | All in `callFn()`; 10/10 smoke tests; `,` & `;` separators |
| — | **Absolute refs `$A$1`** | ⚠️ | `$` merely stripped — **no real semantics** (no fill/relative-copy) |
| — | Filter | ✅ | Per-column filter row + logic |
| — | Select-all | ✅ | `selectAll` + Ctrl+A + button + corner |
| — | Formula fx picker | ✅ | 35-fn dropdown → inserts `=NAME(` |
| — | Cell formatting (bold/align/numfmt/fill/border) | ✅ | All 5 wired to toolbar |
| — | Undo/redo (Ctrl+Z/Y) + copy/paste/cut (Ctrl+C/V/X) | ✅ | Wired + test-proven |
| — | Multiple sheets/tabs · freeze panes · sort · fill/autofill | 🚫 | Not built |
| — | CC-surfacing for spreadsheets (B-4b) | ✅ | End-to-end; deep-link body-text-only (no `related_erp_spreadsheet_id` col, by design) |
| **§4 Chat** | | | |
| — | WS auth-drift fix · reconnect · catch-up · optimistic-send · offline-queue | ✅ | All intact + live-proven (cookie↔cookie-parse) |
| — | Delete policy (soft, per-user + global, no hard-delete) | ✅ | `isDeleted` UPDATE + `chat_message_hidden_for`; 0 hard-deletes |
| — | WS-only send (FE) | ⚠️ | FE is WS-only, but REST send endpoint still active |
| — | **hr-v2/chat retirement** | ❌ | **Incomplete → live 404 drift: thread/forward/poll-create broken via UI** |
| — | Channel semantics | ⚠️ | Basic read-only enforced; mixed-case `type` enum |
| — | At-rest encryption | 🚫 | Plaintext `content` |
| — | Right-side employee-info panel | ✅ | Built + wired (real CRUD); **no scope-confusion with the doc editor** |
| **§5 Calendar (Phase D)** | | | |
| — | `erp_calendar_events` / `erp_calendar_participants` + module | 🚫 | **Never built** (generic `calendar_events` + Marketing/HR calendars are unrelated pre-existing modules) |
| **§6 Cross-cutting** | | | |
| — | FE typecheck / BE typecheck | ✅ | 0 / 0 errors (fresh run) |
| — | Sidebar-route validator / design-token lint | ✅ | 296/296 URLs; no new hardcoded colors |
| — | FE↔BE URL contract | ⚠️ | 1 warning: `/api/crm/ai/extended/churn/analyze` (CRM, **out of hujjat scope**) |
| — | Commit scope discipline | ✅ | All hujjat commits in-scope; no leakage |
| — | Orphaned/dead code | ✅ | All 4 new components imported + routed |
| — | Git contention | ✅ | HEAD clean/linear; only concurrent HR/org files uncommitted |

**Highest-priority defects surfaced:**
1. **§4 hr-v2/chat drift (❌):** thread replies, message forwarding, and PollCreator are **404 through the UI** — an incomplete concurrent-session migration (FE `getChatApiBase()`→`/api/chat`, but 3 routes still only under `/api/hr-v2/chat`).
2. **§1 Director audit panel (🚫):** the entire read/reporting side of document-control is unbuilt — `document_access_log` has **no reader** (write-only in practice).
3. **§1 Copy/export logging & watermark-on-export (⚠️):** copy endpoint uncalled by FE; `client_export` action enum has zero callers; watermark is FE-overlay-only and never reaches exported PDFs.

---

## SECTION 1 — Document-control layer (STEP 3.1–3.10)

Scope: `apps/api/src/common/document-control/` + consumers (`erp-documents`, `erp-spreadsheets`, `communication-center`) + FE `components/document-control/`. **Write-side is real and wired; read/reporting side is largely absent.**

### 3.1 — `document_access_log` + `sensitivity_tier` spread — ✅ VERIFIED WORKING
- Live count = **34** at start (→41 during view tests): `SELECT count(*) FROM document_access_log`.
- 13 columns (`information_schema.columns`): `id int`, `user_id int`, `user_full_name text`, `user_role varchar`, `document_type varchar`, `document_id text` (deliberately text — mixes uuid+int ids), `action varchar`, `reason text`, `sensitivity_tier varchar`, `ip_address varchar`, `user_agent text`, `device varchar`, `created_at timestamptz`. Source: `apps/api/src/shared/db/schema-document-control.ts:20-37` (append-only, 2 indexes).
- `sensitivity_tier` present on **10 tables**: `cc_documents, certificates, document_access_log, employment_contracts, erp_documents, erp_spreadsheets, gl_documents, hr_documents, sd_contracts, technology_cards` (`erp_documents`/`erp_spreadsheets` use `text`; others `varchar`).

### 3.2 — Download-block hook — ✅ VERIFIED WORKING (live-proven)
- Global Fastify `onSend` at `download-block.hook.ts:37-55`; registered `main.ts:98`. `Content-Disposition: attachment` → rewritten to `inline` unless URL matches `ALLOW_ATTACHMENT_PATTERNS` (lines 30-35: sd invoices/quotations pdf, mm reconciliation pdf, storage/download).
- **Live rewrite proof:** `GET /api/export/employees/csv` → 200, controller set `attachment` (`export.controller.ts:67`) but response returned `content-disposition: inline; filename="employees-2026-07-14.csv"`.
- Allowlist "keep attachment" branch is code-verified but not live-observed (sd invoice pdf → 503 PDF-gen unavailable; storage/download → 404). Rewrite path solid; preserve path rests on regex + review.

### 3.3 — View / copy / print logging — ⚠️ PARTIALLY WORKING
- **View & print — VERIFIED.** `DocumentAccessLogService.logFromReq` (`document-access-log.service.ts:68-88`) resolves ip/UA/user + server-side tier (`resolveTier` :94-119, hardcoded allowlist, injection-safe), inserts. Live: `GET /api/erp-documents/269ce0f9-…` → new row `id:41, action:"view", sensitivity_tier:"oddiy", ip:127.0.0.1`. Call sites: `erp-documents.controller.ts:91,129`, `erp-spreadsheets.controller.ts:73,105`, `cc-documents.controller.ts:184,340,428`. DB action distribution: `view`=33, `print`=1.
- **Copy — NOT WIRED.** `POST /document-access/log` (`document-access.controller.ts:33`, accepts `action: view|copy`) exists but **FE never calls it** — repo-wide grep for `document-access`/`logCopy`/`onCopy`→endpoint = 0 matches. Ctrl+C copies are never logged.

### 3.4 — Watermark mounted in both editors — ✅ VERIFIED WORKING
- `DocumentWatermark.tsx:25` — tiled SVG overlay, active only for `maxfiy`/`juda-maxfiy` (:35), `pointer-events:none`, `print-color-adjust:exact` (survives Ctrl+P), embeds viewer name+timestamp (+user id for `juda-maxfiy`).
- **Actually mounted:** doc editor `RichTextEditor.tsx:63` wraps `<EditorContent>`; spreadsheet `ErpSpreadsheetEditor.tsx:177` wraps the grid; CC modal `DocumentDetailModal.tsx:148` also wraps.

### 3.5 — Chat-delivery (`DocumentDeliveryService`) — ✅ VERIFIED WORKING
- Pure consumer of `ChatService.getOrCreateDirectRoom` + `sendMessage` + gateway emits. `systemUserId()` (:37-52) → `business_settings(document_control, chat_system_user_id)=3`, fallback `users.username='tizim_system'` = id 3 ("Tizim", role system).
- Call sites: `cc-workflow.service.ts:154` (surfaced doc), `:220` (per approver). Real rows: `chat_messages id:16/15/14, sender_id:3, room_id:5`, content `"📄 Yangi hujjat sizga biriktirildi: … Ochish: /spreadsheets/…"`. Minor cosmetic: ids 15&16 are a duplicate ping pair.

### 3.6 — CC-surfacing (`surfaceErpInCc`) — ✅ VERIFIED WORKING
- `cc-workflow.service.ts:103-161`: resolves title (branched literal SQL, Qoida-B-safe), looks up seeded `ERKIN-HUJJAT` template, `createDraft`, links `related_erp_document_id` for docs (sheets carry link via body+chat by design), `transition` into target inbox, chat ping. Real row: `cc_documents subject:"CC-SHEET-TEST", basket_owner_user_id:2, basket_state:"inbox", related_erp_document_id:null` (null because these are **spreadsheets** — `isSheet` omits the FK by design). Actual column is `basket_owner_user_id`.

### 3.7 — Client-export exception — ⚠️ PARTIALLY WORKING
- **Roles real:** e.g. `sd-invoices.controller.ts:101-102,138-139` gate pdf/export-pdf to `FINANCE_MANAGER, SUPER_ADMIN, DIRECTOR, SALES_MANAGER`; storage enforces `DOWNLOAD_ALLOWED_ROLES` + reason (`storage.controller.ts:33,183`). Hook does not re-check roles (relies on these).
- **Watermark NOT on exports:** watermark is a FE React overlay only; server-generated export PDFs have no watermark layer.
- **`client_export` logging NOT wired:** enum lists `client_export`/`export` (`schema-document-control.ts:27,43`) but grep = only the enum definition, **zero callers**. Allowlisted exports log to a *different* table (`audit_logs` via `logExportAttempt`), not `document_access_log`. DB: only `view`/`print` ever written.

### 3.8 — Auto-logout — 🚫 NOT BUILT
- FE grep `useIdleTimer/onIdle/IDLE_TIMEOUT/idle-logout` = 0 matches. Backend `refresh_tokens.last_activity` column exists but **no code reads/writes it**. Dormant column, no timer.

### 3.9 — Director audit panel — 🚫 NOT BUILT
- **No reader of `document_access_log` anywhere.** Repo-wide grep `FROM document_access_log`/`SELECT … document_access_log` matches only the writer service + schema file + 2 comments — no SELECT, no GET controller, no FE page. `document-access.controller.ts` exposes only `POST /log` (write). The "single canonical store the director audit panel reads" (service header :5-6) has **no consumer built**. Table is write-only in practice.

### 3.10 — Roll-out breadth — ⚠️ PARTIALLY (3 of 9 mapped types)
- Actual call sites by module: **erp-documents** (view+print), **erp-spreadsheets** (view+print), **communication-center** (view×2+print), **common/document-control** generic endpoint (built, FE never calls).
- `resolveTier` maps **9** types (cc, erp_document, erp_spreadsheet, hr_document, employment_contract, technology_card, sd_contract, lms_certificate, gl_document) but only **3** (cc, erp_document, erp_spreadsheet) have real callers. HR docs, employment contracts, technology cards, SD contracts, LMS certificates, GL documents = mapped-but-unwired.

---

## SECTION 2 — Erkin-hujjatlar (Word-style, Phase A)

**Verdict: ✅ genuinely functional Word-style editor** (solid rich-text, not full Word). Full CRUD live-proven, both test suites pass (7/7), and the twice-broken **.docx import renders correctly** (test-proven + code-traced).

### Schema `erp_documents` — ✅
- 10 cols (live): `id uuid, title text NOT NULL, content jsonb NOT NULL, content_html text, owner_id int NOT NULL, sensitivity_tier text NOT NULL, version int NOT NULL, deleted_at timestamptz, created_at, updated_at`.
- Row count **6 physical** (`count(*)`=6; `deleted_at IS NOT NULL`=5 → **1 live**).
- `deleted_at` real: written `erp-documents.repository.ts:79` (`softDelete`), enforced on every read (`isNull` at :47/:55/:71). `remove()` (:139) → soft-delete; **no hard delete**.

### Create/Save flow — ✅ (live-proven)
- Save `ErpDocumentEditor.tsx:213` → `handleSaveClick` (:120) → `save.mutate` (:87-92) → `POST/PATCH /api/erp-documents` → controller `create`/`update` → Drizzle. Live curl: POST→201 (`version:1`), GET→row back (content intact), PATCH→`version:2` (repo `:67` `version = version + 1`), DELETE→`{ok:true}` then GET→**404**.
- Autosave wired: `:114-119` — id+title → silent save after 1s debounce.

### Naming modal — ✅
- Inline `<Dialog>` `:249-269`; trigger `handleSaveClick :120-123` — fires **only on first save of a new doc** (`if (!id)`); later saves go straight through.

### Format-selection screen — ✅
- `ErpDocumentsList.tsx:159 onAdd → /documents/new` → `DocumentsRoutes.tsx:17 → DocumentFormatChoice`. Two cards: "Matn hujjati"→`/documents/matn`, "Jadval"→`/spreadsheets/new`. Route ordering correct (`/documents/matn` before greedy `/documents/:id`).

### Editor depth (evidence: `DocumentToolbar.tsx` + `documentEditorConfig.ts`)
Extensions registered: StarterKit, TableKit, TextAlign, TextStyle, FontFamily, FontSize, Color, Highlight(multicolor), Image(allowBase64:false).

| Feature | Rating | Evidence |
|---|---|---|
| Bold/Italic/Underline/Strike | ✅ | Toolbar :92-95; test asserts `isActive` true |
| Headings H1-3 | ✅ | :97-99 |
| Bullet/ordered lists | ✅ | :101-102; nesting via StarterKit Tab/Shift-Tab (⚠️ no indent/outdent buttons) |
| Quote / code block | ✅ | :103-104 |
| Link | ✅ | :114 + `setLink` :60-66 (`window.prompt`) |
| Table insert | ✅ | :116 `insertTable 3×3 withHeaderRow` |
| **Table row/col/merge** | ❌ | TableKit supports; **zero toolbar buttons** wire them |
| Image URL | ✅ | :115 `window.prompt`→`setImage` |
| **Image device upload** | ❌ | No file input; `allowBase64:false` |
| Text/highlight color | ✅ | :111-112 native color input |
| Align L/C/R/justify | ✅ | :106-109 |
| Font family/size | ✅ | :73-90 selects; test asserts apply |
| Find & replace | ❌ | Absent |
| Word count | ❌ | Absent |
| Page-setup/margins | 🚫 | Fixed A4, hardcoded margins `DocumentPaper.tsx:15` |
| Comments/annotations | 🚫 | Not built |
| Undo/redo | ✅ | :70-71 (StarterKit history) |

**Test `DocumentToolbar.commands.test.tsx`: 4/4 pass** — all 22 wired commands exist + mutate the doc (no dead buttons for what's wired).

### Import (.docx) — ✅ HIGH SCRUTINY: definitively works
- Path fully **client-side** (`ImportDocxButton.tsx`): `file.arrayBuffer()` → `mammoth.convertToHtml()` (:42) → strip `<img>` (:44) → `generateJSON(html, documentEditorExtensions)` (:45) → `POST /api/erp-documents {content, contentHtml}` (:47-49). **No BE parse endpoint** (raw .docx never hits server).
- **`RichTextEditor.import.test.tsx`: 3/3 pass** — proves generateJSON yields non-empty TipTap doc AND `RichTextEditor` renders the real Uzbek text ("YOZGI TA'TIL KAFOLAT XATI", "farzandim xavfsizligini kafolatlayman") into the DOM; the prior blank-after-import bug is fixed by the `contentKey`/`setContent` re-apply guard (`RichTextEditor.tsx:47-54`), locked by the regression test.
- Honest caveat: **images are stripped on import** (text+structure only), with a toast telling the user (:51).

### Print button — ✅ role-gated + saved-only
- FE `PRINT_ROLES` (:20): admin, super_admin, director, manager, hr_manager, finance_manager, production_manager. BE `@Roles` (`erp-documents.controller.ts:118,25`): super_admin, director, manager, hr_manager, finance_manager, production_manager (admin bypasses RolesGuard globally).
- Hidden on unsaved: `{id && canPrint && …}` (:193). Functional on saved: reason dialog (≥3 chars FE+BE), logs to `DocumentAccessLogService` (:129), then `window.print()`.

### PDF generation (A2-PDF) — 🚫 NOT BUILT
- Grep `puppeteer|pdfkit|pdf-lib|jspdf|generatePdf` in erp-documents scope = 0 matches. Only browser `window.print()`.

---

## SECTION 3 — Erkin-hujjatlar (Excel-style, Phase B)

**Verdict: ✅ solid custom spreadsheet** with a real client-side formula engine; the reported UX gaps (double-click, missing filter/select-all/formula-UI) are all **now built**. Absolute-ref semantics and advanced Excel features (multi-sheet, sort, autofill) remain unbuilt.

### Schema `erp_spreadsheets` — ✅
- 6 rows. Cols: `id uuid, title text, cells jsonb, owner_id int, sensitivity_tier text, version int, deleted_at, created_at, updated_at`. `cells jsonb` is the persist target; repo does real insert/update/soft-delete with `version = version + 1`.

### Single-click-then-type (double-click bug) — ✅ verified
- `td onClick → pick()` (selects only, SpreadsheetGrid.tsx:437); `onDoubleClick → startEdit()` (:438); `onGridKeyDown` default (:260-262): a single printable key → `startEdit(sel, k)` seeded with the char (overwrites, :225). **Test `SpreadsheetGrid.keyboard.test.tsx` 5/5 pass** — explicitly guards the "2 marta bosish" bug.

### Formulas — ✅ (all requested handled in `callFn()` lib/spreadsheet.ts:179-216)
SUM :180 · AVERAGE :182 · COUNT :186 · IF :208 · MIN :183 · MAX :184 · ROUND :197 · CONCATENATE :200 · VLOOKUP :212 (real scan :158-170) · TODAY :213 · NOW :214. Plus ~25 more (PRODUCT/MEDIAN/SUMIF/COUNTIF/AVERAGEIF/ROUNDUP/DOWN/ABS/SQRT/INT/SIGN/POWER/MOD/LEFT/RIGHT/MID/LEN/UPPER/LOWER/TRIM/AND/OR/NOT). Innermost-first resolver, cycle-safe (`seen` set), `#NAME?/#ERR/#CYCLE` propagation. **`splitArgs` accepts both `,` and `;`** (RU/UZ locale). **Smoke test 10/10 pass** (SUM=60, IF→big, ROUND(20/3,2)=6.67, `=SUM(A1;A2;A3)`=60).

### Absolute refs `$A$1` — ⚠️ parsed but NOT semantically implemented
- `normRef = ref.replace(/\$/g,'')` (:25) **strips all `$`** before eval. Code comment admits it (:23): "$ only matters for fill/copy." Since there's **no fill/autofill and no relative-offset copy** (copy transfers evaluated TSV, not shifted formulas), `$` has **zero observable effect**. Rating ⚠️ (accepts syntax without crashing; no real behavior).

### Filter — ✅
- `filterOn`/`filters` state, toolbar toggle (:371), per-column input row when on (:406-417), real `rowVisible`/`visibleRows` (case-insensitive substring, AND across cols, on displayed values).

### Select-all — ✅
- `selectAll()` (:145), Ctrl+A (:247), toolbar button + "Hammasi" (:360-363), corner `<th onClick={selectAll}>` (:396-399); `rangeLabel` shows count.

### Formula fx picker — ✅
- 35-entry `FUNCTIONS` array with hints (:25-61), fx button (:345), dropdown (:347-357), `insertFn → startEdit(sel, '=NAME(')` (:277).

### Cell formatting — ✅ (all 5 wired via `setStyle` → undoable `applyChange`)
Bold (:311→font-bold), Align l/c/r (:314-319), Number-format num/money/pct (`<select>`:336-341→`formatDisplay`), Fill color (native color input :322-327→backgroundColor), Border (:333→border-2).

### Undo/redo — ✅
- `undoStack/redoStack` refs, single write-path `applyChange` (capped 200), Ctrl+Z (:250), Ctrl+Y/Ctrl+Shift+Z (:251), toolbar Undo2/Redo2 (disabled states). Test "Ctrl+Z reverts / Ctrl+Y re-applies" passes.

### Copy/paste/cut — ✅
- `copySelection` (TSV of evaluated values + toast), `pasteSelection` (TSV→cells, `=`→formula, grows grid, undoable), `cutSelection` (copy+clear). Ctrl+C (read-only-safe) / Ctrl+X / Ctrl+V. Caveat: paste transfers displayed values, not offset formulas.

### Multiple sheets/tabs · Freeze panes · Sort · Fill/autofill — 🚫
- One `<table>` per row; no tab bar / sheet array. Only headers+gutter are CSS-`sticky` (frozen headers by default, not configurable freeze panes). No sort handler. No fill handle / drag-fill (which is *why* `$` has no effect).

### CC-surfacing for spreadsheets (B-4b) — ✅ (deep-link body-text-only, by design)
- FE button `ErpSpreadsheetEditor.tsx:161-166` (`documentType="erp_spreadsheet"`); modal `SendToCcModal.tsx:20-38`; BE Zod `documentType` enum (`cc-documents.controller.ts:81`) → `surfaceErpInCc(...sourceType)`; service branches on `isSheet` (title from `erp_spreadsheets`, `/spreadsheets` deep-path, body embed, chat ping).
- **Schema caveat:** `cc_documents` has `related_erp_document_id` but **NO `related_erp_spreadsheet_id`**. Service sets FK only for docs; sheets carry the link **via body text + chat ping only** (deliberate, code-commented) — so sheet-sourced CC records aren't joinable by sheet id.

---

## SECTION 4 — Chat module

**Verdict: core messaging solid and verified;** one high-priority live defect (hr-v2/chat drift) + at-rest encryption unbuilt. Backend live (login OK, token len 355). `chat_messages`=15, `chat_rooms`=5.

1. **WS auth-drift fix — ✅** `chat.gateway.ts:83-104` reads token: `handshake.auth.token` → `Authorization` → **`access_token` cookie** (`cookieValue()` :36-44). FE `ChatSocketProvider.tsx:45-53` connects `withCredentials:true`, no localStorage read; doc-comment documents the prior bug + fix. Live: `GET /api/chat/rooms` → 200 with cookie-less bearer.
2. **Reconnect policy — ✅** `:49-53` reconnection Infinity, delay 2000, max 30000; no `reconnect_failed` killer.
3. **Catch-up on reconnect — ✅** `:57-71` `connect` re-emits `get_messages`+`mark_read`; `messages_list` replaces room state wholesale (re-fetch, not cursor delta — adequate).
4. **Optimistic-send — ✅** `useChatSocket.ts:51-68` `clientMsgId=randomUUID`, `addOptimisticMessage({status:"sending"})` pre-emit; server echo reconciles via `reconcileMessage`; `markMessageFailed` on error; `retryMessage` reuses id.
5. **Offline-queue — ✅** chat-specific `pendingQueue` (`useChatSocket.ts:12-29`); pushes when disconnected, `flushPendingQueue` drains on connect. Distinct from HR PWA queue.
6. **Delete policy — ✅** "Everyone" `softDeleteMessage` (`chat-message-base.repository.ts:168-182`, `isDeleted:true`, sender-only, UPDATE); "Me" `hideMessageForUser` (:189-204, `chat_message_hidden_for`); comment "row NEVER hard-deleted"; **0** `DELETE FROM chat_messages`; live `deleted_msgs=0`.
7. **WS-only send (FE) — ⚠️** FE composer is WS-only; but REST `POST /chat/rooms/:roomId/messages` (`chat.controller.ts:109-122`) is **still active** (dead relative to FE, live as endpoint). Document-delivery's server-side `chat.sendMessage` is the expected path.
8. **Channel semantics — ⚠️** CHANNEL type exists (DB: 1 CHANNEL, 1 GROUP, 3 direct); FE enforces channel read-only for non-admins (`ChatLayout.tsx:95`). Deeper broadcast/subscriber model not fully traced. **Data-hygiene flag:** `chat_rooms.type` mixed-case (`'DIRECT'`×2 vs `'direct'`×1), FE-tolerated via `.toLowerCase()`.
9. **hr-v2/chat retirement — ❌ NOT WORKING (incomplete migration → live 404 drift)** `chat-advanced.controller.ts:38` + `chat-advanced-uploads.controller.ts:37` still `@Controller('hr-v2/chat')` (thread, forward, poll-create, uploads); only reactions/pin/delete/vote/`rooms/:id/polls` aliased into `@Controller('chat')`. FE `apiBase.ts:14-16 getChatApiBase() = /api/chat`. Result — live 404s:

   | FE call (→/api/chat) | Live | Real route |
   |---|---|---|
   | `GET /api/chat/messages/1/thread` (ThreadPanel) | **404** | `/api/hr-v2/chat/messages/1/thread` → 200 |
   | `POST /api/chat/messages/1/forward` (ForwardModal) | **404** | only under `/api/hr-v2/chat` |
   | `POST /api/chat/polls` (PollCreator) | **404** | canonical `POST /api/chat/rooms/:id/polls` exists (400) |
   | `POST /api/chat/polls/1/vote` (MessagePoll) | works (404 "Poll not found" = route exists) | `/api/chat/polls/:id/vote` |

   **Thread replies, message forwarding, PollCreator poll-create are broken through the UI.** Fix: alias the 3 routes into `/api/chat` OR point those FE components at `getNestApiBase()`.
10. **At-rest encryption — 🚫** No encrypt/cipher/at-rest logic; `chat_messages.content` plaintext. Only `crypto.*` is `video-token.service.ts:90,105` (video-call token signing, unrelated).
11. **Right-side employee-info panel — ✅ (no scope-confusion)** `ChatEmployeeInfoPanel.tsx` (392 lines), wired `ChatLayout.tsx:448-452` for 1:1 rooms; 4 tabs (Umumiy/Izohlar/Fayllar/Bogʻliq-vazifalar) with real CRUD → real endpoints (presence/tags/notes/files/related-tasks/create-Kanban-task, all in `chat.controller.ts:283-349`). Doc-comment cites "owner design-spec 2026-07-11". **Unambiguously the chat contact sidebar — NOT the erp_documents Google-Docs editor redesign; no conflation found.**

---

## SECTION 5 — Calendar module (Phase D)

**🚫 NOT BUILT.**
- `SELECT table_name … ILIKE '%calendar%'` → `marketing_calendar_events, calendar_events, erp_shift_calendars, content_calendar, shift_calendars`. **Neither `erp_calendar_events` nor `erp_calendar_participants` exists.**
- No `erp_calendar` / `CalendarModule` code in `apps/api/src` or FE. The only calendar routes are pre-existing unrelated modules: Marketing (`/marketing/calendar`), HR (`/events-calendar`), Finance (`/fi/tax-calendar`).
- The Phase-D document-linked calendar (events + participants tied to the document-control effort) was **never attempted**.

---

## SECTION 6 — Cross-cutting integrity

**Verdict: PASS.**

### Governance gates (fresh run)
- **FE typecheck — PASS (0 errors).** Clean despite concurrent HR/org uncommitted WIP.
- **BE typecheck — PASS (0 errors).**
- `node scripts/check-sidebar-routes.mjs` → ✅ 296/296 URLs matched (547 patterns, 15 files), exit 0.
- `node scripts/check-design-tokens.mjs` → ✅ no new inline hardcoded colors, exit 0.
- `node scripts/check-fe-api-urls.mjs` → ⚠️ 1 mismatch: `POST /api/crm/ai/extended/churn/analyze` (FE caller still references an alias removed in `1ac2204f` — **CRM scope, out of hujjat audit**), exit 0 (warning only).
- Reviewer suite: `run-all-reviewers.sh` + 31 `reviewer-*.sh` exist; not executed (slow; the two hard typecheck gates already pass).

### Commit scope discipline — ✅ all in scope
Every hujjat/jadval/brand/CC commit (`git show --stat` verified) touched only in-scope files:
`d0228592` (EuroprintLogo), `ffecd66f` (DocumentLogo/DocumentPaper/ErpSpreadsheetEditor/logo png), `da1202aa` (spreadsheet.ts+tests), `7cabf2fb` (both editors), `361b8a3d` (SpreadsheetGrid+test), `9e2e2d25` (toolbar test), `0e9e4a5c` (both editors), `2a3669c9`+`27453fb2` (SpreadsheetGrid), `93283364` (CC files+editors), `e03fa060` (ErpDocumentEditor), `7ea4b69c` (SpreadsheetGrid), `eb1899f5` (ErpDocumentsList), `b16c734e`+`6202650d` (SpreadsheetGrid/spreadsheet.ts). Two cross-cutting single-file fixes: `a3acdb34` (main.tsx SW self-heal — app-bootstrap infra), `1ac2204f` (crm-extended.controller — Fastify boot-crash). **No commit leaked into HR/org or unrelated features.**

### Orphaned/dead code — ✅ none
`DocumentFormatChoice` → route `/documents/new`; `ErpSpreadsheetEditor` → `/spreadsheets/new` + `/spreadsheets/:id`; `SendToCcModal` → imported by both editors; `DocumentLogo` → imported by DocumentPaper + ErpSpreadsheetEditor. Bundle registered `AppRouter.tsx:20`. No written-but-unimported component.

### Git contention — ✅ clean/linear
- No `.git/MERGE_HEAD`/`rebase-merge`. Linear history, HEAD `a3acdb34`, no merge commits.
- `git status --short` = 316 (dominated by untracked `??` audit reports, `_audit/*.cjs`, `.claude/Logo europrint/`, etc.). The **21 tracked-modified `M` files are exclusively the concurrent HR/org/i18n session** (hr-compat, bonus.service, hr.dto, schema-hr-tz2, org/orgnode components, OrgNodeDetail, OrgStructureHierarchy, i18n.generated). **Zero document/spreadsheet/CC/brand files uncommitted** — the entire hujjat scope of this session is fully committed.

---

## APPENDIX — Reconciliation notes & credibility flags

- **Row-count discrepancy:** `pg_stat_user_tables.n_live_tup` (approximate) showed `erp_documents`/`erp_spreadsheets` = 7; authoritative `count(*)` = **6** each. Report uses 6.
- **"Done" claims re-verified, not trusted:** the .docx import (§2) and the double-click fix (§3) — both previously reported fixed after owner found them broken — are now **test-locked and re-proven** here, not merely re-asserted.
- **Newly surfaced live defect (not previously reported):** §4 hr-v2/chat 404 drift (thread/forward/poll-create) — an **incomplete concurrent-session migration**, not part of this session's document work. Recommend flagging to the chat owner.
- **Scope-confusion check (requested):** the "Google-Docs-style" phrase maps to **two distinct, both-real** features — the erp_documents editor visual redesign (Word-style paper canvas) and the chat right-side employee-info panel. Investigator confirmed **no conflation** — they are separate components.
- **Environment note:** live-testing repeatedly hit the login rate-limiter (429) from rapid test logins; not a defect (brute-force protection working as designed).

*End of report. Read-only — no changes made.*
