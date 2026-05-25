/** @module PosMovementChiqimHelpers @description Small reusable UI components: ToastContainer, NoStockModal, EmployeeSearch. */

import { useState, useRef } from "react";
import type { Toast, EmployeeSuggestion } from "./PosMovementChiqimTypes";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

// ─── Toast container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const { t } = useTranslation("common");
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", top: 72, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8, maxWidth: 380,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="pos-slide-in"
          style={{
            background: t.type === "success"
              ? "rgba(16,185,129,0.95)"
              : t.type === "warning"
                ? "rgba(245,158,11,0.95)"
                : "rgba(239,68,68,0.95)",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            cursor: "pointer",
          }}
          onClick={() => onDismiss(t.id)}
        >
          <span>{t.message}</span>
          <span style={{ opacity: 0.7, fontSize: 11 }}>✕</span>
        </div>
      ))}
    </div>
  );
}

// ─── No-stock modal ───────────────────────────────────────────────────────────

interface NoStockModalProps {
  materialName: string;
  onClose: () => void;
}

export function NoStockModal({ materialName, onClose }: NoStockModalProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div
        className="pos-modal"
        style={{ maxWidth: 380, textAlign: "center" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 52, marginBottom: 12 }}>🚫</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--pos-danger)" }}>
          {t("qoldiqYoq")}
        </h3>
        <p style={{ color: "var(--pos-text-muted)", fontSize: 13, marginBottom: 20 }}>
          <strong>{materialName}</strong> {t("ombordaMavjudQoldiqYoqBu")}
        </p>
        <button
          className="pos-btn pos-btn-danger"
          style={{ minWidth: 120, justifyContent: "center" }}
          onClick={onClose}
        >
          {t("close2")}
        </button>
      </div>
    </div>
  );
}

// ─── Employee search combobox ─────────────────────────────────────────────────

interface EmployeeSearchProps {
  value: string;
  onChange: (id: string, name: string) => void;
}

export function EmployeeSearch({ value, onChange }: EmployeeSearchProps) {
  const { t } = useTranslation("common");
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<EmployeeSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiRequest<EmployeeSuggestion[]>('GET', `/api/pos/employees?q=${encodeURIComponent(q)}`);
        setSuggestions(Array.isArray(res) ? res.slice(0, 8) : []);
        setOpen(true);
      } catch { setSuggestions([]); }
    }, 280);
  }

  function select(s: EmployeeSuggestion) {
    setQuery(s.name);
    setOpen(false);
    onChange(String(s.id), s.name);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        className="pos-input"
        value={query}
        onChange={e => search(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder={t("xodimIsmi2")}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "var(--pos-card)", border: "1px solid var(--pos-border)",
          borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
          maxHeight: 200, overflowY: "auto",
        }}>
          {suggestions.map(s => (
            <div
              key={s.id}
              onMouseDown={() => select(s)}
              style={{
                padding: "9px 13px", cursor: "pointer", fontSize: 13,
                borderBottom: "1px solid var(--pos-border)",
                display: "flex", justifyContent: "space-between",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span>{s.name}</span>
              {s.position && (
                <span style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{s.position}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
