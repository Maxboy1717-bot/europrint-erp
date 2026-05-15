/**
 * @module WMSMaterials
 * @description React page component. Route-level UI.
 */

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

import { useTranslation } from '@/lib/i18n';
import { EPPageHeader } from "@/components/ep";
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

export default function WMSMaterials() {
  const { t } = useTranslation('common');
  const { t: tWms } = useTranslation('wms');
  const CATEGORIES = [
    { value: "all", label: tWms("categoryAll") },
    { value: "qogoz", label: tWms("categoryPaper") },
    { value: "karton", label: tWms("categoryCardboard") },
    { value: "boyoq", label: tWms("categoryPaint") },
    { value: "plyonka", label: tWms("categoryFilm") },
    { value: "kimyoviy", label: tWms("categoryChemical") },
    { value: "ehtiyot", label: tWms("categorySpare") },
    { value: "tayyor", label: tWms("categoryFinished") },
    { value: "boshqa", label: tWms("categoryOther") },
  ];
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
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="wms-materials-page">
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
    <div className="space-y-6" data-testid="wms-materials-page">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("materiallarRoyxati")}</b></>}
        title={t("materiallarRoyxati")}
      />

      <div className="flex justify-between items-center -mt-4 gap-4 flex-wrap">
        <p className="text-muted-foreground">{t("xomAshyoVaMateriallarOmbor")}</p>
        <Button
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          onClick={() => { setEditMaterial(null); setDialogOpen(true); }}
          data-testid="button-add-material"
        >
          <Plus className="w-4 h-4 mr-2" />{t("materialQoshish")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label={t('jamiMaterial')} value={String(summary.totalMaterials || 0)} />
        <KpiCard icon={AlertTriangle} label={t("kritik")} value={String(summary.criticalCount || 0)} color="text-[var(--ep-red)]" />
        <KpiCard icon={Archive} label={t("tugagan")} value={String(summary.zeroCount || 0)} color="text-muted-foreground" />
        <KpiCard icon={DollarSign} label={t("omborQiymati")} value={fmtMoney(summary.totalStockValue)} color="text-[var(--ep-green)]" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-material-search"
            placeholder={tWms("searchByNameOrCode")}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-category">
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockStatus} onValueChange={setStockStatus}>
          <SelectTrigger className="w-full sm:w-[150px] h-9" data-testid="select-stock-status">
            <SelectValue placeholder={t("status28")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("barchaHolat")}</SelectItem>
            <SelectItem value="normal">{t("normal")}</SelectItem>
            <SelectItem value="low">{t("kam")}</SelectItem>
            <SelectItem value="critical">{t("kritik")}</SelectItem>
            <SelectItem value="zero">{t("tugagan")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {([...Array(8)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-[13px] text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">{t("materialTopilmadi")}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                {(["#", tWms("headerCode"), tWms("headerName"), tWms("headerCategory"), tWms("headerUnit"), tWms("headerAvailable"), tWms("headerMinStock"), "ABC", tWms("headerStatus"), ""]).map(h => (
                  <TableHead key={h} className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(materials) ? materials : []).map((m: MaterialRecord, idx: number) => (
                <TableRow
                  key={m.id}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/inventory/materials/${m.id}`)}
                  data-testid={`row-material-${m.id}`}
                >
                  <TableCell className="px-4 text-muted-foreground text-sm">{idx + 1}</TableCell>
                  <TableCell className="px-4">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{m.kod}</span>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{m.xomAshyo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">{m.category || "—"}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">{m.unitOfMeasure}</TableCell>
                  <TableCell className="px-4 text-right font-medium text-foreground">{fmtQty(m.currentStock, m.unitOfMeasure)}</TableCell>
                  <TableCell className="px-4 text-right text-muted-foreground text-sm">
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
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/inventory/materials/${m.id}`)} data-testid={`action-view-360-${m.id}`}>
                          <BarChart2 className="w-4 h-4 mr-2" />{tWms("card360")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setEditMaterial(m); setDialogOpen(true); }} data-testid={`action-edit-${m.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />{t("edit")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
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
