# EuroPrint ERP — Sifat Standartlari va "TAYYOR" ta'rifi (Definition of Done)

> Egasi 2026-06-08. **Har modul qurishda MAJBURIY** — har build promtiga shu rails qo'shiladi.
> Maqsad: haqiqiy, KUCHLI, OSON, ADOLATLI, AVTOMATLASHGAN, NAZORATLI ERP.

## 1. Ish metodi
- ⭐ **Backend + Frontend PARALLEL (barobar)** — har modul BE va FE birga olib boriladi (biri yarim qolmaydi).
- Har **qatlam** (DB → repo → service → controller → API → FE → i18n → test → doc) **massiv, aniq, to'g'ri, batafsil**.

## 2. Mahsulot falsafasi (30/70)
- ⭐ **~30% = data-kiritish sahifasi**, **~70% = saqlash + TAHLIL + AI**. Tizim shunchaki forma emas — **aqlli, nazoratchi, tahlilchi**.
- **Kuchli** + **OSON** (foydalanish oddiy) + **ADOLATLI** (oylik / baho / jarima / razryad — hammasi adolatli, dalil bilan).

## 3. Dizayn — QAROR QABUL QILINDI ✅
- **Kanonik dizayn = "EuroPrint Design System (1)" ("EP Linear Soft")** — egasi yoqtirdi.
  Manba: `C:/Users/AzzA/Downloads/EuroPrint Design System (1)` (tokenlar + komponentlar + shablonlar + screenshotlar).
  Asoslar: primary `#FF902F` (issiq orange), fon `#FAFAF9` (issiq oq), **Inter** font, modul-ranglar (SD ko'k / PP yashil / HR binafsha / WMS amber / FI cyan), yumshoq soyalar, karta radius 10px, 4px spacing, emoji yo'q, Lucide ikonka.
- ⚠️ **2 ta MAJBURIY TUZATISH** (egasi: "rang uyg'unligi + dark juda rasvo"):
  1. **Rang uyg'unligi:** status soft-tintlar o'z solid rangiga MOS EMAS — `--ep-blue`=#3563AC(ko'k) ↔ `--ep-blue-soft`=rgba(40,201,232)(cyan); green/yellow/red/purple ham xil oiladan. → soft-tintlarni solid ranglardan qayta hisoblash (bitta uyg'un oila).
  2. **Dark mode:** hozir faqat bg/surface/border/text/muted override; status+modul ranglar+soft-tintlar dark uchun sozlanmagan → orange+modul ranglar qora fonda qattiq. → dark uchun to'liq palitra (status/modul ranglar dark-tuned, kontrast yumshoq, orange biroz pasaytirilgan).
- Har FE sahifa = shu tokenlar + mavjud shablon (ListPage/FormPage/DetailPage/DashboardPage/BoardPage) + props — **yangi dizayn EMAS** (Qoida 21/41).

## 4. Har modul uchun "TAYYOR" (Definition of Done) — 7 shart
Modul faqat shu 7 shart bajarilsa "tayyor":
1. **Backend real:** real CRUD + Result pattern + Zod + DB ga real saqlash (echo/stub emas, Q-40/Q-43).
2. **Frontend real:** shablon+token dizayn, loading/error holati, real mutation (saqlaydi, qayta ochilganda ko'rinadi).
3. **Hujjatlar (docs):** modul hujjati to'g'ri va to'liq.
4. **Testlar:** BE unit + FE + E2E — to'g'ri, o'tadi.
5. **Tarjimalar:** UZ + RU teng, to'g'ri (kalit kodi ko'rinmaydi).
6. **Hamma ehtimoliy senariy (edge-case):** har holatga to'g'ri javob (xato/bo'sh/ruxsatsiz/chegaraviy).
7. **Avtomatlashtirish:** vazifa avto bajariladi (AI / cron / event) — qo'lda emas, imkon qadar.

## 5. Xavfsizlik + Data (KRITIK — buzilmas)
- 🔐 **RBAC = ENG KUCHLI:** ruxsat kartadan (KARTALAR Q23), maydon darajasida (oylik faqat haqdorga, Q42), 5 global guard.
- 🔐 **Hamma data SHIFRLANGAN:** at-rest (DB) + in-transit (TLS); maxfiy maydonlar (oylik, sog'liq, AI-baho) qo'shimcha himoya.
- 💾 **Data ZAXIRA (backup):** real-time replication (2 server doimo sinxron — BARCHA_JAVOBLAR Q160); 7 yil retention (Q7).
- 🔄 **Data SINXRON:** modullararo bitta haqiqat (bitta DDL, KARTALAR Q40); FK/event bilan izchil.
- 📋 **Audit log:** har klik/o'zgarish — kim / qachon / nima / IP (Q6, Q107 versiya tarixi).

## 6. Manba (har modul shu asosda quriladi)
- `docs/audit/shvb-extracted/` — BARCHA_JAVOBLAR (460+ owner qarori) + ShVB to'liq arxiv (1.31M) + 40-yo'nalish.
- `docs/audit/kitob-extracted/` — РД-5 lavozim-yo'riqnoma + org-siyosat + Excel forma.
- `docs/audit/KARTALAR-JAVOBLAR-IMPACT-2026-06-08.md` — karta-model poydevori + cross-modul.
- Owner javoblari = TAYYOR qaror (qayta so'ralmaydi); bo'shliqlarga avtomatlashtirish savollari.

---
*Bu standartlar har build promtining boshiga "qoidalar bloki" sifatida qo'shiladi (Q-37). Buzilsa — modul "tayyor" emas.*
