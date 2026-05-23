/**
 * @module PosMyInventoryTable
 * @description Materials table (with skeleton loader) for PosMyInventory.
 * Split from PosMyInventory.tsx (Rule 16).
 */

import type { InventoryItem } from "./PosMyInventory.types";

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i}>
          <div
            style={{
              height: 14,
              borderRadius: 6,
              background: "var(--ep-primary)",
              backgroundSize: "200% 100%",
              animation: "pos-pulse 1.4s ease-in-out infinite",
              width: i === 1 ? "80%" : "60%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onReturn: (item: InventoryItem) => void;
  t: (k: string) => string;
  fmtNum: (n: number) => string;
  fmtCurrency: (n: number) => string;
}

export function InventoryTable({ items, loading, onReturn, t, fmtNum, fmtCurrency }: InventoryTableProps) {
  return (
    <div className="pos-card" style={{ marginBottom: 20, overflow: "hidden" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
        {t("materiallarRoyxati1")}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>{t("common.code")}</th>
              <th>{t("common.name")}</th>
              <th>{t("common.unit")}</th>
              <th>{t("myInventory.givenQty")}</th>
              <th>{t("myInventory.returnedQty")}</th>
              <th>{t("myInventory.balance")}</th>
              <th>{t("myInventory.totalValue")}</th>
              <th>{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div>{t("myInventory.noItems")}</div>
                </td>
              </tr>
            )}

            {!loading &&
              items.map(item => {
                const hasBalance = item.balance > 0;
                return (
                  <tr
                    key={item.materialId}
                    style={{
                      background: hasBalance ? "rgba(245,158,11,0.06)" : "transparent",
                      opacity: hasBalance ? 1 : 0.6,
                    }}
                  >
                    <td>
                      <span className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                        {item.materialCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: hasBalance ? 600 : 400 }}>{item.materialName}</td>
                    <td style={{ color: "var(--pos-text-muted)" }}>{item.unit}</td>
                    <td>{fmtNum(item.givenQty)}</td>
                    <td style={{ color: "var(--pos-success)" }}>{fmtNum(item.returnedQty)}</td>
                    <td>
                      <span className={`pos-badge ${hasBalance ? "pos-badge-yellow" : "pos-badge-green"}`}>
                        {fmtNum(item.balance)}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                      {fmtCurrency(item.totalValue)}
                    </td>
                    <td>
                      {hasBalance ? (
                        <button
                          className="pos-btn pos-btn-ghost"
                          style={{ fontSize: 12, padding: "4px 12px" }}
                          onClick={() => onReturn(item)}
                        >
                          ↩️ {t("myInventory.returnButton")}
                        </button>
                      ) : (
                        <span className="pos-badge pos-badge-green" style={{ fontSize: 10 }}>✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
