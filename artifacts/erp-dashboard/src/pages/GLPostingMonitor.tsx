/**
 * @module GLPostingMonitor
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/lib/i18n";
import { BookOpen, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, FileText, ArrowUpDown } from "lucide-react";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface GLStatusStat {
  status: string;
  count: number;
  totalAmount: number | string;
}

interface GLStats {
  byStatus: GLStatusStat[];
}

interface GLPosting {
  id: string;
  movementNumber: string | null;
  movementType: string;
  quantity: number;
  totalAmount: number;
  debitAccountCode: string;
  creditAccountCode: string;
  glPostingStatus: string;
  createdAt: string | null;
}

interface AccountMapEntry {
  debit: string;
  credit: string;
  description: string;
}

export default function GLPostingMonitor() {
  const { t } = useTranslation('common');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading, isError, refetch} = useQuery<GLStats>({
    queryKey: ["/api/integration/gl/stock-gl-postings/stats"],
  });

  const { data: postingsData, isLoading: postingsLoading } = useQuery<{ postings: GLPosting[] }>({
    queryKey: ["/api/integration/gl/stock-gl-postings", statusFilter, typeFilter],
  });

  const { data: accountMap } = useQuery<Record<string, AccountMapEntry>>({
    queryKey: ["/api/integration/gl/gl-account-mapping"],
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "posted": return <Badge data-testid={`badge-status-${status}`} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />{t("joylangan")}</Badge>;
      case "failed": return <Badge data-testid={`badge-status-${status}`} variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t("Xatolik")}</Badge>;
      default: return <Badge data-testid={`badge-status-${status}`} variant="secondary"><Clock className="w-3 h-3 mr-1" />{t("Kutilmoqda")}</Badge>;
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GOODS_RECEIPT: "Xom ashyo qabul",
      GOODS_ISSUE: "Material berish",
      PRODUCTION_RECEIPT: "Tayyor mahsulot",
      DELIVERY: "Yetkazib berish",
      TRANSFER: "O'tkazma",
      ADJUSTMENT: "Tuzatish",
      RETURN: "Qaytarish",
    };
    return labels[type] || type;
  };

  const postings = postingsData?.postings || [];
  const totalPosted = stats?.byStatus?.find(s => s.status === "posted")?.count || 0;
  const totalFailed = stats?.byStatus?.find(s => s.status === "failed")?.count || 0;
  const totalPending = stats?.byStatus?.find(s => s.status === "pending")?.count || 0;
  const totalAmount = stats?.byStatus?.reduce((sum, s) => sum + (parseFloat(String(s.totalAmount)) || 0), 0) || 0;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-gl-posting-monitor">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("omborMoliyaGlPosting")}</h1>
          <p className="text-muted-foreground">{t("avtomatikBuxgalteriyaYozuvlariMonitoring")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-posted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><CheckCircle className="w-5 h-5 text-[var(--ep-green)]" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t("joylangan")}</p>
                <p className="text-2xl font-bold">{totalPosted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-failed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900"><XCircle className="w-5 h-5 text-[var(--ep-red)]" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Xatolik")}</p>
                <p className="text-2xl font-bold">{totalFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-pending">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900"><Clock className="w-5 h-5 text-[var(--ep-yellow)]" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Kutilmoqda")}</p>
                <p className="text-2xl font-bold">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-total-amount">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><DollarSign className="w-5 h-5 text-[var(--ep-blue)]" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t("jamiSumma")}</p>
                <p className="text-2xl font-bold">{(totalAmount / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {accountMap && (
        <Card data-testid="card-account-mapping">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-[14px] font-semibold"><BookOpen className="w-4 h-4 inline mr-2" />Hisob Xaritasi (Account Mapping)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(accountMap).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-md border">
                  <Badge variant="outline" className="font-mono text-xs">{key}</Badge>
                  <span className="text-sm">DR:{val.debit} / CR:{val.credit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-postings-table">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-[14px] font-semibold"><FileText className="w-4 h-4 inline mr-2" />{t("glPostinglar")}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9" data-testid="select-status-filter"><SelectValue placeholder={t("status28")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                <SelectItem value="posted">{t("joylangan")}</SelectItem>
                <SelectItem value="pending">{t("Kutilmoqda")}</SelectItem>
                <SelectItem value="failed">{t("Xatolik")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-9" data-testid="select-type-filter"><SelectValue placeholder={t("type")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                <SelectItem value="GOODS_RECEIPT">{t("xomAshyoQabul")}</SelectItem>
                <SelectItem value="GOODS_ISSUE">{t('materialBerish')}</SelectItem>
                <SelectItem value="PRODUCTION_RECEIPT">{t("tayyorMahsulot")}</SelectItem>
                <SelectItem value="DELIVERY">{t("yetkazibBerish")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {postingsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : postings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowUpDown className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("haliGlPostingMavjudEmas")}</p>
              <p className="text-sm">{t("omborOperatsiyalariAmalgaOshirilgandaAvtomatik")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("raqam")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("summa")}</TableHead>
                  <TableHead>DR/CR</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(postings) ? postings : []).map((p) => (
                  <TableRow key={p.id} data-testid={`row-posting-${p.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{p.movementNumber || p.id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabel(p.movementType)}</Badge></TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell className="font-mono">{Number(p.totalAmount).toLocaleString()} UZS</TableCell>
                    <TableCell className="font-mono text-xs">{p.debitAccountCode}/{p.creditAccountCode}</TableCell>
                    <TableCell>{statusBadge(p.glPostingStatus)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
