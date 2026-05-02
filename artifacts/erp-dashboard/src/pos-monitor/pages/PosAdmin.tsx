import { useState, useEffect, useCallback, useRef } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { glApi, syncApi, printerApi } from "../api/pos-monitor.api";
import {
  WarehousesSection, CategoriesSection, UnitsSection, SuppliersSection,
  TerminalsSection, PrintersSection, GlMappingSection, AuditLogSection,
  fetchWarehouses, fetchCategories, fetchUnits, fetchSuppliers, fetchAuditLog,
  approveGlEntry,
  type Warehouse, type Category, type Unit, type Supplier,
  type Printer, type GlLog, type AuditEntry, type SyncStatus,
} from "../components/PosAdminSections";
import { apiRequest } from "@/lib/queryClient";

type AdminSection = "warehouses" | "categories" | "units" | "suppliers" | "terminals" | "printers" | "glMapping" | "auditLog";

function useSection<T>(fetcher: () => Promise<T>) {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const ref = useRef(fetcher);
  ref.current = fetcher;

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await ref.current()); }
    catch (e) { setError(e instanceof Error ? e.message : "Xatolik"); }
    finally { setLoading(false); }
  }, []);

  return { data, loading, error, reload };
}

const SECTIONS: { key: AdminSection; icon: string; labelKey: string }[] = [
  { key: "warehouses", icon: "🏪", labelKey: "admin.warehouses" },
  { key: "categories", icon: "📁", labelKey: "admin.categories" },
  { key: "units",      icon: "📏", labelKey: "admin.units" },
  { key: "suppliers",  icon: "🤝", labelKey: "admin.suppliers" },
  { key: "terminals",  icon: "💻", labelKey: "admin.terminals" },
  { key: "printers",   icon: "🖨",  labelKey: "admin.printers" },
  { key: "glMapping",  icon: "📊", labelKey: "admin.glMapping" },
  { key: "auditLog",   icon: "📋", labelKey: "admin.auditLog" },
];

export default function PosAdmin() {
  const { t } = usePosI18n();
  const [section, setSection] = useState<AdminSection>("warehouses");

  const wh       = useSection<Warehouse[]>(fetchWarehouses);
  const cats     = useSection<Category[]>(fetchCategories);
  const units    = useSection<Unit[]>(fetchUnits);
  const suppliers = useSection<Supplier[]>(fetchSuppliers);
  const sync     = useSection<SyncStatus>(() => syncApi.getStatus() as Promise<SyncStatus>);
  const printers = useSection<Printer[]>(() => printerApi.getAll() as Promise<Printer[]>);
  const glPending = useSection<GlLog[]>(() => glApi.getPending() as Promise<GlLog[]>);
  const audit    = useSection<AuditEntry[]>(fetchAuditLog);

  const reloadWh       = wh.reload;
  const reloadCats     = cats.reload;
  const reloadUnits    = units.reload;
  const reloadSuppliers = suppliers.reload;
  const reloadSync     = sync.reload;
  const reloadPrinters = printers.reload;
  const reloadGl       = glPending.reload;
  const reloadAudit    = audit.reload;

  useEffect(() => {
    switch (section) {
      case "warehouses": void reloadWh();       break;
      case "categories": void reloadCats();     break;
      case "units":      void reloadUnits();    break;
      case "suppliers":  void reloadSuppliers(); break;
      case "terminals":  void reloadSync();     break;
      case "printers":   void reloadPrinters(); break;
      case "glMapping":  void reloadGl();       break;
      case "auditLog":   void reloadAudit();    break;
    }
  }, [section, reloadWh, reloadCats, reloadUnits, reloadSuppliers, reloadSync, reloadPrinters, reloadGl, reloadAudit]);

  async function onToggleWh(id: number, active: boolean) {
    await apiRequest("PATCH", `/api/wms/warehouses/${id}/toggle-active`, { isActive: !active });
    void wh.reload();
  }

  async function onApproveGl(id: number) {
    await approveGlEntry(id);
    void glPending.reload();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("admin.title")}</h2>
        <span className="pos-badge pos-badge-red" style={{ fontSize: 11 }}>Admin only</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <div className="pos-card" style={{ padding: "12px 8px", alignSelf: "start" }}>
          {SECTIONS.map(s => (
            <div
              key={s.key}
              className={`pos-sidebar-item ${section === s.key ? "active" : ""}`}
              style={{ padding: "9px 12px", borderRadius: 8, cursor: "pointer", display: "flex", gap: 10 }}
              onClick={() => setSection(s.key)}
            >
              <span>{s.icon}</span>
              <span style={{ fontSize: 13 }}>{t(s.labelKey)}</span>
            </div>
          ))}
        </div>

        <div>
          {section === "warehouses" && <WarehousesSection {...wh} onRefresh={wh.reload} onToggle={onToggleWh} />}
          {section === "categories" && <CategoriesSection {...cats} onRefresh={cats.reload} />}
          {section === "units"      && <UnitsSection {...units} onRefresh={units.reload} />}
          {section === "suppliers"  && <SuppliersSection {...suppliers} onRefresh={suppliers.reload} />}
          {section === "terminals"  && <TerminalsSection {...sync} onRefresh={sync.reload} />}
          {section === "printers"   && <PrintersSection {...printers} onRefresh={printers.reload} />}
          {section === "glMapping"  && <GlMappingSection {...glPending} onRefresh={glPending.reload} onApprove={(id) => void onApproveGl(id)} />}
          {section === "auditLog"   && <AuditLogSection {...audit} onRefresh={audit.reload} />}
        </div>
      </div>
    </div>
  );
}
