/**
 * @module InvoiceVerification
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, AlertTriangle, FileCheck, Search, Scale, TrendingUp } from "lucide-react";
import { EPErrorState, EPStatusPill, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  priceVariance: number | null;
  matchStatus: string | null;
  vendor: { name: string } | null;
}

interface InvoicesResponse {
  invoices: VendorInvoice[];
  total: number;
}

interface MatchStatItem {
  status: string;
  count: number;
}

interface InvoiceStatItem {
  status: string;
  count: number;
}

interface MatchStats {
  invoiceStats: InvoiceStatItem[];
  matchStats: MatchStatItem[];
}

interface MatchResult {
  id: string;
  invoiceId: string;
  poTotalAmount: number;
  grTotalAmount: number | null;
  invoiceTotalAmount: number;
  priceVariancePercent: number;
  overallStatus: string;
  invoice: { invoiceNumber: string } | null;
}

export default function InvoiceVerification() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [matchStatus, setMatchStatus] = useState<string>("all");
  const [selectedVendorInvoiceId, setSelectedVendorInvoiceId] = useState<string | null>(null);

  const { data: invoicesData, isLoading, isError, error, refetch} = useQuery<InvoicesResponse>({
    queryKey: ["/api/integration/invoice/vendor-invoices", matchStatus],
  });

  const { data: vendorInvoiceDetail } = useQuery({
    queryKey: [`/api/mm/vendor-invoices/${selectedVendorInvoiceId}`],
    enabled: !!selectedVendorInvoiceId,
  });

  const { data: matchStats } = useQuery<MatchStats>({
    queryKey: ["/api/integration/invoice/three-way-match/stats"],
  });

  const { data: matchResults } = useQuery<MatchResult[]>({
    queryKey: ["/api/integration/invoice/three-way-match/results"],
  });

  // Audit 2026-08-06: this posted to /api/integration/invoice/three-way-match/:id, which
  // compared nothing (it inserted a status='pending' row) and crashed at runtime anyway —
  // its onConflictDoUpdate targeted invoice_id, and three_way_match_results has no unique
  // index on that column. The MM module now has a real implementation writing to the same
  // table, so the stats/results queries below keep working unchanged.
  type RunMatchResponse = { overall_status?: string; summary?: { status?: string } };
  const runMatchMutation = useMutation<RunMatchResponse, Error, string>({
    mutationFn: async (invoiceId: string) => {
      const res = await apiRequest<RunMatchResponse>("POST", `/api/mm/3way-match/${invoiceId}`, { tolerancePercent: 5 });
      return res;
    },
    onSuccess: (data) => {
      toast({ title: "3-Way Match bajarildi", description: `Natija: ${data.overall_status ?? data.summary?.status ?? "unknown"}` });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/invoice"] });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Match bajarishda muammo", variant: "destructive" });
    },
  });

  const invoices = invoicesData?.invoices || [];
  const results = matchResults || [];

  const matchBadge = (status: string) => {
    switch (status) {
      case "full_match": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />{t("toliqMos")}</Badge>;
      case "partial_match": return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />{t("qismanMos")}</Badge>;
      case "mismatch": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t("mosEmas")}</Badge>;
      default: return <EPStatusPill tone="neutral">{t("tekshirilmagan")}</EPStatusPill>;
    }
  };

  const totalInvoices = matchStats?.invoiceStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0;
  const matchedCount = matchStats?.matchStats?.find(s => s.status === "matched")?.count || 0;
  const mismatchCount = matchStats?.matchStats?.find(s => s.status === "mismatch")?.count || 0;

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6" data-testid="page-invoice-verification">
      <EPPageHeader
        title={t("k3WayMatchFakturaTekshirish")}
        subtitle={t("poQabulHujjatiFakturaAvtomatik")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-total">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><FileCheck className="w-5 h-5 text-[var(--ep-blue)]" /></div>
              <div><p className="text-sm text-muted-foreground">{t("jamiFakturalar")}</p><p className="text-2xl font-bold">{totalInvoices}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-matched">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><CheckCircle className="w-5 h-5 text-[var(--ep-green)]" /></div>
              <div><p className="text-sm text-muted-foreground">{t("mosKelgan")}</p><p className="text-2xl font-bold">{matchedCount}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-mismatch">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900"><XCircle className="w-5 h-5 text-[var(--ep-red)]" /></div>
              <div><p className="text-sm text-muted-foreground">{t("mosKelmagan")}</p><p className="text-2xl font-bold">{mismatchCount}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-rate">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900"><TrendingUp className="w-5 h-5 text-[var(--ep-purple)]" /></div>
              <div><p className="text-sm text-muted-foreground">{t("matchFoizi")}</p><p className="text-2xl font-bold">{totalInvoices > 0 ? Math.round((matchedCount / totalInvoices) * 100) : 0}%</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-invoices-table">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-[14px] font-semibold"><Scale className="w-4 h-4 inline mr-2" />{t("fakturalarRoyxati")}</CardTitle>
          <Select value={matchStatus} onValueChange={setMatchStatus}>
            <SelectTrigger className="w-44 h-9" data-testid="select-match-filter"><SelectValue placeholder={t("matchHolati")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Barchasi")}</SelectItem>
              <SelectItem value="full_match">{t("toliqMos")}</SelectItem>
              <SelectItem value="partial_match">{t("qismanMos")}</SelectItem>
              <SelectItem value="mismatch">{t("mosEmas")}</SelectItem>
              <SelectItem value="pending">{t("tekshirilmagan")}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("haliFakturaMavjudEmas")}</p>
              <p className="text-sm">{t("taminotchiFakturalariQoshilgandaBuYerda")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fakturaRaqami")}</TableHead>
                  <TableHead>{t("taminotchi1")}</TableHead>
                  <TableHead>{t("summa")}</TableHead>
                  <TableHead>{t("poFarqi")}</TableHead>
                  <TableHead>{t("matchHolati")}</TableHead>
                  <TableHead>{t("Amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(invoices) ? invoices : []).map((inv) => (
                  <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.vendor?.name || "-"}</TableCell>
                    <TableCell className="font-mono">{Number(inv.totalAmount).toLocaleString()} {inv.currency}</TableCell>
                    <TableCell className="font-mono">{inv.priceVariance ? `${Number(inv.priceVariance).toLocaleString()} UZS` : "-"}</TableCell>
                    <TableCell>{matchBadge(inv.matchStatus || "pending")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => runMatchMutation.mutate(inv.id)} disabled={runMatchMutation.isPending} data-testid={`button-match-${inv.id}`}>
                        <Scale className="w-3 h-3 mr-1" />{t("check")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card data-testid="card-match-results">
          <CardHeader><CardTitle className="text-[14px] font-semibold">{t("songgiMatchNatijalari")}</CardTitle></CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("faktura")}</TableHead>
                  <TableHead>{t("poSumma")}</TableHead>
                  <TableHead>{t("grSumma")}</TableHead>
                  <TableHead>{t("fakturaSumma")}</TableHead>
                  <TableHead>{t("narxFarqi")}</TableHead>
                  <TableHead>{t("natija")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(results) ? results : []).slice(0, 10).map((r) => (
                  <TableRow key={r.id} data-testid={`row-result-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{r.invoice?.invoiceNumber || r.invoiceId?.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono">{Number(r.poTotalAmount).toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{r.grTotalAmount ? Number(r.grTotalAmount).toLocaleString() : "-"}</TableCell>
                    <TableCell className="font-mono">{Number(r.invoiceTotalAmount).toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{Number(r.priceVariancePercent).toFixed(1)}%</TableCell>
                    <TableCell>{matchBadge(r.overallStatus === "matched" ? "full_match" : "mismatch")}</TableCell>
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
