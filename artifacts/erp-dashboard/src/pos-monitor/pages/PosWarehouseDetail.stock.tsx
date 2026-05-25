/**
 * @module PosWarehouseDetail.stock
 * @description Stock tab content (unit groups + per-unit tables) for
 *   PosWarehouseDetail. Split out so the parent stays under 300 lines.
 */

import type { StockRow } from "./PosWarehouseDetail.types";
import { fmt, fmtDate, getUnitGroup } from "./PosWarehouseDetail.types";

export interface UnitGroupRow {
  unit: string;
  items: StockRow[];
  total: number;
  reserved: number;
}

export function StockTab({
  stockByUnit,
  search,
  setSearch,
  onReload,
  navigate,
  t,
}: {
  stockByUnit: UnitGroupRow[];
  search: string;
  setSearch: (v: string) => void;
  onReload: () => void;
  navigate: (url: string) => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          className="pos-input"
          style={{ width: 280 }}
          placeholder={t("common.materialQidirish")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="pos-btn pos-btn-ghost" onClick={onReload}>
          {t("yangilash")}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {stockByUnit.map((g) => {
          const ug = getUnitGroup(g.unit);
          return (
            <div
              key={g.unit}
              className="pos-card"
              style={{ padding: 12, borderLeft: `4px solid ${ug.color}` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 22 }}>{ug.icon}</span>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600 }}>
                  {ug.label}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: ug.color }}>
                {fmt(g.total, 2)}{" "}
                <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{g.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                {g.items.length} ta material · Band: {fmt(g.reserved, 2)}
              </div>
            </div>
          );
        })}
        {stockByUnit.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: 20,
              color: "var(--pos-text-muted)",
            }}
          >
            {t("buOmbordaMateriallarYoq")}
          </div>
        )}
      </div>

      {stockByUnit.map((g) => {
        const ug = getUnitGroup(g.unit);
        return (
          <div key={g.unit} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{ug.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {ug.label} ({g.unit})
              </div>
              <div style={{ flex: 1, height: 1, background: "var(--pos-border)" }} />
              <div style={{ fontSize: 12, color: ug.color, fontWeight: 700 }}>
                Jami: {fmt(g.total, 2)} {g.unit}
              </div>
            </div>
            <div className="pos-card" style={{ overflowX: "auto" }}>
              <table className="pos-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>{t("common.Material")}</th>
                    <th>{t("code")}</th>
                    <th style={{ textAlign: "right" }}>{t("mavjud")}</th>
                    <th style={{ textAlign: "right" }}>{t("band")}</th>
                    <th style={{ textAlign: "right" }}>{t("total")}</th>
                    <th>{t("updated")}</th>
                    <th>{t("Amallar")}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((r) => (
                    <tr key={r.materialCardId}>
                      <td>
                        <button
                          className="pos-btn pos-btn-ghost"
                          style={{ padding: "2px 6px", fontSize: 12 }}
                          onClick={() => navigate(`/pos-monitor/materials/360/${r.materialCardId}`)}
                        >
                          {r.materialName ?? `#${r.materialCardId}`}
                        </button>
                      </td>
                      <td
                        className="pos-mono"
                        style={{ fontSize: 11, color: "var(--pos-text-muted)" }}
                      >
                        {r.materialCode ?? "—"}
                      </td>
                      <td
                        className="pos-mono"
                        style={{ textAlign: "right", fontWeight: 600, color: ug.color }}
                      >
                        {fmt(r.availableQty)}
                      </td>
                      <td
                        className="pos-mono"
                        style={{ textAlign: "right", color: "var(--pos-text-muted)" }}
                      >
                        {fmt(r.reservedQty)}
                      </td>
                      <td className="pos-mono" style={{ textAlign: "right" }}>
                        {fmt(r.totalQty)}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                        {fmtDate(r.lastUpdated)}
                      </td>
                      <td>
                        <button
                          className="pos-btn pos-btn-ghost"
                          style={{ padding: "3px 8px", fontSize: 11 }}
                          onClick={() => navigate(`/pos-monitor/materials/360/${r.materialCardId}`)}
                          title={t("material360")}
                        >
                          🔭 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
