/**
 * @module TurnoverTab
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { TurnoverData, TurnoverItem, TranslationType } from "./types";
import { apiRequest } from '@/lib/queryClient';

interface TurnoverTabProps {
  t: TranslationType;
  dateFrom: string;
  setDateFrom: (val: string) => void;
  dateTo: string;
  setDateTo: (val: string) => void;
}

export function TurnoverTab({
  t,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: TurnoverTabProps) {
  const { data: turnoverData, isLoading: isLoadingTurnover, refetch: refetchTurnover } = useQuery<TurnoverData>({
    queryKey: ["/api/warehouse/reports/turnover", dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      const res = await apiRequest('GET', `/api/warehouse/reports/turnover?${params}`) as unknown as Response;
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoadingTurnover) {
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
          <Label>{t.turnover.from}</Label>
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            data-testid="input-date-from"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>{t.turnover.to}</Label>
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            data-testid="input-date-to"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetchTurnover()} data-testid="button-refresh-turnover">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{turnoverData?.summary?.averageTurnover || 0}</p>
                <p className="text-sm text-muted-foreground">{t.turnover.avgTurnover}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{turnoverData?.summary?.fastMovers || 0}</p>
                <p className="text-sm text-muted-foreground">{t.turnover.fastMovers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{turnoverData?.summary?.slowMovers || 0}</p>
                <p className="text-sm text-muted-foreground">{t.turnover.slowMovers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.turnover.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.turnover.material}</TableHead>
                  <TableHead className="text-right">{t.turnover.opening}</TableHead>
                  <TableHead className="text-right">{t.turnover.inflow}</TableHead>
                  <TableHead className="text-right">{t.turnover.outflow}</TableHead>
                  <TableHead className="text-right">{t.turnover.closing}</TableHead>
                  <TableHead className="text-right">{t.turnover.rate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnoverData?.data?.map((item: TurnoverItem) => (
                  <TableRow key={item.materialId} data-testid={`row-turnover-${item.materialId}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.openingStock)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalIn)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalOut)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.closingStock)}</TableCell>
                    <TableCell className="text-right font-bold text-blue-400">
                      {item.turnoverRate.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!turnoverData?.data || turnoverData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
