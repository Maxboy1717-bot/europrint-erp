/**
 * WarehouseBarcodeQueue.tsx
 * ERP — Auto-generated barkodlar navbati va chop etish.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Printer, Barcode, Search } from "lucide-react";

interface BarcodeItem {
  id: number;
  barcode: string;
  barcode_type: string;
  batch_number: string | null;
  quantity: number | null;
  unit: string | null;
  material_card_id: number | null;
  warehouse_id: number | null;
  movement_id: number | null;
  status: string;
  printed_at: string | null;
  created_at: string;
}

export default function WarehouseBarcodeQueue() {
  const [items, setItems] = useState<BarcodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      // GET all barcodes from print queue (faqat oxirgi 500)
      // Backend endpoint: GET /api/pos/wh-features/movement/{id}/barcodes — bitta movement uchun
      // Bu yerda biz hammasini olishimiz kerak, lekin hozir bitta umumiy endpoint yo'q,
      // shu sababli oxirgi movementlardan olamiz
      const movements = await apiRequest<{ id: number }[]>("GET", "/api/pos/movements?limit=50").catch(() => []);
      const allBarcodes: BarcodeItem[] = [];
      for (const m of (movements ?? []).slice(0, 20)) {
        try {
          const bcs = await apiRequest<BarcodeItem[]>("GET", `/api/pos/wh-features/movement/${m.id}/barcodes`);
          if (Array.isArray(bcs)) allBarcodes.push(...bcs);
        } catch { /* skip */ }
      }
      // Sort by created_at DESC
      allBarcodes.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      setItems(allBarcodes);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = items.filter(b => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.barcode.toLowerCase().includes(q)
          || (b.batch_number ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: items.length,
    queued: items.filter(b => b.status === "QUEUED").length,
    printed: items.filter(b => b.status === "PRINTED").length,
  };

  function toggleSelect(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.id)));
  }

  function printSelected() {
    if (selected.size === 0) { alert("Birorta barkod tanlanmagan"); return; }
    // Bu yerda haqiqiy printer drayveri chaqirilishi kerak (ZPL/EPL/PDF)
    // Hozircha — yangi tab da PDF page ochiladi
    const ids = Array.from(selected).join(",");
    alert(`${selected.size} ta barkod chop etishga yuborildi (id=${ids})\n\nProduktsiya printer integratsiyasi sozlanishi kerak.`);
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <Barcode className="h-8 w-8 text-[var(--ep-blue)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">BARKOD CHOP ETISH NAVBATI</div>
          <h1 className="text-2xl font-bold">Auto-yaratilgan barkodlar</h1>
          <p className="text-sm text-gray-500">EXTERNAL_IN harakatlari uchun avtomatik yaratilgan CODE128 barkodlari</p>
        </div>
        <Button onClick={load} variant="outline">🔄 Yangilash</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-6">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Jami barkodlar</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-3xl font-bold text-[var(--ep-yellow)]">{stats.queued}</div>
          <div className="text-xs text-gray-500">Chop etishga kutmoqda</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-3xl font-bold text-[var(--ep-green)]">{stats.printed}</div>
          <div className="text-xs text-gray-500">Chop etilgan</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Barkod yoki partiya qidirish..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded text-sm"
            >
              <option value="all">Barchasi</option>
              <option value="QUEUED">Kutmoqda</option>
              <option value="PRINTED">Chop etilgan</option>
            </select>
            <Button
              onClick={printSelected}
              disabled={selected.size === 0}
              className="bg-blue-600 hover:bg-[var(--ep-blue)]/90"
            >
              <Printer className="h-4 w-4 mr-1" />
              Tanlangan ({selected.size}) chop etish
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Barcode className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Barkodlar yo'q
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Partiya</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead>Birlik</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className={selected.has(b.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(b.id)}
                        onChange={() => toggleSelect(b.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">{b.barcode}</TableCell>
                    <TableCell><Badge variant="outline">{b.barcode_type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{b.batch_number ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{b.quantity ?? "—"}</TableCell>
                    <TableCell>{b.unit ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={b.status === "PRINTED" ? "bg-emerald-500" : "bg-amber-500"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {b.created_at ? new Date(b.created_at).toLocaleString("uz-UZ") : "—"}
                    </TableCell>
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
