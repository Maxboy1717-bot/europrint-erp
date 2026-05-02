import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";
import PosBarcodeScanner from "../components/PosBarcodeScanner";
import { idbEnqueue } from "../components/PosOfflineBanner";

const VALID_MOVEMENT_TYPES = [
  "EXTERNAL_IN", "EXTERNAL_OUT", "INTERNAL_ISSUE",
  "INTERNAL_RETURN", "INTERNAL_TRANSFER", "DAMAGE",
] as const;

const lineSchema = z.object({
  materialCardId: z.string().min(1, "Material tanlanishi shart").refine(v => parseInt(v, 10) > 0, "To'g'ri material ID kiriting"),
  qty:            z.string().min(1, "Miqdor kiritilishi shart").refine(v => parseFloat(v) > 0, "Miqdor 0 dan katta bo'lishi shart"),
  unitPrice:      z.string().optional(),
  lotNumber:      z.string().optional(),
  expiryDate:     z.string().optional(),
  note:           z.string().optional(),
});

const movementFormSchema = z.object({
  movementTypeCode: z.enum(VALID_MOVEMENT_TYPES, { errorMap: () => ({ message: "Harakat turi tanlanishi shart" }) }),
  fromWarehouseId:  z.string().optional(),
  toWarehouseId:    z.string().optional(),
  lines:            z.array(lineSchema).min(1, "Kamida bitta qator kiritilishi shart"),
}).superRefine((data, ctx) => {
  const needsFrom = ["EXTERNAL_OUT","INTERNAL_ISSUE","INTERNAL_RETURN","INTERNAL_TRANSFER","DAMAGE"].includes(data.movementTypeCode);
  const needsTo   = ["EXTERNAL_IN","INTERNAL_ISSUE","INTERNAL_TRANSFER"].includes(data.movementTypeCode);
  if (needsFrom && !data.fromWarehouseId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromWarehouseId"], message: "Manba ombori tanlanishi shart" });
  }
  if (needsTo && !data.toWarehouseId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toWarehouseId"], message: "Manzil ombori tanlanishi shart" });
  }
});

interface LineItem { _key: string; materialCardId: string; qty: string; unitPrice: string; lotNumber: string; expiryDate: string; note: string; }

let _lineKeyCounter = 0;
function mkLine(): LineItem { return { _key: `ln-${++_lineKeyCounter}`, materialCardId: "", qty: "", unitPrice: "", lotNumber: "", expiryDate: "", note: "" }; }

const MOV_TYPES = [
  { value: "EXTERNAL_IN",       label: "Tashqi kirim" },
  { value: "EXTERNAL_OUT",      label: "Tashqi chiqim" },
  { value: "INTERNAL_ISSUE",    label: "Ichki berish" },
  { value: "INTERNAL_RETURN",   label: "Ichki qaytarish" },
  { value: "INTERNAL_TRANSFER", label: "Ichki ko'chirish" },
  { value: "DAMAGE",            label: "Zarar" },
];

export default function PosMovementNew() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [movType, setMovType]           = useState("EXTERNAL_IN");
  const [fromWh, setFromWh]             = useState("");
  const [toWh, setToWh]                 = useState("");
  const [supplierId, setSupplierId]     = useState("");
  const [supplierDoc, setSupplierDoc]   = useState("");
  const [supplierDocDate, setSupplierDocDate] = useState("");
  const [notes, setNotes]               = useState("");
  const [lines, setLines]               = useState<LineItem[]>([mkLine()]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [showScanner, setShowScanner]   = useState(false);
  const [scanLineIdx, setScanLineIdx]   = useState<number | null>(null);

  const needsFrom = ["EXTERNAL_OUT","INTERNAL_ISSUE","INTERNAL_RETURN","INTERNAL_TRANSFER","DAMAGE"].includes(movType);
  const needsTo   = ["EXTERNAL_IN","INTERNAL_ISSUE","INTERNAL_TRANSFER"].includes(movType);

  function addLine() { setLines(prev => [...prev, mkLine()]); }
  function removeLine(i: number) { setLines(prev => prev.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, key: Exclude<keyof LineItem, "_key">, val: string) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  }

  const handleSave = useCallback(async (submit = false) => {
    setError("");
    const validation = movementFormSchema.safeParse({
      movementTypeCode: movType,
      fromWarehouseId:  fromWh || undefined,
      toWarehouseId:    toWh || undefined,
      lines: (lines ?? []).map(l => ({
        materialCardId: l.materialCardId,
        qty:       l.qty,
        unitPrice: l.unitPrice || undefined,
        lotNumber: l.lotNumber || undefined,
        expiryDate: l.expiryDate || undefined,
        note:      l.note || undefined,
      })).filter(l => l.materialCardId && l.qty),
    });
    if (!validation.success) {
      const msgs = validation.error.errors.map(e => e.message).join("; ");
      setError(msgs);
      return;
    }
    const payload = {
      movementTypeCode: movType,
      fromWarehouseId:  fromWh || undefined,
      toWarehouseId:    toWh || undefined,
      supplierName:     supplierId || undefined,
      documentNumber:   supplierDoc || undefined,
      documentDate:     supplierDocDate || undefined,
      notes,
      lines: (lines ?? []).map(l => ({
        materialCardId: parseInt(l.materialCardId, 10),
        quantity:   parseFloat(l.qty),
        unitPrice:  l.unitPrice ? parseFloat(l.unitPrice) : undefined,
        lotNumber:  l.lotNumber || undefined,
        expiryDate: l.expiryDate || undefined,
        notes:      l.note || undefined,
      })).filter(l => l.materialCardId > 0 && l.quantity > 0),
      submit,
    };
    setSaving(true);
    try {
      await movementsApi.create(payload as Record<string, unknown>);
      navigate("/pos-monitor/movements");
    } catch (e) {
      const isNetworkError = !navigator.onLine ||
        (e instanceof TypeError && e.message.toLowerCase().includes("fetch")) ||
        (e instanceof Error && (e.message.includes("NetworkError") || e.message.includes("Failed to fetch")));
      if (isNetworkError) {
        const queueItem = {
          id:   crypto.randomUUID(),
          data: payload,
          ts:   Date.now(),
        };
        try {
          await idbEnqueue(queueItem);
          setOfflineQueued(true);
          setTimeout(() => navigate("/pos-monitor/movements"), 2000);
        } catch {
          setError("Oflayn saqlashda xatolik. Iltimos, qaytadan urinib ko'ring.");
        }
      } else {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      }
    } finally { setSaving(false); }
  }, [movType, fromWh, toWh, supplierId, supplierDoc, supplierDocDate, notes, lines, navigate]);

  const onScanResult = (result: { barcode: string; material?: { id: number }; found: boolean }) => {
    if (result.found && result.material && scanLineIdx !== null) {
      updateLine(scanLineIdx, "materialCardId", String(result.material.id));
    }
    setShowScanner(false);
  };

  const totalAmount = (lines ?? []).reduce((s, l) => {
    const q = parseFloat(l.qty) || 0;
    const p = parseFloat(l.unitPrice) || 0;
    return s + q * p;
  }, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/movements")}>← {t("common.back")}</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("movements.newMovement")}</h2>
      </div>

      {offlineQueued && <div className="pos-offline-banner" style={{ background: "rgba(0,255,148,0.08)", borderColor: "rgba(0,255,148,0.3)", color: "var(--pos-success)", marginBottom: 16 }}>📡 Internet yo'q — harakat oflayn navbatga saqlandi. Ulanish tiklanganda avtomatik yuboriladi.</div>}
      {error && <div className="pos-offline-banner" style={{ background: "rgba(255,71,87,0.1)", borderColor: "rgba(255,71,87,0.4)", color: "var(--pos-danger)", marginBottom: 16 }}>⚠️ {error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Left — form */}
        <div>
          {/* Header */}
          <div className="pos-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Harakat turi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {MOV_TYPES.map(mt => (
                <button
                  key={mt.value}
                  className={`pos-btn ${movType === mt.value ? "pos-btn-primary" : "pos-btn-ghost"}`}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => setMovType(mt.value)}
                >
                  {mt.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {needsFrom && (
                <div>
                  <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("movements.fromWarehouse")}</label>
                  <input className="pos-input" value={fromWh} onChange={e => setFromWh(e.target.value)} placeholder="Ombor ID" />
                </div>
              )}
              {needsTo && (
                <div>
                  <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("movements.toWarehouse")}</label>
                  <input className="pos-input" value={toWh} onChange={e => setToWh(e.target.value)} placeholder="Ombor ID" />
                </div>
              )}
              {movType === "EXTERNAL_IN" && (
                <>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Ta'minotchi ID</label>
                    <input className="pos-input" value={supplierId} onChange={e => setSupplierId(e.target.value)} placeholder="Supplier ID" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Hujjat raqami</label>
                    <input className="pos-input" value={supplierDoc} onChange={e => setSupplierDoc(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Hujjat sanasi</label>
                    <input className="pos-input" type="date" value={supplierDocDate} onChange={e => setSupplierDocDate(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lines */}
          <div className="pos-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("movements.items")}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => { setScanLineIdx(lines.length - 1); setShowScanner(true); }}>
                  📷 {t("movements.scanBarcode")}
                </button>
                <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={addLine}>
                  ➕ {t("movements.addLine")}
                </button>
              </div>
            </div>

            {/* Line header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.5fr 1fr auto", gap: 6, marginBottom: 8 }}>
              {["Material ID","Miqdor","Narx","Lot","Muddat","Izoh","action"].map((h) => (
                <div key={h} style={{ fontSize: 10, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h === "action" ? "" : h}</div>
              ))}
            </div>

            {(lines ?? []).map((line, i) => (
              <div key={line._key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.5fr 1fr auto", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <input className="pos-input" value={line.materialCardId} onChange={e => updateLine(i, "materialCardId", e.target.value)} placeholder="ID" style={{ flex: 1 }} />
                  <button className="pos-btn pos-btn-ghost" style={{ padding: "4px 7px", fontSize: 12, flexShrink: 0 }} onClick={() => { setScanLineIdx(i); setShowScanner(true); }}>📷</button>
                </div>
                <input className="pos-input pos-mono" value={line.qty}       onChange={e => updateLine(i, "qty",       e.target.value)} placeholder="0" />
                <input className="pos-input pos-mono" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", e.target.value)} placeholder="0.00" />
                <input className="pos-input"          value={line.lotNumber} onChange={e => updateLine(i, "lotNumber", e.target.value)} placeholder="LOT-001" />
                <input className="pos-input"          type="date" value={line.expiryDate} onChange={e => updateLine(i, "expiryDate", e.target.value)} />
                <input className="pos-input"          value={line.note}      onChange={e => updateLine(i, "note",      e.target.value)} placeholder="Izoh" />
                <button className="pos-btn pos-btn-ghost" style={{ padding: "4px 7px", color: "var(--pos-danger)" }} onClick={() => removeLine(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right — summary */}
        <div>
          <div className="pos-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Xulosa</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--pos-text-muted)" }}>Harakat turi</span>
                <span className="pos-badge pos-badge-blue" style={{ fontSize: 11 }}>{movType}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--pos-text-muted)" }}>Qatorlar soni</span>
                <span className="pos-mono">{lines.length}</span>
              </div>
              <div style={{ height: 1, background: "var(--pos-border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>Jami summa</span>
                <span className="pos-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos-accent)" }}>
                  {totalAmount.toLocaleString("uz-UZ")}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 6, display: "block" }}>{t("common.notes")}</label>
            <textarea className="pos-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Izoh..." style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="pos-btn pos-btn-ghost" style={{ justifyContent: "center" }} onClick={() => void handleSave(false)} disabled={saving}>
              💾 {t("movements.saveDraft")}
            </button>
            <button className="pos-btn pos-btn-primary" style={{ justifyContent: "center" }} onClick={() => void handleSave(true)} disabled={saving}>
              {saving ? "⏳ Saqlanmoqda..." : `🚀 ${t("movements.submit")}`}
            </button>
          </div>
        </div>
      </div>

      {showScanner && <PosBarcodeScanner onResult={onScanResult} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
