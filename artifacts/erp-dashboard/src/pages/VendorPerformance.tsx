/**
 * @module VendorPerformance
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Truck, Star, TrendingUp, DollarSign, BarChart3, Award } from "lucide-react";
import { EPPageHeader, EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface VendorMetric {
  id: string;
  periodYear: number;
  periodMonth: number;
  totalOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  qualityScore: number;
  overallRating: number;
  vendor: { name: string } | null;
}

interface SpendAnalysisItem {
  vendorName: string | null;
  totalSpend: number | string;
  totalOrders: number;
  avgRating: number | string;
}

export default function VendorPerformance() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingForm, setRatingForm] = useState({ vendorId: "", score: "", comment: "" });

  const addRatingMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/mm/vendor-performance", {
        vendorId: ratingForm.vendorId,
        score: Number(ratingForm.score),
        comment: ratingForm.comment,
      }),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Baho muvaffaqiyatli qo'shildi." });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/vendor-performance"] });
      setRatingDialogOpen(false);
      setRatingForm({ vendorId: "", score: "", comment: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Baho qo'shishda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const { data: metrics, isLoading, isError, refetch} = useQuery<VendorMetric[]>({
    queryKey: ["/api/integration/vendor-performance"],
  });

  const { data: spendAnalysis } = useQuery<SpendAnalysisItem[]>({
    queryKey: ["/api/integration/vendor-performance/spend-analysis"],
  });

  const ratingBadge = (rating: number) => {
    if (rating >= 90) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Award className="w-3 h-3 mr-1" />{t("alo")}</Badge>;
    if (rating >= 75) return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Star className="w-3 h-3 mr-1" />{t("Yaxshi")}</Badge>;
    if (rating >= 60) return <EPStatusPill tone="warning">{t("average")}</EPStatusPill>;
    return <EPStatusPill tone="danger">{t("yomon")}</EPStatusPill>;
  };

  const totalVendors = (spendAnalysis || []).length;
  const avgRating = (spendAnalysis || []).length > 0
    ? (spendAnalysis || []).reduce((sum, s) => sum + (parseFloat(String(s.avgRating)) || 0), 0) / totalVendors
    : 0;
  const totalSpend = (spendAnalysis || []).reduce((sum, s) => sum + (parseFloat(String(s.totalSpend)) || 0), 0);

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-vendor-performance">
      <div className="flex items-center justify-between">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("taminotchiSamaradorligi")}</b></>}
        title={t("taminotchiSamaradorligi")}
        subtitle={t("yetkazibBerishSifatNarxRaqobatbardoshligi")}
        data-testid="text-vendor-performance-title"
      />
        <div className="flex items-center gap-2">
          <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-add-rating">
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("bahoQoshish")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">{t("taminotchiBahosi")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="vp-vendorId">{t("taminotchiId")}</Label>
                  <Input
                    id="vp-vendorId"
                    placeholder={t('vendorId')}
                    value={ratingForm.vendorId}
                    onChange={(e) => setRatingForm((f) => ({ ...f, vendorId: e.target.value }))}
                    data-testid="input-vendor-id"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vp-score">Ball (0–100)</Label>
                  <Input
                    id="vp-score"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="85"
                    value={ratingForm.score}
                    onChange={(e) => setRatingForm((f) => ({ ...f, score: e.target.value }))}
                    data-testid="input-score"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vp-comment">{t("Izoh")}</Label>
                  <Input
                    id="vp-comment"
                    placeholder={t("izoh1")}
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm((f) => ({ ...f, comment: e.target.value }))}
                    data-testid="input-comment"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addRatingMutation.mutate()}
                  disabled={addRatingMutation.isPending || !ratingForm.vendorId || !ratingForm.score}
                  data-testid="button-submit-rating"
                >
                  {addRatingMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("taminotchilar")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{totalVendors}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("ortachaReyting")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{avgRating.toFixed(1)}%</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("jamiXarid")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{(totalSpend / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("baholangan")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{(metrics || []).length}</p>
        </div>
      </div>

      <Card className="bg-card border-none rounded-xl" data-testid="card-spend-analysis">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            {t("xarajatTahlili1")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(spendAnalysis || []).length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("haliTaminotchiBaholashMavjudEmas")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("taminotchi1")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("jamiXarid")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("buyurtmalar")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("ortachaReyting")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("daraja")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(spendAnalysis || []).map((s, idx) => (
                  <TableRow key={idx} data-testid={`row-vendor-spend-${idx}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-foreground">{s.vendorName || "Nomsiz"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono text-foreground">{Number(s.totalSpend).toLocaleString()} UZS</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{s.totalOrders}</TableCell>
                    <TableCell className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Progress value={parseFloat(String(s.avgRating)) || 0} className="w-20 h-1.5 bg-muted/60" />
                        <span className="text-xs font-mono text-foreground">{parseFloat(String(s.avgRating)).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6">{ratingBadge(parseFloat(String(s.avgRating)))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {(metrics || []).length > 0 && (
        <Card className="bg-card border-none rounded-xl" data-testid="card-detailed-metrics">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("batafsilMetrikalar")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("taminotchi1")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("period")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("buyurtmalar")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("ozVaqtida")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("kechikkan")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Sifat")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("umumiy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics || []).map((m) => (
                  <TableRow key={m.id} data-testid={`row-metric-${m.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 text-foreground">{m.vendor?.name || "-"}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{m.periodYear}/{m.periodMonth}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{m.totalOrders}</TableCell>
                    <TableCell className="py-3 px-6 text-[var(--ep-green)] font-medium">{m.onTimeDeliveries}</TableCell>
                    <TableCell className="py-3 px-6 text-[var(--ep-red)] font-medium">{m.lateDeliveries}</TableCell>
                    <TableCell className="py-3 px-6"><Progress value={m.qualityScore} className="w-16 h-1.5 bg-muted/60" /></TableCell>
                    <TableCell className="py-3 px-6">{ratingBadge(m.overallRating)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
