import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, TrendingUp, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

interface VarianceResult {
  orderId: number;
  orderNumber: string;
  productName: string;
  productId: number | null;
  plannedQty: number;
  mpv: number;
  mqv: number;
  lrv: number;
  lev: number;
  ov: number;
  totalVariance: number;
  standardTotalCost: number;
  actualTotalCost: number;
  variancePct: number;
  needsAudit: boolean;
  details: {
    mpvLabel: string;
    mqvLabel: string;
    lrvLabel: string;
    levLabel: string;
    ovLabel: string;
  };
}

function VarianceBar({ label, value, favorable }: { label: string; value: number; favorable: boolean }) {
  const color = value === 0 ? "#6b7280" : favorable ? "#10b981" : "#ef4444";
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className="w-40 text-sm text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(Math.abs(value) / 1_000_000, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className={`w-32 text-right text-sm font-mono font-medium ${value < 0 ? "text-emerald-600" : value > 0 ? "text-red-600" : "text-muted-foreground"}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

export default function FinanceVariance() {
  const { t } = useTranslation();
  const [inputId, setInputId] = useState("");
  const [searchId, setSearchId] = useState<string>("");

  const handleSearch = () => {
    const trimmed = inputId.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      setSearchId(trimmed);
    }
  };

  const { data, isLoading, isError, error } = useQuery<VarianceResult>({
    queryKey: ["finance-variance", searchId],
    queryFn: () => apiRequest(`/finance/variance/${searchId}`),
    enabled: searchId.length > 0,
    retry: false,
  });

  const chartData = data
    ? [
        { name: "MPV", value: data.mpv, fill: data.mpv < 0 ? "#10b981" : "#ef4444" },
        { name: "MQV", value: data.mqv, fill: data.mqv < 0 ? "#10b981" : "#ef4444" },
        { name: "LRV", value: data.lrv, fill: data.lrv < 0 ? "#10b981" : "#ef4444" },
        { name: "LEV", value: data.lev, fill: data.lev < 0 ? "#10b981" : "#ef4444" },
        { name: "OV",  value: data.ov,  fill: data.ov  > 0 ? "#f59e0b" : "#8b5cf6" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("variance.title")}
        subtitle={t("variance.subtitle")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("variance.orderIdLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder={t("variance.placeholder")}
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="max-w-xs font-mono"
            />
            <Button
              onClick={handleSearch}
              disabled={!inputId.trim() || !/^\d+$/.test(inputId.trim())}
            >
              <Search className="h-4 w-4 mr-2" />
              {t("variance.analyze")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            {String((error as Error)?.message ?? t("variance.notFound"))}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t("variance.order")}</div>
                <div className="font-semibold">{data.orderNumber || `#${data.orderId}`}</div>
                {data.productName && (
                  <div className="text-xs text-muted-foreground mt-1">{data.productName}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t("variance.stdCost")}</div>
                <div className="font-semibold">{formatCurrency(data.standardTotalCost)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t("variance.actualCost")}</div>
                <div className="font-semibold">{formatCurrency(data.actualTotalCost)}</div>
              </CardContent>
            </Card>
            <Card className={data.totalVariance < 0 ? "border-emerald-400" : data.totalVariance > 0 ? "border-red-400" : ""}>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t("variance.totalVariance")}</div>
                <div className={`font-bold text-lg ${data.totalVariance < 0 ? "text-emerald-600" : data.totalVariance > 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(data.totalVariance)}
                </div>
                <div className="text-xs text-muted-foreground">{data.variancePct}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {t("variance.composition")}
                  {data.needsAudit
                    ? <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />{t("variance.auditRequired")}</Badge>
                    : <Badge variant="secondary" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />{t("variance.normal")}</Badge>
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VarianceBar label={t("variance.mpv")} value={data.mpv} favorable={data.mpv < 0} />
                <VarianceBar label={t("variance.mqv")} value={data.mqv} favorable={data.mqv < 0} />
                <VarianceBar label={t("variance.lrv")} value={data.lrv} favorable={data.lrv < 0} />
                <VarianceBar label={t("variance.lev")} value={data.lev} favorable={data.lev < 0} />
                <VarianceBar label={t("variance.ov")}  value={data.ov}  favorable={data.ov > 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("variance.chart")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + "K"} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("variance.labeling")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {[
                  { label: "MPV", val: data.details.mpvLabel },
                  { label: "MQV", val: data.details.mqvLabel },
                  { label: "LRV", val: data.details.lrvLabel },
                  { label: "LEV", val: data.details.levLabel },
                  { label: "OV",  val: data.details.ovLabel  },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                    <Badge
                      variant={
                        val === "Favourable" || val === "Under-applied" ? "secondary"
                          : val === "Neutral" ? "outline"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {val}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!searchId && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("variance.empty")}</p>
            <p className="text-xs mt-1 opacity-70">{t("variance.emptyNote")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
