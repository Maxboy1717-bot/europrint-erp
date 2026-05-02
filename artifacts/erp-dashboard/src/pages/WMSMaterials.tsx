import { useState, useRef } from "react";
import { Material360Card as SharedMaterial360Card } from "@/components/Material360Card";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package, Warehouse, DollarSign, AlertTriangle, Search, ArrowLeft,
  Plus, Pencil, MoreVertical, Archive, BarChart2,
} from "lucide-react";
import { fmtNum, fmtQty, fmtMoney, StockStatusBadge, AbcBadge } from "@/components/wms/helpers";
import { MaterialDialog, type MaterialRecord } from "@/components/wms/MaterialDialog";
import { BasicTab, StockTab, MovementsTab, FinanceTab, SuppliersTab, ProductionTab, QualityTab, ForecastTab, StorageTab, InventoryTab } from "@/components/wms/MaterialTabs";
import type { MaterialBasic } from "@/components/wms/wms-types";

interface MaterialsListResponse {
  data: MaterialRecord[];
  summary: {
    totalMaterials: number;
    criticalCount: number;
    zeroCount: number;
    lowCount: number;
    totalStockValue: number;
  };
}

function KpiCard({ icon: Icon, label, value, color = "text-primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CATEGORIES = [
  { value: "all", label: "Barcha kategoriya" },
  { value: "qogoz", label: "Qog'oz" },
  { value: "karton", label: "Karton" },
  { value: "boyoq", label: "Bo'yoq" },
  { value: "plyonka", label: "Plyonka" },
  { value: "kimyoviy", label: "Kimyoviy" },
  { value: "ehtiyot", label: "Ehtiyot qism" },
  { value: "tayyor", label: "Tayyor mahsulot" },
  { value: "boshqa", label: "Boshqa" },
];

export default function WMSMaterials() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<MaterialRecord | null>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(v), 350);
  };

  const queryParams = new URLSearchParams({
    limit: "100",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category && category !== "all" ? { category } : {}),
    ...(stockStatus && stockStatus !== "all" ? { stock_status: stockStatus } : {}),
  });

  const { data, isLoading } = useQuery<MaterialsListResponse>({
    queryKey: ["/api/inventory/materials", debouncedSearch, category, stockStatus],
    queryFn: () => apiRequest("GET", `/api/inventory/materials?${queryParams}`),
    enabled: !params.id,
  });

  const { data: detail360Data } = useQuery<{ basic: MaterialBasic & { id?: number; minStock?: number; materialType?: string; abcSegment?: string; shelfLifeDays?: number | null } }>({
    queryKey: ["/api/inventory/materials", params.id, "360-card"],
    enabled: !!params.id,
  });

  const materials = data?.data || [];
  const summary = data?.summary || {} as MaterialsListResponse["summary"];

  if (params.id) {
    const basicInfo = detail360Data?.basic;
    const materialForEdit: MaterialRecord | null = basicInfo ? {
      id: basicInfo.id != null ? String(basicInfo.id) : "",
      kod: basicInfo.kod ?? "",
      xomAshyo: basicInfo.xomAshyo ?? "",
      xomAshyoRu: basicInfo.xomAshyoRu,
      category: basicInfo.category || "qogoz",
      unitOfMeasure: basicInfo.unitOfMeasure ?? "",
      formatA: basicInfo.formatA != null ? String(basicInfo.formatA) : null,
      formatB: basicInfo.formatB != null ? String(basicInfo.formatB) : null,
      grammage: basicInfo.grammage != null ? String(basicInfo.grammage) : null,
      minStock: basicInfo.minStock != null ? String(basicInfo.minStock) : "",
      maxStock: basicInfo.maxStock != null ? String(basicInfo.maxStock) : "",
      materialType: basicInfo.materialType || "raw",
      abcSegment: basicInfo.abcSegment || "",
      shelfLifeDays: basicInfo.shelfLifeDays ?? null,
    } : null;

    return (
      <div className="flex flex-col h-full" data-testid="wms-materials-page">
        <SharedMaterial360Card
          materialId={params.id}
          onBack={() => navigate("/inventory/materials")}
          onEdit={materialForEdit ? () => { setEditMaterial(materialForEdit); setDialogOpen(true); } : undefined}
        />
        <MaterialDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditMaterial(null); }}
          editMaterial={editMaterial}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6" data-testid="wms-materials-page">
      <h1 className="text-4xl font-light tracking-tight text-on-surface">
        Materiallar <span className="font-bold text-primary">Ro'yxati</span>
      </h1>

      <div className="flex justify-between items-center -mt-4 gap-4 flex-wrap">
        <p className="text-on-surface-variant">Xom ashyo va materiallar ombor holati</p>
        <Button
          className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          onClick={() => { setEditMaterial(null); setDialogOpen(true); }}
          data-testid="button-add-material"
        >
          <Plus className="w-4 h-4 mr-2" />Material qo'shish
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="Jami material" value={String(summary.totalMaterials || 0)} />
        <KpiCard icon={AlertTriangle} label="Kritik" value={String(summary.criticalCount || 0)} color="text-red-600" />
        <KpiCard icon={Archive} label="Tugagan" value={String(summary.zeroCount || 0)} color="text-muted-foreground" />
        <KpiCard icon={DollarSign} label="Ombor qiymati" value={fmtMoney(summary.totalStockValue)} color="text-green-600" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-material-search"
            placeholder="Qidirish (nom yoki kod)..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]" data-testid="select-category">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockStatus} onValueChange={setStockStatus}>
          <SelectTrigger className="w-[150px]" data-testid="select-stock-status">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holat</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Kam</SelectItem>
            <SelectItem value="critical">Kritik</SelectItem>
            <SelectItem value="zero">Tugagan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {([...Array(8)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">Material topilmadi</p>
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {(["#", "Kod", "Nomi", "Kategoriya", "Birlik", "Mavjud", "Min zaxira", "ABC", "Holat", ""]).map(h => (
                  <TableHead key={h} className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(materials) ? materials : []).map((m: MaterialRecord, idx: number) => (
                <TableRow
                  key={m.id}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => navigate(`/inventory/materials/${m.id}`)}
                  data-testid={`row-material-${m.id}`}
                >
                  <TableCell className="px-4 text-on-surface-variant text-sm">{idx + 1}</TableCell>
                  <TableCell className="px-4">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-on-surface">{m.kod}</span>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-on-surface">{m.xomAshyo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-on-surface-variant">{m.category || "—"}</TableCell>
                  <TableCell className="px-4 text-on-surface-variant">{m.unitOfMeasure}</TableCell>
                  <TableCell className="px-4 text-right font-medium text-on-surface">{fmtQty(m.currentStock, m.unitOfMeasure)}</TableCell>
                  <TableCell className="px-4 text-right text-on-surface-variant text-sm">
                    {m.minStock != null && m.minStock !== "" ? fmtQty(m.minStock, m.unitOfMeasure) : "—"}
                  </TableCell>
                  <TableCell className="px-4"><AbcBadge segment={m.abcSegment} /></TableCell>
                  <TableCell className="px-4"><StockStatusBadge status={m.stockStatus || "normal"} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} data-testid={`button-actions-${m.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Harakatlar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/inventory/materials/${m.id}`)} data-testid={`action-view-360-${m.id}`}>
                          <BarChart2 className="w-4 h-4 mr-2" />360° karta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setEditMaterial(m); setDialogOpen(true); }} data-testid={`action-edit-${m.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />Tahrirlash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MaterialDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditMaterial(null); }}
        editMaterial={editMaterial}
      />
    </div>
  );
}
