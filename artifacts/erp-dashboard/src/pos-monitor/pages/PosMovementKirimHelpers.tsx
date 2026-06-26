/**
 * PosMovementKirimHelpers — Shared UI sub-components for the Kirim wizard:
 * StepIndicator, MaterialSearch, and small display helpers.
 */
import { useState, useEffect, useRef } from "react";
import type { MaterialSuggestion } from "./PosMovementKirimTypes";
import { materialsApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, labelKey: "stepAsosiyMalumotlar" },
  { n: 2, labelKey: "stepMateriallar" },
  { n: 3, labelKey: "stepInventarPasporti" },
  { n: 4, labelKey: "stepKoribChiqish" },
  { n: 5, labelKey: "stepTasdiqlash" },
];

export function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation("common");
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 64 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: current > s.n
                ? "linear-gradient(135deg,#10B981,#059669)"
                : current === s.n
                  ? "linear-gradient(135deg,#3B82F6,#2563EB)"
                  : "rgba(163,177,198,0.18)",
              color: current >= s.n ? "#fff" : "var(--pos-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
              boxShadow: current === s.n ? "0 2px 8px rgba(59,130,246,0.35)" : undefined,
              transition: "all 0.25s",
            }}>
              {current > s.n ? "✓" : s.n}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: current === s.n ? "var(--pos-accent)" : "var(--pos-text-muted)",
              whiteSpace: "nowrap", letterSpacing: 0.2,
            }}>
              {t(s.labelKey)}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 6px", marginBottom: 20,
              background: current > s.n
                ? "linear-gradient(90deg,#10B981,#3B82F6)"
                : "var(--pos-border)",
              transition: "background 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Material search combobox ─────────────────────────────────────────────────
export function MaterialSearch({
  value, name, onChange,
}: {
  value: string;
  name: string;
  onChange: (id: string, name: string, materialType?: string | null, category?: string | null) => void;
}) {
  const { t } = useTranslation("common");
  const [query, setQuery]           = useState(name || value);
  const [suggestions, setSuggestions] = useState<MaterialSuggestion[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (name) setQuery(name); }, [name]);

  function search(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await materialsApi.getAll({ q, limit: 10 }) as MaterialSuggestion[];
        setSuggestions(Array.isArray(res) ? res.slice(0, 10) : []);
        setOpen(true);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 280);
  }

  function select(s: MaterialSuggestion) {
    setQuery(s.name);
    setOpen(false);
    onChange(String(s.id), s.name, s.material_type ?? null, s.category ?? null);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        className="pos-input"
        value={query}
        onChange={e => search(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder={t("materialNomiYokiId")}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--pos-text-muted)" }}>⏳</span>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "var(--pos-card)", border: "1px solid var(--pos-border)",
          borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
          maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.map(s => (
            <div
              key={s.id}
              onMouseDown={() => select(s)}
              style={{ padding: "9px 13px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--pos-border)", display: "flex", justifyContent: "space-between" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span>{s.name}</span>
              {s.code && <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{s.code}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small display helpers ────────────────────────────────────────────────────
export function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div style={{ color: "var(--pos-text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value || "—"}</div>
    </>
  );
}

export function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );
}

export function SumItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700 }} className={mono ? "pos-mono" : ""}>{value}</div>
    </div>
  );
}
