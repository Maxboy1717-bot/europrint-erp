/**
 * export-helpers.ts
 * CSV/Excel/JSON eksport universal yordamchi.
 */

export function exportCSV<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  options?: {
    headers?: string[];      // ko'rsatiladigan ustun nomlari
    keys?: (keyof T)[];      // qaysi ustunlar
    delimiter?: string;      // standart: comma
  }
): void {
  if (!Array.isArray(data) || data.length === 0) {
    alert("Eksport uchun ma'lumot yo'q");
    return;
  }

  const keys = (options?.keys ?? Object.keys(data[0])) as (keyof T)[];
  const headers = options?.headers ?? keys.map(k => String(k));
  const delim = options?.delimiter ?? ",";

  const escape = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "object") return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
    const s = String(v);
    if (s.includes(delim) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = [
    headers.map(escape).join(delim),
    ...data.map(row => keys.map(k => escape(row[k])).join(delim)),
  ];

  // BOM for UTF-8 Excel compatibility
  const csv = "﻿" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportJSON<T>(filename: string, data: T): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : filename + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * HTML jadval → Excel-mos XML (xls format)
 * Bu yo'l bilan eksport qilingan fayl Excel-da to'g'ri ochiladi.
 */
export function exportExcel<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  options?: { headers?: string[]; keys?: (keyof T)[]; sheetName?: string }
): void {
  if (!Array.isArray(data) || data.length === 0) {
    alert("Eksport uchun ma'lumot yo'q");
    return;
  }
  const keys = (options?.keys ?? Object.keys(data[0])) as (keyof T)[];
  const headers = options?.headers ?? keys.map(k => String(k));
  const sheetName = options?.sheetName ?? "Sheet1";

  const escapeXml = (v: unknown): string => {
    const s = String(v ?? "");
    return s.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c);
  };

  const headerRow = `<Row>${headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}</Row>`;
  const dataRows = data.map(row =>
    `<Row>${keys.map(k => {
      const v = row[k];
      const isNum = typeof v === "number" && Number.isFinite(v);
      return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${escapeXml(v)}</Data></Cell>`;
    }).join("")}</Row>`
  ).join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${escapeXml(sheetName)}">
<Table>${headerRow}${dataRows}</Table>
</Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : filename + ".xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
