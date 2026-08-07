# Delta: 2026-07-11 dan beri commitlar (registr agentlari uchun)

> Har modul agenti o'z moduliga tegishli commitlarni bu ro'yxatdan filtrlaydi va
> **shu commitlar tegan bandlarni** jonli kodda spot-verify qiladi (Q-29).
> Yaratilgan: 2026-08-07 (FAZA 0).

```
fcf401fa 2026-08-07 fix(finance): verifyPayment now compensates when the GL post fails (T25)
a14beb91 2026-08-07 fix(hr): passport form silently dropped 5 of 7 fields (T29)
79799548 2026-08-07 fix(admin): surface two orphaned CRUD pages + correct stale guard docs (T26)
d74a12db 2026-08-07 chore(cleanup): delete two dead files + stale CLAUDE.md entry (T27,T28A)
ccd017c0 2026-08-07 fix(sd): close remaining §3.6 IDOR items 3-5 — ownership scoping (T6)
c7d4d0f8 2026-08-07 fix(cc): finish Qoida-6 cleanup + escalations now reach Telegram (T24)
896988c9 2026-08-07 fix(pp): AI generate/optimize buttons showed scary errors on 501 (T22A)
cc697334 2026-08-07 fix(chat): FCM/APNS push stubs faked success (T18)
f318bbfe 2026-08-07 fix(mes): wire the material-kit two-signature gate into the real flow (T13)
adb844e5 2026-08-07 refactor(pp): move MRP matrix assembly out of the controller (T22B)
4d111226 2026-08-07 fix(crm): five compat AI endpoints returned hardcoded fake-success (T20)
8bef27c8 2026-08-07 fix(chat): presence TTL sweep — users no longer stuck ONLINE forever (T17)
b4eeffe0 2026-08-07 fix(notifications): global bell was wired to a nonexistent endpoint (T16)
52eb84cb 2026-08-07 fix(lms): real FE exam-submit path never emitted lms.exam.passed (T15)
9ea7c155 2026-08-07 fix(pos): second quarantine path + silently dead Telegram ext-bot (T23)
9911a5d8 2026-08-07 fix(wms): gateway warehouse list ignored is_active (T14)
56489f4d 2026-08-07 fix(marketing): Campaigns controller missed the 'manager' role-fix (T21)
ba4392cb 2026-08-07 fix(aisha): role-gate all 4 controllers + assign_task HITL pause (T9-T11)
f938bad5 2026-08-07 fix(director): HITL approval self-approve SoD check (T5)
5ea59b02 2026-08-07 fix(admin): privilege-escalation + fake-success holes in user management (T1-T3)
8469ab6e 2026-08-06 fix(qc): approve/reject screens never published QC golden-thread events
7f4d7b6d 2026-08-06 fix(iot): tablet FE silently swallowed backend errors on 7 mutations
dbb78bee 2026-08-06 fix(director): ZNO controller had zero role-gating on create/list
d97ad8ae 2026-08-06 fix(ui): add delete confirmation + missing onError handlers (Qoida 14/F2)
74d4d5ec 2026-08-06 docs: log SD-CRM audit §5 integration-map verification results
b85d1d2f 2026-08-06 fix(sd): POST /sd/deliveries crashed on uuid/integer schema mismatch
0e068ec5 2026-08-06 fix(finance): stop SD customer payments colliding on GL reference CP-0
b1456816 2026-08-06 fix(crm): wire kanban drag-to-won to /won endpoint (CRM->SD golden thread)
3e95bbaa 2026-08-06 docs: SD-CRM §3.6 IDOR yopildi (65b5626c), §4 orphan-sweep egasi-qarorga qoldirildi
65b5626c 2026-08-06 fix(sd): §3.6 IDOR — customers/leads GET endpointlar har qanday foydalanuvchiga ochiq edi
2f967efd 2026-08-06 docs: SD-CRM §2 chuqur audit — 4 blokловchi bug tuzatildi (ikkinchi to'lqin)
c09e229c 2026-08-06 fix(sd): §2.4 taklifnoma->buyurtma konvertatsiyasi 500 bilan qulardi (2 qatlamli bug)
04a4e5db 2026-08-06 fix(crm): §2.1 Quick Create bitim (deal) yaratish BLOKLANGAN edi
9938b607 2026-08-06 fix(sd): §2.1 taklifnoma yaratish BLOKLANGAN edi (customer_name NOT NULL)
4e6bca52 2026-08-06 fix(sd): §2.1/§2.2 shartnoma yaratish BLOKLANGAN edi (order_id NOT NULL) + fake-save
384623c8 2026-08-06 docs: Admin moduli tekshirildi — TO'LIQ 18-modulli sweep yakunlandi
bc6e809e 2026-08-06 docs: Director qolgan qismi tekshirildi — toza, aniq band-son noma'lum (TaskList yo'qolgan)
ef220703 2026-08-06 docs: POS moduli tekshirildi (4d7422fc) — M6 magic-number gap 4/4 to'liq yopildi
4d7422fc 2026-08-06 fix(pos): karantin 48-soatlik eskalatsiya CRUD-sozlanadigan qilindi (M6 qolgan gap)
37bef624 2026-08-06 docs: IoT moduli tekshirildi (0f303945) — tablet green-lie FE+BE ikkalasida tuzatildi
0f303945 2026-08-06 fix(iot): tablet material-scan green-lie — FE va BE ikkalasida ham
f0432eaa 2026-08-06 docs: WMS moduli tekshirildi (993c5175) — predikat nomuvofiqlik + copy-paste bug
993c5175 2026-08-06 fix(wms): #4 WMS/POS ombor-ro'yxati predikat nomuvofiqligi + isActive copy-paste bug
32f52769 2026-08-06 docs: PP moduli tekshirildi — toza; 12/18 asosiy-modul to'lqini yakunlandi
d50755f3 2026-08-06 docs: LMS + repo-keng o'lik-import tozalash (3405c39e, 2cfeb8c2) — 22 fayl jami
2cfeb8c2 2026-08-06 fix(api): repo-keng 15 ta o'lik notImplemented import + 2 ta eskirgan izoh tuzatildi
3405c39e 2026-08-06 fix(lms): 2 ta o'lik notImplemented import olib tashlandi
f35b16e6 2026-08-06 docs: QC moduli tekshirildi (442d6bd4) — 2 o'lik import + M6 gap allaqachon tuzatilgan
442d6bd4 2026-08-06 fix(qc): 2 ta o'lik notImplemented import olib tashlandi
d2a0058f 2026-08-06 docs: MES moduli tekshirildi — sog'lom, o'zgarish kerak emas edi
673bac75 2026-08-06 docs: HR-Org moduli tekshirildi — 2026-05-28 audit-jadval eskirgan (7/7 stale)
578cf340 2026-08-06 docs: Finance moduli tekshirildi (b4dd38ce) — sog'lom holat, 1 kichik tozalash
b4dd38ce 2026-08-06 fix(finance): o'lik notImplemented import olib tashlandi
1805171e 2026-08-06 docs: Marketing manager-role P0 tuzatildi (5f26a02b) + repo-keng tekshiruv natijasi
5f26a02b 2026-08-06 fix(marketing): 'manager' roli marketing_manager-gated 74/117 endpointda 403 olardi
307c9d78 2026-08-06 docs: SD/CRM manager-role P0 tuzatildi (9fabdacb) — sessiyaning eng katta topilmasi
9fabdacb 2026-08-06 fix(sd-crm): 'manager' roli sales_manager-gated 25 endpoint-guruhda 403 olardi
0edc5b94 2026-08-06 docs: AI-Aisha modul progress — HITL approval UI ulandi (c99fe584)
c99fe584 2026-08-06 feat(aisha): HITL tasdiqlash navbati FE'ga ulandi (backend real, FE yo'q edi)
bc703d02 2026-08-06 docs: Chat moduli tekshirildi — 5 haqiqiy tuzatish (2 xavfsizlik)
9b3cf05f 2026-08-06 fix(chat): #18 o'lik ChatAdvancedController o'chirildi (hr-v2/chat)
77f98899 2026-08-06 fix(chat): #17 /chat/admin route hech qachon ishga tushmasdi (shadow)
435c9ecb 2026-08-06 fix(chat): #8 upload-orqali xabar real-time yetib bormasdi (WS event nomi drift)
50cec774 2026-08-06 fix(chat): updateRoom (nom/avatar) endi ADMIN roliga cheklangan
763869e7 2026-08-06 fix(chat): chat fayl-biriktirma xona-a'zolik tekshiruvi yo'q edi (IDOR)
66d99c29 2026-08-06 docs: Kanban moduli yopildi (#158-169) — progress-log yangilandi
1ea4fb14 2026-08-06 fix(kanban): o'lik notImplemented import olib tashlandi
2cb61c9e 2026-08-06 docs: CC moduli yopildi (#144-156) — progress-log yangilandi
d0f86666 2026-08-06 refactor(cc): #154 coordination.controller.ts inline SQL repo/service'ga ko'chirildi
09582d90 2026-08-06 fix(cc): #151 overdue-reminder 48h/24h intervallar CRUD-sozlanadigan
ffb9e567 2026-08-06 fix(cc): #152 webhook idempotency key-store Redis'ga ko'chirildi
3b13c2ec 2026-08-06 docs: 19 commits, #150 done, loop mode armed per owner request
6e2fea7c 2026-08-06 feat(cc): #150 WorkflowRules page had no edit UI despite backend PUT existing
858c16b4 2026-08-06 docs: progress log — 18 commits, Director closed, CC started
d6da370f 2026-08-06 fix(cc): #148 approval escalation marked state but never notified/re-routed
33d140a1 2026-08-06 chore(cc): #153 remove dead GET /api/coordination/baskets query
dc0b1e0b 2026-08-06 docs: #107/#108 reclassified egasi-data (EP-DIR-058/059/060/085 all OCHIQ); #106 done, 16 commits total
91eaaa5b 2026-08-06 feat(director): #106 add "send task to Kanban" button on karta-AI agregat
9f73d575 2026-08-05 docs: progress log — 15 real commits this session
0b034f84 2026-08-05 fix(iot): #85 camera-AI PPE/safety findings never reached the alert UI
35b727f7 2026-08-05 feat(director): #105 ZNO/ZVS + rasporyazhenie SLA escalation was flat, now 3-stage
152c285a 2026-08-05 docs: session progress log final tally — 13 real commits
accb4c5b 2026-08-05 chore(kanban): #168 remove orphan GanttView.tsx.bak.t2c backup file
f1caa337 2026-08-05 feat(director): #101 owner-summary daily digest — wire into dashboard FE
97d8809c 2026-08-05 fix(chat): #126 @mention captured in FE but dropped at every backend hop
b546a7f7 2026-08-05 feat(director): #116 chronic-problem escalation — carry-over was 1-day-only
6d1e702d 2026-08-05 docs: update session progress log — 9 real fixes shipped, Workflow tool stopped per owner instruction
33634a35 2026-08-05 fix(chat): #125 is_edited never persisted on message edit
429f37cd 2026-08-05 fix(marketing): #206 dashboard totalSpent field was never computed
a25d5fc4 2026-08-05 fix(sd): #191 blacklist status literal mismatch + forced-resend 400 on any edit
a3a641a9 2026-08-05 feat(director): #104 Director dashboard aiInsights — real karta-AI aggregate
3ce7d423 2026-08-05 docs: record session progress log — TaskList tool state was lost to a crash
d23e650b 2026-08-05 fix(director): #113 IDOR — any manager could read/overwrite another card's diary
8039ab7f 2026-08-05 fix(admin): #123 link the already-fixed backup/cron monitor page into sidebar
dc749dad 2026-08-05 fix(admin): #122 register TenantFilterGuard globally, was fully built but never wired
102c1efc 2026-08-05 fix(admin): #118 Queue Monitor now reads real BullMQ state, was 100% mocked
dac0ccba 2026-08-05 fix(admin): #119 guideline upload silently dropped file + list showed no position
00cda627 2026-08-05 fix(director): VIP-marking an order never reached PP's queue priority (item #100)
69ad4340 2026-08-05 fix(admin): SaaS 'Xatolar' tab always empty — was a hardcoded stub (item #121)
a55c7dec 2026-08-05 fix(admin): backup cron status invisible, cron dashboard always showed green (item #123)
fc4e3403 2026-08-05 fix(admin): alert-by-id lookup returned fake-200 for missing rows (item #124)
06f77edc 2026-08-05 feat(lms): real PDF certificate download, was HTML (item #64)
19d8e304 2026-08-05 fix(pp): align production_orders.status Drizzle schema with live DB (item #81)
cb10001c 2026-08-05 fix(pp): two race conditions in work-center scheduling (item #79)
e5833328 2026-08-05 fix(lms): real pre-expiry certificate warning cron (was a no-op stub)
1c7c9627 2026-08-05 fix(scripts): dup-routes-scan gate never blocked + false positives from comments
63ab63b0 2026-08-05 fix(wms): align POS warehouse-list predicate with WMS (add deleted_at check)
2390f42a 2026-08-04 fix(pos): remove dead legacy pos.controller.ts + its exclusive PosService chain
6b0be639 2026-08-04 fix(pos): remove dead legacy inventory-adjust endpoint (fake-success, no callers)
69558fb6 2026-08-04 fix(pos): daily reconciliation cron for GL canonical entries mirror
bbf1014a 2026-08-04 fix(sd): register QcFailedSdListener (imported but never wired into DI)
567ce6f8 2026-08-04 fix(pos): emit event to SD when EXTERNAL_OUT stock leaves the warehouse
6a8964a7 2026-08-04 fix(pos): align request status filter vocabulary with real UPPERCASE values
15597b12 2026-08-04 fix(qc): auto-resolve responsible operator card + shift on defect/brak records
428c2217 2026-08-04 fix(qc): certificate expiry tracking + nightly cron + SD delivery block
6585fe67 2026-08-04 fix(aisha): RBAC gate on get_employee_info / get_financial_summary chat tools
1753ed0d 2026-08-04 fix(pos): stock-ledger balance reads/writes canonical warehouse_stock
0342fdaa 2026-08-04 fix(qc): reclamation SLA due-date timer
71787991 2026-08-04 fix(qc): persist rework parent_order_id and rework_cost on final inspection
5093fe43 2026-08-04 fix(mes): auto-create Kanban card on equipment breakdown
647730be 2026-08-04 fix(mes): department-scope RBAC on shift/OEE/maintenance stats endpoints
a4f406f7 2026-08-04 fix(mes): two-signature material-act gate blocks session start
1724a0ac 2026-08-04 fix(hr): card status lifecycle events, frozen-card payroll gate, merge/split endpoints, atomic assign guard
285e2e73 2026-08-04 fix(finance): approvePayment updates real finance_payments, not orphaned customer_payments
4cc7f1d4 2026-08-04 fix(marketing): rewrite calendar event form to match real backend/DB contract
117a1827 2026-08-04 fix(marketing): correct spentAmount field name + divide-by-zero guard fixing ROI Infinity%
db16e855 2026-08-04 fix(sd): persist + expose tech-checkpoint flags so golden-thread SD->PP opens
6089cd8d 2026-08-04 fix(sd): return amount from markPaymentPaid so GL posting actually fires
b485d0b9 2026-08-04 fix(sd): allow 'manager' role alongside sales_manager on SD endpoints
2eca612b 2026-08-04 docs: vision-gap master plan — 215-item backlog across 18 modules
17e3a697 2026-08-04 fix(kanban): publish OrderCancelledEvent so cancelled orders move their card
358beb02 2026-08-04 fix(pp): enforce real lab-approval gate on production order release
3d605103 2026-08-04 fix(pos): accept httpOnly cookie auth on POS gateway WebSocket handshake
bfcadd20 2026-08-04 fix(pos): correct status guards so request approve/reject stop 400ing
ee4ecc26 2026-08-04 fix(wms): close quarantine/QC bypass in MM goods-receipt stock posting
4d181f89 2026-08-04 fix(mes): enforce operator-machine skill matrix at session start
2066f70b 2026-08-04 fix(mes): material consumption now decrements WMS stock + posts GL entry
397e3eac 2026-08-04 fix(hr): re-point onboarding_tasks FK from retired org_functions to org_departments
d9210dfc 2026-08-04 fix(hr): field-level RBAC on karta compensation data
de867a08 2026-08-03 test(kanban): add DTO spec + APPROVED marker for status-column-map
13239a1e 2026-08-03 feat(kanban): in-app CRUD for status-column auto-move mapping
ba46a088 2026-08-03 feat(notifications): add alert_thresholds/kanban_column_sla tables + fix Telegram chat_id lookup
633bc74b 2026-08-03 fix(gl): redirect 3 stale gl_entries/gl_lines readers to canonical entries table
bcdc6735 2026-08-03 docs: remaining audit reports + owner-scope auth helper + nginx config + audit tooling
11a6d619 2026-08-03 docs: commit accumulated audit/vision/migration reports (2026-06-03..2026-07-14)
39dc6089 2026-08-03 fix(hr): in-progress compat/bonus/DTO/schema updates + i18n baseline refresh
584b203b 2026-08-03 chore: gitignore runtime uploads + stray nul artifact
c82833b4 2026-07-14 fix(org-node): delete-confirm dialog Cancel button was untranslated
a65bd1d5 2026-07-14 fix(i18n): remove stray required-marker asterisk from shared "xodim" key
eccecd8f 2026-07-14 fix(org-node): CkpTab Rules-of-Hooks violation crashing ЦКП tab
29ff67e0 2026-07-14 fix(org-structure): childCount/vacantChildCount self-correlating subquery
bbae6c41 2026-07-14 feat(hujjat): P1-5 configurable page margins (Oddiy / Tor / Keng)
7c562072 2026-07-14 feat(hujjat): P1-11 clean PDF/print view — "PDF ko'rinishida ochish"
05e23060 2026-07-14 fix(hr): karta-detail MainTab.tsx labels — stale text + broken i18n
0b99a0a8 2026-07-14 feat(sec): P2-5 tier-aware idle auto-logout (decision #9)
fa19fdb3 2026-07-14 feat(hr): vacant org-department cards visible as a table on Recruiting/Kanban
575890c4 2026-07-14 feat(cc): P1-9 related_erp_spreadsheet_id — sheet-sourced CC records joinable by sheet id
6c6840b8 2026-07-14 fix(hr): EditDialog inconsistencies + real Vakant lavozimlar list view
36dae966 2026-07-14 feat(hujjat): P1-8 fill down/right (Ctrl+D/R) + P1-6 real absolute-reference semantics
8460a0dc 2026-07-14 fix(api): GET nodes/:id ambiguous salary_type column broke every karta detail/edit
4f2eb25f 2026-07-14 feat(hujjat): P1-7 multiple sheets (varaqlar) in the Jadval editor — no schema change
8b325517 2026-07-14 feat(hr): karta badge # raqami endi tur-bo'yicha, global DB id emas
31219784 2026-07-14 feat(hujjat): P1-3 find & replace in the Word editor (Ctrl+F)
97df0a4f 2026-07-14 refactor(hr): org-sxema toolbar cleanup, KPI polish, real ЦКП/ish-soati i18n
14645d0b 2026-07-14 feat(hujjat): P1-2 Word device image upload (not URL-only)
dd22575e 2026-07-14 feat(hujjat): P1-4 live word + character count in the Word editor
8a93bd5d 2026-07-14 feat(hujjat): P1-1 Word table row/column/merge editing controls
73c92ad1 2026-07-14 fix(hujjat): move audit panel to Admin Panel module + open Erkin Hujjatlar to everyone (owner)
c48ce8c5 2026-07-14 refactor(hr): consolidate ЦКП fields into one group, "Ish soati" -> number
63c93b87 2026-07-14 feat(docctl): P0-5 roll-out view/print logging to technology-card + lms-certificate (STEP 3.10)
d3dce4c4 2026-07-14 feat(sd): P0-3 watermark + client_export logging on invoice PDFs (STEP 3.7)
5cf2ad02 2026-07-14 refactor(hr): karta forma "Ish vaqti/smena" -> plain "Ish soati" field
f6b8a3b5 2026-07-14 refactor(hr): remove org-sxema drag-and-drop card reparenting
6443dec7 2026-07-14 fix(chat): P0-4 repair hr-v2/chat 404 drift — thread/forward/poll-create broken via UI
c1b50b82 2026-07-14 fix(hr): org-sxema skip-level connectors jog right after the parent
314dfc24 2026-07-14 feat(hujjat): P0-2 wire copy-action logging in Word + Excel editors
d39b0421 2026-07-14 fix(hr): org-sxema canvas rows now follow tier, not tree-recursion depth
e2301f55 2026-07-14 feat(hujjat): P0-1 director audit panel — the read side of document-control (STEP 3.9)
38856bac 2026-07-14 fix(api): stop nestjs-i18n generated-types self-restart loop in dev
e2244914 2026-07-14 refactor(hr): unify org-card taxonomy into 6-tier bilingual (UZ/RU) system
a3acdb34 2026-07-14 fix(dev): self-heal stale service worker that blocked the app from loading in dev
c7a03306 2026-07-14 fix(org): karta belgisi tanlangan turini emas, chuqurlikni ko'rsatardi
d0228592 2026-07-14 feat(brand): use the new EuroPrint logo everywhere (sidebar, header, login), uncropped
46be7f56 2026-07-14 fix(hr): remove dead employees.role badge from profile - confusing RBAC duplication
ffecd66f 2026-07-14 feat(hujjat): EuroPrint logo letterhead at top-left of every document + spreadsheet
da1202aa 2026-07-13 fix(hujjat): spreadsheet formulas accept ';' separator (RU/UZ Excel locale)
7cabf2fb 2026-07-13 feat(hujjat): Ctrl+S saves the document/spreadsheet (owner ask)
361b8a3d 2026-07-13 feat(hujjat): spreadsheet undo/redo — Ctrl+Z reverts, Ctrl+Y redoes (owner ask)
0808995d 2026-07-13 fix(hr): manager-picker envelope mismatch - showed unrelated user accounts, not employees
ad56bd98 2026-07-13 feat(hr): Vysotskiy grade salary presets -> business_settings (owner asked where this is configured)
9e2e2d25 2026-07-13 test(hujjat): prove every DocumentToolbar button is wired to a working command
228200e3 2026-07-13 fix(hr): P0 - every "add employee" 500'd - phantom face_embedding column
0e9e4a5c 2026-07-13 feat(hujjat): live autosave for documents and spreadsheets (owner: live saqlashi kerak)
2a3669c9 2026-07-13 fix(hujjat): narrow spreadsheet cell width further (owner: eni katta)
27453fb2 2026-07-13 fix(hujjat): spreadsheet cells too big + "cell inside a cell" look
d5a6327a 2026-07-13 fix(org): rang tanlash butunlay olib tashlandi - egasi qarori (standart 7 daraja yetarli)
155eb4e6 2026-07-13 fix(org): tree karta ranglari umuman ko'rinmasdi - CSS grammatika xatosi
93283364 2026-07-13 feat(hujjat): CC-send for spreadsheets + spreadsheet-editor seed-once guard
e03fa060 2026-07-13 fix(hujjat): stop unsaved editor changes from disappearing on background refetch
7ea4b69c 2026-07-13 feat(hujjat): spreadsheet copy/paste — Ctrl+C/V/X + visible "Nusxa" button
68270679 2026-07-13 fix(hr): Nazorat cluster - Intizom escalation, Xavfsizlik PDF/DTO crashes, Kasbiy O'sish 400
5d26ade1 2026-07-13 feat(hr): HR Xarita - add geo-consent + wire lat/lng save on employee dialog
7df7d889 2026-07-13 fix(hr): Baholash cluster - 360 rating column drift, Skills Matrix wrong table, Mentorlik/Succession crashes
abbaa672 2026-07-13 fix(hr): Offboarding - checklist crash, mandatory exit-interview vs vision, hr_alumni never written
eb1899f5 2026-07-13 feat(hujjat): unify "Mening hujjatlarim" list — show spreadsheets, not just text docs
1ac2204f 2026-07-13 fix(crm): remove duplicate ai/extended/* aliases that crashed Fastify at boot
eccf3089 2026-07-13 fix(hr): Onboarding - wire card-assignment -> onboarding -> document-gated payroll
d917809b 2026-07-13 fix(hr): Rekruting Voronka - pipeline drag/drop silently discarded state+audit
3bf2c3a9 2026-07-13 fix(hr): HR V2 - Kunlik Hisobot override contract + PDF Cyrillic + Reception stats
aafb8caf 2026-07-13 fix(hr): Haftalik Reja - camelCase drift on write-paths + real 5h timezone bug
337ba5a2 2026-07-13 feat(hr): Referral Tizimi - fix real bugs on hr_referrals, wire probation-bonus + funnel-sync
a761cece 2026-07-13 fix(hr): Davomat/Smena cluster - orphaned notification-settings route + hard-delete
6970fde3 2026-07-13 fix(hr): Xodimlar - updateEmployee ::text/numeric cast crash + 11 orphan fields
fc23166b 2026-07-13 fix(org): Portret wizard ON CONFLICT crash + add required-equipment ("jihozlar")
5bfc1a3d 2026-07-13 fix(ai): AI HR Dashboard - honest ai_unavailable status + budgets to business_settings
b16c734e 2026-07-13 feat(jadval): growable grid (add rows/columns) + full formula picker
ee825fa3 2026-07-13 fix(hr): HR Dashboard - scope birthday PII to manager's department, fix lang param
5f313eb8 2026-07-13 feat(hr): Xato Katalogi - seed 18 print-defect rows + major-severity color fix
6202650d 2026-07-13 feat(jadval): expand formula engine 11 -> 30+ functions (owner: funksiyalari juda kam)
c264fd00 2026-07-13 fix(hr): HR Brend — hr_brand_settings ON CONFLICT crash + drop vestigial company_id
d38ab8e7 2026-07-13 fix(hr): Maqsadlar (Goals) — delete-RBAC + create/update camelCase crash
e397bdd4 2026-07-13 fix(jadval): make select-all obvious — labelled button + clear highlight + range label
d78c0489 2026-07-13 fix(jadval): last cell edit lost on Save + select-all not discoverable
224beb61 2026-07-13 docs: HR+Org vizyon faylini fon-agent topilmalari bilan kengaytirish
a69af391 2026-07-13 test(erkin-hujjat): self-audit — functional proof of Word + formula features
2bdb37f6 2026-07-13 docs: HR+Org-struktura vizyon va chala-ishlar konsolidatsiya (2026-07-13)
7897e35c 2026-07-13 feat(jadval): range select-all, formula (fx) helper, column filter (owner-requested)
9699d044 2026-07-13 fix(jadval): cell needed a double-click before typing (owner bug)
4efa0dbe 2026-07-13 fix(erkin-hujjat): imported/loaded document text was not shown in the editor
91fb1bd3 2026-07-13 fix(i18n): 5 AI Rejalashtirish pages showed literal "Sarlavha"/"Tavsif" placeholder titles
2ae9e2f6 2026-07-13 fix(pp): Quvvat Rejasi (Capacity Planning) — fake create, wrong response shape, crash
e09811e2 2026-07-13 fix(pp): PP Dashboard "Yangi buyurtma" button pointed at a dead /order-wizard route
26888b47 2026-07-13 fix(security): raw SQL/schema text was leaking to the browser on 5xx errors
40169a24 2026-07-13 feat(jadval): Excel cell borders + background fill color
0dc3118e 2026-07-13 feat(ai): implement Demand Forecast + Rush Orders (were 501 stubs)
b2858aee 2026-07-13 feat(erkin-hujjat): Import Word .docx into a new document (item #4)
41d12182 2026-07-13 feat(design): build Dizayn Kutubxona asset library end-to-end (was dead button)
f1df0385 2026-07-13 feat(qc): wire qc_lab_tests session model into DTO/service/repo (real, not stub)
5ee29a5a 2026-07-13 feat(schema): add qc_lab_tests session columns, ai business_settings, rush_order_requests table
53296ac8 2026-07-13 feat(erkin-hujjat): Word — font family + font size dropdowns
2c6deb4d 2026-07-13 fix(pp): Vaqt va Tannarx calculator's Hisoblash button was fully dead
20f2a1b5 2026-07-13 fix(pp): Marshrutlar (Routing) page had a dead create button behind an early return
7f8a2e09 2026-07-13 feat(jadval): Excel formulas — MIN/MAX/ROUND/CONCATENATE/VLOOKUP/TODAY/NOW + abs refs
f91a1e15 2026-07-13 feat(jadval): Phase B-4a — cell-format toolbar (bold / align / number-format)
556de843 2026-07-13 fix(jadval): formula engine — IF string result + cycle error propagation
a49a78b5 2026-07-13 feat(jadval): Phase B-3 routing — spreadsheet routes + enable "Jadval" card
5abece33 2026-07-13 fix(marketing): PR Faoliyat header rendered literal "{t('prMedia')}" text
8de84c1b 2026-07-13 fix(qc): Sifat Sertifikatlari showed malformed "berildi1" label
25d5b617 2026-07-13 fix(qc): Reklamatsiya row showed "Invalid Date" — wrong field name
2eae3d4d 2026-07-13 fix(qc): AI Tahlil crashed on every load — object rendered as React child
7dc92a85 2026-07-13 fix(qc): Yetkazuvchi Sifati crashed on first populated fetch after save
092d665d 2026-07-13 fix(qc): Parametrlar/Normalar routes redirected away before their tab could render
664e9641 2026-07-13 feat(jadval): Phase B-2 — erp_spreadsheets CRUD API + control-layer wiring
f89b5034 2026-07-13 fix(qc): Material Testlari saved but never showed rows — .grouped envelope mismatch
119565a5 2026-07-13 fix(i18n): qc namespace loaded qcreview.json instead of qc.json — 13 pages affected
16be54fc 2026-07-13 fix(marketing): Blog Maqola create always 422'd, dropped SEO/cover/tags fields
8fd71616 2026-07-13 fix(marketing): NPS/Churn list never showed created records
deaf127f 2026-07-13 feat(jadval): Phase B-1 — erp_spreadsheets table (spreadsheet authoring)
f5bbeb9a 2026-07-13 feat(erkin-hujjat): item 3/5 — gated "Chop etish" print (was native Ctrl+P, ungated)
e2610467 2026-07-13 feat(erkin-hujjat): item 2 — Word-style name prompt on first save
4a61bdfc 2026-07-13 feat(erkin-hujjat): item 1 — format-selection screen on "Yangi hujjat"
f8b9a0e9 2026-07-13 feat(erkin-hujjat): STEP 3.6b-2 — "Erkin hujjat" selectable in CC's create flow
379fe005 2026-07-13 fix(sd): quotation create — 400 on real submits, list showed dashes/0
9c6a4569 2026-07-13 feat(doc-control): STEP 3.6b-1 — start an "Erkin hujjat" from CC (backend)
0c9af901 2026-07-13 feat(erkin-hujjat): STEP 3.6a-3 — "CC orqali yuborish" action + employee picker
bb90aa35 2026-07-13 feat(doc-control): STEP 3.6a-2 — send an erkin hujjat into CC (backend)
09052070 2026-07-13 feat(doc-control): STEP 3.6a-1 — cc_documents <- erp_documents link + generic template
ad1c308e 2026-07-13 fix(sd): quotation price panel showed 0 for total/cost/markup/VAT
b003342c 2026-07-13 feat(erkin-hujjat): editor toolbar — text align, color, highlight, image
3abab602 2026-07-13 fix(sd): quotation price calc always returned 0 — camelCase/snake_case mismatch
7ac39579 2026-07-13 feat(erkin-hujjat): Google-Docs top bar — inline title, tier badge, save-status
9edf4bb9 2026-07-13 feat(erkin-hujjat): Google-Docs-style editor — paper canvas + sticky icon toolbar
905d396a 2026-07-13 fix(security): attendance-records 503 — Drizzle schema had a phantom timestamp column
2bf1bbab 2026-07-13 feat(mm): implement GET/PATCH/POST fleet/deliveries — was 501, real table existed unused
b0ff014f 2026-07-13 fix(marketing): inbox conversations 503 — untyped null param in raw SQL
7ad29bd1 2026-07-13 fix(fe): Reports Hub crash — imported translations dict shadowed by hook's t
1433e8a8 2026-07-13 fix(fe): Certificates dialog crash on courses?.map — missing Array.isArray guard
45e75886 2026-07-13 feat(erkin-hujjat): Phase A4 — "Mening hujjatlarim" list + sidebar entry
4872191c 2026-07-13 fix(fe): GoodsReceiving/cameras-management/camera-alerts crash — fake callable-object cast
4230840a 2026-07-13 feat(erkin-hujjat): Phase A3 — TipTap rich-text editor + create/edit routes
cfe8f235 2026-07-13 fix(sd): sales_orders INSERT hardcoded design_flag/sample_flag=false, dropped currency
0f90ee07 2026-07-13 fix(sd): unblock /order-create — required product/BOM catalog fields were empty forever
0a422b5e 2026-07-13 feat(erkin-hujjat): Phase A2 — erp_documents CRUD API + control-layer wiring
e4f08623 2026-07-13 feat(erkin-hujjat): Phase A1 — erp_documents table (free-form documents)
a533d49a 2026-07-13 feat(doc-control): STEP 3.5 — in-app chat delivery of document assignments (Tizim)
3b8dcbd5 2026-07-13 fix(i18n): add missing SD Customer 360 translation keys (owner-reported console warnings)
23c43bb4 2026-07-13 fix(sd): Customer 360 payments tab always showed empty history
3728606f 2026-07-13 feat(doc-control): STEP 3.4 — tier-driven watermark on document viewers
e5bac042 2026-07-13 feat(doc-control): STEP 3.3 — view/copy/print access-logging, piloted in CC
ded9b592 2026-07-13 feat(doc-control): STEP 3.2 — backend blocks Content-Disposition:attachment by default
33265e27 2026-07-13 fix(erp): relabel "Mahsulot yaratish" tab to "Xom-ashyo yaratish" (was mislabeled)
91e4a29e 2026-07-13 feat(design): remove DesignOrders.tsx's dead "create order" dialog
b928a1ec 2026-07-13 feat(doc-control): STEP 3.1 — document_access_log table + sensitivity_tier + Tizim user
049c5392 2026-07-13 feat(sd): remove SDSalesOrders.tsx's duplicate create-order dialog
06f54379 2026-07-13 feat(orders): Papka Buyurtmalari "Yangi Buyurtma" now redirects to /order-create
7755b105 2026-07-13 fix(api): raise Fastify bodyLimit to 30MB so chat file upload reaches its 25MB cap
53cc000f 2026-07-13 feat(orders): /order-create wizard now creates a real sales_orders row
3a0d20de 2026-07-13 feat(sd): canonical order-create path now accepts bespoke (no-SKU) line items
e7dace07 2026-07-13 feat(chat): add audio-only call button (was missing)
5958224c 2026-07-13 fix(chat): reactions + pin were 404/403 — add /api/chat aliases, fix pin roomId bug
1fea7183 2026-07-13 fix(hr): employee profile-photo upload was a complete no-op
2ed9c35b 2026-07-13 fix(marketing): Competitors tab now renders backend's real fields, not fake ones
5d35bbbb 2026-07-13 fix(sd): payment create now accepts camelCase orderId/customerId/dueDate
0898a766 2026-07-13 fix(chat): panel "Vazifa yaratish" button was 400 (board_id empty) — add board picker
eff7b4cb 2026-07-13 fix(marketing): content-post CREATE always failed (missing platform, body/content DTO mismatch)
bbb4af79 2026-07-13 fix(marketing): unwrap {data,...}/{items:[...]} response envelope in 5 list queries
e35bd440 2026-07-13 fix(sd): quotation-to-order conversion now carries the product line-items across
425ee8f9 2026-07-13 feat(chat): "Xabardan Task Yaratish" now creates a real Kanban card + link
eca9e0cb 2026-07-13 feat(director): CouncilQuorum FE — per-member vote casting wired to council_votes
8b83413b 2026-07-13 fix(chat): channel creation actually creates a CHANNEL (was always GROUP)
79ad9f5f 2026-07-13 fix(chat): add singular rooms/:id/pinned route to /api/chat (was 404)
36630c78 2026-07-13 feat(kanban): add GET /api/kanban/resource-allocation endpoint
1f759fd8 2026-07-13 fix(notifications): land the module/port/adapter unwiring dropped from a3c74437
a3c74437 2026-07-13 refactor(notifications): remove dead TelegramSvc/AlertsService/erp-events-listener stack
493d1fe2 2026-07-13 feat(notifications): category_code taxonomy soft-ref (notification_category)
627359f9 2026-07-13 fix(chat): xodim-panel md-breakpoint (768px'da ham ko'rinadi)
25753ffd 2026-07-13 feat(notifications): HR absence-day1/day2/blocked handlers now persist real notifications
166c6d38 2026-07-13 fix(chat): related-tasks 503 (status ustuni yo'q) + telefon i18n kaliti
7abcfa17 2026-07-13 fix(director): AlertFeed action buttons dispatch real actions, not just markRead (Q-40)
094d18d7 2026-07-13 feat(cc): document_type_code/contact_type_code taxonomy soft-ref on templates
26e7cc02 2026-07-13 feat(cc): document_hashes table for PDF integrity check (schema-only)
4ad0fc81 2026-07-13 feat(kanban): seed QC/production/design boards to unblock today's auto-card triggers
c555d7fd 2026-07-13 fix(kanban): window.confirm -> ConfirmDialog on delete-board/delete-column (Qoida 14)
392ee498 2026-07-13 feat(chat): xodim-panel stat-qatori — ochiq vazifalar + CC soni (design STEP 3.4, 3g)
20098312 2026-07-13 fix(kanban): PDF export failure returns real 500, not a fake placeholder file (Q-40)
858b6de3 2026-07-13 feat(chat): xodim-panel "Vazifa yaratish" tugmasi (design STEP 3.3, 3e)
6c368d31 2026-07-13 fix(telegram): TELEGRAM_BOT_TOKEN via ConfigService, guard on missing token (Qoida 7)
63a37468 2026-07-13 feat(chat): xodim-panel "Izohlar" tab — suhbat izohlari (design STEP 3.2)
a3d6db30 2026-07-13 feat(chat): chat_room_notes jadval — Izohlar tab schema (design STEP 3.1)
77647b36 2026-07-13 fix(chat): membership 403 — chat_members integer/text drift (tugmalar buzuq edi)
e2dadf16 2026-07-13 fix(chat): WS auth cookie-asosli — xabar ketmasligi TUZATILDI (P0 regressiya)
2db4f06b 2026-07-13 fix(crm): correct CRM ownership column for row-scoping (B59)
d496c994 2026-07-13 fix(chat): direct-room aniqlash case-insensitive (jonli data 'direct'+'DIRECT')
84e7486e 2026-07-13 fix(chat): xodim-panel endi DM'da DOIM ko'rinadi + haqiqiy a'zolardan
ca379007 2026-07-13 feat(coordination): dokla/rasporyazhenie hard-delete -> soft-delete (D8)
2332345d 2026-07-13 feat(kanban): per-column WIP-limit override + supervisor bypass (C5)
3765d7e6 2026-07-13 fix(cron): CqrsModule import — MesSosEscalation[EventBus] boot DI xatosi
a9f25fd9 2026-07-13 feat(qc): customer-fault defect flag auto-notifies sales manager (A106)
072fce93 2026-07-13 feat(cc): MES/QC/HR/PP domain events auto-spawn CC documents (D2)
8a3d223f 2026-07-13 feat(chat): xodim-panel "Bog'liq vazifalar" tab (design STEP 3.5)
34ceed0f 2026-07-13 feat(kanban): QC/MES/Design → Kanban card auto-creation triggers (C4)
9905ed2c 2026-07-13 feat(chat): xodim-panel tab-bar + Fayllar tab (design STEP 3.4)
2e53ed32 2026-07-13 feat(cc): super_admin-only CRUD for document templates (D1)
5d5dcdf7 2026-07-13 feat(chat): xodim-panel suhbat teglari (design STEP 3.3)
4241faa0 2026-07-13 feat(finance): A16all 5 new GL accounts (loss/waste-income/marketing/referral/in-transit)
c430ab1a 2026-07-13 feat(notifications): E1 module_code/channel/status/immutable columns
71fd67e3 2026-07-13 feat(chat): xodim-panel ish-holati indikatori — presence work_status (design STEP 3.2)
48bcb53c 2026-07-13 fix(cc): D0 CC approval auto-posts to GL for financial templates (P0)
50456109 2026-07-13 feat(kanban): E6 TT mandatory fields + 24h SLA matching CC template rules
ad7d19e1 2026-07-13 feat(chat): 3-panel inbox — xodim-profil paneli "Umumiy ma'lumot" (design STEP 3.1)
8113fb80 2026-07-13 feat(cc): D6 wire archive_after_days + 90-day stale-draft archive cron
58ae162e 2026-07-13 feat(kanban): C8 confidential-card flag hidden from general board
7be29be0 2026-07-13 feat(chat): 3-panel dizayn schema — work_status + chat_room_tags (design STEP 2)
282dd34b 2026-07-13 feat(kanban): C1 seed 7-stage Buyurtmalar orders board
854ee24e 2026-07-13 feat(kanban): C2 add progress/qoldiq-tolov/station-operator/comment-flag to cards
c14bc029 2026-07-13 feat(kanban): C9 migrate overdue-escalation + recurring-cards cron to BullMQ
35d21e2c 2026-07-13 feat(pp): A123 wire decoration_type taxonomy into technology_cards + AI-planning
cac951e5 2026-07-13 feat(chat): delete-for-me + audit-channel immutability (Phase-2 #6/#7)
6750bb84 2026-07-13 feat(taxonomy): C7 norm-time master-data via operation_type attrs.duration_minutes
bb45e9b3 2026-07-13 feat(sd): A102 customer view-all/edit-own ownership gate
040753f9 2026-07-13 feat(sd): A125 wire code_prefix taxonomy (KT/PT/E/GL) onto ow_molds
b9553e88 2026-07-13 fix(chat): retry idempotentligi — (room_id, client_msg_id) UNIQUE + ON CONFLICT
a7bc7651 2026-07-13 feat(notifications): E5 converge NotificationCenter.tsx onto unified /api/notifications
a66e840d 2026-07-13 fix(director): B13 dashboard plan-fact join uses org_departments (canonical)
f5dba662 2026-07-13 feat(chat): offline queue — disconnected'da navbat + failed/retry holati
7696ecea 2026-07-13 feat(chat): optimistik send + client_msg_id round-trip (messenger-feel)
d05e0298 2026-07-13 feat(chat): reconnect catch-up — uzilishda o'tkazib yuborilgan xabarlar tortiladi
33dfe1a1 2026-07-13 fix(chat): reconnect siyosati — cheksiz urinish + eksponensial backoff
86239eff 2026-07-13 fix(chat): WS soket auth-drift tuzatildi (P0 — realtime ulanmasdi)
6d5a40b1 2026-07-11 feat(lms): #30 sertifikat yuridik-minimal maydonlari (issued_ip + SHA-256 cert_hash)
b225479e 2026-07-11 feat(pos): #17/#117 favqulodda chiqim is_unplanned+sabab majburiy+Telegram push
c47a330f 2026-07-11 feat(sd): #24 qisman-yetkazish invoice_type (full/partial) hisoblanadi
47ccb174 2026-07-11 feat(crm): #5 KP (taklifnoma) email-pixel ko'rish tracking (viewed_at)
363cf909 2026-07-11 feat(mm): 11.25 PO uchun Incoterms/yetkazish shartlari (delivery_terms) qo'shildi
978ae170 2026-07-11 feat(notifications): #88 sender_id (yuboruvchi) ustuni qo'shildi
3d500908 2026-07-11 feat(crm): #80 lid hududi (region) va eksport/ichki belgisi qo'shildi
cd412d3a 2026-07-11 feat(marketing): #20 promo-kod CRUD (default 1 mijoz/1 kampaniya limiti)
ef9f43a1 2026-07-11 feat(marketing): #96 STIR/shartnoma/manzil rekvizit to'liqlik darvozasi (CRM'ga o'tishdan oldin)
9599b862 2026-07-11 feat(pos): #26 EXTERNAL_OUT chiqimda mijoz kredit-limiti real-time tekshiriladi
086fb5db 2026-07-11 feat(pos): #131 yuk topshirish nizo holati (DISPUTED) qo'shildi
e2545e97 2026-07-11 feat(sd): #120+#133 mijoz uchun to'lov turi va qadoqlash usuli qo'shildi
5599aefe 2026-07-11 feat(sd): #12 100%-avans chegirmasi (business_settings CRUD) qo'shildi
1909ba47 2026-07-11 feat(crm): #59/#67 lead mahsulot turi (ofset/gofra/etiketka/flekso/blanka) qo'shildi
02cc4a70 2026-07-11 feat(mm): 11.44 vendor QQS to'lovchi (is_vat_payer) bayrog'i qo'shildi
5e32af91 2026-07-11 feat(notifications): #112 bildirishnomalar priority bo'yicha saralanadi
d2098c77 2026-07-11 feat(kanban): A17 bekor qilingan kartalar KPI'da neytral hisoblanadi
21a335e3 2026-07-11 feat(notifications): #111 type/priority->icon xaritalash birlashtirildi
e87ae0e9 2026-07-11 feat(kanban): A39 karta-egasi reyting formulasi (achievement*0.7-escalation*0.3)
3a5a3743 2026-07-11 feat(pos): #49 pos_movements.mes_session_id FK production_sessions'ga qo'shildi
ea8232e7 2026-07-11 feat(iot): #60 pereedelka (rework) brak sabab kodi seed qilindi (DEF-U-005)
7535e2ae 2026-07-11 feat(kanban): C27 vizyon 3-daraja ustuvorlik nomlash qo'shildi (Shoshilinch/Oddiy/Past)
940d8f8c 2026-07-11 feat(mm): 11.59 'conditional' status goods receipt uchun qo'shildi
e729f18f 2026-07-11 fix(notifications): 18-notif KRITIK - Telegram userId chat_id sifatida yuborilardi, hech qachon yetmasdi
efd89722 2026-07-11 feat(sd): 06-sd#35 QC_HOLD holati - QC rad etilsa bog'liq sotuv buyurtmasi ushlab turiladi
380f25f8 2026-07-11 feat(cc): 20-cc#5/#10/#47/#89/#31 ai_draft, eskirgan-flag, ko'rish-belgisi, sabab-havola, rahbar-xulosa
dca6949f 2026-07-11 feat(cc): 20-cc#11 bola-hujjat faqat ota tasdiqlangan/jarayonda bo'lsa yaratiladi
a4cc8b85 2026-07-11 feat(admin): SD/PP threshold qiymatlar business_settings CRUD'ga (jarima%, margin floor, kichik-tiraj)
cd940c4d 2026-07-11 fix(cc): 20-cc#30 48h avto-rad etish olib tashlandi, 24h takroriy eslatma qo'shildi
31fbc7df 2026-07-11 fix(cc): 20-cc#39 GET /cc/documents/:id xavfsizlik teshigi - ownership tekshiruv yo'q edi
9bdd5817 2026-07-11 fix(wms): 10-wms#31 poddon birlik soni butun bo'lishi kerak
ae957e6d 2026-07-11 feat(cc): prikaz kategoriya+kuchga-kirish, dokla turi+SLA+papka, council COI
a7a5fb04 2026-07-11 feat(mes): DT-MOLD seed, gofra qatlam+m2 ustunlari, OEE-target FE ulanishi
8c209037 2026-07-11 fix(org): tahrirlashda 'sabab' yo'qligi + rbac/smena parity AddNodeDialog bilan
c82e6366 2026-07-11 fix(org): RBAC avtomatik hint, smena-turi CRUD, karta papkasiga haqiqiy fayl yuklash
82456757 2026-07-11 fix(org): karta yaratishda 4 kamchilik - rang, otdeleniyeNo, smena-preset, mobil grid
4deb21d2 2026-07-11 fix(org): karta yaratishda 422 — reason-gate faqat PATCH uchun
d39ec98a 2026-07-11 fix(org): remove duplicate 'Sektor' label, wire Vysotskiy-7 tiers into head-bearing + stats
73e2d33d 2026-07-11 docs(audit): full company-data reset 2026-07-11
64524505 2026-07-11 docs(owner): 5 taxonomies finalized + legal + global principle; ⚠️ org-delete verification flag
6d27e557 2026-07-11 feat(admin): seed contact/direction/operation taxonomy (15 more entries, owner 2026-07-11)
ef838119 2026-07-11 docs(schema-wave): SD 16/30 landed + migrations applied; 14 sd-quotations cluster casualties for regen
9ad0c5bb 2026-07-11 feat(sd): optional legacy 1C 'Zakaz 1S' order number (06-sd#154)
e9636c9e 2026-07-11 feat(sd): gofra layer count 2/3/5-sloy + non-blocking load hint (06-sd#147)
3f3272cb 2026-07-11 feat(sd): two-sided print (bez/s oborotom) 2x factor on print cost — 06-sd#145
b19926fd 2026-07-11 feat(sd): 06-sd#142 kashirovka alohida operatsiya + narx
dc312a31 2026-07-11 feat(sd): roll self-adhesive parameters on quotation items (06-sd#118)
29144337 2026-07-11 feat(sd): load capacity kg + non-blocking flute/layer rec (06-sd#107)
9126e2cd 2026-07-11 feat(sd): machine format (72/52SM/KVA) catalog + per-line select — 06-sd#102
ecd65203 2026-07-11 feat(sd): printing method offset/flexo + rule-based AI rec (06-sd#101)
2c2147f3 2026-07-11 feat(sd): Ожд.Сырьё pending_material status + Ta'minot material signal (06-sd#100)
07d94984 2026-07-11 feat(sd): structured contract terms (payment/penalty/penya/currency) on sd_contracts — 06-sd#78
2060a140 2026-07-11 feat(sd): kashirovka offset+gofra predecessor sync + MES can-start gate
e989152c 2026-07-11 feat(sd): per-line deadline scheduling (line_deadline + per_line_scheduling)
b87b8819 2026-07-11 feat(sd): nightly inactive-customer cron (crm_inactivity_rules A=90/B=60/C=30)
da4cab62 2026-07-11 feat(sd): shared forma (die_code) auto-detect + warning
3d6be023 2026-07-11 feat(sd): klishe/forma ~3yr retention cron + write-off act (06-sd#14)
7681905b 2026-07-11 feat(sd): material-wait MM-reject/24h->48h escalation (06-sd#2)
1920cb2a 2026-07-11 docs(owner): append taxonomy content + GL rules + credentials resolutions (2026-07-11)
0ad6f154 2026-07-11 feat(fe): add kanban/notification/org-policy/manager-note categories to taxonomy dropdown
de4004d8 2026-07-11 feat(admin): seed 81 taxonomy entries from owner's confirmed §2 lists
7ec31c9e 2026-07-11 docs(schema-wave): BATCH-1 COMPLETE 39/39 (pp124+mes33 landed); flag migrations-not-applied
5bf6e6fd 2026-07-11 feat(mes): exclude academy/training sessions from OEE + LMS-sync flag
2cb0c620 2026-07-11 feat(pp): multi-line order — production_order_lines child (each position own route)
783c76b3 2026-07-11 feat(fe): taxonomy manager screen (/admin/taxonomy)
5862380a 2026-07-11 feat(admin): generic taxonomy_entries CRUD — §2 named-list registry (product types, discount, decoration…)
9a9fb98b 2026-07-11 docs(owner): 2026-07-11 decision journal — architecture/strategic/finance/RBAC/workflow answers
eba8342a 2026-07-11 feat(admin): seed 53 §1 business_settings keys — owner fills values via CRUD screen
db0f0fe3 2026-07-11 feat(shared): getBusinessSettingNumber/Text reader — cross-module settings reads (no hardcode)
121a141b 2026-07-11 feat(fe): business-settings management screen (/admin/business-settings)
c7a4fcfb 2026-07-11 feat(admin): global business_settings CRUD — no-hardcode threshold/norma/%/day/amount registry
eb6c24bb 2026-07-11 docs(owner): record 2026-07-11 owner answers — global CRUD rule + 10-section triage
```

## Commit → tegilgan fayllar

```
=== fcf401fa fix(finance): verifyPayment now compensates when the GL post fails (T25)
apps/api/src/modules/finance/application/finance-actions.service.ts
apps/api/src/modules/finance/domain/repositories/i-finance-actions.repo.ts
apps/api/src/modules/finance/infrastructure/repositories/finance-actions.repository.ts

=== a14beb91 fix(hr): passport form silently dropped 5 of 7 fields (T29)
apps/api/src/modules/compatibility/employees-compat-profile-orm.service.ts
apps/api/src/modules/compatibility/employees-compat-profile-raw.service.ts
artifacts/erp-dashboard/src/components/employee/dialogs/PassportDialog.tsx
artifacts/erp-dashboard/src/pages/employee-profile/PassportCard.tsx

=== 79799548 fix(admin): surface two orphaned CRUD pages + correct stale guard docs (T26)
apps/api/src/common/guards/tenant-filter.guard.ts
artifacts/erp-dashboard/src/components/sidebar/constants.ts

=== d74a12db chore(cleanup): delete two dead files + stale CLAUDE.md entry (T27,T28A)
CLAUDE.md
apps/api/src/modules/kanban/presentation/kanban-ext.controller.ts
apps/api/src/modules/mes/mes.gateway.ts

=== ccd017c0 fix(sd): close remaining §3.6 IDOR items 3-5 — ownership scoping (T6)
apps/api/src/modules/crm/application/commands/delete-deal.handler.ts
apps/api/src/modules/crm/application/commands/update-deal.handler.ts
apps/api/src/modules/crm/deals/deals.service.ts
apps/api/src/modules/crm/presentation/crm-deals.controller.ts
apps/api/src/modules/sd/application/queries/get-order-by-id.handler.ts
apps/api/src/modules/sd/application/queries/get-order-items.handler.ts
apps/api/src/modules/sd/presentation/sd-orders.controller.ts
apps/api/src/modules/sd/presentation/sd-payments.controller.ts

=== c7d4d0f8 fix(cc): finish Qoida-6 cleanup + escalations now reach Telegram (T24)
apps/api/src/modules/communication-center/communication-center.module.ts
apps/api/src/modules/communication-center/cron/cc-sla.cron.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-read.repo.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== 896988c9 fix(pp): AI generate/optimize buttons showed scary errors on 501 (T22A)
artifacts/erp-dashboard/src/pages/TechCards.tsx

=== cc697334 fix(chat): FCM/APNS push stubs faked success (T18)
apps/api/src/modules/chat/push.service.ts

=== f318bbfe fix(mes): wire the material-kit two-signature gate into the real flow (T13)
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
apps/api/src/modules/wms/presentation/wms-barcode.controller.ts
artifacts/erp-dashboard/src/locales/ru/warehouse.json
artifacts/erp-dashboard/src/locales/uz-cyr/warehouse.json
artifacts/erp-dashboard/src/locales/uz/warehouse.json
artifacts/erp-dashboard/src/pages/WarehouseDailyView.tsx
artifacts/erp-dashboard/src/pages/WarehouseDailyViewSections.tsx
artifacts/erp-dashboard/src/pages/WarehouseDailyViewTypes.ts

=== adb844e5 refactor(pp): move MRP matrix assembly out of the controller (T22B)
apps/api/src/modules/pp/application/services/pp-intelligence.service.ts
apps/api/src/modules/pp/presentation/pp-intelligence.controller.ts

=== 4d111226 fix(crm): five compat AI endpoints returned hardcoded fake-success (T20)
apps/api/src/modules/compatibility/crm-extended.service.ts

=== 8bef27c8 fix(chat): presence TTL sweep — users no longer stuck ONLINE forever (T17)
apps/api/src/modules/chat/chat-presence-cleanup.cron.ts
apps/api/src/modules/chat/chat.module.ts
apps/api/src/modules/chat/repositories/chat-presence.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts

=== b4eeffe0 fix(notifications): global bell was wired to a nonexistent endpoint (T16)
artifacts/erp-dashboard/src/components/DesignNotifications.tsx

=== 52eb84cb fix(lms): real FE exam-submit path never emitted lms.exam.passed (T15)
apps/api/src/modules/lms/application/services/lms-core.service.ts

=== 9ea7c155 fix(pos): second quarantine path + silently dead Telegram ext-bot (T23)
apps/api/src/modules/pos/application/services/pos-inventory-passport.service.ts
apps/api/src/modules/pos/application/services/pos-telegram-ext.service.ts

=== 9911a5d8 fix(wms): gateway warehouse list ignored is_active (T14)
apps/api/src/modules/wms/presentation/wms-gateway-warehouses.controller.ts

=== 56489f4d fix(marketing): Campaigns controller missed the 'manager' role-fix (T21)
apps/api/src/modules/marketing/presentation/marketing.controller.ts

=== ba4392cb fix(aisha): role-gate all 4 controllers + assign_task HITL pause (T9-T11)
apps/api/src/modules/aisha/application/conversation/aisha-conversation.service.ts
apps/api/src/modules/aisha/presentation/controllers/aisha-history.controller.ts
apps/api/src/modules/aisha/presentation/controllers/chat.controller.ts
apps/api/src/modules/aisha/presentation/controllers/voice.controller.ts
apps/api/src/modules/aisha/presentation/controllers/wake-config.controller.ts

=== f938bad5 fix(director): HITL approval self-approve SoD check (T5)
apps/api/src/modules/director/domain/aggregates/approval-request.aggregate.ts

=== 5ea59b02 fix(admin): privilege-escalation + fake-success holes in user management (T1-T3)
apps/api/src/modules/admin/application/services/create-user.service.ts
apps/api/src/modules/admin/application/services/update-user-role.service.ts
apps/api/src/modules/admin/domain/repositories/i-user.repo.ts
apps/api/src/modules/admin/infrastructure/repositories/drizzle-user.repo.ts
apps/api/src/modules/admin/presentation/controllers/admin-users.controller.ts

=== 8469ab6e fix(qc): approve/reject screens never published QC golden-thread events
apps/api/src/modules/qc/presentation/qc-defects.controller.ts

=== 7f4d7b6d fix(iot): tablet FE silently swallowed backend errors on 7 mutations
apps/api/src/modules/general/controllers/general-legacy-b.controller.ts
artifacts/erp-dashboard/src/pages/iot/useIoTTablet.ts

=== dbb78bee fix(director): ZNO controller had zero role-gating on create/list
apps/api/src/modules/director/presentation/zno.controller.ts

=== d97ad8ae fix(ui): add delete confirmation + missing onError handlers (Qoida 14/F2)
artifacts/erp-dashboard/src/pages/CRMWorkspace.tsx
artifacts/erp-dashboard/src/pages/PapkaOrders.tsx
artifacts/erp-dashboard/src/pages/SalesOrders.tsx

=== 74d4d5ec docs: log SD-CRM audit §5 integration-map verification results
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== b85d1d2f fix(sd): POST /sd/deliveries crashed on uuid/integer schema mismatch
apps/api/src/modules/logistics/infrastructure/repositories/drizzle-delivery.repo.ts
apps/api/src/modules/sd/deliveries/drizzle-sd-deliveries.repo.ts
apps/api/src/shared/db/schema-misc.ts

=== 0e068ec5 fix(finance): stop SD customer payments colliding on GL reference CP-0
apps/api/src/modules/finance/domain/services/gl-posting.service.ts
apps/api/src/modules/sd/application/sd-quotations.service.ts

=== b1456816 fix(crm): wire kanban drag-to-won to /won endpoint (CRM->SD golden thread)
artifacts/erp-dashboard/src/components/crm/workspace/useCRMWorkspace.ts

=== 3e95bbaa docs: SD-CRM §3.6 IDOR yopildi (65b5626c), §4 orphan-sweep egasi-qarorga qoldirildi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 65b5626c fix(sd): §3.6 IDOR — customers/leads GET endpointlar har qanday foydalanuvchiga ochiq edi
apps/api/src/modules/sd/presentation/sd-customers.controller.ts
apps/api/src/modules/sd/presentation/sd-leads.controller.ts

=== 2f967efd docs: SD-CRM §2 chuqur audit — 4 blokловchi bug tuzatildi (ikkinchi to'lqin)
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== c09e229c fix(sd): §2.4 taklifnoma->buyurtma konvertatsiyasi 500 bilan qulardi (2 qatlamli bug)
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-quotations.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts

=== 04a4e5db fix(crm): §2.1 Quick Create bitim (deal) yaratish BLOKLANGAN edi
artifacts/erp-dashboard/src/pages/crm/QuickCreateModal.tsx
artifacts/erp-dashboard/src/pages/crm/QuickCreateModalSections.tsx
artifacts/erp-dashboard/src/pages/crm/QuickCreateModalTypes.ts

=== 9938b607 fix(sd): §2.1 taklifnoma yaratish BLOKLANGAN edi (customer_name NOT NULL)
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts

=== 4e6bca52 fix(sd): §2.1/§2.2 shartnoma yaratish BLOKLANGAN edi (order_id NOT NULL) + fake-save
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/sd-contracts-start-date-total-amount-2026-08-06.sql
artifacts/erp-dashboard/src/pages/SDContracts.tsx

=== 384623c8 docs: Admin moduli tekshirildi — TO'LIQ 18-modulli sweep yakunlandi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== bc6e809e docs: Director qolgan qismi tekshirildi — toza, aniq band-son noma'lum (TaskList yo'qolgan)
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== ef220703 docs: POS moduli tekshirildi (4d7422fc) — M6 magic-number gap 4/4 to'liq yopildi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 4d7422fc fix(pos): karantin 48-soatlik eskalatsiya CRUD-sozlanadigan qilindi (M6 qolgan gap)
apps/api/src/modules/pos/application/jobs/pos-quarantine-check.job.ts
apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts
apps/api/src/modules/pos/infrastructure/repositories/quarantine-workflow.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/pos-quarantine-escalation-threshold-2026-08-06.sql

=== 37bef624 docs: IoT moduli tekshirildi (0f303945) — tablet green-lie FE+BE ikkalasida tuzatildi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 0f303945 fix(iot): tablet material-scan green-lie — FE va BE ikkalasida ham
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
artifacts/erp-dashboard/src/locales/ru/iot.json
artifacts/erp-dashboard/src/locales/uz-cyr/iot.json
artifacts/erp-dashboard/src/locales/uz/iot.json
artifacts/erp-dashboard/src/pages/iot/useIoTTablet.ts

=== f0432eaa docs: WMS moduli tekshirildi (993c5175) — predikat nomuvofiqlik + copy-paste bug
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 993c5175 fix(wms): #4 WMS/POS ombor-ro'yxati predikat nomuvofiqligi + isActive copy-paste bug
apps/api/src/modules/pos/application/services/pos-wms-query.service.ts
apps/api/src/modules/wms/application/queries/get-warehouses.handler.ts

=== 32f52769 docs: PP moduli tekshirildi — toza; 12/18 asosiy-modul to'lqini yakunlandi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== d50755f3 docs: LMS + repo-keng o'lik-import tozalash (3405c39e, 2cfeb8c2) — 22 fayl jami
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 2cfeb8c2 fix(api): repo-keng 15 ta o'lik notImplemented import + 2 ta eskirgan izoh tuzatildi
apps/api/src/modules/compatibility/europrint-control-director.controller.ts
apps/api/src/modules/compatibility/saas.controller.ts
apps/api/src/modules/design/presentation/design.controller.ts
apps/api/src/modules/finance/presentation/finance-extended-payroll.controller.ts
apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts
apps/api/src/modules/iot/presentation/iot-alerts.controller.ts
apps/api/src/modules/iot/presentation/iot-main.controller.ts
apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts
apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts
apps/api/src/modules/pp/production/production-reports.controller.ts
apps/api/src/modules/remaining/material-balance.controller.ts
apps/api/src/modules/wms/presentation/iot-enhanced.controller.ts
apps/api/src/modules/wms/presentation/wms-catalog.controller.ts

=== 3405c39e fix(lms): 2 ta o'lik notImplemented import olib tashlandi
apps/api/src/modules/lms/presentation/lms-lessons.controller.ts
apps/api/src/modules/lms/presentation/lms-misc.controller.ts

=== f35b16e6 docs: QC moduli tekshirildi (442d6bd4) — 2 o'lik import + M6 gap allaqachon tuzatilgan
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 442d6bd4 fix(qc): 2 ta o'lik notImplemented import olib tashlandi
apps/api/src/modules/qc/presentation/qc-defects.controller.ts
apps/api/src/modules/qc/presentation/qc-new.controller.ts

=== d2a0058f docs: MES moduli tekshirildi — sog'lom, o'zgarish kerak emas edi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 673bac75 docs: HR-Org moduli tekshirildi — 2026-05-28 audit-jadval eskirgan (7/7 stale)
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 578cf340 docs: Finance moduli tekshirildi (b4dd38ce) — sog'lom holat, 1 kichik tozalash
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== b4dd38ce fix(finance): o'lik notImplemented import olib tashlandi
apps/api/src/modules/finance/presentation/reports.controller.ts

=== 1805171e docs: Marketing manager-role P0 tuzatildi (5f26a02b) + repo-keng tekshiruv natijasi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 5f26a02b fix(marketing): 'manager' roli marketing_manager-gated 74/117 endpointda 403 olardi
apps/api/src/modules/marketing/presentation/customer-rhythm.controller.ts
apps/api/src/modules/marketing/presentation/manager-kpi.controller.ts
apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts
apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts
apps/api/src/modules/marketing/presentation/marketing-group2.controller.ts
apps/api/src/modules/marketing/presentation/promo-codes.controller.ts

=== 307c9d78 docs: SD/CRM manager-role P0 tuzatildi (9fabdacb) — sessiyaning eng katta topilmasi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 9fabdacb fix(sd-crm): 'manager' roli sales_manager-gated 25 endpoint-guruhda 403 olardi
apps/api/src/modules/crm/presentation/crm-activities.controller.ts
apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts
apps/api/src/modules/crm/presentation/crm-ai.controller.ts
apps/api/src/modules/crm/presentation/crm-auto-lead.controller.ts
apps/api/src/modules/crm/presentation/crm-comms.controller.ts
apps/api/src/modules/crm/presentation/crm-companies.controller.ts
apps/api/src/modules/crm/presentation/crm-contacts.controller.ts
apps/api/src/modules/crm/presentation/crm-deals.controller.ts
apps/api/src/modules/crm/presentation/crm-dedup.controller.ts
apps/api/src/modules/crm/presentation/crm-extras.controller.ts
apps/api/src/modules/crm/presentation/crm-leads-ops.controller.ts
apps/api/src/modules/crm/presentation/crm-leads.controller.ts
apps/api/src/modules/crm/settings/crm-settings.controller.ts
apps/api/src/modules/sd/presentation/sd-customer-inactivity.controller.ts
apps/api/src/modules/sd/presentation/sd-customers.controller.ts
apps/api/src/modules/sd/presentation/sd-invoices.controller.ts
apps/api/src/modules/sd/presentation/sd-klishe-retention.controller.ts
apps/api/src/modules/sd/presentation/sd-leads.controller.ts
apps/api/src/modules/sd/presentation/sd-legacy-order.controller.ts
apps/api/src/modules/sd/presentation/sd-line-deadline.controller.ts
apps/api/src/modules/sd/presentation/sd-lost-orders-reclamations.controller.ts
apps/api/src/modules/sd/presentation/sd-machine-format.controller.ts
apps/api/src/modules/sd/presentation/sd-order-departments.controller.ts
apps/api/src/modules/sd/presentation/sd-order-sync.controller.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/modules/sd/sales/sales.controller.ts

=== 0edc5b94 docs: AI-Aisha modul progress — HITL approval UI ulandi (c99fe584)
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== c99fe584 feat(aisha): HITL tasdiqlash navbati FE'ga ulandi (backend real, FE yo'q edi)
artifacts/erp-dashboard/src/components/aisha/AishaChatPanel.tsx
artifacts/erp-dashboard/src/hooks/useAisha.ts
artifacts/erp-dashboard/src/lib/api/aisha.schema.ts

=== bc703d02 docs: Chat moduli tekshirildi — 5 haqiqiy tuzatish (2 xavfsizlik)
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 9b3cf05f fix(chat): #18 o'lik ChatAdvancedController o'chirildi (hr-v2/chat)
apps/api/src/modules/chat/chat-advanced.controller.ts

=== 77f98899 fix(chat): #17 /chat/admin route hech qachon ishga tushmasdi (shadow)
artifacts/erp-dashboard/src/App.tsx

=== 435c9ecb fix(chat): #8 upload-orqali xabar real-time yetib bormasdi (WS event nomi drift)
apps/api/src/modules/chat/chat-uploads.controller.ts

=== 50cec774 fix(chat): updateRoom (nom/avatar) endi ADMIN roliga cheklangan
apps/api/src/modules/chat/chat-room.service.ts
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-room.repository.ts

=== 763869e7 fix(chat): chat fayl-biriktirma xona-a'zolik tekshiruvi yo'q edi (IDOR)
apps/api/src/modules/storage/storage.controller.ts

=== 66d99c29 docs: Kanban moduli yopildi (#158-169) — progress-log yangilandi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 1ea4fb14 fix(kanban): o'lik notImplemented import olib tashlandi
apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts

=== 2cb61c9e docs: CC moduli yopildi (#144-156) — progress-log yangilandi
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== d0f86666 refactor(cc): #154 coordination.controller.ts inline SQL repo/service'ga ko'chirildi
apps/api/src/modules/director/application/coordination.service.ts
apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts
apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts
apps/api/src/modules/director/presentation/coordination.controller.ts

=== 09582d90 fix(cc): #151 overdue-reminder 48h/24h intervallar CRUD-sozlanadigan
apps/api/src/modules/communication-center/cron/cc-sla.cron.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-overdue-reminder-threshold-2026-08-06.sql

=== ffb9e567 fix(cc): #152 webhook idempotency key-store Redis'ga ko'chirildi
apps/api/src/modules/communication-center/presentation/cc-webhook.controller.ts

=== 3b13c2ec docs: 19 commits, #150 done, loop mode armed per owner request
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 6e2fea7c feat(cc): #150 WorkflowRules page had no edit UI despite backend PUT existing
artifacts/erp-dashboard/src/pages/WorkflowRules.tsx

=== 858c16b4 docs: progress log — 18 commits, Director closed, CC started
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== d6da370f fix(cc): #148 approval escalation marked state but never notified/re-routed
apps/api/src/modules/communication-center/cron/cc-sla.cron.ts

=== 33d140a1 chore(cc): #153 remove dead GET /api/coordination/baskets query
artifacts/erp-dashboard/src/pages/CoordinationPage.tsx

=== dc0b1e0b docs: #107/#108 reclassified egasi-data (EP-DIR-058/059/060/085 all OCHIQ); #106 done, 16 commits total
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 91eaaa5b feat(director): #106 add "send task to Kanban" button on karta-AI agregat
artifacts/erp-dashboard/src/components/director/CardAiInsightsCard.tsx
artifacts/erp-dashboard/src/components/director/SendKanbanTaskDialog.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 9f73d575 docs: progress log — 15 real commits this session
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 0b034f84 fix(iot): #85 camera-AI PPE/safety findings never reached the alert UI
apps/api/src/cron/reference-image-compare.cron.ts
apps/api/src/modules/iot/application/camera-ai.service.ts
apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts

=== 35b727f7 feat(director): #105 ZNO/ZVS + rasporyazhenie SLA escalation was flat, now 3-stage
apps/api/src/modules/director/infrastructure/cron/director-escalation-org-resolver.util.ts
apps/api/src/modules/director/infrastructure/cron/rasporyazhenie-escalation.cron.ts
apps/api/src/modules/director/infrastructure/cron/zno-zvs-sla-escalation.cron.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/director-multistage-sla-escalation-2026-08-05.sql

=== 152c285a docs: session progress log final tally — 13 real commits
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== accb4c5b chore(kanban): #168 remove orphan GanttView.tsx.bak.t2c backup file
artifacts/erp-dashboard/src/pages/kanban/GanttView.tsx.bak.t2c

=== f1caa337 feat(director): #101 owner-summary daily digest — wire into dashboard FE
artifacts/erp-dashboard/src/components/director/OwnerSummaryCard.tsx
artifacts/erp-dashboard/src/components/director/types.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx

=== 97d8809c fix(chat): #126 @mention captured in FE but dropped at every backend hop
apps/api/src/modules/chat/chat-gateway-helper.service.ts
apps/api/src/modules/chat/chat-message.service.ts
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.gateway.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/dto/chat.dto.ts
apps/api/src/modules/chat/repositories/chat-message-base.repository.ts
apps/api/src/modules/chat/repositories/chat-notification.repository.ts
apps/api/src/modules/hr/telegram-bots/notification-bot-event-builders.ts

=== b546a7f7 feat(director): #116 chronic-problem escalation — carry-over was 1-day-only
apps/api/src/modules/director/domain/repositories/i-diary.repo.ts
apps/api/src/modules/director/infrastructure/repositories/diary.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/dir-diary-chronic-escalation-2026-08-05.sql
artifacts/erp-dashboard/src/pages/DirectorDiaryPage.tsx

=== 6d1e702d docs: update session progress log — 9 real fixes shipped, Workflow tool stopped per owner instruction
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 33634a35 fix(chat): #125 is_edited never persisted on message edit
apps/api/src/modules/chat/chat-gateway-helper.service.ts
apps/api/src/modules/chat/repositories/chat-message-base.repository.ts
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx

=== 429f37cd fix(marketing): #206 dashboard totalSpent field was never computed
apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts

=== a25d5fc4 fix(sd): #191 blacklist status literal mismatch + forced-resend 400 on any edit
artifacts/erp-dashboard/src/components/sd/Customer360View.tsx
artifacts/erp-dashboard/src/components/sd/helpers.tsx
artifacts/erp-dashboard/src/pages/SDCustomers.tsx
artifacts/erp-dashboard/src/pages/SDCustomersSections.tsx
artifacts/erp-dashboard/src/pages/SDCustomersTypes.ts

=== a3a641a9 feat(director): #104 Director dashboard aiInsights — real karta-AI aggregate
apps/api/src/modules/director/application/dashboard-query.service.ts
apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts
apps/api/src/modules/director/presentation/dashboard.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/director-card-ai-aggregate-thresholds-2026-08-05.sql
artifacts/erp-dashboard/src/components/director/CardAiInsightsCard.tsx
artifacts/erp-dashboard/src/components/director/types.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx

=== 3ce7d423 docs: record session progress log — TaskList tool state was lost to a crash
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== d23e650b fix(director): #113 IDOR — any manager could read/overwrite another card's diary
apps/api/src/modules/director/application/diary.service.ts
apps/api/src/modules/director/domain/repositories/i-diary.repo.ts
apps/api/src/modules/director/infrastructure/repositories/diary.repository.ts
apps/api/src/modules/director/presentation/diary.controller.ts

=== 8039ab7f fix(admin): #123 link the already-fixed backup/cron monitor page into sidebar
artifacts/erp-dashboard/src/components/sidebar/constants.ts

=== dc749dad fix(admin): #122 register TenantFilterGuard globally, was fully built but never wired
apps/api/src/app.module.ts

=== 102c1efc fix(admin): #118 Queue Monitor now reads real BullMQ state, was 100% mocked
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/admin/admin.module.ts
apps/api/src/modules/admin/application/services/admin-queue.service.ts
apps/api/src/modules/admin/presentation/controllers/admin-queue.controller.ts
artifacts/erp-dashboard/src/pages/QueueMonitorTypes.ts

=== dac0ccba fix(admin): #119 guideline upload silently dropped file + list showed no position
apps/api/src/modules/compatibility/repositories/settings-admin.repo.ts
apps/api/src/modules/compatibility/settings-admin.controller.ts
apps/api/src/modules/compatibility/settings-admin.service.ts
apps/api/src/shared/db/schema-admin-ext.ts
artifacts/erp-dashboard/src/pages/Settings.tsx

=== 00cda627 fix(director): VIP-marking an order never reached PP's queue priority (item #100)
apps/api/src/modules/director/infrastructure/repositories/director-state.repository.ts

=== 69ad4340 fix(admin): SaaS 'Xatolar' tab always empty — was a hardcoded stub (item #121)
apps/api/src/modules/compatibility/repositories/saas.repo.ts
apps/api/src/modules/compatibility/saas.service.ts

=== a55c7dec fix(admin): backup cron status invisible, cron dashboard always showed green (item #123)
apps/api/src/cron/backup-database.cron.ts
artifacts/erp-dashboard/src/pages/SystemMonitor.tsx

=== fc4e3403 fix(admin): alert-by-id lookup returned fake-200 for missing rows (item #124)
apps/api/src/modules/admin/application/services/admin-extra.service.ts

=== 06f77edc feat(lms): real PDF certificate download, was HTML (item #64)
apps/api/src/modules/lms/application/services/lms-certificate-pdf.service.ts
apps/api/src/modules/lms/lms.module.ts
apps/api/src/modules/lms/presentation/lms-certificates-standalone.controller.ts

=== 19d8e304 fix(pp): align production_orders.status Drizzle schema with live DB (item #81)
apps/api/src/shared/db/schema-compat-3.ts
lib/db/src/schema/pp/pp-production.ts

=== cb10001c fix(pp): two race conditions in work-center scheduling (item #79)
apps/api/src/modules/pp/infrastructure/repositories/pp-planning.repository.ts
apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts
apps/api/src/shared/db/migrations/pp-schedule-order-seq-2026-08-05.sql

=== e5833328 fix(lms): real pre-expiry certificate warning cron (was a no-op stub)
apps/api/src/cron/cert-expiry.cron.ts
apps/api/src/shared/db/migrations/lms-cert-expiry-warning-thresholds-2026-08-05.sql

=== 1c7c9627 fix(scripts): dup-routes-scan gate never blocked + false positives from comments
scripts/_dup-routes-scan.mjs

=== 63ab63b0 fix(wms): align POS warehouse-list predicate with WMS (add deleted_at check)
apps/api/src/modules/pos/application/services/warehouse-config.service.ts

=== 2390f42a fix(pos): remove dead legacy pos.controller.ts + its exclusive PosService chain
apps/api/src/modules/pos/application/services/pos.service.ts
apps/api/src/modules/pos/domain/repositories/i-pos-svc.repo.ts
apps/api/src/modules/pos/infrastructure/repositories/drizzle-pos-svc.repo.ts
apps/api/src/modules/pos/pos.module-imports.ts
apps/api/src/modules/pos/pos.module.ts
apps/api/src/modules/pos/presentation/pos.controller.ts

=== 6b0be639 fix(pos): remove dead legacy inventory-adjust endpoint (fake-success, no callers)
apps/api/src/modules/pos/presentation/pos-stub.controller.ts

=== 69558fb6 fix(pos): daily reconciliation cron for GL canonical entries mirror
apps/api/src/cron/cron.module.ts
apps/api/src/cron/pos-gl-reconciliation.cron.ts
apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts
apps/api/src/modules/pos/infrastructure/repositories/auto-gl-posting.repository.ts

=== bbf1014a fix(sd): register QcFailedSdListener (imported but never wired into DI)
apps/api/src/modules/sd/sd.module.ts

=== 567ce6f8 fix(pos): emit event to SD when EXTERNAL_OUT stock leaves the warehouse
apps/api/src/modules/pos/application/services/pos-movement.service.ts
apps/api/src/modules/pos/domain/events/pos-external-out-created.event.ts
apps/api/src/modules/sd/infrastructure/event-handlers/pos-external-out-sd.listener.ts
apps/api/src/modules/sd/sd.module.ts

=== 6a8964a7 fix(pos): align request status filter vocabulary with real UPPERCASE values
apps/api/src/modules/pos/dto/request.dto.ts
apps/api/src/modules/pos/infrastructure/repositories/pos-request-ext.repository.ts

=== 15597b12 fix(qc): auto-resolve responsible operator card + shift on defect/brak records
apps/api/src/modules/qc/infrastructure/repositories/qc-defects-extended.repository.ts

=== 428c2217 fix(qc): certificate expiry tracking + nightly cron + SD delivery block
apps/api/src/common/constants/business.constants.ts
apps/api/src/cron/cron.module.ts
apps/api/src/cron/qc-certificate-expiry.cron.ts
apps/api/src/modules/qc/application/qc-certificate-pdf.service.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts
apps/api/src/modules/sd/deliveries/deliveries.service.ts
apps/api/src/modules/sd/deliveries/drizzle-sd-deliveries.repo.ts
apps/api/src/modules/sd/deliveries/i-sd-deliveries.repo.ts

=== 6585fe67 fix(aisha): RBAC gate on get_employee_info / get_financial_summary chat tools
apps/api/src/modules/aisha/application/conversation/aisha-conversation.service.ts
apps/api/src/modules/aisha/application/conversation/aisha-history.service.ts
apps/api/src/modules/aisha/application/tools/_helpers.ts
apps/api/src/modules/aisha/application/tools/get-employee-info.tool.ts
apps/api/src/modules/aisha/application/tools/get-financial-summary.tool.ts
apps/api/src/modules/aisha/domain/tool.interface.ts
apps/api/src/modules/aisha/presentation/controllers/chat.controller.ts

=== 1753ed0d fix(pos): stock-ledger balance reads/writes canonical warehouse_stock
apps/api/src/modules/pos/application/services/stock-ledger.service.ts
apps/api/src/modules/pos/infrastructure/repositories/stock-ledger.repository.ts

=== 0342fdaa fix(qc): reclamation SLA due-date timer
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/qc/application/commands/create-reclamation.handler.ts
apps/api/src/modules/qc/domain/aggregates/reclamation.aggregate.ts
apps/api/src/modules/qc/infrastructure/repositories/drizzle-qc-reclamation.repo.ts
apps/api/src/modules/qc/presentation/qc-reclamations.controller.ts

=== 71787991 fix(qc): persist rework parent_order_id and rework_cost on final inspection
apps/api/src/modules/qc/application/qc-extended.service.ts
apps/api/src/modules/qc/domain/repositories/i-qc-extended.repo.ts
apps/api/src/modules/qc/dto/qc.dto.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-extended-final.repository.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-extended.repository.ts
apps/api/src/modules/qc/presentation/qc-extended.controller.ts

=== 5093fe43 fix(mes): auto-create Kanban card on equipment breakdown
apps/api/src/modules/kanban/application/event-handlers/mes-breakdown-kanban.handler.ts
apps/api/src/modules/kanban/domain/repositories/i-kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts
apps/api/src/modules/kanban/kanban.module.ts
apps/api/src/modules/mes/application/commands/record-downtime.handler.ts
apps/api/src/modules/mes/domain/events/mes-breakdown.event.ts
apps/api/src/modules/mes/infrastructure/repositories/mes-maintenance.repo.ts

=== 647730be fix(mes): department-scope RBAC on shift/OEE/maintenance stats endpoints
apps/api/src/modules/mes/application/mes-shifts-stats.service.ts
apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts
apps/api/src/modules/mes/presentation/mes-shifts-stats.controller.ts

=== a4f406f7 fix(mes): two-signature material-act gate blocks session start
apps/api/src/modules/mes/application/commands/start-session.handler.ts
apps/api/src/modules/mes/domain/repositories/mes.repository.ts
apps/api/src/modules/mes/infrastructure/repositories/drizzle-mes.repo.ts

=== 1724a0ac fix(hr): card status lifecycle events, frozen-card payroll gate, merge/split endpoints, atomic assign guard
apps/api/src/cron/card-staleness.cron.ts
apps/api/src/cron/cron.module.ts
apps/api/src/modules/hr/payroll/payroll.service.ts
apps/api/src/modules/org-structure/card-lifecycle.events.ts
apps/api/src/modules/org-structure/card.controller.ts
apps/api/src/modules/org-structure/card.repository.ts
apps/api/src/modules/org-structure/card.service.ts
apps/api/src/shared/db/invariants/migrations-drift.ts
apps/api/src/shared/db/migrations/org-card-merge-split-2026-08-04.sql
apps/api/test/org-card-crud.spec.ts

=== 285e2e73 fix(finance): approvePayment updates real finance_payments, not orphaned customer_payments
apps/api/src/modules/finance/infrastructure/repositories/finance-actions.repository.ts

=== 4cc7f1d4 fix(marketing): rewrite calendar event form to match real backend/DB contract
artifacts/erp-dashboard/src/pages/MarketingCalendar.tsx

=== 117a1827 fix(marketing): correct spentAmount field name + divide-by-zero guard fixing ROI Infinity%
artifacts/erp-dashboard/src/pages/MarketingExtended.tsx
artifacts/erp-dashboard/src/pages/MarketingExtendedSections.tsx
artifacts/erp-dashboard/src/pages/MarketingExtendedTypes.ts

=== db16e855 fix(sd): persist + expose tech-checkpoint flags so golden-thread SD->PP opens
apps/api/src/common/database/queries-sd.ts
apps/api/src/modules/sd/domain/aggregates/sales-order.aggregate.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts
apps/api/src/shared/db/migrations/sd-101-tech-bom-approved-view-fix-2026-08-04.sql

=== 6089cd8d fix(sd): return amount from markPaymentPaid so GL posting actually fires
apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts

=== b485d0b9 fix(sd): allow 'manager' role alongside sales_manager on SD endpoints
apps/api/src/modules/sd/presentation/sd-contracts.controller.ts
apps/api/src/modules/sd/presentation/sd-orders.controller.ts
apps/api/src/modules/sd/presentation/sd-payments.controller.ts

=== 2eca612b docs: vision-gap master plan — 215-item backlog across 18 modules
docs/VISION-GAP-MASTER-PLAN-2026-08-03.md

=== 17e3a697 fix(kanban): publish OrderCancelledEvent so cancelled orders move their card
apps/api/src/modules/sd/application/commands/update-order-status.handler.ts

=== 358beb02 fix(pp): enforce real lab-approval gate on production order release
apps/api/src/modules/pp/application/commands/release-production-order.handler.ts
apps/api/src/modules/pp/domain/repositories/pp.repository.ts
apps/api/src/modules/pp/infrastructure/repositories/drizzle-pp.repo.ts
apps/api/test/pp/release-production-order.handler.spec.ts

=== 3d605103 fix(pos): accept httpOnly cookie auth on POS gateway WebSocket handshake
apps/api/src/modules/pos/presentation/pos.gateway.ts

=== bfcadd20 fix(pos): correct status guards so request approve/reject stop 400ing
apps/api/src/modules/pos/application/services/pos-request.service.ts

=== ee4ecc26 fix(wms): close quarantine/QC bypass in MM goods-receipt stock posting
apps/api/src/common/database/queries-mm-goods.ts
apps/api/src/modules/mm/application/mm-goods.service.ts
apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm-goods.repo.ts

=== 4d181f89 fix(mes): enforce operator-machine skill matrix at session start
apps/api/src/modules/mes/application/commands/start-session.handler.ts
apps/api/src/modules/mes/domain/repositories/mes.repository.ts
apps/api/src/modules/mes/infrastructure/repositories/drizzle-mes.repo.ts

=== 2066f70b fix(mes): material consumption now decrements WMS stock + posts GL entry
apps/api/src/modules/mes/application/mes-shifts-stats.service.ts
apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts

=== 397e3eac fix(hr): re-point onboarding_tasks FK from retired org_functions to org_departments
apps/api/src/modules/hr/onboarding/onboarding-card-assigned.handler.ts
apps/api/src/modules/hr/onboarding/onboarding-document-gate.service.ts
apps/api/src/modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts
apps/api/src/modules/hr/onboarding/repos/i-hr-onboarding.repo.ts
apps/api/src/shared/db/invariants/migrations-drift.ts

=== d9210dfc fix(hr): field-level RBAC on karta compensation data
apps/api/src/modules/org-structure/org-structure.controller.ts
apps/api/src/modules/org-structure/org-structure.service.ts

=== de867a08 test(kanban): add DTO spec + APPROVED marker for status-column-map
apps/api/src/modules/kanban/dto/kanban-status-column-map.dto.spec.ts
apps/api/src/shared/db/migrations/kanban-status-column-map-seed-2026-08-03.sql

=== 13239a1e feat(kanban): in-app CRUD for status-column auto-move mapping
apps/api/src/modules/kanban/application/kanban-status-column-map.service.ts
apps/api/src/modules/kanban/dto/kanban-status-column-map.dto.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-status-column-map.repo.ts
apps/api/src/modules/kanban/kanban.module.ts
apps/api/src/modules/kanban/presentation/kanban-status-column-map.controller.ts
apps/api/src/shared/db/migrations/kanban-status-column-map-seed-2026-08-03.sql
artifacts/erp-dashboard/src/components/sidebar/constants.ts
artifacts/erp-dashboard/src/lib/sd-order-status.ts
artifacts/erp-dashboard/src/pages/KanbanStatusColumnMap.tsx
artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx

=== ba46a088 feat(notifications): add alert_thresholds/kanban_column_sla tables + fix Telegram chat_id lookup
apps/api/src/common/database/ddl-migrations.ts
apps/api/src/modules/notifications/application/commands/create-notification.handler.ts
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/alert-thresholds-2026-08-03.sql
apps/api/src/shared/db/migrations/kanban-column-sla-2026-08-03.sql
apps/api/src/shared/db/schema-business-a-1.ts
apps/api/src/shared/db/schema-kanban.ts

=== 633bc74b fix(gl): redirect 3 stale gl_entries/gl_lines readers to canonical entries table
apps/api/src/modules/ai/services/finance-ai.repository.ts
apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-accounting.repo.ts
apps/api/src/modules/finance/reports-hub/drizzle-reports-hub.repo.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-advance-account-4200-2026-08-03.sql

=== bcdc6735 docs: remaining audit reports + owner-scope auth helper + nginx config + audit tooling
_audit/apply-and-prove-hitl.cjs
_audit/bproof-2026-07-13-onboarding-card-wiring.cjs
_audit/build-master-qa.py
_audit/check-adaptation-cols.cjs
_audit/check-ai-session-cols.cjs
_audit/check-chat-tables.cjs
_audit/check-lms-tables.cjs
_audit/check-lms-tables2.cjs
_audit/check-qc-root-causes-tmp.cjs
_audit/check-remaining-tables.cjs
_audit/cproof-orgnode-head.cjs
_audit/extract-claude-responding.py
_audit/extract-kitob.py
_audit/extract-shvb.py
_audit/find-orphan-pages.mjs
_audit/gen-vizyon-tasdiq.cjs
_audit/merge-1000-qa.py
_audit/merge-1000-questions.py
_audit/merge-questions.py
_audit/merge-vizyon-tasdiq.cjs
_audit/migrate-cards-to-nodes.cjs
_audit/pp-i18n-add.mjs
_audit/pp-phase1-proof.cjs
_audit/proof-a4-upload.cjs
_audit/proof-a5-lms.cjs
_audit/proof-a6-cfoconfig.cjs
_audit/proof-a7-ccprefs.cjs
_audit/proof-integration-lists.cjs
_audit/proof-lev5-po-hitl.cjs
_audit/proof-lev5b-3way.cjs
_audit/proof-lev6-security.cjs
_audit/proof-lev6-sensor.cjs
_audit/proof-lms-modules.cjs
_audit/proof-lms-progress.cjs
_audit/proof-mesqc.cjs
_audit/proof-mm-po.cjs
_audit/proof-orders-registry.cjs
_audit/proof-p1.cjs
_audit/proof-pos-inventory.cjs
_audit/proof-pos-movements.cjs
_audit/proof-pos-sales-daily.cjs
_audit/proof-saas-modules.cjs
_audit/proof-saas-onboard.cjs
_audit/reachability-orphans.mjs
_audit/test-orgnode-schema.cjs
apps/api/src/common/auth/owner-scope.ts
docs/CHAT-TELEGRAM-GAP-INPUT-2026-06-04.md
docs/INTERVYU-TAHLIL-HISOBOT-2026-06-05.md
docs/IOT-OPERATOR-TABLET-INPUT-MAYDONLAR-2026-06-04.md
docs/ORG-KARTA-MODEL-SPEC-2026-06-07.md
docs/ORG-PHASE1-MIGRATION-FINDING-2026-06-08.md
docs/ORG-PHASE4-EXAM-REAUDIT-2026-06-08.md
docs/ORG-RE-AUDIT-2026-06-08.md
docs/POS-MONITOR-INPUT-MAYDONLAR-2026-06-04.md
docs/QC-RE-AUDIT-2026-06-08.md
docs/TRANSMISSIYA-XARITA-HISOBOT-2026-06-05.md
docs/V2-REBUILD/01-ALL-PAGES-INVENTORY.md
docs/YAKUNIY-XULOSA-TEXNIK-RAHBAR-2026-06-04.md
docs/_tahlil-parts/s1a.md
docs/_tahlil-parts/s1b.md
docs/_tahlil-parts/s1c.md
docs/_tahlil-parts/s1d.md
docs/_tahlil-parts/s1e.md
docs/_tahlil-parts/s2-uzilishlar.md
docs/_tahlil-parts/s3-vizyon.md
docs/_tahlil-parts/s4-delta.md
docs/bosh-jadval-orphan-audit-2026-06-08-1013.md
docs/bosh-jadval-orphan-audit-2026-06-17-1213.md
docs/cca-group1-codestyle.md
docs/cca-group2-silent-failures.md
docs/cca-group34-process-ui.md
docs/cca-group5-db-drift.md
docs/cca-group6a-hidden-data.md
docs/constitution-compliance-audit.md
docs/full-analysis-2026-06-08/01-architecture-monorepo.md
docs/full-analysis-2026-06-08/02-database-schema-overview.md
docs/full-analysis-2026-06-08/02-schema-columns.csv
docs/full-analysis-2026-06-08/03-db-drift-and-duplicates.md
docs/full-analysis-2026-06-08/03-drift-report-snapshot-2026-05-25.txt
docs/full-analysis-2026-06-08/03-drift-sets-current.json
docs/full-analysis-2026-06-08/20-frontend-routing-sidebar.md
docs/full-analysis-2026-06-08/20-routes-and-nav.csv
docs/full-analysis-2026-06-08/21-api-endpoint-inventory.md
docs/full-analysis-2026-06-08/21-endpoints.csv
docs/full-analysis-2026-06-08/22-testing-and-build-health.md
docs/full-analysis-2026-06-08/README.md
docs/modul1-savdo-crm-FULL-2026-06-03.md
docs/modul1-savdo-crm-deep-2026-06-03.md
docs/modul10-finance-FULL-2026-06-03.md
docs/modul11-hr-FULL-2026-06-03.md
docs/modul12-lms-FULL-2026-06-03.md
docs/modul13-security-FULL-2026-06-03.md
docs/modul14-household-mro-FULL-2026-06-03.md
docs/modul15-iot-camera-FULL-2026-06-03.md
docs/modul16-director-FULL-2026-06-03.md
docs/modul17-admin-FULL-2026-06-03.md
docs/modul18-tasks-FULL-2026-06-03.md
docs/modul19-coordination-FULL-2026-06-03.md
docs/modul2-marketing-FULL-2026-06-03.md
docs/modul20-chat-FULL-2026-06-03.md
docs/modul3-design-FULL-2026-06-03.md
docs/modul4-qc-FULL-2026-06-03.md
docs/modul5-technology-FULL-2026-06-03.md
docs/modul6-ai-planning-FULL-2026-06-03.md
docs/modul7-production-mes-FULL-2026-06-03.md
docs/modul8-warehouse-wms-FULL-2026-06-03.md
docs/modul9-supply-procurement-FULL-2026-06-03.md
docs/org-structure-current-state-2026-06-04.md
docs/server-health-alert-2026-06-08-0000.md
docs/status-raqam-katalog-2026-06-05-1619.md
docs/status-raqam-katalog-2026-06-08-1010.md
docs/toliq-tahlil-2026-06-05.md
docs/two-worlds-analysis.md
docs/work-verification-audit.md
nginx/proxy_params.conf
scripts/i18n-full-audit.json

=== 11a6d619 docs: commit accumulated audit/vision/migration reports (2026-06-03..2026-07-14)
docs/ai-execution/BLOCKERS_OWNER_DATA.md
docs/ai-execution/DUPLICATE_GUARD.md
docs/ai-execution/FINAL_HANDOFF_REPORT.md
docs/ai-execution/TEST_LOG.md
docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md
docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md
docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md
docs/audit/CFO-ASSISTANT-BOT-FULL-TRACE-2026-07-06.md
docs/audit/CHAT-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md
docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md
docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md
docs/audit/DESIGN-FULL-ANALYSIS-2026-07-06.md
"docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05 \342\200\224 \320\272\320\276\320\277\320\270\321\217.md"
docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md
docs/audit/DESIGN-SYSTEM-AUDIT-AND-PROPOSAL-2026-07-11.md
docs/audit/DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md
docs/audit/ERP-SIFAT-STANDARTLARI-2026-06-08.md
docs/audit/EXTENDED-GOVERNANCE-CHECK-2026-07-04.md
docs/audit/F4-INDEPENDENT-FULL-VERIFICATION-2026-07-06.md
docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md
docs/audit/FINANCE-SOD-ORGCHART-READINESS-2026-07-06.md
docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md
docs/audit/FULL-VISION-COVERAGE-AUDIT-2026-07-10.md
docs/audit/HUJJATLAR-TIZIMI-GROUND-TRUTH-2026-07-14.md
docs/audit/I18N-FIX-LOOP-2026-07-05.md
docs/audit/I18N-FULL-AUDIT-2026-07-04.md
docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md
docs/audit/IOT-TABLET-PAGE-DEEP-DIVE-2026-07-04.md
docs/audit/KANBAN-COMPLETE-FRESH-ANALYSIS-2026-07-11.md
docs/audit/KARTALAR-JAVOBLAR-IMPACT-2026-06-08.md
docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md
docs/audit/LOYIHA-QOIDALARI-2026-06-08.md
docs/audit/MAGIC-NUMBERS-AUDIT-2026-07-05.md
docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md
docs/audit/MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md
docs/audit/MARKETING-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md
docs/audit/MASSIV-50/00-EGASI-QARORLAR-QABUL.md
docs/audit/MASSIV-50/00-EGASI-QIYMATLARI.md
docs/audit/MASSIV-50/00-INTERVYU-MOSLIK.md
docs/audit/MASSIV-50/00-MANIFEST.md
docs/audit/MASSIV-50/00-VIZYON-QOPLAMA.md
docs/audit/MASSIV-50/00-YADRO-VIZYON-VS-HOZIR.md
docs/audit/MASSIV-50/P01-GOLDEN-int-schema-lib-barrel.md
docs/audit/MASSIV-50/P02-GOLDEN-int-schema-api-barrel.md
docs/audit/MASSIV-50/P03-WMS-int-opcodes-registry.md
docs/audit/MASSIV-50/P04-ORG-KARTALAR-org-schema-ddl.md
docs/audit/MASSIV-50/P05-ORG-org-card-portret-fe.md
docs/audit/MASSIV-50/P06-GOLDEN-golden-schema-seed.md
docs/audit/MASSIV-50/P07-GOLDEN-golden-qc-rework.md
docs/audit/MASSIV-50/P08-GOLDEN-golden-wms-fin-e2e.md
docs/audit/MASSIV-50/P09-SD-sd-schema-ddl.md
docs/audit/MASSIV-50/P10-SD-sd-backend-logic.md
docs/audit/MASSIV-50/P11-SD-sd-frontend.md
docs/audit/MASSIV-50/P12-PP-pp-schema-ddl.md
docs/audit/MASSIV-50/P13-PP-pp-techcard-lifecycle.md
docs/audit/MASSIV-50/P14-PP-pp-shift-planfact.md
docs/audit/MASSIV-50/P15-MES-mes-wiring-fixes.md
docs/audit/MASSIV-50/P16-MES-mes-oee-stages.md
docs/audit/MASSIV-50/P17-MES-mes-checklist-deduction.md
docs/audit/MASSIV-50/P18-QC-qc-masterdata-ddl.md
docs/audit/MASSIV-50/P19-QC-qc-gates-fe.md
docs/audit/MASSIV-50/P20-WMS-wms-schema-ddl.md
docs/audit/MASSIV-50/P21-WMS-wms-backend-logic.md
docs/audit/MASSIV-50/P22-MM-mm-schema-backend.md
docs/audit/MASSIV-50/P23-MM-mm-frontend.md
docs/audit/MASSIV-50/P24-FIN-fin-gl-core.md
docs/audit/MASSIV-50/P25-FIN-fin-zvs-zno.md
docs/audit/MASSIV-50/P26-FIN-fin-kassir-crossmod.md
docs/audit/MASSIV-50/P27-HR-hr-rating-onboarding.md
docs/audit/MASSIV-50/P28-HR-hr-recruitment-leave.md
docs/audit/MASSIV-50/P29-DIR-dir-state-engine.md
docs/audit/MASSIV-50/P30-DIR-dir-stat-diary-okr.md
docs/audit/MASSIV-50/P31-COR-cor-council-protocol.md
docs/audit/MASSIV-50/P32-COR-cor-prikaz-recsovet.md
docs/audit/MASSIV-50/P33-LMS-lms-core-ddl.md
docs/audit/MASSIV-50/P34-LMS-lms-onboarding-fe.md
docs/audit/MASSIV-50/P35-AI-ai-central-infra.md
docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md
docs/audit/MASSIV-50/P37-CC-cc-templates-schema.md
docs/audit/MASSIV-50/P38-CC-cc-search-finance-cron.md
docs/audit/MASSIV-50/P39-CRM-crm-customer-funnel.md
docs/audit/MASSIV-50/P40-CRM-crm-visit-dealwon-gsd.md
docs/audit/MASSIV-50/P41-MKT-mkt-full-stack.md
docs/audit/MASSIV-50/P42-KAN-kan-task-schema.md
docs/audit/MASSIV-50/P43-KAN-kan-desktop-personal-prod.md
docs/audit/MASSIV-50/P44-IOT-iot-machine-registry.md
docs/audit/MASSIV-50/P45-IOT-iot-camera-andon-gsd.md
docs/audit/MASSIV-50/P46-NTF-ntf-core-infra.md
docs/audit/MASSIV-50/P47-NTF-ntf-bots-digest-events.md
docs/audit/MASSIV-50/P48-POS-pos-schema-gl-guards.md
docs/audit/MASSIV-50/P49-POS-pos-mes-tablet.md
docs/audit/MASSIV-50/P50-GOLDEN-int-nav-routes.md
docs/audit/MASSIV-50/P51-ORG-manager-id-backfill.md
docs/audit/MASSIV-50/P52-FIN-gl76-cost-center.md
docs/audit/MASSIV-50/P53-PP-gofra-sloy-formula.md
docs/audit/MASTER-CLEANUP-PLAN-BEFORE-BUILD-2026-06-18.md
docs/audit/MES-IOT-DEEP-DIVE-2026-07-04.md
docs/audit/MUSLIMBEK-PROMT-00-START-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-01-POYDEVOR-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-01B-APPROVAL-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-01C-DDL-APPROVED-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02B-PHASE1-GO-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02C-PHASE1-CORRECTED-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02D-MIGRATSIYA-RUN-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02E-PHASE1-CARD-CRUD-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02F-PHASE2-RAZRYAD-UI-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02G-PHASE3-TSKP-FOLDER-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02H-PHASE4-EXAM-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02I-PHASE4-EXAM-BUILD-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02J-PHASE5-CARD-8TAB-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02K-PHASE6-EMP-CARD-SALARY-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-02L-PHASE7-VACANCY-IO-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-03-OLTIN-IP-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-04-SD-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-06-MES-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-07-QC-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-09-MM-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-10FIN-GL-HARDEN-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-10FIN-GL-UNIFY-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-12-DIR-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-13-COR-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-14-LMS-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-15-AI-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-15-AISHA-LAYERA-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-16-CC-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-17-CRM-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-18-MKT-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-19-KAN-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-20-IOT-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-21-NTF-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-22-POS-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-INDEX-2026-06-08.md
docs/audit/MUSLIMBEK-PROMT-LOCAL-CLEANUP-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-MASSIV-CLEANUP-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-MASSIV-GO-2026-06-13.md
docs/audit/MUSLIMBEK-PROMT-ORG-RAZRYAD-FIX-2026-06-17.md
docs/audit/MUSLIMBEK-PROMT-P4-FINANCE-2026-06-18.md
docs/audit/MUSLIMBEK-PROMT-PP-VISION-BUILD-2026-06-18.md
docs/audit/MUSLIMBEK-PROMT-RECRUITING-REDESIGN-2026-06-17.md
docs/audit/MUSLIMBEK-TOLIQ-BUILD-REJA-2026-06-08.md
docs/audit/NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md
docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md
docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md
docs/audit/OMBOR-POS-MONITOR-TOLIQ-TAHLIL-2026-07-10.md
docs/audit/OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md
docs/audit/OPEN-OWNER-QUESTIONS-CONSOLIDATED-2026-07-11.md
docs/audit/ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06.md
docs/audit/ORGCHART-PERMISSION-READINESS-FULL-2026-07-06.md
docs/audit/PROBLEM-REGISTRY-2026-06-17.md
docs/audit/Q1-Q34-INDEPENDENT-VERIFICATION-2026-07-04.md
docs/audit/Q31-Q32-SOURCE-SEARCH-2026-07-05.md
docs/audit/REMAINING-WORK-2026-07-07.md
docs/audit/ROUTE-STATUS-AUDIT-2026-07-03.md
docs/audit/SAP-CONFORMANCE-CHECK.md
docs/audit/SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md
docs/audit/SD-CRM-FULL-ANALYSIS-WITH-VISION-2026-07-10-v2.md
docs/audit/SD-CRM-FULL-COMPLETION-ANALYSIS-2026-07-10.md
docs/audit/SD-CRM-MODUL-TOLIQ-TEKSHIRUV-2026-07-10.md
docs/audit/SFO-ASSISTANT-BOT-FULL-TRACE-2026-07-06.md
docs/audit/T26-EXHAUSTIVE-VIZYON-ANALIZ-2026-06-27.md
docs/audit/TWO-WORLDS-FULL-AUDIT-2026-07-06.md
docs/audit/UNIVERSAL-LOYIHA-QOIDALARI-SHABLON.md
docs/audit/VISION-1000-JAVOBLAR-2026-06-08.md
docs/audit/VISION-1000-SAVOL-JAVOB-2026-06-08.md
docs/audit/VISION-3340-RECONCILIATION-2026-07-04.md
docs/audit/VISION-LOOP-INDEPENDENT-VERIFICATION-2026-07-09.md
docs/audit/VISION-QUESTIONS-1000-2026-06-08.md
docs/audit/VISION-QUESTIONS-2026-06-07.md
docs/audit/VISION-QUESTIONS-MASTER-2026-06-08.md
docs/audit/VISION-QUESTIONS-V2-2026-06-08.md
docs/audit/VIZYON-QURISH-REJA-VAQT-2026-06-19.md
docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md
docs/audit/VIZYON-TASDIQ-INTERVYU-2026-06-27.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/00-MASTER-HISOBOT.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/01-org-kartalar.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/02-hr.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/03-finance.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/04-coordination.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/05-director.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/06-sd-sotuv.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/07-pp-reja.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/08-mes.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/09-qc.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/10-wms-ombor.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/11-mm-taminot.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/12-lms-darslik.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/13-crm.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/14-marketing.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/15-kanban.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/16-iot.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/17-ai-aisha.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/18-notifications.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/19-pos.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/20-cc-hujjat.md
docs/audit/VIZYON-TEKSHIRUV-2026-06-27/REJA-VIZYON-MOSLIK-2026-06-30.md
docs/audit/WMS-POS-FULL-AUDIT-2026-07-05.md
docs/audit/ZIDDIYATLAR-HAL-2026-06-08.md
docs/audit/_ROLLUP.md
docs/audit/_parts/ai.md
docs/audit/_parts/comm-int-admin.md
docs/audit/_parts/compatibility.md
docs/audit/_parts/crm-marketing.md
docs/audit/_parts/finance.md
docs/audit/_parts/hr.md
docs/audit/_parts/iot-director.md
docs/audit/_parts/kanban-mm-ecom-mes.md
docs/audit/_parts/misc.md
docs/audit/_parts/pos.md
docs/audit/_parts/pp-qc.md
docs/audit/_parts/sd-lms.md
docs/audit/_parts/wms.md
docs/audit/audit-workflow.mjs
docs/audit/decisions/01-org-kartalar.md
docs/audit/decisions/02-hr.md
docs/audit/decisions/03-finance.md
docs/audit/decisions/04-coordination.md
docs/audit/decisions/05-director.md
docs/audit/decisions/06-sd.md
docs/audit/decisions/07-pp.md
docs/audit/decisions/08-mes.md
docs/audit/decisions/09-qc.md
docs/audit/decisions/10-warehouse.md
docs/audit/decisions/11-mm.md
docs/audit/decisions/12-lms.md
docs/audit/decisions/13-crm.md
docs/audit/decisions/14-marketing.md
docs/audit/decisions/15-kanban.md
docs/audit/decisions/16-iot.md
docs/audit/decisions/17-ai.md
docs/audit/decisions/18-notifications.md
docs/audit/decisions/19-pos.md
docs/audit/decisions/20-cc.md
docs/audit/kitob-extracted/RD5__Nazirov Humoyun.md
"docs/audit/kitob-extracted/RD5__\320\220\320\261\320\264\321\203\320\273\320\273\320\260\320\265\320\262 \320\221\320\260\321\205\320\276\320\264\320\270\321\200\320\266\320\276\320\275.md"
docs/audit/kitob-extracted/claude-is-responding.md
docs/audit/kitob-extracted/root.md
docs/audit/kitob-study-2026-06-07.md
docs/audit/org-study-2026-06-07.md
docs/audit/org-vision-analysis-2026-06-07.md
docs/audit/parts/001.md
docs/audit/parts/005.md
docs/audit/parts/01.md
docs/audit/parts/016.md
docs/audit/parts/02.md
docs/audit/parts/03.md
docs/audit/parts/031.md
docs/audit/parts/04.md
docs/audit/parts/046.md
docs/audit/parts/05.md
docs/audit/parts/06.md
docs/audit/parts/061.md
docs/audit/parts/07.md
docs/audit/parts/076.md
docs/audit/parts/08.md
docs/audit/parts/09.md
docs/audit/parts/091.md
docs/audit/parts/10.md
docs/audit/parts/106.md
docs/audit/parts/11.md
docs/audit/parts/12.md
docs/audit/parts/121.md
docs/audit/parts/13.md
docs/audit/parts/136.md
docs/audit/parts/14.md
docs/audit/parts/15.md
docs/audit/parts/151.md
docs/audit/parts/16.md
docs/audit/parts/166.md
docs/audit/parts/19.md
docs/audit/parts/20.md
docs/audit/parts/25.md
docs/audit/parts/27.md
docs/audit/parts/29.md
docs/audit/shvb-extracted/EUROPRINT_BARCHA_JAVOBLAR.md
docs/audit/shvb-extracted/Module3-vs-SHvB-Tahlil-Integratsiya.md
docs/audit/shvb-extracted/Module3-vs-SHvB-Tahlil.md
docs/audit/shvb-extracted/SHvB-40-Yonalish-Prompt.md
docs/audit/shvb-extracted/SHvB-Tolik-Arxiv-Hujjatlari.md
docs/audit/shvb-vs-system-2026-06-07.md
docs/audit/status-catalog-2026-06-07.md
docs/audit/trycatch-any-audit.md
docs/audit/vision-1000-answers/01-org-kartalar.md
docs/audit/vision-1000-answers/02-hr.md
docs/audit/vision-1000-answers/03-finance.md
docs/audit/vision-1000-answers/04-coordination.md
docs/audit/vision-1000-answers/05-director.md
docs/audit/vision-1000-answers/06-sd.md
docs/audit/vision-1000-answers/07-pp.md
docs/audit/vision-1000-answers/08-mes.md
docs/audit/vision-1000-answers/09-qc.md
docs/audit/vision-1000-answers/10-warehouse.md
docs/audit/vision-1000-answers/11-mm.md
docs/audit/vision-1000-answers/12-lms.md
docs/audit/vision-1000-answers/13-crm.md
docs/audit/vision-1000-answers/14-marketing.md
docs/audit/vision-1000-answers/15-kanban.md
docs/audit/vision-1000-answers/16-iot.md
docs/audit/vision-1000-answers/17-ai.md
docs/audit/vision-1000-answers/18-notifications.md
docs/audit/vision-1000-answers/19-pos.md
docs/audit/vision-1000-answers/20-cc.md
docs/audit/vision-questions-1000/01-org-kartalar.md
docs/audit/vision-questions-1000/02-hr.md
docs/audit/vision-questions-1000/03-finance.md
docs/audit/vision-questions-1000/04-coordination.md
docs/audit/vision-questions-1000/05-director.md
docs/audit/vision-questions-1000/06-sd.md
docs/audit/vision-questions-1000/07-pp.md
docs/audit/vision-questions-1000/08-mes.md
docs/audit/vision-questions-1000/09-qc.md
docs/audit/vision-questions-1000/10-warehouse.md
docs/audit/vision-questions-1000/11-mm.md
docs/audit/vision-questions-1000/12-lms.md
docs/audit/vision-questions-1000/13-crm.md
docs/audit/vision-questions-1000/14-marketing.md
docs/audit/vision-questions-1000/15-kanban.md
docs/audit/vision-questions-1000/16-iot.md
docs/audit/vision-questions-1000/17-ai.md
docs/audit/vision-questions-1000/18-notifications.md
docs/audit/vision-questions-1000/19-pos.md
docs/audit/vision-questions-1000/20-cc.md
docs/audit/vision-questions-v2/01-org-kartalar.md
docs/audit/vision-questions-v2/02-hr.md
docs/audit/vision-questions-v2/03-finance.md
docs/audit/vision-questions-v2/04-coordination.md
docs/audit/vision-questions-v2/05-director.md
docs/audit/vision-questions-v2/06-sd.md
docs/audit/vision-questions-v2/07-pp.md
docs/audit/vision-questions-v2/08-mes.md
docs/audit/vision-questions-v2/09-qc.md
docs/audit/vision-questions-v2/10-warehouse.md
docs/audit/vision-questions-v2/11-mm.md
docs/audit/vision-questions-v2/12-lms.md
docs/audit/vision-questions-v2/13-crm.md
docs/audit/vision-questions-v2/14-marketing.md
docs/audit/vision-questions-v2/15-kanban.md
docs/audit/vision-questions-v2/16-iot.md
docs/audit/vision-questions-v2/17-ai.md
docs/audit/vision-questions-v2/18-notifications.md
docs/audit/vision-questions-v2/19-pos.md
docs/audit/vision-questions-v2/20-cc.md
docs/audit/vision-questions/01-org-kartalar.md
docs/audit/vision-questions/02-hr.md
docs/audit/vision-questions/03-finance.md
docs/audit/vision-questions/04-coordination.md
docs/audit/vision-questions/05-director.md
docs/audit/vision-questions/06-sd.md
docs/audit/vision-questions/07-pp.md
docs/audit/vision-questions/08-mes.md
docs/audit/vision-questions/09-qc.md
docs/audit/vision-questions/10-warehouse.md
docs/audit/vision-questions/11-mm.md
docs/audit/vision-questions/12-lms.md
docs/audit/vision-questions/13-crm.md
docs/audit/vision-questions/14-marketing.md
docs/audit/vision-questions/15-kanban.md
docs/audit/vision-questions/16-iot.md
docs/audit/vision-questions/17-ai.md
docs/audit/vision-questions/18-notifications.md
docs/audit/vision-questions/19-pos.md
docs/audit/vision-questions/20-cc.md
docs/migration/p26-fin-cashier-hub-podotchet-2026-06-20.sql
docs/migration/seed/seed-02b-razryad-native-schema.sql
docs/vision/IOT-SCREEN-30-SUGGESTIONS-2026-07-04.md
docs/vision/_parts/01-org-kartalar.md
docs/vision/_parts/02-hr.md
docs/vision/_parts/03-finance.md
docs/vision/_parts/04-coordination.md
docs/vision/_parts/05-director.md
docs/vision/_parts/06-sd.md
docs/vision/_parts/07-pp.md
docs/vision/_parts/08-mes.md
docs/vision/_parts/09-qc.md
docs/vision/_parts/10-warehouse.md
docs/vision/_parts/11-mm.md
docs/vision/_parts/12-lms.md
docs/vision/_parts/13-crm.md
docs/vision/_parts/14-marketing.md
docs/vision/_parts/15-kanban.md
docs/vision/_parts/16-iot.md
docs/vision/_parts/17-ai.md
docs/vision/_parts/18-notifications.md
docs/vision/_parts/19-pos.md
docs/vision/_parts/20-cc.md
docs/vision/_parts/B-05-director.md
docs/vision/_parts/B-06-sd.md
docs/vision/_parts/B-07-pp.md
docs/vision/_parts/B-08-mes.md
docs/vision/_parts/B-09-qc.md
docs/vision/_parts/B-10-warehouse.md
docs/vision/_parts/B-11-mm.md
docs/vision/_parts/B-12-lms.md
docs/vision/_parts/B-13-crm.md
docs/vision/_parts/B-14-marketing.md
docs/vision/_parts/B-15-kanban.md
docs/vision/_parts/B-16-iot.md
docs/vision/_parts/B-17-ai.md
docs/vision/_parts/B-18-notifications.md
docs/vision/_parts/B-19-pos.md
docs/vision/_parts/B-20-cc.md
docs/vision/_parts/B04-coordination.md
docs/vision/_parts/I2-ombor-kassir.md
docs/vision/_parts/I3-ochiq-javoblar.md
docs/vision/_parts/I4-orgsxema.md
docs/vision/_parts/I5-intervyu-tahlil-chat.md
docs/vision/_parts/V-01-org.md
docs/vision/_parts/V-02-hr.md
docs/vision/_parts/V-03-finance.md
docs/vision/_parts/V-04-coordination.md
docs/vision/_parts/V-05-director.md
docs/vision/_parts/V-06-sd.md
docs/vision/_parts/V-07-pp.md
docs/vision/_parts/V-08-mes.md
docs/vision/_parts/V-09-qc.md
docs/vision/_parts/V-10-warehouse.md
docs/vision/_parts/V-11-mm.md
docs/vision/_parts/V-12-lms.md
docs/vision/_parts/V-13-crm.md
docs/vision/_parts/V-14-marketing.md
docs/vision/_parts/V-15-kanban.md
docs/vision/_parts/V-16-iot.md
docs/vision/_parts/V-17-ai.md
docs/vision/_parts/V-18-notifications.md
docs/vision/_parts/V-19-pos.md
docs/vision/_parts/V-20-cc.md

=== 39dc6089 fix(hr): in-progress compat/bonus/DTO/schema updates + i18n baseline refresh
apps/api/src/modules/hr/application/hr-compat-a.service.ts
apps/api/src/modules/hr/domain/repositories/i-hr-compat-a.repo.ts
apps/api/src/modules/hr/payroll/bonus.service.ts
apps/api/src/modules/hr/presentation/dto/hr.dto.ts
apps/api/src/shared/db/schema-hr-tz2.ts
docs/i18n-leakage-baseline.json

=== 584b203b chore: gitignore runtime uploads + stray nul artifact
.gitignore

=== c82833b4 fix(org-node): delete-confirm dialog Cancel button was untranslated
artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx

=== a65bd1d5 fix(i18n): remove stray required-marker asterisk from shared "xodim" key
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== eccecd8f fix(org-node): CkpTab Rules-of-Hooks violation crashing ЦКП tab
artifacts/erp-dashboard/src/components/hr/orgnode/CkpTab.tsx

=== 29ff67e0 fix(org-structure): childCount/vacantChildCount self-correlating subquery
apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts

=== bbae6c41 feat(hujjat): P1-5 configurable page margins (Oddiy / Tor / Keng)
artifacts/erp-dashboard/src/components/document-control/DocumentPaper.tsx
artifacts/erp-dashboard/src/components/document-control/RichTextEditor.tsx
artifacts/erp-dashboard/src/pages/documents/DocumentPrintView.tsx
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 7c562072 feat(hujjat): P1-11 clean PDF/print view — "PDF ko'rinishida ochish"
artifacts/erp-dashboard/src/App.tsx
artifacts/erp-dashboard/src/pages/documents/DocumentPrintView.tsx
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== 05e23060 fix(hr): karta-detail MainTab.tsx labels — stale text + broken i18n
artifacts/erp-dashboard/src/components/hr/orgnode/MainTab.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 0b99a0a8 feat(sec): P2-5 tier-aware idle auto-logout (decision #9)
apps/api/src/common/document-control/document-access-log.service.ts
apps/api/src/common/document-control/document-access.controller.ts
artifacts/erp-dashboard/src/App.tsx
artifacts/erp-dashboard/src/components/IdleLogoutProvider.tsx
artifacts/erp-dashboard/src/components/__tests__/idleTimeoutMs.test.ts
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== fa19fdb3 feat(hr): vacant org-department cards visible as a table on Recruiting/Kanban
artifacts/erp-dashboard/src/components/recruiting/VacantOrgCardsPanel.tsx
artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx

=== 575890c4 feat(cc): P1-9 related_erp_spreadsheet_id — sheet-sourced CC records joinable by sheet id
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/shared/db/migrations/cc-erp-spreadsheet-link-2026-07-14.sql

=== 6c6840b8 fix(hr): EditDialog inconsistencies + real Vakant lavozimlar list view
artifacts/erp-dashboard/src/components/hr/org/VacantPositionsDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx

=== 36dae966 feat(hujjat): P1-8 fill down/right (Ctrl+D/R) + P1-6 real absolute-reference semantics
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.keyboard.test.tsx
artifacts/erp-dashboard/src/lib/__tests__/spreadsheetFill.test.ts
artifacts/erp-dashboard/src/lib/spreadsheetFill.ts

=== 8460a0dc fix(api): GET nodes/:id ambiguous salary_type column broke every karta detail/edit
apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts

=== 4f2eb25f feat(hujjat): P1-7 multiple sheets (varaqlar) in the Jadval editor — no schema change
artifacts/erp-dashboard/src/components/document-control/SheetTabs.tsx
artifacts/erp-dashboard/src/lib/__tests__/spreadsheetWorkbook.test.ts
artifacts/erp-dashboard/src/lib/spreadsheetWorkbook.ts
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== 8b325517 feat(hr): karta badge # raqami endi tur-bo'yicha, global DB id emas
artifacts/erp-dashboard/src/components/hr/org/TreeCanvas.tsx
artifacts/erp-dashboard/src/components/hr/org/TreeNodeCard.tsx
artifacts/erp-dashboard/src/components/hr/org/helpers.ts
artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx

=== 31219784 feat(hujjat): P1-3 find & replace in the Word editor (Ctrl+F)
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx
artifacts/erp-dashboard/src/components/document-control/FindBar.tsx
artifacts/erp-dashboard/src/components/document-control/RichTextEditor.tsx
artifacts/erp-dashboard/src/components/document-control/SearchReplaceExtension.ts
artifacts/erp-dashboard/src/components/document-control/__tests__/SearchReplace.test.tsx
artifacts/erp-dashboard/src/components/document-control/documentEditorConfig.ts

=== 97df0a4f refactor(hr): org-sxema toolbar cleanup, KPI polish, real ЦКП/ish-soati i18n
artifacts/erp-dashboard/src/components/hr/org/ImportNodesDialog.tsx
artifacts/erp-dashboard/src/components/hr/org/KpiCard.tsx
artifacts/erp-dashboard/src/components/hr/org/__tests__/ImportNodesDialog.test.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx

=== 14645d0b feat(hujjat): P1-2 Word device image upload (not URL-only)
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx

=== dd22575e feat(hujjat): P1-4 live word + character count in the Word editor
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 8a93bd5d feat(hujjat): P1-1 Word table row/column/merge editing controls
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/DocumentToolbar.commands.test.tsx

=== 73c92ad1 fix(hujjat): move audit panel to Admin Panel module + open Erkin Hujjatlar to everyone (owner)
artifacts/erp-dashboard/src/components/sidebar/constants.ts
artifacts/erp-dashboard/src/hooks/use-role-menus.ts

=== c48ce8c5 refactor(hr): consolidate ЦКП fields into one group, "Ish soati" -> number
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx

=== 63c93b87 feat(docctl): P0-5 roll-out view/print logging to technology-card + lms-certificate (STEP 3.10)
apps/api/src/modules/lms/presentation/lms-certificates-standalone.controller.ts
apps/api/src/modules/pp/technology/technology.controller.ts

=== d3dce4c4 feat(sd): P0-3 watermark + client_export logging on invoice PDFs (STEP 3.7)
apps/api/src/common/pdf/pdf-watermark.helper.ts
apps/api/src/modules/sd/presentation/sd-invoices.controller.ts

=== 5cf2ad02 refactor(hr): karta forma "Ish vaqti/smena" -> plain "Ish soati" field
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx

=== f6b8a3b5 refactor(hr): remove org-sxema drag-and-drop card reparenting
artifacts/erp-dashboard/src/components/hr/org/TreeCanvas.tsx
artifacts/erp-dashboard/src/components/hr/org/TreeNodeCard.tsx
artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx

=== 6443dec7 fix(chat): P0-4 repair hr-v2/chat 404 drift — thread/forward/poll-create broken via UI
artifacts/erp-dashboard/src/components/chat/page/ForwardModal.tsx
artifacts/erp-dashboard/src/components/chat/page/PollCreator.tsx
artifacts/erp-dashboard/src/components/chat/page/ThreadPanel.tsx
artifacts/erp-dashboard/src/lib/apiBase.ts

=== c1b50b82 fix(hr): org-sxema skip-level connectors jog right after the parent
artifacts/erp-dashboard/src/components/hr/org/TreeCanvas.tsx

=== 314dfc24 feat(hujjat): P0-2 wire copy-action logging in Word + Excel editors
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/lib/documentAccessLog.ts
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== d39b0421 fix(hr): org-sxema canvas rows now follow tier, not tree-recursion depth
artifacts/erp-dashboard/src/components/hr/org/TreeCanvas.tsx
artifacts/erp-dashboard/src/components/hr/org/helpers.ts
artifacts/erp-dashboard/src/components/hr/org/types.ts
artifacts/erp-dashboard/src/components/hr/orgnode/types.ts

=== e2301f55 feat(hujjat): P0-1 director audit panel — the read side of document-control (STEP 3.9)
apps/api/src/common/document-control/document-access-log.service.ts
apps/api/src/common/document-control/document-access.controller.ts
artifacts/erp-dashboard/src/components/sidebar/constants.ts
artifacts/erp-dashboard/src/pages/documents/DocumentAuditLog.tsx
artifacts/erp-dashboard/src/routes/DocumentsRoutes.tsx

=== 38856bac fix(api): stop nestjs-i18n generated-types self-restart loop in dev
.gitignore
apps/api/src/app.module.ts
apps/api/src/generated/i18n.generated.ts

=== e2244914 refactor(hr): unify org-card taxonomy into 6-tier bilingual (UZ/RU) system
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/org/ParentCardSelect.tsx
artifacts/erp-dashboard/src/components/hr/org/TreeNodeCard.tsx
artifacts/erp-dashboard/src/components/hr/org/__tests__/nodeTypeLabels.test.ts
artifacts/erp-dashboard/src/components/hr/org/helpers.ts
artifacts/erp-dashboard/src/components/hr/org/types.ts
artifacts/erp-dashboard/src/components/hr/orgnode/ChildrenTab.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/ExtraTabs.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/MainTab.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/types.ts
artifacts/erp-dashboard/src/erp-modern-ui/ep-motion-helpers.css
artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx
artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx

=== a3acdb34 fix(dev): self-heal stale service worker that blocked the app from loading in dev
artifacts/erp-dashboard/src/main.tsx

=== c7a03306 fix(org): karta belgisi tanlangan turini emas, chuqurlikni ko'rsatardi
artifacts/erp-dashboard/src/components/hr/org/TreeNodeCard.tsx

=== d0228592 feat(brand): use the new EuroPrint logo everywhere (sidebar, header, login), uncropped
artifacts/erp-dashboard/src/components/EuroprintLogo.tsx

=== 46be7f56 fix(hr): remove dead employees.role badge from profile - confusing RBAC duplication
artifacts/erp-dashboard/src/pages/employee-profile/WorkTabSections.tsx

=== ffecd66f feat(hujjat): EuroPrint logo letterhead at top-left of every document + spreadsheet
artifacts/erp-dashboard/public/europrint-doc-logo.png
artifacts/erp-dashboard/src/components/document-control/DocumentLogo.tsx
artifacts/erp-dashboard/src/components/document-control/DocumentPaper.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== da1202aa fix(hujjat): spreadsheet formulas accept ';' separator (RU/UZ Excel locale)
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.formula.test.tsx
artifacts/erp-dashboard/src/lib/__tests__/spreadsheet.formula.smoke.test.ts
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== 7cabf2fb feat(hujjat): Ctrl+S saves the document/spreadsheet (owner ask)
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== 361b8a3d feat(hujjat): spreadsheet undo/redo — Ctrl+Z reverts, Ctrl+Y redoes (owner ask)
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.keyboard.test.tsx

=== 0808995d fix(hr): manager-picker envelope mismatch - showed unrelated user accounts, not employees
artifacts/erp-dashboard/src/components/hr/employee-dialog/ManagerSelect.tsx

=== ad56bd98 feat(hr): Vysotskiy grade salary presets -> business_settings (owner asked where this is configured)
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/hr-vysotskiy-grade-salaries-2026-07-13.sql
artifacts/erp-dashboard/src/components/hr/employee-dialog/BaseSalaryInput.tsx

=== 9e2e2d25 test(hujjat): prove every DocumentToolbar button is wired to a working command
artifacts/erp-dashboard/src/components/document-control/__tests__/DocumentToolbar.commands.test.tsx

=== 228200e3 fix(hr): P0 - every "add employee" 500'd - phantom face_embedding column
apps/api/src/modules/hr/attendance/drizzle-attendance.repo.ts
apps/api/src/shared/db/schema-misc-app-a.ts

=== 0e9e4a5c feat(hujjat): live autosave for documents and spreadsheets (owner: live saqlashi kerak)
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== 2a3669c9 fix(hujjat): narrow spreadsheet cell width further (owner: eni katta)
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx

=== 27453fb2 fix(hujjat): spreadsheet cells too big + "cell inside a cell" look
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx

=== d5a6327a fix(org): rang tanlash butunlay olib tashlandi - egasi qarori (standart 7 daraja yetarli)
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/org/types.ts

=== 155eb4e6 fix(org): tree karta ranglari umuman ko'rinmasdi - CSS grammatika xatosi
artifacts/erp-dashboard/src/components/hr/org/TreeNodeCard.tsx

=== 93283364 feat(hujjat): CC-send for spreadsheets + spreadsheet-editor seed-once guard
apps/api/src/common/document-control/document-delivery.service.ts
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx
artifacts/erp-dashboard/src/pages/documents/SendToCcModal.tsx

=== e03fa060 fix(hujjat): stop unsaved editor changes from disappearing on background refetch
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 7ea4b69c feat(hujjat): spreadsheet copy/paste — Ctrl+C/V/X + visible "Nusxa" button
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx

=== 68270679 fix(hr): Nazorat cluster - Intizom escalation, Xavfsizlik PDF/DTO crashes, Kasbiy O'sish 400
apps/api/src/cron/discipline.cron.ts
apps/api/src/cron/late-arrival-fine.cron.ts
apps/api/src/modules/compatibility/discipline-records-compat.service.ts
apps/api/src/modules/hr/application/hr-compat-safety.service.ts
apps/api/src/modules/hr/attendance/discipline-escalation.helper.ts
apps/api/src/modules/hr/attendance/discipline-record.repository.ts
apps/api/src/modules/hr/domain/repositories/i-hr-compat-safety.repo.ts
apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts
apps/api/src/modules/hr/infrastructure/repositories/hr-compat-a.repository.ts
apps/api/src/modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts
apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts
apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts
apps/api/src/modules/hr/safety/hr-safety.controller.ts
apps/api/src/shared/db/migrations/hr-discipline-escalation-2026-07-13.sql
apps/api/src/shared/db/migrations/hr-safety-form-fields-2026-07-13.sql
apps/api/src/shared/db/schema-business-c-2-hr-safety.ts
artifacts/erp-dashboard/src/pages/HRCareerPathDialogs.tsx
artifacts/erp-dashboard/src/pages/HRSafety.tsx
lib/db/src/schema/discipline.ts

=== 5d26ade1 feat(hr): HR Xarita - add geo-consent + wire lat/lng save on employee dialog
apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts
apps/api/src/shared/db/schema-misc-app-a.ts
artifacts/erp-dashboard/src/components/EmployeeDialog.tsx
artifacts/erp-dashboard/src/components/hr/employee-dialog/HouseholdSection.tsx
artifacts/erp-dashboard/src/components/hr/employee-dialog/types.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 7df7d889 fix(hr): Baholash cluster - 360 rating column drift, Skills Matrix wrong table, Mentorlik/Succession crashes
apps/api/src/modules/compatibility/succession-compat.service.ts
apps/api/src/modules/hr/application/hr-mentorship-pairings.service.ts
apps/api/src/modules/hr/presentation/hr-mentorship-pairings.controller.ts
apps/api/src/modules/hr/skills-matrix/skills-matrix.repository.ts
apps/api/src/modules/integration/integration-extended-hr.repo.ts
artifacts/erp-dashboard/src/pages/EmployeeRating.tsx
artifacts/erp-dashboard/src/pages/HRSuccessionPlanning.tsx
artifacts/erp-dashboard/src/pages/HRSuccessionPlanningDialogs.tsx
artifacts/erp-dashboard/src/pages/Mentorship.tsx

=== abbaa672 fix(hr): Offboarding - checklist crash, mandatory exit-interview vs vision, hr_alumni never written
apps/api/src/modules/hr/offboarding/dto/hr-offboarding.dto.ts
apps/api/src/modules/hr/offboarding/hr-offboarding-completed.listener.ts
apps/api/src/modules/hr/offboarding/hr-offboarding.controller.ts
apps/api/src/modules/hr/offboarding/hr-offboarding.repository.ts
apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts
apps/api/src/modules/hr/offboarding/offboarding-workflow.service.ts
apps/api/src/shared/db/schema-business-b-1.ts
apps/api/test/hr-offboarding.spec.ts
apps/api/test/hr/hr-offboarding.controller.spec.ts
apps/api/test/hr/hr-offboarding.repository.spec.ts
artifacts/erp-dashboard/src/pages/HROffboardingSteps.tsx

=== eb1899f5 feat(hujjat): unify "Mening hujjatlarim" list — show spreadsheets, not just text docs
artifacts/erp-dashboard/src/pages/documents/ErpDocumentsList.tsx

=== 1ac2204f fix(crm): remove duplicate ai/extended/* aliases that crashed Fastify at boot
apps/api/src/modules/compatibility/crm-extended.controller.ts

=== eccf3089 fix(hr): Onboarding - wire card-assignment -> onboarding -> document-gated payroll
apps/api/src/modules/hr/onboarding/dto/onboarding.dto.ts
apps/api/src/modules/hr/onboarding/onboarding-card-assigned.handler.ts
apps/api/src/modules/hr/onboarding/onboarding-document-gate.service.ts
apps/api/src/modules/hr/onboarding/repos/drizzle-hr-onboarding.repo.ts
apps/api/src/modules/hr/onboarding/repos/i-hr-onboarding.repo.ts
apps/api/src/modules/hr/payroll/payroll.service.ts
apps/api/src/shared/db/schema-compat-1b.ts

=== d917809b fix(hr): Rekruting Voronka - pipeline drag/drop silently discarded state+audit
apps/api/src/modules/hr/recruitment/hr-vacancies-pipeline.controller.ts
apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts
apps/api/src/modules/hr/recruitment/repos/drizzle-hr-vacancies-funnel.repo.ts
apps/api/src/modules/hr/recruitment/repos/drizzle-hr-vacancies.repo.ts

=== 3bf2c3a9 fix(hr): HR V2 - Kunlik Hisobot override contract + PDF Cyrillic + Reception stats
apps/api/src/common/database/queries-remaining-b.ts
apps/api/src/cron/daily-report.cron.ts
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/hr/daily-report/daily-report.repository.ts
apps/api/src/modules/hr/daily-report/daily-report.service.ts
apps/api/src/modules/hr/reception/reception.repository.ts
apps/api/src/modules/hr/reception/reception.service.ts
artifacts/erp-dashboard/src/pages/DailyReportPage.tsx
lib/db/src/schema/hr-v2-schema.ts

=== aafb8caf fix(hr): Haftalik Reja - camelCase drift on write-paths + real 5h timezone bug
apps/api/src/modules/remaining/weekly-plan.controller.ts
apps/api/src/modules/remaining/weekly-plan.repository.ts
apps/api/src/modules/remaining/weekly-plan.service.ts
apps/api/test/remaining/weekly-plan.service.spec.ts

=== 337ba5a2 feat(hr): Referral Tizimi - fix real bugs on hr_referrals, wire probation-bonus + funnel-sync
apps/api/src/modules/hr/hr.providers.ts
apps/api/src/modules/hr/onboarding/onboarding.events.ts
apps/api/src/modules/hr/onboarding/onboarding.service.ts
apps/api/src/modules/hr/payroll/referral-bonus.listener.ts
apps/api/src/modules/hr/presentation/hr-gsd.controller.ts
apps/api/src/modules/hr/presentation/hr-gsd.repository.ts
apps/api/src/modules/hr/presentation/hr-gsd.service.ts
apps/api/src/modules/hr/recruitment/referral-stage-sync.listener.ts
apps/api/src/shared/db/migrations/hr-referrals-linkage-2026-07-13.sql
artifacts/erp-dashboard/src/pages/ReferralPageDialogs.tsx
artifacts/erp-dashboard/src/pages/ReferralPageSections.tsx
artifacts/erp-dashboard/src/pages/ReferralPageTypes.ts

=== a761cece fix(hr): Davomat/Smena cluster - orphaned notification-settings route + hard-delete
apps/api/src/common/database/queries-hr-assets.ts
artifacts/erp-dashboard/src/components/sidebar/constants.ts
artifacts/erp-dashboard/src/components/sidebar/hrNavI18n.ts
artifacts/erp-dashboard/src/routes/AdminRoutes.tsx
artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx

=== 6970fde3 fix(hr): Xodimlar - updateEmployee ::text/numeric cast crash + 11 orphan fields
apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts
apps/api/src/modules/hr/presentation/dto/hr.dto.ts
apps/api/src/modules/hr/presentation/hr-employees.controller.ts
apps/api/src/shared/db/migrations/hr-employees-orphan-fields-2026-07-13.sql
apps/api/src/shared/db/schema-misc-app-a.ts
artifacts/erp-dashboard/src/components/EmployeeDialog.tsx
artifacts/erp-dashboard/src/components/hr/employee-dialog/types.ts
artifacts/erp-dashboard/src/components/hr/employee-dialog/useEmployeeMutation.ts

=== fc23166b fix(org): Portret wizard ON CONFLICT crash + add required-equipment ("jihozlar")
apps/api/src/modules/org-structure/card.controller.ts
apps/api/src/modules/org-structure/card.repository.ts
apps/api/src/modules/org-structure/card.service.ts
apps/api/src/modules/org-structure/node-portret.repository.ts
apps/api/src/shared/db/invariants/migrations-drift.ts
apps/api/src/shared/db/migrations/org-card-required-equipment-2026-07-13.sql
artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx

=== 5bfc1a3d fix(ai): AI HR Dashboard - honest ai_unavailable status + budgets to business_settings
apps/api/src/common/constants/app.constants.ts
apps/api/src/modules/ai/application/services/ai-hr-new.service.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/ai-hr-dashboard-budgets-2026-07-13.sql

=== b16c734e feat(jadval): growable grid (add rows/columns) + full formula picker
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.features.test.tsx

=== ee825fa3 fix(hr): HR Dashboard - scope birthday PII to manager's department, fix lang param
apps/api/src/modules/hr/application/hr-dashboard-extra.service.ts
apps/api/src/modules/hr/application/hr-dashboard.service.ts
apps/api/src/modules/hr/domain/repositories/i-hr-dashboard.repo.ts
apps/api/src/modules/hr/infrastructure/repositories/hr-dashboard.repository.ts
apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts
apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts

=== 5f313eb8 feat(hr): Xato Katalogi - seed 18 print-defect rows + major-severity color fix
apps/api/src/shared/db/migrations/error-catalog-seed-2026-07-13.sql
artifacts/erp-dashboard/src/components/ep/DefectDropdown.tsx
artifacts/erp-dashboard/src/pages/ErrorCatalogConfig.tsx

=== 6202650d feat(jadval): expand formula engine 11 -> 30+ functions (owner: funksiyalari juda kam)
artifacts/erp-dashboard/src/lib/__tests__/spreadsheet.test.ts
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== c264fd00 fix(hr): HR Brend — hr_brand_settings ON CONFLICT crash + drop vestigial company_id
apps/api/src/common/database/queries-remaining-b.ts
apps/api/src/modules/hr/infrastructure/repositories/hr-compat-safety.repository.ts
apps/api/src/shared/db/schema-business-c-2-hr-safety.ts

=== d38ab8e7 fix(hr): Maqsadlar (Goals) — delete-RBAC + create/update camelCase crash
apps/api/src/modules/compatibility/goals-compat.controller.ts
apps/api/src/modules/compatibility/goals-compat.service.ts

=== e397bdd4 fix(jadval): make select-all obvious — labelled button + clear highlight + range label
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.features.test.tsx

=== d78c0489 fix(jadval): last cell edit lost on Save + select-all not discoverable
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.keyboard.test.tsx
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx

=== 224beb61 docs: HR+Org vizyon faylini fon-agent topilmalari bilan kengaytirish
docs/audit/HR-ORG-VIZYON-VA-CHALA-ISHLAR-2026-07-13.md

=== a69af391 test(erkin-hujjat): self-audit — functional proof of Word + formula features
artifacts/erp-dashboard/src/components/document-control/__tests__/wordFeatures.test.ts
artifacts/erp-dashboard/src/lib/__tests__/spreadsheet.test.ts

=== 2bdb37f6 docs: HR+Org-struktura vizyon va chala-ishlar konsolidatsiya (2026-07-13)
docs/audit/HR-ORG-VIZYON-VA-CHALA-ISHLAR-2026-07-13.md

=== 7897e35c feat(jadval): range select-all, formula (fx) helper, column filter (owner-requested)
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.features.test.tsx

=== 9699d044 fix(jadval): cell needed a double-click before typing (owner bug)
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/SpreadsheetGrid.keyboard.test.tsx

=== 4efa0dbe fix(erkin-hujjat): imported/loaded document text was not shown in the editor
artifacts/erp-dashboard/src/components/document-control/RichTextEditor.tsx
artifacts/erp-dashboard/src/components/document-control/__tests__/RichTextEditor.import.test.tsx
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 91fb1bd3 fix(i18n): 5 AI Rejalashtirish pages showed literal "Sarlavha"/"Tavsif" placeholder titles
artifacts/erp-dashboard/src/locales/ru/ai.json
artifacts/erp-dashboard/src/locales/uz-cyr/ai.json
artifacts/erp-dashboard/src/locales/uz/ai.json

=== 2ae9e2f6 fix(pp): Quvvat Rejasi (Capacity Planning) — fake create, wrong response shape, crash
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/erp/erp-reports.controller.ts
apps/api/src/modules/erp/erp-reports.repository.ts
apps/api/src/modules/erp/erp-reports.service.ts
artifacts/erp-dashboard/src/pages/CapacityPlanning.tsx
artifacts/erp-dashboard/src/pages/CapacityPlanningSections.tsx
artifacts/erp-dashboard/src/pages/CapacityPlanningTabs.tsx

=== e09811e2 fix(pp): PP Dashboard "Yangi buyurtma" button pointed at a dead /order-wizard route
artifacts/erp-dashboard/src/pages/PPDashboard.tsx

=== 26888b47 fix(security): raw SQL/schema text was leaking to the browser on 5xx errors
apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts
artifacts/erp-dashboard/src/lib/api-request.ts

=== 40169a24 feat(jadval): Excel cell borders + background fill color
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== 0dc3118e feat(ai): implement Demand Forecast + Rush Orders (were 501 stubs)
apps/api/src/modules/ai/ai.module.ts
apps/api/src/modules/ai/application/services/demand-forecast.service.ts
apps/api/src/modules/ai/application/services/rush-orders.service.ts
apps/api/src/modules/ai/infrastructure/repositories/drizzle-rush-orders.repo.ts
apps/api/src/modules/ai/presentation/ai.controller.ts

=== b2858aee feat(erkin-hujjat): Import Word .docx into a new document (item #4)
artifacts/erp-dashboard/package.json
artifacts/erp-dashboard/src/pages/documents/ErpDocumentsList.tsx
artifacts/erp-dashboard/src/pages/documents/ImportDocxButton.tsx
pnpm-lock.yaml

=== 41d12182 feat(design): build Dizayn Kutubxona asset library end-to-end (was dead button)
apps/api/src/modules/design/design.module.ts
apps/api/src/modules/design/library/library.controller.ts
apps/api/src/modules/design/library/library.repository.ts
artifacts/erp-dashboard/src/pages/DesignExtendedSectionsMore.tsx

=== f1df0385 feat(qc): wire qc_lab_tests session model into DTO/service/repo (real, not stub)
apps/api/src/modules/qc/application/qc-new.service.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts
apps/api/src/modules/qc/presentation/qc-new.controller.ts
apps/api/src/shared/db/schema-misc-qc.ts
artifacts/erp-dashboard/src/components/production/qc/types.ts

=== 5ee29a5a feat(schema): add qc_lab_tests session columns, ai business_settings, rush_order_requests table
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/ai-forecast-min-orders-threshold-2026-07-13.sql
apps/api/src/shared/db/migrations/qc-lab-tests-session-model-2026-07-13.sql
apps/api/src/shared/db/migrations/rush-orders-2026-07-13.sql

=== 53296ac8 feat(erkin-hujjat): Word — font family + font size dropdowns
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx
artifacts/erp-dashboard/src/components/document-control/documentEditorConfig.ts

=== 2c6deb4d fix(pp): Vaqt va Tannarx calculator's Hisoblash button was fully dead
artifacts/erp-dashboard/src/pages/TechPPExtendedSections.tsx

=== 20f2a1b5 fix(pp): Marshrutlar (Routing) page had a dead create button behind an early return
artifacts/erp-dashboard/src/pages/RoutingConfiguration.tsx

=== 7f8a2e09 feat(jadval): Excel formulas — MIN/MAX/ROUND/CONCATENATE/VLOOKUP/TODAY/NOW + abs refs
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== f91a1e15 feat(jadval): Phase B-4a — cell-format toolbar (bold / align / number-format)
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== 556de843 fix(jadval): formula engine — IF string result + cycle error propagation
artifacts/erp-dashboard/src/lib/spreadsheet.ts

=== a49a78b5 feat(jadval): Phase B-3 routing — spreadsheet routes + enable "Jadval" card
artifacts/erp-dashboard/src/pages/documents/DocumentFormatChoice.tsx
artifacts/erp-dashboard/src/routes/DocumentsRoutes.tsx

=== 5abece33 fix(marketing): PR Faoliyat header rendered literal "{t('prMedia')}" text
artifacts/erp-dashboard/src/pages/MarketingPR.tsx

=== 8de84c1b fix(qc): Sifat Sertifikatlari showed malformed "berildi1" label
artifacts/erp-dashboard/src/locales/ru/qc.json
artifacts/erp-dashboard/src/locales/uz-cyr/qc.json
artifacts/erp-dashboard/src/locales/uz/qc.json
artifacts/erp-dashboard/src/pages/qc/QualityCertificatesPage.tsx

=== 25d5b617 fix(qc): Reklamatsiya row showed "Invalid Date" — wrong field name
artifacts/erp-dashboard/src/components/document-control/SpreadsheetGrid.tsx
artifacts/erp-dashboard/src/lib/spreadsheet.ts
artifacts/erp-dashboard/src/pages/documents/ErpSpreadsheetEditor.tsx
artifacts/erp-dashboard/src/pages/qc/ReclamationsPage.tsx

=== 2eae3d4d fix(qc): AI Tahlil crashed on every load — object rendered as React child
artifacts/erp-dashboard/src/components/production/qc/AiTrendSection.tsx
artifacts/erp-dashboard/src/components/production/qc/types.ts

=== 7dc92a85 fix(qc): Yetkazuvchi Sifati crashed on first populated fetch after save
artifacts/erp-dashboard/src/pages/qc/SupplierQualityPage.tsx

=== 092d665d fix(qc): Parametrlar/Normalar routes redirected away before their tab could render
artifacts/erp-dashboard/src/routes/AppRouter.tsx
artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx

=== 664e9641 feat(jadval): Phase B-2 — erp_spreadsheets CRUD API + control-layer wiring
apps/api/src/app.module.ts

=== f89b5034 fix(qc): Material Testlari saved but never showed rows — .grouped envelope mismatch
apps/api/src/modules/erp-spreadsheets/erp-spreadsheets.controller.ts
apps/api/src/modules/erp-spreadsheets/erp-spreadsheets.module.ts
apps/api/src/modules/erp-spreadsheets/erp-spreadsheets.repository.ts
artifacts/erp-dashboard/src/pages/QCModule.tsx
artifacts/erp-dashboard/src/pages/QCModuleTypes.ts

=== 119565a5 fix(i18n): qc namespace loaded qcreview.json instead of qc.json — 13 pages affected
artifacts/erp-dashboard/src/components/production/qc/LabSection.tsx
artifacts/erp-dashboard/src/lib/i18n/loader.ts

=== 16be54fc fix(marketing): Blog Maqola create always 422'd, dropped SEO/cover/tags fields
apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-group2.repo.ts
apps/api/src/modules/marketing/presentation/marketing-group2.controller.ts

=== 8fd71616 fix(marketing): NPS/Churn list never showed created records
apps/api/src/modules/marketing/application/marketing-ext.service.ts
apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts
apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts

=== deaf127f feat(jadval): Phase B-1 — erp_spreadsheets table (spreadsheet authoring)
apps/api/src/common/document-control/document-access-log.service.ts
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/erp-spreadsheets-phaseB-2026-07-13.sql
apps/api/src/shared/db/schema-erp-spreadsheets.ts

=== f5bbeb9a feat(erkin-hujjat): item 3/5 — gated "Chop etish" print (was native Ctrl+P, ungated)
apps/api/src/modules/erp-documents/erp-documents.controller.ts
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== e2610467 feat(erkin-hujjat): item 2 — Word-style name prompt on first save
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 4a61bdfc feat(erkin-hujjat): item 1 — format-selection screen on "Yangi hujjat"
artifacts/erp-dashboard/src/pages/documents/DocumentFormatChoice.tsx
artifacts/erp-dashboard/src/routes/DocumentsRoutes.tsx

=== f8b9a0e9 feat(erkin-hujjat): STEP 3.6b-2 — "Erkin hujjat" selectable in CC's create flow
artifacts/erp-dashboard/src/components/cc/NewDocumentModal.tsx

=== 379fe005 fix(sd): quotation create — 400 on real submits, list showed dashes/0
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
artifacts/erp-dashboard/src/pages/SDSalesQuotes.tsx
artifacts/erp-dashboard/src/pages/SDSalesQuotesTypes.ts

=== 9c6a4569 feat(doc-control): STEP 3.6b-1 — start an "Erkin hujjat" from CC (backend)
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== 0c9af901 feat(erkin-hujjat): STEP 3.6a-3 — "CC orqali yuborish" action + employee picker
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/pages/documents/SendToCcModal.tsx

=== bb90aa35 feat(doc-control): STEP 3.6a-2 — send an erkin hujjat into CC (backend)
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== 09052070 feat(doc-control): STEP 3.6a-1 — cc_documents <- erp_documents link + generic template
apps/api/src/shared/db/migrations/cc-erp-document-link-step36a-2026-07-13.sql

=== ad1c308e fix(sd): quotation price panel showed 0 for total/cost/markup/VAT
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts

=== b003342c feat(erkin-hujjat): editor toolbar — text align, color, highlight, image
artifacts/erp-dashboard/package.json
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx
artifacts/erp-dashboard/src/components/document-control/documentEditorConfig.ts
pnpm-lock.yaml

=== 3abab602 fix(sd): quotation price calc always returned 0 — camelCase/snake_case mismatch
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts

=== 7ac39579 feat(erkin-hujjat): Google-Docs top bar — inline title, tier badge, save-status
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 9edf4bb9 feat(erkin-hujjat): Google-Docs-style editor — paper canvas + sticky icon toolbar
artifacts/erp-dashboard/src/components/document-control/DocumentPaper.tsx
artifacts/erp-dashboard/src/components/document-control/DocumentToolbar.tsx
artifacts/erp-dashboard/src/components/document-control/RichTextEditor.tsx
artifacts/erp-dashboard/src/components/document-control/documentEditorConfig.ts
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx

=== 905d396a fix(security): attendance-records 503 — Drizzle schema had a phantom timestamp column
apps/api/src/modules/security/attendance/attendance.repository.ts

=== 2bf1bbab feat(mm): implement GET/PATCH/POST fleet/deliveries — was 501, real table existed unused
apps/api/src/modules/mm/application/mm-dashboard.service.ts
apps/api/src/modules/mm/domain/repositories/i-mm-dashboard.repo.ts
apps/api/src/modules/mm/dto/mm.dto.ts
apps/api/src/modules/mm/infrastructure/repositories/mm-dashboard.repository.ts
apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts

=== b0ff014f fix(marketing): inbox conversations 503 — untyped null param in raw SQL
apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts

=== 7ad29bd1 fix(fe): Reports Hub crash — imported translations dict shadowed by hook's t
artifacts/erp-dashboard/src/pages/ReportsHub.tsx

=== 1433e8a8 fix(fe): Certificates dialog crash on courses?.map — missing Array.isArray guard
artifacts/erp-dashboard/src/pages/CertificatesDialogs.tsx

=== 45e75886 feat(erkin-hujjat): Phase A4 — "Mening hujjatlarim" list + sidebar entry
artifacts/erp-dashboard/src/components/sidebar/constants.ts
artifacts/erp-dashboard/src/pages/documents/ErpDocumentsList.tsx
artifacts/erp-dashboard/src/routes/DocumentsRoutes.tsx

=== 4872191c fix(fe): GoodsReceiving/cameras-management/camera-alerts crash — fake callable-object cast
artifacts/erp-dashboard/src/components/wms/receiving/useGoodsReceivingTranslations.ts
artifacts/erp-dashboard/src/pages/GoodsReceiving.tsx
artifacts/erp-dashboard/src/pages/camera-alerts-sections.tsx
artifacts/erp-dashboard/src/pages/camera-alerts-types.ts
artifacts/erp-dashboard/src/pages/camera-alerts.tsx
artifacts/erp-dashboard/src/pages/cameras-management-sections.tsx
artifacts/erp-dashboard/src/pages/cameras-management-types.ts
artifacts/erp-dashboard/src/pages/cameras-management.tsx
artifacts/erp-dashboard/src/pages/documents/ErpDocumentsList.tsx

=== 4230840a feat(erkin-hujjat): Phase A3 — TipTap rich-text editor + create/edit routes
artifacts/erp-dashboard/package.json
artifacts/erp-dashboard/src/components/document-control/RichTextEditor.tsx
artifacts/erp-dashboard/src/pages/documents/ErpDocumentEditor.tsx
artifacts/erp-dashboard/src/routes/AppRouter.tsx
artifacts/erp-dashboard/src/routes/DocumentsRoutes.tsx
pnpm-lock.yaml

=== cfe8f235 fix(sd): sales_orders INSERT hardcoded design_flag/sample_flag=false, dropped currency
apps/api/src/common/database/queries-sd.ts
apps/api/src/modules/sd/domain/aggregates/sales-order.aggregate.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts
apps/api/src/shared/db/schema-ext-a-1.ts

=== 0f90ee07 fix(sd): unblock /order-create — required product/BOM catalog fields were empty forever
artifacts/erp-dashboard/src/components/orders/CustomerStep.tsx
artifacts/erp-dashboard/src/components/orders/translations.ts
artifacts/erp-dashboard/src/components/orders/useWizardState.ts
artifacts/erp-dashboard/src/pages/OrderCreationWizard.tsx

=== 0a422b5e feat(erkin-hujjat): Phase A2 — erp_documents CRUD API + control-layer wiring
apps/api/src/app.module.ts
apps/api/src/common/document-control/document-access-log.service.ts
apps/api/src/modules/erp-documents/erp-documents.controller.ts
apps/api/src/modules/erp-documents/erp-documents.module.ts
apps/api/src/modules/erp-documents/erp-documents.repository.ts

=== e4f08623 feat(erkin-hujjat): Phase A1 — erp_documents table (free-form documents)
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/erp-documents-phaseA1-2026-07-13.sql
apps/api/src/shared/db/schema-erp-documents.ts

=== a533d49a feat(doc-control): STEP 3.5 — in-app chat delivery of document assignments (Tizim)
apps/api/src/common/document-control/document-control.module.ts
apps/api/src/common/document-control/document-delivery.service.ts
apps/api/src/modules/communication-center/application/cc-workflow.service.ts

=== 3b8dcbd5 fix(i18n): add missing SD Customer 360 translation keys (owner-reported console warnings)
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/ru/sd.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/sd.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/locales/uz/sd.json

=== 23c43bb4 fix(sd): Customer 360 payments tab always showed empty history
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts

=== 3728606f feat(doc-control): STEP 3.4 — tier-driven watermark on document viewers
apps/api/src/modules/communication-center/domain/types.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-baskets.repo.ts
artifacts/erp-dashboard/src/components/cc/DocumentDetailModal.tsx
artifacts/erp-dashboard/src/components/document-control/DocumentWatermark.tsx

=== e5bac042 feat(doc-control): STEP 3.3 — view/copy/print access-logging, piloted in CC
apps/api/src/app.module.ts
apps/api/src/common/document-control/document-access-log.service.ts
apps/api/src/common/document-control/document-access.controller.ts
apps/api/src/common/document-control/document-control.module.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== ded9b592 feat(doc-control): STEP 3.2 — backend blocks Content-Disposition:attachment by default
apps/api/src/common/document-control/download-block.hook.ts
apps/api/src/main.ts

=== 33265e27 fix(erp): relabel "Mahsulot yaratish" tab to "Xom-ashyo yaratish" (was mislabeled)
artifacts/erp-dashboard/src/locales/ru/production.json
artifacts/erp-dashboard/src/locales/uz-cyr/production.json
artifacts/erp-dashboard/src/locales/uz/production.json
artifacts/erp-dashboard/src/pages/ERPProduction.tsx
artifacts/erp-dashboard/src/pages/erp/ERPProductsTab.tsx

=== 91e4a29e feat(design): remove DesignOrders.tsx's dead "create order" dialog
artifacts/erp-dashboard/src/pages/DesignOrders.tsx

=== b928a1ec feat(doc-control): STEP 3.1 — document_access_log table + sensitivity_tier + Tizim user
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/document-control-3.1-access-log-tiers-2026-07-13.sql
apps/api/src/shared/db/schema-document-control.ts

=== 049c5392 feat(sd): remove SDSalesOrders.tsx's duplicate create-order dialog
artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx

=== 06f54379 feat(orders): Papka Buyurtmalari "Yangi Buyurtma" now redirects to /order-create
artifacts/erp-dashboard/src/pages/PapkaOrders.tsx

=== 7755b105 fix(api): raise Fastify bodyLimit to 30MB so chat file upload reaches its 25MB cap
apps/api/src/main.ts

=== 53cc000f feat(orders): /order-create wizard now creates a real sales_orders row
artifacts/erp-dashboard/src/components/orders/CustomerStep.tsx
artifacts/erp-dashboard/src/components/orders/translations.ts
artifacts/erp-dashboard/src/components/orders/types.ts
artifacts/erp-dashboard/src/components/orders/useWizardState.ts

=== 3a0d20de feat(sd): canonical order-create path now accepts bespoke (no-SKU) line items
apps/api/src/modules/sd/domain/repositories/i-sales-order.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts
apps/api/src/modules/sd/presentation/dto/create-order.dto.ts

=== e7dace07 feat(chat): add audio-only call button (was missing)
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx
artifacts/erp-dashboard/src/components/chat/page/ChatLayoutMessages.tsx
artifacts/erp-dashboard/src/components/chat/page/ChatLayoutTypes.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 5958224c fix(chat): reactions + pin were 404/403 — add /api/chat aliases, fix pin roomId bug
apps/api/src/modules/chat/chat-message.service.ts
apps/api/src/modules/chat/chat.controller.ts

=== 1fea7183 fix(hr): employee profile-photo upload was a complete no-op
artifacts/erp-dashboard/src/components/EmployeeDialog.tsx

=== 2ed9c35b fix(marketing): Competitors tab now renders backend's real fields, not fake ones
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/pages/MarketingExtendedSections.tsx
artifacts/erp-dashboard/src/pages/MarketingExtendedTypes.ts

=== 5d35bbbb fix(sd): payment create now accepts camelCase orderId/customerId/dueDate
apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts

=== 0898a766 fix(chat): panel "Vazifa yaratish" button was 400 (board_id empty) — add board picker
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx

=== eff7b4cb fix(marketing): content-post CREATE always failed (missing platform, body/content DTO mismatch)
apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts
apps/api/src/modules/marketing/presentation/dto/marketing-ext.dto.ts
apps/api/src/shared/db/schema-marketing-ext.ts

=== bbb4af79 fix(marketing): unwrap {data,...}/{items:[...]} response envelope in 5 list queries
artifacts/erp-dashboard/src/pages/MarketingContent.tsx
artifacts/erp-dashboard/src/pages/MarketingDashboard.tsx
artifacts/erp-dashboard/src/pages/MarketingExtended.tsx
artifacts/erp-dashboard/src/pages/MarketingLeads.tsx

=== e35bd440 fix(sd): quotation-to-order conversion now carries the product line-items across
apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/sales-order-items-custom-spec-2026-07-13.sql

=== 425ee8f9 feat(chat): "Xabardan Task Yaratish" now creates a real Kanban card + link
apps/api/src/modules/chat/chat-ext.controller.ts
apps/api/src/modules/chat/chat-notifications.service.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/dto/create-message-task.dto.ts
apps/api/src/modules/chat/repositories/chat-notification.repository.ts
apps/api/src/shared/db/migrations/chat-message-task-kanban-link-2026-07-13.sql
artifacts/erp-dashboard/src/components/chat/page/CreateTaskModal.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== eca9e0cb feat(director): CouncilQuorum FE — per-member vote casting wired to council_votes
artifacts/erp-dashboard/src/pages/CouncilQuorum.tsx

=== 8b83413b fix(chat): channel creation actually creates a CHANNEL (was always GROUP)
artifacts/erp-dashboard/src/components/chat/page/ChatUtils.ts
artifacts/erp-dashboard/src/components/chat/page/CreateRoomModal.tsx
artifacts/erp-dashboard/src/components/chat/page/RoomInfoPanel.tsx

=== 79ad9f5f fix(chat): add singular rooms/:id/pinned route to /api/chat (was 404)
apps/api/src/modules/chat/chat.controller.ts

=== 36630c78 feat(kanban): add GET /api/kanban/resource-allocation endpoint
apps/api/src/modules/kanban/application/kanban-ext-flow.service.ts
apps/api/src/modules/kanban/application/kanban-ext.service.ts
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-analytics.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-ext.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo.ts
apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts
artifacts/erp-dashboard/src/pages/kanban/ResourceAllocationView.tsx

=== 1f759fd8 fix(notifications): land the module/port/adapter unwiring dropped from a3c74437
apps/api/src/modules/notifications/domain/ports/i-telegram-sender.port.ts
apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts
apps/api/src/modules/notifications/notifications.module.ts

=== a3c74437 refactor(notifications): remove dead TelegramSvc/AlertsService/erp-events-listener stack
apps/api/src/modules/notifications/alerts/alerts.repository.ts
apps/api/src/modules/notifications/alerts/alerts.service.ts
apps/api/src/modules/notifications/domain/services/email-notification.service.ts
apps/api/src/modules/notifications/domain/services/sms.service.ts
apps/api/src/modules/notifications/domain/services/telegram.service.ts
apps/api/src/modules/notifications/infrastructure/event-handlers/erp-events.listener.ts
apps/api/src/modules/notifications/telegram/drizzle-telegram-svc.repo.ts
apps/api/src/modules/notifications/telegram/i-telegram-svc.repo.ts
apps/api/src/modules/notifications/telegram/telegram.service.ts
apps/api/test/notifications/alerts.repository.spec.ts
apps/api/test/notifications/alerts.service.spec.ts
apps/api/test/notifications/domain/services/telegram.service.spec.ts
apps/api/test/notifications/drizzle-telegram-svc.repo.spec.ts
apps/api/test/notifications/email-notification.service.spec.ts
apps/api/test/notifications/sms.service.spec.ts
apps/api/test/notifications/telegram.service.spec.ts

=== 493d1fe2 feat(notifications): category_code taxonomy soft-ref (notification_category)
apps/api/src/modules/notifications/application/commands/create-notification.command.ts
apps/api/src/modules/notifications/application/commands/create-notification.handler.ts
apps/api/src/modules/notifications/domain/aggregates/notification.aggregate.ts
apps/api/src/modules/notifications/infrastructure/repositories/drizzle-notification.repo.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/notifications-category-code-2026-07-13.sql
apps/api/src/shared/db/schema-compat-3.ts

=== 627359f9 fix(chat): xodim-panel md-breakpoint (768px'da ham ko'rinadi)
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx

=== 25753ffd feat(notifications): HR absence-day1/day2/blocked handlers now persist real notifications
apps/api/src/cron/absence-block.cron.ts
apps/api/src/modules/notifications/infrastructure/event-handlers/orphan-events.listener.ts

=== 166c6d38 fix(chat): related-tasks 503 (status ustuni yo'q) + telefon i18n kaliti
apps/api/src/modules/chat/repositories/chat-room.repository.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 7abcfa17 fix(director): AlertFeed action buttons dispatch real actions, not just markRead (Q-40)
artifacts/erp-dashboard/src/components/director/AIAdvisor.tsx
artifacts/erp-dashboard/src/components/director/AlertFeed.tsx

=== 094d18d7 feat(cc): document_type_code/contact_type_code taxonomy soft-ref on templates
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-read.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-document-templates-taxonomy-codes-2026-07-13.sql

=== 26e7cc02 feat(cc): document_hashes table for PDF integrity check (schema-only)
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-document-hashes-2026-07-13.sql
apps/api/src/shared/db/schema-cc-document-hashes.ts

=== 4ad0fc81 feat(kanban): seed QC/production/design boards to unblock today's auto-card triggers
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-qc-mes-design-boards-2026-07-13.sql

=== c555d7fd fix(kanban): window.confirm -> ConfirmDialog on delete-board/delete-column (Qoida 14)
artifacts/erp-dashboard/src/components/kanban/BoardHeader.tsx
artifacts/erp-dashboard/src/pages/kanban/KanbanColumn.tsx

=== 392ee498 feat(chat): xodim-panel stat-qatori — ochiq vazifalar + CC soni (design STEP 3.4, 3g)
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 20098312 fix(kanban): PDF export failure returns real 500, not a fake placeholder file (Q-40)
apps/api/src/generated/i18n.generated.ts
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/kanban/presentation/kanban-reports.controller.ts

=== 858b6de3 feat(chat): xodim-panel "Vazifa yaratish" tugmasi (design STEP 3.3, 3e)
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 6c368d31 fix(telegram): TELEGRAM_BOT_TOKEN via ConfigService, guard on missing token (Qoida 7)
apps/api/src/telegram/telegram.service.ts

=== 63a37468 feat(chat): xodim-panel "Izohlar" tab — suhbat izohlari (design STEP 3.2)
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-room.repository.ts
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx

=== a3d6db30 feat(chat): chat_room_notes jadval — Izohlar tab schema (design STEP 3.1)
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/chat-room-notes-2026-07-13.sql
apps/api/src/shared/db/schema-chat.ts
lib/db/src/schema/chat-schema.ts

=== 77647b36 fix(chat): membership 403 — chat_members integer/text drift (tugmalar buzuq edi)
apps/api/src/modules/chat/repositories/chat-room.repository.ts

=== e2dadf16 fix(chat): WS auth cookie-asosli — xabar ketmasligi TUZATILDI (P0 regressiya)
apps/api/src/modules/chat/chat.gateway.ts
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx

=== 2db4f06b fix(crm): correct CRM ownership column for row-scoping (B59)
apps/api/src/modules/crm/common/crm-row-scope.ts
apps/api/src/modules/crm/deals/deals.service.ts
apps/api/src/modules/crm/deals/drizzle-crm-deals.repo.ts
apps/api/src/modules/crm/leads/drizzle-crm-leads.repo.ts
apps/api/src/modules/crm/leads/leads.service.ts
apps/api/src/modules/crm/listeners/website-lead.repository.ts
apps/api/src/modules/crm/presentation/crm-deals.controller.ts
apps/api/src/shared/db/schema-compat-1a.ts

=== d496c994 fix(chat): direct-room aniqlash case-insensitive (jonli data 'direct'+'DIRECT')
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx

=== 84e7486e fix(chat): xodim-panel endi DM'da DOIM ko'rinadi + haqiqiy a'zolardan
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx

=== ca379007 feat(coordination): dokla/rasporyazhenie hard-delete -> soft-delete (D8)
apps/api/src/modules/director/application/coordination.service.ts
apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts
apps/api/src/modules/director/infrastructure/cron/rasporyazhenie-escalation.cron.ts
apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts
apps/api/src/modules/director/infrastructure/repositories/director-data.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/dokla-rasporyazhenie-soft-delete-2026-07-13.sql
apps/api/src/shared/db/schema-business-a-2.ts

=== 2332345d feat(kanban): per-column WIP-limit override + supervisor bypass (C5)
apps/api/src/modules/kanban/application/kanban-boards.service.ts
apps/api/src/modules/kanban/domain/repositories/i-kanban-boards.repo.ts
apps/api/src/modules/kanban/dto/kanban.dto.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-columns.repo.ts
apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-wip-limit-2026-07-13.sql
apps/api/src/shared/db/schema-kanban.ts

=== 3765d7e6 fix(cron): CqrsModule import — MesSosEscalation[EventBus] boot DI xatosi
apps/api/src/cron/cron.module.ts

=== a9f25fd9 feat(qc): customer-fault defect flag auto-notifies sales manager (A106)
apps/api/src/modules/qc/application/commands/set-fault-attribution.command.ts
apps/api/src/modules/qc/application/commands/set-fault-attribution.handler.ts
apps/api/src/modules/qc/domain/events/index.ts
apps/api/src/modules/qc/infrastructure/repositories/drizzle-defect.repo.ts
apps/api/src/modules/qc/presentation/qc-defects.controller.ts
apps/api/src/modules/qc/qc.module.ts
apps/api/src/modules/sd/infrastructure/event-handlers/qc-customer-fault-sd.listener.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/qc-defects-customer-fault-2026-07-13.sql

=== 072fce93 feat(cc): MES/QC/HR/PP domain events auto-spawn CC documents (D2)
apps/api/src/modules/hr/hr.providers.ts
apps/api/src/modules/hr/offboarding/hr-offboarding-cc.listener.ts
apps/api/src/modules/mes/application/mes-sos-escalation.service.ts
apps/api/src/modules/pp/application/pp-planning.service.ts
apps/api/src/modules/pp/presentation/pp-planning.controller.ts
apps/api/src/modules/qc/infrastructure/event-handlers/qc-inspection-failed-cc.listener.ts
apps/api/src/modules/qc/qc.module.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-cross-module-spawn-templates-2026-07-13.sql

=== 8a3d223f feat(chat): xodim-panel "Bog'liq vazifalar" tab (design STEP 3.5)
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-room.repository.ts
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 34ceed0f feat(kanban): QC/MES/Design → Kanban card auto-creation triggers (C4)
apps/api/src/modules/kanban/application/event-handlers/design-requested-kanban.handler.ts
apps/api/src/modules/kanban/application/event-handlers/mes-completed-kanban.handler.ts
apps/api/src/modules/kanban/application/event-handlers/qc-failed-kanban.handler.ts
apps/api/src/modules/kanban/domain/repositories/i-kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts
apps/api/src/modules/kanban/kanban.module.ts

=== 9905ed2c feat(chat): xodim-panel tab-bar + Fayllar tab (design STEP 3.4)
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx

=== 2e53ed32 feat(cc): super_admin-only CRUD for document templates (D1)
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-read.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== 5d5dcdf7 feat(chat): xodim-panel suhbat teglari (design STEP 3.3)
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-room.repository.ts
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 4241faa0 feat(finance): A16all 5 new GL accounts (loss/waste-income/marketing/referral/in-transit)
apps/api/src/modules/finance/domain/constants/gl-accounts.constants.ts
apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts
apps/api/src/modules/pos/dto/movement-enums.ts
apps/api/src/modules/wms/application/wms-in-transit.service.ts
apps/api/src/modules/wms/wms.module.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/gl-loss-marketing-referral-intransit-accounts-2026-07-13.sql

=== c430ab1a feat(notifications): E1 module_code/channel/status/immutable columns
apps/api/src/modules/notifications/application/commands/create-notification.command.ts
apps/api/src/modules/notifications/application/commands/create-notification.handler.ts
apps/api/src/modules/notifications/domain/aggregates/notification.aggregate.ts
apps/api/src/modules/notifications/infrastructure/repositories/drizzle-notification.repo.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/notifications-module-channel-status-immutable-2026-07-13.sql
apps/api/src/shared/db/schema-compat-3.ts

=== 71fd67e3 feat(chat): xodim-panel ish-holati indikatori — presence work_status (design STEP 3.2)
apps/api/src/modules/chat/chat.controller.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-presence.repository.ts
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx

=== 48bcb53c fix(cc): D0 CC approval auto-posts to GL for financial templates (P0)
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/modules/communication-center/communication-center.module.ts
apps/api/src/modules/communication-center/domain/events/cc-document-fully-approved.event.ts
apps/api/src/modules/communication-center/events/cc-approved-gl-posting.listener.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/seed-gl-account-mappings-cc-2026-07-13.sql

=== 50456109 feat(kanban): E6 TT mandatory fields + 24h SLA matching CC template rules
apps/api/src/modules/kanban/infrastructure/cron/kanban-cron.processor.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-tt-sla-2026-07-13.sql
apps/api/src/shared/db/schema-kanban.ts

=== ad7d19e1 feat(chat): 3-panel inbox — xodim-profil paneli "Umumiy ma'lumot" (design STEP 3.1)
artifacts/erp-dashboard/src/components/chat/page/ChatEmployeeInfoPanel.tsx
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json

=== 8113fb80 feat(cc): D6 wire archive_after_days + 90-day stale-draft archive cron
apps/api/src/modules/communication-center/cron/cc-sla.cron.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/cc-stale-draft-archive-threshold-2026-07-13.sql

=== 58ae162e feat(kanban): C8 confidential-card flag hidden from general board
apps/api/src/modules/kanban/application/kanban-boards.service.ts
apps/api/src/modules/kanban/domain/repositories/i-kanban-boards.repo.ts
apps/api/src/modules/kanban/dto/kanban.dto.ts
apps/api/src/modules/kanban/infrastructure/kanban-visibility.helper.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-boards.repo.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts
apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-cards-confidential-flag-2026-07-13.sql
apps/api/src/shared/db/schema-kanban.ts

=== 7be29be0 feat(chat): 3-panel dizayn schema — work_status + chat_room_tags (design STEP 2)
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/chat-employee-panel-schema-2026-07-13.sql
apps/api/src/shared/db/schema-chat.ts
lib/db/src/schema/chat-schema.ts

=== 282dd34b feat(kanban): C1 seed 7-stage Buyurtmalar orders board
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-buyurtmalar-board-2026-07-13.sql

=== 854ee24e feat(kanban): C2 add progress/qoldiq-tolov/station-operator/comment-flag to cards
apps/api/src/modules/kanban/application/kanban-boards.service.ts
apps/api/src/modules/kanban/domain/repositories/i-kanban-boards.repo.ts
apps/api/src/modules/kanban/dto/kanban.dto.ts
apps/api/src/modules/kanban/infrastructure/repositories/kanban-cards.repo.ts
apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/kanban-cards-progress-station-flag-2026-07-13.sql
apps/api/src/shared/db/schema-kanban.ts

=== c14bc029 feat(kanban): C9 migrate overdue-escalation + recurring-cards cron to BullMQ
apps/api/src/cron/cron.module.ts
apps/api/src/cron/kanban-recurring.cron.ts
apps/api/src/modules/kanban/infrastructure/cron/kanban-cron.processor.ts
apps/api/src/modules/kanban/infrastructure/cron/kanban-overdue-escalation.cron.ts
apps/api/src/modules/kanban/kanban.module.ts
apps/api/src/modules/queue/queue.constants.ts

=== 35d21e2c feat(pp): A123 wire decoration_type taxonomy into technology_cards + AI-planning
apps/api/src/modules/pp/application/services/pp-ai-planning.service.ts
apps/api/src/modules/pp/technology/technology.controller.ts
apps/api/src/modules/pp/technology/technology.repository.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/technology-cards-decoration-type-2026-07-13.sql
lib/db/src/schema/pp/pp-enhanced.ts

=== cac951e5 feat(chat): delete-for-me + audit-channel immutability (Phase-2 #6/#7)
apps/api/src/modules/chat/chat-gateway-helper.service.ts
apps/api/src/modules/chat/chat-message.service.ts
apps/api/src/modules/chat/chat.gateway.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-message-base.repository.ts
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/migrations/chat-message-hidden-for-2026-07-13.sql
apps/api/src/shared/db/schema-chat.ts
artifacts/erp-dashboard/src/components/chat/page/ChatLayout.tsx
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx
artifacts/erp-dashboard/src/hooks/chat/useChatSocket.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/store/chatStore.ts
lib/db/src/schema/chat-schema.ts

=== 6750bb84 feat(taxonomy): C7 norm-time master-data via operation_type attrs.duration_minutes
apps/api/src/modules/admin/settings/taxonomy.dto.ts
apps/api/src/modules/admin/settings/taxonomy.service.ts
artifacts/erp-dashboard/src/pages/TaxonomyManager.tsx

=== bb45e9b3 feat(sd): A102 customer view-all/edit-own ownership gate
apps/api/src/generated/i18n.generated.ts
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/sd/application/sd-customers.service.ts
apps/api/src/modules/sd/common/sd-customer-scope.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo.ts
apps/api/src/modules/sd/presentation/sd-customers.controller.ts

=== 040753f9 feat(sd): A125 wire code_prefix taxonomy (KT/PT/E/GL) onto ow_molds
apps/api/src/modules/sd/application/sd-order-departments.service.ts
apps/api/src/modules/sd/orders/drizzle-sd-order-departments.repo.ts
apps/api/src/modules/sd/presentation/dto/sd-order-departments.dto.ts
apps/api/src/modules/sd/presentation/sd-order-departments.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/sd-ow-molds-code-prefix-2026-07-13.sql

=== b9553e88 fix(chat): retry idempotentligi — (room_id, client_msg_id) UNIQUE + ON CONFLICT
apps/api/src/modules/chat/repositories/chat-message-base.repository.ts
apps/api/src/shared/db/migrations/chat-client-msg-dedup-2026-07-13.sql

=== a7bc7651 feat(notifications): E5 converge NotificationCenter.tsx onto unified /api/notifications
artifacts/erp-dashboard/src/pages/NotificationCenter.tsx
artifacts/erp-dashboard/src/pages/__tests__/NotificationCenter.test.tsx

=== a66e840d fix(director): B13 dashboard plan-fact join uses org_departments (canonical)
apps/api/src/modules/director/application/coordination.service.ts
apps/api/src/modules/director/application/council-quorum.service.ts
apps/api/src/modules/director/director.module.ts
apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts
apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts
apps/api/src/modules/director/infrastructure/repositories/council-members.repository.ts
apps/api/src/modules/director/infrastructure/repositories/council-votes.repository.ts
apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts
apps/api/src/modules/director/presentation/coordination.controller.ts
apps/api/src/modules/director/presentation/council-members.controller.ts
apps/api/src/modules/director/presentation/dto/director.dto.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/council-quorum-override-2026-07-13.sql

=== f5dba662 feat(chat): offline queue — disconnected'da navbat + failed/retry holati
apps/api/src/modules/chat/chat-gateway-helper.service.ts
artifacts/erp-dashboard/src/components/chat/page/MessageBubble.tsx
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx
artifacts/erp-dashboard/src/hooks/chat/useChatSocket.ts
artifacts/erp-dashboard/src/locales/ru/common.json
artifacts/erp-dashboard/src/locales/uz-cyr/common.json
artifacts/erp-dashboard/src/locales/uz/common.json
artifacts/erp-dashboard/src/store/chatStore.ts

=== 7696ecea feat(chat): optimistik send + client_msg_id round-trip (messenger-feel)
apps/api/src/modules/chat/chat-gateway-helper.service.ts
apps/api/src/modules/chat/chat-message.service.ts
apps/api/src/modules/chat/chat.gateway.ts
apps/api/src/modules/chat/chat.service.ts
apps/api/src/modules/chat/repositories/chat-message-base.repository.ts
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx
artifacts/erp-dashboard/src/hooks/chat/useChatSocket.ts
artifacts/erp-dashboard/src/store/chatStore.ts

=== d05e0298 feat(chat): reconnect catch-up — uzilishda o'tkazib yuborilgan xabarlar tortiladi
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx

=== 33dfe1a1 fix(chat): reconnect siyosati — cheksiz urinish + eksponensial backoff
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx

=== 86239eff fix(chat): WS soket auth-drift tuzatildi (P0 — realtime ulanmasdi)
artifacts/erp-dashboard/src/hooks/chat/ChatSocketProvider.tsx

=== 6d5a40b1 feat(lms): #30 sertifikat yuridik-minimal maydonlari (issued_ip + SHA-256 cert_hash)
apps/api/src/modules/lms/application/commands/issue-certificate.handler.ts
apps/api/src/modules/lms/application/services/lms-certificates-standalone.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-cert.repo.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-courses-extended.repo.ts
apps/api/src/modules/lms/presentation/lms-certificates-standalone.controller.ts
apps/api/src/modules/lms/presentation/lms-certificates.controller.ts
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/lms-certificate-legal-fields-2026-07-11.sql

=== b225479e feat(pos): #17/#117 favqulodda chiqim is_unplanned+sabab majburiy+Telegram push
apps/api/src/i18n/ru/validation.json
apps/api/src/i18n/uz-cyr/validation.json
apps/api/src/i18n/uz/validation.json
apps/api/src/modules/pos/application/event-handlers/pos.events.ts
apps/api/src/modules/pos/application/services/pos-movement.service.ts
apps/api/src/modules/pos/domain/events/pos.events.types.ts
apps/api/src/modules/pos/dto/movement.dto.ts
apps/api/src/shared/db/migrations/pos-movements-unplanned-issue-2026-07-11.sql
lib/db/src/schema/pos-schema-v2.ts

=== c47a330f feat(sd): #24 qisman-yetkazish invoice_type (full/partial) hisoblanadi
apps/api/src/modules/sd/application/commands/create-invoice.handler.ts
apps/api/src/modules/sd/invoices/drizzle-sd-invoices.repo.ts
apps/api/src/modules/sd/invoices/i-sd-invoices.repo.ts
apps/api/src/shared/db/migrations/sd-06-item24-invoice-type-2026-07-11.sql
apps/api/src/shared/db/schema-finance-invoicing.ts

=== 47ccb174 feat(crm): #5 KP (taklifnoma) email-pixel ko'rish tracking (viewed_at)
apps/api/src/modules/crm/application/crm-bitrix-compat.service.ts
apps/api/src/modules/crm/domain/repositories/i-crm-bitrix-compat.repo.ts
apps/api/src/modules/crm/infrastructure/repositories/crm-bitrix-compat-proposals.repository.ts
apps/api/src/modules/crm/infrastructure/repositories/crm-bitrix-compat.repository.ts
apps/api/src/modules/crm/presentation/crm-bitrix-compat.controller.ts
apps/api/src/shared/db/migrations/crm-proposals-viewed-at-2026-07-11.sql
apps/api/src/shared/db/schema-business-b-2.ts

=== 363cf909 feat(mm): 11.25 PO uchun Incoterms/yetkazish shartlari (delivery_terms) qo'shildi
apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts
apps/api/src/modules/mm/domain/aggregates/purchase-order.aggregate.ts
apps/api/src/modules/mm/dto/mm.dto.ts
apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm.repo.ts
apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts
apps/api/src/shared/db/migrations/mm-11-po-delivery-terms-2026-07-11.sql
apps/api/src/shared/db/schema-business-b-1.ts

=== 978ae170 feat(notifications): #88 sender_id (yuboruvchi) ustuni qo'shildi
apps/api/src/modules/notifications/application/commands/create-notification.command.ts
apps/api/src/modules/notifications/application/commands/create-notification.handler.ts
apps/api/src/modules/notifications/domain/aggregates/notification.aggregate.ts
apps/api/src/modules/notifications/infrastructure/repositories/drizzle-notification.repo.ts
apps/api/src/modules/notifications/presentation/notifications.controller.ts
apps/api/src/shared/db/migrations/notifications-sender-id-2026-07-11.sql
apps/api/src/shared/db/schema-compat-3.ts

=== 3d500908 feat(crm): #80 lid hududi (region) va eksport/ichki belgisi qo'shildi
apps/api/src/modules/crm/leads/drizzle-crm-leads.repo.ts
apps/api/src/modules/crm/presentation/crm-leads.controller.ts
apps/api/src/shared/db/invariants/migrations-crm.ts
apps/api/src/shared/db/migrations/crm-leads-region-export-2026-07-11.sql
apps/api/src/shared/db/schema-compat-1a.ts

=== cd412d3a feat(marketing): #20 promo-kod CRUD (default 1 mijoz/1 kampaniya limiti)
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/marketing/marketing.module.ts
apps/api/src/modules/marketing/presentation/promo-codes.controller.ts
apps/api/src/modules/marketing/promo-codes/promo-codes.repository.ts
apps/api/src/modules/marketing/promo-codes/promo-codes.service.ts
apps/api/src/shared/db/migrations/marketing-promo-codes-2026-07-11.sql

=== ef9f43a1 feat(marketing): #96 STIR/shartnoma/manzil rekvizit to'liqlik darvozasi (CRM'ga o'tishdan oldin)
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/marketing/leads/leads.repository.ts
apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts
apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts
apps/api/src/shared/db/migrations/marketing-leads-add-requisites.sql

=== 9599b862 feat(pos): #26 EXTERNAL_OUT chiqimda mijoz kredit-limiti real-time tekshiriladi
apps/api/src/i18n/ru/errors.json
apps/api/src/i18n/uz-cyr/errors.json
apps/api/src/i18n/uz/errors.json
apps/api/src/modules/pos/application/services/pos-movement.service.ts
apps/api/src/modules/pos/domain/repositories/i-pos-movement.repo.ts
apps/api/src/modules/pos/dto/movement.dto.ts
apps/api/src/modules/pos/infrastructure/repositories/pos-movement.repository.ts

=== 086fb5db feat(pos): #131 yuk topshirish nizo holati (DISPUTED) qo'shildi
apps/api/src/modules/pos/application/services/pos-movement-status.service.ts
apps/api/src/modules/pos/application/services/stock-ledger.service.ts
apps/api/src/modules/pos/dto/movement.dto.ts
apps/api/src/shared/db/migrations/item131-pos-handover-dispute-2026-07-11.sql
lib/db/src/schema/pos-schema-extensions.ts

=== e2545e97 feat(sd): #120+#133 mijoz uchun to'lov turi va qadoqlash usuli qo'shildi
apps/api/src/modules/sd/dto/sd.dto.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo.ts
apps/api/src/modules/sd/presentation/sd-customers.controller.ts
apps/api/src/modules/sd/presentation/sd-customers.schemas.ts
apps/api/src/shared/db/migrations/item120-sd-customers-default-payment-type-2026-07-11.sql
apps/api/src/shared/db/migrations/sd-customers-packaging-method-2026-07-11.sql
lib/db/src/schema/sd-europrint-schema.ts

=== 5599aefe feat(sd): #12 100%-avans chegirmasi (business_settings CRUD) qo'shildi
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/item12-sd-full-advance-discount-2026-07-11.sql

=== 1909ba47 feat(crm): #59/#67 lead mahsulot turi (ofset/gofra/etiketka/flekso/blanka) qo'shildi
apps/api/src/modules/crm/leads/drizzle-crm-leads.repo.ts
apps/api/src/modules/crm/presentation/crm-leads.controller.ts
apps/api/src/shared/db/migrations/crm-leads-product-type-2026-07-11.sql
apps/api/src/shared/db/schema-compat-1a.ts

=== 02cc4a70 feat(mm): 11.44 vendor QQS to'lovchi (is_vat_payer) bayrog'i qo'shildi
apps/api/src/modules/mm/dto/mm.dto.ts
apps/api/src/modules/mm/infrastructure/repositories/mm-vendors-pr.repository.ts
apps/api/src/shared/db/invariants/migrations-drift.ts
apps/api/src/shared/db/migrations/mm-vendors-vat-payer-2026-07-11.sql
apps/api/src/shared/db/schema-misc-qc.ts

=== 5e32af91 feat(notifications): #112 bildirishnomalar priority bo'yicha saralanadi
apps/api/src/modules/notifications/infrastructure/repositories/drizzle-notification.repo.ts
apps/api/src/shared/db/migrations/notifications-priority-column-2026-07-11.sql
apps/api/src/shared/db/schema-compat-3.ts

=== d2098c77 feat(kanban): A17 bekor qilingan kartalar KPI'da neytral hisoblanadi
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo.ts

=== 21a335e3 feat(notifications): #111 type/priority->icon xaritalash birlashtirildi
apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts
apps/api/src/modules/notifications/notification-icon.util.ts

=== e87ae0e9 feat(kanban): A39 karta-egasi reyting formulasi (achievement*0.7-escalation*0.3)
apps/api/src/common/constants/business.constants.ts
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo.ts

=== 3a5a3743 feat(pos): #49 pos_movements.mes_session_id FK production_sessions'ga qo'shildi
apps/api/src/shared/db/invariants/migrations-schema.ts
apps/api/src/shared/db/migrations/pos-49-mes-session-id-fk-2026-07-11.sql

=== ea8232e7 feat(iot): #60 pereedelka (rework) brak sabab kodi seed qilindi (DEF-U-005)
apps/api/src/shared/db/migrations/qc-defect-catalog-rework-seed-2026-07-11.sql

=== 7535e2ae feat(kanban): C27 vizyon 3-daraja ustuvorlik nomlash qo'shildi (Shoshilinch/Oddiy/Past)
apps/api/src/modules/kanban/domain/kanban-priority.ts

=== 940d8f8c feat(mm): 11.59 'conditional' status goods receipt uchun qo'shildi
apps/api/src/modules/mm/dto/mm.dto.ts

=== e729f18f fix(notifications): 18-notif KRITIK - Telegram userId chat_id sifatida yuborilardi, hech qachon yetmasdi
apps/api/src/modules/notifications/application/commands/create-notification.handler.ts

=== efd89722 feat(sd): 06-sd#35 QC_HOLD holati - QC rad etilsa bog'liq sotuv buyurtmasi ushlab turiladi
apps/api/src/modules/sd/infrastructure/event-handlers/qc-failed-sd.listener.ts
apps/api/src/modules/sd/sd.module.ts

=== 380f25f8 feat(cc): 20-cc#5/#10/#47/#89/#31 ai_draft, eskirgan-flag, ko'rish-belgisi, sabab-havola, rahbar-xulosa
apps/api/src/modules/communication-center/application/cc-ai-interview.service.ts
apps/api/src/modules/communication-center/application/cc-workflow.service.ts
apps/api/src/modules/communication-center/application/cc-workflow.types.ts
apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-approve.helpers.ts
apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-reject-resubmit.helpers.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/cc-documents-write.repo.ts
apps/api/src/modules/communication-center/infrastructure/repositories/cc-documents/types.ts
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts
apps/api/src/shared/db/migrations/cc-batch2-columns-2026-07-11.sql

=== dca6949f feat(cc): 20-cc#11 bola-hujjat faqat ota tasdiqlangan/jarayonda bo'lsa yaratiladi
apps/api/src/modules/communication-center/application/cc-workflow.service.ts

=== a4cc8b85 feat(admin): SD/PP threshold qiymatlar business_settings CRUD'ga (jarima%, margin floor, kichik-tiraj)
apps/api/src/shared/db/migrations/business-settings-thresholds-2026-07-11.sql

=== cd940c4d fix(cc): 20-cc#30 48h avto-rad etish olib tashlandi, 24h takroriy eslatma qo'shildi
apps/api/src/modules/communication-center/cron/cc-sla.cron.ts
apps/api/src/shared/db/migrations/cc-overdue-reminder-2026-07-11.sql

=== 31fbc7df fix(cc): 20-cc#39 GET /cc/documents/:id xavfsizlik teshigi - ownership tekshiruv yo'q edi
apps/api/src/modules/communication-center/presentation/cc-documents.controller.ts

=== 9bdd5817 fix(wms): 10-wms#31 poddon birlik soni butun bo'lishi kerak
apps/api/src/modules/wms/presentation/material-life.controller.ts
apps/api/src/shared/db/migrations/wms-pallet-qty-integer-2026-07-11.sql

=== ae957e6d feat(cc): prikaz kategoriya+kuchga-kirish, dokla turi+SLA+papka, council COI
apps/api/src/shared/db/migrations/cc-clean-additive-2026-07-11.sql
apps/api/src/shared/db/schema-business-a-2.ts

=== a7a5fb04 feat(mes): DT-MOLD seed, gofra qatlam+m2 ustunlari, OEE-target FE ulanishi
apps/api/src/shared/db/migrations/mes-downtime-mold-2026-07-11.sql
apps/api/src/shared/db/migrations/mes-gofra-layer-2026-07-11.sql
apps/api/src/shared/db/schema-compat-4.ts
artifacts/erp-dashboard/src/pages/MESExtended.tsx

=== 8c209037 fix(org): tahrirlashda 'sabab' yo'qligi + rbac/smena parity AddNodeDialog bilan
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx

=== c82e6366 fix(org): RBAC avtomatik hint, smena-turi CRUD, karta papkasiga haqiqiy fayl yuklash
apps/api/src/modules/hr/presentation/hr-shifts-compat.controller.ts
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/FolderTab.tsx
artifacts/erp-dashboard/src/pages/ShiftTypesConfig.tsx

=== 82456757 fix(org): karta yaratishda 4 kamchilik - rang, otdeleniyeNo, smena-preset, mobil grid
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx

=== 4deb21d2 fix(org): karta yaratishda 422 — reason-gate faqat PATCH uchun
apps/api/src/modules/org-structure/org-structure.controller.ts

=== d39ec98a fix(org): remove duplicate 'Sektor' label, wire Vysotskiy-7 tiers into head-bearing + stats
apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts
apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts
artifacts/erp-dashboard/src/components/hr/org/__tests__/nodeTypeLabels.test.ts
artifacts/erp-dashboard/src/components/hr/org/types.ts
artifacts/erp-dashboard/src/components/hr/orgnode/types.ts

=== 73e2d33d docs(audit): full company-data reset 2026-07-11
docs/audit/FULL-COMPANY-RESET-2026-07-11.md

=== 64524505 docs(owner): 5 taxonomies finalized + legal + global principle; ⚠️ org-delete verification flag
docs/audit/QARORLAR-JURNALI-2026-07-11.md

=== 6d27e557 feat(admin): seed contact/direction/operation taxonomy (15 more entries, owner 2026-07-11)
apps/api/src/shared/db/migrations/taxonomy-seed2-2026-07-11.sql

=== ef838119 docs(schema-wave): SD 16/30 landed + migrations applied; 14 sd-quotations cluster casualties for regen
docs/audit/_SCHEMA-HARVEST-PROGRESS-2026-07-11.md

=== 9ad0c5bb feat(sd): optional legacy 1C 'Zakaz 1S' order number (06-sd#154)
apps/api/src/modules/sd/application/sd-legacy-order.service.ts
apps/api/src/modules/sd/orders/sd-legacy-order.repository.ts
apps/api/src/modules/sd/presentation/sd-legacy-order.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/sd-sales-orders-legacy-order-number-2026-07-11.sql

=== e9636c9e feat(sd): gofra layer count 2/3/5-sloy + non-blocking load hint (06-sd#147)
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-quotations.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/sd-layer-count-2026-07-11.sql

=== 3f3272cb feat(sd): two-sided print (bez/s oborotom) 2x factor on print cost — 06-sd#145
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/sd-quotation-items-print-sides-2026-07-11.sql

=== b19926fd feat(sd): 06-sd#142 kashirovka alohida operatsiya + narx
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/domain/repositories/i-quotation.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/item142-sd-kashirovka-2026-07-11.sql

=== dc312a31 feat(sd): roll self-adhesive parameters on quotation items (06-sd#118)
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-quotations.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/sd118-quotation-items-roll-params-2026-07-11.sql

=== 29144337 feat(sd): load capacity kg + non-blocking flute/layer rec (06-sd#107)
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-quotations.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts
apps/api/src/shared/db/migrations/sd-load-capacity-flute-layer-2026-07-11.sql

=== 9126e2cd feat(sd): machine format (72/52SM/KVA) catalog + per-line select — 06-sd#102
apps/api/src/modules/sd/application/sd-machine-format.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-machine-format.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-machine-format.repo.ts
apps/api/src/modules/sd/presentation/sd-machine-format.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/item102-sd-machine-format-2026-07-11.sql

=== ecd65203 feat(sd): printing method offset/flexo + rule-based AI rec (06-sd#101)
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/presentation/dto/sd-quotations.dto.ts
apps/api/src/shared/db/migrations/sd-quotation-items-printing-method-2026-07-11.sql

=== 2c2147f3 feat(sd): Ожд.Сырьё pending_material status + Ta'minot material signal (06-sd#100)
apps/api/src/modules/sd/application/commands/signal-pending-material.handler.ts
apps/api/src/modules/sd/domain/aggregates/sales-order-transitions.constants.ts
apps/api/src/modules/sd/domain/repositories/i-sales-order.repo.ts
apps/api/src/modules/sd/domain/value-objects/so-status.vo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts
apps/api/src/modules/sd/presentation/dto/material-signal.dto.ts
apps/api/src/modules/sd/presentation/sd-orders.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/sd-100-pending-material-signal-2026-07-11.sql

=== 07d94984 feat(sd): structured contract terms (payment/penalty/penya/currency) on sd_contracts — 06-sd#78
apps/api/src/modules/sd/infrastructure/repositories/sd-contract-terms.repo.ts
apps/api/src/modules/sd/presentation/sd-contracts.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/sd-contract-terms-2026-07-11.sql

=== 2060a140 feat(sd): kashirovka offset+gofra predecessor sync + MES can-start gate
apps/api/src/modules/sd/application/sd-order-sync.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-order-sync.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-order-sync.repo.ts
apps/api/src/modules/sd/presentation/sd-order-sync.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/sd-order-predecessor-sync-2026-07-11.sql

=== e989152c feat(sd): per-line deadline scheduling (line_deadline + per_line_scheduling)
apps/api/src/modules/sd/application/sd-line-deadline.service.ts
apps/api/src/modules/sd/domain/repositories/i-sd-line-deadline.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-line-deadline.repo.ts
apps/api/src/modules/sd/presentation/sd-line-deadline.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/item29-sd-per-line-deadline-2026-07-11.sql

=== b87b8819 feat(sd): nightly inactive-customer cron (crm_inactivity_rules A=90/B=60/C=30)
apps/api/src/cron/cron.module.ts
apps/api/src/cron/customer-inactivity.cron.ts
apps/api/src/modules/sd/application/customer-inactivity.service.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-customer-inactivity.repo.ts
apps/api/src/modules/sd/presentation/sd-customer-inactivity.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/item27-sd-inactive-customer-cron-2026-07-11.sql

=== da4cab62 feat(sd): shared forma (die_code) auto-detect + warning
apps/api/src/modules/sd/application/sd-order-departments.service.ts
apps/api/src/modules/sd/orders/drizzle-sd-order-departments.repo.ts
apps/api/src/modules/sd/presentation/dto/sd-order-departments.dto.ts
apps/api/src/modules/sd/presentation/sd-order-departments.controller.ts
apps/api/src/shared/db/migrations/sd-ow-molds-die-code-18-2026-07-11.sql

=== 3d6be023 feat(sd): klishe/forma ~3yr retention cron + write-off act (06-sd#14)
apps/api/src/modules/sd/application/klishe-retention.service.ts
apps/api/src/modules/sd/cron/klishe-retention.cron.ts
apps/api/src/modules/sd/domain/repositories/i-klishe-retention.repo.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-klishe-retention.repo.ts
apps/api/src/modules/sd/presentation/sd-klishe-retention.controller.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/shared/db/migrations/ow-molds-klishe-retention.sql

=== 7681905b feat(sd): material-wait MM-reject/24h->48h escalation (06-sd#2)
apps/api/src/cron/cron.module.ts
apps/api/src/cron/sd-material-wait-escalation.cron.ts
apps/api/src/modules/sd/application/sd-material-wait-escalation.service.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-material-wait-escalation.repo.ts
apps/api/src/shared/db/migrations/sd-material-wait-escalation-2026-07-11.sql

=== 1920cb2a docs(owner): append taxonomy content + GL rules + credentials resolutions (2026-07-11)
docs/audit/QARORLAR-JURNALI-2026-07-11.md

=== 0ad6f154 feat(fe): add kanban/notification/org-policy/manager-note categories to taxonomy dropdown
artifacts/erp-dashboard/src/pages/TaxonomyManager.tsx

=== de4004d8 feat(admin): seed 81 taxonomy entries from owner's confirmed §2 lists
apps/api/src/shared/db/migrations/taxonomy-seed-2026-07-11.sql

=== 7ec31c9e docs(schema-wave): BATCH-1 COMPLETE 39/39 (pp124+mes33 landed); flag migrations-not-applied
docs/audit/_SCHEMA-HARVEST-PROGRESS-2026-07-11.md

=== 5bf6e6fd feat(mes): exclude academy/training sessions from OEE + LMS-sync flag
apps/api/src/modules/mes/application/mes-production-sessions.service.ts
apps/api/src/modules/mes/application/queries/get-oee.handler.ts
apps/api/src/modules/mes/dto/mes.dto.ts
apps/api/src/modules/mes/infrastructure/repositories/mes-production-sessions.repo.ts
apps/api/src/modules/mes/presentation/mes-production-sessions.controller.ts
apps/api/src/shared/db/migrations/mes33-production-sessions-is-training.sql
apps/api/src/shared/db/schema-compat-4.ts
lib/db/src/schema/mes-schema.ts

=== 2cb0c620 feat(pp): multi-line order — production_order_lines child (each position own route)
apps/api/src/modules/pp/pp.module.ts
apps/api/src/modules/pp/production-order-lines/drizzle-pp-production-order-lines.repo.ts
apps/api/src/modules/pp/production-order-lines/i-pp-production-order-lines.repo.ts
apps/api/src/modules/pp/production-order-lines/pp-production-order-lines.controller.ts
apps/api/src/modules/pp/production-order-lines/pp-production-order-lines.service.ts
apps/api/src/shared/db/migrations/pp-production-order-lines-2026-07-11.sql
lib/db/src/schema/pp/pp-production.ts

=== 783c76b3 feat(fe): taxonomy manager screen (/admin/taxonomy)
artifacts/erp-dashboard/src/pages/TaxonomyManager.tsx
artifacts/erp-dashboard/src/routes/AdminRoutes.tsx

=== 5862380a feat(admin): generic taxonomy_entries CRUD — §2 named-list registry (product types, discount, decoration…)
apps/api/src/modules/admin/admin.module.ts
apps/api/src/modules/admin/settings/taxonomy.controller.ts
apps/api/src/modules/admin/settings/taxonomy.dto.ts
apps/api/src/modules/admin/settings/taxonomy.repo.ts
apps/api/src/modules/admin/settings/taxonomy.service.ts
apps/api/src/shared/db/migrations/taxonomy-entries-2026-07-11.sql

=== 9a9fb98b docs(owner): 2026-07-11 decision journal — architecture/strategic/finance/RBAC/workflow answers
docs/audit/QARORLAR-JURNALI-2026-07-11.md

=== eba8342a feat(admin): seed 53 §1 business_settings keys — owner fills values via CRUD screen
apps/api/src/shared/db/migrations/business-settings-s1-keys-2026-07-11.sql

=== db0f0fe3 feat(shared): getBusinessSettingNumber/Text reader — cross-module settings reads (no hardcode)
apps/api/src/shared/config/business-settings.reader.ts

=== 121a141b feat(fe): business-settings management screen (/admin/business-settings)
artifacts/erp-dashboard/src/pages/BusinessSettings.tsx
artifacts/erp-dashboard/src/routes/AdminRoutes.tsx

=== c7a4fcfb feat(admin): global business_settings CRUD — no-hardcode threshold/norma/%/day/amount registry
apps/api/src/modules/admin/admin.module.ts
apps/api/src/modules/admin/settings/business-settings.controller.ts
apps/api/src/modules/admin/settings/business-settings.dto.ts
apps/api/src/modules/admin/settings/business-settings.repo.ts
apps/api/src/modules/admin/settings/business-settings.service.ts
apps/api/src/shared/db/migrations/business-settings-2026-07-11.sql

=== eb6c24bb docs(owner): record 2026-07-11 owner answers — global CRUD rule + 10-section triage
docs/audit/OWNER-JAVOBLAR-2026-07-11.md

```
