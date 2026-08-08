# MASSIV-100 — ORG-SCHEMA: 31% → 100% MASTER REJA

> Manba: [ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) (794 talab, 13 mavzu, 31% mos).
> Vizyon: [project_karta_vizyon_spec](../../../.claude/projects/.../memory) + `decisions/01-org-kartalar.md` (EP-ORG-001..143).
> Maqsad: org-schema ("miya") ni KARTA-markazli vizyonning 100% MEXANIZMIga yetkazish, agentlarga (Muslimbek) topshirish uchun.

---

## 0. EGASI QARORLARI (2026-06-25)

| # | Qaror | Ta'sir |
|---|-------|--------|
| Q1 | **Ko'p-karta**: xodim bir nechta kartani egallaydi; oylik = stavka-ulushlar yig'indisi (0.5+0.5 ≤ 1.0; oshsa OWNER ruxsati). EP-ORG-004/066. | Faza 1 (M:N), Faza 4 (oylik-sum) |
| Q2 | **"100%" = MEXANIZM 100%**: barcha jadval/endpoint/UI/gate/dizayn TO'G'RI ishlaydi; razryad-qiymat, oylik-band, head_user_id, ЦКП, AI-kalit = egasi-data (productionda 0 dan to'ladi). FABRIKATSIYA TAQIQ. | Har faza: struktura+gate, data egasidan |
| Q3 | **Dizayn = EP design-system izchillik**: barcha org-schema sahifalari `DIZAYN_QOIDALARI.md` token+shablon+komponent bilan bir xil; mavjud joylashuv saqlanadi; REGRESS-HIMOYA (ishlayotgan element o'chmaydi). | Faza 11 + har faza FE-bo'limi |
| Q4 | **Direktiva = master-reja + ketma-ket FAZA-direktivalar** (≥1000 qator har biri, bog'liqlik tartibida). | Bu hujjat + `PHASE-NN-*.md` |

---

## 1. KANONIK ARXITEKTURA QARORLARI (bosh-dasturchi)

1. **Kanonik karta-jadval = `org_departments`** (node=karta). FE allaqachon shunga ulangan (hierarchy/node-detail). `org_functions` (de-routed CardController dunyo) **RETIRE**: FK'lar (`employee_cards.card_id`, `card_folders.card_id`, payroll/RBAC/LMS refs) → `org_departments.id`; test-data 0 (ko'chirilmaydi). `org_functions` → bo'sh + `DROP` yoki compat-VIEW.
2. **Xodim↔karta link = `employee_cards`** (M:N), FK → `org_departments`. `employee_org_departments` → `employee_cards`ga konvergatsiya (yoki VIEW). Stavka-ulush (`stake_fraction`) + salary-sum shu yerda.
3. **Oylik manbai = karta**: `org_departments.razryad_level_id → razryad_levels.coefficient × baza` + `salary_type`/`min_salary`/`max_salary` karta-maydonidan; ko'p-karta → ulush-yig'indi.
4. **Login/ruxsat manbai = karta**: aktiv `employee_cards` yo'q → login bloki; ruxsat `org_departments.rbac_tier`/`position_permissions`dan.
5. **Yagona daraxt**: 1 Egasi-ildiz → CEO → 7 otdeleniye (Vysotskiy-7); dublikat ildizlar birlashtiriladi.

---

## 2. CROSS-CUTTING QOIDALAR (HAR FAZADA majburiy)

- **Kod uslubi**: Result<T>, Zod, Drizzle (raw SQL faqat murakkab+izoh). Fayl ≤900 qator, funksiya ≤150.
- **Regress-himoya (Q-39/Q-46)**: ishlayotgan+to'g'ri kod O'CHMAYDI; buzuq/o'lik/dublikat TO'LIQ o'chiriladi (chala emas). O'chirishdan oldin: ishlamasligini Q-29 verify + import-yo'qligini tekshir.
- **Fabrikatsiya TAQIQ (Q-40)**: data/AI yo'q → STRUKTURA+GATE qur, egasi-data ro'yxatiga yoz; SOXTA qiymat yozma.
- **Verify (Q-29/Q-32)**: har faza oxiri — `tsc` GREEN (o'z fayllarda 0 xato) + END-TO-END rollback-tx DB-proof (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi) + jonli isbot. Struktura-only YETARLI EMAS.
- **Dizayn (Q3, Qoida 21/41/42/43)**: EP token (`var(--ep-*)`) + shablon (ListPage/DetailPage/FormPage) + komponent (`components/ep`,`components/ui`); xom rang/inline-style TAQIQ; tab ≤2 daraja; har forma REAL saqlaydi (FE mutation→BE→DB→qayta-yuklashda ko'rinadi).
- **Migration**: `migrations-drift.ts` idempotent ALTER/CREATE IF NOT EXISTS; `CREATE TABLE`/`DROP` faqat `APPROVED:` izoh bilan (Q-35).
- **Commit**: faqat o'z fayllar (`git add <fayl>`, HECH QACHON `-A`), `--no-verify`, Co-Authored-By; har bosqich.
- **KARTA atamasi**: muloqotda doim "karta" (node emas).

---

## 3. FAZALAR (bog'liqlik tartibida — ketma-ket)

> Har faza: **MAQSAD · KO'LAM · ASOSIY FAYLLAR · DB · QABUL-MEZONI · DIZAYN/FE · OWNER-DATA · BOG'LIQLIK**. To'liq ≥1000-qator direktiva: `PHASE-NN-*.md`.

### FAZA 0 — Kanonik karta-jadval + yagona DDL (POYDEVOR, hamma narsani ochadi)
- **Maqsad**: ikki-olamni tugatish; `org_departments` yagona karta; `org_functions`+`departments` retire.
- **Ko'lam**: `card.repository.ts` 20+ so'rovni `org_departments`ga ko'chir (yoki CardController'ni org_departments'ga qayta-bog'la); `employee_cards.card_id` FK → `org_departments`; `card_folders.card_id` FK → `org_departments`; payroll/RBAC/LMS `org_functions` ref'larini `org_departments`ga; `org-queries.repo.ts:46` vacant-count cross-ref'ni uz; `org_functions` → bo'sh+DROP/VIEW; `departments`(18) → VIEW/DROP.
- **DB**: FK qayta-qaratish migration (APPROVED); test-bindinglar 0 ga; `org_functions` retire.
- **Qabul**: bitta karta-jadval; FE+payroll+RBAC+LMS+papka hammasi `org_departments`ga uradi; jonli: 0 ta `org_functions` reads kodda; DB-proof FK→org_departments.
- **Mavzular**: ikki-olam(38%), boshqa(base jadval), karta-model(qisman).
- **Owner-data**: yo'q (struktura).

### FAZA 1 — Xodim↔karta KO'P-KARTA + lifecycle
- **Maqsad**: 1 xodim → ko'p karta (asosiy+qo'shimcha), oylik=ulush-yig'indi; karta-tomon doim 1 karta=1 xodim.
- **Ko'lam**: `employee_cards` (M:N, Faza 0'dan org_departments FK) + `stake_fraction` (ulush, sum ≤1.0 guard, owner-override); `assignUser`dan 1:1 "delete-previous" OLIB TASHLA (xodim ko'p karta tutadi); karta-tomon 1-seat guard QOLADI; freeze/restore lifecycle; recruitment→vakant-karta→bind oqimi; node-detail "Xodimlar" tab ko'p-karta+ulush ko'rsatadi.
- **DB**: `employee_cards` stake_fraction + active-link unique (card_id WHERE is_active AND NOT is_acting); `employee_org_departments` konvergatsiya.
- **Qabul**: xodim 2 kartaga ulanadi; karta band bo'lsa 2-xodim rad; ulush-yig'indi >1.0 rad (owner-override bilan ruxsat); DB-proof.
- **Mavzular**: xodim-karta(38%).
- **Owner-data**: kim qaysi karta(lar)da (head_user_id/binding) — productionda HR to'ldiradi.

### FAZA 2 — Login/RBAC kartadan
- **Maqsad**: `card_id` NULL → login+oylik YO'Q; ruxsat kartadan (EP-ORG-003/023).
- **Ko'lam**: aktiv `employee_cards` yo'q xodim → `login.service` 401 "lavozimga biriktirilmagansiz"; payroll aktiv-kartasiz xodimni skip; RBAC `org_departments.rbac_tier`/`position_permissions`dan; JWT karta/tier tashiydi; karta o'zgarsa ruxsat re-resolve.
- **DB**: card-gate o'qish (yangi ustun shart emas — employee_cards orqali).
- **Qabul**: kartasiz user login 401; kartali user kartaning ruxsatini oladi; karta o'zgarsa ruxsat o'zgaradi; DB-proof + auth-test.
- **Mavzular**: login-rbac(28%).
- **Owner-data**: rbac_tier qiymatlari (144 NULL) — egasi РД darajasini beradi.

### FAZA 3 — Razryad o'sish/pasayish EXECUTION
- **Maqsad**: razryad → talab → o'sish → oylik zanjirini ishga tushirish (EP-ORG-010..013/091).
- **Ko'lam**: `razryad_history` jadval (eski/yangi razryad, sabab, kim, qachon, sertifikat); o'sish endpoint: imtihon-natija → **HR + bevosita rahbar 2-imzo tasdiq** → `org_departments.razryad_level_id` UPDATE + history + ichki-sertifikat; ≥3 oy oraliq guard (`min_months` + history'dan oxirgi o'zgarish); pasayish (HR+rahbar+sabab); AI faqat TAKLIF (Faza 10). RazryadTab'ga "O'sish so'rovi" + tarix.
- **DB**: `razryad_history` CREATE (APPROVED); 3-oy guard.
- **Qabul**: imtihon o'tdi+3oy+2-imzo → razryad oshadi+tarix+sertifikat; 3oy ichida rad; tasdiqsiz o'zgarmaydi; DB-proof.
- **Mavzular**: razryad(38%).
- **Owner-data**: razryad qiymatlari (threshold/min_months) — Faza-razryad-config'dan; imtihon-natija data.

### FAZA 4 — Oylik kartadan (payroll integratsiya)
- **Maqsad**: "oylik kartadan keladi" — payroll karta-maydonlaridan hisoblaydi.
- **Ko'lam**: `calculate-payroll.handler` → `org_departments.razryad_level_id → razryad_levels.coefficient` × baza + `salary_type`(oylik/soat/ishbay) + `min/max_salary`; ko'p-karta → ulush-yig'indi; ЦКП-gate + darslik-gate (Faza 5/7) ulanish-nuqtalari; i.o.-ustama; pro-rata (kun); ishbay-cap.
- **Qabul**: kartali xodim oyligi razryad-koeff×baza×ulush; gate buzilsa kamayadi; DB-proof.
- **Mavzular**: oylik-bonus(38%).
- **Owner-data**: baza-oylik, oylik-band qiymatlari.

### FAZA 5 — ЦКП/GSD tizimi
- **Maqsad**: ЦКП kunlik o'lchov → oylik-gate (eng past mavzu, 12%).
- **Ko'lam**: `ckp_fact_values` jadval (kunlik fakt); AI-chatbot kunlik savol (mashinasiz, AI-gated Faza 10); IoT/MES → karta avto-feed (mashinachi); kaskad-agregat (karta→bo'lim→otdeleniye); multi-product slot; formula-turi; xato-katalog; deadline (16/3h — egasi) → kun-oyligi gate.
- **Qabul**: kunlik ЦКП kiritiladi/keladi → agregat → deadline o'tmasa kun-oyligi yoziladi; DB-proof.
- **Mavzular**: ckp(12%).
- **Owner-data**: ЦКП norma/maqsad, deadline raqami (16 vs 3), formula.

### FAZA 6 — Papka (6 bo'lim)
- **Maqsad**: har kartada 6-bo'lim papka + to'liqlik% (EP-ORG-007).
- **Ko'lam**: `card_folders` (Faza 0'dan org_departments FK) 6-bo'lim (vazifa/javobgarlik/GSD/reglament/jarayon/ta'lim) + completeness%; shablon; 2-imzo; versiyalash; node-detail "Papka" tab to'liq.
- **Qabul**: 6-bo'lim to'ldiriladi → completeness% hisoblanadi; DB-proof.
- **Mavzular**: papka(22%).
- **Owner-data**: papka-kontent.

### FAZA 7 — Darslik/LMS kartaga
- **Maqsad**: darslik kartaga, tugamasa oylik yo'q (EP-ORG-027/028).
- **Ko'lam**: kurs↔karta bind (`courses.card_id`/junction); xodim kartaga kelsa avto-biriktirish; `LmsCompletionService` gate → oylik (Faza 4 ulanish); mentor; skill-matrix; cross-card-credit.
- **Qabul**: kartaga kurs bog'lanadi → xodim avto-oladi → tugamasa oylik-gate; DB-proof.
- **Mavzular**: darslik(20%).
- **Owner-data**: qaysi kurs qaysi kartaga.

### FAZA 8 — Daraxt yagonaligi + manager-zanjir
- **Maqsad**: yagona daraxt (Vysotskiy-7) + vertikal/gorizontal boshqaruv.
- **Ko'lam**: 14 ildiz → 1 Egasi; dublikat otdeleniye birlashtirish; `otdeleniye_no` (1-7) majburiy; `manager_id` backfill (DATA-gated, owner head_user_id); `workflow_rules` gorizontal-marshrut config UI; eskalatsiya-zinasi; no-skip.
- **Qabul**: 1 ildiz; 7 otdeleniye; manager-zanjir to'g'ri (head bo'lsa); DB-proof.
- **Mavzular**: tree(38%), manager(42%).
- **Owner-data**: head_user_id (kim-kimni-boshqaradi), 7-otdeleniye ro'yxati, workflow_rules.

### FAZA 9 — Karta lifecycle + audit + admin
- **Maqsad**: 5-holat + audit + import + shablon (karta-model qolgan qismi).
- **Ko'lam**: 5-holat state-machine (active/vacant/io/frozen/archived) + freeze(sabab+muddat)/restore; field-level audit diff (eski/yangi/kim/sabab) + majburiy-sabab (pul/razryad); Excel ommaviy-import (shablon+partial-commit+xato-satr+idempotent UPSERT); merge/split (yoki RAD-tasdiq); vakansiya aging(0-14/15-45/45+)+prioritet+SLA; `card_templates` shablon; 01/02 dublikat-raqamlash.
- **Qabul**: holat o'tishlari gate bilan; audit before/after; import partial; DB-proof.
- **Mavzular**: karta-model(42%), boshqa(18%).
- **Owner-data**: yo'q (struktura); import-fayl egasidan.

### FAZA 10 — AI per-karta (AI-kalit-gated)
- **Maqsad**: har karta AI — karta↔xodim moslik baholash (EP-ORG-030).
- **Ko'lam**: manba-avto-yig'ish (ЦКП/MES/QC/davomat → AI); AI-grading (imtihon); portret-PDF (xodim+rahbar+HR); event-trigger/batch; kamera-cross-check; past-moslik OGOHLANTIRADI (bloklamaydi). `AiFitService` real (Anthropic kalit bor) — kengaytirish.
- **Qabul**: AI-kalit bilan moslik-baho+PDF; kalitsiz graceful (fallback, fabrikatsiya yo'q); DB-proof struktura.
- **Mavzular**: ai(38%).
- **Owner-data**: OpenAI/Gemini kalit; AI-prompt sozlamalari.

### FAZA 11 — Dizayn/FE izchillik (cross-cutting + yakuniy pass)
- **Maqsad**: barcha org-schema sahifalari EP design-system bilan izchil (Q3).
- **Ko'lam**: OrgStructureHierarchy/OrgNodeDetail + barcha tab-komponent + dialoglar → EP token/shablon/komponent; xom rang/inline-style → token; tab ≤2 daraja; har forma F1/F2 (loading/onError); EPPageHeader/EPCard/EPStatusPill; responsive; REGRESS-himoya (ishlayotgan element saqlanadi).
- **Qabul**: `check-design-tokens.mjs` PASS; tsc; vizual izchillik; hech qaysi ishlayotgan element yo'qolmagan.
- **Mavzular**: dizayn (cross).
- **Owner-data**: yo'q.

---

## 4. OWNER-DATA REESTRI (fabrikatsiya TAQIQ — egasi to'ldiradi)
| Data | Hozir | Faza |
|------|-------|------|
| head_user_id (kim-kimni-boshqaradi) | 18/144 | 1,8 |
| razryad_level_id biriktiruvi | 0/144 | 3 |
| razryad qiymatlari (threshold/oylik-band/min_months) | NULL | 3 |
| oylik baza + band | NULL | 4 |
| ЦКП norma/maqsad + deadline(16vs3) | 25/144 | 5 |
| rbac_tier (РД) | 0/144 | 2 |
| kurs↔karta | 0/5 | 7 |
| 7-otdeleniye ro'yxati + workflow_rules | — | 8 |
| AI-kalit (OpenAI/Gemini) | bo'sh | 10 |
| camera_zone/telegram_group | 0/144 | (modul) |

---

## 5. DIREKTIVALAR (agentlarga topshirish)
Har faza uchun alohida ≥1000-qator direktiva (Q-47): `PHASE-00-*.md` ... `PHASE-11-*.md`. Tartib KETMA-KET (bog'liqlik). Har direktiva: kontekst + qoidalar-bloki + aniq fayl:satr + oldin/keyin kod + spec + qabul-mezoni + edge-holat + self-verify + DB-proof qadamlari.
