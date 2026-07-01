/**
 * PosMovementKirim — 5-step wizard for EXTERNAL_IN warehouse movements.
 * All state and API calls live here; step render is delegated to sub-components.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { movementsApi, quarantineApi, warehousesApi, barcodeApi, type InboundBarcodeResult } from "../api/pos-monitor.api";
import { idbEnqueue } from "../components/PosOfflineBanner";
import {
  headerSchema, lineSchema,
  type HeaderForm, type LineItem, type WarehouseOption, type CreatedMovement,
  KIRIM_CONFIG, DEFAULT_KIRIM_CONFIG,
  mkLine, today,
} from "./PosMovementKirimTypes";
import { StepIndicator } from "./PosMovementKirimHelpers";
import { Step1Header, Step2Lines, Step3Passport, Step4Review, Step5Submit } from "./PosMovementKirimSteps";
import { PosQtyKeypad, BarcodeLabelModal } from "./PosMovementKirimBarcode";

import { useTranslation } from '@/lib/i18n';
export default function PosMovementKirim() {
  const { t } = useTranslation('common');
  const [location, navigate] = useLocation();

  const urlWarehouseId = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return new URLSearchParams(search).get("warehouseId") ?? "";
  }, [location]);

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  const [header, setHeader] = useState<HeaderForm>({
    toWarehouseId: "", supplierName: "", contractNumber: "",
    waybillNumber: "", arrivalDate: today(), currency: "UZS", notes: "",
  });

  const [lines, setLines] = useState<LineItem[]>([mkLine()]);

  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [lineErrors, setLineErrors]   = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving]           = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [created, setCreated]         = useState<CreatedMovement | null>(null);

  // ── Qty keypad (tarozi-avto / ekran-klaviatura) ──────────────────────────────
  const [keypad, setKeypad] = useState<{ index: number; field: "quantity" | "weightKg"; title: string; unit: string } | null>(null);

  // ── Barkod yaratish + chop etish (MAJBURIY) ──────────────────────────────────
  const [barcodeLineIdx, setBarcodeLineIdx]   = useState<number | null>(null);
  const [barcodeResult, setBarcodeResult]     = useState<InboundBarcodeResult | null>(null);
  const [barcodeLoading, setBarcodeLoading]   = useState(false);
  const [barcodeError, setBarcodeError]       = useState("");

  // ── Warehouses ───────────────────────────────────────────────────────────────
  const [warehouses, setWarehouses]           = useState<WarehouseOption[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const activeWarehouse = useMemo(
    () => warehouses.find(w => String(w.id) === String(header.toWarehouseId)) ?? null,
    [warehouses, header.toWarehouseId],
  );

  const kirimCfg = useMemo(() => {
    if (!activeWarehouse?.code) return DEFAULT_KIRIM_CONFIG;
    return KIRIM_CONFIG[activeWarehouse.code] ?? DEFAULT_KIRIM_CONFIG;
  }, [activeWarehouse]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWarehousesLoading(true);
      try {
        const raw  = await warehousesApi.getAll();
        const list = (Array.isArray(raw) ? raw : []) as WarehouseOption[];
        if (cancelled) return;
        setWarehouses(list);
        if (header.toWarehouseId) return;
        if (urlWarehouseId) {
          const ctx = list.find(w => String(w.id) === String(urlWarehouseId));
          if (ctx) { setHeader(prev => ({ ...prev, toWarehouseId: ctx.id })); return; }
        }
        const quarantine = list.find(w => w.code === "QC-HOLD" || (w.type ?? "").toLowerCase() === "quarantine");
        if (quarantine) setHeader(prev => ({ ...prev, toWarehouseId: quarantine.id }));
      } catch { /* offline */ }
      finally { if (!cancelled) setWarehousesLoading(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function setH<K extends keyof HeaderForm>(key: K, val: HeaderForm[K]) {
    setHeader(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  const addLine    = () => setLines(prev => [...prev, mkLine()]);
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  function updateLine(i: number, key: Exclude<keyof LineItem, "_key">, val: string) {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const next = { ...l, [key]: val };
      // Material o'zgarsa, oldingi barkod boshqa materialga tegishli → bekor qilinadi.
      if (key === "materialCardId" && val !== l.materialCardId) { next.barcode = ""; next.barcodePrintedAt = ""; }
      return next;
    }));
    setLineErrors(prev => { const n = { ...prev }; if (n[i]?.[key]) delete n[i][key]; return n; });
  }

  const totalValue  = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0), 0);
  const totalWeight = lines.reduce((s, l) => s + (parseFloat(l.weightKg) || 0), 0);
  const totalQty    = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0);

  // ── Barkod MAJBURIY: har material qatori chop etilgan barkodga ega bo'lishi shart.
  const filledLines = useMemo(
    () => lines.filter(l => parseInt(l.materialCardId, 10) > 0 && parseFloat(l.quantity) > 0),
    [lines],
  );
  const allLinesHaveBarcode = useMemo(
    () => filledLines.length > 0 && filledLines.every(l => l.barcode && l.barcodePrintedAt),
    [filledLines],
  );

  // ── Barkod yaratish (POST /api/pos/barcode/generate — POS Monitor printeri) ──
  const generateBarcode = useCallback(async (index: number) => {
    const line = lines[index];
    if (!line) return;
    const matId = parseInt(line.materialCardId, 10);
    const whId  = parseInt(header.toWarehouseId, 10);
    if (!(matId > 0)) { setBarcodeError(t("PosMovementKirim.avvalMaterialTanlang", "Avval material tanlang")); setBarcodeLineIdx(index); setBarcodeResult(null); return; }
    if (!(whId > 0))  { setBarcodeError(t("PosMovementKirim.avvalOmborTanlang", "Avval ombor tanlang")); setBarcodeLineIdx(index); setBarcodeResult(null); return; }
    setBarcodeLineIdx(index);
    setBarcodeResult(null);
    setBarcodeError("");
    setBarcodeLoading(true);
    try {
      const res = await barcodeApi.generate({
        materialCardId: matId,
        warehouseId:    whId,
        quantity:       parseFloat(line.quantity) || undefined,
        unit:           line.weightKg ? "kg" : undefined,
      });
      setBarcodeResult(res);
      // Barkod qatorga yoziladi; chop etilguncha printedAt bo'sh (saqlash hali BLOK).
      setLines(prev => prev.map((l, idx) => idx === index ? { ...l, barcode: res.barcode } : l));
    } catch (e) {
      setBarcodeError(e instanceof Error ? e.message : (t("xatolikYuzBerdi", "Xatolik")));
    } finally {
      setBarcodeLoading(false);
    }
  }, [lines, header.toWarehouseId, t]);

  // ── Etiketni chop etish → printedAt belgilanadi (saqlash ochiladi) ───────────
  const printBarcodeLabel = useCallback(() => {
    if (barcodeLineIdx === null || !barcodeResult) return;
    const idx = barcodeLineIdx;
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, barcode: barcodeResult.barcode, barcodePrintedAt: new Date().toISOString() } : l));
    // Brauzer print dialogi orqali POS Monitor printeriga yuborish.
    try {
      const w = window.open("", "_blank", "width=420,height=320");
      if (w) {
        const lbl = barcodeResult.label;
        w.document.write(`<html><head><title>${barcodeResult.barcode}</title></head><body style="font-family:monospace;text-align:center;padding:16px">
          <div style="font-size:11px">${lbl.warehouseCode} · ${lbl.barcodeType}</div>
          <div style="font-size:16px;font-weight:700">${lbl.materialName}</div>
          <div style="font-size:11px">${lbl.materialCode ?? ""}${lbl.quantity != null ? " · " + lbl.quantity + " " + lbl.unit : ""}</div>
          <div style="font-size:22px;letter-spacing:3px;margin:12px 0">${barcodeResult.barcode}</div>
          <div style="font-size:10px">${lbl.dimensions.widthMm}×${lbl.dimensions.heightMm} mm</div>
          </body></html>`);
        w.document.close();
        w.focus();
        w.print();
      }
    } catch { /* print best-effort */ }
    setBarcodeLineIdx(null);
    setBarcodeResult(null);
  }, [barcodeLineIdx, barcodeResult]);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validateHeader(): boolean {
    const result = headerSchema.safeParse(header);
    const errs: Record<string, string> = {};
    if (!result.success) result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
    if (kirimCfg.supplierRequired && !header.supplierName?.trim()) errs.supplierName = `${kirimCfg.supplierLabel} kiritilishi shart`;
    if (kirimCfg.contractRequired && !header.contractNumber?.trim()) errs.contractNumber = `${kirimCfg.contractLabel} kiritilishi shart`;
    if (Object.keys(errs).length) { setErrors(errs); return false; }
    setErrors({});
    return true;
  }

  function validateLines(): boolean {
    const errs: Record<string, Record<string, string>> = {};
    let ok = true;
    lines.forEach((l, i) => {
      const result = lineSchema.safeParse({ materialCardId: l.materialCardId, quantity: l.quantity, unitPrice: l.unitPrice || "0", batchNumber: l.batchNumber || undefined, expiryDate: l.expiryDate || undefined, weightKg: l.weightKg || undefined, certificateNumber: l.certificateNumber || undefined, notes: l.notes || undefined });
      if (!result.success) { ok = false; errs[i] = {}; result.error.errors.forEach(e => { errs[i][e.path[0] as string] = e.message; }); }
      // Barkod MAJBURIY (spec): material+miqdor to'ldirilgan qatorda chop etilgan barkod bo'lishi shart.
      if (parseInt(l.materialCardId, 10) > 0 && parseFloat(l.quantity) > 0 && (!l.barcode || !l.barcodePrintedAt)) {
        ok = false;
        errs[i] = { ...(errs[i] ?? {}), barcode: t("PosMovementKirim.barkodMajburiy", "Barkod yaratib chop etilishi shart") };
      }
    });
    if (lines.length === 0) { ok = false; setGlobalError(t("kamidaBittaMaterialQatori")); }
    setLineErrors(errs);
    return ok;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goNext() {
    setGlobalError("");
    if (step === 1 && !validateHeader()) return;
    if (step === 2 && !validateLines()) return;
    setStep(s => Math.min(5, s + 1));
  }

  function goBack() { setGlobalError(""); setStep(s => Math.max(1, s - 1)); }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (submitToKarantin: boolean) => {
    setGlobalError("");
    // Barkod MAJBURIY — barkodsiz qabul YO'Q (spec). Saqlash BLOK.
    const missingBarcode = lines.some(l => parseInt(l.materialCardId, 10) > 0 && parseFloat(l.quantity) > 0 && (!l.barcode || !l.barcodePrintedAt));
    if (missingBarcode) {
      setGlobalError(t("PosMovementKirim.barkodsizSaqlashMumkinEmas", "Barkodsiz saqlash mumkin emas — har material uchun barkod yaratib chop eting"));
      return;
    }
    setSaving(true);
    const payload = {
      movementTypeCode: "EXTERNAL_IN", toWarehouseId: header.toWarehouseId,
      supplierName: header.supplierName, documentNumber: header.contractNumber,
      documentDate: header.arrivalDate, notes: header.notes || undefined,
      lines: lines.map(l => ({ materialCardId: parseInt(l.materialCardId, 10), quantity: parseFloat(l.quantity), unitPrice: parseFloat(l.unitPrice) || 0, batchNumber: l.batchNumber || undefined, barcode: l.barcode || undefined, expiryDate: l.expiryDate || undefined, notes: l.notes || undefined })).filter(l => l.materialCardId > 0 && l.quantity > 0),
      submit: submitToKarantin,
      // Savdo-sity referens H-8 naqshi: double-tap "Saqlash" bir xil kirim-hujjatni ikki marta yaratmasin.
      idempotencyKey: crypto.randomUUID(),
    };
    try {
      const result = await movementsApi.create(payload as Record<string, unknown>) as CreatedMovement;
      if (result?.id) {
        try {
          await quarantineApi.createPassport({ movementId: result.id, supplierName: header.supplierName, contractNumber: header.contractNumber, waybillNumber: header.waybillNumber || undefined, quantity: totalQty, weightKg: totalWeight > 0 ? totalWeight : undefined, certificateNumber: lines[0]?.certificateNumber || undefined });
        } catch { /* best-effort */ }
      }
      setCreated(result ?? { id: 0 });
      setStep(5);
    } catch (e) {
      const isNetworkError = !navigator.onLine || (e instanceof TypeError && e.message.toLowerCase().includes("fetch")) || (e instanceof Error && (e.message.includes("NetworkError") || e.message.includes("Failed to fetch")));
      if (isNetworkError) {
        try { await idbEnqueue({ id: crypto.randomUUID(), data: payload, ts: Date.now() }); setOfflineQueued(true); setTimeout(() => navigate("/pos-monitor/movements"), 2500); }
        catch { setGlobalError(t("oflaynSaqlashdaXatolik")); }
      } else { setGlobalError(e instanceof Error ? e.message : t("xatolikYuzBerdi")); }
    } finally { setSaving(false); }
  }, [header, lines, totalQty, totalWeight, navigate, t]);

  function downloadPdf() { if (created?.id) window.open(movementsApi.getPdf(created.id), "_blank"); }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pos-fade-in">
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 12px" }} onClick={() => urlWarehouseId ? navigate(`/pos-monitor/warehouses/${urlWarehouseId}`) : navigate("/pos-monitor/movements/new")}>{t("orqaga")}</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{kirimCfg.icon} {kirimCfg.title}</h2>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>
            {activeWarehouse ? `${activeWarehouse.code} — ${activeWarehouse.name ?? ""}` : t("externalInBarchaMaydonlar")}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span className="pos-badge pos-badge-blue" style={{ fontSize: 11 }}>{t('externalIn')}</span>
        </div>
      </div>

      {/* Banners */}
      {offlineQueued && <div className="pos-offline-banner" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", color: "var(--pos-success)", marginBottom: 16 }}>{t("internetYoqHarakatOflaynNavbatga")}</div>}
      {globalError  && <div className="pos-offline-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "var(--pos-danger)", marginBottom: 16 }}>⚠️ {globalError}</div>}

      <StepIndicator current={step} />

      {step === 1 && <Step1Header header={header} errors={errors} warehouses={warehouses} warehousesLoading={warehousesLoading} kirimCfg={kirimCfg} setH={setH} goNext={goNext} />}
      {step === 2 && <Step2Lines  lines={lines} lineErrors={lineErrors} header={header} kirimCfg={kirimCfg} totalQty={totalQty} totalValue={totalValue} totalWeight={totalWeight} allLinesHaveBarcode={allLinesHaveBarcode} addLine={addLine} removeLine={removeLine} updateLine={updateLine} onGenerateBarcode={generateBarcode} onOpenKeypad={(i, field) => { const l = lines[i]; setKeypad({ index: i, field, title: l?.materialName || `#${i + 1}`, unit: field === "weightKg" ? "kg" : (l?.weightKg ? "kg" : "dona") }); }} goBack={goBack} goNext={goNext} />}
      {step === 3 && <Step3Passport header={header} lines={lines} totalQty={totalQty} totalWeight={totalWeight} totalValue={totalValue} goBack={goBack} goNext={goNext} />}
      {step === 4 && <Step4Review   header={header} lines={lines} totalQty={totalQty} totalWeight={totalWeight} totalValue={totalValue} goBack={goBack} goNext={goNext} setStep={setStep} />}
      {step === 5 && <Step5Submit   created={created} saving={saving} header={header} lines={lines} totalValue={totalValue} allLinesHaveBarcode={allLinesHaveBarcode} handleSave={handleSave} downloadPdf={downloadPdf} goBack={goBack} navigate={navigate} />}

      {/* Miqdor/og'irlik kiritish — tarozi-avto yoki ekran-klaviatura */}
      <PosQtyKeypad
        open={keypad !== null}
        title={keypad?.title}
        unit={keypad?.unit}
        initial={keypad ? (lines[keypad.index]?.[keypad.field] ?? "") : ""}
        onConfirm={(v) => { if (keypad) updateLine(keypad.index, keypad.field, v); }}
        onClose={() => setKeypad(null)}
      />

      {/* Barkod yaratish va chop etish (MAJBURIY) */}
      <BarcodeLabelModal
        open={barcodeLineIdx !== null}
        result={barcodeResult}
        loading={barcodeLoading}
        error={barcodeError}
        onPrint={printBarcodeLabel}
        onRegenerate={() => { if (barcodeLineIdx !== null) void generateBarcode(barcodeLineIdx); }}
        onClose={() => { setBarcodeLineIdx(null); setBarcodeResult(null); setBarcodeError(""); }}
      />

      <style>{`
        ._lbl { font-size: 11px; color: var(--pos-text-muted); margin-bottom: 5px; display: block; font-weight: 600; letter-spacing: 0.3px; }
        ._err { border-color: var(--pos-danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important; }
        ._errmsg { font-size: 11px; color: var(--pos-danger); margin-top: 3px; }
      `}</style>
    </div>
  );
}
