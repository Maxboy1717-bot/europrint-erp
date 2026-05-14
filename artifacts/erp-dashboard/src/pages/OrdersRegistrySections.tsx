/**
 * @module OrdersRegistrySections
 * @description Header, stats cards, filters, and table sections for OrdersRegistry.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageState } from "@/components/ui/page-state";
import { FileText, Plus, RefreshCw, Search, Eye } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  OrdersRegistryEntry, CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS,
  STATUS_LABELS, STATUS_COLORS, Category,
} from "./OrdersRegistryTypes";

// ─── Page Header ──────────────────────────────────────────────────────────────

interface OrdersHeaderProps {
  canCreate: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export function OrdersHeader({canCreate, onRefresh, onAdd }: OrdersHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[var(--ep-blue)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Buyruqlar Registri</h1>
          <p className="text-sm text-muted-foreground">Markazlashgan rasmiy hujjatlar boshqaruvi</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
        </Button>
        {canCreate && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Yangi buyruq
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Category Stats ───────────────────────────────────────────────────────────

interface CategoryStatsProps {
  statsByCategory: Record<string, number>;
  filterCategory: string;
  onFilterChange: (cat: string) => void;
}

export function CategoryStats({ statsByCategory, filterCategory, onFilterChange }: CategoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-5 gap-3">
      {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => (
        <Card
          key={c}
          className={`p-3 cursor-pointer transition-all ${filterCategory === c ? "ring-2 ring-primary" : "hover:border-primary"}`}
          onClick={() => onFilterChange(filterCategory === c ? "all" : c)}
        >
          <div className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block mb-2 ${CATEGORY_COLORS[c]}`}>{c}</div>
          <p className="text-2xl font-bold">{statsByCategory[c]}</p>
          <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[c]}</p>
        </Card>
      ))}
    </div>
  );
}

// ─── Filters Bar ──────────────────────────────────────────────────────────────

interface OrdersFiltersProps {
  search: string;
  filterCategory: string;
  filterYear: string;
  filterStatus: string;
  years: string[];
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function OrdersFilters({ search, filterCategory, filterYear, filterStatus, years, onSearchChange, onCategoryChange, onYearChange, onStatusChange, }: OrdersFiltersProps) {
  const { t } = useTranslation('common');
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs">Qidirish</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Sarlavha bo'yicha qidirish..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 min-w-[140px]">
            <Label className="text-xs">Kategoriya</Label>
            <Select value={filterCategory} onValueChange={onCategoryChange}>
              <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => (
                  <SelectItem key={c} value={c}>{c} — {CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-[120px]">
            <Label className="text-xs">Yil</Label>
            <Select value={filterYear || "all"} onValueChange={(v) => onYearChange(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {(Array.isArray(years) ? years : []).map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-[140px]">
            <Label className="text-xs">{t('status17')}</Label>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                <SelectItem value="expired">Muddati o'tgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

interface OrdersTableProps {
  entries: OrdersRegistryEntry[];
  total: number | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onView: (id: number) => void;
}

export function OrdersTable({ entries, total, isLoading, isError, onRetry, onView }: OrdersTableProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base">
          Buyruqlar ro'yxati
          {total !== undefined && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({total} ta)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <PageState
          isLoading={isLoading}
          isError={isError}
          isEmpty={entries.length === 0}
          onRetry={onRetry}
          skeleton="table"
          skeletonRows={5}
          skeletonColumns={6}
          errorTitle="Buyruqlar yuklanmadi"
          errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
          emptyIcon={FileText}
          emptyTitle="Buyruqlar topilmadi"
          emptyDescription="Yangi buyruq qo'shish uchun yuqoridagi 'Qo'shish' tugmasini bosing."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Raqam</TableHead>
                  <TableHead className="w-28">Kategoriya</TableHead>
                  <TableHead>Sarlavha</TableHead>
                  <TableHead className="w-28">Sana</TableHead>
                  <TableHead className="w-28">{"Holat"}</TableHead>
                  <TableHead className="w-16 text-center">Ko'rish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(entries) ? entries : []).map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-medium">{entry.number}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[entry.category as Category] || ""}`}>
                        {CATEGORY_LABELS[entry.category as Category] || entry.category}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2 text-sm">{entry.title}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.issuedDate}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[entry.status] || ""}`}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => onView(entry.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PageState>
      </CardContent>
    </Card>
  );
}
