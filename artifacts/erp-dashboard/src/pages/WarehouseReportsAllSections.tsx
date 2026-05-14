/**
 * WarehouseReportsAllSections.tsx
 * ReportList, ReportViewer, ReportTable, formatCell — display sections
 */
import { ReportType, CATEGORY_COLORS, CATEGORY_LABELS, REPORTS } from "./WarehouseReportsAllTypes";

// ─── Cell formatter ───────────────────────────────────────────────────────────

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v).substring(0, 80);
  if (typeof v === "boolean") return v ? "✅" : "❌";
  if (typeof v === "number") return v.toLocaleString("uz-UZ");
  const s = String(v);
  if (s.length > 80) return s.substring(0, 80) + "...";
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    try { return new Date(s).toLocaleString("uz-UZ"); } catch { return s; }
  }
  return s;
}

// ─── Dynamic Table ────────────────────────────────────────────────────────────

export function ReportTable({ data }: { data: unknown[] }) {
  if (data.length === 0) return null;

  const firstRow = data[0] as Record<string, unknown>;
  if (!firstRow || typeof firstRow !== "object") {
    return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }

  const keys = Object.keys(firstRow).slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {keys.map(k => (
              <th key={k} className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => {
            const r = row as Record<string, unknown>;
            return (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                {keys.map(k => (
                  <td key={k} className="px-3 py-2 text-sm">
                    {formatCell(r[k])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length > 100 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Birinchi 100 ta yozuv ko'rsatildi (jami {data.length})
        </div>
      )}
    </div>
  );
}

// ─── Report List (left panel) ─────────────────────────────────────────────────

interface ReportListProps {
  filteredReports: ReportType[];
  selected: ReportType | null;
  onSelect: (r: ReportType) => void;
}

export function ReportList({ filteredReports, selected, onSelect }: ReportListProps) {
  return (
    <div className="lg:col-span-1 space-y-2 max-h-[80vh] overflow-y-auto pr-2">
      {filteredReports.map(r => (
        <button
          key={r.key}
          onClick={() => onSelect(r)}
          className={`w-full text-left p-3 rounded-lg border transition ${
            selected?.key === r.key
              ? "bg-blue-50 border-blue-400 shadow-sm"
              : `${CATEGORY_COLORS[r.category]} hover:border-blue-300`
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.title}</div>
              <div className="text-xs text-gray-600 mt-1">{r.description}</div>
              <div className="text-[10px] uppercase text-gray-400 mt-1 font-bold">
                {CATEGORY_LABELS[r.category]}
              </div>
            </div>
          </div>
        </button>
      ))}
      {filteredReports.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Hisobot topilmadi</div>
      )}
    </div>
  );
}

// ─── Report Viewer (right panel) ──────────────────────────────────────────────

interface ReportViewerProps {
  selected: ReportType | null;
  data: unknown[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export function ReportViewer({ selected, data, loading, error, onRefresh }: ReportViewerProps) {
  if (!selected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
        <div className="text-5xl mb-3">📊</div>
        <div className="font-semibold text-gray-700">Hisobot turini tanlang</div>
        <div className="text-sm text-gray-500 mt-2">
          Chap tomondan {REPORTS.length} ta hisobotdan birini bosing
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.key}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <span className="text-2xl">{selected.icon}</span>
        <div className="flex-1">
          <div className="font-bold">{selected.title}</div>
          <div className="text-xs text-gray-500">{selected.description}</div>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200"
        >
          🔄
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-[var(--ep-blue)] text-white rounded text-sm hover:bg-[var(--ep-blue)]/90"
        >
          📥 Export JSON
        </button>
      </div>

      <div className="p-4 min-h-[400px]">
        {loading && (
          <div className="text-center py-10 text-gray-500">⏳ Yuklanmoqda...</div>
        )}

        {!loading && error && (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-[var(--ep-red)] font-semibold">{error}</div>
            <button
              onClick={onRefresh}
              className="mt-3 px-4 py-2 bg-[var(--ep-yellow)] text-white rounded text-sm"
            >
              Qayta urinish
            </button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <div>Ma'lumot yo'q yoki bo'sh natija</div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <ReportTable data={data} />
        )}

        {!loading && !error && data.length > 0 && (
          <div className="mt-4 text-xs text-gray-400 text-right">
            Jami yozuvlar: {data.length}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filters Bar ──────────────────────────────────────────────────────────────

interface FiltersBarProps {
  search: string;
  onSearch: (v: string) => void;
  categoryFilter: string;
  onCategory: (v: string) => void;
}

export function FiltersBar({ search, onSearch, categoryFilter, onCategory }: FiltersBarProps) {
  return (
    <div className="flex gap-3 mb-4 flex-wrap">
      <input
        placeholder="Hisobot qidirish..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-[200px]"
      />
      <select
        value={categoryFilter}
        onChange={e => onCategory(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
      >
        <option value="all">Barchasi ({REPORTS.length})</option>
        <option value="stock">Stok ({REPORTS.filter(r => r.category === "stock").length})</option>
        <option value="movement">Harakat ({REPORTS.filter(r => r.category === "movement").length})</option>
        <option value="financial">Moliyaviy ({REPORTS.filter(r => r.category === "financial").length})</option>
        <option value="quality">Sifat ({REPORTS.filter(r => r.category === "quality").length})</option>
        <option value="audit">Audit ({REPORTS.filter(r => r.category === "audit").length})</option>
      </select>
    </div>
  );
}
