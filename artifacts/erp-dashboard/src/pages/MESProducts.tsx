/**
 * @module MESProducts
 * @description React page component. Route-level UI.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, CheckCircle, XCircle, Plus, ToggleLeft, ToggleRight, ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ecommerceApi } from "@/lib/api/misc";
import { useTranslation } from '@/lib/i18n';
import { exportToCSV, exportToExcel } from "@/lib/export-utils";

interface Product {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  category?: string;
  unit: string;
  standardCost?: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  gofreli: "bg-blue-50 text-[var(--ep-blue)] dark:bg-blue-900/30 dark:text-blue-300",
  quti: "bg-violet-50 text-[var(--ep-purple)] dark:bg-violet-900/30 dark:text-violet-300",
  rulon: "bg-amber-50 text-[var(--ep-yellow)] dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-muted text-muted-foreground",
};

const UNITS = ["dona", "kg", "litr", "m", "m²", "m³", "quti", "rulon", "varaq"];
const CATEGORIES = ["gofreli", "quti", "rulon", "etiket", "lenta", "xaltacha", "other"];

type SortField = "code" | "name" | "nameRu" | "category" | "unit" | "standardCost" | "isActive";
type SortDirection = "asc" | "desc";

export default function MESProducts() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [form, setForm] = useState({
    code: "", name: "", nameRu: "", category: "other",
    unit: "dona", standardCost: "",
  });

  const { data: raw, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const products: Product[] = Array.isArray(raw) ? raw : [];

  const createProductMutation = useMutation({
    mutationFn: (data: typeof form) =>
      ecommerceApi.createProduct({
        ...data,
        standardCost: data.standardCost ? Number(data.standardCost) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCreateOpen(false);
      setForm({ code: "", name: "", nameRu: "", category: "other", unit: "dona", standardCost: "" });
      toast({ title: t("mahsulotYaratildi") });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ecommerceApi.updateProduct(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t("mahsulotHolatiOzgartirildi") });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),
  });

  const filtered = (Array.isArray(products) ? products : []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" || typeof bv === "number") {
        return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
      }
      if (typeof av === "boolean" || typeof bv === "boolean") {
        return (Number(av ?? false) - Number(bv ?? false)) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [filtered, sortField, sortDirection]);

  const active = (Array.isArray(products) ? products : []).filter(p => p.isActive).length;

  const handleExportCsv = () => exportToCSV(sorted as unknown as Record<string, unknown>[], "mes_mahsulotlar", [
    { key: "code", label: t("code") },
    { key: "name", label: t("nomiUz") },
    { key: "nameRu", label: t("nomiRu") },
    { key: "category", label: t("category") },
    { key: "unit", label: t("olchovBirligi") },
    { key: "standardCost", label: t("tannarxSoM") },
    { key: "isActive", label: t("holat") },
  ]);

  const handleExportExcel = () => exportToExcel(sorted as unknown as Record<string, unknown>[], "mes_mahsulotlar", [
    { header: t("code"), accessor: (r) => String(r["code"] ?? "") },
    { header: t("nomiUz"), accessor: (r) => String(r["name"] ?? "") },
    { header: t("nomiRu"), accessor: (r) => String(r["nameRu"] ?? "") },
    { header: t("category"), accessor: (r) => String(r["category"] ?? "") },
    { header: t("olchovBirligi"), accessor: (r) => String(r["unit"] ?? "") },
    { header: t("tannarxSoM"), accessor: (r) => Number(r["standardCost"] ?? 0) },
    { header: t("holat"), accessor: (r) => (r["isActive"] ? t("faolBadge") : t("inactive")) },
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("mahsulotlar")}</h1>
          <p className="text-sm text-muted-foreground">{t("ishlabChiqariladiganMahsulotlarKatalogi")}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="outline" className="gap-1.5">
            <CheckCircle className="w-3 h-3 text-[var(--ep-green)]" /> {active} {t("faolBadge")}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Package className="w-3 h-3 text-muted-foreground" /> {products.length} {t("jamiBadge")}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={sorted.length === 0} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={sorted.length === 0} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t("mahsulotQoshish")}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("nomKodYokiKategoriya")}
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-product-search"
        />
      </div>

      <Card data-testid="card-products-table">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" /> {t("mahsulotlar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {([1,2,3,4,5,6]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 text-[13px] text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? t("qidiruvBoyichaTopilmadi") : t("mahsulotTopilmadi")}</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> {t("mahsulotQoshish")}
              </Button>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("code")} data-testid="th-code">
                    <div className="flex items-center gap-1">{t("code")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")} data-testid="th-name">
                    <div className="flex items-center gap-1">{t("nomiUz")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("nameRu")} data-testid="th-name-ru">
                    <div className="flex items-center gap-1">{t("nomiRu")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("category")} data-testid="th-category">
                    <div className="flex items-center gap-1">{t("category")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("unit")} data-testid="th-unit">
                    <div className="flex items-center gap-1">{t("olchovBirligi")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort("standardCost")} data-testid="th-cost">
                    <div className="flex items-center justify-end gap-1">{t("tannarxSoM")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("isActive")} data-testid="th-status">
                    <div className="flex items-center gap-1">{t("holat")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="text-right">{t("amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(p => (
                  <TableRow key={p.id} className={cn("hover:bg-muted/40 transition-colors", !p.isActive && "opacity-60")} data-testid={`row-product-${p.id}`}>
                    <TableCell className="font-mono font-medium">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.nameRu || "—"}</TableCell>
                    <TableCell>
                      {p.category ? (
                        <Badge className={cn("text-[10px] px-1.5", CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.other)}>
                          {p.category}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-right">{p.standardCost ? Number(p.standardCost).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="outline" className="gap-1 text-[10px] px-1.5">
                          <CheckCircle className="w-2.5 h-2.5 text-[var(--ep-green)]" /> {t("faolBadge")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px] px-1.5">
                          <XCircle className="w-2.5 h-2.5" /> {t("inactive")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleActiveMutation.mutate({ id: p.id, isActive: p.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`button-toggle-${p.id}`}
                      >
                        {p.isActive ? (
                          <><ToggleLeft className="h-3 w-3 mr-1 text-[var(--ep-red)]" /> {t("faolsizlashtirish")}</>
                        ) : (
                          <><ToggleRight className="h-3 w-3 mr-1 text-[var(--ep-green)]" /> {t("faollashtirish")}</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiMahsulotQoshish")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
          <Label>{t("nomiUz")}</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t("mahsulotNomi")} />
              </div>
              <div className="space-y-1">
          <Label>{t("nomiRu")}</Label>
                <Input value={form.nameRu} onChange={e => setForm(p => ({ ...p, nameRu: e.target.value }))} placeholder={t("untitled")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
          <Label>{t("code")}</Label>
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PRD-001" />
              </div>
              <div className="space-y-1">
          <Label>{t("olchovBirligi")}</Label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(UNITS) ? UNITS : []).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
          <Label>{t("category")}</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
          <Label>{t("tannarxSoM")}</Label>
                <Input type="number" value={form.standardCost} onChange={e => setForm(p => ({ ...p, standardCost: e.target.value }))} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => createProductMutation.mutate(form)} disabled={createProductMutation.isPending || !form.name || !form.code}>{t("Saqlash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
