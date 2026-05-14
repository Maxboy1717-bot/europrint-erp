/**
 * @module WarehouseSelector
 * @description React UI component.
 */

import { useState, useEffect } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { warehousesApi } from "../api/pos-monitor.api";

interface Warehouse {
  id: number;
  code: string;
  nameUz: string;
  warehouseType?: string;
}

interface WarehouseSelectorProps {
  value?: number;
  onChange: (warehouseId: number, warehouse: Warehouse) => void;
  label?: string;
  placeholder?: string;
  exclude?: number[];
  filterType?: string;
  disabled?: boolean;
  required?: boolean;
}

export function WarehouseSelector({ value, onChange, label, placeholder, exclude = [], filterType, disabled, required }: WarehouseSelectorProps) {
  const { t } = usePosI18n();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    warehousesApi.getAll()
      .then((data: unknown) => setWarehouses(Array.isArray(data) ? data as Warehouse[] : []))
      .catch(() => setWarehouses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = warehouses.filter(w => {
    if (exclude.includes(w.id)) return false;
    if (filterType && w.warehouseType !== filterType) return false;
    return true;
  });

  const selected = filtered.find(w => w.id === value);

  return (
    <div>
      {label && (
        <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>
          {label}{required && <span style={{ color: "var(--pos-danger)" }}> *</span>}
        </label>
      )}
      <select
        className="pos-input"
        style={{ width: "100%" }}
        value={value ?? ""}
        disabled={disabled || loading}
        onChange={e => {
          const id = Number(e.target.value);
          const wh = filtered.find(w => w.id === id);
          if (wh) onChange(id, wh);
        }}
      >
        <option value="">{loading ? t("common.loading") : (placeholder ?? t("common.select"))}</option>
        {filtered.map(w => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.nameUz}
            {w.warehouseType ? ` (${w.warehouseType})` : ""}
          </option>
        ))}
      </select>
      {selected && (
        <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 4 }}>
          ✅ {selected.nameUz}
        </div>
      )}
    </div>
  );
}

export default WarehouseSelector;
