/**
 * @module MaterialsAccountingPanels
 * @description Order consumption and inventory valuation panels for MaterialsAccounting page.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ChevronDown, ChevronRight, Layers, FileSpreadsheet } from "lucide-react";
import type { InventoryValuationData, OrderConsumption } from "./MaterialsAccountingTypes";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// Order Consumption Card
// ---------------------------------------------------------------------------

interface OrderConsumptionCardProps {
  orderConsumptions: OrderConsumption[];
  expandedOrders: Set<string>;
  onToggleOrder: (orderId: string) => void;
}

export function OrderConsumptionCard({orderConsumptions,
  expandedOrders,
  onToggleOrder,
}: OrderConsumptionCardProps) {
  const { t } = useTranslation('common');
  return (
    <Card data-testid="card-by-order">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t("buyurtmaBoyichaSarflar")}
        </CardTitle>
        <CardDescription>{t("buyurtmalargaSarflanganMateriallar")}</CardDescription>
      </CardHeader>
      <CardContent>
        {orderConsumptions.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t("buyurtmaMalumotlariMavjudEmas")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(orderConsumptions) ? orderConsumptions : []).map((order) => (
              <Collapsible key={order.orderId} open={expandedOrders.has(order.orderId)}>
                <CollapsibleTrigger asChild>
                  <div
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate cursor-pointer"
                    onClick={() => onToggleOrder(order.orderId)}
                    data-testid={`row-order-${order.orderId}`}
                  >
                    <div className="flex items-center gap-3">
                      {expandedOrders.has(order.orderId) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalValue)}</p>
                      <p className="text-xs text-muted-foreground">{order.materialsCount} ta material</p>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {order.materials && order.materials.length > 0 && (
                    <div className="ml-6 mt-2 p-3 rounded-lg bg-muted/50 border">
                      <div className="ep-table-scroll"><Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                          <TableRow>
                            <TableHead>{t("code")}</TableHead>
                            <TableHead>{t('Material')}</TableHead>
                            <TableHead className="text-right">{t("quantity")}</TableHead>
                            <TableHead className="text-right">{t("price")}</TableHead>
                            <TableHead className="text-right">{t("total")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(order.materials) ? order.materials : []).map((mat, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="text-xs">{mat.materialCode}</TableCell>
                              <TableCell className="text-xs">{mat.materialName}</TableCell>
                              <TableCell className="text-xs text-right">{formatNumber(mat.quantity)}</TableCell>
                              <TableCell className="text-xs text-right">{formatCurrency(mat.unitCost)}</TableCell>
                              <TableCell className="text-xs text-right font-medium">{formatCurrency(mat.totalCost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table></div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inventory Valuation Card
// ---------------------------------------------------------------------------

interface InventoryValuationCardProps {
  inventoryData: InventoryValuationData | undefined;
  inventoryLoading: boolean;
}

export function InventoryValuationCard({ inventoryData, inventoryLoading }: InventoryValuationCardProps) {
  return (
    <Card data-testid="card-inventory-valuation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {t("inventarBaholash")}
        </CardTitle>
        <CardDescription>{t("hozirgiZaxiraQiymati")}</CardDescription>
      </CardHeader>
      <CardContent>
        {inventoryLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !inventoryData?.materials || inventoryData.materials.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t("inventarMalumotlariMavjudEmas")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-80">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>{"Material"}</TableHead>
                    <TableHead>{t("ombor")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead className="text-right">{t("price")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(inventoryData?.materials) ? inventoryData.materials : [])
                    .slice(0, 15)
                    .map((item) => (
                      <TableRow key={item.id} data-testid={`row-inventory-${item.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.warehouseName || "-"}</TableCell>
                        <TableCell className="text-right text-sm">
                          {formatNumber(item.currentStock)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(item.totalValue)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("jamiTurlar")}</span>
                <span className="font-medium">{formatNumber(inventoryData.summary.totalItems)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("jamiZaxira")}</span>
                <span className="font-medium">{formatNumber(inventoryData.summary.totalStock)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{t("jamiQiymat")}</span>
                <span className="text-[var(--ep-yellow)]">{formatCurrency(inventoryData.summary.totalValue)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
