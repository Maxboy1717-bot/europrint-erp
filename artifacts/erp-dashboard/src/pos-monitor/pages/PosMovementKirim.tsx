/**
 * PosMovementKirim — 5-step wizard for EXTERNAL_IN warehouse movements.
 * All state and API calls live here; step render is delegated to sub-components.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { movementsApi, quarantineApi, warehousesApi } from "../api/pos-monitor.api";
import { idbEnqueue } from "../components/PosOfflineBanner";
import {
  headerSchema, lineSchema,
  type HeaderForm, type LineItem, type WarehouseOption, type CreatedMovement,
  KIRIM_CONFIG, DEFAULT_KIRIM_CONFIG,
  mkLine, today,
} from "./PosMovementKirimTypes";
import { StepIndicator } from "./PosMovementKirimHelpers";
import { Step1Header, Step2Lines, Step3Passport, Step4Review, Step5Submit } from "./PosMovementKirimSteps";

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
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
    setLineErrors(prev => { const n = { ...prev }; if (n[i]?.[key]) delete n[i][key]; return n; });
  }

  const totalValue  = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0), 0);
  const totalWeight = lines.reduce((s, l) => s + (parseFloat(l.weightKg) || 0), 0);
  const totalQty    = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0);

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
    setSaving(true);
    const payload = {
      movementTypeCode: "EXTERNAL_IN", toWarehouseId: header.toWarehouseId,
      supplierName: header.supplierName, documentNumber: header.contractNumber,
      documentDate: header.arrivalDate, notes: header.notes || undefined,
      lines: lines.map(l => ({ materialCardId: parseInt(l.materialCardId, 10), quantity: parseFloat(l.quantity), unitPrice: parseFloat(l.unitPrice) || 0, batchNumber: l.batchNumber || undefined, expiryDate: l.expiryDate || undefined, notes: l.notes || undefined })).filter(l => l.materialCardId > 0 && l.quantity > 0),
      submit: submitToKarantin,
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
      {step === 2 && <Step2Lines  lines={lines} lineErrors={lineErrors} header={header} kirimCfg={kirimCfg} totalQty={totalQty} totalValue={totalValue} totalWeight={totalWeight} addLine={addLine} removeLine={removeLine} updateLine={updateLine} goBack={goBack} goNext={goNext} />}
      {step === 3 && <Step3Passport header={header} lines={lines} totalQty={totalQty} totalWeight={totalWeight} totalValue={totalValue} goBack={goBack} goNext={goNext} />}
      {step === 4 && <Step4Review   header={header} lines={lines} totalQty={totalQty} totalWeight={totalWeight} totalValue={totalValue} goBack={goBack} goNext={goNext} setStep={setStep} />}
      {step === 5 && <Step5Submit   created={created} saving={saving} header={header} lines={lines} totalValue={totalValue} handleSave={handleSave} downloadPdf={downloadPdf} goBack={goBack} navigate={navigate} />}

      <style>{`
        ._lbl { font-size: 11px; color: var(--pos-text-muted); margin-bottom: 5px; display: block; font-weight: 600; letter-spacing: 0.3px; }
        ._err { border-color: var(--pos-danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important; }
        ._errmsg { font-size: 11px; color: var(--pos-danger); margin-top: 3px; }
      `}</style>
    </div>
  );
}
