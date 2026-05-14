/**
 * WarehouseReportsAll.tsx
 * ERP — Ombor Hisobotlar markazi (22 ta turdagi hisobot)
 * URL: /wms/reports
 */
import { useState, useCallback } from "react";
import { REPORTS, ReportType } from "./WarehouseReportsAllTypes";
import { FiltersBar, ReportList, ReportViewer } from "./WarehouseReportsAllSections";

export default function WarehouseReportsAll() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadReport = useCallback(async (report: ReportType) => {
    setSelected(report);
    setLoading(true);
    setError("");
    setData([]);
    try {
      const result = await report.loader();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result && typeof result === "object") {
        setData([result]);
      } else {
        setData([]);
      }
    } catch (e) {
      setError(String((e as Error).message ?? "Xato"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredReports = REPORTS.filter(r => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="mb-6">
        <div className="text-xs text-gray-500 font-semibold">OMBOR HISOBOTLAR MARKAZI</div>
        <h1 className="text-2xl font-bold text-gray-900">22 ta turdagi hisobot</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hisobot turini tanlang — ma'lumotlar real-time yuklanadi
        </p>
      </div>

      <FiltersBar
        search={search}
        onSearch={setSearch}
        categoryFilter={categoryFilter}
        onCategory={setCategoryFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReportList
          filteredReports={filteredReports}
          selected={selected}
          onSelect={r => void loadReport(r)}
        />

        <div className="lg:col-span-2">
          <ReportViewer
            selected={selected}
            data={data}
            loading={loading}
            error={error}
            onRefresh={() => { if (selected) void loadReport(selected); }}
          />
        </div>
      </div>
    </div>
  );
}
