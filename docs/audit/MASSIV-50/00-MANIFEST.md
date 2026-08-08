# MASSIV-50 — vizyon-build topshiriqlari (KOORDINATSIYA / MANIFEST)

> **Sana:** 2026-06-19 · **Maslahatchi (Claude) artefakti.** Orkestratsiya (73 agent) + fix-pass (8 agent) + adversarial qayta-tekshiruv natijasi.
> **Maqsad:** butun ERP'ni vizyon bo'yicha qurish — **52 ta fayl-izolyatsiyali paket** (P01–P52), har biri bitta agentga beriladi.
> **Ish modeli:** har paket = bitta `P##-KEY-slug.md` direktiva fayli (shu papkada). Bu fayl = ularning **koordinatsiya qatlami**.
>
> ✅ **HOLAT: READY_WITH_FIXES + intervyuga moslashtirildi.** 53 direktiva yozildi; 4 launch-bloker (B1-B4) HAL QILINDI; intervyu-moslik 10/10 top-mismatch HAL QILINDI; egasiz ildizlar qoplandi (P51 manager_id, P52 GL#76, **P53 gofra/sloy**). Qolgani — **faqat egasi qiymatlari/qarorlari** → `00-EGASI-QIYMATLARI.md`.
>
> 📎 **Hamroh hujjatlar:** `00-VIZYON-QOPLAMA.md` (vizyon→paket) · `00-INTERVYU-MOSLIK.md` (intervyu audit, post-fix) · `00-EGASI-QIYMATLARI.md` (sizdan kutilayotgan 15 qiymat/qaror).

---

## §1 — BU NIMA / BU NIMA EMAS

- **Bu:** 52 paketning xaritasi — to'lqin tartibi, fayl-egaligi (izolyatsiya), bog'liqliklar, hal qilingan bloklovchilar, egasi qarorlari.
- **Bu emas:** har paketning to'liq topshirig'i — u alohida `P##-*.md` faylda (§0 qoidalar + §1 izolyatsiya + §2 vizyon + §3 holat + §4 ish + §5 DDL + §6 DoD + §7 self-verify + §8 commit).
- **Rollar:** Maslahatchi (Claude) = reja + tekshiruv + direktiva (kod yo'q). Bajaruvchi (agent) = kod + commit. Egasi = qaror + har to'lqinни ko'z bilan tasdiqlash.
- **Vizyon-qoplama tahlili:** `00-VIZYON-QOPLAMA.md` (har vizyon elementi → qaysi paket → holat).

---

## §2 — UMUMIY HOLAT

| Ko'rsatkich | Qiymat |
|---|---|
| Jami paket | **53** (P01–P53) |
| Direktiva fayllari | **53/53** yozildi |
| Intervyu-moslik | **ASOSAN_MOS** → 10/10 top-mismatch hal; qolgani egasi-qiymatlari |
| Egalik qilingan fayllar | ~575 (har biri bitta paketda) |
| Qoplangan modul | 21/21 (§4) |
| DDL-darvozali paket | ~30 (hammasi W1–W2, egasi `-- APPROVED:` stampini kutadi) |
| Aniqlangan launch-bloker | **4 (B1–B4) → HAL QILINDI** (§6.A) |
| Qayta-tekshiruv verdikti | **READY_WITH_FIXES** → qolgani egasi qarorlari (§7) |

---

## §3 — TO'LQIN JADVALI (parallel ishga tushirish tartibi)

Har to'lqin ichidagi paketlar **bir vaqtda** ishlay oladi (fayllar disjoint + bog'liqlik bajarilgan). To'lqinlar ketma-ket.

| To'lqin | Maqsad | Paketlar | Soni |
|---|---|---|---|
| **W1** | Poydevor: integratsiya-barrellar (P01-P03) + barcha modul schema/DDL + manager_id | P01,P02,P03,P04,P06,P09,P12,P15,P16,P18,P20,P22,P27,P28,P29,P31,P33,P35,P37,P39,P41,P42,P44,P46,P48,**P51** | 26 |
| **W2** | Backend logika + DDL-ga bog'liq wiring + GL#76 + gofra-formula | P05,P07,P10,P13,P17,P19,P21,P24,P25,P40,**P52**,**P53** | 12 |
| **W3** | Eventlar, cronlar, modul-lokal FE | P08,P26,P30,P32,P34,P36,P38,P43,P45,P47,P49 | 11 |
| **W4** | Sof FE + navigatsiya (P50 oxirgi) + PP plan-fakt logika | P11,P23,**P14**,P50 | 4 |

> P14 endi W4'ga joylashtirildi (P12'dan keyin — pp-production.ts to'qnashuvi hal qilingach). P50 har doim oxirgi (navigatsiya + sidebar regress).

---

## §4 — MODUL → PAKET QOPLAMASI

| Modul | Paketlar |
|---|---|
| ORG / KARTALAR | P04 (schema/DDL), P05 (portret BE+FE), **P51 (manager_id backfill)** |
| GOLDEN (oltin ip + integratsiya) | P01, P02, P03, P06, P07, P08, P50 |
| SD / Sotuv | P09, P10, P11 |
| PP / Rejalashtirish | P12, P13, P14, **P53 (gofra/sloy 3-formula)** |
| MES (+IoT tablet) | P15, P16, P17 |
| QC / Sifat | P18, P19 |
| WMS / Ombor | P20, P21 |
| MM / Ta'minot | P22, P23 |
| FIN / Moliya + Kassir | P24, P25, P26, **P52 (GL#76 cost-center)** |
| HR / Xodimlar | P27, P28 |
| DIR / Direktor | P29, P30 |
| COR / Koordinatsiya | P31, P32 |
| LMS / Ta'lim | P33, P34 |
| AI / Markaziy-AI | P35, P36 |
| CC / Aloqa markazi | P37, P38 |
| CRM | P39, P40 |
| MKT / Marketing | P41 |
| KAN / Kanban+Vazifalar | P42, P43 |
| IOT / Sensor+Kamera | P44, P45 |
| NTF / Bildirishnoma+Telegram | P46, P47 |
| POS Monitor | P48, P49 |

---

## §5 — FAYL-IZOLYATSIYA MODELI (parallel supurish xavfiga qarshi — Qoida 23)

**Prinsip:** har fayl ANIQ bitta paketga tegishli. Hech qaysi 2 agent bir faylga **commit** qilmaydi.

**"Issiq" umumiy fayllar** — bittagina owner paketga biriktirilgan; boshqalar **e'lon qiladi** (dependsOn), o'zi tahrirlamaydi:
- `lib/db/src/schema/index.ts` → **P01** · `apps/api/src/shared/db/index.ts` + drift → **P02** · `op-codes.ts` → **P03**
- FE sidebar `constants.ts` + route-registry'lar + sidebar regress → **P50** (oxirgi)
- Modul `*.module.ts` → har biri bitta owner (wms→P21, mes→P07, iot→P45, pos→P49, ai→P35, lms→P33, director→P25, finance→P25, **pp→P13** [P14/P53 provayderlarini P13 ro'yxatdan o'tkazadi])
- Kross-modul schema: `pp/pp-iot.ts`→P16, `pp/pp-production.ts`→**P12 (yagona — P17 equipment ustunlarini P12'ga e'lon qiladi)**, `pp/pp-enhanced.ts`→P12, `schema-misc-qc.ts`→P18
- Har direktivaning §1 (Izolyatsiya manifesti): "FAQAT shu fayllarga teg; boshqasi kerak bo'lsa TO'XTA + flag."

---

## §6 — BLOKERLAR HOLATI

### ✅ A. Launch-bloklovchilar — HAL QILINDI
- **B1 — pp-production.ts dublikat jadval (P12/P14/P17):** P14 endi jadvallarni P12'dan import qiladi (yaratmaydi), W4'ga ko'chdi. P17 endi 4 equipment ustunini P12'ga **e'lon qiladi** (commit qilmaydi). pp-production.ts'ni **faqat P12** commit qiladi. ✅
- **B2 — P14 o'zini-APPROVED (Q-35):** olib tashlandi; P14 endi DDL yozmaydi/run qilmaydi (ddlGate=false). ✅
- **B3 — P08 yelim-bo'shlig'i:** wms.module DI → P21 egaligida, finance.module GlPostingService → P25 egaligida; P08 "flag" o'rniga aniq BOG'LIQLIK e'lon qiladi. ✅
- **B4 — P50 yo'l-imlosi:** 11 ta toza yo'l (yagona prefiks); dependsOn'lar mavjud paketlarga. ✅

### ✅ B. Tekshirilgan — muammo emas
- **P34 (2199 qator):** dublikat EMAS — haqiqiy 14 batafsil qadam (Q-47 ≥1000 qator). O'zgartirilmadi.

### ⚠️ C. Yumshoq eslatmalar (launch-bloker emas; finalizatsiya/executor vaqtida)
- **P50 placeholder sahifa nomlari:** AppendixC ba'zi misol-nomlarni ishlatadi (PPShiftPlanFact/LMSCorePage) — P14/P34 ning haqiqiy nomlariga to'liq mos emas. P50 shartli `ls`-tekshiruv bilan o'rab olgan (crash yo'q), lekin ba'zi sahifa sidebar/route'ga ulanmay qolishi mumkin → executor haqiqiy fayl nomini ishlatsin.
- **P14 `closedBy:1` (TODO useCurrentUser)** + brak→rework tasdiq endpoint'i hozircha emit+log; to'liq zanjir P50 `POST /shift-plans/:id/confirm-rework` qurgach yopiladi.

---

## §7 — ❗ EGASI QARORI KERAK (ishga tushishdan oldin)

1. **P51 — manager_id ma'lumoti (5-ildiz #3):** egasi/HR 124 ta NULL-rahbar org-node uchun `head_user_id` ni bersin (kim-kimga rahbar — bu inson bilimi, agent topa olmaydi) → keyin migrationga `-- APPROVED:` + DATA_READY stamp. Shundan keyin manager_id daraxt bo'yicha avto-derivatsiya qilinadi.
2. **P52 — GL#76 cost-center (3 savol):** (a) `entries.cost_center_id` FK → `org_departments.id` mi yoki `cost_centers.id` mi; (b) `sex_category` ustuni `entries`'da (A-yondashuv) yoki faqat hisobot-qatlamda (B); (c) migrationga `-- APPROVED:` stamp. ⚠️ `gl_journal_entries`/`gl_lines` (SAP#76) TEGILMAYDI.
3. **~30 DDL migration** (W1/W2): har biri psql'dan oldin egasi `-- APPROVED:` stampini kutadi (P12, P13, P17, P34, P52, ...).
4. **Q-C — workflow_rules** (gorizontal yo'l, vizyon §2.3): P32'da gated turibdi — egasi hozir quriladimi yoki defer qoladimi tasdiqlasin.

---

## §8 — ⭐ VIZYON QOPLAMASIDAGI BO'SHLIQ (halol — `00-VIZYON-QOPLAMA.md`)

- ✅ **gofra/sloy 3-formula (kg→m²→list)** — endi **P53** qopladi (konversiya servisi + master-data koeffitsiyentlar; qiymatlarni egasi beradi — `00-EGASI-QIYMATLARI.md` #6).
- **Oshxona** moduli — qoplanmagan.
- **§2.6 "MVPdan keyin"** (ataylab defer): CRM aktiv SMS/AI-qo'ng'iroq · web-sayt · lead-gen aktiv oqim · AI-kamera GPU · kassir-hub-katta. Passiv izlari mavjud (SMS=activity-type, kanal=dropdown, kamera=zona/checklist) — jim tushib qolmadi.

---

## §9 — QOIDALAR BLOKI (har direktivaning §0'ida — Q-47)

1. Result<T> hamma repo/service; throw/null/undefined TAQIQ. 2. @Body Zod. 3. Drizzle ORM; raw SQL faqat murakkab (typedExecute<T>).
4. Q-40 ishlaydi≠to'g'ri: REAL INSERT + DB-proof; echo/fake TAQIQ. 5. Q-46 ishlab-turgan kod o'chmaydi; buzuq kod to'liq o'chiriladi.
6. FAYL IZOLYATSIYASI (Qoida 23/Q-31): faqat OWNED ro'yxat; boshqasi kerak bo'lsa TO'XTA + flag.
7. DDL DARVOZASI (Q-35): `-- APPROVED:` siz ishlamaydi; faqat egasi stamp qiladi.
8. git add <aniq-fayl>; -A TAQIQ. 9. log/secret commit yo'q; JWT minting yo'q. 10. Self-verify: BE tsc 0, FE tsc 0, reviewerlar, jonli DB-proof.
11. "V2"/"Strangler Fig" TAQIQ — bitta kod. 12. TO'G'RI o'lchovi = master vizyon (XARITA-REJA-YONALISH + modul vizyon-hujjati).

---

## §10 — QANDAY ISHGA TUSHIRILADI (egasi-darvozali, to'lqin-ma-to'lqin)

1. **Avval §7 egasi-qarorlari** (manager_id data, GL#76 3-savol, workflow_rules) hal qilinadi.
2. **Har DDL migration egasi `-- APPROVED:` bilan stamp qilinadi** (W1-W2).
3. **W1 (26 paket parallel)** → tekshiruv → egasi ko'z bilan tasdiqlaydi → **W2 (11)** → **W3 (11)** → **W4 (4)**.
4. Har paket: BE tsc 0, FE tsc 0, jonli DB-proof, golden-thread regress yo'q. Har to'lqin oxirida `golden-thread-chain-proof.cjs` exit 0.

> Manba: master vizyon `docs/XARITA-REJA-YONALISH-2026-06-07.md` + 22 modul vizyon-hujjati (`docs/audit/MUSLIMBEK-PROMT-NN-*.md`) + jonli kod/DB audit + adversarial tekshiruv.
