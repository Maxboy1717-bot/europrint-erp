## Yo'naltirilgan intervyu — ORGSXEMA (Manba I4)

**Manba:** `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`. **Qachon:** 2026-06-25.

> Manba doc = 20-agentli jonli tahlil (794 org-schema talab, 13 mavzu, umumiy 31% mos). Har qatorda doc'ning "vs holat" statusi keltirilgan (CITE). Drift-bayroqlar (2026-06-25 refinement 1000-javoblarni O'ZGARTIRSA) "Izoh"da ⚠️ bilan.

### Step 2 — Qarorlar jadvali

| # | Savol/Talab (EP-ORG-###) | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|
| EP-ORG-001 | Karta = master-data; butun ERP card_id orqali oziqlanadi | Yagona haqiqat manbai | karta-model | ERP-keng card_id FK | Qisman (doc karta-model 42%: aktiv=org_departments 144, lekin org_functions parallel "kanonik" de-routed) | SB: ikki-olam ochiq |
| EP-ORG-002 / EP-ORG-037 | 1 karta=1 o'rin=1 xodim; dublikat lavozim 01/02/03 raqami | Atomik seat | karta-model | Seat-guard + avto-raqamlash | Qisman (1-seat guard BOR assignUser; 01/02/03 avto-raqam YO'Q) | ⚠️ EP-ORG-094 (stavka-soni) bilan ZID: atomik-1-seat vs ko'p-stavka |
| EP-ORG-003 | card_id NULL → login YO'Q va oylik YO'Q | Vizyon markaziy printsipi | login-rbac / oylik | login+payroll card-gate | Yo'q (login is_active'ga, payroll kartani tekshirmaydi; users.card_id ustuni yo'q) | Eng og'ir boshliq #1 |
| EP-ORG-004 | 1 xodim ko'p kartaga (M:N); profilda ko'rinadi | Ko'p-rol | xodim-karta | M:N bog'lanish | Qisman (backend employee_cards M:N + profil read BOR, lekin aktiv assignUser 1:1 — de-routed) | ⚠️ Ziddiyat: doc "M:N mavjud" vs aktiv 1:1 |
| EP-ORG-005 / EP-ORG-085 | Karta hech o'chmaydi — soft-delete/arxiv | Tarix saqlash | karta-model | is_active soft-delete | Qurilgan (deactivate is_active=false; hard-delete yo'q) | |
| EP-ORG-006 / EP-ORG-084 | Xodim ketsa freeze; qaytsa restore; oylik to'xtaydi | Lifecycle | xodim-karta | Freeze/restore zanjiri | Yo'q (avtomatik lifecycle yo'q; status faqat qo'lda PATCH) | |
| EP-ORG-007 | Har kartada 6 majburiy bo'lim + to'liqlik% | Papka struktura | papka | card_folders 6 bo'lim | Qisman (card_folders 6+completeness BOR, lekin de-routed org_functions FK, orphan FE) | |
| EP-ORG-008 | Har kartada razryad maydoni majburiy | Unvon | razryad | razryad_level_id | Qisman (org_departments.razryad_level_id ulangan, "majburiy" emas — 0/144 data) | |
| EP-ORG-009 | Razryad = qo'lda master-data (razryad_levels) | Sozlanuvchi shkala | razryad | CRUD + FE | Qurilgan (razryad.controller/repo + RazryadFormDialog; 6 qator) | |
| EP-ORG-010 | Razryad ko'tarilishi: imtihon→HR+rahbar→o'zgaradi | Progression | razryad | razryad_history + approval | Yo'q (razryad_history jadval yo'q; grep=0; ai_exam_attempts=0) | Boshliq #2 |
| EP-ORG-011 | 2 imtihon orasi ≥3 oy; xodim o'zi murojaat | Kutish-davri | razryad | min_months + interval check | Qisman (min_months BOR, 3-oy tekshiruv + ariza-oqim yo'q, bazis-sana yo'q) | |
| EP-ORG-012 | Razryad pasayishi ham (HR+rahbar tasdig'i) | Demotion | razryad | Downgrade oqimi | Yo'q (demotion/GradeDowngraded grep=0) | |
| EP-ORG-013 | Razryad o'zgarsa HR hujjat + ichki sertifikat majburiy | Hujjatlash | razryad | Auto HR-hujjat/sertifikat | Yo'q (grep=0; certificates=LMS kurs, 0 qator) | |
| EP-ORG-014 | Har kartada GSD/ЦКП: maqsad+birlik+chastota majburiy | Ko'rsatkich | ckp | tskp_target + unit + frequency | Qisman (target+unit ustun BOR, chastota YO'Q; 0/144 data) | |
| EP-ORG-015 | ЦКП'ni HR yozadi; matn tavsif + formula | ЦКП ta'rif | ckp | tskp text + formula | Qisman (tskp text BOR+ishlaydi 25/144; "formula" maydoni YO'Q) | |
| EP-ORG-016 | Mashinasiz xodim ЦКП: AI chatbot kunlik savol | Avto-hisobot | ckp / ai | ЦКП chatbot | Yo'q (ai_ckp_chat_logs 0 qator, unwired; generator yo'q) | Boshliq #5 |
| EP-ORG-017 | Operator ЦКП avto IoT/MES'dan + rasmiy PDF invoys | Avto-feed | ckp / ai | IoT/MES→karta feed | Yo'q (operator-hourly-invoice.cron unregistered + pp_production_facts jadval yo'q + PDF defer) | |
| EP-ORG-018 / EP-ORG-052 | 16 soat ЦКП hisobot yo'q → o'sha kun oylik yozilmaydi | ЦКП-gate | oylik-bonus | Deadline + oylik-blok | Qisman (daily-report-deadline.cron 23:00 locked BOR; "16 soat" oyna YO'Q, oylik-blok ULANMAGAN) | ⚠️ deadline 16 vs 3 soat ziddiyat |
| EP-ORG-019 | Har kartada otdeleniye_no (1-7) majburiy (Vysotskiy 7) | Otdeleniye kod | tree | 1-7 majburiy raqam | Yo'q (otdeleniye_id FK 45/139, qiymat 1-7 EMAS; NOT NULL yo'q) | |
| EP-ORG-020 | Har otdeleniyaga bitta bosh GSD-metrika (gsd_metric) | Otdeleniye metrika | ckp / tree | gsd_metric ustun | Yo'q (gsd_metric ustun grep=0; company_tskp 0 qator unwired) | |
| EP-ORG-021 / EP-ORG-099 | Yagona daraxt, 7 qatlam, ota-karta=rahbar | Struktura | tree | Recursive chain | Qisman (parent_id+level+recursive chain jonli; yagona-daraxt invariant buzilgan 14 ildiz) | |
| EP-ORG-022 | Rahbar vakant → quyi ishlaydi, skip YO'Q | No-skip eskalatsiya | manager | Walk-up no-skip | Qurilgan (getApprovalChain no-skip; jonli tasdiq) | ⚠️ Q38 "avto 1-3 daraja SKIP" bilan ZID |
| EP-ORG-023 | Karta = ruxsat (RBAC); karta o'zgarsa ruxsat o'zgaradi | RBAC | login-rbac | position_permissions→karta | Qisman (RBAC BOR lekin eski positions'ga keyed, org_departments EMAS; 1380 qator) | |
| EP-ORG-024 | Har kartada oylik_turi (soat/kun/ishbay) + bonus | Oylik-manba | oylik-bonus | salary_type + bonus_config | Qurilgan (sxema+FE Edit+persist) | |
| EP-ORG-025 | Bonus = HR/Moliya/rahbar sozlaydi, KPI'ga bog'lanmaydi | Bonus siyosati | oylik-bonus | Erkin bonus, KPI-uzuq | Qurilgan (bonus_config erkin matn; KPI-formula yo'q = mos) | |
| EP-ORG-026 | Oylik tasdiq zanjiri: avto→HR+Moliya→rahbar | Payout-approval | oylik-bonus | 4-bosqichli zanjir | Qisman (salary_payout_approvals ai→hr→finance→director BOR, 1 qator) | |
| EP-ORG-027 | Karta darsligi tugamaguncha oylik to'xtaydi (LMS-gate) | Darslik-gate | darslik / oylik | LMS→Payroll | Yo'q (LmsCompletionService PURE gate, "DO NOT touch payroll"; hech qayer chaqirmaydi) | Boshliq #4 |
| EP-ORG-028 | Darslik kartaga biriktiriladi (xodimga emas) | Darslik-bind | darslik | courses.card_id | Qisman (card_id ustun BOR, lekin 0/5 kurs bog'langan; FE chaqirmaydi) | |
| EP-ORG-029 | Darslik oqimi: o'quv bo'lim→AI→HR+rahbar tasdiq | Approval workflow | darslik | Course approval | Yo'q (to'g'ridan INSERT; AI/HR tasdiq bosqichi yo'q) | |
| EP-ORG-030 | Bitta markaziy AI karta↔xodim mosligini baholaydi | AI-fit | ai | AiFitService | Qisman (AiFitService real prompt+yozadi jonli id=3; manba avto-yig'ish yo'q) | |
| EP-ORG-031 | AI moslik PDF → xodim+rahbar+HR | Tarqatish | ai | PDF distribute | Yo'q (ai modulida PDF grep=0; faqat JSON) | |
| EP-ORG-032 | Skill-matrix + AI vorislar (succession) sabab bilan | Talent | ai | Matrix + succession | Qisman (skill-matrix+succession CRUD real 18 qator; nomzod QO'LDA, AI-taklif yo'q) | |
| EP-ORG-033 | Ko'nikma qo'shish: da'vo→test→raport→matritsa | Skill-growth | razryad / ai | Claim→test→matrix | Yo'q/Qisman (upsertSkillScore BOR + SKILL_UPDATED event; "da'vo→test→raport" zanjiri yo'q; data 0-2) | |
| EP-ORG-034 | 3 kun sababsiz/ЦКП yo'q → avto-blok; ochish HR→dir→admin | Intizom | login-rbac | Absence avto-blok | Qisman (absence-block.cron day1/2/3 disableUser BOR; ЦКП-qism yo'q) | |
| EP-ORG-035 | Smena/ish-vaqt alohida jadval, kartaga ulanadi | Smena-link | boshqa | Shift table FK | Qisman (free-text work_schedule BOR; alohida smena-jadval FK yo'q) | |
| EP-ORG-036 | Karta rang = otdeleniye/holat; vakant = kulrang | Vizual | boshqa / karta-model | Rang-mapping | Qisman (rang DARAJA bo'yicha, otdeleniye emas; vakant QIZIL punktir, talab "kulrang") | ⚠️ Vakant rang: talab kulrang, kod qizil |
| EP-ORG-038 | Vakansiya oqimi: vakant→HR talabnoma→recruitment→bind | Recruit-bind | xodim-karta / manager | Auto-bind | Yo'q/Qisman (HR-talabnoma real node_hr_requests; recruitment→karta AVTO-bind yo'q) | |
| EP-ORG-039 | Migratsiya = mavjudni saqlash (142 node+30 xodim+karta-qatlam) | ADD-layer | ikki-olam | ALTER add columns | Qurilgan (org_departments 144, 7-qatlam saqlangan, karta-ustunlar real) | |
| EP-ORG-040 | Bitta DDL; ikki-olam YO'Q; 2-dept birlashadi | Yagona haqiqat | ikki-olam | Merge/DDL | Yo'q (departments+org_departments+org_functions+positions HAMMASI alohida base jadval) | Boshliq #3 |
| EP-ORG-040b | org_departments kanonik hub, boshqa modul unga bog'lanadi | Kanonik hub | ikki-olam | FK-hub | Qisman (28 jadval org_departments'ga FK — real hub; lekin parallel base'lar yashaydi) | |
| EP-ORG-041 | Yangi bo'lim → avto-kaskad POS-ombor + head RBAC | Kaskad | ikki-olam / boshqa | Event cascade | Qurilgan (org-cascade.listener warehouse INSERT+grantRole, create'da emit) | |
| EP-ORG-041b | Transfer (node ko'chirish) → avto-kaskad | Transfer-kaskad | ikki-olam | move emit | Yo'q (move() event emit qilmaydi; faqat create emit) | |
| EP-ORG-041c | Kaskad HR-adaptatsiya + CC-shartnoma ham yangilaydi | Kaskad-kengaytma | ikki-olam | adaptation/contract cascade | Yo'q (listener faqat warehouse+RBAC; adaptatsiya/shartnoma yo'q) | |
| EP-ORG-042 | Maxfiy maydonlar (oylik/AI/razryad) faqat ruxsatli; BE projection | Field-security | login-rbac | Role-based projection | Yo'q (findOne to'liq node qaytaradi; maydon-filtri yo'q) | |
| EP-ORG-043 | Razryad jadval ustunlari (nom/tartib/talab/oylik/imtihon/sertifikat) | Master-schema | razryad | Ustunlar to'plami | Qurilgan (razryad_levels barcha ustun + FE) | |
| EP-ORG-044 | Razryad nomlash: raqam + nom birga ("4-razryad — Katta mashinist") | Nomlash | razryad | name+level | Egasi-data (name+level ustun BOR; "— nom" qism 6 qatorda yo'q — egasi kiritadi) | |
| EP-ORG-045 | Razryad oylik = min-max oraliq; nuqta boshliq taklif→HR | Salary-band | razryad / oylik | min/max + approval | Qisman (salary_min/max BOR; taklif→HR workflow yo'q; 6 qator NULL) | |
| EP-ORG-046 | Razryad imtihon = nazariy + amaliy (ikkalasi shart) | Imtihon-tur | razryad | exam_type struktura | Qisman (exam_type erkin matn; 2-alohida ball/shart YO'Q) | |
| EP-ORG-047 | Kartada sertifikatlar ro'yxati + muddat; 30 kun oldin ogohlantirish | Sertifikat | razryad | Cert list + expiry cron | Yo'q (cert ustun yo'q; 30-kun cron grep=0) | |
| EP-ORG-048 | Razryad master faqat HR boshlig'i + egasi tasdig'i | Dual-approval | razryad | 2-bosqich approval | Qisman (RBAC BOR manager ham kiradi; owner dual-approval yo'q) | |
| EP-ORG-049 | ЦКП o'lchov turi: SON/FOIZ/VAQT kartaga tanlanadi | O'lchov-enum | ckp | Enum select | Egasi-data (mexanizm to'liq BOR; 0/144 data) | |
| EP-ORG-050 | ЦКП hisoblash manbasi: avto (IoT/MES) yoki qo'lda | Manba-flag | ckp | source ustun | Yo'q (avto/qo'lda source ustuni yo'q; fakt-qiymat jadval yo'q) | |
| EP-ORG-051 | ЦКП norma: kartada standart + xodimga shaxsiy tuzatish | Personal-override | ckp | per-employee override | Qisman (karta-norma BOR; shaxsiy override jadval yo'q) | |
| EP-ORG-053 | Savol-bank: karta turi + razryad (matn/variant/javob/qiyinlik) | Question-bank | razryad / ai | hr_question_bank | Qisman (jadval strukturali BOR; 0 qator; karta=legacy org_functions) | |
| EP-ORG-054 | Imtihon savol manbasi: boshliq/usta yozadi + AI + HR tasdiq | Authoring | razryad / ai | Author→AI→HR flow | Yo'q (faqat SELECT o'qish; authoring/approve INSERT yo'q) | |
| EP-ORG-055 | O'tish chegarasi har razryad uchun alohida (qotirma taqiq) | Threshold | razryad | exam_pass_threshold | Egasi-data (ustun+FE BOR, DEFAULT NULL; 6 qator NULL — egasi) | |
| EP-ORG-056 | Qayta topshirish qoidasi sozlanuvchi (14 kun/yiliga 3) | Retake-rule | razryad | max_retakes + kutish | Qisman (max_retakes BOR; "14 kun" kutish + majburlash yo'q) | |
| EP-ORG-057 | Karta shabloni: lavozim-turi → standart avto-to'ladi | Template | papka | card_templates | Yo'q (shablon jadval yo'q; avto-to'ldirish yo'q) | |
| EP-ORG-058 | Shablon o'zgarsa eski karta o'zgarmas; "moslashtirish" tugma | Template-versioning | papka | Opt-in reapply | Yo'q (shablon mexanizmi umuman yo'q) | |
| EP-ORG-059 | Boshlang'ich 10-15 zavod-lavozim shablon to'plami | Seed | papka | Seed templates | Yo'q (jadval+seed yo'q) | |
| EP-ORG-060 | I.o. muddatli (boshlanish-tugash); muddat tugagach avto-qaytadi | Acting | xodim-karta / manager | Acting lifecycle | Qisman (backend to'liq employee_cards.is_acting+revert.cron; DATA 0, de-routed) | ⚠️ boshqa mavzuda "Yo'q" (org_departments'da acting ustun yo'q) — ikki-olam artefakti |
| EP-ORG-061 | I.o. oylik = o'z oyligi + i.o. ustamasi | Acting-pay | oylik-bonus | own + supplement | Qurilgan (employeeSalaryTotal own+SUM(acting_supplement)) | |
| EP-ORG-062 | I.o. huquqi: kunlik=ha, pul/kadr=yo'q (eskalatsiya) | Acting-scope | login-rbac | Scoped RBAC | Yo'q (scoped-delegation grep=0) | |
| EP-ORG-063 | Kartani boshqa bo'limga ko'chirish: tarix saqlanadi, manager avto | Move | karta-model / tree | move + history + auto-manager | Qisman (move() BOR; tarix-yozuv yo'q; manager avto-bind alohida DATA-gated) | |
| EP-ORG-064 / EP-ORG-065 | Ikki kartani merge / bittani split, tarix ko'chadi | Merge/split | karta-model | Merge/split endpoint | Yo'q (grep=0) | ⚠️ CHRONOLOGIK DRIFT: doc: "MASTER-SAVOL merge/split YO'Q atomik" vs decisions/01 (1000-javob) "BOR" — bu doc bekor qiladi |
| EP-ORG-066 / EP-ORG-142 | Ko'p-karta oylik = har karta to'liq oyligi profilga yig'iladi (FORMULA A) | Salary-sum | oylik-bonus | SUM formula | Qurilgan (employeeSalaryTotal SUM, cap yo'q; jonli render) | |
| EP-ORG-067 / EP-ORG-070 | Audit-tarix: maydon/eski/yangi/kim/qachon/sabab; immutable | Audit | boshqa / login-rbac | Field-level audit | Qisman (audit_logs+Interceptor BOR, append-only Qurilgan; maydon-diff EMAS, reason avto="error") | |
| EP-ORG-068 | O'zgarish sabab: pul/razryad majburiy, oddiy ixtiyoriy | Reason-gate | login-rbac | Conditional reason | Yo'q (DTO reason qabul qilmaydi; avto-to'ladi) | |
| EP-ORG-069 | Tarix ko'rish: owner+HR+yuqori boshliq; audit-log faqat Super Admin | Scope | login-rbac | Scoped history read | Yo'q (klass-level umumiy @Roles; scope yo'q) | |
| EP-ORG-071 / EP-ORG-072 | Vakansiya: ochilgan sana + kun; aging 0-14 yashil/15-45 sariq/45+ qizil | Aging | karta-model / boshqa | Aging bucket | Yo'q/Qisman (aktiv VacantTab faqat vakant-flag; aging FAQAT de-routed card-world vacancies=0) | |
| EP-ORG-073 | Vakansiya prioritet: 3 daraja (kritik/o'rta/past) | Priority | boshqa | Priority enum | Yo'q (vakant-karta prioritet ustuni yo'q) | |
| EP-ORG-074 | Vakansiya SLA: kritik 14/o'rta 30/past 60 kun | SLA | boshqa | SLA muddat | Yo'q (prioritet yo'q → SLA yo'q) | |
| EP-ORG-075 / EP-ORG-076 / EP-ORG-078 | Kartalarni Excel import: shablon + xato-satr + partial commit + audit | Import | boshqa | Import endpoint | Yo'q (excel_import_* jadval BOR 0 qator; org-modul ishlatmaydi; import endpoint yo'q) | Boshliq #8 |
| EP-ORG-077 | Karta eksport: tanlangan ustunlar Excel + PDF | Export | karta-model / boshqa | Export | Qisman (Excel+PDF real; "tanlangan ustunlar" yo'q — qat'iy) | |
| EP-ORG-079 / EP-ORG-082 | Filtr (otdeleniye/razryad/holat/oylik) + saqlangan ko'rinishlar | Filter | karta-model / boshqa | Multi-filter + saved views | Qisman/Yo'q (search+nodeType filtr; razryad/holat/oylik ko'p-filtr + saved-view yo'q) | |
| EP-ORG-080 | "Bo'sh kartalar" tezkor filtri + aging saralash | Vacant-filter | boshqa | Quick filter | Yo'q (global vakant-filtr + aging saralash yo'q) | |
| EP-ORG-081 | Xodim↔karta moslik: AI ball bilan ranjlangan ro'yxat | Fit-ranking | ai | Ranked fit list | Qisman (ai/fit/scores desc BOR; computeCardFit DETERMINISTIK 0.5+0.5, AI emas) | |
| EP-ORG-083 / EP-ORG-141 | Karta 5 holat (Faol/Vakansiya/I.o./Muzlatilgan/Arxiv) state-machine | Lifecycle | karta-model | State enum + machine | Qisman (aktiv=faqat is_active boolean; 5-holat enum FAQAT de-routed card-world) | Boshliq #6 |
| EP-ORG-084 | Kartani muzlatish: sabab + muddat | Freeze | karta-model | Freeze op | Yo'q (frozen faqat enum-qiymat; muzlatish-amali yo'q) | |
| EP-ORG-086 | Arxiv kartani tiklash (eski tarix bilan) | Restore | karta-model | Restore endpoint | Yo'q (restore/unarchive endpoint yo'q) | |
| EP-ORG-087 / EP-ORG-106 | Kartada "talablar"/malaka strukturali (tur/daraja/majburiy); AI o'qiy oladi | Requirements | karta-model / razryad | Structured req schema | Qisman/Yo'q (portret JSONB erkin; qat'iy strukturali maydon yo'q; AI deterministik emas) | |
| EP-ORG-088 | Darslik kartaga bog'lanadi; xodim kelganda ko'radi | Card-material | darslik | position_folder_content | Qisman (org_function_id material-papka BOR; completion/gate yo'q; 0 qator) | |
| EP-ORG-089 | Kartaga hujjatlar (yo'riqnoma+xavfsizlik+ЦКП+fayllar) virtual papka | Docs-folder | papka | Folder CRUD | Qisman (FolderTab document/video/test real; turlar faqat 3) | |
| EP-ORG-090 / EP-ORG-107 | "Kerakli jihozlar" ro'yxati + aktivlar moduliga bog'lanadi | Equipment | papka / boshqa | position_equipment | Qisman/Yo'q (jadval+asset_item_id BOR; controller/service/FE YO'Q; 0 qator) | |
| EP-ORG-091 | Razryad karyera yo'li: keyingi razryad + shart | Career-path | razryad | career_path_steps | Qisman (RazryadTab "narvon" faqat displey; strukturali bog' yo'q; career_paths=0) | |
| EP-ORG-092 | Razryad davriy qayta attestatsiya (xavfli har 2 yil); o'tmasa muzlat | Re-attest | razryad | Periodic cron | Yo'q (xavfli/texnik atribut yo'q; 2-yillik cron yo'q) | |
| EP-ORG-093 | Past moslikda tayinlash: AI ogohlantiradi + sabab, lekin BLOKLAMAYDI | Warn-not-block | ai | Fit-warn on assign | Yo'q (assignda AiFit chaqirilmaydi; faqat seat-guard bloklaydi) | |
| EP-ORG-094 | Kartada "stavka soni" (3 stavka×1 xodim); tungi smena ustama % | Multi-seat | xodim-karta | seats + shift ustama | Yo'q (seat-count ustun yo'q; atomik 1-seat qat'iy; tungi-ustama yo'q) | ⚠️ Intervyu ziddiyatli (3 alohida karta vs 1 kartada ko'p stavka); EP-ORG-002 bilan ZID |
| EP-ORG-095 | Karta = 12 bo'limli yo'riqnoma shabloni (6→12); to'lmasa "tugallanmagan" | 12-section | papka | 12 bo'lim + gate | Yo'q (faqat 6 bo'lim; 12 yo'q; completeness bloklamaydi) | |
| EP-ORG-096 | Har kartaga "ЦКП + 1..N продукт" slotlari; alohida kuzatiladi | Multi-product | ckp | Product slots | Yo'q (product_slot jadval yo'q; 1 tskp text) | |
| EP-ORG-097 / EP-ORG-098 | Karta xato-katalogi; AI baho 2-tomonlama (xato−/muvaffaqiyat+); og'irlikli | Error-catalog | ckp / ai | defect_catalog card-link | Yo'q (error/defect_catalog org-kartaga bog'lanmagan; og'irlikli formula kod yo'q) | |
| EP-ORG-099 | Departament№+Bo'lim№+Sektsiya nomi majburiy (zavod kodi) | Address | tree | 3-qismli majburiy | Yo'q (faqat generik code optional; 3-qism enforcement yo'q) | |
| EP-ORG-100 | 7 departament qotirilgan master-ro'yxat (ikki-olam tugaydi) | Master-otdeleniye | tree | Fixed 7-list | Yo'q (master-jadval yo'q; otdeleniye=oddiy qator + dublikat 14) | |
| EP-ORG-101 | 4=bevosita ishlab chiqarish, 5=qo'llab-quvvatlash; funksiya-teg | Function-tag | tree | Function enum | Yo'q (funksiya-teg maydoni yo'q) | |
| EP-ORG-102 | Har bo'lim/karta НО-kod (НО-1..НО-14); eski hujjat meros | Legacy-code | tree / boshqa | НО-kod maydon | Yo'q (generik code 0/144; otdeleniye_code OTD1-7/ADMIN — НО-* emas) | |
| EP-ORG-103 | "Qaror beruvchi rol" (РД-4/РД-5) karta atributi; tasdiq avto-marshrut | Decision-role | login-rbac / manager | rd_tier atribut | Qisman/Yo'q (avto-marshrut struktura BOR; РД-4/5 atribut ustun YO'Q, rbac_tier 144 NULL) | |
| EP-ORG-104 | Karta = "Lavozim papkasi" konteyner (yo'riqnoma+politika+darslik+kontrolniy) | Container | papka | Full container | Qisman (papka hujjat/video/test; org_policies/kontrolniy jadval yo'q) | |
| EP-ORG-105 | "Kontrolniy list": har bo'lim tasdiq+sana+imzo; hammasi tasdiqlanmaguncha "tayyor emas" | Checklist-gate | papka | card_signatures | Yo'q (signature jadval yo'q; gate yo'q) | |
| EP-ORG-108 | "Bo'ysunish" karta→karta vertikal (manager_id muammosini hal) | Vertical | manager | parent_id chain | Qurilgan (parent_id + recursive chain jonli, kanonik org_departments) | |
| EP-ORG-109 | Karta javobgarligi: standart bandlar avto + xos qo'lda | Responsibility | papka | Auto standard clauses | Qisman (javobgarlik erkin text; standart avto-to'ldirish yo'q) | |
| EP-ORG-111 | ЦКП tur tegi (mahsulot/holat/foiz) + o'lchov usuli; RD-4/5 kiritadi | ЦКП-type | ckp | tskp_type + RD-gate | Qisman (measurement_unit BOR; tur-teg ustun yo'q; RD-cheklov yo'q) | |
| EP-ORG-112 | ЦКП ierarxik kaskad: quyi→yuqori to'planadi | Cascade-agg | ckp | CkpReported cascade | Yo'q (CkpReported/cascade grep=0) | |
| EP-ORG-113 | Har karta statistik ko'rsatkichlari modullardan avto to'ladi | Auto-stats | ckp | Event feed | Yo'q (statistics_type=teg; MES/WMS avto-feed yo'q; function_kpis 0 unwired) | |
| EP-ORG-114 | Rahbar KPI'si quyi kartalardan AVTO to'planadi (vertikal kaskad) | KPI-rollup | manager / ckp | Roll-up | Yo'q (roll-up kod grep=0) | |
| EP-ORG-115 | Yangi xodim bosqichlari (o'qish 2 oy→imtihon→rahbar→faol); oylikka ta'sir | Onboarding-stages | xodim-karta | Staged activation + reduced rate | Yo'q (onboarding modul kartaga ulanmagan; 2-oy/reduced oylikка ta'sir yo'q) | |
| EP-ORG-116 | Onboardingda kartaga mentor (2 mentor: adaptatsiya+usta) | Mentor | xodim-karta / darslik | Card-mentor | Yo'q (onboarding faqat 1 buddy; mentor jadvallar 0; kartaga emas) | |
| EP-ORG-117 | Orgpolitikalar "SERIYA" bo'yicha kartalarga avto-biriktiriladi | Policy-series | papka | org_policies + assignment | Yo'q (org_policies jadval yo'q) | |
| EP-ORG-118 | Karta "lavozim nomi" + "unvon" (razryad/rutba) alohida maydonlar | Title-field | karta-model / razryad | Alohida title ustun | Qurilgan (karta-model: name+razryad_level_id alohida) | ⚠️ ICHKI ZID: razryad-mavzuda "Yoq" (org_departments'da unvon/title alohida ustun yo'q) |
| EP-ORG-119 | Karta smena-turi tegi (3 smenali); ishlab chiqarish smenaga ko'paytiriladi | Shift-tag | boshqa | shift_type teg | Yo'q (shift_type ustun yo'q; faqat work_schedule matn) | |
| EP-ORG-120 | Karta "kun tartibi" (ish-vaqt rejimi) qoidasiga bog'lanadi; davomat solishtiriladi | Work-mode | boshqa | work_mode FK | Yo'q (rejim-jadval FK yo'q; free-text) | |
| EP-ORG-121 | Karta "hisobot majburiyati" teg (davriylik + qabul qiluvchi); bermaslik avto (3 soat) | Report-obligation | ckp | Obligation teg + detect | Yo'q (report_obligation ustun yo'q; cron dead + xodim-asosli) | |
| EP-ORG-122 | Karta "talab domen-bilim" (qog'oz/gofra); LMS shunga bog'lanadi | Domain-knowledge | darslik | Required-knowledge list | Yo'q (domen-bilim jadval yo'q; LMS bog'lanmaydi) | |
| EP-ORG-123 | Karta korporativ raqam + ruxsat abonent toifalar | Corp-phone | boshqa | phone/abonent ustun | Yo'q (ustun yo'q) | |
| EP-ORG-124 | Ta'til tasdig'i: i.o. tayinlash + vazifa-topshirish to'lgach beriladi | Leave-gate | xodim-karta / manager | Leave precondition | Yo'q (i.o.+handoff gate yo'q) | |
| EP-ORG-125 | Karta versiyalanadi (eski saqlanadi); versiya o'zgarsa qayta tasdiq | Versioning | papka | version_no + resign | Yo'q (version ustun yo'q; upsert eski o'rniga yozadi) | |
| EP-ORG-126 | Karta 2 raqamli imzo bilan kuchga kiradi (RD + tanishgan xodim + sana) | 2-signature | login-rbac / papka | Signature workflow | Yo'q (imzo ustun/endpoint yo'q; karta darhol faol) | |
| EP-ORG-127 | Karta 2 qatlam: vazifa ta'rifi + amaliy qadamlar | 2-layer | papka | vazifa+jarayon struktura | Qisman (vazifa+jarayon ustun BOR ma'noviy; erkin text, de-routed) | |
| EP-ORG-128 | Karta mashq/test to'plami "Sbornik"; imtihon shundan, AI baholaydi | Exercise-set | darslik / ai | Sbornik jadval | Qisman (ai-exam org_function_id BOR; maxsus Sbornik jadval yo'q; attempts=0) | |
| EP-ORG-129 | Karta atamalar lug'ati (glossariy); darslikda tooltip | Glossary | darslik / papka | Glossary jadval | Yo'q (glossary jadval yo'q) | |
| EP-ORG-130 | 4 ЦКП formula turi (miqdor%/sifat/muddat%/holat); kartaga mosi | Formula-type | ckp | formula_type enum | Yo'q (formula-turi enum yo'q; measurement_unit ≠ formula) | |
| EP-ORG-131 | Karta MINIMAL razryad talab; xodim o'z razryadi; AI moslik tekshiradi | Min-razryad | razryad | Min semantics + AI | Qisman (karta razryad ulangan; "minimal" semantika + xodim-razryad + AI yo'q) | |
| EP-ORG-132 | AI gap-analiz: karta talab vs xodim haqiqat → o'qish rejasi | Gap-analysis | ai | Gap → LMS plan | Qisman (getGapAnalysis DB-SQL gap + SKILL_GAP event; AI-driven emas; auto LMS-reja yo'q) | |
| EP-ORG-133 | Karta "majburiy tizim-qaydlari" (boshlandi/bosqich/tugadi); bajarilmasa signal (A-System) | System-logs | boshqa | card_activity_logs | Yo'q (ustun/jadval yo'q; signal yo'q) | 🔵 OCHIQ (IoT bosqichiga ko'chirilgan) |
| EP-ORG-134 | Razryad pasayish triggerlari (statistik/xato/imtihon); AI taklif→RD-4 tasdiq | Demotion-trigger | razryad | Trigger + AI + approve | Yo'q (trigger+AI-taklif oqimi yo'q; razryad_history yo'q) | |
| EP-ORG-135 | Bo'sh продукт slotlari "tugallanmagan" + rahbarga topshiriq | Empty-slot | ckp | Slot-completeness | Yo'q (product slot yo'q → tugallanmagan-belgi yo'q) | |
| EP-ORG-136 | Vakant karta ЦКП vaqtincha yuqori/qo'shni kartaga (ish to'xtamaydi) | ЦКП-failover | manager / ckp | ЦКП delegation | Yo'q (failover mexanizmi yo'q) | 🔵 OCHIQ |
| EP-ORG-137 | Karta "oxirgi ko'rilgan sana" + 1 yil oshsa "ko'rib chiqing" eslatma | Review-reminder | karta-model | last_reviewed + cron | Qisman (last_reviewed_at ustun + de-routed markReviewed; aktiv FE review-tugma/eslatma yo'q) | |
| EP-ORG-138 | Kartadan rasmiy "Должностная инструкция" PDF (12 bo'lim + imzo joylari) | Per-card PDF | papka | Per-card instruction PDF | Yo'q (faqat butun org-jadval PDF; per-karta yo'q; karta-id param yo'q) | |
| EP-ORG-139 | Karta штат-reja birligiga bog'lanadi (tasdiqlangan o'rin vs to'lgan; byudjet) | Staffing-plan | boshqa | штат FK | Yo'q (штат-jadval yo'q; FK yo'q) | ⚠️ Manba ziddiyati A=bog'lanadi vs B=alohida — egasi qaror kutadi |
| EP-ORG-140 | "Mutaxassis karta" shabloni alohida (bosh texnolog/konstruktor — tex-karta bog') | Specialist-template | papka | Specialist template | Yo'q (karta-shablon turlari jadval yo'q) | |
| EP-ORG-143 | Karta shabloni lavozim-turi zagotovka (operator/rahbar/mutaxassis) | Template-type | papka | Preset templates | Yo'q (shablon/zagotovka yo'q) | |

### Step 3 — Ochiq savollar (Org)

| Savol/Muammo | Qachon ko'tarilgan | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Kunlik hisobot deadline: 16 soat vs 3 soat ziddiyati; yakuniy raqam | 2026-06-25 (Q-ZIDDIYAT-DEADLINE) | ORGSXEMA §Faqat-egasi + ckp | Egasi yakuniy raqamni belgilamagan; spec=16 vs BARCHA_JAVOBLAR=3 | ckp/oylik |
| EP-ORG-139 штат-reja manba: A=bog'lanadi vs B=alohida | 2026-06-25 | ORGSXEMA §Faqat-egasi + boshqa | Egasi qaror bermagan; ikkala interpretatsiyada ham mexanizm yo'q | boshqa |
| EP-ORG-094 stavka soni: 3 alohida karta vs 1 kartada ko'p stavka + tungi ustama | 2026-06-25 | ORGSXEMA xodim-karta | Intervyu javoblari ziddiyatli; EP-ORG-002 atomik-1-seat bilan ZID | xodim-karta |
| EP-ORG-064/065 merge/split: BOR (decisions/01) vs YO'Q atomik (MASTER-SAVOL) | 2026-06-25 | ORGSXEMA karta-model | Chronologik drift — 2026-06-25 doc merge/split YO'Q deydi; kod ham yo'q | karta-model |
| Q38 vs EP-ORG-022: rahbar vakant → "avto 1-3 daraja skip" vs "no-skip" | 2026-06-25 | ORGSXEMA manager (Q38 vs EP-ORG-022) | Ikki javob-manba zid; kod no-skip ni tanlagan | manager |
| workflow_rules gorizontal marshrut = 0 qator | 2026-06-25 | ORGSXEMA manager | Admin/egasi bo'lim-aro yo'llarni hali chizmagan (konfiguratsiya) | manager/coordination |
| head_user_id 18/144 to'la (126 NULL); manager_id backfill DATA-gated | 2026-06-25 | ORGSXEMA §Faqat-egasi | Egasi/HR har kartaga rahbar kiritishi kerak | manager |
| razryad_level_id biriktiruvi 0/144; oylik-band (salary_type/min/max) NULL | 2026-06-25 | ORGSXEMA §Faqat-egasi | Egasi razryad+oylik qiymatlarini "0 dan" kiritmaguncha payroll total=0 | razryad/oylik |
| ЦКП DATA: tskp 25/144, tskp_target/qym_uz/measurement_unit 0/144 | 2026-06-25 | ORGSXEMA §Faqat-egasi | Egasi ЦКП qiymatlarini kiritmagan | ckp |
| Razryad exam-config (threshold/retakes/salary) 6 qatorda NULL | 2026-06-25 | ORGSXEMA §Faqat-egasi | Default NULL (hardcode taqiq); egasi har razryadga sozlaydi | razryad |
| rbac_tier (РД darajasi) 144/144 NULL | 2026-06-25 | ORGSXEMA §Faqat-egasi | Egasi "qaror beruvchi rol" qiymatini bermagan | login-rbac |
| camera_zone_id / telegram_group_id 0/144 | 2026-06-25 | ORGSXEMA §Faqat-egasi | Egasi AI-kamera zona + Telegram guruh ID bermagan | ikki-olam/boshqa |
| AI kalitlar: ANTHROPIC bor; OPENAI/GEMINI bo'sh | 2026-06-25 | ORGSXEMA §Faqat-egasi + ai | Egasi OPENAI/GEMINI kalit bermagan (aisha-vision GEMINI kutadi) | ai |
| EP-ORG-133 A-System majburiy tizim-qaydlari | 2026-06-25 | ORGSXEMA boshqa (🔵 OCHIQ) | IoT bosqichiga ko'chirilgan — hali qurilmagan | boshqa/IoT |
| EP-ORG-136 vakant ЦКП failover (yuqori/qo'shni karta) | 2026-06-25 | ORGSXEMA manager/boshqa (🔵 OCHIQ) | Egasi vizyoni "avto emas" — mexanizm hali yo'q | ckp/manager |
