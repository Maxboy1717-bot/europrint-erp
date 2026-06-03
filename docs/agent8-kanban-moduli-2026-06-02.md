# AGENT8 — KANBAN MODULI CHUQUR TAHLIL (2026-06-02)

> **FAQAT TAHLIL — read-only.** Hech narsa o'zgartirilmadi. Har da'vo kod (fayl:satr) + jonli DB
> (`europrint`@127.0.0.1:5432, `node _audit/q.cjs`) bilan tasdiqlandi. Brauzer ishlatilmadi —
> UI holati uchun mavjud `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md` (brauzer Super Admin
> sessiyasi, D bo'lim) hisobotiga tayanildi va kod bilan kengaytirildi.

Vizyon (egasi): **Bitrix24 uslubidagi Kanban** — kommunikatsiya + vazifa + ombor-so'rov karta bo'lib
tushadi; maxfiylik (org-sxema + super_admin sozlaydi); tasdiq zanjiri; CC↔karta bog'lanish.

---

## 0. QISQA HUKM

**Kanban dvigatel sifatida ISHLAYDI (~55%)**, lekin egasi vizyonining yuragi (Bitrix24-uslub
maxfiylik + chinakam tasdiq zanjiri + CC→karta oqimi) **yo'q yoki soxta**. Aniq:
- ✅ Doska/ustun/karta CRUD, 8 ko'rinish, drag-drop, checklist/izoh/fayl/natija/vaqt/teg/kuzatuvchi/hamijrochi — hammasi **real DB** (raw SQL + Drizzle, Result pattern).
- ❌ **3-Savat (ThreeBasketsPanel) — 100% MOCK** (hardcoded 5 karta, `useState`, hech qanday API).
- ❌ **Maxfiylik (rol-asosli/org-sxema) — YO'Q.** `getBoards()` user/rol filtri qabul qilmaydi; FE `roleFilter` Select bor lekin **hech qachon qo'llanmaydi** (dead UI). Har kim hamma doskani ko'radi.
- ⚠️ **Tasdiq zanjiri — primitiv 2-bosqich** (accept→complete + egaga bildirishnoma). Bitrix24-uslub ko'p-bosqichli (reviewer/rad etish/qayta yuborish) **emas**.
- ⚠️ **Kommunikatsiya→karta — qisman.** SD buyurtma→avto-karta (OrderCreatedEvent) ✅; karta-chat xabaridan→bola-karta ✅; lekin **CC (`cc_documents`)→kanban to'g'ridan-to'g'ri bog'lanish YO'Q**.
- ❌ Doska/karta **test-axlat** bilan to'la (ustun: "as/salom/SADSD/savol/1231322"; karta: "Salom/Nima"; natija: "ghghgh").
- ⚠️ "Vazifa ichidagi tab muammosi": 5 tab (Asosiy/Checklist/Natijalar/Fayllar/Izohlar) — hammasi real, lekin **fayl-yuklash 3 ta tabda buzuq** (FE FormData yubormaydi + chat-fayl endpoint `notImplemented`); `Loyihalar` dropdown bo'sh (`GET /kanban/projects` = 501).

---

## 1. DB JADVALLAR — 23 ta `kanban_*` (qator soni bilan)

`node _audit/q.cjs` bilan har biri sanaldi:

| # | Jadval | Qator | Holat |
|---|---|---|---|
| 1 | `kanban_boards` | **2** | ✅ FAOL (Salom, EUROPRINT — ikkalasi test) |
| 2 | `kanban_columns` | **10** | ✅ FAOL (hammasi test-axlat nom) |
| 3 | `kanban_cards` | **2** | ✅ FAOL (Salom, Nima — test) |
| 4 | `kanban_tasks` | **0** | ❌ O'LIK DUBLIKAT (eski dizayn: assigned_to/status/tags ustunlari; faol kod `kanban_cards`dan foydalanadi) |
| 5 | `kanban_checklists` | **0** | ✅ FAOL jadval (kod `position` ustunidan o'qiydi) |
| 6 | `kanban_checklist_items` | **0** | ✅ FAOL jadval |
| 7 | `kanban_card_checklists` | **0** | ❌ O'LIK DUBLIKAT (`order_index`/`is_done` ustunli; kod tegmaydi) |
| 8 | `kanban_card_checklist_items` | **0** | ❌ O'LIK DUBLIKAT |
| 9 | `kanban_card_comments` | **0** | ✅ FAOL (cards repo `kanbanCardComments`ga insert qiladi) |
| 10 | `kanban_comments` | **0** | ❌ O'LIK DUBLIKAT (kod tegmaydi) |
| 11 | `kanban_card_tags` | **0** | ✅ FAOL (junction: card_id↔tag_id) |
| 12 | `kanban_tags` | **0** | ✅ FAOL (teg lug'ati) |
| 13 | `kanban_card_watchers` | **0** | ✅ FAOL (cards repo insert) |
| 14 | `kanban_observers` | **4** | ✅ FAOL (engagement repo insert; "kuzatuvchi") |
| 15 | `kanban_co_executors` | **4** | ✅ FAOL ("hamijrochi") |
| 16 | `kanban_files` | **1** | ✅ FAOL (rivojlanish yakuniy.docx — real upload disk+DB) |
| 17 | `kanban_results` | **1** | ✅ FAOL (natija "ghghgh" — test) |
| 18 | `kanban_result_files` | **0** | ✅ FAOL jadval |
| 19 | `kanban_notifications` | **1** | ✅ FAOL ("Salom qabul qilindi") |
| 20 | `kanban_time_tracks` | **47** | ✅ FAOL+eng band (vaqt kuzatuvi) |
| 21 | `kanban_flows` | **0** | ⚠️ FAOL kod, ishlatilmagan |
| 22 | `kanban_robots` | **0** | ⚠️ FAOL kod (robot avtomatlashtirish), ishlatilmagan |
| 23 | `kanban_templates` | **0** | ⚠️ FAOL kod, ishlatilmagan |

**Jami qatorlar: ~76** (asosan `kanban_time_tracks=47` + observ/co-exec 8 + boards/cols/cards 14).
**O'lik dublikat jadvallar (4):** `kanban_tasks`, `kanban_card_checklists`, `kanban_card_checklist_items`, `kanban_comments` — faol kod ulardan foydalanmaydi (memory `session_2026-05-21_*` da qayd etilgan duplikat naqshining bir qismi).

> **Watcher/Observer ikkilanishi:** kod ikkala `kanban_card_watchers` (cards repo) VA `kanban_observers` (engagement repo) ga yozadi — "Kuzatuvchi" FE'da `observers` endpointidan o'qiydi (`kanban_observers`). `kanban_card_watchers` deyarli parallel/dead.

---

## 2. BACKEND — 7 controller, ~60 endpoint (REAL/STUB)

Modul: `apps/api/src/modules/kanban/`. `kanban.module.ts` da 7 controller ro'yxatdan o'tgan
(satr 55-63): `KanbanBoardsController, KanbanController, KanbanCoreController, KanbanReportsController,
KanbanCardsController, KanbanCardFilesController, KanbanChecklistController`. Hammasi
`@UseGuards(JwtAuthGuard[, RolesGuard])` + `@Roles(...)` bilan himoyalangan (guardsiz endpoint YO'Q ✅).

### ✅ ISHLAYDI (real DB)
| Endpoint guruh | Fayl:satr | Dalil |
|---|---|---|
| Boards CRUD (GET/POST/PUT/DELETE) | `kanban-boards.controller.ts:51-75`, `kanban-core.controller.ts:114-128` | `KanbanBoardsService`→`KanbanBoardsRepository` real Drizzle |
| Columns CRUD | `kanban-boards.controller.ts:79-108` | `addColumn` maxOrder hisoblab insert (`kanban-boards.service.ts:50-67`) |
| Cards CRUD + move | `kanban-boards.controller.ts:112-141` | `moveCard` robot-trigger bilan (`kanban-boards.service.ts:102-129`) |
| Card chat (GET/POST) | `kanban-cards.controller.ts:159-177` | `kanban_card_comments` insert (`drizzle-kanban-cards.repo.ts:133`) |
| Tags (GET/POST/DELETE) | `kanban-cards.controller.ts:194-218` | `kanban_tags`+`kanban_card_tags` junction (`...engagement-time-tags.repo.ts:75-124`) |
| Observers (GET/POST/DELETE) | `kanban-cards.controller.ts:222-242` | `kanban_observers` (`...engagement.repo.ts:40-64`) — **4 jonli qator** |
| Co-executors (GET/POST/DELETE) | `kanban-cards.controller.ts:246-266` | `kanban_co_executors` — **4 jonli qator** |
| Accept / Complete | `kanban-cards.controller.ts:131-155` | `accepted_at`/`completed_at` UPDATE + egaga notif (`drizzle-kanban-cards.repo.ts:195-246`) |
| Checklists + items + toggle | `kanban-checklist.controller.ts` (+ cards repo) | `kanban_checklists`/`_items` Drizzle (`drizzle-kanban-cards.repo.ts:33-101`) |
| Results + result-files | `kanban-card-files.controller.ts:46-122` | `kanban_results`/`_files` — **1 jonli natija** |
| Card-files upload/serve/delete | `kanban-card-files.controller.ts:126-181` | multipart→disk `uploads/kanban/:id/` + DB (`createFile`) — **1 jonli fayl** |
| Time-tracking start/stop/list | `kanban-card-files.controller.ts:185-213` | `kanban_time_tracks` — **47 jonli qator** |
| Notifications (count/list/read/read-all) | `kanban-boards.controller.ts:153-194` | `kanban_notifications` — **1 jonli** |
| Reports (employee-perf/productivity/overdue/analytics/task-stats/team-metrics/overdue-inbox) | `kanban-reports.controller.ts:52-228` | `drizzle-kanban-stats.repo.ts` real `FROM kanban_cards` agregatsiya (satr 22-256) |
| Report export (Excel+PDF) | `kanban-reports.controller.ts:76-204` | ExcelJS + pdfmake real generatsiya |
| Flows CRUD | `kanban-core.controller.ts:46-86` | `kanban_flows` real (jonli 0 — ishlatilmagan) |
| Robots CRUD + onCardMoved/Created trigger | `kanban-core.controller.ts:90-110` + `kanban-robot.service.ts` | `kanban_robots` real (jonli 0) |
| Templates CRUD + apply | `kanban-boards.controller.ts:198-271` | `kanban_templates` real; apply→ustun yaratadi |
| Employees (karta tayinlash uchun) | `kanban-boards.controller.ts:145-149` | `extSvc.getEmployees()` real |

### ❌ STUB / QISMAN (3 ta haqiqiy stub)
| Endpoint | Fayl:satr | Muammo |
|---|---|---|
| `PATCH /kanban/:id/assign` | `kanban-cards.controller.ts:122-129` | **STUB** — `return { id, assignedTo, updated: true }`, **DB ga YOZMAYDI**. (Real tayinlash `updateCard` orqali `owner_user_id`'ga bo'ladi; bu endpoint soxta.) |
| `GET/POST /kanban/chat-messages/:id/files` | `kanban-cards.controller.ts:179-190` | **STUB** — `notImplemented(...)`. Chat xabariga fayl biriktirib bo'lmaydi. FE shu yerga POST qiladi (`useTaskDetailMutations.ts:84`) → 501. |
| `GET /kanban/projects` | `kanban-reports.controller.ts:233-237` | **STUB** — `notImplemented(...)`. TaskDetailSheet "Loyiha bog'lash" dropdowni shu yerdan o'qiydi (`TaskDetailSheet.tsx:101-103`) → bo'sh. |

> **CLAUDE.md Qoida 13 buzilishi (kosmetik):** `drizzle-kanban-ext.repo.ts` = 964 satr (>900) — bo'linishi kerak (CLAUDE.md o'zida qayd etilgan).

---

## 3. FRONTEND — `/kanban` sahifa + ko'rinishlar

Asosiy: `artifacts/erp-dashboard/src/pages/KanbanBoard.tsx` → `useKanbanBoard()` hook
(`hooks/useKanbanBoard.ts`).

### Ko'rinishlar (8 ta) — `KanbanViewTabs.tsx:15-24`
`kanban` (Doska) · `list` (Ro'yxat) · `deadlines` (Muddatlar) · `myPlan` (Mening rejam) ·
`calendar` (Kalendar) · `gantt` (Gant) · `dashboard` (Dashboard) · `allocation` (Resurslar).
Har biri alohida komponent (`pages/kanban/*View.tsx`, `DashboardPanel.tsx`, `ResourceAllocationView.tsx`).
Barchasi `boardData.cards`/`columns`'dan render qiladi (real DB orqali) ✅.

### Doska kim yaratadi? — `BoardHeader.tsx`
"Yangi doska" tugmasi bor. Egasi vizyoni "faqat super_admin sozlaydi" — lekin **backend
`POST /kanban/boards` `@Roles('admin','manager','supervisor','operator','employee','viewer','director')`**
(`kanban-boards.controller.ts:38`), ya'ni **deyarli har kim doska yarata oladi**. super_admin-cheklov YO'Q.

### Karta — real DB ✅ lekin TEST-AXLAT bilan to'la
Jonli kartalar: id=1 "Salom" (owner 44, high), id=2 "Nima" (urgent, accepted+completed).
Ustunlar: "as", "salom", "sALOM", "SADSD", "SDSD", "SALOM" (board 1) / "Birinchi bosqich", "Salom",
"savol", "1231322" (board 2). Natija: "ghghgh". **Bu egasi shikoyat qilgan "1231322/Salom/savol"
axlatni AYNAN tasdiqlaydi.**

---

## 4. 3-SAVAT (ThreeBasketsPanel.tsx) — 100% MOCK ❌ (KRITIK)

Fayl: `artifacts/erp-dashboard/src/components/kanban/ThreeBasketsPanel.tsx`.

**DALIL (satr 50-56):**
```ts
const INITIAL_ITEMS: BasketItem[] = [
  { id: 1, subject: "Yangi shartnoma loyhasi",   from: "Sardor T.",  time: "09:15", ... incoming },
  { id: 2, subject: "Moliyaviy hisobot so'rovi", from: "Nilufar R.", time: "Kecha 17:30", overdue, incoming },
  { id: 3, subject: "QC tekshirish natijasi",    from: "Bobur X.",   ... pending },
  { id: 4, subject: "Yangi uskunalar buyurtma",  from: "Jasur K.",   ... outgoing },
  { id: 5, subject: "HR bo'limiga hisobot",      from: "Lola Y.",    ... outgoing },
];
```
- `useState(INITIAL_ITEMS)` (satr 198) — **hardcoded**, hech qanday `useQuery`/`apiRequest` YO'Q.
- `moveItem` (satr 202) faqat **lokal `setItems`** + toast — backend'ga **hech narsa yozmaydi**.
- Kiruvchi→Kutish→Chiquvchi→Arxiv tugmalari faqat local state o'zgartiradi.
- 24h qoidasi/overdue badge — hammasi mock ma'lumotdan hisoblanadi.

**Xulosa:** 3-Savat = **soxta demo**. Egasi vizyonidagi "kommunikatsiya karta bo'lib tushadi"
oqimi bu komponentda **umuman yo'q**. (Sabab: haqiqiy CC `cc_documents=0` — `asl-holat` C bo'limi.)
Bu panel `KanbanBoard.tsx:190` da har doim render qilinadi (har bir foydalanuvchiga bir xil 5 soxta karta).

---

## 5. MAXFIYLIK (rol-asosli / org-sxema) — YO'Q ❌ (KRITIK, vizyon #3)

Egasi: "Kanban rol-asosli MAXFIY — oddiy xodim faqat o'zinikini ko'radi; super_admin sozlaydi".

**Kod dalili — maxfiylik YO'Q:**
1. **Backend `getBoards()` user/rol parametri qabul qilmaydi** — `kanban-boards.service.ts:30-32`:
   `getBoards(): Promise<Result<KanbanBoard[]>> { return this.boardsRepo.getBoards(); }` — **hamma doska qaytadi**.
2. **`getBoardById()` ham scoping yo'q** (satr 34-36) — har kim har qanday doska kartalarini ko'radi.
3. Controller `getBoards` faqat ixtiyoriy `?departmentId=` query bilan filtrlaydi
   (`kanban-boards.controller.ts:53-60`) — lekin **`kanban_boards` jadvalida `department_id` ustuni umuman YO'Q**
   (tasdiq: ustunlar = id/name/type/description/created_at/...). Ya'ni bu filtr **o'lik kod** (hech narsa filtrlamaydi).
4. **FE `roleFilter` — dead UI:** `BoardHeader.tsx:248-266` da Select bor (Hammasi/Ijrochi/Yaratuvchi),
   lekin `useKanbanBoard.ts:95-113` `filteredCards` faqat search/priority/assigneeId/overdue bo'yicha
   filtrlaydi — **`roleFilter` hech qachon o'qilmaydi**. Tugma bosiladi, hech narsa o'zgarmaydi.

**Xulosa:** Maxfiylik **0%** — har bir foydalanuvchi hamma doska/kartani ko'radi va tahrirlaydi.
"Barcha rollar" filtri faqat bezak. ( Extra: `accepted_by_id` `userId`'dan olinadi, lekin ko'rish-cheklov yo'q.)

---

## 6. TASDIQ ZANJIRI — primitiv 2-bosqich ⚠️ (Bitrix24-uslub emas)

Kod (`drizzle-kanban-cards.repo.ts:195-246`):
- **Accept** (`acceptCard`): `accepted_at=NOW()`, `accepted_by_id=userId` + egasiga `kanban_notifications` insert.
- **Complete** (`completeCard`): `completed_at=NOW()`, `completion_report=...` + egasiga notif.
- FE: `TaskDetailSheetActions` da "Qabul qilish" → "Yakunlash (+hisobot dialog)" tugmalari
  (`useTaskDetailMutations.ts:132-141`).

**Bor:** xodim kartani qabul qiladi → bajaradi → yakunlash hisoboti yozadi → egaga bildirishnoma.
**Yo'q (Bitrix24-uslub):** rahbar **tasdiqlash/rad etish** bosqichi yo'q; qayta-yuborish yo'q;
ko'p-bosqichli moderatsiya yo'q; rad sababini kiritish yo'q. `kanban_cards` da `approved_by`/
`rejected_at` kabi ustunlar yo'q. Ya'ni "natijani rahbar qabul qiladi/qaytaradi" zanjiri **yarим**.
Jonli dalil: id=2 "Nima" karta accepted_at+completed_at to'lgan (oqim ishlaydi), lekin tasdiq yo'q.

---

## 7. KOMMUNIKATSIYA → KARTA BOG'LANISH — qisman ⚠️ (vizyon #1,#4)

| Bog'lanish | Holat | Dalil |
|---|---|---|
| **SD buyurtma → avto Kanban karta** | ✅ ISHLAYDI | `OrderCreatedKanbanHandler` (`event-handlers/order-created-kanban.handler.ts:29`) → `createKanbanForOrder` (`kanban-boards.repo.ts:155`→`kanban-cards.repo.ts`, `related_type='sales_order'`). Buyurtma bekor→karta "Bekor" ustuniga (`moveOrderCardToCancelled`). |
| **Buyurtma bekor → karta ko'chadi** | ✅ ISHLAYDI | `OrderCancelledKanbanHandler` registratsiya qilingan (`kanban.module.ts:46`) |
| **Karta-chat xabaridan → bola-karta** | ✅ ISHLAYDI | `createTaskFromMessage` (`useTaskDetailMutations.ts:168-182`) → `POST /kanban/cards` + `parentCardId`. "Xabardan vazifa" |
| **Karta ↔ CRM deal / SD order link** | ✅ QISMAN | `related_type IN ('deal','order','task','sales_order')` (`kanban-core.ts:78,115`); TaskDetailSheet'da `deals` dropdown (`/api/crm/deals`) |
| **CC hujjat (`cc_documents`) → Kanban karta** | ❌ YO'Q | Hech qanday handler/repo `cc_documents`'ni kanban'ga ulamaydi. Grep: faqat `OrderCreatedEvent` manba. CC bo'sh (`cc_documents=0`). |
| **3-Savat (CC oqimi) → karta** | ❌ MOCK | ThreeBasketsPanel butunlay hardcoded (4-bo'lim) |

**Xul. :** "kommunikatsiya karta bo'lib tushadi" — faqat **SD buyurtma** kanaliga ulangan; chinakam
**Kommunikatsiya Markazi (CC)** ↔ Kanban ko'prigi **yo'q**, 3-savat soxta.

---

## 8. "VAZIFA ICHIDAGI TAB MUAMMOSI" — aniqlandi

TaskDetailSheet (`pages/kanban/TaskDetailSheet.tsx`) 5 tab ko'rsatadi (satr 147-167):
**Asosiy / Checklist / Natijalar / Fayllar / Izohlar(chat)**. Tab almashtirish `useState("main")`
(satr 61) + `<Tabs value={activeTab}>` — bu **ishlaydi** (tab o'zi sinmaydi).

Lekin tab ichidagi **funksional muammolar**:
1. **Fayllar tab — upload buzuq:** `uploadFileMutation` (`useTaskDetailMutations.ts:154-161`)
   `FormData` quradi (`fd.append("file", file)`) lekin `apiRequest('POST', .../files)` ga **`fd` ni
   uzatmaydi** (3-argument yo'q). Backend multipart kutadi → fayl tanasi bormaydi → "Fayl topilmadi"
   (400) ehtimoli. (Xuddi shu xato: `uploadResultFileMutation` satr 118-125, `sendChatMutation` fayl
   bo'lagi satr 81-86.)
2. **Izohlar(chat) tab — fayl biriktirish 501:** chat faylга `POST /kanban/chat-messages/:id/files`
   (satr 84) → backend `notImplemented` (2-bo'lim). Chatga fayl umuman ulanmaydi.
3. **Asosiy tab — Loyiha dropdown bo'sh:** `/api/kanban/projects` (satr 101) → 501 stub. "Loyihaga
   bog'lash" tanlovi har doim bo'sh.

Boshqa tab bo'limlari (checklist add/toggle/delete, natija matni qo'shish, izoh yozish, kuzatuvchi/
hamijrochi/teg) — **real ishlaydi** (mutatsiyalar to'g'ri endpointlarga boradi).

---

## 9. ROBOTLAR / OQIMLAR / SHABLONLAR — kod bor, ishlatilmagan ⚠️

- **Robotlar** (`kanban-robot.service.ts`): `onCardMoved`/`onCardCreated` trigger (boards.service.ts:124,150).
  `sales_order` related kartani harakatlantirsa SD'ga signal beradi (robot.service.ts:225-230). Jonli `kanban_robots=0`.
- **Oqimlar (Flows)**: round-robin tayinlash mantig'i (`kanban-core.controller.ts:52-64`). Jonli `kanban_flows=0`.
- **Shablonlar**: `apply` ustun yaratadi (`kanban-boards.controller.ts:237-271`). Jonli `kanban_templates=0`.
- FE dialoglar: `RobotsDialog.tsx`, `FlowsDialog.tsx`, `TemplatesDialog.tsx`, `ReportsDialog.tsx` mavjud.

Ya'ni Bitrix24-uslub avtomatlashtirish **karkasi qurilgan**, lekin **bir marta ham sozlanmagan/ishlatilmagan**.

---

## 10. UMUMIY — KANBAN NECHA %

| O'lcham | Holat | % |
|---|---|---|
| Doska/ustun/karta CRUD | ✅ real DB | 95% |
| 8 ko'rinish (kanban/list/deadline/myPlan/calendar/gantt/dashboard/allocation) | ✅ real | 90% |
| Karta detallari (checklist/izoh/natija/vaqt/teg/kuzatuvchi/hamijrochi) | ✅ real | 85% |
| Fayl yuklash (karta/natija/chat) | ⚠️ FE FormData buzuq + chat 501 | 40% |
| Tasdiq zanjiri (accept→complete) | ⚠️ primitiv, reviewer/rad yo'q | 45% |
| **3-Savat (CC oqimi)** | ❌ 100% mock | **5%** |
| **Maxfiylik (rol/org-sxema)** | ❌ yo'q, dead filtr | **5%** |
| Kommunikatsiya→karta | ⚠️ SD-only, CC yo'q | 40% |
| Robot/Flow/Shablon avtomatlashtirish | ⚠️ kod bor, 0 ishlatilgan | 35% |
| Hisobot/Export (Excel/PDF/analytics) | ✅ real | 85% |
| Data tozaligi | ❌ test-axlat to'la | 10% |

### **KANBAN UMUMIY: ~55%** (dvigatel sifatida ishlaydi; vizyon-yadrosi yo'q)

**Sabab:** Kanban texnik jihatdan **eng to'liq qurilgan modullardan biri** (real DB CRUD,
8 ko'rinish, vaqt-kuzatuv, hisobot, robot-karkas). LEKIN egasi vizyonining 3 yadro-talabidan
**ikkitasi yo'q va biri soxta**:
1. ❌ **Maxfiylik (rol-asosli/org-sxema)** — umuman yo'q, "Barcha rollar" filtri dead.
2. ❌ **3-Savat / CC→karta oqimi** — 100% hardcoded mock.
3. ⚠️ **Tasdiq zanjiri** — primitiv 2-bosqich, Bitrix24-uslub moderatsiya emas.
Ustiga **test-axlat data** (1231322/Salom/savol/ghghgh) modulni "tugallanmagandek" ko'rsatadi.

---

## 11. EGASI REJASI UCHUN TAVSIYALAR (faqat tahlil — bajarilmadi)

1. **Maxfiylik joriy etish:** `kanban_boards`'ga `org_department_id`/`owner_user_id`/`visibility`
   ustun qo'shish; `getBoards(userId, role)` ga scoping (super_admin=hammasi, manager=bo'lim,
   employee=o'zi ijrochi/kuzatuvchi/yaratuvchi bo'lgan); FE `roleFilter`'ni `filteredCards`'ga ulash.
2. **3-Savatni real qilish:** ThreeBasketsPanel `INITIAL_ITEMS` mock'ini olib tashlab,
   `cc_documents` (Kiruvchi/Kutish/Chiquvchi) yoki `kanban_cards` (source='communication')'dan
   `useQuery` bilan o'qish; `moveItem` → real `PATCH` endpoint.
3. **Tasdiq zanjirini kuchaytirish:** `kanban_cards`'ga `submitted_at/approved_by/approved_at/
   rejected_at/reject_reason` qo'shib, complete→rahbar tasdiqlash/rad bosqichi.
4. **3 stubni yopish:** `/kanban/:id/assign` real UPDATE; `/kanban/chat-messages/:id/files`
   real upload; `/kanban/projects` real ro'yxat.
5. **FE fayl-upload buzug'ini tuzatish:** `apiRequest(...)` ga `fd` (FormData) ni uzatish (3 joy).
6. **Test-axlat tozalash:** `kanban_boards/columns/cards` (Salom/1231322/...) + natija "ghghgh" o'chirish.
7. **4 o'lik dublikat jadval:** `kanban_tasks`, `kanban_card_checklists(+items)`, `kanban_comments`
   DROP qarori (faol kod tegmaydi).
8. **CC→Kanban ko'prigi:** Kommunikatsiya Markazi hujjati→avto-karta (OrderCreatedEvent naqshi bilan).

---

*Tahlil 2026-06-02 — kod (Read/Grep) + jonli DB (`europrint`@5432) bilan tasdiqlandi. Brauzer
ishlatilmadi; UI holati `docs/asl-holat-...-2026-06-02.md` (brauzer Super Admin) bilan kross-tekshirildi.
Hech narsa o'zgartirilmadi.*
