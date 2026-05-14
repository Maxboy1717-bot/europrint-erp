/**
 * WarehouseInventoryPassport.tsx
 * ERP — Inventar pasportlari (Karantin uchun)
 * URL: /wms/passports
 */
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileCheck, Search, Calendar } from "lucide-react";

interface Passport {
  id: number;
  movement_id: number;
  movement_number?: string;
  material_code: string | null;
  supplier_name: string | null;
  contract_number: string | null;
  waybill_number: string | null;
  arrival_date: string;
  quantity: number;
  weight_kg: number | null;
  volume_m3: number | null;
  certificate_number: string | null;
  quarantine_started_at: string | null;
  qc_started_at: string | null;
  qc_result: "QABUL" | "REWORK" | "CHIQARISH" | null;
  qc_note: string | null;
  transferred_at: string | null;
  created_at: string;
}

const QC_RESULT_COLORS: Record<string, string> = {
  QABUL: "bg-emerald-500",
  REWORK: "bg-amber-500",
  CHIQARISH: "bg-red-500",
};

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return Number(n).toLocaleString("uz-UZ", { maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function WarehouseInventoryPassport() {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [qcFilter, setQcFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qcFilter !== "all") params.set("qcResult", qcFilter);
      if (dateFrom) params.set("fromDate", dateFrom);
      if (dateTo) params.set("toDate", dateTo);
      params.set("limit", "200");

      const r = await apiRequest<Passport[] | { rows: Passport[] }>(
        "GET",
        `/api/pos/inventory-passport?${params.toString()}`,
      );
      const list = Array.isArray(r) ? r : (r as { rows: Passport[] })?.rows ?? [];
      setPassports(list);
    } catch (e) {
      console.error(e);
      setPassports([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [qcFilter]);

  const filtered = passports.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.movement_number ?? "").toLowerCase().includes(q)
        || (p.supplier_name ?? "").toLowerCase().includes(q)
        || (p.contract_number ?? "").toLowerCase().includes(q)
        || (p.material_code ?? "").toLowerCase().includes(q);
  });

  const stats = {
    total: passports.length,
    pending: passports.filter(p => !p.qc_result).length,
    accepted: passports.filter(p => p.qc_result === "QABUL").length,
    rework: passports.filter(p => p.qc_result === "REWORK").length,
    rejected: passports.filter(p => p.qc_result === "CHIQARISH").length,
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="h-8 w-8 text-[var(--ep-blue)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">INVENTAR PASPORTLARI</div>
          <h1 className="text-2xl font-bold">Karantin va QC tarixi</h1>
          <p className="text-sm text-gray-500">EXTERNAL_IN harakatlari uchun inventar pasportlari va QC qarorlari</p>
        </div>
        <Button onClick={load} variant="outline">🔄 Yangilash</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Jami pasport</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-[var(--ep-yellow)]">{stats.pending}</div>
          <div className="text-xs text-gray-500">QC kutmoqda</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-[var(--ep-green)]">{stats.accepted}</div>
          <div className="text-xs text-gray-500">QABUL</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-[var(--ep-yellow)]">{stats.rework}</div>
          <div className="text-xs text-gray-500">REWORK</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-[var(--ep-red)]">{stats.rejected}</div>
          <div className="text-xs text-gray-500">CHIQARISH</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Qidirish: hujjat, ta'minotchi, shartnoma, kod..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={qcFilter} onChange={e => setQcFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded text-sm">
              <option value="all">Barcha QC qarorlar</option>
              <option value="QABUL">QABUL</option>
              <option value="REWORK">REWORK</option>
              <option value="CHIQARISH">CHIQARISH</option>
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="Dan" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="Gacha" />
              <Button onClick={load} size="sm" variant="outline">Filtr</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Pasport topilmadi
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hujjat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Ta'minotchi</TableHead>
                  <TableHead>Shartnoma</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead className="text-right">Og'irlik (kg)</TableHead>
                  <TableHead>Sertifikat</TableHead>
                  <TableHead>QC Qarori</TableHead>
                  <TableHead>O'tkazilgan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-bold text-xs">{p.movement_number ?? `#${p.movement_id}`}</TableCell>
                    <TableCell>{fmtDate(p.arrival_date)}</TableCell>
                    <TableCell>{p.supplier_name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.contract_number ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(p.quantity)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(p.weight_kg)}</TableCell>
                    <TableCell className="text-xs">{p.certificate_number ?? "—"}</TableCell>
                    <TableCell>
                      {p.qc_result ? (
                        <Badge className={QC_RESULT_COLORS[p.qc_result] ?? "bg-gray-500"}>
                          {p.qc_result}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Kutmoqda</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{fmtDate(p.transferred_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
