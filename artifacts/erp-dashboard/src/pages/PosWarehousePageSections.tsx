/** PosWarehousePageSections — inventory table, alerts and history tab sections. */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/lib/i18n';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, AlertTriangle, ArrowUpDown, Building2, History,
} from "lucide-react";
import {
  StockItem,
  Warehouse,
  MovementHistory,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_COLORS,
} from "./PosWarehousePageTypes";

// ── StockTab ──────────────────────────────────────────────────────────

interface StockTabProps {
  isLoading: boolean;
  stockItems: StockItem[];
  warehouses: Warehouse[];
  categories: string[];
  search: string;
  onSearchChange: (value: string) => void;
  warehouseFilter: string;
  onWarehouseFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onlyAvailable: boolean;
  onToggleOnlyAvailable: () => void;
  onQuickIssue: (item: StockItem) => void;
}

export function StockTab({isLoading,
  stockItems,
  warehouses,
  categories,
  search,
  onSearchChange,
  warehouseFilter,
  onWarehouseFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onlyAvailable,
  onToggleOnlyAvailable,
  onQuickIssue,
}: StockTabProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("materialKodNomYokiBarcode")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={warehouseFilter} onValueChange={onWarehouseFilterChange}>
          <SelectTrigger className="w-44 h-9">
            <Building2 className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder={t("ombor")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("barchaOmborlar")}</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("barcha")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onToggleOnlyAvailable}>
          {onlyAvailable ? "Faqat mavjud" : "Hammasi"}
        </Button>
      </div>

      {/* Stock table */}
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Material')}</TableHead>
                <TableHead>{t("ombor")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">Min/Max</TableHead>
                <TableHead className="text-right">{t("price")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead className="text-right">{t("amal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">
                    {t("Yuklanmoqda...")}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && stockItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">
                    {t("hechNarsaTopilmadi")}
                  </TableCell>
                </TableRow>
              )}
              {stockItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="font-medium text-sm">{item.materialName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.materialCode} · {item.category}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.warehouseCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(item.available).toLocaleString("uz-UZ")} {item.unit}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {Number(item.minStock).toFixed(0)}/{Number(item.maxStock).toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {Number(item.unitPrice).toLocaleString("uz-UZ")} {item.currency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STOCK_STATUS_COLORS[item.stockStatus]}
                      className="text-xs"
                    >
                      {STOCK_STATUS_LABELS[item.stockStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onQuickIssue(item)}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                      {t("movement")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── AlertsTab ─────────────────────────────────────────────────────────

interface AlertsTabProps {
  alerts: StockItem[];
}

export function AlertsTab({ alerts }: AlertsTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
          {t("stokOgohlantirishlari")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("hechQandayOgohlantirishYoq")}
          </p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"Material"}</TableHead>
                <TableHead>{t("ombor")}</TableHead>
                <TableHead className="text-right">{t("mavjud")}</TableHead>
                <TableHead className="text-right">{t("min1")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-sm">
                    {a.materialName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.warehouseCode}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(a.available).toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Number(a.minStock).toFixed(0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STOCK_STATUS_COLORS[a.stockStatus]}>
                      {STOCK_STATUS_LABELS[a.stockStatus]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ── HistoryTab ────────────────────────────────────────────────────────

interface HistoryTabProps {
  history: MovementHistory[];
}

export function HistoryTab({ history }: HistoryTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          {t("oxirgi20Movement")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tur")}</TableHead>
              <TableHead>{"Material"}</TableHead>
              <TableHead className="text-right">{t("quantity")}</TableHead>
              <TableHead>{t("foydalanuvchi")}</TableHead>
              <TableHead>{t("sabab")}</TableHead>
              <TableHead className="text-right">{t("date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {h.movementType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{h.materialName}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(h.quantity).toFixed(2)} {h.unit}
                </TableCell>
                <TableCell className="text-xs">
                  {h.performedByName ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {h.reason ?? "—"}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString("uz-UZ", {
                    timeStyle: "short",
                    dateStyle: "short",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
