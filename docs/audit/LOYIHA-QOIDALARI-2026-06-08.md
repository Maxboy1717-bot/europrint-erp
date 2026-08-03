# EUROPRINT ERP — LOYIHA QOIDALARI (butun loyihaga tegishli) — 2026-06-08

> Bu — BUTUN loyihaga, HAR modulga, HAR build promtiga, HAR ijrochiga tegishli yagona qoidalar to'plami.
> Har build promtning boshiga "qoidalar bloki" sifatida qo'shiladi. Bu qoidalarga zid kod = XATO.
> Egasi: Maxboy (Ayubxon Pozilov). Manba: CLAUDE.md + 6 vizyon-hujjat + intervyu + chat-tarixi.
> ⭐ TO'G'RILIK o'lchovi = VIZYON (docs/audit/). Kod vizyonga zid ishlasa (ishlasa ham) = xato.

═══════════════════════════════════════════════════════════════
## A. ARXITEKTURA (butun tizim)
- **A1.** Stack: NestJS (BE) + React/Vite (FE) + Drizzle ORM + PostgreSQL · pnpm monorepo · bitta DB (alohida server yo'q).
- **A2.** Kirish = **SSO** (yagona ERP login/JWT) — har modul uchun alohida login YO'Q.
- **A3.** Qurilma = **responsive web** (kompyuter+planshet+telefon). **Alohida native app YO'Q** (bitta kod baza).
- **A4.** Til = **O'zbek + Rus** (foydalanuvchi tanlaydi); UI tarjima UZ/RU teng, kalit kodi ko'rinmaydi.
- **A5.** 30+ terminal bir vaqtda; **to'liq offline** ishlaydi (internet o'chsa ham).
- **A6.** Audit-log to'liq: har klik / o'zgarish / IP / vaqt; saqlash **7 yil** (soliq talabi).
- **A7.** Xato UX: kichik xato → **toast**; katta xato → **modal**.
- **A8.** Tech-stack: AI = **Gemini API + Gemini LIVE** (video-intervyu) · Telegram = **Telegraf.js** · Queue = **BullMQ + EventEmitter2 + outbox** · Video = **WebRTC** · Label = **ZPL/EPL/PDF** · per-camera **VLM**.

## B. KOD USLUBI (har yangi kod)
- **B1.** TypeScript strict · validatsiya = **Zod** (class-validator EMAS).
- **B2.** DB = **Drizzle ORM**; raw SQL faqat murakkab (LATERAL) holatda, izoh bilan; **`sql.raw(o'zgaruvchi)` TAQIQ** (faqat parametrli).
- **B3.** Xato boshqaruvi = **Result<T>** pattern (`throw`/`return null` EMAS).
- **B4.** Fayl ≤ **900** qator · funksiya ≤ **150** qator · konstantalar `business.constants.ts`dan (magic-number TAQIQ).
- **B5.** Controller = faqat transport qatlami (biznes-logika service'da) · service DB'ga to'g'ridan tegmaydi (repo orqali).
- **B6.** Parol/JWT-secret hardcode TAQIQ · `process.env` to'g'ridan emas (ConfigService) · har controller `@UseGuards`/`@Public`.

## C. VIZYON & TO'G'RILIK (eng muhim)
- **C1. ⭐ Vizyon = to'g'rilik o'lchovi:** kod xatosiz ishlashi (200) — mazmunan to'g'ri ekanini bildirmaydi. TO'G'RI = `docs/audit/` vizyoniga mos.
- **C2. Verify-don't-trust:** har audit/katalog/da'voni ESKIRGAN deb hisobla → kod + DB (`_audit/q.cjs` read-only) + jonli probe bilan tasdiqla. (Poydevorда kataloglar OVER-claimed chiqdi — isbot.)
- **C3. Fake YO'Q (ishlaydi≠to'g'ri):** har forma/endpoint REAL DB INSERT/UPDATE qiladi. `{ok:true}`/echo/`[] as unknown` TAQIQ. Jadval yo'q bo'lsa — halol **501** (yolg'on "saqlandi/to'landi" TAQIQ).
- **C4. Forma real saqlaydi:** kirit → saqla → qayta och → ko'rinadimi (round-trip isboti).
- **C5. Regress TAQIQ:** o'chirilgan qayta yaratilmaydi; avval ishlagan narsa o'zgarishdan keyin HAMON ishlaydi.
- **C6. QAYTA QURISH YO'Q:** tizim ~70% ishlaydi — faqat **tuzat va ula** (mavjudni). Butun qaytadan yozish TAQIQ.
- **C7. Noaniq → so'ra:** taxmin qilma; noaniqlikni egasidan so'ra.

## D. QURISH METODI & "TAYYOR" (DoD)
- **D1. BE+FE PARALLEL** — har modul backend va frontend birga (biri yarim qolmaydi). Har qatlam (DB→repo→service→controller→API→FE→i18n→test→doc) massiv va aniq.
- **D2. 30/70:** ~30% data-kiritish, ~70% saqlash+TAHLIL+AI. Tizim aqlli/nazoratchi, shunchaki forma emas.
- **D3. Re-audit-first:** har modul qurishdan oldin mavjud holat read-only xaritalanadi → egasiga → keyin qurish (tuzatishdan oldin tahlil).
- **D4. Bosqichma-bosqich ijro:** har faza/paketdan keyin hisobot → egasi ko'rib "davom" → keyingisi. Yaxlit, maydalamasdan.
- **D5. "TAYYOR" = 7 shart:** (1) BE real CRUD+Result+Zod+DB · (2) FE real (shablon+token, loading/error, saqlaydi) · (3) hujjat · (4) test (BE+FE+E2E) · (5) tarjima UZ/RU · (6) hamma edge-case · (7) avtomatlashtirish (AI/cron/event).
- **D6. Oson + Adolatli:** kuchli + foydalanish oson + adolatli (oylik/baho/jarima dalil bilan).

## E. ⭐ KESISHUVCHI PRINTSIPLAR (6 build-rails — hamma modul)
- **E1. AI kuzatadi → inson tasdiqlaydi:** AI belgilaydi (kamera/downtime/brak/past-moslik), lekin SALBIY ta'sir (jarima/ball/blok/razryad-tushish) FAQAT inson tasdig'i bilan — avtomatik EMAS. Adolatli.
- **E2. Karta-markaz:** har lavozim = KARTA (atomik, 1 o'rindiq); oylik/ruxsat/GSD/darslik kartadan; karta birlamchi, xodim ikkilamchi; data kartalardan profilga yig'iladi.
- **E3. AI rejalashtiradi:** buyurtma reja/navbat/marshrut/ustuvorlik/material — AI avtomatik (7-qadam: buyurtma→material→bron→marshrut→vaqt→reja→ijro); menejer faqat tasdiq.
- **E4. Operator IoT-tablet:** floor markazi — brak/TB-chek-list/downtime/priladka/material-skan hammasi operator tabletida.
- **E5. Org-sxema marshruti:** kengash/hujjat/bildirishnoma/tasdiq hammasi org-chart (vertikal+gorizontal) bo'yicha; tasdiq oxiri direktorga. Org o'zgarsa → rollar+ombor avto.
- **E6. Bitta haqiqat:** A-System/Bitrix to'liq almashtiriladi (eski arxivga); kanonik jadval bitta (2-dunyo TAQIQ).

## F. XAVFSIZLIK & DATA (KRITIK — buzilmas)
- **F1. RBAC eng kuchli:** ruxsat **kartadan** (lavozimga qarab), **maydon darajasida** (oylik faqat haqdorga); 5 global guard. Avval BE rol-scope (haqiqiy himoya), keyin FE filter.
- **F2. Shifrlash:** hamma data at-rest (DB) + in-transit (TLS); maxfiy maydon (oylik/sog'liq/AI-baho) qo'shimcha himoya.
- **F3. Zaxira:** real-time replikatsiya (**2 server doim sinxron**); 7 yil retention.
- **F4. Sinxron:** modullararo bitta haqiqat (bitta DDL, FK/event bilan izchil).
- **F5. Immutable hujjat:** tasdiqlangan hujjat o'zgarmas; PIN = elektron imzo; rad → majburiy sabab; to'liq versiya tarixi.
- **F6. Secret:** subagentga secret berilmaydi; JWT mint TAQIQ; log fayllar HECH QACHON commit qilinmaydi.

## G. DIZAYN
- **G1.** Kanonik = **EP Linear Soft** (primary `#FF902F`, fon `#FAFAF9`, Inter font, modul-ranglar, radius 10px, Lucide ikonka, emoji yo'q).
- **G2.** Faqat **token** (`var(--ep-*)`/`var(--mod-*)`) — inline xom rang TAQIQ. Yangi sahifa = mavjud shablon (ListPage/FormPage/DetailPage/DashboardPage/BoardPage) + props — **yangi dizayn EMAS**.
- **G3.** Tugma joylashuvi STANDART (har sahifada bir xil); tab ichida tab MAKS 2 daraja.
- **G4.** 2 tuzatish: status soft-tint rang uyg'unligi + dark mode to'liq palitra.

## H. MA'LUMOT (kanonik — bitta haqiqat)
- **H1.** Buyurtma = **`sales_orders`** (`sd_sales_orders`=VIEW; `orders` o'chirilgan).
- **H2.** Stok = **`warehouse_stock`** (`current_stock`=VIEW); `stocks`=partiya/muddat (saqlanadi).
- **H3.** GL = **`entries`/`gl_entries`**; `gl_journal_entries`+`gl_lines` = SAP #76 (hozir tegma).
- **H4.** Yangi jadval oldidan "2-dunyo tekshiruvi": shu tushuncha uchun boshqa nomli jadval bormi? Bo'lsa MAVJUDNI ishlat. Yangi jadval = **egasi ruxsati** (Q-35, `APPROVED:` izoh).
- **H5.** Eski Excel ERP'ga import QILINMAYDI — ERP'da qaytadan kiritiladi; tarixiy ma'lumot faqat AI o'rganishi uchun bir martalik.

## I. JARAYON & ROLLAR
- **I1. Advisor (Claude) = vizyon/read-only** — kod yo'q, faqat promt/hujjat/tahlil/nazorat.
- **I2. Bajaruvchi (Muslimbek) = ijro** — kod+commit; bir vaqtda FAQAT BITTA; subagent faqat read-only tahlil.
- **I3. Ruxsat darvozasi:** o'zgarishdan OLDIN `fayl:satr` + aynan o'zgarish + sabab → egasi "ha". Tavsiya ≠ ruxsat.
- **I4. Ijrochi promtlari = INGLIZ + batafsil** (qoidalar bloki bilan); egasiga hisobotlar = **O'zbek (lotin)**.
- **I5. Bitta haqiqat manbai = `docs/`** (Q-25); muhim qaror darrov yoziladi (qaror jurnali). Hujjat ziddiyatida vizyon ustun.
- **I6. `git add <aniq-fayl>`** (add -A TAQIQ) · commit har bosqich · `git stash` yo'q.
- **I7. Windows `nest watch` 000 = muhit (Q-44)** — kod xatosi emas; qayta ishga tushir + static fallback.

## J. RAQAMLASH (kuzatuv)
- **J1.** Har operatsiya = **`EP-<MODUL>-<###>`** kodi; kod logga tushadi (`level=info code=EP-ORG-014 ...`).
- **J2.** Registry: `docs/op-codes/REGISTRY.md` + `apps/api/src/common/op-codes.ts`. Raqamга qarab → modul+operatsiya+harakat turi.
- **J3.** Modul kodlari: ORG·HR·FIN·COR·DIR·SD·PP·MES·QC·WMS·MM·LMS·CRM·MKT·KAN·IOT·AI·NTF·POS·CC.
- **J4.** Modul og'irligi teng emas: **T1** (ORG poydevor + SD/PP/MES/QC/WMS/FIN oltin-ip) eng chuqur · **T2** (DIR/COR/HR/LMS/CC/AI) · **T3** (CRM/MKT/KAN/IOT/NTF/POS).

═══════════════════════════════════════════════════════════════
## MANBA HUJJATLAR (vizyon — to'liq tafsilot)
`docs/audit/`: MASTER-SAVOL-JAVOB · OCHIQ-JAVOBLAR · OMBOR-KASSIR-INTERVYU · CHAT-TARIXI-YANGI · IOT-MES-CURRENT-STATE · LOYIHA-BITGAN-XOLAT · ERP-SIFAT-STANDARTLARI · ZIDDIYATLAR-HAL · decisions/01-20.
Texnik kod-qoidalar (A/B/1-23, Q-24..Q-45) to'liq: `CLAUDE.md` + `docs/agent-constitution.md`.

> Bu qoidalar buzilsa — modul "tayyor" emas. Har build promti shu blokка tayanadi.
