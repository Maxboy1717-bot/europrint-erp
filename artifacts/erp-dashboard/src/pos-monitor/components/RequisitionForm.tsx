/**
 * @module RequisitionForm
 * @description React UI component.
 */

import { useState } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { requestsApi } from "../api/pos-monitor.api";
import { WarehouseSelector } from "./WarehouseSelector";

interface RequisitionLine {
  materialCode: string;
  materialName: string;
  qty: number;
  unit: string;
  note?: string;
}

interface RequisitionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RequisitionForm({ onSuccess, onCancel }: RequisitionFormProps) {
  const { t } = usePosI18n();
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [needDate, setNeedDate] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<RequisitionLine[]>([{ materialCode: "", materialName: "", qty: 1, unit: "dona" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addLine() {
    setLines(prev => [...prev, { materialCode: "", materialName: "", qty: 1, unit: "dona" }]);
  }

  function removeLine(i: number) {
    setLines(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof RequisitionLine, val: string | number) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId) { setError("Ombor tanlanmagan"); return; }
    if (lines.some(l => !l.materialCode || l.qty <= 0)) { setError("Barcha qatorlarni to'ldiring"); return; }

    setSubmitting(true);
    setError("");
    try {
      await requestsApi.create({ warehouseId, priority, needDate: needDate || undefined, note: note || undefined, lines } as Record<string, unknown>);
      onSuccess?.();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Xato yuz berdi");
    } finally { setSubmitting(false); }
  }

  const PRIORITIES: Array<{ value: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; label: string; color: string }> = [
    { value: "LOW", label: "Past", color: "#95A5A6" },
    { value: "MEDIUM", label: "O'rta", color: "#3498DB" },
    { value: "HIGH", label: "Yuqori", color: "#E67E22" },
    { value: "URGENT", label: "Shoshilinch", color: "#E74C3C" },
  ];

  return (
    <form onSubmit={e => void handleSubmit(e)}>
      <div style={{ display: "grid", gap: 16 }}>
        <WarehouseSelector
          label={t("requests.targetWarehouse")}
          value={warehouseId}
          onChange={id => setWarehouseId(id)}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>
              {t("requests.priority")}
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`pos-btn ${priority === p.value ? "pos-btn-primary" : "pos-btn-ghost"}`}
                  style={{ fontSize: 12, padding: "4px 10px", borderColor: priority === p.value ? p.color : undefined, color: priority === p.value ? p.color : undefined }}
                  onClick={() => setPriority(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>
              {t("requests.needDate")}
            </label>
            <input type="date" className="pos-input" style={{ width: "100%" }} value={needDate} onChange={e => setNeedDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{t("requests.lines")}</label>
            <button type="button" className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "2px 8px" }} onClick={addLine}>
              ➕ {t("requests.addLine")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 80px 80px auto", gap: 6, alignItems: "center" }}>
                <input className="pos-input" placeholder="Kod" value={line.materialCode} onChange={e => updateLine(i, "materialCode", e.target.value)} />
                <input className="pos-input" placeholder="Nomi" value={line.materialName} onChange={e => updateLine(i, "materialName", e.target.value)} />
                <input className="pos-input" type="number" min={0.001} step={0.001} value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} />
                <input className="pos-input" placeholder="birlik" value={line.unit} onChange={e => updateLine(i, "unit", e.target.value)} />
                {lines.length > 1 && (
                  <button type="button" className="pos-btn pos-btn-ghost" style={{ padding: "4px 8px", color: "var(--pos-danger)" }} onClick={() => removeLine(i)}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("common.notes")}</label>
          <textarea className="pos-input" style={{ width: "100%", minHeight: 60 }} placeholder={t("requests.notePlaceholder")} value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {error && <div style={{ color: "var(--pos-danger)", fontSize: 13 }}>❌ {error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {onCancel && <button type="button" className="pos-btn pos-btn-ghost" onClick={onCancel}>{t("common.cancel")}</button>}
          <button type="submit" className="pos-btn pos-btn-primary" disabled={submitting}>
            {submitting ? t("common.loading") : t("requests.submit")}
          </button>
        </div>
      </div>
    </form>
  );
}

export default RequisitionForm;
