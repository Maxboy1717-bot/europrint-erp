import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Truck, Star, TrendingUp, DollarSign, BarChart3, Award } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

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
  const { data: metrics, isLoading, isError, refetch} = useQuery<VendorMetric[]>({
    queryKey: ["/api/integration/vendor-performance"],
  });

  const { data: spendAnalysis } = useQuery<SpendAnalysisItem[]>({
    queryKey: ["/api/integration/vendor-performance/spend-analysis"],
  });

  const ratingBadge = (rating: number) => {
    if (rating >= 90) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Award className="w-3 h-3 mr-1" />A'lo</Badge>;
    if (rating >= 75) return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Star className="w-3 h-3 mr-1" />Yaxshi</Badge>;
    if (rating >= 60) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">O'rtacha</Badge>;
    return <Badge variant="destructive">Yomon</Badge>;
  };

  const totalVendors = (spendAnalysis || []).length;
  const avgRating = (spendAnalysis || []).length > 0
    ? (spendAnalysis || []).reduce((sum, s) => sum + (parseFloat(String(s.avgRating)) || 0), 0) / totalVendors
    : 0;
  const totalSpend = (spendAnalysis || []).reduce((sum, s) => sum + (parseFloat(String(s.totalSpend)) || 0), 0);

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6" data-testid="page-vendor-performance">
      <div className="flex items-center justify-between">
        <PageHeader
          label="Europrint ERP · MM"
          title="Taminotchi"
          boldWord="Samaradorligi"
          subtitle="Yetkazib berish, sifat, narx raqobatbardoshligi bo'yicha baholash"
          data-testid="text-vendor-performance-title"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Taminotchilar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{totalVendors}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">O'rtacha reyting</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{avgRating.toFixed(1)}%</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami xarid</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{(totalSpend / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Baholangan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{(metrics || []).length}</p>
        </div>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-xl" data-testid="card-spend-analysis">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            Xarajat Tahlili
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(spendAnalysis || []).length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hali taminotchi baholash mavjud emas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Taminotchi</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Jami xarid</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Buyurtmalar</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">O'rtacha reyting</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Daraja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(spendAnalysis || []).map((s, idx) => (
                  <TableRow key={idx} data-testid={`row-vendor-spend-${idx}`} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-on-surface">{s.vendorName || "Nomsiz"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono text-on-surface">{Number(s.totalSpend).toLocaleString()} UZS</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{s.totalOrders}</TableCell>
                    <TableCell className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Progress value={parseFloat(String(s.avgRating)) || 0} className="w-20 h-1.5 bg-surface-container" />
                        <span className="text-xs font-mono text-on-surface">{parseFloat(String(s.avgRating)).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6">{ratingBadge(parseFloat(String(s.avgRating)))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(metrics || []).length > 0 && (
        <Card className="bg-surface-container-lowest border-none rounded-xl" data-testid="card-detailed-metrics">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Batafsil Metrikalar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Taminotchi</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Davr</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Buyurtmalar</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">O'z vaqtida</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kechikkan</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sifat</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Umumiy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics || []).map((m) => (
                  <TableRow key={m.id} data-testid={`row-metric-${m.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-3 px-6 text-on-surface">{m.vendor?.name || "-"}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{m.periodYear}/{m.periodMonth}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{m.totalOrders}</TableCell>
                    <TableCell className="py-3 px-6 text-green-600 font-medium">{m.onTimeDeliveries}</TableCell>
                    <TableCell className="py-3 px-6 text-error font-medium">{m.lateDeliveries}</TableCell>
                    <TableCell className="py-3 px-6"><Progress value={m.qualityScore} className="w-16 h-1.5 bg-surface-container" /></TableCell>
                    <TableCell className="py-3 px-6">{ratingBadge(m.overallRating)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
