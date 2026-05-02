import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Calculator,
  Plus,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  RefreshCw,
  CheckCircle,
  Clock,
  Package,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface OrderCosting {
  id: string;
  salesOrderId: string | null;
  productionOrderId: string | null;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  energyCost: number;
  wasteCost: number;
  totalCost: number;
  sellingPrice: number;
  grossProfit: number | null;
  profitMargin: number | null;
  status: string;
  calculatedBy: string | null;
  calculatedAt: string | null;
  createdAt: string;
}

interface OrderCostingLine {
  id: string;
  orderCostingId: string;
  costType: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes: string | null;
}

interface OrderCostingDetail extends OrderCosting {
  lines: OrderCostingLine[];
}

interface SalesOrder {
  id: string;
  documentNumber: string;
  soldToParty: string | null;
  status: string;
}

const costingFormSchema = z.object({
  salesOrderId: z.string().min(1, "Sotish buyurtmasini tanlang"),
  materialCost: z.coerce.number().nonnegative("Material xarajati 0 yoki katta bo'lishi kerak"),
  laborCost: z.coerce.number().nonnegative("Mehnat xarajati 0 yoki katta bo'lishi kerak"),
  overheadCost: z.coerce.number().nonnegative("Ustama xarajat 0 yoki katta bo'lishi kerak"),
  energyCost: z.coerce.number().nonnegative("Energiya xarajati 0 yoki katta bo'lishi kerak"),
  wasteCost: z.coerce.number().nonnegative("Isrof xarajati 0 yoki katta bo'lishi kerak"),
  sellingPrice: z.coerce.number().nonnegative("Sotish narxi 0 yoki katta bo'lishi kerak"),
  status: z.enum(["draft", "calculated", "approved"]).default("draft"),
});

type CostingFormData = z.infer<typeof costingFormSchema>;


function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "%";
}

export default function OrderCosting() {
  const { toast } = useToast();
  const [selectedCosting, setSelectedCosting] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: costings = [], isLoading: costingsLoading, isError, refetch} = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const { data: costingDetail, isLoading: detailLoading } = useQuery<OrderCostingDetail>({
    queryKey: ["/api/order-costing", selectedCosting],
    enabled: !!selectedCosting,
  });

  const { data: salesOrders = [] } = useQuery<SalesOrder[]>({
    queryKey: ["/api/sales-orders"],
  });

  const { data: topProfitable = [] } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-profitable"],
  });

  const { data: topLoss = [] } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-loss"],
  });

  const form = useForm<CostingFormData>({
    resolver: zodResolver(costingFormSchema),
    defaultValues: {
      salesOrderId: "",
      materialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      energyCost: 0,
      wasteCost: 0,
      sellingPrice: 0,
      status: "draft",
    },
  });

  const createCostingMutation = useMutation({
    mutationFn: async (data: CostingFormData) => {
      const res = await apiRequest("POST", "/api/order-costing", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tannarxi yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Buyurtma tannarxini yaratishda xatolik", variant: "destructive" });
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/order-costing/${id}/calculate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing", selectedCosting] });
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tannarxi qayta hisoblandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Hisoblashda xatolik", variant: "destructive" });
    },
  });

  const onSubmit = (data: CostingFormData) => {
    createCostingMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const totalCost = (watchedValues.materialCost || 0) + (watchedValues.laborCost || 0) +
    (watchedValues.overheadCost || 0) + (watchedValues.energyCost || 0) + (watchedValues.wasteCost || 0);
  const grossProfit = (watchedValues.sellingPrice || 0) - totalCost;
  const profitMargin = watchedValues.sellingPrice > 0 ? (grossProfit / watchedValues.sellingPrice) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Qoralama</Badge>;
      case "calculated":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">Hisoblangan</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">Tasdiqlangan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalCostings = costings.length;
  const avgMargin = costings.length > 0
    ? (Array.isArray(costings) ? costings : []).reduce((sum, c) => sum + (c.profitMargin || 0), 0) / costings.length
    : 0;
  const mostProfitable = (Array.isArray(costings) ? costings : []).reduce((max, c) => (c.grossProfit || 0) > (max?.grossProfit || 0) ? c : max, costings[0]);
  const mostLoss = (Array.isArray(costings) ? costings : []).reduce((min, c) => (c.grossProfit || 0) < (min?.grossProfit || Infinity) ? c : min, costings[0]);

  if (selectedCosting && costingDetail) {
    return (
      <div className="min-h-screen bg-background" data-testid="order-costing-detail">
        <div className="border-b bg-gradient-to-r from-green-600 to-green-500 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedCosting(null)}
                className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Buyurtma Tannarxi Tafsiloti</h1>
                <p className="text-green-100 text-sm">
                  {costingDetail.salesOrderId || "Buyurtma #" + costingDetail.id.substring(0, 8)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-detail-total">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Umumiy Xarajat</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costingDetail.totalCost)}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-detail-selling">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sotish Narxi</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costingDetail.sellingPrice)}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-detail-profit">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yalpi Foyda</CardTitle>
                {(costingDetail.grossProfit || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(costingDetail.grossProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(costingDetail.grossProfit || 0)}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-detail-margin">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Foyda Marjasi</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(costingDetail.profitMargin || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatPercent(costingDetail.profitMargin)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Xarajatlar Bo'linishi</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(costingDetail.status)}
                <Button
                  size="sm"
                  onClick={() => calculateMutation.mutate(costingDetail.id)}
                  disabled={calculateMutation.isPending}
                  data-testid="button-recalculate"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
                  Qayta Hisoblash
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="text-sm text-muted-foreground mb-1">Material</div>
                  <div className="text-xl font-bold">{formatCurrency(costingDetail.materialCost)}</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="text-sm text-muted-foreground mb-1">Mehnat</div>
                  <div className="text-xl font-bold">{formatCurrency(costingDetail.laborCost)}</div>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="text-sm text-muted-foreground mb-1">Ustama</div>
                  <div className="text-xl font-bold">{formatCurrency(costingDetail.overheadCost)}</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="text-sm text-muted-foreground mb-1">Energiya</div>
                  <div className="text-xl font-bold">{formatCurrency(costingDetail.energyCost)}</div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-sm text-muted-foreground mb-1">Isrof</div>
                  <div className="text-xl font-bold">{formatCurrency(costingDetail.wasteCost)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {costingDetail.lines && costingDetail.lines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tannarx Qatorlari</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turi</TableHead>
                      <TableHead>Element</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead className="text-right">Birlik Narxi</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead>Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(costingDetail.lines) ? costingDetail.lines : []).map((line) => (
                      <TableRow key={line.id} data-testid={`row-line-${line.id}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {line.costType === "material" && "Material"}
                            {line.costType === "labor" && "Mehnat"}
                            {line.costType === "overhead" && "Ustama"}
                            {line.costType === "energy" && "Energiya"}
                            {line.costType === "waste" && "Isrof"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{line.itemName}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(line.totalAmount)}</TableCell>
                        <TableCell className="text-muted-foreground">{line.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="order-costing-page">
      <div className="border-b bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Buyurtma Tannarxi</h1>
                <p className="text-green-100 text-sm">Har bir buyurtma uchun xarajatlar taqsimoti</p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-surface-container-lowest text-green-600 hover:bg-green-50" data-testid="button-create-costing">
                  <Plus className="h-4 w-4 mr-2" />
                  Yangi Tannarx
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yangi Buyurtma Tannarxi Yaratish</DialogTitle>
                  <DialogDescription>
                    Sotish buyurtmasini tanlang va xarajatlarni kiriting
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="salesOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sotish Buyurtmasi</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-sales-order">
                                <SelectValue placeholder="Buyurtmani tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Array.isArray(salesOrders) ? salesOrders : []).map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.documentNumber} - {order.soldToParty || "Noma'lum mijoz"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="materialCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Xarajati (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-material-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="laborCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mehnat Xarajati (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-labor-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="overheadCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ustama Xarajat (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-overhead-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="energyCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Energiya Xarajati (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-energy-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="wasteCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Isrof Xarajati (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-waste-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sotish Narxi (UZS)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-selling-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="p-4 rounded-lg bg-muted space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Umumiy Xarajat:</span>
                        <span className="font-medium">{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Yalpi Foyda:</span>
                        <span className={`font-medium ${grossProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatCurrency(grossProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Foyda Marjasi:</span>
                        <span className={`font-medium ${profitMargin >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Bekor qilish
                      </Button>
                      <Button type="submit" disabled={createCostingMutation.isPending} data-testid="button-submit">
                        {createCostingMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-costings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Hisoblangan</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {costingsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalCostings}</div>
              )}
              <p className="text-xs text-muted-foreground">Buyurtmalar tannarxi</p>
            </CardContent>
          </Card>
          <Card data-testid="card-avg-margin">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha Marja</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {costingsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className={`text-2xl font-bold ${avgMargin >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {avgMargin.toFixed(1)}%
                </div>
              )}
              <p className="text-xs text-muted-foreground">Foyda marjasi</p>
            </CardContent>
          </Card>
          <Card data-testid="card-most-profitable">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eng Foydali</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {costingsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : mostProfitable ? (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(mostProfitable.grossProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {mostProfitable.salesOrderId || "Buyurtma #" + mostProfitable.id.substring(0, 8)}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
          <Card data-testid="card-most-loss">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eng Zararli</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {costingsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : mostLoss && (mostLoss.grossProfit || 0) < 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(mostLoss.grossProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {mostLoss.salesOrderId || "Buyurtma #" + mostLoss.id.substring(0, 8)}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Buyurtma Tannarxlari</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="calculated">Hisoblangan</SelectItem>
                <SelectItem value="approved">Tasdiqlangan</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {costingsLoading ? (
              <div className="space-y-2">
                {([1, 2, 3]).map((i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : costings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Hali buyurtma tannarxi mavjud emas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead className="text-right">Material</TableHead>
                    <TableHead className="text-right">Mehnat</TableHead>
                    <TableHead className="text-right">Ustama</TableHead>
                    <TableHead className="text-right">Energiya</TableHead>
                    <TableHead className="text-right">Isrof</TableHead>
                    <TableHead className="text-right">Jami Xarajat</TableHead>
                    <TableHead className="text-right">Sotish Narxi</TableHead>
                    <TableHead className="text-right">Yalpi Foyda</TableHead>
                    <TableHead className="text-right">Marja %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(costings) ? costings : []).map((costing) => (
                    <TableRow
                      key={costing.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedCosting(costing.id)}
                      data-testid={`row-costing-${costing.id}`}
                    >
                      <TableCell className="font-medium">
                        {costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.materialCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.laborCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.overheadCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.energyCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.wasteCost)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(costing.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(costing.sellingPrice)}</TableCell>
                      <TableCell className={`text-right font-medium ${(costing.grossProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(costing.grossProfit || 0)}
                      </TableCell>
                      <TableCell className={`text-right ${(costing.profitMargin || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatPercent(costing.profitMargin)}
                      </TableCell>
                      <TableCell>{getStatusBadge(costing.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top 10 Foydali Buyurtmalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProfitable.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Ma'lumot mavjud emas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Buyurtma</TableHead>
                      <TableHead className="text-right">Yalpi Foyda</TableHead>
                      <TableHead className="text-right">Marja %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(topProfitable) ? topProfitable : []).map((costing, index) => (
                      <TableRow
                        key={costing.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => setSelectedCosting(costing.id)}
                        data-testid={`row-profitable-${costing.id}`}
                      >
                        <TableCell className="font-medium text-green-500">{index + 1}</TableCell>
                        <TableCell>{costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}</TableCell>
                        <TableCell className="text-right font-medium text-green-500">
                          {formatCurrency(costing.grossProfit || 0)}
                        </TableCell>
                        <TableCell className="text-right text-green-500">
                          {formatPercent(costing.profitMargin)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Top 10 Zararli Buyurtmalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLoss.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Ma'lumot mavjud emas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Buyurtma</TableHead>
                      <TableHead className="text-right">Yalpi Zarar</TableHead>
                      <TableHead className="text-right">Marja %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(topLoss) ? topLoss : []).map((costing, index) => (
                      <TableRow
                        key={costing.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => setSelectedCosting(costing.id)}
                        data-testid={`row-loss-${costing.id}`}
                      >
                        <TableCell className="font-medium text-red-500">{index + 1}</TableCell>
                        <TableCell>{costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}</TableCell>
                        <TableCell className="text-right font-medium text-red-500">
                          {formatCurrency(costing.grossProfit || 0)}
                        </TableCell>
                        <TableCell className="text-right text-red-500">
                          {formatPercent(costing.profitMargin)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
