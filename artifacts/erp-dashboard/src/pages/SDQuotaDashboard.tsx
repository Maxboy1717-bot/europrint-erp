import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { fmt } from "@/lib/sd-helpers";
import { TrendingUp, Target, User, Calendar, FileText, Zap, BarChart2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuotaData {
  period: string;
  year: number;
  month: number;
  daysLeft: number;
  daysInMonth: number;
  quota: {
    target: number;
    achieved: number;
    percent: number;
    remaining: number;
    dailyTarget: number;
    dailyActual: number;
    pace: number;
  };
  totalSales: number;
  quotaAmount: number;
  quotaPercent: number;
  ordersThisMonth: number;
  leadsWon: number;
  leadsTotal: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  proposalsByStatus: Record<string, number>;
  totalProposals: number;
}

const LEAD_STATUS_UZ: Record<string, string> = {
  new: "Yangi",
  working: "Ishlanyapti",
  quoted: "Taklif berildi",
  negotiating: "Muzokaralar",
  won: "Yutilgan",
  lost: "Yo'qotilgan",
  frozen: "Muzlatilgan",
};

const PROPOSAL_STATUS_UZ: Record<string, string> = {
  draft: "Qoralama",
  calculated: "Hisoblangan",
  sent: "Yuborilgan",
  revised: "Qayta ko'rilgan",
  approved: "Tasdiqlangan",
  declined: "Rad etilgan",
};

const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-surface-container-low text-on-surface-variant",
  calculated: "bg-blue-50 text-blue-700",
  sent: "bg-amber-50 text-amber-700",
  revised: "bg-purple-50 text-purple-700",
  approved: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
};

export default function SDQuotaDashboard() {
  const { data: kpi, isLoading, refetch } = useQuery<QuotaData>({
    queryKey: ["/api/sd/dashboard/quota"],
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-surface-container-low rounded-xl w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {([1, 2, 3]).map(i => <div key={`k-${i}`} className="h-32 bg-surface-container-low rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const q = kpi?.quota || { target: 0, achieved: 0, percent: 0, remaining: 0, dailyTarget: 0, dailyActual: 0, pace: 0 };
  const isOnTrack = q.pace >= 90;
  const isAhead = q.pace >= 110;

  return (
    <div className="p-6 space-y-6 bg-surface min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Mening <span className="font-bold text-primary">KPI va Kvotam</span>
          </h1>
          <p className="text-on-surface-variant mt-1">
            {kpi?.period} — {kpi?.daysLeft} kun qoldi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yangilash
          </Button>
          {isAhead ? (
            <Badge className="bg-green-100 text-green-800 no-default-hover-elevate gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Reja bajarilmoqda
            </Badge>
          ) : isOnTrack ? (
            <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Maqsadga yaqin
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 no-default-hover-elevate gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Orqada qolmoqda
            </Badge>
          )}
          <Badge variant="secondary" className="no-default-hover-elevate gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {kpi?.daysLeft} kun qoldi
          </Badge>
        </div>
      </div>

      {/* Plan/Fakt — asosiy kartochka */}
      <Card className="bg-surface-container-lowest border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Oylik savdo rejasi (Plan / Fakt)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {/* Asosiy raqamlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-surface-container-low rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">REJA (maqsad)</p>
              <p className="text-3xl font-bold text-on-surface" data-testid="text-quota-target">
                {fmt(q.target)}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">so'm</p>
            </div>
            <div className={cn("text-center p-4 rounded-xl", isOnTrack ? "bg-green-50" : "bg-red-50")}>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">FAKT (bajarilgan)</p>
              <p className={cn("text-3xl font-bold", isOnTrack ? "text-green-700" : "text-red-700")} data-testid="text-quota-achieved">
                {fmt(q.achieved)}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">so'm</p>
            </div>
            <div className="text-center p-4 bg-surface-container-low rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">QOLDI</p>
              <p className="text-3xl font-bold text-amber-600" data-testid="text-quota-remaining">
                {fmt(q.remaining)}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">so'm</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-on-surface">Bajarilish: {q.percent}%</span>
              <span className={isOnTrack ? "text-green-600" : "text-red-500"}>
                {q.percent >= 100 ? "Reja bajarildi!" : `${q.percent}% bajarildi`}
              </span>
            </div>
            <Progress
              value={Math.min(q.percent, 100)}
              className="h-4 bg-surface-container-high"
              data-testid="progress-quota"
            />
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>0</span>
              <span>{fmt(q.target / 2)}</span>
              <span>{fmt(q.target)}</span>
            </div>
          </div>

          {/* Kunlik plan/fakt */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-outline-variant">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Kunlik reja</p>
                <p className="text-lg font-bold text-on-surface">{fmt(q.dailyTarget)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-lg", isOnTrack ? "bg-green-100" : "bg-red-100")}>
                <BarChart2 className={cn("w-4 h-4", isOnTrack ? "text-green-600" : "text-red-600")} />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Kunlik fakt</p>
                <p className={cn("text-lg font-bold", isOnTrack ? "text-green-700" : "text-red-700")}>
                  {fmt(q.dailyActual)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-lg", q.pace >= 100 ? "bg-green-100" : "bg-amber-100")}>
                <Zap className={cn("w-4 h-4", q.pace >= 100 ? "text-green-600" : "text-amber-600")} />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Temp (Pace)</p>
                <p className={cn("text-lg font-bold", q.pace >= 100 ? "text-green-700" : "text-amber-700")}>
                  {q.pace}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qisqacha statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-orders-month">
                {kpi?.ordersThisMonth || 0}
              </p>
              <p className="text-xs text-on-surface-variant">Oylik buyurtmalar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-leads-won">
                {kpi?.leadsWon || 0}
              </p>
              <p className="text-xs text-on-surface-variant">Yutilgan leadlar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-conversion-rate">
                {kpi?.conversionRate || 0}%
              </p>
              <p className="text-xs text-on-surface-variant">Konversiya</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-total-proposals">
                {kpi?.totalProposals || 0}
              </p>
              <p className="text-xs text-on-surface-variant">Oylik takliflar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead holatlari */}
        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Lead holatlari
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-2">
            {Object.entries(kpi?.leadsByStatus || {}).length === 0 ? (
              <p className="text-sm text-on-surface-variant py-2">Ma'lumot yo'q</p>
            ) : (
              Object.entries(kpi?.leadsByStatus || {}).map(([status, cnt]) => (
                <div key={status}
                  className="flex flex-col items-center p-4 bg-surface-container-low rounded-xl min-w-[100px] border border-outline-variant/30"
                  data-testid={`card-lead-status-${status}`}
                >
                  <span className="text-2xl font-bold text-on-surface">{cnt as number}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mt-1">
                    {LEAD_STATUS_UZ[status] || status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* TZ-04: Takliflar holati (calculated, revised qo'shilgan) */}
        <Card className="bg-surface-container-lowest border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Taklifnomalar holati (oylik)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-2">
            {Object.entries(kpi?.proposalsByStatus || {}).length === 0 ? (
              <p className="text-sm text-on-surface-variant py-2">Bu oyda taklif yaratilmagan</p>
            ) : (
              Object.entries(kpi?.proposalsByStatus || {}).map(([status, cnt]) => (
                <div key={status}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl min-w-[110px]",
                    PROPOSAL_STATUS_COLORS[status] || "bg-surface-container-low text-on-surface",
                  )}
                  data-testid={`card-proposal-status-${status}`}
                >
                  <span className="text-2xl font-bold">{cnt as number}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider mt-1">
                    {PROPOSAL_STATUS_UZ[status] || status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
