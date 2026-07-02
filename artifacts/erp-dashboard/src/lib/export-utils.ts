/**
 * @module export-utils
 * @description Frontend utility / library module. Client-side export helpers
 *   (CSV/JSON/Excel/PDF) used by list/report pages. Every export is role-gated
 *   (hujjat-eksport-cheklash, egasi 2026-07-02): only
 *   super_admin/admin/director/manager may export — the single gate here covers
 *   every page that calls these helpers.
 */

import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

/** BE storage.controller.ts DOWNLOAD_ALLOWED_ROLES bilan bir xil to'plam. */
const EXPORT_ALLOWED_ROLES = new Set(["super_admin", "admin", "director", "manager"]);

/** Fallback-kesh: react-query keshida user bo'lmasa /api/auth/me dan bir marta olinadi. */
let fetchedRole: string | null = null;
let roleFetchInFlight = false;

/**
 * Joriy foydalanuvchi rolini KOMPONENT TASHQARISIDA o'qish.
 *
 * Manba 1 (kanonik): react-query keshi `["/api/auth/me"]` — bu queryKey'ni
 * ModuleSidebar/AppSidebar'dagi `useRoleMenus()` doimiy faol ushlab turadi
 * (auth httpOnly cookie'da, localStorage'da user YO'Q — tekshirilgan 2026-07-02).
 * Manba 2 (fallback): modul-darajali kesh, fon-so'rov bilan to'ldiriladi.
 */
function currentUserRole(): string | null {
  try {
    const me = queryClient.getQueryData<{ role?: string } | null>(["/api/auth/me"]);
    if (me && typeof me.role === "string" && me.role) return me.role;
  } catch { /* kesh mavjud bo'lmasa fallback'ga o'tamiz */ }
  return fetchedRole;
}

/** Fon-so'rov: rol keshda bo'lmasa keyingi urinishlar uchun to'ldirib qo'yadi. */
function prefetchRole(): void {
  if (roleFetchInFlight || fetchedRole !== null) return;
  roleFetchInFlight = true;
  try {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<{ role?: string }>) : null))
      .then((me) => {
        if (me && typeof me.role === "string" && me.role) fetchedRole = me.role;
        roleFetchInFlight = false;
      })
      .catch(() => { roleFetchInFlight = false; });
  } catch { roleFetchInFlight = false; }
}

/**
 * Eksport rol-darvozasi. `false` = taqiqlangan (toast ko'rsatilgan), chaqiruvchi return qilsin.
 *
 * Rol NOMA'LUM bo'lsa (kesh hali bo'sh — masalan sahifa endigina ochildi) eksportga
 * RUXSAT beriladi (fail-open): bu UX-darvoza, haqiqiy himoya BE rol-gate'larda —
 * rol-o'qish buzilgani uchun HAMMA eksportni bloklash mumkin emas (Q-39).
 * Amalda `useRoleMenus` keshi sahifa yuklanishida darhol to'ladi, shuning uchun
 * taqiqlangan rol deyarli har doim to'g'ri ushlanadi.
 */
function ensureExportAllowed(): boolean {
  const role = currentUserRole();
  if (role === null) {
    prefetchRole();
    return true;
  }
  if (EXPORT_ALLOWED_ROLES.has(role.toLowerCase())) return true;
  toast({
    title: "Eksport taqiqlangan",
    description: `Sizning rolingiz ("${role}") ma'lumot eksport qilishga ruxsat etilmagan`,
    variant: "destructive",
  });
  return false;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!ensureExportAllowed()) return;
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
  if (!ensureExportAllowed()) return;
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
  if (!ensureExportAllowed()) return;
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
  if (!ensureExportAllowed()) return;
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
