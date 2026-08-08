# EuroPrint ERP — To'liq Vizyon Qurish Rejasi va Halol Vaqt Hisobi
**Sana:** 2026-06-19
**Manba:** 20 modul bo'yicha live-tekshirilgan baholash (bePct/fePct/effortDays/dependsOn/visibleOutcome)
**Maqsad:** To'liq vizyonni (BE+FE+data) bosqichma-bosqich qurish + halol vaqt jadvali

---

## 1. SARLAVHA VA HALOL UMUMIY VAQT

> **"1 hafta" — bu HAQIQAT EMAS.** To'liq vizyon (20 modul × BE+FE+data) — bu **HAFTALAR EMAS, OYLAR** ishi.

**Halol umumiy:** **50-65 hafta (~12-15 oy, 1 dasturchi-ekvivalenti)**

Hisob-kitob (halol):
- BE jami: **125 kun** | FE jami: **90.5 kun** | DATA/migration: **33.5 kun**
- **Xom yig'indi: 249 kun** = ~50 ish-haftasi (5 kunlik hafta)
- + **30% integratsiya/verifikatsiya/regress overhead** (modullararo ulanish, golden-thread tekshiruv, owner-gate kutish, DDL approval sikllari) = **~324 kun ≈ 65 hafta**

**Asosiy dars (Phase qoidasi):** Ko'rinmas backend ≠ taraqqiyot. Har bosqich **EKRANDA KO'RINADIGAN** natija bilan tugaydi. Owner har **1-2 haftada** yangi ishlaydigan sahifa/widget ko'radi; **to'liq vizyon esa yuqoridagi halol umumiy** ichida yakunlanadi.

**Tezlatish varianti:** 2-3 dasturchi parallel ishlasa, kalendar vaqti ~24-32 haftaga tushadi (lekin BE+data ko'p modul bir ildizga — ORG/FIN/MES — bog'langani uchun kritik yo'l qisqarmaydi).

---

## 2. BOSQICHLAR (DEPENDENCY TARTIBIDA)

### PHASE 0 — POYDEVOR (1-2 hafta)
**Modullar:** ORG (data), barcha modul uchun staged migration apply + seed + manager_id data
**Ish:** ~33 data-kun emas — bu bosqichda FAQAT poydevor-kritik data: ORG head_user_id (124/142 node — OWNER/HR ish), manager_id backfill (recursive CTE), BHMS 42-account seed (FIN), 7 warehouse type seed (WMS), reason-code/defect-code seedlar. Infra qurilgan — DATA GATE owner harakatini kutadi.
**KO'RINADIGAN MILESTONE:** Dashboardlar **haqiqiy raqamlar** ko'rsatadi (mock/hardcode yo'q). Org-chart to'liq Vysotskiy-7 daraxti manager-zanjiri bilan ko'rinadi. ⚠️ **BLOKER:** ORG head_user_id data to'ldirilmaguncha manager_id backfill ishlamaydi — bu owner/HR vazifasi, kod emas.

### PHASE 1 — ORG KARTA-MARKAZ + GOLDEN-THREAD UCHI-UCHIGA (3-4 hafta)
**Modullar:** ORG (BE+FE), SD (golden-thread fields), CRM (DealWon→sales_orders ko'prik)
**KO'RINADIGAN MILESTONE:** Owner Org Tuzilma'ni ochadi → 8-tab CardDetailDialog (Portret tab real), razryad badge, vakant slotlar. CRM'da deal "Won" qilinadi → avtomatik sales_orders qatori yaratiladi (CRM→SD zanjiri ekranida ko'rinadi).

### PHASE 2 — SAVDO→ISHLAB CHIQARISH ZANJIRI (5-7 hafta)
**Modullar:** SD (to'liq), PP (rejalashtirish), MES (sex floor)
**KO'RINADIGAN MILESTONE:** Buyurtma SD'da yaratiladi → PP Planning Board'da smena-Gantt'ga tushadi (operator+plan miqdor) → MES tablet'da operator 3-bosqich sessiya yuritadi → real OEE dashboard. Golden-thread SD→PP→MES ekranida uchma-uch ishlaydi.

### PHASE 3 — SIFAT + OMBOR + TA'MINOT (4-5 hafta)
**Modullar:** QC (sifat), WMS (ombor), MM (ta'minot)
**KO'RINADIGAN MILESTONE:** Goods receipt → KARANTIN → QC QABUL/REWORK → ombor MAIN. MES material chiqimi tech-kartaga mos kelmasa real-time 422 BLOCK. MM'da vendor 3-tab kartasi + lab-natija + composite reyting.

### PHASE 4 — PUL: MOLIYA + KASSIR + GL (3-4 hafta)
**Modullar:** FIN (GL+ZVS/ZNO FSM+Kassir)
**KO'RINADIGAN MILESTONE:** 4-hisob balans widget, davr-yopish GL'ni qulflaydi, ZVS/ZNO 6-holat tasdiq → avtomatik GL post, kassir smena PIN bilan ochiladi/yopiladi. Pul modullararo (POS/WMS/SD→GL) avtomatik post bo'ladi.

### PHASE 5 — ODAM + STRATEGIYA + KOORDINATSIYA (5-6 hafta)
**Modullar:** HR (7-factor rating+payroll chain), DIR (5-metrik company-state), COR (kengash+protokol+prikaz)
**KO'RINADIGAN MILESTONE:** HR rating A/B/C badge + 5-bosqich payroll approval board; Director company-state badge (OSISH/XAVF/...) kunlik 07:00 cron; COR 5-kengash + protokol sign-flow + prikaz registri.

### PHASE 6 — TA'LIM + AQL + ALOQA + KANBAN (8-10 hafta)
**Modullar:** LMS (karta-kurs), AI (CKP/Aisha/19 servis), CC (3-savat hujjat), KAN (4-ustun+desktop), CRM (qolgan funksiya), MKT (8-kanal)
**KO'RINADIGAN MILESTONE:** Xodim kartaga biriktirilsa avto-kurs; Aisha orb + provider config; CC 14-tur hujjat oqimi PIN-imzo; Kanban assigner-confirm + 3-savat desktop; Marketing 8-kanal + owner-5-raqam.

### PHASE 7 — IoT KAMERA + BILDIRISHNOMA + POS (4-5 hafta)
**Modullar:** IOT (kamera/Andon/27 mashina), NTF (Telegram+5 jadval), POS Monitor (tablet ombor)
**KO'RINADIGAN MILESTONE:** Andon jonli board, kamera inspeksiya, PPE alert (E1 human-gate); NTF qo'ng'iroq belgisi + Telegram digest + quiet-hours; POS tablet pres-kirim + 2-imzo PDF + storno.

---

## 3. PER-MODUL JADVAL (bePct/fePct/days/visible)

| Modul | BE% | FE% | Jami kun | Ko'rinadigan natija |
|---|---|---|---|---|
| ORG/KARTALAR | 72 | 65 | 8.5 | 8-tab karta + Vysotskiy-7 daraxt + razryad |
| SD | 52 | 62 | 12 | Buyurtma 4-tab + KPI leaderboard + funnel |
| PP | 28 | 30 | 22 | Smena-Gantt + 4-raqam close + Gofra hisoblagich |
| MES | 52 | 60 | 16 | 3-bosqich sessiya + 4-daraja OEE + tablet |
| QC | 52 | 48 | 11 | Defect katalog + AQL + reklamatsiya + causation |
| WMS | 52 | 55 | 10 | 7-tur ombor + KARANTIN + roll FIFO + blind-count |
| MM | 32 | 38 | 13 | Vendor 3-tab + lab-natija + composite reyting |
| FIN | 38 | 42 | 16 | 4-hisob + ZVS/ZNO FSM + kassir PIN + GL |
| HR | 52 | 38 | 15 | 7-factor rating + payroll board + dual-mentor |
| DIR | 58 | 52 | 12 | Company-state badge + diary + OKR daraxt |
| COR | 28 | 22 | 13.5 | 5-kengash + protokol sign + prikaz registri |
| LMS | 35 | 40 | 15 | Karta-kurs auto-enroll + nazorat varaqa + onboarding |
| AI | 42 | 35 | 18 | Aisha orb + CKP + fit-score + governance |
| CC | 72 | 58 | 6 | 3-savat 14-tur hujjat oqimi PIN-imzo |
| CRM | 58 | 62 | 8 | 5-stage funnel + 9-metrik GSD + 360-view |
| MKT | 42 | 62 | 7 | 8-kanal lead + profit-ROI + owner-5-raqam |
| KAN | 42 | 55 | 12 | 4-ustun assigner-confirm + desktop + production board |
| IOT | 45 | 52 | 15 | Andon board + kamera inspeksiya + 27 mashina |
| NTF | 22 | 28 | 10 | Qo'ng'iroq belgisi + Telegram digest + quiet-hours |
| POS Monitor | 62 | 72 | 9 | Pres-kirim + 2-imzo PDF + storno + KARANTIN |

---

## 4. KRITIK YO'L (Must-Do-First Zanjiri)

1. **Phase 0 poydevor** — staged migration apply + seed + **ORG head_user_id data (OWNER/HR bloker)** → manager_id backfill
2. **ORG karta-markaz** (org_functions canonical hub, 29 FK) — barcha modul kartaga bog'lanadi (CKP/fit/LMS/HR/COR)
3. **SD golden-thread fields** (sales_orders 14 ustun) — PP/MES/QC/WMS shu jadvalga FK
4. **PP rejalashtirish** (production_orders 9-status + tech card) — MES/WMS/QC shunga bog'liq
5. **MES sex floor** (3-bosqich sessiya + OEE) — QC/WMS/HR/IoT MesCompletedEvent kutadi
6. **FIN GL canonical entries** — POS/WMS/SD/HR/payroll shu yagona ledgerga post qiladi

**Eslatma:** ORG→SD→PP→MES→FIN — bu zanjir KETMA-KET (har biri keyingisining poydevori). Parallel dasturchi qo'shsa ham bu kritik yo'l qisqarmaydi — shuning uchun halol umumiy 50-65 hafta.

---

## 5. OWNER QAROR KUTAYOTGAN BLOKERLAR (data-gate)
- ORG: 124/142 node head_user_id (HR/owner)
- PP: Gofra flute take-up faktorlari (zavod o'lchovi)
- FIN: revenue 4-hisob %, ZNO BHMS GL kodlari, cost_center_id FK target (GL#76)
- HR: hr_bonus_pct_config bonus summalari per A/B/C
- MKT: 8-kanal label + 5-mezon scoring vaznlari
- AI: CKP weight koeffitsientlari (Q42)
- POS: makulatura Excel (SCRAP_IN), GSD formula parametrlari
- Barcha GATED DDL migration: owner "APPROVED:" stamp
