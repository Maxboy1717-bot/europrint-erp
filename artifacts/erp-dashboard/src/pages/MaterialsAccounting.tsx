import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Package, 
  TrendingUp,
  TrendingDown,
  Warehouse,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface MaterialMovement {
  id: string;
  moveNumber: string;
  moveDate: string;
  moveType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
  warehouseName: string;
  materialCode?: string;
  materialName?: string;
  batchLot?: string;
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitPrice: number;
  totalValue: number;
  warehouseName: string;
}

interface InventoryValuationData {
  materials: InventoryItem[];
  summary: {
    totalItems: number;
    totalStock: number;
    totalValue: number;
  };
}

interface OrderConsumption {
  orderId: string;
  orderNumber: string;
  customerName: string;
  materialsCount: number;
  totalValue: number;
  materials?: {
    materialCode: string;
    materialName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
}


export default function MaterialsAccounting() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [moveTypeFilter, setMoveTypeFilter] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: movements = [], isLoading: movementsLoading, refetch: refetchMovements, isError} = useQuery<MaterialMovement[]>({
    queryKey: ["/api/accounting/materials", { startDate, endDate, moveType: moveTypeFilter !== "all" ? moveTypeFilter : undefined }],
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery<InventoryValuationData>({
    queryKey: ["/api/accounting/inventory-valuation"],
  });

  const { data: orderConsumptions = [] } = useQuery<OrderConsumption[]>({
    queryKey: ["/api/accounting/materials/by-order"],
  });

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getMoveTypeBadge = (moveType: string) => {
    switch (moveType?.toLowerCase()) {
      case "in":
      case "receipt":
      case "kirim":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">Kirim</Badge>;
      case "out":
      case "issue":
      case "chiqim":
        return <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/40">Chiqim</Badge>;
      case "transfer":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">O'tkazma</Badge>;
      case "adjustment":
        return <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/40">Tuzatish</Badge>;
      default:
        return <Badge variant="outline">{moveType}</Badge>;
    }
  };

  const totalInventoryValue = inventoryData?.summary?.totalValue || 0;
  
  const monthlyConsumed = movements
    .filter(m => m.moveType?.toLowerCase() === "out" || m.moveType?.toLowerCase() === "issue" || m.moveType?.toLowerCase() === "chiqim")
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);
    
  const monthlyReceived = movements
    .filter(m => m.moveType?.toLowerCase() === "in" || m.moveType?.toLowerCase() === "receipt" || m.moveType?.toLowerCase() === "kirim")
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  const turnoverRate = totalInventoryValue > 0 ? ((monthlyConsumed / totalInventoryValue) * 12).toFixed(2) : "0.00";

  const handleApplyFilters = () => {
    refetchMovements();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMoveTypeFilter("all");
  };

  if (isError) {
    return <ErrorState onRetry={refetchMovements} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="materials-accounting-page">
      <div className="border-b bg-gradient-to-r from-yellow-600 to-yellow-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Warehouse className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Materiallar Hisobi</h1>
                <p className="text-yellow-100 text-sm">Ombor buxgalteri - Material harakatlari va inventar</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
              onClick={() => refetchMovements()}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-inventory">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Inventar Qiymati</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-yellow-500">
                    {formatCurrency(totalInventoryValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(inventoryData?.summary?.totalItems || 0)} turdagi material
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-consumed">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sarflangan (bu oy)</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-500">
                    {formatCurrency(monthlyConsumed)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chiqim operatsiyalari
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-received">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qabul qilingan (bu oy)</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(monthlyReceived)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kirim operatsiyalari
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-turnover">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aylanma Tezligi</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {movementsLoading || inventoryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-500">
                    {turnoverRate}x
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Yillik aylanma koeffitsienti
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-movements">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Material Harakatlari
                </CardTitle>
                <CardDescription>Kirim va chiqim operatsiyalari</CardDescription>
              </div>
              
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Boshlanish sanasi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36"
                    data-testid="input-start-date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Tugash sanasi</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36"
                    data-testid="input-end-date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Harakat turi</Label>
                  <Select value={moveTypeFilter} onValueChange={setMoveTypeFilter}>
                    <SelectTrigger className="w-32" data-testid="select-move-type">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="in">Kirim</SelectItem>
                      <SelectItem value="out">Chiqim</SelectItem>
                      <SelectItem value="transfer">O'tkazma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={handleApplyFilters} data-testid="button-apply-filter">
                  <Filter className="h-4 w-4 mr-1" />
                  Qo'llash
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearFilters} data-testid="button-clear-filter">
                  Tozalash
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="space-y-2">
                {([...Array(5)]).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Hozircha material harakatlari yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Hujjat №</TableHead>
                      <TableHead>Material Kodi</TableHead>
                      <TableHead>Material Nomi</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead className="text-right">Narx</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead>Partiya</TableHead>
                      <TableHead>Referans</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(movements) ? movements : []).map((move) => (
                      <TableRow key={move.id} data-testid={`row-movement-${move.id}`}>
                        <TableCell>{formatDate(move.moveDate)}</TableCell>
                        <TableCell className="font-medium">{move.moveNumber}</TableCell>
                        <TableCell>{move.materialCode || "-"}</TableCell>
                        <TableCell>{move.materialName || "-"}</TableCell>
                        <TableCell>{getMoveTypeBadge(move.moveType)}</TableCell>
                        <TableCell className="text-right">{formatNumber(move.quantity)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(move.unitCost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(move.totalCost)}</TableCell>
                        <TableCell>{move.batchLot || "-"}</TableCell>
                        <TableCell>{move.reference || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="card-by-order">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Buyurtma bo'yicha Sarflar
              </CardTitle>
              <CardDescription>Buyurtmalarga sarflangan materiallar</CardDescription>
            </CardHeader>
            <CardContent>
              {orderConsumptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Buyurtma ma'lumotlari mavjud emas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(orderConsumptions) ? orderConsumptions : []).map((order) => (
                    <Collapsible key={order.orderId} open={expandedOrders.has(order.orderId)}>
                      <CollapsibleTrigger asChild>
                        <div
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate cursor-pointer"
                          onClick={() => toggleOrderExpansion(order.orderId)}
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
                            <p className="text-xs text-muted-foreground">
                              {order.materialsCount} ta material
                            </p>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {order.materials && order.materials.length > 0 && (
                          <div className="ml-6 mt-2 p-3 rounded-lg bg-muted/50 border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Kod</TableHead>
                                  <TableHead>Material</TableHead>
                                  <TableHead className="text-right">Miqdor</TableHead>
                                  <TableHead className="text-right">Narx</TableHead>
                                  <TableHead className="text-right">Jami</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(Array.isArray(order.materials) ? order.materials : []).map((mat, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-xs">{mat.materialCode}</TableCell>
                                    <TableCell className="text-xs">{mat.materialName}</TableCell>
                                    <TableCell className="text-xs text-right">{formatNumber(mat.quantity)}</TableCell>
                                    <TableCell className="text-xs text-right">{formatCurrency(mat.unitCost)}</TableCell>
                                    <TableCell className="text-xs text-right font-medium">{formatCurrency(mat.totalCost)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-inventory-valuation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Inventar Baholash
              </CardTitle>
              <CardDescription>Hozirgi zaxira qiymati</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-2">
                  {([...Array(5)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : !inventoryData?.materials || inventoryData.materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Inventar ma'lumotlari mavjud emas</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Ombor</TableHead>
                          <TableHead className="text-right">Miqdor</TableHead>
                          <TableHead className="text-right">Narx</TableHead>
                          <TableHead className="text-right">Jami</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(inventoryData?.materials) ? inventoryData.materials : []).slice(0, 15).map((item) => (
                          <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
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
                      <span className="text-muted-foreground">Jami turlar:</span>
                      <span className="font-medium">{formatNumber(inventoryData.summary.totalItems)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jami zaxira:</span>
                      <span className="font-medium">{formatNumber(inventoryData.summary.totalStock)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Jami qiymat:</span>
                      <span className="text-yellow-500">{formatCurrency(inventoryData.summary.totalValue)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
