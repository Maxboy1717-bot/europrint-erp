/**
 * @module POSInventoryPageSections
 * @description Major section components for POSInventoryPage:
 * movements table, products table, and low-stock cards.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";

import {
  Package, AlertTriangle,
  ArrowUpCircle,
  RefreshCw, Search,
} from "lucide-react";

import {
  PosProduct,
  InventoryMovement,
  TYPE_LABELS,
  MOVEMENT_FILTER_OPTIONS,
  formatUZS,
} from "./POSInventoryPageTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Movements Tab ────────────────────────────────────────────────────────────

interface MovementsTabProps {
  movements: InventoryMovement[];
  isLoading: boolean;
  movementFilter: string;
  onFilterChange: (val: string) => void;
}

export function MovementsTab({ movements, isLoading, movementFilter, onFilterChange }: MovementsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="movements" className="m-0 p-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(MOVEMENT_FILTER_OPTIONS as readonly string[]).map(t => (
          <Button
            key={t}
            variant={movementFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(t)}
          >
            {t === "" ? "Barchasi" : TYPE_LABELS[t]?.label ?? t}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />{t("Yuklanmoqda...")}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <List className="h-10 w-10 mb-2" />
              <p>{t("harakatlarYoq")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Mahsulot")}</TableHead>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("oldin")}</TableHead>
                  <TableHead className="text-right">{t("keyin")}</TableHead>
                  <TableHead>{t("sabab")}</TableHead>
                  <TableHead>{t("kim1")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(movements) ? movements : []).map(m => {
                  const typeInfo = TYPE_LABELS[m.type] ?? { label: m.type, color: "text-gray-600" };
                  const qty = Number(m.quantity);
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{m.product_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.product_barcode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${qty >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                        {qty >= 0 ? "+" : ""}{qty}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">{m.before_qty ?? "—"}</TableCell>
                      <TableCell className="text-right">{m.after_qty ?? "—"}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-32 truncate">{m.reason ?? "—"}</TableCell>
                      <TableCell className="text-sm">{m.performed_by_name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(m.created_at).toLocaleString("uz-UZ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

interface ProductsTabProps {
  products: PosProduct[];
  isLoading: boolean;
  productSearch: string;
  onSearchChange: (val: string) => void;
  onAdjustProduct: (product: PosProduct) => void;
}

export function ProductsTab({
  products,
  isLoading,
  productSearch,
  onSearchChange,
  onAdjustProduct,
}: ProductsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="products" className="m-0 p-4 space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("mahsulotQidirish")}
          value={productSearch}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />{t("Yuklanmoqda...")}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Mahsulot")}</TableHead>
                  <TableHead>{t("barcode2")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{t("price")}</TableHead>
                  <TableHead className="text-right">{t("qoldiq")}</TableHead>
                  <TableHead className="text-right">{t("min1")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(products) ? products : []).map(product => {
                  const stock = Number(product.stockQuantity ?? 0);
                  const minStock = Number(product.minStock ?? 0);
                  const isLow = stock <= minStock;
                  return (
                    <TableRow key={product.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell>{product.category ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatUZS(Number(product.unitPrice))}</TableCell>
                      <TableCell className={`text-right font-bold ${isLow ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                        {stock} {product.unit}
                      </TableCell>
                      <TableCell className="text-right text-gray-400">{minStock}</TableCell>
                      <TableCell>
                        {!product.isActive ? (
                          <EPStatusPill tone="neutral">{t("inactive")}</EPStatusPill>
                        ) : isLow ? (
                          <EPStatusPill tone="danger">{t("kam")}</EPStatusPill>
                        ) : (
                          <Badge variant="outline" className="text-[var(--ep-green)]">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAdjustProduct(product)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Low Stock Tab ────────────────────────────────────────────────────────────

interface LowStockTabProps {
  lowStock: PosProduct[];
  onAdjustProduct: (product: PosProduct, type: string) => void;
}

export function LowStockTab({ lowStock, onAdjustProduct }: LowStockTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="low-stock" className="m-0 p-4">
      {lowStock.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-gray-400">
          <Package className="h-12 w-12 mb-3 text-green-400" />
          <p className="text-lg font-medium text-[var(--ep-green)]">{t("barchaMahsulotlarYetarli")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{lowStock.length} ta mahsulot minimal qoldiqdan kam yoki teng</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(lowStock) ? lowStock : []).map(product => {
              const stock = Number(product.stockQuantity ?? 0);
              const minStock = Number(product.minStock ?? 0);
              const pct = minStock > 0 ? Math.min(100, (stock / minStock) * 100) : 0;
              return (
                <Card key={product.id} className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.barcode}</p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-[var(--ep-red)] flex-shrink-0" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("mavjud1")}</span>
                        <span className="font-bold text-[var(--ep-red)]">{stock} {product.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("minimal")}</span>
                        <span>{minStock} {product.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-red-300 text-[var(--ep-red)] hover:bg-red-100"
                      onClick={() => onAdjustProduct(product, "in")}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-1" />
                      {t("kirimQoshish")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </TabsContent>
  );
}


