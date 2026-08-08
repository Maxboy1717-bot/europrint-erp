# EUROPRINT ERP — MASTER VISION (jamlangan)

> Egasining 3000+ intervyu-javobidan jamlangan yagona vizyon-hujjat.
> **Manbalar:** CHAT-TARIXI-YANGI (42,872 qator founder-intervyu) + docs/audit/decisions/01-22 + MASSIV-50 + XARITA-REJA + Production deep-analysis (2026-06-23).
> **Qoida:** ziddiyatda BU hujjat ustun (Q-25). Build-reja: `500K_QURISH_REJA_PROMPT.md`.
> Tayyorladi: Claude (menejer+bosh dasturchi) · 2026-06-23 · 16-agent konsolidatsiya (verify: decisions/ + MASSIV-50 + jonli DB).

---

## 📊 16 MODUL — BUILD HOLATI (qisqa)

| # | Modul | Build % |
|---|---|---|
| 1 | ORG + KARTALAR | 28% |
| 2 | HR | 35% |
| 3 | SD Savdo | 35% |
| 4 | PP Ishlab chiqarish | 35% (foundation structure + decision mapping done; core PP service logic ~30% ready; 3-gate approval logic blocked on DDL; gofra formula service structured but pending master-data values; FE 360° dashboard stub; multiple critical open owner decisions) |
| 5 | MES | 35% |
| 6 | QC Sifat | 42% |
| 7 | WMS Ombor — Warehouse Management System | 42% |
| 8 | MM Materiallar | 40% |
| 9 | FINANCE + KASSIR | 35–40% (GL core P24 + P25 real, KASSIR schema tavvik, ZVS/ZNO schema + partial endpoints; yoq: KASSIR full controllers, P26 podotchet, FE cost-center/kassir pages, aging 90+ cron trigger, kunlik PDF, P52 cost-center, DDL APPROVED) |
| 10 | DIRECTOR | 35% — P29 DDL + core state engine drafted but GATED (egasi APPROVED: imzolashini kutmoqda); Drizzle schema partially updated (idealRasmTargets pgTable qo'shilgan); 3 of 15 P29 owned files stubbed. P30 framework (4 backend systems + 4 frontend pages) = detailed specification ready but not yet coded. OKR cascade parent_goal_id/owner_card_id ALTER gated. Daily cron structure confirmed. Diary auto-fill logic (SQL queries) specified. Dashboard extensions (planFact, orderProgress, statTrends, openIssues) designed. |
| 11 | CRM | 35% |
| 12 | MARKETING | 35% (schema fixes + repo types in progress; 10/30 MASSIV-50 standalard tasks identified; core BD-proof ready; FE-BE endpoint mismatch fixed) |
| 13 | IoT + CAMERA | 35% — P44 (machine registry, operator guard, energy 501-phase, OEE semantik fix, crew POST) = struktural tayyorlik; P45 (checklist gate, GSD bridge, camera-AI, room-inspections, PPE/attendance tables) = schema+service qatlami; hali barcha endpoint va FE integrations yo'q, AI camera implementation yo'q |
| 14 | AI + AISHA | 15% (core schemas + decision logic sketched; massive wiring deps on P35/org/HR tayyorliklariga bag'liq) |
| 15 | LMS + ADAPTATION | 25% (ground truth: architecture = 100% decided; code structure exists but incomplete; DDL + core repos defined but GATED pending owner sign-off; FE pages stubbed) |
| 16 | POS + CC | 35% |

---

## 1. ORG + KARTALAR (org_functions, Vysotskiy-7 L0-L5, manager_id vertical, card-centric AI model, razryad, CKP)

**Build holati:** 28%

**Vizyon (egasi):** Card-centric organizational model where KARTA (job position/seat) is primary master data (org_functions table, 29-FK hub), XODIM (employee) is secondary (employee_cards M:N). Single unified org tree with 7 hierarchy levels (Egasi -> 7 Departments -> Subdivisions -> Sectors -> Positions). manager_id vertical = direct superior in tree (bevosita next level, not dept-head abstraction). Every karta mandatorily has: razryad (skill grade 1-6, configurable per card-type with exam_pass_threshold % and max_retakes count - owner master-data), oylik-type (hourly/daily/piecework + bonus), mandatory training (darslik), daily CKP/QYM metric, 6-section papka (task/responsibility/QYM/reglament/process/training with completeness%), AI fit-score (xodim matching analysis), portret (ideal profile - AI-generated etalon, HR-approved 3-side PDF). Xodim supports multi-karta: oylik sums across, appears at all tree positions. Karta NEVER hard-deleted (soft-archive only, full audit history immutable). Razryad changes trigger HR documents + certs + dual signature. All 20 ERP modules data-driven from single org_functions master. No two-world shadow-org (ikki-olam rejected) - single DDL, single source of truth.

**Asosiy qarorlar (intervyu javobi = spec):**
- Karta primary, xodim secondary (karta is organizational seat, not xodim-derived status). employee_cards M:N links.
- manager_id vertical = bevosita (immediate) superior only (not flattened dept-head)
- Razryad configurable per card-type: exam_pass_threshold %, max_retakes count = owner MUST provide master-data values (no hardcoded 70%/3 defaults)
- CKP/QYM kunlik hisobot: mashinasiz xodim = AI-bot daily (16h deadline or day-oylik=null); mashinachi = auto-MES/IoT
- Multi-karta oylik = sum arithmetic across stavka ulushi (fractions must total <=1.0, subject to owner approval)
- Karta soft-delete only (status=ARCHIVED, tarix full immutable, versioning enabled for changes)
- Darslik bound to KARTA not XODIM (if xodim changes, training remains with position)
- Vakant rahbar = no skip-escalation (subord work without leader, orphan up to head_user_id)
- 3-kun yo'q CKP = auto-profile-lock (auth block, dalhalsiz/sabab-yo'q / CKP-yo'q triggers)
- Razryad osish = test-pass + HR + direct-superior approval; Pasayishi = sabab + AI-suggestion + RD-4 confirmation
- 1 karta = 1 seat; duplicates = 01/02/03 suffixed raqamlar
- 6-section papka: struktura fixed (vazifa/javobgarlik/gsd/reglament/jarayon/talim), completeness% service-computed from sub-doc presence
- Portret = AI-generated ideal profile (P36 modul, etalon xodim benchmarks) + HR review + dual approval, stored org_node_portret.record_type=card
- Unit fields (Bo'lim->Sex->Uskuna->Ishchi ierarxiya): code VARCHAR(50), qym_uz TEXT, qym_ru TEXT, camera_zone_id TEXT, telegram_group_id TEXT
- Exam config: EP-ORG-055 = exam_pass_threshold (0-100%), EP-ORG-056 = max_retakes (0-10), both per-razryad-level, NULL = owner sets individually
- EP-ORG-066 multi-karta oylik overlap: stavka ulushi (0.5+0.5=1.0), monitor sum, owner approval for >1.0
- Karta-xodim fit = Central AI moslik-baho (EP-ORG-030: ЦКП/test/davomat/quality/direct-superior input) + 3-ton portret PDF export

**🟢 Hozir qurish mumkin (gate yo'q):**
- org_functions table + 29-FK schema (allaqachon mavjud, Drizzle sync P04)
- employee_cards M:N (raw SQL migration done, Drizzle sync P04)
- card_folders 6-section papka (raw SQL migration done, Drizzle sync P04)
- razryad_levels jadval + CRUD + 8-maydoni (6 existing rows, DDL + BE + FE ready for exam fields)
- orgFunctions.last_reviewed_at column (P07 migration done, Drizzle sync P04)
- CardDetailDialog 8-tab structure (tabs 1-6,8 real, tab 7=portret interim)
- Org hierarchy tree rendering + daraxt visualization
- manager_id vertical chain + eskalatsiya (code structure ready, data missing)
- Razryad badge rendering + razryad-color mapping by level
- Card CRUD endpoints (create/read/update/list + soft-delete archiving)
- Karta papka virtual folder rendering + section completion %
- CKP metric type selector (SON/FOIZ/VAQT tur)
- Card portret BE skeleton (GET/PUT endpoints, org_node_portret reuse)
- Zod validation schemas for card creation + razryad changes
- Result<T> pattern applied to card repository (no throw/null/undefined)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- org-unit-fields migration DDL (code/qym_uz/qym_ru/camera_zone_id/telegram_group_id columns) - owner approval
- razryad_levels exam config migration (exam_pass_threshold + max_retakes columns) - owner values (EP-ORG-055/056)
- org_node_portret.card_id column migration - owner sign-off (P04 DDL list)
- AI portret generation logic (P36 module, not in scope, feeds cards/:id/portret endpoint)
- AI moslik-baho service (P35 module, fit-score calculation xodim<->karta)
- manager_id backfill (P51 paket: org-tree derivation from head_user_id)
- owner MASTER-DATA completion: razryad exam thresholds, 7-dept heads, karta templates, CKP formulas, vakant-CKP rules, multi-karta oylik formula
- Portret AI-generation trigger (owner decision: auto vs manual)
- Workflow_rules gorizontal (new table, not in org-functions, owner/egasi model tasdiq)
- Integration tests covering full oltin-ip (orders->CKP->archive->payroll) - currently P08 manual curls
- UI stublar (EPComingSoon placeholders) - bayaniladigan real forms bilan almashtirish (deferred, not blockers)

**❓ Ochiq savollar (egasi DATA kerak):**
- owner: razryad exam exam_pass_threshold + max_retakes QIYMATLAR - har razryad-level uchun aniq qiymatlar kerak (6 existing rows backfill)
- owner: multi-karta oylik yig'ish FORMULA - asosiy karta 100%, qo'shimcha kartalar qanday % (30-50% tafsiya qilingan, owner final qaror)
- owner: portret AI-generate TRIGGER - avtomatik karta yaratilganda yoki HR qo'lda 'Generate' tugmasiga?
- owner: Razryad-level 'keyingi razryad + shart' DEFINITION - karyera yo'li har razryad uchun aniq (EP-ORG-091)
- owner: ЦКП formula TURLARI - miqdor%/sifat/muddat%/holat tur tanlovi har kartaga (EP-ORG-130)
- owner: Vakant karta CKP vaqtincha BAJARIVCHI - yuqori karta vs belgilangan qo'shni? (EP-ORG-136)
- owner: Rasmiy PDF 12-bo'lim shabloni IMZO-JOYLARI - PDF layout spec zavod standartiga mos
- owner: Korporativ telefon/abonent toifalar RUXSATI - how granular (all-comms vs limited)?
- AI: Gap-analiz METRIC - karta talabi vs xodim reality farqini qanday quantify qilish (EP-ORG-132)
- AI: Vorislar AI-TAKLIF - moslik balli tayyorlanganida, AI alts suggested (sabab bilan), inson tasdiqlaydi
- Tech (P04 DDL): org_departments unit-fields migration GATED (code ready, DDL awaits approval)
- Tech (P04 DDL): razryad_levels exam_pass_threshold + max_retakes migration GATED
- Tech (P04 DDL): org_node_portret.card_id column + index GATED (per-card portret lookup)
- Tech (P05 FE): exam_pass_threshold + max_retakes MAYDONLARI RazryadFormDialog'ga qo'shish
- Tech (P05 FE): Unit fields (code/qymUz/qymRu/cameraZoneId/telegramGroupId) AddNodeDialog + EditDialog'ga qo'shish
- Tech (P05 FE): Portret Tab 7 - EPComingSoon placeholder -> real form (AI-data + HR edit + save)
- Tech (P51): manager_id BACKFILL - org-structure daraxtdan derive (current head_user_id 18/142, manager_id 0/30)
- owner/HR: 7-Departament HEAD NAMES - master-ro'yxat qotirish (1-Xodimlar..7-Administratsiya)
- owner/HR: Adaptatsiya BOSQICHLARI - onboarding bosqichlar (draft->approved->training->exam->active) koeffitsientlar (0.7/0.85/1.0)
- owner/HR: Karta tasdiqlovchi IKKI IMZO - kim tasdiqlovchi RD, kim qabul (xodim) vs tanishuvchi

**📂 Manba:** docs/audit/decisions/01-org-kartalar.md (143 Q: 89 javob + 54 ochiq) · docs/audit/MASSIV-50/P04-ORG-KARTALAR-org-schema-ddl.md (DDL + BE mapping) · docs/audit/MASSIV-50/P05-ORG-org-card-portret-fe.md (FE forms + event emitting) · docs/audit/MASSIV-50/P51-ORG-manager-id-backfill.md (manager_id derivation) · docs/XARITA-REJA-YONALISH-2026-06-07.md (master vision + org-structure ildiz) · docs/audit/VISION-1000-JAVOBLAR-2026-06-08.md (1000-question answers section 01-org-kartalar) · docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md (Phase 1-7 layered architecture) · docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (founder interview raw, org-unit model) · docs/audit/00-INTERVYU-MOSLIK.md (decision-spec alignment check, org=QISMAN OK lekin unit-fields + exam-config DDL + manager_id backfill missing)

---

## 2. HR (Recruitment 7-Stage HC Funnel + LMS Card-Linked Darslik + Razryad-Coefficient Payroll + Daily-Report/KPI + Discipline + Decisions)

**Build holati:** 35%

**Vizyon (egasi):** HR module delivers seven-stage recruitment funnel (Portret→Qadoqlash→Oqim→Tez-jarayon→Baholash→Karta-tayinlash→Kuchaytirish) with AI-powered candidate screening (80% by Gemini LIVE), dual-mentor onboarding (adaptation + professional) tied to position card instructions, 7-factor rating system (norma % / davomat / sifat / staj / intizom / o'zaro-baho / AI-KPI) feeding payroll approval chain (AI→HR→Finance→Director→Cashier-PIN), tabel integration (leave → daily entries), discipline workflows (jarima/intizom with 6-month warning journals), contract 30-day expiry alerts, referral-bonus configuration per position, and LMS darslik binding to competency-based onboarding checklists. Card-centric architecture: position card defines requirements, onboarding plan, GSD targets, and career-path thresholds; employee profile mirrors card competencies; AI continuously matches card-to-actual performance (yield reports, discipline logs, daily-report completion) with asymmetric approval gates — negative impact (failure, demotion, dismissal) requires human sign-off, never auto-applied.

**Asosiy qarorlar (intervyu javobi = spec):**
- 7-stage recruitment funnel (PORTRET/QADOQLASH/OQIM/TEZ_JARAYON/BAHOLASH/KARTA_TAYINLASH/KUCHAYTIRISH + HIRED/REJECTED terminal states) is PRIMARY; legacy 12-stage DB mapping is compatibility layer, migrate to enum when P27 DDL approved
- 7-factor rating: norma% (MES norm-vs-actual), davomat (AI kamera), sifat (QC results), staj (hire_date auto), intizom (hr_discipline_logs), o'zaro-baho (peer-review per service-chain only), AI-KPI (daily_reports + ЦКП bajarilish); all factors SOURCE from system tables (pull pattern), API-input optional fallback only when source unavailable
- Rating thresholds A=85+/B=70-84/C<70 (foiz 0-100 shkala, NOT 0-5); bonus % formula per rating-class CONFIGURABLE (admin panel), EGASI QIYMATI KERAK for A/B/C percentages (hardcode forbidden)
- Payroll approval-chain: AI-check (reyting/tabel/brak anomaliya) → HR-approve (hisob to'g'riligi) → Finance-approve (GL/budget) → Director-approve (final) → Cashier-PIN-confirm (per-operatsiya PIN bilan, plain PIN HECH QACHON log); kettma-ketlik majburiy — prev stage approved bo'lmasa keyingi ochilmaydi
- Leave approve → tabel_entries: har ta'til so'rovi tasdiqlanganda leave_type (leave/sick/business_trip) bo'yicha kunlik yozuvlar avtomatik yaratiladi; oylik tabel asosida hisoblansa, data integrity majburiy
- Vacancy auto-yaratish offboarding'da: xodim bo'shatish yakunlanganda OFFBOARDING_COMPLETED event → VacancyOpenedEvent emit → karta avto-vakansiya yaratiladi (rekrutment boshlaydi)
- Referral-bonus: lavozim-bo'yicha konfiguratsiya (org_function_id → bonus_type sum/leave + bonus_amount + probation_days_req); probatsiya o'tgandan keyin bonus to'lanadi, EGASI qiymat admin-paneldan belgilaydi
- Dual-mentor: har xodim 2 mentor → adaptation_mentor_id + professional_mentor_id (mavjud bitta mentor_id → ikki-mentor jadvali yangi, old jadvallar saqlanadi Q-46 qoidasi bilan)
- Nazorat varaqasi: karta-yo'riqnomasi → elektron checklist (har band o'qidim tasdiqlash + sana + mentor tekshirish + mini-test), boshlanish/tugatish sana, kech qolsa → rahbar/HR ogohlantirish (cron)
- NDA: onboarding da bitta imzolash (hr_nda_records type='onboarding'), yillik choraklik shumlash (type='annual'), o'zgarishda (type='change') — har imzolash signature_hash + sana + tasdiqlovchi saqlaydi
- Kunlik hisobot deadline: 16:00 gacha topshirilsa o'sha kun hisoblanadi, 16:00'dan keyin topshirilmasa 'missed'; 15:00 eslatma; cron '0 16 * * 1-6' → markAbsentForDate; 20:00 cron o'chiriladi (16:00 da allaqachon ta'sir qo'llanildi)
- Operatsiya-norma katalogi: master-data (nom+norma+birlik); SkillsMatrix HR↔Production ko'prigi; xodim-operatsiya malaka matritsasi (kim nimani biladi + daraja); smena rejalashtirish avtomatlashadi
- Contract 30-day eslatma: cron '0 8 * * *' → employment_contracts WHERE end_date ≤ NOW() + 30 days AND status='active' → CONTRACT_EXPIRY_WARNING event
- Business-trip Finance-link: leave.service approval da leaveType='business_trip' → BUSINESS_TRIP_FINANCE_LINK event emit (Finance integratsiyasi Finance paketida; P28 faqat event qo'shadi)

**🟢 Hozir qurish mumkin (gate yo'q):**
- Recruitment funnel service refactor: legacy 12-stage → vizyon 7-stage enum (hrRecruitmentStageEnum), stage-vision label mapping (PORTRET/QADOQLASH/OQIM/TEZ_JARAYON/BAHOLASH/KARTA_TAYINLASH/KUCHAYTIRISH), Kanban getFunnelKanban() update — P28 QADAM 7
- Vacancy auto-yaratish listener: HrOffboardingService OFFBOARDING_COMPLETED → HrVacanciesService onOffboardingCompleted(payload) → createVacancy (org_function_id bilan) → VACANCY_OPENED event — P28 QADAM 4-6
- Leave approve → tabel yozuv: LeaveService.approve() → createTabelEntries (employee_id, start_date, end_date, entry_type) + TABEL_ENTRY_CREATED event — P28 QADAM 5, DB yo'q bo'lsa muqobil to'g'ridan Drizzle
- HROffboarding.tsx EPComingSoon bug tuzatish: isNotImplementedError check o'chiring, EPErrorState to'g'ri ko'rsating — P28 QADAM 9
- HRVacationSick.tsx approve/reject mutations qo'shish: approveLeaveMutation + rejectLeaveMutation + pending status uchun tugmalar (✓/✗) — P28 QADAM 10
- Kontrakt 30-day eslatma cron: CareerPathService checkContractExpiry() '0 8 * * *' → CONTRACT_EXPIRY_WARNING event (daysRemaining hisob, muqobil: direct Drizzle if repo o'zgartirish mumkin emas) — P28 QADAM 8
- HR-v2-events.ts yangi event konstantalari: VACANCY_OPENED, CONTRACT_EXPIRY_WARNING, BUSINESS_TRIP_FINANCE_LINK, TABEL_ENTRY_CREATED — P28 QADAM 1
- hr-recruitment-ext.ts schema: HrRecruitmentStageEnum, HR_RECRUITMENT_STAGE_ORDER, referral_bonus_config (pgTable), tabel_entries (pgTable) — P28 QADAM 2
- RecruitingKanban.tsx label moslashtirish: VISION_LABELS map qo'shish yoki recruitment-funnel.service dan import qilish — P28 QADAM 12
- HR leave-requests URL compat: FE-BE shartnomasi moslik (GET /api/hr/leave-requests vs /api/hr/leave) tekshiring, FE URL tuzatish yoki BE alias route qo'shish — P28 QADAM 11

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- P27 (Rating + Onboarding DDL): hr-rating-7factor-2026-06-19.sql + hr-onboarding-gaps-2026-06-19.sql + Drizzle schema (hr-rating.ts, hr-onboarding-extended.ts) — EGASI RUXSATI BILAN 'APPROVED:' izoh bo'lganda
- P28 (Recruitment/Leave/Offboarding DDL): hr-referral-bonus-config-2026-06-19.sql + hr-leave-tabel-contract-2026-06-19.sql — EGASI RUXSATI BILAN
- EGASI QIYMAT: bonus % formula (A/B/C foizlari) → hr_bonus_pct_config seed qatorlari → admin panelda to'ldiriladi, hardcode TAQIQ
- EGASI QIYMAT: referral_bonus_config seed → har lavozim uchun bonus_amount (sum UZS yoki ta'til kunlari) → admin panelda o'zgartiriladi
- EGASI QIYMAT: reyting chegara ballari (A=85 vs nima? foiz 0-100 shkala ondi?) — master rejada yoziladi
- EGASI QIYMAT: TB-instruktaj jurnali davriylik qoidalari (kirish=1 marta, birlamchi=yangi, takroriy=yillik/choraklik?) — kitobdan yoki regulatsiyadan
- FIN paketiga yoki P24'da: payroll_periods jadval, oylik tasdiq-zanjiri bilan integratsiya (hr_payroll_approval_log.payroll_period_id FK — sezimsiz ko'rinadilar lekin mutualizm kerak)
- AI Integratsiya moduli: 7-faktor AI bahosi (daily_reports + ЦКП bajarilish + AI moslik hisobot) — P36 AI yoki P27'da E-learning.
- LMS moduli: darslik-karta bog'lanishi, onboarding checklisti mini-test hisoblash, glossariy mo'ljalni — P34 yoki P27'da E-learning.
- Org-struktura (Vysotskiy-7): manager_id vertikal, horizontal workflow_rules, gorizontal signal — org-karta va coordination modullar bilan bog'lanadi

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-HR-012 (Reyting toifa chegaralari): A/B/C oralig'i egasi aniq belgilashinmi? Default A=85/B=70 tavsiya etilmoqda lekin EGASI QIYMATI KERAK — granular tafsilot (foiz vs ball, decimal/integer, round rules) bilan.
- EP-HR-014 (Reyting → bonus oqimi): bonus % formula (A→%, B→%, C→%) egasi qancha? Qoyilgan masalani tasdiqmagan — taklif oqimi va HR tasdiq jarayoni o'qimir lekin raqamli tafsilot OCHIQ.
- EP-HR-021 (Referral-bonus): lavozim bo'yicha bonus miqdori (sum yoki ta'til kunlari) nechasi? EGASI QIYMATI KERAK — har lavozim uchun admin paneldan sozlanadi, hardcode TAQIQ.
- EP-HR-042 (Energiya tejash javobgarligi): suv/gaz/svet tejash xodim javobgarligiga bandi sifatida kiritilsinmi yoki alohida tracking? OCHIQ — hozircha masuliyat band sifatida saqlanadi, keyin bo'lim resurs-metrikasiga ulash mumkin.
- EP-HR-047 (Glossariy): har yo'riqnoma uchun atama-lug'at (umumiy + lavozimga xos) bo'lishi kerakmi? LMS integratsiyasi tasdiqlanadi, glossariy granulasi OCHIQ.
- EP-HR-057 (Brak → mas'ul xodim → javobgarlik): brakni QC/MES ichida ko'radigan tizim, xodimga FK qo'shib jarimasini ulashni egasi HR savolida aniq tasdiqlamagan — E-learning BU qoidani bilsinmi?
- EP-HR-079 (TB-instruktaj jurnali): qonuniy davriy (kirish/birlamchi/takroriy + sana + imzo) instruktaj jurnali jadvali kerakmi? Favqulodda vaziyat hujjat auto bor (Q184), lekin davriy TB-instruktaj davriyligi OCHIQ.
- EP-HR-082 (Bekor turish → mas'ul lavozim → KPI): prostoy hodisasini MES/Production ko'radi, lekin mas'ul lavozim KPI siga ta'sir ulashni egasi aniq tasdiqlamagan — harake OCHIQ.
- Oylik tasdiq-zanjirida Payroll jadvali (payroll_periods) ownership: P27 scope HR, lekin payroll_periods FK FIN paketida — ketma-ketlik va idempotency qoidalari nima? P27 va FIN integratsiyasi OCHIQ.

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/02-hr.md — 82 ta savol, 73 javoblangan, 9 ochiq, EP-HR-001..082 · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P27-HR-hr-rating-onboarding.md — oylik tasdiq-zanjiri, 7-faktor reyting DDL, ikki-mentor, nazorat varaqasi, NDA, cron-fix (kunlik hisobot 16:00, contract 8:00) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P28-HR-hr-recruitment-leave.md — 7-bosqich recruitment, vacancy auto-yaratish, referral-bonus, leave→tabel, kontrakt eslatma, offboarding checkout, leave-requests URL, RecruitingKanban label, HRVacationSick mutations, HROffboarding EPComingSoon bug · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/_parts/hr.md — modul holati (route inventory 375, 200-REAL 352, 200-MOCK 5, 200-GREEN-LIE 5, DDL-NEEDED hr_referrals/hr_mentorship_pairings, data-integrity BUG enps surveyId=0) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/vision-questions-v2/02-hr.md — 52 ta kitob-asosli savol (EP-HR-031..082), Wysotskiy-7, standard 13-band lavozim yo'riqnomasi, ЦКП master-data, inspektor-AI buzilish, reyting/bonus/referral, discipline 7-bosqich, offboarding obxod-list, smena/operatsiya/contract, yillik anketа (choraklik), razryad attestatsiya · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (42,872 qator) — oylik tasdiq-zanjiri (AI→HR→moliya→direktor→kassir-PIN), 7-faktor reyting munfatti, ЦКП/GSD, inspektor kamera naschilar bahosi, recruitment AI 80%, dual mentor, nazorat varaqasi mini-test, davomat AI-kamera, tabel kunlik, offboarding exit-interview, leave 24s/avans 4s, contract expiry, razryad o'sish attestatsiya, xodim profil tarkibi, xizmat safari moliyaga ulanishi

---

## 3. SD Savdo (Sales Distribution)

**Build holati:** 35%

**Vizyon (egasi):** SD Savdo (Sales Distribution) is the T1 golden-thread core of EuroPrint ERP — the central pivot through which all 24,000 customers' orders flow from initial quotation through production planning (PP/MES), quality control (QC), warehouse (WMS), and finally to Finance (GL). The vision mandates that one sales_order.id tags every downstream record. The module is 70 percent code-built but only 35 percent functionally wired: 435 API routes exist but mostly return stubs. Current work spans 7 build phases: customer CRUD with ABC scoring, quotations with versioning/PDF, orders with state machines and golden-thread events, pricing formulas with tiered discounts, payment/debitor/delivery tracking with GL integration, KPI/leaderboard/reporting, and contracts/claims/archive. The 20 owner-confirmed decision overrides define priklad percent, klishe registries, cancellation penalties (30/70/100 percent staged), quantity tolerance, maket gates, source channels, change audit logs, and KPI targets per sales card. Canonical tables: sales_orders (write target), sd_sales_orders (VIEW only), warehouse_stock (inventory), entries (GL). Three MASSIV-50 P-file directives handle P09-DDL (10 golden-thread columns, 5 new audit tables), P10-backend (penalty logic, maket gates, MM signals, actual-quantity deviation), and P11-FE (4-tab OrderDetail, lost-order tracking, 360 product archive with repeat-order, leaderboard widget).

**Asosiy qarorlar (intervyu javobi = spec):**
- EP-SD-033: Priklad percent per product type (margin %) — owner-set master-data, NOT hardcoded; DEFERRED to PP/MES phase (requires product master collaboration)
- EP-SD-042/125: Klishe/stamp registry — customers pay once, factory stores ~3 years with auto-alert; repeat orders exempt from stamp charge
- EP-SD-069: Cancellation penalty staged — 30 percent (maket) / 70 percent (printed) / 100 percent (ready); percentages in sd_cancellation_penalty_config
- EP-SD-068: Quantity deviation tolerance ±N percent — calculation from actual produced quantity; tolerance_percent is owner-configured master-data, NOT hardcoded
- EP-SD-056/133: Maket approval gate — production BLOCKED without maket_approved=true; requires digital signature/approval date
- EP-SD-076: Source channel mandatory lookup — sd_source_channel_lookup master-data (telegram/call/website/repeat/referral); hardcoded IN-list PROHIBITED
- EP-SD-079/132: Change audit log — field-level tracking (orderId, fieldName, oldValue, newValue, changedBy, changedAt) in sd_order_change_log
- EP-SD-024: Lost order tracking — sd_lost_orders captures cancelled/lost orders with reason (price/timeline/competitor/quality/other)
- EP-SD-029: Price history audit — sd_price_history tracks all narx/discount changes (entityType, entityId, fieldName, old/newValue, actor, timestamp)
- EP-SD-101: 'Ozhd.Syryo' (waiting-for-materials) status auto-signals MM/Ta'minot procurement; visible to sales manager
- EP-SD-009-014: KPI targets per manager card — sd_kpi_targets stores (manager_id, year, month, revenueTarget, orderCountTarget, newCustomerTarget) UNIQUE constraint
- EP-SD-016/017: Leaderboard — weekly ranking by salesVsTarget percent (reja vs fakt); delta from previous week; top-N configurable
- EP-SD-019: RBAC per sales card razryad — discount approval tiers (0-5 percent menejer / 5-10 percent rahbar / 10+ percent komdir)
- Canonical tables (H1/H2/H3 hard rules): sales_orders (write), sd_sales_orders (VIEW only), warehouse_stock (inventory), entries (GL); NEVER gl_journal_entries/gl_lines

**🟢 Hozir qurish mumkin (gate yo'q):**
- P09-DDL schema changes: 10 golden-thread columns for sales_orders (source_channel, papka_number, zakaz_1s, direction, is_davalcheskoe, design_file_url, maket_approved, maket_approved_at/by, maket_file_url) + 5 new audit/config tables (sd_kpi_targets, sd_order_change_log, sd_lost_orders, sd_price_history, sd_cliche_registry, sd_cancellation_penalty_config) — pure structure, no AI/owner-data gates
- P10-backend logic: cancelOrder penalty calculation, maket gate verification, MM/procurement signals on status change, order change-log insertion, actual-quantity deviation tracking — pure code logic no owner-data except tolerance_percent lookup from DB
- P11-FE OrderDetail page: 4-tab layout (Buyurtma/Mahsulot/Maket/Tarix) with real data binding; Maket tab shows gate status (approved/blocked); Tarix tab queries change-log endpoint; Repeat-order button creates new order with old specs
- KPI dashboard components: KPI target setter form (Zod-validated POST), leaderboard widget (team ranking by salesVsTarget %), weekly KPI refresh cron (Monday 00:00 UTC)
- Customer 360 product archive tab: Historical order list per customer (GET /api/sd/customers/:id/order-history), 'repeat order' one-click action per row
- Lost-order tracking page: List with filter (reason/manager/period), CREATE dialog (order selection, reason enum, notes), DB-proof on lost-order INSERT
- Payment + debitor + delivery: Partial payment tracking, aging bucket dashboard (0-30/31-60/60+ days), delivery record with EXTERNAL_OUT dual-approval (warehouse manager + finance)
- GL integration: On payment confirmed, INSERT to entries (Debit kassa/bank | Credit debitor); outbox event for consistency

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- EP-SD-033 (Priklad percent master-data): Requires PP/MES product-type master-data design (not owned by SD) — deferred to Phase 4 when PP/MES module specifies product catalog structure
- Tolerance_percent default/business rule: Owner must provide — is 10 percent global hardcoded, or per-product-type, or per-order input? If NULL in DB, what is system fallback? (WARN log vs silent default vs 500 error)
- Source_channel_lookup initial seed: Owner-data — 5 initial values provided (telegram/call/website/repeat/referral) but extensibility policy (admin-only add vs code-only) not stated
- Klishe registry auto-alert recipient: Organizational routing rule — which employee card(s) receive 3-year expiry notification? (affects org-structure integration; currently org-chart is skeleton-only with 0/142 manager_id filled)
- KPI target-setter access control: Exactly which razryads can set targets for whom? Self+subordinates? Only rahbar for all team? (affects RBAC gate design; currently RolesGuard not wired on sd-dashboard.controller)
- Maket approval digital signature: eSignature tech (PDF cert, PIN-based, OAuth third-party) — affects data model (hash vs plain PIN); currently only boolean flag designed
- Repeat-order flow: Preserves maket approval status or always requires new? Preserves discount tiers or recalculates? Affects order-confirmation gate logic and customer UX
- Monday digest cron: 00:00 UTC or 09:00 Tashkent? Weekly Monday 00:00 or department-local Monday start? (affects multi-tenancy design if any); currently NotificationsModule outbox pattern not fully wired
- Manager_id backfill: 30/142 org nodes have NULL manager_id; SD build cannot proceed without this org-chart data (currently ORG module is skeleton: head_user_id 18/142, manager_id 0/30 filled); blocks org-routing approval gates for KP/discounts
- CRP/production capacity link (EP-SD-103): AI promise-date suggestion requires live CRP/MPS data; MES module build status unknown — may block Phase 3 order-confirmation

**❓ Ochiq savollar (egasi DATA kerak):**
- Who confirms maket approval (digital signature PIN) — sales manager or production/design department head? (affects RBAC gate design)
- What is the exact master-data structure for source_channel_lookup — open-ended string or closed enum in seed SQL? (5 initial values: telegram/call/website/repeat/referral; extensible?)
- Does tolerance_percent apply per-order or globally to all SD orders? Is it stored in sd_order_tolerance_config (new master-data table) or in organizational settings?
- For EP-SD-016 leaderboard: How are 'top-N managers' determined — by company, by department, by razryad? Weekly calculation cron trigger day/time?
- Klishe registry 3-year expiry alert — who receives the notification (design dept, production manager, sales)? Auto-block creation of new design with expired stamp?
- KPI maqsad (target) setter — only sotuv rahbari or komdir can set per-manager targets? Historical tracking of target changes?
- Are lost orders reported separately to komdir weekly, or aggregated in Monday digest? Competitor intelligence capture optional or required?
- Does 'repeat order' preserve maket approval status from previous order, or always require new approval? (affects UX for repeat-order button)

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MUSLIMBEK-PROMT-04-SD-2026-06-08.md (31,651 bytes) — full SD build 7-phase prompt, 6 cross-cutting principles, 7 stop points · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P09-SD-sd-schema-ddl.md (73,177 bytes) — DDL directive: 10 golden-thread columns, 5 new audit tables, Drizzle schema for sd-kpi-targets.ts and sd-change-log.ts, migration SQL template · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P10-SD-sd-backend-logic.md (67,484 bytes) — backend directive: cancelOrder penalty, maket gates, MM signals, change-log, actual-quantity deviation, 12 owned files · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P11-SD-sd-frontend.md (95,421 bytes) — FE directive: OrderDetail 4-tab, lost-orders tracking, customer 360 archive, leaderboard, repeat-order button, 7 owned files · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/XARITA-REJA-YONALISH-2026-06-07.md (14,712 bytes) — master vision map: SD = T1 golden-thread core, 24,000 customers, 70% code-built 35% wired · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/CLAUDE.md (Uzbek project rules: Qoida 1-23 code style, Qoida A/B security, Qoida 6 controller-is-transport, Qoida 12 magic numbers → business.constants.ts) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/agent-constitution.md (governance: verify-don't-trust, ruxsat gate, no rewrite, DDL = owner approval)

---

## 4. PP Ishlab chiqarish (Production Planning)

**Build holati:** 35% (foundation structure + decision mapping done; core PP service logic ~30% ready; 3-gate approval logic blocked on DDL; gofra formula service structured but pending master-data values; FE 360° dashboard stub; multiple critical open owner decisions)

**Vizyon (egasi):** Production Planning module is the "golden thread" (oltin-ip) core of EuroPrint ERP, connecting sales orders to manufacturing execution through integrated planning. Owner vision defines: (1) **Tech-card lifecycle** with 6 required elements (material type, print parameters, cutting, mold, finishing, sequence) versioned with 3-gate approval (maket/lab/material); (2) **7-status production order cycle** (reja → tasdiqlangan → ishga_tushgan → jarayonda → sifatda → tugadi → yopildi, with terminal bekor/toxtatilgan) with audit trail; (3) **Non-linear routing graph** with operation sequence (10-lik qadam), machine binding + alternates, norma (dona/soat/smena), setup time, scrap %; (4) **Gofra/sloy 3-formula converter** (kg ↔ m² ↔ list) with take-up factors, gramaj, chiqindi % as configurable master-data (HARDCODE forbidden); (5) **Frozen-window + priority policy** (ZARUR flag, frozen_until guardian) per kitob policy with YOZMA (written) change log + sabab (reason); (6) **Kunlik (daily) aniq reja** + taxminiy oylik for planning horizon, with real-time status dispatch to MES tablets. All policies sourced from owner-signed manufacturing regulations (RD5 §B1-7).

**Asosiy qarorlar (intervyu javobi = spec):**
- Reja tuzilmasi: bitta aniq stanok + muqobil ro'yxati (EP-PP-033)
- Rejalashtirish ufqi: kunlik aniq (kitob '1 sutkalik reja') + oylik taxminiy (EP-PP-001/067)
- 7-status lifecycle: reja → tasdiqlangan → ishga_tushgan → jarayonda → sifatda → tugadi → yopildi + terminal bekor/toxtatilgan (EP-PP-082/118)
- 3-darvoza (EP-PP-091/123/068): maket-rahbar + laborant + material tekshiruvi tutiladi 'reja' holatida, tasdiqlanganga o'tishdan oldin
- Texkarta 6-element (EP-PP-012/089): material turi + bosma parametrlari (rang/profil/registr/plotnost) + kesim + qolip + qo'shimcha ishlovlar + ish tartibi
- Versiyalash qoida (EP-PP-014/037): har o'zgarish = yangi versiya + tarix, dublikat sikl yirtib tashlanadi
- Reja-o'zgartirish: YOZMA (Bitrix/A-System) majburiy, sabab + tashabbuskor + 5-sabab-kodi (material/dastgoh/kadr/texno/reja-xato) (EP-PP-001)
- Frozen zone (EP-PP-025/117): yaqin N kun 'muzlatilgan', faqat egasi/direktor o'zgartira oladi, reja o'zgarishi YOZMA tasdiqsiz TAQIQ
- ZARUR flag (EP-PP-030/097): shoshilinch belgi → eng kam ta'sir bilan joylashtirib, surilgan buyurtmalarni ko'rsatadi
- Gofra 3-formula (EP-PP-094/P53): m² = yoyilgan_size × chiqindi_koeff; kg = m² × grammaj_gsm / 1000; grammaj = liner1 + liner2 + (flute × take_up) — barcha koeff master-datadan (hardcode TAQIQ)
- Kundalik reja uygulanuvchiligi (EP-PP-053): to'rtta kesim (buyurtma/stanok/smena/ishchi) drill-down, reja-fakt tahlili oylik KPI asosi
- Material-to'liqlik (EP-PP-006/007): rejalashtirish A-System orqali BARCHA material tekshiradi; uzoq-keladigan yo'q → zakaz rejaga kiritilmaydi + surish; mayda → ish boshlanishidan oldin
- BOM (EP-PP-089): operatsiya darajasidagi material_code + quantity (kg/list) + layer, MRP bu jadvaldan o'qiydi
- Stanok yuklanishi (EP-PP-004/005): tizim eng bo'sh+mos stanokni taklif qiladi, master tasdiqlaydi; Gantt taxi (yashil/qizil) ko'rsatiladi
- Norma tahlili (EP-PP-041/045): texnolog 'reja normasi' kiritadi + tizim haqiqiy o'rtachani ko'rsatadi (og'ish visible), KPI = norma bajarilish % (fakt/reja×100)
- Smena tuzilmasi (EP-PP-016/072): real '2 smena' (kunduzgi/tungi) — 25-04.xlsx tasdiqlaydi; razryad (EP-PP-018) muqobil stanok tanloviga ta'sir
- Setup vaqti (EP-PP-035/101): partiyaga bir martalik + ishlash normasi alohida; o'xshash ishlar ketma-ket = setup tejash (gang run)
- Preemption TAQIQ (EP-PP-061): «Har biri zakaz 100% yakbunlangandan sungg keyingi zakaza o'tiladi» — zarur bo'lsa YOZMA reja o'zgarishi kerak
- MES tableti (EP-PP-029/115): smena boshlanishida har stanok bugungi buyurtmalar tartibi + normasi start/stop tugma bilan
- Bekor/Toxtatilgan-sabab majburiy (EP-PP-082): reja-status-log jadvalida from_status, to_status, changed_by, reason yoziladi

**🟢 Hozir qurish mumkin (gate yo'q):**
- P13 QADAM 1-2-3b: Production order 7-status lifecycle logic (BE service + controller + status transition validation + audit log) — no AI key, no owner-data (transitions are decided); migration STRUCTURE yoziladi, ISHGA TUSHIRILMAYDI (egasi APPROVED qo'shadi)
- P13 QADAM 3c: frozen_until guard in pp-orders.controller (role check); ZARUR flag handling structure
- P13 QADAM 5-6: TechCards.tsx delete mutation + ProductionOrder360.tsx 7-status badge fallback (FE-only, no BE dependency)
- P13 QADAM 4b: pp.module.ts registration of P14/P53 providers (P13 = single owner of pp.module.ts)
- P53-Wave1: Drizzle schema (pp-gofra-formula.ts) with pgTable structures for pp_flute_types, pp_material_profiles, pp_conversion_log — structure is pure code, not owner-data-dependent
- P53-Wave2: GofraConversionService 3-formula logic (pure algorithms: kg↔m²↔list) — code structure buildable WITHOUT master-data values (null-guards + warnings issued)
- P53: Repository + DTO + Controller interfaces — DDD structure ready
- Tech-card 6-element structure in BOM table (migration pending P12 approval); technology.repository raw SQL to Drizzle ORM migration path clear
- Real reja-fakt 4-kesim (drill-down: buyurtma/stanok/smena/ishchi) aggregation logic structure (query buildable once pp_plan_fact_entries final schema from P12)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- AI-rejalashtirish scope (EP-PP-003/130..136) — scope/integration with external AI service undefined; P17 AI module pairing
- P13 DDL migration ISHGA TUSHIRISH (p13-pp-techcard-lifecycle.sql) — gated on P12 migration APPROVED + executed; 3-darvoza ustunlari (maket_approved, lab_approved, material_gate_ok) depend on P12 production_orders schema finalized
- P53 master-data seed values (21 material profiles, flute take-up factors, waste_pct, sheet dimensions) — OWNER MUST PROVIDE actual numerical values; seed migration STRUCTURE ready, VALUES NULL/placeholder pending egasi input
- P53 DDL ISHGA TUSHIRISH (p53-gofra-sloy-formula.sql) — gated on P12 DDL done; owner must review/approve formula logic before migration execution
- Lab approval gate logic (EP-PP-091) — depends on org-role 'laborant' defined in HR/auth module (QAY org-struktura?)
- Maket approval gate logic (EP-PP-123) — depends on 'dizayn-rahbar' role definition (Part of org-struktura?)
- Material gate via MRP/CRP (EP-PP-068) — depends on WMS material reservation system + CRP algo finalization (later packages)
- Frozen zone duration parameter (EP-PP-025) — owner decision on 'N kun' length (1/3/5/7?)
- Parallel order priority formula (EP-PP-010/58) — owner must specify weight distribution for 'muhimlik + muddat + mijoz-toifasi' ranking
- Gang-run grouping algorithm (EP-PP-011) — owner must clarify: full-auto AI vs master-manual vs hybrid trigger
- ATP (Available-to-Promise) calculation formula (EP-PP-024/066) — depends on CRP capacity algo + real smena schedule finalized
- Stanok OEE/efficiency_rate source (EP-PP-051) — depends on IoT data integration + MES real-time capture finalized
- Reja-fakt Pareto AI analysis (EP-PP-136) — depends on P17 AI module scope
- Brak → Qayta-ishlash flow (EP-PP-093) — unclear if separate order or return-lot marking; process flow from QC needed
- MES tableti integration (EP-PP-029/115) — depends on MES module package building start/stop capture
- ZARUR flag insertion trigger (EP-PP-030) — owner must clarify: operator UI click → automatic surge, or approval gate required
- Konversiya service integratsiyasi SD (narx) va MES (norma) — deferred to later packages; PP service buildable stand-alone

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-PP-003: AI-rejalashtirish darajasi — QAY DARAJADA AI taklif qiladi? (vizyonda: AI taklif → odam tahrir+tasdiqlash, lekin xavfsizlik/scope?)
- EP-PP-004/017: Operator malakasi (razryad) rejaga ta'sir — KIM tekshiradi va QACHON? (vizyonda 'tizim ogohlantiradi', lekin blocking yoki warning?)
- EP-PP-009: Quvvat oshganda yechim — A variant (AI taklif: smena qo'shish/buyurtma surish/boshqa stanokka o'tkazish) QAY bittasi default? Egasi prioritizatsiyasi kerak
- EP-PP-010/058: Parallel buyurtmalar tartibi — 'Muhimlik + muddat + mijoz toifasi' FORMULA? (weight percentage?) Qaysi 'muhimlik' metriki? Real 25-04.xlsx qaysi ustunga jo'natsak bo'ladi?
- EP-PP-011: Parallel buyurtmalarni birlashtirish (gang run) — KIM (AI/master/tizim) guruhlab taklif qiladi? va QAY CHOG'I?
- EP-PP-019: Stanok ish vaqti normalarinin manbasi — IoT/MES haqiqiy o'rtacha QANDAY TARTEZBDA ishlatiladi? (to'liq to'g'rilash / weighted-average / sample statistics?)
- EP-PP-022: Reja buzilganda qayta rejalashtirish — AVTOMATIK avtoteg-sursin emas (kitob: YOZMA shart), lekin QAYSI trigger qayta hisoblaydi? (o'lgani o'tsa / downtime signali / CRP overload?)
- EP-PP-024 vs EP-PP-066: ATP (Available-to-Promise) sanasi — kitob 'material tekshiruvi' bilan bog'lanadi, lekin CRP/smena o'rtacha asosida 'real sana' qanday hisoblansa? (tarix = bugun + material lead time + CRP qo'sh slot?)
- EP-PP-025: Frozen zone davomiylik (N kun) — SONI? (1/3/5/7 kun?)
- EP-PP-030: Shoshilinch buyurtma — KIRITISH tartibi? (Operator bosilsan ZARUR flag → avtomatik surish yoki manual ruxsat kerak?)
- EP-PP-031: AI maslahatchisining tushuntirishi — TEN LANG SDK bilan integr yoki plain JSON text? (front-end da rendering?)
- EP-PP-039: Mahsulot parametrlari (karton spetsifikatsiyasi) — JAMI parametr soni? (bozor standartida 8-10 ta, real EuroPrint?)
- EP-PP-040: O'lchov birligi list ↔ dona konversiya — STI JAX? (list_soni = ummumiy_dona / dona_per_list yoki sheet-size formula?)
- EP-PP-043: Norma tiraj kattalgiga bog'liqlik — 'kichik tiraj' CHEGARA? (100-dona / 500-dona / 1000-dona? va norma sekinroq VAQT?)
- EP-PP-046: Stanok kartasi — 'Tizimda kod/nom/tur/quvvat/soatlik-xarajat allaqachon bor' — QAY jadvalda? (equipment? machinery?)
- EP-PP-048: Stanok ish jadvali — 'Har stanok smena soni har xil' — SIQIMIC SONI / REAL SMENAlar? (3-shift gofroagregat real? ma'lumot manbai?) va BAYRAM/DAM OLISH kalendarni KIM tuzadi?
- EP-PP-050: Stanok format chegarasi — 'max/min format' — MASTER-DATA JADVALIDA SAQLANSA? (equipment master? technology_constraints?)
- EP-PP-051: Stanok OEE/samaradorlik — 'haqiqiy natijadan yangilanadi' — QAYSI MODUL INSERT? (IoT/MES? Daily? Weekly?)
- EP-PP-054: Reja-fakt — 'miqdor, vaqt, muddat, tannarx og'ishi alohida' — STOR FORULA? (vaqt og'ishi = fakt_vaqt - reja_vaqt? muddat og'ishi = tug'gan_sana - muddat_sana?)
- EP-PP-055: Reja-fakt sabab kodi — 5 guruh + 'boshqa/izoh' — IZOH MAJBURIY-MI? (ruhda 'Izohsiz yopilgan reja = bajarilmagan', lekin FE turi text/select/both?)
- EP-PP-057: Reja-fakt yopish vaqti — 'smena oxirida usta hisoboti' JOYIGA? (KIM? texnolog/shifton/masterlar? FE shabloni?)
- EP-PP-063: Qisman bajarish (split) — kitob 'režа parčalab bаjarilmaydi' (ISH 100% birgalikda), lekin split-delivery (GOODS qisman) RUXSAT? (Egasi aniqlaydi — 2-qaror?)
- EP-PP-084/097: Navbat (queue) jadval — HOZIR mavjud-MI? ('Очеред'/'ЗАРУР' ustunlari 25-04.xlsx'da, lekin DB jadval?)
- EP-PP-090: Lab tasdiq darvozasi (EP-PP-091) — LAB ROLI kimdir? ('Laborant' yoki separate org-rolle?)
- EP-PP-093: Brak qayta-chiqarish — 'partiya qayta ishlashga' — MES-ichida SEPARATE operations? (brak = new production order? return-lot?)
- EP-PP-096/110: Kichik buyurtmalar (small-batch economics) — 'samaradorlik' THRESHOLD? (list soni <50 edisman = kichik? formula?)
- EP-PP-101: Rang-guruh (priladka) — QAYSI FORMAT? (rang kodi number? CMYK? Pantone?)
- EP-PP-106: Mahsulot-takror (repeat product) — O'TGAN FAKTNI QAYSI JADVALDAN OLINADI? (sales_orders history? production_orders history?)
- EP-PP-120: Bandlik dashboard — REAL-TIME (MES/IoT sync) yoki BATCH (oylik sync)?
- EP-PP-121: Stanok ro'yxati — '22+ stanok' HOZIR — TIT JADVALDA SAQLANSA? (equipment? machinery? REAL codb?)
- EP-PP-123: Maket darvozasi — 'DIZAYN-RAHBAR tasdiq' — KIM USHBU ROLGA? (org-struktura: 5-Departament katta + kit designer?)
- EP-PP-131: Xodim-cheklovli CRP — 'Smena uchun xodim bolmasa CRP zariladi' — QANDAY CHO'NG? (optimal vs pessimistic estimate?)
- EP-PP-135: Norma kalibrlash (normalize) — AI/ML agent yoki statistik? (exponential moving average? linear regression?)
- EP-PP-136: Reja-fakt Pareto (80/20 analysis) — KIM BAJARADI? (AI agent? Shuni qaytariladi FE uchun?)
- P53-Gofra: 21 material seed — Egasi QA NI, QAYSI QIYMATLARI KERAK? (hali placeholder NULL — egasi INSERT qiladi yoki migration-o'qidingiz?)
- P53-Gofra: Flute take-up faktor — Dunyo standartida (ISO 4046) taxminiy qiymatlar (A≈1.53, B≈1.31, C≈1.43) — EuroPrint ZAVODI REAL O'LCHOVI NIMA? (egasi QC measurement o'tkazdi-mi?)
- P53-Gofra: Konversiya service — PP ichida joylashadi, lekin SD (narx = sloy + ustama) va MES (norma = list + m²) integratsiyasi BUYCHIK paketti-mi yoki keyingi?

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/07-pp.md (1003 qator; v1 Q1-Q31 + v2 Q32-Q136 comprehensive decision map) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P13-PP-pp-techcard-lifecycle.md (1221 qator; 7-status lifecycle, 3-darvoza, DDL gated, Wave 2 backend) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P53-PP-gofra-sloy-formula.md (1429 qator; 3-formula structure, master-data jadvallari, DDL gated, owner decisions kerak) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/kitob-extracted/RD5__Абдуллаев Баходиржон.md (owner-signed manufacturing policy; §B production planning policies B1-B7; referenced in 07-pp.md) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/LOYIHA_QOIDALARI.md (17 bo'lim architecture rules, DB, DDD, Q-24..Q-47 operational governance) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/CLAUDE.md (CLAUDE-code harness rules, Q-39 regression-safety, Q-40 real≠works, Q-46 dead-code, MASTER-CHECKLIST Sprint-0 100%)

---

## 5. MES (Manufacturing Execution System) — Sessions, 3-stage lifecycle, 4-level OEE, downtime reasons, shifts/handover, per-sex norma (Module 08)

**Build holati:** 35%

**Vizyon (egasi):** MES moduli EuroPrint zavodining yurak urishi — har bir mashinadagi ishlab chiqarishni real vaqtda boshqaradi. Asosiy vizyon: (1) har sessiya 3 aniq bosqichdan iborat (SOZLASH→ASOSIY→YAKUNLASH) timestamp tracking bilan; (2) OEE 4 darajada hisob-kitob (mashina/smena/brigada/sex); (3) uchlik tekshiruvi (umumiy_son/brak_soni/sof_mahsulot tenglamasi); (4) downtime toifalanishi (material/texnologik/sifat/kadr/режа-хато/бошқа); (5) smena handover + majburiy sabab izohli reja-fakt taqqoslash; (6) AI kunlik xulosa + brigadani harakat mavzuiga bog'lash. Kitob (Станоклар норма + А смена План + Кун тартиби) va karta-model (per-operator GSD + oylik zanjiri) birgalikda ishlab turadi. Owner: 82 ta savol (33 javoblangan, 49 ochiq — A-default tavsiya bilan). P16 paketi OEE engine va 3-bosqich lifecycle ni qurayapti; DDL GATED (egasi ruxsati kerak).

**Asosiy qarorlar (intervyu javobi = spec):**
- 3-bosqich session lifecycle (SOZLASH→ASOSIY→YAKUNLASH) — timestamp tracking majburiy; qaytarish taqiq (EP-MES-001, owner override)
- 4-daraja OEE aggregatsiya: machine (equipmentId) / shift (date) / brigade (workerId) / shop (jami) — har daraja alohida endpoint parametri (EP-MES-014, owner override)
- OEE Availability = netRunTime / scheduledTime, bu yerda netRunTime = runningTime − sozlashVaqti (Phase 1 DDL GATED; Phase 2 haqiqiy qiymat) — CONFORM-FIX ozod muammosi
- Uchlik tekshiruvi majburiy: sof_mahsulot === umumiy_son − brak_soni → noto'g'ri bo'lsa 400 Zod xato (EP-MES-060)
- Qo'lda kiritish (operator qo'lda belgilaydigan bosqich) — IoT sensorsiz, Excel+tablet shakli (EP-MES-080, EP-MES-002)
- Downtime toifalanishi: 6 toifa (material/texnologik/sifat/kadr/režа-хато/бошқa) + master-data kodlari (15-25 ta) — kitob izohlari asosida (EP-MES-010/011)
- Norma manbai: texkarta (PP modulidan) — yagona manba, dublikat taqiq (EP-MES-007, kitob Тех карта сиёсати)
- Doimiy brigada + smena A/B/C biriktirish (HR), kunlik o'zgarish (kasallik/ta'til) qayd etiladi (EP-MES-062, EP-MES-061)
- Smena-xulosa yozma majburiy: reja-fakt-sabab + 6 toifali downtime sabab ajratish + hech qachon og'zaki rad etilmaydi (kitob Сменалик режани назорат siyosati)
- Handover: rasmiy yozuvi (tugamagan ish + nosozlik + izoh) — keyingi smena tasdiqlaydi; bajarilmagan reja sababsiz ko'chib qolmaydi (EP-MES-023)
- AI kunlik xulosa: top yo'qotish + brigada reyting + takror sabab + tavsiya (EP-MES-079, 460 javob AI nazoratni qattiq talab qiladi)
- Operator kartasiga ulash: har sessiya/brigada natijasi GSD bajarilishiga yoziladi → oylik/reyting/o'sish zanjiriga (karta-model, MEMORY org_card_centric)
- Bonus A/B/C toifasi va per-sex norma — owner qiymati belgilashi kerak (hardcode taqiq)
- master-data ikki bosqichli tasdiq: РД-4 (НО-mas'ul) + direktor, versiya + sana saqlanadi (EP-MES-055/056)
- complete-with-triple endpoint: to'g'ri tenglama → 501 NOT_IMPLEMENTED (P17 da to'liq DB yozuv); noto'g'ri → 400 Zod xato (Q-40 CONFORM-FIX — avval soxta 200 edi)

**🟢 Hozir qurish mumkin (gate yo'q):**
- MES 3-bosqich session lifecycle — aggregate MesStage enum + advanceStage() metod + timestamps (F2)
- GetOeeHandler — production_sessions jadvalidan o'qish + 4-daraja aggregatsiya + to'g'ri formulalar (F1, CONFORM-FIX sozlash ajratish)
- AdvanceStageHandler CQRS command + /advance-stage endpoint (F3, F4)
- AdvanceStageSchema + CompleteWithTripleSchema Zod DTOlari (F5)
- Drizzle schema stage + timestamp ustunlar (F6, DDL GATED)
- OEE 4-darajali endpoint (machine/shift/brigade/shop) — qaytarish struktura
- Uchlik tenglama validatsiyasi (Zod .refine bilan) — 400 qaytarish
- complete-with-triple endpoint — 501 NOT_IMPLEMENTED (Q-40 conform, P17 ga defer)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- mes.module.ts — AdvanceStageHandler handlers[] ga ro'yxatdan o'tkazish (egasi ruxsati kerak)
- DDL migration d6-production-sessions-stage-cols.sql ishga tushirish (APPROVED — egasi ruxsati + sana kerak)
- complete-with-triple to'liq DB yozuv (P17 scope — CompleteSessionHandler extend, triple parametr + production_sessions UPDATE)
- OEE-target alert (EP-MES-015) — P12+Phase6 DDL + equipment.oee_target master-data + EGASI QIYMATI
- Smena handover avto-cron 15-daqiqa (EP-MES-023 davomi) — P15 scope tekshirilsin
- Bonus A/B/C tasdiq + FIN/Payroll integratsiya (P27/P28 HR paketi)
- ~30 mashina seed (IOT P44/P45 — kross-paket muammosi hal qilinsin)
- Karta-model + GSD bahola zanjiriga ulash (ORG/KARTALAR poydevor kerak, MEMORY qaydlarining implementatsiyasi)
- norma_hourly Performance hisob-kitobi (P12+Phase6 DDL, EGASI QIYMATI per mashina turi)
- TB-checklist tablet oqimi (P17 DDL GATED)
- AI-token + kamera integratsiya (production-agent + monitoring, EP-MES-028/079)
- WMS real-time sarf chegirma + GL darhol yozuv (P24 WMS + P26 FIN paketlari)

**❓ Ochiq savollar (egasi DATA kerak):**
- EGASI QIYMATI: OEE-target maqsad (equipment.oee_target) — Phase 6 DDL + har mashina/sex uchun default qiymat (P12 keyin)
- EGASI QIYMATI: Bonus A toifasi summasi (kiritilgan so'm, foiz emas) — HR tasdiq zanjiri bilan (P27/P28)
- EGASI QIYMATI: norma_hourly (Performance formulasi uchun) — har mashina turi uchun (P12+Phase6 DDL)
- ~30 ta mashina nomlari seed (Станоклар kitob: SM-52, SM-72, KBA-105, Tigellar 1-10 va boshqalar) — IOT P44/P45 paketiga tegishli; kross-paket muammosi hal qilinishi kerak
- Smena handover 15-daqiqali avto-jadval — messy cron 5-daqiqada kutish vaqti tekshirsa avto-handover — P15 scope?
- TB-checklist tablet oqimi — P17 DDL (mes_safety_checklist_items) GATED, keyin FE modal+IoT endpoint
- Karta-modelda brigada natija bog'lanishi — per-operator GSD + yordamchi hissa ajratish qoida (razryad bo'yicha?)
- "O'quv/Akademiya" ishi LMS bilan sinxronizatsiya — hozir alohida ka'y yoziladimi, yoki faqat flag?
- Qayta ishlangan mahsulot (переделka) — GL'ga alohida tannarx modda sifatida yozilish (mehnat + material)

**📂 Manba:** docs/audit/decisions/08-mes.md (MES Decision Map — 82 savol, 33 javoblangan, 49 ochiq A-default tavsiya) · docs/audit/MASSIV-50/P16-MES-mes-oee-stages.md (Wave 2, P16 direktiva — 1640 satr, 0-7 qadam kod, DDL GATED, qabul mezoni, DB-proof, CONFORM-FIX §9) · docs/audit/vision-1000-answers/08-mes.md (50 ta tavsiya-javob owner override bilan) · docs/audit/vision-questions/08-mes.md (v1 — 30 ta savol, A/B/C variantlar) · docs/audit/vision-questions-v2/08-mes.md (v2 — 52 ta kitob-grounded savol) · Kitob manbai: А смена План.xlsx, Станоклар норма.xlsx, Кун тартиби, Заявка бумаги.xlsx, smena-xulosa sabab izohlari, 2021 ShVB mustaqil-ish siyosati · EUROPRINT_BARCHA_JAVOBLAR.md (460 real javob: Q116/Q119 avto-kunlik hisobot, Q132/Q133 smena roli, Q88/Q108 AI kamera, Q98 ideal-xona) · Karta-model vizyon (MEMORY org_card_centric, operator→GSD→oylik zanjiri) · docs/XARITA-REJA-YONALISH (master vizyon map — modul konteksti) · docs/audit/00-INTERVYU-MOSLIK.md (§2 MES QISMAN moslik, §9 CONFORM-FIX DEFER jadvali)

---

## 6. QC Sifat (Quality Control)

**Build holati:** 42%

**Vizyon (egasi):** QC Sifat (Sifat Nazorati) is the T1 critical "golden-thread" inspection module for EuroPrint ERP. The module enforces quality gates at 4 inspection points (HOP-4: material intake → pressing → assembly → final) following РД-5 "stepwise control" policy. Inspections are planned per product (technology card), use AQL 2.5 sampling, and capture defects by severity (CRITICAL/MAJOR/MINOR) with automated FAIL decisions for critical defects. QC outputs 3 verdicts: PASS (→ warehouse), REWORK (→ MES rework session), SCRAP (→ write-off). Defect root-cause analysis, supplier ratings, and traceability (material lot ↔ production session ↔ sales order) prevent recurrence. Visual normalization (print color/registration against approved sample) and chemical safety (food-contact materials) are mandatory for export customers.

**Asosiy qarorlar (intervyu javobi = spec):**
- EP-QC-001: HOP-4 inspection points (material → pressing → assembly → final) — ANSWERED (4 gates) by РД-5
- EP-QC-002: Inspection plan bound to technology card/product — ANSWERED (per-mahsulot plan mandatory)
- EP-QC-003: AQL standard 2.5 (namuna lot-size → Ac/Re tables) — OCHIQ (ISO 2859-1 vs MIL-STD-1916; A-default: 7-row simplified table)
- EP-QC-005: Defect severity 3 grades (CRITICAL/MAJOR/MINOR) with AQL — OCHIQ (grade thresholds egasi data)
- EP-QC-006: 3-step approval chain (Design → Technologist → QC) — ANSWERED (5-Dept policy)
- EP-QC-007: Hard block (production closed without approvals) — ANSWERED (MES gate)
- EP-QC-008: Final QC gate blocks shipment — ANSWERED (POS Q31 model)
- EP-QC-009: Automatic quarantine (DEFECTIVE/QUARANTINE/QC zones) — ANSWERED (POS Q30 model)
- EP-QC-010: Brak disposal (QABUL/REWORK/CHIQARISH) 3-decision — ANSWERED (POS Q31 model)
- EP-QC-011: Reclamation form (customer complaint journal) — ANSWERED (qcReclamations table exists)
- EP-QC-012: Trace reclamation to order+batch+shift+material-lot — ANSWERED (traceability design)
- EP-QC-013: Root-cause 5-Why analysis + corrective action — ANSWERED (Совершенствование monthly cycle)
- EP-QC-014: Quality certificate (PDF + QR) — OCHIQ (template fields egasi data)
- EP-QC-015: Physical norms (gramaj/thickness/RCT/BCT/Bursting) — OCHIQ (min/max ranges egasi data)
- EP-QC-016: Chemical safety (food-contact): kraft→food INVALID, cream/white→food OK — ANSWERED (kirov policy)
- EP-QC-017: Lab results auto-validate vs norms (pass/fail) — ANSWERED (Drizzle comparison logic)
- EP-QC-018: DPMO trend + sigma dashboard — OCHIQ (simplest = monthly brak %; egasi wants sigma?)
- EP-QC-019: Role-based dashboard (Director trend, QC detail, Inspector task) — ANSWERED (5-Dept roles)
- EP-QC-020: Pareto analysis (top defect reasons) — ANSWERED (80-20 rule, automatic)
- EP-QC-021: Inspection role (operator self-check, ОТК final) — ANSWERED (РД-5 hierarchy)
- EP-QC-022: Operator self-check on card (ЦКП tied) — ANSWERED (karta-model integration)
- EP-QC-023: Sifat score → GSD/ЦКП → bonus — ANSWERED (karta-model weekly sync)
- EP-QC-024: Anomaly alert (Telegram threshold breach) — ANSWERED (СОЗ notification chain)
- EP-QC-025: Cost of Quality (material + labor + rework + reclamation) — OCHIQ (formula egasi data)
- EP-QC-026: Supplier rating (kirim brak %) — ANSWERED (kirim QC → vendor reyting)
- EP-QC-027: Normativ version control (master copy, 'active' flag) — ANSWERED (lavozim folder model)
- EP-QC-028: Mobile inspection (tablet photo + checklist offline) — ANSWERED (POS Monitor)
- EP-QC-029: QC gate integration (PASS→next/ombor; FAIL→karantin) — ANSWERED (full event flow)
- EP-QC-030: Rework re-inspection (must pass before ship) — ANSWERED (POS Q31 rework loop)
- EP-QC-031–054: AQL table details (lot ranges, sample sizes) — OCHIQ (specific ISO 2859-1 edition/values)
- EP-QC-055–057: Sampling rules + enhanced/reduced modes — OCHIQ (trigger conditions egasi data)
- EP-QC-058: Archive sample storage (6mo retention, location tracking) — OCHIQ (storage duration egasi)
- EP-QC-060–064: Certificate template (fields, numbering, signature, QR) — OCHIQ (design egasi)
- EP-QC-065: Block shipment without QC approval (override rationale) — ANSWERED (final gate)
- EP-QC-066–070: Return processing (receive form, re-inspect, credit-note) — ANSWERED (Finance link)
- EP-QC-071–072: Quarantine status + Sort grades (1/2/3/brak narx-coeff) — ANSWERED (3-status model)
- EP-QC-073–075: Equipment calibration + retest rules — OCHIQ (intervals egasi data)
- EP-QC-076–077: Tech card binding + KPI stats (oylik % brak, FTQ) — ANSWERED (HR/MES link)
- EP-QC-078–079: Supplier rating + photo evidence (mandatory) — ANSWERED (evidence requirement)
- EP-QC-080: Food-contact material restrictions — ANSWERED (makatura→food BANNED)
- EP-QC-090: Defect source (incoming vs current-stage) — OCHIQ (accountability: kimga jarima)
- EP-QC-101–134: Advanced topics (Pareto, CAPA, internal/external brak, lead-time impact)

**🟢 Hozir qurish mumkin (gate yo'q):**
- QC defect catalog (CRUD): seed-05 approved, DDL ready (P18), schema-misc-qc.ts defined, no AI/owner-data gate
- AQL table: DDL migration P18-d2 ready (7-row ISO 2859-1), Drizzle schema complete, `/api/qc/aql` endpoint (P18 owned)
- Sort levels (1/2/3/brak): Drizzle schema + CRUD endpoints (P18), no AI gate (price_coeff defaults sufficient for structure)
- Pre-production checklist: Repository + service layer + Drizzle schema pattern (P19), form binding pure TypeScript
- Defect root-cause (5-Why): Domain model (qcRootCauses table exists), repository shell ready (P19), no AI
- Reclamation lifecycle: qcReclamations table exists, CREATE/STATUS/TRACE endpoints, no AI (structured SLA/escalation)
- QC dashboard KPI cards: Drizzle aggregations (open_defects, brak_7days, pending_inspections), no training needed
- MES→QC gate fix: mes-completed.listener order_id routing (P07), create-inspection pre-claim bug fix (P07)
- QC→MES rework bridge: QcFailedReworkListener (P07), production_sessions INSERT status='rework', pure logic
- Pareto/trend queries: Standard SQL GROUP BY + HAVING, no ML (simple defect frequency rank)
- Supplier rating: Kirim QC (brak %) aggregation, no external API
- Photo/evidence storage: File upload integration (POS Monitor path), generic file I/O

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- EP-QC-005/090 defect severity + source: DDL columns (defect_weight, defect_source, sort_grade) GATED behind P02 merge + owner APPROVED (P07-d1 migration)
- EP-QC-072 sort price coefficients: Master-data table (qc_sort_price_config) DDL GATED; price_ratio values = owner decision (P07-d1 seed NULL placeholder)
- EP-QC-025 Cost of Quality formula: Finance module collaboration (WIP → payroll → COGS mapping) = parallel P25 Finance
- EP-QC-046 warranty window (14d vs product-specific): requires product master-data expansion (P01 Material Card extended)
- EP-QC-014 certificate template: UX design review (egasi visual approval required before FE template render)
- Food-contact chemistry checks (EP-QC-016/080): potential external lab API (3rd-party cert integration) = future scope / manual entry for now
- EP-QC-018 DPMO/sigma: Optional KPI (can defer to Wave 4); currently monthly brak % suffices

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-QC-003: ISO 2859-1 edition (7-row Level II simplif.) vs MIL-STD-1916 (11-row)? Current: 7-row ISO default.
- EP-QC-005: MAJOR/MINOR tolerance percentages (Ac/Re when AQL rule applies)? CRITICAL=0% auto-fail.
- EP-QC-014–064: Certificate template fields exact? Customer name, GOST/TU ref, test table layout, signature block?
- EP-QC-015: Min/max for gramaj/thickness/RCT/BCT (all materials or per-type e.g., white 170–350 g/m²)?
- EP-QC-025: COQ formula: material waste + labor×hours + rework-cost + reclamation-credit? Depreciation?
- EP-QC-046: Warranty window per product type (standart 14d, namlik 7d)? Auto-reject after deadline?
- EP-QC-055: Sampling points rule (first/middle/last vs every N roll)? N value?
- EP-QC-058: Archive sample retention 6 months or longer? Location tracking (bin/shelf)?
- EP-QC-072: Sort 2 & Sort 3 price coefficients (0.70, 0.50 example or egasi numbers)?
- EP-QC-073: Equipment calibration interval (monthly, quarterly)? Overdue warning threshold?
- EP-QC-090: Blame attribution rules (incoming=supplier jarima, current=production jarima)? Automation vs manual?

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/vision-questions/09-qc.md (v1: 30 Qs, EP-QC-001–030) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/09-qc.md (decision-map: 134 consolidated Qs with РД-5 grounding) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P18-QC-qc-masterdata-ddl.md (defect_catalog + AQL + sort-levels DDL+schema) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P19-QC-qc-gates-fe.md (reclamation lifecycle + FE pages + handler fixes) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P07-GOLDEN-golden-qc-rework.md (MES→QC→MES 3-decision fix + defect_weight/defect_source/sort_grade DDL) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/migration/seed/seed-05-defects.sql (25 defects: DEF-U/G/O/S/F codes, approved 2026-06-18) · РД-5 Абдуллаев (kitob extract, 1751–1845): босқичма-босқич control policy, ОТК/СОЗ/Совершенствование roles, sabab-ajratish · POS QC javoblari (EUROPRINT_BARCHA_JAVOBLAR.md): Q26 DAMAGE→QC, Q29 Checklist+Photo, Q30 karantin, Q31 3-qaror, Q97 AI ideal-image, Q98 kamera 2-hourly · LOYIHA_QOIDALARI.md §23: karta-model vizyon (operator GSD ↔ sifat KPI), Совершенствование monthly cycle

---

## 7. WMS Ombor — Warehouse Management System

**Build holati:** 42%

**Vizyon (egasi):** The WMS Ombor module manages complete warehouse operations for EuroPrint including 7 warehouse types (ROLL_PAPER, FINISHED_GOODS, RAW_MATERIAL, HOUSEHOLD, EQUIPMENT, TOOLS, SCRAP_BRAK), FEFO/FIFO batch management, rulon (paper roll) tracking with gramaj/width/diameter specifications, inventory with ABC classification and cycle counting, karantin (quarantine) workflows integrated with QC gates, rental warehouse tracking for customer materials, real-time stock synchronization with MES production, movement numbering (HOM-KIRIM-2026-00001 format), structured locator system (Zone-Row-Shelf-Cell), and GL integration for all transactions. Core decisions: warehouse_stock as canonical stock table (vs stocks parallel-world), FIFO pricing (vs weighted average), FEFO for expiry-sensitive materials (adhesives/paints), owner_type field (EuroPrint vs CLIENT davalistic), synchronized with POS Monitor tablet interface for factory floor operations. Total 134 decision questions across v1 (31) and v2 (103); 75 answered (via POS Q15-60 + book logistics section + ShVB vision), 59 open pending owner clarification.

**Asosiy qarorlar (intervyu javobi = spec):**
- Canonical stock table = warehouse_stock (not stocks parallel duplicate); current_stock as view
- 7 warehouse types seeded: ROLL_PAPER, FINISHED_GOODS, RAW_MATERIAL, HOUSEHOLD, EQUIPMENT, TOOLS, SCRAP_BRAK
- All external inbound → QUARANTINE first, QC gate releases to free zone or REWORK/RETURN per POS Q30-31
- FIFO pricing standard (POS Q35 override); FEFO for expiry materials (adhesives/paints/chemicals)
- Rulon (paper roll) as unique tracked unit: width/diameter/gramaj (60-500 g/m²)/weight/type/supplier/certificate/received_date/humidity/zone
- Movement numbering format: {warehouse_type}-{action_type}-{year}-{5-digit sequence}
- Structured locator: Zone-Row-Shelf-Cell (A-12-3-2 format) with auto empty-slot suggestion
- Batch tracking with yaroqlilik muddati (expiry date) → FEFO logic + advance warning (30/15/7 days configurable)
- Inventory cycle counting: ABC-driven frequency (A=weekly, B=monthly, C=yearly); 1-3 accuracy% threshold
- Karantin (quarantine) status blocks MES material use; 3 QC outcomes: QABUL (free zone), REWORK (MES), CHIQARISH (return to supplier)
- owner_type field: US (EuroPrint) or CLIENT_{id} (davalistic/customer materials); customer materials only for that customer's orders
- Rental warehouse tracking: customer material storage fee GL integration (volume×day/fixed monthly/pallet×day rates)
- Технical card material matching validation: blocks issue if gramaj/layer mismatch (±5 g/m² tolerance, 3/5 gofra separation)
- Real-time stock synchronization with MES: reservation + auto-deduction on production
- Anti negative-balance: Assets fully block; consumables warn + require approval
- Finished goods (FG) auto-receipt from MES; separate zone from raw materials; lahtak (offcut) tracking enabled
- POS Monitor role isolation: factory tablet for quick scan operations; WMS for complete mgmt/reporting
- ABC analysis auto-calculated; dead-stock flag (N-day no movement) + aging report
- Low-stock alerts to warehouse keeper + procurement + warehouse manager + Telegram; auto-PR trigger (pending owner model)
- Daily stock report auto-generated (morning to leadership); kunlik accounting culture from book

**🟢 Hozir qurish mumkin (gate yo'q):**
- Warehouse types seed (7 types + DEPARTMENT generic) — no external deps
- Rulon (roll_cards) table schema + DDL migration (gated) — no AI, no owner data
- Movement numbering: movement_sequences table + generate_wms_movement_number() function — pure structure
- Structured locator schema: warehouse_locations table (Zone-Row-Shelf-Cell format) — no owner decisions needed, pure structure
- Quarantine workflow: QUARANTINE warehouse type seed + QC gate integration (already in QC module) — structural only
- FIFO/FEFO batch logic skeleton: material pricing enum + batch expiry date field (no calculation yet)
- Owner_type field (US vs CLIENT_{id}) in warehouse_stock — schema only, no logic
- Daily stock report CRON task skeleton with CC/NTF integration (no calculation formulas yet)
- Warehouse operations audit log structure (har amal → log entry) — pure DDL + trigger
- Cycle counting ABC frequency mapping (A/B/C to count frequency) — configuration data, no algorithm
- Low-stock alert schema (threshold + recipients) — no auto-PR logic yet (gated on owner model)
- Roll card QR/barcode label printing skeleton — integrates with existing POS label system

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- AI integration: IoT sensor anomaly thresholds (namlik/harorat tolerance values — ESP32 setup) + anomaly handler AI — P35 AI module needed
- Owner data: All 17 open questions (min/max/reorder calcs, dead-stock threshold days, DEPARTMENT overflow logic, lahtak assignment workflow, import lead-time safety buffer, supplier rating formula, material substitute approval chain, GSD AI-baho sub-assignment, deadline for bekor causation, grammaj tolerance ±%, kunlik report timing, critical material warning distribution, dead-stock discount %, weight scale frequency/automation)
- Locked modules/parallel: P04 ORG (org_functions.id FK for DEPARTMENT warehouse type) — warehouse types partially blocked on org card finalization
- POS Monitor integration: POS tablet barcode scan → warehouse_stock update (P48-P49 POS backend logic)
- MES integration: production order material reservation + auto-deduction logic (P16 MES OEE stages)
- QC gate integration: karantin release outcomes (QABUL/REWORK/CHIQARISH) — glued to P19 QC gates FE
- Finance GL: movement → GL entry auto-posting (payment 5-step AI calc) — P24 FIN GL core
- PP tech-card validation: tech_card_materials matching on issue — P13 PP tech-card lifecycle
- Organizational KPI: GSD omborchi rating (aniqlik%, kirim/chiqim speed, low-stock states) + AI-baho — P27 HR rating + P36 AI CKP

**❓ Ochiq savollar (egasi DATA kerak):**
- Toleransi qiymat (±%) kirimda kam/ortiq miqdor uchun (v2 Q87): nechanchi foiz avto-qabul, undan tashqari tasdiq?
- Min/max/reorder darajalar avtohisob modeli: sarfga qarab dinamik qayta hisob (oxirgi 3-6 oy) necha kundan keyin?
- Sekin aylanuvchi zaxira (dead-stock) chegara: nechanchi kun harakatlanmasa eski deb hisoblanadi?
- DEPARTMENT_* ichki ombor yaratilishi: har bo'lim avtomatik ombor yaratilsinmi, overflow mantig'i nima (asosiy to'lib ketsa DEPARTMENT'ga o'tkazish)?
- Lahtak (offcut) tayinlash: qaysi menejerga, qaysi omborga, GL-yozuvi qanday (zarar vs ikkilamchi zaxira)?
- Import lead-time + reorder: import buyurtma qancha kun erta boshlanadi (lead-time + safety buffer)?
- Supplier reliability rating: avtomatik reytingga qaysi parametrlar ta'sir qiladi (kechikish pesi, brak soni)?
- Yetkazib berishni tasdiqlash (v2 Q99): haydovchi qaytganda yo'l asosida 'qisman yetkazildi' uchun qaror qanday?
- Material reservatsiya (v2 Q69): reja material bandlasa, bu band qancha vaqt tutiladi (bekor qilinmasa)?
- Material almashtirish (substitute) ruxsati: qaysi rollar analog ruxsat beradi, rukhsat etilgan analoglar ro'yxati kim tuzadi?
- Ombor inspeksiyasi AI kamera bilan (HR Q97-98): har 2 soatda real vaqtda nazorat, o'zgarish jo'natilsinmi yoki faqat kunlik report?
- Bekor turish (downtime) sababi 'logistika yetishmasligi': BOM hazirlanganidan qancha vaqt o'tgach sabab kodini qo'shish kerak?
- Grammaj toleransi kirimda (v2 Q60): ±% necha, nominal vs o'lchangan gramaj farqi qancha bo'lsa karantin?
- Kunlik qoldiq hisoboti (Q107 vs Q013): Ombor menejer qaysi vaqtda (ertalab 8:00? kunning boshida?), qaysi ma'lumotlar qamraladi (harakat summasi vs to'liq audit)?
- Критик material yetishmovchiligi signali (v2 Q77): prognoz N kunma, qaysi bitta signal-oluvchi yoki bir nechta (Taъminot+IchLog vs barcha rahbarlar)?
- Material yamonilikka uchun biznes qaror: o'lik zaxira (dead-stock) sotish chegirma % necha, koga tasodifan (Sotuv vs ombor)?
- Tarozi-ulanish (v2 Q34): rulon qoldig'ini kg bo'yicha o'lchash qo'lda (operator) yoki avtomatik tarozi, va necha marta?

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/10-warehouse.md (964 lines, EP-WMS-001..134, v1=31 answered, v2=103, 75 total answered, 59 open, 2 conflicts: narxlash FIFO/average, kanonik warehouse_stock/stocks) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P20-WMS-wms-schema-ddl.md (locator + roll-card + movement-numbering DDL spec, Wave 1, gated DDL gate: true, APPROVED comments required) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P21-WMS-wms-backend-logic.md (backend service layer spec, WmsRollCardService, WmsRollCardRepository, FIFO/FEFO query patterns, tech-card validation validateForIssue, Result<T> pattern, Zod schemas CreateRollCardSchema/WeighRollSchema) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASTER-SAVOL-JAVOB-2026-06-08.md (founder comprehensive Q&A; POS Q15-60 warehouse operations, ombor kassiri interview contexts) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/kitob-extracted/ (internal logistics, supply, delivery department head instructions: topleyner vs местный, gramaj, 3/5 gofra, poddon, rohler, bekor turish, waste/scrap, customer materials; critical for v2 Q53-Q103 grounding) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md (EP-kod action types: CREATE/READ/UPDATE/DELETE/APPROVE/REJECT/EVENT/CRON/AI/LOGIN/EXPORT — action mapping) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/00-INTERVYU-MOSLIK.md (MASSIV-50 coverage cross-check: 00-INTERVYU-MOSLIK §2 WMS flags missing DEPARTMENT_*, lahtak specs — owner clarification needed) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/00-VIZYON-QOPLAMA.md (master vision structure: warehouse types, rulon tracking, FIFO/FEFO, karantin, POS Monitor role isolation, GL integration)

---

## 8. MM Materiallar (Material Cards, Purchase Orders, Vendors, 3-Way Match, 21-Material Seed)

**Build holati:** 40%

**Vizyon (egasi):** MM / Ta'minot (Procurement) is a T1-core module implementing the complete P2P supply chain: requisition → approval → purchase order → goods receipt → quality control → warehouse storage → payment → GL posting. The module manages vendor master-data (5 statuses, 6 types, mandatory rekvizits), purchase requisitions with automated drafting from min-stock and BOM demand, POs with 7 statuses and real vendor JOINs, goods receipt with quarantine and laboratory gates (РД-5: namlik/gramaj/ECT checks), vendor rating formula (sifat 40% + muddat 30% + narx 20% + hujjat 10%), finance integration (creditor AP, 3-way match tolerance, GL posting), and internal logistics (FIFO/FEFO, bin locations, transport master-data). Owner-approved decisions ground the module in ShVB budjet-ariza (ЗНО/ЗВС), kitob РД-5 laboratory standards, POS Q21–Q60 goods receipt flows, and material master-data from 21 seed categories. Transport fuel formulas (EP-MM-062/063/064) remain pending owner 10-question deep-dive session; marked as 501 stubs.

**Asosiy qarorlar (intervyu javobi = spec):**
- Vendor status: 5-holat (Faol/Yangi-tekshiruvda/To'xtatilgan/Qora-ro'yxat/Arxiv); Qora-ro'yxat blocks PO entirely — EP-MM-004/039
- Vendor type: 6 preset types (xom-ashyo/kimyo/ehtiyot-qism/xizmat/yoqilg'i/transport) mandatory on card — EP-MM-038
- Vendor rekvizits: name, STIR/INN, bank_account, MFO, legal_address, phone, contact_person mandatory; saving blocked if missing — EP-MM-037
- PO number format: PO-2026-000123 (year-sequential, not epoch) — EP-MM-005
- PO vendor name: real JOIN from mm_vendors, not hardcoded 'Vendor #N' — EP-MM-006
- PO 7 statuses: Qoralama/Yuborildi/Tasdiqlandi/Qisman-keldi/To'liq-keldi/Yopildi/Bekor — EP-MM-031/050
- Purchase Requisition: 7 fields (material/qty/unit/needed-by-date/reason/which-order/estimated-price); source tracked (manual/min-stock/bom-demand) — EP-MM-046
- Approval chain: configurable summits (<5M → supply head, 5–50M → finance, >50M → director); currency-agnostic (UZS/USD at current rate) — EP-MM-024/025/047
- Currency: store original_currency + mb_rate + uzs_amount at receipt date; both fields saved (owner override EP-MM-054) — EP-MM-034/054
- Vendor rating: sifat 40% + muddat 30% + narx 20% + hujjat 10% (weights configurable, not hardcoded) — EP-MM-002/040
- 3-way match: PO ≈ Receipt ≈ Invoice within ±3% (configurable); mismatch blocks payment pending approval — EP-MM-018/052
- Tender comparison: 3+ quotations in 5-column table (narx/muddat/to'lov/reyting/masofa); human selects; if not-cheapest, reason mandatory — EP-MM-056/057
- Goods receipt: linked to PO, per-line 'ordered/received/remaining' visible; EXTERNAL_IN 5-step flow (WMS/POS alignment) — EP-MM-011/051
- Quarantine: raw materials (kraft/chemistry) → quarantine first; QC clearance → main warehouse; РД-5 laboratory gate — EP-MM-014/072/090
- Lab gate (РД-5): namlik%/gramaj/qalinlik/material-mark/ECT; 3 decisions (passed/conditional/rejected); conditional requires authorization with restriction note — EP-MM-090/095
- Moisture auto-quarantine: namlik > configurable threshold (material-specific, not hardcoded) → auto-quarantine + vendor claim — EP-MM-091
- Rejection: creates return doc (reason/qty/sum); ombor chiqim; vendor debt reduced or credit-note — EP-MM-013/076
- Partial delivery: status 'Qisman-keldi' until remaining=0; per-line tracking active — EP-MM-012/078
- Min-stock trigger: automatic draft requisition (qty = max − current); supply manager confirms; linked to material_cards — EP-MM-069/009
- BOM→requisition: texkarta sarf × order qty = material demand → auto-draft; connects PP MRP service — EP-MM-129
- Price history: auto-save after each purchase (date/price/vendor/qty); chart on material card; alert ±10% yellow, ±25% red — EP-MM-007/053/055
- Vendor documents tab: contract (number/date/expiry/scan/payment-terms), certificates/licenses; 30-day expiry warning CRON — EP-MM-030/042/079
- Vendor contact history: date/who/topic/result log (CRM pattern reuse) — EP-MM-085
- Conflict-of-interest: 'related-party' checkbox (employee/relative + who); requires higher-level approval in PO flow — EP-MM-102
- Payment terms: on contract (prepayment/postpay + delay days); Finance auto-calculates due-date from receipt date — EP-MM-043/067
- Vendor reconciliation act: auto per any period (opening + receipts + payments = closing); PDF export — EP-MM-083
- AP aging: 0-30/31-60/60+ days buckets; payment-due CRON 3 days before + overdue red flag + director alert — EP-MM-015/016/017/066
- GL posting on receipt: Debit (materials)/Credit (accounts payable) to canonical gl_entries only; ЗНО/ЗВС flow via Finance — EP-MM-023/026
- Procurement budget: monthly budget (total + per category); 90% alert, 100% director approval — EP-MM-081
- Supplier KPI panel: vaqtida%/narx tejovi/brak%/qarz aylanishi/faol PO soni; links to org-card ЦКП — EP-MM-028/137
- Lead time: per-vendor lead time stored; system alerts 'order by X date to receive by Y date' — EP-MM-070
- Transport master-data: vehicle register (make/plate/fuel-norm l/100km) + driver register; structure only (fuel formulas 501 pending) — EP-MM-020/059/060
- Material o'lcham conversion: primary unit + conversion coefficient (1 rulon = N kg); auto in PO/receipt — EP-MM-086

**🟢 Hozir qurish mumkin (gate yo'q):**
- P22 Phase 1 DDL (vendor card kengaytmasi): 4 migrations ready for owner signature — vendor columns + documents + contact-history jadvallari + CHECK constraints; no external dependencies.
- Vendor CRUD endpoints (POST/PATCH/DELETE /api/mm/vendors): real DB ops; add new form fields to BE validation (Zod) + FE form.
- Purchase requisition full CRUD: 7-field spec ready; source tracking; configurable thresholds; missing: urgent flag UI + reject-reason dialog (FE only, 30min).
- PO CRUD with proper vendor JOIN: repair hardcoded 'Vendor #N' → real mm_vendors link; fix po_number format; 7-status CHECK; urgency checkbox (FE, 1 hour).
- Goods receipt ↔ PO linkage: per-line 'ordered/received/remaining' display; partial delivery tracking; missing: karantin_status + lab_status UI (1.5 hours).
- Approval chain engine: thresholds configurable; RBAC guards exist; missing: urgent fast-path SMS + Telegram notification (2 hours if bot ready).
- Vendor rating weights storage: mm_vendor_rating_weights schema ready; missing: auto-recalc EVENT + UI display composite_score (2 hours).
- Material cards basic integration: canonical table exists; missing: auto-draft requisition EVENT trigger + lead-time per vendor (2 hours schema + 3 hours logic).
- Price history capture: structure ready; missing: POST handler on receipt + material card chart UI (1 hour).
- 3-way match setup: DB schema ready; missing: variance %-calc (15min) + payment block enforcement (pending Finance module).
- Document upload infrastructure: FE file-input exists; missing: vendor-document storage (Cloud/S3 path) + scan URL persistence (30min if URL only).

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- P22 P1-P4 migrations (DDL Gate): 4 SQL files ready; BLOCKED until owner signs `-- APPROVED: <owner name> <date>` in each.
- AI token (MRP/BOM link): PP MRP service partially built; material demand array → MM requisition auto-draft EVENT needs AI planning logic.
- Owner-DATA (namlik threshold per material): EP-MM-091 needs per-material-mark thresholds (toplejner vs mahalliy). Must be provided before QC lab gate auto-trigger.
- Owner-DATA (fuel formulas): EP-MM-062/063/064 require owner 10-question deep-dive. Transport master-data buildable; formulas remain 501 stubs.
- Owner-DATA (3-way match tolerance %): currently hardcoded ±3%; must confirm if fixed or configurable per vendor/import/material.
- Owner-DATA (vendor types finalization): 6 types confirmed; if configurable (not hardcoded), needs mm_vendor_types lookup table + seed.
- Finance module GL posting coordination (EP-MM-026): MM receipt → gl_entries requires Finance endpoint approval + validation rules.
- WMS EXTERNAL_IN 5-step alignment (EP-MM-014/072): MM goods_receipt must link to WMS/POS EXTERNAL_IN event.
- QC lab gate labor-resource (EP-MM-090): РД-5 requires qualified laborant assignment; permission gate before auto-block.
- Telegram bot integration (EP-MM-036/088): tasdiq so'rovi + muddati o'tgan ogohlantirish → Telegram Mini App endpoint.
- Parallel-locked crm-ai-ai_agents (seasonal forecast): EP-MM-139 marked AI action; deferred pending AI agent team scope.
- SD integration (customer-supplied materials, trafaret/klishe, outbound delivery): coordinate with SD P22 phase field mappings + events.
- HR org-chart integration (EP-MM-102): conflict-of-interest flag check requires HR API to verify employee/relative relationships.

**❓ Ochiq savollar (egasi DATA kerak):**
- Moisture threshold (namlik) per material type: which materials have which %-cutoff? Owner must define per material_mark (toplejner vs mahalliy rulon different) before QC lab validations run.
- 3-way match tolerance ±3%: is this fixed or configurable per material/vendor/import status? Should move to mm_approval_thresholds or material-vendor-specific table.
- PO auto-close logic: exact conditions for 'closed' state — (mol to'liq qabul) AND (all docs attached) AND (payment completed)? Partial auto-close forbidden; need precise definition.
- Vendor blacklist handling in PO flow: when 'Qora-ro'yxat' status blocks, at which step (draft/confirm/send)? BE check currently absent.
- Seasonal forecast (EP-MM-139): AI draft + manager confirm, or full manual? No endpoint exists; model/logic undefined.
- Material o'rnini bosuvchi (analog) approval: any manager approve, or strictly laborant? Lab gate EP-MM-099 (композиция tasdig) required.
- Komissiya qabuli for expensive batches (EP-MM-136): threshold sum to trigger multi-signature? No definition.
- Fuel accounting formulas (EP-MM-062/063/064): PENDING owner 10-question deep-dive. Do not build until owner completes interview.
- NDS flag (EP-MM-080): used in tender comparison cost — Finance module hasn't confirmed GL posting impact.
- Rekvizit change approval (EP-MM-089): who approves (director only, or finance head sufficient)?
- Conflict-of-interest escalation (EP-MM-102): which approval level required for related-party vendors?
- Contract payment-terms integration (EP-MM-043): PO inherit automatically or manual override allowed?
- AP aging vs FIN module boundary: MM provides mm_vendor_invoices; FIN handles aging view. Interface undefined.

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MUSLIMBEK-PROMT-09-MM-2026-06-08.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P22-MM-mm-schema-backend.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P23-MM-mm-frontend.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/11-mm.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/LOYIHA-QOIDALARI-2026-06-08.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/EUROPRINT_BARCHA_JAVOBLAR.md

---

## 9. FINANCE + KASSIR (Moliya moduli + Kassir markazasi)

**Build holati:** 35–40% (GL core P24 + P25 real, KASSIR schema tavvik, ZVS/ZNO schema + partial endpoints; yoq: KASSIR full controllers, P26 podotchet, FE cost-center/kassir pages, aging 90+ cron trigger, kunlik PDF, P52 cost-center, DDL APPROVED)

**Vizyon (egasi):** FINANCE + KASSIR is the T1 financial backbone of EuroPrint ERP. The module implements a canonical double-entry general ledger (`entries` table), 4-account grouping (MAIN/TAX/HEAD/WORKING), period locking, and comprehensive cash management through the KASSIR sub-module. Cross-module money flows (payroll, POS, sales orders, material usage, QC defects) automatically post to GL via events. Additional features include: ZVS/ZNO approval workflows with org-chart routing, employee advance tracking (podotchet), AP/AR invoicing with aging, departmental budgets tied to cards, financial planning cycle (FP-cycle) with Telegram notifications, and configurable revenue distribution across 4-account groups. The module enforces immutable periods, balanced journal entries, and tracks cost centers (org_departments nodes) with per-gender GL reporting for departmental accountability.

**Asosiy qarorlar (intervyu javobi = spec):**
- Kanonik GL = `entries` jadval (ikki tomonlama, balansli); SAP `gl_journal_entries`/`gl_lines` TEGMA (forbidden) — Q-37 (/XARITA-REJA-YONALISH §2.7)
- 4-hisob gruplash = BHMS diapazonlar: MAIN 9000–9999 (foyda/zarar), TAX 6000–6999 (majburiy to'lovlar), HEAD 8000–8999 (kapital/zaxiralar), WORKING 1000–5999 (aylanma kapital) — EP-FIN-004 / MUSLIMBEK-10 Phase 1
- Davr yopish (EP-FIN-064) = qulflangan davr → yangi GL yozuvi TAQIQ; faqat egasi/moliya rahbari ochadi; immutable (kanonik qoida H-section)
- ZVS/ZNO approval matrix = 3-bosqich summa-tier (bo'lim ≤500k / Рек.Совет ≤5M / direktor >5M); tasdiqlovchi = karta (lavozim), odam almashsa karta qoladi (E2 karta-markaz) — EP-FIX-007/009/CC-028
- KASSIR = smena ochish/yopish + kunlik X/Z hisobot + podotchet (avans berildi → hisob → tasdiq → GL closure); har som-hisobli qarz → oylikdan avtomatik chegirish — KAS-1/KAS-2
- KAS-2 PIN-per-operatsiya = oylik/avans tarqatish kassir orqali — har tranzaksiya PIN tasdiq; faqat director/super_admin roli foizlarni o'zgartiradi (EP-FIN-005/006)
- PayrollClosedEvent → GL avtomatik posting (6710 Mehnat haqi xarajati / 6400 Ijtimoiy sug'urta); verified real from session_2026-05-29 — POS-FIX5 confirm
- AP Invoice kiritilganda → kreditor qarz INSERT `purchase_invoices` + GL debit/kredit auto-post (D:1610 Ta'minotchi oldidagi qarz / K:6010 Ta'minotchidan xarid) — EP-FIN-037
- Tushum 4-hisobga avtomatik taqsimlash (EP-FIN-005) = foiz-qiymatlar `revenue_distribution_config` jadvalida; egasi foizlarni belgilashidan oldin SKIP (log bilan) — EGASI DATA KERAK (manifest §2.4)
- Aging 90+ eskalatsiya CRON → Telegram muammo kanaliga xabar + director karatasiga (EP-FIN-072); debitor/kreditor ALOHIDA ekranlar (EP-FIN-015) — Q-40 real calculation from `entries`
- GL #76 (P52 GATED) = cost-center (org_departments node) + per-sex GL reporting; entries.cost_center_id FK org_departments; sexCategory (male/female/mixed/unset) optional tag; DDL APPROVED: shart — EGASI QAROR KERAK §2.7
- FP-cycle (Se/Ch/Pa/Du) CRON = haftalik byudjet/cash-flow; /zvs_status, /company_state, /weekly_digest Telegram ShVB komandalar (EP-FIN-028) — execSqlResult<T> ishlatadi
- Xodim profili qarzlar ko'rinishi (Mening profilim) = real endpoint, `employee_debts` jadvalidan (GATED DDL); profil-qarz chigirma hisoblash → HR reyting integratsiyasi (keyinga qoldirildi)
- Penya avtomatik hisoblanadi (noto'g'ri pul kechikkan kun × stavka), lekin qo'llash egasi/rahbar tasdiqi bilan (E1 global printsip, EP-FIN-062)
- Kunlik kassa hisoboti + haftalik FP + oylik P&L + aging PDF eksport — pdfmake ishlatadi (real data, not stub); Telegram + ERP bildirishnoma ikkalasi (EP-FIN-013)

**🟢 Hozir qurish mumkin (gate yo'q):**
- P24 GL core hardening (period-lock, 4-hisob endpoint, URL fix) — insertJournal P24 specification qarang, 7 owned file, ddlGate FALSE
- P25 ZVS/ZNO approval matrix + GL auto-post (schema exists, endpoints partial, fix+complete) — dependsOn P24, Wave 2
- P26 KASSIR smena + podotchet interface/repo (5 yangi fayl: i-kassir, drizzle-kassir, kassir.service, kassir.controller, podotchet.*) — kassir folder yangi, DDL GATED for fi-advance-reports + employee_debts
- GL-by-sex (P52) endpoints BE service + controller (raw SQL cost-center query) — ddlGate TRUE (entries.cost_center_id migration GATED, draft fayl shunaqa); FE page CostCenterGlReport.tsx
- Telegram ShVB komandalar BE helpers (buildZvsStatusReply, buildCompanyStateReply, buildWeeklyDigestReply) — bot.helpers.ts OWNED, fin.bot.ts NOT (boshqa paket)
- Aging 90+ escalation CRON method (_checkAging90Plus) → financial-reports-alerts.cron.ts (owned, O'ZGARTIRISH); Telegram notification qo'shish
- AP Invoice → GL posting (POS-FIX5 verify + finance-ap.repository + finance-ap.service GL trigger) — real kod bo'lsa integrate, VERIFY-DON'T-TRUST
- CashRegister.tsx FE fix (smena tab + GET /api/finance/kassir/sessions/active) — O'ZGARTIRISH

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- AI Hashing & Integration — jwt_refresh_secret config fix, payroll GL lines (POS-FIX5 exact file scope), Phase 5 AI features (chek reading, penya auto-calc), revenue distribution coefficients (OWNER: %)
- DDL Owner Approval (Q-35) — P26 fi-advance-reports migration (GATED: APPROVED: [name] [date] shart); P52 entries.cost_center_id + sex_category migration (GATED: §2.7 owner decision needed: cost_centers vs org_departments, sex A vs B approach)
- Data / Owner Configuration — EP-FIN-005/006 tushum taqsimlash foizlar (OWNER qiymatlari kerak, CODE HARDCODED EMAS); FP-cycle kunlari (owner ekrandan o'zgartiradi, CONFIGURABLE NOT HARDCODED)
- Locked Module: PayrollModule (HR) — payroll GL lines (real from POS-FIX5), Payroll GL event listener (P26), payroll close trigger
- Locked Module: WMS — inventory diff event → GL adjustment (Phase 5, moliya tasdiq pending — P26-level readiness)
- Locked Module: QC — brak kg recorded → GL defect cost (Phase 5, smena-bound)
- Parallel-Build Modules (non-blocking, info-need) — SD Sales Orders GL posting, POS cash-to-GL mapping (E4/E6 architectural event flow)

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-FIN-005/006 Tushum 4-hisobga avtomatik taqsimlash foizlari — egasi qanday qiymatlar belgilashi kerak? (MAIN%, TAX%, HEAD%, WORKING%) va qaysi shartda trigger (har tushum? faqat orta/katta summalar?) — OWNER DATA KERAK
- KAS-2 PIN majburiyat qoida aniq — oylik/avans tarqatish uchun PIN MAJBURIY; oddiy kirim/chiqim tranzaksiyalarida PIN-ni qanday qo'llash kerak: majburiy yoki ixtiyoriy? — OWNER KLARIFIKATSIYA
- EP-FIX5 Payroll GL redirect — qaysi fayllar POS-FIX5 qo'llaydi va payroll GL entries `pos_gl_postings` bilan yoki `entries` bilan yoziladi? Tekshirish kerak (session_2026-05-29 da real deb belgilangan, lekin kod ko'rish shart) — VERIFY-DON'T-TRUST
- P52 DDL (GL #76 cost-center) — cost_center_id FK → org_departments.id mi yoki cost_centers.id? (vizyon org_departments deydi, lekin SAP cost_centers jadvali mavjud) va sex_category ustuni entries darajasidami yoki hisobot darajasida JOIN? — EGASI QAROR KERAK §2.7
- Employee debt `employee_debts` jadval tuzilishi — `advance_reports` bilan FK bog'lanish yoki mustaqil master? Qarz avtomatik chegirish cron va HR oylikdan integratsiyasi qanday ishlaydi? — TEKSHIRISH + EGASI TASDIQI
- AI chek reading (Gemini API) — Phase 3 stub OK deb belgilangan; bu nima qanday ishlatiladi: xodim chekni ERP upload → AI o'qiydi → human tasdiq → GL post. Jinsi AI modeli, qaysi noto'g'ri chek alomat? — PHASE 5 (Phase 3'da placeholder)
- Oylik/avans navbati reyting formulasi — xodim reyting → oylik tarqatish navbati; formula §C vizyon-hujjat'da 'formulani stub sifatida qoldirish' deydi. HR modul reyting tayyor bo'lgach qo'llanadi. Integratsiya cron qaysi? — DEFERRED (HR reyting moduldan keyin)
- Chek AI ODAM (kassir/moliya) tasdiq qiladi — E1 global printsip (qaror tasdiq bilan, avtomatik emas). Tasdiq workflow: AI result → FE notification → tasdiq tugmasi → tasdiqli/rad etish → GL post. API shartnomasi aniq? — IMPLEMENTATION DETAILS

**📂 Manba:** docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md (Phase 0–5 executor prompt, 308 qator, owner override + vizyon talabi — MASTER) · docs/audit/MASSIV-50/P24-FIN-fin-gl-core.md (GL hardening + period-lock + URL fix, 939 qator, ddlGate FALSE, 7 owned files, EP-FIN-004/064 + URL fix) · docs/audit/MASSIV-50/P25-FIN-zvs-zno.md (ZVS/ZNO complete, offset=939, limit yetmaydi — o'qish kerak) · docs/audit/MASSIV-50/P26-FIN-fin-kassir-crossmod.md (KASSIR + podotchet + PayrollClosedEvent + AP→GL + aging 90+ + ShVB komandalar + CashRegister FE, 1767 qator, ddlGate TRUE, Wave 3, dependsOn P24+P25, 9 owned files + 8 O'ZGARTIRISH) · docs/audit/MASSIV-50/P52-FIN-gl76-cost-center.md (GL #76 cost-center per-sex, ddlGate TRUE, HARD BOUNDARY §2.7 — EGASI QAROR KERAK, 7 owned file, Wave 2, dependsOn P24) · docs/audit/_parts/finance.md (static audit, 124 qator: 87 real ✅, 5 mock ⚠️, 5 green-lie 💀, 3 500-error ❌, deceptive 9, gate-keepers 3) · docs/audit/XARITA-REJA-YONALISH-2026-06-07.md §2.3 (GL #76 cost-center vision), §2.7 (DDL APPROVED qoida) · docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md Finance/GL section (30 owner overrides: EP-FIN-005 foiz %, EP-FIN-036 FIFO, EP-FIX-055 QQS ichki, EP-FIN-008/012 configurable thresholds, EP-CC-028 approval route) · docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md §8 (KASSIR naqd-nazorat), §15 (Finance-Kassir row), §C (KAS-1/2 vizyon hujjat) · docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (FP-cycle, ZVS/ZNO, 4-hisob context — 42872 lines, founders interview) · session_2026-05-29_payroll_be_verification.md (PayrollClosedEvent GL lines INPS8/JSHD12 real, verified 6cae643e commit) · project_4p0_hidden_fixes_2026_06_04.md (GL insertJournal + db.transaction existing, verified) · docs/agent-constitution.md (Q-24..Q-47 process rules, DDL approval, parallel sessiya, commit tartibi)

---

## 10. DIRECTOR (DIR) — Company State Management, OKR Cascade, Diary, Stat-Regulation

**Build holati:** 35% — P29 DDL + core state engine drafted but GATED (egasi APPROVED: imzolashini kutmoqda); Drizzle schema partially updated (idealRasmTargets pgTable qo'shilgan); 3 of 15 P29 owned files stubbed. P30 framework (4 backend systems + 4 frontend pages) = detailed specification ready but not yet coded. OKR cascade parent_goal_id/owner_card_id ALTER gated. Daily cron structure confirmed. Diary auto-fill logic (SQL queries) specified. Dashboard extensions (planFact, orderProgress, statTrends, openIssues) designed.

**Vizyon (egasi):** The DIRECTOR module is the strategic control layer for company state monitoring and goal management. It calculates a unified 5-metric company health score (cash_flow, production_plan, orders, hr, quality) weighted by configurable thresholds, logs state history daily at 07:00, and alerts leadership on state changes. Built on a karta-centric (position-based) model where OKR goals cascade (company → department → card), monthly plans decompose into weekly tasks, and execution diaries auto-fill with company state and KPI data. Stat-regulation as versioned master-data defines all corporate metrics with ownership tied to org_functions cards, not users. Aligns with owner's "Vysotskiy model" (trend → condition → action) and "verify-don't-trust" verification culture. Dashboard operates in real-time or snapshot modes. P29 (Wave 1) implements state engine (holat) + logging + cron; P30 (Wave 3) adds stat-regulation CRUD, diary with carry-over, OKR cascade (parent_goal_id), monthly plans. AI analysis (EP-DIR-026) and Telegram digest (EP-DIR-028) are deferred to P35/P36 and P47.

**Asosiy qarorlar (intervyu javobi = spec):**
- EP-DIR-001 (ANSWERED): 5-metric holat formula = cash_flow(0.25) + production_plan(0.25) + orders(0.20) + hr(0.15) + quality(0.15), all weights configurable via state_thresholds table
- EP-DIR-002 (ANSWERED): Holat chegaralari (thresholds) stored in DB state_thresholds, Director configures via DirectorSettingsPage sliders
- EP-DIR-003 (ANSWERED): Daily 07:00 cron (Tashkent tz) recalculates state, logs to company_state_log, triggers alerts if state changed
- EP-DIR-004 (ANSWERED): company_state_log stores kpis JSONB + scoreTotal + detectedAt; getHistory(30) feeds dashboard trend widget
- EP-DIR-005 (ANSWERED): State change → logger.warn (P47 NTF to emit event → Telegram + system notification); director role receives alert
- EP-DIR-007 (ANSWERED): diary_entries = 5-field execution journal (daily_state auto-fill, mainKpiValue auto-fill, mainIssue, solution, tomorrowPlan manual). Author = org_functions card (not user), UNIQUE(author_card_id, date)
- EP-DIR-009 (ANSWERED): Diary daily_state + mainKpiValue auto-filled from company_state_log state_code + production_plan % (real SQL query)
- EP-DIR-010 (ANSWERED): Unresolved mainIssue carries over next day via carry_over_issues JSONB array (P30 carryOverIssues logic)
- EP-DIR-011 (ANSWERED): ideal_rasm_targets seed = profit(100M), revenue(800M), employees(500), branches(15); Drizzle pgTable now synced with DB
- EP-DIR-012 (ANSWERED): Gap analysis = (actual/target) * 100, progress bar + 'months to ideal' calculation
- EP-DIR-015 (ANSWERED): OKR = okr_objectives (Objective) + okr_key_results (Key Results) JSONB structure; strategic-goal.entity type confirmed
- EP-DIR-017 (ANSWERED): Taktik reja = monthly_plans (strategicGoalId FK → okr_objectives, month YYYY-MM, objectives JSONB, weeklyTasks JSONB, completionPct)
- EP-DIR-018 (ANSWERED): Oylik → haftalik decomposition via weeklyTasks JSONB array (4 weeks per month, each week has % target)
- EP-DIR-020 (ANSWERED): stat_regulations = versioned master-data (name_uz/ru, definition, formula, unit, frequency daily|weekly|monthly, ownerCardId→org_functions, targetValue, version, validFrom, isActive). Owneri is karta, not user (Q-46 karta-model)
- EP-DIR-022 (ANSWERED): Stat-reg versioning = old row is_active=false, new version created (audit trail preserved)
- EP-DIR-025 (ANSWERED): Director dashboard shows CompanyStateWidget + IdealPicturePanel + StrategicTasksPanel + open issues + real-time KPI aggregates (Q123 owner answer)
- EP-DIR-029 (ANSWERED): 5 holat darajalari (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) with rank 5→1 and semantic colors stored in company_state_levels table; Director CRUD in DirectorSettingsPage
- EP-DIR-031 (OPEN-A): position_purpose text field in org_functions card (karta-markaz model); yaratiladi P04/P05 ORG paketida
- EP-DIR-032 (OPEN-A): har kartaning ЦКП (output metric) field linked to holat formula via stat_regulations ownerCardId
- EP-DIR-033 (OPEN-A): karta 2-4 product assignments (moslashuvchan) bilan har product'ga alohida stat_regulations yozuv; products_count CHECK va products JSONB in org_functions (P04/P05 owned)
- EP-DIR-037 (DEFER): delay_count + plan_deviation_count + reason_category (material/transport/operator/qolip/boshqa) in company_state_log.kpis; reason_category master-data va DB enforcement in PP/MES modules P12/P15
- EP-DIR-039 (OPEN-A): EuroPrint ERP fully replaces A-System (archived, single source of truth); migration strategy deferred to owner decision
- EP-DIR-044 (PARTIAL): Audit-log for secret data (price/customer/formula) visible only to Super Admin/IT/Director roles (Q144 owner answer)

**🟢 Hozir qurish mumkin (gate yo'q):**
- Drizzle pgTable definitions (6 new tables: company_state_levels, state_thresholds, company_state_log, stat_regulations, diary_entries, monthly_plans) in strategic-ext-schema.ts — standalone, no AI, no owner-data required (P29 §2.2–2.6 DDL blueprint ready)
- Company state calculator service (5-metric normalization, 0-100 scoring logic) — pure algorithm, no owner-data, integrates existing FIN/PP/SD/HR/QC canonical tables (P29 §4 Qadam 5)
- State levels CRUD controller (GET/POST/PATCH/DELETE company_state_levels) — standard CRUD pattern, Zod validation, Result<T> (P29 §4 Qadam 2 after DDL approved)
- Stat-regulation repository + service boilerplate (interface, repository impl, service delegate) — standard DDD pattern, no logic dependency (P30 §4 Qadam 3, 18 ta fayl blueprint ready)
- Diary repository CRUD (insert, update, submit, getOrCreateToday skeleton) — DB queries specified, typedExecute pattern, no auto-fill logic yet (pending P29 company_state_log availability) (P30 §4 Qadam 4)
- OKR repository parent_goal_id + owner_card_id signature updates (method overload, typedExecute pattern) — structural change, no business logic (P30 §4 Qadam 5, okr.repository.ts lines 42–48 refactor plan)
- Monthly-plan CRUD skeleton (4 files, standard pattern) — no complex logic, JSONB manipulation straightforward (P30 §4 Qadam 6)
- Dashboard query repository extensions (getPlanFact, getOrderProgress, getStatTrends, getOpenIssues SQL templates) — SQL queries specified, no AI dependency (P30 §4 Qadam 7, 7a blueprint)
- FE StatRegulationPage ListPage template (skeleton with hooks, Zod schema) — no BE data needed, scaffolding only (P30 §4 Qadam 8a structure)
- FE DiaryPage form structure (daily_state badge + manual fields + carry-over read-only) — design ready, waits P29 state_log endpoint (P30 §4 Qadam 8b)
- Director module provider registration (director.module.ts) — add new services/repos to providers list once files exist

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- DDL (P29 + P30): migration files require owner `-- APPROVED: <name> <date>` signature before `pnpm drizzle-kit push` or psql execution (Q-35 DDL darvozasi rule)
- P29 production: company-state-calc.service.ts 5 SQL metric queries depend on canonical tables (FIN entries, PP production_orders, SD sales_orders, HR hr_attendance, QC mes_sessions) must exist and be populated — requires seed data confirmation
- P29–P30 integration: P29 company_state_log jadval must be created + populated before P30 diary auto-fill can read state_code; P29 cron must run once before P30 opens diary (sequential dependency)
- OKR parent_goal_id self-ref FK: okr_objectives ALTER requires P29 ALTER migration approved; Drizzle schema type-safety for self-ref not yet tested (P30 §4 Qadam 5, okr.repository.ts typedExecute workaround)
- AI integration (EP-DIR-026 kunlik tahlilchi): P35/P36 AI modul must expose analyzeCompanyState(logId) + forecast service; P29 director-cron.service.ts EventEmitter2.emit stub awaits P35/P36 service availability
- Telegram digest (EP-DIR-028): P47 NTF modul must implement ntf_channels master-data + sendAlert(role, payload); P29 director-cron.service.ts logger.warn awaits P47 event listener wiring
- ORG-karta extensions (EP-DIR-031/033): org_functions table must add position_purpose text + products_count CHECK + products JSONB (P04/P05 ORG paketida owned); P30 stat_regulations.ownerCardId FK waits for ORG-kartalar ready
- PP/MES delay_count + reason_category (EP-DIR-037): production_orders table reason_category enum + counter logic (P12/P15 owned); P29 company_state_log.kpis JSONB only stores aggregate counter, not breakdown
- LMS integration (Nazorat varaqasi senariy exam): P06 LMS modul must expose exam scoring API; P30 diary.controller.ts stub awaits LMS integration (P30 §4 Qadam 4, TODO comment)
- Recruitment AI match (EP-DIR-051): HR AI recruitment scoring (LOYIHA-BITGAN §A.4 80% AI) — P35/P36 AI modul; org_functions malaka_talablari field (P04/P05 owned) + AI match endpoint
- Dashboard small-order analytics + format-optimization (EP-DIR-065/066): AI strategik tahlilchi P35/P36 service; DirectorDashboard FE panel component for AI recommendations
- CRM-level data (customer/order profitability deep dive): SD customer ABC analysis, seasonal patterns, order margin forecasting — owned by CRM/SD modules P11/P13; Director dashboard aggregates only (read-only feeds)
- Egasi owner-data qarorlar:** all threshold values, ideal targets, operation norm specs (14 types), frequency scheduling, alert routing logic, markdown documentation for karta responsibilities — owner tasdig'i kutiladi (26 open questions)

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-DIR-002: Owner values for default state threshold ranges (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) for each of 5 metrics — seed starting values recommended, owner adjusts via UI
- EP-DIR-006: When holat declines due to multi-metric cause, which dept manager gets alert? (A-default: primary cause owner + director; owner to confirm alert routing logic)
- EP-DIR-008: Diary yazilsa — faqat director mi yoki har bo'lim rahbari o'z diarisini yozadi? (A-default: managers + director; confirm scope)
- EP-DIR-013: Ideal_rasm_targets qiymatlarini kim yangilaydi? Avtomatik (FIN/HR/SD) yoki manual director? (A-default: auto-refresh weekly from canonical tables; confirm)
- EP-DIR-014 + EP-DIR-021: Stat-reg frequency = daily|weekly|monthly; which metrics need which frequency? (Egasi belgilaydi per stat-reg; no global rule)
- EP-DIR-019: Tactical task → which card (lavozim) owns execution? How does ownership cascade (company goal → dept → card task)? (Karta-markaz vizyon: har lavozim o'z taskini o'qiy oladi)
- EP-DIR-024 + EP-DIR-083: Holat formula structure — 5-metric weighted aggregation or multi-level cascade (company → dept KPI → card KPI)? (A-default: 5 global metrics + opt. dept breakdown; confirm multi-level strategy)
- EP-DIR-026: AI daily briefing — which AI service? (P35/P36 AI modul — forecast/strategic-agent). Scope: trend analysis + 1–2 recommendations. Owner to clarify AI model usage consent.
- EP-DIR-028: Telegram digest — kanal ID, bot token, scheduling? (P47 NTF modul owns; P29 just triggers event)
- EP-DIR-033: Har karta 2-4 product soni exact rules — which cards have 2, 3, 4? (Egasi har karta uchun belgilaydi; P30 UI validation qo'llab-quvvatlaydi 2-4 range)
- EP-DIR-039: A-System migration timeline and co-existence strategy (parallel running vs cutover date)? (Egasi qaror)
- EP-DIR-041 + EP-DIR-076: Xato risk-registry + error classification (misunderstanding / negligence / rule-break) — which cards have which risk types? (Egasi har lavozim uchun yozadi; P30 stat_regulations + diary carry_over'da ro'yxatlansa)
- EP-DIR-042: Muvaffaqiyatli harakatlar ideal-model — har karta uchun o'z success pattern sifatida (P30 stat_regulations description fieldida saqlanadi). Confirm scope vs ORG-karta responsibilities.
- EP-DIR-043: Javobgarlik bandlari (material/spiritual accountability) — formalize in org_functions card? (Karta maydonida saqlanadi; P04/P05 ORG paketi owned)
- EP-DIR-048 + EP-DIR-049: Control sheet (Nazorat varaqasi) — karta-level o'quv qayd va AI imtihon (LMS / P06 tekshiruv integration). Scope? (P30 diary'da carry-over bo'lib, LMS P06'ga deferred)
- EP-DIR-051: Malaka talablari (education/experience/skills) — stored in org_functions card; AI recruitment match scoring (LOYIHA-BITGAN §A.4 80% AI). Confirm AI service scope.
- EP-DIR-058–059: Ishchi norma % va operatsiya turi norma (avtokley, GTO, kley, etc.) — 14 operation types seed. Egasi exact list + per-operation target norm qiymatlarini confirm?
- EP-DIR-065 + EP-DIR-066: Small order analysis (strategic panel) + format optimization AI recommendation — FE strategik insights widget scope? (AI tahlilchi P35/P36 tomonidan; FE panel P30 dashboard extension)
- EP-DIR-067: Order code format (2024-0499 = year-seq; KT/PT/E+num = template) — enforce validation in SD? (Egasi formatti confirm, P30 dashboard search UI)
- EP-DIR-074: Root-cause drill — sabab kategoriyasi (material/transport/operator/qolip/boshqa) enforcement. Master-data qiymatlar egasi tasdig'i kutiladi.
- EP-DIR-080: Har ko'rsatkich uchun ideal value / threshold — master-data. Target values egasi belgilaydi (stat_regulations.targetValue seed)
- EP-DIR-081: Paddon (pallet) aylanishi tracking — ombor modul owned (P10) yoki DIR dashboard agregat? (Ombor resurs, DIR faqat ko'rinadi yoki downtime ma'lumoti)
- EP-DIR-085: 5S tozalik intizom ko'rsatkichi — ki'tobi (tekshiruv) based yoki HR intizom voqeasi based? (Egasi belgilaydi; stat_regulations frecuency + scoring)
- Tatkiq: P29 + P30 QA DB-proof checklist — sample state calculation, diary auto-fill, OKR cascade, monthly-plan breakdown. Egasi tasdiqlay? (Verify = kirit → saqla → qayta och → ko'rinadimi)
- Deferred faza: P35/P36 (AI modul), P47 (Telegram/NTF), P06 (LMS darslik integratsiya), P04/P05 (ORG-karta extent), P10 (warehouse paddon), P12/P15 (PP/MES reason_category)

**📂 Manba:** /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/05-director.md (85 questions v1+v2, 9 answered, 76 open-A) · /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P29-DIR-dir-state-engine.md (DDL + state calc + cron + log + alert, 2102 lines specification) · /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P30-DIR-dir-stat-diary-okr.md (stat-reg + diary + OKR cascade + monthly-plan + dashboard, 1558 lines specification) · /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MUSLIMBEK-PROMT-12-DIR-2026-06-08.md (PHASE 1–7 prompt blueprint, holat+diary+OKR+stat-reg+AI, owner's mental model) · /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md (owner direct answers Q123 dashboard, Q144 audit-log, Q37 delay_reason) · /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md (master vision: karta-markaz, Vysotskiy model, verify-don't-trust, AI 70%, single-source-truth)

---

## 11. CRM (Leads, Deals, Pipeline, Lead-Scoring, Elo-Rating)

**Build holati:** 35%

**Vizyon (egasi):** CRM (EP-CRM) — Mijozlar bilan ishlash platformasi: 85 savol (v1=30, v2 kitob-grounded=55) tashxisidan. Vizyon: Lead→Deal→Buyurtma "oltin zanjir" (CRM→SD→PP→MES→QC→WMS→FIN); 360° mijoz profili (buyurtma+to'lov+qarz+yozishma+shikoyat); karta-markazli RBAC (sotuvchi faqat o'z mijozini); voronka bosqichlari konfiguratsiyali (5 bosqich: Namuna→STP→Narx→Shartnoma→Buyurtma); AI lead-scoring (70%), NBA tavsiyalari, churn bashoratlari; alo qa kanallari (Telegram+Email+SMS+WhatsApp+VISIT); automatik eslatmalar (30/60/90 kun); ShVB 9 GSD (sotuv hajmi/bitimlar/o'rtacha/konversiya/davri/saqlanish/qarzdor/maqsad/maqsad-nisbat); korporativ raqam (menejer qo'lda qoladi ketsa); Daromadlar=qarz undirish (savdodan ajratilgan); papka=buyurtma (Заявка бумаги); ГП-kod takroriy yozish; format/o'lcham/dizayn kelishuvi; import-bog'liqlik; master-data (sd_customers); o'choq-mijoz belgisi; RFM/CLV; hisobotlar (oylik kg, yillik UZS); avans nazorati; mobil-tayyor; maxfiylik (export-blok + field-level RBAC); audit-log; NTF eskalatsiyasi + cronlar (overdue/follow-up/abandoned). MASSIV-50 P39/P40 paketlari = funnel_stages DDL + VISIT kanal + dashboard GSD + NBA fix + deal-won→sales_orders oltin-zanjir.

**Asosiy qarorlar (intervyu javobi = spec):**
- EP-CRM-001: Voronka bosqichlari — to'liq 5-bosqich (Yangi→Aloqa→KP→Muzokara→Yutdik/Yutqazdik) + konversiya hisobi ✅
- EP-CRM-002: Bosqichlar egasi-konfiguratsiyali; ZAVODGA MOSLASHTIRILGAN (Namuna→STP→Narx→Shartnoma→Buyurtma) 🔵
- EP-CRM-003: Lid manbalar — ko'p kanal (vebsayt+Telegram+qo'ng'iroq+qo'lda) avtomatik ✅
- EP-CRM-004: Avtomatik lid + darhol Telegram notification ✅
- EP-CRM-005: Round-robin yoki hudud/mahsulot bo'yicha taqsimot ✅
- EP-CRM-007: Aloqa kanallari — A=Telegram+WhatsApp+SMS+Email; WhatsApp/SMS qaysi avval? 🔵
- EP-CRM-013: AI NBA — taklif+inson tasdiq ✅
- EP-CRM-014: AI Churn — ko'rish+qaytarish vazifasi ✅
- EP-CRM-016: OLTIN ZANJIR — Bitim yutilsa→sales_orders avtomatik INSERT ✅
- EP-CRM-022/030: Karta-RBAC — sotuvchi faqat o'z mijozini, boshliq hammasini ✅
- EP-CRM-024: Qarz limitidan oshsa ogohlantirish+yangi bitim blok (Daromadlar tasdiq) 🔵
- EP-CRM-026: 30/60/90-kun auto-followup cronlar ✅
- EP-CRM-031/035: Korporativ raqam → ketsa raqam yangi menejerga; Telegram biznes-akkaunt ✅
- EP-CRM-032/033: Abonent doirasi + Inspeksiya bo'limi qo'ng'iroq nazorati (НО-2) ✅
- EP-CRM-036: Daromadlар boshlig'i = qarz undirish (savdoda emas); avtomatik blok ✅
- EP-CRM-039: CRM bitim→Papka №; Заявка jadvalga mos ✅
- EP-CRM-046: ГП topshirish blankasi — 3 imzo (omborchi+haydovchi+savdo menejer) ✅
- EP-CRM-049/050: Format farqi plan↔fakt + menejer roziligi saqlanadi ✅
- EP-CRM-051/052: Dizayn bosqichi voronkada + 'shoshilmaslik' (o'lcham-tasdiq majburiy) ✅
- EP-CRM-053/054: Mijoz profili (JSONB nima qadoqlaydi) + is_key_account flag (Indorama tipi) ✅
- EP-CRM-055: Oylik kg-trend + churn signal ✅
- EP-CRM-057: Qog'oz narxi o'zgarishi → ta'sirlangan mijozlar + qayta hisob 🔵
- EP-CRM-062: Savdo rahbari vs menejer (karta-ierarxiya) ✅
- EP-CRM-063: 60-kun aloqasiz → 'abandoned' auto-status; egasi override N-kun 🔵
- EP-CRM-075/076: Kontakt yashirish + eksport blok (field-level RBAC) ✅
- ShVB GSD 9 ta: weeklySalesVolume, closedDeals, averageDealSize, conversionRate, salesCycleLength, customerRetention, debtorControl, salesTarget, salesVsTarget ✅
- PARALLEL-LOCKED STATUS: crm/ = T3 qo'llab-quvvatlash (ko'pi mavjud yoki sodda), lekin oltin-ip/karta-RBAC/360°/ShVB = T1 ga ulanadi → P39/P40 bajarilgunga qadar PARALLEL-LOCKED

**🟢 Hozir qurish mumkin (gate yo'q):**
- Drizzle schema + repo/service/controller fundament — 73/85 savol ✅ (kodlar mavjud)
- Lead→Deal→Buyurtma oltin-zanjir STRUKTURA (P39/P40 DDL GATED) — kod yozildi, DB-proof 🟢
- Voronka (5 bosqich) DDL — yozildi, GATED 🟢
- VISIT kanal DDL + repository yangilash — yozildi, GATED 🟢
- crm-activities controller DELETE stub fix (return {}) ✅ — toza
- DealWonListener INSERT logic (oltin-zanjir P40 qadam-2) ✅ — toza yozildi
- Cronlar (overdue/follow-up/abandon) — yozildi P40:QADAM-4 ✅
- NBA 3-metod real DB (getAiLeads/getAiNba/analyzeChurn) — yozildi P40:QADAM-5 ✅
- business.constants.ts CRM-specific konstantalar (EP-CRM-063/026/057) ✅
- crm-companies.dto.ts + repository scope filter (RBAC) ✅
- Funnel JOIN tuzatish (crm_stages column drift) — tahlil TAYYORLANDI (crm-drift-deferred-2026-06-01)
- FE CreateActivityForm VISIT tab (komponenta skeleton) — blueprint
- FE CRMKpiCards 9 ShVB GSD (dashboard mode) — blueprint

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- **PARALLEL-LOCKED: P39/P40 paketlar (Uzbek-Language-Module/.claude/worktrees/green-lie-group1/...)** — crm/ modul T3 (qo'llab-quvvatlash) ekanida, oltin-ip/karta-RBAC/360°/ShVB = T1 ga ulanadi. P39 (CRM customer schema + funnel + RBAC scope) va P40 (VISIT + dashboard GSD + NBA + deal-won oltin-zanjir) — bir-biriga bog'liq; P39 baja ilmay P40 buyurttiraman; bu qoidada bajariladi (SERIALLY, PARALLEL-LOCK emas). Hozir P39/P40 DDL GATED (egasi ruxsati kutilmoqda).
- **AI-TOKEN kerak:** crm-ai-extended.service.ts (getAiLeads/getAiNba/analyzeChurn) — OpenAI/Claude API, churn-model logistic regression, embedding. Hozir hardcoded stub, haqiqiy AI service integrasiyasi egasining AI strategisiga bog'liq.
- **OWNER-DATA kerak:** voronka bosqich nomlari (zavod-specific), segment ro'yxati, lead-scoring formulasi, qarz limiti, STP/format versiyalash, import-bog'liqlik toifasi, operator-reja qoidasi, qog'oz narxi trigger %, egasizlantirish N kun, WhatsApp/SMS provayder.
- **crm_leads.status_id CHECK mapping:** QUALIFIED/LOST→IN_PROCESS/JUNK — Bu DB constraint (NOT IN 'NEW','IN_PROCESS','CONVERTED','JUNK') lekin app lifecycle (new/qualified/lost/converted) bilan ziddiyat. crm-drift-deferred-2026-06-01 #2 flaglangan — FIX sekvensial (P39 dan keyin, crm_leads scope).
- **Telefoniya ATS provayder yoqilishi:** crm-activities VISIT channel + qo'ng'iroq yozuvi (telefon-recording integratsiyasi). Hozir stubbed.
- **Ta'minot narx-feed bog'lanishi:** EP-CRM-057 (qog'oz narxi qayta-hisob) — Ta'minot modulidan real qog'oz narx feed kerak.
- **Dizayn bo'limi STP/format versiyalash modeli:** EP-CRM-079 — Dizayn tekturalarni CRM bilan bog'lash (kimning repository: CRM yoki Dizayn?). Hozir DEFER.
- **NTF + SMS/Telegram integrasiya (EventEmitter2 pattern):** P40 cronlari (overdue/follow-up/abandon) NTF event yuboradi, lekin NTF modul ba'zi kanallarni (SMS) wired emas. Backend orqali ishlaydi.

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-CRM-002: Aniq voronka bosqich NOMLARI (standart vs zavod-moslash)? Bitrix ('C0:NEW','C1:IN_PROCESS') yoki ingliz-uzbek ('namuna','narx')? — egasi belgilaydi.
- EP-CRM-007: WhatsApp/SMS qaysi kanal avval ulanadi? Provayder + yozuv qonuniyligi (GDPR/uz xavfsizligi)? — egasi+provayder.
- EP-CRM-012: Lead-scoring ball formulasi — mezon vazni (qiziqish/summa/javob-tezlik)? code `lead-scoring-agent` bor, lekin aniq formula egasidan — FIX-1 (00-INTERVYU-MOSLIK EP-CRM-012).
- EP-CRM-018: Segment ro'yxati (VIP/asosiy/yangi/kichik/tarmoq do'kon)? Oborot/sodiqlik mezonlari? — ABC repolari bor, aniq segment nomlari egasidan.
- EP-CRM-020: Yutqaz sabab ro'yxati (narx/muddat/sifat/raqobatchi)? Qisqartirish jadvaldan: narx/чиқим/format sabablar keladi, aniq ro'yxat egasidan.
- EP-CRM-024: Qarz limiti = qancha? Avto-block qachon (30/50/100% limit)? Finance/Daromadlar bilan oqim tuzatish kerak. FIX-5 (00-INTERVYU-MOSLIK EP-CRM-024).
- EP-CRM-028: Telefoniya ATS provayder+yozuv qonuniyligi? Hozir kod 'provider pending'. — egasi+telecom.
- EP-CRM-057: Qog'oz narxi qayta-hisob TRIGGER % (qancha oshganda)? Tavsiya ~5% (CRM_PRICE_RISE_TRIGGER_PCT). — egasi kiritadi.
- EP-CRM-063: Egasizlantirish N kun? Tavsiya 60; qat'iy muddat yoki flexible? — egasi.
- EP-CRM-079: STP/format versiyalash modeli — kim saqlaydi (CRM yoki Dizayn)? FIX-6 (format-versiya, Dizayn bilan). — egasi+Dizayn.
- EP-CRM-081: Import-bog'liqlik toifa manbasi — Ta'minot feed mi yoki qo'lda? — egasi+Ta'minot.
- EP-CRM-085: Operator↔mijoz reja-qoidasi — kim belgilaydi, Ishlab chiqarish reja qayd qilsin? — Ishlab chiqarish.
- PARALLEL-LOCK GATE: P39/P40 paketlar qachon approved/bajariladi? Hozir GATED (DDL darvozasi). Ishchi sessiya kerak?
- DB DRIFT (crm-drift-deferred-2026-06-01): crm_stages JOIN fail (#1), crm_leads.status_id CHECK mapping (#2), phantom columns agents'da (#3) — qachon tuzatiladi? FIX-priority?

**📂 Manba:** docs/audit/decisions/13-crm.md (kaynon yo'q — docs/audit/decisions/13-crm.md o'qildi, 85 Q+A) · docs/audit/vision-questions/13-crm.md (30 savol v1) · docs/audit/vision-questions-v2/13-crm.md (55 savol v2, kitob-grounded) · docs/audit/MASSIV-50/P39-CRM-crm-customer-funnel.md (funnel_stages DDL + RBAC scope + dashboard drift fix) · docs/audit/MASSIV-50/P40-CRM-crm-visit-dealwon-gsd.md (VISIT kanal + deal-won oltin-zanjir + NBA fix + cronlar) · docs/audit/_parts/crm-marketing.md (route inventory, 121 route, 5 deceptive endpoints flaglangan) · docs/crm-drift-deferred-2026-06-01.md (3 deferred: crm_stages JOIN, crm_leads.status_id CHECK, phantom columns) · docs/modul1-savdo-crm-deep-2026-06-03.md (CRM moduli qatlamli tahlil) · BARCHA_JAVOBLAR (SHvB YO'NALISH 25/26, kitob НО-2/Заявка/ГП/qisqartirish jadval, RD-4, Q77/78/99/106/107/122/144 konteksti) · LOYIHA-BITGAN-XOLAT-2026-06-08.md (T3 qo'llab-quvvatlash status) · ERP-SIFAT-STANDARTLARI-2026-06-08.md (D1 BE+FE PARALLEL qoida) · CLAUDE.md (Qoidalar 1-23, Q-24..Q-47 jarayon, neuromarkers) · MASSIV-50 paketlari: P39=crm-customer-funnel, P40=crm-visit-dealwon-gsd, P41+=qolgan FE/cronlar

---

## 12. MARKETING (EP-MKT)

**Build holati:** 35% (schema fixes + repo types in progress; 10/30 MASSIV-50 standalard tasks identified; core BD-proof ready; FE-BE endpoint mismatch fixed)

**Vizyon (egasi):** EuroPrint Marketing (EP-MKT) moduli — T3 yordamchi operatsion qism, lid → buyurtma → pul oltin zanjir boshlanadi. 8-kanal (Instagram/Telegram/Facebook/SMM/ko'rgazma/tavsiya/vositachi/boshqa) orqali B2B lidlarni kuzatish. Kampaniya ROI profit-based hisoblash (foydasi-xarajat)/xarajat formula, NPS event-driven so'rovnomasi (order.delivered → so'rov), churn detection kunlik cron (90+ kun buyurtma yo'q), content 5-bosqichli approval (g'oya→matn→dizayn→tasdiq→joylandi), lead scoring 5-mezonli (buyurtma hajmi/shoshilinchlik/byudjet/mahsulot/qayta mijoz, vaznlar egasidan). Dup-phone tekshiruvi, sla tracking (15daqiqa→signal, 4soat→menejer, 24soat→qayta). Egaga 5-raqam widget Director dashboard'da (Marketing sahifada emas). Mavjud: campaigns CQRS, leads service/repo, MarketingExt service, schema 22+ jadval, FE Dashboard/Leads/Content/Social/Exhibitions. Vizyon: karta-markazli RBAC, ERP yagona manba (Bitrix24→migrate), 1-bo'linma operatsion, 6-departament strategik.

**Asosiy qarorlar (intervyu javobi = spec):**
- 8-kanal master-data: marketing_channel_config jadval (marketing boshlig'i qo'shadi/o'chiradi deploy kerak emas)
- Kampaniya holati: 6 ta (draft/confirmed/active/paused/completed/cancelled)
- ROI formula profit-based: (sales_orders sotuv foydasi - marketing xarajat) / marketing xarajat
- Lead SLA: 15 daqiqa signal, 4 soat menejer, 24 soat qayta tayinlash (sla_first_response_at/sla_manager_notified_at/sla_reassigned_at)
- Egasi 5-raqam: Director dashboard widget, Marketing sahifada emas (P29/P30 paketiga)
- NPS: order.delivered event triggered, papka_order_id varchar(36) (hozir ::int cast XATO TUZATILDI)
- Churn detection: kunlik cron MIDNIGHT, 90+ kun buyurtma yo'q, EventEmitter2 signal
- Content 5-bosqich: g'oya/matn_tayyor/dizayn_tayyor/tasdiqlangan/joylandi
- Lead scoring: 5 mezon (buyurtma hajmi/shoshilinchlik/byudjet/mahsulot/qayta mijoz) vaznlar egasidan marketing_scoring_config dan o'qiladi
- Dup-phone tekshiruvi: leads.repository.ts findByPhone(), duplicate warning + merge taklifi

**🟢 Hozir qurish mumkin (gate yo'q):**
- Schema fixes: marketing-schema.ts (marketing_channel_config, campaign_status CHECK, content_posts 5-bosqich, SLA columns)
- Repo type fixes: leads.repository.ts (id: string), drizzle-marketing-ext.repo.ts (getCampaignStats, getLeadsBySource, getOwnerDashboard)
- Controller UUID fixes: marketing-analytics-stubs.controller.ts (NPS papka_order_id, convertLeadToCrm, conversations, exhibitions parseInt→string)
- Event classes: LeadQualifiedEvent, NpsRequestedEvent
- Lead dup-phone detection: findByPhone() repo + create() service check
- Content workflow: status CHECK update (5 bosqich)
- Basic churn detection repo method (getChurnRisk already exists, cron skeleton)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- DDL migration: marketing_channel_config, marketing_scoring_config, SLA columns, content 5-bosqich status — EGASI IMZOSI KERAK (-- APPROVED:)
- Lead scoring mezon vaznlari: marketing_scoring_config seed rows — EGASI QIYMATI KERAK (foizlar)
- 8-kanal dastlabki seed: marketing_channel_config 8 kanal — EGASI TASDIQLASHI KERAK (slug/label)
- Inbox SLA ish soati config: marketing_settings.business_hours_start/end — EGASI QIYMATI KERAK (09:00-18:00 default)
- Egasi 5-raqam endpoint: Director dashboard paketiga (P29/P30) koordinatsiya — BE metodi yozilgan, FE endpoint P29/P30 qo'shadi
- Churn cron EventEmitter2 listener: NTF modul TINGLASHI KERAK (Bildirishnoma qilish)
- NPS event listener (order.delivered): SD modul EVENT EMIT QILISHI KERAK (hozir emit qilmasligi mumkin)

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-MKT-003: dastlabki 8-kanal slug va labellar egasidan (Instagram/Telegram/Facebook/...)
- EP-MKT-031: kanallar 4 yoki 8 — aniq ro'yxat egasidan
- EP-MKT-044: lead scoring mezon vaznlari (foizlar jami 100) egasidan
- EP-MKT-045: lid minimal majburiy maydonlar (telefon/manba/mahsulot turidan boshqa)
- EP-MKT-048: SLA soat raqamlari (15 daqiqa / 4 soat / 24 soat fixed?); ish soati (09:00-18:00 hardcode?)
- EP-MKT-049: lid voronka bosqich nomlari (namuna/подписной lист bilan farqli)
- EP-MKT-050: lid yo'qotish sabab ro'yxati (7-8 ta sabab)
- EP-MKT-051: ROI formula marja manbasi (mahsulot tannarxidan avtomatik?)
- EP-MKT-055/056: atribusiya oynasi kun (90 kun default, egasi tasdiqlaydi?); ko'p kanal atribusiya modeli (oxirgi/birinchi/bo'linadigan)
- EP-MKT-062: ijtimoiy inbox provayder (Instagram/FB API, kim ulaydi, Telegram bot avval?)
- EP-MKT-063: inbox SLA daqiqa (15 daqiqa Q655 da, ish soati 09:00-18:00 hardcode?)
- EP-MKT-071: kontent rukni nisbati (5-6 turi, muvozanat — masalan foydali maslahat kamida 1)
- EP-MKT-077: marketing vs savdo KPI chegara (sifatli lid gacha marketing javobgar, sales - marketing aybi yo'q)
- EP-MKT-079: UTM infratuzilma (vebsayt analitika ulanishi, kim sozlaydi)
- EP-MKT-083: Bitrix24 ko'chirish rejasi (CSV yoki API ko'prik)
- EP-MKT-088: опросный лист maydonlar ro'yxati (kim kiritadi)
- EP-MKT-091: to'lov intizomi signal (blok yoki ogohlantirish, Finance bilan)
- EP-MKT-115: marketing xarajat zavod moddalari (ko'rgazma/vakil/namuna/katalog/matbaa raqamlari)
- EP-MKT-116: egasi 5-raqam tanlash (yangi/yo'qolgan/kichiklashayotgan/savdo trendi/xavf — fixed emas, tanlashi mumkin?)

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/14-marketing.md (118 savol: 92 javoblangan, 26 ochiq) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P41-MKT-mkt-full-stack.md (P41 direktiva: schema fixes, repo type tuzatish, endpoint UUID xatolar, NPS/churn/owner-dashboard) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P39-CRM-crm-customer-funnel.md (CRM-Marketing integration) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/CLAUDE.md (project constants, rules) · Intervyu: CHAT-TARIXI-YANGI.md (42k lines founder context) · ShVB YO'NALISH 25: Marketing 4-Otdelenie KPI (11 GSD metric) · BARCHA_JAVOBLAR.md: Q12/Q27/Q99/Q172/Q909 (org structure, HR↔Marketing, B2B zanjir) · Kitob (real zavod hujjatlari): opersyon workflow, Bitrix24, опросный лист, папка №, Menedjer ustuni

---

## 13. IoT + CAMERA (sensors, telemetry, AI-camera VLM, per-camera prompt, motion-gate, anomaly detection, davomat/PPE/QC/GSD bridge)

**Build holati:** 35% — P44 (machine registry, operator guard, energy 501-phase, OEE semantik fix, crew POST) = struktural tayyorlik; P45 (checklist gate, GSD bridge, camera-AI, room-inspections, PPE/attendance tables) = schema+service qatlami; hali barcha endpoint va FE integrations yo'q, AI camera implementation yo'q

**Vizyon (egasi):** IoT moduli EuroPrint zavod zeminining intellekt qatlami (T3 qo'llovchi). Asosiy yo'nalish: KAMERA-AI (VLM passive-activation per-camera prompt) xona inspeksiyasi (2-soatli cron), himoya vositasi (PPE), davomat (entry/exit), va QC nazorat. Mashina sensori hali O'RNATILMAGAN — Excel/qo'lda; 3-5 asosiy mashinaga bosqichli joriy. Oltin-ip: machine registry (norma_per_hour/per_12h) + production_sessions (running_time/actual_qty/defect_qty) + downtime_reason_codes + defect_reason_codes (kitob kodlari) + downtime/defect event journals. Karta-markazli: anomaliya/xabar mexanik kartasiga (Vysotskiy 7 org-sxema yo'naltirish), OEE/uptime → operator/mexanik GSD'ga avto. Operator tablet = zavod markazi (barcha kirituvni tabletdan). AI rejalashtiradi (MES/IoT ma'lumotlari AI rejalashchiga uzatiladi). 6 ta tamoyil: AI kuzatadi→inson tasdiqlaydi (E1), karta-markazli, AI rejalashtiradi, tablet=markaz, org-chart yo'naltirish, bitta haqiqat (machines + production_sessions). Owner: energiya sex-hisoblagich fazasi (per-mashina sensor keyin); xona ideal-rasm AI taqqoslash har 2 soatda (EP-IOT-010 Q97-Q98); AI kamera = boshlang'ich (sensor emas).

**Asosiy qarorlar (intervyu javobi = spec):**
- ✅ EP-IOT-001: 3-5 asosiy mashina sensor (kritik, eng ko'p to'xtaydigan) — Gofra, KBA-105, SM-72, ФСМ. Bosqichma-bosqich.
- ✅ EP-IOT-002: 5 mashina holati (Ishlayapti/To'xtagan/Sozlanmoqda/Nosoz/O'chiq) — ShVB machineStatus. Master ro'yxat.
- ✅ EP-IOT-003: Uptime avtomatik (sensor/MES), GSD ulashi. Smena/kun/hafta granularlik.
- ✅ EP-IOT-004/005: Downtime sabab (8-10 standard + kitob real: иш йук/колиб/переделка/настройка). Operator tanlaydi.
- ✅ EP-IOT-010/011/012: Kamera-AI xona inspeksiyasi (5-7 mezon: tozalik/himoya/yo'lak/tartib/xavfsizlik). Ideal-rasm bilan 2-soatda taqqoslash (Q97-Q98). Buzilish jurnali (mas'ul→muddat→tuzatildi).
- ✅ EP-IOT-013: MES integratsiya — sensor hisoblagich → buyurtma avto. MESDashboard birlash. Oltin-ip.
- ✅ EP-IOT-014: OEE (3 omil: vaqt+tezlik+sifat) avtomatik. production_sessions dan (running_time/actual_qty/defect_qty), sensor float proxy EMAS.
- ✅ EP-IOT-021: Sex Andon tablosi (holati jonli, to'xtagani qizil). Norma vs haqiqiy.
- ✅ EP-IOT-022: Operator tableti (mashinada: holat+sabab+defekt+smena hisobot). Iot-tablet controller mavjud. Q116/Q119: avto kunlik invoys PDF.
- ✅ EP-IOT-024: Holat/xabar karta-modelga (anomaliya→mexanik, uzun to'xtash→sex boshlig'i). Org-sxema marshrut.
- ✅ EP-IOT-025: Mashina OEE→operator/mexanik GSD'ga. Karta-model: natija lavozimga. Adolatli (idle/material boshqa).
- ✅ EP-IOT-027: Smena hisobot (avto, sex boshlig'iga/Telegram). Avtomatik invoys PDF (qancha ishlagani/oylik/avans).
- ✅ EP-IOT-028: Telegram (faqat muhim hodisalar). Modul boti + sozlanadi. Q101/Q102/Q140.
- ✅ EP-IOT-029: Yagona mashina registri (nomi/turi/inventar/sex/mas'ul karta). Hamma IoT shunga bog'lanadi.
- ✅ EP-IOT-031: Reestr 'Станоклар норма' nomlariga 1:1. Kitob nomlar (SM-52/KBA/Тигель 1-10/Гофра/ФСМ...).
- ✅ EP-IOT-032: Har mashina norma_per_hour + norma_per_12h. РД4→Ген.Директор imzo-zanjir.
- ✅ EP-IOT-033: O'lchov birligi (м²/лист/штук/удар) mashina turiga qarab. Gofra=м², offset=лист, Tigel=удар/лист.
- ✅ EP-IOT-036: 'Иш йук' alohida holat (rejalashtirish kamchiligi). Nosozlikdan ajratiladi.
- ✅ EP-IOT-037: 'Колиб тайёрланмагани' alohida sabab + mas'ul bo'lim.
- ✅ EP-IOT-038: 'Переделка' brak sabab + qisqa izoh.
- ✅ EP-IOT-039: Setup vaqti 'Сozlanmoqda' holati (OEE'da alohida).
- ✅ EP-IOT-040: Smena A/B/C alohida kuzatish. Smena boshlig'iga biriktiriladi.
- ✅ EP-IOT-042: Operator+yordamchi crew smena tabliga. Tablet kotroller mavjud.
- ✅ EP-IOT-048: Smena=12 soat baza (A/B/C). Ishlangan/bo'sh/sozlash/remont saat ajratish.
- ✅ EP-IOT-054: Norma tasdiq zanjiri (РД4→Ген.Директор audit jurnali). Imzo bilan tasdiqlanadi.
- ✅ EP-IOT-057: Defekt sababini operator tablet'dan tanlash (tayyor ro'yxat, Pareto).
- ✅ EP-IOT-059: 'Иш йук' soatlarida muqobil ish (арчиш/паддон/тозалаш). Alohida vaqt sanaladi.
- ✅ EP-IOT-062: Картон vs гофра автовысечка alohida. 2 qator norma/braki. Aralashtirilsa xato.
- ✅ EP-IOT-066: Andon live (target vs haqiqiy, ortda qolish %). Operator motivatsiya. **EGASI QIYMATI KERAK: lag % formulasi (reja vs fakt, vaqt).**
- ✅ EP-IOT-070: 'Папка №' IoT yozuviga bog'lash. Zavod papka nomiga ulashi.
- ✅ EP-IOT-072: Mashina texnik xizmat tarixi (sana/ish/qism/xarajat). Eskirish/MTBF ko'rinadi.
- ✅ EP-IOT-074: 'Norma bajarilmadi' sababi avto tahlil (downtime breakdown).
- ✅ EP-IOT-077: Kamera-AI himoya vositasi (qo'lqop/ko'zoynak) tekshirish. Q56/Q57 (AI kamera).
- ✅ EP-IOT-078: Kamera-AI xavfli zonada odam yo'qligini tekshirish. Висечка/тигель barmoq kesishi.
- ✅ EP-IOT-080: Mashina boshlashdan oldin 'tayyorlik tekshiruvi' (checklist). To'ldirilmasa ish ochilmaydi.
- ✅ EP-IOT-081: Mashina samaradorligi GSD/ЦКП ShVB'ga uzatish (avto).
- ✅ EP-IOT-082: Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash (adolatli — idle/material chiqarib).
- 🔵 EP-IOT-018/030: Energiya sex-hisoblagich fazasi (hozir 501). Owner: per-mashina sensor keyin. **EGASI QIYMATI KERAK: sex hisoblagich DB manbai + rollout kalendar.**
- 🔵 EP-IOT-021/066: Andon board endpoint. **EGASI QIYMATI KERAK: lag % hisoblash formulasi (reja vs fakt, vaqt oralig'i).**
- 🔵 EP-IOT-015: RUL (qolgan resurs) — qoidaga asoslangan prognoz (ish soati/sikl bo'yicha). AI keyin.
- 🔵 EP-IOT-034: Tigel 'удар/лист' alohida hisoblagich + eslatma har N mln udarda (qolip resursi).
- 🔵 EP-IOT-041: 'Hozirgi+keyingi ish' Andon'da MES'dan. Operator keyingi ishni ko'rsa tayyorlaydi.
- 🔵 EP-IOT-043: Gofra м2 ombor (karton) bilan bog'lash. м2 balans, farq ogohlantiriladi.
- 🔵 EP-IOT-044: UV/Трафаретный лak sarfi kuzatish (qiymat material).
- 🔵 EP-IOT-045: Ламинация plyonka sarfi va isrofi (% chegarasi).
- 🔵 EP-IOT-050: Брак % chegaradan oshganda avto ogohlantirish (ekran+Telegram).
- 🔵 EP-IOT-051: Brak chegarasi mashina turiga qarab (gofra/offset/tigel turlicha).
- 🔵 EP-IOT-053: Mashina 'иш %' (yuklanish foizi). Bottleneck belgilanadi.
- 🔵 EP-IOT-055: ФСМ tezligi va uzilishi (зажор). Ko'paysa ogohlantiriladi.
- 🔵 EP-IOT-056: Тигель qolip (штамп) resursini udar soniga bog'lash. Almashtirish eslatmasi.
- 🔵 EP-IOT-058: Smena topshirish (А→Б) — tugatilmagan ish+holat+izoh.
- 🔵 EP-IOT-060: Гофра yelim/namlik parametri. Yelim harorati+namlik sensor.
- 🔵 EP-IOT-061: Ofset bo'yoq (краска) qutisi darajasi. Past bo'lsa talab.
- 🔵 EP-IOT-063: Mashina ON/OFF vaqti avto yozish. Tabel rejasi bilan solishtiriladi.
- 🔵 EP-IOT-064: Energiya idle (бекор) vaqtni topish. Bo'sh yonib turgan mashina pulni yeydi.
- 🔵 EP-IOT-065: Kompressor bosimi kuzatish. Tushsa ogohlantirish.
- 🔵 EP-IOT-068: Folga (Тиснение/Конгрев) sarfi va udar. Qimmat material.
- 🔵 EP-IOT-069: Mashina-mashina yarim tayyor (НЗП) kuzatish.
- 🔵 EP-IOT-071: Sensor signal yo'qolsa 'noma'lum' vaqt ajratish. Halol hisob.
- 🔵 EP-IOT-073: Texnik xizmat ehtiyot qismi ombor bilan bog'lash (min. zaxira).
- 🔵 EP-IOT-075: Brak material qayta ishlatish (макулатура) kuzatish.
- 🔵 EP-IOT-076: Mashina sertifikat/kalibrovka muddati eslatmasi.
- 🔵 EP-IOT-079: Tungi smena (С) avto nazorat kuchaytirish (chegarasi pasaytiriladi).
- 🔵 EP-IOT-083: Ofset plastina (колиб/CTP) tayyorlik holati navbatda (preprint uchun).

**🟢 Hozir qurish mumkin (gate yo'q):**
- P44: machines pgTable (EP-IOT-029/031) — 27 mashina seed, norma_per_hour/per_12h/status, Zod schema
- P44: production_sessions +smena_type (A/B/C) +smena_boss_card_id (EP-IOT-040)
- P44: downtime_reason_codes seed (10 qator) + defect_reason_codes CREATE (8 qator — kitob kodlari)
- P44: Operator role IOT_READ/IOT_WRITE (EP-IOT-042) — guard constants
- P44: Energy 501 endpoint (EP-IOT-018/030) — honest error, per-mashina sensor keyin
- P44: OEE semantik fix — production_sessions dan hisoblash (sensor proxy EMAS)
- P44: POST /api/iot/production-sessions/:id/crew (EP-IOT-042) — operator+yordamchi
- P45: TB checklist gate (EP-IOT-080) — confirmTbChecklist, session start blocker
- P45: Smena ready checklist (COR-130) — confirmSmenaReady tables + service metodlari
- P45: Alternative work log (EP-IOT-059) — арчиш/паддон ish joylari
- P45: Card GSD log (EP-IOT-025) — card_gsd_log jadval + metric codes (OUTPUT/NORMA/EFFICIENCY)
- P45: Room inspections schema (EP-IOT-010) — room_inspections + inspection_violations tables
- P45: PPE alerts schema (EP-IOT-077/078) — ppe_alerts (E1 human-gate) + admission camera log
- P45: GET /api/iot/andon/live (EP-IOT-021/066) — jonli sessiyalar (lag_pct DEFER)
- P45: Violation closed-loop service metodlari (resolve/escalate)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- AI Kamera Gemini VLM integration (CameraAiService.runRoomInspections cron) — GEMINI_API_KEY env + per-camera prompt storage qoidasi
- Energiya sex-hisoblagich real data ma'nbai — EGASI: qaysi DB ustundan/jadvaldan? (hozir 501, placeholder)
- Andon lag % formulasi — EGASI: reja vs haqiqiy, vaqt oralig'i formula belgilashi kerak (P45 qabul mezoniga)
- Mashina sensor rollout jadval — EGASI: qaysi 3-5 mashina, qachon boslanadi, rollout sprint
- AI kamera ideal-rasm manage UI (zone admin panel) — polygon editor, snapshot buffer — alohida sprint
- PPE/davomat yuz detection model training — egasi dataset bormi? Yoki public Coco/ImageNet model?
- Telegram bot VLM alerting (Telegram MRP → bot integratsiya) — NTF modul bilan birlashish (masul: Messaging/NTF)
- Parallel locked: P44 migration APPROVED → P45 DDL GATED (machines FK talab qiladi)
- AI Planning modul (PP-AI yadrosi 7-bosqich rejalash) — P44/P45 dan keyin, MES bilan bog'lanish

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-IOT-018/030: Energiya — sex hisoblagich DB manbai qayerda? (hozir sex umumiy hisoblagichdan, per-mashina sensor keyin)
- EP-IOT-021/066: Andon lag % formulasi — reja vs fakt, vaqt oralig'i qanday hisoblanadi? (variantly: dona farqi / reja → % yoki vaqt bo'yicha lag)
- EP-IOT-001: Mashina sensor rollout jadvali — hamma mashinaga qancha vaqtda, aniqlanganmi? (egasi OCHIQ-JAVOBLAR: 'HAMMA BIRDAN')
- EP-IOT-082: Mashina oylik adolatligi — qaysi qarama-qarshi omillar o'zgaruvchi (idle/material/qolip boshqa)? Qaysi mezon avto-çıkarılabilir?
- AI Kamera per-camera prompt — har mashina/zona uchun model qayda saqlanadi (CLAUDE.md/settings yoki separate table)? Kim tahririydi?
- AI Kamera VLM model tanlovı — Gemini 1.5 flash / Qwen / DeepSeek / LLaVA — egasi tanlagan model nima?
- Motion-gate implementatsiyası — polygon zona muharriri UI qayda, bosqich-tartib nima?
- Xona inspeksiyasi ideal-rasm URL — manual upload yoki auto-snapshot (kamera bufferi'dan)? QA/ombor zontlari uchun ideal rasm setup qanday?
- EPP/davomat kamera — har qaysi odam uchun yuz model training data: egasi'da mavjud boshlang'ich dataset bormi?
- Anomaliya qoidalari (sensor chegaralar) — har mashina turi uchun default chegara qiymatlari (temperaturа/bosim/energiya) kim belgilaydi?
- Кооператив sensor o'rnatish — qaysi mashinalarga qachon boslanadi? (egasi qaroridan kutilmoqda)

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/16-iot.md (EP-IOT-001..083) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P44-IOT-iot-machine-registry.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P45-IOT-iot-camera-andon-gsd.md · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (AI kamera sharper, xona inspeksiyası, per-camera prompt, motion-gate, YOLO→VLM) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md (EP-IOT kod, modul og'irligi T3) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MUSLIMBEK-PROMT-20-IOT-2026-06-08.md (Phase 1 direktiva) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASTER-SAVOL-JAVOB-2026-06-08.md (460 real javob — Q56/Q57/Q88/Q97/Q98/Q108/Q116/Q119/Q128) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/SHvB-40-Yonalish-Prompt.md (Y37 IoT-MES integratsiya, Y29 inspeksiya, Y38 Telegram bot) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/EPR-SIFAT-STANDARTLARI-2026-06-08.md (standar/norma models) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/CLAUDE.md (Q-40 ishlaydi≠to'g'ri, Result<T>, xavfsizlik qoidalari)

---

## 14. AI + AISHA (Markaziy AI, AISHA dispatcher, AI agents)

**Build holati:** 15% (core schemas + decision logic sketched; massive wiring deps on P35/org/HR tayyorliklariga bag'liq)

**Vizyon (egasi):** AI + AISHA module is EuroPrint's central intelligence layer with two components: (1) **Markaziy-AI** — enterprise brain handling org-card fit scoring, employee evaluations, forecasting, governance, and compliance (ЦКП chatbots, daily gate reports, bonus recommendations, successor lists, violation detection). (2) **AISHA** — immersive AI assistant (Layer A: web-based Claude + 30 ERP tools via SSE; Layer B: future desktop Python client with STT/TTS/OS-control). Provider = Google Gemini API (dynamic budget). Architecture: single AI per org-function (card-centric model), all metrics auto-computed from real data (MES/QC/HR/LMS/davomat), AI only recommends (humans approve), reports routed by manager hierarchy to 3 audiences (employee/manager/HR), with audit trails and dispute mechanics.

**Asosiy qarorlar (intervyu javobi = spec):**
- ANSWERED — Markaziy-AI = bitta yagona AI (Q30), har modul undan ruxsat oladi; no distributed AIs
- ANSWERED — AI identification = JWT → card_id (org_functions.id) + RBAC kartadan; card=master-data
- ANSWERED — Fit scoring inputs = ЦКП + test results + attendance + quality + manager rating + peer comparison (aggregate from MES/QC/HR/LMS/davomat)
- ANSWERED — ЦКП daily chatbot = AI auto-generates questions from card definition, binds to operator/mashinachi; non-submission = salary gate
- ANSWERED — Reports = PDF format, 3-audience routing (employee self-dev + manager team + HR holistic), weekly digest CRON
- ANSWERED — Provider = Gemini API (ShVB Q150/Q151); API key + daily_budget_usd configurable in DB, hardcoded fallback 50 USD
- ANSWERED — AI recommendations = never auto-execute; all major decisions (gate/bonus/block/override) require human approval (HR/manager/director)
- ANSWERED — Maxfiylik/PII = no confidential data sent to Gemini; masking + RBAC (only authorized roles see confidential fields)
- ANSWERED — Multi-language = 3 languages (UZ-lotin/UZ-kirill/RU); Gemini handles input analysis; i18n terminology consistent
- ANSWERED — Card-centric model = 1 card = 1 position/role (master data), AI moslik-bahosi per card; employee secondary (query by card)
- ANSWERED — AISHA = Layer A (web, Claude+30 tools, immersive UI, ERP-specific); Layer B deferred (Python desktop client, OS-control approval-gated)
- ANSWERED — Self-calibration = AI reports own accuracy monthly; confidence levels on conclusions; honest about data sufficiency
- ANSWERED — Dispute/Override = employee can contest AI eval, review goes to manager→HR with sabab (reason tracked in audit log)

**🟢 Hozir qurish mumkin (gate yo'q):**
- P35 (AI-central-infra) — CentralAiService, AiProviderConfig DDL + repo, PII masking, ai_usage_logs foundation [DDL GATED, requires owner ruxsat]
- P36 (AI-ckp-fit-governance) — ai-ckp.service (schema + repo), ai-fit.service, ai-violation.service, ai-report.service, ai-dispute.service [depends P35 done; schema migrations GATED]
- i18n 3-til config (UZ-lotin/UZ-kirill/RU) — terminology lug'ati seed + atama consistency checker [pure code, no DDL]
- AI feedback loops — calibration.service, confidence-level renderers, override audit-log schema [code, ready]
- AISHA Layer A refactor — decouple from director dashboard, alohida route/sidebar, immersive UI components (orb + animations) [FE, no BE schema]
- test factories for ai-* tables — DB-backed integration tests once schemas created

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- AI-TOKEN (Gemini API key) — env + ConfigService; all LLM calls blocked without valid key
- OWNER-DATA (ЦКП goals + rahbarlik filler) — 97 ЦКП rows, 30 manager_id, 124 head_user_id must be populated by HR/owner before AI fit scoring live
- P01 (schema lib barrel) — blocking P35 schema export
- P35 merge — blocking P36 services
- org-struktura poydevor (master org-functions DDL complete) — AI card-centric model requires org DDL ready
- HR onboarding (employee↔card binding complete) — without this, AI has no xodim data to score
- ai/ + ai-agents/ modules status — per memory 'parallel-locked crm-ai-ai_agents'; coordinate with CRM timing

**❓ Ochiq savollar (egasi DATA kerak):**
- OWNER-DATA: ЦКП maqsadlar va formulalari — har kartaga tskp=0/97 (0% tayyor); HR yozadi, AI generates savollar from text+formula
- OWNER-DATA: rahbarlik DATA — manager_id boş 0/30 (0% filled); head_user_id boş 18/142; org-struktura DDL asosi — tegishli raqamlarini egasi to'ldiradi
- OWNER-DATA: Org-sxema — bot/lavozim/sex/uskuna hierarxiyasi + AI-kamera zones + Telegram grup ID'lari — 22 sex nomi va strukturasi
- OWNER-DECISION: AISHA desktop client (Layer B) — yangi Python repo, Windows-specific? OS-control approval UI shape?
- OWNER-DECISION: Wake-word (Layer B) — 'Aisha' / 'Uyg'on' / other? Telegram integration (pyautogui desktop vs Bot API)?
- OWNER-DECISION: Markaziy-AI visibility/audit — kalit savollar tarixiga va togglega access (kim ko'radi AI logs)?
- OWNER-DECISION: Forecast range (pessimistic/optimistic) — MEMORY has 0.7/1.3 constants; confirm or adjust?

**📂 Manba:** C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions/17-ai.md (95 visions: 42 answered v1 + 53 open v2) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md (egasi AISHA vision: 2-layer, immersive UI, Layer B Python deferred) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P35-AI-ai-central-infra.md (Wave 1 spec: CentralAiService, provider-config DDL, PII guard, alerts-repo) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md (Wave 3 spec: ЦКП/fit/violation/block/camera/governance/calibration services) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/XARITA-REJA-YONALISH-2026-06-07.md (master xarita: org-karta-daraxt model, ЦКП spec sharpened, AI as nazoratchi) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (founder interview condensed: 7-factor xodim rating, 7-step AI scheduling, gofra sloy formula, org hierarchy) · C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/CLAUDE.md (Qoidalar A,B,1-23, Q-24..Q-47: code style, process, parallel sessions, DDL gates, Q-40 'ishlaydi≠to'g'ri')

---

## 15. LMS + ADAPTATION (Ta'lim va Takomillashtirish)

**Build holati:** 25% (ground truth: architecture = 100% decided; code structure exists but incomplete; DDL + core repos defined but GATED pending owner sign-off; FE pages stubbed)

**Vizyon (egasi):** LMS is the T2 learning & certification gate enforcing that employees cannot receive salary or operate machinery until mandatory training for their card is complete. The module is card-centric (training binds to roles, not individuals); card-linked courses auto-enroll new employees. Core vision: "Darslik kartaga biriktiriladi; darslik tugamasa o'sha karta oyligi yo'q" (EP-LMS-001/002). Delivered across 7 build phases: Phase 1 (core DDL: course/card/enrollment/progress), Phase 2 (nazorat varaqasi: 12-topic digital checklist), Phase 3 (test bank/razryad exam/certificates), Phase 4 (onboarding workflow: RD-4→TX→field→2mo practical→exams→independence), Phase 5 (payroll/MES gates with 3-day warning), Phase 6 (kaizen+regulation+replication), Phase 7 (dashboard/AI/PDF/Telegram). All 85 decisions answered (75 direct, 10 owner-deferred to A-defaults). Integration with Vysotskiy-7 org-chart (vertical hierarchy), event-driven architecture (salary-block crons, mentor accountability, AI observes→human confirms).

**Asosiy qarorlar (intervyu javobi = spec):**
- EP-LMS-001/002: Card-centric model; training blocks salary if incomplete
- EP-LMS-003: Auto-enroll mandatory courses when employee links to card
- EP-LMS-004/044: MES gate—TX safety courses block production if not completed
- EP-LMS-027: Payroll gate is HARD BLOCK (owner override); 3-day advance warning cron
- EP-LMS-031/032: Nazorat varaqasi digitalized; 2 variants per card (lavozim+ishga-xos)
- EP-LMS-033: 12-topic template auto-generated; topics 7,11,12 auto-populate from card fields
- EP-LMS-038-045: Onboarding workflow chain (RD-4 interview→TX→field instruction→2mo practical→dual exams→RD-4 conclusion→independence order)
- EP-LMS-040: 2-month practical timer with 7-day pre-exam notification
- EP-LMS-041/062: Both theory AND practical exams required before independence
- EP-LMS-057 (owner): Mentor qualification = min razryad + card certificate (HR sets threshold)
- EP-LMS-082 (owner): Two-way mentor accountability—apprentice success→bonus, failure→deduction (proposal to HR, not auto)
- EP-LMS-070: 3-condition completion rule (theory score + practical pass + 100% topic confirms)
- EP-LMS-064: Nazorat varaqasi PDF export (kitob format, immutable audit record)
- EP-LMS-068: 3-layer training (company + department/sex + card)
- EP-LMS-069: Telegram bot + app notifications; short micro-modules for operators
- EP-LMS-074: Confidentiality module mandatory for all onboarding (NDA equivalent)
- EP-LMS-080: AI drafts tests/glossary/micro-modules from regulation documents (human approves)
- E1 principle (across all): AI observes→HR/manager confirms negative effects (never automatic)
- E2 principle: Card is primary; training attaches to role, not person
- E4 principle: IoT-tablet (POS Monitor) runs short micro-modules on shop floor
- E5 principle: Org-chart routing (exam approvals, razryad, certificates follow Vysotskiy-7)

**🟢 Hozir qurish mumkin (gate yo'q):**
- BE Phase 1 DDL schema (lms_courses, lms_enrollments, lms_module_progress, lms_nazorat_varaqa with 12-topic structure)—pure structure, no AI key needed
- Drizzle schema definitions (lms.ts schema file, all tables with FK relationships mapped to org_functions.cards)
- Core repository + service structure (LmsCoursesService, LmsEnrollmentsService with Result<T> pattern, Zod DTOs)
- Auto-enrollment event listener (employee-card-assigned listener triggering mandatory course assignment)
- Card-transfer archival logic (old enrollments archived when employee moves cards)
- FE ListPage template for course CRUD (create/edit/filter by course-type, is_mandatory, pass_threshold_pct)
- FE card folder section 6 'Ta'lim' tab skeleton (display enrolled courses with status badges)
- i18n translation keys (uz/ru/uz-cyr locale files for all LMS terms)
- Verification DB-proof workflow (kirit → saqla → qayta o'qi → ko'rinadimi round-trip tests)
- Test factory for LMS entities (real DB, no mocks per architecture standard)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- **DDL approval (Q-35)**: Migrations lms-p1-core-ddl.sql, lms-p2-nazorat-razryad-blocks.sql, lms-p3-onboarding-mentor-kaizen.sql must have owner '-- APPROVED: <name> <date>' stamp before psql execution
- **PayrollService integration (Phase 5)**: LmsPayrollGateService.checkBlock() method depends on PayrollService.computeCardSalary() existing contract; salary-gate logic locked until salary-computation owner-decision finalized
- **MesService.canEmployeeStart() contract (Phase 5)**: MES gate relies on defined LMS completion check interface—blocked pending MES module owner alignment
- **AI integration (phases 7, multiple)**: LmsAiService (chatbot Q&A, course draft generation, open-text scoring) requires Gemini API key + rate limits; feature gated until AI infrastructure ready
- **Org-chart foundation (pre-Phase 4)**: Onboarding workflow depends on Vysotskiy-7 org-chart (7 layers, manager_id population, РД-4 role mapping). Currently 18/142 head_user_ids filled—owner/HR must populate before any onboarding execution
- **Cron infrastructure (phases 3,4,5,6,7)**: 7 scheduled jobs (deadline cron, expiry cron, salary-block 3-day warning cron, 2-month practical timer, version-change re-enroll, kaizen PDCA, re-certification periodic) depend on NestJS-cron + test-mode triggers ready
- **Notification module (E1 observer pattern)**: All warning/escalation paths (overdue → HR alert, salary-block proposal, mentor rating delta) route through existing Notifications service; blocking until notification service owner-validates Event schema
- **Concurrent module dependencies**: Phase 4 (onboarding) + Phase 5 (payroll gate) cannot run parallel—payroll-gate result informs independence-order activation (sequential build required)

**❓ Ochiq savollar (egasi DATA kerak):**
- EP-LMS-009: Exact pass thresholds per course-type (owner: TX/safety=100%, general=HR config 60-80%)
- EP-LMS-011: Micro-module sequential lock policy (A-default: yes, nextmodule locked until prev complete)
- EP-LMS-019: Certificate expiry period (A-default: 1 year)
- EP-LMS-022: Kaizen bonus scale (A-default: HR configures, proposal-based not auto)
- EP-LMS-057: Min razryad for mentor qualification (A-default: razryad≥1 + card cert)
- EP-LMS-058: Backup mentor if none qualified (A-default: escalate to direct manager or adjacent card holder)
- EP-LMS-072: Periodic re-confirmation interval (A-default: 1 year, configurable by HR)
- EP-LMS-078: Interactive situation-simulation scope (A-default: operator scenario bot with AI outcome modeling)
- EP-LMS-082: Mentor bonus/deduction weight (A-default: HR sets multiplier, proposal only)
- Data ownership: head_user_id (18/142 filled—most org nodes lack designated heads) and manager_id (0/30 filled) must be populated by owner/HR before onboarding workflows execute

**📂 Manba:** docs/audit/MUSLIMBEK-PROMT-14-LMS-2026-06-08.md (7-phase executor directive, 407 lines, owner vision in Uzbek+English) · docs/audit/decisions/12-lms.md (85-question decision map: 75 answered + 10 open, all grounded in SHvB interviews + book-extracted requirements) · docs/audit/MASSIV-50/P33-LMS-lms-core-ddl.md (Phase 1-3 build spec: DDL, owned-file manifest, isolationboundary, rules-block) · docs/audit/MASSIV-50/P34-LMS-lms-onboarding-fe.md (Phase 3-7 build spec: FE pages, mentor, kaizen, onboarding workflow) · docs/XARITA-REJA-YONALISH-2026-06-07.md (master vision map: org-structure foundation, ildiz problems, build order, work model) · docs/LOYIHA-QOIDALARI-2026-06-08.md (project-wide hard rules: A1-A8 architecture, B1-B6 process, C1-C7 DDD, D-I cross-cutting rails E1-E6) · docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md (42,872-line founder interview: card-folder 6-section model, NAZORАТ VARAQASI structure, onboarding chain, mentor accountability) · docs/audit/IOT-MES-CURRENT-STATE-2026-06-08.md (IoT/POS Monitor micro-module runtime, E4 principle: tablet-based training on shop floor) · EuroPrint_Master_Prompt.md (global guardrails for executor across all sessions: verify-don't-trust, permission gates, no rewrite, honest 501)

---

## 16. POS + CC (POS Monitor + Communication Center): Factory Warehouse Tablet + Document Workflow

**Build holati:** 35%

**Vizyon (egasi):** POS Monitor va Communication Center ikki asosiy zavod modulini qamrab oladi. POS Monitor — fabrikanining tax ombori plansheti ilovasi: barcha material kirim/chiqim/inventar shu orqali o'tadi. CC — rasmiy hujjatlar uchun yagona platforma (A-System o'rnini bosadi): 14 ta vizyon hujjat turi (ZVS, ZNO, doklad, prikaz, protokol va boshqalar), 3-savat workflow, PIN-imzo, arxiv, Telegram mini-app, AI-yordamchi. POS Monitor beshinchi fazada: MES-FG integratsiya, pres fast-path, foto-dalil, GSD metrikalari, storno harakati, texkarta hard-block. CC uchinchi fazada: full-text search, attachment upload, scan-import, ZVS→Finance link, monthly analytics cron, recurring document spawn.

**Asosiy qarorlar (intervyu javobi = spec):**
- POS Monitor asosiy vazifasi = zavod ombori kirim/chiqim/inventar (Kassa Finance'da, MES sex talabida bog'liq)
- Ombor planshetga har xodim shaxsiy login (PIN/barcode) — javobgarlik aniq
- Qaytarish jarayoni = storno (teskari harakat), asl harakat o'zgarmas, immutable
- Texkarta spesifikatsiyasiga mos emas = HARD BLOCK (faqat smena/reja boshlig'i override qiladi)
- Foto-dalil = MAJBURIY (EXTERNAL_IN, DAMAGE, katta farq >10% uchun planshet kamerasidan)
- GL yozuv = yagona, 'completed' eventda entries jadvaliga (dual-write taqiq)
- POS GSD metrikalari = kunlik push HR kartasiga (formula egasi tasdiqlanmagan — placeholder)
- CC 14 vizyon hujjat turi (ADVANCE/VACATION o'rniga zavod-spetsifik)
- Marshrut = org-sxemadan avto-aniqlanadi (manager_id zanjiri)
- Tasdiqlovchi topilmasa = fallback: DEPT_HEAD→CEO→DIRECTOR (hech qachon yo'qolmaydi)
- Imzo = PIN-kod (rasmiy isbotlilik uchun)
- Tasdiqlash = ketma-ket (bosqich 1→2→3)
- Eskalatsiya = avto (SLA o'tsa boshliqqa ko'chadi) + Telegram ogohlantirish
- 3-savat = yagona ish ro'yxati (Kiruvchi + SLA alarm 24/48 soat)
- ZVS/ZNO = moliya to'lov navbatiga (event-driven)
- Scan-import = arxiv (workflow_state='archived')
- FTS search = PostgreSQL tsvector, pagination majburiy (max 50 ta)
- Attachment = drag-drop FE, storage backend, max 10MB
- Monthly analytics = reja-o'zgartirish yig'ma → Director yangi hujjat
- Recurring document spawn = cron-expression: daily/weekly/monthly

**🟢 Hozir qurish mumkin (gate yo'q):**
- P48 POS schema: enum mismatch (karantin→qc_pending), DDL ustunlar (photo_urls, issuer/receiver sig, storno, input_unit), SCRAP_IN stub, FG_FROM_MES enum — faqat TypeScript va DDL (GATED), migration file yozish
- P48 POS GL fix: approved event'da autoGl.postForMovement() o'chirish (dual-write xavfi)
- P48 POS storno: teskari harakat yaratish (createStorno metodi), immutable asl harakat
- P48 POS texkarta hard-block: INTERNAL_ISSUE uchun material spec check + override guard (smena/reja boshlig'i PIN)
- P48 POS foto-dalil enforcement: EXTERNAL_IN/DAMAGE/discrepancy >10% uchun photo_urls majburiy
- P49 POS MES-FG listener: session.completed event → FG_FROM_MES harakat avtomatik
- P49 POS pres-kirim service+controller: fast-path (kg miqdor → barcode → INTERNAL harakat completed)
- P49 POS GSD service+job: placeholder formula bilan daily metrics push (egasi formula tasdiqlanmaguncha REVIEW_PENDING)
- P49 POS low-stock event: pos.low_stock.detected emit (MM listener — P49 scope tashqarida)
- P49 POS SCRAP_IN 501 stub: movementType check → NOT_IMPLEMENTED
- P37 CC 14 vizyon template seed: eski HR templates is_active=false, yangi zavod-spetsifik is_active=true (GATED DDL)
- P37 CC types.ts: DocumentRow/TemplateRow/ApprovalRow yangi ustunlari (responsible_card_id, archive_until, series_tag, basis_document_id, ai_analysis)
- P37 CC op-code logging (EP-CC-###): cc-workflow.service.ts, cc-baskets.service.ts, cc-sla.cron.ts, cc-event.listener.ts ga EP-CC kodi qo'shish
- P37 CC Phase4 DDL (GATED): cc_documents.responsible_card_id, archive_until, series_tag; cc_approvals.basis_document_id, ai_analysis; cc_audit_trail.code
- P38 CC FTS search: searchDocuments repo metodi + GET /api/cc/documents?q= endpoint (PostgreSQL tsvector)
- P38 CC attachment upload/download: POST /cc/documents/:id/attachments (multipart), GET list, GET download (binary)
- P38 CC scan-import: POST /api/cc/documents/scan-import (image+meta → cc_documents archived + cc_attachments)
- P38 CC ZVS trigger: executeApproveTransaction da ZVS/ZNO finalized → event emit (Finance listener scope tashqarida)
- P38 CC monthly analytics: @Cron('0 0 1 * *') reja-o'zgartirish yig'ma → Director yangi REPORT hujjat
- P38 CC spawnRecurringDocuments: stub → real (daily/weekly/monthly cron_expression matching, auto draft create)

**🟡🔴⚫ Gated (AI-token / egasi-DATA / locked):**
- P48 DDL migration (p49-pos-mes-photo-gsd-scrap.sql / similar): FG_FROM_MES enum, photo_urls, issuer/receiver sig, input_unit, GSD jadvali — egasi '-- APPROVED:' izohisiz ISHGA TUSHIRILMAYDI
- P37 DDL migration (0017/0018): 14 vizyon template seed, Phase4 schema columns (responsible_card_id, etc.), immutability triggers — egasi ruxsatisiz ISHGA TUSHIRILMAYDI
- P48 GSD formula parametrlari: exact delay/deviation chegara — egasi tasdig'i kerak (hozir placeholder)
- P48 texkarta override guard: smena_boshlig/reja_boshlig roli org_functions da kim — egasi tasdig'i kerak
- P37 ORGPOLITIKA workflow 5-bosqich: FOUNDER kodi kim, time_limit_hours — egasi tasdig'i kerak
- P38 Finance listener registration: ZVS/ZNO → Finance event subscribe integration (lock: Finance modul scope)
- P38 MM listener registration: low-stock event subscribe integration (lock: MM modul scope)
- P49/P50 pres kamera capture FE: planshetga kamera UI qo'shish (P50 FE paket darvozasi)

**❓ Ochiq savollar (egasi DATA kerak):**
- POS GSD formula (plan_completion_pct, delay_count, deviation_count) — exact implementation parametrlari egasi tasdig'i kerak
- GSD delay_count chegara (4 soat — ixtiro, haqiqiy muddat?)
- GSD deviation_count % chegara (5% — ixtiro, haqiqiy chegara?)
- ORGPOLITIKA 5-bosqich asoschi (FOUNDER) kodi org_functions da kim ekanligini egasi tasdiqlashi kerak
- ORGPOLITIKA time_limit_hours (168 soat = 7 kun — egasi qiymati?)
- Scan-import source='scan' hujjatlarning taxminiy maslahat (tushunarli xizmatchi/Telegram notif?)
- ZVS/ZNO → Finance event emit qaerda (P39 Finance listener qanday subscribe bo'ladi?)
- Low-stock MM moduliga event (pos.low_stock.detected) — MM listener implementation scope?

**📂 Manba:** docs/audit/vision-questions/19-pos.md (30 ta POS Monitor vizyon savoli) · docs/audit/vision-questions/20-cc.md (32 ta CC vizyon savoli) · docs/audit/MASSIV-50/P48-POS-pos-schema-gl-guards.md (1483 qator — DDL, storno, texkarta guard, GL fix) · docs/audit/MASSIV-50/P49-POS-pos-mes-tablet.md (1778 qator — MES listener, pres-kirim, GSD, ZXing fallback, Mini-app foundation) · docs/audit/MASSIV-50/P37-CC-cc-templates-schema.md (qator 1-860 — 14 vizyon template seed, Phase4 DDL, op-code logging, super_admin guard) · docs/audit/MASSIV-50/P38-CC-cc-search-finance-cron.md (qator 1-1037+ — FTS search, attachments, scan-import, ZVS trigger, monthly analytics, recurring spawn) · CLAUDE.md (kanonik loyiha qo'llanmasi: Qoida 1-47, dependency standartlari, security, performance, monitoring) · docs/agent-constitution.md (sessiya protokoli, jarayon qoidalari, parallel role'lari) · docs/XARITA-REJA-YONALISH.md (master map — modullar o'rtasidagi bog'lantirish)

---


# 🏭 PRODUCTION DEEP-ANALYSIS (2026-06-23) — qo'shimcha (egasi so'ragan hisobot)

> 9-agent tahlil, har da'vo `file:line` + jonli `q.cjs` DB-soni bilan tasdiqlangan. PP/MES bo'limlarini to'ldiradi.

## Sex ro'yxati (~22) + 2 bo'lim
FLEKSO bo'lim: gofra liniya (2/3/4/5 sloy · makro/mikro/mini-mikro), kashirovka (avto+ruchnoy), gofra tigel (avto+ruchnoy), flekso pechat (1-5 kraska, qoliblar), skleyka, tikish (mis/stepler), piston.
OFSET bo'lim: ofset pechat (pechat-105/72), rezka/raskroy, karton tigel, tisneniya, kongryo, oynek (oknoshka), lak/UV-lak/vibrochniy, laminatsiya, trafaretka, FSM/avtovysechka, formovka.
Umumiy oxiri: archish → qadoqlash → WMS.

## Routing = NOCHIZIQLI GRAF + QAYTISHLAR (rework)
rulon → raskroy → gofra liniya → (ofset ⇄ flekso) → lamina → tigel → FSM → kashirovka → archish → qadoqlash → WMS.
Qaytish ilmoqlari: tisneniya → karton tigel/rezka/skleyka; qadoqlash(brak) → archish; tigel → gofra liniya (qolib xatosi); "gofra liniyadan boshqa hamma joyga".
Kirish/chiqish qoidalari: tigel kirish = flexo-tigel + offset-tigel, chiqish = faqat packing; kashirovka kirish = flexo 3/5-sloy + avtomat tigel 1-sloy.

## SLOY FORMULA (yuragi) — 🟢 REAL (jonli tasdiqlangan)
`gofra-conversion.service.ts` (3 formula) + `pp_flute_types`=5 (A/B/C/E/BC take-up) + endpoint + FE hook + 27 test. m²↔list↔kg ishlaydi.
- `m² = uzunlik × kenglik × chiqindi_koeff`
- `kg = m² × grammaj_gsm / 1000`
- `grammaj = liner1 + liner2 + (flute_medium × take_up_faktor)`
- Kirishlar: marka + grammaj + sloy + chiqindi + kley. Take-up = sozlanadigan master-data.
⚠️ LEKIN oziq-data yo'q: `material_cards`=31 (material_kind=NULL), `material_layer_config`=0, `material_norms`=0 → egasi 21-material seed + marka koeffitsientlarini to'ldirishi kerak.

## GAP jadvali (production)
| Element | Holat | Bo'shliq |
|---|---|---|
| Sloy formula | 🟢 REAL | ishlaydi; oziq-data yo'q (egasi) |
| Sex taksonomiyasi (22) | 🔴 MISSING | 12 generik work_center, sex-registry yo'q |
| FLEKSO/OFSET bo'lim | 🔴 STUB | org_department_id hammasi NULL |
| Nochiziqli routing + qaytish | 🔴 MISSING | faqat chiziqli; predecessor/return-edge yo'q; createRouting=501 |
| Per-sex params (norma/brak/ishchi/mashina) | 🟠 MOSTLY MISSING | config ustun/jadval yo'q |
| AI navbat (FIFO+factor) | 🟠 STUB | ranking logikasi REAL lekin chaqirilmaydi |
| Material bron (PP) | 🟠 STUB | faqat POS-ombor |
| To'lanmagan-daraja darvozasi | 🔴 MISSING | DB maydoni yo'q |
| Kunlik hisobot/KPI | 🟢 REAL | hr_daily_reports=6090, cron, KPI |
| 16h smena-aware kesim | 🟡 PARTIAL | faqat soat 15:30/16:00 |
| AI-kamera solishtirish | 🔴 STUB | jadvallar bor, reconcile yo'q |

## GOLDEN-THREAD (Order→Production→MES→QC→FG)
✅ SPINE 6 dan 5 hop REAL: SD-status→PP (sales-order-ready-planning.listener) · PP-release→MES (pp-released-mes.listener, 5 sessiya) · MES-tugash→QC (mes-completed.listener) · QC-pass→WMS (qc-passed.listener, warehouse_stock=37).
🔴 UZILGAN = ROUTING: production_orders.routing_id hammasi NULL, routings=0 → nochiziqli sex-marshrut ulanmagan.

## Production OCHIQ savollar (egasi DATA)
1. 22 sex aniq ro'yxati + FLEKSO/OFSET taqsimi + kanonik kod.
2. Har sex: norma (m²/list/kg/smena), brak%, min/max ishchi, mashina (rang/qolib/tezlik).
3. Routing qoidalari: har sexdan qaysi sexlarga + qaytish-yo'llari.
4. Marka koeffitsientlari (makro/mikro/mini-mikro): take-up + chiqindi% + kley g/m².
5. 21-material seed: code/grammaj/flute/format/waste%.
6. STKP/KPI vazn per-rol.
7. To'lanmagan-daraja ta'rifi + direktor tasdig'i qoidasi.

---
*Production tahlil oxiri.*
