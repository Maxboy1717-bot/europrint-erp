/**
 * @module HRAssetManagementSections
 * @description Reusable section components for the HR Asset Management page:
 * stats summary cards, filter bar, and the main assets data table.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Search, RefreshCw, Filter,
  Eye, UserCheck, RotateCcw, AlertTriangle,
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  Asset, Department,
  CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, STATUS_VARIANTS,
} from "./HRAssetManagementTypes";

// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

interface StatsProps {
  total: number;
  available: number;
  assigned: number;
  broken: number;
}

export function AssetStats({ total, available, assigned, broken }: StatsProps) {
  const { t } = useTranslation("common");
  const cards = [
    { label: "Jami",     value: total,     color: "text-[var(--ep-blue)]",  bg: "bg-blue-50 dark:bg-blue-950/20" },
    { label: "Bo'sh",    value: available, color: "text-[var(--ep-green)]", bg: "bg-green-50 dark:bg-green-950/20" },
    { label: "Berilgan", value: assigned,  color: "text-[var(--ep-yellow)]", bg: "bg-amber-50 dark:bg-amber-950/20" },
    { label: "Muammo",   value: broken,    color: "text-[var(--ep-red)]",   bg: "bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(s => (
        <Card key={s.label} className={`border-border/50 ${s.bg}`}>
          <CardContent className="p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filters bar
// ---------------------------------------------------------------------------

interface FiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterCategory: string;
  onCategoryChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  filterDepartment: string;
  onDepartmentChange: (v: string) => void;
  departments: Department[];
  onRefresh: () => void;
}

export function AssetFilters({
  search, onSearchChange,
  filterCategory, onCategoryChange,
  filterStatus, onStatusChange,
  filterDepartment, onDepartmentChange,
  departments, onRefresh,
}: FiltersProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("nomiYokiSerialRaqamBoyicha")}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={filterCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-40 h-9">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder={t("tur")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaTurlar")}</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-40 h-9">
          <SelectValue placeholder={t("status28")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaHolatlar")}</SelectItem>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-full sm:w-44 h-9">
          <SelectValue placeholder={t("bolim1")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaBolimlar")}</SelectItem>
          {(Array.isArray(departments) ? departments : []).map(d => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assets table
// ---------------------------------------------------------------------------

interface TableProps {
  assets: Asset[];
  isLoading: boolean;
  onDetail: (asset: Asset) => void;
  onAssign: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
  onReport: (asset: Asset) => void;
}

export function AssetTable({
  assets, isLoading, onDetail, onAssign, onReturn, onReport,
}: TableProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("jihoz")}</TableHead>
                <TableHead>{t("serialRaqam")}</TableHead>
                <TableHead>{t("tur")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead>{t("xodim1")}</TableHead>
                <TableHead>{t("berilganSana")}</TableHead>
                <TableHead className="text-right">{t("Amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="hover:bg-muted/40 transition-colors">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full rounded-lg" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[13px] text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>{t("aktivlarTopilmadi")}</p>
                  </TableCell>
                </TableRow>
              )}

              {(Array.isArray(assets) ? assets : []).map(asset => {
                const Icon = CATEGORY_ICONS[asset.category] ?? Package;
                return (
                  <TableRow key={asset.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{asset.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {asset.serial_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{CATEGORY_LABELS[asset.category] ?? asset.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[asset.status] ?? "outline"} className="text-xs">
                        {STATUS_LABELS[asset.status] ?? asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {asset.assigned_employee_name ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {asset.assigned_date
                        ? new Date(asset.assigned_date).toLocaleDateString("uz-UZ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => onDetail(asset)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {asset.status === "available" && (
                          <Button
                            size="sm" variant="ghost" className="text-[var(--ep-blue)]"
                            onClick={() => onAssign(asset)}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {asset.status === "assigned" && (
                          <>
                            <Button
                              size="sm" variant="ghost" className="text-[var(--ep-green)]"
                              onClick={() => onReturn(asset)}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="text-[var(--ep-red)]"
                              onClick={() => onReport(asset)}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
