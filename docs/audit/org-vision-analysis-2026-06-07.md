# ORG-STRUKTURA VIZYONI ↔ JONLI KOD — Konsolidatsiyalangan tahlil

**Sana:** 2026-06-07 · **Rol:** 🔵 Tahlilchi (READ-ONLY — bu fayldan boshqa hech narsa o'zgartirilmadi)
**Manba:** 4 ta analitik hisobot (qa-source / vision-cross / decisions / current-code) sintezi + jonli DB-proof (`_audit/q.cjs`, BEGIN READ ONLY…ROLLBACK) va kod tekshiruvi.
**Verify-don't-trust:** har bir da'vo `doc:line` YOKI DB/kod-proof bilan; isbotsiz da'volar tushirildi.

---

## 0. IJROIY XULOSA (tight executive summary)

**To'g'rilangan sarlavha — org modeli:**
EuroPrint org-strukturasi = **Vysotskiy/Hubbard 7-otdeleniye** modeli, **6-bosqichli vertikal zanjir** (`Operator → Smena boshlig'i → Bo'lim boshlig'i → Otdeleniye rahbari → CEO → Owner`) + **gorizontal `workflow_rules` marshrutlash** (bo'lim→bo'lim, masalan avans: Sales→Finance/Kassir). U butun ERP'ning **master data**'si: kim KO'RADI (RBAC/maxfiylik) · kim TASDIQLAYDI (approval chain) · kim ESKALATSIYA qiladi · order/hujjat ROUTING · har lavozim/bo'lim QYM (ЦКП/TSKP). `head_user_id` = YAGONA boshqaruv manbai; `manager_id` undan AVTO-to'ldiriladi (ikkinchi mustaqil manba EMAS).

**Holat bir qatorda:** Skelet QURILGAN (142-node daraxt, L0–L5, `org_functions`/`org_departments`/RBAC-matritsa 1380 qator/2 resolver/fan-out spine REAL) — lekin **identity + leadership + ЦКП + config-routing qatlami YO'Q yoki bo'sh**.

**TOP bo'shliqlar (DB-proof):**
1. `employees.manager_id` = **0/30 to'ldirilgan** → `MANAGER_OF_SENDER` to'g'ridan-yo'l HECH QACHON ishlamaydi (DB tasdiqlandi).
2. `org_departments.head_user_id` = **18/142 to'ldirilgan** (124 NULL) → 6-bosqichli zanjir ko'p node'da KALTA; manager_id fallback ham mo'rt (DB tasdiqlandi).
3. **`workflow_rules` jadvali YO'Q** (`to_regclass='null'`) → gorizontal marshrutlash 34 ta hardcoded `cc_workflow_steps` bilan taqlid qilingan, config-driven EMAS.
4. `org_functions.tskp` = **0/97 to'ldirilgan**, `tskp_target` = 0/97 → butun ЦКП modeli strukturada bor, ma'lumot YO'Q.
5. `otdeleniye_code` = **14/142** node'da, ikki xil kodlash (BUILD/DIST/… ╳ OTD1–OTD7) — 7-divizion markeri chala + dublikat.
6. **2 bo'lim olami:** `departments`(18, Hubbard) ╳ `org_departments`(142) — xodimlar IKKALASIGA bog'langan; kanonik = `org_departments`(142) (owner qarori, QARORLARI:289).

**Eski xulosaning eng katta xatosi:** `manager_id`'ni "bo'lim boshlig'i (DEPT_HEAD)" deb tushuntirgan. **NOTO'G'RI** — vizyon bo'yicha `manager_id` = 6-bosqichli zanjirda **bevosita BIR POG'ONA YUQORI** node (no-level-skipping: archive:478 "hujjatlar sakramasligi kerak"); DEPT_HEAD/eskalatsiya bu zanjirning alohida bosqichlari.

**Egasi uchun ochiq savollar (ijrodan OLDIN hal qilinishi shart):** (a) `manager_id` saqlanadimi yoki tushiriladimi (auto-fill vs DROP)? (b) Har node'ning ASL boshlig'i kim — sample-data noaniq, taxmin mumkin emas, bu owner-data? (c) `workflow_rules` jadval owner ruxsati bilan yaratiladimi (Q-35)? (d) 6-bosqichdagi "Smena boshlig'i" va "Otdeleniye rahbari" daraxtda alohida node'mi yoki `level` orqali hosilami? (e) `departments`(18) → VIEW/migrate/reseed qaysi biri?

---

## 1. TO'LIQ ORG-STRUKTURA VIZYONI (Vysotskiy-7, barcha doc bo'yicha verifikatsiya)

### 1.1 Darajalar L0–L5
Manba: `docs/migration/02-vysotskiy-7-tree.md:7-23, 95-102` (tahlilchi to'g'ridan o'qidi).

| Daraja | Mazmun | Vizyon soni (tree:97-102) | Doc:line |
|---|---|---|---|
| **L0 ROOT** | EuroPrint Group | 1 | tree:8,97 |
| **L1** | Egasi (Owner) → Bosh Direktor (CEO) | 2 | tree:9-11,98 |
| **L2** | 7 Otdeleniye (`vysotskiyFunction`) | 7 | tree:12,99 |
| **L3** | Otdellar (30+ bo'lim) | 30+ | tree:20,100 |
| **L4** | Sektsiyalar (masalan OFFSET→SM52/SM74/XL106; DIGITAL→Ricoh/Xerox/Konica) | 5-10 | tree:21,54-56,101 |
| **L5** | Sektorlar (eng past, 0-5) | 0-5 | tree:22,102 |

> ⚠️ Vizyon REJADAGI sonlar (L0=1, L1=2, L2=7) jonli DB taqsimoti bilan MOS EMAS (§3 ga qarang): jonli `level` = L0:7, L1:3, L2:19, L3:77, L4:34, L5:2 — ya'ni "level" ustuni vizyon-rejadagi semantik darajaga emas, boshqa konvensiyaga to'ldirilgan. Bu **vizyon↔ma'lumot drift** (owner-tasdiq kerak).

### 1.2 7 Otdeleniye (`vysotskiyFunction`)
Manba: tree:25-91 (to'liq L3 ro'yxati bilan) + archive `EUROPRINT_BARCHA_JAVOBLAR.md:868-910` + decisions SPEC:171-179.

| # | Kod | Nomi | Tarkibi | Doc:line |
|---|---|---|---|---|
| 1 | `construction` | Qurilish bo'linmasi | HR + Marketing + IT + Reception + Brending (Personnel+Kommunikatsiya+Marketing) | tree:13,27-34 |
| 2 | `distribution` | Tarqatish | Sotuv + CRM + Logistika + Customer Care | tree:14,36-42 |
| 3 | `production` | Ishlab chiqarish | Prepress + Offset + Digital + Postpress + Largeformat + Packaging + Prod_Mgmt | tree:15,44-53 |
| 4 | `tech_support` | Texnik ta'minot | Maintenance + Warehouse + Raw_Material + MRO + Security + Canteen | tree:16,58-66 |
| 5 | `finance` | Moliya | Accounting + Cash + Budget + Advance + Tax | tree:17,68-75 |
| 6 | `development` | Rivojlanish | ERP_Dev + Mkt_Strat + Innovation + Design | tree:18,77-83 |
| 7 | `administrative` | Ma'muriy | Owner_Office + CEO_Office + Legal + Inspection | tree:19,85-91 |

Model nomi: "Vysotskiy 7 funksiya modeli" (archive:869); "Vysotskiy/Hubbard 7-function" (decisions SPEC:158, MASTER:427).

### 1.3 Vertikal tasdiq zanjiri (6 bosqich)
Manba: **tree:153** (kanonik bayonot) — tahlilchi to'g'ridan o'qidi:
> `Operator → Smena boshlig'i → Bo'lim boshlig'i → Otdeleniye rahbari → CEO → Owner`

Owner qoidalari:
- **Pog'ona sakramaslik:** archive:478 (Q79) "*ariza birinchi vertikal yuradi keyin gorizontal yuradi, umuman hujjatlar sakramasligi kerak hammasi*".
- **Avto-aniqlanadi:** archive:481 (Q80) "*Org-sxemadan avtomatik aniqlansin (tizim o'zi chizadi)*".
- **Eskalatsiya darajasi rol emas, ierarxiyadan:** decisions MASTER:136-137,206 "*kim kimga bo'ysunsa shunga qarab; qat'iy rol emas*".
- **Master reja qarori:** `XARITA-REJA-YONALISH-2026-06-07.md:69` "*manager_id = org-sxema bo'yicha HAR DOIM; bo'sh bo'lsa yuqoriga eskalatsiya; self-heal*".

### 1.4 Gorizontal marshrutlash (`workflow_rules`)
Manba: **tree:154-156** (tahlilchi to'g'ridan o'qidi):
> Gorizontal: Bo'lim → tegishli bo'lim (**config: `workflow_rules` jadval**)
> Misol — Avans ariza: `Sales > Sales Manager → Finance > Accounting > Cashier`
> Misol — Material so'rovi: `PROD > Prod Manager → Tech Support > Warehouse Manager`

Owner: archive:487 (Q81) "*Hammasi konfiguratsiya qilinadi: Admin panel dan yo'l chiziladi*". Birlashgan avans oqimi = avval Production ichida VERTIKAL yuqoriga, KEYIN Finance/Kassir'ga GORIZONTAL (archive:478 + tree:155).

### 1.5 Rollar/lavozimlar — org-daraxtdan hosil, hardcoded EMAS
Manba: archive Q63/Q132/Q157/Q171 + tree:141-150 + decisions F-37.
- "*orgsxemada belgilanadi hammasi*" (archive:718, Q157); "*Bo'lim > Lavozim (org-sxema to'liq)*" (archive:763, Q171).
- "*Role-based access — orgsxemadagi lavozimga qarab avtomatik*" (decisions SPEC:190, MASTER:443-446) → lavozim biriktirilsa ERP roli (permissions JSON) avto-o'rnatiladi.
- Lavozim migratsiyasi: 112 eski `positions` → 112 `org_functions` (tree:141-150).
- Lavozim modeli ustunlari (decisions MASTER:439-441): code, name(uz/ru), dept, level (WORKER…OWNER), salary range, ERP role ID, lavozim-papka yo'li (docs/video/test), KPI shablon, mentor-required, adaptatsiya kunlari, max headcount.

### 1.6 TSKP / ЦКП (QYM = Qimmatli Yakuniy Mahsulot)
Manba: tree:104-114 + archive:874-875 + decisions A-8.
- "*Har bo'lim VA lavozim uchun alohida QYM*" (archive:874; decisions SPEC:160, MASTER:435).
- Saqlanish: `org_functions.tskp` + `tskp_target` (tree:106,148-150).
- Misollar (tree:108-114): CEO=100%, HR menejer=90%, Offset operator=95%, Buxgalter=100%, Dizayner=4.5/5.
- Kunlik TSKP hisoboti: archive:592 (Q116) — har kuni ishdan keyin bot orqali xodimdan TSKP-asosli hisobot olinadi → profilga saqlanadi; uskuna xodimlari avto-PDF "rasmiy invoys". 16-soat qoidasi: hisobot bo'lmasa o'sha kun HISOBLANMAYDI (decisions MASTER:151).

### 1.7 Document-workflow + RBAC + scoping (org master data sifatida)
Manba: decisions C/D/E/F bo'limlari (`D:\kitob\*`).
- CC = ASOSIY modul; "*Hech kim qog'oz bilan kelmaydi*" (MASTER:17-18,220-226).
- 14 hujjat turi, har biri shablon + tasdiq zanjiri (MASTER:247-249).
- PIN = elektron imzo / yoki ERP login = imzo (MASTER:235,660 — ⚠️ ikki xil bayon, C5 ziddiyati).
- Tasdiqlangan hujjat O'ZGARMAS (immutable) (MASTER:237; archive:493).
- Hujjat→Kanban: board = hujjat turi + org-sxema birga (MASTER:851-852).
- Kanban maxfiyligi: "*ORGSXEMA O'ZI HAL QILADI*" (MASTER:206); BE role-scope BIRINCHI, FE filter IKKINCHI (MASTER:207-209).
- Amount-gate FAQAT chiqimda, 3 daraja SETTINGS'da (MASTER:134-135).
- Org o'zgarsa AVTO-tarqaladi: lavozim o'zgardi→ERP rol; yangi bo'lim→POS ombor avto; bo'lim yopildi→ogohlantirish; Telegram routing yangilanadi (MASTER:425,445-449).

---

## 2. TO'G'RILASH / BO'SHLIQLAR — eski soddalashtirilgan xulosaga nisbatan

Eski `MEMORY.md` indeksi + master doc org-strukturaga FAQAT 2 o'tuvchi havola beradi (`XARITA-REJA-YONALISH-2026-06-07.md:27` va `:69`) — uni "master data" bir qatorli izoh + `manager_id` eskalatsiya qoidasi deb ko'rsatadi. Quyidagilar XATO yoki YETISHMAYDI:

1. **❌ XATO — `manager_id = bo'lim boshlig'i (DEPT_HEAD)` taxmini.** Vizyon bo'yicha `manager_id` = 6-bosqichli zanjirda **bevosita BIR POG'ONA YUQORI** (no-level-skipping, archive:478; tree:153). Bo'lim boshlig'i bu zanjirning faqat 3-bosqichi; operator uchun bevosita yuqori = Smena boshlig'i, smena uchun = Bo'lim boshlig'i, h.k. DEPT_HEAD resolver kodda alohida bosqich (`cc-org-resolver.service.ts:90`), `MANAGER_OF_SENDER`dan farqli.

2. **❌ YETISHMAYDI — gorizontal `workflow_rules` marshrutlash butunlay e'tibordan chetda.** Eski memory faqat vertikal `manager_id`'ni eslaydi. Vizyonda bo'lim→bo'lim gorizontal yo'l (`workflow_rules` jadval, 2 kanonik misol: avans→Finance/Kassir, material→Warehouse) markaziy (tree:154-156). Memory'dagi "Phase 4 order→dept fan-out" (`session_2026-06-01_phase4_fanout.md`) BOSHQA narsa — order-spetsifik `sd_order_departments` fan-out, umumiy hujjat `workflow_rules` EMAS.

3. **❌ YETISHMAYDI — butun Vysotskiy 7-otdeleniye modeli.** Memory 7 funksiyani (`construction/distribution/production/tech_support/finance/development/administrative`), L0–L5 darajalarni, butun ERP'ning shu daraxtga osilishini hech qayerda nomlamaydi. Bu owner #1 arxitektura skeleti (vizyon #19/#20), indekslanmagan.

4. **❌ YETISHMAYDI — 6-bosqichli vertikal spec.** Memory `manager_id` eskalatsiyani yozadi, lekin kanonik 6-bosqichni (`Operator→Smena→Bo'lim→Otdeleniye→CEO→Owner`, tree:153) yoki pog'ona-sakramaslik qoidasini (archive:478) yo'q.

5. **❌ OSHIRIB-AYTILGAN — "org daraxt qurilgan / `org_functions` kanonik".** Memory `org_departments`/`org_functions`'ni kanonik kabi eslaydi (positions/skills konvergensiya, employees↔org join), lekin: `org_functions.tskp`/`tskp_target` ustunlari BO'SH (DB: 0/97), `workflow_rules` jadval YO'Q, 7-tree backfill (`01-audit.md` Bosqich 1) BAJARILMAGAN REJA. Skelet bor, ma'lumot/wiring YO'Q. Vizyon `tskp`/`workflow_rules` qismlari schemada/data'da yo'q.

6. **❌ YETISHMAYDI — TSKP/ЦКП birinchi-darajali tushuncha sifatida** (har lavozim target + kunlik bot-hisobot, archive:592,116). Memory'da TSKP yozuvi UMUMAN yo'q.

7. **❌ YETISHMAYDI — hujjat-turi SLA + eskalatsiya** (avans 4 soat / ta'til 24 soat, 2 eslatma→eskalatsiya→HR; archive:610,613) **+ tasdiqlangan hujjat immutability** (archive:493).

8. **❌ YETISHMAYDI — manba provenance.** Memory indeksi `EUROPRINT_BARCHA_JAVOBLAR.md` (200/200 vizyon manbai) yoki `docs/migration/02-vysotskiy-7-tree.md`'ni org-struktura source-of-truth deb ko'rsatmaydi. "MASTER" doc single-source deyiladi, lekin u bu org detalini SAQLAMAYDI (Q-25 bo'yicha saqlashi kerak) — bo'shliq.

> ⚠️ **Eskirgan da'vo (verify-don't-trust):** `agent12:107-108,178-182` "Portret backend STUB, saqlamaydi" — memory `project_portret_persist_done` (commit 2f353637, jonli HTTP round-trip PASS) bilan ESKIRGAN: Portret endi REAL `org_node_portret` JSONB upsert. Decisions C3 ham shu eski da'voni keltiradi → C3 qisman eskirgan (Portret persist qilinadi; `getNodeHistory` 501 va "kerakli jihozlar" modeli hali YO'Q).

---

## 3. VIZYON ↔ JONLI KOD bo'shlig'i (BUILT/PARTIAL/MISSING + DB-proof)

Hammasi `node _audit/q.cjs` (READ ONLY ROLLBACK) jonli `europrint` DB'ga; kod `file:line` bilan. **Tahlilchi ushbu sessiyada quyidagilarni QAYTA tasdiqladi** (✅ = bu sessiyada jonli tekshirildi):

| Vizyon qismi | Holat | Proof (bu sessiya) |
|---|---|---|
| Node daraxt (`org_departments`) | **BUILT** | 142 qator; `OrgQueriesRepo.getHierarchyNodes()` xizmat qiladi |
| `head_user_id` to'ldirilgan | **PARTIAL** | ✅ DB: `total=142, head_filled=18, head_null=124`. Ustun: `schema-misc-app-a.ts:109`; FK `core-schema.ts:302` |
| `employees.manager_id` to'ldirilgan | **MISSING** | ✅ DB: `total=30, mgr_filled=0` (30/30 NULL). Ustun: `schema-misc-app-a.ts:60` |
| Node LEVEL (L0–L5) | **BUILT (drift)** | ✅ DB: `level` 142/142 to'la, taqsimot L0:7/L1:3/L2:19/L3:77/L4:34/L5:2. ⚠️ vizyon-reja sonlari bilan MOS EMAS (§1.1) |
| `workflow_rules` jadval (gorizontal) | **MISSING** | ✅ DB: `to_regclass('public.workflow_rules')=null`. Faqat tree:154 doc'da |
| `org_functions.tskp` to'ldirilgan (ЦКП) | **MISSING (jadval bor, data bo'sh)** | ✅ DB: `total=97, tskp_filled=0, target_filled=0` |
| 7-otdeleniye markeri | **PARTIAL** | ✅ DB: `otdeleniye_code` 14/142 to'la; ikki kodlash (BUILD/DIST/… ╳ OTD1–OTD7) |
| Gorizontal taqlid: `cc_workflow_steps` | **PARTIAL (hardcoded)** | ✅ DB: 34 qator, 5 kod — `MANAGER_OF_SENDER×14, CEO×7, POSITION:HR_HEAD×7, POSITION:CFO×4, POSITION:KASSIR×2`; `cc_workflow_templates=null` |

**Approval resolver (REAL, lekin data bilan mo'rt):** `cc-org-resolver.service.ts` — tahlilchi to'g'ridan o'qidi (1-110 qator):
- `resolveManagerOfSender` (`:53-88`): **1-yo'l** `JOIN employees m ON m.id = e.manager_id` (`:56-61`) → `manager_id` 0/30 NULL bo'lgani uchun HECH QACHON natija bermaydi; **2-yo'l** rekursiv org-tree fallback (`:68-84`) eng yaqin `head_user_id`'gacha yuradi → 124 head NULL bo'lgani uchun u ham mo'rt.
- `resolveCeo` (`:42-51`): root `head_user_id` → 16 leadership node'dan faqat 2'sida head bor (current-code report) → ko'p hollarda "CEO orgsxemada belgilanmagan" tashlaydi.
- Gorizontal yo'l (Sales→Finance/Kassir) `POSITION:<CODE>` step sifatida HARDCODED (`POSITION:CFO/HR_HEAD/KASSIR`), config `workflow_rules` jadval EMAS.

**Boshqa REAL spine'lar (vision-cross + decisions hisobotidan, tasdiqlangan):**
- **P2P approval:** `procurement-approval-chain.service.ts:57` rekursiv CTE `org_departments.parent_id`→ROOT, har bosqich `head_user_id` (REAL, lekin head 18/142 bilan kalta).
- **RBAC matritsa:** `position_permissions` ≈1380 qator (92 lavozim×15 modul); `permission.guard.ts` 177 route'da enforce (REAL). Lekin enforcement faqat shu 177 route'da; eski modullar `users.role` (manager27/director1/super_admin3) bilan.
- **Fan-out spine:** `advance-approved-fanout.listener.ts` + `sd_order_departments` (Phase-4 saga, 5/6 dept wired). ✅ DB-proof: `sd_order_departments=0` (jonli bir marta ham aylanmagan), `sales_orders=12`.

**Xulosa:** struktura ~BUILT, identity/leadership/ЦКП/config-routing qatlami ~MISSING. Asosiy fayllar: `schema-misc-app-a.ts:103-119` · `core-schema.ts:294-391` · `org-structure/org-queries.repo.ts` · `cc-org-resolver.service.ts` · `docs/migration/02-vysotskiy-7-tree.md`.

---

## 4. ILDIZ REJA MOSLIGI — 3 qaror to'liq vizyonga MOS keladimi?

3 ildiz qarori (master reja `XARITA-REJA-YONALISH`) to'liq Vysotskiy-7 vizyoniga nisbatan:

### Qaror 1 — `manager_id` (org-sxema bo'yicha, bo'sh bo'lsa eskalatsiya, self-heal)
- **MOS** asosan: master reja `:69` + decisions B-10/B-11 ("`head_user_id`=yagona manba; `manager_id` undan auto-fill, ikkinchi mustaqil manba EMAS"). Bu vizyonning #19 master-data printsipiga to'g'ri keladi.
- **⚠️ TO'G'RILASH KERAK:** "manager_id = bo'lim boshlig'i" tushunchasi NOTO'G'RI (§2.1). Auto-fill manbai = 6-bosqichli zanjirda **bevosita bir pog'ona yuqori node head** (operator→smena boshlig'i, smena→bo'lim boshlig'i, …), **DEPT_HEAD'ga TENG EMAS** (faqat operator→smena yo'q bo'lsa bo'lim boshlig'iga sakraydi — lekin archive:478 "sakramaslik" deydi). Demak auto-fill `level`-ga sezgir bo'lishi kerak: "eng yaqin BIR pog'ona yuqori head", hozirgi fallback esa "eng yaqin ISTALGAN head"ni oladi (`:80-83 ORDER BY depth LIMIT 1`) → bu pog'ona-sakrashga yo'l qo'yadi. **Vizyon bilan to'liq moslik uchun:** smena/otdeleniye oraliq node'lari daraxtda mavjud bo'lishi yoki `level` asosida bir pog'ona qadam kafolatlanishi kerak.
- **Blokerni hal qiladimi:** Ha — `manager_id` 0/30 + `head_user_id` 18/142 to'ldirilsa, CC `MANAGER_OF_SENDER` + P2P + eskalatsiya tiklanadi. Lekin "har node'ning ASL boshlig'i kim" = **owner-data** (sample'da 3× "Sotuvlar Boshlig'i" dublikati, taxmin mumkin emas).

### Qaror 2 — Kanonik buyurtma = `sales_orders` + manejer-kiritadi
- **MOS** vizyon #14 (menejer buyurtma-paneli) + #21 (oltin ip 70% avans→bo'lim fan-out) bilan. Fan-out spine REAL `sd_order_departments`→`sales_orders(id)` 7 FK (memory `session_2026-06-01_phase4_fanout`). ✅ DB: `sales_orders=12`, `sd_order_departments=0` (spine bor, ishlamagan).
- **⚠️ TO'G'RILASH:** bu qaror org-strukturaga BEVOSITA tegmaydi, lekin fan-out "har bo'limga" = `org_departments`'ga mos kelishi shart. Hozir fan-out maqsadi dept-kodlar (mold/design/cliche/logistics/warehouse) — bular `org_departments` 142-node bilan rasman bog'lanishi tekshirilishi kerak (vizyon: "modul qaysi bo'limga tegishli → org-struktura", decisions A-1). Aks holda buyurtma fan-out org-master-data'dan MUSTAQIL qoladi (vizyon #19 buzilishi).

### Qaror 3 — GL #76 cost-center = per-sex (har sex)
- **QISMAN MOS / TO'G'RILASH KERAK:** vizyonda har bo'lim/sex org-strukturadan keladi (decisions A-1, "qaysi modul qaysi dept"). Cost-center per-sex bo'lsa, **sex = `org_departments` node (L3/L4)** bo'lishi kerak, alohida cost-center master EMAS — aks holda yana bir "master data oroli" paydo bo'ladi (vizyon #19 ga zid). SAP-audit (`docs/audit/SAP-AUDIT-2026-06-06.md:3818`) `deleteCostCenter`/`deleteProfitCenter` mavjudligini ko'rsatadi → cost-center modeli ALLAQACHON bor; u `org_departments`'ga bog'lanishi (FK yoki view) shart, parallel jadval emas.
- **Ochiq:** "sex" = qaysi `level` (L3 Otdel yoki L4 Sektsiya — masalan OFFSET→SM52 stansiya)? Bu GL granularligini belgilaydi → owner tasdiqi kerak (§5-d bilan bog'liq).

**Umumiy:** 3 qaror yo'nalishi vizyonga MOS, lekin har biriga aniqlik kerak: (1) auto-fill = "bir pog'ona yuqori", DEPT_HEAD emas; (2) fan-out dept'lari `org_departments`'ga bog'lanishi; (3) cost-center = `org_departments` node, parallel master emas.

---

## 5. EGASI UCHUN OCHIQ SAVOLLAR (ijro promtidan OLDIN — reja "puxta" bo'lishi uchun)

1. **`manager_id` taqdiri:** Ustun SAQLANADIMI (har commit'da `head_user_id`'dan auto-fill + self-heal) yoki TUSHIRILADIMI (faqat daraxt+`head_user_id`'dan derive)? decisions B-11 ikkalasini ham ruxsat beradi, implementatsiya tanlovi ochiq (GO:43-46). **Bu tanlovsiz CC/P2P/eskalatsiya wiring boshlanmaydi.**

2. **Har node'ning ASL boshlig'i kim?** `head_user_id` 124/142 bo'sh; sample-data noaniq (3× "Sotuvlar Boshlig'i" dublikati). Bu **owner-data — taxmin qilib bo'lmaydi**. Owner haqiqiy org-sxemadan 142 node uchun (kamida 16 leadership: owner/CEO/7 otdeleniye rahbari) head'larni bermog'i kerak.

3. **`workflow_rules` jadval yaratiladimi?** Gorizontal marshrutlash hozir 34 hardcoded `cc_workflow_steps` bilan. Vizyon (tree:154) config-driven `workflow_rules` jadval talab qiladi. Yangi `CREATE TABLE` = **Q-35 owner ruxsati**. Yaratiladimi, yoki `cc_workflow_steps` kengaytiriladimi?

4. **6-bosqich daraxtda qanday materializatsiya bo'ladi?** "Smena boshlig'i" va "Otdeleniye rahbari" — bular daraxtda ALOHIDA node'mi (L1.5/L2) yoki `level` orqali hosil qilinadimi? Hozir jonli `level` taqsimoti vizyon-reja bilan mos emas (L0:7 vs reja L0:1). Bu auto-fill "bir pog'ona yuqori" mantig'ini belgilaydi (§4-Qaror1).

5. **`departments`(18) → nima bo'ladi?** Kanonik = `org_departments`(142) (QARORLARI:289). 18-jadval (xodimlar bog'langan) → VIEW qilinadimi / migrate / reseed? Agent o'zi o'chirmasligi kerak (QARORLARI:307, "test data avval o'chirma"). + dublikat positions (Bosh Direktor id 2╳659, HR boshlig'i 6╳661) qaysi biri kanonik?

6. **ЦКП/TSKP to'ldirish:** `org_functions.tskp` 0/97. Owner har lavozim TSKP'sini o'zi to'ldiradimi (admin panel) yoki boshlang'ich seed kerakmi? Kunlik bot-hisobot (16-soat qoidasi) shu data'ga bog'liq.

7. **7-otdeleniye markeri to'g'rilash:** `otdeleniye_code` 14/142 + ikki kodlash (BUILD/DIST/… ╳ OTD1–OTD7). Qaysi kodlash kanonik? Qolgan 128 node tag'lanadimi?

8. **PIN vs login imzo (C5):** "PIN=elektron imzo" (MASTER:235) ╳ "ERP login=imzo" (MASTER:660). Qaysi biri obro'li? (Murosaga keltirsa bo'ladi: PIN=harakat, login=identity — lekin owner tasdig'i kerak.)

---

**Manba fayllar (absolute):**
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\docs\migration\02-vysotskiy-7-tree.md`
- `C:\Users\AzzA\Downloads\Telegram Desktop\EUROPRINT_BARCHA_JAVOBLAR.md`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\docs\XARITA-REJA-YONALISH-2026-06-07.md`
- `D:\kitob\EUROPRINT-INTERVYU-QARORLARI.md` · `D:\kitob\EUROPRINT-POS-ORG-SPETSIFIKATSIYA.md` · `D:\kitob\EUROPRINT-OMBOR-POS-KASSIR-MASTER-REJA.md` · `D:\kitob\AGENT-BLOK1-ORG-STRUKTURA-GO.md`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\communication-center\application\cc-org-resolver.service.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\shared\db\schema-misc-app-a.ts` · `lib\db\src\schema\core-schema.ts`

**DB-proof (bu sessiya, READ ONLY):** `org_departments` total=142/head=18/null=124 · `employees` total=30/manager_id=0 · `org_functions` total=97/tskp=0/target=0 · `level` L0:7/L1:3/L2:19/L3:77/L4:34/L5:2 · `workflow_rules`=null · `cc_workflow_steps`=34 (MANAGER_OF_SENDER×14/CEO×7/HR_HEAD×7/CFO×4/KASSIR×2) · `otdeleniye_code`=14/142 · `sales_orders`=12 · `sd_order_departments`=0.
