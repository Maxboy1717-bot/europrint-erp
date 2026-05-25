/**
 * @module ExpiryTab
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Package, TrendingUp, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { ExpiryData, ExpiryItem, TranslationType, STATUS_COLORS } from "./types";
import { apiRequest } from '@/lib/queryClient';

interface ExpiryTabProps {
  t: TranslationType;
  daysAhead: string;
  setDaysAhead: (val: string) => void;
}

export function ExpiryTab({ t, daysAhead, setDaysAhead }: ExpiryTabProps) {
  const { data: expiryData, isLoading: isLoadingExpiry, refetch: refetchExpiry } = useQuery<ExpiryData>({
    queryKey: ["/api/warehouse/reports/expiry", daysAhead],
    queryFn: async () => {
      const params = new URLSearchParams({ daysAhead });
      return await apiRequest('GET', `/api/warehouse/reports/expiry?${params}`);
    },
  });

  if (isLoadingExpiry) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>{t.expiry.daysAhead}</Label>
          <Select value={daysAhead} onValueChange={setDaysAhead}>
            <SelectTrigger className="w-32 h-9" data-testid="select-days-ahead">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="60">60</SelectItem>
              <SelectItem value="90">90</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetchExpiry()} data-testid="button-refresh-expiry">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{expiryData?.summary?.totalItems || 0}</p>
                <p className="text-sm text-muted-foreground">{t.stockBalance.totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{expiryData?.summary?.expiredCount || 0}</p>
                <p className="text-sm text-muted-foreground">{t.expiry.expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold">{expiryData?.summary?.criticalCount || 0}</p>
                <p className="text-sm text-muted-foreground">{t.expiry.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(expiryData?.summary?.totalAtRiskValue || 0)}</p>
                <p className="text-sm text-muted-foreground">{t.expiry.atRiskValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.expiry.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.expiry.material}</TableHead>
                  <TableHead>{t.expiry.batch}</TableHead>
                  <TableHead>{t.expiry.expiryDate}</TableHead>
                  <TableHead className="text-right">{t.expiry.daysLeft}</TableHead>
                  <TableHead className="text-right">{t.expiry.quantity}</TableHead>
                  <TableHead className="text-right">{t.expiry.value}</TableHead>
                  <TableHead>{t.expiry.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiryData?.data?.map((item: ExpiryItem, idx: number) => (
                  <TableRow key={`${item.materialId}-${idx}`} data-testid={`row-expiry-${item.materialId}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'dd.MM.yyyy') : '-'}</TableCell>
                    <TableCell className={`text-right ${item.daysToExpiry < 0 ? 'text-red-400' : item.daysToExpiry <= 7 ? 'text-orange-400' : ''}`}>
                      {item.daysToExpiry}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.quantity)} {item.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)} {t.common.sum}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ok}>
                        {t.expiry[item.status as keyof typeof t.expiry] || item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!expiryData?.data || expiryData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t.common.noData}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
