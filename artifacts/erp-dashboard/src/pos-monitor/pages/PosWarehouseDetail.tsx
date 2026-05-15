/**
 * PosWarehouseDetail.tsx
 *
 * Ombor detail sahifasi — 6 ta tab. Section content moved to sibling files
 *   (PosWarehouseDetail.stock, PosWarehouseDetail.movements) so the page
 *   composition stays under 300 lines.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { warehousesApi, warehouseFeaturesApi } from "../api/pos-monitor.api";
import type {
  WarehouseEmployee,
  StockRow,
  Movement,
  TabKey,
} from "./PosWarehouseDetail.types";
import { StockTab, type UnitGroupRow } from "./PosWarehouseDetail.stock";
import { MovementsTable, EmployeesTable } from "./PosWarehouseDetail.movements";

export default function PosWarehouseDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const whId = params.id ?? "";
  const whIdNum = parseInt(whId, 10);

  const [tab, setTab] = useState<TabKey>("stock");
  const [stock, setStock] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [employees, setEmployees] = useState<WarehouseEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, movData, empData] = await Promise.all([
        warehousesApi.getStock(whId).catch(() => []),
        warehousesApi.getMovements(whId, 200).catch(() => []),
        Number.isFinite(whIdNum)
          ? warehouseFeaturesApi.listEmployees(whIdNum).catch(() => [])
          : Promise.resolve([]),
      ]);
      setStock((Array.isArray(stockData) ? stockData : []) as StockRow[]);
      setMovements((Array.isArray(movData) ? movData : []) as Movement[]);
      setEmployees((Array.isArray(empData) ? empData : []) as WarehouseEmployee[]);
    } catch (e) {
      console.error("[PosWarehouseDetail] loadData:", e);
    } finally {
      setLoading(false);
    }
  }, [whId, whIdNum]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(
    () =>
      (Array.isArray(stock) ? stock : []).filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          String(r.materialCardId).includes(q) ||
          (r.materialCode ?? "").toLowerCase().includes(q) ||
          (r.materialName ?? "").toLowerCase().includes(q)
        );
      }),
    [stock, search]
  );

  const stockByUnit: UnitGroupRow[] = useMemo(() => {
    const groups = new Map<string, UnitGroupRow>();
    for (const item of filtered) {
      const u = (item.unit ?? "").trim() || "—";
      if (!groups.has(u)) groups.set(u, { unit: u, items: [], total: 0, reserved: 0 });
      const g = groups.get(u)!;
      g.items.push(item);
      g.total += item.availableQty ?? 0;
      g.reserved += item.reservedQty ?? 0;
    }
    return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
  }, [filtered]);

  const myMovements = useMemo(
    () =>
      (Array.isArray(movements) ? movements : []).filter(
        (m) =>
          (m.toWarehouseId != null && String(m.toWarehouseId) === String(whId)) ||
          (m.fromWarehouseId != null && String(m.fromWarehouseId) === String(whId))
      ),
    [movements, whId]
  );

  const inflowMovements = useMemo(
    () =>
      myMovements.filter(
        (m) => m.toWarehouseId != null && String(m.toWarehouseId) === String(whId)
      ),
    [myMovements, whId]
  );

  const outflowMovements = useMemo(
    () =>
      myMovements.filter(
        (m) => m.fromWarehouseId != null && String(m.fromWarehouseId) === String(whId)
      ),
    [myMovements, whId]
  );

  const quarantineMovements = useMemo(
    () =>
      myMovements.filter(
        (m) =>
          m.status === "qc_pending" ||
          m.status === "karantin" ||
          m.status === "quarantine" ||
          m.status === "qc_review"
      ),
    [myMovements]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className="pos-btn pos-btn-ghost"
          style={{ padding: "6px 10px" }}
          onClick={() => navigate("/pos-monitor/warehouses")}
        >
          ← {t("common.back")}
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ombor #{whId}</h2>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="pos-btn"
            style={{
              padding: "6px 12px",
              background: "#10B981",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
            }}
            onClick={() => navigate(`/pos-monitor/movements/new/kirim?warehouseId=${whId}`)}
            title={t("shuOmborgaYangiKirim")}
          >
            {t("kirim1")}
          </button>
          <button
            className="pos-btn"
            style={{
              padding: "6px 12px",
              background: "#F59E0B",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
            }}
            onClick={() => navigate(`/pos-monitor/movements/new/chiqim?fromWarehouseId=${whId}`)}
            title={t("shuOmbordanYangiChiqim")}
          >
            {t("chiqim1")}
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <div className="pos-card" style={{ padding: "8px 16px", display: "inline-flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("materialTuri1")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)" }}>
              {stock.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("kirim2")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "#10B981" }}>
              {inflowMovements.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("chiqim2")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "#EF4444" }}>
              {outflowMovements.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("xodimlar1")}</div>
            <div className="pos-mono" style={{ fontWeight: 700 }}>{employees.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pos-tabs" style={{ display: "flex", gap: 4, overflowX: "auto" }}>
        <div className={`pos-tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>
          📦 Stok ({stock.length})
        </div>
        <div className={`pos-tab ${tab === "inflow" ? "active" : ""}`} onClick={() => setTab("inflow")}>
          📥 Kirim ({inflowMovements.length})
        </div>
        <div className={`pos-tab ${tab === "outflow" ? "active" : ""}`} onClick={() => setTab("outflow")}>
          📤 Chiqim ({outflowMovements.length})
        </div>
        <div className={`pos-tab ${tab === "quarantine" ? "active" : ""}`} onClick={() => setTab("quarantine")}>
          🔬 Karantin ({quarantineMovements.length})
        </div>
        <div className={`pos-tab ${tab === "employees" ? "active" : ""}`} onClick={() => setTab("employees")}>
          👥 Xodimlar ({employees.length})
        </div>
        <div className={`pos-tab ${tab === "bins" ? "active" : ""}`} onClick={() => setTab("bins")}>
          {t("bin")}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>
          {t("yuklanmoqda")}
        </div>
      )}

      {!loading && tab === "stock" && (
        <StockTab
          stockByUnit={stockByUnit}
          search={search}
          setSearch={setSearch}
          onReload={() => void loadData()}
          navigate={navigate}
          t={t}
        />
      )}

      {!loading && tab === "inflow" && (
        <MovementsTable
          movements={inflowMovements}
          title={t("buOmborgaKirimlar")}
          color="#10B981"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Bu omborga kirimlar yo'q"
        />
      )}

      {!loading && tab === "outflow" && (
        <MovementsTable
          movements={outflowMovements}
          title={t("buOmbordanChiqimlar")}
          color="#EF4444"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Bu ombordan chiqimlar yo'q"
        />
      )}

      {!loading && tab === "quarantine" && (
        <MovementsTable
          movements={quarantineMovements}
          title={t("karantinVaQcKutmoqda")}
          color="#F59E0B"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Karantinda hozir hech narsa yo'q"
        />
      )}

      {!loading && tab === "employees" && <EmployeesTable employees={employees} t={t} />}

      {!loading && tab === "bins" && (
        <div className="pos-card" style={{ padding: 24, textAlign: "center", color: "var(--pos-text-muted)" }}>
          🗂 Zonalar / Bin lokatsiyalar — Tez orada qo'shiladi
        </div>
      )}
    </div>
  );
}
