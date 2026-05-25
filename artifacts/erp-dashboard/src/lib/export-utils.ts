/**
 * @module export-utils
 * @description Frontend utility / library module.
 */

export function exportToCSV(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data || data.length === 0) return;

  const keys = columns ? (Array.isArray(columns) ? columns : []).map(c => c.key) : Object.keys(data[0]);
  const headers = columns ? (Array.isArray(columns) ? columns : []).map(c => c.label) : keys;

  const csvContent = [
    headers.join(","),
    ...(Array.isArray(data) ? data : []).map(row =>
      (Array.isArray(keys) ? keys : []).map(key => {
        const val = row[key];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ColumnDef {
  header: string;
  accessor: (row: Record<string, unknown>) => string | number | null | undefined;
}

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ColumnDef[]
) {
  if (!data || data.length === 0) return;

  const XLSX = await import("@e965/xlsx");

  const rows = columns
    ? (Array.isArray(data) ? data : []).map((row) =>
        Object.fromEntries(
          (Array.isArray(columns) ? columns : []).map((col) => [col.header, col.accessor(row) ?? ""])
        )
      )
    : data;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportToPDF(
  title: string,
  data: Record<string, unknown>[],
  columns: ColumnDef[]
) {
  if (!data || data.length === 0) return;
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(new Date().toLocaleDateString("uz-UZ"), 14, 21);

  autoTable(doc, {
    head: [(Array.isArray(columns) ? columns : []).map((c) => c.header)],
    body: (Array.isArray(data) ? data : []).map((row) =>
      (Array.isArray(columns) ? columns : []).map((c) => String(c.accessor(row) ?? ""))
    ),
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  doc.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
