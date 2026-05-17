/**
 * @module AgingTab
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
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
import { AgingData, AgingItem, TranslationType, STATUS_COLORS } from "./types";
import { apiRequest } from '@/lib/queryClient';

interface AgingTabProps {
  t: TranslationType;
  daysThreshold: string;
  setDaysThreshold: (val: string) => void;
}

export function AgingTab({ t, daysThreshold, setDaysThreshold }: AgingTabProps) {
  const { data: agingData, isLoading: isLoadingAging, refetch: refetchAging } = useQuery<AgingData>({
    queryKey: ["/api/warehouse/reports/aging", daysThreshold],
    queryFn: async () => {
      const params = new URLSearchParams({ daysThreshold });
      return await apiRequest('GET', `/api/warehouse/reports/aging?${params}`);
    },
  });

  if (isLoadingAging) {
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
          <Label>{t.aging.threshold}</Label>
          <Select value={daysThreshold} onValueChange={setDaysThreshold}>
            <SelectTrigger className="w-32 h-9" data-testid="select-threshold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="60">60</SelectItem>
              <SelectItem value="90">90</SelectItem>
              <SelectItem value="180">180</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetchAging()} data-testid="button-refresh-aging">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{agingData?.summary?.activePercent || 0}%</p>
                <p className="text-sm text-muted-foreground">{t.aging.activePercent} ({agingData?.summary?.activeCount || 0})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{agingData?.summary?.slowPercent || 0}%</p>
                <p className="text-sm text-muted-foreground">{t.aging.slowPercent} ({agingData?.summary?.slowCount || 0})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{agingData?.summary?.obsoletePercent || 0}%</p>
                <p className="text-sm text-muted-foreground">{t.aging.obsoletePercent} ({agingData?.summary?.obsoleteCount || 0})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.aging.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.aging.material}</TableHead>
                  <TableHead>{t.aging.lastMovement}</TableHead>
                  <TableHead className="text-right">{t.aging.days}</TableHead>
                  <TableHead className="text-right">{t.aging.stock}</TableHead>
                  <TableHead className="text-right">{t.aging.value}</TableHead>
                  <TableHead>{t.aging.category}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingData?.data?.map((item: AgingItem) => (
                  <TableRow key={item.materialId} data-testid={`row-aging-${item.materialId}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.lastMovementDate ? format(new Date(item.lastMovementDate), 'dd.MM.yyyy') : '-'}</TableCell>
                    <TableCell className="text-right">{item.daysWithoutMovement}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.currentStock)} {item.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)} {t.common.sum}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.category as keyof typeof STATUS_COLORS]}>
                        {t.aging[item.category as keyof typeof t.aging] || item.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!agingData?.data || agingData.data.length === 0) && (
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
