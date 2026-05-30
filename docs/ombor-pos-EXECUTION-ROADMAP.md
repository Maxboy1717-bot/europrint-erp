# OMBOR + POS MONITOR — IJRO YO'L XARITASI (Master Task)

> Manba qoidalar: `docs/ombor-pos-master-plan.md` (§0–§17).
> Bu fayl = IJRO tartibi. Avval TOZALASH, keyin qurish. Har faza additive + commit + tsc 0 + jonli test.
> Sana: 2026-05-30. Verify-don't-trust: har da'vo kod + jonli DB bilan tasdiqlanadi.

---

## ANIQLANGAN ASOSIY MUAMMOLAR (jonli tekshirildi)

1. **POS Monitor alohida login** (`pos_session` token, `POST /pos/auth/login` + PosAuthService) — §1.2 BUZILISHI.
   ERP'ga kirgan user POS Monitorга QAYTA kirishi kerak. `AuthGuard` `pos_session` talab qiladi.
   → Bu sabab "hech narsa ishlamaydi" — POS Monitor amalda yopiq.
2. **Token ziddiyati:** eski POS sahifalar `pos-monitor-core.api.ts` (`pos_session` token) ishlatadi;
   yangi `PosMonitorPage` `apiRequest` (ERP `access_token`) ishlatadi. Ikki xil auth.
3. **ERP'da rasvo WMS sahifalar:** WarehouseHub12, WMSExtended, WmsAnalytics, SupplyChainDashboard,
   MMExtended, WarehouseDirectory, WarehouseReports, WarehouseIntegrations — stub/dublikat/almashtirilg​an.
4. **Eski POS sahifalar** (pos-monitor/pages/): 27 sahifa; ko'pi rasvo yoki yangi PosMonitorPage bilan qoplangan.
   Noyob: Material 360, Lot Traceability, Movement Kirim/Chiqim wizard, Inventory, Reports, Admin.

---

## FAZA A — TOZALASH + KIRISH TUZATISH (P0 — "ishlamaydi" ni hal qiladi)

**A1. POS Monitor → ERP SSO.** Alohida login YO'Q (§1.2).
- `AuthGuard` `pos_session` o'rniga ERP autentifikatsiyani tekshiradi (ERP'ga kirgan = POS ochiq).
- `/pos-monitor/login` route + redirect o'chiriladi.
- `pos-monitor-core.api.ts` / `pos-monitor.api.ts` — `pos_session` token o'rniga ERP `apiRequest` ishlatadi
  (yoki shu fayllardagi fetch ERP `access_token` yuboradi).
- BE: `pos/auth` controller @deprecated (yoki o'chirilmaydi — boshqa consumer bo'lishi mumkin, tekshir).

**A2. POS Monitor sodda + toza.**
- `PosMonitorPage` (yangi) = `/pos-monitor` asosiy (allaqachon).
- O'CHIRISH: `PosLogin` (SSO bo'ldi), `PosDashboard` legacy (PosMonitorPage qoplaydi).
- SAQLASH + ERP-token: PosMaterial360, PosLotTraceability, PosMovementKirim, PosMovementChiqim,
  PosInventory, PosReports, PosAdmin, PosMovements, PosMovementDetail, PosQuarantine, PosQCReview,
  PosMyInventory, PosLedger, PosRequests/RequisitionDetail.
- Har saqlangan sahifaning BE endpointi JONLI tekshiriladi; 404/501 bo'lsa → tuzatiladi yoki honest-empty.

**A3. ERP WMS sidebar (tz08) tozalash — toza kanonik oqim.**
Yangi struktura (faqat ishlaydigan + yangi toza sahifalar):
```
OMBOR (ERP — ko'rish/nazorat)
  Moliya nazorati      → wms/overview        (YANGI)
  Omborlar             → wms/warehouses      (YANGI)
  Xarid-to'lov (P2P)   → wms/procurement     (YANGI — tasdiq/ko'rish)
QABUL/AMALIYOT
  POS Monitor          → pos-monitor         (amaliyot: kirim/chiqim/qabul)
INVENTAR/HISOBOT (ishlaydiganlar saqlanadi yoki honest-empty)
  Inventarizatsiya     → wms/inventory       (tekshir: real BE?)
  Material 360         → inventory/materials (tekshir)
  Audit log            → wms/audit-log       (tekshir)
```
- Rasvo entrylar olib tashlanadi: warehouse/hub (WarehouseHub12), wms/transfer, wms/lot-traceability,
  wms/internal-requests (WMSExtended stub), warehouse/integrations, barcode-warehouse (agar rasvo).
- Qoida 22 regress-guard yangilanadi (kanonik ro'yxat).

**A4. O'lik ERP WMS sahifalar o'chiriladi (verified).**
- WarehouseHub12, WMSExtended, WmsAnalytics, SupplyChainDashboard, MMExtended, WarehouseDirectory,
  WarehouseReports, WarehouseIntegrations, BarcodeWarehouse (rasvo bo'lsa).
- Har biri: route o'chiriladi → sahifa fayli o'chiriladi → import o'chiriladi. Faqat sidebar'da yo'q +
  superseded + stub bo'lganlar. Sidebar'da bor bo'lsa avval almashtir.

**Verifikatsiya (A):** BE+FE tsc 0, sidebar guards PASS, BE boot OK, POS Monitor ERP login bilan ochiladi.

---

## FAZA B — BARCODE / QR / ETIKET (§6)

**B1.** Barcode/QR avto-generatsiya kirimda (EXTERNAL_IN). EAN-13 + Code-128 + QR. BE servis.
**B2.** Tur-maxsus etiket shabloni (rulon kg/o'lcham, oddiy, tayyor). ZPL/EPL termal printer chiqishi.
**B3.** USB/BT skaner hook (`useHardwareScanner`) — klaviatura input, Enter bilan (task #74).
**B4.** Kamera skaner (`useCameraScanner`) — BarcodeDetector + ZXing fallback (task #75).
**B5.** Material topilmasa: toast + qo'lda qidirish + yangi kartochka (§6.6).

---

## FAZA C — KARANTIN → QC OQIMI (§3.1, §5)

**C1.** EXTERNAL_IN → KARANTIN holati (oraliq). Karantin = status, alohida ombor emas (§3.10).
**C2.** QC 3-qaror: QABUL→asosiy ombor | REWORK→MES | RAD→ta'minotchi/brak (§5.2).
**C3.** Mijoz qaytarishi → QC → qayta sotish/brak + dalolatnoma (§5.3).

---

## FAZA D — HUJJATLAR / AKT (§12)

**D1.** PDF generatsiya servisi (kirim/qabul akti).
**D2.** Chiqim akti + hisob-faktura (alohida PDF).
**D3.** Akt turlari config-driven (inventarizatsiya/brak/asbob/utilizatsiya). Raqamlash: Ombor+Tur+Yil+ketma-ket.

---

## FAZA E — INVENTARIZATSIYA (§11)

**E1.** Davriy to'liq sanash + kunlik cycle count.
**E2.** Farq → moliya tasdig'i bilan GL tuzatish.

---

## FAZA F — BILDIRISHNOMA (§13, config-driven)
Kam qoldiq · muddat (FEFO) · byudjet/norma · tasdiq/podotchet · har kirim/chiqim.

## FAZA G — MATERIAL 360 (§14.2)
Har inventar to'liq profil: qoldiq+qiymat, kirim/chiqim tarixi, narx+partiya+yetkazuvchi+chek, QR/QC/passport, hozir kimda.

## FAZA H — XODIM INVENTARI / PODOTCHET (§10)
"Mening inventarim" sahifasi; ledger; ishdan chiqishda qaytarish (HR offboarding bloki).

## FAZA I — AUTO-GL (§9.6) — config kerak
`gl_account_mappings` BO'SH. Avval BHMS schyot mapping seed (moliya bilan). Keyin har harakatda Debit/Credit → AWAITING_REVIEW.

## FAZA J — BO'LIM OMBORI + NORMA (§3.9)
Tur-ombordan transfer → bo'lim; zakazga sarf; AI norma/limit.

## FAZA K — KASSA + MOLIYA INTEGRATSIYA (§7.10, §9)
Kassa = naqd nazorati; har xarid ombordan prixod/rasxod; FIFO tannarx.

---

## QURISH QOIDALARI (har faza)
- Aniq reja → to'liq bajarish → BE+FE tsc 0 → jonli DB test (rollback) → alohida commit (selective add).
- Schema ADD-ONLY; mavjud jadval/servis reuse (duplikat YO'Q).
- Har FE matn tLabel; rang faqat EP token; pre-commit guards PASS.
- Yarim ish YO'Q. Verify-don't-trust: agent/audit da'vosiga ishonmaslik.
- Branch boshqa agentlar bilan umumiy → faqat o'z fayllarini commit.
