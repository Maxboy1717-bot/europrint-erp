/** @module OrderCostingDetail @description Detail view panel for a single OrderCosting record — cost breakdown cards, breakdown grid, and line-items table. */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calculator, FileText, RefreshCw } from "lucide-react";
import { OrderCostingDetail as OrderCostingDetailType, formatPercent } from "./OrderCostingTypes";

import { useTranslation } from '@/lib/i18n';
interface Props {
  costingDetail: OrderCostingDetailType;
  onBack: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function OrderCostingDetailView({costingDetail, onBack, getStatusBadge }: Props) {
  const { t } = useTranslation('common');
  const { toast } = useToast();

  const calculateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/order-costing/${id}/calculate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing", costingDetail.id] });
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tannarxi qayta hisoblandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Hisoblashda xatolik", variant: "destructive" });
    },
  });

  return (
    <div data-testid="order-costing-detail">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="bg-card/10 border-white/30 text-white hover:bg-card/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("buyurtmaTannarxiTafsiloti")}</h1>
              <p className="text-white/75 text-sm">
                {costingDetail.salesOrderId || "Buyurtma #" + costingDetail.id.substring(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-detail-total">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("umumiyXarajat")}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costingDetail.totalCost)}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-detail-selling">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("sotishNarxi")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costingDetail.sellingPrice)}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-detail-profit">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("yalpiFoyda1")}</CardTitle>
              {(costingDetail.grossProfit || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-[var(--ep-green)]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(costingDetail.grossProfit || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {formatCurrency(costingDetail.grossProfit || 0)}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-detail-margin">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("foydaMarjasi1")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(costingDetail.profitMargin || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {formatPercent(costingDetail.profitMargin)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{t("xarajatlarBolinishi")}</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(costingDetail.status)}
              <Button
                size="sm"
                onClick={() => calculateMutation.mutate(costingDetail.id)}
                disabled={calculateMutation.isPending}
                data-testid="button-recalculate"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
                {t("qaytaHisoblash1")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-sm text-muted-foreground mb-1">{t('Material')}</div>
                <div className="text-xl font-bold">{formatCurrency(costingDetail.materialCost)}</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="text-sm text-muted-foreground mb-1">{t("mehnat")}</div>
                <div className="text-xl font-bold">{formatCurrency(costingDetail.laborCost)}</div>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-sm text-muted-foreground mb-1">{t("ustama")}</div>
                <div className="text-xl font-bold">{formatCurrency(costingDetail.overheadCost)}</div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-sm text-muted-foreground mb-1">{t("energiya1")}</div>
                <div className="text-xl font-bold">{formatCurrency(costingDetail.energyCost)}</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-sm text-muted-foreground mb-1">{t("isrof")}</div>
                <div className="text-xl font-bold">{formatCurrency(costingDetail.wasteCost)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {costingDetail.lines && costingDetail.lines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("tannarxQatorlari")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("element")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead className="text-right">{t("birlikNarxi1")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                    <TableHead>{t("Izoh")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(costingDetail.lines) ? costingDetail.lines : []).map((line) => (
                    <TableRow key={line.id} data-testid={`row-line-${line.id}`} className="hover:bg-muted/40 transition-colors">
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
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
