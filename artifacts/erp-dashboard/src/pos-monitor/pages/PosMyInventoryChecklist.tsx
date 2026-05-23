/**
 * @module PosMyInventoryChecklist
 * @description HR clearance checklist section for PosMyInventory.
 * Owns its own open/checked state. Split from PosMyInventory.tsx (Rule 16).
 */

import { useState } from "react";
import type { InventoryItem } from "./PosMyInventory.types";

interface InventoryChecklistProps {
  pendingItems: InventoryItem[];
  onReturn: (item: InventoryItem) => void;
  t: (k: string) => string;
  fmtNum: (n: number) => string;
}

export function InventoryChecklist({ pendingItems, onReturn, t, fmtNum }: InventoryChecklistProps) {
  const [open, setOpen]           = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  function toggleCheck(id: number) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="pos-card pos-fade-in">
      <div
        className="pos-offline-banner"
        style={{
          background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.03))",
          borderColor: "rgba(239,68,68,0.28)",
          color: "var(--pos-danger)",
          marginBottom: 0,
        }}
      >
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span>
          {t("myInventory.hrWarning") ? t("myInventory.hrWarning") : "Siz hali "}
          {!t("myInventory.hrWarning").includes("{") && "Siz hali "}
          <strong>{pendingItems.length} turdagi</strong> material qaytarmagansiz.
          Ishdan ketishdan oldin hammasini qaytaring.
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="pos-btn pos-btn-ghost"
          style={{ fontSize: 12, padding: "4px 10px", color: "var(--pos-danger)" }}
          onClick={() => setOpen(o => !o)}
        >
          {open ? "▲ Yopish" : "▼ Ko'rish"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            ✅ {t("myInventory.checklist")}
          </div>
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>{t("common.code")}</th>
                <th>{t("common.name")}</th>
                <th>{t("myInventory.balance")}</th>
                <th>{t("common.unit")}</th>
                <th>{t("common.action")}</th>
              </tr>
            </thead>
            <tbody>
              {pendingItems.map(item => (
                <tr key={item.materialId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(item.materialId)}
                      onChange={() => toggleCheck(item.materialId)}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </td>
                  <td>
                    <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                      {item.materialCode}
                    </span>
                  </td>
                  <td>{item.materialName}</td>
                  <td>
                    <span className="pos-badge pos-badge-yellow">{fmtNum(item.balance)}</span>
                  </td>
                  <td style={{ color: "var(--pos-text-muted)" }}>{item.unit}</td>
                  <td>
                    <button
                      className="pos-btn pos-btn-ghost"
                      style={{ fontSize: 11, padding: "3px 10px" }}
                      onClick={() => onReturn(item)}
                    >
                      ↩️ {t("myInventory.returnButton")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="pos-btn pos-btn-danger"
              disabled={checkedIds.size === 0}
              style={{ fontSize: 13 }}
              onClick={() => {
                // Opens the first checked item for return (serial process)
                const firstId = [...checkedIds][0];
                const target = pendingItems.find(i => i.materialId === firstId);
                if (target) onReturn(target);
              }}
            >
              📦 Hammasini qaytarish so'rovi ({checkedIds.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
